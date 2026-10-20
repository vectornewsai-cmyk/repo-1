/**
 * ai.ts — MCP tools gọi các tính năng AI local (100% on-device, không cloud).
 *
 * Mỗi tool spawn đúng 1 Python script với argv CỐ ĐỊNH (không shell, không lệnh tuỳ ý),
 * pattern giống render_video. Input media phải là file trong media_dir của project.
 *
 * - auto_caption: faster-whisper → segments JSON
 * - translate_captions: faster-whisper translate → segments EN
 * - text_to_speech: VieNeu-TTS → file WAV lưu vào media_dir
 * - remove_background: rembg → video alpha (MOV)
 * - auto_reframe: OpenCV → video 9:16
 * - remove_silence: FFmpeg silencedetect → danh sách khoảng lặng
 * - detect_scenes: FFmpeg scene → danh sách điểm cắt
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ValidationError } from "../validate.js";
import { loadProject, REPO_ROOT } from "../store.js";
import { fail, handleError, ok, projectIdSchema } from "./common.js";

// Thư mục chứa các script Python AI
const AI_DIR = path.join(REPO_ROOT, "server");
const SCRIPTS = {
  caption: path.join(AI_DIR, "caption", "caption.py"),
  translate: path.join(AI_DIR, "caption", "translate.py"),
  tts: path.join(AI_DIR, "tts", "tts.py"),
  bgremove: path.join(AI_DIR, "bgremove", "bgremove.py"),
  reframe: path.join(AI_DIR, "reframe", "reframe.py"),
  silence: path.join(AI_DIR, "silence", "silence.py"),
  scene: path.join(AI_DIR, "scene", "scene.py"),
} as const;

/** Python nào để chạy script? Ưu tiên venv của từng module, fallback python3 hệ thống. */
function pickPython(scriptKey: keyof typeof SCRIPTS): string {
  const venvMap: Record<string, string> = {
    reframe: path.join(AI_DIR, "reframe", ".venv", "bin", "python"),
    tts: path.join(AI_DIR, "tts", ".venv2", "bin", "python"),
    bgremove: path.join(AI_DIR, "bgremove", ".venv", "bin", "python"),
  };
  const venvPy = venvMap[scriptKey];
  return venvPy ?? "python3";
}

/** Resolve file media an toàn trong media_dir (chặn traversal). */
async function resolveMediaFile(mediaDir: string, src: string): Promise<string> {
  if (
    src.startsWith("/") || src.startsWith("\\") ||
    src.includes("..") || /[<>:"|?*\x00-\x1f]/.test(src)
  )
    throw new ValidationError(`src không hợp lệ (đã bị chặn): ${JSON.stringify(src)}`);
  const abs = path.resolve(mediaDir, src);
  const rel = path.relative(mediaDir, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel))
    throw new ValidationError(`src không hợp lệ (đã bị chặn): ${JSON.stringify(src)}`);
  try {
    const st = await fs.stat(abs);
    if (!st.isFile()) throw new ValidationError(`src không phải file: ${src}`);
  } catch {
    throw new ValidationError(`không tìm thấy file media "${src}" trong ${mediaDir}`);
  }
  return abs;
}

/** Chạy script Python với argv cố định, timeout, trả stdout. */
function runPython(
  scriptKey: keyof typeof SCRIPTS,
  argv: string[],
  timeoutMs: number
): string {
  const script = SCRIPTS[scriptKey];
  const python = pickPython(scriptKey);
  const r = spawnSync(python, [script, ...argv], {
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.status !== 0) {
    const err = String(r.stderr ?? r.stdout ?? r.error ?? "unknown").slice(-1500);
    throw new ValidationError(`${scriptKey} thất bại (exit ${r.status}): ${err}`);
  }
  return r.stdout as string;
}

/** Đọc JSON output của script. */
async function readJsonOut(outPath: string): Promise<unknown> {
  const raw = await fs.readFile(outPath, "utf8");
  return JSON.parse(raw);
}

export function registerAiTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  server.tool(
    "auto_caption",
    "Tự động tạo phụ đề từ file video/audio bằng faster-whisper (100% local, hỗ trợ tiếng Việt). Trả về danh sách segments {start, end, text}.",
    {
      project_id: projectIdSchema,
      src: z.string().describe('Tên file media trong thư mục media của project, vd "video.mp4"'),
      lang: z.string().optional().describe('Mã ngôn ngữ ("vi", "en", hoặc "auto" để tự phát hiện; mặc định "auto")'),
    },
    async (args) => {
      try {
        const { meta } = await loadProject(args.project_id);
        const mediaFile = await resolveMediaFile(meta.mediaDir, args.src);
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-caption-"));
        try {
          const outJson = path.join(tmpDir, "caps.json");
          runPython("caption", [
            "--input", mediaFile,
            "--lang", args.lang ?? "auto",
            "--out", outJson,
          ], 20 * 60 * 1000);
          const data = await readJsonOut(outJson) as { segments?: unknown[] };
          return ok({
            project_id: args.project_id,
            src: args.src,
            segments: data.segments ?? data,
          });
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "translate_captions",
    "Dịch nội dung audio sang phụ đề TIẾNG ANH bằng faster-whisper translate (100% local).",
    {
      project_id: projectIdSchema,
      src: z.string().describe('Tên file media trong thư mục media của project'),
      lang: z.string().optional().describe('Mã ngôn ngữ NGUỒN ("vi", "en", hoặc "auto"; mặc định "auto")'),
    },
    async (args) => {
      try {
        const { meta } = await loadProject(args.project_id);
        const mediaFile = await resolveMediaFile(meta.mediaDir, args.src);
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-translate-"));
        try {
          const outJson = path.join(tmpDir, "trans.json");
          runPython("translate", [
            "--input", mediaFile,
            "--lang", args.lang ?? "auto",
            "--out", outJson,
          ], 20 * 60 * 1000);
          const data = await readJsonOut(outJson) as { segments?: unknown[] };
          return ok({
            project_id: args.project_id,
            src: args.src,
            target_lang: "en",
            segments: data.segments ?? data,
          });
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "text_to_speech",
    "Đọc văn bản thành giọng nói tiếng Việt bằng VieNeu-TTS (100% local, Apache 2.0). File WAV được lưu vào media_dir để dùng với add_audio.",
    {
      project_id: projectIdSchema,
      text: z.string().min(1).max(2000).describe("Văn bản cần đọc (tối đa 2000 ký tự)"),
      voice: z.string().optional().describe("Tên giọng (mặc định của model)"),
      out_name: z.string().optional().describe('Tên file WAV đầu ra trong media_dir (mặc định "tts_<timestamp>.wav")'),
    },
    async (args) => {
      try {
        const { meta } = await loadProject(args.project_id);
        const outName = args.out_name ?? `tts_${Date.now().toString(36)}.wav`;
        if (!/^[\w\-.]{1,100}\.wav$/i.test(outName))
          throw new ValidationError(`out_name không hợp lệ: ${JSON.stringify(outName)}`);
        const outAbs = path.resolve(meta.mediaDir, outName);
        const rel = path.relative(meta.mediaDir, outAbs);
        if (rel.startsWith("..") || path.isAbsolute(rel))
          throw new ValidationError(`out_name không hợp lệ (đã bị chặn)`);
        const argv = ["--text", args.text, "--out", outAbs];
        if (args.voice) argv.push("--voice", args.voice);
        runPython("tts", argv, 10 * 60 * 1000);
        const st = await fs.stat(outAbs);
        return ok({
          project_id: args.project_id,
          wav_file: outName,
          size_bytes: st.size,
          hint: `dùng add_audio với src="${outName}" để thêm vào timeline`,
        });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "remove_background",
    "Xoá nền video bằng rembg + BiRefNet (MIT, 100% local). Trả về file MOV có kênh alpha.",
    {
      project_id: projectIdSchema,
      src: z.string().describe("Tên file video trong media_dir"),
      out_name: z.string().optional().describe('Tên file MOV đầu ra (mặc định "<src>_no_bg.mov")'),
    },
    async (args) => {
      try {
        const { meta } = await loadProject(args.project_id);
        const mediaFile = await resolveMediaFile(meta.mediaDir, args.src);
        const base = path.basename(args.src, path.extname(args.src));
        const outName = args.out_name ?? `${base}_no_bg.mov`;
        if (!/^[\w\-.]{1,120}\.mov$/i.test(outName))
          throw new ValidationError(`out_name không hợp lệ`);
        const outAbs = path.resolve(meta.mediaDir, outName);
        const rel = path.relative(meta.mediaDir, outAbs);
        if (rel.startsWith("..") || path.isAbsolute(rel))
          throw new ValidationError(`out_name không hợp lệ (đã bị chặn)`);
        runPython("bgremove", [
          "--input", mediaFile,
          "--output", outAbs,
          "--mode", "alpha",
          "--session", "birefnet-general",
        ], 30 * 60 * 1000);
        const st = await fs.stat(outAbs);
        return ok({
          project_id: args.project_id,
          input: args.src,
          output: outName,
          size_bytes: st.size,
          hint: `thay src của clip video thành "${outName}" để dùng bản đã xoá nền`,
        });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "auto_reframe",
    "Tự động crop video 16:9 sang 9:16 (hoặc tỉ lệ khác) theo dõi chủ thể bằng OpenCV (100% local).",
    {
      project_id: projectIdSchema,
      src: z.string().describe("Tên file video trong media_dir"),
      aspect: z.enum(["9:16", "1:1", "4:5"]).optional().describe("Tỉ lệ đích (mặc định 9:16)"),
      out_name: z.string().optional().describe("Tên file MP4 đầu ra"),
    },
    async (args) => {
      try {
        const { meta } = await loadProject(args.project_id);
        const mediaFile = await resolveMediaFile(meta.mediaDir, args.src);
        const base = path.basename(args.src, path.extname(args.src));
        const aspect = args.aspect ?? "9:16";
        const outName = args.out_name ?? `${base}_reframe_${aspect.replace(":", "x")}.mp4`;
        if (!/^[\w\-.]{1,120}\.mp4$/i.test(outName))
          throw new ValidationError(`out_name không hợp lệ`);
        const outAbs = path.resolve(meta.mediaDir, outName);
        const rel = path.relative(meta.mediaDir, outAbs);
        if (rel.startsWith("..") || path.isAbsolute(rel))
          throw new ValidationError(`out_name không hợp lệ (đã bị chặn)`);
        runPython("reframe", [
          "--input", mediaFile,
          "--output", outAbs,
          "--aspect", aspect,
        ], 15 * 60 * 1000);
        const st = await fs.stat(outAbs);
        return ok({
          project_id: args.project_id,
          input: args.src,
          output: outName,
          aspect,
          size_bytes: st.size,
        });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "remove_silence",
    "Phát hiện các khoảng lặng trong file audio/video bằng FFmpeg (100% local). Trả về danh sách để agent quyết định cắt.",
    {
      project_id: projectIdSchema,
      src: z.string().describe("Tên file media trong media_dir"),
      noise_db: z.number().min(-80).max(0).optional().describe("Ngưỡng dB (mặc định -35)"),
      min_duration: z.number().min(0.1).max(10).optional().describe("Độ dài tối thiểu của khoảng lặng, giây (mặc định 0.5)"),
    },
    async (args) => {
      try {
        const { meta } = await loadProject(args.project_id);
        const mediaFile = await resolveMediaFile(meta.mediaDir, args.src);
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-silence-"));
        try {
          const outJson = path.join(tmpDir, "sil.json");
          const argv = ["--input", mediaFile, "--out", outJson];
          if (args.noise_db !== undefined) argv.push("--noise", String(args.noise_db));
          if (args.min_duration !== undefined) argv.push("--min-dur", String(args.min_duration));
          runPython("silence", argv, 10 * 60 * 1000);
          const data = await readJsonOut(outJson);
          return ok({ project_id: args.project_id, src: args.src, result: data });
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "detect_scenes",
    "Tự động phát hiện chuyển cảnh trong video bằng FFmpeg (100% local). Trả về danh sách thời điểm cắt (giây).",
    {
      project_id: projectIdSchema,
      src: z.string().describe("Tên file video trong media_dir"),
      threshold: z.number().min(0.05).max(0.95).optional().describe("Ngưỡng scene 0.05–0.95 (mặc định 0.4)"),
    },
    async (args) => {
      try {
        const { meta } = await loadProject(args.project_id);
        const mediaFile = await resolveMediaFile(meta.mediaDir, args.src);
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-scene-"));
        try {
          const outJson = path.join(tmpDir, "scene.json");
          const argv = ["--input", mediaFile, "--out", outJson];
          if (args.threshold !== undefined) argv.push("--threshold", String(args.threshold));
          runPython("scene", argv, 10 * 60 * 1000);
          const data = await readJsonOut(outJson) as { cuts?: number[] };
          return ok({
            project_id: args.project_id,
            src: args.src,
            cuts: data.cuts ?? data,
            hint: "dùng split_clip tại từng điểm cắt để tách clip",
          });
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
      } catch (e) {
        return handleError(e);
      }
    }
  );
}
