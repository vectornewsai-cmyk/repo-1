// presentedFps65R8.test.ts — Phase 9 đợt 65, luồng S8: khóa logic lấy mẫu
// presented-frame rate (takePresentedSample / presentedRateBetween).
//
// Chạy bằng esbuild bundle (mẫu test của repo, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/presentedFps65R8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round65-r8/presentedFps65R8.test.cjs \
//     && node /tmp/round65-r8/presentedFps65R8.test.cjs
import assert from "node:assert/strict";
import {
  presentedRateBetween,
  takePresentedSample,
  type PresentedSample,
  type VideoPlaybackQualityLike,
} from "./presentedFps";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  exitCode: number | undefined;
};

/** Element giả: bộ đếm tăng theo lệnh, có/không có API, gắn/không gắn DOM. */
function fakeEl(opts: { total?: number; dropped?: number; corrupted?: number; attached?: boolean; noApi?: boolean }) {
  let q: VideoPlaybackQualityLike = {
    totalVideoFrames: opts.total ?? 0,
    droppedVideoFrames: opts.dropped ?? 0,
    corruptedVideoFrames: opts.corrupted ?? 0,
  };
  const el: {
    getVideoPlaybackQuality?: () => VideoPlaybackQualityLike;
    isConnected?: boolean;
    advance: (total: number, dropped: number) => void;
  } = {
    isConnected: opts.attached ?? false,
    advance(total: number, dropped: number) {
      q = { ...q, totalVideoFrames: q.totalVideoFrames + total, droppedVideoFrames: q.droppedVideoFrames + dropped };
    },
  };
  if (!opts.noApi) el.getVideoPlaybackQuality = () => ({ ...q });
  return el;
}

let n = 0;
function check(name: string, fn: () => void) {
  n++;
  fn();
  console.log(`ok ${n} - ${name}`);
}

// 1. Mẫu cơ bản: đọc đúng bộ đếm + cờ attached.
check("mẫu đọc đúng total/dropped/corrupted + attached=false (element tách DOM)", () => {
  const el = fakeEl({ total: 120, dropped: 6, corrupted: 1, attached: false });
  const s = takePresentedSample(el, 1000);
  assert.ok(s);
  assert.equal(s.total, 120);
  assert.equal(s.dropped, 6);
  assert.equal(s.corrupted, 1);
  assert.equal(s.wallMs, 1000);
  assert.equal(s.attached, false);
});

check("mẫu attached=true khi element gắn DOM", () => {
  const el = fakeEl({ attached: true });
  assert.equal(takePresentedSample(el, 0)?.attached, true);
});

// 2. Không API / không element → null (không đo được, KHÔNG phải 0 fps).
check("element null → null", () => {
  assert.equal(takePresentedSample(null, 0), null);
});
check("element không có getVideoPlaybackQuality → null", () => {
  assert.equal(takePresentedSample(fakeEl({ noApi: true }), 0), null);
});

// 3. Tỉ lệ giữa 2 mẫu: 300 frame / 10 s = 30 fps, 15 dropped → 1.5 fps, tỉ lệ 15/315.
check("tỉ lệ 30 fps trình chiếu, dropRatio = dropped/(total+dropped)", () => {
  const el = fakeEl({});
  const a = takePresentedSample(el, 0)!;
  el.advance(300, 15);
  const b = takePresentedSample(el, 10_000)!;
  const r = presentedRateBetween(a, b)!;
  assert.ok(r);
  assert.equal(r.presentedFps, 30);
  assert.equal(r.droppedFps, 1.5);
  assert.equal(r.totalDelta, 300);
  assert.equal(r.droppedDelta, 15);
  assert.equal(r.dropRatio, 15 / 315);
  assert.equal(r.wallSecs, 10);
});

// 4. Element tách DOM đứng yên total (giả lập đúng hành vi preview):
// decode vẫn chạy nhưng total không tăng → presentedFps = 0, KHÔNG null.
// Đây là tín hiệu "không present được", khác với "không đo được".
check("total đứng yên → presentedFps 0 (không phải null), droppedFps 0", () => {
  const el = fakeEl({ total: 500, dropped: 0, attached: false });
  const a = takePresentedSample(el, 0)!;
  const b = takePresentedSample(el, 10_000)!;
  const r = presentedRateBetween(a, b)!;
  assert.ok(r);
  assert.equal(r.presentedFps, 0);
  assert.equal(r.droppedFps, 0);
  assert.equal(r.dropRatio, 0);
});

// 5. Mẫu thiếu → null.
check("mẫu null → null", () => {
  const s: PresentedSample = { wallMs: 0, total: 0, dropped: 0, corrupted: 0, attached: true };
  assert.equal(presentedRateBetween(null, s), null);
  assert.equal(presentedRateBetween(s, null), null);
});

// 6. Wall không tiến → null (tránh chia 0).
check("wallSecs <= 0 → null", () => {
  const s0: PresentedSample = { wallMs: 1000, total: 0, dropped: 0, corrupted: 0, attached: true };
  const s1: PresentedSample = { wallMs: 1000, total: 30, dropped: 0, corrupted: 0, attached: true };
  const s2: PresentedSample = { wallMs: 900, total: 30, dropped: 0, corrupted: 0, attached: true };
  assert.equal(presentedRateBetween(s0, s1), null);
  assert.equal(presentedRateBetween(s0, s2), null);
});

// 7. Bộ đếm đi lùi (element bị thay/drop giữa 2 mẫu) → null, hủy slot.
check("total đi lùi → null (element đã bị thay)", () => {
  const a: PresentedSample = { wallMs: 0, total: 300, dropped: 0, corrupted: 0, attached: false };
  const b: PresentedSample = { wallMs: 10_000, total: 40, dropped: 0, corrupted: 0, attached: false };
  assert.equal(presentedRateBetween(a, b), null);
});
check("dropped đi lùi → null", () => {
  const a: PresentedSample = { wallMs: 0, total: 300, dropped: 20, corrupted: 0, attached: false };
  const b: PresentedSample = { wallMs: 10_000, total: 600, dropped: 5, corrupted: 0, attached: false };
  assert.equal(presentedRateBetween(a, b), null);
});

// 8. Không có frame nào nhưng wall tiến: dropRatio 0, không NaN.
check("0 frame / wall tiến → presentedFps 0, dropRatio 0 (không NaN)", () => {
  const a: PresentedSample = { wallMs: 0, total: 0, dropped: 0, corrupted: 0, attached: true };
  const b: PresentedSample = { wallMs: 5000, total: 0, dropped: 0, corrupted: 0, attached: true };
  const r = presentedRateBetween(a, b)!;
  assert.ok(r);
  assert.equal(r.presentedFps, 0);
  assert.equal(r.dropRatio, 0);
  assert.ok(!Number.isNaN(r.dropRatio));
});

// 9. Số lẻ: 299 frame / 9.97 s ≈ 29.99 fps (làm tròn ở tầng hiển thị, không ở đây).
check("tỉ lệ giữ nguyên số thực, không làm tròn trong lib", () => {
  const a: PresentedSample = { wallMs: 100, total: 0, dropped: 0, corrupted: 0, attached: true };
  const b: PresentedSample = { wallMs: 10_070, total: 299, dropped: 3, corrupted: 0, attached: true };
  const r = presentedRateBetween(a, b)!;
  assert.ok(Math.abs(r.presentedFps - 299 / 9.97) < 1e-9);
  assert.ok(Math.abs(r.droppedFps - 3 / 9.97) < 1e-9);
});

console.log(`presentedFps65R8: ${n}/${n} pass`);
