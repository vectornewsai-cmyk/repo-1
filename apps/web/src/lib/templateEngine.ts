/**
 * templateEngine.ts — áp template vào project (R1-104/R1-105, Batch J).
 *
 * Template là JSON: { template: {id, name, ..., placeholders[]}, spec: VideoSpec }.
 * Placeholder được đánh dấu {{id}} trong mọi field chuỗi của spec
 * (clip.src, text clip .text, v.v.).
 *
 * applyTemplateValues(clone) spec, thay toàn bộ marker bằng giá trị người dùng
 * chọn, rồi trả về VideoSpec sẵn sàng cho store.replaceProject().
 */

import { isVideoSpec, type VideoSpec } from "@repo-1/video-spec";

export interface TemplatePlaceholder {
  id: string;
  kind: "video" | "image" | "audio" | "text";
  label: string;
  /** Giá trị mặc định (tên file mẫu / câu chữ mẫu). */
  default: string;
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  license: string;
  tags: string[];
  aspect: string;
  durationSec: number;
  placeholders: TemplatePlaceholder[];
}

export interface TemplateDef {
  template: TemplateMeta;
  spec: VideoSpec;
}

/** Kết quả áp template. */
export type ApplyResult =
  | { ok: true; spec: VideoSpec }
  | { ok: false; error: string };

const MARKER_RE = /\{\{(\w+)\}\}/g;

/** Liệt kê mọi placeholder id còn sót trong spec (sau khi thay). */
export function findUnresolvedMarkers(spec: VideoSpec): string[] {
  const found = new Set<string>();
  const walk = (v: unknown): void => {
    if (typeof v === "string") {
      for (const m of v.matchAll(MARKER_RE)) found.add(m[1]);
    } else if (Array.isArray(v)) {
      for (const x of v) walk(x);
    } else if (v && typeof v === "object") {
      for (const x of Object.values(v as Record<string, unknown>)) walk(x);
    }
  };
  walk(spec);
  return [...found].sort();
}

/**
 * Áp giá trị placeholder vào template.
 * - values[id]: giá trị người dùng chọn (tên file media / nội dung chữ).
 * - Placeholder không có trong values → dùng `default` của nó.
 * Trả về lỗi nếu còn marker chưa thay được hoặc spec không hợp lệ.
 */
export function applyTemplateValues(
  tpl: TemplateDef,
  values: Record<string, string>
): ApplyResult {
  const spec = JSON.parse(JSON.stringify(tpl.spec)) as VideoSpec;

  const resolved: Record<string, string> = {};
  for (const p of tpl.template.placeholders) {
    const v = (values[p.id] ?? "").trim();
    resolved[p.id] = v === "" ? p.default : v;
  }

  const replaceIn = (v: unknown): unknown => {
    if (typeof v === "string") {
      return v.replace(MARKER_RE, (_m, id: string) =>
        id in resolved ? resolved[id] : `{{${id}}}`
      );
    }
    if (Array.isArray(v)) return v.map(replaceIn);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = replaceIn(x);
      return out;
    }
    return v;
  };

  const finalSpec = replaceIn(spec) as VideoSpec;

  const unresolved = findUnresolvedMarkers(finalSpec);
  if (unresolved.length > 0) {
    return {
      ok: false,
      error: `Template thiếu giá trị cho: ${unresolved.join(", ")}`,
    };
  }
  if (!isVideoSpec(finalSpec)) {
    return { ok: false, error: "Spec sau khi áp template không hợp lệ." };
  }
  // Đặt tên project theo template để dễ nhận biết.
  finalSpec.meta.name = `${tpl.template.name} — ${finalSpec.meta.name}`;
  return { ok: true, spec: finalSpec };
}
