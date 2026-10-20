#!/usr/bin/env node
/**
 * index.ts — MCP server (giao thức stdio) cho trình dựng video repo-1.
 *
 * AI agent (Claude Code, Codex...) kết nối tới server này và điều khiển
 * editor bằng code: tạo project → thêm clip/chữ/transition → render MP4.
 *
 * Mọi thao tác đều đi qua video-spec JSON đã validate — agent KHÔNG BAO GIỜ
 * được chạy shell/ffmpeg trực tiếp. Tool duy nhất chạm tới shell là
 * render_video, và nó chỉ được gọi đúng render worker với argv cố định.
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { Track, VideoSpec } from "../../packages/video-spec/src/index.js";
import { projectDuration, SPEC_VERSION } from "../../packages/video-spec/src/index.js";
import {
  ValidationError,
  validateAddClipInput,
  validateAddTextInput,
  validateApplyTransitionInput,
  validateCreateProjectInput,
  validateProjectId,
  validateRenderVideoInput,
  validateVideoSpec,
} from "./validate.js";
import {
  DEFAULT_MEDIA_DIR,
  RENDER_WORKER_JS,
  RENDERS_DIR,
  SERVER_DIR,
  createProject,
  findVideoClip,
  loadProject,
  resolveMediaDir,
  resolveOutPath,
  saveProject,
} from "./store.js";
// R1-090: tools mở rộng (Batch I)
import { registerClipTools } from "./tools/clips.js";
import { registerModifyTools } from "./tools/modify.js";
import { registerAiTools } from "./tools/ai.js";
import { registerExportTools } from "./tools/export.js";

// ---------------------------------------------------------------------------
// Zod schemas (client thấy được — Claude Code/Codex đọc schema này để gọi tool)
// ---------------------------------------------------------------------------

const transitionSchema = z.object({
  type: z.enum([
    "none", "fade", "fadeblack", "fadewhite",
    "wipeleft", "wiperight", "wipeup", "wipedown",
    "slideleft", "slideright", "dissolve", "circleopen", "radial",
  ]).describe("Loại transition (13 loại)"),
  duration: z.number().nonnegative().describe("Độ dài transition, tính bằng giây"),
});

const textStyleSchema = z.object({
  fontFamily: z.string().describe('Font chữ, ví dụ "Noto Sans"'),
  fontSize: z.number().positive().describe("Cỡ chữ (px)"),
  color: z.string().describe('Màu chữ hex, ví dụ "#ffffff"'),
  backgroundColor: z.string().optional().describe("Màu nền chữ (hex, tùy chọn)"),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  x: z.number().min(0).max(1).optional().describe("Vị trí ngang tương đối 0..1 (0.5 = giữa)"),
  y: z.number().min(0).max(1).optional().describe("Vị trí dọc tương đối 0..1"),
  animation: z.enum([
    "none", "fadeUp", "fadeIn", "slideInLeft", "slideInRight", "slideUp", "bounce", "typewriter",
  ]).optional(),
});

const videoClipSchema = z.object({
  kind: z.literal("video"),
  id: z.string(),
  src: z.string().describe("Tên file media trong thư mục media (ví dụ \"clip1.mp4\")"),
  start: z.number().nonnegative().describe("Vị trí trên timeline (giây)"),
  duration: z.number().positive().describe("Độ dài hiển thị trên timeline (giây)"),
  in: z.number().nonnegative().describe("Điểm cắt vào trong file nguồn (giây)"),
  out: z.number().positive().describe("Điểm cắt ra trong file nguồn (giây)"),
  transitionIn: transitionSchema.optional(),
  transitionOut: transitionSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
  speed: z.number().min(0.25).max(4).optional().describe("Tốc độ phát 0.25–4 (mặc định 1)"),
  reverse: z.boolean().optional().describe("Phát ngược đoạn nguồn"),
  chromaKey: z.object({
    color: z.string().describe("Màu phông hex #rrggbb, vd \"#00FF00\""),
    similarity: z.number().min(0).max(1).optional(),
    blend: z.number().min(0).max(1).optional(),
  }).optional().describe("Xoá phông xanh/lục"),
  filter: z.object({
    lut: z.enum([
      "cartcut-blockbuster", "cartcut-teal-orange", "cartcut-nordic-noir",
      "cartcut-honey", "cartcut-golden-hour", "cartcut-winter-blue",
      "cartcut-ocean", "cartcut-mono-neutral", "cartcut-faded-seventies",
      "cartcut-super-eight",
    ]).optional(),
  }).optional().describe("Bộ lọc màu LUT"),
  effects: z.array(z.object({
    type: z.enum(["blur", "sharpen", "grayscale", "sepia", "vignette", "noise", "brightness"]),
    intensity: z.number().min(0).max(1).optional(),
  })).optional().describe("Danh sách hiệu ứng video"),
});

const audioClipSchema = z.object({
  kind: z.literal("audio"),
  id: z.string(),
  src: z.string(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  in: z.number().nonnegative(),
  out: z.number().positive(),
  volume: z.number().min(0).max(2).optional().describe("Âm lượng 0..2 (mặc định 1)"),
  fadeIn: z.number().nonnegative().optional().describe("Fade in (giây)"),
  fadeOut: z.number().nonnegative().optional().describe("Fade out (giây)"),
  speed: z.number().min(0.25).max(4).optional().describe("Tốc độ phát 0.25–4 (mặc định 1)"),
  reverse: z.boolean().optional().describe("Phát ngược đoạn nguồn"),
});

const stickerClipSchema = z.object({
  kind: z.literal("sticker"),
  id: z.string(),
  src: z.string().describe("Tên file PNG sticker trong thư mục media"),
  start: z.number().nonnegative().describe("Vị trí trên timeline (giây)"),
  duration: z.number().positive().describe("Độ dài hiển thị (giây)"),
  x: z.number().min(0).max(1).optional().describe("Tâm ngang 0..1 (mặc định 0.5)"),
  y: z.number().min(0).max(1).optional().describe("Tâm dọc 0..1 (mặc định 0.5)"),
  scale: z.number().positive().optional().describe("Tỉ lệ so với chiều rộng khung hình (mặc định 0.25)"),
  opacity: z.number().min(0).max(1).optional(),
  rotation: z.number().optional().describe("Góc xoay (độ)"),
});

const imageClipSchema = z.object({
  kind: z.literal("image"),
  id: z.string(),
  src: z.string().describe("Tên file ảnh trong thư mục media"),
  start: z.number().nonnegative().describe("Vị trí trên timeline (giây)"),
  duration: z.number().positive().describe("Độ dài hiển thị (giây)"),
  fit: z.enum(["contain", "cover"]).optional().describe("Cách lấp đầy khung hình (mặc định contain)"),
});

const textClipSchema = z.object({
  kind: z.literal("text"),
  id: z.string(),
  text: z.string(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  style: textStyleSchema,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: `LỖI: ${message}` }], isError: true };
}

function handleError(e: unknown): ToolResult {
  if (e instanceof ValidationError) return fail(e.message);
  if (e instanceof z.ZodError)
    return fail(
      `input không đúng định dạng: ${e.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`
    );
  return fail(e instanceof Error ? e.message : String(e));
}

/** Chạy ffprobe lấy thông tin file MP4 vừa render. */
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
    audio: {
      codec: audio["codec_name"] ?? null,
      sample_rate: audio["sample_rate"] ?? null,
    },
    has_audio: Object.keys(audio).length > 0,
  };
}

// ---------------------------------------------------------------------------
// Server + tools
// ---------------------------------------------------------------------------

const server = new McpServer(
  { name: "repo-1-video", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.tool(
  "create_project",
  "Tạo project video mới (trống). Trả về project_id để dùng cho các tool tiếp theo.",
  {
    name: z.string().min(1).max(200).describe("Tên project"),
    width: z.number().int().positive().max(7680).describe("Chiều rộng khung hình (px)"),
    height: z.number().int().positive().max(4320).describe("Chiều cao khung hình (px)"),
    fps: z.number().positive().max(120).describe("Số frame/giây"),
    media_dir: z.string().optional().describe("Thư mục chứa file media (mặc định: kho media mẫu của dự án)"),
  },
  async (args) => {
    try {
      const input = validateCreateProjectInput(args);
      const mediaDir = await resolveMediaDir(input.media_dir);
      const spec: VideoSpec = {
        version: SPEC_VERSION,
        meta: { name: input.name, width: input.width, height: input.height, fps: input.fps },
        tracks: [],
      };
      const { projectId } = await createProject(spec, mediaDir);
      return ok({ project_id: projectId, media_dir: mediaDir, spec });
    } catch (e) {
      return handleError(e);
    }
  }
);

server.tool(
  "add_clip",
  "Thêm 1 clip (video/audio/text/sticker/image) vào track. Nếu chưa có track phù hợp (hoặc có track_id), tự tạo track mới.",
  {
    project_id: z.string().describe("ID project từ create_project"),
    track_kind: z.enum(["video", "audio", "text", "sticker", "image"]).describe("Loại track"),
    clip: z
      .union([videoClipSchema, audioClipSchema, textClipSchema, stickerClipSchema, imageClipSchema])
      .describe("Clip cần thêm (kind phải khớp track_kind)"),
    track_id: z.string().optional().describe("ID track muốn thêm vào (mặc định: track đầu tiên cùng loại, hoặc tạo mới)"),
    track_label: z.string().optional().describe("Tên hiển thị của track nếu tạo mới"),
  },
  async (args) => {
    try {
      const input = validateAddClipInput(args);
      const { spec } = await loadProject(input.project_id);
      let track: Track | undefined;
      if (input.track_id) {
        track = spec.tracks.find((t) => t.id === input.track_id);
        if (!track) throw new ValidationError(`không tìm thấy track_id "${input.track_id}"`);
        if (track.kind !== input.track_kind)
          throw new ValidationError(
            `track "${input.track_id}" là loại "${track.kind}", không khớp track_kind "${input.track_kind}"`
          );
      } else {
        track = spec.tracks.find((t) => t.kind === input.track_kind);
      }
      if (!track) {
        const newId = input.track_id ?? `${input.track_kind[0]}${spec.tracks.length + 1}`;
        if (spec.tracks.some((t) => t.id === newId))
          throw new ValidationError(`trùng track id "${newId}"`);
        track = { id: newId, kind: input.track_kind, clips: [] };
        if (input.track_label) track.label = input.track_label;
        spec.tracks.push(track);
      }
      if (track.clips.some((c) => c.id === input.clip.id))
        throw new ValidationError(`trùng clip id "${input.clip.id}" trong track "${track.id}"`);
      track.clips.push(input.clip);
      await saveProject(input.project_id, spec);
      return ok({
        project_id: input.project_id,
        track_id: track.id,
        clip_id: input.clip.id,
        total_duration_sec: projectDuration(spec),
      });
    } catch (e) {
      return handleError(e);
    }
  }
);

server.tool(
  "add_text",
  "Shortcut: thêm chữ lên video (tự tạo track text nếu chưa có).",
  {
    project_id: z.string(),
    text: z.string().min(1).max(2000).describe("Nội dung chữ"),
    start: z.number().nonnegative().describe("Xuất hiện từ giây thứ mấy"),
    duration: z.number().positive().describe("Hiển thị trong bao lâu (giây)"),
    style: textStyleSchema.optional().describe("Kiểu chữ (mặc định: trắng, cỡ 64, giữa khung)"),
    track_id: z.string().optional(),
  },
  async (args) => {
    try {
      const input = validateAddTextInput(args);
      const { spec } = await loadProject(input.project_id);
      let track = input.track_id
        ? spec.tracks.find((t) => t.id === input.track_id)
        : spec.tracks.find((t) => t.kind === "text");
      if (input.track_id && !track)
        throw new ValidationError(`không tìm thấy track_id "${input.track_id}"`);
      if (track && track.kind !== "text")
        throw new ValidationError(`track "${track.id}" không phải loại text`);
      if (!track) {
        track = { id: `t${spec.tracks.length + 1}`, kind: "text", clips: [] };
        spec.tracks.push(track);
      }
      const clipId = `tx_${Date.now().toString(36)}`;
      track.clips.push({
        kind: "text",
        id: clipId,
        text: input.text,
        start: input.start,
        duration: input.duration,
        style: input.style ?? {
          fontFamily: "Noto Sans",
          fontSize: 64,
          color: "#ffffff",
          x: 0.5,
          y: 0.5,
          animation: "fadeUp",
        },
      });
      await saveProject(input.project_id, spec);
      return ok({
        project_id: input.project_id,
        track_id: track.id,
        clip_id: clipId,
        total_duration_sec: projectDuration(spec),
      });
    } catch (e) {
      return handleError(e);
    }
  }
);

server.tool(
  "apply_transition",
  "Gắn transition vào đầu hoặc cuối 1 clip video.",
  {
    project_id: z.string(),
    clip_id: z.string().describe("ID clip video cần gắn transition"),
    direction: z.enum(["in", "out"]).describe('"in" = đầu clip, "out" = cuối clip'),
    type: z.enum([
      "none", "fade", "fadeblack", "fadewhite",
      "wipeleft", "wiperight", "wipeup", "wipedown",
      "slideleft", "slideright", "dissolve", "circleopen", "radial",
    ]).default("fade"),
    duration: z.number().nonnegative().describe("Độ dài transition (giây)"),
  },
  async (args) => {
    try {
      const input = validateApplyTransitionInput(args);
      const { spec } = await loadProject(input.project_id);
      const found = findVideoClip(spec, input.clip_id);
      if (!found) throw new ValidationError(`không tìm thấy clip video id "${input.clip_id}"`);
      const clip = spec.tracks[found.trackIndex].clips[found.clipIndex];
      if (clip.kind !== "video") throw new ValidationError(`clip "${input.clip_id}" không phải video`);
      const transition = { type: input.type, duration: input.duration } as const;
      if (input.direction === "in") clip.transitionIn = { ...transition };
      else clip.transitionOut = { ...transition };
      await saveProject(input.project_id, spec);
      return ok({
        project_id: input.project_id,
        clip_id: input.clip_id,
        direction: input.direction,
        transition,
      });
    } catch (e) {
      return handleError(e);
    }
  }
);

server.tool(
  "get_project",
  "Lấy video-spec JSON hiện tại của project (để agent xem/kiểm tra trước khi render).",
  {
    project_id: z.string(),
  },
  async (args) => {
    try {
      const projectId = validateProjectId(args["project_id"]);
      const { spec, meta } = await loadProject(projectId);
      return ok({ project_id: projectId, spec, total_duration_sec: projectDuration(spec), media_dir: meta.mediaDir });
    } catch (e) {
      return handleError(e);
    }
  }
);

server.tool(
  "render_video",
  "Render project thành file MP4 thật bằng FFmpeg. Validate spec trước khi render; trả về đường dẫn file + thông tin ffprobe.",
  {
    project_id: z.string(),
    out_path: z
      .string()
      .describe('Đường dẫn tương đối trong thư mục renders/, ví dụ "demo.mp4" (bắt buộc .mp4)'),
    media_dir: z.string().optional().describe("Ghi đè thư mục media (mặc định: media_dir của project)"),
  },
  async (args) => {
    try {
      const input = validateRenderVideoInput(args);
      try {
        await fs.access(RENDER_WORKER_JS);
      } catch {
        throw new ValidationError(`render worker không tồn tại: ${RENDER_WORKER_JS}`);
      }
      const { spec, meta } = await loadProject(input.project_id);
      // Validate chặt lần cuối trước khi render
      validateVideoSpec(spec);
      if (spec.tracks.length === 0 || projectDuration(spec) <= 0)
        throw new ValidationError(
          `project "${input.project_id}" đang trống (chưa có clip nào) — thêm clip bằng add_clip/add_text trước khi render`
        );
      const outAbs = resolveOutPath(input.out_path);
      await fs.mkdir(path.dirname(outAbs), { recursive: true });
      const mediaDir = input.media_dir ? await resolveMediaDir(input.media_dir) : meta.mediaDir;

      // Ghi spec ra file tạm (render worker đọc từ file)
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo1-render-"));
      const tmpSpec = path.join(tmpDir, "spec.json");
      try {
        await fs.writeFile(tmpSpec, JSON.stringify(spec), "utf8");
        // CHỈ gọi đúng render worker, argv cố định — không shell, không lệnh tuỳ ý
        const r = spawnSync(
          process.execPath,
          [RENDER_WORKER_JS, "--spec", tmpSpec, "--out", outAbs, "--media-dir", mediaDir, "-y"],
          { encoding: "utf8", timeout: 10 * 60 * 1000, maxBuffer: 16 * 1024 * 1024 }
        );
        if (r.status !== 0) {
          const errTail = String(r.stderr ?? r.stdout ?? r.error ?? "unknown error").slice(-2000);
          throw new ValidationError(`render thất bại (exit ${r.status}): ${errTail}`);
        }
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }

      const probe = probeVideo(outAbs);
      return ok({
        project_id: input.project_id,
        mp4_path: outAbs,
        ffprobe: probe,
      });
    } catch (e) {
      return handleError(e);
    }
  }
);

// ---------------------------------------------------------------------------
// R1-090: đăng ký tools mở rộng (Batch I)
// ---------------------------------------------------------------------------
registerClipTools(server);
registerModifyTools(server);
registerAiTools(server);
registerExportTools(server);

// ---------------------------------------------------------------------------
// Khởi động (stdio)
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Đảm bảo thư mục làm việc tồn tại trước khi nhận tool call
  await fs.mkdir(path.join(SERVER_DIR, "projects"), { recursive: true });
  await fs.mkdir(RENDERS_DIR, { recursive: true });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Ghi log ra stderr để không làm bẩn luồng stdout (MCP dùng stdout)
  console.error(`[repo-1-video] MCP server sẵn sàng (stdio). projects=${path.join(SERVER_DIR, "projects")}`);
}

main().catch((e: unknown) => {
  console.error(`[repo-1-video] khởi động thất bại: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
