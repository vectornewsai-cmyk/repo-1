// gopTrialDecode59P6.test.ts — Phase 9 đợt 59, luồng P6: đóng nợ đợt 58
// §6.6 (O6) + đợt 57 N10: trial-decode sample > 8 MiB ở stream-mode vẫn
// bị bỏ qua.
//
// Thay đổi hợp đồng (đợt 59 P6):
//   - Cap trial-decode stream-mode nâng 8 MiB → 32 MiB (đợt 59 P6) — đợt 60 Q5 nâng tiếp 32 MiB → 64 MiB
//     (MAX_TRIAL_DECODE_SAMPLE_BYTES).
//   - Phần còn lại của sample 0 lớn vẫn fetch theo chunk 512 KiB
//     (TRIAL_DECODE_SAMPLE_CHUNK_BYTES), ráp lại rồi mới decode — tối
//     đa 128 chunk (MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES =
//     ceil((64 MiB − 256 KiB) / 512 KiB)).
//   - KHÔNG decode streaming theo từng đoạn (ghi trong LIMITS P6 §1.2):
//     VideoDecoder chỉ nhận EncodedVideoChunk TRỌN 1 access unit —
//     không có API đưa từng mảnh của 1 sample vào rồi decode dần
//     (N10 §1.2 đã loại). "Theo từng đoạn" ở đây là CHUNKED FETCH
//     (không tải toàn bộ file vào RAM một lần — chỉ fetch đúng range
//     sample 0, đỉnh heap ≈ sample + 1 chunk), rồi decode 1 lần trên
//     sample đã ráp đủ.
//   - Timeout theo kích thước KHÔNG đổi (O6: 0,3 ms/KiB trên 256 KiB,
//     trần 2500 ms) — sample ≥ ~7,7 MiB đều chạm trần 2500 ms. Hệ quả
//     trung thực: keyframe thật ≳16 MiB decode ~0,15 ms/KiB nên vẫn
//     timeout → fail-open (hướng an toàn); rác lớn fail nhanh (~5 ms)
//     nên nay có verdict thật thay vì bị bỏ qua.
//   - Sample > 64 MiB vẫn bỏ qua (fail-open) như hành vi cũ;
//     all-mode không đổi (GOP 0 đã fetch đủ range nên không cap).
//
// Chạy bằng esbuild bundle (mẫu N10/O6, chạy từ gốc repo; file có
// top-level await nên phải bundle --format=esm + outfile .mjs — bundle
// cjs gãy với top-level await):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode59P6.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/p6.test.mjs \
//     && node <scratch>/p6.test.mjs
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
import {
  DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  runTrialDecode,
  trialDecodeTimeoutForSampleSize,
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
  console.log(`gopTrialDecode59P6: ${pass}/${queue.length} test pass`);
}

// ---------------------------------------------------------------------------
// Hằng số (khóa hợp đồng mới — đổi lén cap/chunk là test này đỏ).
// ---------------------------------------------------------------------------
ok("hằng cap mới: MAX_TRIAL_DECODE_SAMPLE_BYTES = 64 MiB (nâng từ 32 MiB đợt 59 — đợt 60 Q5)", () => {
  assert.equal(MAX_TRIAL_DECODE_SAMPLE_BYTES, 64 * 1024 * 1024);
});
ok("hằng chunk: TRIAL_DECODE_SAMPLE_CHUNK_BYTES = 512 KiB (không đổi)", () => {
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
// Timeout theo kích thước ở vùng lớn (công thức O6 không đổi — khóa lại
// để đợt sau khỏi siết trần một cách ngây thơ).
// ---------------------------------------------------------------------------
ok("(unit-timeout) 7 MiB → 2274 ms (dưới trần: 200 + ceil(6912 KiB × 0,3))", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(7 * 1024 * 1024), 2274);
});
ok("(unit-timeout) 8 MiB / 9 MiB / 12 MiB / 32 MiB / 64 MiB → 2500 ms (trần)", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(8 * 1024 * 1024), 2500);
  assert.equal(trialDecodeTimeoutForSampleSize(9_000_000), 2500);
  assert.equal(trialDecodeTimeoutForSampleSize(12_000_000), 2500);
  assert.equal(trialDecodeTimeoutForSampleSize(32 * 1024 * 1024), 2500);
  assert.equal(trialDecodeTimeoutForSampleSize(64 * 1024 * 1024), 2500);
});
ok("(unit-timeout) runTrialDecode + probe treo + sample 12 MiB → fail-open timeout-2500ms, chờ ~2500 ms", async () => {
  const hanging: GopTrialDecodeProbe = () => new Promise(() => {});
  const sample = new Uint8Array(12_000_000);
  const timeout = trialDecodeTimeoutForSampleSize(sample.length);
  assert.equal(timeout, 2500);
  const t0 = Date.now();
  const r = await runTrialDecode(hanging, sample, {
    codec: "avc1.64001F",
    codedWidth: 1280,
    codedHeight: 720,
    description: new Uint8Array(0),
  }, timeout);
  const ms = Date.now() - t0;
  assert.equal(r.passed, true, "timeout phải fail-open (cho qua), không chặn");
  assert.equal(r.skipped, true);
  assert.match(r.reason, /^timeout-2500ms/);
  assert.ok(ms >= 2000 && ms < 4000, `phải chờ ~2500 ms, thực tế ${ms} ms`);
  console.log(`    đo: probe treo + sample 12 MiB → ${r.reason}, chờ ${ms} ms`);
});

// ---------------------------------------------------------------------------
// Mock fetch cho unit fetchSampleRemainderChunked (sao từ N10).
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
// Unit: fetchSampleRemainderChunked ở giới hạn mới 64 chunk.
// ---------------------------------------------------------------------------
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
// Builder MP4 tối thiểu (sao từ N10; chỉ khác avccPatternBytes: đuôi
// 1–4 byte không dựng được NAL (cần tối thiểu 5 byte) nên điền byte
// marker phụ thuộc vị trí thay vì throw — cần cho mẫu đúng cap 64 MiB
// (67.108.864 % 10 = 4) và cap+1 (67.108.865 % 10 = 5). Chỉ tiền tố
// mới được validateAvccSample kiểm nên đuôi marker không ảnh hưởng
// tính hợp lệ AVCC; deepEqual với mẫu kỳ vọng vẫn bắt ráp sai offset.
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
 * Mẫu sample AVCC hợp lệ NHƯNG phụ thuộc vị trí (sao từ N10): mỗi đơn
 * vị 10 byte là 1 NAL SPS [len=6][0x67 0x64 0x00 0x1f 0xac X] với X =
 * chỉ số đơn vị & 0xff. Đuôi 5–9 byte là 1 NAL tương tự. Đuôi 1–4 byte
 * (mới ở P6): không dựng được NAL nên điền byte marker
 * ((unit & 0xff) ^ 0xA5) — vẫn phụ thuộc vị trí nên ráp sai offset là
 * lộ khi deepEqual, và không ảnh hưởng kiểm AVCC (chỉ kiểm tiền tố).
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

// ---------------------------------------------------------------------------
// Server HTTP Range thật (công thức H4/I6/K8/L8/M10/N10, rút gọn).
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
ok("(p6-t3) sample 0 = 12 MiB (> cap cũ 8 MiB, ≤ cap mới 64 MiB): probe nhận đủ 12 MiB ĐÚNG TỪNG BYTE, probe-false → full-file /trial-decode/, 24 request sample (1 prefix + 23 chunk)", async () => {
  const { file, expectedSample0 } = buildLargeSampleFile(12_000_000);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "full-file", `stream: sample 0 = 12 MiB ≤ cap 64 MiB phải được trial-decode và chặn khi probe-false, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    assert.equal(c.calls(), 1, `probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
    assert.deepEqual(c.sizes(), [12_000_000]);
    assert.deepEqual(
      Buffer.from(c.samples()[0]),
      expectedSample0,
      "probe phải nhận đúng từng byte sample 0 (chunk ráp sai offset là lộ)",
    );
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 24, `phải có 24 request kind "sample" (1 tiền tố + 23 chunk 512 KiB), thực tế ${sampleReqs.length}`);
    assert.deepEqual(
      [sampleReqs[0].start, sampleReqs[0].end],
      [32, 262175],
      "request đầu là tiền tố AVCC 256 KiB",
    );
    assert.deepEqual(
      [sampleReqs[1].start, sampleReqs[1].end],
      [262176, 786463],
      "chunk remainder đầu phải đúng 512 KiB nối tiếp tiền tố",
    );
    const last = sampleReqs[sampleReqs.length - 1];
    assert.deepEqual([last.start, last.end], [11796512, 12000031], "chunk cuối phải kết thúc đúng ở cuối sample 0");
    assert.equal(sampleReqs.every((r) => r.status === 206), true);
    console.log(`    đo: 24 request sample, probe nhận 12000000 byte đúng từng byte`);
  } finally {
    await srv.close();
  }
});

ok("(p6-t3) sample 0 = 12 MiB + probe-true → gop-range (không chặn oan)", async () => {
  const { file } = buildLargeSampleFile(12_000_000);
  const srv = await serve(file);
  try {
    const c = countingProbe(true);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: probe-true phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 1);
    assert.deepEqual(c.sizes(), [12_000_000]);
  } finally {
    await srv.close();
  }
});

ok("(p6-t3) sample 0 = đúng cap 64 MiB (67108864 byte): probe nhận đủ, probe-false → full-file, 129 request sample (1 prefix + 128 chunk)", async () => {
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

ok("(p6-t3) sample 0 = cap + 1 (67108865 byte): probe KHÔNG gọi → gop-range (vẫn bỏ qua trên cap mới)", async () => {
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

ok("(p6-t3) sample 0 = 80 MiB (> cap 64 MiB): probe KHÔNG gọi → gop-range (fail-open giữ nguyên)", async () => {
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

ok("(p6-t3) chunk giữa remainder lỗi 416 (sample 12 MiB) → bỏ qua trial-decode, gop-range, probe 0 lần (fail-open)", async () => {
  const { file } = buildLargeSampleFile(12_000_000);
  const srv = await serve(file);
  try {
    // Chặn đúng chunk remainder thứ 2 [786464, 1310751]; các request
    // khác đi qua fetch thật. Trên code cũ (cap 8 MiB) test này vẫn
    // xanh vì 12 MiB bị bỏ qua hẳn — nó khóa hành vi fail-open của
    // đường chunked mới, không phải đỏ-trước.
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

ok("(p6-t3) sample 0 = 12 MiB + probe treo → gop-range sau timeout 2500 ms (fail-open, không kẹt đường mở file)", async () => {
  const { file } = buildLargeSampleFile(12_000_000);
  const srv = await serve(file);
  try {
    const hanging: GopTrialDecodeProbe = () => new Promise(() => {});
    const t0 = Date.now();
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: hanging });
    const ms = Date.now() - t0;
    assert.equal(stream.mode, "gop-range", `stream: probe treo phải fail-open sau timeout, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.ok(ms >= 2000 && ms < 6000, `phải chờ ~2500 ms (timeout trần), thực tế ${ms} ms`);
    console.log(`    đo: probe treo + sample 12 MiB → gop-range sau ${ms} ms`);
  } finally {
    await srv.close();
  }
});

ok("(p6-t3) all-mode không đổi: sample 0 = 12 MiB all-mode → probe 1 lần trên toàn bộ sample, probe-false chặn được, 0 request sample", async () => {
  const { file } = buildLargeSampleFile(12_000_000);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: c.probe });
    assert.equal(all.mode, "full-file", `all: probe-false phải chặn, nhận ${all.mode === "gop-range" ? "gop-range (LỌT)" : all.mode}`);
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /trial-decode/);
    assert.equal(c.calls(), 1);
    assert.deepEqual(c.sizes(), [12_000_000]);
    const sampleReqs = all.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 0, `all-mode không dùng request kind "sample", thực tế ${sampleReqs.length}`);
  } finally {
    await srv.close();
  }
});

await runAll();
