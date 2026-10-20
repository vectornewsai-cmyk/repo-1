/**
 * caption.ts — vcut caption: chạy auto-caption (faster-whisper) rồi thêm track phụ đề.
 *
 * Gọi trực tiếp server/caption/caption.py (không cần bridge server chạy).
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Track } from "../../../packages/video-spec/src/index.js";
import { CliError, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { newId } from "../ids.js";
import { CAPTION_PY, PYTHON_BIN } from "../paths.js";
import { loadProject, saveProject } from "../project.js";

export async function cmdCaption(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const src = reqFlag(args.flags, "src");
  const lang = optFlag(args.flags, "lang", "vi");
  const maxChars = optFlag(args.flags, "max-chars", "");
  const maxDur = optFlag(args.flags, "max-dur", "");

  const srcAbs = path.resolve(src);
  try {
    await fs.access(srcAbs);
  } catch {
    throw new CliError(`Không tìm thấy file nguồn: ${src}`);
  }

  const { spec, filePath } = await loadProject(projectPath);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vcut-caption-"));
  const trackOut = path.join(tmpDir, "track.json");
  const resultOut = path.join(tmpDir, "result.json");

  try {
    const pyArgs = [CAPTION_PY, "--input", srcAbs, "--lang", lang, "--out", resultOut, "--track-out", trackOut];
    if (maxChars) pyArgs.push("--max-chars", maxChars);
    if (maxDur) pyArgs.push("--max-dur", maxDur);

    console.error(`[vcut] caption: ${srcAbs} (lang=${lang}) — có thể mất vài phút...`);
    const r = spawnSync(PYTHON_BIN, pyArgs, {
      encoding: "utf8",
      timeout: 20 * 60 * 1000,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "inherit", "inherit"],
    });
    if (r.status !== 0) throw new CliError(`caption.py thất bại (exit ${r.status})`);

    const trackRaw = await fs.readFile(trackOut, "utf8");
    const track = JSON.parse(trackRaw) as Track;
    if (!track || !Array.isArray(track.clips))
      throw new CliError("caption.py không trả về track hợp lệ");

    // Gắn ID mới để tránh trùng
    track.id = newId("track");
    for (const c of track.clips) c.id = newId("cap");
    track.label = `Phụ đề (${lang})`;

    spec.tracks.push(track);
    await saveProject(spec, filePath);

    console.log(
      JSON.stringify(
        { ok: true, track_id: track.id, captions: track.clips.length, lang },
        null,
        2
      )
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
