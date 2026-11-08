#!/usr/bin/env bash
# test-luts-r5.sh — Smoke test thật cho bridge /api/luts/:id (Phase 9 R5).
# Khởi động bridge thật trên cổng test, kiểm tra: LUT có sẵn trả 200 +
# nội dung .cube hợp lệ, traversal bị chặn 400, id lạ trả 404.
# Chạy: bash test/test-luts-r5.sh (từ server/bridge).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d /tmp/vcut-r5-bridge-XXXXXX)"
PORT=8795
PASS=0; FAIL=0
ok() { if [ "$1" = "0" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); echo "  FAIL: $2"; fi; }

(BRIDGE_WORK_DIR="$WORK/wd" BRIDGE_PORT=$PORT BRIDGE_RATE_PERSIST_PATH="$WORK/rate-limit.json" node "$ROOT/src/index.js" > "$WORK/bridge.log" 2>&1 & echo $! > "$WORK/pid")
# Đợt 66 T9 — chờ bridge listen thật (thay sleep 3 cố định): dưới tải nặng
# node khởi động >3s (đo thật ~4,2s lúc load ~16) nên các check race-fail.
for _ in $(seq 1 60); do
  curl -sf --max-time 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done

curl -s "http://127.0.0.1:$PORT/api/luts/vcut-cinematic" > "$WORK/cube.txt"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/luts/vcut-cinematic")
[ "$CODE" = "200" ]
ok $? "GET /api/luts/vcut-cinematic trả 200 (nhận $CODE)"
grep -q "LUT_3D_SIZE 17" "$WORK/cube.txt"
ok $? "nội dung .cube có LUT_3D_SIZE 17"
grep -Eq "^[0-9.]+ [0-9.]+ [0-9.]+$" "$WORK/cube.txt"
ok $? "nội dung .cube có dòng dữ liệu RGB (3 số thực/dòng)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/luts/..%2F..%2Findex.js")
[ "$CODE" = "400" ]
ok $? "traversal bị chặn 400 (nhận $CODE)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/luts/no-such-lut")
[ "$CODE" = "404" ]
ok $? "id lạ trả 404 (nhận $CODE)"

kill "$(cat "$WORK/pid")" 2>/dev/null
echo ""
echo "== R5 bridge luts: $PASS pass, $FAIL fail (work: $WORK) =="
[ "$FAIL" = "0" ]
