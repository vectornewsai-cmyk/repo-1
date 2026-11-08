/**
 * relink.ts — Phát hiện media thiếu + relink (R1-033, Batch C).
 *
 * Bối cảnh: project `.vcut.json` chỉ lưu `src` (tên file), KHÔNG lưu binary.
 * Khi mở project ở phiên khác / máy khác, media chưa được import → clip trỏ
 * tới `src` không resolve được. Module này:
 *   1. Quét spec, liệt kê asset thiếu (pure, test được bằng Node).
 *   2. Relink: cập nhật `src` của mọi clip dùng asset cũ sang asset mới (pure).
 *
 * Phần UI nằm ở components/RelinkPanel.tsx; store tích hợp ở store.ts.
 *
 * Phase 9 đợt 26 J2 — NESTED RELINK: trước đợt này, cả hai hàm trên chỉ quét
 * `spec.tracks` cấp cao; clip lá nằm trong `subSpec` của nested clip không
 * bao giờ được tính thiếu, và relink cũng không chạm tới chúng (đường vòng
 * duy nhất là import lại qua MediaBin). Từ đợt này:
 *   - `findMissingAssets` đệ quy qua mọi tầng nested (canonical: clip
 *     `kind: "nested"` + `subSpec.tracks`; legacy: clip nested mang trực
 *     tiếp `tracks` khi không có `subSpec` — cùng quy ước ưu tiên subSpec
 *     của nestedPreview.ts).
 *   - `relinkAsset` đệ quy tương tự: đổi đúng `src` của lá sâu, không đổi
 *     clip khác, không mutate input (trả spec mới, giữ nguyên tham chiếu
 *     các nhánh không đổi).
 *   - Chống vòng lặp theo NHÁNH (branch-local ancestor set): cùng một
 *     `subSpec` object được dùng lại ở hai clip ANH EM là hợp lệ và được
 *     quét/relink ở cả hai nhánh; chỉ khi `subSpec` xuất hiện lại trong
 *     chính chuỗi tổ tiên của nó mới cắt nhánh đó (đúng ngữ nghĩa vòng lặp
 *     của packages/video-spec/src/nested.ts). Độ sâu đệ quy tối đa
 *     MAX_NESTED_RELINK_DEPTH (64, gấp 8 lần giới hạn spec 8) — vượt thì
 *     nhánh sâu hơn bị bỏ qua, xem LIMITS.
 */
import type { Clip, Track, TrackKind, VideoSpec } from "@repo-1/video-spec";
import { t as i18nT } from "../i18n";

/** Loại asset có thể thiếu (text clip không có src nên không bao giờ thiếu). */
export type RelinkableKind = "video" | "audio" | "image" | "sticker";

/** Một vị trí dùng asset: đủ để panel định vị lá thiếu trong nested. */
export interface MissingAssetLocation {
  /**
   * Chuỗi nested bao quanh lá, từ ngoài vào trong; mỗi phần tử là
   * `name` (nếu có) của nested clip, nếu không thì `id`. [] = lá cấp cao.
   */
  chain: string[];
  /** `chain` nối bằng " › "; "" khi lá ở cấp cao. */
  chainLabel: string;
  /** Label track chứa lá (track trong subSpec khi lá nằm trong nested). */
  trackLabel: string;
  /** Id của clip lá dùng asset. */
  clipId: string;
  /** Độ sâu nested: 0 = cấp cao, 1 = trong 1 nested clip, ... */
  depth: number;
}

export interface MissingAsset {
  /** Giá trị `src` trong clip — tên file gốc khi lưu project. */
  src: string;
  kind: RelinkableKind;
  /** Số clip đang dùng asset này (cấp cao + mọi tầng nested). */
  clipCount: number;
  /** Label các track chứa clip dùng asset này (để user nhận diện). */
  trackLabels: string[];
  /** Số clip cấp cao dùng asset này (đợt 26 J2). */
  topLevelClipCount: number;
  /** Số clip lá trong nested dùng asset này (đợt 26 J2). */
  nestedClipCount: number;
  /**
   * Các chain nested chứa lá thiếu, dạng "outer › inner", đã khử trùng và
   * sắp xếp; rỗng khi asset chỉ thiếu ở cấp cao (đợt 26 J2).
   */
  nestedChains: string[];
  /** Mọi vị trí dùng asset (đợt 26 J2; dùng để hiển thị + test). */
  locations: MissingAssetLocation[];
}

/** Độ sâu đệ quy tối đa khi quét/relink nested (spec giới hạn 8). */
export const MAX_NESTED_RELINK_DEPTH = 64;

/** Clip có src là các kind video/audio/image/sticker. */
function srcOf(c: Clip): { src: string; kind: RelinkableKind } | null {
  const kind = c.kind as TrackKind;
  if (kind === "video" || kind === "audio" || kind === "image" || kind === "sticker") {
    const src = (c as { src?: unknown }).src;
    if (typeof src === "string" && src.length > 0) return { src, kind };
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Nhãn hiển thị của 1 nested clip: name nếu có, không thì id. */
function nestedLabel(c: Record<string, unknown>): string {
  const name = c["name"];
  if (typeof name === "string" && name.length > 0) return name;
  const id = c["id"];
  return typeof id === "string" && id.length > 0 ? id : "?";
}

function trackLabelOf(t: Track): string {
  return typeof t.label === "string" && t.label.length > 0 ? t.label : t.id;
}

/**
 * Track của subSpec theo dạng canonical: `subSpec.tracks` khi có, nếu không
 * thì `tracks` trực tiếp trên clip nested (legacy). Trả null khi clip không
 * phải nested hoặc không có track nào. Dùng cho QUÉT (chỉ 1 nguồn để
 * tránh đếm trùng khi cả hai cùng tồn tại và bằng nhau).
 */
function canonicalSubTracks(c: Record<string, unknown>): Track[] | null {
  const sub = c["subSpec"];
  if (isRecord(sub) && Array.isArray(sub["tracks"])) return sub["tracks"] as Track[];
  if (Array.isArray(c["tracks"])) return c["tracks"] as Track[];
  return null;
}

/** Một asset có được coi là thiếu không (blob: của phiên cũ luôn thiếu). */
function isMissing(src: string, mediaNames: Set<string>): boolean {
  return src.startsWith("blob:") || !mediaNames.has(src);
}

interface ScanState {
  bySrc: Map<string, MissingAsset>;
  mediaNames: Set<string>;
}

function recordHit(
  st: ScanState,
  hit: { src: string; kind: RelinkableKind },
  loc: MissingAssetLocation,
  displayTrack: string,
): void {
  let m = st.bySrc.get(hit.src);
  if (!m) {
    m = {
      src: hit.src,
      kind: hit.kind,
      clipCount: 0,
      trackLabels: [],
      topLevelClipCount: 0,
      nestedClipCount: 0,
      nestedChains: [],
      locations: [],
    };
    st.bySrc.set(hit.src, m);
  }
  m.clipCount += 1;
  if (loc.depth === 0) m.topLevelClipCount += 1;
  else {
    m.nestedClipCount += 1;
    if (!m.nestedChains.includes(loc.chainLabel)) m.nestedChains.push(loc.chainLabel);
  }
  if (!m.trackLabels.includes(displayTrack)) m.trackLabels.push(displayTrack);
  m.locations.push(loc);
}

/** Quét đệ quy 1 danh sách track; `ancestors` = các subSpec object trên nhánh. */
function scanTracks(
  st: ScanState,
  tracks: Track[],
  chain: string[],
  ancestors: Set<object>,
): void {
  for (const t of tracks ?? []) {
    for (const c of t.clips ?? []) {
      const rec = c as unknown as Record<string, unknown>;
      const hit = srcOf(c as Clip);
      if (hit && isMissing(hit.src, st.mediaNames)) {
        const depth = chain.length;
        recordHit(
          st,
          hit,
          {
            chain: [...chain],
            chainLabel: chain.join(" › "),
            trackLabel: trackLabelOf(t),
            clipId: typeof rec["id"] === "string" ? (rec["id"] as string) : "?",
            depth,
          },
          depth === 0 ? trackLabelOf(t) : `${chain.join(" › ")} / ${trackLabelOf(t)}`,
        );
        // Không `continue` ở đây: clip vừa có src vừa là nested (dữ liệu
        // hỏng) vẫn phải quét tiếp subtree của nó, không được nuốt lá con.
      }
      if (rec["kind"] !== "nested") continue;
      if (chain.length >= MAX_NESTED_RELINK_DEPTH) continue;
      const subTracks = canonicalSubTracks(rec);
      if (!subTracks) continue;
      // Vòng lặp theo nhánh: subSpec object đã nằm trên nhánh → cắt.
      const subObj = isRecord(rec["subSpec"]) ? (rec["subSpec"] as object) : null;
      if (subObj !== null && ancestors.has(subObj)) continue;
      const nextAncestors = new Set(ancestors);
      if (subObj !== null) nextAncestors.add(subObj);
      scanTracks(st, subTracks, [...chain, nestedLabel(rec)], nextAncestors);
    }
  }
}

/**
 * Quét spec, trả về danh sách asset thiếu (src không có trong `mediaNames`).
 * Gộp theo src (1 file dùng ở nhiều clip chỉ liệt kê 1 lần, kể cả khi các
 * clip nằm trong nested khác nhau). Đệ quy qua mọi tầng nested (J2).
 * Pure — không chạm DOM/store.
 */
export function findMissingAssets(spec: VideoSpec, mediaNames: Set<string>): MissingAsset[] {
  const st: ScanState = { bySrc: new Map(), mediaNames };
  scanTracks(st, spec.tracks ?? [], [], new Set());
  const out = [...st.bySrc.values()];
  for (const m of out) m.nestedChains.sort((a, b) => a.localeCompare(b));
  return out.sort((a, b) => a.src.localeCompare(b.src));
}

export interface RelinkResult {
  /** Spec mới (không mutate input). */
  spec: VideoSpec;
  /** Số clip đã được cập nhật src (lá cấp cao + lá trong nested). */
  updatedCount: number;
}

interface RelinkCounter {
  n: number;
}

/**
 * Relink đệ quy 1 danh sách track. Trả về mảng track mới, hoặc chính mảng
 * cũ khi không có gì đổi (giữ tham chiếu nhánh không đổi). `count` = false
 * chỉ dùng cho nhánh `tracks` trực tiếp khi clip đã có `subSpec` (cùng một
 * lá logic được biểu diễn hai lần → cập nhật cả hai nhưng chỉ đếm một lần).
 */
function relinkTracks(
  tracks: Track[],
  oldSrc: string,
  newSrc: string,
  counter: RelinkCounter,
  chainDepth: number,
  ancestors: Set<object>,
  count: boolean,
): Track[] {
  let changed = false;
  const next = tracks.map((t) => {
    const nextClips = (t.clips ?? []).map((c) => relinkClip(c, oldSrc, newSrc, counter, chainDepth, ancestors, count));
    if (nextClips !== t.clips && nextClips.some((nc, i) => nc !== t.clips[i])) {
      changed = true;
      return { ...t, clips: nextClips };
    }
    // relinkClip luôn trả mảng mới cho clip nested đổi; lá không đổi trả
    // chính clip cũ nên so sánh theo phần tử là đủ. Trường hợp clips rỗng:
    // nextClips là mảng mới nhưng mọi phần tử bằng nhau → không đổi.
    return t;
  });
  // Map trên luôn tạo mảng mới; chỉ trả mảng mới khi thật sự có clip đổi.
  if (!changed) return tracks;
  return next;
}

/** Relink đệ quy 1 clip; trả chính clip cũ khi không có gì đổi bên trong. */
function relinkClip(
  c: Clip,
  oldSrc: string,
  newSrc: string,
  counter: RelinkCounter,
  chainDepth: number,
  ancestors: Set<object>,
  count: boolean,
): Clip {
  const rec = c as unknown as Record<string, unknown>;
  const hit = srcOf(c);
  if (hit && hit.src === oldSrc) {
    if (count) counter.n += 1;
    // Spread union Clip + field src mới: TextClip không có src nên TS bắt
    // lỗi kiểu union — cast qua Record (hit đã chứng minh clip này có src).
    return { ...(c as unknown as Record<string, unknown>), src: newSrc } as unknown as Clip;
  }
  if (rec["kind"] !== "nested") return c;
  if (chainDepth >= MAX_NESTED_RELINK_DEPTH) return c;
  let next: Record<string, unknown> = rec;
  let changed = false;
  const sub = rec["subSpec"];
  const subObj = isRecord(sub) ? (sub as object) : null;
  const cyclic = subObj !== null && ancestors.has(subObj);
  if (isRecord(sub) && Array.isArray(sub["tracks"]) && !cyclic) {
    const nextAncestors = new Set(ancestors);
    if (subObj !== null) nextAncestors.add(subObj);
    const nt = relinkTracks(sub["tracks"] as Track[], oldSrc, newSrc, counter, chainDepth + 1, nextAncestors, count);
    if (nt !== (sub["tracks"] as Track[])) {
      next = { ...next, subSpec: { ...sub, tracks: nt } };
      changed = true;
    }
  }
  // Legacy: clip nested mang tracks trực tiếp. Khi đã có subSpec thì đây là
  // biểu diễn trùng của cùng lá logic → cập nhật nhưng không đếm lại.
  if (Array.isArray(rec["tracks"])) {
    const hasSubTracks = isRecord(sub) && Array.isArray(sub["tracks"]);
    const directAncestors = subObj !== null && !cyclic ? (() => {
      const s = new Set(ancestors);
      s.add(subObj);
      return s;
    })() : ancestors;
    const nt = relinkTracks(
      rec["tracks"] as Track[],
      oldSrc,
      newSrc,
      counter,
      chainDepth + 1,
      directAncestors,
      count && !hasSubTracks,
    );
    if (nt !== (rec["tracks"] as Track[])) {
      next = { ...next, tracks: nt };
      changed = true;
    }
  }
  return changed ? (next as unknown as Clip) : c;
}

/**
 * Relink: mọi clip có `src === oldSrc` → `src = newSrc`, kể cả lá trong
 * nested ở mọi tầng (J2). Trả về spec mới (không mutate input; các nhánh
 * không đổi giữ nguyên tham chiếu), không đổi clip dùng src khác.
 * Pure — không chạm DOM/store.
 */
export function relinkAsset(spec: VideoSpec, oldSrc: string, newSrc: string): RelinkResult {
  if (oldSrc === newSrc) return { spec, updatedCount: 0 };
  const counter: RelinkCounter = { n: 0 };
  const tracks = relinkTracks(spec.tracks ?? [], oldSrc, newSrc, counter, 0, new Set(), true);
  if (tracks === spec.tracks) return { spec, updatedCount: 0 };
  return { spec: { ...spec, tracks }, updatedCount: counter.n };
}

/** Icon + label tiếng Việt cho từng loại asset (dùng ở UI). */
export const RELINK_KIND_META: Record<RelinkableKind, { icon: string; label: string }> = {
  video: { icon: "🎬", label: "Video" },
  audio: { icon: "🎵", label: i18nT("relink.kindAudio") },
  image: { icon: "🖼️", label: i18nT("relink.kindImage") },
  sticker: { icon: "⭐", label: "Sticker" },
};

/** Accept attribute cho <input type=file> khi relink từng loại. */
export const RELINK_ACCEPT: Record<RelinkableKind, string> = {
  video: "video/*",
  audio: "audio/*",
  image: "image/*",
  sticker: "image/*",
};
