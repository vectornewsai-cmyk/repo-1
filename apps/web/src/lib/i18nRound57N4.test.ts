// i18nRound57N4.test.ts — Phase 9 đợt 57, luồng N4: đóng 2 nợ LIMITS đợt 56
// (§4.4 + §4.5 trong docs/PHASE9_ROUND56_M6_UNVERIFIED_LIB_LIMITS.md,
// chi tiết trong docs/PHASE9_ROUND56_M5_I18N_WIRING_LIMITS.md §6):
//   (a) 11 chuỗi failsoft `sink.skipped` / `skippedEffectReason` trong
//       lib/nestedPreview.ts chưa có key i18n (chưa từng có trong proposal
//       round 55) — nối `trKey(lookup, "nested.failsoft.*")`, key mới nằm
//       trong fragment apps/web/src/i18n/fragments/round57-n4.json
//       (parent gộp vào vi.json/en.json cuối đợt, như M5);
//   (b) 4 literal VI ngoài inventory trong nestedPreview.ts (§4.4 M6:
//       reverseSpeed ~833, flattenAdjLayers ~2423, adjScopeNotArray /
//       adjScopeBadIndex ~2590/2596) — KIỂM CHỨNG: cả 4 đã được M5 nối
//       sẵn bằng trKey + key đã có trong vi.json/en.json (xem §F);
//       luồng này KHÔNG sửa lại, chỉ khóa bằng test.
//
// Mẫu nối + mẫu test theo M5 (lookup injection, KHÔNG import ../i18n
// trực tiếp vì Node strip-types lỗi import JSON). Không lookup → fallback
// đúng từng chữ chuỗi VI cũ; có lookup (UI truyền t()) → chuỗi theo
// locale. Call site UI thật đã nối sẵn: preview.tsx:2641 gọi
// buildPreviewSpecFailsoft(rawSpec, i18nT) — xem §G.
//
// Chạy từ gốc repo (mẫu M5/L2 — esbuild bundle rồi chạy node):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nRound57N4.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round57-n4/n4.test.cjs
//   node /tmp/round57-n4/n4.test.cjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  applyAdjustmentPreview,
  buildPreviewSpecFailsoft,
  flattenForPreview,
  resolvePreviewBoundaries,
  skippedEffectReason,
  type LeafClipInput,
} from "./nestedPreview";

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

// --- Dict thật + lookup mô phỏng t() (fragment + vi.json/en.json) ----
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
const FRAG = readJson("apps/web/src/i18n/fragments/round57-n4.json") as {
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

// --- Fixture -----------------------------------------------------------
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
function nestedPlain(
  id: string,
  inner: unknown[],
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    kind: "nested", id, start: 0, duration: 4, in: 0,
    tracks: [{ kind: "video", clips: inner }],
    ...extra,
  };
}
function flatSpec(clips: unknown[]) {
  return flattenForPreview({ tracks: [{ kind: "video", clips }] });
}
/** Chuỗi nested 17 tầng (d0 ngoài cùng … d16 trong cùng) để chạm MAX_NEST_DEPTH = 16. */
function deepChain(): Record<string, unknown> {
  let leaf: unknown = video("x", 0, 1);
  for (let i = 16; i >= 0; i--) {
    leaf = nestedPlain(`d${i}`, [leaf]);
  }
  return leaf as Record<string, unknown>;
}
/** Nested có track trong kind "audio" chứa 1 nested con mang transition — chạm passthrough innerBoundary.skipped. */
function nestedAudioInner(): Record<string, unknown> {
  return {
    kind: "nested", id: "n1", start: 0, duration: 4, in: 0,
    tracks: [{
      kind: "audio",
      clips: [{
        kind: "nested", id: "n2", start: 0, duration: 2, in: 0,
        transitionIn: { type: "fade", duration: 1 },
        tracks: [{ kind: "video", clips: [video("x", 0, 1)] }],
      }],
    }],
  };
}
const HOLOGRAM_LAYER = {
  id: "adj", start: 0, duration: 10,
  effects: [{ type: "hologram" }], scopeTracks: [0], nestedPath: [],
} as never;
const HOLOGRAM_SCOPE = { nestedPath: [], trackStack: [0] } as never;

const FAILSOFT_KEYS = [
  "nested.failsoft.nonVideoBoundary",
  "nested.failsoft.firstClipTransition",
  "nested.failsoft.maxDepth",
  "nested.failsoft.invalidNested",
  "nested.failsoft.speedOutOfRange",
  "nested.failsoft.cycle",
  "nested.failsoft.invalidNestedAdjustment",
  "nested.failsoft.unknownNestedClip",
  "nested.failsoft.invalidOuterAdjustment",
  "nested.failsoft.unknownOuterClip",
  "nested.failsoft.unknownEffectType",
];

// --- A. Fragment: parity + nội dung + không trùng key ------------------
ok("fragment: 11 key mới, vi/en cùng tập key, khác nhau từng key, placeholder khớp", () => {
  assert.equal(FRAG_VI.size, 11, `fragment vi phải có 11 key, nhận ${FRAG_VI.size}`);
  assert.equal(FRAG_EN.size, 11, `fragment en phải có 11 key, nhận ${FRAG_EN.size}`);
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
  assert.deepEqual([...FRAG_VI.keys()].sort(), [...FAILSOFT_KEYS].sort(), "fragment phải đúng 11 key failsoft");
});

ok("fragment: sau gộp, 11 key đã có trong vi.json/en.json đúng giá trị fragment, không trùng fragment khác", () => {
  const realVi = flatten(VI);
  const realEn = flatten(EN);
  // Parent gộp đợt 57: dict đã gộp fragment N4/N5/N7/N8 -> 1937 key lá mỗi bên.
// Parent gộp đợt 58: +5 key (4 O3 preview.*Skipped* + 1 O5 captions.translatedTrack) -> 1942 mỗi bên (vi == en, 0 key mồ côi).
// Parent gộp đợt 59: +15 key (4 P1 mediabin/store + 11 P8 enhance.*) -> 1957 mỗi bên (vi == en); P3 ghi đè 1 key nested.failsoft.unknownEffectType (thêm {type}), không tăng số key; đợt 60 Q4: −14 key mồ côi +26 key fragment P7 → 1969 mỗi bên; parent gộp đợt 60: +3 key Q1 → 1972 mỗi bên; parent gộp đợt 61: +72 key (R2 3 + R5 1 + R6 50 + R9 18) → 2044 mỗi bên; parent gộp đợt 62: +102 key (R2 2 + R5 91 + R7 9) → 2146 mỗi bên.
  // Parent gộp đợt 63: +131 key fragment (R1 5 + R5 123 + R7 2 + R9 1) − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI → 2275 mỗi bên (vi == en, 0 key mồ côi); parent gộp đợt 64: +7 key fragment (R2 6 + R8 1) + 1 key parent (projectHistory.migrateVersionsNeedsProjectId) → 2283 mỗi bên.
  assert.equal(realVi.size, 2326, `vi.json phải có 2326 key lá, nhận ${realVi.size}`);
  assert.equal(realEn.size, 2326, `en.json phải có 2326 key lá, nhận ${realEn.size}`);
  for (const k of FRAG_VI.keys()) {
    assert.equal(realVi.get(k), FRAG_VI.get(k), `vi.json lệch giá trị key ${k} so với fragment`);
    assert.equal(realEn.get(k), FRAG_EN.get(k), `en.json lệch giá trị key ${k} so với fragment`);
  }
  for (const f of readdirSync("apps/web/src/i18n/fragments")) {
    if (f === "round57-n4.json") continue;
    const other = readJson(`apps/web/src/i18n/fragments/${f}`) as { vi: Dict; en: Dict };
    const otherKeys = new Set([...flatten(other.vi).keys(), ...flatten(other.en).keys()]);
    for (const k of FRAG_VI.keys()) {
      assert.ok(!otherKeys.has(k), `fragment ${f} đã có key ${k} — trùng!`);
    }
  }
});

// --- B. Không lookup: fallback đúng từng chữ literal VI cũ ------------
ok("fallback: resolvePreviewBoundaries 2 chuỗi bỏ transition đúng từng chữ", () => {
  const nonVideo = resolvePreviewBoundaries([{
    kind: "nested", id: "n1", start: 0, duration: 5,
    transitionIn: { type: "fade", duration: 1 }, tracks: [],
  }], "audio", `track "a0"`).skipped;
  assert.deepEqual(nonVideo, [
    `track "a0": clip lồng nhau "n1" có transition qua biên nhưng track không phải video — bỏ qua transition qua biên (chỉ hỗ trợ track video)`,
  ]);
  const firstClip = resolvePreviewBoundaries([{
    kind: "video", id: "b", start: 10, duration: 5,
    transitionIn: { type: "fade", duration: 1 },
  }], "video", `track "v0"`).skipped;
  assert.deepEqual(firstClip, [
    `track "v0": clip "b" có transitionIn nhưng là clip đầu track — transition bị bỏ qua`,
  ]);
});

ok("fallback: flattenForPreview 8 chuỗi failsoft đúng từng chữ", () => {
  assert.deepEqual(
    flatSpec([deepChain()]).skipped,
    [`nested "d16" vượt quá độ sâu 16, bỏ qua`],
  );
  assert.deepEqual(
    flatSpec([{ ...nestedPlain("bad", [video("x", 0, 1)]), duration: 0 }]).skipped,
    [`nested "bad" có start/duration/in/speed không hợp lệ, bỏ qua`],
  );
  assert.deepEqual(
    flatSpec([nestedRamp({ speed: 5 }, [video("x", 0, 3)])]).skipped,
    [`nested "n1" có speed (5) ngoài 0.25..4 dù mang speedKeyframes, bỏ qua`],
  );
  assert.deepEqual(
    flatSpec([nestedPlain("n1", [nestedPlain("n1", [video("x", 0, 1)])])]).skipped,
    [`nested "n1" tạo chu trình (id đã có trong n1), bỏ qua`],
  );
  assert.deepEqual(
    flatSpec([nestedPlain("n1", [{ kind: "adjustment", id: "bad", start: 0, duration: 0 }])]).skipped,
    [`adjustment trong nested "n1" không hợp lệ, bỏ qua`],
  );
  const noId = { kind: "video", start: 0, duration: 1 };
  assert.deepEqual(
    flatSpec([nestedPlain("n1", [noId])]).skipped,
    [`clip trong nested "n1" không nhận dạng được, bỏ qua`],
  );
  assert.deepEqual(
    flatSpec([{ kind: "adjustment", id: "bad", start: 0, duration: 0 }]).skipped,
    [`adjustment tầng ngoài không hợp lệ, bỏ qua`],
  );
  assert.deepEqual(
    flatSpec([noId]).skipped,
    [`clip tầng ngoài không nhận dạng được, bỏ qua`],
  );
});

ok("fallback: skippedEffectReason + applyAdjustmentPreview đúng từng chữ", () => {
  assert.equal(
    skippedEffectReason("sharpen"),
    'type "sharpen" chưa biết, không có đường vẽ trong preview',
  );
  const f = applyAdjustmentPreview({}, [HOLOGRAM_LAYER], 5, HOLOGRAM_SCOPE);
  assert.deepEqual(f.skippedEffects, ["hologram"]);
  assert.deepEqual(f.skippedReasons, ['type "hologram" chưa biết, không có đường vẽ trong preview']);
});

// --- C. Có lookup: EN dịch thật ----------------------------------------
ok("lookup en: resolvePreviewBoundaries 2 chuỗi dịch thật", () => {
  const nonVideo = resolvePreviewBoundaries([{
    kind: "nested", id: "n1", start: 0, duration: 5,
    transitionIn: { type: "fade", duration: 1 }, tracks: [],
  }], "audio", `track "a0"`, lookupEn).skipped;
  assert.deepEqual(nonVideo, [
    `track "a0": nested clip "n1" has a cross-boundary transition but the track is not a video track — skipping the cross-boundary transition (video tracks only)`,
  ]);
  const firstClip = resolvePreviewBoundaries([{
    kind: "video", id: "b", start: 10, duration: 5,
    transitionIn: { type: "fade", duration: 1 },
  }], "video", `track "v0"`, lookupEn).skipped;
  assert.deepEqual(firstClip, [
    `track "v0": clip "b" has a transitionIn but is the first clip on the track — the transition is skipped`,
  ]);
});

ok("lookup en: flattenForPreview 8 chuỗi failsoft dịch thật", () => {
  const withEn = (clips: unknown[]) =>
    flattenForPreview({ tracks: [{ kind: "video", clips }] }, lookupEn).skipped;
  assert.deepEqual(withEn([deepChain()]), [`nested "d16" exceeds the max depth of 16, skipping`]);
  assert.deepEqual(
    withEn([{ ...nestedPlain("bad", [video("x", 0, 1)]), duration: 0 }]),
    [`nested "bad" has invalid start/duration/in/speed, skipping`],
  );
  assert.deepEqual(
    withEn([nestedRamp({ speed: 5 }, [video("x", 0, 3)])]),
    [`nested "n1" has speed (5) outside 0.25..4 despite carrying speedKeyframes, skipping`],
  );
  assert.deepEqual(
    withEn([nestedPlain("n1", [nestedPlain("n1", [video("x", 0, 1)])])]),
    [`nested "n1" creates a cycle (id already in n1), skipping`],
  );
  assert.deepEqual(
    withEn([nestedPlain("n1", [{ kind: "adjustment", id: "bad", start: 0, duration: 0 }])]),
    [`adjustment inside nested "n1" is invalid, skipping`],
  );
  const noId = { kind: "video", start: 0, duration: 1 };
  assert.deepEqual(
    withEn([nestedPlain("n1", [noId])]),
    [`clip inside nested "n1" is not recognized, skipping`],
  );
  assert.deepEqual(
    withEn([{ kind: "adjustment", id: "bad", start: 0, duration: 0 }]),
    [`outer-level adjustment is invalid, skipping`],
  );
  assert.deepEqual(
    withEn([noId]),
    [`outer-level clip is not recognized, skipping`],
  );
});

ok("lookup en: skippedEffectReason + passthrough innerBoundary dịch thật", () => {
  assert.equal(
    skippedEffectReason("sharpen", lookupEn),
    'unknown type "sharpen", no draw path in preview',
  );
  const f = applyAdjustmentPreview({}, [HOLOGRAM_LAYER], 5, HOLOGRAM_SCOPE, lookupEn);
  assert.deepEqual(f.skippedEffects, ["hologram"]);
  assert.deepEqual(f.skippedReasons, ['unknown type "hologram", no draw path in preview']);
  // Passthrough: chuỗi skipped của biên trong (innerBoundary) đã dịch
  // vẫn đi qua sink y nguyên, không bị fallback lại VI.
  const inner = flattenForPreview(
    { tracks: [{ kind: "video", clips: [nestedAudioInner()] }] }, lookupEn).skipped;
  assert.deepEqual(inner, [
    `nested "n1": nested clip "n2" has a cross-boundary transition but the track is not a video track — skipping the cross-boundary transition (video tracks only)`,
  ]);
});

// --- D. Lookup VI = fallback -------------------------------------------
ok("lookup vi: bằng đúng fallback (sau merge đợt 59, cả hai đều nêu tên type)", () => {
  const noId = { kind: "video", start: 0, duration: 1 };
  assert.deepEqual(
    flattenForPreview({ tracks: [{ kind: "video", clips: [noId] }] }, lookupVi).skipped,
    flattenForPreview({ tracks: [{ kind: "video", clips: [noId] }] }).skipped,
  );
  assert.equal(
    skippedEffectReason("sharpen", lookupVi),
    skippedEffectReason("sharpen"),
  );
  assert.equal(
    lookupVi("nested.failsoft.unknownEffectType"),
    'type "{type}" chưa biết, không có đường vẽ trong preview',
  );
});

// --- E. Source: trKey đã nối + thread lookup qua split ------------------
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}
ok("source: nestedPreview.ts nối đủ 11 key nested.failsoft.* qua trKey", () => {
  const src = readSrc("lib/nestedPreview.ts");
  assert.ok(src.includes("export type I18nLookup"), "thiếu type I18nLookup");
  assert.ok(!src.includes(`from "../i18n"`), "không được import i18n trực tiếp (strip-types)");
  for (const k of FAILSOFT_KEYS) {
    assert.ok(src.includes(`trKey(lookup, "${k}"`), `nestedPreview.ts thiếu trKey("${k}")`);
  }
});

ok("source: lookup được thread qua splitClipByAdjustments + skippedReasons", () => {
  const src = readSrc("lib/nestedPreview.ts");
  assert.ok(
    src.includes("applyAdjustmentPreview(clip, adjustments, (s + e) / 2, clipScope, lookup)"),
    "splitClipByAdjustments phải truyền lookup xuống applyAdjustmentPreview",
  );
  assert.ok(
    src.includes("skippedEffects.map((t) => skippedEffectReason(t, lookup))"),
    "applyAdjustmentPreview phải truyền lookup xuống skippedEffectReason",
  );
  assert.ok(
    src.includes("export function skippedEffectReason(type: string, lookup?: I18nLookup)"),
    "skippedEffectReason phải nhận lookup tùy chọn",
  );
  // 2 site passthrough KHÔNG cần key riêng (chuỗi đã dịch đi qua y nguyên).
  assert.ok(src.includes("for (const s of innerBoundary.skipped) sink.skipped.push(s);"),
    "passthrough innerBoundary.skipped phải còn nguyên");
  assert.ok(src.includes("for (const s of outerBoundary.skipped) sink.skipped.push(s);"),
    "passthrough outerBoundary.skipped phải còn nguyên");
});

// --- F. §4.4 M6: 4 literal VI ngoài inventory — ĐÃ nối sẵn bởi M5 ------
const ALREADY_WIRED: Array<{ key: string; vi: string; en: string }> = [
  {
    key: "nested.reverseSpeed",
    vi: "{path}: reverse ở clip lồng nhau có speedKeyframes chưa được hỗ trợ (render đợt 18 §5)",
    en: "{path}: reverse on a nested clip with speedKeyframes is not supported yet (render round 18 §5)",
  },
  {
    key: "nested.flattenAdjLayers",
    vi: "flattenForPreview: spec.adjustmentLayers phải là một mảng (nếu có)",
    en: "flattenForPreview: spec.adjustmentLayers must be an array (if present)",
  },
  {
    key: "nested.adjScopeNotArray",
    vi: "adjustmentAppliesToClip: scopeTracks phải là một mảng các chỉ số track",
    en: "adjustmentAppliesToClip: scopeTracks must be an array of track indices",
  },
  {
    key: "nested.adjScopeBadIndex",
    vi: "adjustmentAppliesToClip: scopeTracks chứa chỉ số không hợp lệ: {value}",
    en: "adjustmentAppliesToClip: scopeTracks contains an invalid index: {value}",
  },
];
ok("§4.4: 4 key đã có trong vi.json/en.json đúng từng chữ giá trị fragment M5", () => {
  const realVi = flatten(VI);
  const realEn = flatten(EN);
  const m5 = readJson("apps/web/src/i18n/fragments/round56-m5.json") as { vi: Dict; en: Dict };
  for (const { key, vi, en } of ALREADY_WIRED) {
    assert.equal(realVi.get(key), vi, `vi.json lệch: ${key}`);
    assert.equal(realEn.get(key), en, `en.json lệch: ${key}`);
    assert.equal(flatten(m5.vi).get(key), vi, `fragment M5 vi lệch: ${key}`);
    assert.equal(flatten(m5.en).get(key), en, `fragment M5 en lệch: ${key}`);
  }
});

ok("§4.4: source đã trKey cả 4 key + runtime EN cho reverseSpeed", () => {
  const src = readSrc("lib/nestedPreview.ts");
  for (const { key } of ALREADY_WIRED) {
    assert.ok(src.includes(`trKey(lookup, "${key}"`), `thiếu trKey("${key}")`);
  }
  // reverseSpeed có 2 site (normalizeNestedClip ~835 + flattenNested ~1680).
  const sites = src.split(`trKey(lookup, "nested.reverseSpeed"`).length - 1;
  assert.equal(sites, 2, `nested.reverseSpeed phải có 2 site trKey, nhận ${sites}`);
  const throwsMsg = (fn: () => void): string => {
    try {
      fn();
    } catch (e) {
      return (e as Error).message;
    }
    throw new Error("không throw như kỳ vọng");
  };
  assert.equal(
    throwsMsg(() => flattenForPreview({
      tracks: [{ kind: "video", clips: [nestedRamp({ reverse: true }, [video("x", 0, 3)])] }],
    }, lookupEn)),
    `nested clip "n1": reverse on a nested clip with speedKeyframes is not supported yet (render round 18 §5)`,
  );
  assert.equal(
    throwsMsg(() => flattenForPreview({
      tracks: [{ kind: "video", clips: [nestedRamp({ reverse: true }, [video("x", 0, 3)])] }],
    })),
    `nested clip "n1": reverse ở clip lồng nhau có speedKeyframes chưa được hỗ trợ (render đợt 18 §5)`,
  );
});

// --- G. Call site UI thật đã nối sẵn (preview.tsx) ----------------------
ok("call-site: preview.tsx đã truyền i18nT vào buildPreviewSpecFailsoft", () => {
  const preview = readSrc("preview.tsx");
  assert.ok(
    preview.includes("buildPreviewSpecFailsoft(rawSpec, i18nT)"),
    "preview.tsx phải gọi buildPreviewSpecFailsoft(rawSpec, i18nT)",
  );
  // Đường failsoft với lookup EN: spec có nested bị skip (duration 0,
  // không throw) vẫn build được spec; cùng spec qua flattenForPreview
  // cho chuỗi skipped EN — đúng đường preview.tsx đi qua.
  const spec = {
    version: "0.2.0",
    meta: { name: "t", width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v0", kind: "video",
      clips: [
        { kind: "video", id: "v1", start: 0, duration: 1, in: 0, out: 1 },
        { kind: "nested", id: "bad", start: 0, duration: 0, in: 0, tracks: [{ kind: "video", clips: [] }] },
      ],
    }],
  } as never;
  const r = buildPreviewSpecFailsoft(spec, lookupEn);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.spec.tracks.length, 1);
  assert.deepEqual(
    flattenForPreview(spec as never, lookupEn).skipped,
    [`nested "bad" has invalid start/duration/in/speed, skipping`],
  );
});
console.log(`i18n round 57 N4: ${pass} pass`);
