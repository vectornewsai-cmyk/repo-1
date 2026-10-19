#!/usr/bin/env node
/**
 * lut.js — Bộ lọc màu LUT cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/lut.ts` — DANH SÁCH LUT PHẢI GIỐNG HỆT.
 *
 * Dùng filter `lut3d` native của FFmpeg (không cần shader, không cần GPU):
 *   lut3d=file='/path/to/cartcut-teal-orange.cube'
 *
 * Cách dùng trong render.js (agent chính tích hợp):
 *   const { buildLutFilter } = require("./lut");
 *   // trong chain video, sau format=yuv420p:
 *   const lutChain = clip.filter?.lut ? `,${buildLutFilter(clip.filter.lut, assetsDir)}` : "";
 *
 * Chạy self-test: node src/lut.js --self-test
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

/** PHẢI KHỚP với LUT_IDS trong packages/video-spec/src/lut.ts */
const LUT_IDS = [
  "cartcut-blockbuster",
  "cartcut-teal-orange",
  "cartcut-nordic-noir",
  "cartcut-honey",
  "cartcut-golden-hour",
  "cartcut-winter-blue",
  "cartcut-ocean",
  "cartcut-mono-neutral",
  "cartcut-faded-seventies",
  "cartcut-super-eight",
  "vcut-cinematic",
  "vcut-vintage-fade",
  "vcut-noir-contrast",
  "vcut-cyberpunk",
  "vcut-pastel-dream",
  "vcut-sunset-glow",
  "vcut-arctic",
  "vcut-faded-film",
  "vcut-moody-forest",
  "vcut-warm-bloom",
];

const LUT_META = {
  "cartcut-blockbuster": { label: "Bom tấn", description: "Tương phản cao, màu điện ảnh Hollywood" },
  "cartcut-teal-orange": { label: "Teal & Cam", description: "Da cam ấm trên nền xanh teal lạnh" },
  "cartcut-nordic-noir": { label: "Nordic Noir", description: "Lạnh, trầm, u ám kiểu phim Bắc Âu" },
  "cartcut-honey": { label: "Mật ong", description: "Ấm áp, vàng óng như nắng chiều" },
  "cartcut-golden-hour": { label: "Giờ vàng", description: "Vàng rực rỡ của hoàng hôn" },
  "cartcut-winter-blue": { label: "Xanh mùa đông", description: "Xanh băng lạnh lẽo, trong trẻo" },
  "cartcut-ocean": { label: "Đại dương", description: "Xanh biển sâu, tươi mát" },
  "cartcut-mono-neutral": { label: "Đơn sắc", description: "Đen trắng trung tính, cổ điển" },
  "cartcut-faded-seventies": { label: "Thập niên 70", description: "Màu phai mờ vintage như phim cũ" },
  "cartcut-super-eight": { label: "Super 8", description: "Màu phim nhựa 8mm hoài cổ" },
  // vcut-*: tự tạo bằng assets/filters/gen_vcut_luts.py (tác phẩm gốc)
  "vcut-cinematic": { label: "Điện ảnh", description: "Tương phản điện ảnh, highlight ấm, shadow xanh teal" },
  "vcut-vintage-fade": { label: "Phai vintage", description: "Màu phai mờ hoài cổ, đen nâng sáng" },
  "vcut-noir-contrast": { label: "Noir tương phản", description: "Đen trắng tương phản gắt, phong cách noir" },
  "vcut-cyberpunk": { label: "Cyberpunk", description: "Magenta/cyan rực rỡ, bão hòa cao kiểu neon" },
  "vcut-pastel-dream": { label: "Pastel mộng", description: "Pastel nhẹ nhàng, mềm mại như mơ" },
  "vcut-sunset-glow": { label: "Hoàng hôn rực", description: "Vàng cam rực rỡ của nắng chiều muộn" },
  "vcut-arctic": { label: "Bắc cực", description: "Xanh băng sạch, lạnh và trong" },
  "vcut-faded-film": { label: "Phim phai", description: "Tương phản thấp, phai ấm như phim cũ" },
  "vcut-moody-forest": { label: "Rừng u ám", description: "Xanh lá trầm, tối và đầy tâm trạng" },
  "vcut-warm-bloom": { label: "Ấm áp", description: "Sáng ấm áp, mềm mại, tràn đầy nắng" },
};

/** @returns {boolean} */
function isLutId(v) {
  return typeof v === "string" && LUT_IDS.includes(v);
}

/**
 * Đường dẫn tuyệt đối tới file .cube.
 * @param {string} lutId
 * @param {string} assetsDir thư mục assets/ của dự án (chứa filters/*.cube)
 * @returns {string} đường dẫn tuyệt đối
 * @throws nếu lutId không hợp lệ hoặc file không tồn tại
 */
function lutFilePath(lutId, assetsDir) {
  if (!isLutId(lutId)) {
    throw new Error(
      `LUT không hợp lệ: ${JSON.stringify(lutId)} ` +
      `(chỉ chấp nhận: ${LUT_IDS.join(", ")})`
    );
  }
  const p = path.resolve(assetsDir, "filters", `${lutId}.cube`);
  if (!fs.existsSync(p)) {
    throw new Error(
      `Không tìm thấy file LUT: ${p} ` +
      `(chạy bash assets/fetch_large_assets.sh để tải về)`
    );
  }
  return p;
}

/** Escape đường dẫn cho filter FFmpeg (giống escapeFilterPath trong render.js). */
function escapeFilterPath(p) {
  return p.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/**
 * Dựng filter lut3d cho một LUT.
 * @param {string} lutId id trong catalog
 * @param {string} assetsDir thư mục assets/ của dự án
 * @returns {string} vd "lut3d=file='/path/to/cartcut-teal-orange.cube'"
 */
function buildLutFilter(lutId, assetsDir) {
  const fp = lutFilePath(lutId, assetsDir);
  return `lut3d=file='${escapeFilterPath(fp)}'`;
}

/**
 * Validate filter object của clip (mirror validateVideoFilter bản TS).
 * @returns {string[]} danh sách lỗi
 */
function validateVideoFilter(f) {
  if (f === undefined || f === null) return [];
  if (typeof f !== "object" || Array.isArray(f)) {
    return ["filter phải là một object"];
  }
  const errors = [];
  if (f.lut !== undefined && !isLutId(f.lut)) {
    errors.push(
      `filter.lut không hợp lệ: ${JSON.stringify(f.lut)} ` +
      `(chỉ chấp nhận: ${LUT_IDS.join(", ")})`
    );
  }
  // R1-075: chỉnh màu thủ công
  for (const m of validateColorAdjust(f.color)) errors.push(m);
  return errors;
}

// ---------------------------------------------------------------------------
// R1-075: Chỉnh màu thủ công (mirror packages/video-spec/src/color.ts).
// PHẢI KHỚP logic với bản TS — sửa một bên thì sửa cả hai.
// ---------------------------------------------------------------------------

/** Tham số chỉnh màu theo thứ tự hiển thị UI. */
const COLOR_PARAMS = [
  "brightness",
  "contrast",
  "saturation",
  "temperature",
  "tint",
  "highlights",
  "shadows",
];

/** @returns {boolean} true nếu không chỉnh gì (render bỏ qua). */
function isColorNoop(c) {
  if (!c || typeof c !== "object") return true;
  return COLOR_PARAMS.every((k) => (c[k] ?? 0) === 0);
}

/**
 * Validate ColorAdjust (mirror validateColorAdjust bản TS).
 * @returns {string[]} danh sách lỗi
 */
function validateColorAdjust(v) {
  if (v === undefined || v === null) return [];
  if (typeof v !== "object" || Array.isArray(v)) {
    return ["filter.color phải là một object"];
  }
  const errors = [];
  const known = new Set(COLOR_PARAMS);
  for (const k of Object.keys(v)) {
    if (!known.has(k)) errors.push(`filter.color.${k} không được hỗ trợ`);
  }
  for (const k of COLOR_PARAMS) {
    const val = v[k];
    if (val === undefined) continue;
    if (typeof val !== "number" || !Number.isFinite(val)) {
      errors.push(`filter.color.${k} phải là số (nhận được: ${JSON.stringify(val)})`);
    } else if (val < -100 || val > 100) {
      errors.push(`filter.color.${k} phải trong -100..100 (nhận được: ${val})`);
    }
  }
  return errors;
}

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học, tối đa 4 chữ số thập phân. */
function fmtNum(x) {
  if (Object.is(x, -0)) x = 0;
  const s = x.toFixed(4).replace(/\.?0+$/, "");
  return s === "" || s === "-" ? "0" : s;
}

/**
 * Dựng chuỗi filter FFmpeg cho chỉnh màu thủ công (mirror buildColorAdjustFilter bản TS).
 * Thứ tự: eq (brightness/contrast/saturation) → colorbalance (temperature/tint/highlights/shadows).
 * @returns {string} "" nếu không có gì để chỉnh (caller không thêm dấu phẩy).
 */
function buildColorAdjustFilter(c) {
  if (isColorNoop(c)) return "";
  const parts = [];
  const v = (k) => c[k] ?? 0;

  const eqParams = [];
  if (v("brightness") !== 0) eqParams.push(`brightness=${fmtNum(v("brightness") / 100)}`);
  if (v("contrast") !== 0) eqParams.push(`contrast=${fmtNum(1 + v("contrast") / 100)}`);
  if (v("saturation") !== 0) eqParams.push(`saturation=${fmtNum(1 + v("saturation") / 100)}`);
  if (eqParams.length > 0) parts.push(`eq=${eqParams.join(":")}`);

  const cbParams = [];
  const temp = v("temperature");
  if (temp !== 0) {
    cbParams.push(`rm=${fmtNum((temp / 100) * 0.4)}`);
    cbParams.push(`bm=${fmtNum((-temp / 100) * 0.4)}`);
  }
  const tint = v("tint");
  if (tint !== 0) {
    cbParams.push(`gm=${fmtNum((-tint / 100) * 0.4)}`);
  }
  const hi = v("highlights");
  if (hi !== 0) {
    cbParams.push(`rh=${fmtNum((hi / 100) * 0.3)}`);
    cbParams.push(`bh=${fmtNum((-hi / 100) * 0.3)}`);
  }
  const sh = v("shadows");
  if (sh !== 0) {
    cbParams.push(`rs=${fmtNum((sh / 100) * 0.3)}`);
    cbParams.push(`bs=${fmtNum((-sh / 100) * 0.3)}`);
  }
  if (cbParams.length > 0) parts.push(`colorbalance=${cbParams.join(":")}`);

  return parts.join(",");
}

// ---------------------------------------------------------------------------
// Self-test: node src/lut.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Catalog đủ 20
  assert.strictEqual(LUT_IDS.length, 20, "catalog phải có đúng 20 LUT");
  // 2. isLutId
  assert.ok(isLutId("cartcut-teal-orange"));
  assert.ok(isLutId("cartcut-mono-neutral"));
  assert.ok(isLutId("vcut-cinematic"));
  assert.ok(isLutId("vcut-cyberpunk"));
  assert.ok(!isLutId("instagram-clarendon"));
  assert.ok(!isLutId(""));
  assert.ok(!isLutId(undefined));
  // 3. buildLutFilter sinh đúng cú pháp (dùng assetsDir thật của dự án)
  const assetsDir = path.resolve(__dirname, "..", "..", "..", "assets");
  const f = buildLutFilter("cartcut-teal-orange", assetsDir);
  assert.ok(
    f.startsWith("lut3d=file='") && f.endsWith("cartcut-teal-orange.cube'"),
    `cú pháp sai: ${f}`
  );
  // 3b. LUT vcut mới cũng build được
  const f2 = buildLutFilter("vcut-cinematic", assetsDir);
  assert.ok(f2.endsWith("vcut-cinematic.cube'"), `cú pháp sai: ${f2}`);
  // 4. Từ chối LUT không tồn tại
  assert.throws(() => buildLutFilter("khong-co", assetsDir), /không hợp lệ/);
  // 5. validateVideoFilter
  assert.deepStrictEqual(validateVideoFilter(undefined), []);
  assert.deepStrictEqual(validateVideoFilter({}), []);
  assert.deepStrictEqual(validateVideoFilter({ lut: "cartcut-ocean" }), []);
  assert.deepStrictEqual(validateVideoFilter({ color: { brightness: 20 } }), []);
  assert.ok(validateVideoFilter({ lut: "sai" }).length > 0);
  assert.ok(validateVideoFilter("chuoi").length > 0);
  // 5b. validateColorAdjust
  assert.deepStrictEqual(validateColorAdjust(undefined), []);
  assert.deepStrictEqual(validateColorAdjust({}), []);
  assert.deepStrictEqual(validateColorAdjust({ brightness: -100, shadows: 100 }), []);
  assert.ok(validateColorAdjust({ brightness: 101 }).length > 0);
  assert.ok(validateColorAdjust({ contrast: "cao" }).length > 0);
  assert.ok(validateColorAdjust({ xyz: 1 }).length > 0);
  assert.ok(validateColorAdjust("chuoi").length > 0);
  assert.ok(validateVideoFilter({ color: { brightness: 999 } }).length > 0);
  // 6. Mọi LUT trong catalog đều có file .cube thật
  for (const id of LUT_IDS) {
    const fp = lutFilePath(id, assetsDir);
    assert.ok(fs.existsSync(fp), `thiếu file: ${fp}`);
  }
  // 7. buildColorAdjustFilter
  assert.strictEqual(buildColorAdjustFilter(undefined), "");
  assert.strictEqual(buildColorAdjustFilter({}), "");
  assert.strictEqual(
    buildColorAdjustFilter({ brightness: 20 }),
    "eq=brightness=0.2"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ contrast: -50, saturation: 30 }),
    "eq=contrast=0.5:saturation=1.3"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ temperature: 100 }),
    "colorbalance=rm=0.4:bm=-0.4"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ tint: -100 }),
    "colorbalance=gm=0.4"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ highlights: 100, shadows: -100 }),
    "colorbalance=rh=0.3:bh=-0.3:rs=-0.3:bs=0.3"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ brightness: 10, temperature: -50 }),
    "eq=brightness=0.1,colorbalance=rm=-0.2:bm=0.2"
  );

  console.log("✅ lut.js self-test: tất cả assertion pass (20 LUT + color adjust, file .cube đầy đủ)");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("lut.js — module LUT cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  LUT_IDS,
  LUT_META,
  isLutId,
  lutFilePath,
  buildLutFilter,
  validateVideoFilter,
  // R1-075: chỉnh màu thủ công
  COLOR_PARAMS,
  isColorNoop,
  validateColorAdjust,
  buildColorAdjustFilter,
};
