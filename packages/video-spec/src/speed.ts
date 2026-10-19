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

import type { AudioClip, Clip, VideoClip } from "./index.js";

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

// ---------------------------------------------------------------------------
// R1-013: Unified time mapping — dùng chung cho spec/store/preview/render/MCP.
// ---------------------------------------------------------------------------

/**
 * Thời lượng nguồn (giây của file gốc) = out - in.
 * Không phụ thuộc speed/reverse.
 */
export function sourceDurationOf(clip: SpeedableClip): number {
  return clip.out - clip.in;
}

/**
 * Thời lượng trên timeline = (out - in) / speed.
 * Alias rõ nghĩa của effectiveDuration().
 */
export function timelineDurationOf(clip: SpeedableClip): number {
  return effectiveDuration(clip);
}

/**
 * Ánh xạ thời điểm timeline → thời điểm nguồn (giây của file gốc).
 *
 * Đây là HÀM DÙNG CHUNG duy nhất cho mọi nơi cần source-time mapping:
 * store (trim/split), preview (seek), render (đối chiếu), MCP.
 *
 * @param clip clip video/audio (phải thỏa invariant duration)
 * @param timelineT thời điểm trên timeline (giây, thường trong [start, start+duration])
 * @returns thời điểm nguồn trong [in, out]
 *
 * Công thức:
 *   localT = timelineT - clip.start            // 0..duration trên timeline
 *   offset = localT * speed                    // quãng nguồn đã "tiêu thụ"
 *   reverse=false → in + offset
 *   reverse=true  → out - offset               // phát ngược từ cuối đoạn nguồn
 *
 * Ví dụ: clip in=10, out=14, speed=2, duration=2.
 *   sourceTimeAt(clip, start+0.5) = 10 + 0.5*2 = 11 (không reverse)
 *   sourceTimeAt(clip, start+0.5) = 14 - 0.5*2 = 13 (reverse)
 */
export function sourceTimeAt(clip: SpeedableClip, timelineT: number): number {
  const speed = clipSpeed(clip);
  const localT = timelineT - clip.start;
  const offset = localT * speed;
  if (clipReversed(clip)) {
    return clip.out - offset;
  }
  return clip.in + offset;
}

/**
 * Điểm cắt nguồn khi split clip tại thời điểm timeline t.
 * Trả về { leftIn, leftOut, rightIn, rightOut } — cả hai phần đều giữ
 * nguyên speed/reverse, duration mỗi phần = (out - in) / speed.
 *
 * Dùng sourceTimeAt để tính điểm cắt: splitPoint = sourceTimeAt(clip, t).
 * - Phần trái:  [in, splitPoint), duration = (splitPoint - in) / speed
 * - Phần phải: [splitPoint, out), duration = (out - splitPoint) / speed
 *
 * Với reverse, splitPoint vẫn đúng vì sourceTimeAt đã đảo chiều:
 * phần trái (hiển thị trước) vẫn là đoạn nguồn phát trước theo chiều reverse.
 */
export function splitSourceAt(
  clip: SpeedableClip,
  timelineT: number,
): { leftIn: number; leftOut: number; rightIn: number; rightOut: number } {
  const cut = sourceTimeAt(clip, timelineT);
  // Kẹp cut vào [in, out] để tránh sai số float tràn biên
  const clamped = Math.min(clip.out, Math.max(clip.in, cut));
  return {
    leftIn: clip.in,
    leftOut: clamped,
    rightIn: clamped,
    rightOut: clip.out,
  };
}

/**
 * Tính in mới khi trim mép TRÁI tới thời điểm timeline newStart.
 * newIn = sourceTimeAt(clip, newStart) — đúng với mọi speed/reverse.
 */
export function inForTrimLeft(clip: SpeedableClip, newStart: number): number {
  return sourceTimeAt(clip, newStart);
}

/**
 * Tính out mới khi trim mép PHẢI tới thời điểm timeline newEnd.
 * newOut = sourceTimeAt(clip, newEnd) — đúng với mọi speed/reverse.
 */
export function outForTrimRight(clip: SpeedableClip, newEnd: number): number {
  return sourceTimeAt(clip, newEnd);
}

// ---------------------------------------------------------------------------
// R1-014: Trim/split helpers — xử lý đúng speed AND reverse.
// ---------------------------------------------------------------------------

/**
 * Kết quả trim mép trái: { start, duration, in, out } mới.
 *
 * Ngữ nghĩa:
 * - reverse=false: mép trái timeline ↔ đầu nguồn → dịch `in`.
 *   newIn = sourceTimeAt(clip, newStart); out giữ nguyên.
 * - reverse=true: mép trái timeline ↔ cuối nguồn (phát ngược từ out) →
 *   mở rộng/thu hẹp `out`. newOut = out - shift*speed; in giữ nguyên.
 *
 * @param clip clip hiện tại (thỏa invariant)
 * @param newStart thời điểm timeline mới cho mép trái (<= clip.start + duration - 0.2)
 * @returns { start: newStart, duration, in, out } — gọi patchClip với kết quả này
 */
export function trimLeftTo(
  clip: SpeedableClip,
  newStart: number,
): { start: number; duration: number; in: number; out: number } {
  const shift = newStart - clip.start; // âm khi kéo dài sang trái
  const newDuration = clip.duration - shift;
  if (clipReversed(clip)) {
    // Phát ngược: đầu timeline ↔ cuối nguồn → dịch out
    const newOut = clip.out - shift * clipSpeed(clip);
    return { start: newStart, duration: newDuration, in: clip.in, out: newOut };
  }
  // Phát xuôi: đầu timeline ↔ đầu nguồn → dịch in
  const newIn = sourceTimeAt(clip, newStart);
  return { start: newStart, duration: newDuration, in: newIn, out: clip.out };
}

/**
 * Kết quả trim mép phải: { duration, in, out } mới (start giữ nguyên).
 *
 * Ngữ nghĩa:
 * - reverse=false: mép phải timeline ↔ cuối nguồn → dịch `out`.
 *   newOut = sourceTimeAt(clip, newEnd); in giữ nguyên.
 * - reverse=true: mép phải timeline ↔ đầu nguồn (kết thúc phát ngược tại in) →
 *   dịch `in`. newIn = in + shift*speed; out giữ nguyên.
 */
export function trimRightTo(
  clip: SpeedableClip,
  newDuration: number,
): { duration: number; in: number; out: number } {
  const newEnd = clip.start + newDuration;
  if (clipReversed(clip)) {
    const newIn = sourceTimeAt(clip, newEnd);
    return { duration: newDuration, in: newIn, out: clip.out };
  }
  const newOut = sourceTimeAt(clip, newEnd);
  return { duration: newDuration, in: clip.in, out: newOut };
}

/**
 * Giới hạn kéo mép trái: khoảng shift (giây timeline, âm = sang trái) tối đa.
 * - reverse=false: in không được < 0 → shift >= -in / speed
 * - reverse=true: out không được > mediaDuration → shift >= -(mediaDuration - out) / speed
 * Trả về số dương = độ dài tối đa được kéo sang trái (giây timeline).
 */
export function maxTrimLeft(
  clip: SpeedableClip,
  mediaDuration: number = Infinity,
): number {
  const speed = clipSpeed(clip);
  if (clipReversed(clip)) {
    return Math.max(0, (mediaDuration - clip.out) / speed);
  }
  return Math.max(0, clip.in / speed);
}

/**
 * Giới hạn kéo mép phải: duration tối đa (giây timeline).
 * - reverse=false: out không được > mediaDuration → duration <= (mediaDuration - in) / speed
 * - reverse=true: in không được < 0 → duration <= out / speed
 */
export function maxTrimRightDuration(
  clip: SpeedableClip,
  mediaDuration: number = Infinity,
): number {
  const speed = clipSpeed(clip);
  if (clipReversed(clip)) {
    return Math.max(0.2, clip.out / speed);
  }
  return Math.max(0.2, (mediaDuration - clip.in) / speed);
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
