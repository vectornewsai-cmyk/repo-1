#!/usr/bin/env node
/**
 * test_round77_e6_g12.mjs — Phase 9 đợt 77, luồng E6: test đơn vị cho
 * luật delta0 G12 trong delta0-harness.mjs (harness đo dùng chung).
 *
 * Chạy: node --test apps/web/scripts/test_round77_e6_g12.mjs
 * (từ gốc repo). Không cần capture/headed — test logic cổng G12 trên
 * đặc trưng THẬT của 20 case chấm được đợt 76 D2 (đọc từ
 * r76d2-diag.json + r76d2-postfix.json) + các vector biên TỔNG HỢP
 * (chỉ kiểm tra logic cổng, không phải số đo — ghi rõ là synthetic).
 *
 * Kỳ vọng: G12 đúng 20/20 (17 chẩn đoán + 3 post-fix mới); R0 cũ đúng
 * 18/20 (sai ocean w1440/w1920 post-fix). G1/G2 đồng ý nhau trên cả 20.
 * KHÔNG sửa production. KHÔNG push/tag/binary.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyDelta0G12, applyDelta0G1, applyDelta0G2, applyDelta0R0 } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const D2 = path.join(GOAL, "round76-d2");
const DIAG = JSON.parse(fs.readFileSync(path.join(D2, "r76d2-diag.json"), "utf8"));
const POSTFIX = JSON.parse(fs.readFileSync(path.join(D2, "r76d2-postfix.json"), "utf8"));

/** 20 case chấm được của D2: 17 chẩn đoán + 3 post-fix mới (C1 đã nằm trong 17). */
function d2ScorableCases() {
  const diagScorable = DIAG.cases.filter((c) => c.correct !== "cả-hai-LỆCH");
  const postfixNew = POSTFIX.cases.filter((c) => c.name.startsWith("D2-post-fix"));
  return { diagScorable, postfixNew };
}

/** Verdict "đúng" kỳ vọng của một case D2, theo quy ước D2. */
function wantVerdict(c) {
  if (c.correct === "KHÔNG-d0") return c.verdictNoD0;
  if (c.correct === "CÓ-d0") return c.verdictFullD0;
  return null;
}

test("G12 đúng 20/20 case chấm được của D2 (17 chẩn đoán + 3 post-fix mới)", () => {
  const { diagScorable, postfixNew } = d2ScorableCases();
  assert.equal(diagScorable.length, 17, "D2 chẩn đoán phải có đúng 17 case chấm được");
  assert.equal(postfixNew.length, 3, "D2 post-fix mới phải có đúng 3 case (w1920/w2560/grad1920)");
  const all = [...diagScorable, ...postfixNew];
  assert.equal(all.length, 20);
  const bad = [];
  for (const c of all) {
    // G12 áp d0 khi plainMad<=2,5 && d0std_R<=2,0 && ratio_R<=1,0 — tính từ đặc trưng thật trong JSON D2.
    const g = applyDelta0G12({ plainMad: c.plainMad, d0std: c.d0std, residStd: c.residStd });
    const got = g.apply ? c.verdictFullD0 : c.verdictNoD0;
    if (got !== wantVerdict(c)) bad.push(`${c.name}: G12=${g.apply} cho ${got}, muốn ${wantVerdict(c)}`);
  }
  assert.deepEqual(bad, [], `G12 phải đúng 20/20, sai: ${bad.join("; ")}`);
});

test("R0 cũ đúng 18/20 — sai đúng 2 case đích ocean w1440/w1920 post-fix", () => {
  const { diagScorable, postfixNew } = d2ScorableCases();
  const all = [...diagScorable, ...postfixNew];
  const bad = [];
  for (const c of all) {
    const r = applyDelta0R0({ plainMad: c.plainMad, d0std: c.d0std, residStd: c.residStd });
    const got = r.apply ? c.verdictFullD0 : c.verdictNoD0;
    if (got !== wantVerdict(c)) bad.push(c.name);
  }
  assert.equal(bad.length, 2, `R0 phải sai đúng 2 case, thực tế sai ${bad.length}: ${bad.join(", ")}`);
  assert.ok(bad.some((n) => n.includes("C1-post-fix-w1440")), "R0 phải sai C1 ocean w1440 post-fix");
  assert.ok(bad.some((n) => n.includes("w1920-ocean")), "R0 phải sai ocean w1920 post-fix");
});

test("G1 và G2 đồng ý nhau trên cả 20 case D2 (nợ D2 §6.1 — chưa phân biệt được)", () => {
  const { diagScorable, postfixNew } = d2ScorableCases();
  const all = [...diagScorable, ...postfixNew];
  const disagree = [];
  for (const c of all) {
    const f = { plainMad: c.plainMad, d0std: c.d0std, residStd: c.residStd };
    if (applyDelta0G1(f).apply !== applyDelta0G2(f).apply) disagree.push(c.name);
  }
  assert.deepEqual(disagree, [], `G1/G2 phải đồng ý trên cả 20 case, bất đồng: ${disagree.join(", ")}`);
});

test("biên cổng G12: ngưỡng bao gồm đúng giá trị bằng (<=), loại giá trị vượt", () => {
  // Vector synthetic — CHỈ kiểm tra logic cổng, không phải số đo.
  const base = { plainMad: 1.0, d0std: [1.0, 1.0, 1.0], residStd: [2.0, 2.0, 2.0] };
  assert.equal(applyDelta0G12(base).apply, true, "trong ngưỡng -> áp d0");
  assert.equal(applyDelta0G12({ ...base, plainMad: 2.5 }).apply, true, "plainMad đúng 2,5 -> áp (<=)");
  assert.equal(applyDelta0G12({ ...base, plainMad: 2.51 }).apply, false, "plainMad 2,51 -> không áp");
  assert.equal(applyDelta0G12({ ...base, d0std: [2.0, 1.0, 1.0] }).apply, true, "d0std_R đúng 2,0 -> áp (<=)");
  assert.equal(applyDelta0G12({ ...base, d0std: [2.01, 1.0, 1.0] }).apply, false, "d0std_R 2,01 -> không áp");
  assert.equal(applyDelta0G12({ ...base, d0std: [2.0, 1.0, 1.0], residStd: [2.0, 2.0, 2.0] }).ratioR, 1.0);
  assert.equal(applyDelta0G12({ ...base, d0std: [2.0, 1.0, 1.0], residStd: [2.0, 2.0, 2.0] }).apply, true, "ratio_R đúng 1,0 -> áp (<=)");
  assert.equal(applyDelta0G12({ ...base, d0std: [2.0, 1.0, 1.0], residStd: [1.99, 2.0, 2.0] }).apply, false, "ratio_R ~1,01 -> không áp");
});

test("G1/G2 bất đồng trên vector synthetic — G12 (hội) từ chối cả hai hướng", () => {
  // Vector synthetic — CHỈ kiểm tra logic cổng, không phải số đo.
  // Hướng A: d0std_R nhỏ nhưng phần dư R còn nhỏ hơn (ratio_R > 1) — G1 đồng ý, G2 từ chối.
  const dirA = { plainMad: 1.0, d0std: [1.5, 1.0, 1.0], residStd: [0.7, 2.0, 2.0] };
  assert.equal(applyDelta0G1(dirA).apply, true);
  assert.equal(applyDelta0G2(dirA).apply, false);
  assert.equal(applyDelta0G12(dirA).apply, false, "G12 hội bảo thủ: từ chối khi G2 từ chối");
  // Hướng B: d0std_R lớn tuyệt đối nhưng ratio_R nhỏ (phần dư R lớn) — G2 đồng ý, G1 từ chối.
  const dirB = { plainMad: 1.0, d0std: [3.0, 1.0, 1.0], residStd: [4.0, 2.0, 2.0] };
  assert.equal(applyDelta0G1(dirB).apply, false);
  assert.equal(applyDelta0G2(dirB).apply, true);
  assert.equal(applyDelta0G12(dirB).apply, false, "G12 hội bảo thủ: từ chối khi G1 từ chối");
});

test("case đích D2: ocean w1440/w1920 post-fix — R0 áp sai, G12 không áp", () => {
  const c1 = POSTFIX.cases.find((c) => c.name === "C1-post-fix-w1440-ocean-n05");
  const w1920 = POSTFIX.cases.find((c) => c.name === "D2-post-fix-w1920-ocean-n05");
  for (const c of [c1, w1920]) {
    const f = { plainMad: c.plainMad, d0std: c.d0std, residStd: c.residStd };
    assert.equal(applyDelta0R0(f).apply, true, `${c.name}: R0 áp d0 (sai)`);
    assert.equal(applyDelta0G12(f).apply, false, `${c.name}: G12 không áp d0 (đúng)`);
    assert.equal(c.verdictNoD0, "KHỚP-THỐNG-KÊ", `${c.name}: không-d0 KHỚP`);
    assert.equal(c.verdictFullD0, "LỆCH-THỐNG-KÊ", `${c.name}: có-d0 LỆCH`);
  }
});

test("case giữ d0: test-pattern n05 w1440/w1920 — G12 vẫn áp d0, verdict KHỚP giữ nguyên", () => {
  const tps = DIAG.cases.filter((c) => c.name.includes("test-pattern-noise05"));
  assert.equal(tps.length, 2);
  for (const c of tps) {
    const f = { plainMad: c.plainMad, d0std: c.d0std, residStd: c.residStd };
    assert.equal(applyDelta0G12(f).apply, true, `${c.name}: G12 áp d0`);
    assert.equal(c.verdictFullD0, "KHỚP-THỐNG-KÊ", `${c.name}: có-d0 KHỚP`);
  }
});
