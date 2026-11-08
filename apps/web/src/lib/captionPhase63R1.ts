/**
 * captionPhase63R1.ts — Localize phase text caption theo locale (đợt 63 R1,
 * đóng nợ đợt 62 R10 §10.4).
 *
 * Vấn đề: bridge stream NDJSON `{type:"phase", phase:<key>, message:<chuỗi vi>}`
 * (server/bridge/src/index.js:912/917, 1458/1464 — PHASE_LABELS /
 * TRANSLATE_PHASE_LABELS hardcode tiếng Việt), còn CaptionModal hiển thị
 * `evt.message` nguyên vẹn nên locale en vẫn thấy "Đã nhận file, chuẩn bị…"
 * / "Đang trích xuất audio…" (R10 đo headed 2 viewport).
 *
 * Sửa: map phase KEY (đã có sẵn trong event, ổn định qua mọi phiên bản
 * bridge) → chuỗi i18n trong fragment round63-r1. Fragment được import
 * trực tiếp lúc chạy (mẫu lib/templateContentLocale.ts với round56-m7) nên
 * chuỗi en hiện ngay, không chờ parent gộp dict vào vi.json/en.json.
 * Fallback giữ hành vi cũ: phase lạ / thiếu key → message bridge gửi kèm →
 * fallback `caption.processing` của caller. Không bao giờ trả key thô ra UI.
 *
 * Phạm vi: CHỈ caption (/api/caption + /api/caption/translate — cùng đi qua
 * runJob của CaptionModal). SceneModal có cùng pattern (scene phase upload/
 * scan) nhưng không thuộc nợ này — ghi nợ mở trong LIMITS R1 đợt 63.
 */
import fragment from "../i18n/fragments/round63-r1.json";
import type { Lang } from "../i18n";

/**
 * Các phase KEY bridge gửi cho job caption/translate — KHỚP 1:1 với
 * phaseFromLine / translatePhaseFromLine ở server/bridge/src/caption.js
 * + phase "upload" do index.js gửi đầu stream. Key trong fragment
 * round63-r1 (`caption.phase.<key>`) phải khớp tập này.
 */
export const CAPTION_PHASE_KEYS: readonly string[] = [
  "upload",
  "extract",
  "transcribe",
  "translating",
  "group",
];

/** Bảng song ngữ phase: `caption.phase.<key>` trong fragment round63-r1. */
export interface CaptionPhaseTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng phase từ fragment (test có thể truyền bảng riêng). */
export function captionPhaseTable(): CaptionPhaseTable {
  const f = fragment as unknown as {
    vi?: { caption?: { phase?: Record<string, string> } };
    en?: { caption?: { phase?: Record<string, string> } };
  };
  return {
    vi: (f.vi && f.vi.caption && f.vi.caption.phase) || {},
    en: (f.en && f.en.caption && f.en.caption.phase) || {},
  };
}

/**
 * Chuỗi phase đã localize theo locale; fallback vi khi thiếu key en
 * (đúng quy ước i18n/index.ts). Trả undefined khi phase lạ / không có
 * trong bảng — caller rớt xuống message của bridge.
 */
export function captionPhaseLabel(
  phase: string | undefined,
  lang: Lang,
  table: CaptionPhaseTable = captionPhaseTable(),
): string | undefined {
  if (!phase) return undefined;
  const hit = table[lang] && table[lang][phase];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[phase];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return undefined;
}

/**
 * Nhãn phase hiển thị trong CaptionModal bước running.
 * Thứ tự: chuỗi localize theo phase KEY → message bridge gửi kèm (chuỗi vi
 * cũ — giữ nguyên hiển thị khi fragment chưa có key) → fallback processing
 * của caller. Chuỗi rỗng / toàn khoảng trắng được coi như không có.
 */
export function resolveCaptionPhaseLabel(
  phase: string | undefined,
  message: string | undefined,
  lang: Lang,
  processingFallback: string,
  table?: CaptionPhaseTable,
): string {
  const localized =
    captionPhaseLabel(phase, lang, table) ??
    captionPhaseLabel(phase, "vi", table);
  if (localized) return localized;
  if (typeof message === "string" && message.trim().length > 0) return message;
  return processingFallback;
}
