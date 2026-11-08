// previewRafHook66T5.test.ts — Phase 9 đợt 66, luồng T5: hồi quy bug n=0
// của RAF_STATS_FN (nợ R64 §8.3, R65 §8 mục 4).
//
// Gốc rễ: `__vcutPreviewRaf.samples` là ring buffer tối đa maxSamples
// (mặc định 5000) — mẫu cũ bị đẩy ra khi đầy. Các harness cũ cắt mẫu
// theo CHỈ SỐ TUYỆT ĐỐI `samples.slice(fromIdx)` với fromIdx =
// samples.length lúc đầu slot; sau ~83 s rAF (~5000 tick) fromIdx vượt
// độ dài buffer → slice rỗng → `{ n: 0 }` ở mọi slot sau đó, dù vòng
// preview vẫn tick. Bản sửa (đợt 66 T5, đã backport sang
// clicktest-64r3-fps-long.mjs, clicktest-61r3-fps-cal.mjs,
// bench-preview-fps.mjs) cắt theo TIMESTAMP: `x.t >= t0 && x.t <= t1`.
//
// Test này chạy logic cắt của CẢ HAI bản (sao chép nguyên văn biểu thức
// lọc từ harness) trên hook THẬT (createPreviewRafHook với maxSamples
// nhỏ để mô phỏng wrap nhanh), chứng minh: bản cũ → n=0 sau wrap,
// bản mới → đúng số mẫu trong cửa sổ; và bản mới cho cùng kết quả với
// bản cũ khi buffer chưa wrap (không đổi hành vi trước wrap).
//
// Chạy bằng esbuild bundle (mẫu test của repo, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/previewRafHook66T5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round66-t5/previewRafHook66T5.test.cjs \
//     && node /tmp/round66-t5/previewRafHook66T5.test.cjs
import assert from "node:assert/strict";
import {
  analyzePreviewRafPhase,
  createPreviewRafHook,
  type PreviewRafSample,
} from "./previewRafHook";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  exitCode: number | undefined;
};

let n = 0;
function check(name: string, fn: () => void) {
  n++;
  fn();
  console.log(`ok ${n} - ${name}`);
}

/** Biểu thức cắt CŨ trong harness (chỉ số tuyệt đối) — nguyên văn. */
function rafStatsLegacy(samples: PreviewRafSample[], fromIdx: number) {
  if (fromIdx < 0) return null;
  const s = samples.slice(fromIdx).filter((x) => x.playing && !x.justWoke);
  if (!s.length) return { n: 0 };
  const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
  const p = (q: number) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  return { n: s.length, gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1) };
}

/** Biểu thức cắt MỚI trong harness (timestamp) — nguyên văn. */
function rafStatsByTimestamp(samples: PreviewRafSample[], t0: number, t1: number) {
  const s = samples.filter((x) => x.t >= t0 && x.t <= t1 && x.playing && !x.justWoke);
  if (!s.length) return { n: 0 };
  const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
  const p = (q: number) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  return { n: s.length, gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1) };
}

/** Ghi `count` tick rAF đều 16,7 ms vào hook, bắt đầu tại t = tStart. */
function recordTicks(
  hook: ReturnType<typeof createPreviewRafHook>,
  count: number,
  tStart: number,
  stepMs = 16.7,
) {
  let last = tStart - stepMs;
  for (let i = 0; i < count; i++) {
    const now = tStart + i * stepMs;
    hook.record(now, last, true, false, false, i * stepMs / 1000);
    last = now;
  }
}

// 1. TÁI HIỆN BUG: buffer 50 mẫu, ghi 200 tick → wrap 4 lần. Mốc đầu
// slot lấy theo mẫu cũ (fromIdx = samples.length = 50, đã đầy) thì
// bản cũ trả n=0 dù buffer vẫn giữ 50 mẫu đang phát.
check("bản cũ (slice theo chỉ số tuyệt đối) trả n=0 sau khi ring buffer wrap", () => {
  const hook = createPreviewRafHook(50);
  recordTicks(hook, 200, 1000);
  assert.equal(hook.samples.length, 50);
  assert.equal(hook.samples.filter((x) => x.playing && !x.justWoke).length, 50);
  const fromIdx = hook.samples.length; // mẫu harness cũ: lấy length lúc đầu slot
  assert.equal(fromIdx, 50);
  assert.deepEqual(rafStatsLegacy(hook.samples, fromIdx), { n: 0 });
});

// 2. Bản mới trên cùng buffer đã wrap: cửa sổ 30 tick cuối → đúng n=30,
// gapP50 ≈ 16,7 ms (không bị n=0).
check("bản mới (cắt theo timestamp) trả đúng n sau wrap", () => {
  const hook = createPreviewRafHook(50);
  recordTicks(hook, 200, 1000);
  const tEnd = 1000 + 199 * 16.7;
  const t0 = tEnd - 29.5 * 16.7; // 30 tick cuối, biên lệch nửa bước để tránh sai số float tại biên
  const r = rafStatsByTimestamp(hook.samples, t0, tEnd);
  assert.equal(r.n, 30);
  assert.ok(r.gapP50 !== undefined);
  assert.ok(Math.abs(r.gapP50 - 16.7) < 0.01, `gapP50=${r.gapP50}`);
});

// 3. Cửa sổ cắt ngang biên wrap: chỉ mẫu còn trong buffer được đếm
// (mẫu đã bị đẩy ra thì mất — giới hạn đã ghi trong doc hook; harness
// giữ slot ≤ 10–20 s nên không chạm giới hạn này).
check("cửa sổ vượt biên wrap chỉ đếm mẫu còn trong buffer", () => {
  const hook = createPreviewRafHook(50);
  recordTicks(hook, 200, 1000);
  const tFirstSurviving = hook.samples[0].t;
  // Cửa sổ [biên - 10,5 bước, biên + 9,5 bước]: 10 mẫu đầu còn trong
  // buffer, biên lệch nửa bước để tránh sai số float tại biên.
  const r = rafStatsByTimestamp(hook.samples, tFirstSurviving - 10.5 * 16.7, tFirstSurviving + 9.5 * 16.7);
  assert.equal(r.n, 10);
});

// 4. Cửa sổ trống hoàn toàn (trước mẫu đầu tiên) → { n: 0 } hợp lệ
// (không phải bug — phân biệt với n=0 giả của bản cũ ở test 1).
check("cửa sổ không chứa mẫu nào → { n: 0 } hợp lệ", () => {
  const hook = createPreviewRafHook(50);
  recordTicks(hook, 200, 1000);
  assert.deepEqual(rafStatsByTimestamp(hook.samples, 0, 500), { n: 0 });
});

// 5. Hai bản cho CÙNG kết quả khi buffer chưa wrap (không đổi hành vi
// trước wrap): 40 tick, mốc tại tick 10 → cùng n=30, cùng gapP50.
check("chưa wrap: bản mới và bản cũ cho cùng n và gapP50", () => {
  const hook = createPreviewRafHook(50);
  recordTicks(hook, 40, 1000);
  const fromIdx = 10; // length tại "đầu slot" sau 10 tick
  const legacy = rafStatsLegacy(hook.samples, fromIdx);
  const t0 = 1000 + 10 * 16.7;
  const t1 = 1000 + 39 * 16.7;
  const fixed = rafStatsByTimestamp(hook.samples, t0, t1);
  assert.ok(legacy);
  assert.equal(legacy.n, 30);
  assert.equal(fixed.n, 30);
  assert.equal(legacy.gapP50, fixed.gapP50);
});

// 6. Quy mô thật: buffer mặc định 5000, ghi 6000 tick (~100 s rAF).
// Mốc tuyệt đối 5000 → bản cũ n=0; cửa sổ 10 s cuối (~600 tick) →
// bản mới n≈600 (600 tick trong 10 s, trừ biên).
check("quy mô thật (5000 mẫu, 6000 tick): bản cũ n=0, bản mới n≈600", () => {
  const hook = createPreviewRafHook(); // mặc định 5000
  recordTicks(hook, 6000, 1000);
  assert.equal(hook.samples.length, 5000);
  assert.deepEqual(rafStatsLegacy(hook.samples, 5000), { n: 0 });
  const tEnd = 1000 + 5999 * 16.7;
  const r = rafStatsByTimestamp(hook.samples, tEnd - 10_000, tEnd);
  assert.ok(r.n >= 590 && r.n <= 601, `n=${r.n}`);
});

// 7. analyzePreviewRafPhase vẫn chạy đúng trên buffer đã wrap
// (đếm toàn bộ mẫu còn lại, không phụ thuộc mốc ngoài).
check("analyzePreviewRafPhase đếm đủ mẫu còn trong buffer đã wrap", () => {
  const hook = createPreviewRafHook(50);
  recordTicks(hook, 200, 1000);
  const wallMs = hook.samples[hook.samples.length - 1].t - hook.samples[0].t;
  const a = analyzePreviewRafPhase(hook.samples, wallMs);
  assert.equal(a.count, 50);
  assert.ok(a.gapP50ms !== null && Math.abs(a.gapP50ms - 16.7) < 0.01);
  assert.equal(a.over100ms, 0);
});

// 8. Mẫu justWoke trong cửa sổ vẫn bị loại ở cả hai bản (không đổi
// ngữ nghĩa lọc).
check("mẫu justWoke bị loại khỏi cả hai bản cắt", () => {
  const hook = createPreviewRafHook(50);
  let last = 1000 - 16.7;
  for (let i = 0; i < 10; i++) {
    const now = 1000 + i * 16.7;
    hook.record(now, last, true, false, i === 5, i * 16.7 / 1000);
    last = now;
  }
  const legacy = rafStatsLegacy(hook.samples, 0);
  const fixed = rafStatsByTimestamp(hook.samples, 1000, 1000 + 9 * 16.7);
  assert.ok(legacy);
  assert.equal(legacy.n, 9);
  assert.equal(fixed.n, 9);
});

console.log(`previewRafHook66T5: ${n}/${n} pass`);
