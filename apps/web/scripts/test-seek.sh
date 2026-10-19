#!/usr/bin/env bash
# Test lib/seek.ts bằng Node: biên dịch module thật (seek + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-seek"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch seek.ts + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/seek.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== stage @repo-1/video-spec đã biên dịch vào node_modules =="
# seek.ts import runtime { snapToFrame } từ "@repo-1/video-spec" -> cần resolve được khi chạy test.
mkdir -p "$OUT/node_modules/@repo-1/video-spec"
cp "$OUT/out/packages/video-spec/src/"*.js "$OUT/node_modules/@repo-1/video-spec/"
cat > "$OUT/node_modules/@repo-1/video-spec/package.json" <<EOF
{ "name": "@repo-1/video-spec", "version": "0.0.0-test", "type": "commonjs", "main": "index.js" }
EOF

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/seek.test.cjs" "$OUT/"
node "$OUT/seek.test.cjs"
