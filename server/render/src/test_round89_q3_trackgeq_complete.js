#!/usr/bin/env node
/**
 * test_round89_q3_trackgeq_complete.js — Test THẬT Phase 9 đợt 89 Q3:
 * đóng nợ LIMITS gộp đợt 88 §4 mục 9 (trackgeq):
 *   C1: compound clip — cửa sổ nested có trim (in=1.0) nhưng leaf nằm
 *       trọn trong cửa sổ (không bị cắt trái) + mask+track, mode trackgeq.
 *   C2: compound clip — cửa sổ nested speed=2 + leaf track → fail-fast
 *       (nested.js từ chối rõ ràng, không render sai lặng lẽ).
 *   C3: compound clip — cửa sổ nested trim cắt trái leaf + track →
 *       fail-fast rõ ràng.
 *   C4: compound clip — cửa sổ nested cắt phải leaf + track → render
 *       được, điểm track vượt duration mới bị bỏ + warning.
 *   T1/T2: transition wipeleft + mask+track, mode png / trackgeq.
 *   T3/T4: transition slideleft + mask+track, mode png / trackgeq.
 *   P:  render trackgeq + png cho spec preview (trắng, mask+track không
 *       keyframes) — đối chứng với probe CDP preview (chạy riêng).
 *
 * Render bằng chính render.js (không mock), chạy TUẦN TỰ (RAM VM thấp).
 * Đo bằng numpy/PIL trên frame PNG trích ra: centroid theo kênh màu
 * (đỏ = clip A, xanh lá = clip B) + bbox theo kênh (x0/x1/y0/y1) để đo
 * biên wipe/slide trong cửa sổ transition.
 *
 * Cách chạy: node src/test_round89_q3_trackgeq_complete.js [c1|c2|c3|c4|t1|t2|t3|t4|p|all]
 * File tạm trong os.tmpdir(). Trackgeq 720p ~0.7 fps: T2/T4 mỗi render
 * ~3-4 phút; toàn bộ ~15-20 phút.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");

const SECTION = process.argv[2] || "all";
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r89q3-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, cwd, timeoutMs) {
  // Sóng EPERM của VM (ghi file fail "Operation not permitted" từng cơn,
  // xem probe EPERM v2 của P8 đợt 88) có thể giết một bước ffmpeg bất kỳ —
  // retry CHỈ khi stderr chứa đúng chữ ký EPERM, tối đa 12 lần, cách 30s
  // (~6 phút/bước). Lỗi thật (không phải EPERM) vẫn fail ngay lần đầu.
  for (let attempt = 1; attempt <= 12; attempt++) {
    const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd, timeout: timeoutMs });
    if (!r.error && r.status === 0) return r;
    const errText = (r.stderr || "").toString();
    if (errText.includes("Operation not permitted") && attempt < 12) {
      console.log(`   ⚠️  bước "${label}" dính sóng EPERM (lần ${attempt}/12) — thử lại sau 30s`);
      try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000); } catch { /* ignore */ }
      continue;
    }
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${errText.slice(-1500)}`);
    process.exit(2);
  }
}
function render(spec, name, extraArgs, timeoutMs) {
  const specPath = path.join(work, `${name}.json`);
  // Đợt 89 Q3: budget retry như bước ffmpeg (sóng EPERM dài, xem O3).
  writeFileEpermRetry(specPath, JSON.stringify(spec), { label: "test-r89-q3-spec", tries: 12, delayMs: 30000 });
  const outPath = path.join(work, `${name}.mp4`);
  // Retry EPERM như run() — render dài, sóng EPERM giữa chừng giết cả
  // render (ghi mp4 fail); render lại từ đầu là idempotent (-y ghi đè).
  for (let attempt = 1; attempt <= 12; attempt++) {
    const t0 = Date.now();
    const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
      "--media-dir", mediaDir, "-y", ...(extraArgs || [])],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], timeout: timeoutMs || 1800000 });
    const secs = (Date.now() - t0) / 1000;
    if (!r.error && r.status === 0)
      return { status: r.status, outPath, secs, stderr: (r.stderr || "").toString() };
    const errText = (r.stderr || "").toString();
    if (errText.includes("Operation not permitted") && attempt < 12) {
      console.log(`   ⚠️  render "${name}" dính sóng EPERM (lần ${attempt}/12, sau ${secs.toFixed(1)}s) — render lại sau 30s`);
      try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30000); } catch { /* ignore */ }
      continue;
    }
    console.error(`❌ render "${name}" thất bại (mã ${r.status}):\n${errText.slice(-3000)}`);
    process.exit(2);
  }
}
/** Render mà KỲ VỌNG fail (fail-fast): trả về { status, stderr }, không exit. */
function renderExpectFail(spec, name, extraArgs) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec), { label: "test-r89-q3-spec", tries: 12, delayMs: 30000 });
  const outPath = path.join(work, `${name}.mp4`);
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "-y", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], timeout: 300000 });
  return { status: r.status, stderr: (r.stderr || "").toString() + (r.stdout || "").toString() };
}
function outOk(p) { try { return fs.statSync(p).size > 0; } catch { return false; } }
function frameAt(mp4, t, out) {
  run("ffmpeg", ["-ss", String(t), "-i", mp4, "-frames:v", "1", "-y", out], `lấy frame ${mp4}@${t}`);
}
function probeDuration(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", mp4], { encoding: "utf8" });
  return parseFloat((r.stdout || "").trim());
}

// Đo centroid/bbox theo kênh màu + centroid luma (trắng) bằng numpy/PIL.
const MEASURE_PY = `
import sys, numpy as np
from PIL import Image
mode = sys.argv[1]
p = sys.argv[2]
img = np.asarray(Image.open(p).convert("RGB")).astype(np.float64)
if mode in ("r", "g", "b"):
    ch = {"r": 0, "g": 1, "b": 2}[mode]
    o1, o2 = [i for i in range(3) if i != ch]
    m = (img[:, :, ch] > 100) & (img[:, :, ch] > img[:, :, o1] + 30) & (img[:, :, ch] > img[:, :, o2] + 30)
    ys, xs = np.where(m)
    cx = float(xs.mean()) if len(xs) else -1
    cy = float(ys.mean()) if len(ys) else -1
    print(f"cx={cx:.1f} cy={cy:.1f} n={int(len(xs))}")
elif mode in ("bboxr", "bboxg", "bboxb"):
    ch = {"bboxr": 0, "bboxg": 1, "bboxb": 2}[mode]
    o1, o2 = [i for i in range(3) if i != ch]
    m = (img[:, :, ch] > 100) & (img[:, :, ch] > img[:, :, o1] + 30) & (img[:, :, ch] > img[:, :, o2] + 30)
    ys, xs = np.where(m)
    if len(xs) == 0:
        print("x0=none x1=none y0=none y1=none n=0 cx=-1 cy=-1")
    else:
        print(f"x0={int(xs.min())} x1={int(xs.max())} y0={int(ys.min())} y1={int(ys.max())} n={int(len(xs))} cx={float(xs.mean()):.1f} cy={float(ys.mean()):.1f}")
elif mode == "w":
    # luma trắng trên nền đen: centroid + bbox
    luma = img.mean(axis=2)
    m = luma > 128
    ys, xs = np.where(m)
    if len(xs) == 0:
        print("x0=none x1=none y0=none y1=none n=0 cx=-1 cy=-1")
    else:
        print(f"x0={int(xs.min())} x1={int(xs.max())} y0={int(ys.min())} y1={int(ys.max())} n={int(len(xs))} cx={float(xs.mean()):.1f} cy={float(ys.mean()):.1f}")
`;
const measurePy = path.join(work, "measure.py");
// Đợt 89 Q3: budget retry như bước ffmpeg (sóng EPERM dài, xem O3).
writeFileEpermRetry(measurePy, MEASURE_PY, { label: "test-r89-q3-measure-py", tries: 12, delayMs: 30000 });
function measure(p, mode) {
  const r = spawnSync("python3", [measurePy, mode, p], { encoding: "utf8" });
  const m = /cx=([-\d.]+) cy=([-\d.]+) n=(\d+)/.exec(r.stdout || "");
  if (m) return { cx: Number(m[1]), cy: Number(m[2]), n: Number(m[3]) };
  const b = /x0=(\S+) x1=(\S+) y0=(\S+) y1=(\S+) n=(\d+) cx=([-\d.]+) cy=([-\d.]+)/.exec(r.stdout || "");
  if (b) return {
    x0: b[1] === "none" ? -1 : Number(b[1]), x1: b[2] === "none" ? -1 : Number(b[2]),
    y0: b[3] === "none" ? -1 : Number(b[3]), y1: b[4] === "none" ? -1 : Number(b[4]),
    n: Number(b[5]), cx: Number(b[6]), cy: Number(b[7]),
  };
  throw new Error(`không parse được measure (${mode}): ${r.stdout} ${r.stderr}`);
}

const MASK_ELL = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.3, feather: 0.2 };
const vclip = (id, src, start, duration, extra) => ({
  id, kind: "video", src, start, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r89q3", width: W, height: H, fps: fps || 30 },
  tracks,
});
const nestedClip = (id, start, duration, winExtra, subSpec) => ({
  id, kind: "nested", start, duration, ...(winExtra || {}), subSpec,
});
const subSpecWith = (leaf) => ({
  version: "0.2.0",
  meta: { name: "r89q3-sub", width: 1280, height: 720, fps: 30 },
  tracks: [{ id: "sv0", kind: "video", clips: [leaf] }],
});

// --- Media thật ---
function prepareMedia() {
  console.log("== Chuẩn bị media ==");
  run("ffmpeg", ["-f", "lavfi", "-i", "color=c=red:s=1280x720:r=30:d=8",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "red720.mp4")], "tạo red720.mp4 (8s)");
  run("ffmpeg", ["-f", "lavfi", "-i", "color=c=green:s=1280x720:r=30:d=5",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "green720.mp4")], "tạo green720.mp4 (5s)");
  run("ffmpeg", ["-f", "lavfi", "-i", "color=c=white:s=1280x720:r=30:d=4",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "white720.mp4")], "tạo white720.mp4 (4s)");
}

// --- C1: nested trim in=1.0, leaf nằm trọn trong cửa sổ, trackgeq ---
function sectionC1() {
  console.log("C1: nested in=1.0 (trim cửa sổ), leaf [1.5,4.0) trọn trong cửa sổ, trackgeq");
  // Leaf: start con 1.5, duration 2.5, track 0.2→0.8 trên 2.5s (leaf-local).
  // Flatten: start' = 0 + (1.5-1.0)/1 = 0.5, duration' 2.5. Timeline t →
  // local = t-0.5; x(t) = 0.2 + 0.24*local.
  const leaf = vclip("leaf", "red720.mp4", 1.5, 2.5, {
    mask: MASK_ELL,
    track: { points: [
      { t: 0, x: 0.2, y: 0.5 },
      { t: 1.25, x: 0.5, y: 0.5 },
      { t: 2.5, x: 0.8, y: 0.5 },
    ] },
  });
  const spec = specWith([{ id: "v0", kind: "video", clips: [
    nestedClip("nest1", 0, 3, { in: 1.0 }, subSpecWith(leaf)),
  ] }], 1280, 720);
  const r = render(spec, "c1-nested-trim-trackgeq", ["--mask-mode", "trackgeq"]);
  ok(r.status === 0 && outOk(r.outPath), `render C1 OK (${r.secs.toFixed(1)}s)`);
  console.log(`   📊 C1 trackgeq 720p 3s: ${(90 / r.secs).toFixed(2)} fps (90 frame / ${r.secs.toFixed(1)}s)`);
  ok(Math.abs(probeDuration(r.outPath) - 3) < 0.1, `C1 duration = 3s (đo ${probeDuration(r.outPath)})`);
  for (const [t, ex] of [[1.0, 409.6], [2.0, 716.8], [2.9, 993.3]]) {
    const f = path.join(work, `f-c1-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    console.log(`   📊 C1 t=${t}: cx=${m.cx} (kỳ vọng ${ex.toFixed(1)}, lệch ${(m.cx - ex).toFixed(1)}px) cy=${m.cy} n=${m.n}`);
    ok(Math.abs(m.cx - ex) <= 5 && Math.abs(m.cy - 360) <= 5, `C1 t=${t} mask bám track đúng (lệch ≤5px)`);
  }
}

// --- C2: nested speed=2 + leaf track → fail-fast ---
function sectionC2() {
  console.log("C2: nested speed=2 + leaf track (kỳ vọng fail-fast, exit 1)");
  const leaf = vclip("leaf", "red720.mp4", 0, 4, {
    mask: MASK_ELL,
    track: { points: [
      { t: 0, x: 0.2, y: 0.5 },
      { t: 4, x: 0.8, y: 0.5 },
    ] },
  });
  const spec = specWith([{ id: "v0", kind: "video", clips: [
    nestedClip("nest1", 0, 2, { speed: 2 }, subSpecWith(leaf)),
  ] }], 1280, 720);
  const r = renderExpectFail(spec, "c2-nested-speed-failfast", ["--mask-mode", "trackgeq"]);
  console.log(`   📊 C2 exit=${r.status}; stderr: ${r.stderr.trim().split("\n").slice(-2).join(" | ")}`);
  ok(r.status === 1, "C2 exit 1 (từ chối render, không render sai lặng lẽ)");
  ok(r.stderr.includes("speed != 1"), "C2 thông báo nêu đúng nguyên nhân speed != 1");
  ok(!outOk(path.join(work, "c2-nested-speed-failfast.mp4")), "C2 không tạo output");
}

// --- C3: nested trim cắt trái leaf + track → fail-fast ---
function sectionC3() {
  console.log("C3: nested in=1.0 cắt trái leaf (leaf start=0) + track (kỳ vọng fail-fast, exit 1)");
  const leaf = vclip("leaf", "red720.mp4", 0, 4, {
    mask: MASK_ELL,
    track: { points: [
      { t: 0, x: 0.2, y: 0.5 },
      { t: 4, x: 0.8, y: 0.5 },
    ] },
  });
  const spec = specWith([{ id: "v0", kind: "video", clips: [
    nestedClip("nest1", 0, 3, { in: 1.0 }, subSpecWith(leaf)),
  ] }], 1280, 720);
  const r = renderExpectFail(spec, "c3-nested-trimleft-failfast", ["--mask-mode", "trackgeq"]);
  console.log(`   📊 C3 exit=${r.status}; stderr: ${r.stderr.trim().split("\n").slice(-2).join(" | ")}`);
  ok(r.status === 1, "C3 exit 1 (từ chối render, không render sai lặng lẽ)");
  ok(r.stderr.includes("cắt bên trái"), "C3 thông báo nêu đúng nguyên nhân cắt bên trái");
  ok(!outOk(path.join(work, "c3-nested-trimleft-failfast.mp4")), "C3 không tạo output");
}

// --- C4: nested cắt phải leaf + track → render được, điểm track thừa bị bỏ ---
function sectionC4() {
  console.log("C4: nested duration=2 cắt phải leaf 4s + track, trackgeq");
  const leaf = vclip("leaf", "red720.mp4", 0, 4, {
    mask: MASK_ELL,
    track: { points: [
      { t: 0, x: 0.2, y: 0.5 },
      { t: 2, x: 0.5, y: 0.5 },
      { t: 4, x: 0.8, y: 0.5 },
    ] },
  });
  const spec = specWith([{ id: "v0", kind: "video", clips: [
    nestedClip("nest1", 0, 2, {}, subSpecWith(leaf)),
  ] }], 1280, 720);
  const r = render(spec, "c4-nested-trimright-trackgeq", ["--mask-mode", "trackgeq"]);
  ok(r.status === 0 && outOk(r.outPath), `render C4 OK (${r.secs.toFixed(1)}s)`);
  console.log(`   📊 C4 trackgeq 720p 2s: ${(60 / r.secs).toFixed(2)} fps`);
  ok(Math.abs(probeDuration(r.outPath) - 2) < 0.1, `C4 duration = 2s (đo ${probeDuration(r.outPath)})`);
  const warnLine = r.stderr.split("\n").find((l) => l.includes("cắt phải bỏ"));
  console.log(`   📊 C4 warning: ${warnLine ? warnLine.trim() : "(không thấy warning cắt phải)"}`);
  ok(!!warnLine && warnLine.includes("1 keyframe/điểm track"),
    "C4 warning nêu đúng: bỏ 1 điểm track vượt duration mới");
  for (const [t, ex] of [[0.5, 352], [1.5, 544]]) {
    const f = path.join(work, `f-c4-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    console.log(`   📊 C4 t=${t}: cx=${m.cx} (kỳ vọng ${ex}, lệch ${(m.cx - ex).toFixed(1)}px) cy=${m.cy} n=${m.n}`);
    ok(Math.abs(m.cx - ex) <= 5 && Math.abs(m.cy - 360) <= 5, `C4 t=${t} mask bám track đúng (lệch ≤5px)`);
  }
}

// --- T: transition wipe/slide + mask+track, 2 mode ---
// A đỏ 3s (track 0.2→0.8, slope +0.2/s), B xanh lá 3s (track 0.7→0.3,
// slope -0.1333/s), transitionOut 1s trên A → cửa sổ [2,3]s, B bắt đầu
// sớm 1s: B local = t - 2. Kỳ vọng:
//   t=1.0: A centroid x = (0.2+0.2*1)*1280 = 512.
//   t=4.9: B centroid x = (0.7-0.1333*2.9)*1280 = 401.1. (KHÔNG đo ở
//     t=5.0: unit merge dài 5s, D=6s nên 1s cuối là nền đen — cùng mẫu
//     P4 b1; ở t=5.0 không còn clip nào, đo sẽ ra n=0.)
//   wipe t=2.2 (p=0.2, biên 1024): A bbox [627,1024] — mép phải KHÔNG
//     phải 1011 (cạnh hình học): đuôi feather (~+14px) chạm tới biên wipe
//     nên mép phải đo được DÍNH biên 1024; B bbox x0≈1024 (biên wipe),
//     x1≈1054.
//   wipe t=2.8 (p=0.8, biên 256): A n≈0; B centroid (0.7-0.1333*0.8)*1280 = 759.5.
//   slide t=2.2 (p=0.2): A centroid 819.2-256 = 563.2; B ngoài khung (n≈0).
//   slide t=2.8 (p=0.8): A bbox x1≈141 (tâm -51.2 + 192); B centroid 759.5+256 = 1015.5.
function transitionSpec(type) {
  const trackA = { points: [
    { t: 0, x: 0.2, y: 0.5 }, { t: 3, x: 0.8, y: 0.5 },
  ] };
  const trackB = { points: [
    { t: 0, x: 0.7, y: 0.5 }, { t: 3, x: 0.3, y: 0.5 },
  ] };
  return specWith([{ id: "v0", kind: "video", clips: [
    vclip("cA", "red720.mp4", 0, 3, {
      mask: MASK_ELL, track: trackA,
      transitionOut: { type, duration: 1 },
    }),
    vclip("cB", "green720.mp4", 3, 3, { mask: MASK_ELL, track: trackB }),
  ] }], 1280, 720);
}
function sectionT(type, mode, label) {
  console.log(`${label}: transition ${type}, mode ${mode}`);
  const r = render(transitionSpec(type), `${label.toLowerCase()}-${type}-${mode}`,
    ["--mask-mode", mode]);
  ok(r.status === 0 && outOk(r.outPath), `render ${label} OK (${r.secs.toFixed(1)}s)`);
  console.log(`   📊 ${label} ${type}/${mode} 720p 6s: ${(180 / r.secs).toFixed(2)} fps (180 frame / ${r.secs.toFixed(1)}s)`);
  ok(Math.abs(probeDuration(r.outPath) - 6) < 0.15, `${label} duration = 6s (đo ${probeDuration(r.outPath)})`);
  // t=1.0: A centroid 512.
  {
    const f = path.join(work, `f-${label}-10.png`);
    frameAt(r.outPath, 1.0, f);
    const m = measure(f, "r");
    console.log(`   📊 ${label} t=1.0: đỏ cx=${m.cx} (kỳ vọng 512) cy=${m.cy} n=${m.n}`);
    ok(Math.abs(m.cx - 512) <= 5 && Math.abs(m.cy - 360) <= 5, `${label} t=1.0 A bám track`);
  }
  // t=4.9: B centroid 401.1 (B local 2.9; t=5.0 là nền đen — xem chú thích trên).
  {
    const f = path.join(work, `f-${label}-49.png`);
    frameAt(r.outPath, 4.9, f);
    const m = measure(f, "g");
    console.log(`   📊 ${label} t=4.9: xanh lá cx=${m.cx} (kỳ vọng 401.1) cy=${m.cy} n=${m.n}`);
    ok(Math.abs(m.cx - 401.1) <= 6 && Math.abs(m.cy - 360) <= 5, `${label} t=4.9 B bám track`);
  }
  if (type === "wipeleft") {
    // t=2.2: A bbox [627,1011]; B x0≈1024 (biên wipe), x1≈1054.
    {
      const f = path.join(work, `f-${label}-22.png`);
      frameAt(r.outPath, 2.2, f);
      const ra = measure(f, "bboxr");
      const gb = measure(f, "bboxg");
      console.log(`   📊 ${label} t=2.2 wipe p=0.2: đỏ bbox x0=${ra.x0} x1=${ra.x1} (kỳ vọng ~627/~1024 dính biên wipe); xanh lá x0=${gb.x0} x1=${gb.x1} (kỳ vọng ~1024/~1054)`);
      ok(Math.abs(ra.x0 - 627) <= 12 && Math.abs(ra.x1 - 1024) <= 8, `${label} t=2.2 A bbox đúng vị trí track (mép phải dính biên wipe)`);
      ok(Math.abs(gb.x0 - 1024) <= 12 && Math.abs(gb.x1 - 1054) <= 15, `${label} t=2.2 B bắt đầu đúng biên wipe 1024`);
    }
    // t=2.8: A n≈0 (bị wipe che hết); B centroid 759.5.
    {
      const f = path.join(work, `f-${label}-28.png`);
      frameAt(r.outPath, 2.8, f);
      const ra = measure(f, "bboxr");
      const gb = measure(f, "g");
      console.log(`   📊 ${label} t=2.8 wipe p=0.8: đỏ n=${ra.n} (kỳ vọng ~0, A bị che hết); xanh lá cx=${gb.cx} (kỳ vọng 759.5) n=${gb.n}`);
      ok(ra.n < 500, `${label} t=2.8 A bị wipe che hết (n=${ra.n})`);
      ok(Math.abs(gb.cx - 759.5) <= 8 && Math.abs(gb.cy - 360) <= 5, `${label} t=2.8 B bám track`);
    }
  } else {
    // slideleft t=2.2: A centroid 563.2; B ngoài khung.
    {
      const f = path.join(work, `f-${label}-22.png`);
      frameAt(r.outPath, 2.2, f);
      const ra = measure(f, "r");
      const gb = measure(f, "bboxg");
      console.log(`   📊 ${label} t=2.2 slide p=0.2: đỏ cx=${ra.cx} (kỳ vọng 563.2) n=${ra.n}; xanh lá n=${gb.n} (kỳ vọng ~0, B chưa vào khung)`);
      ok(Math.abs(ra.cx - 563.2) <= 8 && Math.abs(ra.cy - 360) <= 5, `${label} t=2.2 A trượt đúng -256px, tâm vẫn bám track`);
      ok(gb.n < 500, `${label} t=2.2 B chưa vào khung (n=${gb.n})`);
    }
    // slideleft t=2.8: A bbox x1≈141 (lệch trái, chỉ còn mép phải); B centroid 1015.5.
    {
      const f = path.join(work, `f-${label}-28.png`);
      frameAt(r.outPath, 2.8, f);
      const ra = measure(f, "bboxr");
      const gb = measure(f, "g");
      console.log(`   📊 ${label} t=2.8 slide p=0.8: đỏ bbox x0=${ra.x0} x1=${ra.x1} (kỳ vọng x1 ~141); xanh lá cx=${gb.cx} (kỳ vọng 1015.5) n=${gb.n}`);
      ok(ra.x0 === 0 && Math.abs(ra.x1 - 141) <= 15, `${label} t=2.8 A trượt đúng -1024px (chỉ còn mép phải)`);
      ok(Math.abs(gb.cx - 1015.5) <= 8 && Math.abs(gb.cy - 360) <= 5, `${label} t=2.8 B bám track`);
    }
  }
}

// --- P: render trackgeq + png cho spec preview (đối chứng CDP) ---
// Trắng 3s, mask ellipse w=0.4 h=0.5 feather 0 (không keyframes),
// track (0,0.3)→(2,0.7). Kỳ vọng cx = 0.4/0.5/0.6 → 512/640/768 @1280,
// bbox rộng 0.4*1280 = 512 (x0 = cx-256, x1 = cx+256).
function previewSpec() {
  return specWith([{ id: "v0", kind: "video", clips: [
    vclip("c0", "white720.mp4", 0, 3, {
      mask: { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 },
      track: { points: [
        { t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 },
      ] },
    }),
  ] }], 1280, 720);
}
function sectionP() {
  console.log("P: render trackgeq + png cho spec preview (không keyframes)");
  const spec = previewSpec();
  writeFileEpermRetry(path.join(work, "p-preview-spec.json"), JSON.stringify(spec),
    { label: "test-r89-q3-p-spec", tries: 12, delayMs: 30000 });
  for (const mode of ["trackgeq", "png"]) {
    const r = render(spec, `p-preview-${mode}`, ["--mask-mode", mode]);
    ok(r.status === 0 && outOk(r.outPath), `render P ${mode} OK (${r.secs.toFixed(1)}s)`);
    console.log(`   📊 P ${mode} 720p 3s: ${(90 / r.secs).toFixed(2)} fps`);
    for (const [t, ex] of [[0.5, 512], [1.0, 640], [1.5, 768]]) {
      const f = path.join(work, `f-p-${mode}-${t}.png`);
      frameAt(r.outPath, t, f);
      const m = measure(f, "w");
      console.log(`   📊 P ${mode} t=${t}: cx=${m.cx} (kỳ vọng ${ex}) x0=${m.x0} x1=${m.x1} (kỳ vọng ${ex - 256}/${ex + 256}) n=${m.n}`);
      ok(Math.abs(m.cx - ex) <= 5 && Math.abs(m.cy - 360) <= 5, `P ${mode} t=${t} tâm đúng`);
      ok(Math.abs(m.x0 - (ex - 256)) <= 8 && Math.abs(m.x1 - (ex + 256)) <= 8,
        `P ${mode} t=${t} bề rộng đúng 512px (không keyframes → trackgeq == png)`);
    }
  }
}

prepareMedia();
const runAll = SECTION === "all";
if (runAll || SECTION === "c1") sectionC1();
if (runAll || SECTION === "c2") sectionC2();
if (runAll || SECTION === "c3") sectionC3();
if (runAll || SECTION === "c4") sectionC4();
if (runAll || SECTION === "t1") sectionT("wipeleft", "png", "T1");
if (runAll || SECTION === "t2") sectionT("wipeleft", "trackgeq", "T2");
if (runAll || SECTION === "t3") sectionT("slideleft", "png", "T3");
if (runAll || SECTION === "t4") sectionT("slideleft", "trackgeq", "T4");
if (runAll || SECTION === "p") sectionP();

console.log(`\n== test_round89_q3_trackgeq_complete (${SECTION}): ${pass} pass, ${fail} fail (WORK=${work}) ==`);
if (fail > 0) process.exit(1);
