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
 * - Video đã biết chiều cao <= chiều cao đích thì bỏ qua (bridge cũng
 *   sẽ skip, nhưng tránh upload vô ích). Chiều cao chưa biết (probe
 *   lỗi) thì vẫn thử — bridge tự quyết skip hay tạo.
 * - Đợt 84 L9: thêm targetHeight (480|720, mặc định 720) — ngưỡng bỏ
 *   qua nay theo đúng chiều cao đích user chọn, không kẹt 720.
 */
export function shouldAutoProxy(item: MediaItem, enabled: boolean, targetHeight: ProxyHeight = 720): boolean {
  if (!enabled) return false;
  if (item.kind !== "video" || !item.file || item.proxyUrl) return false;
  if (typeof item.height === "number" && item.height <= targetHeight) return false;
  return true;
}

/** Đợt 84 L9 — chiều cao proxy user chọn (480|720). Bridge chỉ nhận 2 giá trị này. */
export type ProxyHeight = 480 | 720;

/** Key localStorage cho chiều cao proxy tự động (xem MediaBin). */
export const AUTO_PROXY_HEIGHT_KEY = "vcut-auto-proxy-height";

/** Chuẩn hoá giá trị lạ (localStorage cũ, query, bridge) về 480|720; mặc định 720. */
export function parseProxyHeight(value: unknown): ProxyHeight {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return n === 480 ? 480 : 720;
}

/** Đọc chiều cao proxy đã lưu; lỗi storage / giá trị lạ → 720. */
export function readAutoProxyHeight(): ProxyHeight {
  try {
    return parseProxyHeight(localStorage.getItem(AUTO_PROXY_HEIGHT_KEY));
  } catch {
    return 720;
  }
}

/**
 * Đợt 84 L9 — lý do KHÔNG tự tạo proxy cho item này, để UI giải thích
 * được thay vì bỏ qua lặng (nợ R3: item mất File gốc bị bỏ qua mà
 * user không biết vì sao nút Proxy biến mất). Trả null khi nên tạo.
 * Thứ tự ưu tiên: tắt > không phải video > mất file gốc > đã có proxy
 * > đã đủ nhỏ. "no-original-file" là trường hợp cần thông báo nhất:
 * file gốc không còn giữ được (vd media rehydrate/sample sau reload)
 * thì KHÔNG thể tạo proxy — user phải import lại file gốc.
 */
export type AutoProxySkipReason =
  | "disabled"
  | "not-video"
  | "no-original-file"
  | "already-has-proxy"
  | "already-small";

export function autoProxySkipReason(
  item: MediaItem,
  enabled: boolean,
  targetHeight: ProxyHeight = 720,
): AutoProxySkipReason | null {
  if (!enabled) return "disabled";
  if (item.kind !== "video") return "not-video";
  if (!item.file) return "no-original-file";
  if (item.proxyUrl) return "already-has-proxy";
  if (typeof item.height === "number" && item.height <= targetHeight) return "already-small";
  return null;
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

// ---------------------------------------------------------------------------
// Đợt 85 M8 — tiến trình % + hàng đợi thử lại khi bridge tắt.
// ---------------------------------------------------------------------------

/** Số lần thử tối đa cho một proxy (lần đầu + tối đa 4 lần thử lại). */
export const PROXY_RETRY_MAX_ATTEMPTS = 5;
/** Delay lần thử lại đầu (5 s), nhân đôi mỗi lần, kẹp tối đa 120 s. */
export const PROXY_RETRY_BASE_DELAY_MS = 5000;
export const PROXY_RETRY_MAX_DELAY_MS = 120000;

/**
 * Delay trước lần thử lại thứ `attempt` (1-based: lần thử lại đầu tiên
 * là attempt=1 → 5 s, rồi 10 s, 20 s, 40 s, 80 s; từ attempt>=6 kẹp 120 s).
 * Công thức cố định để unit test khóa được — không dùng random/jitter
 * (retry chạy nền, không có nhiều client cùng tranh bridge).
 */
export function proxyRetryDelayMs(attempt: number): number {
  const n = Math.floor(Number(attempt) || 0);
  if (n < 1) return PROXY_RETRY_BASE_DELAY_MS;
  return Math.min(PROXY_RETRY_MAX_DELAY_MS, PROXY_RETRY_BASE_DELAY_MS * 2 ** (n - 1));
}

/** Đã thử đủ số lần tối đa chưa (attempts = số lần đã thử, tính cả lần đầu). */
export function proxyRetryExhausted(attempts: number): boolean {
  return Math.floor(Number(attempts) || 0) >= PROXY_RETRY_MAX_ATTEMPTS;
}

/**
 * Lỗi này có phải "bridge tắt / không tới được" không — CHỈ những lỗi
 * này mới được đưa vào hàng đợi thử lại:
 * - fetch reject (TypeError "Failed to fetch", "NetworkError",
 *   "Load failed", "Network request failed"): bridge chưa chạy, CORS,
 *   mất mạng — thử lại sau có thể được.
 * - HTTP 502/503/504: bridge đang khởi động lại / proxy tạm lỗi.
 * Mọi lỗi khác (400 sai height, 500 encode lỗi, bridge trả JSON lỗi)
 * là lỗi xác định — thử lại cũng lỗi y hệt nên fail luôn, không retry.
 */
export function isBridgeDownError(e: unknown): boolean {
  if (e && typeof e === "object") {
    const status = (e as { status?: unknown }).status;
    if (typeof status === "number" && (status === 502 || status === 503 || status === 504)) return true;
  }
  if (e instanceof TypeError) return true;
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return /failed to fetch|networkerror|load failed|network request failed|econnrefused|enotfound/i.test(msg);
}

/** Kẹp % tiến trình proxy về số nguyên 0..100; giá trị lạ → 0. */
export function clampProxyProgress(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

export type ProxyJobStatus = "processing" | "done" | "failed" | "skipped";

/**
 * Parse an toàn response GET /api/proxy/jobs/:id (hoặc POST ?async=1):
 * trả null khi không phải object job hợp lệ (bridge cũ / lỗi mạng đã
 * được caller xử lý trước). progress luôn kẹp 0..100; job done/skipped
 * mà thiếu progress thì coi là 100.
 */
export function parseProxyJobStatus(data: unknown): { jobId: string; status: ProxyJobStatus; progress: number } | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.jobId !== "string" || d.jobId.length === 0) return null;
  if (d.status !== "processing" && d.status !== "done" && d.status !== "failed" && d.status !== "skipped") return null;
  const progress = typeof d.progress === "number" && Number.isFinite(d.progress)
    ? clampProxyProgress(d.progress)
    : d.status === "done" || d.status === "skipped"
      ? 100
      : 0;
  return { jobId: d.jobId, status: d.status, progress };
}

/** Kết quả đính kèm khi job proxy done: đủ để gắn proxy vào media item. */
export function proxyJobDoneResult(data: unknown): {
  proxyUrl: string;
  proxyHeight: number;
  proxySizeBytes?: number;
} | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.status !== "done" || typeof d.proxyUrl !== "string" || d.proxyUrl.length === 0) return null;
  return {
    proxyUrl: d.proxyUrl,
    proxyHeight: typeof d.proxyHeight === "number" && Number.isFinite(d.proxyHeight) ? d.proxyHeight : 720,
    ...(typeof d.proxySizeBytes === "number" ? { proxySizeBytes: d.proxySizeBytes } : {}),
  };
}
