// parityHarness203-deint-motion.ts — Harness parity đợt 203 P4: mảng deint motion.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: sectionDeintMotion (N10 + N5d — nửa sau của sectionDeint cũ).
import * as fs from "node:fs";
import * as path from "node:path";
import {
  deintVerticalBlendWeight,
  denoiseAdaptiveK,
  denoiseBlendAlpha,
  denoiseMotionMultiplier,
  denoiseWarmupFactor,
  enhancePreviewPlan,
  estimateNoiseSigmaFromRgba,
  motionBandLumaFromRgba,
  motionEstimateFromBandLuma,
} from "./enhancePreview";
import {
  bobFirstPreview196,
  combingRLuma,
  deintBobSim,
  deintFixture,
  tapShiftVerticalSim,
} from "./parityHarness203-deint";
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
} from "./parityHarness203-core";

export function sectionDeintMotion(): void {
  const { w, h, divisor, yadif, frameRgb } = deintFixture();
  // N10 — bob-first vs tap trên FIXTURE CHUYỂN ĐỘNG (quyết (a1)-194,
  // nợ F-194-P4-3): trên fixture testsrc2+nhiễu của P4-194, tap cũ thắng
  // bob-first 0,13 MAD (1,9%) ở cả 3/3 frame — mâu thuẫn P2-193 (bob-first
  // thắng 12/12 ô). P2-195 probe lại trên fixture chuyển động; P4 đo
  // ĐỘC LẬP bằng fixture chuyển động MẠNH HƠN: cửa sổ crop 320×180
  // trượt ngang 3 px/frame trên testsrc2 640×180 (mọi pixel dịch chuyển
  // giữa các field) + nhiễu σ=15, cùng pipeline N5b (bob-nearest →
  // denoise α từ σ̂ trên khung nguồn xen kẽ vs truth yadif→hqdn3d
  // s=0,5; đối chiếu tap +0,5px).
  // Verdict ĐỘC LẬP: tier + bob-first < tap trên fixture này — KHÔNG
  // suy ra từ số của P2-195; số P2-195 chỉ đối chiếu sau (xem LIMITS).
  {
    const motionCleanYuv = path.join(TMP, "deint-motion-clean.yuv");
    ff(["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=640x${h}:rate=30:duration=1`,
      "-vf", "crop=320:180:3*n:0,scale=out_color_matrix=bt709,format=yuv420p", "-f", "rawvideo", "-pix_fmt", "yuv420p", motionCleanYuv], "testsrc2 crop-slide clean");
    const s10 = 0.5;
    const noisyFrames10: Buffer[] = [];
    for (let f = 0; f < 30; f++) {
      const baseF = frameRgb(motionCleanYuv, f);
      const rngF = mulberry32(19100 + f);
      const nb = Buffer.alloc(w * h * 3);
      for (let i = 0; i < nb.length; i++)
        nb[i] = Math.max(0, Math.min(255, Math.round(baseF[i] + 15 * gauss(rngF))));
      noisyFrames10.push(nb);
    }
    const noisyIn10 = path.join(TMP, "deint-motion-noisy.rgb");
    fs.writeFileSync(noisyIn10, Buffer.concat(noisyFrames10));
    const noisyYuv10 = path.join(TMP, "deint-motion-noisy.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyIn10, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", noisyYuv10], "motion noisy rgb->yuv");
    const interNoisyYuv10 = path.join(TMP, "deint-motion-interno.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyYuv10, "-vf", "interlace=scan=tff:lowpass=0",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", interNoisyYuv10], "interlace motion noisy");
    const hq10 = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePostChain({denoise:{strength:${s10}}})`).replace(/^,/, "");
    const truthAll10 = (() => {
      const out = path.join(TMP, "deint-motion-truth.rgb");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interNoisyYuv10, "-vf", `${yadif},${hq10},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif+hqdn3d motion truth");
      return fs.readFileSync(out);
    })();
    const truthAt10 = (i: number): Buffer => Buffer.from(truthAll10.subarray(i * w * h * 3, (i + 1) * w * h * 3));
    const rows10: Array<{ i: number; mBf: number; mTap: number; mBf196: number; mBf199: number; mBfF: number; vbW: number; le8Bf: number; le32Bf: number; le8Bf196: number; le32Bf196: number; le8Bf199: number; le32Bf199: number; rRel: number; rRel196: number; rRel199: number; sigmaHat: number; k: number; alpha: number; motion: number | null; motionK: number; alpha199: number; motionK112: number; alpha112: number; mBf112: number; rRel112: number }> = [];
    for (const i of [3, 7, 11]) {
      const truthRgb = truthAt10(i);
      const srcNoisyRgb = frameRgb(interNoisyYuv10, i);
      const bobNoisy = deintBobSim(srcNoisyRgb, w, h, divisor);
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let p = 0; p < w * h; p++) {
        rgba[p * 4] = srcNoisyRgb[p * 3];
        rgba[p * 4 + 1] = srcNoisyRgb[p * 3 + 1];
        rgba[p * 4 + 2] = srcNoisyRgb[p * 3 + 2];
        rgba[p * 4 + 3] = 255;
      }
      const sigmaHat = estimateNoiseSigmaFromRgba(rgba, w, h);
      const k = denoiseAdaptiveK(s10, sigmaHat);
      const wf = denoiseWarmupFactor(3, s10, sigmaHat);
      const alpha = denoiseBlendAlpha(s10) * k * wf;
      // Đợt 198 P2 — α thích nghi theo chuyển động (quyết (a1)-197): ước
      // lượng C5b_box giữa khung này và khung trước (hàm thuần P2 ship)
      // rồi nhân α (α199 = α × m(M)); khung i−1 luôn có (i ≥ 3).
      const rgbaPrev = new Uint8ClampedArray(w * h * 4);
      {
        const prevRgb = frameRgb(interNoisyYuv10, i - 1);
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
      const prevBf = denoisePreviewComposite(bobNoisy, w, h, s10, alpha);
      const tapNoisy = tapShiftVerticalSim(bobNoisy, w, h, 0.5);
      const prevTap = denoisePreviewComposite(tapNoisy, w, h, s10, alpha);
      // Preview 196 thật (P2-196): blend dọc w(σ̂) sau bob rồi mới denoise.
      const vbW = deintVerticalBlendWeight(sigmaHat);
      const prevBf196 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha, vbW);
      // Preview 199 thật (pipeline α thích nghi P2-198): cùng pipeline 196 nhưng α thích nghi.
      const prevBf199 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha199, vbW);
      const prevBf112 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha112, vbW);
      // Phản thực: w=0,75 cưỡng bức mọi frame — kiểm ngưỡng σ̂≥8 có phải
      // nút thắt không (xem F-196-P4-2).
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
      rows10.push({ i, mBf: mBf.mad, mTap: mTap.mad, mBf196: mBf196.mad, mBf199: mBf199.mad, mBfF: mBfF.mad, vbW, le8Bf: mBf.le8 * 100, le32Bf: mBf.le32 * 100, le8Bf196: mBf196.le8 * 100, le32Bf196: mBf196.le32 * 100, le8Bf199: mBf199.le8 * 100, le32Bf199: mBf199.le32 * 100, rRel: Math.abs(rBf - rTruth) / rTruth, rRel196: Math.abs(rBf196 - rTruth) / rTruth, rRel199: Math.abs(rBf199 - rTruth) / rTruth, sigmaHat, k, alpha, motion, motionK, alpha199, motionK112, alpha112, mBf112: mBf112.mad, rRel112: Math.abs(rBf112 - rTruth) / rTruth });
    }
    const madBfAvg10 = rows10.reduce((a, r) => a + r.mBf, 0) / rows10.length;
    const madTapAvg10 = rows10.reduce((a, r) => a + r.mTap, 0) / rows10.length;
    const le8BfAvg10 = rows10.reduce((a, r) => a + r.le8Bf, 0) / rows10.length;
    const le32BfAvg10 = rows10.reduce((a, r) => a + r.le32Bf, 0) / rows10.length;
    const rRelWorst10 = Math.max(...rows10.map((r) => r.rRel));
    const madBf196Avg10 = rows10.reduce((a, r) => a + r.mBf196, 0) / rows10.length;
    const le8Bf196Avg10 = rows10.reduce((a, r) => a + r.le8Bf196, 0) / rows10.length;
    const le32Bf196Avg10 = rows10.reduce((a, r) => a + r.le32Bf196, 0) / rows10.length;
    const rRel196Worst10 = Math.max(...rows10.map((r) => r.rRel196));
    const tierBf196Avg10 = madBf196Avg10 <= 2 && le8Bf196Avg10 >= 99 ? "KHỚP" : madBf196Avg10 <= 20 && le32Bf196Avg10 >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    // Đường 199 (verdict): cùng pipeline 196 nhưng α thích nghi.
    const madBf199Avg10 = rows10.reduce((a, r) => a + r.mBf199, 0) / rows10.length;
    const le8Bf199Avg10 = rows10.reduce((a, r) => a + r.le8Bf199, 0) / rows10.length;
    const le32Bf199Avg10 = rows10.reduce((a, r) => a + r.le32Bf199, 0) / rows10.length;
    const rRel199Worst10 = Math.max(...rows10.map((r) => r.rRel199));
    const tierBf199Avg10 = madBf199Avg10 <= 2 && le8Bf199Avg10 >= 99 ? "KHỚP" : madBf199Avg10 <= 20 && le32Bf199Avg10 >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    record({
      id: "N10-motion-bob-first",
      name: `deint bob-first 199 trên FIXTURE CHUYỂN ĐỘNG (quyết (a1)-197) — testsrc2 crop trượt 3px/frame + nhiễu σ=15, bob-nearest + blend dọc w(σ̂) rồi denoise α×m(M) vs render yadif→${hq10}, 3 frame`,
      verdict: (tierBf199Avg10 === "KHỚP" || tierBf199Avg10 === "XẤP XỈ") && madBf199Avg10 < madTapAvg10 && rRel199Worst10 <= 0.15 ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierBf199Avg10,
      numbers: {
        MAD_bobfirst199_avg: madBf199Avg10, MAD_tap_avg: madTapAvg10, MAD_bobfirst199_minus_tap_avg: madBf199Avg10 - madTapAvg10,
        MAD_bobfirst199_f3: rows10[0].mBf199, MAD_tap_f3: rows10[0].mTap,
        MAD_bobfirst199_f7: rows10[1].mBf199, MAD_tap_f7: rows10[1].mTap,
        MAD_bobfirst199_f11: rows10[2].mBf199, MAD_tap_f11: rows10[2].mTap,
        MAD_bobfirst196_avg: madBf196Avg10, MAD_bobfirst196_minus_tap_avg: madBf196Avg10 - madTapAvg10,
        MAD_bobfirst196_f3: rows10[0].mBf196, MAD_bobfirst196_f7: rows10[1].mBf196, MAD_bobfirst196_f11: rows10[2].mBf196,
        MAD_bobfirst_old_avg: madBfAvg10, MAD_bobfirst_old_minus_tap_avg: madBfAvg10 - madTapAvg10,
        MAD_bobfirst196_forced075_avg: rows10.reduce((a, r) => a + r.mBfF, 0) / rows10.length, MAD_bobfirst196_forced075_f3: rows10[0].mBfF, MAD_bobfirst196_forced075_f7: rows10[1].mBfF, MAD_bobfirst196_forced075_f11: rows10[2].mBfF,
        le8_bobfirst199_avg_pct: le8Bf199Avg10, le32_bobfirst199_avg_pct: le32Bf199Avg10, R_rel_diff_worst199: rRel199Worst10, tier_bobfirst196: tierBf196Avg10, tier_bobfirst199: tierBf199Avg10,
        le8_bobfirst196_avg_pct: le8Bf196Avg10, le32_bobfirst196_avg_pct: le32Bf196Avg10, R_rel_diff_worst196: rRel196Worst10,
        le8_bobfirst_old_avg_pct: le8BfAvg10, le32_bobfirst_old_avg_pct: le32BfAvg10, R_rel_diff_worst_old: rRelWorst10,
        vertical_blend_w_f3: rows10[0].vbW, vertical_blend_w_f7: rows10[1].vbW, vertical_blend_w_f11: rows10[2].vbW,
        sigma_hat_f3: rows10[0].sigmaHat, sigma_hat_f7: rows10[1].sigmaHat, sigma_hat_f11: rows10[2].sigmaHat,
        sigma_hat_src_avg: rows10.reduce((a, r) => a + r.sigmaHat, 0) / rows10.length,
        adaptive_k_avg: rows10.reduce((a, r) => a + r.k, 0) / rows10.length,
        alpha_avg: rows10.reduce((a, r) => a + r.alpha, 0) / rows10.length,
        motion_estimate_f3: rows10[0].motion ?? -1, motion_estimate_f7: rows10[1].motion ?? -1, motion_estimate_f11: rows10[2].motion ?? -1,
        motion_multiplier_f3: rows10[0].motionK, motion_multiplier_f7: rows10[1].motionK, motion_multiplier_f11: rows10[2].motionK,
        alpha199_f3: rows10[0].alpha199, alpha199_f7: rows10[1].alpha199, alpha199_f11: rows10[2].alpha199,
        alpha199_avg: rows10.reduce((a, r) => a + r.alpha199, 0) / rows10.length,
        MAD_bobfirst112_avg: rows10.reduce((a, r) => a + r.mBf112, 0) / rows10.length, MAD_bobfirst112_f3: rows10[0].mBf112, MAD_bobfirst112_f7: rows10[1].mBf112, MAD_bobfirst112_f11: rows10[2].mBf112,
        R_rel_diff_worst112: Math.max(...rows10.map((r) => r.rRel112)),
        motion_multiplier112_f3: rows10[0].motionK112, motion_multiplier112_f7: rows10[1].motionK112, motion_multiplier112_f11: rows10[2].motionK112,
        alpha112_avg: rows10.reduce((a, r) => a + r.alpha112, 0) / rows10.length,
      },
      notes: `Preview 199 thật (pipeline α thích nghi P2-198): bob-nearest → blend dọc w = deintVerticalBlendWeight(σ̂) → denoise α199 = α × m(M), M = motionEstimateFromBandLuma (C5b_box, khung này − khung trước) + denoiseMotionMultiplier (neo N5b 7,194 → 1,0; N10 13,803 → 1,08; kẹp [1,0; 1,05] (đợt 202: cap 1,05 theo quyết (a1)-201; đường đối chiếu cap 1,12 cũ xem MAD_bobfirst112_*/R_rel_diff_worst112)). Đường 196 (α cố định) giữ làm đối chiếu hồi quy (MAD_bobfirst196_* — kỳ vọng 6,240/0,155 CHƯA ĐẠT như đợt 197). Fixture chuyển động: testsrc2 + crop trượt ngang 3 px/frame — mọi pixel dịch chuyển giữa các field, mạnh hơn fixture N5b. Cùng pipeline N5b: σ̂ đo trên khung nguồn xen kẽ (F-194-P4-2), α = a·k·w·m. Tiêu chí: tier KHỚP/XẤP XỈ (trung bình 3 frame, preview 199) + MAD preview-199 < MAD tap trung bình + |ΔR|/R ≤ 15%. Đối chiếu số sim P2-198 §5 (C5b_box: N10 6,126/0,082 ĐẠT, N5b 6,810/0,109 ĐẠT; m N10 1,093/1,091/1,056) — verdict này ĐỘC LẬP với số P2-198; f11 KHÔNG phải outlier (P2-198 §4: f12–f14 tệ hơn) nên GIỮ frame, KHÔNG đổi bar 0,15 (quyết (a1)-197). Đợt 202: cap ship 1,05 (quyết (a1)-201); MAD_bobfirst112_*/R_rel_diff_worst112 là đường đối chiếu cap 1,12 cũ.`,
    });
  }
  // N5d — blend dọc sau bob (P2-196): trọng số + cổng tap theo plan thật.
  // Đợt 198 P2: khóa thêm plan α thích nghi (motionEstimate → multiplier).
  {
    const wNoisy = deintVerticalBlendWeight(8.14);
    const wClean = deintVerticalBlendWeight(2.0);
    const wNull = deintVerticalBlendWeight(null);
    const wEdge = deintVerticalBlendWeight(2.7);
    const wUnder = deintVerticalBlendWeight(2.69);
    const planNoisy = enhancePreviewPlan({ deinterlace: true }, true, false, 1, undefined, 8.14);
    const planClean = enhancePreviewPlan({ deinterlace: true }, true, false, 1, undefined, 2.0);
    const planSmall = enhancePreviewPlan({ deinterlace: true }, true, false, 0.5, undefined, 9);
    const planMotionBase = enhancePreviewPlan({ deinterlace: true, denoise: { strength: 0.5 } }, true, false, 1, 3, 8.14);
    const planMotion = enhancePreviewPlan({ deinterlace: true, denoise: { strength: 0.5 } }, true, false, 1, 3, 8.14, undefined, undefined, 13.803);
    const ok = wNoisy === 0.8 && wClean === 0 && wNull === 0 && wEdge === 0.8 && wUnder === 0 &&
      planNoisy.deintVerticalBlend === 0.8 && planNoisy.deinterlaceTap &&
      planClean.deintVerticalBlend === 0 && planSmall.deintVerticalBlend === 0 && !planSmall.deinterlaceTap &&
      planMotionBase.denoiseMotionMultiplier === 1 && planMotionBase.motionEstimate === null &&
      Math.abs(planMotion.denoiseMotionMultiplier - 1.05) < 1e-12 && planMotion.motionEstimate === 13.803 &&
      Math.abs(planMotion.denoiseBlendAlpha - planMotionBase.denoiseBlendAlpha * 1.05) < 1e-9;
    record({
      id: "N5d-deint-vertical-blend-plan",
      name: "blend dọc sau bob (P2-197): w=0,8 khi σ̂≥2,7, 0 khi sạch; chỉ khi tap áp (drawScaleY≥0,9)",
      verdict: ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { w_sigma_8_14: wNoisy, w_sigma_2: wClean, w_sigma_null: wNull, w_sigma_2_7: wEdge, w_sigma_2_69: wUnder, plan_noisy_blend: planNoisy.deintVerticalBlend, plan_noisy_tap: planNoisy.deinterlaceTap ? 1 : 0, plan_clean_blend: planClean.deintVerticalBlend, plan_small_blend: planSmall.deintVerticalBlend, plan_small_tap: planSmall.deinterlaceTap ? 1 : 0, plan_motion_multiplier_base: planMotionBase.denoiseMotionMultiplier, plan_motion_estimate_base: planMotionBase.motionEstimate ?? -1, plan_motion_multiplier_13803: planMotion.denoiseMotionMultiplier, plan_motion_estimate_13803: planMotion.motionEstimate ?? -1, plan_motion_alpha: planMotion.denoiseBlendAlpha, plan_base_alpha: planMotionBase.denoiseBlendAlpha },
      notes: `Hàm thuần deintVerticalBlendWeight(σ̂) + plan enhancePreviewPlan thật. Ngưỡng σ̂≥2,7 (P2 hiệu chuẩn lại từ 8,0 → 2,7 trong đợt 196 — F-196-P4-2 vách 8,0 ĐÃ SỬA). TRỌNG SỐ ĐỔI 0,75→0,8 trong đợt 197 (P2-197, ENHANCE_PREVIEW_DEINT_VERTICAL_BLEND_W): có số đo — w-sweep probe-197-p2a.json (20:47Z) N10 avg MAD 6,256 (w=0,75) → 6,240 (w=0,8), w=0,85: 6,237; P4-197 đo độc lập bằng harness khớp từng số (N10 6,240; N5b 6,803 ≈ 6,804 đợt 196). Bar N5d cập nhật theo giá trị thiết kế mới 0,8 — giá trị khóa LITERAL trong test + record (đổi lặng lần nữa sẽ FAIL và bắt cập nhật có ý thức). Bước nhảy, không ramp (chưa có số σ̂ 2–3,6 để hiệu chuẩn ramp). Rủi ro còn lại: texture mịn sạch có thể đọc σ̂ tới ~2–3 → dương tính giả, chi phí +0,044 MAD (P2 chấp nhận). Cổng tap: drawScaleY<0,9 → blend 0 dù nhiễu (downscale giấu răng cưa). MỚI đợt 198: plan khóa α thích nghi — motionEstimate 13,803 (neo cao N10) → multiplier đúng 1,05 (đợt 202: cap 1,12 → 1,05 theo quyết (a1)-201; trước đây 1,08), α plan = α gốc × 1,05; không motion → multiplier 1, motionEstimate null.`,
    });
  }
}

