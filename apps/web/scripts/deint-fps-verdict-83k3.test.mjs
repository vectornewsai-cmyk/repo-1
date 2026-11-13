// deint-fps-verdict-83k3.test.mjs — Phase 9 đợt 83, luồng K3: test hồi quy
// luật verdict median-5 cho FPS deint-only (offline, không cần headed).
// Chạy: node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
// Các bộ số dùng lại từ lịch sử thật (I5/J3) để khóa hành vi luật:
//   - J3 5 lần [0.68, 0.73, 1.13, 0.75, 1.13]: median đúng ngưỡng nhưng
//     chỉ 3/5 PASS → luật (b) CHƯA đạt "PASS ổn định".
//   - I5 5 lần [0.93, 0.75, 0.80, 0.81, 0.94]: 5/5 PASS, median 0.81
//     → luật (b) PASS ổn định.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  THRESHOLD, N_RUNS, MIN_PASS_COUNT, FROZEN_FPS,
  medianOf, meanCI, deintFpsVerdict, g5MeanFromReport,
  g5FrozenSafeFromReport,
} from "./deint-fps-verdict-83k3.mjs";

test("hằng số luật verdict: ngưỡng 0,75, 5 lần, ≥4/5 PASS", () => {
  assert.equal(THRESHOLD, 0.75);
  assert.equal(N_RUNS, 5);
  assert.equal(MIN_PASS_COUNT, 4);
});

test("medianOf: lẻ, chẵn, không đổi mảng gốc", () => {
  assert.equal(medianOf([0.68, 0.73, 1.13, 0.75, 1.13]), 0.75);
  assert.equal(medianOf([1, 3]), 2);
  assert.equal(medianOf([5]), 5);
  const a = [3, 1, 2];
  medianOf(a);
  assert.deepEqual(a, [3, 1, 2]);
  assert.throws(() => medianOf([]), /rỗng/);
});

test("luật (b) trên số J3 thật: median đúng ngưỡng nhưng 3/5 → CHƯA đạt", () => {
  const v = deintFpsVerdict([0.68, 0.73, 1.13, 0.75, 1.13]);
  assert.equal(v.ruleB.median, 0.75);
  assert.equal(v.ruleB.passCount, 3);
  assert.equal(v.ruleB.pass, false);
  assert.equal(v.ruleB.margin, 0);
  // Luật (a) 1 lần trên cùng 5 lần: 3 PASS / 2 FAIL, lật 2/5.
  assert.deepEqual(v.ruleA.passes, [false, false, true, true, true]);
  assert.equal(v.ruleA.flipRate, 0.4);
});

test("luật (b) trên số I5 thật: 5/5 PASS, median 0,81 → PASS ổn định", () => {
  const v = deintFpsVerdict([0.93, 0.75, 0.80, 0.81, 0.94]);
  assert.equal(v.ruleB.median, 0.81);
  assert.equal(v.ruleB.passCount, 5);
  assert.equal(v.ruleB.pass, true);
  assert.ok(v.ruleB.margin > 0);
  assert.equal(v.ruleA.flipRate, 0);
});

test("median cao nhưng chỉ 3/5 PASS vẫn FAIL luật (b)", () => {
  const v = deintFpsVerdict([0.9, 0.9, 0.9, 0.5, 0.5]);
  assert.equal(v.ruleB.median, 0.9);
  assert.equal(v.ruleB.pass, false);
});

test("median đúng ngưỡng và 4/5 PASS → PASS (biên 0, chấp nhận)", () => {
  const v = deintFpsVerdict([0.75, 0.8, 0.75, 0.9, 0.7]);
  assert.equal(v.ruleB.median, 0.75);
  assert.equal(v.ruleB.passCount, 4);
  assert.equal(v.ruleB.pass, true);
  assert.equal(v.ruleB.margin, 0);
});

test("toàn FAIL → cả hai luật FAIL, flipRate 0 (đồng thuận FAIL)", () => {
  const v = deintFpsVerdict([0.5, 0.6, 0.55, 0.7, 0.65]);
  assert.equal(v.ruleB.pass, false);
  assert.equal(v.ruleA.passCount, 0);
  assert.equal(v.ruleA.flipRate, 0);
});

test("ít hơn 5 lần: không kết luận PASS ổn định dù median cao", () => {
  const v = deintFpsVerdict([0.9, 0.9, 0.9]);
  assert.equal(v.ruleB.enoughRuns, false);
  assert.equal(v.ruleB.pass, false);
  assert.equal(v.ruleB.median, 0.9);
});

test("đầu vào sai: rỗng / không phải số / NaN đều throw", () => {
  assert.throws(() => deintFpsVerdict([]), /ít nhất 1/);
  assert.throws(() => deintFpsVerdict([0.9, "x"]), /không hợp lệ/);
  assert.throws(() => deintFpsVerdict([0.9, NaN]), /không hợp lệ/);
});

test("meanCI: n=5 cho CI chứa mean; n=1 không crash", () => {
  const c = meanCI([0.68, 0.73, 1.13, 0.75, 1.13]);
  assert.ok(c.lo < c.mean && c.mean < c.hi, `CI [${c.lo}; ${c.hi}] phải chứa mean ${c.mean}`);
  assert.ok(c.sd > 0);
  const c1 = meanCI([0.9]);
  assert.equal(c1.mean, 0.9);
  assert.equal(c1.lo, 0.9);
});

test("g5MeanFromReport: tỉ lệ drift-corrected đúng công thức harness", () => {
  // 11 slot: baseline 2,4,6,8,10,12 fps; deint 2,3,4,5,6 fps.
  const draw = [2, 2, 4, 3, 6, 4, 8, 5, 10, 6, 12];
  const report = { fpsSlots: draw.map((d) => ({ drawFps: d })) };
  const g = g5MeanFromReport(report);
  // slot1: 2/((2+4)/2)=0,667; slot3: 3/5=0,6; slot5: 4/7≈0,571;
  // slot7: 5/9≈0,556; slot9: 6/11≈0,545 → mean ≈ 0,59.
  assert.deepEqual(g.ratios, [0.67, 0.6, 0.57, 0.56, 0.55]);
  assert.equal(g.mean, 0.59);
  assert.equal(g.baselineMean, 7);
  assert.throws(() => g5MeanFromReport({ fpsSlots: [{ drawFps: 1 }] }), /thiếu fpsSlots/);
});

test("slot đóng băng (đợt 90 R6, Q7 §7.4): draw < 0,5 fps được đếm kèm verdict", () => {
  assert.equal(FROZEN_FPS, 0.5);
  // Số thật N10 combo run2 (đợt 86): slot 1 = 0,00 fps, slot 5 = 0,27 fps
  // (combo đóng băng); slot 8 baseline 0,30 fps cũng < 0,5 → cũng đóng băng.
  const draw = [1.6, 0.0, 3.36, 4.4, 3.77, 0.27, 5.15, 0.63, 0.3, 0.98, 2.45];
  const g = g5MeanFromReport({ fpsSlots: draw.map((d) => ({ drawFps: d })) });
  assert.deepEqual(g.frozenSlots, [1, 5, 8]);
  assert.equal(g.frozenCount, 3);
  // Slot 0,30 fps cũng đóng băng; 0,50 fps đúng ngưỡng thì KHÔNG.
  const g2 = g5MeanFromReport({ fpsSlots: [0.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5].map((d) => ({ drawFps: d })) });
  assert.deepEqual(g2.frozenSlots, [0]);
  assert.equal(g2.frozenCount, 1);
  // Không slot đóng băng → mảng rỗng, không đổi mean.
  const g3 = g5MeanFromReport({ fpsSlots: [2, 2, 4, 3, 6, 4, 8, 5, 10, 6, 12].map((d) => ({ drawFps: d })) });
  assert.deepEqual(g3.frozenSlots, []);
  assert.equal(g3.frozenCount, 0);
  assert.equal(g3.mean, 0.59);
});

// Đợt 96 X6 — metric frozen-safe M2: loại mẫu số đóng băng + median.
test("M2 trên W6 e1-run1 thật: G5 1,82 phồng → M2 1,00 (loại 2 tỉ lệ mẫu số < 0,5)", () => {
  // Số thật W6 (§3.2): slot draw 2,56/1,29/1,06/2,07/2,50/1,25/0/0,64/0,30/0,95/0,66.
  const draw = [2.56, 1.29, 1.06, 2.07, 2.5, 1.25, 0, 0.64, 0.3, 0.95, 0.66];
  const m = g5FrozenSafeFromReport({ fpsSlots: draw.map((d) => ({ drawFps: d })) });
  assert.equal(m.g5, 1.82);
  assert.deepEqual(m.ratios, [0.71, 1.16, 1.0, 4.27, 1.98]);
  assert.deepEqual(m.excluded, [3, 4]);
  assert.equal(m.kept, 3);
  assert.equal(m.valid, true);
  assert.equal(m.m2, 1.0);
  assert.equal(m.m2mean, 0.96);
  assert.equal(m.m2b, 1.05);
  assert.equal(m.m2c, 1.16);
  assert.deepEqual(m.frozenSlots, [6, 8]);
  assert.equal(m.baselineMean, 1.18);
});

test("M2 trên R6 e1-verify-run1 thật: G5 1,58 (tử số đột biến) → M2 0,86, không loại", () => {
  // Số thật R6: slot deint 8,4 fps ở slot 9, mẫu số kề 1,94 fps bình thường.
  const draw = [1.29, 1.55, 1.53, 1.33, 1.62, 1.66, 2.24, 1.94, 2.9, 8.4, 0.97];
  const m = g5FrozenSafeFromReport({ fpsSlots: draw.map((d) => ({ drawFps: d })) });
  assert.equal(m.g5, 1.58);
  assert.deepEqual(m.ratios, [1.1, 0.84, 0.86, 0.75, 4.34]);
  assert.deepEqual(m.excluded, []);
  assert.equal(m.kept, 5);
  assert.equal(m.m2, 0.86);
  // Chỉ loại không sửa được trường hợp này: mean sau loại vẫn 1,58.
  assert.equal(m.m2mean, 1.58);
  // Tỉ lệ thô còn phồng hơn (1,69) — không dùng làm metric chính.
  assert.equal(m.m2b, 1.69);
  assert.equal(m.m2c, 0.86);
});

test("M2 trên X6 e1-run1 thật (máy yên, sạch): M2 ≈ G5, không loại gì", () => {
  const draw = [24.69, 25.56, 21.59, 24.19, 27.12, 27.13, 25.49, 27.78, 24.13, 19.86, 22.13];
  const m = g5FrozenSafeFromReport({ fpsSlots: draw.map((d) => ({ drawFps: d })) });
  assert.equal(m.g5, 1.02);
  assert.deepEqual(m.excluded, []);
  assert.equal(m.m2, 1.03);
  assert.equal(m.m2mean, 1.02);
  assert.equal(m.m2b, 1.03);
  assert.equal(m.baselineMean, 24.19);
  assert.equal(m.valid, true);
});

test("M2 giữ tử số đóng băng: slot deint 0 fps là tín hiệu, không loại", () => {
  // S6 e1-run1 thật: slot 0 baseline 0 fps, slot 1 deint 0 fps.
  const draw = [0, 0, 1.82, 1.5, 3.74, 3.83, 1.91, 1.93, 1.33, 0.94, 1.98];
  const m = g5FrozenSafeFromReport({ fpsSlots: draw.map((d) => ({ drawFps: d })) });
  assert.equal(m.g5, 0.73);
  assert.deepEqual(m.ratios, [0, 0.54, 1.36, 1.19, 0.57]);
  assert.deepEqual(m.excluded, []);
  assert.equal(m.m2, 0.57);
  assert.deepEqual(m.frozenSlots, [0, 1]);
  // Tổng hợp: deint 0 fps kéo median xuống — đúng, không che.
  const syn = g5FrozenSafeFromReport({ fpsSlots: [2, 0, 2, 1, 2, 1, 2, 1, 2, 1, 2].map((d) => ({ drawFps: d })) });
  assert.deepEqual(syn.ratios, [0, 0.5, 0.5, 0.5, 0.5]);
  assert.equal(syn.m2, 0.5);
  assert.equal(syn.valid, true);
});

test("M2 không verdict khi còn < 3 tỉ lệ hợp lệ; ngưỡng loại đúng 0,5", () => {
  // Mọi mẫu số kề đều 0 → không tỉ lệ nào hợp lệ.
  const allFrozen = g5FrozenSafeFromReport({ fpsSlots: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0].map((d) => ({ drawFps: d })) });
  assert.equal(allFrozen.valid, false);
  assert.equal(allFrozen.m2, null);
  assert.equal(allFrozen.m2mean, null);
  assert.equal(allFrozen.kept, 0);
  assert.deepEqual(allFrozen.excluded, [0, 1, 2, 3, 4]);
  // Đúng 3 tỉ lệ hợp lệ → vẫn verdict (median của 3).
  const three = g5FrozenSafeFromReport({ fpsSlots: [2, 2, 2, 2, 2, 2, 0, 1, 0, 1, 0].map((d) => ({ drawFps: d })) });
  assert.equal(three.valid, true);
  assert.equal(three.kept, 3);
  assert.deepEqual(three.excluded, [3, 4]);
  // Mẫu số kề đúng 0,5 fps thì KHÔNG loại (ngưỡng < 0,5).
  const edge = g5FrozenSafeFromReport({ fpsSlots: [0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5].map((d) => ({ drawFps: d })) });
  assert.deepEqual(edge.excluded, []);
  assert.equal(edge.valid, true);
  assert.throws(() => g5FrozenSafeFromReport({ fpsSlots: [{ drawFps: 1 }] }), /thiếu fpsSlots/);
});
