#!/usr/bin/env bash
# Test filmstrip (R1-066) bằng Node: biên dịch thumbnails.ts thật sang CommonJS
# trong /tmp rồi chạy assertions. Không cần browser.
#
# Phần 2: kiểm chứng ground-truth bằng ffmpeg — các mốc timestamp của filmstrip
# cho clip 10s phải cho ra 5 frame THẬT SỰ khác nhau (hash khác nhau).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-filmstrip"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch thumbnails.ts =="
cat > "$OUT/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "outDir": "$OUT/out",
    "rootDir": "$REPO_DIR/apps/web/src/lib",
    "types": []
  },
  "include": [
    "$REPO_DIR/apps/web/src/lib/thumbnails.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/filmstrip.test.cjs" "$OUT/"
node "$OUT/filmstrip.test.cjs"

echo ""
echo "== ground-truth ffmpeg: 5 mốc timestamp → 5 frame khác nhau =="
VID="$OUT/changing.mp4"
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "testsrc2=duration=10:size=320x180:rate=30" \
  -c:v libx264 -pix_fmt yuv420p "$VID"

prev=""
dupes=0
for t in 1 3 5 7 9; do
  h=$(ffmpeg -hide_banner -loglevel error -y -ss "$t" -i "$VID" -frames:v 1 \
    -f rawvideo -pix_fmt rgb24 - | md5sum | cut -d' ' -f1)
  echo "  t=${t}s → md5 $h"
  if [ "$h" = "$prev" ]; then
    echo "  ✗ TRÙNG frame với mốc trước!"
    dupes=$((dupes + 1))
  fi
  prev="$h"
done

# kiểm tra 5 hash đều phân biệt (không chỉ mốc kề)
nuniq=$(for t in 1 3 5 7 9; do
  ffmpeg -hide_banner -loglevel error -y -ss "$t" -i "$VID" -frames:v 1 \
    -f rawvideo -pix_fmt rgb24 - | md5sum | cut -d' ' -f1
done | sort -u | wc -l)
echo "  số hash phân biệt: $nuniq / 5"
if [ "$dupes" -ne 0 ] || [ "$nuniq" -ne 5 ]; then
  echo "✗ FAIL: có frame trùng nhau"
  exit 1
fi
echo "✓ PASS: 5 frame ở 5 mốc filmstrip đều khác nhau"
