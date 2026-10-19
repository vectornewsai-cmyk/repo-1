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
  if (f.lut !== undefined && !isLutId(f.lut)) {
    return [
      `filter.lut không hợp lệ: ${JSON.stringify(f.lut)} ` +
      `(chỉ chấp nhận: ${LUT_IDS.join(", ")})`,
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Self-test: node src/lut.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Catalog đủ 10
  assert.strictEqual(LUT_IDS.length, 10, "catalog phải có đúng 10 LUT");
  // 2. isLutId
  assert.ok(isLutId("cartcut-teal-orange"));
  assert.ok(isLutId("cartcut-mono-neutral"));
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
  // 4. Từ chối LUT không tồn tại
  assert.throws(() => buildLutFilter("khong-co", assetsDir), /không hợp lệ/);
  // 5. validateVideoFilter
  assert.deepStrictEqual(validateVideoFilter(undefined), []);
  assert.deepStrictEqual(validateVideoFilter({}), []);
  assert.deepStrictEqual(validateVideoFilter({ lut: "cartcut-ocean" }), []);
  assert.ok(validateVideoFilter({ lut: "sai" }).length > 0);
  assert.ok(validateVideoFilter("chuoi").length > 0);
  // 6. Mọi LUT trong catalog đều có file .cube thật
  for (const id of LUT_IDS) {
    const fp = lutFilePath(id, assetsDir);
    assert.ok(fs.existsSync(fp), `thiếu file: ${fp}`);
  }

  console.log("✅ lut.js self-test: tất cả assertion pass (10 LUT, file .cube đầy đủ)");
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
};
