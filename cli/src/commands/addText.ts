/**
 * addText.ts — vcut add-text: thêm clip chữ vào project.
 */
import type { Clip, TextClip } from "../../../packages/video-spec/src/index.js";
import { TEXT_ANIMATIONS } from "../../../packages/video-spec/src/textfx.js";
import { CliError, numFlag, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { newId } from "../ids.js";
import { findOrCreateTrack, loadProject, saveProject } from "../project.js";

export async function cmdAddText(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const text = reqFlag(args.flags, "text");
  const start = numFlag(args.flags, "start", 0);
  const duration = numFlag(args.flags, "duration", 3);

  const fontSize = numFlag(args.flags, "font-size", 48);
  const color = optFlag(args.flags, "color", "#ffffff");
  const backgroundColor = args.flags["bg"] !== undefined ? String(args.flags["bg"]) : undefined;
  const fontFamily = optFlag(args.flags, "font", "Noto Sans");
  const x = numFlag(args.flags, "x", 0.5);
  const y = numFlag(args.flags, "y", 0.5);
  const animation = optFlag(args.flags, "animation", "none");
  const bold = args.flags["bold"] === true || args.flags["bold"] === "true";
  const italic = args.flags["italic"] === true || args.flags["italic"] === "true";

  if (start < 0) throw new CliError("--start phải >= 0");
  if (!(duration > 0)) throw new CliError("--duration phải > 0");
  if (!(fontSize > 0)) throw new CliError("--font-size phải > 0");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new CliError(`--color phải là hex #rrggbb, nhận được: ${color}`);
  if (x < 0 || x > 1 || y < 0 || y > 1) throw new CliError("--x và --y phải trong khoảng 0..1");
  if (!(TEXT_ANIMATIONS as readonly string[]).includes(animation))
    throw new CliError(`--animation không hợp lệ. Chọn một trong: ${(TEXT_ANIMATIONS as readonly string[]).join(", ")}`);

  const { spec, filePath } = await loadProject(projectPath);
  const track = findOrCreateTrack(spec, "text");
  const clipId = newId("text");

  const clip: TextClip = {
    kind: "text",
    id: clipId,
    text,
    start,
    duration,
    style: {
      fontFamily,
      fontSize,
      color,
      ...(backgroundColor ? { backgroundColor } : {}),
      ...(bold ? { bold: true } : {}),
      ...(italic ? { italic: true } : {}),
      x,
      y,
      animation: animation as (typeof TEXT_ANIMATIONS)[number],
    },
  };
  track.clips.push(clip);
  track.clips.sort((a: Clip, b: Clip) => a.start - b.start);

  await saveProject(spec, filePath);
  console.log(JSON.stringify({ ok: true, clip_id: clipId, track_id: track.id, text, start, duration }, null, 2));
}
