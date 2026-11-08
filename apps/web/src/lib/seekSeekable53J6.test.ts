// seekSeekable53J6.test.ts — Phase 9 đợt 53, luồng J6: guard `seekable`
// pre-seek trong seek.ts (đóng nợ I8 — đề xuất LIMITS đợt 52 I8 §6.3).
//
// Bằng chứng I8 (LIMITS đợt 52 I8 §3): phân tách hoàn hảo 56/56 —
// seek khi seekable `[[0,0]]` thì đáp 0, khi đã `[[0,3]]` thì đáp
// đúng; trạng thái `[[0,0]]` dính suốt vòng đời tab (đợi 12 s không
// cứu được 6/10). Guard chặn đúng mẫu đã đo (max end ≤ 0, target > 0),
// fail-open mọi trường hợp còn lại.
//
// Chạy bằng Node type-stripping (như seek.test.ts):
//   node --experimental-strip-types apps/web/src/lib/seekSeekable53J6.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
import assert from "node:assert/strict";
import {
  SEEK_BLOCKED_SEEKABLE_UNDETERMINED,
  seekAll,
  seekElement,
  seekableBlocksSeek,
  type Seekable,
  type SeekableRanges,
} from "./seek.ts";

function ranges(spec: Array<[number, number]>): SeekableRanges {
  return {
    length: spec.length,
    start: (i: number) => spec[i][0],
    end: (i: number) => spec[i][1],
  };
}

class MockEl implements Seekable {
  private reported = 0;
  seeking = false;
  sets: number[] = [];
  seekable?: SeekableRanges;
  private listeners: Array<() => void> = [];
  get currentTime(): number {
    return this.reported;
  }
  set currentTime(v: number) {
    // Chỉ ghi lại lần gán — giá trị báo cáo do test điều khiển, như Chrome.
    this.sets.push(v);
  }
  setReported(v: number): void {
    this.reported = v;
  }
  pause(): void {}
  addEventListener(
    _type: "seeked",
    fn: () => void,
    _options?: { once?: boolean },
  ): void {
    this.listeners.push(fn);
  }
  removeEventListener(_type: "seeked", fn: () => void): void {
    const i = this.listeners.indexOf(fn);
    if (i >= 0) this.listeners.splice(i, 1);
  }
  fireSeeked(): void {
    const ls = this.listeners;
    this.listeners = [];
    this.seeking = false;
    for (const fn of ls) fn();
  }
  listenerCount(): number {
    return this.listeners.length;
  }
}

let pass = 0;
async function ok(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

// ---- Unit: luật chặn đúng biên bằng chứng I8 ----
await ok("seekableBlocksSeek: [[0,0]] + target 2.5 → chặn", () => {
  const el = new MockEl();
  el.seekable = ranges([[0, 0]]);
  assert.equal(seekableBlocksSeek(el, 2.5), SEEK_BLOCKED_SEEKABLE_UNDETERMINED);
});

await ok("seekableBlocksSeek: [[0,3]] + target 2.5 → không chặn", () => {
  const el = new MockEl();
  el.seekable = ranges([[0, 3]]);
  assert.equal(seekableBlocksSeek(el, 2.5), null);
});

await ok("seekableBlocksSeek: [[0,0]] + target 0 → không chặn (seek về 0 vẫn đúng)", () => {
  const el = new MockEl();
  el.seekable = ranges([[0, 0]]);
  assert.equal(seekableBlocksSeek(el, 0), null);
});

await ok("seekableBlocksSeek: seekable vắng / rỗng → không chặn (fail-open)", () => {
  const noProp = new MockEl();
  assert.equal(seekableBlocksSeek(noProp, 2.5), null);
  const empty = new MockEl();
  empty.seekable = ranges([]);
  assert.equal(seekableBlocksSeek(empty, 2.5), null);
});

await ok("seekableBlocksSeek: nhiều range, chỉ cần 1 range có end > 0 → không chặn", () => {
  const el = new MockEl();
  el.seekable = ranges([[0, 0], [0, 3]]);
  assert.equal(seekableBlocksSeek(el, 2.5), null);
  const allZero = new MockEl();
  allZero.seekable = ranges([[0, 0], [0, 0]]);
  assert.equal(seekableBlocksSeek(allZero, 2.5), SEEK_BLOCKED_SEEKABLE_UNDETERMINED);
});

await ok("seekableBlocksSeek: end() ném lỗi → không chặn (fail-open)", () => {
  const el = new MockEl();
  el.seekable = {
    length: 1,
    start: () => 0,
    end: () => {
      throw new Error("IndexSizeError giả lập");
    },
  };
  assert.equal(seekableBlocksSeek(el, 2.5), null);
});

// ---- seekElement: chặn thì không gán currentTime lần nào ----
await ok("seekElement: seekable [[0,0]] + target 2.5 → blocked, KHÔNG gán currentTime", async () => {
  const el = new MockEl();
  el.seekable = ranges([[0, 0]]);
  const r = await seekElement(el, 2.5, { timeoutMs: 200 });
  assert.equal(r.seeked, false);
  assert.equal(r.timedOut, false);
  assert.equal(r.seekableBlocked, true);
  assert.deepEqual(el.sets, []);
  assert.equal(el.listenerCount(), 0);
});

await ok("seekElement: seekable [[0,3]] + target 2.5 → seek thường, không blocked", async () => {
  const el = new MockEl();
  el.seekable = ranges([[0, 3]]);
  const p = seekElement(el, 2.5, { timeoutMs: 500 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(el.sets, [2.5]);
  el.setReported(2.5);
  el.fireSeeked();
  const r = await p;
  assert.equal(r.seeked, true);
  assert.equal(r.seekableBlocked, undefined);
});

await ok("seekElement: seekable [[0,0]] + target 0 → đi đường cũ (đã đúng frame, không chặn)", async () => {
  const el = new MockEl();
  el.seekable = ranges([[0, 0]]);
  const r = await seekElement(el, 0, { timeoutMs: 200 });
  assert.equal(r.seeked, true);
  assert.equal(r.seekableBlocked, undefined);
  assert.deepEqual(el.sets, []);
});

await ok("seekElement: seekable vắng → đường cũ (gán + chờ seeked như trước)", async () => {
  const el = new MockEl();
  const p = seekElement(el, 2.5, { timeoutMs: 500 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(el.sets, [2.5]);
  el.setReported(2.5);
  el.fireSeeked();
  const r = await p;
  assert.equal(r.seeked, true);
  assert.equal(r.seekableBlocked, undefined);
});

await ok("seekElement: seekable rỗng (length 0) → đường cũ, không chặn", async () => {
  const el = new MockEl();
  el.seekable = ranges([]);
  const p = seekElement(el, 2.5, { timeoutMs: 500 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(el.sets, [2.5]);
  el.setReported(2.5);
  el.fireSeeked();
  const r = await p;
  assert.equal(r.seeked, true);
});

// ---- seekAll: đếm blocked riêng, vẫn tính vào failed ----
await ok("seekAll: 1 blocked + 1 OK → done 1, failed 1, seekableBlocked 1", async () => {
  const blocked = new MockEl();
  blocked.seekable = ranges([[0, 0]]);
  const fine = new MockEl();
  fine.seekable = ranges([[0, 3]]);
  const p = seekAll(
    [
      { el: blocked, target: 2.5, label: "blocked" },
      { el: fine, target: 2.5, label: "fine" },
    ],
    { timeoutMs: 500 },
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(blocked.sets, []);
  assert.deepEqual(fine.sets, [2.5]);
  fine.setReported(2.5);
  fine.fireSeeked();
  const r = await p;
  assert.equal(r.done, 1);
  assert.equal(r.failed, 1);
  assert.equal(r.timedOut, 0);
  assert.equal(r.seekableBlocked, 1);
});

await ok("seekAll: không có blocked → seekableBlocked vắng (không đổi shape cũ)", async () => {
  const fine = new MockEl();
  fine.seekable = ranges([[0, 3]]);
  const p = seekAll([{ el: fine, target: 2.5, label: "fine" }], { timeoutMs: 500 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  fine.setReported(2.5);
  fine.fireSeeked();
  const r = await p;
  assert.equal(r.done, 1);
  assert.equal(r.failed, 0);
  assert.equal(r.seekableBlocked, undefined);
});

console.log(`seekSeekable53J6: ${pass}/13 test pass`);
