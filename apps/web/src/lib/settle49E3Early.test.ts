// settle49E3Early.test.ts — Phase 9 đợt 49, luồng E3: khóa số học
// settle-sớm của hướng (b) (tìm prefetch không dùng liveness D2,
// mốc resolve = output thứ 90 của frame mới, phân loại attempt).
//
// Test thuần, chỉ import settle49E3Early.ts (+ type từ settle48D2.ts),
// chạy bằng esbuild bundle --format=esm (mẫu A1/B1/C2/D2):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settle49E3Early.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/e3early.test.mjs \
//     && node <scratch>/e3early.test.mjs
// Số fixture: cửa sổ 412 [12240,12360] chunk ts 408.066.667–
// 412.033.333 µs; prefetch 412 [12150,12285] chunk ts
// 405.066.667–409.533.333 µs; frame mới = 90 sample đầu prefetch.
import assert from "node:assert/strict";
import {
  classifyEarlySettle,
  earlyResolveTimeMs,
  findPrefetchInstance,
} from "./settle49E3Early";
import type { VdDecoderInstance, VdTraceEvent } from "./settle48D2";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

const T0 = 10000; // mốc toggle (performance.now tuyệt đối trong page)
const WIN_TS_MIN = 408_066_667;

function ev(
  t: number,
  kind: VdTraceEvent["kind"],
  extra: Partial<VdTraceEvent> = {},
): VdTraceEvent {
  return { t, kind, ...extra };
}
function inst(
  id: number,
  createdAt: number,
  events: VdTraceEvent[],
): VdDecoderInstance {
  return { id, createdAt, events };
}
// 136 decode theo thứ tự feed, ts tăng 33.333 µs từ 405.066.667.
function decodeSeq(t0: number, step: number): VdTraceEvent[] {
  const out: VdTraceEvent[] = [];
  for (let i = 0; i < 136; i++) {
    out.push(
      ev(t0 + i * step, "decode", {
        ts: 405_066_667 + i * 33_333,
        chunkType: i === 0 ? "key" : "delta",
      }),
    );
  }
  return out;
}
function prefetchInst(opts: {
  createdAt: number;
  feedT0: number;
  feedStep?: number;
  outT0?: number;
  outStep?: number;
  outCount?: number;
}): VdDecoderInstance {
  const feedStep = opts.feedStep ?? 0.02;
  const evs: VdTraceEvent[] = [ev(opts.createdAt, "configure")];
  evs.push(...decodeSeq(opts.feedT0, feedStep));
  evs.push(ev(opts.feedT0 + 136 * feedStep, "flush-call"));
  const outT0 = opts.outT0 ?? opts.feedT0 + 5;
  const outStep = opts.outStep ?? 2;
  const outCount = opts.outCount ?? 136;
  for (let i = 0; i < outCount; i++) {
    evs.push(ev(outT0 + i * outStep, "output", { ts: 405_066_667 + i * 33_333 }));
  }
  return inst(2, opts.createdAt, evs);
}
function windowInst(): VdDecoderInstance {
  const evs: VdTraceEvent[] = [ev(9000, "configure")];
  for (let i = 0; i < 121; i++) {
    evs.push(
      ev(9001 + i * 0.02, "decode", {
        ts: 408_066_667 + i * 33_333,
        chunkType: i === 0 ? "key" : "delta",
      }),
    );
  }
  evs.push(ev(9005, "flush-call"), ev(9100, "flush-done"));
  return inst(1, 9000, evs);
}

// --- (1) findPrefetchInstance ---
ok("findPrefetch: trả đúng instance prefetch giữa 3 instance (window/prefetch/w2)", () => {
  const w2 = inst(3, T0 + 12, [
    ev(T0 + 12, "configure"),
    ev(T0 + 12.1, "decode", { ts: 30_066_667, chunkType: "key" }),
    ev(T0 + 12.2, "decode-throw", { ts: 30_166_667, chunkType: "delta" }),
  ]);
  const found = findPrefetchInstance(
    [windowInst(), prefetchInst({ createdAt: 9500, feedT0: 9501 }), w2],
    T0,
    WIN_TS_MIN,
  );
  assert.ok(found);
  assert.equal(found.id, 2);
});
ok("findPrefetch: snapshot sớm (flush chưa resolve, chỉ có flush-call trước t0) vẫn tìm được — khác D2 liveness", () => {
  // Prefetch tạo 9500, feed xong 9504, flush-call 9504, output tới
  // sau t0 (T0+50) nhưng KHÔNG có flush-done trong trace (snapshot
  // sớm như run3). D2 classifyDecoderInstance sẽ nhận nhầm thành
  // "other" vì lastActivity (flush-call) < t0; E3 tìm bằng ts.
  const pf = prefetchInst({
    createdAt: 9500,
    feedT0: 9501,
    outT0: 9506,
    outStep: 1,
    outCount: 127,
  });
  const found = findPrefetchInstance([windowInst(), pf], T0, WIN_TS_MIN);
  assert.ok(found);
  assert.equal(found.id, 2);
});
ok("findPrefetch: không có prefetch → null; instance tạo sau t0 → null", () => {
  assert.equal(findPrefetchInstance([windowInst()], T0, WIN_TS_MIN), null);
  const late = prefetchInst({ createdAt: T0 + 5, feedT0: T0 + 6 });
  assert.equal(
    findPrefetchInstance([windowInst(), late], T0, WIN_TS_MIN),
    null,
  );
});

// --- (2) earlyResolveTimeMs ---
ok("earlyResolve: 90 output mới tới ở t=9550.5 → tRelMs=-449.5", () => {
  const pf = prefetchInst({
    createdAt: 9500,
    feedT0: 9501,
    outT0: 9506,
    outStep: 0.5,
    outCount: 127,
  });
  const newTs: number[] = [];
  for (let i = 0; i < 90; i++) newTs.push(405_066_667 + i * 33_333);
  const r = earlyResolveTimeMs(pf, T0, newTs);
  assert.ok(r);
  // output thứ 90 (index 89) ở 9506 + 89*0.5 = 9550.5 → rel -449.5
  assert.equal(r.newOutputs, 90);
  assert.ok(Math.abs(r.tRelMs - (9550.5 - T0)) < 0.01, `tRelMs=${r.tRelMs}`);
});
ok("earlyResolve: output trùng ts chỉ đếm 1 lần (distinct) — thiếu frame mới → null", () => {
  const pf = prefetchInst({
    createdAt: 9500,
    feedT0: 9501,
    outT0: 9506,
    outStep: 1,
    outCount: 90,
  });
  // Ghi đè: output cuối trùng ts với output trước (2 sample trùng pts).
  pf.events[pf.events.length - 1] = ev(9595, "output", { ts: 405_066_667 + 88 * 33_333 });
  const newTs: number[] = [];
  for (let i = 0; i < 90; i++) newTs.push(405_066_667 + i * 33_333);
  assert.equal(earlyResolveTimeMs(pf, T0, newTs), null);
});
ok("earlyResolve: chưa đủ 90 output mới → null", () => {
  const pf = prefetchInst({
    createdAt: 9500,
    feedT0: 9501,
    outT0: 9506,
    outStep: 1,
    outCount: 50,
  });
  const newTs: number[] = [];
  for (let i = 0; i < 90; i++) newTs.push(405_066_667 + i * 33_333);
  assert.equal(earlyResolveTimeMs(pf, T0, newTs), null);
});

// --- (3) classifyEarlySettle ---
ok("classify: settle trước W2end + drop xong → SUCCESS-early-settle", () => {
  const r = classifyEarlySettle({
    tResolveRelMs: -3.5,
    w2endRelMs: 12.9,
    cacheAfterWait: 121,
    settledAfterWait: 90,
    windowFrames: 121,
    newFrames: 90,
  });
  assert.equal(r.cls, "SUCCESS-early-settle");
});
ok("classify: settle trước W2end nhưng cache vẫn 211 → PARTIAL-early-settle-no-drop", () => {
  const r = classifyEarlySettle({
    tResolveRelMs: -3.1,
    w2endRelMs: 11.5,
    cacheAfterWait: 211,
    settledAfterWait: 0,
    windowFrames: 121,
    newFrames: 90,
  });
  assert.equal(r.cls, "PARTIAL-early-settle-no-drop");
});
ok("classify: settle sau W2end → PARTIAL-early-settle-late", () => {
  const r = classifyEarlySettle({
    tResolveRelMs: 300,
    w2endRelMs: 100,
    cacheAfterWait: 121,
    settledAfterWait: 90,
    windowFrames: 121,
    newFrames: 90,
  });
  assert.equal(r.cls, "PARTIAL-early-settle-late");
});
ok("classify: thiếu mốc resolve hoặc cuối W2 → INVALID-no-early-resolve-time", () => {
  assert.equal(
    classifyEarlySettle({
      tResolveRelMs: null,
      w2endRelMs: 12,
      cacheAfterWait: 121,
      settledAfterWait: 90,
      windowFrames: 121,
      newFrames: 90,
    }).cls,
    "INVALID-no-early-resolve-time",
  );
  assert.equal(
    classifyEarlySettle({
      tResolveRelMs: -3,
      w2endRelMs: null,
      cacheAfterWait: 121,
      settledAfterWait: 90,
      windowFrames: 121,
      newFrames: 90,
    }).cls,
    "INVALID-no-early-resolve-time",
  );
});
ok("classify: settle thắng nhưng không đọc được cache cuối → SUCCESS-early-settle-unverified-drop", () => {
  const r = classifyEarlySettle({
    tResolveRelMs: -1,
    w2endRelMs: 10,
    cacheAfterWait: null,
    settledAfterWait: null,
    windowFrames: 121,
    newFrames: 90,
  });
  assert.equal(r.cls, "SUCCESS-early-settle-unverified-drop");
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
console.log(`\n== settle49E3Early.test: ${pass}/${queue.length} pass ==`);
if (pass !== queue.length) process.exit(1);
