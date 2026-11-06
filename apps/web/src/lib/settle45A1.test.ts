// settle45A1.test.ts — Phase 9 đợt 45, luồng A1: khóa mirror W2 +
// chọn cửa sổ W2 nằm trọn GOP hỏng (nợ mở Z1 §6.1).
//
// Test thuần, chỉ import settle45A1.ts (không import production code
// khác) nên tsc không cần exclude riêng như các test đợt trước.
// Chạy bằng esbuild bundle --format=esm (mẫu test đợt 44):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settle45A1.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/a1.test.mjs \
//     && node <scratch>/a1.test.mjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
// Test này KHÔNG phải bằng chứng headed: bằng chứng headed cần
// decodeFrom/decodeTo/key/decoded thật từ controller (xem probe
// settle45A1-probe.mjs + LIMITS A1 §4). Các con số fixture dưới đây
// là mô hình: fps 30, GOP 90 frame, GOP hỏng [900,990) (tức
// [30,33) giây — đúng fixture Y1/Z1), cửa sổ hiệu dụng 75 (mặc định
// REVERSE_CACHE_DEFAULT_WINDOW_FRAMES).
import assert from "node:assert/strict";
import {
  analyzeWindowVsCorrupt,
  chooseCorruptWindow,
  classifyW2,
  frameForTime,
  mirrorDecodeWindow,
  type W2DecodeWindow,
} from "./settle45A1";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

const FPS = 30;
const GOP = 90;
const CORRUPT = { startFrame: 900, endFrameExclusive: 990 };
const EFF = 75;

function winAt(t: number, eff = EFF): W2DecodeWindow {
  return mirrorDecodeWindow({
    targetTimeSec: t,
    fps: FPS,
    effectiveWindow: eff,
    gopFrames: GOP,
  });
}

// --- (1) Phân loại diagnostic 3 nhánh yêu cầu + phụ ---
ok("classify: W2 ok=true mà decoded null (trạng thái trace Z1) → unknown, không được kết luận", () => {
  const r = classifyW2({
    window: winAt(32.7),
    decoded: null,
    ok: true,
    cacheSizeBefore: 269,
    lastWindowKey: "800-900",
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "unknown");
  assert.equal(r.expectedOk, null);
  assert.equal(r.consistent, null);
  assert.match(r.detail, /Z1/);
});

ok("classify: key trùng lastWindowKey + cache > 0 → fast-path, không cần decoded", () => {
  const w = winAt(32.7);
  const r = classifyW2({
    window: w,
    decoded: null,
    ok: true,
    cacheSizeBefore: 121,
    lastWindowKey: w.key,
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "fast-path");
  assert.equal(r.expectedOk, true);
  assert.equal(r.consistent, true);
});

ok("classify: fast-path trội hơn decoded (key trùng thì production không decode)", () => {
  const w = winAt(32.7);
  const r = classifyW2({
    window: w,
    decoded: 0,
    ok: true,
    cacheSizeBefore: 50,
    lastWindowKey: w.key,
  });
  assert.equal(r.diagnostic, "fast-path");
});

ok("classify: decoded = 0 → fail, expectedOk=false, ok=true quan sát được là inconsistent", () => {
  const r = classifyW2({
    window: winAt(32.7),
    decoded: 0,
    ok: true,
    cacheSizeBefore: 0,
    lastWindowKey: "1-2",
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "fail");
  assert.equal(r.expectedOk, false);
  assert.equal(r.consistent, false);
});

ok("classify: decoded = 0 + ok=false → fail consistent (đường Y1/Z1-hidden)", () => {
  const r = classifyW2({
    window: winAt(32.7),
    decoded: 0,
    ok: false,
    cacheSizeBefore: 0,
    lastWindowKey: "1-2",
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "fail");
  assert.equal(r.consistent, true);
});

ok("classify: decoded == window → full, không phải partial", () => {
  const w = winAt(32.7);
  const r = classifyW2({
    window: w,
    decoded: w.windowFrames,
    ok: true,
    cacheSizeBefore: 0,
    lastWindowKey: "1-2",
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "full");
});

// --- (2) Mirror cửa sổ + quan hệ với GOP hỏng ---
ok("mirror: W2 ở 32.7 s, eff 75, GOP 90 → present [907,981], decode [900,981] nằm trọn GOP hỏng", () => {
  const w = winAt(32.7);
  assert.equal(w.targetPos, 981);
  assert.equal(w.presentFrom, 907);
  assert.equal(w.decodeFrom, 900);
  assert.equal(w.decodeTo, 981);
  assert.equal(w.key, "900-981");
  assert.equal(w.windowFrames, 82);
  const rel = analyzeWindowVsCorrupt(w, CORRUPT);
  assert.equal(rel.insideCorrupt, true);
  assert.equal(rel.straddlesCorruptStart, false);
  assert.equal(rel.corruptFrames, 82);
  assert.equal(rel.healthyPrefixFrames, 0);
});

ok("classify: cửa sổ trọn GOP hỏng mà decoded > 0 → partial-inside-corrupt, KHÔNG phải partial-gop", () => {
  const w = winAt(32.7);
  const r = classifyW2({
    window: w,
    decoded: 40,
    ok: true,
    cacheSizeBefore: 0,
    lastWindowKey: "1-2",
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "partial-inside-corrupt");
  assert.match(r.detail, /SAI/);
});

ok("mirror: W2 ở 31.0 s, eff 75 → decode [810,930] vắt qua đầu GOP hỏng (90 frame lành + 31 hỏng)", () => {
  const w = winAt(31.0);
  assert.equal(w.decodeFrom, 810);
  assert.equal(w.decodeTo, 930);
  const rel = analyzeWindowVsCorrupt(w, CORRUPT);
  assert.equal(rel.straddlesCorruptStart, true);
  assert.equal(rel.insideCorrupt, false);
  assert.equal(rel.healthyPrefixFrames, 90);
  assert.equal(rel.corruptFrames, 31);
});

ok("classify: cửa sổ vắt GOP lành + decoded một phần → partial-gop (đúng giả thuyết Z1)", () => {
  const w = winAt(31.0);
  const r = classifyW2({
    window: w,
    decoded: 90,
    ok: true,
    cacheSizeBefore: 0,
    lastWindowKey: "1-2",
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "partial-gop");
  assert.equal(r.expectedOk, true);
  assert.equal(r.consistent, true);
});

ok("classify: cửa sổ không chạm GOP hỏng + decoded một phần → partial-other", () => {
  const w = winAt(20.0);
  const r = classifyW2({
    window: w,
    decoded: 10,
    ok: true,
    cacheSizeBefore: 0,
    lastWindowKey: "1-2",
    corrupt: CORRUPT,
  });
  assert.equal(r.diagnostic, "partial-other");
});

ok("mirror: keyframes mode cho cùng đáp án GOP đều (keyframe 900 cho present 907)", () => {
  const w = mirrorDecodeWindow({
    targetTimeSec: 32.7,
    fps: FPS,
    effectiveWindow: EFF,
    keyframes: [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900, 990],
  });
  assert.equal(w.decodeFrom, 900);
  assert.equal(w.gopAligned, true);
});

ok("mirror: không có keyframes/gopFrames → decodeFrom = presentFrom, gopAligned=false", () => {
  const w = mirrorDecodeWindow({ targetTimeSec: 32.7, fps: FPS, effectiveWindow: EFF });
  assert.equal(w.decodeFrom, 907);
  assert.equal(w.gopAligned, false);
});

ok("frameForTime: chặn âm về 0, chặn cuối theo totalFrames", () => {
  assert.equal(frameForTime(-1, FPS), 0);
  assert.equal(frameForTime(9999, FPS, 1000), 999);
  assert.equal(frameForTime(32.7, FPS), 981);
});

// --- (3) Chọn cửa sổ nằm trọn GOP hỏng ---
ok("choose: eff 75, GOP hỏng [900,990) → targetPos 974 (t=32.4667 s), present [900,974], decode [900,974]", () => {
  const c = chooseCorruptWindow({
    corruptGops: [CORRUPT],
    effectiveWindow: 75,
    fps: FPS,
  });
  assert.equal(c.feasible, true);
  assert.equal(c.targetPos, 974);
  assert.equal(c.presentFrom, 900);
  assert.equal(c.decodeFrom, 900);
  assert.equal(c.decodeTo, 974);
  assert.equal(c.key, "900-974");
  assert.ok(Math.abs((c.targetTimeSec ?? 0) - 974 / 30) < 1e-9);
  // Cửa sổ chọn được phải thật sự nằm trọn GOP hỏng theo mirror.
  const rel = analyzeWindowVsCorrupt(
    mirrorDecodeWindow({ targetTimeSec: c.targetTimeSec ?? 0, fps: FPS, effectiveWindow: 75, gopFrames: GOP }),
    CORRUPT,
  );
  assert.equal(rel.insideCorrupt, true);
});

ok("choose: biên chạm — eff == độ dài GOP (90) → targetPos 989 chạm cuối, presentFrom 900 chạm đầu", () => {
  const c = chooseCorruptWindow({
    corruptGops: [CORRUPT],
    effectiveWindow: 90,
    fps: FPS,
  });
  assert.equal(c.feasible, true);
  assert.equal(c.targetPos, 989);
  assert.equal(c.presentFrom, 900);
  assert.equal(c.decodeTo, 989);
  const rel = analyzeWindowVsCorrupt(
    { targetPos: 989, presentFrom: 900, presentTo: 989, decodeFrom: 900, decodeTo: 989, key: "900-989", windowFrames: 90, presentFrames: 90, gopAligned: true },
    CORRUPT,
  );
  assert.equal(rel.touchesCorruptStart, true);
  assert.equal(rel.touchesCorruptEnd, true);
});

ok("choose: eff 91 > độ dài GOP 90 → không feasible, requiredMaxWindow = 90", () => {
  const c = chooseCorruptWindow({
    corruptGops: [CORRUPT],
    effectiveWindow: 91,
    fps: FPS,
  });
  assert.equal(c.feasible, false);
  assert.equal(c.requiredMaxWindow, 90);
  assert.equal(c.targetPos, null);
});

ok("choose: GOP lành xen kẽ — GOP hỏng đầu quá ngắn thì bỏ qua, chọn GOP hỏng sau đủ dài", () => {
  const c = chooseCorruptWindow({
    corruptGops: [
      { startFrame: 100, endFrameExclusive: 130 },
      { startFrame: 900, endFrameExclusive: 990 },
    ],
    effectiveWindow: 75,
    fps: FPS,
  });
  assert.equal(c.feasible, true);
  assert.equal(c.gopIndex, 1);
  assert.equal(c.decodeFrom, 900);
});

ok("choose: key trùng lastWindowKey thì dịch +1 trong GOP (974 → 975), vẫn trọn GOP hỏng", () => {
  const c = chooseCorruptWindow({
    corruptGops: [CORRUPT],
    effectiveWindow: 75,
    fps: FPS,
    lastWindowKey: "900-974",
  });
  assert.equal(c.feasible, true);
  assert.equal(c.targetPos, 975);
  assert.equal(c.presentFrom, 901);
  assert.equal(c.decodeFrom, 900);
});

ok("choose: eff <= 0 hoặc không có GOP hỏng → không feasible, lý do rõ", () => {
  assert.equal(chooseCorruptWindow({ corruptGops: [CORRUPT], effectiveWindow: 0, fps: FPS }).feasible, false);
  assert.equal(chooseCorruptWindow({ corruptGops: [], effectiveWindow: 75, fps: FPS }).feasible, false);
  assert.match(chooseCorruptWindow({ corruptGops: [], effectiveWindow: 75, fps: FPS }).reason, /no-corrupt-gop/);
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
console.log(`\n== settle45A1: ${pass}/${queue.length} pass ==`);
if (pass !== queue.length) process.exit(1);
