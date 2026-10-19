/**
 * color.ts — Chỉnh màu thủ công (color correction/grading) cho video-spec.
 *
 * NGUYÊN TẮC (giống lut.ts): chỉ đưa vào spec những gì render được THẬT.
 * Mọi tham số đều ánh xạ trực tiếp sang filter FFmpeg:
 *   brightness/contrast/saturation → filter `eq`
 *   temperature/tint/highlights/shadows → filter `colorbalance`
 *
 * ⚠️ MIRROR: server/render/src/lut.js có bản mirror bằng JS thuần
 * (validateColorAdjust, buildColorAdjustFilter) — sửa ở đây thì PHẢI
 * cập nhật cả lut.js.
 *
 * Zero-dependency: không import gì (tránh circular import).
 */

/**
 * Tham số chỉnh màu thủ công. Mọi giá trị trong [-100, 100], mặc định 0.
 * undefined hoặc object rỗng = không chỉnh (no-op).
 */
export interface ColorAdjust {
  /** Độ sáng: -100 (tối thui) .. +100 (trắng xóa). → eq brightness = v/100 */
  brightness?: number;
  /** Độ tương phản: -100 (phẳng) .. +100 (gắt). → eq contrast = 1 + v/100 */
  contrast?: number;
  /** Độ bão hòa: -100 (đen trắng) .. +100 (rực). → eq saturation = 1 + v/100 */
  saturation?: number;
  /** Nhiệt độ màu: -100 (xanh lạnh) .. +100 (vàng ấm). → colorbalance midtones */
  temperature?: number;
  /** Tông xanh lá/đỏ tươi: -100 (xanh lá) .. +100 (đỏ tươi/magenta). → colorbalance gm */
  tint?: number;
  /** Vùng sáng: -100 (lạnh) .. +100 (ấm). → colorbalance highlights */
  highlights?: number;
  /** Vùng tối: -100 (lạnh) .. +100 (ấm). → colorbalance shadows */
  shadows?: number;
}

/** Danh sách tham số theo thứ tự hiển thị trên UI. */
export const COLOR_PARAMS: Array<{
  key: keyof ColorAdjust;
  label: string;
  hint: string;
}> = [
  { key: "brightness", label: "Độ sáng", hint: "-100 tối · +100 sáng" },
  { key: "contrast", label: "Tương phản", hint: "-100 phẳng · +100 gắt" },
  { key: "saturation", label: "Bão hòa", hint: "-100 đen trắng · +100 rực rỡ" },
  { key: "temperature", label: "Nhiệt độ", hint: "-100 xanh lạnh · +100 vàng ấm" },
  { key: "tint", label: "Tông màu", hint: "-100 xanh lá · +100 đỏ tươi" },
  { key: "highlights", label: "Vùng sáng", hint: "-100 lạnh · +100 ấm" },
  { key: "shadows", label: "Vùng tối", hint: "-100 lạnh · +100 ấm" },
];

/** true nếu object không chỉnh gì (mọi param 0/undefined) — render bỏ qua. */
export function isColorNoop(c: ColorAdjust | undefined | null): boolean {
  if (!c || typeof c !== "object") return true;
  return COLOR_PARAMS.every((p) => (c[p.key] ?? 0) === 0);
}

/** Validate ColorAdjust, trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateColorAdjust(v: unknown): string[] {
  if (v === undefined || v === null) return [];
  if (typeof v !== "object" || Array.isArray(v)) {
    return ["filter.color phải là một object"];
  }
  const errors: string[] = [];
  const rec = v as Record<string, unknown>;
  const known = new Set(COLOR_PARAMS.map((p) => p.key));
  for (const k of Object.keys(rec)) {
    if (!known.has(k as keyof ColorAdjust)) {
      errors.push(`filter.color.${k} không được hỗ trợ`);
    }
  }
  for (const p of COLOR_PARAMS) {
    const val = rec[p.key];
    if (val === undefined) continue;
    if (typeof val !== "number" || !Number.isFinite(val)) {
      errors.push(`filter.color.${p.key} phải là số (nhận được: ${JSON.stringify(val)})`);
    } else if (val < -100 || val > 100) {
      errors.push(
        `filter.color.${p.key} phải trong -100..100 (nhận được: ${val})`
      );
    }
  }
  return errors;
}

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học, tối đa 4 chữ số thập phân. */
function fmt(x: number): string {
  if (Object.is(x, -0)) x = 0;
  const s = x.toFixed(4).replace(/\.?0+$/, "");
  return s === "" || s === "-" ? "0" : s;
}

/**
 * Dựng chuỗi filter FFmpeg cho chỉnh màu thủ công.
 * Thứ tự: eq (brightness/contrast/saturation) → colorbalance (temperature/tint/highlights/shadows).
 * Trả về "" nếu không có gì để chỉnh (caller không thêm dấu phẩy).
 */
export function buildColorAdjustFilter(c: ColorAdjust | undefined | null): string {
  if (isColorNoop(c)) return "";
  const parts: string[] = [];
  const v = (k: keyof ColorAdjust): number => c?.[k] ?? 0;

  // --- eq: brightness/contrast/saturation ---
  const eqParams: string[] = [];
  if (v("brightness") !== 0) eqParams.push(`brightness=${fmt(v("brightness") / 100)}`);
  if (v("contrast") !== 0) eqParams.push(`contrast=${fmt(1 + v("contrast") / 100)}`);
  if (v("saturation") !== 0) eqParams.push(`saturation=${fmt(1 + v("saturation") / 100)}`);
  if (eqParams.length > 0) parts.push(`eq=${eqParams.join(":")}`);

  // --- colorbalance: temperature/tint (midtones), highlights, shadows ---
  const cbParams: string[] = [];
  const temp = v("temperature");
  if (temp !== 0) {
    cbParams.push(`rm=${fmt((temp / 100) * 0.4)}`);
    cbParams.push(`bm=${fmt((-temp / 100) * 0.4)}`);
  }
  const tint = v("tint");
  if (tint !== 0) {
    // tint +100 = magenta (giảm green), -100 = green
    cbParams.push(`gm=${fmt((-tint / 100) * 0.4)}`);
  }
  const hi = v("highlights");
  if (hi !== 0) {
    cbParams.push(`rh=${fmt((hi / 100) * 0.3)}`);
    cbParams.push(`bh=${fmt((-hi / 100) * 0.3)}`);
  }
  const sh = v("shadows");
  if (sh !== 0) {
    cbParams.push(`rs=${fmt((sh / 100) * 0.3)}`);
    cbParams.push(`bs=${fmt((-sh / 100) * 0.3)}`);
  }
  if (cbParams.length > 0) parts.push(`colorbalance=${cbParams.join(":")}`);

  return parts.join(",");
}
