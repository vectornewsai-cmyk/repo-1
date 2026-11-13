/**
 * keyframeBeyond90Round73A7.test.ts — Phase 9 đợt 73, luồng A7: đóng nợ
 * đợt 72 §4 mục 7 ("Keyframe — trần 90 s đã xác nhận không bao giờ là
 * ràng buộc; Safari chưa đo được").
 *
 * "Trần 90 s" ở đây là `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS = 90_000`
 * (trial-decode keyframe codec lớn ở worker nền — xem
 * gopTrialDecodeWorker62R4.ts, nâng 60 s → 90 s ở đợt 67 U5). Test này
 * khóa bằng code thật, trên cả 2 nghĩa của "keyframe":
 *
 *  (A) Keyframe animation (clip dài > 90 s): nội suy TS
 *      (packages/video-spec/src/keyframes.ts) + mirror JS render
 *      (server/render/src/keyframes.js) + speed curve (speedcurve.ts)
 *      với timestamp > 90 s — linear / ease-in / ease-out / clamp biên.
 *      Ràng buộc duy nhất của `keyframe.t` là [0, duration của clip]
 *      (validateAnimations), KHÔNG có hằng số 90 s nào trong đường này.
 *  (B) Trần worker 90 s không bao giờ ràng buộc: với mọi sample mà
 *      pipeline có thể gửi (cap T3 `MAX_TRIAL_DECODE_SAMPLE_BYTES`
 *      = 64 MiB), công thức timeout `200 + ceil((bytes-256KiB)/1024×1,2)`
 *      cho tối đa 78.536 ms < 90.000 ms (biên 11.464 ms). Trần chỉ bắt
 *      đầu cắt ở sample ≈ 73–74 MiB — ngoài miền cho phép.
 *
 * Chạy bằng esbuild bundle (mẫu 62R4/64R10, chạy từ gốc repo — các
 * module gop* dùng import tương đối không đuôi .ts nên strip-types
 * trực tiếp không resolve được):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/keyframeBeyond90Round73A7.test.ts \
 *     --bundle --platform=node --format=esm --outfile=/tmp/a7.test.mjs \
 *     && node /tmp/a7.test.mjs
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  interpolateKeyframes,
  normalizeKeyframes,
  validateAnimations,
  speedAt,
  normalizeSpeedKeyframes,
} from "@repo-1/video-spec";
import type { Keyframe } from "@repo-1/video-spec";
import {
  MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS,
  planTrialDecodeCall,
  trialDecodeTimeoutForSampleSizeWorker,
} from "./gopTrialDecodeWorker62R4.ts";
import { MAX_TRIAL_DECODE_SAMPLE_BYTES } from "./gopRangeFetch39T3.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { cwd: () => string; exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
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

function approx(actual: number, expected: number, eps = 1e-9): void {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `kỳ vọng ${expected}, nhận ${actual} (sai số ${Math.abs(actual - expected)})`,
  );
}

const kf = (t: number, v: number, easing: Keyframe["easing"] = "linear"): Keyframe => ({ t, v, easing });

// ---------------------------------------------------------------------------
// (A1) Nội suy keyframe animation (TS) với timestamp > 90 s
// ---------------------------------------------------------------------------

test("(A1) linear: keyframe 0/90/180/300 s — nội suy đúng ở 95/120/150/270 s", () => {
  const kfs = [kf(0, 0), kf(90, 90), kf(180, 180), kf(300, 300)];
  approx(interpolateKeyframes(kfs, 95), 95);
  approx(interpolateKeyframes(kfs, 120), 120);
  approx(interpolateKeyframes(kfs, 150), 150);
  approx(interpolateKeyframes(kfs, 270), 270);
  // Clip dài 1 giờ: keyframe ở 3600 s vẫn nội suy/clamp đúng.
  const hour = [kf(0, 0), kf(3600, 100)];
  approx(interpolateKeyframes(hour, 1800), 50);
  approx(interpolateKeyframes(hour, 3599), 99.97222222222223, 1e-9);
  approx(interpolateKeyframes(hour, 3600), 100);
  approx(interpolateKeyframes(hour, 7200), 100); // quá keyframe cuối → clamp về giá trị cuối
  approx(interpolateKeyframes(hour, -5), 0); // trước keyframe đầu → clamp về giá trị đầu
});

test("(A1) ease-in / ease-out ở đoạn [90, 180]: p=0,5 → 0,25 / 0,75", () => {
  approx(interpolateKeyframes([kf(90, 0, "ease-in"), kf(180, 100)], 135), 25);
  approx(interpolateKeyframes([kf(90, 0, "ease-out"), kf(180, 100)], 135), 75);
  // Easing của keyframe BẮT ĐẦU đoạn quyết định cả đoạn, kể cả khi đoạn bắt đầu sau 90 s.
  approx(interpolateKeyframes([kf(90, 0, "ease-in"), kf(180, 100, "ease-out")], 135), 25);
});

test("(A1) một keyframe duy nhất ở t=200 s → hằng số ở mọi t, kể cả 3600 s", () => {
  const kfs = [kf(200, 7)];
  approx(interpolateKeyframes(kfs, 200), 7);
  approx(interpolateKeyframes(kfs, 3600), 7);
  approx(interpolateKeyframes(kfs, 0), 7);
});

test("(A1) chưa sắp xếp + trùng t sau 90 s: keyframe sau thắng, nội suy tiếp đúng", () => {
  const kfs = [kf(300, 30), kf(120, 12), kf(120, 99)];
  approx(interpolateKeyframes(kfs, 120), 99);
  approx(interpolateKeyframes(kfs, 210), 64.5); // (120,99)→(300,30), p=0,5
  assert.deepEqual(normalizeKeyframes(kfs).map((k) => k.t), [120, 300]);
});

test("(A1) opacity 0→1 trên đoạn [0, 150]: t=150 đạt 1, t=151 clamp ở 1", () => {
  const kfs = [kf(0, 0), kf(150, 1)];
  approx(interpolateKeyframes(kfs, 150), 1);
  approx(interpolateKeyframes(kfs, 151), 1);
  approx(interpolateKeyframes(kfs, 75), 0.5);
});

// ---------------------------------------------------------------------------
// (A2) validateAnimations: ràng buộc duy nhất là [0, duration của clip]
// ---------------------------------------------------------------------------

test("(A2) clip 300 s: keyframe t=150 và t=300 hợp lệ, t=301 mới lỗi", () => {
  const anims = { scale: { keyframes: [kf(0, 1), kf(150, 2), kf(300, 1)] } };
  assert.deepEqual(validateAnimations(anims, 300), []);
  const tooFar = validateAnimations({ scale: { keyframes: [kf(301, 1)] } }, 300);
  assert.equal(tooFar.length, 1);
  assert.ok(tooFar[0].includes("[0, 300]"), `lỗi phải nêu đúng [0, 300]: ${tooFar[0]}`);
});

test("(A2) clip 3600 s: keyframe t=3599 hợp lệ — không có trần 90 s", () => {
  assert.deepEqual(validateAnimations({ rotation: { keyframes: [kf(3599, 45)] } }, 3600), []);
});

test("(A2) clip 90 s: t=91 lỗi — chứng tỏ bound đi theo duration, không phải hằng 90", () => {
  const errs = validateAnimations({ x: { keyframes: [kf(91, 0.5)] } }, 90);
  assert.equal(errs.length, 1);
  assert.ok(errs[0].includes("[0, 90]"));
});

// ---------------------------------------------------------------------------
// (A3) Speed keyframes (speedAt) với timestamp > 90 s
// ---------------------------------------------------------------------------

test("(A3) speedAt: curve 0/120/240 s — nội suy đúng ở 150 s, clamp ở 300/3600 s", () => {
  const curve = {
    keyframes: [
      { t: 0, v: 1, easing: "linear" as const },
      { t: 120, v: 2, easing: "linear" as const },
      { t: 240, v: 4, easing: "linear" as const },
    ],
  };
  approx(speedAt(curve, 150), 2.5);
  approx(speedAt(curve, 300), 4);
  approx(speedAt(curve, 3600), 4);
  assert.deepEqual(normalizeSpeedKeyframes(curve.keyframes).map((k) => k.t), [0, 120, 240]);
});

// ---------------------------------------------------------------------------
// (A4) Mirror JS render (server/render/src/keyframes.js) — cùng timestamp > 90 s
// ---------------------------------------------------------------------------

// Mẫu speedcurveTrim.test.ts (đợt 62 R9): resolve từ process.cwd() +
// createRequire bằng ĐƯỜNG DẪN TUYỆT ĐỐI (bundle ESM làm import.meta.url
// undefined nên createRequire(import.meta.url) ném; require tương đối từ
// bundle ở /tmp thì MODULE_NOT_FOUND).
function findKeyframesJs(): string {
  const candidates = [
    path.resolve(process.cwd(), "server/render/src/keyframes.js"),
    path.resolve(process.cwd(), "../../server/render/src/keyframes.js"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(`không tìm thấy server/render/src/keyframes.js (đã thử: ${candidates.join(", ")})`);
}
const KEYFRAMES_JS = findKeyframesJs();
const requireCjs = createRequire(KEYFRAMES_JS);
const {
  interpolateKeyframes: interpolateKeyframesJs,
  validateAnimations: validateAnimationsJs,
  buildInterpExpr,
  buildKeyframeTransform,
} = requireCjs(KEYFRAMES_JS) as {
  interpolateKeyframes: (kfs: Keyframe[], t: number) => number;
  validateAnimations: (anims: unknown, duration: number) => string[];
  buildInterpExpr: (kv: { keyframes: Keyframe[] }, tcExpr: string) => string;
  buildKeyframeTransform: (anims: unknown, opts?: Record<string, unknown>) => string;
};

test("(A4) mirror JS: nội suy đúng ở 150 s và clamp ở 3600 s, khớp bản TS", () => {
  const kfs = [kf(0, 0), kf(90, 90), kf(180, 180), kf(300, 300)];
  assert.equal(interpolateKeyframesJs(kfs, 150), 150);
  assert.equal(interpolateKeyframesJs(kfs, 3600), 300);
  assert.equal(interpolateKeyframesJs(kfs, 135), 135);
  assert.equal(
    interpolateKeyframesJs([kf(90, 0, "ease-in"), kf(180, 100)], 135),
    25,
  );
});

test("(A4) mirror JS: biểu thức FFmpeg mang đúng timestamp > 90 s (lt(t,180), lt(t,300))", () => {
  const expr = buildInterpExpr(
    { keyframes: [kf(0, 0), kf(180, 10), kf(300, 30)] },
    "t",
  );
  assert.ok(expr.includes("lt(t,180)"), `thiếu lt(t,180): ${expr}`);
  assert.ok(expr.includes("lt(t,300)"), `thiếu lt(t,300): ${expr}`);
  const tf = buildKeyframeTransform({
    scale: { keyframes: [kf(0, 1), kf(240, 2)] },
  });
  assert.ok(tf.includes("lt(t,240)"), `scale transform thiếu lt(t,240): ${tf}`);
  assert.ok(tf.includes("eval=frame"), `thiếu eval=frame: ${tf}`);
});

test("(A4) mirror JS: validateAnimations duration=300 chấp nhận t=150, chặn t=301", () => {
  assert.deepEqual(
    validateAnimationsJs({ scale: { keyframes: [kf(150, 2)] } }, 300),
    [],
  );
  assert.equal(validateAnimationsJs({ scale: { keyframes: [kf(301, 2)] } }, 300).length, 1);
});

// ---------------------------------------------------------------------------
// (B) Trần worker 90 s không bao giờ ràng buộc trong miền cho phép
// ---------------------------------------------------------------------------

test("(B) hằng số: trần worker đúng 90_000 ms; cap T3 đúng 64 MiB", () => {
  assert.equal(MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS, 90_000);
  assert.equal(MAX_TRIAL_DECODE_SAMPLE_BYTES, 64 * 1024 * 1024);
});

test("(B) công thức ở cap T3 (64 MiB) = 78.536 ms — dưới trần 90 s, biên 11.464 ms", () => {
  const atCap = trialDecodeTimeoutForSampleSizeWorker(MAX_TRIAL_DECODE_SAMPLE_BYTES);
  assert.equal(atCap, 78_536);
  assert.ok(atCap < MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS);
  assert.equal(MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS - atCap, 11_464);
});

test("(B) công thức đơn điệu theo kích thước; 32 MiB (39.215 ms) < 64 MiB", () => {
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(32 * 1024 * 1024), 39_215);
  assert.ok(
    trialDecodeTimeoutForSampleSizeWorker(32 * 1024 * 1024) <
      trialDecodeTimeoutForSampleSizeWorker(MAX_TRIAL_DECODE_SAMPLE_BYTES),
  );
});

test("(B) trần chỉ bắt đầu cắt ở ≈73–74 MiB — ngoài miền T3 cho phép", () => {
  // 73 MiB vẫn dưới trần; 74 MiB đã bị kẹp đúng về 90_000.
  assert.ok(trialDecodeTimeoutForSampleSizeWorker(73 * 1024 * 1024) < 90_000);
  assert.equal(trialDecodeTimeoutForSampleSizeWorker(74 * 1024 * 1024), 90_000);
  // Nếu cap T3 bị nâng lên ≥ 74 MiB thì trần 90 s SẼ ràng buộc — test này
  // khóa cap T3 ở 64 MiB (test hằng số ở trên) nên tổ hợp vẫn an toàn.
});

test("(B) planTrialDecodeCall: sample 64 MiB đi worker với timeout 78.536 ms", () => {
  const plan = planTrialDecodeCall({
    sampleBytes: MAX_TRIAL_DECODE_SAMPLE_BYTES,
    defaultProbe: null,
    allowWorker: true,
    workerFactory: () => {
      throw new Error("không spawn worker thật trong test");
    },
  });
  assert.equal(plan.viaWorker, true);
  assert.equal(plan.timeoutMs, 78_536);
  assert.equal(plan.workerUnavailableReason, undefined);
});

test("(B) planTrialDecodeCall: sample nhỏ (1 MiB) giữ đường main-thread, không đi worker", () => {
  const plan = planTrialDecodeCall({
    sampleBytes: 1024 * 1024,
    defaultProbe: null,
    allowWorker: true,
  });
  assert.equal(plan.viaWorker, false);
  assert.ok(plan.timeoutMs <= 2500, `timeout main-thread phải ≤ 2500, nhận ${plan.timeoutMs}`);
});

console.log(`\nkeyframeBeyond90Round73A7: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
