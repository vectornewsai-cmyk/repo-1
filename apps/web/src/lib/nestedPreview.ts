/**
 * nestedPreview.ts — Làm phẳng nested sequence + adjustment layer cho PREVIEW.
 *
 * Luồng N5 (Phase 9), chỉ phục vụ preview trong browser, KHÔNG đụng render lõi.
 *
 * Bối cảnh: video-spec hiện tại (v0.2.0) CHƯA có kind "nested"/"adjustment".
 * File này KHÔNG phụ thuộc định nghĩa spec của luồng khác: nó nhận diện
 * nested/adjustment bằng duck-typing trên cấu trúc JSON (kind + tracks /
 * kind + filter), nên hoạt động độc lập và vẫn tương thích khi spec chính
 * thức bổ sung 2 kind này (miễn là giữ đúng hình dạng field đã mô tả ở đây).
 *
 * Ngữ nghĩa đã chọn (ghi rõ để luồng render sau này đối chiếu, xem
 * NESTED_PREVIEW_LIMITS.md):
 * - Nested clip chiếm đoạn [start, start + duration) trên timeline cha và
 *   chiếu đoạn sequence con [in, in + duration * speed). speed > 0.
 *   Hình dạng CHUẨN là `subSpec` + `trim` (xem `normalizeNestedClip`):
 *   clip chỉ có `tracks` trực tiếp là hình dạng cũ, được normalize về
 *   subSpec ở entry; clip vừa có `tracks` vừa có `subSpec` mà nội dung
 *   khác nhau thì throw (fail fast, không chọn lặng lẽ một bên).
 * - Adjustment layer CHUẨN là `VideoSpec.adjustmentLayers` cấp project
 *   (U3, đợt 7, thay ngữ nghĩa "track trên áp xuống" của R4): layer chiếm
 *   đoạn [start, start + duration), áp theo thứ tự MẢNG (layer sau áp
 *   sau, ở ngoài cùng — khớp render), và chỉ áp lên clip có track thuộc
 *   scope `tracks` của nó; `tracks` vắng = mọi track. Với clip trong
 *   nested, scope của layer cấp project xét theo track TẦNG NGOÀI chứa
 *   nested clip; scope của layer trong subSpec xét theo track trong
 *   subSpec đó (xem `adjustmentAppliesToClip`).
 * - Legacy UI shape `kind: "adjustment"` trong `track.clips` được
 *   normalize ở entry thành layer chuẩn có scope `tracks = [trackIndex]`
 *   của track host (KHÔNG còn áp theo "track sau nằm trên"): layer host
 *   trên track video nào chỉ áp clip trên đúng track đó. Ngoại lệ duy
 *   nhất: track chuyên biệt có `kind === "adjustment"` không có host
 *   nên normalize thành không scope (mọi track, đúng default chuẩn) —
 *   nếu không, scope = chính track adjustment sẽ thành no-op.
 * - LUT nối thật theo thứ tự MẢNG (U3): chuỗi LUT = [LUT gốc của clip,
 *   LUT các layer đang áp theo đúng thứ tự mảng]; `lut` (đơn) chỉ còn
 *   là phần tử cuối chuỗi để code cũ/badge đọc được, không còn mang
 *   nghĩa "thắng". Đường vẽ preview áp chuỗi lần lượt (WebGL từng LUT,
 *   fallback CSS nối chuỗi xấp xỉ) — xem `previewEngine.videoClipVisual`
 *   + `preview.tsx`.
 * - Color cộng dồn rồi clamp [-100, 100]; effects gộp, trùng type thì
 *   layer sau (trong mảng) ghi đè effect cùng type của layer trước/clip.
 *
 * File thuần TS; từ đợt 19 G1 có import runtime duy nhất là engine
 * speedcurve của `@repo-1/video-spec` (speedAt/integrate/slice — cùng
 * engine render dùng, tránh drift công thức). Test vẫn chạy bằng
 * `node --experimental-strip-types` từ gốc repo (alias workspace
 * resolve qua node_modules, như previewEngine.test.ts).
 */

import type { Clip, Track, VideoSpec } from "@repo-1/video-spec";
import {
  integrateSpeed,
  normalizeSpeedKeyframes,
  sliceSpeedKeyframes,
  speedAt,
  type SpeedCurve,
  type SpeedKeyframe,
} from "@repo-1/video-spec";

// Phase 9 đợt 21 T1: nối hợp curve hai tầng (twoLevelCurve, render đợt 20
// R1) vào flattenNested. Import kèm đuôi .ts theo quy ước test
// strip-types của repo (file test import "./nestedPreview.ts"); tsc với
// moduleResolution bundler mà không bật allowImportingTsExtensions sẽ
// báo TS5097 cho đường dẫn đuôi .ts nên dòng import này mang @ts-ignore
// có chủ đích — vite và node strip-types đều resolve được đuôi .ts,
// chỉ tsc là cần bỏ qua (đã kiểm chứng: tsc 0 với @ts-ignore này).
// @ts-ignore: xem ghi chú trên (TS5097, đuôi .ts cho strip-types)
import { composeTwoLevelCurve } from "./twoLevelCurve.ts";

// ---------------------------------------------------------------------------
// Kiểu đầu vào (độc lập, duck-typed)
// ---------------------------------------------------------------------------

export interface ColorAdjustInput {
  brightness?: number;
  saturation?: number;
  contrast?: number;
  temperature?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
}

export interface EffectInput {
  type: string;
  intensity?: number;
}

export interface FilterInput {
  lut?: string;
  color?: ColorAdjustInput;
  /**
   * R4: chuỗi LUT đầy đủ, theo thứ tự áp (LUT gốc của clip trước, rồi
   * các layer từ dưới lên trên). Chỉ mang tính preview-internal: do
   * `buildPreviewSpec` đặt lên clip đã phẳng; KHÔNG thuộc spec chính
   * thức (VideoFilter chỉ có 1 `lut`), KHÔNG được export ra project,
   * KHÔNG được render.js đọc. Khi có `lutChain`, `lut` = phần tử cuối
   * chuỗi (để code chỉ đọc 1 LUT vẫn thấy LUT trên cùng).
   */
  lutChain?: string[];
}

/** Clip lá: mọi clip thường (video/audio/image/text/sticker). */
export interface LeafClipInput {
  kind: string;
  id: string;
  start: number;
  duration: number;
  in?: number;
  out?: number;
  speed?: number;
  /** Phase 9 đợt 19 G1: curve ramp tổng hợp cho lá media dưới nested ramp. */
  speedKeyframes?: SpeedCurve;
  filter?: FilterInput;
  effects?: EffectInput[];
  [key: string]: unknown;
}

/** Adjustment layer: clip đặc biệt chỉ mang filter/effects, không có media. */
export interface AdjustmentLayerInput {
  kind: string;
  id: string;
  start: number;
  duration: number;
  filter?: FilterInput;
  effects?: EffectInput[];
  /** Hình dạng thay thế: { lut?, color?, effects? } nằm trong field `adjustment`. */
  adjustment?: FilterInput & { effects?: EffectInput[] };
  [key: string]: unknown;
}

export interface NestedTrackInput {
  id?: string;
  kind?: string;
  clips: unknown[];
  [key: string]: unknown;
}

export interface NestedClipInput {
  kind: "nested";
  id: string;
  start: number;
  duration: number;
  in?: number;
  speed?: number;
  /**
   * Phase 9 đợt 19 G1: speedKeyframes trên clip lồng nhau (ngữ nghĩa
   * render đợt 18: duration là thời gian OUTPUT, cửa sổ con là
   * [in, in + ∫curve)). Curve hằng gộp về tốc độ hằng (xem
   * resolveNestedRampCurve).
   */
  speedKeyframes?: SpeedCurve;
  /**
   * U3: hình dạng CŨ (preview R3/R4) — tracks trực tiếp trên clip.
   * Hình dạng CHUẨN là `subSpec` dưới đây; `normalizeNestedClip` quy
   * cả hai về một dạng trước khi flatten (xem hàm đó).
   */
  tracks?: NestedTrackInput[];
  /**
   * U3: hình dạng CHUẨN (theo video-spec `NestedClip.subSpec`):
   * VideoSpec con. Chỉ cần `tracks` + `adjustmentLayers` (nếu có) cho
   * preview; `meta` không bắt buộc ở đây (duck-typed).
   */
  subSpec?: {
    tracks?: unknown[];
    adjustmentLayers?: unknown[];
    [key: string]: unknown;
  };
  /**
   * U3: cửa sổ phát CHUẨN trong subSpec: [in, out). Khi có `trim`,
   * `in` trên clip (nếu cũng có) phải bằng `trim.in`, và `duration`
   * phải bằng `(out - in) / speed` (sai số 1e-6) — ngược lại throw.
   * Không có `trim` thì phát theo cửa sổ cũ [in, in + duration*speed).
   */
  trim?: { in: number; out: number };
  /**
   * R3: opacity kế thừa (0..1) — nhân vào từng clip lá khi phẳng (xem
   * `applyPreviewLeafVisual`). Ngoài khoảng → throw (khớp render).
   */
  opacity?: number;
  /** R3: transition qua biên (chỉ type "fade" được nối, xem bên dưới). */
  transitionIn?: BoundaryTransitionField;
  /** R3: transition qua biên (chỉ type "fade" được nối, xem bên dưới). */
  transitionOut?: BoundaryTransitionField;
  [key: string]: unknown;
}

/** Field transition qua biên (shape tối thiểu: { type, duration }). */
export interface BoundaryTransitionField {
  type: string;
  duration: number;
}

/** Hình dạng tối thiểu của spec mà flatten chấp nhận (duck-typed). */
export interface FlattenSpecInput {
  tracks: Array<{
    id?: string;
    kind?: string;
    clips: unknown[];
    [key: string]: unknown;
  }>;
  /** U3: layer chuẩn cấp project (nếu có) — xem `convertCanonicalLayer`. */
  adjustmentLayers?: unknown[];
}

/**
 * Một entry filter trong layer chuẩn: cùng 3 họ filter mà clip video đã
 * hỗ trợ (lut/color/effects). Thứ tự áp trong một layer: theo thứ tự
 * mảng `filters` (entry sau nối sau entry trước).
 */
export interface CanonicalFilterInput {
  lut?: string;
  color?: ColorAdjustInput;
  effects?: EffectInput[];
}

/** Hình dạng duck-typed của 1 layer trong `VideoSpec.adjustmentLayers`. */
export interface CanonicalLayerInput {
  id: string;
  start: number;
  duration: number;
  filters?: CanonicalFilterInput[];
  /** U3: scope track (chỉ số trong mảng tracks của timeline chứa layer). */
  tracks?: number[];
  /** Hình dạng legacy thay thế (filter đơn + effects) — vẫn chấp nhận. */
  filter?: FilterInput;
  effects?: EffectInput[];
  [key: string]: unknown;
}

/**
 * Nested clip ĐÃ normalize (đầu ra duy nhất của `normalizeNestedClip`,
 * đầu vào duy nhất của `flattenNested`): chỉ còn một nguồn tracks, một
 * điểm vào `in`, và layer chuẩn của subSpec (nếu có) tách riêng.
 */
export interface NormalizedNestedInput {
  kind: "nested";
  id: string;
  start: number;
  duration: number;
  speed?: number;
  speedKeyframes?: SpeedCurve;
  /** Điểm vào trong timeline con (từ `trim.in`, hoặc `in` cũ). */
  in: number;
  /** Điểm ra trong timeline con (chỉ khi có `trim`); vắng = không kẹp. */
  trimOut?: number;
  tracks: NestedTrackInput[];
  /** Layer chuẩn trong subSpec (chưa quy thời gian — xem `flattenNested`). */
  subSpecLayers?: CanonicalLayerInput[];
  opacity?: number;
  transitionIn?: BoundaryTransitionField;
  transitionOut?: BoundaryTransitionField;
  [key: string]: unknown;
}

/** Cửa sổ adjustment đã quy về timeline ngoài (dùng cho preview + split). */
export interface AdjustmentWindow {
  id: string;
  start: number;
  duration: number;
  filter?: FilterInput;
  effects?: EffectInput[];
  /**
   * U3: scope track CHUẨN (chỉ số trong mảng tracks của timeline chứa
   * layer). `undefined` = mọi track (default chuẩn khi field `tracks`
   * vắng). Xem `adjustmentAppliesToClip`: layer chỉ áp clip có
   * `trackStack[level] ∈ scopeTracks`, với level = độ sâu timeline của
   * layer (= `nestedPath.length`). Layer legacy đã normalize LUÔN có
   * scope (host track) hoặc `undefined` (track adjustment chuyên biệt).
   */
  scopeTracks?: number[];
  /**
   * R4 (chỉ còn là provenance/debug, U3 KHÔNG dùng để xét áp nữa):
   * vị trí track của layer trong timeline của nó. Ngữ nghĩa "track sau
   * nằm trên" của R4 đã bị thay bằng scope ở trên — đừng đọc lại field
   * này để quyết định áp hay không.
   */
  trackIndex?: number;
  /**
   * R4 (provenance, không dùng để xét áp nữa): chỉ số track tầng ngoài
   * chứa timeline của layer.
   */
  outerTrackIndex?: number;
  /**
   * R4 (provenance, không dùng để xét áp nữa): chuỗi track chứa layer,
   * từ ngoài vào trong.
   */
  trackStack?: number[];
}

export interface FlatClip {
  /** Clip lá đã chỉnh start/duration/in theo vị trí ngoài (copy, trừ clip gốc tầng ngoài). */
  clip: LeafClipInput;
  /** Kind của track chứa clip lá (video/audio/image/text/sticker). */
  trackKind: string;
  /** Chuỗi id nested bao ngoài, từ ngoài vào trong; [] = clip tầng ngoài. */
  nestedPath: string[];
  /** id của clip lá gốc. */
  sourceId: string;
  /**
   * U3: chỉ số track của clip trong timeline trực tiếp của nó
   * (tầng ngoài: chỉ số trong spec.tracks; trong nested: chỉ số trong
   * nested.tracks). Dùng cùng `adjustmentAppliesToClip` để xét scope.
   */
  trackIndex: number;
  /**
   * U3: chỉ số track tầng ngoài chứa clip (tầng ngoài: = trackIndex;
   * trong nested: chỉ số track chứa nested clip ngoài cùng). Layer cấp
   * project xét scope qua giá trị này (trackStack[0]).
   */
  outerTrackIndex: number;
  /**
   * R4: chuỗi track chứa clip, từ ngoài vào trong: [track tầng ngoài,
   * track trong nested cấp 1, ...]. Dùng với `adjustmentAppliesToClip`
   * để xét layer ở bất kỳ tầng nào (kể cả layer trong nested ngoài áp
   * vào clip trong nested con sâu hơn).
   */
  trackStack: number[];
  /** Vị trí bắt đầu trên timeline ngoài (= clip.start, ghi tường minh cho test). */
  outerStart: number;
  /** Độ dài trên timeline ngoài (= clip.duration). */
  outerDuration: number;
}

export interface RemappedAdjustment extends AdjustmentWindow {
  nestedPath: string[];
}

export interface FlattenResult {
  clips: FlatClip[];
  adjustments: RemappedAdjustment[];
  /** Lý do bỏ qua (nested lỗi, chu trình, clip không nhận dạng...). */
  skipped: string[];
  /**
   * R3: clip phẳng tầng ngoài bị dịch sớm bởi transition qua biên
   * (Map clip gốc -> số giây dịch sớm). Chỉ có clip tầng ngoài (clip
   * trong nested đã dịch sẵn trong `clips`); `buildPreviewSpec` dùng
   * map này để dịch clip phẳng trên track ngoài.
   */
  plainShifts: Map<unknown, number>;
}

// ---------------------------------------------------------------------------
// Nhận diện (duck-typing, không phụ thuộc spec luồng khác)
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isNestedClip(v: unknown): v is NestedClipInput {
  return (
    isRecord(v) &&
    v["kind"] === "nested" &&
    (Array.isArray(v["tracks"]) || isRecord(v["subSpec"]))
  );
}

export function isAdjustmentLayer(v: unknown): boolean {
  if (!isRecord(v)) return false;
  if (v["kind"] === "adjustment") return true;
  // Hình dạng thay thế: clip thường mang field `adjustment` là object.
  return isRecord(v["adjustment"]);
}

function isLeafClip(v: unknown): v is LeafClipInput {
  return (
    isRecord(v) &&
    typeof v["kind"] === "string" &&
    (v["kind"] as string).length > 0 &&
    typeof v["id"] === "string" &&
    Number.isFinite(v["start"]) &&
    Number.isFinite(v["duration"]) &&
    (v["duration"] as number) > 0
  );
}

const KNOWN_TRACK_KINDS = new Set([
  "video",
  "audio",
  "image",
  "text",
  "sticker",
]);

/**
 * Đọc filter/effects của 1 adjustment layer legacy trong track.clips
 * (cả 2 hình dạng field: `filter`/`effects` hoặc `adjustment`).
 * `scopeTracks` là scope ĐÃ normalize của layer này (xem
 * `legacyLayerScope`): caller quyết định, hàm này chỉ gắn vào window.
 * Trả null khi start/duration không hợp lệ (giữ hành vi cũ: bỏ qua).
 */
function readAdjustment(
  raw: Record<string, unknown>,
  trackKind: string,
  scopeTracks?: number[],
): AdjustmentWindow | null {
  const id = typeof raw["id"] === "string" ? (raw["id"] as string) : "?";
  const start = raw["start"];
  const duration = raw["duration"];
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(duration) ||
    (duration as number) <= 0
  ) {
    return null;
  }
  // Track kind "adjustment" cũng được coi là layer dù clip mang kind khác.
  void trackKind;
  let filter: FilterInput | undefined;
  let effects: EffectInput[] | undefined;
  if (isRecord(raw["filter"])) filter = raw["filter"] as FilterInput;
  if (Array.isArray(raw["effects"])) effects = raw["effects"] as EffectInput[];
  if (isRecord(raw["adjustment"])) {
    const adj = raw["adjustment"] as FilterInput & { effects?: EffectInput[] };
    if (!filter) filter = adj;
    if (!effects && Array.isArray(adj.effects)) effects = adj.effects;
  }
  return {
    id,
    start: start as number,
    duration: duration as number,
    filter,
    effects,
    scopeTracks,
  };
}

/**
 * U3: scope normalize cho 1 layer legacy trong track.clips.
 * - Track chuyên biệt `kind === "adjustment"`: không có host → `undefined`
 *   (mọi track, đúng default chuẩn). Scope = chính track adjustment sẽ
 *   thành no-op (không clip lá nào nằm trên track adjustment) nên KHÔNG
 *   chọn cách đó.
 * - Clip `kind: "adjustment"` nằm trên track media (host): scope =
 *   `[trackIndex]` — chỉ áp clip trên đúng track host đó (lệnh đợt 7).
 */
function legacyLayerScope(
  trackKind: string,
  trackIndex: number,
): number[] | undefined {
  return trackKind === "adjustment" ? undefined : [trackIndex];
}

// ---------------------------------------------------------------------------
// U3: normalize — layer chuẩn + nested chuẩn (duck-typed, fail fast)
// ---------------------------------------------------------------------------

/** So sánh sâu 2 giá trị JSON-ish (object/array/nguyên thủy). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isRecord(a) || isRecord(b)) {
    if (!isRecord(a) || !isRecord(b)) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

/**
 * U3: validate scope `tracks` của 1 layer chuẩn. Trả `undefined` khi
 * field vắng (mọi track); throw khi field có mặt nhưng không phải mảng
 * các chỉ số nguyên >= 0 (fail fast — scope rác không được lặng lẽ
 * thành "không áp" hay "áp mọi"). Chỉ số vượt quá số track thì KHÔNG
 * throw (nó chỉ đơn giản không khớp clip nào — ghi rõ trong LIMITS).
 */
export function validateScopeTracks(v: unknown, label: string): number[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) {
    throw new Error(`${label}: scope tracks phải là một mảng các chỉ số track (nhận được: ${JSON.stringify(v)})`);
  }
  const out: number[] = [];
  for (const t of v) {
    if (typeof t !== "number" || !Number.isInteger(t) || t < 0) {
      throw new Error(`${label}: scope tracks chứa chỉ số không hợp lệ: ${JSON.stringify(t)} (phải là số nguyên >= 0)`);
    }
    out.push(t);
  }
  return out;
}

/**
 * U3: chuyển 1 layer chuẩn (`VideoSpec.adjustmentLayers`, duck-typed)
 * thành cửa sổ adjustment (CHƯA gắn nestedPath — caller gắn sau, vì
 * cùng một layer có thể nằm ở project ngoài hay trong subSpec).
 *
 * - Shape chuẩn: `{ id, start, duration, filters: [{ lut?, color?,
 *   effects? }], tracks? }`. Nhiều entry `filters` được gộp theo thứ
 *   tự mảng: LUT nối thành chuỗi (entry sau nối sau), color cộng dồn
 *   (clamp về sau ở `applyAdjustmentPreview`), effects trùng type thì
 *   entry sau ghi đè entry trước — khớp thứ tự áp của render
 *   (color → LUT → effects trong entry, entry theo mảng, layer theo mảng).
 * - Hình dạng legacy (`filter`/`effects` trực tiếp, không có `filters`)
 *   vẫn chấp nhận để subSpec cũ không vỡ.
 * - Fail fast (throw) khi: id rỗng, start/duration không hợp lệ, scope
 *   rác, `filters` không phải mảng, entry filter không phải object.
 *   Layer rỗng (không có lut/color/effects nào) cũng throw — layer vô
 *   tác dụng không được lặng lẽ trôi qua như "không có gì".
 */
export function convertCanonicalLayer(
  raw: unknown,
  label: string,
): AdjustmentWindow {
  if (!isRecord(raw)) {
    throw new Error(`${label}: adjustment layer phải là một object`);
  }
  const id = raw["id"];
  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`${label}: adjustment layer.id phải là chuỗi khác rỗng`);
  }
  const start = raw["start"];
  const duration = raw["duration"];
  if (!Number.isFinite(start) || (start as number) < 0) {
    throw new Error(`${label}: adjustment layer "${id}".start phải là số >= 0`);
  }
  if (!Number.isFinite(duration) || (duration as number) <= 0) {
    throw new Error(`${label}: adjustment layer "${id}".duration phải là số > 0`);
  }
  const scopeTracks = validateScopeTracks(raw["tracks"], `${label}: adjustment layer "${id}"`);
  const lutChain: string[] = [];
  const colorSum: Record<string, number> = {};
  const mergedEffects: EffectInput[] = [];
  const pushEffects = (list: unknown): void => {
    if (list === undefined) return;
    if (!Array.isArray(list)) {
      throw new Error(`${label}: adjustment layer "${id}".effects phải là một mảng`);
    }
    for (const e of list) {
      if (!isRecord(e) || typeof e["type"] !== "string") {
        throw new Error(`${label}: adjustment layer "${id}" có effect không hợp lệ (thiếu type chuỗi)`);
      }
      const idx = mergedEffects.findIndex((m) => m.type === e["type"]);
      if (idx >= 0) mergedEffects[idx] = e as unknown as EffectInput;
      else mergedEffects.push(e as unknown as EffectInput);
    }
  };
  const filters = raw["filters"];
  if (filters !== undefined) {
    if (!Array.isArray(filters)) {
      throw new Error(`${label}: adjustment layer "${id}".filters phải là một mảng`);
    }
    for (const entry of filters) {
      if (!isRecord(entry)) {
        throw new Error(`${label}: adjustment layer "${id}" có filter entry không phải object`);
      }
      if (typeof entry["lut"] === "string") lutChain.push(entry["lut"] as string);
      else if (entry["lut"] !== undefined) {
        throw new Error(`${label}: adjustment layer "${id}" có filter.lut không phải chuỗi`);
      }
      if (isRecord(entry["color"])) {
        for (const [k, v] of Object.entries(entry["color"] as Record<string, unknown>)) {
          if (typeof v === "number" && Number.isFinite(v)) {
            colorSum[k] = (colorSum[k] ?? 0) + v;
          }
        }
      }
      pushEffects(entry["effects"]);
    }
  } else {
    // Hình dạng legacy: filter đơn + effects trực tiếp.
    if (isRecord(raw["filter"])) {
      const f = raw["filter"] as FilterInput;
      if (typeof f.lut === "string") lutChain.push(f.lut);
      if (isRecord(f.color)) {
        for (const [k, v] of Object.entries(f.color as Record<string, unknown>)) {
          if (typeof v === "number" && Number.isFinite(v)) {
            colorSum[k] = (colorSum[k] ?? 0) + v;
          }
        }
      }
    }
    pushEffects(raw["effects"]);
  }
  if (
    lutChain.length === 0 &&
    Object.keys(colorSum).length === 0 &&
    mergedEffects.length === 0
  ) {
    throw new Error(`${label}: adjustment layer "${id}" rỗng (không có lut/color/effects) — layer vô tác dụng`);
  }
  const filter: FilterInput = {};
  if (lutChain.length > 0) {
    filter.lut = lutChain[lutChain.length - 1];
    filter.lutChain = [...lutChain];
  }
  if (Object.keys(colorSum).length > 0) {
    filter.color = colorSum as ColorAdjustInput;
  }
  return {
    id,
    start: start as number,
    duration: duration as number,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    effects: mergedEffects.length > 0 ? mergedEffects : undefined,
    scopeTracks,
  };
}

/**
 * U3: normalize 1 nested clip về dạng chuẩn duy nhất trước khi flatten.
 *
 * - Chỉ có `tracks` trực tiếp (cũ) → dùng nó làm tracks, `in` cũ làm
 *   điểm vào, không kẹp `trimOut`, không có subSpec layer.
 * - Chỉ có `subSpec` (chuẩn) → tracks = `subSpec.tracks`, layer chuẩn =
 *   `subSpec.adjustmentLayers` (validate từng layer NGAY tại đây để
 *   lỗi nằm đúng chỗ, không đợi tới lúc flatten mới nổ).
 * - Có cả hai: `tracks` phải deep-equal `subSpec.tracks`, ngược lại
 *   throw (mâu thuẫn — không được lặng lẽ chọn một bên). Khi khớp thì
 *   dùng subSpec (kèm layer của nó).
 * - Có `trim`: `trim.in`/`trim.out` phải hữu hạn, out > in; `in` cũ
 *   (nếu có) phải bằng `trim.in`; khi speed hợp lệ (> 0) thì `duration`
 *   phải bằng `(out - in) / speed` (sai số 1e-6) — ngược lại throw.
 *   Không có `trim` thì không kiểm tra duration (cửa sổ cũ chỉ dùng
 *   `in` + `duration` + `speed`, giữ tương thích R3).
 * - Không có cả `tracks` lẫn `subSpec` hợp lệ → throw (nested không
 *   có nội dung gì để phẳng). Lỗi start/duration/speed KHÔNG throw ở
 *   đây — `flattenNested` giữ hành vi cũ là bỏ qua (skipped), vì đó
 *   là lỗi giá trị đơn lẻ, không phải mâu thuẫn giữa 2 field.
 */
export function normalizeNestedClip(raw: unknown): NormalizedNestedInput {
  if (!isRecord(raw) || raw["kind"] !== "nested") {
    throw new Error(`normalizeNestedClip: clip phải là nested clip (kind "nested")`);
  }
  const id = typeof raw["id"] === "string" ? (raw["id"] as string) : "?";
  const label = `nested clip "${id}"`;
  const directTracks = Array.isArray(raw["tracks"]) ? (raw["tracks"] as NestedTrackInput[]) : undefined;
  const subSpec = isRecord(raw["subSpec"]) ? (raw["subSpec"] as Record<string, unknown>) : undefined;
  let tracks: NestedTrackInput[];
  let subSpecLayers: CanonicalLayerInput[] | undefined;
  if (subSpec !== undefined) {
    if (!Array.isArray(subSpec["tracks"])) {
      throw new Error(`${label}: subSpec.tracks phải là một mảng`);
    }
    const subTracks = subSpec["tracks"] as NestedTrackInput[];
    if (directTracks !== undefined && !deepEqual(directTracks, subTracks)) {
      throw new Error(
        `${label}: vừa có tracks trực tiếp vừa có subSpec.tracks nhưng nội dung khác nhau ` +
          `— chỉ giữ một nguồn duy nhất (xóa tracks cũ hoặc sửa subSpec cho khớp)`,
      );
    }
    tracks = subTracks;
    if (subSpec["adjustmentLayers"] !== undefined) {
      if (!Array.isArray(subSpec["adjustmentLayers"])) {
        throw new Error(`${label}: subSpec.adjustmentLayers phải là một mảng`);
      }
      // Validate sớm: lỗi layer nằm đúng chỗ, không đợi tới flatten.
      for (const layer of subSpec["adjustmentLayers"] as unknown[]) {
        convertCanonicalLayer(layer, `${label}.subSpec`);
      }
      subSpecLayers = subSpec["adjustmentLayers"] as CanonicalLayerInput[];
    }
  } else if (directTracks !== undefined) {
    tracks = directTracks;
  } else {
    throw new Error(`${label}: không có tracks trực tiếp cũng không có subSpec — không có nội dung gì để phẳng`);
  }
  const trim = isRecord(raw["trim"]) ? (raw["trim"] as Record<string, unknown>) : undefined;
  let inPoint: number;
  let trimOut: number | undefined;
  if (trim !== undefined) {
    const tin = trim["in"];
    const tout = trim["out"];
    if (!Number.isFinite(tin) || (tin as number) < 0) {
      throw new Error(`${label}: trim.in phải là số >= 0`);
    }
    if (!Number.isFinite(tout) || (tout as number) <= (tin as number)) {
      throw new Error(`${label}: trim.out phải là số > trim.in`);
    }
    if (
      raw["in"] !== undefined &&
      (typeof raw["in"] !== "number" || Math.abs((raw["in"] as number) - (tin as number)) > PREVIEW_EPS)
    ) {
      throw new Error(
        `${label}: trim.in (${tin}) mâu thuẫn với in cũ (${JSON.stringify(raw["in"])}) ` +
          `— chỉ giữ một trong hai, hoặc đặt bằng nhau`,
      );
    }
    inPoint = tin as number;
    trimOut = tout as number;
    const speed = raw["speed"];
    const duration = raw["duration"];
    // G1 (đợt 19): nested mang speedKeyframes thì duration là thời gian
    // OUTPUT, out phải khớp in + ∫curve (sai số 1e-4 như render đợt 18),
    // KHÔNG dùng công thức (out − in) / speed nữa. Curve hằng gộp về
    // tốc độ hằng nên quay lại sai số 1e-6 của đường tốc độ hằng.
    const rampForTrim =
      raw["speedKeyframes"] !== undefined &&
      typeof duration === "number" && Number.isFinite(duration)
        ? resolveNestedRampCurve(raw["speedKeyframes"], duration, label)
        : null;
    if (rampForTrim !== null) {
      // rampForTrim chỉ khác null khi duration là số hữu hạn (xem
      // điều kiện ở trên) nên cast này an toàn.
      const durationNum = duration as number;
      const expected = rampForTrim.isConstant
        ? (tin as number) + durationNum * rampForTrim.constantV
        : (tin as number) + rampForTrim.totalConsumed;
      const tol = rampForTrim.isConstant ? PREVIEW_EPS : 1e-4;
      if (Math.abs((tout as number) - expected) > tol) {
        throw new Error(
          `${label}: trim.out (${tout as number}) không khớp in + ` +
            (rampForTrim.isConstant
              ? `duration × ${rampForTrim.constantV}`
              : `∫speedKeyframes trên duration`) +
            ` = ${expected} — sửa duration hoặc trim cho khớp (ngữ nghĩa render đợt 18 §2)`,
        );
      }
    } else if (
      typeof speed === "number" && Number.isFinite(speed) && speed > 0 &&
      typeof duration === "number" && Number.isFinite(duration)
    ) {
      const expected = ((tout as number) - (tin as number)) / speed;
      if (Math.abs(duration - expected) > PREVIEW_EPS) {
        throw new Error(
          `${label}: duration (${duration}) không khớp (trim.out − trim.in) / speed = ${expected} ` +
            `— sửa duration hoặc trim cho khớp`,
        );
      }
    }

  } else {
    inPoint = typeof raw["in"] === "number" ? (raw["in"] as number) : 0;
  }
  // G1: reverse trên nested có curve (có hay không có trim) bị render
  // từ chối (đợt 18 §5) — fail fast ở đây thay vì phẳng ra preview
  // lệch với render. Curve hằng đã gộp về tốc độ hằng nên reverse vẫn
  // theo luật cũ (không throw ở đây — flatten giữ hành vi cũ).
  if (
    raw["speedKeyframes"] !== undefined && raw["reverse"] === true &&
    typeof raw["duration"] === "number" && Number.isFinite(raw["duration"])
  ) {
    const r = resolveNestedRampCurve(raw["speedKeyframes"], raw["duration"], label);
    if (r !== null && !r.isConstant) {
      throw new Error(
        `${label}: reverse ở clip lồng nhau có speedKeyframes chưa được hỗ trợ (render đợt 18 §5)`,
      );
    }
  }
  return {
    ...(raw as Record<string, unknown>),
    kind: "nested",
    id: id as string,
    start: raw["start"] as number,
    duration: raw["duration"] as number,
    speed: raw["speed"] as number | undefined,
    in: inPoint,
    trimOut,
    tracks,
    subSpecLayers,
  } as NormalizedNestedInput;
}

// ---------------------------------------------------------------------------
// R3: transition qua biên nested + opacity kế thừa (mirror server/render
// src/nested.js — cùng quy tắc, cùng message lõi, để preview khớp render).
//
// Cặp biên là cặp (A, B) kề nhau trên một track mà ít nhất một đầu là
// clip lồng nhau, định nghĩa bởi A.transitionOut và/hoặc B.transitionIn.
// Vì sau khi phẳng hai đầu không còn cùng track nên không xfade được;
// thay vào đó dùng fade opacity (khớp render.js):
// - B là clip lồng nhau: mọi clip lá của B dịch sớm T giây (nội dung giữ
//   nguyên, chỉ phát sớm) và clip lá ở biên (bắt đầu đúng đầu cửa sổ)
//   nhận keyframes opacity 0→effOp trong T giây đầu, phủ lên clip A còn
//   đang phát bên dưới → dissolve thật (renderFrame vẽ mọi clip đang
//   active theo thứ tự track với globalAlpha = opacity).
// - B là clip phẳng: B dịch sớm T giây và clip lá ở biên cuối của A nhận
//   keyframes opacity effOp→0 trong T giây cuối, lộ dần B bên dưới.
// - A lồng nhau, B lồng nhau: chỉ B fade-in (lá của B nằm trên lá của A).
// - Clip phẳng bị dịch mà còn dính cặp khác, clip lồng nhau 2 đầu, clip
//   phẳng đầu trái đã có transition phẳng → throw (gap/pop không sửa
//   được bằng fade — xem render/nested.js).
// - Chỉ type "fade" được nối; type khác → throw. Track không phải video
//   → skipped (cảnh báo) + bỏ qua, khớp render.
// - Preview KHÔNG BAO GIỜ sửa spec gốc (khác render làm việc trên clone):
//   resolver chỉ trả map, caller tự copy clip khi dịch.
// ---------------------------------------------------------------------------

const PREVIEW_EPS = 1e-6;

/** Type transition duy nhất nối được qua biên (khớp render). */
const BOUNDARY_TRANSITION_TYPE = "fade";

/** Thông tin biên của 1 clip lồng nhau (giây, thời gian timeline ngoài). */
export interface NestedBoundaryInfo {
  /** Số giây mọi clip lá của nested này dịch sớm (đầu phải cặp biên). */
  shiftIn: number;
  /** Thời gian fade-in của lá biên (bằng shiftIn khi có cặp biên vào). */
  fadeIn: number;
  /** Thời gian fade-out của lá biên (đầu trái cặp biên ra clip phẳng). */
  fadeOut: number;
}

export interface PreviewBoundaries {
  nestedInfo: Map<object, NestedBoundaryInfo>;
  plainShift: Map<object, number>;
  skipped: string[];
  /**
   * R3 (đợt 20): clip phẳng là đầu trái của cặp biên (đầu phải là
   * nested) — transitionOut của nó đã bị cơ chế biên tiêu thụ (fade-in
   * phía nested + shift), phải strip khỏi lá đã phẳng như render
   * (resolveTrackBoundaries.stripOut). Chỉ cặp biên, không gồm cặp phẳng
   * (cặp phẳng do cặp nội bộ xử lý). Track không phải video → rỗng.
   */
  stripOut: Set<object>;
}

function readTransField(
  clip: Record<string, unknown>,
  key: string,
): { type: string; duration: number } | null {
  const v = clip[key];
  if (!isRecord(v)) return null;
  const type = v["type"];
  const duration = v["duration"];
  if (typeof type !== "string" || type === "none") return null;
  if (!Number.isFinite(duration) || (duration as number) <= PREVIEW_EPS) return null;
  return { type: type as string, duration: duration as number };
}

const ZERO_BOUNDARY: NestedBoundaryInfo = { shiftIn: 0, fadeIn: 0, fadeOut: 0 };

/**
 * Resolve transition qua biên trên MỘT track (mirror render
 * `resolveTrackBoundaries`, không sửa clip). Track không phải video →
 * skipped + map rỗng. Vi phạm trên track video → throw (khớp render).
 */
export function resolvePreviewBoundaries(
  clips: unknown[],
  trackKind: string,
  label: string,
): PreviewBoundaries {
  const nestedInfo = new Map<object, NestedBoundaryInfo>();
  const plainShift = new Map<object, number>();
  const skipped: string[] = [];
  const stripOut = new Set<object>();
  const tw = label;
  const hasWindow = (c: unknown): c is Record<string, unknown> =>
    isRecord(c) &&
    Number.isFinite(c["start"]) &&
    Number.isFinite(c["duration"]) &&
    (c["duration"] as number) > 0;
  if (trackKind !== "video") {
    for (const c of clips) {
      if (!isNestedClip(c) || !hasWindow(c)) continue;
      const own = readTransField(c, "transitionIn") || readTransField(c, "transitionOut");
      const prevHas = clips.some(
        (o) =>
          o !== c &&
          hasWindow(o) &&
          Math.abs((o["start"] as number) + (o["duration"] as number) - (c.start as number)) <= PREVIEW_EPS &&
          readTransField(o, "transitionOut"),
      );
      const nextHas = clips.some(
        (o) =>
          o !== c &&
          hasWindow(o) &&
          Math.abs((o["start"] as number) - ((c.start as number) + (c.duration as number))) <= PREVIEW_EPS &&
          readTransField(o, "transitionIn"),
      );
      if (own || prevHas || nextHas) {
        skipped.push(
          `${tw}: clip lồng nhau "${c.id}" có transition qua biên nhưng ` +
            "track không phải video — bỏ qua transition qua biên (chỉ hỗ trợ track video)",
        );
      }
    }
    return { nestedInfo, plainShift, skipped, stripOut };
  }
  interface Pair {
    from: Record<string, unknown>;
    to: Record<string, unknown>;
    T: number;
  }
  const pairs: Pair[] = [];
  const flatPairs: Pair[] = [];
  for (const b of clips) {
    if (!hasWindow(b) || isAdjustmentLayer(b)) continue;
    const inB = readTransField(b, "transitionIn");
    const prevCands = clips.filter(
      (c) =>
        c !== b &&
        hasWindow(c) &&
        Math.abs((c["start"] as number) + (c["duration"] as number) - (b["start"] as number)) <= PREVIEW_EPS,
    );
    const outPs = prevCands
      .map((c) => readTransField(c as Record<string, unknown>, "transitionOut"))
      .filter((t): t is { type: string; duration: number } => t !== null);
    if (!inB && outPs.length === 0) continue;
    if (prevCands.length > 1) {
      throw new Error(
        `${tw}: nhiều clip kết thúc đúng lúc clip "${b["id"]}" bắt đầu — ` +
          "không xác định được đầu trái của transition (clip chồng lấn nhau)",
      );
    }
    if (prevCands.length === 0) {
      const hasEarlier = clips.some(
        (c) =>
          c !== b &&
          hasWindow(c) &&
          (c["start"] as number) + (c["duration"] as number) < (b["start"] as number) - PREVIEW_EPS,
      );
      if (hasEarlier) {
        throw new Error(
          `${tw}: clip "${b["id"]}" có transition nhưng clip kề trước không kết ` +
            `thúc đúng lúc ${b["start"]}s — transition yêu cầu 2 clip nối tiếp nhau`,
        );
      }
      skipped.push(
        `${tw}: clip "${b["id"]}" có transitionIn nhưng là clip đầu track — transition bị bỏ qua`,
      );
      continue;
    }
    const prev = prevCands[0] as Record<string, unknown>;
    if (isAdjustmentLayer(prev)) continue;
    const outP = outPs[0] ?? null;
    if (!isNestedClip(prev) && !isNestedClip(b)) {
      flatPairs.push({ from: prev, to: b, T: 0 });
      continue; // cặp phẳng — validator + xfade xử lý, không đụng
    }
    if (inB && outP) {
      if (Math.abs(inB.duration - outP.duration) > PREVIEW_EPS) {
        throw new Error(
          `${tw}: transitionOut (${outP.duration}s) của clip "${prev["id"]}" và ` +
            `transitionIn (${inB.duration}s) của clip "${b["id"]}" không khớp nhau ` +
            "— chỉ đặt một trong hai, hoặc đặt bằng nhau",
        );
      }
      if (inB.type !== outP.type) {
        throw new Error(
          `${tw}: transitionOut (${outP.type}) của clip "${prev["id"]}" và ` +
            `transitionIn (${inB.type}) của clip "${b["id"]}" không khớp type ` +
            "— transition qua biên yêu cầu cùng type",
        );
      }
    }
    const eff = inB ?? outP;
    if (!eff || eff.type !== BOUNDARY_TRANSITION_TYPE) {
      throw new Error(
        `${tw}: transition qua biên clip lồng nhau ("${prev["id"]}" → "${b["id"]}") ` +
          `chỉ hỗ trợ type "fade", nhận được: "${eff ? eff.type : "?"}" — dùng "fade" hoặc bỏ transition`,
      );
    }
    const T = eff.duration;
    if (T > (prev["duration"] as number) + PREVIEW_EPS) {
      throw new Error(`${tw}: transition (${T}s) dài hơn clip "${prev["id"]}" (${prev["duration"]}s)`);
    }
    if (T > (b["duration"] as number) + PREVIEW_EPS) {
      throw new Error(`${tw}: transition (${T}s) dài hơn clip "${b["id"]}" (${b["duration"]}s)`);
    }
    pairs.push({ from: prev, to: b, T });
  }
  const asFrom = new Map<object, Pair>();
  for (const p of pairs) asFrom.set(p.from, p);
  for (const p of pairs) {
    const n = p.to;
    if (isNestedClip(n) && asFrom.has(n)) {
      throw new Error(
        `${tw}: clip lồng nhau "${n["id"]}" vừa có transition qua biên ở cả ` +
          "hai đầu (in + out) — chưa hỗ trợ 2 transition qua biên trên cùng một clip lồng nhau",
      );
    }
    if (
      !isNestedClip(n) &&
      (asFrom.has(n) || flatPairs.some((fp) => fp.from === n || fp.to === n))
    ) {
      throw new Error(
        `${tw}: clip "${n["id"]}" bị dịch sớm ${p.T}s bởi transition qua biên ` +
          "nên không giữ được transition khác — chưa hỗ trợ 2 transition liên tiếp qua biên",
      );
    }
  }
  for (const p of pairs) {
    const a = p.from;
    if (isNestedClip(a)) continue;
    const ppCands = clips.filter(
      (c) =>
        c !== a &&
        hasWindow(c) &&
        Math.abs((c["start"] as number) + (c["duration"] as number) - (a["start"] as number)) <= PREVIEW_EPS,
    );
    if (ppCands.length !== 1) continue;
    const pp = ppCands[0] as Record<string, unknown>;
    if (isNestedClip(pp)) continue; // trường hợp này đã chặn ở vòng trên
    if (flatPairs.some((fp) => fp.from === pp && fp.to === a)) {
      throw new Error(
        `${tw}: clip "${a["id"]}" đã có transition phẳng với clip kề trước ` +
          "nên transition qua biên của nó luôn dính đoạn đen cuối (gap của xfade " +
          "phẳng) — bỏ transition phẳng hoặc transition qua biên",
      );
    }
  }
  for (const p of pairs) {
    // R3 (đợt 20): đầu trái phẳng của cặp biên đã bị cơ chế biên tiêu
    // thụ — ghi vào stripOut để flatten strip transitionOut khỏi lá đã
    // phẳng (mirror render: boundary.stripOut). Trước đây preview giữ
    // field này khiến transitionClipVisual vẽ trùng với fade biên.
    if (isNestedClip(p.to) && !isNestedClip(p.from)) {
      stripOut.add(p.from);
    }
    if (!isNestedClip(p.to)) {
      plainShift.set(p.to, p.T);
    } else {
      const cur = nestedInfo.get(p.to) ?? { ...ZERO_BOUNDARY };
      cur.shiftIn = p.T;
      cur.fadeIn = p.T;
      nestedInfo.set(p.to, cur);
    }
    if (isNestedClip(p.from) && !isNestedClip(p.to)) {
      const cur = nestedInfo.get(p.from) ?? { ...ZERO_BOUNDARY };
      cur.fadeOut = p.T;
      nestedInfo.set(p.from, cur);
    }
  }
  return { nestedInfo, plainShift, skipped, stripOut };
}

/**
 * R3: áp opacity kế thừa + fade transition qua biên cho 1 clip lá preview
 * (mirror render `applyNestedLeafVisual`). `copy` là copy của lá (không
 * sửa spec gốc); `animations` được copy sâu khi cần sửa keyframes.
 *
 * @param copy clip lá đã copy (start/duration đã chỉnh theo timeline ngoài,
 *   CHƯA dịch shiftIn — keyframes theo local time nên không ảnh hưởng).
 * @param effMul tích opacity các nested bao ngoài (kể cả nested hiện tại).
 * @param boundary thông tin biên của nested hiện tại.
 * @param preShiftStart vị trí bắt đầu ngoài của lá TRƯỚC khi dịch shiftIn.
 * @param outerPlaceLo vị trí ngoài của đầu cửa sổ nested hiện tại.
 * @param outerPlaceHi vị trí ngoài của cuối cửa sổ nested hiện tại.
 * @param clippedLeft true khi lá bị cửa sổ cắt trái.
 */
export function applyPreviewLeafVisual(
  copy: LeafClipInput,
  effMul: number,
  boundary: NestedBoundaryInfo,
  preShiftStart: number,
  outerPlaceLo: number,
  outerPlaceHi: number,
  clippedLeft: boolean,
): void {
  if (copy.kind === "audio") return; // audio không mang opacity, không fade
  const outerDuration = copy.duration;
  const isFadeIn =
    boundary.fadeIn > PREVIEW_EPS &&
    Math.abs(preShiftStart - outerPlaceLo) <= PREVIEW_EPS;
  const isFadeOut =
    !isFadeIn &&
    boundary.fadeOut > PREVIEW_EPS &&
    Math.abs(preShiftStart + outerDuration - outerPlaceHi) <= PREVIEW_EPS;
  const leafStatic =
    typeof copy.opacity === "number" ? (copy.opacity as number) : 1;
  const effOp = leafStatic * effMul;
  const anims = isRecord(copy.animations) ? (copy.animations as Record<string, unknown>) : null;
  const opKf = anims && isRecord(anims["opacity"])
    ? (anims["opacity"] as Record<string, unknown>)
    : null;
  const hasOpKf = opKf !== null && Array.isArray(opKf["keyframes"]);
  if (isFadeIn || isFadeOut) {
    const T = isFadeIn ? boundary.fadeIn : boundary.fadeOut;
    if (copy.kind !== "video" && copy.kind !== "text") {
      throw new Error(
        `clip lá "${copy.id}" (kind ${copy.kind}) nằm ở biên transition ` +
          "qua biên nhưng preview không áp opacity keyframes cho kind này — " +
          "transition qua biên chỉ hỗ trợ clip lá video/text ở biên",
      );
    }
    if (hasOpKf) {
      throw new Error(
        `clip lá "${copy.id}" vừa có keyframes opacity vừa dính ` +
          "transition qua biên — chưa hỗ trợ gộp fade biên với keyframes opacity sẵn có",
      );
    }
    if (outerDuration < T - PREVIEW_EPS) {
      throw new Error(
        `clip lá "${copy.id}" dài ${outerDuration}s, ngắn hơn transition ` +
          `qua biên ${T}s — transition phải <= độ dài clip lá ở biên`,
      );
    }
    if (readTransField(copy, "transitionIn") || readTransField(copy, "transitionOut")) {
      throw new Error(
        `clip lá "${copy.id}" vừa có transition trong project con vừa ` +
          "dính transition qua biên — chưa hỗ trợ gộp 2 transition trên cùng clip lá",
      );
    }
    if (isFadeIn && clippedLeft) {
      throw new Error(
        `clip lá "${copy.id}" bị cửa sổ clip lồng nhau cắt trái nên ` +
          "không giữ được transition qua biên — dời clip lá về đúng đầu cửa sổ hoặc bỏ transition",
      );
    }
    const keyframes = isFadeIn
      ? [
          { t: 0, v: 0, easing: "linear" },
          { t: T, v: effOp, easing: "linear" },
        ]
      : [
          { t: outerDuration - T, v: effOp, easing: "linear" },
          { t: outerDuration, v: 0, easing: "linear" },
        ];
    copy.animations = {
      ...(anims ?? {}),
      opacity: { keyframes },
    };
    copy.opacity = effOp;
    return;
  }
  if (effMul < 1 - PREVIEW_EPS) {
    if (hasOpKf && opKf) {
      const scaled = (opKf["keyframes"] as unknown[]).map((k) => {
        if (!isRecord(k)) return k;
        const v = k["v"];
        return typeof v === "number" ? { ...k, v: v * effMul } : k;
      });
      copy.animations = {
        ...(anims ?? {}),
        opacity: { ...(opKf as object), keyframes: scaled },
      };
    } else {
      copy.opacity = effOp;
    }
  }
}

// ---------------------------------------------------------------------------
// Làm phẳng nested
// ---------------------------------------------------------------------------

const MAX_NEST_DEPTH = 16;

// ---------------------------------------------------------------------------
// Phase 9 đợt 19 G1 — Preview parity cho nested speedKeyframes.
// Ngữ nghĩa (mirror render đợt 18, docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md):
// duration của nested có curve là thời gian OUTPUT; cửa sổ con là
// [in, in + C) với C = ∫₀ᴰ s(τ) dτ; vị trí con tại thời gian output t là
// u(t) = in + ∫₀ᵗ s; ngược lại τ(w) là nghiệm của ∫₀^τ s = w (chia đôi
// 80 vòng, ngoại suy tuyến tính theo tốc độ biên ngoài [0, C] — chỉ dùng
// cho phát hiện cắt/fade, không dùng cho ánh xạ đoạn khả kiến).
// Curve hằng (mọi keyframe cùng v) gộp CHÍNH XÁC về tốc độ hằng v
// (đẳng thức, kể cả bezier overshoot vì (b.v − a.v) = 0) nên đi đường
// tuyến tính cũ, không đặt cờ ramp.
// ---------------------------------------------------------------------------

/**
 * Ánh xạ thời gian sequence -> thời gian timeline ngoài. Tuyến tính cũ
 * là trường hợp riêng (toOuter(x) = a + b·x); nested ramp dùng τ hợp
 * thành với map của tầng cha nên không biểu diễn được bằng (a, b) nữa.
 * outerDuration LUÔN tính bằng hiệu toOuter (đúng cả khi map cha phi
 * tuyến), không dùng hệ số co/giãn hằng.
 */
interface TimeMap {
  toOuter: (seq: number) => number;
  outerDuration: (s: number, e: number) => number;
}

function linearChildMap(
  map: TimeMap,
  placeLo: number,
  inPoint: number,
  speed: number,
): TimeMap {
  const toOuter = (seq: number): number =>
    map.toOuter(placeLo + (seq - inPoint) / speed);
  return {
    toOuter,
    outerDuration: (s, e) => toOuter(e) - toOuter(s),
  };
}

export interface NestedRampInfo {
  /** Keyframes đã chuẩn hoá (sắp xếp, trùng t thì sau thắng). */
  keyframes: SpeedKeyframe[];
  /** true khi mọi keyframe cùng v — gộp chính xác về tốc độ hằng. */
  isConstant: boolean;
  /** Tốc độ hằng khi isConstant (vô nghĩa khi không hằng). */
  constantV: number;
  /** Tổng nguồn con tiêu thụ: ∫₀ᴰ s(τ) dτ. */
  totalConsumed: number;
  /** Duration OUTPUT của nested (biên trên của τ, có thể > t keyframe cuối). */
  duration: number;
}

/**
 * Validate + chuẩn hoá speedKeyframes của clip lồng nhau, mirror đúng
 * luật validator clip ramp thường mà render đợt 18 dùng
 * (validateNestedRamp): 1–128 keyframe, t ∈ [0, duration], v ∈
 * [0.25, 4], easing hợp lệ, bezier có x1, x2 ∈ [0, 1]. Vắng curve →
 * null. Curve không hợp lệ → throw (fail fast như render).
 */
export function resolveNestedRampCurve(
  curve: unknown,
  duration: number,
  label: string,
): NestedRampInfo | null {
  if (curve === undefined) return null;
  const where = `${label}: speedKeyframes`;
  if (!isRecord(curve) || !Array.isArray(curve["keyframes"])) {
    throw new Error(`${where} phải là object { keyframes: [...] }`);
  }
  const arr = curve["keyframes"] as unknown[];
  if (arr.length === 0) {
    throw new Error(`${where}.keyframes: mảng rỗng — cần ít nhất 1 keyframe`);
  }
  if (arr.length > 128) {
    throw new Error(`${where}.keyframes: quá 128 keyframe`);
  }
  const EASINGS = ["linear", "ease-in", "ease-out", "bezier"];
  for (let i = 0; i < arr.length; i++) {
    const kf = arr[i];
    const w = `${where}.keyframes[${i}]`;
    if (!isRecord(kf)) throw new Error(`${w} phải là object { t, v, easing }`);
    const t = kf["t"];
    const v = kf["v"];
    const easing = kf["easing"];
    if (typeof t !== "number" || !Number.isFinite(t) || t < 0 || t > duration + 1e-6) {
      throw new Error(`${w}.t phải trong [0, ${duration}] (nhận được: ${JSON.stringify(t)})`);
    }
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0.25 || v > 4) {
      throw new Error(`${w}.v phải trong 0.25..4 (nhận được: ${JSON.stringify(v)})`);
    }
    if (typeof easing !== "string" || !EASINGS.includes(easing)) {
      throw new Error(`${w}.easing phải là linear | ease-in | ease-out | bezier (nhận được: ${JSON.stringify(easing)})`);
    }
    if (easing === "bezier") {
      const b = kf["bezier"];
      if (
        !Array.isArray(b) || b.length !== 4 ||
        !b.every((x) => typeof x === "number" && Number.isFinite(x)) ||
        (b[0] as number) < 0 || (b[0] as number) > 1 ||
        (b[2] as number) < 0 || (b[2] as number) > 1
      ) {
        throw new Error(`${w}.bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do`);
      }
    }
  }
  const norm = normalizeSpeedKeyframes(arr as SpeedKeyframe[]);
  const isConstant = norm.every((k) => Math.abs(k.v - norm[0].v) <= 1e-12);
  return {
    keyframes: norm,
    isConstant,
    constantV: norm[0].v,
    totalConsumed: integrateSpeed({ keyframes: norm }, 0, duration),
    duration,
  };
}

/**
 * τ(w): thời gian output (tương đối so với đầu nested) ứng với vị trí
 * con cách đầu cửa sổ w giây. Mirror server/render/src/nested.js
 * mapChildOffset: trong [0, tổng tiêu thụ] thì chia đôi 80 vòng
 * (s ≥ 0.25 nên tích phân đơn điệu ngặt, nghiệm duy nhất); ngoài
 * khoảng thì ngoại suy tuyến tính theo tốc độ biên (chỉ dùng cho
 * phát hiện cắt/fade audio, không dùng cho ánh xạ đoạn khả kiến).
 */
export function nestedRampTauOffset(
  ramp: NestedRampInfo,
  offset: number,
): number {
  const curve: SpeedCurve = { keyframes: ramp.keyframes };
  const total = ramp.totalConsumed;
  if (offset <= 0) return offset / speedAt(curve, 0);
  if (offset >= total) {
    return ramp.duration + (offset - total) / speedAt(curve, ramp.duration);
  }
  let lo = 0;
  let hi = ramp.duration;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (integrateSpeed(curve, 0, mid) < offset) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Map con cho nested ramp: toOuter qua τ hợp thành với map tầng cha. */
function rampChildMap(
  map: TimeMap,
  placeLo: number,
  inPoint: number,
  ramp: NestedRampInfo,
): TimeMap {
  const toOuter = (seq: number): number =>
    map.toOuter(placeLo + nestedRampTauOffset(ramp, seq - inPoint));
  return {
    toOuter,
    outerDuration: (s, e) => toOuter(e) - toOuter(s),
  };
}

/**
 * Lý do lá bị từ chối dưới nested ramp (mirror render đợt 18 §5:
 * hasTimeAttachments + reverse). null = được.
 * T1 (đợt 21): speedKeyframes RIÊNG không còn là lý do từ chối — lá
 * media mang curve riêng dưới ramp nay được hợp hai tầng qua
 * composeTwoLevelCurve (mirror render đợt 20 R1); lá phi-media mang
 * curve vẫn throw ở nhánh lá (không có trục nguồn để hợp).
 * Kiểm tra trên clip GỐC (trước khi applyPreviewLeafVisual gắn thêm
 * opacity keyframes cho fade biên).
 *
 * R3 (đợt 20): CỐ TÌNH giữ fail-fast cho attachment thời gian thay vì
 * nội suy qua τ — xem docs/PHASE9_ROUND20_R3_PREVIEW_RESCALE_LIMITS.md
 * §(c) để đọc phân tích đầy đủ. Tóm tắt: keyframe nội suy
 * (animations/track/volumeKeyframes) mang easing riêng; qua τ phi tuyến,
 * đường cong thật là easing∘τ, không biểu diễn được bằng keyframe đã
 * remap thời gian giữ nguyên easing (schema lá phẳng không có trường
 * time-warp; chỉ resample dày mới xấp xỉ được, không phải nội suy chính
 * xác). Render vẫn từ chối các trường hợp này nên preview chấp nhận sẽ
 * lệch render theo hướng ngược lại — cần quyết định riêng của parent,
 * không lặng lẽ mở trong luồng parity này. Karaoke cũng giữ fail-fast
 * cùng lý do (dù thời điểm từng từ remap được chính xác ở mức từ).
 */
function nestedRampLeafRefusal(raw: Record<string, unknown>): string | null {
  if (raw["reverse"] === true) return "reverse";
  if (
    isRecord(raw["track"]) &&
    Array.isArray(raw["track"]["points"]) &&
    (raw["track"]["points"] as unknown[]).length > 0
  ) {
    return "track";
  }
  if (Array.isArray(raw["karaoke"]) && raw["karaoke"].length > 0) {
    return "karaoke";
  }
  if (raw["volumeKeyframes"] !== undefined) return "volumeKeyframes";
  if (isRecord(raw["animations"])) {
    for (const v of Object.values(raw["animations"] as Record<string, unknown>)) {
      if (
        isRecord(v) &&
        Array.isArray(v["keyframes"]) &&
        (v["keyframes"] as unknown[]).length > 0
      ) {
        return "animations keyframes";
      }
    }
  }
  return null;
}

interface FlattenSink {
  clips: FlatClip[];
  adjustments: RemappedAdjustment[];
  skipped: string[];
}

/**
 * T1 (đợt 21) — Chuỗi hợp curve qua các tầng nested.
 *
 * Placement (start/duration) của lá đã đúng qua childMap hợp thành
 * (τ_o ∘ τ_i, tuyến tính hợp thành) nên chuỗi này CHỈ sửa curve/in/out
 * của lá, không đụng start/duration. Mỗi tầng nested khi đệ quy vào
 * nested con sẽ tạo một wrapper (xem nhánh nested trong flattenNested):
 * wrapper nhận lá đã phẳng ở tầng con + đoạn output của lá đó (tương
 * đối so với đầu nested con), đổi đoạn đó sang thời gian timeline của
 * tầng mình (cộng start đã dịch shiftIn của nested con), rồi:
 * - tầng mình là ramp + lá media có in hữu hạn → hợp curve lá với
 *   curve tầng mình qua composeTwoLevelCurve (mirror render đợt 20 R1;
 *   lá không curve thì curve trong = tốc độ hằng của lá, đúng đường
 *   slice × c của render đợt 18);
 * - tầng mình tốc độ hằng ≠ 1 + lá mang curve → rescale curve qua đổi
 *   biến tuyến tính (mirror render R1 §1c: t' = t/v, v' = v·v; ∫ bảo
 *   toàn nên in/out giữ nguyên);
 * - các trường hợp còn lại (lá phi-media, lá thiếu in, tầng hằng
 *   speed = 1) → giữ nguyên lá, chỉ đổi tọa độ đoạn.
 * Rồi wrapper chuyển tiếp lên wrapper tầng trên (nếu có). Nhờ đó hợp
 * ba tầng trở lên vẫn đúng: mỗi wrapper chỉ hợp một tầng, đúng tính
 * kết hợp của tích phân (render R1 §1d).
 *
 * Đoạn output truyền trong chuỗi LUÔN là đoạn của tầng vừa phẳng xong
 * (tương đối so với đầu nested đó), không phải đoạn trong timeline
 * con của tầng đó — wrapper tự cộng start của nested con để ra đoạn
 * trong timeline của tầng mình. Curve của lá khi tới wrapper LUÔN đã
 * slice/rebase về đầu đoạn khả kiến (nhánh lá của tầng con đảm bảo:
 * slice ramp, hợp hai tầng rồi slice, hoặc slice + rescale hằng),
 * nên composeTwoLevelCurve nhận leafStart = đầu đoạn, leftCut = 0,
 * in' = in của lá (đã là nguồn tại đầu đoạn).
 */

/** Đoạn output (tương đối so với đầu nested chứa lá) trong chuỗi hợp. */
export interface NestedLeafOutSeg {
  lo: number;
  hi: number;
}

/**
 * Callback chuỗi hợp curve (xem ghi chú T1 ở trên): nhận lá đã phẳng ở
 * tầng trong + đoạn output của nó, trả lá đã hợp với tầng ngoài (nếu
 * cần) + đoạn output ở tầng ngoài.
 */
export type LeafPostFn = (
  copy: LeafClipInput,
  outSeg: NestedLeafOutSeg,
) => { copy: LeafClipInput; outSeg: NestedLeafOutSeg };

/**
 * Đổi biến tuyến tính cho curve đã slice theo đoạn: t' = t/v, v' = v·v
 * (mirror render đợt 20 R1 §1c, nhánh ngoài hằng). in/out không đổi
 * (∫ bảo toàn qua đổi biến). v' ngoài [0.25, 4] → throw (mirror
 * render). `curve` phải đã slice/rebase về đầu đoạn (keyframe cuối =
 * độ dài trục); keyframe cuối được đặt lại đúng bằng độ dài trục sau
 * đổi biến để không lệch làm tròn.
 */
function rescaleConstantCurve(
  curve: SpeedCurve,
  vOuter: number,
  label: string,
): SpeedCurve {
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) {
    throw new Error(`${label}: không rescale được curve rỗng qua tốc độ hằng`);
  }
  const axisLen = ks[ks.length - 1].t;
  const scaled = ks.map((k) => ({ ...k, t: k.t / vOuter, v: k.v * vOuter }));
  for (const k of scaled) {
    if (!Number.isFinite(k.v) || k.v < 0.25 - 1e-9 || k.v > 4 + 1e-9) {
      throw new Error(
        `${label}: tốc độ hợp hai tầng = ${k.v} vượt khoảng 0.25..4 ` +
          `(tốc độ trong × tốc độ ngoài hằng ${vOuter}) — render đợt 20 R1 từ chối`,
      );
    }
  }
  scaled[scaled.length - 1].t = axisLen / vOuter;
  return { keyframes: normalizeSpeedKeyframes(scaled) };
}

/**
 * Làm phẳng 1 nested clip ĐÃ NORMALIZE (xem `normalizeNestedClip`).
 * `map` đổi thời gian sequence CHA sang timeline ngoài; [visLo, visHi)
 * là khoảng đang thấy trong sequence cha.
 * `postLeaf` (T1, đợt 21): chuỗi hợp curve tầng ngoài — xem ghi chú T1
 * ở trên. Vắng = nested này là tầng ngoài cùng (không còn tầng nào
 * cần hợp lên nữa).
 */
function flattenNested(
  nested: NormalizedNestedInput,
  map: TimeMap,
  visLo: number,
  visHi: number,
  path: string[],
  sink: FlattenSink,
  /**
   * R4: chuỗi track chứa nested clip này, từ ngoài vào trong:
   * parentStack[0] = track tầng ngoài, parentStack[k] = track trong
   * timeline ở độ sâu k. Clip lá trong nested có trackStack =
   * [...parentStack, trackTrongTimelineNày].
   */
  parentStack: number[],
  /**
   * R3: thông tin biên + opacity kế thừa. opacityMul = tích opacity các
   * nested bao ngoài (CHƯA kể nested hiện tại); shiftIn/fadeIn/fadeOut =
   * cặp biên của chính nested hiện tại trên track cha. Không truyền =
   * nested tầng ngoài không có cặp biên, opacityMul = 1.
   */
  ctx?: {
    opacityMul: number;
    shiftIn: number;
    fadeIn: number;
    fadeOut: number;
  },
  /**
   * T1 (đợt 21): chuỗi hợp curve tầng ngoài (xem ghi chú T1 ở trên).
   * Lá trong nested này sau khi phẳng xong sẽ qua callback này trước
   * khi push vào sink (callback tự chuyển tiếp lên các tầng trên nữa).
   */
  postLeaf?: LeafPostFn,
): void {
  if (path.length >= MAX_NEST_DEPTH) {
    sink.skipped.push(
      `nested "${nested.id}" vượt quá độ sâu ${MAX_NEST_DEPTH}, bỏ qua`,
    );
    return;
  }
  const speed =
    nested.speed === undefined ? 1 : nested.speed;
  // U3: `in` đã được normalize (từ `trim.in` hoặc `in` cũ); `trimOut`
  // (nếu có) kẹp cửa sổ sequence con — clip/layer trong subSpec không
  // được tràn ra ngoài trim.
  const inPoint = nested.in;
  const trimOut = nested.trimOut;
  if (
    !Number.isFinite(nested.start) ||
    !Number.isFinite(nested.duration) ||
    nested.duration <= 0 ||
    !Number.isFinite(speed) ||
    speed <= 0 ||
    !Number.isFinite(inPoint) ||
    inPoint < 0
  ) {
    sink.skipped.push(
      `nested "${nested.id}" có start/duration/in/speed không hợp lệ, bỏ qua`,
    );
    return;
  }
  // G1: resolve ramp của nested này (throw khi curve không hợp lệ, như
  // render). Curve hằng gộp về tốc độ hằng nên effSpeed thay speed;
  // chỉ curve không hằng mới đi đường τ. Speed hằng ngoài [0.25, 4]
  // vẫn bị render từ chối dù bị curve lấn át nên preview bỏ qua
  // (cùng kiểu skipped như speed không hợp lệ ở trên).
  const nestedLabel = `nested "${nested.id}"`;
  const ramp = resolveNestedRampCurve(
    (nested as Record<string, unknown>)["speedKeyframes"],
    nested.duration,
    nestedLabel,
  );
  const isRamp = ramp !== null && !ramp.isConstant;
  if (
    ramp !== null && nested.speed !== undefined &&
    (nested.speed < 0.25 || nested.speed > 4)
  ) {
    sink.skipped.push(
      `${nestedLabel} có speed (${nested.speed}) ngoài 0.25..4 dù mang speedKeyframes, bỏ qua`,
    );
    return;
  }
  if (isRamp && (nested as Record<string, unknown>)["reverse"] === true) {
    throw new Error(
      `${nestedLabel}: reverse ở clip lồng nhau có speedKeyframes chưa được hỗ trợ (render đợt 18 §5)`,
    );
  }
  const effSpeed = ramp !== null && ramp.isConstant ? ramp.constantV : speed;
  // R3: opacity kế thừa — ngoài [0,1] thì throw (khớp render, không lặng
  // lẽ clamp rồi render sai độ mờ).
  const opRaw = (nested as unknown as Record<string, unknown>)["opacity"];
  if (
    opRaw !== undefined &&
    (typeof opRaw !== "number" || !Number.isFinite(opRaw) || opRaw < 0 || opRaw > 1)
  ) {
    throw new Error(
      `nested "${nested.id}": opacity phải là số trong khoảng 0..1, nhận được: ${JSON.stringify(opRaw)}`,
    );
  }
  const boundary = ctx ?? { opacityMul: 1, shiftIn: 0, fadeIn: 0, fadeOut: 0 };
  const effMul =
    boundary.opacityMul * (typeof opRaw === "number" ? opRaw : 1);
  const placeLo = nested.start;
  const placeHi = nested.start + nested.duration;
  // R3 (đợt 20): rescale thời lượng biên + gộp shiftIn vào placement.
  // boundary.shiftIn/fadeIn/fadeOut đang ở thời gian timeline CHA (nơi
  // nested này ngồi); lá sau phẳng sống ở thời gian NGOÀI nên không
  // được dùng trực tiếp chúng như thời gian ngoài (lỗi đợt 19 G1 §3):
  // - fadeIn/fadeOut (thời lượng) đổi sang thời lượng output của đoạn
  //   chồng lấn [X−T, X) qua map của tầng cha: map(X) − map(X−T).
  //   Ramp: đúng τ(X−in) − τ(X−T−in) của spec đợt 18 §4 khi map cha là
  //   identity; tốc độ hằng: rút gọn đúng T/speed; map cha phi tuyến
  //   (ramp tổ tiên): đúng thời lượng output của đoạn đó. Dùng `map`
  //   (không phải childMap) vì X, T đo ở timeline cha.
  // - shiftIn (dịch sớm T giây ở timeline cha) KHÔNG trừ sau ánh xạ
  //   nữa (sai khi map cha co/giãn: trừ T thời gian cha khỏi thời gian
  //   ngoài) mà gộp vào placement: childMap dựng từ placeLo − shiftIn
  //   nên mọi lá (kể cả nested con đệ quy + adjustment) dịch đúng qua
  //   ánh xạ. Map identity ở tầng ngoài → đúng bằng hành vi cũ.
  // Lưu ý: nested có shiftIn thì không có fadeOut (resolvePreviewBoundaries
  // cấm 2 transition qua biên trên cùng clip), nên detection fadeOut ở
  // dưới vẫn đúng khi dùng bounds đã dịch.
  const bShift = boundary.shiftIn;
  const bFadeIn =
    boundary.fadeIn > PREVIEW_EPS
      ? map.toOuter(placeLo) - map.toOuter(placeLo - boundary.fadeIn)
      : 0;
  const bFadeOut =
    boundary.fadeOut > PREVIEW_EPS
      ? map.toOuter(placeHi) - map.toOuter(placeHi - boundary.fadeOut)
      : 0;
  const effBoundary: NestedBoundaryInfo = {
    shiftIn: 0, // đã gộp vào placement, không trừ sau ánh xạ nữa
    fadeIn: bFadeIn,
    fadeOut: bFadeOut,
  };
  const lo = Math.max(placeLo, visLo);
  const hi = Math.min(placeHi, visHi);
  if (hi <= lo) return; // nested nằm ngoài khoảng đang thấy: không có gì để phẳng
  // Khoảng sequence con đang thấy + ánh xạ sequence con -> timeline ngoài.
  // G1: ramp thì cửa sổ con là [in, in + ∫curve) và biên thấy được tính
  // bằng u(t) = in + ∫₀^{t−placeLo} s (không phải (t−placeLo)·speed);
  // trimOut (đã validate khớp in + ∫ ở normalize) kẹp như cũ.
  const rampCurve: SpeedCurve | null =
    isRamp && ramp !== null ? { keyframes: ramp.keyframes } : null;
  const seqLo = rampCurve !== null && ramp !== null
    ? inPoint + integrateSpeed(rampCurve, 0, lo - placeLo)
    : inPoint + (lo - placeLo) * effSpeed;
  const seqHiRaw = rampCurve !== null && ramp !== null
    ? inPoint + integrateSpeed(rampCurve, 0, hi - placeLo)
    : inPoint + (hi - placeLo) * effSpeed;
  const seqHi = Math.min(
    seqHiRaw,
    trimOut ?? Infinity,
    rampCurve !== null && ramp !== null
      ? inPoint + ramp.totalConsumed
      : Infinity,
  );
  const placeLoShifted = placeLo - bShift;
  const childMap: TimeMap =
    rampCurve !== null && ramp !== null
      ? rampChildMap(map, placeLoShifted, inPoint, ramp)
      : linearChildMap(map, placeLoShifted, inPoint, effSpeed);
  const childPath = [...path, nested.id];
  const innerTracks = nested.tracks ?? [];
  for (let iti = 0; iti < innerTracks.length; iti++) {
    const track = innerTracks[iti];
    if (!isRecord(track) || !Array.isArray(track["clips"])) continue;
    const trackKind =
      typeof track["kind"] === "string" ? (track["kind"] as string) : "video";
    // R3: cặp biên trong timeline con (clip lá dịch sớm theo cặp biên nội bộ).
    const innerBoundary = resolvePreviewBoundaries(
      track["clips"] as unknown[],
      trackKind,
      `nested "${nested.id}"`,
    );
    for (const s of innerBoundary.skipped) sink.skipped.push(s);
    // R3 (đợt 20): cặp transition NỘI BỘ giữa 2 lá phẳng trên track con
    // (mirror render đợt 18 §4 — khác cặp qua biên ở innerBoundary:
    // cặp này cả 2 đầu đều là lá, không có nested nào). Cặp nguyên vẹn
    // (kề nhau + cả 2 đầu nằm trọn trong cửa sổ) → viết lại duration
    // sang thời gian output ở vòng lá dưới; cặp bị cửa sổ phá vỡ (một
    // đầu bị cắt, mất hẳn, hoặc không kề nhau) → strip field transition
    // của cặp đó (render hard cut). Chỉ xét lá–lá: nested (cặp qua biên,
    // ctx xử lý) và adjustment layer không tham gia cặp nội bộ này.
    // isLeafClip cũng nhận nested/adjustment (đủ kind/id/start/duration)
    // nên phải loại trừ tường minh.
    interface InnerPairSide {
      T: number;
      X: number;
      intact: boolean;
    }
    const innerPairs = new Map<
      object,
      { inSide?: InnerPairSide; outSide?: InnerPairSide }
    >();
    if (trackKind !== "adjustment") {
      const trackClips = track["clips"] as unknown[];
      for (let ci = 0; ci + 1 < trackClips.length; ci++) {
        const a = trackClips[ci];
        const b = trackClips[ci + 1];
        if (
          !isLeafClip(a) || !isLeafClip(b) ||
          isNestedClip(a) || isNestedClip(b) ||
          isAdjustmentLayer(a) || isAdjustmentLayer(b)
        ) {
          continue;
        }
        const outF = readTransField(a as Record<string, unknown>, "transitionOut");
        const inF = readTransField(b as Record<string, unknown>, "transitionIn");
        if (!outF && !inF) continue;
        // Cặp một phía vẫn là cặp (render: hasPair khi một đầu khai).
        const adjacent =
          Math.abs(b.start - (a.start + a.duration)) <= PREVIEW_EPS;
        const intact =
          adjacent &&
          a.start >= seqLo - PREVIEW_EPS &&
          a.start + a.duration <= seqHi + PREVIEW_EPS &&
          b.start >= seqLo - PREVIEW_EPS &&
          b.start + b.duration <= seqHi + PREVIEW_EPS;
        const X = b.start;
        if (outF) {
          const cur = innerPairs.get(a) ?? {};
          cur.outSide = { T: outF.duration, X, intact };
          innerPairs.set(a, cur);
        }
        if (inF) {
          const cur = innerPairs.get(b) ?? {};
          cur.inSide = { T: inF.duration, X, intact };
          innerPairs.set(b, cur);
        }
      }
    }
    for (const raw of track["clips"] as unknown[]) {
      if (isNestedClip(raw)) {
        if (childPath.includes((raw as { id: string }).id)) {
          sink.skipped.push(
            `nested "${(raw as { id: string }).id}" tạo chu trình (id đã có trong ${childPath.join(" > ")}), bỏ qua`,
          );
          continue;
        }
        // U3: normalize TRƯỚC khi đệ quy — nested con dạng subSpec/trim
        // hay tracks cũ đều về một dạng; mâu thuẫn thì throw (không nuốt).
        const norm = normalizeNestedClip(raw);
        // T1 (đợt 21): hai tầng đều có curve nay ĐƯỢC HỢP qua chuỗi
        // postLeaf (mirror render đợt 20 R1), không còn throw như đợt
        // 18 §5. Placement của lá đã đúng qua childMap hợp thành nên
        // wrapper chỉ hợp curve/in/out (xem ghi chú T1 ở trên). Chuỗi
        // chỉ cần tạo khi tầng này là ramp, hoặc tầng trên đã có
        // wrapper (cần chuyển tiếp), hoặc tầng này tốc độ hằng ≠ 1
        // (cần rescale curve của lá con) — các trường hợp còn lại là
        // đồng nhất, không cần wrapper.
        const innerCtx =
          innerBoundary.nestedInfo.get(raw) ?? { ...ZERO_BOUNDARY };
        const innerShift = innerCtx.shiftIn;
        const needChain = isRamp || postLeaf !== undefined || effSpeed !== 1;
        const childPost: LeafPostFn | undefined = needChain
          ? (copyIn, outSegC) => {
              // Đoạn lá trong timeline của tầng này: nested con chiếm
              // [start − shiftIn, start − shiftIn + duration) với thời
              // gian output của nó đo từ đầu nested con.
              const segLo = norm.start - innerShift + outSegC.lo;
              const segHi = norm.start - innerShift + outSegC.hi;
              let copy = copyIn;
              let outSegP: NestedLeafOutSeg;
              if (isRamp && ramp !== null) {
                const isMedia =
                  (copy.kind === "video" || copy.kind === "audio") &&
                  Number.isFinite(copy.in);
                if (isMedia) {
                  // Lá không curve thì curve trong = tốc độ hằng của
                  // lá (đúng đường slice × c của render đợt 18); lá có
                  // curve thì curve đó đã slice/rebase về đầu đoạn ở
                  // tầng con nên hợp trực tiếp được (leftCut = 0).
                  const innerCurve: SpeedCurve =
                    copy.speedKeyframes !== undefined
                      ? copy.speedKeyframes
                      : {
                          keyframes: [
                            {
                              t: 0,
                              v: typeof copy.speed === "number" ? copy.speed : 1,
                              easing: "linear",
                            },
                          ],
                        };
                  const composed = composeTwoLevelCurve({
                    outerCurve: { keyframes: ramp.keyframes },
                    outerDuration: nested.duration,
                    outerIn: inPoint,
                    innerCurve,
                    leafStart: segLo,
                    leafDuration: segHi - segLo,
                    leafIn: copy.in as number,
                    leafOut: Number.isFinite(copy.out)
                      ? (copy.out as number)
                      : undefined,
                  });
                  const hadOut = Number.isFinite(copy.out);
                  copy = {
                    ...copy,
                    speedKeyframes: composed.speedKeyframes,
                    in: composed.in,
                  };
                  if (hadOut) copy.out = composed.out;
                  else delete copy.out;
                  delete copy.speed;
                  outSegP = {
                    lo: composed.startOffset,
                    hi: composed.startOffset + composed.duration,
                  };
                } else {
                  // Lá phi-media / thiếu in: không có curve để hợp,
                  // chỉ đổi tọa độ đoạn qua τ của tầng này.
                  outSegP = {
                    lo: nestedRampTauOffset(ramp, segLo - inPoint),
                    hi: nestedRampTauOffset(ramp, segHi - inPoint),
                  };
                }
              } else {
                // Tầng tốc độ hằng: rescale curve của lá (nếu có) qua
                // đổi biến tuyến tính (mirror render R1 §1c); lá không
                // curve giữ nguyên (hành vi cũ, không đụng).
                if (
                  effSpeed !== 1 &&
                  (copy.kind === "video" || copy.kind === "audio") &&
                  Number.isFinite(copy.in) &&
                  copy.speedKeyframes !== undefined
                ) {
                  copy = {
                    ...copy,
                    speedKeyframes: rescaleConstantCurve(
                      copy.speedKeyframes,
                      effSpeed,
                      `nested "${nested.id}"`,
                    ),
                  };
                }
                outSegP = {
                  lo: (segLo - inPoint) / effSpeed,
                  hi: (segHi - inPoint) / effSpeed,
                };
              }
              if (postLeaf !== undefined) return postLeaf(copy, outSegP);
              return { copy, outSeg: outSegP };
            }
          : undefined;
        flattenNested(norm, childMap, seqLo, seqHi, childPath, sink, [...parentStack, iti], {
          opacityMul: effMul,
          ...innerCtx,
        }, childPost);
      } else if (trackKind === "adjustment" || isAdjustmentLayer(raw)) {
        // U3: legacy normalize ở entry — scope host track (hoặc không
        // scope nếu là track adjustment chuyên biệt), không còn xét
        // "track sau nằm trên" ở đây hay ở `adjustmentAppliesToClip`.
        const adj = readAdjustment(
          raw as Record<string, unknown>,
          trackKind,
          legacyLayerScope(trackKind, iti),
        );
        if (!adj) {
          sink.skipped.push(`adjustment trong nested "${nested.id}" không hợp lệ, bỏ qua`);
          continue;
        }
        const aLo = Math.max(adj.start, seqLo);
        const aHi = Math.min(adj.start + adj.duration, seqHi);
        if (aHi <= aLo) continue;
        sink.adjustments.push({
          ...adj,
          start: childMap.toOuter(aLo),
          duration: childMap.outerDuration(aLo, aHi),
          nestedPath: childPath,
          trackIndex: iti,
          outerTrackIndex: parentStack[0],
          trackStack: [...parentStack, iti],
        });
      } else if (isLeafClip(raw)) {
        // R3: dịch sớm theo cặp biên NỘI BỘ (thời gian sequence con) rồi
        // mới ánh xạ ra timeline ngoài; dịch shiftIn của nested hiện tại
        // (thời gian timeline ngoài) áp sau khi ánh xạ.
        const innerShift = innerBoundary.plainShift.get(raw) ?? 0;
        const effStart = raw.start - innerShift;
        const cLo = Math.max(effStart, seqLo);
        const cHi = Math.min(effStart + raw.duration, seqHi);
        if (cHi <= cLo) continue;
        // R3 (đợt 20): shiftIn đã gộp vào placement của childMap nên
        // outerStart lấy thẳng từ childMap, không trừ shiftIn sau ánh xạ
        // nữa (trừ sau ánh xạ sai khi map cha co/giãn, kể cả tốc độ hằng).
        const preShiftStart = childMap.toOuter(cLo);
        const outerDuration = childMap.outerDuration(cLo, cHi);
        const outerStart = preShiftStart;
        const copy: LeafClipInput = {
          ...(raw as Record<string, unknown>),
          start: outerStart,
          duration: outerDuration,
        } as LeafClipInput;
        // G1: lá dưới nested ramp — mirror render đợt 18 §3/§5. Lá mang
        // attachment thời gian / reverse thì render fail fast nên
        // preview cũng throw (không phẳng lệch). T1 (đợt 21): lá media
        // mang curve RIÊNG dưới ramp nay được hợp hai tầng qua
        // composeTwoLevelCurve (mirror render đợt 20 R1) thay vì throw;
        // lá phi-media mang curve vẫn throw (không có trục nguồn).
        // Lá media tốc độ hằng c thành clip ramp tổng hợp: curve =
        // slice của curve lồng nhau trên đoạn output của lá, nhân v
        // với c; in' theo thời gian con, out' capped ở out gốc; speed
        // hằng bị xóa (curve đã chứa c). Lá text/image/sticker không
        // có trục nguồn nên chỉ đổi start/duration qua τ là đủ.
        if (isRamp && ramp !== null && rampCurve !== null) {
          const refusal = nestedRampLeafRefusal(raw as Record<string, unknown>);
          if (refusal !== null) {
            throw new Error(
              `clip lá "${raw.id}" (${raw.kind}) dưới clip lồng nhau có ` +
                `speedKeyframes mà mang ${refusal} — hợp thành thời gian ` +
                `phi tuyến chưa được hỗ trợ (render đợt 18 §5), không phẳng lệch`,
            );
          }
          if (raw.speedKeyframes !== undefined) {
            // T1: hợp hai tầng cho lá media mang curve riêng (R1).
            // Render bỏ qua speed của lá khi lá đã có curve (nhánh
            // isRamp + leafHasCurve xóa speed) nên preview cũng xóa
            // speed, chỉ giữ curve hợp. Curve hợp được slice về đúng
            // đoạn khả kiến của lá (đoạn này có thể hẹp hơn cửa sổ
            // của compose do trim/cửa sổ tầng trên), in'/out' lấy từ
            // hàm hợp ĐÚNG (tích phân) chứ không từ curve đã mã hoá.
            if (raw.kind !== "video" && raw.kind !== "audio") {
              throw new Error(
                `clip lá "${raw.id}" (${raw.kind}) dưới clip lồng nhau có ` +
                  `speedKeyframes mà mang speedKeyframes — hợp curve chỉ hỗ trợ ` +
                  `lá video/audio có trục nguồn (render đợt 20 R1)`,
              );
            }
            if (!Number.isFinite(raw.in)) {
              throw new Error(
                `clip lá "${raw.id}" (${raw.kind}) dưới clip lồng nhau có ` +
                  `speedKeyframes mà mang speedKeyframes nhưng thiếu in hữu hạn ` +
                  `— không neo được trục nguồn để hợp (render đợt 20 R1)`,
              );
            }
            const composed = composeTwoLevelCurve({
              outerCurve: { keyframes: ramp.keyframes },
              outerDuration: nested.duration,
              outerIn: inPoint,
              innerCurve: raw.speedKeyframes,
              leafStart: effStart,
              leafDuration: raw.duration,
              leafIn: raw.in as number,
              leafOut: Number.isFinite(raw.out)
                ? (raw.out as number)
                : undefined,
            });
            const segLo =
              nestedRampTauOffset(ramp, cLo - inPoint) - composed.startOffset;
            const segHi =
              nestedRampTauOffset(ramp, cHi - inPoint) - composed.startOffset;
            const loClamped = Math.max(0, segLo);
            const hiClamped = Math.min(composed.duration, segHi);
            const slicedTwo = sliceSpeedKeyframes(
              composed.speedKeyframes.keyframes,
              loClamped,
              hiClamped,
            ).keyframes;
            if (slicedTwo.length === 0) {
              throw new Error(
                `clip lá "${raw.id}" dưới clip lồng nhau có speedKeyframes: ` +
                  `không slice được curve hợp hai tầng cho đoạn khả kiến của lá ` +
                  `— đoạn suy biến, không đoán`,
              );
            }
            copy.speedKeyframes = { keyframes: slicedTwo };
            delete copy.speed;
            copy.in = composed.sourceAt(loClamped);
            if (Number.isFinite(raw.out)) {
              copy.out = Math.min(
                raw.out as number,
                composed.sourceAt(hiClamped),
              );
            }
          } else if (
            (raw.kind === "video" || raw.kind === "audio") &&
            Number.isFinite(raw.in)
          ) {
            const c = raw.speed ?? 1;
            const leafOutLo = nestedRampTauOffset(ramp, cLo - inPoint);
            const leafOutHi = nestedRampTauOffset(ramp, cHi - inPoint);
            const sliced = sliceSpeedKeyframes(
              ramp.keyframes,
              leafOutLo,
              leafOutHi,
            ).keyframes;
            if (sliced.length === 0) {
              throw new Error(
                `clip lá "${raw.id}" dưới clip lồng nhau có speedKeyframes: ` +
                  `không slice được curve cho đoạn output của lá — đoạn suy biến, không đoán`,
              );
            }
            const scaled = sliced.map((k) => ({ ...k, v: k.v * c }));
            for (const k of scaled) {
              if (k.v < 0.25 - 1e-9 || k.v > 4 + 1e-9) {
                throw new Error(
                  `clip lá "${raw.id}": tốc độ lá (${c}) × curve lồng nhau ` +
                    `vượt khoảng 0.25..4 (keyframe v = ${k.v}) — render đợt 18 §5 từ chối`,
                );
              }
            }
            copy.speedKeyframes = { keyframes: scaled };
            delete copy.speed;
            copy.in = (raw.in as number) + (cLo - effStart) * c;
            if (Number.isFinite(raw.out)) {
              copy.out = Math.min(
                (raw.out as number),
                copy.in + (cHi - cLo) * c,
              );
            }
          }
        } else if (
          (raw.kind === "video" || raw.kind === "audio") &&
          Number.isFinite(raw.in)
        ) {
          if (raw.speedKeyframes !== undefined) {
            // T1: lá media mang curve dưới nested TỐC ĐỘ HẰNG → hợp
            // đúng hệt bằng slice curve trong rồi đổi biến tuyến tính
            // (mirror render đợt 20 R1 §1c: t' = t/v_o, v' = v·v_o;
            // speed của lá bị bỏ như nhánh tương ứng của render).
            // Trước đợt này nhánh này giữ nguyên curve gốc (trục thời
            // gian con, sai khi tốc độ hằng ≠ 1 hoặc lá bị cắt) — nay
            // sửa theo render; nhánh lá KHÔNG curve bên dưới giữ nguyên
            // hành vi cũ, không đụng.
            const leafRamp = resolveNestedRampCurve(
              raw.speedKeyframes,
              raw.duration,
              `clip lá "${raw.id}"`,
            );
            if (leafRamp === null) {
              throw new Error(
                `clip lá "${raw.id}": không resolve được speedKeyframes riêng ` +
                  `dưới clip lồng nhau tốc độ hằng — không đoán`,
              );
            }
            const cut = cLo - effStart;
            const seg = cHi - cLo;
            const slicedLeaf = sliceSpeedKeyframes(
              leafRamp.keyframes,
              cut,
              cut + seg,
            ).keyframes;
            if (slicedLeaf.length === 0) {
              throw new Error(
                `clip lá "${raw.id}" dưới clip lồng nhau tốc độ hằng: ` +
                  `không slice được curve riêng cho đoạn khả kiến — đoạn suy biến, không đoán`,
              );
            }
            copy.speedKeyframes = rescaleConstantCurve(
              { keyframes: slicedLeaf },
              effSpeed,
              `clip lá "${raw.id}"`,
            );
            delete copy.speed;
            const leafCurve: SpeedCurve = { keyframes: leafRamp.keyframes };
            copy.in = (raw.in as number) + integrateSpeed(leafCurve, 0, cut);
            if (Number.isFinite(raw.out)) {
              copy.out = Math.min(
                raw.out as number,
                (raw.in as number) + integrateSpeed(leafCurve, 0, cut + seg),
              );
            }
          } else {
            // Cắt mép trái: dời `in` theo thời gian nguồn đã cắt (video/audio).
            const trimmed = (cLo - effStart) * (raw.speed ?? 1);
            copy.in = (raw.in as number) + trimmed;
            if (Number.isFinite(raw.out)) {
              copy.out = copy.in + outerDuration * (raw.speed ?? 1);
            }
          }
        }
        // R3 (đợt 20): phía lá phẳng của cặp biên đã bị cơ chế biên tiêu
        // thụ (mirror render: boundary.stripOut + plainShift) — strip
        // field transition của cặp đó khỏi lá đã phẳng, không giữ duration
        // thời gian con gây vẽ trùng với fade biên. Hai phía này rời nhau
        // với cặp nội bộ dưới đây (phía cặp biên kề nested, phía cặp nội
        // bộ kề lá) nên không xung đột: strip trước, cặp nội bộ xét sau.
        if (innerBoundary.stripOut.has(raw)) {
          delete copy.transitionOut;
        }
        if (innerShift > 0) {
          delete copy.transitionIn;
        }
        // R3 (đợt 20): transition nội bộ cặp phẳng (mirror render §4).
        // Cặp nguyên vẹn → viết lại duration sang thời gian output:
        // T' = childMap(X) − childMap(X−T) với X = biên con (đầu clip B),
        // mỗi phía tính theo duration của chính nó (lệch cặp vẫn lộ ra
        // ở validator phẳng, không giấu). Cặp bị cửa sổ phá vỡ → strip
        // field transition của cặp đó (render hard cut). Clone field
        // trước khi sửa duration vì copy spread giữ nguyên tham chiếu
        // object con (preview không được sửa spec gốc). Chạy TRƯỚC
        // applyPreviewLeafVisual để lá còn transition sau strip mới tính
        // là dính transition trong (cặp đã vỡ thì fade biên được).
        const pair = innerPairs.get(raw);
        if (pair?.inSide !== undefined) {
          if (pair.inSide.intact) {
            if (readTransField(copy, "transitionIn")) {
              copy.transitionIn = {
                ...(copy.transitionIn as Record<string, unknown>),
                duration:
                  childMap.toOuter(pair.inSide.X) -
                  childMap.toOuter(pair.inSide.X - pair.inSide.T),
              } as BoundaryTransitionField;
            }
          } else {
            delete copy.transitionIn;
          }
        }
        if (pair?.outSide !== undefined) {
          if (pair.outSide.intact) {
            if (readTransField(copy, "transitionOut")) {
              copy.transitionOut = {
                ...(copy.transitionOut as Record<string, unknown>),
                duration:
                  childMap.toOuter(pair.outSide.X) -
                  childMap.toOuter(pair.outSide.X - pair.outSide.T),
              } as BoundaryTransitionField;
            }
          } else {
            delete copy.transitionOut;
          }
        }
        // R3 (đợt 20): fade audio rút ngắn theo phần cắt đo bằng thời
        // gian output (mirror render đợt 18 §4): fadeIn' = max(0, fadeIn
        // − cắtTráiOuter), cắtTráiOuter = childMap(cLo) − childMap(effStart)
        // (ramp: τ, ngoại suy tuyến tính khi s < in; tốc độ hằng: rút gọn
        // đúng leftCut/speed cũ). Giữ nguyên fadeCurve (chỉ đổi duration).
        // Đường này chạy cho cả ramp lẫn tốc độ hằng vì preview trước đây
        // không rescale fade ở đường nào (lá bị cửa sổ cắt vẫn giữ fade
        // đủ — sai cả 2 đường, không phải hồi quy của đợt này).
        if (raw.kind === "audio") {
          const leftOut = childMap.toOuter(cLo) - childMap.toOuter(effStart);
          const rightOut =
            childMap.toOuter(effStart + raw.duration) - childMap.toOuter(cHi);
          const fIn = (copy as Record<string, unknown>)["fadeIn"];
          if (typeof fIn === "number" && Number.isFinite(fIn) && fIn > 0) {
            copy.fadeIn = Math.max(0, fIn - leftOut);
          }
          const fOut = (copy as Record<string, unknown>)["fadeOut"];
          if (typeof fOut === "number" && Number.isFinite(fOut) && fOut > 0) {
            copy.fadeOut = Math.max(0, fOut - rightOut);
          }
        }
        // R3: opacity kế thừa + fade biên (mirror render). Vị trí biên
        // quy về timeline ngoài qua map của tầng cha (top-level map là
        // identity nên bằng đúng placeLo/placeHi). Shift đã gộp vào
        // placement nên start/bounds truyền vào đây đều đã dịch nhất
        // quán: phép so sánh biên (lá ở đầu/cuối cửa sổ) vẫn đúng.
        // fadeIn/fadeOut đã rescale sang thời gian output ở đầu hàm.
        applyPreviewLeafVisual(
          copy,
          effMul,
          effBoundary,
          preShiftStart,
          map.toOuter(placeLo - bShift),
          map.toOuter(placeHi - bShift),
          effStart < seqLo - PREVIEW_EPS,
        );
        // T1: chuỗi hợp tầng ngoài (nếu nested này nằm dưới nested
        // khác). Đoạn output của lá ở tầng này: ramp thì qua τ, hằng
        // thì chia cho tốc độ — cùng ánh xạ childMap đã dùng cho
        // placement nên đoạn này khớp đúng với outerStart/Duration.
        // Wrapper chỉ sửa curve/in/out của lá, không đụng placement.
        let finalClip = copy;
        if (postLeaf !== undefined) {
          const outSeg: NestedLeafOutSeg =
            isRamp && ramp !== null && rampCurve !== null
              ? {
                  lo: nestedRampTauOffset(ramp, cLo - inPoint),
                  hi: nestedRampTauOffset(ramp, cHi - inPoint),
                }
              : {
                  lo: (cLo - inPoint) / effSpeed,
                  hi: (cHi - inPoint) / effSpeed,
                };
          finalClip = postLeaf(copy, outSeg).copy;
        }
        sink.clips.push({
          clip: finalClip,
          trackKind: KNOWN_TRACK_KINDS.has(raw.kind)
            ? raw.kind
            : trackKind,
          nestedPath: childPath,
          sourceId: raw.id,
          outerStart,
          outerDuration,
          trackIndex: iti,
          outerTrackIndex: parentStack[0],
          trackStack: [...parentStack, iti],
        });
      } else {
        sink.skipped.push(
          `clip trong nested "${nested.id}" không nhận dạng được, bỏ qua`,
        );
      }
    }
  }
  // U3: layer chuẩn trong subSpec — KHÔNG được bỏ qua lặng lẽ như trước
  // (render cũ: "Flatten chỉ lấy tracks, adjustmentLayers bị bỏ qua").
  // Quy cửa sổ từ thời gian subSpec sang timeline ngoài qua childMap,
  // kẹp vào khoảng sequence đang thấy [seqLo, seqHi) (đã gồm trim):
  // layer ngoài cửa sổ thấy thì không có gì để áp, không ghi skipped
  // (giống nested nằm ngoài cửa sổ). Scope của layer là track trong
  // subSpec này; nestedPath = childPath nên `adjustmentAppliesToClip`
  // xét đúng tầng (level = childPath.length → trackStack[level] là
  // track trong subSpec). Thứ tự: layer legacy trong tracks (đã push
  // ở vòng trên) đứng trước layer chuẩn — trong từng nguồn, thứ tự
  // mảng/track được giữ nguyên (xem LIMITS).
  if (nested.subSpecLayers) {
    for (const layer of nested.subSpecLayers) {
      const win = convertCanonicalLayer(layer, `nested "${nested.id}".subSpec`);
      const aLo = Math.max(win.start, seqLo);
      const aHi = Math.min(win.start + win.duration, seqHi);
      if (aHi <= aLo) continue;
      sink.adjustments.push({
        ...win,
        start: childMap.toOuter(aLo),
        duration: childMap.outerDuration(aLo, aHi),
        nestedPath: childPath,
        outerTrackIndex: parentStack[0],
      });
    }
  }
}

/**
 * Làm phẳng toàn bộ spec: nested -> clip lá + adjustment quy về timeline ngoài.
 * Clip tầng ngoài giữ nguyên object (không copy); clip trong nested là copy
 * đã chỉnh start/duration/in. Clip nested/adjustment không còn trong kết quả.
 */
export function flattenForPreview(input: FlattenSpecInput): FlattenResult {
  const sink: FlattenSink = { clips: [], adjustments: [], skipped: [] };
  const plainShifts = new Map<unknown, number>();
  const identity: TimeMap = {
    toOuter: (x) => x,
    outerDuration: (s, e) => e - s,
  };
  const outerTracks = input.tracks ?? [];
  for (let ti = 0; ti < outerTracks.length; ti++) {
    const track = outerTracks[ti];
    if (!isRecord(track) || !Array.isArray(track["clips"])) continue;
    const trackKind =
      typeof track["kind"] === "string" ? (track["kind"] as string) : "video";
    // R3: cặp biên trên track ngoài.
    const outerBoundary = resolvePreviewBoundaries(
      track["clips"] as unknown[],
      trackKind,
      `track "${typeof track["id"] === "string" ? track["id"] : ti}"`,
    );
    for (const s of outerBoundary.skipped) sink.skipped.push(s);
    for (const [clip, shift] of outerBoundary.plainShift) plainShifts.set(clip, shift);
    for (const raw of track["clips"] as unknown[]) {
      if (isNestedClip(raw)) {
        // U3: normalize trước khi flatten (subSpec/trim hay tracks cũ).
        const norm = normalizeNestedClip(raw);
        flattenNested(norm, identity, -Infinity, Infinity, [], sink, [ti], {
          opacityMul: 1,
          ...(outerBoundary.nestedInfo.get(raw) ?? { ...ZERO_BOUNDARY }),
        });
      } else if (trackKind === "adjustment" || isAdjustmentLayer(raw)) {
        // U3: legacy normalize ở entry (scope host track / không scope).
        const adj = readAdjustment(
          raw as Record<string, unknown>,
          trackKind,
          legacyLayerScope(trackKind, ti),
        );
        if (adj) {
          sink.adjustments.push({
            ...adj,
            nestedPath: [],
            trackIndex: ti,
            outerTrackIndex: ti,
            trackStack: [ti],
          });
        } else {
          sink.skipped.push(`adjustment tầng ngoài không hợp lệ, bỏ qua`);
        }
      } else if (isLeafClip(raw)) {
        // R3: clip phẳng tầng ngoài bị dịch sớm bởi cặp biên — copy rồi
        // mới đưa vào kết quả (không sửa spec gốc).
        const shift = outerBoundary.plainShift.get(raw) ?? 0;
        const clip: LeafClipInput =
          shift > 0 ? { ...raw, start: raw.start - shift } : raw;
        sink.clips.push({
          clip,
          trackKind: KNOWN_TRACK_KINDS.has(raw.kind) ? raw.kind : trackKind,
          nestedPath: [],
          sourceId: raw.id,
          outerStart: clip.start,
          outerDuration: clip.duration,
          trackIndex: ti,
          outerTrackIndex: ti,
          trackStack: [ti],
        });
      } else {
        sink.skipped.push(`clip tầng ngoài không nhận dạng được, bỏ qua`);
      }
    }
  }
  // U3: layer chuẩn cấp project — trước đây preview BỎ QUA hoàn toàn
  // field này (chỉ đọc layer trong tracks). Layer chuẩn đã nằm trên
  // timeline ngoài nên không cần quy thời gian; scope `tracks` của nó
  // xét theo track tầng ngoài (clip trong nested: trackStack[0]).
  // Thứ tự: layer legacy trong tracks (đã push ở vòng trên) đứng trước
  // layer chuẩn — trong từng nguồn, thứ tự mảng được giữ nguyên và
  // chính thứ tự đó là thứ tự áp (khớp render).
  if (input.adjustmentLayers !== undefined) {
    if (!Array.isArray(input.adjustmentLayers)) {
      throw new Error(`flattenForPreview: spec.adjustmentLayers phải là một mảng (nếu có)`);
    }
    for (const layer of input.adjustmentLayers) {
      const win = convertCanonicalLayer(layer, `spec`);
      sink.adjustments.push({
        ...win,
        nestedPath: [],
      });
    }
  }
  return { ...sink, plainShifts };
}

/** true khi spec chứa nested clip hoặc adjustment layer (quét tầng ngoài). */
export function hasNestedOrAdjustment(input: FlattenSpecInput): boolean {
  // U3: layer chuẩn cấp project cũng kích hoạt đường preview đã phẳng —
  // trước đây chỉ quét tracks nên spec chỉ có adjustmentLayers bị trả
  // nguyên object cũ (layer không áp gì cả).
  if (Array.isArray(input.adjustmentLayers) && input.adjustmentLayers.length > 0) return true;
  for (const track of input.tracks ?? []) {
    if (!isRecord(track) || !Array.isArray(track["clips"])) continue;
    if (track["kind"] === "adjustment") return true;
    for (const raw of track["clips"] as unknown[]) {
      if (isNestedClip(raw) || isAdjustmentLayer(raw)) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Adjustment filter tại 1 thời điểm
// ---------------------------------------------------------------------------

/**
 * P3 (Phase 9 đợt 11): effect preview vẽ thật bằng effectCanvas.
 *
 * Xác minh đường vẽ (xem PHASE9_ROUND11_P3_ADJUST_SYNC_LIMITS.md §1):
 * adjustment layer KHÔNG có đường vẽ riêng — `buildPreviewSpec` gộp
 * effect của layer vào `clip.effects` (qua `splitClipByAdjustments`),
 * rồi `preview.tsx` vẽ clip video đó qua `drawVideoClip` →
 * `canvasEffectOps(clip.effects, localT)` → `effectCanvasSource` →
 * `applyCanvasEffects` (effectCanvas.ts), sau chroma/LUT, trước
 * mask/SR/opacity. Clip video tầng ngoài và clip video đã phẳng từ
 * nested (`__nested-video`) đều đi qua cùng đường này, vì
 * `renderFrame` duyệt mọi track kind "video" trên spec đã phẳng.
 * Phạm vi này KHỚP render: render chỉ áp adjustment cho clip video
 * (nhánh video của render.js nối adjChain; image không có adjChain,
 * cũng không có LUT/effects — xem image.js), nên image/text/sticker
 * không cần nối qua effectCanvas.
 *
 * Vì vậy 8 type dưới đây KHÔNG còn là "skipped" nữa — chúng được vẽ
 * thật (chỉ xấp xỉ render: xem EFFECT_CANVAS_LIMITS.md — pixelate
 * lệch điểm lấy mẫu, sharpen kernel khác, noise/glitch dùng seed).
 * Badge UI đã đồng bộ từ đợt 10 (previewStatus.ts: 8 type này là
 * "approx", không phải "none").
 */
export const PREVIEW_CANVAS_EFFECTS = new Set([
  "sharpen",
  "noise",
  "glitch",
  "rgb-shift",
  "shake",
  "pixelate",
  "mirror",
  "edgedetect",
]);

/**
 * Effect chuẩn của video-spec mà preview KHÔNG vẽ được.
 *
 * P3 (đợt 11): tập này hiện RỖNG — mọi type chuẩn đều có đường vẽ
 * (CSS trong `effectsVisual` hoặc canvas ở trên). Export được giữ lại
 * làm điểm mở rộng: type chuẩn nào thật sự chưa có đường vẽ trong
 * tương lai thì thêm vào đây (và `applyAdjustmentPreview` sẽ báo skip
 * nó ngay cả khi nó không nằm trong 2 tập vẽ được). Type LẠ (không
 * thuộc spec, không nằm trong 2 tập vẽ được) vẫn bị báo skip qua
 * nhánh động trong `applyAdjustmentPreview`, không cần liệt kê tĩnh.
 */
export const PREVIEW_SKIPPED_EFFECTS = new Set<string>([]);

/** Effect preview vẽ được (CSS filter hoặc vẽ riêng: vignette, old-film). */
export const PREVIEW_SUPPORTED_EFFECTS = new Set([
  "blur",
  "grayscale",
  "sepia",
  "vignette",
  "brightness",
  "invert",
  "hue-rotate",
  "old-film",
]);

/**
 * Lý do từng effect bị preview bỏ qua (trung thực, không bịa hỗ trợ).
 * P3 (đợt 11): bảng này hiện RỖNG theo cùng lý do như trên — 8 lý do
 * cũ của đợt R4 (không có CSS filter tương đương…) đã SAI từ khi đợt
 * 10 nối effectCanvas, và đã bị xóa thay vì giữ lại gây hiểu lầm.
 * Type lạ chưa biết dùng lý do fallback trong `skippedEffectReason`.
 * Bảng này là nguồn duy nhất cho `skippedReasons` — LIMITS chỉ trích
 * lại, không tự bịa thêm.
 */
export const SKIPPED_EFFECT_REASONS: Record<string, string> = {};

/** Lý do bỏ qua cho 1 effect type (type lạ → lý do "chưa biết"). */
export function skippedEffectReason(type: string): string {
  return (
    SKIPPED_EFFECT_REASONS[type] ??
    "type chưa biết, không có đường vẽ trong preview"
  );
}

/**
 * R4: scope vị trí của 1 clip lá (đủ để xét layer ở bất kỳ tầng nào).
 * `trackStack` và `nestedPath` phải tương ứng: trackStack[0] = track tầng
 * ngoài, trackStack[k] = track trong timeline ở độ sâu k (timeline chứa
 * nestedPath[k-1]); clip trực tiếp trong timeline độ sâu d có
 * trackStack.length = d + 1.
 */
export interface ClipScope {
  nestedPath: string[];
  trackStack: number[];
}

/**
 * U3: true khi adjustment layer áp lên clip theo ngữ nghĩa CHUẨN
 * (thay quy tắc "track sau nằm trên" của R4 — quy tắc đó đã bị xóa).
 *
 * - Layer và clip phải nằm trong cùng một timeline ở độ sâu của layer:
 *   clip.nestedPath bắt đầu đúng bằng layer.nestedPath (clip tầng ngoài
 *   với layer tầng ngoài thì prefix rỗng luôn khớp; clip trong nested
 *   với layer tầng ngoài thì prefix rỗng cũng khớp — layer ngoài áp
 *   vào cả lá trong nested; clip trong nested con với layer trong
 *   nested ngoài thì prefix = nestedPath của layer).
 * - Scope: với level = độ sâu của layer (= adjPath.length), track chứa
 *   clip trong timeline đó là clip.trackStack[level] — layer cấp project
 *   (level 0) xét track tầng ngoài, layer trong subSpec xét track trong
 *   subSpec đó. Layer áp khi track đó thuộc `scopeTracks` của layer;
 *   `scopeTracks` vắng = mọi track (default chuẩn).
 * - `trackIndex`/`outerTrackIndex`/`trackStack` trên layer (provenance
 *   R4) KHÔNG được đọc ở đây nữa: window đã normalize luôn mang
 *   `scopeTracks` (hoặc `undefined` = mọi track), nên không còn trường
 *   hợp "thiếu thông tin track" nào cần fallback thứ tự cũ.
 * - Scope rác (không phải mảng số nguyên >= 0) → throw (fail fast):
 *   hàm này chỉ nhận window đã normalize; scope rác là lỗi dữ liệu,
 *   không được lặng lẽ thành "không áp".
 */
export function adjustmentAppliesToClip(
  adj: {
    nestedPath?: string[];
    scopeTracks?: number[];
    trackIndex?: number;
    outerTrackIndex?: number;
    trackStack?: number[];
  },
  clip: ClipScope,
): boolean {
  // nestedPath thiếu (AdjustmentWindow thô, chưa qua flatten) = tầng ngoài.
  const adjPath = adj.nestedPath ?? [];
  const level = adjPath.length;
  if (clip.nestedPath.length < level) return false;
  for (let i = 0; i < level; i++) {
    if (clip.nestedPath[i] !== adjPath[i]) return false;
  }
  if (clip.trackStack.length <= level) return false;
  const scope = adj.scopeTracks;
  if (scope === undefined) return true; // không scope = mọi track
  if (!Array.isArray(scope)) {
    throw new Error(
      `adjustmentAppliesToClip: scopeTracks phải là một mảng các chỉ số track`,
    );
  }
  for (const t of scope) {
    if (typeof t !== "number" || !Number.isInteger(t) || t < 0) {
      throw new Error(
        `adjustmentAppliesToClip: scopeTracks chứa chỉ số không hợp lệ: ${JSON.stringify(t)}`,
      );
    }
  }
  return scope.includes(clip.trackStack[level]);
}

const COLOR_PARAMS: Array<keyof ColorAdjustInput> = [
  "brightness",
  "contrast",
  "saturation",
  "temperature",
  "tint",
  "highlights",
  "shadows",
];

export interface AdjustmentPreviewFilter {
  /**
   * LUT hiệu dụng (đơn, để tương thích code cũ/badge): phần tử CUỐI của
   * `lutChain` — LUT của layer áp sau cùng, không có layer LUT thì LUT gốc
   * của clip, không có nữa thì null. KHÔNG còn mang nghĩa "thắng, bỏ dưới":
   * toàn bộ chuỗi nằm trong `lutChain` và đường vẽ áp lần lượt.
   */
  lut: string | null;
  /**
   * U3: chuỗi LUT đầy đủ theo thứ tự áp: [LUT gốc của clip (nếu có),
   * LUT các layer đang áp theo đúng thứ tự mảng]. Rỗng = không có LUT nào.
   * Đường vẽ preview áp lần lượt chuỗi này (WebGL từng LUT; fallback
   * CSS nối chuỗi xấp xỉ) — không bỏ LUT dưới.
   */
  lutChain: string[];
  /** Color hiệu dụng: tổng clip + layer (clamp [-100, 100], bỏ param 0); null = không chỉnh. */
  color: ColorAdjustInput | null;
  /** Effects hiệu dụng: clip + layer gộp, trùng type thì layer thắng. */
  effects: EffectInput[];
  /** Effect trong `effects` mà preview không vẽ được (ghi chú, không giả vờ). */
  skippedEffects: string[];
  /** Lý do bỏ qua cho từng type trong `skippedEffects` (cùng thứ tự). */
  skippedReasons: string[];
  /** id các layer đang áp tại thời điểm đó (theo thứ tự track dưới -> trên). */
  activeLayerIds: string[];
  /** true khi có ít nhất 1 layer đang áp tại thời điểm đó. */
  adjustmentActive: boolean;
}

/**
 * Filter mô tả áp lên `clip` tại thời điểm `time` (giây, timeline ngoài).
 *
 * Lọc layer theo 2 điều kiện: (a) thời gian: start <= time < start +
 * duration; (b) scope — CHỈ khi caller truyền `clipScope` (U3):
 * layer phải thỏa `adjustmentAppliesToClip` (cùng timeline + track
 * thuộc scope). Không truyền scope thì giữ hành vi cũ (mọi layer chồng
 * thời gian đều áp) để tương thích ngược; `buildPreviewSpec` luôn
 * truyền scope nên preview thật đã đúng scope.
 *
 * Thứ tự layer trong mảng LÀ thứ tự áp (đúng thứ tự `flattenForPreview`
 * trả về, khớp render): LUT nối theo đúng thứ tự đó (kể cả nhiều LUT
 * trong một layer chuẩn — xem `filter.lutChain`), effect trùng type thì
 * layer sau ghi đè layer trước.
 */
export function applyAdjustmentPreview(
  clip: { filter?: FilterInput; effects?: EffectInput[] },
  layers: AdjustmentWindow[],
  time: number,
  clipScope?: ClipScope,
): AdjustmentPreviewFilter {
  const active = layers.filter(
    (l) =>
      Number.isFinite(l.start) &&
      Number.isFinite(l.duration) &&
      l.duration > 0 &&
      time >= l.start &&
      time < l.start + l.duration &&
      (clipScope === undefined || adjustmentAppliesToClip(l, clipScope)),
  );
  const lutChain: string[] = [];
  // U3: chuỗi LUT đầy đủ, không chỉ LUT đơn cuối: clip có thể đã mang
  // `lutChain` (do split trước đó đặt), layer chuẩn có thể mang nhiều
  // LUT (nhiều entry `filters`). Chỉ khi không có chuỗi mới dùng `lut`
  // đơn — chuỗi là nguồn thật, `lut` chỉ là tương thích.
  const clipLuts = clip.filter?.lutChain ?? (clip.filter?.lut ? [clip.filter.lut] : []);
  for (const l of clipLuts) lutChain.push(l);
  const colorSum: Record<string, number> = {};
  for (const p of COLOR_PARAMS) {
    colorSum[p] = clip.filter?.color?.[p] ?? 0;
  }
  for (const layer of active) {
    const layerLuts = layer.filter?.lutChain ?? (layer.filter?.lut ? [layer.filter.lut] : []);
    for (const l of layerLuts) lutChain.push(l);
    if (layer.filter?.color) {
      for (const p of COLOR_PARAMS) {
        const v = layer.filter.color[p];
        if (typeof v === "number" && Number.isFinite(v)) {
          colorSum[p] = Math.min(100, Math.max(-100, colorSum[p] + v));
        }
      }
    }
  }
  const lut: string | null =
    lutChain.length > 0 ? lutChain[lutChain.length - 1] : null;
  let color: ColorAdjustInput | null = null;
  for (const p of COLOR_PARAMS) {
    if (colorSum[p] !== 0) {
      if (!color) color = {};
      color[p] = colorSum[p];
    }
  }
  const merged: EffectInput[] = [...(clip.effects ?? [])];
  for (const layer of active) {
    for (const e of layer.effects ?? []) {
      if (typeof e.type !== "string") continue;
      const idx = merged.findIndex((m) => m.type === e.type);
      if (idx >= 0) merged[idx] = e;
      else merged.push(e);
    }
  }
  const skippedEffects: string[] = [];
  for (const e of merged) {
    // P3 (đợt 11): chỉ skip khi (a) nằm trong tập tĩnh "thật sự chưa
    // có đường vẽ" (hiện rỗng), hoặc (b) không thuộc cả 2 đường vẽ đã
    // có (CSS + canvas) — tức type lạ chưa biết. 8 type canvas KHÔNG
    // còn rơi vào đây dù chúng không có trong PREVIEW_SUPPORTED_EFFECTS.
    if (
      PREVIEW_SKIPPED_EFFECTS.has(e.type) ||
      (!PREVIEW_SUPPORTED_EFFECTS.has(e.type) &&
        !PREVIEW_CANVAS_EFFECTS.has(e.type))
    ) {
      if (!skippedEffects.includes(e.type)) skippedEffects.push(e.type);
    }
  }
  return {
    lut,
    lutChain,
    color,
    effects: merged,
    skippedEffects,
    skippedReasons: skippedEffects.map((t) => skippedEffectReason(t)),
    activeLayerIds: active.map((l) => l.id),
    adjustmentActive: active.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Dựng spec cho preview: flatten + cắt clip theo biên adjustment + gộp filter
// ---------------------------------------------------------------------------

/**
 * Cắt 1 clip theo biên cửa sổ adjustment, gộp filter vào đoạn bị phủ.
 * U3: chỉ cắt/gộp theo layer thỏa `adjustmentAppliesToClip` với
 * `clipScope` (track của clip thuộc scope layer mới cắt); không có scope
 * thì giữ hành vi cũ (mọi layer đều cắt) để tương thích ngược.
 */
function splitClipByAdjustments(
  clip: LeafClipInput,
  adjustments: AdjustmentWindow[],
  clipScope?: ClipScope,
): LeafClipInput[] {
  // U3: chỉ layer thỏa scope mới được cắt/gộp. Lọc TRƯỚC khi
  // tính điểm cắt — nếu không, clip ngoài scope layer vẫn bị cắt thành
  // nhiều đoạn (dù filter không đổi), làm sai số đoạn và highlight/selection.
  const applicable =
    clipScope === undefined
      ? adjustments
      : adjustments.filter((a) => adjustmentAppliesToClip(a, clipScope));
  if (applicable.length === 0) return [clip];
  const s0 = clip.start;
  const e0 = clip.start + clip.duration;
  const cuts = new Set<number>([s0, e0]);
  for (const a of applicable) {
    if (!Number.isFinite(a.start) || !Number.isFinite(a.duration)) continue;
    const lo = Math.max(s0, a.start);
    const hi = Math.min(e0, a.start + a.duration);
    if (hi > lo) {
      cuts.add(lo);
      cuts.add(hi);
    }
  }
  // U3: KHÔNG early-return khi chỉ có 2 điểm cắt. Layer phủ kín toàn
  // bộ clip (không tạo điểm cắt trong) vẫn phải gộp filter: vòng lặp
  // dưới đây áp filter đã gộp cho đoạn duy nhất đó (midpoint nằm trong
  // layer → adjustmentActive). Early-return cũ khiến layer phủ kín bị
  // lặng lẽ bỏ qua — sai với render (adjChain vẫn nối cho đoạn phủ kín).
  // Trường hợp layer chỉ chạm biên (không giao) thì midpoint không nằm
  // trong layer nên đoạn trả về giữ nguyên filter gốc (chỉ là copy).
  const sorted = [...cuts].sort((x, y) => x - y);
  const out: LeafClipInput[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const s = sorted[i];
    const e = sorted[i + 1];
    if (e <= s) continue;
    const copy: LeafClipInput = { ...clip, start: s, duration: e - s };
    if (
      (clip.kind === "video" || clip.kind === "audio") &&
      Number.isFinite(clip.in)
    ) {
      // G1: đoạn của clip ramp (gồm lá ramp tổng hợp từ nested ramp)
      // phải dời `in` theo ∫curve và mang curve slice rebase về 0 —
      // công thức speed hằng cũ tính sai nguồn cho đoạn sau đoạn đầu.
      const curve = clip.speedKeyframes;
      if (curve !== undefined && Array.isArray(curve.keyframes) && curve.keyframes.length > 0) {
        const segStart = s - s0;
        const segEnd = e - s0;
        const sliced = sliceSpeedKeyframes(curve.keyframes, segStart, segEnd).keyframes;
        copy.in = (clip.in as number) + integrateSpeed(curve, 0, segStart);
        if (Number.isFinite(clip.out)) {
          copy.out = Math.min(
            clip.out as number,
            (clip.in as number) + integrateSpeed(curve, 0, segEnd),
          );
        }
        if (sliced.length > 0) {
          copy.speedKeyframes = { keyframes: sliced };
          delete copy.speed;
        }
      } else {
        const adv = (s - s0) * (clip.speed ?? 1);
        copy.in = (clip.in as number) + adv;
        if (Number.isFinite(clip.out)) {
          copy.out = copy.in + (e - s) * (clip.speed ?? 1);
        }
      }
    }
    const merged = applyAdjustmentPreview(clip, adjustments, (s + e) / 2, clipScope);
    if (merged.adjustmentActive) {
      const filter: Record<string, unknown> = { ...(clip.filter ?? {}) };
      if (merged.lutChain.length > 0) {
        // R4: giữ cả chuỗi để đường vẽ áp lần lượt; `lut` đơn = cuối chuỗi.
        filter["lut"] = merged.lut;
        filter["lutChain"] = [...merged.lutChain];
      } else {
        delete filter["lut"];
        delete filter["lutChain"];
      }
      if (merged.color) filter["color"] = merged.color;
      else delete filter["color"];
      copy.filter = filter as FilterInput;
      copy.effects = merged.effects;
    }
    out.push(copy);
  }
  return out;
}

/**
 * Spec dùng cho preview: nested đã phẳng, adjustment đã gộp vào clip qua
 * cắt đoạn (đoạn ngoài cửa sổ adjustment giữ nguyên filter gốc).
 * Không có nested/adjustment thì trả ĐÚNG object spec cũ (không copy).
 * Spec gốc không bị sửa: mọi clip bị cắt/gộp đều là copy.
 * U3: spec đầu ra KHÔNG còn field `adjustmentLayers` — layer chuẩn đã
 * gộp vào clip, giữ field lại sẽ khiến code nào đọc field đó áp layer
 * lần thứ hai (double-apply). Track adjustment chuyên biệt cũng bị bỏ
 * khỏi đầu ra như trước (layer của nó đã gộp vào clip).
 */
export function buildPreviewSpec(spec: VideoSpec): VideoSpec {
  const input = spec as unknown as FlattenSpecInput;
  if (!hasNestedOrAdjustment(input)) return spec;
  const flat = flattenForPreview(input);
  const adjustments: AdjustmentWindow[] = flat.adjustments;
  const outTracks: Track[] = [];
  for (let ti = 0; ti < spec.tracks.length; ti++) {
    const track = spec.tracks[ti];
    const t = track as unknown as FlattenSpecInput["tracks"][number];
    if (t.kind === "adjustment") continue; // layer đã gộp vào clip, không còn là clip
    const kept: Clip[] = [];
    for (const raw of t.clips) {
      if (isNestedClip(raw) || isAdjustmentLayer(raw)) continue;
      if (!isLeafClip(raw)) continue;
      // R3: clip phẳng tầng ngoài bị dịch sớm bởi cặp biên — copy rồi mới
      // cắt theo adjustment (không sửa spec gốc).
      const shift = flat.plainShifts.get(raw) ?? 0;
      const base = shift > 0 ? { ...raw, start: raw.start - shift } : raw;
      // U3: scope tầng ngoài — layer chỉ cắt clip khi track của clip
      // thuộc scope layer (layer chuẩn xét tracks tầng ngoài; layer
      // legacy host xét đúng track host).
      const scope: ClipScope = { nestedPath: [], trackStack: [ti] };
      for (const seg of splitClipByAdjustments(base, adjustments, scope)) {
        kept.push(seg as unknown as Clip);
      }
    }
    outTracks.push({ ...track, clips: kept } as Track);
  }
  // Clip lá từ nested, gom theo kind để renderFrame (lọc theo kind track) thấy đủ.
  // Giữ nguyên FlatClip (không chỉ clip) để split theo đúng scope từng lá.
  const byKind = new Map<string, FlatClip[]>();
  for (const f of flat.clips) {
    if (f.nestedPath.length === 0) continue; // clip tầng ngoài đã có trong outTracks
    const arr = byKind.get(f.trackKind) ?? [];
    arr.push(f);
    byKind.set(f.trackKind, arr);
  }
  for (const [kind, leaves] of byKind) {
    const segs: Clip[] = [];
    for (const f of leaves) {
      const scope: ClipScope = {
        nestedPath: f.nestedPath,
        trackStack: f.trackStack,
      };
      for (const seg of splitClipByAdjustments(f.clip, adjustments, scope)) {
        segs.push(seg as unknown as Clip);
      }
    }
    segs.sort((a, b) => a.start - b.start);
    outTracks.push({
      id: `__nested-${kind}`,
      kind: kind as Track["kind"],
      label: "Nested (flattened)",
      clips: segs,
    } as Track);
  }
  // U3: bỏ `adjustmentLayers` khỏi spec đầu ra (đã gộp vào clip).
  const { adjustmentLayers: _dropped, ...rest } = spec as unknown as Record<string, unknown>;
  void _dropped;
  return { ...rest, tracks: outTracks } as VideoSpec;
}
