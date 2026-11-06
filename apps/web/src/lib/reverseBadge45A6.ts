// reverseBadge45A6.ts — Phase 9 đợt 45, luồng A6 (compat, tiếp nối Z6).
//
// Đóng nợ Z6 §6.2 (badge từng frame): Z6 khóa ngữ nghĩa badge = ĐƯỜNG
// ĐÃ CHỌN qua resolveReverseEngineBadge — hàm đó cố tình KHÔNG nhận
// trạng thái controller, nên khi controller WebCodecs đã failed (getter
// `failed` của ReversePreviewController = cờ `unsupported`, dính sau:
// load hỏng, decode 0 frame, decode throw, hoặc khóa file lớn S4) mà
// frame hiện tại rơi về element, badge vẫn báo WEBCODECS. Đó là lệch
// từng frame mà Z6 đã ghi là chưa làm.
//
// Module này KHÔNG sửa reversePlayback.ts (file của luồng khác / tránh
// xung đột đợt 45): nó bọc resolveReverseEngineBadge và chỉ thêm MỘT
// đầu vào duy nhất là controllerFailed. Mọi trạng thái cũ giữ nguyên
// kind + missingApi khi controllerFailed = false (test khóa bằng cách
// đối chiếu trực tiếp với hàm Z6 cũ).
//
// Quy tắc failed (ghi rõ để khỏi hiểu lầm thành "badge = frame vừa vẽ"):
// - Chỉ khi đường đã chọn là webcodecs VÀ controllerFailed = true thì
//   badge đổi sang "element-failed": frame thực tế đang vẽ bằng
//   element vì controller đã khóa về unsupported, không phải vì trình
//   duyệt thiếu API.
// - Khi đường đã chọn đã là element (thiếu API / opt-in tắt) thì failed
//   không có ý nghĩa (controller WebCodecs không chạy) nên giữ nguyên
//   kind cũ + controllerFailed = false ở đầu ra — failed không ghi đè
//   lý do thiếu API.
// - Khi không stepping hoặc opt-in tắt thì vẫn null (badge ẩn), kể cả
//   khi failed = true.
//
// Hiển thị (reverseEngineBadgeDisplay45A6): text/title/bg lấy qua hàm
// t() do caller truyền (chính là i18nT của preview) nên đổi lang chỉ
// cần gọi lại hàm này — không cần chờ tick vòng lặp (xem effect
// [previewLang] ở preview.tsx, nợ Z6 §6.3).
// ROUND46-B6: nhánh element-failed nay dùng key riêng
// badgeElementFailed/titleElementFailed (vi/en, không placeholder
// {api}) — câu chữ chuẩn "decode thất bại", không còn mượn key
// element-missing. Kind thuần không đổi; test A6 đã cập nhật fake
// dict + kỳ vọng theo key mới (xem test A6, test 46B6 khóa dict thật).

import {
  resolveReverseEngineBadge,
  type ReverseEngineBadge,
  type ReverseEngineDetail,
} from "./reversePlayback";

export type ReverseEngineBadge45A6Kind =
  | "webcodecs"
  | "element-missing"
  | "element-failed";

export interface ReverseEngineBadge45A6 {
  kind: ReverseEngineBadge45A6Kind;
  /** Tên API thiếu khi kind = "element-missing", null ở 2 kind còn lại. */
  missingApi: string | null;
  /**
   * True chỉ khi chính failed đã đổi badge (webcodecs -> element-failed).
   * False ở mọi trường hợp còn lại, kể cả khi đầu vào failed = true
   * nhưng đường đã chọn vốn đã là element (failed không áp dụng).
   */
  controllerFailed: boolean;
}

export function resolveReverseEngineBadge45A6(
  detailed: ReverseEngineDetail,
  stepping: boolean,
  controllerFailed: boolean,
): ReverseEngineBadge45A6 | null {
  const base: ReverseEngineBadge | null = resolveReverseEngineBadge(
    detailed,
    stepping,
  );
  if (!base) return null;
  if (controllerFailed && base.kind === "webcodecs") {
    return { kind: "element-failed", missingApi: null, controllerFailed: true };
  }
  return { ...base, controllerFailed: false };
}

export interface ReverseEngineBadgeDisplay {
  text: string;
  title: string;
  bg: string;
}

type BadgeT = (
  key: string,
  vars?: Record<string, string>,
) => string;

const WEBCODECS_BG = "rgba(40,120,180,0.92)";
const ELEMENT_BG = "rgba(140,90,0,0.92)";

export function reverseEngineBadgeDisplay45A6(
  badge: ReverseEngineBadge45A6 | null,
  t: BadgeT,
): ReverseEngineBadgeDisplay {
  if (!badge) return { text: "", title: "", bg: "" };
  if (badge.kind === "webcodecs") {
    return {
      text: t("reverseEngine.badgeWebcodecs"),
      title: t("reverseEngine.titleWebcodecs"),
      bg: WEBCODECS_BG,
    };
  }
  if (badge.kind === "element-failed") {
    // ROUND46-B6: key riêng, không placeholder {api}, không mượn key
    // element-missing nữa (nợ wording A6 §5.3 đã đóng).
    return {
      text: t("reverseEngine.badgeElementFailed"),
      title: t("reverseEngine.titleElementFailed"),
      bg: ELEMENT_BG,
    };
  }
  return {
    text: t("reverseEngine.badgeElementMissing", {
      api: badge.missingApi ?? "VideoDecoder",
    }),
    title: t("reverseEngine.titleElementMissing", {
      api: badge.missingApi ?? "VideoDecoder",
    }),
    bg: ELEMENT_BG,
  };
}
