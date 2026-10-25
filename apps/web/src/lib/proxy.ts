/**
 * proxy.ts — helper phía web cho proxy editing (Phase 8 Q8).
 * Proxy CHỈ dùng cho preview: cùng fps/duration với bản gốc nên mọi
 * logic đồng bộ (seek, speed, reverse) không đổi. Export cuối vẫn dùng
 * file gốc — spec không bao giờ trỏ sang proxy (xem PROXY_LIMITS.md).
 */
import type { MediaItem } from "../media";

/** URL thực tế preview sẽ phát: proxy nếu có, không thì file gốc. */
export function previewUrlFor(item: MediaItem): string {
  return item.proxyUrl ?? item.url;
}

/** Item này đang preview bằng proxy? */
export function isUsingProxy(item: MediaItem): boolean {
  return !!item.proxyUrl;
}

/**
 * R3 (Phase 9): item này có nên tự tạo proxy khi import không?
 * - Chỉ video có File gốc, chưa có proxy, và người dùng bật tự động.
 * - Video đã biết chiều cao <= 720 thì bỏ qua (bridge cũng sẽ skip, nhưng
 *   tránh upload vô ích). Chiều cao chưa biết (probe lỗi) thì vẫn thử —
 *   bridge tự quyết skip hay tạo.
 */
export function shouldAutoProxy(item: MediaItem, enabled: boolean): boolean {
  if (!enabled) return false;
  if (item.kind !== "video" || !item.file || item.proxyUrl) return false;
  if (typeof item.height === "number" && item.height <= 720) return false;
  return true;
}

/** Nhãn badge hiển thị trên preview, "" khi không dùng proxy. */
export function proxyBadgeLabel(item: MediaItem): string {
  if (!item.proxyUrl) return "";
  return `PROXY ${item.proxyHeight ?? 720}p`;
}
