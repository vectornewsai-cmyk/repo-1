/**
 * errorCodes.js — Giao thức mã lỗi bridge→web (Phase 9 đợt 62, luồng R5).
 *
 * Bối cảnh (đợt 61 R6 §4.1): toàn bộ literal API_ERROR/VALIDATION ở server
 * trả về UI qua HTTP/job/IPC chưa qua i18n — bridge index.js 85 API_ERROR
 * + 6 OTHER, jobQueue.js 12 API_ERROR + 10 OTHER (đếm lại bằng tokenizer
 * R6, xem docs/PHASE9_ROUND62_R5_BRIDGE_ERROR_PROTOCOL_LIMITS.md §1).
 * Server không có hạ tầng `t()` như web, nên nối thật cần giao thức mã
 * lỗi thay vì nối từng chuỗi: server trả mã ổn định + tham số, web dịch
 * bằng dict (`bridgeErrors.<CODE>`).
 *
 * SHAPE (mẫu errorDetail.js đợt 28/34 — field cũ giữ nguyên, field mới
 * cộng thêm, KHÔNG vỡ contract):
 *   { error, errorCode, errorParams? }
 *  - `error`: CHUỖI CŨ, giữ nguyên từng chữ — client cũ (không biết mã)
 *    hiển thị như trước, không hồi quy.
 *  - `errorCode`: mã ổn định trong BRIDGE_ERROR_CODES dưới đây.
 *  - `errorParams`: tham số rời (toàn string) để web thay vào template
 *    i18n; chỉ kèm khi có tham số.
 * Client mới: có errorCode hợp lệ → dịch qua dict, bỏ qua `error`;
 * không có code / code lạ → hiển thị `error` như cũ (xem
 * apps/web/src/lib/bridgeErrors.ts — resolveBridgeApiError).
 *
 * QUY ƯỚC:
 *  - Mã là SCREAMING_SNAKE, KHÔNG trùng mã phân loại render của
 *    errorDetail.js (SPEED_CURVE_VIOLATION, MISSING_ASSET,
 *    SPEC_VALIDATION, OUTPUT_QA, WORKER_START, WORKER_EXIT,
 *    FFMPEG_ERROR, UNKNOWN) — hai họ mã đi chung field `errorCode`
 *    ở payload khác nhau (job vs API) nên phải phân biệt được.
 *  - Mã jobQueue đã có sẵn (QUEUE_FULL, NOT_FOUND, BAD_STATE, GONE)
 *    được MAP sang mã catalog ở index.js, không đổi code gốc của
 *    jobQueue (CLI/MCP khác có thể đang dựa vào chúng).
 *  - errorParams CHỈ chứa dữ liệu hiển thị được (tên file, số, đuôi
 *    file, lý do đã redact ở nguồn) — KHÔNG bao giờ chứa đường dẫn
 *    tuyệt đối, token hay stack trace.
 *  - Validator throw bằng codedError(code, message, params): message
 *    giữ nguyên chuỗi cũ từng chữ (client cũ + log không đổi), code +
 *    params gắn thêm trên Error để route bắt qua apiErrorFrom.
 *
 * Không phụ thuộc bên ngoài (chỉ dùng node builtins).
 */
"use strict";

/**
 * Catalog mã lỗi API: code → danh sách tên tham số hợp lệ của mã đó.
 * Template vi/en nằm ở web: fragment round62-r5
 * (hidden_files/round62-r5-fragment.json, key `bridgeErrors.<CODE>`),
 * parent gộp vào vi.json/en.json sau. Tham số trong template KHỚP tên
 * trong danh sách này — test bridgeErrors62R5 khóa 3 chiều
 * (catalog server == fragment == web BRIDGE_ERROR_CODES).
 */
const BRIDGE_ERROR_CODES = {
  // Rate limit / upload (index.js: rateLimit, multerErrorHandler,
  // uploadMiddleware).
  RATE_LIMITED: ["retryAfter"],
  UPLOAD_FILE_TOO_LARGE: ["limitMb"],
  UPLOAD_TOO_MANY_FILES: [],
  UPLOAD_INVALID: [],
  UPLOAD_TOTAL_TOO_LARGE: ["limitMb"],
  // Job: id / tra cứu / huỷ / retry (index.js + jobQueue.js).
  INVALID_JOB_ID: [],
  JOB_NOT_FOUND: [],
  JOB_NOT_DONE: ["status"],
  JOB_CANCEL_BAD_STATE: ["status"],
  JOB_RETRY_BAD_STATE: ["status"],
  JOB_RETRY_CANCELLED: ["status"],
  JOB_GONE: [],
  JOB_SPEC_MISSING_AFTER_RESTART: [],
  JOB_INTERRUPTED_BY_RESTART: [],
  // Tạo render job: spec / assetMap / preset / đĩa / hàng đợi.
  MISSING_SPEC: [],
  SPEC_TOO_LARGE: ["limitMb"],
  ASSETMAP_NOT_OBJECT: [],
  ASSETMAP_BAD_VALUE: ["key"],
  ASSETMAP_INVALID: ["detail"],
  SPEC_NOT_JSON: [],
  SPEC_NO_TRACKS: [],
  DISK_LOW: ["freeMb"],
  JOB_CREATE_FAILED: [],
  QUEUE_FULL: ["maxQueue"],
  // Export preset (parsePreset).
  PRESET_NOT_JSON: [],
  PRESET_NOT_OBJECT: [],
  PRESET_CRF_RANGE: [],
  PRESET_X264_INVALID: ["allowed"],
  PRESET_BITRATE_RANGE: [],
  PRESET_NORMALIZE_INVALID: [],
  PRESET_NORMALIZE_TARGET_RANGE: [],
  PRESET_NORMALIZE_TP_RANGE: [],
  PRESET_NORMALIZE_LRA_RANGE: [],
  // Tên file / magic bytes (sanitizeFilename, checkMagicBytes).
  INVALID_FILENAME: ["name"],
  INVALID_FILENAME_OR_TYPE: ["name"],
  MAGIC_TOO_SMALL: ["name"],
  MAGIC_MISMATCH: ["name", "ext"],
  MAGIC_UNREADABLE: ["name"],
  // Lưu file / spec / đọc output.
  SAVE_FILE_FAILED: [],
  SAVE_SPEC_FAILED: [],
  READ_OUTPUT_FAILED: [],
  // Tác vụ: thiếu file / sai loại file.
  MISSING_MEDIA: [],
  MISSING_VIDEO: [],
  MISSING_AUDIO_VIDEO: [],
  CAPTION_NEEDS_AV: [],
  TRANSLATE_NEEDS_AV: [],
  SILENCE_NEEDS_AV: [],
  REFRAME_NEEDS_VIDEO: ["exts"],
  SCENE_NEEDS_VIDEO: ["exts"],
  BGREMOVE_NEEDS_VIDEO: ["exts"],
  BEATS_NEEDS_AV: ["exts"],
  // Tác vụ chưa sẵn sàng (model/script thiếu — reason là dữ liệu).
  CAPTION_NOT_READY: ["reason"],
  REFRAME_NOT_READY: ["reason"],
  BEATS_NOT_READY: ["reason"],
  BGREMOVE_NOT_READY: ["reason"],
  SILENCE_NOT_READY: ["reason"],
  SCENE_NOT_READY: ["reason"],
  TRANSLATE_NOT_READY: ["reason"],
  TTS_NOT_READY: ["reason"],
  // Validator tham số (caption/reframe/tts/beats).
  UNSUPPORTED_LANG: ["lang", "langs"],
  UNSUPPORTED_TARGET_LANG: ["lang", "langs"],
  UNSUPPORTED_ASPECT: ["aspect", "aspects"],
  // Validator tham số (bgremove/silence/scene — throw ở module tương ứng).
  BGREMOVE_SESSION_FORBIDDEN: ["session", "fallback"],
  BGREMOVE_SESSION_INVALID: ["value"],
  BGREMOVE_TEMPORAL_INVALID: ["value"],
  BGREMOVE_FEATHER_INVALID: ["value"],
  SILENCE_NOISE_INVALID: ["min", "max", "value"],
  SILENCE_MINDUR_INVALID: ["min", "max", "value"],
  SCENE_THRESHOLD_INVALID: ["value", "min", "max", "def"],
  SCENE_START_INVALID: ["value"],
  SCENE_END_INVALID: ["value"],
  SCENE_RANGE_INVALID: [],
  TTS_TEXT_EMPTY: [],
  TTS_TEXT_TOO_LONG: ["length", "max"],
  TTS_REF_AUDIO_MISSING: [],
  TTS_REF_AUDIO_TOO_LARGE: ["sizeMb"],
  TTS_REF_AUDIO_TYPE: ["exts"],
  // Đợt 84 L8 — giọng đã clone LƯU LẠI ĐƯỢC (tạo/dùng/xóa giọng clone).
  TTS_CLONED_VOICE_NAME_EMPTY: [],
  TTS_CLONED_VOICE_NAME_TOO_LONG: ["max", "length"],
  TTS_CLONED_VOICE_NAME_DUP: ["name"],
  TTS_CLONED_VOICE_LIMIT: ["max"],
  TTS_CLONED_VOICE_NOT_FOUND: [],
  TTS_CLONED_VOICE_REGISTRY: [],
  UNSUPPORTED_VOICE: ["voice", "voices"],
  BPM_INVALID: ["value"],
  BPM_RANGE_INVALID: [],
  // TTS chạy xong / chuẩn bị.
  TTS_NO_WAV: [],
  TTS_PREPARE_FAILED: [],
  // Đợt 63 R5 — mã fallback khi task error không có message thật: chuỗi
  // `error` lúc đó CHÍNH là chuỗi fallback (vd "Caption thất bại.") nên
  // gắn mã riêng để web dịch được; khi có message thật thì buildTaskError
  // giữ mã phân loại render của nó (FFMPEG_ERROR, UNKNOWN...), KHÔNG
  // dùng các mã này. Xem taskErrorPayload trong index.js.
  TASK_CAPTION_FAILED: [],
  TASK_REFRAME_FAILED: [],
  TASK_REFRAME_ANALYZE_FAILED: [],
  TASK_BEATS_FAILED: [],
  TASK_BGREMOVE_FAILED: [],
  TASK_SILENCE_FAILED: [],
  TASK_SCENE_FAILED: [],
  TASK_TRANSLATE_FAILED: [],
  TASK_TTS_FAILED: [],
  TASK_TTS_CLONE_FAILED: [],
  TASK_PROXY_FAILED: [],
  // Proxy / LUT / API chung.
  PROXY_MISSING_FILE: [],
  PROXY_BAD_HEIGHT: [],
  PROXY_INVALID_NAME: [],
  PROXY_NOT_FOUND: [],
  INVALID_LUT_ID: [],
  LUT_NOT_FOUND: [],
  API_NOT_FOUND: [],
  INTERNAL_ERROR: [],
  OPENAPI_READ_FAILED: [],
};

/** Danh sách mã (thứ tự ổn định) — test khóa 3 chiều dùng danh sách này. */
const BRIDGE_ERROR_CODE_LIST = Object.keys(BRIDGE_ERROR_CODES);

function isBridgeErrorCode(code) {
  return typeof code === "string" && Object.prototype.hasOwnProperty.call(BRIDGE_ERROR_CODES, code);
}

/** Ép mọi giá trị param về string (web t() chỉ nhận Record<string,string>). */
function normalizeParams(params) {
  if (!params || typeof params !== "object") return undefined;
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
    n++;
  }
  return n > 0 ? out : undefined;
}

/**
 * Body lỗi API: { error, errorCode, errorParams? }.
 * `message` là chuỗi cũ (giữ nguyên cho client cũ); `code` phải có trong
 * catalog — code lạ vẫn trả về nguyên vẹn (web fallback về `error`),
 * không throw để không biến lỗi 4xx thành 500.
 */
function apiError(code, message, params) {
  const body = { error: message, errorCode: code };
  const p = normalizeParams(params);
  if (p) body.errorParams = p;
  return body;
}

/**
 * Body lỗi từ Error đã throw: validator nào gắn code qua codedError thì
 * lấy code + params của nó; Error thường (không code) thì dùng
 * `fallbackCode` (nếu có — vd JSON.parse lỗi trong assetMap) kèm
 * `fallbackParams`, còn không thì chỉ trả { error } như cũ — KHÔNG bịa
 * mã. `fallbackMessage` (tùy chọn) ghi đè chuỗi `error` khi caller cần
 * giữ tiền tố cũ (vd "assetMap không hợp lệ: <message gốc>").
 */
function apiErrorFrom(err, fallbackMessage, fallbackCode, fallbackParams) {
  const message = fallbackMessage !== undefined
    ? fallbackMessage
    : err && err.message !== undefined ? String(err.message) : "Lỗi không xác định.";
  if (err && isBridgeErrorCode(err.code)) {
    return apiError(err.code, message, err.params);
  }
  if (fallbackCode && isBridgeErrorCode(fallbackCode)) {
    return apiError(fallbackCode, message, fallbackParams);
  }
  return { error: message };
}

/**
 * Tạo Error có gắn mã + params (dùng cho validator throw).
 * Message giữ nguyên chuỗi cũ từng chữ — client cũ + log không đổi.
 */
function codedError(code, message, params) {
  const err = new Error(message);
  err.code = code;
  const p = normalizeParams(params);
  if (p) err.params = p;
  return err;
}

module.exports = {
  BRIDGE_ERROR_CODES,
  BRIDGE_ERROR_CODE_LIST,
  isBridgeErrorCode,
  apiError,
  apiErrorFrom,
  codedError,
};
