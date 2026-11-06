// pauseSeekRecovery43Y2.test.ts — Khóa phục hồi sau khi cạn cap seek
// (nợ đợt 42 §5.3, xem pauseSeekRecovery43Y2.ts +
// docs/PHASE9_ROUND43_Y2_PAUSE_RECOVERY_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/pauseSeekRecovery43Y2.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Mô phỏng vòng lặp + pool ở dưới là MÔ HÌNH của nhánh else trong
// preview.tsx (không phải bản thân vòng lặp thật) — nó khóa logic quyết
// định (lập kế hoạch, drop đúng một lần lúc cạn, element mới seek được),
// không mạo nhận là bằng chứng browser. Bằng chứng browser ở LIMITS §3.
import assert from "node:assert/strict";
import { planSeekRecovery } from "./pauseSeekRecovery43Y2.ts";
import {
  PAUSE_SEEK_FAILURE_CAP,
  classifySeekOutcome,
  seekFailureAdvance,
} from "./pauseSeekCap42X2.ts";
import { Seeker } from "./seek.ts";

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

// --- planSeekRecovery: dedup + đếm seeking -------------------------------
ok("plan rỗng → không drop gì, seeking 0", () => {
  const p = planSeekRecovery([]);
  assert.deepEqual(p.elements, []);
  assert.equal(p.seekingCount, 0);
});

ok("plan dedup theo identity, đếm seeking chỉ trên phần tử đã dedup", () => {
  const stuck = { seeking: true };
  const idle = { seeking: false };
  const p = planSeekRecovery([stuck, idle, stuck, { seeking: undefined }, stuck]);
  assert.equal(p.elements.length, 3);
  assert.equal(p.seekingCount, 1);
});

ok("plan giữ element không seeking (demuxer hỏng vẫn cần drop)", () => {
  // Probe element đợt 43: element lỗi báo seeking = false nhưng không bao
  // giờ bắn seeked — nên kế hoạch KHÔNG được lọc bỏ element không seeking.
  const broken = { seeking: false };
  const p = planSeekRecovery([broken]);
  assert.equal(p.elements.length, 1);
  assert.equal(p.seekingCount, 0);
});

ok("plan không đổi mảng đầu vào", () => {
  const a = { seeking: true };
  const input = [a, a];
  planSeekRecovery(input);
  assert.equal(input.length, 2);
});

// --- Fake pool: mô hình MediaPool.dropElement -----------------------------
class FakeEl {
  seeking: boolean;
  dropped = false;
  constructor(seeking: boolean) {
    this.seeking = seeking;
  }
}
class FakePool {
  private map = new Map<string, FakeEl>();
  videoFor(id: string, seeking = false): FakeEl {
    let el = this.map.get(id);
    if (!el) {
      el = new FakeEl(seeking);
      this.map.set(id, el);
    }
    return el;
  }
  dropElement(el: FakeEl): boolean {
    for (const [id, v] of this.map) {
      if (v === el) {
        this.map.delete(id);
        el.dropped = true;
        return true;
      }
    }
    return false;
  }
  has(id: string): boolean {
    return this.map.has(id);
  }
}

ok("dropElement giả: element lạ → false, không đụng pool", () => {
  const pool = new FakePool();
  pool.videoFor("a");
  assert.equal(pool.dropElement(new FakeEl(false)), false);
  assert.equal(pool.has("a"), true);
});

// --- Mô hình vòng lặp: cạn cap → drop một lần → element mới seek được ---
ok("mô hình vòng lặp: 10 timeout ở 2,5 → cạn → drop → scrub 0,5 vẽ được", () => {
  const pool = new FakePool();
  let count = 0;
  let exhausted = false;
  let target: number | null = null;
  let recreated = 0;
  let recreatedSeeking = 0;
  // Lần seek đầu ở 2,5 dùng element kẹt seeking (mô phỏng Chrome sau seek hỏng).
  const el25 = pool.videoFor("clip", true);
  for (let i = 0; i < PAUSE_SEEK_FAILURE_CAP; i++) {
    const wasExhausted = exhausted;
    const adv = seekFailureAdvance("timeout", count);
    count = adv.consecutiveFailures;
    exhausted = adv.exhausted;
    target = 2.5;
    if (adv.exhausted && !wasExhausted) {
      const plan = planSeekRecovery([el25]);
      for (const el of plan.elements) if (pool.dropElement(el)) recreated++;
      recreatedSeeking = plan.seekingCount;
    }
  }
  assert.equal(exhausted, true);
  assert.equal(recreated, 1);
  assert.equal(recreatedSeeking, 1);
  assert.equal(pool.has("clip"), false);
  // Scrub sang 0,5: cap reset (target đổi), pool tạo element MỚI không kẹt.
  if (target !== null && target !== 0.5) {
    count = 0;
    exhausted = false;
    target = null;
    recreated = 0;
    recreatedSeeking = 0;
  }
  const el05 = pool.videoFor("clip", false);
  assert.notEqual(el05, el25);
  assert.equal(el05.seeking, false);
  assert.equal(count, 0);
  assert.equal(exhausted, false);
});

ok("mô hình vòng lặp: chưa cạn thì không drop (retry 9 lần giữ element)", () => {
  const pool = new FakePool();
  const el = pool.videoFor("clip", true);
  let count = 0;
  let exhausted = false;
  for (let i = 0; i < PAUSE_SEEK_FAILURE_CAP - 1; i++) {
    const adv = seekFailureAdvance("timeout", count);
    count = adv.consecutiveFailures;
    exhausted = adv.exhausted;
    if (adv.exhausted) throw new Error("chưa đủ 10 mà đã cạn");
  }
  assert.equal(exhausted, false);
  assert.equal(pool.has("clip"), true);
  assert.equal(pool.videoFor("clip"), el);
});

// --- Nhánh "error" ở tầng Seeker: reject thật → ok:false, không cancelled --
await okAsync("Seeker reject thật → outcome ok:false, cancelled:false → kind error", async () => {
  const seeker = new Seeker(5);
  const outcome = await seeker.request(1.5, () =>
    Promise.reject(new Error("executor boom")),
  );
  assert.equal(outcome.ok, false);
  assert.equal(outcome.cancelled, false);
  assert.equal(classifySeekOutcome(outcome), "error");
  // Chuỗi error cũng cạn cap ở 10 như timeout (kind mới nhất thắng).
  let count = 0;
  let exhausted = false;
  for (let i = 0; i < PAUSE_SEEK_FAILURE_CAP; i++) {
    const adv = seekFailureAdvance("error", count);
    count = adv.consecutiveFailures;
    exhausted = adv.exhausted;
  }
  assert.equal(count, 10);
  assert.equal(exhausted, true);
});

// --- ROUND46-B2: hazard này ĐÃ ĐƯỢC SỬA (quyết định đợt 46 B2, xem ---
// --- docs/PHASE9_ROUND46_B2_PAUSE_LIMITS.md §5): run ném ĐỒNG BỘ nay ---
// --- settle thành outcome error (ok:false, cancelled:false) như reject ---
// --- bất đồng bộ, thay vì treo + uncaught. Test cũ khóa hành vi treo ---
// --- được thay bằng test khóa hành vi mới; test khóa hành vi mới đầy ---
// --- đủ (kèm classify "error" + không uncaught) nằm ở pause46B2.test.ts. ---
await okAsync("Seeker run ném đồng bộ → settle thành outcome error (đã sửa ở ROUND46-B2)", async () => {
  let uncaught: unknown = null;
  const handler = (e: unknown) => {
    uncaught = e;
  };
  process.on("uncaughtException", handler);
  try {
    const seeker = new Seeker(5);
    let settled = false;
    let outcome: unknown = null;
    const p = seeker.request(1.5, () => {
      throw new Error("sync boom");
    });
    void p.then((o) => {
      settled = true;
      outcome = o;
    });
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(settled, true);
    assert.equal(uncaught, null);
    assert.equal((outcome as { ok: boolean }).ok, false);
    assert.equal((outcome as { cancelled: boolean }).cancelled, false);
  } finally {
    process.removeListener("uncaughtException", handler);
  }
});

console.log(`\npauseSeekRecovery43Y2: ${pass} passed`);
