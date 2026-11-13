#!/usr/bin/env bash
# Test exportPresets.ts bằng Node: biên dịch module thật sang CommonJS trong /tmp rồi chạy assertions.
# Đợt 80 H10: thêm "resolveJsonModule" (exportPresets.ts import i18n →
# vi.json/en.json; thiếu cờ này tsc lỗi TS2732 — harness đã gãy từ khi
# preset dùng t(), trước đợt này).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-export-presets"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch exportPresets.ts =="
cat > "$OUT/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "$OUT/out",
    "rootDir": "$REPO_DIR"
  },
  "include": ["$REPO_DIR/apps/web/src/lib/exportPresets.ts"]
}
EOF

npx --prefix "$REPO_DIR" tsc -p "$OUT/tsconfig.json"

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/exportPresets.test.cjs" "$OUT/out/exportPresets.test.cjs"
# test require "./apps/web/src/lib/exportPresets.js" tương đối theo rootDir
# i18n/index.ts import react (useSyncExternalStore) — output biên dịch nằm
# ở /tmp nên phải chỉ NODE_PATH về node_modules của repo mới require được.
NODE_PATH="$REPO_DIR/node_modules" node "$OUT/out/exportPresets.test.cjs"
