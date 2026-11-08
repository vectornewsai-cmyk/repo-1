/**
 * idbCleanup61R9.ts — Dọn kho IndexedDB có UI + duy trì refCount thật
 * (Phase 9 đợt 61, luồng R9 — đóng nợ đợt 60 §5.9 = LIMITS 60 Q7 §5.1 + §5.5).
 *
 * Bối cảnh: bytes mồ côi từ TRƯỚC đợt 60 vẫn ở lại kho (chỉ media bị xóa
 * khỏi bin TỪ đợt 60 mới được dọn bytes), và `refCount` của AssetStore
 * chưa từng được duy trì nên lưới `remove()` từ chối khi `refCount > 0`
 * không có tác dụng thực tế.
 *
 * (a) UI DỌN KHO — liệt kê + cho user chọn xóa, KHÔNG tự xóa:
 *  - `scanStorageForCleanup` liệt kê MỌI manifest trong kho kèm dung
 *    lượng từng mục + trạng thái tham chiếu trong project HIỆN TẠI
 *    (bin item / clip theo tên / clip qua src `asset:`). Mục nào còn
 *    được project hiện tại tham chiếu thì `inUse = true` và UI khóa
 *    không cho chọn.
 *  - Mục `inUse = false` chỉ là "có thể mồ côi": kho là TOÀN CỤC theo
 *    trình duyệt, một file .vcut KHÁC có thể còn tham chiếu cùng bytes
 *    mà app không có sổ nào ghi lại (quyết định sweep-theo-project-hiện-
 *    tại-là-không-an-toàn của Q7 §1.1 vẫn giữ nguyên). UI phải cảnh báo
 *    rõ điều này và chỉ xóa khi user chọn từng mục + xác nhận — không
 *    xóa mù, không sweep tự động.
 *  - `deleteCleanupAsset(s)` đọc tươi refCount trước khi xóa và từ chối
 *    khi còn tham chiếu; `AssetStore.remove` tự nó cũng từ chối khi
 *    refCount > 0 nên có hai lưới.
 *
 * (b) REFCOUNT THẬT — `syncAssetRefCounts` tái tính refCount từ trạng
 *  thái hiện tại (spec + bin) rồi ghi đè lên manifest:
 *  - +1 cho mỗi bin item mang assetId (bin giữ một tham chiếu — khớp
 *    chặn dedup "giữ bytes cho item kia" của Q7).
 *  - +1 cho mỗi clip có src `asset:<id>` (đếm theo CLIP, kể cả trùng
 *    src — cùng luật đếm của Q7).
 *  - +1 cho mỗi clip có src tên thô khớp originalName hoặc alias của
 *    manifest (cách app tham chiếu media trong phiên hiện tại; khớp
 *    luật findMissingAssets). Một tên khớp NHIỀU manifest (hai file
 *    khác nội dung, trùng tên) thì đếm cho CẢ HAI — đếm thừa thì chỉ
 *    chặn xóa nhầm, không bao giờ xóa nhầm (an toàn theo hướng chặn).
 *  - Không bao giờ âm (clamp ≥ 0 ở `AssetStore.setRefCount`).
 *  - Đồng bộ là tái tính toàn bộ (reconcile), không tăng/giảm từng
 *    bước: mọi đường đổi spec/bin (thêm/xóa clip, undo/redo, mở file,
 *    load sample, relink) đều được phủ mà không cần móc vào từng
 *    action của store. Điểm gọi: effect debounce ở App.tsx (mọi thay
 *    đổi spec/media), `importFiles` (sau khi assetId đã ghi lên item),
 *    `removeMediaFromBin` (trước khi quyết xóa bytes), và đầu mỗi lần
 *    scan ở UI dọn kho.
 *
 * Module này cố tình KHÔNG import value từ file anh em (quy ước
 * binOrphan60Q7.ts: chạy được bằng `node --experimental-strip-types`):
 * quét src trong spec tự viết lại ở đây (cùng quy ước nested canonical
 * + chống vòng lặp của relink.ts / rehydrate36S5.ts / binOrphan60Q7.ts).
 *
 * Đợt 62 R7 — đóng nợ 61 R9 §5.1 + §5.2 + §5.8:
 * - Sổ tham chiếu liên project (`ProjectRefRecordLike`, store
 *   `projectRefs` trong AssetStore): `recordCurrentProjectRefs` ghi
 *   tập asset của project hiện tại khi lưu/mở; `scanStorageForCleanup`
 *   + `deleteCleanupAsset(s)` nhận `opts.registry` để chặn xóa bytes
 *   mà project KHÁC còn ghi nhận dùng (`cross-project`), đọc sổ lỗi
 *   thì chặn luôn (`registry-unavailable`, fail-closed).
 * - `syncAssetRefCounts` nhận `opts.locks` (`navigator.locks`): toàn
 *   bộ lần sync (đọc → tính → ghi) chạy dưới lock liên tab
 *   `vcut-refcount-sync`.
 * - Tên thô trùng nhau vẫn đếm thừa (cố ý, an toàn theo hướng chặn) —
 *   không đổi (xem LIMITS R7 §1.4).
 */

/** Hình dạng tối thiểu của spec mà quyết định này cần. */
export interface CleanupSpecLike {
  tracks?: Array<{ clips?: unknown[] }>;
}

/** Hình dạng tối thiểu của một item trong media bin. */
export interface CleanupBinItemLike {
  id: string;
  name: string;
  assetId?: string;
}

/** Hình dạng tối thiểu của một manifest mà quét/dọn cần. */
export interface CleanupManifestLike {
  assetId: string;
  originalName: string;
  aliases?: string[];
  size: number;
  mimeType: string;
  kind: string;
  refCount: number;
}

/** Mặt tối thiểu của kho bytes mà đồng bộ/quét/xóa cần (AssetStore khớp). */
export interface CleanupStoreLike {
  list(): Promise<CleanupManifestLike[]>;
  get(assetId: string): Promise<CleanupManifestLike | null>;
  setRefCount(assetId: string, n: number): Promise<CleanupManifestLike | null>;
  remove(assetId: string, opts?: { force?: boolean }): Promise<boolean>;
}

/**
 * Đợt 62 R7 — mặt tối thiểu của Web Locks API mà sync refCount cần
 * (cùng hình dạng LockManagerLike của assetStore.ts, định nghĩa lại ở
 * đây để module này vẫn tự chứa, không import value từ file anh em).
 * Trình duyệt thật truyền `navigator.locks`; test truyền fake chia sẻ
 * giữa hai instance để mô phỏng hai tab.
 */
export interface CleanupLockManagerLike {
  request<T>(name: string, callback: () => Promise<T> | T): Promise<T>;
}

/**
 * Đợt 62 R7 — một bản ghi sổ tham chiếu liên project (khớp
 * ProjectRefRecord của assetStore.ts về mặt cấu trúc).
 * Đợt 63 R7 — thêm `projectId` (vắng ở bản ghi legacy khóa theo tên)
 * và `generation` (bản ghi legacy thiếu field → coi là 0, xem
 * recordCurrentProjectRefs).
 */
export interface ProjectRefRecordLike {
  projectKey: string;
  projectName: string;
  projectId?: string;
  assetIds: string[];
  generation: number;
  updatedAt: string;
}

/** Mặt đọc của sổ tham chiếu (scan/delete chỉ cần đọc). */
export interface ProjectRefsReaderLike {
  listProjectRefs(): Promise<ProjectRefRecordLike[]>;
}

/** Mặt ghi của sổ tham chiếu (recordCurrentProjectRefs cần thêm ghi). */
export interface ProjectRefsStoreLike extends ProjectRefsReaderLike {
  recordProjectRefs(
    projectKey: string,
    projectName: string,
    assetIds: string[],
    opts?: { projectId?: string; expectedGeneration?: number },
  ): Promise<{ record: ProjectRefRecordLike; changed: boolean; stale: boolean }>;
}

/** Độ sâu đệ quy tối đa khi quét nested (khớp relink.ts / binOrphan60Q7.ts). */
export const MAX_CLEANUP_SCAN_DEPTH = 64;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Bộ đi chung: thăm MỖI clip media (kể cả trùng src, kể cả trong nested)
 * đúng một lần theo nhánh; `visit` nhận src thô của clip.
 * (Cùng quy ước nested canonical + chống vòng lặp của binOrphan60Q7.ts.)
 */
function scanClipSrcs(spec: CleanupSpecLike, visit: (src: string) => void): void {
  const scanTracks = (tracks: unknown, depth: number, ancestors: Set<object>): void => {
    if (!Array.isArray(tracks) || depth > MAX_CLEANUP_SCAN_DEPTH) return;
    for (const t of tracks) {
      if (!isRecord(t) || !Array.isArray(t["clips"])) continue;
      for (const c of t["clips"]) {
        if (!isRecord(c)) continue;
        const kind = c["kind"];
        if (
          (kind === "video" || kind === "audio" || kind === "image" || kind === "sticker") &&
          typeof c["src"] === "string" &&
          c["src"].length > 0
        ) {
          visit(c["src"]);
        }
        if (kind !== "nested") continue;
        const sub = c["subSpec"];
        let subTracks: unknown = null;
        let subObj: object | null = null;
        if (isRecord(sub) && Array.isArray(sub["tracks"])) {
          subTracks = sub["tracks"];
          subObj = sub;
        } else if (Array.isArray(c["tracks"])) {
          subTracks = c["tracks"];
        }
        if (subTracks === null) continue;
        if (subObj !== null && ancestors.has(subObj)) continue;
        const next = new Set(ancestors);
        if (subObj !== null) next.add(subObj);
        scanTracks(subTracks, depth + 1, next);
      }
    }
  };
  scanTracks(spec.tracks, 0, new Set());
}

/** Số tham chiếu của một asset: tổng + tách theo nguồn (bin item / clip). */
export interface AssetRefCount {
  /** Tổng số tham chiếu (bin item + clip). */
  total: number;
  /** Số bin item mang assetId này. */
  binItems: number;
  /** Số clip tham chiếu (qua src `asset:` hoặc tên thô khớp manifest). */
  clips: number;
}

function emptyRefCount(): AssetRefCount {
  return { total: 0, binItems: 0, clips: 0 };
}

function bump(counts: Map<string, AssetRefCount>, assetId: string, field: "binItems" | "clips"): void {
  let c = counts.get(assetId);
  if (!c) {
    c = emptyRefCount();
    counts.set(assetId, c);
  }
  c[field] += 1;
  c.total += 1;
}

/**
 * Tái tính số tham chiếu cho MỌI assetId xuất hiện trong spec/bin.
 * Thuần, không chạm IndexedDB — test được bằng Node không cần trình duyệt.
 *
 * Nguồn đếm (xem đầu file): bin item mang assetId (+1/item); clip có
 * src `asset:<id>` (+1/clip, kể cả trùng src); clip có src tên thô khớp
 * originalName/alias của manifest (+1/clip cho MỖI manifest khớp tên —
 * đếm thừa an toàn, xem đầu file).
 */
export function computeRefCounts(
  spec: CleanupSpecLike,
  media: ReadonlyArray<CleanupBinItemLike>,
  manifests: ReadonlyArray<CleanupManifestLike>,
): Map<string, AssetRefCount> {
  const counts = new Map<string, AssetRefCount>();
  for (const item of media) {
    if (typeof item.assetId === "string" && item.assetId.length > 0) {
      bump(counts, item.assetId, "binItems");
    }
  }
  // Tên thô → các assetId mang tên đó (originalName + alias). Một tên
  // có thể thuộc nhiều manifest (khác nội dung, trùng tên).
  const byName = new Map<string, string[]>();
  for (const m of manifests) {
    const names = [m.originalName, ...(m.aliases ?? [])];
    for (const n of names) {
      if (typeof n !== "string" || n.length === 0) continue;
      const list = byName.get(n);
      if (list) {
        if (!list.includes(m.assetId)) list.push(m.assetId);
      } else {
        byName.set(n, [m.assetId]);
      }
    }
  }
  scanClipSrcs(spec, (src) => {
    if (src.startsWith("asset:")) {
      const id = src.slice("asset:".length);
      if (id.length > 0) bump(counts, id, "clips");
      return;
    }
    const ids = byName.get(src);
    if (!ids) return;
    for (const id of ids) bump(counts, id, "clips");
  });
  return counts;
}

/** Báo cáo của một lần đồng bộ refCount. */
export interface SyncRefCountsReport {
  /** Số manifest đã quét. */
  scanned: number;
  /** Số manifest có refCount đã đổi (đã ghi). */
  updated: number;
  /** Số lần ghi refCount lỗi (best-effort: ghi tiếp các mục còn lại). */
  errors: number;
}

/**
 * Đồng bộ refCount thật vào kho: tái tính từ spec + bin hiện tại rồi ghi
 * đè lên manifest (chỉ ghi khi giá trị đổi). Best-effort: không bao giờ
 * throw — lỗi kho (IDB bị chặn) chỉ trả về errors > 0 để caller quyết
 * (UI quét báo lỗi, đường nền bỏ qua lặng lẽ).
 *
 * Đợt 62 R7 (nợ 61 R9 §5.2 — refCount chỉ đúng trong một tab): khi
 * caller truyền `opts.locks` (trình duyệt thật: `navigator.locks`),
 * TOÀN BỘ lần sync (đọc manifest → tái tính → ghi) chạy dưới lock liên
 * tab `vcut-refcount-sync` nên hai tab cùng origin không xen kẽ nhau:
 * lượt sync sau đọc lại manifest TƯƠI sau khi lượt trước ghi xong
 * (đọc ngoài lock sẽ dùng snapshot cũ và bỏ qua ghi cần thiết — lỗi
 * bắt được bằng test D1). Lock tự giải phóng khi tab giữ nó đóng/
 * crash. Không truyền locks (hoặc locks.request throw) thì chạy
 * không khóa như trước — giới hạn một tab vẫn đúng và được ghi rõ ở
 * LIMITS. Lock KHÔNG làm sync thành nguyên tử với lần đổi spec của
 * tab khác: tab khác đổi spec rồi sync sau vẫn thắng (last-writer-
 * wins theo lượt sync) — lock chỉ chặn xen kẽ giữa chừng, không chặn
 * stale. Xem LIMITS R7 §3.
 */
export async function syncAssetRefCounts(
  store: CleanupStoreLike,
  spec: CleanupSpecLike,
  media: ReadonlyArray<CleanupBinItemLike>,
  opts?: { locks?: CleanupLockManagerLike | null },
): Promise<SyncRefCountsReport> {
  // Đợt 62 R7 — toàn bộ lần sync (đọc → tái tính → ghi) nằm trong `run`
  // để lock bao được cả pha đọc: lượt sync sau đọc lại manifest TƯƠI
  // sau khi lượt trước ghi xong. Đọc ngoài lock sẽ dùng snapshot cũ
  // và bỏ qua ghi cần thiết (lỗi bắt được bằng test D1).
  const run = async (): Promise<SyncRefCountsReport> => {
    let manifests: CleanupManifestLike[];
    try {
      manifests = await store.list();
    } catch {
      return { scanned: 0, updated: 0, errors: 1 };
    }
    const counts = computeRefCounts(spec, media, manifests);
    let updated = 0;
    let errors = 0;
    for (const m of manifests) {
      const want = counts.get(m.assetId)?.total ?? 0;
      if (m.refCount === want) continue;
      try {
        const next = await store.setRefCount(m.assetId, want);
        if (next) updated += 1;
        else errors += 1;
      } catch {
        errors += 1;
      }
    }
    return { scanned: manifests.length, updated, errors };
  };
  const locks = opts?.locks ?? null;
  if (!locks) return run();
  try {
    return await locks.request("vcut-refcount-sync", run);
  } catch {
    // Lock lỗi (trình duyệt lạ / bị abort) → chạy không khóa thay vì
    // mất lần sync (cùng fallback với withAliasLock của AssetStore).
    return run();
  }
}

/**
 * Đợt 62 R7 — tập assetId mà project hiện tại đang dùng (bin item +
 * clip, kể cả tên thô khớp manifest). Thuần: lấy khóa của
 * computeRefCounts có tổng > 0. Dùng cho sổ tham chiếu liên project
 * (ghi khi lưu/mở project) — cùng luật đếm với refCount nên sổ và
 * refCount không lệch nhau về tập asset (đếm thừa tên thô trùng nhau
 * vẫn đếm thừa ở cả hai, an toàn theo hướng chặn).
 */
export function collectProjectAssetIds(
  spec: CleanupSpecLike,
  media: ReadonlyArray<CleanupBinItemLike>,
  manifests: ReadonlyArray<CleanupManifestLike>,
): string[] {
  const counts = computeRefCounts(spec, media, manifests);
  const out: string[] = [];
  for (const [id, c] of counts) {
    if (c.total > 0) out.push(id);
  }
  return out.sort();
}

/** Một dòng trong bảng dọn kho. */
export interface CleanupRow {
  assetId: string;
  name: string;
  size: number;
  mimeType: string;
  kind: string;
  /** refCount tươi sau khi đồng bộ ở đầu lần quét. */
  refCount: number;
  /** Số bin item đang giữ asset này. */
  binItems: number;
  /** Số clip đang tham chiếu asset này. */
  clips: number;
  /** true = còn được project hiện tại tham chiếu → UI khóa, không cho chọn xóa. */
  inUse: boolean;
  /**
   * Đợt 62 R7 — tên hiển thị của các project KHÁC (không phải project
   * hiện tại) còn ghi nhận dùng asset này trong sổ tham chiếu liên
   * project. Rỗng = không project khác nào ghi nhận. Khi mảng này
   * khác rỗng thì `inUse` cũng true (UI khóa, không cho chọn xóa) dù
   * refCount của project hiện tại = 0.
   */
  usedByOther: string[];
}

/** Kết quả một lần quét kho cho UI dọn kho. */
export interface CleanupScan {
  rows: CleanupRow[];
  totalAssets: number;
  totalBytes: number;
  orphanCount: number;
  orphanBytes: number;
  /** Báo cáo đồng bộ refCount đã chạy ở đầu lần quét. */
  synced: SyncRefCountsReport;
  /**
   * Đợt 62 R7 — mọi bản ghi sổ tham chiếu (để panel liệt kê mục
   * "project đã ghi" + nút Quên). Rỗng khi không truyền registry.
   */
  registryProjects: ProjectRefRecordLike[];
  /**
   * Đợt 62 R7 — true khi đọc sổ tham chiếu lỗi: các hàng lúc đó chỉ
   * phản ánh project hiện tại (fail-open ở HIỂN THỊ), nhưng đường xóa
   * vẫn chặn (fail-closed, xem deleteCleanupAsset) — user thấy mục mồ
   * côi nhưng bấm xóa sẽ bị bỏ qua kèm lý do.
   */
  registryError: boolean;
}

/** Tùy chọn cho quét/xóa có sổ tham chiếu (đợt 62 R7). */
export interface CleanupRegistryOpts {
  /** Sổ tham chiếu liên project (AssetStore khớp). Vắng = hành vi cũ (chỉ project hiện tại). */
  registry?: ProjectRefsReaderLike;
  /**
   * Khóa của project hiện tại (vd `name:Dự án mới`, xem
   * projectKeyForName). Bản ghi của chính khóa này được LOẠI khỏi
   * `usedByOther` — project hiện tại được bảo vệ bằng refCount tươi,
   * không bằng bản ghi cũ của chính nó (bản ghi đó có thể lỗi thời).
   * Vắng = mọi bản ghi đều tính là "project khác".
   */
  currentProjectKey?: string;
}

/**
 * Đợt 62 R7 — ghi tập asset của project hiện tại vào sổ tham chiếu.
 * Tính từ spec + bin hiện tại (cùng luật đếm với refCount), ghi đè
 * bản ghi của khóa này. Best-effort, không bao giờ throw: lỗi kho
 * chỉ trả `recorded: false` để caller bỏ qua lặng lẽ (App effect /
 * saveCurrentProject). `changed` cho caller biết có cần broadcast
 * cho tab khác quét lại không.
 */
export interface RecordCurrentProjectRefsReport {
  projectKey: string;
  projectName: string;
  /** Số asset đã ghi vào sổ. */
  assetCount: number;
  /** true khi tập asset hoặc tên khác lần ghi trước. */
  changed: boolean;
  /** false khi ghi lỗi / không ghi được (IDB bị chặn...). */
  recorded: boolean;
  /**
   * Đợt 63 R7 — true khi lần sync này BỊ TỪ CHỐI vì stale: một lượt
   * sync khác đã ghi bản ghi mới hơn (generation cao hơn) trong lúc
   * lần này tính tập asset → bản ghi giữ nguyên dữ liệu mới, caller
   * KHÔNG broadcast; lần sync sau (khi spec/media đổi) sẽ đọc
   * generation tươi và ghi lại. `recorded` vẫn true vì sổ đang giữ
   * một bản ghi hợp lệ cho project này (do lượt thắng ghi).
   */
  stale: boolean;
}

export async function recordCurrentProjectRefs(
  store: CleanupStoreLike & ProjectRefsStoreLike,
  spec: CleanupSpecLike,
  media: ReadonlyArray<CleanupBinItemLike>,
  projectKey: string,
  projectName: string,
  /**
   * Đợt 63 R7 — projectId ổn định để persist vào bản ghi (khóa sổ đã
   * là `id:<uuid>`). Không truyền → hành vi cũ (ghi theo khóa đã cho,
   * không persist id).
   */
  projectId?: string,
): Promise<RecordCurrentProjectRefsReport> {
  const fail: RecordCurrentProjectRefsReport = {
    projectKey,
    projectName,
    assetCount: 0,
    changed: false,
    recorded: false,
    stale: false,
  };
  try {
    const manifests = await store.list();
    const assetIds = collectProjectAssetIds(spec, media, manifests);
    // Đợt 63 R7 — đọc bản ghi của chính khóa này TRƯỚC khi ghi để lấy
    // generation hiện tại làm expectedGeneration (optimistic
    // concurrency, xem recordProjectRefs): hai lượt sync chồng nhau
    // cùng đọc gen N thì lượt vào lock sau sẽ bị từ chối stale thay
    // vì ghi đè dữ liệu mới của lượt trước. Đọc này nằm NGOÀI lock
    // nhưng vẫn đúng: kiểm tra thật diễn ra trong lock lúc ghi.
    // Bản ghi legacy thiếu generation → coi là 0.
    let ownGeneration: number | undefined;
    let ownExists = false;
    try {
      const existing = await store.listProjectRefs();
      const own = existing.find((r) => r.projectKey === projectKey);
      if (own) {
        ownExists = true;
        ownGeneration = own.generation ?? 0;
      }
    } catch {
      // Đọc sổ lỗi → ghi không kèm expectedGeneration (ghi luôn như
      // trước, fail-open ở tầng sync; lưới xóa vẫn fail-closed riêng).
      ownGeneration = undefined;
    }
    // Đợt 62 R7 — project chưa dùng asset nào và chưa có bản ghi thì
    // KHÔNG tạo bản ghi rỗng: lúc App mount, effect chạy lần đầu khi
    // spec vẫn là project mặc định rỗng ("Dự án mới") trước khi mẫu /
    // autosave khôi phục xong — ghi bản ghi rỗng lúc đó chỉ làm nhiễu
    // mục sổ tham chiếu (hàng "0 asset"). Project đã có bản ghi mà
    // dùng hết asset thì vẫn ghi tập rỗng (replace) để gỡ bảo vệ cũ.
    if (assetIds.length === 0) {
      if (!ownExists) {
        return { projectKey, projectName, assetCount: 0, changed: false, recorded: true, stale: false };
      }
    }
    const res = await store.recordProjectRefs(projectKey, projectName, assetIds, {
      projectId,
      expectedGeneration: ownGeneration,
    });
    return {
      projectKey,
      projectName,
      assetCount: res.record.assetIds.length,
      changed: res.changed,
      recorded: true,
      stale: res.stale,
    };
  } catch {
    return fail;
  }
}

/**
 * Quét kho cho UI dọn kho: đồng bộ refCount trước (để số liệu tươi),
 * rồi liệt kê mọi manifest kèm trạng thái tham chiếu trong project HIỆN
 * TẠI. Thứ tự: mục có thể mồ côi trước, rồi theo dung lượng giảm dần
 * (mục nặng nhất lên đầu để user dọn được nhiều nhất).
 *
 * LƯU Ý AN TOÀN (quyết định Q7 §1.1 giữ nguyên): `inUse = false` chỉ có
 * nghĩa là "project hiện tại không tham chiếu" — file .vcut KHÁC vẫn có
 * thể dùng chung bytes này vì kho là toàn cục và không có sổ tham chiếu
 * liên project. UI phải cảnh báo rõ và chỉ xóa theo lựa chọn + xác nhận
 * của user, không bao giờ tự xóa.
 *
 * Đợt 62 R7 — khi caller truyền `opts.registry`: sổ tham chiếu liên
 * project được đọc ở đầu lần quét; asset nào còn được project KHÁC
 * ghi nhận dùng thì `usedByOther` mang tên các project đó và `inUse`
 * thành true (UI khóa). Sổ chỉ biết các project đã mở/lưu trên trình
 * duyệt này — project chưa từng mở ở đây vẫn không được bảo vệ (xem
 * LIMITS R7 §1.3); đọc sổ lỗi thì hàng chỉ phản ánh project hiện tại
 * (`registryError: true`) nhưng đường xóa vẫn chặn (fail-closed).
 */
export async function scanStorageForCleanup(
  store: CleanupStoreLike,
  spec: CleanupSpecLike,
  media: ReadonlyArray<CleanupBinItemLike>,
  opts?: CleanupRegistryOpts,
): Promise<CleanupScan> {
  const synced = await syncAssetRefCounts(store, spec, media);
  let manifests: CleanupManifestLike[];
  try {
    manifests = await store.list();
  } catch {
    return { rows: [], totalAssets: 0, totalBytes: 0, orphanCount: 0, orphanBytes: 0, synced, registryProjects: [], registryError: false };
  }
  // Đợt 62 R7 — đọc sổ tham chiếu (best-effort cho hiển thị).
  let registryProjects: ProjectRefRecordLike[] = [];
  let registryError = false;
  if (opts?.registry) {
    try {
      registryProjects = await opts.registry.listProjectRefs();
    } catch {
      registryError = true;
      registryProjects = [];
    }
  }
  const usedByOther = new Map<string, string[]>();
  if (registryProjects.length > 0) {
    const currentKey = opts?.currentProjectKey;
    for (const rec of registryProjects) {
      if (currentKey !== undefined && rec.projectKey === currentKey) continue;
      for (const id of rec.assetIds) {
        const list = usedByOther.get(id);
        if (list) {
          if (!list.includes(rec.projectName)) list.push(rec.projectName);
        } else {
          usedByOther.set(id, [rec.projectName]);
        }
      }
    }
    for (const list of usedByOther.values()) list.sort();
  }
  const counts = computeRefCounts(spec, media, manifests);
  const rows: CleanupRow[] = manifests.map((m) => {
    const c = counts.get(m.assetId) ?? emptyRefCount();
    // refCount trong manifest sau sync phải khớp tổng tái tính; lấy số
    // tái tính làm nguồn thật cho UI (tránh lệch nếu ghi sync lỗi).
    const other = usedByOther.get(m.assetId) ?? [];
    return {
      assetId: m.assetId,
      name: m.originalName,
      size: m.size,
      mimeType: m.mimeType,
      kind: m.kind,
      refCount: c.total,
      binItems: c.binItems,
      clips: c.clips,
      inUse: c.total > 0 || other.length > 0,
      usedByOther: other,
    };
  });
  rows.sort((a, b) => {
    if (a.inUse !== b.inUse) return a.inUse ? 1 : -1;
    return b.size - a.size;
  });
  const totalBytes = rows.reduce((s, r) => s + r.size, 0);
  const orphans = rows.filter((r) => !r.inUse);
  return {
    rows,
    totalAssets: rows.length,
    totalBytes,
    orphanCount: orphans.length,
    orphanBytes: orphans.reduce((s, r) => s + r.size, 0),
    synced,
    registryProjects,
    registryError,
  };
}

/** Kết quả xóa một asset khỏi kho trong UI dọn kho. */
export type DeleteCleanupResult =
  | { ok: true; freedBytes: number }
  | {
      ok: false;
      reason: "not-found" | "in-use" | "remove-refused" | "cross-project" | "registry-unavailable";
      refCount?: number;
      /** Đợt 62 R7 — tên project khác còn ghi nhận dùng asset (lý do cross-project). */
      usedBy?: string[];
    };

/**
 * Xóa một asset mồ côi khỏi kho (đường UI dọn kho). Đọc tươi manifest
 * trước khi xóa: từ chối khi asset không tồn tại hoặc refCount > 0
 * (còn tham chiếu — kể cả tham chiếu xuất hiện SAU lần quét). Lưới thứ
 * hai: `remove()` tự nó cũng từ chối khi refCount > 0 (trừ force).
 * Không dùng force ở đây — xóa trong UI dọn kho không bao giờ ép.
 *
 * Đợt 62 R7 — lưới thứ ba (khi truyền `opts.registry`): đọc TƯƠI sổ
 * tham chiếu trước khi xóa; asset còn được project KHÁC (khóa khác
 * `opts.currentProjectKey`) ghi nhận dùng thì từ chối
 * `cross-project` (kèm tên project); đọc sổ lỗi thì từ chối
 * `registry-unavailable` (fail-closed: không biết thì không xóa).
 * Không truyền registry → hành vi cũ (chỉ lưới refCount).
 */
export async function deleteCleanupAsset(
  store: CleanupStoreLike,
  assetId: string,
  opts?: CleanupRegistryOpts,
): Promise<DeleteCleanupResult> {
  let m: CleanupManifestLike | null;
  try {
    m = await store.get(assetId);
  } catch {
    return { ok: false, reason: "remove-refused" };
  }
  if (!m) return { ok: false, reason: "not-found" };
  if (m.refCount > 0) return { ok: false, reason: "in-use", refCount: m.refCount };
  if (opts?.registry) {
    let records: ProjectRefRecordLike[];
    try {
      records = await opts.registry.listProjectRefs();
    } catch {
      return { ok: false, reason: "registry-unavailable", refCount: m.refCount };
    }
    const currentKey = opts?.currentProjectKey;
    const usedBy = records
      .filter((r) => (currentKey === undefined || r.projectKey !== currentKey) && r.assetIds.includes(assetId))
      .map((r) => r.projectName);
    if (usedBy.length > 0) {
      return { ok: false, reason: "cross-project", refCount: m.refCount, usedBy: [...new Set(usedBy)].sort() };
    }
  }
  let removed: boolean;
  try {
    removed = await store.remove(assetId);
  } catch {
    return { ok: false, reason: "remove-refused", refCount: m.refCount };
  }
  if (!removed) return { ok: false, reason: "remove-refused", refCount: m.refCount };
  return { ok: true, freedBytes: m.size };
}

/** Kết quả xóa nhiều asset đã chọn trong UI dọn kho. */
export interface DeleteCleanupBatchResult {
  deleted: string[];
  freedBytes: number;
  skipped: Array<{ assetId: string; reason: string }>;
}

/** Xóa tuần tự từng asset đã chọn; mục nào bị từ chối thì ghi vào skipped, không dừng batch. */
export async function deleteCleanupAssets(
  store: CleanupStoreLike,
  assetIds: ReadonlyArray<string>,
  opts?: CleanupRegistryOpts,
): Promise<DeleteCleanupBatchResult> {
  const deleted: string[] = [];
  const skipped: Array<{ assetId: string; reason: string }> = [];
  let freedBytes = 0;
  for (const id of assetIds) {
    const r = await deleteCleanupAsset(store, id, opts);
    if (r.ok) {
      deleted.push(id);
      freedBytes += r.freedBytes;
    } else {
      skipped.push({ assetId: id, reason: r.reason });
    }
  }
  return { deleted, freedBytes, skipped };
}
