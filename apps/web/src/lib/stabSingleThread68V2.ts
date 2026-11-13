/**
 * stabSingleThread68V2.ts — Toggle bật/tắt stabilize single-thread decode
 * (Phase 9 đợt 68, luồng V2 — đóng nợ đợt 67 U1 §7 mục 1: chưa có toggle
 * trên UI cho cờ `-threads 1` đã ép vào render.js ở U1).
 *
 * Hai việc, một lib thuần (+ localStorage, inject được cho test):
 *
 * 1. CHUỖI: fragment round68-v2 được import trực tiếp lúc chạy nên chuỗi
 *    en hiện ngay, không chờ parent gộp dict vào vi.json/en.json. Key đầy
 *    đủ `exportPanel.stabSingleThread*` xuất hiện nguyên văn trong
 *    STAB_SINGLE_THREAD_KEYS nên scan tĩnh thấy là đã tiêu thụ; parent
 *    gộp fragment vào dict thì không collision (key mới hoàn toàn trong
 *    namespace `exportPanel.*`). Không bao giờ trả key thô ra UI: thiếu
 *    key → rớt về vi → rớt về "" (component ẩn hint khi không có chuỗi).
 *
 * 2. PERSIST: trạng thái toggle lưu ở localStorage key
 *    `vcut-stab-single-thread` ("1" = BẬT, "0" = TẮT), mặc định BẬT
 *    (giữ hành vi U1 đã ép). Thiếu key / giá trị lạ → BẬT. ExportPanel
 *    đọc lúc mount, ghi mỗi lần user đổi — đóng/mở panel hay tải lại
 *    trang đều giữ trạng thái.
 *
 * Cách chạy test (mẫu jobHistory67U7, từ gốc repo; bundle ra scratch):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/stabSingleThread68V2.test.ts \
 *     --bundle --platform=node --format=cjs --outfile=/tmp/round68-v2/v2.test.cjs \
 *     && node /tmp/round68-v2/v2.test.cjs
 */
import fragment from "../i18n/fragments/round68-v2.json";
import type { Lang } from "../i18n";

/**
 * Toàn bộ key của cụm này — KHỚP 1:1 với fragment round68-v2
 * (vi + en, chuỗi không rỗng, vi khác en).
 * Khai đầy đủ dạng literal để scan tĩnh thấy key đã tiêu thụ.
 */
export const STAB_SINGLE_THREAD_KEYS: readonly string[] = [
  "exportPanel.stabSingleThread",
  "exportPanel.stabSingleThreadHint",
];

/** Key lá (không tiền tố) trong bảng fragment `exportPanel.*` của cụm này. */
export const STAB_SINGLE_THREAD_LEAF_KEYS: readonly string[] = [
  "stabSingleThread",
  "stabSingleThreadHint",
];

/** Kho lưu trạng thái toggle trong localStorage. */
export const STAB_SINGLE_THREAD_KEY = "vcut-stab-single-thread";

/** Mặc định BẬT — giữ hành vi U1 đã ép vào render.js (đợt 67). */
export const STAB_SINGLE_THREAD_DEFAULT = true;

/** Kho lưu trữ tối thiểu (localStorage thật khớp interface này). */
export interface StabStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Test inject kho "giả" (Node không có localStorage); null = dùng lại
 *  localStorage thật. Mẫu jobHistory67U7. */
function defaultStore(): StabStore | null {
  try {
    const g = globalThis as unknown as { localStorage?: StabStore };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Đọc trạng thái toggle từ kho; thiếu key / giá trị lạ / không có kho →
 * mặc định BẬT (true). Nhận "1"/"true" → bật, "0"/"false" → tắt.
 */
export function loadStabSingleThread(store: StabStore | null = defaultStore()): boolean {
  if (!store) return STAB_SINGLE_THREAD_DEFAULT;
  try {
    const raw = store.getItem(STAB_SINGLE_THREAD_KEY);
    if (raw === "0" || raw === "false") return false;
    if (raw === "1" || raw === "true") return true;
    return STAB_SINGLE_THREAD_DEFAULT;
  } catch {
    return STAB_SINGLE_THREAD_DEFAULT;
  }
}

/** Ghi trạng thái toggle vào kho ("1" = BẬT, "0" = TẮT); lỗi kho → bỏ qua. */
export function saveStabSingleThread(on: boolean, store: StabStore | null = defaultStore()): void {
  if (!store) return;
  try {
    store.setItem(STAB_SINGLE_THREAD_KEY, on ? "1" : "0");
  } catch {
    /* kho không ghi được (private mode...) — toggle vẫn có hiệu lực trong phiên */
  }
}

// --- Chuỗi fragment --------------------------------------------------------

/** Bảng song ngữ cụm toggle: `exportPanel.stabSingleThread*` trong fragment. */
export interface StabSingleThreadTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng từ fragment (test có thể truyền bảng riêng). */
export function stabSingleThreadTable(): StabSingleThreadTable {
  const f = fragment as unknown as {
    vi?: { exportPanel?: Record<string, string> };
    en?: { exportPanel?: Record<string, string> };
  };
  return {
    vi: (f.vi && f.vi.exportPanel) || {},
    en: (f.en && f.en.exportPanel) || {},
  };
}

/**
 * Một chuỗi của cụm theo key lá + locale; fallback vi khi thiếu key en;
 * trả undefined khi cả hai đều thiếu — caller không bao giờ in key thô.
 */
export function stabSingleThreadString(
  leafKey: string,
  lang: Lang,
  table: StabSingleThreadTable = stabSingleThreadTable(),
): string | undefined {
  const hit = table[lang] && table[lang][leafKey];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[leafKey];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return undefined;
}

/** Toàn bộ chuỗi cụm theo locale (thiếu key → "" để component ẩn). */
export function stabSingleThreadStrings(
  lang: Lang,
  table: StabSingleThreadTable = stabSingleThreadTable(),
): { label: string; hint: string } {
  return {
    label: stabSingleThreadString("stabSingleThread", lang, table) ?? "",
    hint: stabSingleThreadString("stabSingleThreadHint", lang, table) ?? "",
  };
}
