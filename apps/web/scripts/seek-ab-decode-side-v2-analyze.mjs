#!/usr/bin/env node
/**
 * Phase 9 đợt 36, luồng S1 — probe decode-side v2 cho A/B seekElement.
 *
 * Vấn đề của cổng v1 (đợt 35 R1): chỉ bắt stall (drawDelta = 0 từng
 * khoảng) nên bỏ sót chế độ CHẬM-ĐỀU — lượt single-a4 đợt 35 đạt
 * HEALTHY v1 (stall 0, tick 93,1/s) dù chỉ 7,32 fps, với chuỗi draw
 * 1/khoảng suốt ~4 s cuối phase ngược. Cổng v2 GIỮ NGUYÊN mọi ngưỡng
 * v1 (stall <= 1, maxStallRun <= 1, tickRate >= 80/s — không nới,
 * không siết) và THÊM một điều kiện chậm-đều ở đoạn cuối phase:
 *
 *   STEADY_SLOW khi tailMean < 1,5 VÀ tailMax <= 2,
 *   trong đó tail = 8 khoảng drawDelta CUỐI CÙNG của phase ngược
 *   (8 khoảng x 0,5 s = ~4 s cuối — đúng đoạn single-a4 chậm).
 *
 * Vì sao ngưỡng này (đặt TRƯỚC khi đo đợt 36, hiệu chuẩn trên 19 lượt
 * cũ: 8 lượt đợt 34 Q1 + 11 lượt đợt 35 R1 — xem mode calibrate):
 *  - Trên 6 lượt quiet HEALTHY v1 của đợt 35, tailMean = 2,375–2,75,
 *    tailMax = 3–4. single-a4: tailMean = 1,0, tailMax = 1 — thấp hơn
 *    mức khỏe thấp nhất tới 58% (tailMean) và tách biệt hoàn toàn
 *    ở tailMax. Ngưỡng 1,5 / 2 nằm giữa hai cụm, không sát biên.
 *  - Trên 8 lượt đợt 34, không lượt HEALTHY v1 nào bị v2 gắn cờ mới:
 *    lượt khỏe nhất đợt 34 (retry-3: tailMean 1,625; single-2:
 *    tailMean đúng 1,5, nhưng điều kiện là < 1,5 nghiêm ngặt nên
 *    KHÔNG bị gắn cờ) đều qua; các lượt tail thấp hơn (<= 1,0) đều
 *    đã STARVED theo v1. Vậy v2 chỉ gắn cờ MỚI đúng single-a4
 *    trong toàn bộ 19 lượt hiệu chuẩn — không có false positive
 *    mới nào trên dữ liệu cũ.
 *  - tailMean < 1,5 tương đương tốc độ vẽ đoạn cuối < 3 fps
 *    (1,5 frame / 0,5 s), trong khi lượt khỏe vẽ 4,75–5,5 fps ở
 *    cùng đoạn — mức chậm này đủ lớn để méo trung vị ở n nhỏ.
 *
 * Vì sao KHÔNG dùng tỉ số tail/head làm cổng chính: mọi lượt đều có
 * tail/head ~0,42–0,55 (đoạn cuối chậm hơn đầu phase một cách hệ
 * thống — xem LIMITS S1 §3: đó là đoạn GOP thứ hai sau biên 20 s,
 * seek về keyframe 10 s tốn hơn), nên tỉ số không tách được
 * single-a4 (0,20) khỏi lượt khỏe một cách an toàn bằng ngưỡng
 * tuyệt đối; tỉ số chỉ ghi làm tín hiệu chẩn đoán.
 *
 * Nhãn v2: HEALTHY | STARVED (vi phạm v1) | STEADY_SLOW (qua v1
 * nhưng chậm-đều đoạn cuối). Lượt chỉ được nhận vào thống kê A/B
 * khi decodeLabel v2 = HEALTHY (cộng với nhãn quiet v2 của Q6).
 * Probe này vẫn chỉ đo đầu ra draw-delivery, không đo trực tiếp
 * bên trong decoder Chrome — giới hạn như v1, xem LIMITS S1.
 *
 * Cách dùng:
 *   node apps/web/scripts/seek-ab-decode-side-v2-analyze.mjs <forward-hold.json>
 *   node apps/web/scripts/seek-ab-decode-side-v2-analyze.mjs calibrate
 * Thoát: 0 = phân tích xong (kể cả STARVED/STEADY_SLOW — đó là kết
 * quả, không phải lỗi); 2 = thiếu file/dữ liệu.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const STALL_MAX = 1;
const STALL_RUN_MAX = 1;
const TICK_RATE_MIN = 80;
const TAIL_N = 8;
const TAIL_MEAN_MAX = 1.5; // gắn cờ khi tailMean < giá trị này (nghiêm ngặt)
const TAIL_MAX_MAX = 2; // và tailMax <= giá trị này

export function analyzeDecodeSideV2(n2) {
  const sd = n2?.reverse?.samplesDetail ?? null;
  const rafRev = n2?.raf?.reverse ?? null;
  if (!Array.isArray(sd) || sd.length < 3 || !rafRev || !rafRev.n || !rafRev.wallSec) {
    return { decodeLabel: "UNKNOWN", reasons: ["thiếu samplesDetail phase ngược hoặc raf.reverse (n/wallSec)"] };
  }
  const draws = sd.map((s) => s.draw);
  const holds = sd.map((s) => s.hold);
  const drawDeltas = [];
  const holdDeltas = [];
  for (let i = 1; i < draws.length; i++) {
    drawDeltas.push(draws[i] - draws[i - 1]);
    holdDeltas.push(holds[i] - holds[i - 1]);
  }
  const afterWarmup = drawDeltas.slice(1);
  let stalls = 0;
  let run = 0;
  let maxRun = 0;
  for (const d of afterWarmup) {
    if (d === 0) { stalls++; run++; maxRun = Math.max(maxRun, run); }
    else run = 0;
  }
  const tickRate = rafRev.n / rafRev.wallSec;
  const reasons = [];
  if (stalls > STALL_MAX) reasons.push(`stall intervals sau warmup ${stalls} > ${STALL_MAX}`);
  if (maxRun > STALL_RUN_MAX) reasons.push(`chuỗi stall dài nhất ${maxRun} khoảng > ${STALL_RUN_MAX}`);
  if (tickRate < TICK_RATE_MIN) reasons.push(`tickRate ngược ${tickRate.toFixed(1)}/s < ${TICK_RATE_MIN}/s`);
  // --- Tín hiệu đoạn cuối (v2 mới) ---
  const tail = drawDeltas.slice(-TAIL_N);
  const head = drawDeltas.slice(1, -TAIL_N);
  const tailMean = tail.reduce((a, b) => a + b, 0) / tail.length;
  const tailMax = Math.max(...tail);
  const tailMin = Math.min(...tail);
  const headMean = head.length ? head.reduce((a, b) => a + b, 0) / head.length : null;
  // Độ dốc tuyến tính của tail theo chỉ số khoảng (chẩn đoán, không làm cổng).
  const n = tail.length;
  const meanX = (n - 1) / 2;
  const meanY = tailMean;
  let num = 0;
  let den = 0;
  tail.forEach((y, i) => { num += (i - meanX) * (y - meanY); den += (i - meanX) ** 2; });
  const tailSlope = den ? num / den : 0;
  const steadySlow = reasons.length === 0 && tailMean < TAIL_MEAN_MAX && tailMax <= TAIL_MAX_MAX;
  if (steadySlow) {
    reasons.push(`chậm-đều đoạn cuối: tailMean ${tailMean.toFixed(3)} < ${TAIL_MEAN_MAX} và tailMax ${tailMax} <= ${TAIL_MAX_MAX} (8 khoảng cuối, ~4 s)`);
  }
  return {
    decodeLabel: reasons.length === 0 ? "HEALTHY" : (steadySlow ? "STEADY_SLOW" : "STARVED"),
    reasons,
    thresholds: {
      stallMax: STALL_MAX, stallRunMax: STALL_RUN_MAX, tickRateMin: TICK_RATE_MIN,
      tailIntervals: TAIL_N, tailMeanMax: TAIL_MEAN_MAX, tailMaxMax: TAIL_MAX_MAX,
    },
    signals: {
      intervals: drawDeltas.length,
      drawDeltaSeries: drawDeltas,
      holdDeltaSeries: holdDeltas,
      stallIntervalsAfterWarmup: stalls,
      maxStallRun: maxRun,
      firstIntervalDrawDelta: drawDeltas[0],
      reverseTickRate: Number(tickRate.toFixed(2)),
      reverseRafN: rafRev.n,
      reverseRafWallSec: rafRev.wallSec,
      reverseRafGapP50: rafRev.gapP50,
      reverseDrawDelta: n2.reverse.drawDelta,
      reverseFps: n2.reverse.fps,
      tailSeries: tail,
      tailMean: Number(tailMean.toFixed(3)),
      tailMax,
      tailMin,
      tailFps: Number((tailMean / 0.5).toFixed(2)),
      headMean: headMean === null ? null : Number(headMean.toFixed(3)),
      tailHeadRatio: headMean ? Number((tailMean / headMean).toFixed(3)) : null,
      tailSlope: Number(tailSlope.toFixed(3)),
    },
  };
}

function main() {
  const arg = process.argv[2];
  if (!arg) { console.error("Cần đối số: <forward-hold.json> hoặc calibrate"); process.exit(2); }
  if (arg === "calibrate") {
    const dir = path.resolve("benchmarks/results");
    const v34 = fs.readdirSync(dir).filter((f) => /^v34-q1-seek-ab-(retry|single)-[1-4]\.json$/.test(f)).sort();
    console.log("Hiệu chuẩn v2 trên 8 lượt đợt 34 Q1:");
    for (const f of v34) {
      const n2 = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      const a = analyzeDecodeSideV2(n2);
      console.log(`  ${f} fps=${n2.reverse.fps.toFixed(2)} -> v2=${a.decodeLabel} tailMean=${a.signals.tailMean} tailMax=${a.signals.tailMax} tail/head=${a.signals.tailHeadRatio} lý do=${JSON.stringify(a.reasons)}`);
    }
    const r1dir = path.join(os.homedir(), "workspace", "tmp-round35-r1", "runs");
    console.log("Hiệu chuẩn v2 trên 11 lượt đợt 35 R1 (forward-hold.json trong scratch):");
    for (const run of fs.readdirSync(r1dir).sort()) {
      const p = path.join(r1dir, run, "forward-hold.json");
      if (!fs.existsSync(p)) continue;
      const n2 = JSON.parse(fs.readFileSync(p, "utf8"));
      const a = analyzeDecodeSideV2(n2);
      console.log(`  ${run} fps=${n2.reverse.fps.toFixed(2)} -> v2=${a.decodeLabel} tailMean=${a.signals.tailMean} tailMax=${a.signals.tailMax} tail/head=${a.signals.tailHeadRatio} lý do=${JSON.stringify(a.reasons)}`);
    }
    return;
  }
  if (!fs.existsSync(arg)) { console.error(`Không tìm thấy: ${arg}`); process.exit(2); }
  const n2 = JSON.parse(fs.readFileSync(arg, "utf8"));
  const a = analyzeDecodeSideV2(n2);
  console.log(JSON.stringify(a, null, 2));
}

main();
