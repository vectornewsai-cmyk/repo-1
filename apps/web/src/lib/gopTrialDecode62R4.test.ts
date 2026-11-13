// gopTrialDecode62R4.test.ts — Phase 9 đợt 62, luồng R4: đóng nợ đợt 61
// §5.7 (LIMITS R7 §6.1): keyframe lớn vẫn fail-open trong trial-decode /
// GOP — cần worker nền HOẶC quyết tăng trần (đo và quyết bằng bằng chứng).
//
// Hướng đã chọn (sau khi đo — xem LIMITS R4): decode keyframe lớn ở
// WORKER nền (VideoDecoder chạy trong DedicatedWorker), không tăng trần
// main-thread (kẹt UI + tăng trần cũng không sửa chắc được — R7 §2.6).
//   - Sample mà timeout main-thread chạm trần 2500 ms (≳ 7,7 MiB với
//     base 200 ms) thì đi worker với trần riêng dài hơn (60 s) + tỉ lệ
//     1,2 ms/KiB (đợt 63 R4 nâng từ 30 s / 1,0 lên 45 s; đợt 64 R10
//     nâng trần lên 60 s — xem LIMITS R10 đợt 64 §2).
//   - Sample nhỏ hơn giữ nguyên đường main-thread + timeout cũ (không
//     đổi hành vi, không tốn phí spawn worker cho mọi lần mở file).
//   - Worker không dựng được (không có Worker global / CSP / lỗi load)
//     → fallback về probe main-thread với trần 2500 ms cũ (hành vi cũ).
//   - Timeout thắng race → runTrialDecode abort signal → worker probe
//     `terminate()` worker ngay (hủy chắc hơn cả `close()` của R7).
//   - Sample được chuyển vào worker bằng BẢN SAO (transfer) để buffer
//     gốc của caller không bị neuter.
//
// Chạy bằng esbuild bundle (mẫu L8/Q5/R7, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode62R4.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/r4.test.mjs \
//     && node <scratch>/r4.test.mjs
import assert from "node:assert/strict";
import {
  DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  MAX_TRIAL_DECODE_TIMEOUT_MS,
  runTrialDecode,
  trialDecodeTimeoutForSampleSize,
} from "./gopTrialDecode55L8.ts";
import {
  MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS,
  createWorkerTrialDecodeProbe,
  planTrialDecodeCall,
  trialDecodeTimeoutForSampleSizeWorker,
} from "./gopTrialDecodeWorker62R4.ts";
import type {
  GopTrialDecodeProbe,
  GopTrialDecodeProbeOutcome,
  TrialDecodeConfig,
} from "./gopTrialDecode55L8.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => Promise<void> | void }> = [];
function ok(name: string, fn: () => Promise<void> | void): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`gopTrialDecode62R4: ${pass}/${queue.length} test pass`);
}

const FAKE_CONFIG: TrialDecodeConfig = {
  codec: "avc1.64001F",
  codedWidth: 1280,
  codedHeight: 720,
  description: new Uint8Array([0, 0, 0, 1, 103, 100, 0, 31]),
};

function fakeSample(size: number): Uint8Array {
  const b = new Uint8Array(size);
  for (let i = 0; i < size; i++) b[i] = i % 251;
  return b;
}

const MAIN_THREAD_PROBE: GopTrialDecodeProbe = async () => true;

/** Worker giả: ghi lại postMessage/terminate, test tự lái onmessage/onerror. */
class FakeWorker {
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  posted: Array<{ message: Record<string, unknown>; transfer?: readonly unknown[] }> = [];
  terminateCalls = 0;
  postMessage(message: Record<string, unknown>, transfer?: readonly unknown[]): void {
    this.posted.push({ message, transfer });
  }
  terminate(): void {
    this.terminateCalls++;
  }
  respond(outcome: GopTrialDecodeProbeOutcome): void {
    this.onmessage?.({ data: { type: "result", outcome } });
  }
  fail(message: string): void {
    this.onmessage?.({ data: { type: "error", message } });
  }
  errorOut(): void {
    this.onerror?.(new Error("worker load failed"));
  }
}

function fakeFactory(fake: FakeWorker): () => Worker {
  return () => fake as unknown as Worker;
}

// ---- Timeout worker: công thức + trần ----

ok("worker timeout: sample ≤ 256 KiB giữ nguyên base 200 ms", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(200_000, 200), 200);
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(262_144, 200), 200);
  assert.equal(
    trialDecodeTimeoutForSampleSizeWorker(100_000),
    DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  );
  // 300.148 B vượt ngưỡng 256 KiB → 200 + ceil(38.004/1024 × 1,2) = 245 ms.
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(300_148, 200), 245);
});

ok("worker timeout: keyframe 4K nhiễu 4.107.475 B → 4707 ms (tỉ lệ 1,2 ms/KiB)", () => {
  // 200 + ceil((4.107.475 − 262.144) / 1024 × 1,2) = 200 + 4507.
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(4_107_475, 200), 4707);
});

ok("worker timeout: keyframe 42.493.646 B → 49691 ms (không chạm trần 90 s; trần 45 s cũ sẽ cắt — đợt 67 U5)", () => {
  assert.equal(
    trialDecodeTimeoutForSampleSizeWorker(42_493_646, 200),
    49_691,
  );
  assert.equal(MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS, 90_000);
});

ok("worker timeout: 64 MiB → 78536 ms (không chạm trần 90 s; trần 60 s cũ cắt ở 60000 ms — đợt 67 U5); base không hợp lệ → dùng mặc định 200 ms", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(64 * 1024 * 1024, 200), 78_536);
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(100_000, 0), 200);
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(100_000, Number.NaN), 200);
});

// ---- Routing: planTrialDecodeCall ----

ok("routing: sample nhỏ 300.148 B → main-thread, timeout 212 ms, không worker", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 300_148,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, false);
  assert.equal(plan.probe, MAIN_THREAD_PROBE);
  assert.equal(plan.timeoutMs, trialDecodeTimeoutForSampleSize(300_148, 200));
  assert.equal(plan.timeoutMs, 212);
  assert.equal(fake.terminateCalls, 0);
});

ok("routing: sample 9.683.047 B (timeout main-thread chạm trần) → worker, timeout 11241 ms", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 9_683_047,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.notEqual(plan.probe, MAIN_THREAD_PROBE);
  assert.equal(plan.timeoutMs, trialDecodeTimeoutForSampleSizeWorker(9_683_047, 200));
  assert.equal(plan.timeoutMs, 11241);
  assert.equal(trialDecodeTimeoutForSampleSize(9_683_047, 200), MAX_TRIAL_DECODE_TIMEOUT_MS);
});

ok("routing: probe inject (allowWorker=false) + sample lớn → giữ probe inject, trần 2500 ms", () => {
  const injected: GopTrialDecodeProbe = async () => false;
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 42_493_646,
    baseTimeoutMs: 200,
    defaultProbe: injected,
    allowWorker: false,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, false);
  assert.equal(plan.probe, injected);
  assert.equal(plan.timeoutMs, MAX_TRIAL_DECODE_TIMEOUT_MS);
  assert.equal(fake.posted.length, 0);
});

ok("routing: không có Worker (Node, không factory) + sample lớn → fallback main-thread, lý do no-worker", () => {
  const plan = planTrialDecodeCall({
    sampleBytes: 42_493_646,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
  });
  assert.equal(plan.viaWorker, false);
  assert.equal(plan.probe, MAIN_THREAD_PROBE);
  assert.equal(plan.timeoutMs, MAX_TRIAL_DECODE_TIMEOUT_MS);
  assert.equal(plan.workerUnavailableReason, "no-worker");
});

ok("routing: defaultProbe null + sample lớn + có factory → vẫn đi worker", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 19_720_025,
    baseTimeoutMs: 200,
    defaultProbe: null,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(typeof plan.probe, "function");
  assert.equal(plan.timeoutMs, trialDecodeTimeoutForSampleSizeWorker(19_720_025, 200));
});

// ---- Worker probe với FakeWorker ----

ok("worker probe: decode-ok → true, terminate đúng 1 lần, sample gốc không bị neuter", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  assert.notEqual(probe, null);
  const sample = fakeSample(1_000);
  const p = probe!(sample, FAKE_CONFIG);
  assert.equal(fake.posted.length, 1);
  // Sample chuyển vào worker là BẢN SAO (buffer khác), transfer đúng buffer đó.
  const postedSample = fake.posted[0].message.sample as ArrayBuffer;
  assert.ok(postedSample instanceof ArrayBuffer);
  assert.notEqual(postedSample, sample.buffer);
  assert.equal(postedSample.byteLength, sample.byteLength);
  assert.equal(fake.posted[0].transfer?.[0], postedSample);
  // Config đi kèm nguyên vẹn.
  const postedConfig = fake.posted[0].message.config as TrialDecodeConfig;
  assert.equal(postedConfig.codec, FAKE_CONFIG.codec);
  assert.equal(postedConfig.codedWidth, 1280);
  fake.respond(true);
  assert.equal(await p, true);
  assert.equal(fake.terminateCalls, 1);
  // Buffer gốc còn nguyên (không bị neuter vì chỉ transfer bản sao).
  assert.equal(sample.buffer.byteLength, 1_000);
  assert.equal(sample[0], 0);
  assert.equal(sample[999], 999 % 251);
});

ok("worker probe: worker trả unsupported-config → giữ nguyên outcome", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const p = probe!(fakeSample(500), FAKE_CONFIG);
  fake.respond("unsupported-config");
  assert.equal(await p, "unsupported-config");
  assert.equal(fake.terminateCalls, 1);
});

ok("worker probe: worker báo lỗi → fallback main-thread, terminate 1 lần", async () => {
  const fake = new FakeWorker();
  let fallbackCalls = 0;
  const fallback: GopTrialDecodeProbe = async () => {
    fallbackCalls++;
    return false;
  };
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), fallback);
  const p = probe!(fakeSample(500), FAKE_CONFIG);
  fake.fail("no-decoder-in-worker");
  assert.equal(await p, false);
  assert.equal(fallbackCalls, 1);
  assert.equal(fake.terminateCalls, 1);
});

ok("worker probe: worker onerror (load lỗi) → fallback main-thread", async () => {
  const fake = new FakeWorker();
  let fallbackCalls = 0;
  const fallback: GopTrialDecodeProbe = async () => {
    fallbackCalls++;
    return true;
  };
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), fallback);
  const p = probe!(fakeSample(500), FAKE_CONFIG);
  fake.errorOut();
  assert.equal(await p, true);
  assert.equal(fallbackCalls, 1);
  assert.equal(fake.terminateCalls, 1);
});

ok("worker probe: factory ném lỗi (CSP) → fallback main-thread, không throw", async () => {
  let fallbackCalls = 0;
  const fallback: GopTrialDecodeProbe = async () => {
    fallbackCalls++;
    return true;
  };
  const throwingFactory = (): Worker => {
    throw new Error("CSP blocked worker");
  };
  const probe = createWorkerTrialDecodeProbe(throwingFactory, fallback);
  assert.equal(await probe!(fakeSample(500), FAKE_CONFIG), true);
  assert.equal(fallbackCalls, 1);
});

ok("worker probe: factory ném lỗi + không có fallback → reject (runTrialDecode sẽ fail-open)", async () => {
  const throwingFactory = (): Worker => {
    throw new Error("CSP blocked worker");
  };
  const probe = createWorkerTrialDecodeProbe(throwingFactory, null);
  await assert.rejects(probe!(fakeSample(500), FAKE_CONFIG), /worker/i);
});

ok("worker probe: abort signal → terminate ngay + reject, không chờ worker trả lời", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const controller = new AbortController();
  const p = probe!(fakeSample(500), FAKE_CONFIG, controller.signal);
  const settled = p.then(
    () => "resolved",
    () => "rejected",
  );
  controller.abort();
  assert.equal(await settled, "rejected");
  assert.equal(fake.terminateCalls, 1);
  // Worker trả lời muộn sau abort cũng không làm gì thêm (đã terminate).
  fake.respond(true);
  assert.equal(fake.terminateCalls, 1);
});

// ---- Tích hợp runTrialDecode + worker probe ----

ok("runTrialDecode + worker probe treo → timeout 50 ms fail-open + terminate worker", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const t0 = Date.now();
  const result = await runTrialDecode(probe, fakeSample(1_000), FAKE_CONFIG, 50);
  const elapsed = Date.now() - t0;
  assert.equal(result.passed, true);
  assert.equal(result.skipped, true);
  assert.ok(result.reason.startsWith("timeout-50ms"), `reason=${result.reason}`);
  assert.ok(elapsed < 1000, `elapsed=${elapsed}ms`);
  assert.equal(fake.terminateCalls, 1);
});

ok("runTrialDecode + worker probe trả false nhanh → decode-failed (không fail-open)", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const p = runTrialDecode(probe, fakeSample(1_000), FAKE_CONFIG, 5000);
  // runTrialDecode invoke probe trong microtask — đợi worker được tạo rồi mới trả lời.
  await new Promise((r) => setTimeout(r, 0));
  fake.respond(false);
  const result = await p;
  assert.equal(result.passed, false);
  assert.equal(result.skipped, false);
  assert.equal(result.reason, "decode-failed: VideoDecoder không decode được sample 0");
  assert.equal(fake.terminateCalls, 1);
});

ok("createWorkerTrialDecodeProbe: không factory + không có Worker global (Node) → null", () => {
  assert.equal(typeof Worker, "undefined");
  assert.equal(createWorkerTrialDecodeProbe(), null);
});

await runAll();
