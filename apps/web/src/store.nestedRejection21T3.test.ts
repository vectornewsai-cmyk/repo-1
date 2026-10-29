/**
 * store.nestedRejection21T3.test.ts — Test Phase 9 đợt 21 (luồng T3):
 * detector phân biệt ramp hợp lệ / không hợp lệ + wording i18n mới
 * của nested.speedRejected + reason action giữ-trim sang key i18n.
 *
 * Chạy bằng esbuild bundle (mẫu store.nestedTimelineToast.test.ts):
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedRejection21T3.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedRejection21T3.test.cjs --log-level=warning
 *   node /tmp/store.nestedRejection21T3.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * NỘI DUNG (ramp chuẩn dùng suốt file: 1→2 trên D=4, ∫₀⁴ = 6):
 *  D1. Ramp hợp lệ (trim [0,6) khớp ∫) → fields [], ForClip "" (vi+en).
 *  D2. Ramp hằng hợp lệ (v=2, trim [0,8)) → [].
 *  D3. Ramp hợp lệ không ghi trim → [] (cửa sổ hiệu dụng = in + ∫).
 *  D4. Ramp hợp lệ + reverse:false → [].
 *  D5. Chỉ reverse → ["reverse"], lý do reverse, fix reverse (vi+en).
 *  D6. Reverse + ramp HỢP LỆ → chỉ ["reverse"] (curve hợp lệ không bị liệt kê).
 *  D7. Reverse + ramp vượt biên → cả hai field, lý do reverse + range, fix cả hai.
 *  D8. Curve rỗng → ["speedKeyframes"], lý do curveEmpty (vi "curve rỗng", en "empty curve").
 *  D9. Sai hình dạng → curveShape: thiếu v; t vượt duration; easing lạ;
 *      bezier x1 ngoài [0,1]; keyframes không phải mảng; > 128 keyframe;
 *      shape legacy {time,speed} (không phải {t,v}) cũng là shape.
 *  D10. Tốc độ vượt biên (v=0.1, v=5) → curveRange, câu báo nêu "[0.25, 4]".
 *  D11. Không tính được tích phân (duration NaN, duration 0) → curveIntegral.
 *  D12. Lệch cửa sổ trim (out 4 trong khi ∫=6; in âm; out ≤ in) → curveWindow.
 *  D13. Clip thường mang curve lỗi → [] (detector chỉ xét nested).
 *  D14. Nested thiếu subSpec mang curve lỗi → [] (không phải nested theo isNestedClip).
 *  D15. Dạng fields-only cũ: curve → lý do chung "curve không hợp lệ"
 *      (liệt kê mọi nguyên nhân, không nêu sai); [] → ""; cả hai field
 *      → lý do chung cả hai. Dạng này vẫn đúng nhưng không chi tiết
 *      bằng ForClip — xem LIMITS T3 §3 về việc nối dây store/panel.
 *  D16. Mọi key mới đều resolve đủ vi/en, không rò key thô, không rò biến.
 *  S1. Store: splitAtPlayhead nested ramp hợp lệ → true, thành 2 clip, 0 toast.
 *  S2. Store: trim trái ramp hợp lệ (+1) → start 1, duration 3,
 *      trim in 1.125 / out 6, 0 toast.
 *  S3. Store: trim phải ramp hợp lệ (−1) → duration 3, trim out 4.125, 0 toast.
 *  S4. Store: split nested ramp vượt biên → false, spec không đổi,
 *      1 toast error (dạng fields-only nên toast nêu lý do chung, vẫn
 *      chứa chuỗi "[0.25, 4]" và câu fix curve).
 *  S5. Store: split nested reverse → false, 1 toast nêu "đảo timeline con".
 *  S6. Store: split nested lệch cửa sổ trim → false, 1 toast lý do chung
 *      (lý do chi tiết "cửa sổ trim lệch" chỉ có ở ForClip thuần D12
 *      cho tới khi store được nối dây — không mạo nhận toast store đã
 *      nêu chi tiết).
 *  R1–R4. Action giữ-trim: 4 lần từ chối (track khóa / không phải nested /
 *      hai tầng / không tính được) đều trả reasonKey đúng + reason đã
 *      dịch đúng locale; câu tiếng Việt của 3 nhánh khóa / không phải
 *      nested / không tính được BẰNG ĐÚNG chuỗi hardcode cũ từng ký tự
 *      (khóa không đổi nghĩa); nhánh hai tầng nay BẮT ĐẦU BẰNG chuỗi cũ
 *      rồi gắn thêm lý do chi tiết của cổng kiểm tra T2 (xem chú thích
 *      R3 — cổng hai tầng đã đổi trong đợt 21 luồng T2, xem LIMITS T3
 *      §4). Câu tiếng Anh của R1/R2/R4 không còn tiếng Việt; R3 tiếng
 *      Anh vẫn lẫn chi tiết tiếng Việt do cổng T2 hardcode lý do kiểm
 *      tra — đó là nợ của T2, không phải của nhánh reason này.
 *      Caller cũ chỉ đọc reason (string) vẫn chạy.
 *
 * KHÔNG test component panel trên DOM: repo không có DOM test runner,
 * phần panel chỉ được kiểm chứng bằng tsc + build như các đợt trước.
 * Quét parity toàn bộ dict vi/en chạy bằng script Python riêng (xem
 * LIMITS T3: vi-only [], en-only []), không nằm trong file test này
 * vì test bundle không import trực tiếp file JSON.
 */
import { useStore } from "./store";
import { clearToasts, subscribeToasts, type ToastItem } from "./lib/toast";
import { setLang, t as i18nT } from "./i18n";
import {
  classifyNestedSpeedRejection,
  nestedSpeedRejectionFields,
  nestedSpeedRejectionMessage,
  nestedSpeedRejectionMessageForClip,
  type NestedCurveRejectionReason,
} from "./components/nested/nestedRejection";
import type { Clip, SpeedCurve, VideoSpec } from "@repo-1/video-spec";

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

function contains(hay: string, needle: string, what = ""): void {
  if (!hay.includes(needle)) throw new Error(`${what} thiếu "${needle}" trong: ${hay}`);
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

/**
 * Lá mang curve hằng v (dùng cho R3): lá hằng 4 × curve ngoài 1→2 cho
 * tốc độ hợp tới 8, vượt [0.25, 4] nên cổng hai tầng T2 phải từ chối
 * (lá hằng 1 × ngoài 1→2 là cặp HỢP LỆ theo T2 nên không dùng được
 * làm case từ chối — xem LIMITS T3 §4).
 */
function leafSpecWithConstCurve(v: number): VideoSpec {
  const leafCurve: SpeedCurve = {
    keyframes: [
      { t: 0, v, easing: "linear" },
      { t: 4, v, easing: "linear" },
    ],
  };
  return subSpec([{ id: "it1", clips: [videoLeaf("c1", 0, 4, { speedKeyframes: leafCurve })] }]);
}

/** Ramp chuẩn: 1→2 trên D=4, ∫₀⁴ = 6. */
const CURVE_VALID: SpeedCurve = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

const CURVE_CONST_2: SpeedCurve = {
  keyframes: [
    { t: 0, v: 2, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

function nestedTop(
  id: string,
  inner: VideoSpec,
  extra?: Record<string, unknown>,
): AnyClip {
  return {
    kind: "nested", id, start: 0, duration: 4, speed: 1,
    trim: { in: 0, out: 6 }, subSpec: inner, name: `Compound ${id}`,
    ...(extra ?? {}),
  };
}

function install(
  top: AnyClip,
  opts?: { playhead?: number; locked?: boolean },
): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested rejection 21T3 test", width: 64, height: 64, fps: 30 },
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

function topNow(id: string): AnyClip {
  const track = useStore.getState().spec.tracks.find((t) => t.id === "v1");
  if (!track) throw new Error("mất track v1");
  const top = track.clips.find((c) => c.id === id);
  if (!top) throw new Error(`mất clip ${id}`);
  return top as unknown as AnyClip;
}

function reasonOf(clip: AnyClip): NestedCurveRejectionReason | null {
  return classifyNestedSpeedRejection(clip).curveReason;
}

// ===========================================================================
// D. Detector thuần + câu báo
// ===========================================================================
console.log("== D. Detector thuần + câu báo ==");

test("D1: ramp hợp lệ trim khớp ∫ → fields [], ForClip rỗng (vi+en)", () => {
  const top = nestedTop("d1", leafSpec(), { speedKeyframes: CURVE_VALID });
  eq(nestedSpeedRejectionFields(top), [], "fields");
  eq(reasonOf(top), null, "curveReason");
  setLang("vi");
  eq(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "", "vi ForClip");
  setLang("en");
  eq(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "", "en ForClip");
  setLang("vi");
});

test("D2: ramp hằng hợp lệ v=2 trim [0,8) → []", () => {
  const top = nestedTop("d2", leafSpec(), {
    speedKeyframes: CURVE_CONST_2, trim: { in: 0, out: 8 },
  });
  eq(nestedSpeedRejectionFields(top), [], "fields");
  eq(reasonOf(top), null, "curveReason");
});

test("D3: ramp hợp lệ không ghi trim → []", () => {
  const top = nestedTop("d3", leafSpec(), { speedKeyframes: CURVE_VALID });
  delete top["trim"];
  eq(nestedSpeedRejectionFields(top), [], "fields");
  eq(reasonOf(top), null, "curveReason");
});

test("D4: ramp hợp lệ + reverse:false → []", () => {
  const top = nestedTop("d4", leafSpec(), { speedKeyframes: CURVE_VALID, reverse: false });
  eq(nestedSpeedRejectionFields(top), [], "fields");
});

test("D5: chỉ reverse → [reverse], lý do reverse, fix reverse (vi+en)", () => {
  const top = nestedTop("d5", leafSpec(), { reverse: true });
  eq(nestedSpeedRejectionFields(top), ["reverse"], "fields");
  eq(reasonOf(top), null, "không curve nên curveReason null");
  setLang("vi");
  const viMsg = nestedSpeedRejectionMessageForClip(i18nT, top, "Comp");
  contains(viMsg, "reverse (đảo timeline con chưa được hỗ trợ)", "vi lý do reverse");
  contains(viMsg, "Tắt reverse khỏi nested clip rồi thử lại.", "vi fix reverse");
  assert(!viMsg.includes("nested."), "vi không rò key thô");
  setLang("en");
  const enMsg = nestedSpeedRejectionMessageForClip(i18nT, top, "Comp");
  contains(enMsg, "reversing the inner timeline is not supported", "en lý do reverse");
  contains(enMsg, "Turn off reverse on the nested clip", "en fix reverse");
  assert(!enMsg.includes("nested."), "en không rò key thô");
  setLang("vi");
});

test("D6: reverse + ramp HỢP LỆ → chỉ [reverse]", () => {
  const top = nestedTop("d6", leafSpec(), { speedKeyframes: CURVE_VALID, reverse: true });
  eq(nestedSpeedRejectionFields(top), ["reverse"], "curve hợp lệ không bị liệt kê");
  eq(reasonOf(top), null, "curveReason null");
});

test("D7: reverse + ramp vượt biên → cả hai field, lý do reverse + range, fix cả hai", () => {
  const bad: SpeedCurve = {
    keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 5, easing: "linear" },
    ],
  };
  const top = nestedTop("d7", leafSpec(), { speedKeyframes: bad, reverse: true });
  eq(nestedSpeedRejectionFields(top), ["speedKeyframes", "reverse"], "fields");
  eq(reasonOf(top), "curveRange", "curveReason");
  setLang("vi");
  const msg = nestedSpeedRejectionMessageForClip(i18nT, top, "Comp");
  contains(msg, "đảo timeline con", "lý do reverse");
  contains(msg, "vượt ngoài [0.25, 4]", "lý do range");
  contains(msg, "Gỡ speed curve và tắt reverse khỏi nested clip rồi thử lại.", "fix cả hai");
  setLang("vi");
});

test("D8: curve rỗng → curveEmpty (vi 'curve rỗng', en 'empty curve')", () => {
  const top = nestedTop("d8", leafSpec(), { speedKeyframes: { keyframes: [] } });
  eq(nestedSpeedRejectionFields(top), ["speedKeyframes"], "fields");
  eq(reasonOf(top), "curveEmpty", "curveReason");
  setLang("vi");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "curve rỗng", "vi");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "empty curve", "en");
  setLang("vi");
});

test("D9a: thiếu v → curveShape", () => {
  const top = nestedTop("d9a", leafSpec(), {
    speedKeyframes: { keyframes: [{ t: 0, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
  });
  eq(reasonOf(top), "curveShape", "thiếu v");
});

test("D9b: t vượt duration → curveShape", () => {
  const top = nestedTop("d9b", leafSpec(), {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 5, v: 2, easing: "linear" }] },
  });
  eq(reasonOf(top), "curveShape", "t=5 > D=4");
});

test("D9c: easing lạ → curveShape", () => {
  const top = nestedTop("d9c", leafSpec(), {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "bounce" }, { t: 4, v: 2, easing: "linear" }] },
  });
  eq(reasonOf(top), "curveShape", "easing bounce");
});

test("D9d: bezier x1 ngoài [0,1] → curveShape", () => {
  const top = nestedTop("d9d", leafSpec(), {
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "bezier", bezier: [2, 0, 0.5, 1] }, { t: 4, v: 2, easing: "linear" }] },
  });
  eq(reasonOf(top), "curveShape", "bezier x1=2");
});

test("D9e: keyframes không phải mảng và > 128 keyframe → curveShape", () => {
  const notArray = nestedTop("d9e1", leafSpec(), { speedKeyframes: {} });
  eq(reasonOf(notArray), "curveShape", "không có keyframes");
  const many = Array.from({ length: 129 }, (_, i) => ({ t: (i * 4) / 128, v: 1, easing: "linear" as const }));
  const over = nestedTop("d9e2", leafSpec(), { speedKeyframes: { keyframes: many } });
  eq(reasonOf(over), "curveShape", "129 keyframe");
});

test("D9f: shape legacy {time,speed} (không phải {t,v}) → curveShape, KHÔNG được coi là hợp lệ", () => {
  const legacy = {
    keyframes: [
      { time: 0, speed: 1, easing: "linear" },
      { time: 4, speed: 2, easing: "linear" },
    ],
  };
  const top = nestedTop("d9f", leafSpec(), { speedKeyframes: legacy });
  eq(nestedSpeedRejectionFields(top), ["speedKeyframes"], "legacy shape vẫn bị từ chối");
  eq(reasonOf(top), "curveShape", "thiếu t/v chuẩn");
});

test("D10: v vượt biên (0.1 và 5) → curveRange, câu báo nêu [0.25, 4]", () => {
  for (const v of [0.1, 5]) {
    const top = nestedTop(`d10-${v}`, leafSpec(), {
      speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v, easing: "linear" }] },
    });
    eq(reasonOf(top), "curveRange", `v=${v}`);
    setLang("vi");
    contains(nestedSpeedRejectionMessageForClip(i18nT, top, "Comp"), "[0.25, 4]", `vi v=${v}`);
  }
  setLang("vi");
});

test("D11: duration không hợp lệ (NaN, 0) → curveIntegral", () => {
  const nanDur = nestedTop("d11a", leafSpec(), { speedKeyframes: CURVE_VALID, duration: NaN });
  eq(reasonOf(nanDur), "curveIntegral", "duration NaN");
  const zeroDur = nestedTop("d11b", leafSpec(), { speedKeyframes: CURVE_VALID, duration: 0 });
  eq(reasonOf(zeroDur), "curveIntegral", "duration 0");
});

test("D12: lệch cửa sổ trim → curveWindow (out 4 vs ∫=6; in âm; out ≤ in)", () => {
  const mismatch = nestedTop("d12a", leafSpec(), {
    speedKeyframes: CURVE_VALID, trim: { in: 0, out: 4 },
  });
  eq(reasonOf(mismatch), "curveWindow", "out 4 ≠ in + ∫ = 6");
  setLang("vi");
  contains(nestedSpeedRejectionMessageForClip(i18nT, mismatch, "Comp"), "cửa sổ trim lệch", "vi window");
  setLang("en");
  contains(nestedSpeedRejectionMessageForClip(i18nT, mismatch, "Comp"), "trim window mismatched", "en window");
  setLang("vi");
  const negIn = nestedTop("d12b", leafSpec(), {
    speedKeyframes: CURVE_VALID, trim: { in: -1, out: 5 },
  });
  eq(reasonOf(negIn), "curveWindow", "in âm");
  const badOut = nestedTop("d12c", leafSpec(), {
    speedKeyframes: CURVE_VALID, trim: { in: 2, out: 2 },
  });
  eq(reasonOf(badOut), "curveWindow", "out ≤ in");
});

test("D13: clip thường mang curve lỗi → []", () => {
  const video = {
    kind: "video", id: "v", subSpec: leafSpec(),
    speedKeyframes: { keyframes: [] },
  };
  eq(nestedSpeedRejectionFields(video), [], "kind video không xét");
});

test("D14: nested thiếu subSpec mang curve lỗi → []", () => {
  const noSub = { kind: "nested", id: "n", speedKeyframes: { keyframes: [] } };
  eq(nestedSpeedRejectionFields(noSub), [], "thiếu subSpec không phải nested");
});

test("D15: dạng fields-only cũ — lý do chung, không nêu sai nguyên nhân", () => {
  setLang("vi");
  const curveOnly = nestedSpeedRejectionMessage(i18nT, "Comp", ["speedKeyframes"]);
  contains(curveOnly, "curve không hợp lệ", "vi lý do chung curve");
  contains(curveOnly, "Gỡ speed curve khỏi nested clip rồi thử lại.", "vi fix curve");
  const both = nestedSpeedRejectionMessage(i18nT, "Comp", ["speedKeyframes", "reverse"]);
  contains(both, "reverse và curve không hợp lệ", "vi lý do chung cả hai");
  setLang("en");
  const enCurve = nestedSpeedRejectionMessage(i18nT, "Comp", ["speedKeyframes"]);
  contains(enCurve, "invalid curve", "en lý do chung curve");
  contains(enCurve, "render worker forbids", "en vẫn nêu render cấm (từ khóa test G3 cũ)");
  eq(nestedSpeedRejectionMessage(i18nT, "Comp", []), "", "không field → rỗng");
  setLang("vi");
});

test("D16: mọi key mới resolve đủ vi/en, không rò key thô hay biến", () => {
  const keys = [
    "nested.speedRejectedReasonReverse",
    "nested.speedRejectedReasonCurve",
    "nested.speedRejectedReasonCurveEmpty",
    "nested.speedRejectedReasonCurveShape",
    "nested.speedRejectedReasonCurveRange",
    "nested.speedRejectedReasonCurveIntegral",
    "nested.speedRejectedReasonCurveWindow",
    "nested.speedRejectedReasonBoth",
    "nested.speedRejectedReasonJoin",
    "nested.fixedTrimLocked",
    "nested.fixedTrimNotNested",
    "nested.fixedTrimTwoLevel",
    "nested.fixedTrimUncomputable",
  ];
  for (const lang of ["vi", "en"] as const) {
    setLang(lang);
    for (const key of keys) {
      const s = i18nT(key);
      assert(s !== key, `${lang} key ${key} phải resolve, nhận key thô`);
      assert(!s.includes("nested."), `${lang} key ${key} rò key thô: ${s}`);
    }
    const templ = i18nT("nested.speedRejected", {
      name: "Comp", fields: "reverse", reason: "R", fix: "F",
    });
    assert(!templ.includes("{name}") && !templ.includes("{fields}") && !templ.includes("{reason}") && !templ.includes("{fix}"), `${lang} template còn biến chưa thay: ${templ}`);
  }
  setLang("vi");
});

// ===========================================================================
// S. Store: tách/trim thật với ramp hợp lệ, chặn thật với ramp cấm
// ===========================================================================
console.log("== S. Store split/trim ==");

test("S1: splitAtPlayhead nested ramp hợp lệ → true, thành 2 clip, 0 toast", () => {
  const top = nestedTop("s1", leafSpec(), { speedKeyframes: CURVE_VALID });
  install(top);
  eq(useStore.getState().splitAtPlayhead(), true, "ramp hợp lệ phải tách được");
  eq(useStore.getState().spec.tracks[0].clips.length, 2, "thành 2 clip");
  eq(toastsNow().length, 0, "không toast");
});

test("S2: trim trái ramp hợp lệ (+1) → start 1, duration 3, trim in 1.125 / out 6, 0 toast", () => {
  const top = nestedTop("s2", leafSpec(), { speedKeyframes: CURVE_VALID });
  install(top);
  useStore.getState().trimClip("v1", "s2", "left", 1);
  const now = topNow("s2");
  eq(now.start, 1, "start mới");
  eq(now.duration, 3, "duration mới");
  approx((now["trim"] as { in: number }).in, 1.125, 1e-9, "in = ∫₀¹ (1→2)");
  eq((now["trim"] as { out: number }).out, 6, "out giữ nguyên");
  eq(toastsNow().length, 0, "không toast");
});

test("S3: trim phải ramp hợp lệ (−1) → duration 3, trim out 4.125, 0 toast", () => {
  const top = nestedTop("s3", leafSpec(), { speedKeyframes: CURVE_VALID });
  install(top);
  useStore.getState().trimClip("v1", "s3", "right", -1);
  const now = topNow("s3");
  eq(now.duration, 3, "duration mới");
  approx((now["trim"] as { out: number }).out, 4.125, 1e-9, "out = ∫₀³ (1→2)");
  eq(toastsNow().length, 0, "không toast");
});

test("S4: split nested ramp vượt biên → false, spec không đổi, 1 toast lý do chung", () => {
  const bad: SpeedCurve = {
    keyframes: [
      { t: 0, v: 1, easing: "linear" },
      { t: 4, v: 5, easing: "linear" },
    ],
  };
  const top = nestedTop("s4", leafSpec(), { speedKeyframes: bad });
  install(top);
  const before = JSON.stringify(topNow("s4"));
  eq(useStore.getState().splitAtPlayhead(), false, "ramp vượt biên phải tách thất bại");
  eq(JSON.stringify(topNow("s4")), before, "spec không đổi");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  eq(ts[0].kind, "error", "toast kind error");
  contains(ts[0].message, "[0.25, 4]", "toast nêu biên tốc độ (trong lý do chung)");
  contains(ts[0].message, "Gỡ speed curve khỏi nested clip rồi thử lại.", "toast fix curve");
});

test("S5: split nested reverse → false, 1 toast nêu đảo timeline con", () => {
  const top = nestedTop("s5", leafSpec(), { reverse: true });
  install(top);
  eq(useStore.getState().splitAtPlayhead(), false, "reverse phải tách thất bại");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  contains(ts[0].message, "đảo timeline con", "toast lý do reverse");
});

test("S6: split nested lệch cửa sổ trim → false, 1 toast lý do chung (chưa phải lý do chi tiết)", () => {
  const top = nestedTop("s6", leafSpec(), {
    speedKeyframes: CURVE_VALID, trim: { in: 0, out: 4 },
  });
  install(top);
  eq(useStore.getState().splitAtPlayhead(), false, "lệch cửa sổ phải tách thất bại");
  const ts = toastsNow();
  eq(ts.length, 1, "đúng 1 toast");
  contains(ts[0].message, "curve không hợp lệ", "toast store (fields-only) nêu lý do chung");
});

// ===========================================================================
// R. Reason action giữ-trim sang key i18n
// ===========================================================================
console.log("== R. Reason action giữ-trim ==");

test("R1: track khóa → reasonKey fixedTrimLocked, reason đúng locale, vi đúng từng ký tự cũ", () => {
  const top = nestedTop("r1", leafSpec(), { speedKeyframes: CURVE_VALID });
  install(top, { locked: true });
  setLang("vi");
  const viRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r1", CURVE_VALID);
  eq(viRes.ok, false, "vi ok");
  eq(viRes.reasonKey, "nested.fixedTrimLocked", "vi reasonKey");
  eq(viRes.reason, "Track đang khóa.", "vi reason đúng chuỗi hardcode cũ");
  setLang("en");
  const enRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r1", CURVE_VALID);
  eq(enRes.ok, false, "en ok");
  eq(enRes.reasonKey, "nested.fixedTrimLocked", "en reasonKey giữ nguyên");
  eq(enRes.reason, "The track is locked.", "en reason tiếng Anh, không còn tiếng Việt");
  assert(typeof enRes.reason === "string", "caller cũ đọc reason string vẫn chạy");
  setLang("vi");
});

test("R2: không phải nested → reasonKey fixedTrimNotNested, vi đúng từng ký tự cũ", () => {
  const video = {
    kind: "video", id: "r2", src: "src.mp4", start: 0, duration: 4, in: 0, out: 4,
  } as unknown as AnyClip;
  install(video);
  setLang("vi");
  const viRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r2", CURVE_VALID);
  eq(viRes.ok, false, "vi ok");
  eq(viRes.reasonKey, "nested.fixedTrimNotNested", "vi reasonKey");
  eq(viRes.reason, "Clip này không phải nested clip.", "vi reason đúng chuỗi hardcode cũ");
  setLang("en");
  const enRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r2", CURVE_VALID);
  eq(enRes.reasonKey, "nested.fixedTrimNotNested", "en reasonKey giữ nguyên");
  eq(enRes.reason, "This clip is not a nested clip.", "en reason");
  setLang("vi");
});

test("R3: hai tầng vi phạm R1 (lá hằng 4 × ngoài 1→2 → hợp tới 8) → reasonKey fixedTrimTwoLevel, spec không đổi", () => {
  // Ngữ nghĩa cổng hai tầng đã đổi ở đợt 21 luồng T2 (song song với
  // luồng này, cùng sửa hàm patchNestedCurveFixedTrim): cổng cũ
  // "lá con có curve là từ chối" nay thành checkTwoLevelOuterCurve —
  // cặp hợp lệ (lá hằng 1 × ngoài 1→2) được cho qua vì render đã hợp
  // thật, chỉ cặp vi phạm luật render R1 mới bị từ chối. Vì vậy case
  // từ chối ở đây dùng lá hằng 4 (hợp tới 8 > 4). Reason vi BẮT ĐẦU
  // BẰNG chuỗi hardcode cũ rồi gắn thêm lý do chi tiết của cổng T2
  // (không còn bằng đúng từng ký tự — thay đổi này thuộc về T2, test
  // này khóa đúng hành vi gộp hiện tại trên đĩa, xem LIMITS T3 §4).
  const top = nestedTop("r3", leafSpecWithConstCurve(4), { speedKeyframes: CURVE_VALID });
  install(top);
  const before = JSON.stringify(topNow("r3"));
  setLang("vi");
  const viRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r3", CURVE_VALID);
  eq(viRes.ok, false, "vi ok");
  eq(viRes.reasonKey, "nested.fixedTrimTwoLevel", "vi reasonKey");
  assert(
    (viRes.reason ?? "").startsWith("Bên trong nested clip đã có clip mang speed curve — hợp curve hai tầng chưa được hỗ trợ (spec đợt 18 §5)."),
    `vi reason phải bắt đầu bằng chuỗi cũ: ${viRes.reason ?? ""}`,
  );
  eq(JSON.stringify(topNow("r3")), before, "spec không đổi");
  setLang("en");
  const enRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r3", CURVE_VALID);
  eq(enRes.reasonKey, "nested.fixedTrimTwoLevel", "en reasonKey giữ nguyên");
  assert(
    (enRes.reason ?? "").startsWith("A clip inside the nested clip already carries a speed curve — merging two curve levels is not supported yet (spec round 18 §5)."),
    `en reason phải bắt đầu bằng câu tiếng Anh mới: ${enRes.reason ?? ""}`,
  );
  // LƯU Ý (nợ T2, không sửa ở đây): phần chi tiết gắn sau của cổng T2
  // vẫn hardcode tiếng Việt nên reason tiếng Anh của nhánh này hiện
  // lẫn tiếng Việt ở đuôi — xem LIMITS T3 §4.
  setLang("vi");
});

test("R4: không tính được (trim hẹp 0.15s → duration tính ra < 0.2s) → reasonKey fixedTrimUncomputable, vi đúng từng ký tự cũ", () => {
  // Không dùng curve rỗng làm case này nữa: cổng two-level T2 chặn
  // curve ngoài không hợp lệ TRƯỚC nhánh uncomputable nên curve rỗng
  // nay trả reasonKey fixedTrimTwoLevel, không tới được nhánh này.
  // Case qua được cổng T2 mà vẫn không tính được là trim hẹp: đảo
  // tích phân của nguồn 0.15s qua curve 1→2 cho duration ≈ 0.147s.
  const top = nestedTop("r4", leafSpec(), { trim: { in: 0, out: 0.15 } });
  install(top);
  setLang("vi");
  const viRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r4", CURVE_VALID);
  eq(viRes.ok, false, "vi ok");
  eq(viRes.reasonKey, "nested.fixedTrimUncomputable", "vi reasonKey");
  eq(viRes.reason, "Không tính được duration theo chế độ trim-cố-định (curve/trim không hợp lệ, nested đang reverse, hoặc duration tính ra dưới 0.2s).", "vi reason đúng chuỗi hardcode cũ");
  setLang("en");
  const enRes = useStore.getState().patchNestedCurveFixedTrim("v1", "r4", CURVE_VALID);
  eq(enRes.reasonKey, "nested.fixedTrimUncomputable", "en reasonKey giữ nguyên");
  contains(enRes.reason ?? "", "keep-trim mode", "en reason");
  setLang("vi");
});

console.log(`\nstore.nestedRejection21T3: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
