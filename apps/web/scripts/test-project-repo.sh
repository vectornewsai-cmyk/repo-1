#!/usr/bin/env bash
# Test projectRepo.ts bằng Node: biên dịch module thật (projectRepo + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-projrepo"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch projectRepo.ts + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/projectRepo.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== tạo node_modules shim cho @repo-1/video-spec =="
mkdir -p "$OUT/out/node_modules/@repo-1/video-spec"
cat > "$OUT/out/node_modules/@repo-1/video-spec/package.json" <<'EOF'
{"name":"@repo-1/video-spec","version":"0.1.0","main":"../../../packages/video-spec/src/index.js"}
EOF

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/projectRepo.test.cjs" "$OUT/"
node "$OUT/projectRepo.test.cjs"
