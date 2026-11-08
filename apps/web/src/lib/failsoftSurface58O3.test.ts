// failsoftSurface58O3.test.ts — Phase 9 đợt 58, luồng O3: đóng nợ đợt 57
// §6.2 — surface `flat.skipped` / `skippedReasons` (nestedPreview failsoft)
// ra UI (badge + toast preview). Phạm vi:
//   - lib: `buildPreviewSpecDetailed` (mới, giữ `flat.skipped` +
//     `skippedReasons`) + `buildPreviewSpecFailsoft` trả thêm 2 field đó
//     (đường nhanh + đường chậm); `buildPreviewSpec` giữ API cũ.
//   - UI: preview.tsx gộp skipped/skippedReasons vào cùng badge cảnh báo
//     preview của J1 + 1 toast tóm tắt mỗi loại khi tập đổi.
//   - i18n: 4 key mới `preview.nestedSkipped*` / `preview.effectSkipped*`
//     trong fragment apps/web/src/i18n/fragments/round58-o3.json (parent
//     gộp vào vi.json/en.json cuối đợt, như M5/N4 — KHÔNG sửa trực tiếp
//     vi/en trong luồng này).
//
// Chạy từ gốc repo (mẫu M5/L2/N4 — esbuild bundle rồi chạy node):
//   ./node_modules/.bin/esbuild apps/web/src/lib/failsoftSurface58O3.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round58-o3/o3.test.cjs
//   node /tmp/round58-o3/o3.test.cjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  buildPreviewSpec,
  buildPreviewSpecDetailed,
  buildPreviewSpecFailsoft,
  flattenForPreview,
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
const FRAG = readJson("apps/web/src/i18n/fragments/round58-o3.json") as {
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
// Đợt 59 P3: fragment P3 (hidden_files của goal — parent gộp cuối đợt 59)
// ghi đè giá trị mới của `nested.failsoft.unknownEffectType` (có {type}).
// Gộp thêm vào lookup để test này xanh cả pre-merge lẫn post-merge.
const P3FRAG = readJson(
  "../goals/capcut-clone-video-editor/hidden_files/round59-p3-fragment.json",
) as { vi: Dict; en: Dict };
const MERGED_VI = flatten(deepMerge(deepMerge(VI, FRAG.vi), P3FRAG.vi));
const MERGED_EN = flatten(deepMerge(deepMerge(EN, FRAG.en), P3FRAG.en));
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
type AnyRec = Record<string, unknown>;
function video(id: string, start: number, duration: number, extra: AnyRec = {}): AnyRec {
  return { kind: "video", id, start, duration, in: 0, out: duration, ...extra };
}
function nestedPlain(id: string, inner: unknown[], extra: AnyRec = {}): AnyRec {
  return {
    kind: "nested", id, start: 0, duration: 4, in: 0,
    tracks: [{ kind: "video", clips: inner }],
    ...extra,
  };
}
function track(id: string, clips: unknown[]): AnyRec {
  return { id, kind: "video", clips };
}
function specOf(...tracks: AnyRec[]): AnyRec {
  return { version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 }, tracks };
}
function specWithLayers(tracks: AnyRec[], layers: unknown[]): AnyRec {
  return { ...specOf(...tracks), adjustmentLayers: layers };
}
/** Layer chuẩn phủ toàn bộ 0..10s, track 0 — đủ để split gọi applyAdjustmentPreview. */
const BRIGHT_LAYER = {
  id: "adj1", start: 0, duration: 10,
  filters: [{ color: { brightness: 10 } }],
  tracks: [0],
};
const V5 = {
  keyframes: [
    { t: 0, v: 5, easing: "linear" },
    { t: 4, v: 5, easing: "linear" },
  ],
};

const O3_KEYS = [
  "preview.nestedSkippedBadge",
  "preview.nestedSkippedToast",
  "preview.effectSkippedBadge",
  "preview.effectSkippedToast",
];

console.log("== O3: surface flat.skipped / skippedReasons ra badge + toast preview ==");

// --- A. Fragment: parity + nội dung + merge-proof ----------------------
ok("fragment: 4 key mới, vi/en cùng tập key, khác nhau từng key, placeholder khớp", () => {
  assert.equal(FRAG_VI.size, 4, `fragment vi phải có 4 key, nhận ${FRAG_VI.size}`);
  assert.equal(FRAG_EN.size, 4, `fragment en phải có 4 key, nhận ${FRAG_EN.size}`);
  assert.deepEqual([...FRAG_VI.keys()].sort(), [...O3_KEYS].sort(), "fragment phải đúng 4 key O3");
  for (const k of FRAG_VI.keys()) {
    assert.ok(FRAG_EN.has(k), `en thiếu key ${k}`);
    const v = FRAG_VI.get(k)!;
    const e = FRAG_EN.get(k)!;
    assert.ok(v.length > 0 && e.length > 0, `${k} rỗng`);
    assert.notEqual(v, e, `${k}: vi phải khác en`);
    assert.deepEqual(
      [...placeholders(v)].sort(),
      [...placeholders(e)].sort(),
      `${k}: placeholder vi/en lệch`,
    );
  }
  for (const k of FRAG_EN.keys()) assert.ok(FRAG_VI.has(k), `vi thiếu key ${k}`);
});

ok("fragment: merge-proof — key chưa gộp thì vắng, đã gộp thì đúng giá trị fragment; không trùng fragment khác", () => {
  const realVi = flatten(VI);
  const realEn = flatten(EN);
  for (const k of FRAG_VI.keys()) {
    const dv = realVi.get(k);
    const de = realEn.get(k);
    assert.ok(
      dv === undefined || dv === FRAG_VI.get(k),
      `vi.json có key ${k} nhưng lệch giá trị fragment (pre-merge phải vắng)`,
    );
    assert.ok(
      de === undefined || de === FRAG_EN.get(k),
      `en.json có key ${k} nhưng lệch giá trị fragment (pre-merge phải vắng)`,
    );
  }
  for (const f of readdirSync("apps/web/src/i18n/fragments")) {
    if (f === "round58-o3.json") continue;
    const other = readJson(`apps/web/src/i18n/fragments/${f}`) as { vi: Dict; en: Dict };
    const otherKeys = new Set([...flatten(other.vi).keys(), ...flatten(other.en).keys()]);
    for (const k of FRAG_VI.keys()) {
      assert.ok(!otherKeys.has(k), `fragment ${f} đã có key ${k} — trùng!`);
    }
  }
});

// --- B. Đường nhanh: skipped từ flatten tới được failsoft -------------
ok("detailed/fast: nested duration 0 → skipped invalidNested, spec vẫn phẳng đúng", () => {
  const spec = specOf(track("v", [{ ...nestedPlain("bad", [video("x", 0, 1)]), duration: 0 }]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.warnings, [], "đường nhanh không có curve warning");
  assert.deepEqual(res.skipped, [`nested "bad" has invalid start/duration/in/speed, skipping`]);
  assert.deepEqual(res.skippedReasons, []);
  // Spec đầu ra: nested lỗi bị bỏ, không còn track __nested-video.
  const nestedTracks = (res.spec.tracks as unknown as AnyRec[]).filter((t) =>
    String(t.id).startsWith("__nested-"),
  );
  assert.equal(nestedTracks.length, 0, "nested lỗi phải vắng khỏi spec preview");
});

ok("detailed/fast: 2 clip tầng ngoài không nhận dạng → skipped dedupe còn 1", () => {
  const noId1 = { kind: "video", start: 0, duration: 1 };
  const noId2 = { kind: "video", start: 2, duration: 1 };
  // flattenForPreview thô vẫn giữ trùng (dedupe là việc của tầng detailed).
  assert.equal(flattenForPreview({ tracks: [{ kind: "video", clips: [noId1, noId2] }] }).skipped.length, 2);
  // Cần 1 nested lành để hasNestedOrAdjustment mở đường flatten (spec
  // chỉ có clip phẳng thì buildPreviewSpec trả object cũ, không flatten).
  const spec = specOf(track("v", [noId1, noId2, nestedPlain("n1", [video("leaf", 0, 1)])]));
  const res = buildPreviewSpecFailsoft(spec as never);
  assert.deepEqual(res.skipped, ["clip tầng ngoài không nhận dạng được, bỏ qua"]);
});

ok("detailed: .spec đồng nhất với buildPreviewSpec cũ (wrapper không đổi hành vi)", () => {
  const spec = specOf(
    track("v", [video("flat", 0, 4), nestedPlain("n1", [video("leaf", 0, 4)])]),
  );
  const detailed = buildPreviewSpecDetailed(spec as never, lookupEn);
  const legacy = buildPreviewSpec(spec as never, lookupEn);
  assert.equal(
    JSON.stringify(detailed.spec),
    JSON.stringify(legacy),
    "detailed.spec phải giống hệt buildPreviewSpec cũ",
  );
  assert.deepEqual(detailed.skipped, [], "spec lành không có skipped");
  assert.deepEqual(detailed.skippedReasons, []);
});

ok("detailed: spec không nested/adjustment → trả đúng object cũ, skipped rỗng", () => {
  const spec = specOf(track("v", [video("flat", 0, 4)]));
  const detailed = buildPreviewSpecDetailed(spec as never);
  assert.equal(detailed.spec, spec as never, "phải trả đúng object spec cũ (không copy)");
  assert.deepEqual(detailed.skipped, []);
  assert.deepEqual(detailed.skippedReasons, []);
  const res = buildPreviewSpecFailsoft(spec as never);
  assert.equal(res.spec, spec as never);
  assert.deepEqual(res.warnings, []);
  assert.deepEqual(res.skipped, []);
  assert.deepEqual(res.skippedReasons, []);
});

// --- C. skippedReasons: effect lạ + layer phủ → tới được failsoft -----
ok("detailed/fast: lá nested mang effect lạ + layer phủ → skippedReasons đúng chuỗi unknownEffectType", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specWithLayers([track("v", [nestedPlain("n1", [leaf])])], [BRIGHT_LAYER]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skipped, [], "không có skipped flatten");
  assert.deepEqual(res.skippedReasons, [`unknown type "weird-xyz", no draw path in preview`]);
  // Lá vẫn có trong spec preview (chỉ effect bị bỏ, không bỏ clip).
  const nestedTracks = (res.spec.tracks as unknown as AnyRec[]).filter((t) =>
    String(t.id).startsWith("__nested-"),
  );
  assert.equal(nestedTracks.length, 1, "phải có 1 track __nested-video");
  assert.equal((nestedTracks[0].clips as unknown[]).length, 1, "lá vẫn còn trong preview");
});

ok("detailed/fast: effect lạ mà KHÔNG có layer phủ → vẫn có skippedReasons (đợt 59 P3 đóng giới hạn cũ)", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [nestedPlain("n1", [leaf])]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [`unknown type "weird-xyz", no draw path in preview`]);
});

ok("detailed/fast: 2 lá cùng effect lạ → skippedReasons dedupe còn 1", () => {
  const leaf1 = video("l1", 0, 2, { effects: [{ type: "weird-xyz" }] });
  const leaf2 = video("l2", 2, 2, { effects: [{ type: "weird-xyz" }] });
  const spec = specWithLayers([track("v", [nestedPlain("n1", [leaf1, leaf2])])], [BRIGHT_LAYER]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [`unknown type "weird-xyz", no draw path in preview`]);
});

// --- D. Đường chậm: curve vi phạm + lá lỗi → warnings + skipped cùng có
ok("failsoft/slow: nested v=5 (về 1×) + clip con không id → warning linear-1x + skipped unknownNestedClip", () => {
  const bad = nestedPlain("BAD", [video("leaf", 0, 6), { kind: "video", start: 0, duration: 1 }], {
    speedKeyframes: V5,
  });
  const spec = specOf(track("v", [bad]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.equal(res.warnings.length, 1, `phải có 1 warning, nhận ${res.warnings.length}`);
  assert.equal(res.warnings[0].nestedId, "BAD");
  assert.equal(res.warnings[0].fallback, "linear-1x");
  assert.deepEqual(res.skipped, [`clip inside nested "BAD" is not recognized, skipping`]);
  // Lá lành vẫn hiện trong preview (fallback 1× giữ clip).
  const nestedTracks = (res.spec.tracks as unknown as AnyRec[]).filter((t) =>
    String(t.id).startsWith("__nested-"),
  );
  assert.equal(nestedTracks.length, 1, "phải có 1 track __nested-video sau fallback");
});

// --- E. Không lookup: fallback VI đúng từng chữ -------------------------
ok("fallback: không lookup → skipped/skippedReasons đúng từng chữ VI cũ", () => {
  const badSpec = specOf(track("v", [{ ...nestedPlain("bad", [video("x", 0, 1)]), duration: 0 }]));
  assert.deepEqual(buildPreviewSpecFailsoft(badSpec as never).skipped, [
    `nested "bad" có start/duration/in/speed không hợp lệ, bỏ qua`,
  ]);
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const effSpec = specWithLayers([track("v", [nestedPlain("n1", [leaf])])], [BRIGHT_LAYER]);
  assert.deepEqual(buildPreviewSpecFailsoft(effSpec as never).skippedReasons, [
    'type "weird-xyz" chưa biết, không có đường vẽ trong preview',
  ]);
});

// --- F. Wiring UI: preview.tsx đọc failsoft.skipped/skippedReasons -----
ok("wiring: preview.tsx gộp skipped/skippedReasons vào badge J1 + toast tóm tắt", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  for (const needle of [
    "failsoft.skipped",
    "failsoft.skippedReasons",
    "lastFailsoftSkippedKeyRef",
    "preview.nestedSkippedBadge",
    "preview.nestedSkippedToast",
    "preview.effectSkippedBadge",
    "preview.effectSkippedToast",
  ]) {
    assert.ok(src.includes(needle), `preview.tsx thiếu ${needle}`);
  }
  // Khối skipped nằm TRƯỚC lúc badge được ghi (cùng vòng lặp, cùng badge J1).
  const badgeWrite = src.indexOf("const badge = curveWarnBadgeRef.current");
  assert.ok(badgeWrite > 0, "không tìm thấy chỗ ghi badge curve");
  assert.ok(
    src.indexOf("preview.nestedSkippedBadge") < badgeWrite,
    "badge skipped phải được gộp trước khi ghi badge",
  );
  assert.ok(
    src.indexOf("preview.effectSkippedBadge") < badgeWrite,
    "badge effect phải được gộp trước khi ghi badge",
  );
  // Toast tóm tắt phải đi qua i18nT với key fragment (không ráp chuỗi
  // VI/EN trực tiếp tại call-site): kiểm tra đúng dạng gọi.
  assert.ok(
    src.includes('i18nT("preview.nestedSkippedToast"'),
    "toast nested phải gọi i18nT với key fragment",
  );
  assert.ok(
    src.includes('i18nT("preview.effectSkippedToast"'),
    "toast effect phải gọi i18nT với key fragment",
  );
});

// --- G. Lookup VI = fallback; EN dịch thật qua failsoft -----------------
ok("lookup: vi qua failsoft = fallback; en dịch thật cả skipped + skippedReasons", () => {
  const badSpec = specOf(track("v", [{ ...nestedPlain("bad", [video("x", 0, 1)]), duration: 0 }]));
  assert.deepEqual(buildPreviewSpecFailsoft(badSpec as never, lookupVi).skipped, [
    `nested "bad" có start/duration/in/speed không hợp lệ, bỏ qua`,
  ]);
  assert.deepEqual(buildPreviewSpecFailsoft(badSpec as never, lookupEn).skipped, [
    `nested "bad" has invalid start/duration/in/speed, skipping`,
  ]);
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const effSpec = specWithLayers([track("v", [nestedPlain("n1", [leaf])])], [BRIGHT_LAYER]);
  assert.deepEqual(buildPreviewSpecFailsoft(effSpec as never, lookupVi).skippedReasons, [
    `type "weird-xyz" chưa biết, không có đường vẽ trong preview`,
  ]);
  assert.deepEqual(buildPreviewSpecFailsoft(effSpec as never, lookupEn).skippedReasons, [
    `unknown type "weird-xyz", no draw path in preview`,
  ]);
});

console.log(`failsoft surface 58 O3: ${pass} pass`);
