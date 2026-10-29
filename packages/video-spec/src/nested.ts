/**
 * nested.ts — Nested sequence / compound clip (Phase 9, luồng N1: SPEC).
 *
 * Một nested clip là một clip chứa một VideoSpec con (project con) và phát
 * project con đó như một đoạn media duy nhất trên timeline ngoài:
 * - `subSpec`: VideoSpec con (meta + tracks riêng, có fps/kích thước riêng).
 * - `trim`: cửa sổ [in, out) trong timeline của subSpec mà clip này phát.
 *   Không đặt trim = phát toàn bộ subSpec (in = 0, out = độ dài subSpec).
 * - `speed`: tốc độ phát toàn bộ subSpec (0.25–4, mặc định 1, cùng dải
 *   với VideoClip.speed). Độ dài hiển thị trên timeline ngoài LUÔN bằng
 *   (out − in) / speed — xem SPEED_INVARIANT.md của clip thường.
 * - `start`/`duration`: vị trí và độ dài trên timeline NGOÀI (timelineStart
 *   trong yêu cầu = `start`; `duration` phải khớp nestedDuration()).
 * - `name`: tên hiển thị (không bắt buộc; không có thì UI dùng id).
 *
 * Module này CHỈ là spec + toán thuần (giống markers.ts/timebase.ts):
 * - Không import runtime từ index.ts (chỉ `import type`, bị xóa khi biên
 *   dịch) nên không tạo vòng lặp runtime index → nested → index, và
 *   render worker zero-dependency có thể require() mirror nested.js.
 * - Không đụng tới preview/render/editor: preview.tsx, render.js,
 *   Timeline.tsx CHƯA biết đọc kind "nested" — xem NESTED_LIMITS.md.
 *   flattenNested() chỉ là "mở phẳng" để tính vị trí (placement), không
 *   phải bản render, và không viết lại nội dung clip lá (in/out, keyframe,
 *   speed curve, fade — xem FlatClip).
 *
 * Quy ước thời gian (GIÂY, giống toàn bộ spec):
 * - Thời gian trong subSpec: t = 0 là đầu project con.
 * - Một clip lá [s, s+d) trong subSpec, qua trim [in, out) và speed v của
 *   nested clip, chỉ phần giao với [in, out) mới hiện; phần hiện đó chiếm
 *   trên timeline ngoài [start + (max(s,in) − in)/v, start + (min(s+d,out) − in)/v).
 * - Lồng nhau: tốc độ nhân qua các tầng (tầng ngoài v1, tầng trong v2 →
 *   lá chịu v1*v2); trim ngoài cắt giữa một nested clip con sẽ dời cửa sổ
 *   trim của clip con đó theo đúng tốc độ của nó (xem flattenInto).
 *
 * ĐỢT 7 (Phase 9 round 7, luồng U1 — THỐNG NHẤT SHAPE NESTED):
 * - Shape chuẩn DUY NHẤT là NestedClip mang `subSpec` ở đây.
 *   Shape cũ dạng tracks trực tiếp ({ kind: "nested", tracks: [...] },
 *   kiểu duck-typed của nestedPreview.ts, kèm field `in` thay cho trim)
 *   được normalizeNestedClip() ở cuối file chuyển về shape chuẩn.
 *   Normalize KHÔNG làm mất nội dung track/clip, KHÔNG tự chọn khi cả
 *   `subSpec` và `tracks` cùng có mà khác nhau (fail fast, ok:false),
 *   và KHÔNG bịa meta (shape cũ thiếu meta thì caller phải truyền
 *   opts.meta). Export qua index.ts nhờ `export *` sẵn có (không sửa
 *   index.ts). Xem U1_LIMITS.md.
 *
 * Giới hạn cứng:
 * - Độ sâu lồng nhau tối đa MAX_NESTED_DEPTH = 8 (clip nested ngoài cùng
 *   là tầng 1). Vượt → validateNestedClip() trả lỗi, flattenNested() throw.
 * - Vòng lặp tham chiếu (subSpec của một clip xuất hiện lại trong chính
 *   chuỗi tổ tiên của nó, kể cả tự tham chiếu trực tiếp) → lỗi/throw.
 *   Dùng lại CÙNG subSpec object ở hai clip ANH EM là HỢP LỆ (không phải
 *   vòng lặp): phát hiện vòng lặp chỉ xét theo path tổ tiên, không xét
 *   toàn cục. Đây là tính năng "dùng lại nhiều lần" của compound clip.
 */

import type { Clip, VideoSpec } from "./index.js";
import type { SpeedCurve, SpeedKeyframe } from "./speedcurve.js";
import {
  integrateSpeed,
  normalizeSpeedKeyframes,
} from "./speedcurve.js";

/** Độ sâu lồng nhau tối đa (clip nested ngoài cùng = tầng 1). */
export const MAX_NESTED_DEPTH = 8;

/** Dải tốc độ cho phép của nested clip (giống VideoClip.speed). */
export const NESTED_MIN_SPEED = 0.25;
export const NESTED_MAX_SPEED = 4;

/** Sai số chấp nhận khi so duration với nestedDuration() (giây). */
export const NESTED_DURATION_EPSILON = 1e-6;

/** Cửa sổ trim trong timeline của subSpec: phát từ in (gồm) tới out (trừ). */
export interface NestedTrim {
  /** Điểm vào trong subSpec (giây, >= 0). */
  in: number;
  /** Điểm ra trong subSpec (giây, > in, <= độ dài subSpec). */
  out: number;
}

/**
 * Clip nested sequence / compound clip.
 *
 * Thuộc Track.clips như mọi Clip khác (xem index.ts: Clip bao gồm
 * NestedClip). Đặt trên track video là hợp lý nhất; module này không cấm
 * track khác vì validator của track thuộc về render worker, nhưng
 * NESTED_LIMITS.md ghi rõ: chỉ track video mới có ý nghĩa hiển thị.
 */
export interface NestedClip {
  kind: "nested";
  id: string;
  /** Project con được phát như một đoạn media duy nhất. */
  subSpec: VideoSpec;
  /** Vị trí bắt đầu trên timeline NGOÀI (giây, >= 0). */
  start: number;
  /**
   * Độ dài hiển thị trên timeline NGOÀI (giây, > 0).
   * Không có speedKeyframes: PHẢI bằng nestedDuration(clip) =
   * (trim.out − trim.in) / speed.
   * Có speedKeyframes (đợt 20 R3, ngữ nghĩa render đợt 18 §2): duration
   * là thời gian OUTPUT, cửa sổ con là [trim.in, trim.in + ∫curve);
   * validator kiểm tra trim.out = trim.in + ∫curve thay cho công thức
   * trên (1e-4; curve hằng: 1e-6 với duration × v).
   */
  duration: number;
  /**
   * Đợt 20 R3: speedKeyframes trên nested clip (ngữ nghĩa render đợt 18).
   * Khi có curve, render DÙNG CURVE và BỎ QUA `speed` hằng (nhưng speed
   * vẫn phải nằm trong [0.25, 4] nếu ghi — luật clip thường).
   */
  speedKeyframes?: SpeedCurve;
  /**
   * Cửa sổ phát trong subSpec. Không đặt = phát toàn bộ subSpec
   * ({ in: 0, out: nestedSourceDuration(subSpec) }).
   */
  trim?: NestedTrim;
  /** Tốc độ phát toàn bộ subSpec (0.25–4, mặc định 1). */
  speed?: number;
  /** Tên hiển thị trên timeline (không bắt buộc). */
  name?: string;
}

/**
 * Một clip lá sau khi mở phẳng: clip gốc KHÔNG bị sửa (giữ nguyên tham
 * chiếu), vị trí tuyệt đối nằm ở absoluteStart/absoluteDuration.
 *
 * CHÚ Ý — flatten là placement-only: nó KHÔNG viết lại in/out, keyframe,
 * speedKeyframes, fade, volume của clip lá. Một clip lá bị trim ngoài cắt
 * dở vẫn giữ nguyên in/out gốc; consumer muốn render bản phẳng phải tự
 * map offset media (xem NESTED_LIMITS.md §"flatten không viết lại clip lá").
 */
export interface FlatClip {
  /** Clip lá gốc (không phải nested) — giữ nguyên tham chiếu, không copy. */
  clip: Clip;
  /** Vị trí bắt đầu tuyệt đối trên timeline NGOÀI (giây). */
  absoluteStart: number;
  /** Độ dài khả kiến trên timeline NGOÀI sau trim + tốc độ (giây, > 0). */
  absoluteDuration: number;
  /**
   * Chuỗi id các nested clip bao quanh clip lá, từ ngoài vào trong.
   * Lá là con trực tiếp của clip nested ngoài cùng → [topId].
   */
  path: string[];
  /** Độ sâu của nested clip chứa trực tiếp clip lá (ngoài cùng = 1). */
  depth: number;
}

// ---------------------------------------------------------------------------
// Type guard + helper thuần
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Guard nông: object có kind "nested" (validate đầy đủ bằng validateNestedClip). */
export function isNestedClip(v: unknown): v is NestedClip {
  return isRecord(v) && v["kind"] === "nested";
}

/**
 * Độ dài timeline của một VideoSpec = clip kết thúc muộn nhất
 * (cùng định nghĩa với projectDuration() ở index.ts, viết lại tại đây để
 * tránh import runtime vòng tròn index → nested → index).
 * Clip nested con tính bằng field duration của chính nó.
 */
export function nestedSourceDuration(subSpec: VideoSpec): number {
  let max = 0;
  for (const t of subSpec.tracks) {
    for (const c of t.clips) {
      const end = c.start + c.duration;
      if (Number.isFinite(end)) max = Math.max(max, end);
    }
  }
  return max;
}

/** Tốc độ hiệu dụng của nested clip (mặc định 1). */
export function nestedEffectiveSpeed(clip: NestedClip): number {
  return clip.speed ?? 1;
}

/** Cửa sổ trim hiệu dụng (mặc định phát toàn bộ subSpec). */
export function nestedEffectiveTrim(clip: NestedClip): NestedTrim {
  return clip.trim ?? { in: 0, out: nestedSourceDuration(clip.subSpec) };
}

/**
 * Độ dài hiển thị của nested clip = (trim.out − trim.in) / speed.
 * Hàm thuần, KHÔNG throw: gọi trên clip chưa validate có thể trả Infinity
 * (speed = 0) hoặc NaN — caller phải validateNestedClip() trước khi tin
 * kết quả. Đây là bất biến tốc độ của nested clip (xem SPEED_INVARIANT.md).
 *
 * Đợt 20 R3: hàm này CHỈ đúng cho nested KHÔNG mang speedKeyframes.
 * Nested mang curve có duration là thời gian OUTPUT (không suy ra từ
 * trim/speed); validator kiểm tra trim.out = trim.in + ∫curve thay thế,
 * không gọi hàm này cho clip có curve.
 */
export function nestedDuration(clip: NestedClip): number {
  const trim = nestedEffectiveTrim(clip);
  return (trim.out - trim.in) / nestedEffectiveSpeed(clip);
}

// ---------------------------------------------------------------------------
// validateNestedClip
// ---------------------------------------------------------------------------

/**
 * Đợt 20 R3: validate hình dạng speedKeyframes của nested clip theo đúng
 * luật validator clip ramp thường (render đợt 18 §1.2): object
 * { keyframes: [...] }, 1–128 keyframe, t ∈ [0, duration], v ∈ [0.25, 4],
 * easing ∈ linear | ease-in | ease-out | bezier, bezier [x1, y1, x2, y2]
 * với x1, x2 ∈ [0, 1] (y tự do, overshoot được phép như clip thường).
 * duration không hữu hạn → bỏ qua kiểm tra t (lỗi duration đã báo riêng).
 * Trả về danh sách lỗi (rỗng = hình dạng hợp lệ); KHÔNG throw.
 */
function validateNestedSpeedCurveShape(
  curve: unknown,
  duration: unknown,
  label: string,
): string[] {
  const where = `${label}.speedKeyframes`;
  if (!isRecord(curve) || !Array.isArray(curve["keyframes"])) {
    return [`${where} phải là object { keyframes: [...] }`];
  }
  const arr = curve["keyframes"] as unknown[];
  if (arr.length === 0) {
    return [`${where}.keyframes: mảng rỗng — cần ít nhất 1 keyframe`];
  }
  if (arr.length > 128) {
    return [`${where}.keyframes: quá 128 keyframe`];
  }
  const errors: string[] = [];
  const EASINGS = ["linear", "ease-in", "ease-out", "bezier"];
  for (let i = 0; i < arr.length; i++) {
    const kf = arr[i];
    const w = `${where}.keyframes[${i}]`;
    if (!isRecord(kf)) {
      errors.push(`${w} phải là object { t, v, easing }`);
      continue;
    }
    const t = kf["t"];
    const v = kf["v"];
    const easing = kf["easing"];
    if (
      typeof t !== "number" || !Number.isFinite(t) || t < 0 ||
      (isFiniteNumber(duration) && t > (duration as number) + 1e-6)
    ) {
      errors.push(`${w}.t phải trong [0, ${duration}] (nhận được: ${JSON.stringify(t)})`);
    }
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0.25 || v > 4) {
      errors.push(`${w}.v phải trong 0.25..4 (nhận được: ${JSON.stringify(v)})`);
    }
    if (typeof easing !== "string" || !EASINGS.includes(easing)) {
      errors.push(`${w}.easing phải là linear | ease-in | ease-out | bezier (nhận được: ${JSON.stringify(easing)})`);
    }
    if (easing === "bezier") {
      const b = kf["bezier"];
      if (
        !Array.isArray(b) || b.length !== 4 ||
        !b.every((x) => typeof x === "number" && Number.isFinite(x)) ||
        (b[0] as number) < 0 || (b[0] as number) > 1 ||
        (b[2] as number) < 0 || (b[2] as number) > 1
      ) {
        errors.push(`${w}.bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do`);
      }
    }
  }
  return errors;
}

/**
 * Validate một nested clip (kể cả đệ quy toàn bộ subSpec của nó).
 * Trả về danh sách lỗi (rỗng = hợp lệ). KHÔNG throw với input xấu —
 * input không phải object / sai kind cũng chỉ trả lỗi.
 *
 * Kiểm tra ở mọi tầng:
 * - id không rỗng; name (nếu có) là chuỗi; start >= 0; duration > 0.
 * - speed (nếu có) trong [0.25, 4]; trim hợp lệ (in >= 0, out > in,
 *   out <= độ dài subSpec); duration khớp nestedDuration() trong 1e-6s.
 * - Đợt 20 R3: nested mang speedKeyframes thì duration là thời gian
 *   OUTPUT, KHÔNG kiểm tra (out − in)/speed nữa; thay vào đó kiểm tra
 *   hình dạng curve (luật clip ramp thường) và trim.out = trim.in +
 *   ∫curve (1e-4; curve hằng: 1e-6 với duration × v). Không có trim thì
 *   không kiểm tra gì thêm (cửa sổ con kết thúc tại in + ∫ theo định
 *   nghĩa). Clip thường (không curve) giữ nguyên kiểm tra cũ, không
 *   nới lỏng.
 * - subSpec có meta (width/height/fps > 0) và tracks là mảng; clip con
 *   nông (mọi kind) có start >= 0 và duration > 0.
 * - Độ sâu vượt MAX_NESTED_DEPTH → lỗi, không đệ quy sâu hơn.
 * - Vòng lặp tham chiếu (subSpec đã có trong chuỗi tổ tiên) → lỗi,
 *   không đệ quy vào nhánh đó.
 * - Dùng lại cùng subSpec ở các clip anh em là HỢP LỆ (không báo vòng lặp).
 *
 * KHÔNG kiểm tra ở đây (xem NESTED_LIMITS.md): fps/kích thước của subSpec
 * có khớp project ngoài hay không; transition qua biên nested clip;
 * audio trong subSpec trộn ra sao; clip lá có speedKeyframes hay không.
 */
export function validateNestedClip(clip: unknown): string[] {
  return validateNestedRec(clip, 1, new Set<object>(), "nested clip");
}

function validateNestedRec(
  clip: unknown,
  depth: number,
  ancestors: Set<object>,
  label: string,
): string[] {
  if (!isRecord(clip) || clip["kind"] !== "nested") {
    return [`${label} phải là nested clip (kind "nested")`];
  }
  const errors: string[] = [];
  const rec = clip as Record<string, unknown>;
  const id = rec["id"];
  const idLabel =
    typeof id === "string" && id.trim() !== "" ? `nested clip "${id}"` : label;

  if (typeof id !== "string" || id.trim() === "") {
    errors.push(`${label}.id phải là chuỗi không rỗng`);
  }
  if (rec["name"] !== undefined && typeof rec["name"] !== "string") {
    errors.push(`${idLabel}.name phải là chuỗi`);
  }
  if (!isFiniteNumber(rec["start"]) || (rec["start"] as number) < 0) {
    errors.push(`${idLabel}.start phải là số >= 0`);
  }
  if (!isFiniteNumber(rec["duration"]) || (rec["duration"] as number) <= 0) {
    errors.push(`${idLabel}.duration phải là số > 0`);
  }
  const speed = rec["speed"];
  if (
    speed !== undefined &&
    (!isFiniteNumber(speed) ||
      (speed as number) < NESTED_MIN_SPEED ||
      (speed as number) > NESTED_MAX_SPEED)
  ) {
    errors.push(
      `${idLabel}.speed phải trong [${NESTED_MIN_SPEED}, ${NESTED_MAX_SPEED}]`,
    );
  }

  const subSpec = rec["subSpec"];
  if (!isRecord(subSpec)) {
    errors.push(`${idLabel}.subSpec phải là một VideoSpec`);
    return errors;
  }
  const meta = (subSpec as Record<string, unknown>)["meta"];
  if (!isRecord(meta)) {
    errors.push(`${idLabel}.subSpec.meta phải là một object`);
    return errors;
  }
  for (const f of ["width", "height", "fps"] as const) {
    if (!isFiniteNumber(meta[f]) || (meta[f] as number) <= 0) {
      errors.push(`${idLabel}.subSpec.meta.${f} phải là số > 0`);
    }
  }
  const tracks = (subSpec as Record<string, unknown>)["tracks"];
  if (!Array.isArray(tracks)) {
    errors.push(`${idLabel}.subSpec.tracks phải là một mảng`);
    return errors;
  }

  if (depth > MAX_NESTED_DEPTH) {
    errors.push(`${idLabel} vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH}`);
    return errors;
  }
  if (ancestors.has(subSpec)) {
    errors.push(`${idLabel} tạo vòng lặp tham chiếu subSpec (đã có trong chuỗi tổ tiên)`);
    return errors;
  }

  const typed = clip as unknown as NestedClip;
  const sourceDuration = nestedSourceDuration(typed.subSpec);
  // Đợt 20 R3: validate curve TRƯỚC khối trim/duration (cần duration để
  // kiểm tra t và cần kết quả để chọn nhánh bất biến ở dưới). Curve lỗi
  // hình dạng → chỉ báo lỗi shape, không báo thêm duration (tránh nhiễu).
  const curveRaw = rec["speedKeyframes"];
  let curveInfo: {
    isConstant: boolean;
    constantV: number;
    totalConsumed: number;
  } | null = null;
  if (curveRaw !== undefined) {
    const shapeErrors = validateNestedSpeedCurveShape(
      curveRaw,
      rec["duration"],
      idLabel,
    );
    errors.push(...shapeErrors);
    if (shapeErrors.length === 0 && isFiniteNumber(rec["duration"])) {
      const norm = normalizeSpeedKeyframes(
        (curveRaw as { keyframes: SpeedKeyframe[] }).keyframes,
      );
      const isConstant = norm.every((k) => Math.abs(k.v - norm[0].v) <= 1e-12);
      curveInfo = {
        isConstant,
        constantV: norm[0].v,
        totalConsumed: integrateSpeed(
          { keyframes: norm },
          0,
          rec["duration"] as number,
        ),
      };
    }
  }
  const trim = rec["trim"];
  if (trim !== undefined) {
    if (!isRecord(trim)) {
      errors.push(`${idLabel}.trim phải là một object { in, out }`);
    } else {
      if (!isFiniteNumber(trim["in"]) || (trim["in"] as number) < 0) {
        errors.push(`${idLabel}.trim.in phải là số >= 0`);
      }
      if (
        !isFiniteNumber(trim["out"]) ||
        (trim["out"] as number) <= (isFiniteNumber(trim["in"]) ? (trim["in"] as number) : 0)
      ) {
        errors.push(`${idLabel}.trim.out phải là số > trim.in`);
      } else if ((trim["out"] as number) > sourceDuration + NESTED_DURATION_EPSILON) {
        errors.push(
          `${idLabel}.trim.out (${trim["out"]}) vượt quá độ dài subSpec (${sourceDuration})`,
        );
      }
    }
  }
  if (isFiniteNumber(rec["duration"])) {
    if (curveInfo !== null) {
      // Nhánh curve: trim.out (nếu ghi đủ in/out hữu hạn và out > in —
      // các lỗi hình dạng trim đã báo ở khối trim trên, không báo trùng)
      // phải khớp in + ∫curve (render đợt 18 §1.3).
      if (
        isRecord(trim) &&
        isFiniteNumber(trim["in"]) &&
        isFiniteNumber(trim["out"]) &&
        (trim["out"] as number) > (trim["in"] as number)
      ) {
        const expectedOut = curveInfo.isConstant
          ? (trim["in"] as number) +
            (rec["duration"] as number) * curveInfo.constantV
          : (trim["in"] as number) + curveInfo.totalConsumed;
        const tol = curveInfo.isConstant ? NESTED_DURATION_EPSILON : 1e-4;
        if (Math.abs((trim["out"] as number) - expectedOut) > tol) {
          errors.push(
            `${idLabel}.trim.out (${trim["out"]}) không khớp trim.in + ` +
              (curveInfo.isConstant
                ? `duration × ${curveInfo.constantV}`
                : `∫speedKeyframes trên duration`) +
              ` = ${expectedOut} (nested mang speedKeyframes: duration là thời gian output, xem render đợt 18 §1.3)`,
          );
        }
      }
      // Không trim → không kiểm tra gì thêm.
    } else if (curveRaw === undefined) {
      const expected = nestedDuration(typed);
      if (
        Number.isFinite(expected) &&
        Math.abs((rec["duration"] as number) - expected) > NESTED_DURATION_EPSILON
      ) {
        errors.push(
          `${idLabel}.duration (${rec["duration"]}) không khớp (trim.out − trim.in) / speed = ${expected}`,
        );
      }
    }
    // curveRaw có mặt nhưng shape lỗi → đã báo lỗi shape ở trên.
  }
  if (sourceDuration <= 0) {
    errors.push(`${idLabel}.subSpec rỗng (không có clip nào, độ dài = 0)`);
  }

  const nextAncestors = new Set<object>(ancestors);
  nextAncestors.add(subSpec);
  tracks.forEach((track, ti) => {
    if (!isRecord(track) || !Array.isArray(track["clips"])) {
      errors.push(`${idLabel}.subSpec.tracks[${ti}].clips phải là một mảng`);
      return;
    }
    (track["clips"] as unknown[]).forEach((child, ci) => {
      const childLabel = `${idLabel}.subSpec.tracks[${ti}].clips[${ci}]`;
      if (!isRecord(child) || typeof child["kind"] !== "string") {
        errors.push(`${childLabel} phải là một clip có kind`);
        return;
      }
      if (
        !isFiniteNumber(child["start"]) ||
        (child["start"] as number) < 0 ||
        !isFiniteNumber(child["duration"]) ||
        (child["duration"] as number) <= 0
      ) {
        errors.push(`${childLabel} phải có start >= 0 và duration > 0`);
      }
      if (child["kind"] === "nested") {
        if (depth + 1 > MAX_NESTED_DEPTH) {
          errors.push(
            `${childLabel} vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH}`,
          );
        } else {
          errors.push(
            ...validateNestedRec(child, depth + 1, nextAncestors, childLabel),
          );
        }
      }
    });
  });
  return errors;
}

// ---------------------------------------------------------------------------
// flattenNested
// ---------------------------------------------------------------------------

/**
 * Mở phẳng một nested clip thành danh sách clip lá kèm vị trí tuyệt đối
 * trên timeline NGOÀI. Thứ tự trả về: theo thứ tự track rồi thứ tự clip
 * trong subSpec (không sắp theo thời gian — consumer tự sort nếu cần).
 *
 * Fail fast (throw Error) khi:
 * - clip không phải nested clip, speed không hữu hạn hoặc <= 0,
 *   trim không hợp lệ (out <= in), subSpec không có tracks.
 * - Độ sâu vượt MAX_NESTED_DEPTH hoặc phát hiện vòng lặp tham chiếu.
 *
 * Clip lá bị trim ngoài cắt hết (giao rỗng) thì BỊ BỎ (không có entry) —
 * đó là hành vi đúng, không phải lỗi. Clip lá có start/duration không
 * hữu hạn thì throw (input rác không được nuốt lặng).
 *
 * Xem FlatClip về việc hàm này KHÔNG viết lại nội dung clip lá.
 */
export function flattenNested(clip: NestedClip): FlatClip[] {
  if (!isNestedClip(clip)) {
    throw new Error("flattenNested: clip phải là nested clip (kind \"nested\")");
  }
  const speed = nestedEffectiveSpeed(clip);
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new Error(`flattenNested: speed không hợp lệ (${String(clip.speed)})`);
  }
  const trim = nestedEffectiveTrim(clip);
  if (!Number.isFinite(trim.in) || !Number.isFinite(trim.out) || trim.out <= trim.in) {
    throw new Error(
      `flattenNested: trim không hợp lệ (in=${trim.in}, out=${trim.out})`,
    );
  }
  if (!Array.isArray((clip.subSpec as unknown as Record<string, unknown>)["tracks"])) {
    throw new Error("flattenNested: subSpec.tracks phải là một mảng");
  }
  const out: FlatClip[] = [];
  flattenInto(
    clip,
    clip.start,
    trim.in,
    1 / speed,
    trim.in,
    trim.out,
    1,
    new Set<object>(),
    [],
    out,
  );
  return out;
}

/**
 * Đệ quy mở phẳng.
 *
 * Ánh xạ thời gian: thời gian t trong subSpec của `nested` → thời gian
 * ngoài = mapP + (t − mapQ) * mapK. Chỉ phần t trong [winLo, winHi) mới
 * khả kiến (cửa sổ này đã gồm trim của `nested` và mọi trim tổ tiên).
 * - Lá: giao [child.start, child.start+child.duration) với cửa sổ →
 *   entry tuyệt đối (bỏ nếu giao rỗng).
 * - Nested con M: cửa sổ của M trong subSpec của chính nó là
 *   [M.trim.in + (visStart − M.start)*M.speed,
 *    M.trim.in + (visEnd − M.start)*M.speed] giao với [M.trim.in, M.trim.out];
 *   ánh xạ mới: mapP' = mapP + (M.start − mapQ)*mapK,
 *   mapQ' = M.trim.in, mapK' = mapK / M.speed.
 *   (Vì thời gian M: τ = M.start + (t' − M.trim.in)/M.speed.)
 */
function flattenInto(
  nested: NestedClip,
  mapP: number,
  mapQ: number,
  mapK: number,
  winLo: number,
  winHi: number,
  depth: number,
  ancestors: Set<object>,
  path: string[],
  out: FlatClip[],
): void {
  if (depth > MAX_NESTED_DEPTH) {
    throw new Error(
      `flattenNested: vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH} tại nested clip "${nested.id}"`,
    );
  }
  if (ancestors.has(nested.subSpec)) {
    throw new Error(
      `flattenNested: vòng lặp tham chiếu subSpec tại nested clip "${nested.id}"`,
    );
  }
  const nextAncestors = new Set<object>(ancestors);
  nextAncestors.add(nested.subSpec);
  const leafPath = [...path, nested.id];

  for (const track of nested.subSpec.tracks) {
    if (!track || !Array.isArray(track.clips)) continue;
    for (const child of track.clips as Clip[]) {
      if (!isRecord(child) || typeof (child as { kind?: unknown }).kind !== "string") {
        throw new Error(
          `flattenNested: clip con không hợp lệ trong subSpec của "${nested.id}"`,
        );
      }
      const c = child as { start: number; duration: number };
      if (!Number.isFinite(c.start) || !Number.isFinite(c.duration)) {
        throw new Error(
          `flattenNested: clip "${(child as { id?: unknown }).id}" có start/duration không hữu hạn`,
        );
      }
      const childStart = c.start;
      const childEnd = c.start + c.duration;
      const visStart = Math.max(childStart, winLo);
      const visEnd = Math.min(childEnd, winHi);
      if (visEnd <= visStart) continue; // bị trim ngoài cắt hết → bỏ

      if (isNestedClip(child)) {
        const childSpeed = nestedEffectiveSpeed(child);
        if (!Number.isFinite(childSpeed) || childSpeed <= 0) {
          throw new Error(
            `flattenNested: nested clip con "${child.id}" có speed không hợp lệ`,
          );
        }
        const childTrim = nestedEffectiveTrim(child);
        if (
          !Number.isFinite(childTrim.in) ||
          !Number.isFinite(childTrim.out) ||
          childTrim.out <= childTrim.in
        ) {
          throw new Error(
            `flattenNested: nested clip con "${child.id}" có trim không hợp lệ`,
          );
        }
        const winLoPrime = Math.max(
          childTrim.in,
          childTrim.in + (visStart - childStart) * childSpeed,
        );
        const winHiPrime = Math.min(
          childTrim.out,
          childTrim.in + (visEnd - childStart) * childSpeed,
        );
        if (winHiPrime <= winLoPrime) continue;
        flattenInto(
          child,
          mapP + (childStart - mapQ) * mapK,
          childTrim.in,
          mapK / childSpeed,
          winLoPrime,
          winHiPrime,
          depth + 1,
          nextAncestors,
          leafPath,
          out,
        );
      } else {
        out.push({
          clip: child,
          absoluteStart: mapP + (visStart - mapQ) * mapK,
          absoluteDuration: (visEnd - visStart) * mapK,
          path: leafPath,
          depth,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Đợt 15 T3 — composeNestedLeafWindow: hợp cửa sổ đệ quy cho 1 clip lá sâu
// ---------------------------------------------------------------------------

/**
 * Cửa sổ khả kiến của 1 clip lá sau khi hợp trim/speed qua NHIỀU tầng
 * nested (Phase 9 đợt 15, luồng T3 — đóng nợ đợt 14 R5 "nested sâu hơn
 * 1 cấp").
 *
 * VẤN ĐỀ GỐC: đợt 14 R5 chỉ có helper 1 tầng
 * (`nestedLeafVisibleSpeedCurve` trong nestUtils.ts: cửa sổ = trim hiệu
 * dụng của nested trực tiếp chứa lá). Lá ở cấp 2+ thì trim của từng tầng
 * tổ tiên đều cắt nó, và tốc độ các tầng đều co/giãn vị trí của nó —
 * phải hợp cửa sổ từng tầng theo đúng công thức của flattenInto thì mới
 * ra đúng vị trí/duration/in-out.
 *
 * CÔNG THỨC (y hệt flattenInto, chỉ khác là đi theo 1 đường đi chỉ định
 * thay vì quét toàn bộ cây): ở mỗi tầng, với cửa sổ hiện tại [winLo,
 * winHi) trong timeline của tầng đó và ánh xạ t → mapP + (t − mapQ) × mapK
 * ra timeline ngoài:
 * - Nested con M chiếm [M.start, M.start+M.duration) trong tầng hiện tại;
 *   phần khả kiến là giao với cửa sổ → [visStart, visEnd).
 * - Cửa sổ trong subSpec của M: [max(M.trim.in, M.trim.in +
 *   (visStart − M.start) × M.speed), min(M.trim.out, M.trim.in +
 *   (visEnd − M.start) × M.speed)].
 * - Ánh xạ mới: mapP' = mapP + (M.start − mapQ) × mapK, mapQ' = M.trim.in,
 *   mapK' = mapK / M.speed.
 * - Lá: giao [leaf.start, leaf.start+leaf.duration) với cửa sổ tầng chứa
 *   nó → absoluteStart/absoluteDuration bằng ánh xạ cuối; visibleStart/
 *   visibleEnd = phần giao tính từ đầu lá (thời gian output của lá).
 *
 * THAM SỐ:
 * - `top`: nested clip ngoài cùng (tầng 1).
 * - `chain`: các nested clip tổ tiên của lá, từ con trực tiếp của `top`
 *   xuống nested chứa trực tiếp lá (chain rỗng = lá trực tiếp trong top).
 * - `leaf`: clip lá cần tính.
 * Chain và lá được KHỚP THEO ID với cây thật (clip đầu tiên cùng id trong
 * tầng đó thắng khi trùng id) và mọi số liệu đều lấy từ bản ghi TRONG CÂY
 * (giống flattenNested), không lấy từ object caller truyền vào — tránh
 * lệch khi caller cầm bản copy cũ. Id không khớp cây → throw (fail fast,
 * không trả null lặng lẽ).
 *
 * TRẢ VỀ null khi lá bị trim ngoài cắt hết ở bất kỳ tầng nào (giống
 * flatten bỏ lá có giao rỗng). Throw khi: top/chain/leaf không hợp lệ
 * (kind, speed, trim, start/duration không hữu hạn), độ sâu vượt
 * MAX_NESTED_DEPTH, vòng lặp tham chiếu subSpec theo đường đi, hoặc lá
 * truyền vào thực ra là nested clip. Dùng lại CÙNG subSpec ở các clip
 * anh em là HỢP LỆ (kiểm tra vòng lặp chỉ xét đường đi tổ tiên, giống
 * flatten/validate) — mỗi lần gọi có Set tổ tiên riêng.
 *
 * KHÔNG mâu thuẫn spec cũ: hàm này không đổi flattenNested, không đổi
 * bất biến duration = (trim.out − trim.in) / speed, và absoluteStart/
 * absoluteDuration trả về khớp đúng entry tương ứng của flattenNested
 * (cùng khung thời gian, gồm cả top.start). Hàm KHÔNG viết lại in/out
 * của lá — caller muốn in/out hiệu dụng thì map visibleStart/visibleEnd
 * qua ramp/const-speed (xem deepNestedLeafVisibleSpeedCurve ở nestUtils).
 */
export interface ComposedLeafWindow {
  /** Cửa sổ khả kiến trong thời gian output của lá: [visibleStart, visibleEnd). */
  visibleStart: number;
  /** Xem visibleStart. */
  visibleEnd: number;
  /** Vị trí tuyệt đối trên timeline ngoài (cùng khung với FlatClip.absoluteStart). */
  absoluteStart: number;
  /** Độ dài khả kiến trên timeline ngoài (cùng khung với FlatClip.absoluteDuration). */
  absoluteDuration: number;
  /** Chuỗi id nested bao quanh lá, ngoài → trong (gồm cả top). */
  path: string[];
  /** Độ sâu của nested chứa trực tiếp lá (ngoài cùng = 1). */
  depth: number;
  /** Tốc độ tích lũy lá chịu = tích speed của top và mọi tầng chain. */
  cumulativeSpeed: number;
}

/** Tìm clip con trong 1 subSpec theo id (trùng id → clip đầu tiên thắng). */
function findChildInSubSpec(
  subSpec: VideoSpec,
  id: string,
): Clip | undefined {
  if (!Array.isArray(subSpec.tracks)) return undefined;
  for (const track of subSpec.tracks) {
    if (!track || !Array.isArray(track.clips)) continue;
    for (const c of track.clips as Clip[]) {
      if ((c as { id?: unknown }).id === id) return c;
    }
  }
  return undefined;
}

export function composeNestedLeafWindow(
  top: NestedClip,
  chain: NestedClip[],
  leaf: Clip,
): ComposedLeafWindow | null {
  if (!isNestedClip(top)) {
    throw new Error("composeNestedLeafWindow: top phải là nested clip (kind \"nested\")");
  }
  if (!Array.isArray(chain)) {
    throw new Error("composeNestedLeafWindow: chain phải là một mảng");
  }
  const topSpeed = nestedEffectiveSpeed(top);
  if (!Number.isFinite(topSpeed) || topSpeed <= 0) {
    throw new Error(`composeNestedLeafWindow: top speed không hợp lệ (${String(top.speed)})`);
  }
  const topTrim = nestedEffectiveTrim(top);
  if (!Number.isFinite(topTrim.in) || !Number.isFinite(topTrim.out) || topTrim.out <= topTrim.in) {
    throw new Error(
      `composeNestedLeafWindow: top trim không hợp lệ (in=${topTrim.in}, out=${topTrim.out})`,
    );
  }
  if (!Array.isArray((top.subSpec as unknown as Record<string, unknown>)["tracks"])) {
    throw new Error("composeNestedLeafWindow: top.subSpec.tracks phải là một mảng");
  }
  if (!isRecord(leaf) || typeof (leaf as { kind?: unknown }).kind !== "string") {
    throw new Error("composeNestedLeafWindow: leaf phải là một clip có kind");
  }
  if (!Number.isFinite((leaf as { start: number }).start) || !Number.isFinite((leaf as { duration: number }).duration)) {
    throw new Error("composeNestedLeafWindow: leaf có start/duration không hữu hạn");
  }

  const ancestors = new Set<object>();
  ancestors.add(top.subSpec);
  let curSpec: VideoSpec = top.subSpec;
  let mapP = top.start;
  let mapQ = topTrim.in;
  let mapK = 1 / topSpeed;
  let winLo = topTrim.in;
  let winHi = topTrim.out;
  let depth = 1;
  const path: string[] = [top.id];

  for (const step of chain) {
    if (depth + 1 > MAX_NESTED_DEPTH) {
      throw new Error(
        `composeNestedLeafWindow: vượt độ sâu lồng nhau tối đa ${MAX_NESTED_DEPTH} tại nested clip "${(step as { id?: unknown }).id}"`,
      );
    }
    const found = findChildInSubSpec(curSpec, (step as { id?: unknown }).id as string);
    if (!found || !isNestedClip(found)) {
      throw new Error(
        `composeNestedLeafWindow: chain không khớp cây — không tìm thấy nested clip "${(step as { id?: unknown }).id}" trong tầng hiện tại`,
      );
    }
    const m = found as NestedClip;
    if (ancestors.has(m.subSpec)) {
      throw new Error(
        `composeNestedLeafWindow: vòng lặp tham chiếu subSpec tại nested clip "${m.id}"`,
      );
    }
    const mSpeed = nestedEffectiveSpeed(m);
    if (!Number.isFinite(mSpeed) || mSpeed <= 0) {
      throw new Error(
        `composeNestedLeafWindow: nested clip "${m.id}" có speed không hợp lệ`,
      );
    }
    const mTrim = nestedEffectiveTrim(m);
    if (!Number.isFinite(mTrim.in) || !Number.isFinite(mTrim.out) || mTrim.out <= mTrim.in) {
      throw new Error(
        `composeNestedLeafWindow: nested clip "${m.id}" có trim không hợp lệ`,
      );
    }
    if (!Number.isFinite(m.start) || !Number.isFinite(m.duration)) {
      throw new Error(
        `composeNestedLeafWindow: nested clip "${m.id}" có start/duration không hữu hạn`,
      );
    }
    const visStart = Math.max(m.start, winLo);
    const visEnd = Math.min(m.start + m.duration, winHi);
    if (visEnd <= visStart) return null; // tầng này đã cắt hết phần còn lại
    const winLoPrime = Math.max(mTrim.in, mTrim.in + (visStart - m.start) * mSpeed);
    const winHiPrime = Math.min(mTrim.out, mTrim.in + (visEnd - m.start) * mSpeed);
    if (winHiPrime <= winLoPrime) return null;
    mapP = mapP + (m.start - mapQ) * mapK;
    mapQ = mTrim.in;
    mapK = mapK / mSpeed;
    winLo = winLoPrime;
    winHi = winHiPrime;
    ancestors.add(m.subSpec);
    curSpec = m.subSpec;
    depth += 1;
    path.push(m.id);
  }

  const foundLeaf = findChildInSubSpec(curSpec, (leaf as { id?: unknown }).id as string);
  if (!foundLeaf) {
    throw new Error(
      `composeNestedLeafWindow: không tìm thấy clip lá "${(leaf as { id?: unknown }).id}" trong tầng chứa nó`,
    );
  }
  if (isNestedClip(foundLeaf)) {
    throw new Error(
      `composeNestedLeafWindow: "${(leaf as { id?: unknown }).id}" là nested clip, không phải clip lá`,
    );
  }
  const leafStart = (foundLeaf as { start: number }).start;
  const leafEnd = leafStart + (foundLeaf as { duration: number }).duration;
  const visStart = Math.max(leafStart, winLo);
  const visEnd = Math.min(leafEnd, winHi);
  if (visEnd <= visStart) return null;
  return {
    visibleStart: visStart - leafStart,
    visibleEnd: visEnd - leafStart,
    absoluteStart: mapP + (visStart - mapQ) * mapK,
    absoluteDuration: (visEnd - visStart) * mapK,
    path,
    depth,
    cumulativeSpeed: 1 / mapK,
  };
}

// ---------------------------------------------------------------------------
// Đợt 7 — normalizeNestedClip: shape cũ (tracks trực tiếp) → shape chuẩn.
// ---------------------------------------------------------------------------

/**
 * SHAPE CŨ LÀ GÌ (đọc trước khi dùng):
 * nestedPreview.ts (luồng N5, preview) nhận diện nested clip bằng
 * duck-typing, không qua type này: { kind: "nested", id, start, duration,
 * in?, speed?, tracks: [{ kind, clips }] } — tracks nằm TRỰC TIẾP trên
 * clip, không có subSpec, không có meta/version, và cửa sổ phát được biểu
 * diễn bằng field `in` (điểm vào trong sequence con) thay cho trim
 * { in, out } của shape chuẩn. Shape chuẩn duy nhất là NestedClip mang
 * `subSpec` (xem đầu file); hàm này là cầu nối một chiều cũ → chuẩn.
 *
 * HÀNH VI (không throw với input xấu — mọi lỗi trả ok:false kèm lý do):
 * - Không phải nested clip / thiếu id/start/duration hợp lệ → ok:false.
 * - Chỉ có `tracks`: dựng subSpec { version, meta, tracks }.
 *   version = opts.version ?? clip.version (nếu là chuỗi) ?? "0.2.0"
 *   (bằng SPEC_VERSION hiện tại; không import runtime từ index.ts để
 *   tránh vòng lặp runtime index → nested → index).
 *   meta = opts.meta ?? clip.meta (nếu là object) — nếu cả hai đều thiếu
 *   thì ok:false: KHÔNG bịa width/height/fps.
 * - Chỉ có `subSpec`: giữ nguyên subSpec (spread, chỉ thay tracks bằng
 *   bản đã normalize đệ quy). Không sửa meta/version sẵn có.
 * - Cả `subSpec` và `tracks` cùng có: so sánh sâu (JSON) subSpec.tracks
 *   với tracks. Bằng nhau (kể cả cùng tham chiếu) → giữ subSpec, bỏ
 *   field tracks trùng lặp (ghi warning). Khác nhau → ok:false, KHÔNG
 *   tự chọn một bên ("fail fast khi cả hai cùng có mà khác nhau").
 * - Field `in` (legacy): nếu clip chưa có trim thì chuyển thành
 *   trim { in, out: in + duration * speed } (speed vắng = 1; đúng bất
 *   biến duration = (out − in) / speed nên clip đã chuẩn vẫn validate
 *   khớp). Nếu đã có trim: in phải khớp trim.in trong 1e-6, nếu không
 *   → ok:false; khớp thì bỏ field `in` trùng lặp (ghi warning).
 * - Đệ quy: nested clip con bên trong tracks/subSpec cũng được
 *   normalize theo cùng quy tắc (meta fallback truyền xuống = meta của
 *   tầng cha). Vòng lặp tham chiếu theo chuỗi tổ tiên → ok:false;
 *   dùng lại cùng tracks/subSpec ở clip anh em là hợp lệ (như validate).
 * - KHÔNG MUTATE input: track/clip được copy nông (spread); clip lá giữ
 *   nguyên tham chiếu (giống flattenNested). Clip đã chuẩn (có subSpec,
 *   không tracks, không in) trả về bản copy nông tương đương, warnings [].
 * - KHÔNG MẤT FIELD NỘI DUNG: mọi track/clip trong tracks/subSpec đều
 *   được mang sang (track thiếu id → gán `track-<index>` + warning; track
 *   thiếu kind → mặc định "video" + warning, cùng fallback mà
 *   nestedPreview dùng). Ngoại lệ DUY NHẤT: các field mở rộng chỉ có ở
 *   shape preview (opacity, transitionIn, transitionOut) không có chỗ
 *   trong NestedClip chuẩn nên bị bỏ và LIỆT KÊ trong warnings — caller
 *   đọc warnings để biết phần nào đã rơi; không lặng lẽ mất.
 * - Normalize CHỈ thống nhất shape, KHÔNG validate đầy đủ: kết quả vẫn
 *   cần qua validateNestedClip() (duration khớp trim, trim trong giới
 *   hạn subSpec, độ sâu...) trước khi tin dùng.
 */

/** Meta tối thiểu của VideoSpec (type-only, tránh import runtime vòng tròn). */
export interface NormalizeNestedMeta {
  name: string;
  width: number;
  height: number;
  fps: number;
}

export interface NormalizeNestedOptions {
  /** Meta dùng khi shape cũ không mang meta (bắt buộc nếu thiếu). */
  meta?: NormalizeNestedMeta;
  /** Version cho subSpec dựng mới (mặc định "0.2.0"). */
  version?: string;
}

export type NormalizeNestedResult =
  | { ok: true; clip: NestedClip; warnings: string[] }
  | { ok: false; reason: string };

function normalizeDeepEqual(a: unknown, b: unknown): boolean | null {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return null; // không so sánh được (vd tham chiếu vòng) → caller fail fast
  }
}

function normalizeMetaOf(
  rec: Record<string, unknown>,
  opts: NormalizeNestedOptions
): NormalizeNestedMeta | null {
  if (opts.meta !== undefined) return opts.meta;
  const m = rec["meta"];
  if (
    isRecord(m) &&
    typeof m["name"] === "string" &&
    isFiniteNumber(m["width"]) &&
    isFiniteNumber(m["height"]) &&
    isFiniteNumber(m["fps"])
  ) {
    return m as unknown as NormalizeNestedMeta;
  }
  return null;
}

/**
 * Chuẩn hoá một nested clip (cũ hoặc chuẩn) về shape NestedClip mang
 * subSpec. Xem header section trên để đọc đầy đủ quy tắc và giới hạn.
 */
export function normalizeNestedClip(
  clip: unknown,
  opts: NormalizeNestedOptions = {}
): NormalizeNestedResult {
  return normalizeNestedRec(clip, opts, new Set<object>(), "nested clip");
}

function normalizeNestedRec(
  clip: unknown,
  opts: NormalizeNestedOptions,
  ancestors: Set<object>,
  label: string
): NormalizeNestedResult {
  if (!isRecord(clip) || clip["kind"] !== "nested") {
    return { ok: false, reason: `${label} phải là nested clip (kind "nested")` };
  }
  const id = clip["id"];
  if (typeof id !== "string" || id.trim() === "") {
    return { ok: false, reason: `${label}.id phải là chuỗi không rỗng` };
  }
  if (!isFiniteNumber(clip["start"]) || (clip["start"] as number) < 0) {
    return { ok: false, reason: `${label}.start phải là số >= 0` };
  }
  if (!isFiniteNumber(clip["duration"]) || (clip["duration"] as number) <= 0) {
    return { ok: false, reason: `${label}.duration phải là số > 0` };
  }
  const speedRaw = clip["speed"];
  if (
    speedRaw !== undefined &&
    (!isFiniteNumber(speedRaw) || (speedRaw as number) <= 0)
  ) {
    return { ok: false, reason: `${label}.speed phải là số > 0` };
  }

  const hasSubSpec = isRecord(clip["subSpec"]);
  const hasTracks = Array.isArray(clip["tracks"]);
  if (!hasSubSpec && !hasTracks) {
    return {
      ok: false,
      reason: `${label} không có subSpec cũng không có tracks — không biết sequence con ở đâu`,
    };
  }

  const warnings: string[] = [];
  let rawTracks: unknown[];
  let subSpecBase: Record<string, unknown> | null = null;

  if (hasSubSpec && hasTracks) {
    const subTracks = (clip["subSpec"] as Record<string, unknown>)["tracks"];
    if (!Array.isArray(subTracks)) {
      return {
        ok: false,
        reason: `${label}.subSpec.tracks phải là một mảng (để so với tracks trực tiếp)`,
      };
    }
    const eq = normalizeDeepEqual(subTracks, clip["tracks"]);
    if (eq === null) {
      return {
        ok: false,
        reason: `${label} có cả subSpec.tracks và tracks nhưng không so sánh được (tham chiếu vòng?) — fail fast, không tự chọn`,
      };
    }
    if (!eq) {
      return {
        ok: false,
        reason: `${label} có cả subSpec.tracks và tracks mà nội dung khác nhau — fail fast, không tự chọn một bên`,
      };
    }
    warnings.push(`${label}: bỏ field tracks trùng lặp với subSpec.tracks, giữ subSpec`);
    rawTracks = subTracks;
    subSpecBase = clip["subSpec"] as Record<string, unknown>;
  } else if (hasSubSpec) {
    const subTracks = (clip["subSpec"] as Record<string, unknown>)["tracks"];
    if (!Array.isArray(subTracks)) {
      return { ok: false, reason: `${label}.subSpec.tracks phải là một mảng` };
    }
    rawTracks = subTracks;
    subSpecBase = clip["subSpec"] as Record<string, unknown>;
  } else {
    rawTracks = clip["tracks"] as unknown[];
  }

  if (ancestors.has(rawTracks)) {
    return {
      ok: false,
      reason: `${label} tạo vòng lặp tham chiếu tracks/subSpec (đã có trong chuỗi tổ tiên)`,
    };
  }
  const nextAncestors = new Set<object>(ancestors);
  nextAncestors.add(rawTracks);
  if (hasSubSpec) {
    nextAncestors.add(clip["subSpec"] as object);
  }

  // Meta/version cho subSpec: shape cũ dựng mới cần meta; shape chuẩn giữ nguyên.
  let resolvedMeta: NormalizeNestedMeta | null = null;
  let resolvedVersion: string | undefined;
  if (subSpecBase !== null) {
    const m = subSpecBase["meta"];
    if (
      isRecord(m) &&
      typeof m["name"] === "string" &&
      isFiniteNumber(m["width"]) &&
      isFiniteNumber(m["height"]) &&
      isFiniteNumber(m["fps"])
    ) {
      resolvedMeta = m as unknown as NormalizeNestedMeta;
    }
    if (typeof subSpecBase["version"] === "string") {
      resolvedVersion = subSpecBase["version"] as string;
    }
  } else {
    resolvedMeta = normalizeMetaOf(clip, opts);
    if (resolvedMeta === null) {
      return {
        ok: false,
        reason: `${label} dạng tracks trực tiếp nhưng thiếu meta — truyền opts.meta (project ngoài) để dựng subSpec, không bịa width/height/fps`,
      };
    }
    resolvedVersion =
      opts.version ??
      (typeof clip["version"] === "string" ? (clip["version"] as string) : "0.2.0");
  }
  // Meta truyền xuống cho clip con dạng tracks trực tiếp (cùng project).
  const childOpts: NormalizeNestedOptions = {
    ...opts,
    meta: resolvedMeta ?? opts.meta,
    version: resolvedVersion ?? opts.version,
  };

  // Normalize từng track + clip con (đệ quy cho nested con).
  const normTracks: unknown[] = [];
  for (let ti = 0; ti < rawTracks.length; ti++) {
    const track = rawTracks[ti];
    const trackLabel = `${label}.tracks[${ti}]`;
    if (!isRecord(track) || !Array.isArray(track["clips"])) {
      return { ok: false, reason: `${trackLabel} phải là một object có clips là mảng` };
    }
    const trackId =
      typeof track["id"] === "string" && track["id"] !== ""
        ? (track["id"] as string)
        : `track-${ti}`;
    if (trackId === `track-${ti}`) {
      warnings.push(`${trackLabel}: thiếu id → gán "${trackId}"`);
    }
    const trackKind =
      typeof track["kind"] === "string" && track["kind"] !== ""
        ? (track["kind"] as string)
        : "video";
    if (trackKind === "video" && track["kind"] !== "video") {
      warnings.push(`${trackLabel}: thiếu kind → mặc định "video"`);
    }
    const normClips: unknown[] = [];
    for (let ci = 0; ci < (track["clips"] as unknown[]).length; ci++) {
      const child = (track["clips"] as unknown[])[ci];
      const childLabel = `${trackLabel}.clips[${ci}]`;
      if (isRecord(child) && child["kind"] === "nested") {
        const r = normalizeNestedRec(child, childOpts, nextAncestors, childLabel);
        if (!r.ok) return r;
        warnings.push(...r.warnings);
        normClips.push(r.clip);
      } else {
        normClips.push(child);
      }
    }
    normTracks.push({
      ...track,
      id: trackId,
      kind: trackKind,
      clips: normClips,
    });
  }

  // Xử lý field `in` legacy so với trim chuẩn.
  let trim: NestedTrim | undefined;
  const trimRaw = clip["trim"];
  if (trimRaw !== undefined) {
    if (
      !isRecord(trimRaw) ||
      !isFiniteNumber(trimRaw["in"]) ||
      !isFiniteNumber(trimRaw["out"])
    ) {
      return { ok: false, reason: `${label}.trim phải là một object { in, out } là số` };
    }
    trim = { in: trimRaw["in"] as number, out: trimRaw["out"] as number };
  }
  const inRaw = clip["in"];
  if (inRaw !== undefined) {
    if (!isFiniteNumber(inRaw)) {
      return { ok: false, reason: `${label}.in phải là một số` };
    }
    if (trim !== undefined) {
      if (Math.abs(trim.in - (inRaw as number)) > NESTED_DURATION_EPSILON) {
        return {
          ok: false,
          reason: `${label} có cả trim.in (${trim.in}) và in (${inRaw}) mà khác nhau — fail fast, không tự chọn`,
        };
      }
      warnings.push(`${label}: bỏ field in trùng trim.in, giữ trim`);
    } else {
      const speed = (clip["speed"] as number | undefined) ?? 1;
      trim = {
        in: inRaw as number,
        out: (inRaw as number) + (clip["duration"] as number) * speed,
      };
      warnings.push(
        `${label}: field in legacy đã chuyển thành trim { in: ${trim.in}, out: ${trim.out} }`
      );
    }
  }

  // Field mở rộng chỉ có ở shape preview — không có chỗ trong spec chuẩn.
  for (const extra of ["opacity", "transitionIn", "transitionOut"] as const) {
    if (clip[extra] !== undefined) {
      warnings.push(
        `${label}: field "${extra}" chỉ có ở shape preview, không mang sang shape chuẩn (spec chưa có field này)`
      );
    }
  }

  const subSpec: Record<string, unknown> = {
    ...(subSpecBase ?? {}),
    version: resolvedVersion ?? "0.2.0",
    meta: resolvedMeta ?? subSpecBase?.["meta"],
    tracks: normTracks,
  };
  if (subSpec["meta"] === undefined) {
    // Shape chuẩn giữ nguyên subSpec gốc (kể cả thiếu meta): normalize chỉ
    // thống nhất shape, validateNestedClip() sẽ là nơi báo thiếu meta.
    delete subSpec["meta"];
  }

  const out: Record<string, unknown> = {
    kind: "nested",
    id: clip["id"],
    start: clip["start"],
    duration: clip["duration"],
    subSpec,
  };
  if (trim !== undefined) out["trim"] = trim;
  if (clip["speed"] !== undefined) out["speed"] = clip["speed"];
  if (clip["name"] !== undefined) out["name"] = clip["name"];
  return { ok: true, clip: out as unknown as NestedClip, warnings };
}

