#!/usr/bin/env node
/**
 * r79g6-combined.mjs — Phase 9 đợt 79, luồng G6: điểm GỘP 73 case dưới
 * HARNESS HIỆN TẠI (chrome-resample đã nối kernel BC upscale, đợt 78 F6).
 *
 * Đầu vào: 4 JSON đều tính bằng harness hiện tại — KHÔNG trộn số cũ
 * tiền-BC (r77e6-*.json / r78f7-postfix.json chỉ còn là tài liệu lịch sử):
 *  - r79g6-e6-recheck.json (24 case D2 tính lại)
 *  - r79g6-e6-newcases-recheck.json (3 case mới E6 tính lại)
 *  - r79g6-f7-recheck.json (26 case F7 tính lại)
 *  - r79g6-sweep.json (20 case mới G6)
 * Chấm 4 luật R0/G1/G2/G12; liệt kê case G1/G2 bất đồng + case phân biệt
 * được ở mức verdict (đúng một cổng cho verdict đúng).
 *
 * Chạy (từ gốc repo, sau khi chạy xong 3 script recheck + r79g6-sweep.mjs):
 *   node apps/web/scripts/r79g6-combined.mjs
 * JSON: hidden_files/round79-g6/r79g6-combined.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { scoreRule } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G6 = path.join(GOAL, "round79-g6");
const OUT = path.join(G6, "r79g6-combined.json");

const FILES = [
  "r79g6-e6-recheck.json",
  "r79g6-e6-newcases-recheck.json",
  "r79g6-f7-recheck.json",
  "r79g6-sweep.json",
];

function main() {
  const all = [];
  const seen = new Set();
  const perFile = {};
  for (const f of FILES) {
    const j = JSON.parse(fs.readFileSync(path.join(G6, f), "utf8"));
    const cs = j.cases || [];
    perFile[f] = cs.length;
    for (const c of cs) {
      if (seen.has(c.name)) { console.log(`  TRÙNG TÊN (bỏ qua bản sau): ${c.name} trong ${f}`); continue; }
      seen.add(c.name);
      all.push(c);
    }
  }
  console.log(`gộp ${all.length} case duy nhất từ: ${JSON.stringify(perFile)}`);
  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(all, rule);
    console.log(`${rule}: đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored})${scores[rule].badList.length ? " | SAI: " + scores[rule].badList.join("; ") : ""}`);
  }
  const disagree = all.filter((c) => c.gates.G1_d0stdR_le_2 !== c.gates.G2_ratioR_le_1);
  const discriminating = [];
  for (const c of disagree) {
    const want = c.correct === "KHÔNG-d0" ? c.verdictNoD0 : (c.correct === "CÓ-d0" ? c.verdictFullD0 : null);
    if (want === null) continue;
    const v1 = c.verdictUnder.G1_d0stdR_le_2, v2 = c.verdictUnder.G2_ratioR_le_1;
    if (v1 === v2) continue;
    discriminating.push({ name: c.name, rect: c.rect, d0stdR: c.d0stdR, ratioR: c.ratioR, correct: c.correct, rightGate: v1 === want ? "G1" : "G2", verdictG1: v1, verdictG2: v2 });
  }
  console.log(`\nG1 vs G2 bất đồng cổng: ${disagree.length}/${all.length}`);
  console.log(`phân biệt được ở mức verdict: ${discriminating.length}`);
  for (const d of discriminating) console.log(`  PHÂN BIỆT ${d.name} rect=${d.rect} d0std_R=${d.d0stdR} ratio_R=${d.ratioR} đúng=${d.correct} → ${d.rightGate} đúng (G1: ${d.verdictG1} / G2: ${d.verdictG2})`);
  const report = {
    generated: new Date().toISOString(),
    harness: "apps/web/scripts/delta0-harness.mjs (luật chính G12) + chrome-resample HIỆN TẠI (C2 M4 + BC upscale F6)",
    files: perFile,
    totalCases: all.length,
    scores,
    g1g2DisagreeCount: disagree.length,
    g1g2Disagree: disagree.map((c) => ({ name: c.name, rect: c.rect, d0stdR: c.d0stdR, ratioR: c.ratioR, plainMad: c.plainMad, g1: c.gates.G1_d0stdR_le_2, g2: c.gates.G2_ratioR_le_1, correct: c.correct, verdictG1: c.verdictUnder.G1_d0stdR_le_2, verdictG2: c.verdictUnder.G2_ratioR_le_1 })),
    discriminating,
  };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON gộp: ${OUT}`);
}
main();
