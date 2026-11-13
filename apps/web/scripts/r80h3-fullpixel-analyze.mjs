#!/usr/bin/env node
/**
 * r80h3-fullpixel-analyze.mjs — Phase 9 đợt 80, luồng H3: probe xung vuông + lineart 2px: kernel BC(0,25, 0,375) vs tam giác
 * trên 5 nội dung MỚI + thang 1,132 / 1,264 / 2,264 (nội dung 640 sinh
 * native), 2 playhead (1,0 s = frame 30, 2,0 s = frame 60 — đa-frame,
 * chống PASS giả do 1 mẫu), và kiểm tra lại cổng G12 step-4 ≠ full-pixel.
 * Sao chép từ r79g5-fullpixel-analyze.mjs, đổi thư mục round80-h3,
 * renderDirFor (nội dung 640 có tên riêng) + frame theo playhead của run
 * (frame 30: fullrgb-<v>.raw; frame 60: fullrgb-<v>-f60.raw).
 *
 * Quét mọi file r80h3-snaps-*.json trong hidden_files/round80-h3/headed-*
 * (mỗi run: 1 cửa sổ × 1 project size × N nội dung), đối chiếu frame
 * render fullrgb (round80-h3/render/<content>/, test-pattern ở
 * round66-t3/render/) đã resample về viewport bằng 2 phương pháp:
 *   (a) trilinear — mô hình chuẩn hiện tại (chrome-resample.mjs);
 *   (b) BC(0,25, 0,375) — kernel ứng viên E9 (chỉ khi scale > 1,
 *       vì ở upscale trilinear suy biến thành 1-kernel tam giác h=1);
 *   (c) lưới (B,C) quanh E9 ở cửa sổ upscale: (1/3,1/3), (1/3,0,4),
 *       (0,25,1/3) — kiểm tra vùng fit có giữ trên nội dung mới không.
 * Đo, trên full-pixel, cho mỗi nội dung × cửa sổ × phương pháp:
 *   - sharpen: MAD tuyệt đối + MAD delta (ngưỡng KHỚP MAD ≤ 2, le8 ≥ 99%).
 *   - noise: thống kê delta (std ratio [0,85, 1,18], |Δkurt| ≤ 0,35,
 *     |Δcorr| ≤ 0,12) × 3 chế độ d0 (không-d0 / có-d0 / G12).
 *   - cổng G12 full-pixel (plainMad, d0std, residStd, ratioR, apply),
 *     với d0 tính bằng đúng phương pháp resample đang xét.
 *   - cổng G12 step-4 (tái lập đúng công thức harness T3: plainMad/
 *     residStd trên lưới step-4 pha canvas-aligned, d0std toàn viewport)
 *     + biến thể lấy mẫu đầy đủ (cả 3 đầu vào đều step-4) — để tách
 *     hiệu ứng lấy mẫu khỏi hiệu ứng kernel.
 *   - verdict noise step-4 (như E9 analyzer §(d)) để đối chiếu.
 *
 * Helpers delta0/channelStats/absMad/step4 sao chép verbatim từ
 * r77e9-fullpixel-analyze.mjs (nguồn r76d2/r75c1/r73a3); kernel BC +
 * resamplePlaneKernel sao chép từ r77e9-upscale-kernel.mjs, tổng quát
 * hoá kích thước nguồn/đích tùy ý.
 * Chạy (từ gốc repo): node apps/web/scripts/r80h3-fullpixel-analyze.mjs
 * Env: R80H3_OUT (mặc định hidden_files/round80-h3/r80h3-analysis.json).
 * Quét mọi file r80h3-snaps-*.json trong hidden_files/round80-h3/headed-*.
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear, chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const F6 = path.join(GOAL, "round80-h3");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const OUT = process.env.R80H3_OUT || path.join(F6, "r80h3-analysis.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };
const GRID_BC = [[1 / 3, 1 / 3], [1 / 3, 0.4], [0.25, 1 / 3]];

// ---------- kernel BC-cubic + resample với kernel cắm được ----------
function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
function resamplePlaneKernel(src, srcW, srcH, dstW, dstH, scaleX, scaleY, kernel) {
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
function resampleRgbKernel(rgb, srcW, srcH, dstW, dstH, kernel) {
  const out = Buffer.alloc(dstW * dstH * 3);
  const sx = dstW / srcW, sy = dstH / srcH;
  for (let c = 0; c < 3; c++) {
    const pl = new Float64Array(srcW * srcH);
    for (let i = 0; i < srcW * srcH; i++) pl[i] = rgb[i * 3 + c];
    const r = resamplePlaneKernel(pl, srcW, srcH, dstW, dstH, sx, sy, kernel);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(r[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
const bcKernel = (B, C) => (x) => bcCubic(x, B, C);

// ---------- sao chép verbatim r77e9-fullpixel-analyze.mjs ----------
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
function delta0Viewport(plainRgb, srcW, srcH, dstW, dstH, resampleFn) {
  const shifted = estShiftFrame_70x6(plainRgb, srcW, srcH);
  const a = resampleFn(plainRgb, srcW, srcH, dstW, dstH);
  const b = resampleFn(shifted, srcW, srcH, dstW, dstH);
  const d0 = new Int16Array(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
}
function channelStats(d) {
  const n = d.length / 3;
  const out = { std: [], kurt: [], corr: [] };
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < d.length; i += 3) s += d[i]; mean[c] = s / n; }
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) { const v = d[i] - mean[c]; s2 += v * v; s4 += v * v * v * v; }
    const std = Math.sqrt(s2 / n);
    out.std.push(+std.toFixed(2));
    out.kurt.push(std > 0 ? +(s4 / n / (std ** 4) - 3).toFixed(2) : 0);
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    out.corr.push(out.std[a] > 0 && out.std[b] > 0 ? +(s / n / (out.std[a] * out.std[b])).toFixed(3) : 0);
  }
  return out;
}
function fullDeltaStats(previewPlain, previewNoise, renderPlain, renderNoise, vw, vh, delta0) {
  const n = vw * vh;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  let sumAbs = 0;
  for (let i = 0; i < n * 3; i++) {
    const dp = previewNoise[i] - previewPlain[i] - (delta0 ? delta0[i] : 0);
    const dr = renderNoise[i] - renderPlain[i];
    dP[i] = dp; dR[i] = dr;
    sumAbs += Math.abs(dp - dr);
  }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const okStd = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi);
  const okKurt = dKurt.every((x) => x <= VERDICT.kurt);
  const okCorr = dCorr.every((x) => x <= VERDICT.corr);
  return {
    n, deltaMad: +(sumAbs / (n * 3)).toFixed(3),
    previewStd: preview.std, renderStd: render.std, stdRatio: ratios,
    previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt,
    previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr,
    verdict: okStd && okKurt && okCorr ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ",
    okStd, okKurt, okCorr,
  };
}
function absMad(a, b) {
  const n = a.length / 3;
  let sum = 0, le8 = 0, le32 = 0, max = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]);
      sum += d;
      if (d > dmax) dmax = d;
    }
    if (dmax > max) max = dmax;
    if (dmax <= 8) le8++;
    if (dmax <= 32) le32++;
  }
  return { n, mad: +(sum / (n * 3)).toFixed(3), max: +max.toFixed(1), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
}
function verdictMad(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
function step4Sample(rgb, vw, vh, rect) {
  const x0 = Math.round(rect.x);
  const pts = [];
  for (let cx = Math.ceil(x0 / 4) * 4; cx < x0 + vw; cx += 4) {
    for (let cy = 0; cy < vh; cy += 4) {
      const rx = cx - x0;
      pts.push(cy * vw + rx);
    }
  }
  const out = new Uint8Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    const s = pts[i] * 3;
    out[i * 3] = rgb[s]; out[i * 3 + 1] = rgb[s + 1]; out[i * 3 + 2] = rgb[s + 2];
  }
  return { data: out, n: pts.length };
}
function sampleD0(d0, vw, vh, rect) {
  const x0 = Math.round(rect.x);
  let k = 0;
  const nS4 = Math.ceil(vw / 4) * Math.ceil(vh / 4);
  const out = new Int16Array(nS4 * 3);
  for (let cx = Math.ceil(x0 / 4) * 4; cx < x0 + vw; cx += 4) {
    for (let cy = 0; cy < vh; cy += 4) {
      const rx = cx - x0, src = (cy * vw + rx) * 3;
      for (let c = 0; c < 3; c++) out[k * 3 + c] = d0[src + c];
      k++;
    }
  }
  return { data: out.slice(0, k * 3), n: k };
}
function sampledDeltaStats(pp, pn, rp, rn, d0arr) {
  const nn = pp.length / 3;
  const dP0 = new Float64Array(nn * 3), dR = new Float64Array(nn * 3);
  const dP1 = new Float64Array(nn * 3);
  for (let i = 0; i < nn * 3; i++) {
    dP0[i] = pn[i] - pp[i];
    dP1[i] = pn[i] - pp[i] - (d0arr ? d0arr[i] : 0);
    dR[i] = rn[i] - rp[i];
  }
  const mk = (dP) => {
    const preview = channelStats(dP), render = channelStats(dR);
    const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
    const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
    const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
    const ok = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi) && dKurt.every((x) => x <= VERDICT.kurt) && dCorr.every((x) => x <= VERDICT.corr);
    return { n: nn, previewStd: preview.std, renderStd: render.std, stdRatio: ratios, previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt, previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr, verdict: ok ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ" };
  };
  return { noD0: mk(dP0), withD0: mk(dP1) };
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }
function stSummary(st) {
  return `${st.verdict} std[${st.stdRatio}] Δkurt[${st.kurtDiff}] Δcorr[${st.corrDiff}]`;
}
function renderDirFor(content, projW) {
  // Nội dung 640 có tên riêng (textsmall640, ...) nên thư mục render
  // trùng tên content; không còn trường hợp đặc biệt ocean640 như F6.
  return path.join(F6, "render", content);
}

function main() {
  const headedDirs = fs.readdirSync(F6, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("headed-"))
    .map((d) => path.join(F6, d.name))
    .sort();
  const snapFiles = [];
  for (const dir of headedDirs) {
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith("r80h3-snaps-") && f.endsWith(".json")) snapFiles.push(path.join(dir, f));
    }
  }
  if (snapFiles.length === 0) throw new Error(`không thấy file snaps nào trong ${F6}/headed-*`);
  const report = { generated: new Date().toISOString(), verdict: VERDICT, runs: {} };

  for (const snapFile of snapFiles) {
    const doc = JSON.parse(fs.readFileSync(snapFile, "utf8"));
    const win = doc.window, projW = doc.projW, projH = doc.projH;
    const playhead = doc.playhead ?? 1.0;
    const frame = Math.round(playhead * 30);
    const frameSuffix = frame === 30 ? "" : `-f${frame}`;
    const runKey = `${win}-p${projW}x${projH}`;
    console.log(`\n######## RUN ${runKey} playhead=${playhead} frame=${frame} (${path.basename(snapFile)}) ########`);
    const runRep = { snapFile, window: win, projW, projH, playhead, frame, contents: {} };
    for (const content of Object.keys(doc.snaps)) {
      const snaps = doc.snaps[content];
      const rect = snaps.plain.rect;
      const vw = snaps.plain.w, vh = snaps.plain.h;
      const scale = rect.scale;
      const rdir = renderDirFor(content, projW);
      const fullRgb = {};
      for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) {
        const p = path.join(rdir, `fullrgb-${v}${frameSuffix}.raw`);
        const buf = fs.readFileSync(p);
        if (buf.length !== projW * projH * 3) throw new Error(`${p} sai kích thước ${buf.length} (muốn ${projW * projH * 3})`);
        fullRgb[v] = buf;
      }
      const prev = {};
      for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) prev[v] = b64ToRgb(snaps[v].rgbB64);
      console.log(`\n=== ${content}: rect ${vw}x${vh} @(${rect.x},${rect.y}) scale=${scale.toFixed(6)} (proj ${projW}x${projH}) ===`);
      const crep = { rect: { x: rect.x, y: rect.y, w: vw, h: vh, scale }, rawHash: doc.rawFrames[content].plain.hash, methods: {} };
      const isUpscale = scale > 1;
      // Phương pháp: trilinear luôn; BC + lưới + tam giác-cũ chỉ khi upscale.
      // CHÚ Ý (đợt 79 G5): từ F6, resampleRgb24Trilinear ĐÃ NỐI BC ở nhánh
      // upscale nên hàng "trilinear" ở thang upscale CHÍNH LÀ production
      // (BC). Hàng "triangle-old" (resampleRgbKernel + triangleKernel,
      // đã kiểm chứng tái lập đúng từng số tri PRE-wiring của E9 trên
      // test-pattern w2560: plain MAD 0,969 le8 99,6%) là production cũ
      // trước F6 — dùng để so BC vs tam giác. Xem /tmp/r80h3-tri-check.mjs.
      const methods = [{ name: "trilinear", fn: (rgb, sw, sh, dw, dh) => resampleRgb24Trilinear(rgb, sw, sh, dw, dh) }];
      if (isUpscale) {
        methods.push({ name: "triangle-old", fn: (rgb, sw, sh, dw, dh) => resampleRgbKernel(rgb, sw, sh, dw, dh, triangleKernel) });
        methods.push({ name: "bc025-0375", fn: (rgb, sw, sh, dw, dh) => resampleRgbKernel(rgb, sw, sh, dw, dh, bcKernel(0.25, 0.375)) });
        for (const [B, C] of GRID_BC) {
          methods.push({ name: `bc${B.toFixed(3)}-${C.toFixed(3)}`, fn: (rgb, sw, sh, dw, dh) => resampleRgbKernel(rgb, sw, sh, dw, dh, bcKernel(B, C)) });
        }
      }
      for (const m of methods) {
        const rend = {};
        for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) {
          rend[v] = m.fn(fullRgb[v], projW, projH, vw, vh);
        }
        const d0 = delta0Viewport(fullRgb.plain, projW, projH, vw, vh, m.fn);
        const n = vw * vh;
        // Cổng G12 full-pixel.
        const plainMadFp = absMad(prev.plain, rend.plain).mad;
        const d0std = channelStats(Float64Array.from(d0)).std;
        const resid = new Float64Array(n * 3);
        for (let i = 0; i < n * 3; i++) resid[i] = prev.plain[i] - rend.plain[i];
        const residStd = channelStats(resid).std;
        const ratioR = residStd[0] > 0 ? +(d0std[0] / residStd[0]).toFixed(2) : 0;
        const gate = { rule: "G12-fullpixel", plainMad: plainMadFp, d0std, residStd, ratioR, apply: plainMadFp <= 2.5 && d0std[0] <= 2.0 && ratioR <= 1.0 };
        console.log(`  [${m.name}] cổng G12 full-pixel: plainMad=${gate.plainMad} d0std_R=${d0std[0]} residStd_R=${residStd[0]} ratioR=${gate.ratioR} → ${gate.apply ? "ÁP d0" : "KHÔNG áp d0"}`);
        const ment = { gate };
        for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) {
          const abs = absMad(prev[v], rend[v]);
          const vent = { absolute: { ...abs, verdict: verdictMad(abs) } };
          if (v === "sharp05" || v === "sharp10") {
            const dp = new Float64Array(n * 3), dr = new Float64Array(n * 3);
            let sumAbs = 0, le8 = 0, le32 = 0;
            for (let i = 0; i < n * 3; i++) { dp[i] = prev[v][i] - prev.plain[i]; dr[i] = rend[v][i] - rend.plain[i]; }
            for (let p = 0; p < n; p++) {
              let dmax = 0;
              for (let c = 0; c < 3; c++) { const dd = Math.abs(dp[p * 3 + c] - dr[p * 3 + c]); sumAbs += dd; if (dd > dmax) dmax = dd; }
              if (dmax <= 8) le8++;
              if (dmax <= 32) le32++;
            }
            const dm = { mad: +(sumAbs / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
            vent.delta = { ...dm, verdict: verdictMad(dm) };
            console.log(`  [${m.name}] ${v}: tuyệt đối MAD=${abs.mad} le8=${(abs.le8 * 100).toFixed(1)}% → ${vent.absolute.verdict}; DELTA MAD=${dm.mad} le8=${(dm.le8 * 100).toFixed(1)}% → ${vent.delta.verdict}`);
          } else if (v === "noise05" || v === "noise10") {
            const stNo = fullDeltaStats(prev.plain, prev[v], rend.plain, rend[v], vw, vh, null);
            const stD0 = fullDeltaStats(prev.plain, prev[v], rend.plain, rend[v], vw, vh, d0);
            vent.noiseNoD0 = stNo;
            vent.noiseWithD0 = stD0;
            vent.noiseG12 = gate.apply ? stD0 : stNo;
            vent.noiseG12.verdictSource = gate.apply ? "có-d0" : "không-d0";
            console.log(`  [${m.name}] ${v}: không-d0 ${stSummary(stNo)} | có-d0 ${stSummary(stD0)} | G12(${gate.apply ? "d0" : "no-d0"})=${vent.noiseG12.verdict}`);
          } else {
            console.log(`  [${m.name}] ${v}: MAD=${abs.mad} le8=${(abs.le8 * 100).toFixed(1)}% → ${vent.absolute.verdict}`);
          }
          ment[v] = vent;
        }
        // Cổng G12 step-4 (tái lập harness T3: plainMad/residStd step-4,
        // d0std toàn viewport) + biến thể lấy mẫu đầy đủ.
        const prevS4 = {}, rendS4 = {};
        for (const v of ["plain", "noise05", "noise10"]) prevS4[v] = step4Sample(prev[v], vw, vh, rect).data;
        for (const v of ["plain", "noise05", "noise10"]) rendS4[v] = step4Sample(rend[v], vw, vh, rect).data;
        const nS4 = prevS4.plain.length / 3;
        const plainMadS4 = absMad(prevS4.plain, rendS4.plain).mad;
        const residS4 = new Float64Array(nS4 * 3);
        for (let i = 0; i < nS4 * 3; i++) residS4[i] = prevS4.plain[i] - rendS4.plain[i];
        const residStdS4 = channelStats(residS4).std;
        const ratioR_s4 = residStdS4[0] > 0 ? +(d0std[0] / residStdS4[0]).toFixed(2) : 0;
        const gateS4 = { rule: "G12-step4-harness", plainMad: plainMadS4, d0std, residStd: residStdS4, ratioR: ratioR_s4, apply: plainMadS4 <= 2.5 && d0std[0] <= 2.0 && ratioR_s4 <= 1.0 };
        const d0s4 = sampleD0(d0, vw, vh, rect);
        const d0stdS4 = channelStats(Float64Array.from(d0s4.data)).std;
        const ratioR_s4full = residStdS4[0] > 0 ? +(d0stdS4[0] / residStdS4[0]).toFixed(2) : 0;
        const gateS4full = { rule: "G12-step4-fullsampled", plainMad: plainMadS4, d0std: d0stdS4, residStd: residStdS4, ratioR: ratioR_s4full, apply: plainMadS4 <= 2.5 && d0stdS4[0] <= 2.0 && ratioR_s4full <= 1.0 };
        console.log(`  [${m.name}] cổng G12 step-4 (harness): plainMad=${plainMadS4} ratioR=${ratioR_s4} → ${gateS4.apply ? "ÁP d0" : "KHÔNG áp d0"} | step-4 đầy đủ: d0std_R=${d0stdS4[0]} ratioR=${ratioR_s4full} → ${gateS4full.apply ? "ÁP d0" : "KHÔNG áp d0"}`);
        const s4noise = {};
        for (const lv of ["noise05", "noise10"]) {
          s4noise[lv] = sampledDeltaStats(prevS4.plain, prevS4[lv], rendS4.plain, rendS4[lv], d0s4.data);
          console.log(`  [${m.name}] step-4 ${lv}: không-d0 ${stSummary(s4noise[lv].noD0)} | có-d0 ${stSummary(s4noise[lv].withD0)}`);
        }
        ment.gateStep4 = gateS4;
        ment.gateStep4FullSampled = gateS4full;
        ment.step4Noise = s4noise;
        crep.methods[m.name] = ment;
      }
      runRep.contents[content] = crep;
    }
    report.runs[runKey] = runRep;
  }
  fs.mkdirSync(F6, { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON phân tích: ${OUT}`);
}
main();
