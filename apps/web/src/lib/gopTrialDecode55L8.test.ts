// gopTrialDecode55L8.test.ts — Phase 9 đợt 55, luồng L8: nối trial-decode
// bất đồng bộ (fail-open) vào kiểm tra GOP T3.
//
// Lớp mới (đợt này, xem gopTrialDecode55L8.ts + gopRangeFetch39T3.ts):
//   - `GopTrialDecodeProbe` inject được + `runTrialDecode` bọc timeout +
//     fail-open: chỉ decoder báo lỗi THẬT mới chặn; không có decoder /
//     probe ném lỗi / timeout đều cho qua.
//   - T3 chạy trial-decode sample 0 SAU lớp K8 + kiểm AVCC, chỉ khi đã
//     có đủ toàn bộ sample 0 (stream-mode: sample 0 ≤ cap 256 KiB;
//     all-mode: GOP 0 đã fetch đủ nên luôn đủ).
//   - Bắt đúng lớp moov giả tinh vi mà AVCC + K8 bỏ lọt: sample 0 có
//     cấu trúc AVCC đúng nhưng bitstream H.264 là rác (K8 §3.1 case B —
//     AVCC qua, VideoDecoder lỗi trong 0,5 ms).
//
// Chạy bằng esbuild bundle (mẫu K8, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode55L8.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/l8.test.mjs \
//     && node <scratch>/l8.test.mjs
// Nếu ESM ném ERR_REQUIRE_CYCLE_MODULE thì bundle lại --format=cjs.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { fetchVideoTrackByGopRange } from "./gopRangeFetch39T3.ts";
import {
  createBrowserTrialDecodeProbe,
  DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  runTrialDecode,
  trialDecodeConfigFromTrack,
} from "./gopTrialDecode55L8.ts";
import type {
  GopTrialDecodeProbe,
  TrialDecodeConfig,
} from "./gopTrialDecode55L8.ts";
import {
  parseMp4VideoTrack,
  validateAvccSample,
} from "./mp4Demux.ts";

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
  console.log(`gopTrialDecode55L8: ${pass}/${queue.length} test pass`);
}

const FAKE_CONFIG: TrialDecodeConfig = {
  codec: "avc1.64001F",
  codedWidth: 1280,
  codedHeight: 720,
  description: new Uint8Array([0x01, 0x64, 0x00, 0x1f]),
};
const FAKE_SAMPLE = new Uint8Array([0x00, 0x00, 0x00, 0x06, 0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9]);

// ---------------------------------------------------------------------------
// Unit: runTrialDecode — fail-open.
// ---------------------------------------------------------------------------
ok("probe null → pass + skipped /no-decoder/", async () => {
  const r = await runTrialDecode(null, FAKE_SAMPLE, FAKE_CONFIG);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /no-decoder/);
});
ok("probe undefined → pass + skipped /no-decoder/", async () => {
  const r = await runTrialDecode(undefined, FAKE_SAMPLE, FAKE_CONFIG);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /no-decoder/);
});
ok("probe trả true → pass, không skipped /decode-ok/", async () => {
  const r = await runTrialDecode(async () => true, FAKE_SAMPLE, FAKE_CONFIG);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, false);
  assert.match(r.reason, /decode-ok/);
});
ok("probe trả false → FAIL, không skipped /decode-failed/", async () => {
  const r = await runTrialDecode(async () => false, FAKE_SAMPLE, FAKE_CONFIG);
  assert.equal(r.passed, false);
  assert.equal(r.skipped, false);
  assert.match(r.reason, /decode-failed/);
});
ok("probe throw đồng bộ → pass + skipped /probe-error/ (fail-open)", async () => {
  const throwing: GopTrialDecodeProbe = () => {
    throw new Error("decoder nổ tung");
  };
  const r = await runTrialDecode(throwing, FAKE_SAMPLE, FAKE_CONFIG);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /probe-error/);
});
ok("probe reject → pass + skipped /probe-error/ (fail-open)", async () => {
  const r = await runTrialDecode(
    async () => {
      throw new Error("configure lỗi profile");
    },
    FAKE_SAMPLE,
    FAKE_CONFIG,
  );
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /probe-error/);
});
ok("probe treo + timeout 30ms → pass + skipped /timeout-30ms/, có chờ đủ timeout", async () => {
  const hanging: GopTrialDecodeProbe = () => new Promise<boolean>(() => {});
  const t0 = Date.now();
  const r = await runTrialDecode(hanging, FAKE_SAMPLE, FAKE_CONFIG, 30);
  const ms = Date.now() - t0;
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /timeout-30ms/);
  assert.ok(ms >= 25, `timeout bắn quá sớm: ${ms}ms < 25ms`);
  assert.ok(ms < 5000, `timeout chờ quá lâu: ${ms}ms`);
  console.log(`    đo: treo + timeout 30ms → trả sau ${ms}ms`);
});
ok("probe chậm-trả-true (100ms) + timeout 30ms → timeout thắng, pass + skipped", async () => {
  const slow: GopTrialDecodeProbe = async () => {
    await new Promise((r) => setTimeout(r, 100));
    return true;
  };
  const r = await runTrialDecode(slow, FAKE_SAMPLE, FAKE_CONFIG, 30);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /timeout-30ms/);
});
ok("probe nhanh-trả-true (10ms) + timeout 200ms → pass, không skipped", async () => {
  const fast: GopTrialDecodeProbe = async () => {
    await new Promise((r) => setTimeout(r, 10));
    return true;
  };
  const r = await runTrialDecode(fast, FAKE_SAMPLE, FAKE_CONFIG, 200);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, false);
  assert.match(r.reason, /decode-ok/);
});
ok("createBrowserTrialDecodeProbe trong Node → null (không có VideoDecoder)", () => {
  assert.equal(createBrowserTrialDecodeProbe(), null);
});
ok("DEFAULT_TRIAL_DECODE_TIMEOUT_MS = 200", () => {
  assert.equal(DEFAULT_TRIAL_DECODE_TIMEOUT_MS, 200);
});
ok("trialDecodeConfigFromTrack: lấy đúng codec/avcC/kích thước từ track thật", () => {
  const { moov } = buildMoov({ sampleCount: 60 });
  const track = parseMp4VideoTrack(
    moov.buffer.slice(moov.byteOffset, moov.byteOffset + moov.byteLength) as ArrayBuffer,
  );
  const cfg = trialDecodeConfigFromTrack(track);
  assert.equal(cfg.codec, "avc1.64001F");
  assert.equal(cfg.codedWidth, 1280);
  assert.equal(cfg.codedHeight, 720);
  assert.ok(cfg.description.length > 0, "description (avcC) phải có byte");
});

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu bằng tay (sao từ gopFakeMoov54K8.test.ts — cùng
// cấu trúc moov hợp lệ tối thiểu cho demux + tail-scan).
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
/**
 * Mẫu H.264-rác AVCC-đúng-cấu-trúc (sao công thức K8 §3.1 case B):
 * các NAL length-prefix hợp lệ, header 0x41 (type 1, slice non-IDR),
 * payload ngẫu nhiên (LCG seed 123456789). `validateAvccSample` phải
 * qua được mẫu này (nó chỉ kiểm cấu trúc length-prefix) — decoder thật
 * mới là lớp chặn được nó ("wasn't a key frame", 0,5 ms).
 */
function garbageSampleBytes(sampleSize: number): Buffer {
  const out = Buffer.alloc(sampleSize);
  let off = 0;
  let seed = 123456789;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % 256;
  };
  while (off + 4 <= out.length) {
    const len = Math.min(100, out.length - off - 4);
    out[off] = 0;
    out[off + 1] = 0;
    out[off + 2] = 0;
    out[off + 3] = len;
    out[off + 4] = 0x41;
    for (let i = 5; i < 4 + len; i++) out[off + i] = rnd();
    off += 4 + len;
  }
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
function sampleOffsetsFor(count: number, size: number, base = 32): number[] {
  return Array.from({ length: count }, (_, i) => base + i * size);
}

// ---------------------------------------------------------------------------
// Server HTTP Range thật (công thức H4/I6/K8, rút gọn).
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
// Helper: file control + file moov-giả-tinh-vi (sample 0 là H.264-rác
// nhưng AVCC-đúng-cấu-trúc; mọi lớp K8 + AVCC đều qua được nó).
// ---------------------------------------------------------------------------
function buildControlFile(): { file: Buffer; moov: Buffer } {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  return { file, moov };
}
function buildGarbageSample0File(): { file: Buffer; moov: Buffer } {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  // Ghi đè sample 0 (offset 32, size 1000) bằng H.264-rác AVCC-hợp-lệ.
  garbageSampleBytes(1000).copy(payload, 0);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  return { file, moov };
}

/** Probe đếm số lần gọi (để chứng minh trial-decode chỉ chạy đúng 1 lần / bị bỏ qua). */
function countingProbe(result: boolean): { probe: GopTrialDecodeProbe; calls: () => number } {
  let n = 0;
  const probe: GopTrialDecodeProbe = async () => {
    n++;
    return result;
  };
  return { probe, calls: () => n };
}

ok("fixture: mẫu garbage-sample0 QUA được validateAvccSample (đúng lỗ hổng K8 §3.1)", () => {
  const g = garbageSampleBytes(1000);
  assert.equal(validateAvccSample(g, 1000).ok, true);
});

// ---------------------------------------------------------------------------
// T3 thật qua server Range: probe inject quyết định sau khi K8 đã pass.
// ---------------------------------------------------------------------------
ok("control + probe-true → gop-range cả 2 mode, probe gọi đúng 1 lần mỗi mode", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const c1 = countingProbe(true);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c1.probe });
    assert.equal(stream.mode, "gop-range", `stream: kỳ vọng gop-range, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c1.calls(), 1, `stream: probe phải gọi đúng 1 lần, thực tế ${c1.calls()}`);
    const c2 = countingProbe(true);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: c2.probe });
    assert.equal(all.mode, "gop-range", `all: kỳ vọng gop-range, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
    assert.equal(c2.calls(), 1, `all: probe phải gọi đúng 1 lần, thực tế ${c2.calls()}`);
  } finally {
    await srv.close();
  }
});

ok("control + probe-false → full-file /trial-decode/ cả 2 mode (K8 pass, trial-decode chặn)", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => false });
    assert.equal(stream.mode, "full-file", "stream-mode phải fallback khi decoder báo lỗi thật");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => false });
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /trial-decode/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("control + probe-throw → gop-range cả 2 mode (fail-open)", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const throwing: GopTrialDecodeProbe = async () => {
      throw new Error("decoder configure lỗi");
    };
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: throwing });
    assert.equal(stream.mode, "gop-range", `stream: probe lỗi phải fail-open, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: throwing });
    assert.equal(all.mode, "gop-range", `all: probe lỗi phải fail-open, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
  } finally {
    await srv.close();
  }
});

ok("control + probe-treo (timeout 40ms) → gop-range cả 2 mode (fail-open, không kẹt)", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const hanging: GopTrialDecodeProbe = () => new Promise<boolean>(() => {});
    const t0 = Date.now();
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: hanging, trialDecodeTimeoutMs: 40 });
    const msStream = Date.now() - t0;
    assert.equal(stream.mode, "gop-range", `stream: probe treo phải fail-open sau timeout, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const t1 = Date.now();
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: hanging, trialDecodeTimeoutMs: 40 });
    const msAll = Date.now() - t1;
    assert.equal(all.mode, "gop-range", `all: probe treo phải fail-open sau timeout, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
    console.log(`    đo: treo+timeout40ms → stream ${msStream}ms, all ${msAll}ms (đều gop-range)`);
  } finally {
    await srv.close();
  }
});

ok("control + không truyền probe (mặc định Node) → gop-range cả 2 mode (không có VideoDecoder → bỏ qua)", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true });
    assert.equal(stream.mode, "gop-range", `stream: kỳ vọng gop-range, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, {});
    assert.equal(all.mode, "gop-range", `all: kỳ vọng gop-range, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
  } finally {
    await srv.close();
  }
});

ok("control + probe null (opt-out) → gop-range cả 2 mode, probe không chạy", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: null });
    assert.equal(stream.mode, "gop-range");
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: null });
    assert.equal(all.mode, "gop-range");
  } finally {
    await srv.close();
  }
});

ok("moov-giả-tinh-vi (sample 0 H.264-rác, AVCC+K8 đều qua) + probe-false → full-file /trial-decode/ cả 2 mode", async () => {
  const { file } = buildGarbageSample0File();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => false });
    assert.equal(stream.mode, "full-file", "stream-mode phải chặn moov giả tinh vi khi decoder báo lỗi");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => false });
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /trial-decode/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("moov-giả-tinh-vi + probe null (tắt trial-decode) → gop-range cả 2 mode (chứng minh K8+AVCC một mình bỏ lọt)", async () => {
  // Đây là "lỗ hổng" mà L8 đóng: cùng 1 file giả, tắt trial-decode thì
  // T3 vẫn trả gop-range (K8 + AVCC đều qua được nó).
  const { file } = buildGarbageSample0File();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: null });
    assert.equal(stream.mode, "gop-range", `stream: tắt trial-decode thì file giả phải lọt (mới chứng minh được lỗ), nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: null });
    assert.equal(all.mode, "gop-range", `all: tắt trial-decode thì file giả phải lọt, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
  } finally {
    await srv.close();
  }
});

ok("sample 0 lớn (300 KiB, ≤ cap 64 MiB đợt 60 Q5) stream-mode: fetch phần còn lại rồi trial-decode đủ sample → probe-false chặn được", async () => {
  // Đợt 56 M10 đổi hợp đồng: sample 0 trong (256 KiB, 2 MiB] thì T3
  // fetch thêm đúng phần còn lại rồi trial-decode đủ sample (trước đây
  // bỏ qua hẳn). Đợt 57 N10 nâng cap lên 8 MiB và fetch theo chunk
  // 512 KiB — sample 300 KiB vẫn trong cap nên test này không đổi
  // hành vi, chỉ đổi số cap trong ghi chú. Đợt 59 P6 nâng cap lên
  // 32 MiB; đợt 60 Q5 nâng tiếp lên 64 MiB. Sample > 64 MiB vẫn bỏ
  // qua — xem test M10 (b-t3, mẫu 80 MiB) và test N10.
  const { moov } = buildMoov({ sampleCount: 6, sampleSize: 300_000 });
  const payload = zeros(6 * 300_000);
  fillAvccSamples(payload, 32, sampleOffsetsFor(6, 300_000), 300_000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "full-file", `stream: sample 0 = 300000 byte (≤ 64 MiB) phải được trial-decode và chặn khi probe-false, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    assert.equal(c.calls(), 1, `stream: probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
    const c2 = countingProbe(true);
    const stream2 = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c2.probe });
    assert.equal(stream2.mode, "gop-range", `stream: probe-true phải qua, nhận ${stream2.mode === "full-file" ? stream2.reason : stream2.mode}`);
    assert.equal(c2.calls(), 1);
    console.log(`    đo: file=${file.length} byte, sample0=300000 byte ≤ cap 64 MiB → probe 1 lần/mode`);
  } finally {
    await srv.close();
  }
});

ok("sample 0 lớn (>256 KiB cap) all-mode: probe gọi 1 lần trên toàn bộ sample → probe-false chặn được", async () => {
  const { moov } = buildMoov({ sampleCount: 6, sampleSize: 300_000 });
  const payload = zeros(6 * 300_000);
  fillAvccSamples(payload, 32, sampleOffsetsFor(6, 300_000), 300_000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: c.probe });
    assert.equal(all.mode, "full-file", "all-mode có đủ sample 0 nên phải chạy trial-decode và chặn");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /trial-decode/);
    assert.equal(c.calls(), 1, `all: probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
  } finally {
    await srv.close();
  }
});

await runAll();
