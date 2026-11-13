#!/usr/bin/env node
/**
 * r83k6-lineart-new-direction.mjs — Phase 9 đợt 83, luồng K6: LINEART ALIASING,
 * tìm HƯỚNG MỚI có bằng chứng (nợ J7 đợt 82 §4.6).
 *
 * Bối cảnh J7: trên lineart bilevel, delta project-size ≈ 0 (sharpen bị kẹp
 * 0/255), nhưng delta preview Chrome lớn hơn 2,4–7,5× về năng lượng; đã loại:
 * kernel (≤0,22), pha (≤7%), sharpen-sau-upscale toàn lượng (overshoot
 * 2,5–3,9×), decode-mềm blur mạnh (tệ hơn 2,5–7×), supersample 2× (tệ hơn
 * 2,6–3,9×). Baseline tri delta MAD @1,264 sharp10: 1px 5,48 / 2px 4,11 /
 * 3px 3,12 / 4px 2,33.
 *
 * Bốn hướng MỚI (chưa từng thử — kiểm tra lại: E7a chỉ thử sharpen-sau với
 * toàn lượng; E8 chỉ thử blur MẠNH; chưa ai thử gain-fit, pre-softening NHỎ,
 * render vector ở độ phân giải đích, hay dither):
 *   D1  Gain-fitted sharpen-sau-upscale: d_post(g) = g·(applySharpen(P_plain)
 *       − P_plain), g ∈ {0,1…1,0} + quét intensity trực tiếp. E7a overshoot
 *       năng lượng 2,5–3,9× ⇒ g ≈ 0,25–0,4 có thể khớp NĂNG LƯỢNG; câu hỏi
 *       là HÌNH DẠNG (dip/FWHM/lobe) có khớp không.
 *   D2  Pre-softening NHỎ trước sharpen ở project-size: 3-tap [α/2,1−α,α/2],
 *       α ∈ {0,05…0,4} — proxy cho "base của browser mềm hơn base ffmpeg một
 *       chút, sharpen khuếch đại phần mềm đó". Khác E8 (blur mạnh, plain vỡ
 *       MAD 22–50): α nhỏ phải GIỮ plain gần như nguyên.
 *   D3  Render vector ở độ phân giải đích: lưới vẽ TRỰC TIẾP ở viewport-size
 *       (D3a crisp bilevel; D3b area-coverage — mỗi pixel viewport = tỉ lệ
 *       diện tích đường phủ), rồi sharpen ở viewport-size. Kiểm tra xem delta
 *       Chrome có nhất quán với "sharpen tác động lên cạnh đã mềm ở thang
 *       đích" không. Hàm ý sản phẩm: overlay vector (text/shape) vẽ ở
 *       preview-size thay vì project-size rồi upscale bitmap.
 *   D4  Dither có kiểm soát trước sharpen: Bayer 4×4, biên độ A ∈ {1,2,4} —
 *       phá đúng rail 0/255 để sharpen không bị kẹp hoàn toàn (proxy cho
 *       nhiễu lượng tử hoá getImageData/color-management của Chrome).
 *   D5  (phụ) Sharpen ở thang trung gian s_mid = √scale giữa project và
 *       viewport — probe "sharpen thực sự xảy ra ở thang nào".
 *
 * Tiêu chí thắng (đăng ký trước): trên sharp10, trung bình 4 dataset
 * 640@1,264: MAD tốt nhất < 60% MAD baseline tri, thắng trên ≥3/4 dataset,
 * và KHÔNG phá control (sqw4/textsmall640 tệ hơn baseline ≤20%, plain MAD
 * tệ hơn ≤0,5). Nhiễu đo MAD ~±0,05 (J7 tái lập I3 trong 0,01–0,06).
 *
 * Dùng lại snaps headed + frame render của G5/H3/J7 — KHÔNG capture mới.
 * Chạy (từ gốc repo): node apps/web/scripts/r83k6-lineart-new-direction.mjs
 * Env: R83K6_OUT (mặc định hidden_files/round83-k6/r83k6-new-direction.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r83k6-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const J7 = path.join(GOAL, "round82-j7");
const OUT = process.env.R83K6_OUT || path.join(GOAL, "round83-k6", "r83k6-new-direction.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// ---------- resample tri (sao từ J7) ----------
function resamplePlaneFloat(src, srcW, srcH, dstW, dstH, kernel = triangleKernel) {
  const scaleX = dstW / srcW, scaleY = dstH / srcH;
  const tmp = new Float64Array(dstW * srcH);
  const wCacheX = new Array(dstW);
  for (let i = 0; i < dstW; i++) wCacheX[i] = chromeWeights1D(i, scaleX, srcW, kernel);
  for (let y = 0; y < srcH; y++) {
    const sRow = y * srcW, tRow = y * dstW;
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, w] of wCacheX[i]) acc += w * src[sRow + j];
      tmp[tRow + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  const wCacheY = new Array(dstH);
  for (let i = 0; i < dstH; i++) wCacheY[i] = chromeWeights1D(i, scaleY, srcH, kernel);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, w] of wCacheY[i]) acc += w * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}
function resampleRgbFloat(rgb, srcW, srcH, dstW, dstH) {
  // rgb: Buffer RGB24 hoặc Float64Array n*3 → trả Float64Array viewport n*3
  const out = new Float64Array(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const rs = resamplePlaneFloat(pl, srcW, srcH, dstW, dstH);
    for (let i = 0; i < dstW * dstH; i++) out[i * 3 + c] = rs[i];
  }
  return out;
}
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH) {
  const f = resampleRgbFloat(rgb, srcW, srcH, dstW, dstH);
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) {
    const v = Math.round(f[i]);
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}

// ---------- helpers ----------
function mad3(a, b) {
  const n = a.length / 3;
  let sum = 0;
  for (let p = 0; p < n; p++) for (let c = 0; c < 3; c++) sum += Math.abs(a[p * 3 + c] - b[p * 3 + c]);
  return +(sum / (n * 3)).toFixed(3);
}
function deltaMadFloat(dp, dr) {
  let sum = 0;
  for (let i = 0; i < dp.length; i++) sum += Math.abs(dp[i] - dr[i]);
  return +(sum / dp.length).toFixed(3);
}
function deltaOf(a, b) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}
function sumAbs(a) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i]); return s; }
function rgb24ToRgba(rgb, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = 255;
  }
  return out;
}
function rgbaToRgb24(rgba, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { out[i * 3] = rgba[i * 4]; out[i * 3 + 1] = rgba[i * 4 + 1]; out[i * 3 + 2] = rgba[i * 4 + 2]; }
  return out;
}
function sharpenRgb(rgb, w, h, intensity) {
  const img = { width: w, height: h, data: rgb24ToRgba(rgb, w, h) };
  applySharpen(img, intensity);
  return rgbaToRgb24(img.data, w, h);
}
function xProfile(arr, w, h, x0, x1) {
  const prof = [];
  for (let x = x0; x < x1; x++) {
    let s = 0;
    for (let y = 0; y < h; y++) s += arr[(y * w + x) * 3];
    prof.push(+(s / h).toFixed(1));
  }
  return prof;
}
// Làm mềm 3-tap tách được trên Float64Array RGB (clamp-to-edge), trả Buffer RGB24 làm tròn.
function softenRgb(rgb, w, h, alpha) {
  const k0 = alpha / 2, k1 = 1 - alpha;
  const tmp = new Float64Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    const xm = x > 0 ? x - 1 : 0, xp = x < w - 1 ? x + 1 : w - 1;
    tmp[(y * w + x) * 3 + c] = k0 * rgb[(y * w + xm) * 3 + c] + k1 * rgb[(y * w + x) * 3 + c] + k0 * rgb[(y * w + xp) * 3 + c];
  }
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    const ym = y > 0 ? y - 1 : 0, yp = y < h - 1 ? y + 1 : h - 1;
    const v = k0 * tmp[(ym * w + x) * 3 + c] + k1 * tmp[(y * w + x) * 3 + c] + k0 * tmp[(yp * w + x) * 3 + c];
    const r = Math.round(v);
    out[(y * w + x) * 3 + c] = r < 0 ? 0 : r > 255 ? 255 : r;
  }
  return out;
}
// Dither Bayer 4x4, biên độ A (giá trị cộng vào ∈ [−A/2, +A/2]).
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function ditherRgb(rgb, w, h, amp) {
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((BAYER4[y & 3][x & 3] + 0.5) / 16 - 0.5) * amp;
    for (let c = 0; c < 3; c++) {
      const v = Math.round(rgb[(y * w + x) * 3 + c] + d);
      out[(y * w + x) * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
// Lưới tổng hợp ở viewport-size: D3a crisp (tâm pixel trong band), D3b
// area-coverage (tỉ lệ diện tích pixel bị đường phủ).
function synthGridViewport(vw, vh, stepP, thickP, scale, mode) {
  const out = Buffer.alloc(vw * vh * 3);
  const step = stepP * scale, thick = thickP * scale;
  // độ phủ 1D của pixel [p, p+1) bởi các band [k*step, k*step+thick)
  function cover1D(p) {
    const k0 = Math.floor((p - thick) / step);
    let cov = 0;
    for (let k = k0; k <= k0 + 2; k++) {
      const lo = Math.max(p, k * step), hi = Math.min(p + 1, k * step + thick);
      if (hi > lo) cov += hi - lo;
    }
    return cov > 1 ? 1 : cov;
  }
  function inBand(p) { // tâm pixel
    const m = ((p + 0.5) % step + step) % step;
    return m < thick ? 1 : 0;
  }
  for (let y = 0; y < vh; y++) {
    const cy = mode === "coverage" ? cover1D(y) : inBand(y);
    for (let x = 0; x < vw; x++) {
      const cx = mode === "coverage" ? cover1D(x) : inBand(x);
      const cov = mode === "coverage" ? cx + cy - cx * cy : (cx || cy ? 1 : 0);
      const v = Math.round(255 * (1 - cov));
      const i = (y * vw + x) * 3;
      out[i] = v; out[i + 1] = v; out[i + 2] = v;
    }
  }
  return out;
}

const DATASETS = [
  { key: "L1px-640@1.264", kind: "lineart", thick: 1, step: 8, snaps: path.join(G5, "headed-w1920x1080-p640x360", "r79g5-snaps-w1920x1080-p640x360.json"), content: "lineart640", render: path.join(G5, "render", "lineart640"), projW: 640, projH: 360 },
  { key: "L2px-640@1.264", kind: "lineart", thick: 2, step: 8, snaps: path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), content: "lineart2px-640", render: path.join(H3, "render", "lineart2px-640"), projW: 640, projH: 360 },
  { key: "L3px-640@1.264", kind: "lineart", thick: 3, step: 8, snaps: path.join(J7, "headed-w1920x1080-p640x360-ph1", "r82j7-snaps-w1920x1080-p640x360.json"), content: "lineart3px-640", render: path.join(J7, "render", "lineart3px-640"), projW: 640, projH: 360 },
  { key: "L4px-640@1.264", kind: "lineart", thick: 4, step: 8, snaps: path.join(J7, "headed-w1920x1080-p640x360-ph1", "r82j7-snaps-w1920x1080-p640x360.json"), content: "lineart4px-640", render: path.join(J7, "render", "lineart4px-640"), projW: 640, projH: 360 },
  { key: "L1px-1280@1.132", kind: "lineart", thick: 1, step: 16, snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "lineart", render: path.join(G5, "render", "lineart"), projW: 1280, projH: 720 },
  { key: "L2px-1280@1.132", kind: "lineart", thick: 2, step: 16, snaps: path.join(H3, "headed-w2560x1440-p1280x720-ph1", "r80h3-snaps-w2560x1440-p1280x720.json"), content: "lineart2px", render: path.join(H3, "render", "lineart2px"), projW: 1280, projH: 720 },
  { key: "sqw4-640@1.264-control", kind: "control-sqw", thick: null, step: null, snaps: path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), content: "sqw4-640", render: null, projW: 640, projH: 360 },
  { key: "sqw4-1280@1.132-control", kind: "control-sqw", thick: null, step: null, snaps: path.join(H3, "headed-w2560x1440-p1280x720-ph1", "r80h3-snaps-w2560x1440-p1280x720.json"), content: "sqw4", render: path.join(H3, "render", "sqw4"), projW: 1280, projH: 720 },
  { key: "textsmall640@1.264-control", kind: "control-natural", thick: null, step: null, snaps: path.join(G5, "headed-w1920x1080-p640x360", "r79g5-snaps-w1920x1080-p640x360.json"), content: "textsmall640", render: path.join(G5, "render", "textsmall640"), projW: 640, projH: 360 },
];

const report = { generated: new Date().toISOString(), criterion: "thang neu MAD sharp10 trung binh 4 dataset 640@1.264 < 60% baseline tri, thang tren >=3/4 dataset, control te hon <=20% (plain <=+0.5)", datasets: {} };

for (const ds of DATASETS) {
  const t0 = Date.now();
  const doc = JSON.parse(fs.readFileSync(ds.snaps, "utf8"));
  const projW = ds.projW, projH = ds.projH;
  const snaps = doc.snaps[ds.content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const scale = snaps.plain.rect.scale;
  console.log(`\n######## ${ds.key}: ${vw}x${vh} scale=${scale.toFixed(4)} (proj ${projW}x${projH}) ########`);
  const rep = { scale: +scale.toFixed(4), vw, vh, projW, projH };
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  const dpPrev = { sharp05: deltaOf(prev.sharp05, prev.plain), sharp10: deltaOf(prev.sharp10, prev.plain) };

  // ---- Baseline (chỉ khi có render): tri(d_render) vs dp_prev, plain MAD ----
  let fullRgb = null, dRender = null;
  if (ds.render) {
    fullRgb = {};
    for (const v of ["plain", "sharp05", "sharp10"]) {
      const p = path.join(ds.render, `fullrgb-${v}.raw`);
      const buf = fs.readFileSync(p);
      if (buf.length !== projW * projH * 3) throw new Error(`${p} sai kich thuoc (${buf.length})`);
      fullRgb[v] = buf;
    }
    dRender = { sharp05: deltaOf(fullRgb.sharp05, fullRgb.plain), sharp10: deltaOf(fullRgb.sharp10, fullRgb.plain) };
    const base = {};
    const rendPlainTri = resampleRgbKernel(fullRgb.plain, projW, projH, vw, vh);
    base.plainMadTri = mad3(prev.plain, rendPlainTri);
    for (const v of ["sharp05", "sharp10"]) {
      const up = resampleRgbFloat(dRender[v], projW, projH, vw, vh);
      base[v] = { deltaMadTri: deltaMadFloat(dpPrev[v], up), energyRatio_dp_over_tri: +(sumAbs(dpPrev[v]) / sumAbs(up)).toFixed(2) };
    }
    rep.baseline = base;
    console.log(`  [BASE] plain MAD tri=${base.plainMadTri} | delta MAD tri 05/10=${base.sharp05.deltaMadTri}/${base.sharp10.deltaMadTri} | E-ratio dp/tri 05/10=${base.sharp05.energyRatio_dp_over_tri}/${base.sharp10.energyRatio_dp_over_tri}`);
  }

  // ---- D1: gain-fitted sharpen-sau-upscale (tren CHINH P_plain) ----
  const d1 = {};
  for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
    const postSharp = sharpenRgb(prev.plain, vw, vh, intensity);
    const dPost = deltaOf(postSharp, prev.plain);
    const row = { fullMad: deltaMadFloat(dpPrev[v], dPost), energyRatio_post_over_dp: +(sumAbs(dPost) / sumAbs(dpPrev[v])).toFixed(2) };
    // gain sweep: g * dPost
    row.gainSweep = {};
    for (const g of [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.7]) {
      const scaled = new Float64Array(dPost.length);
      for (let i = 0; i < dPost.length; i++) scaled[i] = g * dPost[i];
      row.gainSweep[`g${g}`] = deltaMadFloat(dpPrev[v], scaled);
    }
    // intensity sweep truc tiep (amount = 0.2 + i*1.8)
    row.intensitySweep = {};
    for (const ii of [0, 0.05, 0.1, 0.2, 0.3]) {
      const s2 = sharpenRgb(prev.plain, vw, vh, ii);
      row.intensitySweep[`i${ii}`] = deltaMadFloat(dpPrev[v], deltaOf(s2, prev.plain));
    }
    const bestG = Object.entries(row.gainSweep).reduce((a, b) => (b[1] < a[1] ? b : a));
    const bestI = Object.entries(row.intensitySweep).reduce((a, b) => (b[1] < a[1] ? b : a));
    row.bestGain = { g: bestG[0], mad: bestG[1] };
    row.bestIntensity = { i: bestI[0], mad: bestI[1] };
    d1[v] = row;
    console.log(`  [D1 ${v}] full MAD=${row.fullMad} E-ratio=${row.energyRatio_post_over_dp} | best gain ${bestG[0]} MAD=${bestG[1]} | best intensity ${bestI[0]} MAD=${bestI[1]} | gains=${JSON.stringify(row.gainSweep)}`);
  }
  rep.D1_gainFitPostUpscale = d1;

  // ---- D3: render vector o viewport-size (chi lineart) ----
  if (ds.kind === "lineart") {
    const d3 = {};
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const row = {};
      for (const mode of ["crisp", "coverage"]) {
        const native = synthGridViewport(vw, vh, ds.step, ds.thick, scale, mode);
        const plainMad = mad3(prev.plain, native);
        const sharp = sharpenRgb(native, vw, vh, intensity);
        const dNat = deltaOf(sharp, native);
        const mad = deltaMadFloat(dpPrev[v], dNat);
        // profile dip qua duong doc (lineX project = step*4)
        const lineX = ds.step * 4;
        const vcX = lineX * scale;
        const vpX0 = Math.max(0, Math.round(vcX) - 12), vpX1 = Math.min(vw, Math.round(vcX) + 13);
        const profNat = xProfile(dNat, vw, vh, vpX0, vpX1);
        const profPrev = xProfile(dpPrev[v], vw, vh, vpX0, vpX1);
        row[mode] = { deltaMad: mad, plainMadVsPrev: plainMad, energyRatio_nat_over_dp: +(sumAbs(dNat) / sumAbs(dpPrev[v])).toFixed(2), dipNat: Math.min(...profNat), dipPrev: Math.min(...profPrev) };
      }
      d3[v] = row;
      console.log(`  [D3 ${v}] crisp: deltaMAD=${row.crisp.deltaMad} plainMAD=${row.crisp.plainMadVsPrev} E-ratio=${row.crisp.energyRatio_nat_over_dp} dip=${row.crisp.dipNat} (dp ${row.crisp.dipPrev}) | coverage: deltaMAD=${row.coverage.deltaMad} plainMAD=${row.coverage.plainMadVsPrev} E-ratio=${row.coverage.energyRatio_nat_over_dp} dip=${row.coverage.dipNat}`);
    }
    rep.D3_nativeViewportRender = d3;
  }

  // ---- D2/D4/D5: can render frames (lineart 640 + control textsmall640; 1280 chi neu can) ----
  if (ds.render && ds.projW === 640) {
    // D2: pre-softening nho
    const d2 = {};
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const row = {};
      for (const alpha of [0.05, 0.1, 0.2, 0.4]) {
        const soft = softenRgb(fullRgb.plain, projW, projH, alpha);
        const sharp = sharpenRgb(soft, projW, projH, intensity);
        const dSoft = deltaOf(sharp, soft);
        const up = resampleRgbFloat(dSoft, projW, projH, vw, vh);
        const plainUp = resampleRgbKernel(soft, projW, projH, vw, vh);
        row[`a${alpha}`] = { deltaMad: deltaMadFloat(dpPrev[v], up), plainMadSoft: mad3(prev.plain, plainUp), energyRatio: +(sumAbs(up) / sumAbs(dpPrev[v])).toFixed(2) };
      }
      d2[v] = row;
      console.log(`  [D2 ${v}] ` + Object.entries(row).map(([a, r]) => `${a}: deltaMAD=${r.deltaMad} plainMAD=${r.plainMadSoft} E=${r.energyRatio}`).join(" | "));
    }
    rep.D2_tinyPresoften = d2;
    // D4: dither Bayer
    const d4 = {};
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const row = {};
      for (const amp of [1, 2, 4]) {
        const dith = ditherRgb(fullRgb.plain, projW, projH, amp);
        const sharp = sharpenRgb(dith, projW, projH, intensity);
        const dD = deltaOf(sharp, dith);
        const up = resampleRgbFloat(dD, projW, projH, vw, vh);
        const plainUp = resampleRgbKernel(dith, projW, projH, vw, vh);
        row[`A${amp}`] = { deltaMad: deltaMadFloat(dpPrev[v], up), plainMadDither: mad3(prev.plain, plainUp), energyRatio: +(sumAbs(up) / sumAbs(dpPrev[v])).toFixed(2) };
      }
      d4[v] = row;
      console.log(`  [D4 ${v}] ` + Object.entries(row).map(([a, r]) => `${a}: deltaMAD=${r.deltaMad} plainMAD=${r.plainMadDither} E=${r.energyRatio}`).join(" | "));
    }
    rep.D4_bayerDither = d4;
    // D5: sharpen o thang trung gian sqrt(scale)
    const d5 = {};
    const sMid = Math.sqrt(scale);
    const mw = Math.round(projW * sMid), mh = Math.round(projH * sMid);
    for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
      const midPlain = resampleRgbKernel(fullRgb.plain, projW, projH, mw, mh);
      const midSharp = sharpenRgb(midPlain, mw, mh, intensity);
      const dMid = deltaOf(midSharp, midPlain);
      const up = resampleRgbFloat(dMid, mw, mh, vw, vh);
      d5[v] = { sMid: +sMid.toFixed(4), midSize: `${mw}x${mh}`, deltaMad: deltaMadFloat(dpPrev[v], up), energyRatio: +(sumAbs(up) / sumAbs(dpPrev[v])).toFixed(2) };
      console.log(`  [D5 ${v}] s_mid=${d5[v].sMid} (${mw}x${mh}) deltaMAD=${d5[v].deltaMad} E-ratio=${d5[v].energyRatio}`);
    }
    rep.D5_midScaleSharpen = d5;
  }

  report.datasets[ds.key] = rep;
  console.log(`  (xong ${ds.key} trong ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
