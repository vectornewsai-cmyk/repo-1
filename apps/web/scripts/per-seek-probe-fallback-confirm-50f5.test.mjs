// Phase 9 đợt 50, luồng F5 — test khóa vá fallback rAF cần xác nhận
// liên tiếp + frame sẵn sàng (nợ E5 §6.7: probe đóng seek sau 5–15 ms
// trên B-frame, 0 mẫu; F5a chỉ đếm tick vẫn chốt sớm vì cửa sổ
// tiền-seek dài ~8 s — xem LIMITS F5 §2).
//
// Chạy: node --test apps/web/scripts/per-seek-probe-fallback-confirm-50f5.test.mjs
// (từ gốc repo; mẫu E5 pool-element-fingerprint-49e5.test.mjs).
//
// Cách test: nạp CODE PROBE THẬT (per-seek-probe-page.js + vá F5 qua
// per-seek-probe-patch50f5.mjs — cùng helper script đo dùng) vào vm với
// HTMLMediaElement giả tối thiểu (descriptor currentTime thật để probe
// vá setter như trên Chrome, rAF bơm tay, performance.now điều khiển
// được). Không mock logic probe — chỉ mock DOM/bộ đếm thời gian.
// KHÔNG push, KHÔNG binary.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { patchProbeSrc50F5, matchDropFingerprint } from "./per-seek-probe-patch50f5.mjs";
import { patchProbeSrc49E5 } from "./per-seek-probe-patch49e5.mjs";

const SCRIPTS = path.resolve(import.meta.dirname);
const PROBE_RAW = fs.readFileSync(path.join(SCRIPTS, "per-seek-probe-page.js"), "utf8");

// Fake HTMLMediaElement tối thiểu, định nghĩa TRONG vm realm để probe vá
// đúng prototype của nó (như Chrome vá HTMLMediaElement.prototype).
// Copy y hệt harness E5 (chỉ đổi tên class để khỏi lẫn khi chạy cùng).
const FAKE_MEDIA_SRC = `
class __FakeMediaF5 {
  constructor() {
    this._ct = 0;
    this._listeners = new Map();
    this.tagName = "VIDEO";
    this.seeking = false;
    this.readyState = 0;
    this.currentSrc = "";
    this.src = "";
    this._decoded = 0;
    this._dropped = 0;
  }
  pause() {}
  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    const arr = this._listeners.get(type);
    if (!arr) return;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  }
  getVideoPlaybackQuality() { return { totalVideoFrames: this._decoded, droppedVideoFrames: this._dropped }; }
  __fire(type) { for (const fn of [...(this._listeners.get(type) || [])]) fn(); }
}
Object.defineProperty(__FakeMediaF5.prototype, "currentTime", {
  configurable: true, enumerable: true,
  get() { return this._ct; },
  set(v) { this._ct = v; },
});
__FakeMediaF5;
`;

function makeProbe(patchFn, installOpts) {
  const sandbox = { console };
  sandbox.window = sandbox;
  let nowMs = 1000;
  sandbox.performance = { now: () => nowMs };
  const rafQueue = [];
  let rafId = 0;
  sandbox.requestAnimationFrame = (cb) => { rafQueue.push(cb); rafId += 1; return rafId; };
  sandbox.cancelAnimationFrame = (id) => { /* queue bơm tay: hủy bằng cờ readDone của probe, đủ cho test */ };
  vm.createContext(sandbox);
  const FakeMedia = vm.runInContext(FAKE_MEDIA_SRC, sandbox);
  sandbox.HTMLMediaElement = FakeMedia; // probe vá HTMLMediaElement.prototype
  const patched = patchFn(PROBE_RAW);
  const defined = vm.runInContext(patched, sandbox);
  assert.equal(defined, "defined");
  const probe = sandbox.__n2PerSeek;
  assert.equal(probe.install({ fps: 30, ...(installOpts || {}) }), "installed");
  const pump = (n) => {
    for (let i = 0; i < n; i++) {
      const cb = rafQueue.shift();
      if (!cb) break;
      nowMs += 1000 / 60;
      cb(nowMs);
    }
  };
  return { sandbox, probe, FakeMedia, pump, now: () => nowMs };
}

test("đỏ-trước: probe chưa vá F5 (chỉ E5) chốt entry ngay tick đầu tiền-seek — đúng lỗi E5", () => {
  // Mô phỏng đúng signature E5 B-frame: tick đầu sau gán thấy
  // seeking=false + currentTime đã ở target (seek thật chưa bắt đầu).
  const { probe, FakeMedia, pump } = makeProbe(patchProbeSrc49E5);
  const el = new FakeMedia();
  el.currentTime = 25;
  assert.equal(probe.entries.length, 1);
  pump(1); // tick 1: seeking=false, ct=25 → fallback cũ chốt ngay
  const e = probe.entries[0];
  assert.notEqual(e.seekedAtMs, null, "probe cũ chốt seekedAtMs ngay tick 1");
  assert.equal(e.seekedEvent, false, "đóng bằng fallback, không phải seeked thật");
  assert.equal(e.decodedSamplesWhileSeeking.length, 0, "0 mẫu — đúng lỗi E5 §4");
  // Seek thật bắt đầu SAU đó cũng không cứu được entry đã chốt.
  el.seeking = true;
  pump(10);
  assert.equal(e.decodedSamplesWhileSeeking.length, 0, "entry đã chốt nên không tích thêm mẫu nào");
});

test("vá F5b: tick tiền-seek (readyState=0) KHÔNG đếm xác nhận; seek bắt đầu thì tích mẫu", () => {
  const { probe, FakeMedia, pump, now } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentTime = 25; // readyState mặc định 0 (HAVE_NOTHING) như B-frame tiền-seek
  const e = probe.entries[0];
  assert.equal(e.fallbackConfirmTicks, 0);
  assert.equal(e.fallbackConfirmed, false);
  pump(100); // 100 tick seeking=false + ct=target nhưng readyState=0
  assert.equal(e.seekedAtMs, null, "readyState=0 thì không chốt dù đủ 30 tick");
  assert.equal(e.fallbackConfirmTicks, 0, "không đếm tick nào khi chưa có frame");
  assert.equal(e.decodedSamplesWhileSeeking.length, 0);
  // Seek thật bắt đầu: seeking=true, readyState=1 → reset + tích mẫu.
  el.seeking = true;
  el.readyState = 1;
  pump(10);
  assert.equal(e.seekedAtMs, null, "đang seeking thì không chốt");
  assert.equal(e.fallbackConfirmTicks, 0, "bộ đếm reset khi seeking=true");
  assert.equal(e.decodedSamplesWhileSeeking.length, 10, "tích đủ 10 mẫu trong lúc seeking");
  assert.equal(e.seekingSeen, true);
  void now;
});

test("vá F5b: seek nhanh hoàn tất thật (readyState=2) → chốt sau 30 tick, seekedAtMs lấy mốc tick đầu (latency không lệch)", () => {
  const { probe, FakeMedia, pump, now } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentTime = 25;
  el.readyState = 2; // frame đã sẵn sàng ngay tick đầu (seek nhanh thật)
  const e = probe.entries[0];
  const tReq = e.seekRequestedAtMs;
  pump(1);
  const tFirst = now(); // mốc tick đầu tiên của chuỗi xác nhận
  assert.equal(e.seekedAtMs, null, "tick 1 chưa chốt");
  pump(29); // đủ 30 tick liên tiếp seeking=false + ct=target
  assert.equal(e.fallbackConfirmTicks, 30);
  assert.equal(e.fallbackConfirmed, true);
  assert.equal(e.seekedEvent, false, "đóng bằng fallback đã xác nhận");
  assert.equal(e.seekedAtMs, tFirst, "seekedAtMs lấy mốc tick đầu, không phải tick chốt");
  // seekLatencyMs chỉ được tính trong finalize() (khi firstDraw tới) —
  // như probe gốc: mô phỏng frame đủ điều kiện vẽ rồi mới đọc latency.
  el.readyState = 2;
  pump(1);
  assert.equal(e.status, "completed");
  assert.ok(e.seekLatencyMs !== null && e.seekLatencyMs < 100, `latency ${e.seekLatencyMs} ms vẫn ~1 tick, không lệch +500 ms`);
  assert.equal(e.seekLatencyMs, tFirst - tReq, "latency = mốc tick đầu − lúc gán");
});

test("vá F5b: 29 tick xác nhận rồi seeking=true thì reset — phải đủ 30 tick MỚI mới chốt", () => {
  const { probe, FakeMedia, pump } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentTime = 25;
  el.readyState = 2;
  const e = probe.entries[0];
  pump(29);
  assert.equal(e.seekedAtMs, null, "29 tick chưa đủ, chưa chốt");
  assert.equal(e.fallbackConfirmTicks, 29);
  el.seeking = true; // seek thật bắt đầu muộn (main thread bận)
  pump(3); // 3 mẫu trong lúc seeking
  assert.equal(e.decodedSamplesWhileSeeking.length, 3);
  assert.equal(e.fallbackConfirmTicks, 0, "reset về 0");
  assert.equal(e.seekedAtMs, null);
  el.seeking = false; // seek xong thật (ct vẫn ở target)
  el.readyState = 2; // frame sẵn sàng cho chuỗi xác nhận mới
  pump(29);
  assert.equal(e.seekedAtMs, null, "29 tick của chuỗi mới chưa đủ");
  pump(1);
  assert.notEqual(e.seekedAtMs, null, "đủ 30 tick chuỗi mới thì chốt");
  assert.equal(e.fallbackConfirmed, true);
});

test("vá F5: sự kiện seeked thật vẫn chốt lấy mẫu như cũ (không đổi đường seeked)", () => {
  const { probe, FakeMedia, pump } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentTime = 5;
  el.seeking = true;
  pump(10); // 10 mẫu trong lúc seeking
  const e = probe.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 10);
  el.seeking = false;
  el.__fire("seeked"); // sự kiện seeked thật bắn
  assert.notEqual(e.seekedAtMs, null, "seeked thật chốt seekedAtMs");
  assert.equal(e.seekedEvent, true);
  assert.equal(e.fallbackConfirmed, false, "không phải fallback");
  // Tick tiếp theo trong lúc seeking=true (nếu có) không tích thêm mẫu
  // vì seekedAtMs đã set — hành vi cũ giữ nguyên.
  el.seeking = true;
  pump(5);
  assert.equal(e.decodedSamplesWhileSeeking.length, 10, "đã seeked thì không tích thêm mẫu");
});

test("vá F5b: mô phỏng B-frame — tiền-seek 100 tick không chốt, seeking tích mẫu, đủ frame mới chốt", () => {
  const { probe, FakeMedia, pump, now } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentTime = 25;
  const e = probe.entries[0];
  const tReq = e.seekRequestedAtMs;
  // Giai đoạn tiền-seek như lượt F5a đo được: seeking=false + ct=25 +
  // readyState=0 kéo dài (~8 s thật = ~200 tick ở 25 fps; bơm 100 tick
  // là đủ chứng minh không chốt).
  pump(100);
  assert.equal(e.seekedAtMs, null, "tiền-seek không chốt");
  assert.equal(e.fallbackConfirmTicks, 0);
  assert.equal(e.decodedSamplesWhileSeeking.length, 0);
  // Chrome phát range request, element lật seeking=true (readyState 0→1).
  el.seeking = true;
  el.readyState = 1;
  pump(50);
  assert.equal(e.seekedAtMs, null, "đang seeking thì không chốt");
  assert.equal(e.decodedSamplesWhileSeeking.length, 50, "tích 50 mẫu trong lúc seeking");
  // Seek xong + frame về (readyState=2): 30 tick liên tiếp mới chốt.
  el.seeking = false;
  el.readyState = 2;
  pump(1);
  const tFinalFirst = now(); // tick positioned đầu tiên của chuỗi SAU seeking
  pump(28); // tổng 29 tick chuỗi cuối — chưa đủ
  assert.equal(e.seekedAtMs, null, "29 tick chưa đủ");
  pump(1); // tick 30 → chốt
  assert.notEqual(e.seekedAtMs, null, "đủ 30 tick thì chốt");
  assert.equal(e.fallbackConfirmed, true);
  assert.equal(e.seekedEvent, false);
  // seekedAtMs backdate về tick positioned đầu tiên của chuỗi sau seeking
  // (_fbFirstMs reset khi seeking=true — mốc tiền-seek không còn ý nghĩa
  // vì lúc đó seek thật chưa bắt đầu).
  assert.ok(Math.abs(e.seekedAtMs - tFinalFirst) < 0.01, `seekedAtMs ${e.seekedAtMs} ≈ tick đầu chuỗi sau-seek ${tFinalFirst}`);
});

test("vá F5b: readyState tụt dưới 2 giữa chừng thì reset bộ đếm (mốc latency giữ nguyên)", () => {
  const { probe, FakeMedia, pump, now } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentTime = 25;
  el.readyState = 2;
  const e = probe.entries[0];
  pump(1);
  const tFirst = now();
  pump(28); // 29 tick liên tiếp đủ frame
  assert.equal(e.fallbackConfirmTicks, 29);
  assert.equal(e.seekedAtMs, null);
  el.readyState = 1; // frame mất (flicker) 1 tick
  pump(1);
  assert.equal(e.fallbackConfirmTicks, 0, "tụt readyState thì reset bộ đếm");
  assert.equal(e.seekedAtMs, null, "chưa chốt");
  el.readyState = 2;
  pump(30); // chuỗi mới đủ 30 tick
  assert.notEqual(e.seekedAtMs, null, "đủ 30 tick chuỗi mới thì chốt");
  assert.equal(e.seekedAtMs, tFirst, "mốc latency vẫn là tick positioned đầu tiên");
});

test("vá F5: trần 1000 mẫu/entry vẫn giữ (1005 tick seeking → giữ 1000, dropped 5)", () => {
  const { probe, FakeMedia, pump } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentTime = 5;
  el.seeking = true;
  pump(1005);
  const e = probe.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 1000);
  assert.equal(e.droppedSeekingSamples, 5);
  assert.equal(e.decodedSamplesWhileSeeking.length + e.droppedSeekingSamples, 1005);
});

test("vá F5: entry vẫn mang đủ trường D5/E5 (stack/src/wall/elementIdOf)", () => {
  const { probe, FakeMedia } = makeProbe(patchProbeSrc50F5);
  const el = new FakeMedia();
  el.currentSrc = "http://127.0.0.1:4296/api/proxy/file/c6-drip.mp4";
  el.currentTime = 25;
  const e = probe.entries[0];
  assert.equal(typeof e.stack47C6, "string");
  assert.ok(e.stack47C6.length > 0);
  assert.equal(e.srcAtSeek47C6, "http://127.0.0.1:4296/api/proxy/file/c6-drip.mp4");
  assert.equal(typeof e.wallMs47C6, "number");
  assert.equal(e.elementId, 0);
  assert.equal(typeof probe.elementIdOf, "function");
  assert.equal(probe.elementIdOf(el), 0);
  assert.equal(probe.fallbackConfirmTicks, 30, "mặc định 30 tick xác nhận");
});

test("vá F5: install nhận opts.fallbackConfirmTicks (harness đo truyền 30 tường minh)", () => {
  const { probe } = makeProbe(patchProbeSrc50F5, { fallbackConfirmTicks: 5 });
  assert.equal(probe.fallbackConfirmTicks, 5);
  // matchDropFingerprint vẫn re-export qua helper F5 (script đo dùng).
  assert.equal(typeof matchDropFingerprint, "function");
});
