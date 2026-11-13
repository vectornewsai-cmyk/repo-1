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
  SEEK_TIMEOUT_EXTENSIONS,
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

// ---- Đợt 89 Q5: gia hạn timeout khi element vẫn đang seeking ----
// (seek xa keyframe: Chromium 0,7–2,4s, WebKit 1,6–6,4s — đều vượt timeout
// 1200ms nên mỗi seek tốn 2–6 attempt timeout + retry, đốt cap seek.)

// Đợt 95 W8 — đếm số lần re-arm thay vì đo wall-clock (nợ U7 §7 mục 1):
// probe93u7 đo lại đợt 95 (load 6×, 30 rep): đường KHÔNG gia hạn resolve
// max 176ms, đường CÓ gia hạn resolve min 124ms — hai phân phối CHỒNG
// nhau 124–176ms nên KHÔNG có ngưỡng thời gian nào phân biệt chắc chắn
// "có gia hạn" vs "không gia hạn" dưới tải. Đếm setTimeout(timeoutMs)
// thì phân biệt tuyệt đối: không gia hạn = đúng 1 lần arm (0 re-arm),
// gia hạn đủ 2 lần = 3 lần gọi — không phụ thuộc wall-clock, không flake
// theo tải. Chỉ đếm trong lúc promise đang chạy, trả lại setTimeout gốc
// trong finally (không ảnh hưởng test khác).
async function countTimeoutCalls<T>(
  ms: number,
  fn: () => Promise<T>,
): Promise<{ result: T; calls: number }> {
  const origSetTimeout = globalThis.setTimeout;
  let calls = 0;
  globalThis.setTimeout = ((cb: (...args: unknown[]) => void, d?: number, ...rest: unknown[]) => {
    if (d === ms) calls++;
    return origSetTimeout(cb, d, ...rest);
  }) as typeof setTimeout;
  try {
    const result = await fn();
    return { result, calls };
  } finally {
    globalThis.setTimeout = origSetTimeout;
  }
}

await ok("seekElement Q5: timeoutExtensions=0 tường minh → timeout đúng hẹn dù đang seeking", async () => {
  const el = new MockEl();
  el.setReported(F61);
  el.seeking = true;
  assert.deepEqual(await seekElement(el, F61, { fps: 30, timeoutMs: 30, timeoutExtensions: 0 }), {
    seeked: false,
    timedOut: true,
  });
});

await ok("seekElement Q5: đang seeking, seeked tới muộn trong lần gia hạn → seeked:true, không timeout", async () => {
  const el = new MockEl();
  el.setReported(0);
  el.seeking = true; // seek đang bay (giải mã chậm, xa keyframe)
  let resolved = false;
  const p = seekElement(el, F61, { fps: 30, timeoutMs: 40, timeoutExtensions: 2 }).then((r) => {
    resolved = true;
    return r;
  });
  await new Promise((r) => setTimeout(r, 60)); // đã qua deadline 40ms đầu
  assert.equal(resolved, false); // code cũ: đã timeout ở 40ms
  assert.equal(el.listeners.length, 1); // listener còn gắn qua lần gia hạn
  el.setReported(F61 - 1e-6);
  el.fireSeeked(); // seeked muộn tới trong lần gia hạn
  assert.deepEqual(await p, { seeked: true, timedOut: false });
});

await ok("seekElement Q5: hết lượt gia hạn mà vẫn seeking → timedOut (chờ đủ 2× timeoutMs)", async () => {
  const el = new MockEl();
  el.setReported(0);
  el.seeking = true; // seek kẹt, seeked không bao giờ tới
  const t0 = Date.now();
  const r = await seekElement(el, F61, { fps: 30, timeoutMs: 40, timeoutExtensions: 1 });
  const elapsed = Date.now() - t0;
  assert.deepEqual(r, { seeked: false, timedOut: true });
  assert.ok(elapsed >= 75, `chờ ${elapsed}ms, kỳ vọng ≥75ms (40ms + 1 lần gia hạn 40ms)`);
  assert.equal(el.listeners.length, 0);
});

await ok("seekElement Q5: timer cháy mà element không còn seeking → timeout ngay, không gia hạn (đếm re-arm, không dựa wall-clock)", async () => {
  const el = new MockEl();
  el.setReported(0);
  // seeking=false ngay từ đầu (metadata lỗi: gán xong nhưng seeked không tới, element không seeking).
  // Đợt 95 W8 — assert cũ sleep(180) rồi kiểm resolved là test mỏng (nợ
  // U7 §7 mục 1, đã đo lại đợt 95: phân phối resolve hai đường chồng nhau
  // 124–176ms, không có ngưỡng sạch). Nay assert theo số lần re-arm:
  // timer arm đúng 1 lần, 0 lần re-arm, và kết quả vẫn timedOut.
  const { result, calls } = await countTimeoutCalls(100, () =>
    seekElement(el, F61, { fps: 30, timeoutMs: 100, timeoutExtensions: 2 }),
  );
  assert.equal(calls, 1); // chỉ lần arm đầu, 0 lần re-arm
  assert.deepEqual(result, { seeked: false, timedOut: true });
});

await ok("seekElement Q5: đang seeking, seeked không tới → gia hạn đúng 2 lần (đếm re-arm, đối chứng)", async () => {
  // Đối chứng của test trên: cùng timeoutMs/extensions nhưng seeking=true
  // thì timer phải re-arm đúng 2 lần (tổng 3 lần gọi setTimeout 100ms)
  // rồi mới timedOut. Nếu bộ đếm hỏng (đếm thừa/thiếu) thì test này fail
  // ngay — chứng minh phép đếm phân biệt được hai đường.
  const el = new MockEl();
  el.setReported(0);
  el.seeking = true; // seek kẹt, seeked không bao giờ tới
  const { result, calls } = await countTimeoutCalls(100, () =>
    seekElement(el, F61, { fps: 30, timeoutMs: 100, timeoutExtensions: 2 }),
  );
  assert.equal(calls, 3); // 1 arm đầu + 2 lần re-arm
  assert.deepEqual(result, { seeked: false, timedOut: true });
});

await ok("seekElement Q5: SEEK_TIMEOUT_EXTENSIONS = 5 (ngân sách 7,2s/attempt) — đổi giá trị phải có ý thức", () => {
  // Pin số đo Q5: WebKit không tải max 6,4s, dưới tải max 9,7s; 5 lần gia
  // hạn × 1200ms = 7,2s phủ hết seek không tải trong 1 attempt, seek tải
  // tối đa 1 timeout/lần. Đổi số này phải cập nhật cả comment ở seek.ts.
  assert.equal(SEEK_TIMEOUT_EXTENSIONS, 5);
});

console.log(`seek.test: ${pass} passed`);
