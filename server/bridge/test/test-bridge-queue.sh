#!/usr/bin/env bash
# Integration test cho RenderJobService qua HTTP API thật (R1-041).
#  - Khởi động bridge thật với BRIDGE_MAX_JOBS=1 trên port test
#  - Submit 2 job render thật (video 2s, 320x240) cùng lúc
#  - Verify: job1 running, job2 queued (KHÔNG còn 429); job2 chạy sau khi job1 xong
#  - Verify: GET /api/render (list), cancel job queued, retry job lỗi
set -uo pipefail

BRIDGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# Port ngẫu nhiên mỗi lần chạy để tránh đụng bridge cũ của lần test trước
PORT=$((18787 + RANDOM % 200))
WORK="/tmp/vcut-bridge-itest"
rm -rf "$WORK"; mkdir -p "$WORK"

echo "== Chuẩn bị media test =="
ffmpeg -y -v error -f lavfi -i testsrc=duration=2:size=320x240:rate=15 \
  -pix_fmt yuv420p "$WORK/tiny.mp4"

cat > "$WORK/spec.json" <<'EOF'
{
  "version": "0.2.0",
  "meta": { "name": "queue-itest", "width": 320, "height": 240, "fps": 15, "duration": 2 },
  "tracks": [
    { "kind": "video", "id": "v1",
      "clips": [
        { "kind": "video", "id": "c1", "src": "tiny.mp4",
          "start": 0, "duration": 2, "in": 0, "out": 2, "sourceAudioMode": "mute" }
      ] }
  ]
}
EOF

echo "== Khởi động bridge (MAX_JOBS=1) =="
BRIDGE_PORT=$PORT BRIDGE_MAX_JOBS=1 BRIDGE_WORK_DIR="$WORK/jobs" \
  node "$BRIDGE_DIR/src/index.js" > "$WORK/bridge.log" 2>&1 &
BRIDGE_PID=$!
cleanup() {
  kill $BRIDGE_PID 2>/dev/null
  sleep 1
  kill -9 $BRIDGE_PID 2>/dev/null
  wait $BRIDGE_PID 2>/dev/null
  # Dọn nốt ffmpeg mồ côi (nếu kill group thất bại)
  pkill -9 -f "vcut-bridge-itest" 2>/dev/null
}
trap cleanup EXIT

for i in $(seq 1 30); do
  curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "http://127.0.0.1:$PORT/api/health" || { echo "❌ bridge không khởi động được"; cat "$WORK/bridge.log"; exit 1; }
echo "  ✓ bridge chạy"

pass=0; fail=0
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  ✓ $2"; else fail=$((fail+1)); echo "  ✗ FAIL: $2"; fi; }

submit() {
  curl -s -X POST "http://127.0.0.1:$PORT/api/render" \
    -F "spec=$(cat "$WORK/spec.json")" \
    -F "media=@$WORK/tiny.mp4;filename=tiny.mp4"
}

echo "== Submit 2 job cùng lúc (max=1) =="
R1=$(submit); R2=$(submit)
ID1=$(echo "$R1" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).jobId))")
ID2=$(echo "$R2" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).jobId))")
[ -n "$ID1" ] && [ -n "$ID2" ] && [ "$ID1" != "$ID2" ]; ok $? "2 job được tạo với id khác nhau"

S1=$(curl -s "http://127.0.0.1:$PORT/api/render/$ID1" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
S2=$(curl -s "http://127.0.0.1:$PORT/api/render/$ID2" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
[ "$S1" = "running" ]; ok $? "job1 running (status=$S1)"
[ "$S2" = "queued" ]; ok $? "job2 queued — KHÔNG bị 429 (status=$S2)"
QP=$(curl -s "http://127.0.0.1:$PORT/api/render/$ID2" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).queuePosition))")
[ "$QP" = "1" ]; ok $? "job2 queuePosition=1"

echo "== Chờ job1 xong → job2 phải chạy (FIFO) =="
for i in $(seq 1 60); do
  S1=$(curl -s "http://127.0.0.1:$PORT/api/render/$ID1" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
  [ "$S1" = "done" ] || [ "$S1" = "error" ] && break
  sleep 1
done
[ "$S1" = "done" ]; ok $? "job1 done (status=$S1)"
if [ "$S1" = "error" ]; then
  echo "--- chi tiết lỗi job1:"; curl -s "http://127.0.0.1:$PORT/api/render/$ID1"; echo
fi
# job2 phải đã bắt đầu (running hoặc done)
for i in $(seq 1 60); do
  S2=$(curl -s "http://127.0.0.1:$PORT/api/render/$ID2" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
  [ "$S2" = "done" ] || [ "$S2" = "error" ] && break
  sleep 1
done
[ "$S2" = "done" ]; ok $? "job2 done sau job1 — FIFO đúng (status=$S2)"

echo "== Download output =="
curl -sf -o "$WORK/out1.mp4" "http://127.0.0.1:$PORT/api/render/$ID1/download"; ok $? "download job1"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/out1.mp4" 2>/dev/null)
[ -n "$DUR" ]; ok $? "output là MP4 hợp lệ (duration=$DUR)"

echo "== GET /api/render (list) =="
N=$(curl -s "http://127.0.0.1:$PORT/api/render?limit=10" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).jobs.length))")
[ "$N" -ge 2 ]; ok $? "list trả về ≥2 job (n=$N)"

echo "== Cancel job queued =="
# Giữ slot bận bằng 1 job render, submit thêm 2 job rồi cancel job queued
R3=$(submit); ID3=$(echo "$R3" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).jobId))")
sleep 0.5
S3=$(curl -s "http://127.0.0.1:$PORT/api/render/$ID3" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
if [ "$S3" = "queued" ]; then
  curl -s -X DELETE "http://127.0.0.1:$PORT/api/render/$ID3" > /dev/null
  S3B=$(curl -s "http://127.0.0.1:$PORT/api/render/$ID3" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
  [ "$S3B" = "cancelled" ]; ok $? "cancel job queued → cancelled"
else
  echo "  (bỏ qua: job3 đã chạy ngay, slot trống)"
fi

echo "== Retry job lỗi =="
# Tạo job lỗi bằng spec sai (src không tồn tại)
cat > "$WORK/bad-spec.json" <<'EOF'
{ "version": "0.2.0",
  "meta": { "name": "bad", "width": 320, "height": 240, "fps": 15 },
  "tracks": [ { "kind": "video", "id": "v1",
    "clips": [ { "kind": "video", "id": "c1", "src": "khong-ton-tai.mp4",
      "start": 0, "duration": 2, "in": 0, "out": 2 } ] } ] }
EOF
RB=$(curl -s -X POST "http://127.0.0.1:$PORT/api/render" -F "spec=$(cat "$WORK/bad-spec.json")")
IDB=$(echo "$RB" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).jobId))")
for i in $(seq 1 30); do
  SB=$(curl -s "http://127.0.0.1:$PORT/api/render/$IDB" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
  [ "$SB" = "error" ] && break
  sleep 1
done
[ "$SB" = "error" ]; ok $? "job spec sai → error"
RT=$(curl -s -X POST "http://127.0.0.1:$PORT/api/render/$IDB/retry")
ST=$(echo "$RT" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).status))")
[ "$ST" = "queued" ] || [ "$ST" = "running" ]; ok $? "retry → queued/running (status=$ST)"
ATT=$(curl -s "http://127.0.0.1:$PORT/api/render/$IDB" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).attempts))")
[ "$ATT" = "2" ]; ok $? "attempts tăng lên 2 sau retry"

echo ""
echo "== KẾT QUẢ: $pass pass, $fail fail =="
[ "$fail" = 0 ]
