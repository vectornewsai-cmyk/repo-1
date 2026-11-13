#!/usr/bin/env node
/**
 * r80h4-sweep.mjs — Phase 9 đợt 80, luồng H4: ĐÁNH GIÁ 2 case blend
 * slovenska × ocean a065 tại w2880 (rect 1769x995) qua harness dùng chung
 * (delta0-harness.mjs, luật chính G12) trên snapshot headed mới của đợt
 * này (r80h4-headed-capture.mjs). Đây là case săn Q4 (d0std_R > 2
 * nhưng ratio_R <= 1) để phân biệt G2 vs G12: d0std_R đã decode của
 * a065 là 2,01 ở rect này (vừa trên ngưỡng G1 2,0); residStd_R thật
 * chỉ có sau capture này.
 *
 * Render tham chiếu: hidden_files/round80-h4/render/blend-slov-ocean-a65-
 * {plain,noise05,noise10}.raw (build bằng r80h4-blend-build.mjs, chuỗi
 * Z2 đã kiểm chứng MAD=0 trên test-pattern).
 * Chấm "đúng" theo quy ước D2; chấm 4 luật R0/G1/G2/G12.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r80h4-sweep.mjs
 * JSON: hidden_files/round80-h4/r80h4-sweep.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs"; // M5 (đợt 85): ghi JSON qua helper retry EPERM + verify đủ byte (nối nốt nợ L6 §5).
import os from "node:os";
import path from "node:path";
import { evalDelta0Case, scoreRule, b64ToRgb } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H4 = path.join(GOAL, "round80-h4");
const NAME = process.argv[2] || "blend-slov-ocean-a65";
const OUT = path.join(H4, `r80h4-sweep-${NAME}.json`);
const RENDER = path.join(H4, "render");

async function main() {
  const doc = JSON.parse(fs.readFileSync(path.join(H4, "headed-w2880x1620", "r80h4-snaps-w2880x1620.json"), "utf8"));
  const v = doc.snaps?.[NAME];
  if (!v?.plain || !v?.noise05 || !v?.noise10) throw new Error(`thiếu snapshot ${NAME} plain/noise05/noise10`);
  const plain1280 = fs.readFileSync(path.join(RENDER, `${NAME}-plain.raw`));
  const cases = [];
  for (const lv of ["noise05", "noise10"]) {
    const noise1280 = fs.readFileSync(path.join(RENDER, `${NAME}-${lv}.raw`));
    const rPlain = doc.rawFrames?.[NAME]?.plain, rNoise = doc.rawFrames?.[NAME]?.[lv];
    const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
    const d1 = v.plain2 ? v.plain.rgbB64 === v.plain2.rgbB64 : null;
    const c = evalDelta0Case({
      name: `H4-q4-w2880-${NAME}-${lv === "noise05" ? "n05" : "n10"}`, regime: "Q4 hunt (blend tổng hợp, post-fix C1)",
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
      plain1280, noise1280, vw: v.plain.w, vh: v.plain.h,
    });
    c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
    c.noiseLevel = lv; c.source = NAME;
    cases.push(c);
  }
  for (const c of cases) {
    console.log(`${c.name} rect=${c.rect} plainMad=${c.plainMad} perChanMad=${JSON.stringify(c.perChanMad)} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} corr=${JSON.stringify(c.corr)} D1=${c.d1PlainIdentical} D3=${c.d3SameFrame}`);
    console.log(`    noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} dCorr=${JSON.stringify(c.corrDiffNoD0)} deltaMad=${c.deltaMadNoD0} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} dCorr=${JSON.stringify(c.corrDiffFullD0)} deltaMad=${c.deltaMadFullD0} | đúng=${c.correct}`);
    console.log(`    cổng: R0=${c.gates.R0_cu} G1=${c.gates.G1_d0stdR_le_2} G2=${c.gates.G2_ratioR_le_1} G12=${c.gates.G12_ca_hai} | verdict: R0=${c.verdictUnder.R0_cu} G1=${c.verdictUnder.G1_d0stdR_le_2} G2=${c.verdictUnder.G2_ratioR_le_1} G12=${c.verdictUnder.G12_ca_hai}`);
    const q4 = !c.gates.G1_d0stdR_le_2 && c.gates.G2_ratioR_le_1;
    console.log(`    Q4? ${q4 ? "CÓ — G1 từ chối, G2 áp (góc Q4 thật)" : "KHÔNG"} | G1/G2 phân biệt verdict? ${c.verdictUnder.G1_d0stdR_le_2 !== c.verdictUnder.G2_ratioR_le_1 ? "CÓ" : "KHÔNG"} | G2/G12 phân biệt verdict? ${c.verdictUnder.G2_ratioR_le_1 !== c.verdictUnder.G12_ca_hai ? "CÓ" : "KHÔNG"}`);
  }
  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(cases, rule);
    console.log(`${rule} (case mới H4): đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored})${scores[rule].badList.length ? " | SAI: " + scores[rule].badList.join("; ") : ""}`);
  }
  const report = { generated: new Date().toISOString(), harness: "apps/web/scripts/delta0-harness.mjs (luật chính G12)", cases, scores };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2), { label: "r80h4-sweep" });
  console.log(`\nJSON sweep H4: ${OUT} (${cases.length} case mới)`);
}
main().catch((e) => { console.error(`H4-SWEEP LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
