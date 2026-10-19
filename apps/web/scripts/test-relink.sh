#!/usr/bin/env bash
# Test relink.ts bằng Node: biên dịch module thật (relink + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-relink"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch relink.ts + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/relink.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== tạo node_modules shim cho @repo-1/video-spec =="
mkdir -p "$OUT/out/node_modules/@repo-1/video-spec"
cat > "$OUT/out/node_modules/@repo-1/video-spec/package.json" <<'EOF'
{"name":"@repo-1/video-spec","version":"0.2.0","main":"../../../packages/video-spec/src/index.js"}
EOF

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/relink.test.cjs" "$OUT/"
node "$OUT/relink.test.cjs"
