#!/usr/bin/env node
/**
 * r79g6-e6-newcases-recheck.mjs — Phase 9 đợt 79, luồng G6: đo lại 3 case mới E6 qua
 * harness dùng chung (delta0-harness.mjs, luật G12) để kiểm chứng G12
 * không overfit trên 20 case D2.
 *
 * Case mới (capture headed mới trong đợt này, code đã sửa rò plain C1 —
 * xem hidden_files/round77-e6/captures.log):
 *  N1: ocean w1440 noise10 post-fix (đợt 76 §6 nợ 3: chưa đo noise10
 *      post-fix) — snapshot headed-w1440x900-ocean-n10.
 *  N2: ocean w1920 noise10 post-fix — snapshot headed-w1920x1080-ocean-n10.
 *  N3: ocean w1280 noise05 post-fix — snapshot headed-w1280x800-ocean.
 *      Pre-fix w1280 cả-hai-LỆCH (không chấm được); post-fix plain gần
 *      hơn nên kỳ vọng trở thành case chấm được.
 * Render tham chiếu: fullrgb-ocean-noise10.raw (N1/N2),
 * fullrgb-ocean-noise05.raw (N3) — frame method-T Z2 (render-1k), như D2.
 *
 * Chấm: "đúng" theo quy ước D2 (KHÔNG-d0 nếu không-d0 KHỚP, CÓ-d0 nếu chỉ
 * có-d0 KHỚP, cả-hai-LỆCH thì không chấm). G12 phải cho verdict đúng trên
 * mọi case mới chấm được; đồng thời báo R0 cũ để đối chứng.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r77e6-newcases.mjs
 * JSON: hidden_files/round79-g6/r79g6-e6-newcases-recheck.json (KHÔNG ghi đè file E6 gốc).
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { evalDelta0Case, scoreRule, b64ToRgb } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const E6 = path.join(GOAL, "round77-e6");
const G6 = path.join(GOAL, "round79-g6");
const OUT = path.join(G6, "r79g6-e6-newcases-recheck.json");

async function main() {
  const oceanPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const oceanNoise05 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
  const oceanNoise10 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise10.raw"));
  const cases = [];
  const addNew = (name, snapPath, noiseLevel) => {
    const doc = JSON.parse(fs.readFileSync(snapPath, "utf8"));
    const v = doc.snaps?.ocean;
    if (!v?.plain || !v?.[noiseLevel]) { console.log(`  bỏ ${name}: thiếu ocean plain/${noiseLevel}`); return null; }
    const noise1280 = noiseLevel === "noise10" ? oceanNoise10 : oceanNoise05;
    const rPlain = doc.rawFrames?.ocean?.plain, rNoise = doc.rawFrames?.ocean?.[noiseLevel];
    const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
    const d1 = v.plain2 ? v.plain.rgbB64 === v.plain2.rgbB64 : null;
    const c = evalDelta0Case({
      name, regime: "POST-FIX mới (E6, code C1)",
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[noiseLevel].rgbB64),
      plain1280: oceanPlain, noise1280, vw: v.plain.w, vh: v.plain.h,
    });
    c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
    c.noiseLevel = noiseLevel;
    cases.push(c);
    return c;
  };
  addNew("E6-post-fix-w1440-ocean-n10", path.join(E6, "headed-w1440x900-ocean-n10", "r74b1-snaps-w1440x900.json"), "noise10");
  addNew("E6-post-fix-w1920-ocean-n10", path.join(E6, "headed-w1920x1080-ocean-n10", "r74b1-snaps-w1920x1080.json"), "noise10");
  addNew("E6-post-fix-w1280-ocean-n05", path.join(E6, "headed-w1280x800-ocean", "r74b1-snaps-w1280x800.json"), "noise05");

  for (const c of cases) {
    console.log(`${c.name} rect=${c.rect} plainMad=${c.plainMad} perChanMad=${JSON.stringify(c.perChanMad)} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} corr=${JSON.stringify(c.corr)} D1=${c.d1PlainIdentical} D3=${c.d3SameFrame}`);
    console.log(`    noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} dCorr=${JSON.stringify(c.corrDiffNoD0)} deltaMad=${c.deltaMadNoD0} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} dCorr=${JSON.stringify(c.corrDiffFullD0)} deltaMad=${c.deltaMadFullD0} | đúng=${c.correct}`);
    console.log(`    cổng: R0=${c.gates.R0_cu} G1=${c.gates.G1_d0stdR_le_2} G2=${c.gates.G2_ratioR_le_1} G12=${c.gates.G12_ca_hai} | verdict: R0=${c.verdictUnder.R0_cu} G1=${c.verdictUnder.G1_d0stdR_le_2} G2=${c.verdictUnder.G2_ratioR_le_1} G12=${c.verdictUnder.G12_ca_hai}`);
  }
  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(cases, rule);
    console.log(`${rule} (case mới): đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored})${scores[rule].badList.length ? " | SAI: " + scores[rule].badList.join("; ") : ""}`);
  }
  const report = { generated: new Date().toISOString(), harness: "apps/web/scripts/delta0-harness.mjs (luật chính G12)", cases, scores };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON case mới: ${OUT} (${cases.length} case)`);
  const g12 = scores.G12_ca_hai;
  if (g12.bad > 0) { console.log("KẾT QUẢ: G12 SAI trên case mới — xem badList trên"); process.exitCode = 1; }
  else console.log(`KẾT QUẢ: G12 đúng ${g12.ok}/${g12.total} case mới chấm được (không chấm ${g12.unscored}) — không phát hiện overfit`);
}
main().catch((e) => { console.error(`G6-E6-NEWCASES-RECHECK LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
