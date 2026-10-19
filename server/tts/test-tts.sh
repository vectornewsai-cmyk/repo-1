#!/usr/bin/env bash
# Test TTS local (R1-083, VieNeu-TTS v3 Turbo 0.5B): validate CLI + bridge.
# Model thật chỉ cần cho test E2E (chạy tay): python tts.py --text "..." --out x.wav
set -u
cd "$(dirname "$0")/../.." || exit 1
VENV="server/tts/.venv2"

PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ✗ $1 -- $2"; }

echo "== [1] tts.py --help =="
if $VENV/bin/python server/tts/tts.py --help >/dev/null 2>&1; then
  ok "tts.py --help chạy được"
else
  fail "tts.py --help" "xem stderr"
fi

echo "== [2] validate text (tts.py) =="
if $VENV/bin/python server/tts/tts.py --text "" --out /tmp/x.wav 2>&1 | grep -q "text rỗng"; then
  ok "từ chối text rỗng"
else
  fail "từ chối text rỗng" "không báo lỗi đúng"
fi
LONG=$(python3 -c "print('a'*2001)")
if $VENV/bin/python server/tts/tts.py --text "$LONG" --out /tmp/x.wav 2>&1 | grep -q "quá dài"; then
  ok "từ chối text > 2000 ký tự"
else
  fail "từ chối text dài" "không báo lỗi đúng"
fi

echo "== [3] watermark LUÔN tắt trong code =="
if grep -q "apply_watermark=False" server/tts/tts.py; then
  ok "tts.py gọi infer(apply_watermark=False)"
else
  fail "watermark" "không tìm thấy apply_watermark=False trong tts.py"
fi
if grep -q '"watermark": False' server/tts/tts.py; then
  ok "JSON kết quả báo watermark=false"
else
  fail "watermark json" "thiếu field watermark=false"
fi

echo "== [4] ép đúng bản 0.5B =="
if grep -q 'TTS_MODE = "v3turbo"' server/tts/tts.py && grep -q "pnnbao-ump/VieNeu-TTS-v3-Turbo" server/tts/tts.py; then
  ok "ép mode v3turbo (0.5B, Apache-2.0)"
else
  fail "ép bản 0.5B" "không tìm thấy TTS_MODE=v3turbo"
fi

echo "== [5] bridge tts.js validate =="
node -e "
const { validateText, validateVoice, ttsAvailable, TTS_VOICES, DEFAULT_VOICE } = require('./server/bridge/src/tts.js');
let ok = true;
try { validateText(''); ok = false; } catch (e) { if (!/rỗng/.test(e.message)) ok = false; }
try { validateText('x'.repeat(2001)); ok = false; } catch (e) { if (!/quá dài/.test(e.message)) ok = false; }
if (validateText('  Xin chào  ') !== 'Xin chào') ok = false;
try { validateVoice('nope'); ok = false; } catch (e) { if (!/không hỗ trợ/.test(e.message)) ok = false; }
if (validateVoice('Hải Đăng') !== 'Hải Đăng') ok = false;
if (validateVoice('') !== DEFAULT_VOICE) ok = false;
if (TTS_VOICES.length !== 25) ok = false;
if (DEFAULT_VOICE !== 'Hải Đăng') ok = false;
const av = ttsAvailable();
if (!av.available) ok = false;
if (!ok) { console.error('FAIL bridge validate'); process.exit(1); }
console.log('bridge validate OK');
" && ok "bridge validateText/validateVoice/ttsAvailable (25 giọng)" || fail "bridge validate" "xem log"

echo ""
echo "=========================================="
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 TTS UNIT PASS: $PASS assertions"
else
  echo "❌ TTS: $PASS pass, $FAIL FAIL"
fi
echo "=========================================="
exit $FAIL
