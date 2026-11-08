// gopFakeMoov54K8.test.ts — Phase 9 đợt 54, luồng K8: siết moov giả ở tầng T3
// bằng kiểm tra BỐ CỤC sample + NHẤT QUÁN bảng sample (nợ J6 §7.1 —
// "moov giả trỏ đúng vào byte H.264 thật", và I6 §3.3).
//
// Lớp mới (đợt này, xem gopRangeFetch39T3.ts bước 5 + mp4Demux.ts):
//   (a) `validateSampleLayout`: offset sample phải tăng dần theo thứ tự
//       decode và các khoảng [offset, offset+size) không chồng lấn —
//       bất biến của file MP4 hợp lệ. Moov giả trỏ mọi sample về cùng
//       offset, đảo thứ tự chunk, hay khai offset ngẫu nhiên đều lộ.
//   (b) ctts khai tổng số sample phải bằng đúng stsz (demux ghi lại
//       `cttsTotal`, trước đây pad/cắt lặng lẽ).
//   (c) entry stss phải nằm trong [1, sampleCount] (demux đếm
//       `stssOutOfRange`).
// Cả 3 chỉ fallback về full-file (vẫn phát được), không ném lỗi.
//
// Chạy bằng esbuild bundle (mẫu I6/J6, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopFakeMoov54K8.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/k8.test.mjs \
//     && node <scratch>/k8.test.mjs
// Nếu ESM ném ERR_REQUIRE_CYCLE_MODULE thì bundle lại --format=cjs.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { fetchVideoTrackByGopRange } from "./gopRangeFetch39T3.ts";
import {
  parseMp4VideoTrack,
  validateSampleLayout,
} from "./mp4Demux.ts";
import type { Mp4Sample } from "./mp4Demux.ts";

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
  console.log(`gopFakeMoov54K8: ${pass}/${queue.length} test pass`);
}

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu bằng tay (rút gọn từ gopFakeMoov52I6.test.ts —
// cùng cấu trúc moov hợp lệ tối thiểu cho demux + tail-scan).
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
  stssKeys?: number[];
  ctts?: { version: number; entries: Array<[number, number]> };
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
  const keys = opts.stssKeys ??
    Array.from({ length: Math.ceil(N / 30) }, (_, i) => i * 30 + 1);
  const stblChildren: Buffer[] = [
    stsdBox(),
    sttsBox([[N, 1000]]),
    stssBox(keys),
    stscBox([[1, chunkSamples, 1]]),
    stszBox(sampleSize, N, Array.from({ length: N }, () => sampleSize)),
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
  const moov = box("moov", mvhdBox(timescale, N * 1000), trak);
  return { moov, sampleCount: N };
}

function ftypBox(): Buffer {
  return box("ftyp", Buffer.from("isom", "ascii"), u32(0x200), Buffer.from("isom", "ascii"), Buffer.from("iso2", "ascii"));
}

// Mẫu AVCC hợp lệ (lấy từ J6): 1 NAL = 4 byte length (6) + 6 byte NAL.
const AVCC_NAL = Buffer.from([0x00, 0x00, 0x00, 0x06, 0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9]);
function avccSampleBytes(sampleSize: number): Buffer {
  if (sampleSize % AVCC_NAL.length !== 0) throw new Error(`avccSampleBytes: sampleSize ${sampleSize} không chia hết cho ${AVCC_NAL.length}`);
  const out = Buffer.alloc(sampleSize);
  for (let off = 0; off < sampleSize; off += AVCC_NAL.length) AVCC_NAL.copy(out, off);
  return out;
}
function fillAvccSamples(payload: Buffer, mdatPayloadStart: number, offsets: number[], sampleSize: number): void {
  const one = avccSampleBytes(sampleSize);
  for (const off of offsets) {
    const rel = off - mdatPayloadStart;
    if (rel < 0 || rel + sampleSize > payload.length) throw new Error(`fillAvccSamples: offset ${off} ngoài payload mdat`);
    one.copy(payload, rel);
  }
}
/** Offset tuyệt đối của 60 sample mặc định (2 chunk × 30, size 1000). */
function defaultSampleOffsets(): number[] {
  const out: number[] = [];
  for (let i = 0; i < 30; i++) out.push(32 + i * 1000);
  for (let i = 0; i < 30; i++) out.push(30032 + i * 1000);
  return out;
}

// ---------------------------------------------------------------------------
// Server HTTP Range thật (công thức H4/I6, rút gọn).
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
// Helper: file trailing control (60 sample, AVCC thật) để tái dùng.
// ---------------------------------------------------------------------------
function buildControlFile(): { file: Buffer; moov: Buffer } {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  return { file, moov };
}

function sample(i: number, offset: number, size: number): Mp4Sample {
  return {
    index: i,
    offset,
    size,
    timestamp: i * 1000,
    duration: 1000,
    isKey: i % 30 === 0,
    presentationTimestamp: i * 1000,
  };
}

// ---------------------------------------------------------------------------
// Unit test validateSampleLayout (hàm thuần).
// ---------------------------------------------------------------------------
ok("layout: rỗng → ok", () => {
  assert.deepEqual(validateSampleLayout([]), { ok: true });
});
ok("layout: 1 sample → ok", () => {
  assert.deepEqual(validateSampleLayout([sample(0, 32, 1000)]), { ok: true });
});
ok("layout: liên tiếp khít nhau → ok", () => {
  const s = [sample(0, 32, 1000), sample(1, 1032, 1000), sample(2, 2032, 500)];
  assert.deepEqual(validateSampleLayout(s), { ok: true });
});
ok("layout: khoảng trống giữa sample (audio xen kẽ) → ok", () => {
  const s = [sample(0, 32, 1000), sample(1, 5000, 1000), sample(2, 9000, 1000)];
  assert.deepEqual(validateSampleLayout(s), { ok: true });
});
ok("layout: sample size 0 ở đúng cuối sample trước → ok", () => {
  const s = [sample(0, 32, 1000), sample(1, 1032, 0), sample(2, 1032, 1000)];
  assert.deepEqual(validateSampleLayout(s), { ok: true });
});
ok("layout: chồng lấn 1 byte → fail /chồng lấn/", () => {
  const s = [sample(0, 32, 1000), sample(1, 1031, 1000)];
  const r = validateSampleLayout(s);
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /chồng lấn/);
});
ok("layout: offset lùi (chunk đảo thứ tự) → fail /lùi/", () => {
  const s = [sample(0, 30032, 1000), sample(1, 32, 1000)];
  const r = validateSampleLayout(s);
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /lùi/);
});
ok("layout: offset âm → fail", () => {
  const r = validateSampleLayout([sample(0, -5, 1000)]);
  assert.equal(r.ok, false);
});
ok("layout: size âm → fail", () => {
  const r = validateSampleLayout([sample(0, 32, -1)]);
  assert.equal(r.ok, false);
});

// ---------------------------------------------------------------------------
// Demux ghi lại cttsTotal / stssOutOfRange (không ném).
// ---------------------------------------------------------------------------
ok("demux: control không ctts → cttsTotal null, stssOutOfRange 0", () => {
  const { file } = buildControlFile();
  const moovOnly = file.subarray(file.length - buildMoov({ sampleCount: 60 }).moov.length);
  const track = parseMp4VideoTrack(moovOnly.buffer.slice(moovOnly.byteOffset, moovOnly.byteOffset + moovOnly.byteLength) as ArrayBuffer);
  assert.equal(track.cttsTotal, null);
  assert.equal(track.stssOutOfRange, 0);
  assert.equal(track.samples.length, 60);
});
ok("demux: ctts khai 50/60 → cttsTotal 50 (không ném)", () => {
  const { moov } = buildMoov({ sampleCount: 60, ctts: { version: 0, entries: [[50, 0]] } });
  const track = parseMp4VideoTrack(moov.buffer.slice(moov.byteOffset, moov.byteOffset + moov.byteLength) as ArrayBuffer);
  assert.equal(track.cttsTotal, 50);
  assert.equal(track.samples.length, 60);
});
ok("demux: stss có 999 ngoài [1,60] → stssOutOfRange 1 (không ném)", () => {
  const { moov } = buildMoov({ sampleCount: 60, stssKeys: [1, 31, 999] });
  const track = parseMp4VideoTrack(moov.buffer.slice(moov.byteOffset, moov.byteOffset + moov.byteLength) as ArrayBuffer);
  assert.equal(track.stssOutOfRange, 1);
  assert.equal(track.samples.length, 60);
});

// ---------------------------------------------------------------------------
// T3 thật qua server Range: control qua, moov giả bị chặn cả 2 mode.
// ---------------------------------------------------------------------------
ok("control: file trailing tự dựng (60 sample) → gop-range cả stream + all", async () => {
  const { file, moov } = buildControlFile();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "gop-range", `stream: kỳ vọng gop-range, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "gop-range", `all: kỳ vọng gop-range, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
    if (all.mode === "gop-range") assert.equal(all.sampleCount, 60);
    console.log(`    đo: file=${file.length} byte, moov=${moov.length} byte`);
  } finally {
    await srv.close();
  }
});

ok("overlap: chunk 2 bắt đầu 29032 (chồng 1 sample lên chunk 1) → full-file, lý do chồng lấn", async () => {
  // Chunk 1: sample 0–29 ở 32..30032; chunk 2 bắt đầu 29032 → sample 30
  // [29032, 30032) chồng lên sample 29 [29032, 30032). Offset không lùi
  // (29032 == offset sample 29) nên chỉ lớp chồng lấn bắt được.
  const { moov } = buildMoov({ sampleCount: 60, chunkOffsets: [32, 29032] });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback, không được trả meta của moov giả");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /chồng lấn/);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /chồng lấn/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("out-of-order: chunkOffsets [30032, 32] (chunk đảo thứ tự) → full-file, lý do lùi", async () => {
  const { moov } = buildMoov({ sampleCount: 60, chunkOffsets: [30032, 32] });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback, không được trả meta của moov giả");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /lùi/);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /lùi/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("same-offset: mọi chunk trỏ về offset 32 → full-file, lý do lùi", async () => {
  const { moov } = buildMoov({ sampleCount: 60, chunkOffsets: [32, 32] });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback, không được trả meta của moov giả");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /lùi/);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /lùi/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("ctts-lệch: ctts khai 50 sample nhưng stsz có 60 → full-file, lý do ctts", async () => {
  const { moov } = buildMoov({ sampleCount: 60, ctts: { version: 0, entries: [[50, 0]] } });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback, không được trả meta của moov giả");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /ctts/);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /ctts/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("stss-lệch: stss có keyframe 999 ngoài [1,60] → full-file, lý do stss", async () => {
  const { moov } = buildMoov({ sampleCount: 60, stssKeys: [1, 31, 999] });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback, không được trả meta của moov giả");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /stss/);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /stss/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

await runAll();
