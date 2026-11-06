// seekStuckNoAssign48D5.test.ts — Phase 9 đợt 48, luồng D5: khóa cơ chế
// "10 lần thử seek 20 timeout mà không gán currentTime" (nợ C6 §4.7 /
// §7.4, xem docs/PHASE9_ROUND47_C6_PROBE_COMPAT_LIMITS.md §1.2).
//
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/seekStuckNoAssign48D5.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules,
// mẫu seek.test.ts / pauseSeekCap42X2.test.ts).
//
// Cơ chế được khóa — tái dựng từ evidence sync2 của C6 (tails +
// endIdle từng phase, không đoán):
//  - S2 (scrub 5, drip): sau lần gán đầu tạo entry k=1, 9 lần retry sau
//    KHÔNG gán lần nào (entries giữ 2 suốt phase); hết S2 count 10,
//    exhausted, target 5, recreated 1, seeking 1.
//  - Giữa S2→S3 (bấm Proxy lần 2): vòng lặp request lại seek 5 trên
//    element MỚI el 1 — đúng 1 lần gán (entry k=2), rồi el 1 kẹt
//    seeking (seek tới 5 đã bắt đầu, nguồn hang không giao dữ liệu).
//  - S3 (scrub 20, hang): 10 lần thử seek 20 đều timeout, entries giữ
//    nguyên 3 suốt phase = 0 lần gán; hết S3 count 10, exhausted,
//    kind timeout, target 20, recreated 1, seeking 1.
// Nguyên nhân gốc (code thật seek.ts, N1): seekElement khi thấy
// element đang seeking thì CHỈ chờ `seeked`, không gán lại — mỗi lần
// thử chỉ là timer timeout rồi resolve timedOut.
//
// Phạm vi trung thực: test này khóa logic bằng code thật (seekElement /
// seekAll / classifySeekOutcome / seekFailureAdvance / planSeekRecovery
// / seekFailureMaySleep) + mô hình vòng lặp preview (driver dưới đây
// mô phỏng ĐÚNG các nhánh request-seek / .then / ngủ của preview.tsx,
// trích số dòng trong comment từng bước). Nó KHÔNG mạo nhận là bằng
// chứng browser — bằng chứng browser nằm ở script sync-cap headed
// (episode scrub liên tục, xem LIMITS D5 §4). MockEl ở đây mô phỏng
// đúng 2 hành vi Chrome mà cơ chế dựa vào: (a) seeking = true trong
// lúc seek đang bay, seeked không bắn khi nguồn kẹt; (b) currentTime
// chỉ đổi khi test cho phép (setter chỉ ghi lại lần gán, như
// seek.test.ts).
import assert from "node:assert/strict";
import {
  DEFAULT_SEEK_TIMEOUT_MS,
  seekAll,
  seekElement,
  type Seekable,
} from "./seek.ts";
import {
  PAUSE_SEEK_FAILURE_CAP,
  classifySeekOutcome,
  seekFailureAdvance,
  seekFailureMaySleep,
} from "./pauseSeekCap42X2.ts";
import { planSeekRecovery } from "./pauseSeekRecovery43Y2.ts";

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

// Timeout nhỏ để test chạy nhanh: cơ chế không phụ thuộc giá trị tuyệt
// đối của timeout, chỉ phụ thuộc "hết timeout mà không có seeked".
// Hằng mặc định 1200 ms được assert riêng ở test 1.
const T = 30;

// ---- Hằng số của cơ chế (đổi hằng phải đo lại bound, xem LIMITS C6 §1.4) ----

await ok("48D5 hằng: DEFAULT_SEEK_TIMEOUT_MS = 1200, PAUSE_SEEK_FAILURE_CAP = 10", () => {
  assert.equal(DEFAULT_SEEK_TIMEOUT_MS, 1200);
  assert.equal(PAUSE_SEEK_FAILURE_CAP, 10);
});

await ok("48D5 cap: advance ở lần fail thứ 10 thì exhausted (ranh giới)", () => {
  assert.deepEqual(seekFailureAdvance("timeout", 9), {
    consecutiveFailures: 10,
    exhausted: true,
    kind: "timeout",
  });
  assert.deepEqual(seekFailureAdvance("timeout", 0), {
    consecutiveFailures: 1,
    exhausted: false,
    kind: "timeout",
  });
});

// ---- Lõi cơ chế trên seekElement thật: kẹt seeking → timeout, 0 lần gán ----

await ok("48D5 lõi: element kẹt seeking — 10 lần seekElement đều timeout, 0 lần gán currentTime", async () => {
  const el = new MockEl();
  el.setReported(0);
  // Lần 1: gán 1 lần (seek bắt đầu), rồi kẹt seeking, không seeked.
  const first = await seekElement(el, 5, { fps: 30, timeoutMs: T });
  assert.deepEqual(first, { seeked: false, timedOut: true });
  assert.equal(el.sets.length, 1, "lần đầu phải gán 1 lần để seek bắt đầu");
  assert.equal(el.sets[0], 5);
  // Seek đã bắt đầu nhưng không bao giờ xong: seeking = true, không seeked.
  el.seeking = true;
  // 9 lần retry tiếp theo (đủ 10 lần thử như cap): mỗi lần chỉ chờ rồi timeout.
  for (let i = 0; i < 9; i++) {
    const r = await seekElement(el, 5, { fps: 30, timeoutMs: T });
    assert.deepEqual(r, { seeked: false, timedOut: true }, `lần thử ${i + 2} phải timeout`);
  }
  assert.equal(el.sets.length, 1, "9 lần retry KHÔNG được gán thêm lần nào");
});

await ok("48D5 lõi: seekAll trên element kẹt seeking → timedOut 1, 0 lần gán", async () => {
  const el = new MockEl();
  el.setReported(0);
  el.seeking = true; // kẹt từ trước, seek cũ đang bay
  const r = await seekAll([{ el, target: 20, label: "video" }], { fps: 30, timeoutMs: T });
  assert.deepEqual(r, { done: 0, timedOut: 1, failed: 0 });
  assert.equal(el.sets.length, 0, "seekAll trên element kẹt seeking không được gán");
});

await ok("48D5 đối chứng: KHÔNG kẹt seeking thì seekElement GÁN đúng 1 lần (mock ghi được gán)", async () => {
  const el = new MockEl();
  el.setReported(0);
  // seeking = false: attempt gán ngay rồi chờ seeked → timeout (không có seeked).
  const r = await seekElement(el, 20, { fps: 30, timeoutMs: T });
  assert.deepEqual(r, { seeked: false, timedOut: true });
  assert.equal(el.sets.length, 1, "không kẹt thì phải gán — mock ghi được, nên 0 lần gán ở test lõi là thật, không phải mock hỏng");
  assert.equal(el.sets[0], 20);
});

// ---- Mô hình vòng lặp preview: nhánh request-seek / .then / ngủ ----
//
// Driver này mô phỏng ĐÚNG logic quyết định của preview.tsx (không phải
// bản thân vòng lặp thật — vòng lặp thật cần React + DOM, không chạy
// được ở Node; bằng chứng browser nằm ở script sync-cap headed):
//  - Nhánh request-seek (preview.tsx ~2856-2880): t mới khác
//    seekFailureTarget thì reset cap; lastRequested = t; request seek.
//  - Nhánh .then (preview.tsx ~2911-2995): timeout/error thì
//    classifySeekOutcome → seekFailureAdvance; chưa cạn thì mở guard
//    (lastRequested = null) để tick sau retry; ĐÃ cạn (false → true)
//    thì drop actives qua planSeekRecovery (recreated = số element đã
//    drop, seekingCount = số trong đó đang seeking); cạn rồi thì GIỮ
//    lastRequested = t để vòng lặp ngủ ở trạng thái lỗi.
//  - Ngủ kiểu seek-bỏ-cuộc (preview.tsx ~3074): seekFailureMaySleep.
// Driver chạy các attempt nối tiếp nhau (mỗi attempt awaited): thứ tự
// đếm/gán trong các attempt không phụ thuộc khoảng cách ~1,28 s giữa
// các tick thật, nên rút ngắn thời gian không làm sai kết luận đếm.
interface LoopState {
  lastDrawn: number | null;
  lastRequested: number | null;
  seekFailureCount: number;
  seekFailureExhausted: boolean;
  seekFailureKind: "timeout" | "error" | null;
  seekFailureTarget: number | null;
  seekElementRecreated: number;
  seekRecreatedSeeking: number;
}
function freshLoopState(): LoopState {
  return {
    lastDrawn: 25,
    lastRequested: 25,
    seekFailureCount: 0,
    seekFailureExhausted: false,
    seekFailureKind: null,
    seekFailureTarget: null,
    seekElementRecreated: 0,
    seekRecreatedSeeking: 0,
  };
}

/** Reset cap khi target đổi — nhánh request-seek (preview.tsx ~2864-2873).
 *  Dùng chung cho loopRequestSeek và cho tick mở đầu episode mới. */
function resetCapIfTargetChanged(st: LoopState, t: number): void {
  if (st.seekFailureTarget !== null && st.seekFailureTarget !== t) {
    st.seekFailureCount = 0;
    st.seekFailureExhausted = false;
    st.seekFailureKind = null;
    st.seekFailureTarget = null;
    st.seekElementRecreated = 0;
    st.seekRecreatedSeeking = 0;
  }
}

/** Một lần request-seek cho target t trên element el, trả outcome kiểu Seeker. */
async function loopRequestSeek(
  st: LoopState,
  el: MockEl,
  t: number,
): Promise<{ ok: boolean; cancelled: boolean; done: number; timedOut: number; failed: number }> {
  // Nhánh request-seek: t mới khác target đang đếm thì reset cap.
  resetCapIfTargetChanged(st, t);
  st.lastRequested = t;
  const r = await seekAll([{ el, target: t, label: "video" }], { fps: 30, timeoutMs: T });
  const outcome = { ok: true, cancelled: false, ...r };
  // Nhánh .then: chỉ xét khi lastRequested vẫn là t (không có request mới hơn).
  if (st.lastRequested === t) {
    if (!outcome.cancelled && outcome.ok && outcome.timedOut === 0) {
      // Nhánh vẽ (seek thành công): chuỗi thất bại đứt.
      st.seekFailureCount = 0;
      st.seekFailureExhausted = false;
      st.seekFailureKind = null;
      st.seekFailureTarget = null;
      st.seekElementRecreated = 0;
      st.seekRecreatedSeeking = 0;
    } else {
      const kind = classifySeekOutcome(outcome);
      if (kind === null) {
        st.lastRequested = null;
      } else {
        const wasExhausted = st.seekFailureExhausted;
        const adv = seekFailureAdvance(kind, st.seekFailureCount);
        st.seekFailureCount = adv.consecutiveFailures;
        st.seekFailureExhausted = adv.exhausted;
        st.seekFailureKind = adv.kind;
        st.seekFailureTarget = t;
        if (adv.exhausted && !wasExhausted) {
          // ROUND43-Y2: đúng thời điểm chuyển sang cạn cap thì drop actives.
          const plan = planSeekRecovery([el]);
          let recreated = 0;
          for (const _el of plan.elements) recreated++;
          st.seekElementRecreated = recreated;
          st.seekRecreatedSeeking = plan.seekingCount;
        }
        if (!adv.exhausted) st.lastRequested = null;
      }
    }
  }
  return outcome;
}

/** Chạy retry cho cùng target t tới khi cạn cap (như vòng lặp tick sau mỗi timeout).
 *  `onAttempt(n)` chạy sau mỗi attempt (để test mô phỏng seek bắt đầu kẹt). */
async function runUntilExhausted(
  st: LoopState,
  el: MockEl,
  t: number,
  onAttempt?: (n: number) => void,
): Promise<number> {
  let attempts = 0;
  // Tick mở đầu episode mới: nhánh request-seek reset cap khi target đổi
  // TRƯỚC khi xét điều kiện cạn — nếu không, episode sau một lần cạn cap
  // trước đó sẽ bị chặn ngay ở vòng kiểm tra đầu tiên (đúng bug test này
  // gặp lần đầu: runUntilExhausted trả 0 attempt cho S3 vì exhausted
  // vẫn true từ S2, trong khi vòng lặp thật reset cap ở tick scrub 20
  // rồi mới đếm lại từ 0).
  resetCapIfTargetChanged(st, t);
  while (!st.seekFailureExhausted && attempts < 12) {
    await loopRequestSeek(st, el, t);
    attempts++;
    onAttempt?.(attempts);
  }
  return attempts;
}

// ---- Tái hiện đúng chuỗi C6 S2 → interlude k=2 → S3, khóa trạng thái cuối ----

await ok("48D5 vòng lặp: S2 — seek 5 trên el0: 1 lần gán, 10 lần timeout, cạn cap, drop 1 element đang seeking", async () => {
  const st = freshLoopState();
  const el0 = new MockEl();
  el0.setReported(25); // sau S1, currentTime đang ở 25
  // Lần 1 gán 5, seek bắt đầu rồi kẹt (seeking = true, không seeked);
  // 9 lần retry sau chỉ chờ, không gán — như tails C6 (entries giữ 2).
  const attempts = await runUntilExhausted(st, el0, 5, (n) => {
    if (n === 1) el0.seeking = true;
  });
  assert.equal(attempts, 10, "phải đúng 10 lần thử mới cạn cap");
  assert.equal(st.seekFailureCount, 10);
  assert.equal(st.seekFailureExhausted, true);
  assert.equal(st.seekFailureKind, "timeout");
  assert.equal(st.seekFailureTarget, 5);
  assert.equal(st.seekElementRecreated, 1);
  assert.equal(st.seekRecreatedSeeking, 1);
  assert.equal(el0.sets.length, 1, "cả episode S2 chỉ gán đúng 1 lần (lần đầu)");
  assert.equal(el0.sets[0], 5);
});

await ok("48D5 vòng lặp: S2→S3 đầy đủ — seek 20 trên el1 mới: 10 lần timeout, 0 lần gán, trạng thái cuối khớp C6", async () => {
  const st = freshLoopState();
  // --- Episode 1 (S2): seek 5 trên el0 ---
  const el0 = new MockEl();
  el0.setReported(25);
  // Lần 1: gán 5, seek bắt đầu rồi kẹt.
  const r1 = await loopRequestSeek(st, el0, 5);
  assert.deepEqual(r1, { ok: true, cancelled: false, done: 0, timedOut: 1, failed: 0 });
  assert.equal(el0.sets.length, 1);
  el0.seeking = true; // seek tới 5 đã bắt đầu, nguồn drip không giao kịp
  // 9 lần retry: chỉ chờ, không gán; đếm lên 10 → cạn cap → drop el0.
  for (let i = 0; i < 9; i++) {
    const r = await loopRequestSeek(st, el0, 5);
    assert.equal(r.timedOut, 1, `S2 lần thử ${i + 2} phải timeout`);
  }
  assert.equal(el0.sets.length, 1, "S2: chỉ gán 1 lần duy nhất");
  assert.deepEqual(
    {
      count: st.seekFailureCount,
      exhausted: st.seekFailureExhausted,
      kind: st.seekFailureKind,
      target: st.seekFailureTarget,
      recreated: st.seekElementRecreated,
      seeking: st.seekRecreatedSeeking,
    },
    { count: 10, exhausted: true, kind: "timeout", target: 5, recreated: 1, seeking: 1 },
    "trạng thái cuối S2 phải khớp endIdle C6 (count 10, target 5, recreated 1)",
  );
  // --- Interlude (k=2): vòng lặp request lại seek 5 trên element MỚI el1 ---
  // (redrawFlag do gắn proxy lần 2 reset lastDrawn/lastRequested — tails C6:
  // đầu S3 lastDrawn null, entries đã 3). Đúng 1 lần gán lên el1.
  const el1 = new MockEl();
  el1.setReported(0);
  const rK2 = await seekElement(el1, 5, { fps: 30, timeoutMs: T });
  assert.deepEqual(rK2, { seeked: false, timedOut: true });
  assert.equal(el1.sets.length, 1, "k=2: chỉ gán 1 lần lên element mới");
  assert.equal(el1.sets[0], 5);
  el1.seeking = true; // metadata về, seek tới 5 đã bắt đầu, nguồn hang kẹt
  // --- Episode 2 (S3): scrub 20 → reset cap (target khác) → 10 lần thử ---
  const attempts2 = await runUntilExhausted(st, el1, 20);
  assert.equal(attempts2, 10, "S3 phải đúng 10 lần thử mới cạn cap lại");
  assert.equal(el1.sets.length, 1, "S3: 10 lần thử seek 20 KHÔNG gán thêm lần nào — đây là cơ chế được khóa");
  assert.deepEqual(
    {
      count: st.seekFailureCount,
      exhausted: st.seekFailureExhausted,
      kind: st.seekFailureKind,
      target: st.seekFailureTarget,
      recreated: st.seekElementRecreated,
      seeking: st.seekRecreatedSeeking,
    },
    { count: 10, exhausted: true, kind: "timeout", target: 20, recreated: 1, seeking: 1 },
    "trạng thái cuối S3 phải khớp endIdle C6 (count 10, target 20, recreated 1)",
  );
  // Vòng lặp ngủ ở trạng thái lỗi (điều kiện ngủ kiểu seek-bỏ-cuộc).
  assert.equal(seekFailureMaySleep(true, false, 20, 20), true);
  assert.equal(seekFailureMaySleep(true, false, 20, 5), false);
  // Tổng số lần gán trong cả S2 + interlude + S3 = 2 (k=1 và k=2),
  // khớp đúng 3 entry probe của C6 (k=0 thuộc S1, ngoài phạm vi test này).
  assert.equal(el0.sets.length + el1.sets.length, 2);
});

console.log(`seekStuckNoAssign48D5.test: ${pass} passed`);
