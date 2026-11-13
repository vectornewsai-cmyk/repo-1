// gopTrialDecode67U5.test.ts — Phase 9 đợt 67, luồng U5: khóa trần mới
// 90 s + toast timeout hiện ngay khi note được set (nợ docs/PHASE9_ROUND66_LIMITS.md
// §8 mục 5 — xem LIMITS U5 đợt 67).
//
//   (a) Trần worker 60 s → 90 s, tỉ lệ 1,2 ms/KiB GIỮ NGUYÊN: công thức ở
//       64 MiB cho 78.536 ms (không chạm trần 90 s); biên mới so với số đo
//       trực tiếp đợt 66 T6 (tải thấp 40,4–50,3 s): 28,2 s; so với ngoại
//       suy tải trung bình ~60–66 s: ~12,5 s.
//   (b) Ghi chú timeout `trialDecodeTimeoutNote` với lookup từ dict ĐÃ
//       GỘP ở timeout thật mới 78536 ms: chuỗi toast user thấy ở 64,0 MiB.
//   (c) Subscription `subscribeTrialDecodeTimeoutNotes`: controller set
//       note (probe treo → timeout fail-open) thì listener được gọi NGAY,
//       không chờ tick rAF — khóa sửa toast T6 §3 (clip ngắn / không phát
//       ngược thì vòng lặp ngủ, toast không hiện). Dùng file MP4 tối thiểu
//       + probe treo để ép timeout ở 212 ms mà không cần VideoDecoder thật.
// Builder MP4 tối thiểu sao từ 66T6 (gốc Q5).
//
// Chạy bằng esbuild bundle (mẫu Q5/R4/S6/T6, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode67U5.test.ts \
//     --bundle --platform=node --format=esm \
//     --outfile=/tmp/round67-u5/u5.test.mjs && node /tmp/round67-u5/u5.test.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  fetchVideoTrackByGopRange,
  trialDecodeTimeoutNote,
} from "./gopRangeFetch39T3.ts";
import { isTrialDecodeTimeoutReason } from "./gopTrialDecode55L8.ts";
import type { GopTrialDecodeProbe } from "./gopTrialDecode55L8.ts";
import {
  planTrialDecodeCall,
  MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS,
  trialDecodeTimeoutForSampleSizeWorker,
} from "./gopTrialDecodeWorker62R4.ts";
import {
  getReversePreviewController,
  reverseTrialDecodeTimeoutNotes,
  subscribeTrialDecodeTimeoutNotes,
  disposeReverseWebcodecsControllers,
} from "./reverseWebcodecs.ts";
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
  console.log(`gopTrialDecode67U5: ${pass}/${queue.length} test pass`);
}

// ---- Lookup từ dict đã gộp (vi.json/en.json) — mẫu 66T6 ----
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
}
function fakeFactory(fake: FakeWorker): () => Worker {
  return () => fake as unknown as Worker;
}
const MAIN_THREAD_PROBE: GopTrialDecodeProbe = async () => true;

// ---------------------------------------------------------------------------
// A. Trần mới 90 s + biên so với số đo thật.
// ---------------------------------------------------------------------------
ok("(cap90) hằng số trần = 90000 ms, tỉ lệ 1,2 ms/KiB giữ nguyên", () => {
  assert.equal(MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS, 90_000);
});

ok("(cap90) 64 MiB → timeout 78536 ms (công thức, KHÔNG chạm trần 90 s)", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(64 * 1024 * 1024, 200), 78_536);
  assert.ok(78_536 < MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS);
});

ok("(cap90) biên tải thấp: 78536 − 50345,7 (lần đo chậm nhất đợt 66 T6) = 28190 ms ≥ 28000", () => {
  // Số đo trực tiếp headed đợt 66 T6, tải thấp: direct 40.408,6 ms và
  // 50.345,7 ms. Trần 60 s cũ chỉ còn biên ~11,5 s (60.000 − 48.513,6
  // ở capped plan); trần mới cho biên 28,2 s ở lần đo chậm nhất.
  const slowestLowLoadMs = 50_345.7;
  const timeoutMs = trialDecodeTimeoutForSampleSizeWorker(64 * 1024 * 1024, 200);
  const marginMs = timeoutMs - slowestLowLoadMs;
  assert.ok(marginMs >= 28_000, `biên tải thấp ${marginMs} ms < 28000 ms`);
  console.log(`    đo: timeout 64 MiB ${timeoutMs} ms, biên tải thấp ${marginMs.toFixed(1)} ms`);
});

ok("(cap90) biên tải trung bình ngoại suy: 78536 − 66000 ≈ 12536 ms ≥ 12000", () => {
  // Ngoại suy tải trung bình từ đợt 64 R10 (0,92–1,00 ms/KiB ở 57,9 MiB):
  // 64 MiB ≈ 60–66 s — đã ở/quá trần 60 s cũ. Trần mới còn biên ~12,5 s
  // ở mốc ngoại suy cao nhất 66 s.
  const mediumLoadExtrapolationMs = 66_000;
  const timeoutMs = trialDecodeTimeoutForSampleSizeWorker(64 * 1024 * 1024, 200);
  const marginMs = timeoutMs - mediumLoadExtrapolationMs;
  assert.ok(marginMs >= 12_000, `biên tải trung bình ngoại suy ${marginMs} ms < 12000 ms`);
});

ok("(cap90) routing 64 MiB → worker, timeout 78536 ms (dưới trần 90 s)", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 67_108_864,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(plan.timeoutMs, 78_536);
  assert.ok(plan.timeoutMs < MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS);
});

// ---------------------------------------------------------------------------
// B. Ghi chú timeout ở timeout thật mới 78536 ms (chuỗi toast user thấy).
// ---------------------------------------------------------------------------
ok("(note-78536) lookup vi → đúng chuỗi, size 64.0, timeout 78536", () => {
  const n = trialDecodeTimeoutNote(lookupFromDict("vi"), "timeout-78536ms: ...", 78536, 67_108_864);
  assert.equal(
    n,
    "Keyframe đầu (64.0 MiB) chưa kiểm chứng kịp trong 78536 ms — file vẫn mở bình thường, chỉ là bước kiểm tra keyframe chưa xong.",
  );
});
ok("(note-78536) lookup en → đúng chuỗi, size 64.0, timeout 78536", () => {
  const n = trialDecodeTimeoutNote(lookupFromDict("en"), "timeout-78536ms: ...", 78536, 67_108_864);
  assert.equal(
    n,
    "First keyframe (64.0 MiB) could not be verified within 78536 ms — the file still opens normally; only the keyframe check did not finish.",
  );
});
ok("(note-78536) lý do timeout-78536ms từ dict vi → helper nhận ra là timeout", () => {
  const reason = lookupFromDict("vi")("gop.trial.timeout", { timeout: "78536" });
  assert.equal(reason, "timeout-78536ms: trial-decode chưa xong, cho qua (fail-open)");
  assert.equal(isTrialDecodeTimeoutReason(reason), true);
});

// ---------------------------------------------------------------------------
// C. Builder MP4 tối thiểu (sao từ 66T6 — chỉ dùng cho test subscription).
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
function buildSmallSampleFile(sampleSize: number, sampleCount = 2): Buffer {
  const { moov } = buildMoov({ sampleCount, sampleSize });
  const payload = zeros(sampleCount * sampleSize);
  fillPatternSamples(payload, 32, sampleOffsetsFor(sampleCount, sampleSize), sampleSize);
  return Buffer.concat([ftypBox(), box("mdat", payload), moov]);
}

// ---------------------------------------------------------------------------
// D. Subscription: probe treo → timeout fail-open → listener gọi ngay.
// ---------------------------------------------------------------------------
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

ok("(sub) probe treo → controller set note → listener được gọi ngay + registry đọc được note", async () => {
  // Sample 300.148 B: timeout main-thread = 200 + ceil((300.148 −
  // 262.144)/1024 × 0,3) = 212 ms (probe inject → không đi worker).
  // Probe treo không bao giờ resolve → runTrialDecode timeout ở 212 ms
  // → T3 ghi note → controller set note → notify subscriber.
  const file = buildSmallSampleFile(300_148);
  const srv = await serve(file);
  try {
    const hangingProbe: GopTrialDecodeProbe = () =>
      new Promise<Awaited<ReturnType<GopTrialDecodeProbe>>>(() => {});
    let calls = 0;
    const unsub = subscribeTrialDecodeTimeoutNotes(() => {
      calls++;
    });
    const c = getReversePreviewController(srv.url, file.length, {
      gopRangeEnabled: true,
      gopThresholdBytes: 1,
      trialDecodeProbe: hangingProbe,
      i18nLookup: lookupFromDict("vi"),
    });
    // ensureWindowForTime chạy nền: đường GOP set note TRƯỚC khi decode
    // cửa sổ (không có VideoDecoder ở Node nên decode sau đó có thể lỗi
    // — không quan trọng, chỉ poll note/subscriber).
    void c.ensureWindowForTime(0).catch(() => {});
    const t0 = Date.now();
    while (calls === 0 && Date.now() - t0 < 10_000) await sleep(50);
    assert.equal(calls, 1, `listener phải được gọi đúng 1 lần sau khi note set, thực tế ${calls}`);
    const notes = reverseTrialDecodeTimeoutNotes();
    assert.equal(notes.length, 1, `registry phải có đúng 1 note, thực tế ${JSON.stringify(notes)}`);
    assert.match(notes[0], /^Keyframe đầu \(0\.3 MiB\) chưa kiểm chứng kịp trong 212 ms/);
    unsub();
    disposeReverseWebcodecsControllers();
    assert.deepEqual(reverseTrialDecodeTimeoutNotes(), [], "dispose xong registry phải rỗng");
    console.log(`    đo: listener gọi sau ~${Date.now() - t0} ms chờ (timeout trial 212 ms)`);
  } finally {
    await srv.close();
  }
});

ok("(sub) unsubscribe thì không gọi nữa; listener lỗi không chặn listener khác", async () => {
  const file = buildSmallSampleFile(300_148);
  const srv = await serve(file);
  try {
    const hangingProbe: GopTrialDecodeProbe = () =>
      new Promise<never>(() => {});
    let goodCalls = 0;
    let badCalls = 0;
    const unsubGood = subscribeTrialDecodeTimeoutNotes(() => {
      goodCalls++;
    });
    subscribeTrialDecodeTimeoutNotes(() => {
      badCalls++;
      throw new Error("listener lỗi cố ý");
    });
    // Hủy listener tốt TRƯỚC khi note set → chỉ listener lỗi được gọi.
    unsubGood();
    const c = getReversePreviewController(srv.url, file.length, {
      gopRangeEnabled: true,
      gopThresholdBytes: 1,
      trialDecodeProbe: hangingProbe,
      i18nLookup: lookupFromDict("vi"),
    });
    void c.ensureWindowForTime(0).catch(() => {});
    const t0 = Date.now();
    while (badCalls === 0 && Date.now() - t0 < 10_000) await sleep(50);
    assert.equal(badCalls, 1, `listener lỗi phải được gọi 1 lần, thực tế ${badCalls}`);
    assert.equal(goodCalls, 0, `listener đã hủy không được gọi, thực tế ${goodCalls}`);
    assert.equal(reverseTrialDecodeTimeoutNotes().length, 1, "note vẫn phải set dù 1 listener ném lỗi");
    disposeReverseWebcodecsControllers();
  } finally {
    await srv.close();
  }
});

ok("(sub) probe trả true → không timeout → không note, listener không gọi", async () => {
  const file = buildSmallSampleFile(300_148);
  const srv = await serve(file);
  try {
    let calls = 0;
    const unsub = subscribeTrialDecodeTimeoutNotes(() => {
      calls++;
    });
    const c = getReversePreviewController(srv.url, file.length, {
      gopRangeEnabled: true,
      gopThresholdBytes: 1,
      trialDecodeProbe: async () => true,
      i18nLookup: lookupFromDict("vi"),
    });
    void c.ensureWindowForTime(0).catch(() => {});
    await sleep(1500);
    assert.equal(calls, 0, `không timeout thì listener không được gọi, thực tế ${calls}`);
    assert.deepEqual(reverseTrialDecodeTimeoutNotes(), [], "không timeout thì registry rỗng");
    unsub();
    disposeReverseWebcodecsControllers();
  } finally {
    await srv.close();
  }
});

await runAll();
