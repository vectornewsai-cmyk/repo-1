/**
 * assetStore.ts — AssetStore cho VCut Studio (R1-032, Batch C).
 *
 * Vấn đề (P2.2): project lưu `src` là tên file thô, không có manifest.
 * Media phải import lại sau khi reload; không có hash để phát hiện
 * trùng lặp hoặc file bị thay đổi.
 *
 * Thiết kế:
 * - `ingest(blob)` → tính SHA-256 (Web Crypto) → lưu blob vào IndexedDB
 *   → trả về manifest. File cùng nội dung (cùng hash) dùng chung assetId (dedup).
 * - Manifest nhẹ (không chứa blob) lưu ở store `manifests`, blob lưu ở
 *   store `blobs`, tra cứu dedup qua index duy nhất `bySha256`.
 * - Clip trong spec trỏ tới asset bằng `src: "asset:<assetId>"`
 *   (xem `assetSrcFor` / `isAssetSrc` / `assetIdFromSrc`).
 *
 * Không phụ thuộc thư viện ngoài; IDBFactory được inject để test được
 * trong Node (xem assetStore.test.ts). Mọi giới hạn trung thực ghi ở
 * ASSETSTORE_LIMITS.md.
 */

// Đợt 39 T5: import kèm đuôi .ts theo quy ước test strip-types của repo
// (test import "./assetStore.ts"); tsc với moduleResolution bundler mà
// không bật allowImportingTsExtensions sẽ báo TS5097 cho đường dẫn đuôi
// .ts nên dòng import này mang @ts-ignore có chủ đích — vite và node
// strip-types đều resolve được đuôi .ts (tiền lệ: nestedPreview.ts).
// @ts-ignore: xem ghi chú trên (TS5097, đuôi .ts cho strip-types)
import { hashBlobIncremental, IMPORT_BANNER_MIN_DISPLAY_MS, INGEST_CHUNKED_THRESHOLD } from "./ingestProgress39T5.ts";
import type { IngestProgressCallback } from "./ingestProgress39T5";

export const ASSET_DB_NAME = "vcut-studio-assets";
/**
 * Đợt 62 R7 — v2 thêm store `projectRefs` (sổ tham chiếu liên project,
 * xem ASSET_STORE_PROJECT_REFS): mỗi lần mở/lưu project ghi lại project
 * đó đang dùng asset nào, để UI dọn kho chặn xóa bytes mà project KHÁC
 * còn dùng. Nâng version 1 → 2: onupgradeneeded chỉ tạo store còn thiếu
 * nên DB v1 cũ (manifests + blobs) giữ nguyên dữ liệu khi nâng cấp.
 */
export const ASSET_DB_VERSION = 2;
export const ASSET_STORE_MANIFESTS = "manifests";
export const ASSET_STORE_BLOBS = "blobs";
export const ASSET_INDEX_SHA256 = "bySha256";
/**
 * Đợt 62 R7 — store sổ tham chiếu liên project (keyPath `projectKey`).
 * Một bản ghi = một project (khóa `name:<tên project>`, xem
 * projectKeyForName ở lib/projectAssetRefs62R7.ts) + tập assetId mà
 * project đó dùng lần ghi gần nhất. Ghi khi project được lưu/mở
 * (App effect + saveCurrentProject); đọc ở UI dọn kho để chặn xóa.
 * Giới hạn trung thực (xem PHASE9_ROUND62_R7_IDB_XPROJECT_LIMITS.md):
 * khóa theo TÊN nên hai file .vcut khác nhau mà trùng tên project sẽ
 * chung một bản ghi (ghi sau thắng); project chưa từng mở/lưu trên
 * trình duyệt này thì sổ không biết — sổ chỉ giảm rủi ro, không triệt
 * tiêu hoàn toàn.
 */
export const ASSET_STORE_PROJECT_REFS = "projectRefs";

/** Tiền tố src cho clip trỏ tới asset: `asset:<assetId>`. */
export const ASSET_SRC_PREFIX = "asset:";

export type AssetKind = "video" | "audio" | "image" | "other";

export interface AssetManifest {
  /** `a_` + 16 ký tự hex đầu của sha256. Dedup tra theo full hash. */
  assetId: string;
  originalName: string;
  /**
   * Đợt 38 U3 — tên bí danh cùng bytes: khi cùng nội dung được import /
   * relink dưới tên khác, tên đó được ghi thêm vào đây (xem `addAlias`)
   * để rehydrate khớp lại clip sau reload mà KHÔNG cần đổi src clip sang
   * `asset:` (không chạm export/render). Không có field này ở manifest cũ
   * vẫn mở bình thường (tuỳ chọn, đọc bằng `?? []`).
   */
  aliases?: string[];
  /** SHA-256 hex đầy đủ (64 ký tự) của bytes gốc. */
  sha256: string;
  /** Kích thước bytes. */
  size: number;
  mimeType: string;
  kind: AssetKind;
  width?: number;
  height?: number;
  /** Thời lượng giây (video/audio). */
  duration?: number;
  /** Thumbnail dataURL (tuỳ chọn, do caller tạo — AssetStore không probe). */
  thumbnail?: string;
  /**
   * Đợt 53 J5 — thông tin proxy preview bền qua reload (nợ I9 §5):
   * proxyUrl đầy đủ (kèm origin bridge lúc tạo) KHÔNG lưu ở đây vì cổng
   * bridge có thể đổi giữa các phiên (8787 → 8788); chỉ lưu ĐƯỜNG DẪN
   * do bridge trả (`/api/proxy/file/<tên>.mp4`) + chiều cao + kích thước
   * file proxy. Lúc rehydrate, đường dẫn được ghép với BRIDGE_URL hiện
   * tại thành proxyUrl đầy đủ. File proxy thật nằm trên đĩa bridge
   * (WORK_ROOT/proxies) nên vẫn phục vụ được sau reload chừng nào bridge
   * còn giữ WORK_ROOT đó; mất file (bridge đổi WORK_ROOT / xoá tay) thì
   * preview fallback về bản gốc nhờ error handler trong MediaPool.
   * Ghi bằng `AssetStore.setProxy`, đọc lại qua `rehydrate36S5`.
   */
  proxyPath?: string;
  /** Chiều cao proxy (480|720) — khớp proxyHeight của MediaItem. */
  proxyHeight?: number;
  /** Kích thước byte của chính file proxy (bridge trả lúc tạo). */
  proxySizeBytes?: number;
  /** Thời điểm ingest (ISO 8601). */
  ingestedAt: string;
  /**
   * Số tham chiếu đang giữ asset (bin item + clip). Đợt 61 R9 duy trì
   * thật bằng `syncAssetRefCounts` (idbCleanup61R9.ts) tái tính từ spec
   * + bin hiện tại — addRef/releaseRef vẫn dùng được cho đường tăng/
   * giảm từng bước, nhưng nguồn thật là lần đồng bộ (effect App.tsx,
   * importFiles, removeMediaFromBin, quét dọn kho). `remove()` từ chối
   * khi giá trị này > 0.
   */
  refCount: number;
}

export interface IngestMeta {
  name?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}

/**
 * Đợt 62 R7 — một bản ghi trong sổ tham chiếu liên project (store
 * `projectRefs`, keyPath `projectKey`). `assetIds` là tập asset mà
 * project này dùng ở lần ghi gần nhất (đã dedupe + sắp xếp); ghi đè
 * toàn bộ mỗi lần ghi (replace, không union — xem LIMITS R7 §1.2:
 * union chỉ phình và không bao giờ giải phóng, replace thì project
 * mở lại sẽ ghi lại đúng tập hiện tại của nó).
 *
 * Đợt 63 R7 — khóa sổ đổi sang id ổn định: bản ghi mới dùng khóa
 * `id:<projectId>` (xem projectKeyForId); bản ghi cũ khóa `name:...`
 * vẫn đọc được (tương thích ngược — xem LIMITS R7 đợt 63 §2.2).
 * Thêm `generation`: số thế hệ đơn điệu tăng của bản ghi, dùng cho
 * optimistic concurrency — lượt sync cũ (đọc generation cũ) không
 * được ghi đè dữ liệu mới (xem recordProjectRefs). Bản ghi legacy
 * thiếu field → coi như generation 0.
 */
export interface ProjectRefRecord {
  /** Khóa project: `id:<uuid>` (mới) hoặc `name:<tên>` (legacy đợt 62). */
  projectKey: string;
  /** Tên hiển thị của project (phần sau tiền tố `name:`). */
  projectName: string;
  /**
   * Đợt 63 R7 — projectId ổn định của project này (UUID). Vắng ở bản
   * ghi legacy khóa theo tên (trước đợt 63 chưa có id).
   */
  projectId?: string;
  /** Tập assetId project dùng ở lần ghi gần nhất. */
  assetIds: string[];
  /**
   * Đợt 63 R7 — số thế hệ của bản ghi (bắt đầu 1 ở lần ghi đầu).
   * Mỗi lần ghi thành công tăng 1; bản ghi legacy thiếu field = 0.
   */
  generation: number;
  /** Thời điểm ghi (ISO 8601). */
  updatedAt: string;
}

/** Kết quả ghi sổ tham chiếu: bản ghi đã lưu + tập asset có đổi không. */
export interface RecordProjectRefsResult {
  record: ProjectRefRecord;
  /** true khi tập assetId hoặc tên project khác lần ghi trước. */
  changed: boolean;
  /**
   * Đợt 63 R7 — true khi lần ghi này BỊ TỪ CHỐI vì stale: caller đọc
   * generation cũ (expectedGeneration) nhưng bản ghi đã được lượt sync
   * khác ghi mới hơn trong lúc đó → bản ghi giữ nguyên (record = bản
   * ghi hiện tại, generation không tăng). Caller KHÔNG broadcast và
   * sẽ thử lại ở lần sync sau với generation tươi.
   */
  stale: boolean;
}

/** Tùy chọn ghi sổ tham chiếu (đợt 63 R7). */
export interface RecordProjectRefsOpts {
  /**
   * projectId ổn định để persist vào bản ghi (khóa sổ đã là
   * `id:<uuid>` thì trùng với id trong khóa). Không truyền → giữ
   * projectId cũ của bản ghi (nếu có).
   */
  projectId?: string;
  /**
   * Generation mà caller đã đọc trước khi tính tập asset. Khi truyền:
   * chỉ ghi khi generation hiện tại của bản ghi vẫn bằng giá trị này
   * (optimistic concurrency — lượt sync cũ không ghi đè dữ liệu mới).
   * Không truyền → ghi luôn như trước (caller cũ / đường quên project).
   */
  expectedGeneration?: number;
}

export interface AssetStats {
  assets: number;
  bytes: number;
}

/** Một alias thừa đã bị `cleanupStaleAliases` xoá khỏi manifest. */
export interface StaleAliasRemoval {
  assetId: string;
  alias: string;
}

/** Báo cáo của `cleanupStaleAliases`. */
export interface StaleAliasReport {
  /** Số manifest đã quét. */
  scanned: number;
  /** Số manifest có ít nhất một alias thừa bị xoá. */
  cleaned: number;
  /** Từng alias đã xoá (để UI/log hiển thị rõ). */
  removed: StaleAliasRemoval[];
}

/** Mặt tối thiểu của IDBFactory mà AssetStore cần (để inject fake khi test). */
export interface IDBFactoryLike {
  open(name: string, version?: number): IDBOpenDBRequest;
  deleteDatabase(name: string): IDBOpenDBRequest;
}

/**
 * Đợt 40 V5 — mặt tối thiểu của Web Locks API mà AssetStore cần, để
 * inject fake khi test đa ngữ cảnh trong Node. Trình duyệt thật dùng
 * `navigator.locks` (Chrome 69+, Firefox 96+, Safari 15.4+ — Baseline
 * Widely Available; localhost là secure context nên dùng được).
 * Lock KHÔNG thay hàng đợi trong-tab: nó chỉ thêm lớp khoá liên tab.
 */
export interface LockManagerLike {
  request<T>(name: string, callback: () => Promise<T> | T): Promise<T>;
}

export interface AssetStoreOptions {
  idb?: IDBFactoryLike;
  dbName?: string;
  /**
   * Đợt 40 V5 — provider Web Locks. Mặc định đọc `navigator.locks`
   * nếu có; test truyền fake chia sẻ giữa các instance để mô phỏng
   * nhiều tab. Không truyền và trình duyệt không có locks → chỉ còn
   * hàng đợi trong-tab (giới hạn một tab của đợt 39 T5 vẫn đúng).
   */
  locks?: LockManagerLike | null;
}

// ---------------------------------------------------------------------------
// Helpers thuần
// ---------------------------------------------------------------------------

function defaultFactory(): IDBFactoryLike {
  const g = globalThis as unknown as { indexedDB?: IDBFactoryLike };
  if (!g.indexedDB) {
    throw new Error("IndexedDB không khả dụng trong môi trường này.");
  }
  return g.indexedDB;
}

/** SHA-256 hex của Blob/ArrayBuffer bằng Web Crypto API. */
export async function sha256Hex(data: Blob | ArrayBuffer): Promise<string> {
  const subtle = (globalThis as unknown as { crypto?: Crypto }).crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "Web Crypto API (crypto.subtle) không khả dụng — cần secure context (https:// hoặc localhost).",
    );
  }
  const buf = data instanceof ArrayBuffer ? data : await data.arrayBuffer();
  const digest = await subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function kindOfMime(mime: string, name: string): AssetKind {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("image/")) return "image";
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (["mp4", "mov", "webm", "mkv", "avi", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "oga", "m4a", "flac", "aac"].includes(ext)) return "audio";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) return "image";
  return "other";
}

function guessMime(name: string): string {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    aac: "audio/aac",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    avif: "image/avif",
  };
  return map[ext] || "application/octet-stream";
}

/** `src` cho clip trỏ tới asset. */
export function assetSrcFor(assetId: string): string {
  return `${ASSET_SRC_PREFIX}${assetId}`;
}

/** true nếu `src` là tham chiếu asset (`asset:<id>`). */
export function isAssetSrc(src: string): boolean {
  return typeof src === "string" && src.startsWith(ASSET_SRC_PREFIX);
}

/** Tách assetId từ `src`, null nếu không phải asset src. */
export function assetIdFromSrc(src: string): string | null {
  if (!isAssetSrc(src)) return null;
  const id = src.slice(ASSET_SRC_PREFIX.length);
  return id.length > 0 ? id : null;
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      reject(r.error instanceof Error ? r.error : new Error("IndexedDB request thất bại."));
    };
  });
}

/** Đợt 53 J5 — thông tin proxy ghi vào manifest (xem AssetStore.setProxy). */
export interface ProxyInfo {
  /** Đường dẫn bridge trả, vd `/api/proxy/file/clip__proxy_720p.mp4`. */
  proxyPath: string;
  /** Chiều cao proxy (480|720). */
  proxyHeight?: number;
  /** Kích thước byte của chính file proxy. */
  proxySizeBytes?: number;
}

/**
 * Đợt 53 J5 — kiểm tra đường dẫn proxy có đúng dạng bridge trả không:
 * `/api/proxy/file/<tên>.mp4`, tên chỉ chứa ký tự mà route GET của
 * bridge chấp nhận (chữ/số/._- + % của encodeURIComponent), không `..`,
 * không `/` lồng. Bridge vẫn tự chặn lại lúc serve nên đây chỉ là lưới
 * phía ghi (không lưu rác vào manifest).
 */
export function isValidProxyPath(p: unknown): p is string {
  if (typeof p !== "string") return false;
  if (!p.startsWith("/api/proxy/file/")) return false;
  const name = p.slice("/api/proxy/file/".length);
  if (!/^[A-Za-z0-9._%+-]+\.mp4$/.test(name)) return false;
  if (name.includes("..")) return false;
  return true;
}

// ---------------------------------------------------------------------------
// AssetStore
// ---------------------------------------------------------------------------

export class AssetStore {
  private readonly idb: IDBFactoryLike;
  private readonly dbName: string;
  private readonly locks: LockManagerLike | null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  /** Object URL đã cấp theo assetId — để thu hồi khi remove. */
  private readonly issuedURLs = new Map<string, Set<string>>();

  constructor(opts: AssetStoreOptions = {}) {
    this.idb = opts.idb ?? defaultFactory();
    this.dbName = opts.dbName ?? ASSET_DB_NAME;
    if (opts.locks !== undefined) {
      this.locks = opts.locks;
    } else {
      const nav = globalThis as unknown as {
        navigator?: { locks?: LockManagerLike };
      };
      const candidate = nav.navigator?.locks;
      this.locks =
        candidate && typeof candidate.request === "function" ? candidate : null;
    }
  }

  private openDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        let request: IDBOpenDBRequest;
        try {
          request = this.idb.open(this.dbName, ASSET_DB_VERSION);
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
          return;
        }
        request.onupgradeneeded = () => {
          const d = request.result;
          if (!d.objectStoreNames.contains(ASSET_STORE_MANIFESTS)) {
            const s = d.createObjectStore(ASSET_STORE_MANIFESTS, { keyPath: "assetId" });
            s.createIndex(ASSET_INDEX_SHA256, "sha256", { unique: true });
          }
          if (!d.objectStoreNames.contains(ASSET_STORE_BLOBS)) {
            d.createObjectStore(ASSET_STORE_BLOBS);
          }
          // Đợt 62 R7 (DB v2) — tạo store sổ tham chiếu liên project nếu
          // chưa có; DB v1 cũ nâng cấp lên v2 vẫn giữ nguyên manifests
          // + blobs (chỉ thêm store mới).
          if (!d.objectStoreNames.contains(ASSET_STORE_PROJECT_REFS)) {
            d.createObjectStore(ASSET_STORE_PROJECT_REFS, { keyPath: "projectKey" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.dbPromise = null;
          reject(
            request.error instanceof Error ? request.error : new Error("Mở IndexedDB thất bại."),
          );
        };
      });
    }
    return this.dbPromise;
  }

  /**
   * Ghi manifest + blob mới (hoặc trả về manifest đã thắng khi dedup).
   * Dùng chung cho `ingest` (băm WebCrypto một lần) và
   * `ingestWithProgress` (băm tăng dần có tiến trình) để hai đường
   * không lệch nhau về ngữ nghĩa dedup.
   */
  private async putManifest(
    hash: string,
    assetId: string,
    input: Blob,
    meta: IngestMeta,
    name: string,
    mimeType: string,
  ): Promise<AssetManifest> {
    const putNew = async (): Promise<AssetManifest> => {
      const db = await this.openDb();
      const tx = db.transaction([ASSET_STORE_MANIFESTS, ASSET_STORE_BLOBS], "readwrite");
      const mStore = tx.objectStore(ASSET_STORE_MANIFESTS);
      const bStore = tx.objectStore(ASSET_STORE_BLOBS);
      const existing = await req<AssetManifest | undefined>(
        mStore.index(ASSET_INDEX_SHA256).get(hash),
      );
      if (existing) return existing;
      const manifest: AssetManifest = {
        assetId,
        originalName: name,
        sha256: hash,
        size: input.size,
        mimeType,
        kind: kindOfMime(mimeType, name),
        ingestedAt: new Date().toISOString(),
        refCount: 0,
      };
      if (meta.width !== undefined) manifest.width = meta.width;
      if (meta.height !== undefined) manifest.height = meta.height;
      if (meta.duration !== undefined) manifest.duration = meta.duration;
      if (meta.thumbnail !== undefined) manifest.thumbnail = meta.thumbnail;
      await req(mStore.put(manifest));
      await req(bStore.put(input, assetId));
      return manifest;
    };

    try {
      return await putNew();
    } catch (e) {
      // Hai ingest song song cùng nội dung: cả hai đều miss index rồi put —
      // bản thứ hai vấp unique constraint → đọc lại bản đã thắng.
      if (e instanceof Error && e.name === "ConstraintError") {
        const db = await this.openDb();
        const winner = await req<AssetManifest | undefined>(
          db
            .transaction(ASSET_STORE_MANIFESTS, "readonly")
            .objectStore(ASSET_STORE_MANIFESTS)
            .index(ASSET_INDEX_SHA256)
            .get(hash),
        );
        if (winner) return winner;
      }
      throw e;
    }
  }

  /**
   * Ingest một Blob/File vào store. Tính SHA-256; nếu hash đã tồn tại thì
   * trả về manifest cũ (dedup) mà không lưu trùng bytes.
   */
  async ingest(input: Blob, meta: IngestMeta = {}): Promise<AssetManifest> {
    if (!input || typeof input.arrayBuffer !== "function" || typeof input.size !== "number") {
      throw new Error("ingest cần một Blob/File hợp lệ.");
    }
    const fileName = (input as Partial<File>).name;
    const name = meta.name || fileName || "unnamed";
    const mimeType = input.type || guessMime(name);
    const hash = await sha256Hex(input);
    const assetId = `a_${hash.slice(0, 16)}`;
    return this.putManifest(hash, assetId, input, meta, name, mimeType);
  }

  /**
   * Đợt 39 T5 — ingest có tiến trình (dùng cho relink file lớn).
   * Giống `ingest` về ngữ nghĩa dedup, khác ở chỗ băm tăng dần theo lát
   * 8 MiB và báo `onProgress` sau mỗi lát (pha "hashing"), rồi báo pha
   * "storing" trước khi ghi IDB và pha "done" sau khi ghi xong. Băm
   * thuần JS chậm hơn WebCrypto (đo thật trong LIMITS đợt 39 T5) nhưng
   * là cái giá để UI có % thật; đường `ingest` cũ giữ nguyên cho các
   * đường không cần tiến trình. Giai đoạn "storing" là một lần `put`
   * nguyên tử nên KHÔNG có % theo byte — callback chỉ báo pha, UI phải
   * hiển thị đúng như vậy, không nội suy %.
   * Hybrid (đợt 39 T5): file ≤ INGEST_CHUNKED_THRESHOLD (64 MiB) dùng
   * WebCrypto một lần cho nhanh, callback chỉ nhận một sự kiện hashing
   * chốt 100% (báo đã băm xong, không phải tiến trình từng lát).
   */
  async ingestWithProgress(
    input: Blob,
    meta: IngestMeta = {},
    onProgress?: IngestProgressCallback,
  ): Promise<AssetManifest> {
    if (!input || typeof input.arrayBuffer !== "function" || typeof input.size !== "number") {
      throw new Error("ingest cần một Blob/File hợp lệ.");
    }
    const fileName = (input as Partial<File>).name;
    const name = meta.name || fileName || "unnamed";
    const mimeType = input.type || guessMime(name);
    // ROUND43-Y3: bọc callback để đo thời gian hiển thị banner từ sự
    // kiện tiến trình đầu tiên (không đo từ lúc bắt đầu băm: nhánh
    // one-shot chỉ bắn event đầu tiên khi băm xong, trước đó banner
    // chưa hề xuất hiện nên pad tính từ đó mới đúng ý nghĩa hiển thị).
    let firstProgressAt = 0;
    const timedProgress: IngestProgressCallback | undefined = onProgress
      ? (ev) => {
          if (firstProgressAt === 0) firstProgressAt = Date.now();
          onProgress(ev);
        }
      : undefined;
    const hash =
      input.size <= INGEST_CHUNKED_THRESHOLD
        ? await sha256Hex(input).then(async (h) => {
            timedProgress?.({ phase: "hashing", bytesDone: input.size, totalBytes: input.size });
            // Đợt 42 X3: như hashBlobIncremental — nhường 1 macrotask để
            // banner kịp vẽ sự kiện hashing 100% trước khi storing tới.
            // Không có dòng này, click-test headed chứng minh UI chỉ vẽ
            // storing (React batch 2 setState liên tiếp), trái với mô tả
            // "UI hiển thị đúng như vậy" ở INGEST_CHUNKED_THRESHOLD.
            await new Promise((r) => setTimeout(r, 0));
            return h;
          })
        : await hashBlobIncremental(input, timedProgress);
    // ROUND43-Y3 (min-display): nếu banner mới hiện chưa đủ 500 ms thì
    // chờ nốt trước khi sang pha storing, để mắt người đọc được %/trạng
    // thái. Chỉ pad trên đường thành công có callback (file lớn băm lâu
    // hơn 500 ms thì pad = 0, không làm chậm thêm); lỗi trong lúc băm
    // throw trước dòng này nên đường thất bại không bị giữ banner — và
    // panel tự clear banner trong catch của nó, không kẹt.
    if (timedProgress && firstProgressAt > 0) {
      const elapsed = Date.now() - firstProgressAt;
      if (elapsed < IMPORT_BANNER_MIN_DISPLAY_MS) {
        await new Promise((r) => setTimeout(r, IMPORT_BANNER_MIN_DISPLAY_MS - elapsed));
      }
    }
    const assetId = `a_${hash.slice(0, 16)}`;
    onProgress?.({ phase: "storing", bytesDone: input.size, totalBytes: input.size });
    const manifest = await this.putManifest(hash, assetId, input, meta, name, mimeType);
    onProgress?.({ phase: "done", bytesDone: input.size, totalBytes: input.size });
    return manifest;
  }

  /** Manifest của asset, null nếu không tồn tại. */
  async get(assetId: string): Promise<AssetManifest | null> {
    const db = await this.openDb();
    const m = await req<AssetManifest | undefined>(
      db
        .transaction(ASSET_STORE_MANIFESTS, "readonly")
        .objectStore(ASSET_STORE_MANIFESTS)
        .get(assetId),
    );
    return m ?? null;
  }

  /** Blob gốc của asset, null nếu không tồn tại. */
  async getBlob(assetId: string): Promise<Blob | null> {
    const db = await this.openDb();
    const b = await req<Blob | undefined>(
      db.transaction(ASSET_STORE_BLOBS, "readonly").objectStore(ASSET_STORE_BLOBS).get(assetId),
    );
    return b ?? null;
  }

  /**
   * Object URL (blob:) cho asset — dùng cho preview <video>/<img>.
   * Caller KHÔNG cần tự revoke từng URL: gọi `revokeObjectURLs(assetId)`
   * (hoặc để `remove()` tự thu hồi).
   */
  async objectURL(assetId: string): Promise<string | null> {
    const blob = await this.getBlob(assetId);
    if (!blob) return null;
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      throw new Error("URL.createObjectURL không khả dụng trong môi trường này.");
    }
    const url = URL.createObjectURL(blob);
    let set = this.issuedURLs.get(assetId);
    if (!set) {
      set = new Set();
      this.issuedURLs.set(assetId, set);
    }
    set.add(url);
    return url;
  }

  /** Thu hồi object URL đã cấp (một asset hoặc tất cả). */
  revokeObjectURLs(assetId?: string): void {
    if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") return;
    const revoke = (id: string) => {
      const set = this.issuedURLs.get(id);
      if (set) {
        for (const u of set) URL.revokeObjectURL(u);
        this.issuedURLs.delete(id);
      }
    };
    if (assetId !== undefined) revoke(assetId);
    else for (const id of [...this.issuedURLs.keys()]) revoke(id);
  }

  /** Danh sách manifest (nhẹ — không kèm blob). */
  async list(): Promise<AssetManifest[]> {
    const db = await this.openDb();
    return req<AssetManifest[]>(
      db.transaction(ASSET_STORE_MANIFESTS, "readonly").objectStore(ASSET_STORE_MANIFESTS).getAll(),
    );
  }

  async stats(): Promise<AssetStats> {
    const manifests = await this.list();
    return {
      assets: manifests.length,
      bytes: manifests.reduce((s, m) => s + m.size, 0),
    };
  }

  private async bumpRef(assetId: string, delta: 1 | -1): Promise<AssetManifest | null> {
    const db = await this.openDb();
    const tx = db.transaction(ASSET_STORE_MANIFESTS, "readwrite");
    const store = tx.objectStore(ASSET_STORE_MANIFESTS);
    const m = await req<AssetManifest | undefined>(store.get(assetId));
    if (!m) return null;
    m.refCount = Math.max(0, m.refCount + delta);
    await req(store.put(m));
    return m;
  }

  /** Đánh dấu một clip bắt đầu dùng asset. */
  async addRef(assetId: string): Promise<AssetManifest | null> {
    return this.bumpRef(assetId, 1);
  }

  /** Đánh dấu một clip ngừng dùng asset (không xoá blob). */
  async releaseRef(assetId: string): Promise<AssetManifest | null> {
    return this.bumpRef(assetId, -1);
  }

  /**
   * Đợt 61 R9 — ghi đè refCount bằng giá trị tuyệt đối (đã clamp ≥ 0).
   * Dùng cho `syncAssetRefCounts` (idbCleanup61R9.ts) tái tính toàn bộ
   * từ spec + bin hiện tại: ghi đè thì mọi đường đổi spec/bin đều được
   * phủ mà không cần móc tăng/giảm từng bước. Chỉ ghi khi khác giá trị
   * cũ là việc của caller (sync tự bỏ qua khi bằng nhau). Trả null khi
   * asset không tồn tại. Không throw khi IDB lỗi (caller best-effort) —
   * lỗi đọc/ghi đều trả null để sync đếm vào errors.
   */
  async setRefCount(assetId: string, n: number): Promise<AssetManifest | null> {
    try {
      const want = Math.max(0, Math.floor(n));
      const db = await this.openDb();
      const tx = db.transaction(ASSET_STORE_MANIFESTS, "readwrite");
      const store = tx.objectStore(ASSET_STORE_MANIFESTS);
      const m = await req<AssetManifest | undefined>(store.get(assetId));
      if (!m) return null;
      if (m.refCount === want) return m;
      const next: AssetManifest = { ...m, refCount: want };
      await req(store.put(next));
      return next;
    } catch {
      return null;
    }
  }

  /**
   * Đợt 53 J5 — ghi/xoá thông tin proxy của 1 asset vào manifest.
   * - Ghi: `setProxy(id, { proxyPath, proxyHeight, proxySizeBytes })` —
   *   trả manifest mới; proxyPath phải khớp dạng bridge trả, nếu không
   *   trả null và KHÔNG ghi (không lưu rác vào manifest).
   * - Xoá: `setProxy(id, null)` — gỡ 3 trường proxy khỏi manifest.
   * - Asset không tồn tại → null. Không throw khi IDB lỗi (caller
   *   best-effort): lỗi ghi chỉ mất bền vững của proxy, proxy trong
   *   phiên vẫn dùng được.
   * Không cần tăng ASSET_DB_VERSION: manifest là object thuần, field
   * mới chỉ là key thêm — manifest cũ đọc lên vẫn hợp lệ (thiếu field).
   */
  async setProxy(
    assetId: string,
    proxy: ProxyInfo | null,
  ): Promise<AssetManifest | null> {
    if (proxy !== null && !isValidProxyPath(proxy.proxyPath)) return null;
    if (
      proxy !== null &&
      proxy.proxyHeight !== undefined &&
      proxy.proxyHeight !== 480 &&
      proxy.proxyHeight !== 720
    ) {
      return null;
    }
    if (
      proxy !== null &&
      proxy.proxySizeBytes !== undefined &&
      (typeof proxy.proxySizeBytes !== "number" ||
        !Number.isFinite(proxy.proxySizeBytes) ||
        proxy.proxySizeBytes <= 0)
    ) {
      return null;
    }
    try {
      const db = await this.openDb();
      const tx = db.transaction([ASSET_STORE_MANIFESTS], "readwrite");
      const store = tx.objectStore(ASSET_STORE_MANIFESTS);
      const m = await req<AssetManifest | undefined>(store.get(assetId));
      if (!m) return null;
      const next: AssetManifest = { ...m };
      if (proxy === null) {
        delete next.proxyPath;
        delete next.proxyHeight;
        delete next.proxySizeBytes;
      } else {
        next.proxyPath = proxy.proxyPath;
        if (proxy.proxyHeight !== undefined) next.proxyHeight = proxy.proxyHeight;
        if (proxy.proxySizeBytes !== undefined) next.proxySizeBytes = proxy.proxySizeBytes;
      }
      await req(store.put(next));
      return next;
    } catch {
      return null;
    }
  }

  /**
   * Xoá asset (manifest + blob). Từ chối (trả false) khi refCount > 0
   * trừ khi `force: true`. Trả false khi asset không tồn tại.
   */
  async remove(assetId: string, opts: { force?: boolean } = {}): Promise<boolean> {
    const m = await this.get(assetId);
    if (!m) return false;
    if (m.refCount > 0 && !opts.force) return false;
    const db = await this.openDb();
    const tx = db.transaction([ASSET_STORE_MANIFESTS, ASSET_STORE_BLOBS], "readwrite");
    await req(tx.objectStore(ASSET_STORE_BLOBS).delete(assetId));
    await req(tx.objectStore(ASSET_STORE_MANIFESTS).delete(assetId));
    this.revokeObjectURLs(assetId);
    return true;
  }

  // -------------------------------------------------------------------------
  // Đợt 62 R7 — sổ tham chiếu liên project (store `projectRefs`).
  //
  // Bối cảnh (nợ đợt 61 R9 §5.1): xóa bytes ở project này có thể ảnh
  // hưởng file .vcut KHÁC dùng chung bytes vì kho là toàn cục mà không
  // có sổ nào ghi project nào dùng asset nào. Sổ này đóng nợ đó: mỗi
  // lần project được lưu/mở (App effect debounce + saveCurrentProject),
  // ghi lại tập assetId project đó dùng; UI dọn kho đọc sổ trước khi
  // xóa và chặn xóa bytes mà project KHÁC còn dùng.
  //
  // Ngữ nghĩa ghi: REPLACE toàn bộ tập asset của khóa đó (ghi sau
  // thắng). Project mở lại sẽ ghi lại đúng tập hiện tại của nó nên
  // bản ghi không phình; mặt trái là hai file .vcut khác nhau mà
  // trùng tên project sẽ chung một khóa (ghi sau thắng — xem LIMITS
  // R7 §1.3). Ghi là best-effort: lỗi IDB thì throw để caller quyết
  // (App effect nuốt lặng; UI quên project báo lỗi).
  // -------------------------------------------------------------------------

  /**
   * Ghi (ghi đè) tập asset mà một project đang dùng. assetIds được
   * dedupe + sắp xếp để so sánh tập ổn định; chuỗi rỗng bị loại.
   * Chạy dưới lock liên tab `vcut-projrefs` nên hai tab ghi cùng lúc
   * không làm mất bản ghi của nhau. Trả về bản ghi đã lưu + `changed`
   * (true khi tập asset hoặc tên khác lần ghi trước — caller dùng để
   * quyết có broadcast cho tab khác quét lại không).
   *
   * Đợt 63 R7 — optimistic concurrency qua `opts.expectedGeneration`:
   * kiểm tra generation NGAY TRONG lock (sau khi đọc bản ghi hiện
   * tại): khác với generation caller đã đọc → từ chối ghi (`stale:
   * true`, bản ghi giữ nguyên, generation không tăng). Nhờ đó lượt
   * sync cũ (tính tập asset từ snapshot cũ) không ghi đè dữ liệu mới
   * của lượt sync khác đã ghi trong lúc đó. Không truyền
   * expectedGeneration → ghi luôn như trước (tương thích caller cũ).
   * Mỗi lần ghi thành công tăng `generation` lên 1 (bản ghi legacy
   * thiếu generation được coi là 0).
   */
  async recordProjectRefs(
    projectKey: string,
    projectName: string,
    assetIds: ReadonlyArray<string>,
    opts?: RecordProjectRefsOpts,
  ): Promise<RecordProjectRefsResult> {
    if (typeof projectKey !== "string" || projectKey.length === 0) {
      throw new Error("recordProjectRefs cần projectKey khác rỗng.");
    }
    const clean = [...new Set(assetIds.filter((a) => typeof a === "string" && a.length > 0))].sort();
    const name = typeof projectName === "string" && projectName.trim().length > 0 ? projectName.trim() : "Dự án không tên";
    return this.withProjRefsLock(async () => {
      const db = await this.openDb();
      const tx = db.transaction([ASSET_STORE_PROJECT_REFS], "readwrite");
      const store = tx.objectStore(ASSET_STORE_PROJECT_REFS);
      const prev = await req<ProjectRefRecord | undefined>(store.get(projectKey));
      const prevGeneration = prev?.generation ?? 0;
      // Đợt 63 R7 — kiểm tra stale TRƯỚC mọi shortcut: caller đọc
      // generation cũ thì kết luận "tập không đổi" của nó cũng có thể
      // lỗi thời (tên/tập đã đổi sau lúc nó đọc) nên không được no-op
      // im lặng — trả stale để caller đọc lại tươi ở lần sync sau.
      if (
        opts?.expectedGeneration !== undefined &&
        prev !== undefined &&
        prevGeneration !== opts.expectedGeneration
      ) {
        return { record: prev, changed: false, stale: true };
      }
      const same =
        prev !== undefined &&
        prev.projectName === name &&
        prev.assetIds.length === clean.length &&
        prev.assetIds.every((a, i) => a === clean[i]);
      // Tập không đổi → không ghi lại (tránh updatedAt churn mỗi lần
      // autosave effect chạy; broadcast cũng không cần vì không có gì mới).
      if (same && prev !== undefined) return { record: prev, changed: false, stale: false };
      const record: ProjectRefRecord = {
        projectKey,
        projectName: name,
        assetIds: clean,
        generation: prevGeneration + 1,
        updatedAt: new Date().toISOString(),
      };
      // Đợt 63 R7 — persist projectId vào bản ghi (opts.projectId mới
      // nhất thắng; không truyền thì giữ id cũ của bản ghi, nếu có).
      const nextProjectId = opts?.projectId ?? prev?.projectId;
      if (typeof nextProjectId === "string" && nextProjectId.length > 0) {
        record.projectId = nextProjectId;
      }
      await req(store.put(record));
      return { record, changed: true, stale: false };
    });
  }

  /** Mọi bản ghi sổ tham chiếu (để UI dọn kho liệt kê + kiểm tra trước khi xóa). */
  async listProjectRefs(): Promise<ProjectRefRecord[]> {
    const db = await this.openDb();
    return req<ProjectRefRecord[]>(
      db.transaction(ASSET_STORE_PROJECT_REFS, "readonly").objectStore(ASSET_STORE_PROJECT_REFS).getAll(),
    );
  }

  /** Các project (bản ghi) đang dùng một asset. Rỗng = không project nào ghi nhận dùng nó. */
  async getProjectsUsingAsset(assetId: string): Promise<ProjectRefRecord[]> {
    const all = await this.listProjectRefs();
    return all.filter((r) => r.assetIds.includes(assetId));
  }

  /**
   * Quên một project khỏi sổ (user bấm "Quên" ở UI dọn kho khi file
   * .vcut đó đã xóa khỏi máy, hoặc tên project bị trùng khóa). Trả
   * true khi bản ghi đã tồn tại và bị xóa, false khi khóa không có.
   * Chỉ xóa BẢN GHI, không xóa bytes — bytes chỉ mất khi user xóa ở
   * panel sau khi quét lại.
   */
  async forgetProjectRefs(projectKey: string): Promise<boolean> {
    return this.withProjRefsLock(async () => {
      const db = await this.openDb();
      const tx = db.transaction([ASSET_STORE_PROJECT_REFS], "readwrite");
      const store = tx.objectStore(ASSET_STORE_PROJECT_REFS);
      const prev = await req<ProjectRefRecord | undefined>(store.get(projectKey));
      if (!prev) return false;
      await req(store.delete(projectKey));
      return true;
    });
  }

  /**
   * Hàng đợi tuần tự hoá các thao tác alias theo assetId (đợt 39 T5).
   * Mỗi thao tác alias chạy nối tiếp nhau trong cùng instance này, đọc
   * manifest TƯƠI sau khi thao tác trước đã ghi xong — nhờ đó hai
   * `addAlias` song song không còn làm mất alias (nợ đợt 38 U3 §4).
   * Đợt 40 V5 thêm `withAliasLock` (Web Locks) trong hàng đợi này nên
   * hai tab cùng origin cũng tuần tự hoá qua lock theo assetId khi
   * trình duyệt có `navigator.locks`; trình duyệt không có locks thì
   * giới hạn một tab của đợt 39 T5 vẫn đúng — xem LIMITS đợt 40 V5.
   */
  private readonly aliasQueues = new Map<string, Promise<void>>();

  /**
   * Đợt 40 V5 — khoá liên tab cho một thao tác alias. Tên lock theo
   * assetId (`vcut-alias:<assetId>`, assetId chỉ chứa `a_` + hex nên
   * an toàn làm tên lock). Web Locks là mutex thật theo origin: hai tab
   * cùng origin không bao giờ chạy callback cùng tên đồng thời, và lock
   * tự giải phóng khi tab giữ nó đóng/crash — không có flag kẹt như
   * localStorage. Nếu `locks.request` throw (trình duyệt lạ, lock bị
   * abort) thì vẫn chạy op không khoá liên tab thay vì làm hỏng ghi
   * alias: hàng đợi trong-tab vẫn giữ, nhưng bảo đảm liên tab của lần
   * gọi đó mất — caller best-effort (import/relink) chấp nhận được,
   * và LIMITS ghi rõ fallback này. KHÔNG dùng BroadcastChannel thay
   * thế: election bằng message không có mutual exclusion nguyên tử,
   * phức tạp hơn mà yếu hơn Web Locks có sẵn.
   */
  private async withAliasLock<T>(assetId: string, op: () => Promise<T>): Promise<T> {
    if (!this.locks) return op();
    try {
      return await this.locks.request(`vcut-alias:${assetId}`, op);
    } catch {
      return op();
    }
  }

  /**
   * Đợt 62 R7 — khoá liên tab cho MỌI thao tác ghi sổ tham chiếu
   * (`vcut-projrefs`, một tên lock chung — khác lock alias theo
   * assetId vì sổ là một bảng chung). Hai tab cùng origin ghi sổ
   * cùng lúc sẽ tuần tự hoá qua Web Locks khi trình duyệt có
   * `navigator.locks`; không có locks thì vẫn chạy (giới hạn một tab,
   * cùng fallback với withAliasLock). Lock tự giải phóng khi tab giữ
   * nó đóng/crash nên không có flag kẹt.
   */
  private async withProjRefsLock<T>(op: () => Promise<T>): Promise<T> {
    if (!this.locks) return op();
    try {
      return await this.locks.request("vcut-projrefs", op);
    } catch {
      return op();
    }
  }

  private enqueueAliasOp<T>(assetId: string, op: () => Promise<T>): Promise<T> {
    const prev = this.aliasQueues.get(assetId) ?? Promise.resolve();
    // Thứ tự lồng: hàng đợi trong-tab trước, lock liên tab trong —
    // op chỉ xin lock sau khi op trước cùng instance đã xong nên cùng
    // một tab không bao giờ tự deadlock với chính mình; addAliases gọi
    // addAlias tuần tự (await từng cái) nên cũng không lồng lock.
    const run = prev.then(() => this.withAliasLock(assetId, op));
    // Chuỗi chờ luôn resolve để thao tác sau không bị kẹt vì lỗi trước;
    // caller vẫn nhận đúng kết quả/lỗi của chính mình qua `run`.
    this.aliasQueues.set(
      assetId,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run;
  }

  /**
   * Đợt 38 U3 — ghi bí danh cho một asset đã dedup (nay tuần tự hoá theo
   * assetId, đợt 39 T5 — xem `aliasQueues`).
   * - Trả false (không ghi) khi asset không tồn tại, alias rỗng, alias
   *   trùng originalName của chính asset, hoặc alias trùng originalName
   *   của MỘT asset khác (tránh che tên thật).
   * - Alias đã có sẵn → trả true, không nhân đôi.
   */
  async addAlias(assetId: string, alias: string): Promise<boolean> {
    return this.enqueueAliasOp(assetId, async () => {
      if (!alias) return false;
      const manifests = await this.list();
      const target = manifests.find((m) => m.assetId === assetId);
      if (!target) return false;
      if (target.originalName === alias) return false;
      if (manifests.some((m) => m.assetId !== assetId && m.originalName === alias)) {
        return false;
      }
      const aliases = target.aliases ?? [];
      if (aliases.includes(alias)) return true;
      const db = await this.openDb();
      const tx = db.transaction([ASSET_STORE_MANIFESTS], "readwrite");
      await req(
        tx.objectStore(ASSET_STORE_MANIFESTS).put({ ...target, aliases: [...aliases, alias] }),
      );
      return true;
    });
  }

  /**
   * Đợt 39 T5 — ghi nhiều bí danh cho một asset. Chạy tuần tự qua cùng
   * hàng đợi `addAlias` nên an toàn khi gọi song song với `addAlias`
   * khác; trả về số alias trong danh sách thực sự xuất hiện mới sau
   * batch (alias đã có sẵn / bị guard từ chối không tính).
   */
  async addAliases(assetId: string, aliases: string[]): Promise<number> {
    const before = new Set((await this.get(assetId))?.aliases ?? []);
    for (const alias of aliases) {
      await this.addAlias(assetId, alias);
    }
    const after = new Set((await this.get(assetId))?.aliases ?? []);
    let added = 0;
    for (const alias of new Set(aliases)) {
      if (after.has(alias) && !before.has(alias)) added += 1;
    }
    return added;
  }

  /**
   * Đợt 39 T5 — dọn alias thừa: alias trùng tên thật (originalName) của
   * bất kỳ manifest nào. Loại alias này chỉ tồn tại khi nó được tạo
   * trước khi đợt 38 U3 thêm guard (guard nay từ chối ngay lúc ghi);
   * `planRehydrate` vốn đã ưu tiên tên thật nên alias thừa không che
   * asset khác, nhưng vẫn nên dọn để manifest sạch. Trả về báo cáo
   * (không throw khi không có gì để dọn). Chạy qua hàng đợi alias của
   * từng asset nên không đua với `addAlias` đang bay trong cùng
   * instance. Đây là thao tác bảo trì: chỉ chạy khi không có
   * import/relink đang bay (UI RelinkPanel gọi khi user bấm nút dọn).
   */
  async cleanupStaleAliases(): Promise<StaleAliasReport> {
    const snapshot = await this.list();
    const realNames = new Set(snapshot.map((m) => m.originalName));
    const removed: StaleAliasRemoval[] = [];
    let cleaned = 0;
    for (const manifest of snapshot) {
      const aliases = manifest.aliases ?? [];
      const stale = aliases.filter((a) => realNames.has(a));
      if (stale.length === 0) continue;
      // Chạy qua hàng đợi của asset để không đua với addAlias đang bay:
      // đọc manifest tươi trong hàng đợi, chỉ xoá alias vẫn còn thừa.
      const removedHere = await this.enqueueAliasOp(manifest.assetId, async () => {
        const fresh = await this.get(manifest.assetId);
        if (!fresh) return [] as string[];
        const current = fresh.aliases ?? [];
        const nowReal = new Set((await this.list()).map((m) => m.originalName));
        const stillStale = current.filter((a) => nowReal.has(a));
        if (stillStale.length === 0) return [] as string[];
        const db = await this.openDb();
        const tx = db.transaction([ASSET_STORE_MANIFESTS], "readwrite");
        await req(
          tx
            .objectStore(ASSET_STORE_MANIFESTS)
            .put({ ...fresh, aliases: current.filter((a) => !nowReal.has(a)) }),
        );
        return stillStale;
      });
      if (removedHere.length > 0) {
        cleaned += 1;
        for (const alias of removedHere) removed.push({ assetId: manifest.assetId, alias });
      }
    }
    return { scanned: snapshot.length, cleaned, removed };
  }

  /** Xoá toàn bộ asset (manifest + blob). */
  async clear(): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction([ASSET_STORE_MANIFESTS, ASSET_STORE_BLOBS], "readwrite");
    await req(tx.objectStore(ASSET_STORE_BLOBS).clear());
    await req(tx.objectStore(ASSET_STORE_MANIFESTS).clear());
    this.revokeObjectURLs();
  }

  /** Đóng kết nối DB. */
  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
    this.revokeObjectURLs();
  }

  /** Xoá hẳn database (reset). */
  async destroy(): Promise<void> {
    await this.close();
    await req(this.idb.deleteDatabase(this.dbName));
  }
}
