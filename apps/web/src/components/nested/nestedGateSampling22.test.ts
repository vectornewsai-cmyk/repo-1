/**
 * nestedGateSampling22.test.ts — Test thật cho Phase 9 đợt 22 (luồng B):
 * cổng lấy mẫu tốc độ hợp chặt hơn trong nestUtils.ts.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/nested/nestedGateSampling22.test.ts
 *
 * Chỉ test logic thuần trong nestUtils.ts (không DOM/store). Mọi con số
 * suy bằng tay, không lấy từ code đang test (tránh kiểm chứng vòng tròn).
 * Riêng test B1 kèm bản sao đúng cổng cũ T2 (257 mẫu đều + knot, KHÔNG
 * cực trị bezier, KHÔNG chia nhỏ) để chứng minh cổng cũ bỏ sót còn cổng
 * mới chặn đúng — bản sao đó chỉ dùng để đối chứng, không phải code sản phẩm.
 *
 * Số tay cho B1 (đỉnh bezier hẹp):
 * - Outer duration 10, keyframes (0,1), (5.02,1,bezier [0.42,2,0.58,1.5]),
 *   (5.04,3.5), (5.05,1), (10,1); lá hằng 1.1.
 * - Cực trị bezier đoạn [5.02,5.04]: y'(u)/3 = 2.5u²−5u+2 = 0 →
 *   u = 1−√5/5 ≈ 0.55279; x(u) ≈ 0.54605 → t ≈ 5.03092; y(u) ≈ 1.4473 →
 *   v ≈ 1 + 2.5×1.4473 ≈ 4.618 → hợp × 1.1 ≈ 5.08 > 4 (phải chặn).
 * - Cổng cũ: mẫu đều trên [0, τ(10)≈9.9425] bước ≈ 0.03884 rơi vào
 *   5.01036 và 5.0492 (đều ngoài đoạn [5.02,5.04]), knot cho tối đa
 *   3.5×1.1 = 3.85 < 4 → cổng cũ CHO QUA (bản sao trong test tự chứng
 *   minh điều này, không dựa vào tính tay về lưới mẫu).
 */
import {
  checkTwoLevelLeafCurve,
  checkTwoLevelOuterCurve,
} from "./nestUtils.ts";
import type { Clip, NestedClip, SpeedCurve, VideoSpec } from "@repo-1/video-spec";
import { sourcePosAt, speedAt } from "@repo-1/video-spec";

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

function constCurve(v: number, duration: number): SpeedCurve {
  return {
    keyframes: [
      { t: 0, v, easing: "linear" },
      { t: duration, v, easing: "linear" },
    ],
  };
}

function linCurve(points: [number, number][]): SpeedCurve {
  return { keyframes: points.map(([t, v]) => ({ t, v, easing: "linear" as const })) };
}

/** τ ngược bản cũ (bisection 80 vòng trên sourcePosAt) — chỉ để đối chứng B1. */
function oldTau(curve: SpeedCurve, duration: number, childOffset: number): number {
  const total = sourcePosAt(curve, duration);
  if (childOffset <= 0) return childOffset / speedAt(curve, 0);
  if (childOffset >= total) return duration + (childOffset - total) / speedAt(curve, duration);
  let lo = 0;
  let hi = duration;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sourcePosAt(curve, mid) < childOffset) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Bản sao đúng cổng cũ T2: 257 mẫu đều + knot, KHÔNG cực trị bezier, KHÔNG chia nhỏ. */
function oldGateSampled(
  outerCurve: SpeedCurve,
  outerDuration: number,
  outerIn: number,
  innerCurve: SpeedCurve,
  leafStart: number,
  leafDuration: number,
): boolean {
  try {
    const total = sourcePosAt(outerCurve, outerDuration);
    const winStart = outerIn;
    const winEnd = outerIn + total;
    const vs = Math.max(leafStart, winStart);
    const ve = Math.min(leafStart + leafDuration, winEnd);
    if (ve - vs <= 1e-6) return true;
    const leftCut = vs - leafStart;
    const tStart = oldTau(outerCurve, outerDuration, vs - outerIn);
    const tEnd = oldTau(outerCurve, outerDuration, ve - outerIn);
    if (!(tEnd > tStart)) return false;
    const base = sourcePosAt(outerCurve, tStart);
    const points: number[] = [];
    const N = 256;
    for (let i = 0; i <= N; i++) points.push(tStart + (i / N) * (tEnd - tStart));
    for (const k of outerCurve.keyframes) {
      if (k.t > tStart && k.t < tEnd) points.push(k.t);
    }
    const visible = ve - vs;
    for (const k of innerCurve.keyframes) {
      if (k.t > leftCut && k.t < leftCut + visible) {
        const T = oldTau(outerCurve, outerDuration, (vs - outerIn) + (k.t - leftCut));
        if (T > tStart && T < tEnd) points.push(T);
      }
    }
    for (const T of points) {
      const x = leftCut + (sourcePosAt(outerCurve, T) - base);
      const c = speedAt(outerCurve, T) * speedAt(innerCurve, x);
      if (!Number.isFinite(c) || c < 0.25 - 1e-9 || c > 4 + 1e-9) return false;
    }
    return true;
  } catch {
    return false;
  }
}

console.log("== đợt 22 B: cổng lấy mẫu tốc độ hợp ==");

// --- B1: đỉnh bezier hẹp cổng cũ bỏ sót, cổng mới chặn đúng ---
const BEZIER_PEAK_OUTER: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 5.02, v: 1, easing: "bezier", bezier: [0.42, 2, 0.58, 1.5] },
    { t: 5.04, v: 3.5, easing: "linear" },
    { t: 5.05, v: 1, easing: "linear" },
    { t: 10, v: 1, easing: "linear" },
  ],
};

test("B1: đỉnh bezier hẹp (đỉnh ≈ 5.08 > 4) — cổng cũ CHO QUA, cổng mới CHẶN", () => {
  const leafCurve = constCurve(1.1, 10);
  // Đối chứng cổng cũ bằng bản sao: phải cho qua thì test mới có ý nghĩa.
  assert(
    oldGateSampled(BEZIER_PEAK_OUTER, 10, 0, leafCurve, 0, 10) === true,
    "bản sao cổng cũ phải cho qua fixture này (nếu không, fixture không chứng minh được lỗ hổng)",
  );
  const leaf = video("L", 0, 10, { speedKeyframes: leafCurve });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [leaf] }]), 10);
  const check = checkTwoLevelOuterCurve(top, BEZIER_PEAK_OUTER);
  assert(check.ok === false, `cổng mới phải chặn đỉnh hẹp, nhận ${JSON.stringify(check)}`);
  assert(check.reason.includes("Tốc độ hợp"), `reason phải dùng message lấy mẫu cũ: ${check.reason}`);
});

// --- B2: case hợp lệ cũ vẫn cho qua (không chặn oan) ---
test("B2: cặp hợp lệ 1→2 × 1→1.5 (kiểu C6 đợt 21) vẫn cho qua", () => {
  const leafCurve = linCurve([[0, 1], [4, 1.5]]);
  const leaf = video("L", 0, 4, { speedKeyframes: leafCurve });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [leaf] }]), 4);
  const outer = linCurve([[0, 1], [4, 2]]);
  const check = checkTwoLevelOuterCurve(top, outer);
  assert(check.ok === true, `cặp hợp lệ phải cho qua, nhận ${JSON.stringify(check)}`);
});

test("B2b: bezier nhẹ (y trong [0,1], đơn điệu) 1→2 × 1→1.5 vẫn cho qua", () => {
  const leafCurve = linCurve([[0, 1], [4, 1.5]]);
  const leaf = video("L", 0, 4, { speedKeyframes: leafCurve });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [leaf] }]), 4);
  const outer: SpeedCurve = {
    keyframes: [
      { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
      { t: 4, v: 2, easing: "linear" },
    ],
  };
  const check = checkTwoLevelOuterCurve(top, outer);
  assert(check.ok === true, `cặp hợp lệ phải cho qua, nhận ${JSON.stringify(check)}`);
});

// --- B3: lá sâu, lấy mẫu toàn chuỗi (đường OuterCurve) ---
test("B3: lá sâu 3 tầng, ngoài 1.5 × giữa 2 × lá 1.5 = 4.5 > 4 — cổng mới CHẶN (biên tích đều qua: 3 và 2.25)", () => {
  const leafCurve = constCurve(1.5, 10);
  const leaf = video("L", 0, 10, { speedKeyframes: leafCurve });
  const mid = nested("mid", subSpecWith([{ id: "v-mid", clips: [leaf] }]), 10, {
    trim: { in: 0, out: 20 },
    speedKeyframes: constCurve(2, 10),
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [mid as unknown as Clip] }]), 10);
  const check = checkTwoLevelOuterCurve(top, constCurve(1.5, 10));
  assert(check.ok === false, `tích toàn chuỗi 4.5 phải bị chặn, nhận ${JSON.stringify(check)}`);
  assert(check.reason.includes("Tốc độ hợp"), `reason phải dùng message lấy mẫu: ${check.reason}`);
});

test("B3b: cùng cây B3 nhưng ngoài 1.0 → tích 3.0 — cho qua (chứng tỏ (b) chứ không phải (a) chặn ở B3)", () => {
  const leafCurve = constCurve(1.5, 10);
  const leaf = video("L", 0, 10, { speedKeyframes: leafCurve });
  const mid = nested("mid", subSpecWith([{ id: "v-mid", clips: [leaf] }]), 10, {
    trim: { in: 0, out: 20 },
    speedKeyframes: constCurve(2, 10),
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [mid as unknown as Clip] }]), 10);
  const check = checkTwoLevelOuterCurve(top, constCurve(1.0, 10));
  assert(check.ok === true, `tích 3.0 phải cho qua, nhận ${JSON.stringify(check)}`);
});

// --- B4: lá sâu, cặp trong-cùng × lá (bước render trong-cùng) ---
test("B4: ngoài 0.3 × giữa 3.5 × lá 3.5 — cặp trong-cùng 12.25 CHẶN dù tích toàn chuỗi 3.675 qua", () => {
  const leafCurve = constCurve(3.5, 10);
  const leaf = video("L", 0, 10, { speedKeyframes: leafCurve });
  const mid = nested("mid", subSpecWith([{ id: "v-mid", clips: [leaf] }]), 10, {
    trim: { in: 0, out: 35 },
    speedKeyframes: constCurve(3.5, 10),
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [mid as unknown as Clip] }]), 10);
  const check = checkTwoLevelOuterCurve(top, constCurve(0.3, 10));
  assert(check.ok === false, `cặp trong-cùng 12.25 phải bị chặn (render bước trong fail), nhận ${JSON.stringify(check)}`);
});

// --- B5: lá sâu, đường LeafCurve ---
test("B5: đường lá — tổ tiên 1.2 × giữa 2 × lá 1.8 = 4.32 > 4 — CHẶN", () => {
  const topLevel = nested("top", subSpecWith([{ id: "v-t", clips: [] }]), 10, {
    trim: { in: 0, out: 12 },
    speedKeyframes: constCurve(1.2, 10),
  });
  const midLevel = nested("mid", subSpecWith([{ id: "v-m", clips: [] }]), 10, {
    trim: { in: 0, out: 20 },
    speedKeyframes: constCurve(2, 10),
  });
  const leaf = video("L", 0, 10);
  const check = checkTwoLevelLeafCurve([topLevel, midLevel], leaf, constCurve(1.8, 10));
  assert(check.ok === false, `tích toàn chuỗi 4.32 phải bị chặn, nhận ${JSON.stringify(check)}`);
});

test("B5b: đường lá — tổ tiên 1.2 × giữa 2 × lá 1.5 = 3.6 — cho qua", () => {
  const topLevel = nested("top", subSpecWith([{ id: "v-t", clips: [] }]), 10, {
    trim: { in: 0, out: 12 },
    speedKeyframes: constCurve(1.2, 10),
  });
  const midLevel = nested("mid", subSpecWith([{ id: "v-m", clips: [] }]), 10, {
    trim: { in: 0, out: 20 },
    speedKeyframes: constCurve(2, 10),
  });
  const leaf = video("L", 0, 10);
  const check = checkTwoLevelLeafCurve([topLevel, midLevel], leaf, constCurve(1.5, 10));
  assert(check.ok === true, `tích 3.6 phải cho qua, nhận ${JSON.stringify(check)}`);
});

// --- B6: lá sâu hợp lệ, đường OuterCurve ---
test("B6: lá sâu ngoài 1.2 × giữa 1.5 × lá 1.5 = 2.7 — cho qua", () => {
  const leafCurve = constCurve(1.5, 10);
  const leaf = video("L", 0, 10, { speedKeyframes: leafCurve });
  const mid = nested("mid", subSpecWith([{ id: "v-mid", clips: [leaf] }]), 10, {
    trim: { in: 0, out: 15 },
    speedKeyframes: constCurve(1.5, 10),
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [mid as unknown as Clip] }]), 10);
  const check = checkTwoLevelOuterCurve(top, constCurve(1.2, 10));
  assert(check.ok === true, `tích 2.7 phải cho qua, nhận ${JSON.stringify(check)}`);
});

// --- B7: fallback khi chain không ánh xạ được (không crash, không chặn oan) ---
test("B7: tầng giữa trim lệch tích phân (∫=20 nhưng trim out=10) → sampler fallback, cổng cho qua theo biên tích", () => {
  const leafCurve = constCurve(1.1, 10);
  const leaf = video("L", 0, 10, { speedKeyframes: leafCurve });
  const mid = nested("mid", subSpecWith([{ id: "v-mid", clips: [leaf] }]), 10, {
    trim: { in: 0, out: 10 },
    speedKeyframes: constCurve(2, 10),
  });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [mid as unknown as Clip] }]), 10);
  const check = checkTwoLevelOuterCurve(top, constCurve(1.1, 10));
  assert(check.ok === true, `fallback phải cho qua (biên tích 2.2 và 1.21 đều qua), nhận ${JSON.stringify(check)}`);
});

// --- B9: đỉnh tương tác tích thuần linear (chứng minh chia nhỏ thích ứng, không dính bezier) ---
// Outer 1→3.5 trên [4,4.02] trong khi inner 3.5→1 trên đoạn map [4,4.045]:
// tại hai đầu knot tích đều 3.5, nhưng giữa đoạn tích vọt lên ≈ 5.86
// (tính tay tại T=4.01089: s_o≈2.3613, x≈4.01830, s_i≈2.4833, tích≈5.863).
// Lưới đều cổng cũ chỉ rơi vào T≈4.00065 trong đoạn (tích ≈ 3.74) nên
// bỏ sót; cổng mới chặn nhờ chia nhỏ thích ứng (không có cực trị bezier
// nào ở đây nên đây là bằng chứng riêng cho chia nhỏ).
test("B9: đỉnh tương tác tích linear (đỉnh ≈ 5.86) — cổng cũ CHO QUA, cổng mới CHẶN", () => {
  const outer = linCurve([[0, 1], [4, 1], [4.02, 3.5], [10, 3.5]]);
  const leafCurve = linCurve([[0, 3.5], [4, 3.5], [4.045, 1], [10, 1]]);
  assert(
    oldGateSampled(outer, 10, 0, leafCurve, 0, 10) === true,
    "bản sao cổng cũ phải cho qua fixture này",
  );
  const leaf = video("L", 0, 10, { speedKeyframes: leafCurve });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [leaf] }]), 10);
  const check = checkTwoLevelOuterCurve(top, outer);
  assert(check.ok === false, `chia nhỏ phải chặn đỉnh tương tác, nhận ${JSON.stringify(check)}`);
});

// --- B8: chi phí lấy mẫu (đo thật, ngưỡng chống phình) ---
test("B8: stress 121-keyframe bezier ngoài × trong, duration 60s — hoàn thành trong 60s", () => {
  const kfsOuter = [];
  const kfsInner = [];
  for (let i = 0; i <= 120; i++) {
    const t = i * 0.5;
    kfsOuter.push({ t, v: i % 2 === 0 ? 1 : 2, easing: "bezier" as const, bezier: [0.25, 0.1, 0.25, 1] as [number, number, number, number] });
    kfsInner.push({ t, v: i % 2 === 0 ? 1 : 1.5, easing: "linear" as const });
  }
  const leafCurve: SpeedCurve = { keyframes: kfsInner };
  const leaf = video("L", 0, 60, { speedKeyframes: leafCurve });
  const top = nested("top", subSpecWith([{ id: "v-top", clips: [leaf] }]), 60);
  const outer: SpeedCurve = { keyframes: kfsOuter };
  const start = Date.now();
  const check = checkTwoLevelOuterCurve(top, outer);
  const ms = Date.now() - start;
  console.log(`      (stress: ${ms}ms, ok=${check.ok})`);
  assert(typeof check.ok === "boolean", "phải trả verdict boolean");
  assert(ms < 60000, `stress phải xong trong 60s, thực tế ${ms}ms`);
});

console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
