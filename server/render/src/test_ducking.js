#!/usr/bin/env node
/**
 * test_ducking.js — Test THẬT audio ducking (nhạc tự nhỏ khi có lời thoại).
 *
 * Render bằng chính render.js (không mock):
 * - Nhạc nền: sine 440 Hz liên tục 8s, mức -9 dBFS RMS.
 * - Giọng: sine 880 Hz dạng burst ở (2,4)s và (6,8)s, khoảng lặng còn lại.
 *   Hai tần số khác nhau để đo riêng từng nhánh bằng DFT (cửa sổ 1s =
 *   số nguyên chu kỳ của cả 2 tần số nên không rò rỉ phổ).
 * - Spec video đen 320x240 8s + 2 track audio (music, voice).
 *
 * Kiểm chứng:
 *  A. Ducking BẬT: mức nhạc (bin 440 Hz) trong cửa sổ có giọng phải giảm
 *     ≥ 3 dB so với ducking TẮT; mức giọng (bin 880 Hz) gần như không đổi.
 *  B. Cửa sổ không có giọng: mức nhạc gần như không đổi (|Δ| < 1 dB).
 *  C. Dry-run: spec ducking bật nhưng voiceTrackId không tồn tại →
 *     filtergraph PHẢI y hệt spec tắt (không sidechaincompress) + có cảnh báo.
 *  D. Ducking bật với param sai khoảng (ratio=99) → render thất bại, lỗi rõ ràng.
 *  E. Spec tắt → filtergraph không chứa sidechaincompress.
 *
 * Đo mức bằng test_ducking_measure.py (DFT tại bin chính xác).
 * Cách chạy: node src/test_ducking.js (cần ffmpeg, python3 + numpy).
 * File tạm nằm trong os.tmpdir().
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-duck-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..");

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
function render(spec, name) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "-y"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  return { status: r.status, stderr: (r.stderr || "").toString(), outPath };
}
function dryRun(spec, name) {
  const specPath = path.join(work, `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", path.join(work, `${name}.mp4`),
    "--media-dir", mediaDir, "--dry-run"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  // Tách riêng stdout (lệnh ffmpeg/filtergraph) và stderr (cảnh báo):
  // so sánh graph chỉ dùng stdout, còn cảnh báo kiểm tra riêng.
  return { out: (r.stdout || "").toString(), err: (r.stderr || "").toString() };
}
function measure(mp4) {
  // Giải mã audio ra wav 48kHz mono rồi đo DFT bằng python.
  const wav = path.join(work, `${path.basename(mp4, ".mp4")}.wav`);
  run("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-vn", "-ac", "1", "-ar", "48000", wav], `giải mã ${mp4}`);
  const r = spawnSync("python3", [path.join(__dirname, "test_ducking_measure.py"), wav],
    { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(`❌ đo mức thất bại:\n${r.stderr}`);
    process.exit(2);
  }
  return JSON.parse(r.stdout);
}

// ---- Tạo media ----
// Nhạc: sine 440 Hz liên tục 8s, biên độ 0.5.
run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=8",
  "-af", "volume=0.5", "-ar", "48000", path.join(mediaDir, "music.wav")], "tạo nhạc");
// Giọng: burst 880 Hz ở (2,4)s và (6,8)s — gt(mod(t,4),2) = 1 đúng 2 cửa sổ đó.
run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i",
  "aevalsrc='0.5*sin(2*PI*880*t)*gt(mod(t,4),2)':duration=8:sample_rate=48000",
  "-ar", "48000", path.join(mediaDir, "voice.wav")], "tạo giọng burst");
// Video đen 320x240 8s (không có audio stream).
run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=320x240:d=8",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(mediaDir, "black.mp4")], "tạo video đen");

const specBase = (ducking) => ({
  version: "0.2.0",
  meta: { name: "duck-test", width: 320, height: 240, fps: 30 },
  tracks: [
    { id: "v", kind: "video", clips: [
      { id: "vc", kind: "video", src: "black.mp4", start: 0, duration: 8, in: 0, out: 8, sourceAudioMode: "mute" },
    ] },
    { id: "music", kind: "audio", clips: [
      { id: "mc", kind: "audio", src: "music.wav", start: 0, duration: 8, in: 0, out: 8 },
    ] },
    { id: "voice", kind: "audio", clips: [
      { id: "vc2", kind: "audio", src: "voice.wav", start: 0, duration: 8, in: 0, out: 8 },
    ] },
  ],
  ...(ducking ? { ducking } : {}),
});

// ---- A/B: tắt vs bật ----
const off = render(specBase(undefined), "off");
ok(off.status === 0, `render ducking TẮT thành công (mã ${off.status})`);
const duckingOn = {
  enabled: true, voiceTrackId: "voice",
  thresholdDb: -20, ratio: 4, attackMs: 20, releaseMs: 250, duckAmountDb: 12,
};
const on = render(specBase(duckingOn), "on");
ok(on.status === 0, `render ducking BẬT thành công (mã ${on.status})`);
if (off.status !== 0 || on.status !== 0) process.exit(2);

const mOff = measure(off.outPath);
const mOn = measure(on.outPath);
console.log("   mức đo (dBFS RMS, bin DFT):");
for (const w of ["voice1", "silence", "voice2"]) {
  console.log(`   - ${w}: nhạc TẮT=${mOff[w].music.toFixed(2)} BẬT=${mOn[w].music.toFixed(2)} | giọng TẮT=${mOff[w].voice.toFixed(2)} BẬT=${mOn[w].voice.toFixed(2)}`);
}
for (const w of ["voice1", "voice2"]) {
  const d = mOn[w].music - mOff[w].music;
  ok(d <= -3, `nhạc trong cửa sổ có giọng ${w} giảm ${(-d).toFixed(2)} dB (cần ≥ 3 dB)`);
  ok(Math.abs(mOn[w].voice - mOff[w].voice) < 1, `giọng trong ${w} gần như không đổi (Δ=${(mOn[w].voice - mOff[w].voice).toFixed(2)} dB)`);
}
ok(Math.abs(mOn.silence.music - mOff.silence.music) < 1,
  `nhạc trong cửa sổ lặng gần như không đổi (Δ=${(mOn.silence.music - mOff.silence.music).toFixed(2)} dB)`);

// ---- C: voiceTrackId không tồn tại → graph y hệt tắt ----
const graphOff = dryRun(specBase(undefined), "dry-off");
const graphBad = dryRun(specBase({ enabled: true, voiceTrackId: "khong-co" }), "dry-bad");
ok(!graphOff.out.includes("sidechaincompress"), "spec tắt: graph không có sidechaincompress");
ok(!graphBad.out.includes("sidechaincompress"), "voiceTrackId không tồn tại: graph không có sidechaincompress");
ok(graphBad.out.replace(/dry-bad/g, "X") === graphOff.out.replace(/dry-off/g, "X"),
  "voiceTrackId không tồn tại: filtergraph Y HỆT spec tắt (so sánh stdout dry-run)");
ok(graphBad.err.includes("ducking"), "voiceTrackId không tồn tại: có cảnh báo ducking trên stderr");

// ---- D: param sai khoảng → fail rõ ràng ----
const bad = render(specBase({ enabled: true, voiceTrackId: "voice", ratio: 99 }), "bad");
ok(bad.status !== 0, `ratio=99 → render thất bại (mã ${bad.status})`);
ok(bad.stderr.includes("ducking"), "ratio=99 → lỗi nhắc tới ducking");

// ---- E: spec bật có sidechaincompress trong graph ----
const graphOn = dryRun(specBase(duckingOn), "dry-on");
ok(graphOn.out.includes("sidechaincompress"), "spec bật: graph có sidechaincompress");
ok(graphOn.out.includes("threshold=0.1") && graphOn.out.includes("ratio=4"),
  "spec bật: threshold/ratio map đúng (threshold=0.1 cho -20 dB, ratio=4)");

console.log(`\n== test_ducking: ${pass} pass, ${fail} fail (tmp: ${work}) ==`);
process.exit(fail === 0 ? 0 : 1);
