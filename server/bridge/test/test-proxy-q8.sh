#!/usr/bin/env bash
# test-proxy-q8.sh — Smoke test thật cho bridge /api/proxy (Phase 8 Q8).
# Khởi động bridge thật trên cổng test, POST file 1080p, kiểm tra proxy
# 720p trả về + stream lại được + chặn traversal + từ chối height lạ.
# Chạy: bash test/test-proxy-q8.sh (từ server/bridge).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d /tmp/vcut-q8-bridge-XXXXXX)"
PORT=8793
PASS=0; FAIL=0
ok() { if [ "$1" = "0" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); echo "  FAIL: $2"; fi; }

ffmpeg -y -v error -f lavfi -i testsrc2=size=1920x1080:rate=30:duration=5 \
  -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$WORK/src.mp4"

(BRIDGE_WORK_DIR="$WORK/wd" BRIDGE_PORT=$PORT node "$ROOT/src/index.js" > "$WORK/bridge.log" 2>&1 & echo $! > "$WORK/pid")
sleep 3

RESP=$(curl -s -F "file=@$WORK/src.mp4" -F "height=720" "http://127.0.0.1:$PORT/api/proxy")
echo "$RESP" | grep -q '"proxyWidth":1280' && echo "$RESP" | grep -q '"proxyHeight":720'
ok $? "POST /api/proxy tạo proxy 1280x720"

PROXY_NAME=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('proxy',''))")
CODE=$(curl -s -o "$WORK/dl.mp4" -w "%{http_code}" "http://127.0.0.1:$PORT/api/proxy/file/$PROXY_NAME")
[ "$CODE" = "200" ]
ok $? "GET proxy file trả 200"
DIMS=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$WORK/dl.mp4")
[ "$DIMS" = "1280,720" ]
ok $? "file proxy tải về đúng 1280x720 (nhận $DIMS)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/proxy/file/..%2F..%2Findex.js")
[ "$CODE" = "400" ]
ok $? "traversal bị chặn 400 (nhận $CODE)"

curl -s -F "file=@$WORK/src.mp4" -F "height=1080" "http://127.0.0.1:$PORT/api/proxy" | grep -q "height phải là 480 hoặc 720"
ok $? "height lạ bị từ chối"

kill "$(cat "$WORK/pid")" 2>/dev/null
echo ""
echo "== Q8 bridge proxy: $PASS pass, $FAIL fail (work: $WORK) =="
[ "$FAIL" = "0" ]
