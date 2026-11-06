/**
 * store.nestedLeafGate23G2.test.ts — Test Phase 9 đợt 23 (luồng G2):
 * nối 8 nhánh cổng lá (checkTwoLevelLeafCurve) ra UI sống.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedToast22A.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedLeafGate23G2.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedLeafGate23G2.test.cjs --log-level=warning
 *   node /tmp/store.nestedLeafGate23G2.test.cjs
 * (Bắt buộc --format=cjs, lý do như T3: validate.js dùng dynamic require.)
 *
 * NỘI DUNG (mọi case đều qua STORE ACTION THẬT
 * updateNestedDeepInnerClip, không mock store, không gọi cổng thuần trực
 * tiếp để kết luận):
 *  L. 8 nhánh cổng lá — mỗi nhánh bị chặn đúng + 1 toast error đúng nội
 *     dung vi+en + reasonKey đúng + spec không đổi + không sinh undo:
 *       leafSelfReverse / leafNonMedia / leafSelfAttachment /
 *       leafSelfCurveInvalid / ancestorReverse / ancestorCurveInvalid /
 *       ancestorKeyframeProduct / ancestorCombinedRange.
 *     7 nhánh chạy chain rỗng (lá trực tiếp trong top — đúng hình gọi
 *     của nút panel mới trong InnerClipEditor); nhánh keyframeProduct
 *     chạy thêm chain sâu ["mid", "in"] để chứng minh đường dây không
 *     chỉ đúng ở chain rỗng.
 *  V. Nhánh hợp lệ không toast: cặp top 1× × lá 1→1.5 (chain rỗng và
 *     chain sâu) và trường hợp tổ tiên không mang curve (cổng trả ok
 *     ngay) — cả ba đều ok:true, 0 toast, lá nhận curve, có 1 entry undo.
 *  C. nestedCurveCreate: helper dịch-tại-điểm-toast
 *     (nestedCurveCreateTwoLevelMessage) — locale en không còn rò chuỗi
 *     tiếng Việt nội bộ của cổng; locale vi giữ đúng wording cũ; clip
 *     không bị chặn / đã có curve → helper null (không toast sai).
 *
 * KHÔNG test component panel trên DOM: repo không có DOM test runner,
 * phần panel chỉ được kiểm chứng bằng tsc + build như các đợt trước.
 * Nút panel mới gọi đúng hình updateNestedDeepInnerClip(..., [], ...)
 * mà nhóm L/V khóa ở đây (chain rỗng).
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang, t as i18nT } from "./i18n";
import {
  nestedCurveCreateBlock,
  nestedCurveCreateTwoLevelMessage,
} from "./components/nested/nestedCurveCreate";
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
  "đang reverse",
  "tổ tiên",
  "clip lá",
  "không hợp lệ",
  "vượt khoảng",
  "mang attachment",
  "trục nguồn",
  "Không đặt",
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

function textLeaf(id: string): AnyClip {
  return { kind: "text", id, start: 0, duration: 4, text: "x" };
}

/** Curve hằng v (2 keyframe, đủ cho kiểm tra keyframe/range của cổng). */
function constCurve(v: number, dur = 4): SpeedCurve {
  return {
    keyframes: [
      { t: 0, v, easing: "linear" },
      { t: dur, v, easing: "linear" },
    ],
  };
}

/** Ramp 1→1.5 trên D=4 (cặp hợp lệ với tổ tiên hằng 1×). */
const CURVE_1_TO_1_5: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 1.5, easing: "linear" },
  ],
};

/** Bezier tổ tiên overshoot (fixture T18 đợt 22 A): lấy mẫu hợp vượt 4 khi × lá 2×. */
const CURVE_ANCESTOR_OVERSHOOT: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "bezier", bezier: [0, 2, 1, 2] },
    { t: 4, v: 2, easing: "linear" },
  ],
};

function nestedTop(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Compound ${id}`,
    ...(extra ?? {}),
  };
}

function nestedChild(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Child ${id}`,
    ...(extra ?? {}),
  };
}

function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested leaf gate 23G2 test", width: 64, height: 64, fps: 30 },
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

/** Lá trực tiếp trong top (chain rỗng) sau khi action chạy. */
function directLeaf(): AnyClip | undefined {
  const top = useStore.getState().spec.tracks[0]?.clips[0] as unknown as AnyClip | undefined;
  const sub = top?.["subSpec"] as unknown as VideoSpec | undefined;
  const track = sub?.tracks.find((t) => t.id === "v-in");
  return track?.clips.find((c) => c.id === "L") as unknown as AnyClip | undefined;
}

/** Lá sâu top → mid → in (chain ["mid", "in"]) sau khi action chạy. */
function deepLeaf(): AnyClip | undefined {
  const top = useStore.getState().spec.tracks[0]?.clips[0] as unknown as AnyClip | undefined;
  const findNested = (spec: VideoSpec | undefined, id: string): AnyClip | undefined =>
    spec?.tracks.flatMap((t) => t.clips).find((c) => c.id === id) as unknown as AnyClip | undefined;
  const mid = findNested(top?.["subSpec"] as unknown as VideoSpec | undefined, "mid");
  const inner = findNested(mid?.["subSpec"] as unknown as VideoSpec | undefined, "in");
  const track = (inner?.["subSpec"] as unknown as VideoSpec | undefined)?.tracks
    .find((t) => t.id === "v-in");
  return track?.clips.find((c) => c.id === "L") as unknown as AnyClip | undefined;
}

/**
 * Cây sâu top → mid → in → lá: chain ["mid", "in"] có nghĩa là "mid"
 * là nested con trực tiếp của top và "in" là nested con trực tiếp của
 * mid (chainIds là id các NESTED trung gian, không phải id track).
 */
function deepTop(leaf: AnyClip, topExtra: Record<string, unknown>): AnyClip {
  return nestedTop("top",
    subSpec([{
      id: "v-mid",
      clips: [nestedChild("mid",
        subSpec([{
          id: "v-mid-in",
          clips: [nestedChild("in",
            subSpec([{ id: "v-in", clips: [leaf] }]),
          ) as unknown as AnyClip],
        }]),
      ) as unknown as AnyClip],
    }]),
    topExtra);
}

// ===========================================================================
// L. 8 nhánh cổng lá qua store action thật
// ===========================================================================
console.log("== L. 8 nhánh cổng lá qua store action ==");

interface LeafBranchCase {
  /** Tên nhánh (để đọc log). */
  name: string;
  /** Top đã install (ghi đè trim/curve/reverse theo nhánh). */
  top: AnyClip;
  /** chainIds cho action (rỗng = lá trực tiếp, đúng hình nút panel). */
  chain: string[];
  /** Curve patch đặt lên lá. */
  patch: SpeedCurve;
  /** reasonKey i18n mà store phải trả. */
  reasonKey: string;
  /** Mảnh vi phải có trong toast + reason. */
  viNeedle: string;
  /** Mảnh en phải có trong toast + reason. */
  enNeedle: string;
  /** Hàm đọc lá sau action (để khẳng định spec không đổi). */
  readLeaf: () => AnyClip | undefined;
}

function leafBranchCase(c: LeafBranchCase): void {
  for (const lang of ["vi", "en"] as const) {
    test(`L: ${c.name} (${lang}) → chặn + toast + reasonKey + 0 undo`, () => {
      install(c.top);
      setLang(lang);
      const specBefore = JSON.stringify(useStore.getState().spec);
      const undoBefore = useStore.getState().undoDepth;
      const res = useStore.getState().updateNestedDeepInnerClip(
        "v1", "top", c.chain, "v-in", "L", { speedKeyframes: c.patch },
      );
      eq(res.ok, false, "phải bị chặn");
      eq(res.reasonKey, c.reasonKey, "reasonKey");
      assert(typeof res.reason === "string" && res.reason.length > 0, "phải có reason");
      contains(res.reason, lang === "vi" ? c.viNeedle : c.enNeedle, `${lang} reason`);
      contains(res.reason, "Compound top", "reason phải nêu tên nested clip ngoài");
      const ts = toastsNow();
      eq(ts.length, 1, "đúng 1 toast");
      eq(ts[0].kind, "error", "toast error");
      eq(ts[0].message, res.reason, "toast phải đúng reason trả về");
      contains(ts[0].message, lang === "vi" ? c.viNeedle : c.enNeedle, `${lang} toast`);
      if (lang === "en") {
        for (const m of VI_MARKERS) notContains(ts[0].message, m, "en không rò tiếng Việt");
      }
      eq(JSON.stringify(useStore.getState().spec), specBefore, "spec không đổi");
      eq(useStore.getState().undoDepth, undoBefore, "không sinh entry undo");
      const leaf = c.readLeaf();
      assert(leaf !== undefined, "phải đọc được lá sau action");
      eq(
        (leaf as Record<string, unknown>)["speedKeyframes"],
        undefined,
        "lá không được nhận curve",
      );
      setLang("vi");
    });
  }
}

function directTop(leaf: AnyClip, topExtra: Record<string, unknown>): AnyClip {
  return nestedTop("top", subSpec([{ id: "v-in", clips: [leaf] }]), topExtra);
}

leafBranchCase({
  name: "leafSelfReverse — lá tự reverse",
  top: directTop(videoLeaf("L", { reverse: true }), { speedKeyframes: constCurve(1) }),
  chain: [],
  patch: constCurve(1),
  reasonKey: "nested.twoLevelLeafSelfReverse",
  viNeedle: "Clip lá đang reverse",
  enNeedle: "The leaf clip is reversed",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "leafNonMedia — lá chữ đặt curve",
  top: directTop(textLeaf("L"), { speedKeyframes: constCurve(1) }),
  chain: [],
  patch: constCurve(1),
  reasonKey: "nested.twoLevelLeafNonMedia",
  viNeedle: "Chỉ lá video/audio mới mang speed curve",
  enNeedle: "Only video/audio leaves",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "leafSelfAttachment — lá mang volumeKeyframes",
  top: directTop(videoLeaf("L", { volumeKeyframes: [] }), { speedKeyframes: constCurve(1) }),
  chain: [],
  patch: constCurve(1),
  reasonKey: "nested.twoLevelLeafSelfAttachment",
  viNeedle: "Clip lá mang attachment thời gian",
  enNeedle: "carries a time attachment",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "leafSelfCurveInvalid — curve lá v=5",
  top: directTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }),
  chain: [],
  patch: constCurve(5),
  reasonKey: "nested.twoLevelLeafSelfCurveInvalid",
  viNeedle: "Speed curve của clip lá không hợp lệ",
  enNeedle: "leaf clip's speed curve is invalid",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "ancestorReverse — tổ tiên reverse",
  top: directTop(videoLeaf("L"), { speedKeyframes: constCurve(1), reverse: true }),
  chain: [],
  patch: constCurve(1),
  reasonKey: "nested.twoLevelAncestorReverse",
  viNeedle: 'tổ tiên "top" đang reverse',
  enNeedle: "is reversed",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "ancestorCurveInvalid — curve tổ tiên v=5",
  top: directTop(videoLeaf("L"), { speedKeyframes: constCurve(5) }),
  chain: [],
  patch: constCurve(1),
  reasonKey: "nested.twoLevelAncestorCurveInvalid",
  viNeedle: 'Speed curve của nested clip tổ tiên "top" không hợp lệ',
  enNeedle: "speed curve of ancestor nested clip",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "ancestorKeyframeProduct — tổ tiên 4× × lá 2×",
  top: directTop(videoLeaf("L"), { speedKeyframes: constCurve(4), trim: { in: 0, out: 16 } }),
  chain: [],
  patch: constCurve(2),
  reasonKey: "nested.twoLevelAncestorKeyframeProduct",
  viNeedle: 'Tích tốc độ keyframe của curve tổ tiên "top"',
  enNeedle: "keyframe speed product of ancestor curve",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "ancestorCombinedRange — bezier tổ tiên overshoot × lá 2×",
  top: directTop(videoLeaf("L"), { speedKeyframes: CURVE_ANCESTOR_OVERSHOOT, trim: { in: 0, out: 6 } }),
  chain: [],
  patch: constCurve(2),
  reasonKey: "nested.twoLevelAncestorCombinedRange",
  viNeedle: 'Tốc độ hợp của curve tổ tiên "top"',
  enNeedle: "merged speed of ancestor curve",
  readLeaf: directLeaf,
});

leafBranchCase({
  name: "ancestorKeyframeProduct sâu — chain [mid, in]",
  top: deepTop(videoLeaf("L"), { speedKeyframes: constCurve(4), trim: { in: 0, out: 16 } }),
  chain: ["mid", "in"],
  patch: constCurve(2),
  reasonKey: "nested.twoLevelAncestorKeyframeProduct",
  viNeedle: 'Tích tốc độ keyframe của curve tổ tiên "top"',
  enNeedle: "keyframe speed product of ancestor curve",
  readLeaf: deepLeaf,
});

// ===========================================================================
// V. Nhánh hợp lệ không toast
// ===========================================================================
console.log("== V. Nhánh hợp lệ không toast ==");

test("V1: top 1× × lá 1→1.5 (chain rỗng) → ok, 0 toast, lá nhận curve, +1 undo", () => {
  install(directTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }));
  setLang("vi");
  const undoBefore = useStore.getState().undoDepth;
  const res = useStore.getState().updateNestedDeepInnerClip(
    "v1", "top", [], "v-in", "L", { speedKeyframes: CURVE_1_TO_1_5 },
  );
  eq(res.ok, true, "cặp hợp lệ phải cho qua");
  eq(toastsNow().length, 0, "0 toast");
  assert(useStore.getState().undoDepth > undoBefore, "phải có entry undo");
  const leaf = directLeaf();
  assert(leaf !== undefined, "phải đọc được lá");
  eq(
    (leaf as Record<string, unknown>)["speedKeyframes"],
    CURVE_1_TO_1_5,
    "lá nhận đúng curve",
  );
});

test("V2: top 1× × lá 1→1.5 (chain sâu) → ok, 0 toast", () => {
  install(deepTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }));
  setLang("en");
  const res = useStore.getState().updateNestedDeepInnerClip(
    "v1", "top", ["mid", "in"], "v-in", "L", { speedKeyframes: CURVE_1_TO_1_5 },
  );
  eq(res.ok, true, "cặp hợp lệ sâu phải cho qua");
  eq(toastsNow().length, 0, "0 toast");
  const leaf = deepLeaf();
  assert(leaf !== undefined, "phải đọc được lá sâu");
  eq(
    (leaf as Record<string, unknown>)["speedKeyframes"],
    CURVE_1_TO_1_5,
    "lá sâu nhận đúng curve",
  );
  setLang("vi");
});

test("V3: tổ tiên không mang curve → cổng ok ngay, ok, 0 toast", () => {
  install(directTop(videoLeaf("L"), {}));
  setLang("vi");
  const res = useStore.getState().updateNestedDeepInnerClip(
    "v1", "top", [], "v-in", "L", { speedKeyframes: CURVE_1_TO_1_5 },
  );
  eq(res.ok, true, "một tầng phải cho qua");
  eq(toastsNow().length, 0, "0 toast");
});

// ===========================================================================
// C. nestedCurveCreate dịch tại điểm toast
// ===========================================================================
console.log("== C. nestedCurveCreate dịch tại điểm toast ==");

function createBlockedTop(): AnyClip {
  // Top chưa có curve, chứa lá reverse → đường tạo bị chặn ở nhánh
  // twoLevel của cổng ngoài (lá reverse dưới nested sắp mang curve).
  return nestedTop("top", subSpec([{ id: "v-in", clips: [videoLeaf("L", { reverse: true })] }]), {});
}

test("C1: tạo curve bị chặn twoLevel — vi giữ đúng wording cổng cũ", () => {
  setLang("vi");
  const top = createBlockedTop() as unknown as NestedClip;
  eq(nestedCurveCreateBlock(top), "twoLevel", "phải chặn ở nhánh twoLevel");
  const msg = nestedCurveCreateTwoLevelMessage(i18nT, top);
  assert(msg !== null, "helper phải trả message");
  contains(msg, "Không tạo được trạng thái hai tầng", "vi wrapper");
  contains(msg, "đang reverse", "vi reason cổng");
  contains(msg, "Compound top", "vi nêu tên clip");
});

test("C2: tạo curve bị chặn twoLevel — en hoàn toàn tiếng Anh, không rò tiếng Việt", () => {
  setLang("en");
  const top = createBlockedTop() as unknown as NestedClip;
  const msg = nestedCurveCreateTwoLevelMessage(i18nT, top);
  assert(msg !== null, "helper phải trả message");
  contains(msg, "Cannot create two curve levels", "en wrapper");
  contains(msg, "is reversed", "en reason cổng");
  for (const m of VI_MARKERS) notContains(msg, m, "en không rò tiếng Việt");
  notContains(msg, "nested.", "en không rò key thô");
  setLang("vi");
});

test("C3: clip tạo được / đã có curve → helper null (không toast sai nhánh)", () => {
  setLang("vi");
  const okTop = directTop(videoLeaf("L"), {}) as unknown as NestedClip;
  eq(nestedCurveCreateBlock(okTop), null, "cặp hợp lệ không bị chặn");
  eq(nestedCurveCreateTwoLevelMessage(i18nT, okTop), null, "không bị chặn thì helper null");
  const hasTop = directTop(videoLeaf("L"), { speedKeyframes: constCurve(1) }) as unknown as NestedClip;
  eq(nestedCurveCreateBlock(hasTop), "alreadyHas", "đã có curve");
  eq(nestedCurveCreateTwoLevelMessage(i18nT, hasTop), null, "nhánh alreadyHas thì helper null");
});

console.log(`\n${pass} pass, ${fail} fail${fail > 0 ? ` — FAIL: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
