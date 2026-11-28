// parityHarness203-denoise.ts — Harness parity đợt 203 P4: mảng denoise/sharpen.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: sectionSharpen, sectionDenoise (N10/N5b), sectionNoise, sectionSharpenNoisy.
import * as fs from "node:fs";
import * as path from "node:path";
import { applyNoise, applySharpen } from "./effectCanvas";
import {
  denoiseAdaptiveK,
  denoiseBlendAlpha,
  denoiseWarmupFactor,
  enhancePreviewPlan,
  estimateNoiseSigmaFromRgba,
} from "./enhancePreview";
import {
  TMP,
  compareFrames,
  denoisePreviewComposite,
  ff,
  frameAt,
  fromImg,
  gauss,
  mulberry32,
  nodeRequireJs,
  patternFrame,
  record,
  renderYuv444,
  round,
  tierOf,
  toImg,
} from "./parityHarness203-core";

// ---------------------------------------------------------------------------
// S1 — P2 sharpen: applySharpen (preview) vs unsharp render (bt709 yuv444p)
// ---------------------------------------------------------------------------
export function sectionSharpen(): void {
  console.log("== S1 sharpen (P2) — preview applySharpen vs render unsharp bt709 ==");
  const w = 72;
  const h = 45;
  const src = patternFrame(w, h);
  for (const [t, amount] of [[0.5, 1.1], [1, 2.0]] as const) {
    const filter = nodeRequireJs(
      "server/render/src/effects.js",
      `m.buildEffectFilter({type:"sharpen",intensity:${t}})`,
    );
    const ffOut = renderYuv444(filter, src, w, h);
    const prev = fromImg(applySharpen(toImg(src, w, h), t), w, h);
    const m = compareFrames(ffOut, prev, w, h);
    const tier = tierOf(m);
    record({
      id: `S1-sharpen-t${t}`,
      name: `sharpen t=${t} — preview vs render ${filter}`,
      verdict: tier === "KHỚP" ? "ĐẠT" : "CHƯA ĐẠT",
      tier,
      numbers: { MAD: m.mad, PSNR: m.psnr === Infinity ? "inf" : m.psnr, le8_pct: m.le8 * 100, le32_pct: m.le32 * 100, renderAmount: amount },
      notes: `Tiêu chí KHỚP: MAD<=2 & le8>=99%. Filter render lấy từ effects.js thật: ${filter}.`,
    });
  }
}

// ---------------------------------------------------------------------------
// S2 — P2 denoise: composite preview (blend alpha + blur σ=3) vs hqdn3d render
// ---------------------------------------------------------------------------
export function sectionDenoise(): void {
  console.log("== S2 denoise (P2) — preview blend vs render hqdn3d (fixture YUV như footage thật) ==");
  const w = 320;
  const h = 180;
  const sigmaNoise = 15;
  const NFRAMES = 30;
  // Fixture: 30 frame phẳng 128 + nhiễu Gauss độc lập mỗi frame, sinh ở
  // RGB rồi chuyển 1 lần sang yuv420p bt709 = "footage". Cả 2 phía xuất
  // phát từ CÙNG footage này (như sản phẩm thật: nguồn đã là yuv420p):
  //  - render: footage yuv420p → hqdn3d → rgb24 (hqdn3d chạy trên yuv,
  //    không có roundtrip rgb→yuv thừa như bản harness v1 — bản đó đo
  //    render -33% @s=0.3, sai so với -18.5% của P2 vì nhiễu chroma bị
  //    subsampling làm loãng thêm một lần).
  //  - preview: decode footage → rgb24 rồi blend (1-a)·gốc + a·blur σ=1.5.
  // % giảm nhiễu đo trên plane Y (theo P2 LIMITS §1) + MAD/PSNR trên RGB.
  // Khổ 320×180 như probe P2 để so trực tiếp được với bảng P2 §2.1/§2.2.
  const rgbFrames: Buffer[] = [];
  for (let f = 0; f < NFRAMES; f++) {
    const rng = mulberry32(19100 + f);
    const buf = Buffer.alloc(w * h * 3);
    for (let i = 0; i < buf.length; i++)
      buf[i] = Math.max(0, Math.min(255, Math.round(128 + sigmaNoise * gauss(rng))));
    rgbFrames.push(buf);
  }
  const rgbIn = path.join(TMP, "dn-rgb.raw");
  const yuvFoot = path.join(TMP, "dn-foot.yuv");
  fs.writeFileSync(rgbIn, Buffer.concat(rgbFrames));
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
    "-i", rgbIn, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
    "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvFoot], "rgb->yuv footage");
  const decRgb = path.join(TMP, "dn-dec.raw");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", yuvFoot, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
    "-f", "rawvideo", "-pix_fmt", "rgb24", decRgb], "yuv->rgb decode");
  const decAll = fs.readFileSync(decRgb);
  const dec = (f: number): Buffer => frameAt(decAll, w, h, f);
  const renderSeq = (filter: string): Buffer => {
    const out = path.join(TMP, "dn-out.raw");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", yuvFoot, "-vf", `${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", out], `hqdn3d ${filter}`);
    return fs.readFileSync(out);
  };
  const yStd = (x: Buffer): number => {
    const n = w * h;
    let mean = 0;
    for (let i = 0; i < n; i++) mean += 0.2126 * x[i * 3] + 0.7152 * x[i * 3 + 1] + 0.0722 * x[i * 3 + 2];
    mean /= n;
    let s2 = 0;
    for (let i = 0; i < n; i++) {
      const d = 0.2126 * x[i * 3] + 0.7152 * x[i * 3 + 1] + 0.0722 * x[i * 3 + 2] - mean;
      s2 += d * d;
    }
    return Math.sqrt(s2 / n);
  };
  const steadyIdx = 8; // frame 8 như bảng P2 §2.1 (frame 8+ = ổn định)
  for (const s of [0.3, 0.5, 0.8, 1.0]) {
    const filter = nodeRequireJs(
      "server/render/src/enhance.js",
      `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
    ).replace(/^,/, "");
    const renderAll = renderSeq(filter);
    const renderMid = frameAt(renderAll, w, h, steadyIdx);
    const prev = denoisePreviewComposite(dec(steadyIdx), w, h, s);
    const yIn = yStd(dec(steadyIdx));
    const redY = (x: Buffer) => (1 - yStd(x) / yIn) * 100;
    const mA = compareFrames(renderMid, prev, w, h);
    const tierA = tierOf(mA);
    record({
      id: `S2-denoise-s${s}`,
      name: `denoise s=${s} — preview blend (alpha=${round(denoiseBlendAlpha(s))}, blur σ=1.5) vs hqdn3d ${filter} (frame 8, fixture YUV 320×180)`,
      verdict: tierA === "KHỚP" || tierA === "XẤP XỈ" ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierA,
      numbers: {
        MAD_frame8: mA.mad, PSNR_frame8: mA.psnr === Infinity ? "inf" : mA.psnr,
        le8_frame8_pct: mA.le8 * 100, le32_frame8_pct: mA.le32 * 100,
        reduceY_render_pct: redY(renderMid), reduceY_preview_pct: redY(prev),
        deltaY_pts: redY(prev) - redY(renderMid),
        srcY_std: yIn,
        alpha: denoiseBlendAlpha(s),
      },
      notes: `Mục tiêu P2 §2.1 (cùng phương pháp): render -18.5/-44.8/-71.1/-78.9%, preview -18.1/-43.7/-70.3/-80.0% (sai ≤1.1 điểm). Verdict theo tier MAD (XẤP XỈ kỳ vọng — preview là xấp xỉ không gian).`,
    });
  }
  // Warm-up (đợt 191 P2): 3 frame đầu clip — alpha nhân denoiseWarmupFactor,
  // đo trên ĐÚNG frame render 0/1/2 của cùng chuỗi 30f (không render lại).
  // Đợt 192 N3: đo thêm frame 3 (hết warm-up, alpha đầy đủ) — P2-191 ghi
  // frame 3 s=0.8 còn sai -5.4 điểm (hồi quy tuyến tính), frame ≥3 khác ≤1.1.
  // Đợt 193 P2 (LIMITS §1.4): warm-up THÍCH NGHI — S2 PHẢI truyền σ̂ ước
  // lượng của fixture làm đối số thứ 6 của enhancePreviewPlan (không truyền
  // = đo hành vi cũ k=1). σ̂ đo bằng đúng estimator P2 dùng trong preview
  // (estimateNoiseSigmaFromRgba trên RGBA của frame giải mã). Fixture σ=15
  // của P4 (Y-std 11,23) → σ̂≈11,2 → k(0,5; 11,2)≈0,63 → S2-warmup-s0.5
  // dự kiến ~0,6–1,5 (đợt 192: +8,82).
  /** σ̂ của một frame RGB24 (đo như preview.tsx: RGBA → estimator của P2). */
  function sigmaHatOf(rgb: Buffer, w: number, h: number): number {
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = rgb[i * 3];
      rgba[i * 4 + 1] = rgb[i * 3 + 1];
      rgba[i * 4 + 2] = rgb[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
    return estimateNoiseSigmaFromRgba(rgba, w, h);
  }
  const frame2noisy: Array<{ s: number; delta: number; mad: number }> = [];
  for (const s of [0.3, 0.5, 0.8, 1.0]) {
    const filter = nodeRequireJs(
      "server/render/src/enhance.js",
      `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
    ).replace(/^,/, "");
    const renderAll = renderSeq(filter);
    const deltas: number[] = [];
    const mads: number[] = [];
    const alphas: number[] = [];
    const sigmas: number[] = [];
    const ks: number[] = [];
    for (let f = 0; f < 3; f++) {
      const sigmaHat = sigmaHatOf(dec(f), w, h);
      const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, f, sigmaHat);
      const prevF = denoisePreviewComposite(dec(f), w, h, s, planF.denoiseBlendAlpha);
      const renderF = frameAt(renderAll, w, h, f);
      const yInF = yStd(dec(f));
      const redYF = (x: Buffer) => (1 - yStd(x) / yInF) * 100;
      deltas.push(redYF(prevF) - redYF(renderF));
      mads.push(compareFrames(renderF, prevF, w, h).mad);
      alphas.push(planF.denoiseBlendAlpha);
      sigmas.push(sigmaHat);
      ks.push(denoiseAdaptiveK(s, sigmaHat));
    }
    frame2noisy.push({ s, delta: deltas[2], mad: mads[2] });
    const maxAbsDelta = Math.max(...deltas.slice(0, 3).map((d) => Math.abs(d)));
    record({
      id: `S2-warmup-s${s}`,
      name: `denoise warm-up s=${s} — preview alpha×warmup vs hqdn3d frame 0/1/2`,
      verdict: maxAbsDelta <= 5.5 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        delta_f0_pts: deltas[0], delta_f1_pts: deltas[1], delta_f2_pts: deltas[2],
        max_abs_delta_pts: maxAbsDelta,
        MAD_f0: mads[0], MAD_f1: mads[1], MAD_f2: mads[2],
        alpha_f0: alphas[0], alpha_f1: alphas[1], alpha_f2: alphas[2],
        warmup_f0: denoiseWarmupFactor(0, s, sigmas[0]), warmup_f1: denoiseWarmupFactor(1, s, sigmas[1]), warmup_f2: denoiseWarmupFactor(2, s, sigmas[2]),
        noiseSigma_f0: sigmas[0], noiseSigma_f1: sigmas[1], noiseSigma_f2: sigmas[2],
        adaptK_f0: ks[0], adaptK_f1: ks[1], adaptK_f2: ks[2],
      },
      notes: `Tiêu chí: |Δ giảm std Y| <= 5.5 điểm ở cả 3 frame đầu — ngưỡng theo mức chấp nhận đã ghi của P2 (LIMITS §2.2/§5.1: sai số còn lại ≤5.4 điểm, tệ nhất frame 3 s=0.8). Không warm-up, preview overstate +13..+51 điểm ở frame đầu (comment enhancePreview.ts). Đợt 193: đo với σ̂ thích nghi (P2-193 §1.4) — σ̂ đo bằng estimator của P2 trên frame giải mã; không truyền σ̂ = đo hành vi cũ.`,
    });
  }
  // N3 bổ sung — fixture flat15-like (hiệu chuẩn của P2): cùng generator
  // nhưng sigmaNoise=11 → Y-std ≈ 8.25 như flat15 của P2 (fixture σ=15
  // trên có Y-std 11.23 ≈ flat20; P2-192 §1.4: warm-up bậc 2 chỉ hiệu
  // chuẩn trên flat15, trên flat20 sai tới +16.5). ĐO f=0..3 (P2 đếm
  // frame 1-based: "frame 3" của P2 là f=2 — warm-up chỉ áp f=0,1,2;
  // bản N3 đầu đo f=3 là SAI khung, đã sửa — xem F-192-P4-4).
  const flat15frames: Array<{ s: number; deltas: number[]; mads: number[]; sigmas: number[] }> = [];
  // Đo thêm trên ĐÚNG fixture của P2 (gen.sh: color 0x808080 +
  // noise=alls=15:allf=t, 16f yuv420p) — phân biệt "claim P2 sai" với
  // "fixture flat15-like của P4 khác cấu trúc nhiễu" (xem F-192-P4-4).
  const p2flat15f2: Array<{ s: number; delta: number; mad: number; sigma: number }> = [];
  {
    const sigma15 = 11;
    const rgbFrames15: Buffer[] = [];
    for (let f = 0; f < NFRAMES; f++) {
      const rng = mulberry32(19200 + f);
      const buf = Buffer.alloc(w * h * 3);
      for (let i = 0; i < buf.length; i++)
        buf[i] = Math.max(0, Math.min(255, Math.round(128 + sigma15 * gauss(rng))));
      rgbFrames15.push(buf);
    }
    const rgbIn15 = path.join(TMP, "dn15-rgb.raw");
    const yuvFoot15 = path.join(TMP, "dn15-foot.yuv");
    fs.writeFileSync(rgbIn15, Buffer.concat(rgbFrames15));
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", rgbIn15, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvFoot15], "rgb->yuv footage flat15");
    const decRgb15 = path.join(TMP, "dn15-dec.raw");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", yuvFoot15, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
      "-f", "rawvideo", "-pix_fmt", "rgb24", decRgb15], "yuv->rgb decode flat15");
    const decAll15 = fs.readFileSync(decRgb15);
    const dec15 = (f: number): Buffer => frameAt(decAll15, w, h, f);
    const renderSeq15 = (filter: string): Buffer => {
      const out = path.join(TMP, "dn15-out.raw");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", yuvFoot15, "-vf", `${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], `hqdn3d flat15 ${filter}`);
      return fs.readFileSync(out);
    };
    for (const s of [0.3, 0.5, 0.8, 1.0]) {
      const filter = nodeRequireJs(
        "server/render/src/enhance.js",
        `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
      ).replace(/^,/, "");
      const renderAll = renderSeq15(filter);
      const deltas15: number[] = [];
      const mads15: number[] = [];
      const sigmas15: number[] = [];
      for (let f = 0; f < 4; f++) {
        const sigmaHat = sigmaHatOf(dec15(f), w, h);
        const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, f, sigmaHat);
        const prevF = denoisePreviewComposite(dec15(f), w, h, s, planF.denoiseBlendAlpha);
        const renderF = frameAt(renderAll, w, h, f);
        const yInF = yStd(dec15(f));
        const redYF = (x: Buffer) => (1 - yStd(x) / yInF) * 100;
        deltas15.push(redYF(prevF) - redYF(renderF));
        mads15.push(compareFrames(renderF, prevF, w, h).mad);
        sigmas15.push(sigmaHat);
      }
      flat15frames.push({ s, deltas: deltas15, mads: mads15, sigmas: sigmas15 });
    }
    console.log(`   flat15-like fixture: Y-std frame2=${yStd(dec15(2)).toFixed(2)} frame3=${yStd(dec15(3)).toFixed(2)} (P2 flat15: 8.25)`);
    // Fixture đúng của P2 (gen.sh round192-p2): color 0x808080 +
    // noise=alls=15:allf=t, 16 frame. Chỉ đo f=2 (frame 3 của P2).
    {
      const seqYuv = path.join(TMP, "p2flat15seq.yuv");
      ff(["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x808080:s=320x180:r=30:d=16",
        "-vf", "noise=alls=15:allf=t,format=yuv420p", "-frames:v", "16", seqYuv], "P2 flat15seq");
      const decP2 = path.join(TMP, "p2flat15-dec.raw");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", seqYuv, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
        "-f", "rawvideo", "-pix_fmt", "rgb24", decP2], "P2 flat15 decode");
      const decAllP2 = fs.readFileSync(decP2);
      const decP2f = (f: number): Buffer => frameAt(decAllP2, w, h, f);
      const yInP2 = yStd(decP2f(2));
      const renderSeqP2 = (filter: string): Buffer => {
        const out = path.join(TMP, "p2flat15-out.raw");
        ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
          "-i", seqYuv, "-vf", `${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
          "-f", "rawvideo", "-pix_fmt", "rgb24", out], `hqdn3d P2flat15 ${filter}`);
        return fs.readFileSync(out);
      };
      for (const s of [0.3, 0.5, 0.8, 1.0]) {
        const filter = nodeRequireJs(
          "server/render/src/enhance.js",
          `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
        ).replace(/^,/, "");
        const renderAll = renderSeqP2(filter);
        const sigmaHatP2 = sigmaHatOf(decP2f(2), w, h);
        const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, 2, sigmaHatP2);
        const prevF = denoisePreviewComposite(decP2f(2), w, h, s, planF.denoiseBlendAlpha);
        const renderF = frameAt(renderAll, w, h, 2);
        const redYF = (x: Buffer) => (1 - yStd(x) / yInP2) * 100;
        p2flat15f2.push({ s, delta: redYF(prevF) - redYF(renderF), mad: compareFrames(renderF, prevF, w, h).mad, sigma: sigmaHatP2 });
      }
      console.log(`   P2 flat15seq (gen.sh): Y-std frame2=${yInP2.toFixed(2)} (P2: 8.25)`);
    }
  }
  // N3 — denoise "frame 3" của P2 = f=2 (đếm 1-based; warm-up chỉ áp
  // f=0,1,2). Verdict theo ĐÚNG fixture của P2 (flat15seq, gen.sh);
  // flat15-like (Gauss RGB) + f=3 + fixture σ=15 chỉ là hàng phụ.
  {
    const d08 = p2flat15f2.find((r) => r.s === 0.8)?.delta ?? NaN;
    const maxAbs = Math.max(...p2flat15f2.map((r) => Math.abs(r.delta)));
    const maxAbsLike = Math.max(...flat15frames.map((r) => Math.abs(r.deltas[2])));
    const maxAbsF3 = Math.max(...flat15frames.map((r) => Math.abs(r.deltas[3])));
    const maxAbsNoisyF2 = Math.max(...frame2noisy.map((r) => Math.abs(r.delta)));
    record({
      id: "N3-denoise-frame3",
      name: "denoise frame 3 (P2: f=2) — preview blend vs hqdn3d (s=0.3/0.5/0.8/1.0)",
      verdict: Math.abs(d08) <= 2 && maxAbs <= 5.5 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        p2flat15_delta_f2_s03_pts: p2flat15f2[0].delta, p2flat15_delta_f2_s05_pts: p2flat15f2[1].delta,
        p2flat15_delta_f2_s08_pts: p2flat15f2[2].delta, p2flat15_delta_f2_s10_pts: p2flat15f2[3].delta,
        p2flat15_max_abs_delta_f2_pts: maxAbs,
        p2flat15_MAD_f2_s08: p2flat15f2[2].mad,
        p2flat15_noiseSigma_f2: p2flat15f2[0].sigma,
        flat15_noiseSigma_f2_s05: flat15frames[1].sigmas[2],
        flat15_delta_f2_s03_pts: flat15frames[0].deltas[2], flat15_delta_f2_s05_pts: flat15frames[1].deltas[2],
        flat15_delta_f2_s08_pts: flat15frames[2].deltas[2], flat15_delta_f2_s10_pts: flat15frames[3].deltas[2],
        flat15_max_abs_delta_f2_pts: maxAbsLike,
        flat15_MAD_f2_s08: flat15frames[2].mads[2],
        flat15_delta_f3_s03_pts: flat15frames[0].deltas[3], flat15_delta_f3_s05_pts: flat15frames[1].deltas[3],
        flat15_delta_f3_s08_pts: flat15frames[2].deltas[3], flat15_delta_f3_s10_pts: flat15frames[3].deltas[3],
        flat15_max_abs_delta_f3_pts: maxAbsF3,
        noisy_delta_f2_s03_pts: frame2noisy[0].delta, noisy_delta_f2_s05_pts: frame2noisy[1].delta,
        noisy_delta_f2_s08_pts: frame2noisy[2].delta, noisy_delta_f2_s10_pts: frame2noisy[3].delta,
        noisy_max_abs_delta_f2_pts: maxAbsNoisyF2,
      },
      notes: `Baseline P2-192 (LIMITS §1, đo trên flat15seq Y-std 8.25, frame 3 = f=2): s=0.3 -0.3 / s=0.5 +0.2 / s=0.8 -0.8 (trước -5.4) / s=1.0 +0.5 — tệ nhất 1.5 điểm. Tiêu chí ĐẠT (theo ĐÚNG fixture flat15seq của P2, f=2): |Δ s=0.8| ≤ 2 điểm và không s nào vượt 5.5 điểm. Hàng "flat15-like" (Gauss RGB σ=11, Y-std ≈8.28) + f=3 + hàng "noisy" (σ=15, Y-std 11.23 ≈ flat20) chỉ là phụ — P2-192 §1.4 đã ghi trên flat20 f=2: s=0.5 +16.5, s=0.8 +10.0 (bậc 2 tệ hơn tuyến tính tối đa +3.6 ở 1 ô).`,
    });
  }
  // enhancePreviewPlan: cờ applied/notApproximated ở các mốc strength.
  const plan = enhancePreviewPlan({ denoise: { strength: 0.5 } }, true, false, 1.0);
  record({
    id: "S2-plan",
    name: "enhancePreviewPlan denoise s=0.5 — applied/notApproximated",
    verdict: plan.applied.includes("denoise") && plan.denoiseBlendAlpha > 0 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { alpha: plan.denoiseBlendAlpha, blurPx: plan.denoiseBlurPx, zoom: plan.stabilizeZoom },
    notes: `applied=[${plan.applied.join(",")}] notApproximated=[${plan.notApproximated.join(",")}].`,
  });
}

// ---------------------------------------------------------------------------
// S3 — P2 noise effect: applyNoise (preview) vs noise render (yuv420p)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// S3 — P2 noise effect: applyNoise (preview) vs noise render (yuv420p)
// ---------------------------------------------------------------------------
function channelStats(buf: Buffer, base: number): { std: number[]; kurt: number[]; corr: number[][] } {
  const n = buf.length / 3;
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let i = c; i < buf.length; i += 3) s += buf[i] - base;
    mean[c] = s / n;
  }
  const std = [0, 0, 0];
  const kurt = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s2 = 0;
    let s4 = 0;
    for (let i = c; i < buf.length; i += 3) {
      const v = buf[i] - base - mean[c];
      s2 += v * v;
      s4 += v * v * v * v;
    }
    std[c] = Math.sqrt(s2 / n);
    kurt[c] = s4 / n / std[c] ** 4 - 3;
  }
  const corr = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += (buf[i * 3 + a] - base - mean[a]) * (buf[i * 3 + b] - base - mean[b]);
      corr[a][b] = s / n / (std[a] * std[b]);
    }
  return { std, kurt, corr };
}
function renderNoiseYuv(alls: number, src: Buffer, w: number, h: number): Buffer {
  const inp = path.join(TMP, "ny-in.raw");
  const yuv = path.join(TMP, "ny-mid.raw");
  const yuvN = path.join(TMP, "ny-n.raw");
  const out = path.join(TMP, "ny-out.raw");
  fs.writeFileSync(inp, src);
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
    "-i", inp, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuv], "rgb->yuv");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", yuv, "-vf", `noise=alls=${alls}:allf=t`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvN], "noise yuv");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", yuvN, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yuv->rgb");
  return fs.readFileSync(out);
}
export function sectionNoise(): void {
  console.log("== S3 noise effect (P2) — preview applyNoise vs render noise yuv420p ==");
  const w = 144;
  const h = 90;
  const flat = Buffer.alloc(w * h * 3, 128);
  for (const [intensity, alls] of [[0.5, 28], [1, 50]] as const) {
    const ffOut = renderNoiseYuv(alls, flat, w, h);
    const prev = fromImg(applyNoise(toImg(flat, w, h), intensity, 42), w, h);
    const sR = channelStats(ffOut, 128);
    const sP = channelStats(prev, 128);
    const ratios = sR.std.map((v, i) => sP.std[i] / v);
    const dKurt = sR.kurt.map((v, i) => Math.abs(sP.kurt[i] - v));
    const dCorr = [
      Math.abs(sP.corr[0][1] - sR.corr[0][1]),
      Math.abs(sP.corr[0][2] - sR.corr[0][2]),
      Math.abs(sP.corr[1][2] - sR.corr[1][2]),
    ];
    const guardOK =
      sR.std[0] / sR.std[1] >= 1.4 && sR.std[0] / sR.std[1] <= 1.9 &&
      sR.std[2] / sR.std[1] >= 1.6 && sR.std[2] / sR.std[1] <= 2.1 &&
      sR.corr[1][2] >= 0.15;
    const ok =
      guardOK &&
      ratios.every((r) => r >= 0.85 && r <= 1.18) &&
      dKurt.every((d) => d <= 0.35) &&
      dCorr.every((d) => d <= 0.12);
    record({
      id: `S3-noise-t${intensity}`,
      name: `noise t=${intensity} (alls=${alls}) — thống kê preview vs render yuv420p`,
      verdict: ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        std_ratio_R: ratios[0], std_ratio_G: ratios[1], std_ratio_B: ratios[2],
        max_dKurt: Math.max(...dKurt), max_dCorr: Math.max(...dCorr),
        guard_pipeline_yuv: guardOK ? 1 : 0,
      },
      notes: `Tiêu chí đợt 63 R8: tỉ lệ std [0.85,1.18], |Δkurt|<=0.35, |Δcorr|<=0.12 + guard pipeline YUV. std render=[${sR.std.map((v) => round(v)).join(",")}] preview=[${sP.std.map((v) => round(v)).join(",")}].`,
    });
  }
}

// ---------------------------------------------------------------------------
// S4 — P1 voice RENDER (nền): filter voicefx.js thật qua FFmpeg + Goertzel
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// N4 — P2 sharpen trên nội dung NHIỄU: applySharpen vs unsharp render
// ---------------------------------------------------------------------------
export function sectionSharpenNoisy(): void {
  console.log("== N4 sharpen nhiễu (P2) — preview applySharpen vs render unsharp trên pattern+nhiễu σ=15 ==");
  const w = 144;
  const h = 90;
  const base = patternFrame(w, h);
  const rng = mulberry32(19200);
  const src = Buffer.from(base);
  for (let i = 0; i < src.length; i++)
    src[i] = Math.max(0, Math.min(255, Math.round(src[i] + 15 * gauss(rng))));
  for (const t of [0.5, 1.0] as const) {
    const filter = nodeRequireJs("server/render/src/effects.js", `m.buildEffectFilter({type:"sharpen",intensity:${t}})`);
    const ffOut = renderYuv444(filter, src, w, h);
    const prev = fromImg(applySharpen(toImg(src, w, h), t), w, h);
    const m = compareFrames(ffOut, prev, w, h);
    const tier = tierOf(m);
    record({
      id: `N4-sharpen-noisy-t${t}`,
      name: `sharpen t=${t} trên nội dung nhiễu σ=15 — preview vs render ${filter}`,
      verdict: tier === "KHỚP" || tier === "XẤP XỈ" ? "ĐẠT" : "CHƯA ĐẠT",
      tier,
      numbers: { MAD: m.mad, PSNR: m.psnr === Infinity ? "inf" : m.psnr, le8_pct: m.le8 * 100, le32_pct: m.le32 * 100 },
      notes: `Baseline đợt 191 (P2 LIMITS §5.2): sharpen trên nội dung nhiễu lệch MAD 1.5–3.0, le8 81–91% (giới hạn mô hình Y_est). Tiêu chí ĐẠT: tier XẤP XỈ trở lên (MAD≤20 & le32≥90%).`,
    });
  }
}

// ---------------------------------------------------------------------------
// N5 — P2 deint: R preview (bob sim) vs yadif render, testsrc2 interlaced
// Đợt 192 P2 đổi preview từ half-res sang BOB: intermediate draw tắt
// smoothing (nearest) giữ đúng TOP FIELD (hàng chẵn), rồi upscale bilinear
// (preview.tsx deintIntermediateSource + P2-192 LIMITS §3.3; đã xác minh
// headed Chromium 1254: 90/90 hàng = hàng chẵn). Mô hình dưới đây = đúng
// hàm bobField(src,0)+upscaleBilinear của probe P2-192 (probe-192-p2.mjs).
// ĐỢT 193 P2 (LIMITS §3.1/§6.2): bước upscale cuối nay TẮT smoothing
// (nearest) — deintBobNearestSource: half nearest rồi upscale nearest lên
// full-res (line doubling khi divisor=2). Mô hình dưới = bob-nearest.
// Half-res cũ giữ lại làm cột tham chiếu (không dùng cho verdict).
// ---------------------------------------------------------------------------
