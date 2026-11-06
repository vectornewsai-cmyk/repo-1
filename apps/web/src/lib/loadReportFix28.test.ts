/**
 * loadReportFix28.test.ts — Test khóa đợt 28 luồng L4: nối nút "Sửa"
 * của LoadReportPanel + i18n message J5 + đồng bộ báo cáo khi khôi
 * phục từ Lịch sử phiên bản (nợ đợt 27 §3.4 của K5).
 *
 * Chỉ test các hàm thuần (Node type-stripping): J5 sinh messageKey /
 * messageVars, dịch message theo locale qua lookup giả lập từ vi.json /
 * en.json thật, builder báo cáo history, làm mới báo cáo sau sửa, và
 * chuỗi thuần mà App handler dùng (sanitize toàn spec → quét lại →
 * refresh: warning đã sửa biến mất, warning khóa/không cứu được ở
 * lại). Component React (App handler, HistoryPanel.doRestore) không
 * chạy được bằng Node nên không có test render ở đây — chúng là lớp
 * mỏng gọi đúng các hàm đã test này (xem LIMITS L4).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, mẫu loadReport.test.ts):
 *   node apps/web/src/lib/loadReportFix28.test.ts
 */
import { readFileSync } from "node:fs";
import {
  buildHistoryLoadReport,
  buildLoadReport,
  refreshLoadReportAfterFix,
  resolveWarningMessage,
  type LoadReport,
} from "./loadReport.ts";
import {
  checkSpeedKeyframes,
  collectSpeedCurveWarnings,
  type SpeedCurveWarning,
} from "./projectRepo.ts";
import { sanitizeSpecSpeedCurves } from "./curveFix.ts";

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

function w(
  path: string,
  clipId: string,
  keyframeIndex: number | null,
  field: string,
  value: unknown,
  extra: Partial<SpeedCurveWarning> = {},
): SpeedCurveWarning {
  return { path, clipId, keyframeIndex, field, value, message: `msg ${field}`, ...extra };
}

// ---- i18n: đọc dict thật, giả lập t() (lookup + thay {var}) ----

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

// ---- J5 sinh messageKey/messageVars cho đủ 10 loại vi phạm ----

test("J5: shape/empty/tooMany có messageKey đúng", () => {
  const p = "tracks[0].clips[0]";
  const shape = checkSpeedKeyframes("nope", p, "c1", 10);
  eq(shape.length, 1, "shape phải 1 warning");
  eq(shape[0].messageKey, "speedCurve.shape", "shape key sai");
  eq(shape[0].message, "speedKeyframes phải là object { keyframes: [...] }.", "shape message tiếng Việt phải giữ nguyên");
  const empty = checkSpeedKeyframes({ keyframes: [] }, p, "c1", 10);
  eq(empty[0].messageKey, "speedCurve.keyframesEmpty", "empty key sai");
  const many = checkSpeedKeyframes(curve(Array.from({ length: 129 }, (_, i) => kf(i / 10, 1))), p, "c1", undefined);
  eq(many.length, 1, "129 keyframe chỉ 1 warning tooMany (keyframe đều hợp lệ)");
  eq(many[0].messageKey, "speedCurve.keyframesTooMany", "tooMany key sai");
  eq(many[0].messageVars, { value: "129" }, "tooMany vars sai");
});

test("J5: keyframe không phải object + tInvalid + tOutOfRange + tNotMonotone", () => {
  const p = "tracks[0].clips[0]";
  const notObj = checkSpeedKeyframes(curve([42]), p, "c1", 10);
  eq(notObj[0].messageKey, "speedCurve.keyframeNotObject", "keyframeNotObject key sai");
  const tBad = checkSpeedKeyframes(curve([kf(-1, 1)]), p, "c1", 10);
  eq(tBad[0].messageKey, "speedCurve.tInvalid", "tInvalid key sai");
  eq(tBad[0].messageVars, { value: "-1" }, "tInvalid vars sai");
  const tOver = checkSpeedKeyframes(curve([kf(12, 1)]), p, "c1", 10);
  eq(tOver[0].messageKey, "speedCurve.tOutOfRange", "tOutOfRange key sai");
  eq(tOver[0].messageVars, { value: "12", duration: "10" }, "tOutOfRange vars sai");
  const tMono = checkSpeedKeyframes(curve([kf(2, 1), kf(2, 1)]), p, "c1", 10);
  eq(tMono.length, 1, "t trùng chỉ 1 warning monotone");
  eq(tMono[0].messageKey, "speedCurve.tNotMonotone", "tNotMonotone key sai");
  eq(tMono[0].messageVars, { value: "2", prev: "2" }, "tNotMonotone vars sai");
});

test("J5: v/easing/bezier có messageKey + message tiếng Việt giữ nguyên từng chữ", () => {
  const p = "tracks[0].clips[0]";
  const vBad = checkSpeedKeyframes(curve([kf(0, 5)]), p, "bad", 10);
  eq(vBad.length, 1, "v=5 phải 1 warning");
  eq(vBad[0].messageKey, "speedCurve.vOutOfRange", "v key sai");
  eq(vBad[0].messageVars, { value: "5" }, "v vars sai");
  eq(
    vBad[0].message,
    "tracks[0].clips[0].speedKeyframes.keyframes[0].v phải trong [0.25, 4] (nhận được: 5).",
    "message v=5 phải giữ nguyên từng chữ (hồi quy chuỗi LoadResult.warnings)",
  );
  const eas = checkSpeedKeyframes(curve([kf(0, 1, "bounce")]), p, "c1", 10);
  eq(eas[0].messageKey, "speedCurve.easingInvalid", "easing key sai");
  eq(eas[0].messageVars, { value: '"bounce"' }, "easing vars sai");
  const bez = checkSpeedKeyframes(curve([kf(0, 1, "bezier", { bezier: [2, 0, 0, 0] })]), p, "c1", 10);
  eq(bez[0].messageKey, "speedCurve.bezierInvalid", "bezier key sai");
  eq(bez[0].messageVars, { value: "[2,0,0,0]" }, "bezier vars sai");
});

// ---- resolveWarningMessage: dịch theo locale hiện tại, fallback đúng ----

test("resolveWarningMessage: en/vi dịch đủ vars, thiếu key fallback message gốc", () => {
  const warning = w("tracks[0].clips[0]", "bad", 0, "v", 5, {
    message: "tracks[0].clips[0].speedKeyframes.keyframes[0].v phải trong [0.25, 4] (nhận được: 5).",
    messageKey: "speedCurve.vOutOfRange",
    messageVars: { value: "5" },
  });
  eq(
    resolveWarningMessage(warning, makeLookup(enDict, viDict)),
    "v must be within [0.25, 4] (got: 5).",
    "bản en sai",
  );
  eq(
    resolveWarningMessage(warning, makeLookup(viDict, viDict)),
    "v phải trong [0.25, 4] (nhận được: 5).",
    "bản vi sai",
  );
  const mono = w("tracks[0].clips[0]", "c1", 1, "t", 2, {
    message: "gốc",
    messageKey: "speedCurve.tNotMonotone",
    messageVars: { value: "2", prev: "2" },
  });
  eq(
    resolveWarningMessage(mono, makeLookup(enDict, viDict)),
    "t must be strictly increasing (t=2 is not greater than previous t=2).",
    "bản en monotone sai",
  );
  const missing = w("tracks[0].clips[0]", "c1", 0, "v", 5, {
    message: "câu gốc",
    messageKey: "speedCurve.khongCoKeyNay",
    messageVars: { value: "5" },
  });
  eq(resolveWarningMessage(missing, makeLookup(enDict, viDict)), "câu gốc", "thiếu key phải fallback message gốc");
  const legacy = w("tracks[0].clips[0]", "c1", 0, "v", 5);
  eq(resolveWarningMessage(legacy, makeLookup(enDict, viDict)), "msg v", "warning cũ không key phải giữ message");
});

// ---- i18n parity toàn file vi=en + đủ key mới ----

test("i18n parity: toàn bộ key vi == en, đủ 10 key speedCurve + 5 key loadReport mới", () => {
  const viKeys = [...viDict.keys()].sort();
  const enKeys = [...enDict.keys()].sort();
  const onlyVi = viKeys.filter((k) => !enDict.has(k));
  const onlyEn = enKeys.filter((k) => !viDict.has(k));
  eq(onlyVi, [], `key chỉ có ở vi: ${onlyVi.join(", ")}`);
  eq(onlyEn, [], `key chỉ có ở en: ${onlyEn.join(", ")}`);
  for (const k of [
    "speedCurve.shape", "speedCurve.keyframesEmpty", "speedCurve.keyframesTooMany",
    "speedCurve.keyframeNotObject", "speedCurve.tInvalid", "speedCurve.tOutOfRange",
    "speedCurve.tNotMonotone", "speedCurve.vOutOfRange", "speedCurve.easingInvalid",
    "speedCurve.bezierInvalid",
    "loadReport.sourceHistory", "loadReport.fixConfirmTitle", "loadReport.fixConfirmUnsalvageable",
    "loadReport.fixConfirmLocked", "loadReport.fixConfirmTiming",
  ]) {
    assert(viDict.has(k) && enDict.has(k), `thiếu key mới ${k}`);
  }
});

// ---- builder history + refresh sau sửa ----

test("buildHistoryLoadReport: nguồn history, otherWarnings rỗng, atCap false kể cả 101 mục", () => {
  const many: SpeedCurveWarning[] = Array.from({ length: 101 }, (_, i) =>
    w(`tracks[0].clips[${i}]`, `c${i}`, 0, "v", 5),
  );
  const r = buildHistoryLoadReport(many, "proj");
  eq(r.source, "history", "source sai");
  eq(r.projectName, "proj", "tên sai");
  eq(r.warnings.length, 101, "phải giữ đủ 101 (quét lại không cắt)");
  eq(r.otherWarnings, [], "history không có warnings chuỗi");
  eq(r.atCap, false, "quét lại không cắt nên atCap phải false");
});

test("refreshLoadReportAfterFix: giữ nguồn/tên/giờ/lưu ý khác, chỉ thay warnings, atCap false", () => {
  const base: LoadReport = {
    source: "file",
    projectName: "proj",
    loadedAt: "2026-10-31T00:00:00.000Z",
    warnings: [w("tracks[0].clips[0]", "bad", 0, "v", 5), w("tracks[0].clips[1]", "locked", 0, "v", 5)],
    otherWarnings: ["blob note"],
    structuredNotes: [],
    atCap: true,
  };
  const refreshed = refreshLoadReportAfterFix(base, [w("tracks[0].clips[1]", "locked", 0, "v", 5)]);
  eq(refreshed.source, "file", "source phải giữ");
  eq(refreshed.projectName, "proj", "tên phải giữ");
  eq(refreshed.loadedAt, "2026-10-31T00:00:00.000Z", "giờ load gốc phải giữ");
  eq(refreshed.otherWarnings, ["blob note"], "lưu ý khác phải giữ");
  eq(refreshed.warnings.length, 1, "warning đã sửa phải biến mất");
  eq(refreshed.warnings[0].clipId, "locked", "warning còn lại sai");
  eq(refreshed.atCap, false, "quét lại không cắt nên atCap false");
  const emptied = refreshLoadReportAfterFix(base, []);
  eq(emptied.warnings, [], "sửa hết thì warnings rỗng (panel hiện noWarnings, strip ẩn)");
});

// ---- chuỗi App handler: sanitize → quét lại → refresh ----

function videoClip(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "video", id, src: "a.mp4", start: 0, duration: 10, in: 0, out: 10, ...extra };
}

test("chuỗi sửa App: v=5 sửa được biến mất, track khóa + keyframes rỗng ở lại sau refresh", () => {
  const spec = {
    version: "0.2.0",
    meta: { name: "test", width: 640, height: 360, fps: 30 },
    tracks: [
      {
        id: "v", kind: "video",
        clips: [
          videoClip("bad", { speedKeyframes: curve([kf(0, 5)]) }),
          videoClip("empty", { speedKeyframes: { keyframes: [] } }),
        ],
      },
      {
        id: "locked", kind: "video", locked: true,
        clips: [videoClip("locked-bad", { speedKeyframes: curve([kf(0, 5)]) })],
      },
    ],
  };
  const before = collectSpeedCurveWarnings(spec);
  eq(before.length, 3, `trước sửa phải 3 warnings, nhận ${before.length}`);
  const report = buildLoadReport(
    { warnings: before.map((x) => `${x.path} (clip "${x.clipId}"): ${x.message}`), speedCurveWarnings: before },
    "file",
    "test",
  );
  const sanitized = sanitizeSpecSpeedCurves(spec as never);
  assert(sanitized.changed === true, "sanitize phải đổi spec");
  eq(sanitized.fixed.map((f) => f.clipId), ["bad"], "chỉ clip bad được sửa");
  eq(sanitized.skippedLocked.map((f) => f.clipId), ["locked-bad"], "clip track khóa phải bị bỏ qua");
  eq(sanitized.unsalvageable.map((f) => f.clipId), ["empty"], "curve rỗng phải không cứu được");
  const remaining = collectSpeedCurveWarnings(sanitized.spec);
  eq(remaining.length, 2, `sau sửa còn 2 warnings, nhận ${remaining.length}`);
  const refreshed = refreshLoadReportAfterFix(report, remaining);
  eq(refreshed.warnings.map((x) => x.clipId).sort(), ["empty", "locked-bad"], "refresh phải giữ đúng 2 warning chưa sửa");
});

console.log(`\nloadReportFix28: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
