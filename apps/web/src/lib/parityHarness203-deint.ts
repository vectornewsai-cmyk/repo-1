// parityHarness203-deint.ts — Harness parity đợt 203 P4: mảng deint (N5/N5b/N5c).
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: sim deint (deintBobSim/deintHalfResSim/deintBobFieldSim/
// tapShiftVerticalSim/bobFirstPreview/bobFirstPreview196/combingRLuma),
// deintFixture() dùng chung, sectionDeint (N5 + N5b + N5c).
import * as fs from "node:fs";
import * as path from "node:path";
import {
  ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR,
  deintBobFieldForOutputFrame,
  deintVerticalBlendWeight,
  denoiseAdaptiveK,
  denoiseBlendAlpha,
  denoiseMotionMultiplier,
  denoiseWarmupFactor,
  estimateNoiseSigmaFromRgba,
  motionBandLumaFromRgba,
  motionEstimateFromBandLuma,
} from "./enhancePreview";
import {
  TMP,
  compareFrames,
  denoisePreviewComposite,
  ff,
  gauss,
  motionMultiplierCap112,
  mulberry32,
  nodeRequireJs,
  record,
  tierOf,
} from "./parityHarness203-core";

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
export function deintBobSim(src: Buffer, w: number, h: number, divisor: number): Buffer {
  const h2 = Math.floor(h / divisor);
  const field = new Float64Array(w * h2 * 3);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) field[(y * w + x) * 3 + c] = src[((divisor * y) * w + x) * 3 + c];
  // Upscale NEAREST (đợt 193): hàng đích y lấy hàng field gần nhất —
  // với divisor=2 là line doubling [0,0,1,1,2,2,...] (đúng canvas
  // imageSmoothingEnabled=false của deintBobNearestSource).
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = (y + 0.5) / divisor - 0.5;
        const yn = Math.max(0, Math.min(h2 - 1, Math.round(sy)));
        out[(y * w + x) * 3 + c] = Math.round(field[(yn * w + x) * 3 + c]);
      }
  return out;
}
export function deintHalfResSim(src: Buffer, w: number, h: number, divisor: number): Buffer {
  const h2 = Math.floor(h / divisor);
  const mid = new Float64Array(w * h2 * 3);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = 0; k < divisor; k++) s += src[((divisor * y + k) * w + x) * 3 + c];
        mid[(y * w + x) * 3 + c] = s / divisor;
      }
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = (y + 0.5) / divisor - 0.5;
        const y0 = Math.max(0, Math.floor(sy));
        const y1 = Math.min(h2 - 1, y0 + 1);
        const f = Math.min(1, Math.max(0, sy - y0));
        out[(y * w + x) * 3 + c] = Math.round(mid[(y0 * w + x) * 3 + c] * (1 - f) + mid[(y1 * w + x) * 3 + c] * f);
      }
  return out;
}
/** Bob một field chỉ định (đợt 194 P2 — mode 1 luân phiên): field 0 = hàng
 * chẵn (top), field 1 = hàng lẻ (bottom); upscale nearest như bob. */
export function deintBobFieldSim(src: Buffer, w: number, h: number, divisor: number, field: 0 | 1): Buffer {
  const h2 = Math.floor(h / divisor);
  const f = new Float64Array(w * h2 * 3);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) f[(y * w + x) * 3 + c] = src[((divisor * y + field) * w + x) * 3 + c];
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = (y + 0.5) / divisor - 0.5;
        const yn = Math.max(0, Math.min(h2 - 1, Math.round(sy)));
        out[(y * w + x) * 3 + c] = Math.round(f[(yn * w + x) * 3 + c]);
      }
  return out;
}
/** Dịch dọc ảnh dy px (nội suy bilinear) — mô hình tap +0,5px cũ của P2
 * (ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX, đã BỎ khỏi preview đợt 193). */
export function tapShiftVerticalSim(src: Buffer, w: number, h: number, dy: number): Buffer {
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = y + dy;
        const y0 = Math.max(0, Math.min(h - 1, Math.floor(sy)));
        const y1 = Math.max(0, Math.min(h - 1, y0 + 1));
        const f = Math.min(1, Math.max(0, sy - y0));
        out[(y * w + x) * 3 + c] = Math.round(src[(y0 * w + x) * 3 + c] * (1 - f) + src[(y1 * w + x) * 3 + c] * f);
      }
  return out;
}
/** Bob-first (P2-193 §3.2): bob-nearest TRƯỚC rồi blend denoise trên khung
 * đã bob (alphaOverride = alpha thích nghi đã tính, không tự tính lại). */
export function bobFirstPreview(src: Buffer, w: number, h: number, divisor: number, alpha: number): Buffer {
  return denoisePreviewComposite(deintBobSim(src, w, h, divisor), w, h, 0.5, alpha);
}
/** Bob-first đợt 196 (P2-196 — blend dọc sau bob): bob-nearest → blend dọc
 * với trọng số w = deintVerticalBlendWeight(σ̂) (0,75 khi σ̂ ≥ 8, 0 khi
 * sạch) → denoise trên khung đã blend. Blend = (1−w)·bob + w·blurV(bob),
 * blurV = dịch +0,5px bilinear (tapShiftVerticalSim — đúng canvas
 * drawImage smoothing-ON lệch +0,5px với globalAlpha=w của preview.tsx
 * deintBobNearestSource). w=0 → đúng bobFirstPreview cũ; w=1 → đúng
 * tap-P4 (denoise trên khung đã blur dọc hoàn toàn). */
export function bobFirstPreview196(src: Buffer, w: number, h: number, divisor: number, alpha: number, verticalBlendW: number): Buffer {
  const bob = deintBobSim(src, w, h, divisor);
  let blended = bob;
  if (verticalBlendW > 0) {
    const shifted = tapShiftVerticalSim(bob, w, h, 0.5);
    blended = Buffer.alloc(w * h * 3);
    for (let i = 0; i < blended.length; i++)
      blended[i] = Math.round(bob[i] * (1 - verticalBlendW) + shifted[i] * verticalBlendW);
  }
  return denoisePreviewComposite(blended, w, h, 0.5, alpha);
}
/** R combing: năng lượng gradient dọc trung bình (luma) — răng cưa làm tăng (P2-191). */
export function combingRLuma(rgb: Buffer, w: number, h: number): number {
  let s = 0;
  let n = 0;
  for (let y = 0; y < h - 1; y++)
    for (let x = 0; x < w; x++) {
      const ya = 0.2126 * rgb[(y * w + x) * 3] + 0.7152 * rgb[(y * w + x) * 3 + 1] + 0.0722 * rgb[(y * w + x) * 3 + 2];
      const yb = 0.2126 * rgb[((y + 1) * w + x) * 3] + 0.7152 * rgb[((y + 1) * w + x) * 3 + 1] + 0.0722 * rgb[((y + 1) * w + x) * 3 + 2];
      s += Math.abs(yb - ya);
      n++;
    }
  return s / n;
}
export interface DeintFixture {
  w: number;
  h: number;
  divisor: number;
  cleanYuv: string;
  interYuv: string;
  yadif: string;
  frameRgb: (yuvFile: string, idx: number) => Buffer;
}
let deintFixtureCache: DeintFixture | null = null;
// Fixture deint dùng chung cho sectionDeint + sectionDeintMotion (tách từ
// đầu sectionDeint đợt 203; memoize để chỉ sinh 1 lần — ffmpeg testsrc2 +
// interlace là xác định nên gọi lại cho cùng file).
export function deintFixture(): DeintFixture {
  if (deintFixtureCache) return deintFixtureCache;
  const w = 320;
  const h = 180;
  const divisor = ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR;
  const cleanYuv = path.join(TMP, "deint-clean.yuv");
  const interYuv = path.join(TMP, "deint-inter.yuv");
  ff(["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=${w}x${h}:rate=30:duration=1`,
    "-vf", "scale=out_color_matrix=bt709,format=yuv420p", "-f", "rawvideo", "-pix_fmt", "yuv420p", cleanYuv], "testsrc2 clean");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", cleanYuv, "-vf", "interlace=scan=tff:lowpass=0",
    "-f", "rawvideo", "-pix_fmt", "yuv420p", interYuv], "interlace");
  const yadif = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePreChain({deinterlace:true})`).replace(/^,/, "");
  // buildEnhancePreChain trả ",yadif=..." (dấu phẩy đầu là separator
  // trong chain render) — strip để dùng trực tiếp làm filter ffmpeg.
  const frameRgb = (yuvFile: string, idx: number): Buffer => {
    const FS = (w * h * 3) / 2;
    const buf = fs.readFileSync(yuvFile);
    const one = path.join(TMP, "deint-one.yuv");
    fs.writeFileSync(one, buf.subarray(idx * FS, (idx + 1) * FS));
    const out = path.join(TMP, "deint-one.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`,
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-i", one, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yuv->rgb");
    return fs.readFileSync(out);
  };
  deintFixtureCache = { w, h, divisor, cleanYuv, interYuv, yadif, frameRgb };
  return deintFixtureCache;
}

export function sectionDeint(): void {
  console.log("== N5 deint (P2) — preview BOB-NEAREST (đợt 193) vs yadif render, testsrc2 interlaced frame 8 ==");
  const { w, h, divisor, cleanYuv, interYuv, yadif, frameRgb } = deintFixture();
  const idx = 7; // frame 8
  const srcRgb = frameRgb(interYuv, idx);
  const cleanRgb = frameRgb(cleanYuv, idx);
  const yadifRgb = (() => {
    const out = path.join(TMP, "deint-yadif.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", interYuv, "-vf", `${yadif},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif");
    const all = fs.readFileSync(out);
    return Buffer.from(all.subarray(idx * w * h * 3, (idx + 1) * w * h * 3));
  })();
  const bobRgb = deintBobSim(srcRgb, w, h, divisor);
  const halfRgb = deintHalfResSim(srcRgb, w, h, divisor);
  const prevRgb = bobRgb;
  const m = compareFrames(yadifRgb, prevRgb, w, h);
  const mHalf = compareFrames(yadifRgb, halfRgb, w, h);
  const tier = tierOf(m);
  const rSrc = combingRLuma(srcRgb, w, h);
  const rClean = combingRLuma(cleanRgb, w, h);
  const rYadif = combingRLuma(yadifRgb, w, h);
  const rPrev = combingRLuma(prevRgb, w, h);
  const rHalf = combingRLuma(halfRgb, w, h);
  const rRel = Math.abs(rPrev - rYadif) / rYadif;
  record({
    id: "N5-deint",
    name: `deint testsrc2 interlaced frame 8 — preview BOB-NEAREST top-field (divisor=${divisor}) vs render ${yadif}`,
    verdict: (tier === "KHỚP" || tier === "XẤP XỈ") && rRel <= 0.15 ? "ĐẠT" : "CHƯA ĐẠT",
    tier,
    numbers: {
      MAD_vs_yadif: m.mad, PSNR_vs_yadif: m.psnr === Infinity ? "inf" : m.psnr,
      le8_pct: m.le8 * 100, le32_pct: m.le32 * 100,
      R_src: rSrc, R_clean: rClean, R_yadif: rYadif, R_preview: rPrev, R_rel_diff: rRel,
      MAD_halfres_ref_vs_yadif: mHalf.mad, R_halfres_ref: rHalf,
    },
    notes: `R = gradient dọc trung bình (luma) — răng cưa làm tăng. Verdict theo mô hình BOB-NEAREST (preview đợt 193, P2-193 §3.1/§6.2); half-res cũ chỉ làm tham chiếu. Baseline P2-193 (LIMITS §3.1, fixture của P2): bob-nearest MAD vs yadif 2,55 (f8) / 2,32 (f3) / 2,51 (f7), le8 95%; bob-bilinear cũ 3,10 (f8). Fixture đợt này sinh lại (interlace scan=tff lowpass=0) nên R_src khác — so tuyệt đối với số P2 chỉ mang tính tham chiếu; verdict theo tier + |ΔR|/R_yadif ≤ 15% trên cùng fixture.`,
  });
  // N5b — bob-first (P4-193 §2.5 note; P2-193 §3.2 đo 12/12 ô thắng):
  // bob-nearest TRƯỚC rồi blend denoise trên khung đã bob vs truth
  // yadif→hqdn3d; đối chiếu biến thể tap cũ (+0,5px trước denoise).
  // Fixture CÓ nhiễu: 30 frame testsrc2 (lấy từng frame qua frameRgb
  // từ cleanYuv) + nhiễu Gauss σ=15 độc lập mỗi frame (seed 19100+f
  // như S2) rồi interlace — trên khung sạch denoise không đổi gì nên
  // ô này vô nghĩa. Cần đủ 30 frame vì frameRgb/truth đọc theo idx.
  {
    const s = 0.5;
    const noisyFrames: Buffer[] = [];
    for (let f = 0; f < 30; f++) {
      const baseF = frameRgb(cleanYuv, f);
      const rngF = mulberry32(19100 + f);
      const nb = Buffer.alloc(w * h * 3);
      for (let i = 0; i < nb.length; i++)
        nb[i] = Math.max(0, Math.min(255, Math.round(baseF[i] + 15 * gauss(rngF))));
      noisyFrames.push(nb);
    }
    const noisyIn = path.join(TMP, "deint-noisy.rgb");
    fs.writeFileSync(noisyIn, Buffer.concat(noisyFrames));
    const noisyYuv = path.join(TMP, "deint-noisy.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyIn, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", noisyYuv], "noisy rgb->yuv");
    const interNoisyYuv = path.join(TMP, "deint-interno.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyYuv, "-vf", "interlace=scan=tff:lowpass=0",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", interNoisyYuv], "interlace noisy");
    const hq = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePostChain({denoise:{strength:${s}}})`).replace(/^,/, "");
    const truthAll = (() => {
      const out = path.join(TMP, "deint-truth.rgb");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interNoisyYuv, "-vf", `${yadif},${hq},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif+hqdn3d truth");
      return fs.readFileSync(out);
    })();
    const truthAt = (i: number): Buffer => Buffer.from(truthAll.subarray(i * w * h * 3, (i + 1) * w * h * 3));
    // 3 frame (idx 3/7/11 — như các ô f3/f7/f11 của probe P2-193 §3.2):
    // σ̂ đo trên khung NGUỒN xen kẽ (đúng preview.tsx: estimateEnhanceNoise-
    // Sigma đọc drawSrc TRƯỚC bob — xem F-194-P4-2; đo trên khung đã bob
    // làm σ̂ thấp giả vì line doubling tương quan các cặp kề dọc).
    const rows: Array<{ i: number; mBf: number; mTap: number; mBf196: number; mBf199: number; mBfF: number; vbW: number; le8Bf: number; le32Bf: number; le8Bf196: number; le32Bf196: number; le8Bf199: number; le32Bf199: number; rRel: number; rRel196: number; rRel199: number; sigmaHat: number; k: number; alpha: number; motion: number | null; motionK: number; alpha199: number; motionK112: number; alpha112: number; mBf112: number; rRel112: number }> = [];
    for (const i of [3, 7, 11]) {
      const truthRgb = truthAt(i);
      const srcNoisyRgb = frameRgb(interNoisyYuv, i);
      const bobNoisy = deintBobSim(srcNoisyRgb, w, h, divisor);
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let p = 0; p < w * h; p++) {
        rgba[p * 4] = srcNoisyRgb[p * 3];
        rgba[p * 4 + 1] = srcNoisyRgb[p * 3 + 1];
        rgba[p * 4 + 2] = srcNoisyRgb[p * 3 + 2];
        rgba[p * 4 + 3] = 255;
      }
      const sigmaHat = estimateNoiseSigmaFromRgba(rgba, w, h);
      const k = denoiseAdaptiveK(s, sigmaHat);
      const wf = denoiseWarmupFactor(3, s, sigmaHat);
      const alpha = denoiseBlendAlpha(s) * k * wf;
      // Đợt 198 P2 — α thích nghi theo chuyển động (quyết (a1)-197): ước
      // lượng C5b_box giữa khung này và khung trước (hàm thuần P2 ship)
      // rồi nhân α (α199 = α × m(M)); khung i−1 luôn có (i ≥ 3).
      const rgbaPrev = new Uint8ClampedArray(w * h * 4);
      {
        const prevRgb = frameRgb(interNoisyYuv, i - 1);
        for (let p = 0; p < w * h; p++) {
          rgbaPrev[p * 4] = prevRgb[p * 3];
          rgbaPrev[p * 4 + 1] = prevRgb[p * 3 + 1];
          rgbaPrev[p * 4 + 2] = prevRgb[p * 3 + 2];
          rgbaPrev[p * 4 + 3] = 255;
        }
      }
      const motion = motionEstimateFromBandLuma(motionBandLumaFromRgba(rgba, w, h), motionBandLumaFromRgba(rgbaPrev, w, h), w);
      const motionK = motion === null ? 1 : denoiseMotionMultiplier(motion);
      const alpha199 = alpha * motionK;
      // Đợt 202 (quyết (a1)-201): cap ship nay là 1,05 (P2-202 hạ
      // DENOISE_MOTION_MULTIPLIER_MAX 1,12 → 1,05). Đường đối chiếu cap
      // 1,12 cũ: tính m thô từ neo P2 rồi kẹp [1,0; 1,12] (hàm thuần
      // motionMultiplierCap112, không đọc code ship đã đổi).
      const motionK112 = motion === null ? 1 : motionMultiplierCap112(motion);
      const alpha112 = alpha * motionK112;
      const prevBf = denoisePreviewComposite(bobNoisy, w, h, s, alpha);
      const tapNoisy = tapShiftVerticalSim(bobNoisy, w, h, 0.5);
      const prevTap = denoisePreviewComposite(tapNoisy, w, h, s, alpha);
      // Preview 196 thật (P2-196): blend dọc w(σ̂) sau bob rồi mới denoise.
      const vbW = deintVerticalBlendWeight(sigmaHat);
      const prevBf196 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha, vbW);
      // Preview 199 thật (pipeline α thích nghi P2-198): cùng pipeline 196 nhưng α thích nghi.
      const prevBf199 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha199, vbW);
      const prevBf112 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha112, vbW);
      // Phản thực: w=0,75 cưỡng bức mọi frame — kiểm ngưỡng σ̂≥8 có phải
      // nút thắt không (f3 σ̂ 7,98 sát ngưỡng; xem F-196-P4-2).
      const prevBfF = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha, 0.75);
      const mBf = compareFrames(truthRgb, prevBf, w, h);
      const mTap = compareFrames(truthRgb, prevTap, w, h);
      const mBf196 = compareFrames(truthRgb, prevBf196, w, h);
      const mBf199 = compareFrames(truthRgb, prevBf199, w, h);
      const mBf112 = compareFrames(truthRgb, prevBf112, w, h);
      const mBfF = compareFrames(truthRgb, prevBfF, w, h);
      const rTruth = combingRLuma(truthRgb, w, h);
      const rBf = combingRLuma(prevBf, w, h);
      const rBf196 = combingRLuma(prevBf196, w, h);
      const rBf199 = combingRLuma(prevBf199, w, h);
      const rBf112 = combingRLuma(prevBf112, w, h);
      rows.push({ i, mBf: mBf.mad, mTap: mTap.mad, mBf196: mBf196.mad, mBf199: mBf199.mad, mBfF: mBfF.mad, vbW, le8Bf: mBf.le8 * 100, le32Bf: mBf.le32 * 100, le8Bf196: mBf196.le8 * 100, le32Bf196: mBf196.le32 * 100, le8Bf199: mBf199.le8 * 100, le32Bf199: mBf199.le32 * 100, rRel: Math.abs(rBf - rTruth) / rTruth, rRel196: Math.abs(rBf196 - rTruth) / rTruth, rRel199: Math.abs(rBf199 - rTruth) / rTruth, sigmaHat, k, alpha, motion, motionK, alpha199, motionK112, alpha112, mBf112: mBf112.mad, rRel112: Math.abs(rBf112 - rTruth) / rTruth });
    }
    const madBfAvg = rows.reduce((a, r) => a + r.mBf, 0) / rows.length;
    const madTapAvg = rows.reduce((a, r) => a + r.mTap, 0) / rows.length;
    const le8BfAvg = rows.reduce((a, r) => a + r.le8Bf, 0) / rows.length;
    const le32BfAvg = rows.reduce((a, r) => a + r.le32Bf, 0) / rows.length;
    const rRelWorst = Math.max(...rows.map((r) => r.rRel));
    const madBf196Avg = rows.reduce((a, r) => a + r.mBf196, 0) / rows.length;
    const le8Bf196Avg = rows.reduce((a, r) => a + r.le8Bf196, 0) / rows.length;
    const le32Bf196Avg = rows.reduce((a, r) => a + r.le32Bf196, 0) / rows.length;
    const rRel196Worst = Math.max(...rows.map((r) => r.rRel196));
    const tierBf196Avg = madBf196Avg <= 2 && le8Bf196Avg >= 99 ? "KHỚP" : madBf196Avg <= 20 && le32Bf196Avg >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    // Đường 199 (verdict): cùng pipeline 196 nhưng α thích nghi.
    const madBf199Avg = rows.reduce((a, r) => a + r.mBf199, 0) / rows.length;
    const le8Bf199Avg = rows.reduce((a, r) => a + r.le8Bf199, 0) / rows.length;
    const le32Bf199Avg = rows.reduce((a, r) => a + r.le32Bf199, 0) / rows.length;
    const rRel199Worst = Math.max(...rows.map((r) => r.rRel199));
    const tierBf199Avg = madBf199Avg <= 2 && le8Bf199Avg >= 99 ? "KHỚP" : madBf199Avg <= 20 && le32Bf199Avg >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    record({
      id: "N5b-deint-bob-first",
      name: `deint bob-first 199 s=0.5 (α thích nghi P2-198) — bob-nearest + blend dọc w(σ̂) rồi denoise α×m(M) vs render yadif→${hq}, 3 frame có nhiễu σ=15`,
      verdict: (tierBf199Avg === "KHỚP" || tierBf199Avg === "XẤP XỈ") && madBf199Avg < madTapAvg && rRel199Worst <= 0.15 ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierBf199Avg,
      numbers: {
        MAD_bobfirst199_avg: madBf199Avg, MAD_tap_avg: madTapAvg, MAD_bobfirst199_minus_tap_avg: madBf199Avg - madTapAvg,
        MAD_bobfirst199_f3: rows[0].mBf199, MAD_tap_f3: rows[0].mTap,
        MAD_bobfirst199_f7: rows[1].mBf199, MAD_tap_f7: rows[1].mTap,
        MAD_bobfirst199_f11: rows[2].mBf199, MAD_tap_f11: rows[2].mTap,
        MAD_bobfirst196_avg: madBf196Avg, MAD_bobfirst196_minus_tap_avg: madBf196Avg - madTapAvg,
        MAD_bobfirst196_f3: rows[0].mBf196, MAD_bobfirst196_f7: rows[1].mBf196, MAD_bobfirst196_f11: rows[2].mBf196,
        MAD_bobfirst_old_avg: madBfAvg, MAD_bobfirst_old_minus_tap_avg: madBfAvg - madTapAvg,
        MAD_bobfirst196_forced075_avg: rows.reduce((a, r) => a + r.mBfF, 0) / rows.length, MAD_bobfirst196_forced075_f3: rows[0].mBfF, MAD_bobfirst196_forced075_f7: rows[1].mBfF, MAD_bobfirst196_forced075_f11: rows[2].mBfF,
        le8_bobfirst199_avg_pct: le8Bf199Avg, le32_bobfirst199_avg_pct: le32Bf199Avg, R_rel_diff_worst199: rRel199Worst, tier_bobfirst196: tierBf196Avg, tier_bobfirst199: tierBf199Avg,
        le8_bobfirst196_avg_pct: le8Bf196Avg, le32_bobfirst196_avg_pct: le32Bf196Avg, R_rel_diff_worst196: rRel196Worst,
        le8_bobfirst_old_avg_pct: le8BfAvg, le32_bobfirst_old_avg_pct: le32BfAvg, R_rel_diff_worst_old: rRelWorst,
        vertical_blend_w_f3: rows[0].vbW, vertical_blend_w_f7: rows[1].vbW, vertical_blend_w_f11: rows[2].vbW,
        sigma_hat_f3: rows[0].sigmaHat, sigma_hat_f7: rows[1].sigmaHat, sigma_hat_f11: rows[2].sigmaHat,
        sigma_hat_src_avg: rows.reduce((a, r) => a + r.sigmaHat, 0) / rows.length,
        adaptive_k_avg: rows.reduce((a, r) => a + r.k, 0) / rows.length,
        alpha_avg: rows.reduce((a, r) => a + r.alpha, 0) / rows.length,
        motion_estimate_f3: rows[0].motion ?? -1, motion_estimate_f7: rows[1].motion ?? -1, motion_estimate_f11: rows[2].motion ?? -1,
        motion_multiplier_f3: rows[0].motionK, motion_multiplier_f7: rows[1].motionK, motion_multiplier_f11: rows[2].motionK,
        alpha199_f3: rows[0].alpha199, alpha199_f7: rows[1].alpha199, alpha199_f11: rows[2].alpha199,
        alpha199_avg: rows.reduce((a, r) => a + r.alpha199, 0) / rows.length,
        MAD_bobfirst112_avg: rows.reduce((a, r) => a + r.mBf112, 0) / rows.length, MAD_bobfirst112_f3: rows[0].mBf112, MAD_bobfirst112_f7: rows[1].mBf112, MAD_bobfirst112_f11: rows[2].mBf112,
        R_rel_diff_worst112: Math.max(...rows.map((r) => r.rRel112)),
        motion_multiplier112_f3: rows[0].motionK112, motion_multiplier112_f7: rows[1].motionK112, motion_multiplier112_f11: rows[2].motionK112,
        alpha112_avg: rows.reduce((a, r) => a + r.alpha112, 0) / rows.length,
      },
      notes: `Preview 199 thật (pipeline α thích nghi P2-198): bob-nearest → blend dọc (1−w)·bob + w·blurV(bob), w = deintVerticalBlendWeight(σ̂) → denoise α199 = α × m(M), M = motionEstimateFromBandLuma (C5b_box, khung này − khung trước) + denoiseMotionMultiplier (neo N5b 7,194 → 1,0; N10 13,803 → 1,08; kẹp [1,0; 1,05] (đợt 202: cap 1,05 theo quyết (a1)-201; đường đối chiếu cap 1,12 cũ xem MAD_bobfirst112_*/R_rel_diff_worst112)). Đường 196 (α cố định) giữ làm đối chiếu hồi quy (MAD_bobfirst196_*). Fixture có nhiễu σ=15 trên nền testsrc2 (3 frame xen kẽ idx 3/7/11); σ̂ đo trên khung nguồn xen kẽ bằng estimator P2 (F-194-P4-2); M đo trên cùng khung nguồn xen kẽ (khung i − khung i−1). Tiêu chí: tier KHỚP/XẤP XỈ (trung bình 3 frame, preview 199) + MAD preview-199 < MAD tap trung bình + |ΔR|/R ≤ 15% ở mọi frame. Đối chiếu số sim P2-198 §5 (C5b_box: N5b 6,810/0,109). Đợt 202: cap ship 1,05 (quyết (a1)-201); MAD_bobfirst112_*/R_rel_diff_worst112 là đường đối chiếu cap 1,12 cũ.`,
    });
  }
  // N5c — bob LUÂN PHIÊN mode 1 @60fps (P2-194: MediaItem.fps +
  // deintBobFieldForConsumedTime/ForOutputFrame): preview luân phiên
  // top/bottom theo frame output vs truth yadif mode=1 (60fps); đối
  // chiếu top-only (hành vi cũ). Field lấy bằng ĐÚNG hàm P2 ship,
  // không tự tính parity.
  {
    const yadif1 = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePreChain({deinterlace:{mode:1}})`).replace(/^,/, "");
    const truth60 = (() => {
      const out = path.join(TMP, "deint-truth60.rgb");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interYuv, "-vf", `${yadif1},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif mode=1 60fps");
      const all = fs.readFileSync(out);
      return { f14: Buffer.from(all.subarray(14 * w * h * 3, 15 * w * h * 3)), f15: Buffer.from(all.subarray(15 * w * h * 3, 16 * w * h * 3)), nFrames: all.length / (w * h * 3) };
    })();
    const src7 = frameRgb(interYuv, idx);
    const field14 = deintBobFieldForOutputFrame(14, 60, 30);
    const field15 = deintBobFieldForOutputFrame(15, 60, 30);
    const alt14 = deintBobFieldSim(src7, w, h, divisor, field14);
    const alt15 = deintBobFieldSim(src7, w, h, divisor, field15);
    const top14 = deintBobSim(src7, w, h, divisor);
    const top15 = deintBobSim(src7, w, h, divisor);
    const mAlt14 = compareFrames(truth60.f14, alt14, w, h);
    const mAlt15 = compareFrames(truth60.f15, alt15, w, h);
    const mTop14 = compareFrames(truth60.f14, top14, w, h);
    const mTop15 = compareFrames(truth60.f15, top15, w, h);
    const madAlt = (mAlt14.mad + mAlt15.mad) / 2;
    const madTop = (mTop14.mad + mTop15.mad) / 2;
    const le8Alt = ((mAlt14.le8 + mAlt15.le8) / 2) * 100;
    const le8Top = ((mTop14.le8 + mTop15.le8) / 2) * 100;
    const le32Alt = ((mAlt14.le32 + mAlt15.le32) / 2) * 100;
    const tierAlt = madAlt <= 2 && le8Alt >= 99 ? "KHỚP" : madAlt <= 20 && le32Alt >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    record({
      id: "N5c-deint-bob-alternating",
      name: `deint bob luân phiên mode 1 @60fps (P2-194) — field theo deintBobFieldForOutputFrame vs render ${yadif1}, frame nguồn 8 → output 14/15`,
      verdict: (tierAlt === "KHỚP" || tierAlt === "XẤP XỈ") && madAlt < madTop ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierAlt,
      numbers: {
        MAD_alternating_avg: madAlt, MAD_toponly_avg: madTop, MAD_alternating_minus_toponly: madAlt - madTop,
        MAD_alt_f14_top: mAlt14.mad, MAD_alt_f15_bottom: mAlt15.mad,
        le8_alternating_avg_pct: le8Alt, le8_toponly_avg_pct: le8Top, le32_alternating_avg_pct: le32Alt,
        field_f14: field14, field_f15: field15, truth60_frames: truth60.nFrames,
      },
      notes: `Field lấy bằng đúng hàm P2-194 ship (deintBobFieldForOutputFrame(14/15, 60, 30) = ${field14}/${field15} — luân phiên khi projFps = 2×inputFps; proj 30fps/nguồn 30fps luôn top, khớp đo đợt 193 MAD 0,000). Claim P2-194 (probe-194-p2a): MAD top-only 2,888 → luân phiên 2,297, le8 94% → 95%, vẫn tier XẤP XỈ. Tiêu chí: tier KHỚP/XẤP XỈ + MAD luân phiên < MAD top-only trên cùng fixture.`,
    });
  }
}

