/**
 * presentedFps.ts — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8): lấy mẫu
 * presented-frame rate qua getVideoPlaybackQuality.
 *
 * Vấn đề gốc (R64 R3 §6.2/§7): draw FPS của preview (đếm qua
 * __vcutHoldStats.draw) KHÔNG bằng số frame thật được trình chiếu —
 * preview có thể vẽ 57 fps trong khi element chỉ present ~15 fps (vẽ
 * lại cùng frame). getVideoPlaybackQuality là API chuẩn để đo frame
 * thật: totalVideoFrames = số frame đã trình chiếu, droppedVideoFrames
 * = số frame decode xong nhưng bị bỏ.
 *
 * GIỚI HẠN TRUNG THỰC — đọc trước khi dùng số này:
 * - totalVideoFrames chỉ tăng khi frame được TRÌNH CHIẾU bởi compositor.
 *   Element video của preview (MediaPool.videoFor, media.ts) KHÔNG gắn
 *   vào DOM — nó chỉ là nguồn cho canvas drawImage. Trên Chromium,
 *   element tách DOM không được compositor trình chiếu nên
 *   totalVideoFrames có thể đứng yên (0 fps) trong khi decode vẫn chạy
 *   (requestVideoFrameCallback vẫn bắn). Đó KHÔNG phải lỗi đo: nó có
 *   nghĩa "presented" theo định nghĩa của API này không tồn tại trong
 *   preview hiện tại — số có ý nghĩa lúc đó là draw FPS + playhead
 *   rate. Muốn đo presented thật phải gắn element vào DOM (dù 1×1 px)
 *   — thay đổi hành vi render, để đợt sau quyết, KHÔNG làm ở đây.
 * - Dùng cho harness (measure-65r8-presented-fps.mjs) + FPS meter sau
 *   này; KHÔNG tự gắn vào PerfOverlay khi số còn 0 — hiển thị "0 fps"
 *   trong UI sẽ gây hiểu nhầm là preview đứng hình (xem LIMITS S8).
 *
 * Module thuần (không import store/DOM): nhận element giả lập được nên
 * unit-test được bằng Node + esbuild, theo mẫu test của repo.
 */

export interface VideoPlaybackQualityLike {
  totalVideoFrames: number;
  droppedVideoFrames: number;
  corruptedVideoFrames: number;
}

export interface PlaybackQualityElementLike {
  getVideoPlaybackQuality?: () => VideoPlaybackQualityLike;
  /** true khi element đang gắn trong document (đủ điều kiện present). */
  isConnected?: boolean;
}

export interface PresentedSample {
  /** performance.now() lúc lấy mẫu, ms. */
  wallMs: number;
  total: number;
  dropped: number;
  corrupted: number;
  /** Element có gắn DOM không — false nghĩa total có thể đứng yên dù decode chạy. */
  attached: boolean;
}

export interface PresentedRate {
  /** Số frame trình chiếu / giây trong cửa sổ. */
  presentedFps: number;
  /** Số frame bị bỏ / giây trong cửa sổ. */
  droppedFps: number;
  /** Tỉ lệ frame bỏ trên tổng frame (present + dropped), 0–1. */
  dropRatio: number;
  wallSecs: number;
  totalDelta: number;
  droppedDelta: number;
}

/**
 * Lấy 1 mẫu chất lượng phát tại thời điểm nowMs. Trả null khi element
 * không có API (trình duyệt cũ) — gọi bên ngoài phải coi null là
 * "không đo được", KHÔNG coi là 0 fps.
 */
export function takePresentedSample(
  el: PlaybackQualityElementLike | null | undefined,
  nowMs: number,
): PresentedSample | null {
  if (!el || typeof el.getVideoPlaybackQuality !== "function") return null;
  const q = el.getVideoPlaybackQuality();
  return {
    wallMs: nowMs,
    total: q.totalVideoFrames,
    dropped: q.droppedVideoFrames,
    corrupted: q.corruptedVideoFrames,
    attached: el.isConnected === true,
  };
}

/**
 * Tỉ lệ trình chiếu giữa 2 mẫu. Trả null khi mẫu thiếu, wall không
 * tiến, hoặc bộ đếm đi lùi (element bị thay/drop giữa 2 mẫu — số
 * không so sánh được, phải hủy slot thay vì ghi số rác).
 */
export function presentedRateBetween(
  a: PresentedSample | null,
  b: PresentedSample | null,
): PresentedRate | null {
  if (!a || !b) return null;
  const wallSecs = (b.wallMs - a.wallMs) / 1000;
  if (!(wallSecs > 0)) return null;
  const totalDelta = b.total - a.total;
  const droppedDelta = b.dropped - a.dropped;
  if (totalDelta < 0 || droppedDelta < 0) return null;
  const denom = totalDelta + droppedDelta;
  return {
    presentedFps: totalDelta / wallSecs,
    droppedFps: droppedDelta / wallSecs,
    dropRatio: denom > 0 ? droppedDelta / denom : 0,
    wallSecs,
    totalDelta,
    droppedDelta,
  };
}
