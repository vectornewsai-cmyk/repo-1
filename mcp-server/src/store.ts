/**
 * store.ts — Lưu/đọc project (video-spec JSON) trên đĩa.
 *
 * Mọi đường dẫn đều được cố định trong thư mục của mcp-server;
 * project_id đã validate (chỉ [A-Za-z0-9_-]) nên không thể path traversal.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { VideoSpec } from "../../packages/video-spec/src/index.js";
import { SPEC_VERSION } from "../../packages/video-spec/src/index.js";
import { validateVideoSpec, ValidationError } from "./validate.js";

const HERE = path.dirname(fileURLToPath(import.meta.url)); // .../mcp-server/dist/mcp-server/src
export const SERVER_DIR = path.resolve(HERE, "..", "..", ".."); // .../mcp-server
export const REPO_ROOT = path.resolve(SERVER_DIR, ".."); // .../repo-1
export const PROJECTS_DIR = path.join(SERVER_DIR, "projects");
export const RENDERS_DIR = path.join(SERVER_DIR, "renders");
export const RENDER_WORKER_JS = path.join(REPO_ROOT, "server", "render", "src", "render.js");
export const DEFAULT_MEDIA_DIR = path.join(REPO_ROOT, "server", "render", "examples", "media");

interface ProjectMeta {
  mediaDir: string;
  createdAt: string;
  updatedAt: string;
}

function projectFile(projectId: string): string {
  return path.join(PROJECTS_DIR, `${projectId}.json`);
}

function metaFile(projectId: string): string {
  return path.join(PROJECTS_DIR, `${projectId}.meta.json`);
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  await fs.mkdir(RENDERS_DIR, { recursive: true });
}

export function newProjectId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `proj_${Date.now().toString(36)}_${rand}`;
}

/** Resolve media_dir an toàn: thư mục tồn tại, nằm trong repo hoặc đường dẫn tuyệt đối hợp lệ. */
export async function resolveMediaDir(input: string | undefined): Promise<string> {
  const raw = input ?? DEFAULT_MEDIA_DIR;
  const resolved = path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(REPO_ROOT, raw);
  // Chặn traversal ra ngoài repo khi dùng đường dẫn tương đối
  if (!path.isAbsolute(raw)) {
    const rel = path.relative(REPO_ROOT, resolved);
    if (rel.startsWith("..") || path.isAbsolute(rel))
      throw new ValidationError(`media_dir không được trỏ ra ngoài repo: ${JSON.stringify(input)}`);
  }
  let st;
  try {
    st = await fs.stat(resolved);
  } catch {
    throw new ValidationError(`media_dir không tồn tại: ${resolved}`);
  }
  if (!st.isDirectory()) throw new ValidationError(`media_dir không phải thư mục: ${resolved}`);
  return resolved;
}

/** Resolve out_path an toàn: bắt buộc nằm trong RENDERS_DIR. */
export function resolveOutPath(outPath: string): string {
  const resolved = path.resolve(RENDERS_DIR, outPath);
  const rel = path.relative(RENDERS_DIR, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel))
    throw new ValidationError(`out_path không hợp lệ (đã bị chặn): ${JSON.stringify(outPath)}`);
  return resolved;
}

export async function createProject(spec: VideoSpec, mediaDir: string): Promise<{ projectId: string }> {
  await ensureDirs();
  const projectId = newProjectId();
  const now = new Date().toISOString();
  await fs.writeFile(projectFile(projectId), JSON.stringify(spec, null, 2), "utf8");
  const meta: ProjectMeta = { mediaDir, createdAt: now, updatedAt: now };
  await fs.writeFile(metaFile(projectId), JSON.stringify(meta, null, 2), "utf8");
  return { projectId };
}

export async function loadProject(projectId: string): Promise<{ spec: VideoSpec; meta: ProjectMeta }> {
  await ensureDirs();
  let raw: string;
  try {
    raw = await fs.readFile(projectFile(projectId), "utf8");
  } catch {
    throw new ValidationError(`không tìm thấy project_id "${projectId}"`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError(`file project "${projectId}" bị hỏng (JSON không parse được)`);
  }
  const spec = validateVideoSpec(parsed);
  let meta: ProjectMeta;
  try {
    meta = JSON.parse(await fs.readFile(metaFile(projectId), "utf8")) as ProjectMeta;
  } catch {
    meta = { mediaDir: DEFAULT_MEDIA_DIR, createdAt: "", updatedAt: "" };
  }
  return { spec, meta };
}

export async function saveProject(projectId: string, spec: VideoSpec): Promise<void> {
  await ensureDirs();
  // Validate lại trước khi ghi — không bao giờ lưu spec sai
  const clean = validateVideoSpec(spec);
  let meta: ProjectMeta;
  try {
    meta = JSON.parse(await fs.readFile(metaFile(projectId), "utf8")) as ProjectMeta;
  } catch {
    meta = { mediaDir: DEFAULT_MEDIA_DIR, createdAt: "", updatedAt: "" };
  }
  meta.updatedAt = new Date().toISOString();
  await fs.writeFile(projectFile(projectId), JSON.stringify(clean, null, 2), "utf8");
  await fs.writeFile(metaFile(projectId), JSON.stringify(meta, null, 2), "utf8");
}

/** Tìm clip video theo id trong spec (dùng cho apply_transition). */
export function findVideoClip(
  spec: VideoSpec,
  clipId: string
): { trackIndex: number; clipIndex: number } | null {
  for (let ti = 0; ti < spec.tracks.length; ti++) {
    const track = spec.tracks[ti];
    if (track.kind !== "video") continue;
    for (let ci = 0; ci < track.clips.length; ci++) {
      if (track.clips[ci].id === clipId) return { trackIndex: ti, clipIndex: ci };
    }
  }
  return null;
}

export { SPEC_VERSION };
