#!/usr/bin/env node
/**
 * r79g6-sweep.mjs — Phase 9 đợt 79, luồng G6: sweep G1/G2 qua harness
 * dùng chung (delta0-harness.mjs, luật chính G12) trên snapshot headed
 * MỚI của đợt này (r78f7-headed-capture.mjs, code đã sửa rò plain C1):
 *
 *  - test-pattern cửa sổ MỚI w2048/w2400/w2720 (n05/n07/n08/n10) + w2880
 *    (n07/n08): lấp khoảng chuyển tiếp w2240 (cả hai KHỚP) -> w2560 (cả
 *    hai LỆCH) và kiểm tra vùng phân biệt quanh w2880-n05 (nợ F7 §6.1).
 *    Render noise07/noise08 mới: ffmpeg noise=alls=37/41 (5+t*45) trên
 *    fullyuv-plain test-pattern, convert bt709 byte-identical với chuỗi
 *    noise05 gốc (xem docs LIMITS đợt này §1).
 *  - basgo cửa sổ LỚN w2240/w2560/w2880 (n05/n10): basgo đã Q3 ở
 *    w1440/w1920 (ratio 1,14-1,24) — xem d0 có bắt đầu làm hại verdict
 *    ở rect lớn không.
 *
 * Render tham chiếu: render-1k Z2 (fullrgb-{ocean,basgo,slovenska}-*.raw)
 * + R66T3/render/fullrgb-*.raw (test-pattern n05/n10, media 1280 nên số
 * Y2 vẫn đúng sau C1 — xem D2 §3) + round79-g6/render/fullrgb-noise07/
 * noise08.raw (test-pattern, build mới đợt này, cùng chuỗi method F).
 * Chấm "đúng" theo quy ước D2; chấm 4 luật R0/G1/G2/G12 trên case mới +
 * gộp với 53 case cũ (27 D2/E6 + 26 F7) để đếm G1/G2 phân biệt.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r79g6-sweep.mjs
 * JSON: hidden_files/round79-g6/r79g6-sweep.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs"; // M5 (đợt 85): ghi JSON qua helper retry EPERM + verify đủ byte (nối nốt nợ L6 §5).
import os from "node:os";
import path from "node:path";
import { evalDelta0Case, scoreRule, b64ToRgb } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const E6 = path.join(GOAL, "round77-e6");
const G6 = path.join(GOAL, "round79-g6");
const F7 = path.join(GOAL, "round78-f7");
const OUT = path.join(G6, "r79g6-sweep.json");

const RENDER = {
  ocean: { plain: "fullrgb-ocean-plain.raw", noise05: "fullrgb-ocean-noise05.raw", noise10: "fullrgb-ocean-noise10.raw", dir: RENDER_NEW },
  basgo: { plain: "fullrgb-basgo-plain.raw", noise05: "fullrgb-basgo-noise05.raw", noise10: "fullrgb-basgo-noise10.raw", dir: RENDER_NEW },
  slovenska: { plain: "fullrgb-slovenska-plain.raw", noise05: "fullrgb-slovenska-noise05.raw", noise10: "fullrgb-slovenska-noise10.raw", dir: RENDER_NEW },
  "test-pattern": { plain: "fullrgb-plain.raw", noise05: "fullrgb-noise05.raw", noise10: "fullrgb-noise10.raw", dir: R66T3,
    noise07: "fullrgb-noise07.raw", noise08: "fullrgb-noise08.raw", dir78: path.join(G6, "render") },
};

// [tên case, thư mục snapshot, file snaps, nguồn, mức noise]
const CASES = [
  // test-pattern cửa sổ mới w2048/w2400/w2720 (n05/n07/n08/n10) — lấp
  // khoảng chuyển tiếp w2240 (cả hai KHỚP) -> w2560 (cả hai LỆCH).
  ["G6-sweep-w2048-testpattern-n05", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise05"],
  ["G6-sweep-w2048-testpattern-n07", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise07"],
  ["G6-sweep-w2048-testpattern-n08", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise08"],
  ["G6-sweep-w2048-testpattern-n10", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise10"],
  ["G6-sweep-w2400-testpattern-n05", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise05"],
  ["G6-sweep-w2400-testpattern-n07", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise07"],
  ["G6-sweep-w2400-testpattern-n08", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise08"],
  ["G6-sweep-w2400-testpattern-n10", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise10"],
  ["G6-sweep-w2720-testpattern-n05", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise05"],
  ["G6-sweep-w2720-testpattern-n07", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise07"],
  ["G6-sweep-w2720-testpattern-n08", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise08"],
  ["G6-sweep-w2720-testpattern-n10", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise10"],
  // test-pattern w2880 chỉ n07/n08 (n05/n10 đã có từ F7).
  ["G6-sweep-w2880-testpattern-n07", "headed-w2880x1620-testpattern", "r79g6-snaps-w2880x1620.json", "test-pattern", "noise07"],
  ["G6-sweep-w2880-testpattern-n08", "headed-w2880x1620-testpattern", "r79g6-snaps-w2880x1620.json", "test-pattern", "noise08"],
  // basgo cửa sổ lớn w2240/w2560/w2880 (n05/n10).
  ["G6-sweep-w2240-basgo-n05", "headed-w2240x1260", "r79g6-snaps-w2240x1260.json", "basgo", "noise05"],
  ["G6-sweep-w2240-basgo-n10", "headed-w2240x1260", "r79g6-snaps-w2240x1260.json", "basgo", "noise10"],
  ["G6-sweep-w2560-basgo-n05", "headed-w2560x1440", "r79g6-snaps-w2560x1440.json", "basgo", "noise05"],
  ["G6-sweep-w2560-basgo-n10", "headed-w2560x1440", "r79g6-snaps-w2560x1440.json", "basgo", "noise10"],
  ["G6-sweep-w2880-basgo-n05", "headed-w2880x1620", "r79g6-snaps-w2880x1620.json", "basgo", "noise05"],
  ["G6-sweep-w2880-basgo-n10", "headed-w2880x1620", "r79g6-snaps-w2880x1620.json", "basgo", "noise10"],
];

async function main() {
  const cases = [];
  const docs = new Map();
  const loadDoc = (dir, file) => {
    const key = `${dir}/${file}`;
    if (!docs.has(key)) docs.set(key, JSON.parse(fs.readFileSync(path.join(G6, dir, file), "utf8")));
    return docs.get(key);
  };
  for (const [name, dir, file, src, lv] of CASES) {
    const doc = loadDoc(dir, file);
    const v = doc.snaps?.[src];
    if (!v?.plain || !v?.[lv]) { console.log(`  bỏ ${name}: thiếu ${src} plain/${lv} trong ${dir}/${file}`); continue; }
    const cfg = RENDER[src];
    const noiseDir = cfg[lv] && cfg.dir78 && (lv === "noise07" || lv === "noise08") ? cfg.dir78 : cfg.dir;
    const plain1280 = fs.readFileSync(path.join(cfg.dir, cfg.plain));
    const noise1280 = fs.readFileSync(path.join(noiseDir, cfg[lv]));
    const rPlain = doc.rawFrames?.[src]?.plain, rNoise = doc.rawFrames?.[src]?.[lv];
    const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
    const d1 = v.plain2 ? v.plain.rgbB64 === v.plain2.rgbB64 : null;
    const c = evalDelta0Case({
      name, regime: "G6 sweep (post-fix, code C1)",
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
      plain1280, noise1280, vw: v.plain.w, vh: v.plain.h,
    });
    c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
    c.noiseLevel = lv; c.source = src;
    cases.push(c);
  }

  for (const c of cases) {
    console.log(`${c.name} rect=${c.rect} plainMad=${c.plainMad} perChanMad=${JSON.stringify(c.perChanMad)} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} corr=${JSON.stringify(c.corr)} D1=${c.d1PlainIdentical} D3=${c.d3SameFrame}`);
    console.log(`    noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} dCorr=${JSON.stringify(c.corrDiffNoD0)} deltaMad=${c.deltaMadNoD0} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} dCorr=${JSON.stringify(c.corrDiffFullD0)} deltaMad=${c.deltaMadFullD0} | đúng=${c.correct}`);
    console.log(`    cổng: R0=${c.gates.R0_cu} G1=${c.gates.G1_d0stdR_le_2} G2=${c.gates.G2_ratioR_le_1} G12=${c.gates.G12_ca_hai} | verdict: R0=${c.verdictUnder.R0_cu} G1=${c.verdictUnder.G1_d0stdR_le_2} G2=${c.verdictUnder.G2_ratioR_le_1} G12=${c.verdictUnder.G12_ca_hai}`);
  }

  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(cases, rule);
    console.log(`${rule} (case mới G6): đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored})${scores[rule].badList.length ? " | SAI: " + scores[rule].badList.join("; ") : ""}`);
  }
  // Gộp với 53 case cũ (27 D2/E6 + 26 F7) để đếm G1/G2 phân biệt.
  // scoreRule chỉ cần correct + verdictUnder.
  const oldCases = [];
  for (const f of ["r77e6-g12.json", "r77e6-newcases.json"]) {
    const j = JSON.parse(fs.readFileSync(path.join(E6, f), "utf8"));
    for (const c of j.cases || []) oldCases.push(c);
  }
  {
    const j = JSON.parse(fs.readFileSync(path.join(F7, "r78f7-postfix.json"), "utf8"));
    for (const c of j.cases || []) oldCases.push(c);
  }
  const seen = new Set();
  const oldUnique = oldCases.filter((c) => { if (seen.has(c.name)) return false; seen.add(c.name); return true; });
  console.log(`\nCase cũ nạp lại: ${oldUnique.length} (duy nhất theo tên, từ r77e6-g12.json + r77e6-newcases.json + r78f7-postfix.json)`);
  const all = [...oldUnique, ...cases];
  const g1g2Disagree = all.filter((c) => c.gates.G1_d0stdR_le_2 !== c.gates.G2_ratioR_le_1);
  console.log(`G1 vs G2 bất đồng trên ${g1g2Disagree.length}/${all.length} case gộp:`);
  for (const c of g1g2Disagree) console.log(`  BẤT ĐỒNG ${c.name} rect=${c.rect} d0std_R=${c.d0stdR} ratio_R=${c.ratioR} plainMad=${c.plainMad} G1=${c.gates.G1_d0stdR_le_2} G2=${c.gates.G2_ratioR_le_1} đúng=${c.correct} verdictG1=${c.verdictUnder.G1_d0stdR_le_2} verdictG2=${c.verdictUnder.G2_ratioR_le_1}`);
  const combinedScores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    combinedScores[rule] = scoreRule(all, rule);
    console.log(`${rule} (gộp ${all.length} case): đúng ${combinedScores[rule].ok}/${combinedScores[rule].total} (không chấm ${combinedScores[rule].unscored})${combinedScores[rule].badList.length ? " | SAI: " + combinedScores[rule].badList.join("; ") : ""}`);
  }
  const report = {
    generated: new Date().toISOString(),
    harness: "apps/web/scripts/delta0-harness.mjs (luật chính G12)",
    cases, scores,
    oldCasesCount: oldUnique.length,
    g1g2DisagreeCount: g1g2Disagree.length,
    g1g2Disagree: g1g2Disagree.map((c) => ({ name: c.name, rect: c.rect, d0stdR: c.d0stdR, ratioR: c.ratioR, plainMad: c.plainMad, g1: c.gates.G1_d0stdR_le_2, g2: c.gates.G2_ratioR_le_1, correct: c.correct })),
    combinedScores,
  };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2), { label: "r79g6-sweep" });
  console.log(`\nJSON sweep G6: ${OUT} (${cases.length} case mới)`);
  const g12 = scores.G12_ca_hai;
  if (g12.bad > 0) { console.log("KẾT QUẢ: G12 SAI trên case mới — xem badList trên"); process.exitCode = 1; }
  else console.log(`KẾT QUẢ: G12 đúng ${g12.ok}/${g12.total} case mới chấm được (không chấm ${g12.unscored})`);
}
main().catch((e) => { console.error(`G6-SWEEP LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
