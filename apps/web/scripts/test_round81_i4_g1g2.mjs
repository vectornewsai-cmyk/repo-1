#!/usr/bin/env node
/**
 * test_round81_i4_g1g2.mjs — Phase 9 đợt 81, luồng I4: test cho đường đo
 * KHÔNG làm tròn (delta0-harness.mjs *Raw) + điểm luật / case phân biệt.
 *
 * Đọc JSON sweep không-làm-tròn (r81i4-unrounded-sweep.json) — KHÔNG tính
 * lại eval trong test (eval ~20 s/case; sweep đã tính). Các test logic
 * cổng dùng vector synthetic (ghi rõ) — chỉ kiểm tra logic, không phải
 * số đo.
 * Chạy: node --test apps/web/scripts/test_round81_i4_g1g2.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  channelStats, channelStatsRaw, applyDelta0G12Raw, applyDelta0G1Raw,
  applyDelta0G2Raw, scoreRule,
} from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const I4 = path.join(GOAL, "round81-i4");
const SWEEP = path.join(I4, "r81i4-unrounded-sweep.json");
const H4 = path.join(GOAL, "round80-h4");

function loadSweep() {
  return JSON.parse(fs.readFileSync(SWEEP, "utf8"));
}
function loadH4Unrounded() {
  const map = new Map();
  for (const f of ["r80h4-threshold-unrounded.json", "r80h4-threshold-unrounded-034.json", "r80h4-threshold-unrounded-034b.json", "r80h4-threshold-unrounded-034c.json"]) {
    const j = JSON.parse(fs.readFileSync(path.join(H4, f), "utf8"));
    for (const r of j.results || []) map.set(r.name, r);
  }
  return map;
}

test("channelStatsRaw: làm tròn lại phải bằng channelStats (mảng synthetic nhỏ)", () => {
  // Mảng delta synthetic (KHÔNG phải số đo): chỉ kiểm tra hai hàm thống
  // kê nhất quán với nhau.
  const d = new Float64Array(300);
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5; };
  for (let i = 0; i < d.length; i++) d[i] = Math.round(rnd() * 40);
  const raw = channelStatsRaw(d);
  const rndSt = channelStats(d);
  for (let c = 0; c < 3; c++) {
    assert.ok(Math.abs(+raw.std[c].toFixed(2) - rndSt.std[c]) < 1e-9, `std kênh ${c}: raw làm tròn phải bằng rounded`);
    assert.ok(Math.abs(+raw.kurt[c].toFixed(2) - rndSt.kurt[c]) < 1e-9, `kurt kênh ${c}: raw làm tròn phải bằng rounded`);
  }
  for (let c = 0; c < 3; c++) {
    assert.ok(Math.abs(+raw.corr[c].toFixed(3) - rndSt.corr[c]) < 1e-9, `corr ${c}: raw làm tròn phải bằng rounded`);
  }
});

test("cổng raw trên vector synthetic: biên 2,0 / 1,0 bao gồm giá trị bằng, loại giá trị vượt", () => {
  // Vector synthetic — chỉ kiểm tra logic cổng, không phải số đo.
  const atEdge = { plainMad: 2.5, d0std: [2.0, 0.5, 0.5], residStd: [2.0, 1.0, 1.0] };
  assert.equal(applyDelta0G12Raw(atEdge).apply, true, "đúng biên (2,5/2,0/1,0) phải áp");
  assert.equal(applyDelta0G1Raw({ plainMad: 2.5, d0std: [2.0, 0.5, 0.5], residStd: [0.1, 1, 1] }).apply, true);
  assert.equal(applyDelta0G2Raw({ plainMad: 2.5, d0std: [99, 0.5, 0.5], residStd: [99, 1, 1] }).apply, true, "ratio đúng 1,0 phải áp dù d0std lớn (G2 chỉ xét ratio)");
  const over = { plainMad: 2.5, d0std: [2.0001, 0.5, 0.5], residStd: [2.0, 1.0, 1.0] };
  assert.equal(applyDelta0G12Raw(over).apply, false, "d0std_R vượt 2,0 dù chỉ 0,0001 phải từ chối");
  const ratioOver = { plainMad: 2.5, d0std: [1.0001, 0.5, 0.5], residStd: [1.0, 1.0, 1.0] };
  assert.equal(applyDelta0G2Raw(ratioOver).apply, false, "ratio_R vượt 1,0 dù chỉ 0,0001 phải từ chối");
});

test("sweep không-làm-tròn: 75 case (2 case a65 mất snapshot từ đợt 80 — xem LIMITS)", () => {
  const s = loadSweep();
  assert.equal(s.totalCases, 75, "sweep I4 tính được 75/77 case (a65 mất snapshot)");
  assert.equal(s.cases.length, 75);
  assert.equal(s.gradFramesIdentical, true, "frame gradient1920 build lại phải byte-identical với D2");
  for (const c of s.cases) assert.equal(c.arithmetic, "unrounded", `${c.name} phải là số không-làm-tròn`);
});

test("cross-check: loader tái lập số làm tròn (plainMad ±0,001, gates khớp) + khớp H4", () => {
  const s = loadSweep();
  for (const x of s.crossChecks) {
    assert.ok(x.plainMadDiff !== undefined && Math.abs(x.plainMadDiff) <= 0.001, `${x.name}: plainMad raw vs rounded lệch ${x.plainMadDiff}`);
    assert.equal(x.gatesMatch, true, `${x.name}: gates raw phải khớp gates làm tròn`);
    if (x.h4Match !== undefined) assert.equal(x.h4Match, true, `${x.name}: maxKurt raw phải khớp H4 (±0,0001)`);
  }
});

test("case phân biệt G1/G2 duy nhất (số không-làm-tròn): F7-sweep-w2240-testpattern-n10", () => {
  const s = loadSweep();
  const c = s.cases.find((x) => x.name === "F7-sweep-w2240-testpattern-n10");
  assert.ok(c, "phải có case F7-sweep-w2240-testpattern-n10 trong sweep");
  assert.ok(Math.abs(Math.max(...c.kurtDiffFullD0) - 0.3508) <= 0.0001, `fullD0 maxKurt raw phải 0,3508, được ${Math.max(...c.kurtDiffFullD0)}`);
  assert.ok(Math.abs(Math.max(...c.kurtDiffNoD0) - 0.3355) <= 0.0001, `noD0 maxKurt raw phải 0,3355, được ${Math.max(...c.kurtDiffNoD0)}`);
  assert.equal(c.verdictFullD0, "LỆCH-THỐNG-KÊ", "fullD0 phải LỆCH ở số không-làm-tròn");
  assert.equal(c.verdictNoD0, "KHỚP-THỐNG-KÊ", "noD0 phải KHỚP");
  assert.equal(c.verdictUnder.G1_d0stdR_le_2, "LỆCH-THỐNG-KÊ", "G1 áp d0 → LỆCH (sai)");
  assert.equal(c.verdictUnder.G2_ratioR_le_1, "KHỚP-THỐNG-KÊ", "G2 từ chối d0 → KHỚP (đúng)");
  assert.equal(c.correct, "KHÔNG-d0");
  assert.deepEqual(s.discriminating.g1g2, ["F7-sweep-w2240-testpattern-n10"], "chỉ 1 case phân biệt G1/G2");
});

test("G2 vs G12: vẫn chưa phân biệt được (số không-làm-tròn); G1 vs G12 phân biệt ở đúng 1 case", () => {
  const s = loadSweep();
  assert.deepEqual(s.discriminating.g2g12, [], "không case nào phân biệt G2 vs G12");
  // G1 vs G12 phân biệt ở đúng case F7-w2240-tp-n10 (G1 áp d0 sai,
  // G12 từ chối đúng) — kỳ vọng ban đầu viết [] là SAI, sửa theo số đo.
  assert.deepEqual(s.discriminating.g1g12, ["F7-sweep-w2240-testpattern-n10"], "G1 vs G12 phân biệt ở đúng 1 case");
});

test("2 case sát ngưỡng corr (0,121): verdict không-d0 vẫn LỆCH ở số không-làm-tròn", () => {
  const s = loadSweep();
  for (const name of ["Y2-w1440-test-pattern-noise10", "Y2-w1920-test-pattern-noise05"]) {
    const c = s.cases.find((x) => x.name === name);
    assert.ok(c, `phải có case ${name}`);
    assert.equal(c.verdictNoD0, "LỆCH-THỐNG-KÊ", `${name}: noD0 phải vẫn LỆCH (corrDiff raw > 0,12)`);
    assert.equal(c.correct, "CÓ-d0", `${name}: correct vẫn CÓ-d0`);
    assert.ok(Math.max(...c.corrDiffNoD0) > 0.12, `${name}: maxCorrDiff raw phải > 0,12, được ${Math.max(...c.corrDiffNoD0)}`);
  }
});

test("điểm luật số không-làm-tròn ở 0,35 (75 case, 2 case a65 vắng)", () => {
  const s = loadSweep();
  // Điểm kỳ vọng = điểm làm tròn H4 (69/71 G1, 70/71 G2/G12) TRỪ đi
  // phần của 2 case a65 (cả hai đều đúng ở cả hai số học) → mẫu 69 case
  // chấm được: G1 67/69, G2 68/69, G12 68/69, R0 61/69.
  assert.equal(s.scores.R0_cu.ok, 61, `R0 raw phải 61/69, được ${s.scores.R0_cu.ok}/${s.scores.R0_cu.total}`);
  assert.equal(s.scores.G1_d0stdR_le_2.ok, 67, `G1 raw phải 67/69, được ${s.scores.G1_d0stdR_le_2.ok}/${s.scores.G1_d0stdR_le_2.total}`);
  assert.equal(s.scores.G2_ratioR_le_1.ok, 68, `G2 raw phải 68/69, được ${s.scores.G2_ratioR_le_1.ok}/${s.scores.G2_ratioR_le_1.total}`);
  assert.equal(s.scores.G12_ca_hai.ok, 68, `G12 raw phải 68/69, được ${s.scores.G12_ca_hai.ok}/${s.scores.G12_ca_hai.total}`);
  assert.deepEqual(s.scores.G1_d0stdR_le_2.badList, ["F7-sweep-w2240-testpattern-n10 (muốn KHỚP-THỐNG-KÊ, được LỆCH-THỐNG-KÊ)", "G6-sweep-w2048-testpattern-n10 (muốn KHỚP-THỐNG-KÊ, được LỆCH-THỐNG-KÊ)"]);
});

test("stdRatio không-làm-tròn: mọi mode KHỚP đều cách biên 0,85/1,18 ≥ 0,05; không mode nào LỆCH chỉ do stdRatio", () => {
  const s = loadSweep();
  // Kỳ vọng ban đầu kiểm tra MỌI mode (kể cả mode LỆCH) là SAI: mode LỆCH
  // được phép có stdRatio ngoài biên (vd. Y2-w1440-ocean-noise05 noD0
  // stdRatio G = 1,1959, cả-hai-LỆCH). Chỉ mode KHỚP mới cần cách biên
  // đủ xa để kết luận "không lật qua stdRatio" là vững. Số đo thật:
  // margin nhỏ nhất trong các mode KHỚP là 0,0828 (G6-w2400-tp-n10
  // noD0, stdRatio R 0,9328) — gấp ~40 lần sai số làm tròn (~0,002).
  let minMargin = Infinity, worstCase = "";
  let stdOnlyLech = 0;
  for (const c of s.cases) {
    for (const [mode, k] of [["NoD0", "stdRatioNoD0"], ["FullD0", "stdRatioFullD0"]]) {
      if (c[`verdict${mode}`] === "KHỚP-THỐNG-KÊ") {
        for (const r of c[k]) {
          const m = Math.min(r - 0.85, 1.18 - r);
          if (m < minMargin) { minMargin = m; worstCase = `${c.name} ${mode} ${r.toFixed(4)}`; }
        }
      } else if (Math.max(...c[`kurtDiff${mode}`]) <= 0.35 && Math.max(...c[`corrDiff${mode}`]) <= 0.12) {
        stdOnlyLech++;
      }
    }
  }
  assert.ok(minMargin >= 0.05, `margin stdRatio nhỏ nhất trong mode KHỚP phải ≥ 0,05, được ${minMargin.toFixed(4)} ở ${worstCase}`);
  assert.equal(stdOnlyLech, 0, "không mode nào LỆCH chỉ do stdRatio (kurt+corr đều qua)");
});
