/**
 * render.ts — vcut render: validate rồi render project thành MP4 bằng FFmpeg.
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { CliError, numFlag, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { RENDER_WORKER_JS } from "../paths.js";
import { loadProject, projectDuration, validateProject } from "../project.js";

/** Preset export → tham số render worker. */
const PRESETS: Record<string, { width: number; height: number; crf: number; preset: string; audioBitrate: string }> = {
  "720p": { width: 1280, height: 720, crf: 20, preset: "medium", audioBitrate: "128k" },
  "1080p": { width: 1920, height: 1080, crf: 20, preset: "medium", audioBitrate: "128k" },
  "4k": { width: 3840, height: 2160, crf: 20, preset: "medium", audioBitrate: "192k" },
  "tiktok": { width: 1080, height: 1920, crf: 20, preset: "medium", audioBitrate: "128k" },
  "youtube": { width: 1920, height: 1080, crf: 18, preset: "slow", audioBitrate: "192k" },
  "ig-square": { width: 1080, height: 1080, crf: 20, preset: "medium", audioBitrate: "128k" },
};

export async function cmdRender(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const output = reqFlag(args.flags, "output", ["o"]);
  const presetName = optFlag(args.flags, "preset", "1080p").toLowerCase();
  const mediaDir = args.flags["media-dir"] !== undefined ? String(args.flags["media-dir"]) : undefined;
  const overwrite = args.flags["y"] === true || args.flags["overwrite"] === true;
  const quiet = args.flags["q"] === true || args.flags["quiet"] === true;
  const crfOverride = args.flags["crf"] !== undefined ? numFlag(args.flags, "crf", 20) : undefined;

  const preset = PRESETS[presetName];
  if (!preset) throw new CliError(`--preset không hợp lệ. Chọn: ${Object.keys(PRESETS).join(", ")}`);

  if (!output.toLowerCase().endsWith(".mp4"))
    throw new CliError("--output phải có đuôi .mp4");

  const { spec } = await loadProject(projectPath);

  // Validate trước khi render
  const { errors, warnings } = validateProject(spec);
  if (errors.length > 0) {
    console.error("Project không hợp lệ, từ chối render:");
    for (const e of errors) console.error(`  ✗ ${e}`);
    throw new CliError(`Có ${errors.length} lỗi validation`);
  }
  for (const w of warnings) console.error(`  ⚠ ${w}`);

  if (projectDuration(spec) <= 0)
    throw new CliError("Project đang trống (chưa có clip nào) — thêm clip trước khi render");

  // Ghi spec ra file tạm (render worker đọc từ file)
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vcut-render-"));
  const tmpSpec = path.join(tmpDir, "spec.json");
  const outAbs = path.resolve(output);

  try {
    await fs.writeFile(tmpSpec, JSON.stringify(spec), "utf8");
    await fs.mkdir(path.dirname(outAbs), { recursive: true });

    const renderArgs = [RENDER_WORKER_JS, "--spec", tmpSpec, "--out", outAbs];
    if (mediaDir) renderArgs.push("--media-dir", path.resolve(mediaDir));
    renderArgs.push("--crf", String(crfOverride ?? preset.crf));
    renderArgs.push("--x264-preset", preset.preset);
    renderArgs.push("--audio-bitrate", preset.audioBitrate);
    if (overwrite) renderArgs.push("-y");
    if (quiet) renderArgs.push("-q");

    console.error(`[vcut] render preset=${presetName} (${preset.width}x${preset.height}) → ${outAbs}`);
    const r = spawnSync(process.execPath, renderArgs, {
      encoding: "utf8",
      timeout: 30 * 60 * 1000,
      maxBuffer: 32 * 1024 * 1024,
      stdio: quiet ? "pipe" : "inherit",
    });
    if (r.status !== 0) {
      const tail = String(r.stderr ?? r.stdout ?? r.error ?? "unknown").slice(-2000);
      throw new CliError(`Render thất bại (exit ${r.status}): ${tail}`);
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  const st = await fs.stat(outAbs);
  console.log(
    JSON.stringify(
      { ok: true, output: outAbs, size_bytes: st.size, preset: presetName, warnings },
      null,
      2
    )
  );
}

export { PRESETS };
