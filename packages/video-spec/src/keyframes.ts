/**
 * keyframes.ts — Keyframe animation cho video-spec.
 *
 * Một keyframe = một giá trị của thuộc tính tại một thời điểm (tính từ ĐẦU CLIP).
 * Render/preview nội suy giá trị giữa các keyframe kề nhau.
 *
 * NGỮ NGHĨA EASING (quan trọng, phải giống nhau ở mọi nơi implement):
 *   easing của keyframe BẮT ĐẦU đoạn được áp dụng cho toàn bộ đoạn [t_i, t_{i+1}].
 *   - "linear":  p
 *   - "ease-in":  p^2          (khởi động chậm, kết thúc nhanh)
 *   - "ease-out": 1 - (1-p)^2  (khởi động nhanh, kết thúc chậm)
 *   với p = (t - t_i) / (t_{i+1} - t_i) đã clamp về [0, 1].
 * Công thức này được mirror CHÍNH XÁC trong:
 *   - server/render/src/keyframes.js (interpolateKeyframes + buildInterpExpr)
 *   Nếu đổi công thức ở đây, PHẢI đổi cả bên kia.
 *
 * Ý NGHĨA TỪNG THUỘC TÍNH (khi có keyframes, nó GHI ĐÈ giá trị tĩnh tương ứng):
 *   x, y:    vị trí tương đối 0..1 (giống style.x/style.y của text).
 *            Cho phép ngoài [0,1] để bay ra ngoài màn hình (vd -0.3, 1.3).
 *   opacity: 0..1 (0 = trong suốt, 1 = đục hoàn toàn).
 *   scale:   hệ số nhân kích thước (1 = gốc).
 *   rotation: độ xoay (-180..180).
 *
 * TÍCH HỢP (tạm thời): file này KHÔNG được export từ index.ts (index.ts thuộc về
 * agent khác, không được sửa). Thay vào đó nó dùng "module augmentation" để gắn
 * thêm trường `animations?` vào VideoClip/TextClip — apps/web chỉ cần import file
 * này (dù chỉ import type) là augmentation có hiệu lực toàn chương trình.
 * Khi index.ts chính thức thêm `animations`, XÓA block declare module bên dưới.
 */

export type Easing = "linear" | "ease-in" | "ease-out";

export const EASINGS: readonly Easing[] = ["linear", "ease-in", "ease-out"] as const;

export interface Keyframe {
  /**
   * Thời gian TÍNH TỪ ĐẦU CLIP (giây). Phải nằm trong [0, duration của clip].
   * Hai keyframe trùng t: keyframe đứng sau (trong mảng gốc) thắng.
   */
  t: number;
  /** Giá trị của thuộc tính tại thời điểm t. */
  v: number;
  /** Easing áp dụng cho đoạn [t, t_của_keyframe_kế_tiếp]. */
  easing: Easing;
}

export interface KeyframedValue {
  keyframes: Keyframe[];
}

export type AnimatableProp = "x" | "y" | "opacity" | "scale" | "rotation";

export const ANIMATABLE_PROPS: readonly AnimatableProp[] = [
  "x",
  "y",
  "opacity",
  "scale",
  "rotation",
] as const;

/** Tập keyframe cho từng thuộc tính của một clip (tất cả optional). */
export interface ClipAnimations {
  x?: KeyframedValue;
  y?: KeyframedValue;
  opacity?: KeyframedValue;
  scale?: KeyframedValue;
  rotation?: KeyframedValue;
}

// ---------------------------------------------------------------------------
// `animations?` đã được khai báo trực tiếp trong index.ts (VideoClip, TextClip)
// nên không cần module augmentation nữa.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Nội suy
// ---------------------------------------------------------------------------

/** Áp easing cho tiến trình p (đã clamp về [0,1] bên trong). */
export function applyEasing(easing: Easing, p: number): number {
  const c = Math.min(1, Math.max(0, p));
  switch (easing) {
    case "linear":
      return c;
    case "ease-in":
      return c * c;
    case "ease-out":
      return 1 - (1 - c) * (1 - c);
  }
}

/**
 * Sắp xếp keyframe theo t tăng dần; trùng t thì giữ keyframe đứng sau.
 * Không mutate mảng gốc.
 */
export function normalizeKeyframes(kfs: Keyframe[]): Keyframe[] {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out: Keyframe[] = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === k.t) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

/**
 * Giá trị nội suy tại thời điểm t (giây, tính từ đầu clip).
 * Ngoài khoảng [t_đầu, t_cuối] thì clamp về giá trị keyframe biên.
 * @throws Error nếu mảng keyframes rỗng.
 */
export function interpolateKeyframes(kfs: Keyframe[], t: number): number {
  const ks = normalizeKeyframes(kfs);
  if (ks.length === 0) throw new Error("interpolateKeyframes: mảng keyframes rỗng");
  if (ks.length === 1) return ks[0].v;
  if (t <= ks[0].t) return ks[0].v;
  const last = ks[ks.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 0 : (t - a.t) / span;
      return a.v + (b.v - a.v) * applyEasing(a.easing, p);
    }
  }
  return last.v; // không bao giờ tới vì đã clamp ở trên
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/** Số keyframe tối đa cho một thuộc tính (tránh biểu thức FFmpeg phình quá to). */
export const MAX_KEYFRAMES_PER_PROP = 128;

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/**
 * Kiểm tra animations của một clip. Trả về danh sách lỗi (rỗng = hợp lệ).
 * @param duration độ dài clip (giây) — mọi keyframe.t phải nằm trong [0, duration].
 */
export function validateAnimations(anims: unknown, duration: number): string[] {
  const errors: string[] = [];
  if (anims === undefined || anims === null) return errors; // không có = hợp lệ
  if (typeof anims !== "object" || Array.isArray(anims)) {
    return ["animations phải là một object"];
  }
  const a = anims as Record<string, unknown>;
  for (const key of Object.keys(a)) {
    if (!(ANIMATABLE_PROPS as readonly string[]).includes(key)) {
      errors.push(`animations.${key}: thuộc tính không hỗ trợ (chỉ: ${ANIMATABLE_PROPS.join(", ")})`);
      continue;
    }
    const where = `animations.${key}`;
    const kv = a[key];
    if (typeof kv !== "object" || kv === null || Array.isArray(kv)) {
      errors.push(`${where}: phải là object { keyframes: [...] }`);
      continue;
    }
    const kfs = (kv as Record<string, unknown>)["keyframes"];
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
    kfs.forEach((kf: unknown, i: number) => {
      const w = `${where}.keyframes[${i}]`;
      if (typeof kf !== "object" || kf === null) {
        errors.push(`${w}: phải là object { t, v, easing }`);
        return;
      }
      const k = kf as Record<string, unknown>;
      if (!isFiniteNumber(k["t"]) || (k["t"] as number) < 0 || (k["t"] as number) > duration) {
        errors.push(`${w}.t phải là số trong [0, ${duration}] (độ dài clip), nhận được: ${JSON.stringify(k["t"])}`);
      }
      if (!isFiniteNumber(k["v"])) {
        errors.push(`${w}.v phải là số hữu hạn, nhận được: ${JSON.stringify(k["v"])}`);
      }
      if (!(EASINGS as readonly string[]).includes(k["easing"] as string)) {
        errors.push(`${w}.easing phải là một trong ${EASINGS.join(" | ")}, nhận được: ${JSON.stringify(k["easing"])}`);
      }
    });
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Metadata cho UI
// ---------------------------------------------------------------------------

export interface PropMeta {
  /** Nhãn tiếng Việt */
  label: string;
  min: number;
  max: number;
  step: number;
  /** Đơn vị hiển thị ("%", "°", "×", "" ) */
  unit: string;
  /** Giá trị mặc định khi tạo keyframe mới */
  def: number;
  hint: string;
}

export const PROP_META: Record<AnimatableProp, PropMeta> = {
  x: {
    label: "Vị trí ngang (X)", min: -1, max: 2, step: 0.01, unit: "", def: 0.5,
    hint: "0 = mép trái, 1 = mép phải. Ngoài khoảng để bay ra ngoài màn hình.",
  },
  y: {
    label: "Vị trí dọc (Y)", min: -1, max: 2, step: 0.01, unit: "", def: 0.5,
    hint: "0 = mép trên, 1 = mép dưới.",
  },
  opacity: {
    label: "Độ mờ", min: 0, max: 1, step: 0.01, unit: "%", def: 1,
    hint: "0 = trong suốt hoàn toàn, 1 = đục hoàn toàn.",
  },
  scale: {
    label: "Tỉ lệ", min: 0.1, max: 4, step: 0.05, unit: "×", def: 1,
    hint: "1 = kích thước gốc.",
  },
  rotation: {
    label: "Xoay", min: -180, max: 180, step: 1, unit: "°", def: 0,
    hint: "Góc xoay quanh tâm clip.",
  },
};

export const EASING_LABEL: Record<Easing, string> = {
  linear: "Tuyến tính",
  "ease-in": "Chậm lúc đầu",
  "ease-out": "Chậm lúc cuối",
};

/** Format giá trị theo prop để hiển thị (vd opacity 0.5 -> "50%"). */
export function formatPropValue(prop: AnimatableProp, v: number): string {
  const meta = PROP_META[prop];
  if (prop === "opacity") return `${Math.round(v * 100)}%`;
  const r = Math.round(v * 100) / 100;
  return `${r}${meta.unit}`;
}
