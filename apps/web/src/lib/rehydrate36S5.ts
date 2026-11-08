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
import type { ProxyLiveness } from "./proxy";
// Đợt 59 P1 — type-only (bị xóa lúc chạy, không ảnh hưởng quy ước
// "không import value từ file anh em" của module này): manifest bin
// trong envelope autosave (xem parseBinMedia trong projectRepo.ts).
import type { BinMediaEntry } from "./projectRepo";

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
   * `bin` (đợt 59 P1) = entry trong manifest bin của autosave, khớp
   * theo assetId — media đã import nhưng không còn clip nào tham chiếu;
   * `bin-name` = entry bin khớp theo tên (assetId cũ không còn, manifest
   * cùng tên mới hơn — vd: xóa bytes cũ rồi import lại file cùng tên).
   */
  via: "asset" | "bare-name" | "alias" | "bin" | "bin-name";
}

/** Một entry bin không nạp lại được, kèm lý do để App/test đối chiếu. */
export interface RehydrateSkippedBin {
  assetId: string;
  name: string;
  reason: string;
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

export interface RehydrateBinPlan {
  candidates: RehydrateCandidate[];
  skipped: RehydrateSkippedBin[];
}

/**
 * Đợt 59 P1 — quyết định thuần cho manifest bin của autosave
 * (nợ đợt 58 §6.1 O2): media đã import nhưng không còn clip nào tham
 * chiếu vẫn phải ở lại trong bin sau reload.
 *
 * - Entry khớp manifest theo `assetId` trước (via "bin"); không có thì
 *   khớp theo `name` với originalName (via "bin-name" — vd: bytes cũ bị
 *   xóa rồi import lại file cùng tên nên assetId đổi).
 * - Entry đã được plan spec bao phủ (cùng assetId, hoặc cùng tên src)
 *   thì bỏ qua lặng lẽ ở đây — không nhân đôi item, cũng không tính là
 *   skipped (media đó vẫn về bin qua đường spec như cũ).
 * - Entry trùng nhau trong chính manifest bin (cùng assetId) chỉ lấy
 *   entry đầu. Entry không khớp manifest nào → skipped (bytes đã bị
 *   xóa khỏi IndexedDB, hoặc project mở ở máy khác) — item đó mất khỏi
 *   bin một cách trung thực, không tạo item rỗng.
 * - Không truyền binMedia (undefined/null — envelope cũ) thì caller
 *   không gọi hàm này: hành vi cũ (chỉ spec) được giữ nguyên.
 */
export function planRehydrateBin(
  entries: BinMediaEntry[],
  manifests: AssetManifest[],
  specCandidates: RehydrateCandidate[],
): RehydrateBinPlan {
  const byId = new Map<string, AssetManifest>();
  const byName = new Map<string, AssetManifest[]>();
  for (const m of manifests) {
    byId.set(m.assetId, m);
    const arr = byName.get(m.originalName) ?? [];
    arr.push(m);
    byName.set(m.originalName, arr);
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
  const coveredIds = new Set(specCandidates.map((c) => c.assetId));
  const coveredSrcs = new Set(specCandidates.map((c) => c.src));
  const candidates: RehydrateCandidate[] = [];
  const skipped: RehydrateSkippedBin[] = [];
  const seenIds = new Set<string>();
  for (const e of entries) {
    if (seenIds.has(e.assetId)) continue;
    seenIds.add(e.assetId);
    // Đã về bin qua đường spec (cùng asset hoặc cùng tên src) → bỏ qua.
    if (coveredIds.has(e.assetId) || coveredSrcs.has(e.name)) continue;
    const byIdMatch = byId.get(e.assetId);
    if (byIdMatch) {
      candidates.push({ src: e.name, assetId: byIdMatch.assetId, manifest: byIdMatch, via: "bin" });
      coveredIds.add(byIdMatch.assetId);
      coveredSrcs.add(e.name);
      continue;
    }
    const byNameMatch = newestByName(e.name);
    if (byNameMatch) {
      candidates.push({ src: e.name, assetId: byNameMatch.assetId, manifest: byNameMatch, via: "bin-name" });
      coveredIds.add(byNameMatch.assetId);
      coveredSrcs.add(e.name);
      continue;
    }
    skipped.push({
      assetId: e.assetId,
      name: e.name,
      reason: "asset không còn trong IndexedDB (đã xoá bytes hoặc project mở ở máy khác).",
    });
  }
  return { candidates, skipped };
}

/** Deps tối thiểu mà bước nạp lại cần (App nối với AssetStore thật). */
export interface RehydrateDeps {
  listManifests(): Promise<AssetManifest[]>;
  loadBlob(assetId: string): Promise<Blob | null>;
  makeObjectURL(blob: Blob): string;
  /**
   * Đợt 53 J5 — origin bridge hiện tại để ghép proxyUrl đầy đủ từ
   * `manifest.proxyPath` (chỉ lưu đường dẫn trong manifest vì cổng
   * bridge có thể đổi giữa các phiên). Không truyền thì mặc định
   * `http://127.0.0.1:8787` (cùng mặc định của lib/bridgeUrl); App
   * truyền BRIDGE_URL live binding. Chỉ dùng khi manifest có proxyPath.
   */
  proxyBaseUrl?: string;
  /**
   * Đợt 54 K7 — kiểm tra proxy còn sống không (xem `checkProxyAlive`
   * trong lib/proxy: HEAD → "alive" | "missing" | "unknown"). Không
   * truyền → coi như "unknown" (giữ proxy như cũ, không kết luận
   * stale) để caller cũ/test không truyền vẫn chạy đúng hành vi cũ.
   * CHỈ "missing" (404 chắc chắn) mới gỡ proxy; "alive"/"unknown" giữ.
   */
  checkProxyUrl?: (url: string) => Promise<ProxyLiveness>;
}

/** Origin bridge mặc định khi caller không truyền proxyBaseUrl. */
export const DEFAULT_PROXY_BASE_URL = "http://127.0.0.1:8787";

export interface RehydrateResult {
  /** MediaItem đã nạp lại xong, sẵn sàng đưa vào media bin. */
  items: MediaItem[];
  /** Src đã có MediaItem tương ứng. */
  restoredSrcs: string[];
  /** Src đã khớp manifest nhưng không lấy được blob / không dựng được item. */
  failedSrcs: string[];
  /** Src bị bỏ qua ở bước plan (xem RehydrateSkipped.reason). */
  skipped: RehydrateSkipped[];
  /**
   * Đợt 54 K7 — proxy đã chết lúc rehydrate (file mất trên bridge):
   * item tương ứng đã bị gỡ proxyUrl + đánh dấu `proxyStale`, và
   * caller (App / openProjectFlow) nên xóa proxyPath khỏi manifest
   * bằng `AssetStore.setProxy(assetId, null)` để lần sau khỏi kiểm
   * tra lại đường dẫn chết. Rỗng khi không có proxy nào chết.
   */
  staleProxies: Array<{ assetId: string; proxyPath: string; name: string }>;
  /**
   * Đợt 59 P1 — tên media chỉ khôi phục nhờ manifest bin (không còn
   * clip nào tham chiếu). Rỗng khi không truyền binMedia hoặc khi mọi
   * entry bin đều đã được plan spec bao phủ.
   */
  restoredFromBin: string[];
  /**
   * Đợt 59 P1 — entry bin không nạp lại được (không khớp manifest nào).
   * Không tính entry đã được plan spec bao phủ (không phải lỗi).
   */
  skippedBin: RehydrateSkippedBin[];
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
 *
 * Đợt 59 P1 — tham số thứ ba `binMedia` (tùy chọn): manifest bin từ
 * envelope autosave (xem parseBinMedia trong projectRepo.ts). Khi có,
 * media đã import nhưng không còn clip nào tham chiếu vẫn được nạp lại
 * vào bin (planRehydrateBin); không truyền (envelope cũ) thì giữ đúng
 * hành vi cũ (chỉ spec).
 */
export async function rehydrateMediaItems(
  deps: RehydrateDeps,
  spec: RehydrateSpecLike,
  binMedia?: BinMediaEntry[] | null,
): Promise<RehydrateResult> {
  const srcs = collectMediaSrcs(spec);
  const manifests = await deps.listManifests();
  const plan = planRehydrate(srcs, manifests);
  // Đợt 59 P1: plan bin SAU plan spec để entry đã được spec bao phủ
  // (cùng asset/tên) không nhân đôi item; entry bin chỉ bổ sung media
  // mà spec không còn tham chiếu.
  const binPlan: RehydrateBinPlan = binMedia ? planRehydrateBin(binMedia, manifests, plan.candidates) : { candidates: [], skipped: [] };
  const candidates = [...plan.candidates, ...binPlan.candidates];
  const items: MediaItem[] = [];
  const restoredSrcs: string[] = [];
  const restoredFromBin: string[] = [];
  const failedSrcs: string[] = [];
  const staleProxies: RehydrateResult["staleProxies"] = [];
  for (const c of candidates) {
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
        // Đợt 59 P1: via "bin"/"bin-name" cũng giữ bất biến này — tên bin
        // có thể khác originalName (item bị đổi tên do trùng lúc import),
        // và item.name (== src) mới là khóa khớp clip/export.
        const fileName =
          c.via === "alias" || c.via === "bin" || c.via === "bin-name" ? c.src : c.manifest.originalName;
        file = new File([blob], fileName, { type: c.manifest.mimeType });
      }
    } catch {
      file = undefined;
    }
    // Đợt 54 K7 — kiểm tra proxy còn sống TRƯỚC khi gắn vào item:
    // file proxy trên đĩa bridge mà mất (đổi WORK_ROOT / xóa tay) thì
    // gỡ proxyUrl và đánh dấu proxyStale thay vì giữ URL chết (nợ J5
    // §6). Chỉ "missing" (404 chắc chắn từ checkProxyUrl) mới gỡ;
    // "alive"/"unknown" (bridge tắt, mất mạng) và không có dep kiểm
    // tra thì giữ proxy như cũ — MediaPool fallback về bản gốc khi
    // phát như hành vi cũ. Kiểm tra tuần tự từng item: thường chỉ
    // 0–1 item có proxy nên không đáng kể.
    let proxyFields: Pick<MediaItem, "proxyUrl" | "proxyHeight" | "proxySizeBytes"> = {};
    let proxyStale = false;
    if (c.manifest.proxyPath) {
      const proxyUrl = `${deps.proxyBaseUrl ?? DEFAULT_PROXY_BASE_URL}${c.manifest.proxyPath}`;
      let liveness: ProxyLiveness = "unknown";
      if (deps.checkProxyUrl) {
        try {
          liveness = await deps.checkProxyUrl(proxyUrl);
        } catch {
          liveness = "unknown";
        }
      }
      if (liveness === "missing") {
        proxyStale = true;
        staleProxies.push({ assetId: c.assetId, proxyPath: c.manifest.proxyPath, name: c.src });
      } else {
        proxyFields = {
          proxyUrl,
          proxyHeight: c.manifest.proxyHeight,
          proxySizeBytes: c.manifest.proxySizeBytes,
        };
      }
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
      // Đợt 53 J5 — nối assetId (để setMediaProxy lưu bền proxy về đúng
      // manifest) và proxy đã lưu (nợ I9 §5): item khôi phục lại dùng
      // proxy ngay, không cần tạo lại từ gốc. proxyPath chỉ ghép với
      // origin bridge HIỆN TẠI (deps.proxyBaseUrl) vì cổng có thể đổi
      // giữa các phiên; manifest không có proxyPath → item không có
      // proxyUrl như cũ.
      assetId: c.assetId,
      ...(proxyStale ? { proxyStale: true } : {}),
      ...proxyFields,
    });
    // Đợt 59 P1: chỉ item dựng thành công từ entry bin mới tính là
    // "khôi phục từ bin" (blob lỗi → failedSrcs, không tính).
    if (c.via === "bin" || c.via === "bin-name") restoredFromBin.push(c.src);
  }
  for (const it of items) restoredSrcs.push(it.name);
  return { items, restoredSrcs, failedSrcs, skipped: plan.skipped, staleProxies, restoredFromBin, skippedBin: binPlan.skipped };
}

// Lưu ý: trạng thái phiên (session.playhead) KHÔNG parse ở đây.
// projectRepo.ts là file được test bằng Node nên không được import value
// từ file anh em (xem quy ước captionFollow.ts); hàm thuần
// parseSessionPlayhead vì vậy sống trong projectRepo.ts (nơi duy nhất
// đọc envelope autosave thô) và được test từ đó. Quyết định sản phẩm
// về session xem docs/PHASE9_ROUND36_S5_REHYDRATE_LIMITS.md §1.
