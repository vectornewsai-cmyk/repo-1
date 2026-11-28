// seek193P3.test.ts — Đợt 193 P3 khoản 1: scrub ngược trong seekElement.
// Chế độ reverseScrub: KHÔNG snapToFrame (round sẽ nuốt mất 1 ms
// backoff) + so frame bằng floor (frame chứa currentTime). Mock theo
// mẫu seek.test.ts (đợt 31 N1): currentTime báo cáo do test điều khiển.
// Chạy bằng Node type-stripping:
//   node --experimental-strip-types apps/web/src/lib/seek193P3.test.ts
import assert from "node:assert/strict";
import {
  frameIndexFloor,
  seekElement,
  type Seekable,
} from "./seek.ts";

class MockEl implements Seekable {
  private reported = 0;
  seeking = false;
  sets: number[] = [];
  private listeners: Array<() => void> = [];
  get currentTime(): number {
    return this.reported;
  }
  set currentTime(v: number) {
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

await ok("frameIndexFloor: biên → frame dưới (0,5 → 14), ngoài lưới giữ frame", () => {
  assert.equal(frameIndexFloor(15 / 30, 30), 15); // đúng biên = frame bắt đầu ở đó
  assert.equal(frameIndexFloor(15 / 30 - 0.001, 30), 14); // lùi 1 ms → frame dưới
  assert.equal(frameIndexFloor(15 / 30 + 0.0083, 30), 15);
  assert.equal(frameIndexFloor(1 / 30 - 0.001, 30), 0);
  assert.equal(frameIndexFloor(0, 30), 0);
  assert.equal(frameIndexFloor(-1, 30), 0);
});

await ok("reverseScrub: element ở đúng biên (ct=0,5) vẫn PHẢI seek tới 0,499 (không snap về 0,5)", async () => {
  const el = new MockEl();
  el.setReported(0.5); // đang hiện frame 15 (bug N-k)
  const p = seekElement(el, 0.5 - 0.001, { fps: 30, timeoutMs: 500, reverseScrub: true });
  assert.equal(el.sets.length, 1);
  assert.ok(Math.abs(el.sets[0] - 0.499) < 1e-12, `gán ${el.sets[0]}, kỳ vọng 0,499 (snap sẽ cho 0,5)`);
  el.setReported(0.499 - 1e-6);
  el.fireSeeked();
  assert.deepEqual(await p, { seeked: true, timedOut: false });
});

await ok("reverseScrub: đã ở 0,499 → không gán, xong ngay", async () => {
  const el = new MockEl();
  el.setReported(0.499 - 1e-6);
  assert.deepEqual(
    await seekElement(el, 0.5 - 0.001, { fps: 30, timeoutMs: 500, reverseScrub: true }),
    { seeked: true, timedOut: false },
  );
  assert.equal(el.sets.length, 0);
});

await ok("reverseScrub: ngoài lưới không snap (0,5083 giữ nguyên, không về 0,5)", async () => {
  const el = new MockEl();
  el.setReported(0);
  const p = seekElement(el, 15 / 30 + 0.0083, { fps: 30, timeoutMs: 500, reverseScrub: true });
  assert.equal(el.sets.length, 1);
  assert.ok(Math.abs(el.sets[0] - (15 / 30 + 0.0083)) < 1e-12);
  el.setReported(15 / 30 + 0.0083);
  el.fireSeeked();
  assert.deepEqual(await p, { seeked: true, timedOut: false });
});

await ok("không reverseScrub: hành vi cũ giữ nguyên (biên snap về lưới, đã đúng frame thì không gán)", async () => {
  const el = new MockEl();
  el.setReported(0.5);
  // Target 0,499 không reverseScrub → snap round về 0,5 → đã đúng frame → 0 lần gán.
  assert.deepEqual(
    await seekElement(el, 0.5 - 0.001, { fps: 30, timeoutMs: 500 }),
    { seeked: true, timedOut: false },
  );
  assert.equal(el.sets.length, 0);
});

await ok("reverseScrub: đáp sai liên tiếp vẫn fail ở lần thứ 3 (tracker dùng floor)", async () => {
  // Element đáp 0 trong khi target 0,499 (frame 14): floor(0)=0 ≠ 14.
  const el = new MockEl();
  el.setReported(0.5);
  const p = seekElement(el, 0.5 - 0.001, { fps: 30, timeoutMs: 500, reverseScrub: true });
  assert.equal(el.sets.length, 1);
  for (let i = 0; i < 3; i++) {
    el.setReported(0);
    el.fireSeeked();
    await new Promise((r) => setTimeout(r, 0));
    if (i < 2) assert.equal(el.sets.length, 2 + i, `lần đáp 0 thứ ${i + 1} phải gán lại`);
  }
  assert.deepEqual(await p, { seeked: false, timedOut: false });
});

console.log(`seek193P3.test: ${pass} passed`);
