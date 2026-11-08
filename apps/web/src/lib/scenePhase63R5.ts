/**
 * scenePhase63R5.ts — Localize phase text tách cảnh theo locale (đợt 63 R5,
 * đóng nợ đợt 62 R5 §6.2 + đợt 63 R1 LIMITS: scene phase còn lại).
 *
 * Vấn đề: bridge stream NDJSON `{type:"phase", phase:<key>, message:<chuỗi vi>}`
 * (server/bridge/src/index.js:1372/1379 — SCENE_PHASE_LABELS hardcode tiếng
 * Việt), còn SceneModal hiển thị `ev.message` nguyên vẹn nên locale en vẫn
 * thấy "Đã nhận file, chuẩn bị…" / "Đang quét chuyển cảnh…".
 *
 * Sửa (đúng mẫu lib/captionPhase63R1.ts đợt 63 R1): map phase KEY (đã có sẵn
 * trong event, ổn định qua mọi phiên bản bridge) → chuỗi i18n trong fragment
 * round63-r5. Fragment được import trực tiếp lúc chạy nên chuỗi en hiện ngay,
 * không chờ parent gộp dict vào vi.json/en.json. Fallback giữ hành vi cũ:
 * phase lạ / thiếu key → message bridge gửi kèm → "" (SceneModal giữ chuỗi
 * rỗng như cũ). Không bao giờ trả key thô ra UI.
 *
 * Phạm vi: CHỈ scene (/api/scene). Caption/translate đã xong ở R1
 * (captionPhase63R1.ts + fragment round63-r1).
 */
import fragment from "../i18n/fragments/round63-r5.json";
import type { Lang } from "../i18n";

/**
 * Các phase KEY bridge gửi cho job scene — KHỚP 1:1 với SCENE_PHASE_LABELS
 * ở server/bridge/src/index.js (upload đầu stream + scan từ runSceneDetect).
 * Key trong fragment round63-r5 (`scene.phase.<key>`) phải khớp tập này.
 */
export const SCENE_PHASE_KEYS: readonly string[] = ["upload", "scan"];

/** Bảng song ngữ phase: `scene.phase.<key>` trong fragment round63-r5. */
export interface ScenePhaseTable {
  vi: Record<string, string>;
  en: Record<string, string>;
}

/** Đọc bảng phase từ fragment (test có thể truyền bảng riêng). */
export function scenePhaseTable(): ScenePhaseTable {
  const f = fragment as unknown as {
    vi?: { scene?: { phase?: Record<string, string> } };
    en?: { scene?: { phase?: Record<string, string> } };
  };
  return {
    vi: (f.vi && f.vi.scene && f.vi.scene.phase) || {},
    en: (f.en && f.en.scene && f.en.scene.phase) || {},
  };
}

/**
 * Chuỗi phase đã localize theo locale; fallback vi khi thiếu key en
 * (đúng quy ước i18n/index.ts). Trả undefined khi phase lạ / không có
 * trong bảng — caller rớt xuống message của bridge.
 */
export function scenePhaseLabel(
  phase: string | undefined,
  lang: Lang,
  table: ScenePhaseTable = scenePhaseTable(),
): string | undefined {
  if (!phase) return undefined;
  const hit = table[lang] && table[lang][phase];
  if (typeof hit === "string" && hit.length > 0) return hit;
  const vi = table.vi[phase];
  if (typeof vi === "string" && vi.length > 0) return vi;
  return undefined;
}

/**
 * Nhãn phase hiển thị trong SceneModal bước running.
 * Thứ tự: chuỗi localize theo phase KEY → message bridge gửi kèm (chuỗi vi
 * cũ — giữ nguyên hiển thị khi fragment chưa có key) → "" (như cũ).
 * Chuỗi rỗng / toàn khoảng trắng được coi như không có.
 */
export function resolveScenePhaseLabel(
  phase: string | undefined,
  message: string | undefined,
  lang: Lang,
  table?: ScenePhaseTable,
): string {
  const localized =
    scenePhaseLabel(phase, lang, table) ?? scenePhaseLabel(phase, "vi", table);
  if (localized) return localized;
  if (typeof message === "string" && message.trim().length > 0) return message;
  return "";
}
