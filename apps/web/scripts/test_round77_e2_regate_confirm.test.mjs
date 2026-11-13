/**
 * Phase 9 đợt 77, luồng E2 — Test unit cho luật re-gate mới (xác nhận slot-1 FN).
 * Chạy: node --test apps/web/scripts/test_round77_e2_regate_confirm.test.mjs
 * Không chạy browser, không đọc scratch: mọi fixture đều tự dựng trong file.
 * Các ca "hồi quy theo giá trị thật" chỉ mượn CON SỐ đã công bố trong LIMITS
 * D5/C4/A6/Y3/B8 (không đọc file JSON cũ) để khóa hành vi luật mới.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FN_DRAW_FPS, isSlotFn, decideRegateKill } from "./gate-regate-confirm.mjs";

const slot = (drawFps, valid = true) => ({ rep: 1, valid, drawFps });

test("E2: FN + re-gate FAIL → giết (cả luật cũ lẫn mới)", () => {
  // D5-S1: delta 17, slot1 0.58 fps → FN thật, re-gate bắt đúng.
  const r = decideRegateKill({ regateDelta: 17, threshold: 30, slot1: slot(0.58) });
  assert.equal(r.regateFail, true);
  assert.equal(r.oldKill, true);
  assert.equal(r.kill, true);
  assert.equal(r.sparedByConfirm, false);
  assert.equal(r.slot1Fn, true);
  assert.equal(r.reason, "kill-confirmed-slot1-fn");
});

test("E2: khỏe + re-gate FAIL → luật mới THA (luật cũ giết oan)", () => {
  // D5-S2 (FP kiểm duyệt): delta 27 tải thấp 2.80, slot1 15.04 fps khỏe.
  const s2 = decideRegateKill({ regateDelta: 27, threshold: 30, slot1: slot(15.04) });
  assert.equal(s2.oldKill, true);
  assert.equal(s2.kill, false);
  assert.equal(s2.sparedByConfirm, true);
  assert.equal(s2.reason, "spare-slot1-not-fn");
  // D5-S3 (FP kiểm duyệt): delta 18 dưới sóng tải 7.28, slot1 16.35 fps khỏe.
  const s3 = decideRegateKill({ regateDelta: 18, threshold: 30, slot1: slot(16.35) });
  assert.equal(s3.oldKill, true);
  assert.equal(s3.kill, false);
  assert.equal(s3.sparedByConfirm, true);
  // C4-S3 (FP kiểm duyệt đầu tiên): delta 4 dưới sóng tải 9.22, slot1 4.31 fps (không FN).
  const c4s3 = decideRegateKill({ regateDelta: 4, threshold: 30, slot1: slot(4.31) });
  assert.equal(c4s3.oldKill, true);
  assert.equal(c4s3.kill, false);
  assert.equal(c4s3.sparedByConfirm, true);
});

test("E2: FN + re-gate PASS → tha cả hai luật (FN lọt như trước, không tệ hơn)", () => {
  // B8-S1: delta 75, slot1 1.79 fps → FN lọt ở luật cũ; luật mới cũng lọt (không tệ hơn).
  const r = decideRegateKill({ regateDelta: 75, threshold: 30, slot1: slot(1.79) });
  assert.equal(r.regateFail, false);
  assert.equal(r.oldKill, false);
  assert.equal(r.kill, false);
  assert.equal(r.reason, "regate-pass");
});

test("E2: khỏe + re-gate PASS → tha cả hai luật", () => {
  // C4-S1: delta 52, slot1 3.38 fps; C4-S2: delta 44, slot1 22.42 fps.
  for (const [delta, draw] of [[52, 3.38], [44, 22.42], [82, 11.31], [273, 36.85]]) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw) });
    assert.equal(r.kill, false);
    assert.equal(r.oldKill, false);
  }
});

test("E2: biên ngưỡng — delta == 30 là PASS, delta 29 là FAIL", () => {
  const at = decideRegateKill({ regateDelta: 30, threshold: 30, slot1: slot(0.5) });
  assert.equal(at.regateFail, false);
  assert.equal(at.kill, false);
  const below = decideRegateKill({ regateDelta: 29, threshold: 30, slot1: slot(0.5) });
  assert.equal(below.regateFail, true);
  assert.equal(below.kill, true);
});

test("E2: slot 1 không hợp lệ / không có số đo → không xác nhận được → THA", () => {
  // Element đổi giữa slot (valid=false) thì drawFps không đáng tin — hướng an toàn là tha.
  const invalid = decideRegateKill({ regateDelta: 10, threshold: 30, slot1: slot(0.5, false) });
  assert.equal(invalid.slot1Fn, false);
  assert.equal(invalid.oldKill, true);
  assert.equal(invalid.kill, false);
  assert.equal(invalid.sparedByConfirm, true);
  const missing = decideRegateKill({ regateDelta: 10, threshold: 30, slot1: null });
  assert.equal(missing.slot1Fn, false);
  assert.equal(missing.kill, false);
  const noDraw = decideRegateKill({ regateDelta: 10, threshold: 30, slot1: { rep: 1, valid: true, drawFps: null } });
  assert.equal(noDraw.kill, false);
});

test("E2: confirmOn=false → về đúng luật cũ (khỏe + FAIL vẫn giết)", () => {
  const r = decideRegateKill({ regateDelta: 27, threshold: 30, slot1: slot(15.04), confirmOn: false });
  assert.equal(r.oldKill, true);
  assert.equal(r.kill, true);
  assert.equal(r.reason, "kill-old-rule");
});

test("E2: gateOn=false (chế độ quan sát) → không giết dù FN + FAIL", () => {
  const r = decideRegateKill({ regateDelta: 17, threshold: 30, slot1: slot(0.58), gateOn: false });
  assert.equal(r.oldKill, false);
  assert.equal(r.kill, false);
  assert.equal(r.reason, "gate-off");
});

test("E2: isSlotFn — ngưỡng FN là draw < 2 fps, đúng tiêu chí Y3/Z3", () => {
  assert.equal(FN_DRAW_FPS, 2);
  assert.equal(isSlotFn(slot(1.99)), true);
  assert.equal(isSlotFn(slot(2.0)), false);
  assert.equal(isSlotFn(slot(0)), true);
  assert.equal(isSlotFn(null), false);
  assert.equal(isSlotFn(undefined), false);
  assert.equal(isSlotFn({ valid: true }), false);
});

test("H2 hồi quy: 9 phiên đợt 80 — luật mới bắt FN 0/3, FP 0; đối chứng A/B luật cũ giết 3/3 (live)", () => {
  // Số liệu thật đợt 80 (harness chuẩn F2, ngưỡng 30/20/2):
  // Luật mới (confirm ON): S1 (24, slot1 2.87, không FN — tha oan, luật cũ giết),
  //   S2 (18, 2.30, FN slot 2 — luật cũ giết, luật mới tha),
  //   S3 (2, 3.27, FN slot 3 — luật cũ giết, luật mới tha),
  //   S4 (36, 5.88, khỏe, re-gate PASS), S5 (183, 1.50 FN slot 1, re-gate PASS),
  //   S6 (33, 4.56, khỏe, re-gate PASS).
  // Đối chứng A/B luật cũ (confirm OFF, xen kẽ, cùng burner với phiên cặp):
  //   C2 (24, 3.53, không FN — GIẾT THẬT live), C3 (17, 3.85 — GIẾT THẬT live),
  //   C4 (25, 3.66 — GIẾT THẬT live). Cả 3 đều khỏe (slot1 không FN) → FP live 3/3.
  const h2New = [
    // [delta, slot1Draw, isFn]
    [24, 2.87, false], [18, 2.3, true], [2, 3.27, true],
    [36, 5.88, false], [183, 1.5, true], [33, 4.56, false],
  ];
  let fnTotal = 0, oldCaught = 0, newCaught = 0, oldFp = 0, newFp = 0, spared = 0;
  for (const [delta, draw, isFn] of h2New) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw) });
    if (isFn) {
      fnTotal++;
      if (r.oldKill) oldCaught++;
      if (r.kill) newCaught++;
    } else {
      if (r.oldKill) oldFp++;
      if (r.kill) newFp++;
    }
    if (r.sparedByConfirm) spared++;
  }
  assert.equal(fnTotal, 3, "H2 luật mới: 3 phiên FN (S2, S3, S5)");
  assert.equal(oldCaught, 2, "luật cũ bắt FN sớm 2/3 (S2, S3)");
  assert.equal(newCaught, 0, "luật mới bắt FN sớm 0/3 — S2/S3 tha vì slot1 không FN, S5 re-gate PASS");
  assert.equal(oldFp, 1, "luật cũ FP đầy đủ 1 (S1)");
  assert.equal(newFp, 0, "luật mới FP đầy đủ 0");
  assert.equal(spared, 3, "luật mới tha 3 phiên (S1, S2, S3)");
  // Đối chứng A/B: confirm OFF → kill === oldKill; cả 3 phiên khỏe đều bị giết thật.
  const h2Ctrl = [[24, 3.53], [17, 3.85], [25, 3.66]];
  let ctrlKills = 0;
  for (const [delta, draw] of h2Ctrl) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw), confirmOn: false });
    assert.equal(r.oldKill, true);
    assert.equal(r.kill, true, "confirm=0 → luật cũ giết");
    assert.equal(r.reason, "kill-old-rule");
    if (r.kill) ctrlKills++;
  }
  assert.equal(ctrlKills, 3, "đối chứng A/B: luật cũ giết thật 3/3 phiên khỏe (FP live)");
});

test("H2: độ sắc ngưỡng FN 2 fps — slot1 trong dải 1,5–2,5 fps (S5 1,50 FN; S2 2,30 không FN)", () => {
  // S5 slot1 1,50 fps (FN) nhưng re-gate PASS 183 → cả hai luật tha (FN lọt như B8-S1).
  const s5 = decideRegateKill({ regateDelta: 183, threshold: 30, slot1: slot(1.5) });
  assert.equal(isSlotFn(slot(1.5)), true);
  assert.equal(s5.kill, false);
  assert.equal(s5.oldKill, false);
  // S2 slot1 2,30 fps (không FN, trong dải) + re-gate FAIL 18 → luật cũ giết, luật mới tha.
  const s2 = decideRegateKill({ regateDelta: 18, threshold: 30, slot1: slot(2.3) });
  assert.equal(isSlotFn(slot(2.3)), false);
  assert.equal(s2.oldKill, true);
  assert.equal(s2.kill, false);
  assert.equal(s2.sparedByConfirm, true);
  // Gộp với cặp cận ngưỡng G2: 1,97 GIẾT vs 2,07 THA — ranh giới 2 fps lật
  // verdict đúng như luật viết, nhưng n còn nhỏ nên chưa kết luận độ sắc.
  const g2kill = decideRegateKill({ regateDelta: 15, threshold: 30, slot1: slot(1.97) });
  const g2spare = decideRegateKill({ regateDelta: 15, threshold: 30, slot1: slot(2.07) });
  assert.equal(g2kill.kill, true);
  assert.equal(g2spare.kill, false);
  assert.equal(g2spare.sparedByConfirm, true);
});

test("I2 hồi quy: 12 phiên đợt 81 — luật mới bắt FN 4/6, FP 0; 4 lần giết thật", () => {
  // Số liệu thật đợt 81 (harness chuẩn F2, ngưỡng 30/20/2, toàn luật mới):
  // FN (6): S2 (11, slot1 1,29 — GIẾT), S4 (20, 2,06, FN slot 2 — luật cũ giết,
  //   luật mới tha), S7 (29, 0,88 — GIẾT), S12 (44, 1,00, re-gate PASS — lọt cả
  //   hai luật), S14 (4, 1,96 — GIẾT), S15 (23, 0,88 — GIẾT).
  // Không FN (6): S6 (17, 2,03 — luật cũ giết, luật mới tha), S8 (43, 5,84,
  //   re-gate PASS), S9 (17, 3,17 — tha), S10 (4, 2,23 — tha), S11 (4, 2,27 —
  //   tha), S13 (84, 10,82, re-gate PASS).
  const i2New = [
    // [delta, slot1Draw, isFn]
    [11, 1.29, true], [20, 2.06, true], [17, 2.03, false], [29, 0.88, true],
    [43, 5.84, false], [17, 3.17, false], [4, 2.23, false], [4, 2.27, false],
    [44, 1.0, true], [84, 10.82, false], [4, 1.96, true], [23, 0.88, true],
  ];
  let fnTotal = 0, oldCaught = 0, newCaught = 0, oldFp = 0, newFp = 0, spared = 0;
  for (const [delta, draw, isFn] of i2New) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw) });
    if (isFn) {
      fnTotal++;
      if (r.oldKill) oldCaught++;
      if (r.kill) newCaught++;
    } else {
      if (r.oldKill) oldFp++;
      if (r.kill) newFp++;
    }
    if (r.sparedByConfirm) spared++;
  }
  assert.equal(fnTotal, 6, "I2 luật mới: 6 phiên FN (S2, S4, S7, S12, S14, S15)");
  assert.equal(oldCaught, 5, "luật cũ bắt FN sớm 5/6 (trừ S12 re-gate PASS)");
  assert.equal(newCaught, 4, "luật mới bắt FN sớm 4/6 (S2, S7, S14, S15 — S4 tha vì slot1 không FN)");
  assert.equal(oldFp, 4, "luật cũ FP đầy đủ 4 (S6, S9, S10, S11)");
  assert.equal(newFp, 0, "luật mới FP đầy đủ 0");
  assert.equal(spared, 5, "luật mới tha 5 phiên (S4, S6, S9, S10, S11)");
});

test("K1 hồi quy: 7 phiên đợt 83 (hoàn thành J6 S6–S15) — luật mới bắt FN 3/5, FP 0; 3 lần giết thật", () => {
  // Số liệu thật đợt 83 (harness chuẩn F2, ngưỡng 30/20/2, toàn luật mới):
  // FN (5): S6 (20, slot1 3,82, FN slot 2 — luật cũ giết, luật mới tha),
  //   S10 (8, 0,39 — GIẾT), S11 (14, 1,81 — GIẾT, trong dải), S12 (18, 1,84 —
  //   GIẾT, trong dải), S13 (17, 3,77, FN slot 2 — luật cũ giết, luật mới tha).
  // Không FN (2): S14 (3, 2,37 — tha), S15 (12, 2,05 — tha).
  // S7/S8/S9: 0 JSON sau 6 attempt mỗi phiên (chết gate 1a) — không có số để test.
  const k1New = [
    // [delta, slot1Draw, isFn]
    [20, 3.82, true], [8, 0.39, true], [14, 1.81, true], [18, 1.84, true],
    [17, 3.77, true], [3, 2.37, false], [12, 2.05, false],
  ];
  let fnTotal = 0, oldCaught = 0, newCaught = 0, oldFp = 0, newFp = 0, spared = 0;
  for (const [delta, draw, isFn] of k1New) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw) });
    if (isFn) {
      fnTotal++;
      if (r.oldKill) oldCaught++;
      if (r.kill) newCaught++;
    } else {
      if (r.oldKill) oldFp++;
      if (r.kill) newFp++;
    }
    if (r.sparedByConfirm) spared++;
  }
  assert.equal(fnTotal, 5, "K1 luật mới: 5 phiên FN (S6, S10, S11, S12, S13)");
  assert.equal(oldCaught, 5, "luật cũ bắt FN sớm 5/5");
  assert.equal(newCaught, 3, "luật mới bắt FN sớm 3/5 (S10, S11, S12 — S6/S13 tha vì slot1 không FN)");
  assert.equal(oldFp, 2, "luật cũ FP đầy đủ 2 (S14, S15)");
  assert.equal(newFp, 0, "luật mới FP đầy đủ 0");
  assert.equal(spared, 4, "luật mới tha 4 phiên (S6, S13, S14, S15)");
});

test("K1: độ sắc ngưỡng FN 2 fps — 1,81/1,84/1,96 GIẾT vs 2,03/2,05 THA (re-gate FAIL, gộp H2+I2+J6+K1)", () => {
  // Gộp H2+I2+J6+K1, slot1 trong dải 1,5–2,5 fps + re-gate FAIL: n=11 ca.
  // Dưới 2 fps: 3/3 GIẾT (K1 S11 1,81; K1 S12 1,84; I2 S14 1,96).
  // Trên 2 fps: 8/8 THA (I2 S6 2,03; K1 S15 2,05; I2 S4 2,06; I2 S10 2,23;
  //   I2 S11 2,27; H2 S2 2,30; J6 S1 2,36; K1 S14 2,37).
  // Cặp sát nhất hai phía ranh giới: giết 1,96 / tha 2,03 — cửa sổ lật
  // 0,07 fps quanh 2,0. n=11 ca FAIL trong dải: bằng chứng độ sắc ở mức
  // quan sát, mạnh hơn I2 (n=6) nhưng vẫn chưa phải chứng minh thống kê —
  // ngưỡng 30/20/2 GIỮ NGUYÊN.
  for (const d of [1.81, 1.84, 1.96]) {
    const r = decideRegateKill({ regateDelta: 15, threshold: 30, slot1: slot(d) });
    assert.equal(r.kill, true, `slot1 ${d} fps + re-gate FAIL → GIẾT`);
  }
  for (const d of [2.03, 2.05, 2.06, 2.23, 2.27, 2.3, 2.36, 2.37]) {
    const r = decideRegateKill({ regateDelta: 15, threshold: 30, slot1: slot(d) });
    assert.equal(r.kill, false, `slot1 ${d} fps + re-gate FAIL → THA`);
    assert.equal(r.sparedByConfirm, true);
  }
});

test("I2: độ sắc ngưỡng FN 2 fps — S14 1,96 FN GIẾT vs S6 2,03 THA (re-gate FAIL cả hai)", () => {
  // Ca dưới-2,0 trong dải đầu tiên có re-gate FAIL (nợ H2 §7.3 đã đóng):
  // S14 slot1 1,96 fps (FN) + re-gate FAIL 4 → luật mới GIẾT.
  const s14 = decideRegateKill({ regateDelta: 4, threshold: 30, slot1: slot(1.96) });
  assert.equal(isSlotFn(slot(1.96)), true);
  assert.equal(s14.oldKill, true);
  assert.equal(s14.kill, true);
  assert.equal(s14.reason, "kill-confirmed-slot1-fn");
  // S6 slot1 2,03 fps (không FN) + re-gate FAIL 17 → luật cũ giết, luật mới tha.
  const s6 = decideRegateKill({ regateDelta: 17, threshold: 30, slot1: slot(2.03) });
  assert.equal(isSlotFn(slot(2.03)), false);
  assert.equal(s6.oldKill, true);
  assert.equal(s6.kill, false);
  assert.equal(s6.sparedByConfirm, true);
  // Cặp sát nhất hai phía ranh giới (gộp G2 + I2, đều re-gate FAIL):
  // giết 1,96 / 1,97 vs tha 2,03 / 2,06 / 2,07 — verdict lật trong cửa sổ
  // 0,06 fps quanh 2,0; n còn nhỏ (5 ca FAIL cận ngưỡng) nên đây là bằng
  // chứng độ sắc ở mức quan sát, chưa phải chứng minh thống kê.
  for (const d of [1.96, 1.97]) {
    const r = decideRegateKill({ regateDelta: 15, threshold: 30, slot1: slot(d) });
    assert.equal(r.kill, true, `slot1 ${d} fps + re-gate FAIL → GIẾT`);
  }
  for (const d of [2.03, 2.06, 2.07]) {
    const r = decideRegateKill({ regateDelta: 15, threshold: 30, slot1: slot(d) });
    assert.equal(r.kill, false, `slot1 ${d} fps + re-gate FAIL → THA`);
    assert.equal(r.sparedByConfirm, true);
  }
});

test("E2 hồi quy: toàn bộ 16 phiên chuẩn lịch sử — luật mới bắt FN 3/4, FP 0/12", () => {
  // Bảng hiệu chuẩn D5 §3 (delta re-gate, slot1 draw): 4 phiên FN + 12 phiên khỏe.
  // FN: Y3-S1 (18, slot1 0.4), A6-S1 (21, 0.77), B8-S1 (75, 1.79), D5-S1 (17, 0.58).
  // Khỏe: Y3-S2 (137, 16.28), Y3-S3 (149, 22.57), A6-S2 (41, 4.95), B8-S2 (244, 31.15),
  //   Z3-S1 (82, 11.31), Z3-S2 (228, 35.74), Z3-S3 (273, 36.85), C4-S1 (52, 3.38),
  //   C4-S2 (44, 22.42), C4-S3 (4, 4.31), D5-S2 (27, 15.04), D5-S3 (18, 16.35).
  const history = [
    // [delta, slot1Draw, isFn]
    [18, 0.4, true], [21, 0.77, true], [75, 1.79, true], [17, 0.58, true],
    [137, 16.28, false], [149, 22.57, false], [41, 4.95, false], [244, 31.15, false],
    [82, 11.31, false], [228, 35.74, false], [273, 36.85, false], [52, 3.38, false],
    [44, 22.42, false], [4, 4.31, false], [27, 15.04, false], [18, 16.35, false],
  ];
  let oldCaught = 0, newCaught = 0, oldFp = 0, newFp = 0, fnTotal = 0;
  for (const [delta, draw, isFn] of history) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw) });
    if (isFn) {
      fnTotal++;
      if (r.oldKill) oldCaught++;
      if (r.kill) newCaught++;
    } else {
      if (r.oldKill) oldFp++;
      if (r.kill) newFp++;
    }
  }
  assert.equal(fnTotal, 4);
  assert.equal(oldCaught, 3, "luật cũ bắt FN 3/4");
  assert.equal(newCaught, 3, "luật mới bắt FN 3/4 — KHÔNG làm FN lọt thêm");
  assert.equal(oldFp, 3, "luật cũ FP 3/12");
  assert.equal(newFp, 0, "luật mới FP 0/12 — cả 3 FP kiểm duyệt đều được tha");
});
