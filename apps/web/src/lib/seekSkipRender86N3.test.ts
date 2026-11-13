// seekSkipRender86N3.test.ts — Khóa bảng quyết định bỏ qua renderFrame
// khi clip video xuôi đang seeking (đợt 86 N3, W6).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/seekSkipRender86N3.test.ts
// (chạy từ gốc repo).
import assert from "node:assert/strict";
import {
  shouldSkipRenderWhileSeeking,
  type SeekSkipRenderActive,
} from "./seekSkipRender86N3.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
const video = (p?: Partial<SeekSkipRenderActive>): SeekSkipRenderActive => ({
  tag: "VIDEO",
  seeking: false,
  reverse: false,
  ...p,
});
const audio = (p?: Partial<SeekSkipRenderActive>): SeekSkipRenderActive => ({
  tag: "AUDIO",
  seeking: false,
  reverse: false,
  ...p,
});

ok("video xuôi đang seeking -> skip render", () => {
  assert.equal(shouldSkipRenderWhileSeeking(false, [video({ seeking: true })]), true);
});
ok("video xuôi không seeking -> vẽ bình thường", () => {
  assert.equal(shouldSkipRenderWhileSeeking(false, [video({ seeking: false })]), false);
});
ok("không có active nào -> vẽ bình thường", () => {
  assert.equal(shouldSkipRenderWhileSeeking(false, []), false);
});
ok("chỉ audio seeking -> vẽ bình thường (audio không vẽ gì)", () => {
  assert.equal(shouldSkipRenderWhileSeeking(false, [audio({ seeking: true })]), false);
});
ok("video seeking + audio seeking -> skip (video quyết định)", () => {
  assert.equal(
    shouldSkipRenderWhileSeeking(false, [audio({ seeking: true }), video({ seeking: true })]),
    true,
  );
});
ok("clip reverse đang seeking -> KHÔNG skip (đường stepping tự hold)", () => {
  assert.equal(shouldSkipRenderWhileSeeking(false, [video({ seeking: true, reverse: true })]), false);
});
ok("phát ngược toàn cục -> KHÔNG skip dù video seeking (stepping)", () => {
  assert.equal(shouldSkipRenderWhileSeeking(true, [video({ seeking: true })]), false);
});
ok("nhiều clip: chỉ 1 video xuôi seeking cũng đủ skip", () => {
  assert.equal(
    shouldSkipRenderWhileSeeking(false, [
      video({ seeking: false }),
      video({ seeking: false, reverse: true }),
      video({ seeking: true }),
    ]),
    true,
  );
});
ok("nhiều clip toàn reverse/paused -> vẽ bình thường", () => {
  assert.equal(
    shouldSkipRenderWhileSeeking(false, [
      video({ seeking: true, reverse: true }),
      video({ seeking: false }),
    ]),
    false,
  );
});

console.log(`seekSkipRender86N3: ${pass}/9 test pass`);
if (process.exitCode) console.log("seekSkipRender86N3: CÓ TEST FAIL");
