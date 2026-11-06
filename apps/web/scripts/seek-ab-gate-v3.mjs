#!/usr/bin/env node
/**
 * Phase 9 đợt 37, luồng T1 — Cổng đo v3 cho A/B seekElement.
 *
 * Vấn đề của cổng v2 (đợt 36 S1, xem docs/PHASE9_ROUND36_S1_*):
 *  (a) Nhãn quiet v2 chỉ xét load1 nên mù trước tải nền bền: các lượt
 *      "quiet" đợt 36 mang load5max 2,06–2,28 và load15max 2,07–2,14,
 *      trong khi lượt quiet đợt 35 R1 chỉ load5max 1,46–1,84 và
 *      load15max 0,77–1,30 — và mức fps tuyệt đối đã trôi ~30% giữa
 *      hai phiên cùng bundle.
 *  (b) Nhãn STEADY_SLOW của v2 gộp hai chẩn đoán khác nhau: "sụp đoạn"
 *      (GOP1 khỏe, GOP2 sụp — single-a4) và "chậm toàn cục" (cả hai
 *      GOP đều chậm — retry-b1/b2). Tỉ số GOP2/GOP1 tách được hai
 *      dạng này nhưng gợi ý < 0,30 của S1 chưa từng hiệu chuẩn trước.
 *
 * Cổng v3 (file MỚI, KHÔNG sửa hành vi của v2 hay của Q6):
 *  - GIỮ NGUYÊN mọi ngưỡng v2: load1 < 2,0 (đúng 3 checkpoint của Q6:
 *    beforeFwd, beforeRev, atEnd — KHÔNG tính atStart, vì Q6 không
 *    tính nó và retry-b7 chứng minh atStart có thể vượt 2,0 trong
 *    khi 3 checkpoint kia đều qua), tốc độ
 *    xuôi trong [0,98, 1,02], gap rAF P50 xuôi ≤ 0,015 s, predictedRate
 *    xuôi (trừ tick biên) ≥ 0,98, chromePre = 0, và cổng decode v2
 *    (stall ≤ 1, chuỗi stall ≤ 1, tickRate ≥ 80/s, tailMean < 1,5
 *    NGHIÊM NGẶT, tailMax ≤ 2 — lượt tailMean đúng 1,500 vẫn qua,
 *    đúng quy tắc v2, xem S1 §5.4).
 *  - THÊM (mới): load5 và load15 tối đa qua cùng 3 checkpoint Q6
 *    (beforeFwd, beforeRev, atEnd) đều < 2,0; atStart và loadavg
 *    pre-run chỉ ghi làm tín hiệu, không làm tiêu chí. Ngưỡng này là
 *    ĐỀ XUẤT (status "proposed") cho tới khi có phiên đo riêng xác
 *    nhận: hiệu chuẩn trên 35 lượt thô (Q1 8 + R1 11 + b36 16) cho
 *    thấy nó tách sạch cụm quiet R1 (load5max 1,46–1,84; load15max
 *    0,77–1,30) khỏi cụm "quiet" b36 (load5max 2,06–2,28; load15max
 *    2,07–2,14), đổi nhãn tải của đúng 4 lượt b36 và làm 3 lượt
 *    accepted b36 rớt khỏi thống kê — nhưng đó là hiệu chuẩn HỒI
 *    TỐ, không phải bằng chứng tiền định. Lưu ý độ mong manh:
 *    khoảng cách giữa hai cụm ở load5 chỉ 0,22 (R1 tối đa 1,84 →
 *    b36 tối thiểu 2,06; b8 chỉ vượt ngưỡng 0,06), trong khi ở
 *    load15 là 0,77 — vì vậy v3 yêu cầu CẢ HAI tiêu chí cùng đạt,
 *    và v2 vẫn là cổng chính thức cho tới khi phiên đo riêng (xem
 *    docs/PHASE9_ROUND37_T1_GATE_V3_LIMITS.md §4) chạy với ngưỡng
 *    v3 đã chốt trước.
 *  - THÊM (mới): bộ tách sụp-đoạn vs chậm-toàn-cục bằng tỉ số
 *    GOP2/GOP1, tính từ samplesDetail phase ngược (t = thời điểm
 *    mẫu video): GOP1 = các khoảng mà cả hai đầu mẫu đều ≥ biên
 *    (mặc định 20 s — biên keyframe của fixture sparse-gop-flat),
 *    GOP2 = cả hai đầu < biên, khoảng bắc cầu biên bị loại.
 *    Chỉ có nghĩa khi decode KHÔNG phải STARVED (khi STARVED thì
 *    GOP1 cũng sụp, tỉ số vô nghĩa — ví dụ retry-a3: 1,714).
 *    Với decode = STEADY_SLOW:
 *      ratio < 0,30            → SEGMENT_COLLAPSE (đã hiệu chuẩn:
 *                                bắt 2/5 ca STEADY_SLOW, 0/23 lượt
 *                                HEALTHY bị gắn cờ sai);
 *      0,30 ≤ ratio < 0,435    → INDETERMINATE_MIXED (vùng chưa rõ:
 *                                chỉ có retry-b8 0,343 — sụp đoạn
 *                                nhẹ + chậm toàn cục theo S1 §5.3;
 *                                0,435 là tỉ số thấp nhất quan sát
 *                                được ở lượt HEALTHY, KHÔNG phải
 *                                ngưỡng tiền định);
 *      ratio ≥ 0,435           → NON_SEGMENT (mẫu hình không khu
 *                                trú ở đoạn — phù hợp chậm toàn
 *                                cục nhưng tỉ số một mình KHÔNG
 *                                chứng minh được cơ chế; cần đối
 *                                chiếu GOP1 với baseline cùng phiên).
 *    Tỉ số KHÔNG dùng để nhận/loại lượt — acceptance v3 chỉ phụ
 *    thuộc loadLabelV3 = quiet và decode = HEALTHY. Tỉ số chỉ là
 *    chẩn đoán kèm theo, để không gộp hai dạng chậm thành một.
 *  - Cơ chế sụp đoạn sâu (vì sao GOP2 phẳng ở 1 frame/khoảng mà
 *    không hồi khi t → keyframe 10 s) VẪN CHƯA RÕ — v3 chỉ gắn
 *    nhãn mẫu hình, không claim cơ chế.
 *
 * Đầu vào chấp nhận 2 dạng (không chạy browser):
 *  - forward-hold.json thô của harness N2 (có reverse.samplesDetail);
 *  - JSON gộp kiểu S1 (có load, forwardInterpRate, decodeSide.signals
 *    .drawDeltaSeries/.reverseTickRate, pre/post) — khi đó GOP = null
 *    (thiếu t từng mẫu), các phần còn lại tính lại từ series.
 *  - JSON labeled kiểu Q6/S2 (chỉ có load): chỉ phân loại tải, decode
 *    = UNKNOWN.
 *
 * Cách dùng:
 *   node apps/web/scripts/seek-ab-gate-v3.mjs classify <run.json> [chromePre]
 *   node apps/web/scripts/seek-ab-gate-v3.mjs verify-solo <forward-hold.json> [merged-run.json]
 *     (kiểm tra điều kiện phiên đo riêng: chromePre = 0, chromePost = 0,
 *      acceptedV3; KHÔNG chạy browser, chỉ kiểm tra file đã có. Lưu ý:
 *      JSON gộp kiểu S1 một mình KHÔNG đủ để verify-solo vì thiếu raf
 *      xuôi — phải đưa kèm forward-hold.json thô.)
 * Thoát: 0 = phân loại xong (kể cả under-load/STARVED — đó là kết quả);
 * 2 = thiếu file/dữ liệu.
 * Test: node --test apps/web/scripts/seek-ab-gate-v3.test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const GATE_V3 = {
  version: "v3-proposed",
  status: "proposed",
  note: "v3 la de xuat cho toi khi phien do rieng xac nhan; v2 van la cong chinh thuc. Xem docs/PHASE9_ROUND37_T1_GATE_V3_LIMITS.md.",
  load: {
    load1Max: 2.0, load5Max: 2.0, load15Max: 2.0,
    fwdMin: 0.98, fwdMax: 1.02, rafP50Max: 0.015, predMin: 0.98,
    checkpoints: ["beforeFwd", "beforeRev", "atEnd"],
    checkpointsNote: "atStart va loadavg pre-run chi ghi lam tin hieu, khong lam tieu chi (dung Q6).",
  },
  decode: {
    stallMax: 1, stallRunMax: 1, tickRateMin: 80,
    tailIntervals: 8, tailMeanMax: 1.5, tailMaxMax: 2,
  },
  gop: {
    boundarySecDefault: 20,
    segmentCollapseMax: 0.30,
    healthyFloorObserved: 0.435,
    note: "0.30 la nguong hieu chuan hoi to (2/5 STEADY_SLOW, 0/23 HEALTHY sai); 0.435 chi la san quan sat, khong phai nguong tien dinh.",
  },
};

/** "1.66 2.28 2.14 ..." (hoặc "1.66 2.28 2.14 1/426 17835") → {load1, load5, load15}. */
export function parseLoadavg(str) {
  if (typeof str !== "string") return { load1: null, load5: null, load15: null };
  const p = str.trim().split(/\s+/);
  const n = (x) => { const v = Number(x); return Number.isFinite(v) ? v : null; };
  return { load1: n(p[0]), load5: n(p[1]), load15: n(p[2]) };
}

function loadSeries(loadObj) {
  const out = {};
  if (!loadObj) return out;
  for (const cp of GATE_V3.load.checkpoints) {
    if (loadObj[cp] !== undefined) out[cp] = parseLoadavg(loadObj[cp]);
  }
  return out;
}

/**
 * Tách GOP từ samplesDetail phase ngược. Trả về null khi thiếu dữ liệu
 * hoặc một phía có < 4 khoảng (không đủ mẫu để tính trung bình).
 */
export function gopSplit(samplesDetail, boundarySec = GATE_V3.gop.boundarySecDefault) {
  if (!Array.isArray(samplesDetail) || samplesDetail.length < 3) {
    return { available: false, reason: "thiếu samplesDetail phase ngược (cần ≥ 3 mẫu có t)" };
  }
  const draws = samplesDetail.map((s) => s.draw);
  const ts = samplesDetail.map((s) => s.t);
  if (draws.some((d) => typeof d !== "number") || ts.some((t) => typeof t !== "number")) {
    return { available: false, reason: "samplesDetail thiếu draw hoặc t" };
  }
  const gop1 = [];
  const gop2 = [];
  let boundaryExcluded = 0;
  for (let i = 1; i < draws.length; i++) {
    const dd = draws[i] - draws[i - 1];
    const t0 = ts[i - 1];
    const t1 = ts[i];
    if (t0 >= boundarySec && t1 >= boundarySec) gop1.push(dd);
    else if (t0 < boundarySec && t1 < boundarySec) gop2.push(dd);
    else boundaryExcluded++;
  }
  if (gop1.length < 4 || gop2.length < 4) {
    return { available: false, reason: `quá ít khoảng: GOP1 ${gop1.length}, GOP2 ${gop2.length} (cần ≥ 4 mỗi phía)` };
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const m1 = mean(gop1);
  const m2 = mean(gop2);
  return {
    available: true,
    boundarySec,
    gop1Mean: +m1.toFixed(3),
    gop2Mean: +m2.toFixed(3),
    ratio: +((m2 / m1).toFixed(3)),
    gop1N: gop1.length,
    gop2N: gop2.length,
    gop1Series: gop1,
    gop2Series: gop2,
    boundaryExcluded,
  };
}

/** Cổng decode v2 (giữ nguyên ngưỡng) + tỉ số GOP làm chẩn đoán kèm. */
export function classifyDecodeV3({ drawDeltaSeries, tickRate, samplesDetail, boundarySec }) {
  if (!Array.isArray(drawDeltaSeries) || drawDeltaSeries.length < 3 || typeof tickRate !== "number") {
    return { decodeLabel: "UNKNOWN", reasons: ["thiếu drawDeltaSeries phase ngược hoặc tickRate"], gop: { available: false, reason: "không tính được decode nên không tính GOP" }, gopSubtype: null };
  }
  const { stallMax, stallRunMax, tickRateMin, tailIntervals, tailMeanMax, tailMaxMax } = GATE_V3.decode;
  const afterWarmup = drawDeltaSeries.slice(1);
  let stalls = 0;
  let run = 0;
  let maxRun = 0;
  for (const d of afterWarmup) {
    if (d === 0) { stalls++; run++; maxRun = Math.max(maxRun, run); }
    else run = 0;
  }
  const reasons = [];
  if (stalls > stallMax) reasons.push(`stall intervals sau warmup ${stalls} > ${stallMax}`);
  if (maxRun > stallRunMax) reasons.push(`chuỗi stall dài nhất ${maxRun} khoảng > ${stallRunMax}`);
  if (tickRate < tickRateMin) reasons.push(`tickRate ngược ${tickRate.toFixed(1)}/s < ${tickRateMin}/s`);
  const tail = drawDeltaSeries.slice(-tailIntervals);
  const tailMean = tail.reduce((a, b) => a + b, 0) / tail.length;
  const tailMax = Math.max(...tail);
  const steadySlow = reasons.length === 0 && tailMean < tailMeanMax && tailMax <= tailMaxMax;
  if (steadySlow) {
    reasons.push(`chậm-đều đoạn cuối: tailMean ${tailMean.toFixed(3)} < ${tailMeanMax} và tailMax ${tailMax} <= ${tailMaxMax} (${tailIntervals} khoảng cuối, ~4 s)`);
  }
  const decodeLabel = reasons.length === 0 ? "HEALTHY" : (steadySlow ? "STEADY_SLOW" : "STARVED");
  const gop = samplesDetail ? gopSplit(samplesDetail, boundarySec) : { available: false, reason: "thiếu samplesDetail (JSON gộp không có t từng mẫu) nên không tính được tỉ số GOP" };
  let gopSubtype = null;
  let gopSubtypeReason = null;
  if (decodeLabel === "STEADY_SLOW" && gop.available) {
    if (gop.ratio < GATE_V3.gop.segmentCollapseMax) { gopSubtype = "SEGMENT_COLLAPSE"; gopSubtypeReason = `tỉ số GOP2/GOP1 ${gop.ratio} < ${GATE_V3.gop.segmentCollapseMax}: GOP1 khỏe (${gop.gop1Mean}) nhưng GOP2 sụp (${gop.gop2Mean})`; }
    else if (gop.ratio < GATE_V3.gop.healthyFloorObserved) { gopSubtype = "INDETERMINATE_MIXED"; gopSubtypeReason = `tỉ số ${gop.ratio} nằm trong vùng chưa rõ [0,30, 0,435): không đủ bằng chứng để gọi sụp đoạn thuần hay chậm toàn cục (tiền lệ duy nhất: retry-b8)`; }
    else { gopSubtype = "NON_SEGMENT"; gopSubtypeReason = `tỉ số ${gop.ratio} ≥ sàn HEALTHY quan sát 0,435: mẫu hình không khu trú ở đoạn — phù hợp chậm toàn cục nhưng tỉ số một mình không chứng minh cơ chế`; }
  } else if (decodeLabel === "STARVED") {
    gopSubtypeReason = "STARVED: GOP1 cũng sụp nên tỉ số GOP2/GOP1 không có nghĩa (không phân loại subtype)";
  } else if (decodeLabel === "HEALTHY") {
    gopSubtypeReason = gop.available
      ? `HEALTHY: tỉ số ${gop.ratio} chỉ ghi làm chẩn đoán, không dùng để gắn cờ (hiệu chuẩn: 0/23 lượt HEALTHY có tỉ số < 0,30)`
      : "HEALTHY: không có samplesDetail nên không có tỉ số GOP";
  } else {
    gopSubtypeReason = "decode UNKNOWN nên không phân loại subtype";
  }
  return {
    decodeLabel,
    reasons,
    thresholds: { ...GATE_V3.decode },
    signals: {
      intervals: drawDeltaSeries.length,
      stallIntervalsAfterWarmup: stalls,
      maxStallRun: maxRun,
      reverseTickRate: +tickRate.toFixed(2),
      tailSeries: tail,
      tailMean: +tailMean.toFixed(3),
      tailMax,
      tailFps: +(tailMean / 0.5).toFixed(2),
    },
    gop,
    gopSubtype,
    gopSubtypeReason,
  };
}

/** Cổng tải v3 = v2 + load5/load15 (đề xuất). */
export function classifyLoadV3(input, chromePre) {
  const L = GATE_V3.load;
  const series = loadSeries(input?.load);
  // Đúng Q6: chỉ 3 checkpoint này làm tiêu chí; atStart chỉ là tín hiệu.
  const checkpoints = ["beforeFwd", "beforeRev", "atEnd"].filter((cp) => series[cp]);
  const reasons = [];
  const maxOf = (key) => {
    const vs = checkpoints.map((cp) => series[cp][key]).filter((v) => v !== null);
    return vs.length ? Math.max(...vs) : null;
  };
  const load1Max = maxOf("load1");
  const load5Max = maxOf("load5");
  const load15Max = maxOf("load15");
  if (checkpoints.length === 0 || load1Max === null) reasons.push("thiếu loadavg N2");
  else {
    if (load1Max >= L.load1Max) reasons.push(`load1 tối đa ${load1Max} ≥ ${L.load1Max} (kế thừa v2)`);
    if (load5Max !== null && load5Max >= L.load5Max) reasons.push(`load5 tối đa ${load5Max} ≥ ${L.load5Max} (v3 mới, đề xuất)`);
    if (load15Max !== null && load15Max >= L.load15Max) reasons.push(`load15 tối đa ${load15Max} ≥ ${L.load15Max} (v3 mới, đề xuất)`);
  }
  const fwd = input?.forward?.interpRate ?? input?.forwardInterpRate ?? input?.signals?.forwardInterpRate ?? null;
  if (fwd === null) reasons.push("thiếu forward.interpRate");
  else if (fwd < L.fwdMin || fwd > L.fwdMax) reasons.push(`tốc độ xuôi ${fwd} ngoài [${L.fwdMin}, ${L.fwdMax}]`);
  const rafFwd = input?.raf?.forward ?? null;
  const rafP50 = rafFwd?.gapP50 ?? input?.signals?.rafForward?.gapP50 ?? input?.rafForwardGapP50 ?? null;
  const predExcl = rafFwd?.exclFirst?.predictedRate ?? input?.signals?.rafForward?.exclFirstPredictedRate ?? input?.rafForwardPredExcl ?? null;
  if (rafP50 === null) reasons.push("thiếu gap rAF P50 phase xuôi");
  else if (rafP50 > L.rafP50Max) reasons.push(`gap rAF P50 xuôi ${rafP50}s > ${L.rafP50Max}s`);
  if (predExcl === null) reasons.push("thiếu predictedRate phase xuôi (trừ tick biên)");
  else if (predExcl < L.predMin) reasons.push(`predictedRate xuôi (trừ tick biên) ${predExcl} < ${L.predMin}`);
  const chrome = chromePre ?? input?.pre?.chromePre ?? input?.machine?.processes?.chromePre ?? null;
  if (typeof chrome === "number" && chrome !== 0) reasons.push(`có ${chrome} tiến trình Chrome trước lượt (luồng browser khác)`);
  return {
    loadLabelV3: reasons.length === 0 ? "quiet" : "under-load",
    labelReasonsV3: reasons,
    chromePreVerified: chrome === 0,
    signals: {
      load1: series, load1Max, load5Max, load15Max,
      preLoadavg: input?.pre?.loadavg ?? input?.machine?.processes?.pre?.loadavg?.raw ?? null,
      forwardInterpRate: fwd, rafForwardGapP50: rafP50, rafForwardPredExcl: predExcl,
    },
  };
}

/** Chuẩn hóa 1 run (thô N2 / gộp S1 / labeled Q6) về input cho 2 cổng. */
export function normalizeRun(run) {
  const sd = run?.reverse?.samplesDetail ?? null;
  const mergedSignals = run?.decodeSide?.signals ?? null;
  let drawDeltaSeries = null;
  let tickRate = null;
  if (sd) {
    const draws = sd.map((s) => s.draw);
    drawDeltaSeries = [];
    for (let i = 1; i < draws.length; i++) drawDeltaSeries.push(draws[i] - draws[i - 1]);
    const rr = run?.raf?.reverse;
    if (rr?.n && rr?.wallSec) tickRate = rr.n / rr.wallSec;
  } else if (mergedSignals?.drawDeltaSeries) {
    drawDeltaSeries = mergedSignals.drawDeltaSeries;
    tickRate = mergedSignals.reverseTickRate ?? null;
  }
  return { drawDeltaSeries, tickRate, samplesDetail: sd };
}

export function classifyRunV3(run, opts = {}) {
  const norm = normalizeRun(run);
  const load = classifyLoadV3(run, opts.chromePre);
  const decode = classifyDecodeV3({ ...norm, boundarySec: opts.boundarySec });
  const acceptedV3 = load.loadLabelV3 === "quiet" && decode.decodeLabel === "HEALTHY";
  return {
    gate: GATE_V3.version,
    gateStatus: GATE_V3.status,
    run: run?.run ?? run?.runAt ?? null,
    variant: run?.variant ?? null,
    fps: run?.reverse?.fps ?? run?.reverseFps ?? null,
    loadLabelV3: load.loadLabelV3,
    labelReasonsV3: load.labelReasonsV3,
    chromePreVerified: load.chromePreVerified,
    loadSignals: load.signals,
    decodeLabel: decode.decodeLabel,
    decodeReasons: decode.reasons,
    decodeSignals: decode.signals,
    gop: decode.gop,
    gopSubtype: decode.gopSubtype,
    gopSubtypeReason: decode.gopSubtypeReason,
    acceptedV3,
    note: "acceptedV3 chi co gia tri khi loadLabelV3 = quiet VA decode = HEALTHY. v3 la de xuat; so sanh chinh thuc van dung v2 cho toi khi phien do rieng xac nhan v3.",
  };
}

/**
 * Kiểm tra điều kiện phiên đo riêng (solo session) cho 1 lượt đã có.
 * Vì không có một file duy nhất chứa đủ mọi thứ (forward-hold.json thô
 * có load + raf + decode nhưng không có số Chrome trước/sau; JSON gộp
 * kiểu S1 có pre/post Chrome nhưng không có raf xuôi), verifySolo nhận
 * 2 đầu vào: run thô (N2) và merged (tùy chọn, để lấy pre/post Chrome).
 * Dạng 1 đối số vẫn hỗ trợ khi run tự mang pre/post (như test).
 * Không chạy browser, chỉ kiểm tra bằng chứng đã có.
 */
export function verifySolo(run, mergedOrOpts = {}) {
  const merged = mergedOrOpts && (mergedOrOpts.pre || mergedOrOpts.post || mergedOrOpts.bundle) ? mergedOrOpts : null;
  const opts = merged ? {} : mergedOrOpts;
  const v3 = classifyRunV3(run, opts);
  const chromePre = opts.chromePre ?? run?.pre?.chromePre ?? merged?.pre?.chromePre ?? null;
  const chromePost = run?.post?.chromePost ?? merged?.post?.chromePost ?? run?.machine?.processes?.chromePost ?? merged?.machine?.processes?.chromePost ?? null;
  const problems = [];
  if (chromePre !== 0) problems.push(chromePre === null ? "chromePre không xác minh được = 0" : `chromePre = ${chromePre} ≠ 0`);
  if (chromePost === null) problems.push("thiếu chromePost (không chứng minh được không có browser khác chen giữa lượt)");
  else if (chromePost !== 0) problems.push(`chromePost = ${chromePost} ≠ 0 (browser khác chen giữa lượt)`);
  if (merged?.bundle && run?.bundle && merged.bundle !== run.bundle) problems.push(`bundle merged ${merged.bundle} ≠ bundle thô ${run.bundle}`);
  if (!v3.acceptedV3) problems.push(`không acceptedV3 (load ${v3.loadLabelV3}, decode ${v3.decodeLabel})`);
  return { ...v3, chromePre, soloEligible: problems.length === 0, soloProblems: problems, chromePost };
}

function main() {
  const mode = process.argv[2];
  const file = process.argv[3];
  if ((mode !== "classify" && mode !== "verify-solo") || !file || !fs.existsSync(file)) {
    console.error("Cách dùng: seek-ab-gate-v3.mjs classify <run.json> [chromePre] | verify-solo <forward-hold.json> [merged-run.json]");
    process.exit(2);
  }
  const run = JSON.parse(fs.readFileSync(file, "utf8"));
  if (mode === "verify-solo") {
    const mergedFile = process.argv[4];
    const merged = mergedFile && fs.existsSync(mergedFile) ? JSON.parse(fs.readFileSync(mergedFile, "utf8")) : null;
    console.log(JSON.stringify(verifySolo(run, merged ?? {}), null, 2));
    return;
  }
  const chromePreArg = process.argv[4] !== undefined ? Number(process.argv[4]) : undefined;
  console.log(JSON.stringify(classifyRunV3(run, { chromePre: chromePreArg }), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
