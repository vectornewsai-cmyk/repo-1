// gopTrialDecode56M10.test.ts — Phase 9 đợt 56, luồng M10: đóng 3 nợ L8.
//
// (a) Moov giả sửa timestamp (stts) vẫn lọt qua K8 + trial-decode:
//     lớp kiểm mới `validateSampleTimestamps` (mp4Demux.ts) đối chiếu
//     stts với mdhd/mvhd + hình dạng delta; T3 fallback full-file với
//     lý do /timestamp/ (chỉ fallback, không ném lỗi — giữ fail-open).
//     Trial-decode sample giữa/cuối KHÔNG bắt được lớp này (byte thật
//     nên decode vẫn OK) — có test chứng minh điều đó, xem cuối file.
// (b) Sample 0 > 256 KiB ở stream-mode: T3 fetch thêm đúng phần còn
//     lại của sample 0 (1 request Range kind "sample") khi s0.size ≤
//     cap mới 2 MiB rồi trial-decode đủ sample; > 2 MiB vẫn bỏ qua
//     (fail-open, giữ hành vi cũ). — Đợt 57 N10 nâng cap lên 8 MiB
//     và fetch phần còn lại theo chunk 512 KiB (xem test N10); test
//     "(b-t3) sample 0 = 3 MiB" trong file này đã đổi mẫu lên 9 MiB
//     để giữ ý nghĩa "trên cap → bỏ qua". — Đợt 59 P6 nâng cap lên
//     32 MiB; test đó đổi mẫu lên 40 MiB để giữ ý nghĩa "trên cap".
//     Đợt 60 Q5 nâng cap lên 64 MiB; test đó đổi mẫu lên 80 MiB
//     để giữ ý nghĩa "trên cap".
// (c) False-positive profile lạ: probe trả thêm kết quả
//     "unsupported-config" (VideoDecoder.isConfigSupported báo không
//     hỗ trợ, hoặc lỗi configure/decode mang thông điệp unsupported) →
//     runTrialDecode fail-open (pass + skipped), T3 không chặn oan.
//
// Chạy bằng esbuild bundle (mẫu L8, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode56M10.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/m10.test.mjs \
//     && node <scratch>/m10.test.mjs
// Nếu ESM ném ERR_REQUIRE_CYCLE_MODULE thì bundle lại --format=cjs.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { fetchVideoTrackByGopRange } from "./gopRangeFetch39T3.ts";
import {
  createBrowserTrialDecodeProbe,
  DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  isUnsupportedDecoderMessage,
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
  validateSampleTimestamps,
} from "./mp4Demux.ts";
import type { Mp4VideoTrack } from "./mp4Demux.ts";

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
  console.log(`gopTrialDecode56M10: ${pass}/${queue.length} test pass`);
}

const FAKE_CONFIG: TrialDecodeConfig = {
  codec: "avc1.64001F",
  codedWidth: 1280,
  codedHeight: 720,
  description: new Uint8Array([0x01, 0x64, 0x00, 0x1f]),
};
const FAKE_SAMPLE = new Uint8Array([0x00, 0x00, 0x00, 0x06, 0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9]);

// ---------------------------------------------------------------------------
// Unit: validateSampleTimestamps — đối chiếu stts với mdhd/mvhd + delta.
// ---------------------------------------------------------------------------
function fakeTrack(opts: {
  durations: number[];
  timescale?: number;
  mdhdDuration?: number | null;
  mvhdDuration?: number | null;
  movieTimescale?: number | null;
}): Mp4VideoTrack {
  const timescale = opts.timescale ?? 1000;
  const durations = opts.durations;
  const durationUnits = durations.reduce((a, b) => a + b, 0);
  let t = 0;
  const samples = durations.map((d, i) => {
    const s = {
      index: i,
      offset: i * 1000,
      size: 1000,
      timestamp: t,
      duration: d,
      isKey: i % 30 === 0,
      presentationTimestamp: t,
    };
    t += d;
    return s;
  });
  return {
    codec: "avc1.64001F",
    description: new Uint8Array([0x01, 0x64, 0x00, 0x1f]),
    timescale,
    width: 1280,
    height: 720,
    samples,
    durationUnits,
    durationSec: timescale > 0 ? durationUnits / timescale : 0,
    editList: [],
    movieTimescale: opts.movieTimescale ?? 1000,
    cttsTotal: null,
    stssOutOfRange: 0,
    mdhdDuration: opts.mdhdDuration ?? durationUnits,
    mvhdDuration: opts.mvhdDuration ?? durationUnits,
  };
}
const UNIFORM_60 = Array.from({ length: 60 }, () => 1000);

ok("(a-unit) track nhất quán (stts==mdhd==mvhd, delta đều) → ok", () => {
  assert.equal(validateSampleTimestamps(fakeTrack({ durations: UNIFORM_60 })).ok, true);
});
ok("(a-unit) mdhd dài hơn stts đúng 1 frame (như file keyframe-video thật) → ok (trong dung sai)", () => {
  const durations = Array.from({ length: 150 }, () => 512);
  const r = validateSampleTimestamps(fakeTrack({ durations, timescale: 15360, mdhdDuration: 76800 + 512, mvhdDuration: 5000, movieTimescale: 1000 }));
  assert.equal(r.ok, true, `phải qua: ${r.reason ?? ""}`);
});
ok("(a-unit) mdhd bằng một nửa stts (stts bị nhân đôi, mdhd không sửa) → FAIL /mdhd/", () => {
  const r = validateSampleTimestamps(fakeTrack({ durations: UNIFORM_60, mdhdDuration: 30000 }));
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /mdhd/);
  console.log(`    đo: lý do=${r.reason}`);
});
ok("(a-unit) mdhd vắng (null) → bỏ qua kiểm mdhd, vẫn ok", () => {
  assert.equal(validateSampleTimestamps(fakeTrack({ durations: UNIFORM_60, mdhdDuration: null })).ok, true);
});
ok("(a-unit) mvhd lệch 0,01s (audio dài hơn video chút, như file thật có audio) → ok", () => {
  const durations = Array.from({ length: 1549 }, () => 1001);
  const total = 1549 * 1001;
  const r = validateSampleTimestamps(fakeTrack({ durations, timescale: 24000, mvhdDuration: 3101696, movieTimescale: 48000 }));
  assert.equal(r.ok, true, `phải qua: ${r.reason ?? ""}`);
  console.log(`    đo: durationSec=${(total / 24000).toFixed(3)}s, mvhd=${(3101696 / 48000).toFixed(3)}s`);
});
ok("(a-unit) mvhd bằng một nửa thời lượng video → FAIL /mvhd/", () => {
  const r = validateSampleTimestamps(fakeTrack({ durations: UNIFORM_60, mvhdDuration: 30000 }));
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /mvhd/);
});
ok("(a-unit) mvhd vắng (null) → bỏ qua kiểm mvhd, vẫn ok", () => {
  assert.equal(validateSampleTimestamps(fakeTrack({ durations: UNIFORM_60, mvhdDuration: null })).ok, true);
});
ok("(a-unit) 1 delta khổng lồ (100s giữa các frame 1s, mdhd đã sửa khớp) → FAIL /delta/", () => {
  const durations = [100000, ...Array.from({ length: 59 }, () => 1000)];
  const total = 100000 + 59000;
  const r = validateSampleTimestamps(fakeTrack({ durations, mdhdDuration: total, mvhdDuration: total }));
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /delta/);
  console.log(`    đo: lý do=${r.reason}`);
});
ok("(a-unit) delta 0 → FAIL /delta/", () => {
  const durations = [0, ...Array.from({ length: 59 }, () => 1000)];
  const r = validateSampleTimestamps(fakeTrack({ durations }));
  assert.equal(r.ok, false);
  assert.match(r.reason ?? "", /delta/);
});
ok("(a-unit) VFR thật (30×500ms + 30×1500ms, mdhd/mvhd khớp) → ok (không chặn oan)", () => {
  const durations = [...Array.from({ length: 30 }, () => 500), ...Array.from({ length: 30 }, () => 1500)];
  assert.equal(validateSampleTimestamps(fakeTrack({ durations })).ok, true);
});
ok("(a-unit) track rỗng (0 sample) → ok (T3 tự xử lý rỗng ở nơi khác)", () => {
  assert.equal(validateSampleTimestamps(fakeTrack({ durations: [] })).ok, true);
});

// ---------------------------------------------------------------------------
// Unit: runTrialDecode + phân loại "unsupported-config" (c).
// ---------------------------------------------------------------------------
ok("(c-unit) probe trả 'unsupported-config' → pass + skipped /unsupported-config/ (fail-open)", async () => {
  const probe = (async () => "unsupported-config") as unknown as GopTrialDecodeProbe;
  const r = await runTrialDecode(probe, FAKE_SAMPLE, FAKE_CONFIG);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /unsupported-config/);
});
ok("(c-unit) probe trả false vẫn FAIL như cũ (không nhầm thành unsupported)", async () => {
  const r = await runTrialDecode(async () => false, FAKE_SAMPLE, FAKE_CONFIG);
  assert.equal(r.passed, false);
  assert.equal(r.skipped, false);
  assert.match(r.reason, /decode-failed/);
});
ok("(c-unit) isUnsupportedDecoderMessage phân loại đúng thông điệp lỗi", () => {
  assert.equal(isUnsupportedDecoderMessage("Unsupported profile"), true);
  assert.equal(isUnsupportedDecoderMessage("The provided codec parameters are not supported"), true);
  assert.equal(isUnsupportedDecoderMessage("Failed to execute 'configure' on 'VideoDecoder': Unsupported video codec"), true);
  assert.equal(isUnsupportedDecoderMessage("wasn't a key frame"), false);
  assert.equal(isUnsupportedDecoderMessage("Unable to determine size of bitstream buffer"), false);
  assert.equal(isUnsupportedDecoderMessage(""), false);
});
ok("(c-unit) createBrowserTrialDecodeProbe trong Node vẫn null (không có VideoDecoder)", () => {
  assert.equal(createBrowserTrialDecodeProbe(), null);
});
ok("DEFAULT_TRIAL_DECODE_TIMEOUT_MS vẫn = 200 (không đổi)", () => {
  assert.equal(DEFAULT_TRIAL_DECODE_TIMEOUT_MS, 200);
});

// ---------------------------------------------------------------------------
// Builder MP4 tối thiểu (sao từ L8, thêm tham số stts/mdhd/mvhd để dựng
// moov-giả-sửa-timestamp). Moov hợp lệ tối thiểu cho demux + tail-scan.
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
  /** Mặc định [[N, 1000]]; đổi để dựng moov-giả-sửa-stts. */
  sttsEntries?: Array<[number, number]>;
  /** Mặc định = tổng stts; đổi để dựng moov-giả (vd giữ nguyên khi stts bị sửa). */
  mdhdDuration?: number;
  /** Mặc định = tổng stts (movie timescale = timescale); đổi tương tự. */
  mvhdDuration?: number;
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
  const sttsEntries = opts.sttsEntries ?? [[N, 1000] as [number, number]];
  const sttsTotal = sttsEntries.reduce((a, [c, d]) => a + c * d, 0);
  const mdhdDuration = opts.mdhdDuration ?? sttsTotal;
  const mvhdDuration = opts.mvhdDuration ?? sttsTotal;
  const stbl = box("stbl",
    stsdBox(),
    sttsBox(sttsEntries),
    stssBox(keys),
    stscBox([[1, chunkSamples, 1]]),
    stszBox(sampleSize, N, Array.from({ length: N }, () => sampleSize)),
    stcoBox(chunkOffsets));
  const minf = box("minf",
    box("vmhd", u32(1), zeros(6)),
    box("dinf", box("dref", u32(0), u32(1), box("url ", u32(1)))),
    stbl);
  const mdia = box("mdia", mdhdBox(timescale, mdhdDuration),
    box("hdlr", u32(0), u32(0), Buffer.from("vide", "ascii"), zeros(12), Buffer.from("VideoHandler\0", "ascii")),
    minf);
  const trak = box("trak", tkhdBox(sttsTotal), mdia);
  const moov = box("moov", mvhdBox(timescale, mvhdDuration), trak);
  return { moov, sampleCount: N };
}

function ftypBox(): Buffer {
  return box("ftyp", Buffer.from("isom", "ascii"), u32(0x200), Buffer.from("isom", "ascii"), Buffer.from("iso2", "ascii"));
}

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
// Server HTTP Range thật (công thức H4/I6/K8/L8, rút gọn).
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

function buildControlFile(): { file: Buffer; moov: Buffer } {
  const { moov } = buildMoov({ sampleCount: 60 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  return { file, moov };
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

// ---------------------------------------------------------------------------
// T3 thật qua server Range: (a) moov-giả-sửa-stts.
// ---------------------------------------------------------------------------
ok("(a-t3) stts bị sửa một nửa (mdhd/mvhd giữ nguyên) + probe-true → full-file /timestamp/ cả 2 mode", async () => {
  // stts [[60,500]] → durationUnits 30000, mdhd/mvhd vẫn 60000: lệch 50%.
  const { moov } = buildMoov({ sampleCount: 60, sttsEntries: [[60, 500]], mdhdDuration: 60000, mvhdDuration: 60000 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "full-file", `stream: stts-giả phải bị chặn, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /timestamp/);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => true });
    assert.equal(all.mode, "full-file");
    if (all.mode !== "full-file") return;
    assert.match(all.reason, /timestamp/);
    console.log(`    đo: stream lý do=${stream.reason}`);
  } finally {
    await srv.close();
  }
});

ok("(a-t3) stts bị sửa một nửa + probe null (không trial-decode) → vẫn full-file /timestamp/ (lớp kiểm không cần decoder)", async () => {
  const { moov } = buildMoov({ sampleCount: 60, sttsEntries: [[60, 500]], mdhdDuration: 60000, mvhdDuration: 60000 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: null });
    assert.equal(stream.mode, "full-file", "không cần decoder vẫn phải chặn được stts-giả");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /timestamp/);
  } finally {
    await srv.close();
  }
});

ok("(a-t3) 1 delta khổng lồ (100s) + mdhd/mvhd đã sửa khớp → full-file /timestamp/ (hình dạng delta bắt được)", async () => {
  const { moov } = buildMoov({
    sampleCount: 60,
    sttsEntries: [[1, 100000], [59, 1000]],
    mdhdDuration: 159000,
    mvhdDuration: 159000,
  });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "full-file", "1 delta khổng lồ phải bị chặn dù mdhd đã sửa khớp");
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /timestamp/);
  } finally {
    await srv.close();
  }
});

ok("(a-t3) control nhất quán (stts==mdhd==mvhd) + probe-true → gop-range cả 2 mode (không chặn oan file thật)", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "gop-range", `stream: file thật phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: async () => true });
    assert.equal(all.mode, "gop-range", `all: file thật phải qua, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
  } finally {
    await srv.close();
  }
});

ok("(a-t3) NỢ CÒN LẠI: đổi tỉ lệ đều toàn bộ stts + sửa khớp mdhd/mvhd → vẫn gop-range (không có ground-truth fps thì không bắt được)", async () => {
  // Kẻ giả sửa stts [[60,500]] VÀ mdhd/mvhd về 30000: mọi đối chiếu nội
  // bộ đều khớp. Đây là giới hạn đã biết, ghi rõ trong LIMITS (cần
  // SPS VUI timing làm ground-truth mới bắt được — việc của đợt sau).
  const { moov } = buildMoov({ sampleCount: 60, sttsEntries: [[60, 500]], mdhdDuration: 30000, mvhdDuration: 30000 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "gop-range", "đổi tỉ lệ đều + sửa khớp mdhd/mvhd là nợ còn lại, hiện vẫn lọt (ghi rõ, không mạo nhận)");
  } finally {
    await srv.close();
  }
});

ok("(a-t3) NỢ CÒN LẠI: hoán đổi 2 delta VFR (giữ nguyên tổng/mdhd/mvhd) → vẫn gop-range", async () => {
  const { moov } = buildMoov({ sampleCount: 60, sttsEntries: [[30, 1500], [30, 500]], mdhdDuration: 60000, mvhdDuration: 60000 });
  const payload = zeros(600_000);
  fillAvccSamples(payload, 32, defaultSampleOffsets(), 1000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: async () => true });
    assert.equal(stream.mode, "gop-range", "hoán đổi delta giữ nguyên tổng là nợ còn lại, hiện vẫn lọt (ghi rõ trong LIMITS)");
  } finally {
    await srv.close();
  }
});

ok("(a-t3) trial-decode sample giữa của file stts-giả vẫn PASS (byte thật) — chứng minh decode không bắt được lớp này", async () => {
  // Lấy byte sample 30 thật từ file control, decode thử bằng probe-true:
  // probe pass → đúng như kỳ vọng (byte thật decode OK). Lớp bắt được
  // stts-giả là đối chiếu timestamp, không phải trial-decode thêm sample.
  const { file, moov } = buildControlFile();
  const track = parseMp4VideoTrack(
    moov.buffer.slice(moov.byteOffset, moov.byteOffset + moov.byteLength) as ArrayBuffer,
  );
  const s30 = track.samples[30];
  // Sample 30 nằm trong payload mdat: offset tuyệt đối trong file =
  // ftyp(24) + mdat header(8) + (offset trong payload). Builder đặt
  // chunkOffsets tính từ đầu file với base 32 = 24+8, nên offset tuyệt
  // đối chính là s30.offset.
  const bytes = new Uint8Array(file.buffer.slice(file.byteOffset + s30.offset, file.byteOffset + s30.offset + s30.size));
  assert.equal(validateAvccSample(bytes, s30.size).ok, true, "sample 30 thật phải qua AVCC");
  const r = await runTrialDecode(async () => true, bytes, trialDecodeConfigFromTrack(track));
  assert.equal(r.passed, true, "decode sample giữa thật phải pass — nên nó không thể bắt stts-giả");
  assert.equal(r.skipped, false);
});

// ---------------------------------------------------------------------------
// T3 thật qua server Range: (b) sample 0 lớn ở stream-mode.
// ---------------------------------------------------------------------------
ok("(b-t3) sample 0 = 300000 byte (≤ cap 2 MiB mới) stream-mode: probe nhận ĐỦ 300000 byte, probe-false → full-file /trial-decode/", async () => {
  const { moov } = buildMoov({ sampleCount: 6, sampleSize: 300_000 });
  const payload = zeros(6 * 300_000);
  fillAvccSamples(payload, 32, sampleOffsetsFor(6, 300_000), 300_000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "full-file", `stream: sample 0 lớn nhưng ≤ 2 MiB phải được trial-decode và chặn khi probe-false, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    assert.equal(c.calls(), 1, `probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
    assert.deepEqual(c.sizes(), [300_000], `probe phải nhận đủ sample 0 (300000 byte), thực tế ${JSON.stringify(c.sizes())}`);
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 2, `phải có 2 request kind "sample" (tiền tố + phần còn lại), thực tế ${sampleReqs.length}`);
    console.log(`    đo: sample requests=${JSON.stringify(sampleReqs.map((r) => [r.start, r.end]))}`);
  } finally {
    await srv.close();
  }
});

ok("(b-t3) sample 0 = 300000 byte stream-mode + probe-true → gop-range (không chặn oan)", async () => {
  const { moov } = buildMoov({ sampleCount: 6, sampleSize: 300_000 });
  const payload = zeros(6 * 300_000);
  fillAvccSamples(payload, 32, sampleOffsetsFor(6, 300_000), 300_000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const c = countingProbe(true);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: probe-true phải qua, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 1);
    assert.deepEqual(c.sizes(), [300_000]);
  } finally {
    await srv.close();
  }
});

ok("(b-t3) sample 0 = 80 MiB (> cap 64 MiB đợt 60 Q5) stream-mode: probe KHÔNG gọi (vẫn bỏ qua, fail-open) → gop-range", async () => {
  // Đợt 57 N10 đổi hợp đồng: cap nâng 2 MiB → 8 MiB nên test này đổi
  // mẫu từ 3 MiB (giờ nằm TRONG cap, đã có test N10 riêng) lên 9 MiB
  // để giữ đúng ý nghĩa "sample 0 > cap → bỏ qua". Đợt 59 P6 nâng
  // cap lên 64 MiB nên test này đổi mẫu lên 80 MiB với cùng ý nghĩa.
  const { moov } = buildMoov({ sampleCount: 1, sampleSize: 80_000_000 });
  const payload = zeros(80_000_000);
  fillAvccSamples(payload, 32, sampleOffsetsFor(1, 80_000_000), 80_000_000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: sample 0 > 64 MiB phải bỏ qua trial-decode (fail-open), nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 0, `probe phải KHÔNG gọi khi sample 0 > cap 64 MiB, thực tế ${c.calls()} lần`);
    console.log(`    đo: file=${file.length} byte, sample0=80000000 byte > cap 64 MiB → probe 0 lần`);
  } finally {
    await srv.close();
  }
});

ok("(b-t3) fetch phần còn lại của sample 0 lỗi (416) → bỏ qua trial-decode, gop-range (fail-open)", async () => {
  const { moov } = buildMoov({ sampleCount: 6, sampleSize: 300_000 });
  const payload = zeros(6 * 300_000);
  fillAvccSamples(payload, 32, sampleOffsetsFor(6, 300_000), 300_000);
  const file = Buffer.concat([ftypBox(), box("mdat", payload), moov]);
  const srv = await serve(file);
  try {
    // fetchImpl: chặn đúng request phần còn lại của sample 0 (bắt đầu
    // ở offset 32+262144), còn lại đi qua fetch thật của server.
    const flaky: typeof fetch = (async (input: unknown, init?: unknown) => {
      const headers = (init as { headers?: Record<string, string> } | undefined)?.headers;
      const range = headers?.Range ?? (headers as Record<string, string> | undefined)?.range;
      if (typeof range === "string" && range.startsWith("bytes=262176-")) {
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
      fetchImpl: flaky as unknown as Parameters<typeof fetchVideoTrackByGopRange>[1]["fetchImpl"],
    });
    assert.equal(stream.mode, "gop-range", `stream: lỗi fetch phần còn lại phải fail-open, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 0, `probe phải KHÔNG gọi khi không fetch đủ sample 0, thực tế ${c.calls()} lần`);
  } finally {
    await srv.close();
  }
});

// ---------------------------------------------------------------------------
// T3 thật qua server Range: (c) probe "unsupported-config" → fail-open.
// ---------------------------------------------------------------------------
ok("(c-t3) probe trả 'unsupported-config' → gop-range cả 2 mode (không chặn oan file profile lạ)", async () => {
  const { file } = buildControlFile();
  const srv = await serve(file);
  try {
    const unsupported = (async () => "unsupported-config") as unknown as GopTrialDecodeProbe;
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: unsupported });
    assert.equal(stream.mode, "gop-range", `stream: unsupported-config phải fail-open, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: unsupported });
    assert.equal(all.mode, "gop-range", `all: unsupported-config phải fail-open, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
  } finally {
    await srv.close();
  }
});

await runAll();
