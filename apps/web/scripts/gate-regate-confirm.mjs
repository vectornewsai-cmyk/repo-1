// gate-regate-confirm.mjs — Phase 9 đợt 77, luồng E2.
// Quyết định giết phiên ở re-gate (cửa kiểm tra thứ hai) — LUẬT MỚI E2:
//   GIẾT ⟺ re-gate FAIL (delta < ngưỡng) ∧ slot 1 là FN (draw < 2 fps, slot hợp lệ).
// Luật cũ (Z3, đợt 72): GIẾT ⟺ re-gate FAIL (bất kể slot 1).
//
// Vì sao (xem docs/PHASE9_ROUND77_E2_GATE_REGATE_LIMITS.md):
//   - Re-gate chạy SAU slot 1 nên slot 1 đã biết trước khi quyết định giết.
//     Slot 1 là cửa sổ 10 s (đo chính); re-gate chỉ là cửa sổ 6 s đo lại,
//     nhiễu slow-start lớn hơn — khi hai cửa sổ mâu thuẫn, cửa sổ dài hơn
//     (slot 1) phải thắng; re-gate chỉ XÁC NHẬN phát hiện FN của slot 1,
//     không được tự nó kết án phiên.
//   - Trên 16 phiên chuẩn Y3+Z3+A6+B8+C4+D5: luật cũ bắt FN 3/4, FP 3/12;
//     luật mới bắt FN 3/4 (y hệt — Y3-S1, A6-S1, D5-S1 vẫn bị giết, B8-S1
//     vẫn lọt như trước), FP 0/12 (3 FP kiểm duyệt C4-S3 delta 4, D5-S2
//     delta 27, D5-S3 delta 18 đều được tha vì slot 1 không FN).
//   - Không tín hiệu cửa sổ đơn nào khác tách được FN/khỏe: ct cuối cửa sổ
//     ~6,5 s ở mọi phiên; rs cuối 1↔4 chồng lấn; presented slot FN 4,6–
//     29,2 fps chồng khỏe 20,5–30 fps; qTotal cuối FN 334–676 chồng khỏe
//     483–755. Vấn đề là cấu trúc cửa sổ, không phải ngưỡng hay tín hiệu.
//   - Slot 1 không hợp lệ / không có số đo → không xác nhận được → THA
//     (hướng an toàn: không giết trên bằng chứng lung lay).
//   - E2_REGATE_CONFIRM=0 → về đúng luật cũ (để A/B trong cùng launcher).
//
// Pure, không side-effect. Dùng chung cho variant đo (launcher E2 inject
// nguyên văn source này vào variant) và test unit — MỘT nguồn thật duy nhất.
export const FN_DRAW_FPS = 2;

/** Slot có phải FN không: hợp lệ + có drawFps + draw < 2 fps (tiêu chí Y3/Z3). */
export function isSlotFn(slot) {
  return (
    !!slot &&
    slot.valid === true &&
    typeof slot.drawFps === "number" &&
    slot.drawFps < FN_DRAW_FPS
  );
}

/**
 * Quyết định giết phiên ở re-gate.
 * @param {object} o
 * @param {number} o.regateDelta - delta draws của cửa sổ re-gate 6 s.
 * @param {number} [o.threshold=30] - ngưỡng re-gate (mặc định 30, giữ nguyên).
 * @param {boolean} [o.gateOn=true] - cửa thứ hai có BẬT không (Z3_REGATE_GATE).
 * @param {boolean} [o.confirmOn=true] - có yêu cầu xác nhận slot-1 FN không (E2).
 * @param {object|null} [o.slot1=null] - row slot rep 1 (slots[0]).
 * @returns {{ regateFail: boolean, oldKill: boolean, kill: boolean,
 *   sparedByConfirm: boolean, slot1Fn: boolean, reason: string }}
 *   oldKill = luật cũ Z3 sẽ giết; kill = luật mới E2 giết thật;
 *   sparedByConfirm = luật cũ giết nhưng luật mới tha (FP được cứu).
 */
export function decideRegateKill({
  regateDelta,
  threshold = 30,
  gateOn = true,
  confirmOn = true,
  slot1 = null,
} = {}) {
  const regateFail =
    typeof regateDelta === "number" && regateDelta < threshold;
  const oldKill = gateOn && regateFail;
  const slot1Fn = isSlotFn(slot1);
  const kill = oldKill && (!confirmOn || slot1Fn);
  let reason;
  if (!gateOn) reason = "gate-off";
  else if (!regateFail) reason = "regate-pass";
  else if (!confirmOn) reason = "kill-old-rule";
  else if (slot1Fn) reason = "kill-confirmed-slot1-fn";
  else reason = "spare-slot1-not-fn";
  return { regateFail, oldKill, kill, sparedByConfirm: oldKill && !kill, slot1Fn, reason };
}
