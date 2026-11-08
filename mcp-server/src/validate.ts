/**
 * validate.ts — Validate đầu vào của mọi MCP tool, chặt chẽ theo
 * video-spec v0.1.0 (packages/video-spec/src/index.ts).
 *
 * Quy ước (đợt 63 R9): mọi hàm validate* ném ValidationError với
 * - `code`: mã ổn định SCREAMING_SNAKE (catalog VALIDATION_CODES dưới
 *   đây, mirror giao thức mã lỗi bridge→web đợt 62 R5: {error,
 *   errorCode, errorParams}) để AI agent / script khớp lỗi bằng máy
 *   thay vì parse câu tiếng Việt;
 * - `message`: câu tiếng Việt rõ ràng, GIỮ NGUYÊN từng chữ so với
 *   trước đợt 63 (test validateCodes63R9 khóa byte-identical) — toàn
 *   bộ mặt MCP (mô tả tool, zod .describe, tiền tố "LỖI:") vốn đã
 *   là tiếng Việt nên message giữ tiếng Việt cho nhất quán, KHÔNG
 *   dịch sang tiếng Anh, KHÔNG nối vào dict i18n web (MCP/CLI không
 *   có locale, không có t(), client là máy/agent chứ không phải user
 *   cuối xem UI);
 * - `params`: dữ liệu máy đọc được (field, min/max/value...) — toàn
 *   string/number/boolean, JSON-safe.
 * Không bao giờ trả về dữ liệu nửa vời.
 */
import type {
  AudioClip,
  AudioEffects,
  Clip,
  ClipMotion,
  ImageClip,
  KeyframedValue,
  StickerClip,
  TextClip,
  TextStyle,
  Track,
  TrackKind,
  Transition,
  VideoClip,
  VideoEffect,
  VideoFilter,
  VideoMeta,
  VideoSpec,
} from "../../packages/video-spec/src/index.js";
import {
  SPEC_VERSION,
  migrateMotion,
  validateMotion,
  TRANSITION_TYPES,
  TEXT_ANIMATIONS,
  LUT_IDS,
  EFFECT_TYPES,
  SPEED_MIN,
  SPEED_MAX,
  ANIMATABLE_PROPS,
  EASINGS,
  MAX_KEYFRAMES_PER_PROP,
} from "../../packages/video-spec/src/index.js";

/**
 * Catalog mã lỗi MCP — mọi `new ValidationError(...)` trong
 * mcp-server/src và mọi `fail(msg, code)` ở tool handler đều dùng
 * một mã trong này (test validateCodes63R9 quét tĩnh: không điểm
 * nào được dùng mã ngoài catalog, không điểm nào thiếu mã). Mã mới
 * thêm vào đây + vào test battery.
 */
export const VALIDATION_CODES = [
  "DUPLICATE_EFFECT",
  "DUPLICATE_ID",
  "EMPTY_ARRAY",
  "ENUM_INVALID",
  "ENUM_REQUIRED",
  "FPS_TOO_HIGH",
  "ID_INVALID",
  "INTEGER_OUT_OF_RANGE",
  "INVALID_HEX_COLOR",
  "INVALID_OUTPUT_NAME",
  "INVALID_OUTPUT_PATH",
  "KIND_MISMATCH",
  "MISSING_INPUT",
  "MOTION_INVALID",
  "NOTHING_TO_REDO",
  "NOTHING_TO_UNDO",
  "NOT_AN_ARRAY",
  "NOT_AN_OBJECT",
  "NOT_A_BOOLEAN",
  "NOT_A_DIRECTORY",
  "NOT_A_FILE",
  "NOT_FOUND",
  "NUMBER_NEGATIVE",
  "NUMBER_NOT_POSITIVE",
  "NUMBER_OUT_OF_RANGE",
  "NUMBER_REQUIRED",
  "OUT_NOT_AFTER_IN",
  "PROJECT_CORRUPT",
  "PROJECT_EMPTY",
  "RENDER_FAILED",
  "RENDER_WORKER_MISSING",
  "SCRIPT_FAILED",
  "STRING_REQUIRED",
  "STRING_TOO_LONG",
  "TOO_MANY_KEYFRAMES",
  "TRANSITION_DURATION_ZERO",
  "UNSAFE_PATH",
  "UNSUPPORTED_PROPERTY",
  "UNSUPPORTED_TRACK_KIND",
  "VERSION_MISMATCH",
  "WRONG_CLIP_KIND",
] as const;
export type ValidationCode = (typeof VALIDATION_CODES)[number];

/** Params máy đọc được kèm ValidationError — chỉ string/number/boolean. */
export type ValidationParams = Record<string, string | number | boolean>;

export class ValidationError extends Error {
  readonly code: ValidationCode;
  readonly params: ValidationParams;
  constructor(code: ValidationCode, message: string, params: ValidationParams = {}) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.params = params;
  }
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function reqString(v: unknown, name: string, maxLen = 500): string {
  if (typeof v !== "string" || v.length === 0)
    throw new ValidationError("STRING_REQUIRED", `${name} phải là chuỗi khác rỗng (nhận được: ${JSON.stringify(v)})`, { field: name });
  if (v.length > maxLen)
    throw new ValidationError("STRING_TOO_LONG", `${name} quá dài (tối đa ${maxLen} ký tự)`, { field: name, maxLen, length: v.length });
  return v;
}

function reqId(v: unknown, name: string): string {
  const s = reqString(v, name, 64);
  if (!ID_RE.test(s))
    throw new ValidationError("ID_INVALID", 
      `${name} chỉ gồm chữ/số/gạch ngang/gạch dưới, tối đa 64 ký tự (nhận được: ${JSON.stringify(s)})`, { field: name, value: s });
  return s;
}

function reqFiniteNum(v: unknown, name: string): number {
  if (typeof v !== "number" || !Number.isFinite(v))
    throw new ValidationError("NUMBER_REQUIRED", `${name} phải là số hữu hạn (nhận được: ${JSON.stringify(v)})`, { field: name });
  return v;
}

function reqNonNegNum(v: unknown, name: string): number {
  const n = reqFiniteNum(v, name);
  if (n < 0) throw new ValidationError("NUMBER_NEGATIVE", `${name} phải >= 0 (nhận được: ${n})`, { field: name, min: 0, value: n });
  return n;
}

function reqPosNum(v: unknown, name: string): number {
  const n = reqFiniteNum(v, name);
  if (n <= 0) throw new ValidationError("NUMBER_NOT_POSITIVE", `${name} phải > 0 (nhận được: ${n})`, { field: name, min: 0, value: n });
  return n;
}

function reqPosInt(v: unknown, name: string, max: number): number {
  const n = reqPosNum(v, name);
  if (!Number.isInteger(n) || n > max)
    throw new ValidationError("INTEGER_OUT_OF_RANGE", `${name} phải là số nguyên 1..${max} (nhận được: ${n})`, { field: name, min: 1, max, value: n });
  return n;
}

/** src media: chỉ cho phép đường dẫn tương đối an toàn, cấm path traversal. */
function reqSafeSrc(v: unknown, name: string): string {
  const s = reqString(v, name, 300);
  if (
    s.startsWith("/") ||
    s.startsWith("\\") ||
    s.includes("..") ||
    /[<>:"|?*\x00-\x1f]/.test(s)
  )
    throw new ValidationError("UNSAFE_PATH", 
      `${name} phải là đường dẫn tương đối an toàn trong thư mục media (không "..", không đường dẫn tuyệt đối). Nhận được: ${JSON.stringify(s)}`, { field: name, value: s });
  return s;
}

function reqHexColor(v: unknown, name: string): string {
  const s = reqString(v, name, 7);
  if (!HEX_COLOR_RE.test(s))
    throw new ValidationError("INVALID_HEX_COLOR", `${name} phải dạng hex "#rgb" hoặc "#rrggbb" (nhận được: ${JSON.stringify(s)})`, { field: name, value: s });
  return s;
}

function optEnum<T extends string>(v: unknown, name: string, allowed: readonly T[]): T | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v))
    throw new ValidationError("ENUM_INVALID", `${name} phải là một trong [${allowed.join(", ")}] (nhận được: ${JSON.stringify(v)})`, { field: name, allowed: allowed.join(", ") });
  return v as T;
}

function validateTransition(v: unknown, name: string): Transition {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `${name} phải là object {type, duration}`, { field: name });
  const type = optEnum(v["type"], `${name}.type`, TRANSITION_TYPES) ?? "fade";
  const duration = reqNonNegNum(v["duration"], `${name}.duration`);
  if (type !== "none" && duration === 0)
    throw new ValidationError("TRANSITION_DURATION_ZERO", `${name}.duration phải > 0 khi type="${type}"`, { field: `${name}.duration`, type });
  return { type, duration };
}

function validateTextStyle(v: unknown, name: string): TextStyle {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `${name} phải là object TextStyle`, { field: name });
  const style: TextStyle = {
    fontFamily: reqString(v["fontFamily"], `${name}.fontFamily`, 100),
    fontSize: reqPosNum(v["fontSize"], `${name}.fontSize`),
    color: reqHexColor(v["color"], `${name}.color`),
  };
  if (style.fontSize > 500)
    throw new ValidationError("NUMBER_OUT_OF_RANGE", `${name}.fontSize quá lớn (tối đa 500)`, { field: `${name}.fontSize`, max: 500, value: style.fontSize });
  if (v["backgroundColor"] !== undefined)
    style.backgroundColor = reqHexColor(v["backgroundColor"], `${name}.backgroundColor`);
  if (v["bold"] !== undefined) {
    if (typeof v["bold"] !== "boolean") throw new ValidationError("NOT_A_BOOLEAN", `${name}.bold phải là boolean`, { field: `${name}.bold` });
    style.bold = v["bold"];
  }
  if (v["italic"] !== undefined) {
    if (typeof v["italic"] !== "boolean") throw new ValidationError("NOT_A_BOOLEAN", `${name}.italic phải là boolean`, { field: `${name}.italic` });
    style.italic = v["italic"];
  }
  for (const k of ["x", "y"] as const) {
    if (v[k] !== undefined) {
      const n = reqFiniteNum(v[k], `${name}.${k}`);
      if (n < 0 || n > 1) throw new ValidationError("NUMBER_OUT_OF_RANGE", `${name}.${k} phải trong khoảng 0..1 (nhận được: ${n})`, { field: `${name}.${k}`, min: 0, max: 1, value: n });
      style[k] = n;
    }
  }
  const animation = optEnum(v["animation"], `${name}.animation`, TEXT_ANIMATIONS);
  if (animation !== undefined) style.animation = animation;
  return style;
}

/** Validate speed (0.25–4) và reverse (boolean) cho video/audio clip. */
function validateSpeedFields(
  v: Record<string, unknown>,
  clipId: string
): { speed?: number; reverse?: boolean } {
  const out: { speed?: number; reverse?: boolean } = {};
  if (v["speed"] !== undefined) {
    const s = reqFiniteNum(v["speed"], "clip.speed");
    if (s < SPEED_MIN || s > SPEED_MAX)
      throw new ValidationError("NUMBER_OUT_OF_RANGE", 
        `clip.speed phải trong khoảng ${SPEED_MIN}–${SPEED_MAX} (nhận được: ${s})`, { field: "clip.speed", min: SPEED_MIN, max: SPEED_MAX, value: s });
    out.speed = s;
  }
  if (v["reverse"] !== undefined) {
    if (typeof v["reverse"] !== "boolean")
      throw new ValidationError("NOT_A_BOOLEAN", 
        `clip.reverse phải là boolean (nhận được: ${JSON.stringify(v["reverse"])})`, { field: "clip.reverse" });
    out.reverse = v["reverse"];
  }
  return out;
}

/** Validate keyframe animations (x, y, opacity, scale, rotation). */
function validateClipAnimations(
  v: unknown,
  duration: number,
  clipId: string
): Record<string, { keyframes: Array<{ t: number; v: number; easing: string }> }> | undefined {
  if (v === undefined) return undefined;
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip.animations phải là một object`, { field: "clip.animations" });
  const anims: Record<string, unknown> = {};
  for (const key of Object.keys(v)) {
    if (!(ANIMATABLE_PROPS as readonly string[]).includes(key))
      throw new ValidationError("UNSUPPORTED_PROPERTY", 
        `clip.animations.${key}: thuộc tính không hỗ trợ (chỉ: ${ANIMATABLE_PROPS.join(", ")})`, { field: `clip.animations.${key}`, allowed: ANIMATABLE_PROPS.join(", ") });
    const kv = v[key];
    if (!isObj(kv) || !Array.isArray(kv["keyframes"]))
      throw new ValidationError("NOT_AN_OBJECT", `clip.animations.${key} phải là object { keyframes: [...] }`, { field: `clip.animations.${key}` });
    const kfs = kv["keyframes"] as unknown[];
    if (kfs.length === 0)
      throw new ValidationError("EMPTY_ARRAY", `clip.animations.${key}.keyframes: mảng rỗng — cần ít nhất 1 keyframe`, { field: `clip.animations.${key}.keyframes` });
    if (kfs.length > MAX_KEYFRAMES_PER_PROP)
      throw new ValidationError("TOO_MANY_KEYFRAMES", 
        `clip.animations.${key}.keyframes: quá ${MAX_KEYFRAMES_PER_PROP} keyframe`, { field: `clip.animations.${key}.keyframes`, max: MAX_KEYFRAMES_PER_PROP, value: kfs.length });
    anims[key] = {
      keyframes: kfs.map((kf, i) => {
        if (!isObj(kf))
          throw new ValidationError("NOT_AN_OBJECT", `clip.animations.${key}.keyframes[${i}] phải là object { t, v, easing }`, { field: `clip.animations.${key}.keyframes[${i}]` });
        const t = reqFiniteNum(kf["t"], `clip.animations.${key}.keyframes[${i}].t`);
        if (t < 0 || t > duration)
          throw new ValidationError("NUMBER_OUT_OF_RANGE", 
            `clip.animations.${key}.keyframes[${i}].t phải trong [0, ${duration}] (nhận được: ${t})`, { field: `clip.animations.${key}.keyframes[${i}].t`, min: 0, max: duration, value: t });
        const val = reqFiniteNum(kf["v"], `clip.animations.${key}.keyframes[${i}].v`);
        const easing = optEnum(kf["easing"], `clip.animations.${key}.keyframes[${i}].easing`, EASINGS);
        if (!easing)
          throw new ValidationError("ENUM_REQUIRED", 
            `clip.animations.${key}.keyframes[${i}].easing bắt buộc: ${EASINGS.join(" | ")}`, { field: `clip.animations.${key}.keyframes[${i}].easing`, allowed: EASINGS.join(" | ") });
        return { t, v: val, easing };
      }),
    };
  }
  return anims as Record<string, { keyframes: Array<{ t: number; v: number; easing: string }> }>;
}

/** Validate chroma key { color, similarity?, blend? }. */
function validateChromaKey(v: unknown): VideoClip["chromaKey"] {
  if (v === undefined) return undefined;
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip.chromaKey phải là một object { color, similarity?, blend? }`, { field: "clip.chromaKey" });
  const color = reqString(v["color"], "clip.chromaKey.color", 7);
  if (!/^#([0-9a-fA-F]{6})$/.test(color))
    throw new ValidationError("INVALID_HEX_COLOR", 
      `clip.chromaKey.color phải là hex #rrggbb (vd "#00FF00"), nhận được: ${JSON.stringify(color)}`, { field: "clip.chromaKey.color", value: color });
  const out: NonNullable<VideoClip["chromaKey"]> = { color };
  if (v["similarity"] !== undefined) {
    const s = reqFiniteNum(v["similarity"], "clip.chromaKey.similarity");
    if (s < 0 || s > 1)
      throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.chromaKey.similarity phải trong 0..1 (nhận được: ${s})`, { field: "clip.chromaKey.similarity", min: 0, max: 1, value: s });
    out.similarity = s;
  }
  if (v["blend"] !== undefined) {
    const b = reqFiniteNum(v["blend"], "clip.chromaKey.blend");
    if (b < 0 || b > 1)
      throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.chromaKey.blend phải trong 0..1 (nhận được: ${b})`, { field: "clip.chromaKey.blend", min: 0, max: 1, value: b });
    out.blend = b;
  }
  return out;
}

/** Validate LUT filter { lut?, color? }. */
function validateVideoFilter(v: unknown): VideoFilter | undefined {
  if (v === undefined) return undefined;
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip.filter phải là một object { lut?, color? }`, { field: "clip.filter" });
  const lut = optEnum(v["lut"], "clip.filter.lut", LUT_IDS);
  const color = validateColorAdjustMcp(v["color"]);
  const out: VideoFilter = {};
  if (lut !== undefined) out.lut = lut;
  if (color !== undefined) out.color = color;
  return out;
}

/** Validate ColorAdjust { brightness..shadows }, mỗi param -100..100. */
function validateColorAdjustMcp(v: unknown): VideoFilter["color"] | undefined {
  if (v === undefined) return undefined;
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip.filter.color phải là một object`, { field: "clip.filter.color" });
  const keys = [
    "brightness",
    "contrast",
    "saturation",
    "temperature",
    "tint",
    "highlights",
    "shadows",
  ] as const;
  const out: Record<string, number> = {};
  for (const k of Object.keys(v)) {
    if (!(keys as readonly string[]).includes(k))
      throw new ValidationError("UNSUPPORTED_PROPERTY", `clip.filter.color.${k} không được hỗ trợ`, { field: `clip.filter.color.${k}` });
  }
  for (const k of keys) {
    const raw = (v as Record<string, unknown>)[k];
    if (raw === undefined) continue;
    const n = reqFiniteNum(raw, `clip.filter.color.${k}`);
    if (n < -100 || n > 100)
      throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.filter.color.${k} phải trong -100..100 (nhận được: ${n})`, { field: `clip.filter.color.${k}`, min: -100, max: 100, value: n });
    out[k] = n;
  }
  return out as VideoFilter["color"];
}

/** Validate mảng video effects [{ type, intensity? }]. */
function validateVideoEffects(v: unknown): VideoEffect[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) throw new ValidationError("NOT_AN_ARRAY", `clip.effects phải là một mảng`, { field: "clip.effects" });
  const seen = new Set<string>();
  return v.map((e, i) => {
    if (!isObj(e))
      throw new ValidationError("NOT_AN_OBJECT", `clip.effects[${i}] phải là object { type, intensity? }`, { field: `clip.effects[${i}]` });
    const type = optEnum(e["type"], `clip.effects[${i}].type`, EFFECT_TYPES);
    if (!type)
      throw new ValidationError("ENUM_REQUIRED", `clip.effects[${i}].type bắt buộc: ${EFFECT_TYPES.join(", ")}`, { field: `clip.effects[${i}].type`, allowed: EFFECT_TYPES.join(", ") });
    if (seen.has(type))
      throw new ValidationError("DUPLICATE_EFFECT", `clip.effects[${i}]: trùng effect "${type}" — mỗi loại chỉ dùng 1 lần`, { field: `clip.effects[${i}]`, value: type });
    seen.add(type);
    const effect: VideoEffect = { type };
    if (e["intensity"] !== undefined) {
      const it = reqFiniteNum(e["intensity"], `clip.effects[${i}].intensity`);
      if (it < 0 || it > 1)
        throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.effects[${i}].intensity phải trong 0..1 (nhận được: ${it})`, { field: `clip.effects[${i}].intensity`, min: 0, max: 1, value: it });
      effect.intensity = it;
    }
    return effect;
  });
}

function validateVideoClip(v: unknown): VideoClip {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip phải là object`, { field: "clip" });
  const inp = reqNonNegNum(v["in"], "clip.in");
  const out = reqPosNum(v["out"], "clip.out");
  if (out <= inp) throw new ValidationError("OUT_NOT_AFTER_IN", `clip.out (${out}) phải > clip.in (${inp})`, { field: "clip.out", value: out });
  const duration = reqPosNum(v["duration"], "clip.duration");
  const clip: VideoClip = {
    kind: "video",
    id: reqId(v["id"], "clip.id"),
    src: reqSafeSrc(v["src"], "clip.src"),
    start: reqNonNegNum(v["start"], "clip.start"),
    duration,
    in: inp,
    out,
  };
  if (v["transitionIn"] !== undefined) clip.transitionIn = validateTransition(v["transitionIn"], "clip.transitionIn");
  if (v["transitionOut"] !== undefined) clip.transitionOut = validateTransition(v["transitionOut"], "clip.transitionOut");
  if (v["opacity"] !== undefined) {
    const o = reqFiniteNum(v["opacity"], "clip.opacity");
    if (o < 0 || o > 1) throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.opacity phải trong 0..1 (nhận được: ${o})`, { field: "clip.opacity", min: 0, max: 1, value: o });
    clip.opacity = o;
  }
  // Phase 3: speed / reverse
  Object.assign(clip, validateSpeedFields(v, clip.id));
  // Phase 3: keyframe animations
  const anims = validateClipAnimations(v["animations"], duration, clip.id);
  if (anims !== undefined) clip.animations = anims;
  // Phase 3b: chroma key
  const chroma = validateChromaKey(v["chromaKey"]);
  if (chroma !== undefined) clip.chromaKey = chroma;
  // Phase 3c: LUT filter
  const filter = validateVideoFilter(v["filter"]);
  if (filter !== undefined) clip.filter = filter;
  // Phase 3c: video effects
  const effects = validateVideoEffects(v["effects"]);
  if (effects !== undefined) clip.effects = effects;
  // R1-076: audio effects cho tiếng kế thừa của video clip
  const vafx = validateAudioEffects(v["audioEffects"]);
  if (vafx !== undefined) clip.audioEffects = vafx;
  // Phase 9 đợt 13 C4: motion — migrate project cũ rồi mới validate.
  // Trước đợt này validateVideoClip không đọc v["motion"] nên MCP load /
  // save / render đều LẶNG LẼ LÀM MẤT motion: spec qua MCP rồi ghi ra file
  // tạm cho render worker cũng không còn motion để cổng render cứu.
  // Nay: migrateMotion cứu weights 0 / thiếu frames / blur {} (cùng rule
  // set với cổng render đợt 11 P6 + cổng web đợt 12 T4), rồi validateMotion
  // bắt lỗi ngoài phạm vi migrate. Vì store.loadProject, store.saveProject
  // và mọi tool MCP đều đi qua validateVideoSpec nên một chỗ này phủ hết
  // các cổng MCP (load, save, get_project, render, export preset).
  // HỆ QUẢ GHI RÕ: motion không cứu được nay throw ValidationError ở cổng
  // load thay vì lặng lẽ rơi mất như trước — nhất quán với cổng render
  // (validate.js cũng fail các shape đó); không project MCP nào đã lưu
  // chứa motion (grep projects/*.json ngày 27/10 = 0) nên không vỡ dữ liệu cũ.
  if (v["motion"] !== undefined) {
    const migrated = migrateMotion(v["motion"]);
    try {
      validateMotion(migrated.motion, "video");
    } catch (e) {
      throw new ValidationError("MOTION_INVALID", `clip.motion không hợp lệ: ${(e as Error).message}`, { field: "clip.motion" });
    }
    clip.motion = migrated.motion as ClipMotion;
  }
  return clip;
}

/** Validate volumeKeyframes { keyframes: [{ t, v, easing }] } cho audio clip (R1-063). */
function validateVolumeKeyframes(v: unknown, duration: number, clipId: string): KeyframedValue {
  if (!isObj(v) || !Array.isArray(v["keyframes"]))
    throw new ValidationError("NOT_AN_OBJECT", `clip.volumeKeyframes phải là object { keyframes: [...] }`, { field: "clip.volumeKeyframes" });
  const kfs = v["keyframes"] as unknown[];
  if (kfs.length === 0)
    throw new ValidationError("EMPTY_ARRAY", `clip.volumeKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe`, { field: "clip.volumeKeyframes.keyframes" });
  if (kfs.length > MAX_KEYFRAMES_PER_PROP)
    throw new ValidationError("TOO_MANY_KEYFRAMES", 
      `clip.volumeKeyframes.keyframes: quá ${MAX_KEYFRAMES_PER_PROP} keyframe`, { field: "clip.volumeKeyframes.keyframes", max: MAX_KEYFRAMES_PER_PROP, value: kfs.length });
  return {
    keyframes: kfs.map((kf, i) => {
      const w = `clip.volumeKeyframes.keyframes[${i}]`;
      if (!isObj(kf))
        throw new ValidationError("NOT_AN_OBJECT", `${w} phải là object { t, v, easing }`, { field: w });
      const t = reqFiniteNum(kf["t"], `${w}.t`);
      if (t < 0 || t > duration)
        throw new ValidationError("NUMBER_OUT_OF_RANGE", `${w}.t phải trong [0, ${duration}] (nhận được: ${t})`, { field: `${w}.t`, min: 0, max: duration, value: t });
      const val = reqFiniteNum(kf["v"], `${w}.v`);
      if (val < 0 || val > 1)
        throw new ValidationError("NUMBER_OUT_OF_RANGE", `${w}.v phải trong 0..1 (nhận được: ${val})`, { field: `${w}.v`, min: 0, max: 1, value: val });
      const easing = optEnum(kf["easing"], `${w}.easing`, EASINGS);
      if (!easing)
        throw new ValidationError("ENUM_REQUIRED", `${w}.easing bắt buộc: ${EASINGS.join(" | ")}`, { field: `${w}.easing`, allowed: EASINGS.join(" | ") });
      return { t, v: val, easing };
    }),
  };
}

/**
 * Validate AudioEffects cho audio clip (R1-076).
 * Trả về object đã chuẩn hoá, hoặc undefined nếu input undefined.
 */
function validateAudioEffects(v: unknown): AudioEffects | undefined {
  if (v === undefined) return undefined;
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip.audioEffects phải là object`, { field: "clip.audioEffects" });
  const fx: AudioEffects = {};
  const numIn = (key: string, min: number, max: number): number | undefined => {
    const raw = (v as Record<string, unknown>)[key];
    if (raw === undefined) return undefined;
    const n = reqFiniteNum(raw, `clip.audioEffects.${key}`);
    if (n < min || n > max)
      throw new ValidationError("NUMBER_OUT_OF_RANGE", 
        `clip.audioEffects.${key} phải trong [${min}, ${max}] (nhận được: ${n})`, { field: `clip.audioEffects.${key}`, min, max, value: n });
    return n;
  };
  const bass = numIn("bass", -12, 12);
  if (bass !== undefined) fx.bass = bass;
  const treble = numIn("treble", -12, 12);
  if (treble !== undefined) fx.treble = treble;
  const nr = numIn("noiseReduction", 0, 1);
  if (nr !== undefined) fx.noiseReduction = nr;
  const rev = numIn("reverb", 0, 1);
  if (rev !== undefined) fx.reverb = rev;
  const cRaw = (v as Record<string, unknown>)["compressor"];
  if (cRaw !== undefined) {
    if (!isObj(cRaw)) throw new ValidationError("NOT_AN_OBJECT", `clip.audioEffects.compressor phải là object`, { field: "clip.audioEffects.compressor" });
    const c = cRaw as Record<string, unknown>;
    const cnum = (key: string, min: number, max: number): number | undefined => {
      const raw = c[key];
      if (raw === undefined) return undefined;
      const n = reqFiniteNum(raw, `clip.audioEffects.compressor.${key}`);
      if (n < min || n > max)
        throw new ValidationError("NUMBER_OUT_OF_RANGE", 
          `clip.audioEffects.compressor.${key} phải trong [${min}, ${max}] (nhận được: ${n})`, { field: `clip.audioEffects.compressor.${key}`, min, max, value: n });
      return n;
    };
    const comp: NonNullable<AudioEffects["compressor"]> = {};
    const thr = cnum("thresholdDb", -60, 0);
    if (thr !== undefined) comp.thresholdDb = thr;
    const ratio = cnum("ratio", 1, 20);
    if (ratio !== undefined) comp.ratio = ratio;
    const atk = cnum("attackMs", 0.1, 2000);
    if (atk !== undefined) comp.attackMs = atk;
    const rel = cnum("releaseMs", 10, 9000);
    if (rel !== undefined) comp.releaseMs = rel;
    fx.compressor = comp;
  }
  return fx;
}

function validateAudioClip(v: unknown): AudioClip {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip phải là object`, { field: "clip" });  const inp = reqNonNegNum(v["in"], "clip.in");
  const out = reqPosNum(v["out"], "clip.out");
  if (out <= inp) throw new ValidationError("OUT_NOT_AFTER_IN", `clip.out (${out}) phải > clip.in (${inp})`, { field: "clip.out", value: out });
  const clip: AudioClip = {
    kind: "audio",
    id: reqId(v["id"], "clip.id"),
    src: reqSafeSrc(v["src"], "clip.src"),
    start: reqNonNegNum(v["start"], "clip.start"),
    duration: reqPosNum(v["duration"], "clip.duration"),
    in: inp,
    out,
  };
  if (v["volume"] !== undefined) {
    const vol = reqFiniteNum(v["volume"], "clip.volume");
    if (vol < 0 || vol > 2) throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.volume phải trong 0..2 (nhận được: ${vol})`, { field: "clip.volume", min: 0, max: 2, value: vol });
    clip.volume = vol;
  }
  if (v["fadeIn"] !== undefined) clip.fadeIn = reqNonNegNum(v["fadeIn"], "clip.fadeIn");
  if (v["fadeOut"] !== undefined) clip.fadeOut = reqNonNegNum(v["fadeOut"], "clip.fadeOut");
  // R1-063: volumeKeyframes — passthrough (không làm mất như các field đã validate).
  if (v["volumeKeyframes"] !== undefined) {
    clip.volumeKeyframes = validateVolumeKeyframes(v["volumeKeyframes"], clip.duration, clip.id);
  }
  // R1-076: audioEffects — passthrough + validate.
  const afx = validateAudioEffects(v["audioEffects"]);
  if (afx !== undefined) clip.audioEffects = afx;
  // Phase 3: speed / reverse (audio)
  Object.assign(clip, validateSpeedFields(v, clip.id));
  return clip;
}

function validateTextClip(v: unknown): TextClip {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip phải là object`, { field: "clip" });
  return {
    kind: "text",
    id: reqId(v["id"], "clip.id"),
    text: reqString(v["text"], "clip.text", 2000),
    start: reqNonNegNum(v["start"], "clip.start"),
    duration: reqPosNum(v["duration"], "clip.duration"),
    style: validateTextStyle(v["style"], "clip.style"),
  };
}

/** Validate 1 clip theo đúng kind của track chứa nó. */
export function validateClipForTrack(v: unknown, trackKind: TrackKind): Clip {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip phải là object`, { field: "clip" });
  if (v["kind"] !== trackKind)
    throw new ValidationError("KIND_MISMATCH", 
      `clip.kind ("${String(v["kind"])}") không khớp track kind ("${trackKind}")`, { field: "clip.kind", expected: trackKind, value: String(v["kind"]) });
  switch (trackKind) {
    case "video":
      return validateVideoClip(v);
    case "audio":
      return validateAudioClip(v);
    case "text":
      return validateTextClip(v);
    case "sticker":
      return validateStickerClip(v);
    case "image":
      return validateImageClip(v);
    default:
      throw new ValidationError("UNSUPPORTED_TRACK_KIND", `track kind không hỗ trợ: "${trackKind}"`, { field: "track.kind", value: trackKind });
  }
}

function validateStickerClip(v: unknown): StickerClip {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip phải là object`, { field: "clip" });
  const clip: StickerClip = {
    kind: "sticker",
    id: reqId(v["id"], "clip.id"),
    src: reqSafeSrc(v["src"], "clip.src"),
    start: reqNonNegNum(v["start"], "clip.start"),
    duration: reqPosNum(v["duration"], "clip.duration"),
  };
  for (const k of ["x", "y"] as const) {
    if (v[k] !== undefined) {
      const n = reqFiniteNum(v[k], `clip.${k}`);
      if (n < 0 || n > 1)
        throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.${k} phải trong khoảng 0..1 (nhận được: ${n})`, { field: `clip.${k}`, min: 0, max: 1, value: n });
      clip[k] = n;
    }
  }
  if (v["scale"] !== undefined) {
    const s = reqFiniteNum(v["scale"], "clip.scale");
    if (s <= 0) throw new ValidationError("NUMBER_NOT_POSITIVE", `clip.scale phải > 0 (nhận được: ${s})`, { field: "clip.scale", min: 0, value: s });
    clip.scale = s;
  }
  if (v["opacity"] !== undefined) {
    const o = reqFiniteNum(v["opacity"], "clip.opacity");
    if (o < 0 || o > 1) throw new ValidationError("NUMBER_OUT_OF_RANGE", `clip.opacity phải trong 0..1 (nhận được: ${o})`, { field: "clip.opacity", min: 0, max: 1, value: o });
    clip.opacity = o;
  }
  if (v["rotation"] !== undefined) {
    clip.rotation = reqFiniteNum(v["rotation"], "clip.rotation");
  }
  return clip;
}

function validateImageClip(v: unknown): ImageClip {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `clip phải là object`, { field: "clip" });
  const clip: ImageClip = {
    kind: "image",
    id: reqId(v["id"], "clip.id"),
    src: reqSafeSrc(v["src"], "clip.src"),
    start: reqNonNegNum(v["start"], "clip.start"),
    duration: reqPosNum(v["duration"], "clip.duration"),
  };
  const fit = optEnum(v["fit"], "clip.fit", ["contain", "cover"] as const);
  if (fit !== undefined) clip.fit = fit;
  return clip;
}

function validateTrack(v: unknown, seenIds: Set<string>): Track {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `track phải là object`, { field: "track" });
  const id = reqId(v["id"], "track.id");
  if (seenIds.has(id)) throw new ValidationError("DUPLICATE_ID", `trùng track.id: "${id}"`, { field: "track.id", value: id });
  seenIds.add(id);
  const kind = optEnum(v["kind"], "track.kind", ["video", "audio", "text", "sticker", "image"] as const);
  if (!kind) throw new ValidationError("ENUM_REQUIRED", `track.kind bắt buộc: "video" | "audio" | "text" | "sticker" | "image"`, { field: "track.kind", allowed: "video | audio | text | sticker | image" });
  if (!Array.isArray(v["clips"])) throw new ValidationError("NOT_AN_ARRAY", `track.clips phải là mảng`, { field: "track.clips" });
  const clipIds = new Set<string>();
  const clips = (v["clips"] as unknown[]).map((c) => {
    const clip = validateClipForTrack(c, kind);
    if (clipIds.has(clip.id)) throw new ValidationError("DUPLICATE_ID", `trùng clip.id "${clip.id}" trong track "${id}"`, { field: "clip.id", value: clip.id });
    clipIds.add(clip.id);
    return clip;
  });
  const track: Track = { id, kind, clips };
  if (v["label"] !== undefined) track.label = reqString(v["label"], "track.label", 100);
  // R1-054: track controls — passthrough để MCP không làm mất flag.
  for (const flag of ["muted", "locked", "hidden"] as const) {
    if (v[flag] !== undefined) {
      if (typeof v[flag] !== "boolean")
        throw new ValidationError("NOT_A_BOOLEAN", `track.${flag} phải là boolean`, { field: `track.${flag}` });
      track[flag] = v[flag];
    }
  }
  return track;
}

function validateMeta(v: unknown): VideoMeta {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `meta phải là object {name, width, height, fps}`, { field: "meta" });
  return {
    name: reqString(v["name"], "meta.name", 200),
    width: reqPosInt(v["width"], "meta.width", 7680),
    height: reqPosInt(v["height"], "meta.height", 4320),
    fps: reqPosNum(v["fps"], "meta.fps"),
  };
}

/** Validate toàn bộ video-spec. Dùng trước mọi thao tác ghi và trước khi render. */
export function validateVideoSpec(v: unknown): VideoSpec {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `spec phải là object JSON`, { field: "spec" });
  if (v["version"] !== SPEC_VERSION)
    throw new ValidationError("VERSION_MISMATCH", 
      `spec.version phải là "${SPEC_VERSION}" (nhận được: ${JSON.stringify(v["version"])})`, { field: "spec.version", expected: SPEC_VERSION, received: JSON.stringify(v["version"]) });
  const meta = validateMeta(v["meta"]);
  if (meta.fps > 120) throw new ValidationError("FPS_TOO_HIGH", `meta.fps tối đa 120 (nhận được: ${meta.fps})`, { field: "meta.fps", max: 120, value: meta.fps });
  if (!Array.isArray(v["tracks"])) throw new ValidationError("NOT_AN_ARRAY", `spec.tracks phải là mảng`, { field: "spec.tracks" });
  // LƯU Ý: project mới tạo được phép có tracks rỗng (đang xây dựng dở).
  // render_video sẽ từ chối project trống bằng message riêng, rõ ràng hơn.
  const seen = new Set<string>();
  const tracks = (v["tracks"] as unknown[]).map((t) => validateTrack(t, seen));
  return { version: SPEC_VERSION, meta, tracks };
}

// ---------------------------------------------------------------------------
// Validate input từng tool
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  name: string;
  width: number;
  height: number;
  fps: number;
  media_dir?: string;
}

export function validateCreateProjectInput(v: unknown): CreateProjectInput {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `input phải là object`, { field: "input" });
  const out: CreateProjectInput = {
    name: reqString(v["name"], "name", 200),
    width: reqPosInt(v["width"], "width", 7680),
    height: reqPosInt(v["height"], "height", 4320),
    fps: reqPosNum(v["fps"], "fps"),
  };
  if (out.fps > 120) throw new ValidationError("FPS_TOO_HIGH", `fps tối đa 120`, { field: "fps", max: 120, value: out.fps });
  if (v["media_dir"] !== undefined) out.media_dir = reqString(v["media_dir"], "media_dir", 500);
  return out;
}

export function validateProjectId(v: unknown): string {
  return reqId(v, "project_id");
}

export interface AddClipInput {
  project_id: string;
  track_kind: TrackKind;
  clip: Clip;
  track_id?: string;
  track_label?: string;
}

export function validateAddClipInput(v: unknown): AddClipInput {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `input phải là object`, { field: "input" });
  const track_kind = optEnum(v["track_kind"], "track_kind", ["video", "audio", "text", "sticker", "image"] as const);
  if (!track_kind) throw new ValidationError("ENUM_REQUIRED", `track_kind bắt buộc: "video" | "audio" | "text" | "sticker" | "image"`, { field: "track_kind", allowed: "video | audio | text | sticker | image" });
  const out: AddClipInput = {
    project_id: validateProjectId(v["project_id"]),
    track_kind,
    clip: validateClipForTrack(v["clip"], track_kind),
  };
  if (v["track_id"] !== undefined) out.track_id = reqId(v["track_id"], "track_id");
  if (v["track_label"] !== undefined) out.track_label = reqString(v["track_label"], "track_label", 100);
  return out;
}

export interface AddTextInput {
  project_id: string;
  text: string;
  start: number;
  duration: number;
  style?: TextStyle;
  track_id?: string;
}

export function validateAddTextInput(v: unknown): AddTextInput {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `input phải là object`, { field: "input" });
  const out: AddTextInput = {
    project_id: validateProjectId(v["project_id"]),
    text: reqString(v["text"], "text", 2000),
    start: reqNonNegNum(v["start"], "start"),
    duration: reqPosNum(v["duration"], "duration"),
  };
  if (v["style"] !== undefined) out.style = validateTextStyle(v["style"], "style");
  if (v["track_id"] !== undefined) out.track_id = reqId(v["track_id"], "track_id");
  return out;
}

export interface ApplyTransitionInput {
  project_id: string;
  clip_id: string;
  direction: "in" | "out";
  type: (typeof TRANSITION_TYPES)[number];
  duration: number;
}

export function validateApplyTransitionInput(v: unknown): ApplyTransitionInput {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `input phải là object`, { field: "input" });
  const direction = optEnum(v["direction"], "direction", ["in", "out"] as const);
  if (!direction) throw new ValidationError("ENUM_REQUIRED", `direction bắt buộc: "in" | "out"`, { field: "direction", allowed: "in | out" });
  const type = optEnum(v["type"], "type", TRANSITION_TYPES) ?? "fade";
  const duration = reqNonNegNum(v["duration"], "duration");
  if (type !== "none" && duration === 0)
    throw new ValidationError("TRANSITION_DURATION_ZERO", `duration phải > 0 khi type="${type}"`, { field: "duration", type });
  return {
    project_id: validateProjectId(v["project_id"]),
    clip_id: reqId(v["clip_id"], "clip_id"),
    direction,
    type,
    duration,
  };
}

export interface RenderVideoInput {
  project_id: string;
  out_path: string;
  media_dir?: string;
}

/**
 * out_path: cho phép đường dẫn tương đối (kể cả có thư mục con) NHƯNG
 * bắt buộc nằm trong thư mục renders/, cấm ".." và đường dẫn tuyệt đối.
 */
export function validateRenderVideoInput(v: unknown): RenderVideoInput {
  if (!isObj(v)) throw new ValidationError("NOT_AN_OBJECT", `input phải là object`, { field: "input" });
  const out_path = reqString(v["out_path"], "out_path", 300);
  if (
    out_path.startsWith("/") ||
    out_path.startsWith("\\") ||
    out_path.includes("..") ||
    /[<>:"|?*\x00-\x1f]/.test(out_path) ||
    !out_path.toLowerCase().endsWith(".mp4")
  )
    throw new ValidationError("INVALID_OUTPUT_PATH", 
      `out_path phải là đường dẫn tương đối an toàn trong thư mục renders/, kết thúc bằng ".mp4" (không "..", không tuyệt đối). Nhận được: ${JSON.stringify(out_path)}`, { field: "out_path", value: out_path });
  const out: RenderVideoInput = {
    project_id: validateProjectId(v["project_id"]),
    out_path,
  };
  if (v["media_dir"] !== undefined) out.media_dir = reqString(v["media_dir"], "media_dir", 500);
  return out;
}
