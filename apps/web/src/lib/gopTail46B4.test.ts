// gopTail46B4.test.ts — Phase 9 đợt 46, luồng B4: GOP trailing/moov.
//
// Chạy bằng esbuild bundle (định dạng esm, như A4):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTail46B4.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/r46b4.test.mjs \
//     && node /tmp/r46b4.test.mjs
// (chạy từ gốc repo).
//
// PHẠM VI (theo task B4):
// (a) moov không phải box cuối cùng: chỉ cứu trường hợp sau moov là
//     chuỗi free/skip/wide parse sạch tới EOF (ROUND46-B4 trong
//     gopTail45A4.ts); hậu tố khác (mdat/chuỗi vỡ) vẫn fallback.
//     Đợt 47 C5 ĐÃ ĐỔI quyết cho `udta`: udta nay trong allowlist
//     (xem gopTail47C5.test.ts + LIMITS C5 §3) nên test khóa udta ở
//     dưới đã sửa thành khóa hành vi mới, theo tiền lệ B2 (test khóa
//     hành vi cũ được sửa thành khóa hành vi mới khi quyết đổi).
// (b) moov trailing > 16 MiB: GIỮ trần — test khóa fallback an toàn
//     ở cả tầng thuần (lý do moov-too-large) lẫn tầng T3.
// (c) file fragmented (moof/mvex): KHÔNG hỗ trợ — test khóa fallback
//     demux-moov, 0 GOP (khảo sát + kết luận trong LIMITS B4 §3).
// (d) hợp đồng gate U2 cho file trailing nhỏ: GIỮ NGUYÊN — test khóa
//     fallback moov-trailing + đo thật tỉ lệ byte mà đường GOP "tiết
//     kiệm" được trên file trailing nhỏ (mẫu ffmpeg 2 s), và khóa
//     wiring vẫn off dưới ngưỡng 32 MiB (nên đổi gate không cứu được
//     đường production nào).
// (2) controller wiring cho file trailing trong (32, 128] MiB: Node
//     (không VideoDecoder) chỉ khẳng định gopMode/ready; bằng chứng
//     headed qua vite :5173 → bridge :8787 thật nằm ở harness
//     apps/web/scripts/gopHeaded46B4.mjs (xem LIMITS B4 §2).
// Fixture chỉ nằm trong os.tmpdir(), KHÔNG đưa vào repo (cấm binary).
// ffmpeg vắng mặt → phần ffmpeg skip có ghi log (như A4).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchVideoTrackByGopRange,
  scanTopBoxes,
} from "./gopRangeFetch39T3.ts";
import {
  findTrailingMoov,
} from "./gopTail45A4.ts";
import { parseMp4VideoTrack } from "./mp4Demux.ts";
import { resolveGopRangeWiring } from "./gopCache40V2.ts";
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
  console.log(`gopTail46B4: ${pass}/${queue.length} test pass`);
}

function boxHeader(size: number, type: string): Buffer {
  const b = Buffer.alloc(8);
  b.writeUInt32BE(size, 0);
  b.write(type, 4, "latin1");
  return b;
}
function synthMoov(mvhdSize = 32, trakSize = 24): Buffer {
  const mvhd = Buffer.concat([boxHeader(mvhdSize, "mvhd"), Buffer.alloc(mvhdSize - 8, 0)]);
  const trak = Buffer.concat([boxHeader(trakSize, "trak"), Buffer.alloc(trakSize - 8, 0)]);
  const size = 8 + mvhd.length + trak.length;
  return Buffer.concat([boxHeader(size, "moov"), mvhd, trak]);
}
function synthTrailing(mdatPayload: Buffer, moov: Buffer = synthMoov()): Buffer {
  const ftyp = Buffer.concat([boxHeader(24, "ftyp"), Buffer.alloc(16, 0)]);
  const mdat = Buffer.concat([boxHeader(8 + mdatPayload.length, "mdat"), mdatPayload]);
  return Buffer.concat([ftyp, mdat, moov]);
}
function freeBox(payload: number): Buffer {
  return Buffer.concat([boxHeader(8 + payload, "free"), Buffer.alloc(payload, 0)]);
}

// ---- (a) Pure: moov + hậu tố ----
ok("pure: moov + free cuối file → tìm đúng moov (B4 suffix)", () => {
  const file = Buffer.concat([synthTrailing(Buffer.alloc(300, 0)), freeBox(56)]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.start, file.length - synthMoov().length - freeBox(56).length);
  assert.equal(r.candidate.size, synthMoov().length);
});

ok("pure: moov + skip + wide (chuỗi hậu tố) → tìm đúng moov", () => {
  const suffix = Buffer.concat([
    Buffer.concat([boxHeader(24, "skip"), Buffer.alloc(16, 0)]),
    Buffer.concat([boxHeader(16, "wide"), Buffer.alloc(8, 0)]),
  ]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.size, synthMoov().length);
});

ok("pure: moov + free size==0 (kéo tới EOF) → tìm đúng moov", () => {
  const suffix = Buffer.concat([boxHeader(0, "free"), Buffer.alloc(50, 0)]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
});

ok("pure: moov + udta sau moov → TÌM ĐÚNG moov (C5 đổi quyết B4: udta nay trong allowlist, xem LIMITS C5 §3)", () => {
  const suffix = Buffer.concat([boxHeader(24, "udta"), Buffer.alloc(16, 0)]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.size, synthMoov().length);
  assert.equal(r.candidate.start, file.length - synthMoov().length - suffix.length);
});

ok("pure: moov + free vỡ (size khai vượt phần còn lại) → null", () => {
  const suffix = Buffer.concat([boxHeader(1000, "free"), Buffer.alloc(100, 0)]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
});

ok("pure: moov + free + mdat sau đó → null (chuỗi hậu tố gãy ở mdat)", () => {
  const suffix = Buffer.concat([
    freeBox(16),
    Buffer.concat([boxHeader(32, "mdat"), Buffer.alloc(24, 0)]),
  ]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
});

ok("pure: faststart cả file làm tail → vẫn null (moov sau đó là mdat, không phải hậu tố)", () => {
  const ftyp = Buffer.concat([boxHeader(24, "ftyp"), Buffer.alloc(16, 0)]);
  const moov = synthMoov();
  const mdat = Buffer.concat([boxHeader(1008, "mdat"), Buffer.alloc(1000, 0)]);
  const file = Buffer.concat([ftyp, moov, mdat]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
});

// ---- Fixture ffmpeg + server Range thật ----
const dir = mkdtempSync(join(tmpdir(), "vcut-b4-"));
function makeFfmpegFixture(name: string, extraArgs: string[]): Buffer | null {
  const out = join(dir, name);
  const args = [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10",
    ...extraArgs,
    out,
  ];
  try {
    execFileSync("ffmpeg", args, { stdio: "pipe" });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("ENOENT")) {
      console.log(`    skip ffmpeg: không có ffmpeg (${name})`);
      return null;
    }
    throw new Error(`ffmpeg tạo fixture ${name} thất bại: ${msg}`);
  }
  return readFileSync(out);
}
function inflateTrailingMdat(orig: Buffer, pad: number): Buffer {
  const boxes = scanTopBoxes(new Uint8Array(orig));
  const mdat = boxes.find((b) => b.type === "mdat")!;
  const moov = boxes[boxes.length - 1];
  assert.ok(moov.type === "moov" && moov.start > mdat.start, "fixture phải có thứ tự mdat trước moov");
  const newMdatSize = mdat.size + pad;
  const mdatHeader = Buffer.alloc(mdat.header);
  if (mdat.header === 16) {
    mdatHeader.writeUInt32BE(1, 0);
    mdatHeader.write("mdat", 4, "latin1");
    mdatHeader.writeBigUInt64BE(BigInt(newMdatSize), 8);
  } else {
    mdatHeader.writeUInt32BE(newMdatSize, 0);
    mdatHeader.write("mdat", 4, "latin1");
  }
  return Buffer.concat([
    Buffer.from(orig.subarray(0, mdat.start)),
    mdatHeader,
    Buffer.from(orig.subarray(mdat.start + mdat.header, mdat.start + mdat.size)),
    Buffer.alloc(pad, 0),
    Buffer.from(orig.subarray(moov.start)),
  ]);
}
async function serveRange(buf: Buffer): Promise<{ url: string; log: Array<{ method: string; range: string | null; status: number }>; close: () => Promise<void> }> {
  const log: Array<{ method: string; range: string | null; status: number }> = [];
  const server: Server = createServer((req, res) => {
    const range = req.headers.range ?? null;
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200); res.end();
      log.push({ method: "HEAD", range, status: 200 });
      return;
    }
    if (range === null) {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200); res.end(buf);
      log.push({ method: "GET", range, status: 200 });
      return;
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m) { res.writeHead(400); res.end(); log.push({ method: "GET", range, status: 400 }); return; }
    const start = Number(m[1]);
    const end = m[2] === "" ? buf.length - 1 : Math.min(Number(m[2]), buf.length - 1);
    if (start >= buf.length || start > end) {
      res.setHeader("Content-Range", `bytes */${buf.length}`);
      res.writeHead(416); res.end();
      log.push({ method: "GET", range, status: 416 });
      return;
    }
    res.setHeader("Content-Range", `bytes ${start}-${end}/${buf.length}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206); res.end(buf.subarray(start, end + 1));
    log.push({ method: "GET", range, status: 206 });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
  return { url: `http://127.0.0.1:${addr.port}/file.mp4`, log, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}

// ---- (a) Tích hợp T3: trailing + free sau moov ----
ok("tích hợp: trailing thật + free sau moov, tiền tố 4096 → T3 tail-scan suffix ra gop-range, 6 GOP, chunk byte-khớp", async () => {
  const orig = makeFfmpegFixture("trailing-free.mp4", []);
  if (orig === null) return;
  const inflated = inflateTrailingMdat(orig, 200_000);
  const withFree = Buffer.concat([inflated, freeBox(56)]);
  const srv = await serveRange(withFree);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: withFree.length,
      prefixBytes: 4096,
    });
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.gops.length, 6);
    assert.equal(out.sampleCount, 60);
    const full = parseMp4VideoTrack(orig.buffer.slice(orig.byteOffset, orig.byteOffset + orig.byteLength) as ArrayBuffer);
    let checked = 0;
    for (const gop of out.gops) {
      for (let k = 0; k < gop.chunks.length; k++) {
        const s = full.samples[gop.firstSampleIndex + k];
        const expected: Uint8Array = new Uint8Array(orig.subarray(s.offset, s.offset + s.size));
        const got = gop.chunks[k].data;
        assert.equal(got.length, expected.length, `sample ${gop.firstSampleIndex + k} dài khác`);
        assert.ok(got.every((v, i) => v === expected[i]), `sample ${gop.firstSampleIndex + k} byte khác`);
        checked++;
      }
    }
    assert.equal(checked, 60);
    assert.equal(out.requests.filter((r) => r.kind === "tail").length, 1);
    assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 6);
    assert.ok(srv.log.filter((l) => l.method === "GET").every((l) => l.status === 206), "không GET toàn file");
    console.log(`    đo: file=${withFree.length} byte, requests=${out.requests.map((r) => `${r.kind}:${r.start}-${r.end}`).join(",")}`);
  } finally {
    await srv.close();
  }
});

// ---- (b) moov trailing > 16 MiB: giữ trần ----
ok("pure: moov trailing 17+ MiB (free trong moov) + tail toàn file → null, lý do moov-too-large", () => {
  const bigFree = freeBox(17 * 1024 * 1024);
  const mvhd = Buffer.concat([boxHeader(32, "mvhd"), Buffer.alloc(24, 0)]);
  const trak = Buffer.concat([boxHeader(24, "trak"), Buffer.alloc(16, 0)]);
  const moovSize = 8 + mvhd.length + trak.length + bigFree.length;
  const moov = Buffer.concat([boxHeader(moovSize, "moov"), mvhd, trak, bigFree]);
  assert.ok(moovSize > 16 * 1024 * 1024, `moov phải vượt trần 16 MiB, thực tế ${moovSize}`);
  const file = synthTrailing(Buffer.alloc(200, 0), moov);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-moov-too-large");
});

ok("tích hợp: moov trailing 17+ MiB, tiền tố 4096 → T3 full-file tail-scan, 0 GOP", async () => {
  const bigFree = freeBox(17 * 1024 * 1024);
  const mvhd = Buffer.concat([boxHeader(32, "mvhd"), Buffer.alloc(24, 0)]);
  const trak = Buffer.concat([boxHeader(24, "trak"), Buffer.alloc(16, 0)]);
  const moovSize = 8 + mvhd.length + trak.length + bigFree.length;
  const moov = Buffer.concat([boxHeader(moovSize, "moov"), mvhd, trak, bigFree]);
  const file = synthTrailing(Buffer.alloc(200_000, 0), moov);
  const srv = await serveRange(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: file.length,
      prefixBytes: 4096,
    });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /tail-scan/);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
    console.log(`    đo: file=${file.length} byte, moov=${moovSize} byte, reason=${out.reason}`);
  } finally {
    await srv.close();
  }
});

// ---- (c) fragmented: không hỗ trợ, fallback an toàn ----
ok("tích hợp: fragmented thật (ffmpeg empty_moov + moof) → T3 full-file demux-moov, 0 GOP", async () => {
  const frag = makeFfmpegFixture("frag.mp4", ["-movflags", "+frag_keyframe+empty_moov+default_base_moof"]);
  if (frag === null) return;
  const boxes = scanTopBoxes(new Uint8Array(frag));
  console.log(`    fragmented top boxes: ${boxes.map((b) => b.type).join(",")}`);
  assert.ok(boxes.some((b) => b.type === "moof"), "fixture fragmented phải có moof");
  const srv = await serveRange(frag);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: frag.length,
    });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /demux-moov/);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    console.log(`    đo: file=${frag.length} byte, reason=${out.reason}`);
  } finally {
    await srv.close();
  }
});

// ---- (d) gate U2 cho file trailing nhỏ: GIỮ NGUYÊN ----
ok("giữ gate: trailing nhỏ (moov gọn trong tiền tố mặc định) → full-file moov-trailing, 0 tail, 0 GOP", async () => {
  const trail = makeFfmpegFixture("trailing-small.mp4", []);
  if (trail === null) return;
  const srv = await serveRange(trail);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /moov-trailing/);
    assert.equal(out.requests.filter((r) => r.kind === "tail").length, 0);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
    // Đo thật: đường GOP trên file này "tiết kiệm" được bao nhiêu?
    // GOP fetch = byte sample video; tải toàn file = cả file. Tỉ lệ
    // sample/file càng gần 1 thì cứu file nhỏ càng vô nghĩa.
    const track = parseMp4VideoTrack(trail.buffer.slice(trail.byteOffset, trail.byteOffset + trail.byteLength) as ArrayBuffer);
    const sampleBytes = track.samples.reduce((a, s) => a + s.size, 0);
    const ratio = sampleBytes / trail.length;
    console.log(`    đo: file=${trail.length} byte, sample bytes=${sampleBytes}, tỉ lệ sample/file=${ratio.toFixed(4)} (GOP chỉ bớt được ${(1 - ratio).toFixed(4)} so với tải toàn file)`);
    assert.ok(ratio > 0.9, `tỉ lệ sample/file phải > 0.9 mới kết luận "tiết kiệm không đáng kể", thực tế ${ratio}`);
    // Và dù có đổi gate, wiring production vẫn off vì file dưới ngưỡng:
    const wiring = resolveGopRangeWiring({ enabled: true, knownSizeBytes: trail.length });
    assert.equal(wiring.useGop, false);
    assert.match(wiring.reason, /below-threshold/);
    console.log(`    đo: wiring file nhỏ → useGop=${wiring.useGop}, reason=${wiring.reason}`);
  } finally {
    await srv.close();
  }
});

// ---- (2) controller wiring cho file trailing trong (32, 128] MiB (Node) ----
ok("controller: trailing ~37 MiB qua wiring (gopRangeEnabled, size đã biết) → gop-mode gop-range, ready", async () => {
  const orig = makeFfmpegFixture("trailing-37.mp4", []);
  if (orig === null) return;
  const target = 37 * 1024 * 1024;
  const inflated = inflateTrailingMdat(orig, target - orig.length);
  assert.ok(inflated.length > 32 * 1024 * 1024 && inflated.length <= 128 * 1024 * 1024,
    `file phải trong (32, 128] MiB, thực tế ${inflated.length}`);
  const srv = await serveRange(inflated);
  try {
    const c = new ReversePreviewController(srv.url, 15, {
      knownFileSizeBytes: inflated.length,
      gopRangeEnabled: true,
    });
    const done = await c.ensureWindowForTime(0);
    // Node thiếu VideoDecoder nên decode cửa sổ trả false (fail-soft,
    // như tiền lệ V2) — nhưng đường GOP đã chạy: track có, gopMode
    // gop-range, không fallback.
    assert.equal(c.ready, true);
    assert.equal(c.gopMode, "gop-range");
    assert.equal(c.gopFallbackReason, null);
    console.log(`    đo: file=${inflated.length} byte, ensureWindow=${done} (Node, thiếu VideoDecoder — fail-soft), gopMode=${c.gopMode}, ready=${c.ready}`);
    c.dispose();
  } finally {
    await srv.close();
  }
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
