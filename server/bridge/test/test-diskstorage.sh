#!/bin/bash
# K4 (Phase 6): kiểm chứng diskStorage — upload ghi ra đĩa, không phình RAM,
# file tạm được dọn, cap tổng hoạt động.
# Chạy: bash server/bridge/test/test-diskstorage.sh
set -u
cd "$(dirname "$0")/.."
PORT=18797
WORK=~/workspace/.tmp-k4-bridge
rm -rf "$WORK"; mkdir -p "$WORK"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  PASS: $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }

# Tạo media mẫu: MP4 1s thật bằng ffmpeg (có sẵn)
ffmpeg -v error -f lavfi -i testsrc2=duration=1:size=320x180:rate=10 -c:v libx264 -pix_fmt yuv420p "$WORK/sample.mp4"
[ -s "$WORK/sample.mp4" ] || { echo "không tạo được sample.mp4"; exit 1; }

BRIDGE_WORK_DIR="$WORK/jobs" BRIDGE_MAX_TOTAL_UPLOAD=104857600 BRIDGE_PORT=$PORT node src/index.js >/tmp/k4-bridge.log 2>&1 &
BPID=$!
trap 'kill $BPID 2>/dev/null; rm -rf "$WORK"' EXIT
for i in $(seq 1 30); do curl -s "http://127.0.0.1:$PORT/api/health" | grep -q '"ok":true' && break; sleep 1; done
curl -s "http://127.0.0.1:$PORT/api/health" | grep -q '"ok":true' || { echo "bridge không khởi động"; cat /tmp/k4-bridge.log | tail -20; exit 1; }

SPEC='{"meta":{"width":320,"height":180,"fps":10},"tracks":[{"id":"v1","kind":"video","clips":[{"id":"c1","kind":"video","src":"sample.mp4","start":0,"in":0,"out":1,"duration":1}]}]}'

# 1. Upload render qua diskStorage → job tạo, file media nằm trong job dir
RESP=$(curl -s -F "spec=$SPEC" -F "media=@$WORK/sample.mp4;filename=sample.mp4" "http://127.0.0.1:$PORT/api/render")
echo "$RESP" | grep -q '"jobId"' && ok "render job tạo được" || bad "render job không tạo: $RESP"
JOBID=$(echo "$RESP" | sed -n 's/.*"jobId":"\([0-9a-f]*\)".*/\1/p' | head -1)
sleep 2
[ -n "$JOBID" ] && [ -f "$WORK/jobs/$JOBID/media/sample.mp4" ] && ok "media nằm trong job dir (rename từ tmp)" || bad "media không có trong job dir (JOBID=$JOBID)"
# file tạm phải sạch sau response
TMPLEFT=$(find "$WORK/jobs/uploads-tmp" -type f 2>/dev/null | wc -l)
[ "$TMPLEFT" = "0" ] && ok "không còn file tạm multer sau render" || bad "còn $TMPLEFT file tạm"

# 2. File giả mạo (đuôi mp4 nhưng nội dung text) → 400 + dọn tmp
echo "hello fake" > "$WORK/fake.mp4"
RESP2=$(curl -s -F "spec=$SPEC" -F "media=@$WORK/fake.mp4;filename=fake.mp4" "http://127.0.0.1:$PORT/api/render")
echo "$RESP2" | grep -qE "không khớp định dạng|quá nhỏ hoặc rỗng" && ok "file giả bị từ chối" || bad "file giả không bị chặn: $RESP2"
TMPLEFT2=$(find "$WORK/jobs/uploads-tmp" -type f 2>/dev/null | wc -l)
[ "$TMPLEFT2" = "0" ] && ok "tmp sạch sau request lỗi" || bad "còn $TMPLEFT2 file tạm sau lỗi"

# 3. Cap tổng: restart bridge với cap 100KB, upload sample (~vài chục KB? kiểm tra) + 2 file lớn hơn cap
kill $BPID 2>/dev/null; sleep 1
BRIDGE_WORK_DIR="$WORK/jobs2" BRIDGE_MAX_TOTAL_UPLOAD=102400 BRIDGE_PORT=$PORT node src/index.js >/tmp/k4-bridge2.log 2>&1 &
BPID=$!
for i in $(seq 1 30); do curl -s "http://127.0.0.1:$PORT/api/health" | grep -q '"ok":true' && break; sleep 1; done
SZ=$(stat -c%s "$WORK/sample.mp4")
if [ "$SZ" -gt 102400 ]; then
  RESP3=$(curl -s -F "spec=$SPEC" -F "media=@$WORK/sample.mp4;filename=sample.mp4" "http://127.0.0.1:$PORT/api/render")
  echo "$RESP3" | grep -q "vượt quá giới hạn" && ok "cap tổng chặn upload vượt cap ($SZ bytes)" || bad "cap tổng không chặn: $RESP3"
else
  # sample nhỏ hơn cap → upload đủ file để tổng vượt cap
  N=$((102400 / SZ + 2))
  ARGS=()
  for i in $(seq 1 $N); do ARGS+=(-F "media=@$WORK/sample.mp4;filename=f$i.mp4"); done
  RESP3=$(curl -s -F "spec=$SPEC" "${ARGS[@]}" "http://127.0.0.1:$PORT/api/render")
  echo "$RESP3" | grep -q "vượt quá giới hạn" && ok "cap tổng chặn $N file vượt cap" || bad "cap tổng không chặn $N file: $RESP3"
fi
TMPLEFT3=$(find "$WORK/jobs2/uploads-tmp" -type f 2>/dev/null | wc -l)
[ "$TMPLEFT3" = "0" ] && ok "tmp sạch sau khi bị cap tổng chặn" || bad "còn $TMPLEFT3 file tạm sau cap"

kill $BPID 2>/dev/null
echo "== KẾT QUẢ: $PASS pass, $FAIL fail =="
[ "$FAIL" = "0" ]
