#!/usr/bin/env node
/**
 * test_round88_p4_trackgeq_limits.js — Test THẬT Phase 9 đợt 88 P4:
 * trackgeq với track nhiều điểm + combo chưa test (nợ O3, LIMITS gộp đợt 87 §4 mục 9).
 *
 *  A-cal: track 240 điểm, 360p 2s — hiệu chuẩn tốc độ + đúng vị trí trước khi đốt render dài.
 *  A:     track 240 điểm (tối đa validator), 720p 4s — fps, wall time, tâm mask tại
 *         t=0.5/2.0/3.5 so với kỳ vọng track tuyến tính 0.2→0.8.
 *  B1:    trackgeq + clip merged (xfade fade 0.5s), CẢ 2 clip đều mask+track
 *         (O6 C6 chỉ test clip đầu có mask, đo trước vùng fade) — đo phía A,
 *         TRONG vùng fade (hợp 2 mask), và phía B.
 *  B2:    trackgeq + speed-ramp — T của geq là thời gian output hay thời gian
 *         nguồn? (ramp 0.5x→2x làm 2 thang thời gian lệch nhau rõ rệt).
 *  B3:    trackgeq + compound clip (nested sequence): leaf clip mask+track
 *         trong subSpec, đặt ở outer start=1 — flatten có giữ/remap track đúng không.
 *  B4:    trackgeq + speed-ramp + motion interpolation (minterpolate).
 *  depth:  probe parse biểu thức 240 điểm qua ffmpeg (1 frame) — hồi quy
 *         cho fix cây cân bằng ở tracking.js (trước fix fail từ N=83/93/95).
 *
 * Render bằng chính render.js (không mock), chạy TUẦN TỰ trong 1 section
 * (RAM VM thấp, các section khác chạy song song qua process riêng).
 * Đo bằng numpy/PIL trên frame PNG trích ra: centroid theo kênh màu
 * (đỏ = clip A, xanh lá = clip B) + quét vệt sáng (vis).
 *
 * Cách chạy: node src/test_round88_p4_trackgeq_limits.js [a-cal|a|b1|b2|b3|b4|all]
 * File tạm trong os.tmpdir(). Section A 720p 240 điểm có thể mất 10-40 phút
 * (tùy tải VM) — chạy riêng ở background, timeout render 3600s.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");

const SECTION = process.argv[2] || "all";
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r88p4-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, cwd, timeoutMs) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd, timeout: timeoutMs });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
function render(spec, name, extraArgs, timeoutMs) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec), { label: "test-r88-p4-spec" });
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "-y", ...(extraArgs || [])],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], timeout: timeoutMs || 1800000 });
  const secs = (Date.now() - t0) / 1000;
  if (r.error || r.status !== 0) {
    console.error(`❌ render "${name}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-3000)}`);
    process.exit(2);
  }
  return { status: r.status, outPath, secs };
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

// Đo centroid theo kênh màu + quét vệt sáng bằng numpy/PIL.
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
elif mode == "scan":
    y = float(sys.argv[3])
    row = img[int(round(y * (img.shape[0] - 1))), :, :].max(axis=1)
    flags = row > 40
    best = (0, -1); cur = None
    for i, f in enumerate(flags):
        if f and cur is None: cur = i
        elif not f and cur is not None:
            if i - 1 - cur > best[1] - best[0]: best = (cur, i - 1)
            cur = None
    if cur is not None and len(flags) - 1 - cur > best[1] - best[0]:
        best = (cur, len(flags) - 1)
    if best[1] < best[0]:
        print("x0=none x1=none center=none width=0")
    else:
        w = img.shape[1]
        print(f"x0={best[0]} x1={best[1]} center={(best[0]+best[1])/2:.1f} width={best[1]-best[0]+1}")
`;
const measurePy = path.join(work, "measure.py");
writeFileEpermRetry(measurePy, MEASURE_PY, { label: "test-r88-p4-measure-py" });
function measure(p, mode, arg) {
  const r = spawnSync("python3", [measurePy, mode, p, ...(arg !== undefined ? [String(arg)] : [])], { encoding: "utf8" });
  const m = /cx=([-\d.]+) cy=([-\d.]+) n=(\d+)/.exec(r.stdout || "");
  if (m) return { cx: Number(m[1]), cy: Number(m[2]), n: Number(m[3]) };
  const s = /x0=(\S+) x1=(\S+) center=(\S+) width=(\d+)/.exec(r.stdout || "");
  if (s) return { x0: s[1], x1: s[2], center: s[3] === "none" ? -1 : Number(s[3]), width: Number(s[4]) };
  throw new Error(`không parse được measure (${mode}): ${r.stdout} ${r.stderr}`);
}

const MASK_ELL = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.3, feather: 0.2 };
const vclip = (id, src, start, duration, extra) => ({
  id, kind: "video", src, start, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...(extra || {}),
});
const specWith = (tracks, W, H, fps) => ({
  version: "0.2.0",
  meta: { name: "r88p4", width: W, height: H, fps: fps || 30 },
  tracks,
});
// Track tuyến tính x: 0.2→0.8 trên [0, dur], y=0.5, N điểm đều.
const trackLinear = (N, dur) => ({ points: Array.from({ length: N }, (_, i) => ({
  t: (i * dur) / (N - 1), x: 0.2 + (0.6 * i) / (N - 1), y: 0.5,
})) });
const expectX = (t, dur) => 0.2 + 0.6 * (t / dur);

// --- Media thật ---
function prepareMedia() {
  console.log("== Chuẩn bị media ==");
  run("ffmpeg", ["-f", "lavfi", "-i", "color=c=red:s=1280x720:r=30:d=8",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "red720.mp4")], "tạo red720.mp4 (8s)");
  run("ffmpeg", ["-f", "lavfi", "-i", "color=c=green:s=1280x720:r=30:d=5",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "green720.mp4")], "tạo green720.mp4 (5s)");
  run("ffmpeg", ["-f", "lavfi", "-i", "color=c=red:s=640x360:r=30:d=4",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "red360.mp4")], "tạo red360.mp4 (4s)");
}

// --- A-cal: 240 điểm, 360p 2s ---
function sectionACal() {
  console.log("A-cal: track 240 điểm, 360p 2s, trackgeq");
  const track240 = trackLinear(240, 2);
  const spec = specWith([{ id: "v0", kind: "video", clips: [
    vclip("c0", "red360.mp4", 0, 2, { mask: MASK_ELL, track: track240 }),
  ] }], 640, 360);
  const r = render(spec, "a-cal-240pt-360p", ["--mask-mode", "trackgeq"], 1200000);
  ok(r.status === 0 && outOk(r.outPath), `render 240pt 360p OK (${r.secs.toFixed(1)}s)`);
  console.log(`   📊 240pt 360p 2s: ${(60 / r.secs).toFixed(2)} fps (60 frame / ${r.secs.toFixed(1)}s)`);
  for (const t of [0.5, 1.0, 1.5]) {
    const f = path.join(work, `f-acal-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    const ex = expectX(t, 2) * 640;
    console.log(`   📊 240pt t=${t}: cx=${m.cx} (kỳ vọng ${ex.toFixed(0)}, lệch ${(m.cx - ex).toFixed(1)}px) cy=${m.cy} n=${m.n}`);
    ok(Math.abs(m.cx - ex) <= 5 && Math.abs(m.cy - 180) <= 5, `240pt 360p t=${t} bám đúng vị trí (lệch ≤5px)`);
  }
}

// --- A: 240 điểm, 720p 4s ---
function sectionA() {
  console.log("A: track 240 điểm, 720p 4s, trackgeq");
  // Độ dài biểu thức geq (đối chứng số O3: 30.638 ký tự).
  const { buildMaskTrackGeqExpr } = require("./mask");
  const exprLen = buildMaskTrackGeqExpr(MASK_ELL, trackLinear(240, 4), 1280, 720).length;
  console.log(`   📊 biểu thức geq ellipse 720p, track 240 điểm: ${exprLen} ký tự`);
  ok(exprLen > 20000, `biểu thức 240 điểm dài ${exprLen} ký tự (>20k, khớp bậc O3: 30.638)`);
  const spec = specWith([{ id: "v0", kind: "video", clips: [
    vclip("c0", "red720.mp4", 0, 4, { mask: MASK_ELL, track: trackLinear(240, 4) }),
  ] }], 1280, 720);
  const r = render(spec, "a-240pt-720p", ["--mask-mode", "trackgeq"], 3600000);
  ok(r.status === 0 && outOk(r.outPath), `render 240pt 720p OK (${r.secs.toFixed(1)}s)`);
  console.log(`   📊 240pt 720p 4s: ${(120 / r.secs).toFixed(2)} fps (120 frame / ${r.secs.toFixed(1)}s)`);
  for (const t of [0.5, 2.0, 3.5]) {
    const f = path.join(work, `f-a-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    const ex = expectX(t, 4) * 1280;
    console.log(`   📊 240pt 720p t=${t}: cx=${m.cx} (kỳ vọng ${ex.toFixed(0)}, lệch ${(m.cx - ex).toFixed(1)}px) cy=${m.cy} n=${m.n}`);
    ok(Math.abs(m.cx - ex) <= 5 && Math.abs(m.cy - 360) <= 5, `240pt 720p t=${t} bám đúng vị trí (lệch ≤5px)`);
  }
}

// --- B1: merged, cả 2 clip mask+track, fade 0.5s ---
function sectionB1() {
  console.log("B1: trackgeq + merged (fade 0.5s), cả 2 clip mask+track");
  const trackA = trackLinear(3, 4); // 0.2→0.8 (t=0/2/4)
  const trackB = { points: [
    { t: 0, x: 0.7, y: 0.5 }, { t: 2, x: 0.5, y: 0.5 }, { t: 4, x: 0.3, y: 0.5 },
  ] }; // 0.7→0.3
  const spec = specWith([{ id: "v0", kind: "video", clips: [
    vclip("c1", "red720.mp4", 0, 4, { mask: MASK_ELL, track: trackA,
      transitionOut: { type: "fade", duration: 0.5 } }),
    vclip("c2", "green720.mp4", 4, 4, { mask: MASK_ELL, track: trackB }),
  ] }], 1280, 720);
  const r = render(spec, "b1-merged-both", ["--mask-mode", "trackgeq"], 1800000);
  ok(r.status === 0 && outOk(r.outPath), `render merged cả 2 mask+track OK (${r.secs.toFixed(1)}s)`);
  const dur = probeDuration(r.outPath);
  // Kỳ vọng 8s (KHÔNG phải 7.5s): unit đã merge dài 7.5s nhưng output dài
  // bằng D = declaredEnd muộn nhất = 8s (c2 start 4 + dur 4); 0.5s cuối là
  // nền đen. Cùng kết luận O6 C6 ("duration 8 s đúng").
  console.log(`   📊 duration output: ${dur}s (kỳ vọng 8 = D, unit merge 7.5s + 0.5s nền đen cuối)`);
  ok(Math.abs(dur - 8) < 0.3, `duration merged ≈ 8s (đo ${dur})`);
  // Phía A (đỏ): t=0.5 → 0.275 (352px); t=2.0 → 0.5 (640px).
  for (const [t, exFrac] of [[0.5, 0.275], [2.0, 0.5]]) {
    const f = path.join(work, `f-b1-a-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    const ex = exFrac * 1280;
    console.log(`   📊 B1 phía A (đỏ) t=${t}: cx=${m.cx} (kỳ vọng ${ex.toFixed(0)}, lệch ${(m.cx - ex).toFixed(1)}px)`);
    ok(Math.abs(m.cx - ex) <= 5, `B1 phía A t=${t} bám đúng track A (lệch ≤5px)`);
  }
  // Trong vùng fade (3.5-4.0): hợp 2 mask — A local 3.75 → 0.7625,
  // B local 0.25 → 0.675; hợp dự kiến [0.525, 0.9125], tâm 0.71875 (920px), rộng 496px.
  {
    const f = path.join(work, "f-b1-fade.png");
    frameAt(r.outPath, 3.75, f);
    const s = measure(f, "scan", 0.5);
    console.log(`   📊 B1 trong fade t=3.75: vệt sáng center=${s.center} (kỳ vọng ~920) width=${s.width} (kỳ vọng ~496) x0=${s.x0} x1=${s.x1}`);
    ok(Math.abs(s.center - 920) <= 15 && Math.abs(s.width - 496) <= 40,
      `B1 trong fade: vệt = hợp 2 mask (tâm ~920, rộng ~496)`);
  }
  // Phía B (xanh lá): B local = t-3.5; t=5.0 → local 1.5 → 0.55 (704px); t=6.5 → local 3.0 → 0.4 (512px).
  for (const [t, exFrac] of [[5.0, 0.55], [6.5, 0.4]]) {
    const f = path.join(work, `f-b1-b-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "g");
    const ex = exFrac * 1280;
    console.log(`   📊 B1 phía B (xanh lá) t=${t}: cx=${m.cx} (kỳ vọng ${ex.toFixed(0)}, lệch ${(m.cx - ex).toFixed(1)}px)`);
    ok(Math.abs(m.cx - ex) <= 5, `B1 phía B t=${t} bám đúng track B (lệch ≤5px)`);
  }
}

// --- B2: speed-ramp ---
function sectionB2() {
  console.log("B2: trackgeq + speed-ramp (0.5x → 2x, linear)");
  // Tốc độ output: 0.5→2 trên [0,2], rồi 2 trên [2,4]. Nguồn tiêu thụ
  // ∫ = (0.5+2)/2*2 + 2*2 = 6.5s ≤ 8s (red720.mp4).
  // Nếu T là thời gian output: tâm tại t=0.5/2.0/3.5 là 0.275/0.5/0.725.
  // Nếu T là thời gian nguồn (sai): t=0.5→nguồn 0.34→0.251; t=2.0→nguồn 2.5→0.575;
  // t=3.5→nguồn 5.5→kẹp 0.8. Phân biệt rõ ở t=2.0 và 3.5.
  const ramp = { keyframes: [
    { t: 0, v: 0.5, easing: "linear" },
    { t: 2, v: 2, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ] };
  const clip = vclip("c0", "red720.mp4", 0, 4, { mask: MASK_ELL, track: trackLinear(3, 4) });
  clip.speedKeyframes = ramp;
  clip.out = 6.5;
  const spec = specWith([{ id: "v0", kind: "video", clips: [clip] }], 1280, 720);
  const r = render(spec, "b2-ramp", ["--mask-mode", "trackgeq"], 1800000);
  ok(r.status === 0 && outOk(r.outPath), `render ramp+trackgeq OK (${r.secs.toFixed(1)}s)`);
  const dur = probeDuration(r.outPath);
  console.log(`   📊 duration output: ${dur}s (kỳ vọng 4)`);
  ok(Math.abs(dur - 4) < 0.3, `duration ramp ≈ 4s (đo ${dur})`);
  for (const [t, exFrac] of [[0.5, 0.275], [2.0, 0.5], [3.5, 0.725]]) {
    const f = path.join(work, `f-b2-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    const ex = exFrac * 1280;
    console.log(`   📊 B2 ramp t=${t} (output): cx=${m.cx} (kỳ vọng ${ex.toFixed(0)} nếu T=output, lệch ${(m.cx - ex).toFixed(1)}px)`);
    ok(Math.abs(m.cx - ex) <= 5, `B2 ramp t=${t} bám đúng track theo thời gian OUTPUT (lệch ≤5px)`);
  }
}

// --- B3: compound clip (nested sequence) ---
function sectionB3() {
  console.log("B3: trackgeq + compound clip (nested sequence, leaf mask+track)");
  const innerSpec = {
    version: "0.2.0",
    meta: { name: "r88p4-inner", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "inner-v", kind: "video", clips: [
      vclip("leaf", "red720.mp4", 0, 4, { mask: MASK_ELL, track: trackLinear(3, 4) }),
    ] }],
  };
  const outerSpec = specWith([{ id: "v-out", kind: "video", clips: [
    { kind: "nested", id: "compound-outer", start: 1, duration: 4,
      trim: { in: 0, out: 4 }, subSpec: innerSpec },
  ] }], 1280, 720);
  const r = render(outerSpec, "b3-nested", ["--mask-mode", "trackgeq"], 1800000);
  ok(r.status === 0 && outOk(r.outPath), `render nested+trackgeq OK (${r.secs.toFixed(1)}s)`);
  const dur = probeDuration(r.outPath);
  console.log(`   📊 duration output: ${dur}s (kỳ vọng 5 = start 1 + dur 4)`);
  ok(Math.abs(dur - 5) < 0.3, `duration nested ≈ 5s (đo ${dur})`);
  // Timeline t = 1 + local; local 0.5/2.0/3.5 → 0.275/0.5/0.725.
  for (const [t, exFrac] of [[1.5, 0.275], [3.0, 0.5], [4.5, 0.725]]) {
    const f = path.join(work, `f-b3-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    const ex = exFrac * 1280;
    console.log(`   📊 B3 nested timeline t=${t} (local ${t - 1}): cx=${m.cx} (kỳ vọng ${ex.toFixed(0)}, lệch ${(m.cx - ex).toFixed(1)}px)`);
    ok(Math.abs(m.cx - ex) <= 5, `B3 nested t=${t} bám đúng track (lệch ≤5px)`);
  }
}

// --- B4: speed-ramp + minterpolate ---
function sectionB4() {
  console.log("B4: trackgeq + speed-ramp + motion interpolation (minterpolate), 360p 2s");
  const ramp = { keyframes: [
    { t: 0, v: 0.5, easing: "linear" },
    { t: 1, v: 2, easing: "linear" },
    { t: 2, v: 2, easing: "linear" },
  ] }; // ∫ = (0.5+2)/2*1 + 2*1 = 3.25s ≤ 4s (red360.mp4)
  const clip = vclip("c0", "red360.mp4", 0, 2, { mask: MASK_ELL, track: trackLinear(3, 2) });
  clip.speedKeyframes = ramp;
  clip.out = 3.25;
  clip.motion = { interpolation: "minterpolate" };
  const spec = specWith([{ id: "v0", kind: "video", clips: [clip] }], 640, 360);
  const r = render(spec, "b4-ramp-interp", ["--mask-mode", "trackgeq"], 1800000);
  ok(r.status === 0 && outOk(r.outPath), `render ramp+minterpolate+trackgeq OK (${r.secs.toFixed(1)}s)`);
  const dur = probeDuration(r.outPath);
  console.log(`   📊 duration output: ${dur}s (kỳ vọng 2)`);
  ok(Math.abs(dur - 2) < 0.3, `duration ramp+interp ≈ 2s (đo ${dur})`);
  for (const [t, exFrac] of [[0.5, 0.35], [1.0, 0.5], [1.5, 0.65]]) {
    const f = path.join(work, `f-b4-${t}.png`);
    frameAt(r.outPath, t, f);
    const m = measure(f, "r");
    const ex = exFrac * 640;
    console.log(`   📊 B4 ramp+interp t=${t}: cx=${m.cx} (kỳ vọng ${ex.toFixed(0)}, lệch ${(m.cx - ex).toFixed(1)}px)`);
    ok(Math.abs(m.cx - ex) <= 5, `B4 ramp+interp t=${t} bám đúng track theo thời gian OUTPUT (lệch ≤5px)`);
  }
}

// --- depth: probe ngưỡng độ sâu biểu thức ffmpeg (1 frame, không render dài) ---
// Trước fix: axis-geq fail từ N=95, mask-geq từ N=83, overlay từ N=93
// (probe nhị phân /tmp/r88p4-probe-depth.cjs, ffmpeg 8.1.2). Sau fix (cây
// cân bằng) cả 3 phải parse OK ở N=240 = tối đa validator.
function sectionDepth() {
  console.log("depth: probe parse biểu thức 240 điểm qua ffmpeg (1 frame)");
  const { buildAxisExpr } = require("./tracking");
  const { buildMaskTrackGeqExpr } = require("./mask");
  const pts240 = trackLinear(240, 4).points;
  const ff = (args) => {
    const r = spawnSync("ffmpeg", args, { encoding: "utf8", timeout: 60000 });
    return r.status === 0;
  };
  const axisExpr = buildAxisExpr(pts240, "x", "T");
  ok(ff(["-v", "error", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1",
    "-vf", `geq=lum='lum(X,Y)*(${axisExpr})'`, "-frames:v", "1", "-f", "null", "-"]),
    "axis expr 240 điểm parse OK trong geq (trước fix fail từ N=95)");
  const maskExpr = buildMaskTrackGeqExpr(MASK_ELL, { points: pts240 }, 1280, 720);
  ok(ff(["-v", "error", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1",
    "-vf", `geq=lum='lum(X,Y)*(${maskExpr})'`, "-frames:v", "1", "-f", "null", "-"]),
    "mask geq expr 240 điểm parse OK (trước fix fail từ N=83)");
  const ovExpr = buildAxisExpr(pts240, "x", "(t-0)");
  ok(ff(["-v", "error", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1",
    "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1",
    "-filter_complex", `[0:v][1:v]overlay=x='(main_w*(${ovExpr})-overlay_w/2)':y='0'`,
    "-frames:v", "1", "-f", "null", "-"]),
    "overlay expr 240 điểm parse OK (trước fix fail từ N=93)");
}

prepareMedia();
const sections = { "a-cal": sectionACal, a: sectionA, b1: sectionB1, b2: sectionB2, b3: sectionB3, b4: sectionB4, depth: sectionDepth };
if (SECTION === "all") {
  for (const fn of Object.values(sections)) fn();
} else if (sections[SECTION]) {
  sections[SECTION]();
} else {
  console.error(`section không rõ: ${SECTION} (a-cal|a|b1|b2|b3|b4|all)`);
  process.exit(2);
}
console.log(`\n== test_round88_p4 (${SECTION}): ${pass} pass, ${fail} fail (WORK=${work}) ==`);
process.exit(fail > 0 ? 1 : 0);
