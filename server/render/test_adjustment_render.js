#!/usr/bin/env node
/**
 * test_adjustment_render.js — Kiểm chứng adjustment layer ĐÃ NỐI VÀO
 * render.js thật (Phase 9, luồng R1). Khác test_adjustment.js §C/D (dựng
 * filter_complex tay mô phỏng điểm nối): file này chạy CLI render.js thật
 * (`node src/render.js --spec ... --out ...`) và so frame của MP4 thật.
 *
 * Case:
 *  A. Unit splitClipByLayers: biên layer, ánh xạ in (speed / reverse),
 *     chạm biên không tách, layer chồng nhau giữ thứ tự.
 *  B. Render: 1 clip 0-6s, layer [2,4) brightness 60 qua render.js →
 *     frame ngoài layer (t=1, t=5) giữ nguyên theo từng pixel so với
 *     baseline (mean abs diff < 1.5 — chỉ nhiễu dự đoán liên frame của
 *     x264, chuỗi filter của đoạn ngoài layer giữ nguyên 100%),
 *     frame trong layer (t=3) ĐỔI pixel mạnh; tổng thời lượng vẫn 6s.
 *  C. Render: clip giao biên — 2 clip kề nhau (0-3s, 3-6s), layer [2,4)
 *     tách CẢ HAI clip: t=1 ==, t=2.5 đổi, t=3.5 đổi, t=5 ==.
 *  D. Render: layer LUT vcut-cyberpunk [1,5) → t=0.5 ==, t=3 đổi.
 *  E. Render: 2 layer chồng cùng cửa sổ [2,4) (brightness + grayscale)
 *     khác cả baseline lẫn layer đơn tại t=3.
 *  F. Render: clip speed 2 (0-3s, in 0 out 6), layer [1,2) → t=0.5 ==,
 *     t=1.5 đổi, t=2.5 == (ánh xạ in theo speed đúng).
 *  G. Render: clip reverse 0-4s, layer [1,3) → t=0.5 ==, t=2 đổi, t=3.5 ==;
 *     frame trong layer khớp eq(brightness) áp lên frame baseline cùng
 *     thời điểm (chứng minh đoạn reverse không bị lấy nhầm nguồn), và
 *     khác eq áp lên frame baseline ở t=1 / t=3 (không lấy lệch 1s).
 *  H. Fail fast (thoát != 0, stderr nhắc adjustment): layer giao clip dính
 *     transition; layer LUT không tồn tại; layer cắt giữa clip speedKeyframes.
 *
 * Chạy: node test_adjustment_render.js   (cần ffmpeg/ffprobe trên PATH)
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-adj-render-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });
const ASSETS = path.join(HERE, "..", "..", "assets");

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function eq(a, b, m) { ok(m, a === b, `nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`); }
function ff(args, opts = {}) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], opts);
}

const adj = require("./src/adjustment");

// ---- A. Unit split ----
console.log("== A. Unit splitClipByLayers ==");
{
  const L = { id: "adj", start: 2, duration: 2, filters: [{ color: { brightness: 20 } }] };
  const segs = adj.splitClipByLayers({ id: "c", start: 0, duration: 6, in: 1, speed: 1 }, [L]);
  eq(segs.map((s) => [s.start, s.duration]).flat().join(","), "0,2,2,2,4,2", "clip 0-6 tách thành [0,2) [2,4) [4,6)");
  eq(segs.map((s) => s.in).join(","), "1,3,5", "in_seg = in + offset * speed");
  eq(segs.map((s) => s.layers.length).join(","), "0,1,0", "chỉ đoạn giữa giao layer");
  eq(adj.splitClipByLayers({ id: "c", start: 0, duration: 2, in: 0 }, [L]).length, 1,
    "clip kết thúc đúng start layer → không tách");
  const sp = adj.splitClipByLayers({ id: "c", start: 0, duration: 3, in: 0, speed: 2 }, [L]);
  eq(sp.map((s) => [s.start, s.duration, s.in]).flat().join(","), "0,2,0,2,1,4", "speed 2: in_seg đúng");
  const rv = adj.splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0, reverse: true }, [
    { id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] },
  ]);
  eq(rv.map((s) => [s.start, s.in]).flat().join(","), "0,3,1,1,3,0", "reverse: đoạn offset o lấy nguồn ở đầu xa");
  const stacked = adj.splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0 }, [
    { id: "a", start: 1, duration: 2, filters: [{ color: { brightness: 10 } }] },
    { id: "b", start: 1, duration: 2, filters: [{ color: { contrast: 10 } }] },
  ]);
  eq(stacked[1].layers.map((l) => l.id).join(","), "a,b", "2 layer chồng: đoạn giữa giữ thứ tự mảng");
}

// ---- Helpers render thật ----
ff(["-y", "-f", "lavfi", "-i", "testsrc2=s=320x240:d=6:r=30", "-pix_fmt", "yuv420p",
  path.join(MEDIA, "src.mp4")]);

function vclip(id, start, duration, inPt, outPt, extra = {}) {
  return { id, kind: "video", start, duration, in: inPt, out: outPt, src: "src.mp4", ...extra };
}
function specWith(clips, adjustmentLayers) {
  const spec = {
    version: "0.2.0",
    meta: { name: "adj-render-test", width: 320, height: 240, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips }],
  };
  if (adjustmentLayers !== undefined) spec.adjustmentLayers = adjustmentLayers;
  return spec;
}
let n = 0;
function renderSpec(spec, label) {
  const specPath = path.join(WORK, `spec-${label}.json`);
  const outPath = path.join(WORK, `out-${label}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const r = spawnSync("node", [path.join(HERE, "src", "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
    "--encoder", "libx264", "-y", "-q"], { encoding: "utf8" });
  return { ok: r.status === 0, outPath, stderr: (r.stderr || "") + (r.stdout || ""), status: r.status };
}
function rawFrame(mp4, t, vf) {
  const a = ["-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", mp4,
    "-frames:v", "1"];
  if (vf) a.push("-vf", vf);
  a.push("-f", "rawvideo", "-pix_fmt", "rgb24", "-");
  return execFileSync("ffmpeg", a, { maxBuffer: 64 * 1024 * 1024 });
}
/**
 * So sánh từng pixel 2 frame: { mean (sai khác trung bình / kênh / pixel,
 * thang 0..255), pctGt10 (% pixel lệch > 10) }. Ngưỡng đã đo thật (xem
 * LIMITS): frame ngoài layer chỉ lệch do nhiễu dự đoán liên frame của
 * x264 (mean <= 0.92, pctGt10 <= 2.1%), frame trong layer brightness 60 có
 * mean ~77, layer LUT có mean ~3.1 / pctGt10 ~7.7%. Vì vậy "ngoài layer giữ
 * nguyên" được kiểm bằng mean < 1.5 (không claim bằng nhau từng byte sau
 * khi qua encoder có dự đoán liên frame — chuỗi filter của đoạn ngoài
 * layer thì giữ nguyên 100%, xem ADJUSTMENT_LIMITS.md).
 */
function frameStats(mp4A, mp4B, t, vfB) {
  const a = rawFrame(mp4A, t);
  const b = rawFrame(mp4B, t, vfB);
  let sum = 0, gt10 = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    sum += d;
    if (d > 10) gt10++;
  }
  return { mean: sum / a.length, pctGt10: 100 * gt10 / a.length };
}
function durationOf(mp4) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", mp4], { encoding: "utf8" });
  return parseFloat(out.trim());
}
const BRIGHT60 = { id: "adj", start: 2, duration: 2, filters: [{ color: { brightness: 60 } }] };

// ---- B. 1 clip, layer giữa ----
console.log("== B. Render 1 clip 0-6s, layer [2,4) brightness 60 ==");
{
  const base = renderSpec(specWith([vclip("c1", 0, 6, 0, 6)]), "b-base");
  const layered = renderSpec(specWith([vclip("c1", 0, 6, 0, 6)], [BRIGHT60]), "b-layered");
  ok("baseline render OK", base.ok, base.stderr.slice(-300));
  ok("layered render OK", layered.ok, layered.stderr.slice(-300));
  const s1 = frameStats(base.outPath, layered.outPath, 1);
  const s3 = frameStats(base.outPath, layered.outPath, 3);
  const s5 = frameStats(base.outPath, layered.outPath, 5);
  console.log(`    mean t=1 ${s1.mean.toFixed(3)} t=3 ${s3.mean.toFixed(3)} t=5 ${s5.mean.toFixed(3)}`);
  ok("t=1 ngoài layer: giữ nguyên (mean < 1.5, chỉ nhiễu encoder)", s1.mean < 1.5, `mean=${s1.mean.toFixed(3)}`);
  ok("t=5 ngoài layer: giữ nguyên (mean < 1.5, chỉ nhiễu encoder)", s5.mean < 1.5, `mean=${s5.mean.toFixed(3)}`);
  ok("t=3 trong layer: pixel đổi mạnh (mean > 20)", s3.mean > 20, `mean=${s3.mean.toFixed(3)}`);
  ok("thời lượng layered vẫn 6s", Math.abs(durationOf(layered.outPath) - 6) < 0.2,
    `dur=${durationOf(layered.outPath)}`);
}

// ---- C. Clip giao biên: 2 clip kề nhau ----
console.log("== C. Render 2 clip kề nhau, layer [2,4) tách cả hai ==");
{
  const clips = [vclip("a", 0, 3, 0, 3), vclip("b", 3, 3, 3, 6)];
  const base = renderSpec(specWith(clips), "c-base");
  const layered = renderSpec(specWith(clips, [BRIGHT60]), "c-layered");
  ok("baseline 2 clip OK", base.ok, base.stderr.slice(-300));
  ok("layered 2 clip OK", layered.ok, layered.stderr.slice(-300));
  const st = (x) => frameStats(base.outPath, layered.outPath, x);
  console.log(`    mean t=1 ${st(1).mean.toFixed(3)} t=2.5 ${st(2.5).mean.toFixed(3)} ` +
    `t=3.5 ${st(3.5).mean.toFixed(3)} t=5 ${st(5).mean.toFixed(3)}`);
  ok("t=1 (clip A ngoài layer): giữ nguyên", st(1).mean < 1.5, `mean=${st(1).mean.toFixed(3)}`);
  ok("t=2.5 (clip A trong layer): đổi", st(2.5).mean > 20, `mean=${st(2.5).mean.toFixed(3)}`);
  ok("t=3.5 (clip B trong layer): đổi", st(3.5).mean > 20, `mean=${st(3.5).mean.toFixed(3)}`);
  ok("t=5 (clip B ngoài layer): giữ nguyên", st(5).mean < 1.5, `mean=${st(5).mean.toFixed(3)}`);
}

// ---- D. Layer LUT ----
console.log("== D. Render layer LUT vcut-cyberpunk [1,5) ==");
{
  const lutLayer = { id: "lut", start: 1, duration: 4, filters: [{ lut: "vcut-cyberpunk" }] };
  const base = renderSpec(specWith([vclip("c1", 0, 6, 0, 6)]), "d-base");
  const layered = renderSpec(specWith([vclip("c1", 0, 6, 0, 6)], [lutLayer]), "d-layered");
  ok("LUT layered render OK", layered.ok, layered.stderr.slice(-300));
  const d05 = frameStats(base.outPath, layered.outPath, 0.5);
  const d3 = frameStats(base.outPath, layered.outPath, 3);
  console.log(`    mean t=0.5 ${d05.mean.toFixed(3)} t=3 ${d3.mean.toFixed(3)} pctGt10(t=3) ${d3.pctGt10.toFixed(2)}%`);
  ok("t=0.5 ngoài LUT layer: giữ nguyên", d05.mean < 1.5, `mean=${d05.mean.toFixed(3)}`);
  ok("t=3 trong LUT layer: đổi (mean > 2, pctGt10 > 5%)",
    d3.mean > 2 && d3.pctGt10 > 5, `mean=${d3.mean.toFixed(3)} pctGt10=${d3.pctGt10.toFixed(2)}%`);
}

// ---- E. 2 layer chồng ----
console.log("== E. Render 2 layer chồng [2,4) ==");
{
  const gray = { id: "gray", start: 2, duration: 2, filters: [{ effects: [{ type: "grayscale", intensity: 1 }] }] };
  const single = renderSpec(specWith([vclip("c1", 0, 6, 0, 6)], [BRIGHT60]), "e-single");
  const stacked = renderSpec(specWith([vclip("c1", 0, 6, 0, 6)], [BRIGHT60, gray]), "e-stacked");
  ok("stacked render OK", stacked.ok, stacked.stderr.slice(-300));
  const e3 = frameStats(single.outPath, stacked.outPath, 3);
  ok("2 layer chồng khác layer đơn tại t=3", e3.mean > 10, `mean=${e3.mean.toFixed(3)}`);
}

// ---- F. Speed 2 ----
console.log("== F. Render clip speed 2, layer [1,2) ==");
{
  const clip = vclip("c1", 0, 3, 0, 6, { speed: 2 });
  const layer = { id: "adj", start: 1, duration: 1, filters: [{ color: { brightness: 60 } }] };
  const base = renderSpec(specWith([clip]), "f-base");
  const layered = renderSpec(specWith([clip], [layer]), "f-layered");
  ok("speed2 layered render OK", layered.ok, layered.stderr.slice(-300));
  const f05 = frameStats(base.outPath, layered.outPath, 0.5);
  const f15 = frameStats(base.outPath, layered.outPath, 1.5);
  const f25 = frameStats(base.outPath, layered.outPath, 2.5);
  console.log(`    mean t=0.5 ${f05.mean.toFixed(3)} t=1.5 ${f15.mean.toFixed(3)} t=2.5 ${f25.mean.toFixed(3)}`);
  ok("t=0.5 ngoài layer: giữ nguyên", f05.mean < 1.5, `mean=${f05.mean.toFixed(3)}`);
  ok("t=1.5 trong layer: đổi", f15.mean > 20, `mean=${f15.mean.toFixed(3)}`);
  ok("t=2.5 ngoài layer: giữ nguyên", f25.mean < 1.5, `mean=${f25.mean.toFixed(3)}`);
}

// ---- G. Reverse ----
console.log("== G. Render clip reverse 0-4s, layer [1,3) ==");
{
  const clip = vclip("c1", 0, 4, 0, 4, { reverse: true });
  const layer = { id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 60 } }] };
  const base = renderSpec(specWith([clip]), "g-base");
  const layered = renderSpec(specWith([clip], [layer]), "g-layered");
  ok("reverse layered render OK", layered.ok, layered.stderr.slice(-300));
  // So từng pixel: frame layered t=2 so với baseline t=2 + eq (vf áp lên
  // frame baseline — frameStats(mp4A, mp4B, t, vfB) áp vf cho mp4B).
  const g05 = frameStats(base.outPath, layered.outPath, 0.5);
  const g2 = frameStats(base.outPath, layered.outPath, 2);
  const g35 = frameStats(base.outPath, layered.outPath, 3.5);
  const eq2 = frameStats(layered.outPath, base.outPath, 2, "eq=brightness=0.6");
  // So với baseline ở t khác thì frameStats không đủ (nó chỉ so cùng t)
  // nên tính riêng bằng rawFrame.
  const rawEq = (t) => rawFrame(base.outPath, t, "eq=brightness=0.6");
  const rawL2 = rawFrame(layered.outPath, 2);
  const pixDiff = (a, b) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    return sum / a.length;
  };
  const dEq1 = pixDiff(rawL2, rawEq(1));
  const dEq3 = pixDiff(rawL2, rawEq(3));
  console.log(`    mean t=0.5 ${g05.mean.toFixed(3)} t=2 ${g2.mean.toFixed(3)} t=3.5 ${g35.mean.toFixed(3)} ` +
    `| layered t=2 vs eq(base t=2) ${eq2.mean.toFixed(3)} vs eq(t=1) ${dEq1.toFixed(3)} vs eq(t=3) ${dEq3.toFixed(3)}`);
  ok("t=0.5 ngoài layer: giữ nguyên", g05.mean < 1.5, `mean=${g05.mean.toFixed(3)}`);
  ok("t=2 trong layer: đổi", g2.mean > 20, `mean=${g2.mean.toFixed(3)}`);
  ok("t=3.5 ngoài layer: giữ nguyên", g35.mean < 1.5, `mean=${g35.mean.toFixed(3)}`);
  ok("t=2 khớp eq(baseline t=2) từng pixel (mean < 1.5)",
    eq2.mean < 1.5, `mean=${eq2.mean.toFixed(3)}`);
  ok("t=2 KHÔNG khớp eq(baseline t=1) — không lấy lệch nguồn",
    dEq1 > 5, `mean=${dEq1.toFixed(3)}`);
  ok("t=2 KHÔNG khớp eq(baseline t=3) — không lấy lệch nguồn",
    dEq3 > 5, `mean=${dEq3.toFixed(3)}`);
}

// ---- H. Fail fast ----
console.log("== H. Fail fast ==");
{
  const transClips = [
    vclip("a", 0, 3, 0, 3, { transitionOut: { type: "fade", duration: 1 } }),
    vclip("b", 3, 3, 3, 6),
  ];
  const r1 = renderSpec(specWith(transClips, [{ id: "adj", start: 1, duration: 1, filters: [{ color: { brightness: 60 } }] }]), "h-trans");
  ok("layer giao clip transition → render thất bại, nhắc adjustment",
    !r1.ok && /adjustment/i.test(r1.stderr), `status=${r1.status} tail=${r1.stderr.slice(-200)}`);
  const r2 = renderSpec(specWith([vclip("c1", 0, 6, 0, 6)],
    [{ id: "bad", start: 1, duration: 2, filters: [{ lut: "khong-ton-tai" }] }]), "h-badlut");
  ok("layer LUT lạ → render thất bại", !r2.ok, `status=${r2.status}`);
  const rampClip = vclip("c1", 0, 4, 0, 4, {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
  });
  const r3 = renderSpec(specWith([rampClip],
    [{ id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 60 } }] }]), "h-ramp");
  ok("layer cắt giữa clip speedKeyframes → render thất bại, nhắc adjustment",
    !r3.ok && /adjustment/i.test(r3.stderr), `status=${r3.status} tail=${r3.stderr.slice(-200)}`);
  // Đối chứng: layer bao trọn clip ramp thì KHÔNG bị cổng này (render OK).
  const r4 = renderSpec(specWith([rampClip],
    [{ id: "adj", start: 0, duration: 4, filters: [{ color: { brightness: 60 } }] }]), "h-ramp-full");
  ok("layer bao trọn clip ramp → render OK (không tách)", r4.ok, r4.stderr.slice(-300));
}

console.log(`\n==========================================\n🎉 ADJUSTMENT RENDER TEST: ${pass} pass, ${fail} fail\n==========================================`);
process.exit(fail > 0 ? 1 : 0);
