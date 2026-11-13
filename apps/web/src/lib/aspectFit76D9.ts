/**
 * aspectFit76D9.ts — Cách lấp khung khi tỉ lệ nguồn lệch khung xuất
 * (Phase 9 đợt 76, luồng D9 — đóng nợ đợt 75 C7 §6: xuất preset 4:5 từ
 * nguồn 16:9 thì letterbox viền đen mà ExportPanel không cảnh báo).
 *
 * Lib thuần (+ localStorage, inject được cho test), không DOM, không i18n:
 *
 * 1. PHÁT HIỆN LỆCH TỈ LỆ — aspectMismatch(srcW, srcH, dstW, dstH):
 *    null = tỉ lệ khớp (trong dung sai 1%, không cảnh báo thừa);
 *    "letterbox" = nguồn rộng hơn khung đích → giữ tỉ lệ sẽ có viền đen
 *    trên/dưới; "pillarbox" = nguồn hẹp hơn → viền đen hai bên.
 *    Tỉ lệ so sánh là meta project (khung timeline) với khung preset —
 *    render.js chuẩn hoá TỪNG clip về đúng khung preset nên clip 16:9
 *    trong khung 4:5 letterbox y hệt project 16:9.
 * 2. NHÃN TỈ LỆ — aspectRatioLabel(1280, 720) = "16:9" (rút gọn bằng gcd);
 *    1080×1350 = "4:5". Dùng làm tham số {src}/{dst} cho chuỗi cảnh báo.
 * 3. CHẾ ĐỘ — AspectFit = "fit" | "crop": fit = giữ tỉ lệ + viền đen
 *    (mặc định, hành vi cũ, không mất hình); crop = phóng to lấp đầy rồi
 *    crop giữa (không còn viền đen, mất phần hình ngoài khung). normalize
 *    về "fit" khi giá trị lạ — cùng mặc định với render.js fitChain.js
 *    và bridge parsePreset (đợt 76 D9).
 * 4. PERSIST — lựa chọn lưu ở localStorage key `vcut-export-aspect-fit`
 *    ("fit"/"crop"), mặc định "fit"; thiếu key / giá trị lạ → "fit".
 *    ExportPanel đọc lúc mount, ghi mỗi lần user đổi.
 *
 * Cách chạy test (mẫu stabSingleThread68V2, từ gốc repo; bundle ra scratch):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/aspectFit76D9.test.ts \
 *     --bundle --platform=node --format=cjs --outfile=/tmp/round76-d9/d9.test.cjs \
 *     && node /tmp/round76-d9/d9.test.cjs
 */

/** Cách lấp khung khi tỉ lệ nguồn lệch khung xuất (xem fitChain.js). */
export type AspectFit = "fit" | "crop";

/** Hai chế độ hợp lệ (whitelist — khớp render.js + bridge). */
export const ASPECT_FITS: readonly AspectFit[] = ["fit", "crop"];

/** Mặc định: "fit" — giữ hành vi cũ (letterbox), không tự cắt hình user. */
export const ASPECT_FIT_DEFAULT: AspectFit = "fit";

/** Kho lưu lựa chọn trong localStorage. */
export const ASPECT_FIT_KEY = "vcut-export-aspect-fit";

/** Dung sai tỉ lệ: lệch ≤ 1% coi như khớp (không cảnh báo thừa). */
export const ASPECT_MISMATCH_TOLERANCE = 0.01;

/** Kho lưu trữ tối thiểu (localStorage thật khớp interface này). */
export interface AspectFitStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Test inject kho "giả" (Node không có localStorage); null = dùng lại
 *  localStorage thật. Mẫu stabSingleThread68V2. */
function defaultStore(): AspectFitStore | null {
  try {
    const g = globalThis as unknown as { localStorage?: AspectFitStore };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

export function isAspectFit(v: unknown): v is AspectFit {
  return typeof v === "string" && (ASPECT_FITS as readonly string[]).includes(v);
}

/** Chuẩn hoá giá trị lạ/undefined về mặc định "fit" (không throw). */
export function normalizeAspectFit(v: unknown): AspectFit {
  return isAspectFit(v) ? v : ASPECT_FIT_DEFAULT;
}

/** Đọc lựa chọn từ kho; thiếu key / giá trị lạ / không có kho → "fit". */
export function loadAspectFit(store: AspectFitStore | null = defaultStore()): AspectFit {
  if (!store) return ASPECT_FIT_DEFAULT;
  try {
    return normalizeAspectFit(store.getItem(ASPECT_FIT_KEY));
  } catch {
    return ASPECT_FIT_DEFAULT;
  }
}

/** Ghi lựa chọn vào kho; lỗi kho → bỏ qua (lựa chọn vẫn hiệu lực trong phiên). */
export function saveAspectFit(mode: AspectFit, store: AspectFitStore | null = defaultStore()): void {
  if (!store) return;
  try {
    store.setItem(ASPECT_FIT_KEY, normalizeAspectFit(mode));
  } catch {
    /* kho không ghi được (private mode...) — lựa chọn vẫn có hiệu lực trong phiên */
  }
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x || 1;
}

/**
 * Nhãn tỉ lệ rút gọn, vd 1280×720 → "16:9", 1080×1350 → "4:5",
 * 1920×1080 → "16:9". Số không hợp lệ → "?" (caller không in tỉ lệ rác).
 */
export function aspectRatioLabel(w: number, h: number): string {
  if (!(w > 0) || !(h > 0) || !Number.isFinite(w) || !Number.isFinite(h)) return "?";
  const d = gcd(w, h);
  return `${Math.round(w / d)}:${Math.round(h / d)}`;
}

/**
 * Hướng viền đen khi giữ nguyên tỉ lệ (fit), hoặc null khi tỉ lệ khớp.
 * - "letterbox": nguồn rộng hơn khung đích → viền đen trên/dưới
 *   (vd 16:9 → 4:5: video scale vừa chiều rộng 1080 → cao 608, đặt giữa
 *   khung 1080×1350, chừa viền đen trên/dưới — đúng số đo đợt 75 C7 §2).
 * - "pillarbox": nguồn hẹp hơn khung đích → viền đen hai bên
 *   (vd 9:16 → 16:9).
 * Dung sai 1% theo tỉ lệ đích: 1280×720 vs 1920×1080 khớp; 720×480
 * (3:2) vs 720×486 (NTSC) lệch 1,2% → vẫn báo (đúng: có viền thật).
 */
export function aspectMismatch(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): "letterbox" | "pillarbox" | null {
  if (!(srcW > 0) || !(srcH > 0) || !(dstW > 0) || !(dstH > 0)) return null;
  const srcAR = srcW / srcH;
  const dstAR = dstW / dstH;
  if (Math.abs(srcAR - dstAR) / dstAR <= ASPECT_MISMATCH_TOLERANCE) return null;
  return srcAR > dstAR ? "letterbox" : "pillarbox";
}
