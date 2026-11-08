// gopFakeMoov52I6.test.ts — Phase 9 đợt 52, luồng I6: tail-scan fail-closed
// với file MP4 chế tác (đóng nợ H4 §5.3 — rủi ro moov giả lọt tail-scan).
//
// Lỗ hổng đo được TRƯỚC khi sửa (probe ở scratch, xem LIMITS I6 §2):
//   - Demux không chặn số sample khai khống: moov chế tác với stts /
//     stsz / ctts count = 0xFFFFFFFF ép parseMp4VideoTrack push hàng
//     tỉ số vào mảng → OOM (chết tiến trình ở heap cap 256 MiB sau
//     ~10 s, cả 3 biến thể). Guard mới: MAX_MP4_SAMPLES = 1.000.000
//     trong mp4Demux.ts (ném ngay trước vòng push).
//   - Moov GIẢ lồng trong moov THẬT (moov thật bắt đầu TRƯỚC cửa sổ
//     tail-scan đã xác nhận 4 MiB) được stream-mode chấp nhận: T3 trả
//     gop-range với sample table trỏ NGOÀI file (range 100.000.000
//     trong file 5.061.286 byte). Guard mới: T3 kiểm tra mọi sample
//     offset+size nằm trong tổng file đã biết, sau demux (xem
//     gopRangeFetch39T3.ts, marker ROUND52-I6).
//
// File chế tác được DỰNG BẰNG CODE trong file test này (builder tối
// thiểu dưới đây, KHÔNG binary trong repo, KHÔNG ffmpeg): moov hợp
// lệ tối thiểu cho demux (mvhd + trak avc1 + stbl đủ bảng). File
// trailing nhỏ vẫn fallback ở gate (moov nằm gọn trong tiền tố —
// hành vi có chủ ý của B4), nên mọi file T3-level ở đây đều có mdat
// ≥ 600 KiB để moov nằm NGOÀI tiền tố 512 KiB và thật sự đi qua
// nhánh tail-scan.
//
// Chạy bằng esbuild bundle (mẫu H4, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopFakeMoov52I6.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/i6.test.mjs \
//     && node <scratch>/i6.test.mjs
// Nếu ESM ném ERR_REQUIRE_CYCLE_MODULE thì bundle lại --format=cjs
// (xem ROUND51_LIMITS §3 — lỗi cách chạy, không phải code).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  fetchVideoTrackByGopRange,
  mdatRangesInPrefix,
} from "./gopRangeFetch39T3.ts";
import { findTrailingMoov } from "./gopTail45A4.ts";
import { parseMp4VideoTrack, MAX_MP4_SAMPLES, validateAvccSample } from "./mp4Demux.ts";

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
  console.log(`gopFakeMoov52I6: ${pass}/${queue.length} test pass`);
}

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu bằng tay (chỉ đủ cho demux + tail-scan).
// ---------------------------------------------------------------------------
function box(type: string, ...payloads: Array<Buffer | Uint8Array>): Buffer {
  const body = Buffer.concat(payloads.map((p) => Buffer.from(p)));
  const out = Buffer.alloc(8 + body.length);
  out.writeUInt32BE(8 + body.length, 0);
  out.write(type, 4, 4, "ascii");
  body.copy(out, 8);
  return out;
}
const u32 = (n: number): Buffer => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
};
const u16 = (n: number): Buffer => {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(n & 0xffff, 0);
  return b;
};
const u64 = (n: number): Buffer => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64BE(BigInt(n), 0);
  return b;
};
const zeros = (n: number): Buffer => Buffer.alloc(n, 0);
const UNITY_MATRIX = Buffer.concat([
  u32(0x00010000), u32(0), u32(0), u32(0), u32(0x00010000), u32(0),
  u32(0), u32(0), u32(0x40000000),
]);

function mvhdBox(timescale = 1000, duration = 10000): Buffer {
  return box("mvhd",
    u32(0), u32(0), u32(0), u32(timescale), u32(duration),
    u32(0x00010000), u16(0x0100), u16(0), zeros(8), UNITY_MATRIX, zeros(24), u32(2));
}
function tkhdBox(duration = 10000, width = 1280, height = 720): Buffer {
  return box("tkhd",
    u32(0x00000007), u32(0), u32(0), u32(1), u32(0), u32(duration),
    zeros(8), u16(0), u16(0), u16(0), u16(0), UNITY_MATRIX,
    u32(width << 16), u32(height << 16));
}
function mdhdBox(timescale = 1000, duration = 10000): Buffer {
  return box("mdhd", u32(0), u32(0), u32(0), u32(timescale), u32(duration), u16(0x55c4), u16(0));
}
function avcCBox(): Buffer {
  // SPS/PPS giả nhưng đúng hình dạng avcC (demux chỉ đọc 4 byte đầu).
  return box("avcC", Buffer.from([
    0x01, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0x00, 0x08,
    0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9, 0x40, 0x78, 0x01, 0x00, 0x04,
    0x68, 0xeb, 0xe3, 0xcb, 0x22,
  ]));
}
function avc1Entry(width = 1280, height = 720): Buffer {
  const fixed = Buffer.concat([
    zeros(6), u16(1), u16(0), u16(0), zeros(12),
    u16(width), u16(height), u32(0x00480000), u32(0x00480000), u32(0),
    u16(1), zeros(32), u16(0x0018), u16(0xffff),
  ]);
  const body = Buffer.concat([fixed, avcCBox()]);
  const out = Buffer.alloc(8 + body.length);
  out.writeUInt32BE(8 + body.length, 0);
  out.write("avc1", 4, 4, "ascii");
  body.copy(out, 8);
  return out;
}
function stsdBox(): Buffer {
  return box("stsd", u32(0), u32(1), avc1Entry());
}
function sttsBox(entries: Array<[number, number]>): Buffer {
  const parts: Buffer[] = [u32(0), u32(entries.length)];
  for (const [c, d] of entries) parts.push(u32(c), u32(d));
  return box("stts", ...parts);
}
function stssBox(keys: number[]): Buffer {
  const parts: Buffer[] = [u32(0), u32(keys.length)];
  for (const k of keys) parts.push(u32(k));
  return box("stss", ...parts);
}
function stscBox(entries: Array<[number, number, number]>): Buffer {
  const parts: Buffer[] = [u32(0), u32(entries.length)];
  for (const [fc, spc, sdi] of entries) parts.push(u32(fc), u32(spc), u32(sdi));
  return box("stsc", ...parts);
}
function stszBox(sampleSize: number, sampleCount: number, sizes: number[]): Buffer {
  const parts: Buffer[] = [u32(0), u32(sampleSize), u32(sampleCount)];
  if (sampleSize === 0) for (const s of sizes) parts.push(u32(s));
  return box("stsz", ...parts);
}
function stcoBox(offsets: number[]): Buffer {
  const parts: Buffer[] = [u32(0), u32(offsets.length)];
  for (const o of offsets) parts.push(u32(o));
  return box("stco", ...parts);
}
function cttsBox(version: number, entries: Array<[number, number]>): Buffer {
  const parts: Buffer[] = [u32(version << 24), u32(entries.length)];
  for (const [c, o] of entries) {
    parts.push(u32(c));
    if (version === 1) {
      const b = Buffer.alloc(4);
      b.writeInt32BE(o, 0);
      parts.push(b);
    } else {
      parts.push(u32(o));
    }
  }
  return box("ctts", ...parts);
}

interface MoovOpts {
  sampleCount?: number;
  sampleSize?: number;
  timescale?: number;
  chunkSamples?: number;
  chunkOffsets?: number[];
  sttsEntries?: Array<[number, number]>;
  stszSampleCount?: number;
  ctts?: { version: number; entries: Array<[number, number]> };
  extraChildren?: Buffer[];
}
/** Dựng moov hợp lệ tối thiểu (avc1, N sample) cho demux. */
function buildMoov(opts: MoovOpts = {}): { moov: Buffer; sampleCount: number } {
  const N = opts.sampleCount ?? 60;
  const sampleSize = opts.sampleSize ?? 1000;
  const timescale = opts.timescale ?? 1000;
  const chunkSamples = opts.chunkSamples ?? 30;
  const chunks = Math.max(1, Math.ceil(N / chunkSamples));
  const chunkOffsets = opts.chunkOffsets ??
    Array.from({ length: chunks }, (_, i) => 32 + i * chunkSamples * sampleSize);
  const keys = Array.from({ length: Math.ceil(N / 30) }, (_, i) => i * 30 + 1);
  const stblChildren: Buffer[] = [
    stsdBox(),
    opts.sttsEntries ? sttsBox(opts.sttsEntries) : sttsBox([[N, 1000]]),
    stssBox(keys),
    stscBox([[1, chunkSamples, 1]]),
    stszBox(sampleSize, opts.stszSampleCount ?? N, Array.from({ length: N }, () => sampleSize)),
  ];
  if (opts.ctts) stblChildren.push(cttsBox(opts.ctts.version, opts.ctts.entries));
  stblChildren.push(stcoBox(chunkOffsets));
  const stbl = box("stbl", ...stblChildren);
  const minf = box("minf",
    box("vmhd", u32(1), zeros(6)),
    box("dinf", box("dref", u32(0), u32(1), box("url ", u32(1)))),
    stbl);
  const mdia = box("mdia", mdhdBox(timescale, N * 1000),
    box("hdlr", u32(0), u32(0), Buffer.from("vide", "ascii"), zeros(12), Buffer.from("VideoHandler\0", "ascii")),
    minf);
  const trak = box("trak", tkhdBox(N * 1000), mdia);
  const moov = box("moov", mvhdBox(timescale, N * 1000), trak, ...(opts.extraChildren ?? []));
  return { moov, sampleCount: N };
}

function ftypBox(): Buffer {
  return box("ftyp", Buffer.from("isom", "ascii"), u32(0x200), Buffer.from("isom", "ascii"), Buffer.from("iso2", "ascii"));
}
/** File trailing: ftyp + mdat (payload zeros) + moov ở cuối. */
function buildTrailingFile(moovBuf: Buffer, mdatPayloadBytes: number): Buffer {
  return Buffer.concat([ftypBox(), box("mdat", zeros(mdatPayloadBytes)), moovBuf]);
}

// ---------------------------------------------------------------------------
// Đợt 53 J6 — mẫu AVCC hợp lệ để ghi vào mdat tại vị trí sample thật.
// Một NAL = 4 byte length (6) + 6 byte NAL (0x67 SPS) = 10 byte;
// sampleSize phải chia hết cho 10 (1000 → đúng 100 NAL, tiêu thụ khít).
// Moov giả trỏ LỆCH khỏi đầu NAL sẽ đọc length rác (vd offset 1000
// rơi vào giữa NAL: length 0xACD90000) nên bị chặn ở tầng AVCC.
// ---------------------------------------------------------------------------
const AVCC_NAL = Buffer.from([0x00, 0x00, 0x00, 0x06, 0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9]);
function avccSampleBytes(sampleSize: number): Buffer {
  if (sampleSize % AVCC_NAL.length !== 0) throw new Error(`avccSampleBytes: sampleSize ${sampleSize} không chia hết cho ${AVCC_NAL.length}`);
  const out = Buffer.alloc(sampleSize);
  for (let off = 0; off < sampleSize; off += AVCC_NAL.length) AVCC_NAL.copy(out, off);
  return out;
}
/** Ghi mẫu AVCC vào payload mdat tại các offset sample TUYỆT ĐỐI trong file. */
function fillAvccSamples(payload: Buffer, mdatPayloadStart: number, offsets: number[], sampleSize: number): void {
  const one = avccSampleBytes(sampleSize);
  for (const off of offsets) {
    const rel = off - mdatPayloadStart;
    if (rel < 0 || rel + sampleSize > payload.length) throw new Error(`fillAvccSamples: offset ${off} ngoài payload mdat`);
    one.copy(payload, rel);
  }
}
/** Offset tuyệt đối của 60 sample mặc định của buildMoov (2 chunk × 30). */
function defaultSampleOffsets(): number[] {
  const out: number[] = [];
  for (let i = 0; i < 30; i++) out.push(32 + i * 1000);
  for (let i = 0; i < 30; i++) out.push(30032 + i * 1000);
  return out;
}

// ---------------------------------------------------------------------------
// Server HTTP Range thật (công thức H4, rút gọn).
// ---------------------------------------------------------------------------
async function serve(buf: Buffer): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end();
      return;
    }
    const range = req.headers.range ?? null;
    if (range === null) {
      res.setHeader("Content-Length", buf.length);
      res.writeHead(200);
      res.end(buf);
      return;
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m) {
      res.writeHead(400);
      res.end();
      return;
    }
    const start = Number(m[1]);
    const end = m[2] === "" ? buf.length - 1 : Math.min(Number(m[2]), buf.length - 1);
    if (start >= buf.length || start > end) {
      res.setHeader("Content-Range", `bytes */${buf.length}`);
      res.writeHead(416);
      res.end();
      return;
    }
    res.setHeader("Content-Range", `bytes ${start}-${end}/${buf.length}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206);
    res.end(buf.subarray(start, end + 1));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (typeof addr !== "object" || addr === null) throw new Error("server không bind được port");
  return {
    url: `http://127.0.0.1:${addr.port}/file.mp4`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

// ---------------------------------------------------------------------------
// Control + moov giả lồng nhau (H4 §5.3) qua T3 thật.
// ---------------------------------------------------------------------------
ok("control: file trailing tự dựng (60 sample) → gop-range, 2 GOP", async () => {
  // mdat 600 KiB để moov nằm NGOÀI tiền tố 512 KiB (đi nhánh tail-scan thật).
  // Đợt 53 J6: ghi AVCC thật vào mdat tại vị trí sample thật — T3 nay kiểm
  // tra cấu trúc AVCC của sample đầu, mdat toàn zeros sẽ bị chặn oan.
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "gop-range", `kỳ vọng gop-range, nhận ${out.mode === "full-file" ? out.reason : out.mode}`);
    if (out.mode !== "gop-range") return;
    assert.equal(out.sampleCount, 60);
    assert.equal(out.gopMeta.length, 2); // keyframe ở sample 1 và 31
    // File 600.659 byte < chunk đầu 2 MiB → 1 request tail = cả file
    // (chunking chỉ chạy khi file > chunk đầu — đã khóa ở test H4).
    assert.equal(out.requests.filter((r) => r.kind === "tail").length, 1);
    assert.equal(out.requests.filter((r) => r.kind === "tail")[0].bytes, file.length);
    console.log(`    đo: file=${file.length} byte, moov=${moov.length} byte, tail=${out.requests.filter((r) => r.kind === "tail").map((r) => r.bytes).join("+")} byte`);
  } finally {
    await srv.close();
  }
});

ok("nested-fake OOB: moov giả trong moov thật, moov thật ngoài cửa sổ xác nhận → full-file, lý do vượt ngoài file", async () => {
  // Moov GIẢ: 10 sample, stco trỏ NGOÀI file (100.000.000).
  const fake = buildMoov({ sampleCount: 10, sampleSize: 1000, chunkSamples: 10, chunkOffsets: [100_000_000] });
  // Moov THẬT: 60 sample + free pad 5 MiB + fake làm con CUỐI (kết thúc đúng EOF).
  // Moov thật bắt đầu ~4,77 MiB trước EOF → ngoài cửa sổ xác nhận 4 MiB.
  const real = buildMoov({ sampleCount: 60, extraChildren: [box("free", zeros(5_000_000)), fake.moov] });
  const file = buildTrailingFile(real.moov, 60_000);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback, không được trả meta của moov giả");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /vượt ngoài file/);
    assert.match(stream.reason, /100000000/);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /vượt ngoài file/);
    console.log(`    đo: file=${file.length} byte, moov thật=${real.moov.length} byte, lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("nested-fake VISIBLE: moov thật nằm trong cửa sổ xác nhận → chọn moov thật (60 sample)", async () => {
  // Cùng cấu trúc lồng nhau nhưng free pad chỉ 1 MiB → moov thật bắt đầu
  // ~1 MiB trước EOF, nằm trong chunk đầu 2 MiB → findTrailingMoov chọn
  // start nhỏ nhất (moov thật), không lấy moov giả.
  const fake = buildMoov({ sampleCount: 10, sampleSize: 1000, chunkSamples: 10, chunkOffsets: [100_000_000] });
  const real = buildMoov({ sampleCount: 60, extraChildren: [box("free", zeros(1_000_000)), fake.moov] });
  const payload = zeros(60_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), real.moov]);
  const srv = await serve(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "gop-range", `kỳ vọng gop-range với moov thật, nhận ${out.mode === "full-file" ? out.reason : out.mode}`);
    if (out.mode !== "gop-range") return;
    assert.equal(out.sampleCount, 60);
    assert.equal(out.gopMeta[0].rangeStart, 32); // sample thật trỏ vào mdat
  } finally {
    await srv.close();
  }
});

ok("fake-only OOB: moov duy nhất trỏ ngoài file → full-file, lý do vượt ngoài file", async () => {
  const fake = buildMoov({ sampleCount: 10, sampleSize: 1000, chunkSamples: 10, chunkOffsets: [100_000_000] });
  const file = buildTrailingFile(fake.moov, 600_000);
  const srv = await serve(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /vượt ngoài file/);
  } finally {
    await srv.close();
  }
});

ok("RESIDUAL-FIXED-53J6: moov giả tự nhất quán trỏ VÀO TRONG file (offset 1000 trong mdat) → full-file, lý do AVCC", async () => {
  // Đợt 52 I6 §2.4 khóa hành vi này là "vẫn gop-range" (RESIDUAL-KNOWN);
  // đợt 53 J6 CHẶN được: sample giả trỏ lệch khỏi đầu NAL của sample thật
  // (offset 1000 rơi vào giữa NAL ở byte 968 của sample 0 → length đọc
  // được 0xACD90000, vượt sample) nên tầng kiểm AVCC chặn. Kiểm trực
  // tiếp: byte tại 1000 không parse được AVCC (khóa lý do, không phụ
  // thuộc may rủi alignment của pattern fill).
  const fake = buildMoov({ sampleCount: 10, sampleSize: 1000, chunkSamples: 10, chunkOffsets: [1000] });
  const real = buildMoov({ sampleCount: 60, extraChildren: [box("free", zeros(5_000_000)), fake.moov] });
  const payload = zeros(60_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), real.moov]);
  const firstFakeSample = new Uint8Array(file.subarray(1000, 2000));
  const direct = validateAvccSample(firstFakeSample, 1000);
  assert.equal(direct.ok, false, "byte tại offset giả 1000 phải không parse được AVCC");
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback, không được trả meta của moov giả trỏ vào trong file");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /AVCC/);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /AVCC/);
    console.log(`    đo: file=${file.length} byte, lý do stream=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("mdat: moov giả trỏ vào trong moov thật (ngoài mdat) → full-file, lý do ngoài mdat", async () => {
  // Moov giả duy nhất, sample trỏ vào vùng moov (bắt đầu ở 600032 trong
  // file này): vẫn trong file nên tầng I6 (vượt ngoài file) không chặn,
  // tầng J6 stco-khớp-mdat chặn. sampleSize nhỏ (4 byte × 10) để mọi
  // sample nằm gọn trong moov mà vẫn trong file.
  const moovStart = 24 + 8 + 600_000;
  const fake = buildMoov({ sampleCount: 10, sampleSize: 4, chunkSamples: 10, chunkOffsets: [moovStart + 100] });
  const file = buildTrailingFile(fake.moov, 600_000);
  assert.ok(file.length > moovStart + 200, `file ${file.length} phải chứa trọn sample giả (moov bắt đầu ${moovStart})`);
  const srv = await serve(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /ngoài mdat/);
    console.log(`    đo: file=${file.length} byte, moov bắt đầu ${moovStart}, lý do=${out.reason}`);
  } finally {
    await srv.close();
  }
});

ok("mdat: moov giả trỏ vào ftyp (offset 0) → full-file, lý do ngoài mdat", async () => {
  const fake = buildMoov({ sampleCount: 10, sampleSize: 4, chunkSamples: 10, chunkOffsets: [0] });
  const file = buildTrailingFile(fake.moov, 600_000);
  const srv = await serve(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /ngoài mdat/);
  } finally {
    await srv.close();
  }
});

// ---------------------------------------------------------------------------
// Unit: validateAvccSample + mdatRangesInPrefix (đợt 53 J6).
// ---------------------------------------------------------------------------
ok("unit avcc: mẫu AVCC hợp lệ → ok; zeros → không ok", () => {
  assert.equal(validateAvccSample(avccSampleBytes(1000), 1000).ok, true);
  assert.equal(validateAvccSample(new Uint8Array(1000), 1000).ok, false);
  assert.equal(validateAvccSample(new Uint8Array(0), 0).ok, false);
  assert.equal(validateAvccSample(new Uint8Array([0, 0, 0, 6, 0x67, 0x64, 0, 0x1f, 0xac, 0xd9]), 10).ok, true);
});

ok("unit avcc: length vượt sample còn lại / thừa byte cuối → không ok", () => {
  // length 100 trong sample 10 byte.
  assert.equal(validateAvccSample(new Uint8Array([0, 0, 0, 100, 0x67, 0x64, 0, 0x1f, 0xac, 0xd9]), 10).ok, false);
  // 1 NAL đúng (10 byte) + 2 byte rác cuối không đủ header NAL.
  const trailing = Buffer.concat([avccSampleBytes(10), Buffer.from([0x00, 0x00])]);
  assert.equal(validateAvccSample(new Uint8Array(trailing), 12).ok, false);
  // forbidden_zero_bit = 1 ở byte đầu NAL.
  assert.equal(validateAvccSample(new Uint8Array([0, 0, 0, 6, 0xe7, 0x64, 0, 0x1f, 0xac, 0xd9]), 10).ok, false);
});

ok("unit avcc: tiền tố của sample lớn (fetch bị cap) → ok khi các NAL đã đọc đều hợp lệ", () => {
  // Chỉ fetch 20 byte đầu của sample 1000 byte: 2 NAL trọn vẹn.
  const prefix = avccSampleBytes(1000).subarray(0, 20);
  assert.equal(validateAvccSample(new Uint8Array(prefix), 1000).ok, true);
  // NAL thứ 2 bị cắt bởi cap (chỉ còn 3/6 byte NAL trong dữ liệu đã
  // fetch): không phải lỗi file — chấp nhận vì NAL đầu đã hợp lệ.
  const cut = avccSampleBytes(1000).subarray(0, 17);
  assert.equal(validateAvccSample(new Uint8Array(cut), 1000).ok, true);
  // NAL đầu tiên đã dài hơn cửa sổ fetch (len 100, chỉ fetch 8 byte):
  // 0 NAL trọn vẹn nhưng cũng không có bằng chứng sai — fail-open.
  const huge1 = new Uint8Array([0, 0, 0, 100, 0x67, 0x64, 0, 0x1f]);
  assert.equal(validateAvccSample(huge1, 1000).ok, true);
  // Ngược lại: NAL khai dài hơn CẢ sample (len 2000 > 1000) thì sai thật
  // dù có bị cap — không fail-open.
  const over = new Uint8Array([0, 0, 7, 0xd0, 0x67, 0x64, 0, 0x1f]);
  assert.equal(validateAvccSample(over, 1000).ok, false);
});

ok("unit mdat-ranges: trailing (mdat tràn tiền tố) → 1 vùng [24, 600032)", () => {
  const prefix = Buffer.concat([ftypBox(), box("mdat", zeros(600_000))]).subarray(0, 4096);
  const ranges = mdatRangesInPrefix(new Uint8Array(prefix), 600_651);
  assert.deepEqual(ranges, [{ start: 24, end: 600032 }]);
});

ok("unit mdat-ranges: faststart (ftyp, moov, free, mdat) → vùng mdat sau moov; không mdat → []", () => {
  const { moov } = buildMoov({ sampleCount: 10 });
  const prefix = Buffer.concat([ftypBox(), moov, box("free", zeros(100)), box("mdat", zeros(5000))]);
  const ranges = mdatRangesInPrefix(new Uint8Array(prefix), prefix.length);
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].start, 24 + moov.length + 108);
  assert.equal(ranges[0].end, ranges[0].start + 8 + 5000);
  assert.deepEqual(mdatRangesInPrefix(new Uint8Array(ftypBox()), 24), []);
});

ok("unit mdat-ranges: mdat largesize → vùng theo u64", () => {
  const header = Buffer.alloc(16);
  header.writeUInt32BE(1, 0);
  header.write("mdat", 4, 4, "ascii");
  header.writeBigUInt64BE(BigInt(1_000_008), 8);
  const prefix = Buffer.concat([ftypBox(), header, zeros(100)]);
  const ranges = mdatRangesInPrefix(new Uint8Array(prefix), 1_000_032);
  assert.deepEqual(ranges, [{ start: 24, end: 1000032 }]);
});

// ---------------------------------------------------------------------------
// Bom allocation trong demux (moov chế tác khai số sample khổng lồ).
// ---------------------------------------------------------------------------
ok("bomb stsz: sampleCount=0xFFFFFFFF (cỡ cố định) → full-file, lý do vượt giới hạn, KHÔNG OOM", async () => {
  const { moov } = buildMoov({ sampleCount: 10, stszSampleCount: 0xffffffff });
  const file = buildTrailingFile(moov, 600_000);
  const srv = await serve(file);
  try {
    const t0 = Date.now();
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    const ms = Date.now() - t0;
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /vượt giới hạn/);
    assert.match(out.reason, /stsz/);
    assert.ok(ms < 5000, `phải fail nhanh, thực tế ${ms} ms (trước fix: OOM sau ~10 s)`);
    console.log(`    đo: fail sau ${ms} ms, heap test process ${(process.memoryUsage().heapUsed / 1048576).toFixed(1)} MiB`);
  } finally {
    await srv.close();
  }
});

ok("bomb stts: 1 entry count=0xFFFFFFFF → full-file, lý do vượt giới hạn, KHÔNG OOM", async () => {
  const { moov } = buildMoov({ sampleCount: 10, sttsEntries: [[0xffffffff, 1000]] });
  const file = buildTrailingFile(moov, 600_000);
  const srv = await serve(file);
  try {
    const t0 = Date.now();
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    const ms = Date.now() - t0;
    assert.equal(out.mode, "full-file");
    if (out.mode !== "full-file") return;
    assert.match(out.reason, /vượt giới hạn/);
    assert.match(out.reason, /stts/);
    assert.ok(ms < 5000, `phải fail nhanh, thực tế ${ms} ms (trước fix: OOM sau ~10 s)`);
    console.log(`    đo: fail sau ${ms} ms, heap test process ${(process.memoryUsage().heapUsed / 1048576).toFixed(1)} MiB`);
  } finally {
    await srv.close();
  }
});

ok("bomb ctts: 1 entry count=0xFFFFFFFF → demux vẫn trả 10 sample, KHÔNG OOM", () => {
  // ctts khai khống nhưng sampleCount thật chỉ 10: guard dừng push khi đủ
  // sampleCount nên demux parse bình thường (moov này vẫn là moov hợp lệ
  // về mặt bảng sample — ctts thừa bị cắt bớt như file hợp lệ).
  const { moov } = buildMoov({ sampleCount: 10, ctts: { version: 0, entries: [[0xffffffff, 0]] } });
  const t0 = Date.now();
  const track = parseMp4VideoTrack(moov.buffer.slice(moov.byteOffset, moov.byteOffset + moov.byteLength));
  const ms = Date.now() - t0;
  assert.equal(track.samples.length, 10);
  assert.ok(ms < 5000, `phải parse nhanh, thực tế ${ms} ms (trước fix: OOM sau ~10 s)`);
  assert.equal(MAX_MP4_SAMPLES, 1_000_000);
  console.log(`    đo: parse sau ${ms} ms, heap ${(process.memoryUsage().heapUsed / 1048576).toFixed(1)} MiB`);
});

// ---------------------------------------------------------------------------
// findTrailingMoov trực tiếp: header moov sai lệch / cây box con hỏng.
// ---------------------------------------------------------------------------
ok("tail: moov size khai vượt EOF → không thấy", () => {
  const { moov } = buildMoov({ sampleCount: 10 });
  const bad = Buffer.from(moov);
  bad.writeUInt32BE(100_000, 0); // size 100.000 trong khi cả tail chỉ 619 byte
  const r = findTrailingMoov(new Uint8Array(bad), bad.length, {});
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-no-candidate");
});

ok("tail: moov size < header (4 byte) → không thấy", () => {
  const { moov } = buildMoov({ sampleCount: 10 });
  const bad = Buffer.from(moov);
  bad.writeUInt32BE(4, 0);
  const r = findTrailingMoov(new Uint8Array(bad), bad.length, {});
  assert.equal(r.found, false);
});

ok("tail: moov size == 0 → không thấy", () => {
  const { moov } = buildMoov({ sampleCount: 10 });
  const bad = Buffer.from(moov);
  bad.writeUInt32BE(0, 0);
  const r = findTrailingMoov(new Uint8Array(bad), bad.length, {});
  assert.equal(r.found, false);
});

ok("tail: moov largesize vượt EOF → không thấy", () => {
  // header largesize: size=1 + u64 100.000, tail chỉ 116 byte.
  const tail = Buffer.concat([u32(1), Buffer.from("moov", "ascii"), u64(100_000), zeros(100)]);
  const r = findTrailingMoov(new Uint8Array(tail), tail.length, {});
  assert.equal(r.found, false);
});

ok("tail: moov size vượt trần (maxMoovBytes nhỏ) → lý do moov-too-large", () => {
  const { moov } = buildMoov({ sampleCount: 10, extraChildren: [box("free", zeros(1400))] });
  assert.ok(moov.length > 1024);
  const r = findTrailingMoov(new Uint8Array(moov), moov.length, { maxMoovBytes: 1024 });
  assert.equal(r.found, false);
  if (!r.found) assert.equal(r.reason, "tail-scan-moov-too-large");
});

ok("tail: moov children không tile (thừa 1 byte cuối) → không thấy", () => {
  const { moov } = buildMoov({ sampleCount: 10 });
  // Tăng size moov thêm 1 và thêm 1 byte rác cuối: box con cuối không đủ header.
  const bad = Buffer.concat([Buffer.from(moov), Buffer.from([0xff])]);
  bad.writeUInt32BE(moov.length + 1, 0);
  const r = findTrailingMoov(new Uint8Array(bad), bad.length, {});
  assert.equal(r.found, false);
});

ok("tail: moov thiếu trak → không thấy", () => {
  const r = findTrailingMoov(new Uint8Array(box("moov", mvhdBox())), box("moov", mvhdBox()).length, {});
  assert.equal(r.found, false);
});

ok("tail: moov thiếu mvhd → không thấy", () => {
  const { moov } = buildMoov({ sampleCount: 10 });
  // moov = [header 8][mvhd 108][trak ...] → tách trak làm con duy nhất.
  const trak = moov.subarray(8 + 108);
  const onlyTrak = box("moov", trak);
  const r = findTrailingMoov(new Uint8Array(onlyTrak), onlyTrak.length, {});
  assert.equal(r.found, false);
});

ok("tail: moov + hậu tố rác (không phải free/skip/wide/udta) → không thấy", () => {
  const { moov } = buildMoov({ sampleCount: 10 });
  const tail = Buffer.concat([moov, Buffer.from("XXXXXXXX")]); // 8 byte 'X': size rác, không parse thành box hậu tố
  const r = findTrailingMoov(new Uint8Array(tail), tail.length, {});
  assert.equal(r.found, false);
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
