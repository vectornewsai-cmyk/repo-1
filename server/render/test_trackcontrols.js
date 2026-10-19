#!/usr/bin/env node
/**
 * test_trackcontrols.js — Kiểm chứng R1-054 (track mute/lock/hide) bằng render THẬT.
 *
 * Case:
 *  A. audio track muted → output có audio stream nhưng CÂM (mean_volume -inf)
 *  B. đối chứng: audio track không mute → nghe được (mean_volume ≈ -24dB)
 *  C. video track hidden → frame chỉ còn track bên dưới (pixel xanh, không đỏ)
 *  D. video track muted → audio kế thừa từ file nguồn bị bỏ (câm)
 *  E. validate.js: chấp nhận flag boolean, từ chối flag sai kiểu
 *
 * Chạy: node test_trackcontrols.js
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-trackctl-"));
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
ff(["-y", "-f", "lavfi", "-i", "color=c=red:s=320x240:d=3:r=30", "-pix_fmt", "yuv420p", path.join(MEDIA, "red.mp4")]);
ff(["-y", "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=3:r=30", "-pix_fmt", "yuv420p", path.join(MEDIA, "blue.mp4")]);
ff(["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=3:sample_rate=48000", "-c:a", "aac", path.join(MEDIA, "tone.m4a")]);
ff(["-y",
  "-f", "lavfi", "-i", "color=c=green:s=320x240:d=3:r=30",
  "-f", "lavfi", "-i", "sine=frequency=880:duration=3:sample_rate=48000",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
  path.join(MEDIA, "vawa.mp4")]);

function specWith(tracks) {
  return {
    version: "0.2.0",
    meta: { name: "trackctl-test", width: 320, height: 240, fps: 30, duration: 3 },
    tracks,
  };
}
const vclip = (id, src) => ({ kind: "video", id, src, start: 0, duration: 3, in: 0, out: 3 });
const aclip = (id, src) => ({ kind: "audio", id, src, start: 0, duration: 3, in: 0, out: 3 });

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
function meanVolume(mp4) {
  const r = spawnSync("ffmpeg",
    ["-hide_banner", "-i", mp4, "-af", "volumedetect", "-vn", "-sn", "-dn", "-f", "null", "-"],
    { encoding: "utf8" });
  const out = (r.stderr || "").toString();
  const m = /mean_volume:\s*(-?inf|[\d.-]+)\s*dB/.exec(out);
  return m ? m[1] : null;
}
function centerPixel(mp4) {
  const raw = execFileSync("ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-ss", "1", "-i", mp4,
     "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 64 * 1024 * 1024 });
  const w = 320, h = 240;
  const i = ((h >> 1) * w + (w >> 1)) * 3;
  return [raw[i], raw[i + 1], raw[i + 2]];
}

// ---- Case A: audio track muted → câm ----
console.log("== Case A: audio track muted ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "blue.mp4")] },
    { id: "a1", kind: "audio", muted: true, clips: [aclip("c2", "tone.m4a")] },
  ]), "caseA");
  const mv = meanVolume(out);
  ok("audio stream tồn tại", (() => { try { execFileSync("ffprobe", ["-hide_banner", "-loglevel", "error", "-select_streams", "a", "-show_entries", "stream=codec_name", "-of", "csv=p=0", out]); return true; } catch { return false; } })());
  // LƯU Ý: track câm → render dùng anullsrc; AAC encode silence cho noise floor
  // ≈ -91dB (không phải -inf). Ngưỡng < -80dB phân biệt rõ với -24dB khi có tiếng.
  ok("output CÂM (mean_volume < -80dB)", mv !== null && parseFloat(mv) < -80, `nhận: ${mv}`);
}

// ---- Case B: đối chứng không mute → nghe được ----
console.log("== Case B: audio track không mute (đối chứng) ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "blue.mp4")] },
    { id: "a1", kind: "audio", clips: [aclip("c2", "tone.m4a")] },
  ]), "caseB");
  const mv = meanVolume(out);
  ok("nghe được (mean_volume ≈ -24dB)", mv !== null && mv !== "-inf" && parseFloat(mv) > -40, `nhận: ${mv}`);
}

// ---- Case C: video track hidden → frame không có màu đỏ ----
console.log("== Case C: video track hidden ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "blue.mp4")] },
    { id: "v2", kind: "video", hidden: true, clips: [vclip("c2", "red.mp4")] },
  ]), "caseC");
  const [r, g, b] = centerPixel(out);
  ok(`pixel giữa là XANH (không đỏ): rgb(${r},${g},${b})`, b > 150 && r < 100, `rgb(${r},${g},${b})`);
}

// ---- Case D: video track muted → audio kế thừa bị bỏ ----
console.log("== Case D: video track muted (audio kế thừa) ==");
{
  const out = render(specWith([
    { id: "v1", kind: "video", muted: true, clips: [vclip("c1", "vawa.mp4")] },
  ]), "caseD");
  const mv = meanVolume(out);
  ok("audio kế thừa bị bỏ → CÂM (< -80dB)", mv !== null && parseFloat(mv) < -80, `nhận: ${mv}`);
  // đối chứng: không mute → giữ tiếng 880Hz
  const out2 = render(specWith([
    { id: "v1", kind: "video", clips: [vclip("c1", "vawa.mp4")] },
  ]), "caseD2");
  const mv2 = meanVolume(out2);
  ok("đối chứng: không mute → giữ tiếng", mv2 !== null && mv2 !== "-inf" && parseFloat(mv2) > -40, `nhận: ${mv2}`);
}

// ---- Case E: validate.js ----
console.log("== Case E: validate flag ==");
{
  const { validateSpec } = require("./src/validate.js");
  const good = specWith([
    { id: "v1", kind: "video", muted: false, locked: true, hidden: false, clips: [vclip("c1", "blue.mp4")] },
  ]);
  const r1 = validateSpec(good);
  ok("flag boolean hợp lệ → 0 lỗi", r1.errors.length === 0, JSON.stringify(r1.errors).slice(0, 200));
  const bad = specWith([
    { id: "v1", kind: "video", muted: "yes", clips: [vclip("c1", "blue.mp4")] },
  ]);
  const r2 = validateSpec(bad);
  ok("muted='yes' → bị từ chối", r2.errors.length > 0 && /muted/.test(r2.errors.join(" ")));
  const warnAudio = specWith([
    { id: "a1", kind: "audio", hidden: true, clips: [aclip("c1", "tone.m4a")] },
  ]);
  const r3 = validateSpec(warnAudio);
  ok("hidden trên audio track → warning", r3.warnings.some((w) => /hidden/.test(w)));
}

console.log(`\n${fail === 0 ? "🎉" : "💥"} KẾT QUẢ: ${pass} pass, ${fail} fail — workdir: ${WORK}`);
process.exit(fail === 0 ? 0 : 1);
