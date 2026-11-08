// gopTrialDecode57N10.test.ts — Phase 9 đợt 57, luồng N10: đóng nợ (b)
// của M10 (LIMITS M10 §8.2): sample 0 > 2 MiB ở stream-mode vẫn bị bỏ
// qua (không trial-decode).
//
// Thay đổi hợp đồng (đợt 57 N10):
//   - Cap trial-decode stream-mode nâng 2 MiB → 8 MiB
//     (MAX_TRIAL_DECODE_SAMPLE_BYTES).
//   - Phần còn lại của sample 0 lớn KHÔNG fetch một lần nữa mà fetch
//     theo chunk 512 KiB (TRIAL_DECODE_SAMPLE_CHUNK_BYTES), ráp lại
//     rồi mới decode — tối đa 16 chunk
//     (MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES =
//     ceil((8 MiB − 256 KiB) / 512 KiB)).
//   - Lý do KHÔNG decode streaming (ghi trong LIMITS N10 §1.2):
//     VideoDecoder chỉ nhận EncodedVideoChunk TRỌN 1 access unit —
//     không có API đưa từng mảnh của 1 sample vào rồi decode dần;
//     chunk cắt dở đưa vào sẽ lỗi oan file thật. Nên chunked fetch +
//     ráp lại là cách duy nhất đúng; timeout 200 ms vẫn chặn cứng
//     chi phí decode bất kể cap.
//   - Sample > 8 MiB vẫn bỏ qua (fail-open) như hành vi cũ;
//     all-mode không đổi (GOP 0 đã fetch đủ range nên không cap).
//
// Đợt 59 P6 đổi hợp đồng tiếp: cap 8 MiB → 32 MiB, tối đa 64 chunk
// (ceil((32 MiB − 256 KiB) / 512 KiB)); sample > 32 MiB vẫn bỏ qua.
//
// Đợt 60 Q5 đổi hợp đồng tiếp: cap 32 MiB → 64 MiB, tối đa 128 chunk
// (ceil((64 MiB − 256 KiB) / 512 KiB)); sample > 64 MiB vẫn bỏ qua.
// Các test biên dưới đây đổi theo cap mới; test 3 MiB giữ nguyên
// (vẫn trong cap). avccPatternBytes thêm nhánh đuôi 1–4 byte (marker
// phụ thuộc vị trí) để dựng được đúng cap 64 MiB (67.108.864 % 10 = 4).
//
// Chạy bằng esbuild bundle (mẫu M10, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode57N10.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/n10.test.cjs \
//     && node <scratch>/n10.test.cjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  MAX_FIRST_SAMPLE_PROBE_BYTES,
  MAX_TRIAL_DECODE_SAMPLE_BYTES,
  MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES,
  TRIAL_DECODE_SAMPLE_CHUNK_BYTES,
  fetchSampleRemainderChunked,
  fetchVideoTrackByGopRange,
} from "./gopRangeFetch39T3.ts";
import type {
  GopRangeFetchFn,
  GopRangeRequestLog,
} from "./gopRangeFetch39T3.ts";
import { DEFAULT_TRIAL_DECODE_TIMEOUT_MS } from "./gopTrialDecode55L8.ts";
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
  console.log(`gopTrialDecode57N10: ${pass}/${queue.length} test pass`);
}

// ---------------------------------------------------------------------------
// Hằng số (khóa hợp đồng mới — đổi lén cap/chunk là test này đỏ).
// ---------------------------------------------------------------------------
ok("hằng cap mới: MAX_TRIAL_DECODE_SAMPLE_BYTES = 64 MiB (nâng từ 32 MiB đợt 59 — đợt 60 Q5)", () => {
  assert.equal(MAX_TRIAL_DECODE_SAMPLE_BYTES, 64 * 1024 * 1024);
});
ok("hằng chunk: TRIAL_DECODE_SAMPLE_CHUNK_BYTES = 512 KiB", () => {
  assert.equal(TRIAL_DECODE_SAMPLE_CHUNK_BYTES, 512 * 1024);
});
ok("hằng số lần fetch tối đa: MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES = 128 = ceil((64 MiB − 256 KiB) / 512 KiB)", () => {
  assert.equal(MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES, 128);
  assert.equal(
    MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES,
    Math.ceil(
      (MAX_TRIAL_DECODE_SAMPLE_BYTES - MAX_FIRST_SAMPLE_PROBE_BYTES) /
        TRIAL_DECODE_SAMPLE_CHUNK_BYTES,
    ),
  );
});
ok("timeout trial-decode vẫn 200 ms (không đổi)", () => {
  assert.equal(DEFAULT_TRIAL_DECODE_TIMEOUT_MS, 200);
});

// ---------------------------------------------------------------------------
// Mock fetch cho unit fetchSampleRemainderChunked: trả slice của buffer
// nguồn theo đúng Range xin, 206 + Content-Range khớp (mô phỏng server
// Range chuẩn); có thể chặn 1 range để trả 416.
// ---------------------------------------------------------------------------
function mockRangeFetch(
  source: Uint8Array,
  opts: { failRanges?: Array<[number, number]> } = {},
): { fetchImpl: GopRangeFetchFn; calls: () => Array<[number, number]> } {
  const calls: Array<[number, number]> = [];
  const fetchImpl: GopRangeFetchFn = async (_url, init) => {
    const range = init?.headers?.Range ?? "";
    const m = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!m) throw new Error(`mockRangeFetch: không parse được Range ${range}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    calls.push([start, end]);
    const blocked = (opts.failRanges ?? []).some(([fs, fe]) => fs === start && fe === end);
    if (blocked) {
      return {
        status: 416,
        headers: { get: () => null },
        arrayBuffer: async () => new ArrayBuffer(0),
        body: null,
      };
    }
    const slice = source.slice(start, end + 1);
    return {
      status: 206,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-range"
            ? `bytes ${start}-${end}/${source.length}`
            : null,
      },
      arrayBuffer: async () =>
        slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer,
      body: null,
    };
  };
  return { fetchImpl, calls: () => calls };
}

/** Buffer nguồn có nội dung phụ thuộc vị trí (byte i = i*7+11 mod 256) để ráp sai là lộ. */
function positionalBuffer(size: number): Uint8Array {
  const out = new Uint8Array(size);
  for (let i = 0; i < size; i++) out[i] = (i * 7 + 11) & 0xff;
  return out;
}

// ---------------------------------------------------------------------------
// Unit: fetchSampleRemainderChunked.
// ---------------------------------------------------------------------------
ok("(unit-chunk) sample 3 MiB: 6 chunk đúng range, ráp lại đúng từng byte", async () => {
  const sampleSize = 3_000_000;
  const prefixLen = MAX_FIRST_SAMPLE_PROBE_BYTES; // 262144
  const source = positionalBuffer(sampleSize);
  const prefix = source.slice(0, prefixLen);
  const { fetchImpl, calls } = mockRangeFetch(source);
  const requests: GopRangeRequestLog[] = [];
  const full = await fetchSampleRemainderChunked(
    fetchImpl, "http://x/f.mp4", 0, sampleSize, prefix, sampleSize, requests,
  );
  assert.equal(full.length, sampleSize);
  assert.deepEqual(full, source, "buffer ráp lại phải đúng từng byte với nguồn");
  // 6 chunk: [262144,786431], [786432,1310719], [1310720,1835007],
  // [1835008,2359295], [2359296,2883583], [2883584,2999999].
  assert.deepEqual(calls(), [
    [262144, 786431], [786432, 1310719], [1310720, 1835007],
    [1835008, 2359295], [2359296, 2883583], [2883584, 2999999],
  ]);
  assert.equal(requests.length, 6, "phải log đúng 6 request kind sample");
  assert.equal(requests.every((r) => r.kind === "sample"), true);
  console.log(`    đo: 6 chunk, byte cuối ráp đúng (full[2999999]=${full[2999999]}, nguồn=${source[2999999]})`);
});
ok("(unit-chunk) remainder vừa đúng bội số chunk (2 chunk, không fetch thừa)", async () => {
  const sampleSize = MAX_FIRST_SAMPLE_PROBE_BYTES + 2 * TRIAL_DECODE_SAMPLE_CHUNK_BYTES; // 1310720
  const source = positionalBuffer(sampleSize);
  const prefix = source.slice(0, MAX_FIRST_SAMPLE_PROBE_BYTES);
  const { fetchImpl, calls } = mockRangeFetch(source);
  const requests: GopRangeRequestLog[] = [];
  const full = await fetchSampleRemainderChunked(
    fetchImpl, "http://x/f.mp4", 0, sampleSize, prefix, sampleSize, requests,
  );
  assert.deepEqual(full, source);
  assert.deepEqual(calls(), [[262144, 786431], [786432, 1310719]]);
  assert.equal(calls().length, 2, "đúng bội số chunk thì không được fetch thêm chunk rỗng");
});
ok("(unit-chunk) remainder 524289 byte → 2 chunk (524288 + 1)", async () => {
  const sampleSize = MAX_FIRST_SAMPLE_PROBE_BYTES + TRIAL_DECODE_SAMPLE_CHUNK_BYTES + 1;
  const source = positionalBuffer(sampleSize);
  const prefix = source.slice(0, MAX_FIRST_SAMPLE_PROBE_BYTES);
  const { fetchImpl, calls } = mockRangeFetch(source);
  const full = await fetchSampleRemainderChunked(
    fetchImpl, "http://x/f.mp4", 0, sampleSize, prefix, sampleSize, [],
  );
  assert.deepEqual(full, source);
  assert.deepEqual(calls(), [[262144, 786431], [786432, 786432]]);
});
ok("(unit-chunk) chunk giữa lỗi 416 → throw (caller fail-open ở trên)", async () => {
  const sampleSize = 3_000_000;
  const source = positionalBuffer(sampleSize);
  const prefix = source.slice(0, MAX_FIRST_SAMPLE_PROBE_BYTES);
  const { fetchImpl, calls } = mockRangeFetch(source, { failRanges: [[786432, 1310719]] });
  await assert.rejects(
    fetchSampleRemainderChunked(fetchImpl, "http://x/f.mp4", 0, sampleSize, prefix, sampleSize, []),
    /sample-status-416/,
  );
  assert.equal(calls().length, 2, "lỗi ở chunk 2 thì dừng ngay, không fetch chunk sau");
});
ok("(unit-chunk) vượt giới hạn 128 chunk → throw sau đúng 128 request", async () => {
  // 129 chunk cần thiết (remainder 129×512 KiB) nhưng giới hạn là 128 —
  // helper phải dừng, không fetch vô hạn (phòng thủ, T3 không bao giờ
  // gọi tới mức này vì cap 64 MiB đã chặn trước).
  const sampleSize = MAX_FIRST_SAMPLE_PROBE_BYTES + 129 * TRIAL_DECODE_SAMPLE_CHUNK_BYTES;
  const source = positionalBuffer(sampleSize);
  const prefix = source.slice(0, MAX_FIRST_SAMPLE_PROBE_BYTES);
  const { fetchImpl, calls } = mockRangeFetch(source);
  await assert.rejects(
    fetchSampleRemainderChunked(fetchImpl, "http://x/f.mp4", 0, sampleSize, prefix, sampleSize, []),
    /sample-chunk-limit/,
  );
  assert.equal(calls().length, 128, "phải dừng đúng sau 128 chunk");
});

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu (sao từ M10, đổi mẫu sample thành phụ thuộc vị
// trí để ráp sai chunk là lộ). Moov hợp lệ tối thiểu cho demux.
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
 * Mẫu sample AVCC hợp lệ NHƯNG phụ thuộc vị trí: mỗi đơn vị 10 byte là
 * 1 NAL SPS [len=6][0x67 0x64 0x00 0x1f 0xac X] với X = chỉ số đơn vị
 * & 0xff — cấu trúc NAL vẫn hợp lệ cho validateAvccSample (len>0,
 * header 0x67: forbidden=0, type=7) nhưng nội dung đổi theo vị trí nên
 * chunk ráp sai offset (không phải bội số 2560 byte) là lộ ngay khi
 * deepEqual với mẫu này. Đuôi 5–9 byte (khi size % 10 != 0) là 1 NAL
 * [len=r-4][0x67 0x64 0x00 0x1f X] hợp lệ tương tự.
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
    if (rem < 5) {
      // Đợt 59 P6: đuôi 1–4 byte không dựng được NAL (cần tối thiểu 5
      // byte) nên điền byte marker phụ thuộc vị trí — cần cho mẫu
      // đúng cap 64 MiB (67.108.864 % 10 = 4). Chỉ tiền tố mới được
      // validateAvccSample kiểm nên đuôi marker không ảnh hưởng tính
      // hợp lệ AVCC; deepEqual vẫn bắt ráp sai offset.
      for (let i = 0; i < rem; i++) out[off + i] = (unit & 0xff) ^ 0xa5;
      return out;
    }
    out.writeUInt32BE(rem - 4, off);
    out[off + 4] = 0x67;
    out[off + 5] = 0x64;
    out[off + 6] = 0x00;
    out[off + 7] = 0x1f;
    if (rem > 8) out[off + 8] = unit & 0xff;
  }
  return out;
}
function fillPatternSamples(payload: Buffer, mdatPayloadStart: number, offsets: number[], sampleSize: number): void {
  const one = avccPatternBytes(sampleSize);
  for (const off of offsets) {
    const rel = off - mdatPayloadStart;
    if (rel < 0 || rel + sampleSize > payload.length) throw new Error(`fillPatternSamples: offset ${off} ngoài payload mdat`);
    one.copy(payload, rel);
  }
}
function sampleOffsetsFor(count: number, size: number, base = 32): number[] {
  return Array.from({ length: count }, (_, i) => base + i * size);
}
function defaultSampleOffsets(): number[] {
  const out: number[] = [];
  for (let i = 0; i < 30; i++) out.push(32 + i * 1000);
  for (let i = 0; i < 30; i++) out.push(30032 + i * 1000);
  return out;
}

// ---------------------------------------------------------------------------
// Server HTTP Range thật (công thức H4/I6/K8/L8/M10, rút gọn).
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

function countingProbe(result: boolean): { probe: GopTrialDecodeProbe; calls: () => number; sizes: () => number[]; samples: () => Uint8Array[] } {
  let n = 0;
  const sizes: number[] = [];
  const samples: Uint8Array[] = [];
  const probe: GopTrialDecodeProbe = async (sample) => {
    n++;
    sizes.push(sample.length);
    samples.push(sample.slice());
    return result;
  };
  return { probe, calls: () => n, sizes: () => sizes, samples: () => samples };
}

function buildLargeSampleFile(sampleSize: number, sampleCount = 2): { file: Buffer; expectedSample0: Buffer } {
  const { moov } = buildMoov({ sampleCount, sampleSize });
  const payload = zeros(sampleCount * sampleSize);
  fillPatternSamples(payload, 32, sampleOffsetsFor(sampleCount, sampleSize), sampleSize);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  return { file, expectedSample0: avccPatternBytes(sampleSize) };
}

// ---------------------------------------------------------------------------
// T3 thật qua server Range: sample 0 lớn, chunked fetch (cap mới 64 MiB).
// ---------------------------------------------------------------------------
ok("(n10-t3) sample 0 = 3 MiB (vượt cap cũ 2 MiB, ≤ cap mới 64 MiB): probe nhận đủ 3 MiB ĐÚNG TỪNG BYTE, probe-false → full-file /trial-decode/, 7 request sample (1 prefix + 6 chunk)", async () => {
  const { file, expectedSample0 } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "full-file", `stream: sample 0 = 3 MiB ≤ cap 64 MiB phải được trial-decode và chặn khi probe-false, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    assert.equal(c.calls(), 1, `probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
    assert.deepEqual(c.sizes(), [3_000_000]);
    assert.deepEqual(
      Buffer.from(c.samples()[0]),
      expectedSample0,
      "probe phải nhận đúng từng byte sample 0 (chunk ráp sai offset là lộ)",
    );
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 7, `phải có 7 request kind "sample" (1 tiền tố + 6 chunk 512 KiB), thực tế ${sampleReqs.length}`);
    assert.deepEqual(
      sampleReqs.map((r) => [r.start, r.end]),
      [
        [32, 262175],
        [262176, 786463], [786464, 1310751], [1310752, 1835039],
        [1835040, 2359327], [2359328, 2883615], [2883616, 3000031],
      ],
      "chunk phải đúng range 512 KiB nối tiếp nhau, không trùng/không hở",
    );
    assert.equal(sampleReqs.every((r) => r.status === 206), true);
    console.log(`    đo: 7 request sample, probe nhận 3000000 byte đúng từng byte`);
  } finally {
    await srv.close();
  }
});

ok("(n10-t3) sample 0 = 3 MiB + probe-true → gop-range (không chặn oan)", async () => {
  const { file } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    const c = countingProbe(true);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: probe-true phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 1);
    assert.deepEqual(c.sizes(), [3_000_000]);
  } finally {
    await srv.close();
  }
});

ok("(n10-t3) sample 0 = đúng cap 64 MiB (67108864 byte): probe nhận đủ, probe-false → full-file, 129 request sample (1 prefix + 128 chunk)", async () => {
  const { file, expectedSample0 } = buildLargeSampleFile(64 * 1024 * 1024, 1);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "full-file", `stream: sample 0 = đúng cap 64 MiB phải được trial-decode, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    assert.equal(c.calls(), 1);
    assert.deepEqual(c.sizes(), [64 * 1024 * 1024]);
    assert.deepEqual(Buffer.from(c.samples()[0]), expectedSample0, "probe phải nhận đúng từng byte ở biên cap");
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 129, `biên cap: 1 tiền tố + 128 chunk = 129 request, thực tế ${sampleReqs.length}`);
    const last = sampleReqs[sampleReqs.length - 1];
    assert.deepEqual([last.start, last.end], [66846752, 67108895], "chunk cuối phải kết thúc đúng ở cuối sample 0");
    console.log(`    đo: biên cap 67108864 byte → 129 request sample, probe nhận đủ`);
  } finally {
    await srv.close();
  }
});

ok("(n10-t3) sample 0 = cap + 1 (67108865 byte): probe KHÔNG gọi → gop-range (vẫn bỏ qua trên cap mới)", async () => {
  const { file } = buildLargeSampleFile(67_108_865, 1);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: sample 0 = cap+1 phải bỏ qua trial-decode (fail-open), nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 0, `probe phải KHÔNG gọi khi sample 0 > cap 64 MiB, thực tế ${c.calls()} lần`);
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 1, "trên cap chỉ fetch tiền tố AVCC (1 request sample), không fetch thêm");
    console.log(`    đo: sample0=67108865 byte > cap 64 MiB → probe 0 lần, 1 request sample`);
  } finally {
    await srv.close();
  }
});

ok("(n10-t3) sample 0 = 80 MiB (> cap 64 MiB): probe KHÔNG gọi → gop-range (fail-open giữ nguyên)", async () => {
  const { file } = buildLargeSampleFile(80_000_000, 1);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: sample 0 > cap 64 MiB phải bỏ qua trial-decode, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 0);
    console.log(`    đo: file=${file.length} byte, sample0=80000000 byte > cap 64 MiB → probe 0 lần`);
  } finally {
    await srv.close();
  }
});

ok("(n10-t3) chunk giữa remainder lỗi 416 → bỏ qua trial-decode, gop-range, probe 0 lần (fail-open)", async () => {
  const { file } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    // Chặn đúng chunk remainder thứ 2 [786464, 1310751]; các request
    // khác đi qua fetch thật. Đường cũ (1 request remainder) không
    // khớp range này nên test này đỏ trước khi sửa.
    const flaky: typeof fetch = (async (input: unknown, init?: unknown) => {
      const headers = (init as { headers?: Record<string, string> } | undefined)?.headers;
      const range = headers?.Range ?? (headers as Record<string, string> | undefined)?.range;
      if (typeof range === "string" && range.startsWith("bytes=786464-")) {
        return {
          status: 416,
          headers: { get: () => null },
          arrayBuffer: async () => new ArrayBuffer(0),
          body: null,
        } as unknown as Response;
      }
      return fetch(input as string, init as RequestInit);
    }) as typeof fetch;
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      trialDecodeProbe: c.probe,
      fetchImpl: flaky as unknown as GopRangeFetchFn,
    });
    assert.equal(stream.mode, "gop-range", `stream: lỗi chunk giữa phải fail-open, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 0, `probe phải KHÔNG gọi khi không ráp đủ sample 0, thực tế ${c.calls()} lần`);
  } finally {
    await srv.close();
  }
});

ok("(n10-t3) sample nhỏ (1000 byte) không thêm request: đúng 1 request sample, probe nhận đủ 1000 byte", async () => {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillPatternSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const c = countingProbe(true);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: file control phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 1);
    assert.deepEqual(c.sizes(), [1000]);
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 1, `sample nhỏ chỉ được 1 request sample (tiền tố), thực tế ${sampleReqs.length}`);
    assert.deepEqual([sampleReqs[0].start, sampleReqs[0].end], [32, 1031]);
  } finally {
    await srv.close();
  }
});

ok("(n10-t3) all-mode không đổi: sample 0 = 3 MiB all-mode → probe 1 lần trên toàn bộ sample, probe-false chặn được", async () => {
  const { file } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: c.probe });
    assert.equal(all.mode, "full-file", `all: probe-false phải chặn, nhận ${all.mode === "gop-range" ? "gop-range (LỌT)" : all.mode}`);
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /trial-decode/);
    assert.equal(c.calls(), 1);
    assert.deepEqual(c.sizes(), [3_000_000]);
    // All-mode không fetch remainder kiểu stream (GOP 0 đã đủ range)
    // nên không có request sample nào ngoài GOP fetch.
    const sampleReqs = all.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 0, `all-mode không dùng request kind "sample", thực tế ${sampleReqs.length}`);
  } finally {
    await srv.close();
  }
});

await runAll();
