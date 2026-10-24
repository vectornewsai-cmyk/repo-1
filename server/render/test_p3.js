#!/usr/bin/env node
/**
 * test_p3.js — Kiểm chứng Phase 7 P3 (speed curve + audio mixer) bằng render THẬT.
 *
 * Case:
 *  A. Unit speedramp.js: speedAt / integrateSpeed / planSpeedSegments (giá trị giải tích)
 *  B. Parity: render CJS (speedramp.js) vs spec TS (speedcurve.ts) vs ESM mirror
 *     (speedcurve.js) — cùng 1 bộ curve ngẫu nhiên, sai số < 1e-9.
 *     (Parity TS cần node --experimental-strip-types; không có flag → SKIP, không fail.)
 *  C. Unit audiomix.js: buildGainFilter (nội dung expr), buildNormalizeFilter
 *  D. Validate (qua validateSpec trực tiếp): ramp hợp lệ; reverse+ramp → lỗi;
 *     speed+ramp → warn; bezier sai → lỗi; ramp+stabilize → lỗi; track.volume
 *     ngoài 0..2 → lỗi; fadeCurve sai → lỗi; volumeKeyframes không còn warn cũ.
 *  E. Render thật:
 *     E1. Ramp video: nguồn đỏ 0–3.5s + xanh 3.5–7s, curve 1→2 tuyến tính trên 4s
 *         output → frame t=2.0 đỏ, t=3.0 xanh (mapping nguồn đúng, không chỉ duration).
 *     E2. Ramp A/V đồng bộ: clip video+audio cùng ramp → 2 stream ≈ 4s, lệch < 0.15s.
 *     E3. Hằng số hồi quy: speed=2, duration 4 → nguồn 8s, output đúng 4s.
 *     E4. volumeKeyframes render: tone 1→0.25 tuyến tính, đo volumedetect theo cửa sổ.
 *     E5. Fade cong: sine vs linear ở p=0.25 chênh ~3.7 dB (đo được).
 *     E6. Track volume 0.5 → -6.02 dB so với baseline.
 *     E7. Loudnorm: tone về target -14 LUFS, đo bằng ebur128, sai số ±1.5 LU.
 *     E8. Dynaudnorm: render được, đúng duration (smoke test).
 *     E9. Ramp + xfade transition: render được, đúng duration tổng.
 *     E10. Validator qua CLI: spec reverse+ramp → render exit != 0.
 *
 * Chạy: node test_p3.js
 *       node --experimental-strip-types test_p3.js   (thêm parity TS, khuyến nghị)
 * Media test nhỏ (64×64, vài giây) để vừa tmpfs /tmp.
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-p3-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0, skip = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function skipIt(name, reason) {
  skip++; console.log(`  ⏭️  ${name} (skip: ${reason})`);
}
function ff(args) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);
}
function ffProbe(file) {
  const out = execFileSync("ffprobe", ["-v", "quiet", "-print_format", "json",
    "-show_streams", "-show_format", file], { encoding: "utf8" });
  return JSON.parse(out);
}
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }

/** Render 1 spec qua render.js CLI. Trả về { ok, code, stderr }. */
function renderSpec(spec, outName) {
  const specPath = path.join(WORK, `spec-${outName}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(WORK, `${outName}.mp4`);
  const r = spawnSync(process.execPath, [
    path.join(HERE, "src", "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
    "--crf", "28", "--x264-preset", "ultrafast", "-y", "-q",
  ], { encoding: "utf8" });
  return { ok: r.status === 0, code: r.status, stderr: (r.stderr || "") + (r.stdout || ""), outPath };
}

function baseSpec(tracks) {
  return {
    version: "0.2.0",
    meta: { name: "P3 test", width: 64, height: 64, fps: 30 },
    tracks,
  };
}
function videoTrack(clips, extra = {}) {
  return { id: "v1", kind: "video", clips, ...extra };
}
function audioTrack(clips, extra = {}) {
  return { id: "a1", kind: "audio", clips, ...extra };
}

// ===========================================================================
// A. Unit speedramp.js
// ===========================================================================
console.log("== A. Unit speedramp.js ==");
const sr = require("./src/speedramp");
{
  const lin = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ] };
  ok("speedAt linear giữa đoạn = 1.5", approx(sr.speedAt(lin, 2), 1.5, 1e-9));
  ok("integrate linear 1→2 / 4s = 6", approx(sr.integrateSpeed(lin, 0, 4), 6, 1e-9));
  const ein = { keyframes: [
    { t: 0, v: 1, easing: "ease-in" },
    { t: 4, v: 2, easing: "ease-in" },
  ] };
  ok("integrate ease-in 1→2 / 4s = 5.3333", approx(sr.integrateSpeed(ein, 0, 4), 16 / 3, 1e-9));
  const eout = { keyframes: [
    { t: 0, v: 1, easing: "ease-out" },
    { t: 4, v: 2, easing: "ease-out" },
  ] };
  ok("integrate ease-out 1→2 / 4s = 6.6667", approx(sr.integrateSpeed(eout, 0, 4), 20 / 3, 1e-9));
  const bz = { keyframes: [
    { t: 0, v: 1, easing: "bezier", bezier: [0.42, 0, 0.58, 1] },
    { t: 2, v: 3, easing: "bezier", bezier: [0.42, 0, 0.58, 1] },
  ] };
  ok("bezier đối xứng: speedAt(1) = 2", approx(sr.speedAt(bz, 1), 2, 1e-6));
  ok("bezier đối xứng: integrate = 4", approx(sr.integrateSpeed(bz, 0, 2), 4, 1e-4));
  ok("clamp trước keyframe đầu", sr.speedAt(lin, -1) === 1);
  ok("clamp sau keyframe cuối", sr.speedAt(lin, 99) === 2);
  ok("1 keyframe → hằng", sr.speedAt({ keyframes: [{ t: 0, v: 2.5, easing: "linear" }] }, 3) === 2.5);
  const segs = sr.planSpeedSegments(lin, 4);
  ok("planSegments: tổng outDur = duration",
    approx(segs.reduce((a, s) => a + s.outDur, 0), 4, 1e-9));
  ok("planSegments: tổng srcDur ≈ consumed (sai số midpoint < 0.02)",
    approx(segs.reduce((a, s) => a + s.srcDur, 0), 6, 0.02));
  ok("planSegments: ≤ 240 đoạn cho clip 100s",
    sr.planSpeedSegments(lin, 100).length <= 240);
  ok("planSegments: đoạn ~0.2s cho clip 4s", segs.length === 20, `nhận ${segs.length}`);
  ok("sourceConsumed = integrate(0, duration)",
    approx(sr.sourceConsumed(lin, 4), 6, 1e-9));
}

// ===========================================================================
// B. Parity CJS vs spec (TS + ESM mirror) — cần chạy trong hàm async
// ===========================================================================
async function parity() {
  console.log("== B. Parity speedramp CJS vs spec ==");
  const curves = [
    { keyframes: [
      { t: 0, v: 0.5, easing: "linear" },
      { t: 1.5, v: 2, easing: "ease-in" },
      { t: 3, v: 1, easing: "ease-out" },
      { t: 5, v: 4, easing: "bezier", bezier: [0.1, 0.7, 0.9, 0.2] },
    ] },
    { keyframes: [
      { t: 0, v: 3, easing: "ease-out" },
      { t: 2.5, v: 0.25, easing: "linear" },
    ] },
    { keyframes: [{ t: 0, v: 1.75, easing: "linear" }] },
  ];
  const times = [0, 0.3, 1.5, 2.7, 4.2, 5, 7];
  // ESM mirror luôn import được (file .js thuần).
  // test_p3.js nằm ở server/render/ → packages ở ../../packages.
  const SPEC_DIR = path.join(HERE, "..", "..", "packages", "video-spec", "src");
  let mirror = null;
  try {
    mirror = await import(path.join(SPEC_DIR, "speedcurve.js"));
  } catch (e) {
    skipIt("parity ESM mirror", `không import được: ${e.message}`);
  }
  if (mirror) {
    let allOk = true;
    for (const c of curves) {
      for (const t of times) {
        if (!approx(sr.speedAt(c, t), mirror.speedAt(c, t), 1e-9)) allOk = false;
        if (!approx(sr.integrateSpeed(c, 0, t), mirror.integrateSpeed(c, 0, t), 1e-9)) allOk = false;
      }
      const a = sr.planSpeedSegments(c, 5);
      const b = mirror.planSpeedSegments(c, 5);
      if (a.length !== b.length) allOk = false;
      for (let i = 0; i < a.length && allOk; i++) {
        if (!approx(a[i].speed, b[i].speed, 1e-9) || !approx(a[i].srcStart, b[i].srcStart, 1e-9)) allOk = false;
      }
    }
    ok("parity CJS vs ESM mirror (speedAt/integrate/planSegments)", allOk);
  }
  // TS gốc: cần type stripping (node --experimental-strip-types).
  try {
    const ts = await import(path.join(SPEC_DIR, "speedcurve.ts"));
    let allOk = true;
    for (const c of curves) {
      for (const t of times) {
        if (!approx(sr.speedAt(c, t), ts.speedAt(c, t), 1e-9)) allOk = false;
        if (!approx(sr.integrateSpeed(c, 0, t), ts.integrateSpeed(c, 0, t), 1e-9)) allOk = false;
      }
    }
    ok("parity CJS vs TS gốc (speedAt/integrate)", allOk);
  } catch (e) {
    skipIt("parity TS gốc", "chạy với node --experimental-strip-types để bật");
  }
}

// ===========================================================================
// C. Unit audiomix.js
// ===========================================================================
function unitAudioMix() {
  console.log("== C. Unit audiomix.js ==");
  const am = require("./src/audiomix");
  ok("fadeCurveFactor sine(0.25) = sin(pi/8)", approx(am.fadeCurveFactor("sine", 0.25), Math.sin(Math.PI / 8), 1e-9));
  ok("fadeCurveFactor ease-in(0.5) = 0.25", am.fadeCurveFactor("ease-in", 0.5) === 0.25);
  ok("fadeCurveFactor ease-out(0.5) = 0.75", am.fadeCurveFactor("ease-out", 0.5) === 0.75);
  ok("không keyframes + fade linear → null (giữ đường cũ)",
    am.buildGainFilter({ duration: 4, volume: 0.8 }) === null);
  const g = am.buildGainFilter({
    duration: 4, volume: 1, fadeIn: 2, fadeOut: 2,
    fadeInCurve: "sine", fadeOutCurve: "ease-in",
    volumeKeyframes: { keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 0.5, easing: "linear" },
    ] },
  }, 0.5);
  ok("gain expr chứa eval=frame", !!g && g.includes("eval=frame"));
  ok("gain expr chứa sin (fade sine)", !!g && g.includes("sin("));
  ok("gain expr chứa trackVolume 0.5", !!g && g.includes("*0.5"));
  ok("gain expr có max(0,...) chống âm", !!g && g.includes("max(0,"));
  ok("loudnorm filter đúng target", am.buildNormalizeFilter({ mode: "loudnorm" }) === "loudnorm=I=-14:TP=-1.5:LRA=11");
  ok("loudnorm custom target", am.buildNormalizeFilter({ mode: "loudnorm", target: -23, tp: -2, lra: 7 }) === "loudnorm=I=-23:TP=-2:LRA=7");
  ok("dynaudnorm filter", am.buildNormalizeFilter({ mode: "dynaudnorm" }) === "dynaudnorm=f=150:g=15");
  ok("off → null", am.buildNormalizeFilter({ mode: "off" }) === null);
}

// ===========================================================================
// D. Validate qua validateSpec
// ===========================================================================
function unitValidate() {
  console.log("== D. Validate (validateSpec) ==");
  const { validateSpec } = require("./src/validate");
  const rampClip = (over = {}) => ({
    id: "c1", kind: "video", src: "av.mp4", start: 0, duration: 4, in: 0, out: 8,
    speedKeyframes: { keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 2, easing: "linear" },
    ] },
    ...over,
  });
  const specWith = (clip) => baseSpec([videoTrack([clip])]);
  const v1 = validateSpec(specWith(rampClip()));
  ok("ramp hợp lệ → ok (chỉ warn thông tin)", v1.ok, JSON.stringify(v1.errors));
  ok("ramp hợp lệ → có warn nguồn tiêu thụ",
    v1.warnings.some((w) => w.includes("nguồn tiêu thụ")));
  ok("reverse + ramp → lỗi",
    !validateSpec(specWith(rampClip({ reverse: true }))).ok);
  ok("bezier thiếu mảng 4 số → lỗi",
    !validateSpec(specWith(rampClip({ speedKeyframes: { keyframes: [
      { t: 0, v: 1, easing: "bezier" },
      { t: 4, v: 2, easing: "linear" },
    ] } }))).ok);
  ok("v ngoài 0.25..4 → lỗi",
    !validateSpec(specWith(rampClip({ speedKeyframes: { keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 5, easing: "linear" },
    ] } }))).ok);
  ok("ramp + stabilize → lỗi",
    !validateSpec(specWith(rampClip({ enhance: { stabilize: {} } }))).ok);
  const vSpeed = validateSpec(specWith(rampClip({ speed: 2 })));
  ok("speed + ramp → ok + warn speed bị bỏ qua",
    vSpeed.ok && vSpeed.warnings.some((w) => w.includes("speed hằng bị bỏ qua")));
  ok("track.volume = 2.5 → lỗi",
    !validateSpec(baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
    }], { volume: 2.5 })])).ok);
  ok("track.volume = 0.5 → ok",
    validateSpec(baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
    }], { volume: 0.5 })])).ok);
  ok("fadeInCurve sai → lỗi",
    !validateSpec(baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
      fadeIn: 1, fadeInCurve: "bounce",
    }])])).ok);
  const vKf = validateSpec(baseSpec([audioTrack([{
    id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
    volumeKeyframes: { keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 0.5, easing: "linear" },
    ] },
  }])]));
  ok("volumeKeyframes hợp lệ → ok, KHÔNG còn warn 'render chưa áp dụng'",
    vKf.ok && !vKf.warnings.some((w) => w.includes("render worker chưa áp dụng")));
}

// ===========================================================================
// E. Render thật — chuẩn bị media
// ===========================================================================
function makeMedia() {
  console.log("== E. Chuẩn bị media ==");
  // Nguồn đỏ 0–3.5s + xanh 3.5–7s (64×64, 30fps). Dư 1s so với mức tiêu thụ
  // ramp 6s để không chạm biên kiểm tra out ≤ độ dài file của validateMedia.
  ff(["-f", "lavfi", "-i", "color=c=red:s=64x64:r=30:d=3.5",
      "-f", "lavfi", "-i", "color=c=blue:s=64x64:r=30:d=3.5",
      "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", path.join(MEDIA, "redblue.mp4")]);
  // Tone 1000 Hz, 8s, mức -12 dBFS (volume=0.25) — đủ headroom cho đo.
  ff(["-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=48000:duration=8",
      "-af", "volume=0.25", "-y", path.join(MEDIA, "tone.wav")]);
  // Nguồn A/V: hình đỏ + tone (8s).
  ff(["-f", "lavfi", "-i", "color=c=red:s=64x64:r=30:d=8",
      "-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=48000:duration=8",
      "-af", "volume=0.25", "-shortest",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-y", path.join(MEDIA, "av.mp4")]);
  ok("media đã tạo", fs.existsSync(path.join(MEDIA, "redblue.mp4")) &&
    fs.existsSync(path.join(MEDIA, "tone.wav")) && fs.existsSync(path.join(MEDIA, "av.mp4")));
}

/** Đọc 1 frame tại t giây, trả về { r, g, b } trung bình (PPM P6). */
function frameMeanRGB(file, t) {
  const buf = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error",
    "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "image2pipe",
    "-vcodec", "ppm", "-"]);
  // Parse P6: "P6\n<W> <H>\n<max>\n" rồi RGB bytes.
  let i = 0;
  const readToken = () => {
    while (buf[i] === 0x0a || buf[i] === 0x20 || buf[i] === 0x23) {
      if (buf[i] === 0x23) while (buf[i] !== 0x0a) i++;
      else i++;
    }
    let s = "";
    while (buf[i] !== 0x0a && buf[i] !== 0x20) s += String.fromCharCode(buf[i++]);
    return s;
  };
  const magic = readToken();
  const w = parseInt(readToken(), 10);
  const h = parseInt(readToken(), 10);
  readToken(); // maxval
  i++; // 1 byte whitespace sau maxval
  if (magic !== "P6" || !w || !h) throw new Error(`PPM parse lỗi: ${magic} ${w}x${h}`);
  let r = 0, g = 0, b = 0;
  const n = w * h;
  for (let p = 0; p < n; p++) {
    r += buf[i + p * 3]; g += buf[i + p * 3 + 1]; b += buf[i + p * 3 + 2];
  }
  return { r: r / n, g: g / n, b: b / n };
}

/** Đo mean_volume (dB) của 1 file audio trong cửa sổ [start, end) — volumedetect in stderr. */
function windowMeanDb2(file, start, end) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file,
    "-af", `atrim=start=${start}:end=${end},volumedetect`, "-f", "null", "-"],
    { encoding: "utf8" });
  const m = /mean_volume:\s*(-?[\d.]+) dB/.exec(r.stderr || "");
  return m ? parseFloat(m[1]) : NaN;
}

/** Đo integrated loudness (LUFS) bằng ebur128. */
function measureLUFS(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file,
    "-af", "ebur128=framelog=verbose", "-f", "null", "-"], { encoding: "utf8" });
  const m = /Integrated loudness:\s*I:\s*(-?[\d.]+) LUFS/.exec(r.stderr || "");
  return m ? parseFloat(m[1]) : NaN;
}

function renderTests() {
  console.log("== E. Render thật ==");
  // E1: ramp video — curve 1→2 tuyến tính trên 4s output.
  // Nguồn tiêu thụ = 6s; đoạn đỏ 0–3.5s nguồn, xanh 3.5–7s nguồn.
  // speed(t)=1+t/4 → src(t)=t+t²/8; src=3.5 ⇔ t≈2.633s.
  // Vậy frame t=2.0 phải đỏ (src≈2.5), t=3.0 phải xanh (src≈4.125).
  {
    const spec = baseSpec([videoTrack([{
      id: "c1", kind: "video", src: "redblue.mp4", start: 0, duration: 4, in: 0, out: 6,
      speedKeyframes: { keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 4, v: 2, easing: "linear" },
      ] },
    }])]);
    const r = renderSpec(spec, "ramp");
    ok("E1 ramp render ok", r.ok, r.stderr.slice(-300));
    if (r.ok) {
      const probe = ffProbe(r.outPath);
      const v = probe.streams.find((s) => s.codec_type === "video");
      ok("E1 duration video ≈ 4s", approx(parseFloat(v.duration), 4, 0.15), `nhận ${v.duration}`);
      const f20 = frameMeanRGB(r.outPath, 2.0);
      const f30 = frameMeanRGB(r.outPath, 3.0);
      ok("E1 frame t=2.0 đỏ (R cao, B thấp)", f20.r > 150 && f20.b < 100, JSON.stringify(f20));
      ok("E1 frame t=3.0 xanh (B cao, R thấp)", f30.b > 150 && f30.r < 100, JSON.stringify(f30));
    }
  }
  // E2: ramp A/V đồng bộ — cùng curve trên clip video có audio.
  {
    const spec = baseSpec([videoTrack([{
      id: "c1", kind: "video", src: "av.mp4", start: 0, duration: 4, in: 0, out: 8,
      speedKeyframes: { keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 4, v: 2, easing: "linear" },
      ] },
    }])]);
    const r = renderSpec(spec, "rampav");
    ok("E2 ramp A/V render ok", r.ok, r.stderr.slice(-300));
    if (r.ok) {
      const probe = ffProbe(r.outPath);
      const v = probe.streams.find((s) => s.codec_type === "video");
      const a = probe.streams.find((s) => s.codec_type === "audio");
      ok("E2 video ≈ 4s", approx(parseFloat(v.duration), 4, 0.15), `nhận ${v.duration}`);
      ok("E2 audio ≈ 4s", approx(parseFloat(a.duration), 4, 0.15), `nhận ${a.duration}`);
      ok("E2 A/V lệch < 0.15s",
        Math.abs(parseFloat(v.duration) - parseFloat(a.duration)) < 0.15,
        `video=${v.duration} audio=${a.duration}`);
    }
  }
  // E3: hồi quy speed hằng.
  {
    const spec = baseSpec([videoTrack([{
      id: "c1", kind: "video", src: "av.mp4", start: 0, duration: 4, in: 0, out: 8, speed: 2,
    }])]);
    const r = renderSpec(spec, "constspeed");
    ok("E3 speed hằng render ok", r.ok, r.stderr.slice(-300));
    if (r.ok) {
      const probe = ffProbe(r.outPath);
      const v = probe.streams.find((s) => s.codec_type === "video");
      ok("E3 duration ≈ 4s", approx(parseFloat(v.duration), 4, 0.15), `nhận ${v.duration}`);
    }
  }
  // E4: volumeKeyframes render — tone 1→0.25 tuyến tính trên 4s.
  // gain(t) = 1-0.1875·t. Cửa sổ sớm [0.2,0.4] gain giữa ≈ 0.94375;
  // cửa sổ muộn [3.6,3.8] gain giữa ≈ 0.30625; tỉ số 3.0816 → chênh ≈ 9.78 dB
  // (đo chênh lệch để khử mức tuyệt đối của tone gốc).
  {
    const spec = baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
      volumeKeyframes: { keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 4, v: 0.25, easing: "linear" },
      ] },
    }])]);
    const r = renderSpec(spec, "vkf");
    ok("E4 volumeKeyframes render ok", r.ok, r.stderr.slice(-300));
    if (r.ok) {
      const dEarly = windowMeanDb2(r.outPath, 0.2, 0.4);
      const dLate = windowMeanDb2(r.outPath, 3.6, 3.8);
      ok("E4 đo được 2 cửa sổ", Number.isFinite(dEarly) && Number.isFinite(dLate), `${dEarly} / ${dLate}`);
      ok("E4 chênh sớm–muộn ≈ 9.78 dB (±1.5)",
        approx(dEarly - dLate, 9.78, 1.5), `sớm=${dEarly} muộn=${dLate} chênh=${dEarly - dLate}`);
    }
  }
  // E5: fade cong — sine vs linear, fadeIn 2s, đo cửa sổ 0.4–0.6s (p≈0.25).
  // linear: gain 0.25 → -12.04 dB; sine: sin(0.25·π/2)=0.383 → -8.34 dB; chênh ≈ 3.7 dB.
  {
    const mk = (curve) => baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
      fadeIn: 2, fadeInCurve: curve,
    }])]);
    const rLin = renderSpec(mk("linear"), "fadlin");
    const rSin = renderSpec(mk("sine"), "fadsin");
    ok("E5 fade linear+sine render ok", rLin.ok && rSin.ok);
    if (rLin.ok && rSin.ok) {
      const dLin = windowMeanDb2(rLin.outPath, 0.4, 0.6);
      const dSin = windowMeanDb2(rSin.outPath, 0.4, 0.6);
      ok("E5 đo được 2 fade", Number.isFinite(dLin) && Number.isFinite(dSin), `${dLin} / ${dSin}`);
      ok("E5 sine to hơn linear ≈ 3.7 dB (±1.5)",
        approx(dSin - dLin, 3.7, 1.5), `linear=${dLin} sine=${dSin} chênh=${dSin - dLin}`);
    }
  }
  // E6: track volume 0.5 → -6.02 dB so với baseline (cùng tone, không volume).
  {
    const base = renderSpec(baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
    }])]), "trkbase");
    const half = renderSpec(baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
    }], { volume: 0.5 })]), "trkhalf");
    ok("E6 track volume render ok", base.ok && half.ok);
    if (base.ok && half.ok) {
      const dBase = windowMeanDb2(base.outPath, 1, 3);
      const dHalf = windowMeanDb2(half.outPath, 1, 3);
      ok("E6 track 0.5 → -6.02 dB (±1.0)",
        approx(dHalf - dBase, -6.02, 1.0), `base=${dBase} half=${dHalf} chênh=${dHalf - dBase}`);
    }
  }
  // E7: loudnorm về -14 LUFS (đo bằng ebur128).
  {
    const spec = baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
    }])]);
    const specPath = path.join(WORK, "spec-norm.json");
    fs.writeFileSync(specPath, JSON.stringify(spec));
    const outPath = path.join(WORK, "norm.mp4");
    const r = spawnSync(process.execPath, [
      path.join(HERE, "src", "render.js"),
      "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
      "--crf", "28", "--x264-preset", "ultrafast",
      "--normalize", "loudnorm", "--normalize-target", "-14", "-y", "-q",
    ], { encoding: "utf8" });
    ok("E7 loudnorm render ok", r.status === 0, (r.stderr || "").slice(-300));
    if (r.status === 0) {
      const lufs = measureLUFS(outPath);
      ok("E7 đo được LUFS", Number.isFinite(lufs), `nhận ${lufs}`);
      ok("E7 integrated ≈ -14 LUFS (±1.5)", approx(lufs, -14, 1.5), `nhận ${lufs}`);
    }
  }
  // E8: dynaudnorm smoke test.
  {
    const spec = baseSpec([audioTrack([{
      id: "a1", kind: "audio", src: "tone.wav", start: 0, duration: 4, in: 0, out: 4,
    }])]);
    const specPath = path.join(WORK, "spec-dyn.json");
    fs.writeFileSync(specPath, JSON.stringify(spec));
    const outPath = path.join(WORK, "dyn.mp4");
    const r = spawnSync(process.execPath, [
      path.join(HERE, "src", "render.js"),
      "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
      "--crf", "28", "--x264-preset", "ultrafast",
      "--normalize", "dynaudnorm", "-y", "-q",
    ], { encoding: "utf8" });
    ok("E8 dynaudnorm render ok", r.status === 0, (r.stderr || "").slice(-300));
    if (r.status === 0) {
      const probe = ffProbe(outPath);
      const a = probe.streams.find((s) => s.codec_type === "audio");
      ok("E8 duration ≈ 4s", approx(parseFloat(a.duration), 4, 0.15), `nhận ${a.duration}`);
    }
  }
  // E9: ramp + xfade transition. Transition lấy từ clip.transitionOut (validator
  // ghép cặp với clip kề ngay sau, KHÔNG có field spec.transitions).
  // c1 [0,4) ramp + transitionOut fade 0.5s; c2 [4,7).
  // LƯU Ý ngữ nghĩa có sẵn: project D = clip kết thúc muộn nhất = 7s (unit đã
  // merge dài 6.5s, output pad tới D=7 — giống hệt bản không ramp, đã đối chiếu).
  // Kiểm chứng xfade chạy thật bằng frame giữa đoạn chuyển: blend xanh+đỏ.
  {
    const spec = baseSpec([videoTrack([
      {
        id: "c1", kind: "video", src: "redblue.mp4", start: 0, duration: 4, in: 0, out: 6,
        transitionOut: { type: "fade", duration: 0.5 },
        speedKeyframes: { keyframes: [
          { t: 0, v: 1, easing: "linear" },
          { t: 4, v: 2, easing: "linear" },
        ] },
      },
      {
        id: "c2", kind: "video", src: "redblue.mp4", start: 4, duration: 3, in: 0, out: 3,
      },
    ])]);
    const r = renderSpec(spec, "rampxfade");
    ok("E9 ramp + xfade render ok", r.ok, r.stderr.slice(-500));
    if (r.ok) {
      const probe = ffProbe(r.outPath);
      const v = probe.streams.find((s) => s.codec_type === "video");
      ok("E9 duration ≈ 7s (bằng bản không ramp — D = clip kết thúc muộn nhất)",
        approx(parseFloat(v.duration), 7, 0.3), `nhận ${v.duration}`);
      // Giữa xfade (t=3.75): c1 ramp đang xanh (src≈5.5) blend với c2 đỏ → tím.
      const blend = frameMeanRGB(r.outPath, 3.75);
      ok("E9 frame giữa xfade là blend (R và B đều > 80)",
        blend.r > 80 && blend.b > 80, JSON.stringify(blend));
    }
  }
  // E10: CLI từ chối reverse + ramp.
  {
    const spec = baseSpec([videoTrack([{
      id: "c1", kind: "video", src: "redblue.mp4", start: 0, duration: 4, in: 0, out: 6,
      reverse: true,
      speedKeyframes: { keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 4, v: 2, easing: "linear" },
      ] },
    }])]);
    const r = renderSpec(spec, "badcombo");
    ok("E10 CLI từ chối reverse+ramp (exit != 0)", !r.ok, `exit=${r.code}`);
    ok("E10 thông báo lỗi nhắc tới reverse/speedKeyframes",
      /reverse|speedKeyframes/.test(r.stderr));
  }
}

(async () => {
  await parity();
  unitAudioMix();
  unitValidate();
  makeMedia();
  renderTests();
  console.log(`\n==== P3: ${pass} pass, ${fail} fail, ${skip} skip ====`);
  console.log(`Work dir: ${WORK} (giữ lại để soi khi fail)`);
  process.exit(fail > 0 ? 1 : 0);
})();
