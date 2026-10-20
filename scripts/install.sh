#!/usr/bin/env bash
# install.sh — Cài đặt VCut Studio từ gói release (R1-100).
#
# Cách dùng (chạy từ thư mục đã giải nén tarball):
#   bash scripts/install.sh                # hỏi có tải AI models không
#   bash scripts/install.sh --models        # tải luôn AI models (~4GB)
#   bash scripts/install.sh --no-models     # bỏ qua AI models
#   bash scripts/install.sh --assets        # tải cả assets lớn (LUT/PNG/OGG/font)
#   bash scripts/install.sh --no-assets     # bỏ qua assets lớn
#
# Việc install.sh làm:
#   1. Kiểm tra tiên quyết: node >= 20, ffmpeg (có libx264), python3 >= 3.10, pip, curl
#   2. npm ci cho root workspaces + mcp-server + cli
#   3. Tạo venv Python + pip install cho caption/tts/bgremove/reframe
#      (silence/scene chỉ dùng stdlib + ffmpeg, không cần cài)
#   4. Tải assets lớn qua các script fetch_* (tùy chọn, mặc định hỏi)
#   5. Tải AI models (tùy chọn, mặc định hỏi — nặng ~4GB)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WITH_MODELS="ask"
WITH_ASSETS="ask"
for arg in "$@"; do
  case "$arg" in
    --models) WITH_MODELS="yes" ;;
    --no-models) WITH_MODELS="no" ;;
    --assets) WITH_ASSETS="yes" ;;
    --no-assets) WITH_ASSETS="no" ;;
    -h|--help)
      sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "LỖI: flag không rõ: $arg (xem --help)" >&2; exit 1 ;;
  esac
done

ask() { # $1 = câu hỏi ; trả về 0 nếu đồng ý
  local ans
  read -r -p "$1 [y/N] " ans || true
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

fail() { echo "LỖI: $1" >&2; exit 1; }

# ------------------------------------------------------- 1. tiên quyết ---
echo "== 1/5 kiểm tra tiên quyết =="

command -v node >/dev/null 2>&1 || fail "chưa có Node.js. Cài Node.js >= 20: https://nodejs.org"
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node.js quá cũ (v$NODE_MAJOR), cần >= 20."
echo "  node: $(node --version) OK"

command -v npm >/dev/null 2>&1 || fail "chưa có npm (đi kèm Node.js)."
echo "  npm: $(npm --version) OK"

command -v ffmpeg >/dev/null 2>&1 || fail "chưa có ffmpeg. Ubuntu/Debian: sudo apt install ffmpeg"
# Lưu ý: dùng `ffmpeg -h encoder=...` thay vì `ffmpeg -encoders | grep -q`
# vì với `set -o pipefail`, grep -q thoát sớm khiến ffmpeg nhận SIGPIPE
# và pipeline báo lỗi giả.
ffmpeg -hide_banner -h encoder=libx264 >/dev/null 2>&1 \
  || fail "ffmpeg thiếu encoder libx264 (cần bản ffmpeg đầy đủ)."
echo "  ffmpeg: $(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}') + libx264 OK"

command -v python3 >/dev/null 2>&1 || fail "chưa có python3."
PY_MAJOR="$(python3 -c 'import sys; print(sys.version_info[0])')"
PY_MINOR="$(python3 -c 'import sys; print(sys.version_info[1])')"
[[ "$PY_MAJOR" -eq 3 && "$PY_MINOR" -ge 10 ]] || fail "cần Python >= 3.10 (đang: $PY_MAJOR.$PY_MINOR)."
echo "  python3: $(python3 --version 2>&1 | awk '{print $2}') OK"

python3 -m pip --version >/dev/null 2>&1 || fail "chưa có pip cho python3."
echo "  pip OK"

command -v curl >/dev/null 2>&1 || fail "chưa có curl."
command -v sha256sum >/dev/null 2>&1 || fail "chưa có sha256sum (gói coreutils)."

# ------------------------------------------------------- 2. node deps ---
echo "== 2/5 cài Node dependencies =="
echo "  npm ci (root workspaces: apps/web, packages/video-spec, server/bridge, server/render)..."
npm ci --no-audit --no-fund

echo "  npm ci (mcp-server)..."
(cd mcp-server && npm ci --no-audit --no-fund)

echo "  npm ci (cli)..."
(cd cli && npm ci --no-audit --no-fund)

# ------------------------------------------------------- 3. python venvs --
echo "== 3/5 môi trường Python (venv riêng từng module AI) =="
setup_venv() { # $1 = thư mục module (có requirements.txt)
  local mod="$1"
  [[ -f "$mod/requirements.txt" ]] || { echo "  $mod: không có requirements.txt, bỏ qua"; return 0; }
  if [[ -d "$mod/.venv" ]]; then
    echo "  $mod: venv đã có, bỏ qua (xoá $mod/.venv để cài lại)"
    return 0
  fi
  echo "  $mod: tạo venv + pip install..."
  python3 -m venv "$mod/.venv"
  "$mod/.venv/bin/pip" install --upgrade pip >/dev/null
  "$mod/.venv/bin/pip" install -r "$mod/requirements.txt"
}
setup_venv "server/caption"
setup_venv "server/tts"
setup_venv "server/bgremove"
setup_venv "server/reframe"
echo "  server/silence, server/scene: chỉ dùng stdlib + ffmpeg, không cần cài."

# ------------------------------------------------------- 4. assets lớn ----
echo "== 4/5 tài nguyên lớn (LUT .cube, sticker PNG, sound OGG, font) =="
echo "   Các file nhị phân không nằm trong gói release — tải lại bằng script"
echo "   (mỗi file đều được kiểm tra SHA-256, nguồn + giấy phép trong assets/SOURCES.md)."
DO_ASSETS="$WITH_ASSETS"
if [[ "$DO_ASSETS" == "ask" ]]; then
  if ask "Tải assets lớn ngay bây giờ?"; then DO_ASSETS="yes"; else DO_ASSETS="no"; fi
fi
if [[ "$DO_ASSETS" == "yes" ]]; then
  bash assets/fetch_large_assets.sh        # 10 LUT cartcut (MIT) + hướng dẫn OGG Kenney
  bash assets/filters/fetch_harvested_luts.sh  # 42 LUT harvest (MIT/CC-BY) — nếu có
  bash assets/stickers/fetch_stickers.sh   # 173 sticker PNG (CC-BY/Apache-2.0)
  bash assets/sounds/fetch_sounds.sh       # 936 SFX OGG (CC0)
  bash assets/fonts/fetch_fonts.sh         # 43 fonts (OFL, hỗ trợ tiếng Việt)
  echo "  Lưu ý: 12 file OGG Kenney (CC0) phải tải thủ công 2 phút — xem cuối"
  echo "  output của assets/fetch_large_assets.sh ở trên."
else
  echo "  Bỏ qua. Khi cần, chạy thủ công:"
  echo "    bash assets/fetch_large_assets.sh"
  echo "    bash assets/stickers/fetch_stickers.sh"
  echo "    bash assets/sounds/fetch_sounds.sh"
  echo "    bash assets/fonts/fetch_fonts.sh"
fi

# ------------------------------------------------------- 5. AI models ----
echo "== 5/5 AI models (tải 1 lần, dùng local mãi mãi) =="
echo "   - faster-whisper small: ~462MB (auto-caption + dịch)"
echo "   - VieNeu-TTS v3 Turbo: ~2.3GB (text-to-speech, Apache-2.0)"
echo "   - BiRefNet (rembg): ~880MB (xoá nền, MIT)"
echo "   Tổng ~3.5GB. caption.py tự tải khi chạy lần đầu nếu chưa có."
DO_MODELS="$WITH_MODELS"
if [[ "$DO_MODELS" == "ask" ]]; then
  if ask "Tải AI models ngay bây giờ (~3.5GB)?"; then DO_MODELS="yes"; else DO_MODELS="no"; fi
fi
if [[ "$DO_MODELS" == "yes" ]]; then
  echo "  [1/3] faster-whisper small..."
  python3 -c "
from faster_whisper import WhisperModel
import os
d = os.path.join('server', 'caption', 'models')
os.makedirs(d, exist_ok=True)
WhisperModel('small', device='cpu', compute_type='int8', download_root=d)
print('  faster-whisper small: OK')
" 2>&1 | tail -2 || echo "  faster-whisper: thử lại khi chạy caption lần đầu"

  echo "  [2/3] VieNeu-TTS v3 Turbo (Apache-2.0)..."
  (cd server/tts && .venv/bin/python fetch_model.py 2>&1 | tail -2) \
    || echo "  VieNeu-TTS: thử lại sau (chạy: cd server/tts && .venv/bin/python fetch_model.py)"

  echo "  [3/3] BiRefNet (MIT)..."
  # download_model.sh gọi `python3` — ép PATH để dùng python của venv.
  (cd server/bgremove && PATH="$PWD/.venv/bin:$PATH" bash download_model.sh 2>&1 | tail -2) \
    || echo "  BiRefNet: thử lại sau (chạy: cd server/bgremove && bash download_model.sh)"
else
  echo "  Bỏ qua. Khi cần, models sẽ tự tải ở lần chạy đầu tiên của từng tính năng,"
  echo "  hoặc tải trước bằng:"
  echo "    cd server/tts && .venv/bin/python fetch_model.py"
  echo "    cd server/bgremove && bash download_model.sh"
fi

echo
echo "================================================================"
echo " CÀI ĐẶT XONG. Khởi chạy:"
echo "   bash scripts/start.sh        # chạy bridge (8787) + web UI (5173)"
echo " Rồi mở trình duyệt: http://localhost:5173"
echo " Chi tiết: xem INSTALL.md"
echo "================================================================"
