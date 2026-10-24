#!/usr/bin/env node
/**
 * test_p2.js — Test Phase 7 P2: enhancement (stabilize/denoise/deinterlace)
 * + encode GPU (detect + fallback). Chạy:
 *   node server/render/test_p2.js
 *
 * Gồm: unit test (validate/chains/encode args/probe giả lập) + render thật
 * với metric pixel đo bằng test_p2_measure.py (PIL/numpy):
 *   - stabilize: độ lệch chuẩn centroid x của hình vuông trắng PHẢI GIẢM
 *   - denoise: độ lệch chuẩn vùng phẳng PHẢI GIẢM
 *   - deinterlace: tỉ lệ frame progressive theo idet PHẢI TĂNG
 *   - GPU: trên VM không GPU, probe → null, render auto + ép nvenc đều
 *     fallback libx264 và vẫn thành công (KHÔNG fail job vì GPU).
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname);
const WORK = path.join(os.homedir(), "workspace", ".tmp-p2");
const PY = path.join(ROOT, "test_p2_measure.py");

const {
  validateEnhance, hasStabilize, buildEnhancePreChain, buildEnhancePostChain,
} = require("./src/enhance");
const { probeGpuEncoder, buildVideoEncodeArgs } = require("./src/gpuencode");
const { validateSpec } = require("./src/validate");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ""}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`); }
}
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function sh(cmd) {
  const r = run("bash", ["-c", cmd]);
  if (r.status !== 0) throw new Error(`lệnh fail: ${cmd}\n${r.stderr}`);
  return r.stdout;
}
function measure(metric, video) {
  const r = run("python3", [PY, metric, video]);
  if (r.status !== 0) throw new Error(`measure ${metric} fail: ${r.stderr}`);
  return r.stdout.trim();
}
function parseNum(out, key) {
  const m = new RegExp(`${key}=([0-9.]+)`).exec(out);
  return m ? Number(m[1]) : NaN;
}
function makeSpec(clipExtra, name) {
  return {
    version: "0.2.0",
    meta: { name, width: 320, height: 180, fps: 30 },
    tracks: [{ kind: "video", id: "v1", clips: [{
      kind: "video", id: "c1", src: "SRC", start: 0, duration: 4,
      in: 0, out: 4, sourceAudioMode: "mute", ...clipExtra,
    }] }],
  };
}
function render(specObj, mediaMap, outName, extraArgs = []) {
  const specPath = path.join(WORK, `${outName}.json`);
  const spec = JSON.parse(JSON.stringify(specObj));
  for (const t of spec.tracks)
    for (const c of t.clips) c.src = mediaMap[c.src] || c.src;
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const out = path.join(WORK, `${outName}.mp4`);
  const r = run("node", [path.join(ROOT, "src", "render.js"), "--spec", specPath,
    "--out", out, "-y", "--media-dir", WORK, ...extraArgs]);
  return { r, out };
}

console.log("== P2 unit: enhance validate/chains ==");
ok("validate ok", validateEnhance({ stabilize: {}, denoise: true, deinterlace: true }).length === 0);
ok("validate sai range", validateEnhance({ stabilize: { smoothing: 101 } }).length > 0);
ok("validate sai key", validateEnhance({ foo: 1 }).length > 0);
ok("validate denoise sai", validateEnhance({ denoise: { strength: 2 } }).length > 0);
ok("pre chain yadif", buildEnhancePreChain({ deinterlace: true }).includes("yadif=mode=0"));
ok("pre chain vidstab", buildEnhancePreChain({ stabilize: { smoothing: 20 } }, "/tmp/a.trf").includes("smoothing=20"));
ok("post chain hqdn3d", buildEnhancePostChain({ denoise: true }).startsWith(",hqdn3d="));
ok("hasStabilize", hasStabilize({ stabilize: {} }) && !hasStabilize({ denoise: true }));
ok("spec validate enhance ok", validateSpec(makeSpec({ enhance: { denoise: { strength: 0.5 } } }, "x")).ok);
ok("spec validate enhance sai", !validateSpec(makeSpec({ enhance: { denoise: { strength: 5 } } }, "x")).ok);
ok("spec validate enhance sai track", (() => {
  const s = makeSpec({}, "x");
  s.tracks[0].kind = "audio"; s.tracks[0].clips[0].kind = "audio";
  s.tracks[0].clips[0].enhance = { denoise: true };
  return !validateSpec(s).ok;
})());

console.log("== P2 unit: gpu encode args/probe ==");
ok("nvenc args", buildVideoEncodeArgs("h264_nvenc", { crf: 20, preset: "medium" }).args.join(" ").includes("-cq 20"));
ok("vaapi args", buildVideoEncodeArgs("h264_vaapi", { crf: 20, preset: "medium" }).pixFmt === null);
const fakeProbe = probeGpuEncoder("ffmpeg", (ff, enc) => enc === "h264_qsv");
ok("probe giả lập qsv", fakeProbe.encoder === "h264_qsv");
const realProbe = probeGpuEncoder("ffmpeg");
console.log(`   probe thật trên VM: ${realProbe.encoder || "null (fallback libx264)"}`);
ok("probe thật kiểu đúng", realProbe.encoder === null || ["h264_nvenc", "h264_qsv", "h264_vaapi"].includes(realProbe.encoder));

console.log("== P2 render thật: tạo media ==");
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
// Shaky: nền xám + vuông trắng, crop rung theo sin (n = số frame).
// Shaky: rung RANDOM từng frame (test_p2_gen_shaky.py). Jitter hình sin
// chu kỳ 7 frame là chuyển động tần số THẤP → vidstab coi là camera path có
// chủ ý, không khử. Random từng frame mới là rung tay thật.
sh(`python3 ${ROOT}/test_p2_gen_shaky.py ${WORK}/shaky.mp4`);
// Noisy: nền xám phẳng + noise thời gian mạnh.
// Noisy: noise thời gian VỪA (alls=15, std ~9.3 — nhiễu camera thật).
// alls=40 (std 26) là nhiễu cực mạnh, vượt ngoài tầm hqdn3d ở mức hợp lý.
sh(`ffmpeg -v error -y -f lavfi -i "color=c=0x808080:s=320x180:d=5:r=30" -vf "noise=alls=15:allf=t" -c:v libx264 -pix_fmt yuv420p ${WORK}/noisy.mp4`);
// Interlaced: thanh trắng ngang di chuyển dọc, rồi tinterlace.
// Interlaced: testsrc2 (chuyển động mạnh, nhiều chi tiết dọc) rồi tinterlace.
// Lưu ý: thanh ngang đơn trên nền phẳng cho idet = Undetermined 100% (không
// đủ tín hiệu phân biệt field) — testsrc2 cho TFF 75/75, sạch để đo.
// Interlaced: testsrc2 60fps → tinterlace → 30fps interlaced (cùng fps meta).
// Nguồn 15fps + fps=30 duplicate sẽ LỪA idet (progressive thuần + duplicate
// cũng cho TFF 37/BFF 37/Prog 44) — nguồn 30fps thì fps là passthrough.
sh(`ffmpeg -v error -y -f lavfi -i "testsrc2=s=320x180:d=5:r=60" -vf "tinterlace=interleave_top" -c:v libx264 -pix_fmt yuv420p ${WORK}/interlaced.mp4`);
ok("media tạo xong", ["shaky.mp4", "noisy.mp4", "interlaced.mp4"].every((f) => fs.existsSync(path.join(WORK, f))));

// Metric gốc (không enhancement). Stabilize đo bằng redx (centroid x của
// marker đỏ) + mad (độ thay đổi frame liên tiếp) — metric centroid trắng cũ
// bị texture pha loãng, đã bỏ.
const j0 = parseNum(measure("redx", path.join(WORK, "shaky.mp4")), "red_centroid_x_std");
const m0 = parseNum(measure("mad", path.join(WORK, "shaky.mp4")), "consec_MAD");
const n0 = parseNum(measure("noisestd", path.join(WORK, "noisy.mp4")), "center_crop_std");
const i0 = parseNum(measure("idet", path.join(WORK, "interlaced.mp4")), "prog_ratio");
console.log(`   gốc: redx_std=${j0} mad=${m0} noise_std=${n0} idet_prog=${i0}`);
ok("shaky gốc rung thật", j0 > 2.5 && m0 > 5, `redx_std=${j0} mad=${m0}`);
ok("noisy gốc nhiễu thật", n0 > 8, `std=${n0}`);
ok("interlaced gốc đúng interlaced", i0 < 0.5, `prog=${i0}`);

console.log("== P2 render thật: stabilize ==");
{
  const spec = makeSpec({ enhance: { stabilize: { smoothing: 30 } } }, "stab");
  spec.tracks[0].clips[0].duration = 4; spec.tracks[0].clips[0].out = 4;
  const { r, out } = render(spec, { SRC: "shaky.mp4" }, "stab");
  ok("render stabilize thành công", r.status === 0, r.stderr.slice(-300));
  const j1 = parseNum(measure("redx", out), "red_centroid_x_std");
  const m1 = parseNum(measure("mad", out), "consec_MAD");
  console.log(`   redx: ${j0} → ${j1}; mad: ${m0} → ${m1}`);
  ok("stabilize giảm jitter (redx)", j1 < j0 * 0.7, `redx_std ${j0} → ${j1}`);
  ok("stabilize giảm MAD", m1 < m0 * 0.5, `mad ${m0} → ${m1}`);
}

console.log("== P2 render thật: denoise ==");
{
  const spec = makeSpec({ enhance: { denoise: { strength: 1 } } }, "den");
  const { r, out } = render(spec, { SRC: "noisy.mp4" }, "den");
  ok("render denoise thành công", r.status === 0, r.stderr.slice(-300));
  const n1 = parseNum(measure("noisestd", out), "center_crop_std");
  console.log(`   noise: ${n0} → ${n1}`);
  ok("denoise giảm nhiễu", n1 < n0 * 0.7, `std ${n0} → ${n1}`);
}

console.log("== P2 render thật: deinterlace ==");
{
  const spec = makeSpec({ enhance: { deinterlace: true } }, "dei");
  const { r, out } = render(spec, { SRC: "interlaced.mp4" }, "dei");
  ok("render deinterlace thành công", r.status === 0, r.stderr.slice(-300));
  const i1 = parseNum(measure("idet", out), "prog_ratio");
  console.log(`   idet prog: ${i0} → ${i1}`);
  ok("deinterlace tăng progressive", i1 > 0.8, `prog ${i0} → ${i1}`);
  // Đối chứng: không deinterlace thì vẫn interlaced.
  const spec2 = makeSpec({}, "dei0");
  const r2 = render(spec2, { SRC: "interlaced.mp4" }, "dei0");
  ok("đối chứng không deinterlace thành công", r2.r.status === 0);
  const i2 = parseNum(measure("idet", r2.out), "prog_ratio");
  ok("đối chứng vẫn interlaced", i2 < 0.5, `prog=${i2}`);
}

console.log("== P2 render thật: GPU fallback ==");
{
  const spec = makeSpec({}, "gpu");
  const { r, out } = render(spec, { SRC: "shaky.mp4" }, "gpuauto");
  ok("render auto thành công", r.status === 0, r.stderr.slice(-300));
  ok("log ghi encoder libx264", r.stdout.includes("encoder video: libx264"));
  const probe = run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name", "-of", "csv=p=0", out]);
  ok("output codec h264", probe.stdout.trim() === "h264", probe.stdout.trim());
  // Ép nvenc trên máy không GPU → cảnh báo + fallback, KHÔNG fail.
  const { r: r3 } = render(spec, { SRC: "shaky.mp4" }, "gpuforce", ["--encoder", "h264_nvenc"]);
  ok("ép nvenc vẫn thành công (fallback)", r3.status === 0, r3.stderr.slice(-300));
  ok("ép nvenc có cảnh báo fallback", r3.stderr.includes("fallback") || r3.stdout.includes("fallback"));
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail ? 1 : 0);
