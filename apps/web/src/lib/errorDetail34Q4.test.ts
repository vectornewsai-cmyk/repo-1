/**
 * errorDetail34Q4.test.ts — Test khóa đợt 34 luồng Q4: web dịch khung
 * tóm tắt lỗi bridge qua summaryKey + summaryParams.
 *
 * Chỉ test hàm thuần localizedErrorSummary (Node type-stripping, từ gốc
 * repo): node apps/web/src/lib/errorDetail34Q4.test.ts
 *
 * Phạm vi test:
 * - Curve parse được: vi/en dịch khung đúng từng chữ, giữ tham số rời.
 * - Câu đóng khung (exit code, signal, no-output): dịch trọn vẹn.
 * - Payload bridge cũ (không summaryKey) → summary thô nguyên vẹn.
 * - summaryKey lạ / thiếu param (còn {var}) / detail rỗng (câu dở dang
 *   kết thúc bằng ":") → fallback về summary thô, không hiện key hay
 *   placeholder.
 * - i18n: 13 key errorDetail.summary có mặt cả vi lẫn en (parity toàn
 *   dict 2767 key đã khóa (+249 key đợt 93 U5: 5 sticker.cat.* + 244 sticker.item.*; +1 key đợt 92 T5: sticker.title; +1 key đợt 91 S5: motionTrack.title; +1 key đợt 88 P6: validation.TRACK_IMAGE_MASK; +7 key đợt 87 O5: 4 mask.* + 3 motionTrack.*; +1 key closing: motionTrack.maskStillFollows; +11 key đợt 85 M7: tts.* export/import giọng; +7 key đợt 85 M8: mediabin.proxy* progress/retry; +2 key đợt 84 L9: mediabin.proxyHeightLabel + mediabin.proxyNoOriginalFile; +24 key đợt 84 L8: 18 tts.* + 6 bridgeErrors.*; +2 key đợt 81 I6: aiJob.etaEstimating + aiJob.etaHours; +10 key đợt 80 H7: 4 reverseGate.* + 6 rehydrate.*; +9 key đợt 80 H10 (social presets); +17 key aiJob.*; +6 key đợt 79 G9: 5 openProject.archiveHistory* + 1 captions.trackLabel; +6 key exportPanel.aspectFit* đợt 76 D9; +8 key mediabin.codec* đợt 75 C6; +1 key mediabin.codecUnsupported đợt 74 B3; +131 key fragment đợt 63 − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI; +7 key fragment đợt 64 + 1 key parent + 14 key fragment đợt 65 (S2 1 + S4 10 + S6 1 + S8 2) + 29 key fragment đợt 66 (T7 27 + T8 2) + 43 key fragment đợt 67 (U6 28 + U7 15); +102 key đợt 62; +72 key fragment đợt 61: R2 3 + R5 1 + R6 50 + R9 18) ở structuredNotes32/saveToast31 (1011 đợt 55 L1 + 711 key đợt 56 + 215 key đợt 57 + 5 key đợt 58 + 15 key đợt 59 − 14 key mồ côi + 26 key fragment P7 đợt 60 Q4 + 72 key đợt 61 + 131 key đợt 63 − 1 key chết − 1 key jobNote chưa có UI).
 *
 * Không test render React (ExportPanel — như mọi đợt trước): wiring
 * khóa bằng tsc 0 lỗi + vite build pass.
 */
import { readFileSync } from "node:fs";
import {
  localizedErrorSummary,
  type StructuredErrorDetail,
} from "./errorDetailSummary.ts";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}
function eq(a: unknown, b: unknown, label: string): void {
  ok(a === b, `${label} (nhận: ${JSON.stringify(a)})`);
}

function flatten(dict: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  const obj = dict as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") {
      for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
    } else out.set(key, v as string);
  }
  return out;
}

function makeT(dict: Map<string, string>, fallback: Map<string, string>) {
  return (key: string, vars?: Record<string, string>): string => {
    const raw = dict.get(key) ?? fallback.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
  };
}

const viDict = flatten(
  JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")),
);
const enDict = flatten(
  JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")),
);

const curveDetail: StructuredErrorDetail = {
  code: "SPEED_CURVE_VIOLATION",
  summary:
    "Vi phạm speed-curve: 1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)",
  summaryKey: "speedCurveViolation",
  summaryParams: {
    clip: "tracks[0].clips[0]",
    field: "speedKeyframes.keyframes[0].v",
    range: "0.25..4",
    value: "5",
  },
  details: [],
  detailsOmitted: 0,
  redactedTail: "",
};

console.log("== dịch khung: curve + câu đóng khung ==");
eq(
  localizedErrorSummary(curveDetail, makeT(viDict, viDict)),
  "Vi phạm speed-curve: tracks[0].clips[0] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)",
  "vi: curve dịch khung, giữ tham số",
);
eq(
  localizedErrorSummary(curveDetail, makeT(enDict, viDict)),
  "Speed-curve violation: tracks[0].clips[0] speedKeyframes.keyframes[0].v must be in 0.25..4 (got: 5)",
  "en: curve dịch khung, giữ tham số",
);
eq(
  localizedErrorSummary(
    {
      code: "WORKER_EXIT",
      summary: "Render worker thoát với mã 3.",
      summaryKey: "workerExitCode",
      summaryParams: { exitCode: "3" },
      details: [],
      detailsOmitted: 0,
      redactedTail: "",
    },
    makeT(enDict, viDict),
  ),
  "Render worker exited with code 3.",
  "en: exit code dịch trọn vẹn",
);
eq(
  localizedErrorSummary(
    {
      code: "WORKER_EXIT",
      summary: "Render worker bị kill bởi signal SIGTERM.",
      summaryKey: "workerExitSignal",
      summaryParams: { signal: "SIGTERM" },
      details: [],
      detailsOmitted: 0,
      redactedTail: "",
    },
    makeT(viDict, viDict),
  ),
  "Render worker bị kill bởi signal SIGTERM.",
  "vi: signal dịch trọn vẹn",
);
eq(
  localizedErrorSummary(
    {
      code: "WORKER_EXIT",
      summary: "Render worker thoát mã 0 nhưng không tạo được file output.",
      summaryKey: "workerExitNoOutput",
      summaryParams: {},
      details: [],
      detailsOmitted: 0,
      redactedTail: "",
    },
    makeT(enDict, viDict),
  ),
  "Render worker exited with code 0 but produced no output file.",
  "en: no-output dịch trọn vẹn, không cần param",
);

console.log("== fallback: payload cũ / key lạ / thiếu param / detail rỗng ==");
const oldPayload: StructuredErrorDetail = { ...curveDetail };
delete oldPayload.summaryKey;
delete oldPayload.summaryParams;
eq(
  localizedErrorSummary(oldPayload, makeT(viDict, viDict)),
  oldPayload.summary,
  "payload cũ không summaryKey → summary thô",
);
eq(
  localizedErrorSummary(
    { ...curveDetail, summaryKey: "khongCoKeyNay", summaryParams: {} },
    makeT(viDict, viDict),
  ),
  curveDetail.summary,
  "summaryKey lạ → summary thô, không hiện key",
);
eq(
  localizedErrorSummary(
    {
      ...curveDetail,
      summaryParams: { clip: "tracks[0].clips[0]" },
    },
    makeT(viDict, viDict),
  ),
  curveDetail.summary,
  "thiếu param (còn {var}) → summary thô",
);
eq(
  localizedErrorSummary(
    {
      code: "OUTPUT_QA",
      summary: "Kiểm tra chất lượng output thất bại: duration lệch",
      summaryKey: "outputQa",
      summaryParams: { detail: "" },
      details: [],
      detailsOmitted: 0,
      redactedTail: "",
    },
    makeT(viDict, viDict),
  ),
  "Kiểm tra chất lượng output thất bại: duration lệch",
  "detail rỗng (câu dở dang) → summary thô",
);

console.log("== i18n: 13 key errorDetail.summary cả hai bên ==");
const expected = [
  "speedCurveViolation",
  "speedCurveViolationRaw",
  "missingAsset",
  "missingAssetRaw",
  "specValidation",
  "outputQa",
  "workerStart",
  "workerExitNoOutput",
  "workerExitSignal",
  "workerExitCode",
  "ffmpegError",
  "unknownDetail",
  "unknown",
];
for (const key of expected) {
  ok(viDict.has(`errorDetail.summary.${key}`), `vi có errorDetail.summary.${key}`);
  ok(enDict.has(`errorDetail.summary.${key}`), `en có errorDetail.summary.${key}`);
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
