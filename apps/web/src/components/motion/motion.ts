/**
 * motion.ts — logic thuần cho panel slow-mo / nội suy frame / motion blur
 * (Phase 9 đợt 8, luồng S5-UI).
 *
 * SHAPE DÙNG CHUNG VỚI S1 (packages/video-spec/src/motion.ts, đã import
 * type + hằng số từ "@repo-1/video-spec" như mẫu EnhancePanel):
 *
 *   clip.motion = {
 *     interpolation?: "none" | "minterpolate",
 *     targetFps?: number,              // 1..120, BẮT BUỘC khi minterpolate
 *     miMode?: "mci" | "blend",        // "dup" bị S1 loại khỏi spec
 *     motionBlur?: { frames?: number, weights?: number[] },  // frames 2..8
 *   }
 *
 * LUẬT VALIDATE CỦA S1 MÀ UI PHẢI TÔN TRỌNG (validateMotion throw nếu vi
 * phạm — mọi hàm patch dưới đây đều sinh ra motion hợp lệ):
 * - interpolation "none" (hoặc vắng) mà kèm targetFps/miMode là LỖI →
 *   khi tắt nội suy, UI PHẢI gỡ cả hai key này, không chỉ đặt "none".
 * - interpolation "minterpolate" bắt buộc có targetFps trong [1, 120].
 * - motionBlur độc lập với interpolation: chỉ có blur, không nội suy vẫn
 *   hợp lệ (nhưng cũng không được kèm targetFps/miMode).
 * - weights đợt này luôn chia đều (1/frames mỗi frame); chưa có UI chỉnh
 *   từng trọng số — xem MOTION_UI_LIMITS.md.
 *
 * ĐỢT 9 M3: đã có UI chỉnh weights từng frame (slider 1..100%, chuẩn hoá
 * tổng = 1) và UI chọn miMode (mci/blend). Xem thêm phần cảnh báo cuối file.
 *
 * Mọi hàm dưới đây đều thuần (không DOM, không store) để test được bằng
 * node trực tiếp như mẫu nestUtils.test.ts.
 */
import {
  MOTION_BLUR_DEFAULT_FRAMES,
  MOTION_BLUR_FRAMES_MAX,
  MOTION_BLUR_FRAMES_MIN,
  MOTION_DEFAULT_MI_MODE,
  MOTION_MI_MODES,
  type ClipMotion,
  type MotionInterpolation,
  type MotionMiMode,
} from "@repo-1/video-spec";

export type {
  ClipMotion,
  MotionInterpolation,
  MotionMiMode,
};
export {
  MOTION_BLUR_DEFAULT_FRAMES,
  MOTION_BLUR_FRAMES_MAX,
  MOTION_BLUR_FRAMES_MIN,
  MOTION_DEFAULT_MI_MODE,
  MOTION_MI_MODES,
};

/** FPS đích cho select UI — tập con hợp lệ của [1, 120] theo S1. */
export const MOTION_TARGET_FPS_OPTIONS = [24, 30, 60] as const;
export type MotionTargetFps = (typeof MOTION_TARGET_FPS_OPTIONS)[number];
export const MOTION_DEFAULT_TARGET_FPS: MotionTargetFps = 30;

/** Trọng số đều nhau cho `frames` frame (tổng = 1). */
export function equalWeights(frames: number): number[] {
  const n = Math.round(frames);
  if (n <= 0) return [];
  return Array.from({ length: n }, () => 1 / n);
}

function clampFrames(frames: number): number {
  if (!Number.isFinite(frames)) return MOTION_BLUR_DEFAULT_FRAMES;
  return Math.min(
    MOTION_BLUR_FRAMES_MAX,
    Math.max(MOTION_BLUR_FRAMES_MIN, Math.round(frames)),
  );
}

function clampTargetFps(fps: number): MotionTargetFps {
  if (!Number.isFinite(fps)) return MOTION_DEFAULT_TARGET_FPS;
  const rounded = Math.round(fps);
  if ((MOTION_TARGET_FPS_OPTIONS as readonly number[]).includes(rounded)) {
    return rounded as MotionTargetFps;
  }
  return MOTION_DEFAULT_TARGET_FPS;
}

function normalizeBlur(
  blur: ClipMotion["motionBlur"],
): ClipMotion["motionBlur"] {
  if (!blur) return undefined;
  const frames = clampFrames(
    blur.frames ?? blur.weights?.length ?? MOTION_BLUR_DEFAULT_FRAMES,
  );
  // Weights chỉ hợp lệ khi đủ dài và tổng > 0; ngược lại chia đều lại để
  // render không nhận mảng lệch (quy ước đợt này: weights luôn đều).
  const w = blur.weights;
  const sum = Array.isArray(w) ? w.reduce((a, b) => a + b, 0) : 0;
  if (!Array.isArray(w) || w.length !== frames || !(sum > 0)) {
    return { frames, weights: equalWeights(frames) };
  }
  return { frames, weights: [...w] };
}

/**
 * Chuẩn hoá motion đọc từ clip về dạng UI dùng, đồng thời SỬA dữ liệu
 * lệch thành hợp lệ theo S1: interpolation "none" thì gỡ targetFps/miMode,
 * miMode "dup" (bị loại) về "mci", targetFps ngoài [1, 120] về 30.
 * Trả về `undefined` khi clip chưa có motion (panel hiển thị trạng thái tắt).
 */
export function resolveMotion(
  raw: ClipMotion | undefined,
): ClipMotion | undefined {
  if (!raw) return undefined;
  const interpolation =
    raw.interpolation === "minterpolate" ? "minterpolate" : "none";
  const motionBlur = normalizeBlur(raw.motionBlur);
  if (interpolation === "none") {
    // S1: kèm targetFps/miMode khi interpolation none là lỗi validate.
    return { interpolation: "none", ...(motionBlur ? { motionBlur } : {}) };
  }
  return {
    interpolation: "minterpolate",
    targetFps:
      typeof raw.targetFps === "number" &&
      raw.targetFps >= 1 &&
      raw.targetFps <= 120
        ? Math.round(raw.targetFps)
        : MOTION_DEFAULT_TARGET_FPS,
    miMode:
      raw.miMode === "mci" || raw.miMode === "blend"
        ? raw.miMode
        : MOTION_DEFAULT_MI_MODE,
    ...(motionBlur ? { motionBlur } : {}),
  };
}

/** UI state: select targetFps chỉ enable khi nội suy đang bật. */
export function isTargetFpsDisabled(
  motion: ClipMotion | undefined,
): boolean {
  return (motion?.interpolation ?? "none") === "none";
}

/** Bật/tắt nội suy. Tắt nội suy nhưng còn blur thì giữ motion lại. */
export function withInterpolation(
  motion: ClipMotion | undefined,
  value: MotionInterpolation,
): ClipMotion | undefined {
  if (value === "none") {
    const base = resolveMotion(motion);
    if (!base?.motionBlur) return undefined;
    // Chỉ giữ blur — KHÔNG kèm targetFps/miMode (S1 cấm khi none).
    return { interpolation: "none", motionBlur: base.motionBlur };
  }
  const base = resolveMotion(motion);
  return {
    interpolation: "minterpolate",
    targetFps:
      base?.interpolation === "minterpolate" && typeof base.targetFps === "number"
        ? base.targetFps
        : MOTION_DEFAULT_TARGET_FPS,
    miMode: base?.miMode ?? MOTION_DEFAULT_MI_MODE,
    ...(base?.motionBlur ? { motionBlur: base.motionBlur } : {}),
  };
}

/** Đổi FPS đích — chỉ có nghĩa khi nội suy bật; gọi khi disable là no-op. */
export function withTargetFps(
  motion: ClipMotion | undefined,
  fps: MotionTargetFps,
): ClipMotion | undefined {
  const base = resolveMotion(motion);
  if (!base || base.interpolation === "none") return base;
  return { ...base, targetFps: clampTargetFps(fps) };
}

/**
 * Bật/tắt motion blur. Tắt blur và không còn nội suy thì gỡ cả motion.
 * Bật blur khi chưa có motion thì tạo motion chỉ có blur (interpolation
 * "none", KHÔNG kèm targetFps/miMode — S1 cho phép blur độc lập).
 */
export function withMotionBlur(
  motion: ClipMotion | undefined,
  on: boolean,
  frames = MOTION_BLUR_DEFAULT_FRAMES,
): ClipMotion | undefined {
  const base = resolveMotion(motion);
  if (!on) {
    if (!base) return undefined;
    const { motionBlur: _drop, ...rest } = base;
    if (rest.interpolation === "none") return undefined;
    return rest;
  }
  const f = clampFrames(frames);
  if (base) return { ...base, motionBlur: { frames: f, weights: equalWeights(f) } };
  return {
    interpolation: "none",
    motionBlur: { frames: f, weights: equalWeights(f) },
  };
}

/** Đổi số frame gộp của blur (weights chia đều lại theo frames mới). */
export function withBlurFrames(
  motion: ClipMotion | undefined,
  frames: number,
): ClipMotion | undefined {
  const base = resolveMotion(motion);
  if (!base?.motionBlur) return base;
  const f = clampFrames(frames);
  return { ...base, motionBlur: { frames: f, weights: equalWeights(f) } };
}

/**
 * Chuẩn hoá một mảng trọng số về tổng = 1 (đợt 9 M3 — nền tảng cho UI
 * chỉnh weights từng frame).
 *
 * - Giá trị không hữu hạn hoặc âm → 0 (không throw, để UI không vỡ khi
 *   dữ liệu cũ lệch).
 * - Tổng <= 0 (toàn 0 / toàn âm) → chia đều lại, tránh chia cho 0.
 * - Độ dài giữ nguyên; trọng số 0 được GIỮ NGUYÊN 0 ở đây (spec S1 chỉ
 *   yêu cầu tổng > 0). Lưu ý: render S2 yêu cầu mỗi trọng số > 0 nên UI
 *   (slider tối thiểu 1%) không bao giờ sinh ra 0 — đừng dùng hàm này
 *   để "sửa" mảng 0 thành hợp lệ cho render, nó chỉ chuẩn hoá tổng.
 */
export function normalizeWeights(weights: readonly number[]): number[] {
  const clean = weights.map((w) =>
    typeof w === "number" && Number.isFinite(w) && w > 0 ? w : 0,
  );
  const sum = clean.reduce((a, b) => a + b, 0);
  if (clean.length === 0) return [];
  if (!(sum > 0)) return equalWeights(clean.length);
  return clean.map((w) => w / sum);
}

/**
 * Đổi trọng số của một frame blur rồi chuẩn hoá lại tổng = 1 (đợt 9 M3).
 * `value` là trọng số thô trong [0, 1] (UI truyền slider % / 100).
 * Không có blur → trả nguyên base; index ngoài mảng → trả nguyên base.
 * Đổi frames sau đó (withBlurFrames) sẽ chia đều lại và MẤT weights tuỳ
 * chỉnh — panel ghi rõ điều này bằng nút "Chia đều lại".
 */
export function withBlurWeight(
  motion: ClipMotion | undefined,
  index: number,
  value: number,
): ClipMotion | undefined {
  const base = resolveMotion(motion);
  if (!base?.motionBlur) return base;
  const blur = base.motionBlur;
  const frames = blur.frames ?? blur.weights?.length ?? MOTION_BLUR_DEFAULT_FRAMES;
  const current =
    blur.weights && blur.weights.length === frames
      ? [...blur.weights]
      : equalWeights(frames);
  if (!Number.isInteger(index) || index < 0 || index >= current.length) {
    return base;
  }
  const v = typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
  current[index] = v;
  return {
    ...base,
    motionBlur: { frames, weights: normalizeWeights(current) },
  };
}

/** Đổi miMode — chỉ có nghĩa khi nội suy bật; gọi khi none là no-op. */
export function withMiMode(
  motion: ClipMotion | undefined,
  mode: MotionMiMode,
): ClipMotion | undefined {
  const base = resolveMotion(motion);
  if (!base || base.interpolation === "none") return base;
  return {
    ...base,
    miMode: mode === "mci" || mode === "blend" ? mode : MOTION_DEFAULT_MI_MODE,
  };
}

/* ------------------------------------------------------------------ */
/* Cảnh báo (đợt 9 M3) — logic thuần, panel chỉ hiển thị kết quả.     */
/* Quy tắc fail-fast lấy đúng từ server/render/src/motion.js          */
/* validateMotion: CHỈ combo "targetFps != projectFps + transition"    */
/* mới lỗi; từng điều kiện riêng lẻ KHÔNG lỗi (xem MOTION_UI_LIMITS). */
/* ------------------------------------------------------------------ */

/** Clip có transition thật không (type khác "none" ở đầu hoặc cuối). */
export function hasClipTransition(
  transitionIn: { type?: string } | undefined,
  transitionOut: { type?: string } | undefined,
): boolean {
  return (
    (transitionIn !== undefined && transitionIn.type !== undefined && transitionIn.type !== "none") ||
    (transitionOut !== undefined && transitionOut.type !== undefined && transitionOut.type !== "none")
  );
}

/**
 * Nội suy đang bật mà targetFps khác fps project không. targetFps vắng
 * → render mặc định dùng project fps nên KHÔNG tính là lệch.
 */
export function isFpsMismatch(
  motion: ClipMotion | undefined,
  projectFps: number | undefined,
): boolean {
  if (motion?.interpolation !== "minterpolate") return false;
  const target = motion.targetFps;
  if (typeof target !== "number" || !Number.isFinite(target)) return false;
  if (typeof projectFps !== "number" || !Number.isFinite(projectFps)) return false;
  return target !== projectFps;
}

/**
 * Combo BỊ RENDER CHẶN (fail-fast): nội suy + transition + targetFps
 * khác project fps (xfade yêu cầu 2 input cùng fps).
 */
export function isTransitionFpsBlocked(
  motion: ClipMotion | undefined,
  hasTransition: boolean,
  projectFps: number | undefined,
): boolean {
  return hasTransition && isFpsMismatch(motion, projectFps);
}

/** Nội suy + chống rung cùng lúc.
 * LƯU Ý đợt 9 tích hợp: hàm giữ lại vì test M3 + tương thích, nhưng panel
 * KHÔNG dùng nó để cảnh báo chặn nữa — M4 đã render thật chứng minh
 * stabilize + interpolation ĐƯỢC PHÉP ở nhánh thường. Tổ hợp bị chặn thật
 * là stabilize + speedKeyframes (xem validate.js). */
export function isStabilizeInterpConflict(
  motion: ClipMotion | undefined,
  hasStabilize: boolean,
): boolean {
  return motion?.interpolation === "minterpolate" && hasStabilize;
}

/**
 * Ước lượng số frame đầu ra của nội suy: duration × targetFps.
 * CHỈ LÀ ƯỚC LƯỢNG khối lượng — không phải thời gian render, không đo
 * benchmark nào (phần cứng/codec/mode mci-vs-blend đều ảnh hưởng mà hàm
 * này không mô hình hoá). Trả 0 khi đầu vào không hợp lệ.
 */
export function estimateInterpOutputFrames(
  durationSec: number,
  targetFps: number | undefined,
): number {
  if (
    typeof durationSec !== "number" ||
    !Number.isFinite(durationSec) ||
    durationSec <= 0 ||
    typeof targetFps !== "number" ||
    !Number.isFinite(targetFps) ||
    targetFps <= 0
  ) {
    return 0;
  }
  return Math.round(durationSec * targetFps);
}

/**
 * Gói ước lượng chi phí nội suy cho panel: số frame đầu ra + tỉ lệ so
 * với fps project (để user áng chừng "nặng gấp mấy lần render thường").
 * Trả null khi không ước lượng được (nội suy tắt hoặc thiếu số liệu).
 */
export function estimateInterpCost(
  motion: ClipMotion | undefined,
  durationSec: number,
  projectFps: number | undefined,
): { outputFrames: number; ratioToProjectFps: number | null } | null {
  if (motion?.interpolation !== "minterpolate") return null;
  const outputFrames = estimateInterpOutputFrames(durationSec, motion.targetFps);
  if (outputFrames <= 0) return null;
  const ratio =
    typeof projectFps === "number" && Number.isFinite(projectFps) && projectFps > 0
      ? motion.targetFps !== undefined
        ? motion.targetFps / projectFps
        : null
      : null;
  return { outputFrames, ratioToProjectFps: ratio };
}
