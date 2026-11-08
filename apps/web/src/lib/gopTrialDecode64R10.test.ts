// gopTrialDecode64R10.test.ts — Phase 9 đợt 64, luồng R10: đo trực tiếp
// keyframe High-profile 50–64 MB + quyết định chính sách trần (nợ mở
// LIMITS R4 đợt 63 §8.2: High-profile 50–64 MB chưa đo trực tiếp, ngoại
// suy ~50–65 s > trần 45 s).
//
// ĐO (headed Chromium 158, worker trial-decode thật — xem LIMITS R10
// đợt 64 §2):
//   Run 1 (3 mức tải nhưng VM bị tải nền từ luồng đợt 64 khác ô nhiễm:
//   cpuCalib 14817–46404, loadavg tới 34): 24/24 rep timeout 45 s,
//   kể cả đối chứng 42,5 MB vốn decode-ok 37,9 s ở đợt 63 — số này chỉ
//   chứng minh tải nền làm mọi thứ fail, không dùng để quyết trần.
//   Run 2 (đo trực tiếp không trần + chạy lại có trần, tải trung bình:
//   cpuCalib 6391–9899, loadavg 1-phút 1,39–15,5):
//     49,7 MB (crf2): direct 47.142 / 41.711 ms; capped 39.762 / 41.208 ms
//     51,8 MB (crf1): direct 44.289 / 47.007 ms; capped 43.729 / 42.496 ms
//     57,9 MB (crf1-superfast): direct 53.232 / 57.992 ms;
//       capped 45.050 / 45.007 ms → timeout fail-open ×2.
//   Tốc độ decode đo được ở tải trung bình: 0,86–1,03 ms/KiB.
//
// QUYẾT ĐỊNH: trần 45 s → 60 s, tỉ lệ 1,2 ms/KiB GIỮ NGUYÊN.
//   - 60 s là trần tròn nhỏ nhất bao được mọi lần đo trực tiếp (max
//     57.992 ms) ở tải trung bình; 45 s không bao được 57,9 MB và chỉ
//     vừa đủ 49,7–51,8 MB (headroom ~1,03×).
//   - 1,2 ms/KiB đã đủ: tốc độ đo được max 1,03 ms/KiB → 1,2 ≈ 1,17×.
//   - Không kéo lên 70–80 s: tải cực nặng (1,6–2,1 ms/KiB, đợt 63)
//     cần 90–118 s cho 57,9 MB nên vẫn fail-open có lý do; keyframe
//     58–64 MiB ở tải trung bình ngoại suy ~60–66 s — chưa đo trực
//     tiếp được (không gen được fixture High-profile 58–64 MB dưới
//     trần trial 64 MiB: ultrafast nhảy vọt lên 74 MiB) nên vẫn có
//     thể fail-open ở dải này, không mạo nhận đã bao.
//   - Safari: vẫn chưa đo (không có trên VM) — ghi rõ, không claim.
//
// Chạy bằng esbuild bundle (mẫu L8/Q5/R7/R4, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode64R10.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/r10-64.test.mjs \
//     && node <scratch>/r10-64.test.mjs
import assert from "node:assert/strict";
import {
  MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS,
  WORKER_TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB,
  planTrialDecodeCall,
  trialDecodeTimeoutForSampleSizeWorker,
} from "./gopTrialDecodeWorker62R4.ts";
import type { GopTrialDecodeProbe } from "./gopTrialDecode55L8.ts";

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
  console.log(`gopTrialDecode64R10: ${pass}/${queue.length} test pass`);
}

const MAIN_THREAD_PROBE: GopTrialDecodeProbe = async () => true;

/** Worker giả tối thiểu (chỉ cần cho plan/routing — không gọi probe thật). */
class FakeWorker {
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  terminateCalls = 0;
  postMessage(): void {}
  terminate(): void {
    this.terminateCalls++;
  }
}

function fakeFactory(fake: FakeWorker): () => Worker {
  return () => fake as unknown as Worker;
}

// ---- Trần mới 60 s (tỉ lệ 1,2 giữ nguyên) ----

ok("cap 64: hằng số — tỉ lệ 1,2 ms/KiB, trần 60 s", () => {
  assert.equal(WORKER_TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB, 1.2);
  assert.equal(MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS, 60_000);
});

ok("cap 64: 42.493.646 B → 49691 ms (hết bị trần 45 s cũ cắt)", () => {
  // 200 + ceil((42.493.646 − 262.144) / 1024 × 1,2) = 200 + 49.491.
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(42_493_646, 200), 49_691);
});

ok("cap 64: 47.608.364 B (crf3, mốc cao nhất đợt 63) → 55684 ms", () => {
  // 200 + ceil((47.608.364 − 262.144) / 1024 × 1,2) = 200 + 55.484.
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(47_608_364, 200), 55_684);
});

ok("cap 64: 49.658.687 B (crf2, đã đo 41,7–47,1 s) → 58087 ms (chưa chạm trần)", () => {
  // 200 + ceil((49.658.687 − 262.144) / 1024 × 1,2) = 200 + 57.887.
  // Timeout 58.087 ms bao được lần đo chậm nhất 47.142 ms (headroom 1,23×).
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(49_658_687, 200), 58_087);
});

ok("cap 64: 50.388.107 B (crf1-veryfast) → 58942 ms (chưa chạm trần)", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(50_388_107, 200), 58_942);
});

ok("cap 64: 51.821.731 B (crf1, đã đo 42,5–47,0 s) → trần 60 s (không trần 60.622 ms)", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(51_821_731, 200), 60_000);
});

ok("cap 64: 57.939.416 B (crf1-superfast, đã đo 53,2–58,0 s) → trần 60 s (không trần 67.791 ms)", () => {
  // Trần 45 s cũ cắt cả 2 rep (45.050 / 45.007 ms fail-open); trần 60 s
  // bao được lần đo chậm nhất 57.992 ms (headroom 1,03× — mỏng, ghi rõ).
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(57_939_416, 200), 60_000);
});

ok("cap 64: 64 MiB → trần 60 s (không trần 78.536 ms; dải 58–64 MiB chưa đo trực tiếp)", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(64 * 1024 * 1024, 200), 60_000);
});

ok("cap 64: timeout đơn điệu theo kích thước, trần chỉ chạm từ ~51,8 MB trở lên", () => {
  const t42 = trialDecodeTimeoutForSampleSizeWorker(42_493_646, 200);
  const t47 = trialDecodeTimeoutForSampleSizeWorker(47_608_364, 200);
  const t49 = trialDecodeTimeoutForSampleSizeWorker(49_658_687, 200);
  const t51 = trialDecodeTimeoutForSampleSizeWorker(51_821_731, 200);
  const t57 = trialDecodeTimeoutForSampleSizeWorker(57_939_416, 200);
  const t64 = trialDecodeTimeoutForSampleSizeWorker(64 * 1024 * 1024, 200);
  assert.ok(t42 < t47 && t47 < t49, `t42=${t42} t47=${t47} t49=${t49}`);
  assert.ok(t49 < t51, `t49=${t49} t51=${t51}`);
  assert.equal(t51, t57);
  assert.equal(t57, t64);
  assert.equal(t64, MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS);
});

ok("cap 64: routing 57.939.416 B → worker, timeout 60000 ms (trần mới)", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 57_939_416,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(plan.timeoutMs, 60_000);
  assert.equal(plan.timeoutMs, MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS);
});

ok("cap 64: routing 49.658.687 B → worker, timeout 58087 ms (chưa chạm trần)", () => {
  const fake = new FakeWorker();
  const plan = planTrialDecodeCall({
    sampleBytes: 49_658_687,
    baseTimeoutMs: 200,
    defaultProbe: MAIN_THREAD_PROBE,
    allowWorker: true,
    workerFactory: fakeFactory(fake),
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(plan.timeoutMs, 58_087);
});

await runAll();
