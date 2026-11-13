#!/usr/bin/env node
/**
 * r77e9-fullpixel-analyze.mjs — Phase 9 đợt 77, luồng E9: phân tích
 * snapshot headed FULL-PIXEL mới (r77e9-fullpixel-headed.mjs, code hiện
 * tại) đối chiếu frame render T3 (pre-encode R65, frame 30).
 *
 * Đo, trên cùng dữ liệu full-pixel:
 *  (a) sharpen: MAD tuyệt đối + MAD delta (preview_sharp − preview_plain
 *      vs render_sharp − render_plain), ngưỡng KHỚP MAD ≤ 2 & le8 ≥ 99%.
 *  (b) noise: thống kê delta full-pixel (std ratio [0,85, 1,18],
 *      |Δkurt| ≤ 0,35, |Δcorr| ≤ 0,12), 2 phương pháp resample render
 *      (chrome-trilinear, chrome-rgb/1-kernel) × 2 chế độ d0 (có/không).
 *  (c) cổng G12 full-pixel: plainMad, d0std, residStd, ratio_R → quyết
 *      định áp d0 (đối chiếu với cổng step-4 của harness T3 đã nối G12).
 *  (d) lấy mẫu step-4 từ CHÍNH dữ liệu full-pixel này (pha canvas-aligned
 *      như R65: rx ≡ 1 mod 4, ry ≡ 0 mod 4) để tách hiệu ứng lấy mẫu khỏi
 *      trôi capture — verdict step-4-trên-dữ-liệu-mới vs verdict
 *      full-pixel-trên-dữ-liệu-mới.
 *  (e) trôi kể từ R65: MAD step-4 giữa snapshot plain mới (lấy mẫu) và
 *      snapshot plain R65 — đo preview đã đổi bao nhiêu từ đợt 65 tới nay
 *      (X1 trilinear production, Z7 blend-at-end, C1 rò plain).
 *
 * Helpers delta0/channelStats/fullDeltaStats/absMad sao chép verbatim
 * từ r76d2-analyze.mjs (nguồn r75c1/r73a3); resample từ chrome-resample.mjs.
 * Chạy (từ gốc repo): node apps/web/scripts/r77e9-fullpixel-analyze.mjs
 * Env: R77E9_OUT (mặc định hidden_files/round77-e9/r77e9-analysis.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24, resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const E9 = path.join(GOAL, "round77-e9");
const R65 = path.join(GOAL, "round65-s7");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const OUT = process.env.R77E9_OUT || path.join(E9, "r77e9-analysis.json");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };

// ---------- sao chép verbatim r76d2-analyze.mjs (helpers đo) ----------
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
function delta0Viewport_70x6(plainRgb, srcW, srcH, dstW, dstH) {
  const shifted = estShiftFrame_70x6(plainRgb, srcW, srcH);
  const a = resampleRgb24Trilinear(plainRgb, srcW, srcH, dstW, dstH);
  const b = resampleRgb24Trilinear(shifted, srcW, srcH, dstW, dstH);
  const d0 = new Int16Array(dstW * dstH * 3);
  for (let i = 0; i < dstW * dstH * 3; i++) d0[i] = b[i] - a[i];
  return d0;
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
// ---------- helpers mới E9 ----------
// Lấy mẫu step-4 pha canvas-aligned như R65: điểm canvas x = 4k, y = 4k;
// trong tọa độ rect: rx = x − round(rect.x) ≡ 1 mod 4 (rect.x 191/271),
// ry = y − round(rect.y) ≡ 0 mod 4 (rect.y = 0). Trả về mảng RGB đã lấy mẫu.
function step4Sample(rgb, vw, vh, rect) {
  // Tính trực tiếp: canvas x = 4k >= round(rect.x); rx = 4k - round(rect.x).
  const x0 = Math.round(rect.x);
  const pts = [];
  for (let cx = Math.ceil(x0 / 4) * 4; cx < x0 + vw; cx += 4) {
    for (let cy = 0; cy < vh; cy += 4) {
      const rx = cx - x0;
      pts.push(ryIndex(rx, cy, vw));
    }
  }
  const out = new Uint8Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    const s = pts[i] * 3;
    out[i * 3] = rgb[s]; out[i * 3 + 1] = rgb[s + 1]; out[i * 3 + 2] = rgb[s + 2];
  }
  return { data: out, n: pts.length };
  function ryIndex(rx, ry, w) { return ry * w + rx; }
}
function b64ToRgb(b64) { return Buffer.from(b64, "base64"); }

function main() {
  const fullRgb = {};
  for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) {
    const p = path.join(R66T3, `fullrgb-${v}.raw`);
    const buf = fs.readFileSync(p);
    if (buf.length !== 1280 * 720 * 3) throw new Error(`${p} sai kích thước ${buf.length}`);
    fullRgb[v] = buf;
  }
  const report = { generated: new Date().toISOString(), verdict: VERDICT, windows: {} };
  for (const [win, dir] of [["w1440", "headed-w1440x900"], ["w1920", "headed-w1920x1080"], ["w2560", "headed-w2560x1440"]]) {
    const doc = JSON.parse(fs.readFileSync(path.join(E9, dir, `r77e9-snaps-w${win === "w1440" ? "1440x900" : win === "w1920" ? "1920x1080" : "2560x1440"}.json`), "utf8"));
    const snaps = doc.snaps["test-pattern"];
    const rect = snaps.plain.rect;
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const prev = {};
    for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) prev[v] = b64ToRgb(snaps[v].rgbB64);
    console.log(`\n=== ${win}: rect ${vw}x${vh} @(${rect.x},${rect.y}) scale=${rect.scale.toFixed(6)} ===`);
    const wrep = { rect: { x: rect.x, y: rect.y, w: vw, h: vh, scale: rect.scale }, rawHash: doc.rawFrames["test-pattern"].plain.hash, variants: {} };
    // Render resample 1 lần cho 2 phương pháp.
    const rend = {};
    for (const m of ["trilinear", "rgb"]) {
      rend[m] = {};
      for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) {
        rend[m][v] = m === "trilinear"
          ? resampleRgb24Trilinear(fullRgb[v], 1280, 720, vw, vh)
          : resampleRgb24(fullRgb[v], 1280, 720, vw, vh);
      }
    }
    // Cổng G12 full-pixel (dùng trilinear làm chuẩn, như D2).
    const d0 = delta0Viewport_70x6(fullRgb.plain, 1280, 720, vw, vh);
    const plainMadFp = absMad(prev.plain, rend.trilinear.plain).mad;
    const d0std = channelStats(Float64Array.from(d0)).std;
    const n = vw * vh;
    const resid = new Float64Array(n * 3);
    for (let i = 0; i < n * 3; i++) resid[i] = prev.plain[i] - rend.trilinear.plain[i];
    const residStd = channelStats(resid).std;
    const ratioR = residStd[0] > 0 ? +(d0std[0] / residStd[0]).toFixed(2) : 0;
    const gate = { rule: "G12-fullpixel", plainMad: plainMadFp, d0std, residStd, ratioR, apply: plainMadFp <= 2.5 && d0std[0] <= 2.0 && ratioR <= 1.0 };
    wrep.delta0Gate = gate;
    console.log(`  cổng G12 full-pixel: plainMad=${gate.plainMad} d0std=${JSON.stringify(gate.d0std)} residStd=${JSON.stringify(gate.residStd)} ratioR=${gate.ratioR} → ${gate.apply ? "ÁP d0" : "KHÔNG áp d0"}`);

    for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) {
      const vent = {};
      for (const m of ["trilinear", "rgb"]) {
        const abs = absMad(prev[v], rend[m][v]);
        const ment = { absolute: { ...abs, verdict: verdictMad(abs) } };
        if (v === "sharp05" || v === "sharp10") {
          // Verdict delta theo cùng ngưỡng MAD/le8 như tuyệt đối.
          const dp = new Float64Array(n * 3), dr = new Float64Array(n * 3);
          let sumAbs = 0, le8 = 0, le32 = 0;
          for (let i = 0; i < n * 3; i++) { dp[i] = prev[v][i] - prev.plain[i]; dr[i] = rend[m][v][i] - rend[m].plain[i]; }
          for (let p = 0; p < n; p++) {
            let dmax = 0;
            for (let c = 0; c < 3; c++) { const dd = Math.abs(dp[p * 3 + c] - dr[p * 3 + c]); sumAbs += dd; if (dd > dmax) dmax = dd; }
            if (dmax <= 8) le8++;
            if (dmax <= 32) le32++;
          }
          const dm = { mad: +(sumAbs / (n * 3)).toFixed(3), le8: +(le8 / n).toFixed(4), le32: +(le32 / n).toFixed(4) };
          ment.delta = { ...dm, verdict: verdictMad(dm) };
        } else if (v === "noise05" || v === "noise10") {
          const stNo = fullDeltaStats(prev.plain, prev[v], rend[m].plain, rend[m][v], vw, vh, null);
          const stD0 = fullDeltaStats(prev.plain, prev[v], rend[m].plain, rend[m][v], vw, vh, d0);
          ment.noiseNoD0 = stNo;
          ment.noiseWithD0 = stD0;
          ment.noiseG12 = gate.apply ? stD0 : stNo;
          ment.noiseG12.verdictSource = gate.apply ? "có-d0" : "không-d0";
        }
        vent[m] = ment;
        if (v === "plain") console.log(`  ${v} ${m}: MAD=${abs.mad} le8=${(abs.le8 * 100).toFixed(1)}% → ${ment.absolute.verdict}`);
        else if (v.startsWith("sharp")) console.log(`  ${v} ${m}: tuyệt đối MAD=${abs.mad} le8=${(abs.le8 * 100).toFixed(1)}% → ${ment.absolute.verdict}; DELTA MAD=${ment.delta.mad} le8=${(ment.delta.le8 * 100).toFixed(1)}% → ${ment.delta.verdict}`);
        else console.log(`  ${v} ${m}: không-d0 ${stNoSummary(ment.noiseNoD0)} | có-d0 ${stNoSummary(ment.noiseWithD0)} | G12(${gate.apply ? "d0" : "no-d0"})=${ment.noiseG12.verdict}`);
      }
      wrep.variants[v] = vent;
    }
    function stNoSummary(st) {
      return `${st.verdict} std[${st.stdRatio}] Δkurt[${st.kurtDiff}] Δcorr[${st.corrDiff}]`;
    }

    // (d) step-4 trên cùng dữ liệu mới — chỉ noise + plain gate (sharpen đã đủ ở full-pixel).
    const s4 = {};
    const prevS4 = {}, rendS4 = {};
    for (const v of ["plain", "noise05", "noise10"]) prevS4[v] = step4Sample(prev[v], vw, vh, rect).data;
    for (const m of ["trilinear", "rgb"]) {
      rendS4[m] = {};
      for (const v of ["plain", "noise05", "noise10"]) rendS4[m][v] = step4Sample(rend[m][v], vw, vh, rect).data;
    }
    const nS4 = prevS4.plain.length / 3;
    // d0 là Int16 — lấy mẫu theo chỉ số pixel, không qua Buffer RGB.
    const d0s4b = new Int16Array(nS4 * 3);
    {
      const x0 = Math.round(rect.x);
      let k = 0;
      for (let cx = Math.ceil(x0 / 4) * 4; cx < x0 + vw; cx += 4) {
        for (let cy = 0; cy < vh; cy += 4) {
          const rx = cx - x0, src = (cy * vw + rx) * 3;
          for (let c = 0; c < 3; c++) d0s4b[k * 3 + c] = d0[src + c];
          k++;
        }
      }
    }
    s4.n = nS4;
    s4.methods = {};
    for (const m of ["trilinear", "rgb"]) {
      const plainMadS4 = absMad(prevS4.plain, rendS4[m].plain).mad;
      const mm = {};
      for (const lv of ["noise05", "noise10"]) {
        mm[lv] = sampledDeltaStats(prevS4.plain, prevS4[lv], rendS4[m].plain, rendS4[m][lv], d0s4b);
      }
      s4.methods[m] = { plainMad: plainMadS4, noise: mm };
      for (const lv of ["noise05", "noise10"]) {
        console.log(`  step-4 ${lv} ${m}: không-d0 ${stNoSummary(mm[lv].noD0)} | có-d0 ${stNoSummary(mm[lv].withD0)}`);
      }
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
    wrep.step4 = s4;

    // (e) trôi kể từ R65: MAD step-4 giữa plain mới (lấy mẫu) và plain R65.
    // Chỉ có nghĩa khi scale khớp (cùng hình học rect); w2560: rect mới
    // 1449×815 scale 1,132 khác R65 1733×975 scale 1,354 (layout đổi từ
    // đợt 65) nên bỏ qua drift ở cửa sổ đó, ghi rõ n/a.
    const r65doc = JSON.parse(fs.readFileSync(path.join(R65, "headed", `r65-preview-snaps-${win}.json`), "utf8"));
    const r65plain = r65doc.plain;
    const r65rect = r65plain.rect;
    const scaleMatch = Math.abs(r65rect.scale - rect.scale) < 0.001;
    if (!scaleMatch) {
      wrep.driftVsR65Plain = { n: 0, mad: null, le8: null, note: `n/a — scale mới ${rect.scale.toFixed(4)} khác R65 ${r65rect.scale.toFixed(4)} (rect ${vw}x${vh} vs ${Math.round(r65rect.w)}x${Math.round(r65rect.h)}), không so được cùng pha` };
      console.log(`  trôi plain vs R65: n/a (scale khác: mới ${rect.scale.toFixed(4)} vs R65 ${r65rect.scale.toFixed(4)})`);
    } else {
    // R65: canvas w×h, step 4, data theo lưới canvas; lọc vào rect, so với
    // snapshot mới lấy mẫu cùng pha (rx ≡ 1 mod 4, ry ≡ 0 mod 4).
    let sum = 0, cnt = 0, le8 = 0;
    const cols = Math.ceil(r65plain.w / r65plain.step);
    for (let i = 0; i < r65plain.n; i++) {
      const x = (i % cols) * r65plain.step;
      const y = Math.floor(i / cols) * r65plain.step;
      const rx = x - Math.round(r65rect.x), ry = y - Math.round(r65rect.y);
      if (rx < 0 || rx >= vw || ry < 0 || ry >= vh) continue;
      if (rx % 4 !== 1 || ry % 4 !== 0) continue;
      const pi = (ry * vw + rx) * 3;
      let dmax = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(r65plain.data[i * 3 + c] - prev.plain[pi + c]);
        sum += d;
        if (d > dmax) dmax = d;
      }
      if (dmax <= 8) le8++;
      cnt++;
    }
    const drift = { n: cnt, mad: +(sum / (cnt * 3)).toFixed(3), le8: +(le8 / cnt).toFixed(4) };
    wrep.driftVsR65Plain = drift;
    console.log(`  trôi plain vs R65 (step-4, cùng pha): MAD=${drift.mad} le8=${(drift.le8 * 100).toFixed(1)}% (n=${cnt})`);
    }
    report.windows[win] = wrep;
  }
  fs.mkdirSync(E9, { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON phân tích: ${OUT}`);
}
main();
