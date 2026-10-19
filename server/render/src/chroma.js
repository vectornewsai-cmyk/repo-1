#!/usr/bin/env node
/**
 * chroma.js — Chroma key (xoá phông xanh/lục) cho render worker (Node, zero-deps).
 *
 * Dùng filter `chromakey` CÓ SẴN của FFmpeg — không ML, không cloud, chạy thật 100%.
 *   chromakey=color=0x00FF00:similarity=0.3:blend=0.1
 *
 * Module này KHÔNG sửa render.js — nó cung cấp:
 *   - validateChroma(chroma): kiểm tra shape (mirror bản TS trong chroma.ts).
 *   - normalizeChroma(chroma): điền giá trị mặc định.
 *   - hexToFFmpegColor(hex): "#00FF00" -> "0x00FF00".
 *   - buildChromaFilter(chroma): chuỗi filter để chèn vào chain video.
 *
 * Cách tích hợp trong render.js (agent chính):
 *   const { buildChromaFilter } = require("./chroma");
 *   // Trong bước 1 (chuẩn hoá từng clip), sau `format=yuv420p`:
 *   //   - nếu clip.chromaKey: thay `format=yuv420p` bằng
 *   //     `format=yuva420p,<buildChromaFilter(clip.chromaKey)>`
 *   //     (giữ kênh alpha để overlay ở bước timeline composite đúng)
 *   //   - nếu không: giữ nguyên `format=yuv420p`
 *   // Ví dụ:
 *   //   const ck = clip.chromaKey ? `,${buildChromaFilter(clip.chromaKey)}` : "";
 *   //   `...setsar=1,fps=${fps},format=yuva420p${ck}[${v}]`
 *   //   (khi không có chromaKey, format=yuva420p vẫn tương thích overlay;
 *   //    hoặc giữ yuv420p cho clip thường để tối ưu — tùy agent chính)
 *
 * ⚠️ Tương tác với xfade: unit đã qua xfade mà có alpha có thể composite lạ.
 * Khuyến nghị: không đặt transition ngay tại clip đang bật chroma key
 * (xem CHROMA_LIMITS.md).
 *
 * Tự test: node src/chroma.js --self-test
 * Demo thật: node demo_chroma.js [--out-dir /tmp/chroma-demo]
 */
"use strict";

const assert = require("assert");

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học. */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function isHexColor(s) {
  return typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);
}

function isUnitInterval(x) {
  return typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1;
}

const CHROMA_DEFAULTS = { color: "#00FF00", similarity: 0.3, blend: 0.1 };

/**
 * "#00FF00" -> "0x00FF00".
 * @throws nếu không phải hex #rrggbb hợp lệ.
 */
function hexToFFmpegColor(hex) {
  if (!isHexColor(hex))
    throw new Error(`màu chroma key không hợp lệ (cần #rrggbb): ${JSON.stringify(hex)}`);
  return "0x" + hex.slice(1).toUpperCase();
}

/**
 * Validate cấu hình chroma key (mirror validateChromaKey bên TypeScript).
 * @returns {string[]} mảng lỗi (rỗng = hợp lệ).
 */
function validateChroma(chroma) {
  if (typeof chroma !== "object" || chroma === null || Array.isArray(chroma)) {
    return ["chromaKey phải là một object { color, similarity?, blend? }"];
  }
  const errors = [];
  if (!isHexColor(chroma.color)) {
    errors.push(
      `chromaKey.color phải là hex #rrggbb (vd "#00FF00"), nhận được: ${JSON.stringify(chroma.color)}`
    );
  }
  if (chroma.similarity !== undefined && !isUnitInterval(chroma.similarity)) {
    errors.push(
      `chromaKey.similarity phải trong khoảng 0..1, nhận được: ${JSON.stringify(chroma.similarity)}`
    );
  }
  if (chroma.blend !== undefined && !isUnitInterval(chroma.blend)) {
    errors.push(
      `chromaKey.blend phải trong khoảng 0..1, nhận được: ${JSON.stringify(chroma.blend)}`
    );
  }
  return errors;
}

/** Điền giá trị mặc định cho các field optional. */
function normalizeChroma(chroma) {
  const errors = validateChroma(chroma);
  if (errors.length > 0) throw new Error(`chromaKey không hợp lệ: ${errors.join("; ")}`);
  return {
    color: chroma.color,
    similarity: chroma.similarity ?? CHROMA_DEFAULTS.similarity,
    blend: chroma.blend ?? CHROMA_DEFAULTS.blend,
  };
}

/**
 * Dựng chuỗi filter chroma key để chèn vào chain video của một clip.
 *
 * Bao gồm `format=yuva420p` ở đầu để đảm bảo có kênh alpha cho
 * filter chromakey ghi độ trong suốt vào. Output giữ yuva420p để
 * bước overlay lên timeline composite đúng.
 *
 * @param {object} chroma { color, similarity?, blend? }
 * @returns {string} vd "format=yuva420p,chromakey=color=0x00FF00:similarity=0.3:blend=0.1"
 * @throws nếu cấu hình không hợp lệ.
 */
function buildChromaFilter(chroma) {
  const c = normalizeChroma(chroma);
  return (
    `format=yuva420p,` +
    `chromakey=color=${hexToFFmpegColor(c.color)}` +
    `:similarity=${num(c.similarity)}` +
    `:blend=${num(c.blend)}`
  );
}

// ---------------------------------------------------------------------------
// Self-test: node src/chroma.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. build cơ bản
  assert.strictEqual(
    buildChromaFilter({ color: "#00FF00" }),
    "format=yuva420p,chromakey=color=0x00FF00:similarity=0.3:blend=0.1"
  );
  // 2. custom similarity/blend
  assert.strictEqual(
    buildChromaFilter({ color: "#0000ff", similarity: 0.5, blend: 0.2 }),
    "format=yuva420p,chromakey=color=0x0000FF:similarity=0.5:blend=0.2"
  );
  // 3. hexToFFmpegColor
  assert.strictEqual(hexToFFmpegColor("#00ff00"), "0x00FF00");
  assert.throws(() => hexToFFmpegColor("00FF00"), /không hợp lệ/);
  assert.throws(() => hexToFFmpegColor("#FFF"), /không hợp lệ/);
  // 4. validate
  assert.deepStrictEqual(validateChroma({ color: "#00FF00" }), []);
  assert.deepStrictEqual(
    validateChroma({ color: "#00FF00", similarity: 0.7, blend: 0 }),
    []
  );
  assert.ok(validateChroma({ color: "xanh" }).some((m) => m.includes("color")));
  assert.ok(validateChroma({ color: "#00FF00", similarity: 2 }).some((m) => m.includes("similarity")));
  assert.ok(validateChroma({ color: "#00FF00", blend: -0.1 }).some((m) => m.includes("blend")));
  assert.ok(validateChroma(null).length > 0);
  assert.ok(validateChroma("x").length > 0);
  // 5. normalize điền default
  assert.deepStrictEqual(normalizeChroma({ color: "#0000FF" }), {
    color: "#0000FF",
    similarity: 0.3,
    blend: 0.1,
  });
  // 6. build với input sai phải throw
  assert.throws(() => buildChromaFilter({ color: "#00FF00", similarity: 5 }), /similarity/);

  console.log("✅ chroma.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("chroma.js — module chroma key cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  CHROMA_DEFAULTS,
  hexToFFmpegColor,
  validateChroma,
  normalizeChroma,
  buildChromaFilter,
};
