/**
 * publicJob.js — Serialize job record cho API (Phase 9 đợt 28, luồng L3).
 *
 * Tách từ server/bridge/src/index.js (hàm publicJob cũ, giữ nguyên mọi
 * field) để test được hành vi opt-in của errorDetail mà không cần khởi
 * động cả bridge server:
 *  - errorCode (enum như SPEED_CURVE_VIOLATION, FFMPEG_ERROR, ...) LUÔN
 *    kèm theo — mã enum không chứa đường dẫn hay secret nên an toàn.
 *  - errorDetail (summary + details + redactedTail đã redact) CHỈ kèm
 *    khi caller xin tường minh (includeDetail=true, tức
 *    GET /api/render/:id?detail=1). Mặc định (ExportPanel cũ, danh sách
 *    job) KHÔNG có field này — hành vi cũ không hồi quy.
 *  - _stderrTail thô, proc, _killTimer không bao giờ serialize (như cũ).
 */
"use strict";

function publicJob(j, includeDetail) {
  if (!j) return null;
  const out = {
    id: j.id,
    status: j.status,
    progress: Math.round(j.progress * 100) / 100,
    etaSeconds: j.etaSeconds == null ? null : Math.round(j.etaSeconds * 10) / 10, // R1-065
    queuePosition: j.queuePosition,
    attempts: j.attempts,
    error: j.error,
    errorCode: j.errorCode || null, // L3: mã lỗi có cấu trúc, an toàn luôn kèm
    outputName: j.outputName,
    outputSize: j.outputSize || null,
    createdAt: j.createdAt,
    startedAt: j.startedAt,
    finishedAt: j.finishedAt,
    recovered: !!j.recovered,
    note: j.note,
    noteCode: j.noteCode || null, // Đợt 63 R5: mã ổn định cho note phục hồi
    qaReport: j.qaReport || null, // R1-043: chi tiết kiểm tra output
  };
  // L3: detail đã redact chỉ đi ra khi caller xin tường minh.
  if (includeDetail && j.errorDetail) out.errorDetail = j.errorDetail;
  return out;
}

module.exports = { publicJob };
