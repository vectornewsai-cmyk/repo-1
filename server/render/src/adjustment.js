#!/usr/bin/env node
/**
 * adjustment.js — Adjustment layer cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/adjustment.ts` — logic chọn layer
 * theo thời gian PHẢI GIỐNG HỆT bản TS (xem test_adjustment.js §B parity).
 *
 * Một adjustment layer áp filter cho MỌI clip video bên dưới nó trong
 * khoảng thời gian của layer (giống CapCut). Chỉ hỗ trợ 3 họ filter mà
 * render pipeline hiện tại đã có: color (lut.js), LUT (lut3d), video
 * effects (effects.js). KHÔNG có enhance/mask/chroma/keyframes.
 *
 * Thứ tự áp (giống pipeline của clip trong render.js):
 *   trong một filter entry: color → LUT → effects
 *   giữa các entry trong một layer: theo thứ tự mảng filters
 *   giữa các layer chồng nhau: theo thứ tự mảng layers truyền vào
 *     (caller truyền theo thứ tự track, track nằm trên áp sau — tức ở
 *     ngoài cùng của chuỗi filter).
 *
 * ĐIỂM NỐI VÀO render.js (ĐÃ NỐI — Phase 9, luồng R1):
 *   1. ĐÃ XONG Ở TẦNG SPEC (đợt R2): `VideoSpec.adjustmentLayers` đã được
 *      định nghĩa trong packages/video-spec/src/index.ts (danh sách cấp
 *      project, thứ tự mảng = thứ tự áp, áp cho mọi clip video giao nhau
 *      về thời gian bất kể track).
 *   2. Render worker đọc `spec.adjustmentLayers` trực tiếp trong
 *      buildFilterGraph: mỗi clip video được tách thành các đoạn con theo
 *      biên layer bằng splitClipByLayers() rồi mới chuẩn hoá từng đoạn;
 *      đoạn trong layer được nối adjChain (buildAdjustmentChain) vào cuối
 *      chuỗi pixel của chính đoạn đó (sau effectsChain / enhPost /
 *      pluginChain — tức sau toàn bộ pipeline pixel của clip, vì
 *      adjustment là "lớp phủ trên clip", không phải thuộc tính của clip);
 *      đoạn ngoài layer giữ nguyên chuỗi cũ. validate.js kiểm tra field
 *      này trước khi dựng graph (layer sai → fail fast).
 *   3. SCOPE THEO TRACK (Phase 9 đợt 7, luồng U2 — ĐỊNH NGHĨA RENDER-SIDE,
 *      xem U2_LIMITS.md): layer có thêm field tùy chọn `tracks?: number[]`
 *      là chỉ số track trong spec ĐÃ FLATTEN (thứ tự spec.tracks mà
 *      render.js dựng graph). Vắng field = mọi track. Layer chỉ tách/áp
 *      clip thuộc track trong scope; clip ngoài scope giữ nguyên chuỗi
 *      pixel và không dính các cổng fail fast của layer đó. Legacy UI
 *      shape kind "adjustment" trong track.clips được normalize thành
 *      project layer với tracks=[chỉ số track chứa nó] ở đầu render
 *      entry (normalizeLegacyAdjustmentLayers, gọi từ main() của
 *      render.js TRƯỚC flatten) — không bỏ qua lặng lẽ.
 *   4. Layer trong project con (subSpec) của nested clip được nested.js
 *      thu thập khi flatten (offset thời gian theo cửa sổ nested, scope
 *      thu hẹp về đúng track lá) thay vì bỏ qua lặng lẽ như trước đợt 7.
 *      Thứ tự áp: layer trong trước, layer ngoài sau. Xem U2_LIMITS.md.
 *   test_adjustment.js §C/D (filter_complex dựng tay) vẫn đúng với vai trò
 *   kiểm chứng chuỗi filter; kiểm chứng wiring render.js thật nằm ở
 *   test_adjustment_render.js (qua CLI render.js, MP4 thật).
 *
 * Chạy self-test: node src/adjustment.js --self-test
 */
"use strict";

const assert = require("assert");
const {
  isLutId,
  isUserLutId,
  validateColorAdjust,
  buildColorAdjustFilter,
  buildLutFilter,
} = require("./lut");
const { buildEffectsChain, validateEffects } = require("./effects");

/** Điểm kết thúc của layer (không bao): start + duration. */
function adjustmentEnd(layer) {
  return layer.start + layer.duration;
}

/**
 * true nếu thời điểm `clipTime` (giây trên timeline) nằm trong khoảng bao
 * phủ của layer: [start, start + duration).
 */
function adjustmentAppliesTo(layer, clipTime) {
  return clipTime >= layer.start && clipTime < layer.start + layer.duration;
}

/**
 * true nếu layer giao với một clip chiếm [clipStart, clipStart + clipDuration)
 * trên timeline. Chạm biên đúng điểm thì KHÔNG tính là giao.
 */
function adjustmentOverlapsClip(layer, clipStart, clipDuration) {
  return (
    clipStart < layer.start + layer.duration &&
    layer.start < clipStart + clipDuration
  );
}

/**
 * Các layer (giữ nguyên thứ tự truyền vào) giao với một clip.
 * `clip` có thể là object { start, duration } hoặc cặp số truyền rời.
 * `trackIndex` (tùy chọn, đợt 7 U2): khi là số, chỉ giữ layer không có
 * scope (tracks vắng = mọi track) hoặc có scope chứa trackIndex; khi
 * không truyền, giữ hành vi cũ (mọi layer đều được xét — tương thích
 * test_adjustment.js / test_adjustment_render.js cũ).
 */
function adjustmentLayersForClip(layers, clipOrStart, clipDuration, trackIndex) {
  const start = typeof clipOrStart === "object" ? clipOrStart.start : clipOrStart;
  const duration =
    typeof clipOrStart === "object" ? clipOrStart.duration : clipDuration;
  return layers.filter((l) => {
    if (typeof trackIndex === "number" && Array.isArray(l.tracks) &&
        !l.tracks.includes(trackIndex)) return false;
    return adjustmentOverlapsClip(l, start, duration);
  });
}

/** Validate một filter entry, trả về danh sách lỗi (rỗng = hợp lệ). */
function validateAdjustmentFilter(f) {
  if (typeof f !== "object" || f === null || Array.isArray(f)) {
    return ["filter phải là một object { lut?, color?, effects? }"];
  }
  const errors = [];
  const known = new Set(["lut", "color", "effects"]);
  for (const k of Object.keys(f)) {
    if (!known.has(k)) {
      errors.push(`filter.${k} không được hỗ trợ trong adjustment layer`);
    }
  }
  if (f.lut !== undefined && !isLutId(f.lut) && !isUserLutId(f.lut)) {
    errors.push(
      `filter.lut không hợp lệ: ${JSON.stringify(f.lut)} ` +
        `(chỉ chấp nhận id trong catalog hoặc dạng "user-<slug>")`
    );
  }
  for (const m of validateColorAdjust(f.color)) errors.push(m);
  for (const m of validateEffects(f.effects)) errors.push(m);
  if (
    f.lut === undefined &&
    (f.color === undefined || f.color === null) &&
    (f.effects === undefined ||
      (Array.isArray(f.effects) && f.effects.length === 0))
  ) {
    errors.push("filter rỗng (không có lut/color/effects) — layer vô tác dụng");
  }
  return errors;
}

/** Validate một adjustment layer, trả về danh sách lỗi (rỗng = hợp lệ). */
function validateAdjustmentLayer(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return ["adjustment layer phải là một object"];
  }
  const errors = [];
  const known = new Set(["id", "start", "duration", "filters", "tracks"]);
  for (const k of Object.keys(v)) {
    if (!known.has(k)) {
      errors.push(`adjustment layer.${k} không được hỗ trợ`);
    }
  }
  // Đợt 7 U2 — scope tùy chọn tracks: mảng chỉ số track, không rỗng,
  // không trùng, mỗi phần tử là số nguyên >= 0. Giới hạn trên (số track
  // của spec) do caller kiểm tra theo ngữ cảnh (validate.js với spec
  // đầy đủ, nested.js với project con) vì hàm này không biết spec nào.
  if (v.tracks !== undefined) {
    if (!Array.isArray(v.tracks)) {
      errors.push("adjustment layer.tracks phải là một mảng chỉ số track (nếu có)");
    } else {
      if (v.tracks.length === 0) {
        errors.push("adjustment layer.tracks rỗng — layer không áp track nào; " +
          "bỏ field tracks để áp mọi track");
      }
      const seen = new Set();
      for (const t of v.tracks) {
        if (typeof t !== "number" || !Number.isInteger(t) || t < 0) {
          errors.push(`adjustment layer.tracks chứa chỉ số không hợp lệ: ${JSON.stringify(t)} ` +
            "(cần số nguyên >= 0)");
        } else if (seen.has(t)) {
          errors.push(`adjustment layer.tracks trùng chỉ số track ${t}`);
        } else {
          seen.add(t);
        }
      }
    }
  }
  if (typeof v.id !== "string" || v.id.length === 0) {
    errors.push(
      `adjustment layer.id phải là chuỗi khác rỗng (nhận được: ${JSON.stringify(v.id)})`
    );
  }
  if (typeof v.start !== "number" || !Number.isFinite(v.start) || v.start < 0) {
    errors.push(
      `adjustment layer.start phải là số >= 0 (nhận được: ${JSON.stringify(v.start)})`
    );
  }
  if (
    typeof v.duration !== "number" ||
    !Number.isFinite(v.duration) ||
    v.duration <= 0
  ) {
    errors.push(
      `adjustment layer.duration phải là số > 0 (nhận được: ${JSON.stringify(v.duration)})`
    );
  }
  if (!Array.isArray(v.filters)) {
    errors.push("adjustment layer.filters phải là một mảng");
  } else {
    if (v.filters.length === 0) {
      errors.push("adjustment layer.filters rỗng — layer vô tác dụng");
    }
    v.filters.forEach((f, i) => {
      for (const m of validateAdjustmentFilter(f)) {
        errors.push(`filters[${i}]: ${m}`);
      }
    });
  }
  return errors;
}

/**
 * Validate danh sách layer cấp project (field `VideoSpec.adjustmentLayers`).
 * Ngữ nghĩa PHẢI GIỐNG HỆT validateAdjustmentLayers() bản TS
 * (packages/video-spec/src/adjustment.ts) — kể cả message lỗi:
 * - `undefined` = field vắng mặt (project cũ) → hợp lệ, [].
 * - `null` hoặc không phải mảng → lỗi.
 * - Mảng rỗng → hợp lệ. Layer chồng nhau về thời gian → hợp lệ (nối
 *   filter tuần tự, không cấm như bản ghi UI của N4).
 * - Mỗi layer validate bằng validateAdjustmentLayer, lỗi gắn tiền tố
 *   `adjustmentLayers[i]: ...`; trùng id → lỗi.
 */
function validateAdjustmentLayers(v) {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    return ["adjustmentLayers phải là một mảng (nếu có)"];
  }
  const errors = [];
  const seen = new Map();
  v.forEach((layer, i) => {
    for (const m of validateAdjustmentLayer(layer)) {
      errors.push(`adjustmentLayers[${i}]: ${m}`);
    }
    if (
      typeof layer === "object" &&
      layer !== null &&
      !Array.isArray(layer) &&
      typeof layer.id === "string" &&
      layer.id.length > 0
    ) {
      if (seen.has(layer.id)) {
        errors.push(
          `adjustmentLayers: trùng id "${layer.id}" (index ${seen.get(layer.id)} và ${i})`
        );
      } else {
        seen.set(layer.id, i);
      }
    }
  });
  return errors;
}

/**
 * Dựng chuỗi filter FFmpeg cho MỘT filter entry.
 * Thứ tự: color → LUT → effects (giống pipeline của clip).
 * Trả về "" nếu entry không sinh filter nào (caller không thêm dấu phẩy).
 * @throws nếu LUT không hợp lệ / thiếu file .cube, effect không hỗ trợ.
 */
function buildAdjustmentFilterChain(entry, assetsDir, userLutsDir) {
  const parts = [];
  const color = buildColorAdjustFilter(entry.color);
  if (color) parts.push(color);
  if (entry.lut) parts.push(buildLutFilter(entry.lut, assetsDir, userLutsDir));
  const fx = buildEffectsChain(entry.effects);
  if (fx) parts.push(fx);
  return parts.join(",");
}

/**
 * Dựng chuỗi filter FFmpeg cho một danh sách layer đã chọn (theo thứ tự
 * mảng truyền vào: layer sau áp sau — tức ở ngoài cùng).
 * Trả về "" nếu không có layer nào sinh filter (caller nối trực tiếp).
 * @throws giống buildAdjustmentFilterChain.
 */
function buildAdjustmentChain(layers, assetsDir, userLutsDir) {
  const parts = [];
  for (const layer of layers || []) {
    for (const entry of layer.filters || []) {
      const c = buildAdjustmentFilterChain(entry, assetsDir, userLutsDir);
      if (c) parts.push(c);
    }
  }
  return parts.join(",");
}

/**
 * Tiện ích cho điểm nối render.js: chọn layer theo thời gian của clip rồi
 * dựng chuỗi filter. Trả về "" nếu clip không giao layer nào.
 * `trackIndex` (tùy chọn) lọc scope như adjustmentLayersForClip.
 */
function buildClipAdjustmentChain(layers, clip, assetsDir, userLutsDir, trackIndex) {
  const selected = adjustmentLayersForClip(layers || [], clip, undefined, trackIndex);
  return buildAdjustmentChain(selected, assetsDir, userLutsDir);
}

const SPLIT_EPS = 1e-6;

/**
 * Tách một clip video thành các đoạn con theo biên của các layer (Phase 9 R1,
 * điểm nối render.js). Các đoạn lát kín đúng [clip.start, clip.start +
 * clip.duration), không đổi tổng thời lượng, không đổi audio (audio kế thừa
 * của render.js vẫn đọc clip gốc, không đọc các đoạn này).
 *
 * Mỗi đoạn trả về: { start, duration, in, layers } với `layers` là các layer
 * giao với đoạn đó (giữ thứ tự mảng truyền vào). Đoạn chỉ chạm biên layer
 * (kết thúc đúng lúc layer bắt đầu hoặc ngược lại) thì KHÔNG tính là giao
 * — khớp ngữ nghĩa nửa-mở [start, start + duration) của adjustment.
 *
 * Ánh xạ `in` (điểm nguồn của đoạn, dùng đúng công thức trim của render.js
 * là trim [in, in + duration*speed) rồi speed/reverse):
 *   - không reverse: in_seg = clip.in + (segStart - clip.start) * speed
 *   - reverse: render trim cả đoạn gốc rồi đảo toàn bộ, nên đoạn ở offset o
 *     (dài d) là đoạn nguồn ở đầu xa: in_seg =
 *     clip.in + (clip.duration - o - d) * speed; trim + reverse từng đoạn
 *     cho ra đúng thứ tự frame như đoạn tương ứng của clip gốc đã đảo.
 * `speed` mặc định 1. Clip ramp (speedKeyframes) không dùng hàm này để tách
 * (keyframe tốc độ gắn theo thời gian cục bộ — render.js fail fast khi
 * layer cắt giữa clip ramp; layer bao trọn clip ramp thì không cần tách).
 * `trackIndex` (tùy chọn, đợt 7 U2): khi là số, chỉ các layer trong scope
 * mới tách clip này và chỉ chúng mới xuất hiện trong `layers` của đoạn;
 * clip ngoài scope trả về đúng 1 đoạn với layers rỗng (giữ nguyên chuỗi
 * pixel, không dính cổng fail fast của layer). Không truyền trackIndex
 * thì giữ hành vi cũ (mọi layer đều xét).
 * @throws khi clip.in không phải số hữu hạn (caller đã validate clip trước).
 */
function splitClipByLayers(clip, layers, trackIndex) {
  const speed = clip.speed === undefined ? 1 : clip.speed;
  if (typeof clip.in !== "number" || !Number.isFinite(clip.in)) {
    throw new Error(
      `splitClipByLayers: clip "${clip.id}" thiếu in hữu hạn (nhận được: ${clip.in})`
    );
  }
  const scoped = (layers || []).filter((l) => {
    if (typeof trackIndex !== "number" || !Array.isArray(l.tracks)) return true;
    return l.tracks.includes(trackIndex);
  });
  const cStart = clip.start;
  const cEnd = clip.start + clip.duration;
  const edges = new Set();
  for (const layer of scoped) {
    for (const e of [layer.start, layer.start + layer.duration]) {
      if (e > cStart + SPLIT_EPS && e < cEnd - SPLIT_EPS) edges.add(e);
    }
  }
  const bounds = [cStart, ...[...edges].sort((a, b) => a - b), cEnd];
  const segments = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const s = bounds[i];
    const d = bounds[i + 1] - s;
    if (d <= SPLIT_EPS) continue;
    const offset = s - cStart;
    const segIn = clip.reverse
      ? clip.in + (clip.duration - offset - d) * speed
      : clip.in + offset * speed;
    segments.push({
      start: s,
      duration: d,
      in: segIn,
      layers: adjustmentLayersForClip(scoped, s, d),
    });
  }
  return segments;
}

/**
 * Đợt 7 U2 — Normalize legacy UI adjustment clip thành project layer.
 *
 * Legacy shape (UI, xem apps/web/src/components/nested/nestUtils.ts —
 * CHỈ ĐỌC, không sửa): bản ghi { kind: "adjustment", id, start, duration,
 * filterType, intensity } nằm trong track.clips, hoặc biến thể có field
 * `filters` sẵn, hoặc bọc trong `adjustment: { filters | filterType }`.
 * Hàm này chạy Ở ĐẦU render entry (main() của render.js, TRƯỚC flatten
 * và TRƯỚC validate) nên spec vào validate/flatten đã sạch:
 *   - mỗi legacy clip bị gỡ khỏi track.clips, thay bằng một project layer
 *     { id, start, duration, filters, tracks: [chỉ số track chứa nó] }
 *     nối vào cuối spec.adjustmentLayers (sau các project layer đã có —
 *     tức legacy áp SAU = ở ngoài cùng so với project layer cùng thời gian).
 *   - filterType → filters: [{ effects: [{ type: filterType, intensity }] }]
 *     (intensity vắng thì bỏ qua để effects dùng mặc định); filters sẵn
 *     có thì dùng thẳng. filterType lạ / layer chuyển đổi không hợp lệ →
 *     throw (fail fast, không bỏ qua lặng lẽ).
 *   - trùng id với project layer đã có hoặc với legacy clip khác → throw.
 *   - đệ quy vào subSpec/nested của clip lồng nhau: chỉ số track trong
 *     scope của legacy con tính theo track của project con đó (flatten
 *     của nested.js sẽ dịch scope này về track lá, xem U2_LIMITS.md).
 * Input bị sửa trực tiếp (spec đã parse từ JSON, caller sở hữu nó).
 * @returns {{ converted: number }} số legacy clip đã chuyển đổi.
 * @throws khi gặp legacy clip không chuyển đổi được, trùng id, hoặc lồng
 *   nhau sâu hơn NESTED_MAX_DEPTH (khớp giới hạn của nested.js).
 */
const LEGACY_MAX_DEPTH = 8;

function isLegacyAdjustmentClip(clip) {
  if (typeof clip !== "object" || clip === null || Array.isArray(clip)) return false;
  if (clip.kind === "adjustment") return true;
  const a = clip.adjustment;
  return typeof a === "object" && a !== null && !Array.isArray(a);
}

function legacyClipToLayer(clip, trackIndex) {
  const where = `legacy adjustment clip "${clip.id}" (track ${trackIndex})`;
  if (typeof clip.id !== "string" || clip.id.length === 0)
    throw new Error(`${where}: thiếu id (chuỗi khác rỗng)`);
  if (typeof clip.start !== "number" || !Number.isFinite(clip.start) || clip.start < 0)
    throw new Error(`${where}: start phải là số >= 0, nhận được: ${clip.start}`);
  if (typeof clip.duration !== "number" || !Number.isFinite(clip.duration) || clip.duration <= 0)
    throw new Error(`${where}: duration phải là số > 0, nhận được: ${clip.duration}`);
  let filters;
  const adj = (typeof clip.adjustment === "object" && clip.adjustment !== null &&
    !Array.isArray(clip.adjustment)) ? clip.adjustment : null;
  if (Array.isArray(clip.filters)) filters = clip.filters;
  else if (adj && Array.isArray(adj.filters)) filters = adj.filters;
  else {
    const filterType = clip.filterType !== undefined ? clip.filterType : (adj ? adj.filterType : undefined);
    if (typeof filterType !== "string" || filterType.length === 0)
      throw new Error(`${where}: không có filters lẫn filterType — không biết ` +
        "layer này áp hiệu ứng gì, không đoán");
    const intensity = clip.intensity !== undefined ? clip.intensity : (adj ? adj.intensity : undefined);
    const entry = { type: filterType };
    if (intensity !== undefined) entry.intensity = intensity;
    filters = [{ effects: [entry] }];
  }
  const layer = { id: clip.id, start: clip.start, duration: clip.duration,
    filters, tracks: [trackIndex] };
  const errs = validateAdjustmentLayer(layer);
  // validateEffects kiểm tra filterType có trong EFFECT_TYPES không (qua
  // validateAdjustmentFilter) — lỗi ở đây là fail fast rõ ràng thay vì
  // để render.js chết sau bằng lỗi filter FFmpeg khó hiểu.
  if (errs.length > 0)
    throw new Error(`${where}: không chuyển đổi được thành project layer: ${errs.join("; ")}`);
  return layer;
}

function normalizeLegacyAdjustmentLayers(spec, depth = 1) {
  if (depth > LEGACY_MAX_DEPTH)
    throw new Error(`legacy adjustment: lồng nhau sâu hơn ${LEGACY_MAX_DEPTH} cấp — ` +
      "vượt giới hạn nested, không normalize");
  if (typeof spec !== "object" || spec === null || !Array.isArray(spec.tracks))
    throw new Error("legacy adjustment: spec phải là object có mảng tracks");
  let converted = 0;
  const existingIds = new Set();
  if (spec.adjustmentLayers !== undefined && !Array.isArray(spec.adjustmentLayers))
    throw new Error("legacy adjustment: spec.adjustmentLayers phải là một mảng (nếu có)");
  if (Array.isArray(spec.adjustmentLayers)) {
    for (const l of spec.adjustmentLayers) {
      if (l && typeof l.id === "string") existingIds.add(l.id);
    }
  }
  const convertedLayers = [];
  spec.tracks.forEach((track, ti) => {
    if (typeof track !== "object" || track === null || !Array.isArray(track.clips)) return;
    const kept = [];
    for (const clip of track.clips) {
      if (isLegacyAdjustmentClip(clip)) {
        const layer = legacyClipToLayer(clip, ti);
        if (existingIds.has(layer.id))
          throw new Error(`legacy adjustment: trùng id layer "${layer.id}" với ` +
            "project layer đã có hoặc legacy clip khác — id layer phải duy nhất");
        existingIds.add(layer.id);
        convertedLayers.push(layer);
        converted += 1;
        continue;
      }
      kept.push(clip);
      // Đệ quy vào project con của clip lồng nhau (subSpec hoặc bí danh
      // nested) — chỉ khi nó thật sự là object có tracks, còn lại để
      // nested.js báo lỗi chuyên môn của nó sau.
      for (const key of ["subSpec", "nested"]) {
        const sub = clip && typeof clip === "object" ? clip[key] : undefined;
        if (typeof sub === "object" && sub !== null && !Array.isArray(sub) &&
            Array.isArray(sub.tracks)) {
          converted += normalizeLegacyAdjustmentLayers(sub, depth + 1).converted;
        }
      }
    }
    track.clips = kept;
  });
  if (convertedLayers.length > 0) {
    spec.adjustmentLayers = [
      ...(Array.isArray(spec.adjustmentLayers) ? spec.adjustmentLayers : []),
      ...convertedLayers,
    ];
  }
  return { converted };
}

module.exports = {
  adjustmentEnd,
  adjustmentAppliesTo,
  adjustmentOverlapsClip,
  adjustmentLayersForClip,
  validateAdjustmentFilter,
  validateAdjustmentLayer,
  validateAdjustmentLayers,
  buildAdjustmentFilterChain,
  buildAdjustmentChain,
  buildClipAdjustmentChain,
  splitClipByLayers,
  isLegacyAdjustmentClip,
  normalizeLegacyAdjustmentLayers,
};

// ---- self-test nhanh (node src/adjustment.js --self-test) ----
if (require.main === module && process.argv.includes("--self-test")) {
  const L = { id: "adj1", start: 2, duration: 3, filters: [{ color: { brightness: 20 } }] };
  assert.strictEqual(adjustmentAppliesTo(L, 2), true);
  assert.strictEqual(adjustmentAppliesTo(L, 4.999), true);
  assert.strictEqual(adjustmentAppliesTo(L, 5), false);
  assert.strictEqual(adjustmentAppliesTo(L, 1.999), false);
  assert.strictEqual(adjustmentOverlapsClip(L, 0, 2), false); // chạm biên trái
  assert.strictEqual(adjustmentOverlapsClip(L, 5, 2), false); // chạm biên phải
  assert.strictEqual(adjustmentOverlapsClip(L, 4, 2), true);
  assert.deepStrictEqual(validateAdjustmentLayer(L), []);
  assert.ok(validateAdjustmentLayer({ id: "x", start: -1, duration: 1, filters: [{ color: {} }] }).length > 0);
  assert.strictEqual(
    buildAdjustmentFilterChain({ color: { brightness: 20 } }),
    "eq=brightness=0.2"
  );
  // R1: split theo biên layer (xem test_adjustment_render.js cho render thật).
  {
    const L = { id: "adj", start: 2, duration: 2, filters: [{ color: { brightness: 20 } }] };
    const segs = splitClipByLayers({ id: "c", start: 0, duration: 6, in: 1, speed: 1 }, [L]);
    assert.deepStrictEqual(segs.map((s) => [s.start, s.duration]), [[0, 2], [2, 2], [4, 2]]);
    assert.deepStrictEqual(segs.map((s) => s.in), [1, 3, 5]);
    assert.deepStrictEqual(segs.map((s) => s.layers.length), [0, 1, 0]);
    // Chạm biên đúng điểm thì không tách, không giao.
    assert.strictEqual(splitClipByLayers({ id: "c", start: 0, duration: 2, in: 0 }, [L]).length, 1);
    // Speed 2: in_seg = in + offset * speed (clip 0-3s, layer 2-4s chỉ cắt ở 2).
    const sp = splitClipByLayers({ id: "c", start: 0, duration: 3, in: 0, speed: 2 }, [L]);
    assert.deepStrictEqual(sp.map((s) => [s.start, s.duration, s.in]), [[0, 2, 0], [2, 1, 4]]);
    // Reverse: đoạn ở offset o lấy nguồn ở đầu xa.
    const rv = splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0, reverse: true }, [
      { id: "adj", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] },
    ]);
    assert.deepStrictEqual(rv.map((s) => [s.start, s.in]), [[0, 3], [1, 1], [3, 0]]);
  }
  // Đợt 7 U2: scope tracks + normalize legacy.
  {
    const scoped = { id: "s", start: 0, duration: 4, tracks: [1],
      filters: [{ color: { brightness: 20 } }] };
    const unscoped = { id: "u", start: 0, duration: 4, filters: [{ color: { brightness: 20 } }] };
    assert.deepStrictEqual(
      adjustmentLayersForClip([scoped, unscoped], { start: 0, duration: 4 }, undefined, 0).map((l) => l.id),
      ["u"], "track 0 chỉ nhận layer không scope");
    assert.deepStrictEqual(
      adjustmentLayersForClip([scoped, unscoped], { start: 0, duration: 4 }, undefined, 1).map((l) => l.id),
      ["s", "u"], "track 1 nhận cả hai");
    assert.strictEqual(
      splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0 }, [scoped], 0).length, 1,
      "clip ngoài scope: không tách");
    assert.strictEqual(
      splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0 }, [scoped], 1).length, 1,
      "layer bao trọn clip trong scope: không tách nhưng có layer");
    assert.strictEqual(
      splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0 }, [scoped], 1)[0].layers.length, 1);
    assert.ok(validateAdjustmentLayer({ ...scoped, tracks: [] }).length > 0, "tracks rỗng → lỗi");
    assert.ok(validateAdjustmentLayer({ ...scoped, tracks: [1, 1] }).length > 0, "tracks trùng → lỗi");
    assert.ok(validateAdjustmentLayer({ ...scoped, tracks: [-1] }).length > 0, "tracks âm → lỗi");
    assert.deepStrictEqual(validateAdjustmentLayer(scoped), [], "tracks [1] hợp lệ");
    const spec = { version: "0.2.0", meta: {}, tracks: [
      { id: "v0", kind: "video", clips: [
        { kind: "video", id: "c", start: 0, duration: 4 },
        { kind: "adjustment", id: "leg", start: 1, duration: 2, filterType: "grayscale", intensity: 1 },
      ] },
      { id: "v1", kind: "video", clips: [] },
    ] };
    assert.strictEqual(normalizeLegacyAdjustmentLayers(spec).converted, 1);
    assert.strictEqual(spec.tracks[0].clips.length, 1, "legacy clip đã gỡ khỏi track");
    assert.deepStrictEqual(spec.adjustmentLayers[0].tracks, [0], "legacy → tracks=[host track]");
    assert.deepStrictEqual(spec.adjustmentLayers[0].filters,
      [{ effects: [{ type: "grayscale", intensity: 1 }] }], "filterType → effects entry");
    assert.throws(() => normalizeLegacyAdjustmentLayers({ version: "0.2.0", meta: {}, tracks: [
      { id: "v", kind: "video", clips: [
        { kind: "adjustment", id: "bad", start: 0, duration: 1, filterType: "khong-co" },
      ] },
    ] }), /không chuyển đổi được/, "filterType lạ → fail fast ở normalize");
  }
  console.log("adjustment self-test OK");
}
