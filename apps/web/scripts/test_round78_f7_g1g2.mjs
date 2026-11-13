#!/usr/bin/env node
/**
 * test_round78_f7_g1g2.mjs — Phase 9 đợt 78, luồng F7: test đơn vị
 * node:test cho kết quả đo post-fix + săn G1/G2 (đọc JSON đo thật do
 * r78f7-postfix.mjs và r78f7-g1g2-screen.mjs ghi; KHÔNG tự sinh số đo).
 *
 * Chạy (từ gốc repo, sau khi chạy r78f7-postfix.mjs):
 *   node --test apps/web/scripts/test_round78_f7_g1g2.mjs
 * KHÔNG push/tag/binary. Không sửa code production.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyDelta0G1, applyDelta0G2, applyDelta0G12, scoreRule } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const F7 = path.join(GOAL, "round78-f7");
const E6 = path.join(GOAL, "round77-e6");
const postfix = JSON.parse(fs.readFileSync(path.join(F7, "r78f7-postfix.json"), "utf8"));
const screen = JSON.parse(fs.readFileSync(path.join(F7, "r78f7-screen.json"), "utf8"));
const g12old = JSON.parse(fs.readFileSync(path.join(E6, "r77e6-g12.json"), "utf8"));
const cases = postfix.cases;

test("G12 đúng trên mọi case mới F7 chấm được", () => {
  const s = scoreRule(cases, "G12_ca_hai");
  assert.equal(s.bad, 0, `G12 sai: ${s.badList.join("; ")}`);
  assert.ok(s.total > 0, "không có case mới nào chấm được");
});

test("cổng G1/G2/G12 lưu trong JSON khớp luật tính lại từ đặc trưng", () => {
  for (const c of cases) {
    const f = { plainMad: c.plainMad, d0std: c.d0std, residStd: c.residStd };
    assert.equal(applyDelta0G1(f).apply, c.gates.G1_d0stdR_le_2, `${c.name}: G1`);
    assert.equal(applyDelta0G2(f).apply, c.gates.G2_ratioR_le_1, `${c.name}: G2`);
    assert.equal(applyDelta0G12(f).apply, c.gates.G12_ca_hai, `${c.name}: G12`);
  }
});

test("basgo/slovenska post-fix d0std_R nhỏ, ocean post-fix d0std_R lớn; basgo rơi vào Q3", () => {
  for (const c of cases) {
    if (c.source === "basgo" || c.source === "slovenska") {
      assert.ok(c.d0stdR <= 1.0, `${c.name}: d0std_R=${c.d0stdR} (kỳ vọng ≤ 1,0)`);
    }
    if (c.source === "slovenska") {
      // slovenska: ratio_R ~0,06–0,07 → cả hai cổng áp, G12 áp.
      assert.ok(c.gates.G12_ca_hai, `${c.name}: G12 phải áp d0`);
    }
    if (c.source === "basgo") {
      // basgo post-fix rơi vào Q3: d0std_R ≤ 2 (G1 áp) nhưng
      // ratio_R 1,14–1,24 > 1 (G2 từ chối) → G12 từ chối.
      assert.ok(c.gates.G1_d0stdR_le_2, `${c.name}: G1 phải áp d0`);
      assert.ok(!c.gates.G2_ratioR_le_1, `${c.name}: G2 phải từ chối d0`);
      assert.ok(!c.gates.G12_ca_hai, `${c.name}: G12 phải từ chối d0`);
    }
    if (c.source === "ocean") {
      assert.ok(c.d0stdR >= 3.8, `${c.name}: d0std_R=${c.d0stdR} (kỳ vọng ≥ 3,8)`);
      assert.ok(!c.gates.G12_ca_hai, `${c.name}: G12 phải từ chối d0`);
    }
  }
});

test("số case G1/G2 bất đồng khớp đếm lại + có ít nhất một case bất đồng phân biệt được ở mức verdict", () => {
  const disagree = cases.filter((c) => c.gates.G1_d0stdR_le_2 !== c.gates.G2_ratioR_le_1);
  const recorded = postfix.g1g2Disagree || [];
  assert.equal(disagree.length, recorded.length, `đếm bất đồng ${disagree.length} ≠ JSON ghi ${recorded.length}`);
  // Hầu hết case bất đồng chỉ khác ở mức cổng (verdict giống nhau) — đó
  // là kết quả đo thật, không phải lỗi. Chỉ yêu cầu: CÓ ít nhất một
  // case bất đồng phân biệt được ở mức verdict, và mọi case phân biệt
  // được đều chỉ cùng một cổng đúng (nhất quán, không mâu thuẫn).
  const discriminating = [];
  for (const c of disagree) {
    const want = c.correct === "KHÔNG-d0" ? c.verdictNoD0 : (c.correct === "CÓ-d0" ? c.verdictFullD0 : null);
    if (want === null) continue; // cả-hai-LỆCH: không chấm được, bỏ qua
    const v1 = c.verdictUnder.G1_d0stdR_le_2, v2 = c.verdictUnder.G2_ratioR_le_1;
    if (v1 === v2) continue; // cổng khác nhau nhưng verdict giống nhau: không phân biệt được
    assert.ok((v1 === want) !== (v2 === want), `${c.name}: phải đúng một cổng cho verdict đúng`);
    discriminating.push({ name: c.name, rightGate: v1 === want ? "G1" : "G2" });
  }
  assert.ok(discriminating.length > 0, "không có case bất đồng nào phân biệt được G1/G2 ở mức verdict");
  const rights = new Set(discriminating.map((d) => d.rightGate));
  assert.equal(rights.size, 1, `các case phân biệt mâu thuẫn nhau: ${JSON.stringify(discriminating)}`);
});

test("d0std_R từ màn sàng lọc khớp số đo eval (cùng nội dung + rect, dung sai 0,01)", () => {
  const byKey = new Map();
  for (const fr of screen.frames) {
    if (fr.buildNote.startsWith("SCREEN-ONLY")) continue; // khung ocean khác build C1 — không đối chiếu
    for (const r of fr.rows) byKey.set(`${fr.label}@${r.rect}`, r.d0stdR);
  }
  const labelOf = { ocean: "ocean-f25", basgo: "basgo-f30", slovenska: "slovenska-f25", "test-pattern": "test-pattern-f30" };
  let checked = 0;
  for (const c of cases) {
    const key = `${labelOf[c.source]}@${c.rect}`;
    if (!byKey.has(key)) continue;
    assert.ok(Math.abs(byKey.get(key) - c.d0stdR) <= 0.01, `${c.name}: screen ${byKey.get(key)} vs eval ${c.d0stdR}`);
    checked++;
  }
  assert.ok(checked > 0, "không đối chiếu được case nào giữa screen và eval");
});

test("mọi capture mới đều D1 plain-identical + D3 cùng-khung", () => {
  for (const c of cases) {
    assert.equal(c.d1PlainIdentical, true, `${c.name}: D1 plain 2 lần phải pixel-identical`);
    assert.equal(c.d3SameFrame, true, `${c.name}: D3 raw hash plain/noise phải khớp (cùng khung)`);
  }
});

test("hồi quy: G12 vẫn đúng 20/20 trên case D2 (r77e6-g12.json)", () => {
  const s = scoreRule(g12old.cases, "G12_ca_hai");
  assert.equal(s.ok, 20, `G12 trên D2: ${s.ok}/20 (sai: ${s.badList.join("; ")})`);
  assert.equal(s.bad, 0);
});
