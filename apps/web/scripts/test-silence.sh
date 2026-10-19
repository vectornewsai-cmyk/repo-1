#!/usr/bin/env bash
# Test silence.ts bằng Node: biên dịch module thật (silence + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-silence"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch silence.ts + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/silence.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

# silence.ts import VALUE từ @repo-1/video-spec (sourceTimeAt, clipSpeed)
# → tạo package giả để Node resolve được module đã biên dịch.
mkdir -p "$OUT/node_modules/@repo-1/video-spec"
ln -sfn "$OUT/out/packages/video-spec/src/index.js" \
  "$OUT/node_modules/@repo-1/video-spec/index.js"
cat > "$OUT/node_modules/@repo-1/video-spec/package.json" <<EOF
{ "name": "@repo-1/video-spec", "version": "0.0.0-test", "main": "index.js" }
EOF

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/silence.test.cjs" "$OUT/"
node "$OUT/silence.test.cjs"
