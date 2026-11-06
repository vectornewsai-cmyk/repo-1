// gopRangeFetch39T3.test.ts — Đường fetch thật theo GOP bằng Range,
// nối cổng gate đợt 38 U2 (Phase 9 đợt 39, luồng T3).
//
// Chạy bằng esbuild bundle (như U2):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopRangeFetch39T3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r39t3.test.cjs \
//     && node /tmp/r39t3.test.cjs
// (chạy từ gốc repo).
//
// KHÁC test U2 ở chỗ: test này fetch THẬT qua HTTP — fixture MP4 tạo
// bằng ffmpeg có sẵn trên máy (/usr/bin/ffmpeg: testsrc2 320x240,
// 30 fps, 2 s = 60 frame, -g 10 → 6 GOP), serve bằng node:http có
// hỗ trợ Range thật (206 + Content-Range), rồi đối chiếu từng byte
// chunk GOP với sample cắt từ file gốc. Fixture chỉ nằm trong
// os.tmpdir(), KHÔNG đưa vào repo (cấm binary).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import {
  fetchVideoTrackByGopRange,
  gopRangesFor,
  scanTopBoxes,
} from "./gopRangeFetch39T3.ts";
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
  console.log(`gopRangeFetch39T3: ${pass}/${queue.length} test pass`);
}

// ---- Fixture: ffmpeg thật, nguồn ghi rõ trong tên test/log ----
const dir = mkdtempSync(join(tmpdir(), "vcut-t3-"));
function makeFixture(name: string, faststart: boolean): string {
  const out = join(dir, name);
  const args = [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10",
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
  return out;
}
const fastPath = makeFixture("faststart.mp4", true);
const trailPath = makeFixture("trailing.mp4", false);
const fastBuf = readFileSync(fastPath);
const trailBuf = readFileSync(trailPath);
console.log(`  fixture faststart: ${fastBuf.length} byte, trailing: ${trailBuf.length} byte (ffmpeg testsrc2 320x240 30fps 2s, -g 10)`);

// ---- Server HTTP Range thật (node:http, tự cài, không phụ thuộc Express) ----
interface ServerOpts {
  ignoreRange?: boolean;
  acceptRangesHeader?: string;
  failRangeFrom?: number;
  noHeadLength?: boolean;
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
    const acceptRanges = opts.acceptRangesHeader ?? "bytes";
    res.setHeader("Accept-Ranges", acceptRanges);
    if (req.method === "HEAD") {
      if (!opts.noHeadLength) res.setHeader("Content-Length", buf.length);
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

// ---- Unit: chia GOP + quét moov trên file thật ----
ok("unit: file faststart có moov ở đầu (ftyp, moov, free; mdat tràn tiền tố nên scanner dừng đúng luật)", () => {
  const boxes = scanTopBoxes(new Uint8Array(fastBuf.subarray(0, 4096)));
  // mdat dài 91271 byte, tràn tiền tố 4096 nên scanner dừng sau free —
  // đó là hành vi đúng (box cắt dở thì dừng), không phải lỗi quét.
  assert.deepEqual(
    boxes.map((b) => b.type),
    ["ftyp", "moov", "free"],
  );
  assert.equal(boxes[1].start, 32);
  assert.equal(boxes[1].size, 1479);
});

ok("unit: gopRangesFor chia 60 sample thành 6 GOP, keyframe ở 0/10/20/30/40/50", () => {
  const track = parseMp4VideoTrack(
    fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
  );
  assert.equal(track.samples.length, 60);
  const gops = gopRangesFor(track.samples);
  assert.equal(gops.length, 6);
  assert.deepEqual(
    gops.map((g) => g.firstSampleIndex),
    [0, 10, 20, 30, 40, 50],
  );
  for (const g of gops) assert.equal(g.lastSampleIndex - g.firstSampleIndex + 1, 10);
  // Range các GOP phủ kín sample, không chồng lấn sai thứ tự.
  for (let i = 1; i < gops.length; i++) {
    assert.ok(gops[i].rangeStart >= gops[i - 1].rangeStart);
  }
});

ok("unit: parse moov-only cho cùng sample table với parse toàn file", () => {
  const full = parseMp4VideoTrack(
    fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
  );
  const boxes = scanTopBoxes(new Uint8Array(fastBuf.subarray(0, 4096)));
  const moov = boxes.find((b) => b.type === "moov")!;
  const moovOnly = parseMp4VideoTrack(
    fastBuf.buffer.slice(
      fastBuf.byteOffset + moov.start,
      fastBuf.byteOffset + moov.start + moov.size,
    ) as ArrayBuffer,
  );
  assert.equal(moovOnly.samples.length, full.samples.length);
  for (let i = 0; i < full.samples.length; i++) {
    assert.equal(moovOnly.samples[i].offset, full.samples[i].offset);
    assert.equal(moovOnly.samples[i].size, full.samples[i].size);
    assert.equal(moovOnly.samples[i].isKey, full.samples[i].isKey);
  }
  assert.equal(moovOnly.codec, full.codec);
});

// ---- Tích hợp: fetch GOP thật qua HTTP Range ----
ok("tích hợp: faststart qua server Range thật → 6 GOP, từng byte chunk khớp file gốc", async () => {
  const srv = await serve(fastBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.gops.length, 6);
    assert.equal(out.sampleCount, 60);
    const full = parseMp4VideoTrack(
      fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
    );
    let checked = 0;
    for (const gop of out.gops) {
      for (let k = 0; k < gop.chunks.length; k++) {
        const si = gop.firstSampleIndex + k;
        const s = full.samples[si];
        const expect = new Uint8Array(fastBuf.subarray(s.offset, s.offset + s.size));
        const got = gop.chunks[k].data;
        assert.equal(got.length, expect.length, `sample ${si} dài khác`);
        assert.ok(got.every((v, i) => v === expect[i]), `sample ${si} byte khác`);
        assert.equal(gop.chunks[k].type, s.isKey ? "key" : "delta");
        checked++;
      }
    }
    assert.equal(checked, 60);
    // Số đo thật (in ra để LIMITS trích, không hard-code tổng byte):
    console.log(
      `    đo: gopRangeBytes=${out.totalGopRangeBytes} sampleBytes=${out.totalSampleBytes} ` +
        `overhead=${out.totalGopRangeBytes - out.totalSampleBytes} ` +
        `requests=${out.requests.map((r) => `${r.kind}:${r.status}:${r.bytes}`).join(",")}`,
    );
    assert.ok(out.totalGopRangeBytes >= out.totalSampleBytes);
    const gopReqs = out.requests.filter((r) => r.kind === "gop");
    assert.equal(gopReqs.length, 6);
    assert.ok(gopReqs.every((r) => r.status === 206));
    // Không còn request toàn file nào: mọi GET đều là Range 206.
    assert.ok(srv.log.filter((l) => l.method === "GET").every((l) => l.status === 206));
  } finally {
    await srv.close();
  }
});

ok("tích hợp: knownSizeBytes từ caller (không HEAD) vẫn chạy GOP", async () => {
  const srv = await serve(fastBuf, { noHeadLength: true });
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fastBuf.length,
    });
    assert.equal(out.mode, "gop-range");
    if (out.mode === "gop-range") assert.equal(out.gops.length, 6);
  } finally {
    await srv.close();
  }
});

// ---- Fallback: mọi đường hỏng đều về full-file, không throw, không GOP fetch ----
ok("fallback: moov cuối (trailing) → full-file, 0 request GOP", async () => {
  const srv = await serve(trailBuf);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "full-file");
    if (out.mode === "full-file") {
      assert.match(out.reason, /moov-trailing/);
      assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    }
  } finally {
    await srv.close();
  }
});

ok("fallback: server phớt lờ Range (trả 200) → full-file ở probe, 0 request GOP", async () => {
  const srv = await serve(fastBuf, { ignoreRange: true });
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "full-file");
    if (out.mode === "full-file") {
      assert.match(out.reason, /probe-status-200/);
      assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    }
  } finally {
    await srv.close();
  }
});

ok("fallback: HEAD báo Accept-Ranges none (gate chặn) dù Range vẫn 206 → full-file, 0 GOP", async () => {
  const srv = await serve(fastBuf, { acceptRangesHeader: "none" });
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "full-file");
    if (out.mode === "full-file") {
      assert.match(out.reason, /accept-ranges-unsupported/);
      assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    }
  } finally {
    await srv.close();
  }
});

ok("fallback: GOP giữa chừng trả 416 → full-file, không trả chunk nửa vời", async () => {
  const track = parseMp4VideoTrack(
    fastBuf.buffer.slice(fastBuf.byteOffset, fastBuf.byteOffset + fastBuf.byteLength) as ArrayBuffer,
  );
  const gops = gopRangesFor(track.samples);
  const srv = await serve(fastBuf, { failRangeFrom: gops[2].rangeStart });
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "full-file");
    if (out.mode === "full-file") {
      assert.match(out.reason, /gop-status-416/);
      assert.ok(!("gops" in out));
    }
  } finally {
    await srv.close();
  }
});

ok("fallback: fetchImpl ném lỗi mạng → full-file, không throw", async () => {
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1:1/x.mp4", {
    fetchImpl: async () => {
      throw new Error("ECONNREFUSED giả lập");
    },
  });
  assert.equal(out.mode, "full-file");
  if (out.mode === "full-file") assert.match(out.reason, /exception/);
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
