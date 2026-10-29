/**
 * nested.test.ts — Test cho nested sequence / compound clip (Phase 9, N1: SPEC).
 *
 * Chạy bằng:
 *   npx tsc src/nested.ts src/nested.test.ts --outDir /tmp/nested-test \
 *     --module nodenext --target es2022 --moduleResolution nodenext --skipLibCheck
 *   node --test /tmp/nested-test/nested.test.js
 *
 * Quy ước số: mọi thời gian tính bằng GIÂY. Sai số so sánh dùng 1e-9 cho
 * các phép tính mà kết quả là số thập phân chính xác trong hệ nhị phân
 * (vd 10/2), và so sánh tuyệt đối với các phép chia như 10/3 qua
 * Math.abs(a - b) < 1e-9 trong test tương ứng.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_NESTED_DEPTH,
  flattenNested,
  isNestedClip,
  nestedDuration,
  nestedEffectiveTrim,
  nestedSourceDuration,
  normalizeNestedClip,
  validateNestedClip,
} from "./nested.js";
import type { NestedClip } from "./nested.js";

// ---- helper tạo fixture (plain object, đúng shape VideoSpec/Clip) ----

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

function textLeaf(id: string, start: number, duration: number) {
  return {
    kind: "text",
    id,
    text: id,
    start,
    duration,
    style: { fontFamily: "Arial", fontSize: 48, color: "#ffffff" },
  };
}

/** SubSpec 1 track video chứa các clip cho trước (fixture test: cast về VideoSpec). */
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
    duration: 0, // caller phải tự đặt đúng (test validate sẽ bắt nếu sai)
    ...over,
  } as NestedClip;
}

/** Dựng chuỗi nested lồng nhau `levels` tầng; tầng trong cùng chứa 1 lá video 4s. */
function chain(levels: number): NestedClip {
  let inner: unknown = subSpecWith([videoLeaf("leaf", 0, 4)]);
  // inner hiện là subSpec; mỗi vòng bọc nó bằng 1 nested clip (duration 4).
  for (let i = levels; i >= 1; i--) {
    const clip = nested({
      id: `n${i}`,
      subSpec: inner as NestedClip["subSpec"],
      start: 0,
      duration: 4,
    });
    inner = subSpecWith([clip]);
  }
  // Sau vòng lặp, inner là subSpec chứa clip ngoài cùng; trả về clip đó.
  const outerSub = inner as { tracks: Array<{ clips: unknown[] }> };
  return outerSub.tracks[0].clips[0] as NestedClip;
}

// ---- nestedDuration ----

test("nestedDuration: trim + speed", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 3,
    trim: { in: 2, out: 8 },
    speed: 2,
  });
  assert.equal(nestedDuration(clip), 3); // (8-2)/2
});

test("nestedDuration: mặc định trim toàn bộ + speed 1", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 10,
  });
  assert.equal(nestedDuration(clip), 10);
  assert.deepEqual(nestedEffectiveTrim(clip), { in: 0, out: 10 });
});

test("nestedDuration: speed 0.5 kéo dài gấp đôi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 20,
    speed: 0.5,
  });
  assert.equal(nestedDuration(clip), 20);
});

test("nestedSourceDuration: clip kết thúc muộn nhất qua nhiều track", () => {
  const spec = {
    version: "0.2.0",
    meta: meta(),
    tracks: [
      { id: "t1", kind: "video", clips: [videoLeaf("v", 2, 5)] }, // kết thúc 7
      { id: "t2", kind: "text", clips: [textLeaf("x", 0, 9)] }, // kết thúc 9
    ],
  };
  assert.equal(nestedSourceDuration(spec as NestedClip["subSpec"]), 9);
});

// ---- validateNestedClip: hợp lệ ----

test("validate: nested clip hợp lệ đơn giản → []", () => {
  const clip = nested({
    id: "n1",
    name: "Intro",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 5,
    duration: 10,
  });
  assert.deepEqual(validateNestedClip(clip), []);
});

test("validate: nested clip hợp lệ có trim + speed → []", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 3,
    trim: { in: 2, out: 8 },
    speed: 2,
  });
  assert.deepEqual(validateNestedClip(clip), []);
});

// ---- validateNestedClip: lỗi ----

test("validate: không phải nested clip → lỗi, không throw", () => {
  assert.ok(validateNestedClip({ kind: "video", id: "v" }).length > 0);
  assert.ok(validateNestedClip(null).length > 0);
  assert.ok(validateNestedClip("chuỗi").length > 0);
});

test("validate: id rỗng → lỗi", () => {
  const clip = nested({
    id: "",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 4,
  });
  assert.ok(validateNestedClip(clip).some((e) => e.includes(".id")));
});

test("validate: name không phải chuỗi → lỗi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 4,
    name: 42 as unknown as string,
  });
  assert.ok(validateNestedClip(clip).some((e) => e.includes(".name")));
});

test("validate: speed ngoài [0.25, 4] → lỗi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 4,
    speed: 8,
  });
  assert.ok(validateNestedClip(clip).some((e) => e.includes(".speed")));
});

test("validate: trim.out vượt độ dài subSpec → lỗi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 6,
    trim: { in: 0, out: 6 },
  });
  assert.ok(validateNestedClip(clip).some((e) => e.includes("trim.out")));
});

test("validate: trim.out <= trim.in → lỗi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 1,
    trim: { in: 3, out: 3 },
  });
  assert.ok(validateNestedClip(clip).some((e) => e.includes("trim.out")));
});

test("validate: duration không khớp (trim-out − trim-in)/speed → lỗi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 5, // đúng ra phải là (8-2)/2 = 3
    trim: { in: 2, out: 8 },
    speed: 2,
  });
  const errs = validateNestedClip(clip);
  assert.ok(errs.some((e) => e.includes(".duration")));
});

// ---- Đợt 20 R3: validate nested mang speedKeyframes ----

const LINEAR_1_2: NonNullable<NestedClip["speedKeyframes"]> = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

test("validate R3: nested curve linear 1→2, trim.out = in + ∫ = 6 → []", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 6 }, // ∫₀⁴ (1+t/4) = 6
    speedKeyframes: LINEAR_1_2,
  });
  assert.deepEqual(validateNestedClip(clip), []);
});

test("validate R3: nested curve trim.out lệch ∫ → lỗi trim.out", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 5 }, // đúng ra phải là 6
    speedKeyframes: LINEAR_1_2,
  });
  const errs = validateNestedClip(clip);
  assert.ok(errs.some((e) => e.includes("trim.out")));
});

test("validate R3: nested curve không trim → [] (duration là output, không đòi (out−in)/speed)", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4, // đường cũ sẽ đòi duration = 10/1 = 10 → lỗi sai
    speedKeyframes: LINEAR_1_2,
  });
  assert.deepEqual(validateNestedClip(clip), []);
});

test("validate R3: nested curve hằng v=2, trim.out = in + duration×2 → []", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 1, out: 9 },
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 2, easing: "linear" },
        { t: 4, v: 2, easing: "bezier", bezier: [0.1, 2, 0.9, -1] },
      ],
    },
  });
  assert.deepEqual(validateNestedClip(clip), []);
});

test("validate R3: nested curve hằng trim.out lệch duration×v → lỗi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 1, out: 9.5 }, // đúng ra phải là 9
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 2, easing: "linear" },
        { t: 4, v: 2, easing: "linear" },
      ],
    },
  });
  const errs = validateNestedClip(clip);
  assert.ok(errs.some((e) => e.includes("trim.out")));
});

test("validate R3: nested curve shape lỗi (v=5) → lỗi speedKeyframes, không báo duration nhiễu", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 6 },
    speedKeyframes: {
      keyframes: [{ t: 0, v: 5, easing: "linear" }],
    },
  });
  const errs = validateNestedClip(clip);
  assert.ok(errs.some((e) => e.includes("speedKeyframes")));
  assert.ok(!errs.some((e) => e.includes(".duration")));
});

test("validate R3: nested curve bezier [0,0,1,1] đồng nhất linear → trim.out 6 hợp lệ", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 6 },
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 1, easing: "bezier", bezier: [0, 0, 1, 1] },
        { t: 4, v: 2, easing: "linear" },
      ],
    },
  });
  assert.deepEqual(validateNestedClip(clip), []);
});

test("validate R3: nested curve bezier ease trim.out lệch ∫ → lỗi (không cần biết ∫ chính xác)", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 10 }, // ∫ ease 1→2 trên [0,4] ≈ 6.675, không thể bằng 10
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
        { t: 4, v: 2, easing: "linear" },
      ],
    },
  });
  const errs = validateNestedClip(clip);
  assert.ok(errs.some((e) => e.includes("trim.out")));
});

test("validate R3: nested con mang curve (đệ quy) hợp lệ → []", () => {
  const inner = nested({
    id: "in",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4,
    trim: { in: 0, out: 6 },
    speedKeyframes: LINEAR_1_2,
  });
  const outer = nested({
    id: "outer",
    subSpec: subSpecWith([inner]),
    start: 0,
    duration: 4, // subSpec ngoài dài 4 (clip inner duration 4), speed 1
  });
  assert.deepEqual(validateNestedClip(outer), []);
});

test("validate R3: clip thường vẫn bị bắt duration lệch (không nới lỏng)", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 4, // không curve, không trim → đòi duration = 10/1 = 10
  });
  const errs = validateNestedClip(clip);
  assert.ok(errs.some((e) => e.includes(".duration")));
});

test("validate: subSpec rỗng → lỗi", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([]),
    start: 0,
    duration: 1,
  });
  assert.ok(validateNestedClip(clip).length > 0);
});

test("validate: subSpec thiếu meta hợp lệ → lỗi", () => {
  const bad = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 4,
  });
  (bad.subSpec as unknown as Record<string, unknown>)["meta"] = {
    name: "x",
    width: 0,
    height: 720,
    fps: 30,
  };
  assert.ok(validateNestedClip(bad).some((e) => e.includes("meta.width")));
});

// ---- backward compat: project cũ ----

test("backward compat: project cũ không có nested clip vẫn load bình thường", () => {
  const oldSpec = {
    version: "0.2.0",
    meta: meta(),
    tracks: [
      { id: "t1", kind: "video", clips: [videoLeaf("c1", 0, 5)] },
      { id: "t2", kind: "text", clips: [textLeaf("c2", 1, 3)] },
    ],
  };
  // Không clip nào là nested; module nested không đụng tới chúng.
  for (const t of oldSpec.tracks) {
    for (const c of t.clips) {
      assert.equal(isNestedClip(c), false);
    }
  }
  // validateNestedClip trên clip cũ chỉ báo sai kind, không throw.
  assert.ok(validateNestedClip(oldSpec.tracks[0].clips[0]).length > 0);
  // JSON round-trip giữ nguyên project cũ (không thêm field lạ).
  assert.deepEqual(
    JSON.parse(JSON.stringify(oldSpec)),
    oldSpec,
  );
  assert.equal(nestedSourceDuration(oldSpec as NestedClip["subSpec"]), 5);
});

test("isNestedClip: guard đúng", () => {
  assert.equal(
    isNestedClip({ kind: "nested", id: "n", subSpec: {}, start: 0, duration: 1 }),
    true,
  );
  assert.equal(isNestedClip({ kind: "video" }), false);
  assert.equal(isNestedClip(null), false);
});

// ---- flattenNested: cơ bản ----

test("flatten: lá đơn, trim + vị trí ngoài", () => {
  const leaf = videoLeaf("v", 0, 10);
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([leaf]),
    start: 100,
    duration: 6,
    trim: { in: 2, out: 8 },
  });
  const flat = flattenNested(clip);
  assert.equal(flat.length, 1);
  assert.equal(flat[0].absoluteStart, 100);
  assert.equal(flat[0].absoluteDuration, 6);
  assert.deepEqual(flat[0].path, ["n1"]);
  assert.equal(flat[0].depth, 1);
  assert.equal(flat[0].clip, leaf); // giữ nguyên tham chiếu, không copy
});

test("flatten: speed 2 rút ngắn một nửa", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 5,
    speed: 2,
  });
  const flat = flattenNested(clip);
  assert.equal(flat.length, 1);
  assert.equal(flat[0].absoluteStart, 0);
  assert.equal(flat[0].absoluteDuration, 5);
});

test("flatten: lá bị trim cắt trái và phải từng phần", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([
      videoLeaf("a", 0, 5), // giao [3,5) → start ngoài 0, dur 2
      videoLeaf("b", 5, 5), // giao [5,7) → start ngoài 2, dur 2
    ]),
    start: 10,
    duration: 4,
    trim: { in: 3, out: 7 },
  });
  const flat = flattenNested(clip);
  assert.equal(flat.length, 2);
  assert.equal(flat[0].absoluteStart, 10);
  assert.equal(flat[0].absoluteDuration, 2);
  assert.equal(flat[1].absoluteStart, 12);
  assert.equal(flat[1].absoluteDuration, 2);
});

test("flatten: lá nằm ngoài cửa sổ trim → bỏ, không entry", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 2)]),
    start: 0,
    duration: 2,
    trim: { in: 5, out: 7 },
  });
  // Lưu ý: trim.out = 7 vượt subSpec (2) nên clip này validate FAIL,
  // nhưng flatten vẫn tính theo cửa sổ đã cho: lá [0,2) giao [5,7) rỗng.
  assert.deepEqual(flattenNested(clip), []);
});

test("flatten: nhiều track đều được mở phẳng", () => {
  const spec = {
    version: "0.2.0",
    meta: meta(),
    tracks: [
      { id: "t1", kind: "video", clips: [videoLeaf("v", 0, 4)] },
      { id: "t2", kind: "text", clips: [textLeaf("x", 1, 2)] },
    ],
  };
  const clip = nested({
    id: "n1",
    subSpec: spec as NestedClip["subSpec"],
    start: 20,
    duration: 4,
  });
  const flat = flattenNested(clip);
  assert.equal(flat.length, 2);
  assert.equal(flat[0].absoluteStart, 20);
  assert.equal(flat[1].absoluteStart, 21);
  assert.equal(flat[1].absoluteDuration, 2);
});

test("flatten: không mutate input", () => {
  const leaf = videoLeaf("v", 0, 10);
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([leaf]),
    start: 100,
    duration: 6,
    trim: { in: 2, out: 8 },
  });
  const before = JSON.stringify(clip);
  flattenNested(clip);
  assert.equal(JSON.stringify(clip), before);
});

// ---- flattenNested: lồng nhau ----

test("flatten: lồng 2 tầng, tốc độ tầng trong áp dụng đúng", () => {
  const inner = nested({
    id: "inner",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 5,
    duration: 5, // (10-0)/2
    speed: 2,
  });
  const outer = nested({
    id: "outer",
    subSpec: subSpecWith([inner]),
    start: 100,
    duration: 10,
  });
  const flat = flattenNested(outer);
  assert.equal(flat.length, 1);
  assert.equal(flat[0].absoluteStart, 105);
  assert.equal(flat[0].absoluteDuration, 5);
  assert.deepEqual(flat[0].path, ["outer", "inner"]);
  assert.equal(flat[0].depth, 2);
});

test("flatten: trim ngoài cắt giữa nested clip con → dời cửa sổ con đúng tốc độ", () => {
  const inner = nested({
    id: "inner",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 5,
    duration: 5, // (10-0)/2
    speed: 2,
  });
  const outer = nested({
    id: "outer",
    subSpec: subSpecWith([inner]),
    start: 100,
    duration: 3,
    trim: { in: 7, out: 10 },
  });
  // Inner chiếm [5,10) trong subSpec ngoài, giao trim [7,10) = [7,10).
  // Cửa sổ con: in' = 0 + (7-5)*2 = 4, out' = 0 + (10-5)*2 = 10.
  // Lá [0,10) giao [4,10) = [4,10). Thời gian ngoài: trim.in = 7 của
  // clip ngoài map về chính start = 100 (không phải 100+7), nên lá bắt
  // đầu ở 100, dur (10-4)/2 = 3, chiếm [100,103) trên timeline ngoài.
  const flat = flattenNested(outer);
  assert.equal(flat.length, 1);
  assert.equal(flat[0].absoluteStart, 100);
  assert.equal(flat[0].absoluteDuration, 3);
  assert.deepEqual(flat[0].path, ["outer", "inner"]);
});

test("flatten: tốc độ nhân qua 2 tầng (2 x 2 = 4)", () => {
  const inner = nested({
    id: "inner",
    subSpec: subSpecWith([videoLeaf("v", 0, 10)]),
    start: 0,
    duration: 5,
    speed: 2,
  });
  const outer = nested({
    id: "outer",
    subSpec: subSpecWith([inner]),
    start: 0,
    duration: 2.5,
    speed: 2,
  });
  const flat = flattenNested(outer);
  assert.equal(flat.length, 1);
  assert.equal(flat[0].absoluteStart, 0);
  assert.equal(flat[0].absoluteDuration, 2.5); // 10 / 4
});

// ---- độ sâu + vòng lặp + dùng lại ----

test("validate + flatten: chuỗi 8 tầng hợp lệ, lá ở depth 8", () => {
  const top = chain(8);
  assert.deepEqual(validateNestedClip(top), []);
  const flat = flattenNested(top);
  assert.equal(flat.length, 1);
  assert.equal(flat[0].depth, 8);
  assert.equal(flat[0].path.length, 8);
  assert.equal(flat[0].absoluteDuration, 4);
});

test("validate: chuỗi 9 tầng → lỗi vượt độ sâu", () => {
  const top = chain(9);
  const errs = validateNestedClip(top);
  assert.ok(errs.some((e) => e.includes("độ sâu")));
});

test("flatten: chuỗi 9 tầng → throw", () => {
  const top = chain(9);
  assert.throws(() => flattenNested(top), /độ sâu/);
});

test("validate: tự tham chiếu trực tiếp → lỗi vòng lặp", () => {
  const cyclicSub = subSpecWith([]);
  const self = nested({
    id: "self",
    subSpec: cyclicSub as NestedClip["subSpec"],
    start: 0,
    duration: 4,
  });
  (cyclicSub.tracks[0] as { clips: unknown[] }).clips = [self];
  const errs = validateNestedClip(self);
  assert.ok(errs.some((e) => e.includes("vòng lặp")));
});

test("flatten: tự tham chiếu trực tiếp → throw, không treo", () => {
  const cyclicSub = subSpecWith([]);
  const self = nested({
    id: "self",
    subSpec: cyclicSub as NestedClip["subSpec"],
    start: 0,
    duration: 4,
  });
  (cyclicSub.tracks[0] as { clips: unknown[] }).clips = [self];
  assert.throws(() => flattenNested(self), /vòng lặp/);
});

test("validate: vòng lặp gián tiếp A → B → A → lỗi vòng lặp", () => {
  const subA = subSpecWith([]);
  const subB = subSpecWith([]);
  const clipA = nested({ id: "a", subSpec: subA as NestedClip["subSpec"], start: 0, duration: 4 });
  const clipB = nested({ id: "b", subSpec: subB as NestedClip["subSpec"], start: 0, duration: 4 });
  (subA.tracks[0] as { clips: unknown[] }).clips = [clipB];
  (subB.tracks[0] as { clips: unknown[] }).clips = [clipA];
  assert.ok(validateNestedClip(clipA).some((e) => e.includes("vòng lặp")));
  assert.throws(() => flattenNested(clipA), /vòng lặp/);
});

test("dùng lại: cùng subSpec ở 2 clip anh em là HỢP LỆ (không phải vòng lặp)", () => {
  const leaf = videoLeaf("v", 0, 6);
  const shared = subSpecWith([leaf]);
  const outerSub = subSpecWith([
    nested({ id: "nA", subSpec: shared as NestedClip["subSpec"], start: 0, duration: 6 }),
    nested({ id: "nB", subSpec: shared as NestedClip["subSpec"], start: 6, duration: 6 }),
  ]);
  const outer = nested({
    id: "outer",
    subSpec: outerSub as NestedClip["subSpec"],
    start: 0,
    duration: 12,
  });
  assert.deepEqual(validateNestedClip(outer), []);
  const flat = flattenNested(outer);
  assert.equal(flat.length, 2);
  assert.equal(flat[0].absoluteStart, 0);
  assert.deepEqual(flat[0].path, ["outer", "nA"]);
  assert.equal(flat[1].absoluteStart, 6);
  assert.deepEqual(flat[1].path, ["outer", "nB"]);
  assert.equal(flat[0].clip, flat[1].clip); // cùng một lá gốc
});

// ---- flattenNested: fail fast ----

test("flatten: không phải nested clip → throw", () => {
  assert.throws(
    () => flattenNested(videoLeaf("v", 0, 4) as unknown as NestedClip),
    /nested clip/,
  );
});

test("flatten: speed 0 → throw", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 4,
    speed: 0,
  });
  assert.throws(() => flattenNested(clip), /speed/);
});

test("flatten: trim out <= in → throw", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 0,
    duration: 4,
    trim: { in: 2, out: 2 },
  });
  assert.throws(() => flattenNested(clip), /trim/);
});

test("MAX_NESTED_DEPTH = 8", () => {
  assert.equal(MAX_NESTED_DEPTH, 8);
});

// ---- đợt 7: normalizeNestedClip — shape cũ (tracks trực tiếp) → shape chuẩn ----

const META7 = { name: "outer", width: 1280, height: 720, fps: 30 };

function oldNested(over: Record<string, unknown>) {
  return {
    kind: "nested",
    id: "n1",
    start: 10,
    duration: 4,
    tracks: [{ id: "t1", kind: "video", clips: [videoLeaf("v", 0, 4)] }],
    ...over,
  };
}

test("normalize: clip đã chuẩn (có subSpec, không tracks/in) → ok, nội dung giữ nguyên", () => {
  const clip = nested({
    id: "n1",
    subSpec: subSpecWith([videoLeaf("v", 0, 4)]),
    start: 10,
    duration: 4,
  });
  const r = normalizeNestedClip(clip);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.warnings, []);
    assert.equal(r.clip.kind, "nested");
    assert.equal(r.clip.subSpec.tracks[0].clips[0].id, "v");
    assert.deepEqual(validateNestedClip(r.clip), []);
  }
});

test("normalize: shape cũ tracks trực tiếp → subSpec dựng từ opts.meta, không mất clip", () => {
  const r = normalizeNestedClip(oldNested({}), { meta: META7 });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.clip.subSpec.version, "0.2.0");
    assert.deepEqual(r.clip.subSpec.meta, META7);
    assert.equal(r.clip.subSpec.tracks.length, 1);
    assert.equal(r.clip.subSpec.tracks[0].clips[0].id, "v");
    assert.equal("tracks" in r.clip, false);
    assert.deepEqual(validateNestedClip(r.clip), []);
  }
});

test("normalize: shape cũ thiếu meta và không có opts.meta → ok:false, không bịa meta", () => {
  const r = normalizeNestedClip(oldNested({}));
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.reason.includes("meta"));
});

test("normalize: cả subSpec và tracks cùng có mà BẰNG nhau → ok, giữ subSpec + warning", () => {
  const tracks = [{ id: "t1", kind: "video", clips: [videoLeaf("v", 0, 4)] }];
  const clip = {
    kind: "nested",
    id: "n1",
    start: 0,
    duration: 4,
    subSpec: { version: "0.2.0", meta: META7, tracks },
    tracks: JSON.parse(JSON.stringify(tracks)),
  };
  const r = normalizeNestedClip(clip);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.ok(r.warnings.some((w) => w.includes("trùng lặp")));
    assert.equal(r.clip.subSpec.tracks[0].clips[0].id, "v");
  }
});

test("normalize: cả subSpec và tracks cùng có mà KHÁC nhau → ok:false (fail fast)", () => {
  const clip = {
    kind: "nested",
    id: "n1",
    start: 0,
    duration: 4,
    subSpec: {
      version: "0.2.0",
      meta: META7,
      tracks: [{ id: "t1", kind: "video", clips: [videoLeaf("v", 0, 4)] }],
    },
    tracks: [{ id: "t1", kind: "video", clips: [videoLeaf("KHÁC", 0, 4)] }],
  };
  const r = normalizeNestedClip(clip);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.reason.includes("khác nhau"));
});

test("normalize: không có subSpec cũng không có tracks → ok:false", () => {
  const r = normalizeNestedClip({ kind: "nested", id: "n1", start: 0, duration: 4 });
  assert.equal(r.ok, false);
  const r2 = normalizeNestedClip({ kind: "video", id: "v" });
  assert.equal(r2.ok, false);
  const r3 = normalizeNestedClip(null);
  assert.equal(r3.ok, false);
});

test("normalize: field in legacy → trim { in, out = in + duration*speed }", () => {
  // subSpec dài 4s: trim phải nằm trong [0, 4] thì validate mới khớp.
  const r = normalizeNestedClip(oldNested({ in: 1, speed: 2, duration: 1.5 }), { meta: META7 });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.clip.trim, { in: 1, out: 4 });
    assert.ok(r.warnings.some((w) => w.includes("trim")));
    // duration 1.5 = (4-1)/2 nên validate khớp.
    assert.deepEqual(validateNestedClip(r.clip), []);
  }
  // Không có speed: out = in + duration.
  const r2 = normalizeNestedClip(oldNested({ in: 1, duration: 3 }), { meta: META7 });
  assert.equal(r2.ok, true);
  if (r2.ok) assert.deepEqual(r2.clip.trim, { in: 1, out: 4 });
});

test("normalize: in và trim cùng có mà khác nhau → ok:false; khớp nhau → ok + warning", () => {
  const bad = normalizeNestedClip(
    oldNested({ in: 3, trim: { in: 2, out: 6 } }),
    { meta: META7 }
  );
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.ok(bad.reason.includes("khác nhau"));
  const good = normalizeNestedClip(
    oldNested({ in: 2, trim: { in: 2, out: 6 } }),
    { meta: META7 }
  );
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.deepEqual(good.clip.trim, { in: 2, out: 6 });
    assert.ok(good.warnings.some((w) => w.includes("trùng trim.in")));
  }
});

test("normalize: nested con dạng tracks trực tiếp cũng được normalize đệ quy", () => {
  const inner = oldNested({ id: "inner", start: 0, duration: 4 });
  const outer = {
    kind: "nested",
    id: "outer",
    start: 0,
    duration: 4,
    tracks: [{ id: "t1", kind: "video", clips: [inner] }],
  };
  const r = normalizeNestedClip(outer, { meta: META7 });
  assert.equal(r.ok, true);
  if (r.ok) {
    const child = r.clip.subSpec.tracks[0].clips[0] as { kind: string; subSpec: unknown };
    assert.equal(child.kind, "nested");
    assert.ok(child.subSpec !== undefined);
    assert.deepEqual(validateNestedClip(r.clip), []);
  }
});

test("normalize: track thiếu id/kind → gán mặc định + warning, không mất clip", () => {
  const r = normalizeNestedClip(
    {
      kind: "nested",
      id: "n1",
      start: 0,
      duration: 4,
      tracks: [{ clips: [videoLeaf("v", 0, 4)] }],
    },
    { meta: META7 }
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.clip.subSpec.tracks[0].id, "track-0");
    assert.equal(r.clip.subSpec.tracks[0].kind, "video");
    assert.ok(r.warnings.length >= 2);
  }
});

test("normalize: field preview-only (opacity) bị bỏ nhưng LIỆT KÊ trong warnings", () => {
  const r = normalizeNestedClip(oldNested({ opacity: 0.5 }), { meta: META7 });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.ok(r.warnings.some((w) => w.includes("opacity")));
    assert.equal("opacity" in r.clip, false);
  }
});

test("normalize: không mutate input", () => {
  const input = oldNested({ in: 2 });
  const before = JSON.stringify(input);
  const r = normalizeNestedClip(input, { meta: META7 });
  assert.equal(r.ok, true);
  assert.equal(JSON.stringify(input), before);
});
