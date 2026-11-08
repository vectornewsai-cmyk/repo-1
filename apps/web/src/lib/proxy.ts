/**
 * proxy.ts — helper phía web cho proxy editing (Phase 8 Q8).
 * Proxy CHỈ dùng cho preview: cùng fps/duration với bản gốc nên mọi
 * logic đồng bộ (seek, speed, reverse) không đổi. Export cuối vẫn dùng
 * file gốc — spec không bao giờ trỏ sang proxy (xem PROXY_LIMITS.md).
 */
import type { MediaItem } from "../media";
// Đợt 53 J5: import kèm đuôi .ts theo quy ước test strip-types của repo
// (xem assetStore.ts: tsc cấm đuôi .ts khi allowImportingTsExtensions
// tắt nên dòng import này mang @ts-ignore có chủ đích — vite và node
// strip-types đều resolve được đuôi .ts).
// @ts-ignore: xem ghi chú trên (TS5097, đuôi .ts cho strip-types)
import { isValidProxyPath } from "./assetStore.ts";

/**
 * Đợt 53 J5 — tách đường dẫn proxy (`/api/proxy/file/<tên>.mp4`) từ
 * proxyUrl đầy đủ mà MediaBin đã lưu (`${BRIDGE_URL}/api/proxy/file/...`).
 * Chỉ đường dẫn mới được lưu bền vào manifest (cổng bridge có thể đổi
 * giữa các phiên); lúc rehydrate ghép lại với BRIDGE_URL hiện tại.
 * - URL đầy đủ (bất kỳ origin nào) → path nếu khớp dạng bridge.
 * - Đã là path → trả nguyên nếu hợp lệ.
 * - Dạng khác / không khớp → null (caller bỏ qua việc lưu bền, proxy
 *   trong phiên vẫn dùng được).
 */
export function proxyPathFromUrl(url: string | undefined | null): string | null {
  if (typeof url !== "string" || url.length === 0) return null;
  let path = url;
  const marker = "/api/proxy/file/";
  const idx = url.indexOf(marker);
  if (idx >= 0) path = url.slice(idx);
  if (isValidProxyPath(path)) return path;
  return null;
}

/**
 * Đợt 54 K7 — trạng thái sống của một proxyUrl, để rehydrate phát hiện
 * proxy chết (WORK_ROOT của bridge bị xóa tay) mà không đoán mò:
 * - "alive": bridge trả 2xx/3xx cho HEAD (file proxy còn trên đĩa).
 * - "missing": bridge trả 404 (file đã mất — CHỈ trạng thái này mới
 *   được coi là chết chắc và bị gỡ).
 * - "unknown": mọi trường hợp còn lại (bridge chưa chạy / mất mạng /
 *   fetch không có / status khác) — caller PHẢI giữ proxy như cũ, không
 *   được kết luận stale (tránh gỡ oan khi bridge chỉ đang tắt).
 * Dùng HEAD để khỏi tải bytes; route GET /api/proxy/file/:name của
 * bridge phục vụ HEAD qua handler GET của Express (đo thật ở harness
 * K7: file còn → 200, file đã xóa → 404). `fetchFn` inject được để
 * unit test (mặc định globalThis.fetch).
 */
export type ProxyLiveness = "alive" | "missing" | "unknown";

export async function checkProxyAlive(
  proxyUrl: string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<ProxyLiveness> {
  if (typeof proxyUrl !== "string" || proxyUrl.length === 0) return "unknown";
  if (typeof fetchFn !== "function") return "unknown";
  try {
    const res = await fetchFn(proxyUrl, { method: "HEAD" });
    if (!res || typeof res.status !== "number") return "unknown";
    if (res.status === 404) return "missing";
    if (res.status >= 200 && res.status < 400) return "alive";
    return "unknown";
  } catch {
    return "unknown";
  }
}

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

/**
 * Đợt 38 U2 — kích thước proxy đã biết (nếu có) để truyền qua cổng S4.
 * Nguồn duy nhất được coi là "biết": field proxySizeBytes do bridge
 * trả về lúc tạo proxy (POST /api/proxy) — tức kích thước của chính
 * file proxy đang fetch, KHÔNG phải item.file.size của file gốc.
 * Giá trị không hợp lệ (<= 0, NaN, vô cực, không phải số) coi như
 * chưa biết -> trả undefined, đường cũ (cổng HEAD/GET của R3) chạy.
 */
export function proxyKnownSizeBytes(item: MediaItem): number | undefined {
  const s = item.proxySizeBytes;
  if (typeof s !== "number" || !Number.isFinite(s) || s <= 0) return undefined;
  return s;
}

/**
 * Đợt 38 U2 — kích thước cần truyền vào reverseWebcodecsFrameFor cho
 * item này, theo đúng luật S4 + bổ sung U2:
 * - Có proxyUrl: chỉ truyền proxySizeBytes khi biết (metadata bridge);
 *   chưa biết thì undefined — KHÔNG truyền item.file.size (size gốc
 *   không phải size proxy, truyền sai sẽ chặn nhầm proxy nhỏ).
 * - Không proxyUrl: truyền item.file.size như cũ (đang phát bản gốc).
 * Hàm này là điểm duy nhất quyết định size truyền đi, để preview
 * không tự viết lại ternary ở nhiều chỗ rồi lệch nhau.
 */
export function knownSizeBytesForPreview(item: MediaItem): number | undefined {
  if (item.proxyUrl) return proxyKnownSizeBytes(item);
  return item.file?.size;
}

/** Nhãn badge hiển thị trên preview, "" khi không dùng proxy. */
export function proxyBadgeLabel(item: MediaItem): string {
  if (!item.proxyUrl) return "";
  return `PROXY ${item.proxyHeight ?? 720}p`;
}
