#!/usr/bin/env node
/**
 * effects.js — Video effects cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/effects.ts` — mỗi effect dùng 1 filter
 * NATIVE của FFmpeg (không cần shader custom, không cần OpenGL).
 * Mỗi effect đã được kiểm chứng bằng video MP4 render thật — xem EFFECTS_LIMITS.md.
 *
 * NGUYÊN TẮC TRUNG THỰC: chỉ liệt kê effect đã render thật thành công.
 * Effect chưa test được thì KHÔNG có mặt ở đây.
 *
 * Cách dùng trong render.js (agent chính tích hợp):
 *   const { buildEffectsChain } = require("./effects");
 *   // chèn vào cuối chain chuẩn hoá clip (sau format=yuv420p):
 *   const fx = buildEffectsChain(clip.effects); // null nếu không có
 *   ... `format=yuv420p${fx ? "," + fx : ""}` ...
 */
"use strict";

const assert = require("assert");

const EFFECT_TYPES = [
  "blur",
  "sharpen",
  "grayscale",
  "sepia",
  "vignette",
  "noise",
  "brightness",
  // Q4 (Phase 8): 9 effect mới, tất cả filter native FFmpeg, đã pixel-verify.
  "glitch",
  "rgb-shift",
  "shake",
  "pixelate",
  "mirror",
  "old-film",
  "invert",
  "edgedetect",
  "hue-rotate",
];

const DEFAULT_INTENSITY = 0.5;

/** Format số cho filter FFmpeg (mirror num() trong render.js). */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function normIntensity(effect) {
  const it = effect.intensity === undefined ? DEFAULT_INTENSITY : effect.intensity;
  if (typeof it !== "number" || !Number.isFinite(it) || it < 0 || it > 1) {
    throw new Error(`intensity phải trong [0, 1], nhận được: ${JSON.stringify(effect.intensity)}`);
  }
  return it;
}

/**
 * Dựng filter FFmpeg cho MỘT effect.
 * @param {{type:string, intensity?:number}} effect
 * @returns {string} filter expression (chưa có label)
 * @throws nếu type không hỗ trợ hoặc intensity sai
 */
function buildEffectFilter(effect) {
  if (!effect || typeof effect !== "object") {
    throw new Error("effect phải là object { type, intensity? }");
  }
  const t = normIntensity(effect);
  switch (effect.type) {
    case "blur": {
      // gblur sigma 0.5 (nhẹ) → 8 (rất mờ)
      const sigma = 0.5 + t * 7.5;
      return `gblur=sigma=${num(sigma)}`;
    }
    case "sharpen": {
      // unsharp luma amount 0.2 (nhẹ) → 2.0 (gắt)
      const amount = 0.2 + t * 1.8;
      return `unsharp=5:5:${num(amount)}:5:5:0`;
    }
    case "grayscale": {
      // hue saturation 1 → 0 (đen trắng hoàn toàn ở intensity=1)
      return `hue=s=${num(1 - t)}`;
    }
    case "sepia": {
      // colorchannelmixer: nội suy giữa ma trận đơn vị và ma trận sepia
      // sepia: R'=.393R+.769G+.189B, G'=.349R+.686G+.168B, B'=.272R+.534G+.131B
      const S = [
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131],
      ];
      const m = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const identity = r === c ? 1 : 0;
          m.push(num(identity + (S[r][c] - identity) * t));
        }
        m.push(num(0)); // alpha offset
      }
      return `colorchannelmixer=${m.join(":")}`;
    }
    case "vignette": {
      // góc tối PI/10 (nhẹ) → PI/2.5 (mạnh)
      const angle = Math.PI * (0.1 + 0.3 * t);
      return `vignette=angle=${num(angle)}`;
    }
    case "noise": {
      // hạt nhiễu thời gian: strength 5 (nhẹ) → 50 (nặng)
      const strength = 5 + t * 45;
      return `noise=alls=${num(Math.round(strength))}:allf=t`;
    }
    case "brightness": {
      // 0.5 = giữ nguyên; < 0.5 tối đi, > 0.5 sáng lên (±0.35)
      const b = (t - 0.5) * 0.7;
      return `eq=brightness=${num(b)}`;
    }
    case "rgb-shift": {
      // Tách kênh R/B ngược chiều nhau (mốc màu kiểu 3D lỗi thời).
      // rgbashift: rh/bh là độ lệch ngang (pixel) của kênh đỏ/xanh dương.
      const s = 2 + t * 14;
      return `rgbashift=rh=${num(s)}:bh=${num(-s)}`;
    }
    case "glitch": {
      // rgb-shift + nhiễu hạt thời gian: vừa lệch kênh vừa nhiễu sọc.
      const s = 6 + t * 10;
      const ns = Math.round(10 + t * 20);
      return `rgbashift=rh=${num(s)}:bh=${num(-s)},noise=alls=${ns}:allf=t`;
    }
    case "shake": {
      // Rung lắc: cửa sổ crop di chuyển theo sin/cos theo thời gian, rồi pad
      // cố định khôi phục đúng kích thước gốc (pad không hiểu biến t nên cửa
      // sổ crop mới là phần chuyển động; viền đen 12px là tác dụng phụ thật).
      return `crop=w=iw-24:h=ih-24:x='12+12*sin(2*PI*t*9)':y='12+12*cos(2*PI*t*7)',pad=iw+24:ih+24:x=12:y=12:color=black`;
    }
    case "pixelate": {
      // Thu nhỏ rồi phóng lại bằng neighbor: khối pixel rõ rệt.
      // Dùng iw/iw*K (không cần biết W/H tuyệt đối): scale thứ 2 nhân ngược
      // đúng hệ số nên kích thước ra bằng kích thước vào.
      const k = 2 + Math.round(t * 14); // 2..16
      return `scale=iw/${k}:ih/${k}:flags=neighbor,scale=iw*${k}:ih*${k}:flags=neighbor`;
    }
    case "mirror": {
      // Lật ngang toàn khung hình (không có tham số cường độ — hflip nhị phân).
      return `hflip`;
    }
    case "old-film": {
      // Phim cũ: nhiễu hạt + giảm bão hòa + tăng tương phản nhẹ + tối góc.
      const ns = Math.round(8 + t * 12);
      const sat = 0.7 - t * 0.2;
      const con = 1.05 + t * 0.1;
      return `noise=alls=${ns}:allf=t,eq=saturation=${num(sat)}:contrast=${num(con)},vignette=angle=${num(Math.PI / 5)}`;
    }
    case "invert": {
      // Đảo màu nội suy: t=0 giữ nguyên, t=1 đảo hoàn toàn (255-val).
      const e = `val+${num(t)}*(255-2*val)`;
      return `lutrgb=r='${e}':g='${e}':b='${e}'`;
    }
    case "edgedetect": {
      // Phát hiện biên: nền tối, biên sáng. Ngưỡng theo cường độ.
      const low = 0.1 + t * 0.2;
      const high = 0.3 + t * 0.3;
      return `edgedetect=low=${num(low)}:high=${num(high)}`;
    }
    case "hue-rotate": {
      // Xoay tông màu: t=0.5 giữ nguyên, < 0.5 xoay âm, > 0.5 xoay dương (±90°).
      const h = (t - 0.5) * 180;
      return `hue=h=${num(h)}`;
    }
    default:
      throw new Error(`effect không hỗ trợ: ${JSON.stringify(effect.type)}`);
  }
}

/**
 * Dựng chuỗi filter cho MỘT MẢNG effects (áp theo thứ tự).
 * @param {Array|undefined} effects
 * @returns {string|null} chuỗi filter nối bằng dấu phẩy, hoặc null nếu rỗng
 */
function buildEffectsChain(effects) {
  if (!effects || effects.length === 0) return null;
  if (!Array.isArray(effects)) throw new Error("effects phải là một mảng");
  return effects.map(buildEffectFilter).join(",");
}

/** Validate mảng effects, trả về danh sách lỗi (rỗng = hợp lệ). Mirror bản TS. */
function validateEffects(v) {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return ["effects phải là một mảng"];
  const errors = [];
  const seen = new Set();
  v.forEach((e, i) => {
    const w = `effects[${i}]`;
    if (typeof e !== "object" || e === null || Array.isArray(e)) {
      errors.push(`${w}: phải là object { type, intensity? }`);
      return;
    }
    if (!EFFECT_TYPES.includes(e.type)) {
      errors.push(`${w}.type không hỗ trợ: ${JSON.stringify(e.type)}`);
    } else {
      if (seen.has(e.type)) errors.push(`${w}: trùng effect "${e.type}" — mỗi loại chỉ dùng 1 lần`);
      seen.add(e.type);
    }
    if (e.intensity !== undefined) {
      if (typeof e.intensity !== "number" || !Number.isFinite(e.intensity) ||
          e.intensity < 0 || e.intensity > 1) {
        errors.push(`${w}.intensity phải là số trong [0, 1], nhận được: ${JSON.stringify(e.intensity)}`);
      }
    }
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Self-test: node src/effects.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Mỗi effect build được và chứa filter đúng
  assert.ok(buildEffectFilter({ type: "blur" }).startsWith("gblur=sigma="));
  assert.ok(buildEffectFilter({ type: "sharpen" }).startsWith("unsharp="));
  assert.ok(buildEffectFilter({ type: "grayscale" }).startsWith("hue=s="));
  assert.ok(buildEffectFilter({ type: "sepia" }).startsWith("colorchannelmixer="));
  assert.ok(buildEffectFilter({ type: "vignette" }).startsWith("vignette=angle="));
  assert.ok(buildEffectFilter({ type: "noise" }).startsWith("noise=alls="));
  assert.ok(buildEffectFilter({ type: "brightness" }).startsWith("eq=brightness="));

  // 2. Intensity ảnh hưởng tham số
  const b0 = buildEffectFilter({ type: "blur", intensity: 0 });
  const b1 = buildEffectFilter({ type: "blur", intensity: 1 });
  assert.notStrictEqual(b0, b1, "intensity phải thay đổi filter");
  assert.ok(b0.includes("sigma=0.5"), `blur@0 sai: ${b0}`);
  assert.ok(b1.includes("sigma=8"), `blur@1 sai: ${b1}`);

  // 3. Grayscale intensity=1 → s=0 (đen trắng hoàn toàn)
  assert.ok(buildEffectFilter({ type: "grayscale", intensity: 1 }).includes("s=0"));
  // brightness 0.5 → 0 (giữ nguyên)
  assert.ok(buildEffectFilter({ type: "brightness", intensity: 0.5 }).includes("brightness=0"));

  // Q4: 9 effect mới build đúng filter + intensity có tác dụng
  assert.ok(buildEffectFilter({ type: "rgb-shift" }).startsWith("rgbashift="));
  assert.ok(buildEffectFilter({ type: "glitch" }).includes("rgbashift="));
  assert.ok(buildEffectFilter({ type: "glitch" }).includes("noise=alls="));
  assert.ok(buildEffectFilter({ type: "shake" }).includes("crop="));
  assert.ok(buildEffectFilter({ type: "shake" }).includes("pad="));
  assert.ok(buildEffectFilter({ type: "pixelate" }).includes("flags=neighbor"));
  assert.strictEqual(buildEffectFilter({ type: "mirror" }), "hflip");
  assert.ok(buildEffectFilter({ type: "old-film" }).includes("vignette="));
  assert.ok(buildEffectFilter({ type: "invert", intensity: 1 }).includes("255-2*val"));
  assert.ok(buildEffectFilter({ type: "edgedetect" }).startsWith("edgedetect="));
  assert.ok(buildEffectFilter({ type: "hue-rotate", intensity: 0.5 }).includes("h=0"));
  assert.ok(buildEffectFilter({ type: "hue-rotate", intensity: 1 }).includes("h=90"));
  assert.ok(buildEffectFilter({ type: "pixelate", intensity: 0 }).includes("iw/2"));
  assert.ok(buildEffectFilter({ type: "pixelate", intensity: 1 }).includes("iw/16"));
  assert.ok(validateEffects([{ type: "glitch" }, { type: "mirror" }]).length === 0);

  // 4. Chain nối nhiều effect
  const chain = buildEffectsChain([
    { type: "grayscale", intensity: 1 },
    { type: "vignette", intensity: 0.6 },
  ]);
  assert.ok(chain.includes("hue=s=0") && chain.includes("vignette="), `chain sai: ${chain}`);
  assert.strictEqual(buildEffectsChain([]), null);
  assert.strictEqual(buildEffectsChain(undefined), null);

  // 5. Từ chối input sai
  assert.throws(() => buildEffectFilter({ type: "khong-ho-tro" }), /không hỗ trợ/);
  assert.throws(() => buildEffectFilter({ type: "blur", intensity: 2 }), /intensity/);
  assert.throws(() => buildEffectFilter({ type: "blur", intensity: -0.1 }), /intensity/);
  assert.throws(() => buildEffectsChain("không phải mảng"), /mảng/);

  // 6. validateEffects
  assert.deepStrictEqual(validateEffects(undefined), []);
  assert.deepStrictEqual(validateEffects([]), []);
  assert.deepStrictEqual(validateEffects([{ type: "blur" }]), []);
  assert.ok(validateEffects([{ type: "khong-ho-tro" }]).length > 0);
  assert.ok(validateEffects([{ type: "blur" }, { type: "blur" }]).some((m) => m.includes("trùng")));
  assert.ok(validateEffects([{ type: "noise", intensity: 5 }]).some((m) => m.includes("intensity")));
  assert.ok(validateEffects("x").length > 0);

  console.log("✅ effects.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("effects.js — module video effects cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  EFFECT_TYPES,
  DEFAULT_INTENSITY,
  buildEffectFilter,
  buildEffectsChain,
  validateEffects,
};
