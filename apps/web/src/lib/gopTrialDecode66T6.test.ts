// gopTrialDecode66T6.test.ts — Phase 9 đợt 66, luồng T6: khóa biên đúng
// cap trial-decode 64 MiB (nợ docs/PHASE9_ROUND65_LIMITS.md §8 mục 5).
// Công thức timeout worker ở 64 MiB đã khóa ở 62R4/63R4/64R10 (chỉ công
// thức); file này khóa những gì chưa có:
//   (a) T3 stream-mode ở ĐÚNG cap 67.108.864 B: trial VẪN chạy (cap là
//       <=, không phải <) — probe nhận đủ 67.108.864 byte đúng từng byte
//       qua đúng 128 chunk remainder; cap+1 (67.108.865) thì trial bỏ
//       qua, probe không gọi. Builder MP4 tối thiểu sao từ Q5 (đã chuẩn
//       bị sẵn đuôi marker cho đúng cap/cap+1 nhưng Q5 chưa test).
//   (b) Routing planTrialDecodeCall ở đúng 67.108.864 B → worker, 60000 ms.
//   (c) Ghi chú timeout `trialDecodeTimeoutNote` với lookup từ dict ĐÃ
//       GỘP (vi.json/en.json — S6 test bằng fragment tiền-gộp): chuỗi
//       đúng "64.0 MiB ... 60000 ms" cho fixture 64,0 MiB đo headed.
// Không đo decode thật ở đây (đo headed — xem LIMITS đợt 66 T6).
//
// Chạy bằng esbuild bundle (mẫu Q5/R4/S6, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode66T6.test.ts \
//     --bundle --platform=node --format=esm \
//     --outfile=/tmp/round66-t6/t6.test.mjs && node /tmp/round66-t6/t6.test.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  fetchVideoTrackByGopRange,
  trialDecodeTimeoutNote,
  MAX_TRIAL_DECODE_SAMPLE_BYTES,
  MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES,
  MAX_FIRST_SAMPLE_PROBE_BYTES,
  TRIAL_DECODE_SAMPLE_CHUNK_BYTES,
} from "./gopRangeFetch39T3.ts";
import type { GopRangeFetchFn } from "./gopRangeFetch39T3.ts";
import { isTrialDecodeTimeoutReason } from "./gopTrialDecode55L8.ts";
import type { GopTrialDecodeProbe, GopTrialDecodeProbeOutcome } from "./gopTrialDecode55L8.ts";
import {
  planTrialDecodeCall,
  MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS,
} from "./gopTrialDecodeWorker62R4.ts";
import viDict from "../i18n/vi.json";
import enDict from "../i18n/en.json";

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
  console.log(`gopTrialDecode66T6: ${pass}/${queue.length} test pass`);
}

// ---- Lookup từ dict đã gộp (vi.json/en.json) ----
type DictTable = Record<string, unknown>;
function lookupFromDict(lang: "vi" | "en") {
  const dict = (lang === "vi" ? viDict : enDict) as unknown as DictTable;
  return (key: string, vars?: Record<string, string>): string => {
    let cur: unknown = dict;
    for (const part of key.split(".")) {
      if (cur === null || typeof cur !== "object") return key;
      cur = (cur as DictTable)[part];
    }
    if (typeof cur !== "string") return key;
    if (!vars) return cur;
    return cur.replace(/\{(\w+)\}/g, (_, n: string) => vars[n] ?? `{${n}}`);
  };
}

// ---- FakeWorker (sao từ 62R4) ----
class FakeWorker {
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  posted: Array<{ message: Record<string, unknown>; transfer?: readonly unknown[] }> = [];
  terminateCalls = 0;
  postMessage(message: Record<string, unknown>, transfer?: readonly unknown[]): void {
    this.posted.push({ message, transfer });
  }
  terminate(): void {
    this.terminateCalls++;
  }
  respond(outcome: GopTrialDecodeProbeOutcome): void {
    this.onmessage?.({ data: { type: "result", outcome } });
  }
}
function fakeFactory(fake: FakeWorker): () => Worker {
  return () => fake as unknown as Worker;
}
const MAIN_THREAD_PROBE: GopTrialDecodeProbe = async () => true;

// ---------------------------------------------------------------------------
// A. Hằng số biên cap.
// ---------------------------------------------------------------------------
ok("(const) cap trial-decode = đúng 67.108.864 B, tối đa đúng 128 chunk remainder", () => {
  assert.equal(MAX_TRIAL_DECODE_SAMPLE_BYTES, 64 * 1024 * 1024);
  assert.equal(MAX_TRIAL_DECODE_SAMPLE_BYTES, 67_108_864);
  assert.equal(MAX_FIRST_SAMPLE_PROBE_BYTES, 256 * 1024);
  assert.equal(TRIAL_DECODE_SAMPLE_CHUNK_BYTES, 512 * 1024);
  // ceil((67.108.864 − 262.144) / 524.288) = ceil(127,5) = 128.
  assert.equal(MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES, 128);
});

// ---------------------------------------------------------------------------
// B. Routing ở đúng cap.
// ---------------------------------------------------------------------------
ok("(routing) sample đúng 67.108.864 B → worker, timeout 60000 ms (trần)", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 67_108_864,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(plan.timeoutMs, 60_000);
  assert.equal(plan.timeoutMs, MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS);
});

// ---------------------------------------------------------------------------
// C. Ghi chú timeout từ dict đã gộp — chuỗi toast user thấy ở 64,0 MiB.
// ---------------------------------------------------------------------------
ok("(unit-note-dict) lookup vi từ dict đã gộp → đúng chuỗi, size 64.0, timeout 60000", () => {
  const n = trialDecodeTimeoutNote(lookupFromDict("vi"), "timeout-60000ms: ...", 60000, 67_108_864);
  assert.equal(
    n,
    "Keyframe đầu (64.0 MiB) chưa kiểm chứng kịp trong 60000 ms — file vẫn mở bình thường, chỉ là bước kiểm tra keyframe chưa xong.",
  );
});
ok("(unit-note-dict) lookup en từ dict đã gộp → đúng chuỗi, size 64.0, timeout 60000", () => {
  const n = trialDecodeTimeoutNote(lookupFromDict("en"), "timeout-60000ms: ...", 60000, 67_108_864);
  assert.equal(
    n,
    "First keyframe (64.0 MiB) could not be verified within 60000 ms — the file still opens normally; only the keyframe check did not finish.",
  );
});
ok("(unit-reason-dict) lý do timeout-60000ms từ dict vi → helper nhận ra là timeout", () => {
  const reason = lookupFromDict("vi")("gop.trial.timeout", { timeout: "60000" });
  assert.equal(reason, "timeout-60000ms: trial-decode chưa xong, cho qua (fail-open)");
  assert.equal(isTrialDecodeTimeoutReason(reason), true);
});

// ---------------------------------------------------------------------------
// D. Builder MP4 tối thiểu (sao từ Q5 — chỉ dùng cho test biên cap).
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
    if (rem >= 5) {
      out.writeUInt32BE(rem - 4, off);
      out[off + 4] = 0x67;
      out[off + 5] = 0x64;
      out[off + 6] = 0x00;
      out[off + 7] = 0x1f;
      if (rem > 8) out[off + 8] = unit & 0xff;
    } else if (off >= 10) {
      // Đuôi 1–4 byte (vd đúng cap 64 MiB: 67.108.864 % 10 = 4): nối vào
      // NAL của đơn vị trước bằng cách kéo dài length — mẫu vẫn là AVCC
      // hợp lệ tới đúng cuối sample. Cần thiết vì all-mode validate TOÀN
      // BỘ sample (không chỉ tiền tố như stream-mode): đuôi marker cũ
      // ((unit ^ 0xA5)) bị đọc thành length giả 0xC3C3C3C3 → fail oan.
      // NAL payload nối dài bằng 0x00 không đổi header 0x67.
      const prevLen = out.readUInt32BE(off - 10);
      out.writeUInt32BE(prevLen + rem, off - 10);
      for (let i = 0; i < rem; i++) out[off + i] = 0x00;
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
// E. T3 stream-mode ở đúng cap (lỗ hổng Q5 đã chuẩn bị builder nhưng chưa test).
// ---------------------------------------------------------------------------
ok("(t3-cap) sample 0 = 67.108.864 B + probe-true → gop-range, probe nhận đủ 67.108.864 byte đúng từng byte, 129 request sample (1 prefix + 128 chunk)", async () => {
  const { file, expectedSample0 } = buildLargeSampleFile(67_108_864);
  const srv = await serve(file);
  try {
    const c = countingProbe(true);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: sample 0 đúng cap phải được trial-decode và qua khi probe-true, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 1, `probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
    assert.deepEqual(c.sizes(), [67_108_864]);
    assert.deepEqual(
      Buffer.from(c.samples()[0]),
      expectedSample0,
      "probe phải nhận đúng từng byte sample 0 (chunk ráp sai offset là lộ)",
    );
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 129, `phải có 129 request kind "sample" (1 tiền tố + 128 chunk 512 KiB), thực tế ${sampleReqs.length}`);
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
    assert.deepEqual([last.start, last.end], [66846752, 67108895], "chunk cuối (128) phải kết thúc đúng ở cuối sample 0");
    assert.equal(sampleReqs.every((r) => r.status === 206), true);
    console.log(`    đo: 129 request sample, probe nhận 67108864 byte đúng từng byte`);
  } finally {
    await srv.close();
  }
});

ok("(t3-cap) sample 0 = 67.108.864 B + probe-false → full-file /trial-decode/, probe gọi đúng 1 lần", async () => {
  const { file } = buildLargeSampleFile(67_108_864);
  const srv = await serve(file);
  try {
    const c = countingProbe(false);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "full-file", `stream: sample 0 đúng cap phải được trial-decode và chặn khi probe-false, nhận ${stream.mode === "gop-range" ? "gop-range (LỌT)" : stream.mode}`);
    if (stream.mode !== "full-file") return;
    assert.match(stream.reason, /trial-decode/);
    assert.equal(c.calls(), 1, `probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
    assert.deepEqual(c.sizes(), [67_108_864]);
  } finally {
    await srv.close();
  }
});

ok("(t3-cap-plus1) sample 0 = 67.108.865 B + probe-true → gop-range, probe KHÔNG gọi (trial bỏ qua trên cap), chỉ 1 request sample", async () => {
  const { file } = buildLargeSampleFile(67_108_865);
  const srv = await serve(file);
  try {
    const c = countingProbe(true);
    const stream = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: c.probe });
    assert.equal(stream.mode, "gop-range", `stream: sample 0 trên cap phải fail-open qua gop-range, nhận ${stream.mode === "full-file" ? stream.reason : stream.mode}`);
    assert.equal(c.calls(), 0, `trên cap thì trial-decode phải bỏ qua, probe không được gọi, thực tế ${c.calls()} lần`);
    const sampleReqs = stream.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 1, `trên cap thì chỉ fetch tiền tố AVCC, không fetch remainder, thực tế ${sampleReqs.length} request sample`);
    assert.deepEqual([sampleReqs[0].start, sampleReqs[0].end], [32, 262175], "request duy nhất phải là tiền tố AVCC 256 KiB");
  } finally {
    await srv.close();
  }
});

ok("(t3-cap-all) sample 0 = 67.108.864 B + probe-true, all-mode → gop-range, probe nhận đủ 67.108.864 byte, 0 request sample", async () => {
  const { file } = buildLargeSampleFile(67_108_864);
  const srv = await serve(file);
  try {
    const c = countingProbe(true);
    const all = await fetchVideoTrackByGopRange(srv.url, { trialDecodeProbe: c.probe });
    assert.equal(all.mode, "gop-range", `all: probe-true phải qua, nhận ${all.mode === "full-file" ? all.reason : all.mode}`);
    assert.equal(c.calls(), 1, `probe phải gọi đúng 1 lần, thực tế ${c.calls()}`);
    assert.deepEqual(c.sizes(), [67_108_864]);
    const sampleReqs = all.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 0, `all-mode không dùng request kind "sample", thực tế ${sampleReqs.length}`);
  } finally {
    await srv.close();
  }
});

await runAll();
