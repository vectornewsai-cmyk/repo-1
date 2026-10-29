/**
 * nestedDeep.test.ts — Test thật cho Phase 9 đợt 15 (luồng T3):
 * nested clip sâu hơn 1 cấp (hợp cửa sổ đệ quy + in/out + split).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/speed/nestedDeep.test.ts
 *
 * Chỉ test logic thuần (không DOM/store — cùng mẫu nestedSpeedcurve.test.ts
 * đợt 14 R5). Mọi assert đều là số thật (vị trí, duration, in/out,
 * keyframe), không assert suông. Các số trong test đã tính tay từ công
 * thức của flattenInto (xem composeNestedLeafWindow trong nested.ts);
 * đối chiếu flattenNested được chạy như một test riêng cho mọi fixture.
 *
 * Fixture chuẩn (đọc trước khi sửa số):
 * - A (2 cấp): leaf L [2,8) in=100 trong mid [1,4) speed=2 trim [1,7),
 *   top start=10 speed=1 trim [0,4). Cửa sổ hợp: mid [1,7), lá [2,7) →
 *   absoluteStart 11.5, duration 2.5, visible [0,5), in/out 100/105.
 * - B (3 cấp): leaf L2 [0,8) in=50 trong inner [2,10) speed=0.5 trim
 *   [0,4), trong mid [0,4) speed=2 trim [1,9), top start=20 speed=1
 *   không trim. Cửa sổ hợp: mid [1,9), inner [0,3.5), lá [0,3.5) →
 *   absoluteStart 20.5, duration 3.5, visible [0,3.5), in/out 50/53.5,
 *   cumulativeSpeed 1 (= 1×2×0.5).
 * - C (curve 2 cấp): leaf R [0,4) in=10 ramp linear 1→2 trong mid [0,4)
 *   speed=1 không trim, top start=5 speed=1 trim [1,3). Lá khả kiến
 *   [1,3) → absoluteStart 5, duration 2, slice (0,1.25)→(2,1.75),
 *   in/out theo ramp 11.125/14.125.
 */
import {
  composeNestedLeafWindow,
  flattenNested,
  MAX_NESTED_DEPTH,
  speedAt,
  type Clip,
  type NestedClip,
  type SpeedCurve,
  type SpeedKeyframe,
  type VideoSpec,
} from "@repo-1/video-spec";
import { composeNestedLeafWindow as composeTs } from "../../../../../packages/video-spec/src/nested.ts";
import { composeNestedLeafWindow as composeJs } from "../../../../../packages/video-spec/src/nested.js";
import {
  deepNestedLeafVisibleSpeedCurve,
  leafVisibleSpeedCurveForWindow,
  nestedLeafVisibleSpeedCurve,
  nestedSplitOffset,
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

function throws(fn: () => unknown, needle: string, what: string): void {
  try {
    fn();
  } catch (e) {
    assert(
      (e as Error).message.includes(needle),
      `${what}: message "${(e as Error).message}" không chứa "${needle}"`,
    );
    return;
  }
  throw new Error(`${what}: không throw`);
}

// ---- fixture ----

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
    src: `${id}.mp4`,
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

/** Fixture A: 2 cấp, trim cả cha (top) và con (mid). */
function fixtureA(topTrim?: { in: number; out: number }) {
  const leaf = video("L", 2, 6, { in: 100, out: 106 });
  const mid = nested("mid", 1, 3, specWith([leaf]), {
    speed: 2,
    trim: { in: 1, out: 7 },
  });
  const top = nested("top", 10, topTrim ? topTrim.out - topTrim.in : 4, specWith([mid]), {
    speed: 1,
    trim: topTrim ?? { in: 0, out: 4 },
  });
  return { top, mid, leaf };
}

/** Fixture B: 3 cấp, trim ở mid và inner, top không trim. */
function fixtureB() {
  const leaf = video("L2", 0, 8, { in: 50, out: 58 });
  const inner = nested("in", 2, 8, specWith([leaf]), {
    speed: 0.5,
    trim: { in: 0, out: 4 },
  });
  const mid = nested("mid", 0, 4, specWith([inner]), {
    speed: 2,
    trim: { in: 1, out: 9 },
  });
  const top = nested("top", 20, 4, specWith([mid]), { speed: 1 });
  return { top, mid, inner, leaf };
}

const ramp12 = (t0: number, v0: number, t1: number, v1: number): SpeedKeyframe[] => [
  { t: t0, v: v0, easing: "linear" },
  { t: t1, v: v1, easing: "linear" },
];

/** Fixture C: curve 2 cấp, top trim [1,3). */
function fixtureC() {
  const leaf = video("R", 0, 4, {
    in: 10,
    out: 16,
    speedKeyframes: { keyframes: ramp12(0, 1, 4, 2) } as SpeedCurve,
  });
  const mid = nested("mid", 0, 4, specWith([leaf]), { speed: 1 });
  const top = nested("top", 5, 2, specWith([mid]), {
    speed: 1,
    trim: { in: 1, out: 3 },
  });
  return { top, mid, leaf };
}

/** Fixture D: curve 3 cấp, trim ở mid [1,3), top/inner không trim. */
function fixtureD() {
  const leaf = video("C3", 0, 4, {
    in: 10,
    out: 16,
    speedKeyframes: { keyframes: ramp12(0, 1, 4, 2) } as SpeedCurve,
  });
  const inner = nested("in", 0, 4, specWith([leaf]), { speed: 1 });
  const mid = nested("mid", 0, 2, specWith([inner]), {
    speed: 1,
    trim: { in: 1, out: 3 },
  });
  const top = nested("top", 0, 2, specWith([mid]), { speed: 1 });
  return { top, mid, inner, leaf };
}

/** Đối chiếu 1 entry flattenNested với window đã hợp (cùng lá). */
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

// --- (1) 2 cấp: trim cả cha và con ---

test("2 cấp trim cha+con: vị trí/duration/in-out đúng số", () => {
  const { top, mid, leaf } = fixtureA();
  const w = composeNestedLeafWindow(top, [mid], leaf);
  assert(w !== null, "window null");
  approx(w!.absoluteStart, 11.5, 1e-9, "absoluteStart");
  approx(w!.absoluteDuration, 2.5, 1e-9, "absoluteDuration");
  approx(w!.visibleStart, 0, 1e-9, "visibleStart");
  approx(w!.visibleEnd, 5, 1e-9, "visibleEnd");
  eq(w!.path, ["top", "mid"], "path");
  eq(w!.depth, 2, "depth");
  approx(w!.cumulativeSpeed, 2, 1e-9, "cumulativeSpeed");
  const deep = deepNestedLeafVisibleSpeedCurve(top, [mid], leaf);
  assert(deep !== null, "deep null");
  eq(deep!.curve, null, "lá không curve");
  approx(deep!.effectiveIn!, 100, 1e-9, "effectiveIn");
  approx(deep!.effectiveOut!, 105, 1e-9, "effectiveOut");
  assertMatchesFlatten(top, "L", w!, "fixture A");
});

test("2 cấp trim cha cắt lá: cửa sổ dời theo tốc độ mid", () => {
  const { top, mid, leaf } = fixtureA({ in: 2, out: 4 });
  const w = composeNestedLeafWindow(top, [mid], leaf);
  assert(w !== null, "window null");
  // Kiểm chứng tay: mapP' = 10 + (1−2)×1 = 9 (mid bắt đầu trước cửa sổ
  // top), lá khả kiến từ mid-time 3 → 9 + (3−1)×0.5 = 10, không phải 12.
  approx(w!.absoluteStart, 10, 1e-9, "absoluteStart");
  approx(w!.absoluteDuration, 2, 1e-9, "absoluteDuration");
  approx(w!.visibleStart, 1, 1e-9, "visibleStart");
  approx(w!.visibleEnd, 5, 1e-9, "visibleEnd");
  const deep = deepNestedLeafVisibleSpeedCurve(top, [mid], leaf);
  approx(deep!.effectiveIn!, 101, 1e-9, "effectiveIn (lá bị cắt 1s đầu)");
  approx(deep!.effectiveOut!, 105, 1e-9, "effectiveOut");
  assertMatchesFlatten(top, "L", w!, "fixture A trim cha");
});

// --- (2) 3 cấp ---

test("3 cấp: cửa sổ hợp qua mid+inner, khớp flatten", () => {
  const { top, mid, inner, leaf } = fixtureB();
  const w = composeNestedLeafWindow(top, [mid, inner], leaf);
  assert(w !== null, "window null");
  approx(w!.absoluteStart, 20.5, 1e-9, "absoluteStart");
  approx(w!.absoluteDuration, 3.5, 1e-9, "absoluteDuration");
  approx(w!.visibleStart, 0, 1e-9, "visibleStart");
  approx(w!.visibleEnd, 3.5, 1e-9, "visibleEnd");
  eq(w!.path, ["top", "mid", "in"], "path");
  eq(w!.depth, 3, "depth");
  approx(w!.cumulativeSpeed, 1, 1e-9, "cumulativeSpeed 1×2×0.5");
  const deep = deepNestedLeafVisibleSpeedCurve(top, [mid, inner], leaf);
  approx(deep!.effectiveIn!, 50, 1e-9, "effectiveIn");
  approx(deep!.effectiveOut!, 53.5, 1e-9, "effectiveOut");
  assertMatchesFlatten(top, "L2", w!, "fixture B");
});

// --- (3) Speedcurve trong nested sâu ---

test("curve 2 cấp: slice đúng + in/out theo tích phân ramp", () => {
  const { top, mid, leaf } = fixtureC();
  const deep = deepNestedLeafVisibleSpeedCurve(top, [mid], leaf);
  assert(deep !== null, "deep null");
  approx(deep!.window.absoluteStart, 5, 1e-9, "absoluteStart");
  approx(deep!.window.absoluteDuration, 2, 1e-9, "absoluteDuration");
  approx(deep!.window.visibleStart, 1, 1e-9, "visibleStart");
  approx(deep!.window.visibleEnd, 3, 1e-9, "visibleEnd");
  const curve = deep!.curve;
  assert(curve !== null, "curve null");
  eq(curve!.keyframes.map((k) => [k.t, k.v]), [[0, 1.25], [2, 1.75]], "slice keyframes");
  approx(curve!.visibleDuration, 2, 1e-9, "visibleDuration");
  approx(curve!.visibleStart, 1, 1e-9, "visibleStart của curve");
  const orig = (leaf as unknown as { speedKeyframes: SpeedCurve }).speedKeyframes.keyframes;
  approx(
    speedAt({ keyframes: curve!.keyframes }, 0.5),
    speedAt({ keyframes: orig }, 1.5),
    1e-9,
    "slice đánh giá bằng gốc tại 1.5",
  );
  approx(deep!.effectiveIn!, 11.125, 1e-9, "effectiveIn ramp");
  approx(deep!.effectiveOut!, 14.125, 1e-9, "effectiveOut ramp");
  assertMatchesFlatten(top, "R", deep!.window, "fixture C");
});

test("curve 3 cấp: cùng số như 2 cấp (độ sâu không đổi curve)", () => {
  const { top, mid, inner, leaf } = fixtureD();
  const deep = deepNestedLeafVisibleSpeedCurve(top, [mid, inner], leaf);
  assert(deep !== null, "deep null");
  approx(deep!.window.absoluteStart, 0, 1e-9, "absoluteStart");
  approx(deep!.window.absoluteDuration, 2, 1e-9, "absoluteDuration");
  const curve = deep!.curve;
  assert(curve !== null, "curve null");
  eq(curve!.keyframes.map((k) => [k.t, k.v]), [[0, 1.25], [2, 1.75]], "slice keyframes");
  approx(deep!.effectiveIn!, 11.125, 1e-9, "effectiveIn ramp");
  approx(deep!.effectiveOut!, 14.125, 1e-9, "effectiveOut ramp");
  assertMatchesFlatten(top, "C3", deep!.window, "fixture D");
});

// --- (4) Split qua biên nested ---

test("split 2 cấp: mốc ngoài map xuống lá + nguồn (tốc độ hằng)", () => {
  const { top, mid, leaf } = fixtureA();
  const s = nestedSplitOffset(top, [mid], leaf, 12.5);
  assert(s !== null, "split null");
  approx(s!.leafLocalTime, 2, 1e-9, "leafLocalTime");
  approx(s!.sourceTime!, 102, 1e-9, "sourceTime");
  const atStart = nestedSplitOffset(top, [mid], leaf, 11.5);
  approx(atStart!.leafLocalTime, 0, 1e-9, "biên đầu lá");
  approx(atStart!.sourceTime!, 100, 1e-9, "nguồn biên đầu");
  const atEnd = nestedSplitOffset(top, [mid], leaf, 14);
  approx(atEnd!.leafLocalTime, 5, 1e-9, "biên cuối lá");
  approx(atEnd!.sourceTime!, 105, 1e-9, "nguồn biên cuối");
  eq(nestedSplitOffset(top, [mid], leaf, 15), null, "ngoài lá → null");
  eq(nestedSplitOffset(top, [mid], leaf, 11.4), null, "trước lá → null");
});

test("split 3 cấp + split lá có curve: mốc map qua ramp", () => {
  const { top, mid, inner, leaf } = fixtureB();
  const s = nestedSplitOffset(top, [mid, inner], leaf, 21.5);
  assert(s !== null, "split 3 cấp null");
  approx(s!.leafLocalTime, 1, 1e-9, "leafLocalTime 3 cấp");
  approx(s!.sourceTime!, 51, 1e-9, "sourceTime 3 cấp");
  const { top: topC, mid: midC, leaf: leafC } = fixtureC();
  const sc = nestedSplitOffset(topC, [midC], leafC, 5.5);
  assert(sc !== null, "split curve null");
  approx(sc!.leafLocalTime, 1.5, 1e-9, "leafLocalTime curve");
  // ∫[0,1.5) (1+0.25t) dt = 1.5 + 0.125×2.25 = 1.78125 → 11.78125.
  approx(sc!.sourceTime!, 11.78125, 1e-9, "sourceTime qua tích phân ramp");
});

// --- (5) Giới hạn: sâu tối đa, vòng lặp, chain lệch, cắt hết ---

function buildDeepChain(chainLen: number): { top: NestedClip; chain: NestedClip[]; leaf: Clip } {
  const leaf = video("deep-leaf", 0, 4);
  let curSpec = specWith([leaf]);
  const chain: NestedClip[] = [];
  for (let i = 0; i < chainLen; i++) {
    const n = nested(`lv${i}`, 0, 4, curSpec, { speed: 1 });
    chain.unshift(n);
    curSpec = specWith([n]);
  }
  const top = nested("deep-top", 0, 4, curSpec, { speed: 1 });
  return { top, chain, leaf };
}

test("sâu đúng 8 tầng: OK, sâu 9 tầng: throw", () => {
  eq(MAX_NESTED_DEPTH, 8, "MAX_NESTED_DEPTH");
  const ok = buildDeepChain(7);
  const w = composeNestedLeafWindow(ok.top, ok.chain, ok.leaf);
  assert(w !== null, "depth 8 window null");
  eq(w!.depth, 8, "depth 8");
  approx(w!.absoluteStart, 0, 1e-9, "absoluteStart depth 8");
  approx(w!.absoluteDuration, 4, 1e-9, "absoluteDuration depth 8");
  const over = buildDeepChain(8);
  throws(
    () => composeNestedLeafWindow(over.top, over.chain, over.leaf),
    "vượt độ sâu",
    "depth 9",
  );
});

test("vòng lặp tham chiếu subSpec theo đường đi: throw", () => {
  const leaf = video("cyc-leaf", 0, 4);
  const sub = specWith([leaf]);
  const child = nested("cyc", 0, 4, sub, { speed: 1 });
  // subSpec của child CHÍNH là subSpec của top → vòng lặp.
  (sub.tracks[0] as unknown as { clips: Clip[] }).clips = [child as unknown as Clip];
  const top = nested("top", 0, 4, sub, { speed: 1 });
  throws(
    () => composeNestedLeafWindow(top, [child], leaf),
    "vòng lặp",
    "cycle",
  );
});

test("chain không khớp cây / lá không tìm thấy: throw", () => {
  const { top, leaf } = fixtureA();
  const ghost = nested("ghost", 0, 1, specWith([]), { speed: 1 });
  throws(
    () => composeNestedLeafWindow(top, [ghost], leaf),
    "không khớp",
    "chain ghost",
  );
  const { mid } = fixtureA();
  const missing = video("missing", 0, 1);
  throws(
    () => composeNestedLeafWindow(top, [mid], missing),
    "không tìm thấy",
    "lá missing",
  );
});

test("lá bị trim ngoài cắt hết ở tầng cha: null (không throw)", () => {
  const { top, mid, leaf } = fixtureA({ in: 0, out: 1 });
  eq(composeNestedLeafWindow(top, [mid], leaf), null, "compose null");
  eq(deepNestedLeafVisibleSpeedCurve(top, [mid], leaf), null, "deep null");
  eq(nestedSplitOffset(top, [mid], leaf, 0.5), null, "split null");
});

test("dùng lại cùng subSpec ở 2 clip anh em: hợp lệ (không phải vòng lặp)", () => {
  const leaf = video("shared-leaf", 0, 4, { in: 7, out: 11 });
  const shared = specWith([leaf]);
  const s1 = nested("s1", 0, 4, shared, { speed: 1 });
  const s2 = nested("s2", 4, 4, shared, { speed: 1 });
  const top = nested("top", 0, 8, specWith([s1 as unknown as Clip, s2 as unknown as Clip]), {
    speed: 1,
  });
  const w1 = composeNestedLeafWindow(top, [s1], leaf);
  const w2 = composeNestedLeafWindow(top, [s2], leaf);
  assert(w1 !== null && w2 !== null, "sibling window null");
  approx(w1!.absoluteStart, 0, 1e-9, "s1 absoluteStart");
  approx(w2!.absoluteStart, 4, 1e-9, "s2 absoluteStart");
});

// --- (6) Hồi quy 1 cấp + reverse + parity .ts ↔ .js ---

test("hồi quy 1 cấp: hợp đồng R5 giữ nguyên (thuần-trim, không khớp cây)", () => {
  // Mâu thuẫn spec đã ghi nhận (xem LIMITS đợt 15 T3): helper 1 tầng R5
  // là hàm thuần theo trim, KHÔNG yêu cầu lá nằm trong subSpec (test R5
  // dùng subSpec rỗng). Hàm này được giữ nguyên, không ép qua helper
  // đệ quy khớp-cây — test này khóa đúng hành vi đó.
  const { leaf } = fixtureC();
  const loose_nested = nested("nd", 0, 2, specWith([]), {
    speed: 1,
    trim: { in: 1, out: 3 },
  });
  const viaHelper = nestedLeafVisibleSpeedCurve(loose_nested, leaf);
  const direct = leafVisibleSpeedCurveForWindow(leaf, 1, 3);
  assert(viaHelper !== null && direct !== null, "1 cấp null");
  eq(viaHelper, direct, "1 cấp bằng trực tiếp dù lá không trong cây");
  // Ngược lại, helper đệ quy thì fail fast khi lá không trong cây.
  throws(
    () => deepNestedLeafVisibleSpeedCurve(loose_nested, [], leaf),
    "không tìm thấy",
    "deep khớp-cây fail fast",
  );
});

test("reverse tốc độ hằng: in/out đảo chiều theo phần khả kiến", () => {
  const leaf = video("rev", 0, 4, { in: 10, out: 20, reverse: true });
  const top = nested("top", 0, 2, specWith([leaf]), {
    speed: 1,
    trim: { in: 1, out: 3 },
  });
  const deep = deepNestedLeafVisibleSpeedCurve(top, [], leaf);
  assert(deep !== null, "deep reverse null");
  approx(deep!.window.visibleStart, 1, 1e-9, "visibleStart");
  approx(deep!.window.visibleEnd, 3, 1e-9, "visibleEnd");
  approx(deep!.effectiveIn!, 17, 1e-9, "effectiveIn đảo (20−3)");
  approx(deep!.effectiveOut!, 19, 1e-9, "effectiveOut đảo (20−1)");
});

test("clip chữ: không có in/out nhưng vẫn có window", () => {
  const leaf = {
    kind: "text",
    id: "txt",
    text: "hi",
    start: 0,
    duration: 4,
  } as unknown as Clip;
  const top = nested("top", 0, 2, specWith([leaf]), {
    speed: 1,
    trim: { in: 1, out: 3 },
  });
  const deep = deepNestedLeafVisibleSpeedCurve(top, [], leaf);
  assert(deep !== null, "deep text null");
  eq(deep!.effectiveIn, undefined, "text không effectiveIn");
  eq(deep!.effectiveOut, undefined, "text không effectiveOut");
  eq(nestedSplitOffset(top, [], leaf, 1.5)?.sourceTime, undefined, "text split không sourceTime");
});

test("parity .ts ↔ .js cho composeNestedLeafWindow", () => {
  const a = fixtureA();
  const b = fixtureB();
  eq(composeTs(a.top, [a.mid], a.leaf), composeNestedLeafWindow(a.top, [a.mid], a.leaf), "A ts");
  eq(composeJs(a.top, [a.mid], a.leaf), composeNestedLeafWindow(a.top, [a.mid], a.leaf), "A js");
  eq(
    composeTs(b.top, [b.mid, b.inner], b.leaf),
    composeNestedLeafWindow(b.top, [b.mid, b.inner], b.leaf),
    "B ts",
  );
  eq(
    composeJs(b.top, [b.mid, b.inner], b.leaf),
    composeNestedLeafWindow(b.top, [b.mid, b.inner], b.leaf),
    "B js",
  );
});

console.log(`\nnestedDeep: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
