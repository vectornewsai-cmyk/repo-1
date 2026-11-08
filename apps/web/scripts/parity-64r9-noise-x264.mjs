#!/usr/bin/env node
/**
 * parity-64r9-noise-x264.mjs — Phase 9 đợt 64, luồng R9:
 * Phân rã lệch noise headed + sharpen viewport (nợ mở đợt 63 R8 §8).
 *
 * (a) Noise: đo nhiễu render ở nhiều preset x264 (ultrafast/superfast/
 *     veryfast/medium) × CRF (0/12/18/23) và so với encode lossless
 *     (CRF 0) + chuỗi không-codec (rawvideo) để tách phần lệch do codec
 *     khỏi phần lệch do mô hình addYuvNoise. Dùng lại snapshot preview
 *     headed của đợt 63 R8 (effectCanvas.ts + preview.tsx không đổi kể
 *     từ đợt 63 — mtime 02:54 / 03:43 08/11 — nên snapshot vẫn hợp lệ).
 * (b) Sharpen: thử nhiều scaler FFmpeg (bilinear/bicubic/lanczos/area/
 *     spline/neighbor) + encode lossless để xem le8 có lên ≥99% không;
 *     chẩn đoán thứ tự (sharpen-trước-downscale vs downscale-trước-
 *     sharpen) bằng unsharp ở khổ viewport.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/parity-64r9-noise-x264.mjs
 * Env: R64_SCRATCH (mặc định hidden_files/round64-r9), R64_SKIP_A=1 để
 * bỏ phần A (flat-frame), R64_SKIP_BC=1 để bỏ phần B/C (headed reuse).
 * Exit 0 khi mọi phép đo xong có số; 1 có phép đo lỗi; 2 harness lỗi.
 * KHÔNG push/tag/binary. KHÔNG sửa code sản phẩm trong harness này.
 * Kết quả: JSON + bảng in ra stdout; LIMITS xem
 * docs/PHASE9_ROUND64_R9_YUV_NOISE_X264_LIMITS.md.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const R63 = path.join(GOAL, "round63-r8");
const R63_RENDER = path.join(R63, "render");
const R63_MEDIA = path.join(R63, "media");
const SCRATCH = process.env.R64_SCRATCH || path.join(GOAL, "round64-r9");
const RENDER_JS = path.join(ROOT, "server", "render", "src", "render.js");
const MEDIA_FILE = path.join(R63_MEDIA, "test-pattern.mp4");

const WINDOWS = {
  w1440: { w: 489, h: 275 },
  w1920: { w: 809, h: 455 },
  w2560: { w: 1733, h: 975 },
};
const COMBOS = [
  { preset: "veryfast", crf: 0 },
  { preset: "veryfast", crf: 12 },
  { preset: "veryfast", crf: 18 },
  { preset: "veryfast", crf: 23 },
  { preset: "ultrafast", crf: 18 },
  { preset: "superfast", crf: 18 },
  { preset: "medium", crf: 18 },
  { preset: "medium", crf: 0 },
];
const SCALERS = ["bilinear", "bicubic", "lanczos", "area", "spline", "neighbor"];
const SCALER_COMBOS = [
  { preset: "veryfast", crf: 0 },
  { preset: "veryfast", crf: 18 },
  { preset: "ultrafast", crf: 18 },
  { preset: "medium", crf: 18 },
];

function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại (exit ${r.status}): ${(r.stderr || r.stdout || "").slice(0, 400)}`);
  return r;
}
const key = (c) => `${c.preset}-crf${c.crf}`;

// ---- thống kê delta (mảng lệch xen kẽ R,G,B), copy logic compare R63 ----
function channelStats(d) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let i = c; i < d.length; i += 3) s += d[i];
    mean[c] = s / n;
  }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) {
      const v = d[i] - mean[c];
      s2 += v * v; s4 += v * v * v * v;
    }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(+(s4 / n / (std ** 4) - 3).toFixed(2));
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(+(s / n / (out.std[a] * out.std[b])).toFixed(3));
  }
  return out;
}
function deltaStatsOfBuffers(a, b, w = 0, h = 0, step = 4) {
  // a,b: Buffer rgb24 cùng kích thước. Trả thống kê của (a-b).
  // Lấy mẫu thưa (mặc định mỗi 4px theo cả 2 chiều, ~1/16 số pixel) để
  // tính JS không bị chậm trên buffer 30 frame: 1,7M mẫu vẫn đủ chính
  // xác cho std/kurt/corr (sai số chuẩn của std ~0,05%).
  if (a.length !== b.length) throw new Error(`buffer lệch kích thước ${a.length} != ${b.length}`);
  if (!w || !h) { // không biết khổ: lấy mẫu tuyến tính theo chỉ số byte
    const d = [];
    for (let i = 0; i < a.length; i += step * 3) { d.push(a[i] - b[i], a[i + 1] - b[i + 1], a[i + 2] - b[i + 2]); }
    return channelStats(d);
  }
  const frameStride = w * h * 3;
  const frames = a.length / frameStride;
  const d = [];
  for (let f = 0; f < frames; f++) {
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = f * frameStride + (y * w + x) * 3;
        d.push(a[i] - b[i], a[i + 1] - b[i + 1], a[i + 2] - b[i + 2]);
      }
    }
  }
  return channelStats(d);
}
function gridPoints(snap) {
  const cols = Math.ceil(snap.w / snap.step);
  const pts = [];
  for (let i = 0; i < snap.n; i++) {
    const x = (i % cols) * snap.step;
    const y = Math.floor(i / cols) * snap.step;
    pts.push({ i, x, y });
  }
  return pts;
}
function deltaCompare(previewA, previewB, renderA, renderB, vw, vh, rect) {
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const pts = gridPoints(previewA).filter((p) => p.x >= vx0 && p.x < vx0 + vw && p.y >= vy0 && p.y < vy0 + vh);
  const dP = [], dR = [];
  let sumAbs = 0, le8 = 0, le32 = 0;
  for (const p of pts) {
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const dp = previewB.data[pi + c] - previewA.data[pi + c];
      const dr = renderB[ri + c] - renderA[ri + c];
      dP.push(dp); dR.push(dr);
      const d = Math.abs(dp - dr);
      sumAbs += d;
      if (d > dmax) dmax = d;
    }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  const n = pts.length;
  return {
    n,
    deltaMad: +(sumAbs / (n * 3)).toFixed(3),
    deltaLe8: +(le8 / n).toFixed(4),
    deltaLe32: +(le32 / n).toFixed(4),
    preview: channelStats(dP),
    render: channelStats(dR),
  };
}
function noiseVerdict(d) {
  const ratios = d.render.std.map((s, i) => +(d.preview.std[i] / s).toFixed(2));
  const okStd = ratios.every((r) => r >= 0.85 && r <= 1.18);
  const dCorr = d.preview.corr.map((c, i) => Math.abs(c - d.render.corr[i]));
  const okCorr = dCorr.every((x) => x <= 0.12);
  const dKurt = d.preview.kurt.map((k, i) => Math.abs(k - d.render.kurt[i]));
  const okKurt = dKurt.every((x) => x <= 0.35);
  return {
    ratios, okStd, corrDiff: dCorr.map((x) => +x.toFixed(3)), okCorr,
    kurtDiff: dKurt.map((x) => +x.toFixed(3)), okKurt,
    verdict: okStd && okCorr && okKurt ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
  };
}

// ---- Phần A: flat-frame, codec-only --------------------------------------
function partA() {
  log("== Phần A: codec-only trên nền phẳng 128 (30 frame, alls=28/50) ==");
  const W = 1280, H = 720;
  const out = {};
  function encodeFlat(alls, combo) {
    const tag = alls === null ? "plain" : `noise${alls}`;
    const file = path.join(SCRATCH, `flat-${tag}-${combo ? key(combo) : "raw"}.mp4`);
    const raw = path.join(SCRATCH, `flat-${tag}-${combo ? key(combo) : "raw"}.raw`);
    const vf = alls === null
      ? "format=yuv420p"
      : `format=yuv420p,noise=alls=${alls}:allf=t`;
    if (!combo) {
      // Tham chiếu không-codec: ra rawvideo trực tiếp.
      if (fs.existsSync(raw) && fs.statSync(raw).size === 30 * W * H * 3) return raw;
      run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=0x808080:s=${W}x${H}:r=30:d=1`,
        "-vf", `${vf},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", raw], `flat ref ${tag}`);
      return raw;
    }
    // Cache chỉ tin khi đủ kích thước (lượt chạy trước bị kill giữa chừng
    // có thể để lại .raw dở dang — kiểm tra size thay vì chỉ tồn tại).
    if (fs.existsSync(raw) && fs.existsSync(file) && fs.statSync(raw).size === 30 * W * H * 3) return raw;
    run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=0x808080:s=${W}x${H}:r=30:d=1`,
      "-vf", vf, "-c:v", "libx264", "-preset", combo.preset, "-crf", String(combo.crf),
      "-pix_fmt", "yuv420p", file], `flat encode ${tag} ${key(combo)}`);
    run("ffmpeg", ["-v", "error", "-y", "-i", file,
      "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
      "-f", "rawvideo", "-pix_fmt", "rgb24", raw], `flat decode ${tag} ${key(combo)}`);
    return raw;
  }
  const combosA = [
    { preset: "ultrafast", crf: 0 }, { preset: "ultrafast", crf: 12 },
    { preset: "ultrafast", crf: 18 }, { preset: "ultrafast", crf: 23 },
    { preset: "superfast", crf: 0 }, { preset: "superfast", crf: 18 },
    { preset: "veryfast", crf: 0 }, { preset: "veryfast", crf: 12 },
    { preset: "veryfast", crf: 18 }, { preset: "veryfast", crf: 23 },
    { preset: "medium", crf: 0 }, { preset: "medium", crf: 12 },
    { preset: "medium", crf: 18 }, { preset: "medium", crf: 23 },
  ];
  const plainRaw = {};
  const plainRef = encodeFlat(null, null);
  plainRaw.raw = plainRef;
  for (const c of combosA) plainRaw[key(c)] = encodeFlat(null, c);
  for (const alls of [28, 50]) {
    const refNoisy = encodeFlat(alls, null);
    const refStats = deltaStatsOfBuffers(fs.readFileSync(refNoisy), fs.readFileSync(plainRef), 1280, 720, 4);
    out[`alls${alls}`] = { ref: { std: refStats.std, kurt: refStats.kurt, corr: refStats.corr } };
    log(`  alls=${alls} tham chiếu không-codec: std [${refStats.std}] kurt [${refStats.kurt}] corr [${refStats.corr}]`);
    const combos = alls === 28 ? combosA : combosA.filter((c) => (c.preset === "veryfast" && (c.crf === 0 || c.crf === 18)) || (c.preset === "medium" && c.crf === 18));
    for (const c of combos) {
      const noisy = encodeFlat(alls, c);
      const s = deltaStatsOfBuffers(fs.readFileSync(noisy), fs.readFileSync(plainRaw[key(c)]), 1280, 720, 4);
      const ratio = s.std.map((v, i) => +(refStats.std[i] / v).toFixed(2));
      out[`alls${alls}`][key(c)] = { std: s.std, kurt: s.kurt, corr: s.corr, ratioVsRef: ratio };
      log(`    ${key(c)}: std [${s.std}] kurt [${s.kurt}] corr [${s.corr}] | tỉ lệ ref/render [${ratio}]`);
    }
  }
  return out;
}

// ---- Phần B/C: render thật bằng render.js, đối chiếu snapshot R63 -------
function renderVariant(v, combo) {
  const spec = path.join(R63_RENDER, `spec-${v}.json`);
  const out = path.join(SCRATCH, `render-${v}-${key(combo)}.mp4`);
  if (!fs.existsSync(out)) {
    run(process.execPath, [RENDER_JS, "--spec", spec, "--out", out, "--media-dir", R63_MEDIA,
      "--crf", String(combo.crf), "--x264-preset", combo.preset, "-y"], `render ${v} ${key(combo)}`);
  }
  return out;
}
function extractFrame(mp4, vw, vh, rawPath, scaler = "bilinear", extraVf = "") {
  const vf = `select='eq(n,30)',scale=${vw}:${vh}:flags=${scaler}:in_color_matrix=bt709:out_color_matrix=bt709${extraVf},format=rgb24`;
  run("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-vf", vf,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", rawPath], `extract ${mp4} ${vw}x${vh} ${scaler}`);
  const buf = fs.readFileSync(rawPath);
  if (buf.length !== vw * vh * 3) throw new Error(`frame raw sai kích thước: ${buf.length} != ${vw * vh * 3}`);
  return buf;
}
function partBC() {
  log("== Phần B/C: render.js thật × 8 combo, đối chiếu snapshot headed R63 ==");
  const report = { windows: {}, combos: COMBOS.map(key) };
  const snaps = {};
  const rects = {};
  for (const w of Object.keys(WINDOWS)) {
    snaps[w] = JSON.parse(fs.readFileSync(path.join(R63, "headed", w, "r63-preview-snaps.json"), "utf8"));
    rects[w] = snaps[w].plain.rect;
  }
  // Render 1 lần/combo/variant (không phụ thuộc cửa sổ), extract theo cửa sổ.
  const renders = {};
  for (const combo of COMBOS) {
    for (const v of ["plain", "noise05", "noise10", "sharp05", "sharp10"]) {
      renders[`${v}@${key(combo)}`] = renderVariant(v, combo);
    }
  }
  log("  render xong 40 file (8 combo × 5 variant)");
  const frames = {}; // `${v}@${combo}|${w}|${scaler}` -> Buffer
  function getFrame(v, combo, w, scaler = "bilinear") {
    const k = `${v}@${key(combo)}|${w}|${scaler}`;
    if (!frames[k]) {
      const { w: vw, h: vh } = WINDOWS[w];
      frames[k] = extractFrame(renders[`${v}@${key(combo)}`], vw, vh,
        path.join(SCRATCH, `frame-${v}-${key(combo)}-${w}-${scaler}.raw`), scaler);
    }
    return frames[k];
  }
  for (const w of Object.keys(WINDOWS)) {
    report.windows[w] = { noise: {}, sharpen: {} };
    for (const combo of COMBOS) {
      // Noise (bilinear — đúng chuỗi compare R63).
      for (const v of ["noise05", "noise10"]) {
        const d = deltaCompare(snaps[w].plain, snaps[w][v],
          getFrame("plain", combo, w), getFrame(v, combo, w),
          WINDOWS[w].w, WINDOWS[w].h, rects[w]);
        const nv = noiseVerdict(d);
        report.windows[w].noise[`${v}@${key(combo)}`] = {
          previewStd: d.preview.std, renderStd: d.render.std,
          previewKurt: d.preview.kurt, renderKurt: d.render.kurt,
          previewCorr: d.preview.corr, renderCorr: d.render.corr,
          ...nv,
        };
        log(`  ${w} ${v} ${key(combo)}: std P [${d.preview.std}] R [${d.render.std}] tỉ lệ [${nv.ratios}] kurtΔ [${nv.kurtDiff}] corrΔ [${nv.corrDiff}] → ${nv.verdict}`);
      }
      // Sharpen (bilinear).
      for (const v of ["sharp05", "sharp10"]) {
        const d = deltaCompare(snaps[w].plain, snaps[w][v],
          getFrame("plain", combo, w), getFrame(v, combo, w),
          WINDOWS[w].w, WINDOWS[w].h, rects[w]);
        const verdict = d.deltaMad <= 2 && d.deltaLe8 >= 0.99 ? "KHỚP" : (d.deltaMad <= 20 && d.deltaLe32 >= 0.9 ? "XẤP XỈ" : "LỆCH");
        report.windows[w].sharpen[`${v}@${key(combo)}|bilinear`] = {
          deltaMad: d.deltaMad, deltaLe8: d.deltaLe8, deltaLe32: d.deltaLe32,
          previewStd: d.preview.std, renderStd: d.render.std, verdict,
        };
        log(`  ${w} ${v} ${key(combo)} bilinear: delta MAD=${d.deltaMad} le8=${(d.deltaLe8 * 100).toFixed(1)}% le32=${(d.deltaLe32 * 100).toFixed(1)}% std P [${d.preview.std}] R [${d.render.std}] → ${verdict}`);
      }
    }
    // Sharpen: quét scaler ở 4 combo.
    for (const combo of SCALER_COMBOS) {
      for (const scaler of SCALERS) {
        if (scaler === "bilinear") continue; // đã đo ở trên
        for (const v of ["sharp05", "sharp10"]) {
          const d = deltaCompare(snaps[w].plain, snaps[w][v],
            getFrame("plain", combo, w, scaler), getFrame(v, combo, w, scaler),
            WINDOWS[w].w, WINDOWS[w].h, rects[w]);
          const verdict = d.deltaMad <= 2 && d.deltaLe8 >= 0.99 ? "KHỚP" : (d.deltaMad <= 20 && d.deltaLe32 >= 0.9 ? "XẤP XỈ" : "LỆCH");
          report.windows[w].sharpen[`${v}@${key(combo)}|${scaler}`] = {
            deltaMad: d.deltaMad, deltaLe8: d.deltaLe8, deltaLe32: d.deltaLe32,
            previewStd: d.preview.std, renderStd: d.render.std, verdict,
          };
          log(`  ${w} ${v} ${key(combo)} ${scaler}: delta MAD=${d.deltaMad} le8=${(d.deltaLe8 * 100).toFixed(1)}% → ${verdict}`);
        }
      }
    }
    // Chẩn đoán thứ tự: downscale plain về viewport rồi unsharp ở đó.
    for (const v of ["sharp05", "sharp10"]) {
      const amount = v === "sharp05" ? 1.1 : 2.0; // unsharp amount render: 0.2 + t*1.8
      const { w: vw, h: vh } = WINDOWS[w];
      const plainMp4 = renders[`plain@veryfast-crf0`];
      const rawPlain = path.join(SCRATCH, `diag-plain-${w}.raw`);
      extractFrame(plainMp4, vw, vh, rawPlain, "bilinear");
      const rawSharp = path.join(SCRATCH, `diag-sharp-${v}-${w}.raw`);
      run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${vw}x${vh}`, "-i", rawPlain,
        "-vf", `format=yuv420p,unsharp=5:5:${amount}:5:5:0,scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", rawSharp], `diag unsharp-after-downscale ${v} ${w}`);
      const bufPlain = fs.readFileSync(rawPlain);
      const bufSharp = fs.readFileSync(rawSharp);
      const d = deltaCompare(snaps[w].plain, snaps[w][v], bufPlain, bufSharp, vw, vh, rects[w]);
      const verdict = d.deltaMad <= 2 && d.deltaLe8 >= 0.99 ? "KHỚP" : (d.deltaMad <= 20 && d.deltaLe32 >= 0.9 ? "XẤP XỈ" : "LỆCH");
      report.windows[w].sharpen[`${v}@diag-downscale-then-unsharp`] = {
        deltaMad: d.deltaMad, deltaLe8: d.deltaLe8, deltaLe32: d.deltaLe32,
        previewStd: d.preview.std, renderStd: d.render.std, verdict,
      };
      log(`  ${w} ${v} DIAG downscale-rồi-unsharp (crf0 plain): delta MAD=${d.deltaMad} le8=${(d.deltaLe8 * 100).toFixed(1)}% std P [${d.preview.std}] R [${d.render.std}] → ${verdict}`);
    }
  }
  // Kiểm chứng CRF 0 == không-codec (full-res, frame 30 thật của testsrc2).
  log("== Kiểm chứng: CRF 0 có bằng chuỗi không-codec ở full-res? ==");
  const refCheck = {};
  {
    const srcRaw = path.join(SCRATCH, "refcheck-src30.raw");
    run("ffmpeg", ["-v", "error", "-y", "-i", MEDIA_FILE,
      "-vf", "select='eq(n,30)',scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", srcRaw], "refcheck decode src frame30");
    const src = fs.readFileSync(srcRaw);
    for (const alls of [28, 50]) {
      const yuv = path.join(SCRATCH, `refcheck-yuv-${alls}.raw`);
      const yuvN = path.join(SCRATCH, `refcheck-yuvN-${alls}.raw`);
      const out = path.join(SCRATCH, `refcheck-out-${alls}.raw`);
      run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1280x720", "-i", srcRaw,
        "-vf", "scale=out_color_matrix=bt709,format=yuv420p", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuv], "refcheck rgb->yuv");
      run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-i", yuv,
        "-vf", `noise=alls=${alls}:allf=t`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvN], "refcheck noise");
      run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-i", yuvN,
        "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], "refcheck yuv->rgb");
      const noisy = fs.readFileSync(out);
      const refStats = deltaStatsOfBuffers(noisy, src, 1280, 720, 4);
      // Render CRF 0 full-res: lấy frame 30 của render-noise (không downscale).
      const v = alls === 28 ? "noise05" : "noise10";
      const mp4 = renders[`${v}@veryfast-crf0`];
      const mp4Plain = renders["plain@veryfast-crf0"];
      const fN = path.join(SCRATCH, `refcheck-render-${v}-crf0.raw`);
      const fP = path.join(SCRATCH, "refcheck-render-plain-crf0.raw");
      for (const [m, f] of [[mp4, fN], [mp4Plain, fP]]) {
        if (!fs.existsSync(f)) {
          run("ffmpeg", ["-v", "error", "-y", "-i", m,
            "-vf", "select='eq(n,30)',scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
            "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", f], `refcheck extract ${m}`);
        }
      }
      const crf0Stats = deltaStatsOfBuffers(fs.readFileSync(fN), fs.readFileSync(fP), 1280, 720, 4);
      refCheck[`alls${alls}`] = {
        noCodec: { std: refStats.std, kurt: refStats.kurt, corr: refStats.corr },
        crf0: { std: crf0Stats.std, kurt: crf0Stats.kurt, corr: crf0Stats.corr },
      };
      log(`  alls=${alls} full-res frame30: không-codec std [${refStats.std}] kurt [${refStats.kurt}] | CRF0 std [${crf0Stats.std}] kurt [${crf0Stats.kurt}] corr [${crf0Stats.corr}]`);
    }
  }
  report.refCheck = refCheck;
  return report;
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  if (!fs.existsSync(MEDIA_FILE)) throw new Error(`không thấy video test ${MEDIA_FILE}`);
  if (!fs.existsSync(RENDER_JS)) throw new Error(`không thấy ${RENDER_JS}`);
  const report = { generatedAt: new Date().toISOString(), scratch: SCRATCH };
  let failCount = 0;
  try {
    if (!process.env.R64_SKIP_A) report.partA = partA();
  } catch (e) { console.error(`  ✗ Phần A: ${e.message}`); failCount++; }
  try {
    if (!process.env.R64_SKIP_BC) report.partBC = partBC();
  } catch (e) { console.error(`  ✗ Phần B/C: ${e.message}`); failCount++; }
  fs.writeFileSync(path.join(SCRATCH, "r64r9-report.json"), JSON.stringify(report, null, 2));
  log(`JSON kết quả: ${path.join(SCRATCH, "r64r9-report.json")}`);
  process.exitCode = failCount ? 1 : 0;
}

main().catch((e) => { console.error(`HARNESS LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
