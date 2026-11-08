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
 *   (Đợt 64 R6: giới hạn này ĐÃ HẾT — lịch sử nay khóa theo projectId ổn
 *   định của envelope (xem HistoryStore.migrateVersions +
 *   adoptLegacyHistoryChain); đổi tên chỉ đổi spec.meta.name, chuỗi
 *   version không đứt. Dòng này giữ lại làm lịch sử quyết định.)
 * - Khôi phục version (Phase 9 đợt 13 C4): restoreVersion migrate motion cũ
 *   (weights 0 / thiếu frames / blur {}) TRÊN BẢN SAO trước khi trả về
 *   editor — snapshot gốc trong kho giữ nguyên, không bị ghi đè.
 */
import type { VideoSpec } from "@repo-1/video-spec";
import { migrateMotion } from "@repo-1/video-spec";
import type { ClipMotion } from "@repo-1/video-spec";
// Import kèm đuôi .ts theo quy ước strip-types (xem nestedPreview.ts):
// vite và node strip-types đều resolve được đuôi .ts, chỉ tsc là báo
// TS5097 nên dòng import này mang @ts-ignore có chủ đích.
// @ts-ignore: TS5097, đuôi .ts cho strip-types (import một dòng để @ts-ignore phủ đúng dòng specifier)
import { classifyLegacyFragment, decideLegacyAdoption, isAmbiguousAdoptionReason, isLegacyHistoryId, legacyChainDisplay, type AdoptDecision, type LegacyAdoptionEvidence } from "./projectNameRegistry64R6.ts";

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

/**
 * Đợt 65 S9 — spec có ≥1 clip ở bất kỳ track nào không? Spec rỗng
 * (0 clip) có hash trùng nhau giữa hai project mới tinh nên không đủ
 * làm bằng chứng nội dung (xem LegacyAdoptionEvidence.specNonTrivial).
 */
function specHasClips(spec: VideoSpec): boolean {
  return (spec.tracks ?? []).some((t) => (t.clips ?? []).length > 0);
}

/** Đợt 65 S9 — gói bằng chứng nội dung cho luật nhận chuỗi legacy. */
function buildAdoptionEvidence(
  spec: VideoSpec | undefined,
  versions: ProjectVersion[],
): LegacyAdoptionEvidence {
  return {
    openedSpecHash: spec ? specHash(spec) : null,
    chainVersionHashes: versions.map((v) => v.hash),
    specNonTrivial: spec ? specHasClips(spec) : false,
  };
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

/**
 * Phase 9 đợt 56 M6 — lookup i18n tùy chọn, KHÔNG import `../i18n`
 * trực tiếp: file này được test bằng Node type-stripping, mà Node
 * không resolve JSON import của `i18n/index.ts` (đã kiểm chứng 07/11,
 * xem twoLevelCurve.ts). Khi `lookup` vắng → fallback đúng từng chữ
 * chuỗi VI cũ nên test cũ + hành vi mặc định không đổi; UI (HistoryPanel)
 * truyền `t()` vào tham số `lookup` này để nhận chuỗi theo locale hiện
 * tại. Key mới nằm trong `i18n/fragments/round56-m6.json` (parent merge
 * vào vi.json/en.json cuối đợt 56).
 */
export type I18nLookup = (key: string, vars?: Record<string, string>) => string;
function trKey(
  lookup: I18nLookup | undefined,
  key: string,
  vars: Record<string, string>,
  fallback: string,
): string {
  if (!lookup) return fallback;
  const out = lookup(key, vars);
  return out === key ? fallback : out;
}

/** So sánh 2 spec, trả về các dòng tóm tắt thay đổi (mảng rỗng = không đổi). */
export function summarizeDiff(
  oldSpec: VideoSpec | null,
  newSpec: VideoSpec,
  lookup?: I18nLookup,
): string[] {
  const out: string[] = [];
  if (!oldSpec) {
    return [trKey(lookup, "projectHistory.firstVersion", {}, "Phiên bản đầu tiên của project.")];
  }
  if ((oldSpec.meta?.name ?? "") !== (newSpec.meta?.name ?? "")) {
    out.push(
      trKey(
        lookup,
        "projectHistory.renamed",
        { old: oldSpec.meta?.name ?? "", new: newSpec.meta?.name ?? "" },
        `Đổi tên: "${oldSpec.meta?.name ?? ""}" → "${newSpec.meta?.name ?? ""}"`,
      ),
    );
  }
  const oldTracks = oldSpec.tracks ?? [];
  const newTracks = newSpec.tracks ?? [];
  if (oldTracks.length !== newTracks.length) {
    out.push(
      trKey(
        lookup,
        "projectHistory.trackCount",
        { old: String(oldTracks.length), new: String(newTracks.length) },
        `Số track: ${oldTracks.length} → ${newTracks.length}`,
      ),
    );
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
  if (added > 0) {
    out.push(trKey(lookup, "projectHistory.addedClips", { n: String(added) }, `Thêm ${added} clip`));
  }
  if (removed > 0) {
    out.push(trKey(lookup, "projectHistory.removedClips", { n: String(removed) }, `Xoá ${removed} clip`));
  }
  if (moved > 0) {
    out.push(trKey(lookup, "projectHistory.movedClips", { n: String(moved) }, `Di chuyển ${moved} clip`));
  }
  if (trimmed > 0) {
    out.push(trKey(lookup, "projectHistory.trimmedClips", { n: String(trimmed) }, `Cắt/xén ${trimmed} clip`));
  }
  const oldDur = projectDurationOf(oldSpec);
  const newDur = projectDurationOf(newSpec);
  if (Math.abs(oldDur - newDur) > 0.001) {
    out.push(
      trKey(
        lookup,
        "projectHistory.totalDuration",
        { old: fmtSec(oldDur), new: fmtSec(newDur) },
        `Tổng thời lượng: ${fmtSec(oldDur)} → ${fmtSec(newDur)}`,
      ),
    );
  }
  if (out.length === 0) {
    out.push(
      trKey(
        lookup,
        "projectHistory.noContentChange",
        {},
        "Không thay đổi nội dung (chỉ cập nhật metadata).",
      ),
    );
  }
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
  /**
   * Đợt 65 S9 — liệt kê mọi projectId đang có version (để quét chuỗi
   * legacy phân mảnh). TÙY CHỌN: backend không triển khai thì
   * HistoryStore.listProjectIds trả null và quét mảnh bỏ qua (không
   * crash) — backend giả trong test cũ không có hàm này vẫn chạy được.
   */
  listProjectIds?: () => Promise<string[]>;
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
  /** Đợt 65 S9 — liệt kê mọi projectId có version (quét mảnh legacy). */
  async listProjectIds(): Promise<string[]> {
    return [...new Set([...this.map.values()].map((v) => v.projectId))];
  }
}

/** Backend IndexedDB thật cho trình duyệt. */
export class IndexedDBBackend implements VersionBackend {
  private dbPromise: Promise<unknown> | null = null;
  private lookup?: I18nLookup;

  constructor(lookup?: I18nLookup) {
    this.lookup = lookup;
  }

  /** Đợt 57 N8: cập nhật lookup i18n cho lỗi mở DB (xem getHistoryStore). */
  setLookup(lookup: I18nLookup): void {
    this.lookup = lookup;
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise as Promise<IDBDatabase>;
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const g = globalThis as unknown as { indexedDB?: IDBFactory };
      if (!g.indexedDB) {
        reject(new Error(trKey(this.lookup, "projectHistory.noIndexedDb", {}, "Trình duyệt không có IndexedDB.")));
        return;
      }
      const req = g.indexedDB.open(HISTORY_DB_NAME, HISTORY_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result as IDBDatabase;
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const st = db.createObjectStore(HISTORY_STORE, { keyPath: "id" });
          st.createIndex("byProject", "projectId", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result as IDBDatabase);
      req.onerror = () =>
        reject(
          req.error ??
            new Error(trKey(this.lookup, "projectHistory.indexedDbOpenFailed", {}, "Không mở được IndexedDB.")),
        );
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

  /**
   * Đợt 65 S9 — liệt kê mọi projectId có version (quét mảnh legacy):
   * duyệt key của index `byProject` bằng openKeyCursor, gom distinct.
   * Chưa có test Node cho nhánh này (Node không có IndexedDB — cùng
   * giới hạn như mọi hàm IndexedDBBackend khác); đo qua headed khi có.
   */
  async listProjectIds(): Promise<string[]> {
    const db = await this.openDb();
    const idx = db.transaction(HISTORY_STORE, "readonly").objectStore(HISTORY_STORE).index("byProject");
    const ids: string[] = [];
    const seen = new Set<string>();
    await new Promise<void>((resolve, reject) => {
      const req = idx.openKeyCursor();
      req.onsuccess = () => {
        const cursor = req.result as IDBCursor | null;
        if (!cursor) { resolve(); return; }
        const key = cursor.key as string;
        if (!seen.has(key)) { seen.add(key); ids.push(key); }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    return ids;
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
 * Đợt 64 R6 — id version XÁC ĐỊNH khi migration đổi khóa chuỗi:
 * `${toProjectId}@${createdAt}-${hash}`. Hai lượt migration chồng nhau
 * (2 tab cùng mở một file) put cùng một hàng nên hội tụ, không nhân
 * đôi. Va chạm chỉ khi hai version trùng cả createdAt lẫn hash spec —
 * saveVersion đã khử trùng hash với version mới nhất nên thực tế không
 * xảy ra (xem LIMITS đợt 64 R6 §5.2). Version snapshot MỚI vẫn dùng
 * makeVersionId (ngẫu nhiên) như cũ — chỉ migration mới dùng id xác
 * định này.
 */
export function migratedVersionId(toProjectId: string, v: ProjectVersion): string {
  return `${toProjectId}@${v.createdAt}-${v.hash}`;
}

/**
 * Đợt 64 R6 — kiểm tra projectId envelope (UUID hoặc fallback
 * `proj-<time>-<rand>`). Bản mirror tối thiểu của isValidProjectId
 * (lib/projectId63R7.ts) — định nghĩa lại tại đây theo quy ước file này
 * (tránh import value chéo làm nặng module chạy Node trực tiếp); giữ
 * hai bản đồng bộ khi sửa quy tắc id.
 */
export function isValidEnvelopeProjectId(id: unknown): id is string {
  if (typeof id !== "string" || id.length === 0) return false;
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
    /^proj-[0-9a-z]+-[0-9a-z]+$/i.test(id)
  );
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
  private lookup?: I18nLookup;
  constructor(backend: VersionBackend, lookup?: I18nLookup) {
    this.backend = backend;
    this.lookup = lookup;
  }

  /** Đợt 57 N8: cập nhật lookup i18n cho lỗi import/mở DB (xem getHistoryStore). */
  setLookup(lookup: I18nLookup): void {
    this.lookup = lookup;
    if (this.backend instanceof IndexedDBBackend) this.backend.setLookup(lookup);
  }

  /** Lưu snapshot; trả về null nếu spec trùng version mới nhất (không tạo rác). */
  async saveVersion(projectId: string, spec: VideoSpec, label = "", lookup?: I18nLookup): Promise<ProjectVersion | null> {
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
      summary: summarizeDiff(latest ? latest.spec : null, spec, lookup),
      spec: JSON.parse(stableStringify(spec)) as VideoSpec,
    };
    await this.backend.put(v);
    return v;
  }

  async listVersions(projectId: string): Promise<ProjectVersion[]> {
    return this.backend.list(projectId);
  }

  /**
   * Đợt 65 S9 — liệt kê mọi projectId đang có version (quét chuỗi
   * legacy phân mảnh). Trả null khi backend không hỗ trợ liệt kê
   * (backend giả cũ) — caller bỏ qua quét thay vì crash.
   */
  async listProjectIds(): Promise<string[] | null> {
    if (typeof this.backend.listProjectIds !== "function") return null;
    return this.backend.listProjectIds();
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

  /**
   * Đợt 64 R6 — migration chuỗi lịch sử legacy về projectId envelope.
   *
   * Đổi khóa toàn bộ version từ `fromProjectId` (id legacy `file-...`
   * hoặc `proj-...`) sang `toProjectId` (UUID/fallback envelope, phải
   * hợp lệ — id lạ thì throw, lỗi caller). Version mới mang id XÁC
   * ĐỊNH `${to}@${createdAt}-${hash}` (xem migratedVersionId) nên hai
   * lượt migration chồng nhau (2 tab cùng mở một file) hội tụ về cùng
   * một tập hàng thay vì nhân đôi; `parentId` được remap theo cùng
   * bảng (cha ngoài batch — đã bị prune trước đó — giữ nguyên, dangling
   * như hành vi prune cũ). Hàng cũ chỉ bị xóa SAU khi hàng mới đã put
   * xong nên lỗi giữa chừng không mất version (lần migration sau chạy
   * lại sẽ hội tụ). Gộp vào chuỗi đích đã có version thì xen kẽ theo
   * createdAt — đúng theo thời gian, mỗi version giữ nguyên parent
   * chain của nó. Trả về số version đã chuyển (0 khi chuỗi nguồn rỗng
   * hoặc from === to).
   */
  async migrateVersions(fromProjectId: string, toProjectId: string): Promise<{ moved: number }> {
    if (!isValidEnvelopeProjectId(toProjectId)) {
      throw new Error(
        trKey(
          this.lookup,
          "projectHistory.migrateVersionsNeedsProjectId",
          {},
          "migrateVersions cần projectId đích hợp lệ (UUID hoặc proj-<time>-<rand>).",
        ),
      );
    }
    if (!fromProjectId || fromProjectId === toProjectId) return { moved: 0 };
    const versions = await this.backend.list(fromProjectId);
    if (versions.length === 0) return { moved: 0 };
    const idMap = new Map<string, string>();
    for (const v of versions) idMap.set(v.id, migratedVersionId(toProjectId, v));
    for (const v of versions) {
      const nv: ProjectVersion = {
        ...v,
        id: idMap.get(v.id) ?? v.id,
        projectId: toProjectId,
        parentId: v.parentId ? (idMap.get(v.parentId) ?? v.parentId) : "",
      };
      await this.backend.put(nv);
    }
    for (const v of versions) await this.backend.delete(v.id);
    return { moved: versions.length };
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
  validateImport(data: unknown, lookup?: I18nLookup): HistoryExport {
    const lk = lookup ?? this.lookup;
    if (typeof data !== "object" || data === null) {
      throw new Error(trKey(lk, "projectHistory.historyNotJsonObject", {}, "File lịch sử không phải JSON object."));
    }
    const d = data as Record<string, unknown>;
    if (d.format !== "vcut-history" || d.formatVersion !== 1) {
      throw new Error(
        trKey(lk, "projectHistory.historyBadFormat", {}, "File không phải định dạng lịch sử VCut (vcut-history v1)."),
      );
    }
    if (typeof d.projectId !== "string" || !Array.isArray(d.versions)) {
      throw new Error(
        trKey(
          lk,
          "projectHistory.historyMissingFields",
          {},
          "File lịch sử thiếu projectId hoặc danh sách version.",
        ),
      );
    }
    for (const v of d.versions as Record<string, unknown>[]) {
      if (typeof v.id !== "string" || typeof v.projectId !== "string" || typeof v.spec !== "object" || v.spec === null) {
        throw new Error(
          trKey(
            lk,
            "projectHistory.historyBadVersion",
            {},
            "File lịch sử có version hỏng (thiếu id/projectId/spec).",
          ),
        );
      }
      if (typeof v.hash === "string" && v.hash !== specHash(v.spec as VideoSpec)) {
        throw new Error(
          trKey(
            lk,
            "projectHistory.historyBadHash",
            { id: String(v.id) },
            `Version ${v.id} sai hash spec — file có thể đã bị sửa.`,
          ),
        );
      }
    }
    return data as HistoryExport;
  }

  async importHistory(data: unknown, lookup?: I18nLookup): Promise<number> {
    const exp = this.validateImport(data, lookup);
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
//
// Đợt 64 R6 — HỆ ID LEGACY (DEPRECATED, chỉ giữ để migration + tương
// thích): từ đợt này, chuỗi lịch sử khóa theo projectId ỔN ĐỊNH của
// envelope (store.projectId, xem lib/projectId63R7.ts), không còn khóa
// theo id legacy dưới đây. Ba hàm getCurrentProjectId / rotateProjectId /
// setProjectIdForFile KHÔNG còn caller nào trong production (HistoryPanel
// + snapshotHistoryAfterSave + doNew + desktop new-project đều đã chuyển
// sang store.projectId); giữ lại export để test/code ngoài không gãy và
// để adoptLegacyHistoryChain còn đọc được khóa legacy lúc migration.
// ĐỪNG dùng ba hàm này cho code mới.
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

// ---------------------------------------------------------------------------
// Đợt 64 R6 — nhận chuỗi lịch sử legacy về projectId envelope (migration
// một lần lúc mở file). Luật nhận ở decideLegacyAdoption
// (lib/projectNameRegistry64R6.ts §3 — đợt 65 S9: cổng tên + bằng chứng
// nội dung bằng hash spec, sửa lỗi nhận nhầm 2 file cùng tên; chuỗi
// legacy phân mảnh được quét thêm qua scanLegacyFragments).
// Hàm này KHÔNG BAO GIỜ throw — lỗi kho chỉ trả về reason "error" để
// đường mở file không gãy vì lịch sử.
// ---------------------------------------------------------------------------

/** Đọc khóa lịch sử legacy mà KHÔNG xoay id mới khi vắng (khác getCurrentProjectId). */
export function readLegacyHistoryProjectId(): string | null {
  try {
    const g = globalThis as unknown as { window?: { localStorage?: Storage }; localStorage?: Storage };
    const ls = g.window?.localStorage ?? g.localStorage;
    const v = ls?.getItem(HISTORY_PROJECT_KEY);
    return typeof v === "string" && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/** Xóa khóa lịch sử legacy sau khi đã nhận chuỗi (hoặc chuỗi đã rỗng). */
export function clearLegacyHistoryProjectId(): void {
  try {
    const g = globalThis as unknown as { window?: { localStorage?: Storage }; localStorage?: Storage };
    const ls = g.window?.localStorage ?? g.localStorage;
    ls?.removeItem(HISTORY_PROJECT_KEY);
  } catch { /* bỏ qua */ }
}

/** Phụ thuộc của adoptLegacyHistoryChain — inject được để test bằng MemoryBackend + localStorage giả. */
export interface AdoptLegacyHistoryDeps {
  store: HistoryStore;
  readLegacyId: () => string | null;
  clearLegacyId: () => void;
}

export function defaultAdoptDeps(): AdoptLegacyHistoryDeps {
  return {
    store: getHistoryStore(),
    readLegacyId: readLegacyHistoryProjectId,
    clearLegacyId: clearLegacyHistoryProjectId,
  };
}

/**
 * Đợt 65 S9 — tùy chọn của adoptLegacyHistoryChain. `spec` là spec của
 * file đang mở: bằng chứng nội dung để phân biệt 2 file cùng tên (hash
 * spec) và để quét mảnh legacy phân mảnh. Không có spec thì chỉ còn
 * cổng tên — chuỗi không rỗng sẽ bị từ chối (mơ hồ), quét mảnh bỏ qua.
 */
export interface AdoptLegacyHistoryOpts {
  spec?: VideoSpec;
}

/** Một mảnh legacy phân mảnh đã nhận về id envelope. */
export interface LegacyFragmentAdoption {
  from: string;
  moved: number;
}

/** Một mảnh legacy MƠ HỒ — có tín hiệu liên quan nhưng không đủ chắc để nhận; còn nguyên, không đụng. */
export interface LegacyFragmentAmbiguous {
  from: string;
  reason: string;
  /**
   * Đợt 66 T7 — bằng chứng hiển thị cho UI nhận thủ công
   * (LegacyHistoryAdoptModal): tên suy ra từ id, hash nhúng trong id,
   * số version, mốc version đầu/cuối. Xem legacyChainDisplay
   * (projectNameRegistry64R6.ts).
   */
  namePart: string;
  embeddedHash: string | null;
  versionCount: number;
  firstCreatedAt: number | null;
  lastCreatedAt: number | null;
}

/** Đợt 66 T7 — đóng gói một mục mơ hồ kèm bằng chứng hiển thị. */
function ambiguousFragmentEntry(
  from: string,
  reason: string,
  versions: ProjectVersion[],
): LegacyFragmentAmbiguous {
  const d = legacyChainDisplay(from, versions);
  return {
    from,
    reason,
    namePart: d.namePart,
    embeddedHash: d.embeddedHash,
    versionCount: d.versionCount,
    firstCreatedAt: d.firstCreatedAt,
    lastCreatedAt: d.lastCreatedAt,
  };
}

export interface AdoptLegacyHistoryResult {
  /** Số version đã chuyển về id envelope (0 khi không nhận). */
  moved: number;
  /** Id legacy đã xét (null khi không có khóa legacy). */
  from: string | null;
  /** true khi đã quyết định nhận (kể cả khi chuỗi nguồn rỗng). */
  adopted: boolean;
  /** Lý do: xem decideLegacyAdoption + "adopted" / "error" / "invalid-envelope-id". */
  reason: string;
  /** Thông báo lỗi khi reason === "error". */
  error?: string;
  /** Mảnh legacy phân mảnh đã nhận thêm (ngoài chuỗi con trỏ). */
  fragmentsAdopted: LegacyFragmentAdoption[];
  /** Mảnh có tín hiệu liên quan nhưng mơ hồ — còn nguyên, không đụng. */
  fragmentsAmbiguous: LegacyFragmentAmbiguous[];
  /**
   * Đợt 66 T7 — chuỗi CON TRỎ bị từ chối vì mơ hồ (kèm bằng chứng hiển
   * thị để UI nhận thủ công); null khi con trỏ đã nhận / từ chối hẳn /
   * không có con trỏ. Khác fragmentsAmbiguous (mảnh quét được ngoài
   * chuỗi con trỏ).
   */
  pointerAmbiguous?: LegacyFragmentAmbiguous | null;
  /**
   * Đợt 66 T7 — hash spec đang mở (để UI so sánh với hash nhúng trong
   * id chuỗi); null khi caller không đưa spec.
   */
  openedSpecHash?: string | null;
  /**
   * Lý do quét mảnh không chạy / chạy chưa hết: "no-spec" (không có
   * spec đang mở làm bằng chứng), "store-cannot-enumerate" (backend
   * không liệt kê được projectId), "scan-truncated" (quá 200 chuỗi),
   * "invalid-envelope-id", "error". Vắng khi quét chạy đủ.
   */
  fragmentsSkipped?: string;
}

/**
 * Đợt 65 S9 — quét mọi chuỗi legacy trong kho để tìm mảnh phân mảnh
 * của project đang mở (chuỗi `file-<hash cũ>-<tên>` từ lần mở trước,
 * chuỗi `proj-` lúc project chưa từng lưu file). Chỉ nhận mảnh CHẮC
 * CHẮN (hash nội dung khớp — xem classifyLegacyFragment); mảnh mơ hồ
 * chỉ ghi nhận, không đụng; chuỗi không có tín hiệu thì bỏ qua lặng
 * lẽ. Giới hạn quét 200 chuỗi để kho bệnh lý không làm treo đường mở
 * file; lỗi liệt kê/migration của một mảnh chỉ ghi nhận mảnh đó là
 * "scan-error", không làm hỏng cả đợt nhận.
 */
async function scanLegacyFragments(
  store: HistoryStore,
  envelopeId: string,
  excludeIds: ReadonlySet<string>,
  fileName: string | undefined,
  spec: VideoSpec,
): Promise<{
  adopted: LegacyFragmentAdoption[];
  ambiguous: LegacyFragmentAmbiguous[];
  skipped?: string;
}> {
  const ids = await store.listProjectIds();
  if (ids === null) {
    return { adopted: [], ambiguous: [], skipped: "store-cannot-enumerate" };
  }
  const adopted: LegacyFragmentAdoption[] = [];
  const ambiguous: LegacyFragmentAmbiguous[] = [];
  let scanned = 0;
  for (const id of ids) {
    if (id === envelopeId || excludeIds.has(id)) continue;
    if (!isLegacyHistoryId(id)) continue;
    if (scanned >= 200) {
      return { adopted, ambiguous, skipped: "scan-truncated" };
    }
    scanned++;
    let versions: ProjectVersion[];
    try {
      versions = await store.listVersions(id);
    } catch {
      ambiguous.push(ambiguousFragmentEntry(id, "scan-error", []));
      continue;
    }
    const c = classifyLegacyFragment(id, fileName, buildAdoptionEvidence(spec, versions));
    if (c.verdict === "certain") {
      try {
        const { moved } = await store.migrateVersions(id, envelopeId);
        adopted.push({ from: id, moved });
      } catch {
        ambiguous.push(ambiguousFragmentEntry(id, "scan-error", versions));
      }
    } else if (c.verdict === "ambiguous") {
      ambiguous.push(ambiguousFragmentEntry(id, c.reason, versions));
    }
    // unrelated → bỏ qua lặng lẽ (không có tín hiệu quy kết).
  }
  return { adopted, ambiguous };
}

/**
 * Nhận chuỗi lịch sử legacy (khóa theo tên file) về projectId envelope.
 * Gọi lúc mở file (openProjectFileFlow, có tên file + spec để quy kết).
 * Từ đợt 65 S9: chỉ nhận khi có bằng chứng nội dung (hash spec đang mở
 * khớp hash nhúng trong id hoặc hash một version trong chuỗi — sửa lỗi
 * nhận nhầm 2 file cùng tên); chuỗi rỗng thì dọn con trỏ chết; chuỗi
 * mơ hồ (tên khớp nhưng hash lệch / thiếu spec / spec rỗng) thì TỪ
 * CHỐI và GIỮ khóa để lần mở đúng file sau còn nhận được. Sau khi nhận
 * chuỗi con trỏ, quét thêm mảnh legacy phân mảnh của cùng project.
 * Lỗi giữa chừng (put xong một phần) thì KHÔNG xóa khóa — lần mở sau
 * chạy lại và hội tụ nhờ id version xác định (xem migrateVersions).
 */
export async function adoptLegacyHistoryChain(
  envelopeId: string,
  fileName?: string,
  deps: AdoptLegacyHistoryDeps = defaultAdoptDeps(),
  opts: AdoptLegacyHistoryOpts = {},
): Promise<AdoptLegacyHistoryResult> {
  try {
    if (!isValidEnvelopeProjectId(envelopeId)) {
      return {
        moved: 0, from: null, adopted: false, reason: "invalid-envelope-id",
        fragmentsAdopted: [], fragmentsAmbiguous: [], fragmentsSkipped: "invalid-envelope-id",
      };
    }
    const legacyId = deps.readLegacyId();
    const result: AdoptLegacyHistoryResult = {
      moved: 0,
      from: legacyId,
      adopted: false,
      reason: "no-legacy-id",
      fragmentsAdopted: [],
      fragmentsAmbiguous: [],
      // Đợt 66 T7 — hash spec đang mở để UI so sánh với hash nhúng
      // trong id chuỗi; null khi caller không đưa spec.
      pointerAmbiguous: null,
      openedSpecHash: opts.spec ? specHash(opts.spec) : null,
    };
    if (legacyId && legacyId !== envelopeId) {
      // Liệt kê chuỗi để lấy bằng chứng nội dung (hash từng version)
      // rồi quyết định bằng luật đầy đủ (tên + hash).
      const versions = await deps.store.listVersions(legacyId);
      const decision: AdoptDecision = decideLegacyAdoption(
        legacyId,
        fileName,
        buildAdoptionEvidence(opts.spec, versions),
      );
      if (!decision.adopt) {
        result.reason = decision.reason;
        // Đợt 66 T7 — con trỏ mơ hồ (tên khớp nhưng hash lệch / thiếu
        // spec / spec rỗng) thì ghi kèm bằng chứng để UI nhận thủ công;
        // chuỗi + khóa giữ nguyên như trước.
        if (isAmbiguousAdoptionReason(decision.reason)) {
          result.pointerAmbiguous = ambiguousFragmentEntry(legacyId, decision.reason, versions);
        }
      } else {
        const { moved } = await deps.store.migrateVersions(legacyId, envelopeId);
        deps.clearLegacyId();
        result.moved = moved;
        result.adopted = true;
        result.reason = decision.reason;
      }
    } else if (legacyId === envelopeId) {
      result.reason = "already-envelope-id";
    }
    // Quét mảnh phân mảnh — chỉ khi có spec đang mở làm bằng chứng.
    if (!opts.spec) {
      result.fragmentsSkipped = "no-spec";
    } else {
      const scan = await scanLegacyFragments(
        deps.store,
        envelopeId,
        new Set(legacyId ? [legacyId] : []),
        fileName,
        opts.spec,
      );
      result.fragmentsAdopted = scan.adopted;
      result.fragmentsAmbiguous = scan.ambiguous;
      if (scan.skipped) result.fragmentsSkipped = scan.skipped;
    }
    return result;
  } catch (e) {
    return {
      moved: 0,
      from: null,
      adopted: false,
      reason: "error",
      error: (e as Error).message,
      fragmentsAdopted: [],
      fragmentsAmbiguous: [],
      fragmentsSkipped: "error",
    };
  }
}

/** Kết quả nhận thủ công một chuỗi legacy mơ hồ (đợt 66 T7). */
export interface ManualAdoptResult {
  /** Số version đã chuyển về id envelope (0 khi chuỗi nguồn rỗng). */
  moved: number;
  /**
   * Lý do: "manual-adopted" (đã nhận, moved > 0),
   * "manual-adopted-empty" (chuỗi nguồn rỗng — chỉ dọn con trỏ nếu có),
   * "invalid-envelope-id" / "not-legacy" / "same-as-envelope" (từ chối),
   * "error" (lỗi kho — xem `error`).
   */
  reason: string;
  /** Thông báo lỗi khi reason === "error". */
  error?: string;
}

/**
 * Đợt 66 T7 — NHẬN THỦ CÔNG một chuỗi legacy mơ hồ.
 *
 * Người dùng đã xem bằng chứng trong UI (LegacyHistoryAdoptModal: tên,
 * hash nhúng trong id, hash spec đang mở, số version, mốc đầu/cuối) và
 * quyết định nhận — quyết định của NGƯỜI DÙNG thay cho luật hash tự
 * động: hàm này KHÔNG kiểm tra lại hash/tên, chỉ kiểm tra id hợp lệ rồi
 * migrate. Chuỗi con trỏ được nhận thủ công thì khóa legacy cũng bị
 * dọn để lần mở sau khỏi hỏi lại. Lỗi kho → reason "error", không throw
 * (UI hiện toast lỗi, mục ở lại hàng đợi để thử lại).
 *
 * Giới hạn trung thực: nhận thủ công là quyết định không hoàn tác được
 * bằng một nút bấm — version đã chuyển sang chuỗi envelope (nội dung
 * version giữ nguyên, chỉ đổi khóa); muốn tách lại phải xóa tay từng
 * version trong HistoryPanel. UI phải hiện đủ bằng chứng trước khi user
 * bấm Nhận (xem LIMITS đợt 66 T7 §2).
 */
export async function adoptLegacyFragmentManually(
  envelopeId: string,
  fragmentId: string,
  deps: AdoptLegacyHistoryDeps = defaultAdoptDeps(),
): Promise<ManualAdoptResult> {
  try {
    if (!isValidEnvelopeProjectId(envelopeId)) {
      return { moved: 0, reason: "invalid-envelope-id" };
    }
    if (fragmentId === envelopeId) {
      return { moved: 0, reason: "same-as-envelope" };
    }
    if (!isLegacyHistoryId(fragmentId)) {
      return { moved: 0, reason: "not-legacy" };
    }
    const { moved } = await deps.store.migrateVersions(fragmentId, envelopeId);
    // Chuỗi con trỏ vừa được nhận thủ công → dọn khóa để lần mở sau
    // khỏi hỏi lại (y hệt đường tự nhận trong adoptLegacyHistoryChain).
    if (deps.readLegacyId() === fragmentId) deps.clearLegacyId();
    return { moved, reason: moved > 0 ? "manual-adopted" : "manual-adopted-empty" };
  } catch (e) {
    return { moved: 0, reason: "error", error: (e as Error).message };
  }
}

/** Singleton cho UI trình duyệt (lazy để không chạm IndexedDB khi test Node).
 * Đợt 57 N8: nhận lookup i18n tùy chọn; HistoryPanel truyền `t()` để lỗi
 * mở DB / import hiển thị theo locale hiện tại (toast history.*). */
let singleton: HistoryStore | null = null;
export function getHistoryStore(lookup?: I18nLookup): HistoryStore {
  if (!singleton) {
    const g = globalThis as unknown as { indexedDB?: unknown };
    singleton = new HistoryStore(
      g.indexedDB ? new IndexedDBBackend(lookup) : new MemoryBackend(),
      lookup,
    );
  } else if (lookup) {
    singleton.setLookup(lookup);
  }
  return singleton;
}
