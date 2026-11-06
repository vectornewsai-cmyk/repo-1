#!/usr/bin/env node
// Phase 9 đợt 46, luồng B5 — test khóa hai việc của đợt:
//  (1) Trần 1000 mẫu per-seek trong per-seek-probe-page.js: mô phỏng
//      bằng VM (không cần browser): element seeking kéo dài 1500 tick
//      rAF phải giữ đúng 1000 mẫu đầu, dropped = 500, chốt unresolved
//      lúc read() — không mất lặng lẽ; seek nhanh chốt completed với
//      mẫu nhỏ (đối chứng trần không chạm khi seek nhanh).
//  (2) 19 nhãn "GOP thưa" sai của A5 §2.1 nay đã sửa TẠI CHỖ (docs +
//      pipe): mọi dòng còn chứa "GOP thưa" phải mang marker 46-B5
//      (nhãn cũ chỉ còn trong ngoặc đính chính, không còn là claim).
//  (3) Script đo pool-cap của B5 ghi rõ phạm vi trung thực (pool thật
//      qua fiber, item qua videoFor trực tiếp, không qua timeline UI).
//  (4) Bảng A5 giữ nguyên vẹn làm nguồn đối chiếu (B5 sửa tại chỗ,
//      không sửa file A5).
// Chạy: node --test apps/web/scripts/per-seek-probe-pool-cap-46b5.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const PAGE_SRC = read("apps/web/scripts/per-seek-probe-page.js");

// Một context VM mới cho mỗi ca: probe install vá prototype setter nên
// context cũ install lần hai sẽ trả "already-installed".
function freshProbe() {
  let now = 1000;
  let rafCb = null;
  class FakeMedia {
    constructor() { this._ct = 0; this.seeking = false; this.readyState = 4; this._listeners = {}; }
    addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn); }
  }
  Object.defineProperty(FakeMedia.prototype, "currentTime", {
    configurable: true, enumerable: true,
    get() { return this._ct; },
    set(v) { this._ct = v; },
  });
  const sandbox = {
    window: {},
    HTMLMediaElement: FakeMedia,
    requestAnimationFrame: (cb) => { rafCb = cb; return 1; },
    cancelAnimationFrame: () => { rafCb = null; },
    performance: { now: () => now },
    console,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(PAGE_SRC, sandbox);
  const probe = sandbox.__n2PerSeek;
  assert.equal(typeof probe.install, "function", "probe chưa định nghĩa trong VM");
  return {
    sandbox, probe, FakeMedia,
    tick(times) { for (let i = 0; i < times; i++) { now += 16; const cb = rafCb; assert.ok(cb, "rAF callback mất giữa chừng"); cb(now); } },
    el() { return new FakeMedia(); },
  };
}

test("46B5 cap: seeking kéo dài 1500 tick giữ đúng 1000 mẫu, dropped 500, chốt unresolved", () => {
  const t = freshProbe();
  assert.equal(t.probe.install({ fps: 30 }), "installed");
  const el = t.el();
  el.seeking = true;
  el.currentTime = 25; // setter đã vá -> recordSeek
  assert.equal(t.probe.entries.length, 1, "phải ghi đúng 1 entry");
  t.tick(1500);
  const out = t.probe.read();
  const e = out.entries[0];
  assert.equal(e.decodedSamplesWhileSeeking.length, 1000, "vượt trần 1000 mẫu");
  assert.equal(e.droppedSeekingSamples, 500, "dropped phải = 1500 - 1000");
  assert.equal(e.status, "unresolved", "seek chưa xong phải chốt unresolved, không mất lặng lẽ");
  assert.equal(out.droppedOverflow, 0, "chưa chạm trần entry nên droppedOverflow phải 0");
});

test("46B5 control: seek nhanh chốt completed, mẫu nhỏ, không chạm trần", () => {
  const t = freshProbe();
  assert.equal(t.probe.install({ fps: 30 }), "installed");
  const el = t.el();
  el.seeking = true;
  el.currentTime = 5;
  t.tick(3); // vài mẫu trong lúc seeking
  el.seeking = false; // seek xong: rAF fallback chốt seeked, readyState 4 -> draw-eligible
  t.tick(5);
  const out = t.probe.read();
  const e = out.entries[0];
  assert.equal(e.status, "completed");
  assert.ok(e.decodedSamplesWhileSeeking.length < 1000, "seek nhanh không được chạm trần");
  assert.equal(e.droppedSeekingSamples, 0, "seek nhanh không được drop mẫu");
});

test("46B5 nhãn tại chỗ: mọi dòng còn 'GOP thưa' đều mang marker 46-B5", () => {
  const files = [
    "docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md",
    "docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md",
    "docs/PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md",
    "docs/PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md",
    "docs/PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md",
    "docs/PHASE9_ROUND37_LIMITS.md",
    "docs/PHASE9_ROUND38_LIMITS.md",
    "docs/PHASE9_ROUND39_LIMITS.md",
    "apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs",
  ];
  for (const f of files) {
    const lines = read(f).split("\n");
    let marked = 0;
    for (const line of lines) {
      if (line.includes("GOP thưa")) {
        assert.ok(line.includes("46-B5"), `${f}: dòng còn 'GOP thưa' nhưng thiếu marker 46-B5: ${line.slice(0, 120)}`);
        marked++;
      }
    }
    assert.ok(marked >= 1, `${f}: không còn dòng marker 46-B5 nào (sửa nhãn bị mất?)`);
  }
});

test("46B5 pool-cap script: ghi rõ phạm vi pool thật qua fiber, không qua timeline UI", () => {
  const s = read("apps/web/scripts/per-seek-probe-pool-cap-run.mjs");
  assert.ok(s.includes("videoFor"), "script pool-cap thiếu videoFor");
  assert.ok(s.includes("fiber"), "script pool-cap thiếu đường lấy pool qua fiber");
  assert.ok(s.includes("POOL-LEVEL"), "script pool-cap thiếu nhãn phạm vi POOL-LEVEL");
  assert.ok(s.includes("không qua timeline UI"), "script pool-cap thiếu ghi rõ không qua timeline UI");
  assert.ok(s.includes("không chứng minh"), "script pool-cap thiếu giới hạn trích dẫn (không chứng minh vòng sync)");
});

test("46B5: bảng A5 giữ nguyên vẹn làm nguồn đối chiếu", () => {
  const s = read("docs/PHASE9_ROUND45_A5_PROBE_LIMITS.md");
  assert.ok(s.includes("GOP hiệu dụng 30"), "LIMITS A5 mất kết luận GOP hiệu dụng 30");
  assert.ok(s.includes("PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md"), "LIMITS A5 mất bảng audit");
  assert.ok(s.includes("L48"), "LIMITS A5 mất dòng L48 trong bảng");
  assert.ok(s.includes("số đo vẫn đứng"), "LIMITS A5 mất khẳng định số đo vẫn đứng");
});
