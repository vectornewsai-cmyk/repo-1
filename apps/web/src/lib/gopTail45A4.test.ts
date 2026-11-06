// gopTail45A4.test.ts — Tail-scan tìm box moov cuối file (Phase 9
// đợt 45, luồng A4; đóng nợ đợt 44 §4.5: moov cuối file thật với mdat
// khổng lồ vẫn fallback).
//
// Chạy bằng esbuild bundle (định dạng esm, như task luồng yêu cầu):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTail45A4.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/r45a4.test.mjs \
//     && node /tmp/r45a4.test.mjs
// (chạy từ gốc repo).
//
// PHẠM VI: (a) hàm thuần `findTrailingMoov` trên fixture tổng hợp —
// một phần fixture tạo bằng Python struct (box giả, xem test
// "python"), phần còn lại tạo bằng Buffer trong test; (b) tích hợp
// T3: file trailing thật từ ffmpeg (không faststart) + pad cuối
// mdat để tiền tố 4096 không tới được moov → T3 phải đi tail-scan
// mới ra gop-range. Fixture chỉ nằm trong os.tmpdir(), KHÔNG đưa
// vào repo (cấm binary). ffmpeg vắng mặt → phần ffmpeg skip có ghi
// log (theo đúng task: "nếu ffmpeg có sẵn"); python3 vắng mặt →
// test python fail rõ (python là công cụ fixture mà task chỉ định).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchVideoTrackByGopRange,
  scanTopBoxes,
} from "./gopRangeFetch39T3.ts";
import type { GopRangeFetchFn, GopRangeResponse } from "./gopRangeFetch39T3.ts";
import {
  findTrailingMoov,
  tailRangeFor,
} from "./gopTail45A4.ts";
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
  console.log(`gopTail45A4: ${pass}/${queue.length} test pass`);
}

function boxHeader(size: number, type: string): Buffer {
  const b = Buffer.alloc(8);
  b.writeUInt32BE(size, 0);
  b.write(type, 4, "latin1");
  return b;
}
function boxLargesizeHeader(size: number, type: string): Buffer {
  const b = Buffer.alloc(16);
  b.writeUInt32BE(1, 0);
  b.write(type, 4, "latin1");
  b.writeBigUInt64BE(BigInt(size), 8);
  return b;
}
/** Moov tổng hợp đủ qua cửa 3: mvhd + trak, nội dung con toàn 0. */
function synthMoov(mvhdSize = 32, trakSize = 24): Buffer {
  const mvhd = Buffer.concat([boxHeader(mvhdSize, "mvhd"), Buffer.alloc(mvhdSize - 8, 0)]);
  const trak = Buffer.concat([boxHeader(trakSize, "trak"), Buffer.alloc(trakSize - 8, 0)]);
  const size = 8 + mvhd.length + trak.length;
  return Buffer.concat([boxHeader(size, "moov"), mvhd, trak]);
}
/** File trailing tổng hợp: ftyp + mdat (payload tùy ý) + moov ở cuối. */
function synthTrailing(mdatPayload: Buffer, moov: Buffer = synthMoov()): Buffer {
  const ftyp = Buffer.concat([boxHeader(24, "ftyp"), Buffer.alloc(16, 0)]);
  const mdat = Buffer.concat([boxHeader(8 + mdatPayload.length, "mdat"), mdatPayload]);
  return Buffer.concat([ftyp, mdat, moov]);
}

// ---- Pure: findTrailingMoov ----
ok("pure: trailing tổng hợp → tìm đúng start/size moov cuối file", () => {
  const payload = Buffer.alloc(500, 0);
  const file = synthTrailing(payload);
  const moovStart = 24 + 8 + payload.length;
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.start, moovStart);
  assert.equal(r.candidate.size, file.length - moovStart);
  assert.equal(r.candidate.header, 8);
  assert.equal(r.tailStart, 0);
});

ok("pure: moov đầu file (faststart) → không tail-scan: tail là mdat cuối thì null, cả file làm tail cũng null", () => {
  const ftyp = Buffer.concat([boxHeader(24, "ftyp"), Buffer.alloc(16, 0)]);
  const moov = synthMoov();
  const mdatPayload = Buffer.alloc(1000, 0);
  const mdat = Buffer.concat([boxHeader(8 + mdatPayload.length, "mdat"), mdatPayload]);
  const file = Buffer.concat([ftyp, moov, mdat]);
  // Tail = 500 byte cuối (toàn payload mdat, không có moov).
  const r1 = findTrailingMoov(new Uint8Array(file.subarray(file.length - 500)), file.length);
  assert.equal(r1.found, false);
  // Cả file làm tail: moov đầu không kết thúc ở EOF nên vẫn null.
  const r2 = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r2.found, false);
});

ok("pure: mdat chứa chuỗi 'moov' giả (không size hợp lệ) → null", () => {
  const payload = Buffer.alloc(500, 0);
  payload.write("moov", 100, "latin1");
  payload.write("moov", 300, "latin1");
  const file = synthTrailing(payload);
  // Bỏ moov thật ở cuối, chỉ giữ ftyp+mdat chứa chuỗi giả.
  const noMoov = file.subarray(0, file.length - synthMoov().length);
  const r = findTrailingMoov(new Uint8Array(noMoov), noMoov.length);
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-no-candidate");
});

ok("pure: mdat chứa box 'moov' giả chế để kết thúc ở EOF nhưng payload rác → null (cửa 3 chặn)", () => {
  const ftyp = Buffer.concat([boxHeader(24, "ftyp"), Buffer.alloc(16, 0)]);
  // File: ftyp + mdat (payload 0) + box moov giả cuối file: header
  // khai size vừa đủ tới EOF, payload toàn 0xFF (đi cây box con sẽ
  // fail ngay child đầu: size 0xFFFFFFFF vượt moov).
  const fakeSize = 8 + 200;
  const fake = Buffer.concat([boxHeader(fakeSize, "moov"), Buffer.alloc(200, 0xff)]);
  const mdatPayload = Buffer.alloc(300, 0);
  const mdat = Buffer.concat([boxHeader(8 + mdatPayload.length, "mdat"), mdatPayload]);
  const file = Buffer.concat([ftyp, mdat, fake]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-no-candidate");
});

ok("pure: file quá nhỏ / tail rỗng / tail dài hơn file / fileSize 0 → null, không throw", () => {
  assert.equal(findTrailingMoov(new Uint8Array(0), 100).found, false);
  const file = synthTrailing(Buffer.alloc(100, 0));
  assert.equal(findTrailingMoov(new Uint8Array(file), 0).found, false);
  // Tail dài hơn file: đầu vào không nhất quán → từ chối thay vì suy diễn.
  const longer = Buffer.concat([Buffer.alloc(50, 0), file]);
  const r = findTrailingMoov(new Uint8Array(longer), file.length);
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-tail-larger-than-file");
});

ok("pure: moov bị cắt (chỉ đưa 500 byte cuối của moov 2000 byte) → null", () => {
  const moov = synthMoov(1200, 800); // moov 2008 byte
  const file = synthTrailing(Buffer.alloc(200, 0), moov);
  const tail = file.subarray(file.length - 500);
  const r = findTrailingMoov(new Uint8Array(tail), file.length);
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-no-candidate");
});

ok("pure: moov largesize trailing → tìm đúng, header 16", () => {
  const mvhd = Buffer.concat([boxHeader(32, "mvhd"), Buffer.alloc(24, 0)]);
  const trak = Buffer.concat([boxHeader(24, "trak"), Buffer.alloc(16, 0)]);
  const size = 16 + mvhd.length + trak.length;
  const moov = Buffer.concat([boxLargesizeHeader(size, "moov"), mvhd, trak]);
  const file = synthTrailing(Buffer.alloc(300, 0), moov);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.header, 16);
  assert.equal(r.candidate.size, size);
  assert.equal(r.candidate.start, file.length - size);
});

ok("pure: moov size==0 ở cuối → null (không fetch range vô hạn)", () => {
  const ftyp = Buffer.concat([boxHeader(24, "ftyp"), Buffer.alloc(16, 0)]);
  const mdat = Buffer.concat([boxHeader(108, "mdat"), Buffer.alloc(100, 0)]);
  const moovZero = Buffer.concat([boxHeader(0, "moov"), Buffer.alloc(50, 0)]);
  const file = Buffer.concat([ftyp, mdat, moovZero]);
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, false);
});

ok("pure: moov trailing vượt trần override → null, lý do moov-too-large", () => {
  const file = synthTrailing(Buffer.alloc(200, 0));
  const r = findTrailingMoov(new Uint8Array(file), file.length, { maxMoovBytes: 32 });
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-moov-too-large");
});

ok("pure: nhiều ứng viên cùng lọt → chọn ngoài cùng nhất (start nhỏ nhất)", () => {
  // Moov ngoài có box con tên "moov" ở cuối (chế tác): cả hai ứng
  // viên đều kết thúc ở EOF và đều có mvhd+trak. Box ngoài mới là
  // box top-level; box trong chỉ là con của nó.
  const inner = synthMoov();
  const mvhd = Buffer.concat([boxHeader(32, "mvhd"), Buffer.alloc(24, 0)]);
  const trak = Buffer.concat([boxHeader(24, "trak"), Buffer.alloc(16, 0)]);
  const outerSize = 8 + mvhd.length + trak.length + inner.length;
  const outer = Buffer.concat([boxHeader(outerSize, "moov"), mvhd, trak, inner]);
  const file = synthTrailing(Buffer.alloc(100, 0), outer);
  const outerStart = 24 + 8 + 100;
  const r = findTrailingMoov(new Uint8Array(file), file.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.start, outerStart);
  assert.equal(r.candidate.size, outerSize);
});

ok("pure: tailRangeFor kẹp đúng (file nhỏ hơn cửa sổ → start 0; file lớn → size-tailBytes; invalid → null)", () => {
  assert.deepEqual(tailRangeFor(1000, 16 * 1024 * 1024), { start: 0, end: 999 });
  assert.deepEqual(tailRangeFor(50_000_000, 16 * 1024 * 1024), { start: 50_000_000 - 16 * 1024 * 1024, end: 49_999_999 });
  assert.equal(tailRangeFor(0, 1024), null);
  assert.equal(tailRangeFor(1000, 0), null);
});

// ---- Fixture Python struct (box giả) ----
const dir = mkdtempSync(join(tmpdir(), "vcut-a4-"));
ok("python: fixture struct (ftyp + mdat chứa 'moov' giả + moov thật cuối) → tail-scan tìm đúng moov thật", () => {
  const pyPath = join(dir, "make_tail_fixture.py");
  const outPath = join(dir, "synth-trailing.mp4");
  const script = [
    "import struct",
    "def box(t, payload):",
    "    return struct.pack('>I4s', 8 + len(payload), t) + payload",
    "ftyp = struct.pack('>I4s', 24, b'ftyp') + b'isom' + struct.pack('>I', 0) + b'isom' + b'mp41'",
    "assert len(ftyp) == 24",
    // Payload mdat chứa chuỗi moov giả + box moov giả (size không tới EOF).
    "fake = struct.pack('>I4s', 5000, b'moov') + b'\\xff' * 40",
    "payload = b'\\x00' * 100 + b'moov' + b'\\x00' * 50 + fake + b'\\x00' * 80",
    "mdat = box(b'mdat', payload)",
    "mvhd = box(b'mvhd', b'\\x00' * 24)",
    "trak = box(b'trak', b'\\x00' * 16)",
    "moov = box(b'moov', mvhd + trak)",
    "open(r'" + outPath.replace(/\\/g, "\\\\") + "', 'wb').write(ftyp + mdat + moov)",
    "print('ftyp=24 mdat=%d moov=%d total=%d' % (len(mdat), len(moov), 24 + len(mdat) + len(moov)))",
  ].join("\n");
  writeFileSync(pyPath, script);
  let stdout: string;
  try {
    stdout = execFileSync("python3", [pyPath], { encoding: "utf8" });
  } catch (e) {
    throw new Error(`python3 tạo fixture thất bại: ${(e as Error).message}`);
  }
  console.log(`    python: ${stdout.trim()}`);
  const buf = readFileSync(outPath);
  // Đối chiếu độc lập bằng quét box top-level của T3 (không hard-code size mdat).
  const boxes = scanTopBoxes(new Uint8Array(buf));
  assert.deepEqual(boxes.map((b) => b.type), ["ftyp", "mdat", "moov"]);
  const moovBox = boxes[2];
  const r = findTrailingMoov(new Uint8Array(buf), buf.length);
  assert.equal(r.found, true);
  if (!r.found) return;
  assert.equal(r.candidate.start, moovBox.start);
  assert.equal(r.candidate.size, moovBox.size);
});

// ---- Fixture ffmpeg thật + tích hợp T3 ----
function makeFfmpegFixture(name: string, faststart: boolean): Buffer | null {
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
    const msg = (e as Error).message;
    if (msg.includes("ENOENT")) {
      console.log(`    skip ffmpeg: không có ffmpeg (${name})`);
      return null;
    }
    throw new Error(`ffmpeg tạo fixture ${name} thất bại: ${msg}`);
  }
  return readFileSync(out);
}
/** Chèn pad vào CUỐI payload mdat của file trailing (moov dịch theo
 *  pad, sample không dịch vì pad nằm sau mọi sample) để tiền tố nhỏ
 *  không tới được moov nhưng sample table vẫn đúng. */
function inflateTrailingMdat(orig: Buffer, pad: number): Buffer {
  const boxes = scanTopBoxes(new Uint8Array(orig));
  const ftyp = boxes.find((b) => b.type === "ftyp")!;
  const mdat = boxes.find((b) => b.type === "mdat")!;
  const moov = boxes.find((b) => b.type === "moov")!;
  assert.ok(mdat.start > ftyp.start && moov.start > mdat.start, "fixture phải có thứ tự ftyp, mdat, moov");
  const newMdatSize = mdat.size + pad;
  assert.ok(newMdatSize < 2 ** 31, "mdat mới phải vừa size 32-bit");
  const mdatHeader = Buffer.alloc(mdat.header);
  if (mdat.header === 16) {
    mdatHeader.writeUInt32BE(1, 0);
    mdatHeader.write("mdat", 4, "latin1");
    mdatHeader.writeBigUInt64BE(BigInt(newMdatSize), 8);
  } else {
    mdatHeader.writeUInt32BE(newMdatSize, 0);
    mdatHeader.write("mdat", 4, "latin1");
  }
  const parts: Buffer[] = [
    Buffer.from(orig.subarray(0, mdat.start)),
    mdatHeader,
    Buffer.from(orig.subarray(mdat.start + mdat.header, mdat.start + mdat.size)),
    Buffer.alloc(pad, 0),
    Buffer.from(orig.subarray(moov.start)),
  ];
  return Buffer.concat(parts);
}
interface ReqLog { method: string; range: string | null; status: number; }
async function serveRange(buf: Buffer): Promise<{ url: string; log: ReqLog[]; close: () => Promise<void> }> {
  const log: ReqLog[] = [];
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
function fakeServe(buf: Buffer, opts: { total?: number } = {}): { fetchImpl: GopRangeFetchFn; } {
  const total = opts.total ?? buf.length;
  const headers = (extra: Record<string, string>) => ({
    get: (name: string) => extra[name.toLowerCase()] ?? null,
  });
  const fetchImpl: GopRangeFetchFn = async (url, init) => {
    void url;
    if (init?.method === "HEAD") {
      return { status: 200, headers: headers({ "accept-ranges": "bytes", "content-length": String(total) }), arrayBuffer: async () => new ArrayBuffer(0), body: { cancel: async () => {} } } as unknown as GopRangeResponse;
    }
    const range = init?.headers?.Range ?? "";
    const m = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!m) throw new Error(`fake fetch nhận range lạ: ${range}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    if (start >= buf.length || end >= buf.length) {
      return { status: 416, headers: headers({ "content-range": `bytes */${total}` }), arrayBuffer: async () => new ArrayBuffer(0), body: { cancel: async () => {} } } as unknown as GopRangeResponse;
    }
    const slice = buf.subarray(start, end + 1);
    return { status: 206, headers: headers({ "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${total}` }), arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength), body: { cancel: async () => {} } } as unknown as GopRangeResponse;
  };
  return { fetchImpl };
}

ok("tích hợp: trailing thật (ffmpeg, không faststart) + pad mdat → T3 tail-scan ra gop-range, 6 GOP, chunk byte-khớp", async () => {
  const orig = makeFfmpegFixture("trailing.mp4", false);
  if (orig === null) return; // skip có log khi không có ffmpeg
  const boxes = scanTopBoxes(new Uint8Array(orig));
  // ffmpeg trailing có thể chèn box free sau ftyp (ftyp, free, mdat,
  // moov) — chỉ khóa thứ tự mdat trước moov, không khóa danh sách
  // box chính xác.
  assert.equal(boxes[boxes.length - 1].type, "moov");
  assert.ok(boxes.some((b) => b.type === "mdat"));
  assert.ok(boxes.find((b) => b.type === "mdat")!.start < boxes[boxes.length - 1].start);
  const inflated = inflateTrailingMdat(orig, 200_000);
  const srv = await serveRange(inflated);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: inflated.length,
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
        const si = gop.firstSampleIndex + k;
        const s = full.samples[si];
        const expected: Uint8Array = new Uint8Array(orig.subarray(s.offset, s.offset + s.size));
        const got = gop.chunks[k].data;
        assert.equal(got.length, expected.length, `sample ${si} dài khác`);
        assert.ok(got.every((v, i) => v === expected[i]), `sample ${si} byte khác`);
        checked++;
      }
    }
    assert.equal(checked, 60);
    const tailReqs = out.requests.filter((r) => r.kind === "tail");
    assert.equal(tailReqs.length, 1, `request tail: ${JSON.stringify(out.requests.map((r) => r.kind))}`);
    assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0, "moov lấy từ tail slice, không fetch moov riêng");
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 6);
    assert.ok(srv.log.filter((l) => l.method === "GET").every((l) => l.status === 206), "không GET toàn file");
    console.log(`    đo: file=${inflated.length} byte, requests=${out.requests.map((r) => `${r.kind}:${r.start}-${r.end}`).join(",")}`);
  } finally {
    await srv.close();
  }
});

ok("tích hợp: faststart thật → gop-range đường cũ, 0 request tail", async () => {
  const fast = makeFfmpegFixture("faststart.mp4", true);
  if (fast === null) return;
  const srv = await serveRange(fast);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "gop-range");
    if (out.mode !== "gop-range") return;
    assert.equal(out.requests.filter((r) => r.kind === "tail").length, 0);
  } finally {
    await srv.close();
  }
});

ok("tích hợp: trailing nhỏ (moov nằm gọn trong tiền tố) vẫn full-file moov-trailing, 0 tail — gate trailing giữ nguyên", async () => {
  const trail = makeFfmpegFixture("trailing-small.mp4", false);
  if (trail === null) return;
  const srv = await serveRange(trail);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /moov-trailing/);
    assert.equal(out.requests.filter((r) => r.kind === "tail").length, 0);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
  } finally {
    await srv.close();
  }
});

ok("tích hợp: mdat khổng lồ cắt dở, tail fetch 416 → full-file, lý do giữ moov-unknown + tail-scan, 0 moov/GOP", async () => {
  const prefix = Buffer.alloc(512 * 1024, 0);
  boxHeader(24, "ftyp").copy(prefix, 0);
  boxHeader(30_000_000, "mdat").copy(prefix, 24);
  const fake = fakeServe(prefix, { total: 40_000_000 });
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fake.fetchImpl,
    knownSizeBytes: 40_000_000,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.match(out.reason, /moov-unknown/);
  assert.match(out.reason, /tail-scan/);
  assert.equal(out.requests.filter((r) => r.kind === "tail").length, 1);
  assert.equal(out.requests.filter((r) => r.kind === "moov").length, 0);
  assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
});

ok("tích hợp: tail chứa box moov giả (payload rác) → full-file tail-scan-no-candidate, 0 GOP", async () => {
  // File phải đủ lớn để tiền tố 4096 cắt dở trong mdat (moovPosition
  // unknown → mới tới tail-scan); file nhỏ mà moov nằm gọn trong tiền
  // tố thì gate kết luận trailing trước, không phải đường tail-scan.
  const ftyp = Buffer.concat([boxHeader(24, "ftyp"), Buffer.alloc(16, 0)]);
  const fakeSize = 8 + 200;
  const fake = Buffer.concat([boxHeader(fakeSize, "moov"), Buffer.alloc(200, 0xff)]);
  const mdatPayload = Buffer.alloc(200_000, 0);
  const mdat = Buffer.concat([boxHeader(8 + mdatPayload.length, "mdat"), mdatPayload]);
  const file = Buffer.concat([ftyp, mdat, fake]);
  const fakeFetch = fakeServe(file);
  const out = await fetchVideoTrackByGopRange("http://127.0.0.1/x.mp4", {
    fetchImpl: fakeFetch.fetchImpl,
    knownSizeBytes: file.length,
    prefixBytes: 4096,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode !== "full-file") return;
  assert.match(out.reason, /tail-scan-no-candidate/);
  assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
});

ok("tích hợp: cửa sổ đuôi nhỏ hơn moov thật → full-file tail-scan-no-candidate (giới hạn cửa sổ, không đoán)", async () => {
  const orig = makeFfmpegFixture("trailing-window.mp4", false);
  if (orig === null) return;
  const inflated = inflateTrailingMdat(orig, 200_000);
  const srv = await serveRange(inflated);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: inflated.length,
      prefixBytes: 4096,
      tailScanBytes: 512, // nhỏ hơn moov thật (~1,5 KiB) → moov không nằm gọn trong đuôi
    });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /tail-scan-no-candidate/);
    assert.equal(out.requests.filter((r) => r.kind === "gop").length, 0);
  } finally {
    await srv.close();
  }
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
