// settleDeferred41W1.test.ts — Đợt 41 luồng W1: khóa luật nhánh hoãn-dọn
// của settle-drop (nợ đợt 40 §5.5, V4 §5.1).
//
// Bối cảnh (đọc reverseWebcodecs.ts dropSettledPrefetchIfOff trước khi
// đổi): khi prefetch settle mà controller đang tắt VÀ đang có decode
// cửa sổ bay thì hàm KHÔNG evict ngay mà chain thử lại vào
// decodePromise — predicate shouldDropSettledPrefetch trả false đúng
// trường hợp này. Test thuần này chỉ khóa predicate (phần quyết định
// có dọn hay hoãn); bằng chứng thời gian thật (settle trong lúc decode
// bay → chưa dọn, dọn chỉ sau khi decode xong) nằm ở click-test
// browser clicktest-round41-w1-settle-deferred-pipe.mjs và LIMITS W1
// — test thuần KHÔNG mạo nhận đã chứng minh nhánh trên browser.
//
// Chạy bằng esbuild bundle (cùng lý do test T4/V4: import mp4Demux
// không đuôi nên Node strip-types không resolve):
//   ./node_modules/.bin/esbuild apps/web/src/lib/settleDeferred41W1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/w1.test.cjs \
//     && node <scratch>/w1.test.cjs
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

// Nhánh hoãn: tắt + chưa dispose + decode đang bay → KHÔNG dọn ngay.
ok("hoãn-dọn: tắt + decode đang bay → shouldDrop = false", () => {
  assert.equal(shouldDropSettledPrefetch(false, false, true), false);
});

// Đối chứng dọn-ngay: tắt + chưa dispose + không decode bay → dọn.
ok("dọn-ngay: tắt + không decode bay → shouldDrop = true", () => {
  assert.equal(shouldDropSettledPrefetch(false, false, false), true);
});

// Hai trường hợp còn lại của luật T4 đều không dọn (không phải hoãn):
// bật lại rồi thì để nguyên; dispose rồi thì thôi, không dọn nữa.
ok("không dọn khi đã bật lại, kể cả có decode bay", () => {
  assert.equal(shouldDropSettledPrefetch(true, false, true), false);
  assert.equal(shouldDropSettledPrefetch(true, false, false), false);
});
ok("không dọn khi đã dispose, kể cả decode đang bay", () => {
  assert.equal(shouldDropSettledPrefetch(false, true, true), false);
  assert.equal(shouldDropSettledPrefetch(false, true, false), false);
});

// keep của lần dọn thử lại là cửa sổ hiện tại: evictExcept chỉ giữ
// đúng đoạn đó, frame prefetch ngoài đoạn đó mới bị dọn — nên nhánh
// hoãn tồn tại chính để tránh evict nhầm frame của cửa sổ đang decode
// dở (nếu dọn ngay, keep lúc settle vẫn là cửa sổ cũ, không phải cửa
// sổ đang bay). Khóa tập keep ở mức thuần để lần đổi keep sau này
// không lặng lẽ đổi ngữ nghĩa của lần dọn thử lại.
ok("keepIndicesForWindow: giữ đúng [from..to], rỗng khi range null", () => {
  const keep = keepIndicesForWindow({ from: 120, to: 134 });
  assert.equal(keep.size, 15);
  assert.equal(keep.has(120), true);
  assert.equal(keep.has(134), true);
  assert.equal(keep.has(119), false);
  assert.equal(keep.has(135), false);
  assert.equal(keepIndicesForWindow(null).size, 0);
});

// Ma trận đầy đủ 8 tổ hợp (enabled × disposed × decodeInFlight):
// chỉ đúng 1 tổ hợp dọn (false,false,false), còn lại đều không dọn —
// trong đó chỉ (false,false,true) là hoãn có thử lại, các tổ hợp còn
// lại là bỏ hẳn. Ghi rõ để không ai đọc nhầm "false = hoãn" cho mọi
// trường hợp.
ok("ma trận đầy đủ: chỉ (tắt, chưa dispose, không decode bay) mới dọn", () => {
  const cases: Array<[boolean, boolean, boolean, boolean]> = [
    [false, false, false, true],
    [false, false, true, false],
    [false, true, false, false],
    [false, true, true, false],
    [true, false, false, false],
    [true, false, true, false],
    [true, true, false, false],
    [true, true, true, false],
  ];
  for (const [en, dis, infl, want] of cases) {
    assert.equal(
      shouldDropSettledPrefetch(en, dis, infl),
      want,
      `enabled=${en} disposed=${dis} decodeInFlight=${infl}`,
    );
  }
});

for (const t of queue) {
  t.fn();
  pass++;
  console.log(`ok ${pass} - ${t.name}`);
}
console.log(`# pass ${pass}/${queue.length}`);
if (pass !== queue.length) process.exit(1);
