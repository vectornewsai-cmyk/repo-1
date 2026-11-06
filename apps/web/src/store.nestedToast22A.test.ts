/**
 * store.nestedToast22A.test.ts — Test Phase 9 đợt 22 (luồng A):
 * toast clip-aware + i18n hóa reason cổng hai tầng.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedRejection21T3.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedToast22A.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedToast22A.test.cjs --log-level=warning
 *   node /tmp/store.nestedToast22A.test.cjs
 * (Bắt buộc --format=cjs, lý do như T3: validate.js dùng dynamic require.)
 *
 * NỘI DUNG:
 *  C. Câu báo clip-aware (ForClip) cho từng case split/trim — vi+en:
 *     reverse / curveEmpty / curveShape / curveRange / curveIntegral /
 *     curveWindow / reverse+kết hợp range / ramp hợp lệ → "".
 *  T. Dịch check cổng hai tầng theo reasonCode (translateTwoLevelCheck,
 *     đợt 24 H2 thay mapper khớp chuỗi đã xóa): mỗi nhánh gọi CỔNG THẬT
 *     (checkTwoLevelOuterCurve / checkTwoLevelLeafCurve) trên fixture
 *     rồi dịch — vi PHẢI bằng đúng chuỗi cổng từng ký tự, en PHẢI bằng
 *     đúng câu tiếng Anh mới (không còn đuôi tiếng Việt). 10 nhánh cổng
 *     ngoài + 8 nhánh cổng lá + fallback check không code.
 *  S. Store: split nested từng case → toast đúng message chi tiết
 *     (không còn lý do chung); ramp hợp lệ → 0 toast.
 *  G. Store patchClip G2 + action giữ-trim: toast/reason hai tầng ở
 *     locale en không còn tiếng Việt, locale vi giữ đúng chuỗi cũ.
 *
 * KHÔNG test component panel trên DOM: repo không có DOM test runner,
 * phần panel chỉ được kiểm chứng bằng tsc + build như các đợt trước.
 * Quét parity toàn bộ dict vi/en chạy bằng script Python riêng
 * (vi-only [] / en-only []), không nằm trong file test này vì test
 * bundle không import trực tiếp file JSON.
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang, t as i18nT } from "./i18n";
import {
  nestedSpeedRejectionMessageForClip,
  translateTwoLevelCheck,
  type TwoLevelCheckLike,
} from "./components/nested/nestedRejection";
import {
  checkTwoLevelLeafCurve,
  checkTwoLevelOuterCurve,
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

function videoLeaf(id: string, start: number, duration: number, extra?: Record<string, unknown>): AnyClip {
  return { kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration, ...(extra ?? {}) };
}

function leafSpec(): VideoSpec {
  return subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8)] }]);
}

function constCurve(v: number, dur = 4): SpeedCurve {
  return {
    keyframes: [
      { t: 0, v, easing: "linear" },
      { t: dur, v, easing: "linear" },
    ],
  };
}

/** Ramp chuẩn: 1→2 trên D=4, ∫₀⁴ = 6. */
const CURVE_VALID: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

function nestedTop(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 6 }, subSpec: inner, name: `Compound ${id}`,
    ...(extra ?? {}),
  };
}

/** Nested con trong subSpec của top (dùng cho nhánh nested con / nhánh sâu). */
function nestedChild(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Child ${id}`,
    ...(extra ?? {}),
  };
}

function install(top: AnyClip, opts?: { playhead?: number; locked?: boolean }): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested toast 22A test", width: 64, height: 64, fps: 30 },
    tracks: [{
      id: "v1", kind: "video", locked: opts?.locked ?? false,
      clips: [top],
    }],
  };
  useStore.setState({
    spec: spec as never,
    selection: [{ trackId: "v1", clipId: top.id }],
    playhead: opts?.playhead ?? 2,
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

/**
 * Khóa dịch một nhánh cổng theo reasonCode (đợt 24 H2, thay mapper khớp
 * chuỗi đã xóa): gọi cổng thật, lấy check nguyên, rồi kiểm tra vi dịch
 * ra đúng chuỗi cổng từng ký tự và en dịch ra đúng câu mới.
 */
function checkTwoLevelBranch(
  name: string,
  gate: TwoLevelCheckLike,
  enExpected: string,
): void {
  test(name, () => {
    assert(gate.reason !== "", "cổng phải từ chối (reason khác rỗng)");
    setLang("vi");
    eq(translateTwoLevelCheck(i18nT, gate), gate.reason, "vi phải bằng đúng chuỗi cổng");
    setLang("en");
    eq(translateTwoLevelCheck(i18nT, gate), enExpected, "en");
    setLang("vi");
  });
}

// ===========================================================================
// C. Câu báo clip-aware cho từng case split/trim
// ===========================================================================
console.log("== C. Câu báo clip-aware từng case ==");

test("C1: reverse → lý do đảo timeline con (vi+en)", () => {
  const top = nestedTop("c1", leafSpec(), { reverse: true });
  setLang("vi");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "đảo timeline con", "vi");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "reversing the inner timeline", "en");
  setLang("vi");
});

test("C2: curve rỗng → lý do curveEmpty, không nêu lý do chung", () => {
  const top = nestedTop("c2", leafSpec(), { speedKeyframes: { keyframes: [] } });
  setLang("vi");
  const vi = nestedSpeedRejectionMessageForClip(i18nT, top, "Comp");
  contains(vi, "curve rỗng", "vi");
  notContains(vi, "rỗng, sai hình dạng", "vi không được nêu lý do chung");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "empty curve", "en");
  setLang("vi");
});

test("C3: sai hình dạng (easing lạ) → curveShape", () => {
  const bad: SpeedCurve = { keyframes: [{ t: 0, v: 1, easing: "warp" as never }] };
  const top = nestedTop("c3", leafSpec(), { speedKeyframes: bad });
  setLang("vi");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "sai hình dạng", "vi");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "malformed curve", "en");
  setLang("vi");
});

test("C4: vượt biên v=5 → curveRange nêu [0.25, 4]", () => {
  const top = nestedTop("c4", leafSpec(), { speedKeyframes: constCurve(5) });
  setLang("vi");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "[0.25, 4]", "vi");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "[0.25, 4]", "en");
  setLang("vi");
});

test("C5: duration 0 → curveIntegral (không tính được tích phân)", () => {
  const top = nestedTop("c5", leafSpec(), { speedKeyframes: CURVE_VALID, duration: 0 });
  setLang("vi");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "không tính được tích phân", "vi");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "integral cannot be computed", "en");
  setLang("vi");
});

test("C6: lệch cửa sổ trim (out 4 trong khi ∫=6) → curveWindow", () => {
  const top = nestedTop("c6", leafSpec(), {
    speedKeyframes: CURVE_VALID, trim: { in: 0, out: 4 },
  });
  setLang("vi");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "cửa sổ trim lệch", "vi");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "trim window mismatched", "en");
  setLang("vi");
});

test("C7: reverse + ramp vượt biên → cả hai lý do + fix cả hai", () => {
  const top = nestedTop("c7", leafSpec(), { reverse: true, speedKeyframes: constCurve(5) });
  setLang("vi");
  const vi = nestedSpeedRejectionMessageForClip(i18nT, top, "Comp");
  contains(vi, "đảo timeline con", "vi reverse");
  contains(vi, "[0.25, 4]", "vi range");
  contains(vi, "Gỡ speed curve và tắt reverse", "vi fix cả hai");
  setLang("en");
  const en = nestedSpeedRejectionMessageForClip(i18nT, top, "Comp");
  contains(en, "reversing the inner timeline", "en reverse");
  contains(en, "[0.25, 4]", "en range");
  setLang("vi");
});

test("C8: ramp hợp lệ → ForClip rỗng (vi+en), không bị từ chối", () => {
  const top = nestedTop("c8", leafSpec(), { speedKeyframes: CURVE_VALID });
  setLang("vi");
  eq(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "", "vi");
  setLang("en");
  eq(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "", "en");
  setLang("vi");
});

// ===========================================================================
// T. Mapper reason cổng hai tầng — gọi cổng thật từng nhánh
// ===========================================================================
console.log("== T. Dịch check cổng hai tầng theo reasonCode (cổng thật) ==");

checkTwoLevelBranch(
  "T1: cổng ngoài — top reverse",
  checkTwoLevelOuterCurve(nestedTop("t1", leafSpec(), { reverse: true }) as unknown as NestedClip, CURVE_VALID),
  "The nested clip is reversed — the render worker forbids combining reverse with a speed curve.",
);

checkTwoLevelBranch(
  "T2: cổng ngoài — curve ngoài không hợp lệ (v=5)",
  checkTwoLevelOuterCurve(nestedTop("t2", leafSpec()) as unknown as NestedClip, constCurve(5)),
  "The outer speed curve is invalid under render rule R1 (empty or over 128 keyframes, t outside [0, duration], v outside [0.25, 4], or an invalid easing).",
);

checkTwoLevelBranch(
  "T3: cổng ngoài — lá reverse",
  checkTwoLevelOuterCurve(
    nestedTop("t3", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8, { reverse: true })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "Clip “c1” is reversed — the render worker forbids a reversed leaf under a nested clip with a curve.",
);

checkTwoLevelBranch(
  "T4: cổng ngoài — lá mang attachment thời gian",
  checkTwoLevelOuterCurve(
    nestedTop("t4", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8, { volumeKeyframes: [] })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "Clip “c1” carries a time attachment (track/karaoke/animations/volumeKeyframes) — the render worker does not interpolate attachments through a non-linear τ yet.",
);

checkTwoLevelBranch(
  "T5: cổng ngoài — curve lá không hợp lệ (v=5)",
  checkTwoLevelOuterCurve(
    nestedTop("t5", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(5) })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "The speed curve of clip “c1” is invalid under render rule R1.",
);

checkTwoLevelBranch(
  "T6: cổng ngoài — tốc độ hợp trực tiếp vượt [0.25, 4] (lá hằng 4 × ngoài 1→2)",
  checkTwoLevelOuterCurve(
    nestedTop("t6", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "The merged speed of the outer curve with the curve of clip “c1” exceeds [0.25, 4] (product of the two speeds at the sample point).",
);

checkTwoLevelBranch(
  "T7: cổng ngoài — tích keyframe sâu (nested con không curve chứa lá hằng 4)",
  checkTwoLevelOuterCurve(
    nestedTop("t7", subSpec([{
      id: "it1",
      clips: [nestedChild("ch1", subSpec([{ id: "it2", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }]))],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "The keyframe speed product of the outer curve with the curve of clip “c1” exceeds [0.25, 4].",
);

checkTwoLevelBranch(
  "T8: cổng ngoài — curve nested con không hợp lệ (v=5)",
  checkTwoLevelOuterCurve(
    nestedTop("t8", subSpec([{
      id: "it1",
      clips: [nestedChild("ch1", leafSpec(), { speedKeyframes: constCurve(5) })],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "The speed curve of nested clip “ch1” is invalid under render rule R1.",
);

checkTwoLevelBranch(
  "T9: cổng ngoài — tích keyframe với nested con (con hằng 4 × ngoài 1→2)",
  checkTwoLevelOuterCurve(
    nestedTop("t9", subSpec([{
      id: "it1",
      clips: [nestedChild("ch1", leafSpec(), { speedKeyframes: constCurve(4) })],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "The keyframe speed product of the outer curve with the curve of nested clip “ch1” exceeds [0.25, 4].",
);

checkTwoLevelBranch(
  "T10: cổng ngoài — lá text mang speedKeyframes (không trục nguồn)",
  checkTwoLevelOuterCurve(
    nestedTop("t10", subSpec([{
      id: "it1",
      clips: [{ kind: "text", id: "tx1", start: 0, duration: 4, speedKeyframes: constCurve(1) }],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "Clip “tx1” (text) carries speedKeyframes but has no source axis — the render worker only merges curves for video/audio leaves.",
);

// --- Cổng lá (checkTwoLevelLeafCurve) ---
function leafParent(curve: SpeedCurve, extra?: Record<string, unknown>): AnyClip {
  return nestedTop("p1", leafSpec(), { speedKeyframes: curve, ...(extra ?? {}) });
}

checkTwoLevelBranch(
  "T11: cổng lá — lá tự reverse",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4, { reverse: true }) as unknown as Clip,
    constCurve(1),
  ),
  "The leaf clip is reversed — the render worker forbids combining reverse with a speed curve.",
);

checkTwoLevelBranch(
  "T12: cổng lá — lá không phải video/audio",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    { kind: "text", id: "tx1", start: 0, duration: 4 } as unknown as Clip,
    constCurve(1),
  ),
  "Only video/audio leaves may carry a speed curve under a nested clip with a curve (other leaves have no source axis).",
);

checkTwoLevelBranch(
  "T13: cổng lá — lá mang attachment thời gian",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4, { volumeKeyframes: [] }) as unknown as Clip,
    constCurve(1),
  ),
  "The leaf clip carries a time attachment (track/karaoke/animations/volumeKeyframes) — the render worker does not interpolate attachments through a non-linear τ yet.",
);

checkTwoLevelBranch(
  "T14: cổng lá — curve lá không hợp lệ (v=5)",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(5),
  ),
  "The leaf clip's speed curve is invalid under render rule R1.",
);

checkTwoLevelBranch(
  "T15: cổng lá — tổ tiên reverse",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1), { reverse: true }) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(1),
  ),
  "Ancestor nested clip “p1” is reversed — the render worker forbids reverse on a curve-carrying level.",
);

checkTwoLevelBranch(
  "T16: cổng lá — curve tổ tiên không hợp lệ (v=5)",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(5)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(1),
  ),
  "The speed curve of ancestor nested clip “p1” is invalid under render rule R1.",
);

checkTwoLevelBranch(
  "T17: cổng lá — tích keyframe tổ tiên × lá vượt [0.25, 4] (4 × 2)",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(4)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(2),
  ),
  "The keyframe speed product of ancestor curve “p1” with the leaf clip's curve exceeds [0.25, 4].",
);

checkTwoLevelBranch(
  "T18: cổng lá — tốc độ hợp lấy mẫu vượt [0.25, 4] (bezier overshoot tổ tiên × lá hằng 2)",
  checkTwoLevelLeafCurve(
    [leafParent({
      keyframes: [
        { t: 0, v: 1, easing: "bezier", bezier: [0, 2, 1, 2] },
        { t: 4, v: 2, easing: "linear" },
      ],
    }) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(2),
  ),
  "The merged speed of ancestor curve “p1” with the leaf clip's curve exceeds [0.25, 4] (product of the two speeds at the sample point).",
);

test("T19: fallback — check không code trả nguyên reason, không dịch sai", () => {
  // Đợt 24 H2: không còn mapper khớp mẫu — một chuỗi Việt dù khớp mẫu
  // cũ ("Clip lá đang reverse…") mà đi qua check không code vẫn trả
  // nguyên, không tự dịch sang tiếng Anh. Caller muốn dịch phải gắn code.
  setLang("en");
  eq(
    translateTwoLevelCheck(i18nT, { reason: "Clip lá đang reverse — chuỗi lạ không code." }),
    "Clip lá đang reverse — chuỗi lạ không code.",
    "fallback en giữ nguyên",
  );
  setLang("vi");
});

test("T20: mọi key twoLevel* đều resolve đủ vi/en, không rò key thô", () => {
  const keys = [
    "twoLevelTopReverse", "twoLevelOuterInvalid", "twoLevelLeafReverse",
    "twoLevelLeafAttachment", "twoLevelLeafCurveInvalid", "twoLevelCombinedRange",
    "twoLevelKeyframeProduct", "twoLevelNestedCurveInvalid",
    "twoLevelNestedKeyframeProduct", "twoLevelNoSourceAxis",
    "twoLevelLeafSelfReverse", "twoLevelLeafNonMedia",
    "twoLevelLeafSelfAttachment", "twoLevelLeafSelfCurveInvalid",
    "twoLevelAncestorReverse", "twoLevelAncestorCurveInvalid",
    "twoLevelAncestorKeyframeProduct", "twoLevelAncestorCombinedRange",
  ];
  for (const lang of ["vi", "en"] as const) {
    setLang(lang);
    for (const k of keys) {
      const s = i18nT(`nested.${k}`, { id: "c1", kind: "text" });
      assert(!s.includes(`nested.${k}`), `${lang} rò key ${k}`);
      assert(!s.includes("{id}") && !s.includes("{kind}"), `${lang} rò biến ${k}`);
    }
  }
  setLang("vi");
});

// ===========================================================================
// S. Store: split nested từng case → toast đúng message chi tiết
// ===========================================================================
console.log("== S. Store split toast clip-aware ==");

function splitToastCase(name: string, top: AnyClip, needle: string): void {
  test(name, () => {
    install(top);
    eq(useStore.getState().splitAtPlayhead(), false, "phải tách thất bại");
    const ts = toastsNow();
    eq(ts.length, 1, "đúng 1 toast");
    eq(ts[0].kind, "error", "toast error");
    contains(ts[0].message, needle, "toast phải nêu đúng lý do chi tiết");
  });
}

splitToastCase(
  "S1: split nested curve rỗng → toast nêu 'curve rỗng'",
  nestedTop("s1", leafSpec(), { speedKeyframes: { keyframes: [] } }),
  "curve rỗng",
);

splitToastCase(
  "S2: split nested sai hình dạng → toast nêu 'sai hình dạng'",
  nestedTop("s2", leafSpec(), {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "warp" }] },
  }),
  "sai hình dạng",
);

splitToastCase(
  "S3: split nested vượt biên → toast nêu '[0.25, 4]', không nêu lý do chung",
  nestedTop("s3", leafSpec(), { speedKeyframes: constCurve(5) }),
  "[0.25, 4]",
);

splitToastCase(
  "S4: split nested lệch cửa sổ trim → toast nêu 'cửa sổ trim lệch'",
  nestedTop("s4", leafSpec(), { speedKeyframes: CURVE_VALID, trim: { in: 0, out: 4 } }),
  "cửa sổ trim lệch",
);

splitToastCase(
  "S5: split nested reverse → toast nêu 'đảo timeline con'",
  nestedTop("s5", leafSpec(), { reverse: true }),
  "đảo timeline con",
);

test("S6: split nested ramp hợp lệ → true, 0 toast", () => {
  install(nestedTop("s6", leafSpec(), { speedKeyframes: CURVE_VALID }));
  eq(useStore.getState().splitAtPlayhead(), true, "ramp hợp lệ phải tách được");
  eq(toastsNow().length, 0, "0 toast");
});

// ===========================================================================
// G. Store: toast/reason hai tầng qua i18n ở cả hai locale
// ===========================================================================
console.log("== G. Store hai tầng qua i18n ==");

test("G1: patchClip G2 en — toast nêu tốc độ hợp bằng tiếng Anh, không lẫn tiếng Việt", () => {
  install(nestedTop("g1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])));
  setLang("en");
  eq(useStore.getState().patchClip("v1", "g1", { speedKeyframes: CURVE_VALID } as Partial<Clip>), 0, "cặp vi phạm phải bị từ chối");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  contains(ts[0].message, "merged speed", "en nêu tốc độ hợp");
  notContains(ts[0].message, "Tốc độ hợp", "en không lẫn đuôi tiếng Việt");
  setLang("vi");
});

test("G2: patchClip G2 vi — toast giữ đúng chuỗi cổng cũ", () => {
  install(nestedTop("g2", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])));
  setLang("vi");
  eq(useStore.getState().patchClip("v1", "g2", { speedKeyframes: CURVE_VALID } as Partial<Clip>), 0, "cặp vi phạm phải bị từ chối");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  contains(ts[0].message, "Tốc độ hợp của curve ngoài với curve của clip \"c1\" vượt khoảng [0.25, 4]", "vi giữ chuỗi cổng");
  setLang("vi");
});

test("G3: action giữ-trim en — reason đúng key, không còn tiếng Việt", () => {
  install(nestedTop("g3", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])));
  setLang("en");
  const res = useStore.getState().patchNestedCurveFixedTrim("v1", "g3", CURVE_VALID);
  eq(res.ok, false, "cặp vi phạm phải bị từ chối");
  if (!res.ok) {
    eq(res.reasonKey, "nested.fixedTrimTwoLevel", "reasonKey");
    const reason = res.reason ?? "";
    contains(reason, "merged speed", "en nêu tốc độ hợp");
    notContains(reason, "Tốc độ hợp", "en không lẫn đuôi tiếng Việt");
    notContains(reason, "Bên trong nested", "en không lẫn đầu tiếng Việt");
  }
  setLang("vi");
});

test("G4: action giữ-trim vi — reason = đầu cũ + ' ' + chuỗi cổng", () => {
  install(nestedTop("g4", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])));
  setLang("vi");
  const res = useStore.getState().patchNestedCurveFixedTrim("v1", "g4", CURVE_VALID);
  eq(res.ok, false, "cặp vi phạm phải bị từ chối");
  if (!res.ok) {
    eq(res.reasonKey, "nested.fixedTrimTwoLevel", "reasonKey");
    const reason = res.reason ?? "";
    contains(reason, "Bên trong nested clip đã có clip mang speed curve", "vi giữ đầu cũ");
    contains(reason, "Tốc độ hợp của curve ngoài với curve của clip \"c1\" vượt khoảng [0.25, 4]", "vi giữ chuỗi cổng");
  }
  setLang("vi");
});

// ===========================================================================
console.log(`\nKết quả: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(" | ")}`);
  process.exitCode = 1;
}
