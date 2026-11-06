#!/usr/bin/env node
/**
 * Phase 9 đợt 39, luồng T2 — phân tích dữ liệu probe per-seek của harness N2.
 * v2: Phase 9 đợt 40, luồng V6 (elementId + mẫu decoded trong lúc seeking).
 *
 * Module thuần Node (không DOM, không browser): nhận entries do
 * per-seek-probe-page.js ghi trong trang đo, kiểm tra tính nhất quán,
 * gắn nhãn cơ chế theo dự đoán đăng ký trước của U6 §3.3, và tổng hợp.
 * Mọi nhãn cơ chế ở đây đều là NHÃN MÔ TẢ (heuristic), không phải cổng
 * nhận/loại: bằng chứng là các trường thô, nhãn chỉ tóm tắt chúng.
 *
 * Tương thích v2 (đợt 40 V6): 17 trường spec §3.3 giữ nguyên, validate
 * vẫn đạt cho entry v1 (không có trường v2). Trường v2 chỉ được kiểm
 * tra KHI CÓ MẶT, không bắt buộc. mechanismLabel KHÔNG đổi theo v2 —
 * mẫu trong lúc seeking được phân tích riêng bằng analyzeSeekingSamples
 * (bằng chứng thô), để nhãn cơ chế cũ tái tạo được từ dữ liệu v2 và
 * không làm lệch hồi quy cổng/solo.
 *
 * Ngưỡng heuristic (ghi rõ để không bị đọc thành ngưỡng vật lý):
 * SEEK_SLOW_MS = 100 ms ~ 3 frame @30fps. "Phình" = >= 100 ms.
 * - seek-scheduling: seekLatency >= 100 ms, decoded tăng prompt sau
 *   seeked (firstDecoded - seeked < 100 ms) -> nút thắt ở lập lịch seek
 *   (U6 dự đoán 1). Nếu firstDecoded không có mà decoded đã tăng tới
 *   lúc firstDraw thì vẫn tính, với lý do ghi rõ "decoded tăng tới
 *   firstDraw (không bắt được tick decode riêng)".
 * - decode-stall: seekLatency < 100 ms, drawLatency >= 100 ms, decoded
 *   đứng yên tới lúc draw (firstDecoded null hoặc >= 100 ms sau seeked,
 *   decodedDeltaToFirstDraw === 0) -> decode stall (U6 dự đoán 2).
 * - presentation-draw: seekLatency < 100 ms, decoded tăng prompt sau
 *   seeked (< 100 ms) nhưng drawLatency >= 100 ms -> nút thắt ở tầng
 *   presentation/draw (U6 dự đoán 3; rAF đều được kiểm tra gián tiếp qua
 *   rafTicksWhileWaiting > 0 — probe rAF của N2 mới là bằng chứng rAF
 *   trực tiếp, không suy diễn từ đây).
 * - fast: cả hai latency < 100 ms. mixed: còn lại. undetermined: entry
 *   chưa hoàn tất (superseded / seeked-no-draw / unresolved) hoặc thiếu
 *   trường — không được dùng để kết luận cơ chế.
 *
 * Segment: gopIndexFor(targetTime, gopSeconds) chỉ đúng khi GOP đều
 * (fixture sparse-gop-flat: 300 frame @30fps = 10 s — ROUND45-A5:
 * KHÔNG phải sparse-gop-noise, GOP hiệu dụng 30 = 1 s).
 * Với footage GOP không
 * đều, segment trong summary chỉ là "khoảng 10 s" mô tả, không phải
 * chỉ số GOP thật — LIMITS T2 ghi rõ điểm này.
 */
export const PERSEEK_VERSION = "per-seek-v2";
export const SEEK_SLOW_MS = 100;

/** Đúng 17 trường §3.3 (k + 16 trường), theo đúng tên đã chốt trước. */
export const PERSEEK_SPEC_FIELDS = [
  "k", "targetTime",
  "seekRequestedAtMs", "seekedAtMs", "firstDrawAfterSeekAtMs",
  "seekLatencyMs", "drawLatencyMs",
  "currentTimeAtSeek", "currentTimeAtSeeked",
  "decodedFramesAtSeek", "decodedFramesAtSeeked",
  "droppedFramesAtSeek", "droppedFramesAtSeeked",
  "rafTicksWhileWaiting",
  "holdCountAtSeek", "holdCountAtFirstDraw",
];
/** Trường mở rộng của T2 (ngoài §3.3), ghi rõ để không bị đọc là spec. */
export const PERSEEK_EXTRA_FIELDS = [
  "firstDecodedAfterSeekAtMs", "decodedFramesAtFirstDraw",
  "decodedDeltaToFirstDraw", "phase", "status", "elementKind",
  "seekedEvent", "firstDrawBasis",
];
/** Trường mở rộng của V6 v2 (ngoài §3.3 và ngoài extra v1). */
export const PERSEEK_V2_EXTRA_FIELDS = [
  "elementId", "decodedSamplesWhileSeeking", "droppedSeekingSamples",
  "flushElementSrc", "flushElementReadyState",
];

function isNum(v) { return typeof v === "number" && Number.isFinite(v); }
function approxEq(a, b, eps = 1.0) { return isNum(a) && isNum(b) && Math.abs(a - b) <= eps; }

/**
 * Kiểm tra 1 entry. Trả về [] nếu hợp lệ. Entry chưa hoàn tất vẫn hợp
 * lệ về hình thức khi các latency null của nó nhất quán với trạng thái
 * (seeked null -> seekLatency null; draw null -> drawLatency null).
 */
export function validatePerSeekEntry(e) {
  const problems = [];
  if (!e || typeof e !== "object") return ["entry không phải object"];
  for (const f of PERSEEK_SPEC_FIELDS) {
    if (!(f in e)) problems.push(`thiếu trường spec ${f}`);
  }
  if (!Number.isInteger(e.k) || e.k < 0) problems.push(`k không hợp lệ: ${e.k}`);
  if (!isNum(e.targetTime)) problems.push("targetTime không phải số");
  if (!isNum(e.seekRequestedAtMs)) problems.push("seekRequestedAtMs không phải số");
  if (e.seekedAtMs !== null && !isNum(e.seekedAtMs)) problems.push("seekedAtMs không phải số/null");
  if (e.firstDrawAfterSeekAtMs !== null && !isNum(e.firstDrawAfterSeekAtMs)) problems.push("firstDrawAfterSeekAtMs không phải số/null");
  if (e.seekedAtMs !== null && e.seekedAtMs < e.seekRequestedAtMs) problems.push("seekedAtMs trước seekRequestedAtMs");
  if (e.firstDrawAfterSeekAtMs !== null && e.seekedAtMs !== null && e.firstDrawAfterSeekAtMs < e.seekedAtMs) problems.push("firstDrawAfterSeekAtMs trước seekedAtMs");
  if (e.seekedAtMs !== null && !approxEq(e.seekLatencyMs, e.seekedAtMs - e.seekRequestedAtMs)) problems.push(`seekLatencyMs ${e.seekLatencyMs} lệch khỏi seeked-requested`);
  if (e.seekedAtMs === null && e.seekLatencyMs !== null) problems.push("chưa seeked nhưng seekLatencyMs không null");
  if (e.firstDrawAfterSeekAtMs !== null && e.seekedAtMs !== null && !approxEq(e.drawLatencyMs, e.firstDrawAfterSeekAtMs - e.seekedAtMs)) problems.push(`drawLatencyMs ${e.drawLatencyMs} lệch khỏi firstDraw-seeked`);
  if (e.firstDrawAfterSeekAtMs === null && e.drawLatencyMs !== null) problems.push("chưa firstDraw nhưng drawLatencyMs không null");
  if (!Number.isInteger(e.rafTicksWhileWaiting) || e.rafTicksWhileWaiting < 0) problems.push(`rafTicksWhileWaiting không hợp lệ: ${e.rafTicksWhileWaiting}`);
  for (const f of ["decodedFramesAtSeek", "decodedFramesAtSeeked", "droppedFramesAtSeek", "droppedFramesAtSeeked"]) {
    if (e[f] !== null && (!Number.isInteger(e[f]) || e[f] < 0)) problems.push(`${f} không phải số nguyên >= 0/null: ${e[f]}`);
  }
  for (const f of ["holdCountAtSeek", "holdCountAtFirstDraw"]) {
    if (e[f] !== null && (!Number.isInteger(e[f]) || e[f] < 0)) problems.push(`${f} không phải số nguyên >= 0/null: ${e[f]}`);
  }
  if (e.status === "completed" && (e.seekedAtMs === null || e.firstDrawAfterSeekAtMs === null)) problems.push("status completed nhưng thiếu seeked/firstDraw");
  // v2: chỉ kiểm tra khi trường có mặt (entry v1 không có vẫn đạt).
  if ("elementId" in e && e.elementId !== null && (!Number.isInteger(e.elementId) || e.elementId < 0)) problems.push(`elementId không hợp lệ: ${e.elementId}`);
  if ("droppedSeekingSamples" in e && e.droppedSeekingSamples !== null && (!Number.isInteger(e.droppedSeekingSamples) || e.droppedSeekingSamples < 0)) problems.push(`droppedSeekingSamples không hợp lệ: ${e.droppedSeekingSamples}`);
  if ("flushElementReadyState" in e && e.flushElementReadyState !== null && (!Number.isInteger(e.flushElementReadyState) || e.flushElementReadyState < 0)) problems.push(`flushElementReadyState không hợp lệ: ${e.flushElementReadyState}`);
  if ("decodedSamplesWhileSeeking" in e && e.decodedSamplesWhileSeeking !== null) {
    const samples = e.decodedSamplesWhileSeeking;
    if (!Array.isArray(samples)) problems.push("decodedSamplesWhileSeeking không phải mảng");
    else {
      let prevT = null;
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        if (!s || typeof s !== "object") { problems.push(`mẫu seeking ${i} không phải object`); continue; }
        if (!isNum(s.tMs)) problems.push(`mẫu seeking ${i} thiếu tMs số`);
        else {
          if (isNum(e.seekRequestedAtMs) && s.tMs < e.seekRequestedAtMs) problems.push(`mẫu seeking ${i} có tMs trước seekRequestedAtMs`);
          if (prevT !== null && s.tMs < prevT) problems.push(`mẫu seeking ${i} có tMs không đơn điệu`);
          prevT = s.tMs;
        }
        if (s.decoded !== null && (!Number.isInteger(s.decoded) || s.decoded < 0)) problems.push(`mẫu seeking ${i} có decoded không hợp lệ: ${s.decoded}`);
        if (s.dropped !== null && (!Number.isInteger(s.dropped) || s.dropped < 0)) problems.push(`mẫu seeking ${i} có dropped không hợp lệ: ${s.dropped}`);
      }
    }
  }
  return problems;
}

/**
 * Phân tích mẫu decoded TRONG lúc seeking của một entry v2.
 * Trả về bằng chứng thô, không gắn nhãn cơ chế (không thay mechanismLabel):
 * - progress "rising": decoded tăng trong lúc seeking (decode tiến triển
 *   trong lúc chờ seeked — phù hợp seek-scheduling hơn decode stall);
 * - progress "flat": decoded đứng yên suốt lúc seeking (decode chưa chạy
 *   hoặc kẹt trong lúc chờ — cần đối chiếu với decoded sau seeked);
 * - progress "unknown": không có mẫu, hoặc decoded null (API không có).
 * decodedDeltaWhileSeeking = mẫu cuối − decoded lúc gán (null khi thiếu).
 */
export function analyzeSeekingSamples(e) {
  const samples = Array.isArray(e?.decodedSamplesWhileSeeking) ? e.decodedSamplesWhileSeeking : [];
  if (!samples.length) {
    return { sampleCount: 0, droppedSeekingSamples: e?.droppedSeekingSamples ?? null, progress: "unknown", decodedDeltaWhileSeeking: null, firstSampleAtMs: null, lastSampleAtMs: null, spanMs: null, reason: "không có mẫu trong lúc seeking (entry v1, seek quá nhanh, hoặc API decoded không có)" };
  }
  const decodedVals = samples.map((s) => s.decoded).filter((v) => v !== null && v !== undefined);
  const first = samples[0].tMs;
  const last = samples[samples.length - 1].tMs;
  if (!decodedVals.length) {
    return { sampleCount: samples.length, droppedSeekingSamples: e?.droppedSeekingSamples ?? null, progress: "unknown", decodedDeltaWhileSeeking: null, firstSampleAtMs: first, lastSampleAtMs: last, spanMs: last - first, reason: "mẫu có nhưng decoded null (API playback quality không có)" };
  }
  const base = isNum(e.decodedFramesAtSeek) ? e.decodedFramesAtSeek : decodedVals[0];
  const delta = decodedVals[decodedVals.length - 1] - base;
  const allEqual = decodedVals.every((v) => v === decodedVals[0]);
  const progress = delta > 0 ? "rising" : (delta === 0 && allEqual ? "flat" : "unknown");
  return {
    sampleCount: samples.length,
    droppedSeekingSamples: e?.droppedSeekingSamples ?? null,
    progress,
    decodedDeltaWhileSeeking: delta,
    firstSampleAtMs: first,
    lastSampleAtMs: last,
    spanMs: last - first,
    reason: progress === "rising"
      ? `decoded tăng ${delta} frame trong lúc seeking (${samples.length} mẫu)`
      : (progress === "flat"
        ? `decoded đứng yên ở ${decodedVals[0]} suốt ${samples.length} mẫu trong lúc seeking`
        : "decoded không đơn điệu hoặc giảm trong lúc seeking (counter reset / element đổi src) — không kết luận"),
  };
}

/** Gắn nhãn cơ chế cho 1 entry đã hoàn tất; entry chưa xong -> undetermined. */
export function mechanismLabel(e) {
  if (!e || e.status !== "completed" || !isNum(e.seekLatencyMs) || !isNum(e.drawLatencyMs)) {
    return { label: "undetermined", reason: `entry chưa hoàn tất (status=${e?.status ?? "?"}) nên không kết luận cơ chế` };
  }
  const seek = e.seekLatencyMs;
  const draw = e.drawLatencyMs;
  const decodeLatency = isNum(e.firstDecodedAfterSeekAtMs) && isNum(e.seekedAtMs)
    ? e.firstDecodedAfterSeekAtMs - e.seekedAtMs : null;
  const decodedDelta = e.decodedDeltaToFirstDraw;
  if (seek >= SEEK_SLOW_MS && (decodeLatency !== null && decodeLatency < SEEK_SLOW_MS)) {
    return { label: "seek-scheduling", reason: `seekLatency ${seek.toFixed(1)}ms phình, decoded tăng prompt sau seeked (${decodeLatency.toFixed(1)}ms)` };
  }
  if (seek >= SEEK_SLOW_MS && decodedDelta !== null && decodedDelta > 0 && decodeLatency === null) {
    return { label: "seek-scheduling", reason: `seekLatency ${seek.toFixed(1)}ms phình, decoded tăng tới firstDraw (không bắt được tick decode riêng)` };
  }
  if (seek < SEEK_SLOW_MS && draw >= SEEK_SLOW_MS && (decodeLatency === null || decodeLatency >= SEEK_SLOW_MS) && decodedDelta === 0) {
    return { label: "decode-stall", reason: `seeked nhanh (${seek.toFixed(1)}ms) nhưng draw trễ ${draw.toFixed(1)}ms trong khi decoded đứng yên` };
  }
  if (seek < SEEK_SLOW_MS && draw >= SEEK_SLOW_MS && decodeLatency !== null && decodeLatency < SEEK_SLOW_MS) {
    return { label: "presentation-draw", reason: `seeked nhanh (${seek.toFixed(1)}ms), decoded tăng prompt (${decodeLatency.toFixed(1)}ms) nhưng draw trễ ${draw.toFixed(1)}ms` };
  }
  if (seek < SEEK_SLOW_MS && draw < SEEK_SLOW_MS) {
    return { label: "fast", reason: `cả seek (${seek.toFixed(1)}ms) và draw (${draw.toFixed(1)}ms) đều < ${SEEK_SLOW_MS}ms` };
  }
  return { label: "mixed", reason: `seek ${seek.toFixed(1)}ms, draw ${draw.toFixed(1)}ms, decodeLatency ${decodeLatency === null ? "null" : decodeLatency.toFixed(1) + "ms"} — không khớp sạch dự đoán nào` };
}

/** Chỉ số GOP khi GOP đều (fixture sparse-gop-flat 10 s — ROUND45-A5:
 *  KHÔNG phải sparse-gop-noise, GOP hiệu dụng 30); ngược lại trả null. */
export function gopIndexFor(targetTime, gopSeconds) {
  if (!isNum(targetTime) || !isNum(gopSeconds) || !(gopSeconds > 0)) return null;
  return Math.floor(targetTime / gopSeconds);
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function percentile(nums, p) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

/** Chỉ lấy seek trong phase reverse (phase do harness mark). */
export function reverseEntries(entries) {
  return (entries || []).filter((e) => e.phase === "reverse");
}

/**
 * Tổng hợp entries (mặc định: toàn bộ entries; gọi với reverseEntries()
 * trước nếu chỉ muốn phase reverse). bySegment chỉ có khi gopSeconds
 * hợp lệ, và chỉ là nhóm theo khoảng GOP đều — xem ghi chú đầu file.
 */
export function summarizePerSeek(entries, { gopSeconds = null } = {}) {
  const list = entries || [];
  const completed = list.filter((e) => e.status === "completed");
  const byMechanism = {};
  const byStatus = {};
  const byPhase = {};
  for (const e of list) {
    byStatus[e.status ?? "?"] = (byStatus[e.status ?? "?"] || 0) + 1;
    byPhase[e.phase ?? "?"] = (byPhase[e.phase ?? "?"] || 0) + 1;
    const { label } = mechanismLabel(e);
    byMechanism[label] = (byMechanism[label] || 0) + 1;
  }
  const seekLat = completed.map((e) => e.seekLatencyMs);
  const drawLat = completed.map((e) => e.drawLatencyMs);
  let bySegment = null;
  if (isNum(gopSeconds) && gopSeconds > 0) {
    const buckets = new Map();
    for (const e of completed) {
      const seg = gopIndexFor(e.targetTime, gopSeconds);
      if (seg === null) continue;
      if (!buckets.has(seg)) buckets.set(seg, []);
      buckets.get(seg).push(e);
    }
    bySegment = [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([segment, es]) => ({
      segment,
      targetRangeSec: [segment * gopSeconds, (segment + 1) * gopSeconds],
      count: es.length,
      medianSeekLatencyMs: median(es.map((e) => e.seekLatencyMs)),
      medianDrawLatencyMs: median(es.map((e) => e.drawLatencyMs)),
      byMechanism: es.reduce((acc, e) => {
        const { label } = mechanismLabel(e);
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {}),
    }));
  }
  return {
    version: PERSEEK_VERSION,
    count: list.length,
    completed: completed.length,
    byStatus, byPhase, byMechanism,
    seekLatencyMs: { median: median(seekLat), p95: percentile(seekLat, 0.95), max: seekLat.length ? Math.max(...seekLat) : null },
    drawLatencyMs: { median: median(drawLat), p95: percentile(drawLat, 0.95), max: drawLat.length ? Math.max(...drawLat) : null },
    bySegment,
  };
}
