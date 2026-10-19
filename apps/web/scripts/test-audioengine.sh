#!/usr/bin/env bash
# Test audioEngine.ts bằng Node: biên dịch module thật (audioEngine + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions với AudioContext mock.
# Không cần browser (Web Audio không có trong Node).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-audioengine"

rm -rf "$OUT"
mkdir -p "$OUT"

# chạy tsc từ repo (typescript có trong node_modules của repo)
cd "$REPO_DIR"

echo "== tsc: biên dịch audioEngine.ts + video-spec =="
cat > "$OUT/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM"],
    "outDir": "$OUT/out",
    "rootDir": "$REPO_DIR",
    "baseUrl": "$REPO_DIR",
    "paths": { "@repo-1/video-spec": ["./packages/video-spec/src/index.ts"] }
  },
  "include": [
    "$REPO_DIR/apps/web/src/lib/audioEngine.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

# runtime: cho require("@repo-1/video-spec") trong audioEngine.js trỏ tới bản đã biên dịch
mkdir -p "$OUT/node_modules/@repo-1"
ln -sfn "$OUT/out/packages/video-spec/src" "$OUT/node_modules/@repo-1/video-spec"

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/audioengine.test.cjs" "$OUT/"
node "$OUT/audioengine.test.cjs"
