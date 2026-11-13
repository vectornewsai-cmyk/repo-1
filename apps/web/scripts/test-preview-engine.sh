#!/usr/bin/env bash
# Test previewEngine.ts bằng Node: biên dịch module thật (previewEngine + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser/DOM.
# Đợt 98 Z8: sửa 2 lỗi sẵn có từ trước đợt 96 (LIMITS gộp đợt 97 §4 mục 11):
#  (1) thiếu previewClipKey62R6.ts trong include → tsc không biên dịch file
#      này, require("./previewClipKey62R6.ts") trong previewEngine.js lỗi
#      "Cannot find module"; (2) OUT cố định /tmp/vcut-test-preview-engine
#      là thư mục /tmp dùng chung — 2 lượt chạy song song cùng rm -rf sẽ
#      phá lẫn nhau. Nay include đủ file + mỗi lượt lấy thư mục riêng
#      bằng mktemp -d. Cách chạy đúng vẫn như X9b (chạy script này trực
#      tiếp từ repo); không còn cách chạy "đúng" nào khác cần ghi riêng.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
# Đợt 98 Z8: thư mục riêng mỗi lượt (mktemp -d) thay vì đường dẫn cố định
# dùng chung — xem ghi chú ở đầu file. Không rm -rf ở đầu nữa.
OUT="$(mktemp -d /tmp/vcut-test-preview-engine.XXXXXX)"
echo "== thư mục làm việc tạm: $OUT =="

mkdir -p "$OUT"

echo "== tsc: biên dịch previewEngine.ts + video-spec =="
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
    "rootDir": "$REPO_DIR",
    "baseUrl": "$REPO_DIR",
    "paths": { "@repo-1/video-spec": ["./packages/video-spec/src/index.ts"] }
  },
  "include": [
    "$REPO_DIR/apps/web/src/lib/previewEngine.ts",
    "$REPO_DIR/apps/web/src/lib/previewClipKey62R6.ts",
    "$REPO_DIR/apps/web/src/lib/transitionPreview.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== vá require @repo-1/video-spec sang đường dẫn tương đối (runtime) =="
# tsc giữ nguyên require("@repo-1/video-spec"); node trong /tmp không resolve được
# nên trỏ sang file index.js đã biên dịch.
sed -i 's#require("@repo-1/video-spec")#require("../../../../packages/video-spec/src/index.js")#' \
  "$OUT/out/apps/web/src/lib/previewEngine.js"
# Đợt 98 Z8: tsc giữ nguyên require("./previewClipKey62R6.ts") (không
# rewrite .ts → .js) nên trỏ sang file .js đã biên dịch trong cùng thư mục.
sed -i 's#require("./previewClipKey62R6.ts")#require("./previewClipKey62R6")#' \
  "$OUT/out/apps/web/src/lib/previewEngine.js"

echo "== kiểm tra thứ tự transform trong render.js (static) =="
# Thứ tự chain trong render.js PHẢI là: speed → chroma → (color) → LUT → effects → opacity → keyframes
# (R1-075 thêm colorChain giữa chromaChain và lutChain — check 6 marker chính vẫn đúng thứ tự)
RJ="$REPO_DIR/server/render/src/render.js"
# marker: lần xuất hiện trong buildFilterGraph (bỏ qua dòng require/import đầu file)
check_order() {
  local pattern="$1" label="$2"
  local ln=$(grep -n "$pattern" "$RJ" | awk -F: '$1 > 50 {print $1; exit}')
  echo "   $label: dòng $ln"
  echo "$ln" >> "$OUT/order.txt"
}
check_order "speedChain" "speed"
check_order "chromaChain" "chroma"
check_order "lutChain" "lut"
check_order "fxChain" "effects"
check_order "opFilter" "opacity"
check_order "buildOverlayExprs(u.clip" "keyframes"
python3 - "$OUT/order.txt" <<'PY'
import sys
lines = [int(x) for x in open(sys.argv[1]).read().split() if x.strip()]
assert lines == sorted(lines), f"thứ tự transform trong render.js bị đảo: {lines}"
assert len(lines) == 6
print("   thứ tự render.js: speed → chroma → lut → effects → opacity → keyframes ✅")
PY

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/preview-engine.test.cjs" "$OUT/"
node "$OUT/preview-engine.test.cjs"
