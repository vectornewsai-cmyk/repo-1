/**
 * tts.ts — vcut tts: tổng hợp giọng nói (VieNeu-TTS) rồi thêm audio clip vào project.
 *
 * Gọi trực tiếp server/tts/tts.py (không cần bridge server chạy).
 * File WAV được copy vào thư mục media cạnh file project.
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AudioClip, Clip } from "../../../packages/video-spec/src/index.js";
import { CliError, numFlag, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { newId } from "../ids.js";
import { PYTHON_BIN, TTS_PY } from "../paths.js";
import { findOrCreateTrack, loadProject, saveProject } from "../project.js";

export async function cmdTts(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const text = reqFlag(args.flags, "text");
  const voice = optFlag(args.flags, "voice", "");
  const start = numFlag(args.flags, "start", 0);

  if (text.length === 0) throw new CliError("--text không được rỗng");
  if (text.length > 2000) throw new CliError("--text tối đa 2000 ký tự");
  if (start < 0) throw new CliError("--start phải >= 0");

  const { spec, filePath } = await loadProject(projectPath);

  // Thư mục media: cạnh file project
  const mediaDir = path.join(path.dirname(filePath), "media");
  await fs.mkdir(mediaDir, { recursive: true });

  const wavName = `tts_${Date.now().toString(36)}.wav`;
  const tmpWav = path.join(os.tmpdir(), wavName);
  const destWav = path.join(mediaDir, wavName);

  try {
    const pyArgs = [TTS_PY, "--text", text, "--out", tmpWav];
    if (voice) pyArgs.push("--voice", voice);

    console.error(`[vcut] tts: "${text.slice(0, 40)}${text.length > 40 ? "…" : ""}" — đang tổng hợp...`);
    const r = spawnSync(PYTHON_BIN, pyArgs, {
      encoding: "utf8",
      timeout: 10 * 60 * 1000,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "inherit", "inherit"],
    });
    if (r.status !== 0) throw new CliError(`tts.py thất bại (exit ${r.status})`);

    await fs.copyFile(tmpWav, destWav);

    // Đo duration bằng ffprobe (fallback: để duration 0 → user tự chỉnh)
    let duration = 0;
    try {
      const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", destWav], {
        encoding: "utf8",
        timeout: 30000,
      });
      if (probe.status === 0) duration = parseFloat(probe.stdout.trim()) || 0;
    } catch {
      // bỏ qua
    }

    const track = findOrCreateTrack(spec, "audio");
    const clipId = newId("clip");
    const clip: AudioClip = {
      kind: "audio",
      id: clipId,
      src: wavName, // tương đối từ thư mục media
      start,
      duration: duration > 0 ? duration : 1,
      in: 0,
      out: duration > 0 ? duration : 1,
    };
    track.clips.push(clip);
    track.clips.sort((a: Clip, b: Clip) => a.start - b.start);

    await saveProject(spec, filePath);
    console.log(
      JSON.stringify(
        { ok: true, clip_id: clipId, track_id: track.id, wav: destWav, duration_sec: Math.round(clip.duration * 100) / 100, start },
        null,
        2
      )
    );
  } finally {
    await fs.rm(tmpWav, { force: true });
  }
}
