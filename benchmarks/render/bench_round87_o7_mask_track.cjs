#!/usr/bin/env node
/**
 * bench_round87_o7_mask_track.cjs — Benchmark mask bám motion track (đợt 87 O7).
 *
 * ĐO THẬT, không sửa production. Clip testsrc2 1280x720 30fps 5s (= 150 frame),
 * render bằng chính server/render/src/render.js, veryfast/CRF23 (khớp spec
 * bench Phase 8 §7.1 — baseline mask geq 0.97 fps đo trên máy 2 vCPU).
 *
 * Các arm (cùng clip, cùng shape rect w=0.4 h=0.4 feather=0.2):
 *   B0 baseline không mask
 *   B1 mask tĩnh --mask-mode png
 *   B2 mask tĩnh --mask-mode geq
 *   B3 tracked mask: keyframes x 0.2 -> 0.8 (đường video mask D4:
 *      mask_anim.py -> ffv1 gray -> movie+blend+alphamerge). Đây là ĐƯỜNG
 *      RENDER mà mask bám track của O2 dùng — track chỉ khác nguồn keyframe
 *      (quỹ đạo track thay cho keyframe tay); chi phí render/sinh video
 *      mask đo ở đây áp dụng nguyên cho mask bám track.
 *   B4 tracked mask + denoise 0.5
 *   B5 tracked mask + stabilize smoothing 10
 *
 * Kiểm chứng đúng (frame thật, numpy):
 *   - B3@2.5 ≈ B1@2.5 (hình học tại giữa clip: x=0.5, trùng mask tĩnh)
 *   - B3@0.2 khác xa B3@4.8 (mask đã di chuyển theo quỹ đạo)
 *   - B1@2.5 ≈ B2@2.5 (png ≈ geq, kiểm lại R2)
 *
 * Phần (b): chi phí sinh video mask — gọi trực tiếp mask_anim.py với các
 * duration / mật độ keyframe / độ phân giải khác nhau: wall, dung lượng
 * .mkv, ước tính đĩa tạm (n frame x kích thước 1 frame PNG).
 *
 * Mỗi lần đo ghi kèm loadavg + RAM khả dụng lúc đo (VM chia sẻ, 9 luồng
 * đợt 87 khác đang chạy song song). Chạy TUẦN TỰ, không song song.
 *
 * Cách chạy: node benchmarks/render/bench_round87_o7_mask_track.cjs
 * Kết quả thô: benchmarks/results/round87-o7-mask-track.json
 *   (ghi vào repo — stage cùng script; file tạm render nằm trong /tmp).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../../server/eperm-retry.cjs"); // Đợt 87 closing: nối nốt 3 dòng O10 để lại

const ROOT = path.join(__dirname, "..", "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r87-o7-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });
const RESULTS_JSON = path.join(ROOT, "benchmarks", "results", "round87-o7-mask-track.json");

const results = {
  tool: "bench_round87_o7_mask_track.cjs",
  date: new Date().toISOString(),
  machine: {},
  clip: "testsrc2 1280x720 30fps 5s (150 frames), veryfast/CRF23, render.js thật",
  renders: [],
  maskVideoGen: [],
  frameChecks: [],
  notes: [],
};

function machineInfo() {
  const cpu = fs.readFileSync("/proc/cpuinfo", "utf8").match(/model name\s*:\s*(.+)/);
  const mem = fs.readFileSync("/proc/meminfo", "utf8");
  const total = /MemTotal:\s*(\d+) kB/.exec(mem);
  results.machine = {
    cpu: cpu ? cpu[1].trim() : "?",
    vcpu: os.cpus().length,
    ramTotalMiB: total ? Math.round(Number(total[1]) / 1024) : null,
    gpu: "none",
    ffmpeg: (spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout || "").split("\n")[0].trim(),
    node: process.version,
  };
}
function loadRam() {
  const load = fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" ");
  const mem = fs.readFileSync("/proc/meminfo", "utf8");
  const avail = /MemAvailable:\s*(\d+) kB/.exec(mem);
  return { loadavg: load, ramAvailMiB: avail ? Math.round(Number(avail[1]) / 1024) : null };
}
function run(cmd, args, label, timeoutMs) {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: timeoutMs || 1800000 });
  if (r.error || r.status !== 0) {
    throw new Error(`${label} thất bại (status ${r.status}): ${(r.stderr || r.error || "").toString().slice(-1200)}`);
  }
  return r;
}
function probeDuration(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" });
  return Number((r.stdout || "").trim());
}
function fileSize(p) { try { return fs.statSync(p).size; } catch { return -1; } }

const vclip = (id, src, duration, extra) => ({ id, kind: "video", src, start: 0, duration, in: 0, out: duration, ...(extra || {}) });
const specWith = (tracks, W, H, fps) => ({ version: "0.2.0", meta: { name: "r87-o7", width: W, height: H, fps: fps || 30 }, tracks });

const MASK_STATIC = { shape: "rect", x: 0.5, y: 0.5, w: 0.4, h: 0.4, feather: 0.2 };
const MASK_TRACKED = {
  shape: "rect", x: 0.2, y: 0.5, w: 0.4, h: 0.4, feather: 0.2,
  keyframes: [
    { t: 0, x: 0.2, y: 0.5, w: 0.4, h: 0.4 },
    { t: 5, x: 0.8, y: 0.5, w: 0.4, h: 0.4 },
  ],
};

function render(spec, name, maskMode) {
  const specPath = path.join(WORK, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec), { label: "bench-r87-o7-spec" });
  const outPath = path.join(WORK, `${name}.mp4`);
  const before = loadRam();
  const t0 = Date.now();
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", MEDIA, "-y", "--crf", "23", "--x264-preset", "veryfast",
    "--mask-mode", maskMode || "png"],
    { cwd: path.join(ROOT, "server", "render"), encoding: "utf8", timeout: 1800000 });
  const secs = (Date.now() - t0) / 1000;
  const after = loadRam();
  const rec = {
    arm: name, maskMode: maskMode || "png", status: r.status,
    wallSec: +secs.toFixed(2), fps: +(150 / secs).toFixed(2),
    outBytes: fileSize(outPath), durationSec: probeDuration(outPath),
    loadBefore: before, loadAfter: after,
  };
  if (r.status !== 0) rec.stderrTail = (r.stderr || "").slice(-800);
  results.renders.push(rec);
  console.log(`  ${name} [${rec.maskMode}]: ${secs.toFixed(1)}s = ${rec.fps} fps ` +
    `(load ${before.loadavg} -> ${after.loadavg}, RAM avail ${before.ramAvailMiB} -> ${after.ramAvailMiB} MiB, out ${rec.outBytes} B, dur ${rec.durationSec}s)`);
  if (r.status !== 0) throw new Error(`render ${name} exit ${r.status}: ${rec.stderrTail}`);
  return outPath;
}

function frameAt(mp4, t, out) {
  run("ffmpeg", ["-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", out], `frame ${mp4}@${t}`);
}

const COMPARE_PY = `
import sys, numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert("RGB"), dtype=np.int16)
b = np.asarray(Image.open(sys.argv[2]).convert("RGB"), dtype=np.int16)
d = np.abs(a - b)
print(f"mean={d.mean():.3f} max={d.max()} pctGt8={(d > 8).mean() * 100:.3f}")
`;
const comparePy = path.join(WORK, "compare.py");
writeFileEpermRetry(comparePy, COMPARE_PY, { label: "bench-r87-o7-compare-py" });
function compareFrames(pa, pb, label) {
  const r = spawnSync("python3", [comparePy, pa, pb], { encoding: "utf8" });
  const m = /mean=([\d.]+) max=(\d+) pctGt8=([\d.]+)/.exec(r.stdout || "");
  if (!m) throw new Error(`không parse được compare ${label}: ${r.stdout} ${r.stderr}`);
  const rec = { label, mean: Number(m[1]), max: Number(m[2]), pctGt8: Number(m[3]) };
  results.frameChecks.push(rec);
  console.log(`  📊 ${label}: mean=${rec.mean} max=${rec.max} pctGt8=${rec.pctGt8}%`);
  return rec;
}

function maskAnimGen(label, opts) {
  const out = path.join(WORK, `${label}.mkv`);
  const before = loadRam();
  const t0 = Date.now();
  const r = spawnSync("python3", [
    path.join(ROOT, "server", "render", "src", "mask_anim.py"),
    "--shape", opts.shape || "rect", "--feather", String(opts.feather ?? 0.2),
    "--width", String(opts.width), "--height", String(opts.height),
    "--fps", String(opts.fps), "--duration", String(opts.duration),
    "--keyframes", JSON.stringify(opts.keyframes), "--out", out,
  ], { encoding: "utf8", timeout: 1800000 });
  const secs = (Date.now() - t0) / 1000;
  const after = loadRam();
  const rec = {
    label, ...opts, nFrames: Math.max(1, Math.round(opts.duration * opts.fps)),
    status: r.status, wallSec: +secs.toFixed(2),
    secPerFrame: +((secs) / Math.max(1, Math.round(opts.duration * opts.fps))).toFixed(4),
    mkvBytes: fileSize(out), loadBefore: before, loadAfter: after,
  };
  if (r.status !== 0) rec.stderrTail = (r.stderr || "").slice(-500);
  results.maskVideoGen.push(rec);
  console.log(`  ${label}: ${secs.toFixed(2)}s cho ${rec.nFrames} frame ` +
    `(${rec.secPerFrame}s/frame), mkv ${rec.mkvBytes} B ` +
    `(load ${before.loadavg}, RAM avail ${before.ramAvailMiB} MiB)`);
  if (r.status !== 0) throw new Error(`mask_anim ${label} exit ${r.status}: ${rec.stderrTail}`);
  return rec;
}

function oneFramePngBytes(width, height) {
  const out = path.join(WORK, "oneframe.png");
  run("python3", [path.join(ROOT, "server", "render", "src", "mask_png.py"),
    "--shape", "rect", "--x", "0.5", "--y", "0.5", "--w", "0.4", "--h", "0.4",
    "--feather", "0.2", "--width", String(width), "--height", String(height), "--out", out], "1 frame PNG");
  return fileSize(out);
}

async function main() {
  machineInfo();
  console.log(`Máy: ${results.machine.cpu}, ${results.machine.vcpu} vCPU, RAM ${results.machine.ramTotalMiB} MiB, ${results.machine.ffmpeg}`);
  console.log(`WORK=${WORK}`);

  console.log("== Chuẩn bị media ==");
  run("ffmpeg", ["-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=5",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(MEDIA, "clip720.mp4")], "tạo clip720.mp4");
  console.log(`  clip720.mp4: ${fileSize(path.join(MEDIA, "clip720.mp4"))} B`);

  const specBase = (extra) => specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "clip720.mp4", 5, extra)] }], 1280, 720);

  console.log("== (a) Render fps: baseline / tĩnh PNG / tĩnh geq / tracked mask ==");
  const outs = {};
  for (let i = 1; i <= 2; i++) outs[`b0-${i}`] = render(specBase(), `b0-baseline-${i}`);
  for (let i = 1; i <= 2; i++) outs[`b1-${i}`] = render(specBase({ mask: MASK_STATIC }), `b1-static-png-${i}`, "png");
  for (let i = 1; i <= 2; i++) outs[`b2-${i}`] = render(specBase({ mask: MASK_STATIC }), `b2-static-geq-${i}`, "geq");
  for (let i = 1; i <= 2; i++) outs[`b3-${i}`] = render(specBase({ mask: MASK_TRACKED }), `b3-tracked-${i}`, "png");
  outs["b4-1"] = render(specBase({ mask: MASK_TRACKED, enhance: { denoise: { strength: 0.5 } } }), "b4-tracked-denoise", "png");
  outs["b5-1"] = render(specBase({ mask: MASK_TRACKED, enhance: { stabilize: { smoothing: 10 } } }), "b5-tracked-stabilize", "png");

  console.log("== Kiểm chứng frame thật ==");
  const f = (name, t) => { const p = path.join(WORK, `${name}-t${t}.png`); frameAt(outs[name], t, p); return p; };
  compareFrames(f("b3-1", 2.5), f("b1-1", 2.5), "tracked@2.5 vs static-png@2.5 (cùng hình học x=0.5)");
  compareFrames(f("b3-1", 0.2), f("b3-1", 4.8), "tracked@0.2 vs tracked@4.8 (mask phải di chuyển)");
  compareFrames(f("b1-1", 2.5), f("b2-1", 2.5), "static png@2.5 vs static geq@2.5 (kiểm lại R2)");

  console.log("== (b) Chi phí sinh video mask (mask_anim.py trực tiếp) ==");
  const kf2 = [{ t: 0, x: 0.2, y: 0.5, w: 0.4, h: 0.4 }, { t: 5, x: 0.8, y: 0.5, w: 0.4, h: 0.4 }];
  const kf2_2s = [{ t: 0, x: 0.2, y: 0.5, w: 0.4, h: 0.4 }, { t: 2, x: 0.8, y: 0.5, w: 0.4, h: 0.4 }];
  const kf2_10s = [{ t: 0, x: 0.2, y: 0.5, w: 0.4, h: 0.4 }, { t: 10, x: 0.8, y: 0.5, w: 0.4, h: 0.4 }];
  const kfDense = [];
  for (let i = 0; i <= 10; i++) kfDense.push({ t: i * 0.5, x: 0.2 + 0.06 * i, y: 0.5, w: 0.4, h: 0.4 });
  maskAnimGen("gen-720p-2s-2kf", { width: 1280, height: 720, fps: 30, duration: 2, keyframes: kf2_2s });
  maskAnimGen("gen-720p-5s-2kf", { width: 1280, height: 720, fps: 30, duration: 5, keyframes: kf2 });
  maskAnimGen("gen-720p-5s-11kf", { width: 1280, height: 720, fps: 30, duration: 5, keyframes: kfDense });
  maskAnimGen("gen-720p-10s-2kf", { width: 1280, height: 720, fps: 30, duration: 10, keyframes: kf2_10s });
  maskAnimGen("gen-1080p-5s-2kf", { width: 1920, height: 1080, fps: 30, duration: 5, keyframes: kf2 });
  const one720 = oneFramePngBytes(1280, 720);
  const one1080 = oneFramePngBytes(1920, 1080);
  results.notes.push(`1 frame PNG tạm 720p = ${one720} B, 1080p = ${one1080} B (đĩa tạm mask_anim ≈ nFrames x số này, xoá sau khi encode xong)`);
  console.log(`  1 frame PNG tạm: 720p ${one720} B, 1080p ${one1080} B`);

  fs.mkdirSync(path.dirname(RESULTS_JSON), { recursive: true });
  writeFileEpermRetry(RESULTS_JSON, JSON.stringify(results, null, 2), { label: "bench-r87-o7-results" });
  console.log(`\n== XONG. Kết quả thô: ${RESULTS_JSON} ==`);
  console.log(`   WORK (file tạm render, không stage): ${WORK}`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
