#!/bin/bash
# K5: biên dịch lib/drop.ts + lib/toast.ts sang CommonJS tạm rồi chạy test node.
# (Không dùng bundler của app — 2 module này không phụ thuộc React/DOM.)
set -euo pipefail
cd "$(dirname "$0")/.."
BUILD_DIR=$(mktemp -d)
trap 'rm -rf "$BUILD_DIR"' EXIT
npx tsc src/lib/drop.ts src/lib/toast.ts \
  --outDir "$BUILD_DIR" --module commonjs --target es2020 --skipLibCheck
node scripts/test-k5.cjs "$BUILD_DIR"
