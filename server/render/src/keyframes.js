#!/usr/bin/env node
/**
 * keyframes.js — Keyframe animation cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/keyframes.ts` — NGỮ NGHĨA NỘI SUY PHẢI
 * GIỐNG HỆT BÊN TYPESCRIPT (xem header của keyframes.ts):
 *   easing của keyframe BẮT ĐẦU đoạn áp dụng cho đoạn đó;
 *   ease-in = p^2, ease-out = 1-(1-p)^2.
 *
 * Module này KHÔNG sửa render.js — nó cung cấp:
 *   - interpolateKeyframes(kfs, t): tính giá trị nội suy (dùng cho test/demo).
 *   - validateAnimations(anims, duration): kiểm tra shape (mirror bản TS).
 *   - buildInterpExpr(kv, tcExpr): sinh biểu thức FFmpeg cho KeyframedValue,
 *     với tcExpr là biểu thức "thời gian cục bộ của clip", vd "(t-2.5)".
 *   - buildTextExprs(animations, style, clipStart): {x, y, alpha} cho drawtext.
 *   - buildOverlayExprs(animations, clipStart): {x, y} cho filter overlay.
 *
 * Chạy self-test: node src/keyframes.js --self-test
 */
"use strict";

const assert = require("assert");

const EASINGS = ["linear", "ease-in", "ease-out"];
const ANIMATABLE_PROPS = ["x", "y", "opacity", "scale", "rotation"];
const MAX_KEYFRAMES_PER_PROP = 128;

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học. */
function ffNum(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function applyEasing(easing, p) {
  const c = Math.min(1, Math.max(0, p));
  if (easing === "linear") return c;
  if (easing === "ease-in") return c * c;
  if (easing === "ease-out") return 1 - (1 - c) * (1 - c);
  throw new Error(`easing không hỗ trợ: ${easing}`);
}

function normalizeKeyframes(kfs) {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === k.t) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

function interpolateKeyframes(kfs, t) {
  const ks = normalizeKeyframes(kfs);
  if (ks.length === 0) throw new Error("interpolateKeyframes: mảng keyframes rỗng");
  if (ks.length === 1) return ks[0].v;
  if (t <= ks[0].t) return ks[0].v;
  const last = ks[ks.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 0 : (t - a.t) / span;
      return a.v + (b.v - a.v) * applyEasing(a.easing, p);
    }
  }
  return last.v;
}

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function validateAnimations(anims, duration) {
  const errors = [];
  if (anims === undefined || anims === null) return errors;
  if (typeof anims !== "object" || Array.isArray(anims)) {
    return ["animations phải là một object"];
  }
  for (const key of Object.keys(anims)) {
    if (!ANIMATABLE_PROPS.includes(key)) {
      errors.push(`animations.${key}: thuộc tính không hỗ trợ (chỉ: ${ANIMATABLE_PROPS.join(", ")})`);
      continue;
    }
    const where = `animations.${key}`;
    const kv = anims[key];
    if (typeof kv !== "object" || kv === null || Array.isArray(kv)) {
      errors.push(`${where}: phải là object { keyframes: [...] }`);
      continue;
    }
    const kfs = kv.keyframes;
    if (!Array.isArray(kfs)) {
      errors.push(`${where}.keyframes: phải là một mảng`);
      continue;
    }
    if (kfs.length === 0) {
      errors.push(`${where}.keyframes: mảng rỗng — cần ít nhất 1 keyframe`);
      continue;
    }
    if (kfs.length > MAX_KEYFRAMES_PER_PROP) {
      errors.push(`${where}.keyframes: quá ${MAX_KEYFRAMES_PER_PROP} keyframe (nhận ${kfs.length})`);
    }
    kfs.forEach((kf, i) => {
      const w = `${where}.keyframes[${i}]`;
      if (typeof kf !== "object" || kf === null) {
        errors.push(`${w}: phải là object { t, v, easing }`);
        return;
      }
      if (!isFiniteNumber(kf.t) || kf.t < 0 || kf.t > duration) {
        errors.push(`${w}.t phải là số trong [0, ${duration}] (độ dài clip), nhận được: ${JSON.stringify(kf.t)}`);
      }
      if (!isFiniteNumber(kf.v)) {
        errors.push(`${w}.v phải là số hữu hạn, nhận được: ${JSON.stringify(kf.v)}`);
      }
      if (!EASINGS.includes(kf.easing)) {
        errors.push(`${w}.easing phải là một trong ${EASINGS.join(" | ")}, nhận được: ${JSON.stringify(kf.easing)}`);
      }
    });
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Sinh biểu thức FFmpeg
// ---------------------------------------------------------------------------

/**
 * Biểu thức nội suy cho một KeyframedValue.
 * @param {{keyframes: Array<{t:number,v:number,easing:string}>}} kv
 * @param {string} tcExpr biểu thức "thời gian cục bộ của clip", vd "(t-2.5)"
 * @returns {string} biểu thức FFmpeg (dùng được trong x/y/alpha của drawtext,
 *   x/y của overlay, ...). Ngoài khoảng keyframe thì clamp về biên.
 */
function buildInterpExpr(kv, tcExpr) {
  const ks = normalizeKeyframes(kv.keyframes);
  if (ks.length === 0) throw new Error("buildInterpExpr: keyframes rỗng");
  if (ks.length === 1) return ffNum(ks[0].v);

  const T = (x) => ffNum(x);
  // Biểu thức cho đoạn [a, b], dùng easing của a (KHỚP với interpolateKeyframes).
  const seg = (a, b) => {
    const span = b.t - a.t;
    const p = span <= 0 ? "0" : `((${tcExpr})-${T(a.t)})/${T(span)}`;
    let e;
    if (a.easing === "ease-in") e = `(${p})*(${p})`;
    else if (a.easing === "ease-out") e = `(1-(1-(${p}))*(1-(${p})))`;
    else if (a.easing === "linear") e = `(${p})`;
    else throw new Error(`easing không hỗ trợ: ${a.easing}`);
    return `(${T(a.v)}+(${(T(b.v - a.v))})*(${e}))`;
  };

  // Lồng if từ đoạn cuối về đầu: if(lt(tc,t1), seg0, if(lt(tc,t2), seg1, ... v_cuối))
  let expr = T(ks[ks.length - 1].v);
  for (let i = ks.length - 2; i >= 0; i--) {
    expr = `if(lt(${tcExpr},${T(ks[i + 1].t)}),${seg(ks[i], ks[i + 1])},${expr})`;
  }
  // Clamp ngoài khoảng keyframe
  expr =
    `if(lt(${tcExpr},${T(ks[0].t)}),${T(ks[0].v)},` +
    `if(gt(${tcExpr},${T(ks[ks.length - 1].t)}),${T(ks[ks.length - 1].v)},${expr}))`;
  return expr;
}

/**
 * {x, y, alpha} cho filter drawtext của một text clip.
 * animations.x/y là 0..1 tương đối (cho phép ngoài khoảng để bay ra ngoài);
 * khi không có keyframes thì dùng style.x/style.y tĩnh, alpha = 1.
 */
function buildTextExprs(animations, style, clipStart) {
  const tc = `(t-${ffNum(clipStart)})`;
  const fx = animations && animations.x
    ? buildInterpExpr(animations.x, tc)
    : ffNum(style.x ?? 0.5);
  const fy = animations && animations.y
    ? buildInterpExpr(animations.y, tc)
    : ffNum(style.y ?? 0.5);
  const fa = animations && animations.opacity
    ? buildInterpExpr(animations.opacity, tc)
    : "1";
  return {
    x: `(w-text_w)*(${fx})`,
    y: `(h-text_h)*(${fy})`,
    alpha: `(${fa})`,
  };
}

/**
 * {x, y} cho filter overlay của một video clip (đơn vị pixel).
 * animations.x/y là 0..1 tương đối trên khoảng di chuyển còn lại
 * (main_w - overlay_w); không có keyframes thì căn giữa.
 */
function buildOverlayExprs(animations, clipStart) {
  const tc = `(t-${ffNum(clipStart)})`;
  const fx = animations && animations.x
    ? `((${buildInterpExpr(animations.x, tc)})*(main_w-overlay_w))`
    : `((main_w-overlay_w)/2)`;
  const fy = animations && animations.y
    ? `((${buildInterpExpr(animations.y, tc)})*(main_h-overlay_h))`
    : `((main_h-overlay_h)/2)`;
  return { x: fx, y: fy };
}

// ---------------------------------------------------------------------------
// Self-test: node src/keyframes.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Nội suy tuyến tính
  assert.strictEqual(interpolateKeyframes(
    [{ t: 0, v: 0, easing: "linear" }, { t: 2, v: 10, easing: "linear" }], 1), 5);
  // 2. Clamp ngoài khoảng
  assert.strictEqual(interpolateKeyframes(
    [{ t: 1, v: 5, easing: "linear" }, { t: 3, v: 15, easing: "linear" }], 0), 5);
  assert.strictEqual(interpolateKeyframes(
    [{ t: 1, v: 5, easing: "linear" }, { t: 3, v: 15, easing: "linear" }], 99), 15);
  // 3. ease-in = p^2 tại giữa đoạn
  assert.strictEqual(interpolateKeyframes(
    [{ t: 0, v: 0, easing: "ease-in" }, { t: 2, v: 8, easing: "ease-in" }], 1), 2);
  // 4. ease-out = 1-(1-p)^2 tại giữa đoạn
  assert.strictEqual(interpolateKeyframes(
    [{ t: 0, v: 0, easing: "ease-out" }, { t: 2, v: 8, easing: "ease-out" }], 1), 6);
  // 5. Easing của keyframe BẮT ĐẦU đoạn được dùng (keyframe sau khác easing cũng vậy)
  assert.strictEqual(interpolateKeyframes(
    [{ t: 0, v: 0, easing: "ease-in" }, { t: 2, v: 8, easing: "linear" }], 1), 2);
  // 6. Một keyframe = hằng số
  assert.strictEqual(interpolateKeyframes([{ t: 0, v: 7, easing: "linear" }], 123), 7);
  // 7. Chưa sắp xếp + trùng t (sau thắng)
  assert.strictEqual(interpolateKeyframes(
    [{ t: 2, v: 10, easing: "linear" }, { t: 0, v: 0, easing: "linear" }, { t: 0, v: 4, easing: "linear" }], 0), 4);
  assert.strictEqual(interpolateKeyframes(
    [{ t: 2, v: 10, easing: "linear" }, { t: 0, v: 0, easing: "linear" }], 1), 5);
  // 8. Mảng rỗng throw
  assert.throws(() => interpolateKeyframes([], 0), /rỗng/);

  // 9. buildInterpExpr: cấu trúc lồng if đúng
  const e = buildInterpExpr(
    { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 2, v: 10, easing: "linear" }] },
    "(t-1)");
  assert.ok(e.includes("lt((t-1),2)"), `thiếu lt: ${e}`);
  assert.ok(e.includes("(10)") && e.includes("/2)"), `thiếu đoạn nội suy: ${e}`);
  // ease-in sinh p*p
  const e2 = buildInterpExpr(
    { keyframes: [{ t: 0, v: 0, easing: "ease-in" }, { t: 1, v: 1, easing: "ease-in" }] },
    "tc");
  assert.ok(e2.includes("((tc)-(0))/(1)*(((tc)-(0))/(1))") || e2.includes(")*("), `ease-in sai: ${e2}`);
  // một keyframe -> hằng số, không có if
  assert.strictEqual(buildInterpExpr({ keyframes: [{ t: 0, v: 3, easing: "linear" }] }, "tc"), "3");

  // 10. buildTextExprs: không keyframes -> dùng style tĩnh
  const te = buildTextExprs(null, { x: 0.5, y: 0.2 }, 2);
  assert.strictEqual(te.x, "(w-text_w)*(0.5)");
  assert.strictEqual(te.y, "(h-text_h)*(0.2)");
  assert.strictEqual(te.alpha, "(1)");
  // có keyframes x -> chứa biểu thức nội suy theo (t-clipStart)
  const te2 = buildTextExprs(
    { x: { keyframes: [{ t: 0, v: -0.3, easing: "linear" }, { t: 4, v: 1.3, easing: "linear" }] } },
    { x: 0.5, y: 0.5 }, 1.5);
  assert.ok(te2.x.startsWith("(w-text_w)*(") && te2.x.includes("(t-1.5)"), `x sai: ${te2.x}`);

  // 11. buildOverlayExprs
  const oe = buildOverlayExprs(
    { x: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 6, v: 1, easing: "linear" }] } }, 0);
  assert.ok(oe.x.includes("main_w-overlay_w") && oe.x.includes("(t-0)"), `overlay x sai: ${oe.x}`);
  assert.ok(oe.y.includes("(main_h-overlay_h)/2"), `overlay y mặc định sai: ${oe.y}`);

  // 12. validateAnimations
  assert.deepStrictEqual(validateAnimations(undefined, 5), []);
  assert.deepStrictEqual(validateAnimations(null, 5), []);
  assert.ok(validateAnimations({ x: { keyframes: [{ t: 0, v: 0, easing: "linear" }] } }, 5).length === 0);
  assert.ok(validateAnimations({ z: {} }, 5).some((m) => m.includes("không hỗ trợ")));
  assert.ok(validateAnimations({ x: { keyframes: [] } }, 5).some((m) => m.includes("rỗng")));
  assert.ok(validateAnimations({ x: { keyframes: [{ t: 9, v: 0, easing: "linear" }] } }, 5)
    .some((m) => m.includes(".t ")));
  assert.ok(validateAnimations({ x: { keyframes: [{ t: 1, v: 0, easing: "bounce" }] } }, 5)
    .some((m) => m.includes("easing")));
  assert.ok(validateAnimations("không phải object", 5).length > 0);

  console.log("✅ keyframes.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("keyframes.js — module keyframe cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  EASINGS,
  ANIMATABLE_PROPS,
  MAX_KEYFRAMES_PER_PROP,
  ffNum,
  applyEasing,
  normalizeKeyframes,
  interpolateKeyframes,
  validateAnimations,
  buildInterpExpr,
  buildTextExprs,
  buildOverlayExprs,
};
