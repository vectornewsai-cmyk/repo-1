/**
 * nestedStore.store.test.ts — Test END-TO-END qua store thật, Phase 9 đợt 16
 * (luồng H2): split/trim nested clip ngoài cùng qua splitAtPlayhead /
 * trimClip / splitClipAtTimes / patchClip, rồi đối chiếu cửa sổ lá sâu
 * bằng helper đệ quy (đợt 15 T3).
 *
 * VÌ SAO FILE NÀY KHÔNG CHẠY BẰNG `node` TRỰC TIẾP: như
 * splitPatch.store.test.ts đợt 15 T4 — store.ts dùng import không đuôi mở
 * rộng mà chỉ Vite mới phân giải. Chạy bằng esbuild bundle trước rồi chạy
 * (mẫu T4):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/components/speed/nestedStore.store.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/nestedStore.store.test.cjs --log-level=warning
 *   node /tmp/nestedStore.store.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * Bundle chứa đúng code store thật (không mock store, không re-implement
 * split/trim): splitAtPlayhead, trimClip, splitClipAtTimes, patchClip đều
 * là code sản phẩm; deepNestedLeafVisibleSpeedCurve / validateNestedClip
 * chỉ dùng để ĐỐI CHIẾU kết quả (không dùng để tính kết quả).
 *
 * Fixture S (3 cấp, cùng số với nestedStore.test.ts thuần):
 * lá L [0,8) in 0–8 trong inner [0,4) trim [2,6), trong mid [0,2) trim
 * [1,3), trong top start 0 duration 2 trim [0,2) → lá 3–5.
 *
 * NỘI DUNG (mỗi case cài lại spec mới qua useStore.setState):
 *  H1. splitAtPlayhead top tại playhead 1 → 2 nửa, trim chia đôi, cửa sổ
 *      lá trái 3–4 / phải 4–5, validateNestedClip rỗng cả hai nửa.
 *  H2. trimClip mép trái top +0.5 → start 0.5, trim [0.5,2), lá 3.5–5.
 *  H3. trimClip mép phải top −1 → duration 1, trim [0,1), lá 3–4.
 *  H4. splitClipAtTimes top tại [0.5, 1.5] → 3 mảnh, trim đúng từng mảnh.
 *  H5. patchClip đổi duration top về 1 → trim.out đi theo thành [0,1).
 *  H6. Hồi quy/âm tính: tách sát mép (playhead 0.03) → false, không đổi;
 *      trim phải đè clip kề (không ripple) → bị chặn, không đổi;
 *      trim phải ripple → clip sau dồn theo delta.
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

function subSpec(clips: AnyClip[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: clips as unknown as Clip[] }],
  } as unknown as VideoSpec;
}

/** Fixture S: top / mid / inner / lá (xem header). */
function fixtureS(): NestedClip {
  const leaf = {
    kind: "video", id: "L", src: "src.mp4", start: 0, duration: 8, in: 0, out: 8,
  };
  const inner = {
    kind: "nested", id: "in", start: 0, duration: 4, speed: 1,
    trim: { in: 2, out: 6 }, subSpec: subSpec([leaf]),
  };
  const mid = {
    kind: "nested", id: "mid", start: 0, duration: 2, speed: 1,
    trim: { in: 1, out: 3 }, subSpec: subSpec([inner]),
  };
  return {
    kind: "nested", id: "top", start: 0, duration: 2, speed: 1,
    trim: { in: 0, out: 2 }, subSpec: subSpec([mid]),
  } as unknown as NestedClip;
}

/** Top biến thể có subSpec dài 4s (để trim phải vượt clip kề mới bị chặn). */
function fixtureWide(): NestedClip {
  const leaf = {
    kind: "video", id: "LW", src: "src.mp4", start: 0, duration: 8, in: 0, out: 8,
  };
  const inner = {
    kind: "nested", id: "inW", start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: subSpec([leaf]),
  };
  return {
    kind: "nested", id: "topW", start: 0, duration: 2, speed: 1,
    trim: { in: 0, out: 2 }, subSpec: subSpec([inner]),
  } as unknown as NestedClip;
}

/** Cài spec mới toanh vào store (mỗi case gọi lại để độc lập). */
function install(trackClips: AnyClip[]): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "H2 test", width: 64, height: 64, fps: 30 },
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

/** Lấy mid/inner/lá từ top fixture S (cùng tham chiếu subSpec sau edit). */
function deepParts(top: NestedClip): { mid: NestedClip; inner: NestedClip; leaf: Clip } {
  const mid = top.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const inner = mid.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const leaf = inner.subSpec.tracks[0].clips[0];
  return { mid, inner, leaf };
}

function assertDeepWindow(
  top: NestedClip,
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
  const { mid, inner, leaf } = deepParts(top);
  const deep = deepNestedLeafVisibleSpeedCurve(top, [mid, inner], leaf);
  assert(deep !== null, `${what}: deep null`);
  approx(deep!.window.absoluteStart, want.absoluteStart, 1e-9, `${what} absoluteStart`);
  approx(deep!.window.absoluteDuration, want.absoluteDuration, 1e-9, `${what} absoluteDuration`);
  approx(deep!.window.visibleStart, want.visibleStart, 1e-9, `${what} visibleStart`);
  approx(deep!.window.visibleEnd, want.visibleEnd, 1e-9, `${what} visibleEnd`);
  approx(deep!.effectiveIn!, want.in, 1e-9, `${what} effectiveIn`);
  approx(deep!.effectiveOut!, want.out, 1e-9, `${what} effectiveOut`);
}

function assertValid(top: NestedClip, what: string): void {
  const errs = validateNestedClip(top);
  if (errs.length > 0) throw new Error(`${what}: validateNestedClip: ${errs.join("; ")}`);
}

// ===========================================================================
// H1. splitAtPlayhead qua store thật
// ===========================================================================
console.log("== H1. splitAtPlayhead nested qua store ==");

test("H1: tách top tại playhead 1 → 2 nửa, trim chia đôi, lá trái 3–4 / phải 4–5", () => {
  install([fixtureS() as unknown as AnyClip]);
  useStore.setState({
    selection: [{ trackId: "v1", clipId: "top" }],
    playhead: 1,
  });
  if (!useStore.getState().splitAtPlayhead()) throw new Error("splitAtPlayhead trả false");
  const clips = trackClips();
  eq(clips.length, 2, "2 nửa sau tách");
  const left = asNested(clips[0]);
  const right = asNested(clips[1]);
  eq(left.id, "top", "nửa trái giữ id gốc");
  eq(left.start, 0, "trái start");
  eq(left.duration, 1, "trái duration");
  eq(left.trim, { in: 0, out: 1 }, "trái trim");
  eq(right.start, 1, "phải start");
  eq(right.duration, 1, "phải duration");
  eq(right.trim, { in: 1, out: 2 }, "phải trim");
  assertValid(left, "trái");
  assertValid(right, "phải");
  assertDeepWindow(left, {
    absoluteStart: 0, absoluteDuration: 1, visibleStart: 3, visibleEnd: 4, in: 3, out: 4,
  }, "split trái");
  assertDeepWindow(right, {
    absoluteStart: 1, absoluteDuration: 1, visibleStart: 4, visibleEnd: 5, in: 4, out: 5,
  }, "split phải");
});

// ===========================================================================
// H2 + H3. trimClip qua store thật
// ===========================================================================
console.log("== H2/H3. trimClip nested qua store ==");

test("H2: trimClip mép trái +0.5 → start 0.5, trim [0.5,2), lá 3.5–5", () => {
  install([fixtureS() as unknown as AnyClip]);
  useStore.getState().trimClip("v1", "top", "left", 0.5);
  const [only] = trackClips();
  const top = asNested(only);
  eq(top.start, 0.5, "trim trái start");
  eq(top.duration, 1.5, "trim trái duration");
  eq(top.trim, { in: 0.5, out: 2 }, "trim trái trim");
  assertValid(top, "trim trái");
  assertDeepWindow(top, {
    absoluteStart: 0.5, absoluteDuration: 1.5, visibleStart: 3.5, visibleEnd: 5, in: 3.5, out: 5,
  }, "trim trái");
});

test("H3: trimClip mép phải −1 → duration 1, trim [0,1), lá 3–4", () => {
  install([fixtureS() as unknown as AnyClip]);
  useStore.getState().trimClip("v1", "top", "right", -1);
  const [only] = trackClips();
  const top = asNested(only);
  eq(top.duration, 1, "trim phải duration");
  eq(top.trim, { in: 0, out: 1 }, "trim phải trim");
  assertValid(top, "trim phải");
  assertDeepWindow(top, {
    absoluteStart: 0, absoluteDuration: 1, visibleStart: 3, visibleEnd: 4, in: 3, out: 4,
  }, "trim phải");
});

// ===========================================================================
// H4. splitClipAtTimes qua store thật
// ===========================================================================
console.log("== H4. splitClipAtTimes nested qua store ==");

test("H4: tách top tại [0.5, 1.5] → 3 mảnh, trim đúng từng mảnh", () => {
  install([fixtureS() as unknown as AnyClip]);
  const n = useStore.getState().splitClipAtTimes("v1", "top", [0.5, 1.5]);
  eq(n, 2, "2 điểm tách áp dụng");
  const clips = trackClips();
  eq(clips.length, 3, "3 mảnh sau tách");
  const [p1, p2, p3] = clips.map(asNested);
  eq(p1.trim, { in: 0, out: 0.5 }, "mảnh 1 trim");
  eq(p2.trim, { in: 0.5, out: 1.5 }, "mảnh 2 trim");
  eq(p3.trim, { in: 1.5, out: 2 }, "mảnh 3 trim");
  eq(p2.start, 0.5, "mảnh 2 start");
  eq(p3.start, 1.5, "mảnh 3 start");
  assertValid(p1, "mảnh 1");
  assertValid(p2, "mảnh 2");
  assertValid(p3, "mảnh 3");
  assertDeepWindow(p2, {
    absoluteStart: 0.5, absoluteDuration: 1, visibleStart: 3.5, visibleEnd: 4.5, in: 3.5, out: 4.5,
  }, "mảnh 2");
});

// ===========================================================================
// H5. patchClip đổi duration nested
// ===========================================================================
console.log("== H5. patchClip nested ==");

test("H5: patchClip duration 1 → trim.out đi theo thành [0,1), lá 3–4", () => {
  install([fixtureS() as unknown as AnyClip]);
  useStore.getState().patchClip("v1", "top", { duration: 1 } as never);
  const [only] = trackClips();
  const top = asNested(only);
  eq(top.duration, 1, "patch duration");
  eq(top.trim, { in: 0, out: 1 }, "patch trim.out theo duration");
  assertValid(top, "patch");
  assertDeepWindow(top, {
    absoluteStart: 0, absoluteDuration: 1, visibleStart: 3, visibleEnd: 4, in: 3, out: 4,
  }, "patch");
});

// ===========================================================================
// H6. Âm tính + ripple
// ===========================================================================
console.log("== H6. âm tính + ripple ==");

test("H6a: tách sát mép (playhead 0.03) → false, spec không đổi", () => {
  install([fixtureS() as unknown as AnyClip]);
  useStore.setState({
    selection: [{ trackId: "v1", clipId: "top" }],
    playhead: 0.03,
  });
  eq(useStore.getState().splitAtPlayhead(), false, "split sát mép false");
  eq(trackClips().length, 1, "vẫn 1 clip");
  eq(trackClips()[0].duration, 2, "duration không đổi");
});

test("H6b: trim phải đè clip kề (không ripple) → bị chặn, không đổi", () => {
  const filler = {
    kind: "video", id: "fill", src: "src.mp4", start: 2, duration: 2, in: 0, out: 2,
  };
  install([fixtureWide() as unknown as AnyClip, filler]);
  useStore.getState().trimClip("v1", "topW", "right", 1);
  const [top] = trackClips();
  eq(top.duration, 2, "trim bị chặn: duration giữ nguyên");
  eq(asNested(top).trim, { in: 0, out: 2 }, "trim bị chặn: trim giữ nguyên");
});

test("H6c: trim phải ripple → clip sau dồn theo delta (+1 → start 3)", () => {
  const filler = {
    kind: "video", id: "fill", src: "src.mp4", start: 2, duration: 2, in: 0, out: 2,
  };
  install([fixtureWide() as unknown as AnyClip, filler]);
  useStore.setState({ rippleMode: true });
  useStore.getState().trimClip("v1", "topW", "right", 1);
  const [top, fill] = trackClips();
  eq(top.duration, 3, "ripple: top duration 3");
  eq(asNested(top).trim, { in: 0, out: 3 }, "ripple: top trim [0,3)");
  eq(fill.start, 3, "ripple: clip sau dồn tới 3");
  assertValid(asNested(top), "ripple top");
});

console.log(`\nnestedStore.store: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
