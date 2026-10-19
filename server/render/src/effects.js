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

  // 4. Chain nối nhiều effect
  const chain = buildEffectsChain([
    { type: "grayscale", intensity: 1 },
    { type: "vignette", intensity: 0.6 },
  ]);
  assert.ok(chain.includes("hue=s=0") && chain.includes("vignette="), `chain sai: ${chain}`);
  assert.strictEqual(buildEffectsChain([]), null);
  assert.strictEqual(buildEffectsChain(undefined), null);

  // 5. Từ chối input sai
  assert.throws(() => buildEffectFilter({ type: "glitch" }), /không hỗ trợ/);
  assert.throws(() => buildEffectFilter({ type: "blur", intensity: 2 }), /intensity/);
  assert.throws(() => buildEffectFilter({ type: "blur", intensity: -0.1 }), /intensity/);
  assert.throws(() => buildEffectsChain("không phải mảng"), /mảng/);

  // 6. validateEffects
  assert.deepStrictEqual(validateEffects(undefined), []);
  assert.deepStrictEqual(validateEffects([]), []);
  assert.deepStrictEqual(validateEffects([{ type: "blur" }]), []);
  assert.ok(validateEffects([{ type: "glitch" }]).length > 0);
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
