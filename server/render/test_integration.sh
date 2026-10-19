#!/bin/bash
# test_integration.sh — Chạy FFmpeg integration tests local cho render worker.
# R1-004: tạo fixture media, chạy demo_*.js, verify output bằng ffprobe.
#
# Cách dùng:  bash server/render/test_integration.sh [--out-dir /tmp/itest]
# Yêu cầu: ffmpeg, ffprobe, node trong PATH.
set -uo pipefail

OUT="${2:-/tmp/itest}"
if [ "${1:-}" = "--out-dir" ] && [ -n "${2:-}" ]; then OUT="$2"; fi
RENDER_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$RENDER_DIR/../.." && pwd)"

PASS=0; FAIL=0
pass() { echo "✅ PASS $1"; PASS=$((PASS+1)); }
fail() { echo "❌ FAIL $1 — $2"; FAIL=$((FAIL+1)); }

echo "== 0. Kiểm tra công cụ =="
for t in ffmpeg ffprobe node; do
  command -v "$t" >/dev/null || { echo "❌ thiếu: $t"; exit 1; }
done
ffmpeg -version | head -1
echo

echo "== 1. Tạo fixture media =="
FIX="$OUT/fixtures"; mkdir -p "$FIX"
# Video testsrc 5s 640x360 30fps (có thể dùng làm input render)
ffmpeg -y -v error -f lavfi -i "testsrc2=size=640x360:duration=5:rate=30" \
  -c:v libx264 -pix_fmt yuv420p "$FIX/testsrc.mp4" \
  && pass "fixture video testsrc.mp4" || fail "fixture video" "ffmpeg lỗi"
# Audio sine 440Hz 5s stereo
ffmpeg -y -v error -f lavfi -i "sine=frequency=440:duration=5" \
  -c:a aac "$FIX/sine.m4a" \
  && pass "fixture audio sine.m4a" || fail "fixture audio" "ffmpeg lỗi"
# PNG có alpha (hình tròn đỏ trên nền trong suốt)
python3 -c "
from PIL import Image, ImageDraw
img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
ImageDraw.Draw(img).ellipse([28, 28, 228, 228], fill=(255, 0, 0, 255))
img.save('$FIX/circle.png')
" 2>/dev/null && pass "fixture PNG alpha circle.png" || fail "fixture PNG" "PIL lỗi"
echo

echo "== 2. Chuẩn bị LUT (nếu thiếu) =="
if [ ! -f "$REPO_ROOT/assets/filters/cartcut-mono-neutral.cube" ]; then
  echo "   Tải LUT qua assets/fetch_large_assets.sh ..."
  bash "$REPO_ROOT/assets/fetch_large_assets.sh" >/dev/null 2>&1 \
    && pass "tải LUT" || fail "tải LUT" "xem log fetch_large_assets.sh"
else
  pass "LUT đã có sẵn"
fi
echo

echo "== 3. Chạy demo scripts =="
run_demo() {
  local name="$1" expect_glob="$2" min_dur="$3"
  local d="$OUT/$name"
  echo "--- demo_$name ---"
  if ! node "$RENDER_DIR/demo_$name.js" --out-dir "$d" >/dev/null 2>&1; then
    fail "demo_$name" "exit != 0"; return
  fi
  local found=0
  for f in $d/$expect_glob; do
    [ -f "$f" ] || continue
    found=1
    local size vcodec dur
    size=$(stat -c%s "$f")
    vcodec=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$f")
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
    if [ "$size" -eq 0 ]; then fail "demo_$name" "$f rỗng"; return; fi
    if [ "$vcodec" != "h264" ]; then fail "demo_$name" "$f codec=$vcodec"; return; fi
    if ! awk "BEGIN{exit !($dur >= $min_dur)}"; then fail "demo_$name" "$f duration=$dur"; return; fi
  done
  if [ "$found" -eq 0 ]; then fail "demo_$name" "không tìm thấy output $expect_glob"; return; fi
  pass "demo_$name"
}

run_demo lut        "lut-*.mp4"        2.5
run_demo effects    "effect-*.mp4"     2.5
run_demo sticker    "sticker-demo.mp4" 2.5
run_demo chroma     "chroma-demo.mp4"  2.5
run_demo transitions "*.mp4"          1
run_demo textfx     "textfx-*.mp4"     1
echo

echo "== KẾT QUẢ: $PASS pass, $FAIL fail =="
[ "$FAIL" -eq 0 ]
