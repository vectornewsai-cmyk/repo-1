/**
 * Quản lý media nhập vào editor: probe metadata, thumbnail, và pool
 * các phần tử HTMLVideo/Audio/Image dùng cho preview & phát lại.
 */
import { uid } from "./lib";
import { t as i18nT } from "./i18n";

export type MediaKind = "video" | "audio" | "image";

/**
 * Đợt 90 R3 — prefetch blob cho clip proxy/HTTP nhỏ (WebKit clip D).
 * Cơ chế (bằng chứng Q6 F4 2/2 + N1 P6 5/5 = 7/7 loop sạch khi toàn bộ
 * file đã ở trong bộ nhớ): khi preview sắp phát một clip proxy/HTTP mà
 * kích thước đã biết (hoặc đo được lúc stream) ≤ ngưỡng thì fetch toàn
 * bộ file → blob URL rồi gán `src` bằng blob thay vì URL progressive —
 * pipeline GStreamer của WebKit không còn xin dữ liệu theo từng đoạn
 * trong lúc preroll nên race kẹt loop biến mất.
 * - Ngưỡng mặc định 8 MiB (đo thật ở probe đợt 90: 1,3 MB loop 5/5
 *   cả 7 run; 10,2 MB bitrate thực tế load được 2/3, loop clip noise
 *   10,8 MB 0/4 — xem
 *   docs/PHASE9_ROUND90_R3_WEBKIT_CLIPD_BLOB_PREFETCH_LIMITS.md).
 *   Ngưỡng 8 MiB nằm dưới vùng đã thấy lỗi, vẫn phủ proxy 720p CRF 23
 *   (~2 Mbps) dài tới ~32 s; proxy dài hơn fallback về progressive
 *   như cũ (không hồi quy, chỉ không được fix race).
 * - Tổng blob cache kẹp 64 MiB (FIFO: blob cũ nhất bị thu hồi khi vượt).
 * - Fallback: fetch lỗi / quá ngưỡng / hết RAM / máy yếu → phát bằng URL
 *   gốc như cũ, không retry fetch vô hạn (ghi nhớ theo từng source URL).
 * - Thu hồi blob: khi source URL đổi, khi blob lỗi, khi vượt cap tổng,
 *   hoặc khi caller gọi `revokeBlobPrefetch()`. Element bị drop KHÔNG
 *   thu hồi blob (element tạo lại sau đó dùng lại blob đã có).
 * - Chỉ đổi `src` sang blob khi element còn "sạch" (paused, currentTime
 *   0, không seeking): đang phát thì KHÔNG đổi giữa chừng (đổi src sẽ
 *   reset playback); blob đã cache sẽ được dùng ở lần tạo element sau.
 */
export const BLOB_PREFETCH_MAX_BYTES = 8 * 1024 * 1024;
export const BLOB_PREFETCH_TOTAL_CAP_BYTES = 64 * 1024 * 1024;
export const BLOB_PREFETCH_FETCH_TIMEOUT_MS = 30_000;
/** Đợt 96 X3 — stall-watchdog: số ms không có tiến triển (progress event /
 * readyState tăng / buffered tăng) thì coi pipeline blob pre-metadata đã
 * kẹt và fallback về http (như khi error). Bằng chứng đo đợt 96 X3:
 * gap progress dài nhất ở case blob khỏe là 5,8 s; case stall lặng
 * (qtdemux bogus size nhưng không có error event) không bao giờ có thêm
 * progress (gap ≥15 s ở wall 20 s). Ngưỡng 8 s tách được hai nhóm với
 * biên hai phía; case slow-start hiếm chạm ngưỡng vẫn phát được qua http. */
export const STALL_WATCHDOG_NO_PROGRESS_MS = 8000;

/** URL http(s) (proxy/remote sample) — blob: local import không prefetch. */
export function isBlobPrefetchCandidateUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Kích thước proxy đã biết theo đúng luật proxyKnownSizeBytes (proxy.ts):
 * chỉ field proxySizeBytes do bridge trả mới được tin; giá trị lạ → chưa biết. */
export function knownProxySizeBytesForPrefetch(item: MediaItem): number | undefined {
  const s = item.proxySizeBytes;
  if (typeof s !== "number" || !Number.isFinite(s) || s <= 0) return undefined;
  return s;
}

/** Máy rất yếu (deviceMemory < 1 GB, nếu trình duyệt báo) → bỏ prefetch. */
export function isLowMemoryDeviceForPrefetch(): boolean {
  try {
    const nav = (globalThis as { navigator?: { deviceMemory?: unknown } }).navigator;
    return typeof nav?.deviceMemory === "number" && nav.deviceMemory < 1;
  } catch {
    return false;
  }
}

export type BlobPrefetchMode = "blob" | "pending" | "skipped" | "none";

export interface BlobPrefetchInfo {
  mode: BlobPrefetchMode;
  /** Byte của blob đã cache (chỉ khi mode "blob"). */
  bytes?: number;
  /** Source URL mà quyết định này áp cho (chỉ khi mode "blob"/"skipped"). */
  source?: string;
}

export interface MediaItem {
  id: string;
  /** Tên file gốc — cũng là giá trị `src` trong video-spec khi export. */
  name: string;
  kind: MediaKind;
  /** Object URL (blob:) để preview local. */
  url: string;
  /** Thời lượng giây (ảnh = 0, khi thêm vào timeline sẽ dùng độ dài mặc định). */
  duration: number;
  width?: number;
  height?: number;
  /** Ảnh thumbnail dataURL (nếu tạo được). */
  thumbnail?: string;
  /** File gốc — dùng để upload lên bridge server khi xuất MP4 (P0-01). */
  file?: File;
  /**
   * Đợt 53 J5 — assetId của manifest trong AssetStore (ghi lúc import /
   * relink / rehydrate). Dùng để nối proxy vào manifest cho bền qua
   * reload (xem assetStore.setProxy): media chưa ingest (vd: sample cũ)
   * thì không có, proxy khi đó chỉ sống trong phiên như trước.
   */
  assetId?: string;
  /**
   * Q8 proxy: URL tới bản proxy nhẹ (vd: từ bridge /api/proxy/file/...).
   * Chỉ dùng cho PREVIEW — export cuối vẫn dùng file gốc (xem PROXY_LIMITS.md).
   * Khi có proxyUrl, MediaPool.videoFor() sẽ phát proxy thay cho bản gốc.
   */
  proxyUrl?: string;
  /**
   * Đợt 54 K7 — proxy đã chết: file proxy trên bridge không còn
   * (WORK_ROOT bị xóa tay) nên rehydrate đã gỡ proxyUrl và đánh dấu
   * stale thay vì giữ URL chết. MediaBin hiện nút "Proxy mất, tạo lại"
   * cho item này; bấm tạo lại thì setMediaProxy ghi proxy mới và xóa
   * cờ này. `undefined`/false = bình thường (không stale).
   */
  proxyStale?: boolean;
  /** Chiều cao của proxy (480|720) — để hiển thị badge PROXY. */
  proxyHeight?: number;
  /**
   * Đợt 74 B3 — codec không phát được trên trình duyệt hiện tại (probe
   * lúc import, vd "HEVC / MP4"): preview có thể không có hình, nhưng
   * export FFmpeg phía server vẫn dùng được file gốc. Chỉ set khi probe
   * trả verdict "unsupported"; undefined = chơi được hoặc chưa probe.
   */
  unsupportedCodec?: string;
  /**
   * Đợt 38 U2 — kích thước byte của chính file proxy (bridge trả về
   * lúc tạo proxy, trường proxySizeBytes của POST /api/proxy; xem
   * thêm sidecar proxySize trong server/render/src/proxy.js).
   * Chỉ dùng để truyền qua cổng S4 khi phát bằng proxyUrl; vắng mặt
   * nghĩa là "chưa biết size proxy" — KHÔNG được thay bằng
   * file.size của file gốc.
   */
  proxySizeBytes?: number;
}

function kindOf(file: File): MediaKind | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

function probeVideo(url: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const done = () => {
      resolve({ duration: v.duration || 0, width: v.videoWidth, height: v.videoHeight });
      v.src = "";
    };
    v.onloadedmetadata = done;
    v.onerror = () => reject(new Error(i18nT("media.videoMetaFailed")));
    v.src = url;
  });
}

function probeAudio(url: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    const a = document.createElement("audio");
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      resolve({ duration: a.duration || 0 });
      a.src = "";
    };
    a.onerror = () => reject(new Error(i18nT("media.audioMetaFailed")));
    a.src = url;
  });
}

function probeImage(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(i18nT("media.imageReadFailed")));
    img.src = url;
  });
}

/** Chụp 1 frame video làm thumbnail (không throw nếu thất bại). */
/** Đợt 66 T6 — timeout chờ frame đầu: đồng bộ LOAD_TIMEOUT_MS (5 s) của
 *  lib/thumbnails.ts. Keyframe khổng lồ (64,0 MiB, 8K) decode bằng
 *  <video> rất chậm trên CPU yếu (đo được >175 s chưa xong trên VM này)
 *  — không có timeout thì fileToMediaItem treo vĩnh viễn và import
 *  không bao giờ xong. Hết hạn → bỏ thumbnail, import vẫn tiếp tục. */
const CAPTURE_VIDEO_THUMB_LOAD_TIMEOUT_MS = 5000;
async function captureVideoThumb(url: string): Promise<string | undefined> {
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        v.src = ""; // dừng load/decode đang chạy dở
        reject(new Error("thumb load timeout"));
      }, CAPTURE_VIDEO_THUMB_LOAD_TIMEOUT_MS);
      v.onloadeddata = () => { clearTimeout(t); resolve(); };
      v.onerror = () => { clearTimeout(t); reject(new Error("thumb fail")); };
    });
    // tua tới 10% hoặc 0.5s để tránh frame đen đầu video
    const target = Math.min(0.5, (v.duration || 1) * 0.1);
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      v.currentTime = target;
      // phòng hờ seeked không bắn
      setTimeout(resolve, 800);
    });
    const c = document.createElement("canvas");
    const w = 160;
    const h = Math.max(1, Math.round((w * v.videoHeight) / Math.max(1, v.videoWidth)));
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(v, 0, 0, w, h);
    v.src = "";
    return c.toDataURL("image/jpeg", 0.7);
  } catch {
    return undefined;
  }
}

/** Biến 1 File người dùng chọn thành MediaItem (tên được làm duy nhất ở store). */
export async function fileToMediaItem(file: File): Promise<MediaItem> {
  const kind = kindOf(file);
  if (!kind) throw new Error(i18nT("media.unsupported", { detail: file.name }));
  const url = URL.createObjectURL(file);
  const item: MediaItem = { id: uid("m"), name: file.name, kind, url, duration: 0, file };
  try {
    if (kind === "video") {
      const meta = await probeVideo(url);
      item.duration = meta.duration;
      item.width = meta.width;
      item.height = meta.height;
      item.thumbnail = await captureVideoThumb(url);
    } else if (kind === "audio") {
      const meta = await probeAudio(url);
      item.duration = meta.duration;
    } else {
      const meta = await probeImage(url);
      item.width = meta.width;
      item.height = meta.height;
      item.thumbnail = url; // ảnh gốc làm thumbnail luôn
    }
  } catch {
    // probe thất bại vẫn giữ item (duration 0) — preview sẽ bỏ qua nếu không dùng được
  }
  return item;
}

/**
 * Pool phần tử media dùng chung cho preview & phát lại.
 * Mỗi MediaItem chỉ có tối đa 1 phần tử mỗi loại — tránh tạo trùng.
 */
export class MediaPool {
  private videos = new Map<string, HTMLVideoElement>();
  private audios = new Map<string, HTMLAudioElement>();
  private images = new Map<string, HTMLImageElement>();
  /** Item mới nhất theo id — để error handler của proxy đọc đúng item hiện tại. */
  private videoItems = new Map<string, MediaItem>();
  /** Đợt 90 R3 — blob prefetch: itemId → blob URL đã fetch xong. */
  private blobByItem = new Map<string, { url: string; bytes: number; source: string }>();
  /** Đợt 90 R3 — fetch đang bay: itemId → promise (null = fallback). */
  private blobPending = new Map<string, Promise<string | null>>();
  /** Đợt 90 R3 — quyết định "không prefetch" theo từng source URL (quá
   * ngưỡng / fetch lỗi / máy yếu): key = `${itemId}\n${source}`. */
  private blobSkipped = new Set<string>();
  /** Đợt 90 R3 — thứ tự FIFO để thu hồi blob cũ nhất khi vượt cap tổng. */
  private blobFifo: string[] = [];
  /** Đợt 90 R3 — tổng byte blob đang cache. */
  private blobTotalBytes = 0;
  /** Đợt 92 T1 — src đã CHỐT cho element của item (khóa flip-flop
   * blob↔http): quyết định src (blob hay http) chỉ tính MỘT lần cho mỗi
   * `want` (proxyUrl ?? url) rồi giữ nguyên, KHÔNG tính lại mỗi tick từ
   * trạng thái momentary của element. Trước đây `assigned` trong
   * videoFor() dao động theo `isPristineForBlobSwap` — element vừa gán
   * src thì paused+ct=0 → pristine → gán blob; đang phát → gán http —
   * nên videoFor() gọi mỗi tick làm src flip-flop ~10 Hz trong lúc phát
   * (đo được đợt 91 S3: 29 lần đổi src trên cùng element id 7), mỗi lần
   * đổi src là 1 lần reset pipeline + 1 vé số cho lỗi blob-load flaky
   * của WebKit. Latch chỉ đổi khi có lý do thật: `want` đổi (proxy mới),
   * error handler fallback (proxy→gốc / blob lỗi→gốc), blob đã chốt bị
   * thu hồi (revoke/FIFO), dropElement, hoặc upgrade http→blob lúc
   * element sạch (scrub về 0 / loop restart). `blob=true` nghĩa là src
   * là blob URL do prefetch tạo (đang nằm trong blobByItem); src là URL
   * gốc của local import thì blob=false vì nó chính là `want`. */
  private srcLatch = new Map<string, { want: string; src: string; blob: boolean }>();
  /** Đợt 96 X3 — stall-watchdog: itemId → dấu tiến triển gần nhất của
   * pipeline blob pre-metadata (chỉ theo dõi khi element đang blob +
   * đang muốn phát + ct=0 + readyState<2). */
  private stallWatch96X3 = new Map<string, { lastProgressMs: number; rs: number; bufEnd: number }>();

  /** Đợt 90 R3 — trạng thái prefetch của item (để probe/test đọc, không
   * ảnh hưởng hành vi phát). */
  blobPrefetchInfo(item: MediaItem): BlobPrefetchInfo {
    const source = item.proxyUrl ?? item.url;
    const cached = this.blobByItem.get(item.id);
    if (cached && cached.source === source) {
      return { mode: "blob", bytes: cached.bytes, source };
    }
    if (this.blobPending.has(item.id)) return { mode: "pending" };
    if (this.blobSkipped.has(`${item.id}\n${source}`)) {
      return { mode: "skipped", source };
    }
    return { mode: "none" };
  }

  /** Đợt 90 R3 — thu hồi blob prefetch của một item (hoặc tất cả khi
   * không truyền id). Không đụng tới blob: URL gốc của local import
   * (chỉ thu hồi blob do chính prefetch tạo). */
  revokeBlobPrefetch(itemId?: string): void {
    const ids = itemId ? [itemId] : [...this.blobByItem.keys()];
    for (const id of ids) {
      const cached = this.blobByItem.get(id);
      if (!cached) continue;
      this.blobByItem.delete(id);
      this.blobTotalBytes = Math.max(0, this.blobTotalBytes - cached.bytes);
      this.blobFifo = this.blobFifo.filter((x) => x !== id);
      try {
        URL.revokeObjectURL(cached.url);
      } catch {
        /* bỏ qua */
      }
    }
  }

  /** Đợt 90 R3 — element có đang ở trạng thái đổi `src` an toàn không:
   * paused, đang ở 0, không seeking. Đang phát thì đổi src sẽ reset
   * playback nên caller phải giữ nguyên URL progressive. */
  private static isPristineForBlobSwap(el: HTMLVideoElement): boolean {
    try {
      return el.currentTime === 0 && el.paused === true && el.seeking === false;
    } catch {
      return false;
    }
  }

  /** Đợt 90 R3 — fetch toàn bộ URL về blob (kẹp kích thước lúc stream).
   * Trả {url, bytes} khi fetch xong trong ngưỡng; null khi: HTTP lỗi,
   * quá ngưỡng (kể cả khi Content-Length đã báo trước), timeout, fetch
   * lỗi. Không throw — mọi lỗi đều là "fallback về URL gốc". */
  private async fetchSmallBlob(want: string): Promise<{ url: string; bytes: number } | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try {
        controller.abort();
      } catch {
        /* bỏ qua */
      }
    }, BLOB_PREFETCH_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(want, { signal: controller.signal });
      if (!res || !res.ok) return null;
      const lenRaw = res.headers?.get?.("content-length");
      const len = lenRaw === null || lenRaw === undefined ? NaN : Number(lenRaw);
      if (Number.isFinite(len) && len > BLOB_PREFETCH_MAX_BYTES) return null;
      const type = res.headers?.get?.("content-type") || "video/mp4";
      if (res.body && typeof res.body.getReader === "function") {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            total += value.byteLength;
            if (total > BLOB_PREFETCH_MAX_BYTES) {
              try {
                await reader.cancel();
              } catch {
                /* bỏ qua */
              }
              return null;
            }
            chunks.push(value);
          }
        }
        const buf = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
          buf.set(c, off);
          off += c.byteLength;
        }
        return { url: URL.createObjectURL(new Blob([buf], { type })), bytes: total };
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength > BLOB_PREFETCH_MAX_BYTES) return null;
      return { url: URL.createObjectURL(new Blob([buf], { type })), bytes: buf.byteLength };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Đợt 90 R3 — bắt đầu prefetch cho item (dedup theo itemId; kết quả
   * được cache, thất bại được ghi nhớ để không fetch lại vô hạn). */
  private startBlobPrefetch(item: MediaItem, want: string): void {
    if (this.blobPending.has(item.id)) return;
    const key = `${item.id}\n${want}`;
    // Đã quyết "không prefetch" cho source này (quá ngưỡng / fetch lỗi /
    // máy yếu) thì không fetch lại — videoFor gọi mỗi frame nên thiếu
    // guard này sẽ thành fetch storm.
    if (this.blobSkipped.has(key)) return;
    const job = (async (): Promise<string | null> => {
      // Ngưỡng biết trước: size proxy đã biết mà > ngưỡng thì khỏi fetch.
      const known = item.proxyUrl ? knownProxySizeBytesForPrefetch(item) : item.file?.size;
      if (typeof known === "number" && known > BLOB_PREFETCH_MAX_BYTES) {
        this.blobSkipped.add(key);
        return null;
      }
      if (isLowMemoryDeviceForPrefetch()) {
        this.blobSkipped.add(key);
        return null;
      }
      const fetched = await this.fetchSmallBlob(want);
      if (fetched === null) {
        this.blobSkipped.add(key);
        return null;
      }
      const { url: blobUrl, bytes } = fetched;
      const prev = this.blobByItem.get(item.id);
      if (prev) this.revokeBlobPrefetch(item.id);
      this.blobByItem.set(item.id, { url: blobUrl, bytes, source: want });
      this.blobFifo.push(item.id);
      this.blobTotalBytes += bytes;
      // Vượt cap tổng → thu hồi blob cũ nhất (không thu hồi chính blob mới).
      while (this.blobTotalBytes > BLOB_PREFETCH_TOTAL_CAP_BYTES && this.blobFifo.length > 1) {
        const oldest = this.blobFifo[0];
        if (oldest === item.id) break;
        this.revokeBlobPrefetch(oldest);
      }
      return blobUrl;
    })();
    this.blobPending.set(item.id, job);
    void job.then((blobUrl) => {
      this.blobPending.delete(item.id);
      if (blobUrl === null) return;
      // Blob có thể đã bị thu hồi (FIFO vượt cap tổng) trong lúc chờ —
      // chỉ swap khi nó vẫn còn trong cache.
      const still = this.blobByItem.get(item.id);
      if (!still || still.url !== blobUrl) return;
      // Fetch xong: đổi src sang blob NGAY nếu element vẫn đang trỏ URL
      // gốc và còn sạch (chưa phát). Đang phát thì giữ nguyên — blob đã
      // cache sẽ được dùng ở lần videoFor sau (khi element sạch) hoặc
      // lần tạo element mới.
      // Đợt 92 T1: upgrade đi qua latch (không gán src trực tiếp) —
      // chỉ khi latch đang chốt đúng `want` này, đang ở URL gốc (chưa
      // fallback về file gốc vì lỗi), và element sạch. Latch giữ blob
      // sau đó nên các tick phát sau không lật lại http.
      const el = this.videos.get(item.id);
      if (!el) return;
      const latch = this.srcLatch.get(item.id);
      if (!latch || latch.want !== want || latch.blob) return;
      if (latch.src !== want) return; // đang ở origin fallback → giữ nguyên
      if (el.dataset.proxyFallback === "1") return;
      if (el.dataset.srcKey !== want) return;
      if (MediaPool.isPristineForBlobSwap(el)) {
        latch.src = blobUrl;
        latch.blob = true;
        el.dataset.srcKey = blobUrl;
        el.src = blobUrl;
      }
    });
  }

  videoFor(item: MediaItem): HTMLVideoElement | null {
    if (item.kind !== "video") return null;
    this.videoItems.set(item.id, item);
    // Q8: preview ưu tiên proxy nhẹ (cùng fps/duration nên đồng bộ không đổi).
    const want = item.proxyUrl ?? item.url;
    let el = this.videos.get(item.id);
    if (!el) {
      el = document.createElement("video");
      el.preload = "auto";
      el.playsInline = true;
      // Đợt 95 W2 — theo dõi ý định phát (retry-play sau error-fallback
      // chỉ được chạy khi play() đã gọi mà chưa bị pause() sau đó):
      // play() bị reject vì lỗi blob không phát ra event "play" nên
      // không đọc được ý định từ event; wrap play()/pause() là cách duy
      // nhất trong pool biết được caller có đang muốn phát hay không —
      // tránh tự phát khi user đang pause/scrub (blob lỗi lúc preload).
      // Guard typeof: shim test cũ (FakeVideo đợt 90 R3) không có
      // play() thì bỏ qua, không throw — khi đó retry không bao giờ
      // arm nên hành vi test cũ không đổi.
      if (typeof el.play === "function" && typeof el.pause === "function") {
        const origPlay95W2 = el.play.bind(el);
        const origPause95W2 = el.pause.bind(el);
        el.play = () => {
          el!.dataset.playIntended95W2 = "1";
          return origPlay95W2();
        };
        el.pause = () => {
          el!.dataset.playIntended95W2 = "";
          origPause95W2();
        };
      }
      // Fallback 1 lần: proxy lỗi (mạng/file thiếu) → quay về file gốc.
      el.addEventListener("error", () => {
        const cur = this.videoItems.get(item.id);
        // Đợt 90 R3: blob prefetch lỗi (file đổi sau khi fetch) → thu
        // hồi blob lỗi và ghi nhớ để lần sau phát bằng URL gốc, không
        // retry fetch vô hạn. Chỉ thu hồi blob do prefetch tạo (có
        // trong blobByItem); blob: URL gốc của local import không đụng.
        const owned = this.blobByItem.get(item.id);
        if (owned && el!.src === owned.url) {
          this.revokeBlobPrefetch(item.id);
          this.blobSkipped.add(`${item.id}\n${owned.source}`);
        }
        // Đợt 96 X3 — blob-lỗi KHÔNG proxy (item không có proxyUrl; đo
        // MATRIX NOPROXY đợt 96: 5/8 error-event, 0 frame, finalSrc kẹt
        // ở blob đã revoke vì trước đây chỉ thu hồi blob, src chờ tick
        // videoFor sau mới phục hồi — probe single-shot thì kẹt hẳn):
        // phục hồi src về URL gốc NGAY trong handler + arm retry-play
        // như nhánh proxy (chỉ khi caller đang muốn phát). Guard
        // retryPlay96X3For chốt theo URL gốc của đợt; reset khi `want`
        // đổi (cùng chỗ reset 95W2). Không đụng nhánh proxy (nhánh
        // dưới vẫn giữ nguyên logic + guard 95W2 đã kiểm chứng).
        if (owned && el!.src === owned.url && !cur?.proxyUrl && cur?.url) {
          el!.dataset.srcKey = cur.url;
          el!.src = cur.url;
          const latch96X3 = this.srcLatch.get(item.id);
          if (latch96X3) {
            latch96X3.src = cur.url;
            latch96X3.blob = false;
          }
          // Arm retry-play qua helper chung (cùng dùng cho watchdog).
          this.armRetryPlay96X3(el!, cur.url, "96X3");
        }
        if (cur?.proxyUrl && el!.dataset.proxyFallback !== "1") {
          el!.dataset.proxyFallback = "1";
          // Đợt 92 T1: fallback đổi src thì PHẢI đồng bộ cả srcKey và
          // latch — trước đây srcKey vẫn giữ URL cũ nên videoFor tick
          // sau gán lại src (lật ngược fallback về proxy/blob, rồi lại
          // lỗi, ping-pong). Latch chốt file gốc, các tick sau giữ nguyên.
          el!.dataset.srcKey = cur.url;
          el!.src = cur.url;
          const latch = this.srcLatch.get(item.id);
          if (latch) {
            latch.src = cur.url;
            latch.blob = false;
          }
          // Đợt 95 W2 — retry-play sau error-fallback (nợ LIMITS gộp đợt
          // 94 §4 mục 2; chữ ký V3: error 128–1126 ms sau swap/play,
          // play() reject "not supported", fallback http load tốt nhưng
          // không ai play lại → 0 frame): khi fallback xong và http
          // load tới canplay thì play() lại ĐÚNG 1 LẦN, chỉ khi caller
          // đang muốn phát (playIntended95W2). Guard chống vòng lặp:
          // retryPlay95W2For chốt theo URL fallback của đợt này (mỗi
          // proxyUrl mới reset ở videoFor khi proxyFallback bị xóa);
          // listener once + kiểm tra paused/srcKey/intent lúc bắn nên
          // canplay lặp, app loop đã play lại, hay http cũng lỗi đều
          // không sinh thêm lần play nào. Đường blob-lỗi không proxy:
          // nhánh Đợt 96 X3 ngay trên (phục hồi + retry riêng).
          if (
            el!.dataset.playIntended95W2 === "1" &&
            el!.dataset.retryPlay95W2For !== cur.url
          ) {
            el!.dataset.retryPlay95W2For = cur.url;
            const tryRetryPlay95W2 = () => {
              if (el!.dataset.retryPlay95W2For !== cur.url) return;
              if (el!.dataset.srcKey !== cur.url) return;
              if (el!.dataset.playIntended95W2 !== "1") return;
              if (!el!.paused) return;
              if (typeof el!.play !== "function") return;
              el!.dataset.retryPlay95W2Fired = "1";
              try {
                el!.dataset.retryPlay95W2At = String(Math.round(performance.now()));
              } catch {
                /* bỏ qua */
              }
              try {
                const p = el!.play();
                if (p && typeof p.catch === "function") p.catch(() => {});
              } catch {
                /* bỏ qua */
              }
            };
            if (el!.readyState >= 2) {
              tryRetryPlay95W2();
            } else {
              el!.addEventListener("canplay", tryRetryPlay95W2, { once: true });
            }
          }
        }
      });
      // Đợt 96 X3 — stall-watchdog: ghi dấu tiến triển của pipeline blob.
      // Chỉ "progress" mới cập nhật (event "stalled" KHÔNG tính — case
      // stall lặng vẫn có 1 stalled rồi im luôn; loadeddata/canplay thì
      // videoFor tự xóa entry vì readyState đã ≥ 2).
      el.addEventListener("progress", () => {
        const w = this.stallWatch96X3.get(item.id);
        if (w) w.lastProgressMs = performance.now();
      });
      this.videos.set(item.id, el);
    }
    // Đợt 90 R3 — prefetch blob cho clip proxy/HTTP nhỏ (WebKit clip D):
    // URL http(s) thì thử fetch toàn bộ về blob; blob: local import thì
    // đã ở trong bộ nhớ nên không cần.
    // Đợt 92 T1 — KHÓA src bằng latch (xem field srcLatch): quyết định
    // blob/http chỉ tính khi `want` đổi, còn không thì giữ latch. Chỉ
    // hai đường đổi latch trong lúc phát: (a) blob đã chốt bị thu hồi
    // (revoke/FIFO) → về URL gốc + fetch lại; (b) upgrade http→blob khi
    // element sạch (scrub về 0 / loop restart) — và chỉ upgrade một lần
    // vì latch sau đó giữ blob, các tick phát sau không lật lại http.
    // Phát lại sau pause ở ct≠0 giữ nguyên src đã chốt (đổi src sẽ reset
    // currentTime về 0 — đúng cái flip-flop đang khóa); blob chỉ được
    // dùng ở lần phát sau khi element sạch trở lại hoặc dropElement.
    let latch = this.srcLatch.get(item.id);
    if (!latch || latch.want !== want) {
      // Quyết định mới cho `want` mới (element mới, proxy mới, hoặc lần
      // đầu gặp item): blob nếu cache khớp, không thì URL gốc + prefetch.
      let src = want;
      let blob = false;
      if (isBlobPrefetchCandidateUrl(want)) {
        const cached = this.blobByItem.get(item.id);
        if (cached && cached.source === want) {
          src = cached.url;
          blob = true;
        } else {
          if (cached) this.revokeBlobPrefetch(item.id); // source đã đổi
          this.startBlobPrefetch(item, want);
        }
      }
      latch = { want, src, blob };
      this.srcLatch.set(item.id, latch);
      el.dataset.proxyFallback = ""; // proxy mới → xóa fallback cũ
      // Đợt 95 W2: proxy mới → episode fallback mới được retry-play lại
      // 1 lần (guard retryPlay95W2For reset theo proxyUrl mới).
      el.dataset.retryPlay95W2For = "";
      // Đợt 96 X3: `want` mới → episode blob-lỗi không proxy mới cũng
      // được retry-play lại 1 lần (guard retryPlay96X3For reset cùng chỗ).
      el.dataset.retryPlay96X3For = "";
    } else if (latch.blob) {
      const cached = this.blobByItem.get(item.id);
      if (!cached || cached.url !== latch.src) {
        // Blob đã chốt bị thu hồi (revoke tay / FIFO vượt cap tổng) →
        // về URL gốc; fetch lại nếu còn là ứng viên (revoke không đánh
        // dấu skipped nên lần gọi này tự fetch lại như trước).
        latch.src = want;
        latch.blob = false;
        if (isBlobPrefetchCandidateUrl(want)) this.startBlobPrefetch(item, want);
      }
    } else if (
      latch.src === want &&
      el.dataset.proxyFallback !== "1" &&
      isBlobPrefetchCandidateUrl(want) &&
      MediaPool.isPristineForBlobSwap(el)
    ) {
      const cached = this.blobByItem.get(item.id);
      if (cached && cached.source === want) {
        latch.src = cached.url;
        latch.blob = true;
      }
    }
    if (el.dataset.srcKey !== latch.src) {
      el.dataset.srcKey = latch.src;
      el.src = latch.src;
    }
    // Đợt 96 X3 — stall-watchdog: mỗi tick app kiểm tra pipeline blob
    // pre-metadata có kẹt lặng không (xem checkStallWatchdog96X3).
    this.checkStallWatchdog96X3(item, el);
    return el;
  }

  /** Đợt 96 X3 — arm retry-play sau khi blob fallback về http (dùng chung
   * cho nhánh blob-lỗi không proxy trong error handler và cho stall-
   * watchdog). `guardPrefix` chọn guard/marker: "95W2" cho item có proxy
   * (giữ đúng guard W2 đã kiểm chứng), "96X3" cho item không proxy.
   * Chỉ play lại ĐÚNG 1 lần khi canplay (hoặc ngay nếu readyState ≥ 2),
   * chỉ khi caller đang muốn phát; kiểm tra lại paused/srcKey/intent lúc
   * bắn như bản W2. */
  private armRetryPlay96X3(el: HTMLVideoElement, targetUrl: string, guardPrefix: "95W2" | "96X3"): void {
    const forKey = `retryPlay${guardPrefix}For`;
    const firedKey = `retryPlay${guardPrefix}Fired`;
    const atKey = `retryPlay${guardPrefix}At`;
    if (el.dataset.playIntended95W2 !== "1") return;
    if (el.dataset[forKey] === targetUrl) return;
    el.dataset[forKey] = targetUrl;
    const tryRetry = () => {
      if (el.dataset[forKey] !== targetUrl) return;
      if (el.dataset.srcKey !== targetUrl) return;
      if (el.dataset.playIntended95W2 !== "1") return;
      if (!el.paused) return;
      if (typeof el.play !== "function") return;
      el.dataset[firedKey] = "1";
      try {
        el.dataset[atKey] = String(Math.round(performance.now()));
      } catch {
        /* bỏ qua */
      }
      try {
        const p = el.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {
        /* bỏ qua */
      }
    };
    if (el.readyState >= 2) {
      tryRetry();
    } else {
      el.addEventListener("canplay", tryRetry, { once: true });
    }
  }

  /** Đợt 96 X3 — stall-watchdog (chỉ chạy trong videoFor, tức mỗi tick
   * của app): pipeline blob pre-metadata kẹt lặng thì không có error
   * event nên error handler không chạy — phát hiện bằng "không tiến
   * triển" rồi phục hồi về http như khi error. Chỉ khi: latch đang blob
   * + caller muốn phát + chưa pause + ct=0 + readyState<2 + src là blob.
   * Tiến triển = progress event (listener ở lúc tạo element), readyState
   * tăng, hoặc buffered tăng (đọc đồng bộ mỗi tick). Ngưỡng
   * STALL_WATCHDOG_NO_PROGRESS_MS (8 s). Một lần mỗi episode (sau
   * fallback latch.blob=false nên không watch nữa; guard retry trong
   * armRetryPlay chặn arm lại). Không áp cho stall giữa chừng (ct>0 —
   * thuộc trần stall V2 / re-arm W5). */
  private checkStallWatchdog96X3(item: MediaItem, el: HTMLVideoElement): void {
    const latch = this.srcLatch.get(item.id);
    const watchable =
      !!latch?.blob &&
      el.dataset.playIntended95W2 === "1" &&
      !el.paused &&
      el.currentTime === 0 &&
      el.readyState < 2 &&
      typeof el.src === "string" &&
      el.src.startsWith("blob:");
    if (!watchable) {
      this.stallWatch96X3.delete(item.id);
      return;
    }
    const nowMs = performance.now();
    let bufEnd = 0;
    try {
      const b = el.buffered;
      if (b && b.length > 0) bufEnd = b.end(b.length - 1);
    } catch {
      /* không đọc được buffered — coi như 0 */
    }
    const w = this.stallWatch96X3.get(item.id);
    if (!w) {
      this.stallWatch96X3.set(item.id, { lastProgressMs: nowMs, rs: el.readyState, bufEnd });
      return;
    }
    if (el.readyState > w.rs || bufEnd > w.bufEnd) {
      w.lastProgressMs = nowMs;
      w.rs = el.readyState;
      w.bufEnd = bufEnd;
      return;
    }
    if (nowMs - w.lastProgressMs >= STALL_WATCHDOG_NO_PROGRESS_MS) {
      this.stallWatch96X3.delete(item.id);
      el.dataset.stallWatchdog96X3Fired = "1";
      this.recoverStalledBlob96X3(item, el);
    }
  }

  /** Đợt 96 X3 — phục hồi pipeline blob kẹt lặng: thu hồi blob hỏng, về
   * URL gốc + arm retry-play (cùng đích như error handler; guard 95W2
   * cho item có proxy, 96X3 cho item không proxy). */
  private recoverStalledBlob96X3(item: MediaItem, el: HTMLVideoElement): void {
    const cur = this.videoItems.get(item.id);
    if (!cur) return;
    const owned = this.blobByItem.get(item.id);
    if (!owned || el.src !== owned.url) return;
    this.revokeBlobPrefetch(item.id);
    this.blobSkipped.add(`${item.id}\n${owned.source}`);
    el.dataset.srcKey = cur.url;
    el.src = cur.url;
    const latch = this.srcLatch.get(item.id);
    if (latch) {
      latch.src = cur.url;
      latch.blob = false;
    }
    if (cur.proxyUrl) el.dataset.proxyFallback = "1";
    this.armRetryPlay96X3(el, cur.url, cur.proxyUrl ? "95W2" : "96X3");
  }

  audioFor(item: MediaItem): HTMLAudioElement | null {
    if (item.kind !== "audio") return null;
    let el = this.audios.get(item.id);
    if (!el) {
      el = document.createElement("audio");
      el.src = item.url;
      el.preload = "auto";
      this.audios.set(item.id, el);
    }
    return el;
  }

  imageFor(item: MediaItem): HTMLImageElement | null {
    if (item.kind !== "image") return null;
    let el = this.images.get(item.id);
    if (!el) {
      el = new Image();
      el.src = item.url;
      this.images.set(item.id, el);
    }
    return el;
  }

  // ROUND43-Y2: bỏ element khỏi pool để lần videoFor/audioFor sau tạo
  // element MỚI với cùng src (phục hồi sau khi cạn cap seek đợt 42 X2:
  // element cũ kẹt seeking hoặc demuxer hỏng thì seek mới không bao giờ
  // xong — xem pauseSeekRecovery43Y2.ts). Trả true nếu element thực sự
  // nằm trong pool; element lạ (không do pool tạo) không bị đụng tới.
  // Chỉ gọi khi vòng lặp đã ngủ vì cạn cap (không còn seek bay), nên
  // không cắt ngang seek đang chạy; lần seek sau tự tạo element mới.
  dropElement(el: HTMLVideoElement | HTMLAudioElement): boolean {
    let found = false;
    for (const [id, v] of this.videos) {
      if (v === el) {
        this.videos.delete(id);
        this.videoItems.delete(id);
        // Đợt 92 T1: xóa latch — element mới tạo sau này quyết định src
        // lại từ đầu (blob đã cache thì dùng blob ngay, không fetch lại).
        this.srcLatch.delete(id);
        // Đợt 96 X3: xóa entry stall-watchdog của element bị drop.
        this.stallWatch96X3.delete(id);
        found = true;
      }
    }
    for (const [id, a] of this.audios) {
      if (a === el) {
        this.audios.delete(id);
        found = true;
      }
    }
    if (!found) return false;
    try {
      el.pause();
    } catch {
      /* bỏ qua */
    }
    try {
      // Gỡ src + load() để huỷ hẳn lần nạp đang kẹt, giải phóng tài nguyên.
      el.removeAttribute("src");
      el.load();
    } catch {
      /* bỏ qua */
    }
    return true;
  }

  /** Dừng hết mọi phần tử đang phát (khi pause/stop/scrub). */
  pauseAll(): void {
    for (const v of this.videos.values()) v.pause();
    for (const a of this.audios.values()) a.pause();
  }

  /** Duyệt mọi phần tử media (R1-062: để syncPlaying dừng element không còn active). */
  eachMedia(fn: (el: HTMLVideoElement | HTMLAudioElement) => void): void {
    for (const v of this.videos.values()) fn(v);
    for (const a of this.audios.values()) fn(a);
  }
}
