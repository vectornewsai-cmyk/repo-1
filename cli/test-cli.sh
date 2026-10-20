#!/bin/bash
# test-cli.sh — Integration test cho vcut CLI.
# Chạy từng lệnh với project mẫu, kiểm tra output.
set -e

VCUT="node /home/hatch/workspace/repo-1/cli/dist/cli/src/index.js"
WORK=$(mktemp -d)
trap "rm -rf $WORK" EXIT

cd "$WORK"
PASS=0
FAIL=0

ok() { PASS=$((PASS+1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

assert_ok() {
  local desc="$1"; shift
  if out=$("$@" 2>&1); then
    if echo "$out" | grep -q '"ok": true'; then ok "$desc";
    else fail "$desc (thiếu ok:true): $out" | head -3; fi
  else
    fail "$desc (exit != 0): $out" | head -3
  fi
}

assert_fail() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then fail "$desc (đáng lẽ phải lỗi)";
  else ok "$desc (báo lỗi đúng)"; fi
}

echo "=== vcut CLI test ==="

# 1. create
assert_ok "create project" $VCUT create --name "CLI Test" --width 1280 --height 720 --out test.json
assert_fail "create thiếu --name" $VCUT create --width 1280

# 2. add-text
TEXT_OUT=$($VCUT add-text --project test.json --text "Hello CLI" --start 0 --duration 2)
echo "$TEXT_OUT" | grep -q '"ok": true' && ok "add-text" || fail "add-text"
TEXT_ID=$(echo "$TEXT_OUT" | python3 -c "import json,sys; print(json.load(sys.stdin)['clip_id'])")

# 3. add-clip (video) — tạo video mẫu
ffmpeg -y -v warning -f lavfi -i "testsrc=duration=3:size=320x240:rate=30" -pix_fmt yuv420p sample.mp4 2>/dev/null
CLIP1_OUT=$($VCUT add-clip --project test.json --src sample.mp4 --start 0 --duration 3)
CLIP1_ID=$(echo "$CLIP1_OUT" | python3 -c "import json,sys; print(json.load(sys.stdin)['clip_id'])")
echo "$CLIP1_OUT" | grep -q '"ok": true' && ok "add-clip video 1" || fail "add-clip video 1"
CLIP_OUT=$($VCUT add-clip --project test.json --src sample.mp4 --start 3 --duration 2)
CLIP_ID=$(echo "$CLIP_OUT" | python3 -c "import json,sys; print(json.load(sys.stdin)['clip_id'])")
echo "  clip_id=$CLIP_ID"
$VCUT add-clip --project test.json --src sample.mp4 --start 5 --duration 2 >/dev/null && ok "add-clip video 3" || fail "add-clip video 3"

# 4. apply-transition (clip2 có clip3 kề ngay sau)
assert_ok "apply-transition fade" $VCUT apply-transition --project test.json --clip "$CLIP_ID" --type fade --duration 0.5
assert_fail "apply-transition type sai" $VCUT apply-transition --project test.json --clip "$CLIP_ID" --type xyz

# 5. apply-filter
assert_ok "apply-filter LUT" $VCUT apply-filter --project test.json --clip "$CLIP_ID" --lut vcut-warm-bloom
assert_fail "apply-filter lut sai" $VCUT apply-filter --project test.json --clip "$CLIP_ID" --lut not-a-lut

# 6. set-speed (dùng clip1 để không phá transition của clip2)
assert_ok "set-speed 2x" $VCUT set-speed --project test.json --clip "$CLIP1_ID" --speed 2
assert_fail "set-speed quá nhanh" $VCUT set-speed --project test.json --clip "$CLIP1_ID" --speed 10

# 7. validate
assert_ok "validate" $VCUT validate --project test.json

# 8. info
$VCUT info --project test.json | grep -q '"ok": true' && ok "info" || fail "info"

# 9. list commands
$VCUT list-transitions | grep -q "fade" && ok "list-transitions" || fail "list-transitions"
$VCUT list-luts | grep -q "vcut-warm" && ok "list-luts" || fail "list-luts"

# 10. render (thật, video ngắn)
assert_ok "render 720p" $VCUT render --project test.json --preset 720p --output out.mp4 --media-dir . -y -q
[ -f out.mp4 ] && ok "output MP4 tồn tại" || fail "output MP4 không tồn tại"
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp4 >/dev/null 2>&1 && ok "ffprobe đọc được MP4" || fail "ffprobe không đọc được"

# 11. error paths
assert_fail "add-clip thiếu duration" $VCUT add-clip --project test.json --src sample.mp4 --start 0
assert_fail "validate file không tồn tại" $VCUT validate --project nofile.json
assert_fail "lệnh không rõ" $VCUT frobnicate

echo ""
echo "=========================================="
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 CLI TEST: $PASS pass, 0 fail"
else
  echo "❌ CLI TEST: $PASS pass, $FAIL FAIL"
  exit 1
fi
