/**
 * speedCurveBlock.ts — chặn bật speed curve ở UI khi clip đang có stabilize
 * (Phase 9 đợt 62, luồng R2 — đóng nợ đợt 61 §5.2, mục "cảnh báo ở SpeedPanel").
 *
 * BỐI CẢNH: render chặn HẲN tổ hợp stabilize + speedKeyframes (validateSpec
 * + render.js đều chặn, exit 1, không MP4 — Q8 §4 đã đo thật). Đợt 61 R2 đã
 * chặn từ phía EnhancePanel (hướng (i): disable preset Cân bằng/Mạnh +
 * disable checkbox chống rung khi đang tắt), nhưng phía SpeedPanel vẫn cho
 * user bật speed curve trên clip đang có stabilize — trạng thái lỗi được tạo
 * ra từ phía SpeedPanel, chỉ hiện cảnh báo sau khi đã tạo (speed.warnStabilizeRamp).
 * Module này thống nhất 2 phía: nút "Bật đường cong tốc độ" bị vô hiệu khi
 * clip đang bật stabilize, kèm tooltip + dòng cảnh báo rõ ngay từ trước khi bật.
 *
 * ĐƯỜNG SỬA VẪN MỞ (đối xứng với quyết định đợt 61 R2 ở EnhancePanel):
 * user tắt stabilize trong panel Tăng cường rồi quay lại bật curve — không
 * bị khoá. Trạng thái lỗi CŨ (tạo trước đợt 62, hoặc qua MCP/CLI/file
 * project) vẫn sửa được: checkbox chống rung trong EnhancePanel vẫn mở để
 * tắt khi đang bật, và nút "Tắt đường cong" trong SpeedPanel không bị chặn.
 * Validator/render vẫn là backstop cuối cho mọi trạng thái lỗi còn sót.
 */
import { t } from "../../i18n";

/**
 * Nút "Bật đường cong tốc độ" có bị vô hiệu hoá không: clip đang bật
 * stabilize thì KHÔNG được bật curve mới (sẽ tạo trạng thái lỗi mà render
 * chặn). Không có stabilize → luôn mở.
 */
export function isSpeedCurveEnableBlocked(hasStabilize: boolean): boolean {
  return hasStabilize;
}

/**
 * t() với fallback tiếng Việt đúng từng chữ khi key fragment chưa được
 * parent gộp vào vi.json/en.json (mẫu đợt 58 O5 / đợt 61 R2). Fallback cũng
 * được thay vars {name} giống t().
 */
export function speedT(key: string, fallback: string, vars?: Record<string, string>): string {
  const out = t(key, vars);
  if (out !== key) return out;
  if (!vars) return fallback;
  return fallback.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}
