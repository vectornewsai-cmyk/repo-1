// settleDeferred42X1.test.ts — Đợt 42 luồng X1: khóa ngữ nghĩa thuần của
// LẦN DỌN THỬ LẠI trong settle-drop (nợ đợt 41 §5.2, LIMITS W1 §0.2/§3).
//
// Bối cảnh: W1 đã chứng minh trên browser rằng prefetch settle trong lúc
// decode cửa sổ bay thì KHÔNG bị dọn ngay (thời điểm hoãn), nhưng lần
// dọn cuối trong phép đo đó KHÔNG vào counter vì cửa sổ W2 bình thường
// tự evictExcept(keep = cửa sổ W2) trước khi decodePromise resolve —
// lần thử lại chain sau đó tìm thấy 0 frame để dọn. Test thuần này
// KHÔNG mạo nhận bằng chứng browser (bằng chứng đó nằm ở click-test
// clicktest-round42-x1-settle-cleanup-pipe.mjs + LIMITS X1); nó chỉ
// khóa phần số học thuần giải thích vì sao hai đường cho hai kết quả
// counter khác nhau:
//
// - Đường suy biến (W2 kết thúc KHÔNG evict: load hỏng / decode 0 frame
//   / cùng cửa sổ / fetch GOP hỏng): lastDecodeRange vẫn là cửa sổ CŨ,
//   keep = cửa sổ cũ, frame prefetch nằm NGOÀI keep nên lần thử lại
//   dọn được đúng số frame prefetch còn trong cache → counter tăng.
// - Đường bình thường (W2 evict trước khi resolve): lastDecodeRange đã
//   là cửa sổ W2; nếu cửa sổ W2 chứa frame prefetch (hoặc đã evict
//   chúng) thì lần thử lại dọn được 0 — counter đứng yên, đúng như W1.
//
// Chạy bằng esbuild bundle (cùng lý do test W1/T4: import không đuôi
// `.ts` nên Node strip-types không resolve):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settleDeferred42X1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/x1.test.cjs \
//     && node <scratch>/x1.test.cjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra dist.)
import assert from "node:assert/strict";
import {
  keepIndicesForWindow,
  shouldDropSettledPrefetch,
} from "./reverseDecodeAheadToggle.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}

// Mô phỏng evictExcept(keep) trên tập cache bằng số index: trả số frame
// bị dọn. Đây là cùng phép tính mà dropSettledPrefetchIfOff dùng
// (cache.evictExcept(keepIndicesForWindow(lastDecodeRange))).
function droppedCount(cached: number[], keep: Set<number>): number {
  return cached.filter((i) => !keep.has(i)).length;
}

// Đường suy biến: cửa sổ cũ [120..134], prefetch [90..104] (đoạn trước
// cửa sổ cũ, không giao nhau). Cache sau khi W2 kết thúc không evict
// vẫn giữ cả hai đoạn → lần thử lại dọn đúng 15 frame prefetch,
// giữ nguyên 15 frame cửa sổ cũ.
ok("suy biến: W2 không evict → lần thử lại dọn hết frame prefetch ngoài cửa sổ cũ", () => {
  const cached = [...Array.from({ length: 15 }, (_, k) => 90 + k), ...Array.from({ length: 15 }, (_, k) => 120 + k)];
  const keep = keepIndicesForWindow({ from: 120, to: 134 });
  assert.equal(droppedCount(cached, keep), 15);
  assert.equal(keep.has(90), false);
  assert.equal(keep.has(104), false);
  assert.equal(keep.has(120), true);
  assert.equal(keep.has(134), true);
});

// Đường bình thường, trường hợp W2 đã evict: cache lúc thử lại chỉ còn
// cửa sổ W2 [200..214] (prefetch đã bị evict của W2 dọn) → dọn 0.
ok("bình thường: W2 đã evict → cache lúc thử lại chỉ còn cửa sổ W2, dọn 0", () => {
  const cached = Array.from({ length: 15 }, (_, k) => 200 + k);
  const keep = keepIndicesForWindow({ from: 200, to: 214 });
  assert.equal(droppedCount(cached, keep), 0);
});

// Đường bình thường, trường hợp cửa sổ W2 CHỨA frame prefetch (W2 decode
// đúng đoạn prefetch): keep = cửa sổ W2 bao luôn prefetch → dọn 0.
// Đây là lý do thứ hai khiến lần thử lại có thể về 0 dù prefetch còn
// trong cache: chúng đã thành frame của cửa sổ hiện tại.
ok("bình thường: cửa sổ W2 chứa prefetch → keep bao luôn, dọn 0", () => {
  const cached = Array.from({ length: 30 }, (_, k) => 90 + k);
  const keep = keepIndicesForWindow({ from: 90, to: 119 });
  assert.equal(droppedCount(cached, keep), 0);
});

// Điều kiện để lần thử lại được chạy tới evict: tắt + chưa dispose +
// không còn decode bay (decodePromise đã null sau khi W2 kết thúc).
// Đây là đúng tổ hợp dọn-ngay của T4/W1, áp dụng cho lần gọi thứ hai.
ok("điều kiện lần thử lại: tắt + chưa dispose + hết decode bay → dọn", () => {
  assert.equal(shouldDropSettledPrefetch(false, false, false), true);
});

// Nếu W2 kết thúc bằng dispose thì lần thử lại KHÔNG dọn (guard
// disposed), dù cache còn frame prefetch — khóa để không ai đọc nhầm
// "W2 kết thúc không evict nào cũng cho counter tăng".
ok("ngoại lệ: W2 kết thúc bằng dispose → lần thử lại không dọn", () => {
  assert.equal(shouldDropSettledPrefetch(false, true, false), false);
});

// Nếu user bật lại toggle trước khi lần thử lại chạy thì cũng không
// dọn (prefetch đã thành tài sản của chế độ bật).
ok("ngoại lệ: bật lại trước lần thử lại → không dọn", () => {
  assert.equal(shouldDropSettledPrefetch(true, false, false), false);
});

// Prefetch giao một phần cửa sổ cũ: chỉ phần ngoài mới bị dọn (10
// frame trước + 5 frame sau = 15) — lần thử lại không bao giờ xóa
// frame thuộc cửa sổ hiện tại.
ok("prefetch giao cửa sổ cũ: chỉ dọn phần ngoài, giữ phần giao", () => {
  const cached = Array.from({ length: 30 }, (_, k) => 110 + k);
  const keep = keepIndicesForWindow({ from: 120, to: 134 });
  assert.equal(droppedCount(cached, keep), 15);
});

for (const t of queue) {
  t.fn();
  pass++;
  console.log(`ok ${pass} - ${t.name}`);
}
console.log(`# pass ${pass}/${queue.length}`);
if (pass !== queue.length) process.exit(1);
