// media.blobPrefetch90R3.test.ts — unit test prefetch blob cho clip
// proxy/HTTP nhỏ (đợt 90 R3, WebKit clip D).
// Chạy (từ gốc repo): media.ts import "./lib" không đuôi nên Node
// strip-types không resolve được (thư mục src/lib/ tồn tại) — bundle
// qua esbuild rồi chạy:
//   ./node_modules/.bin/esbuild apps/web/src/media.blobPrefetch90R3.test.ts --bundle --format=esm --platform=node --outfile=/tmp/blob-prefetch-90r3.test.mjs && node /tmp/blob-prefetch-90r3.test.mjs
// Hoặc chạy cả 3 test media.* cùng lúc (runner thống nhất đợt 96 X8):
//   node apps/web/scripts/run-media-tests.mjs
import assert from "node:assert/strict";
import {
  MediaPool,
  BLOB_PREFETCH_MAX_BYTES,
  BLOB_PREFETCH_TOTAL_CAP_BYTES,
  isBlobPrefetchCandidateUrl,
  knownProxySizeBytesForPrefetch,
  isLowMemoryDeviceForPrefetch,
} from "./media.ts";
import type { MediaItem } from "./media.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

/* --- Shim DOM + fetch tối thiểu cho MediaPool.videoFor() trong Node --- */
type Handler = () => void;
class FakeVideo {
  preload = "";
  playsInline = false;
  muted = false;
  dataset: Record<string, string> = {};
  currentTime = 0;
  paused = true;
  seeking = false;
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
    for (const h of this.handlers.get(type) ?? []) h();
  }
  pause(): void {
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

/* --- Fetch stub: mỗi test cấu hình response qua `fetchBehavior` --- */
type FetchBehavior = {
  ok?: boolean;
  contentLength?: number | null; // null = không gửi header
  chunks?: Uint8Array[]; // streaming path; undefined = body null → arrayBuffer
  arrayBufferBytes?: number; // cho path body null
  reject?: Error;
  cancelled?: { count: number };
};
let fetchBehavior: FetchBehavior = {};
let fetchCalls = 0;
let lastFetchUrl = "";
(globalThis as Record<string, unknown>).fetch = async (url: string) => {
  fetchCalls++;
  lastFetchUrl = url;
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
          cancel: async () => {
            if (b.cancelled) b.cancelled.count++;
          },
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

/* navigator.deviceMemory — mặc định không báo (undefined). Node 24 để
 * globalThis.navigator là getter-only nên phải defineProperty. */
const navState: { deviceMemory?: number } = {};
Object.defineProperty(globalThis, "navigator", { value: navState, configurable: true });

const MB = 1024 * 1024;
const chunk = (bytes: number) => new Uint8Array(bytes);
const video = (over: Partial<MediaItem> = {}): MediaItem => ({
  id: "m1",
  name: "d.mp4",
  kind: "video",
  url: "blob:local-original",
  duration: 4,
  proxyUrl: "http://127.0.0.1:8896/d.mp4",
  proxySizeBytes: 1_320_168,
  ...over,
});
const flush = async (ms = 25) => {
  await new Promise((r) => setTimeout(r, ms));
  await new Promise((r) => setTimeout(r, ms));
};
function resetStubs() {
  fetchBehavior = {};
  fetchCalls = 0;
  lastFetchUrl = "";
  createdBlobs.length = 0;
  revokedBlobs.length = 0;
  delete navState.deviceMemory;
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

console.log("== blob prefetch (đợt 90 R3) ==");
await test("hằng ngưỡng: 8 MiB / tổng 64 MiB", () => {
  assert.equal(BLOB_PREFETCH_MAX_BYTES, 8 * MB);
  assert.equal(BLOB_PREFETCH_TOTAL_CAP_BYTES, 64 * MB);
});

await test("URL ứng viên: chỉ http(s), blob: thì không", () => {
  assert.equal(isBlobPrefetchCandidateUrl("http://127.0.0.1:8896/d.mp4"), true);
  assert.equal(isBlobPrefetchCandidateUrl("https://x/y.mp4"), true);
  assert.equal(isBlobPrefetchCandidateUrl("blob:abc"), false);
  assert.equal(isBlobPrefetchCandidateUrl("/local.mp4"), false);
});

await test("knownProxySizeBytesForPrefetch: chỉ tin số hợp lệ > 0", () => {
  assert.equal(knownProxySizeBytesForPrefetch(video({ proxySizeBytes: 100 })), 100);
  assert.equal(knownProxySizeBytesForPrefetch(video({ proxySizeBytes: 0 })), undefined);
  assert.equal(knownProxySizeBytesForPrefetch(video({ proxySizeBytes: -5 })), undefined);
  assert.equal(knownProxySizeBytesForPrefetch(video({ proxySizeBytes: NaN })), undefined);
  assert.equal(knownProxySizeBytesForPrefetch(video({ proxySizeBytes: undefined })), undefined);
});

await test("isLowMemoryDeviceForPrefetch: deviceMemory < 1 thì yếu", () => {
  assert.equal(isLowMemoryDeviceForPrefetch(), false);
  navState.deviceMemory = 0.5;
  assert.equal(isLowMemoryDeviceForPrefetch(), true);
  navState.deviceMemory = 2;
  assert.equal(isLowMemoryDeviceForPrefetch(), false);
});

await test("size đã biết > 8 MiB → không fetch, src giữ proxyUrl, skipped", async () => {
  const pool = new MediaPool();
  const item = video({ proxySizeBytes: 9 * MB });
  const el = pool.videoFor(item) as unknown as FakeVideo;
  assert.equal(el.src, item.proxyUrl);
  assert.equal(fetchCalls, 0);
  await flush();
  assert.equal(fetchCalls, 0);
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
  assert.equal(el.src, item.proxyUrl);
});

await test("size đã biết ≤ 8 MiB → fetch 1 lần, xong swap sang blob:", async () => {
  fetchBehavior = { contentLength: 1_320_168, chunks: [chunk(700_000), chunk(620_168)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  assert.equal(el.src, item.proxyUrl); // lúc đầu vẫn progressive
  assert.equal(fetchCalls, 1);
  assert.equal(lastFetchUrl, item.proxyUrl);
  assert.equal(pool.blobPrefetchInfo(item).mode, "pending");
  await flush();
  assert.ok(el.src.startsWith("blob:fake-"), `src phải là blob, thực tế ${el.src}`);
  const info = pool.blobPrefetchInfo(item);
  assert.equal(info.mode, "blob");
  assert.equal(info.bytes, 1_320_168);
});

await test("size chưa biết + stream vượt cap → cancel, fallback, skipped, không fetch lại", async () => {
  const cancelled = { count: 0 };
  fetchBehavior = { contentLength: null, chunks: [chunk(10 * MB), chunk(10 * MB)], cancelled };
  const pool = new MediaPool();
  const item = video({ proxySizeBytes: undefined });
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.equal(cancelled.count, 1);
  assert.equal(createdBlobs.length, 0);
  assert.equal(el.src, item.proxyUrl);
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
  pool.videoFor(item);
  pool.videoFor(item);
  await flush();
  assert.equal(fetchCalls, 1); // ghi nhớ skipped → không fetch lại
});

await test("Content-Length báo > cap → không đọc body, skipped", async () => {
  fetchBehavior = { contentLength: 20 * MB, chunks: [chunk(100)] };
  const pool = new MediaPool();
  const item = video({ proxySizeBytes: undefined });
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.equal(fetchCalls, 1);
  assert.equal(createdBlobs.length, 0);
  assert.equal(el.src, item.proxyUrl);
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
});

await test("fetch reject → fallback progressive, skipped, không throw", async () => {
  fetchBehavior = { reject: new Error("Failed to fetch") };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.equal(el.src, item.proxyUrl);
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
});

await test("HTTP 404 → fallback progressive, skipped", async () => {
  fetchBehavior = { ok: false, chunks: [chunk(10)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.equal(el.src, item.proxyUrl);
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
});

await test("path arrayBuffer (body null) quá cap → skipped", async () => {
  fetchBehavior = { contentLength: null, arrayBufferBytes: 17 * MB };
  const pool = new MediaPool();
  const item = video({ proxySizeBytes: undefined });
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.equal(createdBlobs.length, 0);
  assert.equal(el.src, item.proxyUrl);
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
});

await test("đang phát lúc fetch xong → KHÔNG swap giữa chừng; pause về 0 thì swap", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  el.paused = false; // đang phát
  el.currentTime = 1.5;
  await flush();
  assert.equal(el.src, item.proxyUrl); // không swap khi đang phát
  assert.equal(pool.blobPrefetchInfo(item).mode, "blob"); // nhưng blob đã cache
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item); // lần gọi sau: element sạch → dùng blob
  assert.ok(el.src.startsWith("blob:fake-"), `sau pause về 0 phải swap, thực tế ${el.src}`);
});

await test("dropElement giữ blob; element mới dùng blob ngay, không fetch lại", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el1 = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.ok(el1.src.startsWith("blob:fake-"));
  assert.equal(fetchCalls, 1);
  assert.equal(pool.dropElement(el1 as unknown as HTMLVideoElement), true);
  assert.equal(revokedBlobs.length, 0); // drop không thu hồi blob
  const el2 = pool.videoFor(item) as unknown as FakeVideo;
  assert.notEqual(el2, el1);
  assert.equal(el2.src, el1.src); // dùng lại blob cũ
  await flush();
  assert.equal(fetchCalls, 1);
});

await test("revokeBlobPrefetch thu hồi URL; videoFor sau đó fetch lại", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  const blobUrl = el.src;
  pool.revokeBlobPrefetch(item.id);
  assert.deepEqual(revokedBlobs, [blobUrl]);
  assert.equal(pool.blobPrefetchInfo(item).mode, "none");
  pool.videoFor(item);
  assert.equal(el.src, item.proxyUrl); // về progressive trong lúc fetch lại
  await flush();
  assert.equal(fetchCalls, 2);
  assert.ok(el.src.startsWith("blob:fake-"));
  assert.notEqual(el.src, blobUrl);
});

await test("máy yếu (deviceMemory 0.5) → không fetch, skipped", async () => {
  navState.deviceMemory = 0.5;
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.equal(fetchCalls, 0);
  assert.equal(el.src, item.proxyUrl);
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
});

await test("local import blob: → không fetch", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video({ proxyUrl: undefined, url: "blob:local-original" });
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.equal(fetchCalls, 0);
  assert.equal(el.src, "blob:local-original");
  assert.equal(pool.blobPrefetchInfo(item).mode, "none");
});

await test("lỗi trên blob src → thu hồi blob, fallback về url gốc", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  const blobUrl = el.src;
  assert.ok(blobUrl.startsWith("blob:fake-"));
  el.fire("error");
  assert.deepEqual(revokedBlobs, [blobUrl]);
  assert.equal(el.src, item.url); // fallback 1 lần về file gốc
  assert.equal(pool.blobPrefetchInfo(item).mode, "skipped");
});

await test("vượt cap tổng 64 MiB → thu hồi blob cũ nhất (FIFO)", async () => {
  fetchBehavior = { contentLength: 8 * MB, chunks: [chunk(8 * MB)] };
  const pool = new MediaPool();
  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
    video({ id: `m${i}`, proxyUrl: `http://127.0.0.1:8896/c${i}.mp4`, proxySizeBytes: 8 * MB }),
  );
  const els = items.map((it) => pool.videoFor(it) as unknown as FakeVideo);
  await flush(40);
  // 9 × 8 MiB = 72 MiB > 64 MiB → blob đầu tiên bị thu hồi
  assert.equal(pool.blobPrefetchInfo(items[0]).mode, "none");
  assert.ok(revokedBlobs.length >= 1, `phải thu hồi ≥1 blob, thực tế ${revokedBlobs.length}`);
  for (let i = 1; i < 9; i++) {
    assert.equal(pool.blobPrefetchInfo(items[i]).mode, "blob");
    assert.ok(els[i].src.startsWith("blob:fake-"));
  }
});

await test("videoFor lặp lại không fetch thêm khi đang pending", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  pool.videoFor(item);
  pool.videoFor(item);
  pool.videoFor(item);
  await flush();
  assert.equal(fetchCalls, 1);
});

// Đợt 92 T1 — khóa flip-flop src: đếm số lần gán el.src sau khi latch.
// Cơ chế cũ: videoFor tính `assigned` lại mỗi tick từ trạng thái
// momentary của element (đang phát → http; vừa gán src xong thì trình
// duyệt reset paused=true/ct=0 → pristine → blob) nên src dao động
// blob↔http mỗi tick trong lúc phát (S3 đo 29 lần trên cùng element).
// Helper: đếm lần gán src trên 1 FakeVideo (ghi đè accessor của instance).
function trackSrcSets(el: FakeVideo): { count: number } {
  const counter = { count: 0 };
  let cur = el.src;
  Object.defineProperty(el, "src", {
    configurable: true,
    get: () => cur,
    set: (v: string) => {
      counter.count++;
      cur = v;
    },
  });
  return counter;
}

await test("T1: blob đã chốt — tick phát + trạng thái pristine momentary KHÔNG lật src", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.ok(el.src.startsWith("blob:fake-"));
  const sets = trackSrcSets(el);
  // Tick 1: element vừa gán src xong, trình duyệt reset về paused/ct=0
  // (momentary pristine) — code cũ lật về blob rồi lại http ở tick sau.
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item);
  // Tick 2-3: đang phát — code cũ gán lại http mỗi lần.
  el.paused = false;
  el.currentTime = 0.1;
  pool.videoFor(item);
  el.paused = false;
  el.currentTime = 0.5;
  pool.videoFor(item);
  // Tick 4: stall/seek làm element tạm dừng ở ct=0 — code cũ lật blob.
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item);
  // Tick 5: phát tiếp.
  el.paused = false;
  el.currentTime = 0.9;
  pool.videoFor(item);
  assert.equal(sets.count, 0, `flip-flop: ${sets.count} lần gán src trong lúc phát`);
  assert.ok(el.src.startsWith("blob:fake-"));
});

await test("T1: http đã chốt — blob về giữa lúc phát thì KHÔNG swap; về 0 thì upgrade ĐÚNG 1 lần rồi giữ", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  assert.equal(el.src, item.proxyUrl);
  const sets = trackSrcSets(el);
  // Đang phát lúc fetch xong → không swap giữa chừng.
  el.paused = false;
  el.currentTime = 1.5;
  await flush();
  assert.equal(el.src, item.proxyUrl);
  assert.equal(sets.count, 0);
  pool.videoFor(item);
  pool.videoFor(item);
  assert.equal(el.src, item.proxyUrl);
  assert.equal(sets.count, 0);
  // Scrub/pause về 0 → upgrade sang blob đúng 1 lần.
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item);
  assert.ok(el.src.startsWith("blob:fake-"), `sau pause về 0 phải swap, thực tế ${el.src}`);
  assert.equal(sets.count, 1);
  // Phát tiếp trên blob: không lật lại http nữa.
  el.paused = false;
  el.currentTime = 0.4;
  pool.videoFor(item);
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item);
  el.paused = false;
  el.currentTime = 0.8;
  pool.videoFor(item);
  assert.equal(sets.count, 1, `sau upgrade phải giữ blob, thực tế ${sets.count} lần gán`);
  assert.ok(el.src.startsWith("blob:fake-"));
});

await test("T1: phát lại sau pause ở ct≠0 giữ nguyên blob đã chốt", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  assert.ok(el.src.startsWith("blob:fake-"));
  const sets = trackSrcSets(el);
  el.paused = false;
  el.currentTime = 2;
  pool.videoFor(item);
  el.paused = true; // pause ở ct=2
  el.currentTime = 2;
  pool.videoFor(item);
  el.paused = false; // phát lại sau pause
  el.currentTime = 2;
  pool.videoFor(item);
  assert.equal(sets.count, 0);
  assert.ok(el.src.startsWith("blob:fake-"), "phát lại sau pause phải dùng lại blob");
});

await test("T1: lỗi trên blob → fallback về file gốc và latch giữ, không lật lại blob/proxy", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  const blobUrl = el.src;
  assert.ok(blobUrl.startsWith("blob:fake-"));
  el.fire("error");
  assert.equal(el.src, item.url);
  const sets = trackSrcSets(el);
  // Tick sau — kể cả khi element sạch — vẫn giữ file gốc.
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item);
  pool.videoFor(item);
  el.paused = false;
  el.currentTime = 1;
  pool.videoFor(item);
  assert.equal(sets.count, 0, "fallback lỗi không được lật lại src");
  assert.equal(el.src, item.url);
  assert.equal(fetchCalls, 1); // skipped → không fetch lại
  assert.deepEqual(revokedBlobs, [blobUrl]);
});

await test("T1: lỗi trên proxy http → fallback về file gốc, tick sau giữ nguyên", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video({ proxySizeBytes: 9 * MB }); // quá cap → không fetch blob
  const el = pool.videoFor(item) as unknown as FakeVideo;
  assert.equal(el.src, item.proxyUrl);
  await flush();
  el.fire("error");
  assert.equal(el.src, item.url);
  const sets = trackSrcSets(el);
  el.paused = true;
  el.currentTime = 0;
  pool.videoFor(item);
  pool.videoFor(item);
  assert.equal(sets.count, 0);
  assert.equal(el.src, item.url);
  assert.equal(fetchCalls, 0);
});

await test("T1: proxyUrl đổi (proxy tạo lại) → quyết định lại 1 lần cho want mới", async () => {
  fetchBehavior = { contentLength: 1000, chunks: [chunk(1000)] };
  const pool = new MediaPool();
  const item = video();
  const el = pool.videoFor(item) as unknown as FakeVideo;
  await flush();
  const blob1 = el.src;
  assert.ok(blob1.startsWith("blob:fake-"));
  assert.equal(fetchCalls, 1);
  const item2 = video({ proxyUrl: "http://127.0.0.1:8896/d2.mp4" });
  const sets = trackSrcSets(el);
  const el2 = pool.videoFor(item2) as unknown as FakeVideo;
  assert.equal(el2, el); // cùng element
  assert.equal(el.src, item2.proxyUrl); // về http mới trong lúc fetch lại
  assert.equal(fetchCalls, 2);
  assert.equal(lastFetchUrl, item2.proxyUrl);
  assert.deepEqual(revokedBlobs, [blob1]); // blob cũ bị thu hồi
  await flush();
  assert.ok(el.src.startsWith("blob:fake-"));
  assert.notEqual(el.src, blob1);
  assert.equal(sets.count, 2); // http mới + blob mới, không hơn
});

console.log(`\n${pass} pass, ${fail} fail${failedNames.length ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
process.exitCode = fail ? 1 : 0;
