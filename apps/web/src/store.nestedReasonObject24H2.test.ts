/**
 * store.nestedReasonObject24H2.test.ts — Test Phase 9 đợt 24 (luồng H2):
 * xóa mapper khớp chuỗi, đường tạo curve + hàm sâu trả check object.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedToast22A.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedReasonObject24H2.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedReasonObject24H2.test.cjs --log-level=warning
 *   node /tmp/store.nestedReasonObject24H2.test.cjs
 * (Bắt buộc --format=cjs: validate.js dùng dynamic require.)
 *
 * NỘI DUNG:
 *  A. Đường tạo curve: nestedCurveCreateTwoLevelCheck trả check nguyên
 *     (reasonCode + reason), null khi cặp hợp lệ; message toast dịch
 *     qua translateTwoLevelCheck — vi giữ đúng chuỗi cổng, en hoàn
 *     toàn tiếng Anh, không qua chuỗi reason thô.
 *  B. Hàm sâu: updateNestedDeepInnerClip bị cổng lá chặn thì trả kèm
 *     twoLevelCheck (reasonCode + vars); chuỗi error KHÔNG còn khớp
 *     tiền tố cũ mà store đợt 23 G2 tách bằng startsWith — bằng chứng
 *     hợp đồng tiền tố đã chết.
 *  C. Store: action dùng check object (reasonKey = ánh xạ từ code,
 *     toast = dịch theo code), spec không đổi, không sinh undo.
 *  D. Mapper đã xóa: check không code có reason khớp mẫu cũ vẫn trả
 *     nguyên (mapper cũ sẽ dịch sang tiếng Anh); twoLevelReasonCodeKey
 *     ánh xạ đúng code, null cho code lạ/"valid".
 *
 * KHÔNG test component panel trên DOM (như các đợt trước): panel chỉ
 * được kiểm chứng bằng tsc + build. Đường tạo curve của panel đi qua
 * đúng nestedCurveCreateTwoLevelMessage được test ở đây.
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang, t as i18nT } from "./i18n";
import {
  createNestedCurvePreset,
  nestedCurveCreateBlock,
  nestedCurveCreateTwoLevelCheck,
  nestedCurveCreateTwoLevelMessage,
} from "./components/nested/nestedCurveCreate";
import {
  translateTwoLevelCheck,
  twoLevelReasonCodeKey,
} from "./components/nested/nestedRejection";
import {
  updateNestedDeepInnerClip,
  type NestedDeepPatch,
} from "./components/nested/nestUtils";
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
  if (!hay.includes(needle)) throw new Error(`${what} thiếu "${needle}" trong: ${hay}`);
}

function notContains(hay: string, needle: string, what = ""): void {
  if (hay.includes(needle)) throw new Error(`${what} thừa "${needle}" trong: ${hay}`);
}

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

/** Curve hằng v (2 keyframe). */
function constCurve(v: number, dur = 4): SpeedCurve {
  return {
    keyframes: [
      { t: 0, v, easing: "linear" },
      { t: dur, v, easing: "linear" },
    ],
  };
}

function nestedTop(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Compound ${id}`,
    ...(extra ?? {}),
  };
}

function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested reason object 24H2 test", width: 64, height: 64, fps: 30 },
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

/** Dấu tiếng Việt: toast locale en không được chứa bất kỳ dấu nào trong này. */
const VI_MARKERS = [
  "đang reverse",
  "tổ tiên",
  "clip lá",
  "không hợp lệ",
  "vượt khoảng",
  "mang attachment",
  "trục nguồn",
];

// ===========================================================================
// A. Đường tạo curve trả check nguyên
// ===========================================================================
console.log("== A. Đường tạo curve: check nguyên + message dịch theo code ==");

test("A1: lá reverse → block twoLevel + check nguyên leafReverse", () => {
  const top = nestedTop("a1", subSpec([{ id: "it1", clips: [videoLeaf("c1", { reverse: true })] }]));
  eq(nestedCurveCreateBlock(top as unknown as NestedClip), "twoLevel", "block");
  const check = nestedCurveCreateTwoLevelCheck(top as unknown as NestedClip);
  assert(check !== null, "check phải khác null");
  eq(check.ok, false, "check.ok");
  eq(check.reasonCode, "leafReverse", "reasonCode");
  eq(check.reasonVars, { id: "c1" }, "reasonVars");
  contains(check.reason, "reverse", "reason gốc phải nói reverse");
});

test("A2: cặp hợp lệ (lá hằng 1× × preset 1×) → check null, block null", () => {
  const top = nestedTop("a2", subSpec([{ id: "it1", clips: [videoLeaf("c1", { speedKeyframes: constCurve(1) })] }]));
  eq(nestedCurveCreateTwoLevelCheck(top as unknown as NestedClip), null, "check null");
  eq(nestedCurveCreateBlock(top as unknown as NestedClip), null, "block null");
});

test("A3: message tạo curve vi+en — vi đúng chuỗi cổng, en không rò tiếng Việt", () => {
  const top = nestedTop("a3", subSpec([{ id: "it1", clips: [videoLeaf("c1", { reverse: true })] }]));
  setLang("vi");
  const vi = nestedCurveCreateTwoLevelMessage(i18nT, top as unknown as NestedClip);
  assert(vi !== null, "vi message phải khác null");
  contains(vi, "Compound a3", "vi nêu tên clip");
  contains(vi, "đang reverse", "vi giữ đúng nhánh lá reverse");
  setLang("en");
  const en = nestedCurveCreateTwoLevelMessage(i18nT, top as unknown as NestedClip);
  assert(en !== null, "en message phải khác null");
  contains(en, "Compound a3", "en nêu tên clip");
  contains(en, "reversed", "en nói reversed");
  for (const m of VI_MARKERS) notContains(en, m, "en không rò tiếng Việt");
  setLang("vi");
});

test("A4: preset dùng chung cho check — check tạo từ đúng preset 1×", () => {
  const preset = createNestedCurvePreset();
  eq(preset.keyframes.length, 1, "preset 1 keyframe");
  eq(preset.keyframes[0].v, 1, "preset hằng 1×");
});

// ===========================================================================
// B. Hàm sâu trả kèm check object, tiền tố cũ đã chết
// ===========================================================================
console.log("== B. Hàm sâu: twoLevelCheck kèm theo, không tách tiền tố ==");

function deepSpec(): VideoSpec {
  const top = nestedTop("top",
    subSpec([{ id: "v-in", clips: [videoLeaf("L", { reverse: true })] }]),
    { speedKeyframes: constCurve(1) },
  );
  return {
    version: "0.2.0",
    meta: { name: "deep", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  } as unknown as VideoSpec;
}

test("B1: lá reverse dưới top có curve → error kèm twoLevelCheck leafSelfReverse", () => {
  const patch: NestedDeepPatch = { speedKeyframes: constCurve(1) };
  const res = updateNestedDeepInnerClip(deepSpec(), "v1", "top", [], "v-in", "L", patch);
  assert("error" in res, "phải bị chặn");
  const check = (res as { twoLevelCheck?: unknown }).twoLevelCheck as
    | { ok: boolean; reason: string; reasonCode: string; reasonVars?: unknown }
    | undefined;
  assert(check !== undefined, "phải trả kèm twoLevelCheck");
  eq(check.ok, false, "check.ok");
  eq(check.reasonCode, "leafSelfReverse", "reasonCode");
  contains(check.reason, "reverse", "check.reason nói reverse");
});

test("B2: chuỗi error không còn khớp tiền tố cũ của store đợt 23 G2", () => {
  const patch: NestedDeepPatch = { speedKeyframes: constCurve(1) };
  const res = updateNestedDeepInnerClip(deepSpec(), "v1", "top", [], "v-in", "L", patch);
  assert("error" in res, "phải bị chặn");
  // Tiền tố cũ mà store từng tách: "Không tạo được trạng thái hai tầng: "
  // (dấu hai chấm + khoảng trắng ngay sau "tầng"). Format mới chèn code
  // trong ngoặc vuông nên startsWith cũ trả false — store cũ sẽ không
  // nhận ra nhánh này; store mới vẫn xanh chứng tỏ đi đường check.
  assert(
    !res.error.startsWith("Không tạo được trạng thái hai tầng: "),
    `error vẫn khớp tiền tố cũ: ${res.error}`,
  );
  contains(res.error, "[leafSelfReverse]", "error mới kèm code để đọc");
});

// ===========================================================================
// C. Store dùng check object
// ===========================================================================
console.log("== C. Store: reasonKey từ code, toast dịch theo code ==");

for (const lang of ["vi", "en"] as const) {
  test(`C1: store chặn lá reverse (${lang}) → reasonKey + toast + 0 undo`, () => {
    const top = nestedTop("top",
      subSpec([{ id: "v-in", clips: [videoLeaf("L", { reverse: true })] }]),
      { speedKeyframes: constCurve(1) },
    );
    install(top);
    setLang(lang);
    const specBefore = JSON.stringify(useStore.getState().spec);
    const undoBefore = useStore.getState().undoDepth;
    const res = useStore.getState().updateNestedDeepInnerClip(
      "v1", "top", [], "v-in", "L", { speedKeyframes: constCurve(1) },
    );
    eq(res.ok, false, "phải bị chặn");
    // reasonKey phải đúng ánh xạ từ code của check thuần cùng fixture.
    const pure = updateNestedDeepInnerClip(deepSpec(), "v1", "top", [], "v-in", "L", { speedKeyframes: constCurve(1) });
    assert("error" in pure && pure.twoLevelCheck !== undefined, "pure phải trả check");
    eq(res.reasonKey, twoLevelReasonCodeKey(pure.twoLevelCheck.reasonCode), "reasonKey = ánh xạ từ code");
    eq(res.reasonKey, "nested.twoLevelLeafSelfReverse", "reasonKey đúng nhánh");
    assert(typeof res.reason === "string" && res.reason.length > 0, "phải có reason");
    contains(res.reason, "Compound top", "reason nêu tên top");
    if (lang === "vi") contains(res.reason, "Clip lá đang reverse", "vi reason");
    else {
      contains(res.reason, "The leaf clip is reversed", "en reason");
      for (const m of VI_MARKERS) notContains(res.reason, m, "en không rò tiếng Việt");
    }
    const ts = toastsNow();
    eq(ts.length, 1, "đúng 1 toast");
    eq(ts[0].kind, "error", "toast error");
    eq(ts[0].message, res.reason, "toast phải đúng reason trả về");
    eq(JSON.stringify(useStore.getState().spec), specBefore, "spec không đổi");
    eq(useStore.getState().undoDepth, undoBefore, "không sinh entry undo");
    setLang("vi");
  });
}

// ===========================================================================
// D. Mapper đã xóa
// ===========================================================================
console.log("== D. Mapper khớp chuỗi đã xóa ==");

test("D1: check không code có reason khớp mẫu cũ → trả nguyên, không tự dịch", () => {
  // Mẫu cũ của mapper: "Clip lá đang reverse…" từng dịch sang en thành
  // "The leaf clip is reversed…". Nay không còn mapper nên en giữ nguyên.
  setLang("en");
  eq(
    translateTwoLevelCheck(i18nT, { reason: "Clip lá đang reverse — chuỗi lạ không code." }),
    "Clip lá đang reverse — chuỗi lạ không code.",
    "không code → không dịch theo mẫu",
  );
  setLang("vi");
});

test("D2: twoLevelReasonCodeKey ánh xạ đúng, null cho code lạ/valid", () => {
  eq(twoLevelReasonCodeKey("leafSelfReverse"), "nested.twoLevelLeafSelfReverse", "code → key");
  eq(twoLevelReasonCodeKey("ancestorCombinedRange"), "nested.twoLevelAncestorCombinedRange", "code tổ tiên → key");
  eq(twoLevelReasonCodeKey("someFutureBranch"), null, "code lạ → null");
  eq(twoLevelReasonCodeKey("valid"), null, "valid → null");
  eq(twoLevelReasonCodeKey(undefined), null, "thiếu code → null");
});

console.log(`\nH2: ${pass} passed, ${fail} failed${fail > 0 ? ` (${failedNames.join("; ")})` : ""}`);
if (fail > 0) process.exitCode = 1;
