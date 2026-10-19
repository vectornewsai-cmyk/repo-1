#!/usr/bin/env bash
# Test exportPresets.ts bằng Node: biên dịch module thật sang CommonJS trong /tmp rồi chạy assertions.
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
node "$OUT/out/exportPresets.test.cjs"
