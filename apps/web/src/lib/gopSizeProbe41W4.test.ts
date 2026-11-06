// gopSizeProbe41W4.test.ts — Phát hiện size cho proxy chưa biết size
// (Phase 9 đợt 41, luồng W4).
//
// Chạy bằng esbuild bundle (như V2/T3):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopSizeProbe41W4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r41w4.test.cjs \
//     && node /tmp/r41w4.test.cjs
// (chạy từ gốc repo).
//
// Phạm vi: discoverSizeBytes thuần qua fake (HEAD → Range 0-0 →
// unknown, cả hai nhánh + mọi nhánh hỏng), và controller: proxy chưa
// biết size nay kích hoạt được đường GOP khi probe thành công, và
// rơi về full-file cũ (không throw, không thử GOP) khi probe hỏng.
// Decode thật cần VideoDecoder nên test Node chỉ khẳng định đường
// nối tới bước decode như V2 — không mạo nhận đã decode.
// Fixture chỉ nằm trong os.tmpdir(), KHÔNG đưa vào repo (cấm binary).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverSizeBytes } from "./gopSizeProbe41W4.ts";
import type { GopRangeFetchFn } from "./gopRangeFetch39T3.ts";
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
  console.log(`gopSizeProbe41W4: ${pass}/${queue.length} test pass`);
}

// ---- Fixture ffmpeg thật (cùng công thức V2/T3) ----
const dir = mkdtempSync(join(tmpdir(), "vcut-w4-"));
function makeFixture(name: string): Buffer {
  const out = join(dir, name);
  execFileSync("ffmpeg", [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10",
    "-movflags", "+faststart", out,
  ], { stdio: "pipe" });
  return readFileSync(out);
}
const fastBuf = makeFixture("faststart.mp4");
console.log(`  fixture faststart: ${fastBuf.length} byte`);

// ---- Fake linh hoạt: HEAD và Range điều khiển độc lập ----
type HeadMode = "size" | "no-length" | "bad-length" | "404" | "throw";
type RangeMode = "range" | "ignore" | "416" | "no-content-range" | "throw";
interface FakeLog { method: string; range: string | null; status: number }
function makeFake(
  buf: Buffer,
  headMode: HeadMode,
  rangeMode: RangeMode,
  log: FakeLog[],
): GopRangeFetchFn {
  const headersOf = (entries: Array<[string, string]>) => {
    const m = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
    return { get: (n: string) => m.get(n.toLowerCase()) ?? null };
  };
  const empty = () => ({
    status: 200, ok: true,
    headers: headersOf([]),
    arrayBuffer: async () => new ArrayBuffer(0),
    body: { cancel: async () => {} },
  });
  return (async (url: string, init?: { method?: string; headers?: Record<string, string> }) => {
    void url;
    const method = (init?.method ?? "GET").toUpperCase();
    const rangeHeader = init?.headers?.Range ?? init?.headers?.range ?? null;
    if (method === "HEAD") {
      if (headMode === "throw") throw new Error("fake: HEAD lỗi mạng");
      if (headMode === "404") {
        log.push({ method: "HEAD", range: null, status: 404 });
        return { ...empty(), status: 404, ok: false };
      }
      log.push({ method: "HEAD", range: null, status: 200 });
      const entries: Array<[string, string]> = [["accept-ranges", "bytes"]];
      if (headMode === "size") entries.push(["content-length", String(buf.length)]);
      if (headMode === "bad-length") entries.push(["content-length", "abc"]);
      return { ...empty(), headers: headersOf(entries) };
    }
    if (rangeMode === "throw") throw new Error("fake: Range lỗi mạng");
    if (!rangeHeader) {
      log.push({ method: "GET", range: null, status: 200 });
      return {
        ...empty(),
        headers: headersOf([["content-length", String(buf.length)], ["accept-ranges", "bytes"]]),
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      };
    }
    if (rangeMode === "ignore") {
      log.push({ method: "GET", range: rangeHeader, status: 200 });
      return {
        ...empty(),
        headers: headersOf([["content-length", String(buf.length)]]),
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      };
    }
    if (rangeMode === "416") {
      log.push({ method: "GET", range: rangeHeader, status: 416 });
      return {
        ...empty(), status: 416, ok: false,
        headers: headersOf([["content-range", `bytes */${buf.length}`]]),
      };
    }
    const m = /^bytes=(\d+)-(\d+)$/.exec(rangeHeader);
    assert.ok(m, `fake: Range không parse được: ${rangeHeader}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    const slice = buf.subarray(start, end + 1);
    log.push({ method: "GET", range: rangeHeader, status: 206 });
    const entries: Array<[string, string]> = [["accept-ranges", "bytes"]];
    if (rangeMode !== "no-content-range") {
      entries.push(["content-range", `bytes ${start}-${end}/${buf.length}`]);
    }
    return {
      ...empty(), status: 206,
      headers: headersOf(entries),
      arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer,
    };
  }) as unknown as GopRangeFetchFn;
}

// ---- 1. discoverSizeBytes thuần ----
ok("probe: HEAD có length → size nguồn head, chỉ 1 request", async () => {
  const log: FakeLog[] = [];
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "size", "range", log));
  assert.equal(r.size, fastBuf.length);
  assert.equal(r.source, "head");
  assert.equal(r.reason, "");
  assert.equal(log.length, 1);
  assert.equal(log[0].method, "HEAD");
});

ok("probe: HEAD không length → Range 0-0 nguồn content-range", async () => {
  const log: FakeLog[] = [];
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "no-length", "range", log));
  assert.equal(r.size, fastBuf.length);
  assert.equal(r.source, "content-range");
  assert.equal(log.filter((l) => l.range === "bytes=0-0").length, 1);
});

ok("probe: HEAD length rác → vẫn lấy được từ Content-Range", async () => {
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "bad-length", "range", []));
  assert.equal(r.size, fastBuf.length);
  assert.equal(r.source, "content-range");
});

ok("probe: HEAD 404 nhưng Range 206 hợp lệ → vẫn có size (HEAD không chặn)", async () => {
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "404", "range", []));
  assert.equal(r.size, fastBuf.length);
  assert.equal(r.source, "content-range");
});

ok("probe: HEAD lỗi + Range 200 phớt → unknown, không throw", async () => {
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "throw", "ignore", []));
  assert.equal(r.size, null);
  assert.equal(r.source, "unknown");
  assert.match(r.reason, /size-probe-range-status-200/);
});

ok("probe: Range 416 → unknown, không throw", async () => {
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "size", "416", []));
  // HEAD có length nên thực ra đã có size ở bước 1 — kiểm tra nhánh 416
  // riêng bằng HEAD không length:
  const r2 = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "no-length", "416", []));
  assert.equal(r2.size, null);
  assert.equal(r2.source, "unknown");
  assert.match(r2.reason, /416/);
  assert.equal(r.size, fastBuf.length); // bước HEAD đã cứu trước khi tới 416
});

ok("probe: 206 thiếu Content-Range → unknown, không throw", async () => {
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "no-length", "no-content-range", []));
  assert.equal(r.size, null);
  assert.equal(r.source, "unknown");
  assert.match(r.reason, /no-content-range/);
});

ok("probe: cả hai nhánh throw → unknown, không throw ra ngoài", async () => {
  const r = await discoverSizeBytes("fake://w4.mp4", makeFake(fastBuf, "throw", "throw", []));
  assert.equal(r.size, null);
  assert.equal(r.source, "unknown");
  assert.match(r.reason, /size-probe-exception/);
});

ok("probe: url rỗng → throw TypeError (lỗi lập trình, như T3)", async () => {
  await assert.rejects(
    () => discoverSizeBytes("", makeFake(fastBuf, "size", "range", [])),
    TypeError,
  );
});

// ---- 2. Controller: chưa biết size + probe thành công → GOP bật ----
ok("controller: chưa biết size, probe HEAD ra size → gop-range (đường cũ sẽ off)", async () => {
  const log: FakeLog[] = [];
  const c = new ReversePreviewController("fake://w4-head.mp4", 15, {
    gopRangeEnabled: true,
    gopThresholdBytes: 1024,
    gopFetchImpl: makeFake(fastBuf, "size", "range", log),
  });
  assert.equal(c.gopSizeProbe, null); // chưa probe trước cửa sổ đầu
  const done = await c.ensureWindowForTime(1.0);
  assert.equal(done, false); // Node thiếu VideoDecoder — như V2
  assert.equal(c.ready, true);
  assert.equal(c.gopMode, "gop-range");
  assert.deepEqual(c.gopSizeProbe, { source: "head", size: fastBuf.length });
  assert.equal(c.gopSizeProbeReason, null);
  // Đợt 42 X4 — probe HEAD (1) được T3 dùng lại nên KHÔNG còn T3 HEAD
  // thứ hai (trước X4 là 2); không GET toàn file. Đợt 50 F4 —
  // streaming: 206 chỉ còn probe T3 + tiền tố + GOP giao cửa sổ đầu
  // (không còn + 6 GOP lượt đầu như trước, tức < 8).
  assert.equal(log.filter((l) => l.method === "HEAD").length, 1);
  const n206a = log.filter((l) => l.status === 206).length;
  assert.ok(n206a >= 3 && n206a < 8, `206 count=${n206a} (kỳ vọng probe+prefix+GOP cửa sổ, < 8)`);
  assert.equal(log.filter((l) => l.method === "GET" && l.range === null).length, 0);
  c.dispose();
  assert.equal(c.gopSizeProbe, null); // dispose dọn trạng thái probe
});

ok("controller: HEAD không length, probe Range ra size → gop-range nguồn content-range", async () => {
  const log: FakeLog[] = [];
  const c = new ReversePreviewController("fake://w4-range.mp4", 15, {
    gopRangeEnabled: true,
    gopThresholdBytes: 1024,
    gopFetchImpl: makeFake(fastBuf, "no-length", "range", log),
  });
  await c.ensureWindowForTime(1.0);
  assert.equal(c.ready, true);
  assert.equal(c.gopMode, "gop-range");
  assert.deepEqual(c.gopSizeProbe, { source: "content-range", size: fastBuf.length });
  // Đợt 50 F4 — streaming: 206 = probe Range 0-0 + T3 probe + tiền tố
  // + GOP giao cửa sổ đầu (không còn + 6 GOP lượt đầu, tức < 9).
  const n206b = log.filter((l) => l.status === 206).length;
  assert.ok(n206b >= 4 && n206b < 9, `206 count=${n206b} (kỳ vọng probe-Range+T3 probe+prefix+GOP cửa sổ, < 9)`);
  c.dispose();
});

// ---- 3. Controller: probe hỏng / size ngoài ngưỡng → fallback, không mở GOP ----
ok("controller: probe hỏng → gopMode off, lý do probe, không thử GOP, không throw", async () => {
  const log: FakeLog[] = [];
  // URL loopback cổng đóng: load() cũ dùng global fetch sẽ bị từ chối
  // nhanh; fake chỉ phục vụ probe (HEAD throw + Range 200).
  const c = new ReversePreviewController("http://127.0.0.1:9/w4-fail.mp4", 15, {
    gopRangeEnabled: true,
    gopThresholdBytes: 1024,
    gopFetchImpl: makeFake(fastBuf, "throw", "ignore", log),
  });
  const done = await c.ensureWindowForTime(1.0);
  assert.equal(done, false);
  assert.equal(c.gopMode, "off");
  assert.equal(c.gopFallbackReason, null); // chưa từng thử GOP
  assert.ok(c.gopSizeProbe !== null && c.gopSizeProbe.source === "unknown");
  assert.match(c.gopSizeProbeReason ?? "", /size-probe/);
  // Probe chỉ gọi HEAD-thử + Range 0-0, không gọi T3 (không có GOP nào).
  assert.ok(log.length >= 1);
  c.dispose();
});

ok("controller: probe ra size dưới ngưỡng → wiring off, probe vẫn được ghi", async () => {
  const c = new ReversePreviewController("fake://w4-small.mp4", 15, {
    gopRangeEnabled: true,
    gopThresholdBytes: fastBuf.length + 1000,
    gopFetchImpl: makeFake(fastBuf, "size", "range", []),
  });
  await c.ensureWindowForTime(1.0);
  assert.equal(c.gopMode, "off");
  assert.deepEqual(c.gopSizeProbe, { source: "head", size: fastBuf.length });
  assert.equal(c.gopFallbackReason, null);
  c.dispose();
});

ok("controller: probe ra size vượt trần S4 → khóa fallback như size truyền trước, KHÔNG mở >128MiB", async () => {
  const c = new ReversePreviewController("fake://w4-large.mp4", 15, {
    gopRangeEnabled: true,
    gopThresholdBytes: 1024,
    largeFileBytes: 10000,
    gopFetchImpl: makeFake(fastBuf, "size", "range", []),
  });
  await c.ensureWindowForTime(1.0);
  assert.equal(c.gopMode, "off");
  assert.equal(c.failed, true);
  assert.deepEqual(c.gopSizeProbe, { source: "head", size: fastBuf.length });
  c.dispose();
});

ok("controller: GOP tắt thì không probe (không thêm request cho đường cũ)", async () => {
  const log: FakeLog[] = [];
  const c = new ReversePreviewController("fake://w4-disabled.mp4", 15, {
    gopFetchImpl: makeFake(fastBuf, "size", "range", log),
  });
  await c.ensureWindowForTime(1.0);
  assert.equal(c.gopSizeProbe, null);
  assert.equal(log.length, 0); // fake GOP không được gọi lần nào
  c.dispose();
});

void runAll();
