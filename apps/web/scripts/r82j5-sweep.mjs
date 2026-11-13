#!/usr/bin/env node
/**
 * r82j5-sweep.mjs — Phase 9 đợt 82, luồng J5: ĐÁNH GIÁ case capture pan
 * (motion giả) qua harness dùng chung, số học KHÔNG làm tròn
 * (evalDelta0CaseRaw) + làm tròn (evalDelta0Case) để đối chiếu.
 *
 * Đọc snapshot headed J5 (r82j5-headed-capture.mjs). Render tham chiếu:
 * hidden_files/round82-j5/render/pan-{slov,tp}-s{N}-{plain,noise05,
 * noise10}.raw (khớp frame 30) và pan-...-f25-plain.raw (lệch 5 frame).
 * Noise cho bản lệch: chuyển delta Z2 từ bản khớp
 * (noiseLệch = plainF25 + (noiseKhớp − plainKhớp)).
 * Chấm "đúng" theo quy ước D2; chấm 4 luật R0/G1/G2/G12 ở cả hai số học.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r82j5-sweep.mjs <tên-pan> [cửa-sổ]
 *   vd: node apps/web/scripts/r82j5-sweep.mjs pan-slov-s8 w1920x1080
 * JSON: hidden_files/round82-j5/r82j5-sweep-{tên-pan}-{cửa-sổ}.json
 * (tên file KÈM cửa sổ — sửa lỗi r81i4-sweep.mjs ghi đè lẫn nhau, xem
 * LIMITS I4 §5).
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs"; // M5 (đợt 85): ghi JSON qua helper retry EPERM + verify đủ byte (nối nốt nợ L6 §5).
import os from "node:os";
import path from "node:path";
import { evalDelta0Case, evalDelta0CaseRaw, scoreRule, b64ToRgb } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const J5 = path.join(GOAL, "round82-j5");
const NAME = process.argv[2];
const WIN = process.argv[3] || "w1920x1080";
if (!NAME) { console.error("dùng: node r82j5-sweep.mjs <tên-pan> [cửa-sổ, vd w1920x1080]"); process.exit(2); }
const OUT = path.join(J5, `r82j5-sweep-${NAME}-${WIN}.json`);
const RENDER = path.join(J5, "render");
const r4 = (x) => +x.toFixed(4);

function transferNoise(plainNew, plainOld, noiseOld) {
  const out = Buffer.alloc(plainNew.length);
  let clamped = 0;
  for (let i = 0; i < plainNew.length; i++) {
    const v = plainNew[i] + (noiseOld[i] - plainOld[i]);
    if (v < 0) { out[i] = 0; clamped++; } else if (v > 255) { out[i] = 255; clamped++; } else out[i] = v;
  }
  return { buf: out, clampedFrac: r4(clamped / plainNew.length) };
}

async function main() {
  // Mỗi nguồn capture vào scratch riêng (tránh ghi đè snaps JSON lẫn nhau):
  // hidden_files/round82-j5/headed-{WIN}-{NAME}/r82j5-snaps-{WIN}.json.
  const doc = JSON.parse(fs.readFileSync(path.join(J5, `headed-${WIN}-${NAME}`, `r82j5-snaps-${WIN}.json`), "utf8"));
  const v = doc.snaps?.[NAME];
  if (!v?.plain || !v?.noise05 || !v?.noise10) throw new Error(`thiếu snapshot ${NAME} plain/noise05/noise10 trong headed-${WIN}`);
  const plainMatched = fs.readFileSync(path.join(RENDER, `${NAME}-plain.raw`));
  const plainOffset = fs.readFileSync(path.join(RENDER, `${NAME}-f25-plain.raw`));
  const cases = [], casesRaw = [];
  for (const [mode, plain1280] of [["matched-f30", plainMatched], ["offset-f25", plainOffset]]) {
    for (const lv of ["noise05", "noise10"]) {
      const noiseMatched = fs.readFileSync(path.join(RENDER, `${NAME}-${lv}.raw`));
      const noise1280 = mode === "matched-f30" ? noiseMatched : transferNoise(plainOffset, plainMatched, noiseMatched).buf;
      const rPlain = doc.rawFrames?.[NAME]?.plain, rNoise = doc.rawFrames?.[NAME]?.[lv];
      const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
      const d1 = v.plain2 ? v.plain.rgbB64 === v.plain2.rgbB64 : null;
      const args = {
        name: `J5-pan-${WIN}-${NAME}-${mode}-${lv === "noise05" ? "n05" : "n10"}`, regime: "pan motion-giả (đợt 82 J5)",
        prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
        plain1280, noise1280, vw: v.plain.w, vh: v.plain.h,
      };
      const c = evalDelta0Case(args);
      const cr = evalDelta0CaseRaw(args);
      c.mode = mode; c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
      c.noiseLevel = lv; c.source = NAME;
      cr.mode = mode; cr.d1PlainIdentical = d1; cr.d3SameFrame = d3; cr.rawHash = rPlain?.hash;
      cr.noiseLevel = lv; cr.source = NAME;
      cases.push(c); casesRaw.push(cr);
      console.log(`${c.name} rect=${c.rect} plainMad=${c.plainMad} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} D1=${d1} D3=${d3}`);
      console.log(`    ROUNDED noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} | đúng=${c.correct}`);
      console.log(`    RAW     noD0: ${cr.verdictNoD0} maxKurt=${r4(Math.max(...cr.kurtDiffNoD0))} | fullD0: ${cr.verdictFullD0} maxKurt=${r4(Math.max(...cr.kurtDiffFullD0))} | đúng=${cr.correct}`);
      console.log(`    cổng (raw): d0stdR=${r4(cr.d0stdR)} residStdR=${r4(cr.residStd[0])} ratioR=${r4(cr.ratioR)} plainMad=${r4(cr.plainMad)} | R0=${cr.gates.R0_cu} G1=${cr.gates.G1_d0stdR_le_2} G2=${cr.gates.G2_ratioR_le_1} G12=${cr.gates.G12_ca_hai}`);
      const q4 = !cr.gates.G1_d0stdR_le_2 && cr.gates.G2_ratioR_le_1;
      console.log(`    Q4? ${q4 ? "CÓ — G1 từ chối, G2 áp (góc Q4 thật)" : "KHÔNG"} | G1/G2 phân biệt verdict (raw)? ${cr.verdictUnder.G1_d0stdR_le_2 !== cr.verdictUnder.G2_ratioR_le_1 ? "CÓ" : "KHÔNG"} | G2/G12 phân biệt verdict (raw)? ${cr.verdictUnder.G2_ratioR_le_1 !== cr.verdictUnder.G12_ca_hai ? "CÓ" : "KHÔNG"}`);
    }
  }
  const scores = {}, scoresRaw = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(cases, rule);
    scoresRaw[rule] = scoreRule(casesRaw, rule);
    console.log(`${rule} ROUNDED: ${scores[rule].ok}/${scores[rule].total} | RAW: ${scoresRaw[rule].ok}/${scoresRaw[rule].total}`);
  }
  const report = { generated: new Date().toISOString(), harness: "delta0-harness.mjs (rounded + *Raw)", window: WIN, cases, casesRaw, scores, scoresRaw };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2), { label: "r82j5-sweep" });
  console.log(`\nJSON sweep J5: ${OUT} (${cases.length} case)`);
}
main().catch((e) => { console.error(`J5-SWEEP LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
