#!/usr/bin/env node
/**
 * sticker.js — Sticker overlay cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/sticker.ts` về ngữ nghĩa:
 *   x, y      = tâm sticker, 0..1 tương đối khung hình (mặc định 0.5)
 *   scale     = chiều rộng sticker / chiều rộng khung hình (mặc định 0.25)
 *   opacity   = 0..1 (mặc định 1)
 *   rotation  = độ, mặc định 0
 *
 * Module này KHÔNG sửa render.js — nó cung cấp:
 *   - normalizeSticker(st): điền mặc định
 *   - validateSticker(st): kiểm tra shape (mirror bản TS)
 *   - buildStickerOverlay(st, W, H): { filter, x, y }
 *       filter: chuỗi filter cho input PNG (chưa có label), ví dụ
 *         "loop=loop=-1:size=1000000,scale=320:-2,format=yuva420p,
 *          colorchannelmixer=aa=0.8,setpts=PTS-STARTPTS"
 *       x, y: biểu thức vị trí cho filter overlay (tâm sticker tại W*x, H*y)
 *
 * Cách dùng trong render.js (agent chính tích hợp), với mỗi sticker track:
 *   const { filter, x, y } = buildStickerOverlay(st, W, H);
 *   fc.push(`[${idx}:v]${filter}[stk${k}]`);
 *   fc.push(`[stk${k}]setpts=PTS+${num(st.start)}/TB[stkp${k}]`);
 *   fc.push(`${base}[stkp${k}]overlay=${x}:${y}:eof_action=pass[${nb}]`);
 *   // (giống pattern đặt video unit lên timeline — overlay đồng bộ theo timestamp)
 *
 * Chạy self-test: node src/sticker.js --self-test
 */
"use strict";

const assert = require("assert");

const STICKER_DEFAULTS = { x: 0.5, y: 0.5, scale: 0.25, opacity: 1, rotation: 0 };

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học. */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function normalizeSticker(st) {
  return {
    kind: "sticker",
    id: st.id,
    src: st.src,
    start: st.start,
    duration: st.duration,
    x: st.x ?? STICKER_DEFAULTS.x,
    y: st.y ?? STICKER_DEFAULTS.y,
    scale: st.scale ?? STICKER_DEFAULTS.scale,
    opacity: st.opacity ?? STICKER_DEFAULTS.opacity,
    rotation: st.rotation ?? STICKER_DEFAULTS.rotation,
  };
}

/** Mirror validateStickerClip() bản TypeScript. Trả về mảng lỗi (rỗng = hợp lệ). */
function validateSticker(st) {
  const errors = [];
  if (typeof st !== "object" || st === null) return ["sticker phải là một object"];
  const where = `sticker "${st.id ?? "?"}"`;
  if (st.kind !== "sticker") errors.push(`${where}: kind phải là "sticker"`);
  if (typeof st.id !== "string" || st.id.length === 0) errors.push(`${where}: thiếu id`);
  if (typeof st.src !== "string" || st.src.length === 0)
    errors.push(`${where}: thiếu src (đường dẫn file PNG)`);
  if (!isFiniteNumber(st.start) || st.start < 0) errors.push(`${where}: start phải là số >= 0`);
  if (!isFiniteNumber(st.duration) || st.duration <= 0)
    errors.push(`${where}: duration phải là số > 0`);
  for (const key of ["x", "y"]) {
    const v = st[key];
    if (v !== undefined && (!isFiniteNumber(v) || v < 0 || v > 1))
      errors.push(`${where}: ${key} phải trong khoảng 0..1, nhận được: ${v}`);
  }
  if (st.scale !== undefined && (!isFiniteNumber(st.scale) || st.scale <= 0))
    errors.push(`${where}: scale phải là số > 0, nhận được: ${st.scale}`);
  if (
    st.opacity !== undefined &&
    (!isFiniteNumber(st.opacity) || st.opacity < 0 || st.opacity > 1)
  )
    errors.push(`${where}: opacity phải trong khoảng 0..1, nhận được: ${st.opacity}`);
  if (st.rotation !== undefined && !isFiniteNumber(st.rotation))
    errors.push(`${where}: rotation phải là số (độ), nhận được: ${st.rotation}`);
  return errors;
}

/**
 * Chiều rộng sticker (px, số chẵn cho yuv420p) từ scale tương đối.
 * @returns {number} số nguyên chẵn >= 2
 */
function stickerWidthPx(scale, W) {
  return Math.max(2, Math.round((W * scale) / 2) * 2);
}

/**
 * Dựng filter + biểu thức overlay cho một sticker.
 *
 * @param {object} st  sticker (đã hoặc chưa normalize — hàm tự normalize)
 * @param {number} W   chiều rộng khung hình output
 * @param {number} H   chiều cao khung hình output
 * @returns {{ filter: string, x: string, y: string }}
 */
function buildStickerOverlay(st, W, H) {
  const s = normalizeSticker(st);
  const errs = validateSticker(s);
  if (errs.length > 0) throw new Error(`sticker không hợp lệ: ${errs.join("; ")}`);
  if (!Number.isInteger(W) || W <= 0 || !Number.isInteger(H) || H <= 0)
    throw new Error(`W, H phải là số nguyên dương, nhận được: ${W}, ${H}`);

  const parts = [];
  // PNG là ảnh tĩnh (1 frame) → loop để overlay theo timestamp
  // (giống pattern video unit trong render.js). size=32767 là max của filter loop,
  // đủ cho ~18 phút ở 30fps.
  parts.push("loop=loop=-1:size=32767");
  parts.push(`scale=${stickerWidthPx(s.scale, W)}:-2`);
  parts.push("format=yuva420p");
  if (Math.abs(s.rotation) > 1e-9) {
    // fillcolor=none giữ nền trong suốt khi xoay
    parts.push(`rotate=${num((s.rotation * Math.PI) / 180)}:fillcolor=none`);
  }
  if (Math.abs(s.opacity - 1) > 1e-9) {
    parts.push(`colorchannelmixer=aa=${num(s.opacity)}`);
  }
  parts.push("setpts=PTS-STARTPTS");

  // Vị trí: TÂM sticker tại (W*x, H*y).
  const x = `(main_w*${num(s.x)}-overlay_w/2)`;
  const y = `(main_h*${num(s.y)}-overlay_h/2)`;
  return { filter: parts.join(","), x, y };
}

// ---------------------------------------------------------------------------
// Self-test: node src/sticker.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Mặc định
  let r = buildStickerOverlay(
    { kind: "sticker", id: "a", src: "s.png", start: 1, duration: 2 }, 1280, 720
  );
  assert.ok(r.filter.includes("scale=320:-2"), `scale mặc định sai: ${r.filter}`);
  assert.ok(r.filter.includes("format=yuva420p"), "thiếu yuva420p");
  assert.ok(!r.filter.includes("rotate"), "không xoay thì không cần filter rotate");
  assert.ok(!r.filter.includes("colorchannelmixer"), "opacity=1 thì không cần mixer");
  assert.strictEqual(r.x, "(main_w*0.5-overlay_w/2)");
  assert.strictEqual(r.y, "(main_h*0.5-overlay_h/2)");

  // 2. Tùy chỉnh đầy đủ
  r = buildStickerOverlay(
    { kind: "sticker", id: "b", src: "s.png", start: 0, duration: 3,
      x: 0.2, y: 0.8, scale: 0.5, opacity: 0.6, rotation: 45 },
    640, 360
  );
  assert.ok(r.filter.includes("scale=320:-2"), `scale 0.5 của 640 phải = 320: ${r.filter}`);
  assert.ok(r.filter.includes("rotate=0.785398"), `rotate 45° sai: ${r.filter}`);
  assert.ok(r.filter.includes("fillcolor=none"), "rotate phải giữ alpha");
  assert.ok(r.filter.includes("colorchannelmixer=aa=0.6"), `opacity sai: ${r.filter}`);
  assert.strictEqual(r.x, "(main_w*0.2-overlay_w/2)");
  assert.strictEqual(r.y, "(main_h*0.8-overlay_h/2)");

  // 3. loop cho ảnh tĩnh luôn có
  assert.ok(r.filter.startsWith("loop=loop=-1:size=32767"), "thiếu loop cho ảnh tĩnh");

  // 4. scale lẻ → làm tròn số chẵn
  assert.strictEqual(stickerWidthPx(0.333, 640), 214); // 213.12 → 214

  // 5. validate từ chối input sai
  assert.ok(validateSticker(null).length > 0);
  assert.ok(validateSticker({ kind: "sticker", id: "x", src: "a.png", start: 0, duration: 1, x: 2 }).some((m) => m.includes("x ")));
  assert.ok(validateSticker({ kind: "sticker", id: "x", src: "a.png", start: 0, duration: 1, scale: 0 }).some((m) => m.includes("scale")));
  assert.ok(validateSticker({ kind: "sticker", id: "x", src: "a.png", start: 0, duration: 1, opacity: 1.5 }).some((m) => m.includes("opacity")));
  assert.ok(validateSticker({ kind: "sticker", id: "x", src: "", start: 0, duration: 1 }).some((m) => m.includes("src")));

  // 6. buildStickerOverlay throw khi sticker sai
  assert.throws(() => buildStickerOverlay(
    { kind: "sticker", id: "x", src: "a.png", start: 0, duration: 1, scale: -1 }, 640, 360),
    /không hợp lệ/);

  // 7. W/H sai throw
  assert.throws(() => buildStickerOverlay(
    { kind: "sticker", id: "x", src: "a.png", start: 0, duration: 1 }, 0, 360),
    /nguyên dương/);

  console.log("✅ sticker.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("sticker.js — module sticker overlay cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  STICKER_DEFAULTS,
  num,
  normalizeSticker,
  validateSticker,
  stickerWidthPx,
  buildStickerOverlay,
};
