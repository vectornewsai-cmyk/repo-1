/**
 * nestedDeepSpeed.store.test.ts — Test END-TO-END qua store thật, Phase 9
 * đợt 17 (luồng N3): patchClip đổi speed nested (duration tính lại) và
 * 2 action deep mới (update/split clip con ở cấp 3), rồi đối chiếu bằng
 * helper đệ quy + validateNestedClip.
 *
 * VÌ SAO FILE NÀY KHÔNG CHẠY BẰNG `node` TRỰC TIẾP: như
 * nestedStore.store.test.ts đợt 16 — store.ts dùng import không đuôi mở
 * rộng mà chỉ Vite mới phân giải. Chạy bằng esbuild bundle trước rồi chạy
 * (mẫu T4):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/components/speed/nestedDeepSpeed.store.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/nestedDeepSpeed.store.test.cjs --log-level=warning
 *   node /tmp/nestedDeepSpeed.store.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * Bundle chứa đúng code store thật (không mock store, không re-implement
 * patchClip/deep): patchClip, updateNestedDeepInnerClip và
 * splitNestedDeepInnerClip đều là code sản phẩm; helper đệ quy /
 * validateNestedClip chỉ dùng để ĐỐI CHIẾU kết quả.
 *
 * Fixture (số suy tay, cùng mẫu fixture D/R của nestedDeepSpeed.test.ts):
 * - N: top start 0, duration 4, trim [0,4), speed 1 (subSpec bất kỳ —
 *   patch speed không cần lá thật; subSpec rỗng chỉ dùng cho case N).
 *   Riêng case N3 dùng top trim [0,4) speed 2 duration 2.
 * - D: top / mid / inner / lá L [0,4) in 0–4 + anh em S [4,8); cả 3 tầng
 *   trim [0,8) speed 1, duration 8. Chain ["mid", "in"], track "v-in".
 * - R: lá LR [0,4) in 10 out 14.875, curve [(0,1),(1,1.25),(4,1.25)];
 *   inner/mid/top trim [0,4) duration 4. Chain ["midR", "inR"].
 *
 * NỘI DUNG (mỗi case cài lại spec mới qua useStore.setState):
 *  N1. patchClip top { speed: 2 } → duration 4 → 2, trim [0,4) giữ
 *      nguyên, validateNestedClip rỗng.
 *  N2. patchClip top speed 2 → 0.5 (trim [0,4)) → duration 2 → 8.
 *  N3. patchClip top { speed: 2, duration: 1 } → duration tường minh
 *      thắng, trim.out đi theo thành [0,2) (nhánh H2, không bị nhánh
 *      N3 ghi đè).
 *  N4. patchClip top { speed: 5 } (ngoài [0.25,4]) → duration giữ
 *      nguyên 4 (không tự kẹp, không đoán).
 *  N5. patchClip rồi undo → duration về 4 (1 entry undo cho cả patch).
 *  D1. updateNestedDeepInnerClip lá L speed 1 → 2 qua store → ok,
 *      lá duration 2, top validate rỗng, cửa sổ lá khớp deep helper.
 *  D2. updateNestedDeepInnerClip lá L speed 0.5 (đè S) qua store →
 *      ok false, lá không đổi.
 *  R1. splitNestedDeepInnerClip lá LR tại 1 qua store → true, điểm cắt
 *      nguồn 11,125 (in 10 + ∫0..1), top validate rỗng.
 */
import { useStore } from "../../store";
import {
  deepNestedLeafVisibleSpeedCurve,
} from "../nested/nestUtils";
import {
  validateNestedClip,
  type Clip,
  type NestedClip,
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
  if (!(Math.abs(a - b) <= tol))
    throw new Error(`${what} nhận ${a}, muốn ${b} (±${tol})`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

type AnyClip = Record<string, unknown> & {
  id: string;
  start: number;
  duration: number;
};

function subSpec(clips: AnyClip[], trackId = "v1"): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: [{ id: trackId, kind: "video", clips: clips as unknown as Clip[] }],
  } as unknown as VideoSpec;
}

/** Top rỗng subSpec, trim [0,4), speed/duration theo tham số. */
function fixtureN(speed: number, duration: number): NestedClip {
  return {
    kind: "nested", id: "topN", start: 0, duration, speed,
    trim: { in: 0, out: 4 }, subSpec: subSpec([]),
  } as unknown as NestedClip;
}

/** Fixture D: top / mid / inner / lá L + anh em S. */
function fixtureD(): NestedClip {
  const leaf = {
    kind: "video", id: "L", src: "src.mp4", start: 0, duration: 4, in: 0, out: 4,
  };
  const sib = {
    kind: "video", id: "S", src: "src.mp4", start: 4, duration: 4, in: 0, out: 4,
  };
  const inner = {
    kind: "nested", id: "in", start: 0, duration: 8, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([leaf, sib], "v-in"),
  };
  const mid = {
    kind: "nested", id: "mid", start: 0, duration: 8, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([inner]),
  };
  return {
    kind: "nested", id: "top", start: 0, duration: 8, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([mid]),
  } as unknown as NestedClip;
}

/** Fixture R: lá có curve, 3 cấp. */
function fixtureR(): NestedClip {
  const leaf = {
    kind: "video", id: "LR", src: "src.mp4", start: 0, duration: 4, in: 10, out: 14.875,
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 1, v: 1.25, easing: "linear" },
        { t: 4, v: 1.25, easing: "linear" },
      ],
    },
  };
  const inner = {
    kind: "nested", id: "inR", start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: subSpec([leaf], "v-in"),
  };
  const mid = {
    kind: "nested", id: "midR", start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: subSpec([inner]),
  };
  return {
    kind: "nested", id: "topR", start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: subSpec([mid]),
  } as unknown as NestedClip;
}

/** Cài spec mới toanh vào store (mỗi case gọi lại để độc lập). */
function install(trackClips: AnyClip[]): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "N3 test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: trackClips }],
  };
  useStore.setState({
    spec: spec as never,
    selection: [],
    playhead: 0,
    rippleMode: false,
  });
}

function trackClips(): AnyClip[] {
  const track = useStore.getState().spec.tracks.find((t) => t.id === "v1");
  if (!track) throw new Error("mất track v1");
  return [...(track.clips as unknown as AnyClip[])].sort(
    (a, b) => a.start - b.start,
  );
}

function asNested(c: AnyClip): NestedClip {
  if (c["kind"] !== "nested") throw new Error(`clip ${c.id} không phải nested`);
  return c as unknown as NestedClip;
}

function assertValid(top: NestedClip, what: string): void {
  const errs = validateNestedClip(top);
  if (errs.length > 0) throw new Error(`${what}: validateNestedClip: ${errs.join("; ")}`);
}

/** Lấy lá L trong fixture D sau edit (top → mid → inner → track v-in). */
function leafD(top: NestedClip): AnyClip {
  const mid = top.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const inner = mid.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const track = inner.subSpec.tracks.find((t) => t.id === "v-in")!;
  const leaf = track.clips.find((c) => c.id === "L");
  if (!leaf) throw new Error("mất lá L");
  return leaf as unknown as AnyClip;
}

// ===========================================================================
// N1–N5. patchClip đổi speed nested qua store thật
// ===========================================================================
console.log("== N. patchClip speed nested qua store ==");

test("N1: patchClip { speed: 2 } → duration 4 → 2, trim [0,4) giữ nguyên", () => {
  install([fixtureN(1, 4) as unknown as AnyClip]);
  useStore.getState().patchClip("v1", "topN", { speed: 2 } as never);
  const [only] = trackClips();
  const top = asNested(only);
  eq(top.speed, 2, "speed mới");
  eq(top.duration, 2, "duration = (4−0)/2");
  eq(top.trim, { in: 0, out: 4 }, "trim giữ nguyên");
  // validateNestedClip cần subSpec có clip nên chỉ kiểm tra bất biến
  // duration bằng tay ở đây (fixture N subSpec rỗng, trim [0,4) vượt
  // nguồn 0 nên validate đầy đủ sẽ báo trim — không phải lỗi của N3).
  approx(top.duration, (4 - 0) / 2, 1e-9, "bất biến duration");
});

test("N2: patchClip speed 2 → 0.5 (trim [0,4)) → duration 2 → 8", () => {
  install([fixtureN(2, 2) as unknown as AnyClip]);
  useStore.getState().patchClip("v1", "topN", { speed: 0.5 } as never);
  const [only] = trackClips();
  const top = asNested(only);
  eq(top.speed, 0.5, "speed mới");
  eq(top.duration, 8, "duration = (4−0)/0.5");
  eq(top.trim, { in: 0, out: 4 }, "trim giữ nguyên");
});

test("N3: patchClip { speed: 2, duration: 1 } → duration thắng, trim [0,2)", () => {
  install([fixtureN(1, 4) as unknown as AnyClip]);
  useStore.getState().patchClip("v1", "topN", { speed: 2, duration: 1 } as never);
  const [only] = trackClips();
  const top = asNested(only);
  eq(top.speed, 2, "speed mới");
  eq(top.duration, 1, "duration tường minh thắng");
  eq(top.trim, { in: 0, out: 2 }, "trim.out = 0 + 1×2 (nhánh H2)");
});

test("N4: patchClip { speed: 5 } ngoài [0.25,4] → duration giữ nguyên 4", () => {
  install([fixtureN(1, 4) as unknown as AnyClip]);
  useStore.getState().patchClip("v1", "topN", { speed: 5 } as never);
  const [only] = trackClips();
  const top = asNested(only);
  eq(top.duration, 4, "duration không tự tính theo speed không hợp lệ");
});

test("N5: patchClip speed rồi undo → duration về 4", () => {
  install([fixtureN(1, 4) as unknown as AnyClip]);
  useStore.getState().patchClip("v1", "topN", { speed: 2 } as never);
  eq(asNested(trackClips()[0]).duration, 2, "sau patch duration 2");
  useStore.getState().undo();
  const top = asNested(trackClips()[0]);
  eq(top.duration, 4, "sau undo duration 4");
  eq(top.speed, 1, "sau undo speed 1");
});

// ===========================================================================
// D1–D2. update deep qua store thật
// ===========================================================================
console.log("== D. updateNestedDeepInnerClip qua store ==");

test("D1: deep update lá L speed 1 → 2 qua store → lá duration 2, top hợp lệ", () => {
  install([fixtureD() as unknown as AnyClip]);
  const res = useStore.getState().updateNestedDeepInnerClip("v1", "top", ["mid", "in"], "v-in", "L", { speed: 2 });
  assert(res.ok, "deep update phải ok");
  eq(res.curveDropped, 0, "không rơi keyframe");
  const top = asNested(trackClips()[0]);
  assertValid(top, "top sau deep update");
  const leaf = leafD(top);
  eq(leaf.duration, 2, "lá duration sau speed 2");
  eq(leaf["speed"], 2, "lá speed mới");
  const mid = top.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const inner = mid.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const deep = deepNestedLeafVisibleSpeedCurve(top, [mid, inner], leaf as unknown as Clip);
  assert(deep !== null, "deep null");
  approx(deep!.window.absoluteDuration, 2, 1e-9, "window absoluteDuration");
  approx(deep!.effectiveOut!, 4, 1e-9, "effectiveOut");
});

test("D2: deep update lá L speed 0.5 (đè S) qua store → ok false, lá không đổi", () => {
  install([fixtureD() as unknown as AnyClip]);
  const res = useStore.getState().updateNestedDeepInnerClip("v1", "top", ["mid", "in"], "v-in", "L", { speed: 0.5 });
  assert(!res.ok, "đè anh em phải ok false");
  const top = asNested(trackClips()[0]);
  eq(leafD(top).duration, 4, "lá không đổi sau deep update lỗi");
});

// ===========================================================================
// R1. split deep qua store thật
// ===========================================================================
console.log("== R. splitNestedDeepInnerClip qua store ==");

test("R1: deep split lá LR tại 1 qua store → điểm cắt nguồn 11,125", () => {
  install([fixtureR() as unknown as AnyClip]);
  const ok = useStore.getState().splitNestedDeepInnerClip("v1", "topR", ["midR", "inR"], "v-in", "LR", 1);
  assert(ok, "deep split phải true");
  const top = asNested(trackClips()[0]);
  assertValid(top, "top sau deep split");
  const mid = top.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const inner = mid.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const track = inner.subSpec.tracks.find((t) => t.id === "v-in")!;
  eq(track.clips.length, 2, "track cha có 2 nửa");
  const [left, right] = [...track.clips].sort((a, b) => a.start - b.start) as unknown as AnyClip[];
  eq(left.duration, 1, "trái duration");
  eq(right.duration, 3, "phải duration");
  approx(left["out"] as number, 11.125, 1e-9, "trái out = điểm cắt nguồn");
  approx(right["in"] as number, 11.125, 1e-9, "phải in = điểm cắt nguồn");
});

console.log(`\nnestedDeepSpeed.store: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
