#!/usr/bin/env node
/**
 * test_motion_p6_legacy.js — Test THẬT Phase 9 đợt 11 P6: project cũ
 * mang motionBlur weights 0 / thiếu frames không vỡ ở cổng render.
 *
 * Nợ đợt 9: "Weights = 0 trong project cũ vẫn fail validate render S2
 * (UI slider min 1% chỉ bảo vệ dữ liệu mới)".
 *
 * Chứng minh bằng code thật (không mock validate/render):
 *   A. validateSpec (cổng load của render.js) PASS với 3 dạng project cũ:
 *      weights toàn 0, chỉ có weights (thiếu frames), motionBlur rỗng {}.
 *   B. validateMotion strict VẪN FAIL với input thô weights 0 — tức P6
 *      không nới validate, chỉ thêm bước migrate ở cổng load.
 *   C. buildMotionBlurChain cho ra tmix weights đều (không phải 0 0 0).
 *   D. Render THẬT bằng render.js: clip cũ weights 0 (blur-only) và clip
 *      cũ weights 0 + minterpolate đều ra MP4 đúng frame/duration —
 *      tức project cũ render được tới cùng, không dừng ở validate.
 *   E. Hồi quy: project mới hợp lệ vẫn validate pass, chain không đổi.
 *
 * Cách chạy: node src/test_motion_p6_legacy.js (từ server/render).
 * Cần ffmpeg, ffprobe. File tạm trong os.tmpdir().
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateSpec } = require("./validate");
const { validateMotion, buildMotionBlurChain, normalizeLegacyMotion } = require("./motion");

const W = 320, H = 180, FPS = 30, DUR = 2;
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-motionp6-"));
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
function specWith(clip) {
  return {
    version: "0.2.0",
    meta: { name: "p6legacy", width: W, height: H, fps: FPS },
    tracks: [{ id: "v0", kind: "video", clips: [clip] }],
  };
}
const vclip = (extra) => ({
  id: "c0", kind: "video", src: "src.mp4", start: 0, duration: DUR, in: 0, out: DUR,
  ...extra,
});
function render(clip, name) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(specWith(clip)));
  const outPath = path.join(work, `${name}.mp4`);
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "--x264-preset", "veryfast", "--crf", "28", "-y"],
    { cwd: path.join(__dirname, ".."), stdio: ["ignore", "pipe", "pipe"] });
  return { status: r.status, stderr: (r.stderr || "").toString(), outPath };
}
function countFrames(mp4) {
  const r = run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", mp4], `đếm frame ${mp4}`);
  return parseInt(r.stdout.toString().trim(), 10);
}

// --- Media thật: testsrc2 320x180 30fps ---
run("ffmpeg", ["-f", "lavfi", "-i", `testsrc2=s=${W}x${H}:r=30:d=4`,
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src.mp4")], "tạo src.mp4");

console.log("A: validateSpec PASS với 3 dạng project cũ");
for (const [label, motion] of [
  ["weights toàn 0", { motionBlur: { frames: 3, weights: [0, 0, 0] } }],
  ["chỉ có weights (thiếu frames)", { motionBlur: { weights: [1, 2, 3] } }],
  ["motionBlur rỗng {}", { motionBlur: {} }],
]) {
  const v = validateSpec(specWith(vclip({ motion })));
  ok(v.ok, `validateSpec ${label} → ok (errors: ${JSON.stringify(v.errors)})`);
}

console.log("B: validateMotion strict vẫn FAIL với input thô (không nới validate)");
ok(validateMotion({ motionBlur: { frames: 3, weights: [0, 0, 0] } }).length > 0,
  "validateMotion raw weights 0 → có lỗi");
ok(validateMotion({ motionBlur: {} }).length > 0,
  "validateMotion raw blur {} → có lỗi (thiếu frames ở tầng render)");

console.log("C: chain dùng dạng đã migrate");
ok(buildMotionBlurChain({ motionBlur: { frames: 3, weights: [0, 0, 0] } }) === ",tmix=frames=3:weights=1 1 1",
  "blurChain weights 0 → tmix weights 1 1 1");
ok(buildMotionBlurChain({ motionBlur: { weights: [1, 2, 3] } }) === ",tmix=frames=3:weights=1 2 3",
  "blurChain thiếu frames → frames=3 theo weights");
ok(normalizeLegacyMotion({ motionBlur: { frames: 3, weights: [1, 2, 3] } }).migrated === false,
  "project mới hợp lệ không bị migrate");

console.log("D: render thật project cũ");
const r1 = render(vclip({ motion: { motionBlur: { frames: 3, weights: [0, 0, 0] } } }), "old_blur");
ok(r1.status === 0, `render blur weights 0 → rc=0 (stderr đuôi: ${r1.stderr.slice(-200)})`);
if (r1.status === 0) {
  ok(countFrames(r1.outPath) === DUR * FPS, `blur weights 0 → ${DUR * FPS} frame / ${DUR}s`);
}
const r2 = render(vclip({ motion: { interpolation: "minterpolate", targetFps: 30,
  motionBlur: { frames: 3, weights: [0, 0, 0] } } }), "old_interp");
ok(r2.status === 0, `render interp + weights 0 → rc=0 (stderr đuôi: ${r2.stderr.slice(-200)})`);
if (r2.status === 0) {
  ok(countFrames(r2.outPath) === DUR * FPS, `interp + weights 0 → ${DUR * FPS} frame / ${DUR}s`);
}

console.log("E: hồi quy project mới");
const vNew = validateSpec(specWith(vclip({ motion: { interpolation: "minterpolate",
  targetFps: 60, motionBlur: { frames: 4, weights: [1, 2, 3, 4] } } })));
ok(vNew.ok, `validateSpec project mới (targetFps 60, weights hợp lệ) → ok`);
ok(buildMotionBlurChain({ motionBlur: { frames: 4, weights: [1, 2, 3, 4] } }) === ",tmix=frames=4:weights=1 2 3 4",
  "chain project mới không đổi");

console.log(`\nP6 legacy: ${pass} pass, ${fail} fail (workdir ${work})`);
process.exit(fail === 0 ? 0 : 1);
