/**
 * projectHistory.ts — Lịch sử phiên bản project VCut (Phase 8 Q7).
 *
 * Phạm vi TRUNG THỰC:
 * - Lưu LOCAL trước: IndexedDB trên trình duyệt (fallback: bộ nhớ tạm khi
 *   không có IndexedDB, ví dụ chạy test Node — dữ liệu đó mất khi tải lại).
 * - Chưa có đồng bộ cloud: version chỉ tồn tại trên máy này. Muốn mang đi
 *   máy khác thì dùng Xuất/Nhập lịch sử (file JSON) hoặc .vcut.zip.
 * - Version lưu TOÀN BỘ spec (không phải delta) — đơn giản, khôi phục chắc
 *   chắn, đổi lại tốn dung lượng hơn. Giới hạn giữ mặc định 50 version/project.
 * - Đổi tên project sẽ bắt đầu chuỗi lịch sử mới (projectId gắn với tên lúc
 *   tạo/mở). Đây là giới hạn v1, ghi rõ để không ai tưởng rename giữ history.
 * - Khôi phục version (Phase 9 đợt 13 C4): restoreVersion migrate motion cũ
 *   (weights 0 / thiếu frames / blur {}) TRÊN BẢN SAO trước khi trả về
 *   editor — snapshot gốc trong kho giữ nguyên, không bị ghi đè.
 */
import type { VideoSpec } from "@repo-1/video-spec";
import { migrateMotion } from "@repo-1/video-spec";
import type { ClipMotion } from "@repo-1/video-spec";

// NOTE: stableStringify/specHash được định nghĩa lại tại đây (cùng thuật toán
// FNV-1a + key sắp xếp như projectRepo.ts) thay vì import, vì Node
// type-stripping không resolve được import tương đối không có đuôi ".ts",
// còn tsconfig của web (moduleResolution: bundler) lại không cho import đuôi
// ".ts". Giữ hai bản đồng bộ khi sửa thuật toán hash.
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const rec = v as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(rec[k])}`).join(",")}}`;
}

function specHash(spec: VideoSpec): string {
  const s = stableStringify(spec);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const HISTORY_DB_NAME = "vcut-project-history";
export const HISTORY_DB_VERSION = 1;
export const HISTORY_STORE = "versions";
export const HISTORY_KEEP_DEFAULT = 50;
export const HISTORY_PROJECT_KEY = "vcut-studio:history-project-id:v1";

export interface ProjectVersion {
  /** id duy nhất: `${projectId}@${createdAtMs}-${rand}`. */
  id: string;
  projectId: string;
  /** Epoch ms, dùng để sắp xếp. */
  createdAt: number;
  /** ISO 8601, để hiển thị. */
  createdAtIso: string;
  /** Nhãn do user đặt ("" nếu auto). */
  label: string;
  /** Hash ổn định của spec — dùng để bỏ qua snapshot trùng. */
  hash: string;
  /** id version cha ("" nếu là version đầu tiên của project). */
  parentId: string;
  /** Tóm tắt thay đổi so với version cha (tiếng Việt, từng dòng). */
  summary: string[];
  spec: VideoSpec;
}

export interface HistoryExport {
  format: "vcut-history";
  formatVersion: 1;
  projectId: string;
  exportedAt: string;
  versions: ProjectVersion[];
}

// ---------------------------------------------------------------------------
// Diff tóm tắt — logic thuần, test được bằng Node.
// ---------------------------------------------------------------------------

type ClipLike = { id: string; start?: number; duration?: number; in?: number; out?: number; src?: string };

function clipsOf(spec: VideoSpec): Map<string, ClipLike> {
  const m = new Map<string, ClipLike>();
  for (const t of spec.tracks ?? []) {
    for (const c of (t.clips ?? []) as unknown as ClipLike[]) m.set(c.id, c);
  }
  return m;
}

function fmtSec(s: number): string {
  return `${s.toFixed(1)}s`;
}

/** So sánh 2 spec, trả về các dòng tóm tắt tiếng Việt (mảng rỗng = không đổi). */
export function summarizeDiff(oldSpec: VideoSpec | null, newSpec: VideoSpec): string[] {
  const out: string[] = [];
  if (!oldSpec) return ["Phiên bản đầu tiên của project."];
  if ((oldSpec.meta?.name ?? "") !== (newSpec.meta?.name ?? "")) {
    out.push(`Đổi tên: "${oldSpec.meta?.name ?? ""}" → "${newSpec.meta?.name ?? ""}"`);
  }
  const oldTracks = oldSpec.tracks ?? [];
  const newTracks = newSpec.tracks ?? [];
  if (oldTracks.length !== newTracks.length) {
    out.push(`Số track: ${oldTracks.length} → ${newTracks.length}`);
  }
  const oldClips = clipsOf(oldSpec);
  const newClips = clipsOf(newSpec);
  let added = 0;
  let removed = 0;
  let moved = 0;
  let trimmed = 0;
  for (const [id, c] of newClips) {
    const o = oldClips.get(id);
    if (!o) { added++; continue; }
    if (o.start !== c.start) moved++;
    if (o.duration !== c.duration || o.in !== c.in || o.out !== c.out) trimmed++;
  }
  for (const id of oldClips.keys()) if (!newClips.has(id)) removed++;
  if (added > 0) out.push(`Thêm ${added} clip`);
  if (removed > 0) out.push(`Xoá ${removed} clip`);
  if (moved > 0) out.push(`Di chuyển ${moved} clip`);
  if (trimmed > 0) out.push(`Cắt/xén ${trimmed} clip`);
  const oldDur = projectDurationOf(oldSpec);
  const newDur = projectDurationOf(newSpec);
  if (Math.abs(oldDur - newDur) > 0.001) {
    out.push(`Tổng thời lượng: ${fmtSec(oldDur)} → ${fmtSec(newDur)}`);
  }
  if (out.length === 0) out.push("Không thay đổi nội dung (chỉ cập nhật metadata).");
  return out;
}

function projectDurationOf(spec: VideoSpec): number {
  let max = 0;
  for (const t of spec.tracks ?? []) {
    for (const c of (t.clips ?? []) as unknown as ClipLike[]) {
      const end = (c.start ?? 0) + (c.duration ?? 0);
      if (end > max) max = end;
    }
  }
  return max;
}

// ---------------------------------------------------------------------------
// Backend lưu trữ — tách riêng để test được bằng MemoryBackend trên Node.
// ---------------------------------------------------------------------------

export interface VersionBackend {
  put(v: ProjectVersion): Promise<void>;
  get(id: string): Promise<ProjectVersion | null>;
  list(projectId: string): Promise<ProjectVersion[]>;
  delete(id: string): Promise<void>;
}

/** Backend bộ nhớ tạm — dùng cho test; KHÔNG bền vững qua reload. */
export class MemoryBackend implements VersionBackend {
  private map = new Map<string, ProjectVersion>();
  async put(v: ProjectVersion): Promise<void> { this.map.set(v.id, v); }
  async get(id: string): Promise<ProjectVersion | null> { return this.map.get(id) ?? null; }
  async list(projectId: string): Promise<ProjectVersion[]> {
    return [...this.map.values()]
      .filter((v) => v.projectId === projectId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  async delete(id: string): Promise<void> { this.map.delete(id); }
}

/** Backend IndexedDB thật cho trình duyệt. */
export class IndexedDBBackend implements VersionBackend {
  private dbPromise: Promise<unknown> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise as Promise<IDBDatabase>;
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const g = globalThis as unknown as { indexedDB?: IDBFactory };
      if (!g.indexedDB) { reject(new Error("Trình duyệt không có IndexedDB.")); return; }
      const req = g.indexedDB.open(HISTORY_DB_NAME, HISTORY_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result as IDBDatabase;
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const st = db.createObjectStore(HISTORY_STORE, { keyPath: "id" });
          st.createIndex("byProject", "projectId", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result as IDBDatabase);
      req.onerror = () => reject(req.error ?? new Error("Không mở được IndexedDB."));
    });
    return this.dbPromise as Promise<IDBDatabase>;
  }

  private async tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>): Promise<T> {
    const db = await this.openDb();
    const store = db.transaction(HISTORY_STORE, mode).objectStore(HISTORY_STORE);
    const r = fn(store);
    if (r instanceof Promise) return r;
    return new Promise<T>((resolve, reject) => {
      (r as IDBRequest<T>).onsuccess = () => resolve((r as IDBRequest<T>).result);
      (r as IDBRequest<T>).onerror = () => reject((r as IDBRequest<T>).error);
    });
  }

  async put(v: ProjectVersion): Promise<void> {
    await this.tx("readwrite", (s) => s.put(structuredCloneSafe(v)));
  }
  async get(id: string): Promise<ProjectVersion | null> {
    return this.tx("readonly", (s) => s.get(id));
  }
  async list(projectId: string): Promise<ProjectVersion[]> {
    const db = await this.openDb();
    const idx = db.transaction(HISTORY_STORE, "readonly").objectStore(HISTORY_STORE).index("byProject");
    const rows = await new Promise<ProjectVersion[]>((resolve, reject) => {
      const req = idx.getAll(projectId);
      req.onsuccess = () => resolve(req.result as ProjectVersion[]);
      req.onerror = () => reject(req.error);
    });
    return rows.sort((a, b) => a.createdAt - b.createdAt);
  }
  async delete(id: string): Promise<void> {
    await this.tx("readwrite", (s) => s.delete(id));
  }
}

function structuredCloneSafe(v: ProjectVersion): ProjectVersion {
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(stableStringify(v)) as ProjectVersion;
  }
}

// ---------------------------------------------------------------------------
// HistoryStore — logic nghiệp vụ (dùng chung cho cả 2 backend).
// ---------------------------------------------------------------------------

export function makeVersionId(projectId: string, createdAt: number): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${projectId}@${createdAt}-${rand}`;
}

/**
 * Phase 9 đợt 13 C4 — migrate motion cũ cho spec lấy từ lịch sử version.
 *
 * Đợt 12 T4 đã nối migrateMotion vào parseProjectText (mở file + autosave)
 * nhưng restoreVersion đọc thẳng snapshot IndexedDB nên bypass cổng đó:
 * snapshot cũ mang motionBlur weights 0 / thiếu frames / blur {} vẫn trả
 * về editor nguyên dạng cũ. Hàm này chạy cùng rule set với
 * projectRepo.migrateProjectMotion (và cổng render đợt 11 P6): chỉ clip nào
 * migrated=true mới được thay bằng object mới (spread nông), clip/track
 * khác giữ nguyên tham chiếu, project mới hợp lệ trả đúng tham chiếu gốc.
 *
 * KHÔNG mutate input. restoreVersion gọi hàm này TRÊN BẢN SAO đã deep-copy
 * nên snapshot gốc trong backend giữ nguyên (hash/spec không đổi) — khôi
 * phục không phá lịch sử, và lần khôi phục sau vẫn migrate lại từ gốc.
 */
export function migrateHistorySpec(spec: VideoSpec): { spec: VideoSpec; migrated: boolean } {
  let changed = false;
  const tracks = spec.tracks.map((t) => {
    let trackChanged = false;
    const clips = t.clips.map((c) => {
      const motion = (c as { motion?: unknown }).motion;
      if (motion === undefined) return c;
      const r = migrateMotion(motion);
      if (!r.migrated) return c;
      trackChanged = true;
      return { ...c, motion: r.motion as ClipMotion };
    });
    if (trackChanged) {
      changed = true;
      return { ...t, clips };
    }
    return t;
  });
  if (!changed) return { spec, migrated: false };
  return { spec: { ...spec, tracks }, migrated: true };
}

export class HistoryStore {
  private backend: VersionBackend;
  constructor(backend: VersionBackend) {
    this.backend = backend;
  }

  /** Lưu snapshot; trả về null nếu spec trùng version mới nhất (không tạo rác). */
  async saveVersion(projectId: string, spec: VideoSpec, label = ""): Promise<ProjectVersion | null> {
    const versions = await this.backend.list(projectId);
    const hash = specHash(spec);
    const latest = versions[versions.length - 1];
    if (latest && latest.hash === hash) return null;
    const now = Date.now();
    const v: ProjectVersion = {
      id: makeVersionId(projectId, now),
      projectId,
      createdAt: now,
      createdAtIso: new Date(now).toISOString(),
      label,
      hash,
      parentId: latest ? latest.id : "",
      summary: summarizeDiff(latest ? latest.spec : null, spec),
      spec: JSON.parse(stableStringify(spec)) as VideoSpec,
    };
    await this.backend.put(v);
    return v;
  }

  async listVersions(projectId: string): Promise<ProjectVersion[]> {
    return this.backend.list(projectId);
  }

  async restoreVersion(id: string): Promise<VideoSpec | null> {
    const v = await this.backend.get(id);
    if (!v) return null;
    // Deep-copy như cũ, rồi migrate motion cũ TRÊN BẢN SAO (đợt 13 C4):
    // snapshot gốc trong backend KHÔNG bị ghi đè (hash/spec giữ nguyên),
    // spec trả về editor đã chuẩn hoá. Migration chỉ bền vững khi editor
    // lưu lại (saveVersion mới) — đúng như cổng mở file của đợt 12 T4.
    const copy = JSON.parse(stableStringify(v.spec)) as VideoSpec;
    return migrateHistorySpec(copy).spec;
  }

  async deleteVersion(id: string): Promise<void> {
    await this.backend.delete(id);
  }

  /** Giữ lại `keep` version mới nhất, xoá phần cũ. Trả về số đã xoá. */
  async prune(projectId: string, keep: number = HISTORY_KEEP_DEFAULT): Promise<number> {
    const versions = await this.backend.list(projectId);
    const excess = versions.slice(0, Math.max(0, versions.length - keep));
    for (const v of excess) await this.backend.delete(v.id);
    return excess.length;
  }

  exportHistory(projectId: string, versions: ProjectVersion[]): HistoryExport {
    return {
      format: "vcut-history",
      formatVersion: 1,
      projectId,
      exportedAt: new Date().toISOString(),
      versions: versions.map((v) => JSON.parse(stableStringify(v)) as ProjectVersion),
    };
  }

  /** Kiểm chứng file import; lỗi → throw kèm lý do rõ ràng, không ghi gì. */
  validateImport(data: unknown): HistoryExport {
    if (typeof data !== "object" || data === null) throw new Error("File lịch sử không phải JSON object.");
    const d = data as Record<string, unknown>;
    if (d.format !== "vcut-history" || d.formatVersion !== 1) {
      throw new Error("File không phải định dạng lịch sử VCut (vcut-history v1).");
    }
    if (typeof d.projectId !== "string" || !Array.isArray(d.versions)) {
      throw new Error("File lịch sử thiếu projectId hoặc danh sách version.");
    }
    for (const v of d.versions as Record<string, unknown>[]) {
      if (typeof v.id !== "string" || typeof v.projectId !== "string" || typeof v.spec !== "object" || v.spec === null) {
        throw new Error("File lịch sử có version hỏng (thiếu id/projectId/spec).");
      }
      if (typeof v.hash === "string" && v.hash !== specHash(v.spec as VideoSpec)) {
        throw new Error(`Version ${v.id} sai hash spec — file có thể đã bị sửa.`);
      }
    }
    return data as HistoryExport;
  }

  async importHistory(data: unknown): Promise<number> {
    const exp = this.validateImport(data);
    let count = 0;
    for (const v of exp.versions) {
      const existing = await this.backend.get(v.id);
      if (!existing) { await this.backend.put(v); count++; }
    }
    return count;
  }
}

// ---------------------------------------------------------------------------
// Project id hiện tại (localStorage) — dùng chung với UI.
// ---------------------------------------------------------------------------

export function getCurrentProjectId(): string {
  try {
    const v = window.localStorage.getItem(HISTORY_PROJECT_KEY);
    if (v) return v;
  } catch { /* localStorage không dùng được → id theo phiên */ }
  return rotateProjectId();
}

export function rotateProjectId(): string {
  const id = `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try { window.localStorage.setItem(HISTORY_PROJECT_KEY, id); } catch { /* bỏ qua */ }
  return id;
}

export function setProjectIdForFile(fileName: string, spec: VideoSpec): string {
  const id = `file-${specHash(spec).slice(0, 12)}-${fileName.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40)}`;
  try { window.localStorage.setItem(HISTORY_PROJECT_KEY, id); } catch { /* bỏ qua */ }
  return id;
}

/** Singleton cho UI trình duyệt (lazy để không chạm IndexedDB khi test Node). */
let singleton: HistoryStore | null = null;
export function getHistoryStore(): HistoryStore {
  if (!singleton) {
    const g = globalThis as unknown as { indexedDB?: unknown };
    singleton = new HistoryStore(g.indexedDB ? new IndexedDBBackend() : new MemoryBackend());
  }
  return singleton;
}
