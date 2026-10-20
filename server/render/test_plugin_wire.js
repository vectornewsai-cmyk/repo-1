#!/usr/bin/env node
/**
 * test_plugin_wire.js — E2E cho plugin wiring (Batch J) trong render worker.
 *
 * Kiểm chứng THẬT (không mock):
 *  1. Regression: spec KHÔNG có `plugins` render như cũ (ffprobe hợp lệ).
 *  2. Spec có plugin watermark (theo `id`) → render ra MP4; pixel vùng
 *     dưới-phải (nơi watermark drawtext nằm) sáng lên rõ so với bản không
 *     plugin, vùng trên-trái giữ nguyên → watermark xuất hiện THẬT.
 *  3. Plugin theo `path` (tương đối so với thư mục spec): onProjectValidate
 *     warning + onExportFinish warning đều xuất hiện trên stderr của
 *     render (kênh bridge gom vào job log).
 *  4. Plugin hello-world (onExportStart) log ra stderr qua vc.log.
 *  5. Spec plugins sai (id chứa path traversal / entry rỗng / id không tồn
 *     tại) → render fail với exit 1, không render bừa.
 *
 * Chạy: node test_plugin_wire.js   (cần ffmpeg + ffprobe trên PATH)
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const RENDER_JS = path.join(__dirname, "src", "render.js");
let passed = 0, failed = 0;
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name} ${extra}`); }
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-plugin-wire-"));
const mediaDir = path.join(tmp, "media");
fs.mkdirSync(mediaDir, { recursive: true });

// --- Media mẫu: nền đỏ đặc 640x360, 3s (watermark trắng sẽ nổi rõ) ---
const gen = run("ffmpeg", ["-v", "error", "-f", "lavfi",
  "-i", "color=c=red:s=640x360:r=30:d=3",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", path.join(mediaDir, "clip.mp4")]);
if (gen.status !== 0) { console.error("Không tạo được media mẫu:", gen.stderr); process.exit(2); }

// --- Plugin probe (theo path): validate warning + export-finish warning ---
fs.writeFileSync(path.join(tmp, "probe.js"), `
module.exports = {
  manifest: {
    name: "e2e-probe", version: "1.0.0", author: "test",
    apiVersion: 1,
    hooks: ["onProjectValidate", "onExportFinish"],
    permissions: ["export:annotate"],
  },
  hooks: {
    onProjectValidate: function () { return { warnings: ["probe-validate-warning"] }; },
    onExportFinish: function (ctx) {
      return { warnings: ["probe-finish success=" + ctx.success] };
    },
  },
};
`, "utf8");

function makeSpec(extra) {
  return {
    version: "0.2.0",
    meta: { name: "plugin-wire-e2e", width: 640, height: 360, fps: 30 },
    tracks: [{
      id: "v1", kind: "video", label: "Video",
      clips: [{ kind: "video", id: "c1", src: "clip.mp4", start: 0, duration: 3, in: 0, out: 3 }],
    }],
    ...extra,
  };
}
function writeSpec(name, spec) {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, JSON.stringify(spec, null, 2), "utf8");
  return p;
}
function render(specPath, outName) {
  const out = path.join(tmp, outName);
  const r = run("node", [RENDER_JS, "--spec", specPath, "--out", out, "-y", "-q"]);
  return { r, out, stderr: r.stderr || "", stdout: r.stdout || "" };
}
function probeOk(file) {
  const p = run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height:format=duration",
    "-of", "json", file]);
  if (p.status !== 0) return null;
  try { return JSON.parse(p.stdout); } catch { return null; }
}
/** Mean độ xám của 1 vùng frame tại t=1.5s (decode raw gray, tính trong Node). */
function regionMean(file, w, h, x, y) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-ss", "1.5", "-i", file,
    "-frames:v", "1", "-vf", `crop=${w}:${h}:${x}:${y},format=gray`,
    "-f", "rawvideo", "-"], { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 || !r.stdout || r.stdout.length === 0) return null;
  let sum = 0;
  for (const b of r.stdout) sum += b;
  return sum / r.stdout.length;
}

console.log("== 1. Regression: spec không có plugins ==");
const baseSpec = writeSpec("base.json", makeSpec({}));
const base = render(baseSpec, "base.mp4");
check("render không plugin thoát 0", base.r.status === 0, base.stderr.slice(-300));
const baseProbe = probeOk(base.out);
check("ffprobe: h264 640x360, ~3s",
  !!baseProbe && baseProbe.streams[0].codec_name === "h264" &&
  baseProbe.streams[0].width === 640 && baseProbe.streams[0].height === 360 &&
  Math.abs(Number(baseProbe.format.duration) - 3) < 0.2);

console.log("== 2. Plugin watermark theo id — pixel dưới-phải ==");
const wmSpec = writeSpec("wm.json", makeSpec({
  plugins: [{ id: "watermark", config: { text: "E2EWM", fontSize: 56, opacity: 1 } }],
}));
const wm = render(wmSpec, "wm.mp4");
check("render có watermark thoát 0", wm.r.status === 0, wm.stderr.slice(-300));
check("ffprobe bản watermark hợp lệ", !!probeOk(wm.out));
const BR = [300, 90, 340, 270], TL = [300, 90, 0, 0];
const brBase = regionMean(base.out, ...BR), brWm = regionMean(wm.out, ...BR);
const tlBase = regionMean(base.out, ...TL), tlWm = regionMean(wm.out, ...TL);
console.log(`     BR mean: base=${brBase?.toFixed(1)} wm=${brWm?.toFixed(1)} | TL mean: base=${tlBase?.toFixed(1)} wm=${tlWm?.toFixed(1)}`);
check("vùng dưới-phải sáng lên rõ (watermark xuất hiện)",
  brBase !== null && brWm !== null && brWm - brBase > 5,
  `delta=${brWm !== null && brBase !== null ? (brWm - brBase).toFixed(1) : "n/a"}`);
check("vùng trên-trái không đổi (chỉ watermark khác)",
  tlBase !== null && tlWm !== null && Math.abs(tlWm - tlBase) < 2);

console.log("== 3. Plugin theo path: validate + export-finish warnings ra stderr ==");
const probeSpec = writeSpec("probe.json", makeSpec({ plugins: [{ path: "probe.js" }] }));
const probe = render(probeSpec, "probe.mp4");
check("render plugin path thoát 0", probe.r.status === 0, probe.stderr.slice(-300));
check("onProjectValidate warning có trên stderr",
  probe.stderr.includes("probe-validate-warning"), probe.stderr.slice(-200));
check("onExportFinish warning (success=true) có trên stderr",
  probe.stderr.includes("probe-finish success=true"), probe.stderr.slice(-200));

console.log("== 4. hello-world: onExportStart log qua vc.log ==");
const helloSpec = writeSpec("hello.json", makeSpec({ plugins: [{ id: "hello-world" }] }));
const hello = render(helloSpec, "hello.mp4");
check("render hello-world thoát 0", hello.r.status === 0, hello.stderr.slice(-300));
check("log [plugin:hello-world] + nội dung export có trên stderr",
  hello.stderr.includes("[plugin:hello-world]") && hello.stderr.includes("sap export project"),
  hello.stderr.slice(-200));

console.log("== 5. Spec plugins sai → fail fast exit 1 ==");
const badCases = [
  ["traversal.json", { plugins: [{ id: "../evil" }] }, "id chứa path traversal"],
  ["empty.json", { plugins: [{}] }, "entry rỗng (không id/path)"],
  ["missing.json", { plugins: [{ id: "khong-ton-tai" }] }, "id không tồn tại"],
  ["both.json", { plugins: [{ id: "watermark", path: "probe.js" }] }, "khai cả id lẫn path"],
];
for (const [fname, extra, label] of badCases) {
  const sp = writeSpec(fname, makeSpec(extra));
  const rr = render(sp, fname + ".mp4");
  check(`fail: ${label}`, rr.r.status === 1, `exit=${rr.r.status}`);
}

console.log(`\n== KẾT QUẢ: ${passed} pass, ${failed} fail ==`);
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* bỏ qua */ }
process.exit(failed === 0 ? 0 : 1);
