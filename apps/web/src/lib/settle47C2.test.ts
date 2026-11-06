// settle47C2.test.ts — Phase 9 đợt 47, luồng C2: khóa số học aim
// (gốc sống + khung prefetch đang chạy) và phân loại thời điểm settle
// so với cửa sổ W2 (nợ mở B1: SUCCESS đường asset: vẫn mở, trượt
// sau W2 ~36–43 ms).
//
// Test thuần, chỉ import settle47C2.ts + settle45A1.ts (không import
// production code), chạy bằng esbuild bundle --format=esm (mẫu A1/B1):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settle47C2.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/c2.test.mjs \
//     && node <scratch>/c2.test.mjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
// Test này KHÔNG phải bằng chứng headed: số headed thật nằm ở
// docs/PHASE9_ROUND47_C2_SETTLE_LIMITS.md. Các con số fixture dưới
// đây là mô hình + quy tắc: fps 30, GOP 90, GOP hỏng [900,990),
// mốc B1 32,4667 s (targetPos 974), cửa sổ hiệu dụng 75, cửa sổ
// setup [12420,12510] (91 frame), cửa sổ 412 [12240,12360] (121).
import assert from "node:assert/strict";
import {
  aimTargetCache,
  classifySettleGap,
  operativePrefetchKey,
  overlapFrames,
  prefetchNewFrames,
  rangeLength,
  remainingNewFrames,
  w2WindowInsideCorrupt,
} from "./settle47C2";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

// --- (1) rangeLength / overlapFrames ---
ok("rangeLength: [12240,12360] = 121, null = 0, ngược = 0", () => {
  assert.equal(rangeLength({ from: 12240, to: 12360 }), 121);
  assert.equal(rangeLength(null), 0);
  assert.equal(rangeLength({ from: 10, to: 9 }), 0);
});
ok("overlapFrames: rời nhau = 0", () => {
  assert.equal(overlapFrames({ from: 10, to: 20 }, { from: 30, to: 40 }), 0);
  assert.equal(overlapFrames({ from: 10, to: 20 }, { from: 21, to: 30 }), 0);
});
ok("overlapFrames: giao một phần [10,20]∩[15,25] = [15,20] = 6", () => {
  assert.equal(overlapFrames({ from: 10, to: 20 }, { from: 15, to: 25 }), 6);
});
ok("overlapFrames: chứa nhau lấy đoạn trong", () => {
  assert.equal(overlapFrames({ from: 10, to: 30 }, { from: 15, to: 20 }), 6);
  assert.equal(overlapFrames({ from: 15, to: 20 }, { from: 10, to: 30 }), 6);
});
ok("overlapFrames: trùng nhau = độ dài, null = 0", () => {
  assert.equal(overlapFrames({ from: 10, to: 20 }, { from: 10, to: 20 }), 11);
  assert.equal(overlapFrames(null, { from: 10, to: 20 }), 0);
  assert.equal(overlapFrames({ from: 10, to: 20 }, null), 0);
});

// --- (2) prefetchNewFrames: số fixture B1, cả hai prefetch đều 90 ---
ok("newFrames: prefetch setup [12330,12435] vs cửa sổ setup [12420,12510] = 90", () => {
  assert.equal(
    prefetchNewFrames({ from: 12420, to: 12510 }, { from: 12330, to: 12435 }),
    90,
  );
});
ok("newFrames: prefetch 412 [12150,12285] vs cửa sổ 412 [12240,12360] = 90", () => {
  assert.equal(
    prefetchNewFrames({ from: 12240, to: 12360 }, { from: 12150, to: 12285 }),
    90,
  );
});
ok("newFrames: không chồng = toàn bộ aheadRange; ahead nằm trong cửa sổ = 0", () => {
  assert.equal(
    prefetchNewFrames({ from: 100, to: 199 }, { from: 0, to: 99 }),
    100,
  );
  assert.equal(
    prefetchNewFrames({ from: 100, to: 199 }, { from: 120, to: 150 }),
    0,
  );
  assert.equal(prefetchNewFrames({ from: 100, to: 199 }, null), 0);
});

// --- (3) aimTargetCache: mốc đúng C2 vs mốc sai B1 ---
ok("aimTarget: gốc sống 121 + 90 mới − slack 3 = 208 (mốc đúng C2)", () => {
  assert.equal(aimTargetCache(121, 90, 3), 208);
});
ok("aimTarget: slack 0 = 211 (đủ frame), slack 1 = 210", () => {
  assert.equal(aimTargetCache(121, 90, 0), 211);
  assert.equal(aimTargetCache(121, 90, 1), 210);
});
ok("aimTarget: gốc cũ B1 (91 + 90 − 3 = 178) lệch 30 frame so với mốc đúng 208", () => {
  assert.equal(aimTargetCache(91, 90, 3), 178);
  assert.equal(aimTargetCache(121, 90, 3) - aimTargetCache(91, 90, 3), 30);
});
ok("aimTarget: slack lớn hơn frame mới thì chặn ở windowSize, không âm", () => {
  assert.equal(aimTargetCache(121, 90, 200), 121);
  assert.equal(aimTargetCache(121, 0, 3), 121);
});

// --- (4) remainingNewFrames ---
ok("remaining: (121, 90, cache 203) = 8 — đúng số B1 tắt ở attempt 2", () => {
  assert.equal(remainingNewFrames(121, 90, 203), 8);
});
ok("remaining: đủ frame = 0, vượt mốc cũng 0, chưa decode = toàn bộ", () => {
  assert.equal(remainingNewFrames(121, 90, 211), 0);
  assert.equal(remainingNewFrames(121, 90, 250), 0);
  assert.equal(remainingNewFrames(121, 90, 121), 90);
});

// --- (5) operativePrefetchKey ---
ok("operativeKey: {12150,12285} = '12150:12285' (đúng khóa Set inFlight)", () => {
  assert.equal(operativePrefetchKey({ from: 12150, to: 12285 }), "12150:12285");
  assert.equal(operativePrefetchKey(null), null);
});

// --- (6) classifySettleGap: số B1 + các nhánh ---
ok("gap: B1 attempt 2 (settle +214, W2 [0,178.3]) = after-w2, delta +35,7", () => {
  const g = classifySettleGap(214, 0, 178.3);
  assert.equal(g.kind, "after-w2");
  assert.ok(Math.abs(g.deltaMs - 35.7) < 0.01);
});
ok("gap: B1 attempt 4 (settle +203, W2 [0,159.5]) = after-w2, delta +43,5", () => {
  const g = classifySettleGap(203, 0, 159.5);
  assert.equal(g.kind, "after-w2");
  assert.ok(Math.abs(g.deltaMs - 43.5) < 0.01);
});
ok("gap: settle trong W2 = during-w2, delta âm = còn ms trước khi W2 kết thúc", () => {
  const g = classifySettleGap(100, 0, 178);
  assert.equal(g.kind, "during-w2");
  assert.equal(g.deltaMs, -78);
});
ok("gap: settle đúng cuối W2 vẫn tính during-w2 (biên bao)", () => {
  assert.equal(classifySettleGap(178, 0, 178).kind, "during-w2");
});
ok("gap: settle trước W2 = before-w2, delta âm theo đầu W2", () => {
  const g = classifySettleGap(-10, 0, 178);
  assert.equal(g.kind, "before-w2");
  assert.equal(g.deltaMs, -10);
});

// --- (7) w2WindowInsideCorrupt: mốc probe W2-chậm-hơn ---
ok("w2window: mốc B1 32,4667 s (974) nằm trọn GOP hỏng [900,990)", () => {
  const r = w2WindowInsideCorrupt({
    targetTimeSec: 974 / 30,
    fps: 30,
    effectiveWindow: 75,
    gopFrames: 90,
    corrupt: { startFrame: 900, endFrameExclusive: 990 },
  });
  assert.equal(r.feasible, true);
  assert.equal(r.window.decodeFrom, 900);
  assert.equal(r.window.decodeTo, 974);
});
ok("w2window: mốc muộn nhất 32,9667 s (989) vẫn nằm trọn GOP hỏng", () => {
  const r = w2WindowInsideCorrupt({
    targetTimeSec: 989 / 30,
    fps: 30,
    effectiveWindow: 75,
    gopFrames: 90,
    corrupt: { startFrame: 900, endFrameExclusive: 990 },
  });
  assert.equal(r.feasible, true);
  assert.equal(r.window.decodeFrom, 900);
  assert.equal(r.window.decodeTo, 989);
});
ok("w2window: mốc 990 (ngay sau GOP hỏng) và 899 (trước GOP) đều không feasible", () => {
  const base = {
    fps: 30,
    effectiveWindow: 75,
    gopFrames: 90,
    corrupt: { startFrame: 900, endFrameExclusive: 990 },
  };
  assert.equal(w2WindowInsideCorrupt({ ...base, targetTimeSec: 990 / 30 }).feasible, false);
  assert.equal(w2WindowInsideCorrupt({ ...base, targetTimeSec: 899 / 30 }).feasible, false);
});
ok("w2window: cửa sổ hiệu dụng 200 ở mốc 974 vắt khỏi GOP hỏng → không feasible", () => {
  const r = w2WindowInsideCorrupt({
    targetTimeSec: 974 / 30,
    fps: 30,
    effectiveWindow: 200,
    gopFrames: 90,
    corrupt: { startFrame: 900, endFrameExclusive: 990 },
  });
  assert.equal(r.feasible, false);
});

for (const t of queue) {
  try {
    t.fn();
    pass++;
    console.log(`PASS ${t.name}`);
  } catch (e) {
    console.log(`FAIL ${t.name} — ${e instanceof Error ? e.message : String(e)}`);
  }
}
console.log(`\nsettle47C2.test: ${pass}/${queue.length} pass`);
if (pass !== queue.length) process.exit(1);
