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
  // Phase 9 D4: keyframes (tùy chọn) — mirror bản TS.
  if (m.keyframes !== undefined) {
    if (!Array.isArray(m.keyframes)) {
      errors.push(`mask.keyframes phải là mảng, nhận được: ${JSON.stringify(m.keyframes)}`);
    } else {
      m.keyframes.forEach((kf, i) => {
        if (typeof kf !== "object" || kf === null || Array.isArray(kf)) {
          errors.push(`mask.keyframes[${i}] phải là object { t, x, y, w, h }`);
          return;
        }
        if (!isFiniteNumber(kf.t) || kf.t < 0) {
          errors.push(`mask.keyframes[${i}].t phải là số >= 0, nhận được: ${JSON.stringify(kf.t)}`);
        }
        for (const key of ["x", "y"]) {
          if (!isFiniteNumber(kf[key])) {
            errors.push(`mask.keyframes[${i}].${key} phải là số hữu hạn, nhận được: ${JSON.stringify(kf[key])}`);
          }
        }
        for (const key of ["w", "h"]) {
          if (!isFiniteNumber(kf[key]) || kf[key] <= 0) {
            errors.push(`mask.keyframes[${i}].${key} phải là số > 0, nhận được: ${JSON.stringify(kf[key])}`);
          }
        }
      });
    }
  }
  return errors;
}

/** Sắp keyframe theo t, trùng t thì sau thắng (không mutate input). */
function sortMaskKeyframes(kfs) {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out = [];
  for (const kf of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === kf.t) out[out.length - 1] = { ...kf };
    else out.push({ ...kf });
  }
  return out;
}

/** Mask có keyframe hình học không (ít nhất 1 keyframe). */
function hasMaskKeyframes(m) {
  return !!m && Array.isArray(m.keyframes) && m.keyframes.length > 0;
}

/** Chuẩn hoá mask thiếu field về default (không mutate input). */
function normalizeMask(m) {
  const out = {
    shape: m.shape,
    x: m.x ?? 0.5,
    y: m.y ?? 0.5,
    w: m.w ?? 1,
    h: m.h ?? 1,
    feather: m.feather ?? 0,
    invert: m.invert ?? false,
  };
  if (hasMaskKeyframes(m)) out.keyframes = sortMaskKeyframes(m.keyframes);
  return out;
}

/**
 * Nội suy tuyến tính hình học mask tại thời gian cục bộ t (giây) — mirror
 * chính xác interpolateMaskAt() bản TS và mask_anim.py: hold ngoài đoạn.
 */
function interpolateMaskAt(m, t) {
  const base = { x: m.x, y: m.y, w: m.w, h: m.h };
  if (!hasMaskKeyframes(m)) return base;
  const kfs = sortMaskKeyframes(m.keyframes);
  if (t <= kfs[0].t) return { x: kfs[0].x, y: kfs[0].y, w: kfs[0].w, h: kfs[0].h };
  const last = kfs[kfs.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y, w: last.w, h: last.h };
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
      return {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        w: a.w + (b.w - a.w) * f,
        h: a.h + (b.h - a.h) * f,
      };
    }
  }
  return base;
}

/** Mask đầy đủ tại thời gian t: shape/feather/invert giữ nguyên, x/y/w/h nội suy. */
function maskGeometryAt(m, t) {
  const g = interpolateMaskAt(m, t);
  const out = { ...m, x: g.x, y: g.y, w: g.w, h: g.h };
  delete out.keyframes;
  return out;
}

/**
 * Key dedup cho video mask animation (Phase 9 D4): cùng keyframe + khung +
 * fps + duration → cùng 1 file video (số frame = round(duration×fps)).
 */
function maskAnimKey(mask, W, H, fps, duration) {
  const m = normalizeMask(mask);
  return JSON.stringify([m.shape, m.keyframes, m.feather, m.invert, W, H, fps, duration]);
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
 * Key dedup cho PNG mask: cùng mask + cùng khung hình → cùng 1 file PNG
 * (render.js vẽ 1 lần, dùng chung cho mọi clip trùng mask).
 */
function maskKey(mask, W, H) {
  const m = normalizeMask(mask);
  return JSON.stringify([m.shape, m.x, m.y, m.w, m.h, m.feather, m.invert, W, H]);
}

/** Escape đường dẫn cho filter movie=... (mirror escapeFilterPath của enhance.js). */
function escapeMoviePath(p) {
  return p.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/**
 * Dựng các fc entry áp mask bằng PNG vẽ trước (Phase 9 R2 — đường nhanh).
 * Giữ alpha gốc bằng cách nhân alpha nguồn với alpha mask (blend multiply),
 * rồi alphamerge — tương đương phép nhân lum(X,Y)*(MASK_EXPR) của đường geq,
 * chỉ khác lượng tử hoá 8-bit của PNG (~0.5/255).
 *
 *   <unit>format=rgba,split=2[base][a];
 *   [a]alphaextract[sa];
 *   movie=mask.png,format=gray,loop=loop=-1:size=1:start=0[mg];
 *   [sa][mg]blend=all_mode=multiply[ca];
 *   [base][ca]alphamerge,format=yuva420p[out]
 *
 * loop=-1 để frame mask duy nhất lặp vô hạn (movie của ảnh tĩnh chỉ có 1
 * frame; không loop thì stream mask EOF sớm và blend không còn frame mới).
 * @param {string} inputLabel label nguồn, vd "[cv0]"
 * @param {string} pngPath đường dẫn tuyệt đối tới PNG mask W×H
 * @param {function(string): string} lbl hàm cấp label (như render.js)
 * @returns {{ entries: string[], outLabel: string }}
 */
function buildMaskPngChain(inputLabel, pngPath, lbl) {
  const b = lbl("mskb"), a = lbl("mska"), sa = lbl("msksa");
  const mp = lbl("mskmp"), mg = lbl("mskmg"), ca = lbl("mskca"), o = lbl("msko");
  return {
    entries: [
      `${inputLabel}format=rgba,split=2[${b}][${a}]`,
      `[${a}]alphaextract[${sa}]`,
      `movie='${escapeMoviePath(pngPath)}',format=gray,loop=loop=-1:size=1:start=0[${mg}]`,
      `[${sa}][${mg}]blend=all_mode=multiply[${ca}]`,
      `[${b}][${ca}]alphamerge,format=yuva420p[${o}]`,
    ],
    outLabel: `[${o}]`,
  };
}

/**
 * Dựng các fc entry áp mask ANIMATION bằng video mask vẽ trước (Phase 9 D4).
 * Cùng khung blend multiply + alphamerge giữ alpha gốc như đường PNG tĩnh,
 * chỉ khác nguồn alpha là video (mỗi frame = mask nội suy tại thời điểm đó)
 * thay vì 1 PNG lặp vô hạn. trim=end_frame=N chặn video mask dài hơn unit
 * (làm tròn frame) khỏi tràn sang clip kề trên timeline; nếu unit dài hơn
 * (làm tròn ngược), blend mặc định repeat frame mask cuối → hold đúng.
 * Video mask đã encode đủ dài (round(duration×fps) frame, PTS từ 0) nên
 * đồng bộ frame với unit (cũng bắt đầu PTS 0 sau trim/setpts + fps).
 *
 *   <unit>format=rgba,split=2[base][a];
 *   [a]alphaextract[sa];
 *   movie=maskanim.mkv,format=gray,trim=end_frame=N[mg];
 *   [sa][mg]blend=all_mode=multiply[ca];
 *   [base][ca]alphamerge,format=yuva420p[out]
 * @param {string} inputLabel label nguồn, vd "[cv0]"
 * @param {string} videoPath đường dẫn tuyệt đối tới video mask (ffv1 gray)
 * @param {number} nFrames số frame mask = round(duration×fps), để trim
 * @param {function(string): string} lbl hàm cấp label (như render.js)
 */
function buildMaskAnimChain(inputLabel, videoPath, nFrames, lbl) {
  const b = lbl("mskb"), a = lbl("mska"), sa = lbl("msksa");
  const mp = lbl("mskmp"), mg = lbl("mskmg"), ca = lbl("mskca"), o = lbl("msko");
  return {
    entries: [
      `${inputLabel}format=rgba,split=2[${b}][${a}]`,
      `[${a}]alphaextract[${sa}]`,
      `movie='${escapeMoviePath(videoPath)}',format=gray,trim=end_frame=${Math.max(1, Math.round(nFrames))}[${mg}]`,
      `[${sa}][${mg}]blend=all_mode=multiply[${ca}]`,
      `[${b}][${ca}]alphamerge,format=yuva420p[${o}]`,
    ],
    outLabel: `[${o}]`,
  };
}

/**
 * Chọn đường mask: có pngPath → đường PNG nhanh, không có → đường geq cũ.
 * render.js truyền pngPath từ ctx.maskPng (rỗng khi --mask-mode geq hoặc khi
 * vẽ PNG thất bại → fallback geq, không fail job).
 */
function buildMaskChainFor(inputLabel, mask, W, H, lbl, pngPath) {
  if (pngPath) return buildMaskPngChain(inputLabel, pngPath, lbl);
  return buildMaskChain(inputLabel, mask, W, H, lbl);
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

  // 8. Phase 9 R2 — đường PNG nhanh: key, chain, fallback
  assert.strictEqual(
    maskKey({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.1 }, 640, 360),
    maskKey({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.1, invert: false }, 640, 360),
    "maskKey phải chuẩn hoá field thiếu giống nhau"
  );
  assert.notStrictEqual(
    maskKey({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.1 }, 640, 360),
    maskKey({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.2 }, 640, 360),
    "feather khác phải khác key"
  );
  let n2 = 0;
  const lbl2 = (p) => `${p}${n2++}`;
  const pc = buildMaskPngChain("[cv0]", "/tmp/mask test:1.png", lbl2);
  assert.strictEqual(pc.entries.length, 5);
  assert.ok(pc.entries[1].includes("alphaextract"), pc.entries[1]);
  assert.ok(pc.entries[2].includes("movie=") && pc.entries[2].includes("loop=loop=-1"), pc.entries[2]);
  assert.ok(pc.entries[2].includes("test\\:1.png"), `escape movie path sai: ${pc.entries[2]}`);
  assert.ok(pc.entries[3].includes("blend=all_mode=multiply"), pc.entries[3]);
  assert.ok(pc.entries[4].includes("alphamerge,format=yuva420p"), pc.entries[4]);
  const withPng = buildMaskChainFor("[cv0]", { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 640, 360, lbl2, "/tmp/m.png");
  assert.ok(withPng.entries.some((e) => e.includes("movie=")), "có pngPath phải dùng đường PNG");
  const noPng = buildMaskChainFor("[cv0]", { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 640, 360, lbl2, undefined);
  assert.ok(noPng.entries.some((e) => e.includes("geq=lum=")), "không pngPath phải fallback về geq");

  // 9. Phase 9 D4 — mask keyframes: validate / normalize / nội suy / anim chain
  const kfMask = {
    shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0,
    keyframes: [
      { t: 2, x: 0.8, y: 0.5, w: 0.5, h: 0.5 },
      { t: 0, x: 0.2, y: 0.5, w: 0.5, h: 0.5 },
      { t: 2, x: 0.9, y: 0.5, w: 0.5, h: 0.5 },
    ],
  };
  assert.deepStrictEqual(validateMask(kfMask), [], "keyframes hợp lệ phải pass");
  assert.ok(validateMask({ ...kfMask, keyframes: [{ t: -1, x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] }).length > 0, "t âm phải lỗi");
  assert.ok(validateMask({ ...kfMask, keyframes: [{ t: 0, x: 0.5, y: 0.5, w: 0, h: 0.5 }] }).length > 0, "w=0 phải lỗi");
  assert.ok(validateMask({ ...kfMask, keyframes: "x" }).length > 0, "keyframes không phải mảng phải lỗi");
  assert.ok(hasMaskKeyframes(kfMask) && !hasMaskKeyframes({ shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }), "hasMaskKeyframes sai");
  // normalize: sắp theo t, trùng t=2 thì sau thắng (x=0.9)
  const norm = normalizeMask(kfMask);
  assert.deepStrictEqual(norm.keyframes.map((k) => k.t), [0, 2], "normalize phải sắp + dedupe");
  assert.strictEqual(norm.keyframes[1].x, 0.9, "trùng t thì sau thắng");
  // nội suy: hold trước 0 (x=0.2), giữa 0→2 tại t=1 (x=0.55), hold sau 2 (x=0.9)
  assert.strictEqual(interpolateMaskAt(kfMask, -1).x, 0.2, "hold trước keyframe đầu sai");
  assert.strictEqual(interpolateMaskAt(kfMask, 1).x, 0.55, "nội suy giữa sai");
  assert.strictEqual(interpolateMaskAt(kfMask, 5).x, 0.9, "hold sau keyframe cuối sai");
  assert.strictEqual(interpolateMaskAt({ shape: "rect", x: 0.3, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 1).x, 0.3, "không keyframe phải trả tĩnh");
  const g0 = maskGeometryAt(kfMask, 0);
  assert.strictEqual(g0.x, 0.2, "geometryAt(0) sai");
  assert.strictEqual(g0.shape, "rect", "geometryAt phải giữ shape");
  assert.ok(!("keyframes" in g0), "geometryAt phải bỏ keyframes (đường fallback tĩnh)");
  // anim key: khác duration/fps phải khác key; giống nhau phải cùng key
  assert.strictEqual(
    maskAnimKey(kfMask, 640, 360, 30, 2),
    maskAnimKey(kfMask, 640, 360, 30, 2),
    "anim key giống nhau phải bằng nhau",
  );
  assert.notStrictEqual(maskAnimKey(kfMask, 640, 360, 30, 2), maskAnimKey(kfMask, 640, 360, 30, 3), "khác duration phải khác key");
  // anim chain: 5 entry, movie video + trim end_frame, blend multiply, alphamerge
  let n3 = 0;
  const lbl3 = (p) => `${p}${n3++}`;
  const ac = buildMaskAnimChain("[cv0]", "/tmp/mask anim.mkv", 60, lbl3);
  assert.strictEqual(ac.entries.length, 5);
  assert.ok(ac.entries[2].includes("movie=") && ac.entries[2].includes(".mkv"), `anim chain thiếu movie video: ${ac.entries[2]}`);
  assert.ok(ac.entries[2].includes("trim=end_frame=60"), `anim chain thiếu trim: ${ac.entries[2]}`);
  assert.ok(!ac.entries[2].includes("loop="), "anim chain KHÔNG được loop (video có nhiều frame)");
  assert.ok(ac.entries[3].includes("blend=all_mode=multiply"), ac.entries[3]);
  assert.ok(ac.entries[4].includes("alphamerge,format=yuva420p"), ac.entries[4]);

  console.log("✅ mask.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("mask.js — module mask cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = { EPS, validateMask, normalizeMask, buildMaskExpr, buildMaskChain, maskKey, buildMaskPngChain, buildMaskChainFor, sortMaskKeyframes, hasMaskKeyframes, interpolateMaskAt, maskGeometryAt, maskAnimKey, buildMaskAnimChain };
