/**
 * sampleMime73A7.test.ts — Phase 9 đợt 73, luồng A7: nhãn container MIME
 * của media mẫu phải theo đúng recorder thật sự dùng (xem
 * apps/web/src/lib/sampleMime.ts).
 *
 * Khóa bằng hàm thuần (không cần DOM/trình duyệt):
 *  - "video/webm;codecs=vp9" (Chromium) → "video/webm" (hành vi cũ giữ nguyên).
 *  - "video/webm" → "video/webm".
 *  - "video/mp4" (mặc định của Safari khi webm không được hỗ trợ) → "video/mp4".
 *  - "video/mp4;codecs=avc1.42E01E" → "video/mp4" (cắt tham số codec).
 *  - undefined / "" / "text/plain" / "video/" → "video/webm" (fallback cũ).
 *
 * Chạy (từ gốc repo): node --experimental-strip-types apps/web/src/lib/sampleMime73A7.test.ts
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import { recorderContainerType } from "./sampleMime.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

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

test("Chromium webm+vp9 → video/webm (không đổi hành vi cũ)", () => {
  assert.equal(recorderContainerType("video/webm;codecs=vp9"), "video/webm");
  assert.equal(recorderContainerType("video/webm;codecs=vp8"), "video/webm");
  assert.equal(recorderContainerType("video/webm"), "video/webm");
});

test("Safari mặc định mp4 → video/mp4 (sửa nhãn sai webm)", () => {
  assert.equal(recorderContainerType("video/mp4"), "video/mp4");
  assert.equal(recorderContainerType("video/mp4;codecs=avc1.42E01E"), "video/mp4");
});

test("không đọc được mime hợp lệ → fallback video/webm", () => {
  assert.equal(recorderContainerType(undefined), "video/webm");
  assert.equal(recorderContainerType(null), "video/webm");
  assert.equal(recorderContainerType(""), "video/webm");
  assert.equal(recorderContainerType("text/plain"), "video/webm");
  assert.equal(recorderContainerType("video/"), "video/webm");
});

test("chuẩn hoá khoảng trắng/hoa-thường", () => {
  assert.equal(recorderContainerType("  VIDEO/MP4 ; codecs=avc1"), "video/mp4");
});

console.log(`\nsampleMime73A7: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
