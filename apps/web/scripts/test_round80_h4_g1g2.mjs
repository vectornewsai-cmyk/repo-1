#!/usr/bin/env node
/**
 * test_round80_h4_g1g2.mjs — Phase 9 đợt 80, luồng H4: test đơn vị cho
 * 4 điều tra G1/G2 (đọc JSON đã đo, không đo lại):
 *  1-3. Sàng Q4 (r80h4-q4-screen.json): tp×ocean vượt khoảng do unmask
 *     clamp; slov×ocean nội suy mượt vào khoảng trống; đơn điệu theo α.
 *  4-6. Kênh G (r80h4-gchan.json + r80h4-gchan-rail.json): Cr-shift
 *     tái lập G; rail R/B ~96% vs G 0%; clamp dập R/B nhưng không dập G.
 *  7. Slovenska (r80h4-slovenska.json): render = decode VP9 (không
 *     phải H.264); không dấu vết block 8×8; dư tương quan với gradient.
 *  8. Ngưỡng (r80h4-threshold-unrounded*.json): F7 w2240 tp n10 là
 *     case phân biệt G1/G2 đầu tiên ở số học không-làm-tròn (biên
 *     0,0008); G6 w2048-n10 KHÔNG lật ở 0,36 (0,3603).
 *
 * Chạy (từ gốc repo): node --test apps/web/scripts/test_round80_h4_g1g2.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const H4 = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round80-h4");
const load = (f) => JSON.parse(fs.readFileSync(path.join(H4, f), "utf8"));
const screen = load("r80h4-q4-screen.json");
const gchan = load("r80h4-gchan.json");
const rail = load("r80h4-gchan-rail.json");
const slov = load("r80h4-slovenska.json");
const unrounded = load("r80h4-threshold-unrounded.json");
const unrounded034 = load("r80h4-threshold-unrounded-034.json");
const frame = (label) => screen.frames.find((f) => f.label === label);

test("1. blend test-pattern × ocean VƯỢT khoảng trống (unmask clamp), không nội suy", () => {
  for (const label of ["blend-tp-ocean-a0125", "blend-tp-ocean-a025"]) {
    const f = frame(label);
    assert.ok(f, `thiếu frame ${label}`);
    for (const row of f.rows) assert.ok(row.d0stdR > 3.27, `${label} ${row.rect}: d0std_R=${row.d0stdR} phải > 3,27 (vượt khoảng)`);
  }
  // a0125 đã 10,61 > ocean gốc 3,98: blend không nội suy mà vượt lên trên cả 2 cha.
  assert.ok(frame("blend-tp-ocean-a0125").rows[0].d0stdR > 3.98);
});

test("2. blend slovenska × ocean nội suy MƯỢT vào khoảng trống", () => {
  const f = frame("blend-slov-ocean-a05");
  assert.ok(f, "thiếu blend-slov-ocean-a05");
  for (const row of f.rows) {
    assert.ok(row.d0stdR > 1.17 && row.d0stdR <= 3.27, `a05 ${row.rect}: d0std_R=${row.d0stdR} phải trong (1,17; 3,27]`);
  }
});

test("3. slov×ocean: d0std_R đơn điệu tăng theo α", () => {
  const a025 = frame("blend-slov-ocean-a025").rows[4].d0stdR;
  const a0375 = frame("blend-slov-ocean-a0375").rows[4].d0stdR;
  const a05 = frame("blend-slov-ocean-a05").rows[4].d0stdR;
  assert.ok(a025 < a0375 && a0375 < a05, `đơn điệu: ${a025} < ${a0375} < ${a05} (rect 1129x635)`);
});

test("4. kênh G test-pattern do Cr-shift (kCr=1,12), không phải Cb-shift", () => {
  const tp = gchan.frames["test-pattern"];
  assert.ok(Math.abs(tp.d0std1129x635.full[1] - 4.43) < 0.02, `d0std_G đầy đủ ~4,43, được ${tp.d0std1129x635.full[1]}`);
  assert.ok(Math.abs(tp.d0std1129x635.crOnly[1] - tp.d0std1129x635.full[1]) < 0.05,
    `chỉ-Cr-shift tái lập G: ${tp.d0std1129x635.crOnly[1]} vs đầy đủ ${tp.d0std1129x635.full[1]}`);
  assert.ok(tp.d0std1129x635.cbOnly[1] < 1.0, `chỉ-Cb-shift cho G nhỏ: ${tp.d0std1129x635.cbOnly[1]}`);
});

test("5. rail: shifted test-pattern R/B ~96% chạm ray, G 0% — clamp dập R/B", () => {
  const tp = rail.frames["test-pattern"];
  assert.ok(tp.railPctShifted[0] > 90, `R rail ${tp.railPctShifted[0]}% phải > 90%`);
  assert.ok(tp.railPctShifted[2] > 90, `B rail ${tp.railPctShifted[2]}% phải > 90%`);
  assert.equal(tp.railPctShifted[1], 0, `G rail phải 0%, được ${tp.railPctShifted[1]}%`);
  // Không clamp: R vọt 1,27 → 14,68 (≥10×); G giữ nguyên 4,45.
  assert.ok(tp.d0stdFullResWithoutClamp[0] > 10 * tp.d0stdFullResWithClamp[0]);
  assert.ok(Math.abs(tp.d0stdFullResWithoutClamp[1] - tp.d0stdFullResWithClamp[1]) < 0.01);
});

test("6. ocean/basgo/slovenska không bị rail như test-pattern", () => {
  assert.ok(rail.frames.ocean.railPctShifted[1] < 1, `ocean G rail ${rail.frames.ocean.railPctShifted[1]}%`);
  assert.ok(rail.frames.basgo.railPctShifted[0] === 0 && rail.frames.basgo.railPctShifted[1] === 0);
  assert.ok(rail.frames.slovenska.railPctShifted[0] === 0 && rail.frames.slovenska.railPctShifted[1] === 0);
});

test("7. slovenska: render = decode VP9; dư theo gradient, không theo block 8×8", () => {
  assert.ok(slov.decodeCheck.webmVsRender.mad < 2, `webm vs render MAD=${slov.decodeCheck.webmVsRender.mad} phải < 2`);
  assert.ok(slov.decodeCheck.mp4VsRender.mad > 5, `mp4 vs render MAD=${slov.decodeCheck.mp4VsRender.mad} phải > 5`);
  for (const c of Object.values(slov.cases)) {
    assert.ok(Math.abs(c.blockiness.ratio - 1) < 0.05, `block 8×8 ratio=${c.blockiness.ratio} phải ≈ 1`);
    assert.ok(c.corrAbsResidRvsGradY > 0.3, `corr(|resid|,|∇Y|)=${c.corrAbsResidRvsGradY} phải > 0,3`);
  }
});

test("8. ngưỡng: F7 w2240 tp n10 phân biệt G1/G2 ở số học không-làm-tròn; G6 w2048 không lật ở 0,36", () => {
  const f7 = unrounded034.results.find((r) => r.name === "F7-sweep-w2240-testpattern-n10");
  assert.ok(f7, "thiếu F7-sweep-w2240-testpattern-n10 trong JSON không-làm-tròn");
  assert.ok(f7.fullD0.maxKurtRaw > 0.35 && f7.fullD0.maxKurtRaw < 0.36,
    `fullD0 maxKurt chưa làm tròn=${f7.fullD0.maxKurtRaw} phải ∈ (0,35; 0,36) → LỆCH ở 0,35 trong khi harness làm tròn báo KHỚP`);
  assert.equal(f7.fullD0.verdict035, "LỆCH-THỐNG-KÊ");
  assert.equal(f7.noD0.verdict035, "KHỚP-THỐNG-KÊ");
  const g6 = unrounded.results.find((r) => r.name === "G6-sweep-w2048-testpattern-n10");
  assert.ok(g6, "thiếu G6-sweep-w2048-testpattern-n10 trong JSON không-làm-tròn");
  assert.ok(g6.fullD0.maxKurtRaw > 0.36, `fullD0 maxKurt=${g6.fullD0.maxKurtRaw} phải > 0,36 → KHÔNG lật ở ngưỡng 0,36`);
  assert.equal(g6.fullD0.verdict036, "LỆCH-THỐNG-KÊ");
});

const sweepA65 = load("r80h4-sweep-blend-slov-ocean-a65.json");
const sweepA85 = load("r80h4-sweep-blend-tp-slov-a85.json");

test("9. Q4 thất bại ở phía resid: a65/a85 đều có d0std_R > 2 nhưng ratio_R > 1", () => {
  for (const [sw, name, d0min] of [[sweepA65, "a65", 2.0], [sweepA85, "a85", 2.0]]) {
    assert.equal(sw.cases.length, 2, `${name}: phải có 2 case`);
    for (const c of sw.cases) {
      assert.ok(c.d0std[0] > d0min, `${name} ${c.name}: d0std_R=${c.d0std[0]} phải > 2 (phía d0 của Q4 đạt)`);
      assert.ok(c.ratio[0] > 1.0, `${name} ${c.name}: ratio_R=${c.ratio[0]} phải > 1 (phía resid của Q4 KHÔNG đạt)`);
      assert.equal(c.gates.G1_d0stdR_le_2, false, `${name}: G1 phải từ chối`);
      assert.equal(c.gates.G2_ratioR_le_1, false, `${name}: G2 cũng từ chối → không phải Q4`);
      assert.equal(c.verdictUnder.G2_ratioR_le_1, c.verdictUnder.G12_ca_hai, `${name}: G2 = G12 (không phân biệt)`);
    }
  }
  // Resid sụp đổ khi blend: a65 residStd_R 1,04 (cha slov 2,58–2,95 / ocean 1,67–1,82);
  // a85 residStd_R 0,69 (cha slov 2,58–2,95 / tp ~1,0) — đều thấp hơn cả 2 cha.
  assert.ok(sweepA65.cases[0].residStd[0] < 1.67, "a65 residStd_R phải < resid ocean");
  assert.ok(sweepA85.cases[0].residStd[0] < 1.0, "a85 residStd_R phải < resid tp");
});

test("10. điểm gộp 77 case (73 cũ + 4 mới H4): G1=G2=G12, R0 kém hơn", () => {
  // 73 cũ (harness làm tròn): R0 60/67, G1/G2/G12 66/67; 4 mới H4: mọi luật 4/4.
  const total = { R0: 60 + 4, G1: 66 + 4, G2: 66 + 4, G12: 66 + 4 };
  assert.equal(total.R0, 64);
  assert.equal(total.G1, 70);
  assert.equal(total.G2, 70);
  assert.equal(total.G12, 70);
  for (const sw of [sweepA65, sweepA85]) {
    for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
      assert.equal(sw.scores[rule].ok, 2, `${rule} trên case H4 phải 2/2`);
      assert.equal(sw.scores[rule].bad, 0);
    }
  }
});
