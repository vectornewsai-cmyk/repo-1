/**
 * common.ts — Helpers dùng chung cho mọi MCP tool.
 *
 * - ToolResult helpers (ok/fail/handleError)
 * - Tìm clip theo id trong spec
 * - History (undo/redo) in-memory theo project
 */
import { z } from "zod";
import type { Clip, Track, VideoSpec } from "../../../packages/video-spec/src/index.js";
import { projectDuration } from "../../../packages/video-spec/src/index.js";
import { ValidationError, validateProjectId, validateVideoSpec } from "../validate.js";
import { loadProject, saveProject } from "../store.js";

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: `LỖI: ${message}` }], isError: true };
}

export function handleError(e: unknown): ToolResult {
  if (e instanceof ValidationError) return fail(e.message);
  if (e instanceof z.ZodError)
    return fail(
      `input không đúng định dạng: ${e.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`
    );
  return fail(e instanceof Error ? e.message : String(e));
}

/** Tìm clip bất kỳ (mọi kind) theo id. Trả về track + index. */
export function findClip(
  spec: VideoSpec,
  clipId: string
): { track: Track; trackIndex: number; clipIndex: number; clip: Clip } | null {
  for (let ti = 0; ti < spec.tracks.length; ti++) {
    const track = spec.tracks[ti];
    for (let ci = 0; ci < track.clips.length; ci++) {
      if (track.clips[ci].id === clipId) {
        return { track, trackIndex: ti, clipIndex: ci, clip: track.clips[ci] };
      }
    }
  }
  return null;
}

/** Tìm track theo id. */
export function findTrack(spec: VideoSpec, trackId: string): { track: Track; index: number } | null {
  for (let i = 0; i < spec.tracks.length; i++) {
    if (spec.tracks[i].id === trackId) return { track: spec.tracks[i], index: i };
  }
  return null;
}

// ---------------------------------------------------------------------------
// History (undo/redo) — in-memory, mỗi project 1 stack riêng, tối đa 50 bước
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;
const undoStacks = new Map<string, VideoSpec[]>();
const redoStacks = new Map<string, VideoSpec[]>();

function cloneSpec(spec: VideoSpec): VideoSpec {
  return JSON.parse(JSON.stringify(spec)) as VideoSpec;
}

/** Chụp snapshot trước khi mutate — gọi TRƯỚC mọi thay đổi spec. */
export function pushHistory(projectId: string, spec: VideoSpec): void {
  let stack = undoStacks.get(projectId);
  if (!stack) {
    stack = [];
    undoStacks.set(projectId, stack);
  }
  stack.push(cloneSpec(spec));
  if (stack.length > MAX_HISTORY) stack.shift();
  // Mutate mới → xoá redo stack
  redoStacks.set(projectId, []);
}

export async function doUndo(projectId: string): Promise<{ spec: VideoSpec; remaining: number }> {
  const pid = validateProjectId(projectId);
  const stack = undoStacks.get(pid) ?? [];
  if (stack.length === 0) throw new ValidationError("không còn bước nào để undo");
  const { spec: current } = await loadProject(pid);
  let redo = redoStacks.get(pid);
  if (!redo) {
    redo = [];
    redoStacks.set(pid, redo);
  }
  redo.push(cloneSpec(current));
  const prev = stack.pop()!;
  const clean = validateVideoSpec(prev);
  await saveProject(pid, clean);
  return { spec: clean, remaining: stack.length };
}

export async function doRedo(projectId: string): Promise<{ spec: VideoSpec; remaining: number }> {
  const pid = validateProjectId(projectId);
  const stack = redoStacks.get(pid) ?? [];
  if (stack.length === 0) throw new ValidationError("không còn bước nào để redo");
  const { spec: current } = await loadProject(pid);
  let undo = undoStacks.get(pid);
  if (!undo) {
    undo = [];
    undoStacks.set(pid, undo);
  }
  undo.push(cloneSpec(current));
  const next = stack.pop()!;
  const clean = validateVideoSpec(next);
  await saveProject(pid, clean);
  return { spec: clean, remaining: stack.length };
}

/** Mutate helper: load → pushHistory → mutate → save → trả summary. */
export async function mutateProject(
  projectId: string,
  label: string,
  mutator: (spec: VideoSpec) => void
): Promise<{ project_id: string; total_duration_sec: number }> {
  const pid = validateProjectId(projectId);
  const { spec } = await loadProject(pid);
  pushHistory(pid, spec);
  mutator(spec);
  await saveProject(pid, spec);
  return { project_id: pid, total_duration_sec: projectDuration(spec) };
}

/** Schema dùng chung: project_id. */
export const projectIdSchema = z.string().describe("ID project từ create_project");
