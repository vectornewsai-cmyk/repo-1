// gopWiring40V2.test.ts — Nối GOP Range (T3) vào ReversePreviewController
// (Phase 9 đợt 40, luồng V2).
//
// Chạy bằng esbuild bundle (như T3/U2):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopWiring40V2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r40v2.test.cjs \
//     && node /tmp/r40v2.test.cjs
// (chạy từ gốc repo).
//
// Phạm vi test: ngưỡng kích hoạt (thuần), cache GOP (thuần), fetch bù
// 1 GOP (HTTP Range thật qua fake in-memory + fixture ffmpeg thật),
// và controller: lần tải GOP đầu tiên + cache miss fetch bù + fallback
// full-file khi gate từ chối/moov cuối/200 phớt Range. Decode thật cần
// VideoDecoder của browser nên KHÔNG có trong test Node này: ở Node,
// ensureWindowForTime trả false vì thiếu VideoDecoder (đúng fail-soft),
// nhưng track đã có (ready), gopMode và cache stats vẫn khẳng định
// được đường nối đã chạy — ghi rõ, không mạo nhận đã decode.
// Fixture chỉ nằm trong os.tmpdir(), KHÔNG đưa vào repo (cấm binary).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import {
  buildGopSegment,
  fetchSingleGopRange,
  gopMetaFor,
  gopsForDecodeRange,
  GopSegmentCache,
  resolveGopRangeWiring,
} from "./gopCache40V2.ts";
import { gopRangesFor } from "./gopRangeFetch39T3.ts";
import type { GopRangeFetchFn } from "./gopRangeFetch39T3.ts";
import { parseMp4VideoTrack } from "./mp4Demux.ts";
import { ReversePreviewController } from "./reverseWebcodecs.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => Promise<void> | void }> = [];
function ok(name: string, fn: () => Promise<void> | void): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`gopWiring40V2: ${pass}/${queue.length} test pass`);
}

// ---- Fixture ffmpeg thật (cùng công thức T3) ----
const dir = mkdtempSync(join(tmpdir(), "vcut-v2-"));
function makeFixture(name: string, faststart: boolean): Buffer {
  const out = join(dir, name);
  const args = [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10",
  ];
  if (faststart) args.push("-movflags", "+faststart");
  args.push(out);
  execFileSync("ffmpeg", args, { stdio: "pipe" });
  return readFileSync(out);
}
const fastBuf = makeFixture("faststart.mp4", true);
const trailBuf = makeFixture("trailing.mp4", false);
console.log(`  fixture faststart: ${fastBuf.length} byte, trailing: ${trailBuf.length} byte`);

// ---- Fake fetch in-memory, hỗ trợ Range thật + ghi log request ----
type FakeMode = "range" | "ignore" | "accept-none" | "fail416";
interface FakeLog { method: string; range: string | null; status: number }
function makeFake(
  buf: Buffer,
  mode: FakeMode,
  log: FakeLog[],
  failStart?: number,
): GopRangeFetchFn {
  const headersOf = (entries: Array<[string, string]>) => {
    const m = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
    return { get: (n: string) => m.get(n.toLowerCase()) ?? null };
  };
  return (async (url: string, init?: { method?: string; headers?: Record<string, string> }) => {
    void url;
    const method = (init?.method ?? "GET").toUpperCase();
    const rangeHeader = init?.headers?.Range ?? init?.headers?.range ?? null;
    if (method === "HEAD") {
      log.push({ method: "HEAD", range: null, status: 200 });
      return {
        status: 200,
        ok: true,
        headers: headersOf([
          ["content-length", String(buf.length)],
          ["accept-ranges", mode === "accept-none" ? "none" : "bytes"],
        ]),
        arrayBuffer: async () => new ArrayBuffer(0),
        body: { cancel: async () => {} },
      } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
    }
    if (mode === "ignore") {
      log.push({ method: "GET", range: rangeHeader, status: 200 });
      return {
        status: 200,
        ok: true,
        headers: headersOf([["content-length", String(buf.length)]]),
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
        body: { cancel: async () => {} },
      } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
    }
    if (rangeHeader) {
      const m = /^bytes=(\d+)-(\d+)$/.exec(rangeHeader);
      assert.ok(m, `fake: Range không parse được: ${rangeHeader}`);
      const start = Number(m[1]);
      const end = Number(m[2]);
      if (mode === "fail416" && start === failStart) {
        log.push({ method: "GET", range: rangeHeader, status: 416 });
        return {
          status: 416,
          ok: false,
          headers: headersOf([["content-range", `bytes */${buf.length}`]]),
          arrayBuffer: async () => new ArrayBuffer(0),
          body: { cancel: async () => {} },
        } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
      }
      const slice = buf.subarray(start, end + 1);
      log.push({ method: "GET", range: rangeHeader, status: 206 });
      return {
        status: 206,
        ok: true,
        headers: headersOf([
          ["content-range", `bytes ${start}-${end}/${buf.length}`],
          ["accept-ranges", mode === "accept-none" ? "none" : "bytes"],
        ]),
        arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer,
        body: { cancel: async () => {} },
      } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
    }
    log.push({ method: "GET", range: null, status: 200 });
    return {
      status: 200,
      ok: true,
      headers: headersOf([
        ["content-length", String(buf.length)],
        ["accept-ranges", mode === "accept-none" ? "none" : "bytes"],
      ]),
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      body: { cancel: async () => {} },
    } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
  }) as GopRangeFetchFn;
}

// Full-file fake cho global fetch của controller (load() cũ).
function installGlobalFull(buf: Buffer): () => void {
  const prev = (globalThis as unknown as { fetch?: unknown }).fetch;
  const log: FakeLog[] = [];
  (globalThis as unknown as { fetch: unknown }).fetch = makeFake(buf, "range", log);
  return () => {
    (globalThis as unknown as { fetch?: unknown }).fetch = prev;
  };
}

// ---- 1. Ngưỡng kích hoạt ----
ok("ngưỡng: tắt mặc định thì off dù size trong khoảng", () => {
  const d = resolveGopRangeWiring({ enabled: false, knownSizeBytes: 64 * 1024 * 1024 });
  assert.equal(d.useGop, false);
  assert.match(d.reason, /disabled/);
});
ok("ngưỡng: chưa biết size thì off (gate cũng cần size)", () => {
  for (const s of [null, undefined, 0, NaN]) {
    const d = resolveGopRangeWiring({ enabled: true, knownSizeBytes: s as unknown as number });
    assert.equal(d.useGop, false, `size=${String(s)}`);
    assert.match(d.reason, /size-unknown/);
  }
});
ok("ngưỡng: dưới/ngay 32 MiB thì off, trên 32 MiB thì on", () => {
  const MiB = 1024 * 1024;
  assert.equal(resolveGopRangeWiring({ enabled: true, knownSizeBytes: 16 * MiB }).useGop, false);
  assert.equal(resolveGopRangeWiring({ enabled: true, knownSizeBytes: 32 * MiB }).useGop, false);
  const on = resolveGopRangeWiring({ enabled: true, knownSizeBytes: 32 * MiB + 1 });
  assert.equal(on.useGop, true);
  assert.match(on.reason, /gop-range/);
});
ok("ngưỡng: ngay 128 MiB thì on, trên 128 MiB thì khóa S4 (không mở lại file lớn)", () => {
  const MiB = 1024 * 1024;
  assert.equal(resolveGopRangeWiring({ enabled: true, knownSizeBytes: 128 * MiB }).useGop, true);
  const d = resolveGopRangeWiring({ enabled: true, knownSizeBytes: 128 * MiB + 1 });
  assert.equal(d.useGop, false);
  assert.match(d.reason, /large-file-locked/);
});
ok("ngưỡng: ghi đè threshold/large cho test vẫn tôn trọng biên", () => {
  assert.equal(resolveGopRangeWiring({ enabled: true, knownSizeBytes: 2000, thresholdBytes: 1024, largeFileBytes: 4096 }).useGop, true);
  assert.equal(resolveGopRangeWiring({ enabled: true, knownSizeBytes: 5000, thresholdBytes: 1024, largeFileBytes: 4096 }).useGop, false);
});

// ---- 2. Cache GOP ----
function fakeSeg(index: number, start: number, end: number): import("./gopRangeFetch39T3.ts").GopSegment {
  return {
    index, firstSampleIndex: index, lastSampleIndex: index, sampleCount: 1,
    rangeStart: start, rangeEnd: end, rangeBytes: end - start, sampleBytes: end - start,
    chunks: [],
  };
}
ok("cache: hit chạm LRU, miss đếm, evict cũ nhất khi vượt trần byte", () => {
  const c = new GopSegmentCache(1000, 10);
  assert.equal(c.put(fakeSeg(0, 0, 400)), true);
  assert.equal(c.put(fakeSeg(1, 400, 800)), true);
  assert.equal(c.get(0)?.index, 0); // chạm 0 → 1 thành cũ nhất
  assert.equal(c.put(fakeSeg(2, 800, 1100)), true); // 400+400+300 > 1000 → evict 1
  assert.equal(c.has(1), false);
  assert.equal(c.has(0), true);
  assert.equal(c.has(2), true);
  assert.equal(c.bytes, 700);
  assert.equal(c.get(9), undefined);
  assert.equal(c.misses, 1);
  assert.equal(c.hits, 1);
});
ok("cache: trần số GOP + GOP đơn vượt trần bị từ chối, không xóa cache cũ", () => {
  const c = new GopSegmentCache(100000, 2);
  assert.equal(c.put(fakeSeg(0, 0, 100)), true);
  assert.equal(c.put(fakeSeg(1, 100, 200)), true);
  assert.equal(c.put(fakeSeg(2, 200, 300)), true); // vượt trần số → evict 0
  assert.equal(c.has(0), false);
  assert.equal(c.size, 2);
  const big = new GopSegmentCache(1000, 10);
  assert.equal(big.put(fakeSeg(0, 0, 100)), true);
  assert.equal(big.put(fakeSeg(9, 0, 5000)), false); // đơn lẻ vượt trần
  assert.equal(big.has(0), true);
  assert.equal(big.bytes, 100);
});
ok("cache: gopsForDecodeRange giao đúng theo sample", () => {
  const track = parseMp4VideoTrack(fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer);
  const meta = gopMetaFor(
    gopRangesFor(track.samples).map((g, i) => ({
      index: i, firstSampleIndex: g.firstSampleIndex, lastSampleIndex: g.lastSampleIndex,
      sampleCount: g.lastSampleIndex - g.firstSampleIndex + 1,
      rangeStart: g.rangeStart, rangeEnd: g.rangeEnd, rangeBytes: g.rangeEnd - g.rangeStart,
      sampleBytes: g.sampleBytes, chunks: [],
    })),
  );
  assert.deepEqual(gopsForDecodeRange(meta, 0, 9), [0]);
  assert.deepEqual(gopsForDecodeRange(meta, 5, 15), [0, 1]);
  assert.deepEqual(gopsForDecodeRange(meta, 59, 59), [5]);
});

// ---- 3. Fetch bù 1 GOP + dựng segment ----
ok("fetch bù 1 GOP: 206 đúng byte slice gốc; build segment khớp sample", async () => {
  const track = parseMp4VideoTrack(fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer);
  const defs = gopRangesFor(track.samples);
  const log: FakeLog[] = [];
  const fake = makeFake(fastBuf, "range", log);
  const g0 = defs[0];
  const res = await fetchSingleGopRange("fake://v2.mp4", g0.rangeStart, g0.rangeEnd, fastBuf.length, fake);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(Buffer.from(res.bytes), fastBuf.subarray(g0.rangeStart, g0.rangeEnd));
    const meta = { index: 0, firstSampleIndex: g0.firstSampleIndex, lastSampleIndex: g0.lastSampleIndex, rangeStart: g0.rangeStart, rangeEnd: g0.rangeEnd };
    const seg = buildGopSegment(track, meta, res.bytes);
    assert.equal(seg.sampleCount, 10);
    for (let i = 0; i < seg.chunks.length; i++) {
      const s = track.samples[g0.firstSampleIndex + i];
      assert.deepEqual(Buffer.from(seg.chunks[i].data), fastBuf.subarray(s.offset, s.offset + s.size));
    }
  }
  assert.equal(log.filter((l) => l.status === 206).length, 1);
});
ok("fetch bù 1 GOP: 200 phớt Range và 416 đều ok:false, không throw", async () => {
  const track = parseMp4VideoTrack(fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer);
  const g0 = gopRangesFor(track.samples)[0];
  const r200 = await fetchSingleGopRange("fake://v2.mp4", g0.rangeStart, g0.rangeEnd, fastBuf.length, makeFake(fastBuf, "ignore", []));
  assert.equal(r200.ok, false);
  const r416 = await fetchSingleGopRange("fake://v2.mp4", g0.rangeStart, g0.rangeEnd, fastBuf.length, makeFake(fastBuf, "fail416", [], g0.rangeStart));
  assert.equal(r416.ok, false);
  assert.match((r416 as { reason: string }).reason, /416/);
});

// ---- 4. Controller: GOP thật + cache miss fetch bù ----
ok("controller: GOP load thành công, cache giữ GOP cửa sổ, không giữ buffer file", async () => {
  const log: FakeLog[] = [];
  const restore = installGlobalFull(fastBuf);
  try {
    const c = new ReversePreviewController("fake://v2-gop.mp4", 15, {
      knownFileSizeBytes: fastBuf.length,
      gopRangeEnabled: true,
      gopThresholdBytes: 1024,
      gopFetchImpl: makeFake(fastBuf, "range", log),
    });
    const done = await c.ensureWindowForTime(1.0);
    // Node không có VideoDecoder nên decode trả false (fail-soft) — nhưng
    // đường nối GOP phải đã chạy: track có, mode gop-range, cache có GOP.
    assert.equal(done, false);
    assert.equal(c.ready, true);
    assert.equal(c.gopMode, "gop-range");
    assert.equal(c.gopFallbackReason, null);
    const st = c.gopCacheStats;
    assert.ok(st.segments >= 1 && st.segments <= 3, `segments=${st.segments}`);
    assert.ok(st.bytes > 0);
    assert.equal(c.retainedFileBytes, st.bytes); // không giữ buffer file
    assert.equal(c.largeFileFallback, false);
    // Đợt 50 F4 — streaming: T3 lượt đầu chỉ probe + prefix, GOP của
    // cửa sổ mới fetch qua pre-resolve (fetchSingleGopRange); KHÔNG
    // còn "probe + prefix + 6 GOP" như trước. Khóa bất biến mới:
    // có HEAD, 0 GET toàn file, số 206 = probe + prefix + GOP giao
    // cửa sổ đầu (≥ 1 GOP, < 6 GOP — tức < 8), cache giữ GOP cửa sổ.
    assert.ok(log.some((l) => l.method === "HEAD"));
    assert.equal(log.filter((l) => l.method === "GET" && l.range === null).length, 0);
    const n206 = log.filter((l) => l.status === 206).length;
    assert.ok(n206 >= 3 && n206 < 8, `206 count=${n206} (kỳ vọng probe+prefix+GOP cửa sổ, < 8)`);
    c.dispose();
    assert.equal(c.gopCacheStats.segments, 0);
  } finally {
    restore();
  }
});
ok("controller: cache miss ở cửa sổ khác chỉ fetch bù GOP bằng Range, không tải lại toàn file/mọi GOP", async () => {
  const log: FakeLog[] = [];
  const restore = installGlobalFull(fastBuf);
  try {
    const c = new ReversePreviewController("fake://v2-miss.mp4", 15, {
      knownFileSizeBytes: fastBuf.length,
      gopRangeEnabled: true,
      gopThresholdBytes: 1024,
      gopFetchImpl: makeFake(fastBuf, "range", log),
    });
    await c.ensureWindowForTime(1.5); // cửa sổ cuối → cache GOP cuối
    const mark = log.length;
    const cachedBefore = c.gopCacheStats.segments;
    assert.ok(cachedBefore >= 1);
    await c.ensureWindowForTime(0.1); // cửa sổ đầu → GOP đầu chưa cache
    const added = log.slice(mark);
    assert.ok(added.length >= 1, "phải có request fetch bù");
    assert.ok(added.every((l) => l.method === "GET" && l.range !== null && l.status === 206),
      `fetch bù chỉ được là Range GET 206, thực tế: ${JSON.stringify(added)}`);
    assert.equal(c.gopMode, "gop-range");
    c.dispose();
  } finally {
    restore();
  }
});

// ---- 5. Controller: fallback full-file, không throw, không chunk nửa vời ----
async function assertControllerFallback(
  label: string,
  gopBuf: Buffer,
  fullBuf: Buffer,
  mode: FakeMode,
  reasonRe: RegExp,
): Promise<void> {
  const log: FakeLog[] = [];
  const restore = installGlobalFull(fullBuf);
  try {
    const c = new ReversePreviewController(`fake://v2-fb-${label}.mp4`, 15, {
      knownFileSizeBytes: fullBuf.length,
      gopRangeEnabled: true,
      gopThresholdBytes: 1024,
      gopFetchImpl: makeFake(gopBuf, mode, log),
    });
    const done = await c.ensureWindowForTime(1.0);
    assert.equal(done, false); // Node thiếu VideoDecoder — vẫn là fail-soft
    assert.equal(c.ready, true); // nhưng track đã có qua đường full-file
    assert.equal(c.gopMode, "full-file-fallback");
    assert.match(c.gopFallbackReason ?? "", reasonRe);
    assert.equal(c.gopCacheStats.segments, 0); // không giữ chunk nửa vời
    assert.equal(log.filter((l) => l.method === "GET" && l.range !== null && l.status === 206 && !l.range.startsWith("bytes=0-")).length, 0,
      "fallback trước GOP thì không được có request GOP");
    c.dispose();
  } finally {
    restore();
  }
}
ok("controller fallback: gate từ chối (Accept-Ranges none) → full-file, không GOP", async () => {
  await assertControllerFallback("gate", fastBuf, fastBuf, "accept-none", /accept-ranges/);
});
ok("controller fallback: moov cuối → full-file, không GOP", async () => {
  await assertControllerFallback("trailing", trailBuf, trailBuf, "range", /moov-trailing/);
});
ok("controller fallback: server 200 phớt Range → full-file, không GOP", async () => {
  await assertControllerFallback("ignore", fastBuf, fastBuf, "ignore", /probe-status-200/);
});
ok("controller: tắt GOP (mặc định) thì không thử GOP dù size trong khoảng", async () => {
  const log: FakeLog[] = [];
  const restore = installGlobalFull(fastBuf);
  try {
    const c = new ReversePreviewController("fake://v2-off.mp4", 15, {
      knownFileSizeBytes: fastBuf.length,
      // không truyền gopRangeEnabled → mặc định tắt
    });
    await c.ensureWindowForTime(1.0);
    assert.equal(c.gopMode, "off");
    assert.equal(c.gopCacheStats.segments, 0);
    assert.equal(log.length, 0); // GOP fake không được gọi lần nào
    c.dispose();
  } finally {
    restore();
  }
});

void runAll();
