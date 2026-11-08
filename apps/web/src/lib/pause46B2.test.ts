// pause46B2.test.ts — Đợt 46 luồng B2: nối lib phân loại quirk A2
// vào seek.ts thật + quyết định Seeker sync-throw (xem
// docs/PHASE9_ROUND46_B2_PAUSE_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/pause46B2.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Mock mô phỏng quirk Chrome: gán currentTime → `seeked` bắn bất đồng
// bộ ở một điểm đáp do test chọn (0, đúng target, hay frame sai khác 0).
// Pha đỏ trước khi nối: test wrong-landing (1) và (2) FAIL vì seek.ts
// cũ reset đếm mỗi khi đáp khác 0 → lặp gán tới race-timeout 5 s thay
// vì fail nhanh ở lần gán thứ 3; test sync-throw (8) FAIL vì promise
// không settle (treo) + lỗi thành uncaught.
import assert from "node:assert/strict";
import { seekAll, seekElement, Seeker, type Seekable } from "./seek.ts";
import { classifySeekOutcome } from "./pauseSeekCap42X2.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
async function okAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

/** Mock element: mỗi lần gán, điểm đáp lấy từ hàm landings theo thứ tự gán. */
class LandingEl implements Seekable {
  private reported = 0;
  seeking = false;
  sets: number[] = [];
  private listeners: Array<() => void> = [];
  private landings: (setIndex: number, target: number) => number;
  constructor(landings: (setIndex: number, target: number) => number) {
    this.landings = landings;
  }
  get currentTime(): number {
    return this.reported;
  }
  set currentTime(v: number) {
    const idx = this.sets.length;
    this.sets.push(v);
    this.seeking = true;
    const target = v;
    setTimeout(() => {
      this.seeking = false;
      this.reported = this.landings(idx, target);
      const ls = this.listeners;
      this.listeners = [];
      for (const l of ls) l();
    }, 0);
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
    this.listeners = this.listeners.filter((l) => l !== fn);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`${label} không settle sau ${ms} ms (treo)`)), ms),
    ),
  ]);
}

// 1. Quirk mới của B2: seek 2,5 đáp sai frame khác 0 mãi (1,0) → fail
// nhanh, đúng 3 lần gán, không treo, không timedOut.
await okAsync("B2 wrong-landing: seek 2,5 đáp 1,0 mãi → fail nhanh, đúng 3 lần gán", async () => {
  const el = new LandingEl(() => 1.0);
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement wrong-landing",
  );
  assert.equal(r.seeked, false);
  assert.equal(r.timedOut, false);
  assert.equal(el.sets.length, 3);
  assert.deepEqual(el.sets, [2.5, 2.5, 2.5]);
});

// 2. Đáp sai đổi frame mỗi lần vẫn cộng dồn (tiêu chí A2: "không tới
// được target", không phải "đáp đúng một frame sai cố định").
await okAsync("B2 wrong-landing đổi frame: 1,0 → 0,5 → 1,5 vẫn fail ở lần thứ 3", async () => {
  const seq = [1.0, 0.5, 1.5];
  const el = new LandingEl((i) => seq[i] ?? 1.0);
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement wrong-landing đổi frame",
  );
  assert.equal(r.seeked, false);
  assert.equal(r.timedOut, false);
  assert.equal(el.sets.length, 3);
});

// 3. Hồi quy Z2 qua tracker mới: đáp 0 mãi vẫn fail nhanh đúng 3 lần gán.
await okAsync("B2 hồi quy Z2: seek 2,5 đáp 0 mãi → fail nhanh, đúng 3 lần gán", async () => {
  const el = new LandingEl(() => 0);
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement zero-landing",
  );
  assert.equal(r.seeked, false);
  assert.equal(r.timedOut, false);
  assert.equal(el.sets.length, 3);
});

// 4. Đáp sai xen kẽ đáp 0 vẫn cộng dồn (cả hai họ quirk cùng một streak).
await okAsync("B2 quirk hỗn hợp: đáp 1,0 rồi 0 rồi 1,0 → fail ở lần thứ 3", async () => {
  const seq = [1.0, 0, 1.0];
  const el = new LandingEl((i) => seq[i] ?? 1.0);
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement quirk hỗn hợp",
  );
  assert.equal(r.seeked, false);
  assert.equal(r.timedOut, false);
  assert.equal(el.sets.length, 3);
});

// 5. Thoáng qua vẫn được thử lại: đáp sai 2 lần rồi đáp đúng → seek được.
await okAsync("B2 thoáng qua: đáp sai 2 lần rồi đáp đúng → seeked true, 3 lần gán", async () => {
  const el = new LandingEl((i, target) => (i < 2 ? 1.0 : target));
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement wrong-then-correct",
  );
  assert.equal(r.seeked, true);
  assert.equal(r.timedOut, false);
  assert.equal(el.sets.length, 3);
});

// 6. Đáp đúng reset streak: sai, đúng (attempt mới không liên quan —
// ở đây cùng một seekElement: sai 1 lần rồi đúng thì không fail).
await okAsync("B2 đáp đúng reset: sai 1 lần rồi đúng → seeked true, 2 lần gán", async () => {
  const el = new LandingEl((i, target) => (i === 0 ? 1.0 : target));
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement wrong-once-then-correct",
  );
  assert.equal(r.seeked, true);
  assert.equal(el.sets.length, 2);
});

// 7. Seek về 0 có chủ ý không bao giờ tính là quirk (intentional-zero).
await okAsync("B2 intentional-zero: target 0 đáp 0 → seeked true, 0 lần gán", async () => {
  const el = new LandingEl(() => 0);
  const r = await withTimeout(
    seekElement(el, 0, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement target 0",
  );
  assert.equal(r.seeked, true);
  assert.equal(el.sets.length, 0);
});

// 8. Quirk qua seekAll: element đáp sai khác 0 mãi → failed 1, không timedOut.
await okAsync("B2 qua seekAll: đáp sai khác 0 mãi → failed 1, timedOut 0", async () => {
  const el = new LandingEl(() => 1.0);
  const r = await withTimeout(
    seekAll([{ el, target: 2.5, label: "video" }], { fps: 30, timeoutMs: 500 }),
    5000,
    "seekAll wrong-landing",
  );
  assert.equal(r.done, 0);
  assert.equal(r.timedOut, 0);
  assert.equal(r.failed, 1);
});

// 9. QUYẾT ĐỊNH Seeker sync-throw (nợ Y2 §5.1 / A2 §3): executor ném
// đồng bộ nay SETTLE thành outcome error (ok:false, cancelled:false)
// → classifySeekOutcome = "error", KHÔNG còn treo, KHÔNG còn uncaught.
// Trước sửa, test này treo ở withTimeout + lỗi thoát thành uncaught.
await okAsync("B2 Seeker sync-throw: ném đồng bộ → settle thành outcome error, không uncaught", async () => {
  let uncaught: unknown[] = [];
  const handler = (e: unknown) => {
    uncaught.push(e);
  };
  process.on("uncaughtException", handler);
  try {
    const seeker = new Seeker(5);
    const outcome = await withTimeout(
      seeker.request(1.5, () => {
        throw new Error("46b2-sync-boom");
      }),
      3000,
      "Seeker sync-throw",
    );
    assert.equal(outcome.ok, false);
    assert.equal(outcome.cancelled, false);
    assert.equal(classifySeekOutcome(outcome), "error");
  } finally {
    process.removeListener("uncaughtException", handler);
  }
  assert.equal(uncaught.length, 0);
});

// 10. Hồi quy Seeker: reject bất đồng bộ vẫn thành error; seek thường
// vẫn ok; request mới hơn vẫn huỷ request cũ (cancelled).
await okAsync("B2 Seeker hồi quy: reject async → error; seek thường → ok", async () => {
  const seeker = new Seeker(5);
  const errOutcome = await withTimeout(
    seeker.request(1.5, () => Promise.reject(new Error("async-boom"))),
    3000,
    "Seeker async reject",
  );
  assert.equal(errOutcome.ok, false);
  assert.equal(errOutcome.cancelled, false);
  assert.equal(classifySeekOutcome(errOutcome), "error");
  const okOutcome = await withTimeout(
    seeker.request(0.5, () => Promise.resolve({ done: 1, timedOut: 0, failed: 0 })),
    3000,
    "Seeker ok",
  );
  assert.equal(okOutcome.ok, true);
  assert.equal(okOutcome.cancelled, false);
  assert.equal(okOutcome.done, 1);
});

await okAsync("B2 Seeker hồi quy: request mới huỷ request cũ → cancelled", async () => {
  const seeker = new Seeker(50);
  const first = seeker.request(1.0, () => Promise.resolve({ done: 1, timedOut: 0, failed: 0 }));
  const second = seeker.request(2.0, () => Promise.resolve({ done: 1, timedOut: 0, failed: 0 }));
  const r1 = await withTimeout(first, 3000, "Seeker cancelled first");
  const r2 = await withTimeout(second, 3000, "Seeker second");
  assert.equal(r1.cancelled, true);
  assert.equal(r2.ok, true);
  assert.equal(r2.cancelled, false);
});

console.log(`\npause46B2: ${pass} passed`);
