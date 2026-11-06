/**
 * loadReport.test.ts — Test khóa panel "Báo cáo tải project"
 * (Phase 9 đợt 27, luồng K5).
 *
 * Bao phủ module thuần lib/loadReport.ts: dựng báo cáo từ kết quả
 * load (tách chuỗi speedCurve khỏi lưu ý khác, cờ tràn 100), store
 * module-level (set/get/subscribe/clear), định vị clip cấp cao từ
 * path J5 (kể cả nested), gợi ý sửa theo field, hiển thị giá trị.
 * Panel React (LoadReportPanel.tsx) không chạy được bằng Node
 * type-stripping nên không có test render ở đây — panel chỉ là lớp
 * hiển thị mỏng trên các hàm này + store.selectMany/setPlayhead của
 * store (đã có test riêng); xem LIMITS K5.
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, mẫu projectRepoRound26J5.test.ts):
 *   node apps/web/src/lib/loadReport.test.ts
 */
import {
  buildLoadReport,
  clearLastLoadReport,
  formatWarningValue,
  getLastLoadReport,
  resolveTopLevelClip,
  setLastLoadReport,
  subscribeLoadReport,
  suggestFix,
  type LoadReportSpecShape,
} from "./loadReport.ts";
import { formatSpeedCurveWarning, type SpeedCurveWarning } from "./projectRepo.ts";

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

function w(
  path: string,
  clipId: string,
  keyframeIndex: number | null,
  field: string,
  value: unknown,
): SpeedCurveWarning {
  return { path, clipId, keyframeIndex, field, value, message: `msg ${field} ${JSON.stringify(value)}` };
}

const SPEC: LoadReportSpecShape = {
  tracks: [
    {
      id: "v1",
      clips: [
        { id: "top-a", start: 0 },
        { id: "TOP-CURVINV", start: 3.5 },
      ],
    },
    { id: "v2", clips: [{ id: "leaf", start: 1 }] },
  ],
};

test("khóa format: chuỗi tách trong build khớp formatSpeedCurveWarning thật (J5)", () => {
  // buildLoadReport tự dựng chuỗi `${path} (clip "id"): ${message}` thay
  // vì import formatSpeedCurveWarning (tránh import runtime projectRepo
  // trong code thật) — test này bắt mọi lệch format trong tương lai.
  const sw = w("tracks[0].clips[1].subSpec.tracks[0].clips[0]", "MID", 2, "v", 5);
  const rep = buildLoadReport(
    { warnings: [formatSpeedCurveWarning(sw), "lưu ý khác"], speedCurveWarnings: [sw] },
    "file",
    "x",
  );
  assert(rep.otherWarnings.length === 1 && rep.otherWarnings[0] === "lưu ý khác",
    `tách sai khi format lệch: ${JSON.stringify(rep.otherWarnings)}`);
});

test("build: giữ warnings cấu trúc, tách chuỗi speedCurve khỏi lưu ý khác", () => {
  const sw = w("tracks[0].clips[1]", "TOP-CURVINV", 0, "v", 5);
  const blob = "clip dùng blob: URL — sẽ mất khi tải lại trang.";
  const rep = buildLoadReport(
    { warnings: [formatSpeedCurveWarning(sw), blob], speedCurveWarnings: [sw] },
    "file",
    "demo",
  );
  assert(rep.source === "file", "source sai");
  assert(rep.projectName === "demo", "projectName sai");
  assert(rep.warnings.length === 1 && rep.warnings[0].value === 5, "mất warning cấu trúc");
  assert(rep.otherWarnings.length === 1 && rep.otherWarnings[0] === blob, `otherWarnings sai: ${JSON.stringify(rep.otherWarnings)}`);
  assert(rep.atCap === false, "atCap oan");
  assert(!Number.isNaN(Date.parse(rep.loadedAt)), "loadedAt không phải ISO date");
});

test("build: không có speedCurveWarnings → otherWarnings giữ nguyên", () => {
  const rep = buildLoadReport({ warnings: ["lưu ý A"] }, "archive", "arc");
  assert(rep.warnings.length === 0, "warnings giả");
  assert(rep.otherWarnings.length === 1, "mất lưu ý khác");
  assert(rep.atCap === false, "atCap oan");
});

test("build: atCap khi đủ 100 mục + câu tràn bị trừ khỏi otherWarnings", () => {
  const sws: SpeedCurveWarning[] = [];
  const strs: string[] = [];
  for (let i = 0; i < 100; i++) {
    const x = w(`tracks[0].clips[0]`, "c", i, "v", 9);
    sws.push(x);
    strs.push(formatSpeedCurveWarning(x));
  }
  strs.push("Còn 7 cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100).");
  const rep = buildLoadReport({ warnings: strs, speedCurveWarnings: sws }, "file", "big");
  assert(rep.atCap === true, "atCap phải true ở 100 mục");
  assert(rep.otherWarnings.length === 0, `câu tràn phải bị trừ: ${JSON.stringify(rep.otherWarnings)}`);
});

test("store: set/get/subscribe/clear (subscribe gọi ngay + mỗi lần đổi)", () => {
  clearLastLoadReport();
  assert(getLastLoadReport() === null, "ban đầu phải null");
  const seen: (string | null)[] = [];
  const unsub = subscribeLoadReport((r) => seen.push(r ? r.projectName : null));
  const rep = buildLoadReport({ warnings: [] }, "autosave", "auto1");
  setLastLoadReport(rep);
  assert(getLastLoadReport() === rep, "get không trả đúng report");
  clearLastLoadReport();
  assert(getLastLoadReport() === null, "clear không xoá");
  unsub();
  setLastLoadReport(rep); // sau unsub không được ghi thêm
  assert(
    JSON.stringify(seen) === JSON.stringify([null, "auto1", null]),
    `dãy subscribe sai: ${JSON.stringify(seen)}`,
  );
  clearLastLoadReport();
});

test("resolve: clip cấp cao (depth 0, đúng track/clip/start)", () => {
  const t = resolveTopLevelClip("tracks[0].clips[1]", SPEC);
  assert(t !== null, "resolve null oan");
  assert(t.trackId === "v1" && t.clipId === "TOP-CURVINV", `sai đích: ${JSON.stringify(t)}`);
  assert(t.start === 3.5, `start sai: ${t.start}`);
  assert(t.nestedDepth === 0, `depth sai: ${t.nestedDepth}`);
});

test("resolve: nested sâu (depth 2) vẫn về clip ngoài cùng", () => {
  const t = resolveTopLevelClip(
    "tracks[0].clips[1].subSpec.tracks[0].clips[0].subSpec.tracks[0].clips[0]",
    SPEC,
  );
  assert(t !== null, "resolve nested null oan");
  assert(t.clipId === "TOP-CURVINV", `phải chọn clip ngoài cùng: ${JSON.stringify(t)}`);
  assert(t.nestedDepth === 2, `depth sai: ${t.nestedDepth}`);
});

test("resolve: path lạ / chỉ số vượt → null (panel hiện ghi chú, không crash)", () => {
  assert(resolveTopLevelClip("clips[0]", SPEC) === null, "path lạ phải null");
  assert(resolveTopLevelClip("", SPEC) === null, "path rỗng phải null");
  assert(resolveTopLevelClip("tracks[9].clips[0]", SPEC) === null, "track vượt phải null");
  assert(resolveTopLevelClip("tracks[0].clips[9]", SPEC) === null, "clip vượt phải null");
});

test("suggestFix: map đủ field J5 (v/t/easing/bezier/keyframes)", () => {
  assert(suggestFix(w("p", "c", 0, "v", 5)).key === "loadReport.fixV", "v sai key");
  assert(suggestFix(w("p", "c", 0, "t", 9)).key === "loadReport.fixT", "t sai key");
  assert(suggestFix(w("p", "c", 0, "easing", "ease-in-out")).key === "loadReport.fixEasing", "easing sai key");
  assert(suggestFix(w("p", "c", 0, "bezier", [1.5, 0, 0.25, 1])).key === "loadReport.fixBezier", "bezier sai key");
  assert(suggestFix(w("p", "c", null, "keyframes", [])).key === "loadReport.fixKeyframesEmpty", "keyframes rỗng sai key");
  const tooMany = suggestFix(w("p", "c", null, "keyframes", 200));
  assert(tooMany.key === "loadReport.fixKeyframesTooMany" && tooMany.vars?.["max"] === "128", `quá 128 sai: ${JSON.stringify(tooMany)}`);
  assert(suggestFix(w("p", "c", null, "keyframes", "x")).key === "loadReport.fixKeyframesShape", "keyframes dạng sai key");
  assert(suggestFix(w("p", "c", 0, "field-lạ", 1)).key === "loadReport.fixGeneric", "field lạ phải về generic");
});

test("formatWarningValue: JSON hoá + cắt dài, không vỡ với undefined", () => {
  assert(formatWarningValue(5) === "5", "số sai");
  assert(formatWarningValue("ease-in-out") === '"ease-in-out"', "chuỗi sai");
  assert(formatWarningValue(undefined) === "undefined", "undefined sai");
  const long = formatWarningValue(new Array(100).fill("x"));
  assert(long.length <= 120 && long.endsWith("…"), `cắt dài sai (len ${long.length})`);
});

console.log(`\nloadReport: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAILED: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
