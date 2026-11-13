#!/usr/bin/env node
/**
 * analyze101c3-tail-expiry.mjs — Phase 9 đợt 101, luồng C3.
 * Phân tích ca f4-like (nợ LIMITS gộp đợt 100 §4 mục 5) + đếm luật
 * burst-rate của đuôi (PLAYHEAD_TAIL_BURST_RATE_MAX) và luật drift-gate
 * (PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S) trên tick vận tốc rAF
 * (window.__w5ticks) của probe101c3:
 *  (a) tailBursts: số lần đuôi chặn burst (hook __vcutTailBurstBlocked100B3,
 *      probe101c3 ghi vào mỗi tick); in từng lần tăng kèm ct/ph/drift.
 *  (a2) tailDriftGate: số lần drift-gate chặn lần tăng đáp xa (hook
 *      __vcutTailDriftGateBlocked101C3); in từng lần tăng kèm ct/ph/drift
 *      + tailAdv — bằng chứng trực tiếp gate chặn được burst dài-gap
 *      (g2/g5) ngoài đời.
 *  (b) Đuôi đóng khi drift còn vượt (|ct−ph| > 0,35): đếm + liệt kê;
 *      trong đó ca f4-like = đuôi đóng khi drift vượt, rồi resyncsV
 *      tăng trong 2 tick sau (drift re-seek bắn ngay sau khi grace
 *      tắt — đúng chuỗi f4 đợt 99: tail đóng → resyncsV 1→2 → seek kẹt
 *      5,5 s+). Ca nào kèm ph đóng băng >= 2,5 s sau resync thì ghi rõ
 *      "kẹt seek" (đọc thêm từ mẫu 100ms nếu có).
 *  (c) Đuôi đóng do watch mới arm tiếp quản (rearms tăng cùng tick
 *      đuôi biến mất) — đường handoff thiết kế, không phải f4-like.
 * Chạy: node apps/web/scripts/analyze101c3-tail-expiry.mjs <probe-results.json> [...]
 * In tóm tắt từng lượt + bảng gộp. Không đụng code production.
 * Caveat (kế thừa W5 §6 mục 3): tick probe != tick app (±1 tick);
 * dưới tải gap rAF 300–1400 ms nên NHIỀU tick app có thể ẩn giữa 2
 * mẫu probe — chuỗi burst/advance trong 1 gap probe không phân giải
 * được tới từng tick app; verdict f4-like chỉ kết luận trên mẫu probe
 * (đuôi đóng + resync ngay sau), không khẳng định tick app nào đã đếm
 * advance #2. Số tailBursts là số đo trực tiếp từ hook nên không dính
 * caveat này.
 */
import fs from "node:fs";

const THRESHOLD = 0.35;
const files = process.argv.slice(2);
if (!files.length) {
  console.error("dùng: node analyze101c3-tail-expiry.mjs <probe-results.json> [...]");
  process.exit(2);
}

let totRuns = 0;
let totBursts = 0;
let totGate = 0;
let totTailCloseDriftOver = 0;
let totF4Like = 0;
let totF4LikeStuck = 0;
let totTakeover = 0;
let totDriftReseeks = 0;

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  const vt = d.velocityTicks || [];
  totRuns++;
  const label = `${d.engine} load${d.loadN} gop${d.gop} ${d.phase}`;
  // (a) tailBursts: lần tăng của counter qua các tick.
  let bursts = 0;
  const burstEvents = [];
  let prevBursts = null;
  // (a2) tailDriftGate: lần tăng của counter drift-gate qua các tick.
  let gate = 0;
  const gateEvents = [];
  let prevGate = null;
  // (b)+(c) đuôi đóng: so tick k có tail, tick k+1 không có tail.
  let closeDriftOver = 0;
  let f4like = 0;
  let f4likeStuck = 0;
  let takeover = 0;
  const closeEvents = [];
  let driftReseeks = 0;
  let prevResyncs = null;
  for (let i = 0; i < vt.length; i++) {
    const t = vt[i];
    if (typeof t.tailBursts === "number") {
      if (prevBursts !== null && t.tailBursts > prevBursts) {
        bursts += t.tailBursts - prevBursts;
        burstEvents.push(
          `t=${t.t} ct=${t.ct} ph=${t.ph} drift=+${(t.ct - t.ph).toFixed(2)} tailAdv=${t.tail ? t.tail.advances : "none"}`,
        );
      }
      prevBursts = t.tailBursts;
    }
    if (typeof t.tailDriftGate === "number") {
      if (prevGate !== null && t.tailDriftGate > prevGate) {
        gate += t.tailDriftGate - prevGate;
        gateEvents.push(
          `t=${t.t} ct=${t.ct} ph=${t.ph} drift=+${(t.ct - t.ph).toFixed(2)} tailAdv=${t.tail ? t.tail.advances : "none"}`,
        );
      }
      prevGate = t.tailDriftGate;
    }
    if (typeof t.resyncsV === "number") {
      if (prevResyncs !== null && t.resyncsV > prevResyncs) driftReseeks += t.resyncsV - prevResyncs;
      prevResyncs = t.resyncsV;
    }
    if (i + 1 < vt.length) {
      const n = vt[i + 1];
      if (t.tail && !n.tail) {
        const drift = Math.abs(t.ct - t.ph);
        const isTakeover = (n.rearms ?? null) !== null && (t.rearms ?? null) !== null && n.rearms > t.rearms;
        if (isTakeover) {
          takeover++;
        } else if (drift > THRESHOLD) {
          closeDriftOver++;
          // f4-like: resyncsV tăng trong 2 tick sau khi đuôi đóng.
          // Đợt 101 C3 — LOẠI restartEnded: resync do clip chạm cuối
          // (restartV tăng cùng cửa sổ) không phải drift re-seek — ca
          // h4 (đuôi đóng do trần + restart cuối clip) bị đếm oan trước
          // khi có điều kiện này (xem LIMITS C3 §4.1).
          let resyncAfter = false;
          for (let j = i + 1; j <= Math.min(i + 3, vt.length - 1); j++) {
            if (typeof vt[j].resyncsV === "number" && typeof t.resyncsV === "number" && vt[j].resyncsV > t.resyncsV) {
              const restartUp = typeof vt[j].restartV === "number" && typeof t.restartV === "number" && vt[j].restartV > t.restartV;
              if (!restartUp) {
                resyncAfter = true;
                break;
              }
            }
          }
          let stuck = false;
          if (resyncAfter) {
            f4like++;
            // Kẹt seek: ph trong velocityTicks đóng băng >= 2,5 s sau
            // tick resync (cùng tiêu chí dừng sớm của probe: "playhead
            // đóng băng >= 2,5 s trong lúc seeking"). Đo trên tick vận
            // tốc vì mẫu 100ms bị cắt khi probe dừng sớm.
            let stuckMs = 0;
            for (let j = i + 1; j < vt.length - 1; j++) {
              if (Math.abs(vt[j].ph - n.ph) >= 0.001) break;
              stuckMs += vt[j + 1].t - vt[j].t;
            }
            if (stuckMs >= 2500) {
              stuck = true;
              f4likeStuck++;
            }
          }
          closeEvents.push(
            `t=${t.t}→${n.t} ct=${t.ct} ph=${t.ph} drift=${drift.toFixed(2)} adv=${t.tail.advances} resyncSau2tick=${resyncAfter ? "CÓ-f4-like" : "không"}${stuck ? " KẸT-SEEK(≈ph đóng băng ≥2,5s)" : ""}`,
          );
        }
      }
    }
  }
  totBursts += bursts;
  totGate += gate;
  totTailCloseDriftOver += closeDriftOver;
  totF4Like += f4like;
  totF4LikeStuck += f4likeStuck;
  totTakeover += takeover;
  totDriftReseeks += driftReseeks;
  console.log(`--- ${label} (${f})`);
  console.log(`  tailBursts (luật B3 chặn burst): ${bursts}${burstEvents.length ? " @ " + burstEvents.join(" | ") : ""}`);
  console.log(`  tailDriftGate (luật C3 chặn đáp xa): ${gate}${gateEvents.length ? " @ " + gateEvents.join(" | ") : ""}`);
  console.log(`  đuôi đóng khi drift vượt (>0,35): ${closeDriftOver}${closeEvents.length ? "\n    " + closeEvents.join("\n    ") : ""}`);
  console.log(`  f4-like (đóng-drift-vượt + resync trong 2 tick sau): ${f4like} (kèm kẹt seek: ${f4likeStuck})`);
  console.log(`  đuôi đóng do watch mới arm tiếp quản: ${takeover}`);
  console.log(`  resyncsV tăng tổng (mọi đường): ${driftReseeks}`);
}

console.log(`\n=== GỘP ${totRuns} lượt ===`);
console.log(`tailBursts: ${totBursts} | tailDriftGate: ${totGate} | đuôi đóng khi drift vượt: ${totTailCloseDriftOver} | f4-like: ${totF4Like} (kẹt seek: ${totF4LikeStuck}) | tiếp quản bởi watch: ${totTakeover} | resyncsV tăng: ${totDriftReseeks}`);
console.log(`Kết luận C3: f4-like = 0 + tailDriftGate > 0 => drift-gate chặn được burst dài-gap ngoài đời và không còn ca đóng-đuôi-rồi-seek-ngay; các ca "đóng khi drift vượt" còn lại (nếu có) phải kiểm tay: chỉ đóng do TRẦN 5000 ms mới chấp nhận được (đánh đổi đã ghi rõ của gate), đóng ADV2 với drift vượt là gate thất bại.`);
