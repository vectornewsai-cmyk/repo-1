/**
 * clips.ts — MCP tools thao tác clip: thêm/xoá/cắt/tách.
 *
 * - add_audio / add_sticker / add_image: shortcut thêm clip (tự tạo track)
 * - trim_clip: chỉnh in/out/start/duration
 * - split_clip: tách clip tại 1 thời điểm timeline
 * - delete_clip: xoá clip
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AudioClip, ImageClip, StickerClip, Track } from "../../../packages/video-spec/src/index.js";
import { ValidationError } from "../validate.js";
import { loadProject, saveProject } from "../store.js";
import {
  doRedo,
  doUndo,
  fail,
  findClip,
  handleError,
  mutateProject,
  ok,
  projectIdSchema,
  pushHistory,
} from "./common.js";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function newClipId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function registerClipTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  server.tool(
    "add_audio",
    "Thêm clip audio (nhạc nền, giọng đọc, hiệu ứng âm thanh) vào timeline. Tự tạo track audio nếu chưa có.",
    {
      project_id: projectIdSchema,
      src: z.string().describe('Tên file audio trong thư mục media, vd "nhac-nen.mp3"'),
      start: z.number().nonnegative().describe("Vị trí trên timeline (giây)"),
      duration: z.number().positive().describe("Độ dài hiển thị (giây)"),
      in: z.number().nonnegative().optional().describe("Điểm cắt vào trong file nguồn (giây, mặc định 0)"),
      out: z.number().positive().optional().describe("Điểm cắt ra trong file nguồn (giây, mặc định = in + duration)"),
      volume: z.number().min(0).max(2).optional().describe("Âm lượng 0..2 (mặc định 1)"),
      fadeIn: z.number().nonnegative().optional().describe("Fade in (giây)"),
      fadeOut: z.number().nonnegative().optional().describe("Fade out (giây)"),
      track_id: z.string().optional().describe("ID track audio muốn thêm vào (mặc định: track audio đầu tiên hoặc tạo mới)"),
    },
    async (args) => {
      try {
        const { spec } = await loadProject(args.project_id);
        let track: Track | undefined;
        if (args.track_id) {
          track = spec.tracks.find((t) => t.id === args.track_id);
          if (!track) return fail(`không tìm thấy track_id "${args.track_id}"`);
          if (track.kind !== "audio") return fail(`track "${args.track_id}" không phải loại audio`);
        } else {
          track = spec.tracks.find((t) => t.kind === "audio");
        }
        pushHistory(args.project_id, spec);
        if (!track) {
          track = { id: `a${spec.tracks.length + 1}`, kind: "audio", clips: [] };
          spec.tracks.push(track);
        }
        const inPt = args.in ?? 0;
        const outPt = args.out ?? inPt + args.duration;
        const clip: AudioClip = {
          kind: "audio",
          id: newClipId("au"),
          src: args.src,
          start: args.start,
          duration: args.duration,
          in: inPt,
          out: outPt,
        };
        if (args.volume !== undefined) clip.volume = args.volume;
        if (args.fadeIn !== undefined) clip.fadeIn = args.fadeIn;
        if (args.fadeOut !== undefined) clip.fadeOut = args.fadeOut;
        track.clips.push(clip);
        await saveProject(args.project_id, spec);
        return ok({ project_id: args.project_id, track_id: track.id, clip_id: clip.id });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "add_sticker",
    "Thêm sticker PNG lên video. Tự tạo track sticker nếu chưa có.",
    {
      project_id: projectIdSchema,
      src: z.string().describe('Tên file PNG sticker trong thư mục media, vd "vui-ve.png"'),
      start: z.number().nonnegative().describe("Vị trí trên timeline (giây)"),
      duration: z.number().positive().describe("Độ dài hiển thị (giây)"),
      x: z.number().min(0).max(1).optional().describe("Tâm ngang 0..1 (mặc định 0.5)"),
      y: z.number().min(0).max(1).optional().describe("Tâm dọc 0..1 (mặc định 0.5)"),
      scale: z.number().positive().optional().describe("Tỉ lệ so với chiều rộng khung hình (mặc định 0.25)"),
      opacity: z.number().min(0).max(1).optional(),
      rotation: z.number().optional().describe("Góc xoay (độ)"),
      track_id: z.string().optional(),
    },
    async (args) => {
      try {
        const { spec } = await loadProject(args.project_id);
        let track: Track | undefined;
        if (args.track_id) {
          track = spec.tracks.find((t) => t.id === args.track_id);
          if (!track) return fail(`không tìm thấy track_id "${args.track_id}"`);
          if (track.kind !== "sticker") return fail(`track "${args.track_id}" không phải loại sticker`);
        } else {
          track = spec.tracks.find((t) => t.kind === "sticker");
        }
        pushHistory(args.project_id, spec);
        if (!track) {
          track = { id: `s${spec.tracks.length + 1}`, kind: "sticker", clips: [] };
          spec.tracks.push(track);
        }
        const clip: StickerClip = {
          kind: "sticker",
          id: newClipId("st"),
          src: args.src,
          start: args.start,
          duration: args.duration,
        };
        if (args.x !== undefined) clip.x = args.x;
        if (args.y !== undefined) clip.y = args.y;
        if (args.scale !== undefined) clip.scale = args.scale;
        if (args.opacity !== undefined) clip.opacity = args.opacity;
        if (args.rotation !== undefined) clip.rotation = args.rotation;
        track.clips.push(clip);
        await saveProject(args.project_id, spec);
        return ok({ project_id: args.project_id, track_id: track.id, clip_id: clip.id });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "add_image",
    "Thêm ảnh tĩnh lên timeline. Tự tạo track image nếu chưa có.",
    {
      project_id: projectIdSchema,
      src: z.string().describe('Tên file ảnh trong thư mục media, vd "anh-bia.jpg"'),
      start: z.number().nonnegative().describe("Vị trí trên timeline (giây)"),
      duration: z.number().positive().describe("Độ dài hiển thị (giây)"),
      fit: z.enum(["contain", "cover"]).optional().describe("Cách lấp đầy khung hình (mặc định contain)"),
      track_id: z.string().optional(),
    },
    async (args) => {
      try {
        const { spec } = await loadProject(args.project_id);
        let track: Track | undefined;
        if (args.track_id) {
          track = spec.tracks.find((t) => t.id === args.track_id);
          if (!track) return fail(`không tìm thấy track_id "${args.track_id}"`);
          if (track.kind !== "image") return fail(`track "${args.track_id}" không phải loại image`);
        } else {
          track = spec.tracks.find((t) => t.kind === "image");
        }
        pushHistory(args.project_id, spec);
        if (!track) {
          track = { id: `i${spec.tracks.length + 1}`, kind: "image", clips: [] };
          spec.tracks.push(track);
        }
        const clip: ImageClip = {
          kind: "image",
          id: newClipId("im"),
          src: args.src,
          start: args.start,
          duration: args.duration,
        };
        if (args.fit !== undefined) clip.fit = args.fit;
        track.clips.push(clip);
        await saveProject(args.project_id, spec);
        return ok({ project_id: args.project_id, track_id: track.id, clip_id: clip.id });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "trim_clip",
    "Cắt/xén clip: chỉnh điểm in/out trong file nguồn và/hoặc vị trí + độ dài trên timeline.",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip cần trim"),
      in: z.number().nonnegative().optional().describe("Điểm cắt vào mới trong file nguồn (giây)"),
      out: z.number().positive().optional().describe("Điểm cắt ra mới trong file nguồn (giây)"),
      start: z.number().nonnegative().optional().describe("Vị trí mới trên timeline (giây)"),
      duration: z.number().positive().optional().describe("Độ dài hiển thị mới (giây)"),
    },
    async (args) => {
      try {
        const found = findClip((await loadProject(args.project_id)).spec, args.clip_id);
        if (!found) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        const result = await mutateProject(args.project_id, "trim", (spec) => {
          const f = findClip(spec, args.clip_id)!;
          const c = f.clip as { in?: number; out?: number; start: number; duration: number };
          if (args.in !== undefined && "in" in c) (c as { in: number }).in = args.in;
          if (args.out !== undefined && "out" in c) (c as { out: number }).out = args.out;
          if (args.start !== undefined) c.start = args.start;
          if (args.duration !== undefined) c.duration = args.duration;
          // Validate out > in cho clip có in/out
          if ("in" in c && "out" in c) {
            const ci = c as { in: number; out: number };
            if (ci.out <= ci.in) throw new ValidationError(`out (${ci.out}) phải > in (${ci.in})`);
          }
        });
        return ok({ ...result, clip_id: args.clip_id });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "split_clip",
    "Tách 1 clip thành 2 clip tại thời điểm timeline cho trước (giữ nguyên in/out nguồn tương ứng).",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip cần tách"),
      at: z.number().nonnegative().describe("Thời điểm tách trên timeline (giây, phải nằm trong clip)"),
    },
    async (args) => {
      try {
        const { spec: checkSpec } = await loadProject(args.project_id);
        const found = findClip(checkSpec, args.clip_id);
        if (!found) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        const c = found.clip;
        if (args.at <= c.start || args.at >= c.start + c.duration)
          return fail(`at (${args.at}) phải nằm trong clip [${c.start}, ${c.start + c.duration}]`);
        if (!("in" in c) || !("out" in c))
          return fail(`clip "${args.clip_id}" loại "${c.kind}" không hỗ trợ tách (chỉ video/audio)`);
        const result = await mutateProject(args.project_id, "split", (spec) => {
          const f = findClip(spec, args.clip_id)!;
          const orig = f.clip as unknown as Record<string, unknown>;
          const offset = args.at - (orig["start"] as number);
          const inPt = orig["in"] as number;
          const speed = (orig["speed"] as number | undefined) ?? 1;
          // Vị trí tương ứng trong file nguồn (tính theo speed)
          const srcAt = inPt + offset * speed;
          const leftId = orig["id"] as string;
          const rightId = newClipId(leftId.split("_")[0] || "cl");
          const left: Record<string, unknown> = { ...orig };
          const right: Record<string, unknown> = { ...orig, id: rightId };
          left["duration"] = offset;
          left["out"] = srcAt;
          right["start"] = args.at;
          right["duration"] = (orig["duration"] as number) - offset;
          right["in"] = srcAt;
          // Xoá transitionOut của nửa trái và transitionIn của nửa phải để không bị chồng
          delete left["transitionOut"];
          delete right["transitionIn"];
          f.track.clips.splice(f.clipIndex, 1, left as never, right as never);
        });
        return ok({ ...result, clip_id: args.clip_id, split_at: args.at });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "delete_clip",
    "Xoá 1 clip khỏi timeline.",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip cần xoá"),
    },
    async (args) => {
      try {
        const { spec: checkSpec } = await loadProject(args.project_id);
        if (!findClip(checkSpec, args.clip_id)) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        const result = await mutateProject(args.project_id, "delete", (spec) => {
          const f = findClip(spec, args.clip_id)!;
          f.track.clips.splice(f.clipIndex, 1);
        });
        return ok({ ...result, deleted_clip_id: args.clip_id });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "undo",
    "Hoàn tác 1 bước thay đổi gần nhất trên project.",
    { project_id: projectIdSchema },
    async (args) => {
      try {
        const r = await doUndo(args.project_id);
        return ok({ project_id: args.project_id, undone: true, remaining_undo: r.remaining });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "redo",
    "Làm lại 1 bước vừa undo.",
    { project_id: projectIdSchema },
    async (args) => {
      try {
        const r = await doRedo(args.project_id);
        return ok({ project_id: args.project_id, redone: true, remaining_redo: r.remaining });
      } catch (e) {
        return handleError(e);
      }
    }
  );
}
