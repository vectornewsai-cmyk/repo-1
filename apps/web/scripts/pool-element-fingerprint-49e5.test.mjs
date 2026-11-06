// Phase 9 đợt 49, luồng E5 — test khóa fingerprint elementId cho endPool
// sau drop (D5 §6.5) + trần mẫu seeking 1000 của probe.
//
// Chạy: node --test apps/web/scripts/pool-element-fingerprint-49e5.test.mjs
// (từ gốc repo; mẫu B5 per-seek-probe-pool-cap-46b5.test.mjs).
//
// Cách test: nạp CODE PROBE THẬT (per-seek-probe-page.js + vá E5 qua
// per-seek-probe-patch49e5.mjs — cùng helper script đo dùng) vào vm với
// HTMLMediaElement giả tối thiểu (descriptor currentTime thật để probe
// vá setter như trên Chrome, rAF bơm tay, performance.now điều khiển
// được). Không mock logic probe — chỉ mock DOM/bộ đếm thời gian.
// KHÔNG push, KHÔNG binary.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { patchProbeSrc49E5, matchDropFingerprint } from "./per-seek-probe-patch49e5.mjs";

const SCRIPTS = path.resolve(import.meta.dirname);
const PROBE_RAW = fs.readFileSync(path.join(SCRIPTS, "per-seek-probe-page.js"), "utf8");

// Fake HTMLMediaElement tối thiểu, định nghĩa TRONG vm realm để probe vá
// đúng prototype của nó (như Chrome vá HTMLMediaElement.prototype).
const FAKE_MEDIA_SRC = `
class __FakeMedia {
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
Object.defineProperty(__FakeMedia.prototype, "currentTime", {
  configurable: true, enumerable: true,
  get() { return this._ct; },
  set(v) { this._ct = v; },
});
__FakeMedia;
`;

function makeProbe() {
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
  const patched = patchProbeSrc49E5(PROBE_RAW);
  const defined = vm.runInContext(patched, sandbox);
  assert.equal(defined, "defined");
  const probe = sandbox.__n2PerSeek;
  assert.equal(probe.install({ fps: 30 }), "installed");
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

test("vá E5 thêm elementIdOf; probe chưa vá không có nó (đỏ-trước của vá)", () => {
  const { probe } = makeProbe();
  assert.equal(typeof probe.elementIdOf, "function");
  // Đối chứng: nguồn gốc chưa vá không định nghĩa elementIdOf.
  const rawSandbox = { window: null };
  rawSandbox.window = rawSandbox;
  rawSandbox.performance = { now: () => 0 };
  rawSandbox.requestAnimationFrame = () => 1;
  rawSandbox.cancelAnimationFrame = () => {};
  vm.createContext(rawSandbox);
  vm.runInContext(FAKE_MEDIA_SRC.replaceAll("__FakeMedia", "__FakeMedia2"), rawSandbox);
  rawSandbox.HTMLMediaElement = rawSandbox.__FakeMedia2;
  vm.runInContext(PROBE_RAW, rawSandbox);
  assert.equal(typeof rawSandbox.__n2PerSeek.elementIdOf, "undefined");
});

test("entry sau drop mang đúng elementId của pool element mới, khác element đã drop", () => {
  const { probe, FakeMedia, pump } = makeProbe();
  const elA = new FakeMedia(); // pool element cũ (el 0)
  elA.currentSrc = "http://127.0.0.1:4296/api/proxy/file/c6-drip.mp4";
  elA.currentTime = 5; // seek 1: entry k=0
  assert.equal(probe.entries.length, 1);
  assert.equal(probe.entries[0].elementId, 0);
  assert.equal(probe.elementIdOf(elA), 0);
  // Element kẹt seeking, tích mẫu như episode D5 (không seeked).
  elA.seeking = true;
  pump(10);
  assert.equal(probe.entries[0].decodedSamplesWhileSeeking.length, 10);
  // DROP elA khỏi pool + tạo element mới elB (videoFor) — probe không
  // biết drop; id mới chỉ xuất hiện khi elB bị seek lần đầu.
  const elB = new FakeMedia(); // pool element mới (el 1)
  elB.currentSrc = "http://127.0.0.1:4296/api/proxy/file/c6-drip.mp4";
  // Fingerprint pool SAU drop, TRƯỚC khi seek elB: elementIdOf gán id
  // mới mà không chờ seek (đúng thiết kế E5 §2).
  assert.equal(probe.elementIdOf(elB), 1);
  assert.equal(probe.elementIdOf(elA), 0, "id cũ không đổi khi gán id mới");
  elB.currentTime = 10; // seek sau drop: entry k=1
  assert.equal(probe.entries.length, 2);
  const after = probe.entries[1];
  assert.equal(after.elementId, 1);
  assert.equal(after.elementId, probe.elementIdOf(elB), "entry sau drop mang đúng id của pool element mới");
  assert.notEqual(after.elementId, probe.elementIdOf(elA), "entry sau drop khác id của element đã drop");
  // Entry lúc drop (k=0) vẫn mang id của element đã drop — đúng chuỗi.
  assert.equal(probe.entries[0].elementId, 0);
});

test("elementIdOf không tái dùng id: element thứ ba chưa từng seek nhận id mới", () => {
  const { probe, FakeMedia } = makeProbe();
  const a = new FakeMedia(); a.currentTime = 0;
  const b = new FakeMedia(); b.currentTime = 0;
  assert.deepEqual([probe.elementIdOf(a), probe.elementIdOf(b)], [0, 1]);
  const c = new FakeMedia();
  assert.equal(probe.elementIdOf(c), 2);
  assert.equal(probe.elementIdOf(c), 2, "gọi lại trả cùng id");
  assert.equal(probe.elementIdOf(a), 0);
});

test("entry vẫn mang đủ trường D5 (stack/src/wall) sau khi thêm vá E5", () => {
  const { probe, FakeMedia } = makeProbe();
  const el = new FakeMedia();
  el.currentSrc = "blob:http://x/flat";
  el.currentTime = 1.5;
  const e = probe.entries[0];
  assert.equal(typeof e.stack47C6, "string");
  assert.ok(e.stack47C6.length > 0);
  assert.equal(e.srcAtSeek47C6, "blob:http://x/flat");
  assert.equal(typeof e.wallMs47C6, "number");
  assert.equal(e.elementId, 0);
});

test("mẫu seeking giữ tối đa 1000, vượt thì đếm dropped (trần probe)", () => {
  const { probe, FakeMedia, pump } = makeProbe();
  const el = new FakeMedia();
  el.currentTime = 5;
  el.seeking = true;
  pump(1005);
  const e = probe.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 1000);
  assert.equal(e.droppedSeekingSamples, 5);
  assert.equal(e.decodedSamplesWhileSeeking.length + e.droppedSeekingSamples, 1005);
});

test("matchDropFingerprint: pool key giữ nguyên nhưng id đổi + entry mang id mới → khớp", () => {
  const r = matchDropFingerprint({
    droppedElementId: 0,
    poolBefore: [{ poolKey: "rehydrated-a_x-0", probeElementId: 0 }],
    poolAfter: [{ poolKey: "rehydrated-a_x-0", probeElementId: 1 }],
    entryAfterDropElementId: 1,
  });
  assert.deepEqual(r.replacedKeys, ["rehydrated-a_x-0"]);
  assert.deepEqual(r.newElementIds, [1]);
  assert.equal(r.entryMatchesNewPool, true);
  assert.equal(r.entryDiffersFromDropped, true);
  assert.equal(r.fingerprintOk, true);
});

test("matchDropFingerprint ÂM: entry sau drop vẫn mang id cũ → không khớp (drop chưa thay element)", () => {
  const r = matchDropFingerprint({
    droppedElementId: 0,
    poolBefore: [{ poolKey: "rehydrated-a_x-0", probeElementId: 0 }],
    poolAfter: [{ poolKey: "rehydrated-a_x-0", probeElementId: 1 }],
    entryAfterDropElementId: 0,
  });
  assert.equal(r.entryMatchesNewPool, false);
  assert.equal(r.entryDiffersFromDropped, false);
  assert.equal(r.fingerprintOk, false);
});

test("matchDropFingerprint ÂM: chỉ so pool key thì tưởng cùng element — gap D5 §4.4", () => {
  // Trước/sau drop, pool key Y HỆT nhau; nếu chỉ nhìn key thì kết luận
  // "cùng element". Matcher phải báo KHÔNG replace khi id cũng giữ nguyên.
  const r = matchDropFingerprint({
    droppedElementId: 0,
    poolBefore: [{ poolKey: "rehydrated-a_x-0", probeElementId: 0 }],
    poolAfter: [{ poolKey: "rehydrated-a_x-0", probeElementId: 0 }],
    entryAfterDropElementId: 0,
  });
  assert.deepEqual(r.replacedKeys, []);
  assert.equal(r.fingerprintOk, false);
});

test("matchDropFingerprint ÂM: entry sau drop mang id không có trong pool sau drop → không khớp", () => {
  const r = matchDropFingerprint({
    droppedElementId: 0,
    poolBefore: [{ poolKey: "rehydrated-a_x-0", probeElementId: 0 }],
    poolAfter: [{ poolKey: "rehydrated-a_x-0", probeElementId: 1 }],
    entryAfterDropElementId: 7,
  });
  assert.equal(r.entryMatchesNewPool, false);
  assert.equal(r.entryDiffersFromDropped, true);
  assert.equal(r.fingerprintOk, false);
});
