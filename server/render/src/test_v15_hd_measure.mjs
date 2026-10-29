#!/usr/bin/env node
/**
 * test_v15_hd_measure.mjs — Phase 9 đợt 15, luồng T5: đo parity ở điều
 * kiện nặng/thật hơn cho 3 nhóm đã matched ở điều kiện nhẹ (đợt 14).
 *
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG binary, KHÔNG dist.
 * Script này CHỈ đo (render FFmpeg thật + raster preview từ code thật)
 * và in kết quả ra stdout; người chạy tự redirect stdout vào log.
 *
 * Chạy từ gốc repo (để alias @repo-1/video-spec resolve như probe
 * ghostBlend.probe.test.ts):
 *   node --experimental-strip-types \
 *     server/render/src/test_v15_hd_measure.mjs [--only dissolve|circle|ghost] \
 *     [--ps 0.25,0.5,0.75] [--skip-x264]
 * Exit: 0 khi mọi cell render xong (kể cả cell dưới ngưỡng matched);
 *       1 khi lỗi render; 2 khi lỗi harness.
 *
 * Thiết kế đo (khác V13 ở chỗ dùng nguồn động + pix_fmt tường minh):
 * - Timeline chung mọi cell transition: fps 30, duration 0.4, offset 1
 *   (như V13): frame đích F = 30 + round(p*12) → p = 0.25/0.5/0.75 ứng
 *   với F = 33/36/39; frame 29 = thuần A, frame 42 = thuần B.
 * - Nguồn: A = testsrc2 (động, giàu chi tiết), B = mandelbrot (động,
 *   fractal) — KHÔNG tải footage có bản quyền; "footage giống thật" ở
 *   đây nghĩa là nội dung biến thiên không gian (không phải màu phẳng),
 *   vì hình học dissolve/circle chỉ phụ thuộc nội dung không gian.
 *   Nguồn phẳng đỏ/xanh giữ lại làm baseline đối chiếu.
 * - Preview lấy từ CODE THẬT: describeTransition + radialGradientWeight
 *   (transitionPreview.ts), ffmpegDissolveFrand (dissolveFrand.ts),
 *   motionBlurBlendPlan (previewEngine.ts). Không copy công thức.
 * - Pix_fmt tường minh hai đầu — VÀ BẪY ĐÀM PHÁN FORMAT CỦA XFADE
 *   (phát hiện khi chẩn đoán cell x264, xem LIMITS): xfade của FFmpeg
 *   8.1.2 CHỈ hỗ trợ format 444/gray (debug: Parsed_xfade formats =
 *   yuva444p/yuv444p/gbrp/… — không có yuv420p), nên khi đầu vào là
 *   yuv420p, FFmpeg tự chèn auto_scale nâng lên yuv444p TRƯỚC xfade.
 *   Hệ quả: cell "yuv" (format=yuv420p trước xfade) thực chất đo
 *   "đầu vào qua yuv420p + xfade chạy ở 444" — tổn thất đo được ở đó
 *   là tổn thất đầu vào, KHÔNG phải tổn thất đầu ra của product.
 *   Vì vậy script này phân biệt 3 điều kiện, đừng gộp:
 *     rgb    = xfade ở rgb24 (mô hình thuần).
 *     yuv-in = đầu vào qua yuv420p, xfade ở 444 (nhãn cũ "yuv" đã đổi
 *              thành "yuv-in" để khỏi hiểu nhầm).
 *     e2e    = đầu vào yuv420p, xfade ở 444, rồi ÉP format=yuv420p
 *              SAU xfade (tái tạo đúng bước chuyển 444→420 ở đầu ra
 *              của render.js: outFormat yuv420p + encoder yuv420p),
 *              rồi mới về rgb24 để bắt frame. Đây mới là điều kiện
 *              đầu ra thật của product (trước encoder); cell x264
 *              cộng thêm encoder lên trên e2e đó.
 * - Thang matched giữ nguyên V6/V11/V12: MATCHED ⇔ MAD ≤ 2 và ≥ 99%
 *   pixel có lệch kênh tối đa ≤ 8. Ngoài ra chỉ ghi "dưới ngưỡng",
 *   không tự đặt thêm thang XẤP XỈ/LỆCH.
 * - Ghost: preview blend = chuỗi source-over theo motionBlurBlendPlan
 *   thật; render = tmix thật của product (motion.js: tmix đi sau
 *   fps/minterpolate, trước format — ở đây đo cả tmix trên yuv420p
 *   (gần product) và trên rgb24 (đối chứng)). Weights bất đối xứng
 *   [0.2, 0.3, 0.5] (cũ→mới theo preview) để lộ được cả khả năng tmix
 *   hiểu thứ tự ngược — nếu MAD lớn ở mọi alignment, script chạy thêm
 *   chẩn đoán weights đảo và báo rõ (không tự kết luận).
 * - FPS ghost: (a) thời gian render tmix thật (ms/frame), (b) thời gian
 *   toán blend Node trên buffer 1080p/720p (proxy toán học, KHÔNG phải
 *   FPS canvas trình duyệt — trình duyệt dùng drawImage tăng tốc GPU
 *   nên số này chỉ là trần dưới cho phần toán, ghi rõ trong LIMITS).
 */
import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describeTransition, radialGradientWeight } from
  "../../../apps/web/src/lib/transitionPreview.ts";
import { ffmpegDissolveFrand } from
  "../../../apps/web/src/lib/dissolveFrand.ts";
import { motionBlurBlendPlan } from
  "../../../apps/web/src/lib/previewEngine.ts";
import transitionsPkg from "./transitions.js";

const { buildXfadeFilter } = transitionsPkg;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");

const FPS = 30;
const DUR = 0.4;
const OFFSET = 1.0;
const OFF_FRAMES = Math.round(OFFSET * FPS); // 30
const TRANS_FRAMES = Math.round(DUR * FPS); // 12

// ---------------------------------------------------------------- CLI ---
const argv = process.argv.slice(2);
function opt(name, def) {
  const eq = argv.find((a) => a.startsWith(name + "="));
  if (eq) return eq.slice(name.length + 1);
  const i = argv.indexOf(name);
  if (i >= 0 && i + 1 < argv.length && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return def;
}
const only = opt("--only", "all");
const ps = opt("--ps", "0.25,0.5,0.75").split(",").map(Number);
const skipX264 = argv.includes("--skip-x264");
const frameOf = (p) => OFF_FRAMES + Math.round(p * TRANS_FRAMES);

// ------------------------------------------------------------- helpers --
function log(...a) { console.log(...a); }

function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  return (r.stdout || "") + (r.stderr || "");
}

/** Chạy ffmpeg, ghi rawvideo rgb24 ra stdout; chỉ giữ các frame đích. */
function grabFrames(ffmpegArgs, targets, W, H) {
  const frameBytes = W * H * 3;
  const bufs = new Map(targets.map((f) => [f, Buffer.alloc(frameBytes)]));
  return new Promise((resolve, reject) => {
    let pos = 0;
    let err = "";
    const proc = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", ...ffmpegArgs,
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { stdio: ["ignore", "pipe", "pipe"] });
    proc.stderr.on("data", (d) => { err += d; });
    proc.stdout.on("data", (chunk) => {
      let off = 0;
      while (off < chunk.length) {
        const frameIdx = Math.floor(pos / frameBytes);
        const frameOff = pos % frameBytes;
        const take = Math.min(chunk.length - off, frameBytes - frameOff);
        const buf = bufs.get(frameIdx);
        if (buf) chunk.copy(buf, frameOff, off, off + take);
        off += take;
        pos += take;
      }
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve(bufs);
      else reject(new Error(`ffmpeg exit ${code}: ${err.slice(0, 600)}`));
    });
  });
}

const lavfi = (kind, W, H) => {
  if (kind === "flatA") return `color=c=red:size=${W}x${H}:rate=${FPS}:d=3`;
  if (kind === "flatB") return `color=c=blue:size=${W}x${H}:rate=${FPS}:d=3`;
  if (kind === "natA") return `testsrc2=size=${W}x${H}:rate=${FPS}`;
  if (kind === "natB") return `mandelbrot=size=${W}x${H}:rate=${FPS}`;
  throw new Error(`nguồn lạ: ${kind}`);
};

/** Graph xfade với pix_fmt tường minh. mode: "rgb" | "yuv". */
function xfadeArgs(type, srcA, srcB, W, H, mode, maxFrame) {
  const inFmt = mode === "yuv" ? "yuv420p" : "rgb24";
  const tail = mode === "yuv" ? ",format=rgb24" : "";
  const graph =
    `[0:v]format=${inFmt}[a];[1:v]format=${inFmt}[b];` +
    `[a][b]${buildXfadeFilter(type, DUR, OFFSET)}${tail}[out]`;
  return ["-f", "lavfi", "-i", srcA, "-f", "lavfi", "-i", srcB,
    "-filter_complex", graph, "-map", "[out]", "-frames:v", String(maxFrame + 1)];
}

/** Trích 1 frame nguồn (chỉ số n) đã qua format=rgb24. */
async function extractSource(kind, n, W, H) {
  const bufs = await grabFrames(
    ["-f", "lavfi", "-i", lavfi(kind, W, H),
     "-vf", `select='eq(n\\,${n})',format=rgb24`, "-frames:v", "1"],
    [0], W, H);
  return bufs.get(0);
}

/** Giá trị RGB thật của nguồn phẳng sau cùng chuỗi format của mode. */
async function probeFlat(kind, W, H, mode) {
  const vf = mode === "yuv" ? "format=yuv420p,format=rgb24" : "format=rgb24";
  const bufs = await grabFrames(
    ["-f", "lavfi", "-i", lavfi(kind, W, H), "-vf", vf, "-frames:v", "1"],
    [0], W, H);
  const b = bufs.get(0);
  return [b[0], b[1], b[2]];
}

/** So sánh render vs preview: MAD + le8 (pixel có max lệch kênh ≤ 8). */
function compare(render, previewFn, W, H) {
  let sum = 0;
  let le8 = 0;
  const total = W * H;
  for (let i = 0; i < total; i++) {
    const o = i * 3;
    const pr = previewFn(i, o);
    let mx = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(render[o + c] - pr[c]);
      sum += d;
      if (d > mx) mx = d;
    }
    if (mx <= 8) le8++;
  }
  const mad = sum / (total * 3);
  return { mad, le8: (le8 / total) * 100, tier: mad <= 2 && le8 / total * 100 >= 99 ? "MATCHED" : "DUOI-NGUONG" };
}

function flatPreview(flatA, flatB, isB) {
  return isB ? flatB : flatA;
}

// ------------------------------------------------------------ dissolve --
async function measureDissolve() {
  const W = 1920, H = 1080;
  log(`\n== DISSOLVE ${W}x${H} ==`);
  const flatRgbA = await probeFlat("flatA", W, H, "rgb");
  const flatRgbB = await probeFlat("flatB", W, H, "rgb");
  const flatYuvA = await probeFlat("flatA", W, H, "yuv");
  const flatYuvB = await probeFlat("flatB", W, H, "yuv");
  log(`flat probe rgb: A=${flatRgbA} B=${flatRgbB} | yuv: A=${flatYuvA} B=${flatYuvB}`);
  for (const p of ps) {
    const F = frameOf(p);
    const t0 = Date.now();
    const natA = await extractSource("natA", F, W, H);
    const natB = await extractSource("natB", F - OFF_FRAMES, W, H);
    const runs = await grabFrames(
      xfadeArgs("dissolve", lavfi("flatA", W, H), lavfi("flatB", W, H), W, H, "rgb", F), [F], W, H);
    const runsY = await grabFrames(
      xfadeArgs("dissolve", lavfi("flatA", W, H), lavfi("flatB", W, H), W, H, "yuv", F), [F], W, H);
    const runN = await grabFrames(
      xfadeArgs("dissolve", lavfi("natA", W, H), lavfi("natB", W, H), W, H, "rgb", F), [F], W, H);
    const runNY = await grabFrames(
      xfadeArgs("dissolve", lavfi("natA", W, H), lavfi("natB", W, H), W, H, "yuv", F), [F], W, H);
    const wallMs = Date.now() - t0;
    const cells = [
      ["rgb/flat", runs.get(F), (i) => flatPreview(flatRgbA, flatRgbB, ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p)],
      ["rgb/natural", runN.get(F), (i, o) => {
        const isB = ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p;
        const s = isB ? natB : natA;
        return [s[o], s[o + 1], s[o + 2]];
      }],
      ["yuv-in/flat", runsY.get(F), (i) => flatPreview(flatYuvA, flatYuvB, ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p)],
      ["yuv-in/natural", runNY.get(F), (i, o) => {
        const isB = ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p;
        const s = isB ? natB : natA;
        return [s[o], s[o + 1], s[o + 2]];
      }],
    ];
    for (const [name, render, prev] of cells) {
      const t1 = Date.now();
      const r = compare(render, prev, W, H);
      log(`CELL dissolve p=${p} ${name} frame=${F} MAD=${r.mad.toFixed(4)} le8=${r.le8.toFixed(3)}% tier=${r.tier} (preview-ms=${Date.now() - t1}, cell-wall-ms=${wallMs})`);
    }
  }
  // Validation ánh xạ frame: frame 29 thuần A, frame 42 thuần B (natural, rgb).
  {
    const v = await grabFrames(
      xfadeArgs("dissolve", lavfi("natA", W, H), lavfi("natB", W, H), W, H, "rgb", 42), [29, 42], W, H);
    const a29 = await extractSource("natA", 29, W, H);
    const b12 = await extractSource("natB", 12, W, H);
    const ra = compare(v.get(29), (i, o) => [a29[o], a29[o + 1], a29[o + 2]], W, H);
    const rb = compare(v.get(42), (i, o) => [b12[o], b12[o + 1], b12[o + 2]], W, H);
    log(`VALID dissolve natural rgb: frame29-vs-A29 MAD=${ra.mad.toFixed(4)} le8=${ra.le8.toFixed(3)}% | frame42-vs-B12 MAD=${rb.mad.toFixed(4)} le8=${rb.le8.toFixed(3)}%`);
  }
  // Cell encoder thật: xfade yuv420p → libx264 → giải mã frame đích.
  // Headline dùng đúng mặc định product (render.js: crf 20, preset
  // medium); thêm 1 cell crf 23/veryfast làm bằng chứng cơ chế (nếu MAD
  // tệ hơn khi lượng tử mạnh hơn → tổn thất do encoder, không phải
  // sai căn frame — căn frame đã kiểm chứng bằng chẩn đoán phân loại
  // B% ≈ 50% ở /tmp, xem LIMITS).
  if (!skipX264) {
    const fs = await import("node:fs");
    const osTmp = await import("node:os");
    const x264Cells = [
      { src: "flat", crf: 20, preset: "medium" },
      { src: "natural", crf: 20, preset: "medium" },
      { src: "flat", crf: 23, preset: "veryfast" },
    ];
    for (const { src, crf, preset } of x264Cells) {
      const p = 0.5, F = frameOf(p);
      const mp4 = `${osTmp.tmpdir()}/v15-dissolve-${src}-crf${crf}.mp4`;
      const inFmt = "yuv420p";
      const graph =
        `[0:v]format=${inFmt}[a];[1:v]format=${inFmt}[b];` +
        `[a][b]${buildXfadeFilter("dissolve", DUR, OFFSET)}[out]`;
      const enc = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y",
        "-f", "lavfi", "-i", lavfi(src === "flat" ? "flatA" : "natA", W, H),
        "-f", "lavfi", "-i", lavfi(src === "flat" ? "flatB" : "natB", W, H),
        "-filter_complex", graph, "-map", "[out]", "-frames:v", String(F + 1),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", String(crf), "-preset", preset,
        "-r", String(FPS), mp4], { encoding: "utf8" });
      if (enc.status !== 0) throw new Error(`x264 encode thất bại (${src}): ${(enc.stderr || "").slice(0, 400)}`);
      const dec = await grabFrames(
        ["-i", mp4, "-vf", `select='eq(n\\,${F})',format=rgb24`, "-frames:v", "1"], [0], W, H);
      let prev;
      if (src === "flat") {
        prev = (i) => flatPreview(flatYuvA, flatYuvB, ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p);
      } else {
        const natA = await extractSource("natA", F, W, H);
        const natB = await extractSource("natB", F - OFF_FRAMES, W, H);
        prev = (i, o) => {
          const s = ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p ? natB : natA;
          return [s[o], s[o + 1], s[o + 2]];
        };
      }
      const r = compare(dec.get(0), prev, W, H);
      log(`CELL dissolve p=${p} x264crf${crf}-${preset}/${src} frame=${F} MAD=${r.mad.toFixed(4)} le8=${r.le8.toFixed(3)}% tier=${r.tier} (mp4=${mp4}, chỉ /tmp, không stage)`);
      try { fs.unlinkSync(mp4); } catch { /* bỏ qua */ }
    }
  }
}

// ------------------------------------------------------------- circle --
async function measureCircle() {
  const W = 3840, H = 2160;
  log(`\n== CIRCLE ${W}x${H} ==`);
  const flatA = await probeFlat("flatA", W, H, "rgb");
  const flatB = await probeFlat("flatB", W, H, "rgb");
  const flatYuvA = await probeFlat("flatA", W, H, "yuv");
  const flatYuvB = await probeFlat("flatB", W, H, "yuv");
  log(`flat probe rgb: A=${flatA} B=${flatB} | yuv: A=${flatYuvA} B=${flatYuvB}`);
  for (const p of ps) {
    const F = frameOf(p);
    const natA = await extractSource("natA", F, W, H);
    const natB = await extractSource("natB", F - OFF_FRAMES, W, H);
    const jobs = [
      ["rgb/flat/open", "circleopen", "rgb", "flat"],
      ["rgb/flat/close", "circleclose", "rgb", "flat"],
      ["rgb/natural/open", "circleopen", "rgb", "natural"],
      ["rgb/natural/close", "circleclose", "rgb", "natural"],
      ["yuv-in/flat/open", "circleopen", "yuv", "flat"],
      ["yuv-in/natural/open", "circleopen", "yuv", "natural"],
    ];
    for (const [name, type, mode, src] of jobs) {
      const t0 = Date.now();
      const bufs = await grabFrames(
        xfadeArgs(type,
          lavfi(src === "flat" ? "flatA" : "natA", W, H),
          lavfi(src === "flat" ? "flatB" : "natB", W, H), W, H, mode, F), [F], W, H);
      const vis = describeTransition(type, p, W, H);
      const reg = vis.b.region;
      if (!reg || reg.kind !== "radial-gradient") throw new Error(`vùng circle lạ: ${JSON.stringify(reg)}`);
      const { cx, cy, rMax, mid, inverted } = reg;
      const prev = (i, o) => {
        const x = i % W, y = Math.floor(i / W);
        const rho = Math.hypot(x - cx, y - cy) / rMax;
        const w = radialGradientWeight(mid, rho);
        const bW = inverted ? 1 - w : w;
        const A = src === "flat" ? (mode === "yuv" ? flatYuvA : flatA) : natA;
        const B = src === "flat" ? (mode === "yuv" ? flatYuvB : flatB) : natB;
        const aS = src === "flat" ? A : [natA[o], natA[o + 1], natA[o + 2]];
        const bS = src === "flat" ? B : [natB[o], natB[o + 1], natB[o + 2]];
        return [Math.round(bW * bS[0] + (1 - bW) * aS[0]),
                Math.round(bW * bS[1] + (1 - bW) * aS[1]),
                Math.round(bW * bS[2] + (1 - bW) * aS[2])];
      };
      const r = compare(bufs.get(F), prev, W, H);
      log(`CELL ${type} p=${p} ${name} frame=${F} MAD=${r.mad.toFixed(4)} le8=${r.le8.toFixed(3)}% tier=${r.tier} (cell-ms=${Date.now() - t0})`);
    }
  }
  // Validation ánh xạ frame (natural, rgb, circleopen): 29 thuần A, 42 thuần B.
  {
    const v = await grabFrames(
      xfadeArgs("circleopen", lavfi("natA", W, H), lavfi("natB", W, H), W, H, "rgb", 42), [29, 42], W, H);
    const a29 = await extractSource("natA", 29, W, H);
    const b12 = await extractSource("natB", 12, W, H);
    const ra = compare(v.get(29), (i, o) => [a29[o], a29[o + 1], a29[o + 2]], W, H);
    const rb = compare(v.get(42), (i, o) => [b12[o], b12[o + 1], b12[o + 2]], W, H);
    log(`VALID circleopen natural rgb: frame29-vs-A29 MAD=${ra.mad.toFixed(4)} le8=${ra.le8.toFixed(3)}% | frame42-vs-B12 MAD=${rb.mad.toFixed(4)} le8=${rb.le8.toFixed(3)}%`);
  }
}

// -------------------------------------------------------------- ghost --
function blendFrames(framesOldToNew, weights) {
  // Chuỗi source-over theo motionBlurBlendPlan thật (preview.tsx dùng
  // đúng plan này). frames: Buffer rgb24, cùng W/H. Trả Buffer rgb24.
  const plan = motionBlurBlendPlan(weights, weights.length - 1);
  const n = framesOldToNew[0].length;
  const out = new Float64Array(n);
  for (let f = 0; f < framesOldToNew.length; f++) {
    const a = plan[f].blendAlpha;
    const src = framesOldToNew[f];
    if (f === 0) { for (let i = 0; i < n; i++) out[i] = src[i]; }
    else { for (let i = 0; i < n; i++) out[i] = a * src[i] + (1 - a) * out[i]; }
  }
  const buf = Buffer.alloc(n);
  for (let i = 0; i < n; i++) buf[i] = Math.round(out[i]);
  return buf;
}

async function measureGhost() {
  const WEIGHTS = [0.2, 0.3, 0.5]; // cũ → mới, theo preview (bất đối xứng)
  log(`\n== GHOST (tmix frames=3 weights=${WEIGHTS.join(" ")}) ==`);
  for (const [W, H] of [[1920, 1080], [1280, 720]]) {
    const srcFrames = new Map();
    for (const n of [42, 43, 44, 45, 46]) srcFrames.set(n, await extractSource("natA", n, W, H));
    for (const mode of ["yuv", "rgb"]) {
      const inFmt = mode === "yuv" ? "yuv420p" : "rgb24";
      const tail = mode === "yuv" ? ",format=rgb24" : "";
      const graph = `[0:v]format=${inFmt},tmix=frames=3:weights=${WEIGHTS.join(" ")}${tail}[out]`;
      const outs = await grabFrames(
        ["-f", "lavfi", "-i", lavfi("natA", W, H), "-filter_complex", graph,
         "-map", "[out]", "-frames:v", "48"], [43, 44, 45, 46, 47], W, H);
      let best = null;
      const rows = [];
      for (const end of [44, 45, 46]) {
        const blend = blendFrames([srcFrames.get(end - 2), srcFrames.get(end - 1), srcFrames.get(end)], WEIGHTS);
        for (const k of [43, 44, 45, 46, 47]) {
          const r = compare(outs.get(k), (i, o) => [blend[o], blend[o + 1], blend[o + 2]], W, H);
          rows.push(`winEnd=${end}/tmixOut=${k}:MAD=${r.mad.toFixed(3)}`);
          if (!best || r.mad < best.mad) best = { end, k, ...r, blend };
        }
      }
      log(`GHOST ${W}x${H} tmix-${mode}: best winEnd=${best.end} tmixOut=${best.k} MAD=${best.mad.toFixed(4)} le8=${best.le8.toFixed(3)}% tier=${best.tier}`);
      log(`  matrix: ${rows.join(" ")}`);
      if (W === 1920 && mode === "yuv") {
        // Signal: blend khác frame hiện tại bao nhiêu (nguồn động)?
        const cur = srcFrames.get(best.end);
        let s = 0, gt8 = 0;
        for (let i = 0; i < W * H * 3; i++) s += Math.abs(best.blend[i] - cur[i]);
        for (let i = 0; i < W * H; i++) {
          const o = i * 3;
          if (Math.max(Math.abs(best.blend[o] - cur[o]), Math.abs(best.blend[o + 1] - cur[o + 1]), Math.abs(best.blend[o + 2] - cur[o + 2])) > 8) gt8++;
        }
        log(`  signal blend-vs-current ${W}x${H}: meanAbsDiff=${(s / (W * H * 3)).toFixed(3)} px>8=${(gt8 / (W * H) * 100).toFixed(2)}%`);
      }
      if (best.mad > 2) {
        // Chẩn đoán: thử weights đảo (tmix có thể hiểu thứ tự ngược).
        const rev = [...WEIGHTS].reverse();
        let bestRev = null;
        for (const end of [44, 45, 46]) {
          const blend = blendFrames([srcFrames.get(end - 2), srcFrames.get(end - 1), srcFrames.get(end)], rev);
          for (const k of [43, 44, 45, 46, 47]) {
            const r = compare(outs.get(k), (i, o) => [blend[o], blend[o + 1], blend[o + 2]], W, H);
            if (!bestRev || r.mad < bestRev.mad) bestRev = { end, k, ...r };
          }
        }
        log(`  DIAG weights-dao ${W}x${H} tmix-${mode}: best winEnd=${bestRev.end} tmixOut=${bestRev.k} MAD=${bestRev.mad.toFixed(4)} le8=${bestRev.le8.toFixed(3)}%`);
      }
    }
  }
  // Thời gian: render tmix thật 90 frame 1080p + toán blend Node.
  {
    const t0 = Date.now();
    const enc = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error",
      "-f", "lavfi", "-i", lavfi("natA", 1920, 1080),
      "-filter_complex", `[0:v]format=yuv420p,tmix=frames=3:weights=${WEIGHTS.join(" ")}[out]`,
      "-map", "[out]", "-frames:v", "90", "-f", "null", "-"], { encoding: "utf8" });
    const ms = Date.now() - t0;
    log(`TIME tmix-render 1080p yuv: ${enc.status === 0 ? "ok" : "FAIL " + (enc.stderr || "").slice(0, 200)} ${ms}ms / 90 frame = ${(ms / 90).toFixed(1)} ms/frame = ${(90000 / ms).toFixed(1)} fps (render FFmpeg, chưa tính encode)`);
    const frames = [await extractSource("natA", 43, 1920, 1080), await extractSource("natA", 44, 1920, 1080), await extractSource("natA", 45, 1920, 1080)];
    const reps = 5;
    const times = [];
    for (let r = 0; r < reps; r++) { const a = Date.now(); blendFrames(frames, WEIGHTS); times.push(Date.now() - a); }
    times.sort((a, b) => a - b);
    log(`TIME blend-math Node 1080p: median ${times[Math.floor(reps / 2)]}ms/frame (reps=${times.join(",")}) = ${(1000 / times[Math.floor(reps / 2)]).toFixed(2)} fps-tran-toan (KHONG phai FPS canvas browser)`);
    const frames720 = [await extractSource("natA", 43, 1280, 720), await extractSource("natA", 44, 1280, 720), await extractSource("natA", 45, 1280, 720)];
    const times720 = [];
    for (let r = 0; r < reps; r++) { const a = Date.now(); blendFrames(frames720, WEIGHTS); times720.push(Date.now() - a); }
    times720.sort((a, b) => a - b);
    log(`TIME blend-math Node 720p: median ${times720[Math.floor(reps / 2)]}ms/frame = ${(1000 / times720[Math.floor(reps / 2)]).toFixed(2)} fps-tran-toan (KHONG phai FPS canvas browser)`);
  }
}

// ------------------------------------------------------- e2e (post-xfade 420) --
/** Graph e2e: đầu vào yuv420p → xfade (FFmpeg tự nâng lên 444) →
 *  ÉP format=yuv420p SAU xfade (bước chuyển 444→420 ở đầu ra product)
 *  → format=rgb24 để bắt frame. So với preview RGB thuần. */
function xfadeE2EArgs(type, srcA, srcB, W, H, maxFrame) {
  const graph =
    `[0:v]format=yuv420p[a];[1:v]format=yuv420p[b];` +
    `[a][b]${buildXfadeFilter(type, DUR, OFFSET)},format=yuv420p,format=rgb24[out]`;
  return ["-f", "lavfi", "-i", srcA, "-f", "lavfi", "-i", srcB,
    "-filter_complex", graph, "-map", "[out]", "-frames:v", String(maxFrame + 1)];
}

async function measureE2E() {
  log(`\n== E2E (post-xfade yuv420p — dieu kien dau ra that cua product) ==`);
  // Dissolve e2e p=0.5: đối chiếu với cell x264 (phải khớp gần nhau nếu
  // tổn thất nằm ở bước chuyển 444→420, không phải ở encoder).
  {
    const W = 1920, H = 1080, p = 0.5, F = frameOf(p);
    const flatA = await probeFlat("flatA", W, H, "rgb");
    const flatB = await probeFlat("flatB", W, H, "rgb");
    const natA = await extractSource("natA", F, W, H);
    const natB = await extractSource("natB", F - OFF_FRAMES, W, H);
    for (const [name, a, b, prev] of [
      ["flat", lavfi("flatA", W, H), lavfi("flatB", W, H),
       (i) => flatPreview(flatA, flatB, ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p)],
      ["natural", lavfi("natA", W, H), lavfi("natB", W, H),
       (i, o) => { const s = ffmpegDissolveFrand(i % W, Math.floor(i / W)) < p ? natB : natA; return [s[o], s[o + 1], s[o + 2]]; }],
    ]) {
      const bufs = await grabFrames(xfadeE2EArgs("dissolve", a, b, W, H, F), [F], W, H);
      const r = compare(bufs.get(F), prev, W, H);
      log(`CELL dissolve-e2e p=${p} ${name} frame=${F} MAD=${r.mad.toFixed(4)} le8=${r.le8.toFixed(3)}% tier=${r.tier}`);
    }
  }
  // Circle e2e 4K: open natural đủ 3 p + open flat p=0.5 + close natural p=0.5.
  {
    const W = 3840, H = 2160;
    const flatA = await probeFlat("flatA", W, H, "rgb");
    const flatB = await probeFlat("flatB", W, H, "rgb");
    const jobs = [];
    for (const p of ps) jobs.push([`open/natural p=${p}`, "circleopen", "natural", p]);
    jobs.push(["open/flat p=0.5", "circleopen", "flat", 0.5]);
    jobs.push(["close/natural p=0.5", "circleclose", "natural", 0.5]);
    for (const [name, type, src, p] of jobs) {
      const F = frameOf(p);
      const natA = src === "natural" ? await extractSource("natA", F, W, H) : null;
      const natB = src === "natural" ? await extractSource("natB", F - OFF_FRAMES, W, H) : null;
      const bufs = await grabFrames(
        xfadeE2EArgs(type,
          lavfi(src === "flat" ? "flatA" : "natA", W, H),
          lavfi(src === "flat" ? "flatB" : "natB", W, H), W, H, F), [F], W, H);
      const vis = describeTransition(type, p, W, H);
      const reg = vis.b.region;
      if (!reg || reg.kind !== "radial-gradient") throw new Error(`vùng circle lạ: ${JSON.stringify(reg)}`);
      const { cx, cy, rMax, mid, inverted } = reg;
      const prev = (i, o) => {
        const x = i % W, y = Math.floor(i / W);
        const rho = Math.hypot(x - cx, y - cy) / rMax;
        const w = radialGradientWeight(mid, rho);
        const bW = inverted ? 1 - w : w;
        const aS = src === "flat" ? flatA : [natA[o], natA[o + 1], natA[o + 2]];
        const bS = src === "flat" ? flatB : [natB[o], natB[o + 1], natB[o + 2]];
        return [Math.round(bW * bS[0] + (1 - bW) * aS[0]),
                Math.round(bW * bS[1] + (1 - bW) * aS[1]),
                Math.round(bW * bS[2] + (1 - bW) * aS[2])];
      };
      const r = compare(bufs.get(F), prev, W, H);
      log(`CELL ${type}-e2e ${name} frame=${F} MAD=${r.mad.toFixed(4)} le8=${r.le8.toFixed(3)}% tier=${r.tier}`);
    }
  }
}

// ---------------------------------------------------------------- main --
async function main() {
  const cpu = os.cpus()[0];
  const ffver = runCapture("ffmpeg", ["-version"]).split("\n")[0];
  const gpu = runCapture("sh", ["-c", "command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L 2>/dev/null || echo none"]).trim();
  log(`MACHINE cpu=${cpu.model} x${os.cpus().length} mem=${(os.totalmem() / 2 ** 30).toFixed(1)}GiB ffmpeg=${ffver} gpu=${gpu}`);
  log(`ROOT=${ROOT} only=${only} ps=${ps.join(",")} skipX264=${skipX264}`);
  if (only === "all" || only === "dissolve") await measureDissolve();
  if (only === "all" || only === "circle") await measureCircle();
  if (only === "all" || only === "ghost") await measureGhost();
  if (only === "all" || only === "e2e") await measureE2E();
  log("\nDONE v15");
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
