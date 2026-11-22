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

echo "== 4. Render-test pixelate (đợt 149: khóa lỗi scale đổi kích thước) =="
if node "$RENDER_DIR/test_pixelate_render.js" --out-dir "$OUT/pix-test" >/dev/null 2>&1; then
  pass "test_pixelate_render (20 case size x intensity + alpha)"
else
  fail "test_pixelate_render" "xem log: node server/render/test_pixelate_render.js"
fi
echo

echo "== 5. Probe V19 pixelate geq (đợt 151: nối vào suite theo quyết parent (j) đợt 150) =="
# Probe V19 khóa chuỗi filter pixelate THẬT (geq + alpha_expr bắt buộc) trên
# 34 assert: vị trí lấy mẫu floor(K/2), tier khớp theo luma, kích thước ra ==
# vào với mọi K và mọi W/H (36 case), khối hằng, alpha không về 0.
# Chạy độc lập từ đợt 19 tới đợt 150; từ đợt 151 nối vào suite — ĐẾM
# INTEGRATION ĐỔI 11 → 12 (xem docs/PHASE9_ROUND151_T0_V19_INTEGRATION_LIMITS.md).
# Log đầy đủ giữ lại trong $OUT để soi khi rớt (probe tự xoá /tmp riêng của nó).
# Lưu ý: probe exit 2 khi applyPixelate thiếu trong effectCanvas.ts — vẫn tính FAIL
# (khóa phải được bắt buộc chạy, không được lặng lẽ bỏ qua).
if node "$RENDER_DIR/src/test_v19_pixelate_probe.js" > "$OUT/v19-pixelate.log" 2>&1; then
  pass "test_v19_pixelate_probe (34 assert geq)"
else
  fail "test_v19_pixelate_probe" "xem log: $OUT/v19-pixelate.log"
fi
echo

echo "== KẾT QUẢ: $PASS pass, $FAIL fail =="
[ "$FAIL" -eq 0 ]
