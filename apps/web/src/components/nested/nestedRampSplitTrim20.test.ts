/**
 * nestedRampSplitTrim20.test.ts — Test thật cho Phase 9 đợt 20 (luồng R2):
 * split/trim nested clip mang speedKeyframes qua ánh xạ τ (đóng nợ đợt 19
 * G2 §1a/§3 — trước đây splitNestedClip/trimNestedClip trả null cho mọi
 * nested có curve vì dùng ánh xạ tuyến tính theo speed hằng).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/nested/nestedRampSplitTrim20.test.ts
 *
 * Chỉ test logic thuần trong nestUtils.ts (không DOM/store). Mọi con số
 * suy bằng tay, không lấy từ code đang test (tránh kiểm chứng vòng tròn):
 * - Ramp linear 1→2 trên [0,4]: s(t) = 1 + t/4; ∫₀ᵗ = t + t²/8.
 *   ∫₀¹ = 1.125; ∫₀² = 2.5; ∫₀³ = 4.125; ∫₀⁴ = 6.
 * - Ramp 3 điểm 1→1.5→2 trên [0,4] (gãy tại 2): ∫₀² = 2.5;
 *   ∫₂³ = (1.5+1.75)/2 × 1 = 1.625; ∫₀³ = 4.125.
 * - Curve hằng v=2 trên [0,4]: ∫₀ᵗ = 2t (trùng phép tuyến tính cũ
 *   với speed = 2).
 * - Bất biến kiểm tra cho mọi nửa/đoạn sau cắt: trim.out − trim.in phải
 *   bằng ∫ của curve mới trên duration mới, dung sai 1e-4s (render §1.3).
 */
import { splitNestedClip, trimNestedClip } from "./nestUtils.ts";
import {
  sourcePosAt,
  speedAt,
  type Clip,
  type NestedClip,
  type SpeedCurve,
  type VideoSpec,
} from "@repo-1/video-spec";

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
  if (Math.abs(a - b) > tol) throw new Error(`${what} nhận ${a}, muốn ${b} ± ${tol}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function meta() {
  return { name: "sub", width: 64, height: 64, fps: 30 };
}

function video(id: string, start: number, duration: number): Clip {
  return {
    kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration,
  } as unknown as Clip;
}

/** subSpec có 1 lá video [0,10) → nestedSourceDuration = 10. */
function subSpec10(): VideoSpec {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: [{ id: "v1", kind: "video", clips: [video("L", 0, 10)] }],
  } as unknown as VideoSpec;
}

function nested(
  id: string,
  start: number,
  duration: number,
  extra?: Record<string, unknown>,
): NestedClip {
  return {
    kind: "nested", id, start, duration, subSpec: subSpec10(),
    ...(extra ?? {}),
  } as unknown as NestedClip;
}

function idGen(): () => string {
  let n = 0;
  return () => `new${++n}`;
}

const CURVE_1_TO_2: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

const CURVE_3PT: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 1.5, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

const CURVE_CONST_2: SpeedCurve = {
  keyframes: [
    { t: 0, v: 2, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

function curveOf(clip: NestedClip): SpeedCurve {
  const c = (clip as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  assert(c !== undefined, "clip phải mang speedKeyframes");
  return c!;
}

/** Bất biến render §1.3 cho 1 nested mang curve: out − in = ∫₀ᴰ trong 1e-4s. */
function assertCurveInvariant(clip: NestedClip, what: string): void {
  const trim = clip.trim;
  assert(trim !== undefined, `${what}: phải ghi trim tường minh`);
  const consumed = sourcePosAt(curveOf(clip), clip.duration);
  approx(trim!.out - trim!.in, consumed, 1e-4, `${what}: out − in so với ∫`);
}

// ===========================================================================
// (S) Split trên ramp linear 1→2
// ===========================================================================
console.log("== (S) split ramp 1→2 ==");

test("S1: split tại điểm giữa output (t=2): cắt con = 2.5, curve chia 1→1.5 / 1.5→2", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2 });
  const pair = splitNestedClip(top, 2, idGen());
  assert(pair !== null, "phải tách được");
  const [left, right] = pair!;
  eq(left.duration, 2, "left duration");
  eq(left.trim, { in: 0, out: 2.5 }, "left trim");
  eq(right.start, 2, "right start");
  eq(right.duration, 2, "right duration");
  eq(right.trim, { in: 2.5, out: 6 }, "right trim");
  eq(curveOf(left).keyframes, [
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 1.5, easing: "linear" },
  ], "left curve");
  eq(curveOf(right).keyframes, [
    { t: 0, v: 1.5, easing: "linear" },
    { t: 2, v: 2, easing: "linear" },
  ], "right curve");
  assertCurveInvariant(left, "left");
  assertCurveInvariant(right, "right");
  assert(left.subSpec === top.subSpec, "left giữ nguyên tham chiếu subSpec");
  assert(right.subSpec === top.subSpec, "right giữ nguyên tham chiếu subSpec");
  assert(left.id === "n1", "left giữ id gốc");
  assert(right.id !== "n1", "right nhận id mới");
});

test("S2: split tại t=1: cắt con = 1.125, nửa phải ∫ = 4.875", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2 });
  const pair = splitNestedClip(top, 1, idGen());
  assert(pair !== null, "phải tách được");
  const [left, right] = pair!;
  eq(left.trim, { in: 0, out: 1.125 }, "left trim");
  eq(right.trim, { in: 1.125, out: 6 }, "right trim");
  eq(curveOf(left).keyframes, [
    { t: 0, v: 1, easing: "linear" },
    { t: 1, v: 1.25, easing: "linear" },
  ], "left curve");
  eq(curveOf(right).keyframes, [
    { t: 0, v: 1.25, easing: "linear" },
    { t: 3, v: 2, easing: "linear" },
  ], "right curve");
  assertCurveInvariant(left, "left");
  assertCurveInvariant(right, "right");
});

test("S3: split tại t=3: cắt con = 4.125", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2 });
  const pair = splitNestedClip(top, 3, idGen());
  assert(pair !== null, "phải tách được");
  const [left, right] = pair!;
  eq(left.trim, { in: 0, out: 4.125 }, "left trim");
  eq(right.trim, { in: 4.125, out: 6 }, "right trim");
  assertCurveInvariant(left, "left");
  assertCurveInvariant(right, "right");
});

test("S4: split ramp 3 điểm tại t=3: cắt con = 4.125, điểm gãy trong được giữ", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_3PT });
  const pair = splitNestedClip(top, 3, idGen());
  assert(pair !== null, "phải tách được");
  const [left, right] = pair!;
  eq(left.trim, { in: 0, out: 4.125 }, "left trim");
  eq(curveOf(left).keyframes, [
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 1.5, easing: "linear" },
    { t: 3, v: 1.75, easing: "linear" },
  ], "left curve");
  eq(curveOf(right).keyframes, [
    { t: 0, v: 1.75, easing: "linear" },
    { t: 1, v: 2, easing: "linear" },
  ], "right curve");
  assertCurveInvariant(left, "left");
  assertCurveInvariant(right, "right");
});

test("S5: split nested có trim.in ≠ 0: cắt con cộng đúng in", () => {
  // start 10, D 4, trim [2,8): split tại 12 (leftDur 2) → cắt con 2 + 2.5 = 4.5.
  const top = nested("n1", 10, 4, { trim: { in: 2, out: 8 }, speedKeyframes: CURVE_1_TO_2 });
  const pair = splitNestedClip(top, 12, idGen());
  assert(pair !== null, "phải tách được");
  const [left, right] = pair!;
  eq(left.trim, { in: 2, out: 4.5 }, "left trim");
  eq(right.trim, { in: 4.5, out: 8 }, "right trim");
  assertCurveInvariant(left, "left");
  assertCurveInvariant(right, "right");
});

// ===========================================================================
// (T) Trim trên ramp
// ===========================================================================
console.log("== (T) trim ramp ==");

test("T1: trim trái cắt đầu (start 0→2): newIn = 2.5, curve 1.5→2", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2 });
  const out = trimNestedClip(top, "left", 2);
  assert(out !== null, "phải trim được");
  eq(out!.start, 2, "start");
  eq(out!.duration, 2, "duration");
  eq(out!.trim, { in: 2.5, out: 6 }, "trim");
  eq(curveOf(out!).keyframes, [
    { t: 0, v: 1.5, easing: "linear" },
    { t: 2, v: 2, easing: "linear" },
  ], "curve");
  assertCurveInvariant(out!, "trim trái cắt");
});

test("T2: trim trái mở rộng (start 2→1, in 2→1): đoạn đầu hằng s(0)=1", () => {
  const top = nested("n1", 2, 4, { trim: { in: 2, out: 8 }, speedKeyframes: CURVE_1_TO_2 });
  const out = trimNestedClip(top, "left", 1);
  assert(out !== null, "phải trim được");
  eq(out!.start, 1, "start");
  eq(out!.duration, 5, "duration");
  eq(out!.trim, { in: 1, out: 8 }, "trim");
  eq(curveOf(out!).keyframes, [
    { t: 0, v: 1, easing: "linear" },
    { t: 1, v: 1, easing: "linear" },
    { t: 5, v: 2, easing: "linear" },
  ], "curve mở rộng");
  // Tốc độ tại output 3 (= gốc 2) vẫn 1.5; bất biến ∫ = 7 = 8 − 1.
  approx(speedAt(curveOf(out!), 3), 1.5, 1e-9, "speedAt(3)");
  assertCurveInvariant(out!, "trim trái mở rộng");
});

test("T3: trim phải thu ngắn (duration 4→2): newOut = 2.5, curve giữ điểm biên 1.5", () => {
  // Đây là case trimSpeedKeyframes làm sai (mất điểm biên → ∫ = 2):
  // slice phải cho curve 1→1.5 và newOut = 2.5.
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2 });
  const out = trimNestedClip(top, "right", 2);
  assert(out !== null, "phải trim được");
  eq(out!.duration, 2, "duration");
  eq(out!.trim, { in: 0, out: 2.5 }, "trim");
  eq(curveOf(out!).keyframes, [
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 1.5, easing: "linear" },
  ], "curve");
  assertCurveInvariant(out!, "trim phải thu ngắn");
});

test("T4: trim phải kéo dài (duration 4→6): đoạn đuôi hằng s(D)=2, newOut = 10", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2 });
  const out = trimNestedClip(top, "right", 6);
  assert(out !== null, "phải trim được");
  eq(out!.duration, 6, "duration");
  eq(out!.trim, { in: 0, out: 10 }, "trim");
  eq(curveOf(out!).keyframes, [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
    { t: 6, v: 2, easing: "linear" },
  ], "curve kéo dài");
  assertCurveInvariant(out!, "trim phải kéo dài");
});

test("T5: trim phải vượt nguồn (newOut 12 > 10) → null; trim trái mở rộng quá in=0 → null", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2 });
  eq(trimNestedClip(top, "right", 7), null, "kéo dài quá nguồn");
  const topIn1 = nested("n1", 2, 4, { trim: { in: 1, out: 7 }, speedKeyframes: CURVE_1_TO_2 });
  eq(trimNestedClip(topIn1, "left", 0), null, "mở rộng trái quá đầu nguồn");
  eq(trimNestedClip(top, "right", 0.1), null, "duration < 0.2");
});

// ===========================================================================
// (C) Curve hằng: hồi quy về hành vi tuyến tính cũ
// ===========================================================================
console.log("== (C) curve hằng ==");

test("C1: split curve hằng v=2 trùng phép tuyến tính cũ với speed=2", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 8 }, speedKeyframes: CURVE_CONST_2 });
  const pair = splitNestedClip(top, 1, idGen());
  assert(pair !== null, "phải tách được");
  const [left, right] = pair!;
  eq(left.trim, { in: 0, out: 2 }, "left trim");
  eq(right.trim, { in: 2, out: 8 }, "right trim");
  eq(curveOf(left).keyframes, [
    { t: 0, v: 2, easing: "linear" },
    { t: 1, v: 2, easing: "linear" },
  ], "left curve");
  eq(curveOf(right).keyframes, [
    { t: 0, v: 2, easing: "linear" },
    { t: 3, v: 2, easing: "linear" },
  ], "right curve");
  assertCurveInvariant(left, "left hằng");
  assertCurveInvariant(right, "right hằng");
});

test("C2: trim curve hằng: trái cắt 1s → newIn=2; phải thu về 2s → newOut=4", () => {
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 8 }, speedKeyframes: CURVE_CONST_2 });
  const leftTrimmed = trimNestedClip(top, "left", 1);
  assert(leftTrimmed !== null, "trim trái phải được");
  eq(leftTrimmed!.trim, { in: 2, out: 8 }, "trim trái");
  assertCurveInvariant(leftTrimmed!, "trim trái hằng");
  const rightTrimmed = trimNestedClip(top, "right", 2);
  assert(rightTrimmed !== null, "trim phải phải được");
  eq(rightTrimmed!.trim, { in: 0, out: 4 }, "trim phải");
  assertCurveInvariant(rightTrimmed!, "trim phải hằng");
});

test("C3: field speed hằng ghi khác v vẫn lấy curve (render §1.5: curve thắng)", () => {
  const top = nested("n1", 0, 4, {
    speed: 1, trim: { in: 0, out: 8 }, speedKeyframes: CURVE_CONST_2,
  });
  const pair = splitNestedClip(top, 1, idGen());
  assert(pair !== null, "phải tách được");
  eq(pair![0].trim, { in: 0, out: 2 }, "cắt con theo curve v=2, không theo speed=1");
});

test("C4: curve 1 keyframe (hằng v=2): split tại 2 → cắt con 4", () => {
  const single: SpeedCurve = { keyframes: [{ t: 0, v: 2, easing: "linear" }] };
  const top = nested("n1", 0, 4, { trim: { in: 0, out: 8 }, speedKeyframes: single });
  const pair = splitNestedClip(top, 2, idGen());
  assert(pair !== null, "phải tách được");
  eq(pair![0].trim, { in: 0, out: 4 }, "left trim");
  eq(pair![1].trim, { in: 4, out: 8 }, "right trim");
  assertCurveInvariant(pair![0], "left 1 điểm");
  assertCurveInvariant(pair![1], "right 1 điểm");
});

// ===========================================================================
// (R) Fail-fast còn giữ: reverse, curve rỗng, cửa sổ gốc lệch, không ghi trim
// ===========================================================================
console.log("== (R) fail-fast + không ghi trim ==");

test("R1: reverse vẫn bị từ chối dù có hay không có curve", () => {
  const withCurve = nested("n1", 0, 4, {
    trim: { in: 0, out: 6 }, speedKeyframes: CURVE_1_TO_2, reverse: true,
  });
  eq(splitNestedClip(withCurve, 2, idGen()), null, "split reverse+curve");
  eq(trimNestedClip(withCurve, "left", 1), null, "trim trái reverse+curve");
  eq(trimNestedClip(withCurve, "right", 2), null, "trim phải reverse+curve");
  const noCurve = nested("n1", 0, 4, { trim: { in: 0, out: 4 }, reverse: true });
  eq(splitNestedClip(noCurve, 2, idGen()), null, "split reverse không curve");
  eq(trimNestedClip(noCurve, "right", 2), null, "trim reverse không curve");
});

test("R2: curve rỗng và cửa sổ gốc lệch tích phân > 1e-4s → null (không đoán)", () => {
  const empty = nested("n1", 0, 4, { trim: { in: 0, out: 4 }, speedKeyframes: { keyframes: [] } });
  eq(splitNestedClip(empty, 2, idGen()), null, "split curve rỗng");
  eq(trimNestedClip(empty, "right", 2), null, "trim curve rỗng");
  // ∫₀⁴ = 6 nhưng trim ghi out = 5 → lệch 1s, render cũng fail §1.3.
  const broken = nested("n1", 0, 4, { trim: { in: 0, out: 5 }, speedKeyframes: CURVE_1_TO_2 });
  eq(splitNestedClip(broken, 2, idGen()), null, "split cửa sổ lệch");
  eq(trimNestedClip(broken, "right", 2), null, "trim cửa sổ lệch");
});

test("R3: không ghi trim: cửa sổ hiệu dụng là [0, ∫) = [0,6), không phải nguồn 10", () => {
  const top = nested("n1", 0, 4, { speedKeyframes: CURVE_1_TO_2 });
  const pair = splitNestedClip(top, 2, idGen());
  assert(pair !== null, "phải tách được");
  eq(pair![0].trim, { in: 0, out: 2.5 }, "left trim");
  eq(pair![1].trim, { in: 2.5, out: 6 }, "right trim (không phải 10)");
  assertCurveInvariant(pair![0], "left không trim");
  assertCurveInvariant(pair![1], "right không trim");
  const trimmed = trimNestedClip(top, "right", 2);
  assert(trimmed !== null, "trim phải phải được");
  eq(trimmed!.trim, { in: 0, out: 2.5 }, "trim phải không trim gốc");
});

test("R4: hồi quy không curve: split/trim tuyến tính cũ không đổi", () => {
  const top = nested("n1", 0, 2, { speed: 2, trim: { in: 0, out: 4 } });
  const pair = splitNestedClip(top, 1, idGen());
  assert(pair !== null, "phải tách được");
  eq(pair![0].trim, { in: 0, out: 2 }, "left trim tuyến tính");
  eq(pair![1].trim, { in: 2, out: 4 }, "right trim tuyến tính");
  const leftTrimmed = trimNestedClip(top, "left", 0.5);
  assert(leftTrimmed !== null, "trim trái phải được");
  eq(leftTrimmed!.trim, { in: 1, out: 4 }, "trim trái tuyến tính");
  const rightTrimmed = trimNestedClip(top, "right", 1);
  assert(rightTrimmed !== null, "trim phải phải được");
  eq(rightTrimmed!.trim, { in: 0, out: 2 }, "trim phải tuyến tính");
  eq(splitNestedClip(top, 0, idGen()), null, "t = start");
  eq(splitNestedClip(top, 2, idGen()), null, "t = end");
});

console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
