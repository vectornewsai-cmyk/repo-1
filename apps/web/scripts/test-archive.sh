#!/usr/bin/env bash
# Test archive.ts bằng Node: biên dịch module thật (archive + projectRepo + video-spec)
# sang CommonJS trong /tmp rồi chạy assertions. Không cần browser.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-archive"
WEB_DIR="$REPO_DIR/apps/web"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "== tsc: biên dịch archive.ts + projectRepo.ts + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/archive.ts",
    "$REPO_DIR/apps/web/src/lib/projectRepo.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx --prefix "$WEB_DIR" tsc -p "$OUT/tsconfig.json"

echo "== link node_modules cho jszip + @repo-1/video-spec =="
# jszip có thể bị hoist lên root node_modules (npm workspaces)
JSZIP_DIR=""
for cand in "$WEB_DIR/node_modules/jszip" "$REPO_DIR/node_modules/jszip"; do
  if [ -e "$cand/package.json" ]; then JSZIP_DIR="$cand"; break; fi
done
if [ -z "$JSZIP_DIR" ]; then echo "KHÔNG tìm thấy jszip đã cài!"; exit 1; fi
NM_ROOT="$(dirname "$JSZIP_DIR")"
mkdir -p "$OUT/out/node_modules/@repo-1/video-spec"
ln -sfn "$JSZIP_DIR" "$OUT/out/node_modules/jszip"
# jszip deps nằm cùng node_modules với jszip
for dep in pako readable-stream setimmediate core-util-is isarray inherits process-nextick-args string_decoder util-deprecate lie; do
  if [ -e "$NM_ROOT/$dep" ]; then
    ln -sfn "$NM_ROOT/$dep" "$OUT/out/node_modules/$dep"
  fi
done
cat > "$OUT/out/node_modules/@repo-1/video-spec/package.json" <<'EOF'
{"name":"@repo-1/video-spec","version":"0.1.0","main":"../../../packages/video-spec/src/index.js"}
EOF

echo "== chạy test =="
cp "$REPO_DIR/apps/web/scripts/archive.test.cjs" "$OUT/out/"
node "$OUT/out/archive.test.cjs"
