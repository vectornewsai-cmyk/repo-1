/**
 * speedcurveTrim.test.ts — Test thật cho Phase 9 đợt 13 (luồng C5):
 * bezier 4 số + cắt keyframe thừa sau trim.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/speed/speedcurveTrim.test.ts
 *
 * Chỉ test logic thuần (không DOM/store):
 *  (1) bezier 4 số đánh giá đúng — kể cả y ngoài [0, 1] (overshoot chuẩn
 *      cubic-bezier) — qua applySpeedEasing/speedAt của speedcurve.ts;
 *  (2) trimSpeedKeyframes: trim phải cắt điểm thừa mà giữ điểm trong vùng,
 *      trim trái dịch t và cắt điểm rớt khỏi đầu, trim trái kéo dài chỉ
 *      dịch không cắt, không đổi gì khi không có điểm nào bị ảnh hưởng;
 *  (3) validator render chấp nhận bezier có y ngoài [0, 1] nhưng vẫn chặn
 *      x ngoài [0, 1] và bezier thiếu số (validate.js qua createRequire);
 *  (4) project cũ: keyframe easing bezier không kèm mảng bezier vẫn dùng
 *      đúng mặc định CSS ease (không vỡ, không đổi hành vi cũ).
 *
 * Giá trị kỳ vọng bezier lấy từ công thức cubic-bezier chuẩn:
 * ease (0.25, 0.1, 0.25, 1) tại p=0.5 → y ≈ 0.8024 (giá trị CSS ease
 * quen thuộc); overshoot (0.25, 2, 0.75, -1) tại p=0.25 → y ≈ 0.7235
 * (vượt xa 0.25 — chứng tỏ y=2 được áp dụng thật, không bị kẹp về [0, 1]).
 */
import {
  applySpeedEasing,
  cubicBezierY,
  DEFAULT_SPEED_BEZIER,
  speedAt,
  trimSpeedKeyframes,
  type SpeedKeyframe,
} from "@repo-1/video-spec";
// Parity: index.ts re-export trỏ tới mirror .js; kiểm tra trực tiếp bản .ts
// để hai bản không lệch nhau (lệch là lỗi, không phải "bản nào cũng được").
import {
  trimSpeedKeyframes as trimSpeedKeyframesTs,
} from "../../../../../packages/video-spec/src/speedcurve.ts";
import { createRequire } from "node:module";

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

// --- (1) Bezier 4 số đánh giá đúng ---

test("bezier mặc định CSS ease: cubicBezierY(0.5) ≈ 0.8024", () => {
  approx(cubicBezierY(0.25, 0.1, 0.25, 1, 0.5), 0.8024, 1e-3);
});

test("bezier overshoot y ngoài [0, 1]: y=2 được áp dụng thật (0.7235 tại p=0.25)", () => {
  approx(cubicBezierY(0.25, 2, 0.75, -1, 0.25), 0.7235, 1e-3);
});

test("applySpeedEasing bezier đi qua speedAt: 1→3 với overshoot tại t=1 (p=0.25)", () => {
  // Đoạn [0, 4]: p = 1/4 → easing ≈ 0.7235 → v = 1 + 2*0.7235 ≈ 2.447.
  const v = speedAt(
    { keyframes: [kf(0, 1, "bezier", [0.25, 2, 0.75, -1]), kf(4, 3, "linear")] },
    1,
  );
  approx(v, 2.447, 1e-3, "speedAt(1)");
});

test("bezier đầu/cuối đoạn: p=0 → 0, p=1 → 1 kể cả y ngoài [0, 1]", () => {
  approx(applySpeedEasing("bezier", 0, [0.25, 2, 0.75, -1]), 0, 1e-9);
  approx(applySpeedEasing("bezier", 1, [0.25, 2, 0.75, -1]), 1, 1e-9);
});

// --- (2) trimSpeedKeyframes ---

test("trim phải: cắt điểm t > duration mới, giữ điểm trong vùng", () => {
  const r = trimSpeedKeyframes(
    [kf(0, 1, "linear"), kf(2, 1.5, "linear"), kf(4, 2, "linear")],
    0,
    3,
  );
  eq(r.keyframes.map((k) => k.t), [0, 2]);
  eq(r.dropped, 1);
  eq(r.changed, true);
});

test("trim phải: điểm đúng tại duration mới thì giữ (không cắt oan)", () => {
  const r = trimSpeedKeyframes([kf(0, 1, "linear"), kf(3, 2, "linear")], 0, 3);
  eq(r.keyframes.map((k) => k.t), [0, 3]);
  eq(r.dropped, 0);
  eq(r.changed, false);
});

test("trim trái cắt đầu: dịch t' = t - shift, cắt điểm rớt khỏi đầu", () => {
  // Clip 4s, trim trái 1s → duration mới 3s; điểm @0 và @0.5 rớt, @2 → @1, @4 → @3.
  const r = trimSpeedKeyframes(
    [kf(0, 1, "linear"), kf(0.5, 1.2, "linear"), kf(2, 1.5, "linear"), kf(4, 2, "linear")],
    1,
    3,
  );
  eq(r.keyframes.map((k) => k.t), [1, 3]);
  eq(r.keyframes.map((k) => k.v), [1.5, 2]);
  eq(r.dropped, 2);
  eq(r.changed, true);
});

test("trim trái kéo dài: chỉ dịch phải, không cắt điểm nào", () => {
  const r = trimSpeedKeyframes([kf(0, 1, "linear"), kf(4, 2, "linear")], -1, 5);
  eq(r.keyframes.map((k) => k.t), [1, 5]);
  eq(r.dropped, 0);
  eq(r.changed, true);
});

test("trim không chạm curve: changed=false, mảng giữ nguyên", () => {
  const kfs = [kf(0, 1, "linear"), kf(2, 2, "linear")];
  const r = trimSpeedKeyframes(kfs, 0, 4);
  eq(r.keyframes, kfs);
  eq(r.dropped, 0);
  eq(r.changed, false);
});

test("trim cắt hết: keyframes rỗng + dropped = tổng số điểm", () => {
  const r = trimSpeedKeyframes([kf(3, 1, "linear"), kf(4, 2, "linear")], 0, 2);
  eq(r.keyframes, []);
  eq(r.dropped, 2);
  eq(r.changed, true);
});

test("trim giữ nguyên easing/bezier/v của điểm còn lại", () => {
  const r = trimSpeedKeyframes(
    [kf(0, 1, "bezier", [0.25, 2, 0.75, -1]), kf(4, 2, "linear")],
    1,
    3,
  );
  eq(r.keyframes, [kf(3, 2, "linear")]);
  // Điểm @0 dịch thành @-1 → bị cắt; điểm @4 → @3 giữ nguyên easing.
  eq(r.dropped, 1);
});

test("trim trái giữ bezier của điểm còn lại (không mất mảng 4 số)", () => {
  const r = trimSpeedKeyframes(
    [kf(0, 1, "linear"), kf(2, 1.5, "bezier", [0.3, 1.4, 0.7, -0.4]), kf(4, 2, "linear")],
    1,
    3,
  );
  eq(r.keyframes.map((k) => k.t), [1, 3]);
  eq(r.keyframes[0].bezier, [0.3, 1.4, 0.7, -0.4]);
  eq(r.dropped, 1);
});

test("parity TS↔JS: trimSpeedKeyframes bản .ts và mirror .js cho kết quả giống hệt", () => {
  const cases: [SpeedKeyframe[], number, number][] = [
    [[kf(0, 1, "linear"), kf(2, 1.5, "linear"), kf(4, 2, "linear")], 0, 3],
    [[kf(0, 1, "linear"), kf(0.5, 1.2, "linear"), kf(2, 1.5, "linear"), kf(4, 2, "linear")], 1, 3],
    [[kf(0, 1, "linear"), kf(4, 2, "linear")], -1, 5],
    [[kf(0, 1, "bezier", [0.25, 2, 0.75, -1]), kf(4, 2, "linear")], 1, 3],
  ];
  for (const [kfs, shift, dur] of cases) {
    eq(trimSpeedKeyframesTs(kfs, shift, dur), trimSpeedKeyframes(kfs, shift, dur));
  }
});

test("speedAt sau trim phải: curve còn 1 điểm thì clamp về v điểm đó", () => {
  const r = trimSpeedKeyframes([kf(0, 0.5, "linear"), kf(4, 2, "linear")], 0, 2);
  eq(r.keyframes.map((k) => k.t), [0]);
  approx(speedAt({ keyframes: r.keyframes }, 2), 0.5, 1e-9);
});

// --- (3) Validator render ---

const requireCjs = createRequire(import.meta.url);
const { validateSpec } = requireCjs(
  "../../../../../server/render/src/validate.js",
) as { validateSpec: (spec: unknown) => { ok: boolean; errors: string[] } };

const videoTrack = (clips: unknown[]) => ({ id: "v1", kind: "video", clips });
const baseSpec = (tracks: unknown[]) => ({
  version: "0.2.0",
  meta: { name: "C5 test", width: 64, height: 64, fps: 30 },
  tracks,
});
const rampClip = (over: Record<string, unknown> = {}) => ({
  id: "c1", kind: "video", src: "av.mp4", start: 0, duration: 4, in: 0, out: 8,
  speedKeyframes: {
    keyframes: [
      { t: 0, v: 1, easing: "bezier", bezier: [0.25, 2, 0.75, -1] },
      { t: 4, v: 2, easing: "linear" },
    ],
  },
  ...over,
});

test("validator: bezier có y ngoài [0, 1] thì OK (overshoot hợp lệ)", () => {
  const v = validateSpec(baseSpec([videoTrack([rampClip()])]));
  assert(v.ok, `validator chặn oan: ${JSON.stringify(v.errors)}`);
});

test("validator: bezier x1 ngoài [0, 1] vẫn bị chặn", () => {
  const bad = rampClip({
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 1, easing: "bezier", bezier: [1.5, 0.5, 0.5, 0.5] },
        { t: 4, v: 2, easing: "linear" },
      ],
    },
  });
  assert(!validateSpec(baseSpec([videoTrack([bad])])).ok, "x1=1.5 phải lỗi");
});

test("validator: bezier thiếu số vẫn bị chặn", () => {
  const bad = rampClip({
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 1, easing: "bezier" },
        { t: 4, v: 2, easing: "linear" },
      ],
    },
  });
  assert(!validateSpec(baseSpec([videoTrack([bad])])).ok, "thiếu mảng bezier phải lỗi");
});

// --- (4) Project cũ: bezier không kèm mảng → mặc định CSS ease ---

test("project cũ: easing bezier không có mảng bezier dùng đúng DEFAULT_SPEED_BEZIER", () => {
  eq(DEFAULT_SPEED_BEZIER, [0.25, 0.1, 0.25, 1]);
  approx(applySpeedEasing("bezier", 0.5, undefined), 0.8024, 1e-3);
  approx(applySpeedEasing("bezier", 0.5, DEFAULT_SPEED_BEZIER), 0.8024, 1e-3);
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) {
  console.error(`Thua ở: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
