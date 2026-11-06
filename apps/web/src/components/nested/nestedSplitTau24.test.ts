/**
 * nestedSplitTau24.test.ts — Test thật cho Phase 9 đợt 24 (luồng H1):
 * nghịch đảo τ cho nestedSplitOffset dưới ramp tổ tiên.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/nested/nestedSplitTau24.test.ts
 *
 * Chỉ test logic thuần (không DOM/store — cùng mẫu nestedDeep.test.ts).
 * Mọi số kỳ vọng đều tính tay bằng nghiệm bậc hai giải tích của tích
 * phân ramp tuyến tính (KHÔNG qua bisection của code, nên không suy
 * diễn vòng tròn):
 * - Ramp 1→3 trên duration 4: s(t) = 1 + t/2, ∫₀ᵘ s = u + u²/4,
 *   τ(w) = −2 + √(4 + 4w). Neo: τ(2) = −2 + √12, τ(4) = −2 + √20.
 * - Ramp 1→2 trên duration 4: s(t) = 1 + t/4, ∫₀ᵘ s = u + u²/8,
 *   τ(w) = −4 + √(16 + 8w). Neo: τ(2) = −4 + √32, τ(4) = −4 + √48.
 * Đường tuyến tính cũ dưới ramp sẽ cho số khác hẳn (test 1 khóa cả
 * điểm này: dự đoán tuyến tính lệch > 0.3s so với đáp án τ đúng).
 *
 * Fixture (trim của nested mang ramp phải thỏa out = in + ∫₀ᴰ s theo
 * bất biến render §1.3, nếu không compose/flatten vẫn chạy nhưng cửa
 * sổ sẽ lệch — fixture ở đây đều thỏa đúng):
 * - rampTop: lá L [0,4) in=100 trong top start=10 duration=4 mang ramp
 *   1→3, trim [0,8) (∫₀⁴ = 8). Cửa sổ: absoluteStart 10,
 *   absoluteDuration τ(4) = −2 + √20.
 * - rampTwo: lá L [0,4) trong mid ramp 1→2 (trim [0,6), ∫₀⁴ = 6) rồi
 *   top ramp 1→3 (trim [0,8)), cả hai start=0 duration=4.
 * - threeRamp: thêm inner ramp 1→2 giữa mid và lá (chain [mid, inner]).
 * - mixedConstRamp: mid ramp 1→2 + top tốc độ hằng 2 (không trim,
 *   duration = 4/2 = 2).
 */
import {
  flattenNested,
  type Clip,
  type NestedClip,
  type SpeedCurve,
  type SpeedKeyframe,
  type VideoSpec,
} from "@repo-1/video-spec";
import { nestedSplitOffset } from "./nestUtils.ts";

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

/** Ramp tuyến tính v0→v1 trên [0, duration]. */
function linRamp(v0: number, v1: number, duration: number): SpeedCurve {
  const kfs: SpeedKeyframe[] = [
    { t: 0, v: v0, easing: "linear" },
    { t: duration, v: v1, easing: "linear" },
  ];
  return { keyframes: kfs };
}

/** τ giải tích cho ramp 1→3, duration 4: đảo của u + u²/4. */
const tau13 = (w: number): number => -2 + Math.sqrt(4 + 4 * w);
/** τ giải tích cho ramp 1→2, duration 4: đảo của u + u²/8. */
const tau12 = (w: number): number => -4 + Math.sqrt(16 + 8 * w);

function rampTopFixture() {
  const leaf = video("L", 0, 4, { in: 100, out: 104 });
  const top = nested("top", 10, 4, specWith([leaf]), {
    speed: 1,
    trim: { in: 0, out: 8 },
    speedKeyframes: linRamp(1, 3, 4),
  });
  return { top, leaf };
}

function rampTwoFixture() {
  const leaf = video("L", 0, 4, { in: 100, out: 104 });
  const mid = nested("mid", 0, 4, specWith([leaf]), {
    speed: 1,
    trim: { in: 0, out: 6 },
    speedKeyframes: linRamp(1, 2, 4),
  });
  const top = nested("top", 0, 4, specWith([mid]), {
    speed: 1,
    trim: { in: 0, out: 8 },
    speedKeyframes: linRamp(1, 3, 4),
  });
  return { top, mid, leaf };
}

function threeRampFixture() {
  const leaf = video("L", 0, 4, { in: 100, out: 104 });
  const inner = nested("inner", 0, 4, specWith([leaf]), {
    speed: 1,
    trim: { in: 0, out: 6 },
    speedKeyframes: linRamp(1, 2, 4),
  });
  const mid = nested("mid", 0, 4, specWith([inner]), {
    speed: 1,
    trim: { in: 0, out: 6 },
    speedKeyframes: linRamp(1, 2, 4),
  });
  const top = nested("top", 0, 4, specWith([mid]), {
    speed: 1,
    trim: { in: 0, out: 8 },
    speedKeyframes: linRamp(1, 3, 4),
  });
  return { top, mid, inner, leaf };
}

function mixedConstRampFixture() {
  const leaf = video("L", 0, 4, { in: 100, out: 104 });
  const mid = nested("mid", 0, 4, specWith([leaf]), {
    speed: 1,
    trim: { in: 0, out: 6 },
    speedKeyframes: linRamp(1, 2, 4),
  });
  const top = nested("top", 0, 2, specWith([mid]), { speed: 2 });
  return { top, mid, leaf };
}

function constFixture() {
  const leaf = video("L", 2, 6, { in: 100, out: 106 });
  const mid = nested("mid", 1, 3, specWith([leaf]), {
    speed: 2,
    trim: { in: 1, out: 7 },
  });
  const top = nested("top", 10, 4, specWith([mid]), {
    speed: 1,
    trim: { in: 0, out: 4 },
  });
  return { top, mid, leaf };
}

function assertMatchesFlatten(
  top: NestedClip,
  leafId: string,
  w: { absoluteStart: number; absoluteDuration: number },
  what: string,
): void {
  const flat = flattenNested(top).find((f) => f.clip.id === leafId);
  assert(flat !== undefined, `${what}: flattenNested không có lá ${leafId}`);
  approx(flat!.absoluteStart, w.absoluteStart, 1e-9, `${what} flatten absoluteStart`);
  approx(flat!.absoluteDuration, w.absoluteDuration, 1e-9, `${what} flatten absoluteDuration`);
}

// ---- test ----

test("ramp đơn ở top: τ tính tay + split giữa + khớp flatten", () => {
  const { top, leaf } = rampTopFixture();
  // Mốc ngoài ứng với leafLocalTime = 2: 10 + τ₁₃(2) = 10 − 2 + √12.
  const outer = 10 + tau13(2);
  const s = nestedSplitOffset(top, [], leaf, outer);
  assert(s !== null, "split null");
  approx(s!.leafLocalTime, 2, 1e-9, "leafLocalTime τ");
  approx(s!.sourceTime!, 102, 1e-9, "sourceTime (lá tốc độ 1)");
  approx(s!.window.absoluteStart, 10, 1e-9, "absoluteStart");
  approx(s!.window.absoluteDuration, tau13(4), 1e-9, "absoluteDuration = τ(4)");
  assertMatchesFlatten(top, "L", s!.window, "ramp đơn");
  // Chứng tỏ test này phân biệt được với đường tuyến tính cũ: nội suy
  // tuyến tính từ cùng mốc ngoài sẽ cho ~2.369, lệch đáp án đúng > 0.3s.
  const mapK = s!.window.absoluteDuration / (s!.window.visibleEnd - s!.window.visibleStart);
  const linearPred =
    s!.window.visibleStart + (outer - s!.window.absoluteStart) / mapK;
  assert(Math.abs(linearPred - 2) > 0.3, `đường tuyến tính cũ phải lệch, nhận ${linearPred}`);
});

test("ramp đơn ở top: biên đầu/cuối + ngoài miền → null", () => {
  const { top, leaf } = rampTopFixture();
  const atStart = nestedSplitOffset(top, [], leaf, 10);
  assert(atStart !== null, "biên đầu null");
  approx(atStart!.leafLocalTime, 0, 1e-9, "biên đầu");
  approx(atStart!.sourceTime!, 100, 1e-9, "nguồn biên đầu");
  const atEnd = nestedSplitOffset(top, [], leaf, 10 + tau13(4));
  assert(atEnd !== null, "biên cuối null");
  approx(atEnd!.leafLocalTime, 4, 1e-9, "biên cuối");
  approx(atEnd!.sourceTime!, 104, 1e-9, "nguồn biên cuối");
  eq(nestedSplitOffset(top, [], leaf, 9.9), null, "trước lá → null");
  eq(nestedSplitOffset(top, [], leaf, 12.6), null, "sau lá → null");
});

test("hai tầng ramp: chuỗi τ tính tay + khớp flatten", () => {
  const { top, mid, leaf } = rampTwoFixture();
  // Ngoài → trong: outer = τ_top(τ_mid(2)); τ_mid(2) = −4 + √32.
  const outer = tau13(tau12(2));
  const s = nestedSplitOffset(top, [mid], leaf, outer);
  assert(s !== null, "split null");
  approx(s!.leafLocalTime, 2, 1e-9, "leafLocalTime chuỗi τ");
  approx(s!.sourceTime!, 102, 1e-9, "sourceTime");
  approx(s!.window.absoluteStart, 0, 1e-9, "absoluteStart");
  approx(s!.window.absoluteDuration, tau13(tau12(4)), 1e-9, "absoluteDuration chuỗi τ");
  assertMatchesFlatten(top, "L", s!.window, "hai tầng ramp");
});

test("ba tầng ramp: chuỗi τ ba lớp", () => {
  const { top, mid, inner, leaf } = threeRampFixture();
  // leafLocalTime = 1 → τ_inner(1) = −4 + √24, rồi τ_mid, rồi τ_top.
  const outer = tau13(tau12(tau12(1)));
  const s = nestedSplitOffset(top, [mid, inner], leaf, outer);
  assert(s !== null, "split null");
  approx(s!.leafLocalTime, 1, 1e-9, "leafLocalTime ba tầng");
  approx(s!.sourceTime!, 101, 1e-9, "sourceTime");
  approx(s!.window.absoluteDuration, tau13(tau12(tau12(4))), 1e-9, "absoluteDuration ba tầng");
  assertMatchesFlatten(top, "L", s!.window, "ba tầng ramp");
});

test("hỗn hợp hằng + ramp: top speed 2 + mid ramp", () => {
  const { top, mid, leaf } = mixedConstRampFixture();
  // F(t) = τ_mid(t) / 2 nên mốc ngoài ứng với leafLocalTime = 2 là τ₁₂(2)/2.
  const outer = tau12(2) / 2;
  const s = nestedSplitOffset(top, [mid], leaf, outer);
  assert(s !== null, "split null");
  approx(s!.leafLocalTime, 2, 1e-9, "leafLocalTime hỗn hợp");
  approx(s!.window.absoluteDuration, tau12(4) / 2, 1e-9, "absoluteDuration hỗn hợp");
  assertMatchesFlatten(top, "L", s!.window, "hỗn hợp");
});

test("lá có curve riêng dưới ramp tổ tiên: sourceTime qua tích phân lá", () => {
  const leaf = video("R", 0, 4, {
    in: 10,
    out: 16,
    speedKeyframes: linRamp(1, 2, 4),
  });
  const top = nested("top", 10, 4, specWith([leaf]), {
    speed: 1,
    trim: { in: 0, out: 8 },
    speedKeyframes: linRamp(1, 3, 4),
  });
  const s = nestedSplitOffset(top, [], leaf, 10 + tau13(2));
  assert(s !== null, "split null");
  approx(s!.leafLocalTime, 2, 1e-9, "leafLocalTime");
  // Nguồn lá: 10 + ∫₀² (1 + t/4) dt = 10 + 2 + 0.5 = 12.5.
  approx(s!.sourceTime!, 12.5, 1e-9, "sourceTime qua tích phân lá");
});

test("hồi quy không curve: công thức tuyến tính cũ khớp strict", () => {
  const { top, mid, leaf } = constFixture();
  const s = nestedSplitOffset(top, [mid], leaf, 12.5);
  assert(s !== null, "split null");
  // Kỳ vọng tính bằng ĐÚNG biểu thức của đường cũ từ window trả về —
  // eq strict nên bất kỳ thay đổi phép tính nào ở đường hằng cũng đỏ.
  const w = s!.window;
  const expected =
    w.visibleStart + (12.5 - w.absoluteStart) / (w.absoluteDuration / (w.visibleEnd - w.visibleStart));
  eq(s!.leafLocalTime, expected, "leafLocalTime strict");
  eq(s!.leafLocalTime, 2, "leafLocalTime = 2");
  eq(s!.sourceTime, 102, "sourceTime = 102");
  eq(nestedSplitOffset(top, [mid], leaf, 11.5)?.leafLocalTime, 0, "biên đầu strict");
  eq(nestedSplitOffset(top, [mid], leaf, 14)?.leafLocalTime, 5, "biên cuối strict");
  const odd = nestedSplitOffset(top, [mid], leaf, 13.1);
  assert(odd !== null, "split lẻ null");
  const expectedOdd =
    w.visibleStart + (13.1 - w.absoluteStart) / (w.absoluteDuration / (w.visibleEnd - w.visibleStart));
  eq(odd!.leafLocalTime, expectedOdd, "mốc lẻ strict");
});

test("fail-fast: curve sai hình dạng ở top/mid/rỗng → throw chứa speedKeyframes", () => {
  // v ngoài [0.25, 4] ở top.
  {
    const leaf = video("L", 0, 4, { in: 100, out: 104 });
    const bad = nested("top", 10, 4, specWith([leaf]), {
      speed: 1,
      trim: { in: 0, out: 8 },
      speedKeyframes: linRamp(1, 5, 4),
    });
    throws(() => nestedSplitOffset(bad, [], leaf, 11), "speedKeyframes", "v=5 ở top");
  }
  // t vượt duration ở tầng mid (chain).
  {
    const leaf = video("L", 0, 4, { in: 100, out: 104 });
    const mid = nested("mid", 0, 4, specWith([leaf]), {
      speed: 1,
      trim: { in: 0, out: 6 },
      speedKeyframes: { keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 5, v: 2, easing: "linear" },
      ] } as SpeedCurve,
    });
    const top = nested("top", 0, 4, specWith([mid]), { speed: 1 });
    throws(() => nestedSplitOffset(top, [mid], leaf, 1), "speedKeyframes", "t=5 vượt duration ở mid");
  }
  // keyframes rỗng ở top.
  {
    const leaf = video("L", 0, 4, { in: 100, out: 104 });
    const bad = nested("top", 10, 4, specWith([leaf]), {
      speed: 1,
      trim: { in: 0, out: 8 },
      speedKeyframes: { keyframes: [] } as SpeedCurve,
    });
    throws(() => nestedSplitOffset(bad, [], leaf, 11), "speedKeyframes", "keyframes rỗng ở top");
  }
});

console.log(`\nnestedSplitTau24: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
