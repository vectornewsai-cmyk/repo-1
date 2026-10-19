#!/usr/bin/env bash
# Test AssetStore (R1-032): typecheck strict TS rồi chạy test bằng Node
# (type-stripping, Node >= 22.18). Không cần browser; IndexedDB là fake in-memory.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="$REPO_DIR/apps/web/src/lib"
OUT="/tmp/vcut-test-assetstore"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc --noEmit: typecheck strict assetStore.ts + assetStore.test.ts =="
cat > "$OUT/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": [
    "$SRC/assetStore.ts",
    "$SRC/assetStore.test.ts"
  ]
}
EOF
npx --prefix "$REPO_DIR/apps/web" tsc -p "$OUT/tsconfig.json"
echo "   tsc OK (0 lỗi)"

echo "== chạy test =="
node "$SRC/assetStore.test.ts"
