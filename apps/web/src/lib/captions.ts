/**
 * captions.ts — logic thuần cho auto-caption (R1-072).
 *
 * Đổi segments từ bridge (POST /api/caption) thành TextClip[] để chèn lên
 * timeline. Không chạm DOM/store — test được bằng Node.
 */
import type { TextClip, TextStyle } from "@repo-1/video-spec";
import { uid } from "../lib";

/** 1 câu phụ đề: thời gian tính theo giây, gốc 0 = đầu file media. */
export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export const CAPTION_TRACK_LABEL = "Phụ đề";

/**
 * Style mặc định của clip phụ đề — KHỚP với CAPTION_STYLE trong
 * server/caption/caption.py để preview và render vẽ giống nhau.
 */
export const CAPTION_DEFAULT_STYLE: TextStyle = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 56,
  color: "#ffffff",
  backgroundColor: "#000000",
  bold: true,
  italic: false,
  x: 0.5,
  y: 0.85,
  animation: "none",
};

export const CAPTION_LANGS = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "auto", label: "Tự động phát hiện" },
] as const;

export type CaptionLangCode = (typeof CAPTION_LANGS)[number]["code"];

/**
 * Validate mảng segments từ bridge (không tin dữ liệu mạng mù quáng).
 * Bỏ qua câu hỏng, sắp xếp theo start. Throw nếu không còn câu nào.
 */
export function validateCaptionSegments(raw: unknown): CaptionSegment[] {
  if (!Array.isArray(raw)) throw new Error("Dữ liệu phụ đề không hợp lệ.");
  const out: CaptionSegment[] = [];
  for (const s of raw) {
    const r = s as Record<string, unknown> | null;
    const start = Number(r?.start);
    const end = Number(r?.end);
    const text = String(r?.text ?? "").trim();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (start < 0 || end <= start) continue;
    if (!text) continue;
    out.push({
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      text: text.slice(0, 500),
    });
  }
  out.sort((a, b) => a.start - b.start);
  if (out.length === 0) throw new Error("Không có câu phụ đề hợp lệ nào.");
  if (out.length > 5000) throw new Error("Quá nhiều câu phụ đề.");
  return out;
}

/**
 * Đổi segments thành TextClip[] sẵn sàng chèn lên timeline.
 * Mỗi câu → 1 clip, id duy nhất, thời gian làm tròn 2 chữ số thập phân.
 */
export function segmentsToTextClips(
  segments: CaptionSegment[],
  style?: Partial<TextStyle>
): TextClip[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  return sorted.map((s, i) => ({
    kind: "text" as const,
    id: uid(`cap${i + 1}-`),
    text: s.text,
    start: Math.round(s.start * 100) / 100,
    duration: Math.max(0.2, Math.round((s.end - s.start) * 100) / 100),
    style: { ...CAPTION_DEFAULT_STYLE, ...style },
  }));
}
