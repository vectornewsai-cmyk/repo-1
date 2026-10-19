/**
 * speed.ts — Mở rộng video-spec với SPEED CONTROL + REVERSE.
 *
 * Thêm vào VideoClip / AudioClip hai field optional:
 * - `speed?: number`   — tốc độ phát, 0.25–4, mặc định 1
 * - `reverse?: boolean` — phát ngược đoạn nguồn, mặc định false
 *
 * NGỮ NGHĨA (khớp với CapCut):
 * - Đoạn nguồn của clip là [in, out) — tính bằng GIÂY của file gốc.
 * - Tốc độ chỉ thay đổi cách phát đoạn nguồn đó, KHÔNG đổi đoạn nguồn:
 *       duration (timeline) = (out - in) / speed
 *   Đây là BẤT BIẾN mà editor phải giữ: đổi speed → cập nhật duration,
 *   trim mép phải → cập nhật out = in + duration * speed.
 * - `reverse` chỉ đảo chiều phát trong đoạn [in, out), không đổi duration.
 * - Audio: đổi tempo nhưng GIỮ NGUYÊN CAO ĐỘ (phase vocoder, giống atempo
 *   của FFmpeg và chế độ mặc định của CapCut).
 * - TextClip không có speed/reverse (không có nguồn thời gian để tăng/giảm tốc).
 *
 * TÍCH HỢP:
 * - Editor (apps/web): SpeedPanel đọc/ghi 2 field này, timeline tự phản ánh
 *   vì nó render theo clip.duration.
 * - Render (server/render): module speed.js biến 2 field này thành filter
 *   FFmpeg (setpts / atempo-chain / reverse / areverse).
 *
 * LƯU Ý IMPORT: package.json của @repo-1/video-spec hiện chỉ export ".".
 * Để import "@repo-1/video-spec/speed", cần thêm một dòng vào exports:
 *     "./speed": "./src/speed.ts"
 * (chờ chủ sở hữu package duyệt — tạm thời import bằng đường dẫn tương đối).
 */

import type { AudioClip, Clip, VideoClip } from "./index";

/** Tốc độ tối thiểu / tối đa cho phép. */
export const SPEED_MIN = 0.25;
export const SPEED_MAX = 4;
/** Tốc độ mặc định khi field speed vắng mặt. */
export const DEFAULT_SPEED = 1;
/** Sai số khi so sánh duration với (out - in) / speed. */
export const SPEED_EPS = 1e-6;
/** Các preset hiển thị trên UI (khớp CapCut: 0.25 / 0.5 / 1 / 1.5 / 2 / 4). */
export const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2, 4] as const;

/**
 * VideoClip kèm điều khiển tốc độ.
 * Kế thừa mọi field của VideoClip, thêm speed/reverse.
 */
export interface VideoClipWithSpeed extends VideoClip {
  /**
   * Tốc độ phát đoạn nguồn [in, out): 0.25–4, mặc định 1.
   * - 0.5 = slow motion (chậm 2 lần, duration tăng gấp đôi)
   * - 2   = tua nhanh 2 lần (duration còn một nửa)
   */
  speed?: number;
  /** true = phát ngược đoạn nguồn [in, out). Mặc định false. */
  reverse?: boolean;
}

/** AudioClip kèm điều khiển tốc độ (tempo đổi, cao độ giữ nguyên). */
export interface AudioClipWithSpeed extends AudioClip {
  /** Tốc độ phát: 0.25–4, mặc định 1. */
  speed?: number;
  /** true = phát ngược đoạn nguồn. Mặc định false. */
  reverse?: boolean;
}

/** Clip có thể điều khiển tốc độ = clip video hoặc audio. */
export type SpeedableClip = VideoClipWithSpeed | AudioClipWithSpeed;

/** true nếu clip thuộc loại hỗ trợ speed/reverse (video hoặc audio). */
export function isSpeedable(clip: Clip): clip is SpeedableClip {
  return clip.kind === "video" || clip.kind === "audio";
}

/** Tốc độ hiệu dụng của clip (mặc định 1 khi field vắng mặt). */
export function clipSpeed(clip: SpeedableClip): number {
  return clip.speed ?? DEFAULT_SPEED;
}

/** true nếu clip được đánh dấu phát ngược. */
export function clipReversed(clip: SpeedableClip): boolean {
  return clip.reverse ?? false;
}

/**
 * Thời lượng hiệu dụng trên timeline = (out - in) / speed.
 * BẤT BIẾN: clip.duration phải bằng giá trị này (sai số SPEED_EPS).
 */
export function effectiveDuration(clip: SpeedableClip): number {
  return (clip.out - clip.in) / clipSpeed(clip);
}

/**
 * true nếu bất biến duration được giữ: |duration - (out-in)/speed| <= EPS.
 * Editor dùng hàm này để phát hiện spec bị sửa tay sai.
 */
export function isDurationConsistent(clip: SpeedableClip, eps = SPEED_EPS): boolean {
  return Math.abs(clip.duration - effectiveDuration(clip)) <= eps;
}

/**
 * Tính duration mới khi đổi speed (giữ nguyên đoạn nguồn [in, out)).
 * Dùng khi user kéo slider / bấm preset trên UI.
 */
export function durationForSpeed(clip: SpeedableClip, speed: number): number {
  const s = clampSpeed(speed);
  return (clip.out - clip.in) / s;
}

/**
 * Tính out mới khi trim mép phải đổi duration (giữ nguyên in và speed).
 * Công thức: out = in + duration * speed.
 */
export function outForDuration(clip: SpeedableClip, duration: number): number {
  return clip.in + duration * clipSpeed(clip);
}

/** Ép speed về khoảng [SPEED_MIN, SPEED_MAX]. */
export function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return DEFAULT_SPEED;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, speed));
}

/**
 * Tách speed thành các factor mà mỗi factor nằm trong [0.5, 2.0]
 * (giới hạn của MỘT lần gọi atempo trong FFmpeg).
 * Ví dụ: 4 → [2, 2]; 0.25 → [0.5, 0.5]; 3 → [2, 1.5]; 1.5 → [1.5].
 * Render worker chain các atempo này liên tiếp — đã kiểm chứng bằng video thật.
 */
export function atempoFactors(speed: number): number[] {
  const s = clampSpeed(speed);
  if (s === 1) return [];
  const factors: number[] = [];
  let rest = s;
  while (rest > 2) {
    factors.push(2);
    rest /= 2;
  }
  while (rest < 0.5) {
    factors.push(0.5);
    rest /= 0.5;
  }
  // Làm tròn để tránh 1.4999999 do chia số thực
  factors.push(Math.round(rest * 1e6) / 1e6);
  return factors;
}

/**
 * Validate 2 field speed/reverse của một clip.
 * Trả về danh sách lỗi (mảng rỗng = hợp lệ).
 */
export function validateSpeedFields(clip: SpeedableClip): string[] {
  const errors: string[] = [];
  const where = `clip "${clip.id}"`;
  if (clip.speed !== undefined) {
    if (typeof clip.speed !== "number" || !Number.isFinite(clip.speed)) {
      errors.push(`[${where}] speed phải là số, nhận được: ${clip.speed}`);
    } else if (clip.speed < SPEED_MIN || clip.speed > SPEED_MAX) {
      errors.push(
        `[${where}] speed phải trong khoảng ${SPEED_MIN}–${SPEED_MAX}, nhận được: ${clip.speed}`,
      );
    }
  }
  if (clip.reverse !== undefined && typeof clip.reverse !== "boolean") {
    errors.push(`[${where}] reverse phải là boolean, nhận được: ${clip.reverse}`);
  }
  if (!isDurationConsistent(clip)) {
    errors.push(
      `[${where}] duration (${clip.duration}s) không khớp (out - in) / speed = ` +
        `(${(clip.out - clip.in).toFixed(3)} / ${clipSpeed(clip)} = ` +
        `${effectiveDuration(clip).toFixed(3)}s) — đổi speed phải cập nhật duration`,
    );
  }
  return errors;
}
