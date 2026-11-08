/**
 * Đợt 63 R5 — payload lỗi cho các route tác vụ (caption/reframe/tts/
 * bgremove/silence/scene/translate/proxy): tách từ server/bridge/src/index.js
 * để test đơn vị được mà không cần khởi động bridge (index.js listen
 * ngay khi require).
 *
 * `fallback` chỉ là chuỗi hiển thị khi task error KHÔNG có message thật
 * (e.message rỗng) — khi đó buildTaskError phân loại thành UNKNOWN và
 * `error` chính là chuỗi fallback. Gắn mã TASK_* (catalog errorCodes.js)
 * CHỈ trong trường hợp đó (và trong nhánh catch) để web dịch được
 * "Caption thất bại." → "Caption failed." thay vì hiện chuỗi VI.
 * Khi e CÓ message thật (dù phân loại được hay UNKNOWN), GIỮ NGUYÊN
 * errorCode/error của buildTaskError — không để mã generic nuốt mất
 * thông điệp cụ thể (vd tail ffmpeg).
 */
"use strict";

const { buildTaskError } = require("./errorDetail");

function taskErrorPayload(e, fallback, fallbackCode) {
  try {
    const raw = e && e.message ? String(e.message) : "";
    const built = buildTaskError({
      message: raw || fallback,
      stderr: e && e.stderrTail ? String(e.stderrTail) : "",
      exitCode: e && Number.isInteger(e.code) ? e.code : undefined,
      signal: e && e.signal ? String(e.signal) : null,
    });
    if (built.errorCode === "UNKNOWN" && !raw.trim() && fallbackCode) {
      return { error: built.error, errorCode: fallbackCode, errorDetail: built.errorDetail };
    }
    return { error: built.error, errorCode: built.errorCode, errorDetail: built.errorDetail };
  } catch {
    return { error: fallback, errorCode: fallbackCode || "UNKNOWN", errorDetail: null };
  }
}

module.exports = { taskErrorPayload };
