#!/usr/bin/env bash
# test_hardening.sh — Kiểm chứng bridge hardening (R1-040).
# Khởi động server trên cổng test, chạy các case, tắt server.
# Yêu cầu: node, curl, ffmpeg/ffprobe trên PATH.
set -u
cd "$(dirname "$0")"

PORT=18787
BASE="http://127.0.0.1:$PORT"
PASS=0; FAIL=0

ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ❌ $1 — $2"; }

echo "== [0] Khởi động bridge (port $PORT) =="
BRIDGE_PORT=$PORT node src/index.js > /tmp/bridge-test.log 2>&1 &
SRV=$!
sleep 2
if ! kill -0 $SRV 2>/dev/null; then echo "❌ server không khởi động được:"; cat /tmp/bridge-test.log; exit 1; fi
trap 'kill $SRV 2>/dev/null; wait $SRV 2>/dev/null; true' EXIT

echo "== [1] Health check mở rộng =="
H=$(curl -s "$BASE/api/health")
echo "$H" | grep -q '"ok":true' && ok "health ok=true" || fail "health ok" "$H"
echo "$H" | grep -q 'ffmpegVersion' && ok "có ffmpegVersion" || fail "ffmpegVersion" "$H"
echo "$H" | grep -q '"disk"' && ok "có disk info" || fail "disk info" "$H"
echo "$H" | grep -q '"uptimeSec"' && ok "có uptimeSec" || fail "uptimeSec" "$H"

echo "== [2] Spec JSON sai → 400 JSON =="
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/render" -F 'spec=không phải json{')
[ "$R" = "400" ] && ok "spec sai → 400" || fail "spec sai status" "$R"
R=$(curl -s -X POST "$BASE/api/render" -F 'spec=không phải json{' | head -c 200)
echo "$R" | grep -q '"error"' && ok "lỗi trả JSON" || fail "lỗi JSON" "$R"

echo "== [3] Thiếu field spec → 400 =="
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/render")
[ "$R" = "400" ] && ok "thiếu spec → 400" || fail "thiếu spec status" "$R"

echo "== [4] Spec quá lớn → 413 =="
# tạo spec ~11MB (> 10MB mặc định)
node -e 'const t={tracks:[]}; for(let i=0;i<200000;i++) t.tracks.push({id:"t"+i,clips:[]}); require("fs").writeFileSync("/tmp/bigspec.json", JSON.stringify(t));'
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/render" -F "spec=< /tmp/bigspec.json")
[ "$R" = "413" ] && ok "spec 11MB → 413" || fail "spec lớn status" "$R"

echo "== [5] Upload file loại lạ (.exe) → 400 =="
echo "fake" > /tmp/evil.exe
R=$(curl -s -X POST "$BASE/api/render" -F 'spec={"tracks":[]}' -F "media=@/tmp/evil.exe")
echo "$R" | grep -q '"error"' && ok "file .exe bị từ chối (JSON)" || fail ".exe" "$R"

echo "== [6] Upload file giả mạo (đuôi .mp4 nhưng nội dung text) → 400 =="
echo "đây không phải mp4" > /tmp/fake.mp4
R=$(curl -s -X POST "$BASE/api/render" -F 'spec={"tracks":[]}' -F "media=@/tmp/fake.mp4")
echo "$R" | grep -q '"error"' && ok "mp4 giả bị từ chối" || fail "mp4 giả" "$R"

echo "== [7] Path traversal trong tên file → 400 =="
printf '\x89PNG\r\n\x1a\n' > "/tmp/ok.png"
R=$(curl -s -X POST "$BASE/api/render" -F 'spec={"tracks":[]}' -F "media=@/tmp/ok.png;filename=../../evil.png")
echo "$R" | grep -q '"error"' && ok "traversal bị chặn" || fail "traversal" "$R"

echo "== [8] Job id sai định dạng → 400 =="
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/render/../../etc/passwd")
# curl normalize path; dùng id lạ trực tiếp
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/render/not-a-valid-id!!!")
[ "$R" = "400" ] && ok "job id lạ → 400" || fail "job id lạ status" "$R"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/render/aaaaaaaaaaaaaaaa")
[ "$R" = "404" ] && ok "job id đúng format nhưng không tồn tại → 404" || fail "job 404" "$R"

echo "== [9] API không tồn tại → 404 JSON =="
R=$(curl -s "$BASE/api/khong-co")
echo "$R" | grep -q '"error"' && ok "404 JSON" || fail "404 JSON" "$R"

echo "== [10] Rate limit render (20/phút) =="
# gửi 25 request sai spec nhanh → phải có ít nhất 1 lần 429
GOT429=0
for i in $(seq 1 25); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/render" -F 'spec=x')
  [ "$CODE" = "429" ] && GOT429=1
done
[ "$GOT429" = "1" ] && ok "burst 25 → có 429" || fail "rate limit" "không thấy 429"

echo "== [11] Security headers =="
H=$(curl -sI "$BASE/api/health")
echo "$H" | grep -qi "X-Content-Type-Options: nosniff" && ok "nosniff header" || fail "nosniff" "-"

echo ""
echo "== KẾT QUẢ: $PASS pass, $FAIL fail =="
[ "$FAIL" = "0" ]
