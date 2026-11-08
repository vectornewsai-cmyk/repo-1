// skippedAttrib61R8.test.ts — Phase 9 đợt 61, luồng R8: đóng nợ đợt 60 §5.8 (Q6).
//   (a) attribution theo clip cho `skippedReasons`: badge spec-wide hiện
//       lý do cả khi playhead ngoài clip; nay lib trả thêm
//       `skippedReasonsByClip` (clipId + type + reason + cửa sổ trong
//       timeline spec preview đã phẳng) để badge chỉ hiện lý do của clip
//       đang ở frame hiện tại và đã vẽ được. MỞ RỘNG contract kiểu cộng
//       thêm: `skippedReasons: string[]` GIỮ NGUYÊN nội dung + ngữ nghĩa
//       (khóa O3/N4 không sửa, chạy lại nguyên vẹn) — field mới chỉ bổ sung.
//   (b) clip thiếu media (!item) vào `tickSkippedClipIds` (đảo quyết định
//       Q6 §5.2 "placeholder tính là đã vẽ": thiếu media = không vẽ được).
//   (c) stall decoder thật được đo bằng harness headed riêng (xem LIMITS R8),
//       không nằm trong file unit này.
//
// Chạy từ gốc repo (mẫu N4/O3/P3/Q6 — esbuild bundle rồi chạy node):
//   ./node_modules/.bin/esbuild apps/web/src/lib/skippedAttrib61R8.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round61-r8/r8.test.cjs
//   node /tmp/round61-r8/r8.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildPreviewSpecDetailed,
  buildPreviewSpecFailsoft,
  flatSpecSkippedAttributions,
  flatSpecSkippedReasons,
  visibleSkippedReasons,
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

// --- Dict thật + lookup mô phỏng t() -----------------------------------
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
const VI = readJson("apps/web/src/i18n/vi.json");
const EN = readJson("apps/web/src/i18n/en.json");
function flatten(d: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Dict, q, out);
    else out.set(q, v as string);
  }
  return out;
}
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
const lookupVi = lookupFrom(DICT_VI);
const lookupEn = lookupFrom(DICT_EN);

const NEW_EN = `unknown type "weird-xyz", no draw path in preview`;
const NEW_VI = `type "weird-xyz" chưa biết, không có đường vẽ trong preview`;
const HOLO_EN = `unknown type "hologram", no draw path in preview`;

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
function track(id: string, clips: unknown[], extra: AnyRec = {}): AnyRec {
  return { id, kind: "video", clips, ...extra };
}
function specOf(...tracks: AnyRec[]): AnyRec {
  return { version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 }, tracks };
}
function specWithLayers(tracks: AnyRec[], layers: unknown[]): AnyRec {
  return { ...specOf(...tracks), adjustmentLayers: layers };
}
/** Layer chuẩn phủ 1..2s, track 0 — chỉ phủ giữa clip để đo cửa sổ đoạn.
 *  Lưu ý schema chuẩn: `effects` phải nằm trong từng entry `filters`
 *  (convertCanonicalLayer không đọc `effects` top-level khi có `filters`). */
const MID_LAYER = {
  id: "adj-mid", start: 1, duration: 1,
  filters: [{ color: { brightness: 10 }, effects: [{ type: "weird-xyz" }] }],
  tracks: [0],
};
const V5 = {
  keyframes: [
    { t: 0, v: 5, easing: "linear" },
    { t: 4, v: 5, easing: "linear" },
  ],
};

console.log("== R8: skippedReasons attribution theo clip + clip thiếu media vào tickSkippedClipIds ==");

// --- A. Lib: attribution cho spec phẳng ---------------------------------
ok("attrib/flat: clip video effect lạ → skippedReasonsByClip đúng clipId/type/reason/cửa sổ", () => {
  const clip = video("c1", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  const detailed = buildPreviewSpecDetailed(spec as never, lookupEn);
  assert.equal(detailed.spec, spec as never, "phải trả đúng object spec cũ (không copy)");
  assert.deepEqual(detailed.skipped, []);
  // Contract cũ GIỮ NGUYÊN: skippedReasons vẫn [NEW_EN] (khóa O3/N4 không đổi).
  assert.deepEqual(detailed.skippedReasons, [NEW_EN]);
  assert.deepEqual(detailed.skippedReasonsByClip, [
    { clipId: "c1", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.equal(res.spec, spec as never);
  assert.deepEqual(res.warnings, []);
  assert.deepEqual(res.skipped, []);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "c1", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ]);
});

ok("attrib/flat: không lookup → reason VI; lookup vi → reason VI trong attribution", () => {
  const clip = video("c1", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  assert.deepEqual(buildPreviewSpecFailsoft(spec as never).skippedReasonsByClip, [
    { clipId: "c1", type: "weird-xyz", reason: NEW_VI, start: 0, duration: 4 },
  ]);
  assert.deepEqual(buildPreviewSpecFailsoft(spec as never, lookupVi).skippedReasonsByClip, [
    { clipId: "c1", type: "weird-xyz", reason: NEW_VI, start: 0, duration: 4 },
  ]);
});

ok("attrib/flat: 2 clip cùng effect → 2 entry (mỗi clip 1), skippedReasons vẫn dedupe 1", () => {
  const a = video("a", 0, 2, { effects: [{ type: "weird-xyz" }] });
  const b = video("b", 2, 2, { effects: [{ type: "weird-xyz" }] });
  const res = buildPreviewSpecFailsoft(specOf(track("v", [a, b])) as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN], "chuỗi lý do vẫn dedupe");
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "a", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 2 },
    { clipId: "b", type: "weird-xyz", reason: NEW_EN, start: 2, duration: 2 },
  ]);
});

ok("attrib/flat: 1 clip 2 type lạ → 2 entry giữ thứ tự; effect chuẩn → []", () => {
  const c = video("c", 0, 2, { effects: [{ type: "weird-xyz" }, { type: "hologram" }] });
  assert.deepEqual(
    buildPreviewSpecFailsoft(specOf(track("v", [c])) as never, lookupEn).skippedReasonsByClip,
    [
      { clipId: "c", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 2 },
      { clipId: "c", type: "hologram", reason: HOLO_EN, start: 0, duration: 2 },
    ],
  );
  const plain = video("p", 0, 4, { effects: [{ type: "blur" }, { type: "sharpen" }] });
  const res = buildPreviewSpecFailsoft(specOf(track("v", [plain])) as never, lookupEn);
  assert.deepEqual(res.skippedReasons, []);
  assert.deepEqual(res.skippedReasonsByClip, []);
});

ok("attrib/flat: clip phẳng không effect → skippedReasonsByClip [] (khóa O3 §B' giữ nguyên)", () => {
  const plain = specOf(track("v", [video("flat", 0, 4)]));
  const detailed = buildPreviewSpecDetailed(plain as never);
  assert.equal(detailed.spec, plain as never, "phải trả đúng object spec cũ");
  assert.deepEqual(detailed.skipped, []);
  assert.deepEqual(detailed.skippedReasons, []);
  assert.deepEqual(detailed.skippedReasonsByClip, []);
  const res = buildPreviewSpecFailsoft(plain as never);
  assert.deepEqual(res.skippedReasons, []);
  assert.deepEqual(res.skippedReasonsByClip, []);
});

ok("attrib/flat: flatSpecSkippedAttributions trực tiếp == detailed.skippedReasonsByClip; reasons của nó == flatSpecSkippedReasons", () => {
  const clip = video("c1", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [clip]));
  const att = flatSpecSkippedAttributions(spec as never, lookupEn);
  assert.deepEqual(att, [{ clipId: "c1", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 }]);
  assert.deepEqual(
    att.map((a) => a.reason),
    flatSpecSkippedReasons(spec as never, lookupEn),
  );
  assert.deepEqual(
    att,
    buildPreviewSpecDetailed(spec as never, lookupEn).skippedReasonsByClip,
  );
});

ok("attrib/flat: clip thiếu id / duration 0 → không attribution, không crash", () => {
  const noId = { kind: "video", start: 0, duration: 4, effects: [{ type: "weird-xyz" }] };
  const res = buildPreviewSpecFailsoft(specOf(track("v", [noId])) as never, lookupEn);
  assert.deepEqual(res.skippedReasons, []);
  assert.deepEqual(res.skippedReasonsByClip, []);
  const zeroDur = video("z", 0, 0, { effects: [{ type: "weird-xyz" }] });
  const res2 = buildPreviewSpecFailsoft(specOf(track("v", [zeroDur])) as never, lookupEn);
  assert.deepEqual(res2.skippedReasons, []);
  assert.deepEqual(res2.skippedReasonsByClip, []);
});

// --- B. Lib: attribution qua đường flatten (nested / layer) -------------
ok("attrib/nested: lá nested effect lạ + layer phủ → attribution clipId = key instance n1/leaf, cửa sổ lá đã phẳng", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const BRIGHT = { id: "adj1", start: 0, duration: 10, filters: [{ color: { brightness: 10 } }], tracks: [0] };
  const spec = specWithLayers([track("v", [nestedPlain("n1", [leaf])])], [BRIGHT]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN], "chuỗi lý do cũ không đổi");
  // Đợt 62 R6: clipId nay là key INSTANCE "n1/leaf" (đóng nợ R8 §5.5) —
  // chuỗi skippedReasons vẫn [NEW_EN] (contract O3/N4 không đổi).
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "n1/leaf", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ]);
});

ok("attrib/nested: lá nested effect lạ, KHÔNG layer → vẫn có attribution (đường P3), clipId = n1/leaf", () => {
  const leaf = video("leaf", 0, 4, { effects: [{ type: "weird-xyz" }] });
  const spec = specOf(track("v", [nestedPlain("n1", [leaf])]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "n1/leaf", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ]);
});

ok("attrib/nested: layer mang effect lạ chỉ phủ giữa clip → attribution chỉ cửa sổ đoạn phủ", () => {
  // Clip phẳng 0..4 mang effect chuẩn (không skip); layer 1..2 mang
  // weird-xyz nên chỉ đoạn 1..2 mới skip — attribution phải là cửa sổ
  // đoạn (1, 1), không phải cả clip (0, 4).
  const clip = video("c1", 0, 4, { effects: [{ type: "blur" }] });
  const spec = specWithLayers([track("v", [clip])], [MID_LAYER]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "c1", type: "weird-xyz", reason: NEW_EN, start: 1, duration: 1 },
  ]);
});

ok("attrib/nested: 2 lá cùng effect lạ → 2 entry, skippedReasons dedupe 1", () => {
  const leaf1 = video("l1", 0, 2, { effects: [{ type: "weird-xyz" }] });
  const leaf2 = video("l2", 2, 2, { effects: [{ type: "weird-xyz" }] });
  const BRIGHT = { id: "adj1", start: 0, duration: 10, filters: [{ color: { brightness: 10 } }], tracks: [0] };
  const spec = specWithLayers([track("v", [nestedPlain("n1", [leaf1, leaf2])])], [BRIGHT]);
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
  // Đợt 62 R6: 2 lá trong cùng nested n1 → key instance n1/l1, n1/l2.
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "n1/l1", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 2 },
    { clipId: "n1/l2", type: "weird-xyz", reason: NEW_EN, start: 2, duration: 2 },
  ]);
});

ok("attrib/failsoft-slow: nested v=5 (về 1×) + lá effect lạ → warning + attribution vẫn có", () => {
  const bad = nestedPlain("BAD", [video("leaf", 0, 6, { effects: [{ type: "weird-xyz" }] })], {
    speedKeyframes: V5,
  });
  const spec = specOf(track("v", [bad]));
  const res = buildPreviewSpecFailsoft(spec as never, lookupEn);
  assert.equal(res.warnings.length, 1, `phải có 1 warning, nhận ${res.warnings.length}`);
  assert.equal(res.warnings[0].fallback, "linear-1x");
  assert.deepEqual(res.skippedReasons, [NEW_EN]);
  // Lá 0..6 bị host nested 0..4 kẹp còn 0..4 trong timeline đã phẳng —
  // cửa sổ attribution là cửa sổ thật sau flatten, không phải duration gốc.
  // Đợt 62 R6: clipId = key instance "BAD/leaf" (nested id BAD + leaf id).
  assert.deepEqual(res.skippedReasonsByClip, [
    { clipId: "BAD/leaf", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ]);
});

// --- C. Helper lọc cho badge: visibleSkippedReasons ----------------------
ok("visible: chỉ lý do của clip chứa playhead (nửa mở [start, start+duration))", () => {
  const att = [
    { clipId: "a", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 2 },
    { clipId: "b", type: "hologram", reason: HOLO_EN, start: 2, duration: 2 },
  ];
  assert.deepEqual(visibleSkippedReasons(att, 1), [NEW_EN]);
  assert.deepEqual(visibleSkippedReasons(att, 2), [HOLO_EN], "t=2 thuộc clip b (nửa mở)");
  assert.deepEqual(visibleSkippedReasons(att, 5), [], "ngoài mọi clip → rỗng (đổi so với badge spec-wide cũ)");
  assert.deepEqual(visibleSkippedReasons(att, 0), [NEW_EN], "t=start vẫn tính");
  assert.deepEqual(visibleSkippedReasons(att, 3.999), [HOLO_EN]);
});

ok("visible: clip trong notDrawnClipIds bị loại (decoder tụt / thiếu media)", () => {
  const att = [
    { clipId: "a", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ];
  assert.deepEqual(visibleSkippedReasons(att, 1, new Set(["a"])), []);
  assert.deepEqual(visibleSkippedReasons(att, 1, new Set()), [NEW_EN]);
  assert.deepEqual(visibleSkippedReasons(att, 1), [NEW_EN], "không opts → hành vi cũ");
  assert.deepEqual(visibleSkippedReasons(att, 1, new Set(["zzz"])), [NEW_EN]);
});

ok("visible: cùng reason từ 2 clip, 1 clip tụt → reason vẫn hiện (clip còn lại vẽ được)", () => {
  const att = [
    { clipId: "a", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
    { clipId: "b", type: "weird-xyz", reason: NEW_EN, start: 0, duration: 4 },
  ];
  assert.deepEqual(visibleSkippedReasons(att, 1, new Set(["a"])), [NEW_EN]);
  assert.deepEqual(visibleSkippedReasons(att, 1, new Set(["a", "b"])), []);
});

ok("visible: attributions rỗng/undefined → [] (phòng thủ, không crash)", () => {
  assert.deepEqual(visibleSkippedReasons([], 1), []);
  assert.deepEqual(visibleSkippedReasons(undefined, 1), []);
});

// --- D. Wiring UI: badge lọc theo clip + !item vào tickSkippedClipIds ----
ok("wiring: preview.tsx badge dùng skippedReasonsByClip + visibleSkippedReasons, toast giữ key spec-wide", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  for (const needle of [
    "failsoftSkippedReasonsByClip",
    "failsoft.skippedReasonsByClip",
    "visibleSkippedReasons(",
    "badgeEffectReasons",
  ]) {
    assert.ok(src.includes(needle), `preview.tsx thiếu ${needle}`);
  }
  // Badge effect hiển thị tập đã lọc theo frame (badgeEffectReasons),
  // còn toast/key vẫn dùng tập spec-wide (effectReasons) để không spam khi scrub.
  assert.ok(src.includes("preview.effectSkippedBadge\", { n: String(badgeEffectReasons.length) })"), "badge phải đếm badgeEffectReasons");
  assert.ok(src.includes("preview.effectSkippedToast\", {"), "toast effect phải còn");
  assert.ok(src.includes("const effectReasons = [...failsoftSkippedReasons, ...frameReasons];"), "toast/key vẫn dùng effectReasons spec-wide");
});

ok("wiring: drawVideoClip !item (thiếu media) ghi tickSkippedClipIds; comment Q6 cũ đã đính chính", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  // Nhánh !item của drawVideoClip (nhận dạng bằng placeholder fill #1a2030).
  const phIdx = src.indexOf('ctx.fillStyle = "#1a2030";');
  assert.ok(phIdx > 0, "không tìm thấy nhánh !item của drawVideoClip");
  const branchStart = src.lastIndexOf("if (!item) {", phIdx);
  assert.ok(branchStart > 0, "không tìm thấy if (!item) của drawVideoClip");
  const seg = src.slice(branchStart, phIdx);
  // Đợt 62 R6: ghi key INSTANCE (previewClipInstanceKey) thay cho leaf
  // id trần — 2 instance nested cùng leaf id không lẫn nhau (R8 §5.5).
  assert.ok(seg.includes("tickSkippedClipIds.add(previewClipInstanceKey(clip));"), "!item phải ghi tickSkippedClipIds trước khi vẽ placeholder");
  assert.ok(!src.includes("Clip thiếu media (!item) KHÔNG"), "comment Q6 cũ 'KHÔNG vào đây' phải được đính chính");
});

ok("wiring: drawImageClip thiếu media cũng ghi tickSkippedClipIds", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  const imgIdx = src.indexOf('if (!item || item.kind !== "image") {');
  assert.ok(imgIdx > 0, "không tìm thấy guard !item của drawImageClip");
  const seg = src.slice(imgIdx, imgIdx + 250);
  // Đợt 62 R6: ghi key INSTANCE như drawVideoClip (xem trên).
  assert.ok(seg.includes("tickSkippedClipIds.add(previewClipInstanceKey(clip));"), "drawImageClip thiếu media phải ghi tickSkippedClipIds");
  assert.ok(seg.includes("return;"), "guard drawImageClip vẫn return sau khi ghi");
});

ok("wiring: nestedPreview.ts trả skippedReasonsByClip ở cả early-return, đường nhanh và đường chậm", () => {
  const src = readFileSync("apps/web/src/lib/nestedPreview.ts", "utf8");
  assert.ok(src.includes("export interface SkippedReasonAttribution"), "thiếu type SkippedReasonAttribution");
  assert.ok(src.includes("skippedReasonsByClip: SkippedReasonAttribution[]"), "interface result thiếu field skippedReasonsByClip");
  assert.ok(src.includes("export function visibleSkippedReasons"), "thiếu export visibleSkippedReasons");
  assert.ok(src.includes("export function flatSpecSkippedAttributions"), "thiếu export flatSpecSkippedAttributions");
  const uses = src.split("skippedReasonsByClip: flatSpecSkippedAttributions(spec, lookup)").length - 1;
  assert.ok(uses >= 2, `early-return phải set attribution ở cả detailed + failsoft, nhận ${uses}`);
  assert.ok(src.includes("skippedReasonsByClip: detailed.skippedReasonsByClip"), "đường nhanh failsoft phải truyền attribution của detailed");
});

console.log(`skipped attrib 61 R8: ${pass} pass`);
