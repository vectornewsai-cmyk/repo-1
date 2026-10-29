/**
 * motion.test.ts — Test thật cho logic thuần của panel slow-mo / motion blur
 * (Phase 9 đợt 8, S5-UI).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/motion/motion.test.ts
 *
 * Chỉ test logic thuần trong motion.ts (không DOM, không store), theo mẫu
 * harness của nestUtils.test.ts (không dùng node:test để tsc của app không
 * đòi @types/node).
 */
import {
  MOTION_BLUR_DEFAULT_FRAMES,
  MOTION_BLUR_FRAMES_MAX,
  MOTION_BLUR_FRAMES_MIN,
  equalWeights,
  estimateInterpCost,
  estimateInterpOutputFrames,
  hasClipTransition,
  isFpsMismatch,
  isStabilizeInterpConflict,
  isTargetFpsDisabled,
  isTransitionFpsBlocked,
  normalizeWeights,
  resolveMotion,
  withBlurFrames,
  withBlurWeight,
  withInterpolation,
  withMiMode,
  withMotionBlur,
  withTargetFps,
  type ClipMotion,
} from "./motion.ts";

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

function eq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg} — nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

function approx(a: number, b: number, msg: string): void {
  if (Math.abs(a - b) > 1e-9) throw new Error(`${msg} — nhận ${a}, muốn ${b}`);
}

test("equalWeights: chia đều, tổng = 1", () => {
  const w = equalWeights(4);
  eq(w.length, 4, "độ dài");
  for (const v of w) approx(v, 0.25, "mỗi trọng số");
  approx(w.reduce((a, b) => a + b, 0), 1, "tổng");
  eq(equalWeights(0).length, 0, "frames 0 -> rỗng");
});

test("isTargetFpsDisabled: disable khi chưa có motion hoặc interpolation none", () => {
  assert(isTargetFpsDisabled(undefined), "chưa có motion phải disable");
  assert(
    isTargetFpsDisabled({ interpolation: "none", targetFps: 30, miMode: "mci" }),
    "interpolation none phải disable",
  );
  assert(
    !isTargetFpsDisabled({ interpolation: "minterpolate", targetFps: 60, miMode: "mci" }),
    "interpolation bật phải enable",
  );
});

test("withTargetFps khi interpolation none là no-op (không tự bật nội suy)", () => {
  // Input lệch S1 (none mà kèm targetFps/miMode) được resolveMotion gỡ
  // hai key đó trước — kết quả vẫn none và không tự bật nội suy.
  const m: ClipMotion = { interpolation: "none", targetFps: 30, miMode: "mci" };
  const next = withTargetFps(m, 60);
  eq(next?.interpolation, "none", "vẫn none");
  assert(next?.targetFps === undefined, "targetFps lệch S1 đã bị gỡ, không đổi thành 60");
  assert(withTargetFps(undefined, 60) === undefined, "chưa có motion -> undefined");
});

test("withInterpolation bật: giữ blur cũ, mặc định targetFps 30 + miMode mci", () => {
  const next = withInterpolation(undefined, "minterpolate");
  assert(next !== undefined, "phải tạo motion");
  eq(next!.interpolation, "minterpolate", "interpolation");
  eq(next!.targetFps, 30, "targetFps mặc định");
  eq(next!.miMode, "mci", "miMode mặc định");
  assert(next!.motionBlur === undefined, "chưa có blur");
});

test("withInterpolation tắt: còn blur thì giữ motion, hết blur thì gỡ hẳn", () => {
  const withBlur: ClipMotion = {
    interpolation: "minterpolate", targetFps: 60, miMode: "blend",
    motionBlur: { frames: 4, weights: equalWeights(4) },
  };
  const kept = withInterpolation(withBlur, "none");
  assert(kept !== undefined, "còn blur phải giữ motion");
  eq(kept!.interpolation, "none", "interpolation về none");
  assert(kept!.motionBlur !== undefined, "blur còn nguyên");
  const gone = withInterpolation(
    { interpolation: "minterpolate", targetFps: 30, miMode: "mci" }, "none",
  );
  assert(gone === undefined, "không còn gì phải gỡ hẳn motion");
});

test("withMotionBlur bật: tạo motion nền interpolation none + frames clamp 2..8", () => {
  const m = withMotionBlur(undefined, true, 4);
  assert(m !== undefined, "phải tạo motion");
  eq(m!.interpolation, "none", "blur riêng không bật nội suy");
  eq(m!.motionBlur!.frames, 4, "frames");
  assert(m!.targetFps === undefined, "blur riêng KHÔNG kèm targetFps (S1 cấm khi none)");
  assert(m!.miMode === undefined, "blur riêng KHÔNG kèm miMode (S1 cấm khi none)");
  const def = withMotionBlur(undefined, true);
  eq(def!.motionBlur!.frames, MOTION_BLUR_DEFAULT_FRAMES, "mặc định frames theo S1");
  const lo = withMotionBlur(undefined, true, 1);
  eq(lo!.motionBlur!.frames, MOTION_BLUR_FRAMES_MIN, "frames < 2 clamp về min");
  const hi = withMotionBlur(undefined, true, 99);
  eq(hi!.motionBlur!.frames, MOTION_BLUR_FRAMES_MAX, "frames > 8 clamp về max");
});

test("withMotionBlur tắt: còn nội suy thì giữ, hết thì gỡ", () => {
  const both: ClipMotion = {
    interpolation: "minterpolate", targetFps: 30, miMode: "mci",
    motionBlur: { frames: 4, weights: equalWeights(4) },
  };
  const kept = withMotionBlur(both, false);
  assert(kept !== undefined, "còn nội suy phải giữ motion");
  eq(kept!.interpolation, "minterpolate", "nội suy còn nguyên");
  assert(kept!.motionBlur === undefined, "blur đã gỡ");
  const onlyBlur: ClipMotion = {
    interpolation: "none", targetFps: 30, miMode: "mci",
    motionBlur: { frames: 4, weights: equalWeights(4) },
  };
  assert(withMotionBlur(onlyBlur, false) === undefined, "chỉ có blur -> tắt là gỡ hẳn");
});

test("withBlurFrames: chia đều lại weights theo frames mới, clamp 2..8", () => {
  const m: ClipMotion = {
    interpolation: "none", targetFps: 30, miMode: "mci",
    motionBlur: { frames: 4, weights: equalWeights(4) },
  };
  const next = withBlurFrames(m, 8);
  eq(next!.motionBlur!.frames, 8, "frames mới");
  eq(next!.motionBlur!.weights.length, 8, "weights dài theo frames");
  approx(next!.motionBlur!.weights[0], 0.125, "weights đều lại");
  const clamped = withBlurFrames(m, 1);
  eq(clamped!.motionBlur!.frames, MOTION_BLUR_FRAMES_MIN, "clamp min");
  assert(withBlurFrames(undefined, 6) === undefined, "không có motion -> undefined");
});

test("resolveMotion: targetFps lạ về 30, weights lệch chuẩn hoá đều lại", () => {
  const weird = resolveMotion({
    interpolation: "minterpolate",
    targetFps: 999 as never,
    miMode: "la" as never,
    motionBlur: { frames: 3, weights: [0.5, 0.5] },
  });
  assert(weird !== undefined, "phải chuẩn hoá được");
  eq(weird!.targetFps, 30, "targetFps ngoài [1,120] -> 30");
  eq(weird!.miMode, "mci", "miMode lạ -> mci");
  eq(weird!.motionBlur!.weights.length, 3, "weights dài theo frames");
  approx(weird!.motionBlur!.weights[0], 1 / 3, "weights chuẩn hoá đều");
  assert(resolveMotion(undefined) === undefined, "undefined -> undefined");
});

/* ---- Đợt 9 M3: weights tuỳ chỉnh, miMode, cảnh báo, ước lượng ---- */

test("normalizeWeights: tỉ lệ giữ nguyên, tổng = 1, âm/NaN về 0, toàn 0 chia đều", () => {
  const w = normalizeWeights([2, 1, 1]);
  eq(w.length, 3, "độ dài");
  approx(w[0], 0.5, "tỉ lệ 2/4");
  approx(w[1], 0.25, "tỉ lệ 1/4");
  approx(w.reduce((a, b) => a + b, 0), 1, "tổng");
  const neg = normalizeWeights([-1, 3, NaN]);
  approx(neg[0], 0, "âm về 0");
  approx(neg[1], 1, "chỉ còn một giá trị dương");
  approx(neg[2], 0, "NaN về 0");
  const zero = normalizeWeights([0, 0, 0]);
  approx(zero[0], 1 / 3, "toàn 0 chia đều");
  eq(normalizeWeights([]).length, 0, "rỗng -> rỗng");
});

test("withBlurWeight: đổi 1 trọng số rồi chuẩn hoá tổng = 1, giữ frames, mọi trọng số > 0", () => {
  const m: ClipMotion = {
    interpolation: "none",
    motionBlur: { frames: 4, weights: equalWeights(4) },
  };
  const next = withBlurWeight(m, 0, 0.7);
  assert(next?.motionBlur !== undefined, "còn blur");
  eq(next!.motionBlur!.frames, 4, "frames giữ nguyên");
  eq(next!.motionBlur!.weights.length, 4, "weights dài theo frames");
  approx(next!.motionBlur!.weights.reduce((a, b) => a + b, 0), 1, "tổng = 1");
  // 0.7 giữ tỉ lệ lớn nhất sau chuẩn hoá (0.7 / 1.45 ≈ 0.483).
  assert(next!.motionBlur!.weights[0] > next!.motionBlur!.weights[1], "frame 0 nặng nhất");
  for (const w of next!.motionBlur!.weights) assert(w > 0, "mọi trọng số > 0 (luật render S2)");
  // Slider UI không bao giờ gửi 0 (min 1%) nên path UI luôn > 0:
  const ui = withBlurWeight(m, 1, 0.01);
  for (const w of ui!.motionBlur!.weights) assert(w > 0, "path slider 1% vẫn > 0");
  assert(withBlurWeight(m, 9, 0.5)?.motionBlur?.weights[0] === 0.25, "index ngoài mảng -> nguyên base");
  assert(withBlurWeight(undefined, 0, 0.5) === undefined, "không có motion -> undefined");
  assert(withBlurWeight({ interpolation: "none" }, 0, 0.5)?.motionBlur === undefined, "không có blur -> nguyên base");
});

test("withBlurWeight + withBlurFrames: đổi frames chia đều lại (mất weights tuỳ chỉnh)", () => {
  const m: ClipMotion = {
    interpolation: "none",
    motionBlur: { frames: 4, weights: [0.7, 0.1, 0.1, 0.1] },
  };
  const reset = withBlurFrames(m, 4);
  approx(reset!.motionBlur!.weights[0], 0.25, "đổi frames (kể cả cùng số) chia đều lại");
});

test("withMiMode: đổi mci/blend khi nội suy bật, no-op khi none, lạ về mci", () => {
  const on: ClipMotion = { interpolation: "minterpolate", targetFps: 60, miMode: "mci" };
  eq(withMiMode(on, "blend")?.miMode, "blend", "đổi sang blend");
  eq(withMiMode(on, "mci")?.miMode, "mci", "đổi về mci");
  eq(withMiMode(on, "dup" as never)?.miMode, "mci", "giá trị lạ về mặc định mci");
  const off: ClipMotion = { interpolation: "none" };
  assert(withMiMode(off, "blend")?.miMode === undefined, "none là no-op, không kèm miMode (S1 cấm)");
  assert(withMiMode(undefined, "blend") === undefined, "không có motion -> undefined");
});

test("hasClipTransition: chỉ type khác none mới tính là transition", () => {
  assert(!hasClipTransition(undefined, undefined), "không có field -> false");
  assert(!hasClipTransition({ type: "none" }, { type: "none" }), "none/none -> false");
  assert(hasClipTransition({ type: "fade" }, undefined), "transitionIn fade -> true");
  assert(hasClipTransition(undefined, { type: "slide" }), "transitionOut slide -> true");
  assert(!hasClipTransition({ type: undefined }, undefined), "type vắng -> false");
});

test("isFpsMismatch / isTransitionFpsBlocked: chỉ combo transition + lệch fps mới chặn render", () => {
  const on60: ClipMotion = { interpolation: "minterpolate", targetFps: 60, miMode: "mci" };
  const on30: ClipMotion = { interpolation: "minterpolate", targetFps: 30, miMode: "mci" };
  const noTarget: ClipMotion = { interpolation: "minterpolate", miMode: "mci" };
  assert(isFpsMismatch(on60, 30), "60 vs project 30 -> lệch");
  assert(!isFpsMismatch(on30, 30), "bằng project fps -> không lệch");
  assert(!isFpsMismatch(on60, undefined), "thiếu project fps -> không kết luận lệch");
  assert(!isFpsMismatch(noTarget, 30), "targetFps vắng (render mặc định project fps) -> không lệch");
  assert(!isFpsMismatch({ interpolation: "none" }, 30), "nội suy tắt -> không lệch");
  assert(isTransitionFpsBlocked(on60, true, 30), "combo transition + lệch -> CHẶN");
  assert(!isTransitionFpsBlocked(on60, false, 30), "lệch nhưng không transition -> KHÔNG chặn (chỉ resample)");
  assert(!isTransitionFpsBlocked(on30, true, 30), "transition nhưng fps bằng project -> KHÔNG chặn");
  assert(!isTransitionFpsBlocked(on60, true, undefined), "thiếu project fps -> không chặn");
});

test("isStabilizeInterpConflict: chỉ nội suy bật + stabilize mới cảnh báo", () => {
  const on: ClipMotion = { interpolation: "minterpolate", targetFps: 30, miMode: "mci" };
  assert(isStabilizeInterpConflict(on, true), "cả hai bật -> cảnh báo");
  assert(!isStabilizeInterpConflict(on, false), "không stabilize -> thôi");
  assert(!isStabilizeInterpConflict({ interpolation: "none" }, true), "nội suy tắt -> thôi");
  assert(!isStabilizeInterpConflict(undefined, true), "không có motion -> thôi");
});

test("estimateInterpOutputFrames / estimateInterpCost: ước lượng từ duration × targetFps, ghi rõ chỉ là ước lượng", () => {
  eq(estimateInterpOutputFrames(10, 60), 600, "10s × 60fps");
  eq(estimateInterpOutputFrames(2.5, 30), 75, "2.5s × 30fps");
  eq(estimateInterpOutputFrames(10, undefined), 0, "thiếu targetFps -> 0");
  eq(estimateInterpOutputFrames(-5, 60), 0, "duration âm -> 0");
  const on60: ClipMotion = { interpolation: "minterpolate", targetFps: 60, miMode: "mci" };
  const cost = estimateInterpCost(on60, 10, 30);
  assert(cost !== null, "ước lượng được");
  eq(cost!.outputFrames, 600, "số frame đầu ra");
  approx(cost!.ratioToProjectFps!, 2, "tỉ lệ gấp 2× project fps");
  assert(estimateInterpCost({ interpolation: "none" }, 10, 30) === null, "nội suy tắt -> null");
  assert(estimateInterpCost(on60, 0, 30) === null, "duration 0 -> null");
  const noProj = estimateInterpCost(on60, 10, undefined);
  assert(noProj !== null && noProj.ratioToProjectFps === null, "thiếu project fps -> ratio null, frames vẫn có");
});

test("S1-validity: mọi motion do UI sinh ra đều qua được validateMotion (kiểm tra cấu trúc)", () => {
  // Mô phỏng đúng các luật validateMotion của S1 mà không import spec
  // (test node không resolve được "./motion.js" trong index.ts của spec).
  const assertValid = (m: ClipMotion | undefined, label: string) => {
    if (!m) return;
    const interp = m.interpolation ?? "none";
    if (interp === "none") {
      assert(m.targetFps === undefined, `${label}: none mà kèm targetFps`);
      assert(m.miMode === undefined, `${label}: none mà kèm miMode`);
    } else {
      assert(typeof m.targetFps === "number", `${label}: minterpolate thiếu targetFps`);
      assert(m.targetFps! >= 1 && m.targetFps! <= 120, `${label}: targetFps ngoài [1,120]`);
      assert(m.miMode === "mci" || m.miMode === "blend", `${label}: miMode phải mci/blend`);
    }
    if (m.motionBlur) {
      const f = m.motionBlur.frames!;
      assert(f >= 2 && f <= 8, `${label}: frames ngoài [2,8]`);
      assert(m.motionBlur.weights!.length === f, `${label}: weights lệch frames`);
      assert(m.motionBlur.weights!.reduce((a, b) => a + b, 0) > 0, `${label}: weights tổng <= 0`);
    }
  };
  const cases: Array<ClipMotion | undefined> = [
    withInterpolation(undefined, "minterpolate"),
    withInterpolation({ interpolation: "minterpolate", targetFps: 60, miMode: "blend", motionBlur: { frames: 4, weights: equalWeights(4) } }, "none"),
    withMotionBlur(undefined, true),
    withMotionBlur(undefined, true, 8),
    withBlurFrames({ interpolation: "none", motionBlur: { frames: 4, weights: equalWeights(4) } }, 2),
    withTargetFps({ interpolation: "minterpolate", targetFps: 30, miMode: "mci" }, 60),
    withBlurWeight({ interpolation: "none", motionBlur: { frames: 4, weights: equalWeights(4) } }, 0, 0.7),
    withMiMode({ interpolation: "minterpolate", targetFps: 30, miMode: "mci" }, "blend"),
    resolveMotion({ interpolation: "none", targetFps: 60, miMode: "mci" }),
    resolveMotion({ interpolation: "minterpolate", targetFps: 30, miMode: "dup" as never }),
  ];
  cases.forEach((c, i) => assertValid(c, `case ${i}`));
});

console.log(`\nmotion: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
