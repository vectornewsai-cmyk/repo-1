#!/usr/bin/env node
/**
 * Phase 9 đợt 35, luồng R1 — probe decode-side cho A/B seekElement.
 *
 * Vấn đề (đợt 34 Q1 §5.3): lượt single-3 có proxy xuôi/rAF "khỏe" theo
 * cảm nhận ban đầu nhưng chỉ vẽ 26 frame/14,48 s, trong khi retry-3
 * liền trước vẽ 80 frame với proxy tương đương. Giải thích phù hợp
 * nhất: decode/seek chạy trên thread/process khác của Chrome nên rAF
 * khỏe KHÔNG chứng minh decode ngược không bị đói. Vì vậy nhãn quiet
 * theo chuẩn probe v2 (load + xuôi + rAF xuôi + 0 Chrome khác) CHƯA
 * ĐỦ để chứng nhận "quiet cho decode ngược": cần thêm một tín hiệu
 * phía đầu ra của decode, đo TRONG CÙNG lượt, độc lập với proxy xuôi.
 *
 * Phương pháp (không sửa code sản phẩm, không sửa harness N2, chỉ
 * phân tích forward-hold.json mà harness đã ghi):
 *  - Từ reverse.samplesDetail (mỗi mẫu 0,5 s): chuỗi drawDelta theo
 *    khoảng = số frame MỚI vẽ được trong mỗi khoảng. Decode khỏe thì
 *    draw chảy đều (~2-10/khoảng ở 6 fps); decode đói thì xuất hiện
 *    khoảng drawDelta = 0 (stall) dù rAF vẫn tick và hold vẫn tăng.
 *  - Khoảng đầu tiên được LOẠI (warmup/chuyển tiếp xuôi→ngược: ngay
 *    cả lượt khỏe retry-3 cũng có drawDelta = 0 ở khoảng đầu).
 *  - Từ raf.reverse: tickRate = n / wallSec (số tick rAF phase ngược
 *    trên giây). Decode đói làm tickRate tụt (single-3: ~49/s so với
 *    ~95-100/s ở lượt khỏe) vì vòng lặp preview bị chặn chờ seek.
 *  - holdDelta theo khoảng chỉ dùng làm đối chứng (hold tăng đều =
 *    vòng lặp vẫn chạy, chỉ thiếu frame mới) — không dùng để phân loại.
 *
 * Ngưỡng HEALTHY (đặt TRƯỚC khi đo đợt 35, hiệu chuẩn trên 8 lượt
 * đợt 34 Q1 — xem LIMITS R1 §2; script này in cả bảng hiệu chuẩn
 * khi chạy với đối số "calibrate"):
 *   stallIntervals (sau khoảng đầu) <= 1, maxStallRun <= 1,
 *   reverseTickRate >= 80/s.
 * Vi phạm bất kỳ điều nào -> STARVED + đủ lý do. Nhãn này là CỔNG
 * PHỤ, cộng thêm vào nhãn quiet v2 của probe Q6: một lượt chỉ được
 * nhận vào thống kê quiet 3+3 khi CẢ HAI đều đạt (v2 quiet VÀ
 * decode HEALTHY). Đây là phân tích phía đầu ra decode (draw
 * delivery), không phải đo trực tiếp bên trong decoder của Chrome
 * (Chrome không expose tín hiệu đó qua CDP pipe của harness) — giới
 * hạn này được ghi rõ trong LIMITS, không claim hơn.
 *
 * Cách dùng:
 *   node apps/web/scripts/seek-ab-decode-side-analyze.mjs <forward-hold.json>
 *   node apps/web/scripts/seek-ab-decode-side-analyze.mjs calibrate
 * Thoát: 0 = phân tích xong (kể cả STARVED — STARVED là kết quả,
 * không phải lỗi); 2 = thiếu file/dữ liệu.
 */
import fs from "node:fs";
import path from "node:path";

const STALL_MAX = 1;
const STALL_RUN_MAX = 1;
const TICK_RATE_MIN = 80;

export function analyzeDecodeSide(n2) {
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
  // Khoảng đầu = chuyển tiếp: loại khỏi đếm stall.
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
  return {
    decodeLabel: reasons.length === 0 ? "HEALTHY" : "STARVED",
    reasons,
    thresholds: { stallMax: STALL_MAX, stallRunMax: STALL_RUN_MAX, tickRateMin: TICK_RATE_MIN },
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
    },
  };
}

function main() {
  const arg = process.argv[2];
  if (!arg) { console.error("Cần đối số: <forward-hold.json> hoặc calibrate"); process.exit(2); }
  if (arg === "calibrate") {
    const dir = path.resolve("benchmarks/results");
    const files = fs.readdirSync(dir).filter((f) => /^v34-q1-seek-ab-(retry|single)-[1-4]\.json$/.test(f)).sort();
    console.log("Hiệu chuẩn trên 8 lượt đợt 34 Q1 (ngưỡng đặt trước, không chỉnh sau khi thấy số đợt 35):");
    for (const f of files) {
      const n2 = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      const a = analyzeDecodeSide(n2);
      console.log(`  ${f} fps=${n2.reverse.fps.toFixed(2)} fwd=${n2.forward.interpRate.toFixed(3)} ` +
        `rafFwdPredExcl=${n2.raf.forward.exclFirst.predictedRate.toFixed(3)} -> decode=${a.decodeLabel} ` +
        `stalls=${a.signals.stallIntervalsAfterWarmup} maxRun=${a.signals.maxStallRun} tickRate=${a.signals.reverseTickRate} lý do=${JSON.stringify(a.reasons)}`);
    }
    return;
  }
  if (!fs.existsSync(arg)) { console.error(`Không tìm thấy: ${arg}`); process.exit(2); }
  const n2 = JSON.parse(fs.readFileSync(arg, "utf8"));
  const a = analyzeDecodeSide(n2);
  console.log(JSON.stringify(a, null, 2));
}

main();
