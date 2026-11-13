#!/usr/bin/env node
/**
 * r80h4-threshold.mjs — Phase 9 đợt 80, luồng H4: ĐO ĐỘ NHẠY NGƯỠNG
 * Δkurt 0,35 (nợ G6 §6.2, F7 §5.1): ±0,01 lật verdict ở case nào?
 *
 * PHƯƠNG PHÁP (bước 1 — phân tích từ JSON recheck G6 đã tính bằng
 * harness hiện tại, KHÔNG re-eval):
 * verdict(mode) = okStd && okCorr && (max|Δkurt| ≤ t). okStd/okCorr
 * không phụ thuộc t. Với mode đang KHỚP ở t=0,35 thì okStd && okCorr
 * đều đúng → lật ở t'<0,35 khi và chỉ khi max|Δkurt| ∈ (t', 0,35]
 * (CHẮC CHẮN, suy ra trực tiếp từ kurtDiff đã lưu). Với mode đang LỆCH
 * ở t=0,35 và max|Δkurt| ∈ (0,35, t'] + okCorr thì là ỨNG VIÊN lật
 * (cần xác minh okStd bằng re-eval — xem JSON candidates, bước 2 chỉ
 * chạy khi có ứng viên).
 * Lưu ý: kurtDiff trong JSON làm tròn 0,001 — mọi biên ±0,001 quanh
 * ngưỡng đều ghi rõ là "sát nút làm tròn", không kết luận tuyệt đối.
 *
 * JSON: hidden_files/round80-h4/r80h4-threshold.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G6 = path.join(GOAL, "round79-g6");
const H4 = path.join(GOAL, "round80-h4");
fs.mkdirSync(H4, { recursive: true });
const OUT = path.join(H4, "r80h4-threshold.json");
const T0 = 0.35;

function maxKurt(arr) { return Math.max(...arr); }
function okCorrArr(arr) { return arr.every((x) => x <= 0.12); }

async function main() {
  const cases = [];
  const seen = new Set();
  for (const f of ["r79g6-e6-recheck.json", "r79g6-e6-newcases-recheck.json", "r79g6-f7-recheck.json", "r79g6-sweep.json"]) {
    const j = JSON.parse(fs.readFileSync(path.join(G6, f), "utf8"));
    for (const c of j.cases || []) {
      if (seen.has(c.name)) { console.log(`  trùng tên, bỏ qua lần 2: ${c.name} (từ ${f})`); continue; }
      seen.add(c.name);
      cases.push(c);
    }
  }
  console.log(`nạp ${cases.length} case duy nhất (harness hiện tại, resample BC)`);
  const rows = [];
  for (const c of cases) {
    const mkNo = maxKurt(c.kurtDiffNoD0), mkFull = maxKurt(c.kurtDiffFullD0);
    const ocNo = okCorrArr(c.corrDiffNoD0), ocFull = okCorrArr(c.corrDiffFullD0);
    rows.push({
      name: c.name, source: c.source || "?", rect: c.rect, correct: c.correct,
      noD0: { verdict: c.verdictNoD0, maxKurt: mkNo, okCorr: ocNo, kurtDiff: c.kurtDiffNoD0 },
      fullD0: { verdict: c.verdictFullD0, maxKurt: mkFull, okCorr: ocFull, kurtDiff: c.kurtDiffFullD0 },
      gates: c.gates,
    });
  }
  // 1) Mode KHỚP ở 0,35, maxKurt sát nút trên (0,34; 0,35] → lật ở 0,34 (CHẮC CHẮN).
  const flipDown = rows.flatMap((r) => ["noD0", "fullD0"]
    .filter((m) => r[m].verdict.startsWith("KHỚP") && r[m].maxKurt > 0.34 && r[m].maxKurt <= T0)
    .map((m) => ({ name: r.name, mode: m, maxKurt: r[m].maxKurt, correct: r.correct, gates: r.gates })));
  console.log(`\n[CHẮC CHẮN] mode KHỚP ở 0,35 lật thành LỆCH ở ngưỡng 0,34 (maxKurt ∈ (0,34; 0,35]): ${flipDown.length}`);
  for (const f of flipDown) console.log(`  ${f.name} [${f.mode}] maxKurt=${f.maxKurt} đúng=${f.correct}`);
  // 2) Mode LỆCH ở 0,35, maxKurt sát nút dưới (0,35; 0,36] + okCorr → ỨNG VIÊN lật ở 0,36 (cần okStd).
  const candUp = rows.flatMap((r) => ["noD0", "fullD0"]
    .filter((m) => r[m].verdict.startsWith("LỆCH") && r[m].maxKurt > T0 && r[m].maxKurt <= 0.36 && r[m].okCorr)
    .map((m) => ({ name: r.name, mode: m, maxKurt: r[m].maxKurt, okCorr: r[m].okCorr, correct: r.correct, gates: r.gates })));
  console.log(`\n[ỨNG VIÊN] mode LỆCH ở 0,35 có thể lật thành KHỚP ở ngưỡng 0,36 (maxKurt ∈ (0,35; 0,36] + okCorr; CẦN xác minh okStd): ${candUp.length}`);
  for (const f of candUp) console.log(`  ${f.name} [${f.mode}] maxKurt=${f.maxKurt} đúng=${f.correct}`);
  // 3) Quét t ∈ [0,30; 0,40]: đếm mode KHỚP lật (chắc chắn) + ứng viên LỆCH lật (cận trên).
  console.log("\nquét ngưỡng t (mode KHỚP→LỆCH chắc chắn / mode LỆCH→KHỚP ứng viên):");
  const sweep = [];
  for (let t = 0.30; t <= 0.401; t += 0.01) {
    const tt = +t.toFixed(2);
    const down = rows.filter((r) => ["noD0", "fullD0"].some((m) => r[m].verdict.startsWith("KHỚP") && r[m].maxKurt > tt && r[m].maxKurt <= T0)).length;
    const up = rows.filter((r) => ["noD0", "fullD0"].some((m) => r[m].verdict.startsWith("LỆCH") && r[m].maxKurt > T0 && r[m].maxKurt <= tt && r[m].okCorr)).length;
    sweep.push({ t: tt, khopToLechCertain: down, lechToKhopCandidates: up });
    console.log(`  t=${tt.toFixed(2)}: KHỚP→LỆCH chắc chắn ${down} mode, LỆCH→KHỚP ứng viên ${up} mode`);
  }
  // 4) Phân bố maxKurt gần ngưỡng: mọi mode có maxKurt ∈ [0,30; 0,40].
  const near = rows.flatMap((r) => ["noD0", "fullD0"]
    .filter((m) => r[m].maxKurt >= 0.30 && r[m].maxKurt <= 0.40)
    .map((m) => ({ name: r.name, mode: m, verdict: r[m].verdict, maxKurt: r[m].maxKurt, okCorr: r[m].okCorr, correct: r.correct })))
    .sort((a, b) => a.maxKurt - b.maxKurt);
  console.log(`\nmọi mode có maxKurt ∈ [0,30; 0,40] (vùng nhạy): ${near.length}`);
  for (const n of near) console.log(`  ${n.name} [${n.mode}] ${n.verdict} maxKurt=${n.maxKurt} okCorr=${n.okCorr} đúng=${n.correct}`);
  const report = { generated: new Date().toISOString(), baseline: T0, totalCases: cases.length, flipDownCertainAt034: flipDown, candUpAt036: candUp, sweep, nearThreshold: near };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON độ nhạy ngưỡng: ${OUT}`);
}
main().catch((e) => { console.error(`H4-THRESHOLD LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
