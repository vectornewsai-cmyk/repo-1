/**
 * errorDetailSummary.ts — Dịch khung tóm tắt lỗi bridge (Phase 9 đợt 34 Q4).
 *
 * Bridge (đợt 28 L3) trả `summary` thô đã redact; từ đợt 34 Q4 nó kèm
 * thêm `summaryKey` + `summaryParams` (xem server/bridge/src/errorDetail.js).
 * Hàm này dịch khung câu qua i18n key `errorDetail.summary.<summaryKey>`:
 *  - Payload cũ (không có summaryKey) → trả nguyên summary thô.
 *  - Key chưa có trong dict (bridge mới hơn web, hoặc key lạ) → hàm t()
 *    trả về chính key → fallback về summary thô, không bao giờ hiện key.
 *  - Tham số thiếu khiến template còn sót `{var}` (t() giữ nguyên
 *    `{var}` khi vars thiếu), hoặc tham số rỗng khiến câu kết thúc
 *    lửng (dấu ":" trơ trọi, chuỗi rỗng) → fallback về summary thô,
 *    không hiện placeholder hay câu dở dang nửa vời.
 *  - Params rỗng mà template không cần var (workerExitNoOutput, unknown)
 *    → dịch bình thường.
 *
 * Các dòng validator/ffmpeg trong `details`/`redactedTail` KHÔNG qua đây:
 * chúng là dữ liệu, giữ nguyên văn như trước (xem LIMITS đợt 34 Q4).
 * Hàm thuần, không import React/i18n — test được bằng Node trực tiếp
 * với một hàm t() giả lập đúng quy ước của i18n/index.ts.
 */
export interface StructuredErrorDetail {
  code: string;
  summary: string;
  summaryKey?: string;
  summaryParams?: Record<string, string>;
  details: string[];
  detailsOmitted: number;
  redactedTail: string;
}

export function localizedErrorSummary(
  detail: StructuredErrorDetail,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  if (!detail.summaryKey) return detail.summary;
  const key = `errorDetail.summary.${detail.summaryKey}`;
  const translated = t(key, detail.summaryParams ?? {});
  if (
    translated === key ||
    translated.includes("{") ||
    translated.trim() === "" ||
    /:\s*$/.test(translated)
  ) {
    return detail.summary;
  }
  return translated;
}
