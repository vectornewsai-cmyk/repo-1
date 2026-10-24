#!/usr/bin/env bash
# bench-preview-perf.sh — Biên dịch previewEngine.ts sang CommonJS rồi chạy
# bench-preview-perf.cjs. Cùng mẫu test-preview-engine.sh (không cần DOM).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-preview-engine"

rm -rf "$OUT"
mkdir -p "$OUT"

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
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
# Lưu ý Q8: tsc có thể báo lỗi type ở file ngoài phạm vi (vd: sticker.ts
# đang được agent Phase 8 khác sửa dở) — tsc vẫn emit JS bình thường nên
# bench cứ chạy tiếp; lỗi type đó không thuộc Q8 và sẽ do merge xử lý.
npx tsc -p "$OUT/tsconfig.json" || echo "(tsc báo lỗi type — vẫn dùng output đã emit để bench)"
sed -i 's#require("@repo-1/video-spec")#require("../../../../packages/video-spec/src/index.js")#' \
  "$OUT/out/apps/web/src/lib/previewEngine.js"

cp "$REPO_DIR/apps/web/scripts/bench-preview-perf.cjs" "$OUT/"
node "$OUT/bench-preview-perf.cjs"
