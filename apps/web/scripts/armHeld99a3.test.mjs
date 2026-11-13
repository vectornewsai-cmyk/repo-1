// armHeld99a3.test.mjs — Phase 9 đợt 99, luồng A3: test phân loại §6 ARM-HELD.
// Chạy: node --test apps/web/scripts/armHeld99a3.test.mjs
// Thuần (không DOM, không probe thật): tick tổng hợp + replay số thật e1r/e2r.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ARM_HELD_DRIFT_THRESHOLD_S,
  classifyArmHeld99A3,
  counterfactualDrift99A3,
  counterfactualRateInterval99A3,
  intersectRateIntervals99A3,
} from "./armHeld99a3.mjs";

// Một tick tối thiểu cho classifier: {t, ct, ph, resyncsV, watchCeil, tail}.
const tk = (t, ct, ph, o = {}) => ({
  t, ct, ph,
  resyncsV: o.resyncsV ?? 1,
  restartV: o.restartV ?? 0,
  watchCeil: o.watchCeil ?? null,
  tail: o.tail ?? null,
});
const W = 11506; // watchCeil giả (non-null = watch sống)
const TAIL = { endedAtMs: 10795, advances: 0 };

test("T1 — ca CANCELLED cũ điển hình (due ở tick arm, watch sống 2 tick, không resync) cũng là ARM-HELD", () => {
  const ticks = [
    tk(1000, 1.0, 1.4), // drift 0.4
    tk(1300, 1.0, 1.4), // k: drift 0.4, arm
    tk(1600, 1.0, 1.4, { watchCeil: W }), // ph giữ, ct đóng băng
    tk(1900, 1.0, 1.4, { watchCeil: W }),
    tk(2200, 1.1, 1.4, { watchCeil: W }), // element resume, drift về 0.3
    tk(2500, 1.4, 1.4), // drift 0
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "ARM-HELD");
  assert.equal(r.evidence.oldCancelledDue, true);
  assert.equal(r.evidence.driftCfK1, 0.7);
  assert.equal(r.evidence.driftCfK2, 1.0);
});

test("T2 — replay số thật e1r tick 41 (NOT-DUE cũ, ARM-HELD mới): watch giữ ph 5.5333, ct đóng băng 5.4", () => {
  const ticks = [
    tk(11879, 5.4, 5.5333), // tick 40: drift 0.133, chưa arm
    tk(12104, 5.4, 5.5333, { watchCeil: W }), // k=41: arm, drift 0.133
    tk(12377, 5.4, 5.5333, { watchCeil: W }), // k+1: gap 273ms, ph giữ
    tk(12796, 5.4, 5.5333, { watchCeil: W }), // k+2: gap 419ms, ph giữ
    tk(12904, 5.5333, 5.5333), // k+3: element resume, drift 0, không resync
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "ARM-HELD", JSON.stringify(r));
  assert.equal(r.evidence.oldCancelledDue, false); // điểm mấu chốt: CANCELLED cũ bỏ sót ca này
  assert.ok(Math.abs(r.evidence.driftCfK1 - 0.406) < 0.001, `cf1=${r.evidence.driftCfK1}`);
  assert.ok(Math.abs(r.evidence.driftCfK2 - 0.825) < 0.001, `cf2=${r.evidence.driftCfK2}`);
  // Khoảng tốc độ vẫn đúng: hạ bound ≈ (0.35−0.133)/0.273 = 0.795.
  assert.equal(r.evidence.rateInterval.length, 1);
  assert.ok(Math.abs(r.evidence.rateInterval[0][0] - 0.795) < 0.002, JSON.stringify(r.evidence.rateInterval));
  assert.equal(r.evidence.rateIntervalContainsDesign, true);
});

test("T3 — replay số thật e2r tick 27 (counterfactual chưa due ở k+1: drift cần 3 tick mới đủ 2 lần xác nhận) → không đếm", () => {
  const ticks = [
    tk(1000, 2.0, 2.0),
    tk(1210, 2.0, 2.0, { watchCeil: W }), // k: arm, drift 0
    tk(1420, 2.0, 2.0, { watchCeil: W }), // k+1: gap 210ms → cf 0.21 < 0.35
    tk(1635, 2.0, 2.0, { watchCeil: W }), // k+2: cf 0.425 > 0.35 nhưng k+1 đã reset overCount
    tk(1850, 2.1, 2.1),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD");
  assert.equal(r.reason, "phản-thực-không-due-2-tick-liên-tiếp");
});

test("T4 — DELAYED (b1/b2): drift due ở tick arm nhưng watch chết ngay, resync bắn ở +2 tick → không đếm", () => {
  const ticks = [
    tk(1000, 1.0, 2.033), // drift 1.033
    tk(1300, 1.0, 2.033, { watchCeil: W }), // k: arm, drift 1.033 (due)
    tk(1600, 2.033, 2.033), // k+1: element burst bắt kịp ph, watch hết
    tk(1900, 2.033, 2.033, { resyncsV: 2 }), // k+2: resync bắn
    tk(2200, 2.033, 2.033, { resyncsV: 2 }),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD");
  assert.equal(r.evidence.oldCancelledDue, true);
});

test("T5 — tail sống ở tick arm (e1r tick 23): công quy cho §4, §6 không đếm trùng", () => {
  const ticks = [
    tk(1000, 1.0, 0.833), // drift −0.167
    tk(1300, 2.0, 0.874, { watchCeil: W, tail: TAIL }), // k: arm đúng tick element burst, tail sống
    tk(1600, 2.0, 1.0, { tail: TAIL }),
    tk(1900, 2.0, 1.0, { tail: TAIL }),
    tk(2200, 2.0, 2.0),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD");
  assert.equal(r.reason, "tail-sống-ở-tick-arm-quy-cho-§4");
});

test("T6 — watch chết sau 1 tick (c1): element resume ngay, arm không giữ được gì → không đếm", () => {
  const ticks = [
    tk(1000, 1.0, 1.1),
    tk(1300, 1.784, 1.1, { watchCeil: W }), // k: arm, drift −0.684 (burst)
    tk(1600, 1.8, 1.367), // k+1: watch đã hết (không watchCeil)
    tk(1900, 1.8, 1.25),
    tk(2200, 1.8, 1.8),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD");
  assert.equal(r.reason, "watch-không-sống-đủ-2-tick-sau-arm");
});

test("T7 — arm-vì-bò: ct bò +1 frame/tick 500 ms (0,066×), watch sống, phản-thực due → đếm (không đòi ct đóng băng hẳn)", () => {
  const ticks = [
    tk(1000, 1.0, 1.2), // drift 0.2
    tk(1500, 1.0, 1.2, { watchCeil: W }), // k: arm, drift 0.2
    tk(2000, 1.0333, 1.2, { watchCeil: W }), // k+1: bò +0.033, ph giữ
    tk(2500, 1.0666, 1.2, { watchCeil: W }), // k+2: bò tiếp
    tk(3000, 1.5, 1.5), // k+3: burst, drift 0
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "ARM-HELD", JSON.stringify(r));
  assert.ok(Math.abs(r.evidence.driftCfK1 - 0.667) < 0.002, `cf1=${r.evidence.driftCfK1}`);
  assert.ok(Math.abs(r.evidence.driftCfK2 - 1.133) < 0.002, `cf2=${r.evidence.driftCfK2}`);
});

test("T8 — arm ở cuối trace (thiếu tick k+3) → INCONCLUSIVE, không đếm, không đoán", () => {
  const ticks = [
    tk(1000, 1.0, 1.2),
    tk(1300, 1.0, 1.2, { watchCeil: W }),
    tk(1600, 1.0, 1.2, { watchCeil: W }),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "INCONCLUSIVE");
  assert.equal(r.reason, "thiếu-tick-k+3-để-kiểm-resync");
});

test("T9 — drift âm tự về: element chạy trước ph 0,9 s, phản-thực về dưới ngưỡng ở k+2 → không đếm (seek không kịp bắn)", () => {
  const ticks = [
    tk(1000, 2.0, 1.1), // drift −0.9
    tk(1300, 2.0, 1.1, { watchCeil: W }), // k: arm
    tk(1600, 2.0, 1.1, { watchCeil: W }), // k+1: cf −0.6 (vẫn vượt)
    tk(1900, 2.0, 1.1, { watchCeil: W }), // k+2: cf −0.3 (về dưới ngưỡng)
    tk(2200, 2.0, 2.0),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD");
  assert.equal(r.reason, "phản-thực-không-due-2-tick-liên-tiếp");
});

test("T9b — drift âm lớn (−1,2 s): phản-thực vẫn vượt cả 2 tick → đếm (quy ước |drift| như §1/§4); khoảng tốc độ là cận TRÊN", () => {
  const ticks = [
    tk(1000, 2.0, 0.8), // drift −1.2
    tk(1300, 2.0, 0.8, { watchCeil: W }), // k: arm
    tk(1600, 2.0, 0.8, { watchCeil: W }), // k+1: cf −0.9
    tk(1900, 2.0, 0.8, { watchCeil: W }), // k+2: cf −0.6
    tk(2200, 2.0, 2.0),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "ARM-HELD", JSON.stringify(r));
  // Giao 2 khoảng có 3 mảnh: [0, 1.417] (nhánh âm cả 2 tick — nút thắt
  // là k+2: (1.2−0.35)/0.6 = 1.417), [2.583, 2.833] (drift đổi dấu giữa
  // 2 tick: âm ở k+1, dương ở k+2 — cần tốc độ ~2,7× phi thực tế),
  // [5.167, ∞) (nhánh dương cả 2 tick — tốc độ phi thực tế). Chỉ mảnh
  // chứa tốc độ thiết kế 1,0× mới có ý nghĩa thực.
  assert.equal(r.evidence.rateInterval.length, 3);
  assert.equal(r.evidence.rateInterval[0][0], 0);
  assert.ok(Math.abs(r.evidence.rateInterval[0][1] - 1.417) < 0.002, JSON.stringify(r.evidence.rateInterval));
  assert.deepEqual(r.evidence.rateIntervalDesign, r.evidence.rateInterval[0]);
  assert.equal(r.evidence.rateIntervalContainsDesign, true);
});

test("T11 — replay số thật f3 tick 32 (CANCELLED-hẹp đầu tiên): verdict NOT-HELD + cờ nhiễm pause-seek", () => {
  // ct 5.9 đóng băng, drift −0.4 due ở k−1/k, watch arm ở k rồi chết ở
  // k+1 (pause-seek của probe khi dừng làm seeking=true → dọn watch),
  // ct lùi 5.9→5.5 ở k+2 (pause-seek kéo element về playhead — KHÔNG
  // phải decoder resume). CANCELLED-hẹp đếm ca này vì drift về 0 ở k+2;
  // §6 loại đúng: cf1 đã không due trên dữ liệu sạch (gap k→k+1 chỉ
  // 112 ms, cf1 = −0.288).
  const ticks = [
    tk(8012, 5.9, 5.5, { tail: TAIL }), // k−1: drift −0.4, tail sống
    tk(8313, 5.9, 5.5, { watchCeil: W }), // k: arm, drift −0.4 (due)
    tk(8425, 5.9, 5.5), // k+1: watch đã chết (pause-seek), gap 112 ms
    tk(8606, 5.5, 5.5), // k+2: ct lùi về playhead (pause-seek)
    tk(8701, 5.5, 5.5),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD", JSON.stringify(r));
  assert.equal(r.evidence.oldCancelledDue, true); // CANCELLED-hẹp ĐẾM ca này
  assert.equal(r.evidence.windowContaminated, true);
  assert.equal(r.evidence.contaminationKind, "ct-lùi");
  assert.ok(Math.abs(r.evidence.driftCfK1 - (-0.288)) < 0.002, `cf1=${r.evidence.driftCfK1}`);
});

test("T12 — replay số thật e1r tick 41 không nhiễm pause-seek (ct không lùi trong cửa sổ)", () => {
  const ticks = [
    tk(11879, 5.4, 5.5333),
    tk(12104, 5.4, 5.5333, { watchCeil: W }),
    tk(12377, 5.4, 5.5333, { watchCeil: W }),
    tk(12796, 5.4, 5.5333, { watchCeil: W }),
    tk(12904, 5.5333, 5.5333),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "ARM-HELD");
  assert.equal(r.evidence.windowContaminated, false);
});

test("T10 — counterfactualDrift99A3 + khoảng tốc độ: ca e1r-41 tick k+1", () => {
  assert.equal(ARM_HELD_DRIFT_THRESHOLD_S, 0.35);
  const cf = counterfactualDrift99A3({ driftAtArm: 0.133, rate: 1.0, dtMs: 273, ctAdvance: 0 });
  assert.ok(Math.abs(cf - 0.406) < 0.001);
  const iv = counterfactualRateInterval99A3({ driftAtArm: 0.133, dtMs: 273, ctAdvance: 0 });
  assert.equal(iv.length, 1);
  assert.ok(Math.abs(iv[0][0] - 0.795) < 0.002);
  assert.equal(iv[0][1], Infinity);
  // Giao 2 khoảng: [0.795, ∞) ∩ [0.314, ∞) = [0.795, ∞).
  const iv2 = counterfactualRateInterval99A3({ driftAtArm: 0.133, dtMs: 692, ctAdvance: 0 });
  const inter = intersectRateIntervals99A3([iv, iv2]);
  assert.equal(inter.length, 1);
  assert.ok(Math.abs(inter[0][0] - 0.795) < 0.002);
});

test("T13 — replay số thật f5 tick 55 (ca suýt-đếm): phản-thực due cả 2 tick nhưng watch chết ở k+2 vì pause-seek của probe → NOT-HELD + cờ nhiễm", () => {
  const ticks = [
    tk(12594, 4.7881, 5.0667, { tail: TAIL }), // k−1: tail sống (chưa arm)
    tk(12919, 4.7881, 5.0667, { watchCeil: W }), // k: arm, drift 0.279
    tk(13389, 4.8333, 5.0667, { watchCeil: W }), // k+1: watch sống, ct bò +0,045
    tk(13616, 5.0667, 5.0667), // k+2: watch chết, ct đáp ĐÚNG ph, không tail, không resync (restartV=0) — pause-seek
    tk(13797, 5.0667, 5.0667),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD", JSON.stringify(r));
  assert.equal(r.evidence.windowContaminated, true);
  assert.equal(r.evidence.contaminationKind, "pause-seek-đáp-ph");
  assert.ok(Math.abs(r.evidence.driftCfK1 - 0.704) < 0.002, `cf1=${r.evidence.driftCfK1}`);
  assert.ok(Math.abs(r.evidence.driftCfK2 - 0.697) < 0.002, `cf2=${r.evidence.driftCfK2}`);
});

test("T14 — burst thật của decoder dọn watch nhưng MỞ tail → KHÔNG nhiễm pause-seek (dấu hiệu (b) không chạm)", () => {
  const ticks = [
    tk(10000, 2.0, 3.0333),
    tk(10200, 2.0, 3.0333, { watchCeil: W }), // k: arm, drift 1,033
    tk(10450, 3.0333, 3.0333, { tail: TAIL }), // k+1: burst đáp đúng ph, watch chết, NHƯNG tail mở (nhánh advance)
    tk(10700, 3.2, 3.2, { tail: TAIL }),
    tk(10950, 3.4, 3.4, { tail: TAIL }),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD");
  assert.equal(r.evidence.windowContaminated, false);
});

test("T15 — drift re-seek thật (watch chết + ct đáp đúng ph nhưng resyncsV tăng) → KHÔNG nhiễm pause-seek", () => {
  const ticks = [
    tk(10000, 2.0, 3.0333),
    tk(10200, 2.0, 3.0333, { watchCeil: W }), // k: arm, drift 1,033
    tk(10450, 2.0, 3.0333, { watchCeil: W }), // k+1: watch còn sống
    tk(10700, 3.0333, 3.0333, { resyncsV: 2 }), // k+2: drift re-seek bắn, ct→ph, watch chết
    tk(10950, 3.0333, 3.0333, { resyncsV: 2 }),
  ];
  const r = classifyArmHeld99A3(ticks, 1);
  assert.equal(r.verdict, "NOT-HELD");
  assert.equal(r.evidence.resyncAt, 2);
  assert.equal(r.evidence.windowContaminated, false);
});
