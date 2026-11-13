#!/usr/bin/env node
/**
 * r80h3-probes-offline.mjs — Phase 9 đợt 80, luồng H3: probe offline (b)+(c)
 * trên dữ liệu G5 đã có (không cần headed mới).
 *
 * (b) Noise LỆCH ở project 640 (G std 0,81–0,91 — LIMITS G5 §4/§9.3):
 *   M1 ma trận: render lại frame noise 640 bằng bt709 (thay vì bt601)
 *       rồi tính lại std ratio G — nếu về ~1 thì ma trận là nguyên nhân
 *       (preview addYuvNoise dùng bt709 cố định, xem effectCanvas.ts).
 *   M2 miền YUV: convert delta (noise−plain) sang YUV601/YUV709, đo std
 *       ratio từng plane Y/U/V + tương quan chéo — tách luma vs chroma.
 *   M3 tự tương quan không gian: lag-1/lag-2 của delta từng kênh RGB,
 *       preview vs render — phát hiện nhiễu render bị làm mịn bởi
 *       upscale khác preview hay không.
 *   M4 capture thứ 2: dùng (plain2, noise05b) làm mẫu thứ 2 cho noise05
 *       — kiểm tra G std ratio có ổn định hay chỉ là 1 capture may rủi.
 * (c) Lineart 1px LỆCH mọi thang (LIMITS G5 §4/§9.4):
 *   C1 plain MAD từng kênh + sharp-delta từng kênh, BC vs tam giác,
 *       theo thang — BC tệ hơn ở thang nào?
 *   C2 profile lưới: scanline ngang qua hàng lưới, so profile preview
 *       vs BC vs tam giác (MAD profile + độ sâu vạch lưới).
 *   C3 capture thứ 2 cho noise lineart (plain2/noise05b).
 *
 * Đọc: hidden_files/round79-g5/{headed-*,render/*}. Ghi JSON + log vào
 * hidden_files/round80-h3/r80h3-probes-offline.json. KHÔNG push/tag/binary.
 * Chạy: node apps/web/scripts/r80h3-probes-offline.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear, chromeWeights1D, triangleKernel } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const OUT = path.join(H3, "r80h3-probes-offline.json");
const BT709DIR = path.join(H3, "bt709-640");
const VERDICT = { stdLo: 0.85, stdHi: 1.18, kurt: 0.35, corr: 0.12 };

// ---------- kernel BC + resample (sao từ r79g5-fullpixel-analyze.mjs) ----------
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
const TRI = (rgb, sw, sh, dw, dh) => resampleRgbKernel(rgb, sw, sh, dw, dh, triangleKernel);
const BC = (rgb, sw, sh, dw, dh) => resampleRgb24Trilinear(rgb, sw, sh, dw, dh); // production (BC ở upscale)

// ---------- thống kê ----------
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
function deltaStats(previewPlain, previewNoise, renderPlain, renderNoise) {
  const n = previewPlain.length / 3;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) { dP[i] = previewNoise[i] - previewPlain[i]; dR[i] = renderNoise[i] - renderPlain[i]; }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  const ok = ratios.every((r) => r >= VERDICT.stdLo && r <= VERDICT.stdHi) && dKurt.every((x) => x <= VERDICT.kurt) && dCorr.every((x) => x <= VERDICT.corr);
  return { previewStd: preview.std, renderStd: render.std, stdRatio: ratios, previewKurt: preview.kurt, renderKurt: render.kurt, kurtDiff: dKurt, previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr, verdict: ok ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ" };
}
function absMadPerChannel(a, b) {
  const n = a.length / 3;
  const sum = [0, 0, 0], le8 = [0, 0, 0];
  let sumAll = 0, le8All = 0;
  for (let p = 0; p < n; p++) {
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a[p * 3 + c] - b[p * 3 + c]);
      sum[c] += d; if (d <= 8) le8[c]++;
      if (d > dmax) dmax = d;
    }
    sumAll += dmax; if (dmax <= 8) le8All++;
  }
  return {
    madPerChannel: sum.map((s) => +(s / n).toFixed(3)),
    le8PerChannel: le8.map((x) => +(x / n).toFixed(4)),
    mad: +(sumAll / n).toFixed(3), le8: +(le8All / n).toFixed(4),
  };
}
// RGB -> YUV (limited range) theo ma trận cho trước.
function rgbToYuv(rgb, matrix) {
  const [kr, kg, kb] = matrix === "bt709" ? [0.2126, 0.7152, 0.0722] : [0.299, 0.587, 0.114];
  const out = new Float64Array(rgb.length);
  for (let i = 0; i < rgb.length; i += 3) {
    const r = rgb[i] / 255, g = rgb[i + 1] / 255, b = rgb[i + 2] / 255;
    const yl = kr * r + kg * g + kb * b;
    out[i] = 16 + 219 * yl;
    out[i + 1] = 128 + (224 * 0.5 * (b - yl)) / (1 - kb);
    out[i + 2] = 128 + (224 * 0.5 * (r - yl)) / (1 - kr);
  }
  return out;
}
function yuvDeltaStats(previewPlain, previewNoise, renderPlain, renderNoise, matrix) {
  const pP = rgbToYuv(previewPlain, matrix), pN = rgbToYuv(previewNoise, matrix);
  const rP = rgbToYuv(renderPlain, matrix), rN = rgbToYuv(renderNoise, matrix);
  const n = previewPlain.length / 3;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) { dP[i] = pN[i] - pP[i]; dR[i] = rN[i] - rP[i]; }
  const preview = channelStats(dP), render = channelStats(dR);
  const ratios = render.std.map((s, i) => +(preview.std[i] / s).toFixed(2));
  const dKurt = preview.kurt.map((k, i) => +(Math.abs(k - render.kurt[i]).toFixed(3)));
  const dCorr = preview.corr.map((c, i) => +(Math.abs(c - render.corr[i]).toFixed(3)));
  return { matrix, previewStd: preview.std, renderStd: render.std, stdRatio: ratios, kurtDiff: dKurt, previewCorr: preview.corr, renderCorr: render.corr, corrDiff: dCorr };
}
// Tự tương quan lag (dx,dy) của delta từng kênh (lấy mẫu step 2 cho nhanh).
function lagAutocorr(delta, vw, vh, dx, dy) {
  const out = [];
  for (let c = 0; c < 3; c++) {
    let s0 = 0, s1 = 0, n = 0, mean = 0;
    const vals = [];
    for (let y = 0; y < vh; y += 2) for (let x = 0; x < vw; x += 2) vals.push(delta[(y * vw + x) * 3 + c]);
    for (const v of vals) mean += v;
    mean /= vals.length;
    for (let y = 0; y < vh; y += 2) for (let x = 0; x < vw; x += 2) {
      const x2 = x + dx, y2 = y + dy;
      if (x2 >= vw || y2 >= vh) continue;
      const a = delta[(y * vw + x) * 3 + c] - mean;
      const b = delta[(y2 * vw + x2) * 3 + c] - mean;
      s0 += a * a; s1 += a * b; n++;
    }
    out.push(s0 > 0 ? +(s1 / s0).toFixed(3) : 0);
  }
  return out;
}
function deltaOf(a, b) {
  const d = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) d[i] = a[i] - b[i];
  return d;
}

// ---------- nạp dữ liệu ----------
function loadSnaps(runDir, file) {
  const doc = JSON.parse(fs.readFileSync(path.join(runDir, file), "utf8"));
  return doc;
}
function readFullRgb(content, variant) {
  const p = path.join(G5, "render", content, `fullrgb-${variant}.raw`);
  return fs.readFileSync(p);
}
function b64(b) { return Buffer.from(b, "base64"); }

function ffmpegBt709(content, variant) {
  fs.mkdirSync(BT709DIR, { recursive: true });
  const out = path.join(BT709DIR, `${content}-fullrgb-${variant}-bt709.raw`);
  if (fs.existsSync(out)) return out;
  const yuv = path.join(G5, "render", content, `preencode-${variant}.yuv`);
  const [W, H] = content.endsWith("640") ? [640, 360] : [1280, 720];
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${W}x${H}`, "-r", "30", "-i", yuv,
    "-vf", `select='eq(n,30)',scale=${W}:${H}:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg bt709 ${content}/${variant} thất bại: ${(r.stderr || "").slice(0, 400)}`);
  return out;
}

const RUNS = [
  { dir: "headed-w1920x1080-p640x360", file: "r79g5-snaps-w1920x1080-p640x360.json", scale: 1.264, proj: 640 },
  { dir: "headed-w2560x1440-p640x360", file: "r79g5-snaps-w2560x1440-p640x360.json", scale: 2.264, proj: 640 },
  { dir: "headed-w1920x1080-p1280x720", file: "r79g5-snaps-w1920x1080-p1280x720.json", scale: 0.632, proj: 1280 },
  { dir: "headed-w2560x1440-p1280x720", file: "r79g5-snaps-w2560x1440-p1280x720.json", scale: 1.132, proj: 1280 },
];

function main() {
  const report = { generated: new Date().toISOString(), probeB: {}, probeC: {} };

  // ================= (b) noise 640 =================
  console.log("\n######## PROBE (b): noise project 640 ########");
  const contents640 = ["gradient640", "photo640", "noise640", "textsmall640"];
  const contents1280 = ["gradient", "photo", "noise", "textsmall"];
  for (const run of RUNS) {
    const doc = loadSnaps(path.join(G5, run.dir), run.file);
    const contents = run.proj === 640 ? contents640 : contents1280;
    console.log(`\n== run ${run.dir} (scale ${run.scale}, proj ${run.proj}) ==`);
    const runRep = {};
    for (const content of contents) {
      const snaps = doc.snaps[content];
      if (!snaps) { console.log(`  ${content}: không có snaps — bỏ qua`); continue; }
      const vw = snaps.plain.w, vh = snaps.plain.h;
      const projW = run.proj, projH = run.proj === 640 ? 360 : 720;
      const prev = {};
      for (const v of ["plain", "plain2", "noise05", "noise05b", "noise10"]) prev[v] = b64(snaps[v].rgbB64);
      const rend = {};
      for (const v of ["plain", "noise05", "noise10"]) rend[v] = readFullRgb(content, v);
      const crep = { rect: { w: vw, h: vh }, methods: {} };
      for (const [mName, mFn] of [["trilinear(BC-prod)", BC], ["triangle-old", TRI]]) {
        if (run.scale <= 1 && mName.startsWith("trilinear")) {
          // downscale: production = triangle, chỉ 1 phương pháp
        }
        const rPlain = mFn(rend.plain, projW, projH, vw, vh);
        const rN05 = mFn(rend.noise05, projW, projH, vw, vh);
        const rN10 = mFn(rend.noise10, projW, projH, vw, vh);
        const ment = {};
        // M2: YUV-domain (bt601 cho 640, bt709 cho 1280) + chéo bt709 cho 640
        for (const lv of ["noise05", "noise10"]) {
          const rN = lv === "noise05" ? rN05 : rN10;
          const st = deltaStats(prev.plain, prev[lv], rPlain, rN);
          ment[lv] = { rgb: st };
          const yuvMat = run.proj === 640 ? "bt601" : "bt709";
          ment[lv].yuv = yuvDeltaStats(prev.plain, prev[lv], rPlain, rN, yuvMat);
          if (run.proj === 640) ment[lv].yuv709 = yuvDeltaStats(prev.plain, prev[lv], rPlain, rN, "bt709");
          // M3: tự tương quan lag-1/lag-2 của delta (chỉ noise05, tiết kiệm thời gian)
          if (lv === "noise05") {
            const dP = deltaOf(prev[lv], prev.plain);
            const dR = deltaOf(rN, rPlain);
            ment[lv].lag1 = { preview: lagAutocorr(dP, vw, vh, 1, 0), render: lagAutocorr(dR, vw, vh, 1, 0) };
            ment[lv].lag2 = { preview: lagAutocorr(dP, vw, vh, 2, 0), render: lagAutocorr(dR, vw, vh, 2, 0) };
            ment[lv].lag1y = { preview: lagAutocorr(dP, vw, vh, 0, 1), render: lagAutocorr(dR, vw, vh, 0, 1) };
          }
          console.log(`  [${mName}] ${content}/${lv}: RGB stdRatio ${JSON.stringify(st.stdRatio)} ${st.verdict} | YUV(${yuvMat}) stdRatio ${JSON.stringify(ment[lv].yuv.stdRatio)}` +
            (run.proj === 640 ? ` | YUV709 stdRatio ${JSON.stringify(ment[lv].yuv709.stdRatio)}` : ""));
        }
        // M4: capture thứ 2 (plain2/noise05b) cho noise05
        const rPlain2 = rPlain; // render không đổi giữa 2 capture
        const st2 = deltaStats(prev.plain2, prev.noise05b, rPlain2, rN05);
        ment.noise05_secondCapture = { rgb: st2 };
        console.log(`  [${mName}] ${content}/noise05 capture2: RGB stdRatio ${JSON.stringify(st2.stdRatio)} ${st2.verdict}`);
        // M1: render lại bằng bt709 (chỉ project 640, chỉ trilinear — tiết kiệm thời gian)
        if (run.proj === 640 && mName.startsWith("trilinear")) {
          const rend709 = {};
          for (const v of ["plain", "noise05", "noise10"]) rend709[v] = fs.readFileSync(ffmpegBt709(content, v));
          for (const lv of ["noise05", "noise10"]) {
            const rP709 = mFn(rend709.plain, projW, projH, vw, vh);
            const rN709 = mFn(rend709[lv], projW, projH, vw, vh);
            const st709 = deltaStats(prev.plain, prev[lv], rP709, rN709);
            ment[lv].rgbBt709Render = st709;
            console.log(`  [${mName}] ${content}/${lv} render-bt709: RGB stdRatio ${JSON.stringify(st709.stdRatio)} ${st709.verdict} (so bt601: ${JSON.stringify(ment[lv].rgb.stdRatio)})`);
          }
        }
        crep.methods[mName] = ment;
      }
      runRep[content] = crep;
    }
    report.probeB[run.dir] = runRep;
  }

  // ================= (c) lineart 1px =================
  console.log("\n######## PROBE (c): lineart 1px chi tiết ########");
  for (const run of RUNS) {
    const doc = loadSnaps(path.join(G5, run.dir), run.file);
    const content = run.proj === 640 ? "lineart640" : "lineart";
    const snaps = doc.snaps[content];
    if (!snaps) { console.log(`  ${content}: không có snaps — bỏ qua`); continue; }
    const vw = snaps.plain.w, vh = snaps.plain.h;
    const projW = run.proj, projH = run.proj === 640 ? 360 : 720;
    const prev = {};
    for (const v of ["plain", "plain2", "sharp05", "sharp10", "noise05", "noise05b", "noise10"]) prev[v] = b64(snaps[v].rgbB64);
    const rend = {};
    for (const v of ["plain", "sharp05", "sharp10", "noise05", "noise10"]) rend[v] = readFullRgb(content, v);
    console.log(`\n== ${content} @ ${run.dir} (scale ${run.scale}, rect ${vw}x${vh}) ==`);
    const crep = { rect: { w: vw, h: vh }, methods: {} };
    for (const [mName, mFn] of [["trilinear(BC-prod)", BC], ["triangle-old", TRI]]) {
      const rPlain = mFn(rend.plain, projW, projH, vw, vh);
      const pm = absMadPerChannel(prev.plain, rPlain);
      const ment = { plainPerChannel: pm };
      console.log(`  [${mName}] plain MAD/kênh ${JSON.stringify(pm.madPerChannel)} le8/kênh ${JSON.stringify(pm.le8PerChannel)} (tổng MAD ${pm.mad} le8 ${pm.le8})`);
      for (const v of ["sharp05", "sharp10"]) {
        const rV = mFn(rend[v], projW, projH, vw, vh);
        const abs = absMadPerChannel(prev[v], rV);
        // delta từng kênh
        const n = vw * vh;
        const dp = new Float64Array(n * 3), dr = new Float64Array(n * 3);
        for (let i = 0; i < n * 3; i++) { dp[i] = prev[v][i] - prev.plain[i]; dr[i] = rV[i] - rPlain[i]; }
        const dMad = [0, 0, 0];
        for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < n * 3; i += 3) s += Math.abs(dp[i] - dr[i]); dMad[c] = +(s / n).toFixed(3); }
        ment[v] = { absMadPerChannel: abs.madPerChannel, deltaMadPerChannel: dMad };
        console.log(`  [${mName}] ${v}: abs MAD/kênh ${JSON.stringify(abs.madPerChannel)} | delta MAD/kênh ${JSON.stringify(dMad)}`);
      }
      for (const lv of ["noise05", "noise10"]) {
        const rN = mFn(rend[lv], projW, projH, vw, vh);
        ment[lv] = { rgb: deltaStats(prev.plain, prev[lv], rPlain, rN) };
        console.log(`  [${mName}] ${lv}: RGB stdRatio ${JSON.stringify(ment[lv].rgb.stdRatio)} Δkurt ${JSON.stringify(ment[lv].rgb.kurtDiff)} ${ment[lv].rgb.verdict}`);
      }
      // C3: capture thứ 2 cho noise05
      const rN05 = mFn(rend.noise05, projW, projH, vw, vh);
      ment.noise05_secondCapture = { rgb: deltaStats(prev.plain2, prev.noise05b, rPlain, rN05) };
      console.log(`  [${mName}] noise05 capture2: RGB stdRatio ${JSON.stringify(ment.noise05_secondCapture.rgb.stdRatio)} Δkurt ${JSON.stringify(ment.noise05_secondCapture.rgb.kurtDiff)} ${ment.noise05_secondCapture.rgb.verdict}`);
      // C2: profile lưới — scanline ngang trung bình qua dải hàng giữa (tránh đường chéo/vòng tròn:
      // lấy dải y = 8%..12% chiều cao viewport — vùng chỉ có lưới ngang/dọc đều)
      const y0 = Math.floor(vh * 0.08), y1 = Math.floor(vh * 0.12);
      const prof = (img) => {
        const p = new Float64Array(vw);
        for (let x = 0; x < vw; x++) {
          let s = 0, n = 0;
          for (let y = y0; y < y1; y++) { s += img[(y * vw + x) * 3]; n++; }
          p[x] = s / n;
        }
        return p;
      };
      const pP = prof(prev.plain), pBC = prof(rPlain);
      const rPlainTri = TRI(rend.plain, projW, projH, vw, vh);
      const pTri = prof(rPlainTri);
      let madBC = 0, madTri = 0, minBC = 255, minTri = 255, minP = 255;
      for (let x = 0; x < vw; x++) { madBC += Math.abs(pP[x] - pBC[x]); madTri += Math.abs(pP[x] - pTri[x]); if (pBC[x] < minBC) minBC = pBC[x]; if (pTri[x] < minTri) minTri = pTri[x]; if (pP[x] < minP) minP = pP[x]; }
      ment.gridProfile = {
        bandY: [y0, y1], madBC: +(madBC / vw).toFixed(3), madTri: +(madTri / vw).toFixed(3),
        minPreview: +minP.toFixed(1), minBC: +minBC.toFixed(1), minTri: +minTri.toFixed(1),
      };
      console.log(`  [${mName}] grid profile (y ${y0}..${y1}): MAD preview-vs-model BC ${ment.gridProfile.madBC} / tri ${ment.gridProfile.madTri}; min preview ${ment.gridProfile.minPreview} vs BC ${ment.gridProfile.minBC} vs tri ${ment.gridProfile.minTri}`);
      crep.methods[mName] = ment;
    }
    report.probeC[run.dir] = { [content]: crep };
  }

  fs.mkdirSync(H3, { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON probe offline: ${OUT}`);
}
main();
