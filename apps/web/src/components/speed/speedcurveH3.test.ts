/**
 * speedcurveH3.test.ts — Test thật cho Phase 9 đợt 16 (luồng H3):
 * curveDropped lên timeline chính + patchClip, bezier suy biến fallback,
 * và ease-in phải / ease-out trái khi cắt curve nay đúng hệt (đóng nợ
 * đợt 15 T4: trước đó 2 phía này chỉ gần đúng trong chặn 0.125 × |Δv|).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/speed/speedcurveH3.test.ts
 *
 * Chỉ test logic thuần (không DOM/store): phần nối store (patchClip trả
 * về + toast số keyframe bị cắt) được kiểm chứng bằng tsc + vite build
 * và test store bundle của T4 (splitPatch.store.test.ts), theo đúng mẫu
 * các đợt trước. Ngưỡng bezier 1e-4: engine cubicBezierY dừng
 * Newton/bisection ở sai số x 1e-6 nên với bezier nâng bậc (độ dốc y
 * tới ~2) giá trị y lệch ~1e-6 ngay cả khi slice đúng hệt về mặt toán
 * học — ngưỡng này là ngưỡng của engine, không phải của slice.
 */
import {
  sliceSpeedKeyframes,
  speedAt,
  splitSpeedKeyframes,
  type SpeedKeyframe,
} from "../../../../../packages/video-spec/src/speedcurve.ts";
import {
  sliceSpeedKeyframes as sliceSpeedKeyframesJs,
  splitSpeedKeyframes as splitSpeedKeyframesJs,
} from "../../../../../packages/video-spec/src/speedcurve.js";

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

const kf = (t: number, v: number, easing: SpeedKeyframe["easing"], bezier?: [number, number, number, number]): SpeedKeyframe =>
  bezier ? { t, v, easing, bezier } : { t, v, easing };

/** Sai số đánh giá lớn nhất của curve cắt so với gốc trên đoạn [from, to). */
function maxEvalErr(orig: SpeedKeyframe[], sliced: SpeedKeyframe[], from: number, to: number): number {
  let m = 0;
  for (let i = 0; i <= 200; i++) {
    const t = from + (to - from) * (i / 200);
    const e = Math.abs(speedAt({ keyframes: orig }, t) - speedAt({ keyframes: sliced }, t - from));
    if (e > m) m = e;
  }
  return m;
}

// --- (1) Ease-in phải / ease-out trái nay đúng hệt (đóng nợ T4) ---

test("split ease-in: phải nay đúng hệt nhờ bezier nâng bậc (H3)", () => {
  const orig = [kf(0, 1, "ease-in"), kf(4, 3, "linear")];
  const sp = splitSpeedKeyframes(orig, 1.7, 4);
  approx(maxEvalErr(orig, sp.left, 0, 1.7), 0, 1e-9, "nửa trái ease-in");
  // Trước H3: sai tới 0.2444 (sát chặn 0.125 × |Δv| = 0.25). Nay đúng hệt.
  approx(maxEvalErr(orig, sp.right, 1.7, 4), 0, 1e-4, "nửa phải ease-in");
  // Điểm đầu nửa phải mang bezier nâng bậc, x1/x2 trong [0, 1] nên
  // validator render chấp nhận (không phải bezier overshoot).
  assert(sp.right[0].easing === "bezier", `điểm đầu nửa phải phải là bezier, nhận ${sp.right[0].easing}`);
  assert(
    sp.right[0].bezier !== undefined &&
      sp.right[0].bezier[0] >= 0 && sp.right[0].bezier[0] <= 1 &&
      sp.right[0].bezier[2] >= 0 && sp.right[0].bezier[2] <= 1,
    `bezier nâng bậc có x ngoài [0, 1]: ${JSON.stringify(sp.right[0].bezier)}`,
  );
});

test("split ease-out: trái nay đúng hệt nhờ bezier nâng bậc (H3)", () => {
  const orig = [kf(0, 1, "ease-out"), kf(4, 3, "linear")];
  const sp = splitSpeedKeyframes(orig, 1.7, 4);
  // Trước H3: sai tới 0.2444. Nay đúng hệt.
  approx(maxEvalErr(orig, sp.left, 0, 1.7), 0, 1e-4, "nửa trái ease-out");
  approx(maxEvalErr(orig, sp.right, 1.7, 4), 0, 1e-9, "nửa phải ease-out");
  assert(sp.left[0].easing === "bezier", `điểm đầu nửa trái phải là bezier, nhận ${sp.left[0].easing}`);
});

test("slice trong cùng một đoạn ease-in: đúng hệt", () => {
  const orig = [kf(0, 1, "ease-in"), kf(4, 3, "linear")];
  const sl = sliceSpeedKeyframes(orig, 1, 2.5);
  approx(maxEvalErr(orig, sl.keyframes, 1, 2.5), 0, 1e-4, "slice ease-in giữa đoạn");
});

test("slice trong cùng một đoạn ease-out: đúng hệt", () => {
  const orig = [kf(0, 1, "ease-out"), kf(4, 3, "linear")];
  const sl = sliceSpeedKeyframes(orig, 1, 2.5);
  approx(maxEvalErr(orig, sl.keyframes, 1, 2.5), 0, 1e-4, "slice ease-out giữa đoạn");
});

test("slice ease-out kéo dài tới cuối đoạn: giữ easing cũ, không đổi nhãn thừa", () => {
  const orig = [kf(0, 1, "ease-out"), kf(4, 3, "linear")];
  const sl = sliceSpeedKeyframes(orig, 1, 4);
  approx(maxEvalErr(orig, sl.keyframes, 1, 4), 0, 1e-9, "slice ease-out tới cuối đoạn");
  assert(sl.keyframes[0].easing === "ease-out", `phải giữ ease-out, nhận ${sl.keyframes[0].easing}`);
});

test("đoạn phẳng ease-in (|Δv| = 0): giữ easing cũ", () => {
  const orig = [kf(0, 2, "ease-in"), kf(4, 2, "linear")];
  const sl = sliceSpeedKeyframes(orig, 1, 3);
  assert(sl.keyframes[0].easing === "ease-in", `phải giữ ease-in, nhận ${sl.keyframes[0].easing}`);
  approx(maxEvalErr(orig, sl.keyframes, 1, 3), 0, 1e-9, "đoạn phẳng");
});

// --- (2) Bezier suy biến fallback: test riêng (nợ R5/T4) ---

test("bezier suy biến ở đầu slice: fallback giữ bezier gốc, không crash", () => {
  // Bezier x1 = x2 = 0 (x(s) = s³): lát cắt hẹp 2e-12 quanh t = 2 cho
  // đoạn con có bề rộng x ≈ 5e-13 < 1e-12 nên subdivide trả null.
  const orig = [kf(0, 1, "bezier", [0, 0, 0, 1]), kf(4, 3, "linear")];
  const sl = sliceSpeedKeyframes(orig, 2, 2 + 2e-12);
  assert(sl.keyframes.length > 0, "slice suy biến không được rỗng");
  eq(sl.keyframes[0].bezier, [0, 0, 0, 1], "fallback phải giữ bezier gốc");
  assert(sl.keyframes[0].easing === "bezier", "fallback phải giữ easing bezier");
  assert(Number.isFinite(speedAt({ keyframes: sl.keyframes }, 0)), "đánh giá sau fallback phải hữu hạn");
});

test("bezier suy biến ở cuối slice: fallback giữ bezier gốc", () => {
  // Lát cắt [0.5, 2 + 1e-12): đoạn cuối [2, 4] là bezier x(s) = s³, lát
  // con cuối có bề rộng x ≈ 5e-13 < 1e-12 nên subdivide trả null; điểm
  // bắt đầu đoạn cuối trong kết quả (t = 1.5) phải giữ bezier gốc.
  const orig = [kf(0, 1, "linear"), kf(2, 2, "bezier", [0, 0, 0, 1]), kf(4, 3, "linear")];
  const sl = sliceSpeedKeyframes(orig, 0.5, 2 + 1e-12);
  const pt = sl.keyframes.find((k) => Math.abs(k.t - 1.5) <= 1e-9);
  assert(pt !== undefined, "phải có điểm bắt đầu đoạn cuối");
  eq(pt.bezier, [0, 0, 0, 1], "fallback cuối slice phải giữ bezier gốc");
  assert(pt.easing === "bezier", "fallback cuối slice phải giữ easing bezier");
});

// --- (3) Split không làm rơi keyframe (nên split không cần cảnh báo) ---

test("split không rơi keyframe: hợp 2 nửa phủ đủ keyframe gốc", () => {
  const orig = [
    kf(0, 1, "ease-in"),
    kf(1, 1.5, "linear"),
    kf(2.3, 2, "ease-out"),
    kf(3, 2.5, "bezier", [0.25, 0.1, 0.25, 1]),
    kf(4, 3, "linear"),
  ];
  const splitT = 2.3;
  const sp = splitSpeedKeyframes(orig, splitT, 4);
  const has = (list: SpeedKeyframe[], t: number, v: number) =>
    list.some((k) => Math.abs(k.t - t) <= 1e-9 && Math.abs(k.v - v) <= 1e-9);
  for (const k of orig) {
    if (k.t < splitT - 1e-9) {
      assert(has(sp.left, k.t, k.v), `keyframe t=${k.t} phải còn ở nửa trái`);
    } else if (k.t > splitT + 1e-9) {
      assert(has(sp.right, k.t - splitT, k.v), `keyframe t=${k.t} phải còn ở nửa phải`);
    } else {
      assert(has(sp.left, k.t, k.v) && has(sp.right, 0, k.v), `keyframe tại điểm cắt t=${k.t} phải thuộc cả 2 nửa`);
    }
  }
});

// --- (4) patchClip: dropped đếm đúng keyframe vượt duration mới ---

test("slice patchClip [0, newDur): dropped = số keyframe vượt duration mới", () => {
  const orig = [kf(0, 1, "linear"), kf(2, 2, "linear"), kf(4, 3, "linear")];
  const sl = sliceSpeedKeyframes(orig, 0, 2.5);
  eq(sl.dropped, 1, "chỉ keyframe t=4 bị cắt");
  eq(sl.keyframes[sl.keyframes.length - 1], { t: 2.5, v: 2.25, easing: "linear" }, "điểm biên chèn tại newDur");
});

// --- (5) Parity .ts ↔ .js cho các trường hợp H3 ---

test("parity .ts ↔ .js cho slice/split ease-in/ease-out (H3)", () => {
  const ei = [kf(0, 1, "ease-in"), kf(4, 3, "linear")];
  const eo = [kf(0, 1, "ease-out"), kf(4, 3, "linear")];
  eq(sliceSpeedKeyframes(ei, 1.7, 4), sliceSpeedKeyframesJs(ei, 1.7, 4), "slice ease-in");
  eq(sliceSpeedKeyframes(eo, 0, 1.7), sliceSpeedKeyframesJs(eo, 0, 1.7), "slice ease-out");
  eq(splitSpeedKeyframes(ei, 1.7, 4), splitSpeedKeyframesJs(ei, 1.7, 4), "split ease-in");
  eq(splitSpeedKeyframes(eo, 1.7, 4), splitSpeedKeyframesJs(eo, 1.7, 4), "split ease-out");
  const bz = [kf(0, 1, "bezier", [0, 0, 0, 1]), kf(4, 3, "linear")];
  eq(sliceSpeedKeyframes(bz, 2, 2 + 2e-12), sliceSpeedKeyframesJs(bz, 2, 2 + 2e-12), "slice bezier suy biến");
});

console.log(`\nspeedcurveH3: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
