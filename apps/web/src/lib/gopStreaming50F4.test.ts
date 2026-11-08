// gopStreaming50F4.test.ts — Phase 9 đợt 50, luồng F4: T3 streaming
// (đóng nợ E2 §7.1 — đỉnh heap transient GOP +81,5 MiB > tải toàn file
// +37,7 MiB, do T3 fetch chunk MỌI GOP lượt đầu).
//
// Thiết kế F4: `streamGops: true` → T3 chỉ demux + trả meta mọi GOP,
// KHÔNG fetch byte GOP nào lượt đầu; controller fetch đúng GOP giao
// cửa sổ decode khi cần (fetchSingleGopRange + cache LRU hiện có).
// Test này khóa bằng code thật (ffmpeg + server HTTP Range thật):
//   - stream: 0 request GOP lượt đầu, gops [], gopMeta đủ mọi GOP,
//     totals 0; meta hai mode (stream/all) bằng nhau;
//   - chỉ GOP của cửa sổ được fetch (fetchSingleGopRange +
//     buildGopSegment), byte chunk khớp file gốc, GOP ngoài cửa sổ
//     chưa hề được chạm tới (đối chiếu log Range của server);
//   - fallback khi Range bị phớt lờ vẫn đúng ở mode stream;
//   - fetch bù GOP hỏng (416) trả { ok: false }, không chunk nửa vời;
//   - trailing lớn qua tail-scan cũng stream được (moov ngoài tiền tố).
//
// Chạy bằng esbuild bundle (mẫu T3, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopStreaming50F4.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/f4.test.mjs \
//     && node <scratch>/f4.test.mjs
//
// Fixture ffmpeg thật (công thức T3/E2), chỉ nằm trong os.tmpdir(),
// KHÔNG đưa vào repo (cấm binary).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchVideoTrackByGopRange,
  gopRangesFor,
  MAX_FIRST_SAMPLE_PROBE_BYTES,
  type GopRangeFetchFn,
} from "./gopRangeFetch39T3.ts";
import {
  buildGopSegment,
  fetchSingleGopRange,
} from "./gopCache40V2.ts";
import { detectMoovPosition } from "./reverseRangeGate38U2.ts";
import { parseMp4VideoTrack } from "./mp4Demux.ts";

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
  console.log(`gopStreaming50F4: ${pass}/${queue.length} test pass`);
}

// ---- Fixture: ffmpeg thật ----
const dir = mkdtempSync(join(tmpdir(), "vcut-f4-"));
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
const fastBuf = makeFixture("faststart.mp4", true, "320x240", 2, 10);
// Trailing LỚN (công thức E2): 640x360 10 s, mdat đủ lớn để moov nằm
// ngoài tiền tố 512 KiB → T3 phải đi tail-scan, không phải nhánh
// moov-trailing của file nhỏ.
const trailBigBuf = makeFixture("trailing-big.mp4", false, "640x360", 10, 30);
console.log(
  `  fixture faststart: ${fastBuf.length} byte, trailing-big: ${trailBigBuf.length} byte ` +
    `(ffmpeg testsrc2, -g 30, crf 18, KHÔNG faststart)`,
);

// ---- Server HTTP Range thật (công thức T3) ----
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
function parseLoggedRange(range: string | null): [number, number] | null {
  if (!range) return null;
  const m = /^bytes=(\d+)-(\d+)$/.exec(range);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

const nodeFetch = globalThis.fetch as unknown as GopRangeFetchFn;

ok("stream: faststart → gop-range, 0 request GOP lượt đầu, gopMeta đủ 6 GOP, totals 0", async () => {
  const srv = await serve(fastBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.gops.length, 0, "stream không fetch GOP nào lượt đầu");
    assert.equal(out.sampleCount, 60);
    assert.equal(out.totalGopRangeBytes, 0);
    assert.equal(out.totalSampleBytes, 0);
    assert.equal(out.gopMeta.length, 6);
    assert.deepEqual(
      out.gopMeta.map((g) => g.firstSampleIndex),
      [0, 10, 20, 30, 40, 50],
    );
    // Meta khớp đúng bảng GOP tính từ sample table thật.
    const track = parseMp4VideoTrack(
      fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
    );
    const defs = gopRangesFor(track.samples);
    assert.equal(defs.length, 6);
    for (let i = 0; i < 6; i++) {
      assert.equal(out.gopMeta[i].index, i);
      assert.equal(out.gopMeta[i].firstSampleIndex, defs[i].firstSampleIndex);
      assert.equal(out.gopMeta[i].lastSampleIndex, defs[i].lastSampleIndex);
      assert.equal(out.gopMeta[i].rangeStart, defs[i].rangeStart);
      assert.equal(out.gopMeta[i].rangeEnd, defs[i].rangeEnd);
    }
    // Log T3 + log server: không có request GOP nào, không GET toàn file.
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    assert.ok(srv.log.filter((l) => l.method === "GET").every((l) => l.status === 206));
    console.log(
      `    đo: stream requests=${out.requests.map((r) => `${r.kind}:${r.status}:${r.bytes}`).join(",")}`,
    );
  } finally {
    await srv.close();
  }
});

ok("stream: chỉ GOP của cửa sổ được fetch — byte chunk khớp file gốc, GOP ngoài cửa sổ chưa chạm", async () => {
  const srv = await serve(fastBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    // Cửa sổ giả lập: sample 20–29 = đúng GOP 2 (keyframe 20).
    const meta2 = out.gopMeta[2];
    assert.equal(meta2.firstSampleIndex, 20);
    assert.equal(meta2.lastSampleIndex, 29);
    const res = await fetchSingleGopRange(
      srv.url,
      meta2.rangeStart,
      meta2.rangeEnd,
      fastBuf.length,
      nodeFetch,
    );
    assert.equal(res.ok, true);
    if (!res.ok) return;
    const seg = buildGopSegment(out.track, meta2, res.bytes);
    assert.equal(seg.chunks.length, 10);
    const full = parseMp4VideoTrack(
      fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
    );
    for (let k = 0; k < seg.chunks.length; k++) {
      const si = meta2.firstSampleIndex + k;
      const s = full.samples[si];
      const expect = new Uint8Array(fastBuf.subarray(s.offset, s.offset + s.size));
      assert.ok(seg.chunks[k].data.every((v, i) => v === expect[i]), `sample ${si} byte khác`);
      assert.equal(seg.chunks[k].type, s.isKey ? "key" : "delta");
    }
    // Đối chiếu log server: mọi GET Range chỉ là probe / tiền tố /
    // đúng range GOP 2 — không GET nào chạm range của GOP khác.
    // Đợt 53 J6 — cho phép thêm đúng 1 GET "sample": T3 stream-mode
    // fetch riêng sample đầu để kiểm AVCC (chặn moov giả trỏ vào trong
    // file); đó KHÔNG phải GOP ngoài cửa sổ — range của nó là sample 0
    // (kẹp bởi MAX_FIRST_SAMPLE_PROBE_BYTES), và test vẫn khóa "không
    // GET nào chạm range GOP khác" như cũ.
    const s0 = out.track.samples[0];
    const gets = srv.log.filter((l) => l.method === "GET" && l.status === 206);
    const allowed: Array<[number, number]> = [
      [0, 1023],
      [0, fastBuf.length - 1],
      [meta2.rangeStart, meta2.rangeEnd - 1],
      [s0.offset, s0.offset + Math.min(s0.size, MAX_FIRST_SAMPLE_PROBE_BYTES) - 1],
    ];
    for (const g of gets) {
      const r = parseLoggedRange(g.range);
      assert.ok(r !== null, `log Range không parse được: ${g.range}`);
      assert.ok(
        allowed.some(([a, b]) => r[0] === a && r[1] === b),
        `GET Range ${g.range} không thuộc probe/prefix/sample-0/GOP-2 — GOP ngoài cửa sổ đã bị fetch`,
      );
    }
    // Đúng 1 GET chạm GOP 2 (không fetch trùng).
    assert.equal(
      gets.filter((g) => {
        const r = parseLoggedRange(g.range);
        return r !== null && r[0] === meta2.rangeStart && r[1] === meta2.rangeEnd - 1;
      }).length,
      1,
    );
  } finally {
    await srv.close();
  }
});

ok("stream: server phớt lờ Range (200) → full-file ở probe, 0 GOP (như mode all)", async () => {
  const srv = await serve(fastBuf, { ignoreRange: true });
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "full-file");
    if (out.mode === "full-file") {
      assert.match(out.reason, /probe-status-200/);
      assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    }
  } finally {
    await srv.close();
  }
});

ok("stream: fetch bù GOP giữa chừng trả 416 → { ok: false }, không chunk nửa vời", async () => {
  const track = parseMp4VideoTrack(
    fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
  );
  const defs = gopRangesFor(track.samples);
  const srv = await serve(fastBuf, { failRangeFrom: defs[2].rangeStart });
  try {
    const res = await fetchSingleGopRange(
      srv.url,
      defs[2].rangeStart,
      defs[2].rangeEnd,
      fastBuf.length,
      nodeFetch,
    );
    assert.equal(res.ok, false);
    if (!res.ok) assert.match(res.reason, /416/);
  } finally {
    await srv.close();
  }
});

ok("all (mặc định) không đổi: vẫn fetch đủ 6 GOP, gopMeta khớp mode stream", async () => {
  const srv = await serve(fastBuf);
  try {
    const outAll = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(outAll.mode, "gop-range");
    if (outAll.mode !== "gop-range") return;
    assert.equal(outAll.gops.length, 6);
    assert.equal(outAll.gopMeta.length, 6);
    assert.equal(outAll.requests.filter((r) => r.kind === "gop").length, 6);
    assert.ok(outAll.totalGopRangeBytes > 0);
    // Meta hai mode bằng nhau trên cùng fixture (khóa không lệch meta).
    const outStream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(outStream.mode, "gop-range");
    if (outStream.mode !== "gop-range") return;
    assert.deepEqual(outStream.gopMeta, outAll.gopMeta);
  } finally {
    await srv.close();
  }
});

ok("stream: trailing lớn (moov ngoài tiền tố) qua tail-scan → gop-range, 0 GOP lượt đầu", async () => {
  // Tiền điều kiện (mẫu E2): moov KHÔNG nằm trong tiền tố 512 KiB,
  // để chắc chắn test đi nhánh tail-scan chứ không phải nhánh
  // moov-trailing của file nhỏ.
  assert.equal(
    detectMoovPosition(new Uint8Array(trailBigBuf.subarray(0, 512 * 1024))),
    "unknown",
  );
  const srv = await serve(trailBigBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.sampleCount, 300);
    assert.equal(out.gopMeta.length, 10);
    assert.equal(out.gops.length, 0);
    assert.equal(out.totalGopRangeBytes, 0);
    assert.deepEqual(
      out.gopMeta.map((g) => g.firstSampleIndex),
      [0, 30, 60, 90, 120, 150, 180, 210, 240, 270],
    );
    assert.ok(out.requests.some((r) => r.kind === "tail" && r.status === 206));
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    assert.ok(srv.log.filter((l) => l.method === "GET").every((l) => l.status === 206));
    console.log(
      `    đo: trailing-big stream requests=${out.requests.map((r) => `${r.kind}:${r.status}:${r.bytes}`).join(",")}`,
    );
  } finally {
    await srv.close();
  }
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
