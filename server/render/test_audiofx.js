#!/usr/bin/env node
/**
 * test_audiofx.js — Kiểm chứng R1-076 (audio effects) bằng render THẬT.
 *
 * Mỗi effect được render thành MP4 thật rồi đo bằng volumedetect:
 *  A. baseline (không FX) → ghi nhận mean/max
 *  B. bass=+12dB → mean_volume TĂNG rõ (100Hz được boost)
 *  C. bass=-12dB → mean_volume GIẢM rõ
 *  D. treble=+12dB → mean_volume TĂNG (8kHz được boost)
 *  E. noiseReduction=1 → mean_volume GIẢM (nhiễu bị khử)
 *  F. compressor → mean_volume GIẢM mạnh (peak bị nén)
 *  G. reverb=1 → mean_volume TĂNG (đuôi echo thêm năng lượng)
 *  H. video clip audioEffects (tiếng kế thừa) → mean_volume TĂNG
 *  I. validate.js: chấp nhận FX hợp lệ, từ chối FX sai
 *  J. buildAudioEffectsFilters: unit check chuỗi filter
 *  K. FX kết hợp (bass+treble+reverb) → render OK
 *
 * Chạy: node test_audiofx.js
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-audiofx-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function ff(args, opts = {}) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], opts);
}

// ---- 1. Tạo media test ----
console.log("== Tạo media test ==");
ff(["-y", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=4:r=30", "-pix_fmt", "yuv420p",
  path.join(MEDIA, "black.mp4")]);
// mix.wav: 100Hz + 8kHz (0.3) + white noise (0.08) — cho bass/treble/reverb
ff(["-y",
  "-f", "lavfi", "-i", "sine=frequency=100:duration=4:sample_rate=48000",
  "-f", "lavfi", "-i", "sine=frequency=8000:duration=4:sample_rate=48000",
  "-f", "lavfi", "-i", "anoisesrc=d=4:c=white:r=48000:a=0.08:seed=42",
  "-filter_complex", "[1:a]volume=0.3[hk];[0:a][hk][2:a]amix=inputs=3:duration=first:dropout_transition=0[m]",
  "-map", "[m]", "-ar", "48000", "-ac", "2", path.join(MEDIA, "mix.wav")]);
// speechlike.wav: 200Hz + white noise (0.15) — cho noise reduction
ff(["-y",
  "-f", "lavfi", "-i", "sine=frequency=200:duration=4:sample_rate=48000",
  "-f", "lavfi", "-i", "anoisesrc=d=4:c=white:r=48000:a=0.15:seed=7",
  "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0[m]",
  "-map", "[m]", "-ar", "48000", "-ac", "2", path.join(MEDIA, "speechlike.wav")]);
// loud.wav: 100Hz + white noise (0.3) — cho compressor (cần tín hiệu to để nén)
ff(["-y",
  "-f", "lavfi", "-i", "sine=frequency=100:duration=4:sample_rate=48000",
  "-f", "lavfi", "-i", "anoisesrc=d=4:c=white:r=48000:a=0.3:seed=7",
  "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0[m]",
  "-map", "[m]", "-ar", "48000", "-ac", "2", path.join(MEDIA, "loud.wav")]);
// video có audio kế thừa — cho case H
ff(["-y",
  "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=4:r=30",
  "-f", "lavfi", "-i", "sine=frequency=100:duration=4:sample_rate=48000",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
  path.join(MEDIA, "vawa.mp4")]);

function specWith(tracks) {
  return {
    version: "0.2.0",
    meta: { name: "audiofx-test", width: 320, height: 240, fps: 30, duration: 4 },
    tracks,
  };
}
const vclip = (id, src, extra = {}) =>
  ({ kind: "video", id, src, start: 0, duration: 4, in: 0, out: 4, ...extra });
const aclip = (id, src, extra = {}) =>
  ({ kind: "audio", id, src, start: 0, duration: 4, in: 0, out: 4, ...extra });

function render(spec, outName) {
  const specPath = path.join(WORK, outName + ".json");
  const outPath = path.join(WORK, outName + ".mp4");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const r = spawnSync("node", [path.join(HERE, "src", "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA, "-y", "-q"],
    { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`render ${outName} fail: ${(r.stderr || "").slice(-500)}`);
  return outPath;
}
function volumes(mp4) {
  const r = spawnSync("ffmpeg",
    ["-hide_banner", "-i", mp4, "-af", "volumedetect", "-vn", "-sn", "-dn", "-f", "null", "-"],
    { encoding: "utf8" });
  const out = (r.stderr || "").toString();
  const mean = /mean_volume:\s*(-?inf|[\d.-]+)\s*dB/.exec(out);
  const max = /max_volume:\s*(-?inf|[\d.-]+)\s*dB/.exec(out);
  return {
    mean: mean ? parseFloat(mean[1]) : NaN,
    max: max ? parseFloat(max[1]) : NaN,
  };
}
function hasAudioStream(mp4) {
  try {
    const r = execFileSync("ffprobe", ["-hide_banner", "-loglevel", "error",
      "-select_streams", "a", "-show_entries", "stream=codec_name", "-of", "csv=p=0", mp4],
      { encoding: "utf8" });
    return r.toString().trim().length > 0;
  } catch { return false; }
}

// ---- Case A: baseline ----
console.log("== Case A: baseline (không FX) ==");
const baseOut = render(specWith([
  { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
  { id: "a1", kind: "audio", clips: [aclip("c2", "mix.wav")] },
]), "caseA");
const base = volumes(baseOut);
ok("baseline có audio", hasAudioStream(baseOut));
ok(`baseline mean_volume đo được (${base.mean} dB)`, Number.isFinite(base.mean));
console.log(`   baseline: mean=${base.mean}dB max=${base.max}dB`);

// ---- Case B: bass +12 ----
console.log("== Case B: bass=+12dB ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    { id: "a1", kind: "audio", clips: [aclip("c2", "mix.wav", { audioEffects: { bass: 12 } })] },
  ]), "caseB");
  const v = volumes(out);
  ok(`bass +12 → mean TĂNG > 2dB (baseline ${base.mean} → ${v.mean})`,
    v.mean > base.mean + 2, `nhận: ${v.mean}`);
}

// ---- Case C: bass -12 ----
console.log("== Case C: bass=-12dB ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    { id: "a1", kind: "audio", clips: [aclip("c2", "mix.wav", { audioEffects: { bass: -12 } })] },
  ]), "caseC");
  const v = volumes(out);
  ok(`bass -12 → mean GIẢM > 1dB (baseline ${base.mean} → ${v.mean})`,
    v.mean < base.mean - 1, `nhận: ${v.mean}`);
}

// ---- Case D: treble +12 ----
console.log("== Case D: treble=+12dB ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    { id: "a1", kind: "audio", clips: [aclip("c2", "mix.wav", { audioEffects: { treble: 12 } })] },
  ]), "caseD");
  const v = volumes(out);
  ok(`treble +12 → mean TĂNG > 1dB (baseline ${base.mean} → ${v.mean})`,
    v.mean > base.mean + 1, `nhận: ${v.mean}`);
}

// ---- Case E: noise reduction ----
console.log("== Case E: noiseReduction=1 ==");
const nrBaseOut = render(specWith([
  { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
  { id: "a1", kind: "audio", clips: [aclip("c2", "speechlike.wav")] },
]), "caseEbase");
const nrBase = volumes(nrBaseOut);
console.log(`   speechlike baseline: mean=${nrBase.mean}dB`);
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    { id: "a1", kind: "audio", clips: [aclip("c2", "speechlike.wav", { audioEffects: { noiseReduction: 1 } })] },
  ]), "caseE");
  const v = volumes(out);
  ok(`noiseReduction=1 → mean GIẢM > 0.5dB (baseline ${nrBase.mean} → ${v.mean})`,
    v.mean < nrBase.mean - 0.5, `nhận: ${v.mean}`);
}

// ---- Case F: compressor ----
console.log("== Case F: compressor ==");
const compBaseOut = render(specWith([
  { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
  { id: "a1", kind: "audio", clips: [aclip("c2", "loud.wav")] },
]), "caseFbase");
const compBase = volumes(compBaseOut);
console.log(`   loud baseline: mean=${compBase.mean}dB max=${compBase.max}dB`);
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    {
      id: "a1", kind: "audio", clips: [aclip("c2", "loud.wav", {
        audioEffects: { compressor: { thresholdDb: -30, ratio: 10, attackMs: 20, releaseMs: 250 } },
      })],
    },
  ]), "caseF");
  const v = volumes(out);
  ok(`compressor → mean GIẢM > 2dB (baseline ${compBase.mean} → ${v.mean})`,
    v.mean < compBase.mean - 2, `nhận: ${v.mean}`);
}

// ---- Case G: reverb ----
console.log("== Case G: reverb=1 ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    { id: "a1", kind: "audio", clips: [aclip("c2", "mix.wav", { audioEffects: { reverb: 1 } })] },
  ]), "caseG");
  const v = volumes(out);
  ok(`reverb=1 → mean TĂNG > 1dB (baseline ${base.mean} → ${v.mean})`,
    v.mean > base.mean + 1, `nhận: ${v.mean}`);
}

// ---- Case H: video clip audioEffects (tiếng kế thừa) ----
console.log("== Case H: video clip audioEffects (inherit) ==");
const inhBaseOut = render(specWith([
  { id: "v1", kind: "video", clips: [vclip("c1", "vawa.mp4")] },
]), "caseHbase");
const inhBase = volumes(inhBaseOut);
console.log(`   inherit baseline: mean=${inhBase.mean}dB`);
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "vawa.mp4", { audioEffects: { bass: 12 } })] },
  ]), "caseH");
  const v = volumes(out);
  ok(`video audioEffects.bass=12 → mean TĂNG > 1dB (baseline ${inhBase.mean} → ${v.mean})`,
    v.mean > inhBase.mean + 1, `nhận: ${v.mean}`);
}

// ---- Case I: validate.js ----
console.log("== Case I: validate.js ==");
{
  const { validateSpec } = require("./src/validate.js");
  const mkSpec = (audioEffects) => specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    { id: "a1", kind: "audio", clips: [aclip("c2", "mix.wav", { audioEffects })] },
  ]);
  const good = validateSpec(mkSpec({ bass: 6, treble: -3, noiseReduction: 0.5, reverb: 0.7, compressor: { thresholdDb: -20, ratio: 4 } }));
  ok("FX hợp lệ → validate pass", good.ok, JSON.stringify(good.errors));
  const badBass = validateSpec(mkSpec({ bass: 99 }));
  ok("bass=99 → validate báo lỗi", !badBass.ok);
  const badNr = validateSpec(mkSpec({ noiseReduction: 2 }));
  ok("noiseReduction=2 → validate báo lỗi", !badNr.ok);
  const badComp = validateSpec(mkSpec({ compressor: { thresholdDb: "cao" } }));
  ok("compressor.thresholdDb sai kiểu → validate báo lỗi", !badComp.ok);
  const badType = validateSpec(mkSpec("loud"));
  ok("audioEffects sai kiểu → validate báo lỗi", !badType.ok);
}

// ---- Case J: buildAudioEffectsFilters unit ----
console.log("== Case J: buildAudioEffectsFilters ==");
{
  const { buildAudioEffectsFilters, hasAudioEffects } = require("./src/audioroute.js");
  ok("undefined → \"\"", buildAudioEffectsFilters(undefined) === "");
  ok("{} → \"\"", buildAudioEffectsFilters({}) === "");
  ok("không FX → hasAudioEffects false", hasAudioEffects({ bass: 0 }) === false);
  const s1 = buildAudioEffectsFilters({ bass: 6, treble: -3 });
  ok("bass+treble → đúng chuỗi", s1 === ",bass=g=6,treble=g=-3", `nhận: ${s1}`);
  const s2 = buildAudioEffectsFilters({ noiseReduction: 1 });
  ok("noiseReduction=1 → afftdn nr=24 nf=-25", s2 === ",afftdn=nr=24:nf=-25", `nhận: ${s2}`);
  const s3 = buildAudioEffectsFilters({ compressor: {} });
  ok("compressor mặc định → acompressor threshold=0.1 ratio=4",
    s3 === ",acompressor=threshold=0.1:ratio=4:attack=20:release=250", `nhận: ${s3}`);
  const s4 = buildAudioEffectsFilters({ reverb: 1 });
  ok("reverb=1 → aecho 3 taps decays 0.6|0.4|0.3",
    s4 === ",aecho=in_gain=0.8:out_gain=0.9:delays=30|60|120:decays=0.6|0.4|0.3", `nhận: ${s4}`);
  const s5 = buildAudioEffectsFilters({ bass: 6, reverb: 0.5 });
  ok("thứ tự: bass trước reverb",
    s5.indexOf("bass") < s5.indexOf("aecho"), `nhận: ${s5}`);
}

// ---- Case K: FX kết hợp ----
console.log("== Case K: FX kết hợp ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "black.mp4")] },
    {
      id: "a1", kind: "audio", clips: [aclip("c2", "mix.wav", {
        audioEffects: { bass: 6, treble: 6, reverb: 0.5 },
      })],
    },
  ]), "caseK");
  const v = volumes(out);
  ok("FX kết hợp render OK, audio thay đổi rõ",
    hasAudioStream(out) && v.mean > base.mean + 1, `mean=${v.mean} (baseline ${base.mean})`);
}

console.log(`\n==========================================`);
console.log(`${fail === 0 ? "🎉" : "💥"} AUDIOFX: ${pass} pass, ${fail} fail`);
console.log(`==========================================`);
process.exit(fail === 0 ? 0 : 1);
