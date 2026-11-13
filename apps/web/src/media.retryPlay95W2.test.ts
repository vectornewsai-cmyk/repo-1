// media.retryPlay95W2.test.ts — unit test retry-play sau error-fallback
// (Phase 9 đợt 95, luồng W2; nợ LIMITS gộp đợt 94 §4 mục 2).
// Chạy (từ gốc repo — giống file blobPrefetch90R3.test.ts):
//   ./node_modules/.bin/esbuild apps/web/src/media.retryPlay95W2.test.ts --bundle --format=esm --platform=node --outfile=/tmp/retry-play-95w2.test.mjs && node /tmp/retry-play-95w2.test.mjs
// Hoặc chạy cả 3 test media.* cùng lúc (runner thống nhất đợt 96 X8):
//   node apps/web/scripts/run-media-tests.mjs
import assert from "node:assert/strict";
import { MediaPool } from "./media";
import type { MediaItem } from "./media";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

/* --- Shim DOM + fetch tối thiểu cho MediaPool.videoFor() trong Node --- */
type Handler = (...args: unknown[]) => void;
class FakeVideo {
  preload = "";
  playsInline = false;
  muted = false;
  dataset: Record<string, string> = {};
  currentTime = 0;
  paused = true;
  seeking = false;
  readyState = 0;
  playCalls = 0;
  pauseCalls = 0;
  private _src = "";
  private handlers = new Map<string, Handler[]>();
  set src(v: string) {
    this._src = v;
  }
  get src(): string {
    return this._src;
  }
  addEventListener(type: string, h: Handler): void {
    const list = this.handlers.get(type) ?? [];
    list.push(h);
    this.handlers.set(type, list);
  }
  fire(type: string): void {
    for (const h of [...(this.handlers.get(type) ?? [])]) h();
  }
  play(): Promise<void> {
    this.playCalls++;
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.pauseCalls++;
    this.paused = true;
  }
  removeAttribute(): void {}
  load(): void {}
}
(globalThis as Record<string, unknown>).document = {
  createElement: (tag: string) => {
    if (tag === "video") return new FakeVideo();
    throw new Error(`unexpected tag ${tag}`);
  },
};

let blobSeq = 0;
const createdBlobs: string[] = [];
const revokedBlobs: string[] = [];
(globalThis.URL as unknown as Record<string, unknown>).createObjectURL = () => {
  const u = `blob:fake-${++blobSeq}`;
  createdBlobs.push(u);
  return u;
};
(globalThis.URL as unknown as Record<string, unknown>).revokeObjectURL = (u: string) => {
  revokedBlobs.push(u);
};

type FetchBehavior = {
  ok?: boolean;
  contentLength?: number | null;
  chunks?: Uint8Array[];
  arrayBufferBytes?: number;
  reject?: Error;
};
let fetchBehavior: FetchBehavior = {};
let fetchCalls = 0;
(globalThis as Record<string, unknown>).fetch = async (url: string) => {
  fetchCalls++;
  void url;
  const b = fetchBehavior;
  if (b.reject) throw b.reject;
  const headers = {
    get: (name: string) => {
      const n = name.toLowerCase();
      if (n === "content-length") return b.contentLength === null || b.contentLength === undefined ? null : String(b.contentLength);
      if (n === "content-type") return "video/mp4";
      return null;
    },
  };
  if (b.chunks) {
    let i = 0;
    return {
      ok: b.ok !== false,
      headers,
      body: {
        getReader: () => ({
          read: async () => {
            if (i >= b.chunks!.length) return { done: true, value: undefined };
            return { done: false, value: b.chunks![i++] };
          },
          cancel: async () => {},
        }),
      },
    };
  }
  return {
    ok: b.ok !== false,
    headers,
    body: null,
    arrayBuffer: async () => new ArrayBuffer(b.arrayBufferBytes ?? 0),
  };
};

const navState: { deviceMemory?: number } = {};
Object.defineProperty(globalThis, "navigator", { value: navState, configurable: true });

const chunk = (bytes: number) => new Uint8Array(bytes);
const video = (over: Partial<MediaItem> = {}): MediaItem => ({
  id: "m1",
  name: "d.mp4",
  kind: "video",
  url: "http://127.0.0.1:8899/d.mp4",
  duration: 4,
  proxyUrl: "http://127.0.0.1:8899/d.mp4",
  proxySizeBytes: 1000,
  ...over,
});
const flush = async (ms = 25) => {
  await new Promise((r) => setTimeout(r, ms));
  await new Promise((r) => setTimeout(r, ms));
};
function resetStubs() {
  fetchBehavior = {};
  fetchCalls = 0;
  createdBlobs.length = 0;
  revokedBlobs.length = 0;
  delete navState.deviceMemory;
}

/** Đưa element tới trạng thái "đang phát blob" như probe: fetch xong,
 * swap sang blob, play() đã gọi (ý định phát = 1). */
async function setupPlayingBlob(): Promise<{ pool: MediaPool; item: MediaItem; el: FakeVideo; blobUrl: string }> {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  const blobUrl = el.src;
  assert.ok(blobUrl.startsWith("blob:fake-"), `phải swap sang blob trước, thực tế ${blobUrl}`);
  void el.play(); // ý định phát (qua wrapper của MediaPool)
  // Mô phỏng play() bị reject "not supported" như chữ ký V3: trình duyệt
  // không bắt đầu phát nên element vẫn paused (fake play() ở trên đã
  // lật paused=false như một lần play thành công — phải trả lại true).
  el.paused = true;
  return { pool, item, el, blobUrl };
}

let pass = 0;
let fail = 0;
const failedNames: string[] = [];
async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  resetStubs();
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

console.log("== retry-play sau error-fallback (đợt 95 W2) ==");

await test("error trên blob đang phát → fallback http + canplay → play() lại ĐÚNG 1 lần", async () => {
  const { el } = await setupPlayingBlob();
  assert.equal(el.playCalls, 1);
  el.fire("error");
  assert.equal(el.src, "http://127.0.0.1:8899/d.mp4"); // fallback về url gốc
  assert.equal(el.playCalls, 1, "chưa canplay thì chưa retry");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "canplay sau fallback phải play lại 1 lần");
  assert.equal(el.dataset.retryPlay95W2Fired, "1");
  assert.ok(el.dataset.retryPlay95W2At, "ghi thời điểm retry");
  // canplay lần nữa (listener once đã gỡ ở trình duyệt thật; fake giữ
  // listener nhưng guard paused phải chặn) → không play thêm.
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "retry chỉ 1 lần, canplay sau không play thêm");
});

await test("không gọi play() trước (đang pause/scrub) → error-fallback KHÔNG tự phát", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.ok(el.src.startsWith("blob:fake-"));
  assert.equal(el.playCalls, 0);
  el.fire("error");
  assert.equal(el.src, item.url);
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 0, "không có ý định phát thì không được tự play");
});

await test("play() rồi pause() trước khi canplay → retry bị hủy (ý định đã xóa)", async () => {
  const { el } = await setupPlayingBlob();
  el.fire("error");
  assert.equal(el.src, "http://127.0.0.1:8899/d.mp4");
  el.pause(); // user bấm pause trong lúc http đang load lại
  assert.equal(el.dataset.playIntended95W2, "");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 1, "đã pause thì retry không được phát lại");
});

await test("app loop đã play lại trước canplay → retry không play thừa", async () => {
  const { el } = await setupPlayingBlob();
  el.fire("error");
  assert.equal(el.src, "http://127.0.0.1:8899/d.mp4");
  void el.play(); // syncMedia tick sau gọi play() lại (đường app loop)
  assert.equal(el.playCalls, 2);
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "element đã phát thì retry phải bỏ qua");
});

await test("http fallback cũng lỗi → không retry vòng lặp, không arm lại", async () => {
  const { el } = await setupPlayingBlob();
  el.fire("error"); // lỗi blob → fallback http
  assert.equal(el.src, "http://127.0.0.1:8899/d.mp4");
  el.fire("error"); // lỗi luôn trên http fallback
  assert.equal(el.src, "http://127.0.0.1:8899/d.mp4");
  el.readyState = 2;
  el.fire("canplay"); // canplay (nếu có) chỉ được play 1 lần duy nhất
  assert.equal(el.playCalls, 2, "chỉ 1 retry cho cả đợt fallback, không lặp");
  el.fire("canplay");
  assert.equal(el.playCalls, 2);
});

await test("proxyUrl đổi → fallback mới được retry lại (guard reset theo episode)", async () => {
  const { pool, el } = await setupPlayingBlob();
  el.fire("error");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2);
  // Proxy mới (proxy tạo lại) → videoFor reset proxyFallback + guard.
  const item2 = video({ proxyUrl: "http://127.0.0.1:8899/d2.mp4", proxySizeBytes: 1000 });
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const el2 = pool.videoFor(item2) as unknown as FakeVideo;
  assert.equal(el2, el);
  await flush();
  // Sau retry-play đợt trước element đang "phát" (paused=false) nên
  // prefetch callback KHÔNG swap giữa chừng (đúng luật đợt 90 R3) —
  // phải pause + về 0 rồi gọi videoFor thì mới upgrade sang blob.
  assert.equal(el.src, item2.proxyUrl);
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item2);
  assert.ok(el.src.startsWith("blob:fake-"), `pause về 0 phải upgrade blob, thực tế ${el.src}`);
  void el.play();
  el.paused = true; // mô phỏng play() bị reject như đợt trước
  const before = el.playCalls;
  el.fire("error");
  assert.equal(el.src, item2.url);
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, before + 1, "episode fallback mới phải được retry lại 1 lần");
});

await test("wrapper play/pause vẫn delegate đúng (paused lật theo gọi)", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  assert.equal(el.paused, true);
  await el.play();
  assert.equal(el.paused, false);
  assert.equal(el.dataset.playIntended95W2, "1");
  el.pause();
  assert.equal(el.paused, true);
  assert.equal(el.dataset.playIntended95W2, "");
});

console.log(`\n${pass} pass, ${fail} fail${failedNames.length ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
process.exitCode = fail ? 1 : 0;
