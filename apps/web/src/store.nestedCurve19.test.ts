/**
 * store.nestedCurve19.test.ts — Test qua store thật, Phase 9 đợt 19
 * (luồng G2): nối curve của nested clip vào patchClip + action
 * trim-cố-định, cảnh báo lệch tích phân tới được UI (toast).
 *
 * VÌ SAO CHẠY BẰNG esbuild bundle (như store.nestedGuard.test.ts):
 * store.ts dùng import không đuôi mở rộng mà chỉ Vite mới phân giải:
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedCurve19.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedCurve19.test.cjs --log-level=warning
 *   node /tmp/store.nestedCurve19.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * NỘI DUNG (mỗi case cài lại spec mới qua useStore.setState):
 *  S1. patchClip đặt curve 1→2 lên nested D=4 trim [0,4) (nguồn 8s):
 *      duration giữ 4, trim.out thành 6 (= in + ∫), curve được ghi.
 *  S2. patchClip đổi duration 4→2 trên nested đã mang curve 1→2:
 *      curve bị cắt về [0,2) (luật H3/T4 cũ), trim.out thành 2.5
 *      (= ∫₀² (1+t/4) = 2.5) — KHÔNG phải công thức speed hằng.
 *  S3. patchClip đặt curve + trim tường minh lệch tích phân
 *      (trim.out 4 trong khi ∫ = 6): spec giữ trim của user, toast
 *      error báo lệch — không nuốt, không tự sửa trim tường minh.
 *  S4. (ĐỔI CHIỀU đợt 21 T2 — xem §T2 cuối file) patchClip đặt curve
 *      lên nested mà cây con đã có lá mang curve HẰNG 1: nay CHO PHÉP
 *      vì render R1 hợp hai tầng thật (tốc độ hợp [1,2] ⊂ [0.25,4]);
 *      trim.out thành 6, sinh 1 entry undo, toast chỉ còn cảnh báo
 *      vượt nguồn (không còn "hai tầng").
 *  S5. Action patchNestedCurveFixedTrim (trim-cố-định): nested trim
 *      [0,6) + curve 1→2 → duration thành 4, trim giữ [0,6).
 *  S6. (ĐỔI CHIỀU đợt 21 T2) Action trim-cố-định khi cây con đã có lá
 *      mang curve hằng 1 → ok:true, duration 2.9282 (đảo tích phân
 *      D + D²/8 = 4), trim giữ [0,4), sinh 1 entry undo.
 *  S7. Hồi quy: patchClip đổi duration trên nested KHÔNG curve vẫn
 *      dùng công thức speed hằng (trim.out = in + duration × speed).
 *  S8. patchClip đặt curve mà ∫ vượt độ dài nguồn con (nguồn 4s,
 *      ∫ = 6): trim.out vẫn ghi 6 theo §1.3, kèm toast cảnh báo vượt nguồn.
 *
 * KHÔNG assert validateNestedClip rỗng cho nested mang curve: validator
 * của video-spec vẫn áp bất biến duration = (out−in)/speed nên sẽ báo
 * nested có curve là lệch — đó là nợ validator phát hiện trong đợt này
 * (xem LIMITS G2), không phải lỗi của đường store đang test. Chuẩn
 * đúng cho các case trên là bất biến render §1.3 (out = in + ∫, 1e-4).
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import type { Clip, NestedClip, SpeedCurve, VideoSpec } from "@repo-1/video-spec";
import type { NestedDeepPatch } from "./components/nested/nestUtils";

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

type AnyClip = Record<string, unknown> & { id: string; start: number; duration: number };

function subSpec(tracks: { id: string; clips: AnyClip[] }[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: tracks.map((t) => ({ id: t.id, kind: "video", clips: t.clips as unknown as Clip[] })),
  } as unknown as VideoSpec;
}

function videoLeaf(id: string, start: number, duration: number, extra?: Record<string, unknown>): AnyClip {
  return { kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration, ...(extra ?? {}) };
}

function nestedTop(
  id: string,
  inner: VideoSpec,
  duration: number,
  trim?: { in: number; out: number },
): AnyClip {
  return {
    kind: "nested", id, start: 0, duration, speed: 1,
    ...(trim !== undefined ? { trim } : {}),
    subSpec: inner,
  };
}

/** Như nestedTop nhưng đặt được start/speed/field phụ (curve ngoài, reverse) — dùng cho test trim τ đợt 21 T2. */
function nestedTopFull(
  id: string,
  inner: VideoSpec,
  duration: number,
  trim: { in: number; out: number } | undefined,
  start: number,
  extra?: Record<string, unknown>,
): AnyClip {
  return {
    kind: "nested", id, start, duration, speed: 1,
    ...(trim !== undefined ? { trim } : {}),
    subSpec: inner,
    ...(extra ?? {}),
  };
}

function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested curve19 test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  };
  useStore.setState({ spec: spec as never, selection: [], playhead: 0, rippleMode: false });
}

function topNow(id: string): NestedClip {
  const track = useStore.getState().spec.tracks.find((t) => t.id === "v1");
  if (!track) throw new Error("mất track v1");
  const top = track.clips.find((c) => c.id === id);
  if (!top || top.kind !== "nested") throw new Error(`mất nested ${id}`);
  return top as unknown as NestedClip;
}

const CURVE_1_TO_2: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

// Toast hiện tại (subscribe giữ snapshot mới nhất).
let seenToasts: ToastItem[] = [];
subscribeToasts((items) => {
  seenToasts = items;
});
function freshToasts(): void {
  clearToasts();
  seenToasts = [];
}
function toastText(): string {
  return seenToasts.map((t) => `${t.kind}:${t.message}`).join(" | ");
}

// ===========================================================================
console.log("== S1–S8. patchClip nested curve + trim-cố-định ==");

test("S1: patchClip curve 1→2 lên nested D=4 trim [0,4) → trim.out 6, D giữ 4", () => {
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  const top = topNow("n1");
  eq(top.duration, 4, "duration giữ nguyên");
  eq(top.trim, { in: 0, out: 6 }, "trim.out theo tích phân");
  eq((top as unknown as { speedKeyframes: SpeedCurve }).speedKeyframes, CURVE_1_TO_2, "curve được ghi");
});

test("S2: patchClip duration 4→2 trên nested có curve 1→2 → trim.out 2.5 (tích phân lát cắt)", () => {
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]),
    4,
    { in: 0, out: 6 },
  ));
  // Đặt curve trước bằng patchClip (đường S1), rồi đổi duration.
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  eq(topNow("n1").trim, { in: 0, out: 6 }, "điều kiện đầu: trim.out 6");
  useStore.getState().patchClip("v1", "n1", { duration: 2 } as Partial<Clip>);
  const top = topNow("n1");
  eq(top.duration, 2, "duration mới");
  approx((top.trim as { out: number }).out, 2.5, 1e-9, "trim.out theo ∫ lát cắt, không theo speed hằng");
  assert(!toastText().includes("lệch"), `không được toast lệch: ${toastText()}`);
});

test("S3: curve + trim tường minh lệch tích phân → giữ trim user, toast error báo lệch", () => {
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  useStore.getState().patchClip(
    "v1", "n1",
    { speedKeyframes: CURVE_1_TO_2, trim: { in: 0, out: 4 } } as Partial<Clip>,
  );
  const top = topNow("n1");
  eq(top.trim, { in: 0, out: 4 }, "trim tường minh thắng, không bị tự sửa");
  assert(toastText().includes("lệch"), `toast phải báo lệch: ${toastText()}`);
  assert(toastText().includes("render"), `toast phải nói render sẽ từ chối: ${toastText()}`);
});

test("S4 (ĐỔI đợt 21 T2, chặn → cho phép): patchClip curve 1→2 lên nested mà lá con đã có curve hằng 1 → ĐƯỢC GHI, trim.out 6, undo +1", () => {
  freshToasts();
  // Clip id n9 (khác n1 của S1–S3) để mergeKey patch:v1:n9 không gộp
  // vào entry undo của các case trước — đo +1 entry mới chính xác.
  install(nestedTop(
    "n9",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, {
      speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] },
    })] }]),
    4,
    { in: 0, out: 4 },
  ));
  const depthBefore = useStore.getState().undoDepth;
  // Vì sao đổi: render đợt 20 R1 HỢP hai tầng thật — curve ngoài 1→2
  // hợp lệ, curve trong hằng 1 hợp lệ, không reverse, không
  // attachment, tốc độ hợp lấy mẫu = [1, 2] ⊂ [0.25, 4] nên cổng
  // store nay cho qua (trước đây G2 chặn mọi cặp hai tầng).
  // patchClip trả 0 cả khi thành công không rơi keyframe lẫn khi bị
  // từ chối, nên phân biệt bằng spec đổi + undoDepth tăng, không
  // bằng giá trị trả về.
  useStore.getState().patchClip("v1", "n9", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  const top = topNow("n9");
  eq(top.duration, 4, "duration giữ nguyên (chế độ duration-cố-định)");
  eq(top.trim, { in: 0, out: 6 }, "trim.out = in + ∫₀⁴ (1+t/4) = 6");
  eq((top as unknown as { speedKeyframes: SpeedCurve }).speedKeyframes, CURVE_1_TO_2, "curve ngoài được ghi");
  eq(useStore.getState().undoDepth, depthBefore + 1, "lệnh được phép phải sinh đúng 1 entry undo");
  assert(!toastText().includes("hai tầng"), `không được toast hai tầng nữa: ${toastText()}`);
  assert(toastText().includes("vượt"), `chỉ còn toast cảnh báo vượt nguồn (nguồn con 4 < ∫ 6): ${toastText()}`);
});

test("S5: action trim-cố-định — trim [0,6) + curve 1→2 → duration 4, trim giữ nguyên", () => {
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 8, { in: 0, out: 6 }));
  const res = useStore.getState().patchNestedCurveFixedTrim("v1", "n1", CURVE_1_TO_2);
  eq(res.ok, true, "action ok");
  approx(res.duration as number, 4, 1e-6, "duration trả về");
  const top = topNow("n1");
  approx(top.duration, 4, 1e-6, "duration theo đảo tích phân");
  eq(top.trim, { in: 0, out: 6 }, "trim giữ nguyên");
});

test("S6 (ĐỔI đợt 21 T2, chặn → cho phép): action trim-cố-định khi lá con đã có curve hằng 1 → ok, duration 2.9282, trim giữ [0,4)", () => {
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, {
      speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] },
    })] }]),
    4,
    { in: 0, out: 4 },
  ));
  const depthBefore = useStore.getState().undoDepth;
  // Vì sao đổi: cùng lý do S4 — cặp 1→2 × hằng 1 hợp lệ theo R1 nên
  // action nay cho qua. Duration theo đảo tích phân: ∫₀ᴰ (1+t/4) =
  // D + D²/8 = 4 (giữ trim [0,4)) → D = −4 + √48 = 2.92820323.
  const res = useStore.getState().patchNestedCurveFixedTrim("v1", "n1", CURVE_1_TO_2);
  eq(res.ok, true, "action phải cho qua cặp hợp lệ");
  approx(res.duration as number, 2.92820323, 1e-6, "duration trả về theo đảo tích phân");
  const top = topNow("n1");
  approx(top.duration, 2.92820323, 1e-6, "duration theo đảo tích phân");
  eq(top.trim, { in: 0, out: 4 }, "trim giữ nguyên (chế độ trim-cố-định)");
  eq(useStore.getState().undoDepth, depthBefore + 1, "lệnh được phép phải sinh đúng 1 entry undo");
});

test("S7 (hồi quy): patchClip duration trên nested KHÔNG curve vẫn dùng speed hằng", () => {
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]), 4, { in: 0, out: 4 }));
  useStore.getState().patchClip("v1", "n1", { duration: 2 } as Partial<Clip>);
  const top = topNow("n1");
  eq(top.duration, 2, "duration mới");
  eq(top.trim, { in: 0, out: 2 }, "trim.out theo speed hằng (nhánh H2 cũ)");
});

test("S8: curve mà ∫ vượt nguồn con → trim.out vẫn ghi 6, toast cảnh báo vượt nguồn", () => {
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4)] }]), 4, { in: 0, out: 4 }));
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  const top = topNow("n1");
  eq(top.trim, { in: 0, out: 6 }, "trim.out theo §1.3 dù vượt nguồn");
  assert(toastText().includes("vượt"), `toast phải cảnh báo vượt nguồn: ${toastText()}`);
});

// ===========================================================================
// Đợt 21 T2 — Nới guard hai tầng theo luật render R1 + trim đích τ.
// Mỗi case bị chặn đều khóa 3 thứ: spec không đổi, undoDepth không tăng
// (không sinh entry undo cho lệnh bị chặn), toast nói "hai tầng".
// ===========================================================================
console.log("== S9–S15. Guard hai tầng nới theo R1: vẫn chặn đúng case cấm ==");

const CURVE_1_TO_3: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 3, easing: "linear" },
  ],
};
const CURVE_CONST_1: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 1, easing: "linear" },
  ],
};
const CURVE_BAD_V: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 5, easing: "linear" },
  ],
};
const CURVE_129: SpeedCurve = {
  keyframes: Array.from({ length: 129 }, (_, i) => ({ t: (i * 4) / 128, v: 1, easing: "linear" as const })),
};

function leafWithCurve(): AnyClip {
  return videoLeaf("c1", 0, 4, { speedKeyframes: CURVE_CONST_1 });
}

test("S9: curve ngoài có v = 5 (> 4) → chặn, spec không đổi, undo +0, toast hai tầng", () => {
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [leafWithCurve()] }]), 4, { in: 0, out: 4 }));
  const before = JSON.stringify(topNow("n1"));
  const depthBefore = useStore.getState().undoDepth;
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_BAD_V } as Partial<Clip>);
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh entry undo");
  assert(toastText().includes("hai tầng"), `toast phải nói hai tầng: ${toastText()}`);
});

test("S10: lá con reverse mang curve → chặn, spec không đổi, undo +0", () => {
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: CURVE_CONST_1, reverse: true })] }]),
    4,
    { in: 0, out: 4 },
  ));
  const before = JSON.stringify(topNow("n1"));
  const depthBefore = useStore.getState().undoDepth;
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh entry undo");
  assert(toastText().includes("hai tầng"), `toast phải nói hai tầng: ${toastText()}`);
});

test("S11: lá con mang karaoke (attachment thời gian) → chặn, spec không đổi, undo +0", () => {
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, {
      speedKeyframes: CURVE_CONST_1,
      karaoke: [{ text: "a", start: 0, end: 1 }],
    })] }]),
    4,
    { in: 0, out: 4 },
  ));
  const before = JSON.stringify(topNow("n1"));
  const depthBefore = useStore.getState().undoDepth;
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh entry undo");
  assert(toastText().includes("hai tầng"), `toast phải nói hai tầng: ${toastText()}`);
});

test("S12: tốc độ hợp vượt [0.25, 4] (ngoài 1→2 × trong 1→3, mẫu cuối 2×3 = 6) → chặn, undo +0", () => {
  freshToasts();
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: CURVE_1_TO_3 })] }]),
    4,
    { in: 0, out: 4 },
  ));
  const before = JSON.stringify(topNow("n1"));
  const depthBefore = useStore.getState().undoDepth;
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_1_TO_2 } as Partial<Clip>);
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh entry undo");
  assert(toastText().includes("hai tầng"), `toast phải nói hai tầng: ${toastText()}`);
  assert(toastText().includes("vượt"), `toast phải nói rõ tốc độ hợp vượt khoảng: ${toastText()}`);
});

test("S13: curve ngoài 129 keyframe (> 128) → chặn, spec không đổi, undo +0", () => {
  freshToasts();
  install(nestedTop("n1", subSpec([{ id: "it1", clips: [leafWithCurve()] }]), 4, { in: 0, out: 4 }));
  const before = JSON.stringify(topNow("n1"));
  const depthBefore = useStore.getState().undoDepth;
  useStore.getState().patchClip("v1", "n1", { speedKeyframes: CURVE_129 } as Partial<Clip>);
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh entry undo");
  assert(toastText().includes("hai tầng"), `toast phải nói hai tầng: ${toastText()}`);
});

function twoLevelDeepFixture(): void {
  // Top D=4, trim [0,6) khớp ∫₀⁴ (1→2) = 6; nguồn con dài 8 (track it1)
  // nên guard nguồn của cha trực tiếp cho qua (trim.out 6 ≤ nguồn 8).
  // Lá đích L nằm trực tiếp trong top (chain rỗng) trên track it2.
  install(nestedTopFull(
    "n1",
    subSpec([
      { id: "it1", clips: [videoLeaf("c1", 0, 8)] },
      { id: "it2", clips: [videoLeaf("L", 0, 4)] },
    ]),
    4,
    { in: 0, out: 6 },
    0,
    { speedKeyframes: CURVE_1_TO_2 },
  ));
}

function deepLeafCurve(id: string): SpeedCurve | undefined {
  const top = topNow("n1");
  for (const t of (top.subSpec as VideoSpec).tracks) {
    const leaf = t.clips.find((c) => c.id === id);
    if (leaf) return (leaf as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  }
  return undefined;
}

test("S14: deep đặt curve 1→1.5 lên lá dưới top có curve 1→2 → ok (hợp ≤ 2.598 < 4), undo +1", () => {
  freshToasts();
  twoLevelDeepFixture();
  const depthBefore = useStore.getState().undoDepth;
  const patch: NestedDeepPatch = {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1.5, easing: "linear" }] },
  };
  const res = useStore.getState().updateNestedDeepInnerClip("v1", "n1", [], "it2", "L", patch);
  eq(res.ok, true, "cặp hợp lệ phải cho qua");
  eq(deepLeafCurve("L"), patch.speedKeyframes, "curve lá được ghi");
  eq(useStore.getState().undoDepth, depthBefore + 1, "lệnh được phép phải sinh đúng 1 entry undo");
});

test("S15: deep đặt curve 1→3.5 lên lá dưới top có curve 1→2 (tích biên 2×3.5 = 7 > 4) → ok:false, undo +0", () => {
  freshToasts();
  twoLevelDeepFixture();
  const before = JSON.stringify(topNow("n1"));
  const depthBefore = useStore.getState().undoDepth;
  const patch: NestedDeepPatch = {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 3.5, easing: "linear" }] },
  };
  const res = useStore.getState().updateNestedDeepInnerClip("v1", "n1", [], "it2", "L", patch);
  eq(res.ok, false, "cặp vượt khoảng phải bị từ chối");
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi");
  eq(useStore.getState().undoDepth, depthBefore, "không sinh entry undo");
});

// ===========================================================================
console.log("== Tτ1–Tτ4. trimClip nested có curve: đích tính bằng τ, không theo speed hằng ==");

test("Tτ1: trim phải mở rộng ramp 1→2 (speed hằng ghi 1, nguồn 10) → duration 6 theo τ, không phải 10", () => {
  freshToasts();
  // Cap τ: duration D' sao cho ∫₀ᴰ' = 10; ngoài keyframe cuối tốc độ
  // kẹp về 2 nên 6 + 2·(D'−4) = 10 → D' = 6. Cap speed hằng cũ sẽ cho
  // (10−0)/1 = 10 — sai, vì curve tiêu thụ nguồn nhanh hơn speed 1.
  install(nestedTopFull(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 10)] }]),
    4,
    { in: 0, out: 6 },
    0,
    { speedKeyframes: CURVE_1_TO_2 },
  ));
  useStore.getState().trimClip("v1", "n1", "right", 10);
  const top = topNow("n1");
  eq(top.duration, 6, "duration theo cap τ (đảo tích phân), không theo speed hằng");
  eq(top.trim, { in: 0, out: 10 }, "trim.out = in + ∫₀⁴ + 2·(6−4) = 10, đúng cap nguồn");
});

test("Tτ2: trim trái mở rộng ramp 1→2 (speed hằng ghi 2, trim.in 2, start 2) → start 0.5 theo v0 = 1", () => {
  freshToasts();
  // Giới hạn mở rộng theo hàm thuần R2: newIn = in + v0·shift ≥ 0 với
  // v0 = speedAt(curve, 0) = 1 → |shift| ≤ 2. Cap speed hằng cũ cho
  // 2/2 = 1 → start chỉ về được 1.0, sai so với τ/v0.
  install(nestedTopFull(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 10)] }]),
    4,
    { in: 2, out: 8 },
    2,
    { speedKeyframes: CURVE_1_TO_2, speed: 2 },
  ));
  useStore.getState().trimClip("v1", "n1", "left", -1.5);
  const top = topNow("n1");
  eq(top.start, 0.5, "start theo cap v0, không theo speed hằng");
  eq(top.duration, 5.5, "duration = 4 + 1.5");
  eq(top.trim, { in: 0.5, out: 8 }, "trim.in = 2 + 1·(−1.5) = 0.5, trim.out giữ nguyên");
});

test("Tτ3: trim trái cắt đầu ramp 1→2 (trim [2,8), start 2) → trim.in theo ∫, = 3.125", () => {
  freshToasts();
  install(nestedTopFull(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 10)] }]),
    4,
    { in: 2, out: 8 },
    2,
    { speedKeyframes: CURVE_1_TO_2 },
  ));
  useStore.getState().trimClip("v1", "n1", "left", 1);
  const top = topNow("n1");
  eq(top.start, 3, "start mới");
  eq(top.duration, 3, "duration = 4 − 1");
  approx((top.trim as { in: number }).in, 3.125, 1e-9, "trim.in = 2 + ∫₀¹ (1+t/4) = 2 + 1.125");
  eq((top.trim as { out: number }).out, 8, "trim.out giữ nguyên");
});

test("Tτ4a: trim phải bị kẹp ở cap nguồn theo τ (ramp 1→2, nguồn 8) → duration 5, trim.out 8", () => {
  freshToasts();
  install(nestedTopFull(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]),
    4,
    { in: 0, out: 6 },
    0,
    { speedKeyframes: CURVE_1_TO_2 },
  ));
  useStore.getState().trimClip("v1", "n1", "right", 10);
  const top = topNow("n1");
  eq(top.duration, 5, "cap τ: 6 + 2·(D'−4) = 8 → D' = 5");
  eq(top.trim, { in: 0, out: 8 }, "trim.out chạm đúng cap nguồn");
});

test("Tτ4b: trim phải trên nested curve mà trim gốc lệch tích phân (out 5 ≠ in + ∫ 6) → hàm thuần null, spec không đổi, có toast", () => {
  freshToasts();
  install(nestedTopFull(
    "n1",
    subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 10)] }]),
    4,
    { in: 0, out: 5 },
    0,
    { speedKeyframes: CURVE_1_TO_2 },
  ));
  const before = JSON.stringify(topNow("n1"));
  useStore.getState().trimClip("v1", "n1", "right", 1);
  eq(JSON.stringify(topNow("n1")), before, "spec không đổi khi hàm thuần từ chối");
  assert(seenToasts.length > 0, "phải có toast báo trim bị từ chối, không im lặng");
});

console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
