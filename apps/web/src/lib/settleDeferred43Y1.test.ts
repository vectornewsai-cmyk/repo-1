// settleDeferred43Y1.test.ts — Phase 9 đợt 43, luồng Y1: khóa ngữ nghĩa
// thuần cho 3 nợ mở của settle-drop (đợt 42 §5.2) mà test browser
// headed của luồng này chứng minh thêm ở tầng trình duyệt (xem
// docs/PHASE9_ROUND43_Y1_SETTLE_LIMITS.md). Test thuần này KHÔNG mạo
// nhận bằng chứng browser — nó chỉ khóa các tiền đề thuần mà bằng
// chứng browser dựa vào, để hồi quy sau này bắt được nếu ai đổi luật:
//
// 1. GOP thưa > 32 MiB: wiring V2 bật đường GOP đúng ở biên ngưỡng
//    (32 MiB < size <= 128 MiB) — kể cả khi size đó là size của file
//    GOP thưa, không phải file GOP dày của X4.
// 2. Đường asset:: plan rehydrate vẫn trả candidate theo assetId cho
//    src `asset:<id>` — tiền đề để blob: URL sau rehydrate tới được
//    controller (controller không phân biệt scheme URL khi settle-drop;
//    quyết định wiring chỉ nhìn size, không nhìn scheme).
// 3. Tab ẩn: quyết định dọn của settle-drop là hàm thuần đồng bộ
//    (shouldDropSettledPrefetch) — không phụ thuộc timer, rAF hay
//    visibility; bằng chứng headed đo thêm rằng timer bị throttle
//    trong lúc ẩn vẫn không làm lệch counter (xem LIMITS §4).
// 4. Số học evict cho cửa sổ GOP thưa: cửa sổ cũ + prefetch trước nó
//    không giao nhau → lần thử lại dọn đúng số frame prefetch.
//
// Chạy bằng esbuild bundle (như X1/W1: import không đuôi `.ts` nên
// Node strip-types không resolve):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settleDeferred43Y1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/y1.test.cjs \
//     && node <scratch>/y1.test.cjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
import assert from "node:assert/strict";
import {
  GOP_RANGE_ACTIVATION_THRESHOLD_BYTES,
  resolveGopRangeWiring,
} from "./gopCache40V2.ts";
import { planRehydrate } from "./rehydrate36S5.ts";
import type { AssetManifest } from "./assetStore.ts";
import {
  keepIndicesForWindow,
  shouldDropSettledPrefetch,
} from "./reverseDecodeAheadToggle.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

const MiB = 1024 * 1024;
const LARGE = 128 * MiB;

// --- (1) Wiring GOP ở biên ngưỡng (mặc định V2, không truyền threshold) ---
ok("GOP wiring: đúng 32 MiB thì TẮT (size <= ngưỡng, không bật lén)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: 32 * MiB,
    largeFileBytes: LARGE,
  });
  assert.equal(d.useGop, false);
  assert.match(d.reason, /below-threshold/);
});

ok("GOP wiring: 32 MiB + 1 byte thì BẬT (ngưỡng là <, không <=)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: 32 * MiB + 1,
    largeFileBytes: LARGE,
  });
  assert.equal(d.useGop, true);
});

ok("GOP wiring: đúng 128 MiB thì vẫn BẬT (trần là <=, cổng S4 chưa khóa)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: 128 * MiB,
    largeFileBytes: LARGE,
  });
  assert.equal(d.useGop, true);
});

ok("GOP wiring: 128 MiB + 1 byte thì KHÓA (vượt trần S4)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: 128 * MiB + 1,
    largeFileBytes: LARGE,
  });
  assert.equal(d.useGop, false);
  assert.match(d.reason, /large-file-locked/);
});

ok("GOP wiring: hằng ngưỡng mặc định đúng 32 MiB (không bị đổi lén)", () => {
  assert.equal(GOP_RANGE_ACTIVATION_THRESHOLD_BYTES, 32 * MiB);
});

ok("GOP wiring: chưa biết size thì TẮT dù caller đã bật (không đoán size)", () => {
  const d = resolveGopRangeWiring({
    enabled: true,
    knownSizeBytes: null,
    largeFileBytes: LARGE,
  });
  assert.equal(d.useGop, false);
  assert.match(d.reason, /size-unknown/);
});

// --- (2) Đường asset:: plan rehydrate trả candidate theo assetId ---
function fakeManifest(assetId: string, name: string): AssetManifest {
  return {
    assetId,
    originalName: name,
    mimeType: "video/mp4",
    sha256: `sha-${assetId}`,
    size: 40 * MiB,
    kind: "video",
    ingestedAt: "2026-11-04T00:00:00.000Z",
    aliases: [],
  } as unknown as AssetManifest;
}

ok("asset: plan rehydrate: src asset:<id> khớp đúng manifest theo id", () => {
  const m = fakeManifest("y1-asset-1", "y1-good-720p-gop90-90s.mp4");
  const plan = planRehydrate(["asset:y1-asset-1"], [m]);
  assert.equal(plan.candidates.length, 1);
  assert.equal(plan.candidates[0].assetId, "y1-asset-1");
  assert.equal(plan.candidates[0].via, "asset");
  assert.equal(plan.skipped.length, 0);
});

ok("asset: plan rehydrate: id lạ thì skipped, không bịa candidate", () => {
  const m = fakeManifest("y1-asset-1", "y1-good-720p-gop90-90s.mp4");
  const plan = planRehydrate(["asset:khong-co"], [m]);
  assert.equal(plan.candidates.length, 0);
  assert.equal(plan.skipped.length, 1);
  assert.equal(plan.skipped[0].src, "asset:khong-co");
});

// --- (3) Tab ẩn: quyết định dọn là hàm thuần, không phụ thuộc timer ---
ok("tab ẩn (tiền đề thuần): tắt + chưa dispose + không decode bay → dọn ngay, không cần timer", () => {
  assert.equal(shouldDropSettledPrefetch(false, false, false), true);
});

ok("tab ẩn (tiền đề thuần): tắt + decode đang bay → hoãn (chờ promise, không phải chờ timer)", () => {
  assert.equal(shouldDropSettledPrefetch(false, false, true), false);
});

ok("tab ẩn (tiền đề thuần): bật lại trước khi thử lại → không dọn (giữ prefetch đang dùng)", () => {
  assert.equal(shouldDropSettledPrefetch(true, false, false), false);
});

ok("tab ẩn (tiền đề thuần): đã dispose → không dọn dù đang tắt", () => {
  assert.equal(shouldDropSettledPrefetch(false, true, false), false);
});

// --- (4) Số học evict cho cửa sổ GOP thưa ---
// Mô phỏng evictExcept(keep) như X1: trả số frame bị dọn.
function droppedCount(cached: number[], keep: Set<number>): number {
  return cached.filter((i) => !keep.has(i)).length;
}

ok("GOP thưa: lần thử lại dọn đúng 75 frame prefetch ngoài cửa sổ cũ", () => {
  // Cửa sổ cũ decode [2700..2774] (75 frame), prefetch là cửa sổ
  // present ngay trước nó [2625..2699] — không giao nhau (GOP 90
  // frame nên hai cửa sổ 75 frame kề nhau vẫn tách bạch).
  const cached = [
    ...Array.from({ length: 75 }, (_, k) => 2625 + k),
    ...Array.from({ length: 75 }, (_, k) => 2700 + k),
  ];
  const keep = keepIndicesForWindow({ from: 2700, to: 2774 });
  assert.equal(droppedCount(cached, keep), 75);
  assert.equal(keep.has(2625), false);
  assert.equal(keep.has(2699), false);
  assert.equal(keep.has(2700), true);
  assert.equal(keep.has(2774), true);
});

ok("GOP thưa: prefetch giao cửa sổ cũ (trùng biên GOP) chỉ dọn phần ngoài", () => {
  // Prefetch [2650..2724] giao cửa sổ cũ [2700..2774] ở 25 frame
  // (2700..2724) → chỉ dọn 50 frame ngoài.
  const cached = [
    ...Array.from({ length: 75 }, (_, k) => 2650 + k),
    ...Array.from({ length: 75 }, (_, k) => 2700 + k),
  ];
  const keep = keepIndicesForWindow({ from: 2700, to: 2774 });
  const uniq = [...new Set(cached)];
  assert.equal(droppedCount(uniq, keep), 50);
});

for (const t of queue) {
  try {
    t.fn();
    pass++;
    console.log(`PASS ${t.name}`);
  } catch (e) {
    console.log(`FAIL ${t.name} — ${(e as Error).message}`);
  }
}
console.log(`\n== settleDeferred43Y1: ${pass}/${queue.length} pass ==`);
if (pass !== queue.length) process.exit(1);
