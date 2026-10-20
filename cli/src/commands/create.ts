/**
 * create.ts — vcut create: tạo project video mới (trống).
 */
import type { VideoSpec } from "../../../packages/video-spec/src/index.js";
import { SPEC_VERSION } from "../../../packages/video-spec/src/index.js";
import { CliError, numFlag, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { slugify } from "../ids.js";
import { saveProject } from "../project.js";

export async function cmdCreate(args: ParsedArgs): Promise<void> {
  const name = reqFlag(args.flags, "name");
  const width = numFlag(args.flags, "width", 1920);
  const height = numFlag(args.flags, "height", 1080);
  const fps = numFlag(args.flags, "fps", 30);

  if (!Number.isInteger(width) || width <= 0 || width > 7680)
    throw new CliError(`--width phải là số nguyên 1..7680, nhận được: ${width}`);
  if (!Number.isInteger(height) || height <= 0 || height > 4320)
    throw new CliError(`--height phải là số nguyên 1..4320, nhận được: ${height}`);
  if (fps <= 0 || fps > 120) throw new CliError(`--fps phải trong khoảng 1..120, nhận được: ${fps}`);

  const out = optFlag(args.flags, "out", optFlag(args.flags, "o", `${slugify(name)}.json`));

  const spec: VideoSpec = {
    version: SPEC_VERSION,
    meta: { name, width, height, fps },
    tracks: [],
  };

  await saveProject(spec, out);
  console.log(JSON.stringify({ ok: true, project: out, name, width, height, fps }, null, 2));
}
