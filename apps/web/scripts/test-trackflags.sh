#!/usr/bin/env bash
# Test trackFlags.ts (R1-054): compile bằng tsc rồi chạy test bằng Node.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
SRC="$REPO_DIR/apps/web/src/lib/trackFlags.ts"
TEST="$REPO_DIR/apps/web/scripts/trackflags.test.cjs"
OUT="/tmp/vcut-test-trackflags"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: compile trackFlags.ts =="
npx --prefix "$REPO_DIR" tsc "$SRC" \
  --outDir "$OUT" \
  --module nodenext \
  --target es2022 \
  --moduleResolution nodenext \
  --strict \
  --skipLibCheck \
  --noEmitOnError

echo "== node --test =="
node --test "$REPO_DIR/apps/web/scripts/trackflags.test.mjs"
