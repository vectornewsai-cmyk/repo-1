/**
 * loadSampleQueue49E6.test.ts — Unit test Node cho queue/retry của loadSample
 * (Phase 9 đợt 49 E6; đóng nợ D6 §4.4).
 *
 * Test TẦNG LOGIC THUẦN trong apps/web/src/lib/loadSampleQueue.ts — máy trạng
 * thái coalesce + retry có điều kiện mà store.ts dùng cho loadSample (đợt 47
 * C1 generation counter + đợt 48 D6 retry). Phần async thật (fetch media mẫu,
 * MediaRecorder, URL.createObjectURL) được mock bằng cách KHÔNG test ở đây:
 * nó đã có bằng chứng riêng là click-test browser thật (D6 7/7 × 4, E6 case D
 * — xem docs/PHASE9_ROUND49_E6_LOADSAMPLE_LIMITS.md). Test này khóa 4 case
 * A/B/C/D trong bảng D6 §1 + các bất biến (1 yêu cầu chờ tối đa, queue xóa
 * trước khi retry, không vòng lặp vô hạn).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping) từ repo root:
 *   node apps/web/src/lib/loadSampleQueue49E6.test.ts
 *
 * Theo mẫu harness của projectRepo.test.ts (không vitest — repo không cài).
 */
import { LoadSampleQueue } from "./loadSampleQueue.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(got: T, want: T, msg: string): void {
  if (got !== want) throw new Error(`${msg} (got=${String(got)}, want=${String(want)})`);
}

/** Mô phỏng một lần gọi loadSample như store.ts gọi queue: */
function callLoad(q: LoadSampleQueue, gen: number): "started" | "queued" {
  if (!q.begin()) {
    q.noteOverlapping(gen);
    return "queued";
  }
  return "started";
}

console.log("loadSampleQueue49E6 — queue/retry thuần của loadSample (C1 + D6):");

test("begin lần đầu → true, isLoading true", () => {
  const q = new LoadSampleQueue();
  eq(q.begin(), true, "begin lần đầu");
  eq(q.isLoading, true, "isLoading sau begin");
  eq(q.hasQueued, false, "chưa có yêu cầu chờ");
});

test("begin lần 2 khi đang bay → false (coalesce, không chạy song song)", () => {
  const q = new LoadSampleQueue();
  q.begin();
  eq(q.begin(), false, "begin lần 2");
  eq(q.isLoading, true, "vẫn loading sau begin lần 2");
});

test("case A: lượt bay set thành công → finish(true, gen) = false (không retry)", () => {
  const q = new LoadSampleQueue();
  eq(callLoad(q, 0), "started", "call1 bắt đầu");
  eq(callLoad(q, 0), "queued", "call2 chồng nhau được ghi nhớ");
  eq(q.hasQueued, true, "có yêu cầu chờ");
  eq(q.finish(true, 0), false, "đã set → không retry");
  eq(q.hasQueued, false, "queue đã xóa sau finish");
  eq(q.isLoading, false, "loading đã reset");
});

test("case D: lượt bay ném lỗi (didSet=false) → finish(false, gen) = true (retry)", () => {
  const q = new LoadSampleQueue();
  callLoad(q, 0);
  callLoad(q, 0);
  eq(q.finish(false, 0), true, "throw → didSet=false, gen không đổi → retry");
});

test("case C: đổi project TRƯỚC lần bấm chồng → finish(false, gen mới) = true", () => {
  const q = new LoadSampleQueue();
  callLoad(q, 0); // call1 bay ở gen 0
  // user mở file / tạo mới → gen 0 → 1 (call1 sẽ bị bỏ set)
  eq(callLoad(q, 1), "queued", "call2 chồng nhau, ghi nhớ ở gen mới");
  eq(q.finish(false, 1), true, "gen lúc bấm (1) === gen hiện tại (1) → retry");
});

test("case B: đổi project SAU lần bấm chồng → finish(false, gen mới) = false (không revert)", () => {
  const q = new LoadSampleQueue();
  callLoad(q, 0);
  callLoad(q, 0); // ghi nhớ ở gen 0
  // user mở file / tạo mới SAU lần bấm → gen 0 → 1
  eq(q.finish(false, 1), false, "gen đã đổi sau khi bấm → không retry");
});

test("không có yêu cầu chờ → finish luôn false dù didSet=false", () => {
  const q = new LoadSampleQueue();
  q.begin();
  eq(q.finish(false, 0), false, "không ai chồng nhau thì không retry");
});

test("chồng nhau nhiều lần chỉ giữ 1 yêu cầu chờ, gen mới nhất thắng", () => {
  const q = new LoadSampleQueue();
  callLoad(q, 0);
  callLoad(q, 0); // note gen 0
  callLoad(q, 1); // note lại gen 1 (ghi đè)
  eq(q.finish(false, 0), false, "gen ghi nhớ là 1, không phải 0");
  const q2 = new LoadSampleQueue();
  callLoad(q2, 0);
  callLoad(q2, 0);
  callLoad(q2, 1);
  eq(q2.finish(false, 1), true, "gen mới nhất (1) khớp gen hiện tại → retry");
});

test("finish xóa queue TRƯỚC khi trả true — không vòng lặp vô hạn", () => {
  const q = new LoadSampleQueue();
  callLoad(q, 0);
  callLoad(q, 0);
  eq(q.finish(false, 0), true, "lần finish đầu → retry");
  eq(q.hasQueued, false, "queue đã xóa");
  eq(q.finish(false, 0), false, "finish lần 2 (không còn lượt bay) → false");
});

test("sau finish, begin lại → true (loading đã reset, retry chạy như lượt độc lập)", () => {
  const q = new LoadSampleQueue();
  callLoad(q, 0);
  callLoad(q, 0);
  eq(q.finish(false, 0), true, "cần retry");
  eq(q.begin(), true, "retry begin được");
  eq(q.finish(true, 1), false, "retry set thành công (gen đã tăng sau set) → dừng");
});

test("noteOverlapping khi không loading → bị bỏ qua (không tạo yêu cầu ma)", () => {
  const q = new LoadSampleQueue();
  q.noteOverlapping(0);
  eq(q.hasQueued, false, "không loading thì note bị bỏ qua");
  eq(q.begin(), true, "begin sau đó vẫn chạy bình thường");
});

test("luồng đầy đủ case D: call1 throw → retry → retry set thành công → dừng", () => {
  const q = new LoadSampleQueue();
  let gen = 0;
  eq(callLoad(q, gen), "started", "call1");
  eq(callLoad(q, gen), "queued", "call2 chồng");
  eq(q.finish(false, gen), true, "call1 throw → retry");
  eq(callLoad(q, gen), "started", "retry bắt đầu");
  gen += 1; // retry set thành công → store.ts tăng thế hệ
  eq(q.finish(true, gen), false, "retry set xong → không retry nữa");
  eq(q.isLoading, false, "loading reset cuối cùng");
});

test("luồng đầy đủ case B: call2 chồng rồi user đổi project → không retry, lần bấm sau chạy mới", () => {
  const q = new LoadSampleQueue();
  let gen = 0;
  callLoad(q, gen);
  callLoad(q, gen);
  gen += 1; // user mở file sau lần bấm
  eq(q.finish(false, gen), false, "không retry (lần đổi mới hơn thắng)");
  eq(callLoad(q, gen), "started", "user bấm lại nút mẫu sau đó → chạy lượt mới");
});

console.log(`\nloadSampleQueue49E6: ${pass} pass, ${fail} fail${fail ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
