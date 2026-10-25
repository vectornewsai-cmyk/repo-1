// proxyAuto.test.ts — test shouldAutoProxy (Phase 9 R3).
// Chạy: node --experimental-strip-types apps/web/src/lib/proxyAuto.test.ts
import assert from "node:assert/strict";
import { shouldAutoProxy } from "./proxy.ts";
import type { MediaItem } from "../media.ts";

let pass = 0;
let fail = 0;
function ok(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

const video = (over: Partial<MediaItem> = {}): MediaItem => ({
  id: "m1",
  name: "a.mp4",
  kind: "video",
  url: "blob:x",
  duration: 10,
  file: new File(["x"], "a.mp4", { type: "video/mp4" }),
  ...over,
});

console.log("== shouldAutoProxy ==");
ok("video 1080p + bật tự động -> tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 1080 }), true), true);
});
ok("tắt tự động -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 1080 }), false), false);
});
ok("video 720p đã đủ nhỏ -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 720 }), true), false);
});
ok("video 480p -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 480 }), true), false);
});
ok("chưa biết chiều cao -> vẫn thử (bridge quyết)", () => {
  assert.equal(shouldAutoProxy(video({}), true), true);
});
ok("đã có proxy -> không tạo lại", () => {
  assert.equal(shouldAutoProxy(video({ height: 1080, proxyUrl: "http://x/p.mp4" }), true), false);
});
ok("không có File gốc -> không tạo", () => {
  const v = video({ height: 1080 });
  delete (v as Partial<MediaItem>).file;
  assert.equal(shouldAutoProxy(v, true), false);
});
ok("ảnh/audio -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ kind: "image", height: 2000 }), true), false);
  assert.equal(shouldAutoProxy(video({ kind: "audio" }), true), false);
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
