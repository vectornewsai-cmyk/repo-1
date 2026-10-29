/**
 * adjustment.ts — Adjustment layer cho video-spec (Phase 9, luồng N3).
 *
 * Một adjustment layer là một đoạn trên timeline áp filter cho MỌI clip
 * video bên dưới nó trong khoảng thời gian của layer — giống adjustment
 * layer của CapCut. Layer không chứa media riêng, chỉ chứa filter.
 *
 * NGUYÊN TẮC (giống lut.ts/effects.ts): chỉ đưa vào spec những filter mà
 * render pipeline hiện tại đã hỗ trợ THẬT:
 *   - LUT trong catalog (lut.ts) hoặc LUT user (`user-<slug>`)
 *   - chỉnh màu thủ công (color.ts)
 *   - video effects (effects.ts)
 * KHÔNG có: enhance (deinterlace/stabilize/denoise — gắn với pass phân
 * tích riêng của từng clip), mask, chroma key, keyframes, textfx.
 *
 * Ngữ nghĩa thời gian (timeline, giây):
 *   - Layer bao phủ [start, start + duration) — đầu bao, cuối không bao.
 *   - Một clip chịu layer khi khoảng của clip GIAO với khoảng của layer
 *     (chạm biên đúng điểm thì KHÔNG tính là giao).
 *   - Nhiều layer chồng nhau: áp theo thứ tự track truyền vào (layer của
 *     track nằm trên áp SAU — tức ở ngoài cùng của chuỗi filter).
 *   - Clip chỉ giao một phần với layer vẫn chịu toàn bộ filter của layer
 *     trên toàn bộ clip (giới hạn này ghi trong ADJUSTMENT_LIMITS.md —
 *     tách clip theo biên layer là việc tương lai, chưa làm).
 *
 * NỐI SPEC (đợt R2, Phase 9): module này ĐÃ được export từ index.ts và
 * VideoSpec ĐÃ có field `adjustmentLayers?: AdjustmentLayer[]` (xem
 * index.ts). Field này là danh sách layer cấp project, theo thứ tự mảng:
 * layer sau áp sau (ở ngoài cùng của chuỗi filter). Layer cấp project áp
 * cho MỌI clip video mà nó giao nhau về thời gian, bất kể track — đây là
 * ngữ nghĩa đã chốt cho đợt R2 (không có scoping theo track; thêm scoping
 * là việc tương lai, không tự chế field khi render/preview chưa đọc nó).
 * Wiring render.js vẫn CHƯA làm (luồng R1 sở hữu render.js): cho đến khi
 * wiring xong, render.js vẫn BỎ QUA field này — xem ADJUSTMENT_LIMITS.md.
 *
 * ĐỢT 7 (Phase 9 round 7, luồng U1 — THỐNG NHẤT NGỮ NGHĨA, spec thuần):
 * - Shape chuẩn DUY NHẤT là layer cấp project này. Thêm 2 field tùy chọn:
 *   `tracks?: number[]` (scope: chỉ số track trong spec.tracks; vắng hoặc
 *   rỗng = áp mọi track, tương thích project cũ) và `source?:
 *   "panel" | "legacy-track-clip"` (truy vết nguồn gốc, không ảnh hưởng
 *   ngữ nghĩa áp). Thứ tự mảng adjustmentLayers = thứ tự áp (layer sau
 *   ở ngoài cùng); các layer chồng nhau về thời gian vẫn HỢP LỆ.
 * - UI shape kind "adjustment" trong track.clips là LEGACY (nestUtils.ts
 *   filterType/intensity và nestedPreview.ts filter/effects/adjustment):
 *   chuyển đổi 2 chiều bằng legacyTrackClipToLayer /
 *   specLayerToLegacyTrackClip trong file này, KHÔNG thêm kind đó vào
 *   Clip union. Converter không bịa filter: thiếu thông tin filter hoặc
 *   layer đa-track/không-scope thì trả ok:false kèm lý do.
 * - GIỚI HẠN ĐỢT 7: scope `tracks` mới chỉ ở tầng spec + validate (luồng
 *   này). Render worker (server/render/src/adjustment.js) và preview hiện
 *   vẫn áp layer cho mọi track như ngữ nghĩa R2 cũ — chủ sở hữu 2 tầng
 *   đó phải cập nhật trước khi project dùng layer có `tracks` thật, nếu
 *   không layer scope hẹp sẽ bị áp rộng hơn ý định. Xem U1_LIMITS.md.
 *
 * ⚠️ MIRROR — chỉ 2 bản JS, không tạo bản thứ ba:
 *   1. packages/video-spec/src/adjustment.js = output biên dịch (tsc) của
 *      chính file này (logic thuần, không có FFmpeg) — sửa .ts rồi biên
 *      dịch lại, KHÔNG sửa tay file .js.
 *   2. server/render/src/adjustment.js = mirror CJS viết tay cho render
 *      worker (validate + chọn layer + dựng chuỗi filter FFmpeg) — sửa
 *      logic thuần ở đây thì PHẢI cập nhật cả adjustment.js, và ngược lại.
 * KHÔNG copy logic validate/chọn layer sang index.ts, validate.js hay
 * file mới nào khác. Hàm dựng chuỗi filter FFmpeg (buildAdjustmentChain)
 * CHỈ có ở bản render, không có ở bản video-spec (đúng ranh giới
 * spec thuần / render worker của các domain khác).
 *
 * Zero-dependency ngoài các module filter đã có (không import index.ts
 * trực tiếp — effects.ts tự gắn augmentation của nó).
 */

import { validateColorAdjust, type ColorAdjust } from "./color.js";
import { isLutId, isUserLutId, type LutId, type UserLutId } from "./lut.js";
import {
  isVideoEffectType,
  validateVideoEffects,
  type VideoEffect,
} from "./effects.js";

/**
 * Một filter entry trong adjustment layer — cùng 3 họ filter mà clip
 * video đã hỗ trợ. Thứ tự áp trong render: color → LUT → effects
 * (giống thứ tự pipeline của clip trong render.js).
 */
export interface AdjustmentFilter {
  /** Id LUT trong catalog hoặc LUT user (`user-<slug>`). */
  lut?: LutId | UserLutId;
  /** Chỉnh màu thủ công (brightness/contrast/...). */
  color?: ColorAdjust;
  /** Video effects áp theo thứ tự mảng. */
  effects?: VideoEffect[];
}

/** Nguồn gốc của layer — chỉ để truy vết, không đổi ngữ nghĩa áp. */
export type AdjustmentLayerSource = "panel" | "legacy-track-clip";

/**
 * Adjustment layer trên timeline.
 * - id: định danh duy nhất trong project (chuỗi khác rỗng).
 * - start: vị trí bắt đầu trên timeline (giây, >= 0).
 * - duration: độ dài bao phủ (giây, > 0).
 * - filters: danh sách filter entry, áp theo thứ tự mảng.
 * - tracks (đợt 7, tùy chọn): scope — chỉ số track trong spec.tracks mà
 *   layer áp lên. Vắng hoặc rỗng = áp MỌI track (ngữ nghĩa R2 cũ, tương
 *   thích project cũ). Chỉ số phải là số nguyên >= 0, không trùng nhau;
 *   khi caller biết tổng số track thì validateAdjustmentLayer(s) nhận
 *   thêm tham số trackCount để chặn chỉ số vượt ngoài mảng tracks.
 * - source (đợt 7, tùy chọn): "panel" = tạo từ panel adjustment của
 *   editor; "legacy-track-clip" = chuyển đổi từ UI shape kind
 *   "adjustment" cũ trong track.clips (xem legacyTrackClipToLayer).
 */
export interface AdjustmentLayer {
  id: string;
  start: number;
  duration: number;
  filters: AdjustmentFilter[];
  tracks?: number[];
  source?: AdjustmentLayerSource;
}

/** Điểm kết thúc của layer (không bao): start + duration. */
export function adjustmentEnd(layer: AdjustmentLayer): number {
  return layer.start + layer.duration;
}

/**
 * true nếu thời điểm `clipTime` (giây trên timeline) nằm trong khoảng bao
 * phủ của layer: [start, start + duration).
 */
export function adjustmentAppliesTo(
  layer: AdjustmentLayer,
  clipTime: number
): boolean {
  return clipTime >= layer.start && clipTime < layer.start + layer.duration;
}

/**
 * true nếu layer giao với một clip chiếm [clipStart, clipStart + clipDuration)
 * trên timeline. Chạm biên đúng điểm (clip kết thúc đúng lúc layer bắt
 * đầu, hoặc ngược lại) thì KHÔNG tính là giao.
 */
export function adjustmentOverlapsClip(
  layer: AdjustmentLayer,
  clipStart: number,
  clipDuration: number
): boolean {
  return (
    clipStart < layer.start + layer.duration &&
    layer.start < clipStart + clipDuration
  );
}

/**
 * true nếu layer áp lên track có chỉ số `trackIndex` (đợt 7).
 * Layer không có `tracks` hoặc `tracks` rỗng = áp mọi track.
 */
export function adjustmentLayerAppliesToTrack(
  layer: AdjustmentLayer,
  trackIndex: number
): boolean {
  if (layer.tracks === undefined || layer.tracks.length === 0) return true;
  return layer.tracks.includes(trackIndex);
}

/**
 * Các layer giao với một clip, giữ nguyên thứ tự mảng truyền vào (= thứ
 * tự áp: layer sau ở ngoài cùng của chuỗi filter).
 * - Không truyền `trackIndex`: chỉ lọc theo thời gian (hành vi cũ, giữ
 *   nguyên để code cũ không đổi nghĩa — layer không-scope và layer có
 *   scope đều được trả về).
 * - Truyền `trackIndex`: lọc thêm theo scope `tracks` của layer (đợt 7).
 * Caller chịu trách nhiệm truyền vào CHỈ các layer nằm trên track của clip
 * (quy tắc "bên dưới": render.js overlay theo thứ tự spec.tracks nên
 * track sau = nằm trên) khi muốn ngữ nghĩa "chỉ áp clip bên dưới".
 */
export function adjustmentLayersForClip(
  layers: readonly AdjustmentLayer[],
  clipStart: number,
  clipDuration: number,
  trackIndex?: number
): AdjustmentLayer[] {
  return layers.filter(
    (l) =>
      adjustmentOverlapsClip(l, clipStart, clipDuration) &&
      (trackIndex === undefined || adjustmentLayerAppliesToTrack(l, trackIndex))
  );
}

/** Validate một AdjustmentFilter, trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateAdjustmentFilter(f: unknown): string[] {
  if (typeof f !== "object" || f === null || Array.isArray(f)) {
    return ["filter phải là một object { lut?, color?, effects? }"];
  }
  const errors: string[] = [];
  const rec = f as Record<string, unknown>;
  const known = new Set(["lut", "color", "effects"]);
  for (const k of Object.keys(rec)) {
    if (!known.has(k)) {
      errors.push(`filter.${k} không được hỗ trợ trong adjustment layer`);
    }
  }
  const lut = rec["lut"];
  if (lut !== undefined && !isLutId(lut) && !isUserLutId(lut)) {
    errors.push(
      `filter.lut không hợp lệ: ${JSON.stringify(lut)} ` +
        `(chỉ chấp nhận id trong catalog hoặc dạng "user-<slug>")`
    );
  }
  for (const m of validateColorAdjust(rec["color"])) {
    errors.push(m);
  }
  for (const m of validateVideoEffects(rec["effects"])) {
    errors.push(m);
  }
  if (
    lut === undefined &&
    (rec["color"] === undefined || rec["color"] === null) &&
    (rec["effects"] === undefined ||
      (Array.isArray(rec["effects"]) && rec["effects"].length === 0))
  ) {
    errors.push("filter rỗng (không có lut/color/effects) — layer vô tác dụng");
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Đợt 7 — Converter 2 chiều với UI shape LEGACY kind "adjustment".
//
// LEGACY LÀ GÌ (đọc trước khi dùng converter):
// - nestUtils.ts (luồng N4, tầng UI): { kind: "adjustment", id, start,
//   duration, filterType: string, intensity: number } — một effect duy
//   nhất, lưu trong track.clips của track video host bằng cast. Kind này
//   KHÔNG nằm trong Clip union của video-spec và KHÔNG BAO GIỜ được thêm
//   vào đó: shape chuẩn duy nhất là AdjustmentLayer cấp project ở trên.
// - nestedPreview.ts (luồng N5, preview): cùng kind "adjustment" nhưng
//   mang filter/effects: { filter?: { lut?, color? }, effects?: [] } hoặc
//   { adjustment?: { lut?, color?, effects? } }.
// Converter ở đây nhận cả 3 hình dạng legacy trên. Chiều spec → legacy
// chỉ giữ được những gì legacy mang nổi (xem specLayerToLegacyTrackClip);
// mọi trường hợp không biểu diễn được đều trả ok:false kèm lý do, KHÔNG
// bịa filter, KHÔNG lặng lẽ bỏ filter.
// ---------------------------------------------------------------------------

/**
 * UI shape legacy kind "adjustment" trong track.clips. Cả 3 hình dạng
 * filter đều được converter chấp nhận (xem header section trên):
 * `filterType`/`intensity` (nestUtils), `filter`/`effects` và `adjustment`
 * (nestedPreview). Một clip legacy có thể mang đồng thời filterType và
 * filter/effects — converter gộp chúng thành 1 filter entry duy nhất.
 */
export interface LegacyAdjustmentTrackClip {
  kind: "adjustment";
  id: string;
  start: number;
  duration: number;
  /** Effect type của nestUtils (phải thuộc EFFECT_TYPES). */
  filterType?: string;
  /** Cường độ 0..1 của nestUtils (vắng = mặc định của effect, 0.5). */
  intensity?: number;
  /** Filter của nestedPreview: LUT và/hoặc chỉnh màu thủ công. */
  filter?: { lut?: string; color?: ColorAdjust };
  /** Effects của nestedPreview. */
  effects?: VideoEffect[];
  /** Hình dạng thay thế của nestedPreview: { lut?, color?, effects? }. */
  adjustment?: { lut?: string; color?: ColorAdjust; effects?: VideoEffect[] };
}

/** Kết quả converter: thành công kèm warnings, hoặc thất bại kèm lý do. */
export type AdjustmentConversion<T> =
  | { ok: true; value: T; warnings: string[] }
  | { ok: false; reason: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Guard nông cho legacy clip (validate đầy đủ do converter thực hiện). */
export function isLegacyAdjustmentTrackClip(
  v: unknown
): v is LegacyAdjustmentTrackClip {
  return (
    isRecord(v) &&
    v["kind"] === "adjustment" &&
    typeof v["id"] === "string"
  );
}

/**
 * Legacy track clip → AdjustmentLayer cấp project (đợt 7).
 * - `trackIndex` là chỉ số track chứa clip legacy → thành
 *   `tracks: [trackIndex]` của layer (scope chính xác 1 track, vì clip
 *   legacy chỉ nằm trên đúng 1 track). trackIndex phải là số nguyên >= 0.
 * - `source` của layer kết quả luôn là "legacy-track-clip" (truy vết).
 * - Trả ok:false (không throw) khi: không phải legacy clip, id/start/
 *   duration không hợp lệ, trackIndex không hợp lệ, filterType lạ,
 *   intensity ngoài [0, 1], LUT lạ, color/effects không hợp lệ, trùng
 *   effect type giữa filterType và effects, hoặc clip hoàn toàn không
 *   mang thông tin filter nào (không bịa filter).
 */
export function legacyTrackClipToLayer(
  clip: unknown,
  trackIndex: number
): AdjustmentConversion<AdjustmentLayer> {
  if (!isLegacyAdjustmentTrackClip(clip)) {
    return {
      ok: false,
      reason: "không phải legacy adjustment track clip (kind \"adjustment\" + id chuỗi)",
    };
  }
  if (typeof clip.id !== "string" || clip.id.length === 0) {
    return { ok: false, reason: "legacy clip.id phải là chuỗi khác rỗng" };
  }
  if (!isFiniteNumber(clip.start) || clip.start < 0) {
    return {
      ok: false,
      reason: `legacy clip.start phải là số >= 0 (nhận được: ${JSON.stringify(clip.start)})`,
    };
  }
  if (!isFiniteNumber(clip.duration) || clip.duration <= 0) {
    return {
      ok: false,
      reason: `legacy clip.duration phải là số > 0 (nhận được: ${JSON.stringify(clip.duration)})`,
    };
  }
  if (!Number.isInteger(trackIndex) || trackIndex < 0) {
    return {
      ok: false,
      reason: `trackIndex phải là số nguyên >= 0 (nhận được: ${JSON.stringify(trackIndex)})`,
    };
  }

  const entry: AdjustmentFilter = {};
  let hasFilterInfo = false;

  // Hình dạng nestUtils: filterType + intensity → 1 effect.
  if (clip.filterType !== undefined) {
    if (!isVideoEffectType(clip.filterType)) {
      return {
        ok: false,
        reason: `legacy clip.filterType không hỗ trợ: ${JSON.stringify(clip.filterType)}`,
      };
    }
    if (
      clip.intensity !== undefined &&
      (!isFiniteNumber(clip.intensity) ||
        clip.intensity < 0 ||
        clip.intensity > 1)
    ) {
      return {
        ok: false,
        reason: `legacy clip.intensity phải là số trong [0, 1] (nhận được: ${JSON.stringify(clip.intensity)})`,
      };
    }
    entry.effects = [
      clip.intensity === undefined
        ? { type: clip.filterType }
        : { type: clip.filterType, intensity: clip.intensity },
    ];
    hasFilterInfo = true;
  }

  // Hình dạng nestedPreview: filter và/hoặc adjustment — gộp vào cùng entry.
  const mergeFilterSource = (
    src: { lut?: unknown; color?: unknown; effects?: unknown } | undefined,
    label: string
  ): string | null => {
    if (src === undefined) return null;
    if (!isRecord(src)) return `${label} phải là một object`;
    if (src["lut"] !== undefined) {
      if (!isLutId(src["lut"]) && !isUserLutId(src["lut"])) {
        return `${label}.lut không hợp lệ: ${JSON.stringify(src["lut"])}`;
      }
      if (entry.lut !== undefined && entry.lut !== src["lut"]) {
        return `${label}.lut (${String(src["lut"])}) khác LUT đã có (${String(entry.lut)}) — legacy clip chỉ mang 1 LUT`;
      }
      entry.lut = src["lut"] as LutId | UserLutId;
      hasFilterInfo = true;
    }
    if (src["color"] !== undefined) {
      const colorErrs = validateColorAdjust(src["color"]);
      if (colorErrs.length > 0) {
        return `${label}.color không hợp lệ: ${colorErrs.join("; ")}`;
      }
      if (entry.color !== undefined) {
        return `${label}.color khác color đã có — legacy clip chỉ mang 1 color entry`;
      }
      entry.color = src["color"] as ColorAdjust;
      hasFilterInfo = true;
    }
    if (src["effects"] !== undefined) {
      const effErrs = validateVideoEffects(src["effects"]);
      if (effErrs.length > 0) {
        return `${label}.effects không hợp lệ: ${effErrs.join("; ")}`;
      }
      const incoming = src["effects"] as VideoEffect[];
      const existing = entry.effects ?? [];
      for (const e of incoming) {
        if (existing.some((x) => x.type === e.type)) {
          return `${label}.effects trùng effect "${e.type}" đã có (từ filterType hoặc filter trước) — thứ tự ghi đè không xác định nên không gộp`;
        }
      }
      entry.effects = [...existing, ...incoming];
      if (incoming.length > 0) hasFilterInfo = true;
    }
    return null;
  };
  // Clip legacy cũng có thể mang effects trực tiếp ở top-level.
  if (clip.filter !== undefined && !isRecord(clip.filter)) {
    return { ok: false, reason: "legacy clip.filter phải là một object { lut?, color? }" };
  }
  if (clip.adjustment !== undefined && !isRecord(clip.adjustment)) {
    return { ok: false, reason: "legacy clip.adjustment phải là một object { lut?, color?, effects? }" };
  }
  const topErr = mergeFilterSource(
    clip.filter !== undefined || clip.effects !== undefined
      ? { lut: clip.filter?.lut, color: clip.filter?.color, effects: clip.effects }
      : undefined,
    "filter/effects"
  );
  if (topErr) return { ok: false, reason: topErr };
  const adjErr = mergeFilterSource(clip.adjustment, "adjustment");
  if (adjErr) return { ok: false, reason: adjErr };

  if (!hasFilterInfo) {
    return {
      ok: false,
      reason:
        "legacy clip không mang thông tin filter nào (không có filterType, filter, effects hay adjustment) — không bịa filter",
    };
  }

  const layer: AdjustmentLayer = {
    id: clip.id,
    start: clip.start,
    duration: clip.duration,
    filters: [entry],
    tracks: [trackIndex],
    source: "legacy-track-clip",
  };
  const layerErrs = validateAdjustmentLayer(layer);
  if (layerErrs.length > 0) {
    return {
      ok: false,
      reason: `layer chuyển đổi không hợp lệ: ${layerErrs.join("; ")}`,
    };
  }
  return { ok: true, value: layer, warnings: [] };
}

/**
 * AdjustmentLayer cấp project → legacy track clip (đợt 7).
 * - CHỈ chuyển được khi layer có đúng 1 track trong `tracks`
 *   (layer.tracks.length === 1). Layer không có `tracks` hoặc rỗng = áp
 *   mọi track, và layer đa-track đều KHÔNG biểu diễn được bằng 1 clip
 *   nằm trên 1 track → trả ok:false kèm lý do, không bịa scope.
 * - Kết quả ok mang thêm `trackIndex` = track duy nhất đó: caller PHẢI
 *   đặt clip legacy lên đúng track này (clip legacy tự nó không mang
 *   trackIndex — track của nó chính là track chứa nó trong track.clips).
 * - Biểu diễn legacy: LUT duy nhất → filter.lut; color duy nhất →
 *   filter.color; effects gộp theo thứ tự mảng filters. Layer chỉ gồm
 *   đúng 1 effect (không LUT/color) thì ghi thêm filterType/intensity
 *   để reader kiểu nestUtils cũng đọc được (cùng 1 effect, không mâu
 *   thuẫn với effects). Các trường hợp không biểu diễn được (nhiều LUT,
 *   nhiều color entry, trùng effect type giữa các entry) → ok:false.
 */
export function specLayerToLegacyTrackClip(
  layer: unknown
): AdjustmentConversion<LegacyAdjustmentTrackClip> & { trackIndex?: number } {
  const layerErrs = validateAdjustmentLayer(layer);
  if (layerErrs.length > 0) {
    return {
      ok: false,
      reason: `adjustment layer không hợp lệ: ${layerErrs.join("; ")}`,
    };
  }
  const typed = layer as AdjustmentLayer;
  if (typed.tracks === undefined || typed.tracks.length === 0) {
    return {
      ok: false,
      reason:
        "layer không có scope track (áp mọi track) — legacy track clip chỉ nằm trên đúng 1 track nên không biểu diễn được",
    };
  }
  if (typed.tracks.length !== 1) {
    return {
      ok: false,
      reason: `layer áp ${typed.tracks.length} track (${typed.tracks.join(", ")}) — legacy track clip chỉ nằm trên đúng 1 track nên không biểu diễn được`,
    };
  }
  const trackIndex = typed.tracks[0];

  let lut: string | undefined;
  let color: ColorAdjust | undefined;
  const effects: VideoEffect[] = [];
  for (const entry of typed.filters) {
    if (entry.lut !== undefined) {
      if (lut !== undefined && lut !== entry.lut) {
        return {
          ok: false,
          reason: `layer có nhiều LUT (${lut}, ${entry.lut}) — legacy track clip chỉ mang 1 filter.lut`,
        };
      }
      lut = entry.lut;
    }
    if (entry.color !== undefined) {
      if (color !== undefined) {
        return {
          ok: false,
          reason: "layer có nhiều color entry — legacy track clip chỉ mang 1 filter.color",
        };
      }
      color = entry.color;
    }
    for (const e of entry.effects ?? []) {
      if (effects.some((x) => x.type === e.type)) {
        return {
          ok: false,
          reason: `layer trùng effect "${e.type}" giữa các filter entry — legacy track clip gộp effects sẽ đổi ngữ nghĩa ghi đè`,
        };
      }
      effects.push(e);
    }
  }

  const legacy: LegacyAdjustmentTrackClip = {
    kind: "adjustment",
    id: typed.id,
    start: typed.start,
    duration: typed.duration,
  };
  if (lut !== undefined || color !== undefined) {
    legacy.filter = {};
    if (lut !== undefined) legacy.filter.lut = lut;
    if (color !== undefined) legacy.filter.color = color;
  }
  if (effects.length > 0) legacy.effects = effects;
  // Shortcut nestUtils khi toàn bộ layer chỉ là 1 effect duy nhất.
  if (
    lut === undefined &&
    color === undefined &&
    effects.length === 1
  ) {
    legacy.filterType = effects[0].type;
    if (effects[0].intensity !== undefined) {
      legacy.intensity = effects[0].intensity;
    }
  }
  return { ok: true, value: legacy, warnings: [], trackIndex };
}


/**
 * Validate một AdjustmentLayer, trả về danh sách lỗi (rỗng = hợp lệ).
 * `trackCount` (tùy chọn, đợt 7): tổng số track của project — khi có thì
 * chỉ số trong `tracks` vượt ngoài [0, trackCount) sẽ bị báo lỗi; khi
 * vắng thì chỉ kiểm tra chỉ số là số nguyên >= 0 (không biết giới hạn
 * trên). `tracks` rỗng = áp mọi track nên luôn hợp lệ về scope.
 */
export function validateAdjustmentLayer(v: unknown, trackCount?: number): string[] {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return ["adjustment layer phải là một object"];
  }
  const errors: string[] = [];
  const rec = v as Record<string, unknown>;
  const known = new Set(["id", "start", "duration", "filters", "tracks", "source"]);
  for (const k of Object.keys(rec)) {
    if (!known.has(k)) {
      errors.push(`adjustment layer.${k} không được hỗ trợ`);
    }
  }
  const id = rec["id"];
  if (typeof id !== "string" || id.length === 0) {
    errors.push(`adjustment layer.id phải là chuỗi khác rỗng (nhận được: ${JSON.stringify(id)})`);
  }
  const start = rec["start"];
  if (typeof start !== "number" || !Number.isFinite(start) || start < 0) {
    errors.push(`adjustment layer.start phải là số >= 0 (nhận được: ${JSON.stringify(start)})`);
  }
  const duration = rec["duration"];
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
    errors.push(`adjustment layer.duration phải là số > 0 (nhận được: ${JSON.stringify(duration)})`);
  }
  const filters = rec["filters"];
  if (!Array.isArray(filters)) {
    errors.push("adjustment layer.filters phải là một mảng");
  } else {
    if (filters.length === 0) {
      errors.push("adjustment layer.filters rỗng — layer vô tác dụng");
    }
    filters.forEach((f, i) => {
      for (const m of validateAdjustmentFilter(f)) {
        errors.push(`filters[${i}]: ${m}`);
      }
    });
  }
  const source = rec["source"];
  if (
    source !== undefined &&
    source !== "panel" &&
    source !== "legacy-track-clip"
  ) {
    errors.push(
      `adjustment layer.source không hợp lệ: ${JSON.stringify(source)} ` +
        `(chỉ chấp nhận "panel" hoặc "legacy-track-clip")`
    );
  }
  const tracks = rec["tracks"];
  if (tracks !== undefined) {
    if (!Array.isArray(tracks)) {
      errors.push("adjustment layer.tracks phải là một mảng số nguyên (nếu có)");
    } else {
      const seenTracks = new Set<number>();
      tracks.forEach((t, i) => {
        if (typeof t !== "number" || !Number.isInteger(t) || t < 0) {
          errors.push(
            `adjustment layer.tracks[${i}] phải là số nguyên >= 0 (nhận được: ${JSON.stringify(t)})`
          );
        } else {
          if (seenTracks.has(t)) {
            errors.push(`adjustment layer.tracks trùng chỉ số ${t} (thừa, không thêm ngữ nghĩa)`);
          }
          seenTracks.add(t);
          if (
            trackCount !== undefined &&
            Number.isInteger(trackCount) &&
            trackCount >= 0 &&
            t >= trackCount
          ) {
            errors.push(
              `adjustment layer.tracks[${i}] = ${t} vượt ngoài số track của project (${String(trackCount)})`
            );
          }
        }
      });
    }
  }
  return errors;
}

/**
 * Validate danh sách layer cấp project (field `VideoSpec.adjustmentLayers`).
 * Trả về danh sách lỗi (rỗng = hợp lệ).
 *
 * - `undefined` = field vắng mặt (project cũ) → HỢP LỆ, không lỗi. Đây là
 *   điểm tương thích ngược: project cũ không có field vẫn load bình thường.
 * - `null` hoặc không phải mảng → lỗi (field có mặt thì phải là mảng).
 * - Mảng rỗng → hợp lệ (tương đương không có layer; round-trip giữ `[]`).
 * - Mỗi layer được validate bằng validateAdjustmentLayer, lỗi gắn tiền tố
 *   `adjustmentLayers[i]: ...`.
 * - Trùng `id` giữa 2 layer → lỗi (id là định danh duy nhất trong project).
 * - Các layer chồng nhau về thời gian là HỢP LỆ (chồng nhau = nối filter
 *   tuần tự, không phải lỗi) — khác với bản ghi UI của N4 (nestUtils.ts)
 *   vốn cấm đè nhau; spec không cấm vì render nối chuỗi, không ghi đè.
 * - Đợt 7: `trackCount` (tùy chọn) được truyền xuống từng layer để chặn
 *   scope `tracks` vượt ngoài mảng tracks của project.
 */
export function validateAdjustmentLayers(v: unknown, trackCount?: number): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    return ["adjustmentLayers phải là một mảng (nếu có)"];
  }
  const errors: string[] = [];
  const seen = new Map<string, number>();
  v.forEach((layer, i) => {
    for (const m of validateAdjustmentLayer(layer, trackCount)) {
      errors.push(`adjustmentLayers[${i}]: ${m}`);
    }
    if (
      typeof layer === "object" &&
      layer !== null &&
      !Array.isArray(layer) &&
      typeof (layer as Record<string, unknown>)["id"] === "string"
    ) {
      const id = (layer as Record<string, unknown>)["id"] as string;
      if (id.length > 0) {
        if (seen.has(id)) {
          errors.push(
            `adjustmentLayers: trùng id "${id}" (index ${seen.get(id)} và ${i})`
          );
        } else {
          seen.set(id, i);
        }
      }
    }
  });
  return errors;
}
