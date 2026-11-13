#!/usr/bin/env node
/**
 * test_round79_g6_g1g2.mjs — Phase 9 đợt 79, luồng G6: test đơn vị
 * node:test cho sweep G1/G2 (20 case mới) + recheck case cũ bằng harness
 * HIỆN TẠI (chrome-resample đã nối kernel BC upscale, đợt 78 F6).
 *
 * Đọc JSON đo thật do r79g6-sweep.mjs, r79g6-e6-recheck.mjs,
 * r79g6-e6-newcases-recheck.mjs, r79g6-f7-recheck.mjs và
 * r79g6-combined.mjs ghi; KHÔNG tự sinh số đo. Mọi kỳ vọng dưới đây đều
 * viết theo số đo thật (xem docs/PHASE9_ROUND79_G6_G1G2_SWEEP_LIMITS.md).
 *
 * Chạy (từ gốc repo, sau khi chạy sweep + rechecks + combined):
 *   node --test apps/web/scripts/test_round79_g6_g1g2.mjs
 * KHÔNG push/tag/binary. Không sửa code production.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyDelta0G1, applyDelta0G2, applyDelta0G12, scoreRule } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G6 = path.join(GOAL, "round79-g6");
const F7 = path.join(GOAL, "round78-f7");
const sweep = JSON.parse(fs.readFileSync(path.join(G6, "r79g6-sweep.json"), "utf8"));
const f7recheck = JSON.parse(fs.readFileSync(path.join(G6, "r79g6-f7-recheck.json"), "utf8"));
const f7old = JSON.parse(fs.readFileSync(path.join(F7, "r78f7-postfix.json"), "utf8"));
const combined = JSON.parse(fs.readFileSync(path.join(G6, "r79g6-combined.json"), "utf8"));
const cases = sweep.cases;

test("sweep G6 đủ 20 case mới, mọi capture D1 + D3 đều pass", () => {
  assert.equal(cases.length, 20, `sweep phải có 20 case mới, được ${cases.length}`);
  for (const c of cases) {
    assert.equal(c.d1PlainIdentical, true, `${c.name}: D1 plain 2 lần phải pixel-identical`);
    assert.equal(c.d3SameFrame, true, `${c.name}: D3 raw hash plain/noise phải khớp (cùng khung)`);
  }
  const hashes = new Set(cases.map((c) => c.rawHash));
  assert.deepEqual([...hashes].sort(), ["4290ca0b", "ad4be1d3"], "chỉ có 2 khung render: basgo f30 + test-pattern f30");
});

test("cổng G1/G2/G12 lưu trong JSON khớp luật tính lại từ đặc trưng", () => {
  for (const c of cases) {
    const f = { plainMad: c.plainMad, d0std: c.d0std, residStd: c.residStd };
    assert.equal(applyDelta0G1(f).apply, c.gates.G1_d0stdR_le_2, `${c.name}: G1`);
    assert.equal(applyDelta0G2(f).apply, c.gates.G2_ratioR_le_1, `${c.name}: G2`);
    assert.equal(applyDelta0G12(f).apply, c.gates.G12_ca_hai, `${c.name}: G12`);
  }
});

test("G1/G2 bất đồng 16/20 case mới, tất cả đều Q3 và KHÔNG phân biệt được ở mức verdict", () => {
  const disagree = cases.filter((c) => c.gates.G1_d0stdR_le_2 !== c.gates.G2_ratioR_le_1);
  assert.equal(disagree.length, 16, `bất đồng mới phải là 16, được ${disagree.length}`);
  for (const c of disagree) {
    // Q3: G1 áp (d0std_R ≤ 2) nhưng G2 từ chối (ratio_R > 1).
    assert.equal(c.gates.G1_d0stdR_le_2, true, `${c.name}: phải là G1 áp`);
    assert.equal(c.gates.G2_ratioR_le_1, false, `${c.name}: phải là G2 từ chối`);
    assert.equal(c.verdictUnder.G1_d0stdR_le_2, c.verdictUnder.G2_ratioR_le_1,
      `${c.name}: verdict hai cổng phải giống nhau (không phân biệt được)`);
  }
});

test("ratio_R test-pattern vượt 1 giữa w2048 (0,86) và w2400 (1,07); basgo Q3 ở mọi cửa sổ lớn", () => {
  const byName = new Map(cases.map((c) => [c.name, c]));
  assert.ok(byName.get("G6-sweep-w2048-testpattern-n05").ratioR < 1, "w2048 ratio_R phải < 1 (cả hai cổng áp)");
  assert.ok(byName.get("G6-sweep-w2400-testpattern-n05").ratioR > 1, "w2400 ratio_R phải > 1 (Q3)");
  for (const c of cases) {
    if (c.source === "basgo") {
      assert.ok(c.ratioR > 1.2 && c.ratioR < 1.4, `${c.name}: basgo ratio_R=${c.ratioR} (kỳ vọng 1,2–1,4)`);
      assert.equal(c.verdictUnder.G1_d0stdR_le_2, "KHỚP-THỐNG-KÊ", `${c.name}: G1 phải KHỚP`);
      assert.equal(c.verdictUnder.G2_ratioR_le_1, "KHỚP-THỐNG-KÊ", `${c.name}: G2 phải KHỚP`);
    }
  }
});

test("case duy nhất làm cả 4 luật sai: w2048-testpattern-n10 (cả hai cổng cùng áp d0 sai)", () => {
  const c = cases.find((x) => x.name === "G6-sweep-w2048-testpattern-n10");
  assert.ok(c, "thiếu case w2048-n10");
  assert.equal(c.verdictNoD0, "KHỚP-THỐNG-KÊ", "không-d0 phải KHỚP");
  assert.equal(c.verdictFullD0, "LỆCH-THỐNG-KÊ", "có-d0 phải LỆCH");
  assert.ok(Math.abs(c.kurtDiffNoD0[0] - 0.34) < 0.005, `noD0 Δkurt R phải ≈ 0,34, được ${c.kurtDiffNoD0[0]}`);
  assert.ok(Math.abs(c.kurtDiffFullD0[0] - 0.36) < 0.005, `fullD0 Δkurt R phải ≈ 0,36, được ${c.kurtDiffFullD0[0]}`);
  // Cả hai cổng cùng áp (d0std_R 1,14 ≤ 2, ratio_R 0,86 ≤ 1) nên cả hai
  // cùng sai — đây là lỗi của bản thân d0, không phân biệt được G1/G2.
  assert.equal(c.gates.G1_d0stdR_le_2, true);
  assert.equal(c.gates.G2_ratioR_le_1, true);
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    assert.equal(sweep.scores[rule].ok, 19, `${rule} phải đúng 19/20`);
    assert.equal(sweep.scores[rule].bad, 1, `${rule} phải sai đúng 1`);
  }
});

test("recheck F7: case w2240 (downscale) tái lập y hệt, case w2560/w2880 (upscale) đổi sau BC", () => {
  const oldByName = new Map(f7old.cases.map((c) => [c.name, c]));
  const newByName = new Map(f7recheck.cases.map((c) => [c.name, c]));
  for (const name of ["F7-sweep-w2240-testpattern-n05", "F7-sweep-w2240-testpattern-n10"]) {
    const o = oldByName.get(name), n = newByName.get(name);
    assert.ok(Math.abs(o.plainMad - n.plainMad) <= 0.001, `${name}: plainMad phải khớp (downscale không đổi)`);
    assert.ok(Math.abs(o.d0stdR - n.d0stdR) <= 0.01, `${name}: d0std_R phải khớp`);
    assert.equal(o.correct, n.correct, `${name}: verdict đúng phải giữ nguyên`);
  }
  // w2560 n05/n10 + w2880 n10: F7 gốc cả-hai-LỆCH → recheck KHÔNG-d0.
  // w2880 n05: F7 gốc đã là KHÔNG-d0 (case phân biệt) — verdict đúng giữ
  // nguyên, nhưng verdict DƯỚI G1 đổi LỆCH → KHỚP nên không còn phân biệt.
  const oldCorrect = {
    "F7-sweep-w2560-testpattern-n05": "cả-hai-LỆCH",
    "F7-sweep-w2560-testpattern-n10": "cả-hai-LỆCH",
    "F7-sweep-w2880-testpattern-n05": "KHÔNG-d0",
    "F7-sweep-w2880-testpattern-n10": "cả-hai-LỆCH",
  };
  for (const [name, wantOld] of Object.entries(oldCorrect)) {
    const o = oldByName.get(name), n = newByName.get(name);
    assert.equal(o.correct, wantOld, `${name}: F7 gốc phải là ${wantOld}`);
    assert.equal(n.correct, "KHÔNG-d0", `${name}: recheck phải thành KHÔNG-d0 (BC upscale)`);
  }
  // Case phân biệt duy nhất của F7 KHÔNG còn phân biệt được dưới harness hiện tại.
  const n05 = newByName.get("F7-sweep-w2880-testpattern-n05");
  assert.equal(n05.verdictUnder.G1_d0stdR_le_2, "KHỚP-THỐNG-KÊ", "G1 giờ phải KHỚP");
  assert.equal(n05.verdictUnder.G2_ratioR_le_1, "KHỚP-THỐNG-KÊ", "G2 giờ phải KHỚP");
  assert.ok(Math.abs(n05.d0stdR - 1.17) <= 0.01, `d0std_R recheck phải ≈ 1,17 (F7 gốc 1,14), được ${n05.d0stdR}`);
});

test("điểm gộp harness-hiện-tại: 73 case, G1=G2=G12=66/67, 0 case phân biệt được", () => {
  assert.equal(combined.totalCases, 73, `gộp phải có 73 case, được ${combined.totalCases}`);
  for (const rule of ["G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    assert.equal(combined.scores[rule].ok, 66, `${rule} phải đúng 66/67`);
    assert.equal(combined.scores[rule].bad, 1, `${rule} phải sai đúng 1`);
    assert.deepEqual(combined.scores[rule].badList,
      ["G6-sweep-w2048-testpattern-n10 (muốn KHỚP-THỐNG-KÊ, được LỆCH-THỐNG-KÊ)"],
      `${rule}: case sai duy nhất phải là w2048-n10`);
  }
  assert.equal(combined.scores.R0_cu.ok, 60, "R0 phải đúng 60/67");
  assert.equal(combined.g1g2DisagreeCount, 24, `bất đồng cổng gộp phải là 24, được ${combined.g1g2DisagreeCount}`);
  assert.deepEqual(combined.discriminating, [], "không còn case nào phân biệt được G1/G2 ở mức verdict");
});

test("hồi quy: G12 vẫn đúng 20/20 trên case D2 tính lại (r79g6-e6-recheck.json)", () => {
  const e6 = JSON.parse(fs.readFileSync(path.join(G6, "r79g6-e6-recheck.json"), "utf8"));
  assert.equal(e6.scores.G12_ca_hai.ok, 20, `G12 trên D2 tính lại: ${e6.scores.G12_ca_hai.ok}/20`);
  assert.equal(e6.scores.G12_ca_hai.bad, 0);
  // Chỉ 3 case lệch khỏi JSON D2, tất cả đều ở rect upscale (BC) — và
  // không case nào trong 3 case đó đổi điểm luật.
  assert.equal(e6.compareVsD2.mismatch, 3, `mismatch vs D2 phải là 3, được ${e6.compareVsD2.mismatch}`);
  for (const m of e6.compareVsD2.mismatches) {
    assert.ok(m.name.includes("w2560") || m.name.includes("w2880"), `${m.name}: mismatch phải ở rect upscale`);
  }
});
