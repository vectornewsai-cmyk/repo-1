#!/usr/bin/env bash
# test-cors.sh — Kiểm chứng CORS chỉ cho origin loopback (sửa SECURITY.md §3.1).
# Khởi động bridge trên cổng test, gọi /api/health với nhiều Origin khác nhau:
#   - Origin loopback (web UI dev/preview) → phải có Access-Control-Allow-Origin
#   - Origin lạ (evil.com, localhost.evil.com) → KHÔNG được có ACAO
#   - Không Origin (curl/MCP/CLI) → vẫn 200 bình thường
# Yêu cầu: node, curl trên PATH.
set -u
cd "$(dirname "$0")/.."

PORT=18799
BASE="http://127.0.0.1:$PORT"
PASS=0; FAIL=0

ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ❌ $1 — $2"; }

echo "== [0] Khởi động bridge (port $PORT) =="
BRIDGE_PORT=$PORT BRIDGE_WORK_DIR="${TMPDIR:-/tmp}/vcut-bridge-cors-test" node src/index.js > /tmp/bridge-cors-test.log 2>&1 &
SRV=$!
sleep 2
if ! kill -0 $SRV 2>/dev/null; then echo "❌ server không khởi động được:"; cat /tmp/bridge-cors-test.log; exit 1; fi
trap 'kill $SRV 2>/dev/null; wait $SRV 2>/dev/null; true' EXIT

# headers <url> [origin] → in ra header của response /api/health
hdrs() {
  if [ -n "${2:-}" ]; then curl -s -D - -o /dev/null -H "Origin: $2" "$1";
  else curl -s -D - -o /dev/null "$1"; fi
}
has_acao() { grep -qi '^access-control-allow-origin:'; }

echo "== [1] Origin localhost:5173 (web UI dev) =="
H=$(hdrs "$BASE/api/health" "http://localhost:5173")
echo "$H" | grep -q '200' && ok "status 200" || fail "status" "$H"
echo "$H" | has_acao && ok "có ACAO" || fail "ACAO" "thiếu header"
echo "$H" | grep -qi 'access-control-allow-origin: http://localhost:5173' && ok "ACAO khớp origin" || fail "ACAO value" "$H"

echo "== [2] Origin 127.0.0.1:4173 (vite preview) =="
H=$(hdrs "$BASE/api/health" "http://127.0.0.1:4173")
echo "$H" | has_acao && ok "có ACAO" || fail "ACAO" "thiếu header"

echo "== [3] Origin lạ https://evil.com =="
H=$(hdrs "$BASE/api/health" "https://evil.com")
echo "$H" | has_acao && fail "ACAO" "origin lạ vẫn được cấp ACAO!" || ok "không có ACAO (browser sẽ chặn đọc)"

echo "== [4] Origin giả mạo http://localhost.evil.com =="
H=$(hdrs "$BASE/api/health" "http://localhost.evil.com")
echo "$H" | has_acao && fail "ACAO" "subdomain giả mạo qua được!" || ok "không có ACAO"

echo "== [5] Không có Origin header (curl/MCP/CLI) =="
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
[ "$CODE" = "200" ] && ok "status 200" || fail "status" "$CODE"
BODY=$(curl -s "$BASE/api/health")
echo "$BODY" | grep -q '"ok":true' && ok "body ok=true" || fail "body" "$BODY"

echo "== [6] Preflight OPTIONS =="
H=$(curl -s -D - -o /dev/null -X OPTIONS -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" "$BASE/api/render")
echo "$H" | has_acao && ok "preflight local: có ACAO" || fail "preflight local" "thiếu ACAO"
H=$(curl -s -D - -o /dev/null -X OPTIONS -H "Origin: https://evil.com" -H "Access-Control-Request-Method: POST" "$BASE/api/render")
echo "$H" | has_acao && fail "preflight lạ" "vẫn cấp ACAO!" || ok "preflight lạ: không ACAO"

echo ""
echo "KẾT QUẢ: $PASS pass, $FAIL fail"
[ "$FAIL" = "0" ]
