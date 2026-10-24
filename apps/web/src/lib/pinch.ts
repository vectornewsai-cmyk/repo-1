/**
 * Q6 (Phase 8) — Toán pinch-zoom cho timeline, thuần túy để test được bằng node.
 * Zoom timeline bị kẹp đúng biên của store.setZoom (8..240 px/giây).
 */

export const PINCH_ZOOM_MIN = 8;
export const PINCH_ZOOM_MAX = 240;

/** Khoảng cách Euclid giữa 2 điểm chạm (px màn hình). */
export function pinchDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Zoom mới khi chụm/mở 2 ngón tay: tỉ lệ với khoảng cách, kẹp trong biên.
 * startDist <= 0 hoặc currentDist <= 0 → giữ nguyên zoom (tránh chia 0 / NaN).
 */
export function pinchZoom(
  startDist: number,
  currentDist: number,
  startZoom: number,
): number {
  if (!(startDist > 0) || !(currentDist > 0) || !Number.isFinite(startZoom)) {
    return startZoom;
  }
  const z = startZoom * (currentDist / startDist);
  return Math.min(PINCH_ZOOM_MAX, Math.max(PINCH_ZOOM_MIN, z));
}
