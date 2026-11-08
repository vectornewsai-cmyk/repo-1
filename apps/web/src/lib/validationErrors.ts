/**
 * validationErrors.ts — Dịch từng dòng lỗi validator spec/media (Phase 9
 * đợt 63, luồng R5).
 *
 * Server (server/render/src/validate.js + validateCodes.js) trả lỗi spec
 * dạng chuỗi VI cũ "[where] message" trong `errors`, đồng thời ghi thêm
 * entry có cấu trúc { where, code, params } vào errorDetails; render
 * worker in chúng ra stderr dạng JSON, bridge bóc ra thành
 * errorDetail.validationDetails (xem server/bridge/src/errorDetail.js).
 * Hàm này dịch mỗi entry qua dict key `validation.<CODE>` (fragment
 * round63-r5, parent gộp vào vi.json/en.json sau):
 *  - Mã có trong fragment + đủ tham số → chuỗi đã dịch, giữ tiền tố
 *    "[where] " như chuỗi cũ.
 *  - Mã generic VALIDATION_DETAIL (chuỗi sub-validator chưa tách được,
 *    xem LIMITS R5 §1) → template `validation.detail` = "[{where}] {detail}"
 *    — hiển thị nguyên văn chuỗi VI cũ, không mất thông tin.
 *  - Key chưa có trong dict (fragment chưa gộp / bridge mới hơn web),
 *    template còn sót `{var}`, chuỗi rỗng → rớt về "[where] detail"
 *    nguyên văn — không bao giờ hiện key hay placeholder ra UI
 *    (mẫu resolveBridgeApiError đợt 62 R5).
 *
 * Hàm thuần, không import React/i18n — test được bằng Node trực tiếp
 * với một hàm t() giả lập đúng quy ước của i18n/index.ts.
 */
export interface ValidationDetailEntry {
  where?: unknown;
  code?: unknown;
  params?: unknown;
}

export type ValidationTranslator = (
  key: string,
  vars?: Record<string, string>,
) => string;

/** Mã generic — xem server/render/src/validateCodes.js. */
export const VALIDATION_DETAIL_CODE = "VALIDATION_DETAIL";

/** Ép params (unknown, có thể lẫn số) về Record<string,string>. */
function coerceParams(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}

/**
 * Dịch 1 entry thành 1 dòng hiển thị. Trả "" khi entry rỗng (caller lọc).
 * Không throw với entry hỏng hình dạng — rớt về detail thô / "".
 */
export function resolveValidationDetail(
  entry: ValidationDetailEntry | null | undefined,
  t: ValidationTranslator,
): string {
  if (!entry || typeof entry !== "object") return "";
  const where = typeof entry.where === "string" ? entry.where : "";
  const code = typeof entry.code === "string" ? entry.code : "";
  const params = coerceParams(entry.params);
  const detail = params.detail ?? "";
  if (code !== "" && code !== VALIDATION_DETAIL_CODE) {
    const key = `validation.${code}`;
    const translated = t(key, { ...params, where });
    if (
      translated !== key &&
      !translated.includes("{") &&
      translated.trim() !== ""
    ) {
      return translated;
    }
  }
  // Generic / fallback: "[where] detail" nguyên văn (template dịch
  // khung, detail giữ chuỗi VI cũ — thông tin không mất).
  // Đợt 63 R5: entry hoàn toàn rỗng (where + detail đều trống) thì trả
  // "" ngay — nếu không template "[{where}] {detail}" render ra "[] "
  // (trim vẫn còn "[]", không phải chuỗi rỗng).
  if (where.trim() === "" && detail.trim() === "") return "";
  const generic = t("validation.detail", { where, detail });
  if (
    generic !== "validation.detail" &&
    !generic.includes("{") &&
    generic.trim() !== ""
  ) {
    return generic;
  }
  if (detail.trim() === "") return "";
  return where ? `[${where}] ${detail}` : detail;
}

/** Dịch cả danh sách (bỏ dòng rỗng). Thứ tự giữ nguyên thứ tự server. */
export function resolveValidationDetails(
  details: ValidationDetailEntry[] | null | undefined,
  t: ValidationTranslator,
): string[] {
  if (!Array.isArray(details)) return [];
  const out: string[] = [];
  for (const d of details) {
    const line = resolveValidationDetail(d, t);
    if (line.trim() !== "") out.push(line);
  }
  return out;
}
