/**
 * binOrphan60Q7.ts — Dọn bytes IndexedDB mồ côi khi xóa media khỏi bin +
 * chặn xóa khi clip dùng asset qua src `asset:` (Phase 9 đợt 60, luồng Q7
 * — đóng nợ đợt 59 P1 §5.1 + §5.2).
 *
 * Bối cảnh (LIMITS đợt 59 P1): `removeMediaFromBin` (store.ts) chỉ xóa
 * item khỏi mảng media trong bộ nhớ + revoke blob: URL; bytes + manifest
 * trong AssetStore (IndexedDB) ở lại mãi — kho phình dần, và media đã
 * xóa không bao giờ hồi lại được bằng bytes đó. Đồng thời cửa sổ
 * debounce 5s của autosave có race: `autosave()` chụp payload lúc lên
 * lịch (kể cả bản KHÔNG có binMedia ở đường mở file), timer bắn sau có
 * thể ghi đè envelope mới hơn.
 *
 * Thiết kế (a) — chỉ xóa bytes khi user xóa CHỦ ĐÍCH khỏi bin và đủ cả
 * ba điều kiện (quyết định thuần ở `planOrphanBytesDeletion`, test được
 * bằng Node không cần trình duyệt):
 *  1. Item có `assetId` (có bytes trong IndexedDB để xóa; item chưa
 *     ingest thì không có gì để dọn).
 *  2. Không còn clip nào dùng asset này qua src `asset:<id>` — chặn
 *     này BỔ SUNG cho chặn theo tên đã có ở `removeMediaFromBin`
 *     (findMissingAssets quét theo tên; clip trong file .vcut có thể
 *     mang src `asset:` mà chặn theo tên không thấy — xóa bytes lúc đó
 *     sẽ làm clip thành "missing" thật). Gọi sau khi chặn theo tên đã
 *     qua; verdict `block-removal` trả về kèm số clip để UI toast rõ.
 *  3. Không còn item khác trong bin dùng chung `assetId` (dedup: cùng
 *     bytes import dưới hai tên khác nhau chỉ có một manifest/blob;
 *     xóa item này mà xóa bytes sẽ làm item kia mất bytes sau reload).
 *  Khi (2) hoặc (3) chặn thì bytes được GIỮ (item kia/clip kia vẫn cần);
 *  chỉ `delete-bytes` mới gọi `AssetStore.remove`. `remove()` của
 *  AssetStore còn tự từ chối khi `refCount > 0` (hiện refCount luôn 0
 *  vì chưa ai duy trì — xem LIMITS) nên có thêm một lưới an toàn.
 *
 *  KHÔNG làm sweep định kỳ lúc mở app: AssetStore là kho toàn cục theo
 *  trình duyệt, không theo project — sweep dựa trên project hiện tại sẽ
 *  xóa nhầm bytes mà project KHÁC (file .vcut khác) còn tham chiếu, và
 *  không có sổ nào ghi project nào dùng asset nào. Bytes mồ côi từ
 *  TRƯỚC đợt này (đã xóa khỏi bin ở đợt 59 mà bytes còn lại) vẫn ở lại
 *  kho — xem LIMITS §5 để biết hướng dọn tay tương lai.
 *
 *  Cửa sổ nhỏ còn lại (trung thực): `removeMediaFromBin` xóa bytes
 *  fire-and-forget (không await — hàm này đồng bộ vì MediaBin dùng kết
 *  quả ngay cho toast), còn manifest bin trong autosave chỉ được ghi
 *  lại sau debounce 5s (effect App.tsx). Reload đúng trong cửa sổ đó
 *  (bytes đã xóa, manifest còn liệt kê item) thì rehydrate thấy entry
 *  bin nhưng không lấy được blob → item vắng khỏi bin (đúng ý user đã
 *  xóa), không hiện panel Relink vì không clip nào dùng nó.
 *
 * Thiết kế (b) — race debounce (phần sửa nằm ở projectRepo.ts +
 * openProjectFlow.ts, test ở file .test.ts kèm theo):
 *  - `autosaveNow` hủy timer debounce đang chờ: lần ghi ngay luôn mới
 *    hơn mọi lần ghi hoãn đang chờ (payload của timer chụp từ lúc lên
 *    lịch), nên để timer bắn sau sẽ ghi đè dữ liệu mới bằng dữ liệu cũ.
 *  - Đường mở file không lên lịch `autosave()` (debounce, không kèm
 *    binMedia) trước khi rehydrate xong nữa; thay bằng `autosaveNow`
 *    ngay + `autosaveNow` kèm binMedia đúng sau rehydrate.
 *
 * Module này cố tình KHÔNG import value từ file anh em (quy ước
 * captionFollow.ts: chạy được bằng `node --experimental-strip-types`,
 * xem rehydrate36S5.ts): quét src trong spec tự viết lại ở đây
 * (cùng quy ước nested canonical + chống vòng lặp của
 * collectMediaSrcs), chỉ khác là trả về src thô thay vì plan.
 */

/** Hình dạng tối thiểu của spec mà quyết định này cần. */
export interface OrphanSpecLike {
  tracks?: Array<{ clips?: unknown[] }>;
}

/** Hình dạng tối thiểu của một item trong media bin. */
export interface BinMediaLike {
  id: string;
  name: string;
  assetId?: string;
}

/** Độ sâu đệ quy tối đa khi quét nested (khớp relink.ts / rehydrate36S5.ts). */
export const MAX_ORPHAN_SCAN_DEPTH = 64;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Thu thập mọi `src` media distinct trong spec, kể cả lá trong subSpec
 * của nested clip (canonical: `subSpec.tracks`, legacy: `tracks` trực
 * tiếp trên clip nested — cùng quy ước của relink.ts / rehydrate36S5.ts).
 * Chống vòng lặp theo nhánh. Chỉ thu clip video/audio/image/sticker.
 */
export function collectClipSrcs(spec: OrphanSpecLike): string[] {
  const out: string[] = [];
  const seenSrc = new Set<string>();
  scanClipSrcs(spec, (src) => {
    if (!seenSrc.has(src)) {
      seenSrc.add(src);
      out.push(src);
    }
  });
  return out;
}

/**
 * Đếm số clip (kể cả trùng src) trong spec có src đúng bằng `target` —
 * dùng cho chặn asset: (hai clip cùng trỏ một asset phải đếm là 2, còn
 * collectClipSrcs khử trùng nên không đếm được).
 */
function countClipsWithSrc(spec: OrphanSpecLike, target: string): number {
  let n = 0;
  scanClipSrcs(spec, (src) => {
    if (src === target) n += 1;
  });
  return n;
}

/**
 * Bộ đi chung: thăm MỖI clip media (kể cả trùng src, kể cả trong nested)
 * đúng một lần theo nhánh; `visit` nhận src thô của clip.
 */
function scanClipSrcs(spec: OrphanSpecLike, visit: (src: string) => void): void {
  const scanTracks = (tracks: unknown, depth: number, ancestors: Set<object>): void => {
    if (!Array.isArray(tracks) || depth > MAX_ORPHAN_SCAN_DEPTH) return;
    for (const t of tracks) {
      if (!isRecord(t) || !Array.isArray(t["clips"])) continue;
      for (const c of t["clips"]) {
        if (!isRecord(c)) continue;
        const kind = c["kind"];
        if (
          (kind === "video" || kind === "audio" || kind === "image" || kind === "sticker") &&
          typeof c["src"] === "string" &&
          c["src"].length > 0
        ) {
          visit(c["src"]);
        }
        if (kind !== "nested") continue;
        const sub = c["subSpec"];
        let subTracks: unknown = null;
        let subObj: object | null = null;
        if (isRecord(sub) && Array.isArray(sub["tracks"])) {
          subTracks = sub["tracks"];
          subObj = sub;
        } else if (Array.isArray(c["tracks"])) {
          subTracks = c["tracks"];
        }
        if (subTracks === null) continue;
        if (subObj !== null && ancestors.has(subObj)) continue;
        const next = new Set(ancestors);
        if (subObj !== null) next.add(subObj);
        scanTracks(subTracks, depth + 1, next);
      }
    }
  };
  scanTracks(spec.tracks, 0, new Set());
}

/**
 * Verdict cho một lần xóa media khỏi bin.
 * - `delete-bytes`: xóa khỏi bin + xóa bytes khỏi IndexedDB (đủ 3 điều kiện §(a)).
 * - `keep-bytes`: xóa khỏi bin nhưng GIỮ bytes (item chưa ingest, hoặc
 *   còn item khác trong bin dùng chung assetId).
 * - `block-removal`: KHÔNG xóa khỏi bin (còn clip dùng asset qua src `asset:`).
 * - `not-found`: không có item này trong bin (caller đã xử lý trước).
 */
export type OrphanBytesAction =
  | { action: "delete-bytes"; assetId: string }
  | { action: "keep-bytes"; reason: "no-asset-id" | "shared-with-other-bin-item" }
  | { action: "block-removal"; reason: "clip-uses-asset-src"; clipCount: number }
  | { action: "not-found" };

/**
 * Quyết định thuần: item này xóa khỏi bin thì bytes trong IndexedDB
 * xử lý thế nào. GỌI SAU KHI chặn theo tên đã qua (luật chặn theo tên
 * nằm ở `removeMediaFromBin` trong store.ts, dùng findMissingAssets) —
 * hàm này chỉ bổ sung hai chặn mà chặn theo tên không thấy: clip dùng
 * qua src `asset:` và item khác trong bin dùng chung bytes (dedup).
 */
export function planOrphanBytesDeletion(
  spec: OrphanSpecLike,
  media: ReadonlyArray<BinMediaLike>,
  mediaId: string,
): OrphanBytesAction {
  const item = media.find((m) => m.id === mediaId);
  if (!item) return { action: "not-found" };
  if (typeof item.assetId !== "string" || item.assetId.length === 0) {
    return { action: "keep-bytes", reason: "no-asset-id" };
  }
  // Chặn 2 — clip dùng asset qua src `asset:<id>` (file .vcut có thể
  // mang dạng src này; app không sinh ra nhưng format hỗ trợ, và
  // planRehydrate vẫn khớp nó nên clip đó thật sự dùng bytes này).
  const assetSrc = `asset:${item.assetId}`;
  const clipCount = countClipsWithSrc(spec, assetSrc);
  if (clipCount > 0) {
    return { action: "block-removal", reason: "clip-uses-asset-src", clipCount };
  }
  // Chặn 3 — item khác trong bin dùng chung assetId (dedup cùng bytes,
  // khác tên): xóa bytes sẽ làm item kia mất bytes sau reload.
  const shared = media.some((m) => m.id !== mediaId && m.assetId === item.assetId);
  if (shared) return { action: "keep-bytes", reason: "shared-with-other-bin-item" };
  return { action: "delete-bytes", assetId: item.assetId };
}

/** Mặt tối thiểu của kho bytes mà bước xóa cần (AssetStore.remove khớp dạng này). */
export interface OrphanBytesStoreLike {
  remove(assetId: string, opts?: { force?: boolean }): Promise<boolean>;
}

/**
 * Xóa bytes của một asset khỏi kho. Best-effort tuyệt đối: không bao giờ
 * throw (kho bị chặn / remove từ chối vì refCount > 0 đều trả false) để
 * caller fire-and-forget không làm hỏng thao tác xóa khỏi bin.
 */
export async function deleteOrphanBinBytes(
  store: OrphanBytesStoreLike,
  assetId: string,
): Promise<boolean> {
  try {
    return await store.remove(assetId);
  } catch {
    return false;
  }
}
