/**
 * loadReportPerLine29.test.ts — Test khóa đợt 29 luồng L4: sửa RIÊNG
 * từng dòng warning + dịch nốt chỗ hiện message J5 trong phạm vi luồng
 * (confirm sửa, toast tóm tắt sau sửa, toast khôi phục autosave).
 *
 * Chỉ test các hàm thuần (Node type-stripping): sanitizeOneSpeedCurve
 * (chỉ clip đích đổi, clip khác giữ nguyên tham chiếu), changeItems
 * song song changes + dịch vi/en qua dict thật, tóm tắt đã dịch
 * (vi KHỚP TỪNG CHỮ với formatSanitizeSummary cũ), helper dịch của
 * loadReport, và chuỗi thuần mà App handler per-line dùng
 * (sanitizeOne → quét lại → refresh: warning dòng đó biến mất, dòng
 * khác ở lại). Component React (App handler, panel) không chạy được
 * bằng Node nên không có test render ở đây — chúng là lớp mỏng gọi
 * đúng các hàm đã test này (xem LIMITS đợt 29); nút bấm thật được
 * kiểm chứng bằng click-test CDP riêng (scripts/clicktest-l4-round29-pipe.mjs).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, từ gốc repo):
 *   node apps/web/src/lib/loadReportPerLine29.test.ts
 */
import { readFileSync } from "node:fs";
import {
  formatFixEntryChanges,
  formatWarningTranslated,
  refreshLoadReportAfterFix,
  buildLoadReport,
  resolveUnsalvageableReason,
} from "./loadReport.ts";
import { collectSpeedCurveWarnings } from "./projectRepo.ts";
import {
  formatSanitizeSummary,
  formatSanitizeSummaryLocalized,
  sanitizeOneSpeedCurve,
  sanitizeSpecSpeedCurves,
} from "./curveFix.ts";

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

// ---- builders spec tối thiểu ----

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

// ---- i18n: đọc dict thật, giả lập t() (mẫu loadReportFix28.test.ts) ----

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

// ---- sanitizeOneSpeedCurve: chỉ clip đích đổi ----

test("per-line: chỉ clip đích đổi, clip khác giữ nguyên tham chiếu", () => {
  const spec = specOf([
    track("t0", [
      videoClip("good"),
      videoClip("bad-a", { speedKeyframes: curve([kf(0, 5)]) }),
      videoClip("bad-b", { speedKeyframes: curve([kf(0, 9)]) }),
    ]),
  ]);
  const res = sanitizeOneSpeedCurve(spec as never, "tracks[0].clips[1]");
  assert(res.changed === true, "phải đổi spec");
  eq(res.fixed.map((f) => f.clipId), ["bad-a"], "chỉ bad-a được sửa");
  eq(res.unsalvageable, [], "không có unsalvageable");
  eq(res.skippedLocked, [], "không có skippedLocked");
  const out = res.spec as unknown as Record<string, unknown>;
  const clips = (out["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[];
  const inClips = (spec["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[];
  assert(clips[0] === inClips[0], "clip good phải giữ nguyên tham chiếu");
  assert(clips[2] === inClips[2], "clip bad-b phải giữ nguyên tham chiếu (v=9 còn nguyên)");
  const fixedCurve = clips[1]["speedKeyframes"] as Record<string, unknown>;
  eq((fixedCurve["keyframes"] as Record<string, unknown>[])[0]["v"], 4, "v=5 phải clamp về 4");
  const remaining = collectSpeedCurveWarnings(res.spec);
  eq(remaining.map((x) => x.clipId), ["bad-b"], "quét lại chỉ còn bad-b");
});

test("per-line: một dòng sửa hết mọi vi phạm của đúng clip đó", () => {
  const spec = specOf([
    track("t0", [
      videoClip("multi", { speedKeyframes: curve([kf(0, 5), kf(12, 9, "bogus")]) }),
      videoClip("other", { speedKeyframes: curve([kf(0, 5)]) }),
    ]),
  ]);
  const res = sanitizeOneSpeedCurve(spec as never, "tracks[0].clips[0]");
  eq(res.fixed.length, 1, "chỉ 1 entry fixed");
  assert(res.fixed[0].changes.length >= 3, `multi phải ≥3 thay đổi (v clamp x2 + easing), nhận ${res.fixed[0].changes.length}`);
  const remaining = collectSpeedCurveWarnings(res.spec);
  eq(remaining.map((x) => x.clipId), ["other"], "multi sạch hẳn, other ở lại");
});

test("per-line: path nested chỉ sửa clip trong, clip anh em giữ nguyên", () => {
  const inner = (id: string, extra: Record<string, unknown> = {}) =>
    videoClip(id, extra);
  const spec = specOf([
    track("t0", [
      {
        kind: "nested", id: "outer", start: 0, duration: 10,
        subSpec: specOf([
          track("in0", [
            inner("leaf-bad", { speedKeyframes: curve([kf(0, 5)]) }),
            inner("leaf-good"),
          ]),
        ]),
      },
      videoClip("top-bad", { speedKeyframes: curve([kf(0, 9)]) }),
    ]),
  ]);
  const res = sanitizeOneSpeedCurve(spec as never, "tracks[0].clips[0].subSpec.tracks[0].clips[0]");
  eq(res.fixed.map((f) => f.clipId), ["leaf-bad"], "chỉ leaf-bad được sửa");
  const out = res.spec as unknown as Record<string, unknown>;
  const outClips = (out["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[];
  const inClips = (spec["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[];
  assert(outClips[1] === inClips[1], "top-bad giữ nguyên tham chiếu");
  const outSub = outClips[0]["subSpec"] as Record<string, unknown>;
  const inSub = inClips[0]["subSpec"] as Record<string, unknown>;
  const outInner = (outSub["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[];
  const inInner = (inSub["tracks"] as Record<string, unknown>[])[0]["clips"] as Record<string, unknown>[];
  assert(outInner[1] === inInner[1], "leaf-good giữ nguyên tham chiếu");
  eq(((outInner[0]["speedKeyframes"] as Record<string, unknown>)["keyframes"] as Record<string, unknown>[])[0]["v"], 4, "leaf-bad v=5 về 4");
});

test("per-line: track khóa → skippedLocked, spec không đổi", () => {
  const spec = specOf([
    track("t0", [videoClip("locked-bad", { speedKeyframes: curve([kf(0, 5)]) })], { locked: true }),
    track("t1", [videoClip("free-bad", { speedKeyframes: curve([kf(0, 5)]) })]),
  ]);
  const res = sanitizeOneSpeedCurve(spec as never, "tracks[0].clips[0]");
  assert(res.changed === false, "track khóa không được đổi spec");
  assert(res.spec === (spec as never), "spec trả về phải đúng tham chiếu cũ");
  eq(res.skippedLocked.map((f) => f.clipId), ["locked-bad"], "phải vào skippedLocked");
  eq(res.fixed, [], "không có fixed");
});

test("per-line: curve rỗng → unsalvageable có reasonKey, spec không đổi", () => {
  const spec = specOf([
    track("t0", [videoClip("empty", { speedKeyframes: curve([]) })]),
  ]);
  const res = sanitizeOneSpeedCurve(spec as never, "tracks[0].clips[0]");
  assert(res.changed === false, "curve rỗng không đổi spec");
  eq(res.unsalvageable.length, 1, "phải 1 unsalvageable");
  eq(res.unsalvageable[0].reasonKey, "curveFix.reasonEmpty", "reasonKey sai");
  assert(res.unsalvageable[0].reason.includes("rỗng"), "reason tiếng Việt phải giữ nguyên");
});

test("per-line: path lạ / clip hợp lệ / clip không mang curve → không đổi, rỗng", () => {
  const spec = specOf([
    track("t0", [
      videoClip("good", { speedKeyframes: curve([kf(0, 1)]) }),
      videoClip("nocurve"),
    ]),
  ]);
  for (const p of ["tracks[9].clips[0]", "tracks[0].clips[0]", "tracks[0].clips[1]", "bogus", "tracks[0].clips[0].subSpec.tracks[0].clips[0]"]) {
    const res = sanitizeOneSpeedCurve(spec as never, p);
    assert(res.changed === false, `path ${p} không được đổi spec`);
    assert(res.spec === (spec as never), `path ${p} phải trả đúng tham chiếu cũ`);
    eq(res.fixed, [], `path ${p} không có fixed`);
    eq(res.unsalvageable, [], `path ${p} không có unsalvageable`);
    eq(res.skippedLocked, [], `path ${p} không có skippedLocked`);
  }
});

// ---- changeItems + dịch ----

test("changeItems: song song changes, đủ key curveFix.change*", () => {
  const spec = specOf([
    track("t0", [
      videoClip("mix", {
        speedKeyframes: curve([
          kf(0, 5),
          { t: 12, v: 1, easing: "bezier", bezier: [2, 0, 0, 0] },
          kf(12, 1),
          42,
        ]),
      }),
    ]),
  ]);
  const res = sanitizeSpecSpeedCurves(spec as never);
  eq(res.fixed.length, 1, "phải 1 fixed");
  const entry = res.fixed[0];
  assert((entry.changeItems?.length ?? 0) === entry.changes.length, `changeItems (${entry.changeItems?.length}) phải bằng changes (${entry.changes.length})`);
  for (const item of entry.changeItems ?? []) {
    assert(item.key.startsWith("curveFix.change"), `key phải thuộc curveFix.change*, nhận ${item.key}`);
    assert(viDict.has(item.key) && enDict.has(item.key), `thiếu key i18n ${item.key}`);
  }
});

test("dịch changes: vi khớp từng chữ với changes gốc, en dịch thật không rò key/vi", () => {
  const spec = specOf([
    track("t0", [videoClip("mix", { speedKeyframes: curve([kf(0, 5), kf(12, 1, "bogus")]) })]),
  ]);
  const res = sanitizeSpecSpeedCurves(spec as never);
  const entry = res.fixed[0];
  eq(formatFixEntryChanges(entry, tVi), entry.changes, "dịch vi phải khớp từng chữ changes gốc");
  const en = formatFixEntryChanges(entry, tEn);
  assert(en.length === entry.changes.length, "en phải cùng số dòng");
  for (const line of en) {
    assert(!line.includes("curveFix."), `en không được rò key thô: ${line}`);
    assert(!line.includes("đã clamp") && !line.includes("không hỗ trợ"), `en không được rò tiếng Việt: ${line}`);
  }
  assert(en.some((l) => l.includes("clamped to 4")), "en phải có câu clamp về 4");
  assert(en.some((l) => l.includes("not supported")), "en phải có câu easing không hỗ trợ");
});

test("formatFixEntryChanges fallback: thiếu/mismatch changeItems → trả changes gốc", () => {
  const raw = ["keyframes[0]: v=5 trên 4 — đã clamp về 4."];
  eq(formatFixEntryChanges({ changes: raw }, tEn), raw, "thiếu changeItems phải fallback");
  eq(
    formatFixEntryChanges({ changes: raw, changeItems: [{ key: "curveFix.changeClampVHigh", vars: {} }, { key: "curveFix.changeClampVHigh", vars: {} }] }, tEn),
    raw,
    "mismatch độ dài phải fallback",
  );
  eq(
    formatFixEntryChanges({ changes: raw, changeItems: [{ key: "curveFix.noSuchKey", vars: {} }] }, tEn),
    raw,
    "key thiếu phải fallback về chuỗi gốc, không hiện key thô",
  );
});

test("resolveUnsalvageableReason: có key dịch vi/en, không key giữ nguyên", () => {
  eq(resolveUnsalvageableReason({ reason: "rỗng", reasonKey: "curveFix.reasonEmpty" }, tVi), viDict.get("curveFix.reasonEmpty"), "vi reasonEmpty sai");
  eq(resolveUnsalvageableReason({ reason: "rỗng", reasonKey: "curveFix.reasonEmpty" }, tEn), enDict.get("curveFix.reasonEmpty"), "en reasonEmpty sai");
  eq(resolveUnsalvageableReason({ reason: "lý do cũ" }, tEn), "lý do cũ", "không key phải giữ nguyên");
  eq(resolveUnsalvageableReason({ reason: "lý do cũ", reasonKey: "curveFix.noSuchKey" }, tEn), "lý do cũ", "key thiếu phải giữ nguyên");
});

// ---- tóm tắt đã dịch ----

test("tóm tắt đã dịch: vi khớp từng chữ formatSanitizeSummary cũ (fixed + unsalvageable + locked)", () => {
  const spec = specOf([
    track("t0", [videoClip("bad", { speedKeyframes: curve([kf(0, 5)]) })], { locked: false }),
    track("t1", [videoClip("locked-bad", { speedKeyframes: curve([kf(0, 5)]) })], { locked: true }),
    track("t2", [videoClip("empty", { speedKeyframes: curve([]) })]),
  ]);
  const res = sanitizeSpecSpeedCurves(spec as never);
  eq(formatSanitizeSummaryLocalized(res, tVi), formatSanitizeSummary(res), "tóm tắt vi phải khớp từng chữ hàm cũ");
  const en = formatSanitizeSummaryLocalized(res, tEn);
  assert(en.includes("Fixed 1 curve"), `en phải có Fixed 1 curve, nhận: ${en}`);
  assert(en.includes("Could not fix 1 curve"), `en phải có Could not fix, nhận: ${en}`);
  assert(en.includes("Skipped 1 curve"), `en phải có Skipped, nhận: ${en}`);
  assert(!en.includes("Đã sửa") && !en.includes("Chưa sửa") && !en.includes("Bỏ qua"), "en không được rò tiếng Việt");
  eq(formatSanitizeSummaryLocalized({ spec: res.spec, changed: false, fixed: [], unsalvageable: [], skippedLocked: [] }, tVi), "Không còn curve vi phạm nào để sửa.", "trường hợp rỗng vi sai");
  eq(formatSanitizeSummaryLocalized({ spec: res.spec, changed: false, fixed: [], unsalvageable: [], skippedLocked: [] }, tEn), "No violating curves left to fix.", "trường hợp rỗng en sai");
});

// ---- i18n parity + key mới ----

test("i18n parity: toàn bộ key vi == en, đủ key mới đợt 29", () => {
  const viKeys = [...viDict.keys()].sort();
  const enKeys = [...enDict.keys()].sort();
  eq(viKeys.filter((k) => !enDict.has(k)), [], "key chỉ có ở vi");
  eq(enKeys.filter((k) => !viDict.has(k)), [], "key chỉ có ở en");
  for (const k of [
    "loadReport.fixLine", "loadReport.fixAll", "loadReport.fixLineConfirmTitle", "loadReport.autosaveRestoredNote",
    "curveFix.summaryFixed", "curveFix.summaryUnsalvageable", "curveFix.summaryLocked", "curveFix.summaryNone",
    "curveFix.changeDropNonObject", "curveFix.changeDropBadT", "curveFix.changeDropBadV",
    "curveFix.changeClampT", "curveFix.changeClampVLow", "curveFix.changeClampVHigh",
    "curveFix.changeEasing", "curveFix.changeBezier", "curveFix.changeMonotone", "curveFix.changeTooMany",
    "curveFix.reasonShape", "curveFix.reasonEmpty", "curveFix.reasonAllDropped",
  ]) {
    assert(viDict.has(k) && enDict.has(k), `thiếu key mới ${k}`);
  }
});

// ---- formatWarningTranslated + chuỗi App per-line ----

test("formatWarningTranslated: cùng format J5, message dịch theo locale", () => {
  const before = collectSpeedCurveWarnings(specOf([
    track("t0", [videoClip("bad", { speedKeyframes: curve([kf(0, 5)]) })]),
  ]) as never);
  eq(before.length, 1, "phải 1 warning");
  const viLine = formatWarningTranslated(before[0], tVi);
  assert(viLine.startsWith(`tracks[0].clips[0] (clip "bad"): `), `vi line format sai: ${viLine}`);
  assert(viLine.includes("v phải trong [0.25, 4]"), `vi line phải có message vi: ${viLine}`);
  const enLine = formatWarningTranslated(before[0], tEn);
  assert(enLine.includes("v must be within [0.25, 4]"), `en line phải dịch: ${enLine}`);
  assert(!enLine.includes("phải trong"), "en line không được rò tiếng Việt");
});

test("chuỗi sửa App per-line: dòng đích biến mất, dòng khác ở lại sau refresh", () => {
  const spec = specOf([
    track("t0", [
      videoClip("bad-a", { speedKeyframes: curve([kf(0, 5)]) }),
      videoClip("bad-b", { speedKeyframes: curve([kf(0, 9)]) }),
    ]),
  ]);
  const before = collectSpeedCurveWarnings(spec);
  eq(before.length, 2, "trước sửa phải 2 warnings");
  const report = buildLoadReport(
    { warnings: before.map((x) => `${x.path} (clip "${x.clipId}"): ${x.message}`), speedCurveWarnings: before },
    "file",
    "test",
  );
  const preview = sanitizeOneSpeedCurve(spec as never, "tracks[0].clips[0]");
  assert(preview.fixed.length === 1, "preview per-line phải 1 fixed");
  const remaining = collectSpeedCurveWarnings(preview.spec);
  const refreshed = refreshLoadReportAfterFix(report, remaining);
  eq(refreshed.warnings.map((x) => x.clipId), ["bad-b"], "refresh chỉ giữ bad-b");
  eq(refreshed.source, "file", "refresh giữ nguồn");
  eq(refreshed.projectName, "test", "refresh giữ tên project");
  assert(refreshed.atCap === false, "refresh atCap false");
});

console.log(`\nloadReportPerLine29: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
