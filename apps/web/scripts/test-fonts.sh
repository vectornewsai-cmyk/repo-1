#!/usr/bin/env bash
# Test lib/fonts.ts bằng Node: biên dịch module thật sang CommonJS trong /tmp rồi chạy assertions.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-fonts"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch fonts.ts =="
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
    "rootDir": "$REPO_DIR"
  },
  "include": [
    "$REPO_DIR/apps/web/src/lib/fonts.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/fonts.test.cjs" "$OUT/"
node "$OUT/fonts.test.cjs"
