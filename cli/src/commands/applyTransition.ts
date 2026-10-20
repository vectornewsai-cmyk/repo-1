/**
 * applyTransition.ts — vcut apply-transition: gắn transition vào clip.
 */
import { isTransitionType, TRANSITION_TYPES } from "../../../packages/video-spec/src/transitions.js";
import { CliError, numFlag, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { findClip, loadProject, saveProject } from "../project.js";

export async function cmdApplyTransition(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const clipId = reqFlag(args.flags, "clip");
  const type = reqFlag(args.flags, "type");
  const duration = numFlag(args.flags, "duration", 0.5);
  const side = optFlag(args.flags, "side", "out").toLowerCase();

  if (!isTransitionType(type))
    throw new CliError(`--type không hợp lệ. Chọn một trong: ${(TRANSITION_TYPES as readonly string[]).join(", ")}`);
  if (!(duration > 0) || duration > 2)
    throw new CliError(`--duration phải trong khoảng 0..2 giây, nhận được: ${duration}`);
  if (!["in", "out", "both"].includes(side))
    throw new CliError("--side phải là: in, out, hoặc both");

  const { spec, filePath } = await loadProject(projectPath);
  const found = findClip(spec, clipId);
  if (!found) throw new CliError(`Không tìm thấy clip: ${clipId}`);
  if (found.clip.kind !== "video")
    throw new CliError(`Transition chỉ áp dụng cho clip video (clip ${clipId} là ${found.clip.kind})`);

  const transition = { type, duration };
  if (side === "in" || side === "both") found.clip.transitionIn = transition;
  if (side === "out" || side === "both") found.clip.transitionOut = transition;

  await saveProject(spec, filePath);
  console.log(JSON.stringify({ ok: true, clip_id: clipId, type, duration, side }, null, 2));
}
