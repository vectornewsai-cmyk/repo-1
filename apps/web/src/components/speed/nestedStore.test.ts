/**
 * nestedStore.test.ts — Test thật cho Phase 9 đợt 16 (luồng H2):
 * nối helper nested đệ quy (đợt 15 T3) vào đường split/trim thật của store.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/speed/nestedStore.test.ts
 *
 * Chỉ test logic thuần (splitNestedClip / trimNestedClip trong nestUtils —
 * đúng hàm store.ts gọi) + đối chiếu cửa sổ lá sâu bằng helper đệ quy
 * composeNestedLeafWindow / deepNestedLeafVisibleSpeedCurve và bằng
 * flattenNested. Phần nối store thật (splitAtPlayhead / trimClip /
 * splitClipAtTimes qua useStore) nằm ở nestedStore.store.test.ts (chạy
 * bằng esbuild bundle, như mẫu splitPatch.store.test.ts đợt 15 T4).
 *
 * Fixture chuẩn S (3 cấp, tính tay từ công thức flattenInto):
 * - Lá L: video [0,8) in=0 out=8 (nguồn đỏ 0–4s, xanh lá 4–8s — cùng nguồn
 *   với test render test_round16_h2_nested_deep_render.js).
 * - Inner "in": [0,4) trim [2,6) speed 1 → phát lá ở thời gian 2–6.
 * - Mid "mid": [0,2) trim [1,3) speed 1 → phát inner ở thời gian 1–3.
 * - Top "top": start 0, [0,2) trim [0,2) speed 1 → phát mid 0–2.
 * Suy ra cửa sổ lá của top nguyên vẹn: mid 0–2 → inner 1–3 → lá 3–5:
 * absoluteStart 0, absoluteDuration 2, visible [3,5), in/out 3/5.
 *
 * Fixture 2 cấp (đối chiếu thêm): lá [0,8) trong mid2 [0,4) trim [1,5),
 * top2 start 10 duration 4 trim [0,4) → lá 1–5, absolute 10–14.
 */
import {
  composeNestedLeafWindow,
  flattenNested,
  validateNestedClip,
  type Clip,
  type NestedClip,
  type VideoSpec,
} from "@repo-1/video-spec";
import {
  deepNestedLeafVisibleSpeedCurve,
  splitNestedClip,
  trimNestedClip,
} from "../nested/nestUtils.ts";

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

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function approx(a: number, b: number, tol: number, what = ""): void {
  if (Math.abs(a - b) > tol) {
    throw new Error(`${what} nhận ${a}, muốn ${b} ± ${tol}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function meta() {
  return { name: "sub", width: 1280, height: 720, fps: 30 };
}

function specWith(clips: Clip[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: [{ id: "v1", kind: "video", clips }],
  } as unknown as VideoSpec;
}

function video(
  id: string,
  start: number,
  duration: number,
  extra?: Record<string, unknown>,
): Clip {
  return {
    kind: "video",
    id,
    src: "src.mp4",
    start,
    duration,
    in: 0,
    out: duration,
    ...extra,
  } as unknown as Clip;
}

function nested(
  id: string,
  start: number,
  duration: number,
  subSpec: VideoSpec,
  extra?: Record<string, unknown>,
): NestedClip {
  return {
    kind: "nested",
    id,
    start,
    duration,
    subSpec,
    ...extra,
  } as unknown as NestedClip;
}

let idSeq = 0;
const idGen = () => `c${++idSeq}`;

/** Fixture S: 3 cấp (top / mid / inner / lá). */
function fixtureS() {
  const leaf = video("L", 0, 8, { in: 0, out: 8 });
  const inner = nested("in", 0, 4, specWith([leaf]), {
    speed: 1,
    trim: { in: 2, out: 6 },
  });
  const mid = nested("mid", 0, 2, specWith([inner]), {
    speed: 1,
    trim: { in: 1, out: 3 },
  });
  const top = nested("top", 0, 2, specWith([mid]), {
    speed: 1,
    trim: { in: 0, out: 2 },
  });
  return { top, mid, inner, leaf };
}

/** Fixture 2 cấp: top2 / mid2 / lá. */
function fixture2() {
  const leaf = video("L2", 0, 8, { in: 0, out: 8 });
  const mid = nested("mid2", 0, 4, specWith([leaf]), {
    speed: 1,
    trim: { in: 1, out: 5 },
  });
  const top = nested("top2", 10, 4, specWith([mid]), {
    speed: 1,
    trim: { in: 0, out: 4 },
  });
  return { top, mid, leaf };
}

/** Đối chiếu window đã hợp với flattenNested (cùng lá). */
function assertMatchesFlatten(
  top: NestedClip,
  leafId: string,
  w: { absoluteStart: number; absoluteDuration: number; path: string[]; depth: number },
  what: string,
): void {
  const flat = flattenNested(top).find((f) => f.clip.id === leafId);
  assert(flat !== undefined, `${what}: flattenNested không có lá ${leafId}`);
  approx(flat!.absoluteStart, w.absoluteStart, 1e-9, `${what} flatten absoluteStart`);
  approx(flat!.absoluteDuration, w.absoluteDuration, 1e-9, `${what} flatten absoluteDuration`);
  eq(flat!.path, w.path, `${what} flatten path`);
  eq(flat!.depth, w.depth, `${what} flatten depth`);
}

/** Kiểm tra window + in/out của lá sâu trong top đã cho. */
function assertDeepWindow(
  top: NestedClip,
  chain: NestedClip[],
  leaf: Clip,
  want: {
    absoluteStart: number;
    absoluteDuration: number;
    visibleStart: number;
    visibleEnd: number;
    in: number;
    out: number;
  },
  what: string,
): void {
  const deep = deepNestedLeafVisibleSpeedCurve(top, chain, leaf);
  assert(deep !== null, `${what}: deep null`);
  approx(deep!.window.absoluteStart, want.absoluteStart, 1e-9, `${what} absoluteStart`);
  approx(deep!.window.absoluteDuration, want.absoluteDuration, 1e-9, `${what} absoluteDuration`);
  approx(deep!.window.visibleStart, want.visibleStart, 1e-9, `${what} visibleStart`);
  approx(deep!.window.visibleEnd, want.visibleEnd, 1e-9, `${what} visibleEnd`);
  approx(deep!.effectiveIn!, want.in, 1e-9, `${what} effectiveIn`);
  approx(deep!.effectiveOut!, want.out, 1e-9, `${what} effectiveOut`);
  assertMatchesFlatten(top, leaf.id, deep!.window, what);
  const w2 = composeNestedLeafWindow(top, chain, leaf);
  assert(w2 !== null, `${what}: compose null`);
  approx(w2!.absoluteStart, want.absoluteStart, 1e-9, `${what} compose absoluteStart`);
  approx(w2!.absoluteDuration, want.absoluteDuration, 1e-9, `${what} compose absoluteDuration`);
}

// --- (1) Fixture gốc: cửa sổ lá 3 cấp ---

test("3 cấp nguyên vẹn: cửa sổ lá = mid 0–2 → inner 1–3 → lá 3–5", () => {
  const { top, mid, inner, leaf } = fixtureS();
  eq(validateNestedClip(top), [], "top hợp lệ");
  assertDeepWindow(
    top, [mid, inner], leaf,
    { absoluteStart: 0, absoluteDuration: 2, visibleStart: 3, visibleEnd: 5, in: 3, out: 5 },
    "fixture S",
  );
});

test("2 cấp nguyên vẹn: top2 10–14 → lá 1–5", () => {
  const { top, mid, leaf } = fixture2();
  eq(validateNestedClip(top), [], "top2 hợp lệ");
  assertDeepWindow(
    top, [mid], leaf,
    { absoluteStart: 10, absoluteDuration: 4, visibleStart: 1, visibleEnd: 5, in: 1, out: 5 },
    "fixture 2 cấp",
  );
});

// --- (2) Split qua store: nửa trái / phải cho cửa sổ lá đúng ---

test("split 3 cấp tại t=1: trái lá 3–4, phải lá 4–5 (đúng trim chia đôi)", () => {
  const { top, mid, inner, leaf } = fixtureS();
  const pair = splitNestedClip(top, 1, idGen);
  assert(pair !== null, "split null");
  const [left, right] = pair!;
  eq(left.trim, { in: 0, out: 1 }, "trái trim");
  eq(left.duration, 1, "trái duration");
  eq(left.start, 0, "trái start");
  eq(right.trim, { in: 1, out: 2 }, "phải trim");
  eq(right.duration, 1, "phải duration");
  eq(right.start, 1, "phải start");
  eq(validateNestedClip(left), [], "trái hợp lệ");
  eq(validateNestedClip(right), [], "phải hợp lệ");
  assertDeepWindow(
    left, [mid, inner], leaf,
    { absoluteStart: 0, absoluteDuration: 1, visibleStart: 3, visibleEnd: 4, in: 3, out: 4 },
    "split trái",
  );
  assertDeepWindow(
    right, [mid, inner], leaf,
    { absoluteStart: 1, absoluteDuration: 1, visibleStart: 4, visibleEnd: 5, in: 4, out: 5 },
    "split phải",
  );
  // Gốc không bị sửa (snapshot undo của store dựa vào đó).
  eq(top.trim, { in: 0, out: 2 }, "gốc trim không đổi");
  eq(top.duration, 2, "gốc duration không đổi");
  assert(left.subSpec === top.subSpec, "hai nửa giữ nguyên subSpec (không copy)");
});

test("split 2 cấp tại t=12: trái lá 1–3, phải lá 3–5", () => {
  const { top, mid, leaf } = fixture2();
  const pair = splitNestedClip(top, 12, idGen);
  assert(pair !== null, "split 2 cấp null");
  const [left, right] = pair!;
  eq(left.trim, { in: 0, out: 2 }, "trái trim 2 cấp");
  eq(right.trim, { in: 2, out: 4 }, "phải trim 2 cấp");
  eq(right.start, 12, "phải start 2 cấp");
  assertDeepWindow(
    left, [mid], leaf,
    { absoluteStart: 10, absoluteDuration: 2, visibleStart: 1, visibleEnd: 3, in: 1, out: 3 },
    "split 2 cấp trái",
  );
  assertDeepWindow(
    right, [mid], leaf,
    { absoluteStart: 12, absoluteDuration: 2, visibleStart: 3, visibleEnd: 5, in: 3, out: 5 },
    "split 2 cấp phải",
  );
});

test("split với speed 2: điểm cắt chia trim theo tốc độ (cutSub = in + leftDur×2)", () => {
  const { mid, inner, leaf } = fixtureS();
  const fast = nested("topF", 0, 1, specWith([mid]), {
    speed: 2,
    trim: { in: 0, out: 2 },
  });
  const pair = splitNestedClip(fast, 0.5, idGen);
  assert(pair !== null, "split speed 2 null");
  const [left, right] = pair!;
  eq(left.trim, { in: 0, out: 1 }, "trái trim speed 2");
  eq(left.duration, 0.5, "trái duration speed 2");
  eq(right.trim, { in: 1, out: 2 }, "phải trim speed 2");
  eq(right.start, 0.5, "phải start speed 2");
  eq(validateNestedClip(left), [], "trái speed 2 hợp lệ");
  eq(validateNestedClip(right), [], "phải speed 2 hợp lệ");
  // Cửa sổ lá qua helper đệ quy vẫn khớp flatten (speed ngoài chỉ co
  // thời gian tuyệt đối, không đổi cửa sổ lá theo thời gian output).
  assertDeepWindow(
    left, [mid, inner], leaf,
    { absoluteStart: 0, absoluteDuration: 0.5, visibleStart: 3, visibleEnd: 4, in: 3, out: 4 },
    "split speed 2 trái",
  );
  assertDeepWindow(
    right, [mid, inner], leaf,
    { absoluteStart: 0.5, absoluteDuration: 0.5, visibleStart: 4, visibleEnd: 5, in: 4, out: 5 },
    "split speed 2 phải",
  );
});

test("split ngoài clip / đúng biên: null (không tách)", () => {
  const { top } = fixtureS();
  eq(splitNestedClip(top, 0, idGen), null, "t = start");
  eq(splitNestedClip(top, 2, idGen), null, "t = end");
  eq(splitNestedClip(top, -1, idGen), null, "t < start");
  eq(splitNestedClip(top, 3, idGen), null, "t > end");
});

// --- (3) Trim qua store: trái / phải cho cửa sổ lá đúng ---

test("trim trái top 0 → 0.5: cửa sổ lá dời thành 3.5–5", () => {
  const { top, mid, inner, leaf } = fixtureS();
  const trimmed = trimNestedClip(top, "left", 0.5);
  assert(trimmed !== null, "trim trái null");
  eq(trimmed!.start, 0.5, "trim trái start");
  eq(trimmed!.duration, 1.5, "trim trái duration");
  eq(trimmed!.trim, { in: 0.5, out: 2 }, "trim trái trim");
  eq(validateNestedClip(trimmed), [], "trim trái hợp lệ");
  assertDeepWindow(
    trimmed!, [mid, inner], leaf,
    { absoluteStart: 0.5, absoluteDuration: 1.5, visibleStart: 3.5, visibleEnd: 5, in: 3.5, out: 5 },
    "trim trái",
  );
  eq(top.trim, { in: 0, out: 2 }, "gốc không đổi sau trim trái");
});

test("trim phải top về duration 1: cửa sổ lá thành 3–4", () => {
  const { top, mid, inner, leaf } = fixtureS();
  const trimmed = trimNestedClip(top, "right", 1);
  assert(trimmed !== null, "trim phải null");
  eq(trimmed!.duration, 1, "trim phải duration");
  eq(trimmed!.trim, { in: 0, out: 1 }, "trim phải trim");
  eq(validateNestedClip(trimmed), [], "trim phải hợp lệ");
  assertDeepWindow(
    trimmed!, [mid, inner], leaf,
    { absoluteStart: 0, absoluteDuration: 1, visibleStart: 3, visibleEnd: 4, in: 3, out: 4 },
    "trim phải",
  );
});

test("trim trái mở rộng vào nguồn chưa dùng: từ trim [0.5,2) về start 0", () => {
  const { top, mid, inner, leaf } = fixtureS();
  const first = trimNestedClip(top, "left", 0.5)!;
  const back = trimNestedClip(first, "left", 0);
  assert(back !== null, "mở rộng trái null");
  eq(back!.start, 0, "mở rộng start");
  eq(back!.duration, 2, "mở rộng duration");
  eq(back!.trim, { in: 0, out: 2 }, "mở rộng trim");
  assertDeepWindow(
    back!, [mid, inner], leaf,
    { absoluteStart: 0, absoluteDuration: 2, visibleStart: 3, visibleEnd: 5, in: 3, out: 5 },
    "mở rộng trái",
  );
});

test("trim phải mở rộng tới hết subSpec (duration 2 là tối đa của top): OK; vượt → null", () => {
  const { top } = fixtureS();
  const short = trimNestedClip(top, "right", 1)!;
  const back = trimNestedClip(short, "right", 2);
  assert(back !== null, "mở rộng phải null");
  eq(back!.trim, { in: 0, out: 2 }, "mở rộng phải trim");
  eq(trimNestedClip(top, "right", 3), null, "vượt subSpec (2s) → null");
  eq(trimNestedClip(top, "right", 0.1), null, "duration < 0.2 → null");
  eq(trimNestedClip(top, "left", -0.5), null, "start < 0 → null");
  eq(trimNestedClip(top, "left", 1.9), null, "duration còn lại < 0.2 → null");
});

test("split rồi trim tiếp: nửa phải trim trái 1 → 1.5 cho lá 4.5–5", () => {
  const { top, mid, inner, leaf } = fixtureS();
  const [, right] = splitNestedClip(top, 1, idGen)!;
  const trimmed = trimNestedClip(right, "left", 1.5);
  assert(trimmed !== null, "split+trim null");
  eq(trimmed!.start, 1.5, "split+trim start");
  eq(trimmed!.duration, 0.5, "split+trim duration");
  eq(trimmed!.trim, { in: 1.5, out: 2 }, "split+trim trim");
  assertDeepWindow(
    trimmed!, [mid, inner], leaf,
    { absoluteStart: 1.5, absoluteDuration: 0.5, visibleStart: 4.5, visibleEnd: 5, in: 4.5, out: 5 },
    "split+trim",
  );
});

console.log(`\nnestedStore: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
