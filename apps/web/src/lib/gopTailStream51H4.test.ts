// gopTailStream51H4.test.ts — Phase 9 đợt 51, luồng H4: tail-scan
// streaming (đóng nợ F4 §5.3 — đuôi tail-scan 16,7 MiB nằm trong đỉnh
// transient T3).
//
// Thiết kế H4: `fetchTrailingMoovChunked` fetch đuôi theo chunk từ EOF
// lùi về, gấp đôi mỗi lần (mặc định 2 → 4 → 8 → 16 MiB), dừng khi tìm
// thấy moov + xác nhận bằng 1 chunk nữa; chunk nào lỗi thì throw ngay
// như đường cũ. Test này khóa bằng code thật (ffmpeg + server HTTP
// Range thật, mẫu F4):
//   - trailing 720p 20 s (10.840.711 byte, moov 7.447 byte ở đúng EOF):
//     tail chỉ còn 2 request × 2 MiB = 4 MiB (đường cũ: 1 request
//     10.840.711 byte = cả cửa sổ đuôi), gopMeta khớp mode all;
//   - chunk đầu nhỏ (4 KiB) → cửa sổ tăng dần 4 → 8 KiB rồi tìm thấy,
//     xác nhận ở 16 KiB, tổng tail chỉ 16 KiB;
//   - cửa sổ đuôi nhỏ hơn moov (512 byte) → full-file, đúng 1 request
//     tail, lý do tail-scan-no-candidate;
//   - tail chunk đầu 416 → full-file ngay (1 request tail), lý do giữ
//     dạng `tail-scan: tail-status-416...` như đường cũ;
//   - faststart: 0 request tail (không chạm nhánh này).
//   - cache LRU ở trần thấp (8 MiB, ứng viên trần mới — xem LIMITS H4):
//     put 3 GOP ~5 MiB → byte giữ ≤ 8 MiB, GOP cũ nhất bị evict.
//
// Chạy bằng esbuild bundle (mẫu F4/T3, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTailStream51H4.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/h4.test.mjs \
//     && node <scratch>/h4.test.mjs
//
// Fixture ffmpeg thật, chỉ nằm trong os.tmpdir(), KHÔNG đưa vào repo.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchVideoTrackByGopRange,
  type GopRangeFetchFn,
} from "./gopRangeFetch39T3.ts";
import {
  GopSegmentCache,
  GOP_CACHE_MAX_BYTES,
} from "./gopCache40V2.ts";
import type { GopSegment } from "./gopRangeFetch39T3.ts";
import { detectMoovPosition } from "./reverseRangeGate38U2.ts";

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
  console.log(`gopTailStream51H4: ${pass}/${queue.length} test pass`);
}

// ---- Fixture: ffmpeg thật ----
const dir = mkdtempSync(join(tmpdir(), "vcut-h4-"));
function makeFixture(
  name: string,
  faststart: boolean,
  sizeArg: string,
  duration: number,
  gop: number,
): Buffer {
  const out = join(dir, name);
  const args = [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", `testsrc2=size=${sizeArg}:rate=30:duration=${duration}`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", String(gop), "-crf", "18",
    "-preset", "veryfast",
  ];
  if (faststart) args.push("-movflags", "+faststart");
  args.push(out);
  try {
    execFileSync("ffmpeg", args, { stdio: "pipe" });
  } catch (e) {
    throw new Error(
      `ffmpeg tạo fixture ${name} thất bại (cần ffmpeg có libx264): ${(e as Error).message}`,
    );
  }
  return readFileSync(out);
}
// Trailing 720p 20 s: mdat đủ lớn để moov nằm ngoài tiền tố 512 KiB và
// file > 2 MiB để chunking thật sự chạy (khác trailing-big 1,5 MiB của
// F4 — file đó nhỏ hơn chunk đầu nên chỉ fetch 1 lần, không đo được
// streaming). Đo thật lúc viết test: 10.840.711 byte, moov 7.447 byte
// ở đúng EOF (bắt đầu 7.447 byte trước EOF).
const trailBuf = makeFixture("trailing720-20s.mp4", false, "1280x720", 20, 30);
const fastBuf = makeFixture("faststart.mp4", true, "320x240", 2, 10);
console.log(
  `  fixture trailing720-20s: ${trailBuf.length} byte, faststart: ${fastBuf.length} byte ` +
    `(ffmpeg testsrc2, -g 30, crf 18, KHÔNG faststart cho trailing)`,
);

// ---- Server HTTP Range thật (công thức F4) ----
interface ServerOpts {
  ignoreRange?: boolean;
  failRangeFrom?: number;
}
interface ReqLog {
  method: string;
  range: string | null;
  status: number;
}
async function serve(
  buf: Buffer,
  opts: ServerOpts = {},
): Promise<{ url: string; log: ReqLog[]; close: () => Promise<void> }> {
  const log: ReqLog[] = [];
  const server: Server = createServer((req, res) => {
    const range = req.headers.range ?? null;
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end();
      log.push({ method: "HEAD", range, status: 200 });
      return;
    }
    if (opts.ignoreRange || range === null) {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end(buf);
      log.push({ method: "GET", range, status: 200 });
      return;
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m) {
      res.writeHead(400);
      res.end();
      log.push({ method: "GET", range, status: 400 });
      return;
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? buf.length - 1 : Math.min(Number(m[2]), buf.length - 1);
    if (opts.failRangeFrom !== undefined && start >= opts.failRangeFrom) {
      res.setHeader("Content-Range", `bytes */${buf.length}`);
      res.writeHead(416);
      res.end();
      log.push({ method: "GET", range, status: 416 });
      return;
    }
    if (start >= buf.length || start > end) {
      res.setHeader("Content-Range", `bytes */${buf.length}`);
      res.writeHead(416);
      res.end();
      log.push({ method: "GET", range, status: 416 });
      return;
    }
    res.setHeader("Content-Range", `bytes ${start}-${end}/${buf.length}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206);
    res.end(buf.subarray(start, end + 1));
    log.push({ method: "GET", range, status: 206 });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
  return {
    url: `http://127.0.0.1:${addr.port}/file.mp4`,
    log,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** Parse "bytes=A-B" trong log server → [A, B]. */
function parseRange(s: string | null): [number, number] | null {
  if (s === null) return null;
  const m = /^bytes=(\d+)-(\d+)$/.exec(s);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

ok("stream: trailing 720p 20 s → gop-range, tail chỉ 2×2 MiB thay vì cả cửa sổ 10,8 MiB", async () => {
  assert.equal(
    detectMoovPosition(new Uint8Array(trailBuf.subarray(0, 512 * 1024))),
    "unknown",
  );
  const srv = await serve(trailBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.sampleCount, 600);
    assert.equal(out.gopMeta.length, 20);
    assert.equal(out.gops.length, 0);
    const tails = out.requests.filter((r) => r.kind === "tail");
    // Tìm thấy moov ở chunk 2 MiB đầu + xác nhận ở 4 MiB: đúng 2
    // request tail, mỗi cái 2 MiB, đều là hậu tố kết thúc ở EOF.
    assert.equal(tails.length, 2, `tail requests: ${JSON.stringify(tails)}`);
    assert.deepEqual(tails.map((r) => r.bytes), [2 * 1024 * 1024, 2 * 1024 * 1024]);
    // Chunk 1: [size-2MiB, size-1]; chunk xác nhận: [size-4MiB,
    // size-2MiB-1] — nối lại thành đúng hậu tố 4 MiB cuối file.
    assert.deepEqual(
      tails.map((r) => [r.start, r.end]),
      [
        [trailBuf.length - 2 * 1024 * 1024, trailBuf.length - 1],
        [trailBuf.length - 4 * 1024 * 1024, trailBuf.length - 2 * 1024 * 1024 - 1],
      ],
    );
    // Tổng byte đuôi chuyển qua mạng = 4 MiB, nhỏ hơn hẳn cửa sổ đuôi
    // cũ (min(16 MiB, fileSize) = fileSize = 10.840.711 byte).
    const tailBytes = tails.reduce((a, r) => a + r.bytes, 0);
    assert.equal(tailBytes, 4 * 1024 * 1024);
    assert.ok(tailBytes < trailBuf.length);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    console.log(
      `    đo: file=${trailBuf.length} byte, tail requests=${tails.map((r) => `${r.start}-${r.end}:${r.bytes}`).join(",")} (cũ: 1 request ${trailBuf.length} byte)`,
    );
  } finally {
    await srv.close();
  }
});

ok("stream: gopMeta mode stream khớp mode all trên cùng file trailing lớn", async () => {
  const srv = await serve(trailBuf);
  try {
    const outStream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    const outAll = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(outStream.mode, "gop-range");
    assert.equal(outAll.mode, "gop-range");
    if (outStream.mode !== "gop-range" || outAll.mode !== "gop-range") return;
    assert.deepEqual(outStream.gopMeta, outAll.gopMeta);
    assert.equal(outStream.sampleCount, outAll.sampleCount);
    assert.equal(outAll.gops.length, 20);
  } finally {
    await srv.close();
  }
});

ok("stream: chunk đầu 4 KiB → cửa sổ tăng dần rồi tìm thấy, tổng tail chỉ 16 KiB", async () => {
  // moov bắt đầu 7.447 byte trước EOF nên chunk 4 KiB không chứa
  // header moov → tăng 8 KiB (chứa moov) → xác nhận ở 16 KiB.
  const srv = await serve(trailBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      tailInitialChunkBytes: 4 * 1024,
    });
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.gopMeta.length, 20);
    const tails = out.requests.filter((r) => r.kind === "tail");
    assert.deepEqual(tails.map((r) => r.bytes), [4 * 1024, 4 * 1024, 8 * 1024]);
    const tailBytes = tails.reduce((a, r) => a + r.bytes, 0);
    assert.equal(tailBytes, 16 * 1024);
    // Chunk đầu là hậu tố kết thúc ở EOF; các chunk sau là phần mở
    // rộng ở phía trước — nối lại thành đúng hậu tố 16 KiB cuối file.
    assert.equal(tails[0].end, trailBuf.length - 1);
    assert.equal(tails[tails.length - 1].start, trailBuf.length - 16 * 1024);
    console.log(
      `    đo: chunk 4 KiB → tail requests=${tails.map((r) => `${r.start}-${r.end}:${r.bytes}`).join(",")}`,
    );
  } finally {
    await srv.close();
  }
});

ok("stream: cửa sổ đuôi 512 byte < moov → full-file, đúng 1 request tail, lý do tail-scan-no-candidate", async () => {
  const srv = await serve(trailBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      tailScanBytes: 512,
    });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /tail-scan-no-candidate/);
    const tails = out.requests.filter((r) => r.kind === "tail");
    assert.equal(tails.length, 1);
    assert.equal(tails[0].bytes, 512);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
  } finally {
    await srv.close();
  }
});

ok("stream: tail chunk đầu 416 → full-file ngay, 1 request tail, lý do giữ dạng tail-scan", async () => {
  // Chỉ chunk đuôi 416 (failRangeFrom = đúng start của chunk đuôi
  // đầu: fileSize - 2 MiB); probe + tiền tố (start 0) vẫn 206.
  const srv = await serve(trailBuf, { failRangeFrom: trailBuf.length - 2 * 1024 * 1024 });
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /moov-unknown/);
    assert.match(out.reason, /tail-scan: tail-status-416/);
    const tails = out.requests.filter((r) => r.kind === "tail");
    assert.equal(tails.length, 1, "chunk lỗi thì không thử cửa sổ lớn hơn");
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
  } finally {
    await srv.close();
  }
});

ok("stream: faststart → 0 request tail (không chạm nhánh tail-scan)", async () => {
  const srv = await serve(fastBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.requests.filter((r) => r.kind === "tail").length, 0);
    assert.equal(out.gops.length, 0);
  } finally {
    await srv.close();
  }
});

// ---- Cache LRU ở trần thấp (mẫu fakeSeg của V2) ----
function fakeSeg(index: number, start: number, end: number): GopSegment {
  return {
    index, firstSampleIndex: index, lastSampleIndex: index, sampleCount: 1,
    rangeStart: start, rangeEnd: end, rangeBytes: end - start, sampleBytes: end - start,
    chunks: [],
  };
}

ok("cache: trần 8 MiB evict cũ nhất, byte giữ không bao giờ vượt trần", () => {
  const MiB = 1024 * 1024;
  const c = new GopSegmentCache(8 * MiB, 32);
  assert.equal(c.put(fakeSeg(0, 0, 5 * MiB)), true);
  assert.equal(c.put(fakeSeg(1, 5 * MiB, 10 * MiB)), true); // 5+5 > 8 → evict 0
  assert.equal(c.has(0), false);
  assert.equal(c.has(1), true);
  assert.equal(c.bytes, 5 * MiB);
  assert.equal(c.put(fakeSeg(2, 10 * MiB, 15 * MiB)), true); // lại evict 1
  assert.equal(c.has(1), false);
  assert.equal(c.bytes, 5 * MiB);
  assert.ok(c.evicted >= 10 * MiB);
  assert.equal(c.put(fakeSeg(9, 0, 9 * MiB)), false); // GOP đơn vượt trần → từ chối, không xóa cache
  assert.equal(c.has(2), true);
  assert.equal(c.bytes, 5 * MiB);
});

ok("cache: trần mặc định GOP_CACHE_MAX_BYTES là hằng đã quyết (xem LIMITS H4 §2)", () => {
  // Khóa trần mặc định để lần đổi sau là quyết định có chủ ý, không
  // phải sửa lén: 16 MiB được chốt sau 6 lượt đo headed đợt 51 (cache
  // thật tối đa 8,24 MiB, evicted = 0 ở mọi trần, settled không đổi
  // theo trần). Trần kích hoạt đường GOP (32 MiB) không đổi.
  assert.equal(GOP_CACHE_MAX_BYTES, 16 * 1024 * 1024);
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
