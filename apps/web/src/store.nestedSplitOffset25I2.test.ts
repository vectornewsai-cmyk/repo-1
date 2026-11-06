/**
 * store.nestedSplitOffset25I2.test.ts — Test Phase 9 đợt 25 (luồng I2):
 * nối nestedSplitOffset (đợt 24 H1) vào store action mới
 * splitNestedDeepInnerClipAtOuterOffset + panel NestedClipPanel.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedDeepLeaf24H6.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedSplitOffset25I2.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedSplitOffset25I2.test.cjs --log-level=warning
 *   node /tmp/store.nestedSplitOffset25I2.test.cjs
 *
 * NỘI DUNG (mọi case đều qua STORE ACTION THẬT, không qua helper thuần):
 *  A. Mốc neo tính tay đợt H1 qua action: mốc ngoài 11.4641s → lá 2.0s
 *     (ramp top 1→3, top start=10); chuỗi 2 tầng ramp; hỗn hợp hằng+ramp.
 *     Thành công kiểm tra: 2 nửa lá (duration/in/out), +1 entry undo,
 *     trim tổ tiên không đổi + ∫ tính tay khớp trim.out − trim.in.
 *  E. Split ở biên: biên đầu tuyệt đối (mốc = absoluteStart) bị chặn
 *     margin; gần biên cuối (lá 3.98/4) bị chặn margin; ngay trong
 *     margin (lá 3.9/4) tách thành công — khóa biên margin không chặn thừa.
 *  O. Mốc ngoài miền (trước/sau cửa sổ, cả chain sâu 2 tầng) → chặn,
 *     không toast thiếu, spec không đổi, 0 entry undo.
 *  C. Curve sai hình dạng ở top (v=5) → fail-fast reasonKey curveInvalid,
 *     không sinh undo, toast en không rò tiếng Việt.
 *  I. Hàm tách trong từ chối (lá reverse + curve) → reasonKey innerFailed.
 *  N. Chain sai id / track con sai → notFound, 0 toast (quy ước H6).
 *
 * Panel không có DOM test runner nên phần component chỉ kiểm chứng
 * bằng tsc + vite build như các đợt trước (ghi rõ trong LIMITS I2).
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang } from "./i18n";
import type { Clip, SpeedCurve, SpeedKeyframe, VideoSpec } from "@repo-1/video-spec";

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

function contains(hay: string, needle: string, what = ""): void {
  if (hay.includes(needle)) return;
  throw new Error(`${what} thiếu "${needle}" trong: ${hay}`);
}

function notContains(hay: string, needle: string, what = ""): void {
  if (hay.includes(needle)) throw new Error(`${what} thừa "${needle}" trong: ${hay}`);
}

/** Dấu tiếng Việt: toast locale en không được chứa bất kỳ dấu nào trong này. */
const VI_MARKERS = [
  "tổ tiên",
  "clip lá",
  "không hợp lệ",
  "Không tách",
  "quá sát mép",
  "ngoài phần khả kiến",
];

type AnyClip = Record<string, unknown> & {
  id: string;
  start: number;
  duration: number;
};

function subSpec(tracks: { id: string; clips: AnyClip[] }[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: tracks.map((t) => ({
      id: t.id,
      kind: "video",
      clips: t.clips as unknown as Clip[],
    })),
  } as unknown as VideoSpec;
}

function videoLeaf(id: string, extra?: Record<string, unknown>): AnyClip {
  return { kind: "video", id, src: "src.mp4", start: 0, duration: 4, in: 0, out: 4, ...(extra ?? {}) };
}

/** Ramp tuyến tính v0→v1 trên [0, duration]. */
function linRamp(v0: number, v1: number, duration: number): SpeedCurve {
  const kfs: SpeedKeyframe[] = [
    { t: 0, v: v0, easing: "linear" },
    { t: duration, v: v1, easing: "linear" },
  ];
  return { keyframes: kfs };
}

/** τ giải tích cho ramp 1→3, duration 4 (đảo của u + u²/4) — như test H1. */
const tau13 = (w: number): number => -2 + Math.sqrt(4 + 4 * w);
/** τ giải tích cho ramp 1→2, duration 4 (đảo của u + u²/8) — như test H1. */
const tau12 = (w: number): number => -4 + Math.sqrt(16 + 8 * w);

/** Lá trong top start=10 duration=4 mang ramp (mặc định 1→3, trim [0,8)). */
function rampTopLeaf(leaf: AnyClip, curve: SpeedCurve = linRamp(1, 3, 4)): AnyClip {
  return {
    kind: "nested", id: "top", start: 10, duration: 4, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([{ id: "v-in", clips: [leaf] }]),
    speedKeyframes: curve, name: "Compound top",
  };
}

/** Lá trong mid ramp 1→2 rồi top ramp 1→3 (cả hai start=0 duration=4). */
function rampTwoTop(leaf: AnyClip): AnyClip {
  const mid: AnyClip = {
    kind: "nested", id: "mid", start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 6 }, subSpec: subSpec([{ id: "v-in", clips: [leaf] }]),
    speedKeyframes: linRamp(1, 2, 4), name: "Child mid",
  };
  return {
    kind: "nested", id: "top", start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 8 }, subSpec: subSpec([{ id: "v-mid", clips: [mid] }]),
    speedKeyframes: linRamp(1, 3, 4), name: "Compound top",
  };
}

/** Lá trong mid ramp 1→2 rồi top tốc độ hằng 2 (không trim, duration 2). */
function mixedTop(leaf: AnyClip): AnyClip {
  const mid: AnyClip = {
    kind: "nested", id: "mid", start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 6 }, subSpec: subSpec([{ id: "v-in", clips: [leaf] }]),
    speedKeyframes: linRamp(1, 2, 4), name: "Child mid",
  };
  return {
    kind: "nested", id: "top", start: 0, duration: 2, speed: 2,
    subSpec: subSpec([{ id: "v-mid", clips: [mid] }]), name: "Compound top",
  };
}

function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested split offset 25I2 test", width: 64, height: 64, fps: 30 },
    tracks: [{
      id: "v1", kind: "video", locked: false,
      clips: [top],
    }],
  };
  useStore.setState({
    spec: spec as never,
    selection: [{ trackId: "v1", clipId: top.id }],
    playhead: 2,
    rippleMode: false,
  });
  clearToasts();
}

function toastsNow(): ToastItem[] {
  let out: ToastItem[] = [];
  const unsub = subscribeToasts((list) => {
    out = list;
  });
  unsub();
  return out;
}

function readTop(): AnyClip | undefined {
  return useStore.getState().spec.tracks[0]?.clips[0] as unknown as AnyClip | undefined;
}

/** Clip của track chứa lá sau khi đi hết chainIds từ top. */
function readLeafClips(chainIds: string[]): AnyClip[] {
  const top = readTop();
  let cur = top?.["subSpec"] as unknown as VideoSpec | undefined;
  for (const id of chainIds) {
    const found = cur?.tracks.flatMap((t) => t.clips).find((c) => c.id === id) as unknown as AnyClip | undefined;
    cur = found?.["subSpec"] as unknown as VideoSpec | undefined;
  }
  const track = cur?.tracks.find((t) => t.id === "v-in");
  return (track?.clips ?? []) as unknown as AnyClip[];
}

/** Bất biến trim của top: trim không đổi + ∫ tính tay khớp trim.out − trim.in. */
function assertTopTrimIntact(expectedTrim: { in: number; out: number }, integral: number): void {
  const top = readTop();
  assert(top !== undefined, "phải đọc được top sau action");
  eq(top["trim"], expectedTrim, "trim của top không được đổi sau khi tách lá");
  approx(
    (expectedTrim.out - expectedTrim.in), integral, 1e-9,
    "trim.out − trim.in phải khớp ∫ curve tính tay",
  );
}

interface BlockedCase {
  name: string;
  top: AnyClip;
  chain: string[];
  outer: number;
  reasonKey: string;
  viNeedle: string;
  enNeedle: string;
  expectToasts: number;
}

function blockedCase(c: BlockedCase): void {
  for (const lang of ["vi", "en"] as const) {
    test(`blocked: ${c.name} (${lang})`, () => {
      install(c.top);
      setLang(lang);
      const specBefore = JSON.stringify(useStore.getState().spec);
      const undoBefore = useStore.getState().undoDepth;
      const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
        "v1", "top", c.chain, "v-in", "L", c.outer,
      );
      eq(res.ok, false, "phải bị chặn");
      eq(res.reasonKey, c.reasonKey, "reasonKey");
      assert(typeof res.reason === "string" && res.reason.length > 0, "phải có reason");
      contains(res.reason, lang === "vi" ? c.viNeedle : c.enNeedle, `${lang} reason`);
      const ts = toastsNow();
      eq(ts.length, c.expectToasts, "số toast");
      if (c.expectToasts === 1) {
        eq(ts[0].kind, "error", "toast error");
        eq(ts[0].message, res.reason, "toast phải đúng reason trả về");
        if (lang === "en") {
          for (const m of VI_MARKERS) notContains(ts[0].message, m, "en không rò tiếng Việt");
        }
      }
      eq(JSON.stringify(useStore.getState().spec), specBefore, "spec không đổi");
      eq(useStore.getState().undoDepth, undoBefore, "không sinh entry undo");
      setLang("vi");
    });
  }
}

// ===========================================================================
// A. Mốc neo tính tay qua store action thật
// ===========================================================================
console.log("== A. Mốc neo qua action ==");

test("A1: ramp top 1→3, mốc ngoài 11.4641s → lá 2.0s, 2 nửa + undo + trim", () => {
  install(rampTopLeaf(videoLeaf("L", { in: 100, out: 104 })));
  setLang("vi");
  const outer = 10 + tau13(2);
  approx(outer, 11.4641, 1e-4, "mốc neo làm tròn của đợt H1");
  const undoBefore = useStore.getState().undoDepth;
  const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
    "v1", "top", [], "v-in", "L", outer,
  );
  eq(res.ok, true, "phải tách được");
  approx(res.leafLocalTime!, 2, 1e-9, "leafLocalTime τ");
  approx(res.splitTime!, 2, 1e-9, "splitTime = leaf.start + leafLocalTime");
  assert(useStore.getState().undoDepth > undoBefore, "phải có entry undo");
  eq(toastsNow().length, 0, "thành công không toast");
  const leaves = readLeafClips([]);
  eq(leaves.length, 2, "lá tách thành 2");
  eq(leaves[0].id, "L", "nửa trái giữ id");
  approx(leaves[0].duration, 2, 1e-6, "nửa trái dài 2s");
  approx(leaves[1].duration, 2, 1e-6, "nửa phải dài 2s");
  // start nửa phải = splitTime = leaf.start + leafLocalTime nên mang
  // epsilon bisection của helper (không phải số tròn) — so 1e-9.
  approx(leaves[1].start, 2, 1e-9, "nửa phải bắt đầu tại 2s");
  eq(leaves[0]["in"], 100, "nửa trái in");
  eq(leaves[0]["out"], 102, "nửa trái out = điểm cắt nguồn");
  eq(leaves[1]["in"], 102, "nửa phải in nối tiếp");
  eq(leaves[1]["out"], 104, "nửa phải out");
  // ∫₀⁴ (1 + t/2) dt = 4 + 4 = 8 = trim.out − trim.in của top.
  assertTopTrimIntact({ in: 0, out: 8 }, 8);
});

test("A2: hai tầng ramp, mốc ngoài = τ₁₃(τ₁₂(2)) → lá 2.0s", () => {
  install(rampTwoTop(videoLeaf("L", { in: 100, out: 104 })));
  setLang("vi");
  const outer = tau13(tau12(2));
  const undoBefore = useStore.getState().undoDepth;
  const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
    "v1", "top", ["mid"], "v-in", "L", outer,
  );
  eq(res.ok, true, "phải tách được");
  approx(res.leafLocalTime!, 2, 1e-9, "leafLocalTime chuỗi τ");
  approx(res.splitTime!, 2, 1e-9, "splitTime");
  assert(useStore.getState().undoDepth > undoBefore, "phải có entry undo");
  const leaves = readLeafClips(["mid"]);
  eq(leaves.length, 2, "lá tách thành 2");
  approx(leaves[0].duration, 2, 1e-6, "nửa trái dài 2s");
  approx(leaves[1].duration, 2, 1e-6, "nửa phải dài 2s");
  eq(leaves[1]["in"], 102, "nửa phải in nối tiếp");
  assertTopTrimIntact({ in: 0, out: 8 }, 8);
  const top = readTop();
  const topSub = top?.["subSpec"] as unknown as VideoSpec | undefined;
  const mid = topSub?.tracks.flatMap((t) => t.clips).find((c) => c.id === "mid") as AnyClip | undefined;
  eq(mid?.["trim"], { in: 0, out: 6 }, "trim của mid không đổi");
});

test("A3: hỗn hợp hằng+ramp, mốc ngoài = τ₁₂(2)/2 → lá 2.0s", () => {
  install(mixedTop(videoLeaf("L", { in: 100, out: 104 })));
  setLang("vi");
  const outer = tau12(2) / 2;
  const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
    "v1", "top", ["mid"], "v-in", "L", outer,
  );
  eq(res.ok, true, "phải tách được");
  approx(res.leafLocalTime!, 2, 1e-9, "leafLocalTime hỗn hợp");
  const leaves = readLeafClips(["mid"]);
  eq(leaves.length, 2, "lá tách thành 2");
  approx(leaves[0].duration, 2, 1e-6, "nửa trái dài 2s");
  approx(leaves[1].duration, 2, 1e-6, "nửa phải dài 2s");
});

// ===========================================================================
// E. Split ở biên (margin 0.05s của hàm thuần)
// ===========================================================================
console.log("== E. Biên ==");

blockedCase({
  name: "biên đầu tuyệt đối (mốc = absoluteStart 10) → sát mép",
  top: rampTopLeaf(videoLeaf("L", { in: 100, out: 104 })),
  chain: [],
  outer: 10,
  reasonKey: "nested.splitOffsetTooCloseToEdge",
  viNeedle: "quá sát mép clip lá",
  enNeedle: "too close to the leaf clip's edge",
  expectToasts: 1,
});

blockedCase({
  name: "gần biên cuối (lá 3.98/4) → sát mép",
  top: rampTopLeaf(videoLeaf("L", { in: 100, out: 104 })),
  chain: [],
  outer: 10 + tau13(3.98),
  reasonKey: "nested.splitOffsetTooCloseToEdge",
  viNeedle: "quá sát mép clip lá",
  enNeedle: "too close to the leaf clip's edge",
  expectToasts: 1,
});

test("E3: ngay trong margin (lá 3.9/4) tách thành công, không chặn thừa", () => {
  install(rampTopLeaf(videoLeaf("L", { in: 100, out: 104 })));
  setLang("vi");
  const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
    "v1", "top", [], "v-in", "L", 10 + tau13(3.9),
  );
  eq(res.ok, true, "3.9 < 4 − 0.05 nên phải tách được");
  approx(res.leafLocalTime!, 3.9, 1e-9, "leafLocalTime");
  const leaves = readLeafClips([]);
  eq(leaves.length, 2, "lá tách thành 2");
  approx(leaves[0].duration, 3.9, 1e-6, "nửa trái dài 3.9s");
  approx(leaves[1].duration, 0.1, 1e-6, "nửa phải dài 0.1s");
});

// ===========================================================================
// O. Mốc ngoài miền — C. Curve sai hình dạng — I. Hàm trong từ chối
// ===========================================================================
console.log("== O/C/I. Chặn ==");

blockedCase({
  name: "trước cửa sổ khả kiến (9.9 < 10) → ngoài miền",
  top: rampTopLeaf(videoLeaf("L", { in: 100, out: 104 })),
  chain: [],
  outer: 9.9,
  reasonKey: "nested.splitOffsetOutOfRange",
  viNeedle: "ngoài phần khả kiến của clip lá",
  enNeedle: "outside the leaf clip's visible window",
  expectToasts: 1,
});

blockedCase({
  name: "sau cửa sổ khả kiến (12.6 > 12.4721) → ngoài miền",
  top: rampTopLeaf(videoLeaf("L", { in: 100, out: 104 })),
  chain: [],
  outer: 12.6,
  reasonKey: "nested.splitOffsetOutOfRange",
  viNeedle: "ngoài phần khả kiến của clip lá",
  enNeedle: "outside the leaf clip's visible window",
  expectToasts: 1,
});

blockedCase({
  name: "ngoài miền ở chain sâu 2 tầng (99) → ngoài miền",
  top: rampTwoTop(videoLeaf("L", { in: 100, out: 104 })),
  chain: ["mid"],
  outer: 99,
  reasonKey: "nested.splitOffsetOutOfRange",
  viNeedle: "ngoài phần khả kiến của clip lá",
  enNeedle: "outside the leaf clip's visible window",
  expectToasts: 1,
});

blockedCase({
  name: "curve top v=5 → fail-fast curveInvalid",
  top: rampTopLeaf(videoLeaf("L", { in: 100, out: 104 }), linRamp(1, 5, 4)),
  chain: [],
  outer: 11,
  reasonKey: "nested.splitOffsetCurveInvalid",
  viNeedle: "không đảo được mốc ngoài",
  enNeedle: "cannot be inverted",
  expectToasts: 1,
});

blockedCase({
  name: "lá reverse + curve → hàm trong từ chối (innerFailed)",
  top: rampTopLeaf(videoLeaf("L", {
    in: 10, out: 16, reverse: true, speedKeyframes: linRamp(1, 2, 4),
  })),
  chain: [],
  outer: 10 + tau13(2),
  reasonKey: "nested.splitOffsetInnerFailed",
  viNeedle: "Không tách được clip lá tại điểm đã đổi",
  enNeedle: "Cannot split the leaf clip at the mapped point",
  expectToasts: 1,
});

// ===========================================================================
// N. Lookup sai — không toast (quy ước lỗi chain đợt 24 H6)
// ===========================================================================
console.log("== N. Lookup sai ==");

test("N: chain sai id → notFound, 0 toast, spec không đổi, 0 undo", () => {
  install(rampTwoTop(videoLeaf("L", { in: 100, out: 104 })));
  setLang("vi");
  const specBefore = JSON.stringify(useStore.getState().spec);
  const undoBefore = useStore.getState().undoDepth;
  const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
    "v1", "top", ["mid", "wrong"], "v-in", "L", 1,
  );
  eq(res.ok, false, "phải bị chặn");
  eq(res.reasonKey, "nested.splitOffsetNotFound", "reasonKey");
  assert(typeof res.reason === "string" && res.reason.length > 0, "phải có reason");
  eq(toastsNow().length, 0, "lỗi lookup không toast");
  eq(JSON.stringify(useStore.getState().spec), specBefore, "spec không đổi");
  eq(useStore.getState().undoDepth, undoBefore, "không sinh entry undo");
});

test("N: track con sai id → notFound, 0 toast", () => {
  install(rampTopLeaf(videoLeaf("L", { in: 100, out: 104 })));
  setLang("vi");
  const specBefore = JSON.stringify(useStore.getState().spec);
  const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
    "v1", "top", [], "v-wrong", "L", 11,
  );
  eq(res.ok, false, "phải bị chặn");
  eq(res.reasonKey, "nested.splitOffsetNotFound", "reasonKey");
  eq(toastsNow().length, 0, "lỗi lookup không toast");
  eq(JSON.stringify(useStore.getState().spec), specBefore, "spec không đổi");
});

console.log(`\nstore.nestedSplitOffset25I2: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
