#!/usr/bin/env node
/**
 * test_round82_j4_g2g12.mjs — Phase 9 đợt 82, luồng J4: kiểm chứng các
 * khẳng định đo được của đợt 82 (săn case phân biệt G2 vs G12) từ file
 * JSON trên đĩa. Chỉ đọc, không ghi, không đổi luật gate, không sửa
 * production. Chạy (từ gốc repo):
 *   node apps/web/scripts/test_round82_j4_g2g12.mjs
 * Thoát 0 khi mọi khẳng định đúng; in FAIL + thoát 1 nếu sai.
 *
 * Khẳng định (xem docs/PHASE9_ROUND82_J4_G2G12_HUNT_LIMITS.md):
 *  A. Corr 2 case Y2: LỆCH CHỈ do corr RG vượt ngưỡng 0,12 một lượng
 *     nhỏ (0,1207/0,1208); kurt qua (< 0,35); trừ d0 xong corr về sát
 *     render (diff 0,0294/0,0058); cơ chế là d0 G-dominated kéo corr RG.
 *  B. 6 case capture mới đợt 82 (3 media × n05/n10): đều KHÔNG-d0,
 *     Q4-gate = 0, G2 và G12 đồng ý nhau; residStd_R mọi media h264
 *     tự build đều < 0,8 (trái với webm VP9 F7: 2,947).
 *  C. Bound sweep I4 (75 case): Q4-gate 0; G2 vs G12 bất đồng 0;
 *     G1 vs G2 bất đồng đúng 1 (F7-w2240-n10, biên 0,0008); near-miss
 *     gần nhất plainMad 2,5426 (B1-w1280-ocean-n05, tiền-fix) — vẫn
 *     vượt ngưỡng 2,5; điểm luật raw @0,35: 61/67/68/68 trên 69.
 *  D. Detail @1920: thành phần slov bên trong blend-1920 (x264) có
 *     detail tương đương webm gốc (frac/meanAbs trong ±20%) — giả
 *     thuyết (b) "x264 làm mượt chi tiết" YẾU.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const J4 = path.join(GOAL, "round82-j4");
const I4 = path.join(GOAL, "round81-i4");

let fails = 0;
function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) fails++;
}
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }
function load(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

// ---- A. Corr decompose (r82j4-corr-decompose.json) ----
const corr = load(path.join(J4, "r82j4-corr-decompose.json"));
const y2 = Object.fromEntries(corr.cases.map((c) => [c.name, c]));
const y2a = y2["Y2-w1440-test-pattern-noise10"];
const y2b = y2["Y2-w1920-test-pattern-noise05"];
check("A1 Y2a corr RG noD0 sát ngưỡng trên", approx(y2a.maxCorrDiffNoD0, 0.1207, 0.001), `=${y2a.maxCorrDiffNoD0}`);
check("A2 Y2b corr RG noD0 sát ngưỡng trên", approx(y2b.maxCorrDiffNoD0, 0.1208, 0.001), `=${y2b.maxCorrDiffNoD0}`);
check("A3 Y2a corr RG fullD0 về sát render", approx(y2a.corrDiffFullD0[0], 0.0294, 0.002), `=${y2a.corrDiffFullD0[0]}`);
check("A4 Y2b corr RG fullD0 về sát render", approx(y2b.corrDiffFullD0[0], 0.0058, 0.002), `=${y2b.corrDiffFullD0[0]}`);
check("A5 d0 G-dominated (d0std G ~4,4)", y2a.d0std[1] > 4 && y2b.d0std[1] > 4, `G=${y2a.d0std[1]}/${y2b.d0std[1]}`);
check("A6 d0 pull RG tp ~0,11–0,15", y2a.d0PullRG > 0.12 && y2a.d0PullRG < 0.16 && y2b.d0PullRG > 0.12 && y2b.d0PullRG < 0.16,
  `pull=${y2a.d0PullRG}/${y2b.d0PullRG}`);
const f7 = y2["F7-sweep-w2240-testpattern-n05"];
const g6 = y2["G6-sweep-w2048-testpattern-n05"];
check("A7 đối chứng tp F7/G6 pull ~0,11, diff ~0,10",
  approx(f7.d0PullRG, 0.1099, 0.002) && approx(g6.d0PullRG, 0.1095, 0.002)
  && approx(f7.corrDiffNoD0[0], 0.1025, 0.002) && approx(g6.corrDiffNoD0[0], 0.1019, 0.002));
const d2 = y2["D2-post-fix-w1920-ocean-n05"];
check("A8 đối chứng ocean D2 pull ~0 (không kéo corr)", approx(d2.d0PullRG, 0.0067, 0.002), `pull=${d2.d0PullRG}`);
const b1 = y2["B1-w1280x800-ocean-n05"];
check("A9 đối chứng B1 ocean LỆCH do mismatch tiền-fix, không phải d0",
  approx(b1.corrDiffNoD0[0], 0.2532, 0.002) && approx(b1.d0PullRG, 0.0175, 0.002));

// ---- B. 6 case capture mới đợt 82 ----
const sweeps = [
  "r82j4-sweep-blend-motion-tp-slov-a88-w1920x1080.json",
  "r82j4-sweep-slovenska-720p-w1920x1080.json",
  "r82j4-sweep-blend-1920-tp-slov-a88-w1920x1080.json",
];
let totalCases = 0, q4count = 0, g2g12disagree = 0, maxResidR = 0;
for (const f of sweeps) {
  const s = load(path.join(J4, f));
  for (const c of s.casesRaw ?? s.cases) {
    totalCases++;
    const d0 = c.d0stdR ?? c.d0std[0];
    const r = c.ratioR ?? c.ratio[0];
    const resid = c.residStd[0];
    maxResidR = Math.max(maxResidR, resid);
    if (d0 > 2 && r <= 1 && c.plainMad <= 2.5) q4count++;
    if (c.verdictUnder.G2_ratioR_le_1 !== c.verdictUnder.G12_ca_hai) g2g12disagree++;
    check(`B ${c.name} KHÔNG-d0 + D1/D3 pass`, c.correct === "KHÔNG-d0" && c.d1PlainIdentical && c.d3SameFrame,
      `d0stdR=${d0.toFixed(2)} residR=${resid.toFixed(2)} ratioR=${r.toFixed(2)} plainMad=${c.plainMad.toFixed(2)}`);
  }
}
check("B0 tổng 6 case capture mới", totalCases === 6, `=${totalCases}`);
check("B7 Q4-gate = 0 trên 6 case mới", q4count === 0, `=${q4count}`);
check("B8 G2 vs G12 bất đồng 0 trên 6 case mới", g2g12disagree === 0, `=${g2g12disagree}`);
check("B9 residStd_R mọi media h264 tự build < 0,8 (webm F7: 2,947)", maxResidR < 0.8, `max=${maxResidR.toFixed(3)}`);

// ---- C. Bound sweep I4 (75 case) ----
const i4 = load(path.join(I4, "r81i4-unrounded-sweep.json"));
check("C0 sweep I4 có 75 case", i4.totalCases === 75 && i4.cases.length === 75, `total=${i4.totalCases}`);
let q4i4 = 0, g2g12i4 = 0, g1g2i4 = [];
let nearMin = Infinity, nearName = "";
for (const c of i4.cases) {
  const d0 = c.d0stdR ?? c.d0std[0];
  const r = c.ratioR ?? c.ratio[0];
  if (d0 > 2 && r <= 1 && c.plainMad <= 2.5) q4i4++;
  if (c.verdictUnder.G2_ratioR_le_1 !== c.verdictUnder.G12_ca_hai) g2g12i4++;
  if (c.verdictUnder.G1_d0stdR_le_2 !== c.verdictUnder.G2_ratioR_le_1) g1g2i4.push(c.name);
  if (d0 > 2 && r <= 1 && c.plainMad < nearMin) { nearMin = c.plainMad; nearName = c.name; }
}
check("C1 Q4-gate = 0 trên 75 case I4", q4i4 === 0, `=${q4i4}`);
check("C2 G2 vs G12 bất đồng 0 trên 75 case I4", g2g12i4 === 0, `=${g2g12i4}`);
check("C3 G1 vs G2 bất đồng đúng 1: F7-w2240-n10", g1g2i4.length === 1 && g1g2i4[0] === "F7-sweep-w2240-testpattern-n10",
  `=${JSON.stringify(g1g2i4)}`);
check("C4 near-miss gần nhất plainMad 2,5426 (vượt 2,5)", approx(nearMin, 2.5426, 0.001) && nearName === "B1-w1280x800-ocean-n05",
  `${nearName} plainMad=${nearMin.toFixed(4)}`);
const y2ai = i4.cases.find((c) => c.name === "Y2-w1440-test-pattern-noise10");
const y2bi = i4.cases.find((c) => c.name === "Y2-w1920-test-pattern-noise05");
check("C5 Y2 kurt qua (< 0,35) ở cả 2 case", Math.max(...y2ai.kurtDiffNoD0) < 0.35 && Math.max(...y2bi.kurtDiffNoD0) < 0.35,
  `max kurt=${Math.max(...y2ai.kurtDiffNoD0).toFixed(4)}/${Math.max(...y2bi.kurtDiffNoD0).toFixed(4)}`);
check("C6 điểm luật raw @0,35: R0 61, G1 67, G2 68, G12 68 / 69",
  i4.scores.R0_cu.ok === 61 && i4.scores.G1_d0stdR_le_2.ok === 67
  && i4.scores.G2_ratioR_le_1.ok === 68 && i4.scores.G12_ca_hai.ok === 68
  && i4.scores.R0_cu.total === 69,
  `R0=${i4.scores.R0_cu.ok} G1=${i4.scores.G1_d0stdR_le_2.ok} G2=${i4.scores.G2_ratioR_le_1.ok} G12=${i4.scores.G12_ca_hai.ok}`);

// ---- D. Detail @1920 (r82j4-detail1920.json) ----
const det = load(path.join(J4, "r82j4-detail1920.json"));
for (const m of ["fracGt8H", "fracGt8V", "meanAbsH", "meanAbsV"]) {
  const ratio = det[`slovInBlend_${m}`].map((v, k) => v / det.webmF25[m][k]);
  check(`D ${m}: slov-in-blend / webm trong ±20%`, ratio.every((x) => x > 0.8 && x < 1.2),
    `ratio=[${ratio.map((x) => x.toFixed(2))}]`);
}
check("D5 MAD blend-f30 vs webm-f25 @1920 ~15 (12% tp)", approx(det.madBlendVsWebm.mad, 14.914, 0.01), `=${det.madBlendVsWebm.mad}`);

console.log(fails === 0 ? "\nALL PASS (đợt 82 J4)" : `\n${fails} FAIL`);
process.exitCode = fails === 0 ? 0 : 1;
