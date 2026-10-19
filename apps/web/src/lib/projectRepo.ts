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
 * - Chưa có migration giữa các specVersion (P0-12): file có specVersion khác sẽ
 *   bị từ chối với lỗi rõ ràng thay vì đọc sai lặng lẽ.
 */
import { SPEC_VERSION, isVideoSpec } from "@repo-1/video-spec";
import type { TrackKind, VideoSpec } from "@repo-1/video-spec";

export const PROJECT_FILE_EXT = ".vcut.json";
export const AUTOSAVE_KEY = "vcut-studio:autosave:v1";
export const AUTOSAVE_DEBOUNCE_MS = 5000;
export const APP_VERSION = "0.1.0"; // đồng bộ với apps/web/package.json

const TRACK_KINDS: readonly TrackKind[] = ["video", "audio", "text", "sticker", "image"];

export interface ProjectEnvelope {
  format: "vcut-project";
  formatVersion: 1;
  appVersion: string;
  specVersion: string;
  savedAt: string; // ISO 8601
  name: string;
  spec: VideoSpec;
}

export interface LoadResult {
  ok: boolean;
  spec: VideoSpec | null;
  name: string;
  /** Lỗi chặn việc mở file (file hỏng). */
  errors: string[];
  /** Cảnh báo không chặn (định dạng cũ, blob: URL...). */
  warnings: string[];
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
 * Quét mọi clip tìm `src` là blob: URL. Trả về cảnh báo (không chặn save/load).
 */
export function findBlobWarnings(spec: VideoSpec): string[] {
  const warnings: string[] = [];
  for (const t of spec.tracks ?? []) {
    for (const c of t.clips ?? []) {
      const src = (c as { src?: unknown }).src;
      if (typeof src === "string" && src.startsWith("blob:")) {
        warnings.push(
          `Clip "${c.id}" trên track "${t.id}" đang trỏ tới blob: URL — ` +
            `media này sẽ mất khi tải lại trang (xem P2.2 asset store).`,
        );
      }
    }
  }
  return warnings;
}

function at(path: string, msg: string): string {
  return `${path}: ${msg}`;
}

function validateClipDeep(c: unknown, path: string, errors: string[]): void {
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
  } else {
    errors.push(at(path, `kind không hỗ trợ: ${JSON.stringify(kind)}.`));
  }
}

/**
 * Validate sâu cấu trúc spec (sâu hơn isVideoSpec). Trả về danh sách lỗi,
 * rỗng = hợp lệ. Tối đa 30 lỗi để thông báo không quá dài.
 */
export function validateSpecDeep(spec: unknown): string[] {
  const errors: string[] = [];
  if (!isVideoSpec(spec)) {
    const v = isRecord(spec) ? (spec as Record<string, unknown>).version : undefined;
    errors.push(
      `Không phải video-spec hợp lệ (version=${JSON.stringify(v)}, app hỗ trợ ${SPEC_VERSION}). ` +
        `File có thể bị hỏng hoặc thuộc phiên bản schema khác (chưa có migration).`,
    );
    return errors;
  }
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
  spec.tracks.forEach((t: unknown, ti: number) => {
    const tp = `tracks[${ti}]`;
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
      validateClipDeep(c, `${tp}.clips[${ci}]`, errors);
      if (errors.length > 30) return;
    });
  });
  return errors.slice(0, 30);
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
  if (isRecord(data) && data.format === "vcut-project") {
    if (data.formatVersion !== 1)
      warnings.push(
        `formatVersion=${JSON.stringify(data.formatVersion)} khác 1 — có thể bỏ sót field mới.`,
      );
    if (typeof data.name === "string" && data.name.length > 0) name = data.name;
    if (typeof data.specVersion === "string" && data.specVersion !== SPEC_VERSION)
      warnings.push(
        `specVersion trong file là ${data.specVersion}, app hỗ trợ ${SPEC_VERSION} — ` +
          `chưa có migration tự động (P0-12).`,
      );
    spec = data.spec;
  } else {
    warnings.push("File không có envelope .vcut (định dạng cũ) — vẫn thử đọc như video-spec trần.");
    spec = data;
  }
  const errors = validateSpecDeep(spec);
  if (errors.length > 0) return fail(errors, warnings);
  const vspec = spec as VideoSpec;
  warnings.push(...findBlobWarnings(vspec));
  return { ok: true, spec: vspec, name, errors: [], warnings };
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
): { json: string; envelope: ProjectEnvelope; warnings: string[] } {
  const warnings = findBlobWarnings(spec);
  const envelope: ProjectEnvelope = {
    format: "vcut-project",
    formatVersion: 1,
    appVersion: APP_VERSION,
    specVersion: SPEC_VERSION,
    savedAt: new Date().toISOString(),
    name: name && name.trim().length > 0 ? name : "Dự án không tên",
    spec,
  };
  return { json: JSON.stringify(envelope, null, 2), envelope, warnings };
}

/**
 * Lưu project thành file `.vcut.json` (tải xuống qua trình duyệt).
 * Trả về warnings (vd: blob: URL). Đánh dấu project là "đã lưu".
 */
export function saveProject(spec: VideoSpec, name: string): { warnings: string[] } {
  const { json, warnings } = serializeProject(spec, name);
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
  return { warnings };
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
export function autosaveNow(spec: VideoSpec, name: string): void {
  try {
    const { json } = serializeProject(spec, name);
    localStorage.setItem(AUTOSAVE_KEY, json);
    lastAutosaveAt = new Date().toISOString();
  } catch {
    // quota đầy hoặc storage bị chặn → bỏ qua lặng lẽ, không làm hỏng editor
  }
}

/** Lên lịch autosave (debounce 5s). Gọi mỗi khi spec thay đổi. */
export function autosave(spec: VideoSpec, name: string): void {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    autosaveNow(spec, name);
  }, AUTOSAVE_DEBOUNCE_MS);
}

/** Đọc autosave. Trả null nếu không có hoặc file autosave hỏng (validate lại). */
export function loadAutosave(): { spec: VideoSpec; name: string; savedAt: string } | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(AUTOSAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const res = parseProjectText(raw);
  if (!res.ok || !res.spec) return null; // autosave hỏng → bỏ, không crash app
  let savedAt = "";
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (typeof d.savedAt === "string") savedAt = d.savedAt;
  } catch {
    // bỏ qua
  }
  return { spec: res.spec, name: res.name, savedAt };
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
