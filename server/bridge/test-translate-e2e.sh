#!/usr/bin/env bash
# test-translate-e2e.sh — E2E POST /api/caption/translate (R1-080).
#
# Kịch bản: tạo wav test → start bridge với TRANSLATE_PY=stub (không cần model)
# → POST /api/caption/translate (multipart) → đọc NDJSON stream → kiểm tra
# phase + 5 segments tiếng Anh đúng nội dung.
# Cũng kiểm tra các case lỗi: thiếu file, lang nguồn sai, target sai, file ảnh.
#
# Cách dùng: bash test-translate-e2e.sh [--port 18792] [--keep]
# Yêu cầu: node, curl, ffmpeg, python3.
set -u

PORT=18792
KEEP=0
for a in "$@"; do
  case "$a" in
    --port) shift; PORT="${1:-18792}"; shift || true ;;
    --port=*) PORT="${a#--port=}" ;;
    --keep) KEEP=1 ;;
  esac
done

BRIDGE_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="http://127.0.0.1:${PORT}"
WORKDIR="$(mktemp -d /tmp/vcut-translate-e2e-XXXXXX)"
STUB="$BRIDGE_DIR/test/test-translate-stub.py"
CAPTION_STUB="$BRIDGE_DIR/test/test-caption-stub.py"

BRIDGE_PID=""
PASS=0
FAIL=0

log() { echo "$1"; }
ok()  { echo "   ✅ $1"; PASS=$((PASS+1)); }
bad() { echo "   ❌ $1"; FAIL=$((FAIL+1)); }

cleanup() {
  if [ -n "$BRIDGE_PID" ] && kill -0 "$BRIDGE_PID" 2>/dev/null; then
    kill "$BRIDGE_PID" 2>/dev/null || true
    wait "$BRIDGE_PID" 2>/dev/null || true
  fi
  if [ "$KEEP" -eq 0 ]; then rm -rf "$WORKDIR"; else log "   (giữ lại $WORKDIR do --keep)"; fi
}
trap cleanup EXIT

log "== [0] Chuẩn bị: tạo wav test 15s =="
ffmpeg -y -v error -f lavfi -i "sine=frequency=440:duration=15" -ac 1 -ar 16000 "$WORKDIR/test.wav" \
  || { bad "không tạo được wav test"; exit 1; }
# PNG 1x1 để test từ chối file ảnh
python3 -c "
import struct, zlib
def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
ihdr = struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)
raw = b'\x00\xff\x00\x00'
idat = zlib.compress(raw)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
open('$WORKDIR/test.png', 'wb').write(png)
"
chmod +x "$STUB"

log "== [1] Khởi động bridge (port $PORT, TRANSLATE_PY=stub) =="
cd "$BRIDGE_DIR"
TRANSLATE_PY="$STUB" CAPTION_PY="$CAPTION_STUB" BRIDGE_PORT="$PORT" BRIDGE_RATE_GENERAL=1000 BRIDGE_RATE_RENDER=1000 \
  node src/index.js > "$WORKDIR/bridge.log" 2>&1 &
BRIDGE_PID=$!
for i in $(seq 1 40); do
  if curl -s --max-time 2 "$BASE_URL/api/health" | grep -q '"ok":true'; then break; fi
  sleep 0.5
done
curl -s --max-time 2 "$BASE_URL/api/health" | grep -q '"ok":true' \
  && ok "bridge chạy" \
  || { bad "bridge không chạy"; tail -20 "$WORKDIR/bridge.log"; exit 1; }

log "== [2] /api/health có field translate =="
curl -s "$BASE_URL/api/health" | grep -q '"translate":{"available":true' \
  && ok "health báo translate.available=true (dùng stub)" \
  || bad "health thiếu field translate"

log "== [3] POST /api/caption/translate → NDJSON stream =="
curl -s --max-time 60 -X POST "$BASE_URL/api/caption/translate" \
  -F "media=@$WORKDIR/test.wav" -F "lang=vi" -F "target=en" \
  -o "$WORKDIR/stream.ndjson"
[ -s "$WORKDIR/stream.ndjson" ] && ok "nhận được NDJSON stream" || bad "stream rỗng"

log "== [4] Kiểm tra phase events =="
grep -q '"type":"phase","phase":"upload"' "$WORKDIR/stream.ndjson" \
  && ok "có phase upload" || bad "thiếu phase upload"
grep -q '"phase":"extract"' "$WORKDIR/stream.ndjson" \
  && ok "có phase extract (từ stdout stub)" || bad "thiếu phase extract"
grep -q '"phase":"translating"' "$WORKDIR/stream.ndjson" \
  && ok "có phase translating" || bad "thiếu phase translating"
grep -q '"phase":"group"' "$WORKDIR/stream.ndjson" \
  && ok "có phase group" || bad "thiếu phase group"

log "== [5] Kiểm tra done event + 5 câu tiếng Anh =="
DONE_LINE="$(grep '"type":"done"' "$WORKDIR/stream.ndjson" | tail -1)"
[ -n "$DONE_LINE" ] && ok "có event done" || bad "thiếu event done"
echo "$DONE_LINE" | python3 -c "
import json, sys
evt = json.load(sys.stdin)
segs = evt['segments']
assert evt['count'] == 5, f\"count={evt['count']}\"
assert len(segs) == 5, f\"segments={len(segs)}\"
assert segs[0]['text'] == 'Hello everyone', segs[0]
assert segs[0]['start'] == 0.5 and segs[0]['end'] == 2.3, segs[0]
assert segs[4]['text'] == 'Goodbye', segs[4]
assert evt['sourceLanguage'] == 'vi', evt['sourceLanguage']
assert evt['targetLanguage'] == 'en', evt['targetLanguage']
print('segments OK')
" && ok "5 segments tiếng Anh đúng nội dung/thời gian" || bad "segments sai"

log "== [6] Case lỗi =="
CODE="$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE_URL/api/caption/translate" -F "lang=vi")"
[ "$CODE" = "400" ] && ok "thiếu file → 400" || bad "thiếu file → $CODE (muốn 400)"
curl -s --max-time 10 -X POST "$BASE_URL/api/caption/translate" -F "media=@$WORKDIR/test.wav" -F "lang=xx" \
  | grep -q "không hỗ trợ" && ok "lang nguồn sai → 400 + message rõ" || bad "lang nguồn sai không báo đúng"
curl -s --max-time 10 -X POST "$BASE_URL/api/caption/translate" -F "media=@$WORKDIR/test.wav" -F "lang=vi" -F "target=vi" \
  | grep -q "chưa hỗ trợ" && ok "target=vi → 400 + message rõ (chỉ en)" || bad "target sai không báo đúng"
CODE="$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE_URL/api/caption/translate" \
  -F "media=@$WORKDIR/test.png" -F "lang=vi")"
[ "$CODE" = "400" ] && ok "file ảnh → 400" || bad "file ảnh → $CODE (muốn 400)"

log "== [7] Stub fail → event error trong stream =="
kill "$BRIDGE_PID" 2>/dev/null || true
wait "$BRIDGE_PID" 2>/dev/null || true
TRANSLATE_PY="$STUB" TRANSLATE_STUB_FAIL=1 CAPTION_PY="$CAPTION_STUB" BRIDGE_PORT="$PORT" BRIDGE_RATE_GENERAL=1000 BRIDGE_RATE_RENDER=1000 \
  node src/index.js > "$WORKDIR/bridge-fail.log" 2>&1 &
BRIDGE_PID=$!
for i in $(seq 1 40); do
  if curl -s --max-time 2 "$BASE_URL/api/health" | grep -q '"ok":true'; then break; fi
  sleep 0.5
done
curl -s --max-time 60 -X POST "$BASE_URL/api/caption/translate" \
  -F "media=@$WORKDIR/test.wav" -F "lang=vi" \
  -o "$WORKDIR/stream-fail.ndjson"
grep -q '"type":"error"' "$WORKDIR/stream-fail.ndjson" \
  && ok "stub fail → event error trong stream" \
  || bad "stub fail không trả event error"
grep -q '"type":"done"' "$WORKDIR/stream-fail.ndjson" \
  && bad "case fail: vẫn có event done" \
  || ok "case fail: không có event done"

log ""
log "=========================================="
if [ "$FAIL" -eq 0 ]; then log "🎉 TRANSLATE E2E PASS: $PASS assertions"; else log "❌ TRANSLATE E2E: $PASS pass, $FAIL fail"; fi
log "=========================================="
[ "$FAIL" -eq 0 ]
