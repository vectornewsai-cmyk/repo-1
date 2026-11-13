// analyze-70x2-gate-window.mjs — Phase 9 đợt 70, luồng X2.
// Phân tích kết quả thử nghiệm gate mở rộng: đối chiếu verdict gate 1 (6 s) và
// gate mở rộng (cửa sổ 2, giây 6–16) với slot draw thật (ground truth) trên
// các phiên V4 đợt 68 (P1 lạnh, P2 ấm — chỉ có gate 1) và các phiên X2 đợt 70
// (gate 1 + gate 2 + time-course).
// Chạy: node apps/web/scripts/analyze-70x2-gate-window.mjs
//   [đường dẫn presented-fps.json của phiên X2 ...]  (mặc định glob session*/presented-fps.json)
// Không cần Chrome. Không sửa dữ liệu nguồn.
import fs from "node:fs";
import path from "node:path";

const HIDDEN = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files";
const V4 = [
  { name: "V4-P1-lanh", file: `${HIDDEN}/round68-v4/presented-1080p-idle/presented-fps.json`, gate1Delta: 45 },
  { name: "V4-P2-am", file: `${HIDDEN}/round68-v4/presented-1080p-idle-run2/presented-fps.json`, gate1Delta: 35 },
];

// Wilson 95% CI cho tỉ lệ k/n (z = 1.96).
export function wilson(k, n) {
  if (n === 0) return { p: null, lo: null, hi: null };
  const z = 1.96, p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { p: +p.toFixed(3), lo: +Math.max(0, (c - m) / d).toFixed(3), hi: +Math.min(1, (c + m) / d).toFixed(3) };
}

export function analyzeSession(name, report, gate1Delta) {
  const slots = (report.slots || []).filter((s) => s.valid);
  const draws = slots.map((s) => s.drawFps);
  const presented = slots.map((s) => s.presentedFps);
  const mean = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null);
  const g = report.gateExtended || null;
  const tc = report.timeCourse || null;
  const slotDrawMean = mean(draws);
  // FN định nghĩa W8 (theo slot): gate PASS nhưng slot draw < 2 fps.
  const fnOld = slots.filter((s) => s.drawFps < 2).length; // gate1 luôn PASS ở các phiên này
  const fnNew = g && g.verdict === "PASS" ? slots.filter((s) => s.drawFps < 2).length : 0;
  const fpNew = g && g.verdict === "FAIL" ? slots.filter((s) => s.drawFps >= 2).length : 0;
  const gate1Pass = gate1Delta != null ? gate1Delta >= 20 : g ? g.delta1 >= 20 : null;
  return {
    name, nSlots: slots.length, draws, presented,
    slotDrawMean, slotPresentedMean: mean(presented),
    gate1Delta: gate1Delta ?? g?.delta1 ?? null, gate1Pass,
    gate2: g ? { delta2: g.delta2, rate2Fps: g.rate2Fps, rate1Fps: g.rate1Fps, verdict: g.verdict, collapseRatio: g.collapseRatio, ctAt6: g.ctAt6, ctAt16: g.ctAt16, presentedRate2Fps: g.presentedRate2Fps ?? null, qAt6: g.qAt6 ?? null, qAt16: g.qAt16 ?? null } : null,
    timeCourse: tc ? { rateFirst6Fps: tc.rateFirst6Fps, rateAfter6Fps: tc.rateAfter6Fps, afterOverBefore: tc.afterOverBefore, buckets: tc.buckets } : null,
    fnOld, fnNew, fpNew,
    // A1 ở cấp phiên: gate2 FAIL ⟺ slot draw mean < 2 (ngưỡng FN của W8).
    a1SessionMatch: g && g.verdict !== "INCONCLUSIVE"
      ? (g.verdict === "FAIL") === (slotDrawMean != null && slotDrawMean < 2)
      : null,
  };
}

function main() {
  const x2Files = process.argv.slice(2);
  const globbed = x2Files.length ? x2Files : fs.readdirSync(`${HIDDEN}/round70-x2`)
    .filter((d) => d.startsWith("session"))
    .map((d) => `${HIDDEN}/round70-x2/${d}/presented-fps.json`)
    .filter((f) => fs.existsSync(f)).sort();
  const rows = [];
  for (const v of V4) {
    if (!fs.existsSync(v.file)) { console.log(`  (bỏ qua ${v.name}: không thấy ${v.file})`); continue; }
    rows.push(analyzeSession(v.name, JSON.parse(fs.readFileSync(v.file, "utf8")), v.gate1Delta));
  }
  for (const f of globbed) {
    const name = `X2-${path.basename(path.dirname(f))}`;
    rows.push(analyzeSession(name, JSON.parse(fs.readFileSync(f, "utf8")), null));
  }
  console.log("GATE MỞ RỘNG (X2) — gate 1 vs gate 2 vs slot draw thật (ngưỡng FN: slot draw < 2 fps)");
  console.log("=".repeat(100));
  for (const r of rows) {
    console.log(`\n${r.name}: ${r.nSlots} slot, slot draw ${r.draws.join(" / ")} (mean ${r.slotDrawMean}), presented mean ${r.slotPresentedMean}`);
    console.log(`  gate1: delta ${r.gate1Delta} → ${r.gate1Pass ? "PASS" : "FAIL"}; FN cũ (gate1 PASS + slot<2): ${r.fnOld}/${r.nSlots}`);
    if (r.gate2) {
      console.log(`  gate2: delta2 ${r.gate2.delta2} (rate2 ${r.gate2.rate2Fps} fps vs rate1 ${r.gate2.rate1Fps} fps, collapse ${r.gate2.collapseRatio}x), presented2 ${r.gate2.presentedRate2Fps ?? "n/a"} fps (q ${r.gate2.qAt6 ?? "?"}→${r.gate2.qAt16 ?? "?"}), ct ${r.gate2.ctAt6} → ${r.gate2.ctAt16} → ${r.gate2.verdict}; FN mới: ${r.fnNew}/${r.nSlots}, FP mới: ${r.fpNew}/${r.nSlots}; A1 khớp ở cấp phiên: ${r.a1SessionMatch === null ? "n/a" : r.a1SessionMatch ? "CÓ" : "KHÔNG"}`);
    } else {
      console.log("  gate2: n/a (phiên V4, chưa có cửa sổ 2)");
    }
    if (r.timeCourse) {
      console.log(`  time-course: 0–6s ${r.timeCourse.rateFirst6Fps} fps, 6–16s ${r.timeCourse.rateAfter6Fps} fps, sau/trước ${r.timeCourse.afterOverBefore}x; buckets: ${r.timeCourse.buckets.map((b) => `${b.from}-${b.to}s:${b.rate}`).join(" ")}`);
    }
  }
  const totSlots = rows.reduce((a, r) => a + r.nSlots, 0);
  const fnOld = rows.reduce((a, r) => a + r.fnOld, 0);
  const fnNew = rows.reduce((a, r) => a + r.fnNew, 0);
  const fpNew = rows.reduce((a, r) => a + r.fpNew, 0);
  const x2Rows = rows.filter((r) => r.gate2);
  const a1Match = x2Rows.filter((r) => r.a1SessionMatch === true).length;
  console.log("\n" + "=".repeat(100));
  console.log(`GỘP: ${totSlots} slot (${rows.length} phiên). FN gate 6 s cũ: ${fnOld}/${totSlots} (${(100 * fnOld / Math.max(1, totSlots)).toFixed(0)}%, Wilson 95%: ${JSON.stringify(wilson(fnOld, totSlots))}).`);
  console.log(`FN gate mở rộng: ${fnNew}/${totSlots} (Wilson 95%: ${JSON.stringify(wilson(fnNew, totSlots))}); FP mới: ${fpNew}/${totSlots}.`);
  console.log(`A1 khớp ở cấp phiên (X2): ${a1Match}/${x2Rows.length} phiên.`);
  if (x2Rows.length >= 1 && a1Match === 0 && fpNew > 0) {
    console.log("VERDICT A1: KHÔNG XÁC NHẬN — gate 2 FAIL nhưng slot vẽ khỏe (false-positive, xem chi tiết từng phiên). GIỮ gate 6 s cũ; prototype ở lại dạng harness/script. Lưu ý: phiên X2-session1 (partial, chỉ có console log — harness chết ở rep 3, không có JSON) cũng cho gate2 FAIL (delta2 2) với slot rep1 khỏe 5,06 fps — cùng hướng false-positive, xem LIMITS X2 §2/§5. Thêm phiên hoàn chỉnh sẽ chỉ thu hẹp khoảng tin cậy của tỉ lệ FP, không đổi được verdict này.");
  } else if (x2Rows.length >= 2 && a1Match === x2Rows.length && fnNew === 0 && fnOld > 0) {
    console.log("VERDICT A1: XÁC NHẬN — gate 2 FAIL đúng phiên slot xấu, PASS phiên khỏe, FN về 0. Đủ điều kiện cân nhắc nối production (thay gate 6 s bằng gate mở rộng).");
  } else if (x2Rows.length >= 2 && a1Match < x2Rows.length) {
    console.log("VERDICT A1: KHÔNG XÁC NHẬN — có phiên gate 2 không khớp slot thật (xem chi tiết từng phiên). GIỮ gate 6 s cũ; prototype ở lại dạng harness/script.");
  } else {
    console.log("VERDICT A1: CHƯA ĐỦ MẪU — cần ít nhất 2 phiên X2 (1 lạnh + 1 ấm) mới kết luận.");
  }
  return { rows, totSlots, fnOld, fnNew, fpNew, a1Match, x2Sessions: x2Rows.length };
}

main();
