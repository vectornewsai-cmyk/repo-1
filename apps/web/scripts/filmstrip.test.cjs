/**
 * Test filmstrip (R1-066) bằng Node: biên dịch thumbnails.ts thật sang CommonJS,
 * chạy assertions trên các hàm pure (filmstripCount / filmstripTimestamps /
 * thumbCacheKey). Không cần browser.
 */
"use strict";

const assert = require("node:assert/strict");

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

function main() {
  const th = require("./out/thumbnails.js");

  console.log("== filmstripCount ==");
  test("clip 10s → 5 thumbnail", () => assert.equal(th.filmstripCount(10), 5));
  test("clip 0.5s → 1 thumbnail", () => assert.equal(th.filmstripCount(0.5), 1));
  test("clip 2s → 1 thumbnail (biên)", () => assert.equal(th.filmstripCount(2), 1));
  test("clip 2.01s → 2 thumbnail", () => assert.equal(th.filmstripCount(2.01), 2));
  test("clip 100s → tối đa 10", () => assert.equal(th.filmstripCount(100), 10));
  test("clip 20s → đúng 10", () => assert.equal(th.filmstripCount(20), 10));
  test("duration 0 → 1 (không crash)", () => assert.equal(th.filmstripCount(0), 1));
  test("duration âm → 1 (không crash)", () => assert.equal(th.filmstripCount(-5), 1));
  test("duration NaN → 1 (không crash)", () => assert.equal(th.filmstripCount(NaN), 1));

  console.log("== filmstripTimestamps ==");
  test("10s từ 0 → [1,3,5,7,9]", () => {
    assert.deepEqual(th.filmstripTimestamps(0, 10), [1, 3, 5, 7, 9]);
  });
  test("10s từ in=5 → [6,8,10,12,14] (offset theo source)", () => {
    assert.deepEqual(th.filmstripTimestamps(5, 10), [6, 8, 10, 12, 14]);
  });
  test("5 mốc phân biệt, tăng dần, nằm trong [in, in+dur]", () => {
    const ts = th.filmstripTimestamps(2, 10);
    assert.equal(ts.length, 5);
    assert.deepEqual([...ts].sort((a, b) => a - b), ts);
    assert.equal(new Set(ts).size, ts.length);
    for (const t of ts) {
      assert.ok(t >= 2 && t <= 12, `t=${t} ngoài biên`);
    }
  });
  test("clip 1s → 1 mốc ở giữa (0.5)", () => {
    assert.deepEqual(th.filmstripTimestamps(0, 1), [0.5]);
  });
  test("clip 100s → 10 mốc", () => {
    assert.equal(th.filmstripTimestamps(0, 100).length, 10);
  });

  console.log("== thumbCacheKey phân biệt các mốc filmstrip ==");
  test("5 mốc → 5 cache key khác nhau (không bị dedupe gộp)", () => {
    const ts = th.filmstripTimestamps(0, 10);
    const keys = ts.map((t) => th.thumbCacheKey("blob:test", t));
    assert.equal(new Set(keys).size, 5);
  });

  console.log(`\nKẾT QUẢ: ${passed} pass, ${failed} fail`);
  if (failed > 0) process.exit(1);
}

main();
