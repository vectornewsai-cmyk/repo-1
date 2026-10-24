#!/bin/bash
# test-p7-bridge-restart.sh — Test THẬT Phase 7 P7: kill -9 bridge, khởi động lại,
# kiểm tra queue khôi phục đúng trạng thái (không mất job, không giả vờ chạy tiếp).
#
# Kịch bản:
#  1. Bridge thật (BRIDGE_MAX_JOBS=1) + 2 job: job1 render 60s (đang chạy),
#     job2 render 2s (đang xếp hàng).
#  2. kill -9 bridge (mô phỏng crash), giết luôn worker/ffmpeg mồ côi.
#  3. Khởi động lại bridge trên cùng BRIDGE_WORK_DIR.
#  4. Khẳng định: job1 = "interrupted" (lỗi nêu rõ do restart, spec còn nguyên,
#     download partial → 409), job2 không mất (queued/running/done),
#     job2 cuối cùng render xong (done), retry job1 → chạy lại được.
#  5. job.json trên đĩa phản ánh đúng trạng thái sau restart.
#
# Chạy: bash test/test-p7-bridge-restart.sh (từ server/bridge/)
set -u
PORT=18799
WORK="$HOME/workspace/.tmp-p7-bridge-restart"
BRIDGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
pass=0; fail=0
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  ✓ $2"; else fail=$((fail+1)); echo "  ✗ FAIL: $2"; fi; }
status_of() { curl -s "http://127.0.0.1:$PORT/api/render/$1" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).status)}catch{console.log('BADJSON')}})"; }
BRIDGE_PID=""
cleanup() {
  [ -n "$BRIDGE_PID" ] && kill "$BRIDGE_PID" 2>/dev/null
  sleep 1
  [ -n "$BRIDGE_PID" ] && kill -9 "$BRIDGE_PID" 2>/dev/null
  pkill -9 -f "$WORK" 2>/dev/null
  rm -rf "$WORK"
}
trap cleanup EXIT
rm -rf "$WORK"; mkdir -p "$WORK"

echo "== Tạo media thật =="
ffmpeg -v error -f lavfi -i color=c=blue:s=320x180:r=15:d=60 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -an -y "$WORK/long.mp4" || exit 2
ffmpeg -v error -f lavfi -i color=c=red:s=320x180:r=15:d=2 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -an -y "$WORK/tiny.mp4" || exit 2
cat > "$WORK/spec-long.json" <<'EOF'
{ "version": "0.2.0", "meta": { "name": "p7-long", "width": 320, "height": 180, "fps": 15, "duration": 60 },
  "tracks": [ { "kind": "video", "id": "v1", "clips": [
    { "kind": "video", "id": "c1", "src": "long.mp4", "start": 0, "duration": 60, "in": 0, "out": 60, "sourceAudioMode": "mute" } ] } ] }
EOF
cat > "$WORK/spec-tiny.json" <<'EOF'
{ "version": "0.2.0", "meta": { "name": "p7-tiny", "width": 320, "height": 180, "fps": 15, "duration": 2 },
  "tracks": [ { "kind": "video", "id": "v1", "clips": [
    { "kind": "video", "id": "c1", "src": "tiny.mp4", "start": 0, "duration": 2, "in": 0, "out": 2, "sourceAudioMode": "mute" } ] } ] }
EOF

start_bridge() {
  BRIDGE_PORT=$PORT BRIDGE_MAX_JOBS=1 BRIDGE_WORK_DIR="$WORK/jobs" \
    node "$BRIDGE_DIR/src/index.js" > "$WORK/bridge-$1.log" 2>&1 &
  BRIDGE_PID=$!
  for _ in $(seq 1 30); do
    curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && return 0
    sleep 0.5
  done
  echo "❌ bridge không khởi động được:"; cat "$WORK/bridge-$1.log"; exit 1
}

echo "== Khởi động bridge lần 1, submit 2 job =="
start_bridge 1
R1=$(curl -s -X POST "http://127.0.0.1:$PORT/api/render" -F "spec=$(cat "$WORK/spec-long.json")" -F "media=@$WORK/long.mp4;filename=long.mp4")
R2=$(curl -s -X POST "http://127.0.0.1:$PORT/api/render" -F "spec=$(cat "$WORK/spec-tiny.json")" -F "media=@$WORK/tiny.mp4;filename=tiny.mp4")
ID1=$(echo "$R1" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).jobId))")
ID2=$(echo "$R2" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).jobId))")
[ -n "$ID1" ] && [ -n "$ID2" ]; ok $? "submit được 2 job ($ID1, $ID2)"
# Chờ job1 vào running (poll tối đa 20s), job2 phải đang queued.
S1=""; for _ in $(seq 1 40); do S1=$(status_of "$ID1"); [ "$S1" = "running" ] && break; sleep 0.5; done
[ "$S1" = "running" ]; ok $? "job1 đang running trước khi kill (status=$S1)"
S2=$(status_of "$ID2"); [ "$S2" = "queued" ]; ok $? "job2 đang queued (maxJobs=1, status=$S2)"

echo "== kill -9 bridge (crash thật) + dọn worker mồ côi =="
kill -9 "$BRIDGE_PID" 2>/dev/null; wait "$BRIDGE_PID" 2>/dev/null; BRIDGE_PID=""
pkill -9 -f "$WORK" 2>/dev/null; sleep 1
[ -f "$WORK/jobs/$ID1/job.json" ]; ok $? "job1 có job.json trên đĩa trước restart"
grep -q '"running"' "$WORK/jobs/$ID1/job.json"; ok $? "job.json job1 ghi running (điểm crash)"

echo "== Khởi động lại bridge trên cùng work dir =="
start_bridge 2
sleep 1
S1=$(status_of "$ID1"); [ "$S1" = "interrupted" ]; ok $? "job1 sau restart = interrupted (status=$S1)"
curl -s "http://127.0.0.1:$PORT/api/render/$ID1" | grep -qi "restart"; ok $? "lỗi job1 nêu rõ do restart"
[ -f "$WORK/jobs/$ID1/spec.json" ]; ok $? "spec.json job1 còn nguyên (retry được)"
[ ! -f "$WORK/jobs/$ID1/output.mp4" ]; ok $? "output dở dang của job1 đã bị xóa"
grep -q '"interrupted"' "$WORK/jobs/$ID1/job.json"; ok $? "job.json trên đĩa đã ghi interrupted"
HTTP_DL=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/render/$ID1/download")
[ "$HTTP_DL" = "409" ]; ok $? "download job interrupted → 409 (không phục vụ output dở dang)"
S2=$(status_of "$ID2"); case "$S2" in queued|running|done) ok 0 "job2 không mất sau restart (status=$S2)";; *) ok 1 "job2 không mất sau restart (status=$S2)";; esac

echo "== Job2 khôi phục xong + retry job1 =="
for _ in $(seq 1 120); do S2=$(status_of "$ID2"); [ "$S2" = "done" ] && break; sleep 1; done
[ "$S2" = "done" ]; ok $? "job2 (queued cũ) render xong sau restart (status=$S2)"
curl -s -X POST "http://127.0.0.1:$PORT/api/render/$ID1/retry" >/dev/null
S1=$(status_of "$ID1"); case "$S1" in queued|running) ok 0 "retry job interrupted → $S1";; *) ok 1 "retry job interrupted → $S1";; esac

echo ""
echo "== KẾT QUẢ: $pass pass, $fail fail =="
[ "$fail" = 0 ]
