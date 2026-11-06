/**
 * importAsset37T3.ts — Ingest file user import vào AssetStore
 * (Phase 9 đợt 37, luồng T3 — đóng nợ §5 của
 * docs/PHASE9_ROUND36_S5_REHYDRATE_LIMITS.md).
 *
 * Vấn đề: đường importFiles (store.ts) trước đợt này chỉ tạo MediaItem
 * với blob URL phiên hiện tại, KHÔNG ingest bytes vào AssetStore
 * (IndexedDB). Sau reload, bước rehydrate của đợt 36 S5 không tìm thấy
 * manifest cho media user import nên mọi clip đều hiện panel Relink oan
 * — dù file vẫn còn nguyên trên máy user, chỉ là bytes chưa từng bền.
 *
 * Module này là phần logic thuần, test được bằng Node của bước ingest
 * đó: caller (store.ts, chạy ở trình duyệt) truyền AssetStore thật;
 * unit test truyền fake store. Cố tình KHÔNG import value từ file anh
 * em (quy ước captionFollow.ts / rehydrate36S5.ts: Node ESM từ chối
 * import không đuôi `.ts`, còn tsc của app cấm đuôi `.ts` khi
 * allowImportingTsExtensions tắt) — chỉ import type, vốn bị xoá lúc
 * chạy nên không vi phạm quy ước.
 *
 * Hành vi (best-effort tuyệt đối, theo mẫu ingest mẫu của sample.ts):
 * - Item không có `file` (vd: media khôi phục từ rehydrate, chỉ có url)
 *   → bỏ qua, không gọi store.
 * - Store throw (IndexedDB/crypto.subtle không khả dụng, quota đầy) →
 *   trả manifest null, KHÔNG throw: import vẫn thành công trong phiên,
 *   chỉ không bền qua reload — đúng như mẫu trước đợt này, và panel
 *   Relink sau reload sẽ báo như cũ thay vì crash lúc import.
 * - Ingest với `name` = tên DUY NHẤT cuối cùng của item (sau bước làm
 *   duy nhất tên ở store.ts): bước rehydrate khớp tên thô theo
 *   originalName, nên ingest trước khi làm duy nhất tên sẽ ghi sai tên
 *   và reload vẫn Relink oan. Caller phải gọi hàm này SAU khi tên đã
 *   chốt — thứ tự này được khoá bằng test (meta.name = tên đã chốt).
 * - Dedup theo SHA-256 của AssetStore: cùng bytes đã ingest trước đó
 *   dưới tên khác → store trả về manifest cũ, originalName KHÁC tên
 *   item hiện tại → `nameMismatch = true`. Đợt 38 U3: caller (store.ts)
 *   khi thấy cờ này sẽ ghi tên hiện tại làm alias của manifest cũ
 *   (`AssetStore.addAlias`) để rehydrate khớp lại qua alias — KHÔNG cần
 *   chuyển src clip sang `asset:` (không chạm addMediaToTrack / export /
 *   render mapping). Nếu caller bỏ qua cờ (đường gọi cũ) thì giới hạn
 *   đợt 37 T3 §4 vẫn đúng: reload sẽ Relink cho tên bí danh đó.
 */
import type { AssetManifest } from "./assetStore";
import type { IngestProgressCallback } from "./ingestProgress39T5";

/** Hình dạng tối thiểu của MediaItem mà bước ingest cần. */
export interface ImportedItemLike {
  /** File gốc — bắt buộc phải có thì mới ingest được bytes. */
  file?: File | Blob | null;
  /** Tên ĐÃ làm duy nhất (sẽ thành originalName trong manifest). */
  name: string;
  width?: number;
  height?: number;
  /** Thời lượng giây (video/audio; ảnh = 0). */
  duration?: number;
  /** Thumbnail dataURL (nếu probe tạo được). */
  thumbnail?: string;
}

/** Mặt tối thiểu của AssetStore mà bước ingest cần. */
export interface ImportAssetStoreLike {
  ingest(
    blob: Blob,
    meta: {
      name?: string;
      width?: number;
      height?: number;
      duration?: number;
      thumbnail?: string;
    },
  ): Promise<AssetManifest>;
}

export interface IngestImportedResult {
  /** Manifest đã ingest; null khi không ingest được (không file / lỗi). */
  manifest: AssetManifest | null;
  /**
   * true khi manifest trả về mang originalName khác tên item (dedup
   * cùng bytes dưới tên khác) — rehydrate khớp tên thô sẽ không cứu
   * được item này sau reload (xem LIMITS §4).
   */
  nameMismatch: boolean;
}

/**
 * Ingest một item vừa import vào AssetStore. Không bao giờ throw:
 * mọi lỗi đều suy biến thành `{ manifest: null }` để import trong
 * phiên không bị hỏng vì bền vững thất bại.
 */
export async function ingestImportedItem(
  store: ImportAssetStoreLike,
  item: ImportedItemLike,
): Promise<IngestImportedResult> {
  if (!item.file) return { manifest: null, nameMismatch: false };
  try {
    const manifest = await store.ingest(item.file as Blob, {
      name: item.name,
      width: item.width,
      height: item.height,
      duration: item.duration,
      thumbnail: item.thumbnail,
    });
    return { manifest, nameMismatch: manifest.originalName !== item.name };
  } catch {
    return { manifest: null, nameMismatch: false };
  }
}

/** Mặt tối thiểu của store có ingest kèm tiến trình (đợt 39 T5). */
export interface ImportAssetStoreWithProgressLike extends ImportAssetStoreLike {
  ingestWithProgress?(
    blob: Blob,
    meta: {
      name?: string;
      width?: number;
      height?: number;
      duration?: number;
      thumbnail?: string;
    },
    onProgress?: IngestProgressCallback,
  ): Promise<AssetManifest>;
}

export interface IngestImportedProgressResult extends IngestImportedResult {
  /** true khi đường ingest có tiến trình thật được dùng (không fallback). */
  progressUsed: boolean;
}

/**
 * Đợt 39 T5 — như `ingestImportedItem` nhưng báo tiến trình băm/ghi qua
 * `onProgress` khi store có `ingestWithProgress`; store cũ không có
 * method đó thì fallback về `ingest` thường (không tiến trình, nhưng
 * vẫn trả kết quả đúng) và `progressUsed = false`. Không bao giờ throw.
 */
export async function ingestImportedItemWithProgress(
  store: ImportAssetStoreWithProgressLike,
  item: ImportedItemLike,
  onProgress?: IngestProgressCallback,
): Promise<IngestImportedProgressResult> {
  if (!item.file) return { manifest: null, nameMismatch: false, progressUsed: false };
  try {
    if (onProgress && typeof store.ingestWithProgress === "function") {
      const manifest = await store.ingestWithProgress(
        item.file as Blob,
        {
          name: item.name,
          width: item.width,
          height: item.height,
          duration: item.duration,
          thumbnail: item.thumbnail,
        },
        onProgress,
      );
      return { manifest, nameMismatch: manifest.originalName !== item.name, progressUsed: true };
    }
    const base = await ingestImportedItem(store, item);
    return { ...base, progressUsed: false };
  } catch {
    return { manifest: null, nameMismatch: false, progressUsed: false };
  }
}
