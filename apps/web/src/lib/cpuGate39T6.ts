// cpuGate39T6.ts — Khung cổng CPU tự động cho harness đo (đợt 39, luồng T6).
//
// TRẠNG THÁI: BẢN NHÁP, CHƯA KHÓA, CHƯA NỐI VÀO HARNESS NÀO.
// Hàm này chỉ ĐÁNH GIÁ một bộ hiệu chuẩn đã đo xong; không harness nào
// gọi nó để chặn/mở kết quả cho tới khi có quyết định khóa riêng.
// Lý do chưa khóa (xem PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md §5):
// ngưỡng tầng Node (>50% mọi vòng) đã trượt trong 2 phiên under-load
// liên tiếp (U4: 41,4/55,0/58,9; T6 lần 1: 39,9/39,4/39,4; T6 lần 2:
// 77,4/39,4/39,5) — sampler nhạy tải, không thể khóa cổng từ dữ liệu
// under-load. Tầng CDP thì phân biệt 3/3 trong cả 3 lần chạy (H1 ≤ 2,7%,
// H2 ≥ 92,2%, gap ≥ 91,2). Điều kiện khóa: một phiên quiet có điều phối
// (không chạy chung luồng browser khác) mà TẤT CẢ các tầng đều đạt,
// rồi mới có quyết định khóa riêng — không tự động từ file này.
//
// Ngưỡng ĐỀ XUẤT (chưa có hiệu lực):
// - CDP: mọi vòng H2 > 50, mọi vòng H1 < 20, (min H2 − max H1) > 30.
// - Node: mọi vòng busy > 50, mọi vòng idle < 20 (CHƯA XÁC NHẬN —
//   chính tiêu chí này đang trượt dưới tải; phiên quiet có thể giữ,
//   sửa, hoặc loại tầng Node khỏi cổng, tùy dữ liệu lúc đó).
// - Số vòng tối thiểu: 3 (như probe U4).

/** Một vòng hiệu chuẩn (đơn vị: % 1 core, như probe U4/T6 đo). */
export interface CpuCalibrationRound {
  /** Busy-loop tầng Node (% 1 core). */
  nodeBusy: number;
  /** Idle tầng Node (% 1 core). */
  nodeIdle: number;
  /** Renderer rảnh tầng CDP, probe H1 (% 1 core). */
  cdpH1: number;
  /** Renderer kẹt busy-loop tầng CDP, probe H2 (% 1 core). */
  cdpH2: number;
}

/** Ngưỡng đề xuất — hằng số tham chiếu, KHÔNG có hiệu lực chặn/mở. */
export const PROPOSED_CPU_GATE = {
  /** Trạng thái khóa: false = chưa khóa (xem đầu file). */
  locked: false,
  minRounds: 3,
  cdpH2Min: 50,
  cdpH1Max: 20,
  cdpGapMin: 30,
  nodeBusyMin: 50,
  nodeIdleMax: 20,
} as const;

export interface CpuGateEvaluation {
  /** true chỉ khi đủ vòng VÀ mọi tiêu chí (CDP + Node) đều đạt. */
  lockable: boolean;
  /** Từng tiêu chí đạt/trượt (để báo cáo rõ tầng nào chặn). */
  checks: {
    enoughRounds: boolean;
    cdpH2AllAbove: boolean;
    cdpH1AllBelow: boolean;
    cdpGapAbove: boolean;
    nodeBusyAllAbove: boolean;
    nodeIdleAllBelow: boolean;
  };
  /** Lý do không khóa được (rỗng khi lockable). */
  reasons: string[];
}

/**
 * Đánh giá một bộ hiệu chuẩn theo ngưỡng đề xuất. Thuần, không I/O,
 * không đọc tiến trình — dữ liệu đo do caller (probe) truyền vào.
 */
export function evaluateCpuGate(
  rounds: readonly CpuCalibrationRound[],
  thresholds: typeof PROPOSED_CPU_GATE = PROPOSED_CPU_GATE,
): CpuGateEvaluation {
  const checks = {
    enoughRounds: rounds.length >= thresholds.minRounds,
    cdpH2AllAbove:
      rounds.length > 0 && rounds.every((r) => r.cdpH2 > thresholds.cdpH2Min),
    cdpH1AllBelow:
      rounds.length > 0 && rounds.every((r) => r.cdpH1 < thresholds.cdpH1Max),
    cdpGapAbove:
      rounds.length > 0 &&
      Math.min(...rounds.map((r) => r.cdpH2)) -
        Math.max(...rounds.map((r) => r.cdpH1)) >
        thresholds.cdpGapMin,
    nodeBusyAllAbove:
      rounds.length > 0 && rounds.every((r) => r.nodeBusy > thresholds.nodeBusyMin),
    nodeIdleAllBelow:
      rounds.length > 0 && rounds.every((r) => r.nodeIdle < thresholds.nodeIdleMax),
  };
  const reasons: string[] = [];
  if (!checks.enoughRounds)
    reasons.push(`chỉ ${rounds.length} vòng, cần ≥ ${thresholds.minRounds}`);
  if (!checks.cdpH2AllAbove) reasons.push("có vòng H2 ≤ ngưỡng");
  if (!checks.cdpH1AllBelow) reasons.push("có vòng H1 ≥ ngưỡng");
  if (!checks.cdpGapAbove) reasons.push("gap CDP (min H2 − max H1) ≤ ngưỡng");
  if (!checks.nodeBusyAllAbove)
    reasons.push("tầng Node: có vòng busy ≤ ngưỡng (tiêu chí chưa xác nhận dưới tải)");
  if (!checks.nodeIdleAllBelow) reasons.push("tầng Node: có vòng idle ≥ ngưỡng");
  return {
    lockable: Object.values(checks).every(Boolean),
    checks,
    reasons,
  };
}
