// test_round78_f8_keyframe_protocol.test.ts — Phase 9 đợt 78, luồng F8:
// Keyframe / trial-decode protocol (đóng nợ đợt 77 §4.8).
//
// (a) Worker protocol carried only a boolean, so the zero-run scan reason
//     was lost on the worker path (T3 saw generic `decode-failed`):
//     fixed by adding an optional `reason` to `TrialDecodeWorkerResponse`
//     + a structured probe failure `{ failed: true, reason }` that
//     `runTrialDecode` passes through verbatim to T3. Backward compatible:
//     an old worker (no `reason`) still yields plain `decode-failed`.
// (b) Sample > 64 MiB is still skipped by design — locked here with a
//     discriminating case: a cap+1 sample WITH a zero-run inside must
//     still be skipped (gop-range, probe never called, prefix fetch only),
//     proving the skip is by size, not by content.
// (c)+(d) are headed measurements (Firefox trial-decode, lossless-vs-lossy
//     anomaly) — see LIMITS F8, not this Node suite (Node has no
//     VideoDecoder / Worker global).
//
// Run with esbuild bundle (same pattern as E7/R4, from repo root):
//   ./node_modules/.bin/esbuild apps/web/src/lib/test_round78_f8_keyframe_protocol.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/f8.test.mjs \
//     && node <scratch>/f8.test.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  MAX_FIRST_SAMPLE_PROBE_BYTES,
  MAX_TRIAL_DECODE_SAMPLE_BYTES,
  fetchVideoTrackByGopRange,
} from "./gopRangeFetch39T3.ts";
import { runTrialDecode } from "./gopTrialDecode55L8.ts";
import type {
  GopTrialDecodeProbe,
  GopTrialDecodeProbeOutcome,
  TrialDecodeConfig,
} from "./gopTrialDecode55L8.ts";
import { createWorkerTrialDecodeProbe } from "./gopTrialDecodeWorker62R4.ts";

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
  console.log(`test_round78_f8_keyframe_protocol: ${pass}/${queue.length} test pass`);
}

const FAKE_CONFIG: TrialDecodeConfig = {
  codec: "avc1.64001F",
  codedWidth: 1280,
  codedHeight: 720,
  description: new Uint8Array([0, 0, 0, 1, 103, 100, 0, 31]),
};

function fakeSample(size: number): Uint8Array {
  const b = new Uint8Array(size);
  for (let i = 0; i < size; i++) b[i] = i % 251;
  return b;
}

const ZERO_RUN_REASON =
  "zero-run: zero-run 1048576 bytes at offset 4317235 in NAL payload (emulation-prevention violation)";

/** Fake worker (pattern from R4 test): driven by the test via respond(). */
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
  respond(data: Record<string, unknown>): void {
    this.onmessage?.({ data });
  }
  respondResult(outcome: GopTrialDecodeProbeOutcome, reason?: string): void {
    this.respond(
      reason === undefined
        ? { type: "result", outcome }
        : { type: "result", outcome, reason },
    );
  }
}

function fakeFactory(fake: FakeWorker): () => Worker {
  return () => fake as unknown as Worker;
}

const MAIN_THREAD_PROBE: GopTrialDecodeProbe = async () => true;

// ---------------------------------------------------------------------------
// (a) runTrialDecode + structured probe failure.
// ---------------------------------------------------------------------------
ok("(a) runTrialDecode: probe returns {failed:true, reason} -> passed=false, reason kept verbatim", async () => {
  const probe: GopTrialDecodeProbe = async () => ({ failed: true, reason: ZERO_RUN_REASON });
  const r = await runTrialDecode(probe, fakeSample(1000), FAKE_CONFIG, 5000);
  assert.equal(r.passed, false);
  assert.equal(r.skipped, false);
  assert.equal(r.reason, ZERO_RUN_REASON);
});
ok("(a) runTrialDecode: structured failure with empty reason -> falls back to decode-failed", async () => {
  const probe: GopTrialDecodeProbe = async () => ({ failed: true, reason: "" });
  const r = await runTrialDecode(probe, fakeSample(1000), FAKE_CONFIG, 5000);
  assert.equal(r.passed, false);
  assert.equal(r.skipped, false);
  assert.match(r.reason, /^decode-failed/);
});
ok("(a) runTrialDecode: probe false -> decode-failed unchanged (regression)", async () => {
  const probe: GopTrialDecodeProbe = async () => false;
  const r = await runTrialDecode(probe, fakeSample(1000), FAKE_CONFIG, 5000);
  assert.equal(r.passed, false);
  assert.equal(r.skipped, false);
  assert.equal(r.reason, "decode-failed: VideoDecoder không decode được sample 0");
});
ok("(a) runTrialDecode: probe true -> decode-ok; unsupported-config -> fail-open skipped", async () => {
  const okProbe: GopTrialDecodeProbe = async () => true;
  const r1 = await runTrialDecode(okProbe, fakeSample(1000), FAKE_CONFIG, 5000);
  assert.equal(r1.passed, true);
  assert.equal(r1.skipped, false);
  assert.equal(r1.reason, "decode-ok");
  const unsupProbe: GopTrialDecodeProbe = async () => "unsupported-config";
  const r2 = await runTrialDecode(unsupProbe, fakeSample(1000), FAKE_CONFIG, 5000);
  assert.equal(r2.passed, true);
  assert.equal(r2.skipped, true);
  assert.match(r2.reason, /^unsupported-config/);
});

// ---------------------------------------------------------------------------
// (a) Worker probe: reason transport + backward compatibility.
// ---------------------------------------------------------------------------
ok("(a) worker probe: result {outcome:false, reason} -> structured failure {failed:true, reason}, terminate 1x", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  assert.notEqual(probe, null);
  const p = probe!(fakeSample(1000), FAKE_CONFIG);
  fake.respondResult(false, ZERO_RUN_REASON);
  const outcome = await p;
  assert.deepEqual(outcome, { failed: true, reason: ZERO_RUN_REASON });
  assert.equal(fake.terminateCalls, 1);
});
ok("(a) worker probe + runTrialDecode: zero-run reason survives to T3-facing result", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const p = runTrialDecode(probe, fakeSample(1000), FAKE_CONFIG, 5000);
  await new Promise((r) => setTimeout(r, 0));
  fake.respondResult(false, ZERO_RUN_REASON);
  const result = await p;
  assert.equal(result.passed, false);
  assert.equal(result.skipped, false);
  assert.equal(result.reason, ZERO_RUN_REASON);
  assert.equal(fake.terminateCalls, 1);
});
ok("(a) worker probe backward compat: result {outcome:false} without reason -> plain boolean false -> decode-failed", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const p = runTrialDecode(probe, fakeSample(1000), FAKE_CONFIG, 5000);
  await new Promise((r) => setTimeout(r, 0));
  fake.respondResult(false);
  const result = await p;
  assert.equal(result.passed, false);
  assert.equal(result.skipped, false);
  assert.equal(result.reason, "decode-failed: VideoDecoder không decode được sample 0");
  assert.equal(fake.terminateCalls, 1);
});
ok("(a) worker probe: reason ignored when outcome is true", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const p = probe!(fakeSample(1000), FAKE_CONFIG);
  fake.respondResult(true, ZERO_RUN_REASON);
  assert.equal(await p, true);
  assert.equal(fake.terminateCalls, 1);
});
ok("(a) worker probe: reason ignored when outcome is unsupported-config", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const p = probe!(fakeSample(1000), FAKE_CONFIG);
  fake.respondResult("unsupported-config", ZERO_RUN_REASON);
  assert.equal(await p, "unsupported-config");
  assert.equal(fake.terminateCalls, 1);
});
ok("(a) worker probe: reason longer than 200 chars is truncated to 200", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const longReason = `zero-run: ${"x".repeat(300)}`;
  const p = probe!(fakeSample(1000), FAKE_CONFIG);
  fake.respondResult(false, longReason);
  const outcome = await p;
  assert.equal(typeof outcome, "object");
  assert.equal((outcome as { reason: string }).reason.length, 200);
});

// ---------------------------------------------------------------------------
// Minimal MP4 builder (trimmed from E7 — single sample, 1280x720).
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
function buildMoov(sampleSize: number, sampleCount = 1): Buffer {
  const N = sampleCount;
  const chunkSamples = 30;
  const chunks = Math.max(1, Math.ceil(N / chunkSamples));
  const chunkOffsets = Array.from({ length: chunks }, (_, i) => 32 + i * chunkSamples * sampleSize);
  const keys = Array.from({ length: Math.ceil(N / 30) }, (_, i) => i * 30 + 1);
  const sttsTotal = N * 1000;
  const stbl = box("stbl",
    box("stsd", u32(0), u32(1),
      (() => {
        const fixed = Buffer.concat([
          zeros(6), u16(1), u16(0), u16(0), zeros(12),
          u16(1280), u16(720), u32(0x00480000), u32(0x00480000), u32(0),
          u16(1), zeros(32), u16(0x0018), u16(0xffff),
        ]);
        const avcC = box("avcC", Buffer.from([
          0x01, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0x00, 0x08,
          0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9, 0x40, 0x78, 0x01, 0x00, 0x04,
          0x68, 0xeb, 0xe3, 0xcb, 0x22,
        ]));
        const body = Buffer.concat([fixed, avcC]);
        const out = Buffer.alloc(8 + body.length);
        out.writeUInt32BE(8 + body.length, 0);
        out.write("avc1", 4, 4, "ascii");
        body.copy(out, 8);
        return out;
      })()),
    box("stts", u32(0), u32(1), u32(N), u32(1000)),
    box("stss", u32(0), u32(keys.length), ...keys.map((k) => u32(k))),
    box("stsc", u32(0), u32(1), u32(1), u32(chunkSamples), u32(1)),
    box("stsz", u32(0), u32(sampleSize), u32(N)),
    box("stco", u32(0), u32(chunkOffsets.length), ...chunkOffsets.map((o) => u32(o))));
  const minf = box("minf",
    box("vmhd", u32(1), zeros(6)),
    box("dinf", box("dref", u32(0), u32(1), box("url ", u32(1)))),
    stbl);
  const mdia = box("mdia",
    box("mdhd", u32(0), u32(0), u32(0), u32(1000), u32(sttsTotal), u16(0x55c4), u16(0)),
    box("hdlr", u32(0), u32(0), Buffer.from("vide", "ascii"), zeros(12), Buffer.from("VideoHandler\0", "ascii")),
    minf);
  const trak = box("trak",
    box("tkhd", u32(0x00000007), u32(0), u32(0), u32(1), u32(0), u32(sttsTotal),
      zeros(8), u16(0), u16(0), u16(0), u16(0), UNITY_MATRIX,
      u32(1280 << 16), u32(720 << 16)),
    mdia);
  return box("moov",
    box("mvhd", u32(0), u32(0), u32(0), u32(1000), u32(sttsTotal),
      u32(0x00010000), u16(0x0100), u16(0), zeros(8), UNITY_MATRIX, zeros(24), u32(2)),
    trak);
}
function ftypBox(): Buffer {
  return box("ftyp", Buffer.from("isom", "ascii"), u32(0x200), Buffer.from("isom", "ascii"), Buffer.from("iso2", "ascii"));
}
/** Valid AVCC pattern sample (same construction as E7): 10-byte SPS NALs. */
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
  if (typeof addr !== "object" || addr === null) throw new Error("server failed to bind a port");
  return {
    url: `http://127.0.0.1:${addr.port}/file.mp4`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
function countingProbe(result: GopTrialDecodeProbeOutcome): {
  probe: GopTrialDecodeProbe;
  calls: () => number;
} {
  let n = 0;
  const probe: GopTrialDecodeProbe = async () => {
    n++;
    return result;
  };
  return { probe, calls: () => n };
}

// ---------------------------------------------------------------------------
// (a) T3 integration: injected probe returning a structured zero-run failure.
// ---------------------------------------------------------------------------
ok("(a-t3) stream, injected probe returns structured zero-run failure -> full-file, reason keeps zero-run", async () => {
  const sample0 = avccPatternBytes(1024 * 1024);
  const file = Buffer.concat([
    ftypBox(),
    box("mdat", sample0),
    buildMoov(sample0.length, 1),
  ]);
  const srv = await serve(file);
  try {
    const p = countingProbe({ failed: true, reason: ZERO_RUN_REASON });
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    assert.equal(out.mode, "full-file", `structured failure must fallback, got ${out.mode}`);
    assert.match(out.reason, /zero-run/, `reason must keep zero-run, got ${out.reason}`);
    assert.match(out.reason, /4317235/, `reason must keep the scan offset, got ${out.reason}`);
    assert.equal(p.calls(), 1);
    console.log(`    measured: structured-failure T3 -> ${out.mode}, reason=${out.reason}`);
  } finally {
    await srv.close();
  }
});

// ---------------------------------------------------------------------------
// (b) Sample > 64 MiB: skipped by design, regardless of content.
// ---------------------------------------------------------------------------
ok("(b) stream, sample 0 = cap+1 (67,108,865 B) WITH a zero-run inside -> still gop-range, probe 0x, prefix fetch only", async () => {
  const t0 = Date.now();
  const size = MAX_TRIAL_DECODE_SAMPLE_BYTES + 1;
  const payload = avccPatternBytes(size);
  payload.fill(0, 512 * 1024, 512 * 1024 + 1024); // zero-run past the 256 KiB AVCC prefix
  const file = Buffer.concat([ftypBox(), box("mdat", payload), buildMoov(size, 1)]);
  const srv = await serve(file);
  try {
    const p = countingProbe(true);
    const out = await fetchVideoTrackByGopRange(srv.url, { streamGops: true, trialDecodeProbe: p.probe });
    const ms = Date.now() - t0;
    assert.equal(out.mode, "gop-range", `over-cap must skip trial-decode even with zero-run inside, got ${out.mode}`);
    assert.equal(p.calls(), 0, "probe must never be called for over-cap samples");
    const sampleReqs = out.requests.filter((r) => r.kind === "sample");
    assert.equal(sampleReqs.length, 1, `over-cap fetches only the AVCC prefix, got ${sampleReqs.length} sample requests`);
    assert.equal(sampleReqs[0].bytes, MAX_FIRST_SAMPLE_PROBE_BYTES);
    console.log(`    measured: stream cap+1 with zero-run inside -> gop-range, probe 0x, 1 sample request / ${sampleReqs[0].bytes} B, total ${ms} ms (skip is by size, not content)`);
  } finally {
    await srv.close();
  }
});

await runAll();
