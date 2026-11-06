// gopBlobUrl49E2.test.ts — Phase 9 đợt 49, luồng E2: khóa đỏ-trước/
// xanh-sau cho gate GOP trên blob: URL (đóng nợ D4 §6.1).
//
// BỐI CẢNH (D4 §2.3, đã chứng minh bằng probe đối chứng, không đoán):
// Chrome KHÔNG gửi header `Accept-Ranges` cho blob: URL (HEAD còn ném
// TypeError), nhưng Range trả 206 + Content-Range đúng + đúng byte.
// Gate cũ đòi đúng header "bytes" trước tail-scan nên đường GOP không
// bao giờ bật cho file import local — đúng đường production của tính
// năng này. Test này mô phỏng đúng hành vi blob: URL đó bằng mock
// fetch (HEAD ném TypeError, Range → 206 KHÔNG có header
// Accept-Ranges, GET không Range → 200 toàn file) và khóa:
//   - gate chấp nhận "Range đã chứng minh bằng probe/prefix 206" thay
//     cho header VẮNG (null), nhưng KHÔNG thay cho header khẳng định
//     "none" (tuyên bố rõ ràng của server vẫn thắng — test cũ T3
//     "Accept-Ranges none dù Range vẫn 206" giữ nguyên);
//   - T3 trên blob: URL cho cả file faststart lẫn trailing (moov ngoài
//     tiền tố 512 KiB → đi tail-scan) đều ra gop-range, 0 GET toàn file;
//   - controller nối vào cũng gop-range (Node thiếu VideoDecoder nên
//     ensureWindowForTime trả false fail-soft như mẫu V2 — chỉ khóa
//     gopMode/ready, KHÔNG mạo nhận đã decode).
//
// Chạy bằng esbuild bundle (mẫu V2, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopBlobUrl49E2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/e2.test.cjs \
//     && node <scratch>/e2.test.cjs
//
// Fixture ffmpeg thật (công thức T3), chỉ nằm trong os.tmpdir(), KHÔNG
// đưa vào repo (cấm binary). Fixture trailing PHẢI đủ lớn để moov nằm
// ngoài tiền tố 512 KiB (không thì test khóa nhầm nhánh moov-trailing
// của file nhỏ — xem tiền điều kiện trong test 6).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  detectMoovPosition,
  resolveRangeGopFetch,
} from "./reverseRangeGate38U2.ts";
import {
  fetchVideoTrackByGopRange,
  type GopRangeFetchFn,
  type GopRangeResponse,
} from "./gopRangeFetch39T3.ts";
import { ReversePreviewController } from "./reverseWebcodecs.ts";

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
  console.log(`gopBlobUrl49E2: ${pass}/${queue.length} test pass`);
}

// ---- Fixture: ffmpeg thật ----
const dir = mkdtempSync(join(tmpdir(), "vcut-e2-"));
function makeFixture(
  name: string,
  faststart: boolean,
  sizeArg: string,
  duration: number,
  gop: number,
): Buffer {
  const out = join(dir, name);
  const args = [
    "-y", "-v", "error",
    "-f", "lavfi", "-i", `testsrc2=size=${sizeArg}:rate=30:duration=${duration}`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", String(gop), "-crf", "18",
  ];
  if (faststart) args.push("-movflags", "+faststart");
  args.push(out);
  execFileSync("ffmpeg", args, { stdio: "pipe" });
  return readFileSync(out);
}
const fastBuf = makeFixture("faststart.mp4", true, "320x240", 2, 10);
// Trailing LỚN: 640x360 10 s, testsrc2 nhiễu → mdat vài MiB, moov chắc
// chắn ngoài tiền tố 512 KiB (xem tiền điều kiện test 6).
const trailBigBuf = makeFixture("trailing-big.mp4", false, "640x360", 10, 30);
console.log(
  `  fixture faststart: ${fastBuf.length} byte, trailing-big: ${trailBigBuf.length} byte ` +
  `(ffmpeg testsrc2, -g 30, crf 18, KHÔNG faststart)`,
);

// ---- Mock fetch mô phỏng đúng hành vi blob: URL trên Chrome (D4 §2.3) ----
interface BlobCall { method: string; range: string | null; status: number }
function blobLikeFetch(
  buf: Buffer,
  log: BlobCall[],
  opts: { ignoreRange?: boolean } = {},
): GopRangeFetchFn {
  const headersOf = (entries: Array<[string, string]>) => {
    const m = new Map(entries.map(([k, v]) => [k.toLowerCase(), v]));
    return { get: (n: string) => m.get(n.toLowerCase()) ?? null };
  };
  const sliceBuf = (start: number, end: number): ArrayBuffer => {
    const s = buf.subarray(start, end + 1);
    return s.buffer.slice(s.byteOffset, s.byteOffset + s.byteLength) as ArrayBuffer;
  };
  return (async (url: string, init?: { method?: string; headers?: Record<string, string> }) => {
    void url;
    const method = (init?.method ?? "GET").toUpperCase();
    const rangeHeader = init?.headers?.Range ?? init?.headers?.range ?? null;
    // Chrome KHÔNG hỗ trợ HEAD trên blob: URL — ném TypeError (D4 §2.3).
    if (method === "HEAD") {
      log.push({ method: "HEAD", range: null, status: -1 });
      throw new TypeError("Failed to fetch");
    }
    if (rangeHeader) {
      const m = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
      assert.ok(m, `blob-mock: Range không parse được: ${rangeHeader}`);
      const start = Number(m[1]);
      const end = m[2] === "" ? buf.length - 1 : Math.min(Number(m[2]), buf.length - 1);
      if (opts.ignoreRange) {
        // Server phớt lờ Range: trả 200 toàn file (bằng chứng 206 là giả).
        log.push({ method: "GET", range: rangeHeader, status: 200 });
        return {
          status: 200,
          ok: true,
          headers: headersOf([["content-length", String(buf.length)]]),
          arrayBuffer: async () => sliceBuf(0, buf.length - 1),
          body: { cancel: async () => {} },
        } as unknown as GopRangeResponse;
      }
      log.push({ method: "GET", range: rangeHeader, status: 206 });
      // QUAN TRỌNG: KHÔNG gửi header Accept-Ranges — blob: URL luôn
      // trả null cho header này dù Range chạy đúng (D4 §2.3).
      return {
        status: 206,
        ok: true,
        headers: headersOf([
          ["content-range", `bytes ${start}-${end}/${buf.length}`],
        ]),
        arrayBuffer: async () => sliceBuf(start, end),
        body: { cancel: async () => {} },
      } as unknown as GopRangeResponse;
    }
    // GET không Range trên blob: URL: trả 200 toàn bộ file — T3 đúng
    // ra KHÔNG BAO GIỜ gọi đường này; test khóa bằng log.
    log.push({ method: "GET", range: null, status: 200 });
    return {
      status: 200,
      ok: true,
      headers: headersOf([["content-length", String(buf.length)]]),
      arrayBuffer: async () => sliceBuf(0, buf.length - 1),
      body: { cancel: async () => {} },
    } as unknown as GopRangeResponse;
  }) as GopRangeFetchFn;
}

// ---- 1. Gate: bằng chứng 206 thay cho header VẮNG, không thay cho header "none" ----
ok("gate: faststart + header VẮNG (null) + probe 206 đã chứng minh → range-gop-attempt", () => {
  const d = resolveRangeGopFetch({
    moovPosition: "faststart",
    acceptRanges: null,
    knownSizeBytes: 12345,
    rangeProvenByVerifiedProbe: true,
  });
  assert.equal(d.mode, "range-gop-attempt");
  assert.equal(d.eligible, true);
});

ok("gate: header khẳng định 'none' + probe 206 → VẪN full-file (tuyên bố rõ ràng thắng hành vi)", () => {
  const d = resolveRangeGopFetch({
    moovPosition: "faststart",
    acceptRanges: "none",
    knownSizeBytes: 12345,
    rangeProvenByVerifiedProbe: true,
  });
  assert.equal(d.mode, "full-file");
  assert.match(d.reasons.join("; "), /accept-ranges-unsupported/);
});

ok("gate: header VẮNG + KHÔNG có bằng chứng 206 → full-file như cũ (không giả định)", () => {
  const d = resolveRangeGopFetch({
    moovPosition: "faststart",
    acceptRanges: null,
    knownSizeBytes: 12345,
  });
  assert.equal(d.mode, "full-file");
  assert.match(d.reasons.join("; "), /accept-ranges-unknown/);
  const d2 = resolveRangeGopFetch({
    moovPosition: "faststart",
    acceptRanges: undefined,
    knownSizeBytes: 12345,
    rangeProvenByVerifiedProbe: false,
  });
  assert.equal(d2.mode, "full-file");
  assert.match(d2.reasons.join("; "), /accept-ranges-unknown/);
});

ok("gate: header 'bytes' như cũ → range-gop-attempt (không cần bằng chứng 206)", () => {
  const d = resolveRangeGopFetch({
    moovPosition: "faststart",
    acceptRanges: "bytes",
    knownSizeBytes: 12345,
  });
  assert.equal(d.mode, "range-gop-attempt");
});

// ---- 2. T3 trên blob: URL ----
ok("T3 blob: faststart → gop-range, 0 GET toàn file (chỉ probe/prefix/GOP đều Range 206)", async () => {
  const log: BlobCall[] = [];
  const out = await fetchVideoTrackByGopRange("blob:fake-faststart", {
    fetchImpl: blobLikeFetch(fastBuf, log),
    knownSizeBytes: fastBuf.length,
  });
  assert.equal(out.mode, "gop-range", out.mode === "full-file" ? `fallback: ${out.reason}` : "");
  if (out.mode === "gop-range") {
    assert.equal(out.sampleCount, 60);
    assert.equal(out.gops.length, 6);
  }
  assert.equal(log.filter((l) => l.method === "GET" && l.range === null).length, 0,
    `không được có GET toàn file, log: ${JSON.stringify(log)}`);
  assert.ok(log.every((l) => l.method === "HEAD" || (l.method === "GET" && l.range !== null && l.status === 206)),
    `mọi GET phải là Range 206, log: ${JSON.stringify(log)}`);
});

ok("T3 blob: trailing lớn (moov ngoài tiền tố 512 KiB) → gop-range qua tail-scan, 0 GET toàn file", async () => {
  // TIỀN ĐIỀU KIỆN khóa đúng nhánh: moov KHÔNG nằm trong tiền tố mặc
  // định (unknown) — nếu fixture quá nhỏ thì test này đang khóa nhầm
  // nhánh moov-trailing của file nhỏ (B4: file nhỏ vẫn fallback).
  const prefix = new Uint8Array(trailBigBuf.subarray(0, 512 * 1024));
  assert.equal(detectMoovPosition(prefix), "unknown",
    `fixture trailing phải đủ lớn để moov ngoài tiền tố 512 KiB (size=${trailBigBuf.length})`);
  const log: BlobCall[] = [];
  const out = await fetchVideoTrackByGopRange("blob:fake-trailing-big", {
    fetchImpl: blobLikeFetch(trailBigBuf, log),
    knownSizeBytes: trailBigBuf.length,
  });
  assert.equal(out.mode, "gop-range", out.mode === "full-file" ? `fallback: ${out.reason}` : "");
  if (out.mode === "gop-range") {
    assert.equal(out.sampleCount, 300, "10 s @ 30 fps = 300 sample");
    assert.equal(out.gops.length, 10, "-g 30 → 10 GOP");
    assert.ok(out.requests.some((r) => r.kind === "tail" && r.status === 206),
      `phải có tail-scan 206, requests: ${JSON.stringify(out.requests.map((r) => r.kind))}`);
    assert.ok(out.requests.filter((r) => r.kind === "gop").length === 10);
  }
  assert.equal(log.filter((l) => l.method === "GET" && l.range === null).length, 0,
    `không được có GET toàn file, log: ${JSON.stringify(log)}`);
});

ok("T3 blob: Range bị phớt lờ (trả 200) → full-file ở probe, không được tin 206 giả", async () => {
  const log: BlobCall[] = [];
  const out = await fetchVideoTrackByGopRange("blob:fake-ignore-range", {
    fetchImpl: blobLikeFetch(fastBuf, log, { ignoreRange: true }),
    knownSizeBytes: fastBuf.length,
  });
  assert.equal(out.mode, "full-file");
  if (out.mode === "full-file") assert.match(out.reason, /probe-status-200/);
});

// ---- 3. Controller trên blob: URL (mẫu V2 — Node thiếu VideoDecoder) ----
ok("controller blob: trailing lớn → gopMode gop-range, ready, 0 GET toàn file", async () => {
  const log: BlobCall[] = [];
  const restore = (() => {
    const prev = (globalThis as unknown as { fetch?: unknown }).fetch;
    (globalThis as unknown as { fetch: unknown }).fetch = blobLikeFetch(trailBigBuf, log);
    return () => {
      (globalThis as unknown as { fetch?: unknown }).fetch = prev;
    };
  })();
  try {
    const c = new ReversePreviewController("blob:fake-ctrl-trailing", 15, {
      knownFileSizeBytes: trailBigBuf.length,
      gopRangeEnabled: true,
      gopThresholdBytes: 1024,
      gopFetchImpl: blobLikeFetch(trailBigBuf, log),
    });
    const done = await c.ensureWindowForTime(9.0);
    // Node không có VideoDecoder nên decode trả false (fail-soft như
    // V2) — nhưng đường GOP phải đã chạy: track có, mode gop-range.
    assert.equal(done, false);
    assert.equal(c.ready, true);
    assert.equal(c.gopMode, "gop-range", `gopFallbackReason=${c.gopFallbackReason}`);
    assert.equal(c.gopFallbackReason, null);
    assert.equal(c.largeFileFallback, false);
    assert.equal(log.filter((l) => l.method === "GET" && l.range === null).length, 0,
      `không được có GET toàn file, log: ${JSON.stringify(log)}`);
    c.dispose();
  } finally {
    restore();
  }
});

runAll().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
