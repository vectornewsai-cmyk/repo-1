/**
 * timebase.ts — Frame-accurate timebase cho video-spec (R1-055 / R1-056).
 *
 * VẤN ĐỀ: mọi thời gian trong spec đều là số thực (giây) → lỗi làm tròn
 * float khi trim/move/split ở biên frame (ví dụ 0.1 + 0.2 = 0.30000000000000004).
 * CapCut và mọi NLE đều snap theo frame.
 *
 * THIẾT KẾ:
 * - Mọi thời gian trên timeline được làm tròn về frame gần nhất theo fps
 *   của project (`meta.fps`, mặc định 30).
 * - `toFrames` / `toSeconds` là cặp chuyển đổi duy nhất — không tự tính
 *   `t * fps` rải rác trong code.
 * - `snapToFrame` dùng cho playhead scrub, move, trim (mép trái), split.
 *   Mép phải (trim right) nên dùng `snapToFrameFloor` để không bao giờ
 *   vượt quá giới hạn độ dài file nguồn.
 * - `formatTimecode` hiển thị HH:MM:SS:FF cho ruler/playhead.
 *
 * LƯU Ý: module này độc lập, không import gì từ index.ts (tránh circular import).
 */

/** FPS mặc định khi project không khai báo hoặc khai báo sai. */
export const DEFAULT_FPS = 30;
/** Sai số khi so sánh thời gian đã snap. */
export const TIMEBASE_EPS = 1e-9;

/**
 * Chuẩn hoá fps: số hữu hạn > 0 thì dùng, còn lại (0, NaN, âm, undefined)
 * thì về DEFAULT_FPS. Không throw — editor không được crash vì meta xấu.
 */
export function normalizeFps(fps: number | undefined | null): number {
  if (typeof fps !== "number" || !Number.isFinite(fps) || fps <= 0) return DEFAULT_FPS;
  return fps;
}

/** Độ dài 1 frame tính bằng giây. */
export function frameDuration(fps: number | undefined | null): number {
  return 1 / normalizeFps(fps);
}

/**
 * Giây → số frame (làm tròn tới frame gần nhất).
 * Giá trị <= 0 hoặc không hữu hạn → 0.
 */
export function toFrames(seconds: number, fps: number | undefined | null): number {
  const f = normalizeFps(fps);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.round(seconds * f);
}

/**
 * Số frame → giây. Dùng Math.round(frame) để chắc chắn đầu vào nguyên.
 */
export function toSeconds(frames: number, fps: number | undefined | null): number {
  const f = normalizeFps(fps);
  if (!Number.isFinite(frames) || frames <= 0) return 0;
  return Math.round(frames) / f;
}

/**
 * Snap thời gian về frame gần nhất.
 * Ví dụ: snapToFrame(0.0333, 30) = 1/30 ≈ 0.0333333 (frame 1).
 */
export function snapToFrame(t: number, fps: number | undefined | null): number {
  return toSeconds(toFrames(t, fps), fps);
}

/**
 * Snap xuống frame gần nhất (floor). Dùng cho mép phải khi trim để
 * không bao giờ vượt quá giới hạn (độ dài file nguồn, clip kề...).
 */
export function snapToFrameFloor(t: number, fps: number | undefined | null): number {
  const f = normalizeFps(fps);
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.floor(t * f) / f;
}

/**
 * Snap lên frame gần nhất (ceil).
 */
export function snapToFrameCeil(t: number, fps: number | undefined | null): number {
  const f = normalizeFps(fps);
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.ceil(t * f) / f;
}

/**
 * Kiểm tra thời gian đã nằm đúng biên frame chưa (sai số TIMEBASE_EPS).
 */
export function isFrameAligned(t: number, fps: number | undefined | null): boolean {
  return Math.abs(t - snapToFrame(t, fps)) <= TIMEBASE_EPS;
}

/**
 * Định dạng giây → timecode "HH:MM:SS:FF" (giờ:phút:giây:frame).
 * Ví dụ: formatTimecode(61, 30) = "00:01:01:00"; formatTimecode(1.5, 30) = "00:00:01:15".
 *
 * Với fps không nguyên (29.97, 23.976): dùng fps danh nghĩa round(fps) cho
 * phần FF — timecode có thể trôi nhẹ ở video rất dài (không hỗ trợ drop-frame).
 * Xem TIMEBASE_LIMITS.md.
 */
export function formatTimecode(seconds: number, fps: number | undefined | null): string {
  const f = normalizeFps(fps);
  const framesPerSec = Math.max(1, Math.round(f));
  const totalFrames = toFrames(Math.max(0, seconds), f);
  const ff = totalFrames % framesPerSec;
  const totalSec = Math.floor(totalFrames / framesPerSec);
  const ss = totalSec % 60;
  const mm = Math.floor(totalSec / 60) % 60;
  const hh = Math.floor(totalSec / 3600);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(hh)}:${p2(mm)}:${p2(ss)}:${p2(ff)}`;
}
