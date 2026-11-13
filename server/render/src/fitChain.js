#!/usr/bin/env node
/**
 * fitChain.js — Chuỗi filter FFmpeg chuẩn hoá clip video về khung WxH
 * (Phase 9 đợt 76 D9 — đóng nợ preset 4:5 letterbox của đợt 75 C7 §6).
 *
 * Vấn đề: xuất preset 4:5 (1080×1350) từ nguồn 16:9 thì render luôn
 * letterbox (viền đen trên/dưới) mà ExportPanel không cảnh báo, cũng
 * không cho user chọn cách lấp khung khác. Module này là điểm duy nhất
 * quyết định hành vi lấp khung cho clip video (dùng chung bởi render.js
 * nhánh thường và speedramp.js nhánh speed ramp):
 *
 *   fit  = "fit"  (mặc định, hành vi cũ): giữ tỉ lệ gốc, letterbox /
 *          pillarbox nền đen (hoặc trong suốt khi padColor là black@0)
 *          cho vừa khít khung. Không mất hình, có viền đen khi tỉ lệ lệch.
 *   crop = "crop" (cover, giống image.js fit="cover"): phóng to lấp đầy
 *          khung rồi crop giữa — không còn viền đen nhưng mất phần hình
 *          ngoài khung (video ngang mất hai bên, video dọc mất trên/dưới).
 *
 * Ví dụ (W=1080, H=1350, nguồn 16:9):
 *   fit:  scale=1080:1350:force_original_aspect_ratio=decrease,
 *         pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=black
 *   crop: scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350
 *         (scale lên 2400×1350 rồi crop giữa 1080×1350).
 *
 * Khi tỉ lệ nguồn đã khớp khung thì cả hai cho cùng kết quả (scale vừa
 * khít, pad/crop là no-op) — nên cảnh báo UI chỉ hiện khi tỉ lệ lệch.
 *
 * Chạy self-test: node src/fitChain.js --self-test
 */
"use strict";

const assert = require("assert");

/** Hai chế độ lấp khung hợp lệ (whitelist — bridge/render chỉ nhận 2 giá trị này). */
const ASPECT_FITS = ["fit", "crop"];

/** Mặc định: "fit" — giữ hành vi cũ (letterbox), không tự cắt hình user. */
const ASPECT_FIT_DEFAULT = "fit";

function isAspectFit(v) {
  return typeof v === "string" && ASPECT_FITS.includes(v);
}

/** Chuẩn hoá giá trị lạ/undefined về mặc định "fit" (không throw). */
function normalizeAspectFit(v) {
  return isAspectFit(v) ? v : ASPECT_FIT_DEFAULT;
}

/**
 * Dựng chuỗi filter scale (+pad hoặc crop) chuẩn hoá clip về khung WxH.
 * Không gồm setsar/format — caller nối tiếp như cũ.
 */
function buildFitChain(W, H, padColor, aspectFit) {
  if (!Number.isInteger(W) || W <= 0 || !Number.isInteger(H) || H <= 0)
    throw new Error(`W, H phải là số nguyên dương, nhận được: ${W}, ${H}`);
  if (typeof padColor !== "string" || padColor.length === 0)
    throw new Error(`padColor phải là chuỗi màu FFmpeg, nhận được: ${JSON.stringify(padColor)}`);
  if (normalizeAspectFit(aspectFit) === "crop") {
    return `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  }
  return `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${padColor}`;
}

// ---------------------------------------------------------------------------
// Self-test: node src/fitChain.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Mặc định (fit): scale decrease + pad đen, không crop.
  let r = buildFitChain(1080, 1350, "black", "fit");
  assert.ok(r.includes("scale=1080:1350:force_original_aspect_ratio=decrease"), `fit scale sai: ${r}`);
  assert.ok(r.includes("pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=black"), `fit pad sai: ${r}`);
  assert.ok(!r.includes("crop="), "fit không được crop");

  // 2. Mặc định khi không truyền aspectFit / truyền giá trị lạ.
  assert.strictEqual(buildFitChain(640, 360, "black"), buildFitChain(640, 360, "black", "fit"));
  assert.strictEqual(buildFitChain(640, 360, "black", "bogus"), buildFitChain(640, 360, "black", "fit"));
  assert.strictEqual(buildFitChain(640, 360, "black", undefined), buildFitChain(640, 360, "black", "fit"));
  assert.strictEqual(normalizeAspectFit("bogus"), "fit");
  assert.strictEqual(normalizeAspectFit(undefined), "fit");

  // 3. Crop: scale increase + crop đúng khung, không pad.
  r = buildFitChain(1080, 1350, "black", "crop");
  assert.ok(r.includes("scale=1080:1350:force_original_aspect_ratio=increase"), `crop scale sai: ${r}`);
  assert.ok(r.includes("crop=1080:1350"), `crop sai: ${r}`);
  assert.ok(!r.includes("pad="), "crop không được pad");

  // 4. padColor trong suốt (chroma/alpha) được giữ nguyên ở nhánh fit.
  r = buildFitChain(1080, 1350, "black@0", "fit");
  assert.ok(r.includes("color=black@0"), `pad trong suốt sai: ${r}`);

  // 5. W/H sai throw.
  assert.throws(() => buildFitChain(0, 360, "black", "fit"), /nguyên dương/);
  assert.throws(() => buildFitChain(640, -1, "black", "fit"), /nguyên dương/);
  assert.throws(() => buildFitChain(640, 360, "", "fit"), /padColor/);

  // 6. isAspectFit / hằng số.
  assert.ok(isAspectFit("fit") && isAspectFit("crop"));
  assert.ok(!isAspectFit("cover") && !isAspectFit("contain") && !isAspectFit(undefined));
  assert.deepStrictEqual(ASPECT_FITS, ["fit", "crop"]);
  assert.strictEqual(ASPECT_FIT_DEFAULT, "fit");

  console.log("✅ fitChain.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("fitChain.js — module chuỗi fit/crop cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  ASPECT_FITS,
  ASPECT_FIT_DEFAULT,
  isAspectFit,
  normalizeAspectFit,
  buildFitChain,
};
