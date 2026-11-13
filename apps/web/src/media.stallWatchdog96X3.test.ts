// media.stallWatchdog96X3.test.ts — unit test stall-watchdog đường blob pre-metadata
// (Phase 9 đợt 96, luồng X3; nợ LIMITS gộp đợt 95 §4 mục 3).
// Chạy (từ gốc repo — giống file retryPlay95W2.test.ts):
//   ./node_modules/.bin/esbuild apps/web/src/media.stallWatchdog96X3.test.ts --bundle --format=esm --platform=node --outfile=/tmp/stall-watchdog-96x3.test.mjs && node /tmp/stall-watchdog-96x3.test.mjs
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
  bufRanges: Array<[number, number]> = [];
  get buffered(): { length: number; end: (i: number) => number } {
    return { length: this.bufRanges.length, end: (i: number) => this.bufRanges[i][1] };
  }
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

// Đồng hồ giả: production dùng performance.now() (watchdog + arm retry).
let fakeNow = 0;
Object.defineProperty(globalThis, "performance", {
  value: { now: () => fakeNow },
  configurable: true,
});

const chunk = (bytes: number) => new Uint8Array(bytes);
const video = (over: Partial<MediaItem> = {}): MediaItem => ({
  id: "m1",
  name: "d.mp4",
  kind: "video",
  url: "http://127.0.0.1:8901/d.mp4",
  duration: 4,
  proxyUrl: "http://127.0.0.1:8901/d.mp4",
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
  fakeNow = 0;
}

/** Đưa element tới trạng thái "blob kẹt pre-metadata": swap sang blob,
 * play() đã gọi (paused=false như play() pending thật — không set
 * paused=true như test error-branch), rs=0, ct=0. */
async function setupStalledBlob(proxy = true): Promise<{ pool: MediaPool; item: MediaItem; el: FakeVideo; blobUrl: string }> {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = proxy ? video() : video({ proxyUrl: undefined });
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  const blobUrl = el.src;
  assert.ok(blobUrl.startsWith("blob:fake-"), `phải swap sang blob trước, thực tế ${blobUrl}`);
  void el.play(); // ý định phát; fake play() để paused=false (đúng trạng thái pending thật)
  assert.equal(el.paused, false);
  return { pool, item, el, blobUrl };
}

/** Mô phỏng trình duyệt: đổi src trong lúc play() pending thì promise bị
 * reject và element về paused=true (đã đo bằng thí nghiệm
 * play-pending-src-switch đợt 96 X3: case A rejected + paused=true). */
function simulatePendingPlayRejected(el: FakeVideo): void {
  el.paused = true;
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

console.log("== stall-watchdog blob pre-metadata (đợt 96 X3) ==");

await test("kẹt 8 s không progress (proxy) → fallback http + canplay → play() lại 1 lần (guard 95W2)", async () => {
  const { pool, item, el, blobUrl } = await setupStalledBlob(true);
  pool.videoFor(item); // tick đầu: ghi dấu lastProgress (fakeNow=0)
  fakeNow = 7999;
  pool.videoFor(item);
  assert.equal(el.src, blobUrl, "chưa đủ 8 s thì chưa fallback");
  fakeNow = 8000;
  pool.videoFor(item);
  assert.equal(el.dataset.stallWatchdog96X3Fired, "1");
  assert.equal(el.src, item.url, "đủ 8 s không progress → về http");
  assert.equal(el.dataset.proxyFallback, "1");
  assert.ok(revokedBlobs.includes(blobUrl), "blob kẹt phải bị revoke");
  assert.equal(el.playCalls, 1, "chưa canplay thì chưa retry");
  simulatePendingPlayRejected(el);
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "canplay sau fallback phải play lại 1 lần");
  assert.equal(el.dataset.retryPlay95W2Fired, "1", "item có proxy dùng guard 95W2");
  el.fire("canplay");
  assert.equal(el.playCalls, 2, "retry chỉ 1 lần");
});

await test("kẹt 8 s không progress (không proxy) → fallback http + retry guard 96X3", async () => {
  const { pool, item, el } = await setupStalledBlob(false);
  pool.videoFor(item);
  fakeNow = 8000;
  pool.videoFor(item);
  assert.equal(el.dataset.stallWatchdog96X3Fired, "1");
  assert.equal(el.src, item.url);
  assert.equal(el.dataset.proxyFallback, "", "không proxy thì không set proxyFallback");
  simulatePendingPlayRejected(el);
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.dataset.retryPlay96X3Fired, "1", "item không proxy dùng guard 96X3");
  assert.equal(el.playCalls, 2);
});

await test("progress event trước hạn reset đồng hồ → không fallback oan", async () => {
  const { pool, item, el, blobUrl } = await setupStalledBlob(true);
  pool.videoFor(item); // lastProgress = 0
  fakeNow = 5000;
  el.fire("progress"); // tiến triển lúc 5 s → hạn mới 13 s
  pool.videoFor(item);
  fakeNow = 12000;
  pool.videoFor(item);
  assert.equal(el.src, blobUrl, "12 s < 5 s + 8 s thì chưa fallback");
  fakeNow = 13000;
  pool.videoFor(item);
  assert.equal(el.src, item.url, "13 s = 5 s + 8 s thì fallback");
});

await test("readyState lên 2 trước hạn → không fallback (đang load tốt)", async () => {
  const { pool, item, el, blobUrl } = await setupStalledBlob(true);
  pool.videoFor(item);
  fakeNow = 7000;
  el.readyState = 2; // metadata tới (slow-start khỏe)
  pool.videoFor(item);
  fakeNow = 20000;
  pool.videoFor(item);
  assert.equal(el.src, blobUrl, "rs>=2 thì watchdog không theo dõi nữa");
  assert.equal(el.dataset.stallWatchdog96X3Fired, undefined);
});

await test("buffered tăng trước hạn reset đồng hồ → không fallback oan", async () => {
  const { pool, item, el, blobUrl } = await setupStalledBlob(true);
  pool.videoFor(item);
  fakeNow = 7000;
  el.bufRanges = [[0, 2]]; // dữ liệu vào buffer lúc 7 s
  pool.videoFor(item);
  fakeNow = 14000;
  pool.videoFor(item);
  assert.equal(el.src, blobUrl, "14 s < 7 s + 8 s thì chưa fallback");
  fakeNow = 15000;
  pool.videoFor(item);
  assert.equal(el.src, item.url, "15 s = 7 s + 8 s thì fallback");
});

await test("pause() trước hạn → không fallback (user đã dừng)", async () => {
  const { pool, item, el, blobUrl } = await setupStalledBlob(true);
  pool.videoFor(item);
  fakeNow = 4000;
  el.pause(); // user bấm pause lúc 4 s
  pool.videoFor(item);
  fakeNow = 20000;
  pool.videoFor(item);
  assert.equal(el.src, blobUrl, "đã pause thì watchdog không theo dõi");
  assert.equal(el.dataset.stallWatchdog96X3Fired, undefined);
});

await test("currentTime tiến trước hạn → không fallback (đang phát)", async () => {
  const { pool, item, el, blobUrl } = await setupStalledBlob(true);
  pool.videoFor(item);
  fakeNow = 4000;
  el.currentTime = 1; // đã phát được
  pool.videoFor(item);
  fakeNow = 20000;
  pool.videoFor(item);
  assert.equal(el.src, blobUrl, "ct>0 thì không phải stall pre-metadata");
});

await test("sau fallback, tick tiếp không fallback/arm lại lần nữa", async () => {
  const { pool, item, el } = await setupStalledBlob(true);
  pool.videoFor(item);
  fakeNow = 8000;
  pool.videoFor(item);
  assert.equal(el.src, item.url);
  simulatePendingPlayRejected(el);
  el.readyState = 2;
  el.fire("canplay");
  assert.equal(el.playCalls, 2);
  fakeNow = 30000;
  pool.videoFor(item);
  pool.videoFor(item);
  assert.equal(el.playCalls, 2, "không arm lại sau khi đã fallback");
  assert.equal(el.src, item.url, "không đổi src nữa");
});

await test("dropElement xóa entry watch → element mới không fallback oan ngay", async () => {
  const { pool, item, el, blobUrl } = await setupStalledBlob(true);
  pool.videoFor(item); // entry lastProgress=0
  fakeNow = 20000; // đã quá hạn nhưng chưa tick → chưa fallback
  assert.equal(pool.dropElement(el as unknown as HTMLVideoElement), true);
  const el2 = pool.videoFor(item) as unknown as FakeVideo;
  // Element mới: entry mới ghi dấu ở fakeNow=20000, chưa đủ 8 s → không fallback.
  assert.ok(el2.src.startsWith("blob:fake-") || el2.src === item.url, `element mới src lạ: ${el2.src}`);
  assert.equal(el2.dataset.stallWatchdog96X3Fired, undefined);
  void blobUrl;
});

console.log(`\n${pass} pass, ${fail} fail${failedNames.length ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
process.exitCode = fail ? 1 : 0;
