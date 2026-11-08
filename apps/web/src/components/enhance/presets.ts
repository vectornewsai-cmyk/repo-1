/**
 * presets.ts — preset tăng cường cho clip video (Phase 9 R59 P8, đóng E3).
 *
 * Panel EnhancePanel (R2) đã có toggle + slider cho từng tính năng nhưng
 * chưa có preset một chạm và chưa có chỉ báo trạng thái trên clip. Module
 * này là logic THUẦN (không React/store) để test khóa được bằng esbuild+node:
 * preset → giá trị `clip.enhance`, match preset hiện tại, danh sách tính
 * năng đang bật (cho dòng tóm tắt trong panel + badge ✨ trên timeline).
 *
 * QUY TẮC SHAPE (cứng, theo task P8): CHỈ dùng field đã tồn tại trong
 * `ClipEnhance` (packages/video-spec/src/enhance.ts) — deinterlace /
 * stabilize / denoise. Preset stabilize chỉ set `smoothing`, preset
 * denoise chỉ set `strength`; KHÔNG thêm field mới. Mọi giá trị nằm trong
 * khoảng render chấp nhận (validateEnhance ở server/render/src/enhance.js):
 * smoothing 1..100, strength 0..1. Preset "balanced" dùng đúng default
 * render (smoothing 10 = STABILIZE_DEFAULTS.smoothing, strength 0.5 =
 * DENOISE_DEFAULT_STRENGTH).
 *
 * Ngữ nghĩa match (ghi rõ để khỏi hiểu lầm):
 * - Deinterlace KHÔNG tham gia match: preset chỉ định nghĩa stabilize +
 *   denoise, khử răng cưa là tính năng riêng theo nguồn (chỉ bật khi video
 *   interlaced). Clip có deinterlace + đúng giá trị preset vẫn match preset.
 * - stabilize/denoise thiếu field được điền default render trước khi so
 *   (stabilize:{} + denoise:true == balanced).
 * - `deinterlace: false` / `denoise: false` là giá trị render coi là LỖI
 *   (validateEnhance) nên KHÔNG tính là active — panel cũ cũng không bao
 *   giờ sinh ra false (checkbox chỉ ghi true hoặc xóa key).
 */
import { t } from "../../i18n";
import {
  DENOISE_DEFAULT_STRENGTH,
  STABILIZE_DEFAULTS,
  type ClipEnhance,
  type StabilizeParams,
} from "@repo-1/video-spec";

/** Preset chọn được trong UI ("custom" chỉ là kết quả match, không chọn). */
export type EnhancePresetId = "off" | "light" | "balanced" | "strong";
export type EnhancePresetMatch = EnhancePresetId | "custom";

/** Tính năng enhance, theo đúng thứ tự hiển thị trong panel. */
export type EnhanceFeature = "deinterlace" | "stabilize" | "denoise";

/**
 * Preset tăng cường — chỉ field đã có trong ClipEnhance.
 * - light: khử nhiễu nhẹ (strength 0.3), không chống rung.
 * - balanced: chống rung mặc định + khử nhiễu mặc định.
 * - strong: chống rung mạnh hơn (smoothing 20) + khử nhiễu mạnh (0.8).
 */
export const ENHANCE_PRESETS: Record<Exclude<EnhancePresetId, "off">, ClipEnhance> = {
  light: { denoise: { strength: 0.3 } },
  balanced: {
    stabilize: { smoothing: STABILIZE_DEFAULTS.smoothing },
    denoise: { strength: DENOISE_DEFAULT_STRENGTH },
  },
  strong: { stabilize: { smoothing: 20 }, denoise: { strength: 0.8 } },
};

/** Tính năng enhance đang bật, theo thứ tự deinterlace → stabilize → denoise. */
export function enhanceActiveFeatures(enh: ClipEnhance | undefined): EnhanceFeature[] {
  if (!enh) return [];
  const out: EnhanceFeature[] = [];
  if (enh.deinterlace === true || (typeof enh.deinterlace === "object" && enh.deinterlace !== null)) {
    out.push("deinterlace");
  }
  if (enh.stabilize !== undefined) out.push("stabilize");
  if (enh.denoise === true || (typeof enh.denoise === "object" && enh.denoise !== null)) {
    out.push("denoise");
  }
  return out;
}

/** Clip có enhance đang bật không (dùng cho badge ✨ trên timeline). */
export function clipHasEnhance(clip: { enhance?: ClipEnhance } | undefined | null): boolean {
  return enhanceActiveFeatures(clip?.enhance).length > 0;
}

function normStabilize(s: StabilizeParams | undefined): Required<StabilizeParams> {
  return {
    smoothing: s?.smoothing ?? STABILIZE_DEFAULTS.smoothing,
    shakiness: s?.shakiness ?? STABILIZE_DEFAULTS.shakiness,
    accuracy: s?.accuracy ?? STABILIZE_DEFAULTS.accuracy,
    stepsize: s?.stepsize ?? STABILIZE_DEFAULTS.stepsize,
    mincontrast: s?.mincontrast ?? STABILIZE_DEFAULTS.mincontrast,
  };
}

/** Strength denoise đã chuẩn hóa (true → 0.5); null = không có / giá trị lỗi. */
function normDenoiseStrength(d: ClipEnhance["denoise"]): number | null {
  if (d === undefined) return null;
  if (d === true) return DENOISE_DEFAULT_STRENGTH;
  if (typeof d === "object" && d !== null) return d.strength ?? DENOISE_DEFAULT_STRENGTH;
  return null;
}

function stabilizeMatches(enh: ClipEnhance, preset: ClipEnhance): boolean {
  if (enh.stabilize === undefined) return preset.stabilize === undefined;
  if (preset.stabilize === undefined) return false;
  const a = normStabilize(enh.stabilize);
  const b = normStabilize(preset.stabilize);
  return (
    a.smoothing === b.smoothing &&
    a.shakiness === b.shakiness &&
    a.accuracy === b.accuracy &&
    a.stepsize === b.stepsize &&
    a.mincontrast === b.mincontrast
  );
}

function denoiseMatches(enh: ClipEnhance, preset: ClipEnhance): boolean {
  return normDenoiseStrength(enh.denoise) === normDenoiseStrength(preset.denoise);
}

/** Preset mà `clip.enhance` hiện tại khớp (bỏ qua deinterlace). */
export function matchEnhancePreset(enh: ClipEnhance | undefined): EnhancePresetMatch {
  if (!enh || enhanceActiveFeatures(enh).length === 0) return "off";
  for (const id of ["light", "balanced", "strong"] as const) {
    const p = ENHANCE_PRESETS[id];
    if (stabilizeMatches(enh, p) && denoiseMatches(enh, p)) return id;
  }
  return "custom";
}

/**
 * Áp preset lên enhance hiện tại, trả về enhance mới (undefined = tắt hết).
 * - "off" → undefined (tắt tất cả, giống nút "Tắt tất cả tăng cường").
 * - "custom" → giữ nguyên (không phải lựa chọn trong UI).
 * - Preset khác: thay stabilize + denoise bằng giá trị preset, GIỮ NGUYÊN
 *   deinterlace (preset không đụng tới khử răng cưa).
 * Object lồng được copy mới để không chia sẻ tham chiếu với hằng preset.
 */
export function applyEnhancePreset(
  current: ClipEnhance | undefined,
  preset: EnhancePresetId | "custom",
): ClipEnhance | undefined {
  if (preset === "off") return undefined;
  if (preset === "custom") return current;
  const p = ENHANCE_PRESETS[preset];
  const next: ClipEnhance = {
    ...(p.stabilize ? { stabilize: { ...p.stabilize } } : {}),
    ...(p.denoise
      ? { denoise: typeof p.denoise === "object" ? { ...p.denoise } : p.denoise }
      : {}),
  };
  if (current?.deinterlace !== undefined) next.deinterlace = current.deinterlace;
  return next;
}

const FEATURE_LABEL: Record<EnhanceFeature, { key: string; fallback: string }> = {
  deinterlace: { key: "enhance.sumDeinterlace", fallback: "Khử răng cưa" },
  stabilize: { key: "enhance.sumStabilize", fallback: "Chống rung" },
  denoise: { key: "enhance.sumDenoise", fallback: "Khử nhiễu" },
};

/**
 * Chặn preset stabilize ở UI khi clip có speedKeyframes (đợt 61 R2, hướng (i)).
 *
 * BỐI CẢNH: render chặn HẲN preset Cân bằng/Mạnh trên clip có speedKeyframes
 * (validateSpec + render.js đều chặn, exit 1, không MP4 — Q8 §4 đã đo thật),
 * nhưng panel trước đây vẫn cho user bật preset rồi chỉ cảnh báo bằng chữ.
 * Quyết định: chặn ngay ở UI thay vì render fallback tự bỏ stabilize, vì
 * (1) fail-fast ở render là thiết kế cố ý (render.js: "user đã khai
 * stabilize thì render thiếu nó là sai hợp đồng") — fallback (ii) sẽ lặng
 * lẽ bỏ tính năng user đã bật, phá hợp đồng trung thực; (2) chặn ở UI ngăn
 * trạng thái lỗi ngay từ lúc tạo, user không bao giờ đụng render fail;
 * (3) preset Nhẹ (chỉ denoise) vẫn dùng được trên clip có speed curve.
 * Trạng thái lỗi CŨ (tạo trước đợt này, hoặc qua MCP/CLI/file project) vẫn
 * sửa được: xem isStabilizeToggleDisabled — checkbox vẫn bấm được để TẮT.
 */
export function isEnhancePresetSpeedBlocked(
  preset: EnhancePresetId,
  hasSpeedRamp: boolean,
): boolean {
  return hasSpeedRamp && (preset === "balanced" || preset === "strong");
}

/**
 * Checkbox chống rung có bị vô hiệu hoá không: khi clip có speed curve thì
 * KHÔNG được bật mới (disabled), nhưng nếu đang bật (trạng thái lỗi cũ) thì
 * checkbox vẫn mở để user TẮT đi sửa lỗi — vô hiệu hoá hẳn sẽ khoá luôn
 * đường sửa duy nhất trong panel. Slider smoothing không bị chặn riêng
 * (đổi smoothing không tạo thêm lỗi mới; tắt stabilize mới hết lỗi).
 */
export function isStabilizeToggleDisabled(stabOn: boolean, hasSpeedRamp: boolean): boolean {
  return hasSpeedRamp && !stabOn;
}

/** Tên ngắn từng tính năng đang bật (cho dòng "Đang bật: ..." trong panel). */
export function enhanceActiveLabels(enh: ClipEnhance | undefined): string[] {
  return enhanceActiveFeatures(enh).map((f) =>
    enhanceT(FEATURE_LABEL[f].key, FEATURE_LABEL[f].fallback),
  );
}

/**
 * t() với fallback tiếng Việt đúng từng chữ khi key fragment chưa được
 * parent gộp vào vi.json/en.json (mẫu đợt 58 O5). Fallback cũng được thay
 * vars {name} giống t() để câu "Đang bật: {list}" vẫn đúng khi chưa gộp.
 */
export function enhanceT(key: string, fallback: string, vars?: Record<string, string>): string {
  const out = t(key, vars);
  if (out !== key) return out;
  if (!vars) return fallback;
  return fallback.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}
