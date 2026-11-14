// driftConfirmSkip103E4.ts — Phase 9 đợt 103, luồng E4 (zombie tick stale-frame):
// vị ngữ thuần: tick phát này có nên bỏ qua lần vẽ vì một clip video xuôi
// đang ở tick xác nhận drift đầu tiên (chờ tick 2 mới phát seek) hay không.
//
// Bối cảnh (nợ LIMITS gộp đợt 102 §4 mục 4 / D3 §5 mục 1): re-seek xuôi chỉ
// phát seek khi drift > 0,35 s qua 2 tick liên tiếp (playheadPacing.ts —
// FORWARD_RESEEK_THRESHOLD_S = 0,35 s, FORWARD_RESEEK_CONFIRM_TICKS = 2),
// nên tick đầu tiên sau cú nhảy playhead: chưa seek nào bay (seeking=false)
// mà element vẫn ở vị trí cũ (lệch target > 0,35 s) — đường tick VẼ frame
// cũ đó (đo hồi cứu trên dữ liệu D3 đợt 102: tick-confirmed 10/60 biên
// seek-across, lượt dày d3x4 7/11; cap frame 90 ở d3x2). Gate N3
// (seekSkipRender86N3) chỉ chặn khi seeking=true nên không chặn được tick
// này; gate tạo pump D3 (§1.3) chỉ hoãn pump, không chặn đường vẽ.
//
// Fix: syncMedia ghi element vào tập "đang chờ xác nhận drift" đúng các tick
// mà drift vượt ngưỡng nhưng seek CHƯA phát (xem ghi chú ở khối ghi pending
// trong preview.tsx — 2 trường hợp: tick xác nhận đầu tiên 0→1, và tick bị
// ân hạn W5/X4/Y4 giữ overCount ở confirmTicks−1), rồi cuối syncMedia bỏ
// qua cả lần render của tick đó (canvas giữ frame trước nhảy — đúng nội
// dung frame giữ, cùng mẫu N3). Tick sau: seek đã phát (seeking=true) nên
// N3 tiếp quản; nếu drift tụt dưới ngưỡng (jitter 1 tick) thì chỉ mất 1
// tick vẽ, không seek nào phát.
// Chỉ element VIDEO xuôi (không reverse / không phát ngược toàn cục):
// clip reverse step-seek mỗi frame nên drift lớn là bình thường; audio
// không vẽ gì. Grace (W5/X4/Y4) không làm lệch vị ngữ: ân hạn chỉ được
// xét khi overCount đã ≥ confirmTicks−1 (xem shouldIssueForwardReseek),
// tức tick chuyển 0→1 không bao giờ là tick ân hạn.
export interface DriftConfirmPendingActive {
  /** HTMLElement.tagName của element ("VIDEO" | "AUDIO"). */
  tag: string;
  /** Clip có đang reverse/stepping không (ActiveMedia.reverse). */
  reverse: boolean;
  /** Element media (đối chiếu theo tham chiếu với tập pending). */
  el: object;
}

/**
 * Kết quả gộp của 2 gate bỏ vẽ trong syncMedia (đợt 110 L1 — tách tín hiệu
 * giữ R2 khỏi tín hiệu bỏ vẽ).
 *
 * - `skipRender`: bỏ qua renderFrame ở tick này — đúng khi gate N3
 *   (clip video xuôi đang seeking) HOẶC gate E4 (clip video xuôi đang ở
 *   tick xác nhận drift / tick bị ân hạn giữ overCount) bật.
 * - `skipRenderSeeking`: tick này bỏ vẽ VÌ clip đang seeking (chỉ N3) —
 *   tín hiệu duy nhất được phép làm `prevSkipRenderSeeking` cho quyết
 *   định giữ playhead R2 ở tick sau.
 *
 * VÌ SAO PHẢI TÁCH (cơ chế CAP đã chứng minh, xem
 * docs/PHASE9_ROUND110_L1_REARM_FIX_LIMITS.md §1): trước đợt 110,
 * syncMedia trả về 1 boolean gộp `N3 || E4`, và tickInner gán thẳng nó
 * vào `prevSkipRenderSeeking` — nên 1 tick E4 (không có seek nào đang
 * bay) cũng kích giữ playhead R2 ở tick sau. Giữ R2 pause element video
 * (nhánh forward của syncMedia pause active khi playheadHeld mà không
 * phải giữ resume), mà detector re-arm (`nextResumeFreezeRearm`) trả về
 * không-arm ngay khi element paused — nên trong suốt đuôi ân hạn Y4
 * (grace giữ overCount, E4 bỏ vẽ MỌI tick, giữ R2 lặp lại mỗi tick),
 * không watch mới nào arm được, đuôi chạm trần 5000 ms mà không có
 * rearm ở tick sau: CAP. Đo K1: 4/4 CAP của nhánh on có element paused
 * ở 20-24/21-26 mẫu sampler trong đuôi + skipTicks tăng liên tục, trong
 * khi span được cứu của nhánh off có 0/14 mẫu paused + skipTicks đứng
 * yên. Tách ra: E4 vẫn chặn frame stale (skipRender giữ nguyên), nhưng
 * không còn kích giữ R2 — element không bị pause oan, detector arm được
 * watch khi element đóng băng >= 300 ms trong đuôi (đường cứu như nhánh
 * off của K1).
 */
export interface SkipRenderDecision {
  /** Bỏ qua renderFrame ở tick này (N3 HOẶC E4). */
  skipRender: boolean;
  /** Tick này bỏ vẽ VÌ clip đang seeking (chỉ N3) — tín hiệu giữ R2. */
  skipRenderSeeking: boolean;
}

/**
 * Gộp 2 gate bỏ vẽ thành 1 quyết định tách tín hiệu. Thuần, không chạm DOM.
 * Bất biến: `skipRenderSeeking` KHÔNG BAO GIỜ được bật bởi gate E4 —
 * E4 chỉ bỏ vẽ, không phát seek, nên không được kích giữ playhead R2.
 */
export function combineSkipRender(
  skipWhileSeeking: boolean,
  skipWhileDriftConfirm: boolean,
): SkipRenderDecision {
  return {
    skipRender: skipWhileSeeking || skipWhileDriftConfirm,
    skipRenderSeeking: skipWhileSeeking,
  };
}

/**
 * true = tick phát này nên bỏ qua renderFrame (có clip video xuôi đang ở
 * tick xác nhận drift đầu tiên — element chưa seeking mà frame đã stale;
 * vẽ lúc này chỉ vẽ frame cũ lên canvas).
 */
export function shouldSkipRenderWhileDriftConfirmPending(
  reversePlayback: boolean,
  actives: readonly DriftConfirmPendingActive[],
  pendingEls: ReadonlySet<object>,
): boolean {
  if (reversePlayback) return false;
  for (const a of actives) {
    if (a.tag === "VIDEO" && !a.reverse && pendingEls.has(a.el)) return true;
  }
  return false;
}
