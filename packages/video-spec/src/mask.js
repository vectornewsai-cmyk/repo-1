/**
 * mask.ts — Mask cho clip video/image (Phase 7 P4).
 * Mirror ESM của mask.ts cho consumer Node (mcp-server/cli import *.js).
 * Giữ đồng bộ với mask.ts khi sửa một trong hai file.
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

export function normalizeMask(m) {
  return {
    shape: m.shape,
    x: m.x ?? MASK_DEFAULTS.x,
    y: m.y ?? MASK_DEFAULTS.y,
    w: m.w ?? MASK_DEFAULTS.w,
    h: m.h ?? MASK_DEFAULTS.h,
    feather: m.feather ?? MASK_DEFAULTS.feather,
    invert: m.invert ?? false,
  };
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
  return errors;
}
