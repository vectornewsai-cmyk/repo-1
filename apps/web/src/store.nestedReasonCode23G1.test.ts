/**
 * store.nestedReasonCode23G1.test.ts — Test Phase 9 đợt 23 (luồng G1):
 * cổng hai tầng trả reasonCode, dịch theo code thay vì khớp chuỗi.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedToast22A.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedReasonCode23G1.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedReasonCode23G1.test.cjs --log-level=warning
 *   node /tmp/store.nestedReasonCode23G1.test.cjs
 * (Bắt buộc --format=cjs: validate.js dùng dynamic require.)
 *
 * NỘI DUNG:
 *  A. Mỗi nhánh cổng thật (10 cổng ngoài + 8 cổng lá) trả đúng
 *     reasonCode, và dịch theo code cho đúng vi (bằng đúng chuỗi cổng)
 *     + en (câu tiếng Anh đợt 22 A) — bảng code đầy đủ 18 code.
 *  B. BẰNG CHỨNG dịch theo code bền hơn khớp chuỗi: đổi wording reason
 *     nhưng giữ nguyên code+vars → dịch theo code vẫn đúng vi+en,
 *     trong khi check mất code (đợt 24 H2, mapper đã xóa) chỉ còn
 *     fallback trả nguyên chuỗi lạ.
 *  C. Fallback: check không có code, code lạ, code "valid" → không trả
 *     key thô, không mất thông tin (đợt 24 H2: không còn dịch qua
 *     wording như mapper cũ — mất code thì en giữ nguyên chuỗi gốc).
 *  D. Store qua code: patchClip G2 + action giữ-trim ở locale en cho
 *     đúng câu tiếng Anh (đường code, không qua khớp chuỗi).
 *  E. Bao phủ: mọi code đều resolve đủ vi/en, không rò key hay biến.
 *
 * KHÔNG test component panel trên DOM (như đợt 22 A): panel chỉ được
 * kiểm chứng bằng tsc + build.
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang, t as i18nT } from "./i18n";
import {
  translateTwoLevelCheck,
  translateTwoLevelReasonByCode,
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

function nestedChild(id: string, inner: VideoSpec, extra?: Record<string, unknown>): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 4 }, subSpec: inner, name: `Child ${id}`,
    ...(extra ?? {}),
  };
}

function leafParent(curve: SpeedCurve, extra?: Record<string, unknown>): AnyClip {
  return nestedTop("p1", leafSpec(), { speedKeyframes: curve, ...(extra ?? {}) });
}

function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested reasonCode 23G1 test", width: 64, height: 64, fps: 30 },
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

type GateCheck = ReturnType<typeof checkTwoLevelOuterCurve>;

/**
 * Khóa một nhánh cổng theo code: cổng thật phải từ chối với đúng code,
 * dịch theo check phải cho vi = đúng chuỗi cổng và en = câu mới.
 */
function checkBranch(
  name: string,
  check: GateCheck,
  code: string,
  enExpected: string,
): void {
  test(name, () => {
    assert(!check.ok, "cổng phải từ chối");
    assert(check.reason !== "", "reason phải khác rỗng");
    eq(check.reasonCode, code, "reasonCode");
    setLang("vi");
    eq(translateTwoLevelCheck(i18nT, check), check.reason, "vi theo code phải bằng đúng chuỗi cổng");
    eq(
      translateTwoLevelReasonByCode(i18nT, check.reasonCode, check.reasonVars),
      check.reason,
      "vi dịch trực tiếp theo code",
    );
    setLang("en");
    eq(translateTwoLevelCheck(i18nT, check), enExpected, "en theo code");
    eq(
      translateTwoLevelReasonByCode(i18nT, check.reasonCode, check.reasonVars),
      enExpected,
      "en dịch trực tiếp theo code",
    );
    setLang("vi");
  });
}

// ===========================================================================
// A. Bảng 18 code qua cổng thật
// ===========================================================================
console.log("== A. reasonCode từng nhánh cổng thật ==");

checkBranch(
  "A1: cổng ngoài — top reverse",
  checkTwoLevelOuterCurve(nestedTop("t1", leafSpec(), { reverse: true }) as unknown as NestedClip, CURVE_VALID),
  "topReverse",
  "The nested clip is reversed — the render worker forbids combining reverse with a speed curve.",
);

checkBranch(
  "A2: cổng ngoài — curve ngoài không hợp lệ",
  checkTwoLevelOuterCurve(nestedTop("t2", leafSpec()) as unknown as NestedClip, constCurve(5)),
  "outerInvalid",
  "The outer speed curve is invalid under render rule R1 (empty or over 128 keyframes, t outside [0, duration], v outside [0.25, 4], or an invalid easing).",
);

checkBranch(
  "A3: cổng ngoài — lá reverse",
  checkTwoLevelOuterCurve(
    nestedTop("t3", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8, { reverse: true })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "leafReverse",
  "Clip “c1” is reversed — the render worker forbids a reversed leaf under a nested clip with a curve.",
);

checkBranch(
  "A4: cổng ngoài — lá mang attachment thời gian",
  checkTwoLevelOuterCurve(
    nestedTop("t4", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 8, { volumeKeyframes: [] })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "leafAttachment",
  "Clip “c1” carries a time attachment (track/karaoke/animations/volumeKeyframes) — the render worker does not interpolate attachments through a non-linear τ yet.",
);

checkBranch(
  "A5: cổng ngoài — curve lá không hợp lệ",
  checkTwoLevelOuterCurve(
    nestedTop("t5", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(5) })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "leafCurveInvalid",
  "The speed curve of clip “c1” is invalid under render rule R1.",
);

checkBranch(
  "A6: cổng ngoài — tốc độ hợp trực tiếp vượt [0.25, 4]",
  checkTwoLevelOuterCurve(
    nestedTop("t6", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "combinedRange",
  "The merged speed of the outer curve with the curve of clip “c1” exceeds [0.25, 4] (product of the two speeds at the sample point).",
);

checkBranch(
  "A7: cổng ngoài — tích keyframe sâu (lá hằng 4 dưới nested con)",
  checkTwoLevelOuterCurve(
    nestedTop("t7", subSpec([{
      id: "it1",
      clips: [nestedChild("ch1", subSpec([{ id: "it2", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }]))],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "keyframeProduct",
  "The keyframe speed product of the outer curve with the curve of clip “c1” exceeds [0.25, 4].",
);

checkBranch(
  "A8: cổng ngoài — curve nested con không hợp lệ",
  checkTwoLevelOuterCurve(
    nestedTop("t8", subSpec([{
      id: "it1",
      clips: [nestedChild("ch1", leafSpec(), { speedKeyframes: constCurve(5) })],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "nestedCurveInvalid",
  "The speed curve of nested clip “ch1” is invalid under render rule R1.",
);

checkBranch(
  "A9: cổng ngoài — tích keyframe với nested con",
  checkTwoLevelOuterCurve(
    nestedTop("t9", subSpec([{
      id: "it1",
      clips: [nestedChild("ch1", leafSpec(), { speedKeyframes: constCurve(4) })],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "nestedKeyframeProduct",
  "The keyframe speed product of the outer curve with the curve of nested clip “ch1” exceeds [0.25, 4].",
);

checkBranch(
  "A10: cổng ngoài — lá text mang speedKeyframes (không trục nguồn)",
  checkTwoLevelOuterCurve(
    nestedTop("t10", subSpec([{
      id: "it1",
      clips: [{ kind: "text", id: "tx1", start: 0, duration: 4, speedKeyframes: constCurve(1) }],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  ),
  "noSourceAxis",
  "Clip “tx1” (text) carries speedKeyframes but has no source axis — the render worker only merges curves for video/audio leaves.",
);

checkBranch(
  "A11: cổng lá — lá tự reverse",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4, { reverse: true }) as unknown as Clip,
    constCurve(1),
  ),
  "leafSelfReverse",
  "The leaf clip is reversed — the render worker forbids combining reverse with a speed curve.",
);

checkBranch(
  "A12: cổng lá — lá không phải video/audio",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    { kind: "text", id: "tx1", start: 0, duration: 4 } as unknown as Clip,
    constCurve(1),
  ),
  "leafNonMedia",
  "Only video/audio leaves may carry a speed curve under a nested clip with a curve (other leaves have no source axis).",
);

checkBranch(
  "A13: cổng lá — lá mang attachment thời gian",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4, { volumeKeyframes: [] }) as unknown as Clip,
    constCurve(1),
  ),
  "leafSelfAttachment",
  "The leaf clip carries a time attachment (track/karaoke/animations/volumeKeyframes) — the render worker does not interpolate attachments through a non-linear τ yet.",
);

checkBranch(
  "A14: cổng lá — curve lá không hợp lệ",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(5),
  ),
  "leafSelfCurveInvalid",
  "The leaf clip's speed curve is invalid under render rule R1.",
);

checkBranch(
  "A15: cổng lá — tổ tiên reverse",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(1), { reverse: true }) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(1),
  ),
  "ancestorReverse",
  "Ancestor nested clip “p1” is reversed — the render worker forbids reverse on a curve-carrying level.",
);

checkBranch(
  "A16: cổng lá — curve tổ tiên không hợp lệ",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(5)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(1),
  ),
  "ancestorCurveInvalid",
  "The speed curve of ancestor nested clip “p1” is invalid under render rule R1.",
);

checkBranch(
  "A17: cổng lá — tích keyframe tổ tiên × lá vượt [0.25, 4]",
  checkTwoLevelLeafCurve(
    [leafParent(constCurve(4)) as unknown as NestedClip],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(2),
  ),
  "ancestorKeyframeProduct",
  "The keyframe speed product of ancestor curve “p1” with the leaf clip's curve exceeds [0.25, 4].",
);

checkBranch(
  "A18: cổng lá — tốc độ hợp lấy mẫu vượt [0.25, 4] (bezier overshoot)",
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
  "ancestorCombinedRange",
  "The merged speed of ancestor curve “p1” with the leaf clip's curve exceeds [0.25, 4] (product of the two speeds at the sample point).",
);

test("A19: cổng cho qua → reasonCode 'valid', reason rỗng", () => {
  const ok = checkTwoLevelOuterCurve(nestedTop("ok1", leafSpec()) as unknown as NestedClip, CURVE_VALID);
  eq(ok.ok, true, "ok");
  eq(ok.reason, "", "reason rỗng");
  eq(ok.reasonCode, "valid", "code valid");
  const okLeaf = checkTwoLevelLeafCurve(
    [] as unknown as NestedClip[],
    videoLeaf("c1", 0, 4) as unknown as Clip,
    constCurve(1),
  );
  eq(okLeaf.reasonCode, "valid", "lá không tầng tổ tiên → valid");
});

// ===========================================================================
// B. Đổi wording, giữ code → dịch theo code vẫn đúng, mapper cũ sai
// ===========================================================================
console.log("== B. Đổi wording reason, code không đổi ==");

test("B1: combinedRange đổi wording → theo code vẫn đúng, check không code fallback", () => {
  const gate = checkTwoLevelOuterCurve(
    nestedTop("b1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])) as unknown as NestedClip,
    CURVE_VALID,
  );
  eq(gate.reasonCode, "combinedRange", "code gốc");
  const mutated = { ...gate, reason: "WORDING MỚI — tốc độ hợp đã đổi câu chữ hoàn toàn." };
  setLang("vi");
  eq(translateTwoLevelCheck(i18nT, mutated), gate.reason, "vi theo code vẫn bằng câu cũ đúng");
  setLang("en");
  contains(translateTwoLevelCheck(i18nT, mutated), "merged speed", "en theo code vẫn đúng");
  // Đợt 24 H2 (mapper đã xóa): check mất code thì không còn đường dịch
  // theo mẫu — fallback trả nguyên chuỗi lạ, không dịch sai sang en.
  const noCode = { reason: mutated.reason };
  eq(translateTwoLevelCheck(i18nT, noCode), mutated.reason, "không code → fallback nguyên chuỗi");
  notContains(translateTwoLevelCheck(i18nT, noCode), "merged speed", "không code thì không dịch được");
  setLang("vi");
});

test("B2: noSourceAxis đổi wording, giữ vars id+kind → dịch đúng cả hai locale", () => {
  const gate = checkTwoLevelOuterCurve(
    nestedTop("b2", subSpec([{
      id: "it1",
      clips: [{ kind: "text", id: "tx9", start: 0, duration: 4, speedKeyframes: constCurve(1) }],
    }])) as unknown as NestedClip,
    CURVE_VALID,
  );
  eq(gate.reasonCode, "noSourceAxis", "code gốc");
  eq(gate.reasonVars, { id: "tx9", kind: "text" }, "vars gốc");
  const mutated = { ...gate, reason: "Câu chữ hoàn toàn mới, không còn mẫu cũ." };
  setLang("vi");
  eq(translateTwoLevelCheck(i18nT, mutated), gate.reason, "vi theo code");
  setLang("en");
  contains(translateTwoLevelCheck(i18nT, mutated), "tx9", "en giữ id");
  contains(translateTwoLevelCheck(i18nT, mutated), "(text)", "en giữ kind");
  setLang("vi");
});

test("B3: topReverse đổi wording, không có vars → dịch đúng, không rò biến", () => {
  const gate = checkTwoLevelOuterCurve(nestedTop("b3", leafSpec(), { reverse: true }) as unknown as NestedClip, CURVE_VALID);
  const mutated = { ...gate, reason: "Reverse wording changed entirely." };
  setLang("en");
  eq(
    translateTwoLevelCheck(i18nT, mutated),
    "The nested clip is reversed — the render worker forbids combining reverse with a speed curve.",
    "en theo code",
  );
  setLang("vi");
});

// ===========================================================================
// C. Fallback khi code vắng / lạ / valid
// ===========================================================================
console.log("== C. Fallback ==");

test("C1: check không có code → fallback trả nguyên reason (vi trùng, en không dịch)", () => {
  const gate = checkTwoLevelOuterCurve(
    nestedTop("c1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])) as unknown as NestedClip,
    CURVE_VALID,
  );
  const legacy = { reason: gate.reason };
  setLang("vi");
  eq(translateTwoLevelCheck(i18nT, legacy), gate.reason, "vi fallback trùng câu gốc");
  // Đợt 24 H2 (mapper đã xóa): mất code thì en KHÔNG còn dịch được —
  // trả nguyên chuỗi Việt gốc. Đây là tín hiệu để caller gắn code,
  // không phải lỗi: caller sống nào cũng đã có code từ đợt này.
  setLang("en");
  eq(translateTwoLevelCheck(i18nT, legacy), gate.reason, "en fallback giữ nguyên chuỗi gốc");
  setLang("vi");
});

test("C2: code lạ → không dịch qua wording nữa, trả nguyên reason, không trả key thô", () => {
  const gate = checkTwoLevelOuterCurve(nestedTop("c2", leafSpec(), { reverse: true }) as unknown as NestedClip, CURVE_VALID);
  const weird = { ...gate, reasonCode: "someFutureBranch" };
  setLang("en");
  eq(
    translateTwoLevelCheck(i18nT, weird),
    gate.reason,
    "code lạ → giữ nguyên reason gốc (không dịch sai, không rò key)",
  );
  eq(translateTwoLevelReasonByCode(i18nT, "someFutureBranch"), null, "ByCode trả null cho code lạ");
  setLang("vi");
});

test("C3: code lạ + reason lạ → giữ nguyên reason (không mất thông tin)", () => {
  const weird = { reason: "lý do lạ chưa biết", reasonCode: "someFutureBranch" };
  setLang("en");
  eq(translateTwoLevelCheck(i18nT, weird), "lý do lạ chưa biết", "fallback cuối giữ nguyên");
  setLang("vi");
});

test("C4: code 'valid' → dịch theo code trả null, check cho qua dịch ra rỗng", () => {
  eq(translateTwoLevelReasonByCode(i18nT, "valid"), null, "valid → null");
  eq(translateTwoLevelReasonByCode(i18nT, undefined), null, "thiếu code → null");
  setLang("en");
  eq(translateTwoLevelCheck(i18nT, { reason: "", reasonCode: "valid" }), "", "check cho qua → rỗng");
  setLang("vi");
});

// ===========================================================================
// D. Store qua code (patchClip G2 + giữ-trim)
// ===========================================================================
console.log("== D. Store qua reasonCode ==");

test("D1: patchClip G2 en — toast tiếng Anh qua code, không lẫn tiếng Việt", () => {
  install(nestedTop("d1", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])));
  setLang("en");
  eq(useStore.getState().patchClip("v1", "d1", { speedKeyframes: CURVE_VALID } as Partial<Clip>), 0, "cặp vi phạm phải bị từ chối");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  contains(ts[0].message, "merged speed", "en nêu tốc độ hợp");
  notContains(ts[0].message, "Tốc độ hợp", "en không lẫn đuôi tiếng Việt");
  setLang("vi");
});

test("D2: action giữ-trim en — reason qua code, không còn tiếng Việt", () => {
  install(nestedTop("d2", subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: constCurve(4) })] }])));
  setLang("en");
  const res = useStore.getState().patchNestedCurveFixedTrim("v1", "d2", CURVE_VALID);
  eq(res.ok, false, "cặp vi phạm phải bị từ chối");
  if (!res.ok) {
    eq(res.reasonKey, "nested.fixedTrimTwoLevel", "reasonKey");
    contains(res.reason ?? "", "merged speed", "en nêu tốc độ hợp");
    notContains(res.reason ?? "", "Tốc độ hợp", "en không lẫn đuôi tiếng Việt");
  }
  setLang("vi");
});

// ===========================================================================
// E. Bao phủ code → key
// ===========================================================================
console.log("== E. Bao phủ code ==");

test("E1: đủ 18 code resolve vi+en, không rò key hay biến", () => {
  const codes: [string, Record<string, string>][] = [
    ["topReverse", {}], ["outerInvalid", {}],
    ["leafReverse", { id: "c1" }], ["leafAttachment", { id: "c1" }],
    ["leafCurveInvalid", { id: "c1" }], ["combinedRange", { id: "c1" }],
    ["keyframeProduct", { id: "c1" }], ["nestedCurveInvalid", { id: "c1" }],
    ["nestedKeyframeProduct", { id: "c1" }], ["noSourceAxis", { id: "c1", kind: "text" }],
    ["leafSelfReverse", {}], ["leafNonMedia", {}],
    ["leafSelfAttachment", {}], ["leafSelfCurveInvalid", {}],
    ["ancestorReverse", { id: "p1" }], ["ancestorCurveInvalid", { id: "p1" }],
    ["ancestorKeyframeProduct", { id: "p1" }], ["ancestorCombinedRange", { id: "p1" }],
  ];
  eq(codes.length, 18, "đủ 18 code");
  for (const lang of ["vi", "en"] as const) {
    setLang(lang);
    for (const [code, vars] of codes) {
      const s = translateTwoLevelReasonByCode(i18nT, code, vars);
      assert(s !== null, `${lang} code ${code} phải resolve`);
      assert(!s.includes("nested.twoLevel"), `${lang} rò key ở code ${code}`);
      assert(!s.includes("{id}") && !s.includes("{kind}"), `${lang} rò biến ở code ${code}`);
    }
  }
  setLang("vi");
});

// ===========================================================================
console.log(`\nKết quả: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(" | ")}`);
  process.exitCode = 1;
}
