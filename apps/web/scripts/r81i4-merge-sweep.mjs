#!/usr/bin/env node
/**
 * r81i4-merge-sweep.mjs — Phase 9 đợt 81, luồng I4: GỘP kết quả sweep
 * không-làm-tròn từ 2 instance song song (A: Y2/B1/C1/D2/E6/F7;
 * B: G6/H4) thành một JSON duy nhất + chấm lại 4 luật trên tập gộp.
 *
 * Chạy SAU KHI cả hai instance đã thoát (kiểm tra EXIT-A/EXIT-B trong
 * log trước khi gộp). Không tính lại eval — chỉ gộp + chấm điểm.
 * JSON ra: ghi đè r81i4-unrounded-sweep.json (file shard B giữ nguyên).
 * KHÔNG push/tag/binary/workflow.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs"; // M5 (đợt 85): ghi JSON qua helper retry EPERM + verify đủ byte (nối nốt nợ L6 §5).
import os from "node:os";
import path from "node:path";
import { scoreRule } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const I4 = path.join(GOAL, "round81-i4");
const A = path.join(I4, "r81i4-unrounded-sweep.json");
const B = path.join(I4, "r81i4-unrounded-sweep-g6h4.json");

async function main() {
  const a = JSON.parse(fs.readFileSync(A, "utf8"));
  const b = JSON.parse(fs.readFileSync(B, "utf8"));
  const byName = new Map();
  for (const c of [...(a.cases || []), ...(b.cases || [])]) {
    if (byName.has(c.name)) console.log(`  trùng tên (giữ bản đầu): ${c.name}`);
    else byName.set(c.name, c);
  }
  const cases = [...byName.values()];
  const crossChecks = [...(a.crossChecks || []), ...(b.crossChecks || [])];
  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(cases, rule);
    console.log(`${rule} RAW (gộp): đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored})${scores[rule].badList.length ? " | SAI: " + scores[rule].badList.join("; ") : ""}`);
  }
  const disc = { g1g2: [], g2g12: [], g1g12: [] };
  for (const c of cases) {
    if (c.correct === "cả-hai-LỆCH") continue;
    if (c.verdictUnder.G1_d0stdR_le_2 !== c.verdictUnder.G2_ratioR_le_1) disc.g1g2.push(c.name);
    if (c.verdictUnder.G2_ratioR_le_1 !== c.verdictUnder.G12_ca_hai) disc.g2g12.push(c.name);
    if (c.verdictUnder.G1_d0stdR_le_2 !== c.verdictUnder.G12_ca_hai) disc.g1g12.push(c.name);
  }
  console.log(`PHÂN BIỆT VERDICT (raw, gộp): G1 vs G2 = ${disc.g1g2.length} ${JSON.stringify(disc.g1g2)} | G2 vs G12 = ${disc.g2g12.length} | G1 vs G12 = ${disc.g1g12.length}`);
  const gateDisagree = cases.filter((c) => c.gates.G1_d0stdR_le_2 !== c.gates.G2_ratioR_le_1).length;
  console.log(`bất đồng cổng G1/G2: ${gateDisagree}/${cases.length} case`);
  const merged = {
    generated: new Date().toISOString(),
    harness: "delta0-harness.mjs *Raw (không làm tròn) + chrome-resample HIỆN TẠI (C2 M4 + BC upscale F6)",
    kurtThreshold: 0.35,
    gradFramesIdentical: a.gradFramesIdentical && b.gradFramesIdentical,
    mergedFrom: ["r81i4-unrounded-sweep.json (shard A: Y2/B1/C1/D2/E6/F7, trước khi gộp)", "r81i4-unrounded-sweep-g6h4.json (shard B: G6/H4)"],
    totalCases: cases.length,
    cases, crossChecks, scores, discriminating: disc, gateDisagreeCount: gateDisagree,
  };
  writeFileEpermRetry(A, JSON.stringify(merged, null, 2), { label: "r81i4-merge-sweep-sweep" });
  console.log(`\nJSON gộp: ${A} (${cases.length} case)`);
  const badChecks = crossChecks.filter((x) => x.plainMadDiff === undefined || Math.abs(x.plainMadDiff) > 0.001 || x.gatesMatch === false || x.h4Match === false);
  if (badChecks.length) { console.log(`CẢNH BÁO cross-check: ${badChecks.length} case: ${JSON.stringify(badChecks)}`); process.exitCode = 1; }
  else console.log("KẾT QUẢ: gộp xong, loader tái lập đúng số làm tròn + khớp H4 ở mọi case đối chiếu được");
}
main().catch((e) => { console.error(`I4-MERGE-SWEEP LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
