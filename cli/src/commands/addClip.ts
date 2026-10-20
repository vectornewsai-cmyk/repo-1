/**
 * addClip.ts — vcut add-clip: thêm clip media (video/audio/image) vào project.
 */
import type { AudioClip, Clip, ImageClip, TrackKind, VideoClip } from "../../../packages/video-spec/src/index.js";
import { CliError, numFlag, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { newId } from "../ids.js";
import { findOrCreateTrack, loadProject, saveProject } from "../project.js";

const KINDS: TrackKind[] = ["video", "audio", "image"];

export async function cmdAddClip(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const src = reqFlag(args.flags, "src");
  const start = numFlag(args.flags, "start", 0);
  const duration = numFlag(args.flags, "duration", 0);
  const kindRaw = optFlag(args.flags, "kind", "video").toLowerCase();
  const inPoint = numFlag(args.flags, "in", 0);
  const outPointRaw = args.flags["out"];

  if (!KINDS.includes(kindRaw as TrackKind))
    throw new CliError(`--kind phải là một trong: ${KINDS.join(", ")}`);
  const kind = kindRaw as TrackKind;

  if (start < 0) throw new CliError("--start phải >= 0");
  if (!(duration > 0)) throw new CliError("--duration phải > 0");
  if (inPoint < 0) throw new CliError("--in phải >= 0");

  const outPoint = outPointRaw !== undefined && outPointRaw !== true ? Number(outPointRaw) : inPoint + duration;
  if (!Number.isFinite(outPoint) || outPoint <= inPoint)
    throw new CliError("--out phải > --in");

  const { spec, filePath } = await loadProject(projectPath);
  const track = findOrCreateTrack(spec, kind);
  const clipId = newId("clip");

  if (kind === "video") {
    const clip: VideoClip = { kind: "video", id: clipId, src, start, duration, in: inPoint, out: outPoint };
    track.clips.push(clip);
  } else if (kind === "audio") {
    const clip: AudioClip = { kind: "audio", id: clipId, src, start, duration, in: inPoint, out: outPoint };
    track.clips.push(clip);
  } else {
    const clip: ImageClip = { kind: "image", id: clipId, src, start, duration };
    track.clips.push(clip);
  }

  // Sắp xếp clip theo start để timeline gọn
  track.clips.sort((a: Clip, b: Clip) => a.start - b.start);

  await saveProject(spec, filePath);
  console.log(JSON.stringify({ ok: true, clip_id: clipId, track_id: track.id, kind, src, start, duration }, null, 2));
}
