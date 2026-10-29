/**
 * nestedCurveG2.test.ts — Test thật cho Phase 9 đợt 19 (luồng G2):
 * (a) comment lỗi thời đã sửa — không test được bằng code, xem LIMITS;
 * (b) guard nguồn của cha dời xuống hàm thuần R5;
 * (c) fail-fast hợp curve hai tầng (spec đợt 18 §5 — KHÔNG hợp sai);
 * (d) hai chế độ sửa curve của nested + báo lệch tích phân (thuần).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/nested/nestedCurveG2.test.ts
 *
 * Chỉ test logic thuần trong nestUtils.ts (không DOM/store — phần nối
 * store thật nằm ở store.nestedCurve19.test.ts, bundle esbuild như mẫu
 * store.nestedGuard). Mọi con số suy bằng tay, không lấy từ code đang
 * test (tránh kiểm chứng vòng tròn):
 * - Curve tuyến tính 1→2 trên [0,4]: ∫₀⁴ = (1+2)/2 × 4 = 6.
 * - Curve tuyến tính 1→2, nguồn dài 6 → đảo tích phân ra D = 4.
 * - Curve hằng 1 trên [0,4]: ∫ = 4.
 */
import {
  applyNestedCurveFixedDuration,
  applyNestedCurveFixedTrim,
  nestedCurveExpectedOut,
  nestedCurveOutMismatch,
  nestedSubtreeHasSpeedCurve,
  updateNestedDeepInnerClip,
  updateNestedInnerClip,
  type NestedDeepPatch,
} from "./nestUtils.ts";
import type { Clip, NestedClip, SpeedCurve, VideoSpec } from "@repo-1/video-spec";

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

function video(id: string, start: number, duration: number, extra?: Record<string, unknown>): Clip {
  return {
    kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration,
    ...(extra ?? {}),
  } as unknown as Clip;
}

function nested(
  id: string,
  subSpec: VideoSpec,
  duration: number,
  extra?: Record<string, unknown>,
): NestedClip {
  return {
    kind: "nested", id, start: 0, duration, speed: 1, subSpec,
    ...(extra ?? {}),
  } as unknown as NestedClip;
}

function subSpecWith(tracks: { id: string; clips: Clip[] }[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: tracks.map((t) => ({ id: t.id, kind: "video", clips: t.clips })),
  } as unknown as VideoSpec;
}

/** Nested 1 tầng trên track v1, để gọi updateNestedInnerClip (R5). */
function specTop(top: NestedClip): VideoSpec {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  } as unknown as VideoSpec;
}

const CURVE_1_TO_2: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};
const CURVE_CONST_1: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 1, easing: "linear" },
  ],
};

// ===========================================================================
// (b) Guard nguồn của cha trong hàm thuần R5
// ===========================================================================
console.log("== (b) guard R5 trong hàm thuần ==");

test("B1: trim [0,4), lá duy nhất 4→2 → thuần chặn, error nói rõ trim.out", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 4)] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const res = updateNestedInnerClip(specTop(top), "v1", "n1", "it1", "c1", { duration: 2 });
  assert("error" in res, "phải chặn");
  if ("error" in res) assert(res.error.includes("trim.out"), `error phải nói trim.out: ${res.error}`);
});

test("B2: trim [0,4), track khác vẫn end 4 → thuần cho qua, lá còn 2", () => {
  const top = nested(
    "n1",
    subSpecWith([
      { id: "it1", clips: [video("c1", 0, 4)] },
      { id: "it2", clips: [video("a1", 0, 4)] },
    ]),
    4,
    { trim: { in: 0, out: 4 } },
  );
  const res = updateNestedInnerClip(specTop(top), "v1", "n1", "it1", "c1", { duration: 2 });
  assert(!("error" in res), `phải cho qua, nhận ${JSON.stringify(res)}`);
  if (!("error" in res)) eq(res.nested.subSpec.tracks[0].clips[0].duration, 2, "lá còn 2");
});

test("B3: KHÔNG trim, lá duy nhất 4→2 → thuần chặn (nguồn đổi hướng nào cũng lệch)", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 4)] }]), 4);
  const res = updateNestedInnerClip(specTop(top), "v1", "n1", "it1", "c1", { duration: 2 });
  assert("error" in res, "phải chặn");
});

test("B4: KHÔNG trim, patch chỉ đổi text lá chữ → thuần cho qua, text đổi", () => {
  const textLeaf = { kind: "text", id: "t1", start: 0, duration: 4, text: "cũ" } as unknown as Clip;
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [textLeaf] }]), 4);
  const res = updateNestedInnerClip(specTop(top), "v1", "n1", "it1", "t1", { text: "mới" });
  assert(!("error" in res), `phải cho qua, nhận ${JSON.stringify(res)}`);
  if (!("error" in res)) {
    eq((res.nested.subSpec.tracks[0].clips[0] as unknown as { text: string }).text, "mới", "text đổi");
  }
});

test("B5: trim [0,4), thu ngắn lá đầu nhưng lá sau vẫn end 4 → cho qua", () => {
  const top = nested(
    "n1",
    subSpecWith([{ id: "it1", clips: [video("c1", 0, 2), video("c2", 2, 2)] }]),
    4,
    { trim: { in: 0, out: 4 } },
  );
  const res = updateNestedInnerClip(specTop(top), "v1", "n1", "it1", "c1", { duration: 1 });
  assert(!("error" in res), `phải cho qua (max vẫn 4 nhờ c2, dù c1-c2 hở gap — gap không thuộc guard này), nhận ${JSON.stringify(res)}`);
});

// ===========================================================================
// (d) Hai chế độ sửa curve của nested + mismatch
// ===========================================================================
console.log("== (d) fixed-duration / fixed-trim / mismatch ==");

test("D1: fixed-duration — D=4, trim [0,4), curve 1→2 → trim.out thành 6, D giữ 4", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 8)] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const next = applyNestedCurveFixedDuration(top, CURVE_1_TO_2);
  assert(next !== null, "phải tính được");
  if (next) {
    eq(next.duration, 4, "duration giữ nguyên");
    eq(next.trim, { in: 0, out: 6 }, "trim.out theo tích phân");
    eq(
      (next as unknown as { speedKeyframes: SpeedCurve }).speedKeyframes,
      CURVE_1_TO_2,
      "curve được ghi",
    );
  }
});

test("D2: fixed-trim — trim [0,6), curve 1→2 → duration thành 4, trim giữ nguyên", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 8)] }]), 8, {
    trim: { in: 0, out: 6 },
  });
  const next = applyNestedCurveFixedTrim(top, CURVE_1_TO_2);
  assert(next !== null, "phải tính được");
  if (next) {
    approx(next.duration, 4, 1e-6, "duration theo đảo tích phân");
    eq(next.trim, { in: 0, out: 6 }, "trim giữ nguyên");
  }
});

test("D3: fixed-trim với curve hằng 1, trim [0,4) → duration 4", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 8)] }]), 8, {
    trim: { in: 0, out: 4 },
  });
  const next = applyNestedCurveFixedTrim(top, CURVE_CONST_1);
  assert(next !== null, "phải tính được");
  if (next) approx(next.duration, 4, 1e-6, "duration");
});

test("D4: mismatch — D=4, trim.out 4, curve 1→2 → expected 6, diff -2", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 8)] }]), 4, {
    trim: { in: 0, out: 4 },
    speedKeyframes: CURVE_1_TO_2,
  } as unknown as Record<string, unknown>);
  const mm = nestedCurveOutMismatch(top);
  assert(mm !== null, "phải có mismatch");
  if (mm) {
    eq(mm.expectedOut, 6, "expectedOut");
    eq(mm.actualOut, 4, "actualOut");
    eq(mm.diff, -2, "diff");
  }
  eq(nestedCurveExpectedOut(top), 6, "expectedOut trực tiếp");
});

test("D5: không có curve → mismatch null, expected null", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 4)] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  eq(nestedCurveOutMismatch(top), null, "mismatch null");
  eq(nestedCurveExpectedOut(top), null, "expected null");
});

test("D6: fixed-duration trên nested reverse → null (không đoán)", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 8)] }]), 4, {
    trim: { in: 0, out: 4 },
    reverse: true,
  } as unknown as Record<string, unknown>);
  eq(applyNestedCurveFixedDuration(top, CURVE_1_TO_2), null, "reverse → null");
  eq(applyNestedCurveFixedTrim(top, CURVE_1_TO_2), null, "reverse → null");
});

test("D7: fixed-trim mà duration tính ra < 0.2s → null", () => {
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 8)] }]), 8, {
    trim: { in: 0, out: 0.1 },
  });
  eq(applyNestedCurveFixedTrim(top, CURVE_CONST_1), null, "duration 0.1 < 0.2 → null");
});

// ===========================================================================
// (c) Fail-fast hợp curve hai tầng
// ===========================================================================
console.log("== (c) fail-fast hai tầng ==");

test("C1: cây con có lá video mang curve → subtree true; không có → false", () => {
  const withCurve = nested(
    "n1",
    subSpecWith([{ id: "it1", clips: [video("c1", 0, 4, { speedKeyframes: CURVE_CONST_1 })] }]),
    4,
  );
  const without = nested("n1", subSpecWith([{ id: "it1", clips: [video("c1", 0, 4)] }]), 4);
  eq(nestedSubtreeHasSpeedCurve(withCurve), true, "có lá curve → true");
  eq(nestedSubtreeHasSpeedCurve(without), false, "không có → false");
});

test("C2: nested con mang curve trong cây → subtree true (đệ quy)", () => {
  const inner = nested("in", subSpecWith([{ id: "v", clips: [video("c1", 0, 4)] }]), 4, {
    speedKeyframes: CURVE_CONST_1,
  } as unknown as Record<string, unknown>);
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [inner as unknown as Clip] }]), 4);
  eq(nestedSubtreeHasSpeedCurve(top), true, "nested con có curve → true");
});

test("C3: lá text mang field speedKeyframes duck-typed → KHÔNG tính xung đột", () => {
  const textLeaf = {
    kind: "text", id: "t1", start: 0, duration: 4, text: "x", speedKeyframes: CURVE_CONST_1,
  } as unknown as Clip;
  const top = nested("n1", subSpecWith([{ id: "it1", clips: [textLeaf] }]), 4);
  eq(nestedSubtreeHasSpeedCurve(top), false, "text không có trục nguồn → false");
});

test("C4 (ĐỔI đợt 21 T2): deep patch đặt curve 1→3.5 lên lá mà top đã mang curve 1→2 (tích biên 7 > 4) → error nói rõ hai tầng", () => {
  const leaf = video("L", 0, 4);
  const inner = nested("in", subSpecWith([{ id: "v-in", clips: [leaf] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const mid = nested("mid", subSpecWith([{ id: "v-mid", clips: [inner as unknown as Clip] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [mid as unknown as Clip] }]), 4, {
    trim: { in: 0, out: 4 },
    speedKeyframes: CURVE_1_TO_2,
  } as unknown as Record<string, unknown>);
  const spec = specTop(top);
  // Vì sao đổi: cặp 1→2 × 1→1.5 cũ nay HỢP LỆ theo render R1 nên không
  // còn bị chặn (xem C6 mới); C4 giữ vai trò khóa case bị chặn bằng
  // cặp vượt khoảng 1→2 × 1→3.5 (tích biên keyframe 2 × 3.5 = 7 > 4).
  const patch: NestedDeepPatch = {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 3.5, easing: "linear" }] },
  };
  const res = updateNestedDeepInnerClip(spec, "v1", "top", ["mid", "in"], "v-in", "L", patch);
  assert("error" in res, "phải chặn cặp vượt khoảng");
  if ("error" in res) {
    assert(res.error.includes("hai tầng"), `error phải nói hai tầng: ${res.error}`);
  }
});

test("C6 (MỚI đợt 21 T2): deep patch đặt curve 1→1.5 lên lá mà top đã mang curve 1→2 → cho qua (tích biên ≤ 3 < 4)", () => {
  const leaf = video("L", 0, 4);
  const inner = nested("in", subSpecWith([{ id: "v-in", clips: [leaf] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const mid = nested("mid", subSpecWith([{ id: "v-mid", clips: [inner as unknown as Clip] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [mid as unknown as Clip] }]), 4, {
    trim: { in: 0, out: 4 },
    speedKeyframes: CURVE_1_TO_2,
  } as unknown as Record<string, unknown>);
  const spec = specTop(top);
  const patch: NestedDeepPatch = {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1.5, easing: "linear" }] },
  };
  const res = updateNestedDeepInnerClip(spec, "v1", "top", ["mid", "in"], "v-in", "L", patch);
  assert(!("error" in res), `cặp hợp lệ phải cho qua, nhận ${JSON.stringify(res)}`);
});

test("C5: deep patch đặt curve lên lá mà tổ tiên KHÔNG mang curve → cho qua", () => {
  const leaf = video("L", 0, 4);
  const inner = nested("in", subSpecWith([{ id: "v-in", clips: [leaf] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [inner as unknown as Clip] }]), 4, {
    trim: { in: 0, out: 4 },
  });
  const spec = specTop(top);
  const patch: NestedDeepPatch = {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1.5, easing: "linear" }] },
  };
  const res = updateNestedDeepInnerClip(spec, "v1", "top", ["in"], "v-in", "L", patch);
  assert(!("error" in res), `phải cho qua, nhận ${JSON.stringify(res)}`);
});

console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
