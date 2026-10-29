/**
 * splitPatch.store.test.ts — Test END-TO-END qua store thật, Phase 9 đợt 15 (luồng T4).
 *
 * VÌ SAO FILE NÀY KHÔNG CHẠY BẰNG `node` TRỰC TIẾP: store.ts dùng import
 * không đuôi mở rộng ("./lib/...", "@repo-1/video-spec/speed") mà chỉ Vite
 * mới phân giải — Node trần (kể cả type-stripping) sẽ lỗi resolve. Đợt 14
 * R5 vì vậy chỉ kiểm chứng phần nối store bằng tsc + build, KHÔNG có test
 * chạy qua store thật. File này đóng đúng lỗ hổng đó bằng cách bundle trước
 * rồi chạy (esbuild đã có sẵn trong repo, không cài thêm gì):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/components/speed/splitPatch.store.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/splitPatch.store.test.cjs --log-level=warning
 *   node /tmp/splitPatch.store.test.cjs
 * (Bắt buộc --format=cjs: validate.js dùng dynamic require("child_process")
 *  nên bundle ESM gãy ở runtime; bản CJS chạy được.)
 *
 * Bundle chứa đúng code store thật (không mock store, không re-implement
 * split/patch): splitAtPlayhead, patchClip, clampSplitOuterTransitions và
 * validateSpec của render đều là code sản phẩm. Output /tmp là file chạy
 * tạm, KHÔNG đưa vào batch stage.
 *
 * NỘI DUNG (mỗi case cài lại spec mới qua useStore.setState để độc lập):
 *  S1. splitAtPlayhead clip có curve + transition 2 đầu: 2 nửa giữ đúng đoạn
 *      curve (tích phân ramp + đánh giá từng điểm), transition ngoài giữ
 *      nguyên vị trí, biên trong về "none", validateSpec pass.
 *  S2. split sát mép làm nửa mới ngắn hơn transition ngoài: cả hai đầu cặp
 *      (clip tách + clip kề) bị kẹp về duration nửa mới, validateSpec pass.
 *  S3. patchClip thu ngắn duration: curve bị cắt về [0, newDur) kèm điểm biên.
 *  S4. Hồi quy patchClip cũ: patch không đụng duration / clip không curve /
 *      patch tự đặt curve / kéo dài / reverse+curve / chỉ dời start đều giữ
 *      nguyên curve (hoặc không tự mọc curve) như trước đợt này.
 *  S5. Hồi quy split nhánh tốc độ hằng (không curve): vị trí transition như cũ.
 *
 * Curve dùng chung: linear 1→2 trên [0, 4] (nguồn tiêu thụ 6s; điểm cắt
 * output 2s ↔ nguồn 2.5s — cùng bộ số với test P3 để dễ đối chiếu).
 */

import { useStore } from "../../store";
import { validateSpec } from "../../../../../server/render/src/validate.js";
import {
  speedAt,
  sourcePosAt,
  type SpeedCurve,
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

type AnyClip = Record<string, unknown> & {
  id: string;
  start: number;
  duration: number;
};

const LIN: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

const fade = (d: number) => ({ type: "fade", duration: d });

function videoClip(over: Record<string, unknown>): AnyClip {
  return {
    kind: "video",
    src: "redblue.mp4",
    ...over,
  } as AnyClip;
}

/** Cài spec mới toanh vào store (mỗi case gọi lại để độc lập). */
function install(trackClips: AnyClip[]): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "T4 test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: trackClips }],
  };
  useStore.setState({
    spec: spec as never,
    selection: [],
    playhead: 0,
  });
}

function trackClips(): AnyClip[] {
  const track = useStore.getState().spec.tracks.find((t) => t.id === "v1");
  if (!track) throw new Error("mất track v1");
  return [...(track.clips as unknown as AnyClip[])].sort(
    (a, b) => a.start - b.start,
  );
}

function curveOf(c: AnyClip): SpeedCurve {
  const curve = c["speedKeyframes"] as SpeedCurve | undefined;
  if (!curve) throw new Error(`clip ${c.id} không có speedKeyframes`);
  return curve;
}

/** Track chuẩn: prev — main (curve + transition 2 đầu) — next. */
function standardTrack(): AnyClip[] {
  return [
    videoClip({
      id: "prev", start: 0, duration: 4, in: 0, out: 4,
      transitionOut: fade(0.5),
    }),
    videoClip({
      id: "main", start: 4, duration: 4, in: 0, out: 8,
      speedKeyframes: LIN,
      transitionIn: fade(0.5),
      transitionOut: fade(0.5),
    }),
    videoClip({
      id: "next", start: 8, duration: 4, in: 0, out: 4,
      transitionIn: fade(0.5),
    }),
  ];
}

function assertValidatorOk(what: string): void {
  const spec = useStore.getState().spec;
  const v = validateSpec(spec) as { ok: boolean; errors: string[] };
  if (!v.ok)
    throw new Error(`${what}: validateSpec lỗi: ${JSON.stringify(v.errors)}`);
}

// ===========================================================================
// S1. Split curve + transition qua store thật
// ===========================================================================
console.log("== S1. splitAtPlayhead: curve + transition ==");

test("S1: 2 nửa giữ đúng đoạn curve (đánh giá + tích phân ramp)", () => {
  install(standardTrack());
  useStore.setState({
    selection: [{ trackId: "v1", clipId: "main" }],
    playhead: 6,
  });
  const ok = useStore.getState().splitAtPlayhead();
  if (!ok) throw new Error("splitAtPlayhead trả false");
  const [prev, left, right, next] = trackClips();
  eq(prev.id, "prev", "thứ tự 0");
  eq(left.id, "main", "nửa trái giữ id gốc");
  eq(next.id, "next", "thứ tự 3");
  approx(left.duration, 2, 1e-9, "left.duration");
  approx(right.duration, 2, 1e-9, "right.duration");
  approx(left.start, 4, 1e-9, "left.start");
  approx(right.start, 6, 1e-9, "right.start");
  // Điểm cắt nguồn theo tích phân ramp: in + ∫[0,2] = 2.5.
  approx(left["in"] as number, 0, 1e-9, "left.in");
  approx(left["out"] as number, 2.5, 1e-9, "left.out = cutSrc");
  approx(right["in"] as number, 2.5, 1e-9, "right.in = cutSrc");
  approx(right["out"] as number, 8, 1e-9, "right.out giữ nguyên");
  // Đánh giá từng điểm: nửa trái = gốc trên [0,2], nửa phải = gốc dịch 2s.
  const lc = curveOf(left);
  const rc = curveOf(right);
  for (const t of [0, 0.5, 1, 1.5, 2]) {
    approx(speedAt(lc, t), speedAt(LIN, t), 1e-9, `left speedAt(${t})`);
    approx(speedAt(rc, t), speedAt(LIN, 2 + t), 1e-9, `right speedAt(${t})`);
  }
  // Tích phân: 2 nửa cộng lại đúng bằng nguồn tiêu thụ gốc 6s.
  approx(sourcePosAt(lc, 2), 2.5, 1e-9, "nguồn nửa trái");
  approx(sourcePosAt(rc, 2), 3.5, 1e-9, "nguồn nửa phải");
  approx(sourcePosAt(lc, 2) + sourcePosAt(rc, 2), 6, 1e-9, "tổng 2 nửa");
  // Mọi keyframe nằm trong khoảng của nửa mình (validator chặn t ngoài).
  for (const k of lc.keyframes)
    if (k.t < -1e-9 || k.t > 2 + 1e-9) throw new Error(`left keyframe mồ côi t=${k.t}`);
  for (const k of rc.keyframes)
    if (k.t < -1e-9 || k.t > 2 + 1e-9) throw new Error(`right keyframe mồ côi t=${k.t}`);
});

test("S1: transition ngoài giữ vị trí, biên trong về none, validator pass", () => {
  install(standardTrack());
  useStore.setState({
    selection: [{ trackId: "v1", clipId: "main" }],
    playhead: 6,
  });
  useStore.getState().splitAtPlayhead();
  const [prev, left, right, next] = trackClips();
  eq(left["transitionIn"], fade(0.5), "left giữ transitionIn gốc");
  eq(left["transitionOut"], { type: "none", duration: 0 }, "biên trong trái = none");
  eq(right["transitionIn"], { type: "none", duration: 0 }, "biên trong phải = none");
  eq(right["transitionOut"], fade(0.5), "right giữ transitionOut gốc");
  eq(prev["transitionOut"], fade(0.5), "clip kề trước không đổi");
  eq(next["transitionIn"], fade(0.5), "clip kề sau không đổi");
  assertValidatorOk("S1 split");
});

// ===========================================================================
// S2. Split sát mép: nửa mới ngắn hơn transition ngoài
// ===========================================================================
console.log("== S2. split sát mép: kẹp transition ngoài ==");

test("S2a: tách ở 4.3 (nửa trái 0.3s): cặp prev→left kẹp về 0.3, validator pass", () => {
  install(standardTrack());
  useStore.setState({
    selection: [{ trackId: "v1", clipId: "main" }],
    playhead: 4.3,
  });
  if (!useStore.getState().splitAtPlayhead()) throw new Error("split false");
  const [prev, left, right, next] = trackClips();
  approx(left.duration, 0.3, 1e-9, "left.duration");
  approx(
    (left["transitionIn"] as { duration: number }).duration, 0.3, 1e-9,
    "left.transitionIn kẹp",
  );
  approx(
    (prev["transitionOut"] as { duration: number }).duration, 0.3, 1e-9,
    "prev.transitionOut kẹp theo (giữ cặp bằng nhau)",
  );
  eq(right["transitionOut"], fade(0.5), "cặp phải đủ dài, không đổi");
  eq(next["transitionIn"], fade(0.5), "next không đổi");
  assertValidatorOk("S2a split");
});

test("S2b: tách ở 7.7 (nửa phải 0.3s): cặp right→next kẹp về 0.3, validator pass", () => {
  install(standardTrack());
  useStore.setState({
    selection: [{ trackId: "v1", clipId: "main" }],
    playhead: 7.7,
  });
  if (!useStore.getState().splitAtPlayhead()) throw new Error("split false");
  const [prev, left, right, next] = trackClips();
  approx(right.duration, 0.3, 1e-9, "right.duration");
  approx(
    (right["transitionOut"] as { duration: number }).duration, 0.3, 1e-9,
    "right.transitionOut kẹp",
  );
  approx(
    (next["transitionIn"] as { duration: number }).duration, 0.3, 1e-9,
    "next.transitionIn kẹp theo (giữ cặp bằng nhau)",
  );
  eq(left["transitionIn"], fade(0.5), "cặp trái đủ dài, không đổi");
  eq(prev["transitionOut"], fade(0.5), "prev không đổi");
  assertValidatorOk("S2b split");
});

// ===========================================================================
// S3 + S4. patchClip đổi duration
// ===========================================================================
console.log("== S3/S4. patchClip duration + hồi quy ==");

function mainClip(): AnyClip {
  const clips = trackClips();
  const main = clips.find((c) => c.id === "main");
  if (!main) throw new Error("mất clip main");
  return main;
}

test("S3: patchClip duration 4 -> 2.5 cắt curve về [0, 2.5) kèm điểm biên", () => {
  install(standardTrack());
  useStore.getState().patchClip("v1", "main", { duration: 2.5 } as never);
  const main = mainClip();
  approx(main.duration, 2.5, 1e-9, "duration mới");
  approx(main.start, 4, 1e-9, "start không đổi");
  const curve = curveOf(main);
  eq(curve.keyframes.length, 2, "số điểm sau cắt");
  approx(curve.keyframes[1].t, 2.5, 1e-9, "điểm biên t");
  approx(curve.keyframes[1].v, 1.625, 1e-9, "điểm biên v = speedAt gốc(2.5)");
  for (const t of [0, 1, 2, 2.5]) {
    approx(speedAt(curve, t), speedAt(LIN, t), 1e-9, `speedAt(${t}) khớp gốc`);
  }
  if (curve.keyframes.some((k) => k.t > 2.5 + 1e-9))
    throw new Error("còn keyframe vượt duration mới");
});

test("S4a: patch không đụng duration (opacity) giữ nguyên curve", () => {
  install(standardTrack());
  useStore.getState().patchClip("v1", "main", { opacity: 0.5 } as never);
  eq(curveOf(mainClip()), LIN, "curve không đổi");
});

test("S4b: clip không có curve + patch duration -> không tự mọc curve", () => {
  install([
    videoClip({ id: "prev", start: 0, duration: 4, in: 0, out: 4 }),
    videoClip({ id: "main", start: 4, duration: 4, in: 0, out: 4 }),
  ]);
  useStore.getState().patchClip("v1", "main", { duration: 2.5 } as never);
  const main = mainClip();
  approx(main.duration, 2.5, 1e-9, "duration mới");
  if ("speedKeyframes" in main && main["speedKeyframes"] !== undefined)
    throw new Error("clip cũ không curve lại mọc speedKeyframes");
});

test("S4c: patch tự đặt speedKeyframes kèm duration -> dùng curve của patch nguyên vẹn", () => {
  install(standardTrack());
  const replacement: SpeedCurve = {
    keyframes: [
      { t: 0, v: 3, easing: "linear" },
      { t: 2.5, v: 3, easing: "linear" },
    ],
  };
  useStore.getState().patchClip("v1", "main", {
    duration: 2.5,
    speedKeyframes: replacement,
  } as never);
  eq(curveOf(mainClip()), replacement, "curve của patch, không cắt thêm");
});

test("S4d: kéo dài duration 4 -> 6 giữ nguyên curve (clamp ở biên)", () => {
  install(standardTrack());
  useStore.getState().patchClip("v1", "main", { duration: 6 } as never);
  const main = mainClip();
  approx(main.duration, 6, 1e-9, "duration mới");
  eq(curveOf(main), LIN, "curve không đổi khi kéo dài");
});

test("S4e: clip reverse + curve + patch duration -> giữ nguyên curve (đường cũ)", () => {
  const track = standardTrack();
  (track[1] as Record<string, unknown>)["reverse"] = true;
  install(track);
  useStore.getState().patchClip("v1", "main", { duration: 2.5 } as never);
  eq(curveOf(mainClip()), LIN, "reverse+curve: không nhận hành vi mới");
});

test("S4f: chỉ dời start (không đổi duration) giữ nguyên curve", () => {
  install(standardTrack());
  useStore.getState().patchClip("v1", "main", { start: 4.5 } as never);
  const main = mainClip();
  approx(main.start, 4.5, 1e-9, "start mới");
  eq(curveOf(main), LIN, "curve gắn thời gian output, không gắn vị trí");
});

// ===========================================================================
// S5. Hồi quy split nhánh tốc độ hằng
// ===========================================================================
console.log("== S5. hồi quy split tốc độ hằng ==");

test("S5: split clip không curve: vị trí transition như cũ, validator pass", () => {
  install([
    videoClip({
      id: "prev", start: 0, duration: 4, in: 0, out: 4,
      transitionOut: fade(0.5),
    }),
    videoClip({
      id: "main", start: 4, duration: 4, in: 0, out: 4,
      transitionIn: fade(0.5), transitionOut: fade(0.5),
    }),
    videoClip({
      id: "next", start: 8, duration: 4, in: 0, out: 4,
      transitionIn: fade(0.5),
    }),
  ]);
  useStore.setState({
    selection: [{ trackId: "v1", clipId: "main" }],
    playhead: 6,
  });
  if (!useStore.getState().splitAtPlayhead()) throw new Error("split false");
  const [, left, right] = trackClips();
  approx(left.duration, 2, 1e-9, "left.duration (tốc độ hằng)");
  approx(right.duration, 2, 1e-9, "right.duration (tốc độ hằng)");
  approx(left["in"] as number, 0, 1e-9, "left.in");
  approx(left["out"] as number, 2, 1e-9, "left.out");
  approx(right["in"] as number, 2, 1e-9, "right.in");
  approx(right["out"] as number, 4, 1e-9, "right.out");
  eq(left["transitionIn"], fade(0.5), "left giữ transitionIn");
  eq(left["transitionOut"], { type: "none", duration: 0 }, "biên trong trái none");
  eq(right["transitionIn"], { type: "none", duration: 0 }, "biên trong phải none");
  eq(right["transitionOut"], fade(0.5), "right giữ transitionOut");
  assertValidatorOk("S5 split");
});

console.log(`\n${pass} pass, ${fail} fail${fail ? ` (${failedNames.join(", ")})` : ""}`);
if (fail > 0) process.exitCode = 1;
