// skippedReasons59P3.test.ts — Phase 9 đợt 59, luồng P3: đóng nợ đợt 58 §6.3 (O3).
//   (a) `skippedReasons` chỉ sinh khi có layer adjustment — mở rộng để effect
//       bị skip cũng sinh lý do, và lý do phải nêu TÊN TYPE của effect (key N4
//       `nested.failsoft.unknownEffectType` thiếu biến `{type}`).
//   (b) Đường vẽ từng frame vẫn chỉ console.warn — đưa lý do skip ra UI
//       (badge thường trực dưới preview + toast keyed, cùng cơ chế O3).
// Phạm vi:
//   - lib: `skippedEffectReason` truyền `{type}` cho trKey; `splitClipByAdjustments`
//     thu skippedReasons cả khi không có layer nào áp (early-return cũ bỏ qua).
//   - UI: preview.tsx ghi effect bị skip của frame vừa vẽ vào `tickSkippedEffects`
//     (pattern tickHadHold), hợp nhất với failsoft.skippedReasons thành 1 dòng
//     badge + 1 toast effect (không đếm trùng).
//   - i18n: giá trị MỚI của `nested.failsoft.unknownEffectType` (có `{type}`)
//     nằm trong fragment ~/workspace/goals/capcut-clone-video-editor/hidden_files/
//     round59-p3-fragment.json — parent gộp vào vi.json/en.json cuối đợt (ghi đè
//     key cũ, có kiểm chứng). KHÔNG sửa trực tiếp vi/en.json trong luồng này.
//     Test này đọc fragment đó (đường dẫn tương đối từ gốc repo) để build lookup,
//     nên xanh cả trước và sau khi parent gộp (merge-proof, mẫu O3 §A).
//
// Chạy từ gốc repo (mẫu N4/O3 — esbuild bundle rồi chạy node):
//   ./node_modules/.bin/esbuild apps/web/src/lib/skippedReasons59P3.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round59-p3/p3.test.cjs
//   node /tmp/round59-p3/p3.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyAdjustmentPreview,
  buildPreviewSpecFailsoft,
  skippedEffectReason,
} from "./nestedPreview";
import { effectsVisual, frameSkippedEffectTypes } from "./previewEngine";

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

// --- Dict thật + fragment P3 + lookup mô phỏng t() ----------------------
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
const VI = readJson("apps/web/src/i18n/vi.json");
const EN = readJson("apps/web/src/i18n/en.json");
// Fragment P3 nằm ngoài repo (hidden_files của goal), parent gộp cuối đợt.
const P3FRAG = readJson(
  "../goals/capcut-clone-video-editor/hidden_files/round59-p3-fragment.json",
) as { vi: Dict; en: Dict };
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
const P3_VI = flatten(P3FRAG.vi);
const P3_EN = flatten(P3FRAG.en);
const P3_MERGED_VI = flatten(deepMerge(VI, P3FRAG.vi));
const P3_MERGED_EN = flatten(deepMerge(EN, P3FRAG.en));
const DICT_VI = flatten(VI);
const DICT_EN = flatten(EN);
type Lookup = (key: string, vars?: Record<string, string>) => string;
function lookupFrom(map: Map<string, string>): Lookup {
  return (key: string, vars?: Record<string, string>): string => {
    const raw = map.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
// Lookup sau khi gộp fragment P3 (xanh cả pre-merge lẫn post-merge).
const lookupP3Vi = lookupFrom(P3_MERGED_VI);
const lookupP3En = lookupFrom(P3_MERGED_EN);
// Lookup chỉ từ dict hiện tại (pre-merge: giá trị cũ, chưa có {type}).
const lookupDictEn = lookupFrom(DICT_EN);
const lookupDictVi = lookupFrom(DICT_VI);

const KEY = "nested.failsoft.unknownEffectType";
const NEW_EN = `unknown type "weird-xyz", no draw path in preview`;
const NEW_VI = `type "weird-xyz" chưa biết, không có đường vẽ trong preview`;
const OLD_EN = "unknown type, no draw path in preview";
const OLD_VI = "type chưa biết, không có đường vẽ trong preview";

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
/** Layer chuẩn phủ toàn bộ nhưng chỉ scope track 1 — clip ở track 0 không bị áp. */
const BRIGHT_LAYER_TRACK1 = {
  id: "adj1", start: 0, duration: 10,
  filters: [{ color: { brightness: 10 } }],
  tracks: [1],
};
const V5 = {
  keyframes: [
    { t: 0, v: 5, easing: "linear" },
    { t: 4, v: 5, easing: "linear" },
  ],
};

console.log("== P3: skippedReasons nêu tên type + thu cả khi không có layer; frame skip ra UI ==");

// --- A. Fragment P3: 1 key, placeholder {type} khớp vi/en --------------
ok("fragment: đúng 1 key unknownEffectType, vi/en đều có {type}, khác nhau", () => {
  assert.equal(P3_VI.size, 1, `fragment vi phải có 1 key, nhận ${P3_VI.size}`);
  assert.equal(P3_EN.size, 1, `fragment en phải có 1 key, nhận ${P3_EN.size}`);
  assert.ok(P3_VI.has(KEY), `fragment vi thiếu ${KEY}`);
  assert.ok(P3_EN.has(KEY), `fragment en thiếu ${KEY}`);
  assert.deepEqual([...placeholders(P3_VI.get(KEY)!)].sort(), ["type"], "vi phải có đúng {type}");
  assert.deepEqual([...placeholders(P3_EN.get(KEY)!)].sort(), ["type"], "en phải có đúng {type}");
  assert.notEqual(P3_VI.get(KEY), P3_EN.get(KEY), "vi phải khác en");
  // Merge-proof (mẫu O3 §A): dict hiện tại hoặc là giá trị cũ (pre-merge)
  // hoặc đã bằng fragment (post-merge); không được là chuỗi thứ ba.
  assert.ok(
    DICT_VI.get(KEY) === OLD_VI || DICT_VI.get(KEY) === P3_VI.get(KEY),
    `vi.json lệch: ${KEY} = ${DICT_VI.get(KEY)}`,
  );
  assert.ok(
    DICT_EN.get(KEY) === OLD_EN || DICT_EN.get(KEY) === P3_EN.get(KEY),
    `en.json lệch: ${KEY} = ${DICT_EN.get(KEY)}`,
  );
});

// --- B. skippedEffectReason nêu tên type --------------------------------
ok("reason: lookup đã gộp fragment → nêu đúng tên type (vi + en)", () => {
  assert.equal(skippedEffectReason("weird-xyz", lookupP3En), NEW_EN);
  assert.equal(skippedEffectReason("weird-xyz", lookupP3Vi), NEW_VI);
  // Type khác cũng nêu tên (không hardcode 1 type).
  assert.equal(
    skippedEffectReason("hologram", lookupP3En),
    `unknown type "hologram", no draw path in preview`,
  );
});

ok("reason: lookup từ dict đã gộp (parent gộp fragment P3 cuối đợt 59) → chuỗi mới nêu tên", () => {
  // Dict trên đĩa nay đã có placeholder {type} nên lookup thẳng dict cũng
  // nêu tên type (trước gộp thì trả chuỗi cũ — xem lịch sử test đợt 59 P3).
  assert.equal(skippedEffectReason("weird-xyz", lookupDictEn), NEW_EN);
  assert.equal(skippedEffectReason("weird-xyz", lookupDictVi), NEW_VI);
});

ok("reason: không lookup → fallback VI mới nêu tên type (parent gộp đợt 59 đổi fallback theo khuyến nghị P3 §5.1 #2)", () => {
  assert.equal(skippedEffectReason("weird-xyz"), NEW_VI);
});

// --- C. Thu skippedReasons cả khi không có layer phủ --------------------
ok("detailed/fast: lá nested mang effect lạ, KHÔNG layer → vẫn có skippedReasons nêu tên", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [nestedPlain("n1", [leaf])]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupP3En);
  assert.deepEqual(res.skipped, [], "không có skipped flatten");
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
  // Lá vẫn có trong spec preview (chỉ effect bị bỏ, không bỏ clip).
  const nestedTracks = (res.spec.tracks as unknown as AnyRec[]).filter((t) =>
    String(t.id).startsWith("__nested-"),
  );
  assert.equal(nestedTracks.length, 1, "phải có 1 track __nested-video");
  assert.equal((nestedTracks[0].clips as unknown[]).length, 1, "lá vẫn còn trong preview");
});

ok("detailed/fast: layer có nhưng scope không áp clip → vẫn thu skippedReasons", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specWithLayers(
    [track("v", [nestedPlain("n1", [leaf])]), track("v2", [])],
    [BRIGHT_LAYER_TRACK1],
  );
  const res = buildPreviewSpecFailsoft(spec as never, lookupP3En);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

ok("detailed/fast: 2 lá cùng effect lạ, không layer → skippedReasons dedupe còn 1", () => {
  const leaf1 = video("l1", 0, 2, { effects: [{ type: "weird-xyz" }] });
  const leaf2 = video("l2", 2, 2, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [nestedPlain("n1", [leaf1, leaf2])]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupP3En);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

ok("detailed/fast: lá mang effect lạ + layer phủ → vẫn đúng như O3 (hồi quy)", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specWithLayers([track("v", [nestedPlain("n1", [leaf])])], [BRIGHT_LAYER]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupP3En);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

ok("detailed/fast: clip tầng ngoài effect lạ, có layer scope ngoài → thu lý do", () => {
  const clip = video("flat", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specWithLayers([track("v", [clip]), track("v2", [])], [BRIGHT_LAYER_TRACK1]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupP3En);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

ok("failsoft/slow: nested v=5 (về 1×) + lá effect lạ không layer → warning + skippedReasons", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const bad = nestedPlain("BAD", [leaf], { speedKeyframes: V5 });
  const spec = specOf(track("v", [bad]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupP3En);
  assert.equal(res.warnings.length, 1, `phải có 1 warning, nhận ${res.warnings.length}`);
  assert.equal(res.warnings[0].fallback, "linear-1x");
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

ok("boundary: spec phẳng không nested/adjustment → skippedReasons tầng lib nay CÓ (đợt 60 Q6 đóng nợ P3 §5.3)", () => {
  // Đợt 60 Q6: `buildPreviewSpecDetailed`/`Failsoft` giữ early-return +
  // identity object cũ (khóa O3 §B' vẫn xanh — fixture của nó không có
  // effect lạ), nhưng early-return nay gọi `flatSpecSkippedReasons` nên
  // spec phẳng mang effect lạ cũng có skippedReasons ở tầng lib, không
  // còn chỉ nhờ đường frame (§D/E) như trước.
  const clip = video("flat", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupP3En);
  assert.equal(res.spec, spec as never, "phải trả đúng object spec cũ");
  assert.deepEqual(res.skipped, [], "spec phẳng không có skipped flatten");
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
});

ok("lib: applyAdjustmentPreview không layer vẫn báo skip + nêu tên", () => {
  const f = applyAdjustmentPreview(
    { effects: [{ type: "weird-xyz" }] },
    [],
    2,
    { nestedPath: [], trackStack: [0] },
    lookupP3En,
  );
  assert.deepEqual(f.skippedEffects, ["weird-xyz"]);
  assert.deepEqual(f.skippedReasons, [NEW_EN]);
  assert.equal(f.adjustmentActive, false, "không layer thì adjustmentActive false");
});

// --- D. Wiring UI: lý do skip của frame hiện tại ra badge + toast (cùng badge O3) --
ok("wiring: preview.tsx hợp nhất frame-skipped với failsoft.skippedReasons vào 1 badge/toast", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  for (const needle of [
    // Helper thuần tính effect bị skip ở frame hiện tại (previewEngine).
    "frameSkippedEffectTypes",
    // Lý do có tên type để vẽ badge/toast (cùng lookup i18nT).
    "skippedEffectReason",
    // Hợp nhất 2 nguồn lý do thành 1 tập (không đếm trùng cùng type).
    "effectReasons",
    "failsoft.skippedReasons",
    "lastFailsoftSkippedKeyRef",
    "preview.effectSkippedBadge",
    "preview.effectSkippedToast",
  ]) {
    assert.ok(src.includes(needle), `preview.tsx thiếu ${needle}`);
  }
  // Khối hợp nhất nằm TRƯỚC lúc badge được ghi (cùng vòng lặp, cùng badge J1).
  const badgeWrite = src.indexOf("const badge = curveWarnBadgeRef.current");
  assert.ok(badgeWrite > 0, "không tìm thấy chỗ ghi badge curve");
  assert.ok(
    src.indexOf("effectReasons") < badgeWrite,
    "effectReasons phải được gộp trước khi ghi badge",
  );
  // Toast effect phải đi qua i18nT với key fragment O3 (không ráp chuỗi trực tiếp).
  assert.ok(
    src.includes('i18nT("preview.effectSkippedToast"'),
    "toast effect phải gọi i18nT với key fragment",
  );
  // Đường vẽ từng frame vẫn giữ console.warn (kênh debug song song với badge).
  assert.ok(src.includes("warnSkippedEffects"), "preview.tsx phải giữ warnSkippedEffects");
});

// --- E. Helper frame thuần (previewEngine) --------------------------------
ok("engine: effectsVisual chỉ skip type lạ, type chuẩn không vào skipped", () => {
  assert.deepEqual(effectsVisual([{ type: "weird-xyz" } as never]).skipped, ["weird-xyz"]);
  assert.deepEqual(effectsVisual([{ type: "blur" } as never]).skipped, []);
  // 8 type canvas cũng không vào skipped (được vẽ thật bằng effectCanvas).
  assert.deepEqual(effectsVisual([{ type: "sharpen" } as never]).skipped, []);
  assert.deepEqual(effectsVisual([{ type: "glitch" } as never]).skipped, []);
});

ok("engine: frameSkippedEffectTypes chỉ lấy video clip đang hiện, dedupe", () => {
  const weird = (id: string, start: number, duration: number): AnyRec =>
    video(id, start, duration, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [weird("a", 0, 2), weird("b", 2, 2), video("c", 4, 2, { effects: [{ type: "blur" }] })]));
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 1), ["weird-xyz"]);
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 3), ["weird-xyz"]);
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 5), [], "clip blur không skip");
  assert.deepEqual(frameSkippedEffectTypes(spec as never, 8), [], "ngoài mọi clip → rỗng");
  // 2 clip cùng effect ở 2 thời điểm khác nhau không gộp chéo thời gian.
  const two = specOf(track("v", [weird("a", 0, 2), video("x", 0, 2, { effects: [{ type: "hologram" }] })]));
  assert.deepEqual(
    frameSkippedEffectTypes(two as never, 1).sort(),
    ["hologram", "weird-xyz"],
    "cùng frame, 2 type lạ khác nhau đều liệt kê",
  );
});

ok("engine: frameSkippedEffectTypes bỏ track hidden / track không phải video", () => {
  const weird = video("a", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const hidden = { ...track("v", [weird]), hidden: true };
  assert.deepEqual(frameSkippedEffectTypes(specOf(hidden) as never, 1), []);
  const textTrack = { id: "t", kind: "text", clips: [{ kind: "text", id: "tx", start: 0, duration: 4, text: "hi" }] };
  assert.deepEqual(frameSkippedEffectTypes(specOf(textTrack) as never, 1), []);
});

console.log(`skipped reasons 59 P3: ${pass} pass`);
