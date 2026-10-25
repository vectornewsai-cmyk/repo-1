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

/**
 * 1 từ của auto-caption — Phase 9 R4: word timestamps từ faster-whisper
 * (caption.py trả `words`, bridge chuyển tiếp nguyên vẹn). start/end theo
 * thời gian media (gốc 0 = đầu file), cùng gốc với CaptionSegment.
 */
export interface CaptionWord {
  start: number;
  end: number;
  word: string;
}

/** Validate mảng words từ bridge (không tin dữ liệu mạng mù quáng). */
export function validateCaptionWords(raw: unknown): CaptionWord[] {
  if (!Array.isArray(raw)) return [];
  const out: CaptionWord[] = [];
  for (const w of raw) {
    const r = w as Record<string, unknown> | null;
    const start = Number(r?.start);
    const end = Number(r?.end);
    const word = String(r?.word ?? "").trim();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (start < 0 || end <= start) continue;
    if (!word) continue;
    out.push({
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      word: word.slice(0, 100),
    });
  }
  out.sort((a, b) => a.start - b.start);
  return out.slice(0, 20000);
}

/**
 * Map words vào từng segment: từ thuộc về segment chứa word.start (dung sai
 * 0.05s ở biên trái để khớp làm tròn). Từ nào không rơi vào segment nào thì
 * bị bỏ (không tạo karaoke ma). Trả về mảng song song với segments.
 */
export function wordsForSegments(
  segments: CaptionSegment[],
  words: CaptionWord[]
): CaptionWord[][] {
  const out: CaptionWord[][] = segments.map(() => []);
  const sorted = [...segments]
    .map((s, i) => ({ ...s, i }))
    .sort((a, b) => a.start - b.start);
  for (const w of words) {
    let target: (typeof sorted)[number] | undefined;
    for (const s of sorted) {
      if (w.start >= s.start - 0.05 && w.start < s.end) {
        target = s;
        break;
      }
    }
    if (!target) {
      // Từ ở biên phải segment cuối (làm tròn): gán vào segment cuối nếu kề.
      const last = sorted[sorted.length - 1];
      if (last && Math.abs(w.start - last.end) <= 0.05) target = last;
    }
    if (target) out[target.i].push(w);
  }
  return out;
}

/** Đổi words của 1 segment thành karaoke clip-local (gốc 0 = clip.start). */
export function wordsToKaraoke(
  segment: CaptionSegment,
  words: CaptionWord[]
): { word: string; start: number; end: number }[] {
  return words
    .filter((w) => w.end > segment.start && w.start < segment.end)
    .map((w) => ({
      word: w.word,
      start: Math.max(0, Math.round((w.start - segment.start) * 100) / 100),
      end: Math.min(
        Math.round((segment.end - segment.start) * 100) / 100,
        Math.round((w.end - segment.start) * 100) / 100
      ),
    }))
    .filter((w) => w.end > w.start);
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
  /** Màu tô sáng karaoke mặc định (vàng) — chỉ dùng khi clip có karaoke. */
  highlightColor: "#ffff00",
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
 * R1-080: ngôn ngữ đích cho dịch phụ đề.
 * faster-whisper "translate" task CHỈ dịch sang tiếng Anh (giới hạn của model)
 * — list này mở rộng được khi có engine MT khác (vd: argos-translate en→vi).
 */
export const TRANSLATE_TARGET_LANGS = [
  { code: "en", label: "Tiếng Anh" },
] as const;

export type TranslateTargetCode = (typeof TRANSLATE_TARGET_LANGS)[number]["code"];

/** Nhãn track cho phụ đề đã dịch — hiển thị trong timeline. */
export function translatedTrackLabel(targetCode: string): string {
  return `Phụ đề (${targetCode.toUpperCase()})`;
}

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
 * Nếu truyền `words` (word timestamps từ cùng lần caption), mỗi clip được
 * gắn karaoke clip-local (gốc 0 = clip.start) — render ASS \k và preview
 * tô sáng từng từ theo đúng thời gian đó. Không có words → chữ thường.
 */
export function segmentsToTextClips(
  segments: CaptionSegment[],
  style?: Partial<TextStyle>,
  words?: CaptionWord[]
): TextClip[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const bySeg = words ? wordsForSegments(sorted, words) : null;
  return sorted.map((s, i) => {
    const clip: TextClip = {
      kind: "text" as const,
      id: uid(`cap${i + 1}-`),
      text: s.text,
      start: Math.round(s.start * 100) / 100,
      duration: Math.max(0.2, Math.round((s.end - s.start) * 100) / 100),
      style: { ...CAPTION_DEFAULT_STYLE, ...style },
    };
    if (bySeg) {
      const karaoke = wordsToKaraoke(s, bySeg[i]);
      if (karaoke.length > 0) clip.karaoke = karaoke;
    }
    return clip;
  });
}
