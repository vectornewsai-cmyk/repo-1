/**
 * mask.ts — Mask cho clip video/image (Phase 7 P4).
 * Mirror ESM của mask.ts cho consumer Node (mcp-server/cli import *.js).
 * Giữ đồng bộ với mask.ts khi sửa một trong hai file.
 * (Phase 9 D3 đã đồng bộ lại mirror này với mask.ts: các hàm keyframes
 * D4 — sort/has/normalize/interpolate/maskGeometryAt + validate keyframes
 * — vì Rollup resolve "./mask.js" sang mirror này, mirror cũ làm vite
 * build fail với "interpolateMaskAt is not exported".)
 */
export const MASK_SHAPES = ["rect", "ellipse"];

export const MASK_DEFAULTS = {
  shape: "rect",
  x: 0.5,
  y: 0.5,
  w: 1,
  h: 1,
  feather: 0,
};

function isFiniteNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

/** Sắp keyframe theo t, trùng t thì sau thắng (không mutate input). */
export function sortMaskKeyframes(kfs) {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out = [];
  for (const kf of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === kf.t) out[out.length - 1] = { ...kf };
    else out.push({ ...kf });
  }
  return out;
}

/** Mask có keyframe hình học không (ít nhất 1 keyframe hợp lệ dạng). */
export function hasMaskKeyframes(m) {
  return Array.isArray(m.keyframes) && m.keyframes.length > 0;
}

/** Chuẩn hoá mask thiếu field về default (không mutate input). */
export function normalizeMask(m) {
  const out = {
    shape: m.shape,
    x: m.x ?? MASK_DEFAULTS.x,
    y: m.y ?? MASK_DEFAULTS.y,
    w: m.w ?? MASK_DEFAULTS.w,
    h: m.h ?? MASK_DEFAULTS.h,
    feather: m.feather ?? MASK_DEFAULTS.feather,
    invert: m.invert ?? false,
  };
  if (hasMaskKeyframes(m)) out.keyframes = sortMaskKeyframes(m.keyframes);
  return out;
}

/**
 * Nội suy tuyến tính hình học mask tại thời gian cục bộ t (giây, tương đối
 * từ clip.start). Không keyframe → giá trị tĩnh; trước keyframe đầu / sau
 * keyframe cuối → giữ nguyên (hold). Mirror chính xác ở mask.ts (render)
 * và mask_anim.py (vẽ frame) — cùng công thức, cùng hold.
 */
export function interpolateMaskAt(m, t) {
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
  return base; // không tới được (đã chặn hold 2 đầu), giữ để typecheck yên tâm
}

/** Mask đầy đủ tại thời gian t: shape/feather/invert giữ nguyên, x/y/w/h nội suy. */
export function maskGeometryAt(m, t) {
  const g = interpolateMaskAt(m, t);
  return { ...m, x: g.x, y: g.y, w: g.w, h: g.h, keyframes: undefined };
}

export function validateMask(m) {
  const errors = [];
  if (typeof m !== "object" || m === null || Array.isArray(m)) {
    return ["mask phải là một object { shape, x, y, w, h, feather }"];
  }
  const s = m;
  if (!MASK_SHAPES.includes(s["shape"])) {
    errors.push(`mask.shape phải là "rect" | "ellipse", nhận được: ${JSON.stringify(s["shape"])}`);
  }
  for (const key of ["x", "y"]) {
    if (!isFiniteNumber(s[key])) {
      errors.push(`mask.${key} phải là số hữu hạn, nhận được: ${JSON.stringify(s[key])}`);
    }
  }
  for (const key of ["w", "h"]) {
    if (!isFiniteNumber(s[key]) || s[key] <= 0) {
      errors.push(`mask.${key} phải là số > 0, nhận được: ${JSON.stringify(s[key])}`);
    }
  }
  if (!isFiniteNumber(s["feather"]) || s["feather"] < 0 || s["feather"] > 1) {
    errors.push(`mask.feather phải là số trong 0..1, nhận được: ${JSON.stringify(s["feather"])}`);
  }
  if (s["invert"] !== undefined && typeof s["invert"] !== "boolean") {
    errors.push(`mask.invert phải là boolean, nhận được: ${JSON.stringify(s["invert"])}`);
  }
  // Phase 9 D4: keyframes (tùy chọn) — mảng, mỗi entry đủ t/x/y/w/h hợp lệ.
  // t không bị chặn trên theo duration: keyframe vượt duration chỉ hold,
  // render/preview tự giữ giá trị cuối, không lỗi.
  if (s["keyframes"] !== undefined) {
    if (!Array.isArray(s["keyframes"])) {
      errors.push(`mask.keyframes phải là mảng, nhận được: ${JSON.stringify(s["keyframes"])}`);
    } else {
      s["keyframes"].forEach((kf, i) => {
        const k = kf;
        if (typeof kf !== "object" || kf === null || Array.isArray(kf)) {
          errors.push(`mask.keyframes[${i}] phải là object { t, x, y, w, h }`);
          return;
        }
        if (!isFiniteNumber(k["t"]) || k["t"] < 0) {
          errors.push(`mask.keyframes[${i}].t phải là số >= 0, nhận được: ${JSON.stringify(k["t"])}`);
        }
        for (const key of ["x", "y"]) {
          if (!isFiniteNumber(k[key])) {
            errors.push(`mask.keyframes[${i}].${key} phải là số hữu hạn, nhận được: ${JSON.stringify(k[key])}`);
          }
        }
        for (const key of ["w", "h"]) {
          if (!isFiniteNumber(k[key]) || k[key] <= 0) {
            errors.push(`mask.keyframes[${i}].${key} phải là số > 0, nhận được: ${JSON.stringify(k[key])}`);
          }
        }
      });
    }
  }
  return errors;
}
