// deint-fps-verdict-100b7.test.mjs — Phase 9 đợt 100, luồng B7: test hồi quy
// quy tắc phân loại slot-tải-đầu trong lần yên (offline, không cần headed).
// Chạy: node --test apps/web/scripts/deint-fps-verdict-100b7.test.mjs
// Mọi bộ số slot đều lấy từ report JSON thật (A7/Z9) để khóa hành vi luật:
//   - A7 run7 E1: baseline [5,52 / 14,61 / 5,93 / 13,67 / 23,46 / 25,77],
//     mean 14,83 → yên nhưng slot 0 = 5,52 < 6 → gắn cờ (ca gốc của luật).
//   - Z9 run4 E1: baseline mean 13,13, slot thấp nhất 6,47 → yên sạch.
//   - Z9 run5 E1: vòng 1 yên (mean 15,72) + vòng 2 tải (mean 5,61) → hỗn hợp.
//   - A7 run8 E1: baseline [16,86 ... 23,92], mean 20,56 → yên sạch.
// File test 83k3 giữ nguyên 17/17 — các test của luật mới ở file riêng này.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDLE_MEAN_FPS, LOAD_SLOT_FPS,
  classifyIdleRound, classifyIdleRun,
} from "./deint-fps-verdict.mjs";

test("hằng số luật: yên khi baseline mean ≥ 10, slot tải khi < 6 fps", () => {
  assert.equal(IDLE_MEAN_FPS, 10);
  assert.equal(LOAD_SLOT_FPS, 6);
});

test("ca gốc A7 run7 E1: mean 14,83 yên nhưng slot 0 = 5,52 → gắn cờ", () => {
  const r = classifyIdleRound([5.52, 14.61, 5.93, 13.67, 23.46, 25.77]);
  assert.equal(r.baselineMean, 14.83);
  assert.equal(r.mode, "yên-slot-tải-đầu");
  assert.equal(r.leadingLoadSlot, true);
  assert.equal(r.slot0Fps, 5.52);
  // Slot 4 = 5,93 cũng < 6 → liệt kê minh bạch, nhưng không đổi mode.
  assert.deepEqual(r.loadSlots, [0, 2]);
});

test("A7 run8 E1 yên sạch nhất: mean 20,56, slot thấp nhất 16,86 → yên", () => {
  const r = classifyIdleRound([16.86, 19.79, 21.25, 19.61, 21.94, 23.92]);
  assert.equal(r.baselineMean, 20.56);
  assert.equal(r.mode, "yên");
  assert.equal(r.leadingLoadSlot, false);
  assert.deepEqual(r.loadSlots, []);
});

test("tiền lệ Z9 run4 E1: mean 13,13, slot thấp nhất 6,47 → yên sạch (không gắn cờ lại)", () => {
  const r = classifyIdleRound([6.47, 8.61, 9.65, 6.56, 23.46, 24.05]);
  assert.equal(r.baselineMean, 13.13);
  assert.equal(r.mode, "yên");
  assert.equal(r.leadingLoadSlot, false);
  assert.deepEqual(r.loadSlots, []);
});

test("chỉ slot 0 mới gắn cờ: slot giữa/cuối sụt vẫn yên sạch", () => {
  // A7 N10 run3 60fps thật: slot 2 (chỉ số 1 trong mảng baseline) = 5,01
  // nhưng slot 0 = 10,83, mean 12,64 → yên, không gắn cờ.
  const r = classifyIdleRound([10.83, 5.01, 13.05, 7.14, 18.08, 21.71]);
  assert.equal(r.baselineMean, 12.64);
  assert.equal(r.mode, "yên");
  assert.equal(r.leadingLoadSlot, false);
  assert.deepEqual(r.loadSlots, [1]);
  // A7 N10 run5 thật: slot cuối sụt 2,74 nhưng slot 0 = 16,62 → yên.
  const r2 = classifyIdleRound([16.62, 13.51, 7.79, 4.88, 2.74, 22.72]);
  assert.equal(r2.mode, "yên");
  assert.deepEqual(r2.loadSlots, [3, 4]);
});

test("lần tải: mean < 10 → tải dù slot 0 cao", () => {
  // Z9 run6 E1 thật: slot 0 = 20,36 nhưng mean 6,73 → tải.
  const r = classifyIdleRound([20.36, 5.86, 5.48, 2.92, 2.91, 2.84]);
  assert.equal(r.baselineMean, 6.73);
  assert.equal(r.mode, "tải");
  assert.equal(r.leadingLoadSlot, false);
  // A7 run3 vòng 1 thật: slot 0 = 10,17 nhưng mean 8,10 → tải.
  const r2 = classifyIdleRound([10.17, 5.07, 7.62, 10.96, 10.62, 4.13]);
  assert.equal(r2.mode, "tải");
});

test("biên: mean đúng 10 → yên; slot 0 đúng 6 → không gắn cờ", () => {
  const r = classifyIdleRound([6, 12, 12, 12, 12, 6]);
  assert.equal(r.baselineMean, 10);
  assert.equal(r.mode, "yên");
  assert.deepEqual(r.loadSlots, []);
  // Slot 0 = 5,99 (< 6) với mean ≥ 10 → gắn cờ.
  const r2 = classifyIdleRound([5.99, 12, 12, 12, 12, 12]);
  assert.equal(r2.mode, "yên-slot-tải-đầu");
  assert.deepEqual(r2.loadSlots, [0]);
});

test("classifyIdleRun 1 vòng: chuyền thẳng mode của vòng", () => {
  const one = classifyIdleRun([[5.52, 14.61, 5.93, 13.67, 23.46, 25.77]]);
  assert.equal(one.mode, "yên-slot-tải-đầu");
  assert.deepEqual(one.flaggedRounds, [1]);
  assert.equal(one.rounds.length, 1);
  const clean = classifyIdleRun([[16.86, 19.79, 21.25, 19.61, 21.94, 23.92]]);
  assert.equal(clean.mode, "yên");
  assert.deepEqual(clean.flaggedRounds, []);
});

test("classifyIdleRun 2 vòng: Z9 run5 hỗn hợp (vòng 1 yên + vòng 2 tải)", () => {
  const mixed = classifyIdleRun([
    [24.78, 5.97, 22.22, 12.02, 23.26, 6.09],
    [4.13, 5.94, 5.43, 7.36, 7.57, 3.22],
  ]);
  assert.equal(mixed.mode, "hỗn hợp");
  assert.equal(mixed.rounds[0].mode, "yên");
  assert.equal(mixed.rounds[1].mode, "tải");
  assert.deepEqual(mixed.flaggedRounds, []);
});

test("classifyIdleRun 2 vòng: A7 run1 cả 2 vòng yên sạch → yên", () => {
  const r = classifyIdleRun([
    [20.83, 26.5, 16.78, 24.5, 25.47, 23.9],
    [19.51, 25.38, 24.07, 26.13, 23.9, 27.06],
  ]);
  assert.equal(r.mode, "yên");
  assert.equal(r.rounds[0].baselineMean, 23);
  assert.equal(r.rounds[1].baselineMean, 24.34);
});

test("classifyIdleRun 2 vòng: một vòng bị gắn cờ → cả lần gắn cờ", () => {
  const r = classifyIdleRun([
    [20.83, 26.5, 16.78, 24.5, 25.47, 23.9],
    [5.52, 14.61, 5.93, 13.67, 23.46, 25.77],
  ]);
  assert.equal(r.mode, "yên-slot-tải-đầu");
  assert.deepEqual(r.flaggedRounds, [2]);
});

test("classifyIdleRun 2 vòng tải → tải; 2 vòng tải + yên không xảy ra ở đây", () => {
  const r = classifyIdleRun([
    [10.17, 5.07, 7.62, 10.96, 10.62, 4.13],
    [5.18, 3.61, 4.4, 3.42, 4.28, 6.73],
  ]);
  assert.equal(r.mode, "tải");
  assert.deepEqual(r.flaggedRounds, []);
});

test("đầu vào sai: rỗng / NaN / âm / không phải số đều throw", () => {
  assert.throws(() => classifyIdleRound([]), /rỗng/);
  assert.throws(() => classifyIdleRound([10, NaN, 10, 10, 10, 10]), /không hợp lệ/);
  assert.throws(() => classifyIdleRound([10, -1, 10, 10, 10, 10]), /không hợp lệ/);
  assert.throws(() => classifyIdleRound([10, "x", 10, 10, 10, 10]), /không hợp lệ/);
  assert.throws(() => classifyIdleRun([]), /rỗng/);
  assert.throws(() => classifyIdleRun([[]]), /rỗng/);
});
