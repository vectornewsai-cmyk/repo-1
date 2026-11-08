// gopTrialDecode58O6.test.ts — Phase 9 đợt 58, luồng O6: đóng nợ đợt 57
// §6.4 (LIMITS đợt 57 §6.4 + LIMITS N10 §6.1): keyframe 4K nhiễu
// 4.107.475 byte decode không kịp timeout 200 ms → fail-open, moov giả
// có sample 0 là keyframe thật-lớn-nhiễu không bị chặn chắc.
//
// Thay đổi hợp đồng (đợt 58 O6):
//   - Timeout trial-decode NAY THEO KÍCH THƯỚC SAMPLE
//     (`trialDecodeTimeoutForSampleSize`, gopTrialDecode55L8.ts):
//     sample ≤ 256 KiB giữ nguyên timeout gốc (mặc định 200 ms);
//     phần vượt 256 KiB cộng 0,3 ms/KiB (gấp 2× tốc độ decode đo được
//     ≈ 0,15 ms/KiB — xem LIMITS O6 §1); trần 2500 ms.
//     Ví dụ (base 200): 300.148 B → 212 ms; 460.756 B → 259 ms;
//     4.107.475 B → 1327 ms; 8 MiB → 2500 ms (trần).
//   - T3 tính timeout này ở CẢ 2 điểm gọi trial-decode (stream-mode +
//     all-mode), từ đúng kích thước sample 0 đem decode; option
//     `trialDecodeTimeoutMs` nay là timeout GỐC cho sample nhỏ.
//   - Quá trần vẫn fail-open như cũ (runTrialDecode không đổi);
//     sample > 8 MiB vẫn bỏ qua như cũ (cap của T3) — đợt 59 P6 nâng
//     cap lên 32 MiB, sample > 32 MiB mới bỏ qua; đợt 60 Q5 nâng tiếp
//     cap lên 64 MiB, sample > 64 MiB mới bỏ qua; công thức timeout
//     không đổi (8 MiB trở lên đều chạm trần 2500 ms).
//
// Chạy bằng esbuild bundle (mẫu N10, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode58O6.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/o6.test.mjs \
//     && node <scratch>/o6.test.mjs
// (top-level await `await runAll()` nên phải bundle --format=esm + .mjs;
// cjs gãy "Top-level await is not supported" — ghi chú ROUND57 §4.)
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  fetchVideoTrackByGopRange,
} from "./gopRangeFetch39T3.ts";
import {
  DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  MAX_TRIAL_DECODE_TIMEOUT_MS,
  TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB,
  TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES,
  trialDecodeTimeoutForSampleSize,
} from "./gopTrialDecode55L8.ts";
import type {
  GopTrialDecodeProbe,
} from "./gopTrialDecode55L8.ts";

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
  console.log(`gopTrialDecode58O6: ${pass}/${queue.length} test pass`);
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Hằng số (khóa hợp đồng mới — đổi lén ngưỡng/hệ số/trần là test này đỏ).
// ---------------------------------------------------------------------------
ok("hằng ngưỡng: TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES = 256 KiB (sample nhỏ giữ timeout gốc)", () => {
  assert.equal(TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES, 256 * 1024);
});
ok("hằng hệ số: TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB = 0,3 ms/KiB (≈ 2× tốc độ decode đo được 0,15 ms/KiB)", () => {
  assert.equal(TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB, 0.3);
});
ok("hằng trần: MAX_TRIAL_DECODE_TIMEOUT_MS = 2500 ms", () => {
  assert.equal(MAX_TRIAL_DECODE_TIMEOUT_MS, 2500);
});
ok("timeout gốc DEFAULT_TRIAL_DECODE_TIMEOUT_MS vẫn = 200 ms (không đổi)", () => {
  assert.equal(DEFAULT_TRIAL_DECODE_TIMEOUT_MS, 200);
});

// ---------------------------------------------------------------------------
// Unit: trialDecodeTimeoutForSampleSize.
// ---------------------------------------------------------------------------
ok("(unit-timeout) sample nhỏ (0 / 1 / 1000 / đúng 256 KiB) → đúng timeout gốc 200 ms", () => {
  for (const size of [0, 1, 1000, 29_245, 262_144]) {
    assert.equal(
      trialDecodeTimeoutForSampleSize(size),
      200,
      `size ${size} phải giữ timeout gốc 200 ms`,
    );
  }
});
ok("(unit-timeout) biên 256 KiB + 1 byte → 201 ms (ceil, không nhảy vọt)", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(262_145), 201);
});
ok("(unit-timeout) giá trị hiệu chuẩn từ số đo thật: 300.148 B → 212 ms; 460.756 B → 259 ms; 4.107.475 B → 1327 ms", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(300_148), 212);
  assert.equal(trialDecodeTimeoutForSampleSize(460_756), 259);
  assert.equal(trialDecodeTimeoutForSampleSize(4_107_475), 1327);
  console.log("    đo: 300148→212ms, 460756→259ms, 4107475→1327ms (base 200 + ceil((size-256KiB)/1024×0,3))");
});
ok("(unit-timeout) sample 3 MiB → 1003 ms (đúng công thức, dùng ở test T3)", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(3_000_000), 1003);
});
ok("(unit-timeout) trần: 8 MiB → 2500 ms (không phải 2581); 16 MiB → 2500 ms", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(8_388_608), 2500);
  assert.equal(trialDecodeTimeoutForSampleSize(16_777_216), 2500);
});
ok("(unit-timeout) base override: base 30 → nhỏ 30 ms; 300.148 B → 42 ms; 4.107.475 B → 1157 ms", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(1000, 30), 30);
  assert.equal(trialDecodeTimeoutForSampleSize(300_148, 30), 42);
  assert.equal(trialDecodeTimeoutForSampleSize(4_107_475, 30), 1157);
});
ok("(unit-timeout) base không hợp lệ (0 / -5 / NaN / Infinity) → về gốc 200 ms rồi mới scale", () => {
  for (const base of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(trialDecodeTimeoutForSampleSize(1000, base), 200);
    assert.equal(trialDecodeTimeoutForSampleSize(4_107_475, base), 1327);
  }
});
ok("(unit-timeout) size không hợp lệ (NaN / âm) → timeout gốc, không throw", () => {
  assert.equal(trialDecodeTimeoutForSampleSize(Number.NaN), 200);
  assert.equal(trialDecodeTimeoutForSampleSize(-1), 200);
});

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu (sao từ N10 — moov hợp lệ tối thiểu cho demux).
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
    if (rem < 5) throw new Error(`avccPatternBytes: size ${sampleSize} dư ${rem} byte (< 5) không dựng được NAL đuôi`);
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
function buildLargeSampleFile(sampleSize: number, sampleCount = 2): { file: Buffer; expectedSample0: Buffer } {
  const { moov } = buildMoov({ sampleCount, sampleSize });
  const payload = zeros(sampleCount * sampleSize);
  fillPatternSamples(payload, 32, sampleOffsetsFor(sampleCount, sampleSize), sampleSize);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  return { file, expectedSample0: avccPatternBytes(sampleSize) };
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

/** Probe treo (không bao giờ resolve) — đo timeout T3 dùng thật. */
function hangingProbe(): GopTrialDecodeProbe {
  return async () => new Promise<false>(() => {});
}
/** Probe trả `result` sau `delayMs` — verdict chậm nhưng thật. */
function delayedProbe(result: boolean, delayMs: number): GopTrialDecodeProbe {
  return async () => {
    await sleep(delayMs);
    return result;
  };
}

// ---------------------------------------------------------------------------
// T3 thật qua server Range: timeout theo kích thước sample.
// Ngưỡng kỳ vọng (base 200): sample nhỏ → 200 ms; sample 3 MiB → 1003 ms.
// Đo thời gian CHỜ timeout bằng hiệu (lượt probe treo − lượt probe-true
// tức thì trên cùng file) để trừ phí fetch/demux (~400–700 ms trên file
// 6 MB): nhỏ chờ ~200 ms, lớn chờ ~1003 ms. Cửa sổ assert rộng (máy tải
// vẫn phải xanh) nhưng đủ tách 200 ms với 1003 ms: nhỏ [150, 500), lớn
// [850, 2500).
// ---------------------------------------------------------------------------
ok("(o6-t3) sample nhỏ (1000 B) + probe treo → gop-range sau ~200 ms (giữ timeout cũ)", async () => {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillPatternSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    // Warm-up 1 lượt (probe-true, bỏ kết quả) để phí fetch/demux ổn
    // định rồi mới đo baseline — lượt đầu thường chậm hơn do JIT/TCP.
    // Baseline: probe-true tức thì đo phí fetch/demux (trừ đi để tách
    // riêng thời gian chờ timeout — phí này ~400 ms trên file này).
    await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    const t0 = performance.now();
    const base = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    const baseMs = performance.now() - t0;
    assert.equal(base.mode, "gop-range");
    const t1 = performance.now();
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: hangingProbe() });
    const ms = performance.now() - t1;
    const waitMs = ms - baseMs;
    assert.equal(stream.mode, "gop-range", `stream: probe treo sample nhỏ phải fail-open, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.ok(waitMs >= 80, `sample nhỏ phải chờ timeout gốc ~200 ms (trừ phí baseline, dao động lượt chạy ~±100 ms), thực tế chờ thêm ${waitMs.toFixed(0)} ms (tổng ${ms.toFixed(0)} ms, baseline ${baseMs.toFixed(0)} ms)`);
    assert.ok(ms < 900, `sample nhỏ không được chờ tới timeout sample lớn, thực tế tổng ${ms.toFixed(0)} ms`);
    console.log(`    đo: sample nhỏ + probe treo → gop-range sau ${ms.toFixed(0)} ms (baseline ${baseMs.toFixed(0)} ms, chờ timeout ${waitMs.toFixed(0)} ms ≈ gốc 200 ms)`);
  } finally {
    await srv.close();
  }
});
ok("(o6-t3) sample 0 = 3 MiB + probe treo → gop-range sau ~1003 ms (timeout đã scale, KHÔNG phải 200 ms)", async () => {
  const { file } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    const t0 = performance.now();
    const base = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    const baseMs = performance.now() - t0;
    assert.equal(base.mode, "gop-range");
    const t1 = performance.now();
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: hangingProbe() });
    const ms = performance.now() - t1;
    const waitMs = ms - baseMs;
    assert.equal(stream.mode, "gop-range", `stream: probe treo sample lớn phải fail-open, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.ok(waitMs >= 850, `sample 3 MiB phải chờ timeout đã scale ~1003 ms (không được cắt ở 200 ms), thực tế chờ thêm ${waitMs.toFixed(0)} ms (tổng ${ms.toFixed(0)} ms, baseline ${baseMs.toFixed(0)} ms)`);
    assert.ok(waitMs < 2500, `sample 3 MiB không được chờ quá trần, thực tế chờ thêm ${waitMs.toFixed(0)} ms`);
    console.log(`    đo: sample 3 MiB + probe treo → gop-range sau ${ms.toFixed(0)} ms (baseline ${baseMs.toFixed(0)} ms, chờ timeout ${waitMs.toFixed(0)} ms ≈ scale 1003 ms)`);
  } finally {
    await srv.close();
  }
});
ok("(o6-t3) sample 0 = 3 MiB + probe trả false sau 500 ms → full-file /trial-decode/ (verdict chậm nay kịp về trước timeout 1003 ms)", async () => {
  const { file } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    const t0 = performance.now();
    const base = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    const baseMs = performance.now() - t0;
    assert.equal(base.mode, "gop-range");
    const t1 = performance.now();
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: delayedProbe(false, 500) });
    const ms = performance.now() - t1;
    // Thời gian verdict = tổng − phí fetch/demux (baseline): verdict
    // 500 ms phải về trước timeout đã scale 1003 ms (timeout cũ 200 ms
    // đã cắt nó — xem đỏ-trước). Tổng tuyệt đối gồm cả phí fetch nên
    // không assert < 900 ms ở đây.
    const verdictMs = ms - baseMs;
    assert.equal(stream.mode, "full-file", `stream: probe-false sau 500 ms (trong timeout 1003 ms) phải chặn, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT — timeout cũ 200 ms đã cắt verdict)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    assert.ok(verdictMs < 1003, `verdict 500 ms phải về trước timeout 1003 ms, thực tế chờ verdict ${verdictMs.toFixed(0)} ms (tổng ${ms.toFixed(0)} ms, baseline ${baseMs.toFixed(0)} ms)`);
    assert.ok(verdictMs >= 300, `verdict phải chờ đủ ~500 ms (không được trả tức thì), thực tế ${verdictMs.toFixed(0)} ms`);
    console.log(`    đo: sample 3 MiB + probe-false 500 ms → full-file sau ${ms.toFixed(0)} ms (baseline ${baseMs.toFixed(0)} ms, chờ verdict ${verdictMs.toFixed(0)} ms < timeout 1003 ms)`);
  } finally {
    await srv.close();
  }
});
ok("(o6-t3) ĐỐI CHỨNG sample nhỏ + probe trả false sau 500 ms → gop-range (timeout 200 ms cắt verdict — fail-open như cũ)", async () => {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillPatternSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const t1 = performance.now();
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: delayedProbe(false, 500) });
    const ms = performance.now() - t1;
    assert.equal(stream.mode, "gop-range", `stream: probe-false sau 500 ms trên sample nhỏ phải bị timeout 200 ms cắt → fail-open, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.ok(ms < 900, `sample nhỏ phải trả sau ~200 ms, thực tế ${ms.toFixed(0)} ms`);
    console.log(`    đo: sample nhỏ + probe-false 500 ms → gop-range sau ${ms.toFixed(0)} ms (timeout 200 ms cắt verdict)`);
  } finally {
    await srv.close();
  }
});
ok("(o6-t3) all-mode sample 0 = 3 MiB + probe treo → gop-range sau ~1003 ms (all-mode cũng scale)", async () => {
  const { file } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => true });
    const t0 = performance.now();
    const base = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => true });
    const baseMs = performance.now() - t0;
    assert.equal(base.mode, "gop-range");
    const t1 = performance.now();
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: hangingProbe() });
    const ms = performance.now() - t1;
    const waitMs = ms - baseMs;
    assert.equal(all.mode, "gop-range", `all: probe treo sample lớn phải fail-open, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
    assert.ok(waitMs >= 850, `all-mode sample 3 MiB phải chờ timeout đã scale ~1003 ms, thực tế chờ thêm ${waitMs.toFixed(0)} ms (tổng ${ms.toFixed(0)} ms, baseline ${baseMs.toFixed(0)} ms)`);
    assert.ok(waitMs < 2500, `all-mode sample 3 MiB không được chờ quá trần, thực tế chờ thêm ${waitMs.toFixed(0)} ms`);
    console.log(`    đo: all-mode sample 3 MiB + probe treo → gop-range sau ${ms.toFixed(0)} ms (baseline ${baseMs.toFixed(0)} ms, chờ timeout ${waitMs.toFixed(0)} ms)`);
  } finally {
    await srv.close();
  }
});
ok("(o6-t3) sample 0 = 3 MiB + probe-true tức thì → gop-range (đường nhanh không bị timeout mới làm chậm)", async () => {
  const { file } = buildLargeSampleFile(3_000_000);
  const srv = await serve(file);
  try {
    const t1 = performance.now();
    const stream = await fetchVideoTrackByGopRange(srv.url, {
      streamGops: true,
      trialDecodeProbe: async () => true,
    });
    const ms = performance.now() - t1;
    assert.equal(stream.mode, "gop-range", `stream: probe-true phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.ok(ms < 900, `probe-true tức thì không được chờ hết timeout, thực tế ${ms.toFixed(0)} ms`);
  } finally {
    await srv.close();
  }
});

await runAll();
