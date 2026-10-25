/**
 * templatePack.ts — logic “template pack 1 chạm” (R1, Phase 9).
 *
 * Luồng: chọn 1 template trong PACK_TEMPLATE_IDS → sinh media mẫu cho mọi
 * placeholder media (video = webm ghi realtime, ảnh = PNG Canvas) → áp
 * template bằng applyTemplateValues (text lấy đúng default của template) →
 * spec hoàn chỉnh, không còn marker.
 *
 * Tách riêng phần thuần (resolvePackSpec, packMediaSeconds) khỏi phần cần
 * trình duyệt (generatePackFiles) để test Node được mà không cần DOM.
 *
 * Ràng buộc trung thực:
 * - Pack chỉ nhận template có placeholder video/image/text. Placeholder audio
 *   → lỗi rõ ràng (không sinh audio giả).
 * - Video sinh thất bại (thiếu MediaRecorder) → lỗi rõ ràng, không dùng ảnh
 *   tĩnh giả làm video.
 * - Tên file sinh ra có hậu tố duy nhất theo lần tạo, để tạo cùng 1 pack 2 lần
 *   không bị importFiles đổi tên (đổi tên là vỡ liên kết src trong spec).
 */
import { applyTemplateValues, type ApplyResult, type TemplateDef } from "./templateEngine";
import { TEMPLATES } from "./templates";
import { packSize, recordPackMedia, stillPackMedia, type GeneratedMedia } from "./sampleMedia";

/** 6 pack tuyển: mỗi pack đúng 1 placeholder media, phủ 16:9 / 1:1 / 9:16. */
export const PACK_TEMPLATE_IDS = [
  "title-card", // 16:9, ảnh + chữ, 4s — nhanh nhất
  "youtube-intro", // 16:9, video + chữ, 5s
  "birthday-card", // 1:1, ảnh + chữ, 6s
  "app-launch", // 9:16, video + chữ, 6s
  "travel-vlog-intro", // 16:9, video + chữ, 6s
  "sale-countdown", // 9:16, video + chữ, 6s
] as const;

export interface PackDef {
  tpl: TemplateDef;
}

export function getPacks(): TemplateDef[] {
  const byId = new Map(TEMPLATES.map((t) => [t.template.id, t]));
  const packs: TemplateDef[] = [];
  for (const id of PACK_TEMPLATE_IDS) {
    const tpl = byId.get(id);
    if (tpl) packs.push(tpl);
  }
  return packs;
}

/** Độ dài cần sinh cho 1 placeholder media = clip dài nhất trỏ tới nó. */
export function packMediaSeconds(tpl: TemplateDef, placeholderId: string): number {
  const marker = `{{${placeholderId}}}`;
  let max = 0;
  for (const track of tpl.spec.tracks) {
    for (const clip of track.clips) {
      const c = clip as unknown as Record<string, unknown>;
      if (c["src"] === marker && typeof c["duration"] === "number") {
        max = Math.max(max, c["duration"] as number);
      }
    }
  }
  return max > 0 ? max : tpl.template.durationSec;
}

/**
 * Áp template với media đã sinh sẵn. fileNames[placeholderId] = tên file thật.
 * Text placeholder không cần truyền (applyTemplateValues tự lấy default).
 * Trả lỗi nếu thiếu file cho placeholder media hoặc còn marker sau khi áp.
 */
export function resolvePackSpec(
  tpl: TemplateDef,
  fileNames: Record<string, string>,
): ApplyResult {
  const values: Record<string, string> = {};
  for (const p of tpl.template.placeholders) {
    if (p.kind === "video" || p.kind === "image") {
      if (!fileNames[p.id]) {
        return { ok: false, error: `Thiếu media mẫu cho placeholder: ${p.id}` };
      }
      values[p.id] = fileNames[p.id];
    } else if (p.kind === "audio") {
      return { ok: false, error: `Pack chưa hỗ trợ placeholder audio: ${p.id}` };
    }
    // text: để trống → applyTemplateValues dùng default của template.
  }
  return applyTemplateValues(tpl, values);
}

/** Câu chữ đầu tiên trong spec (dùng cho nút “Tạo giọng đọc mẫu”). */
export function firstTextOf(spec: TemplateDef["spec"]): string | null {
  for (const track of spec.tracks) {
    for (const clip of track.clips) {
      const c = clip as unknown as Record<string, unknown>;
      if (c["kind"] === "text" && typeof c["text"] === "string" && (c["text"] as string).trim() !== "") {
        return c["text"] as string;
      }
    }
  }
  return null;
}

export class PackError extends Error {}

/**
 * Sinh file media mẫu cho mọi placeholder media của template (chạy trên trình
 * duyệt). `suffix` phải duy nhất mỗi lần tạo (vd: Date.now()).
 */
export async function generatePackFiles(
  tpl: TemplateDef,
  suffix: string,
): Promise<{ files: File[]; fileNames: Record<string, string>; thumbs: Record<string, string> }> {
  const files: File[] = [];
  const fileNames: Record<string, string> = {};
  const thumbs: Record<string, string> = {};
  let variant = 0;
  for (const p of tpl.template.placeholders) {
    if (p.kind !== "video" && p.kind !== "image") continue;
    const seconds = packMediaSeconds(tpl, p.id);
    const label = tpl.template.name.toUpperCase();
    let gen: GeneratedMedia | null;
    if (p.kind === "video") {
      const name = `pack-${tpl.template.id}-${p.id}-${suffix}.webm`;
      gen = await recordPackMedia(name, tpl.template.aspect, seconds, variant, label);
      if (!gen) {
        throw new PackError("NO_RECORDER");
      }
    } else {
      const name = `pack-${tpl.template.id}-${p.id}-${suffix}.png`;
      gen = stillPackMedia(name, tpl.template.aspect, variant, label);
    }
    files.push(gen.file);
    fileNames[p.id] = gen.file.name;
    thumbs[p.id] = gen.thumb;
    variant += 1;
  }
  return { files, fileNames, thumbs };
}

/** Kích thước preview pack (để UI hiện đúng khung aspect). */
export function packPreviewSize(aspect: string): { width: number; height: number } {
  return packSize(aspect);
}
