/**
 * project.ts — Đọc/ghi/validate project (video-spec JSON).
 *
 * Dùng video-spec package để kiểm tra — không tự parse JSON thô rồi đoán.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { Clip, Track, TrackKind, VideoSpec } from "../../packages/video-spec/src/index.js";
import { isVideoSpec, projectDuration, SPEC_VERSION } from "../../packages/video-spec/src/index.js";
import { RENDER_VALIDATE_JS } from "./paths.js";
import { CliError } from "./args.js";

const require = createRequire(import.meta.url);

/** Validate sâu bằng render worker's validate.js (nếu load được). */
function deepValidate(spec: VideoSpec): { errors: string[]; warnings: string[] } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const validateMod = require(RENDER_VALIDATE_JS) as {
      validateSpec?: (spec: unknown) => { errors?: string[]; warnings?: string[] };
    };
    if (typeof validateMod.validateSpec === "function") {
      const r = validateMod.validateSpec(spec);
      return {
        errors: r.errors ?? [],
        warnings: r.warnings ?? [],
      };
    }
  } catch {
    // Fallback: validate cơ bản
  }
  return basicValidate(spec);
}

/** Validate cơ bản khi không load được validate.js. */
function basicValidate(spec: VideoSpec): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!spec.meta.name) errors.push("meta.name đang trống");
  if (!(spec.meta.width > 0) || !(spec.meta.height > 0)) errors.push("meta.width/height phải > 0");
  if (!(spec.meta.fps > 0)) errors.push("meta.fps phải > 0");
  for (const t of spec.tracks) {
    for (const c of t.clips) {
      if (!(c.start >= 0)) errors.push(`Clip ${c.id}: start phải >= 0`);
      if (!(c.duration > 0)) errors.push(`Clip ${c.id}: duration phải > 0`);
    }
  }
  return { errors, warnings };
}

export interface LoadedProject {
  spec: VideoSpec;
  /** Đường dẫn tuyệt đối tới file project */
  filePath: string;
}

/** Đọc project từ file JSON. Throw CliError nếu không hợp lệ. */
export async function loadProject(projectPath: string): Promise<LoadedProject> {
  const filePath = path.resolve(projectPath);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    throw new CliError(`Không đọc được file project: ${projectPath}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new CliError(`File project không phải JSON hợp lệ: ${e instanceof Error ? e.message : e}`);
  }
  if (!isVideoSpec(parsed)) {
    throw new CliError(
      `File không phải video-spec hợp lệ (version phải là ${SPEC_VERSION}, cần meta + tracks)`
    );
  }
  return { spec: parsed, filePath };
}

/** Ghi project ra file (validate nhẹ trước khi ghi). */
export async function saveProject(spec: VideoSpec, filePath: string): Promise<void> {
  if (!isVideoSpec(spec)) {
    throw new CliError("Spec không hợp lệ, từ chối ghi file");
  }
  await fs.mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(spec, null, 2) + "\n", "utf8");
}

/** Validate đầy đủ, trả về errors/warnings. */
export function validateProject(spec: VideoSpec): { errors: string[]; warnings: string[] } {
  return deepValidate(spec);
}

/** Tìm track theo kind, hoặc tạo mới nếu chưa có. */
export function findOrCreateTrack(spec: VideoSpec, kind: TrackKind): Track {
  let track = spec.tracks.find((t: Track) => t.kind === kind);
  if (!track) {
    const prefix: Record<TrackKind, string> = { video: "v", audio: "a", text: "t", sticker: "s", image: "i" };
    const n = spec.tracks.filter((t: Track) => t.kind === kind).length + 1;
    track = { id: `${prefix[kind]}${n}`, kind, clips: [] };
    spec.tracks.push(track);
  }
  return track;
}

/** Tìm clip theo ID trong toàn bộ spec. */
export function findClip(
  spec: VideoSpec,
  clipId: string
): { track: Track; clip: Clip; trackIndex: number; clipIndex: number } | null {
  for (let ti = 0; ti < spec.tracks.length; ti++) {
    const track = spec.tracks[ti];
    for (let ci = 0; ci < track.clips.length; ci++) {
      if (track.clips[ci].id === clipId) {
        return { track, clip: track.clips[ci], trackIndex: ti, clipIndex: ci };
      }
    }
  }
  return null;
}

export { projectDuration, SPEC_VERSION };
