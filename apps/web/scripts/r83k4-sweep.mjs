#!/usr/bin/env node
/**
 * r83k4-sweep.mjs — Phase 9 đợt 83, luồng K4: ĐÁNH GIÁ case capture codec
 * VP9-vs-h264 qua harness dùng chung, CẢ hai số học:
 * làm tròn (evalDelta0Case) và KHÔNG làm tròn (evalDelta0CaseRaw).
 * SAO CHÉP từ r82j4-sweep.mjs, chỉ đổi đường dẫn sang round83-k4.
 *
 * Đọc snapshot headed K4 (r83k4-headed-capture.mjs).
 * Render tham chiếu: hidden_files/round83-k4/render/{name}-
 * {plain,noise05,noise10}.raw (build bằng r83k4-media-build.mjs).
 * Chấm "đúng" theo quy ước D2; chấm 4 luật R0/G1/G2/G12 ở cả hai số học.
 * Q4 = G1 từ chối (d0std_R > 2) nhưng G2 áp (ratio_R ≤ 1) — góc phân
 * biệt G2 vs G12.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r83k4-sweep.mjs <tên-nguồn> [cửa-sổ]
 *   vd: node apps/web/scripts/r83k4-sweep.mjs slov-h264-1920 w1920x1080
 * JSON: hidden_files/round83-k4/r83k4-sweep-{tên-nguồn}-{cửa-sổ}.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs"; // M5 (đợt 85): ghi JSON qua helper retry EPERM + verify đủ byte (nối nốt nợ L6 §5).
import os from "node:os";
import path from "node:path";
import { evalDelta0Case, evalDelta0CaseRaw, scoreRule, b64ToRgb } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const I4 = path.join(GOAL, "round83-k4");
const NAME = process.argv[2];
const WIN = process.argv[3] || "w2880x1620";
if (!NAME) { console.error("dùng: node r83k4-sweep.mjs <tên-nguồn> [cửa-sổ, vd w1920x1080]"); process.exit(2); }
const OUT = path.join(I4, `r83k4-sweep-${NAME}-${WIN}.json`); // KÈM window (sửa lỗi I4 §5: tên không kèm window ghi đè lẫn nhau)
const RENDER = path.join(I4, "render");
const r4 = (x) => +x.toFixed(4);

async function main() {
  const doc = JSON.parse(fs.readFileSync(path.join(I4, `headed-${WIN}`, `r83k4-snaps-${WIN}.json`), "utf8"));
  const v = doc.snaps?.[NAME];
  if (!v?.plain || !v?.noise05 || !v?.noise10) throw new Error(`thiếu snapshot ${NAME} plain/noise05/noise10 trong headed-${WIN}`);
  const plain1280 = fs.readFileSync(path.join(RENDER, `${NAME}-plain.raw`));
  const cases = [], casesRaw = [];
  for (const lv of ["noise05", "noise10"]) {
    const noise1280 = fs.readFileSync(path.join(RENDER, `${NAME}-${lv}.raw`));
    const rPlain = doc.rawFrames?.[NAME]?.plain, rNoise = doc.rawFrames?.[NAME]?.[lv];
    const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
    const d1 = v.plain2 ? v.plain.rgbB64 === v.plain2.rgbB64 : null;
    const args = {
      name: `K4-codec-${WIN}-${NAME}-${lv === "noise05" ? "n05" : "n10"}`, regime: "VP9-vs-h264 codec (đợt 83 K4)",
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
      plain1280, noise1280, vw: v.plain.w, vh: v.plain.h,
    };
    const c = evalDelta0Case(args);
    const cr = evalDelta0CaseRaw(args);
    c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
    c.noiseLevel = lv; c.source = NAME;
    cr.d1PlainIdentical = d1; cr.d3SameFrame = d3; cr.rawHash = rPlain?.hash;
    cr.noiseLevel = lv; cr.source = NAME;
    cases.push(c); casesRaw.push(cr);
    console.log(`${c.name} rect=${c.rect} plainMad=${c.plainMad} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} D1=${d1} D3=${d3}`);
    console.log(`    ROUNDED noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} | đúng=${c.correct}`);
    console.log(`    RAW     noD0: ${cr.verdictNoD0} maxKurt=${r4(Math.max(...cr.kurtDiffNoD0))} dKurt=${JSON.stringify(cr.kurtDiffNoD0.map(r4))} | fullD0: ${cr.verdictFullD0} maxKurt=${r4(Math.max(...cr.kurtDiffFullD0))} dKurt=${JSON.stringify(cr.kurtDiffFullD0.map(r4))} | đúng=${cr.correct}`);
    console.log(`    cổng (raw): d0stdR=${r4(cr.d0stdR)} residStdR=${r4(cr.residStd[0])} ratioR=${r4(cr.ratioR)} plainMad=${r4(cr.plainMad)} | R0=${cr.gates.R0_cu} G1=${cr.gates.G1_d0stdR_le_2} G2=${cr.gates.G2_ratioR_le_1} G12=${cr.gates.G12_ca_hai}`);
    const q4 = !cr.gates.G1_d0stdR_le_2 && cr.gates.G2_ratioR_le_1;
    console.log(`    Q4? ${q4 ? "CÓ — G1 từ chối, G2 áp (góc Q4 thật)" : "KHÔNG"} | G1/G2 phân biệt verdict (raw)? ${cr.verdictUnder.G1_d0stdR_le_2 !== cr.verdictUnder.G2_ratioR_le_1 ? "CÓ" : "KHÔNG"} | G2/G12 phân biệt verdict (raw)? ${cr.verdictUnder.G2_ratioR_le_1 !== cr.verdictUnder.G12_ca_hai ? "CÓ" : "KHÔNG"}`);
  }
  const scores = {}, scoresRaw = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(cases, rule);
    scoresRaw[rule] = scoreRule(casesRaw, rule);
    console.log(`${rule} ROUNDED: ${scores[rule].ok}/${scores[rule].total} | RAW: ${scoresRaw[rule].ok}/${scoresRaw[rule].total}`);
  }
  const report = { generated: new Date().toISOString(), harness: "delta0-harness.mjs (rounded + *Raw)", window: WIN, cases, casesRaw, scores, scoresRaw };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2), { label: "r83k4-sweep" });
  console.log(`\nJSON sweep K4: ${OUT} (${cases.length} case mới)`);
}
main().catch((e) => { console.error(`K4-SWEEP LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
