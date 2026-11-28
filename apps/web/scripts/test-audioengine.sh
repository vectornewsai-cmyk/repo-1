#!/usr/bin/env bash
# Test audioEngine.ts bằng Node: biên dịch module thật (audioEngine + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions với AudioContext mock.
# Không cần browser (Web Audio không có trong Node).
#
# Đợt 191 P1: audioEngine.ts import "./previewVoiceFx.ts" (đuôi .ts rõ ràng,
# theo quy ước lib/ của repo — Vite + node --experimental-strip-types đều
# chấp nhận). tsc 5.6 KHÔNG emit được import đuôi .ts (TS5097; flag
# allowImportingTsExtensions lại cấm emit — TS5096), nên script này tách
# 2 bước: tsc --noEmit để typecheck, esbuild bundle để chạy test.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-audioengine"

rm -rf "$OUT"
mkdir -p "$OUT"

# esbuild có trong node_modules của repo (dep của vite)
cd "$REPO_DIR"

echo "== tsc --noEmit: typecheck audioEngine.ts + previewVoiceFx.ts + video-spec =="
cat > "$OUT/tsconfig.check.json" <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM"],
    "baseUrl": "$REPO_DIR",
    "paths": { "@repo-1/video-spec": ["./packages/video-spec/src/index.ts"] }
  },
  "include": [
    "$REPO_DIR/apps/web/src/lib/audioEngine.ts",
    "$REPO_DIR/apps/web/src/lib/previewVoiceFx.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.check.json"

echo "== esbuild: bundle audioEngine.ts sang CommonJS (resolve import .ts + alias) =="
mkdir -p "$OUT/out/apps/web/src/lib"
npx esbuild "$REPO_DIR/apps/web/src/lib/audioEngine.ts" --bundle --platform=node --format=cjs \
  --outfile="$OUT/out/apps/web/src/lib/audioEngine.js" \
  --alias:@repo-1/video-spec="$REPO_DIR/packages/video-spec/src/index.ts" \
  --log-level=warning

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/audioengine.test.cjs" "$OUT/"
node "$OUT/audioengine.test.cjs"
