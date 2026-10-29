/**
 * nestedRejection.ts — Detector + câu báo dùng chung cho việc nested clip
 * bị split/trim từ chối vì mang speedKeyframes / reverse.
 *
 * NGUỒN GỐC (đợt 18, panel-only): NestedClipPanel từng giữ bản detector
 * và câu báo hardcode tiếng Việt riêng; đợt 19 G3 tách ra đây để panel
 * và store dùng CHUNG một điều kiện, tránh hai bản lệch nhau khi spec
 * đổi field (rủi ro duck-typing đã ghi ở LIMITS đợt 18 §4.5).
 *
 * ĐIỀU KIỆN — ĐỢT 21 T3 (thay điều kiện đợt 19 G3, xem
 * docs/PHASE9_ROUND21_T3_DETECTOR_I18N_LIMITS.md):
 * - Clip phải là nested (kind === "nested", có subSpec — cùng điều kiện
 *   isNestedClip) thì mới xét. Clip thường (video/text/...) mang
 *   speedKeyframes KHÔNG bị tính — split video có đường cong là hợp lệ.
 * - reverse === true LUÔN bị từ chối (render cấm hoàn toàn, spec đợt 18
 *   §1.4), có hay không có curve cũng vậy. reverse: false KHÔNG bị tính.
 * - speedKeyframes CHỈ bị từ chối khi curve KHÔNG HỢP LỆ. Từ đợt 20 R2,
 *   split/trim nested mang ramp HỢP LỆ đã đi đường ánh xạ τ
 *   (splitNestedClip/trimNestedClip trong nestUtils) nên ramp hợp lệ
 *   KHÔNG còn là lý do từ chối — detector cũ liệt kê mọi speedKeyframes
 *   là vi phạm nay đã sai. Ramp hợp lệ nghĩa là, theo đúng luật render
 *   (server/render/src/nested.js validateNestedRamp + finishWindow, và
 *   validator đợt 20 R3):
 *     + object { keyframes: [...] }, 1–128 keyframe;
 *     + mỗi keyframe: t hữu hạn trong [0, duration] (dung sai float
 *       1e-9, như EPS của render), v hữu hạn trong [0.25, 4], easing
 *       thuộc linear | ease-in | ease-out | bezier, bezier (nếu có)
 *       là [x1, y1, x2, y2] hữu hạn với x1, x2 trong [0, 1] (y tự do);
 *     + tích phân sourcePosAt(curve, duration) tính được, hữu hạn
 *       (duration phải hữu hạn và > 0);
 *     + nếu ghi trim tường minh thì phải khớp bất biến render §1.3:
 *       |trim.out − (trim.in + ∫)| ≤ 1e-4, trim.in hữu hạn ≥ 0,
 *       trim.out hữu hạn > trim.in. Không ghi trim thì cửa sổ hiệu
 *       dụng là [in, in + ∫) nên luôn khớp theo cấu tạo.
 *   Không kiểm tra thêm: keyframe không cần sắp xếp (render chuẩn hoá
 *   sort + gộp trùng t), tốc độ đánh giá giữa đoạn bezier có overshoot
 *   cũng không xét (render chỉ kiểm tra v tại keyframe, xem LIMITS T3).
 *
 * LÝ DO TỪNG CASE (NestedCurveRejectionReason): curveEmpty (mảng rỗng),
 * curveShape (sai hình dạng: không phải object, keyframes không phải
 * mảng, quá 128 keyframe, keyframe không phải object, t/easing/bezier
 * không hợp lệ, v không hữu hạn), curveRange (v hữu hạn nhưng ngoài
 * [0.25, 4]), curveIntegral (không tính được tích phân: duration không
 * hợp lệ, sourcePosAt throw hoặc trả về không hữu hạn),
 * curveWindow (trim tường minh lệch tích phân hoặc trim không hợp lệ).
 * Thứ tự kiểm tra cố định theo đúng thứ tự này (quét keyframe theo thứ
 * tự mảng; mỗi keyframe xét shape trước rồi mới xét range) để cùng một
 * clip luôn cho cùng một lý do.
 *
 * CÂU BÁO qua i18n (key nested.speedRejected + 3 key fix + các key
 * reason): hàm nhận translate function để cả panel (React, i18nT) và
 * store (i18nT thuần) dùng chung mà không phụ thuộc React. Biến {fields}
 * nối bằng " + ", {fix} chọn theo tổ hợp field — đúng 3 nhánh của bản
 * hardcode đợt 18, {reason} là lý do cấm thật của case đó.
 *
 * HAI DẠNG GỌI — đọc kỹ trước khi nối dây (xem LIMITS T3 §3):
 * - Dạng cũ (fields-only): nestedSpeedRejectionMessage(i18nT, name,
 *   fields) — store notify + panel vẫn gọi dạng này. Với field curve,
 *   lý do chỉ nói chung là "curve không hợp lệ" kèm liệt kê mọi nguyên
 *   nhân có thể (vì chỉ có fields thì không biết curve hỏng ở đâu),
 *   không nêu sai nguyên nhân cụ thể nào. Với field reverse thì lý do
 *   đã chính xác hoàn toàn.
 * - Dạng mới (clip-aware): nestedSpeedRejectionMessageForClip(i18nT,
 *   clip, name) — phân loại từ clip thật nên nêu đúng lý do từng case
 *   (rỗng / sai hình / vượt biên / không tính được / lệch cửa sổ).
 *   Muốn toast store/panel nêu đúng lý do chi tiết thì phải nối dây
 *   call site sang dạng mới (1 dòng mỗi chỗ); T3 không tự sửa store
 *   notify hay panel (ngoài phạm vi sở hữu, panel đang do luồng T4
 *   giữ trong đợt 21) nên việc nối dây đó để lại cho parent/T4.
 */
import { sourcePosAt, type SpeedCurve } from "@repo-1/video-spec";

export type NestedTranslate = (
  key: string,
  vars?: Record<string, string>,
) => string;

/** Lý do curve bị từ chối (null = curve hợp lệ hoặc không có curve). */
export type NestedCurveRejectionReason =
  | "curveEmpty"
  | "curveShape"
  | "curveRange"
  | "curveIntegral"
  | "curveWindow";

/** Kết quả phân loại đầy đủ cho một clip. */
export interface NestedSpeedRejection {
  /** Field hiển thị (tương thích dạng cũ): "speedKeyframes" và/hoặc "reverse". */
  fields: string[];
  /** true khi reverse === true (bất kể curve hợp lệ hay không). */
  reverse: boolean;
  /** Lý do curve bị cấm; null khi không có curve hoặc curve hợp lệ. */
  curveReason: NestedCurveRejectionReason | null;
}

const SPEED_MIN = 0.25;
const SPEED_MAX = 4;
const MAX_KEYFRAMES = 128;
const WINDOW_TOL = 1e-4;
const TIME_TOL = 1e-9;
const EASINGS = ["linear", "ease-in", "ease-out", "bezier"] as const;

/** Key i18n cho từng lý do curve (đủ vi/en, xem dict i18n). */
export function nestedCurveRejectionReasonKey(
  reason: NestedCurveRejectionReason,
): string {
  switch (reason) {
    case "curveEmpty":
      return "nested.speedRejectedReasonCurveEmpty";
    case "curveShape":
      return "nested.speedRejectedReasonCurveShape";
    case "curveRange":
      return "nested.speedRejectedReasonCurveRange";
    case "curveIntegral":
      return "nested.speedRejectedReasonCurveIntegral";
    case "curveWindow":
      return "nested.speedRejectedReasonCurveWindow";
  }
}

/**
 * Phân loại curve của clip nested. Trả null khi không có curve hoặc
 * curve hợp lệ; trả lý do khi curve bị cấm. Chỉ xét hình dạng +
 * tích phân + cửa sổ trim, KHÔNG xét lá bên trong hay hai tầng
 * (hai tầng là việc của patchClip, không phải của split/trim).
 */
function classifyCurve(
  curve: unknown,
  clip: Record<string, unknown>,
): NestedCurveRejectionReason | null {
  if (typeof curve !== "object" || curve === null) return "curveShape";
  const keyframes = (curve as { keyframes?: unknown }).keyframes;
  if (!Array.isArray(keyframes)) return "curveShape";
  if (keyframes.length === 0) return "curveEmpty";
  if (keyframes.length > MAX_KEYFRAMES) return "curveShape";
  const duration = clip["duration"];
  const durationOk =
    typeof duration === "number" &&
    Number.isFinite(duration) &&
    duration > 0;
  for (const kf of keyframes) {
    if (typeof kf !== "object" || kf === null) return "curveShape";
    const k = kf as Record<string, unknown>;
    const t = k["t"];
    const v = k["v"];
    const easing = k["easing"];
    if (typeof t !== "number" || !Number.isFinite(t)) return "curveShape";
    if (durationOk && (t < 0 || t > (duration as number) + TIME_TOL)) {
      return "curveShape";
    }
    if (typeof easing !== "string" || !(EASINGS as readonly string[]).includes(easing)) {
      return "curveShape";
    }
    if (easing === "bezier") {
      const b = k["bezier"];
      if (
        !Array.isArray(b) ||
        b.length !== 4 ||
        !b.every((x) => typeof x === "number" && Number.isFinite(x)) ||
        (b[0] as number) < 0 ||
        (b[0] as number) > 1 ||
        (b[2] as number) < 0 ||
        (b[2] as number) > 1
      ) {
        return "curveShape";
      }
    }
    if (typeof v !== "number" || !Number.isFinite(v)) return "curveShape";
    if (v < SPEED_MIN || v > SPEED_MAX) return "curveRange";
  }
  if (!durationOk) return "curveIntegral";
  let consumed: number;
  try {
    // Tới đây mọi keyframe đã qua kiểm tra shape/range nên cast về
    // SpeedCurve là an toàn (easing đã thuộc 4 giá trị hợp lệ).
    consumed = sourcePosAt(curve as SpeedCurve, duration as number);
  } catch {
    return "curveIntegral";
  }
  if (!Number.isFinite(consumed)) return "curveIntegral";
  // Cửa sổ trim tường minh phải khớp bất biến render §1.3 (mirror
  // nestedCurveWindow trong nestUtils: chỉ kiểm tra khi ghi trim).
  const trim = clip["trim"];
  if (trim !== undefined) {
    if (typeof trim !== "object" || trim === null) return "curveWindow";
    const tin = (trim as Record<string, unknown>)["in"];
    const tout = (trim as Record<string, unknown>)["out"];
    if (
      typeof tin !== "number" ||
      !Number.isFinite(tin) ||
      tin < 0 ||
      typeof tout !== "number" ||
      !Number.isFinite(tout) ||
      tout <= tin ||
      Math.abs(tout - (tin + consumed)) > WINDOW_TOL
    ) {
      return "curveWindow";
    }
  }
  return null;
}

/** Phân loại đầy đủ: field nào, có reverse không, curve hỏng vì sao. */
export function classifyNestedSpeedRejection(
  clip: unknown,
): NestedSpeedRejection {
  const none: NestedSpeedRejection = {
    fields: [],
    reverse: false,
    curveReason: null,
  };
  if (!clip || typeof clip !== "object") return none;
  const rec = clip as Record<string, unknown>;
  if (rec["kind"] !== "nested" || rec["subSpec"] === undefined) return none;
  const reverse = rec["reverse"] === true;
  const curve = rec["speedKeyframes"];
  const curveReason =
    curve === undefined ? null : classifyCurve(curve, rec);
  const fields: string[] = [];
  if (curveReason !== null) fields.push("speedKeyframes");
  if (reverse) fields.push("reverse");
  return { fields, reverse, curveReason };
}

/**
 * Field nào trên clip khiến split/trim nested bị từ chối. Trả [] khi
 * clip không phải nested, không mang field nào, hoặc chỉ mang ramp
 * HỢP LỆ (đợt 21 T3: ramp hợp lệ được phép, khác detector đợt 19 G3).
 */
export function nestedSpeedRejectionFields(clip: unknown): string[] {
  return classifyNestedSpeedRejection(clip).fields;
}

/** Cụm lý do cấm cho câu báo, từ fields (+ lý do curve chi tiết nếu có). */
function rejectionReasonText(
  translate: NestedTranslate,
  fields: string[],
  curveReason: NestedCurveRejectionReason | null,
): string {
  const hasReverse = fields.includes("reverse");
  const hasCurve = fields.includes("speedKeyframes");
  if (hasReverse && hasCurve) {
    if (curveReason !== null) {
      return (
        translate("nested.speedRejectedReasonReverse") +
        translate("nested.speedRejectedReasonJoin") +
        translate(nestedCurveRejectionReasonKey(curveReason))
      );
    }
    return translate("nested.speedRejectedReasonBoth");
  }
  if (hasReverse) return translate("nested.speedRejectedReasonReverse");
  if (hasCurve) {
    return curveReason !== null
      ? translate(nestedCurveRejectionReasonKey(curveReason))
      : translate("nested.speedRejectedReasonCurve");
  }
  return "";
}

/**
 * Câu báo đầy đủ: field nào, lý do cấm thật, cách gỡ. Trả "" khi
 * không vi phạm. Tham số curveReason chỉ dùng khi caller đã phân loại
 * từ clip thật (dạng mới); bỏ trống thì lý do curve nói chung (dạng
 * cũ, vẫn đúng vì liệt kê mọi nguyên nhân có thể, không nêu sai).
 */
export function nestedSpeedRejectionMessage(
  translate: NestedTranslate,
  name: string,
  fields: string[],
  curveReason?: NestedCurveRejectionReason | null,
): string {
  if (fields.length === 0) return "";
  const fixKey =
    fields.length > 1
      ? "nested.speedRejectedFixBoth"
      : fields[0] === "reverse"
        ? "nested.speedRejectedFixReverse"
        : "nested.speedRejectedFixCurve";
  return translate("nested.speedRejected", {
    name,
    fields: fields.join(" + "),
    reason: rejectionReasonText(translate, fields, curveReason ?? null),
    fix: translate(fixKey),
  });
}

/**
 * Câu báo từ clip thật: phân loại rồi nêu đúng lý do từng case.
 * Trả "" khi clip không bị từ chối (kể cả ramp hợp lệ).
 */
export function nestedSpeedRejectionMessageForClip(
  translate: NestedTranslate,
  clip: unknown,
  name: string,
): string {
  const c = classifyNestedSpeedRejection(clip);
  return nestedSpeedRejectionMessage(translate, name, c.fields, c.curveReason);
}
