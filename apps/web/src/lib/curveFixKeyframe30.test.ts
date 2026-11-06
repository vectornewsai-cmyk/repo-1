/**
 * curveFixKeyframe30.test.ts — Test khóa đợt 30 luồng M4: sửa mức
 * KEYFRAME đơn lẻ + dịch nốt (banner ExportPanel / toast ProjectMenu /
 * chuỗi errorDetail L3) + parity i18n vi=en.
 *
 * Chỉ test các hàm thuần (Node type-stripping, từ gốc repo):
 *   node apps/web/src/lib/curveFixKeyframe30.test.ts
 *
 * Phạm vi test:
 * - sanitizeOneKeyframeCurve: chỉ keyframe đích đổi (giá trị hoặc bị
 *   loại), keyframe khác giữ nguyên CẢ GIÁ TRỊ LẪN THAM CHIẾU; các
 *   luật cục bộ (clamp v/t, easing/bezier, loại kf xấu, đơn điệu,
 *   vượt 128, keyframe duy nhất phải loại → không cứu được).
 * - sanitizeOneKeyframe (mức spec): chỉ clip đích đổi, clip khác giữ
 *   nguyên tham chiếu; nested; track khóa → skippedLocked; path lạ /
 *   index ngoài mảng → không đổi.
 * - i18n: dict vi/en flatten phải KHỚP TOÀN BỘ key (0 key mồ côi cả
 *   hai chiều), 11 key mới đợt 30 có mặt cả hai bên, changeItems của
 *   sửa mức keyframe dịch được vi/en (en không rò key thô, không rò
 *   tiếng Việt), tóm tắt đã dịch vi khớp từng chữ hàm cũ.
 * - Chuỗi App mức keyframe: sửa kf0 của clip 2 kf vi phạm → quét lại
 *   chỉ còn warning kf1 (panel còn đúng dòng đó).
 *
 * Không test render React (App handler, panel, ExportPanel, ProjectMenu
 * — không chạy được bằng Node, như mọi đợt trước): wiring của chúng
 * được khóa bằng tsc 0 lỗi + vite build pass + click-test browser
 * thật (scripts/clicktest-m4-round30-pipe.mjs).
 */
import { readFileSync } from "node:fs";
import {
  formatSanitizeSummary,
  formatSanitizeSummaryLocalized,
  sanitizeOneKeyframe,
  sanitizeOneKeyframeCurve,
} from "./curveFix.ts";
import { collectSpeedCurveWarnings } from "./projectRepo.ts";
import { formatWarningTranslated } from "./loadReport.ts";

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

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq(a: unknown, b: unknown, msg: string): void {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg} — nhận: ${JSON.stringify(a)}, muốn: ${JSON.stringify(b)}`);
  }
}

function kf(t: number, v: number, easing = "linear", extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { t, v, easing, ...extra };
}

function curve(kfs: unknown[]): Record<string, unknown> {
  return { keyframes: kfs };
}

function videoClip(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "video", id, src: `${id}.mp4`, start: 0, duration: 10, in: 0, out: 10, ...extra };
}

function specOf(tracks: Record<string, unknown>[]): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}

function track(id: string, clips: Record<string, unknown>[], extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { id, kind: "video", clips, ...extra };
}

// ---- i18n: đọc dict thật ----

function flatten(obj: unknown, prefix: string, out: Map<string, string>): void {
  if (typeof obj !== "object" || obj === null) return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else flatten(v, key, out);
  }
}

const viDict = new Map<string, string>();
const enDict = new Map<string, string>();
flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as unknown, "", viDict);
flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as unknown, "", enDict);

function makeLookup(dict: Map<string, string>, fallback: Map<string, string>) {
  return (key: string, vars?: Record<string, string>): string => {
    const raw = dict.get(key) ?? fallback.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
const tVi = makeLookup(viDict, viDict);
const tEn = makeLookup(enDict, viDict);

// ---- sanitizeOneKeyframeCurve: chỉ keyframe đích đổi ----

test("kf-level: clamp v của kf đích, kf khác giữ nguyên tham chiếu", () => {
  const k0 = kf(0, 5);
  const k1 = kf(5, 1);
  const c = curve([k0, k1]);
  const r = sanitizeOneKeyframeCurve(c, 10, 0);
  assert(r.changed === true, "phải đổi");
  assert(r.curve !== null, "phải cứu được");
  const out = r.curve["keyframes"] as unknown[];
  eq(out.length, 2, "đủ 2 kf");
  eq((out[0] as Record<string, unknown>)["v"], 4, "kf0 v 5→4");
  assert(out[1] === k1, "kf1 giữ nguyên tham chiếu (không đụng tới)");
  assert(r.curve !== c, "curve mới là object mới");
  eq(r.changes.length, r.changeItems.length, "changeItems song song changes");
  assert(r.changeItems[0].key === "curveFix.changeClampVHigh", "key clamp v cao");
});

test("kf-level: kf đã hợp lệ → không đổi, trả đúng tham chiếu curve cũ", () => {
  const c = curve([kf(0, 1), kf(5, 2)]);
  const r = sanitizeOneKeyframeCurve(c, 10, 1);
  assert(r.changed === false, "không đổi");
  assert(r.curve === c, "trả đúng tham chiếu cũ");
});

test("kf-level: loại kf có t xấu, kf còn lại giữ nguyên tham chiếu", () => {
  const k0 = kf(0, 1);
  const bad = { t: "x", v: 1, easing: "linear" };
  const k2 = kf(5, 2);
  const r = sanitizeOneKeyframeCurve(curve([k0, bad, k2]), 10, 1);
  assert(r.changed === true, "phải đổi");
  const out = (r.curve as Record<string, unknown>)["keyframes"] as unknown[];
  eq(out.length, 2, "còn 2 kf");
  assert(out[0] === k0 && out[1] === k2, "hai kf còn lại giữ nguyên tham chiếu");
  assert(r.changeItems[0].key === "curveFix.changeDropBadT", "key drop bad t");
});

test("kf-level: đơn điệu — chỉ kf sau bị loại, kf trước ở nguyên", () => {
  const k0 = kf(0, 1);
  const k1 = kf(5, 2);
  const k2 = kf(5, 3); // t bằng kf trước → vi phạm đơn điệu ở kf2
  const r = sanitizeOneKeyframeCurve(curve([k0, k1, k2]), 10, 2);
  assert(r.changed === true, "phải đổi");
  const out = (r.curve as Record<string, unknown>)["keyframes"] as unknown[];
  eq(out.length, 2, "còn 2 kf");
  assert(out[0] === k0 && out[1] === k1, "kf trước giữ nguyên tham chiếu");
  assert(r.changeItems[0].key === "curveFix.changeMonotone", "key monotone");
  assert(r.changes.length === 1, "chỉ báo đúng một thay đổi là loại (hiệu ứng ròng)");
});

test("kf-level: clamp t về duration chạm t trước → loại (khớp toàn curve)", () => {
  const k0 = kf(0, 1);
  const k1 = kf(10, 2); // duration 10, kf sau t=12 sẽ clamp về 10 = t trước
  const k2 = kf(12, 3);
  const r = sanitizeOneKeyframeCurve(curve([k0, k1, k2]), 10, 2);
  assert(r.changed === true, "phải đổi");
  const out = (r.curve as Record<string, unknown>)["keyframes"] as unknown[];
  eq(out.length, 2, "kf2 bị loại, còn 2 kf");
  assert(out[1] === k1, "kf trước giữ nguyên tham chiếu");
});

test("kf-level: clamp t không chạm t trước thì chỉ clamp, không loại", () => {
  const r = sanitizeOneKeyframeCurve(curve([kf(0, 1), kf(12, 2)]), 10, 1);
  assert(r.changed === true, "phải đổi");
  const out = (r.curve as Record<string, unknown>)["keyframes"] as unknown[];
  eq((out[1] as Record<string, unknown>)["t"], 10, "kf1 t 12→10");
  assert(r.changeItems[0].key === "curveFix.changeClampT", "key clamp t");
});

test("kf-level: easing/bezier xấu chỉ sửa kf đích", () => {
  const k0 = kf(0, 1, "ease-in");
  const k1 = kf(5, 2, "bezier", { bezier: [2, 0, 0, 1] });
  const r = sanitizeOneKeyframeCurve(curve([k0, k1]), 10, 1);
  assert(r.changed === true, "phải đổi");
  const out = (r.curve as Record<string, unknown>)["keyframes"] as unknown[];
  eq((out[1] as Record<string, unknown>)["easing"], "linear", "bezier xấu về linear");
  assert(!("bezier" in (out[1] as Record<string, unknown>)), "bỏ field bezier");
  assert(out[0] === k0, "kf0 giữ nguyên tham chiếu");
});

test("kf-level: keyframe duy nhất phải loại → không cứu được, không đổi gì", () => {
  const r = sanitizeOneKeyframeCurve(curve([kf(0, 9)]), 10, 0);
  // v=9 là clamp được (không phải loại) nên trường hợp này cứu được;
  // trường hợp phải loại thật: t xấu trên curve 1 kf:
  const r2 = sanitizeOneKeyframeCurve(curve([{ t: -1, v: 1, easing: "linear" }]), 10, 0);
  assert(r.changed === true, "v=9 clamp được");
  assert(r2.curve === null, "1 kf t xấu → không cứu được");
  assert(r2.unsalvageableReasonKey === "curveFix.reasonAllDropped", "reasonKey allDropped");
});

test("kf-level: index ngoài mảng → không đổi, không throw", () => {
  const c = curve([kf(0, 5)]);
  const r = sanitizeOneKeyframeCurve(c, 10, 7);
  assert(r.changed === false, "không đổi");
  assert(r.curve === c, "trả đúng tham chiếu cũ");
});

test("kf-level: curve sai shape / rỗng → unsalvageable với reasonKey", () => {
  const r1 = sanitizeOneKeyframeCurve({ keyframes: "nope" }, 10, 0);
  assert(r1.curve === null && r1.unsalvageableReasonKey === "curveFix.reasonShape", "shape");
  const r2 = sanitizeOneKeyframeCurve({ keyframes: [] }, 10, 0);
  assert(r2.curve === null && r2.unsalvageableReasonKey === "curveFix.reasonEmpty", "rỗng");
});

test("kf-level: vượt 128 — kf ngoài 128 đầu bị loại, kf trong giữ nguyên", () => {
  const kfs: Record<string, unknown>[] = [];
  for (let i = 0; i < 130; i++) kfs.push(kf(i, 1));
  const r = sanitizeOneKeyframeCurve(curve(kfs), undefined, 129);
  assert(r.changed === true, "phải đổi");
  const out = (r.curve as Record<string, unknown>)["keyframes"] as unknown[];
  eq(out.length, 129, "còn 129 kf");
  assert(out[0] === kfs[0], "kf đầu giữ nguyên tham chiếu");
  assert(r.changeItems[0].key === "curveFix.changeDropBeyondCap", "key beyond cap");
  const rIn = sanitizeOneKeyframeCurve(curve(kfs), undefined, 5);
  assert(rIn.changed === false, "kf trong 128 đầu đã hợp lệ thì không đổi");
});

// ---- sanitizeOneKeyframe: mức spec ----

test("spec kf-level: chỉ clip đích đổi, clip khác giữ nguyên tham chiếu", () => {
  const good = videoClip("good");
  const multi = videoClip("multi", { speedKeyframes: curve([kf(0, 5), kf(5, 1)]) });
  const other = videoClip("other", { speedKeyframes: curve([kf(0, 9)]) });
  const spec = specOf([track("t0", [good, multi, other])]);
  const res = sanitizeOneKeyframe(spec as never, "tracks[0].clips[1]", 0);
  assert(res.changed === true, "phải đổi");
  eq(res.fixed.map((f) => f.clipId), ["multi"], "chỉ multi được sửa");
  const clips = (res.spec as unknown as { tracks: { clips: unknown[] }[] }).tracks[0].clips;
  assert(clips[0] === good, "clip good giữ nguyên tham chiếu");
  assert(clips[2] === other, "clip other (v=9) giữ nguyên tham chiếu");
  const kfs = ((clips[1] as Record<string, unknown>)["speedKeyframes"] as Record<string, unknown>)["keyframes"] as Record<string, unknown>[];
  eq(kfs[0]["v"], 4, "kf0 multi 5→4");
  eq(kfs[1]["v"], 1, "kf1 multi không đổi");
});

test("spec kf-level: nested — chỉ clip trong đổi, clip ngoài giữ nguyên", () => {
  const inner = videoClip("inner", { speedKeyframes: curve([kf(0, 5), kf(5, 1)]) });
  const outer = { kind: "nested", id: "outer", start: 0, duration: 10, subSpec: specOf([track("t0", [inner])]) };
  const spec = specOf([track("t0", [outer])]);
  const res = sanitizeOneKeyframe(spec as never, "tracks[0].clips[0].subSpec.tracks[0].clips[0]", 0);
  assert(res.changed === true, "phải đổi");
  const innerAfter = ((res.spec as unknown as { tracks: { clips: { subSpec: { tracks: { clips: unknown[] }[] } }[] }[] }).tracks[0].clips[0].subSpec.tracks[0].clips[0] as Record<string, unknown>);
  const kfs = (innerAfter["speedKeyframes"] as Record<string, unknown>)["keyframes"] as Record<string, unknown>[];
  eq(kfs[0]["v"], 4, "inner kf0 5→4");
  eq(kfs[1]["v"], 1, "inner kf1 không đổi");
});

test("spec kf-level: track khóa → skippedLocked, spec không đổi", () => {
  const spec = specOf([track("t0", [videoClip("bad", { speedKeyframes: curve([kf(0, 5)]) })], { locked: true })]);
  const res = sanitizeOneKeyframe(spec as never, "tracks[0].clips[0]", 0);
  assert(res.changed === false, "không đổi");
  eq(res.skippedLocked.map((s) => s.clipId), ["bad"], "bad vào skippedLocked");
  assert(res.spec === spec, "trả đúng tham chiếu spec cũ");
});

test("spec kf-level: path lạ / clip không curve / index ngoài → không đổi rỗng", () => {
  const spec = specOf([track("t0", [videoClip("a", { speedKeyframes: curve([kf(0, 5)]) }), videoClip("b")])]);
  const r1 = sanitizeOneKeyframe(spec as never, "nope", 0);
  assert(r1.changed === false && r1.fixed.length === 0, "path lạ");
  const r2 = sanitizeOneKeyframe(spec as never, "tracks[0].clips[1]", 0);
  assert(r2.changed === false, "clip không curve");
  const r3 = sanitizeOneKeyframe(spec as never, "tracks[0].clips[0]", 9);
  assert(r3.changed === false, "index ngoài mảng");
});

// ---- i18n: parity + dịch changeItems mức keyframe ----

test("i18n: vi == en toàn bộ dict (0 key mồ côi cả hai chiều)", () => {
  const onlyVi = [...viDict.keys()].filter((k) => !enDict.has(k));
  const onlyEn = [...enDict.keys()].filter((k) => !viDict.has(k));
  eq(onlyVi, [], "không key chỉ có ở vi");
  eq(onlyEn, [], "không key chỉ có ở en");
});

test("i18n: 11 key mới đợt 30 có mặt cả hai bên, không rò key thô", () => {
  const keys = [
    "loadReport.fixKeyframe", "loadReport.fixKeyframeConfirmTitle",
    "curveFix.changeDropBeyondCap",
    "exportPanel.curveWarningsTitle", "exportPanel.curveWarningsMore",
    "exportPanel.curveBlockerNote", "exportPanel.fixCurves",
    "exportPanel.fixConfirmTitle", "exportPanel.errorDetailTitle",
    "exportPanel.errorDetailMore", "projectMenu.loadNotes",
  ];
  for (const k of keys) {
    assert(viDict.has(k), `vi thiếu ${k}`);
    assert(enDict.has(k), `en thiếu ${k}`);
    assert(!viDict.get(k)!.includes(k), `vi ${k} rò key`);
    assert(!enDict.get(k)!.includes(k), `en ${k} rò key`);
  }
  assert(tEn("exportPanel.errorDetailTitle", { code: "MISSING_ASSET" }) === "Error detail [MISSING_ASSET]:", "errorDetailTitle en thay vars");
  assert(tVi("projectMenu.loadNotes", { notes: "x" }).startsWith("Đã xong"), "loadNotes vi");
});

test("i18n: changeItems mức keyframe dịch en không rò key/vi, vi khớp chuỗi cũ", () => {
  const spec = specOf([track("t0", [videoClip("multi", { speedKeyframes: curve([kf(0, 5), kf(5, 0.1)]) })])]);
  const res = sanitizeOneKeyframe(spec as never, "tracks[0].clips[0]", 0);
  assert(res.fixed.length === 1, "1 fixed");
  const entry = res.fixed[0];
  assert(entry.changeItems !== undefined && entry.changeItems.length === entry.changes.length, "changeItems song song");
  const enLine = entry.changeItems!.map((it) => tEn(it.key, it.vars)).join(" ");
  assert(!enLine.includes("curveFix."), `en không rò key: ${enLine}`);
  assert(!enLine.includes("đã clamp") && !enLine.includes("trên"), `en không rò vi: ${enLine}`);
  assert(enLine.includes("keyframes[0]"), "en giữ index keyframe");
  const viLine = entry.changeItems!.map((it) => tVi(it.key, it.vars)).join(" ");
  eq(viLine, entry.changes.join(" "), "vi dịch khớp từng chữ changes gốc");
});

test("i18n: tóm tắt mức keyframe vi khớp từng chữ hàm cũ, en đủ mảnh", () => {
  const spec = specOf([track("t0", [videoClip("multi", { speedKeyframes: curve([kf(0, 5)]) })])]);
  const res = sanitizeOneKeyframe(spec as never, "tracks[0].clips[0]", 0);
  eq(formatSanitizeSummaryLocalized(res, tVi), formatSanitizeSummary(res), "vi khớp hàm cũ");
  const en = formatSanitizeSummaryLocalized(res, tEn);
  assert(en.includes("multi") && !en.includes("curveFix."), `en đủ mảnh: ${en}`);
});

// ---- chuỗi App mức keyframe: sửa kf0 → quét lại chỉ còn warning kf1 ----

test("chuỗi App kf-level: sửa kf0 xong, panel chỉ còn dòng kf1", () => {
  const spec = specOf([track("t0", [videoClip("multi", { speedKeyframes: curve([kf(0, 5), kf(5, 0.1)]) })])]);
  const before = collectSpeedCurveWarnings(spec);
  eq(before.length, 2, "trước sửa 2 warnings (kf0 v=5, kf1 v=0.1)");
  eq(before.map((w) => w.keyframeIndex), [0, 1], "đúng thứ tự kf");
  const res = sanitizeOneKeyframe(spec as never, "tracks[0].clips[0]", 0);
  const after = collectSpeedCurveWarnings(res.spec);
  eq(after.length, 1, "sau sửa kf0 chỉ còn 1 warning");
  eq(after[0].keyframeIndex, 1, "warning còn lại là kf1");
  eq(after[0].field, "v", "warning còn lại là v");
});

// ---- banner ExportPanel dùng formatWarningTranslated (dạng ngắn như panel) ----

test("banner: formatWarningTranslated dịch message J5, không rò key thô", () => {
  const spec = specOf([track("t0", [videoClip("bad", { speedKeyframes: curve([kf(0, 5)]) })])]);
  const warnings = collectSpeedCurveWarnings(spec);
  assert(warnings.length === 1, "1 warning");
  const enLine = formatWarningTranslated(warnings[0], tEn);
  assert(enLine.includes("tracks[0].clips[0]") && enLine.includes("bad"), "giữ path + clipId");
  assert(!enLine.includes("speedCurve.") && !enLine.includes("phải trong"), `en không rò key/vi: ${enLine}`);
});

console.log(`\ncurveFixKeyframe30: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
