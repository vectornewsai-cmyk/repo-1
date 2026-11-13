// trialDecodeRunning71Y5.test.ts — Phase 9 đợt 71, luồng Y5: registry run
// trial-decode đang chạy (cho toast trạng thái khi trial lâu).
//
// Chạy trực tiếp bằng Node type-stripping (Node 24, từ gốc repo):
//   node apps/web/src/lib/trialDecodeRunning71Y5.test.ts
//
// Phạm vi test (toàn hàm thuần, không DOM/React):
// - begin trả id duy nhất, run hiện trong activeTrialDecodeRuns với
//   đúng sampleBytes/timeoutMs/viaWorker + startedAtMs hợp lý.
// - end xóa run; end id lạ là no-op (không notify, không throw).
// - Nhiều run cùng lúc cùng tồn tại, xếp theo startedAtMs (cũ trước).
// - subscribe được notify đúng 1 lần mỗi begin/end, không notify khi
//   end id lạ; unsubscribe dừng nhận.
// - reset test dọn sạch registry (phục vụ test khác dùng chung module).
import assert from "node:assert/strict";
import {
  __resetTrialDecodeRunningForTest,
  activeTrialDecodeRuns,
  beginTrialDecodeRun,
  endTrialDecodeRun,
  subscribeTrialDecodeRunning,
  TRIAL_DECODE_RUNNING_TOAST_DELAY_MS,
  TRIAL_DECODE_RUNNING_TOAST_TICK_MS,
} from "./trialDecodeRunning71Y5.ts";

declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  __resetTrialDecodeRunningForTest();
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

test("hằng UI: ngưỡng toast 5 s, tick elapsed 1 s", () => {
  assert.equal(TRIAL_DECODE_RUNNING_TOAST_DELAY_MS, 5000);
  assert.equal(TRIAL_DECODE_RUNNING_TOAST_TICK_MS, 1000);
});

test("begin trả id, run hiện với đúng thông tin + startedAtMs", () => {
  const before = Date.now();
  const id = beginTrialDecodeRun({ sampleBytes: 67108864, timeoutMs: 78536, viaWorker: true });
  const after = Date.now();
  assert.equal(typeof id, "number");
  const runs = activeTrialDecodeRuns();
  assert.equal(runs.length, 1);
  assert.equal(runs[0].id, id);
  assert.equal(runs[0].sampleBytes, 67108864);
  assert.equal(runs[0].timeoutMs, 78536);
  assert.equal(runs[0].viaWorker, true);
  assert.ok(runs[0].startedAtMs >= before && runs[0].startedAtMs <= after);
});

test("end xóa run; end lại id đã xóa là no-op", () => {
  const id = beginTrialDecodeRun({ sampleBytes: 1000, timeoutMs: 200, viaWorker: false });
  endTrialDecodeRun(id);
  assert.equal(activeTrialDecodeRuns().length, 0);
  let calls = 0;
  const unsub = subscribeTrialDecodeRunning(() => calls++);
  endTrialDecodeRun(id); // đã xóa rồi
  endTrialDecodeRun(999999); // chưa từng có
  assert.equal(calls, 0);
  assert.equal(activeTrialDecodeRuns().length, 0);
  unsub();
});

test("nhiều run cùng lúc, xếp cũ nhất trước", () => {
  const a = beginTrialDecodeRun({ sampleBytes: 100, timeoutMs: 200, viaWorker: false });
  const b = beginTrialDecodeRun({ sampleBytes: 200, timeoutMs: 200, viaWorker: false });
  assert.notEqual(a, b);
  const runs = activeTrialDecodeRuns();
  assert.equal(runs.length, 2);
  assert.equal(runs[0].id, a);
  assert.equal(runs[1].id, b);
  endTrialDecodeRun(a);
  assert.deepEqual(activeTrialDecodeRuns().map((r) => r.id), [b]);
});

test("subscribe notify đúng 1 lần mỗi begin/end; unsubscribe dừng nhận", () => {
  let calls = 0;
  const unsub = subscribeTrialDecodeRunning(() => calls++);
  const id = beginTrialDecodeRun({ sampleBytes: 100, timeoutMs: 200, viaWorker: false });
  assert.equal(calls, 1);
  endTrialDecodeRun(id);
  assert.equal(calls, 2);
  unsub();
  beginTrialDecodeRun({ sampleBytes: 100, timeoutMs: 200, viaWorker: false });
  assert.equal(calls, 2);
});

test("listener lỗi không chặn listener khác", () => {
  let good = 0;
  subscribeTrialDecodeRunning(() => {
    throw new Error("listener hỏng");
  });
  subscribeTrialDecodeRunning(() => good++);
  beginTrialDecodeRun({ sampleBytes: 100, timeoutMs: 200, viaWorker: false });
  assert.equal(good, 1);
});

console.log(
  `trialDecodeRunning71Y5: ${pass} pass, ${fail} fail${failedNames.length ? ` — FAILED: ${failedNames.join("; ")}` : ""}`,
);
if (fail > 0) process.exitCode = 1;
