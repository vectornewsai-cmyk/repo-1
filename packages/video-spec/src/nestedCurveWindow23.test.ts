/**
 * nestedCurveWindow23.test.ts — Test cho Phase 9 đợt 23 (luồng G3):
 * composeNestedLeafWindow BIẾT speed curve (trước đây tuyến tính-only,
 * bỏ qua speedKeyframes — nợ ghi ở PHASE9_ROUND22_LIMITS.md §E).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, không cần tsc):
 *   node --test packages/video-spec/src/nestedCurveWindow23.test.ts
 *
 * Quy ước: mọi thời gian tính bằng GIÂY. Ngữ nghĩa curve = ngữ nghĩa
 * render đợt 18 §2 (đã dùng ở flatten đợt 22 E): duration của nested
 * mang curve là thời gian OUTPUT, cửa sổ con là [trim.in, trim.in +
 * ∫curve), ánh xạ ra ngoài qua τ = nghịch đảo tích phân (bisection
 * 80 vòng trong nestedRampTau). Các số kỳ vọng dưới đây đều suy tay
 * từ công thức đó, không lấy từ code:
 * - Ramp linear 1→3 trên duration 4: s(t) = 1 + t/2, ∫₀^τ = τ + τ²/4,
 *   τ(2) = −2 + √12 ≈ 1.4641016151377546, τ(4) = −2 + √20 ≈ 2.47213595499958
 *   (neo đợt 20, đã dùng ở nested.test.ts cho flatten).
 * - Ramp linear 0.25→4 trên duration 4: s(t) = 0.25 + 0.9375·t,
 *   ∫₀^T = 0.25·T + 0.46875·T².
 * - Ease-in 1→2 trên [0,4]: v(t) = 1 + (t/4)² (easing của keyframe đầu
 *   áp cho đoạn [t0, t1], xem speedAt), ∫₀^T = T + T³/48.
 * Mọi fixture curve đều đối chiếu thêm với flattenNested (đường đệ quy
 * độc lập với đường hợp hàm của compose) và đối chiếu .ts ↔ .js.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  composeNestedLeafWindow as composeTs,
  flattenNested as flattenTs,
} from "./nested.ts";
import {
  composeNestedLeafWindow as composeJs,
  flattenNested as flattenJs,
} from "./nested.js";
import { integrateSpeed, speedAt } from "./speedcurve.ts";
import type { NestedClip } from "./nested.ts";

// ---- helper tạo fixture (cùng mẫu nested.test.ts) ----

function meta() {
  return { name: "sub", width: 1280, height: 720, fps: 30 };
}

function videoLeaf(id: string, start: number, duration: number) {
  return {
    kind: "video",
    id,
    src: `${id}.mp4`,
    start,
    duration,
    in: 0,
    out: duration,
  };
}

function subSpecWith(clips: unknown[]): NestedClip["subSpec"] {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: [{ id: "t1", kind: "video", clips }],
  } as unknown as NestedClip["subSpec"];
}

function nested(
  over: Partial<NestedClip> & { id: string; subSpec: NestedClip["subSpec"] },
): NestedClip {
  return {
    kind: "nested",
    start: 0,
    duration: 0, // caller phải tự đặt đúng
    ...over,
  } as NestedClip;
}

/** τ(w) độc lập phía test: bisection trên integrateSpeed (không dùng nestedRampTau). */
function tauByBisection(
  curve: { keyframes: Array<{ t: number; v: number; easing: string }> },
  consumed: number,
  duration: number,
): number {
  if (consumed <= 0) return 0;
  const total = integrateSpeed(curve as never, 0, duration);
  if (consumed >= total) return duration;
  let lo = 0;
  let hi = duration;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (integrateSpeed(curve as never, 0, mid) < consumed) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function approx(a: number, b: number, tol: number, what: string): void {
  assert.ok(
    Math.abs(a - b) <= tol,
    `${what}: nhận ${a}, muốn ${b} ± ${tol}`,
  );
}

/**
 * Đối chiếu 1 cửa sổ compose: .ts ↔ .js (tol) và compose ↔ flatten
 * (cùng module, 1e-9 — flatten là đường đệ quy độc lập).
 */
function checkWindow(
  top: NestedClip,
  chain: NestedClip[],
  leaf: unknown,
  tolTsJs: number,
  what: string,
): NonNullable<ReturnType<typeof composeTs>> {
  const wTs = composeTs(top, chain, leaf as never);
  const wJs = composeJs(top, chain, leaf as never);
  assert.notEqual(wTs, null, `${what}: compose .ts null`);
  assert.notEqual(wJs, null, `${what}: compose .js null`);
  const a = wTs as NonNullable<typeof wTs>;
  const b = wJs as NonNullable<typeof wJs>;
  approx(a.absoluteStart, b.absoluteStart, tolTsJs, `${what} ts↔js absoluteStart`);
  approx(a.absoluteDuration, b.absoluteDuration, tolTsJs, `${what} ts↔js absoluteDuration`);
  approx(a.visibleStart, b.visibleStart, tolTsJs, `${what} ts↔js visibleStart`);
  approx(a.visibleEnd, b.visibleEnd, tolTsJs, `${what} ts↔js visibleEnd`);
  approx(a.cumulativeSpeed, b.cumulativeSpeed, tolTsJs, `${what} ts↔js cumulativeSpeed`);
  assert.deepEqual(a.path, b.path, `${what} ts↔js path`);
  assert.equal(a.depth, b.depth, `${what} ts↔js depth`);
  const leafId = (leaf as { id: string }).id;
  for (const [tag, flat] of [
    ["ts", flattenTs(top)],
    ["js", flattenJs(top)],
  ] as const) {
    const entry = flat.find((f) => f.clip.id === leafId);
    assert.notEqual(entry, undefined, `${what}: flatten ${tag} không có lá ${leafId}`);
    approx(entry!.absoluteStart, a.absoluteStart, 1e-9, `${what} flatten ${tag} absoluteStart`);
    approx(entry!.absoluteDuration, a.absoluteDuration, 1e-9, `${what} flatten ${tag} absoluteDuration`);
    assert.deepEqual(entry!.path, a.path, `${what} flatten ${tag} path`);
    assert.equal(entry!.depth, a.depth, `${what} flatten ${tag} depth`);
  }
  return a;
}

const RAMP_1_3 = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 3, easing: "linear" },
  ],
} as const;

// ---- (1) Curve hằng gộp về tốc độ hằng, curve thắng speed hằng ----

test("G3: curve hằng v=3 thắng speed field 2 (cùng luật flatten đợt 22 E)", () => {
  const leaf = videoLeaf("L", 2, 6);
  const top = nested({
    id: "T",
    subSpec: subSpecWith([leaf]),
    start: 10,
    duration: 4,
    trim: { in: 0, out: 12 },
    speed: 2, // bị curve bỏ qua
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 3, easing: "linear" },
        { t: 4, v: 3, easing: "linear" },
      ],
    },
  });
  const w = checkWindow(top, [], leaf, 0, "curve hằng v=3");
  approx(w.absoluteStart, 10 + 2 / 3, 1e-9, "absoluteStart");
  approx(w.absoluteDuration, 2, 1e-9, "absoluteDuration");
  approx(w.visibleStart, 0, 1e-9, "visibleStart");
  approx(w.visibleEnd, 6, 1e-9, "visibleEnd");
  approx(w.cumulativeSpeed, 3, 1e-9, "cumulativeSpeed = v của curve, không phải speed field");
});

test("G3: curve hằng biên v=4 thắng speed field 1", () => {
  const leaf = videoLeaf("L", 0, 8);
  const top = nested({
    id: "T",
    subSpec: subSpecWith([leaf]),
    start: 0,
    duration: 2,
    trim: { in: 0, out: 8 },
    speed: 1,
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 4, easing: "linear" },
        { t: 2, v: 4, easing: "linear" },
      ],
    },
  });
  const w = checkWindow(top, [], leaf, 0, "curve hằng v=4");
  approx(w.absoluteStart, 0, 1e-9, "absoluteStart");
  approx(w.absoluteDuration, 2, 1e-9, "absoluteDuration");
  approx(w.cumulativeSpeed, 4, 1e-9, "cumulativeSpeed");
});

// ---- (2) Linear 1→3 qua 2 tầng (neo đợt 20) ----

test("G3: ramp 1→3 ở tầng trong dưới nested hằng speed 2 (τ rồi chia 2)", () => {
  // Neo đợt 20: τ(2) = −2 + √12. Cửa sổ: top [0,16), inner [10,14) →
  // win' inner [0, ∫₀⁴=8], lá [0,2) → absoluteStart 5, duration τ(2)/2.
  const leaf = videoLeaf("L", 0, 2);
  const inner = nested({
    id: "B",
    subSpec: subSpecWith([leaf]),
    start: 10,
    duration: 4,
    trim: { in: 0, out: 8 },
    speedKeyframes: RAMP_1_3 as never,
  });
  const top = nested({
    id: "P",
    subSpec: subSpecWith([inner]),
    start: 0,
    duration: 8,
    speed: 2,
    trim: { in: 0, out: 16 },
  });
  const w = checkWindow(top, [inner], leaf, 1e-12, "ramp trong + hằng ngoài");
  const tau2 = -2 + Math.sqrt(12);
  approx(w.absoluteStart, 5, 1e-9, "absoluteStart");
  approx(w.absoluteDuration, tau2 / 2, 1e-9, "absoluteDuration");
  approx(w.visibleStart, 0, 1e-9, "visibleStart");
  approx(w.visibleEnd, 2, 1e-9, "visibleEnd");
  approx(w.cumulativeSpeed, 4, 1e-9, "cumulativeSpeed = 2 (ngoài) × 2 (trung bình ramp 8/4)");
});

test("G3: ramp 1→3 ở tầng ngoài + nested hằng trong (τ của cửa sổ ngoài)", () => {
  // Top ramp: lá qua mid [2,4) trong timeline nguồn của top →
  // absoluteStart = 10 + τ(2), absoluteEnd = 10 + τ(4), τ(4) = −2 + √20.
  const leaf = videoLeaf("L", 0, 2);
  const mid = nested({
    id: "M",
    subSpec: subSpecWith([leaf]),
    start: 2,
    duration: 2,
    speed: 1,
  });
  const top = nested({
    id: "B",
    subSpec: subSpecWith([mid]),
    start: 10,
    duration: 4,
    trim: { in: 0, out: 8 },
    speedKeyframes: RAMP_1_3 as never,
  });
  const w = checkWindow(top, [mid], leaf, 1e-12, "ramp ngoài + hằng trong");
  const tau2 = -2 + Math.sqrt(12);
  const tau4 = -2 + Math.sqrt(20);
  approx(w.absoluteStart, 10 + tau2, 1e-9, "absoluteStart");
  approx(w.absoluteDuration, tau4 - tau2, 1e-9, "absoluteDuration");
  approx(w.visibleStart, 0, 1e-9, "visibleStart");
  approx(w.visibleEnd, 2, 1e-9, "visibleEnd");
  approx(w.cumulativeSpeed, 2, 1e-9, "cumulativeSpeed = 2 (trung bình ramp) × 1");
});

// ---- (3) Ease-in + bezier ----

test("G3: ease-in 1→2 — speedAt neo 1.25 tại t=2, τ qua bisection độc lập", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 1, easing: "ease-in" },
      { t: 4, v: 2, easing: "linear" },
    ],
  } as const;
  // Neo ngữ nghĩa easing: v(2) = 1 + (2/4)² = 1.25.
  approx(speedAt(curve as never, 2), 1.25, 1e-9, "speedAt ease-in t=2");
  const leaf = videoLeaf("L", 1, 2);
  const top = nested({
    id: "T",
    subSpec: subSpecWith([leaf]),
    start: 5,
    duration: 4,
    trim: { in: 0, out: 16 / 3 }, // ∫₀⁴ (1 + (t/4)²) dt = 4 + 4/3
    speedKeyframes: curve as never,
  });
  const w = checkWindow(top, [], leaf, 1e-12, "ease-in 1→2");
  const tau1 = tauByBisection(curve as never, 1, 4);
  const tau3 = tauByBisection(curve as never, 3, 4);
  approx(w.absoluteStart, 5 + tau1, 1e-6, "absoluteStart");
  approx(w.absoluteDuration, tau3 - tau1, 1e-6, "absoluteDuration");
  approx(w.visibleStart, 0, 1e-9, "visibleStart");
  approx(w.visibleEnd, 2, 1e-9, "visibleEnd");
});

test("G3: bezier full-window — lá phủ đúng ∫ thì duration output = duration", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
      { t: 4, v: 3, easing: "linear" },
    ],
  } as const;
  const total = integrateSpeed(curve as never, 0, 4);
  assert.ok(total > 4 && total < 12, `tổng tiêu thụ bezier phải trong (4, 12), nhận ${total}`);
  const leaf = videoLeaf("L", 0, total);
  const top = nested({
    id: "T",
    subSpec: subSpecWith([leaf]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: total },
    speedKeyframes: curve as never,
  });
  const w = checkWindow(top, [], leaf, 1e-6, "bezier full-window");
  approx(w.absoluteStart, 0, 1e-6, "absoluteStart");
  approx(w.absoluteDuration, 4, 1e-6, "absoluteDuration = duration (τ của tổng tiêu thụ)");
});

// ---- (4) Biên 0.25 / 4 ----

test("G3: biên 0.25→4 — số giải tích bậc 2, không throw ở biên cho phép", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 0.25, easing: "linear" },
      { t: 4, v: 4, easing: "linear" },
    ],
  } as const;
  const leaf = videoLeaf("L", 1, 2);
  const top = nested({
    id: "T",
    subSpec: subSpecWith([leaf]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 8.5 }, // ∫₀⁴ (0.25 + 0.9375t) dt = 1 + 7.5
    speedKeyframes: curve as never,
  });
  const w = checkWindow(top, [], leaf, 1e-12, "biên 0.25→4");
  // 0.46875·T² + 0.25·T = w → T = (−0.25 + √(0.0625 + 1.875·w)) / 0.9375.
  const tauOf = (consumed: number): number =>
    (-0.25 + Math.sqrt(0.0625 + 1.875 * consumed)) / 0.9375;
  approx(w.absoluteStart, tauOf(1), 1e-9, "absoluteStart = τ(1) giải tích");
  approx(w.absoluteDuration, tauOf(3) - tauOf(1), 1e-9, "absoluteDuration = τ(3)−τ(1)");
  approx(w.cumulativeSpeed, 8.5 / 4, 1e-9, "cumulativeSpeed = trung bình 8.5/4");
});

// ---- (5) Curve không hợp lệ → fail-fast, không rơi về tuyến tính ----

test("G3: curve lỗi fail-fast có lý do speedKeyframes (cả .ts và .js)", () => {
  const badCurves: Array<{ name: string; curve: unknown; pattern: RegExp }> = [
    { name: "keyframes rỗng", curve: { keyframes: [] }, pattern: /speedKeyframes/ },
    { name: "v=5 vượt biên", curve: { keyframes: [{ t: 0, v: 5, easing: "linear" }] }, pattern: /speedKeyframes/ },
    { name: "v=0.1 dưới biên", curve: { keyframes: [{ t: 0, v: 0.1, easing: "linear" }] }, pattern: /speedKeyframes/ },
    { name: "easing lạ", curve: { keyframes: [{ t: 0, v: 1, easing: "bounce" }] }, pattern: /speedKeyframes/ },
    {
      name: "t vượt duration",
      curve: {
        keyframes: [
          { t: 0, v: 1, easing: "linear" },
          { t: 5, v: 2, easing: "linear" },
        ],
      },
      pattern: /speedKeyframes/,
    },
  ];
  for (const bad of badCurves) {
    const leaf = videoLeaf("L", 0, 4);
    const top = nested({
      id: "T",
      subSpec: subSpecWith([leaf]),
      start: 10,
      duration: 4,
      trim: { in: 0, out: 8 },
      speed: 2, // tuyến tính cũ sẽ trả số hữu hạn — phải throw thay vì dùng nó
      speedKeyframes: bad.curve as never,
    });
    for (const [tag, fn] of [["ts", composeTs], ["js", composeJs]] as const) {
      assert.throws(
        () => fn(top, [], leaf as never),
        bad.pattern,
        `G3 ${bad.name} (${tag}) phải throw có lý do speedKeyframes`,
      );
    }
  }
});

test("G3: curve lỗi ở tầng chain (mid) cũng fail-fast, không chỉ top", () => {
  const leaf = videoLeaf("L", 0, 2);
  const mid = nested({
    id: "M",
    subSpec: subSpecWith([leaf]),
    start: 0,
    duration: 4,
    speedKeyframes: {
      keyframes: [{ t: 0, v: 5, easing: "linear" }],
    } as never,
  });
  const top = nested({
    id: "T",
    subSpec: subSpecWith([mid]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 4 },
    speed: 1,
  });
  for (const [tag, fn] of [["ts", composeTs], ["js", composeJs]] as const) {
    assert.throws(
      () => fn(top, [mid], leaf as never),
      /speedKeyframes/,
      `G3 curve lỗi ở mid (${tag}) phải throw`,
    );
  }
});

test("G3: curve lỗi ở top vẫn throw kể cả khi lá bị trim cắt hết (fail-fast trước null)", () => {
  const leaf = videoLeaf("L", 50, 2); // ngoài trim [0, 8] → tuyến tính cũ trả null
  const top = nested({
    id: "T",
    subSpec: subSpecWith([leaf]),
    start: 10,
    duration: 4,
    trim: { in: 0, out: 8 },
    speedKeyframes: {
      keyframes: [{ t: 0, v: 5, easing: "linear" }],
    } as never,
  });
  for (const [tag, fn] of [["ts", composeTs], ["js", composeJs]] as const) {
    assert.throws(
      () => fn(top, [], leaf as never),
      /speedKeyframes/,
      `G3 top curve lỗi (${tag}) phải throw trước khi xét null`,
    );
  }
});

test("G3: nested mang curve nhưng duration không hợp lệ → throw có lý do duration", () => {
  const leaf = videoLeaf("L", 0, 4);
  const top = nested({
    id: "T",
    subSpec: subSpecWith([leaf]),
    start: 10,
    duration: 0, // duration output phải > 0 làm miền của τ
    trim: { in: 0, out: 8 },
    speedKeyframes: {
      keyframes: [{ t: 0, v: 2, easing: "linear" }],
    } as never,
  });
  for (const [tag, fn] of [["ts", composeTs], ["js", composeJs]] as const) {
    assert.throws(
      () => fn(top, [], leaf as never),
      /duration/,
      `G3 duration curve lỗi (${tag}) phải throw có lý do duration`,
    );
  }
});

// ---- (6) Hồi quy tuyến tính: bit-exact với công thức affine cũ ----

test("G3: không curve — 3 tầng hằng khớp EXACT công thức affine cũ (strict)", () => {
  const leaf = videoLeaf("L", 0, 5);
  const inner = nested({
    id: "in",
    subSpec: subSpecWith([leaf]),
    start: 1,
    duration: 2,
    speed: 2,
    trim: { in: 0, out: 4 },
  });
  const mid = nested({
    id: "mid",
    subSpec: subSpecWith([inner]),
    start: 2,
    duration: 6,
    speed: 0.5,
    trim: { in: 0, out: 3 },
  });
  const top = nested({
    id: "top",
    subSpec: subSpecWith([mid]),
    start: 7,
    duration: 3,
    speed: 3,
    trim: { in: 1, out: 10 },
  });
  // Tính tay bằng đúng công thức affine cũ (mapP/mapQ/mapK, cùng thứ tự):
  // top win [1,10); mid [2,8) → win' [0,3]; inner [1,3) → win'' [0,4];
  // lá [0,5) ∩ [0,4) = [0,4).
  let mapP = 7;
  let mapQ = 1;
  let mapK = 1 / 3;
  mapP = mapP + (2 - mapQ) * mapK; mapQ = 0; mapK = mapK / 0.5;
  mapP = mapP + (1 - mapQ) * mapK; mapQ = 0; mapK = mapK / 2;
  const expectedStart = mapP + (0 - mapQ) * mapK;
  const expectedDuration = (4 - 0) * mapK;
  const expectedCum = 1 / mapK;
  for (const [tag, fn] of [["ts", composeTs], ["js", composeJs]] as const) {
    const w = fn(top, [mid, inner], leaf as never);
    assert.notEqual(w, null, `G3 hồi quy (${tag}) không được null`);
    assert.equal(w!.absoluteStart, expectedStart, `G3 hồi quy (${tag}) absoluteStart strict`);
    assert.equal(w!.absoluteDuration, expectedDuration, `G3 hồi quy (${tag}) absoluteDuration strict`);
    assert.equal(w!.visibleStart, 0, `G3 hồi quy (${tag}) visibleStart`);
    assert.equal(w!.visibleEnd, 4, `G3 hồi quy (${tag}) visibleEnd`);
    assert.equal(w!.cumulativeSpeed, expectedCum, `G3 hồi quy (${tag}) cumulativeSpeed strict`);
    assert.deepEqual(w!.path, ["top", "mid", "in"], `G3 hồi quy (${tag}) path`);
    assert.equal(w!.depth, 3, `G3 hồi quy (${tag}) depth`);
  }
  // Số tay tường minh: absoluteStart 8, duration 4/3, cumulativeSpeed 3.
  const w = composeTs(top, [mid, inner], leaf as never);
  approx(w!.absoluteStart, 8, 1e-12, "hồi quy absoluteStart = 8");
  approx(w!.absoluteDuration, 4 / 3, 1e-12, "hồi quy absoluteDuration = 4/3");
  approx(w!.cumulativeSpeed, 3, 1e-12, "hồi quy cumulativeSpeed = 3");
  const flat = flattenTs(top).find((f) => f.clip.id === "L");
  assert.notEqual(flat, undefined, "hồi quy flatten phải có lá");
  approx(flat!.absoluteStart, 8, 1e-9, "hồi quy flatten absoluteStart");
  approx(flat!.absoluteDuration, 4 / 3, 1e-9, "hồi quy flatten absoluteDuration");
});
