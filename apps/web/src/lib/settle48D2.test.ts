// settle48D2.test.ts — Phase 9 đợt 48, luồng D2: khóa số học tách
// gap settle−W2end thành feed/flush/drain + đo decoded trực tiếp
// của W2 (nợ mở C2: chưa có timestamp feed/flush, decoded W2 vẫn
// suy ra 0 theo luật production).
//
// Test thuần, chỉ import settle48D2.ts (không import production
// code), chạy bằng esbuild bundle --format=esm (mẫu A1/B1/C2):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settle48D2.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/d2.test.mjs \
//     && node <scratch>/d2.test.mjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
// Test này KHÔNG phải bằng chứng headed: số headed thật nằm ở
// docs/PHASE9_ROUND48_D2_SETTLE_LIMITS.md. Các con số fixture dưới
// đây là mô hình: fps 30, GOP 90, GOP hỏng [900,990); W2 [900,974]
// → ts 30.000.000–32.466.667 µs; prefetch 412 [12150,12285] → ts
// 405.000.000–409.500.000 µs; gap C2 lượt chạy lại 208–901 ms.
import assert from "node:assert/strict";
import {
  analyzeVdTrace,
  classifyDecoderInstance,
  errorEvent,
  feedSpan,
  flushSpan,
  lastOutputAt,
  outputsBefore,
  outputsTotal,
  prefetchTailSpans,
  splitSettleGap,
  w2DecodedDirect,
  type VdDecoderInstance,
  type VdTraceEvent,
} from "./settle48D2";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

const W2_TS = { min: 30_000_000, max: 32_466_667 };
const PF_TS = { min: 405_000_000, max: 409_500_000 };
const T0 = 1000; // mốc toggle (performance.now, ms)

function ev(t: number, kind: VdTraceEvent["kind"], extra: Partial<VdTraceEvent> = {}): VdTraceEvent {
  return { t, kind, ...extra };
}
function inst(id: number, createdAt: number, events: VdTraceEvent[]): VdDecoderInstance {
  return { id, createdAt, events };
}
function decodeSeq(t0: number, step: number, n: number, ts0: number, tsStep: number): VdTraceEvent[] {
  const out: VdTraceEvent[] = [];
  for (let i = 0; i < n; i++) {
    out.push(ev(t0 + i * step, "decode", { ts: ts0 + i * tsStep, chunkType: i === 0 ? "key" : "delta" }));
  }
  return out;
}

// --- (1) feedSpan / flushSpan / outputs / errorEvent ---
ok("feedSpan: 136 chunk feed từ 100 tới 500 ms, count 136", () => {
  const i = inst(1, 90, decodeSeq(100, 3, 136, PF_TS.min, 33_333));
  const f = feedSpan(i);
  assert.ok(f);
  assert.equal(f.start, 100);
  assert.ok(Math.abs(f.end - (100 + 135 * 3)) < 0.01);
  assert.equal(f.count, 136);
});
ok("feedSpan: không có decode → null; decode-throw vẫn tính là feed", () => {
  assert.equal(feedSpan(inst(1, 0, [ev(10, "configure")])), null);
  const i = inst(1, 0, [ev(10, "decode", { ts: 1 }), ev(20, "decode-throw", { ts: 2, detail: "boom" })]);
  const f = feedSpan(i);
  assert.ok(f);
  assert.equal(f.count, 2);
  assert.equal(f.end, 20);
});
ok("flushSpan: call 500 → done 620; chưa resolve → done null", () => {
  const a = inst(1, 0, [ev(500, "flush-call"), ev(620, "flush-done")]);
  assert.deepEqual(flushSpan(a), { call: 500, done: 620 });
  const b = inst(1, 0, [ev(500, "flush-call")]);
  assert.deepEqual(flushSpan(b), { call: 500, done: null });
  assert.equal(flushSpan(inst(1, 0, [ev(10, "decode")])), null);
});
ok("outputsBefore/outputsTotal/lastOutputAt/errorEvent: đếm đúng mốc", () => {
  const i = inst(1, 0, [
    ev(100, "output", { ts: 30_000_000 }),
    ev(200, "output", { ts: 30_033_333 }),
    ev(250, "error", { detail: "corrupt" }),
    ev(300, "output", { ts: 30_066_666 }),
  ]);
  assert.equal(outputsTotal(i), 3);
  assert.equal(outputsBefore(i, 250), 2);
  assert.equal(outputsBefore(i, 99), 0);
  assert.equal(lastOutputAt(i), 300);
  assert.equal(errorEvent(i)?.detail, "corrupt");
  assert.equal(errorEvent(inst(2, 0, [ev(1, "output")])), null);
  assert.equal(lastOutputAt(inst(3, 0, [])), null);
});

// --- (2) classifyDecoderInstance ---
function classifyOpts() {
  return { t0Perf: T0, w2TsMinUs: W2_TS.min, w2TsMaxUs: W2_TS.max, prefetchTsMinUs: PF_TS.min, prefetchTsMaxUs: PF_TS.max };
}
ok("classify: W2 — tạo sau toggle + chunk trong khoảng W2", () => {
  const i = inst(7, 1010, [
    ev(1010, "configure"),
    ...decodeSeq(1020, 2, 10, W2_TS.min, 33_333),
    ev(1050, "error", { detail: "corrupt IDR" }),
  ]);
  const c = classifyDecoderInstance(i, classifyOpts());
  assert.equal(c.role, "w2");
});
ok("classify: prefetch 412 — còn sống lúc toggle + chunk trong khoảng prefetch", () => {
  const i = inst(5, 500, [
    ev(500, "configure"),
    ...decodeSeq(510, 3, 136, PF_TS.min, 33_333),
    ev(950, "flush-call"),
    ev(1200, "flush-done"),
  ]);
  const c = classifyDecoderInstance(i, classifyOpts());
  assert.equal(c.role, "prefetch");
});
ok("classify: decoder cửa sổ 412 — feed xong trước toggle → other", () => {
  const i = inst(4, 300, [
    ev(300, "configure"),
    ...decodeSeq(310, 2, 121, 408_000_000, 33_333),
    ev(600, "flush-call"),
    ev(650, "flush-done"),
  ]);
  assert.equal(classifyDecoderInstance(i, classifyOpts()).role, "other");
});
ok("classify: decoder setup — tạo trước toggle, xong trước toggle → other", () => {
  const i = inst(2, 100, [
    ev(100, "configure"),
    ...decodeSeq(110, 2, 91, 414_000_000, 33_333),
    ev(300, "flush-call"),
    ev(320, "flush-done"),
  ]);
  assert.equal(classifyDecoderInstance(i, classifyOpts()).role, "other");
});
ok("classify: tạo sau toggle nhưng chunk prefetch → other (không nhận nhầm là W2)", () => {
  const i = inst(9, 1100, decodeSeq(1110, 2, 5, PF_TS.min, 33_333));
  assert.equal(classifyDecoderInstance(i, classifyOpts()).role, "other");
});
ok("classify: tạo trước toggle 0,5 ms + chunk W2 → vẫn là W2 (dung sai 1 ms)", () => {
  const i = inst(7, 999.5, decodeSeq(1000, 2, 3, W2_TS.min, 33_333));
  assert.equal(classifyDecoderInstance(i, classifyOpts()).role, "w2");
});
ok("classify: prefetch feed xong sau toggle, flush chưa kịp gọi → vẫn prefetch (còn sống lúc toggle)", () => {
  const i = inst(5, 500, decodeSeq(510, 5, 136, PF_TS.min, 33_333));
  // feedEnd = 510 + 135*5 = 1185 > t0=1000 → còn sống lúc toggle → prefetch
  assert.equal(classifyDecoderInstance(i, classifyOpts()).role, "prefetch");
});
ok("classify: prefetch feed xong trước toggle, flush chưa gọi → other (đã xong hẳn)", () => {
  const i = inst(5, 500, decodeSeq(510, 3, 136, PF_TS.min, 33_333));
  // feedEnd = 510 + 135*3 = 915 < t0=1000, không có flush → lastActivity 915 < t0 → other
  assert.equal(classifyDecoderInstance(i, classifyOpts()).role, "other");
});

// --- (3) splitSettleGap ---
ok("split: trường hợp C2 điển hình — feed đuôi 300 + flush 195 + drain 5 = gap 500", () => {
  const s = splitSettleGap({ w2endMs: 2000, settleAtMs: 2500, feedEndMs: 2300, flushCallMs: 2300, flushDoneMs: 2495 });
  assert.equal(s.gapMs, 500);
  assert.equal(s.feedTailMs, 300);
  assert.equal(s.flushTailMs, 195);
  assert.equal(s.drainTailMs, 5);
  assert.equal(s.dominant, "feed");
  assert.ok(Math.abs(s.shares.feed - 0.6) < 0.01);
  assert.equal(s.anomaly, null);
});
ok("split: feed xong trước W2end → feedTail 0, flush chiếm đa số", () => {
  const s = splitSettleGap({ w2endMs: 2000, settleAtMs: 2400, feedEndMs: 1900, flushCallMs: 1950, flushDoneMs: 2390 });
  assert.equal(s.feedTailMs, 0);
  assert.equal(s.flushTailMs, 390);
  assert.equal(s.drainTailMs, 10);
  assert.equal(s.dominant, "flush");
});
ok("split: flush xong trước W2end → chỉ còn drain (resolve + poll)", () => {
  const s = splitSettleGap({ w2endMs: 2000, settleAtMs: 2350, feedEndMs: 1800, flushCallMs: 1850, flushDoneMs: 1900 });
  assert.equal(s.feedTailMs, 0);
  assert.equal(s.flushTailMs, 0);
  assert.equal(s.drainTailMs, 350);
  assert.equal(s.dominant, "drain");
});
ok("split: gap 0 (settle đúng cuối W2) → dominant none, mọi pha 0", () => {
  const s = splitSettleGap({ w2endMs: 2000, settleAtMs: 2000, feedEndMs: 1900, flushCallMs: 1950, flushDoneMs: 2000 });
  assert.equal(s.gapMs, 0);
  assert.equal(s.dominant, "none");
  assert.equal(s.feedTailMs + s.flushTailMs + s.drainTailMs, 0);
});
ok("split: gap nhỏ kiểu B1 (36 ms) toàn drain — khớp thứ tự short-circuit", () => {
  const s = splitSettleGap({ w2endMs: 178, settleAtMs: 214, feedEndMs: 150, flushCallMs: 150, flushDoneMs: 170 });
  assert.equal(s.gapMs, 36);
  assert.equal(s.drainTailMs, 36);
  assert.equal(s.dominant, "drain");
});
ok("split: flush chưa resolve lúc settle → anomaly, drain là giới hạn trên", () => {
  const s = splitSettleGap({ w2endMs: 2000, settleAtMs: 2500, feedEndMs: 2100, flushCallMs: 2100, flushDoneMs: null });
  assert.ok(s.anomaly !== null);
  assert.equal(s.feedTailMs, 100);
  assert.equal(s.flushTailMs, 400);
});
ok("split: flush gọi trước feed xong → anomaly thứ tự", () => {
  const s = splitSettleGap({ w2endMs: 2000, settleAtMs: 2500, feedEndMs: 2300, flushCallMs: 2200, flushDoneMs: 2490 });
  assert.ok(s.anomaly !== null && s.anomaly.includes("TRƯỚC khi feed xong"));
});
ok("split: tổng 3 pha luôn = gap (nhiều cấu hình ngẫu nhiên)", () => {
  const cases = [
    { w2endMs: 0, settleAtMs: 901, feedEndMs: 500, flushCallMs: 500, flushDoneMs: 890 },
    { w2endMs: 100, settleAtMs: 308, feedEndMs: 90, flushCallMs: 95, flushDoneMs: 300 },
    { w2endMs: 5000, settleAtMs: 5208, feedEndMs: 5100, flushCallMs: 5100, flushDoneMs: 5200 },
  ];
  for (const c of cases) {
    const s = splitSettleGap(c);
    assert.ok(Math.abs(s.feedTailMs + s.flushTailMs + s.drainTailMs - s.gapMs) < 0.2, `tổng pha lệch gap: ${JSON.stringify(s)}`);
    assert.equal(s.anomaly, null);
  }
});

// --- (4) w2DecodedDirect ---
ok("w2decoded: error sau 3 output / 12 chunk feed → decoded trực tiếp = 3", () => {
  const i = inst(7, 1010, [
    ev(1010, "configure"),
    ...decodeSeq(1020, 2, 12, W2_TS.min, 33_333),
    ev(1030, "output", { ts: 30_000_000 }),
    ev(1035, "output", { ts: 30_033_333 }),
    ev(1040, "output", { ts: 30_066_666 }),
    ev(1044, "error", { detail: "corrupt IDR" }),
    ev(1050, "close"),
  ]);
  const d = w2DecodedDirect(i);
  assert.equal(d.outputsBeforeError, 3);
  assert.equal(d.outputsTotal, 3);
  assert.equal(d.decodeCallsBeforeError, 12);
  assert.equal(d.decodeCallsTotal, 12);
  assert.equal(d.errorAtMs, 1044);
  assert.equal(d.flushCalled, false);
  assert.equal(d.outputsAfterError, 0);
  assert.equal(d.closedAtMs, 1050);
});
ok("w2decoded: error ngay chunk đầu (0 output) → decoded trực tiếp = 0", () => {
  const i = inst(7, 1010, [
    ev(1010, "configure"),
    ev(1020, "decode", { ts: W2_TS.min, chunkType: "key" }),
    ev(1025, "error", { detail: "invalid IDR" }),
  ]);
  const d = w2DecodedDirect(i);
  assert.equal(d.outputsBeforeError, 0);
  assert.equal(d.decodeCallsBeforeError, 1);
  assert.equal(d.flushCalled, false);
});
ok("w2decoded: không lỗi (W2 khỏe) → outputs = tổng, error null", () => {
  const i = inst(7, 1010, [
    ev(1010, "configure"),
    ...decodeSeq(1020, 2, 75, W2_TS.min, 33_333),
    ev(1200, "output", { ts: 30_000_000 }),
    ev(1300, "flush-call"),
    ev(1400, "flush-done"),
  ]);
  const d = w2DecodedDirect(i);
  assert.equal(d.outputsBeforeError, 1);
  assert.equal(d.errorAtMs, null);
  assert.equal(d.flushCalled, true);
  assert.equal(d.flushDoneAtMs, 1400);
});
ok("w2decoded: output sau error (bất thường) vẫn đếm riêng, không lẫn vào before", () => {
  const i = inst(7, 1010, [
    ev(1020, "decode", { ts: W2_TS.min }),
    ev(1030, "output", { ts: 30_000_000 }),
    ev(1040, "error", { detail: "x" }),
    ev(1050, "output", { ts: 30_033_333 }),
  ]);
  const d = w2DecodedDirect(i);
  assert.equal(d.outputsBeforeError, 1);
  assert.equal(d.outputsAfterError, 1);
  assert.equal(d.outputsTotal, 2);
});


// --- (5) prefetchTailSpans + analyzeVdTrace (số thật attempt 1, lượt headed đầu) ---
// Attempt 1 lượt 1: t0=19099.8 (tuyệt đối), w2endRel=1714.3,
// settle=1994.6, prefetch feed tuyệt đối [18411.8, 18417.1],
// flush tuyệt đối call 18417.1 done 21093.1, W2 tạo 20810.0,
// decode key ts 30066667 @20810.3, decode-throw delta ts 30166667
// @20810.8, close 20814.0, 0 output, không error.
ok("tailSpans: mốc tuyệt đối → tương đối t0 (feed/flush âm vì xong trước toggle)", () => {
  const i = inst(3, 18411.4, [
    ev(18411.6, "configure"),
    ...decodeSeq(18411.8, 0.04, 136, PF_TS.min, 33_333),
    ev(18417.1, "flush-call"),
    ev(21093.1, "flush-done"),
  ]);
  const s = prefetchTailSpans(i, 19099.8);
  assert.ok(Math.abs((s.feedEndRelMs ?? 0) - -682.7) < 0.2);
  assert.ok(Math.abs((s.flushCallRelMs ?? 0) - -682.7) < 0.2);
  assert.ok(Math.abs((s.flushDoneRelMs ?? 0) - 1993.3) < 0.2);
});
ok("tailSpans: flush chưa resolve → flushDoneRel null", () => {
  const i = inst(3, 100, [ev(110, "decode", { ts: PF_TS.min }), ev(120, "flush-call")]);
  const s = prefetchTailSpans(i, 1000);
  assert.equal(s.flushDoneRelMs, null);
  assert.ok(Math.abs((s.feedEndRelMs ?? 0) - -890) < 0.01);
});
ok("BUG ĐỒNG HỒ (khóa lại): đưa mốc TUYỆT ĐỐI thẳng vào split thì feedTail nuốt trọn gap — sai", () => {
  const s = splitSettleGap({ w2endMs: 1714.3, settleAtMs: 1994.6, feedEndMs: 18417.1, flushCallMs: 18417.1, flushDoneMs: 21093.1 });
  assert.ok(Math.abs(s.feedTailMs - 280.3) < 0.2, `feedTail sai phải ≈280.3 (toàn gap): ${s.feedTailMs}`);
  assert.equal(s.dominant, "feed");
});
ok("analyzeVdTrace attempt 1 thật: split đúng — feed 0, flush ~279, drain ~1.3", () => {
  const other = inst(2, 17395.6, [
    ev(17395.7, "configure"),
    ...decodeSeq(17396.5, 0.03, 121, 408_066_667, 33_333),
    ev(17400.5, "flush-call"),
    ev(18488, "flush-done"),
  ]);
  const pf = inst(3, 18411.4, [
    ev(18411.6, "configure"),
    ...decodeSeq(18411.8, 0.04, 136, PF_TS.min, 33_333),
    ev(18417.1, "flush-call"),
    ev(21093.1, "flush-done"),
  ]);
  const w2 = inst(4, 20810.0, [
    ev(20810.0, "configure"),
    ev(20810.3, "decode", { ts: 30_066_667, chunkType: "key" }),
    ev(20810.8, "decode-throw", { ts: 30_166_667, chunkType: "delta", detail: "Failed to execute 'decode' on 'VideoDecoder': A key frame is required after configure() or flush()." }),
    ev(20814.0, "close"),
  ]);
  const a = analyzeVdTrace({ instances: [other, pf, w2] }, 19099.8, 1714.3, 1994.6);
  assert.ok(a);
  assert.equal(a.instanceCount, 3);
  assert.equal(a.w2Candidates, 1);
  assert.equal(a.prefetchCandidates, 1);
  assert.ok(a.split);
  assert.ok(Math.abs(a.split.feedTailMs - 0) < 0.2);
  assert.ok(Math.abs(a.split.flushTailMs - 279.0) < 0.5);
  assert.ok(Math.abs(a.split.drainTailMs - 1.3) < 0.5);
  assert.equal(a.split.dominant, "flush");
  assert.ok(a.w2decoded);
  assert.equal(a.w2decoded.outputsBeforeError, 0);
  assert.equal(a.w2decoded.outputsTotal, 0);
  assert.equal(a.w2decoded.decodeCallsBeforeError, 1);
  assert.equal(a.w2decoded.decodeCallsTotal, 2);
  assert.equal(a.w2decoded.errorAtMs, null);
  assert.equal(a.w2decoded.flushCalled, false);
});
ok("analyzeVdTrace: không settle → split null nhưng vẫn có w2decoded + classification", () => {
  const w2 = inst(4, 20810.0, [
    ev(20810.3, "decode", { ts: 30_066_667, chunkType: "key" }),
    ev(20810.8, "decode-throw", { ts: 30_166_667, chunkType: "delta", detail: "key frame required" }),
  ]);
  const a = analyzeVdTrace({ instances: [w2] }, 19099.8, 1714.3, null);
  assert.ok(a);
  assert.equal(a.split, null);
  assert.equal(a.w2decoded?.outputsBeforeError, 0);
  assert.equal(a.w2Candidates, 1);
  assert.equal(a.prefetchCandidates, 0);
});
ok("analyzeVdTrace: trace null/rỗng/t0 null → null (không bịa số)", () => {
  assert.equal(analyzeVdTrace(null, 1000, 100, 200), null);
  assert.equal(analyzeVdTrace({ instances: [] }, 1000, 100, 200), null);
  assert.equal(analyzeVdTrace({ instances: [inst(1, 0, [])] }, null, 100, 200), null);
});

ok("w2decoded: decode và decode-throw CÙNG mili-giây → vẫn đếm 1 chunk thành công (xếp theo thứ tự ghi, không so t)", () => {
  // Lượt 1 attempt 2: decode@803.8 và decode-throw@803.8 — so bằng
  // t đếm nhầm 0, xếp theo thứ tự mảng đếm đúng 1.
  const i = inst(7, 1010, [
    ev(1010, "configure"),
    ev(1020, "decode", { ts: 30_066_667, chunkType: "key" }),
    ev(1020, "decode-throw", { ts: 30_166_667, chunkType: "delta", detail: "key frame required" }),
    ev(1021, "close"),
  ]);
  const d = w2DecodedDirect(i);
  assert.equal(d.decodeCallsBeforeError, 1);
  assert.equal(d.decodeCallsTotal, 2);
  assert.equal(d.outputsBeforeError, 0);
  assert.equal(d.errorAtMs, null);
});

for (const t of queue) {
  try {
    t.fn();
    pass++;
    console.log(`PASS ${t.name}`);
  } catch (e) {
    console.log(`FAIL ${t.name} — ${e instanceof Error ? e.message : String(e)}`);
  }
}
console.log(`\nsettle48D2.test: ${pass}/${queue.length} pass`);
if (pass !== queue.length) process.exit(1);
