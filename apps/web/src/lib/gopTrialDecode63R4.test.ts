// gopTrialDecode63R4.test.ts — Phase 9 đợt 63, luồng R4: đóng nợ đợt 62
// §4 mục 4 (LIMITS R4 đợt 62 §6.1–§6.3 + §2.5):
//   (1) Trần worker 30 s không đủ cho keyframe 42–64 MiB lúc tải nặng:
//       đo lại ở 3 mức tải (xem LIMITS R4 đợt 63 §2) → nâng tỉ lệ
//       1,0 → 1,2 ms/KiB và trần 30 s → 45 s. 1,2 ≈ 1,5× tốc độ decode
//       chậm nhất ở tải trung bình (1,00 ms/KiB); trần 45 s bao được
//       decode 37–42 MB ở tải trung bình (35–42 s); tải cực nặng
//       (1,6–2,1 ms/KiB) vẫn vượt trần ở mọi mức trần hợp lý nên giữ
//       fail-open có lý do thay vì kéo trần lên 60–70 s.
//       Đợt 64 R10 nâng trần lên 60 s (xem LIMITS R10 đợt 64 §2–§3):
//       đo trực tiếp High-profile 50–58 MB cần 39,8–58,0 s ở tải
//       trung bình — trần 45 s không bao được 57,9 MB (fail-open cả
//       2 rep) và chỉ vừa đủ 49,7–51,8 MB (headroom ~1,03×).
//       Các test công thức dưới đây đã cập nhật theo trần 60 s;
//       tỉ lệ 1,2 giữ nguyên.
//   (2) Fallback khi không có VideoDecoder: khóa bằng test Node ở đây
//       (worker báo lỗi → fallback; fallback null → reject để
//       runTrialDecode fail-open; signal đã abort → không spawn worker)
//       + đo headed thật ở run B (worker-no-vd + main-no-vd, xem LIMITS §3).
//   (3) T3-null 4,9 s của R7: điều tra headed ở run A (14 lần null sau
//       probe/abort, heap 210–254 MB, tải nặng — không lặp lại, max
//       281 ms; xem LIMITS §5) — không có code sửa cho mục này.
//   (4) Safari/Firefox: đo Firefox thật ở run FF (xem LIMITS §4);
//       Safari vẫn chưa đo được.
//
// Chạy bằng esbuild bundle (mẫu L8/Q5/R7/R4, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode63R4.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/r4-63.test.mjs \
//     && node <scratch>/r4-63.test.mjs
import assert from "node:assert/strict";
import {
  MAX_TRIAL_DECODE_TIMEOUT_MS,
  runTrialDecode,
} from "./gopTrialDecode55L8.ts";
import {
  MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS,
  WORKER_TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB,
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
  console.log(`gopTrialDecode63R4: ${pass}/${queue.length} test pass`);
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

// ---- (1) Công thức mới: tỉ lệ 1,2 ms/KiB, trần 60 s (đợt 64 R10) ----

ok("formula 63: hằng số mới — tỉ lệ 1,2 ms/KiB, trần 60 s (đợt 64 R10 nâng từ 45 s)", () => {
  assert.equal(WORKER_TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB, 1.2);
  assert.equal(MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS, 60_000);
});

ok("formula 63: 30.727.296 B → 35902 ms (chưa chạm trần)", () => {
  // 200 + ceil((30.727.296 − 262.144) / 1024 × 1,2) = 200 + 35.702.
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(30_727_296, 200), 35_902);
});

ok("formula 63: 37.168.458 B → 43450 ms (chưa chạm trần; công thức cũ cho 29,7 s)", () => {
  // 200 + ceil((37.168.458 − 262.144) / 1024 × 1,2) = 200 + 43.250.
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(37_168_458, 200), 43_450);
});

ok("formula 63: 42.493.646 B → 49691 ms (không chạm trần 60 s; trần 45 s cũ sẽ cắt)", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(42_493_646, 200), 49_691);
});

ok("formula 63: 50.246.362 B (crf0) → 58776 ms; 64 MiB → trần 60 s", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(50_246_362, 200), 58_776);
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(64 * 1024 * 1024, 200), 60_000);
});

ok("formula 63: timeout đơn điệu theo kích thước (30 MB < 37 MB < 42 MB < 50 MB < trần)", () => {
  const t30 = trialDecodeTimeoutForSampleSizeWorker(30_727_296, 200);
  const t37 = trialDecodeTimeoutForSampleSizeWorker(37_168_458, 200);
  const t42 = trialDecodeTimeoutForSampleSizeWorker(42_493_646, 200);
  const t50 = trialDecodeTimeoutForSampleSizeWorker(50_246_362, 200);
  assert.ok(t30 < t37, `t30=${t30} t37=${t37}`);
  assert.ok(t37 < t42, `t37=${t37} t42=${t42}`);
  assert.ok(t42 < t50, `t42=${t42} t50=${t50}`);
  assert.ok(t50 < MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS, `t50=${t50}`);
});

ok("formula 63: routing 42.493.646 B → worker, timeout 49691 ms (trần mới 60 s)", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 42_493_646,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(plan.timeoutMs, 49_691);
  assert.equal(MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS, 60_000);
});

// ---- (2) Fallback khi không có VideoDecoder (mức unit) ----

ok("fallback 63: worker báo lỗi no-decoder-in-worker → fallback main-thread, terminate 1 lần", async () => {
  const fake = new FakeWorker();
  let fallbackCalls = 0;
  const fallback: GopTrialDecodeProbe = async () => {
    fallbackCalls++;
    return true;
  };
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), fallback);
  const p = probe!(fakeSample(500), FAKE_CONFIG);
  // Đây đúng là thông điệp worker production gửi khi
  // createBrowserTrialDecodeProbe() trả null trong worker.
  fake.fail("no-decoder-in-worker: VideoDecoder không có trong worker");
  assert.equal(await p, true);
  assert.equal(fallbackCalls, 1);
  assert.equal(fake.terminateCalls, 1);
});

ok("fallback 63: worker báo lỗi + fallback trả unsupported-config → giữ nguyên outcome (fail-open ở trên)", async () => {
  const fake = new FakeWorker();
  const fallback: GopTrialDecodeProbe = async () => "unsupported-config";
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), fallback);
  const p = probe!(fakeSample(500), FAKE_CONFIG);
  fake.fail("no-decoder-in-worker");
  assert.equal(await p, "unsupported-config");
});

ok("fallback 63: worker báo lỗi + không có fallback → reject, runTrialDecode fail-open probe-error", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), null);
  const p = probe!(fakeSample(500), FAKE_CONFIG);
  fake.fail("no-decoder-in-worker");
  await assert.rejects(p, /trial-decode worker failed/);
  // Qua runTrialDecode: reject → fail-open, không decode-failed oan.
  const fake2 = new FakeWorker();
  const probe2 = createWorkerTrialDecodeProbe(fakeFactory(fake2), null);
  const pr = runTrialDecode(probe2, fakeSample(500), FAKE_CONFIG, 5000);
  await new Promise((r) => setTimeout(r, 0));
  fake2.fail("no-decoder-in-worker");
  const result = await pr;
  assert.equal(result.passed, true);
  assert.equal(result.skipped, true);
  assert.ok(result.reason.startsWith("probe-error:"), `reason=${result.reason}`);
});

ok("fallback 63: worker onerror + fallback null → reject (không nuốt thành true)", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), null);
  const p = probe!(fakeSample(500), FAKE_CONFIG);
  fake.errorOut();
  await assert.rejects(p, /trial-decode worker failed/);
});

ok("fallback 63: signal đã abort trước khi gọi → trả false ngay, không spawn worker", async () => {
  const fake = new FakeWorker();
  const probe = createWorkerTrialDecodeProbe(fakeFactory(fake), MAIN_THREAD_PROBE);
  const controller = new AbortController();
  controller.abort();
  assert.equal(await probe!(fakeSample(500), FAKE_CONFIG, controller.signal), false);
  assert.equal(fake.posted.length, 0);
  assert.equal(fake.terminateCalls, 0);
});

ok("fallback 63: defaultProbe null + sample lớn + factory → vẫn đi worker (cứu được khi main không có decoder)", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 42_493_646,
    baseTimeoutMs: 200,
    defaultProbe: null,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(typeof plan.probe, "function");
  assert.equal(plan.timeoutMs, 49_691);
});

await runAll();
