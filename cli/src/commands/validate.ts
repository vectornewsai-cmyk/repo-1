/**
 * validate.ts — vcut validate: kiểm tra project hợp lệ không.
 */
import { reqFlag, type ParsedArgs } from "../args.js";
import { loadProject, validateProject } from "../project.js";
import type { Track } from "../../../packages/video-spec/src/index.js";

export async function cmdValidate(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);

  const { spec } = await loadProject(projectPath);
  const { errors, warnings } = validateProject(spec);

  const result = {
    ok: errors.length === 0,
    errors,
    warnings,
    track_count: spec.tracks.length,
    clip_count: spec.tracks.reduce((n: number, t: Track) => n + t.clips.length, 0),
  };
  console.log(JSON.stringify(result, null, 2));
  if (errors.length > 0) process.exitCode = 1;
}
