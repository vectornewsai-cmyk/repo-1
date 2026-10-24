#!/usr/bin/env node
/**
 * mask.js — Mask cho clip video/image (Phase 7 P4).
 *
 * Render THẬT bằng FFmpeg native, GIỮ alpha gốc (mirror pattern opacity
 * keyframes của K1 — geq không đọc được alpha gốc nên phải tách nhánh):
 *
 *   <unit>format=rgba,split=2[base][a];
 *   [a]alphaextract,geq=lum='lum(X,Y)*(MASK_EXPR)'[a2];
 *   [base][a2]alphamerge,format=yuva420p[out]
 *
 * Trong đó MASK_EXPR là biểu thức geq theo tọa độ pixel (X, Y) và kích
 * thước khung (W, H), trả về 0..1 (0 = che hoàn toàn, 1 = giữ nguyên).
 *
 * NGỮ NGHĨA TỌA ĐỘ (mirror mask.ts):
 * - x, y: tâm mask, tương đối 0..1 theo khung hình OUTPUT (unit đã
 *   letterbox về đúng WxH), 0.5 = giữa khung.
 * - w, h: kích thước mask, tương đối 0..1 theo chiều rộng/cao khung.
 * - feather: 0..1 — dải chuyển tiếp ở viền, bằng feather × cạnh ngắn hơn
 *   của mask (tính theo pixel). 0 = viền cứng (nhánh if, tránh chia cho 0).
 * - invert: đảo mask (giữ ngoài, che trong).
 *
 * Viền mềm:
 * - rect: dùng khoảng cách Chebyshev có dấu d tới biên (âm khi ở trong).
 *   alpha = clamp(0.5 - d/band) với band = feather × min(wPx, hPx).
 * - ellipse: khoảng cách tới biên xấp xỉ bậc nhất d = (r-1)/|∇F| với
 *   F = ((X-cx)/rx)² + ((Y-cy)/ry)² - 1; alpha = clamp(0.5 - d/band).
 * Cả hai đều cho dải chuyển tiếp rộng đúng band pixel quanh biên.
 *
 * Áp ở bước chuẩn hoá từng clip (render.js bước 1) nên mask là thuộc tính
 * của clip: đi qua xfade cùng clip, biến đổi cùng clip khi có SR (mask áp
 * trước SR ở bước đặt timeline). Text clip KHÔNG hỗ trợ (drawtext vẽ trực
 * tiếp, không qua pipeline alpha) — validate.js cảnh báo và bỏ qua.
 */
"use strict";

const assert = require("assert");

const EPS = 1e-6;

function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

/** Mirror validateMask() bản TS (packages/video-spec/src/mask.ts). */
function validateMask(m) {
  const errors = [];
  if (typeof m !== "object" || m === null || Array.isArray(m)) {
    return ["mask phải là một object { shape, x, y, w, h, feather }"];
  }
  if (m.shape !== "rect" && m.shape !== "ellipse") {
    errors.push(`mask.shape phải là "rect" | "ellipse", nhận được: ${JSON.stringify(m.shape)}`);
  }
  for (const key of ["x", "y"]) {
    if (!isFiniteNumber(m[key])) {
      errors.push(`mask.${key} phải là số hữu hạn, nhận được: ${JSON.stringify(m[key])}`);
    }
  }
  for (const key of ["w", "h"]) {
    if (!isFiniteNumber(m[key]) || m[key] <= 0) {
      errors.push(`mask.${key} phải là số > 0, nhận được: ${JSON.stringify(m[key])}`);
    }
  }
  if (!isFiniteNumber(m.feather) || m.feather < 0 || m.feather > 1) {
    errors.push(`mask.feather phải là số trong 0..1, nhận được: ${JSON.stringify(m.feather)}`);
  }
  if (m.invert !== undefined && typeof m.invert !== "boolean") {
    errors.push(`mask.invert phải là boolean, nhận được: ${JSON.stringify(m.invert)}`);
  }
  return errors;
}

/** Chuẩn hoá mask thiếu field về default (không mutate input). */
function normalizeMask(m) {
  return {
    shape: m.shape,
    x: m.x ?? 0.5,
    y: m.y ?? 0.5,
    w: m.w ?? 1,
    h: m.h ?? 1,
    feather: m.feather ?? 0,
    invert: m.invert ?? false,
  };
}

/**
 * Biểu thức geq cho alpha mask (0..1) theo tọa độ pixel.
 * @param {object} mask ClipMask (đã validate)
 * @param {number} W chiều rộng khung output (px)
 * @param {number} H chiều cao khung output (px)
 * @returns {string} biểu thức geq, chỉ dùng X, Y, W, H và hằng số
 * @throws nếu mask không hợp lệ
 */
function buildMaskExpr(mask, W, H) {
  const errs = validateMask(mask);
  if (errs.length > 0) throw new Error(errs[0]);
  const m = normalizeMask(mask);
  const cx = num(m.x * W), cy = num(m.y * H);
  const wPx = m.w * W, hPx = m.h * H;
  const band = m.feather * Math.min(wPx, hPx);
  let alpha;
  if (m.shape === "rect") {
    const x0 = num((m.x - m.w / 2) * W), x1 = num((m.x + m.w / 2) * W);
    const y0 = num((m.y - m.h / 2) * H), y1 = num((m.y + m.h / 2) * H);
    // d = khoảng cách Chebyshev có dấu tới biên (âm = trong hình).
    const d = `max(max(${x0}-X,X-${x1}),max(${y0}-Y,Y-${y1}))`;
    alpha = band <= EPS
      ? `if(lt(${d},0),1,0)`
      : `min(1,max(0,0.5-(${d})/${num(band)}))`;
  } else {
    const rx = num(wPx / 2), ry = num(hPx / 2);
    // r = bán kính chuẩn hoá; d = khoảng cách xấp xỉ tới biên ellipse.
    const r = `sqrt(pow((X-${cx})/${rx},2)+pow((Y-${cy})/${ry},2))`;
    const grad = `sqrt(pow((X-${cx})/(${rx}*${rx}),2)+pow((Y-${cy})/(${ry}*${ry}),2))`;
    const d = `(${r}-1)/(${grad})`;
    alpha = band <= EPS
      ? `if(lt(${r},1),1,0)`
      : `min(1,max(0,0.5-(${d})/${num(band)}))`;
  }
  if (m.invert) alpha = `(1-(${alpha}))`;
  return alpha;
}

/**
 * Dựng các fc entry áp mask cho 1 clip (mirror buildOpacityKeyframesChain).
 * @param {string} inputLabel label nguồn, vd "[cv0]"
 * @param {object} mask ClipMask
 * @param {number} W chiều rộng khung output
 * @param {number} H chiều cao khung output
 * @param {function(string): string} lbl hàm cấp label (như render.js)
 * @returns {{ entries: string[], outLabel: string }}
 */
function buildMaskChain(inputLabel, mask, W, H, lbl) {
  const expr = buildMaskExpr(mask, W, H);
  const b = lbl("mskb"), a = lbl("mska"), a2 = lbl("mska2"), o = lbl("msko");
  return {
    entries: [
      `${inputLabel}format=rgba,split=2[${b}][${a}]`,
      `[${a}]alphaextract,geq=lum='lum(X,Y)*(${expr})'[${a2}]`,
      `[${b}][${a2}]alphamerge,format=yuva420p[${o}]`,
    ],
    outLabel: `[${o}]`,
  };
}

// ---------------------------------------------------------------------------
// Self-test: node src/mask.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. validateMask
  assert.deepStrictEqual(validateMask({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }), []);
  assert.deepStrictEqual(validateMask({ shape: "ellipse", x: 0, y: 1, w: 2, h: 0.25, feather: 1, invert: true }), []);
  assert.ok(validateMask({ shape: "circle", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }).length > 0);
  assert.ok(validateMask({ shape: "rect", x: 0.5, y: 0.5, w: 0, h: 0.5, feather: 0 }).length > 0);
  assert.ok(validateMask({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 1.5 }).length > 0);
  assert.ok(validateMask({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: -0.1 }).length > 0);
  assert.ok(validateMask(null).length > 0);
  assert.ok(validateMask({ shape: "rect", x: "a", y: 0.5, w: 0.5, h: 0.5, feather: 0 }).length > 0);

  // 2. buildMaskExpr — rect cứng: chứa if(lt(...),0) và tọa độ biên đúng
  //    mask tâm (0.5,0.5), w=0.5, h=0.5 trên khung 640x360 → biên 160..480, 90..270.
  const rectHard = buildMaskExpr({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 640, 360);
  assert.ok(rectHard.includes("160-X") && rectHard.includes("X-480"), `biên ngang sai: ${rectHard}`);
  assert.ok(rectHard.includes("90-Y") && rectHard.includes("Y-270"), `biên dọc sai: ${rectHard}`);
  assert.ok(rectHard.startsWith("if(lt("), `rect cứng phải dùng if: ${rectHard}`);

  // 3. buildMaskExpr — rect feather: band = 0.2 * min(320,180) = 36
  const rectSoft = buildMaskExpr({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.2 }, 640, 360);
  assert.ok(rectSoft.includes("/36"), `band feather sai: ${rectSoft}`);
  assert.ok(rectSoft.includes("min(1,max(0,0.5-"), `thiếu clamp: ${rectSoft}`);

  // 4. buildMaskExpr — ellipse: chứa sqrt + pow, tâm/radius đúng
  //    mask tâm (0.5,0.5), w=0.5, h=1 trên 640x360 → cx=320, cy=180, rx=160, ry=180.
  const el = buildMaskExpr({ shape: "ellipse", x: 0.5, y: 0.5, w: 0.5, h: 1, feather: 0 }, 640, 360);
  assert.ok(el.includes("(X-320)/160") && el.includes("(Y-180)/180"), `ellipse sai: ${el}`);
  assert.ok(el.includes("sqrt("), `ellipse thiếu sqrt: ${el}`);

  // 5. invert: bọc (1-(...))
  const inv = buildMaskExpr({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0, invert: true }, 640, 360);
  assert.ok(inv.startsWith("(1-("), `invert sai: ${inv}`);

  // 6. buildMaskChain: 3 entry, outLabel dùng được
  let n = 0;
  const lbl = (p) => `${p}${n++}`;
  const ch = buildMaskChain("[cv0]", { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.1 }, 640, 360, lbl);
  assert.strictEqual(ch.entries.length, 3);
  assert.ok(ch.entries[0].startsWith("[cv0]format=rgba,split=2"), ch.entries[0]);
  assert.ok(ch.entries[1].includes("alphaextract,geq=lum="), ch.entries[1]);
  assert.ok(ch.entries[2].includes("alphamerge,format=yuva420p"), ch.entries[2]);
  assert.ok(ch.outLabel.startsWith("[msko"), ch.outLabel);

  // 7. mask lỗi → throw
  assert.throws(() => buildMaskExpr({ shape: "rect", x: 0.5, y: 0.5, w: 0, h: 0.5, feather: 0 }, 640, 360), /số > 0/);

  console.log("✅ mask.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("mask.js — module mask cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = { EPS, validateMask, normalizeMask, buildMaskExpr, buildMaskChain };
