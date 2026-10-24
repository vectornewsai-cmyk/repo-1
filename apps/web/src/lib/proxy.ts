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

/** Nhãn badge hiển thị trên preview, "" khi không dùng proxy. */
export function proxyBadgeLabel(item: MediaItem): string {
  if (!item.proxyUrl) return "";
  return `PROXY ${item.proxyHeight ?? 720}p`;
}
