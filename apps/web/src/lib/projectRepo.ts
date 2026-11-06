/**
 * projectRepo.ts — Lưu / mở / autosave project cho VCut Studio (web).
 *
 * Định dạng file: JSON envelope `.vcut.json`:
 *   { format: "vcut-project", formatVersion: 1, appVersion, specVersion,
 *     savedAt (ISO), name, spec: VideoSpec }
 *
 * Giới hạn trung thực (xem thêm P2.1/P2.2 trong master plan):
 * - Chỉ lưu video-spec JSON. Media binaries KHÔNG được lưu trong file project;
 *   `src` của clip là tên file do người dùng import trong phiên làm việc.
 * - Không bao giờ lưu `blob:` URL làm nguồn bền vững — nếu spec chứa blob: URL,
 *   save/load chỉ đưa ra CẢNH BÁO (media đó sẽ mất khi tải lại trang).
 * - Autosave dùng localStorage (giới hạn ~5MB). Media binaries không autosave được.
 * - Migration schema (P0-12 / R1-019, xem packages/video-spec/src/migrations.ts):
 *   file có spec.version cũ hơn (vd 0.1.0) được tự động nâng cấp lên
 *   SPEC_VERSION hiện tại khi mở, không mất dữ liệu. Version không hỗ trợ
 *   (quá cũ hoặc mới hơn app) → từ chối với lỗi rõ ràng.
 * - Migration motion (Phase 9 đợt 12 T4, xem migrateProjectMotion dưới):
 *   clip mang motionBlur cũ (weights 0 / thiếu frames / blur {}) được chuẩn
 *   hoá khi mở (cùng rule set với cổng render đợt 11 P6); project mới hợp
 *   lệ không đổi gì. Xem apps/web/src/lib/MOTION_WEBLOAD_LIMITS.md.
 */
import { SPEC_VERSION, isTextAnimation, isVideoSpec, migrate, migrateMotion, MigrationError, readSchemaVersion } from "@repo-1/video-spec";
import type { ClipMotion, TextStyle, TrackKind, VideoSpec } from "@repo-1/video-spec";

export const PROJECT_FILE_EXT = ".vcut.json";
export const AUTOSAVE_KEY = "vcut-studio:autosave:v1";
export const AUTOSAVE_DEBOUNCE_MS = 5000;
export const APP_VERSION = "0.1.0"; // đồng bộ với apps/web/package.json

const TRACK_KINDS: readonly TrackKind[] = ["video", "audio", "text", "sticker", "image"];

/**
 * Đợt 36 S5 — trạng thái phiên trong autosave (CHỈ autosave, KHÔNG vào
 * file `.vcut.json` tải xuống: file là project di động, không mang vị
 * trí phát của máy này). Quyết định sản phẩm (xem LIMITS đợt 36 S5):
 * chỉ playhead được bền vững; playing luôn reset về pause và
 * reversePlayback luôn reset về tắt sau reload nên KHÔNG lưu hai field
 * đó. Envelope cũ không có `session` vẫn mở bình thường (playhead 0).
 */
export interface AutosaveSession {
  playhead: number;
}

/**
 * Đợt 36 S5 — đọc playhead từ envelope autosave thô (JSON đã parse).
 *
 * Hàm thuần, đặt ở đây (không đặt ở rehydrate36S5.ts) vì projectRepo
 * là file được test bằng Node nên không được import value từ file anh
 * em — và đây là nơi duy nhất đọc envelope autosave thô.
 * Tương thích ngược: envelope cũ không có `session` → null (App giữ hành
 * vi cũ: playhead về 0). Giá trị không hợp lệ (không phải số hữu hạn
 * ≥ 0, session không phải object) → null, KHÔNG throw, KHÔNG đoán giá
 * trị. App chịu trách nhiệm clamp về duration project qua `setPlayhead`
 * (hàm đó đã clamp + snap frame), nên hàm này chỉ kiểm tra tính hợp lệ
 * chứ không clamp theo duration (duration không có ở tầng này).
 */
export function parseSessionPlayhead(data: unknown): number | null {
  if (!isRecord(data)) return null;
  const session = data["session"];
  if (!isRecord(session)) return null;
  const p = session["playhead"];
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0) return null;
  return p;
}

export interface ProjectEnvelope {
  format: "vcut-project";
  formatVersion: 1;
  appVersion: string;
  specVersion: string;
  savedAt: string; // ISO 8601
  name: string;
  spec: VideoSpec;
  session?: AutosaveSession;
}

export interface LoadResult {
  ok: boolean;
  spec: VideoSpec | null;
  name: string;
  /** Lỗi chặn việc mở file (file hỏng). */
  errors: string[];
  /** Cảnh báo không chặn (định dạng cũ, blob: URL...). */
  warnings: string[];
  /**
   * Phase 9 đợt 26 J5 — cảnh báo speedKeyframes có cấu trúc (fail-soft):
   * project vi phạm vẫn load được (ok: true), các vi phạm chỉ nằm đây
   * và trong `warnings` (dạng chuỗi) để UI hiển thị. Rỗng = không vi phạm.
   * Giới hạn 100 mục đầu (xem parseProjectText).
   */
  speedCurveWarnings: SpeedCurveWarning[];
  /**
   * Phase 9 đợt 27 K1 — đường dẫn các text clip đã được điền style mặc
   * định lúc load (thiếu style hoặc thiếu field). Rỗng = không clip nào
   * cần sửa. Chỉ parseProjectText đặt field này; các cổng fail đặt [].
   */
  textStyleFixes?: string[];
  /**
   * Phase 9 đợt 49 E4 — đường dẫn các keyframe array đã được sanitize
   * lúc load (entry null/không hợp lệ bị loại, easing lạ chuẩn hóa về
   * linear, field rỗng sau lọc bị xóa). Rỗng = không clip nào cần sửa.
   * Chỉ parseProjectText đặt field này; các cổng fail đặt [].
   */
  keyframeFixes?: string[];
  /**
   * Đợt 31 N4 — dạng cấu trúc của các cảnh báo chuỗi trong `warnings`
   * (trừ speedCurve và câu tràn 100): blob/migration/format/style.
   * Cùng thứ tự với chuỗi tương ứng trong `warnings`; UI mới dịch qua
   * key `structuredNotes.*`, fallback về chuỗi gốc khi key thiếu.
   * Cổng fail đặt [].
   */
  structuredNotes: StructuredNote[];
}

/**
 * Phase 9 đợt 26 J5 — một vi phạm speedKeyframes, có cấu trúc để UI/load
 * -report hiển thị được mà không cần parse chuỗi: đường dẫn clip đầy đủ
 * (kể cả qua `.subSpec` của nested), id clip, keyframe nào, field nào,
 * giá trị nào. `keyframeIndex` null = vi phạm ở mức cả curve (không phải
 * object / keyframes không phải mảng / mảng rỗng / quá 128 keyframe).
 */
export interface SpeedCurveWarning {
  /** Đường dẫn clip, vd `tracks[0].clips[1].subSpec.tracks[0].clips[0]`. */
  path: string;
  clipId: string;
  keyframeIndex: number | null;
  /** "keyframes" | "t" | "v" | "easing" | "bezier". */
  field: string;
  value: unknown;
  /** Câu tiếng Việt, chưa kèm đường dẫn (xem formatSpeedCurveWarning). */
  message: string;
  /**
   * Phase 9 đợt 28 L4 — key i18n + biến để UI dịch message theo locale
   * HIỆN TẠI lúc hiển thị (vd "speedCurve.vOutOfRange", vars { value }).
   * `message` vẫn giữ câu tiếng Việt lúc load để tương thích ngược:
   * chuỗi LoadResult.warnings, formatStructured của loadReport, và các
   * test cũ đều khóa đúng chuỗi đó. UI mới (LoadReportPanel) ưu tiên
   * dịch qua messageKey, fallback về message khi key thiếu (xem
   * loadReport.resolveWarningMessage). Warning cũ không có key → hiển
   * thị message như trước.
   */
  messageKey?: string;
  messageVars?: Record<string, string>;
}

/** Dạng chuỗi của một SpeedCurveWarning, dùng cho LoadResult.warnings. */
export function formatSpeedCurveWarning(w: SpeedCurveWarning): string {
  return `${w.path} (clip "${w.clipId}"): ${w.message}`;
}

/**
 * Phase 9 đợt 31 N4 — một cảnh báo có cấu trúc (code + tham số) để UI
 * dịch qua i18n theo locale HIỆN TẠI lúc hiển thị (nhóm key
 * `structuredNotes.*`), thay cho chuỗi tiếng Việt đóng băng lúc
 * load/lưu. `fallback` là ĐÚNG chuỗi tiếng Việt cũ (byte-identical
 * với chuỗi trong `warnings`) để UI fallback khi key thiếu (cùng mẫu
 * resolveWarningMessage của loadReport) và để loadReport trừ chuỗi này
 * khỏi otherWarnings mà không cần parse chuỗi tiếng Việt. Chuỗi
 * `warnings` cũ GIỮ NGUYÊN song song để tương thích (test cũ, cổng
 * đọc trực tiếp) — UI mới ưu tiên structuredNotes, chỉ fallback về
 * chuỗi khi thiếu item. Code mới thêm vào union này + key i18n tương
 * ứng ở cả vi/en (parity khóa bằng test đợt 31).
 */
export type StructuredNoteCode =
  | "blobUrl"
  | "motionMigrated"
  | "motionMigratedHint"
  | "legacyEnvelope"
  | "formatVersionMismatch"
  | "schemaMigrated"
  | "textStyleFixed"
  | "archiveMissingExport"
  | "archiveMissingImport";

export interface StructuredNote {
  code: StructuredNoteCode;
  params: Record<string, string>;
  fallback: string;
}

// ---------------------------------------------------------------------------
// Helpers thuần (không chạm DOM) — có thể test bằng Node.
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** JSON với key sắp xếp ổn định → hash không phụ thuộc thứ tự key. */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const rec = v as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(rec[k])}`).join(",")}}`;
}

/**
 * Hash FNV-1a 32-bit → hex. Chỉ dùng để phát hiện thay đổi (dirty check),
 * KHÔNG phải checksum bảo mật hay chống va chạm cho dữ liệu quan trọng.
 */
export function specHash(spec: VideoSpec): string {
  const s = stableStringify(spec);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Đợt 31 N4 — quét mọi clip tìm `src` là blob: URL, trả về cảnh báo có
 * cấu trúc (code "blobUrl" + clipId/trackId). Chỉ quét clip CẤP CAO
 * (giống findBlobWarnings cũ) — clip trong nested có src blob: không
 * được quét là giới hạn kế thừa, không phải hồi quy đợt này.
 *
 * Đợt 32 O4 — MỞ RỘNG: quét đệ quy vào subSpec của nested clip (cùng
 * mẫu chống vòng lặp theo nhánh của collectSpeedCurveWarnings: seen-set
 * sao chép theo nhánh, subSpec dùng chung ở hai clip anh em vẫn quét đủ
 * cả hai). Clip cấp cao giữ nguyên params { clipId, trackId } (test
 * đợt 31 khóa đúng cặp này); clip trong nested mang thêm param `path`
 * (đường dẫn đầy đủ qua `.subSpec.`) và trackId là track TRỰC TIẾP
 * chứa clip đó (track trong subSpec, không phải track cấp cao). Thứ tự:
 * duyệt theo thứ tự track/clip, clip ngoài trước khi xuống subSpec của
 * nó (pre-order). Không throw với input xấu: spec thiếu tracks → rỗng.
 */
export function findBlobWarningItems(spec: VideoSpec): StructuredNote[] {
  const items: StructuredNote[] = [];
  const walk = (s: unknown, prefix: string, seen: Set<object>): void => {
    if (!isRecord(s) || seen.has(s as object)) return;
    const chain = new Set(seen);
    chain.add(s as object);
    const tracks = (s as Record<string, unknown>)["tracks"];
    if (!Array.isArray(tracks)) return;
    tracks.forEach((t, ti) => {
      if (!isRecord(t) || !Array.isArray(t["clips"])) return;
      const trackId = typeof t["id"] === "string" ? (t["id"] as string) : "?";
      (t["clips"] as unknown[]).forEach((c, ci) => {
        if (!isRecord(c)) return;
        const clipPath = `${prefix}tracks[${ti}].clips[${ci}]`;
        const src = c["src"];
        if (typeof src === "string" && src.startsWith("blob:")) {
          const clipId = typeof c["id"] === "string" ? (c["id"] as string) : "?";
          items.push({
            code: "blobUrl",
            params:
              prefix === ""
                ? { clipId, trackId }
                : { clipId, trackId, path: clipPath },
            fallback:
              `Clip "${clipId}" trên track "${trackId}" đang trỏ tới blob: URL — ` +
              `media này sẽ mất khi tải lại trang (xem P2.2 asset store).`,
          });
        }
        if (c["kind"] === "nested" && isRecord(c["subSpec"])) {
          walk(c["subSpec"], `${clipPath}.subSpec.`, chain);
        }
      });
    });
  };
  walk(spec, "", new Set());
  return items;
}

/**
 * Đợt 32 O4 — note thiếu media của archive (dùng chung cho export và
 * import). `fallback` PHẢI byte-identical với chuỗi thiếu media cũ của
 * archive.ts (export: "Thiếu file gốc của N media…", import: "Archive
 * thiếu N media…") để buildLoadReport/formatNoteLines trừ trùng bằng
 * tập fallback mà không cần parse chuỗi. `shown` = tối đa 5 tên đầu,
 * `extra` = "… (+k)" khi còn thừa, rỗng khi không thừa — cùng cách
 * archive.ts cũ nối chuỗi.
 */
export function archiveMissingNote(
  kind: "export" | "import",
  missing: string[],
): StructuredNote {
  const count = String(missing.length);
  const shown = missing.slice(0, 5).join(", ");
  const extra = missing.length > 5 ? `… (+${missing.length - 5})` : "";
  const fallback =
    kind === "export"
      ? `Thiếu file gốc của ${count} media (sẽ cần relink khi import): ${shown}${extra}`
      : `Archive thiếu ${count} media có trong project (cần relink thủ công): ${shown}${extra}`;
  return {
    code: kind === "export" ? "archiveMissingExport" : "archiveMissingImport",
    params: { count, shown, extra },
    fallback,
  };
}

/**
 * Quét mọi clip tìm `src` là blob: URL. Trả về cảnh báo (không chặn save/load).
 * Đợt 31 N4: suy ra từ findBlobWarningItems để chuỗi và item không lệch nhau.
 */
export function findBlobWarnings(spec: VideoSpec): string[] {
  return findBlobWarningItems(spec).map((n) => n.fallback);
}

function at(path: string, msg: string): string {
  return `${path}: ${msg}`;
}

const SPEED_EASINGS_J5: readonly string[] = ["linear", "ease-in", "ease-out", "bezier"];
const SPEED_V_MIN = 0.25;
const SPEED_V_MAX = 4;
const SPEED_KEYFRAMES_MAX = 128;

/**
 * Phase 9 đợt 26 J5 — kiểm tra MỘT speedKeyframes (không throw, không
 * mutate). Mirror luật validator render/preview mà đợt 25 I6 §5a chứng
 * minh load-validation đã bỏ sót: curve v=5 của nested lọt tới preview
 * mới nổ exception vì validateSpecDeep không kiểm tra field này ở clip
 * nào. Luật kiểm tra (chỉ speedKeyframes, không đụng curve khác như
 * volumeKeyframes/animations):
 * - phải là object { keyframes: [...] }, ít nhất 1 keyframe, tối đa 128;
 * - mỗi keyframe: t hữu hạn, t ≥ 0, t ≤ duration (khi duration biết),
 *   t đơn điệu tăng ngặt theo thứ tự viết (t sau > t trước; bằng nhau
 *   cũng vi phạm — khác normalize của engine vốn sort + dedupe);
 * - v hữu hạn trong [0.25, 4];
 * - easing thuộc { linear, ease-in, ease-out, bezier }; easing bezier
 *   cần bezier [x1, y1, x2, y2] với x1, x2 ∈ [0, 1] (y tự do, chuẩn CSS).
 * Trả về warnings, KHÔNG phải errors: cổng load fail-soft (xem
 * parseProjectText) — project vi phạm vẫn mở được, chỉ bị cảnh báo.
 */
export function checkSpeedKeyframes(
  curve: unknown,
  path: string,
  clipId: string,
  duration: number | undefined,
): SpeedCurveWarning[] {
  const where = `${path}.speedKeyframes`;
  // Đợt 28 L4: chuỗi hoá giá trị cho messageVars (khớp đúng cách message
  // tiếng Việt dùng JSON.stringify — NaN thành "null", undefined thành
  // "undefined" qua fallback, giống hệt chuỗi trong template literal).
  const valStr = (v: unknown): string => JSON.stringify(v) ?? String(v);
  const warn = (
    keyframeIndex: number | null,
    field: string,
    value: unknown,
    message: string,
    messageKey: string,
    messageVars?: Record<string, string>,
  ): SpeedCurveWarning => ({ path, clipId, keyframeIndex, field, value, message, messageKey, messageVars });
  if (!isRecord(curve) || !Array.isArray(curve["keyframes"])) {
    return [warn(null, "keyframes", curve, "speedKeyframes phải là object { keyframes: [...] }.", "speedCurve.shape")];
  }
  const arr = curve["keyframes"] as unknown[];
  if (arr.length === 0) {
    return [warn(null, "keyframes", arr, "speedKeyframes.keyframes: mảng rỗng — cần ít nhất 1 keyframe.", "speedCurve.keyframesEmpty")];
  }
  const out: SpeedCurveWarning[] = [];
  if (arr.length > SPEED_KEYFRAMES_MAX) {
    out.push(
      warn(null, "keyframes", arr.length, `speedKeyframes.keyframes: quá ${SPEED_KEYFRAMES_MAX} keyframe (có ${arr.length}).`, "speedCurve.keyframesTooMany", { value: String(arr.length) }),
    );
  }
  let prevT: number | null = null;
  for (let i = 0; i < arr.length; i++) {
    const kf = arr[i];
    const w = `${where}.keyframes[${i}]`;
    if (!isRecord(kf)) {
      out.push(warn(i, "keyframes", kf, `${w} phải là object { t, v, easing }.`, "speedCurve.keyframeNotObject"));
      prevT = null;
      continue;
    }
    const t = kf["t"];
    const v = kf["v"];
    const easing = kf["easing"];
    if (!isFiniteNum(t) || (t as number) < 0) {
      out.push(warn(i, "t", t, `${w}.t phải là số ≥ 0 (nhận được: ${JSON.stringify(t)}).`, "speedCurve.tInvalid", { value: valStr(t) }));
    } else {
      if (duration !== undefined && (t as number) > duration + 1e-6) {
        out.push(warn(i, "t", t, `${w}.t phải trong [0, ${duration}] (nhận được: ${JSON.stringify(t)}).`, "speedCurve.tOutOfRange", { value: valStr(t), duration: String(duration) }));
      }
      if (prevT !== null && (t as number) <= prevT) {
        out.push(
          warn(i, "t", t, `${w}.t phải đơn điệu tăng (t=${JSON.stringify(t)} không lớn hơn t trước=${prevT}).`, "speedCurve.tNotMonotone", { value: valStr(t), prev: String(prevT) }),
        );
      }
      prevT = t as number;
    }
    if (!isFiniteNum(v) || (v as number) < SPEED_V_MIN || (v as number) > SPEED_V_MAX) {
      out.push(warn(i, "v", v, `${w}.v phải trong [${SPEED_V_MIN}, ${SPEED_V_MAX}] (nhận được: ${JSON.stringify(v)}).`, "speedCurve.vOutOfRange", { value: valStr(v) }));
    }
    if (typeof easing !== "string" || !SPEED_EASINGS_J5.includes(easing)) {
      out.push(
        warn(i, "easing", easing, `${w}.easing phải là linear | ease-in | ease-out | bezier (nhận được: ${JSON.stringify(easing)}).`, "speedCurve.easingInvalid", { value: valStr(easing) }),
      );
    } else if (easing === "bezier") {
      const b = kf["bezier"];
      if (
        !Array.isArray(b) || b.length !== 4 ||
        !b.every((x) => typeof x === "number" && Number.isFinite(x)) ||
        (b[0] as number) < 0 || (b[0] as number) > 1 ||
        (b[2] as number) < 0 || (b[2] as number) > 1
      ) {
        out.push(warn(i, "bezier", b, `${w}.bezier phải là [x1, y1, x2, y2]: x1, x2 trong [0, 1], y1, y2 tự do.`, "speedCurve.bezierInvalid", { value: valStr(b) }));
      }
    }
  }
  return out;
}

/**
 * Phase 9 đợt 26 J5 — quét mọi speedKeyframes trong spec (clip video/
 * audio cấp cao + clip nested tự mang curve + mọi clip trong subSpec đệ
 * quy, kể cả nested sâu), trả về warnings có cấu trúc. Chống vòng lặp
 * subSpec bằng seen-set sao chép theo nhánh (giống validateSpecDeep,
 * không chặn oan subSpec dùng chung ở hai clip anh em). Không throw với
 * input xấu: spec không phải video-spec hợp lệ → rỗng (lỗi cấu trúc đó
 * thuộc về validateSpecDeep/errors, không phải warnings).
 */
export function collectSpeedCurveWarnings(spec: unknown): SpeedCurveWarning[] {
  const out: SpeedCurveWarning[] = [];
  const walk = (s: unknown, prefix: string, seen: Set<object>): void => {
    if (!isRecord(s) || seen.has(s as object)) return;
    const chain = new Set(seen);
    chain.add(s as object);
    const tracks = (s as Record<string, unknown>)["tracks"];
    if (!Array.isArray(tracks)) return;
    tracks.forEach((t, ti) => {
      if (!isRecord(t) || !Array.isArray(t["clips"])) return;
      (t["clips"] as unknown[]).forEach((c, ci) => {
        if (!isRecord(c)) return;
        const clipPath = `${prefix}tracks[${ti}].clips[${ci}]`;
        const kind = c["kind"] as string;
        if ((kind === "video" || kind === "audio" || kind === "nested") && c["speedKeyframes"] !== undefined) {
          out.push(
            ...checkSpeedKeyframes(
              c["speedKeyframes"],
              clipPath,
              typeof c["id"] === "string" ? (c["id"] as string) : "?",
              isFiniteNum(c["duration"]) ? (c["duration"] as number) : undefined,
            ),
          );
        }
        if (kind === "nested" && isRecord(c["subSpec"])) {
          walk(c["subSpec"], `${clipPath}.subSpec.`, chain);
        }
      });
    });
  };
  walk(spec, "", new Set());
  return out;
}

/** Tùy chọn cho validateSpecDeep (đợt 26 J5): truyền mảng để nhận thêm
 *  warnings speedKeyframes (fail-soft) trong cùng một lần duyệt; không
 *  truyền → hành vi cũ (chỉ errors, không kiểm tra speedKeyframes). */
export interface ValidateSpecDeepOptions {
  speedCurveWarnings?: SpeedCurveWarning[];
  /** Tiền tố đường dẫn khi duyệt subSpec đệ quy (nội bộ). */
  pathPrefix?: string;
}

function validateClipDeep(
  c: unknown,
  path: string,
  errors: string[],
  seenSpecs: Set<object>,
  opts?: ValidateSpecDeepOptions,
): void {
  if (!isRecord(c)) {
    errors.push(at(path, "phải là object."));
    return;
  }
  if (typeof c.id !== "string" || c.id.length === 0) errors.push(at(path, "thiếu id."));
  if (!isFiniteNum(c.start) || c.start < 0) errors.push(at(path, "start phải là số ≥ 0."));
  if (!isFiniteNum(c.duration) || c.duration <= 0)
    errors.push(at(path, "duration phải là số > 0."));
  const kind = c.kind as string;
  if (kind === "video" || kind === "audio") {
    if (typeof c.src !== "string" || c.src.length === 0) errors.push(at(path, "thiếu src."));
    if (!isFiniteNum(c.in)) errors.push(at(path, "thiếu in (điểm vào nguồn)."));
    if (!isFiniteNum(c.out)) errors.push(at(path, "thiếu out (điểm ra nguồn)."));
  } else if (kind === "text") {
    if (typeof c.text !== "string") errors.push(at(path, "thiếu text."));
  } else if (kind === "sticker" || kind === "image") {
    if (typeof c.src !== "string" || c.src.length === 0) errors.push(at(path, "thiếu src."));
  } else if (kind === "nested") {
    // Phase 9 đợt 22 (parent fix theo phát hiện luồng F): trước đây nhánh này
    // không tồn tại nên mọi project chứa nested clip đều bị
    // validateSpecDeep từ chối ("kind không hỗ trợ: nested") và cổng load
    // rơi về project mẫu — tức autosave/file có nested không mở lại được.
    // Nay chấp nhận nested và validate đệ quy subSpec (kèm chặn vòng lặp
    // qua seenSpecs sao chép theo nhánh, không chặn oan subSpec dùng chung
    // ở hai clip anh em). Chỉ kiểm tra nông ở đây: subSpec, speed, trim;
    // kiểm tra sâu (duration/curve/trim khớp) thuộc về validateNestedClip.
    const rec = c as Record<string, unknown>;
    const speed = rec["speed"];
    if (
      speed !== undefined &&
      (!isFiniteNum(speed) || (speed as number) < 0.25 || (speed as number) > 4)
    )
      errors.push(at(path, "speed phải trong [0.25, 4]."));
    const trim = rec["trim"];
    if (trim !== undefined) {
      if (
        !isRecord(trim) ||
        !isFiniteNum(trim["in"]) ||
        !isFiniteNum(trim["out"]) ||
        (trim["out"] as number) <= (trim["in"] as number)
      )
        errors.push(at(path, "trim không hợp lệ (cần in < out)."));
    }
    const sub = rec["subSpec"];
    if (!isRecord(sub)) {
      errors.push(at(path, "thiếu subSpec."));
    } else {
      const subErrors = validateSpecDeep(sub, seenSpecs, {
        ...opts,
        pathPrefix: `${path}.subSpec.`,
      });
      for (const e of subErrors) errors.push(at(path, `subSpec: ${e}`));
    }
  } else {
    errors.push(at(path, `kind không hỗ trợ: ${JSON.stringify(kind)}.`));
  }
  // Đợt 26 J5 — curve của chính clip này (lá video/audio, hoặc nested tự
  // mang curve): chỉ ghi warnings khi caller yêu cầu qua opts, KHÔNG
  // thành errors (fail-soft: project vi phạm vẫn load được, xem
  // parseProjectText). Clip trong subSpec được kiểm tra ở lần duyệt đệ
  // quy trên (đường dẫn đã kèm tiền tố `.subSpec.`).
  if (
    opts?.speedCurveWarnings !== undefined &&
    (kind === "video" || kind === "audio" || kind === "nested") &&
    isRecord(c) &&
    c["speedKeyframes"] !== undefined
  ) {
    opts.speedCurveWarnings.push(
      ...checkSpeedKeyframes(
        c["speedKeyframes"],
        path,
        typeof c.id === "string" ? c.id : "?",
        isFiniteNum(c.duration) ? (c.duration as number) : undefined,
      ),
    );
  }
}

/**
 * Validate sâu cấu trúc spec (sâu hơn isVideoSpec). Trả về danh sách lỗi,
 * rỗng = hợp lệ. Tối đa 30 lỗi để thông báo không quá dài.
 *
 * Đợt 26 J5: truyền opts.speedCurveWarnings để đồng thời thu thập
 * warnings speedKeyframes (đường dẫn đầy đủ kể cả qua subSpec) trong
 * cùng lần duyệt — các vi phạm này KHÔNG thành errors, cổng load vẫn
 * mở project và chỉ cảnh báo (fail-soft, sửa lỗ hổng I6 §5a).
 */
export function validateSpecDeep(
  spec: unknown,
  seenSpecs: Set<object> = new Set(),
  opts?: ValidateSpecDeepOptions,
): string[] {
  const errors: string[] = [];
  if (!isVideoSpec(spec)) {
    const v = isRecord(spec) ? (spec as Record<string, unknown>).version : undefined;
    errors.push(
      `Không phải video-spec hợp lệ (version=${JSON.stringify(v)}, app hỗ trợ ${SPEC_VERSION}). ` +
        `File có thể bị hỏng hoặc dùng schema version không được hỗ trợ.`,
    );
    return errors;
  }
  if (seenSpecs.has(spec as object)) {
    errors.push("subSpec tạo vòng lặp (spec con trỏ lại spec tổ tiên).");
    return errors;
  }
  const chain = new Set(seenSpecs);
  chain.add(spec as object);
  const meta = spec.meta as unknown as Record<string, unknown>;
  if (typeof meta.name !== "string" || meta.name.trim().length === 0)
    errors.push("meta.name phải là chuỗi khác rỗng.");
  if (!isFiniteNum(meta.width) || meta.width <= 0) errors.push("meta.width phải là số > 0.");
  if (!isFiniteNum(meta.height) || meta.height <= 0) errors.push("meta.height phải là số > 0.");
  if (!isFiniteNum(meta.fps) || meta.fps <= 0) errors.push("meta.fps phải là số > 0.");
  if (!Array.isArray(spec.tracks)) {
    errors.push("tracks phải là mảng.");
    return errors;
  }
  const prefix = opts?.pathPrefix ?? "";
  spec.tracks.forEach((t: unknown, ti: number) => {
    const tp = `${prefix}tracks[${ti}]`;
    if (!isRecord(t)) {
      errors.push(at(tp, "phải là object."));
      return;
    }
    if (typeof t.id !== "string" || t.id.length === 0) errors.push(at(tp, "thiếu id."));
    if (!TRACK_KINDS.includes(t.kind as TrackKind))
      errors.push(at(tp, `kind không hỗ trợ: ${JSON.stringify(t.kind)}.`));
    if (!Array.isArray(t.clips)) {
      errors.push(at(tp, "clips phải là mảng."));
      return;
    }
    (t.clips as unknown[]).forEach((c, ci) => {
      validateClipDeep(c, `${tp}.clips[${ci}]`, errors, chain, opts);
      if (errors.length > 30) return;
    });
  });
  return errors.slice(0, 30);
}

/**
 * Đợt 32 O4 — suy các case migrate của migrateMotion từ DỮ LIỆU GỐC
 * (motion trước migrate + motion sau migrate), KHÔNG parse chuỗi notes
 * tiếng Việt của video-spec. Phân loại khớp đúng thứ tự/điều kiện mà
 * migrateMotion đẩy notes (xem packages/video-spec/src/motion.ts):
 * blur rỗng → case empty duy nhất; có weights hợp lệ (mảng, dài 2..8,
 * toàn hữu hạn) và frames hợp lệ (vắng hoặc nguyên trong [2, 8]) →
 * case frames khi frames vắng/lệch weights.length (đẩy trước), rồi case
 * weights khi có số <= 0. Trường hợp migrateMotion không cứu (weights
 * không hợp lệ, frames ngoài [2, 8], key lạ…) thì migrated=false nên
 * hàm này không bao giờ được gọi với chúng; nếu vì lý do nào đó không
 * suy ra case nào mà migrated=true thì trả [] và đường hiển thị rơi về
 * fallback notes thô (không bịa case). Mỗi case mang key i18n riêng
 * (nhóm `structuredNotes.motionNote*`) + vars chỉ gồm số/chuỗi JSON nên
 * locale-neutral; thứ tự case trong mảng = thứ tự notes trong fallback.
 */
export function motionNoteCases(
  origMotion: unknown,
  migratedMotion: unknown,
): { code: string; vars: Record<string, string> }[] {
  if (!isRecord(origMotion) || !isRecord(migratedMotion)) return [];
  const origBlur = origMotion["motionBlur"];
  const migBlur = migratedMotion["motionBlur"];
  if (!isRecord(origBlur) || !isRecord(migBlur)) return [];
  const migFrames = migBlur["frames"];
  const migFramesStr = typeof migFrames === "number" ? String(migFrames) : "?";
  const weights = origBlur["weights"];
  if (weights === undefined) {
    // Chỉ blur rỗng mới migrated ở nhánh này (frames sẵn thì noChange).
    if (origBlur["frames"] === undefined) {
      return [{ code: "motionNoteEmpty", vars: { frames: migFramesStr } }];
    }
    return [];
  }
  if (!Array.isArray(weights)) return [];
  if (
    weights.length < 2 ||
    weights.length > 8 ||
    !weights.every((w) => typeof w === "number" && Number.isFinite(w))
  ) {
    return [];
  }
  const frames = origBlur["frames"];
  if (
    frames !== undefined &&
    (!Number.isInteger(frames) || (frames as number) < 2 || (frames as number) > 8)
  ) {
    return [];
  }
  const cases: { code: string; vars: Record<string, string> }[] = [];
  if (frames === undefined || frames !== weights.length) {
    cases.push({
      code: "motionNoteFrames",
      vars: {
        frames: frames === undefined ? "undefined" : JSON.stringify(frames),
        weightsLength: String(weights.length),
        newFrames: migFramesStr,
      },
    });
  }
  if (weights.some((w) => (w as number) <= 0)) {
    cases.push({
      code: "motionNoteWeights",
      vars: { weights: JSON.stringify(weights), frames: migFramesStr },
    });
  }
  return cases;
}

/**
 * Phase 9 đợt 12 T4 — migrate motion cũ ở cổng load web.
 *
 * Đợt 11 P6 đã làm migrateMotion (packages/video-spec/src/motion.ts) nhưng
 * chỉ nối vào cổng load của render (server/render/src/validate.js); project
 * cũ mở trên web vẫn mang motion lỗi thời (weights 0 / thiếu frames /
 * blur {}) cho đến đợt này. Hàm này chạy migrateMotion cho mọi clip có
 * motion, TRƯỚC khi trả spec cho editor — cùng rule set với render nên
 * web và render nhìn thấy cùng một motion đã chuẩn hoá.
 *
 * Tính chất (kế thừa từ migrateMotion, xem docstring của nó):
 * - Project mới hợp lệ → trả về ĐÚNG tham chiếu spec gốc (không copy,
 *   không đổi một field nào), warnings rỗng.
 * - Chỉ clip nào migrated=true mới được thay bằng object mới (spread nông);
 *   clip/track khác giữ nguyên tham chiếu.
 * - Trường hợp migrateMotion không cứu (frames ngoài [2, 8], weights không
 *   hữu hạn/dài ngoài [2, 8], key lạ) → giữ nguyên, KHÔNG chặn load web
 *   (validateSpecDeep của web không kiểm tra motion); cổng render vẫn bắt
 *   khi export — xem MOTION_WEBLOAD_LIMITS.md.
 * - Không mutate spec đầu vào.
 */
export function migrateProjectMotion(spec: VideoSpec): {
  spec: VideoSpec;
  warnings: string[];
  /**
   * Đợt 31 N4 — dạng cấu trúc của warnings (code "motionMigrated" +
   * path/clipId/notes). Đợt 32 O4 — note mang thêm `params.cases`
   * (các case suy từ dữ liệu gốc, xem motionNoteCases) để bản en dịch
   * được cả nội dung notes; `notes`/`fallback` vẫn giữ chuỗi tiếng Việt
   * cũ byte-identical để tương thích và làm fallback khi key thiếu.
   */
  structuredNotes: StructuredNote[];
} {
  const warnings: string[] = [];
  const structuredNotes: StructuredNote[] = [];
  let changed = false;
  const tracks = spec.tracks.map((t, ti) => {
    let trackChanged = false;
    const clips = t.clips.map((c, ci) => {
      const motion = (c as { motion?: unknown }).motion;
      if (motion === undefined) return c;
      const r = migrateMotion(motion);
      if (!r.migrated) return c;
      trackChanged = true;
      const path = `tracks[${ti}].clips[${ci}]`;
      const notes = r.notes.join("; ");
      const fallback = `${path} (clip "${c.id}"): motion cũ đã chuẩn hoá — ${notes}`;
      warnings.push(fallback);
      structuredNotes.push({
        code: "motionMigrated",
        // Đợt 32 O4 — `cases` (JSON) để bản en dịch được từng case thay
        // vì giữ notes tiếng Việt thô (xem motionNoteCases dưới và
        // formatStructuredNote trong loadReport.ts). Note cũ không có
        // `cases` vẫn hiển thị theo đường fallback cũ (notes thô).
        params: { path, clipId: String(c.id), notes, cases: JSON.stringify(motionNoteCases(motion, r.motion)) },
        fallback,
      });
      return { ...c, motion: r.motion as ClipMotion };
    });
    if (trackChanged) {
      changed = true;
      return { ...t, clips };
    }
    return t;
  });
  if (!changed) return { spec, warnings, structuredNotes };
  return { spec: { ...spec, tracks }, warnings, structuredNotes };
}

/**
 * Phase 9 đợt 27 K1 — style mặc định cho text clip thiếu style.
 *
 * Chọn giá trị trung tính, KHÔNG thêm hiệu ứng: animation "none" (clip
 * thiếu style trước đây chỉ crash chứ chưa từng vẽ, nên "none" là lựa
 * chọn không bịa hành vi; khác với store.addTextClip dùng "fadeUp" cho
 * chữ mới gõ trong phiên). fontSize 64 / Inter / trắng / bold lấy theo
 * default chữ mới của store; x/y 0.5 (giữa) khớp fallback của
 * previewEngine khi thiếu x/y. backgroundColor/highlightColor là
 * optional nên chỉ giữ khi đã có, không tự gán.
 */
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 64,
  color: "#ffffff",
  bold: true,
  italic: false,
  x: 0.5,
  y: 0.5,
  animation: "none",
};

/**
 * Điền đầy đủ style từ một giá trị style bất kỳ (undefined, thiếu field,
 * sai kiểu đều được sửa). Field đã hợp lệ giữ nguyên giá trị. Trả về
 * object mới; không mutate đầu vào. preview.tsx dùng chung hàm này làm
 * guard nên clip tạo trong phiên (không qua cổng load) cũng không ném.
 */
export function normalizeTextStyle(style: unknown): TextStyle {
  const s = isRecord(style) ? style : {};
  const str = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.length > 0 ? v : fallback;
  const num = (v: unknown, fallback: number): number =>
    isFiniteNum(v) ? (v as number) : fallback;
  const out: TextStyle = {
    fontFamily: str(s["fontFamily"], DEFAULT_TEXT_STYLE.fontFamily),
    fontSize: (() => {
      const v = num(s["fontSize"], DEFAULT_TEXT_STYLE.fontSize);
      return v > 0 ? v : DEFAULT_TEXT_STYLE.fontSize;
    })(),
    color: str(s["color"], DEFAULT_TEXT_STYLE.color),
    bold: typeof s["bold"] === "boolean" ? (s["bold"] as boolean) : true,
    italic: typeof s["italic"] === "boolean" ? (s["italic"] as boolean) : false,
    x: num(s["x"], 0.5),
    y: num(s["y"], 0.5),
    animation: isTextAnimation(s["animation"]) ? s["animation"] : "none",
  };
  if (typeof s["backgroundColor"] === "string") out.backgroundColor = s["backgroundColor"] as string;
  if (typeof s["highlightColor"] === "string") out.highlightColor = s["highlightColor"] as string;
  return out;
}

/**
 * Chuẩn hóa style cho MỌI text clip trong spec, kể cả trong subSpec của
 * nested clip (đệ quy, chống vòng lặp theo nhánh như validateSpecDeep).
 * Mutate spec tại chỗ — chỉ dùng cho object vừa JSON.parse ở cổng load.
 * Trả về đường dẫn các clip đã sửa (dạng tracks[i].clips[j], kèm tiền tố
 * `.subSpec.` khi qua nested). Clip không phải text không bị đụng.
 */
export function normalizeTextStyles(spec: VideoSpec): string[] {
  const fixed: string[] = [];
  const walk = (s: VideoSpec, prefix: string, seen: Set<object>): void => {
    if (seen.has(s as object)) return;
    const chain = new Set(seen);
    chain.add(s as object);
    if (!Array.isArray((s as unknown as Record<string, unknown>)["tracks"])) return;
    s.tracks.forEach((t, ti) => {
      if (!Array.isArray((t as unknown as Record<string, unknown>)["clips"])) return;
      (t.clips as unknown[]).forEach((c, ci) => {
        if (!isRecord(c)) return;
        const path = `${prefix}tracks[${ti}].clips[${ci}]`;
        if (c["kind"] === "text") {
          const next = normalizeTextStyle(c["style"]);
          if (stableStringify(c["style"]) !== stableStringify(next)) {
            (c as Record<string, unknown>)["style"] = next;
            fixed.push(`${path} (clip "${typeof c["id"] === "string" ? c["id"] : "?"}")`);
          }
        } else if (c["kind"] === "nested" && isRecord(c["subSpec"])) {
          walk(c["subSpec"] as unknown as VideoSpec, `${path}.subSpec.`, chain);
        }
      });
    });
  };
  walk(spec, "", new Set());
  return fixed;
}

// ---------------------------------------------------------------------------
// Phase 9 đợt 49 E4 — sanitize keyframe array ở cổng load (fail-soft).
//
// BUG (nợ D3 §8 mục 4): project có audio clip mang
// `volumeKeyframes.keyframes: [null]` qua được cổng load (validateSpecDeep
// không kiểm tra volumeKeyframes), rồi `computeClipGain` gọi
// `interpolateKeyframes([null])` → `normalizeKeyframes` giữ `[null]`
// → `ks[0].v` ném TypeError trong `syncMedia` ở ĐẦU mỗi tick pause,
// TRƯỚC khi nhánh pause phát seek request; tick không có try/catch nên
// vòng lặp preview chết cứng (chỉ reload với project khác mới hết).
// Cùng mẫu lỗi còn nằm ở mọi chỗ gọi interpolateKeyframes với mảng từ
// project mà chỉ check truthy thay vì độ dài: animations.x/y/opacity/
// scale/rotation trong previewEngine (vd `a.x ? memoInterpolateKeyframes(
// a.x.keyframes, localT)` — object `{keyframes: [null]}` là truthy nên
// vẫn ném), và speedKeyframes (ramp có try/catch nội bộ nên sống sót
// nhưng dữ liệu vẫn bẩn).
//
// Cách sửa: loại entry lỗi NGAY Ở CỔNG LOAD (parseProjectText, sau
// validate + migrate, cùng vị trí với normalizeTextStyles) để cả mở
// file lẫn khôi phục autosave đều được sửa, và mọi consumer hạ nguồn
// (preview, render worker nhận spec từ web) đều nhận dữ liệu sạch.
// - Entry bị loại: null / không phải object / t hoặc v không phải số
//   hữu hạn. KHÔNG loại theo t ngoài [0, duration] (interpolate clamp
//   được, không đổi ngữ nghĩa thời gian) và KHÔNG đụng thứ tự/số lượng
//   entry hợp lệ.
// - Easing lạ → chuẩn hóa về "linear" (applyEasing không có default:
//   easing lạ trả undefined → NaN lan ra gain). speedKeyframes giữ
//   thêm "bezier" vì speed curve hỗ trợ bezier (checkSpeedKeyframes).
// - KeyframedValue không phải object, hoặc keyframes không phải mảng,
//   hoặc mảng rỗng sau lọc → XÓA LUÔN FIELD để caller rơi về giá trị
//   tĩnh (computeClipGain guard `length > 0`; animations: `a.x ? ...`
//   thành falsy → dùng giá trị mặc định).
// - Project lành không đổi gì (so sánh bằng stableStringify trong test).
// Mutate spec tại chỗ — chỉ dùng cho object vừa JSON.parse ở cổng load,
// cùng mẫu với normalizeTextStyles.
// ---------------------------------------------------------------------------

/** Easing hợp lệ cho volume/animations (khớp EASINGS của video-spec). */
const KEYFRAME_EASINGS_E4: readonly string[] = ["linear", "ease-in", "ease-out"];

/**
 * Sanitize MỘT KeyframedValue ({ keyframes: [...] }) tại chỗ.
 * Trả về true nếu field còn dùng được (giữ lại), false nếu phải xóa field.
 * Ghi chú sửa vào `fixes` khi có thay đổi (kèm đường dẫn đầy đủ).
 */
function sanitizeOneKeyframedValue(
  kv: unknown,
  where: string,
  allowBezier: boolean,
  fixes: string[],
): boolean {
  if (!isRecord(kv)) {
    fixes.push(`${where}: keyframes không phải object { keyframes: [...] } — đã xóa field.`);
    return false;
  }
  const arr = kv["keyframes"];
  if (!Array.isArray(arr)) {
    fixes.push(`${where}.keyframes không phải mảng — đã xóa field.`);
    return false;
  }
  const validEasings = allowBezier
    ? [...KEYFRAME_EASINGS_E4, "bezier"]
    : KEYFRAME_EASINGS_E4;
  let dropped = 0;
  let coercedEasing = 0;
  const kept: Record<string, unknown>[] = [];
  for (const kf of arr as unknown[]) {
    if (!isRecord(kf) || !isFiniteNum(kf["t"]) || !isFiniteNum(kf["v"])) {
      dropped++;
      continue;
    }
    const easing = kf["easing"];
    if (typeof easing !== "string" || !validEasings.includes(easing)) {
      kept.push({ ...kf, easing: "linear" });
      coercedEasing++;
    } else {
      kept.push(kf);
    }
  }
  if (kept.length === 0) {
    fixes.push(`${where}.keyframes rỗng sau khi loại ${dropped} entry lỗi — đã xóa field.`);
    return false;
  }
  if (dropped > 0 || coercedEasing > 0) {
    const parts: string[] = [];
    if (dropped > 0) parts.push(`đã loại ${dropped} entry lỗi (null/không hợp lệ)`);
    if (coercedEasing > 0) parts.push(`đã chuẩn hóa ${coercedEasing} easing lạ về linear`);
    fixes.push(`${where}.keyframes: ${parts.join(", ")} — giữ ${kept.length}/${arr.length} entry.`);
  }
  (kv as Record<string, unknown>)["keyframes"] = kept;
  return true;
}

/** Tên các prop animations (khớp ANIMATABLE_PROPS của video-spec). */
const ANIMATION_PROPS_E4: readonly string[] = ["x", "y", "opacity", "scale", "rotation"];

/**
 * Sanitize MỌI keyframe array trong spec: volumeKeyframes, speedKeyframes
 * và animations.* của từng clip, kể cả trong subSpec của nested clip
 * (đệ quy, chống vòng lặp theo nhánh như validateSpecDeep).
 * Mutate spec tại chỗ — chỉ dùng cho object vừa JSON.parse ở cổng load.
 * Trả về đường dẫn các field đã sửa (dạng tracks[i].clips[j].<field>,
 * kèm tiền tố `.subSpec.` khi qua nested).
 */
export function sanitizeKeyframeArrays(spec: VideoSpec): string[] {
  const fixed: string[] = [];
  const walk = (s: VideoSpec, prefix: string, seen: Set<object>): void => {
    if (seen.has(s as object)) return;
    const chain = new Set(seen);
    chain.add(s as object);
    if (!Array.isArray((s as unknown as Record<string, unknown>)["tracks"])) return;
    s.tracks.forEach((t, ti) => {
      if (!Array.isArray((t as unknown as Record<string, unknown>)["clips"])) return;
      (t.clips as unknown[]).forEach((c, ci) => {
        if (!isRecord(c)) return;
        const path = `${prefix}tracks[${ti}].clips[${ci}]`;
        const clipId = typeof c["id"] === "string" ? c["id"] : "?";
        const where = (field: string): string => `${path} (clip "${clipId}").${field}`;
        const rec = c as Record<string, unknown>;
        // volumeKeyframes: audio clip (check mọi kind cho an toàn — field
        // lạ trên kind khác cũng không được phép mang entry null).
        if (rec["volumeKeyframes"] !== undefined) {
          if (!sanitizeOneKeyframedValue(rec["volumeKeyframes"], where("volumeKeyframes"), false, fixed)) {
            delete rec["volumeKeyframes"];
          }
        }
        // speedKeyframes: cho phép easing bezier (speed curve hỗ trợ).
        if (rec["speedKeyframes"] !== undefined) {
          if (!sanitizeOneKeyframedValue(rec["speedKeyframes"], where("speedKeyframes"), true, fixed)) {
            delete rec["speedKeyframes"];
          }
        }
        // animations.*: từng prop một.
        if (isRecord(rec["animations"])) {
          const anims = rec["animations"] as Record<string, unknown>;
          for (const prop of ANIMATION_PROPS_E4) {
            if (anims[prop] !== undefined) {
              if (!sanitizeOneKeyframedValue(anims[prop], where(`animations.${prop}`), false, fixed)) {
                delete anims[prop];
              }
            }
          }
        }
        if (c["kind"] === "nested" && isRecord(c["subSpec"])) {
          walk(c["subSpec"] as unknown as VideoSpec, `${path}.subSpec.`, chain);
        }
      });
    });
  };
  walk(spec, "", new Set());
  return fixed;
}

/**
 * Parse nội dung text của file project → LoadResult.
 * Chấp nhận envelope `.vcut.json`; spec trần (không envelope) vẫn đọc được
 * kèm cảnh báo (tương thích ngược với file export JSON cũ).
 */
export function parseProjectText(text: string): LoadResult {
  const fail = (errors: string[], warnings: string[] = []): LoadResult => ({
    ok: false,
    spec: null,
    name: "",
    errors,
    warnings,
    speedCurveWarnings: [],
    textStyleFixes: [],
    keyframeFixes: [],
    structuredNotes: [],
  });
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return fail(["File không phải JSON hợp lệ."]);
  }
  let spec: unknown;
  let name = "Dự án không tên";
  const warnings: string[] = [];
  // Đợt 31 N4: dạng cấu trúc song song với warnings (cùng thứ tự, trừ
  // speedCurve + câu tràn 100) — xem StructuredNote.
  const structuredNotes: StructuredNote[] = [];
  if (isRecord(data) && data.format === "vcut-project") {
    if (data.formatVersion !== 1) {
      const version = JSON.stringify(data.formatVersion);
      const fallback = `formatVersion=${version} khác 1 — có thể bỏ sót field mới.`;
      warnings.push(fallback);
      structuredNotes.push({ code: "formatVersionMismatch", params: { version }, fallback });
    }
    if (typeof data.name === "string" && data.name.length > 0) name = data.name;
    // specVersion trong envelope chỉ là metadata; version thật nằm trong spec.version
    // và sẽ được migrate ở bước dưới nếu cần.
    spec = data.spec;
  } else {
    const fallback = "File không có envelope .vcut (định dạng cũ) — vẫn thử đọc như video-spec trần.";
    warnings.push(fallback);
    structuredNotes.push({ code: "legacyEnvelope", params: {}, fallback });
    spec = data;
  }

  // P0-12 / R1-019: migrate schema version cũ → hiện tại TRƯỚC khi validate.
  // File 0.1.0 được nâng cấp tự động, không mất dữ liệu; version không hỗ trợ
  // (quá cũ / mới hơn app / thiếu version) → từ chối với lỗi rõ ràng.
  const fromVersion = readSchemaVersion(spec);
  if (typeof fromVersion === "string" && fromVersion !== SPEC_VERSION) {
    try {
      spec = migrate(spec);
      const fallback =
        `File dùng schema version ${fromVersion} — đã tự động nâng cấp lên ${SPEC_VERSION} ` +
        `(không mất dữ liệu). Lưu lại file để hoàn tất nâng cấp.`;
      warnings.push(fallback);
      structuredNotes.push({
        code: "schemaMigrated",
        params: { from: fromVersion, to: SPEC_VERSION },
        fallback,
      });
    } catch (e) {
      const msg = e instanceof MigrationError ? e.message : String(e);
      return fail([`Không mở được file: ${msg}`], warnings);
    }
  }

  // Đợt 26 J5 — fail-soft cho speedKeyframes (sửa lỗ hổng I6 §5a): thu
  // thập warnings trong cùng lần duyệt validate; vi phạm curve KHÔNG
  // làm load thất bại (errors vẫn chặn như cũ). Project lành → 0 warning
  // speedCurve (seed deep I6 trước đây load ok 0 warning nay load ok kèm
  // warning nêu đúng clip/keyframe/giá trị v=5).
  const speedCurveWarningsAll: SpeedCurveWarning[] = [];
  const errors = validateSpecDeep(spec, new Set(), { speedCurveWarnings: speedCurveWarningsAll });
  if (errors.length > 0) return fail(errors, warnings);
  const speedCurveWarnings = speedCurveWarningsAll.slice(0, 100);
  for (const w of speedCurveWarnings) warnings.push(formatSpeedCurveWarning(w));
  if (speedCurveWarningsAll.length > 100) {
    warnings.push(
      `Còn ${speedCurveWarningsAll.length - 100} cảnh báo speedKeyframes khác (đã giới hạn hiển thị 100).`,
    );
  }
  const vspec = spec as VideoSpec;
  // Phase 9 đợt 12 T4: migrate motion cũ (đợt 11 P6) ở cổng load web, SAU
  // validateSpecDeep (validate web không kiểm tra motion nên thứ tự này
  // không làm file hỏng nào lọt qua, chỉ chuẩn hoá spec hợp lệ sắp trả về).
  // loadProject (mở file) và loadAutosave (khôi phục autosave) đều đi qua
  // parseProjectText nên cả hai cổng đều được migrate.
  const mig = migrateProjectMotion(vspec);
  if (mig.warnings.length > 0) {
    warnings.push(...mig.warnings);
    structuredNotes.push(...mig.structuredNotes);
    const hintFallback = "Motion cũ đã được chuẩn hoá khi mở — lưu lại file để hoàn tất nâng cấp.";
    warnings.push(hintFallback);
    structuredNotes.push({ code: "motionMigratedHint", params: {}, fallback: hintFallback });
  }
  const finalSpec = mig.spec;
  // Phase 9 đợt 27 K1 — chuẩn hóa style cho text clip (root cause bug
  // đợt 26 J6 §6): validateSpecDeep chỉ kiểm tra text clip có `text`,
  // không kiểm tra `style`, nên clip thiếu style lọt qua load rồi preview
  // mới ném TypeError ở drawTextClip (clip.style.animation). Điền style
  // mặc định TẠI ĐÂY (sau validate + migrate motion) nên cả mở file lẫn
  // khôi phục autosave đều được sửa, vì cả hai đều qua parseProjectText.
  // Clip đã có style đầy đủ giữ nguyên tham chiếu từng field (không đổi
  // hành vi render); chỉ field thiếu/sai kiểu mới được điền.
  const textStyleFixes = normalizeTextStyles(finalSpec);
  if (textStyleFixes.length > 0) {
    const shown = textStyleFixes.slice(0, 5).join(", ");
    const extra = textStyleFixes.length > 5 ? ", …" : "";
    const fallback =
      `Đã điền style mặc định cho ${textStyleFixes.length} text clip thiếu style (${shown}${extra}) — lưu lại file để hoàn tất.`;
    warnings.push(fallback);
    structuredNotes.push({
      code: "textStyleFixed",
      params: { count: String(textStyleFixes.length), shown, extra },
      fallback,
    });
  }
  // Phase 9 đợt 49 E4 — sanitize keyframe array ở cổng load (fix bug D3
  // M1: volumeKeyframes [null] qua load rồi giết tick preview ở
  // syncMedia). Chạy SAU validate + migrate motion + normalize text
  // style, cùng vị trí với normalizeTextStyles, nên cả mở file lẫn
  // khôi phục autosave đều được sửa (cả hai đều qua parseProjectText).
  // Fail-soft như speedCurve: project vẫn mở được, chỉ ghi warning +
  // keyframeFixes. Không thêm StructuredNote mới (tránh đụng union code
  // + key i18n của các luồng khác); warning chuỗi đã đủ cho UI/load-report.
  const keyframeFixes = sanitizeKeyframeArrays(finalSpec);
  if (keyframeFixes.length > 0) {
    const shown = keyframeFixes.slice(0, 5).join(", ");
    const extra = keyframeFixes.length > 5 ? ", …" : "";
    warnings.push(
      `Đã loại keyframe lỗi khỏi ${keyframeFixes.length} field (${shown}${extra}) — lưu lại file để hoàn tất.`,
    );
  }
  const blobItems = findBlobWarningItems(finalSpec);
  warnings.push(...blobItems.map((n) => n.fallback));
  structuredNotes.push(...blobItems);
  return { ok: true, spec: finalSpec, name, errors: [], warnings, speedCurveWarnings, textStyleFixes, keyframeFixes, structuredNotes };
}

/** Đọc File từ <input> → LoadResult (validate đầy đủ, lỗi chi tiết). */
export async function loadProject(file: File): Promise<LoadResult> {
  const text = await file.text();
  return parseProjectText(text);
}

/** Đóng gói spec thành envelope + JSON text. */
export function serializeProject(
  spec: VideoSpec,
  name: string,
  session?: AutosaveSession,
): {
  json: string;
  envelope: ProjectEnvelope;
  warnings: string[];
  /** Đợt 31 N4 — dạng cấu trúc của warnings (hiện chỉ blobUrl). */
  structuredNotes: StructuredNote[];
} {
  const structuredNotes = findBlobWarningItems(spec);
  const warnings = structuredNotes.map((n) => n.fallback);
  const envelope: ProjectEnvelope = {
    format: "vcut-project",
    formatVersion: 1,
    appVersion: APP_VERSION,
    specVersion: SPEC_VERSION,
    savedAt: new Date().toISOString(),
    name: name && name.trim().length > 0 ? name : "Dự án không tên",
    spec,
  };
  // Đợt 36 S5: chỉ ghi session khi playhead hợp lệ; session xấu thì bỏ
  // (không ghi field rác vào autosave), envelope cũ không có session
  // vẫn đọc được như trước.
  if (
    session !== undefined &&
    typeof session.playhead === "number" &&
    Number.isFinite(session.playhead) &&
    session.playhead >= 0
  ) {
    envelope.session = { playhead: session.playhead };
  }
  return { json: JSON.stringify(envelope, null, 2), envelope, warnings, structuredNotes };
}

/**
 * Lưu project thành file `.vcut.json` (tải xuống qua trình duyệt).
 * Đợt 31 N4: trả về kết quả có cấu trúc — `structuredNotes` (code +
 * tham số) là dạng chính để UI dịch toast qua i18n; `warnings` chuỗi
 * cũ giữ lại để tương thích. Đánh dấu project là "đã lưu".
 */
export function saveProject(spec: VideoSpec, name: string): {
  warnings: string[];
  structuredNotes: StructuredNote[];
} {
  const { json, warnings, structuredNotes } = serializeProject(spec, name);
  const safeName = (name || "du-an").replace(/[\\/:*?"<>|]/g, "_").trim() || "du-an";
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}${PROJECT_FILE_EXT}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  markSaved(spec);
  return { warnings, structuredNotes };
}

// ---------------------------------------------------------------------------
// Autosave (localStorage) + dirty tracking.
// ---------------------------------------------------------------------------

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let lastAutosaveAt: string | null = null;
let lastSavedHash: string | null = null;

/** Đánh dấu spec hiện tại là "đã lưu" (sau saveProject / mở file). */
export function markSaved(spec: VideoSpec): void {
  lastSavedHash = specHash(spec);
}

/** true nếu spec khác với lần lưu gần nhất (hoặc chưa từng lưu mà project không rỗng). */
export function isDirty(spec: VideoSpec): boolean {
  if (lastSavedHash === null)
    return spec.tracks.length > 0 || spec.meta.name !== "Dự án mới";
  return specHash(spec) !== lastSavedHash;
}

export function getLastAutosaveAt(): string | null {
  return lastAutosaveAt;
}

/** Ghi autosave ngay lập tức (dùng cho test và sau khi mở file). */
export function autosaveNow(spec: VideoSpec, name: string, session?: AutosaveSession): void {
  try {
    const { json } = serializeProject(spec, name, session);
    localStorage.setItem(AUTOSAVE_KEY, json);
    lastAutosaveAt = new Date().toISOString();
  } catch {
    // quota đầy hoặc storage bị chặn → bỏ qua lặng lẽ, không làm hỏng editor
  }
}

/** Lên lịch autosave (debounce 5s). Gọi mỗi khi spec thay đổi. */
export function autosave(spec: VideoSpec, name: string, session?: AutosaveSession): void {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    autosaveNow(spec, name, session);
  }, AUTOSAVE_DEBOUNCE_MS);
}

/** Đọc autosave. Trả null nếu không có hoặc file autosave hỏng (validate lại).
 *  Đợt 26 J5: kèm warnings (kể cả speedCurveWarnings có cấu trúc) để App
 *  hiển thị toast lúc khôi phục — trước đây cổng này bỏ warnings. */
export function loadAutosave(): {
  spec: VideoSpec;
  name: string;
  savedAt: string;
  warnings: string[];
  speedCurveWarnings: SpeedCurveWarning[];
  /** Đợt 31 N4 — dạng cấu trúc của warnings (blob/migration/format/style). */
  structuredNotes: StructuredNote[];
  /**
   * Đợt 36 S5 — trạng thái phiên đọc từ envelope autosave. null khi
   * envelope cũ không có session hoặc session không hợp lệ (App giữ
   * playhead 0 như trước). Chỉ playhead được bền vững; playing và
   * reversePlayback luôn reset (xem AutosaveSession).
   */
  session: AutosaveSession | null;
} | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(AUTOSAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const res = parseProjectText(raw);
  if (!res.ok || !res.spec) return null; // autosave hỏng → bỏ, không crash app
  // Đợt 36 S5: đọc session từ envelope thô (parseProjectText bỏ qua
  // field lạ nên không trả session; đọc riêng ở đây, không hợp lệ → null).
  let session: AutosaveSession | null = null;
  try {
    const parsed = parseSessionPlayhead(JSON.parse(raw) as unknown);
    if (parsed !== null) session = { playhead: parsed };
  } catch {
    session = null;
  }
  // Phase 9 đợt 32 O6 — đóng D7 (nợ đợt 30 M5): parseProjectText (K1)
  // đã gắn style vào spec TRONG BỘ NHỚ, nhưng không ai ghi lại file
  // autosave bền vững: App.tsx lúc khôi phục chỉ replaceProject +
  // markSaved, còn autosave theo spec-thay-đổi không kích hoạt cho lần
  // replace đầu (effect đăng ký sau effect khôi phục). Kết quả: mỗi
  // lần reload lại đọc seed cũ thiếu style, lại toast "đã điền style",
  // và probe đọc localStorage (M5) mãi thấy topHasStyle=false — dù
  // preview đã hết exception nhờ guard + chuẩn hóa trong bộ nhớ.
  // Ghi lại NGAY khi K1 thực sự sửa (textStyleFixes > 0) để sửa bền
  // vững; seed đã sạch thì không ghi đè (giữ savedAt gốc). Caller duy
  // nhất là App.tsx lúc khôi phục; đường mở file (ProjectMenu) vốn đã
  // autosave lại sau mở nên không cần đổi. autosaveNow tự nuốt lỗi
  // quota/storage nên lần ghi này không làm hỏng khôi phục.
  // Đợt 36 S5: lần ghi lại này phải mang theo session đã đọc, nếu không
  // playhead bền vững sẽ bị ghi đè mất ngay ở lần khôi phục đầu tiên.
  if ((res.textStyleFixes?.length ?? 0) > 0) {
    autosaveNow(res.spec, res.name, session ?? undefined);
  }
  let savedAt = "";
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (typeof d.savedAt === "string") savedAt = d.savedAt;
  } catch {
    // bỏ qua
  }
  return { spec: res.spec, name: res.name, savedAt, warnings: res.warnings, speedCurveWarnings: res.speedCurveWarnings, structuredNotes: res.structuredNotes, session };
}

/**
 * Đợt 36 S5 — chỉ cập nhật field `session.playhead` của envelope
 * autosave ĐÃ CÓ, không chạm spec/name/savedAt.
 *
 * Dùng cho handler pagehide/visibilitychange của App: mục đích duy nhất
 * là bắt playhead cuối khi spec không đổi (debounce spec không kích
 * hoạt). Viết lại toàn bộ envelope ở đây sẽ nguy hiểm: lần ghi này
 * chạy khi trang sắp chết, và sẽ ghi đè spec mới hơn mà một tab khác
 * vừa autosave (last-writer-wins oan). Cập nhật phẫu thuật field
 * session thì an toàn: playhead khôi phục ở App đã clamp theo duration
 * nên session cũ trên spec mới cũng không gây hại. Chưa có autosave
 * thì không làm gì (không tạo envelope rỗng từ spec bộ nhớ); JSON hỏng
 * hoặc storage bị chặn thì bỏ qua lặng lẽ như autosaveNow.
 */
export function persistSessionPlayhead(playhead: number): void {
  if (typeof playhead !== "number" || !Number.isFinite(playhead) || playhead < 0) return;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as unknown;
    if (!isRecord(data)) return;
    data["session"] = { playhead };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {
    // bỏ qua lặng lẽ — như autosaveNow.
  }
}

/** Xoá autosave (khi tạo project mới). */
export function clearAutosave(): void {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // bỏ qua
  }
  lastAutosaveAt = null;
}
