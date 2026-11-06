#!/usr/bin/env node
/**
 * cpu-gate-quiet-runner-42x6.test.mjs — Test đợt 42 X6: RAM hỏi TRƯỚC
 * busy/CPU load, báo cáo nêu gate trượt đầu tiên, KHÔNG nới ngưỡng.
 * Chạy: node --test apps/web/scripts/cpu-gate-quiet-runner-42x6.test.mjs
 * (từ gốc repo). Chỉ test evaluateQuietGate + hằng ngưỡng bằng
 * fixture — không cần máy yên thật, không đo probe, không khóa cổng.
 * Không sửa test W6 cũ: test này là file riêng của X6, hồi quy W6
 * chạy lại file cũ nguyên vẹn (xem LIMITS X6 §3).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QUIET_GATE_DEFAULTS,
  evaluateQuietGate,
} from "./cpu-gate-quiet-runner-41w6.mjs";

function sample(load1, load5, frac) {
  return { at: "2026-11-04T00:00:00.000Z", load1, load5, load15: 0.5, nproc: 4, memTotalBytes: 8000, memAvailableBytes: 8000 * frac, memAvailableFrac: frac, memSource: "fixture" };
}

test("X6-a: RAM trượt + CPU đạt -> nêu RAM trước, firstFailedGate=memAvailable", () => {
  // Đúng hình dạng đợt 41 W6 lần 1: load yên, RAM 9,8% < 20%.
  const g = evaluateQuietGate([sample(0.89, 0.93, 0.098), sample(0.82, 0.92, 0.096), sample(0.82, 0.92, 0.097)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.equal(g.firstFailedGate, "memAvailable");
  assert.ok(g.firstFailure.startsWith("RAM: memAvailable"), g.firstFailure);
  assert.ok(g.firstFailure.includes("20%"), g.firstFailure);
  assert.ok(g.blockers[0].startsWith("memAvailable"), JSON.stringify(g.blockers));
  assert.ok(!g.blockers.some((b) => b.startsWith("load")), JSON.stringify(g.blockers));
});

test("X6-b: RAM đạt + CPU trượt (load1) -> nêu CPU, firstFailedGate=load1", () => {
  const g = evaluateQuietGate([sample(2.03, 1.05, 0.5), sample(1.9, 1.0, 0.5), sample(2.1, 1.1, 0.5)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.equal(g.firstFailedGate, "load1");
  assert.ok(g.firstFailure.startsWith("CPU: load1"), g.firstFailure);
  assert.ok(g.blockers[0].startsWith("load1"), JSON.stringify(g.blockers));
});

test("X6-c: RAM đạt + load5 trượt -> firstFailedGate=load5", () => {
  const g = evaluateQuietGate([sample(0.2, 2.5, 0.5), sample(0.3, 2.4, 0.5), sample(0.25, 2.6, 0.5)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.equal(g.firstFailedGate, "load5");
  assert.ok(g.firstFailure.startsWith("CPU: load5"), g.firstFailure);
});

test("X6-d: RAM + CPU cùng trượt -> RAM vẫn đứng đầu blockers và firstFailedGate", () => {
  // Mẫu 1 chỉ trượt load, mẫu 2 chỉ trượt RAM: thứ tự thời gian đảo
  // ngược thứ tự báo cáo — RAM vẫn phải lên đầu (đây chính là lỗi
  // báo cáo của đợt 41: liệt kê theo mẫu, load trước RAM).
  const g = evaluateQuietGate([sample(2.5, 0.4, 0.5), sample(0.2, 0.4, 0.08), sample(0.2, 0.4, 0.5)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.equal(g.firstFailedGate, "memAvailable");
  assert.ok(g.blockers[0].startsWith("memAvailable"), JSON.stringify(g.blockers));
});

test("X6-e: cổng yên -> firstFailedGate null, blockers rỗng (busy chưa hỏi cũng không nêu)", () => {
  const g = evaluateQuietGate([sample(0.2, 0.4, 0.5), sample(0.3, 0.4, 0.5), sample(0.25, 0.5, 0.45)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, true);
  assert.equal(g.firstFailedGate, null);
  assert.equal(g.firstFailure, null);
  assert.deepEqual(g.blockers, []);
});

test("X6-f: thiếu mẫu nhưng RAM đã trượt -> vẫn nêu RAM trước (không đổ cho thiếu mẫu)", () => {
  const g = evaluateQuietGate([sample(0.2, 0.4, 0.09)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.equal(g.firstFailedGate, "memAvailable");
});

test("X6-g: thiếu mẫu và mọi gate đạt -> firstFailedGate=samples", () => {
  const g = evaluateQuietGate([sample(0.2, 0.4, 0.5), sample(0.2, 0.4, 0.5)], QUIET_GATE_DEFAULTS, 4);
  assert.equal(g.quiet, false);
  assert.equal(g.firstFailedGate, "samples");
});

test("X6-h: mặc định KHÔNG đổi — RAM 20%, load 0.25/0.50, 3 mẫu — và KHÔNG có override env", () => {
  // X6 quyết KHÔNG thêm biến môi trường override ngưỡng (xem LIMITS
  // §4): đặt thử biến env kiểu override cũng không được đổi mặc định.
  process.env.VCUT_QUIET_MEM_FRAC = "0.05";
  process.env.VCUT_QUIET_MEM_MIN_FRAC = "0.05";
  try {
    assert.equal(QUIET_GATE_DEFAULTS.memAvailableMinFrac, 0.2);
    assert.equal(QUIET_GATE_DEFAULTS.load1PerCore, 0.25);
    assert.equal(QUIET_GATE_DEFAULTS.load5PerCore, 0.5);
    assert.equal(QUIET_GATE_DEFAULTS.minSamples, 3);
    // Mẫu RAM 15,1% (số thật đợt 41) vẫn trượt dưới mặc định 20%.
    const g = evaluateQuietGate([sample(0.2, 0.4, 0.151), sample(0.3, 0.4, 0.151), sample(0.25, 0.4, 0.151)], QUIET_GATE_DEFAULTS, 4);
    assert.equal(g.quiet, false);
    assert.equal(g.firstFailedGate, "memAvailable");
  } finally {
    delete process.env.VCUT_QUIET_MEM_FRAC;
    delete process.env.VCUT_QUIET_MEM_MIN_FRAC;
  }
});
