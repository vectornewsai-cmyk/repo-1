#!/usr/bin/env bash
# Test commands.ts + store undo/redo bằng Node: biên dịch module thật
# (store + commands + video-spec) sang CommonJS trong /tmp rồi chạy assertions.
# Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-commands"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch store.ts + commands.ts + video-spec =="
TSC_BIN="$REPO_DIR/node_modules/.bin/tsc"
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
    "paths": {
      "@repo-1/video-spec": ["./packages/video-spec/src/index.ts"],
      "@repo-1/video-spec/speed": ["./packages/video-spec/src/speed.ts"]
    }
  },
  "include": [
    "$REPO_DIR/apps/web/src/store.ts",
    "$REPO_DIR/apps/web/src/lib/commands.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
"$TSC_BIN" -p "$OUT/tsconfig.json"

echo "== tạo node_modules shim cho @repo-1/video-spec =="
mkdir -p "$OUT/out/node_modules/@repo-1/video-spec"
cat > "$OUT/out/node_modules/@repo-1/video-spec/package.json" <<'EOF'
{"name":"@repo-1/video-spec","version":"0.2.0","main":"../../../packages/video-spec/src/index.js"}
EOF
cat > "$OUT/out/node_modules/@repo-1/video-spec/speed.js" <<'EOF'
module.exports = require("../../../packages/video-spec/src/speed.js");
EOF

echo "== chạy unit test: CommandStack =="
cp "$REPO_DIR/apps/web/scripts/commands.test.cjs" "$OUT/"
node "$OUT/commands.test.cjs"

echo ""
echo "== chạy integration test: store undo/redo thật =="
cp "$REPO_DIR/apps/web/scripts/store-history.test.cjs" "$OUT/"
NODE_PATH="$REPO_DIR/node_modules" node "$OUT/store-history.test.cjs"
