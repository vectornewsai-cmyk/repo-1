/**
 * export_video.ts — MCP tool render MP4 với preset xuất (720p/1080p/4K/TikTok/YouTube/IG).
 *
 * Preset đổi meta width/height/fps của bản spec DÙNG ĐỂ RENDER (không lưu vào project),
 * và truyền crf/x264-preset/audio-bitrate cho render worker.
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VideoSpec } from "../../../packages/video-spec/src/index.js";
import { projectDuration } from "../../../packages/video-spec/src/index.js";
import { ValidationError, validateVideoSpec } from "../validate.js";
import { loadProject, RENDER_WORKER_JS, RENDERS_DIR, resolveMediaDir, resolveOutPath } from "../store.js";
import { fail, handleError, ok, projectIdSchema } from "./common.js";

const PRESETS = {
  "720p": { width: 1280, height: 720, fps: 30, crf: 23, x264Preset: "veryfast", audioBitrate: "128k" },
  "1080p": { width: 1920, height: 1080, fps: 30, crf: 20, x264Preset: "medium", audioBitrate: "160k" },
  "4k": { width: 3840, height: 2160, fps: 30, crf: 18, x264Preset: "slow", audioBitrate: "192k" },
  "tiktok": { width: 1080, height: 1920, fps: 30, crf: 20, x264Preset: "medium", audioBitrate: "160k" },
  "youtube": { width: 1920, height: 1080, fps: 30, crf: 18, x264Preset: "medium", audioBitrate: "192k" },
  "instagram": { width: 1080, height: 1080, fps: 30, crf: 21, x264Preset: "medium", audioBitrate: "128k" },
} as const;

type PresetId = keyof typeof PRESETS;

function probeVideo(mp4Path: string): Record<string, unknown> {
  const r = spawnSync(
    "ffprobe",
    [
      "-v", "error",
      "-show_entries", "format=duration,size",
      "-show_entries", "stream=index,codec_type,codec_name,width,height,avg_frame_rate,sample_rate",
      "-of", "json",
      mp4Path,
    ],
    { encoding: "utf8", timeout: 30000 }
  );
  if (r.status !== 0) throw new Error(`ffprobe thất bại: ${(r.stderr as string).slice(0, 500)}`);
  const info = JSON.parse(r.stdout as string) as {
    format?: { duration?: string; size?: string };
    streams?: Array<Record<string, unknown>>;
  };
  const video = (info.streams ?? []).find((s) => s["codec_type"] === "video") ?? {};
  const audio = (info.streams ?? []).find((s) => s["codec_type"] === "audio") ?? {};
  return {
    duration_sec: info.format?.duration ? Number(info.format.duration) : null,
    size_bytes: info.format?.size ? Number(info.format.size) : null,
    video: {
      codec: video["codec_name"] ?? null,
      width: video["width"] ?? null,
      height: video["height"] ?? null,
      fps: video["avg_frame_rate"] ?? null,
    },
    audio: { codec: audio["codec_name"] ?? null, sample_rate: audio["sample_rate"] ?? null },
    has_audio: Object.keys(audio).length > 0,
  };
}

export function registerExportTools(server: McpServer): void {
  server.tool(
    "export_video",
    "Render project thành MP4 với preset xuất (độ phân giải + chất lượng). Tương đương render_video nhưng có preset.",
    {
      project_id: projectIdSchema,
      out_path: z.string().describe('Đường dẫn tương đối trong thư mục renders/, vd "final.mp4" (bắt buộc .mp4)'),
      preset: z.enum(["720p", "1080p", "4k", "tiktok", "youtube", "instagram"]).optional()
        .describe("Preset xuất (mặc định 1080p)"),
      crf: z.number().int().min(0).max(51).optional().describe("Ghi đè CRF (0–51, càng nhỏ càng đẹp)"),
      media_dir: z.string().optional().describe("Ghi đè thư mục media"),
    },
    async (args) => {
      try {
        const presetId: PresetId = args.preset ?? "1080p";
        const preset = PRESETS[presetId];
        // Validate out_path (giống render_video)
        const outPath = args.out_path;
        if (
          outPath.startsWith("/") || outPath.startsWith("\\") ||
          outPath.includes("..") || !outPath.toLowerCase().endsWith(".mp4")
        )
          throw new ValidationError(`out_path không hợp lệ: ${JSON.stringify(outPath)}`);
        try {
          await fs.access(RENDER_WORKER_JS);
        } catch {
          throw new ValidationError(`render worker không tồn tại: ${RENDER_WORKER_JS}`);
        }
        const { spec, meta } = await loadProject(args.project_id);
        validateVideoSpec(spec);
        if (spec.tracks.length === 0 || projectDuration(spec) <= 0)
          throw new ValidationError(`project "${args.project_id}" đang trống — thêm clip trước khi export`);
        const outAbs = resolveOutPath(outPath);
        await fs.mkdir(path.dirname(outAbs), { recursive: true });
        const mediaDir = args.media_dir ? await resolveMediaDir(args.media_dir) : meta.mediaDir;

        // Spec dùng để render: đổi meta theo preset (KHÔNG lưu vào project)
        const renderSpec: VideoSpec = {
          ...spec,
          meta: { ...spec.meta, width: preset.width, height: preset.height, fps: preset.fps },
        };

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo1-export-"));
        const tmpSpec = path.join(tmpDir, "spec.json");
        try {
          await fs.writeFile(tmpSpec, JSON.stringify(renderSpec), "utf8");
          const crf = args.crf ?? preset.crf;
          const r = spawnSync(
            process.execPath,
            [
              RENDER_WORKER_JS, "--spec", tmpSpec, "--out", outAbs, "--media-dir", mediaDir,
              "--crf", String(crf),
              "--x264-preset", preset.x264Preset,
              "--audio-bitrate", preset.audioBitrate,
              "-y",
            ],
            { encoding: "utf8", timeout: 30 * 60 * 1000, maxBuffer: 16 * 1024 * 1024 }
          );
          if (r.status !== 0) {
            const errTail = String(r.stderr ?? r.stdout ?? r.error ?? "unknown error").slice(-2000);
            throw new ValidationError(`export thất bại (exit ${r.status}): ${errTail}`);
          }
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
        const probe = probeVideo(outAbs);
        return ok({
          project_id: args.project_id,
          preset: presetId,
          mp4_path: outAbs,
          ffprobe: probe,
        });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    "list_export_presets",
    "Liệt kê các preset xuất có sẵn (độ phân giải, fps, CRF).",
    {},
    async () => {
      try {
        return ok({
          presets: Object.entries(PRESETS).map(([id, p]) => ({ id, ...p })),
        });
      } catch (e) {
        return handleError(e);
      }
    }
  );
}
