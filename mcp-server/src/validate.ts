/**
 * validate.ts — Validate đầu vào của mọi MCP tool, chặt chẽ theo
 * video-spec v0.1.0 (packages/video-spec/src/index.ts).
 *
 * Quy ước: mọi hàm validate* ném ValidationError với message tiếng Anh
 * rõ ràng (để AI agent đọc và tự sửa), không bao giờ trả về dữ liệu nửa vời.
 */
import type {
  AudioClip,
  Clip,
  TextClip,
  TextStyle,
  Track,
  TrackKind,
  Transition,
  VideoClip,
  VideoMeta,
  VideoSpec,
} from "../../packages/video-spec/src/index.js";
import { SPEC_VERSION } from "../../packages/video-spec/src/index.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function reqString(v: unknown, name: string, maxLen = 500): string {
  if (typeof v !== "string" || v.length === 0)
    throw new ValidationError(`${name} phải là chuỗi khác rỗng (nhận được: ${JSON.stringify(v)})`);
  if (v.length > maxLen)
    throw new ValidationError(`${name} quá dài (tối đa ${maxLen} ký tự)`);
  return v;
}

function reqId(v: unknown, name: string): string {
  const s = reqString(v, name, 64);
  if (!ID_RE.test(s))
    throw new ValidationError(
      `${name} chỉ gồm chữ/số/gạch ngang/gạch dưới, tối đa 64 ký tự (nhận được: ${JSON.stringify(s)})`
    );
  return s;
}

function reqFiniteNum(v: unknown, name: string): number {
  if (typeof v !== "number" || !Number.isFinite(v))
    throw new ValidationError(`${name} phải là số hữu hạn (nhận được: ${JSON.stringify(v)})`);
  return v;
}

function reqNonNegNum(v: unknown, name: string): number {
  const n = reqFiniteNum(v, name);
  if (n < 0) throw new ValidationError(`${name} phải >= 0 (nhận được: ${n})`);
  return n;
}

function reqPosNum(v: unknown, name: string): number {
  const n = reqFiniteNum(v, name);
  if (n <= 0) throw new ValidationError(`${name} phải > 0 (nhận được: ${n})`);
  return n;
}

function reqPosInt(v: unknown, name: string, max: number): number {
  const n = reqPosNum(v, name);
  if (!Number.isInteger(n) || n > max)
    throw new ValidationError(`${name} phải là số nguyên 1..${max} (nhận được: ${n})`);
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
    throw new ValidationError(
      `${name} phải là đường dẫn tương đối an toàn trong thư mục media (không "..", không đường dẫn tuyệt đối). Nhận được: ${JSON.stringify(s)}`
    );
  return s;
}

function reqHexColor(v: unknown, name: string): string {
  const s = reqString(v, name, 7);
  if (!HEX_COLOR_RE.test(s))
    throw new ValidationError(`${name} phải dạng hex "#rgb" hoặc "#rrggbb" (nhận được: ${JSON.stringify(s)})`);
  return s;
}

function optEnum<T extends string>(v: unknown, name: string, allowed: readonly T[]): T | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v))
    throw new ValidationError(`${name} phải là một trong [${allowed.join(", ")}] (nhận được: ${JSON.stringify(v)})`);
  return v as T;
}

function validateTransition(v: unknown, name: string): Transition {
  if (!isObj(v)) throw new ValidationError(`${name} phải là object {type, duration}`);
  const type = optEnum(v["type"], `${name}.type`, ["fade", "none"] as const) ?? "fade";
  const duration = reqNonNegNum(v["duration"], `${name}.duration`);
  if (type !== "none" && duration === 0)
    throw new ValidationError(`${name}.duration phải > 0 khi type="${type}"`);
  return { type, duration };
}

function validateTextStyle(v: unknown, name: string): TextStyle {
  if (!isObj(v)) throw new ValidationError(`${name} phải là object TextStyle`);
  const style: TextStyle = {
    fontFamily: reqString(v["fontFamily"], `${name}.fontFamily`, 100),
    fontSize: reqPosNum(v["fontSize"], `${name}.fontSize`),
    color: reqHexColor(v["color"], `${name}.color`),
  };
  if (style.fontSize > 500)
    throw new ValidationError(`${name}.fontSize quá lớn (tối đa 500)`);
  if (v["backgroundColor"] !== undefined)
    style.backgroundColor = reqHexColor(v["backgroundColor"], `${name}.backgroundColor`);
  if (v["bold"] !== undefined) {
    if (typeof v["bold"] !== "boolean") throw new ValidationError(`${name}.bold phải là boolean`);
    style.bold = v["bold"];
  }
  if (v["italic"] !== undefined) {
    if (typeof v["italic"] !== "boolean") throw new ValidationError(`${name}.italic phải là boolean`);
    style.italic = v["italic"];
  }
  for (const k of ["x", "y"] as const) {
    if (v[k] !== undefined) {
      const n = reqFiniteNum(v[k], `${name}.${k}`);
      if (n < 0 || n > 1) throw new ValidationError(`${name}.${k} phải trong khoảng 0..1 (nhận được: ${n})`);
      style[k] = n;
    }
  }
  const animation = optEnum(v["animation"], `${name}.animation`, ["none", "fadeUp", "typewriter"] as const);
  if (animation !== undefined) style.animation = animation;
  return style;
}

function validateVideoClip(v: unknown): VideoClip {
  if (!isObj(v)) throw new ValidationError(`clip phải là object`);
  const inp = reqNonNegNum(v["in"], "clip.in");
  const out = reqPosNum(v["out"], "clip.out");
  if (out <= inp) throw new ValidationError(`clip.out (${out}) phải > clip.in (${inp})`);
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
    if (o < 0 || o > 1) throw new ValidationError(`clip.opacity phải trong 0..1 (nhận được: ${o})`);
    clip.opacity = o;
  }
  return clip;
}

function validateAudioClip(v: unknown): AudioClip {
  if (!isObj(v)) throw new ValidationError(`clip phải là object`);
  const inp = reqNonNegNum(v["in"], "clip.in");
  const out = reqPosNum(v["out"], "clip.out");
  if (out <= inp) throw new ValidationError(`clip.out (${out}) phải > clip.in (${inp})`);
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
    if (vol < 0 || vol > 2) throw new ValidationError(`clip.volume phải trong 0..2 (nhận được: ${vol})`);
    clip.volume = vol;
  }
  if (v["fadeIn"] !== undefined) clip.fadeIn = reqNonNegNum(v["fadeIn"], "clip.fadeIn");
  if (v["fadeOut"] !== undefined) clip.fadeOut = reqNonNegNum(v["fadeOut"], "clip.fadeOut");
  return clip;
}

function validateTextClip(v: unknown): TextClip {
  if (!isObj(v)) throw new ValidationError(`clip phải là object`);
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
  if (!isObj(v)) throw new ValidationError(`clip phải là object`);
  if (v["kind"] !== trackKind)
    throw new ValidationError(
      `clip.kind ("${String(v["kind"])}") không khớp track kind ("${trackKind}")`
    );
  switch (trackKind) {
    case "video":
      return validateVideoClip(v);
    case "audio":
      return validateAudioClip(v);
    case "text":
      return validateTextClip(v);
    case "sticker":
    case "image":
      // TODO: implement validateStickerClip / validateImageClip
      throw new ValidationError(`track kind "${trackKind}" chưa được hỗ trợ trong MCP validator`);
    default:
      throw new ValidationError(`track kind không hỗ trợ: "${trackKind}"`);
  }
}

function validateTrack(v: unknown, seenIds: Set<string>): Track {
  if (!isObj(v)) throw new ValidationError(`track phải là object`);
  const id = reqId(v["id"], "track.id");
  if (seenIds.has(id)) throw new ValidationError(`trùng track.id: "${id}"`);
  seenIds.add(id);
  const kind = optEnum(v["kind"], "track.kind", ["video", "audio", "text"] as const);
  if (!kind) throw new ValidationError(`track.kind bắt buộc: "video" | "audio" | "text"`);
  if (!Array.isArray(v["clips"])) throw new ValidationError(`track.clips phải là mảng`);
  const clipIds = new Set<string>();
  const clips = (v["clips"] as unknown[]).map((c) => {
    const clip = validateClipForTrack(c, kind);
    if (clipIds.has(clip.id)) throw new ValidationError(`trùng clip.id "${clip.id}" trong track "${id}"`);
    clipIds.add(clip.id);
    return clip;
  });
  const track: Track = { id, kind, clips };
  if (v["label"] !== undefined) track.label = reqString(v["label"], "track.label", 100);
  return track;
}

function validateMeta(v: unknown): VideoMeta {
  if (!isObj(v)) throw new ValidationError(`meta phải là object {name, width, height, fps}`);
  return {
    name: reqString(v["name"], "meta.name", 200),
    width: reqPosInt(v["width"], "meta.width", 7680),
    height: reqPosInt(v["height"], "meta.height", 4320),
    fps: reqPosNum(v["fps"], "meta.fps"),
  };
}

/** Validate toàn bộ video-spec. Dùng trước mọi thao tác ghi và trước khi render. */
export function validateVideoSpec(v: unknown): VideoSpec {
  if (!isObj(v)) throw new ValidationError(`spec phải là object JSON`);
  if (v["version"] !== SPEC_VERSION)
    throw new ValidationError(
      `spec.version phải là "${SPEC_VERSION}" (nhận được: ${JSON.stringify(v["version"])})`
    );
  const meta = validateMeta(v["meta"]);
  if (meta.fps > 120) throw new ValidationError(`meta.fps tối đa 120 (nhận được: ${meta.fps})`);
  if (!Array.isArray(v["tracks"])) throw new ValidationError(`spec.tracks phải là mảng`);
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
  if (!isObj(v)) throw new ValidationError(`input phải là object`);
  const out: CreateProjectInput = {
    name: reqString(v["name"], "name", 200),
    width: reqPosInt(v["width"], "width", 7680),
    height: reqPosInt(v["height"], "height", 4320),
    fps: reqPosNum(v["fps"], "fps"),
  };
  if (out.fps > 120) throw new ValidationError(`fps tối đa 120`);
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
  if (!isObj(v)) throw new ValidationError(`input phải là object`);
  const track_kind = optEnum(v["track_kind"], "track_kind", ["video", "audio", "text"] as const);
  if (!track_kind) throw new ValidationError(`track_kind bắt buộc: "video" | "audio" | "text"`);
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
  if (!isObj(v)) throw new ValidationError(`input phải là object`);
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
  type: "fade" | "none";
  duration: number;
}

export function validateApplyTransitionInput(v: unknown): ApplyTransitionInput {
  if (!isObj(v)) throw new ValidationError(`input phải là object`);
  const direction = optEnum(v["direction"], "direction", ["in", "out"] as const);
  if (!direction) throw new ValidationError(`direction bắt buộc: "in" | "out"`);
  const type = optEnum(v["type"], "type", ["fade", "none"] as const) ?? "fade";
  const duration = reqNonNegNum(v["duration"], "duration");
  if (type !== "none" && duration === 0)
    throw new ValidationError(`duration phải > 0 khi type="${type}"`);
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
  if (!isObj(v)) throw new ValidationError(`input phải là object`);
  const out_path = reqString(v["out_path"], "out_path", 300);
  if (
    out_path.startsWith("/") ||
    out_path.startsWith("\\") ||
    out_path.includes("..") ||
    /[<>:"|?*\x00-\x1f]/.test(out_path) ||
    !out_path.toLowerCase().endsWith(".mp4")
  )
    throw new ValidationError(
      `out_path phải là đường dẫn tương đối an toàn trong thư mục renders/, kết thúc bằng ".mp4" (không "..", không tuyệt đối). Nhận được: ${JSON.stringify(out_path)}`
    );
  const out: RenderVideoInput = {
    project_id: validateProjectId(v["project_id"]),
    out_path,
  };
  if (v["media_dir"] !== undefined) out.media_dir = reqString(v["media_dir"], "media_dir", 500);
  return out;
}
