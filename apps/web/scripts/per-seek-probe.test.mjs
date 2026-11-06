#!/usr/bin/env node
/**
 * Phase 9 đợt 39, luồng T2 — test probe per-seek (U6 §3.3).
 *
 * KHÔNG chạy browser thật: logic trang (per-seek-probe-page.js) được nạp
 * vào vm sandbox với element media giả + rAF giả + performance.now giả,
 * nên mọi timestamp đều xác định và kiểm tra được chính xác tới ms.
 * Phiên đo mẫu cuối file là MÔ PHỎNG (không phải số đo Chrome thật) —
 * nó chứng minh probe + phân tích nối được với nhau qua một phiên
 * reverse đầy đủ, còn phiên headed thật vẫn là nợ mở (xem LIMITS T2).
 * Chạy: node --test apps/web/scripts/per-seek-probe.test.mjs
 *
 * v2 (đợt 40 V6): các test cuối file kiểm tra elementId + mẫu decoded
 * trong lúc seeking + validate tương thích ngược entry v1. 10 test gốc
 * của T2 giữ nguyên, không sửa kỳ vọng nào.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {
  PERSEEK_SPEC_FIELDS, PERSEEK_V2_EXTRA_FIELDS, PERSEEK_VERSION,
  validatePerSeekEntry, mechanismLabel, analyzeSeekingSamples,
  summarizePerSeek, gopIndexFor, reverseEntries,
} from "./per-seek-probe.mjs";

const PAGE_SRC = fs.readFileSync(
  path.join(import.meta.dirname, "per-seek-probe-page.js"), "utf8");

// Fake media class mới cho mỗi test: probe chặn setter trên prototype của
// class này, nên dùng chung class giữa các test sẽ thấy "already-patched".
function makeFakeClass({ webkit = false } = {}) {
  class FakeMedia {
    constructor() {
      this._ct = 0;
      this.seeking = false;
      this.readyState = 2;
      this.tagName = "VIDEO";
      this._decoded = 0;
      this._dropped = 0;
      this._handlers = new Map();
      if (webkit) {
        this.webkitDecodedFrameCount = 0;
        this.webkitDroppedFrameCount = 0;
      }
    }
    addEventListener(type, fn) {
      if (!this._handlers.has(type)) this._handlers.set(type, []);
      this._handlers.get(type).push(fn);
    }
    _emit(type) { for (const fn of this._handlers.get(type) || []) fn(); }
  }
  if (!webkit) {
    FakeMedia.prototype.getVideoPlaybackQuality = function () {
      return { totalVideoFrames: this._decoded, droppedVideoFrames: this._dropped };
    };
  }
  Object.defineProperty(FakeMedia.prototype, "currentTime", {
    configurable: true, enumerable: true,
    get() { return this._ct; },
    set(v) { this._ct = v; },
  });
  return FakeMedia;
}

// Một sandbox probe mới: { sb, el, probe, stepRaf, now }.
function makeProbe({ fps = 30, webkit = false } = {}) {
  const FakeMedia = makeFakeClass({ webkit });
  const state = { now: 1000, queue: [], rafId: 0 };
  const windowObj = { __vcutHoldStats: { hold: 0, draw: 0 } };
  const sb = {
    window: windowObj,
    performance: { now: () => state.now },
    requestAnimationFrame: (cb) => { state.queue.push(cb); return ++state.rafId; },
    cancelAnimationFrame: () => {},
    HTMLMediaElement: FakeMedia,
  };
  vm.createContext(sb);
  const defined = vm.runInContext(PAGE_SRC, sb);
  assert.equal(defined, "defined");
  const el = new FakeMedia();
  const probe = sb.window.__n2PerSeek;
  const stepRaf = (dtMs = 16) => {
    state.now += dtMs;
    const cb = state.queue.shift();
    if (cb) cb(state.now);
  };
  return { sb, windowObj, el, probe, stepRaf, state, FakeMedia };
}

function installReverse(ctx) {
  assert.equal(ctx.probe.install({ fps: 30 }), "installed");
  ctx.probe.mark("reverse");
}

// Một seek hoàn chỉnh qua probe: gán -> seeking -> seeked event -> draw tick.
function completeSeek(ctx, target, { seekTicks = 1, decodedAtSeek = 0, decodedAtSeeked = 0, decodedAtDraw = null, holdAtSeek = null, holdAtDraw = null } = {}) {
  const { el, probe } = ctx;
  if (holdAtSeek !== null) ctx.windowObj.__vcutHoldStats.hold = holdAtSeek;
  el._decoded = decodedAtSeek;
  if (ctx.el.webkitDecodedFrameCount !== undefined) ctx.el.webkitDecodedFrameCount = decodedAtSeek;
  el.currentTime = target;
  el.seeking = true;
  for (let i = 0; i < seekTicks; i++) ctx.stepRaf();
  el.seeking = false;
  el._decoded = decodedAtSeeked;
  if (ctx.el.webkitDecodedFrameCount !== undefined) ctx.el.webkitDecodedFrameCount = decodedAtSeeked;
  el._emit("seeked");
  if (holdAtDraw !== null) ctx.windowObj.__vcutHoldStats.hold = holdAtDraw;
  if (decodedAtDraw !== null) {
    el._decoded = decodedAtDraw;
    if (ctx.el.webkitDecodedFrameCount !== undefined) ctx.el.webkitDecodedFrameCount = decodedAtDraw;
  }
  ctx.stepRaf();
  return probe.entries[probe.entries.length - 1];
}

test("chưa install thì không chặn seek, không ghi entry", () => {
  const ctx = makeProbe();
  ctx.el.currentTime = 5;
  assert.equal(ctx.probe.entries.length, 0);
  assert.equal(ctx.probe.installed, false);
});

test("vòng đời seek đầy đủ: đủ 17 trường §3.3, latency = hiệu timestamp", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  const e = completeSeek(ctx, 20, {
    seekTicks: 1, decodedAtSeek: 100, decodedAtSeeked: 120, decodedAtDraw: 121,
    holdAtSeek: 3, holdAtDraw: 7,
  });
  for (const f of PERSEEK_SPEC_FIELDS) assert.ok(f in e, `thiếu trường spec ${f}`);
  assert.equal(e.status, "completed");
  assert.equal(e.k, 0);
  assert.equal(e.targetTime, 20);
  assert.equal(e.seekLatencyMs, 16);
  assert.equal(e.drawLatencyMs, 16);
  assert.equal(e.rafTicksWhileWaiting, 2);
  assert.equal(e.currentTimeAtSeek, 0);
  assert.equal(e.currentTimeAtSeeked, 20);
  assert.equal(e.decodedFramesAtSeek, 100);
  assert.equal(e.decodedFramesAtSeeked, 120);
  assert.equal(e.decodedFramesAtFirstDraw, 121);
  assert.equal(e.holdCountAtSeek, 3);
  assert.equal(e.holdCountAtFirstDraw, 7);
  assert.equal(e.phase, "reverse");
  assert.equal(e.seekedEvent, true);
  assert.equal(e.firstDrawBasis, "raf-eligible");
  assert.deepEqual(validatePerSeekEntry(e), []);
});

test("fallback webkitDecodedFrameCount khi không có getVideoPlaybackQuality", () => {
  const ctx = makeProbe({ webkit: true });
  installReverse(ctx);
  ctx.el.webkitDecodedFrameCount = 50;
  ctx.el.currentTime = 10;
  ctx.el.seeking = true;
  ctx.stepRaf();
  ctx.el.seeking = false;
  ctx.el.webkitDecodedFrameCount = 60;
  ctx.el._emit("seeked");
  ctx.stepRaf();
  const e = ctx.probe.entries[0];
  assert.equal(e.decodedFramesAtSeek, 50);
  assert.equal(e.decodedFramesAtSeeked, 60);
  assert.equal(e.status, "completed");
});

test("seek bị gán đè: entry cũ chốt superseded, không ghi đè lặng lẽ", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el.currentTime = 20;
  ctx.el.seeking = true;
  ctx.stepRaf();
  ctx.el.currentTime = 10; // gán đè khi seek cũ còn bay
  const first = ctx.probe.entries[0];
  assert.equal(first.status, "superseded");
  assert.equal(first.seekedAtMs, null);
  assert.equal(first.seekLatencyMs, null);
  ctx.el.seeking = false;
  ctx.el._emit("seeked");
  ctx.stepRaf();
  const second = ctx.probe.entries[1];
  assert.equal(second.status, "completed");
  assert.equal(second.k, 1);
  assert.equal(second.targetTime, 10);
});

test("read() flush seek chưa xong thành unresolved, latency null, validate vẫn đạt", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el.currentTime = 15;
  ctx.el.seeking = true;
  ctx.stepRaf();
  const out = ctx.probe.read();
  assert.equal(out.entries[0].status, "unresolved");
  assert.equal(out.entries[0].seekedAtMs, null);
  assert.equal(out.entries[0].seekLatencyMs, null);
  assert.equal(out.entries[0].drawLatencyMs, null);
  assert.deepEqual(validatePerSeekEntry(out.entries[0]), []);
  // counts được tạo trong realm VM nên không deepEqual cả object (khác
  // prototype); harness JSON-stringify nên không ảnh hưởng — kiểm tra
  // theo trường thay vì deepEqual.
  assert.equal(out.counts.unresolved, 1);
});

test("setEnabled(false) dừng ghi, setEnabled(true) ghi lại", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  assert.equal(ctx.probe.setEnabled(false), "disabled");
  ctx.stepRaf(); // xả tick rAF đã lên lịch trước khi tắt
  ctx.el.currentTime = 9;
  assert.equal(ctx.probe.entries.length, 0);
  assert.equal(ctx.probe.setEnabled(true), "enabled");
  completeSeek(ctx, 8, { seekTicks: 1 });
  assert.equal(ctx.probe.entries.length, 1);
  assert.equal(ctx.probe.entries[0].status, "completed");
});

test("validate bắt latency bị sửa tay", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  const e = completeSeek(ctx, 20, { seekTicks: 1 });
  const tampered = { ...e, seekLatencyMs: e.seekLatencyMs + 5 };
  const problems = validatePerSeekEntry(tampered);
  assert.ok(problems.some((p) => p.includes("seekLatencyMs")), JSON.stringify(problems));
});

function mkEntry({ seek, draw, dec, delta, status = "completed" }) {
  const requested = 1000;
  const seeked = requested + seek;
  return {
    k: 0, targetTime: 18, seekRequestedAtMs: requested, seekedAtMs: seeked,
    firstDrawAfterSeekAtMs: seeked + draw,
    firstDecodedAfterSeekAtMs: dec === null ? null : seeked + dec,
    seekLatencyMs: seek, drawLatencyMs: draw,
    currentTimeAtSeek: 19, currentTimeAtSeeked: 18,
    decodedFramesAtSeek: 0, decodedFramesAtSeeked: 10,
    decodedFramesAtFirstDraw: 10 + (delta ?? 0),
    decodedDeltaToFirstDraw: delta ?? null,
    droppedFramesAtSeek: 0, droppedFramesAtSeeked: 0,
    rafTicksWhileWaiting: 5, holdCountAtSeek: 0, holdCountAtFirstDraw: 0,
    phase: "reverse", status, elementKind: "video", seekedEvent: true,
    firstDrawBasis: "raf-eligible",
  };
}

test("mechanismLabel khớp cả 3 dự đoán U6 §3.3 + fast + undetermined", () => {
  assert.equal(mechanismLabel(mkEntry({ seek: 250, draw: 40, dec: 20, delta: 5 })).label, "seek-scheduling");
  assert.equal(mechanismLabel(mkEntry({ seek: 20, draw: 300, dec: null, delta: 0 })).label, "decode-stall");
  assert.equal(mechanismLabel(mkEntry({ seek: 20, draw: 300, dec: 20, delta: 5 })).label, "presentation-draw");
  assert.equal(mechanismLabel(mkEntry({ seek: 20, draw: 30, dec: 10, delta: 1 })).label, "fast");
  assert.equal(mechanismLabel(mkEntry({ seek: 20, draw: 30, dec: 10, delta: 1, status: "superseded" })).label, "undetermined");
});

test("gopIndexFor + summarizePerSeek: nhóm đúng đoạn GOP 10 s", () => {
  assert.equal(gopIndexFor(19.9, 10), 1);
  assert.equal(gopIndexFor(20, 10), 2);
  assert.equal(gopIndexFor(5, null), null);
  const entries = [
    { ...mkEntry({ seek: 20, draw: 30, dec: 10, delta: 1 }), k: 0, targetTime: 29 },
    { ...mkEntry({ seek: 20, draw: 30, dec: 10, delta: 1 }), k: 1, targetTime: 19 },
    { ...mkEntry({ seek: 20, draw: 300, dec: null, delta: 0 }), k: 2, targetTime: 18 },
    { ...mkEntry({ seek: 20, draw: 30, dec: 10, delta: 1 }), k: 3, targetTime: 8 },
  ];
  const s = summarizePerSeek(entries, { gopSeconds: 10 });
  assert.equal(s.count, 4);
  assert.deepEqual(s.bySegment.map((b) => [b.segment, b.count]), [[0, 1], [1, 2], [2, 1]]);
  assert.equal(s.bySegment[1].byMechanism["decode-stall"], 1);
  assert.equal(s.byMechanism["fast"], 3);
  assert.equal(s.seekLatencyMs.median, 20);
});

test("phiên mẫu MÔ PHỎNG: GOP2 decode-stall tách được khỏi GOP khác fast", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  // 3 seek nhanh ở GOP 20-30 s (target 29/28/27).
  for (const t of [29, 28, 27]) completeSeek(ctx, t, { seekTicks: 1, decodedAtSeeked: 10, decodedAtDraw: 11 });
  // 3 seek ở GOP 10-20 s: seeked nhanh nhưng element chưa drawable
  // (readyState 1) suốt 7 tick, decoded đứng yên -> decode-stall.
  for (const t of [19, 18, 17]) {
    ctx.el.currentTime = t;
    ctx.el.seeking = true;
    ctx.stepRaf();
    ctx.el.seeking = false;
    ctx.el._emit("seeked");
    ctx.el.readyState = 1;
    for (let i = 0; i < 7; i++) ctx.stepRaf();
    ctx.el.readyState = 2;
    ctx.stepRaf();
  }
  const out = ctx.probe.read();
  assert.equal(out.entries.length, 6);
  assert.ok(out.entries.every((e) => validatePerSeekEntry(e).length === 0));
  const rev = reverseEntries(out.entries);
  const s = summarizePerSeek(rev, { gopSeconds: 10 });
  const seg1 = s.bySegment.find((b) => b.segment === 1);
  const seg2 = s.bySegment.find((b) => b.segment === 2);
  assert.equal(seg2.byMechanism["fast"], 3);
  assert.equal(seg1.byMechanism["decode-stall"], 3);
  assert.ok(seg1.medianDrawLatencyMs >= 100, `draw GOP2 phải >= 100ms, được ${seg1.medianDrawLatencyMs}`);
});

// ===== v2 (đợt 40 V6): elementId + mẫu decoded trong lúc seeking =====

test("v2: version per-seek-v2, entry mới đủ 17 trường spec + 5 trường v2", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  const e = completeSeek(ctx, 20, { seekTicks: 1, decodedAtSeek: 100, decodedAtSeeked: 120, decodedAtDraw: 121 });
  assert.equal(ctx.probe.read().version, "per-seek-v2");
  assert.equal(PERSEEK_VERSION, "per-seek-v2");
  for (const f of PERSEEK_SPEC_FIELDS) assert.ok(f in e, `thiếu trường spec ${f}`);
  for (const f of PERSEEK_V2_EXTRA_FIELDS) assert.ok(f in e, `thiếu trường v2 ${f}`);
  assert.deepEqual(validatePerSeekEntry(e), []);
});

test("v2: elementId ổn định theo element, element khác nhau id khác nhau", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  const el2 = new ctx.FakeMedia();
  ctx.el.currentTime = 20;
  el2.currentTime = 10;
  ctx.el.currentTime = 5; // cùng element đầu → cùng id
  const [a, b, c] = ctx.probe.entries;
  assert.equal(a.elementId, 0);
  assert.equal(b.elementId, 1);
  assert.equal(c.elementId, 0);
  assert.notEqual(a.elementId, b.elementId);
});

test("v2: mẫu decoded TRONG lúc seeking — tăng đều, đơn điệu, dừng sau seeked", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el._decoded = 100;
  ctx.el.currentTime = 20;
  ctx.el.seeking = true;
  for (const d of [105, 110, 115]) {
    ctx.el._decoded = d;
    ctx.stepRaf();
  }
  ctx.el.seeking = false;
  ctx.el._decoded = 120;
  ctx.el._emit("seeked");
  ctx.stepRaf(); // tick draw: đã seeked nên KHÔNG thêm mẫu
  const e = ctx.probe.entries[0];
  assert.equal(e.status, "completed");
  assert.equal(e.decodedSamplesWhileSeeking.length, 3);
  // Mảng/mẫu tạo trong realm VM: Array.from về realm host trước khi
  // deepEqual (cùng lý do T2 ghi chú ở test read() counts).
  assert.deepEqual(Array.from(e.decodedSamplesWhileSeeking.map((s) => s.decoded)), [105, 110, 115]);
  const ts = Array.from(e.decodedSamplesWhileSeeking.map((s) => s.tMs));
  assert.ok(ts.every((t) => t >= e.seekRequestedAtMs));
  assert.ok(ts[0] < ts[1] && ts[1] < ts[2]);
  assert.equal(e.droppedSeekingSamples, 0);
  const a = analyzeSeekingSamples(e);
  assert.equal(a.sampleCount, 3);
  assert.equal(a.progress, "rising");
  assert.equal(a.decodedDeltaWhileSeeking, 15);
  assert.deepEqual(validatePerSeekEntry(e), []);
});

test("v2: decoded đứng yên trong lúc seeking → analyzeSeekingSamples flat, delta 0", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el._decoded = 50;
  ctx.el.currentTime = 20;
  ctx.el.seeking = true;
  ctx.stepRaf();
  ctx.stepRaf();
  ctx.el.seeking = false;
  ctx.el._emit("seeked");
  ctx.stepRaf();
  const e = ctx.probe.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 2);
  const a = analyzeSeekingSamples(e);
  assert.equal(a.progress, "flat");
  assert.equal(a.decodedDeltaWhileSeeking, 0);
});

test("v2: vượt trần mẫu thì đếm droppedSeekingSamples, không lưu thêm", () => {
  const ctx = makeProbe();
  assert.equal(ctx.probe.install({ fps: 30, maxSeekingSamples: 2 }), "installed");
  ctx.probe.mark("reverse");
  ctx.el.currentTime = 20;
  ctx.el.seeking = true;
  for (let i = 0; i < 4; i++) ctx.stepRaf();
  const e = ctx.probe.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 2);
  assert.equal(e.droppedSeekingSamples, 2);
  assert.deepEqual(validatePerSeekEntry(e), []);
});

test("v2: read() flush ghi src/readyState cho entry unresolved", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el.currentSrc = "blob:fake-src";
  ctx.el.readyState = 2;
  ctx.el.currentTime = 15;
  ctx.el.seeking = true;
  ctx.stepRaf();
  const out = ctx.probe.read();
  const e = out.entries[0];
  assert.equal(e.status, "unresolved");
  assert.equal(e.flushElementSrc, "blob:fake-src");
  assert.equal(e.flushElementReadyState, 2);
  assert.deepEqual(validatePerSeekEntry(e), []);
  // Entry đã hoàn tất trước read() thì flush fields giữ null (không bịa).
  const ctx2 = makeProbe();
  installReverse(ctx2);
  completeSeek(ctx2, 20, { seekTicks: 1 });
  const done = ctx2.probe.read().entries[0];
  assert.equal(done.flushElementSrc, null);
  assert.equal(done.flushElementReadyState, null);
});

test("v2: validate tương thích ngược — entry v1 (không trường v2) vẫn đạt", () => {
  const v1 = mkEntry({ seek: 20, draw: 30, dec: 10, delta: 1 });
  assert.ok(!("elementId" in v1));
  assert.deepEqual(validatePerSeekEntry(v1), []);
  assert.equal(analyzeSeekingSamples(v1).progress, "unknown");
  assert.equal(analyzeSeekingSamples(v1).sampleCount, 0);
});

test("v2: validate bắt mẫu seeking sai (tMs không đơn điệu, decoded âm)", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  const e = completeSeek(ctx, 20, { seekTicks: 1 });
  const badOrder = { ...e, decodedSamplesWhileSeeking: [
    { tMs: e.seekRequestedAtMs + 32, decoded: 1, dropped: 0 },
    { tMs: e.seekRequestedAtMs + 16, decoded: 2, dropped: 0 },
  ] };
  assert.ok(validatePerSeekEntry(badOrder).some((p) => p.includes("đơn điệu")));
  const badDecoded = { ...e, decodedSamplesWhileSeeking: [
    { tMs: e.seekRequestedAtMs + 16, decoded: -1, dropped: 0 },
  ] };
  assert.ok(validatePerSeekEntry(badDecoded).some((p) => p.includes("decoded")));
  const badId = { ...e, elementId: -1 };
  assert.ok(validatePerSeekEntry(badId).some((p) => p.includes("elementId")));
});

// ===== đợt 42 X5: thử thách trần 1000 mẫu mặc định (pure logic, vm fake) =====
// Hành vi thiết kế (per-seek-probe-page.js): vượt trần thì ĐẾM vào
// droppedSeekingSamples và KHÔNG lưu thêm — mẫu cũ không bị ghi đè hay
// mất lặng lẽ, probe không crash, entry vẫn chốt completed bình thường.
// 1200 tick seeking ở ~60 fps mô phỏng ≈ 20 s kẹt seek (> 16 s tương
// đương trần ở 60 fps mà W5 chưa chạm tới).

test("x5: trần 1000 mặc định — 1200 tick seeking: giữ 1000 mẫu đầu, đếm 200 mẫu tràn, không crash", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el._decoded = 0;
  ctx.el.currentTime = 20;
  ctx.el.seeking = true;
  for (let i = 1; i <= 1200; i++) {
    ctx.el._decoded = i;
    ctx.stepRaf();
  }
  const e = ctx.probe.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 1000);
  assert.equal(e.droppedSeekingSamples, 200);
  // Mẫu cũ nguyên vẹn, không bị ghi đè bởi mẫu mới: mẫu đầu = tick 1,
  // mẫu cuối được giữ = tick 1000 (không phải tick 1200).
  const kept = Array.from(e.decodedSamplesWhileSeeking.map((s) => s.decoded));
  assert.equal(kept[0], 1);
  assert.equal(kept[999], 1000);
  assert.ok(kept.every((v, i) => v === i + 1), "1000 mẫu giữ phải là dãy 1..1000 liên tục");
  // Số mẫu giữ + số đếm tràn = tổng số tick — không mẫu nào mất không dấu vết.
  assert.equal(e.decodedSamplesWhileSeeking.length + e.droppedSeekingSamples, 1200);
  assert.deepEqual(validatePerSeekEntry(e), []);
  const a = analyzeSeekingSamples(e);
  assert.equal(a.sampleCount, 1000);
  assert.equal(a.droppedSeekingSamples, 200);
  assert.equal(a.progress, "rising");
  // Entry vẫn chốt completed bình thường sau khi chạm trần.
  ctx.el.seeking = false;
  ctx.el._decoded = 1200;
  ctx.el._emit("seeked");
  ctx.stepRaf();
  assert.equal(e.status, "completed");
  assert.equal(e.decodedSamplesWhileSeeking.length, 1000);
  assert.equal(e.droppedSeekingSamples, 200);
});

test("x5: biên trần — đúng 1000 tick không tràn, tick 1001 đếm đúng 1", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el.currentTime = 20;
  ctx.el.seeking = true;
  for (let i = 0; i < 1000; i++) ctx.stepRaf();
  let e = ctx.probe.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 1000);
  assert.equal(e.droppedSeekingSamples, 0);
  ctx.stepRaf();
  assert.equal(e.decodedSamplesWhileSeeking.length, 1000);
  assert.equal(e.droppedSeekingSamples, 1);
});

test("x5: trần là theo entry, không phải toàn cục — entry thứ hai được cấp lại 1000", () => {
  const ctx = makeProbe();
  installReverse(ctx);
  ctx.el.currentTime = 20;
  ctx.el.seeking = true;
  for (let i = 0; i < 1005; i++) ctx.stepRaf();
  const first = ctx.probe.entries[0];
  assert.equal(first.droppedSeekingSamples, 5);
  ctx.el.seeking = false;
  ctx.el._emit("seeked");
  ctx.stepRaf();
  assert.equal(first.status, "completed");
  ctx.el.currentTime = 10;
  ctx.el.seeking = true;
  for (let i = 0; i < 10; i++) ctx.stepRaf();
  const second = ctx.probe.entries[1];
  assert.equal(second.decodedSamplesWhileSeeking.length, 10);
  assert.equal(second.droppedSeekingSamples, 0);
});
