// settle46B1.test.ts — Phase 9 đợt 46, luồng B1: khóa quy tắc suy
// decoded của W2 + phân loại bằng range thật (nợ mở đợt 45 A1).
//
// Test thuần, chỉ import settle46B1.ts + settle45A1.ts (không import
// production code), chạy bằng esbuild bundle --format=esm (mẫu A1):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settle46B1.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/b1.test.mjs \
//     && node <scratch>/b1.test.mjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
// Test này KHÔNG phải bằng chứng headed: số headed thật nằm ở
// docs/PHASE9_ROUND46_B1_SETTLE_LIMITS.md. Các con số fixture dưới
// đây là mô hình + quy tắc: fps 30, GOP 90, GOP hỏng [900,990),
// mốc B1 32,4667 s (targetPos 974), cửa sổ hiệu dụng 75.
import assert from "node:assert/strict";
import {
  classifyFailedW2,
  classifyWithRealRange,
  decideW2DecodedProxy,
  effectiveWindow,
} from "./settle46B1";
import { classifyW2, mirrorDecodeWindow } from "./settle45A1";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

const SETUP_RANGE = { from: 12500, to: 12574 };
const PRE = {
  lastWindowKey: "12500-12574",
  lastDecodeRange: SETUP_RANGE,
  cacheSize: 269,
};

// --- (1) effectiveWindow: công thức production, số fixture Y1/Z1/B1 ---
ok("eff: full-file 640x360 file 69.861.131 byte ngân sách 320 MiB → 75", () => {
  const bpf = Math.floor((Math.floor(2.4 * 1024 * 1024) * 640 * 360) / (1280 * 720));
  assert.equal(bpf, 629145);
  assert.equal(effectiveWindow(75, bpf, 69861131, 320 * 1024 * 1024), 75);
});
ok("eff: đường GOP (retained nhỏ) vẫn min(75, ngân sách lớn) = 75", () => {
  assert.equal(effectiveWindow(75, 629145, 1024 * 1024, 320 * 1024 * 1024), 75);
});
ok("eff: windowFrames nhỏ hơn ngân sách thì windowFrames thắng", () => {
  assert.equal(effectiveWindow(40, 629145, 69861131, 320 * 1024 * 1024), 40);
});
ok("eff: ngân sách âm vẫn chặn dưới 1, không trả cửa sổ rỗng", () => {
  assert.equal(effectiveWindow(75, 629145, 400 * 1024 * 1024, 320 * 1024 * 1024), 1);
});

// --- (2) decideW2DecodedProxy: 5 nhánh ---
ok("proxy: ok=true + range mới → decoded = cacheSize sau evict, cross-check đạt", () => {
  const r = decideW2DecodedProxy({
    pre: PRE,
    post: { lastWindowKey: "900-974", lastDecodeRange: { from: 900, to: 974 }, cacheSize: 75 },
    ok: true,
    drawn: { count: 75, min: 900, max: 974 },
  });
  assert.equal(r.decoded, 75);
  assert.equal(r.kind, "proxy-cache-after-evict");
  assert.equal(r.drawnCrossCheck, true);
});
ok("proxy: drawn lệch cacheSize → proxy vẫn ghi nhưng cross-check false", () => {
  const r = decideW2DecodedProxy({
    pre: PRE,
    post: { lastWindowKey: "900-974", lastDecodeRange: { from: 900, to: 974 }, cacheSize: 75 },
    ok: true,
    drawn: { count: 121, min: 900, max: 974 },
  });
  assert.equal(r.decoded, 75);
  assert.equal(r.drawnCrossCheck, false);
  assert.match(r.detail, /TRƯỢT/);
});
ok("proxy: ok=true + range không đổi + key trùng + cache>0 → fast-path, decoded null", () => {
  const r = decideW2DecodedProxy({
    pre: { lastWindowKey: "900-974", lastDecodeRange: { from: 900, to: 974 }, cacheSize: 121 },
    post: { lastWindowKey: "900-974", lastDecodeRange: { from: 900, to: 974 }, cacheSize: 121 },
    ok: true,
    drawn: { count: 121, min: 900, max: 974 },
  });
  assert.equal(r.decoded, null);
  assert.equal(r.kind, "fast-path-no-decode");
});
ok("proxy: ok=true + range không đổi + cache trước = 0 (không đủ điều kiện fast-path) → dị thường, decoded null", () => {
  const r = decideW2DecodedProxy({
    pre: { lastWindowKey: "12500-12574", lastDecodeRange: SETUP_RANGE, cacheSize: 0 },
    post: { lastWindowKey: "12500-12574", lastDecodeRange: SETUP_RANGE, cacheSize: 75 },
    ok: true,
    drawn: null,
  });
  assert.equal(r.decoded, null);
  assert.equal(r.kind, "anomaly-no-new-range");
});
ok("proxy: ok=false + range không đổi → decoded suy ra 0, ghi rõ inferred", () => {
  const r = decideW2DecodedProxy({
    pre: PRE,
    post: { lastWindowKey: "12500-12574", lastDecodeRange: SETUP_RANGE, cacheSize: 269 },
    ok: false,
    drawn: null,
  });
  assert.equal(r.decoded, 0);
  assert.equal(r.kind, "inferred-from-fail-law");
  assert.match(r.detail, /không phải/);
});
ok("proxy: ok=null → unknown, decoded null", () => {
  const r = decideW2DecodedProxy({
    pre: PRE,
    post: { lastWindowKey: "12500-12574", lastDecodeRange: SETUP_RANGE, cacheSize: 269 },
    ok: null,
    drawn: null,
  });
  assert.equal(r.decoded, null);
  assert.equal(r.kind, "unknown-no-timing");
});

// --- (3) classifyWithRealRange: range thật phân xử 2 giả thuyết ---
ok("mirror A1 tại 32,4667 s: [900,974] nằm trọn GOP hỏng (dự đoán stss)", () => {
  const w = mirrorDecodeWindow({
    targetTimeSec: 974 / 30,
    fps: 30,
    effectiveWindow: 75,
    gopFrames: 90,
  });
  assert.equal(w.targetPos, 974);
  assert.equal(w.presentFrom, 900);
  assert.equal(w.decodeFrom, 900);
  assert.equal(w.decodeTo, 974);
  assert.equal(w.key, "900-974");
});
ok("range thật [900,974] + decoded một phần → partial-inside-corrupt (Z1 SAI)", () => {
  const r = classifyWithRealRange(900, 974, 40, true, 269, "12500-12574");
  assert.equal(r.diagnostic, "partial-inside-corrupt");
  assert.equal(r.expectedOk, true);
  assert.equal(r.window.windowFrames, 75);
});
ok("range thật [810,974] + decoded một phần → partial-gop (Z1 ĐÚNG)", () => {
  const r = classifyWithRealRange(810, 974, 100, true, 269, "12500-12574");
  assert.equal(r.diagnostic, "partial-gop");
  assert.equal(r.window.windowFrames, 165);
});
ok("range thật [900,974] + decoded trọn cửa sổ → full", () => {
  const r = classifyWithRealRange(900, 974, 75, true, 269, "12500-12574");
  assert.equal(r.diagnostic, "full");
});
ok("range thật [900,974] + decoded 0 + ok=false → fail", () => {
  const r = classifyWithRealRange(900, 974, 0, false, 269, "12500-12574");
  assert.equal(r.diagnostic, "fail");
  assert.equal(r.expectedOk, false);
});
ok("fast-path trội hơn mọi chẩn đoán khác khi key trùng + cache>0", () => {
  const r = classifyWithRealRange(900, 974, 40, true, 121, "900-974");
  assert.equal(r.diagnostic, "fast-path");
});

// --- (4) Bẫy range cũ (bài học headed B1): W2 fail không dùng range cũ ---
ok("fail: ok=false + range cũ trùng key trước W2 + cache>0 → vẫn fail, KHÔNG fast-path", () => {
  // Tình huống headed B1 pha hidden: postW2 range [12240,12360] chính
  // là range trước W2 (cửa sổ prefetch 412 s); classifyW2 thuần với
  // range đó sẽ chẩn đoán nhầm fast-path vì key trùng. Đường đúng:
  // W2 fail thì dùng classifyFailedW2, không đưa range cũ vào.
  const r = classifyFailedW2();
  assert.equal(r.diagnostic, "fail");
  assert.equal(r.expectedOk, false);
  assert.equal(r.consistent, true);
  assert.match(r.detail, /range CŨ/);
});
ok("fail: classifyWithRealRange với decoded 0 + ok=false cũng ra fail (không qua fast-path khi key khác)", () => {
  const r = classifyWithRealRange(900, 974, 0, false, 269, "12500-12574");
  assert.equal(r.diagnostic, "fail");
});
ok("bẫy range cũ (ghi nhận): classifyW2 thuần với range cũ + ok=false cho fast-path NHƯNG consistent=false", () => {
  // Chứng minh vì sao không được đưa range cũ vào classifyW2 khi
  // W2 fail: nhánh fast-path của A1 kiểm tra key trước, không kiểm
  // tra ok, nên nó trả fast-path kèm cờ consistent=false (mâu thuẫn:
  // fast-path luôn trả true nhưng quan sát là false). Cờ false này
  // là tín hiệu input không hợp lệ (range cũ), không phải chẩn đoán.
  const stale = {
    targetPos: 974, presentFrom: 900, presentTo: 974,
    decodeFrom: 12240, decodeTo: 12360, key: "12240-12360",
    windowFrames: 121, presentFrames: 75, gopAligned: true,
  };
  const r = classifyW2({
    window: stale, decoded: 0, ok: false, cacheSizeBefore: 211,
    lastWindowKey: "12240-12360",
    corrupt: { startFrame: 900, endFrameExclusive: 990 },
  });
  assert.equal(r.diagnostic, "fast-path");
  assert.equal(r.consistent, false);
});

for (const t of queue) {
  try {
    t.fn();
    pass++;
    console.log(`PASS ${t.name}`);
  } catch (e) {
    console.log(`FAIL ${t.name} — ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  }
}
console.log(`\n== settle46B1: ${pass}/${queue.length} pass ==`);
