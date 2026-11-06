// reverseDecodeAhead.test.ts — Test đơn vị cho logic cửa sổ decode-ahead
// (đợt 34 Q3). Chạy bằng Node type-stripping, không cần browser:
//   node --experimental-strip-types apps/web/src/lib/reverseDecodeAhead.test.ts
// (chạy từ gốc repo). Chỉ test logic thuần; VideoFrame thật + decode
// thật được đo bằng probe browser (xem LIMITS Q3), không mock ở đây
// ngoài 1 stub cache tối thiểu cho guard prefetch/evict của controller.
import assert from "node:assert/strict";
import {
  chooseDecodeAheadWindow,
  evictCountForBudget,
  gopStartFromKeys,
  planReverseWindow,
  ReverseDecodeAhead,
  selectEvictions,
} from "./reverseDecodeAhead.ts";

let pass = 0;
function ok(name: string, fn: () => void | Promise<void>): void | Promise<void> {
  const run = async () => {
    try {
      await fn();
      pass++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      console.error(`  ✗ ${name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  };
  return run();
}

const base = {
  playbackFps: 30,
  decodeFps: 31.9,
  frameBytes: 1382400, // NV12 lý thuyết 1280×720, chỉ làm input test
  memoryBudgetBytes: 2 * 1024 * 1024 * 1024,
  gopFrames: 300,
};

await ok("budget 2GiB + ahead 2 -> cửa sổ 300, giữ 900, slack ~1.19s, đạt", () => {
  const c = chooseDecodeAheadWindow(base);
  assert.equal(c.windowFrames, 300);
  assert.equal(c.aheadWindows, 2);
  assert.equal(c.heldFrames, 900);
  assert.equal(c.windowSeconds, 10);
  assert.ok(Math.abs(c.decodeSeconds - 300 / 31.9) < 1e-9);
  assert.ok(Math.abs(c.slackSeconds - 2 * (10 - 300 / 31.9)) < 1e-9);
  assert.ok(Math.abs(c.steadyMargin - (31.9 / 30 - 1)) < 1e-9);
  assert.equal(c.cappedBy, "memory");
  assert.equal(c.meetsTarget, true);
});

await ok("budget 1GiB -> hạ ahead xuống 1 (giữ 600), slack 0.60s < 1s -> không đạt", () => {
  const c = chooseDecodeAheadWindow({ ...base, memoryBudgetBytes: 1024 * 1024 * 1024 });
  assert.equal(c.aheadWindows, 1);
  assert.equal(c.windowFrames, 300);
  assert.equal(c.heldFrames, 600);
  assert.ok(c.slackSeconds < 1.0);
  assert.equal(c.meetsTarget, false);
});

await ok("budget quá nhỏ cho 1 GOP -> vẫn trả 1 GOP, capped memory, không đạt", () => {
  const c = chooseDecodeAheadWindow({ ...base, memoryBudgetBytes: 100 * 1024 * 1024 });
  assert.equal(c.windowFrames, 300);
  assert.equal(c.aheadWindows, 0);
  assert.equal(c.cappedBy, "memory");
  assert.equal(c.meetsTarget, false);
  assert.ok(c.memoryBytes > 100 * 1024 * 1024);
});

await ok("decode chậm hơn phát (25 < 30) -> biên âm, slack âm, không đạt dù cửa sổ to", () => {
  const c = chooseDecodeAheadWindow({ ...base, decodeFps: 25 });
  assert.ok(c.steadyMargin < 0);
  assert.ok(c.slackSeconds < 0);
  assert.equal(c.meetsTarget, false);
});

await ok("cửa sổ snap theo bội số GOP (gop 30, max 100 -> 90)", () => {
  const c = chooseDecodeAheadWindow({
    ...base,
    gopFrames: 30,
    maxWindowFrames: 100,
    memoryBudgetBytes: 16 * 1024 * 1024 * 1024,
  });
  assert.equal(c.windowFrames, 90);
  assert.equal(c.cappedBy, "max");
});

await ok("planReverseWindow: playhead cuối file, cửa sổ + cửa sổ kế align GOP", () => {
  const p = planReverseWindow(900, [0, 300, 600], 899, 300);
  assert.deepEqual(
    [p.presentFrom, p.presentTo, p.decodeFrom, p.decodeTo],
    [600, 899, 600, 899],
  );
  assert.deepEqual(
    [p.nextPresentFrom, p.nextPresentTo, p.nextDecodeFrom, p.nextDecodeTo],
    [300, 599, 300, 599],
  );
});

await ok("planReverseWindow: playhead đầu file -> không có cửa sổ kế", () => {
  const p = planReverseWindow(900, [0, 300, 600], 50, 300);
  assert.deepEqual([p.presentFrom, p.presentTo, p.decodeFrom], [0, 50, 0]);
  assert.equal(p.nextPresentTo, -1);
  assert.equal(p.nextDecodeFrom, -1);
});

await ok("gopStartFromKeys: giữa GOP, đúng đầu GOP, rỗng", () => {
  assert.equal(gopStartFromKeys([0, 300, 600], 450), 300);
  assert.equal(gopStartFromKeys([0, 300, 600], 300), 300);
  assert.equal(gopStartFromKeys([], 450), 0);
});

await ok("selectEvictions: trên playhead (trừ hold) xa trước, dưới keep thấp trước, không đụng keep", () => {
  const keep = new Set([400, 401, 402]);
  const held = [100, 200, 400, 401, 402, 501, 502, 503, 510];
  const { evict, keptOutsideBudget } = selectEvictions(held, keep, 500, 2);
  assert.deepEqual(evict, [510, 503, 100, 200]);
  // 501-502 nằm trong holdFrames=2 quanh playhead nên KHÔNG evict,
  // nhưng cũng không thuộc keep -> báo ở keptOutsideBudget.
  assert.deepEqual(keptOutsideBudget, [501, 502]);
  assert.ok(!evict.some((i) => keep.has(i)));
});

await ok("evictCountForBudget: 900 frame vượt 1GiB ở 1.38MB/frame -> 124 frame", () => {
  // floor(1073741824 / 1382400) = 776 frame vừa ngân sách.
  assert.equal(evictCountForBudget(900, 1382400, 1024 * 1024 * 1024), 900 - 776);
  assert.equal(evictCountForBudget(100, 1382400, 1024 * 1024 * 1024), 0);
});

await ok("controller: prefetch trùng cửa sổ đang bay -> null, xong bay lại được", async () => {
  let calls = 0;
  const fake = {
    size: 0,
    decodeGop: async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return 3;
    },
    evictExcept: () => 0,
  };
  const ctl = new ReverseDecodeAhead(fake as never);
  const p1 = ctl.prefetchWindow(null as never, [] as never, 0, 2, null as never);
  const p2 = ctl.prefetchWindow(null as never, [] as never, 0, 2, null as never);
  assert.notEqual(p1, null);
  assert.equal(p2, null);
  assert.equal(await p1, 3);
  const p3 = ctl.prefetchWindow(null as never, [] as never, 0, 2, null as never);
  assert.notEqual(p3, null);
  assert.equal(await p3, 3);
  assert.equal(calls, 2);
});

await ok("controller: evictForReverse delegate đúng tập keep cho cache", () => {
  let seenKeep: Set<number> | null = null;
  const fake = {
    size: 3,
    decodeGop: async () => 0,
    evictExcept: (keep: Set<number>) => {
      seenKeep = keep;
      return 2;
    },
  };
  const ctl = new ReverseDecodeAhead(fake as never);
  const n = ctl.evictForReverse([100, 200, 300], new Set([200]), 200, 2);
  assert.equal(n, 2);
  assert.deepEqual([...(seenKeep as unknown as Set<number>)].sort((a, b) => a - b), [200]);
});

console.log(`reverseDecodeAhead: ${pass} test pass`);
