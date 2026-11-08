// gopTrialDecode61R7.test.ts — Phase 9 đợt 61, luồng R7: đóng nợ đợt 60
// §5.7 (Q5 GOP decoder): (a) decoder timeout vẫn chạy nền sau timeout,
// (b) tốc độ decode chậm hơn P6 chưa rõ nguyên nhân (đo headed, xem
// LIMITS R7 — không có test Node cho (b) vì đó là số đo môi trường),
// (c) keyframe thật ≳16 MiB timeout → fail-open (đo ngưỡng headed, xem
// LIMITS R7 — không sửa timeout trong luồng này, xem §5 LIMITS).
//
// Thay đổi hợp đồng (đợt này):
//   - `GopTrialDecodeProbe` nhận thêm tham số thứ 3 tùy chọn
//     `signal?: AbortSignal` — probe cũ (2 tham số) vẫn gán được cho
//     kiểu mới, không đổi test cũ nào.
//   - `runTrialDecode` tạo AbortController, truyền `signal` cho probe,
//     và `abort()` khi timeout thắng race: probe tuân thủ signal phải
//     dừng công việc nền (browser probe gọi `VideoDecoder.close()` ngay
//     khi abort — đo headed: probe settle < 1 s sau abort thay vì
//     ~28 s như code cũ trên sample 42,5 MB).
//   - Probe thắng race thì KHÔNG abort (signal.aborted === false lúc
//     probe trả về) — không đổi hành vi đường decode-ok/decode-failed.
//   - Probe ném lỗi/reject SAU abort vẫn không gây unhandled rejection
//     (runTrialDecode đã gắn `.catch(()=>{})` từ trước).
//
// Chạy bằng esbuild bundle (mẫu L8/Q5, chạy từ gốc repo; file có
// top-level await nên phải bundle --format=esm + outfile .mjs):
//   ./node_modules/.bin/esbuild apps/web/src/lib/gopTrialDecode61R7.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/r7.test.mjs \
//     && node <scratch>/r7.test.mjs
import assert from "node:assert/strict";
import {
  MAX_TRIAL_DECODE_TIMEOUT_MS,
  runTrialDecode,
  trialDecodeTimeoutForSampleSize,
} from "./gopTrialDecode55L8.ts";
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
  console.log(`gopTrialDecode61R7: ${pass}/${queue.length} test pass`);
}

const FAKE_CONFIG: TrialDecodeConfig = {
  codec: "avc1.64001F",
  codedWidth: 1280,
  codedHeight: 720,
  description: new Uint8Array(0),
};

/** Guard: promise phải settle trong ms, không treo suite khi probe cũ không abort. */
function mustSettle<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    p.then((v) => {
      if (timer !== null) clearTimeout(timer);
      return v;
    }),
    new Promise<T>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}: không settle trong ${ms} ms`)), ms);
    }),
  ]);
}

/** Probe giả lập decoder nền: chỉ settle khi nhận abort (trả false), không thì treo mãi. */
function hangingProbeUntilAbort(record: {
  signal?: AbortSignal;
  settledAt?: number;
}): { probe: GopTrialDecodeProbe; settled: Promise<GopTrialDecodeProbeOutcome> } {
  let resolveSettled!: (v: GopTrialDecodeProbeOutcome) => void;
  const settled = new Promise<GopTrialDecodeProbeOutcome>((res) => {
    resolveSettled = res;
  });
  const probe: GopTrialDecodeProbe = (_sample, _config, signal) => {
    record.signal = signal;
    if (signal === undefined) {
      // Code cũ không truyền signal → probe treo mãi (đỏ-trước).
      return new Promise<GopTrialDecodeProbeOutcome>(() => {});
    }
    if (signal.aborted) {
      record.settledAt = Date.now();
      resolveSettled(false);
      return Promise.resolve(false);
    }
    signal.addEventListener(
      "abort",
      () => {
        record.settledAt = Date.now();
        resolveSettled(false);
      },
      { once: true },
    );
    return settled;
  };
  return { probe, settled };
}

ok("(r7-a) timeout 50 ms → probe nhận AbortSignal, bị abort, settle < 1000 ms sau khi runTrialDecode trả về", async () => {
  const record: { signal?: AbortSignal; settledAt?: number } = {};
  const { probe, settled } = hangingProbeUntilAbort(record);
  const sample = new Uint8Array(1024);
  const t1 = Date.now();
  const result = await mustSettle(
    runTrialDecode(probe, sample, FAKE_CONFIG, 50),
    2000,
    "runTrialDecode timeout 50ms",
  );
  const returnMs = Date.now() - t1;
  assert.equal(result.passed, true, "timeout phải fail-open (passed)");
  assert.equal(result.skipped, true, "timeout phải skipped");
  assert.match(result.reason, /^timeout-50ms/, `lý do phải là timeout-50ms, nhận ${result.reason}`);
  assert.ok(returnMs >= 40 && returnMs < 1000, `runTrialDecode phải trả về ~50 ms, thực tế ${returnMs} ms`);
  assert.ok(record.signal instanceof AbortSignal, "probe phải nhận được 1 AbortSignal");
  assert.equal(record.signal.aborted, true, "signal phải aborted sau timeout");
  const t2 = Date.now();
  const outcome = await mustSettle(settled, 2000, "probe settle sau abort");
  const settleAfterReturnMs = Date.now() - t2;
  assert.equal(outcome, false, "probe tuân thủ abort trả false (bị runTrialDecode bỏ qua vì race đã xong)");
  assert.ok(settleAfterReturnMs < 1000, `probe phải settle < 1000 ms sau abort, thực tế ${settleAfterReturnMs} ms`);
  assert.ok(
    record.settledAt !== undefined && record.settledAt - t1 - returnMs < 1000,
    "probe phải settle gần ngay sau khi runTrialDecode trả về, không chạy nền tiếp",
  );
  console.log(`    đo: runTrialDecode trả về sau ${returnMs} ms, probe settle thêm ${settleAfterReturnMs} ms sau abort`);
});

ok("(r7-a) probe trả false SAU abort vẫn tính timeout fail-open (không lật thành decode-failed)", async () => {
  const record: { signal?: AbortSignal } = {};
  const { probe } = hangingProbeUntilAbort(record);
  const result = await mustSettle(
    runTrialDecode(probe, new Uint8Array(1024), FAKE_CONFIG, 50),
    2000,
    "runTrialDecode timeout 50ms (probe false sau abort)",
  );
  assert.equal(result.passed, true, "timeout fail-open dù probe sau đó trả false");
  assert.equal(result.skipped, true);
  assert.match(result.reason, /^timeout-50ms/);
});

ok("(r7-a) probe reject SAU abort không gây unhandled rejection, runTrialDecode vẫn timeout fail-open", async () => {
  let captured: unknown = null;
  const onUnhandled = (e: unknown) => {
    captured = e;
  };
  process.on("unhandledRejection", onUnhandled);
  try {
    const probe: GopTrialDecodeProbe = (_sample, _config, signal) => {
      if (signal === undefined) return new Promise<never>(() => {});
      return new Promise<never>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("decoder aborted")), { once: true });
      });
    };
    const result = await mustSettle(
      runTrialDecode(probe, new Uint8Array(1024), FAKE_CONFIG, 50),
      2000,
      "runTrialDecode timeout 50ms (probe reject sau abort)",
    );
    assert.equal(result.passed, true);
    assert.equal(result.skipped, true);
    assert.match(result.reason, /^timeout-50ms/);
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(captured, null, `không được có unhandled rejection sau abort, nhận ${String(captured)}`);
  } finally {
    process.off("unhandledRejection", onUnhandled);
  }
});

ok("(r7-a) probe thắng race thì KHÔNG abort (signal.aborted === false lúc trả về)", async () => {
  let abortedAtResolve: boolean | null = null;
  let signalSeen: AbortSignal | undefined;
  const probe: GopTrialDecodeProbe = async (_sample, _config, signal) => {
    signalSeen = signal;
    await new Promise((r) => setTimeout(r, 10));
    abortedAtResolve = signal?.aborted ?? false;
    return true;
  };
  const result = await mustSettle(
    runTrialDecode(probe, new Uint8Array(1024), FAKE_CONFIG, 200),
    2000,
    "runTrialDecode decode-ok",
  );
  assert.equal(result.passed, true);
  assert.equal(result.skipped, false);
  assert.equal(result.reason, "decode-ok");
  assert.equal(abortedAtResolve, false, "probe thắng race thì signal không được aborted lúc probe trả về");
  assert.equal(signalSeen?.aborted, false, "signal không được aborted sau khi probe thắng race");
});

ok("(r7-a) probe cũ 2 tham số vẫn dùng được với runTrialDecode (tương thích ngược)", async () => {
  const legacyProbe = async (): Promise<boolean> => true;
  const result = await mustSettle(
    runTrialDecode(legacyProbe as GopTrialDecodeProbe, new Uint8Array(1024), FAKE_CONFIG, 200),
    2000,
    "runTrialDecode probe cũ",
  );
  assert.equal(result.passed, true);
  assert.equal(result.skipped, false);
  assert.equal(result.reason, "decode-ok");
});

ok("(r7-c) sample 42.493.646 B + probe treo → timeout đúng trần 2500 ms, probe bị abort và settle nhanh", async () => {
  const timeout = trialDecodeTimeoutForSampleSize(42_493_646);
  assert.equal(timeout, MAX_TRIAL_DECODE_TIMEOUT_MS, `sample 42,5 MB phải chạm trần ${MAX_TRIAL_DECODE_TIMEOUT_MS} ms, nhận ${timeout}`);
  const record: { signal?: AbortSignal; settledAt?: number } = {};
  const { probe, settled } = hangingProbeUntilAbort(record);
  // Sample 42,5 MB thật (kích thước như Q5) — probe giả không đọc nội dung.
  const sample = new Uint8Array(42_493_646);
  const t1 = Date.now();
  const result = await mustSettle(runTrialDecode(probe, sample, FAKE_CONFIG, timeout), 10000, "runTrialDecode 42MB timeout");
  const returnMs = Date.now() - t1;
  assert.equal(result.passed, true, "keyframe lớn timeout phải fail-open");
  assert.equal(result.skipped, true);
  assert.match(result.reason, /^timeout-2500ms/);
  assert.ok(returnMs >= 2400 && returnMs < 6000, `phải trả về ~2500 ms (trần), thực tế ${returnMs} ms`);
  assert.equal(record.signal?.aborted, true, "signal phải aborted khi timeout 2500 ms thắng");
  const outcome = await mustSettle(settled, 2000, "probe 42MB settle sau abort");
  assert.equal(outcome, false);
  console.log(`    đo: runTrialDecode 42,5 MB trả về sau ${returnMs} ms (trần 2500 ms), probe settle ngay sau abort`);
});

await runAll();
