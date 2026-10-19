#!/usr/bin/env node
/**
 * image.js — Image clip (ảnh tĩnh) cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/image.ts` về ngữ nghĩa:
 *   fit = "contain" (giữ tỉ lệ + letterbox/pillarbox nền đen, mặc định)
 *       | "cover"   (phóng to lấp đầy + crop giữa)
 *
 * Render bằng FFmpeg ở filter-level (KHÔNG cần `-loop 1` ở input):
 *   [i:v]loop=loop=-1:size=32767,fps=30,trim=duration=D,setpts=PTS-STARTPTS,
 *         scale=640:360:force_original_aspect_ratio=decrease,
 *         pad=640:360:(ow-iw)/2:(oh-ih)/2:color=black,   (contain)
 *         — hoặc —
 *         scale=640:360:force_original_aspect_ratio=increase,crop=640:360,  (cover)
 *         setsar=1,format=yuv420p
 * rồi đặt lên timeline bằng setpts=PTS+start/TB + overlay eof_action=pass
 * (giống hệt pattern video unit trong render.js).
 *
 * Vì sao không dùng `-loop 1` ở input: sticker module cũng dùng filter `loop`
 * cho PNG. Nếu input đã `-loop 1` (stream vô hạn) thì filter loop của sticker
 * sẽ đệm 32767 frame (~11GB RAM ở 640x360) trước khi xuất — cùng một file vừa
 * làm image clip vừa làm sticker sẽ nổ RAM. Filter-level loop tránh hoàn toàn
 * xung đột này và không cần sửa logic đăng ký input trong render.js
 * (pattern đã được kiểm chứng thực tế bởi sticker module).
 *
 * Alpha: PNG trong suốt được flatten về nền đen (format=yuv420p bỏ kênh alpha).
 *
 * Giới hạn (xem IMAGE_LIMITS.md):
 * - Một image clip tối đa ~18 phút ở 30fps (giới hạn filter loop).
 * - Chưa hỗ trợ transition, LUT, effects, keyframe cho image clip.
 *
 * Chạy self-test: node src/image.js --self-test
 */
"use strict";

const assert = require("assert");

const IMAGE_DEFAULTS = { fit: "contain" };
/** loop tối đa 32767 frame ≈ 18 phút ở 30fps (giới hạn cứng của filter loop). */
const LOOP_MAX = 32767;

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học. */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function isImageFit(v) {
  return v === "contain" || v === "cover";
}

function normalizeImageClip(c) {
  return {
    kind: "image",
    id: c.id,
    src: c.src,
    start: c.start,
    duration: c.duration,
    fit: c.fit ?? IMAGE_DEFAULTS.fit,
  };
}

/** Mirror validateImageClip() bản TypeScript. Trả về mảng lỗi (rỗng = hợp lệ). */
function validateImage(c) {
  const errors = [];
  if (typeof c !== "object" || c === null) return ["image phải là một object"];
  const where = `image "${c.id ?? "?"}"`;
  if (c.kind !== "image") errors.push(`${where}: kind phải là "image"`);
  if (typeof c.id !== "string" || c.id.length === 0) errors.push(`${where}: thiếu id`);
  if (typeof c.src !== "string" || c.src.length === 0)
    errors.push(`${where}: thiếu src (đường dẫn file ảnh)`);
  if (!isFiniteNumber(c.start) || c.start < 0)
    errors.push(`${where}: start phải là số >= 0`);
  if (!isFiniteNumber(c.duration) || c.duration <= 0)
    errors.push(`${where}: duration phải là số > 0`);
  if (c.fit !== undefined && !isImageFit(c.fit))
    errors.push(`${where}: fit phải là "contain" | "cover", nhận được: ${JSON.stringify(c.fit)}`);
  return errors;
}

/**
 * Dựng filter chain biến ảnh tĩnh thành video stream dài đúng `duration`.
 *
 * @param {object} clip  image clip (đã hoặc chưa normalize — hàm tự normalize)
 * @param {number} W     chiều rộng khung hình output (số nguyên dương)
 * @param {number} H     chiều cao khung hình output (số nguyên dương)
 * @param {number} fps   fps output
 * @returns {string} filter (chưa có label), ví dụ:
 *   "loop=loop=-1:size=32767,fps=30,trim=duration=3,setpts=PTS-STARTPTS,
 *    scale=640:360:force_original_aspect_ratio=decrease,
 *    pad=640:360:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p"
 */
function buildImageChain(clip, W, H, fps) {
  const c = normalizeImageClip(clip);
  const errs = validateImage(c);
  if (errs.length > 0) throw new Error(`image không hợp lệ: ${errs.join("; ")}`);
  if (!Number.isInteger(W) || W <= 0 || !Number.isInteger(H) || H <= 0)
    throw new Error(`W, H phải là số nguyên dương, nhận được: ${W}, ${H}`);
  if (!isFiniteNumber(fps) || fps <= 0)
    throw new Error(`fps phải là số dương, nhận được: ${fps}`);

  // contain: giữ tỉ lệ, letterbox/pillarbox nền đen. cover: lấp đầy + crop giữa.
  const fitPart =
    c.fit === "cover"
      ? `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`
      : `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`;

  return [
    `loop=loop=-1:size=${LOOP_MAX}`,
    `fps=${num(fps)}`,
    `trim=duration=${num(c.duration)}`,
    "setpts=PTS-STARTPTS",
    fitPart,
    "setsar=1",
    "format=yuv420p",
  ].join(",");
}

// ---------------------------------------------------------------------------
// Self-test: node src/image.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Mặc định (contain)
  let r = buildImageChain(
    { kind: "image", id: "a", src: "a.png", start: 0, duration: 3 }, 640, 360, 30
  );
  assert.ok(r.startsWith("loop=loop=-1:size=32767"), `thiếu loop: ${r}`);
  assert.ok(r.includes("fps=30"), `thiếu fps: ${r}`);
  assert.ok(r.includes("trim=duration=3"), `trim sai: ${r}`);
  assert.ok(r.includes("setpts=PTS-STARTPTS"), "thiếu setpts");
  assert.ok(
    r.includes("scale=640:360:force_original_aspect_ratio=decrease"),
    `contain scale sai: ${r}`
  );
  assert.ok(
    r.includes("pad=640:360:(ow-iw)/2:(oh-ih)/2:color=black"),
    `contain pad sai: ${r}`
  );
  assert.ok(!r.includes("crop="), "contain không được crop");
  assert.ok(r.endsWith("setsar=1,format=yuv420p"), `đuôi sai: ${r}`);

  // 2. Cover
  r = buildImageChain(
    { kind: "image", id: "b", src: "b.jpg", start: 1, duration: 2.5, fit: "cover" },
    1280, 720, 30
  );
  assert.ok(
    r.includes("scale=1280:720:force_original_aspect_ratio=increase"),
    `cover scale sai: ${r}`
  );
  assert.ok(r.includes("crop=1280:720"), `cover crop sai: ${r}`);
  assert.ok(!r.includes("pad="), "cover không được pad");
  assert.ok(r.includes("trim=duration=2.5"), `trim cover sai: ${r}`);

  // 3. normalize điền fit mặc định
  assert.strictEqual(normalizeImageClip(
    { kind: "image", id: "x", src: "x.png", start: 0, duration: 1 }).fit, "contain");

  // 4. validate từ chối input sai
  assert.ok(validateImage(null).length > 0);
  assert.ok(validateImage({ kind: "image", id: "x", src: "a.png", start: 0, duration: 1, fit: "stretch" })
    .some((m) => m.includes("fit")));
  assert.ok(validateImage({ kind: "video", id: "x", src: "a.png", start: 0, duration: 1 })
    .some((m) => m.includes('kind phải là "image"')));
  assert.ok(validateImage({ kind: "image", id: "x", src: "", start: 0, duration: 1 })
    .some((m) => m.includes("src")));
  assert.ok(validateImage({ kind: "image", id: "x", src: "a.png", start: -1, duration: 1 })
    .some((m) => m.includes("start")));
  assert.ok(validateImage({ kind: "image", id: "x", src: "a.png", start: 0, duration: 0 })
    .some((m) => m.includes("duration")));

  // 5. buildImageChain throw khi clip sai
  assert.throws(() => buildImageChain(
    { kind: "image", id: "x", src: "a.png", start: 0, duration: 1, fit: "zoom" }, 640, 360, 30),
    /không hợp lệ/);

  // 6. W/H/fps sai throw
  assert.throws(() => buildImageChain(
    { kind: "image", id: "x", src: "a.png", start: 0, duration: 1 }, 0, 360, 30),
    /nguyên dương/);
  assert.throws(() => buildImageChain(
    { kind: "image", id: "x", src: "a.png", start: 0, duration: 1 }, 640, 360, 0),
    /fps/);

  // 7. isImageFit
  assert.ok(isImageFit("contain") && isImageFit("cover"));
  assert.ok(!isImageFit("fill") && !isImageFit(undefined));

  console.log("✅ image.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("image.js — module image clip cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  IMAGE_DEFAULTS,
  LOOP_MAX,
  num,
  isImageFit,
  normalizeImageClip,
  validateImage,
  buildImageChain,
};
