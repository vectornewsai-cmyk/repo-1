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

export const ASSET_DB_NAME = "vcut-studio-assets";
export const ASSET_DB_VERSION = 1;
export const ASSET_STORE_MANIFESTS = "manifests";
export const ASSET_STORE_BLOBS = "blobs";
export const ASSET_INDEX_SHA256 = "bySha256";

/** Tiền tố src cho clip trỏ tới asset: `asset:<assetId>`. */
export const ASSET_SRC_PREFIX = "asset:";

export type AssetKind = "video" | "audio" | "image" | "other";

export interface AssetManifest {
  /** `a_` + 16 ký tự hex đầu của sha256. Dedup tra theo full hash. */
  assetId: string;
  originalName: string;
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
  /** Thời điểm ingest (ISO 8601). */
  ingestedAt: string;
  /** Số clip đang tham chiếu. UI chịu trách nhiệm addRef/releaseRef. */
  refCount: number;
}

export interface IngestMeta {
  name?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}

export interface AssetStats {
  assets: number;
  bytes: number;
}

/** Mặt tối thiểu của IDBFactory mà AssetStore cần (để inject fake khi test). */
export interface IDBFactoryLike {
  open(name: string, version?: number): IDBOpenDBRequest;
  deleteDatabase(name: string): IDBOpenDBRequest;
}

export interface AssetStoreOptions {
  idb?: IDBFactoryLike;
  dbName?: string;
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

// ---------------------------------------------------------------------------
// AssetStore
// ---------------------------------------------------------------------------

export class AssetStore {
  private readonly idb: IDBFactoryLike;
  private readonly dbName: string;
  private dbPromise: Promise<IDBDatabase> | null = null;
  /** Object URL đã cấp theo assetId — để thu hồi khi remove. */
  private readonly issuedURLs = new Map<string, Set<string>>();

  constructor(opts: AssetStoreOptions = {}) {
    this.idb = opts.idb ?? defaultFactory();
    this.dbName = opts.dbName ?? ASSET_DB_NAME;
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
