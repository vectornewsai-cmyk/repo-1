// trialFetchRunning72Z5.test.ts — Phase 9 đợt 72, luồng Z5: registry run
// trial mở rộng với GIAI ĐOẠN FETCH remainder (đóng nợ đợt 71 §5 mục 5).
//
// Chạy trực tiếp bằng Node type-stripping (Node 24, từ gốc repo):
//   node apps/web/src/lib/trialFetchRunning72Z5.test.ts
//
// Phạm vi test (toàn hàm thuần, không DOM/React):
// - beginTrialFetchRun: phase "fetch", fetchedBytes khởi tạo = tiền tố
//   AVCC đã có, totalBytes = sampleBytes, phaseStartedAtMs = startedAtMs.
// - updateTrialFetchProgress: tăng theo chunk, notify mỗi lần đổi, cùng
//   giá trị không notify thêm, kẹp về totalBytes, id lạ false + không notify.
// - markTrialDecodeStarted: phase "decode", phaseStartedAtMs đặt lại,
//   fetchedBytes = đủ sample, notify.
// - beginTrialDecodeRun (Y5, không đổi): mặc định phase "decode",
//   fetchedBytes = đủ sample, phaseStartedAtMs = startedAtMs.
// - Nhiều run cùng lúc (fetch + decode), xếp cũ nhất trước; end dọn đúng run.
import assert from "node:assert/strict";
import {
  __resetTrialDecodeRunningForTest,
  activeTrialDecodeRuns,
  beginTrialDecodeRun,
  beginTrialFetchRun,
  endTrialDecodeRun,
  markTrialDecodeStarted,
  subscribeTrialDecodeRunning,
  updateTrialFetchProgress,
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

test("begin fetch run: phase fetch, fetchedBytes = tiền tố, total = sample", () => {
  const before = Date.now();
  const id = beginTrialFetchRun({
    sampleBytes: 67108864,
    timeoutMs: 78536,
    viaWorker: true,
    fetchedBytes: 262144,
  });
  const after = Date.now();
  const runs = activeTrialDecodeRuns();
  assert.equal(runs.length, 1);
  assert.equal(runs[0].id, id);
  assert.equal(runs[0].phase, "fetch");
  assert.equal(runs[0].fetchedBytes, 262144);
  assert.equal(runs[0].totalBytes, 67108864);
  assert.equal(runs[0].sampleBytes, 67108864);
  assert.ok(runs[0].startedAtMs >= before && runs[0].startedAtMs <= after);
  assert.equal(runs[0].phaseStartedAtMs, runs[0].startedAtMs);
});

test("update progress: tăng theo chunk, notify mỗi lần đổi, cùng giá trị không notify", () => {
  const id = beginTrialFetchRun({
    sampleBytes: 3000000,
    timeoutMs: 2500,
    viaWorker: false,
    fetchedBytes: 262144,
  });
  let calls = 0;
  const unsub = subscribeTrialDecodeRunning(() => calls++);
  assert.equal(updateTrialFetchProgress(id, 786432), true);
  assert.equal(calls, 1);
  assert.equal(activeTrialDecodeRuns()[0].fetchedBytes, 786432);
  assert.equal(updateTrialFetchProgress(id, 1310720), true);
  assert.equal(calls, 2);
  assert.equal(activeTrialDecodeRuns()[0].fetchedBytes, 1310720);
  // Cùng giá trị: không đổi state, không notify.
  assert.equal(updateTrialFetchProgress(id, 1310720), true);
  assert.equal(calls, 2);
  unsub();
});

test("update progress: kẹp về totalBytes, id lạ false + không notify", () => {
  const id = beginTrialFetchRun({
    sampleBytes: 1000000,
    timeoutMs: 2500,
    viaWorker: false,
    fetchedBytes: 262144,
  });
  let calls = 0;
  const unsub = subscribeTrialDecodeRunning(() => calls++);
  assert.equal(updateTrialFetchProgress(id, 99999999), true);
  assert.equal(activeTrialDecodeRuns()[0].fetchedBytes, 1000000);
  assert.equal(calls, 1);
  assert.equal(updateTrialFetchProgress(999999, 500000), false);
  assert.equal(updateTrialFetchProgress(id, -5), true);
  assert.equal(activeTrialDecodeRuns()[0].fetchedBytes, 0);
  assert.equal(calls, 2);
  unsub();
});

test("mark decode started: phase decode, fetchedBytes đủ, phaseStartedAtMs đặt lại", () => {
  const id = beginTrialFetchRun({
    sampleBytes: 67108864,
    timeoutMs: 78536,
    viaWorker: true,
    fetchedBytes: 262144,
  });
  const before = activeTrialDecodeRuns()[0];
  assert.equal(before.phase, "fetch");
  let calls = 0;
  const unsub = subscribeTrialDecodeRunning(() => calls++);
  assert.equal(markTrialDecodeStarted(id), true);
  assert.equal(calls, 1);
  const run = activeTrialDecodeRuns()[0];
  assert.equal(run.phase, "decode");
  assert.equal(run.fetchedBytes, 67108864);
  assert.equal(run.totalBytes, 67108864);
  assert.ok(run.phaseStartedAtMs >= before.phaseStartedAtMs);
  assert.equal(run.startedAtMs, before.startedAtMs);
  // id lạ: false, không notify, không throw.
  assert.equal(markTrialDecodeStarted(999999), false);
  assert.equal(calls, 1);
  unsub();
});

test("beginTrialDecodeRun (Y5): mặc định phase decode, đủ sample ngay", () => {
  const id = beginTrialDecodeRun({ sampleBytes: 45067, timeoutMs: 200, viaWorker: false });
  const run = activeTrialDecodeRuns()[0];
  assert.equal(run.id, id);
  assert.equal(run.phase, "decode");
  assert.equal(run.fetchedBytes, 45067);
  assert.equal(run.totalBytes, 45067);
  assert.equal(run.phaseStartedAtMs, run.startedAtMs);
});

test("nhiều run (fetch + decode) cùng lúc, xếp cũ nhất trước; end dọn đúng run", () => {
  const fetchId = beginTrialFetchRun({
    sampleBytes: 67108864,
    timeoutMs: 78536,
    viaWorker: true,
    fetchedBytes: 262144,
  });
  const decodeId = beginTrialDecodeRun({ sampleBytes: 1000, timeoutMs: 200, viaWorker: false });
  const runs = activeTrialDecodeRuns();
  assert.equal(runs.length, 2);
  assert.equal(runs[0].id, fetchId);
  assert.equal(runs[0].phase, "fetch");
  assert.equal(runs[1].id, decodeId);
  assert.equal(runs[1].phase, "decode");
  // Run fetch xong trước: decode run vẫn còn (toast chuyển sang run đó).
  endTrialDecodeRun(fetchId);
  assert.deepEqual(activeTrialDecodeRuns().map((r) => r.id), [decodeId]);
  endTrialDecodeRun(decodeId);
  assert.equal(activeTrialDecodeRuns().length, 0);
});

console.log(
  `trialFetchRunning72Z5: ${pass} pass, ${fail} fail${failedNames.length ? ` — FAILED: ${failedNames.join("; ")}` : ""}`,
);
if (fail > 0) process.exitCode = 1;
