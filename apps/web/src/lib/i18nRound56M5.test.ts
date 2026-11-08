// i18nRound56M5.test.ts — Phase 9 đợt 56, luồng M5: nối key i18n cho
// lib/nestedPreview.ts, lib/twoLevelCurve.ts, lib/curveFix.ts và
// lib/projectRepo.ts (77 đề xuất key từ hidden_files/round55-l2-keys.json).
//
// Cách nối (xem docs/PHASE9_ROUND56_M5_I18N_WIRING_LIMITS.md): các file
// này được test bằng Node type-stripping, mà Node không resolve JSON
// import của i18n/index.ts (ERR_IMPORT_ATTRIBUTE_MISSING — đã kiểm
// chứng 07/11) nên KHÔNG import t() trực tiếp; mỗi hàm nhận thêm tham
// số tùy chọn `lookup` (mẫu formatSanitizeSummaryLocalized /
// resolveWarningMessage có sẵn trong repo). Không lookup → fallback
// đúng từng chữ chuỗi VI cũ (test cũ không đổi); có lookup (UI truyền
// t()) → chuỗi theo locale. Key mới nằm trong fragment
// apps/web/src/i18n/fragments/round56-m5.json, đã gộp vào vi.json/en.json
// ở bước parent gộp đợt 56 (1722 key mỗi bên; đợt 57 gộp lên 1937, đợt 58 gộp lên 1942, đợt 59 gộp lên 1957 key mỗi bên, đợt 60 Q4 lên 1969, parent gộp đợt 60 +3 key Q1 lên 1972 key mỗi bên, parent gộp đợt 61 +72 key lên 2044 key mỗi bên).
//
// Test này kiểm chứng CẢ HAI đường bằng lookup tự dựng từ fragment +
// vi.json/en.json thật (không import i18n module, để chạy được bằng
// strip-types như các test khác của 4 file này):
//   (a) không lookup: message fallback đúng từng chữ literal VI cũ;
//   (b) lookup vi: message = fallback (sau merge, vi không đổi);
//   (c) lookup en: message = bản dịch trong fragment/dict.
// Đồng thời khóa parity + nội dung fragment và các site CỐ TÌNH bỏ qua.
//
// Chạy từ gốc repo:
//   node --experimental-strip-types apps/web/src/lib/i18nRound56M5.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  adjustmentAppliesToClip,
  applyPreviewLeafVisual,
  convertCanonicalLayer,
  flattenForPreview,
  normalizeNestedClip,
  resolveNestedRampCurve,
  resolvePreviewBoundaries,
  validateScopeTracks,
  type LeafClipInput,
} from "./nestedPreview";
import { composeTwoLevelCurve } from "./twoLevelCurve";
import {
  checkSpeedKeyframesRenderFatal,
  formatExportCurveError,
} from "./curveFix";
import { parseProjectText } from "./projectRepo";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
function throwsMsg(fn: () => void): string {
  try {
    fn();
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("không throw như kỳ vọng");
}

// --- Dict thật + lookup mô phỏng t() (fragment + vi.json/en.json) ----
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
const FRAG = readJson("apps/web/src/i18n/fragments/round56-m5.json") as {
  vi: Dict;
  en: Dict;
};
const VI = readJson("apps/web/src/i18n/vi.json");
const EN = readJson("apps/web/src/i18n/en.json");
function deepMerge(base: Dict, over: Dict): Dict {
  const out: Dict = { ...base };
  for (const k of Object.keys(over)) {
    const b = base[k];
    const o = over[k];
    out[k] =
      typeof b === "object" && b !== null && typeof o === "object" && o !== null
        ? deepMerge(b as Dict, o as Dict)
        : o;
  }
  return out;
}
function flatten(d: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Dict, q, out);
    else out.set(q, v as string);
  }
  return out;
}
function placeholders(s: string): Set<string> {
  return new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
}
const FRAG_VI = flatten(FRAG.vi);
const FRAG_EN = flatten(FRAG.en);
const MERGED_VI = flatten(deepMerge(VI, FRAG.vi));
const MERGED_EN = flatten(deepMerge(EN, FRAG.en));
type Lookup = (key: string, vars?: Record<string, string>) => string;
function lookup(lang: "vi" | "en"): Lookup {
  const map = lang === "vi" ? MERGED_VI : MERGED_EN;
  return (key: string, vars?: Record<string, string>): string => {
    const raw = map.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
const lookupVi = lookup("vi");
const lookupEn = lookup("en");

// --- Fixture (mẫu nestedRampPreview.test.ts) --------------------------
const LINEAR_1_2 = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};
function video(
  id: string,
  start: number,
  duration: number,
  extra: Record<string, unknown> = {},
): LeafClipInput {
  return {
    kind: "video", id, start, duration, in: 0, out: duration, ...extra,
  } as LeafClipInput;
}
function nestedRamp(
  extra: Record<string, unknown>,
  inner: unknown[],
): Record<string, unknown> {
  return {
    kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
    speedKeyframes: LINEAR_1_2,
    tracks: [{ kind: "video", clips: inner }],
    ...extra,
  };
}
function flat1(nested: Record<string, unknown>) {
  return flattenForPreview({
    tracks: [{ kind: "video", clips: [nested] }],
  });
}
function specWithClips(clips: Record<string, unknown>[]): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips }],
  };
}
function envelopeJson(spec: Record<string, unknown>, specVersion = "0.2.0"): string {
  return JSON.stringify({
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion,
    savedAt: "2026-10-27T00:00:00.000Z",
    name: "Test",
    spec,
  });
}

// --- A. Fragment: parity + nội dung ------------------------------------
ok("fragment: 81 key mới, vi/en cùng tập key, khác nhau từng key", () => {
  assert.equal(FRAG_VI.size, 81, `fragment vi phải có 81 key, nhận ${FRAG_VI.size}`);
  assert.equal(FRAG_EN.size, 81, `fragment en phải có 81 key, nhận ${FRAG_EN.size}`);
  for (const k of FRAG_VI.keys()) {
    assert.ok(FRAG_EN.has(k), `en thiếu key ${k}`);
    const v = FRAG_VI.get(k)!;
    const e = FRAG_EN.get(k)!;
    assert.ok(v.length > 0 && e.length > 0, `${k} rỗng`);
    assert.notEqual(v, e, `${k}: vi phải khác en`);
    assert.deepEqual([...placeholders(v)].sort(), [...placeholders(e)].sort(),
      `${k}: placeholder vi/en lệch`);
  }
  for (const k of FRAG_EN.keys()) assert.ok(FRAG_VI.has(k), `vi thiếu key ${k}`);
});

// Parent gộp đợt 56: fragment đã gộp vào vi.json/en.json nên assertion
// tiền-gộp ("fragment phải rời dict") giờ đảo ngược: mọi key fragment
// PHẢI có trong dict với đúng từng chữ giá trị fragment.
ok("fragment: đã gộp vào vi.json/en.json, đúng từng chữ giá trị fragment", () => {
  const realVi = flatten(VI);
  const realEn = flatten(EN);
  for (const k of FRAG_VI.keys()) {
    assert.ok(realVi.has(k), `dict vi thiếu key fragment: ${k}`);
    assert.ok(realEn.has(k), `dict en thiếu key fragment: ${k}`);
    assert.equal(realVi.get(k), FRAG_VI.get(k), `vi.json lệch fragment: ${k}`);
    assert.equal(realEn.get(k), FRAG_EN.get(k), `en.json lệch fragment: ${k}`);
  }
});

ok("tái dùng: 3 key speedCurve.* đã có sẵn đúng từng chữ", () => {
  const expected: Record<string, [string, string]> = {
    "speedCurve.shape": [
      "speedKeyframes phải là object { keyframes: [...] }.",
      "speedKeyframes must be an object { keyframes: [...] }.",
    ],
    "speedCurve.keyframesEmpty": [
      "speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe.",
      "speedKeyframes.keyframes: empty array — at least 1 keyframe is required.",
    ],
    "speedCurve.keyframesTooMany": [
      "speedKeyframes.keyframes: quá 128 keyframe (có {value}).",
      "speedKeyframes.keyframes: more than 128 keyframes (got {value}).",
    ],
  };
  for (const [k, [v, e]] of Object.entries(expected)) {
    assert.equal(flatten(VI).get(k), v, `${k} vi`);
    assert.equal(flatten(EN).get(k), e, `${k} en`);
  }
});

// --- B. Không lookup: fallback đúng từng chữ literal VI cũ ------------
ok("fallback: resolveNestedRampCurve 8 lỗi đúng từng chữ", () => {
  const L = "L";
  assert.equal(
    throwsMsg(() => resolveNestedRampCurve({}, 4, L)),
    `${L}: speedKeyframes phải là object { keyframes: [...] }`,
  );
  assert.equal(
    throwsMsg(() => resolveNestedRampCurve({ keyframes: [] }, 4, L)),
    `${L}: speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe`,
  );
  const many = Array.from({ length: 129 }, (_, i) => ({ t: i, v: 1, easing: "linear" }));
  assert.equal(
    throwsMsg(() => resolveNestedRampCurve({ keyframes: many }, 200, L)),
    `${L}: speedKeyframes.keyframes: quá 128 keyframe`,
  );
  assert.equal(
    throwsMsg(() => resolveNestedRampCurve({ keyframes: ["x"] }, 4, L)),
    `${L}: speedKeyframes.keyframes[0] phải là object { t, v, easing }`,
  );
  assert.equal(
    throwsMsg(() =>
      resolveNestedRampCurve({ keyframes: [{ t: -1, v: 1, easing: "linear" }] }, 4, L)),
    `${L}: speedKeyframes.keyframes[0].t phải trong [0, 4] (nhận được: -1)`,
  );
  assert.equal(
    throwsMsg(() =>
      resolveNestedRampCurve({ keyframes: [{ t: 0, v: 9, easing: "linear" }] }, 4, L)),
    `${L}: speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 9)`,
  );
  assert.equal(
    throwsMsg(() =>
      resolveNestedRampCurve({ keyframes: [{ t: 0, v: 1, easing: "ease-in-out" }] }, 4, L)),
    `${L}: speedKeyframes.keyframes[0].easing phải là linear | ease-in | ease-out | bezier (nhận được: "ease-in-out")`,
  );
  assert.equal(
    throwsMsg(() =>
      resolveNestedRampCurve(
        { keyframes: [{ t: 0, v: 1, easing: "bezier", bezier: [2, 0, 0, 0] }] }, 4, L)),
    `${L}: speedKeyframes.keyframes[0].bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do`,
  );
});

ok("fallback: validateScopeTracks + convertCanonicalLayer đúng từng chữ", () => {
  assert.equal(
    throwsMsg(() => validateScopeTracks("x", "L")),
    `L: scope tracks phải là một mảng các chỉ số track (nhận được: "x")`,
  );
  assert.equal(
    throwsMsg(() => validateScopeTracks([-1], "L")),
    `L: scope tracks chứa chỉ số không hợp lệ: -1 (phải là số nguyên >= 0)`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer("x", "L")),
    `L: adjustment layer phải là một object`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "" }, "L")),
    `L: adjustment layer.id phải là chuỗi khác rỗng`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: -1, duration: 1 }, "L")),
    `L: adjustment layer "a".start phải là số >= 0`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: 0, duration: 0 }, "L")),
    `L: adjustment layer "a".duration phải là số > 0`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: 0, duration: 1, effects: "x" }, "L")),
    `L: adjustment layer "a".effects phải là một mảng`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: 0, duration: 1, effects: [{}] }, "L")),
    `L: adjustment layer "a" có effect không hợp lệ (thiếu type chuỗi)`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: 0, duration: 1, filters: "x" }, "L")),
    `L: adjustment layer "a".filters phải là một mảng`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: 0, duration: 1, filters: [1] }, "L")),
    `L: adjustment layer "a" có filter entry không phải object`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: 0, duration: 1, filters: [{ lut: 1 }] }, "L")),
    `L: adjustment layer "a" có filter.lut không phải chuỗi`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: 0, duration: 1, filters: [] }, "L")),
    `L: adjustment layer "a" rỗng (không có lut/color/effects) — layer vô tác dụng`,
  );
});

ok("fallback: normalizeNestedClip — shape/trim/duration đúng từng chữ", () => {
  assert.equal(
    throwsMsg(() => normalizeNestedClip({ kind: "video" })),
    `normalizeNestedClip: clip phải là nested clip (kind "nested")`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({ kind: "nested", id: "n", subSpec: {} })),
    `nested clip "n": subSpec.tracks phải là một mảng`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({
      kind: "nested", id: "n",
      tracks: [{ kind: "video", id: "a" }],
      subSpec: { tracks: [{ kind: "video", id: "b" }] },
    })),
    `nested clip "n": vừa có tracks trực tiếp vừa có subSpec.tracks nhưng nội dung khác nhau — chỉ giữ một nguồn duy nhất (xóa tracks cũ hoặc sửa subSpec cho khớp)`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({
      kind: "nested", id: "n", subSpec: { tracks: [], adjustmentLayers: {} },
    })),
    `nested clip "n": subSpec.adjustmentLayers phải là một mảng`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({ kind: "nested", id: "n" })),
    `nested clip "n": không có tracks trực tiếp cũng không có subSpec — không có nội dung gì để phẳng`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({ kind: "nested", id: "n", trim: { in: -1, out: 5 }, tracks: [] })),
    `nested clip "n": trim.in phải là số >= 0`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({ kind: "nested", id: "n", trim: { in: 2, out: 2 }, tracks: [] })),
    `nested clip "n": trim.out phải là số > trim.in`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({ kind: "nested", id: "n", in: 1, trim: { in: 2, out: 5 }, tracks: [] })),
    `nested clip "n": trim.in (2) mâu thuẫn với in cũ (1) — chỉ giữ một trong hai, hoặc đặt bằng nhau`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({
      kind: "nested", id: "n", speed: 2, duration: 1, trim: { in: 0, out: 4 }, tracks: [],
    })),
    `nested clip "n": duration (1) không khớp (trim.out − trim.in) / speed = 2 — sửa duration hoặc trim cho khớp`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({
      kind: "nested", id: "n", duration: 2, trim: { in: 0, out: 5 }, tracks: [],
      speedKeyframes: { keyframes: [{ t: 0, v: 2, easing: "linear" }, { t: 2, v: 2, easing: "linear" }] },
    })),
    `nested clip "n": trim.out (5) không khớp in + duration × 2 = 4 — sửa duration hoặc trim cho khớp (ngữ nghĩa render đợt 18 §2)`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip({
      kind: "nested", id: "n", duration: 4, trim: { in: 0, out: 9 }, tracks: [],
      speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
    })),
    `nested clip "n": trim.out (9) không khớp in + ∫speedKeyframes trên duration = 6 — sửa duration hoặc trim cho khớp (ngữ nghĩa render đợt 18 §2)`,
  );
});

ok("fallback: resolvePreviewBoundaries 8 lỗi biên đúng từng chữ", () => {
  const TW = `track "v0"`;
  const tr = (type: string, duration: number) => ({ type, duration });
  // multiEnd: 2 clip kết thúc đúng lúc b bắt đầu.
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      { kind: "video", id: "a1", start: 0, duration: 10 },
      { kind: "video", id: "a2", start: 5, duration: 5 },
      { kind: "video", id: "b", start: 10, duration: 5, transitionIn: tr("fade", 1) },
    ], "video", TW)),
    `${TW}: nhiều clip kết thúc đúng lúc clip "b" bắt đầu — không xác định được đầu trái của transition (clip chồng lấn nhau)`,
  );
  // transitionNoPrev: clip kề trước không kết thúc đúng lúc.
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      { kind: "video", id: "a", start: 0, duration: 5 },
      { kind: "video", id: "b", start: 10, duration: 5, transitionIn: tr("fade", 1) },
    ], "video", TW)),
    `${TW}: clip "b" có transition nhưng clip kề trước không kết thúc đúng lúc 10s — transition yêu cầu 2 clip nối tiếp nhau`,
  );
  const nestedPrev = (dur: number, out: { type: string; duration: number }) =>
    ({ kind: "nested", id: "n1", start: 0, duration: dur, transitionOut: out, tracks: [] });
  // transitionOutDuration / Type / CrossBorder / Longer.
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      nestedPrev(10, tr("fade", 1)),
      { kind: "video", id: "b", start: 10, duration: 5, transitionIn: tr("fade", 2) },
    ], "video", TW)),
    `${TW}: transitionOut (1s) của clip "n1" và transitionIn (2s) của clip "b" không khớp nhau — chỉ đặt một trong hai, hoặc đặt bằng nhau`,
  );
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      nestedPrev(10, tr("fade", 1)),
      { kind: "video", id: "b", start: 10, duration: 5, transitionIn: tr("slide", 1) },
    ], "video", TW)),
    `${TW}: transitionOut (fade) của clip "n1" và transitionIn (slide) của clip "b" không khớp type — transition qua biên yêu cầu cùng type`,
  );
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      nestedPrev(10, tr("slide", 1)),
      { kind: "video", id: "b", start: 10, duration: 5, transitionIn: tr("slide", 1) },
    ], "video", TW)),
    `${TW}: transition qua biên clip lồng nhau ("n1" → "b") chỉ hỗ trợ type "fade", nhận được: "slide" — dùng "fade" hoặc bỏ transition`,
  );
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      nestedPrev(0.5, tr("fade", 1)),
      { kind: "video", id: "b", start: 0.5, duration: 5, transitionIn: tr("fade", 1) },
    ], "video", TW)),
    `${TW}: transition (1s) dài hơn clip "n1" (0.5s)`,
  );
  // transitionBothSides: nested vừa là "to" vừa là "from".
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      { kind: "video", id: "p1", start: 0, duration: 5, transitionOut: tr("fade", 1) },
      { kind: "nested", id: "n", start: 5, duration: 5, transitionIn: tr("fade", 1), transitionOut: tr("fade", 1), tracks: [] },
      { kind: "video", id: "m", start: 10, duration: 5, transitionIn: tr("fade", 1) },
    ], "video", TW)),
    `${TW}: clip lồng nhau "n" vừa có transition qua biên ở cả hai đầu (in + out) — chưa hỗ trợ 2 transition qua biên trên cùng một clip lồng nhau`,
  );
  // transitionEarly: clip phẳng vừa là "to" vừa là "from" — p1/m phải
  // là nested thì cặp mới vào `pairs` (cặp phẳng-phẳng chỉ vào flatPairs).
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      { kind: "nested", id: "p1", start: 0, duration: 5, transitionOut: tr("fade", 1), tracks: [] },
      { kind: "video", id: "n", start: 5, duration: 5, transitionIn: tr("fade", 1), transitionOut: tr("fade", 1) },
      { kind: "nested", id: "m", start: 10, duration: 5, transitionIn: tr("fade", 1), tracks: [] },
    ], "video", TW)),
    `${TW}: clip "n" bị dịch sớm 1s bởi transition qua biên nên không giữ được transition khác — chưa hỗ trợ 2 transition liên tiếp qua biên`,
  );
  // transitionFlatExists: clip đã có transition phẳng với clip kề trước.
  assert.equal(
    throwsMsg(() => resolvePreviewBoundaries([
      { kind: "video", id: "pp", start: 0, duration: 5, transitionOut: tr("fade", 1) },
      { kind: "video", id: "a", start: 5, duration: 5, transitionIn: tr("fade", 1), transitionOut: tr("fade", 1) },
      { kind: "nested", id: "m", start: 10, duration: 5, transitionIn: tr("fade", 1), tracks: [] },
    ], "video", TW)),
    `${TW}: clip "a" đã có transition phẳng với clip kề trước nên transition qua biên của nó luôn dính đoạn đen cuối (gap của xfade phẳng) — bỏ transition phẳng hoặc transition qua biên`,
  );
});

ok("fallback: applyPreviewLeafVisual 5 lỗi lá ở biên đúng từng chữ", () => {
  const B = { shiftIn: 0, fadeIn: 1, fadeOut: 0 };
  const leaf = (extra: Record<string, unknown>) =>
    ({ kind: "video", id: "x", start: 0, duration: 5, in: 0, out: 5, ...extra } as LeafClipInput);
  assert.equal(
    throwsMsg(() => applyPreviewLeafVisual(
      { kind: "image", id: "x", start: 0, duration: 5, in: 0, out: 5 } as LeafClipInput,
      1, B, 0, 0, 5, false)),
    `clip lá "x" (kind image) nằm ở biên transition qua biên nhưng preview không áp opacity keyframes cho kind này — transition qua biên chỉ hỗ trợ clip lá video/text ở biên`,
  );
  assert.equal(
    throwsMsg(() => applyPreviewLeafVisual(
      leaf({ animations: { opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } } }),
      1, B, 0, 0, 5, false)),
    `clip lá "x" vừa có keyframes opacity vừa dính transition qua biên — chưa hỗ trợ gộp fade biên với keyframes opacity sẵn có`,
  );
  assert.equal(
    throwsMsg(() => applyPreviewLeafVisual(
      leaf({ duration: 0.5 }), 1, B, 0, 0, 0.5, false)),
    `clip lá "x" dài 0.5s, ngắn hơn transition qua biên 1s — transition phải <= độ dài clip lá ở biên`,
  );
  assert.equal(
    throwsMsg(() => applyPreviewLeafVisual(
      leaf({ transitionIn: { type: "fade", duration: 1 } }), 1, B, 0, 0, 5, false)),
    `clip lá "x" vừa có transition trong project con vừa dính transition qua biên — chưa hỗ trợ gộp 2 transition trên cùng clip lá`,
  );
  assert.equal(
    throwsMsg(() => applyPreviewLeafVisual(leaf({}), 1, B, 0, 0, 5, true)),
    `clip lá "x" bị cửa sổ clip lồng nhau cắt trái nên không giữ được transition qua biên — dời clip lá về đúng đầu cửa sổ hoặc bỏ transition`,
  );
});

ok("fallback: flattenForPreview — reverse/opacity/lá dưới ramp đúng từng chữ", () => {
  assert.equal(
    throwsMsg(() => flat1(nestedRamp({ reverse: true }, [video("x", 0, 3)]))),
    `nested clip "n1": reverse ở clip lồng nhau có speedKeyframes chưa được hỗ trợ (render đợt 18 §5)`,
  );
  assert.equal(
    throwsMsg(() => flat1(nestedRamp({ opacity: 2 }, [video("x", 0, 3)]))),
    `nested "n1": opacity phải là số trong khoảng 0..1, nhận được: 2`,
  );
  assert.equal(
    throwsMsg(() => flat1(nestedRamp({}, [video("x", 0, 3, {
      speedKeyframes: LINEAR_1_2, reverse: true,
    })]))),
    `clip lá "x" (video) dưới clip lồng nhau có speedKeyframes mà mang reverse — hợp thành thời gian phi tuyến chưa được hỗ trợ (render đợt 18 §5), không phẳng lệch`,
  );
  assert.equal(
    throwsMsg(() => flat1(nestedRamp({}, [{
      kind: "text", id: "x", start: 0, duration: 3, in: 0, out: 3,
      speedKeyframes: LINEAR_1_2,
    }]))),
    `clip lá "x" (text) dưới clip lồng nhau có speedKeyframes mà mang speedKeyframes — hợp curve chỉ hỗ trợ lá video/audio có trục nguồn (render đợt 20 R1)`,
  );
  assert.equal(
    throwsMsg(() => flat1(nestedRamp({}, [{
      kind: "video", id: "x", start: 0, duration: 3, out: 3,
      speedKeyframes: LINEAR_1_2,
    }]))),
    `clip lá "x" (video) dưới clip lồng nhau có speedKeyframes mà mang speedKeyframes nhưng thiếu in hữu hạn — không neo được trục nguồn để hợp (render đợt 20 R1)`,
  );
  // leafSpeedProduct: tích vượt — v là số float, khóa bằng lookup fragment vi.
  const msg = throwsMsg(() => flat1(nestedRamp({}, [video("x", 0, 3, { speed: 4 })])));
  const m = msg.match(/^clip lá "x": tốc độ lá \(4\) × curve lồng nhau vượt khoảng 0\.25\.\.4 \(keyframe v = ([\d.e+-]+)\) — render đợt 18 §5 từ chối$/);
  assert.ok(m, `leafSpeedProduct sai dạng: ${msg}`);
  assert.equal(msg, lookupVi("nested.leafSpeedProduct", { id: "x", a: "4", v: m![1] }),
    "fragment vi phải tái tạo đúng từng chữ message leafSpeedProduct");
  // combinedSpeedOutOfRange (rescaleConstantCurve): lá 1→2.5 dưới nested speed 2.
  assert.equal(
    throwsMsg(() => flattenForPreview({
      tracks: [{
        kind: "video",
        clips: [{
          kind: "nested", id: "n1", start: 10, duration: 2, in: 0, speed: 2,
          tracks: [{ kind: "video", clips: [video("leaf", 0, 4, {
            speedKeyframes: {
              keyframes: [
                { t: 0, v: 1, easing: "linear" },
                { t: 4, v: 2.5, easing: "linear" },
              ],
            },
            out: 6,
          })] }],
        }],
      }],
    })),
    `clip lá "leaf": tốc độ hợp hai tầng = 5 vượt khoảng 0.25..4 (tốc độ trong × tốc độ ngoài hằng 2) — render đợt 20 R1 từ chối`,
  );
  // flattenAdjLayers + adjScope*: flattenForPreview / adjustmentAppliesToClip.
  assert.equal(
    throwsMsg(() => flattenForPreview({ tracks: [], adjustmentLayers: {} } as never)),
    `flattenForPreview: spec.adjustmentLayers phải là một mảng (nếu có)`,
  );
  assert.equal(
    throwsMsg(() => adjustmentAppliesToClip(
      { scopeTracks: "x" } as never, { nestedPath: [], trackStack: [0] })),
    `adjustmentAppliesToClip: scopeTracks phải là một mảng các chỉ số track`,
  );
  assert.equal(
    throwsMsg(() => adjustmentAppliesToClip(
      { scopeTracks: [-1] }, { nestedPath: [], trackStack: [0] })),
    `adjustmentAppliesToClip: scopeTracks chứa chỉ số không hợp lệ: -1`,
  );
});

ok("fallback: composeTwoLevelCurve — validate + hợp hai tầng đúng từng chữ", () => {
  const base: Parameters<typeof composeTwoLevelCurve>[0] = {
    outerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" as const }, { t: 4, v: 2, easing: "linear" as const }] },
    outerDuration: 4, outerIn: 0,
    innerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" as const }, { t: 4, v: 1, easing: "linear" as const }] },
    leafStart: 0, leafDuration: 4, leafIn: 0,
  };
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({ ...base, outerDuration: 0 })),
    `twoLevelCurve: outerDuration phải > 0 (nhận được: 0)`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({ ...base, leafDuration: -1 })),
    `twoLevelCurve: leafDuration phải > 0 (nhận được: -1)`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      outerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" }] },
      outerDuration: 4, outerIn: 0,
      innerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 2, v: 1, easing: "linear" }] },
      leafStart: 10, leafDuration: 2, leafIn: 0,
    })),
    `twoLevelCurve: lá nằm ngoài cửa sổ clip lồng nhau hoàn toàn — không có đoạn khả kiến để hợp`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({ ...base, outerCurve: {} as never })),
    `outerCurve: speedKeyframes phải là object { keyframes: [...] }`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({ ...base, outerCurve: { keyframes: [] } })),
    `outerCurve: speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe`,
  );
  const many = Array.from({ length: 129 }, (_, i) => ({ t: i, v: 1, easing: "linear" as const }));
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      ...base, outerCurve: { keyframes: many }, outerDuration: 200,
    })),
    `outerCurve: speedKeyframes.keyframes: quá 128 keyframe`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      ...base, innerCurve: { keyframes: ["x"] } as never, leafDuration: 4,
    })),
    `innerCurve.keyframes[0] phải là object { t, v, easing }`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      ...base, innerCurve: { keyframes: [{ t: -1, v: 1, easing: "linear" }] },
    })),
    `innerCurve.keyframes[0].t phải trong [0, 4] (nhận được: -1)`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      ...base, innerCurve: { keyframes: [{ t: 0, v: 9, easing: "linear" }] },
    })),
    `innerCurve.keyframes[0].v phải trong 0.25..4 (nhận được: 9)`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      ...base, innerCurve: { keyframes: [{ t: 0, v: 1, easing: "ease-in-out" } as never] },
    })),
    `innerCurve.keyframes[0].easing phải là linear | ease-in | ease-out | bezier (nhận được: "ease-in-out")`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      ...base,
      innerCurve: { keyframes: [{ t: 0, v: 1, easing: "bezier", bezier: [2, 0, 0, 0] }] },
    })),
    `innerCurve.keyframes[0].bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do (nhận được: [2,0,0,0])`,
  );
  // Trong hằng 3 × ngoài 1→2: slice chèn keyframe nội suy nên v đầu
  // tiên vượt không phải đúng 6 — khóa bằng lookup fragment vi.
  const innerConst = throwsMsg(() => composeTwoLevelCurve({
    outerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
    outerDuration: 4, outerIn: 0,
    innerCurve: { keyframes: [{ t: 0, v: 3, easing: "linear" }, { t: 4, v: 3, easing: "linear" }] },
    leafStart: 0, leafDuration: 4, leafIn: 0,
  }));
  const ic = innerConst.match(/^twoLevelCurve: tốc độ hợp hai tầng = ([\d.e+-]+) vượt khoảng 0\.25\.\.4 \(tốc độ trong hằng 3 × tốc độ ngoài\)$/);
  assert.ok(ic, `speedOutOfRangeInnerConst sai dạng: ${innerConst}`);
  assert.equal(innerConst, lookupVi("twoLevel.speedOutOfRangeInnerConst",
    { path: "twoLevelCurve", v: ic![1], min: "0.25", max: "4", inner: "3" }));
  // Ngoài hằng 3 × trong 1→2: tích lên tới 6.
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      outerCurve: { keyframes: [{ t: 0, v: 3, easing: "linear" }, { t: 4, v: 3, easing: "linear" }] },
      outerDuration: 4, outerIn: 0,
      innerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
      leafStart: 0, leafDuration: 4, leafIn: 0,
    })),
    `twoLevelCurve: tốc độ hợp hai tầng = 6 vượt khoảng 0.25..4 (tốc độ ngoài hằng 3 × tốc độ trong)`,
  );
  // Hermite: ngoài 1→2 × trong 2→4 (cả hai không hằng) — v/t là float,
  // khóa bằng lookup fragment vi.
  const hermite = throwsMsg(() => composeTwoLevelCurve({
    outerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
    outerDuration: 4, outerIn: 0,
    innerCurve: { keyframes: [{ t: 0, v: 2, easing: "linear" }, { t: 6, v: 4, easing: "linear" }] },
    leafStart: 0, leafDuration: 6, leafIn: 0,
  }));
  const hm = hermite.match(/^twoLevelCurve: tốc độ hợp hai tầng = ([\d.e+-]+) vượt khoảng 0\.25\.\.4 tại t'=([\d.e+-]+) — tích tốc độ ngoài × tốc độ trong vượt khoảng dù mỗi tầng đều hợp lệ; giảm biên độ một trong hai curve$/);
  assert.ok(hm, `speedOutOfRangeHermite sai dạng: ${hermite}`);
  assert.equal(hermite, lookupVi("twoLevel.speedOutOfRangeHermite",
    { path: "twoLevelCurve", v: hm![1], min: "0.25", max: "4", t: hm![2] }));
  // mergeBreakpoints: 100 + 100 keyframe không hằng → 171 điểm gãy.
  const kf100 = Array.from({ length: 100 }, (_, i) => ({ t: i, v: 1 + i / 99, easing: "linear" as const }));
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      outerCurve: { keyframes: kf100 }, outerDuration: 99, outerIn: 0,
      innerCurve: { keyframes: kf100 }, leafStart: 0, leafDuration: 99, leafIn: 0,
    })),
    `twoLevelCurve: hợp curve hai tầng cần 171 điểm gãy, vượt giới hạn 128 keyframe của clip ramp — giảm số keyframe của curve ngoài/trong`,
  );
});

ok("fallback: checkSpeedKeyframesRenderFatal 8 warning đúng từng chữ", () => {
  const P = "tracks[0].clips[0]";
  const ws = (curve: unknown) => checkSpeedKeyframesRenderFatal(curve, P, "c0", 4);
  assert.equal(ws({})[0].message, `speedKeyframes phải là object { keyframes: [...] }.`);
  assert.equal(ws({ keyframes: [] })[0].message, `speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe.`);
  const many = Array.from({ length: 129 }, (_, i) => ({ t: i, v: 1, easing: "linear" }));
  assert.equal(ws({ keyframes: many })[0].message, `speedKeyframes.keyframes: quá 128 keyframe (có 129).`);
  assert.equal(
    ws({ keyframes: ["x"] })[0].message,
    `${P}.speedKeyframes.keyframes[0] phải là object { t, v, easing }.`,
  );
  assert.equal(
    ws({ keyframes: [{ t: -1, v: 1, easing: "linear" }] })[0].message,
    `${P}.speedKeyframes.keyframes[0].t phải trong [0, 4] (nhận được: -1).`,
  );
  assert.equal(
    ws({ keyframes: [{ t: 0, v: 9, easing: "linear" }] })[0].message,
    `${P}.speedKeyframes.keyframes[0].v phải trong [0.25, 4] (nhận được: 9).`,
  );
  assert.equal(
    ws({ keyframes: [{ t: 0, v: 1, easing: "ease-in-out" }] })[0].message,
    `${P}.speedKeyframes.keyframes[0].easing phải là linear | ease-in | ease-out | bezier (nhận được: "ease-in-out").`,
  );
  assert.equal(
    ws({ keyframes: [{ t: 0, v: 1, easing: "bezier", bezier: [2, 0, 0, 0] }] })[0].message,
    `${P}.speedKeyframes.keyframes[0].bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do.`,
  );
});

ok("fallback: formatExportCurveError — head + 5 dòng + tổng kết + tail", () => {
  const ws = [];
  for (let i = 0; i < 7; i++) {
    ws.push({
      path: `tracks[0].clips[${i}]`,
      clipId: `c${i}`,
      keyframeIndex: 0,
      field: "v",
      value: 9,
      message: `keyframes[0].v phải trong [0.25, 4] (nhận được: 9).`,
    });
  }
  const lines = [0, 1, 2, 3, 4].map((i) =>
    `• tracks[0].clips[${i}] (clip "c${i}"): keyframes[0].v phải trong [0.25, 4] (nhận được: 9).`).join("\n");
  const expected =
    `Không xuất được: curve tốc độ vi phạm, render sẽ từ chối project này:\n` +
    `${lines}\n• … và 2 vi phạm khác.\n` +
    `Bấm “Sửa curve vi phạm” để tự động sửa (có xác nhận trước, hoàn tác được), hoặc sửa tay trong Speed panel rồi xuất lại.`;
  assert.equal(formatExportCurveError(ws as never), expected);
});

ok("fallback: parseProjectText — keyframeDropped + openFailed đúng từng chữ", () => {
  const bad = specWithClips([{
    kind: "audio", id: "a1", src: "a.mp3", start: 0, duration: 4, in: 0, out: 4, volume: 0.5,
    volumeKeyframes: { keyframes: [null] },
  }]);
  const r = parseProjectText(envelopeJson(bad));
  assert.ok(r.ok, `load phải ok, lỗi: ${r.errors.join("; ")}`);
  assert.equal(
    r.warnings.find((w) => w.includes("Đã loại keyframe lỗi")),
    `Đã loại keyframe lỗi khỏi 1 field (tracks[0].clips[0] (clip "a1").volumeKeyframes.keyframes rỗng sau khi loại 1 entry lỗi — đã xóa field.) — lưu lại file để hoàn tất.`,
  );
  const future = { ...specWithClips([]), version: "99.0.0" };
  const r2 = parseProjectText(envelopeJson(future, "99.0.0"));
  assert.equal(r2.ok, false);
  assert.equal(
    r2.errors[0],
    `Không mở được file: File dùng schema version 99.0.0, mới hơn app hiện tại (hỗ trợ tới 0.2.0). Hãy cập nhật app lên bản mới nhất để mở file này.`,
  );
});

// --- C. Có lookup: EN dịch thật, VI bằng đúng fallback --------------
ok("lookup en: thrown error dịch qua fragment", () => {
  assert.equal(
    throwsMsg(() => resolveNestedRampCurve({}, 4, "L", lookupEn)),
    `L: speedKeyframes must be an object { keyframes: [...] }`,
  );
  assert.equal(
    throwsMsg(() => resolveNestedRampCurve(
      { keyframes: [{ t: 0, v: 1, easing: "bezier", bezier: [2, 0, 0, 0] }] }, 4, "L", lookupEn)),
    `L: speedKeyframes.keyframes[0].bezier must be [x1, y1, x2, y2]: x1, x2 in [0, 1], y1, y2 free`,
  );
  assert.equal(
    throwsMsg(() => composeTwoLevelCurve({
      outerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" }] },
      outerDuration: 0, outerIn: 0,
      innerCurve: { keyframes: [{ t: 0, v: 1, easing: "linear" }] },
      leafStart: 0, leafDuration: 4, leafIn: 0,
    }, lookupEn)),
    `twoLevelCurve: outerDuration must be > 0 (got: 0)`,
  );
  assert.equal(
    throwsMsg(() => convertCanonicalLayer({ id: "a", start: -1, duration: 1 }, "L", lookupEn)),
    `L: adjustment layer "a".start must be a number >= 0`,
  );
  assert.equal(
    throwsMsg(() => normalizeNestedClip(
      { kind: "nested", id: "n", trim: { in: 2, out: 2 }, tracks: [] }, lookupEn)),
    `nested clip "n": trim.out must be a number > trim.in`,
  );
  assert.equal(
    throwsMsg(() => flattenForPreview({
      tracks: [{ kind: "video", clips: [nestedRamp({ opacity: 2 }, [video("x", 0, 3)])] }],
    }, lookupEn)),
    `nested "n1": opacity must be a number in the 0..1 range, got: 2`,
  );
});

ok("lookup en: curveFix warnings + export blocker dịch thật", () => {
  const P = "tracks[0].clips[0]";
  const wShape = checkSpeedKeyframesRenderFatal({}, P, "c0", 4, lookupEn)[0];
  assert.equal(wShape.message, `speedKeyframes must be an object { keyframes: [...] }.`);
  const wT = checkSpeedKeyframesRenderFatal(
    { keyframes: [{ t: -1, v: 1, easing: "linear" }] }, P, "c0", 4, lookupEn)[0];
  assert.equal(wT.message, `${P}.speedKeyframes.keyframes[0].t must be in [0, 4] (got: -1).`);
  const wB = checkSpeedKeyframesRenderFatal(
    { keyframes: [{ t: 0, v: 1, easing: "bezier", bezier: [2, 0, 0, 0] }] }, P, "c0", 4, lookupEn)[0];
  assert.equal(wB.message, `${P}.speedKeyframes.keyframes[0].bezier must be [x1, y1, x2, y2]: x1, x2 in [0, 1], y1, y2 free.`);
  const ws = [];
  for (let i = 0; i < 7; i++) {
    ws.push({
      path: `tracks[0].clips[${i}]`, clipId: `c${i}`, keyframeIndex: 0, field: "v", value: 9,
      message: `keyframes[0].v must be within [0.25, 4] (got: 9).`,
    });
  }
  const lines = [0, 1, 2, 3, 4].map((i) =>
    `• tracks[0].clips[${i}] (clip "c${i}"): keyframes[0].v must be within [0.25, 4] (got: 9).`).join("\n");
  assert.equal(
    formatExportCurveError(ws as never, 5, lookupEn),
    `Cannot export: violating speed curves, the render will reject this project:\n` +
    `${lines}\n• … and 2 more violations.\n` +
    `Tap “Fix violating curves” to fix automatically (with confirmation first, undoable), or fix manually in the Speed panel and export again.`,
  );
});

ok("lookup en: parseProjectText keyframeDropped + openFailed dịch thật", () => {
  const bad = specWithClips([{
    kind: "audio", id: "a1", src: "a.mp3", start: 0, duration: 4, in: 0, out: 4, volume: 0.5,
    volumeKeyframes: { keyframes: [null] },
  }]);
  const r = parseProjectText(envelopeJson(bad), lookupEn);
  assert.ok(r.ok);
  assert.equal(
    r.warnings.find((w) => w.includes("Removed broken keyframes")),
    // Đợt 60 Q4 — inner keyframeFix nay dịch thật sang EN (trước đây kẹt
    // VI trong wrapper EN vì sanitizeKeyframeArrays chưa nối lookup):
    // keyframeFixEmptyAfterDrop EN + keyframeDropped EN (xem LIMITS Q4 §4).
    `Removed broken keyframes from 1 fields (tracks[0].clips[0] (clip "a1").volumeKeyframes.keyframes is empty after dropping 1 invalid entries — field removed.) — save the file to complete.`,
  );
  const future = { ...specWithClips([]), version: "99.0.0" };
  const r2 = parseProjectText(envelopeJson(future, "99.0.0"), lookupEn);
  assert.equal(r2.ok, false);
  assert.equal(
    r2.errors[0],
    `Could not open the file: File dùng schema version 99.0.0, mới hơn app hiện tại (hỗ trợ tới 0.2.0). Hãy cập nhật app lên bản mới nhất để mở file này.`,
  );
});

ok("lookup vi: bằng đúng fallback (sau merge, vi không đổi hành vi)", () => {
  const ws = [];
  for (let i = 0; i < 7; i++) {
    ws.push({
      path: `tracks[0].clips[${i}]`, clipId: `c${i}`, keyframeIndex: 0, field: "v", value: 9,
      message: `keyframes[0].v phải trong [0.25, 4] (nhận được: 9).`,
    });
  }
  assert.equal(formatExportCurveError(ws as never, 5, lookupVi), formatExportCurveError(ws as never));
  assert.equal(
    throwsMsg(() => resolveNestedRampCurve(
      { keyframes: [{ t: 0, v: 1, easing: "ease-in-out" }] }, 4, "L", lookupVi)),
    throwsMsg(() => resolveNestedRampCurve(
      { keyframes: [{ t: 0, v: 1, easing: "ease-in-out" }] }, 4, "L")),
  );
});

// --- D. Source: trKey đã nối + site bỏ qua còn nguyên ------------------
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}
const NESTED_KEYS = [
  "nested.scopeTracksNotArray", "nested.scopeTracksBadIndex", "nested.adjNotObject",
  "nested.adjIdEmpty", "nested.adjStart", "nested.adjDuration", "nested.adjEffectsNotArray",
  "nested.adjEffectInvalid", "nested.adjFiltersNotArray", "nested.adjFilterNotObject",
  "nested.adjFilterLut", "nested.adjEmpty", "nested.notNestedClip", "nested.subSpecTracks",
  "nested.subSpecConflict", "nested.subSpecAdjLayers", "nested.noContent", "nested.trimIn",
  "nested.trimOut", "nested.trimInConflict", "nested.trimOutMismatchConst",
  "nested.trimOutMismatchCurve", "nested.durationMismatch", "nested.reverseSpeed",
  "nested.multiEnd", "nested.transitionNoPrev", "nested.transitionOutDuration",
  "nested.transitionOutType", "nested.transitionCrossBorder", "nested.transitionLonger",
  "nested.transitionBothSides", "nested.transitionEarly", "nested.transitionFlatExists",
  "nested.leafAtTransitionEdge", "nested.leafOpacityAndTransition",
  "nested.leafShorterThanTransition", "nested.leafInnerAndOuterTransition",
  "nested.leafCutLeft", "nested.rescaleEmpty", "nested.combinedSpeedOutOfRange",
  "nested.opacityRange", "nested.leafUnderNestedRefusal", "nested.leafUnderNestedNonMedia",
  "nested.leafUnderNestedNoIn", "nested.leafSpeedKeyframesComposed",
  "nested.leafSpeedKeyframesSlice", "nested.leafSpeedProduct", "nested.leafNoOwnCurve",
  "nested.leafConstSpeed", "nested.flattenAdjLayers", "nested.adjScopeNotArray",
  "nested.adjScopeBadIndex",
];
const TWO_LEVEL_KEYS = [
  "twoLevel.mergeDuration", "twoLevel.mergeBreakpoints", "twoLevel.speedOutOfRangeHermite",
  "twoLevel.speedOutOfRangeInnerConst", "twoLevel.speedOutOfRangeOuterConst",
  "twoLevel.outerDuration", "twoLevel.leafDuration", "twoLevel.leafOutside",
  "twoLevel.sliceOuter", "twoLevel.sliceInner",
];
const CURVE_ERR_SHARED = [
  "curveErr.speedNotObject", "curveErr.speedEmpty", "curveErr.speedTooMany",
  "curveErr.kfNotObject", "curveErr.kfTOutOfRange", "curveErr.kfVRangeDots",
  "curveErr.kfEasing",
];
// kfBezier (có "(nhận được: …)") chỉ ở twoLevelCurve; kfBezierNoValue
// (không đuôi value) chỉ ở nestedPreview — 2 biến thể đã tách key.
const CURVE_ERR_NESTED = [...CURVE_ERR_SHARED, "curveErr.kfBezierNoValue"];
const CURVE_ERR_TWO_LEVEL = [...CURVE_ERR_SHARED, "curveErr.kfBezier"];
const CURVEFIX_KEYS = [
  "curveErr.kfNotObjectDot", "curveErr.kfTOutOfRangeDot", "curveErr.kfEasingDot",
  "curveErr.kfVRangeBrackets", "curveErr.kfBezierNoValueDot",
  "curveFix.moreViolations", "curveFix.exportBlockedHead", "curveFix.exportBlockedTail",
];
const PROJECTREPO_KEYS = ["projectRepo.openFailed", "projectRepo.keyframeDropped"];

ok("source: nestedPreview.ts nối đủ 52 key nested.* + 8 key curveErr.*", () => {
  const src = readSrc("lib/nestedPreview.ts");
  assert.ok(src.includes("export type I18nLookup"), "thiếu type I18nLookup");
  assert.ok(!src.includes(`from "../i18n"`), "không được import i18n trực tiếp (strip-types)");
  for (const k of [...NESTED_KEYS, ...CURVE_ERR_NESTED]) {
    assert.ok(src.includes(`trKey(lookup, "${k}"`), `nestedPreview.ts thiếu trKey("${k}")`);
  }
});

ok("source: twoLevelCurve.ts nối đủ 10 key twoLevel.* + 8 key curveErr.*", () => {
  const src = readSrc("lib/twoLevelCurve.ts");
  assert.ok(src.includes("export type I18nLookup"), "thiếu type I18nLookup");
  assert.ok(!src.includes(`from "../i18n"`), "không được import i18n trực tiếp (strip-types)");
  for (const k of [...TWO_LEVEL_KEYS, ...CURVE_ERR_TWO_LEVEL]) {
    assert.ok(src.includes(`trKey(lookup, "${k}"`), `twoLevelCurve.ts thiếu trKey("${k}")`);
  }
});

ok("source: curveFix.ts nối 8 key warning/export + tái dùng 3 key speedCurve.*", () => {
  const src = readSrc("lib/curveFix.ts");
  assert.ok(src.includes("export type I18nLookup"), "thiếu type I18nLookup");
  assert.ok(!src.includes(`from "../i18n"`), "không được import i18n trực tiếp (strip-types)");
  for (const k of CURVEFIX_KEYS) {
    assert.ok(src.includes(`trKey(lookup, "${k}"`), `curveFix.ts thiếu trKey("${k}")`);
  }
  for (const k of ["speedCurve.shape", "speedCurve.keyframesEmpty", "speedCurve.keyframesTooMany"]) {
    assert.ok(src.includes(`trKey(lookup, "${k}"`), `curveFix.ts thiếu trKey("${k}")`);
  }
  // formatSanitizeSummary giữ nguyên fallback VI (đã i18n qua Localized + key có sẵn).
  assert.ok(src.includes("Đã sửa ${"), "formatSanitizeSummary phải giữ fallback VI");
});

ok("source: projectRepo.ts nối 2 key + giữ nguyên cơ chế messageKey", () => {
  const src = readSrc("lib/projectRepo.ts");
  assert.ok(src.includes("export type I18nLookup"), "thiếu type I18nLookup");
  assert.ok(!src.includes(`from "../i18n"`), "không được import i18n trực tiếp (strip-types)");
  for (const k of PROJECTREPO_KEYS) {
    assert.ok(src.includes(`trKey(lookup, "${k}"`), `projectRepo.ts thiếu trKey("${k}")`);
  }
  // Warning speedCurve KHÔNG nối ở đây: messageKey + message fallback giữ nguyên.
  assert.ok(src.includes("messageKey"), "projectRepo.ts phải giữ messageKey");
  assert.ok(src.includes(`"speedCurve.shape"`), "phải giữ messageKey speedCurve.shape");
  assert.ok(src.includes(`"speedKeyframes phải là object { keyframes: [...] }."`),
    "message fallback VI phải giữ nguyên từng chữ");
  // moreWarnings + motionMigratedHint CỐ TÌNH giữ VI (xem LIMITS).
  assert.ok(src.includes("Còn ${speedCurveWarningsAll.length - 100} cảnh báo speedKeyframes khác"),
    "moreWarnings phải giữ VI (loadReport OVERFLOW_RE khớp chuỗi này)");
  assert.ok(src.includes("Motion cũ đã được chuẩn hoá khi mở — lưu lại file để hoàn tất nâng cấp."),
    "motionMigratedHint fallback phải giữ nguyên từng chữ");
});

console.log(`i18n round 56 M5: ${pass} pass`);
