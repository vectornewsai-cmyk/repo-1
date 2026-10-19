#!/usr/bin/env bash
# Test lib/captions.ts bằng Node: biên dịch module thật (captions + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-captions"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch captions.ts + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/captions.ts",
    "$REPO_DIR/apps/web/src/lib.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/captions.test.cjs" "$OUT/"
node "$OUT/captions.test.cjs"
