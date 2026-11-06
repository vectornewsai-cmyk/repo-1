// gopSharedProbe42X4.test.ts — Chia sẻ kết quả probe size vào T3
// (Phase 9 đợt 42, luồng X4; đóng nợ đợt 41 §5.5 "2 HEAD trùng nhau").
//
// Chạy bằng esbuild bundle (như V2/W4):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopSharedProbe42X4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r42x4.test.cjs \
//     && node /tmp/r42x4.test.cjs
// (chạy từ gốc repo).
//
// Phạm vi: (a) probe trả thêm `acceptRanges` từ response đã cho size;
// (b) T3 bỏ HEAD của nó khi `sharedSizeProbe` khớp size (0 HEAD trong
// outcome.requests), vẫn gop-range + chunk byte-khớp; (c) T3 KHÔNG bỏ
// HEAD khi probe lệch size / size không hợp lệ / vắng (hành vi cũ);
// (d) controller: probe → T3 chỉ còn đúng 1 HEAD tổng cộng (của probe).
// Decode thật cần VideoDecoder nên test controller Node chỉ khẳng định
// đường nối tới bước decode như V2/W4 — không mạo nhận đã decode.
// Fixture chỉ nằm trong os.tmpdir(), KHÔNG đưa vào repo (cấm binary).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverSizeBytes } from "./gopSizeProbe41W4.ts";
import {
  fetchVideoTrackByGopRange,
  type GopRangeFetchFn,
} from "./gopRangeFetch39T3.ts";
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
  console.log(`gopSharedProbe42X4: ${pass}/${queue.length} test pass`);
}

// ---- Fixture ffmpeg thật (cùng công thức T3/W4) ----
const dir = mkdtempSync(join(tmpdir(), "vcut-x4-"));
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

// ---- Fake HTTP: HEAD + Range thật trên buffer, ghi log mọi request ----
interface FakeLog { method: string; range: string | null; status: number }
function makeFake(
  buf: Buffer,
  opts: { headLength?: boolean; headAcceptRanges?: string | null; rangeAcceptRanges?: string | null } = {},
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
      log.push({ method: "HEAD", range: null, status: 200 });
      const entries: Array<[string, string]> = [];
      if (opts.headAcceptRanges !== null && opts.headAcceptRanges !== undefined) {
        entries.push(["accept-ranges", opts.headAcceptRanges]);
      } else if (opts.headAcceptRanges === undefined) {
        entries.push(["accept-ranges", "bytes"]);
      }
      if (opts.headLength !== false) entries.push(["content-length", String(buf.length)]);
      return { ...empty(), headers: headersOf(entries) };
    }
    if (!rangeHeader) {
      log.push({ method: "GET", range: null, status: 200 });
      return {
        ...empty(),
        headers: headersOf([["content-length", String(buf.length)], ["accept-ranges", "bytes"]]),
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      };
    }
    const m = /^bytes=(\d+)-(\d+)$/.exec(rangeHeader);
    assert.ok(m, `fake: Range không parse được: ${rangeHeader}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    const slice = buf.subarray(start, end + 1);
    log.push({ method: "GET", range: rangeHeader, status: 206 });
    const entries: Array<[string, string]> = [];
    if (opts.rangeAcceptRanges !== null && opts.rangeAcceptRanges !== undefined) {
      entries.push(["accept-ranges", opts.rangeAcceptRanges]);
    } else if (opts.rangeAcceptRanges === undefined) {
      entries.push(["accept-ranges", "bytes"]);
    }
    entries.push(["content-range", `bytes ${start}-${end}/${buf.length}`]);
    return {
      ...empty(), status: 206,
      headers: headersOf(entries),
      arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer,
    };
  }) as unknown as GopRangeFetchFn;
}

function assertChunksByteEqual(out: Awaited<ReturnType<typeof fetchVideoTrackByGopRange>>): void {
  assert.equal(out.mode, "gop-range");
  if (out.mode !== "gop-range") return;
  const full = parseMp4VideoTrack(
    fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
  );
  let checked = 0;
  for (const gop of out.gops) {
    for (let k = 0; k < gop.chunks.length; k++) {
      const s = full.samples[gop.firstSampleIndex + k];
      const expect = new Uint8Array(fastBuf.subarray(s.offset, s.offset + s.size));
      const got = gop.chunks[k].data;
      assert.equal(got.length, expect.length, `sample ${gop.firstSampleIndex + k} dài khác`);
      assert.ok(got.every((v, i) => v === expect[i]), `sample ${gop.firstSampleIndex + k} byte khác`);
      checked++;
    }
  }
  assert.equal(checked, full.samples.length);
}

// ---- 1. Probe trả acceptRanges ----
ok("probe: HEAD có length → acceptRanges = bytes (cùng response cho size)", async () => {
  const r = await discoverSizeBytes("fake://x4.mp4", makeFake(fastBuf, {}, []));
  assert.equal(r.size, fastBuf.length);
  assert.equal(r.source, "head");
  assert.equal(r.acceptRanges, "bytes");
});

ok("probe: HEAD không length → Range 0-0 cho acceptRanges từ response Range", async () => {
  const r = await discoverSizeBytes(
    "fake://x4.mp4",
    makeFake(fastBuf, { headLength: false, headAcceptRanges: null }, []),
  );
  assert.equal(r.size, fastBuf.length);
  assert.equal(r.source, "content-range");
  assert.equal(r.acceptRanges, "bytes");
});

ok("probe: HEAD không báo accept-ranges → acceptRanges null, không bịa", async () => {
  const r = await discoverSizeBytes(
    "fake://x4.mp4",
    makeFake(fastBuf, { headAcceptRanges: null }, []),
  );
  assert.equal(r.size, fastBuf.length);
  assert.equal(r.source, "head");
  assert.equal(r.acceptRanges, null);
});

// ---- 2. T3 dùng lại probe: bỏ HEAD ----
ok("T3: sharedSizeProbe khớp size + acceptRanges bytes → 0 HEAD, gop-range, chunk byte-khớp", async () => {
  const log: FakeLog[] = [];
  const out = await fetchVideoTrackByGopRange("fake://x4.mp4", {
    knownSizeBytes: fastBuf.length,
    fetchImpl: makeFake(fastBuf, {}, log),
    sharedSizeProbe: { size: fastBuf.length, acceptRanges: "bytes" },
  });
  assertChunksByteEqual(out);
  assert.equal(out.requests.filter((r) => r.kind === "head").length, 0);
  assert.equal(log.filter((l) => l.method === "HEAD").length, 0);
  assert.ok(out.requests.filter((r) => r.kind === "gop").length === 6);
});

ok("T3: sharedSizeProbe acceptRanges null → vẫn 0 HEAD, gate lấy accept-ranges từ tiền tố", async () => {
  const log: FakeLog[] = [];
  const out = await fetchVideoTrackByGopRange("fake://x4.mp4", {
    knownSizeBytes: fastBuf.length,
    fetchImpl: makeFake(fastBuf, {}, log),
    sharedSizeProbe: { size: fastBuf.length, acceptRanges: null },
  });
  assertChunksByteEqual(out);
  assert.equal(log.filter((l) => l.method === "HEAD").length, 0);
});

// ---- 3. T3 KHÔNG bỏ HEAD khi probe không đáng tin ----
ok("T3: sharedSizeProbe lệch knownSizeBytes → HEAD lại như cũ, vẫn gop-range", async () => {
  const log: FakeLog[] = [];
  const out = await fetchVideoTrackByGopRange("fake://x4.mp4", {
    knownSizeBytes: fastBuf.length,
    fetchImpl: makeFake(fastBuf, {}, log),
    sharedSizeProbe: { size: fastBuf.length + 100, acceptRanges: "bytes" },
  });
  assertChunksByteEqual(out);
  assert.equal(log.filter((l) => l.method === "HEAD").length, 1);
  assert.equal(out.requests.filter((r) => r.kind === "head").length, 1);
});

ok("T3: sharedSizeProbe size 0 (không hợp lệ) → HEAD lại như cũ", async () => {
  const log: FakeLog[] = [];
  const out = await fetchVideoTrackByGopRange("fake://x4.mp4", {
    knownSizeBytes: fastBuf.length,
    fetchImpl: makeFake(fastBuf, {}, log),
    sharedSizeProbe: { size: 0, acceptRanges: "bytes" },
  });
  assertChunksByteEqual(out);
  assert.equal(log.filter((l) => l.method === "HEAD").length, 1);
});

ok("T3: không truyền sharedSizeProbe → HEAD như cũ (hồi quy API cũ)", async () => {
  const log: FakeLog[] = [];
  const out = await fetchVideoTrackByGopRange("fake://x4.mp4", {
    knownSizeBytes: fastBuf.length,
    fetchImpl: makeFake(fastBuf, {}, log),
  });
  assertChunksByteEqual(out);
  assert.equal(log.filter((l) => l.method === "HEAD").length, 1);
});

// ---- 4. Controller: probe → T3 chỉ còn 1 HEAD ----
ok("controller: chưa biết size, probe → T3 dùng lại → tổng cộng đúng 1 HEAD (của probe)", async () => {
  const log: FakeLog[] = [];
  const c = new ReversePreviewController("fake://x4-ctl.mp4", 15, {
    gopRangeEnabled: true,
    gopThresholdBytes: 1024,
    gopFetchImpl: makeFake(fastBuf, {}, log),
  });
  await c.ensureWindowForTime(1.0);
  assert.equal(c.ready, true);
  assert.equal(c.gopMode, "gop-range");
  assert.deepEqual(c.gopSizeProbe, { source: "head", size: fastBuf.length });
  assert.equal(log.filter((l) => l.method === "HEAD").length, 1);
  // Đợt 50 F4 — streaming: 206 chỉ còn probe T3 (0-1023) + tiền tố +
  // GOP giao cửa sổ đầu (không còn + 6 GOP lượt đầu, tức < 8; probe
  // size dùng HEAD nên không có Range 0-0).
  const n206x = log.filter((l) => l.status === 206).length;
  assert.ok(n206x >= 3 && n206x < 8, `206 count=${n206x} (kỳ vọng probe+prefix+GOP cửa sổ, < 8)`);
  assert.equal(log.filter((l) => l.method === "GET" && l.range === null).length, 0);
  c.dispose();
});

ok("controller: đã biết size từ đầu (không probe) → T3 vẫn HEAD 1 lần như cũ, không bỏ lén", async () => {
  const log: FakeLog[] = [];
  const c = new ReversePreviewController("fake://x4-known.mp4", 15, {
    gopRangeEnabled: true,
    gopThresholdBytes: 1024,
    knownFileSizeBytes: fastBuf.length,
    gopFetchImpl: makeFake(fastBuf, {}, log),
  });
  await c.ensureWindowForTime(1.0);
  assert.equal(c.gopMode, "gop-range");
  assert.equal(c.gopSizeProbe, null); // không probe vì đã biết size
  assert.equal(log.filter((l) => l.method === "HEAD").length, 1);
  c.dispose();
});

void runAll();
