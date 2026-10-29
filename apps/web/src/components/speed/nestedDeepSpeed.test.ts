/**
 * nestedDeepSpeed.test.ts — Test thật cho Phase 9 đợt 17 (luồng N3):
 * (1) tính lại duration của nested clip khi đổi speed
 *     (applyNestedSpeedDuration — hàm thuần store patchClip gọi);
 * (2) sửa clip con ở cấp sâu hơn 1 tầng qua updateNestedDeepInnerClip /
 *     splitNestedDeepInnerClip (trim, đổi speed, split theo ramp, chặn
 *     vòng lặp, chặn sâu vượt 8).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/components/speed/nestedDeepSpeed.test.ts
 *
 * Chỉ test logic thuần trong nestUtils (không DOM/store — phần nối store
 * thật nằm ở nestedDeepSpeed.store.test.ts, bundle esbuild như mẫu T4).
 * Mọi con số dưới đây suy bằng tay từ fixture, không lấy từ code đang
 * test (tránh kiểm chứng vòng tròn).
 *
 * Fixture D (3 cấp + clip anh em giữ nguồn cha):
 * - Lá L: video [0,4) in 0–4; anh em S: video [4,8) in 0–4.
 * - Inner "in": [0,8) trim [0,8) speed 1, subSpec track [L, S].
 * - Mid "mid": [0,8) trim [0,8) speed 1, subSpec [inner].
 * - Top "top": start 0, [0,8) trim [0,8) speed 1, subSpec [mid].
 * Lá L ở chain ["mid", "in"], track "v-in". Anh em S giữ độ dài nguồn
 * của inner ở 8s nên L thu ngắn không phá trim của cha (xem guard N3).
 *
 * Fixture R (lá có speed curve, 3 cấp):
 * - Lá LR: video [0,4) in 10, out 14.875, curve tuyến tính
 *   [(0,1), (1,1.25), (4,1.25)]: ∫0..1 = 1.125, ∫0..4 = 4.875 = out−in.
 * - Inner "inR": [0,4) trim [0,4); mid "midR": [0,4) trim [0,4);
 *   top "topR": [0,4) trim [0,4). Chain ["midR", "inR"], track "v-in".
 * Cắt LR tại thời gian cha = 1 (nửa trái dài 1s) thì điểm cắt nguồn =
 * 10 + ∫0..1 = 11.125 (kiểu ví dụ đợt 14: in=10, trim/cắt theo ramp 1s
 * → 11,125). Nửa phải: in 11.125, out 14.875, duration 3.
 */
import {
  flattenNested,
  validateNestedClip,
  type Clip,
  type NestedClip,
  type VideoSpec,
} from "@repo-1/video-spec";
import {
  applyNestedSpeedDuration,
  deepNestedLeafVisibleSpeedCurve,
  splitNestedDeepInnerClip,
  updateNestedDeepInnerClip,
} from "../nested/nestUtils.ts";

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

function meta() {
  return { name: "sub", width: 1280, height: 720, fps: 30 };
}

function specWith(clips: Clip[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: [{ id: "v1", kind: "video", clips }],
  } as unknown as VideoSpec;
}

function specWithTrack(trackId: string, clips: Clip[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: [{ id: trackId, kind: "video", clips }],
  } as unknown as VideoSpec;
}

function video(
  id: string,
  start: number,
  duration: number,
  extra?: Record<string, unknown>,
): Clip {
  return {
    kind: "video",
    id,
    src: "src.mp4",
    start,
    duration,
    in: 0,
    out: duration,
    ...extra,
  } as unknown as Clip;
}

function nested(
  id: string,
  start: number,
  duration: number,
  subSpec: VideoSpec,
  extra?: Record<string, unknown>,
): NestedClip {
  return {
    kind: "nested",
    id,
    start,
    duration,
    subSpec,
    ...extra,
  } as unknown as NestedClip;
}

let idSeq = 0;
const idGen = () => `c${++idSeq}`;

function outerSpec(top: NestedClip): VideoSpec {
  return {
    version: "0.2.0",
    meta: meta(),
    tracks: [{ id: "v-out", kind: "video", clips: [top as unknown as Clip] }],
  } as unknown as VideoSpec;
}

/** Fixture D: top / mid / inner / lá L + anh em S. */
function fixtureD() {
  const leaf = video("L", 0, 4, { in: 0, out: 4 });
  const sib = video("S", 4, 4, { in: 0, out: 4 });
  const inner = nested("in", 0, 8, specWithTrack("v-in", [leaf, sib]), {
    speed: 1,
    trim: { in: 0, out: 8 },
  });
  const mid = nested("mid", 0, 8, specWith([inner]), {
    speed: 1,
    trim: { in: 0, out: 8 },
  });
  const top = nested("top", 0, 8, specWith([mid]), {
    speed: 1,
    trim: { in: 0, out: 8 },
  });
  return { top, mid, inner, leaf, sib };
}

/** Fixture R: lá có curve, 3 cấp, không anh em. */
function fixtureR() {
  const leaf = video("LR", 0, 4, {
    in: 10,
    out: 14.875,
    speedKeyframes: {
      keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 1, v: 1.25, easing: "linear" },
        { t: 4, v: 1.25, easing: "linear" },
      ],
    },
  });
  const inner = nested("inR", 0, 4, specWithTrack("v-in", [leaf]), {
    speed: 1,
    trim: { in: 0, out: 4 },
  });
  const mid = nested("midR", 0, 4, specWith([inner]), {
    speed: 1,
    trim: { in: 0, out: 4 },
  });
  const top = nested("topR", 0, 4, specWith([mid]), {
    speed: 1,
    trim: { in: 0, out: 4 },
  });
  return { top, mid, inner, leaf };
}

/** Lấy lá trong top mới theo chain (đi thẳng theo id, không qua helper test). */
function leafIn(top: NestedClip, chain: NestedClip[], trackId: string, leafId: string): Clip {
  let cur: NestedClip = top;
  for (const step of chain) {
    const next = cur.subSpec.tracks.flatMap((t) => t.clips).find((c) => c.id === step.id);
    assert(next && (next as { kind?: string }).kind === "nested", `chain gãy tại ${step.id}`);
    cur = next as unknown as NestedClip;
  }
  const track = cur.subSpec.tracks.find((t) => t.id === trackId);
  assert(track !== undefined, `không có track ${trackId}`);
  const leaf = track!.clips.find((c) => c.id === leafId);
  assert(leaf !== undefined, `không có lá ${leafId}`);
  return leaf!;
}

// --- (1) applyNestedSpeedDuration: duration tính lại theo speed ---

test("nested speed 1 → 2, trim [0,4): duration 4 → 2", () => {
  const top = nested("t", 0, 4, specWith([]), { speed: 2, trim: { in: 0, out: 4 } });
  const next = applyNestedSpeedDuration(top);
  assert(next !== null, "null");
  eq(next!.duration, 2, "duration speed 2");
  eq(next!.trim, { in: 0, out: 4 }, "trim giữ nguyên");
});

test("nested speed 2 → 0.5, trim [1,5): duration 8 (span 4 / 0.5)", () => {
  const top = nested("t", 0, 8, specWith([]), { speed: 0.5, trim: { in: 1, out: 5 } });
  const next = applyNestedSpeedDuration(top);
  assert(next !== null, "null");
  eq(next!.duration, 8, "duration speed 0.5");
});

test("nested speed 1 → 4, trim [0,2): duration 0.5; speed ngoài [0.25,4] → null", () => {
  const fast = nested("t", 0, 0.5, specWith([]), { speed: 4, trim: { in: 0, out: 2 } });
  assert(applyNestedSpeedDuration(fast)?.duration === 0.5, "duration speed 4");
  const tooFast = nested("t", 0, 1, specWith([]), { speed: 5, trim: { in: 0, out: 2 } });
  eq(applyNestedSpeedDuration(tooFast), null, "speed 5 → null");
  const tooSlow = nested("t", 0, 1, specWith([]), { speed: 0.1, trim: { in: 0, out: 2 } });
  eq(applyNestedSpeedDuration(tooSlow), null, "speed 0.1 → null");
  const badTrim = nested("t", 0, 1, specWith([]), { speed: 2, trim: { in: 2, out: 2 } });
  eq(applyNestedSpeedDuration(badTrim), null, "trim rỗng → null");
});

// --- (2) Sửa lá sâu: đổi speed ---

test("đổi speed lá L ở cấp 3 (1 → 2): duration 4 → 2, đoạn nguồn [0,4) giữ nguyên", () => {
  const { top, mid, inner } = fixtureD();
  eq(validateNestedClip(top), [], "fixture D hợp lệ");
  const res = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "L", { speed: 2 });
  assert(!("error" in res), `lỗi: ${"error" in res ? res.error : ""}`);
  const newTop = (res as { nested: NestedClip }).nested;
  const leaf = leafIn(newTop, [mid, inner], "v-in", "L");
  eq(leaf.duration, 2, "lá duration sau speed 2");
  eq((leaf as unknown as { in: number; out: number }).in, 0, "lá in giữ nguyên");
  eq((leaf as unknown as { in: number; out: number }).out, 4, "lá out giữ nguyên");
  eq((leaf as unknown as { speed: number }).speed, 2, "lá speed mới");
  // Tầng tổ tiên không đổi; top vẫn hợp lệ; cửa sổ lá khớp flatten.
  eq(newTop.duration, 8, "top duration không đổi");
  eq(newTop.trim, { in: 0, out: 8 }, "top trim không đổi");
  eq(validateNestedClip(newTop), [], "top sau sửa vẫn hợp lệ");
  const deep = deepNestedLeafVisibleSpeedCurve(newTop, [mid, inner], leaf);
  assert(deep !== null, "deep null");
  approx(deep!.window.absoluteStart, 0, 1e-9, "window absoluteStart");
  approx(deep!.window.absoluteDuration, 2, 1e-9, "window absoluteDuration");
  approx(deep!.effectiveIn!, 0, 1e-9, "effectiveIn");
  approx(deep!.effectiveOut!, 4, 1e-9, "effectiveOut (in + visible×speed)");
  const flat = flattenNested(newTop).find((f) => f.clip.id === "L");
  assert(flat !== undefined, "flatten không có L");
  approx(flat!.absoluteDuration, 2, 1e-9, "flatten absoluteDuration");
  // Gốc không bị sửa (snapshot undo dựa vào đó).
  eq(top.duration, 8, "gốc duration không đổi");
});

test("đổi speed lá kèm duration tường minh: out đi theo (in + duration×speed)", () => {
  const { top, mid, inner } = fixtureD();
  const res = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "L", { speed: 2, duration: 1 });
  assert(!("error" in res), `lỗi: ${"error" in res ? res.error : ""}`);
  const leaf = leafIn((res as { nested: NestedClip }).nested, [mid, inner], "v-in", "L");
  eq(leaf.duration, 1, "duration tường minh thắng");
  eq((leaf as unknown as { out: number }).out, 2, "out = 0 + 1×2");
});

test("đổi speed lá đang có curve (không thay curve) → error, không sửa gì", () => {
  const { top } = fixtureR();
  const before = outerSpec(top);
  const res = updateNestedDeepInnerClip(before, "v-out", "topR", ["midR", "inR"], "v-in", "LR", { speed: 2 });
  assert("error" in res, "phải error");
  eq(before.tracks[0].clips[0], top, "spec gốc không đổi");
});

test("đổi speed lá làm đè anh em → error; thu ngắn lá cuối phá trim cha → error", () => {
  const { top } = fixtureD();
  // L [0,4) chậm về 0.5 → duration 8, đè S [4,8).
  const overlap = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "L", { speed: 0.5 });
  assert("error" in overlap, "đè anh em phải error");
  // Lá cuối: fixture không anh em sau S — thu ngắn S (lá cuối, [4,8) → speed 2
  // thành [4,6)) làm nguồn inner co từ 8 về 6 dưới trim.out = 8 của inner.
  const shrinkLast = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "S", { speed: 2 });
  assert("error" in shrinkLast, "phá trim cha phải error");
});

// --- (3) Sửa lá sâu: trim (thường + có curve) ---

test("trim lá L ở cấp 3 (start 0 → 1, duration 4 → 3): không đè S, top hợp lệ", () => {
  const { top, mid, inner } = fixtureD();
  const res = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "L", { start: 1, duration: 3 });
  assert(!("error" in res), `lỗi: ${"error" in res ? res.error : ""}`);
  const newTop = (res as { nested: NestedClip }).nested;
  const leaf = leafIn(newTop, [mid, inner], "v-in", "L");
  eq(leaf.start, 1, "lá start mới");
  eq(leaf.duration, 3, "lá duration mới");
  eq(validateNestedClip(newTop), [], "top sau trim vẫn hợp lệ");
  const deep = deepNestedLeafVisibleSpeedCurve(newTop, [mid, inner], leaf);
  assert(deep !== null, "deep null");
  approx(deep!.window.absoluteStart, 1, 1e-9, "window absoluteStart sau trim");
  approx(deep!.window.absoluteDuration, 3, 1e-9, "window absoluteDuration sau trim");
});

test("trim trái lá có curve ở cấp 3 (1s): curve dịch, curveDropped = 1", () => {
  const { top, mid, inner } = fixtureR();
  const res = updateNestedDeepInnerClip(outerSpec(top), "v-out", "topR", ["midR", "inR"], "v-in", "LR", { start: 1, duration: 3 });
  assert(!("error" in res), `lỗi: ${"error" in res ? res.error : ""}`);
  eq((res as { curveDropped?: number }).curveDropped, 1, "curveDropped");
  const leaf = leafIn((res as { nested: NestedClip }).nested, [mid, inner], "v-in", "LR");
  const curve = (leaf as unknown as { speedKeyframes: { keyframes: { t: number; v: number }[] } }).speedKeyframes;
  eq(curve.keyframes.map((k) => [k.t, k.v]), [[0, 1.25], [3, 1.25]], "curve sau trim trái");
});

test("chain sai id / lá đích là nested / độ sâu vượt 8 → error", () => {
  const { top } = fixtureD();
  const wrongChain = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "nope"], "v-in", "L", { start: 1 });
  assert("error" in wrongChain, "chain sai phải error");
  const nestedTarget = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid"], "v1", "in", { start: 1 });
  assert("error" in nestedTarget, "đích là nested phải error");
  // Cây 9 tầng nested (lv1 ngoài cùng … lv9 chứa lá): chain lv2..lv9
  // dài 8 bước, bước cuối đẩy sâu lên 9 > MAX 8 → error.
  let deep: NestedClip = nested("lv9", 0, 1, specWith([video("LD", 0, 1)]), { speed: 1, trim: { in: 0, out: 1 } });
  for (let i = 8; i >= 1; i--) {
    deep = nested(`lv${i}`, 0, 1, specWith([deep]), { speed: 1, trim: { in: 0, out: 1 } });
  }
  const chain9 = ["lv2", "lv3", "lv4", "lv5", "lv6", "lv7", "lv8", "lv9"];
  const tooDeep = updateNestedDeepInnerClip(outerSpec(deep), "v-out", "lv1", chain9, "v1", "LD", { start: 0 });
  assert("error" in tooDeep, "sâu vượt 8 phải error");
});

test("vòng lặp tham chiếu subSpec trên đường đi → error", () => {
  const { top, inner } = fixtureD();
  // mid2 có subSpec CHÍNH LÀ subSpec của top (vòng lặp): chain ["mid2"]
  // đi vào mid2 rồi thấy subSpec đã có trong tổ tiên → error.
  const cyclicMid = { ...inner, id: "mid2", subSpec: top.subSpec } as unknown as NestedClip;
  const cyclicTop = nested("topC", 0, 8, specWith([cyclicMid]), { speed: 1, trim: { in: 0, out: 8 } });
  const res = updateNestedDeepInnerClip(outerSpec(cyclicTop), "v-out", "topC", ["mid2"], "v1", "L", { start: 1 });
  assert("error" in res, "vòng lặp phải error");
});

test("chain rỗng = lá trực tiếp trong top (cùng đích với update 1 tầng)", () => {
  // Anh em S1 giữ nguồn top ở 8s nên L1 thu ngắn không phá trim của cha.
  const leaf = video("L1", 0, 4, { in: 0, out: 4 });
  const sib = video("S1", 4, 4, { in: 0, out: 4 });
  const top = nested("top1", 0, 8, specWithTrack("v-in", [leaf, sib]), { speed: 1, trim: { in: 0, out: 8 } });
  const res = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top1", [], "v-in", "L1", { speed: 2 });
  assert(!("error" in res), `lỗi: ${"error" in res ? res.error : ""}`);
  const newLeaf = (res as { nested: NestedClip }).nested.subSpec.tracks[0].clips[0];
  eq(newLeaf.duration, 2, "lá trực tiếp duration sau speed 2");
  eq(validateNestedClip((res as { nested: NestedClip }).nested), [], "top sau sửa vẫn hợp lệ");
});

test("cha không ghi trim: lá duy nhất thu ngắn làm lệch duration cha → error", () => {
  const leaf = video("L1", 0, 4, { in: 0, out: 4 });
  const top = nested("top1", 0, 4, specWithTrack("v-in", [leaf]), { speed: 1 });
  const res = updateNestedDeepInnerClip(outerSpec(top), "v-out", "top1", [], "v-in", "L1", { speed: 2 });
  assert("error" in res, "nguồn cha đổi mà cha không ghi trim phải error");
});

// --- (4) Split lá sâu ---

test("split lá L ở cấp 3 tại 2: hai nửa [0,2)/[2,4), top duration/trim không đổi", () => {
  const { top, mid, inner } = fixtureD();
  const res = splitNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "L", 2, idGen);
  assert(!("error" in res), `lỗi: ${"error" in res ? res.error : ""}`);
  const r = res as { nested: NestedClip; left: Clip; right: Clip };
  eq(r.left.duration, 2, "trái duration");
  eq(r.right.duration, 2, "phải duration");
  eq(r.right.start, 2, "phải start");
  assert(r.left.id !== r.right.id, "hai nửa khác id");
  eq(r.nested.duration, 8, "top duration không đổi sau split lá");
  eq(validateNestedClip(r.nested), [], "top sau split lá vẫn hợp lệ");
  // Đi thẳng xuống track cha trực tiếp: top → mid → inner → track v-in.
  const midClip = r.nested.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const innerClip = midClip.subSpec.tracks[0].clips[0] as unknown as NestedClip;
  const leafTrack = innerClip.subSpec.tracks.find((t) => t.id === "v-in")!;
  eq(leafTrack.clips.map((c) => [c.start, c.duration]), [[0, 2], [2, 2], [4, 4]], "track cha: 2 nửa + S, không gap/không đè");
});

test("split lá có curve ở cấp 3 tại 1s: điểm cắt nguồn = 11,125 (in 10 + ∫0..1)", () => {
  const { top } = fixtureR();
  const res = splitNestedDeepInnerClip(outerSpec(top), "v-out", "topR", ["midR", "inR"], "v-in", "LR", 1, idGen);
  assert(!("error" in res), `lỗi: ${"error" in res ? res.error : ""}`);
  const r = res as { nested: NestedClip; left: Clip; right: Clip };
  eq(r.left.duration, 1, "trái duration");
  eq(r.right.duration, 3, "phải duration");
  approx((r.left as unknown as { out: number }).out, 11.125, 1e-9, "trái out = điểm cắt nguồn");
  approx((r.right as unknown as { in: number }).in, 11.125, 1e-9, "phải in = điểm cắt nguồn");
  eq((r.right as unknown as { out: number }).out, 14.875, "phải out giữ nguyên");
  const leftCurve = (r.left as unknown as { speedKeyframes: { keyframes: { t: number; v: number }[] } }).speedKeyframes;
  eq(leftCurve.keyframes.map((k) => [k.t, k.v]), [[0, 1], [1, 1.25]], "curve trái");
  const rightCurve = (r.right as unknown as { speedKeyframes: { keyframes: { t: number; v: number }[] } }).speedKeyframes;
  eq(rightCurve.keyframes.map((k) => [k.t, k.v]), [[0, 1.25], [3, 1.25]], "curve phải rebase về 0");
  eq(validateNestedClip(r.nested), [], "top sau split curve vẫn hợp lệ");
});

test("split lá sát mép (margin 0.05s) / ngoài lá → error", () => {
  const { top } = fixtureD();
  const near = splitNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "L", 0.03, idGen);
  assert("error" in near, "sát mép trái phải error");
  const outside = splitNestedDeepInnerClip(outerSpec(top), "v-out", "top", ["mid", "in"], "v-in", "L", 5, idGen);
  assert("error" in outside, "ngoài lá phải error");
});

console.log(`\nnestedDeepSpeed: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
