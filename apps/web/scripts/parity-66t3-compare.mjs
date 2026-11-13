#!/usr/bin/env node
/**
 * parity-66t3-compare.mjs — Phase 9 đợt 66, luồng T3: đối chiếu snapshot
 * preview headed R65 S7 (3 cửa sổ w1440/w1920/w2560, playhead 1.0 =
 * frame 30) với frame render pre-encode, resample về viewport bằng
 * BỘ LỌC CHROME đã xác định (apps/web/scripts/chrome-resample.mjs)
 * thay vì ffmpeg bilinear/lanczos.
 *
 * 2 đường resample render để so:
 *   (a) chrome-rgb: frame full-res RGB24 (bt709) -> resampleRgb24.
 *   (b) chrome-yuv: frame full-res YUV420p -> resampleYuv420p (Y
 *       full-res, U/V nửa res, rồi convert RGB bt709 — đúng cách ffmpeg
 *       scale làm trên yuv420p).
 * Đối chứng: ffmpeg bilinear / lanczos (đo lại, như R65 S7) — kỳ vọng
 * chrome-* tốt hơn hẳn ở noise headed.
 * Tiêu chí noise như parity test Node đợt 63 R8: tỉ lệ std [0.85, 1.18],
 * |Δkurt| <= 0.35, |Δcorr| <= 0.12. KHỚP-THỐNG-KÊ khi cả 3 đạt.
 * Chạy (từ gốc repo): node apps/web/scripts/parity-66t3-compare.mjs
 * Exit 0 khi đo xong mọi variant; 1 có variant lỗi đo; 2 harness lỗi.
 * KHÔNG push/tag/binary.
 *
 * Đợt 70 X6 — hiệu chỉnh delta0 cho verdict nhiễu (xem
 * docs/PHASE9_ROUND70_X6_SHARPEN_NOISE_LIMITS.md §6): delta preview
 * chứa trường xác định delta0 = RGB(Y, estCb, estCr) − RGB_plain của
 * addYuvNoise (base chroma native ước lượng theo khối 2×2, k 1,04/1,12)
 * — trơn (lag ~0,9), std ΔY ≈ 3,1 ở viewport, Var ≈ 9,9 — làm lệch
 * corr R-G (0,20 → 0,01 sau khi trừ) và chỉ lộ sau downscale (nhiễu
 * trắng bị triệt ~3×, delta0 gần như không triệt). Phương pháp
 * "chrome-trilinear" (mới, mặc định đúng theo thang: trilinear mipmap
 * LOD-bias −0,5) TRỪ delta0 khỏi delta preview trước khi tính thống kê
 * nhiễu; "chrome-rgb" (1-kernel cũ) cũng được hiệu chỉnh để đối chiếu.
 * Các phương pháp cũ (chrome-yuv, ffmpeg-*) giữ nguyên không hiệu chỉnh
 * để so sánh hồi quy. Env R66T3_OUT đổi đường ghi JSON (mặc định ghi đè
 * báo cáo T3 cũ — chạy mặc định sẽ GHI ĐÈ, dùng R66T3_OUT khi chỉ muốn
 * xem kết quả mới).
 *
 * Đợt 77 E9 — luật áp delta0 G12 (đợt 76 D2, docs/
 * PHASE9_ROUND76_D2_DELTA0_LIMITS.md §3): delta0 chỉ được trừ khi cả ba
 * cùng đúng — plainMad ≤ 2,5 VÀ d0std_R ≤ 2,0 VÀ
 * ratio_R = d0std_R / residStd_R ≤ 1,0 (plainMad/residStd tính trên lưới
 * mẫu step-4 của snapshot, d0std tính trên toàn viewport; D2 tính
 * full-pixel — xem LƯU Ý LẤY MẪU dưới đây về sai số do lấy mẫu). Luật cũ (áp d0 vô điều kiện cho 2 phương pháp Chrome) đã kích
 * hoạt sai trên ocean post-fix (C1: Δkurt R 0,45 trong khi không-d0
 * KHỚP). G12 đúng 20/20 case D2 chấm; trên test-pattern (media 1280,
 * C1 fix không đổi) G12 vẫn áp d0 như cũ nên verdict X6 giữ nguyên.
 * Cổng ghi vào report.windows[w].delta0Gate để kiểm chứng.
 * LƯU Ý LẤY MẪU (E9, đo thật): cổng G12 tính trên lưới step-4 của
 * harness này KHÔNG trùng cổng full-pixel — w1920 ratio_R step-4 là
 * 1,33 (→ không áp d0) trong khi full-pixel là 0,95 (→ áp d0); verdict
 * nhiễu step-4 của harness này vì vậy chỉ là xấp xỉ, và Δkurt R step-4
 * mang sai số pha tới ±0,2 (w1440: step-4 0,46 vs full-pixel 0,26).
 * Verdict nhiễu có thẩm quyền là phân tích full-pixel E9
 * (r77e9-fullpixel-analyze.mjs + docs/PHASE9_ROUND77_E9_EFFECTS_PARITY_LIMITS.md).
 * Luật G12 trong harness này (inline) trùng từng ngưỡng với module
 * dùng chung của luồng E6 (apps/web/scripts/delta0-harness.mjs) —
 * giữ inline để harness không phụ thuộc file của luồng khác.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resampleRgb24, resampleRgb24Trilinear, resampleYuv420p } from "./chrome-resample.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const R65 = path.join(GOAL, "round65-s7");
const RENDER65 = path.join(R65, "render");
const SCRATCH = path.join(GOAL, "round66-t3", "render");
const WINDOWS = ["w1440", "w1920", "w2560"];

const VARIANTS = ["plain", "sharp05", "sharp10", "noise05", "noise10"];
const EFFECT = {
  plain: "",
  sharp05: ",unsharp=5:5:1.1:5:5:0",
  sharp10: ",unsharp=5:5:2:5:5:0",
  noise05: ",noise=alls=28:allf=t",
  noise10: ",noise=alls=50:allf=t",
};
const FRAME = 30;

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại (exit ${r.status}): ${(r.stderr || r.stdout || "").slice(0, 500)}`);
  return r;
}

function preencodeYuv(v) {
  const p = path.join(RENDER65, `preencode-${v}.yuv`);
  if (!fs.existsSync(p)) throw new Error(`thiếu pre-encode R65 ${p}`);
  return p;
}

// Frame 30 full-res RGB24 (bt709) từ pre-encode yuv.
function fullRgb(v) {
  const out = path.join(SCRATCH, `fullrgb-${v}.raw`);
  if (!fs.existsSync(out)) {
    run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-r", "30", "-i", preencodeYuv(v),
      "-vf", `select='eq(n,${FRAME})',scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], `full-rgb ${v}`);
  }
  const buf = fs.readFileSync(out);
  if (buf.length !== 1280 * 720 * 3) throw new Error(`full-rgb ${v} sai kích thước ${buf.length}`);
  return buf;
}

// Frame 30 full-res YUV420p từ pre-encode yuv.
function fullYuv(v) {
  const out = path.join(SCRATCH, `fullyuv-${v}.raw`);
  if (!fs.existsSync(out)) {
    run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-r", "30", "-i", preencodeYuv(v),
      "-vf", `select='eq(n,${FRAME})'`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", out], `full-yuv ${v}`);
  }
  const buf = fs.readFileSync(out);
  if (buf.length !== 1280 * 720 * 3 / 2) throw new Error(`full-yuv ${v} sai kích thước ${buf.length}`);
  return buf;
}

// Frame 30 resample bằng ffmpeg (đối chứng, như R65 S7).
function ffmpegFrame(v, vw, vh, scaler) {
  const out = path.join(SCRATCH, `ff-${scaler}-${v}-${vw}x${vh}.raw`);
  if (!fs.existsSync(out)) {
    run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", "1280x720", "-r", "30", "-i", preencodeYuv(v),
      "-vf", `select='eq(n,${FRAME})',scale=${vw}:${vh}:flags=${scaler}:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], `ffmpeg ${scaler} ${v}`);
  }
  const buf = fs.readFileSync(out);
  if (buf.length !== vw * vh * 3) throw new Error(`ffmpeg frame ${v} sai kích thước ${buf.length}`);
  return buf;
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

function compareSamples(preview, renderBuf, vw, vh, rect) {
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const pts = gridPoints(preview).filter((p) => p.x >= vx0 && p.x < vx0 + vw && p.y >= vy0 && p.y < vy0 + vh);
  let sum = 0, le8 = 0, le32 = 0;
  for (const p of pts) {
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(preview.data[pi + c] - renderBuf[ri + c]);
      sum += d;
      if (d > dmax) dmax = d;
    }
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  const n = pts.length;
  return { n, mad: +(sum / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}

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

function deltaStats(previewA, previewB, renderA, renderB, vw, vh, rect, delta0 = null) {
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
      // Đợt 70 X6: trừ delta0 (trường est-chroma của addYuvNoise) khỏi
      // delta preview khi được truyền vào — chỉ cho verdict nhiễu.
      const dp = previewB.data[pi + c] - previewA.data[pi + c] - (delta0 ? delta0[ri + c] : 0);
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

// ---------- delta0: dịch base chroma ước lượng của addYuvNoise (đợt 70 X6) ----------
// Sao chép verbatim từ apps/web/src/lib/effectCanvas.ts (rgbToYuv709,
// yuv709ToRgb, estimateNativeChroma; K_CB = 1.04, K_CR = 1.12 — hằng số
// NOISE, khác hằng số sharpen 1.04/1.09). delta0 = RGB(Y_derived,
// estCb, estCr) − RGB_plain, tính ở full-res rồi resample về viewport
// (trường trơn nên mô hình resample không ảnh hưởng đáng kể; dùng
// trilinear làm chuẩn). Chỉ dùng cho verdict nhiễu — sharpen không dùng
// base est-chroma này (nó dùng estimateNativeY + k sharpen riêng).
function rgbToYuv709_70x6(r, g, b) {
  const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const y = 16 + 219 * yl;
  const cb = 128 + (224 * 0.5 * (b / 255 - yl)) / (1 - 0.0722);
  const cr = 128 + (224 * 0.5 * (r / 255 - yl)) / (1 - 0.2126);
  return [y, cb, cr];
}
function yuv709ToRgb_70x6(y, cb, cr) {
  const yy = 1.164383 * (y - 16);
  return [yy + 1.79274 * (cr - 128), yy - 0.21325 * (cb - 128) - 0.53282 * (cr - 128), yy + 2.1122 * (cb - 128)];
}
function estimateNativeChroma_70x6(derived, k) {
  const e = 128 + k * (derived - 128);
  return e < 16 ? 16 : e > 240 ? 240 : e;
}
function estShiftFrame_70x6(rgb, srcW, srcH) {
  const out = Buffer.alloc(srcW * srcH * 3);
  const cw = (srcW + 1) >> 1, ch = (srcH + 1) >> 1;
  const Y = new Float64Array(srcW * srcH), CB = new Float64Array(srcW * srcH), CR = new Float64Array(srcW * srcH);
  for (let i = 0; i < srcW * srcH; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= srcW || y >= srcH) continue;
      const i = y * srcW + x;
      sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma_70x6(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma_70x6(sCr / n, 1.12);
  }
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < srcH; y++) for (let x = 0; x < srcW; x++) {
    const i = y * srcW + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const [r, g, b] = yuv709ToRgb_70x6(Y[i], estCb[ci], estCr[ci]);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}
// delta0 ở khổ viewport (Int16Array vw*vh*3): khung dịch resample trừ
// khung plain resample, cùng bộ lọc trilinear.
function delta0Viewport_70x6(plainRgb, srcW, srcH, dstW, dstH) {
  const shifted = estShiftFrame_70x6(plainRgb, srcW, srcH);
  const a = resampleRgb24Trilinear(plainRgb, srcW, srcH, dstW, dstH);
  const b = resampleRgb24Trilinear(shifted, srcW, srcH, dstW, dstH);
  const d0 = new Int16Array(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
}

function verdictMad(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}

// ---------- luật G12 (đợt 76 D2, nối vào harness đợt 77 E9) ----------
// Áp delta0 khi và chỉ khi cả ba cùng đúng:
//   plainMad ≤ 2,5 (plain đủ gần để mô hình đáng tin — ngưỡng Z2 giữ nguyên)
//   d0std_R ≤ 2,0 (thành phần R của mô hình đủ nhỏ để không nhiễu kurtosis R)
//   ratio_R = d0std_R / residStd_R ≤ 1,0 (mô hình R không lớn hơn phần dư R thực)
// plainMad/residStd tính trên lưới mẫu step-4 của snapshot (harness này
// không có full-pixel); d0std tính trên toàn viewport. Khe hở ngưỡng
// trên test-pattern rộng (d0std_R ~1,05–1,12 vs 2,0; ratio_R 0,65–0,95
// vs 1,0) nên quyết định cổng không nhạy với cách lấy mẫu — xem LIMITS E9.
function delta0GateG12(snapsPlain, renderPlainTri, d0, vw, vh, rect) {
  const plainMad = compareSamples(snapsPlain, renderPlainTri, vw, vh, rect).mad;
  const d0std = channelStats(d0).std;
  const vx0 = Math.round(rect.x), vy0 = Math.round(rect.y);
  const pts = gridPoints(snapsPlain).filter((p) => p.x >= vx0 && p.x < vx0 + vw && p.y >= vy0 && p.y < vy0 + vh);
  const resid = [];
  for (const p of pts) {
    const rx = p.x - vx0, ry = p.y - vy0;
    const ri = (ry * vw + rx) * 3;
    const pi = p.i * 3;
    for (let c = 0; c < 3; c++) resid.push(snapsPlain.data[pi + c] - renderPlainTri[ri + c]);
  }
  const residStd = channelStats(resid).std;
  const ratioR = residStd[0] > 0 ? +(d0std[0] / residStd[0]).toFixed(2) : 0;
  const apply = plainMad <= 2.5 && d0std[0] <= 2.0 && ratioR <= 1.0;
  return { rule: "G12", plainMad, d0std, residStd, ratioR, apply };
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const report = { frame: FRAME, windows: {}, methods: ["chrome-rgb", "chrome-trilinear", "chrome-yuv", "ffmpeg-bilinear", "ffmpeg-lanczos"] };
  let failCount = 0;
  for (const w of WINDOWS) {
    const snapsPath = path.join(R65, "headed", `r65-preview-snaps-${w}.json`);
    if (!fs.existsSync(snapsPath)) { console.error(`BLOCKER: thiếu ${snapsPath}`); process.exitCode = 2; return; }
    const snaps = JSON.parse(fs.readFileSync(snapsPath, "utf8"));
    const plain = snaps.plain;
    if (!plain?.ok) { console.error(`BLOCKER: snapshot plain ${w} thiếu/không ok`); process.exitCode = 2; return; }
    const rect = plain.rect;
    const vw = Math.round(rect.w), vh = Math.round(rect.h);
    console.log(`\n=== ${w}: canvas ${plain.w}x${plain.h}, video ${vw}x${vh} @(${Math.round(rect.x)},${Math.round(rect.y)}) scale=${rect.scale.toFixed(6)}`);
    report.windows[w] = { canvas: { w: plain.w, h: plain.h }, videoRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: vw, h: vh, scale: rect.scale }, variants: {} };
    // Resample render 1 lần cho mọi method.
    const frames = {};
    for (const method of report.methods) frames[method] = {};
    // Đợt 70 X6: delta0 (trường est-chroma) của khung plain, tính 1 lần
    // cho cả cửa sổ; chỉ dùng cho verdict nhiễu của 2 phương pháp Chrome
    // (chrome-rgb, chrome-trilinear). Các phương pháp khác giữ nguyên.
    const d0 = delta0Viewport_70x6(fullRgb("plain"), 1280, 720, vw, vh);
    for (const v of VARIANTS) {
      try {
        const rgb = fullRgb(v);
        const yuv = fullYuv(v);
        frames["chrome-rgb"][v] = resampleRgb24(rgb, 1280, 720, vw, vh);
        frames["chrome-trilinear"][v] = resampleRgb24Trilinear(rgb, 1280, 720, vw, vh);
        frames["chrome-yuv"][v] = resampleYuv420p(yuv, 1280, 720, vw, vh);
        frames["ffmpeg-bilinear"][v] = ffmpegFrame(v, vw, vh, "bilinear");
        frames["ffmpeg-lanczos"][v] = ffmpegFrame(v, vw, vh, "lanczos");
      } catch (e) {
        console.error(`  ✗ chuẩn bị frame ${v}: ${e.message}`);
        failCount++;
      }
    }
    // Đợt 77 E9: cổng G12 (D2) quyết định có trừ delta0 không, tính 1 lần
    // cho cả cửa sổ (dùng frame plain trilinear làm chuẩn, sau khi frame
    // đã resample xong).
    const gate = delta0GateG12(snaps.plain, frames["chrome-trilinear"].plain, d0, vw, vh, rect);
    report.windows[w].delta0Gate = gate;
    console.log(`  cổng delta0 G12: plainMad=${gate.plainMad} d0std=${JSON.stringify(gate.d0std)} residStd=${JSON.stringify(gate.residStd)} ratioR=${gate.ratioR} → ${gate.apply ? "ÁP d0" : "KHÔNG áp d0"}`);
    for (const v of VARIANTS) {
      report.windows[w].variants[v] = {};
      for (const method of report.methods) {
        const fb = frames[method][v];
        const fp = frames[method].plain;
        if (!fb || !snaps[v]) { report.windows[w].variants[v][method] = { error: "thiếu frame/snapshot" }; failCount++; continue; }
        const m = compareSamples(snaps[v], fb, vw, vh, rect);
        const entry = { absolute: { ...m, verdict: verdictMad(m) } };
        if (v === "sharp05" || v === "sharp10") {
          const d = deltaStats(snaps.plain, snaps[v], fp, fb, vw, vh, rect);
          entry.delta = {
            mad: d.deltaMad, le8: d.deltaLe8, le32: d.deltaLe32,
            verdict: verdictMad({ mad: d.deltaMad, le8: d.deltaLe8, le32: d.deltaLe32 }),
            previewStd: d.preview.std, renderStd: d.render.std,
          };
          console.log(`  ${v} ${method}: tuyệt đối MAD=${m.mad} le8=${(m.le8 * 100).toFixed(1)}% → ${entry.absolute.verdict}; DELTA MAD=${d.deltaMad} le8=${(d.deltaLe8 * 100).toFixed(1)}% → ${entry.delta.verdict}`);
        } else if (v === "noise05" || v === "noise10") {
          // Đợt 70 X6: trừ delta0 khỏi delta preview cho 2 phương pháp
          // Chrome (chrome-rgb, chrome-trilinear); các phương pháp khác
          // giữ nguyên để đối chiếu hồi quy.
          // Đợt 77 E9: chỉ trừ khi cổng G12 mở (D2); trước E9 luôn trừ.
          const useD0 = (method === "chrome-rgb" || method === "chrome-trilinear") && gate.apply;
          const d = deltaStats(snaps.plain, snaps[v], fp, fb, vw, vh, rect, useD0 ? d0 : null);
          const ratios = d.render.std.map((s, i) => +(d.preview.std[i] / s).toFixed(2));
          const okStd = ratios.every((r) => r >= 0.85 && r <= 1.18);
          const dCorr = d.preview.corr.map((c, i) => Math.abs(c - d.render.corr[i]));
          const okCorr = dCorr.every((x) => x <= 0.12);
          const dKurt = d.preview.kurt.map((k, i) => Math.abs(k - d.render.kurt[i]));
          const okKurt = dKurt.every((x) => x <= 0.35);
          const nv = okStd && okCorr && okKurt ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ";
          entry.deltaStats = {
            previewStd: d.preview.std, renderStd: d.render.std, stdRatio: ratios,
            previewKurt: d.preview.kurt, renderKurt: d.render.kurt, kurtDiff: dKurt.map((x) => +x.toFixed(3)),
            previewCorr: d.preview.corr, renderCorr: d.render.corr, corrDiff: dCorr.map((x) => +x.toFixed(3)),
            deltaMad: d.deltaMad, verdict: nv,
            delta0Corrected: useD0,
            delta0Rule: "G12",
          };
          console.log(`  ${v} ${method}: tuyệt đối MAD=${m.mad} le8=${(m.le8 * 100).toFixed(1)}% → ${entry.absolute.verdict}; NOISE std [${ratios}] (std-ok: ${okStd}) Δkurt [${dKurt.map((x) => x.toFixed(2))}] (kurt-ok: ${okKurt}) Δcorr [${dCorr.map((x) => x.toFixed(3))}] (corr-ok: ${okCorr}) → ${nv}`);
        } else {
          console.log(`  ${v} ${method}: tuyệt đối MAD=${m.mad} le8=${(m.le8 * 100).toFixed(1)}% le32=${(m.le32 * 100).toFixed(1)}% → ${entry.absolute.verdict}`);
        }
        report.windows[w].variants[v][method] = entry;
      }
    }
  }
  const outPath = process.env.R66T3_OUT || path.join(GOAL, "round66-t3", "r66t3-compare-report.json");
  writeFileEpermRetry(outPath, JSON.stringify(report, null, 2));
  console.log(`\nJSON kết quả: ${outPath}`);
  process.exitCode = failCount ? 1 : 0;
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e instanceof Error ? e.stack || e.message : e}`);
  process.exitCode = 2;
});
