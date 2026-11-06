/**
 * rehydrate36S5.ts — Nạp lại media bin từ AssetStore sau reload trang
 * (Phase 9 đợt 36, luồng S5 — đóng nợ §3.5 của docs/PHASE9_ROUND35_LIMITS.md).
 *
 * Vấn đề (đo ở đợt 35 R6): bytes `asset:` đã bền trong IndexedDB nhưng
 * App không có code khởi động nào nạp lại media bin, nên sau reload mọi
 * clip media đều hiện panel Relink — kể cả media mẫu (`mau-1.webm`,
 * `mau-2.webm`) vốn chỉ sống trong phiên qua blob URL.
 *
 * Hướng đã chọn (ghi rõ trong docs/PHASE9_ROUND36_S5_REHYDRATE_LIMITS.md):
 * AssetStore persistence — KHÔNG tái sinh mẫu. `buildSampleProject`
 * ingest blob mẫu vào AssetStore lúc tạo mẫu; bước này nạp lại media bin
 * từ AssetStore lúc khởi động, TRƯỚC khi `checkMissingMedia()` chạy.
 * Spec giữ nguyên dạng src cũ (tên thô `mau-1.webm`, `asset:<id>`), nên
 * autosave/file cũ vẫn mở được — không đổi format spec.
 *
 * Module này cố tình KHÔNG chạm IndexedDB hay DOM trực tiếp: caller
 * (App.tsx) truyền deps đã nối sẵn với AssetStore thật; unit test truyền
 * fake deps thuần. Nhờ đó logic quyết định (plan) test được bằng Node
 * mà không cần trình duyệt.
 */
import type { AssetManifest } from "./assetStore";
import type { MediaItem, MediaKind } from "../media";

// Lưu ý (theo quy ước của captionFollow.ts): module này phải chạy được
// bằng `node --experimental-strip-types` nên KHÔNG import value từ file
// anh em (Node ESM từ chối import không có đuôi `.ts`, còn tsc của app
// thì cấm đuôi `.ts` khi allowImportingTsExtensions tắt). Hai helper
// `asset:` dưới đây là bản sao 3 dòng của assetStore.ts
// (assetSrcFor/isAssetSrc/assetIdFromSrc) — tiền tố `asset:` là hằng số
// ổn định của kiến trúc, và test của module này khóa đúng hành vi đó;
// nếu assetStore đổi tiền tố thì test plan asset: sẽ fail và báo ngay.
const ASSET_SRC_PREFIX = "asset:";

function isAssetSrc(src: string): boolean {
  return typeof src === "string" && src.startsWith(ASSET_SRC_PREFIX);
}

function assetIdFromSrc(src: string): string | null {
  if (!isAssetSrc(src)) return null;
  const id = src.slice(ASSET_SRC_PREFIX.length);
  return id.length > 0 ? id : null;
}

/** Hình dạng tối thiểu của spec mà module này cần (tương thích cấu trúc). */
export interface RehydrateSpecLike {
  tracks?: Array<{
    clips?: unknown[];
  }>;
}

/** Độ sâu đệ quy tối đa khi quét nested (khớp relink.ts). */
export const MAX_REHYDRATE_DEPTH = 64;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Thu thập mọi `src` media distinct trong spec, kể cả lá trong subSpec
 * của nested clip (canonical: `subSpec.tracks`, legacy: `tracks` trực
 * tiếp trên clip nested — cùng quy ước của relink.ts). Clip text và
 * clip nested tự thân (không có src) không được thu. Chống vòng lặp
 * theo nhánh (subSpec dùng chung ở hai clip anh em vẫn quét đủ cả hai).
 */
export function collectMediaSrcs(spec: RehydrateSpecLike): string[] {
  const out: string[] = [];
  const seenSrc = new Set<string>();
  const push = (src: unknown): void => {
    if (typeof src === "string" && src.length > 0 && !seenSrc.has(src)) {
      seenSrc.add(src);
      out.push(src);
    }
  };
  const scanTracks = (
    tracks: unknown,
    depth: number,
    ancestors: Set<object>,
  ): void => {
    if (!Array.isArray(tracks) || depth > MAX_REHYDRATE_DEPTH) return;
    for (const t of tracks) {
      if (!isRecord(t) || !Array.isArray(t["clips"])) continue;
      for (const c of t["clips"]) {
        if (!isRecord(c)) continue;
        const kind = c["kind"];
        if (
          (kind === "video" || kind === "audio" || kind === "image" || kind === "sticker") &&
          typeof c["src"] === "string"
        ) {
          push(c["src"]);
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
  return out;
}

/** Một src đã khớp được với manifest trong AssetStore. */
export interface RehydrateCandidate {
  src: string;
  assetId: string;
  manifest: AssetManifest;
  /**
   * `asset` = src `asset:<id>`; `bare-name` = tên thô khớp originalName;
   * `alias` (đợt 38 U3) = tên thô khớp `manifest.aliases` — cùng bytes
   * từng import/relink dưới tên khác, không cần đổi src clip.
   */
  via: "asset" | "bare-name" | "alias";
}

/** Một src không nạp lại được, kèm lý do để App/test đối chiếu. */
export interface RehydrateSkipped {
  src: string;
  reason: string;
}

export interface RehydratePlan {
  candidates: RehydrateCandidate[];
  skipped: RehydrateSkipped[];
}

/**
 * Quyết định thuần: src nào nạp lại được từ danh sách manifest.
 *
 * - `asset:<id>` → khớp theo assetId. Không có manifest → skipped
 *   (bytes đã bị xoá khỏi IndexedDB, hoặc project mở ở máy khác).
 * - Tên thô (không chứa `://`, không bắt đầu bằng `/`) → khớp theo
 *   `originalName`, rồi tới `aliases` (đợt 38 U3, via "alias": cùng bytes
 *   khác tên). Nhiều manifest cùng tên (vd: tạo mẫu nhiều lần,
 *   mỗi lần MediaRecorder ghi bytes khác nhau) → lấy bản mới nhất theo
 *   `ingestedAt` (so sánh chuỗi ISO; bằng nhau thì bản sau trong list
 *   thắng). Đây là điểm yếu đã ghi rõ trong LIMITS: hai file user khác
 *   nhau cùng tên mà cùng được ingest thì bản mới thắng — chấp nhận
 *   được ở đợt này vì đường import chưa ingest (trong thực tế hôm nay
 *   chỉ có manifest mẫu), và hướng sửa triệt để là chuyển src sang
 *   `asset:` khi import-ingest lên sau (xem LIMITS §5).
 * - `blob:` → skipped (URL phiên cũ đã chết, không có bytes đâu để nạp).
 * - `http(s):` / `data:` → skipped có chủ đích: rehydrate không tạo
 *   MediaItem cho hai dạng này. Lưu ý trung thực: skipped ở đây CHỈ
 *   nghĩa là "rehydrate không tạo MediaItem", không nghĩa là "clip
 *   không thiếu" — luật riêng của relink.ts (`isMissing`: mọi src không
 *   có trong mediaNames đều thiếu) vẫn có thể liệt kê chúng; đó là
 *   hành vi có sẵn, không thuộc phạm vi đợt này.
 * - Dạng khác (chuỗi rỗng đã bị collect loại, đường dẫn `/...`) → skipped.
 */
export function planRehydrate(srcs: string[], manifests: AssetManifest[]): RehydratePlan {
  const byId = new Map<string, AssetManifest>();
  const byName = new Map<string, AssetManifest[]>();
  // Đợt 38 U3: map alias → manifest. Alias chỉ có hiệu lực khi nó KHÔNG
  // phải originalName của bất kỳ manifest nào (tên thật luôn thắng, tránh
  // một alias che mất asset khác cùng tên); alias sau trong list thắng
  // khi hai asset cùng khai một alias (trường hợp này addAlias đã chặn
  // ở phía ghi, đây chỉ là lưới an toàn phía đọc).
  const byAlias = new Map<string, AssetManifest>();
  const allNames = new Set(manifests.map((m) => m.originalName));
  for (const m of manifests) {
    byId.set(m.assetId, m);
    const arr = byName.get(m.originalName) ?? [];
    arr.push(m);
    byName.set(m.originalName, arr);
  }
  for (const m of manifests) {
    for (const a of m.aliases ?? []) {
      if (!allNames.has(a)) byAlias.set(a, m);
    }
  }
  const newestByName = (name: string): AssetManifest | null => {
    const arr = byName.get(name);
    if (!arr || arr.length === 0) return null;
    let best = arr[0];
    for (const m of arr.slice(1)) {
      if (m.ingestedAt >= best.ingestedAt) best = m;
    }
    return best;
  };
  const candidates: RehydrateCandidate[] = [];
  const skipped: RehydrateSkipped[] = [];
  const seenSrc = new Set<string>();
  for (const src of srcs) {
    if (seenSrc.has(src)) continue;
    seenSrc.add(src);
    if (isAssetSrc(src)) {
      const id = assetIdFromSrc(src);
      const m = id !== null ? byId.get(id) : undefined;
      if (m) candidates.push({ src, assetId: m.assetId, manifest: m, via: "asset" });
      else skipped.push({ src, reason: "asset không còn trong IndexedDB (đã xoá hoặc project mở ở máy khác)." });
      continue;
    }
    if (src.startsWith("blob:")) {
      skipped.push({ src, reason: "blob: URL chỉ sống trong phiên cũ; reload tạo document mới nên URL chết." });
      continue;
    }
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) {
      skipped.push({ src, reason: "src tự đủ (http/data), không cần nạp lại qua media bin." });
      continue;
    }
    if (src !== "" && !src.includes("://") && !src.startsWith("/")) {
      const m = newestByName(src);
      if (m) candidates.push({ src, assetId: m.assetId, manifest: m, via: "bare-name" });
      else {
        // Đợt 38 U3: cùng bytes, khác tên — khớp qua alias ghi lúc
        // import/relink dedup (importAsset37T3 nameMismatch → addAlias).
        const aliased = byAlias.get(src);
        if (aliased) {
          candidates.push({ src, assetId: aliased.assetId, manifest: aliased, via: "alias" });
        } else {
          skipped.push({ src, reason: "không có manifest cùng originalName trong AssetStore (media chưa từng được ingest)." });
        }
      }
      continue;
    }
    skipped.push({ src, reason: "dạng src không nhận diện được để nạp lại." });
  }
  return { candidates, skipped };
}

/** Deps tối thiểu mà bước nạp lại cần (App nối với AssetStore thật). */
export interface RehydrateDeps {
  listManifests(): Promise<AssetManifest[]>;
  loadBlob(assetId: string): Promise<Blob | null>;
  makeObjectURL(blob: Blob): string;
}

export interface RehydrateResult {
  /** MediaItem đã nạp lại xong, sẵn sàng đưa vào media bin. */
  items: MediaItem[];
  /** Src đã có MediaItem tương ứng. */
  restoredSrcs: string[];
  /** Src đã khớp manifest nhưng không lấy được blob / không dựng được item. */
  failedSrcs: string[];
  /** Src bị bỏ qua ở bước plan (xem RehydrateSkipped.reason). */
  skipped: RehydrateSkipped[];
}

function kindToMediaKind(kind: string): MediaKind | null {
  if (kind === "video" || kind === "audio" || kind === "image") return kind;
  return null;
}

/**
 * Nạp lại media bin cho một spec: plan → lấy blob → dựng MediaItem.
 *
 * MediaItem dựng lại mang `file` thật (`new File([blob], originalName)`),
 * không chỉ url preview: bytes trong IndexedDB CHÍNH là bytes gốc nên
 * File dựng từ chúng upload lên bridge render được như file import gốc
 * (ExportPanel dùng `item.file`). Khi môi trường không có `File`
 * (không xảy ra ở trình duyệt) thì item vẫn có url, chỉ thiếu file.
 * Item nào không dựng được thì rơi vào failedSrcs — App vẫn chạy
 * `checkMissingMedia()` sau đó nên clip đó hiện panel Relink như cũ,
 * không im lặng mất media.
 */
export async function rehydrateMediaItems(
  deps: RehydrateDeps,
  spec: RehydrateSpecLike,
): Promise<RehydrateResult> {
  const srcs = collectMediaSrcs(spec);
  const manifests = await deps.listManifests();
  const plan = planRehydrate(srcs, manifests);
  const items: MediaItem[] = [];
  const restoredSrcs: string[] = [];
  const failedSrcs: string[] = [];
  for (const c of plan.candidates) {
    const mediaKind = kindToMediaKind(c.manifest.kind);
    if (mediaKind === null) {
      failedSrcs.push(c.src);
      continue;
    }
    let blob: Blob | null = null;
    try {
      blob = await deps.loadBlob(c.assetId);
    } catch {
      blob = null;
    }
    if (!blob) {
      failedSrcs.push(c.src);
      continue;
    }
    let file: File | undefined;
    try {
      if (typeof File !== "undefined") {
        // Đợt 38 U3: candidate via alias giữ bất biến file.name == item.name
        // (== src clip) để export/render map theo tên không lệch; các via
        // còn lại src đã bằng originalName (bare-name) hoặc file mang tên
        // gốc là đúng (asset:).
        const fileName = c.via === "alias" ? c.src : c.manifest.originalName;
        file = new File([blob], fileName, { type: c.manifest.mimeType });
      }
    } catch {
      file = undefined;
    }
    items.push({
      id: `rehydrated-${c.assetId}-${items.length}`,
      name: c.src,
      kind: mediaKind,
      url: deps.makeObjectURL(blob),
      duration: c.manifest.duration ?? 0,
      width: c.manifest.width,
      height: c.manifest.height,
      thumbnail: c.manifest.thumbnail,
      file,
    });
  }
  for (const it of items) restoredSrcs.push(it.name);
  return { items, restoredSrcs, failedSrcs, skipped: plan.skipped };
}

// Lưu ý: trạng thái phiên (session.playhead) KHÔNG parse ở đây.
// projectRepo.ts là file được test bằng Node nên không được import value
// từ file anh em (xem quy ước captionFollow.ts); hàm thuần
// parseSessionPlayhead vì vậy sống trong projectRepo.ts (nơi duy nhất
// đọc envelope autosave thô) và được test từ đó. Quyết định sản phẩm
// về session xem docs/PHASE9_ROUND36_S5_REHYDRATE_LIMITS.md §1.
