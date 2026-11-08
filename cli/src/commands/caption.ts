/**
 * caption.ts — vcut caption: chạy auto-caption (faster-whisper) rồi thêm track phụ đề.
 *
 * Gọi trực tiếp server/caption/caption.py (không cần bridge server chạy).
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Track } from "../../../packages/video-spec/src/index.js";
import { CliError, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { newId } from "../ids.js";
import { CAPTION_PY, PYTHON_BIN } from "../paths.js";
import { loadProject, saveProject } from "../project.js";
import { runStreamed } from "../streamedWorker.js";

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
    throw new CliError("NOT_FOUND", `Không tìm thấy file nguồn: ${src}`);
  }

  const { spec, filePath } = await loadProject(projectPath);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vcut-caption-"));
  const trackOut = path.join(tmpDir, "track.json");
  const resultOut = path.join(tmpDir, "result.json");

  try {
    const pyArgs = [CAPTION_PY, "--input", srcAbs, "--lang", lang, "--out", resultOut, "--track-out", trackOut];
    if (maxChars) pyArgs.push("--max-chars", maxChars);
    if (maxDur) pyArgs.push("--max-dur", maxDur);

    // Đợt 31 N3 — dòng thông báo của chính CLI cũng chỉ in basename
    // (trước đây in srcAbs tuyệt đối, tức stderr vẫn rò đường dẫn dù
    // stderr worker đã qua redact; chuẩn basename giống redact của
    // bridge). Không đổi nội dung khác của dòng này.
    console.error(`[vcut] caption: ${path.basename(srcAbs)} (lang=${lang}) — có thể mất vài phút...`);
    // Đợt 31 N3 — theo đúng mẫu đợt 30 M3 (render không-quiet): stdout
    // giữ inherit, stderr pipe + redact theo dòng rồi mới ra terminal.
    // Không còn `stdio: "inherit"` cho stderr. Timeout 20 phút như
    // spawnSync trước đây; mã exit/signal trả nguyên về, thông điệp
    // lỗi giữ nguyên định dạng cũ (process exit 1 qua handler CliError
    // ở index.ts, như trước).
    const r = await runStreamed(PYTHON_BIN, pyArgs, 20 * 60 * 1000, "caption");
    if (r.status !== 0) throw new CliError("SCRIPT_FAILED", `caption.py thất bại (exit ${r.status})`);

    const trackRaw = await fs.readFile(trackOut, "utf8");
    const track = JSON.parse(trackRaw) as Track;
    if (!track || !Array.isArray(track.clips))
      throw new CliError("SCRIPT_INVALID_OUTPUT", "caption.py không trả về track hợp lệ");

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
