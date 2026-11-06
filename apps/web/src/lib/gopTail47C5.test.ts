// gopTail47C5.test.ts — Phase 9 đợt 47, luồng C5: GOP trailing/moov.
//
// Chạy bằng esbuild bundle (định dạng esm, như A4/B4):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTail47C5.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/r47c5.test.mjs \
//     && node /tmp/r47c5.test.mjs
// (chạy từ gốc repo).
//
// PHẠM VI (theo task C5, đóng nợ B4 §7.2 + §7.5 + §7.6):
// (a) moov + hậu tố `udta` sau moov: mở allowlist của
//     `trailingSuffixValid` (ROUND47-C5 trong gopTail45A4.ts) — udta
//     là metadata người dùng ở top-level, không mang sample, T3 chỉ
//     cắt đúng byte moov rồi demux nên byte hậu tố không bao giờ tới
//     demux. Hậu tố khác (mdat/moof/chuỗi vỡ) vẫn fallback.
// (b) hậu tố ngoài cửa sổ đuôi 16 MiB: QUYẾT GIỮ cửa sổ (không mở
//     rộng) — test khóa fallback an toàn + đo thật số byte mà cửa sổ
//     lớn hơn sẽ cần (xem LIMITS C5 §4). Moov bắt đầu trước tailStart
//     thì tail-scan không thấy, T3 fallback, 0 GOP.
// (c) file fragmented: đo LẠI bằng fixture mới (không claim hỗ trợ
//     khi chưa có parser moof) — kết luận giữ nguyên như B4.
// (d) App UI mặc định bật GOP: phần Node chỉ khóa được nửa dưới —
//     `readReverseWebcodecsOptIn()` dưới Node (không window) vẫn
//     TẮT để test cũ không đổi hành vi; mặc định BẬT ở browser +
//     toggle TopBar + GOP chạy trên file thật trong app được đo bằng
//     harness headed apps/web/scripts/gopHeaded47C5.mjs (xem LIMITS
//     C5 §5). Fixture chỉ nằm trong os.tmpdir(), KHÔNG đưa vào repo
//     (cấm binary). ffmpeg vắng mặt → phần ffmpeg skip có ghi log
//     (như A4/B4).
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
import {
  readReverseWebcodecsOptIn,
  resolveReverseEngine,
  setReverseWebcodecsOptIn,
} from "./reversePlayback.ts";

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
  console.log(`gopTail47C5: ${pass}/${queue.length} test pass`);
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
/** Box udta với payload metadata tùy ý (mặc định 0xAB — cố tình không
 *  đi thành cây box con, để khóa tính chất "udta được đối xử như free:
 *  chỉ kiểm tra header + size, không kiểm tra payload"). */
function udtaBox(payload: number, fill = 0xab): Buffer {
  return Buffer.concat([boxHeader(8 + payload, "udta"), Buffer.alloc(payload, fill)]);
}

// ---- (a) Pure: moov + hậu tố udta ----
ok("pure: moov + udta cuối file → tìm đúng moov (C5 suffix)", () => {
  const suffix = udtaBox(16);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(300, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.start, file.length - synthMoov().length - suffix.length);
  assert.equal(r.candidate.size, synthMoov().length);
});

ok("pure: moov + udta size==0 (kéo tới EOF) → tìm đúng moov", () => {
  const suffix = Buffer.concat([boxHeader(0, "udta"), Buffer.alloc(50, 0xab)]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
});

ok("pure: moov + free + udta + skip (chuỗi hậu tố hỗn hợp) → tìm đúng moov", () => {
  const suffix = Buffer.concat([
    freeBox(16),
    udtaBox(24),
    Buffer.concat([boxHeader(16, "skip"), Buffer.alloc(8, 0)]),
  ]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.size, synthMoov().length);
});

ok("pure: moov + udta largesize → tìm đúng moov", () => {
  const head = Buffer.alloc(16);
  head.writeUInt32BE(1, 0);
  head.write("udta", 4, "latin1");
  head.writeBigUInt64BE(BigInt(40), 8);
  const suffix = Buffer.concat([head, Buffer.alloc(24, 0xab)]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
});

ok("pure: moov + udta + mdat sau đó → null (chuỗi hậu tố gãy ở mdat)", () => {
  const suffix = Buffer.concat([
    udtaBox(16),
    Buffer.concat([boxHeader(32, "mdat"), Buffer.alloc(24, 0)]),
  ]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
});

ok("pure: moov + udta vỡ (size khai vượt phần còn lại) → null", () => {
  const suffix = Buffer.concat([boxHeader(1000, "udta"), Buffer.alloc(100, 0xab)]);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200, 0)), suffix]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
});

// ---- (b) Pure: hậu tố ngoài cửa sổ đuôi 16 MiB — GIỮ cửa sổ ----
ok("pure: moov + free trailer 17 MiB (moov bắt đầu trước tailStart) → null, lý do no-candidate", () => {
  const trailer = freeBox(17 * 1024 * 1024 - 8);
  const file = Buffer.concat([synthTrailing(Buffer.alloc(200_000, 0)), trailer]);
  const tailBytes = 16 * 1024 * 1024;
  const tail = new Uint8Array(file.subarray(file.length - tailBytes));
  const r = findTrailingMoov(tail, file.length);
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-no-candidate");
  // Đo thật cho quyết giữ cửa sổ (LIMITS C5 §4): moov bắt đầu trước
  // tailStart bao nhiêu, và cửa sổ lớn hơn sẽ cần bao nhiêu byte.
  const moovStart = file.length - trailer.length - synthMoov().length;
  const tailStart = file.length - tailBytes;
  const windowNeeded = file.length - moovStart;
  console.log(`    đo: file=${file.length} byte, moov start=${moovStart}, tailStart=${tailStart}, moov trước cửa sổ ${tailStart - moovStart} byte, cửa sổ cần ${windowNeeded} byte (>${tailBytes} byte) mới thấy moov`);
  assert.ok(moovStart < tailStart, "moov phải bắt đầu trước cửa sổ đuôi");
  assert.ok(windowNeeded > tailBytes, "cửa sổ cần phải lớn hơn 16 MiB mới thấy moov");
});

// ---- Fixture ffmpeg + server Range thật ----
const dir = mkdtempSync(join(tmpdir(), "vcut-c5-"));
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

// ---- (a) Tích hợp T3: trailing + udta sau moov ----
ok("tích hợp: trailing thật + udta sau moov, tiền tố 4096 → T3 tail-scan suffix ra gop-range, 6 GOP, chunk byte-khớp", async () => {
  const orig = makeFfmpegFixture("trailing-udta.mp4", []);
  if (orig === null) return;
  const inflated = inflateTrailingMdat(orig, 200_000);
  const withUdta = Buffer.concat([inflated, udtaBox(16)]);
  const srv = await serveRange(withUdta);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: withUdta.length,
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
    console.log(`    đo: file=${withUdta.length} byte, requests=${out.requests.map((r) => `${r.kind}:${r.start}-${r.end}`).join(",")}`);
  } finally {
    await srv.close();
  }
});

// ---- (b) Tích hợp T3: hậu tố ngoài cửa sổ — fallback, 0 GOP ----
ok("tích hợp: trailing thật + free trailer 17 MiB sau moov, tiền tố 4096 → T3 full-file tail-scan, 0 GOP", async () => {
  const orig = makeFfmpegFixture("trailing-bigtrailer.mp4", []);
  if (orig === null) return;
  const inflated = inflateTrailingMdat(orig, 200_000);
  const trailer = freeBox(17 * 1024 * 1024 - 8);
  const file = Buffer.concat([inflated, trailer]);
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
    assert.equal(out.requests.filter((r) => r.kind === "tail").length, 1);
    // Đo thật cho quyết giữ cửa sổ: T3 chỉ tốn 1 request tail 16 MiB
    // rồi fallback; cửa sổ lớn hơn sẽ cần moovStart→EOF byte.
    const moovStart = file.length - trailer.length - (scanTopBoxes(new Uint8Array(inflated))[scanTopBoxes(new Uint8Array(inflated)).length - 1]?.size ?? 0);
    console.log(`    đo: file=${file.length} byte, reason=${out.reason}, tail requests=${out.requests.filter((r) => r.kind === "tail").map((r) => `${r.start}-${r.end}`).join(",")}, cửa sổ cần để thấy moov=${file.length - moovStart} byte`);
    assert.ok(file.length - moovStart > 16 * 1024 * 1024, "cửa sổ cần phải lớn hơn 16 MiB");
  } finally {
    await srv.close();
  }
});

// ---- (c) fragmented: đo LẠI bằng fixture mới, kết luận giữ nguyên ----
ok("tích hợp: fragmented thật (ffmpeg empty_moov + moof) đo lại → T3 full-file demux-moov, 0 GOP", async () => {
  const frag = makeFfmpegFixture("frag-c5.mp4", ["-movflags", "+frag_keyframe+empty_moov+default_base_moof"]);
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

// ---- (d) Mặc định bật GOP: nửa dưới Node (không window) giữ nguyên ----
ok("opt-in: dưới Node (không window) vẫn TẮT — test cũ không đổi hành vi; opt-in tường minh vẫn chọn webcodecs", () => {
  assert.equal(readReverseWebcodecsOptIn(), false);
  assert.equal(resolveReverseEngine(), "element");
  assert.equal(resolveReverseEngine(true, true), "webcodecs");
  assert.equal(resolveReverseEngine(false, true), "element");
  // set không throw dưới Node (localStorage/window vắng, đều try/catch).
  setReverseWebcodecsOptIn(true);
  setReverseWebcodecsOptIn(false);
  assert.equal(readReverseWebcodecsOptIn(), false);
  console.log("    đo: Node readReverseWebcodecsOptIn()=false, resolveReverseEngine()=element, explicit(true,true)=webcodecs; mặc định BẬT ở browser đo bằng harness headed (LIMITS C5 §5)");
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
