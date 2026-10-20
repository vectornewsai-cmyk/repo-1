/**
 * info.ts — vcut info: tóm tắt project.
 */
import { reqFlag, type ParsedArgs } from "../args.js";
import { loadProject, projectDuration } from "../project.js";
import type { Track } from "../../../packages/video-spec/src/index.js";

export async function cmdInfo(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);

  const { spec } = await loadProject(projectPath);
  const tracks = spec.tracks.map((t: Track) => ({
    id: t.id,
    kind: t.kind,
    clips: t.clips.length,
    muted: !!t.muted,
    locked: !!t.locked,
    hidden: !!t.hidden,
  }));

  console.log(
    JSON.stringify(
      {
        ok: true,
        name: spec.meta.name,
        spec_version: spec.version,
        width: spec.meta.width,
        height: spec.meta.height,
        fps: spec.meta.fps,
        duration_sec: Math.round(projectDuration(spec) * 100) / 100,
        tracks,
      },
      null,
      2
    )
  );
}
