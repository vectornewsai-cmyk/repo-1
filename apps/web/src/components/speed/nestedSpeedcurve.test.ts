/**
 * nestedSpeedcurve.test.ts — Test thật cho Phase 9 đợt 14 (luồng R5):
 * trim/split/in-out cho nested + speedcurve (đóng nợ đợt 13 C5).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/speed/nestedSpeedcurve.test.ts
 *
 * Chỉ test logic thuần (không DOM/store — store.ts không import được
 * dưới Node trần vì nó dùng import không đuôi mở rộng mà chỉ Vite mới
 * phân giải được; phần nối store được kiểm chứng bằng tsc + vite build,
 * theo đúng mẫu đợt 13 C5):
 *  (1) splitSpeedKeyframes: 2 nửa giữ curve đúng, không keyframe mồ côi
 *      (mọi t trong khoảng của nửa mình), đúng hệt với linear, bezier
 *      (nhờ chia de Casteljau), ease-in và ease-out cả hai phía (từ đợt
 *      16 H3: phía gần đúng cũ nay dùng bezier nâng bậc từ bậc 2, xem
 *      speedcurve.ts);
 *  (2) sliceSpeedKeyframes + visibleSpeedKeyframes + helper nested:
 *      phần khả kiến của clip lá dưới cửa sổ trim ngoài;
 *  (3) rampTrimLeftIn/rampTrimRightOut/outputDurationForSource: in/out
 *      và chặn cuối file theo tích phân ramp, không theo tốc độ hằng;
 *  (4) updateNestedInnerClip: patch clip con kiểu trim thì dịch/cắt
 *      curve, patch kiểu dời thuần thì giữ nguyên curve;
 *  (5) parity .ts ↔ .js cho mọi hàm mới (mirror là bản app thực chạy).
 *
 * Ngưỡng bezier 1e-4: engine cubicBezierY tự nó dừng Newton/bisection
 * ở sai số x 1e-6 nên với bezier overshoot (độ dốc y lớn) giá trị y đã
 * lệch ~1e-5 ngay cả khi slice đúng hệt về mặt toán học — ngưỡng này là
 * ngưỡng của engine, không phải của slice.
 */
import {
  outputDurationForSource,
  rampTrimLeftIn,
  rampTrimRightOut,
  sliceSpeedKeyframes,
  speedAt,
  splitSpeedKeyframes,
  visibleSpeedKeyframes,
  type SpeedCurve,
  type SpeedKeyframe,
} from "@repo-1/video-spec";
import {
  outputDurationForSource as outputDurationForSourceTs,
  rampTrimLeftIn as rampTrimLeftInTs,
  rampTrimRightOut as rampTrimRightOutTs,
  sliceSpeedKeyframes as sliceSpeedKeyframesTs,
  splitSpeedKeyframes as splitSpeedKeyframesTs,
  visibleSpeedKeyframes as visibleSpeedKeyframesTs,
} from "../../../../../packages/video-spec/src/speedcurve.ts";
import {
  leafVisibleSpeedCurveForWindow,
  nestedLeafVisibleSpeedCurve,
  updateNestedInnerClip,
} from "../nested/nestUtils.ts";
import type { Clip, NestedClip, Track, VideoSpec } from "@repo-1/video-spec";

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

function assertInRange(kfs: SpeedKeyframe[], dur: number, what: string): void {
  for (const k of kfs) {
    assert(k.t >= -1e-9 && k.t <= dur + 1e-9, `${what}: keyframe t=${k.t} ngoài [0, ${dur}] (mồ côi)`);
  }
}

// --- (1) Split ---

test("split linear: 2 nửa đúng hệt, không mồ côi", () => {
  const orig = [kf(0, 1, "linear"), kf(4, 2, "linear")];
  const sp = splitSpeedKeyframes(orig, 2, 4);
  assertInRange(sp.left, 2, "nửa trái");
  assertInRange(sp.right, 2, "nửa phải");
  approx(maxEvalErr(orig, sp.left, 0, 2), 0, 1e-9, "nửa trái");
  approx(maxEvalErr(orig, sp.right, 2, 4), 0, 1e-9, "nửa phải");
  eq(sp.left[sp.left.length - 1].v, 1.5, "điểm cuối nửa trái");
  eq(sp.right[0].v, 1.5, "điểm đầu nửa phải");
});

test("split ease-in: trái đúng hệt, phải nay đúng hệt nhờ bezier nâng bậc (H3)", () => {
  const orig = [kf(0, 1, "ease-in"), kf(4, 3, "linear")];
  const sp = splitSpeedKeyframes(orig, 1.7, 4);
  approx(maxEvalErr(orig, sp.left, 0, 1.7), 0, 1e-9, "nửa trái ease-in");
  approx(maxEvalErr(orig, sp.right, 1.7, 4), 0, 1e-4, "nửa phải ease-in");
  assertInRange(sp.right, 2.3, "nửa phải");
});

test("split ease-out: trái nay đúng hệt nhờ bezier nâng bậc (H3), phải đúng hệt", () => {
  const orig = [kf(0, 1, "ease-out"), kf(4, 3, "linear")];
  const sp = splitSpeedKeyframes(orig, 1.7, 4);
  approx(maxEvalErr(orig, sp.left, 0, 1.7), 0, 1e-4, "nửa trái ease-out");
  approx(maxEvalErr(orig, sp.right, 1.7, 4), 0, 1e-9, "nửa phải ease-out");
});

test("split bezier overshoot: 2 nửa đúng hệt (de Casteljau)", () => {
  const orig = [kf(0, 1, "bezier", [0.25, 2, 0.75, -1]), kf(4, 3, "linear")];
  const sp = splitSpeedKeyframes(orig, 1.3, 4);
  approx(maxEvalErr(orig, sp.left, 0, 1.3), 0, 1e-4, "nửa trái bezier");
  approx(maxEvalErr(orig, sp.right, 1.3, 4), 0, 1e-4, "nửa phải bezier");
  assertInRange(sp.left, 1.3, "nửa trái");
  assertInRange(sp.right, 2.7, "nửa phải");
  // Bezier sau chia vẫn hợp lệ với validator: x1, x2 trong [0, 1].
  for (const k of [...sp.left, ...sp.right]) {
    if (k.bezier) {
      assert(k.bezier[0] >= 0 && k.bezier[0] <= 1 && k.bezier[2] >= 0 && k.bezier[2] <= 1, `bezier sau chia có x ngoài [0, 1]: ${JSON.stringify(k.bezier)}`);
    }
  }
});

test("split bezier CSS ease: 2 nửa đúng hệt", () => {
  const orig = [kf(0, 1, "bezier", [0.25, 0.1, 0.25, 1]), kf(4, 3, "linear")];
  const sp = splitSpeedKeyframes(orig, 1.3, 4);
  approx(maxEvalErr(orig, sp.left, 0, 1.3), 0, 1e-4, "nửa trái");
  approx(maxEvalErr(orig, sp.right, 1.3, 4), 0, 1e-4, "nửa phải");
});

test("split tại keyframe có sẵn: điểm cắt thuộc cả 2 nửa, không trùng lặp", () => {
  const orig = [kf(0, 1, "linear"), kf(2, 2, "ease-out"), kf(4, 2.5, "linear")];
  const sp = splitSpeedKeyframes(orig, 2, 4);
  eq(sp.left[sp.left.length - 1], { t: 2, v: 2, easing: "ease-out" }, "điểm cuối nửa trái");
  eq(sp.right[0].t, 0, "điểm đầu nửa phải rebase về 0");
  eq(sp.right[0].v, 2, "điểm đầu nửa phải giữ v");
  approx(maxEvalErr(orig, sp.left, 0, 2), 0, 1e-9, "nửa trái");
  approx(maxEvalErr(orig, sp.right, 2, 4), 0, 1e-9, "nửa phải");
});

test("split curve 1 điểm: 2 nửa đều hằng", () => {
  const orig = [kf(0, 1.5, "linear")];
  const sp = splitSpeedKeyframes(orig, 1, 4);
  approx(speedAt({ keyframes: sp.left }, 0.5), 1.5, 1e-9, "nửa trái hằng");
  approx(speedAt({ keyframes: sp.right }, 2.5), 1.5, 1e-9, "nửa phải hằng");
  assertInRange(sp.left, 1, "nửa trái");
  assertInRange(sp.right, 3, "nửa phải");
});

test("split ngoài khoảng: nửa rỗng + nửa giữ nguyên", () => {
  const orig = [kf(0, 1, "linear"), kf(4, 2, "linear")];
  eq(splitSpeedKeyframes(orig, 0, 4).left, [], "splitT=0 → trái rỗng");
  eq(splitSpeedKeyframes(orig, 0, 4).right, orig, "splitT=0 → phải giữ nguyên");
  eq(splitSpeedKeyframes(orig, 4, 4).left, orig, "splitT=dur → trái giữ nguyên");
  eq(splitSpeedKeyframes(orig, 4, 4).right, [], "splitT=dur → phải rỗng");
});

test("slice rỗng (to <= from): rỗng, dropped = toàn bộ", () => {
  const orig = [kf(0, 1, "linear"), kf(4, 2, "linear")];
  const s = sliceSpeedKeyframes(orig, 2, 2);
  eq(s.keyframes, [], "slice rỗng");
  eq(s.dropped, 2, "dropped");
});

test("slice: keyframe nằm gọn + đoạn không bị cắt thì giữ nguyên bezier; đoạn bị cắt phải thì chia nhỏ", () => {
  const orig = [kf(0, 1, "linear"), kf(2, 2, "bezier", [0.3, 0.2, 0.7, 0.8]), kf(4, 2.5, "linear")];
  const full = sliceSpeedKeyframes(orig, 1, 4);
  const mid = full.keyframes.find((k) => Math.abs(k.t - 1) < 1e-9);
  assert(mid !== undefined, "keyframe giữa phải còn");
  eq(mid.bezier, [0.3, 0.2, 0.7, 0.8], "đoạn [2,4] không bị cắt → mảng bezier giữ nguyên");
  // Cắt phải tại 3 (giữa đoạn [2,4]) thì bezier của điểm @2 phải chia nhỏ
  // (nửa trái của cubic), không được giữ nguyên — giữ nguyên sẽ đánh giá sai.
  const cut = sliceSpeedKeyframes(orig, 1, 3);
  const midCut = cut.keyframes.find((k) => Math.abs(k.t - 1) < 1e-9);
  assert(midCut !== undefined && midCut.bezier !== undefined, "điểm @2 sau cắt phải còn bezier");
  assert(midCut.bezier[0] >= 0 && midCut.bezier[0] <= 1 && midCut.bezier[2] >= 0 && midCut.bezier[2] <= 1, "bezier sau chia có x trong [0, 1]");
  assert(JSON.stringify(midCut.bezier) !== JSON.stringify([0.3, 0.2, 0.7, 0.8]), "bezier phải đổi sau khi chia đoạn");
  approx(maxEvalErr(orig, cut.keyframes, 1, 3), 0, 1e-4, "đánh giá sau chia vẫn khớp gốc");
});

// --- (2) Nested: cửa sổ trim ngoài ---

test("visibleSpeedKeyframes: lá [10,14) dưới cửa sổ [11,13) → slice [1,3)", () => {
  const orig = [kf(0, 1, "linear"), kf(4, 2, "linear")];
  const vis = visibleSpeedKeyframes(orig, 10, 4, 11, 13);
  assert(vis !== null, "phải có phần khả kiến");
  eq(vis.visibleStart, 1, "visibleStart");
  eq(vis.visibleDuration, 2, "visibleDuration");
  eq(vis.dropped, 2, "cả 2 keyframe gốc đều ngoài [1,3)");
  approx(maxEvalErr(orig, vis.keyframes, 1, 3), 0, 1e-9, "đánh giá khớp gốc");
  assertInRange(vis.keyframes, 2, "curve khả kiến");
});

test("visibleSpeedKeyframes: lá bị cắt hết → null; cửa sổ phủ toàn lá → đủ dài", () => {
  const orig = [kf(0, 1, "linear"), kf(4, 2, "linear")];
  eq(visibleSpeedKeyframes(orig, 10, 4, 20, 22), null, "ngoài cửa sổ → null");
  const full = visibleSpeedKeyframes(orig, 10, 4, 0, 20);
  assert(full !== null, "phủ toàn lá");
  eq(full.visibleDuration, 4, "đủ duration lá");
  approx(maxEvalErr(orig, full.keyframes, 0, 4), 0, 1e-9, "đánh giá khớp gốc");
  eq(visibleSpeedKeyframes([], 10, 4, 0, 20), null, "không curve → null");
});

test("nestedLeafVisibleSpeedCurve: dùng trim của nested clip", () => {
  const leaf = {
    kind: "video", id: "leaf", src: "a.mp4", start: 10, duration: 4, in: 0, out: 4,
    speedKeyframes: { keyframes: [kf(0, 1, "linear"), kf(4, 2, "linear")] },
  } as Clip;
  const nested = {
    kind: "nested", id: "n1", start: 0, duration: 2, trim: { in: 11, out: 13 },
    subSpec: { version: "0.2.0", meta: { name: "T", width: 1280, height: 720, fps: 30 }, tracks: [] },
  } as unknown as NestedClip;
  const vis = nestedLeafVisibleSpeedCurve(nested, leaf);
  assert(vis !== null, "phải có phần khả kiến");
  eq(vis.visibleStart, 1, "visibleStart");
  eq(vis.visibleDuration, 2, "visibleDuration");
  const viaWindow = leafVisibleSpeedCurveForWindow(leaf, 11, 13);
  eq(viaWindow, vis, "helper 1 tầng khớp helper cửa sổ tường minh");
  eq(leafVisibleSpeedCurveForWindow({ kind: "video", id: "x", start: 0, duration: 4 } as Clip, 0, 4), null, "lá không curve → null");
});

// --- (3) in/out theo tích phân ramp ---

test("rampTrimLeftIn: trim trái 1s trên ramp linear 1→2 ([0,4]) → in + 1.125", () => {
  const curve: SpeedCurve = { keyframes: [kf(0, 1, "linear"), kf(4, 2, "linear")] };
  approx(rampTrimLeftIn(10, curve, 1), 11.125, 1e-9, "∫0..1 của 1+0.25t");
  approx(rampTrimLeftIn(10, curve, 2), 12.5, 1e-9, "∫0..2");
  approx(rampTrimLeftIn(10, curve, -1), 9, 1e-9, "mở rộng trái 1s với tốc độ keyframe đầu = 1");
});

test("rampTrimRightOut: trim phải về 2s → out = in + 2.5; về 4s → in + 6", () => {
  const curve: SpeedCurve = { keyframes: [kf(0, 1, "linear"), kf(4, 2, "linear")] };
  approx(rampTrimRightOut(10, curve, 2), 12.5, 1e-9, "∫0..2");
  approx(rampTrimRightOut(10, curve, 4), 16, 1e-9, "∫0..4 = 6");
});

test("outputDurationForSource: đảo tích phân ramp (chia đôi)", () => {
  const curve: SpeedCurve = { keyframes: [kf(0, 1, "linear"), kf(4, 2, "linear")] };
  approx(outputDurationForSource(curve, 2.5), 2, 1e-6, "nguồn 2.5s ↔ output 2s");
  approx(outputDurationForSource(curve, 6), 4, 1e-6, "nguồn 6s ↔ output 4s");
  eq(outputDurationForSource(curve, 0), 0, "nguồn 0 → 0");
});

// --- (4) updateNestedInnerClip: trim clip con ---

function nestedFixture(inner: Clip): { spec: VideoSpec; nestedId: string } {
  // Đợt 19 G2: fixture nay guard-consistent để test curve của R5 không
  // bị guard nguồn của cha (dời xuống hàm thuần) chặn oan: cha ghi trim
  // tường minh [0,6) và track it2 có lá anh em kết thúc ở 6 giữ độ dài
  // nguồn — nhờ đó thu ngắn/dời lá c1 không làm nguồn co dưới trim.out
  // (xem test G1/G2 của store.nestedGuard). Duration cha vẫn 10 như cũ
  // (case dời thuần cần lá kết thúc ở 7 ≤ duration cha); mọi assertion
  // về curve bên dưới giữ nguyên, không đổi.
  const nested = {
    kind: "nested", id: "n1", start: 0, duration: 10, trim: { in: 0, out: 6 },
    subSpec: {
      version: "0.2.0",
      meta: { name: "T", width: 1280, height: 720, fps: 30 },
      tracks: [
        { id: "it1", kind: "video", clips: [inner] } as Track,
        { id: "it2", kind: "video", clips: [{ kind: "video", id: "s1", src: "b.mp4", start: 0, duration: 6, in: 0, out: 6 } as Clip] } as Track,
      ],
    },
  } as unknown as NestedClip;
  const spec: VideoSpec = {
    version: "0.2.0",
    meta: { name: "T", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "host", kind: "video", clips: [nested as unknown as Clip] } as Track],
  };
  return { spec, nestedId: "n1" };
}

function innerVideo(): Clip {
  return {
    kind: "video", id: "c1", src: "a.mp4", start: 2, duration: 4, in: 0, out: 4,
    speedKeyframes: { keyframes: [kf(0, 1, "linear"), kf(2, 1.5, "linear"), kf(4, 2, "linear")] },
  } as Clip;
}

function innerAfter(res: unknown): Clip {
  assert(!("error" in (res as { error?: string })), `mong thành công, nhận ${JSON.stringify(res)}`);
  const r = res as { nested: NestedClip };
  return r.nested.subSpec.tracks[0].clips[0];
}

test("updateNestedInnerClip trim trái clip con: dịch + cắt curve, báo dropped", () => {
  const { spec } = nestedFixture(innerVideo());
  const res = updateNestedInnerClip(spec, "host", "n1", "it1", "c1", { start: 3, duration: 3 });
  const after = innerAfter(res);
  const curve = (after as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  assert(curve !== undefined, "curve phải còn");
  eq(curve.keyframes, [{ t: 1, v: 1.5, easing: "linear" }, { t: 3, v: 2, easing: "linear" }], "dịch 1s, điểm @0 rớt");
  eq((res as { curveDropped?: number }).curveDropped, 1, "curveDropped");
});

test("updateNestedInnerClip trim phải clip con: cắt điểm vượt duration", () => {
  const { spec } = nestedFixture(innerVideo());
  const res = updateNestedInnerClip(spec, "host", "n1", "it1", "c1", { start: 2, duration: 2 });
  const after = innerAfter(res);
  const curve = (after as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  assert(curve !== undefined, "curve phải còn");
  eq(curve.keyframes, [{ t: 0, v: 1, easing: "linear" }, { t: 2, v: 1.5, easing: "linear" }], "điểm @4 rớt");
  eq((res as { curveDropped?: number }).curveDropped, 1, "curveDropped");
});

test("updateNestedInnerClip dời thuần clip con: curve giữ nguyên", () => {
  const { spec } = nestedFixture(innerVideo());
  const res = updateNestedInnerClip(spec, "host", "n1", "it1", "c1", { start: 3, duration: 4 });
  const after = innerAfter(res);
  const curve = (after as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  assert(curve !== undefined, "curve phải còn");
  eq(curve.keyframes, [kf(0, 1, "linear"), kf(2, 1.5, "linear"), kf(4, 2, "linear")], "dời thuần không đụng curve");
  eq((res as { curveDropped?: number }).curveDropped, 0, "curveDropped = 0");
});

test("updateNestedInnerClip đổi cả 2 mép không đều: dịch + cắt", () => {
  const { spec } = nestedFixture(innerVideo());
  const res = updateNestedInnerClip(spec, "host", "n1", "it1", "c1", { start: 3, duration: 2 });
  const after = innerAfter(res);
  const curve = (after as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  assert(curve !== undefined, "curve phải còn");
  eq(curve.keyframes, [{ t: 1, v: 1.5, easing: "linear" }], "chỉ còn điểm @2→@1");
  eq((res as { curveDropped?: number }).curveDropped, 2, "curveDropped");
});

test("updateNestedInnerClip trim hết curve: bỏ luôn field speedKeyframes", () => {
  const single = {
    kind: "video", id: "c1", src: "a.mp4", start: 2, duration: 4, in: 0, out: 4,
    speedKeyframes: { keyframes: [kf(0, 1, "linear")] },
  } as Clip;
  const { spec } = nestedFixture(single);
  const res = updateNestedInnerClip(spec, "host", "n1", "it1", "c1", { start: 3, duration: 3 });
  const after = innerAfter(res);
  assert(!("speedKeyframes" in (after as unknown as Record<string, unknown>)), "hết điểm thì bỏ field");
  eq((res as { curveDropped?: number }).curveDropped, 1, "curveDropped");
});

// --- (5) Parity .ts ↔ .js ---

test("parity .ts ↔ .js cho mọi hàm mới", () => {
  const orig = [kf(0, 1, "bezier", [0.25, 2, 0.75, -1]), kf(4, 3, "linear")];
  const curve: SpeedCurve = { keyframes: orig };
  eq(sliceSpeedKeyframesTs(orig, 1, 3), sliceSpeedKeyframes(orig, 1, 3), "slice");
  eq(splitSpeedKeyframesTs(orig, 1.3, 4), splitSpeedKeyframes(orig, 1.3, 4), "split");
  eq(visibleSpeedKeyframesTs(orig, 10, 4, 11, 13), visibleSpeedKeyframes(orig, 10, 4, 11, 13), "visible");
  eq(rampTrimLeftInTs(10, curve, 1), rampTrimLeftIn(10, curve, 1), "rampTrimLeftIn");
  eq(rampTrimRightOutTs(10, curve, 2), rampTrimRightOut(10, curve, 2), "rampTrimRightOut");
  eq(outputDurationForSourceTs(curve, 2.5), outputDurationForSource(curve, 2.5), "outputDurationForSource");
});

console.log(`\nnestedSpeedcurve: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
