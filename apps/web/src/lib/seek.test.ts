// seek.test.ts — Phase 9 đợt 31 N1: khóa 2 bug seek của đợt 30 M1.
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/seek.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Mock mô phỏng đúng 2 hành vi Chrome mà bug dựa vào: (a) currentTime
// báo cáo đã lượng tử hóa xuống micro giây (luôn ≤ giá trị đã set),
// (b) seeking = true trong lúc seek đang bay, seeked bắn khi xong.
// Vì vậy test tự điều khiển currentTime báo cáo + seeking, không để
// setter tự đổi giá trị.
import assert from "node:assert/strict";
import {
  frameIndexOf,
  needsSeek,
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

const F61 = 61 / 30;
const F62 = 62 / 30;

// ---- Bug A: so chỉ số frame thay vì epsilon giây ----

await ok("needsSeek: lùi đúng 1 frame, currentTime lượng tử hóa xuống → vẫn seek", () => {
  const el = new MockEl();
  el.setReported(F62 - 1e-6); // Chrome báo 2,066665 thay vì 2,066666…
  assert.equal(needsSeek(el, F61, 30), true); // code cũ: false (bug A)
});

await ok("needsSeek: cùng frame, currentTime lượng tử hóa xuống → không seek", () => {
  const el = new MockEl();
  el.setReported(F61 - 1e-6);
  assert.equal(needsSeek(el, F61, 30), false);
});

await ok("needsSeek: tiến 1 frame từ giây nguyên (2,0) → vẫn seek", () => {
  const el = new MockEl();
  el.setReported(2.0);
  assert.equal(needsSeek(el, F61, 30), true); // code cũ: false do −1,18e−16
});

await ok("needsSeek: cùng vị trí chính xác → không seek; xa → seek", () => {
  const el = new MockEl();
  el.setReported(F61);
  assert.equal(needsSeek(el, F61, 30), false);
  el.setReported(0);
  assert.equal(needsSeek(el, F61, 30), true);
});

await ok("frameIndexOf: fps phân số 24000/1001, lượng tử hóa không đổi frame", () => {
  const fps = 24000 / 1001;
  const snapped = 100 / fps;
  assert.equal(frameIndexOf(snapped - 1e-6, fps), 100);
  assert.equal(frameIndexOf(snapped, fps), 100);
});

// ---- seekElement: phát seek đúng, chờ seeked, không restart seek đang bay ----

await ok("seekElement: lùi 1 frame → gán đúng target đã snap, seeked lượng tử hóa vẫn xong", async () => {
  const el = new MockEl();
  el.setReported(F62);
  const p = seekElement(el, F61, { fps: 30, timeoutMs: 500 });
  assert.equal(el.sets.length, 1);
  assert.ok(Math.abs(el.sets[0] - F61) < 1e-12);
  el.setReported(F61 - 1e-6); // Chrome báo thấp hơn target ~1µs
  el.fireSeeked();
  assert.deepEqual(await p, { seeked: true, timedOut: false });
});

await ok("seekElement: đã đúng frame (lượng tử hóa) → không gán, xong ngay", async () => {
  const el = new MockEl();
  el.setReported(F61 - 1e-6);
  assert.deepEqual(await seekElement(el, F61, { fps: 30, timeoutMs: 500 }), {
    seeked: true,
    timedOut: false,
  });
  assert.equal(el.sets.length, 0);
});

await ok("seekElement: đang seeking tới đúng target → KHÔNG gán lại, chờ seeked rồi xong", async () => {
  const el = new MockEl();
  el.setReported(F62);
  el.seeking = true; // seek cũ đang bay tới đúng target
  const p = seekElement(el, F61, { fps: 30, timeoutMs: 500 });
  assert.equal(el.sets.length, 0); // gán lại sẽ huỷ seek đang bay
  el.setReported(F61 - 1e-6);
  el.fireSeeked();
  assert.deepEqual(await p, { seeked: true, timedOut: false });
  assert.equal(el.sets.length, 0);
});

await ok("seekElement: seeked của seek cũ (sai target) → phát seek của mình rồi mới xong", async () => {
  const el = new MockEl();
  el.setReported(F62);
  el.seeking = true; // seek cũ đang bay tới frame khác
  const p = seekElement(el, F61, { fps: 30, timeoutMs: 500 });
  assert.equal(el.sets.length, 0);
  el.fireSeeked(); // seek cũ tới nơi nhưng currentTime vẫn 62/30
  assert.equal(el.sets.length, 1);
  assert.ok(Math.abs(el.sets[0] - F61) < 1e-12);
  el.setReported(F61);
  el.fireSeeked();
  assert.deepEqual(await p, { seeked: true, timedOut: false });
});

await ok("seekElement: đang seeking mà currentTime đã báo = target → KHÔNG kết luận xong, phải chờ seeked (lỗ DARK-FIRST dưới tải)", async () => {
  const el = new MockEl();
  el.setReported(F61); // Chrome báo ct = target ngay khi seek bắt đầu
  el.seeking = true; // nhưng vẫn đang giải mã (rs = 1)
  let resolved = false;
  const p = seekElement(el, F61, { fps: 30, timeoutMs: 500 }).then((r) => {
    resolved = true;
    return r;
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(resolved, false); // code cũ: kết luận xong ngay → vẽ → skip → đen
  assert.equal(el.sets.length, 0);
  el.fireSeeked();
  assert.deepEqual(await p, { seeked: true, timedOut: false });
});

await ok("seekElement: đang seeking, ct = target, không có seeked → timeout (không kết luận xong giả)", async () => {
  const el = new MockEl();
  el.setReported(F61);
  el.seeking = true;
  assert.deepEqual(await seekElement(el, F61, { fps: 30, timeoutMs: 30 }), {
    seeked: false,
    timedOut: true,
  });
});

await ok("seekElement: quá timeout → { seeked: false, timedOut: true }", async () => {
  const el = new MockEl();
  el.setReported(0);
  assert.deepEqual(await seekElement(el, F61, { fps: 30, timeoutMs: 30 }), {
    seeked: false,
    timedOut: true,
  });
});

await ok("seekElement: retry sau timeout thấy seeking → chỉ chờ, không gán lại (đường preview bug B)", async () => {
  const el = new MockEl();
  el.setReported(0);
  // Lần 1: seek chậm, timeout (không có seeked).
  assert.deepEqual(await seekElement(el, F61, { fps: 30, timeoutMs: 30 }), {
    seeked: false,
    timedOut: true,
  });
  const setsAfterTimeout = el.sets.length;
  assert.equal(setsAfterTimeout, 1);
  // Lần 2 (retry của preview): seek cũ vẫn đang bay → không gán lại.
  el.seeking = true;
  const p = seekElement(el, F61, { fps: 30, timeoutMs: 500 });
  assert.equal(el.sets.length, setsAfterTimeout);
  el.setReported(F61 - 1e-6);
  el.fireSeeked(); // seeked muộn tới
  assert.deepEqual(await p, { seeked: true, timedOut: false });
  assert.equal(el.sets.length, setsAfterTimeout);
});

// ---- Đợt 32 O3: gỡ listener `seeked` mồ côi sau timeout ----
await ok("seekElement: timeout → gỡ listener seeked, không tồn đọng trên element", async () => {
  const el = new MockEl();
  el.setReported(0);
  assert.deepEqual(await seekElement(el, F61, { fps: 30, timeoutMs: 30 }), {
    seeked: false,
    timedOut: true,
  });
  assert.equal(el.listeners.length, 0); // code cũ: 1 listener once chưa bắn còn gắn
});

await ok("seekElement: retry sau timeout vẫn có listener riêng và xong khi seeked muộn tới", async () => {
  const el = new MockEl();
  el.setReported(0);
  assert.deepEqual(await seekElement(el, F61, { fps: 30, timeoutMs: 30 }), {
    seeked: false,
    timedOut: true,
  });
  assert.equal(el.listeners.length, 0);
  el.seeking = true; // seek cũ vẫn bay (đường retry của preview)
  const p = seekElement(el, F61, { fps: 30, timeoutMs: 500 });
  assert.equal(el.listeners.length, 1); // retry có listener riêng, không dùng lại listener cũ
  el.setReported(F61 - 1e-6);
  el.fireSeeked();
  assert.deepEqual(await p, { seeked: true, timedOut: false });
  assert.equal(el.listeners.length, 0);
});

console.log(`seek.test: ${pass} passed`);
