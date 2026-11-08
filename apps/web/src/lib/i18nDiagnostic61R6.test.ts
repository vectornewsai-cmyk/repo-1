// i18nDiagnostic61R6.test.ts — Phase 9 đợt 61, luồng R6: nối lý do
// diagnostic GOP/probe còn thô sau Q4 (đợt 60 §5.6) + kiểm kê literal
// server/desktop (xem docs/PHASE9_ROUND61_R6_SERVER_LITERALS_LIMITS.md).
//
// Nối thật 50 key fragment R6 (gop.gate.* ×7, gop.probe.* ×5,
// gop.range.* ×4, gop.controller.* ×2, gop.cache.* ×7,
// gop.sizeprobe.* ×2, gop.demux.parser*/avcc*/layout*/stts* ×23):
// mọi hàm nhận thêm lookup tùy chọn (mẫu Q4); vắng lookup → fallback
// đúng từng chữ chuỗi VI cũ nên test cũ + hành vi mặc định không đổi.
// Key fragment CHƯA gộp vào dict (parent gộp sau) nên test đọc fragment
// tại hidden_files, không đọc vi.json/en.json cho 50 key này.
//
// Cách chạy (mẫu Q4, từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nDiagnostic61R6.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round61-r6/r6.test.cjs \
//     && node /tmp/round61-r6/r6.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  checkRangeProbeResponse,
  resolveRangeGopFetch,
} from "./reverseRangeGate38U2";
import {
  fetchSingleGopRange,
  resolveGopRangeWiring,
} from "./gopCache40V2";
import { discoverSizeBytes } from "./gopSizeProbe41W4";
import {
  avcCodecString,
  parseMp4VideoTrack,
  validateAvccSample,
  validateSampleLayout,
  validateSampleTimestamps,
  type Mp4Sample,
  type Mp4VideoTrack,
} from "./mp4Demux";
import {
  fetchVideoTrackByGopRange,
  type GopRangeFetchFn,
  type GopRangeResponse,
} from "./gopRangeFetch39T3";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
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
  console.log(`R6 diagnostic i18n round 61: ${pass}/${queue.length} pass`);
}

// --- Fragment R6 ---------------------------------------------------------
type Dict = Record<string, unknown>;
function flatten(d: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Dict, q, out);
    else out.set(q, v as string);
  }
  return out;
}
const FRAG = JSON.parse(
  readFileSync(
    "../goals/capcut-clone-video-editor/hidden_files/round61-r6-fragment.json",
    "utf8",
  ),
) as { vi: Dict; en: Dict };
const FRAG_VI = flatten(FRAG.vi);
const FRAG_EN = flatten(FRAG.en);
const FRAG_KEYS = [...FRAG_VI.keys()].sort();
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
function lookupFor(map: Map<string, string>) {
  return (key: string, vars?: Record<string, string>): string => {
    const raw = map.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
const lookupVi = lookupFor(FRAG_VI);
const lookupEn = lookupFor(FRAG_EN);

ok("fragment R6: 50 key, vi/en cùng tập, placeholder khớp, không rỗng", () => {
  assert.equal(FRAG_KEYS.length, 50, `fragment phải có 50 key lá, nhận ${FRAG_KEYS.length}`);
  for (const k of FRAG_VI.keys()) assert.ok(FRAG_EN.has(k), `en thiếu key ${k}`);
  for (const k of FRAG_EN.keys()) assert.ok(FRAG_VI.has(k), `vi thiếu key ${k}`);
  for (const k of FRAG_KEYS) {
    assert.ok(FRAG_VI.get(k)!.length > 0, `${k}: vi rỗng`);
    assert.ok(FRAG_EN.get(k)!.length > 0, `${k}: en rỗng`);
    assert.deepEqual(placeholders(FRAG_VI.get(k)!), placeholders(FRAG_EN.get(k)!), `${k}: placeholder vi/en lệch`);
  }
  // Chỉ 2 key vi==en (mẫu số thuần, không có chữ để dịch).
  const same = FRAG_KEYS.filter((k) => FRAG_VI.get(k) === FRAG_EN.get(k));
  assert.deepEqual(same, ["gop.cache.belowThreshold", "gop.cache.rangeOk"]);
});

// 50 key fragment đã NỐI (không còn mồ côi trong fragment).
const WIRED_50: Record<string, string> = {
  "gop.gate.moovTrailing": "lib/reverseRangeGate38U2.ts",
  "gop.gate.moovUnknown": "lib/reverseRangeGate38U2.ts",
  "gop.gate.acceptRangesUnsupported": "lib/reverseRangeGate38U2.ts",
  "gop.gate.acceptRangesUnknown": "lib/reverseRangeGate38U2.ts",
  "gop.gate.sizeUnknown": "lib/reverseRangeGate38U2.ts",
  "gop.gate.rangeGopAttempt": "lib/reverseRangeGate38U2.ts",
  "gop.gate.rangeEvidenceProbe": "lib/reverseRangeGate38U2.ts",
  "gop.probe.statusNot206": "lib/reverseRangeGate38U2.ts",
  "gop.probe.noContentRange": "lib/reverseRangeGate38U2.ts",
  "gop.probe.mismatch": "lib/reverseRangeGate38U2.ts",
  "gop.probe.totalMismatch": "lib/reverseRangeGate38U2.ts",
  "gop.probe.ok": "lib/reverseRangeGate38U2.ts",
  "gop.range.sizeTooSmall": "lib/gopRangeFetch39T3.ts",
  "gop.range.moovMissingAfterGate": "lib/gopRangeFetch39T3.ts",
  "gop.range.trackNoSamples": "lib/gopRangeFetch39T3.ts",
  "gop.range.sampleZeroEmpty": "lib/gopRangeFetch39T3.ts",
  "gop.controller.unexpectedException": "lib/reverseWebcodecs.ts",
  "gop.controller.sizeProbeUnexpectedException": "lib/reverseWebcodecs.ts",
  "gop.cache.disabled": "lib/gopCache40V2.ts",
  "gop.cache.sizeUnknown": "lib/gopCache40V2.ts",
  "gop.cache.belowThreshold": "lib/gopCache40V2.ts",
  "gop.cache.largeFileLocked": "lib/gopCache40V2.ts",
  "gop.cache.rangeOk": "lib/gopCache40V2.ts",
  "gop.cache.statusNot206": "lib/gopCache40V2.ts",
  "gop.cache.shortBody": "lib/gopCache40V2.ts",
  "gop.sizeprobe.rangeStatusNot206": "lib/gopSizeProbe41W4.ts",
  "gop.sizeprobe.noContentRange": "lib/gopSizeProbe41W4.ts",
  "gop.demux.parserAvccTooShort": "lib/mp4Demux.ts",
  "gop.demux.parserMoovMissing": "lib/mp4Demux.ts",
  "gop.demux.parserSttsOverLimit": "lib/mp4Demux.ts",
  "gop.demux.parserStszOverLimit": "lib/mp4Demux.ts",
  "gop.demux.parserSampleTableMismatch": "lib/mp4Demux.ts",
  "gop.demux.parserSampleBuildMismatch": "lib/mp4Demux.ts",
  "gop.demux.parserNoAvc1Track": "lib/mp4Demux.ts",
  "gop.demux.avccEmpty": "lib/mp4Demux.ts",
  "gop.demux.avccShortRead": "lib/mp4Demux.ts",
  "gop.demux.avccNalTooLong": "lib/mp4Demux.ts",
  "gop.demux.avccNalOverrun": "lib/mp4Demux.ts",
  "gop.demux.avccNalForbiddenBit": "lib/mp4Demux.ts",
  "gop.demux.avccNalTypeZero": "lib/mp4Demux.ts",
  "gop.demux.avccNoNal": "lib/mp4Demux.ts",
  "gop.demux.avccTrailingBytes": "lib/mp4Demux.ts",
  "gop.demux.layoutNegativeOffset": "lib/mp4Demux.ts",
  "gop.demux.layoutOffsetRewind": "lib/mp4Demux.ts",
  "gop.demux.layoutOverlap": "lib/mp4Demux.ts",
  "gop.demux.sttsNonPositiveDelta": "lib/mp4Demux.ts",
  "gop.demux.sttsDeltaOutlier": "lib/mp4Demux.ts",
  "gop.demux.sttsMdhdMismatch": "lib/mp4Demux.ts",
  "gop.demux.durationMvhdMismatch": "lib/mp4Demux.ts",
  "gop.demux.fpsVuiMismatch": "lib/mp4Demux.ts",
};

ok("fragment R6: 50 key ĐÃ vào dict web (parent gộp đợt 61), đều có mặt trong source qua trKey", () => {
  assert.deepEqual(Object.keys(WIRED_50).sort(), FRAG_KEYS, "bảng WIRED_50 phải khớp đúng 50 key fragment");
  const dictVi = flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Dict);
  const dictEn = flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Dict);
  for (const k of FRAG_KEYS) {
    assert.ok(dictVi.has(k), `key fragment ${k} thiếu trong vi dict sau khi parent gộp`);
    assert.equal(dictVi.get(k), FRAG_VI.get(k), `vi.json lệch fragment R6 ở ${k}`);
    assert.ok(dictEn.has(k), `key fragment ${k} thiếu trong en dict sau khi parent gộp`);
    assert.equal(dictEn.get(k), FRAG_EN.get(k), `en.json lệch fragment R6 ở ${k}`);
  }
  const srcCache = new Map<string, string>();
  const readSrc = (rel: string): string => {
    if (!srcCache.has(rel)) srcCache.set(rel, readFileSync(`apps/web/src/${rel}`, "utf8"));
    return srcCache.get(rel)!;
  };
  for (const [key, rel] of Object.entries(WIRED_50)) {
    const src = readSrc(rel);
    // reverseWebcodecs dùng this.gopI18nLookup, các file còn lại dùng lookup.
    const re = new RegExp(`trKey\\(\\s*(lookup|this\\.gopI18nLookup),\\s*"${key.replace(/\./g, "\\.")}"`);
    assert.ok(re.test(src), `${rel} thiếu trKey("${key}")`);
  }
});

// --- A. Gate (reverseRangeGate38U2.resolveRangeGopFetch) ------------------
ok("gate EN: 6 nhánh lý do dịch thật qua lookup", () => {
  const base = { acceptRanges: "bytes", knownSizeBytes: 1000 };
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "trailing", acceptRanges: "bytes", knownSizeBytes: 1000 }, lookupEn).reasons,
    ["moov-trailing: moov is at the end of the file, tail probe not implemented yet"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "unknown", acceptRanges: "bytes", knownSizeBytes: 1000 }, lookupEn).reasons,
    ["moov-unknown: could not determine moov position from the prefix read"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "faststart", acceptRanges: "none", knownSizeBytes: 1000 }, lookupEn).reasons,
    ["accept-ranges-unsupported: server reports none"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "faststart", acceptRanges: null, knownSizeBytes: 1000 }, lookupEn).reasons,
    ["accept-ranges-unknown: server sent no Accept-Ranges, not assuming support"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "faststart", acceptRanges: "bytes", knownSizeBytes: null }, lookupEn).reasons,
    ["size-unknown: total file size unknown"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ ...base, moovPosition: "faststart" }, lookupEn).reasons,
    ["range-gop-attempt: moov-first + Accept-Ranges bytes + size known"],
  );
  // Nhánh evidence probe (header vắng + đã chứng minh bằng probe 206).
  assert.deepEqual(
    resolveRangeGopFetch(
      { moovPosition: "faststart", acceptRanges: null, knownSizeBytes: 1000, rangeProvenByVerifiedProbe: true },
      lookupEn,
    ).reasons,
    ["range-gop-attempt: moov-first + Range proven by a verified probe/prefix 206 (no Accept-Ranges header) + size known"],
  );
});

ok("gate VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", () => {
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "trailing", acceptRanges: "bytes", knownSizeBytes: 1000 }).reasons,
    ["moov-trailing: moov ở cuối file, cần probe đuôi chưa cài đặt"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "unknown", acceptRanges: "bytes", knownSizeBytes: 1000 }).reasons,
    ["moov-unknown: chưa xác định được vị trí moov từ tiền tố đã đọc"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "faststart", acceptRanges: "none", knownSizeBytes: 1000 }).reasons,
    ["accept-ranges-unsupported: server báo none"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "faststart", acceptRanges: null, knownSizeBytes: 1000 }).reasons,
    ["accept-ranges-unknown: server không gửi Accept-Ranges, không giả định"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "faststart", acceptRanges: "bytes", knownSizeBytes: null }).reasons,
    ["size-unknown: chưa biết tổng kích thước file"],
  );
  assert.deepEqual(
    resolveRangeGopFetch({ moovPosition: "faststart", acceptRanges: "bytes", knownSizeBytes: 1000 }).reasons,
    ["range-gop-attempt: moov-trước + Accept-Ranges bytes + đã biết size"],
  );
  assert.deepEqual(
    resolveRangeGopFetch(
      { moovPosition: "faststart", acceptRanges: null, knownSizeBytes: 1000, rangeProvenByVerifiedProbe: true },
    ).reasons,
    ["range-gop-attempt: moov-trước + Range đã chứng minh bằng probe/prefix 206 (không có header Accept-Ranges) + đã biết size"],
  );
});

// --- B. Probe (checkRangeProbeResponse) ------------------------------------
ok("probe EN: 5 lý do dịch thật qua lookup", () => {
  assert.equal(
    checkRangeProbeResponse(200, null, { start: 0, end: 9 }, null, lookupEn).reason,
    "range-probe-status-200: server did not return 206 for the Range request",
  );
  assert.equal(
    checkRangeProbeResponse(206, null, { start: 0, end: 9 }, null, lookupEn).reason,
    "range-probe-no-content-range: 206 but no valid Content-Range",
  );
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-4/100", { start: 0, end: 9 }, null, lookupEn).reason,
    "range-probe-mismatch: server returned 0-4, requested 0-9",
  );
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-9/99", { start: 0, end: 9 }, 100, lookupEn).reason,
    "range-probe-total-mismatch: Content-Range total 99, known 100",
  );
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-9/100", { start: 0, end: 9 }, 100, lookupEn).reason,
    "range-probe-ok: 206 matches the requested range",
  );
});

ok("probe VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", () => {
  assert.equal(
    checkRangeProbeResponse(200, null, { start: 0, end: 9 }, null).reason,
    "range-probe-status-200: server không trả 206 cho request Range",
  );
  assert.equal(
    checkRangeProbeResponse(206, null, { start: 0, end: 9 }, null).reason,
    "range-probe-no-content-range: 206 nhưng thiếu Content-Range hợp lệ",
  );
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-4/100", { start: 0, end: 9 }, null).reason,
    "range-probe-mismatch: server trả 0-4, đã xin 0-9",
  );
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-9/99", { start: 0, end: 9 }, 100).reason,
    "range-probe-total-mismatch: Content-Range tổng 99, đã biết 100",
  );
  assert.equal(
    checkRangeProbeResponse(206, "bytes 0-9/100", { start: 0, end: 9 }, 100).reason,
    "range-probe-ok: 206 khớp range đã xin",
  );
});

// --- C. Wiring cache (gopCache40V2) ----------------------------------------
ok("cache EN: resolveGopRangeWiring 5 lý do + fetchSingleGopRange 2 lý do dịch thật", async () => {
  assert.equal(
    resolveGopRangeWiring({ enabled: false, knownSizeBytes: 100000, lookup: lookupEn }).reason,
    "gop-disabled: caller did not enable the GOP path",
  );
  assert.equal(
    resolveGopRangeWiring({ enabled: true, knownSizeBytes: null, lookup: lookupEn }).reason,
    "gop-size-unknown: size unknown before the first window",
  );
  assert.equal(
    resolveGopRangeWiring({ enabled: true, knownSizeBytes: 100, thresholdBytes: 1000, lookup: lookupEn }).reason,
    "gop-below-threshold: 100 <= 1000",
  );
  assert.equal(
    resolveGopRangeWiring({ enabled: true, knownSizeBytes: 40000000, thresholdBytes: 1000, largeFileBytes: 100000, lookup: lookupEn }).reason,
    "gop-large-file-locked: 40000000 > 100000 (S4 gate kept as-is)",
  );
  assert.equal(
    resolveGopRangeWiring({ enabled: true, knownSizeBytes: 5000, thresholdBytes: 1000, largeFileBytes: 100000, lookup: lookupEn }).reason,
    "gop-range: 1000 < 5000 <= 100000",
  );
  const mkFetch = (status: number, body: Uint8Array, contentRange: string | null): GopRangeFetchFn =>
    (async () => ({
      status,
      headers: { get: (n: string) => (n.toLowerCase() === "content-range" ? contentRange : null) },
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    })) as unknown as GopRangeFetchFn;
  const bad = await fetchSingleGopRange("http://x/f.mp4", 0, 10, 100, mkFetch(200, new Uint8Array(0), null), lookupEn);
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.equal(bad.reason, "gop-status-200: server did not return 206 for GOP Range 0-9");
  }
  const short = await fetchSingleGopRange(
    "http://x/f.mp4",
    0,
    10,
    100,
    mkFetch(206, new Uint8Array(5), "bytes 0-9/100"),
    lookupEn,
  );
  assert.equal(short.ok, false);
  if (!short.ok) assert.equal(short.reason, "gop-short-body: requested 10 bytes, got 5");
  // gop-{probe reason}: lý do probe bên trong cũng dịch (không chỉ vỏ ngoài).
  const probeBad = await fetchSingleGopRange(
    "http://x/f.mp4",
    0,
    10,
    100,
    mkFetch(206, new Uint8Array(10), "bytes 0-4/100"),
    lookupEn,
  );
  assert.equal(probeBad.ok, false);
  if (!probeBad.ok) {
    assert.equal(probeBad.reason, "gop-range-probe-mismatch: server returned 0-4, requested 0-9");
  }
});

ok("cache VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", async () => {
  assert.equal(
    resolveGopRangeWiring({ enabled: false, knownSizeBytes: 100000 }).reason,
    "gop-disabled: caller chưa bật đường GOP",
  );
  assert.equal(
    resolveGopRangeWiring({ enabled: true, knownSizeBytes: null }).reason,
    "gop-size-unknown: chưa biết size trước cửa sổ đầu tiên",
  );
  assert.equal(
    resolveGopRangeWiring({ enabled: true, knownSizeBytes: 40000000, thresholdBytes: 1000, largeFileBytes: 100000 }).reason,
    "gop-large-file-locked: 40000000 > 100000 (cổng S4 giữ nguyên)",
  );
});

// --- D. Size probe (gopSizeProbe41W4.discoverSizeBytes) ---------------------
function headersOf(map: Record<string, string>) {
  return { get: (n: string) => map[n.toLowerCase()] ?? null };
}
function fakeResp(status: number, headers: Record<string, string>): GopRangeResponse {
  return {
    status,
    headers: headersOf(headers),
    arrayBuffer: async () => new ArrayBuffer(0),
    body: { cancel: async () => {} },
  } as unknown as GopRangeResponse;
}

ok("sizeprobe EN: 2 lý do dịch thật qua lookup", async () => {
  const fetch200: GopRangeFetchFn = (async () => fakeResp(200, {})) as unknown as GopRangeFetchFn;
  const r1 = await discoverSizeBytes("http://x/f.mp4", fetch200, lookupEn);
  assert.equal(r1.reason, "size-probe-range-status-200: server did not return 206 for Range 0-0");
  const fetchNoCr: GopRangeFetchFn = (async () => fakeResp(206, {})) as unknown as GopRangeFetchFn;
  const r2 = await discoverSizeBytes("http://x/f.mp4", fetchNoCr, lookupEn);
  assert.equal(r2.reason, "size-probe-no-content-range: 206 but no valid Content-Range with a total");
});

ok("sizeprobe VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", async () => {
  const fetch200: GopRangeFetchFn = (async () => fakeResp(200, {})) as unknown as GopRangeFetchFn;
  const r1 = await discoverSizeBytes("http://x/f.mp4", fetch200);
  assert.equal(r1.reason, "size-probe-range-status-200: server không trả 206 cho Range 0-0");
  const fetchNoCr: GopRangeFetchFn = (async () => fakeResp(206, {})) as unknown as GopRangeFetchFn;
  const r2 = await discoverSizeBytes("http://x/f.mp4", fetchNoCr);
  assert.equal(r2.reason, "size-probe-no-content-range: 206 nhưng thiếu Content-Range tổng hợp lệ");
});

// --- E. mp4Demux validate* -------------------------------------------------
function sample(o: Partial<Mp4Sample> & { offset: number; size: number }): Mp4Sample {
  return {
    index: 0,
    timestamp: 0,
    duration: 100,
    isKey: true,
    presentationTimestamp: 0,
    ...o,
  } as Mp4Sample;
}
function trackWith(samples: Mp4Sample[], extra: Partial<Mp4VideoTrack> = {}): Mp4VideoTrack {
  const durationUnits = samples.reduce((s, x) => s + x.duration, 0);
  return {
    codec: "avc1.64001F",
    description: new Uint8Array(0),
    timescale: 1000,
    width: 64,
    height: 64,
    samples,
    durationUnits,
    durationSec: durationUnits / 1000,
    editList: [],
    movieTimescale: null,
    ...extra,
  } as Mp4VideoTrack;
}

ok("avcc EN: 7/8 lý do validateAvccSample dịch thật (avccNoNal không tới được — xem LIMITS)", () => {
  const en = lookupEn;
  assert.equal(validateAvccSample(new Uint8Array(0), 0, en).reason, "empty sample");
  assert.equal(
    validateAvccSample(new Uint8Array([1, 2, 3]), 10, en).reason,
    "only read 3 bytes of a 10-byte sample (need ≥ 5 for 1 NAL)",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 0, 0x65]), undefined, en).reason,
    "NAL 0 length 0 (invalid) at offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 10, 0x65, 0, 0, 0, 0, 0]), 10, en).reason,
    "NAL 0 length 10 exceeds the remaining sample 6 at offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 1, 0x80]), undefined, en).reason,
    "NAL 0 has forbidden_zero_bit at offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 1, 0x00]), undefined, en).reason,
    "NAL 0 has type 0 at offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 1, 0x65, 0x99]), 6, en).reason,
    "1 trailing bytes left, not enough for 1 NAL",
  );
});

ok("avcc VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", () => {
  assert.equal(validateAvccSample(new Uint8Array(0), 0).reason, "sample rỗng");
  assert.equal(
    validateAvccSample(new Uint8Array([1, 2, 3]), 10).reason,
    "chỉ đọc được 3 byte của sample 10 byte (cần ≥ 5 để có 1 NAL)",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 0, 0x65])).reason,
    "NAL 0 dài 0 (không hợp lệ) ở offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 10, 0x65, 0, 0, 0, 0, 0]), 10).reason,
    "NAL 0 dài 10 vượt sample còn lại 6 ở offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 1, 0x80])).reason,
    "NAL 0 có forbidden_zero_bit ở offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 1, 0x00])).reason,
    "NAL 0 có type 0 ở offset 0",
  );
  assert.equal(
    validateAvccSample(new Uint8Array([0, 0, 0, 1, 0x65, 0x99]), 6).reason,
    "thừa 1 byte cuối không đủ 1 NAL",
  );
  // avccNoNal không tới được: data ≥ 5 byte thì vòng NAL luôn chạy ít
  // nhất 1 lần (len 0 → tooLong, len vượt → overrun/straddled, còn lại
  // → 1 NAL + có thể trailing) — key vẫn nối để phòng thủ, test khóa
  // bằng presence ở trên, không ép nhánh chết chạy. Khóa thêm: sample
  // AVCC hợp lệ vẫn ok:true (không bị chặn oan), và lookup vi trả đúng
  // chuỗi VI khi có lookup.
  assert.equal(validateAvccSample(new Uint8Array([0, 0, 0, 1, 0x65]), 5).ok, true);
  assert.equal(validateAvccSample(new Uint8Array(0), 0, lookupVi).reason, "sample rỗng");
});

ok("layout EN: 3 lý do validateSampleLayout dịch thật", () => {
  assert.equal(
    validateSampleLayout([sample({ offset: -1, size: 10 })], lookupEn).reason,
    "sample 0 has a negative offset/size (-1/10)",
  );
  assert.equal(
    validateSampleLayout(
      [sample({ offset: 100, size: 10 }), sample({ index: 1, offset: 50, size: 10 })],
      lookupEn,
    ).reason,
    "sample 1 offset 50 goes back after sample 0 offset 100 (stco not increasing)",
  );
  assert.equal(
    validateSampleLayout(
      [sample({ offset: 0, size: 100 }), sample({ index: 1, offset: 50, size: 10 })],
      lookupEn,
    ).reason,
    "sample 1 [50, 60) overlaps the previous sample (ends 100)",
  );
});

ok("layout VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", () => {
  assert.equal(
    validateSampleLayout([sample({ offset: -1, size: 10 })]).reason,
    "sample 0 có offset/size âm (-1/10)",
  );
  assert.equal(
    validateSampleLayout([sample({ offset: 100, size: 10 }), sample({ index: 1, offset: 50, size: 10 })]).reason,
    "sample 1 offset 50 lùi sau sample 0 offset 100 (stco không tăng dần)",
  );
  assert.equal(
    validateSampleLayout([sample({ offset: 0, size: 100 }), sample({ index: 1, offset: 50, size: 10 })]).reason,
    "sample 1 [50, 60) chồng lấn sample trước (kết thúc 100)",
  );
});

ok("timestamps EN: 5 lý do validateSampleTimestamps dịch thật", () => {
  const mk = (durs: number[]): Mp4Sample[] =>
    durs.map((d, i) => sample({ index: i, offset: i * 100, size: 10, duration: d, timestamp: i * 100 }));
  assert.equal(
    validateSampleTimestamps(trackWith(mk([0, 100])), lookupEn).reason,
    "stts has a delta ≤ 0 (smallest 0)",
  );
  const outlier = [...Array(51).fill(100), 10000];
  assert.equal(
    validateSampleTimestamps(trackWith(mk(outlier)), lookupEn).reason,
    "stts largest delta 10000 is 100× the median delta 100 (and > 2s)",
  );
  assert.equal(
    validateSampleTimestamps(
      trackWith(mk(Array(10).fill(100)), { mdhdDuration: 5000 }),
      lookupEn,
    ).reason,
    "stts total 1000 differs from mdhd 5000 by more than tolerance 200",
  );
  assert.equal(
    validateSampleTimestamps(
      trackWith(mk(Array(10).fill(100)), {
        mdhdDuration: 1000,
        mvhdDuration: 100,
        movieTimescale: 1000,
        durationSec: 10,
      }),
      lookupEn,
    ).reason,
    "video duration 10.000s differs from mvhd 0.100s by more than tolerance 0.500s",
  );
  assert.equal(
    validateSampleTimestamps(
      trackWith(mk(Array(10).fill(100)), { mdhdDuration: 1000, spsVuiFps: 30 }),
      lookupEn,
    ).reason,
    "fps from stts 10.000 (median) / 10.000 (mode) / 10.000 (average) differs from VUI SPS 30.000 (66.7% > tolerance 2.0%)",
  );
});

ok("timestamps VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", () => {
  const mk = (durs: number[]): Mp4Sample[] =>
    durs.map((d, i) => sample({ index: i, offset: i * 100, size: 10, duration: d, timestamp: i * 100 }));
  assert.equal(
    validateSampleTimestamps(trackWith(mk([0, 100]))).reason,
    "stts có delta ≤ 0 (nhỏ nhất 0)",
  );
  const outlier = [...Array(51).fill(100), 10000];
  assert.equal(
    validateSampleTimestamps(trackWith(mk(outlier))).reason,
    "stts có delta lớn nhất 10000 gấp 100× delta giữa 100 (và > 2s)",
  );
  assert.equal(
    validateSampleTimestamps(trackWith(mk(Array(10).fill(100)), { mdhdDuration: 5000 })).reason,
    "stts tổng 1000 lệch mdhd 5000 quá dung sai 200",
  );
  assert.equal(
    validateSampleTimestamps(
      trackWith(mk(Array(10).fill(100)), {
        mdhdDuration: 1000,
        mvhdDuration: 100,
        movieTimescale: 1000,
        durationSec: 10,
      }),
    ).reason,
    "thời lượng video 10.000s lệch mvhd 0.100s quá dung sai 0.500s",
  );
  assert.equal(
    validateSampleTimestamps(
      trackWith(mk(Array(10).fill(100)), { mdhdDuration: 1000, spsVuiFps: 30 }),
    ).reason,
    "fps theo stts 10.000 (median) / 10.000 (mode) / 10.000 (trung bình) lệch VUI SPS 30.000 (66.7% > dung sai 2.0%)",
  );
});

// --- F. mp4Demux parser throws ---------------------------------------------
// Builder MP4 tối thiểu (theo mẫu mp4Demux34Q2.test.ts): ftyp + moov +
// mdat; stco tính 2 lượt để trỏ đúng đầu mdat.
function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}
function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n);
  return b;
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
function box(type: string, ...children: Uint8Array[]): Uint8Array {
  const body = concat(...children);
  const head = new Uint8Array(8);
  new DataView(head.buffer).setUint32(0, 8 + body.length);
  for (let i = 0; i < 4; i++) head[4 + i] = type.charCodeAt(i);
  return concat(head, body);
}
function fullBox(type: string, version: number, ...children: Uint8Array[]): Uint8Array {
  const vf = new Uint8Array(4);
  vf[0] = version;
  return box(type, vf, ...children);
}
interface MiniOpts {
  stts: Array<[number, number]>;
  stszSizes: number[];
  stszFixed?: number | null;
  stsc: Array<[number, number, number]>;
  stss?: number[];
  mdhdDuration: number;
  mvhdDuration: number;
  avcC?: Uint8Array;
}
function buildMiniFile(o: MiniOpts, stcoValue: number): Uint8Array {
  const avcC = box("avcC", o.avcC ?? new Uint8Array([1, 0x64, 0x00, 0x1f, 0xff, 0xe1, 0, 0]));
  const avc1Fields = concat(
    new Uint8Array(6),
    u16(1),
    u16(0),
    new Uint8Array(2),
    new Uint8Array(12),
    u16(64),
    u16(64),
    u32(0x00480000),
    u32(0x00480000),
    u32(0),
    u16(1),
    new Uint8Array(32),
    u16(0x0018),
    u16(0xffff),
  );
  const avc1 = box("avc1", avc1Fields, avcC);
  const stsd = fullBox("stsd", 0, u32(1), avc1);
  const stts = fullBox(
    "stts",
    0,
    u32(o.stts.length),
    ...o.stts.flatMap(([c, d]) => [u32(c), u32(d)]),
  );
  const stsz =
    o.stszFixed !== undefined && o.stszFixed !== null
      ? fullBox("stsz", 0, u32(o.stszFixed), u32(o.stszSizes.length))
      : fullBox("stsz", 0, u32(0), u32(o.stszSizes.length), ...o.stszSizes.map(u32));
  const stsc = fullBox(
    "stsc",
    0,
    u32(o.stsc.length),
    ...o.stsc.flatMap(([a, b, c]) => [u32(a), u32(b), u32(c)]),
  );
  const stco = fullBox("stco", 0, u32(1), u32(stcoValue));
  const stblChildren: Uint8Array[] = [stsd, stts, stsz, stsc, stco];
  if (o.stss) {
    stblChildren.splice(2, 0, fullBox("stss", 0, u32(o.stss.length), ...o.stss.map(u32)));
  }
  const stbl = box("stbl", ...stblChildren);
  const mdhd = fullBox("mdhd", 0, u32(0), u32(0), u32(1000), u32(o.mdhdDuration), u16(0x55c4), u16(0));
  const minf = box("minf", stbl);
  const mdia = box("mdia", mdhd, minf);
  const trak = box("trak", mdia);
  const mvhd = fullBox("mvhd", 0, u32(0), u32(0), u32(1000), u32(o.mvhdDuration), u32(0x00010000));
  const moov = box("moov", mvhd, trak);
  const ftyp = box("ftyp", new Uint8Array([0x69, 0x73, 0x6f, 0x6d]), u32(0), new Uint8Array([0x69, 0x73, 0x6f, 0x6d]));
  const mdat = box("mdat", new Uint8Array(40));
  return concat(ftyp, moov, mdat);
}
function buildMini(o: MiniOpts): Uint8Array {
  const probe = buildMiniFile(o, 0);
  const ftypLen = 20;
  const moovLen = probe.length - ftypLen - 48;
  return buildMiniFile(o, ftypLen + moovLen + 8);
}
function parseErr(buf: Uint8Array, lookup?: (k: string, v?: Record<string, string>) => string): string {
  try {
    parseMp4VideoTrack(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, lookup);
    return "<no-throw>";
  } catch (e) {
    return (e as Error).message;
  }
}
const BASE_MINI: MiniOpts = {
  stts: [[4, 100]],
  stszSizes: [10, 10, 10, 10],
  stsc: [[1, 4, 1]],
  mdhdDuration: 400,
  mvhdDuration: 400,
};

ok("parser EN: 7 throw của parseMp4VideoTrack/avcCodecString dịch thật", () => {
  assert.equal(parseErr(new Uint8Array(0), lookupEn), "moov not found");
  assert.throws(
    () => avcCodecString(new Uint8Array([1, 2]), lookupEn),
    (e: unknown) => (e as Error).message === "avcC too short",
  );
  assert.equal(
    parseErr(
      (() => {
        const moov = box("moov");
        return moov;
      })(),
      lookupEn,
    ),
    "no valid avc1 video track found",
  );
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stts: [[1000001, 100]] }), lookupEn),
    "stts: total sample count 1000001 exceeds the limit 1000000 (crafted moov?)",
  );
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stszFixed: 10, stszSizes: Array(1000001).fill(0) }), lookupEn),
    "stsz: sample count 1000001 exceeds the limit 1000000 (crafted moov?)",
  );
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stszSizes: [10, 10, 10] }), lookupEn),
    "sample table mismatch: stts=4 stsz=3",
  );
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stsc: [[1, 2, 1]] }), lookupEn),
    "sample build mismatch: chunks cover 2/4",
  );
});

ok("parser VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", () => {
  assert.equal(parseErr(new Uint8Array(0)), "không tìm thấy moov");
  assert.throws(
    () => avcCodecString(new Uint8Array([1, 2])),
    (e: unknown) => (e as Error).message === "avcC quá ngắn",
  );
  assert.equal(parseErr(box("moov")), "không tìm thấy track video avc1 hợp lệ");
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stts: [[1000001, 100]] })),
    "stts: tổng số sample 1000001 vượt giới hạn 1000000 (moov chế tác?)",
  );
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stszFixed: 10, stszSizes: Array(1000001).fill(0) })),
    "stsz: số sample 1000001 vượt giới hạn 1000000 (moov chế tác?)",
  );
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stszSizes: [10, 10, 10] })),
    "sample table lệch: stts=4 stsz=3",
  );
  assert.equal(
    parseErr(buildMini({ ...BASE_MINI, stsc: [[1, 2, 1]] })),
    "dựng sample lệch: chunk cho 2/4",
  );
});

// --- G. T3 trực tiếp: trackNoSamples / sampleZeroEmpty / prefix wrapper ---
function fileFetch(file: Uint8Array, mutatePrefixRange = false): GopRangeFetchFn {
  let rangeCalls = 0;
  return (async (_url: string, init?: { method?: string; headers?: Record<string, string> }) => {
    const method = init?.method;
    if (method === "HEAD") {
      return {
        status: 200,
        headers: { get: (n: string) => (n.toLowerCase() === "accept-ranges" ? "bytes" : n.toLowerCase() === "content-length" ? String(file.length) : null) },
        arrayBuffer: async () => new ArrayBuffer(0),
        body: { cancel: async () => {} },
      };
    }
    const m = /bytes=(\d+)-(\d+)/.exec(init?.headers?.Range ?? "");
    if (!m) {
      return { status: 400, headers: { get: () => null }, arrayBuffer: async () => new ArrayBuffer(0), body: { cancel: async () => {} } };
    }
    rangeCalls++;
    const start = Number(m[1]);
    const end = Math.min(Number(m[2]), file.length - 1);
    // Lần Range thứ 2 là tiền tố: trả Content-Range lệch để probe prefix fail.
    const cr =
      mutatePrefixRange && rangeCalls === 2
        ? `bytes 0-99/${file.length}`
        : `bytes ${start}-${end}/${file.length}`;
    const slice = file.slice(start, end + 1);
    return {
      status: 206,
      headers: {
        get: (n: string) =>
          n.toLowerCase() === "content-range" ? cr : n.toLowerCase() === "accept-ranges" ? "bytes" : null,
      },
      arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength),
      body: { cancel: async () => {} },
    };
  }) as unknown as GopRangeFetchFn;
}

ok("T3 EN: trackNoSamples + sampleZeroEmpty dịch thật (streamGops)", async () => {
  const empty = buildMini({
    stts: [[0, 100]],
    stszSizes: [],
    stsc: [[1, 0, 1]],
    mdhdDuration: 0,
    mvhdDuration: 0,
  });
  const r1 = await fetchVideoTrackByGopRange("http://x/f.mp4", {
    knownSizeBytes: empty.length,
    fetchImpl: fileFetch(empty),
    trialDecodeProbe: null,
    lookup: lookupEn,
  });
  assert.equal(r1.mode, "full-file");
  if (r1.mode === "full-file") assert.equal(r1.reason, "demux-moov: track has no samples");

  const zero = buildMini({
    stts: [[1, 100]],
    stszSizes: [0],
    stsc: [[1, 1, 1]],
    mdhdDuration: 100,
    mvhdDuration: 100,
  });
  const r2 = await fetchVideoTrackByGopRange("http://x/f.mp4", {
    knownSizeBytes: zero.length,
    fetchImpl: fileFetch(zero),
    trialDecodeProbe: null,
    streamGops: true,
    lookup: lookupEn,
  });
  assert.equal(r2.mode, "full-file");
  if (r2.mode === "full-file") assert.equal(r2.reason, "demux-moov: sample 0 is empty (size 0) — fake moov?");
});

ok("T3 VI fallback: trackNoSamples + sampleZeroEmpty giữ chuỗi VI cũ", async () => {
  const empty = buildMini({
    stts: [[0, 100]],
    stszSizes: [],
    stsc: [[1, 0, 1]],
    mdhdDuration: 0,
    mvhdDuration: 0,
  });
  const r1 = await fetchVideoTrackByGopRange("http://x/f.mp4", {
    knownSizeBytes: empty.length,
    fetchImpl: fileFetch(empty),
    trialDecodeProbe: null,
  });
  assert.equal(r1.mode, "full-file");
  if (r1.mode === "full-file") assert.equal(r1.reason, "demux-moov: track không có sample");

  const zero = buildMini({
    stts: [[1, 100]],
    stszSizes: [0],
    stsc: [[1, 1, 1]],
    mdhdDuration: 100,
    mvhdDuration: 100,
  });
  const r2 = await fetchVideoTrackByGopRange("http://x/f.mp4", {
    knownSizeBytes: zero.length,
    fetchImpl: fileFetch(zero),
    trialDecodeProbe: null,
    streamGops: true,
  });
  assert.equal(r2.mode, "full-file");
  if (r2.mode === "full-file") assert.equal(r2.reason, "demux-moov: sample 0 rỗng (size 0) — moov giả?");
});

ok("T3 EN: prefix-${probe reason} dịch cả phần lý do bên trong", async () => {
  const file = buildMini(BASE_MINI);
  const r = await fetchVideoTrackByGopRange("http://x/f.mp4", {
    knownSizeBytes: file.length,
    fetchImpl: fileFetch(file, true),
    trialDecodeProbe: null,
    lookup: lookupEn,
  });
  assert.equal(r.mode, "full-file");
  if (r.mode === "full-file") {
    assert.equal(
      r.reason,
      `prefix-range-probe-mismatch: server returned 0-99, requested 0-${file.length - 1}`,
    );
  }
});

ok("T3 VI fallback: prefix-${probe reason} giữ chuỗi VI cũ", async () => {
  const file = buildMini(BASE_MINI);
  const r = await fetchVideoTrackByGopRange("http://x/f.mp4", {
    knownSizeBytes: file.length,
    fetchImpl: fileFetch(file, true),
    trialDecodeProbe: null,
  });
  assert.equal(r.mode, "full-file");
  if (r.mode === "full-file") {
    assert.equal(
      r.reason,
      `prefix-range-probe-mismatch: server trả 0-99, đã xin 0-${file.length - 1}`,
    );
  }
});

runAll();
