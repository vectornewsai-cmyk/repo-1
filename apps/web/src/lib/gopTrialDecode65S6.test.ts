// gopTrialDecode65S6.test.ts — Phase 9 đợt 65, luồng S6: đóng nợ LIMITS R10
// đợt 64 §6.4 + §8.6 (luồng R4/R10): (a) lý do fail-open timeout chưa hiển
// thị cho user — T3 nay gắn `trialDecodeNote` vào outcome gop-range khi
// trial-decode hết timeout, controller giữ qua getter `gopTrialDecodeNote` +
// hàm registry `reverseTrialDecodeTimeoutNotes()`, preview toast 1 lần
// (keyed, mẫu warnKey decode-ahead); (b) keyframe 58–64 MiB — đo trực tiếp
// ở harness headed (xem docs/PHASE9_ROUND65_S6_LIMITS.md), test Node này
// chỉ khóa đường ghi chú timeout + fragment, không đo decode.
//
// Chạy bằng esbuild bundle (mẫu Q5/R4, chạy từ gốc repo; file có top-level
// await nên phải bundle --format=esm + outfile .mjs):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode65S6.test.ts \
//     --bundle --platform=node --format=esm \
//     --outfile=/tmp/round65-s6/s6.test.mjs && node /tmp/round65-s6/s6.test.mjs
//
// Fixture MP4 thật gen bằng ffmpeg lúc chạy test (mẫu gopWiring40V2 —
// 320x240 2s faststart, -g 10); T3 gọi qua HTTP server thật trên
// 127.0.0.1 (mẫu Q5 serve). Probe treo (never-resolve) + trialDecodeTimeoutMs
// nhỏ (60 ms) để ép timeout fail-open nhanh mà không cần fixture 60 MiB.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchVideoTrackByGopRange,
  trialDecodeTimeoutNote,
} from "./gopRangeFetch39T3.ts";
import type { GopRangeFetchFn } from "./gopRangeFetch39T3.ts";
import {
  isTrialDecodeTimeoutReason,
  runTrialDecode,
} from "./gopTrialDecode55L8.ts";
import type { GopTrialDecodeProbe } from "./gopTrialDecode55L8.ts";
import {
  ReversePreviewController,
  reverseTrialDecodeTimeoutNotes,
} from "./reverseWebcodecs.ts";
import fragment from "../i18n/fragments/round65-s6.json";

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
  console.log(`gopTrialDecode65S6: ${pass}/${queue.length} test pass`);
}

// ---- Fixture MP4 thật (mẫu gopWiring40V2) ----
const dir = mkdtempSync(join(tmpdir(), "vcut-s6-"));
function makeFixture(name: string): Buffer {
  const out = join(dir, name);
  execFileSync(
    "ffmpeg",
    [
      "-y", "-v", "error",
      "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10",
      "-movflags", "+faststart", out,
    ],
    { stdio: "pipe" },
  );
  return readFileSync(out);
}
const fixture = makeFixture("small.mp4");
console.log(`  fixture: ${fixture.length} byte`);

// ---- HTTP server thật, hỗ trợ Range (mẫu Q5 serve, gọn lại) ----
async function serve(buf: Buffer): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const size = buf.length;
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", size);
      res.writeHead(200);
      res.end();
      return;
    }
    const range = req.headers.range ?? null;
    if (range === null) {
      res.setHeader("Content-Length", size);
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
    const end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (start >= size || start > end) {
      res.setHeader("Content-Range", `bytes */${size}`);
      res.writeHead(416);
      res.end();
      return;
    }
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206);
    res.end(buf.subarray(start, end + 1));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  const port = typeof addr === "object" && addr !== null ? addr.port : 0;
  return {
    url: `http://127.0.0.1:${port}/f.mp4`,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

// ---- Fake fetch in-memory cho controller (mẫu gopWiring40V2, chỉ mode range) ----
interface FakeLog {
  method: string;
  range: string | null;
  status: number;
}
function makeFake(buf: Buffer, log: FakeLog[]): GopRangeFetchFn {
  const headersOf = (entries: Array<[string, string]>) => {
    const m = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
    return { get: (n: string) => m.get(n.toLowerCase()) ?? null };
  };
  return (async (url: string, init?: { method?: string; headers?: Record<string, string> }) => {
    void url;
    const method = (init?.method ?? "GET").toUpperCase();
    const rangeHeader = init?.headers?.Range ?? init?.headers?.range ?? null;
    if (method === "HEAD") {
      log.push({ method: "HEAD", range: null, status: 200 });
      return {
        status: 200,
        ok: true,
        headers: headersOf([
          ["content-length", String(buf.length)],
          ["accept-ranges", "bytes"],
        ]),
        arrayBuffer: async () => new ArrayBuffer(0),
        body: { cancel: async () => {} },
      } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
    }
    if (rangeHeader) {
      const m = /^bytes=(\d+)-(\d+)$/.exec(rangeHeader);
      assert.ok(m, `fake: Range không parse được: ${rangeHeader}`);
      const start = Number(m[1]);
      const end = Number(m[2]);
      const slice = buf.subarray(start, end + 1);
      log.push({ method: "GET", range: rangeHeader, status: 206 });
      return {
        status: 206,
        ok: true,
        headers: headersOf([
          ["content-range", `bytes ${start}-${end}/${buf.length}`],
          ["accept-ranges", "bytes"],
        ]),
        arrayBuffer: async () =>
          slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer,
        body: { cancel: async () => {} },
      } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
    }
    log.push({ method: "GET", range: null, status: 200 });
    return {
      status: 200,
      ok: true,
      headers: headersOf([
        ["content-length", String(buf.length)],
        ["accept-ranges", "bytes"],
      ]),
      arrayBuffer: async () =>
        buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      body: { cancel: async () => {} },
    } as unknown as Awaited<ReturnType<GopRangeFetchFn>>;
  }) as GopRangeFetchFn;
}

// ---- Lookup từ fragment round65-s6 (mô phỏng trạng thái SAU khi parent gộp) ----
type FragTable = { gop: { trial: { timeoutNote: string } } };
function lookupFromFragment(lang: "vi" | "en") {
  const table = (fragment as unknown as { vi: FragTable; en: FragTable })[lang];
  return (key: string, vars?: Record<string, string>): string => {
    const raw = key === "gop.trial.timeoutNote" ? table.gop.trial.timeoutNote : key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, n: string) => vars[n] ?? `{${n}}`);
  };
}
// Lookup "tiền-gộp": key chưa có trong dict nên trả đúng key (hợp đồng t()).
const lookupPreMerge = (key: string, _vars?: Record<string, string>): string => key;

const hangingProbe: GopTrialDecodeProbe = () => new Promise(() => {});
const okProbe: GopTrialDecodeProbe = async () => true;
const failProbe: GopTrialDecodeProbe = async () => false;
const SAMPLE_CONFIG = {
  codec: "avc1.64001F",
  codedWidth: 1280,
  codedHeight: 720,
  description: new Uint8Array(0),
};

// ---------------------------------------------------------------------------
// A. Nhận biết lý do timeout (hợp đồng tiền tố "timeout-<ms>ms").
// ---------------------------------------------------------------------------
ok("(unit-reason) isTrialDecodeTimeoutReason chỉ nhận đúng lý do timeout", () => {
  assert.equal(isTrialDecodeTimeoutReason("timeout-60000ms: trial-decode chưa xong, cho qua (fail-open)"), true);
  assert.equal(isTrialDecodeTimeoutReason("timeout-200ms"), true);
  assert.equal(isTrialDecodeTimeoutReason("timeout-60ms: trial-decode did not finish, skipping (fail-open)"), true);
  assert.equal(isTrialDecodeTimeoutReason("no-decoder: không có probe trial-decode"), false);
  assert.equal(isTrialDecodeTimeoutReason("decode-failed: VideoDecoder không decode được sample 0"), false);
  assert.equal(isTrialDecodeTimeoutReason("unsupported-config: decoder không hỗ trợ codec/profile này — cho qua (fail-open)"), false);
  assert.equal(isTrialDecodeTimeoutReason("probe-error: boom"), false);
  assert.equal(isTrialDecodeTimeoutReason("decode-ok"), false);
  assert.equal(isTrialDecodeTimeoutReason(""), false);
  assert.equal(isTrialDecodeTimeoutReason("timeout-ms: thiếu số"), false);
});

ok("(unit-reason) runTrialDecode + probe treo → reason timeout, helper nhận ra", async () => {
  const r = await runTrialDecode(hangingProbe, new Uint8Array(1000), SAMPLE_CONFIG, 60);
  assert.equal(r.passed, true);
  assert.equal(r.skipped, true);
  assert.match(r.reason, /^timeout-60ms/);
  assert.equal(isTrialDecodeTimeoutReason(r.reason), true);
});

// ---------------------------------------------------------------------------
// B. Soạn ghi chú timeout (fragment vi/en + fallback tiền-gộp).
// ---------------------------------------------------------------------------
ok("(unit-note) lookup vi từ fragment → chuỗi vi, đủ {size} {timeout}", () => {
  const n = trialDecodeTimeoutNote(lookupFromFragment("vi"), "timeout-60000ms: ...", 60000, 62_612_095);
  assert.ok(n.startsWith("Keyframe đầu (59.7 MiB) chưa kiểm chứng kịp trong 60000 ms"), `nhận: ${n}`);
  assert.ok(n.includes("file vẫn mở bình thường"), `nhận: ${n}`);
});

ok("(unit-note) lookup en từ fragment → chuỗi en, đủ {size} {timeout}", () => {
  const n = trialDecodeTimeoutNote(lookupFromFragment("en"), "timeout-60000ms: ...", 60000, 66_731_632);
  assert.ok(n.startsWith("First keyframe (63.6 MiB) could not be verified within 60000 ms"), `nhận: ${n}`);
  assert.ok(n.includes("file still opens normally"), `nhận: ${n}`);
});

ok("(unit-note) lookup tiền-gộp (trả đúng key) → rớt về lý do timeout đã localize", () => {
  const reason = "timeout-60000ms: trial-decode chưa xong, cho qua (fail-open)";
  assert.equal(trialDecodeTimeoutNote(lookupPreMerge, reason, 60000, 62_612_095), reason);
});

ok("(unit-note) không lookup → rớt về lý do timeout (fallback VI của runTrialDecode)", () => {
  const reason = "timeout-60ms: trial-decode chưa xong, cho qua (fail-open)";
  assert.equal(trialDecodeTimeoutNote(undefined, reason, 60, 3000), reason);
});

// ---------------------------------------------------------------------------
// C. Fragment round65-s6: đúng 1 key, vi/en khớp placeholder, vi khác en.
// ---------------------------------------------------------------------------
ok("(fragment) round65-s6.json: 1 key gop.trial.timeoutNote, placeholder khớp", () => {
  const f = fragment as unknown as { vi: FragTable; en: FragTable };
  const placeholders = (s: string): string[] =>
    [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  assert.equal(f.vi.gop.trial.timeoutNote.length > 0, true);
  assert.equal(f.en.gop.trial.timeoutNote.length > 0, true);
  assert.notEqual(f.vi.gop.trial.timeoutNote, f.en.gop.trial.timeoutNote);
  assert.deepEqual(placeholders(f.vi.gop.trial.timeoutNote), ["size", "timeout"]);
  assert.deepEqual(placeholders(f.en.gop.trial.timeoutNote), ["size", "timeout"]);
});

// ---------------------------------------------------------------------------
// D. T3 stream-mode: timeout → ghi chú; decode-ok / probe null → không ghi chú.
// ---------------------------------------------------------------------------
ok("(t3-stream) probe treo + timeout 60ms (không lookup) → gop-range + note = lý do timeout", async () => {
  const srv = await serve(fixture);
  try {
    const t0 = Date.now();
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fixture.length,
      trialDecodeProbe: hangingProbe,
      trialDecodeTimeoutMs: 60,
      streamGops: true,
    });
    const ms = Date.now() - t0;
    assert.equal(out.mode, "gop-range", `phải fail-open về gop-range, nhận mode=${out.mode}`);
    assert.equal(
      out.trialDecodeNote,
      "timeout-60ms: trial-decode chưa xong, cho qua (fail-open)",
      `note phải là lý do timeout, nhận: ${out.trialDecodeNote}`,
    );
    assert.ok(ms >= 55 && ms < 5000, `phải chờ ~60 ms vì timeout, thực tế ${ms} ms`);
    console.log(`    đo: stream timeout → note "${out.trialDecodeNote}", chờ ${ms} ms`);
  } finally {
    await srv.close();
  }
});

ok("(t3-stream) probe treo + lookup vi từ fragment → note là chuỗi vi thân thiện", async () => {
  const srv = await serve(fixture);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fixture.length,
      trialDecodeProbe: hangingProbe,
      trialDecodeTimeoutMs: 60,
      streamGops: true,
      lookup: lookupFromFragment("vi"),
    });
    assert.equal(out.mode, "gop-range");
    assert.ok(out.trialDecodeNote?.startsWith("Keyframe đầu ("), `nhận: ${out.trialDecodeNote}`);
    assert.ok(out.trialDecodeNote?.includes("chưa kiểm chứng kịp trong 60 ms"), `nhận: ${out.trialDecodeNote}`);
    assert.ok(!out.trialDecodeNote?.startsWith("timeout-"), "note thân thiện không lộ tiền tố timeout-");
  } finally {
    await srv.close();
  }
});

ok("(t3-stream) probe treo + lookup en từ fragment → note là chuỗi en", async () => {
  const srv = await serve(fixture);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fixture.length,
      trialDecodeProbe: hangingProbe,
      trialDecodeTimeoutMs: 60,
      streamGops: true,
      lookup: lookupFromFragment("en"),
    });
    assert.equal(out.mode, "gop-range");
    assert.ok(out.trialDecodeNote?.startsWith("First keyframe ("), `nhận: ${out.trialDecodeNote}`);
    assert.ok(out.trialDecodeNote?.includes("within 60 ms"), `nhận: ${out.trialDecodeNote}`);
  } finally {
    await srv.close();
  }
});

ok("(t3-stream) probe decode-ok → gop-range, KHÔNG có trường trialDecodeNote", async () => {
  const srv = await serve(fixture);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fixture.length,
      trialDecodeProbe: okProbe,
      trialDecodeTimeoutMs: 60,
      streamGops: true,
    });
    assert.equal(out.mode, "gop-range");
    assert.equal("trialDecodeNote" in out, false, "decode-ok thì không được mang ghi chú timeout");
  } finally {
    await srv.close();
  }
});

ok("(t3-stream) probe decode-failed → full-file fallback (không phải ghi chú)", async () => {
  const srv = await serve(fixture);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fixture.length,
      trialDecodeProbe: failProbe,
      trialDecodeTimeoutMs: 60,
      streamGops: true,
    });
    assert.equal(out.mode, "full-file");
    assert.match(out.reason, /trial-decode/);
  } finally {
    await srv.close();
  }
});

ok("(t3-stream) probe null (tắt trial-decode) → gop-range, KHÔNG có ghi chú", async () => {
  const srv = await serve(fixture);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fixture.length,
      trialDecodeProbe: null,
      streamGops: true,
    });
    assert.equal(out.mode, "gop-range");
    assert.equal("trialDecodeNote" in out, false, "không chạy trial thì không có ghi chú timeout");
  } finally {
    await srv.close();
  }
});

// ---------------------------------------------------------------------------
// E. T3 all-mode: timeout → ghi chú (cùng đường như stream).
// ---------------------------------------------------------------------------
ok("(t3-all) probe treo + timeout 60ms → gop-range + note = lý do timeout", async () => {
  const srv = await serve(fixture);
  try {
    const out = await fetchVideoTrackByGopRange(srv.url, {
      knownSizeBytes: fixture.length,
      trialDecodeProbe: hangingProbe,
      trialDecodeTimeoutMs: 60,
    });
    assert.equal(out.mode, "gop-range");
    assert.equal(out.trialDecodeNote, "timeout-60ms: trial-decode chưa xong, cho qua (fail-open)");
  } finally {
    await srv.close();
  }
});

// ---------------------------------------------------------------------------
// F. Controller (Node): không có VideoDecoder → trial skip no-decoder,
//    không timeout → getter null, registry không có ghi chú.
// ---------------------------------------------------------------------------
ok("(controller) gop-range ở Node: gopTrialDecodeNote null, registry rỗng", async () => {
  const log: FakeLog[] = [];
  const fresh = new ReversePreviewController("fake://s6-fresh.mp4", 15, {
    knownFileSizeBytes: fixture.length,
    gopRangeEnabled: true,
    gopThresholdBytes: 1024,
    gopFetchImpl: makeFake(fixture, log),
  });
  assert.equal(fresh.gopTrialDecodeNote, null, "chưa thử GOP thì note phải null");
  const done = await fresh.ensureWindowForTime(1.0);
  assert.equal(done, false, "Node không có VideoDecoder nên decode cửa sổ trả false (fail-soft)");
  assert.equal(fresh.gopMode, "gop-range");
  assert.equal(fresh.gopFallbackReason, null);
  assert.equal(
    fresh.gopTrialDecodeNote,
    null,
    "Node skip trial vì no-decoder (không phải timeout) nên không có ghi chú",
  );
  assert.deepEqual(reverseTrialDecodeTimeoutNotes(), [], "registry không có ghi chú timeout nào");
  fresh.dispose();
});

await runAll();
