// analyze-69w8-gate-window.mjs — Phase 9 đợt 69, luồng W8.
// Phân tích OFFLINE dữ liệu đo thật của V4 đợt 68 (không đo mới, không Chrome):
//   - gate drawDelta (6 s đầu) có dự báo được draw của slot 10 s sau không?
//   - tỉ lệ false-negative (gate qua nhưng slot vẽ < 2 fps) trong 6 slot?
//   - time-course draw theo từng khoảng 2 s trong probe A/B (gate-ab.json).
//   - replay mô hình gate mở rộng (cửa sổ 2: giây 6–16) trên dữ liệu V4.
// Chạy: node apps/web/scripts/analyze-69w8-gate-window.mjs
// Nguồn dữ liệu (JSON đo thật, không sửa):
//   hidden_files/round68-v4/presented-1080p-idle/presented-fps.json       (phiên 1, lạnh)
//   hidden_files/round68-v4/presented-1080p-idle-run2/presented-fps.json  (phiên 2, ấm)
//   hidden_files/round68-v4/gate-ab/gate-ab.json                          (probe A/B, 3 lần)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v4");
const P1 = JSON.parse(fs.readFileSync(path.join(GOAL, "presented-1080p-idle", "presented-fps.json"), "utf8"));
const P2 = JSON.parse(fs.readFileSync(path.join(GOAL, "presented-1080p-idle-run2", "presented-fps.json"), "utf8"));
const AB = JSON.parse(fs.readFileSync(path.join(GOAL, "gate-ab", "gate-ab.json"), "utf8"));

// Gate drawDelta từng phiên — ghi trong docs/PHASE9_ROUND68_V4_PRESENTED_FPS_LIMITS.md §3
// (log launcher; JSON presented-fps.json không lưu số gate, chỉ lưu slot).
// Phiên 1: draw 2 → 47 (delta 45), ct 6,871. Phiên 2: draw 2 → 37 (delta 35), ct 6,7.
// Cửa sổ gate = sleep(6000) + sleep(400) sau togglePlay → ~6,0–6,4 s.
const GATE = [
  { session: "P1-lanh", drawDelta: 45, gateSecs: 6.0, ct: 6.871 },
  { session: "P2-am", drawDelta: 35, gateSecs: 6.0, ct: 6.7 },
];

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const pearson = (xs, ys) => {
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return num / den;
};
// Khoảng tin cậy Wilson 95% cho tỉ lệ (n nhỏ).
const wilson95 = (k, n, z = 1.96) => {
  const p = k / n, z2 = z * z;
  const den = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / den;
  const h = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, c - h), Math.min(1, c + h)];
};

const out = [];
const L = (...a) => out.push(a.join(" "));

// ---- 1. Gate vs slot (6 slot) ----
L("=== 1. GATE (6 s đầu) vs SLOT (10 s sau) — 6 slot, 2 phiên ===");
L("Phiên | gateDelta | gateFps(6s) | slot draw fps (rep1/rep2/rep3) | slot mean | presented mean");
const rows = [];
for (const [gi, sess] of [P1, P2].entries()) {
  const g = GATE[gi];
  const draws = sess.slots.map((s) => s.drawFps);
  const pres = sess.slots.map((s) => s.presentedFps);
  L(`${g.session} | ${g.drawDelta} | ${(g.drawDelta / g.gateSecs).toFixed(2)} | ${draws.join(" / ")} | ${mean(draws).toFixed(2)} | ${mean(pres).toFixed(2)}`);
  sess.slots.forEach((s, i) => rows.push({ session: g.session, rep: i + 1, gateDelta: g.drawDelta, gateFps: g.drawDelta / g.gateSecs, draw: s.drawFps, presented: s.presentedFps, mediaRate: s.mediaRate, ticks: s.rafStats.n }));
}
L("");
L("Từng slot (gate là giá trị chung của phiên — gate chỉ đo 1 lần/phiên, trước 3 rep):");
for (const r of rows) L(`  ${r.session} rep${r.rep}: gate=${r.gateDelta} (${r.gateFps.toFixed(2)} fps) -> slot draw=${r.draw} fps, presented=${r.presented} fps, mediaRate=${r.mediaRate}x, ticks=${r.ticks}`);

// ---- 2. False-negative: gate qua nhưng slot draw < 2 fps ----
const FN_CUT = 2.0; // fps — ngưỡng "preview gần như đứng hình" (V4: slot P1 0,49–0,98 fps)
const fn = rows.filter((r) => r.draw < FN_CUT);
L("");
L(`=== 2. FALSE-NEGATIVE (định nghĩa: gate PASS nhưng slot draw < ${FN_CUT} fps) ===`);
L(`Gate PASS cả 2 phiên (45 và 35, đều ≥ 20). Slot draw < ${FN_CUT} fps: ${fn.length}/6 slot.`);
L(`  Phiên 1 (lạnh): ${rows.filter((r) => r.session === "P1-lanh" && r.draw < FN_CUT).length}/3 slot FN (draw 0,49 / 0,98 / 0,60).`);
L(`  Phiên 2 (ấm):  ${rows.filter((r) => r.session === "P2-am" && r.draw < FN_CUT).length}/3 slot FN (draw 8,31 / 5,12 / 4,90).`);
const [lo, hi] = wilson95(fn.length, 6);
L(`Tỉ lệ FN gộp: ${(fn.length / 6 * 100).toFixed(0)}% (3/6), khoảng tin cậy Wilson 95%: [${(lo * 100).toFixed(0)}%, ${(hi * 100).toFixed(0)}%].`);
L("Đọc đúng: n = 6 slot, 2 phiên — khoảng tin cậy rất rộng (19–81%). Con số 50% là điểm ước lượng,");
L("KHÔNG đủ mẫu để kết luận thống kê mạnh. Điều chắc chắn duy nhất: FN > 0 đã được quan sát thật");
L("(3 slot phiên lạnh), và FN tập trung toàn bộ ở 1 phiên (lạnh), không rải đều.");

// ---- 3. Tương quan gate vs slot ----
L("");
L("=== 3. TƯƠNG QUAN gate drawDelta vs slot draw (6 slot) ===");
const rDraw = pearson(rows.map((r) => r.gateDelta), rows.map((r) => r.draw));
const rPres = pearson(rows.map((r) => r.gateDelta), rows.map((r) => r.presented));
L(`Pearson r (gateDelta, slot drawFps) = ${rDraw.toFixed(3)}  — ÂM MẠNH, NGƯỢC với kỳ vọng.`);
L(`Pearson r (gateDelta, slot presentedFps) = ${rPres.toFixed(3)}  — cũng âm.`);
L("Nhóm theo phiên: gate 45 → slot draw mean 0,69 fps; gate 35 → slot draw mean 6,11 fps (gấp 8,9×).");
L("Gate CAO HƠN lại đi kèm slot TỆ HƠN. Lưu ý phương pháp: chỉ 2 giá trị gate khác nhau (45 vs 35)");
L("nên r này thực chất là so sánh 2 nhóm (point-biserial), không phải tương quan liên tục —");
L("không được diễn giải là 'gate càng cao slot càng tệ' một cách tổng quát. Kết luận đúng:");
L("gate 6 s KHÔNG phân biệt được 2 phiên có slot chênh nhau 9× (cả 2 đều PASS với delta tương đương).");

// ---- 4. Time-course A/B: draw theo từng khoảng 2 s ----
L("");
L("=== 4. TIME-COURSE DRAW TRONG CỬA SỔ GATE — probe A/B (3 lần, mẫu ~0,5–1 s) ===");
L("Probe A/B đo draw (bộ đếm tích lũy hold.draw) trong ~10–12 s phát liên tục, cùng clip long1080.");
for (const row of AB.rows) {
  const samples = row.samples; // {t, draw, ...}, t = giây tường từ lúc phát
  const buckets = [];
  for (let b = 0; b < 5; b++) {
    const inB = samples.filter((s) => s.t >= b * 2 && s.t < (b + 1) * 2);
    if (inB.length < 1) continue;
    // tốc độ trong bucket: (draw cuối - draw đầu bucket) / (t cuối - t đầu); bucket đầu dùng draw0.
    const d0 = b === 0 ? row.draw0 : samples.filter((s) => s.t < b * 2).at(-1)?.draw ?? row.draw0;
    const t0 = b === 0 ? 0 : samples.filter((s) => s.t < b * 2).at(-1)?.t ?? 0;
    const d1 = inB.at(-1).draw, t1 = inB.at(-1).t;
    buckets.push({ range: `${b * 2}–${b * 2 + 2}s`, fps: +((d1 - d0) / Math.max(t1 - t0, 0.01)).toFixed(2), draws: d1 - d0 });
  }
  const first6 = samples.filter((s) => s.t <= 6);
  const after6 = samples.filter((s) => s.t > 6);
  const dAt6 = first6.at(-1)?.draw ?? row.draw0, tAt6 = first6.at(-1)?.t ?? 0;
  const rate06 = (dAt6 - row.draw0) / Math.max(tAt6, 0.01);
  const rate6p = after6.length ? (row.draw1 - dAt6) / Math.max(after6.at(-1).t - tAt6, 0.01) : null;
  L(`  ${row.label} (${row.variant}, wall ${row.wallSecs}s, drawDelta ${row.drawDelta}):`);
  L(`    bucket 2 s: ${buckets.map((b) => `${b.range}=${b.fps}fps(+${b.draws})`).join("  ")}`);
  L(`    tốc độ 0–6 s: ${rate06.toFixed(2)} fps; tốc độ sau 6 s: ${rate6p === null ? "n/a" : rate6p.toFixed(2) + " fps"}; tỉ lệ sau/trước = ${rate6p === null ? "n/a" : (rate6p / rate06).toFixed(2)}×`);
}
L("Nhận xét: trong phiên A/B (máy khỏe, load ~1, RAM 2,6 GB), tốc độ vẽ KHÔNG sụp sau 6 s —");
L("dao động 1,7–5,0 fps theo bucket, tỉ lệ sau/trước 1,29–1,64× (vẽ nhanh dần khi phát tiếp). Suy giảm của phiên 1 (gate 7,5 fps →");
L("slot 0,69 fps) KHÔNG xuất hiện trong phiên A/B: sụp đổ là đặc thù phiên lạnh, không phải quy luật");
L("theo thời gian chung. Vì vậy cửa sổ 6–16 s KHÔNG có dữ liệu trực tiếp nào từ phiên lạnh để kiểm chứng —");
L("đây là điểm mù của dữ liệu hiện có (xem §6, giả thiết A1).");

// ---- 5. Replay mô hình gate mở rộng ----
L("");
L("=== 5. REPLAY MÔ HÌNH GATE MỞ RỘNG (chỉ mô hình — chưa đo thật) ===");
L("Thiết kế đề xuất: giữ gate 1 (6 s, delta ≥ 20) + thêm cửa sổ 2 RIÊNG BIỆT: phát tiếp từ ct≈7");
L("đến ct≈17 (10 s, không seek lại), đo drawDelta2; PASS khi drawDelta2 ≥ 20 (tức ≥ 2,0 fps).");
L("GIẢ THIẾT A1 (chưa kiểm chứng): tốc độ vẽ ở cửa sổ 2 ≈ tốc độ vẽ trung bình của slot 10 s");
L("cùng phiên (cùng clip, cùng chế độ phát từ seek-0). A1 có thể SAI nếu sụp đổ do seek gây ra");
L("(mỗi rep seek lại) chứ không phải do phát liên tục quá 6 s — xem LIMITS §5.");
for (const [gi, sess] of [P1, P2].entries()) {
  const g = GATE[gi];
  const slotMean = mean(sess.slots.map((s) => s.drawFps));
  const delta2est = slotMean * 10;
  L(`  ${g.session}: gate1 ${g.drawDelta} PASS; cửa sổ 2 ước lượng delta2 ≈ ${slotMean.toFixed(2)} fps × 10 s = ${delta2est.toFixed(1)} → ${delta2est >= 20 ? "PASS" : "FAIL"} (ngưỡng 20).`);
}
L("  Phiên A/B (kiểm tra chiều ngược — phiên khỏe có bị gate mới giết oan không?):");
for (const row of AB.rows) {
  const samples = row.samples;
  const dAt6 = samples.filter((s) => s.t <= 6).at(-1)?.draw ?? row.draw0;
  const tAt6 = samples.filter((s) => s.t <= 6).at(-1)?.t ?? 0;
  const rate6p = (row.draw1 - dAt6) / Math.max(samples.at(-1).t - tAt6, 0.01);
  const delta2est = rate6p * 10;
  L(`    ${row.label}: tốc độ sau 6 s ≈ ${rate6p.toFixed(2)} fps → delta2 ước lượng ≈ ${delta2est.toFixed(1)} → ${delta2est >= 20 ? "PASS" : "FAIL"}.`);
}
L("Kết quả replay (dưới A1): FN 3/6 → 0/6 (phiên lạnh bị chặn ở cửa sổ 2, phiên ấm + phiên A/B qua).");
L("Đây là ƯỚC LƯỢNG MÔ HÌNH trên n = 6 slot + 3 lần A/B, không phải kết quả đo gate mở rộng thật.");

// ---- 6. Độ nhạy ngưỡng cửa sổ 2 ----
L("");
L("=== 6. ĐỘ NHẠY NGƯỠNG CỬA SỔ 2 (delta2 trên 10 s) ===");
L("Ngưỡng (fps) | P1-lạnh (0,69) | P2-ấm (6,11) | A1 sau-6s (3,12) | B2/A3 sau-6s (4,8–5,0) | FN còn lại (dưới A1)");
for (const th of [1.5, 2.0, 2.5, 3.0]) {
  const v = (rate) => (rate >= th ? "PASS " : "FAIL ");
  const fnLeft = [0.69, 0.69, 0.69].filter((r) => r >= th).length; // slot P1 nào vẫn lọt (ước lượng)
  L(`  ≥ ${th.toFixed(1)} fps (delta ≥ ${(th * 10).toFixed(0)}) | ${v(0.69)} | ${v(6.11)} | ${v(3.12)} | ${v(4.8)} | ${fnLeft}/3 slot P1 lọt`);
}
L("Ngưỡng 2,0 fps tách được cả 3 nhóm dữ liệu hiện có (P1 FAIL, P2 PASS, A/B PASS với biên nhỏ nhất 56% — A1: 31,2 vs 20).");
L("Ngưỡng 3,0 fps: A1 sau-6s 3,12 fps chỉ qua với biên 4% (delta2 31,2 vs ngưỡng 30) — thực tế là");
L("ngưỡng biên: một lần chạy A1 kém may mắn là bị giết oan. Ngưỡng không nên đặt ≥ 3 fps.");
L("Ngưỡng 1,5 fps vẫn tách được P1 (0,69) nhưng biên an toàn với phiên khỏe thấp hơn không rõ —");
L("không có dữ liệu phiên nào ở 1,5–2,0 fps để phân biệt 1,5 vs 2,0. Cần đo thêm mới chọn được ngưỡng chắc.");

console.log(out.join("\n"));
