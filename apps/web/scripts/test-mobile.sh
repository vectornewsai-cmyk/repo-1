#!/usr/bin/env bash
# Test Q6 mobile-web foundation: biên dịch pinch.ts thật sang CommonJS rồi chạy
# assertions (manifest, SW, icon PNG, CSS, marker App/Timeline). Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-mobile"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch lib/pinch.ts =="
cat > "$OUT/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "$OUT/out",
    "rootDir": "$REPO_DIR"
  },
  "include": ["$REPO_DIR/apps/web/src/lib/pinch.ts"]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

echo "== chạy test =="
REPO_DIR="$REPO_DIR" node "$REPO_DIR/apps/web/scripts/mobile.test.cjs"
