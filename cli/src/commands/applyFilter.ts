/**
 * applyFilter.ts — vcut apply-filter: gắn bộ lọc màu LUT vào clip video.
 */
import { isLutId, LUT_IDS } from "../../../packages/video-spec/src/lut.js";
import { CliError, reqFlag, type ParsedArgs } from "../args.js";
import { findClip, loadProject, saveProject } from "../project.js";

export async function cmdApplyFilter(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const clipId = reqFlag(args.flags, "clip");
  const lut = reqFlag(args.flags, "lut");

  if (!isLutId(lut))
    throw new CliError(`--lut không hợp lệ. Chọn một trong: ${(LUT_IDS as readonly string[]).join(", ")}`);

  const { spec, filePath } = await loadProject(projectPath);
  const found = findClip(spec, clipId);
  if (!found) throw new CliError(`Không tìm thấy clip: ${clipId}`);
  if (found.clip.kind !== "video")
    throw new CliError(`Filter chỉ áp dụng cho clip video (clip ${clipId} là ${found.clip.kind})`);

  found.clip.filter = { lut };

  await saveProject(spec, filePath);
  console.log(JSON.stringify({ ok: true, clip_id: clipId, lut }, null, 2));
}
