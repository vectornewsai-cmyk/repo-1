/**
 * setSpeed.ts — vcut set-speed: đặt tốc độ phát cho clip video/audio.
 */
import { SPEED_MAX, SPEED_MIN } from "../../../packages/video-spec/src/speed.js";
import { CliError, numFlag, reqFlag, type ParsedArgs } from "../args.js";
import { findClip, loadProject, saveProject } from "../project.js";

export async function cmdSetSpeed(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const clipId = reqFlag(args.flags, "clip");
  const speed = numFlag(args.flags, "speed", 0);

  if (!(speed >= SPEED_MIN && speed <= SPEED_MAX))
    throw new CliError(`--speed phải trong khoảng ${SPEED_MIN}..${SPEED_MAX}, nhận được: ${speed}`);

  const { spec, filePath } = await loadProject(projectPath);
  const found = findClip(spec, clipId);
  if (!found) throw new CliError(`Không tìm thấy clip: ${clipId}`);
  if (found.clip.kind !== "video" && found.clip.kind !== "audio")
    throw new CliError(`Speed chỉ áp dụng cho clip video/audio (clip ${clipId} là ${found.clip.kind})`);

  found.clip.speed = speed;
  // Cập nhật duration theo invariant: duration = (out - in) / speed
  if (found.clip.kind === "video" || found.clip.kind === "audio") {
    const srcLen = found.clip.out - found.clip.in;
    found.clip.duration = srcLen / speed;
  }

  await saveProject(spec, filePath);
  console.log(
    JSON.stringify({ ok: true, clip_id: clipId, speed, new_duration: found.clip.duration }, null, 2)
  );
}
