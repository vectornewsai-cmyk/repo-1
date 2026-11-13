// rvfcClipWindow.ts — Phase 9 đợt 102, luồng D3 (zombie pump: fix khe
// early-return qua seek-across, nợ LIMITS gộp đợt 101 §4 mục 7 / C5 §5).
//
// Vị ngữ cửa sổ timeline của 1 clip cho pump rVFC — DÙNG CHUNG cho 2 đường
// kill để chúng không lệch nhau:
//   (a) check clip-active trong rvfcCallback (đợt 99 A6 — phản ứng: kill khi
//       callback bắn mà playhead đã ra khỏi cửa sổ);
//   (b) kill đồng bộ khi playhead nhảy (đợt 102 D3 — chủ động: kill ngay
//       trong subscriber setPlayhead, trước khi callback nào kịp bắn).
//
// Cửa sổ nửa mở [start, start+duration) — khớp điều kiện draw của
// drawVideoClip: t đúng bằng biên là clip đã hết active. Guard: duration
// <= 0 (chưa ghi nhận cửa sổ) hoặc playhead không hữu hạn → KHÔNG ngoài
// cửa sổ (không kill oan).
export function isPlayheadOutsideClipWindow(
  playhead: number,
  clipStart: number,
  clipDuration: number,
): boolean {
  if (!Number.isFinite(playhead) || clipDuration <= 0) return false;
  return playhead < clipStart || playhead >= clipStart + clipDuration;
}

/**
 * Đợt 102 D3 (bổ sung sau đo d3x2) — hoãn TẠO pump rVFC mới khi element
 * chưa "định vị" xong. Cơ chế đo được (d3x2, 1 ca): re-seek xuôi chỉ phát
 * seek khi drift > ngưỡng qua 2 tick liên tiếp (playheadPacing.ts —
 * FORWARD_RESEEK_THRESHOLD_S = 0,35 s, FORWARD_RESEEK_CONFIRM_TICKS = 2),
 * nên tick đầu tiên sau cú nhảy playhead: chưa có seek nào bay
 * (seeking=false) mà element vẫn ở vị trí cũ (lệch target > 0,35 s);
 * tick đó vẽ và tạo pump mới, callback đầu tiên của pump bắn trước khi
 * tick sau phát seek → guard `seeking` trong rvfcCallback không chặn được
 * (seek chưa bay thì seeking=false) → capture 1 frame cũ vào ring (tự
 * sửa sau 305 ms bằng reset-capture, không thấy lên canvas ở lượt đó).
 * Hoãn tạo pump trong chính cửa sổ đó: khi element KHÔNG seeking mà
 * currentTime lệch target hơn ngưỡng re-seek thì chưa tạo pump (đường tick
 * vẽ frame đó như cũ); tick sau seek đã bay (seeking=true) hoặc drift đã
 * nhỏ thì tạo pump bình thường, callback đầu sẽ qua guard seeking. Chỉ
 * áp lúc TẠO pump mới — pump đang sống không bị ảnh hưởng (không đói
 * ring trong lúc hold: hold làm playhead đứng yên, không làm element
 * lệch target ở thời điểm tạo). Ngưỡng lấy đúng hằng re-seek để 2 đường
 * không lệch nhau; expected không hữu hạn → không hoãn (giữ hành vi cũ).
 */
export function shouldDeferRvfcPumpCreation(
  elCurrentTime: number,
  expectedMediaTime: number,
  seeking: boolean,
  thresholdS: number,
): boolean {
  if (seeking) return false;
  if (!Number.isFinite(elCurrentTime) || !Number.isFinite(expectedMediaTime)) return false;
  return Math.abs(elCurrentTime - expectedMediaTime) > thresholdS;
}
