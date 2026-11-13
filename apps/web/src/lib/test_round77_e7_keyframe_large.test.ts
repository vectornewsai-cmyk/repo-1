// test_round77_e7_keyframe_large.test.ts — Phase 9 đợt 77, luồng E7:
// Keyframe lớn — trial-decode sample > 8 MiB + keyframe zero-giữa.
//
// NỢ ĐÓNG (gap analysis O6 §6.6, đã cũ một phần — xem LIMITS E7 §0):
//   (a) "sample > 8 MiB stream-mode vẫn bỏ qua" — ĐÃ ĐÓNG từ trước bởi
//       đợt 59 P6 (cap 8 → 32 MiB) và đợt 60 Q5 (32 → 64 MiB); đợt này
//       chỉ đo lại/khóa lại: cap nay là 64 MiB, sample > 64 MiB vẫn bỏ
//       qua (fail-open) như thiết kế.
//   (b) keyframe thật bị zero 1 MiB giữa vẫn decode OK (trial-decode
//       không bắt) — ĐÓNG BẰNG ĐỢT NÀY: quét zero-run AVCC
//       (`scanAvccZeroRun`, gopTrialDecode55L8.ts) chạy trước
//       trial-decode ở đường main-thread (T3) và trong worker (đường
//       worker), bắt đúng lớp này nhờ luật emulation prevention của
//       H.264 (chạy 0 ≥ 3 byte trong payload NAL là bitstream hỏng
//       chắc chắn).
//   (c) keyframe ≳ 16 MiB timeout trần 2500 ms → fail-open ở đường
//       main-thread — ĐÃ BIẾT từ P6 (không đổi); đường worker (trần
//       90 s, đợt 67 U5) cho verdict thật — đo lại headed ở LIMITS E7.
//
// Chạy bằng esbuild bundle (mẫu P6/Q5, chạy từ gốc repo; file có
// top-level await nên phải bundle --format=esm + outfile .mjs):
//   ./node_modules/.bin/esbuild apps/web/src/lib/test_round77_e7_keyframe_large.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/e7.test.mjs \
//     && node <scratch>/e7.test.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  MAX_FIRST_SAMPLE_PROBE_BYTES,
  MAX_TRIAL_DECODE_SAMPLE_BYTES,
  fetchVideoTrackByGopRange,
} from "./gopRangeFetch39T3.ts";
import {
  AVCC_ZERO_RUN_TRAILING_THRESHOLD,
  scanAvccZeroRun,
} from "./gopTrialDecode55L8.ts";
import type { GopTrialDecodeProbe } from "./gopTrialDecode55L8.ts";

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
  console.log(`test_round77_e7_keyframe_large: ${pass}/${queue.length} test pass`);
}

// ---------------------------------------------------------------------------
// Builder AVCC nhỏ cho test scan (không dùng fixture binary).
// ---------------------------------------------------------------------------
function u32be(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}
/** 1 NAL AVCC: [u32 len][header][payload...]. */
function nal(header: number, payload: Uint8Array): Buffer {
  const body = Buffer.concat([Buffer.from([header]), Buffer.from(payload)]);
  return Buffer.concat([u32be(body.length), body]);
}
/** Fill an toàn cho payload slice: pattern (i*7+11)&0xff — zero đơn lẻ, không có chạy 0 ≥ 2. */
function safeFill(len: number, start = 0): Uint8Array {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = ((start + i) * 7 + 11) & 0xff;
  return out;
}
/** Sample hợp lệ: SPS + PPS + 1 slice lớn, payload có escape 00 00 03 đúng luật. */
function validBigSliceSample(sampleSize: number): Buffer {
  const sps = nal(0x67, Buffer.concat([Buffer.from([0x64, 0x00, 0x1f, 0xac, 0xd9]), safeFill(15, 3)]));
  const pps = nal(0x68, safeFill(10, 7));
  const slicePayloadLen = sampleSize - sps.length - pps.length - 4 - 1;
  const slicePayload = safeFill(slicePayloadLen, 101);
  // Rải vài escape 00 00 03 hợp lệ vào giữa slice (đúng luật emulation prevention).
  for (const at of [1000, 50000, 200000]) {
    if (at + 4 < slicePayload.length) {
      slicePayload[at] = 0; slicePayload[at + 1] = 0; slicePayload[at + 2] = 3; slicePayload[at + 3] = 0x11;
    }
  }
  const slice = nal(0x65, slicePayload);
  const out = Buffer.concat([sps, pps, slice]);
  assert.equal(out.length, sampleSize, "validBigSliceSample: kích thước mẫu phải đúng");
  return out;
}

// ---------------------------------------------------------------------------
// Scan unit: mẫu hợp lệ không bị bắt.
// ---------------------------------------------------------------------------
ok("(scan) mẫu hợp lệ SPS+PPS+slice (có escape 00 00 03) → không vi phạm, 3 NAL, maxInterior ≤ 2", () => {
  const s = validBigSliceSample(300_000);
  const r = scanAvccZeroRun(new Uint8Array(s), "avc1.64001F");
  assert.equal(r.violation, false);
  assert.equal(r.inconclusive, false);
  assert.equal(r.nals, 3);
  assert.ok(r.maxInteriorRun <= 2, `maxInterior phải ≤ 2, thực tế ${r.maxInteriorRun}`);
  assert.equal(r.maxTrailingRun, 0);
});
ok("(scan) slice kết thúc bằng cabac_zero_byte (0x80 + 5 byte 0) → không vi phạm", () => {
  const sps = nal(0x67, safeFill(20, 1));
  const pps = nal(0x68, safeFill(10, 2));
  const body = safeFill(1000, 3);
  body[999] = 0x80;
  const slicePayload = Buffer.concat([Buffer.from(body.subarray(0, 995)), Buffer.from([0x80, 0, 0, 0, 0, 0])]);
  const slice = nal(0x65, slicePayload);
  const s = Buffer.concat([sps, pps, slice]);
  const r = scanAvccZeroRun(new Uint8Array(s), "avc1.64001F");
  assert.equal(r.violation, false, `cabac trailing 5 byte 0 phải được miễn, nhận ${r.reason}`);
  assert.equal(r.maxTrailingRun, 5);
});
ok("(scan) nhiều NAL nhỏ (length-prefix chứa 00 00 00 xx) → không vi phạm", () => {
  // NAL len 5 → prefix 00 00 00 05: 3 byte 0 hợp lệ của length, không phải trong payload.
  const parts: Buffer[] = [];
  for (let i = 0; i < 1000; i++) parts.push(nal(0x67, safeFill(4, i)));
  const s = Buffer.concat(parts);
  const r = scanAvccZeroRun(new Uint8Array(s), "avc1.64001F");
  assert.equal(r.violation, false, `length-prefix 00 00 00 không được tính là zero-run, nhận ${r.reason}`);
  assert.equal(r.nals, 1000);
});
ok("(scan) codec không phải avc1 → inconclusive, không vi phạm (fail-open)", () => {
  const s = validBigSliceSample(10_000);
  const z = Buffer.from(s);
  z.fill(0, 5000, 6000);
  const r = scanAvccZeroRun(new Uint8Array(z), "vp09.00.10.08");
  assert.equal(r.violation, false);
  assert.equal(r.inconclusive, true);
});
ok("(scan) codec avc1 / codec vắng → quét bình thường", () => {
  const s = validBigSliceSample(10_000);
  assert.equal(scanAvccZeroRun(new Uint8Array(s), "avc1.64001F").inconclusive, false);
  assert.equal(scanAvccZeroRun(new Uint8Array(s)).inconclusive, false);
});
ok("(scan) mẫu rỗng / quá ngắn → inconclusive, không vi phạm", () => {
  assert.equal(scanAvccZeroRun(new Uint8Array(0), "avc1.64001F").inconclusive, true);
  assert.equal(scanAvccZeroRun(new Uint8Array(4), "avc1.64001F").inconclusive, true);
  assert.equal(scanAvccZeroRun(new Uint8Array(0), "avc1.64001F").violation, false);
});

// ---------------------------------------------------------------------------
// Scan unit: mẫu zero-giữa bị bắt.
// ---------------------------------------------------------------------------
ok("(scan) zero 3 byte giữa slice → vi phạm đúng offset (luật ≥ 3)", () => {
  const s = validBigSliceSample(100_000);
  const mid = 50_000;
  const z = Buffer.from(s);
  z.fill(0, mid, mid + 3);
  const r = scanAvccZeroRun(new Uint8Array(z), "avc1.64001F");
  assert.equal(r.violation, true, `3 byte 0 giữa payload phải vi phạm, nhận ${r.reason}`);
  assert.equal(r.maxInteriorRun, 3);
  assert.equal(r.maxInteriorRunAt, mid);
});
ok("(scan) zero 1 MiB giữa sample 4 MiB → vi phạm, maxInterior đúng 1 MiB, đúng offset", () => {
  const s = validBigSliceSample(4 * 1024 * 1024);
  const zeroAt = Math.floor(s.length / 2) - 512 * 1024;
  const z = Buffer.from(s);
  z.fill(0, zeroAt, zeroAt + 1024 * 1024);
  const r = scanAvccZeroRun(new Uint8Array(z), "avc1.64001F");
  assert.equal(r.violation, true);
  assert.equal(r.maxInteriorRun, 1024 * 1024);
  assert.equal(r.maxInteriorRunAt, zeroAt);
  console.log(`    đo: scan zero-1MiB-giữa trên 4 MiB → violation, offset ${zeroAt}`);
});
ok("(scan) zero 1 MiB ở cuối sample → vi phạm qua luật trailing (≥ 64)", () => {
  const s = validBigSliceSample(4 * 1024 * 1024);
  const z = Buffer.from(s);
  z.fill(0, z.length - 1024 * 1024, z.length);
  const r = scanAvccZeroRun(new Uint8Array(z), "avc1.64001F");
  assert.equal(r.violation, true);
  assert.equal(r.maxTrailingRun, 1024 * 1024);
});
ok(`(scan) ngưỡng trailing: 63 byte 0 cuối payload → không vi phạm; ${AVCC_ZERO_RUN_TRAILING_THRESHOLD} byte → vi phạm`, () => {
  const mk = (trailing: number): Buffer => {
    const sps = nal(0x67, safeFill(20, 1));
    const pps = nal(0x68, safeFill(10, 2));
    const body = safeFill(1000, 3);
    const slicePayload = Buffer.concat([
      Buffer.from(body.subarray(0, 1000 - trailing - 1)),
      Buffer.from([0x80]),
      Buffer.alloc(trailing, 0),
    ]);
    return Buffer.concat([sps, pps, nal(0x65, slicePayload)]);
  };
  assert.equal(scanAvccZeroRun(new Uint8Array(mk(63)), "avc1.64001F").violation, false);
  assert.equal(
    scanAvccZeroRun(new Uint8Array(mk(AVCC_ZERO_RUN_TRAILING_THRESHOLD)), "avc1.64001F").violation,
    true,
  );
});
ok("(scan) walk gãy do length-prefix bị zero (vùng zero nuốt NAL boundary) → vi phạm", () => {
  // 3 NAL: SPS, PPS, slice; zero 64 byte bắt đầu đúng tại length-prefix của slice.
  const sps = nal(0x67, safeFill(20, 1));
  const pps = nal(0x68, safeFill(10, 2));
  const slice = nal(0x65, safeFill(1000, 3));
  const s = Buffer.concat([sps, pps, slice]);
  const sliceLenOff = sps.length + pps.length;
  const z = Buffer.from(s);
  z.fill(0, sliceLenOff, sliceLenOff + 64);
  const r = scanAvccZeroRun(new Uint8Array(z), "avc1.64001F");
  assert.equal(r.violation, true, `walk gãy + 64 byte 0 tại vị trí gãy phải vi phạm, nhận ${r.reason}`);
});
ok("(scan) walk gãy không có byte 0 (length bị sửa thành số khổng lồ) → inconclusive, không vi phạm", () => {
  const sps = nal(0x67, safeFill(20, 1));
  const pps = nal(0x68, safeFill(10, 2));
  const slice = nal(0x65, safeFill(1000, 3));
  const s = Buffer.concat([sps, pps, slice]);
  const sliceLenOff = sps.length + pps.length;
  const z = Buffer.from(s);
  z[sliceLenOff] = 0x7f; // length thành 0x7F0003E9 — vượt sample, không có byte 0 kèm theo
  const r = scanAvccZeroRun(new Uint8Array(z), "avc1.64001F");
  assert.equal(r.violation, false);
  assert.equal(r.inconclusive, true);
});
ok("(scan) thừa 1–3 byte cuối sau NAL cuối → inconclusive, không vi phạm", () => {
  const s = validBigSliceSample(10_000);
  const z = Buffer.concat([s, Buffer.from([0x11, 0x22])]);
  const r = scanAvccZeroRun(new Uint8Array(z), "avc1.64001F");
  assert.equal(r.violation, false);
  assert.equal(r.inconclusive, true);
});
ok("(scan) overhead: quét sample hợp lệ 12 MiB < 5000 ms (đo thật, in ra)", () => {
  const s = validBigSliceSample(12 * 1024 * 1024);
  const t0 = Date.now();
  const r = scanAvccZeroRun(new Uint8Array(s), "avc1.64001F");
  const ms = Date.now() - t0;
  assert.equal(r.violation, false);
  console.log(`    đo: scan 12 MiB hợp lệ (3 NAL) = ${ms} ms`);
  assert.ok(ms < 5000, `quét 12 MiB phải < 5000 ms, thực tế ${ms} ms`);
});

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu (sao từ P6/N10 — chỉ dùng cho test T3 dưới đây).
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
interface MoovOpts {
  sampleCount?: number;
  sampleSize?: number;
  timescale?: number;
  chunkSamples?: number;
  chunkOffsets?: number[];
  stssKeys?: number[];
}
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
  const sttsTotal = N * 1000;
  const stbl = box("stbl",
    stsdBox(),
    sttsBox([[N, 1000]]),
    stssBox(keys),
    stscBox([[1, chunkSamples, 1]]),
    stszBox(sampleSize, N, Array.from({ length: N }, () => sampleSize)),
    stcoBox(chunkOffsets));
  const minf = box("minf",
    box("vmhd", u32(1), zeros(6)),
    box("dinf", box("dref", u32(0), u32(1), box("url ", u32(1)))),
    stbl);
  const mdia = box("mdia", mdhdBox(timescale, sttsTotal),
    box("hdlr", u32(0), u32(0), Buffer.from("vide", "ascii"), zeros(12), Buffer.from("VideoHandler\0", "ascii")),
    minf);
  const trak = box("trak", tkhdBox(sttsTotal), mdia);
  const moov = box("moov", mvhdBox(timescale, sttsTotal), trak);
  return { moov, sampleCount: N };
}
function ftypBox(): Buffer {
  return box("ftyp", Buffer.from("isom", "ascii"), u32(0x200), Buffer.from("isom", "ascii"), Buffer.from("iso2", "ascii"));
}
/**
 * Mẫu sample AVCC hợp lệ phụ thuộc vị trí (sao từ P6): mỗi đơn vị
 * 10 byte là 1 NAL SPS [len=6][0x67 0x64 0x00 0x1f 0xac X].
 * Đuôi 1–4 byte điền marker ((unit & 0xff) ^ 0xA5).
 */
function avccPatternBytes(sampleSize: number): Buffer {
  const out = Buffer.alloc(sampleSize);
  let unit = 0;
  let off = 0;
  while (sampleSize - off >= 10) {
    out.writeUInt32BE(6, off);
    out[off + 4] = 0x67;
    out[off + 5] = 0x64;
    out[off + 6] = 0x00;
    out[off + 7] = 0x1f;
    out[off + 8] = 0xac;
    out[off + 9] = unit & 0xff;
    unit++;
    off += 10;
  }
  const rem = sampleSize - off;
  if (rem > 0) {
    if (rem >= 5) {
      out.writeUInt32BE(rem - 4, off);
      out[off + 4] = 0x67;
      out[off + 5] = 0x64;
      out[off + 6] = 0x00;
      out[off + 7] = 0x1f;
      if (rem > 8) out[off + 8] = unit & 0xff;
    } else {
      for (let i = 0; i < rem; i++) out[off + i] = (unit & 0xff) ^ 0xa5;
    }
  }
  return out;
}
function sampleOffsetsFor(count: number, size: number, base = 32): number[] {
  return Array.from({ length: count }, (_, i) => base + i * size);
}
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
function countingProbe(result: boolean): { probe: GopTrialDecodeProbe; calls: () => number; sizes: () => number[] } {
  let n = 0;
  const sizes: number[] = [];
  const probe: GopTrialDecodeProbe = async (sample) => {
    n++;
    sizes.push(sample.length);
    return result;
  };
  return { probe, calls: () => n, sizes: () => sizes };
}
/**
 * File MP4 tối thiểu với sample 0 cho trước (cùng kích thước với các
 * sample còn lại, pattern hợp lệ). Vùng zero phải nằm NGOÀI tiền tố
 * 256 KiB để kiểm AVCC tiền tố qua được và quét zero-run mới là lớp
 * bắt (đúng tình huống thật: zero 1 MiB giữa sample lớn).
 */
function buildFileWithSample0(sample0: Buffer, sampleCount = 2): Buffer {
  const sampleSize = sample0.length;
  const { moov } = buildMoov({ sampleCount, sampleSize });
  const payload = zeros(sampleCount * sampleSize);
  sample0.copy(payload, 0);
  const one = avccPatternBytes(sampleSize);
  for (let i = 1; i < sampleCount; i++) one.copy(payload, i * sampleSize);
  return Buffer.concat([ftypBox(), box("mdat", payload), moov]);
}
function zeroedPatternSample(sampleSize: number, zeroAt: number, zeroLen: number): Buffer {
  const s = avccPatternBytes(sampleSize);
  s.fill(0, zeroAt, zeroAt + zeroLen);
  return s;
}
function zeroedBigSliceSample(sampleSize: number, zeroAt: number, zeroLen: number): Buffer {
  const s = validBigSliceSample(sampleSize);
  s.fill(0, zeroAt, zeroAt + zeroLen);
  return s;
}

// ---------------------------------------------------------------------------
// T3 thật qua server Range: sample 0 bị zero-giữa phải fallback.
// ---------------------------------------------------------------------------
ok("(e7-t3) stream, sample 0 = 1 MiB pattern bị zero 1 KiB ở 512 KiB (ngoài tiền tố AVCC) + probe-true → full-file /zero-run/, probe 0 lần", async () => {
  const file = buildFileWithSample0(zeroedPatternSample(1024 * 1024, 512 * 1024, 1024));
  const srv = await serve(file);
  try {
    const p = countingProbe(true);
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    assert.equal(out.mode, "full-file", `mẫu zero-giữa phải fallback, nhận ${out.mode}`);
    assert.match(out.reason, /zero-run/, `lý do phải nêu zero-run, nhận ${out.reason}`);
    assert.equal(p.calls(), 0, "quét phải chặn TRƯỚC khi gọi probe (tiết kiệm cả lần decode)");
    const sampleReqs = out.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 3, `vẫn fetch đủ sample để quét (1 tiền tố + 2 chunk), thực tế ${sampleReqs.length}`);
    console.log(`    đo: stream zero-pattern 1 MiB → ${out.mode}, reason=${out.reason}`);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) stream, sample 0 = 1 MiB big-slice bị zero 1 KiB ở 512 KiB + probe-true → full-file /zero-run/, probe 0 lần", async () => {
  const file = buildFileWithSample0(zeroedBigSliceSample(1024 * 1024, 512 * 1024, 1024));
  const srv = await serve(file);
  try {
    const p = countingProbe(true);
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    assert.equal(out.mode, "full-file");
    assert.match(out.reason, /zero-run/);
    assert.equal(p.calls(), 0);
    console.log(`    đo: stream zero-big-slice 1 MiB → ${out.mode}, reason=${out.reason}`);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) stream, sample 0 = 1 MiB big-slice hợp lệ + probe-true → gop-range, probe đúng 1 lần với đủ sample", async () => {
  const file = buildFileWithSample0(validBigSliceSample(1024 * 1024));
  const srv = await serve(file);
  try {
    const p = countingProbe(true);
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    assert.equal(out.mode, "gop-range", `mẫu hợp lệ + probe-true phải gop-range, nhận ${out.mode}`);
    assert.equal(p.calls(), 1, "quét qua thì probe vẫn được gọi đúng 1 lần");
    assert.equal(p.sizes()[0], 1024 * 1024);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) stream, sample 0 = 1 MiB big-slice hợp lệ + probe-false → full-file /trial-decode/, probe đúng 1 lần (quét không nuốt verdict probe)", async () => {
  const file = buildFileWithSample0(validBigSliceSample(1024 * 1024));
  const srv = await serve(file);
  try {
    const p = countingProbe(false);
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    assert.equal(out.mode, "full-file");
    assert.match(out.reason, /trial-decode/);
    assert.equal(p.calls(), 1);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) all-mode, sample 0 = 1 MiB big-slice bị zero 1 KiB ở 512 KiB + probe-true → full-file /zero-run/, probe 0 lần", async () => {
  const file = buildFileWithSample0(zeroedBigSliceSample(1024 * 1024, 512 * 1024, 1024));
  const srv = await serve(file);
  try {
    const p = countingProbe(true);
    const out = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: p.probe });
    assert.equal(out.mode, "full-file");
    assert.match(out.reason, /zero-run/);
    assert.equal(p.calls(), 0);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) all-mode, sample 0 = 1 MiB big-slice hợp lệ + probe-false → full-file /trial-decode/, probe đúng 1 lần", async () => {
  const file = buildFileWithSample0(validBigSliceSample(1024 * 1024));
  const srv = await serve(file);
  try {
    const p = countingProbe(false);
    const out = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: p.probe });
    assert.equal(out.mode, "full-file");
    assert.match(out.reason, /trial-decode/);
    assert.equal(p.calls(), 1);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) stream, sample 0 bị zero + probe null (opt-out) → gop-range (opt-out bỏ qua cả quét, như Q5(b))", async () => {
  const file = buildFileWithSample0(zeroedBigSliceSample(1024 * 1024, 512 * 1024, 1024));
  const srv = await serve(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: null });
    assert.equal(out.mode, "gop-range", `probe null = tắt trial-decode nên không quét, nhận ${out.mode}`);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) all-mode, sample 0 bị zero + probe null (opt-out) → gop-range (quét cũng bị tắt, khóa cùng L8)", async () => {
  const file = buildFileWithSample0(zeroedBigSliceSample(1024 * 1024, 512 * 1024, 1024));
  const srv = await serve(file);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: null });
    assert.equal(out.mode, "gop-range", `probe null ở all-mode cũng tắt quét, nhận ${out.mode}`);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) stream, sample 0 = cap + 1 (67.108.865 byte) hợp lệ + probe đếm → gop-range, probe 0 lần, đúng 1 request sample (khóa: > 64 MiB vẫn bỏ qua như thiết kế)", async () => {
  const { moov } = buildMoov({ sampleCount: 1, sampleSize: MAX_TRIAL_DECODE_SAMPLE_BYTES + 1 });
  const payload = avccPatternBytes(MAX_TRIAL_DECODE_SAMPLE_BYTES + 1);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const p = countingProbe(true);
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    assert.equal(out.mode, "gop-range", `trên cap phải bỏ qua trial-decode, nhận ${out.mode}`);
    assert.equal(p.calls(), 0);
    const sampleReqs = out.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 1, `trên cap chỉ fetch tiền tố AVCC, thực tế ${sampleReqs.length} request sample`);
    assert.equal(sampleReqs[0].bytes, MAX_FIRST_SAMPLE_PROBE_BYTES);
    console.log(`    đo: stream cap+1 → gop-range, probe 0 lần, 1 request sample / ${sampleReqs[0].bytes} byte`);
  } finally {
    await srv.close();
  }
});
ok("(e7-t3) stream, sample 0 = đúng cap 64 MiB hợp lệ + probe-true → gop-range, probe đúng 1 lần với đủ 64 MiB (khóa biên cap, quét không false-positive)", async () => {
  const t0 = Date.now();
  const { moov } = buildMoov({ sampleCount: 1, sampleSize: MAX_TRIAL_DECODE_SAMPLE_BYTES });
  const payload = avccPatternBytes(MAX_TRIAL_DECODE_SAMPLE_BYTES);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const p = countingProbe(true);
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    const ms = Date.now() - t0;
    assert.equal(out.mode, "gop-range", `đúng cap + probe-true phải gop-range, nhận ${out.mode}`);
    assert.equal(p.calls(), 1, "quét phải qua (pattern hợp lệ) để probe được gọi");
    assert.equal(p.sizes()[0], MAX_TRIAL_DECODE_SAMPLE_BYTES);
    const sampleReqs = out.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 129, `đúng cap cần 1 tiền tố + 128 chunk, thực tế ${sampleReqs.length}`);
    console.log(`    đo: stream đúng cap 64 MiB → gop-range, probe 1 lần / 64 MiB, ${sampleReqs.length} request sample, tổng ${ms} ms`);
  } finally {
    await srv.close();
  }
});

await runAll();
