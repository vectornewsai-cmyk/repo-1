// media.retryPlay96X3.test.ts — unit test retry-play đường blob-lỗi KHÔNG proxy
// (Phase 9 đợt 96, luồng X3; nợ LIMITS gộp đợt 95 §4 mục 3).
// Chạy (từ gốc repo — giống file retryPlay95W2.test.ts):
//   ./node_modules/.bin/esbuild apps/web/src/media.retryPlay96X3.test.ts --bundle --format=esm --platform=node --outfile=/tmp/retry-play-96x3.test.mjs && node /tmp/retry-play-96x3.test.mjs
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
// Item KHÔNG proxyUrl: want = url (http) — đường blob-lỗi không proxy.
const video = (over: Partial<MediaItem> = {}): MediaItem => ({
  id: "m1",
  name: "d.mp4",
  kind: "video",
  url: "http://127.0.0.1:8901/d.mp4",
  duration: 4,
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

/** Đưa element tới trạng thái "đang phát blob" (không proxy): fetch xong,
 * swap sang blob, play() đã gọi (ý định phát = 1), play() bị reject. */
async function setupPlayingBlobNoProxy(): Promise<{ pool: MediaPool; item: MediaItem; el: FakeVideo; blobUrl: string }> {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  const blobUrl = el.src;
  assert.ok(blobUrl.startsWith("blob:fake-"), `phải swap sang blob trước, thực tế ${blobUrl}`);
  void el.play(); // ý định phát (qua wrapper của MediaPool)
  el.paused = true; // mô phỏng play() bị reject như chữ ký V3
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

console.log("== retry-play đường blob-lỗi không proxy (đợt 96 X3) ==");

await test("error trên blob không proxy đang phát → src về http NGAY + canplay → play() lại ĐÚNG 1 lần", async () => {
  const { el, blobUrl } = await setupPlayingBlobNoProxy();
  assert.equal(el.playCalls, 1);
  el.fire("error");
  assert.ok(revokedBlobs.includes(blobUrl), "blob lỗi phải bị revoke");
  assert.equal(el.src, "http://127.0.0.1:8901/d.mp4", "src phải về http ngay trong handler, không chờ tick videoFor sau");
  assert.equal(el.playCalls, 1, "chưa canplay thì chưa retry");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "canplay sau phục hồi phải play lại 1 lần");
  assert.equal(el.dataset.retryPlay96X3Fired, "1");
  assert.ok(el.dataset.retryPlay96X3At, "ghi thời điểm retry");
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "retry chỉ 1 lần");
});

await test("không gọi play() trước → src vẫn về http ngay nhưng KHÔNG tự phát", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.ok(el.src.startsWith("blob:fake-"));
  assert.equal(el.playCalls, 0);
  el.fire("error");
  assert.equal(el.src, item.url, "phục hồi src không phụ thuộc ý định phát (tick sau cũng làm vậy)");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 0, "không có ý định phát thì không được tự play");
  assert.equal(el.dataset.retryPlay96X3Fired, undefined);
});

await test("play() rồi pause() trước canplay → retry bị hủy", async () => {
  const { el } = await setupPlayingBlobNoProxy();
  el.fire("error");
  assert.equal(el.src, "http://127.0.0.1:8901/d.mp4");
  el.pause();
  assert.equal(el.dataset.playIntended95W2, "");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 1, "đã pause thì retry không được phát lại");
});

await test("http gốc cũng lỗi sau phục hồi → không retry vòng lặp", async () => {
  const { el } = await setupPlayingBlobNoProxy();
  el.fire("error"); // lỗi blob → về http
  assert.equal(el.src, "http://127.0.0.1:8901/d.mp4");
  el.fire("error"); // lỗi luôn trên http
  assert.equal(el.src, "http://127.0.0.1:8901/d.mp4", "không đổi src nữa");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "chỉ 1 retry cho cả đợt, không lặp");
  el.fire("canplay");
  assert.equal(el.playCalls, 2);
});

await test("app loop đã play lại trước canplay → retry không play thừa", async () => {
  const { el } = await setupPlayingBlobNoProxy();
  el.fire("error");
  void el.play(); // syncMedia tick sau gọi play() lại
  assert.equal(el.playCalls, 2);
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "element đã phát thì retry phải bỏ qua");
});

await test("tick videoFor sau lỗi giữ nguyên http (latch đã đồng bộ, không lật lại blob)", async () => {
  const { pool, item, el } = await setupPlayingBlobNoProxy();
  el.fire("error");
  assert.equal(el.src, item.url);
  // Mô phỏng tick app sau: videoFor không được lật src về blob đã revoke.
  el.currentTime = 0;
  pool.videoFor(item);
  assert.equal(el.src, item.url, "sau phục hồi, tick sau không được lật lại blob");
  assert.equal(el.dataset.proxyFallback, "", "không proxy thì không set proxyFallback");
});

await test("đường proxy vẫn dùng guard 95W2, không chạm guard 96X3", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video({ proxyUrl: "http://127.0.0.1:8901/d.mp4", proxySizeBytes: 1000 });
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.ok(el.src.startsWith("blob:fake-"));
  void el.play();
  el.paused = true;
  el.fire("error");
  assert.equal(el.src, item.url);
  assert.equal(el.dataset.retryPlay96X3Fired, undefined, "nhánh proxy không được set marker 96X3");
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.dataset.retryPlay95W2Fired, "1", "nhánh proxy vẫn retry bằng guard 95W2");
  assert.equal(el.playCalls, 2);
});

console.log(`\n${pass} pass, ${fail} fail${failedNames.length ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
process.exitCode = fail ? 1 : 0;
