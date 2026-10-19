/**
 * Test cho apps/web/src/lib/seek.ts (chạy bằng Node, không cần browser).
 * Dùng MockMedia mô phỏng HTMLMediaElement: gán currentTime -> bắn `seeked`
 * bất đồng bộ sau vài ms (giống trình duyệt thật).
 * Được biên dịch & chạy bởi scripts/test-seek.sh.
 */
"use strict";

const {
  seekEpsilonFor,
  needsSeek,
  seekElement,
  seekAll,
  Seeker,
  DEFAULT_SEEK_TIMEOUT_MS,
  DEFAULT_SEEK_DEBOUNCE_MS,
} = require("./out/apps/web/src/lib/seek.js");
const { snapToFrame } = require("./out/packages/video-spec/src/index.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${label}`);
  } else {
    fail += 1;
    console.error(`  ✗ FAIL: ${label}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Mock HTMLMediaElement: gán currentTime -> `seeked` sau seekDelayMs. */
class MockMedia {
  constructor() {
    this._currentTime = 0;
    this.paused = true;
    this.readyState = 4;
    this.listeners = {};
    this.seekDelayMs = 5;
    this.neverFireSeeked = false;
    this.seekCount = 0; // số lần gán currentTime (seek thật)
    this.pauseCount = 0;
  }
  get currentTime() {
    return this._currentTime;
  }
  set currentTime(v) {
    this._currentTime = v;
    this.seekCount += 1;
    if (!this.neverFireSeeked) {
      setTimeout(() => this._fire("seeked"), this.seekDelayMs);
    }
  }
  pause() {
    this.paused = true;
    this.pauseCount += 1;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  addEventListener(type, cb) {
    (this.listeners[type] = this.listeners[type] || []).push(cb);
  }
  _fire(type) {
    const arr = this.listeners[type] || [];
    this.listeners[type] = [];
    for (const cb of arr) cb();
  }
}

async function main() {
  console.log("== seekEpsilonFor ==");
  ok(Math.abs(seekEpsilonFor(30) - 1 / 30) < 1e-12, "30fps -> 1/30");
  ok(Math.abs(seekEpsilonFor(60) - 1 / 60) < 1e-12, "60fps -> 1/60");
  ok(Math.abs(seekEpsilonFor(0) - 1 / 30) < 1e-12, "fps=0 -> fallback 1/30");
  ok(DEFAULT_SEEK_TIMEOUT_MS === 1200, "timeout mặc định 1200ms");
  ok(DEFAULT_SEEK_DEBOUNCE_MS === 80, "debounce mặc định 80ms");

  console.log("== needsSeek ==");
  ok(needsSeek({ currentTime: 0 }, 0.02, 30) === false, "lệch 0.02s @30fps -> không cần seek");
  ok(needsSeek({ currentTime: 0 }, 0.05, 30) === true, "lệch 0.05s @30fps -> cần seek");
  ok(needsSeek({ currentTime: 5 }, 5 + 1 / 30, 30) === false, "đúng 1 frame -> không seek (>)");
  ok(needsSeek({ currentTime: 0 }, 0.02, 60) === true, "lệch 0.02s @60fps -> cần seek (ngưỡng chặt hơn)");

  console.log("== seekElement ==");
  {
    const el = new MockMedia();
    const r = await seekElement(el, 5, { fps: 30 });
    ok(r.seeked === true && r.timedOut === false, "seek 0->5 resolve seeked");
    ok(Math.abs(el.currentTime - 5) < 1e-9, "currentTime đúng 5.0");
    ok(el.paused === true, "đã pause trước khi seek");
  }
  {
    const el = new MockMedia();
    el._currentTime = 5.0;
    const r = await seekElement(el, 5.01, { fps: 30 }); // lệch < 1 frame
    ok(r.seeked === true, "đã đúng vị trí -> resolve ngay");
    ok(el.seekCount === 0, "không gán currentTime khi không cần seek");
    ok(el.pauseCount >= 1, "vẫn pause dù không cần seek");
  }
  {
    const el = new MockMedia();
    await seekElement(el, 5.02, { fps: 30 });
    const snapped = snapToFrame(5.02, 30); // 151/30 = 5.0333...
    ok(Math.abs(el.currentTime - snapped) < 1e-9, `snap về frame: ${el.currentTime.toFixed(4)} == ${snapped.toFixed(4)}`);
  }
  {
    const el = new MockMedia();
    el.neverFireSeeked = true;
    const t0 = Date.now();
    const r = await seekElement(el, 9, { fps: 30, timeoutMs: 40 });
    const dt = Date.now() - t0;
    ok(r.seeked === false && r.timedOut === true, "không có seeked -> timedOut");
    ok(dt >= 35 && dt < 500, `timeout sau ~40ms (thực tế ${dt}ms)`);
    ok(el.paused === true, "vẫn pause dù timeout");
  }

  console.log("== seekAll (đồng thời) ==");
  {
    const a = new MockMedia();
    const b = new MockMedia();
    const c = new MockMedia();
    a.paused = b.paused = c.paused = false; // đang phát
    const r = await seekAll(
      [
        { el: a, target: 1, label: "v:1" },
        { el: b, target: 2, label: "a:2" },
        { el: c, target: 3, label: "a:3" },
      ],
      { fps: 30 },
    );
    ok(r.done === 3 && r.timedOut === 0 && r.failed === 0, "3/3 seek xong");
    ok(a.paused && b.paused && c.paused, "pause TẤT CẢ trước khi seek");
    ok(Math.abs(a.currentTime - 1) < 1e-9 && Math.abs(b.currentTime - 2) < 1e-9 && Math.abs(c.currentTime - 3) < 1e-9, "cả 3 đúng vị trí");
  }
  {
    const okEl = new MockMedia();
    const badEl = new MockMedia();
    badEl.neverFireSeeked = true;
    const r = await seekAll(
      [
        { el: okEl, target: 1, label: "ok" },
        { el: badEl, target: 2, label: "bad" },
      ],
      { fps: 30, timeoutMs: 40 },
    );
    ok(r.done === 1 && r.timedOut === 1, "1 xong + 1 timeout, không throw");
    ok(badEl.paused === true, "element timeout vẫn bị pause");
  }
  {
    const r = await seekAll([], { fps: 30 });
    ok(r.done === 0 && r.timedOut === 0 && r.failed === 0, "danh sách rỗng -> 0/0/0");
  }

  console.log("== ACCEPTANCE: seek 10 vị trí ngẫu nhiên, đúng ±1 frame ==");
  {
    const el = new MockMedia();
    let worst = 0;
    for (let i = 0; i < 10; i++) {
      const t = Math.random() * 120;
      const r = await seekElement(el, t, { fps: 30 });
      const snapped = snapToFrame(t, 30);
      const err = Math.abs(el.currentTime - snapped);
      worst = Math.max(worst, err);
      ok(r.seeked && err <= 1 / 30 + 1e-9, `seek #${i + 1}: t=${t.toFixed(3)} -> err=${err.toExponential(1)} <= 1 frame`);
    }
    console.log(`  (sai số lớn nhất: ${worst.toExponential(2)}s)`);
  }

  console.log("== Seeker: debounce + latest-wins ==");
  {
    const calls = [];
    const seeker = new Seeker(30);
    const run = async (t) => {
      calls.push(t);
      return { done: 1, timedOut: 0, failed: 0 };
    };
    const p1 = seeker.request(1, run);
    const p2 = seeker.request(2, run);
    const p3 = seeker.request(3, run);
    const [o1, o2, o3] = await Promise.all([p1, p2, p3]);
    ok(calls.length === 1 && calls[0] === 3, `chỉ seek 1 lần với t mới nhất (calls=${JSON.stringify(calls)})`);
    ok(o1.cancelled === true && o2.cancelled === true, "request cũ resolve cancelled (không treo)");
    ok(o3.ok === true && o3.cancelled === false, "request mới nhất ok");
  }
  {
    const calls = [];
    const seeker = new Seeker(30);
    const p = seeker.request(7, async (t) => {
      calls.push(t);
      return { done: 1, timedOut: 0, failed: 0 };
    });
    seeker.cancel();
    const o = await p;
    await sleep(80);
    ok(calls.length === 0, "cancel() -> executor không chạy");
    ok(o.cancelled === true, "promise resolve cancelled sau cancel()");
  }
  {
    // request cách nhau > debounce -> chạy 2 lần riêng
    const calls = [];
    const seeker = new Seeker(20);
    const run = async (t) => {
      calls.push(t);
      return { done: 1, timedOut: 0, failed: 0 };
    };
    const o1 = await seeker.request(10, run);
    const o2 = await seeker.request(20, run);
    ok(calls.length === 2 && o1.ok && o2.ok, "2 request cách nhau đủ lâu -> 2 lần seek");
  }

  console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test crash:", e);
  process.exit(1);
});
