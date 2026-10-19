/**
 * Thumbnail pipeline cho timeline (R1-035) + filmstrip nhiều frame (R1-066).
 *
 * - Capture frame video qua <video> + <canvas>, hoàn toàn async — không block UI.
 * - Cache LRU tối đa 100 mục (tính cả kết quả thất bại).
 * - Dedupe: nhiều clip cùng xin 1 thumbnail chỉ capture 1 lần.
 * - Giới hạn 3 capture song song — timeline 50 clip không spawn 50 thẻ video.
 * - Lỗi → trả `null` (caller fallback block màu), KHÔNG throw.
 */

/**
 * Filmstrip (R1-066): mỗi clip video hiện dải N frame cách đều (như CapCut),
 * thay vì 1 frame giữa clip lặp ngang.
 */
export const THUMB_W = 120;
export const THUMB_H = 68;
/** Số mục tối đa trong cache (mục = 1 dataURL JPEG ~10-20KB → ~2MB RAM). */
export const MAX_THUMB_CACHE = 100;
/** Số capture chạy song song tối đa. */
const MAX_PARALLEL = 3;
const LOAD_TIMEOUT_MS = 5000;
const SEEK_TIMEOUT_MS = 1500;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`timeout: ${label}`)), ms);
    p.then(
      (v) => { window.clearTimeout(t); resolve(v); },
      (e) => { window.clearTimeout(t); reject(e); },
    );
  });
}

const cache = new Map<string, string | null>(); // key → dataURL | null (thất bại)
const inflight = new Map<string, Promise<string | null>>();
let running = 0;
const waitQueue: Array<() => void> = [];

function pumpQueue(): void {
  while (running < MAX_PARALLEL && waitQueue.length > 0) {
    const next = waitQueue.shift();
    if (next) next();
  }
}

/** Chạy fn nhưng không quá MAX_PARALLEL tác vụ đồng thời. */
function runLimited<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running++;
      fn().then(
        (v) => { running--; pumpQueue(); resolve(v); },
        (e) => { running--; pumpQueue(); reject(e); },
      );
    };
    if (running < MAX_PARALLEL) run();
    else waitQueue.push(run);
  });
}

/** Key cache: URL + mốc thời gian làm tròn 0.5s (tránh capture lại khi trim nhẹ). */
export function thumbCacheKey(url: string, atSec: number): string {
  const bucket = Math.round(atSec * 2) / 2;
  return `${url}#t=${bucket.toFixed(1)}`;
}

/** Capture 1 frame tại atSec, resize cover-fit 120x68, trả dataURL JPEG. Null nếu lỗi. */
async function captureFrame(url: string, atSec: number): Promise<string | null> {
  let v: HTMLVideoElement | null = document.createElement("video");
  try {
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const loaded = new Promise<void>((resolve, reject) => {
      if (!v) return reject(new Error("no video"));
      v.onloadeddata = () => resolve();
      v.onerror = () => reject(new Error("không load được video"));
    });
    v.src = url;
    await withTimeout(loaded, LOAD_TIMEOUT_MS, "load video");

    const dur = v.duration;
    const target = Number.isFinite(dur) && dur > 0
      ? Math.min(Math.max(0, atSec), Math.max(0, dur - 0.05))
      : 0;
    // seek tới target; nếu seeked không bắn (file lạ), dùng frame hiện tại
    const seeked = new Promise<void>((resolve) => {
      if (!v) return resolve();
      v.onseeked = () => resolve();
    });
    try {
      v.currentTime = target;
      await withTimeout(seeked, SEEK_TIMEOUT_MS, "seek");
    } catch {
      /* dùng frame hiện tại */
    }

    if (!v.videoWidth || !v.videoHeight) return null;
    const c = document.createElement("canvas");
    c.width = THUMB_W;
    c.height = THUMB_H;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    // cover-fit: lấp đầy 120x68, cắt phần thừa
    const s = Math.max(THUMB_W / v.videoWidth, THUMB_H / v.videoHeight);
    const dw = v.videoWidth * s;
    const dh = v.videoHeight * s;
    ctx.drawImage(v, (THUMB_W - dw) / 2, (THUMB_H - dh) / 2, dw, dh);
    return c.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  } finally {
    if (v) {
      v.removeAttribute("src");
      v.load(); // giải phóng decoder
      v = null;
    }
  }
}

/**
 * Lấy thumbnail video tại mốc atSec (giây, theo source time).
 * Sync-cache hit → resolve ngay; ngược lại capture async, dedupe + giới hạn song song.
 */
export function getVideoThumbnail(url: string, atSec: number): Promise<string | null> {
  const key = thumbCacheKey(url, atSec);
  const hit = cache.get(key);
  if (hit !== undefined) {
    // LRU touch: đưa lên cuối
    cache.delete(key);
    cache.set(key, hit);
    return Promise.resolve(hit);
  }
  const ongoing = inflight.get(key);
  if (ongoing) return ongoing;

  const p = runLimited(() => captureFrame(url, atSec)).then((res) => {
    inflight.delete(key);
    cache.set(key, res);
    if (cache.size > MAX_THUMB_CACHE) {
      const oldest = cache.keys().next();
      if (!oldest.done) cache.delete(oldest.value);
    }
    return res;
  });
  inflight.set(key, p);
  return p;
}

/** Xoá toàn bộ cache (dùng khi xoá media / test). */
export function clearThumbnailCache(): void {
  cache.clear();
}

/** Số mục hiện tại trong cache (phục vụ test/giám sát). */
export function thumbnailCacheSize(): number {
  return cache.size;
}

/* ------------------------------------------------------------------ */
/* Filmstrip nhiều frame cho clip video (R1-066)                        */
/* ------------------------------------------------------------------ */

/** 1 thumbnail filmstrip mỗi ~2 giây thời lượng clip. */
export const FILMSTRIP_SECONDS_PER_THUMB = 2;
/** Tối đa thumbnail trong 1 dải filmstrip (tránh bùng cache với clip dài). */
export const FILMSTRIP_MAX = 10;

/**
 * Số frame filmstrip cho clip dài durationSec giây: 1 mỗi ~2s, tối đa 10.
 * Pure — test được bằng Node, không cần DOM.
 */
export function filmstripCount(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 1;
  return Math.min(
    FILMSTRIP_MAX,
    Math.max(1, Math.ceil(durationSec / FILMSTRIP_SECONDS_PER_THUMB)),
  );
}

/**
 * Các mốc source-time (giây) cho filmstrip: điểm giữa mỗi đoạn, cách đều,
 * nằm trong [clipInSec, clipInSec + durationSec].
 * Pure — test được bằng Node, không cần DOM.
 */
export function filmstripTimestamps(clipInSec: number, durationSec: number): number[] {
  const count = filmstripCount(durationSec);
  const ts: number[] = [];
  for (let i = 0; i < count; i++) {
    ts.push(clipInSec + ((i + 0.5) * durationSec) / count);
  }
  return ts;
}

/**
 * Lấy dải filmstrip cho 1 clip video: mảng dataURL|null, mỗi frame đi qua
 * `getVideoThumbnail` (dedupe + cache LRU + giới hạn 3 capture song song).
 * Caller nên gọi lazy (IntersectionObserver) — không gọi cho clip ngoài viewport.
 */
export function getFilmstrip(
  url: string,
  clipInSec: number,
  durationSec: number,
): Promise<Array<string | null>> {
  const ts = filmstripTimestamps(clipInSec, durationSec);
  return Promise.all(ts.map((t) => getVideoThumbnail(url, t)));
}
