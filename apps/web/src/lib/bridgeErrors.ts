/**
 * bridgeErrors.ts — Dịch lỗi API bridge sang chuỗi i18n (Phase 9 đợt 62 R5).
 *
 * Bridge (đợt 62 R5, server/bridge/src/errorCodes.js) trả lỗi dạng
 *   { error, errorCode, errorParams? }
 *  - `error`: chuỗi VI cũ (client cũ hiển thị như trước).
 *  - `errorCode`: mã ổn định trong BRIDGE_ERROR_CODES.
 *  - `errorParams`: tham số rời (toàn string) cho template.
 * Hàm này dịch mã → key `bridgeErrors.<CODE>` qua dict (fragment
 * round62-r5, parent gộp vào vi.json/en.json sau — 11 mã TASK_* đợt 63 R5
 * nằm trong fragment round63-r5, cùng quy ước):
 *  - Mã có trong catalog → dịch bằng t(), tham số từ errorParams.
 *  - Mã lạ / thiếu param (template còn sót `{var}`) / bản dịch rỗng /
 *    câu dở dang (kết thúc bằng ":") → rớt xuống errorDetail.summary
 *    (nếu có) rồi tới chuỗi `error` cũ — không bao giờ hiện key hay
 *    placeholder ra UI (mẫu localizedErrorSummary đợt 34 Q4).
 *  - Payload cũ (không có errorCode) → `error` nguyên vẹn.
 *
 * errorDetail (render job / tác vụ đồng bộ, đợt 28/29) vẫn đi đường
 * riêng: summaryKey → localizedErrorSummary. Thứ tự ưu tiên:
 * mã bridgeErrors → summary errorDetail → chuỗi error cũ → fallback
 * của caller. Riêng ExportPanel poll job: detail panel đã hiển thị
 * summary nên poll truyền { useErrorDetailSummary: false } để dòng
 * lỗi chính không lặp lại summary (chỉ mã bridgeErrors — vd job
 * phục hồi sau restart — mới dịch ở dòng chính).
 *
 * Hàm thuần, không import React/i18n — test được bằng Node trực tiếp
 * với một hàm t() giả lập đúng quy ước của i18n/index.ts.
 */
import {
  localizedErrorSummary,
  type StructuredErrorDetail,
} from "./errorDetailSummary";

export interface BridgeApiErrorBody {
  error?: unknown;
  errorCode?: unknown;
  errorParams?: unknown;
  errorDetail?: StructuredErrorDetail | null;
}

export type BridgeErrorTranslator = (
  key: string,
  vars?: Record<string, string>,
) => string;

/**
 * Tập mã lỗi API bridge — KHỚP 1:1 với BRIDGE_ERROR_CODES ở
 * server/bridge/src/errorCodes.js và key `bridgeErrors.*` trong
 * fragment round62-r5 (91 mã) + fragment round63-r5 (11 mã TASK_*)
 * + fragment round84-l8 (6 mã TTS_CLONED_VOICE_*).
 * Test bridgeErrors62R5 khóa 3 chiều này (đọc cả 3 fragment).
 * KHÔNG chứa mã phân loại render của errorDetail.js
 * (SPEED_CURVE_VIOLATION, MISSING_ASSET, SPEC_VALIDATION, OUTPUT_QA,
 * WORKER_START, WORKER_EXIT, FFMPEG_ERROR, UNKNOWN) — các mã đó đi
 * qua errorDetail.summary.*, không qua bridgeErrors.*.
 */
export const BRIDGE_ERROR_CODES: ReadonlySet<string> = new Set([
  "API_NOT_FOUND",
  "ASSETMAP_BAD_VALUE",
  "ASSETMAP_INVALID",
  "ASSETMAP_NOT_OBJECT",
  "BEATS_NEEDS_AV",
  "BEATS_NOT_READY",
  "BGREMOVE_FEATHER_INVALID",
  "BGREMOVE_NEEDS_VIDEO",
  "BGREMOVE_NOT_READY",
  "BGREMOVE_SESSION_FORBIDDEN",
  "BGREMOVE_SESSION_INVALID",
  "BGREMOVE_TEMPORAL_INVALID",
  "BPM_INVALID",
  "BPM_RANGE_INVALID",
  "CAPTION_NEEDS_AV",
  "CAPTION_NOT_READY",
  "DISK_LOW",
  "INTERNAL_ERROR",
  "INVALID_FILENAME",
  "INVALID_FILENAME_OR_TYPE",
  "INVALID_JOB_ID",
  "INVALID_LUT_ID",
  "JOB_CANCEL_BAD_STATE",
  "JOB_CREATE_FAILED",
  "JOB_GONE",
  "JOB_INTERRUPTED_BY_RESTART",
  "JOB_NOT_DONE",
  "JOB_NOT_FOUND",
  "JOB_RETRY_BAD_STATE",
  "JOB_RETRY_CANCELLED",
  "JOB_SPEC_MISSING_AFTER_RESTART",
  "LUT_NOT_FOUND",
  "MAGIC_MISMATCH",
  "MAGIC_TOO_SMALL",
  "MAGIC_UNREADABLE",
  "MISSING_AUDIO_VIDEO",
  "MISSING_MEDIA",
  "MISSING_SPEC",
  "MISSING_VIDEO",
  "OPENAPI_READ_FAILED",
  "PRESET_BITRATE_RANGE",
  "PRESET_CRF_RANGE",
  "PRESET_NORMALIZE_INVALID",
  "PRESET_NORMALIZE_LRA_RANGE",
  "PRESET_NORMALIZE_TARGET_RANGE",
  "PRESET_NORMALIZE_TP_RANGE",
  "PRESET_NOT_JSON",
  "PRESET_NOT_OBJECT",
  "PRESET_X264_INVALID",
  "PROXY_BAD_HEIGHT",
  "PROXY_INVALID_NAME",
  "PROXY_MISSING_FILE",
  "PROXY_NOT_FOUND",
  "QUEUE_FULL",
  "RATE_LIMITED",
  "READ_OUTPUT_FAILED",
  "REFRAME_NEEDS_VIDEO",
  "REFRAME_NOT_READY",
  "SAVE_FILE_FAILED",
  "SAVE_SPEC_FAILED",
  "SCENE_END_INVALID",
  "SCENE_NEEDS_VIDEO",
  "SCENE_NOT_READY",
  "SCENE_RANGE_INVALID",
  "SCENE_START_INVALID",
  "SCENE_THRESHOLD_INVALID",
  "SILENCE_MINDUR_INVALID",
  "SILENCE_NEEDS_AV",
  "SILENCE_NOT_READY",
  "SILENCE_NOISE_INVALID",
  "SPEC_NOT_JSON",
  "SPEC_NO_TRACKS",
  "SPEC_TOO_LARGE",
  "TASK_BEATS_FAILED",
  "TASK_BGREMOVE_FAILED",
  "TASK_CAPTION_FAILED",
  "TASK_PROXY_FAILED",
  "TASK_REFRAME_ANALYZE_FAILED",
  "TASK_REFRAME_FAILED",
  "TASK_SCENE_FAILED",
  "TASK_SILENCE_FAILED",
  "TASK_TRANSLATE_FAILED",
  "TASK_TTS_CLONE_FAILED",
  "TASK_TTS_FAILED",
  "TRANSLATE_NEEDS_AV",
  "TRANSLATE_NOT_READY",
  "TTS_CLONED_VOICE_LIMIT", // Đợt 84 L8: giọng đã clone lưu lại được
  "TTS_CLONED_VOICE_NAME_DUP", // Đợt 84 L8
  "TTS_CLONED_VOICE_NAME_EMPTY", // Đợt 84 L8
  "TTS_CLONED_VOICE_NAME_TOO_LONG", // Đợt 84 L8
  "TTS_CLONED_VOICE_NOT_FOUND", // Đợt 84 L8
  "TTS_CLONED_VOICE_REGISTRY", // Đợt 84 L8
  "TTS_NOT_READY",
  "TTS_NO_WAV",
  "TTS_PREPARE_FAILED",
  "TTS_REF_AUDIO_MISSING",
  "TTS_REF_AUDIO_TOO_LARGE",
  "TTS_REF_AUDIO_TYPE",
  "TTS_TEXT_EMPTY",
  "TTS_TEXT_TOO_LONG",
  "UNSUPPORTED_ASPECT",
  "UNSUPPORTED_LANG",
  "UNSUPPORTED_TARGET_LANG",
  "UNSUPPORTED_VOICE",
  "UPLOAD_FILE_TOO_LARGE",
  "UPLOAD_INVALID",
  "UPLOAD_TOO_MANY_FILES",
  "UPLOAD_TOTAL_TOO_LARGE",
]);

/** Ép errorParams (unknown, có thể lẫn số) về Record<string,string>. */
function coerceParams(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}

export function resolveBridgeApiError(
  body: BridgeApiErrorBody | null | undefined,
  t: BridgeErrorTranslator,
  fallback: string,
  opts?: { useErrorDetailSummary?: boolean },
): string {
  const useDetail = opts?.useErrorDetailSummary !== false;
  if (body && typeof body.errorCode === "string" && BRIDGE_ERROR_CODES.has(body.errorCode)) {
    const key = `bridgeErrors.${body.errorCode}`;
    const translated = t(key, coerceParams(body.errorParams));
    // t() trả về chính key khi key chưa có trong dict (fragment chưa
    // gộp / bridge mới hơn web) → rớt xuống chuỗi cũ, không hiện key.
    if (
      translated !== key &&
      !translated.includes("{") &&
      translated.trim() !== "" &&
      !/:\s*$/.test(translated)
    ) {
      return translated;
    }
  }
  if (useDetail && body?.errorDetail) {
    return localizedErrorSummary(body.errorDetail, t);
  }
  if (body && typeof body.error === "string" && body.error.trim() !== "") {
    return body.error;
  }
  return fallback;
}
