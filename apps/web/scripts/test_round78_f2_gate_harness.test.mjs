/**
 * Phase 9 đợt 78, luồng F2 — Test unit cho harness chuẩn
 * apps/web/scripts/measure-78f2-gate-harness.mjs (thay launcher Z3/E2).
 * Chạy: node --test apps/web/scripts/test_round78_f2_gate_harness.test.mjs
 * Không chạy browser, không đọc scratch (trừ spawn F2_DRY_RUN để kiểm tra
 * harness thật — dry-run thoát trước khi spawn vite/chrome).
 * Khóa 3 điều:
 *   (1) harness là file đo TRỰC TIẾP: import decideRegateKill từ
 *       gate-regate-confirm.mjs, KHÔNG còn inject inline, KHÔNG còn
 *       string-surgery (REPS) hay import qua data: URL như launcher E2/Z3.
 *   (2) luật giết trong harness = đúng module dùng chung (hồi quy 16 phiên
 *       lịch sử + 4 phiên E2 đợt 77 — số lấy từ LIMITS đã công bố).
 *   (3) F2_DRY_RUN chạy thật trên harness: exit 0, in đúng cờ; cờ
 *       E2_REGATE_CONFIRM=0 lật được confirm về false (đường A/B).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { decideRegateKill } from "./gate-regate-confirm.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.join(DIR, "measure-78f2-gate-harness.mjs");
const HARNESS_SRC = fs.readFileSync(HARNESS, "utf8");
const slot = (drawFps, valid = true) => ({ rep: 1, valid, drawFps });

test("F2: harness import decideRegateKill trực tiếp, không inline, không string-surgery", () => {
  assert.match(HARNESS_SRC, /import \{ decideRegateKill \} from "\.\/gate-regate-confirm\.mjs";/);
  assert.equal(HARNESS_SRC.includes("function decideRegateKill("), false, "không còn định nghĩa decide inline");
  assert.equal(HARNESS_SRC.includes("function isSlotFn("), false, "không còn isSlotFn inline");
  assert.equal(HARNESS_SRC.includes("const FN_DRAW_FPS"), false, "không còn FN_DRAW_FPS inline");
  assert.equal(HARNESS_SRC.includes("data:text/javascript"), false, "không còn import variant qua data: URL");
  assert.equal(HARNESS_SRC.includes("const REPS = ["), false, "không còn mảng REPS thay chuỗi");
  assert.equal(HARNESS_SRC.includes("Gốc (đợt 65 S8)"), true, "vẫn ghi rõ gốc kế thừa trong doc");
  // Chỉ 1 chỗ gọi quyết định giết, đúng hàm import.
  const calls = HARNESS_SRC.match(/decideRegateKill\(/g) || [];
  assert.equal(calls.length, 1, `đúng 1 chỗ gọi decideRegateKill, thấy ${calls.length}`);
});

test("F2: harness giữ nguyên hằng số đo (cổng riêng, ngưỡng 30, cửa BẬT mặc định)", () => {
  assert.match(HARNESS_SRC, /F2_DEV_PORT.*\|\| 5578/);
  assert.match(HARNESS_SRC, /F2_DEBUG_PORT.*\|\| 9678/);
  assert.match(HARNESS_SRC, /E2_REGATE_CONFIRM = process\.env\.E2_REGATE_CONFIRM !== "0"/);
  assert.match(HARNESS_SRC, /Z3_REGATE_THRESHOLD = Math\.max\(1, Number\(process\.env\.Z3_REGATE_THRESHOLD \|\| 30\)/);
  assert.match(HARNESS_SRC, /VITE_CFG_DIR = process\.env\.F2_VITE_CFG_DIR \|\| "\/tmp\/round78-f2"/);
  assert.match(HARNESS_SRC, /vite\.f2-presented\.config\.cjs/);
  // Logic đo giữ nguyên: gate 1a, re-gate sau slot 1, resume-probe, đối chứng tab trắng.
  assert.match(HARNESS_SRC, /RE-GATE \(E2, sau slot 1\)/);
  assert.match(HARNESS_SRC, /E2-SECOND-GATE/);
  assert.match(HARNESS_SRC, /E2-SPARED/);
  assert.match(HARNESS_SRC, /E2-VERDICT/);
  assert.match(HARNESS_SRC, /RESUME-PROBE \(Y3\)/);
});

test("F2: F2_DRY_RUN chạy thật trên harness — exit 0, in đúng cờ (confirm BẬT)", () => {
  const r = spawnSync(process.execPath, [HARNESS], {
    env: { ...process.env, F2_DRY_RUN: "1" },
    encoding: "utf8", timeout: 30000,
  });
  assert.equal(r.status, 0, `dry-run exit ${r.status}: ${r.stderr}`);
  assert.match(r.stdout, /HARNESS F2 DRY-RUN: decideRegateKill=function E2_REGATE_CONFIRM=true Z3_REGATE_GATE=true Z3_REGATE_THRESHOLD=30 VITE_CFG_DIR=\/tmp\/round78-f2/);
});

test("F2: F2_DRY_RUN với E2_REGATE_CONFIRM=0 — cờ A/B lật được về false", () => {
  const r = spawnSync(process.execPath, [HARNESS], {
    env: { ...process.env, F2_DRY_RUN: "1", E2_REGATE_CONFIRM: "0" },
    encoding: "utf8", timeout: 30000,
  });
  assert.equal(r.status, 0, `dry-run exit ${r.status}: ${r.stderr}`);
  assert.match(r.stdout, /E2_REGATE_CONFIRM=false/);
  // Đường A/B trong module dùng chung: luật cũ giết phiên khỏe khi FAIL.
  const old = decideRegateKill({ regateDelta: 27, threshold: 30, slot1: slot(15.04), confirmOn: false });
  assert.equal(old.kill, true);
  assert.equal(old.reason, "kill-old-rule");
});

test("F2 hồi quy: 16 phiên lịch sử + 4 phiên E2 — luật mới bắt FN 3/4, FP 0/12; E2: FP kiểm duyệt 1→0", () => {
  // 16 phiên lịch sử (số từ LIMITS D5/E2): FN Y3-S1 (18, 0.4), A6-S1 (21, 0.77),
  // B8-S1 (75, 1.79), D5-S1 (17, 0.58); khỏe 12 phiên còn lại (xem test E2).
  const history = [
    [18, 0.4, true], [21, 0.77, true], [75, 1.79, true], [17, 0.58, true],
    [137, 16.28, false], [149, 22.57, false], [41, 4.95, false], [244, 31.15, false],
    [82, 11.31, false], [228, 35.74, false], [273, 36.85, false], [52, 3.38, false],
    [44, 22.42, false], [4, 4.31, false], [27, 15.04, false], [18, 16.35, false],
  ];
  let oldCaught = 0, newCaught = 0, oldFp = 0, newFp = 0;
  for (const [delta, draw, isFn] of history) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw) });
    if (isFn) { if (r.oldKill) oldCaught++; if (r.kill) newCaught++; }
    else { if (r.oldKill) oldFp++; if (r.kill) newFp++; }
  }
  assert.equal(oldCaught, 3);
  assert.equal(newCaught, 3, "luật mới bắt FN 3/4 — không làm FN lọt thêm");
  assert.equal(oldFp, 3);
  assert.equal(newFp, 0, "luật mới FP 0/12");
  // 4 phiên E2 đợt 77 (S1 FN slot1 2.92 tha; S2/S3/S4 khỏe, re-gate PASS).
  const e2 = [
    [2, 2.92, true], [206, 28.67, false], [49, 6.29, false], [191, 26.63, false],
  ];
  let e2OldKill = 0, e2NewKill = 0, e2Spared = 0;
  for (const [delta, draw, isFn] of e2) {
    const r = decideRegateKill({ regateDelta: delta, threshold: 30, slot1: slot(draw) });
    if (r.oldKill) e2OldKill++;
    if (r.kill) e2NewKill++;
    if (r.sparedByConfirm) e2Spared++;
    if (isFn) assert.equal(r.kill, false, "S1: luật mới tha FN có slot1 không FN");
  }
  assert.equal(e2OldKill, 1, "luật cũ giết 1/4 phiên E2 (S1)");
  assert.equal(e2NewKill, 0, "luật mới giết 0/4 — chưa quan sát lần giết thật đầu tiên");
  assert.equal(e2Spared, 1, "S1 được tha khỏi giết oan");
});

test("F2: trường hợp giết thật đầu tiên của luật mới — FN + slot1 FN + re-gate FAIL", () => {
  // Mẫu hình cần quan sát trong ≥10 phiên F2: slot1 < 2 fps và re-gate delta < 30.
  // D5-S1 là mẫu lịch sử đúng hình này (delta 17, slot1 0.58).
  const r = decideRegateKill({ regateDelta: 17, threshold: 30, slot1: slot(0.58) });
  assert.equal(r.kill, true);
  assert.equal(r.reason, "kill-confirmed-slot1-fn");
  assert.equal(r.sparedByConfirm, false);
});
