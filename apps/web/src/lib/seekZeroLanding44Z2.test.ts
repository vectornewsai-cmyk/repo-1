// seekZeroLanding44Z2.test.ts — Đợt 44 luồng Z2: quirk Chrome
// seek-landing-0 trên file hỏng (nợ đợt 43 Y2 §5.3, xem
// docs/PHASE9_ROUND44_Z2_PAUSE_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/seekZeroLanding44Z2.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Mock mô phỏng đúng quirk đo được ở Y2 §3.4 trên broken-gap: gán
// currentTime = 2,5 nhưng `seeked` bắn ở currentTime 0, lặp lại mỗi lần
// gán. Trước sửa, seekElement lặp gán mãi không resolve (test always-zero
// sẽ chạm race-timeout 5 s → đỏ); sau sửa, nó fail nhanh có giới hạn.
import assert from "node:assert/strict";
import { seekAll, seekElement, type Seekable } from "./seek.ts";

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

/** Mock element: gán currentTime → seeked bất đồng bộ, điểm đáp do test chọn. */
type Landing = "zero" | "correct" | "zeroThenCorrect";
class LandingEl implements Seekable {
  private reported = 0;
  seeking = false;
  sets: number[] = [];
  private listeners: Array<() => void> = [];
  private zeroCount = 0;
  private landing: Landing;
  constructor(landing: Landing) {
    this.landing = landing;
  }
  get currentTime(): number {
    return this.reported;
  }
  set currentTime(v: number) {
    this.sets.push(v);
    this.seeking = true;
    const target = v;
    setTimeout(() => {
      this.seeking = false;
      if (this.landing === "correct") {
        this.reported = target;
      } else if (this.landing === "zeroThenCorrect") {
        this.zeroCount++;
        this.reported = this.zeroCount === 1 ? 0 : target;
      } else {
        this.reported = 0;
      }
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

/** Chạy promise với trần thời gian: quá trần = treo (fail rõ ràng, không treo test). */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`${label} không settle sau ${ms} ms (treo)`)), ms),
    ),
  ]);
}

await okAsync("quirk: seek 2,5 đáp 0 mãi → fail nhanh, không treo, đúng 3 lần gán", async () => {
  const el = new LandingEl("zero");
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement zero-landing",
  );
  assert.equal(r.seeked, false);
  assert.equal(r.timedOut, false);
  // Lần gán đầu + 2 lần gán lại sau seeked@0, lần seeked@0 thứ 3 thì bỏ cuộc.
  assert.equal(el.sets.length, 3);
  assert.deepEqual(el.sets, [2.5, 2.5, 2.5]);
});

await okAsync("quirk qua seekAll: element đáp 0 mãi → failed 1, không timedOut, không treo", async () => {
  const el = new LandingEl("zero");
  const r = await withTimeout(
    seekAll([{ el, target: 2.5, label: "video" }], { fps: 30, timeoutMs: 500 }),
    5000,
    "seekAll zero-landing",
  );
  assert.equal(r.done, 0);
  assert.equal(r.timedOut, 0);
  assert.equal(r.failed, 1);
});

await okAsync("thoáng qua: đáp 0 một lần rồi đáp đúng → vẫn seek được (không fail vội)", async () => {
  const el = new LandingEl("zeroThenCorrect");
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement zero-then-correct",
  );
  assert.equal(r.seeked, true);
  assert.equal(r.timedOut, false);
  assert.equal(el.sets.length, 2);
});

await okAsync("đối chứng: seek thường đáp đúng → 1 lần gán, seeked true", async () => {
  const el = new LandingEl("correct");
  const r = await withTimeout(
    seekElement(el, 2.5, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement correct",
  );
  assert.equal(r.seeked, true);
  assert.equal(el.sets.length, 1);
});

await okAsync("phân biệt seek về 0 có chủ ý: target 0 → seeked true, 0 lần gán", async () => {
  const el = new LandingEl("zero");
  const r = await withTimeout(
    seekElement(el, 0, { fps: 30, timeoutMs: 500 }),
    5000,
    "seekElement target 0",
  );
  assert.equal(r.seeked, true);
  assert.equal(el.sets.length, 0);
});

console.log(`\nseekZeroLanding44Z2: ${pass} passed`);
