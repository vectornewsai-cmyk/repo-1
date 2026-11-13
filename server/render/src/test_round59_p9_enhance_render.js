#!/usr/bin/env node
/**
 * test_round59_p9_enhance_render.js — Kiểm chứng render thật cho Enhance,
 * Phase 9 đợt 59 luồng P9 (gap E3, cặp với luồng P8 làm UI — luồng này
 * KHÔNG đụng UI, chỉ test đường render hiện có).
 *
 * Khác với test_p2.js (320x180, metric hiệu ứng) và test_r2.js (chỉ 1 FPS
 * mask+denoise, deinterlace/stabilize chưa đo FPS): đợt này đo FPS render
 * thật từng enhance ở 720p (veryfast/CRF23 — cùng cấu hình benchmark
 * RESULTS.md §7.1 để so được với số denoise-720p 9.24 fps của Phase 8),
 * xác nhận flag FFmpeg CHÍNH XÁC trong graph qua --dry-run, và chứng minh
 * output khác biệt đo được ở 720p.
 *
 * Cách chạy: node server/render/src/test_round59_p9_enhance_render.js
 * (cần ffmpeg, ffprobe, python3 + PIL/numpy). File tạm trong os.tmpdir(),
 * KHÔNG ghi gì vào repo. Thời gian chạy vài phút.
 *
 * Cấu trúc:
 *   A. Unit: enhance.js --self-test + probe filter + dry-run chứa đúng flag.
 *   B. FPS 720p 5s (150 frame): baseline / denoise 0.5 / denoise 1.0 /
 *      stabilize / deinterlace / combo cả ba — wall time + fps, kèm kiểm
 *      tra ffprobe (duration ≈ 5s, codec h264, 1280x720).
 *   C. Khác biệt đo được ở 720p: denoise giảm std vùng phẳng; deinterlace
 *      tăng tỉ lệ progressive (idet); stabilize làm đổi frame + log detect.
 *   D. (Không lặp lại P2) metric hiệu ứng 320x180 đã chạy lại tươi bằng
 *      test_p2.js trong cùng đợt này — xem LIMITS đợt 59 P9.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r59p9-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..");
const RENDER = path.join(__dirname, "..");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, cwd) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}

// Render thật bằng render.js, đo wall time end-to-end (gồm cả pass
// vidstabdetect với stabilize và thời gian khởi động node — số FPS là
// FPS thực tế người dùng cảm nhận, không phải FPS riêng filter).
function render(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "-y",
    "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return {
    status: r.status, stdout: (r.stdout || "").toString(),
    stderr: (r.stderr || "").toString(), outPath, secs,
    fps: 150 / secs,
  };
}
function dryRun(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", path.join(work, `${name}.mp4`), "--media-dir", mediaDir,
    "--dry-run", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  return (r.stdout || "").toString() + (r.stderr || "").toString();
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function frameAt(mp4, t, out) {
  run("ffmpeg", ["-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", out], `lấy frame ${mp4}@${t}`);
}
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  const j = JSON.parse(r.stdout || "{}");
  return {
    codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height,
    duration: Number(j.format && j.format.duration),
  };
}
function checkOut(r, name) {
  const p = probeVideo(r.outPath);
  ok(r.status === 0 && outOk(r.outPath), `${name}: render OK (${r.secs.toFixed(1)}s, ${r.fps.toFixed(2)} fps)`);
  ok(p.codec === "h264" && p.width === 1280 && p.height === 720,
    `${name}: codec/res đúng (${p.codec} ${p.width}x${p.height})`);
  ok(Math.abs(p.duration - 5) < 0.15, `${name}: thời lượng đúng (~5s, đo ${p.duration})`);
  return p;
}
// Tỉ lệ frame progressive theo filter idet (mẫu test_p2_measure.py).
function idetProg(mp4) {
  const r = spawnSync("ffmpeg", ["-i", mp4, "-vf", "idet", "-f", "null", "-"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const m = [...(r.stderr || "").matchAll(/Single frame detection:.*?TFF:\s*(\d+).*?BFF:\s*(\d+).*?Progressive:\s*(\d+).*?Undetermined:\s*(\d+)/gs)];
  if (!m.length) throw new Error(`không parse được idet cho ${mp4}:\n${(r.stderr || "").slice(-500)}`);
  const g = m[m.length - 1];
  const tff = Number(g[1]), bff = Number(g[2]), prog = Number(g[3]), und = Number(g[4]);
  const total = tff + bff + prog + und;
  console.log(`   📊 idet ${path.basename(mp4)}: TFF=${tff} BFF=${bff} Prog=${prog} Und=${und} prog=${(prog / total).toFixed(3)}`);
  return total ? prog / total : -1;
}

const vclip = (id, src, duration, extra) => ({
  id, kind: "video", src, start: 0, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r59p9", width: W, height: H, fps: fps || 30 },
  tracks,
});

// So sánh 2 frame PNG bằng numpy (mẫu test_r2.js).
const COMPARE_PY = `
import sys, numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert("RGB"), dtype=np.int16)
b = np.asarray(Image.open(sys.argv[2]).convert("RGB"), dtype=np.int16)
d = np.abs(a - b)
print(f"mean={d.mean():.3f} max={d.max()} pctGt8={(d > 8).mean() * 100:.3f}")
`;
const comparePy = path.join(work, "compare.py");
writeFileEpermRetry(comparePy, COMPARE_PY);
function compareFrames(pa, pb) {
  const r = spawnSync("python3", [comparePy, pa, pb], { encoding: "utf8" });
  const m = /mean=([\d.]+) max=(\d+) pctGt8=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được kết quả so frame: ${r.stdout} ${r.stderr}`);
  return { mean: Number(m[1]), max: Number(m[2]), pctGt8: Number(m[3]) };
}
const STD_PY = `
import sys, numpy as np
from PIL import Image
g = np.asarray(Image.open(sys.argv[1]).convert("L"), dtype=np.float64)
print(f"std={g.std():.3f}")
`;
const stdPy = path.join(work, "std.py");
writeFileEpermRetry(stdPy, STD_PY);
function frameStd(p) {
  const r = spawnSync("python3", [stdPy, p], { encoding: "utf8" });
  const m = /std=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được std: ${r.stdout} ${r.stderr}`);
  return Number(m[1]);
}

// --- Chuẩn bị media 720p (trước mục A: dry-run cũng validate media) ---
console.log("== Chuẩn bị media 720p ==");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=5",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "clean720.mp4")], "tạo clean720.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=5",
  "-vf", "noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "noisy720.mp4")], "tạo noisy720.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "color=c=0x808080:s=1280x720:r=30:d=5",
  "-vf", "noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "flatnoisy720.mp4")], "tạo flatnoisy720.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=60:duration=5",
  "-vf", "tinterlace=interleave_top",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "interlaced720.mp4")], "tạo interlaced720.mp4");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=60:duration=5",
  "-vf", "tinterlace=interleave_top,noise=alls=15:allf=t",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "comb720.mp4")], "tạo comb720.mp4");
// Shaky 720p: upscale nguồn rung của P2 (test_p2_gen_shaky.py, 320x180,
// tremor cao tần ±7px, seed cố định) — giữ nguyên biên độ tương đối,
// texture upscale vẫn đủ cho vidstab track; xem LIMITS về nguồn gốc.
run("python3", [path.join(RENDER, "test_p2_gen_shaky.py"), path.join(mediaDir, "shaky320.mp4")],
  "tạo shaky320.mp4 (gen P2)");
run("ffmpeg", ["-i", path.join(mediaDir, "shaky320.mp4"),
  "-vf", "scale=1280:720:flags=lanczos",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "shaky720.mp4")], "upscale shaky → 720p");
ok(["clean720.mp4", "noisy720.mp4", "flatnoisy720.mp4", "interlaced720.mp4",
  "comb720.mp4", "shaky720.mp4"].every((f) => fs.existsSync(path.join(mediaDir, f))),
  "media 720p tạo xong");

// --- A: unit + dry-run (flag chính xác trong graph) ---
console.log("== A: probe filter + dry-run flag ==");
{
  const { probeFilterSupport } = require("./enhance");
  const sup = probeFilterSupport("ffmpeg");
  console.log(`   probe: ${JSON.stringify(sup)}`);
  ok(sup.vidstabdetect && sup.vidstabtransform && sup.hqdn3d && sup.yadif,
    "FFmpeg có đủ 4 filter enhance (vidstabdetect/transform, hqdn3d, yadif)");
  const st = spawnSync("node", [path.join(__dirname, "enhance.js"), "--self-test"],
    { encoding: "utf8" });
  ok(st.status === 0, "enhance.js --self-test pass");

  const base = specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clean720.mp4", 5)] }], 1280, 720);
  const noEnh = dryRun(base, "dry-none");
  ok(!/yadif|vidstabtransform|hqdn3d/.test(noEnh),
    "không enhance → graph không chứa filter enhance nào");

  const d05 = dryRun(specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "clean720.mp4", 5, { enhance: { denoise: { strength: 0.5 } } })] }], 1280, 720), "dry-d05");
  ok(d05.includes("hqdn3d=12:9:12:9"), "denoise 0.5 → hqdn3d=12:9:12:9");
  const d10 = dryRun(specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "clean720.mp4", 5, { enhance: { denoise: { strength: 1 } } })] }], 1280, 720), "dry-d10");
  ok(d10.includes("hqdn3d=24:18:24:18"), "denoise 1.0 → hqdn3d=24:18:24:18");
  const dTrue = dryRun(specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "clean720.mp4", 5, { enhance: { denoise: true } })] }], 1280, 720), "dry-dtrue");
  ok(dTrue.includes("hqdn3d=12:9:12:9"), "denoise true → mặc định 0.5 (hqdn3d=12:9:12:9)");

  const dei0 = dryRun(specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "clean720.mp4", 5, { enhance: { deinterlace: true } })] }], 1280, 720), "dry-dei0");
  ok(dei0.includes("yadif=mode=0:parity=-1:deint=0"),
    "deinterlace true → yadif=mode=0:parity=-1:deint=0");
  const dei1 = dryRun(specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "clean720.mp4", 5, { enhance: { deinterlace: { mode: 1 } } })] }], 1280, 720), "dry-dei1");
  ok(dei1.includes("yadif=mode=1:parity=-1:deint=0"),
    "deinterlace mode 1 → yadif=mode=1:parity=-1:deint=0");

  const stab = dryRun(specWith([{ id: "v0", kind: "video",
    clips: [vclip("c0", "clean720.mp4", 5, { enhance: { stabilize: { smoothing: 30 } } })] }], 1280, 720), "dry-stab");
  ok(stab.includes("vidstabtransform=input=") && stab.includes("smoothing=30") && stab.includes("optalgo=gauss"),
    "stabilize → vidstabtransform smoothing=30 optalgo=gauss");
  ok(!stab.includes("shakiness=") && !stab.includes("accuracy="),
    "transform KHÔNG chứa option của detect (shakiness/accuracy)");
}

// Warm-up không tính giờ (ffmpeg/node cold start) rồi mới đo FPS.
console.log("== Warm-up (không tính giờ) ==");
render(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clean720.mp4", 5)] }], 1280, 720), "warmup");

// --- B: FPS 720p ---
console.log("== B: FPS render thật 720p 5s (veryfast/CRF23, 150 frame) ==");
const fpsTable = {};
function timedRender(label, spec, name) {
  const r = render(spec, name);
  checkOut(r, label);
  fpsTable[label] = r.fps;
  console.log(`   📊 ${label}: ${r.secs.toFixed(2)}s wall → ${r.fps.toFixed(2)} fps`);
  return r;
}
const rBase = timedRender("baseline", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "clean720.mp4", 5)] }], 1280, 720), "fps-base");
const rDen05 = timedRender("denoise-0.5", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "noisy720.mp4", 5, { enhance: { denoise: { strength: 0.5 } } })] }], 1280, 720), "fps-den05");
const rDen10 = timedRender("denoise-1.0", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "noisy720.mp4", 5, { enhance: { denoise: { strength: 1 } } })] }], 1280, 720), "fps-den10");
const rNoisyCtl = timedRender("noisy-control", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "noisy720.mp4", 5)] }], 1280, 720), "fps-noisyctl");
const rFlatCtl = timedRender("flat-control", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "flatnoisy720.mp4", 5)] }], 1280, 720), "fps-flatctl");
const rFlatDen = timedRender("flat-denoise-0.5", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "flatnoisy720.mp4", 5, { enhance: { denoise: { strength: 0.5 } } })] }], 1280, 720), "fps-flatden");
const rStabCtl = timedRender("stab-control", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shaky720.mp4", 5)] }], 1280, 720), "fps-stabctl");
const rStab = timedRender("stabilize-30", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "shaky720.mp4", 5, { enhance: { stabilize: { smoothing: 30 } } })] }], 1280, 720), "fps-stab");
const rDeiCtl = timedRender("deint-control", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "interlaced720.mp4", 5)] }], 1280, 720), "fps-deictl");
const rDei = timedRender("deinterlace", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "interlaced720.mp4", 5, { enhance: { deinterlace: true } })] }], 1280, 720), "fps-dei");
const rCombo = timedRender("combo-all3", specWith([{ id: "v0", kind: "video",
  clips: [vclip("c0", "comb720.mp4", 5, {
    enhance: { deinterlace: true, stabilize: { smoothing: 30 }, denoise: { strength: 0.5 } },
  })] }], 1280, 720), "fps-combo");

console.log("== B2: so sánh FPS ==");
ok(fpsTable["denoise-0.5"] < fpsTable.baseline,
  `denoise 0.5 chậm hơn baseline (${fpsTable["denoise-0.5"].toFixed(2)} < ${fpsTable.baseline.toFixed(2)} fps)`);
ok(fpsTable["stabilize-30"] < fpsTable.baseline,
  `stabilize chậm hơn baseline (${fpsTable["stabilize-30"].toFixed(2)} < ${fpsTable.baseline.toFixed(2)} fps)`);
ok(rStab.stdout.includes("stabilize \"c0\""),
  "log render ghi pass vidstabdetect đã chạy cho clip c0");
console.log(`   📊 FPS 720p: ${Object.entries(fpsTable).map(([k, v]) => `${k}=${v.toFixed(2)}`).join(", ")}`);

// --- C: khác biệt đo được ở 720p ---
console.log("== C: khác biệt đo được ở 720p ==");
{
  // Denoise trên nền phẳng: std frame giữa phải giảm rõ.
  const f0 = path.join(work, "f-flat0.png"), f1 = path.join(work, "f-flat1.png");
  frameAt(rFlatCtl.outPath, 2.5, f0);
  frameAt(rFlatDen.outPath, 2.5, f1);
  const s0 = frameStd(f0), s1 = frameStd(f1);
  console.log(`   📊 flat noise std: trước=${s0}, sau denoise 0.5=${s1}`);
  ok(s1 < s0 * 0.8, `denoise 0.5 giảm std nền phẳng xuống <80% (${s0} → ${s1})`);
  // Denoise trên testsrc2 nhiễu: frame phải khác bản không denoise.
  const g0 = path.join(work, "g-n0.png"), g1 = path.join(work, "g-n1.png");
  frameAt(rNoisyCtl.outPath, 2.5, g0);
  frameAt(rDen05.outPath, 2.5, g1);
  const c = compareFrames(g0, g1);
  console.log(`   📊 frame diff denoise-vs-control (testsrc2 nhiễu): mean=${c.mean} pctGt8=${c.pctGt8}%`);
  ok(c.mean > 0.5 && c.pctGt8 > 1, "denoise làm đổi pixel rõ trên testsrc2 nhiễu");

  // Deinterlace: idet prog phải tăng rõ so với đối chứng.
  const i0 = idetProg(rDeiCtl.outPath);
  const i1 = idetProg(rDei.outPath);
  ok(i0 < 0.5, `đối chứng vẫn interlaced (prog=${i0.toFixed(3)})`);
  ok(i1 > 0.8, `deinterlace tăng progressive (prog ${i0.toFixed(3)} → ${i1.toFixed(3)})`);

  // Stabilize: frame phải khác bản không stabilize (transform đã áp).
  const h0 = path.join(work, "h-s0.png"), h1 = path.join(work, "h-s1.png");
  frameAt(rStabCtl.outPath, 1.0, h0);
  frameAt(rStab.outPath, 1.0, h1);
  const cs = compareFrames(h0, h1);
  console.log(`   📊 frame diff stabilize-vs-control: mean=${cs.mean} pctGt8=${cs.pctGt8}%`);
  ok(cs.mean > 0, "stabilize làm thay đổi frame (transform đã áp)");
}

console.log(`\n== test_round59_p9: ${pass} pass, ${fail} fail (WORK=${work}) ==`);
if (fail > 0) process.exit(1);
