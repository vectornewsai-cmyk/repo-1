#!/usr/bin/env node
/**
 * test_p7_asset.js — Test THẬT Phase 7 P7: render worker hiểu src "asset:".
 *
 * Render bằng chính render.js (không mock):
 *  A. asset: qua asset map (id → filename) → render OK, output > 0.
 *  B. asset: không có map → fallback file cùng tên trong mediaDir → render OK.
 *  C. asset: thiếu cả map lẫn file → exit 1, stderr nêu rõ tên asset.
 *  D. sticker clip dùng asset: qua map → render OK.
 *  E. asset map chứa traversal ("../") → fail fast với thông báo asset.
 *  F. asset map value tuyệt đối → render OK.
 *
 * Cách chạy: node src/test_p7_asset.js (cần ffmpeg, ffprobe trên PATH)
 * File tạm nằm trong os.tmpdir().
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const W = 320, H = 180, FPS = 10;
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-p7asset-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
function render(spec, name, assetMap) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const args = ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "-y"];
  if (assetMap) {
    const mapPath = path.join(work, `${name}.assetmap.json`);
    fs.writeFileSync(mapPath, JSON.stringify(assetMap));
    args.push("--asset-map", mapPath);
  }
  const r = spawnSync("node", args, { cwd: path.join(__dirname, ".."), stdio: ["ignore", "pipe", "pipe"] });
  return { status: r.status, stderr: (r.stderr || "").toString(), outPath };
}
function outOk(outPath) {
  try { return fs.statSync(outPath).size > 0; } catch { return false; }
}
const vclip = (id, src, duration) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
});
const specWith = (tracks) => ({
  version: "0.2.0",
  meta: { name: "p7", width: W, height: H, fps: FPS },
  tracks,
});

// --- Media thật ---
run("ffmpeg", ["-f", "lavfi", "-i", `color=c=blue:s=${W}x${H}:r=${FPS}:d=2`,
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "demo.mp4")], "tạo demo.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "color=c=red:s=64x64:r=10:d=1",
  "-frames:v", "1", "-y", path.join(mediaDir, "sticker.png")], "tạo sticker.png");

console.log("A: asset: qua asset map (id → filename)");
{
  const spec = specWith([
    { id: "v0", kind: "video", clips: [vclip("c0", "asset:demo-video", 2)] },
  ]);
  const r = render(spec, "a-map", { "demo-video": "demo.mp4" });
  ok(r.status === 0 && outOk(r.outPath), "render asset: qua map thành công, output > 0");
}

console.log("B: asset: không có map → fallback file cùng tên trong mediaDir");
{
  const spec = specWith([
    { id: "v0", kind: "video", clips: [vclip("c0", "asset:demo.mp4", 2)] },
  ]);
  const r = render(spec, "b-fallback", null);
  ok(r.status === 0 && outOk(r.outPath), "render asset: fallback mediaDir thành công");
}

console.log("C: asset: thiếu cả map lẫn file → lỗi nêu rõ tên asset");
{
  const spec = specWith([
    { id: "v0", kind: "video", clips: [vclip("c0", "asset:nope-missing", 2)] },
  ]);
  const r = render(spec, "c-missing", null);
  ok(r.status === 1, "render thiếu asset → exit 1 (fail fast, không chạy ffmpeg mù)");
  ok(/nope-missing/.test(r.stderr) && /asset/.test(r.stderr),
    "stderr nêu rõ tên asset thiếu (không phải lỗi file khó hiểu)");
}

console.log("D: sticker clip dùng asset: qua map");
{
  const spec = specWith([
    { id: "v0", kind: "video", clips: [vclip("c0", "demo.mp4", 2)] },
    { id: "s0", kind: "sticker", clips: [
      { id: "st0", kind: "sticker", src: "asset:sticker-img", start: 0, duration: 2,
        x: 0.5, y: 0.5, scale: 0.3, opacity: 1, rotation: 0 },
    ] },
  ]);
  const r = render(spec, "d-sticker", { "sticker-img": "sticker.png" });
  ok(r.status === 0 && outOk(r.outPath), "render sticker asset: qua map thành công");
}

console.log("E: asset map chứa traversal → fail fast");
{
  const spec = specWith([
    { id: "v0", kind: "video", clips: [vclip("c0", "asset:evil", 2)] },
  ]);
  const r = render(spec, "e-traversal", { "evil": "../escape.mp4" });
  ok(r.status !== 0 && /asset/.test(r.stderr), "map traversal bị chặn, stderr nhắc asset");
}

console.log("F: asset map value tuyệt đối");
{
  const spec = specWith([
    { id: "v0", kind: "video", clips: [vclip("c0", "asset:abs-demo", 2)] },
  ]);
  const r = render(spec, "f-abs", { "abs-demo": path.join(mediaDir, "demo.mp4") });
  ok(r.status === 0 && outOk(r.outPath), "render asset: value tuyệt đối thành công");
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail ? 1 : 0);
