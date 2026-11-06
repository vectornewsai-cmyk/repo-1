/**
 * nestedCurveCreate.ts — Đợt 21 T4: tạo speed curve MỚI cho nested clip
 * từ UI (đóng nợ LIMITS đợt 20 R4 §3: block chế độ của R4 chỉ hiện khi
 * clip ĐÃ mang curve, nested chưa có curve thì user không tạo được).
 *
 * Module thuần, KHÔNG React: panel (NestedClipPanel) và test bundle đều
 * import từ đây nên preset panel dùng và preset test khóa là cùng một
 * giá trị, không lệch nhau qua bản copy literal.
 *
 * PRESET ĐÃ CHỌN — curve hằng 1×, đúng 1 keyframe:
 *   { keyframes: [{ t: 0, v: 1, easing: "linear" }] }
 * Lý do chọn 1→1 thay vì ramp 1→2 (hai phương án nhiệm vụ nêu):
 *  - 1 keyframe duy nhất hợp lệ với MỌI duration (validator đợt 20 R3
 *    bắt keyframe t ∈ [0, duration]; preset 2 keyframe cố định t = D
 *    của clip này sẽ lỗi t > duration ở clip ngắn hơn).
 *  - Tích phân trên duration D đúng bằng D nên chế độ giữ-duration
 *    (patchClip, đường panel dùng) giữ nguyên trim khi nested đang ở
 *    tốc độ 1 — trường hợp thường gặp nhất — và không đổi duration.
 *  - Tốc độ hợp không bao giờ vượt [0.25, 4] vì hệ số hằng là 1: nếu
 *    guard hai tầng sau này được nới (luật render đợt 20 R1 đã hợp được
 *    hai tầng), tốc độ hợp = tốc độ lá × 1 = tốc độ lá, không bị preset
 *    đẩy vượt ngưỡng. Ramp 1→2 thì ngược lại: vừa đổi trim/duration
 *    ngay khi tạo (gây ngạc nhiên), vừa có thể đẩy tốc độ hợp vượt 4
 *    khi lá đã nhanh, lại vừa có thể gây toast vượt nguồn.
 *  - Ngoại lệ trung thực: nested đang ở tốc độ hằng khác 1 (ví dụ speed
 *    2, trim [0, 8) trên duration 4) thì tạo curve hằng 1× VẪN đổi
 *    trim.out về in + D theo đúng ngữ nghĩa giữ-duration (render bỏ qua
 *    speed hằng khi có curve, spec đợt 18 §1.5). Panel hiện preview
 *    trim.out trước khi tạo nên user thấy trước thay đổi này; store
 *    cũng toast info vượt nguồn nếu out mới vượt độ dài nguồn con.
 *
 * LUẬT CHẶN (nestedCurveCreateBlock) — panel kiểm tra TRƯỚC khi gọi
 * store vì patchClip trả 0 im lặng cho nhiều lý do (bài học R4).
 * CẬP NHẬT giữa đợt 21 (luồng T2 nới guard, xem dưới): luật hai tầng
 * dưới đây là luật MỚI, không còn là chặn tuyệt đối như bản đầu của
 * luồng này.
 *  - alreadyHas: clip đã có curve (keyframe không rỗng) → block tạo
 *    không hiện nữa, nhưng handler vẫn giữ nhánh này để chống
 *    double-click/render cũ gọi store thừa (không sinh entry undo rỗng).
 *  - reverse: clip ngoài đang reverse → validator cấm kết hợp reverse
 *    + curve nên panel chặn với câu riêng (check hai tầng của T2 cũng
 *    chặn trường hợp này, nhưng câu riêng nói rõ là clip ngoài).
 *  - twoLevel: CHỈ chặn khi cặp hai tầng VI PHẠM luật render R1, kiểm
 *    tra bằng đúng hàm guard store dùng (`checkTwoLevelOuterCurve`
 *    với preset — không tự bịa điều kiện riêng). Cặp hợp lệ (ví dụ
 *    preset hằng 1× × lá hằng 1× → tốc độ hợp 1) được cho qua vì
 *    render đã hợp thật. Lý do cụ thể lấy từ check nguyên của
 *    `nestedCurveCreateTwoLevelCheck` để panel toast đúng lý do
 *    (key `nested.curveTwoLevelInvalid` của T2) thay vì câu chung cũ;
 *    đợt 24 H2: đường này không còn qua chuỗi reason nữa nên mapper
 *    khớp chuỗi đã xóa được.
 *  - previewFail: không tính được trim.out kỳ vọng (duration/trim
 *    không hợp lệ) → không tạo, tránh ghi trạng thái không kiểm được.
 * KHÔNG chặn oan (hai nghĩa, đều khóa bằng test):
 *  - Nested hai tầng (nested chứa nested con) nhưng KHÔNG clip nào
 *    mang curve → check trả ok nên vẫn tạo được — độ sâu lồng nhau
 *    tự nó không phải lý do chặn.
 *  - Cặp hai tầng HỢP LỆ theo R1 (lá đã có curve nhưng tốc độ hợp với
 *    preset vẫn trong [0.25, 4], không reverse, không attachment thời
 *    gian) → tạo được, không bị chặn oan như luật cũ.
 * Lịch sử luật: bản đầu luồng này chặn tuyệt đối mọi hai tầng theo
 * guard đợt 19 G2 (LIMITS đợt 20 §3). Trong lúc luồng này chạy, luồng
 * đợt 21 T2 đã nới guard store (patchClip/patchNestedCurveFixedTrim
 * dùng `checkTwoLevelOuterCurve`, key `curveTwoLevelInvalid`) — test
 * hồi quy R4/19 cũ khóa luật chặn tuyệt đối nên nay fail, xem LIMITS
 * §3. Luồng này đã cập nhật đường tạo mới theo luật T2 thay vì giữ
 * luật cũ (giữ luật cũ sẽ chặn oan đúng trường hợp nhiệm vụ cấm).
 */
import type { NestedClip, SpeedCurve } from "@repo-1/video-spec";
import {
  checkTwoLevelOuterCurve,
  nestedCurveExpectedOut,
  type TwoLevelCheck,
} from "./nestUtils";
import {
  translateTwoLevelCheck,
  type NestedTranslate,
} from "./nestedRejection";

/** Preset khởi đầu cho nested chưa có curve: tốc độ hằng 1×. */
export function createNestedCurvePreset(): SpeedCurve {
  return { keyframes: [{ t: 0, v: 1, easing: "linear" }] };
}

/** Lý do chặn tạo curve mới; null = tạo được. */
export type NestedCurveCreateBlock =
  | "alreadyHas"
  | "reverse"
  | "twoLevel"
  | "previewFail";

/**
 * Clip này có tạo được curve mới không. Trả null khi tạo được, ngược
 * lại trả lý do để panel toast đúng lý do (không im lặng).
 */
export function nestedCurveCreateBlock(
  clip: NestedClip,
): NestedCurveCreateBlock | null {
  const curve = (clip as unknown as { speedKeyframes?: SpeedCurve })
    .speedKeyframes;
  if (curve && curve.keyframes.length > 0) return "alreadyHas";
  if ((clip as unknown as { reverse?: boolean }).reverse === true)
    return "reverse";
  // Thứ tự có chủ đích: previewFail (duration/trim không hợp lệ) kiểm
  // trước twoLevel, vì check T2 cũng fail khi duration không hợp lệ
  // (isValidTwoLevelRampCurve bắt duration > 0) — báo previewFail mới
  // đúng nguyên nhân gốc; cặp hai tầng vi phạm nhưng duration/trim
  // vẫn tính được thì rơi xuống nhánh twoLevel bên dưới.
  const expectedOut = nestedCurveExpectedOut({
    ...clip,
    speedKeyframes: createNestedCurvePreset(),
  } as NestedClip);
  if (expectedOut === null) return "previewFail";
  // Luật T2: chỉ chặn khi cặp hai tầng với preset vi phạm R1 (hàm
  // này trả ok khi cây con không có curve nào — tức một tầng).
  if (nestedCurveCreateTwoLevelCheck(clip) !== null) return "twoLevel";
  return null;
}

/**
 * Đợt 24 H2 — kết quả cổng hai tầng NGUYÊN cho cặp clip × preset hằng
 * 1× (cùng check mà guard store dùng). Trả null khi cặp hợp lệ hoặc
 * cây con không có curve nào. Đây là đường chính: block kiểm tra và
 * message toast đều đi qua hàm này, rồi dịch bằng translateTwoLevelCheck
 * theo reasonCode — không còn đường nào cầm chuỗi reason thô.
 */
export function nestedCurveCreateTwoLevelCheck(
  clip: NestedClip,
): TwoLevelCheck | null {
  const check = checkTwoLevelOuterCurve(clip, createNestedCurvePreset());
  return check.ok ? null : check;
}

/**
 * Đợt 23 G2 — câu toast ĐÃ DỊCH cho nhánh twoLevel của đường tạo curve.
 * Trả null khi clip không bị chặn ở nhánh này (panel chỉ toast khi
 * block === "twoLevel"; helper tự kiểm tra lại block nên không toast
 * sai nhánh). Đợt 24 H2: helper dịch từ CHECK NGUYÊN qua
 * translateTwoLevelCheck (theo reasonCode), không còn qua chuỗi reason
 * hay mapper khớp chuỗi. Hàm này là ĐIỂM TOAST DUY NHẤT cho nhánh
 * twoLevel của đường tạo. Fallback câu chung (key nested.curveTwoLevel)
 * chỉ phòng trường hợp block là twoLevel nhưng check rỗng bất thường.
 */
export function nestedCurveCreateTwoLevelMessage(
  translate: NestedTranslate,
  clip: NestedClip,
): string | null {
  if (nestedCurveCreateBlock(clip) !== "twoLevel") return null;
  const check = nestedCurveCreateTwoLevelCheck(clip);
  if (check === null) {
    return translate("nested.curveTwoLevel", {
      name: clip.name ?? clip.id,
    });
  }
  return translate("nested.curveTwoLevelInvalid", {
    name: clip.name ?? clip.id,
    reason: translateTwoLevelCheck(translate, check),
  });
}
