/**
 * modify.ts — MCP tools chỉnh sửa thuộc tính clip:
 * apply_filter, apply_effect, apply_text_animation, set_speed, set_volume, add_keyframe.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LUT_IDS, EFFECT_TYPES, TEXT_ANIMATIONS } from "../../../packages/video-spec/src/index.js";
import { ValidationError } from "../validate.js";
import { loadProject } from "../store.js";
import { fail, findClip, handleError, mutateProject, ok, projectIdSchema } from "./common.js";

export function registerModifyTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  server.tool(
    "apply_filter",
    "Áp bộ lọc màu LUT cho 1 clip video.",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip video"),
      lut: z.enum(LUT_IDS as unknown as [string, ...string[]]).describe("ID bộ lọc LUT"),
    },
    async (args) => {
      try {
        const { spec: check } = await loadProject(args.project_id);
        const f = findClip(check, args.clip_id);
        if (!f) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        if (f.clip.kind !== "video") return fail(`clip "${args.clip_id}" không phải video`);
        const r = await mutateProject(args.project_id, "filter", (spec) => {
          const ff = findClip(spec, args.clip_id)!;
          const c = ff.clip as { filter?: { lut?: string } };
          c.filter = { ...(c.filter ?? {}), lut: args.lut };
        });
        return ok({ ...r, clip_id: args.clip_id, lut: args.lut });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "apply_effect",
    "Thêm hiệu ứng video (blur, grayscale...) vào 1 clip video.",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip video"),
      effect: z.enum(EFFECT_TYPES as unknown as [string, ...string[]]).describe("Loại hiệu ứng"),
      intensity: z.number().min(0).max(1).optional().describe("Cường độ 0..1 (mặc định 0.5)"),
    },
    async (args) => {
      try {
        const { spec: check } = await loadProject(args.project_id);
        const f = findClip(check, args.clip_id);
        if (!f) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        if (f.clip.kind !== "video") return fail(`clip "${args.clip_id}" không phải video`);
        const r = await mutateProject(args.project_id, "effect", (spec) => {
          const ff = findClip(spec, args.clip_id)!;
          const c = ff.clip as { effects?: Array<{ type: string; intensity?: number }> };
          const effects = [...(c.effects ?? [])];
          const idx = effects.findIndex((e) => e.type === args.effect);
          const entry = { type: args.effect, intensity: args.intensity ?? 0.5 };
          if (idx >= 0) effects[idx] = entry;
          else effects.push(entry);
          c.effects = effects;
        });
        return ok({ ...r, clip_id: args.clip_id, effect: args.effect });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "apply_text_animation",
    "Đổi animation cho 1 clip chữ.",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip text"),
      animation: z.enum(TEXT_ANIMATIONS as unknown as [string, ...string[]]).describe("Kiểu animation chữ"),
    },
    async (args) => {
      try {
        const { spec: check } = await loadProject(args.project_id);
        const f = findClip(check, args.clip_id);
        if (!f) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        if (f.clip.kind !== "text") return fail(`clip "${args.clip_id}" không phải text`);
        const r = await mutateProject(args.project_id, "text-anim", (spec) => {
          const ff = findClip(spec, args.clip_id)!;
          const c = ff.clip as { style: { animation?: string } };
          c.style.animation = args.animation;
        });
        return ok({ ...r, clip_id: args.clip_id, animation: args.animation });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "set_speed",
    "Chỉnh tốc độ phát và/hoặc phát ngược cho clip video/audio.",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip video hoặc audio"),
      speed: z.number().min(0.25).max(4).optional().describe("Tốc độ 0.25–4 (mặc định 1)"),
      reverse: z.boolean().optional().describe("Phát ngược"),
    },
    async (args) => {
      try {
        if (args.speed === undefined && args.reverse === undefined)
          return fail("cần ít nhất speed hoặc reverse");
        const { spec: check } = await loadProject(args.project_id);
        const f = findClip(check, args.clip_id);
        if (!f) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        if (f.clip.kind !== "video" && f.clip.kind !== "audio")
          return fail(`clip "${args.clip_id}" loại "${f.clip.kind}" không hỗ trợ speed`);
        const r = await mutateProject(args.project_id, "speed", (spec) => {
          const ff = findClip(spec, args.clip_id)!;
          const c = ff.clip as { speed?: number; reverse?: boolean };
          if (args.speed !== undefined) c.speed = args.speed;
          if (args.reverse !== undefined) c.reverse = args.reverse;
        });
        return ok({ ...r, clip_id: args.clip_id, speed: args.speed, reverse: args.reverse });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "set_volume",
    "Chỉnh âm lượng / fade cho clip audio (hoặc tiếng kế thừa của video).",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip audio hoặc video"),
      volume: z.number().min(0).max(2).optional().describe("Âm lượng 0..2"),
      fadeIn: z.number().nonnegative().optional().describe("Fade in (giây)"),
      fadeOut: z.number().nonnegative().optional().describe("Fade out (giây)"),
      mute_source: z.boolean().optional().describe("true = tắt tiếng gốc của video (sourceAudioMode=mute)"),
    },
    async (args) => {
      try {
        const { spec: check } = await loadProject(args.project_id);
        const f = findClip(check, args.clip_id);
        if (!f) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        if (f.clip.kind !== "audio" && f.clip.kind !== "video")
          return fail(`clip "${args.clip_id}" loại "${f.clip.kind}" không hỗ trợ volume`);
        const r = await mutateProject(args.project_id, "volume", (spec) => {
          const ff = findClip(spec, args.clip_id)!;
          const c = ff.clip as {
            volume?: number; fadeIn?: number; fadeOut?: number; sourceAudioMode?: string;
          };
          if (args.volume !== undefined) {
            if (ff.clip.kind !== "audio")
              throw new ValidationError("volume chỉ áp dụng cho clip audio");
            c.volume = args.volume;
          }
          if (args.fadeIn !== undefined) {
            if (ff.clip.kind !== "audio")
              throw new ValidationError("fadeIn chỉ áp dụng cho clip audio");
            c.fadeIn = args.fadeIn;
          }
          if (args.fadeOut !== undefined) {
            if (ff.clip.kind !== "audio")
              throw new ValidationError("fadeOut chỉ áp dụng cho clip audio");
            c.fadeOut = args.fadeOut;
          }
          if (args.mute_source !== undefined) {
            if (ff.clip.kind !== "video")
              throw new ValidationError("mute_source chỉ áp dụng cho clip video");
            c.sourceAudioMode = args.mute_source ? "mute" : "inherit";
          }
        });
        return ok({ ...r, clip_id: args.clip_id });
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // -------------------------------------------------------------------------
  server.tool(
    "add_keyframe",
    "Thêm keyframe animation (x, y, opacity, scale, rotation) vào clip.",
    {
      project_id: projectIdSchema,
      clip_id: z.string().describe("ID clip"),
      property: z.enum(["x", "y", "opacity", "scale", "rotation"]).describe("Thuộc tính animate"),
      time: z.number().nonnegative().describe("Thời điểm keyframe, tính từ ĐẦU CLIP (giây)"),
      value: z.number().describe("Giá trị tại keyframe"),
      easing: z.enum(["linear", "ease-in", "ease-out"]).optional().describe("Easing (mặc định linear)"),
    },
    async (args) => {
      try {
        const { spec: check } = await loadProject(args.project_id);
        const f = findClip(check, args.clip_id);
        if (!f) return fail(`không tìm thấy clip id "${args.clip_id}"`);
        if (args.time > f.clip.duration)
          return fail(`time (${args.time}) vượt quá duration clip (${f.clip.duration})`);
        const r = await mutateProject(args.project_id, "keyframe", (spec) => {
          const ff = findClip(spec, args.clip_id)!;
          const c = ff.clip as {
            animations?: Record<string, { keyframes: Array<{ t: number; v: number; easing: string }> }>;
          };
          if (!c.animations) c.animations = {};
          if (!c.animations[args.property]) c.animations[args.property] = { keyframes: [] };
          const kfs = c.animations[args.property].keyframes;
          // Thay thế keyframe trùng thời điểm (sai số 1ms)
          const idx = kfs.findIndex((k) => Math.abs(k.t - args.time) < 0.001);
          const entry = { t: args.time, v: args.value, easing: args.easing ?? "linear" };
          if (idx >= 0) kfs[idx] = entry;
          else {
            kfs.push(entry);
            kfs.sort((a, b) => a.t - b.t);
          }
          if (kfs.length > 32)
            throw new ValidationError("quá 32 keyframe cho một thuộc tính");
        });
        return ok({ ...r, clip_id: args.clip_id, property: args.property });
      } catch (e) {
        return handleError(e);
      }
    }
  );
}
