#!/usr/bin/env bash
# Test logic template pack (R1, Phase 9) + render thật 1 pack bằng render worker.
# Bước 1: biên dịch module thật sang /tmp rồi chạy assertions Node (không cần browser).
# Bước 2: sinh testsrc mp4 6s + ảnh PNG, resolve pack youtube-intro với đúng
# file đó, chạy server/render/src/render.js, kiểm chứng MP4 ra đủ dài, không rỗng.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="/tmp/vcut-test-r1pack"
export OUT
RENDER_TMP="/tmp/vcut-test-r1render"

rm -rf "$OUT" "$RENDER_TMP"
mkdir -p "$OUT" "$RENDER_TMP/media"

echo "== tsc: biên dịch templatePack + templateEngine + templates + sampleMedia + video-spec =="
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
    "$REPO_DIR/apps/web/src/lib/templatePack.ts",
    "$REPO_DIR/apps/web/src/lib/templateEngine.ts",
    "$REPO_DIR/apps/web/src/lib/templates.ts",
    "$REPO_DIR/apps/web/src/lib/sampleMedia.ts",
    "$REPO_DIR/packages/video-spec/src/index.ts"
  ]
}
EOF
npx tsc -p "$OUT/tsconfig.json"

mkdir -p "$OUT/node_modules/@repo-1"
rm -rf "$OUT/node_modules/@repo-1/video-spec"
ln -s "$OUT/out/packages/video-spec/src" "$OUT/node_modules/@repo-1/video-spec"

echo "== chạy test logic =="
cp "$REPO_DIR/apps/web/scripts/r1-pack.test.cjs" "$OUT/"
node "$OUT/r1-pack.test.cjs"

echo "== render thật pack youtube-intro =="
ffmpeg -y -v error -f lavfi -i "testsrc2=size=640x360:rate=30:duration=6" -c:v libx264 -pix_fmt yuv420p "$RENDER_TMP/media/testsrc.mp4"
ffmpeg -y -v error -f lavfi -i "color=c=0x1e1b4b:size=640x360:duration=6" -frames:v 1 "$RENDER_TMP/media/testimg.png"
node - "$RENDER_TMP" <<'EOF'
const { getPacks, resolvePackSpec } = require(process.env.OUT + "/out/apps/web/src/lib/templatePack.js");
const fs = require("node:fs");
const outDir = process.argv[2];
const tpl = getPacks().find((t) => t.template.id === "youtube-intro");
const res = resolvePackSpec(tpl, { [tpl.template.placeholders.find((p) => p.kind === "video").id]: "testsrc.mp4" });
if (!res.ok) { console.error(res.error); process.exit(1); }
fs.writeFileSync(outDir + "/pack.json", JSON.stringify(res.spec));
console.log("spec đã ghi, tracks:", res.spec.tracks.length, "durationSec:", tpl.template.durationSec);
EOF
node "$REPO_DIR/server/render/src/render.js" --spec "$RENDER_TMP/pack.json" --out "$RENDER_TMP/pack.mp4" --media-dir "$RENDER_TMP/media" -y
ls -la "$RENDER_TMP/pack.mp4"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RENDER_TMP/pack.mp4")
echo "MP4 duration: $DUR"
python3 -c "import sys; d=float('$DUR'); assert 4.0 <= d <= 7.0, d; print('✅ render pack: duration hợp lệ')"
echo "🎉 R1 PACK RENDER PASS"
