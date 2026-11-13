/**
 * armHeld99a3.mjs — Phase 9 đợt 99, luồng A3: phân loại/đếm RỘNG
 * "seek bị re-arm chặn" (ARM-HELD, §6 của analyzer analyze99a3).
 *
 * NỢ GỐC (LIMITS gộp đợt 98 §4 mục 4; Z3 §1.3 + §5 mục 6): phân loại
 * CANCELLED hẹp của analyzer (§1, kế thừa X4/Y4) đòi drift đủ xác nhận
 * (due: |drift| > 0,35 ở CẢ tick k−1 lẫn tick arm k) — nhưng detector
 * arm khi đóng băng đủ 300 ms, lúc đó playhead mới chạy trước element
 * đóng băng ~0,30 s < 0,35 s nên drift HẦU NHƯ KHÔNG BAO GIỜ due ở
 * đúng tick arm; watch arm xong giữ playhead nên drift cũng không bao
 * giờ lớn lên sau đó. Kết quả: CANCELLED = 0 trên 13 lượt (7 cũ + 3 d
 * + 3 e) dù máy re-arm đã chặn seek thật ngoài đời. Phân loại hẹp đo
 * một sự trùng hợp của hai đồng hồ (300 ms đóng băng vs 2 tick xác
 * nhận drift), không đo việc máy re-arm chặn seek.
 *
 * ĐỊNH NGHĨA MỚI — ARM-HELD (một lần arm chặn được một lần drift
 * re-seek, quy cho máy re-arm): một lần arm ở probe tick k được đếm
 * khi TẤT CẢ đúng:
 *   1. Không có tail sống ở tick k (tail[k] == null): nếu tail đã sống
 *      thì chính tail chặn seek, công quy cho §4 (chuỗi grace), không
 *      quy cho §6 — tránh đếm trùng.
 *   2. Watch vừa arm còn sống ở CẢ k+1 lẫn k+2 (watchCeil != null):
 *      watch thực sự giữ playhead suốt cửa sổ xác nhận 2 tick. Watch
 *      chết sau 1 tick (element burst, seeking, trần) thì arm không
 *      giữ được gì — không đếm.
 *   3. Drift PHẢN-THỰC (counterfactual) vượt ngưỡng ở CẢ k+1 lẫn k+2:
 *      driftCF(j) = drift(k) + RATE × (t(j) − t(k)) − (ct(j) − ct(k)),
 *      với RATE = 1,0× cố định (tốc độ thiết kế của playhead: tăng
 *      đúng wall-clock, xem R2 header; PREVIEW_DT_CAP_S = 2 s không
 *      bao giờ siết ở gap < 2 s). ct(j) − ct(k) là số đo THẬT (element
 *      burst thì driftCF tụt theo — không đếm oan ca resume nhanh).
 *      Không có watch, drift đã vượt ngưỡng 2 tick liên tiếp thì
 *      shouldIssueForwardReseek bắn seek ở tick thứ 2 (confirmTicks
 *      = 2, ngưỡng |drift| > 0,35 — cùng định nghĩa due của §1/§4).
 *   4. Không có resync nào (resyncsV tăng) ở k+1..k+3: seek thực sự
 *      đã không bắn (cùng cửa sổ 3 tick với CANCELLED cũ).
 *   5. Đủ tick để xét: cần tick k+3 tồn tại; thiếu thì INCONCLUSIVE
 *      (báo riêng, không đếm) thay vì đoán.
 * Tốc độ 1,0× là giá trị BẢO THỦ so với median đo được trên 13 lượt
 * cũ (0,81–1,13×, đa số ~1,0×): dùng 1,0× chỉ có thể đếm THIẾU chứ
 * không đếm thừa khi tốc độ thật > 1,0×. Mỗi ca đếm được đều báo kèm
 * khoảng tốc độ mà nó vẫn đúng (xem counterfactualRateInterval99A3)
 * để người đọc tự kiểm: ca e1r-41 đúng với mọi tốc độ ≥ 0,80×.
 *
 * Thuần, không chạm DOM/fs — unit-test được bằng node:test.
 */

export const ARM_HELD_DRIFT_THRESHOLD_S = 0.35;
export const ARM_HELD_DESIGN_RATE = 1.0;
export const ARM_HELD_CONFIRM_TICKS = 2;
export const ARM_HELD_RESYNC_WINDOW_TICKS = 3;

/**
 * Drift phản-thực ở tick j nếu playhead KHÔNG bị watch giữ.
 * @param driftAtArm drift (ph − ct, có dấu) ở tick arm k.
 * @param rate tốc độ playhead (lần realtime).
 * @param dtMs thời gian tường từ tick k tới tick j (ms).
 * @param ctAdvance element đã tăng bao nhiêu từ tick k tới tick j (giây, số đo thật).
 */
export function counterfactualDrift99A3({ driftAtArm, rate, dtMs, ctAdvance }) {
  return driftAtArm + rate * (dtMs / 1000) - ctAdvance;
}

/**
 * Khoảng tốc độ r (r >= 0) mà |driftCF| > threshold ở một tick phản-thực.
 * driftCF = driftAtArm + r × dtS − ctAdvance; đặt D = driftAtArm − ctAdvance.
 * |D + r·dtS| > thr ⟺ r < (−thr − D)/dtS (nhánh âm) hoặc r > (thr − D)/dtS
 * (nhánh dương). Trả về mảng các khoảng [lo, hi] (hi = Infinity nếu mở),
 * đã cắt r >= 0. Trả [] khi không có tốc độ nào thỏa.
 */
export function counterfactualRateInterval99A3({ driftAtArm, dtMs, ctAdvance, threshold = ARM_HELD_DRIFT_THRESHOLD_S }) {
  const dtS = dtMs / 1000;
  if (!(dtS > 0)) return [];
  const D = driftAtArm - ctAdvance;
  const out = [];
  const rLo = (-threshold - D) / dtS; // r < rLo: nhánh âm (element chạy trước)
  const rHi = (threshold - D) / dtS; // r > rHi: nhánh dương (playhead chạy trước)
  if (rLo > 0) out.push([0, rLo]);
  // rHi luôn hữu hạn (dtS > 0, D hữu hạn): nhánh dương là (rHi, ∞).
  out.push([Math.max(0, rHi), Infinity]);
  return out;
}

/** Giao của nhiều khoảng tốc độ (mảng [lo, hi]). */
export function intersectRateIntervals99A3(intervalsList) {
  let acc = [[0, Infinity]];
  for (const intervals of intervalsList) {
    const next = [];
    for (const [aLo, aHi] of acc) {
      for (const [bLo, bHi] of intervals) {
        const lo = Math.max(aLo, bLo);
        const hi = Math.min(aHi, bHi);
        if (hi > lo) next.push([lo, hi]);
      }
    }
    acc = next;
    if (!acc.length) break;
  }
  return acc;
}

const watchLiveAt = (ticks, j) => j >= 0 && j < ticks.length && ticks[j].watchCeil != null;
const tailLiveAt = (ticks, j) => j >= 0 && j < ticks.length && ticks[j].tail != null;
const resyncUpAt = (ticks, j) => {
  if (j < 1 || j >= ticks.length) return false;
  const a = ticks[j - 1].resyncsV, b = ticks[j].resyncsV;
  return typeof a === "number" && typeof b === "number" && b > a;
};

/**
 * Phân loại một lần re-arm ở probe tick k.
 * @param ticks mảng tick vận tốc {t, ct, ph, resyncsV, watchCeil, tail}.
 * @param k chỉ số tick arm (tick đầu tiên thấy rearms tăng).
 * @param opts.rate tốc độ dùng cho phản-thực (mặc định 1,0× thiết kế).
 * @returns { verdict: "ARM-HELD"|"NOT-HELD"|"INCONCLUSIVE",
 *   reason, evidence: {...} } — evidence luôn có đủ số để kiểm tay.
 */
export function classifyArmHeld99A3(ticks, k, opts = {}) {
  const rate = opts.rate ?? ARM_HELD_DESIGN_RATE;
  const thr = opts.threshold ?? ARM_HELD_DRIFT_THRESHOLD_S;
  const ev = { armTick: k, rate, threshold: thr };
  if (!Array.isArray(ticks) || k < 1 || k >= ticks.length) {
    return { verdict: "INCONCLUSIVE", reason: "tick-arm-ngoài-dải", evidence: ev };
  }
  if (k + ARM_HELD_RESYNC_WINDOW_TICKS >= ticks.length) {
    return { verdict: "INCONCLUSIVE", reason: "thiếu-tick-k+3-để-kiểm-resync", evidence: { ...ev, ticksTotal: ticks.length } };
  }
  const driftAtArm = ticks[k].ph - ticks[k].ct;
  const driftPrev = ticks[k - 1].ph - ticks[k - 1].ct;
  ev.driftPrev = +driftPrev.toFixed(4);
  ev.driftAtArm = +driftAtArm.toFixed(4);
  ev.tailAtArm = tailLiveAt(ticks, k);
  ev.watchAtArm = watchLiveAt(ticks, k);
  ev.watchAtK1 = watchLiveAt(ticks, k + 1);
  ev.watchAtK2 = watchLiveAt(ticks, k + 2);
  ev.ctAdvanceK1 = +(ticks[k + 1].ct - ticks[k].ct).toFixed(4);
  ev.ctAdvanceK2 = +(ticks[k + 2].ct - ticks[k].ct).toFixed(4);
  ev.gapK1Ms = ticks[k + 1].t - ticks[k].t;
  ev.gapK2Ms = ticks[k + 2].t - ticks[k].t;
  ev.driftCfK1 = +counterfactualDrift99A3({ driftAtArm, rate, dtMs: ev.gapK1Ms, ctAdvance: ev.ctAdvanceK1 }).toFixed(4);
  ev.driftCfK2 = +counterfactualDrift99A3({ driftAtArm, rate, dtMs: ev.gapK2Ms, ctAdvance: ev.ctAdvanceK2 }).toFixed(4);
  ev.driftRealK1 = +(ticks[k + 1].ph - ticks[k + 1].ct).toFixed(4);
  ev.driftRealK2 = +(ticks[k + 2].ph - ticks[k + 2].ct).toFixed(4);
  ev.resyncAt = null;
  for (let j = k + 1; j <= k + ARM_HELD_RESYNC_WINDOW_TICKS; j++) {
    if (resyncUpAt(ticks, j)) { ev.resyncAt = j - k; break; }
  }
  // Nhiễm pause-seek của probe: decoder phát xuôi KHÔNG BAO GIỜ lùi
  // currentTime (chỉ seek mới lùi); nếu ct lùi > 1 ms trong cửa sổ
  // k+1..k+2 thì cửa sổ đã nhiễm seek ngoài (thường là pause-seek khi
  // probe dừng ở localPh >= 5,0 — xem LIMITS A3 §3.2: ca CANCELLED-hẹp
  // đầu tiên ở f3 chính là artifact này). Cờ chỉ để báo — verdict vẫn
  // theo các điều kiện trên (vd f3-8313: cf1 đã không due trên dữ liệu
  // sạch nên verdict NOT-HELD đứng dù k+2 nhiễm).
  // Dấu hiệu pause-seek thứ hai (f5-12919): watch chết đúng tick ct
  // đáp CHÍNH XÁC lên ph (|ct−ph| < 1 ms) mà KHÔNG mở tail (dọn watch
  // vì seeking — nhánh advance mới mở tail) và KHÔNG có resync nào
  // (mọi seek lúc phát đều đếm vào resyncsV/restartV). Burst thật của
  // decoder cũng dọn watch nhưng MỞ tail nên không chạm cờ này (xem
  // test T14); drift re-seek thật thì có resync nên cũng không chạm.
  const pauseSeekAt = (j) => {
    if (j < 1 || j >= ticks.length) return false;
    if (watchLiveAt(ticks, j) || !watchLiveAt(ticks, j - 1)) return false;
    if (tailLiveAt(ticks, j)) return false;
    if (Math.abs(ticks[j].ct - ticks[j].ph) >= 0.001) return false;
    if (ticks[j].ct === ticks[j - 1].ct) return false;
    return true;
  };
  const ctBackward =
    (ticks[k + 1].ct < ticks[k].ct - 0.001) || (ticks[k + 2].ct < ticks[k].ct - 0.001);
  const pauseSeekSig = (pauseSeekAt(k + 1) || pauseSeekAt(k + 2)) && ev.resyncAt === null;
  ev.windowContaminated = ctBackward || pauseSeekSig;
  ev.contaminationKind = ctBackward && pauseSeekSig ? "ct-lùi+pause-seek-đáp-ph"
    : ctBackward ? "ct-lùi" : pauseSeekSig ? "pause-seek-đáp-ph" : null;
  // Khoảng tốc độ mà CẢ hai tick phản-thực đều vượt ngưỡng (giao nhau).
  // Có thể rời rạc 2 khoảng (nhánh âm: element chạy trước / nhánh dương:
  // playhead chạy trước); khoảng chứa tốc độ thiết kế mới có ý nghĩa thực.
  const iv1 = counterfactualRateInterval99A3({ driftAtArm, dtMs: ev.gapK1Ms, ctAdvance: ev.ctAdvanceK1, threshold: thr });
  const iv2 = counterfactualRateInterval99A3({ driftAtArm, dtMs: ev.gapK2Ms, ctAdvance: ev.ctAdvanceK2, threshold: thr });
  ev.rateInterval = intersectRateIntervals99A3([iv1, iv2]);
  ev.rateIntervalDesign = ev.rateInterval.find(([lo, hi]) => rate > lo && rate < hi) ?? null;
  ev.rateIntervalContainsDesign = ev.rateIntervalDesign !== null;
  ev.oldCancelledDue = Math.abs(driftPrev) > thr && Math.abs(driftAtArm) > thr;

  if (ev.tailAtArm) return { verdict: "NOT-HELD", reason: "tail-sống-ở-tick-arm-quy-cho-§4", evidence: ev };
  if (!ev.watchAtK1 || !ev.watchAtK2) {
    return { verdict: "NOT-HELD", reason: "watch-không-sống-đủ-2-tick-sau-arm", evidence: ev };
  }
  if (!(Math.abs(ev.driftCfK1) > thr && Math.abs(ev.driftCfK2) > thr)) {
    return { verdict: "NOT-HELD", reason: "phản-thực-không-due-2-tick-liên-tiếp", evidence: ev };
  }
  if (ev.resyncAt !== null) {
    return { verdict: "NOT-HELD", reason: `resync-vẫn-bắn-ở-+${ev.resyncAt}-tick`, evidence: ev };
  }
  return { verdict: "ARM-HELD", reason: "watch-giữ-2-tick-phản-thực-due-không-resync", evidence: ev };
}
