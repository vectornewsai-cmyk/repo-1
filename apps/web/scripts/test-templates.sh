#!/usr/bin/env bash
# Test lib/templateEngine.ts + lib/templates.ts bằng Node: biên dịch module thật
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-templates"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch templateEngine.ts + templates.ts + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/templateEngine.ts",
    "$REPO_DIR/apps/web/src/lib/templates.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

# templateEngine import value isVideoSpec từ "@repo-1/video-spec" — cần
# mapping runtime (tsc paths chỉ có tác dụng lúc biên dịch): symlink thư mục
# đã biên dịch thành package, Node resolve <pkg>/index.js trực tiếp.
mkdir -p "$OUT/node_modules/@repo-1"
rm -rf "$OUT/node_modules/@repo-1/video-spec"
ln -s "$OUT/out/packages/video-spec/src" "$OUT/node_modules/@repo-1/video-spec"

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/templates.test.cjs" "$OUT/"
node "$OUT/templates.test.cjs"
