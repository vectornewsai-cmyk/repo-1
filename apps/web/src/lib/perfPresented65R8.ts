/**
 * perfPresented65R8.ts — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8): đưa
 * presented-frame rate vào FPS meter (PerfOverlay).
 *
 * Số đo thật đứng sau dòng này (xem docs/PHASE9_ROUND65_S8_LIMITS.md):
 * - Tab trắng (element VISIBLE 640×360, long720 30fps): presented
 *   18,71–30,75 fps (mean 26,23, n=15, 5 rep × 3 seek) — rVFC chỉ
 *   8,96–21,33 (mean 16,02): rVFC đếm thiếu hệ thống, presented mới
 *   là số đúng của frame trình chiếu.
 * - Trong app (element pool TÁCH DOM, attached=false/inDoc=false):
 *   presented VẪN TĂNG — 30,04 fps lúc lặng (draw 47,21 fps), 8,42–
 *   15,11 fps lúc tải nặng (draw 0,29–2,68 fps). Giả thuyết "element
 *   tách DOM thì totalVideoFrames đứng yên" BỊ BÁC BỎ bằng số đo:
 *   Chrome vẫn đếm frame trình chiếu cho element dùng làm nguồn
 *   drawImage. Vì vậy dòng presented này có ý nghĩa thật trong UI.
 * - droppedVideoFrames trong app ≈ 0 (0/0/5 qua 3 slot tải nặng, 0 lúc
 *   lặng) trong khi presented chỉ 8–15 fps lúc tải nặng với mediaRate
 *   ~1,0x: frame mất KHÔNG hiện ở dropped — decoder bỏ qua frame
 *   (skip) để giữ kịp đồng hồ media. Đừng đọc dropped ≈ 0 là "không
 *   mất frame"; mất frame đọc ở presented < 30 khi mediaRate ≈ 1,0x.
 *
 * Cách đọc chuỗi: key `perf.presentedFps` / `perf.presentedNote` nằm
 * trong fragment round65-s8 (chưa gộp vào dict — parent gộp sau, đúng
 * mẫu jobNote64R8.ts đợt 64 R8). Đọc trực tiếp từ fragment lúc chạy
 * nên chuỗi hiện ngay cả trước khi gộp; fallback vi khi thiếu key en.
 * Hằng FRAGMENT_KEY_* giữ đủ chuỗi key đầy đủ để scan orphan/P7 tìm
 * thấy sau khi parent gộp (mẫu R64 §3).
 *
 * Cách lấy mẫu: tổng totalVideoFrames của các element VIDEO đang phát
 * (!paused) trong `window.__vcutMediaEls` (preview.tsx phơi tham chiếu
 * element pool thật). Cộng dồn nhiều clip thì là tổng các clip đang
 * phát — ghi rõ trong note UI, không mạo nhận là 1 clip. Không có
 * element đang phát → null ("…" trong UI, KHÔNG phải 0 fps).
 * Element bị thay giữa 2 mẫu (tổng đi lùi) → null, hủy cửa sổ đó.
 */
import fragment from "../i18n/fragments/round65-s8.json";
import type { Lang } from "../i18n";

/** Key đầy đủ trong fragment (giữ nguyên chuỗi để scan i18n tìm thấy). */
export const FRAGMENT_KEY_PRESENTED_FPS = "perf.presentedFps";
export const FRAGMENT_KEY_PRESENTED_NOTE = "perf.presentedNote";

export interface PerfPresentedTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng perf từ fragment (test có thể truyền bảng riêng). */
export function perfPresentedTable(): PerfPresentedTable {
  const f = fragment as unknown as {
    vi?: { perf?: Record<string, string> };
    en?: { perf?: Record<string, string> };
  };
  return {
    vi: (f.vi && f.vi.perf) || {},
    en: (f.en && f.en.perf) || {},
  };
}

function labelFor(
  key: string,
  lang: Lang,
  table: PerfPresentedTable = perfPresentedTable(),
): string {
  const hit = table[lang] && table[lang][key];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[key];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return key;
}

/** Nhãn dòng presented theo locale ("perf.presentedFps"). */
export function presentedLabel(lang: Lang, table?: PerfPresentedTable): string {
  return labelFor("presentedFps", lang, table);
}

/** Ghi chú dòng presented theo locale ("perf.presentedNote"). */
export function presentedNote(lang: Lang, table?: PerfPresentedTable): string {
  return labelFor("presentedNote", lang, table);
}

export interface MediaElsWindowLike {
  __vcutMediaEls?: Array<{
    tag: string;
    el: {
      paused: boolean;
      getVideoPlaybackQuality?: () => { totalVideoFrames: number };
    };
  }>;
}

/**
 * Tổng totalVideoFrames của các element VIDEO đang phát (!paused).
 * Trả null khi không có element video đang phát hoặc API thiếu —
 * gọi bên ngoài phải hiện "…", KHÔNG coi là 0 fps.
 * `win` mặc định là window toàn cục; test truyền cửa sổ giả.
 */
export function readPlayingPresentedTotal(
  win?: MediaElsWindowLike | null,
): number | null {
  const w: MediaElsWindowLike | null | undefined =
    win ?? (typeof window !== "undefined" ? (window as unknown as MediaElsWindowLike) : null);
  const els = w?.__vcutMediaEls;
  if (!Array.isArray(els) || els.length === 0) return null;
  let total = 0;
  let found = false;
  for (const rec of els) {
    if (!rec || rec.tag !== "VIDEO") continue;
    const el = rec.el;
    if (!el || el.paused) continue;
    if (typeof el.getVideoPlaybackQuality !== "function") return null;
    total += el.getVideoPlaybackQuality().totalVideoFrames;
    found = true;
  }
  return found ? total : null;
}

/**
 * Tỉ lệ trình chiếu giữa 2 lần đọc tổng. Trả null khi thiếu mẫu,
 * cửa sổ không tiến, hoặc tổng đi lùi (element bị thay/drop giữa
 * 2 mẫu — số không so sánh được, phải hủy cửa sổ thay vì ghi số rác).
 */
export function presentedRate(
  prevTotal: number | null,
  curTotal: number | null,
  winSecs: number,
): number | null {
  if (prevTotal === null || curTotal === null) return null;
  if (!(winSecs > 0)) return null;
  const delta = curTotal - prevTotal;
  if (delta < 0) return null;
  return delta / winSecs;
}
