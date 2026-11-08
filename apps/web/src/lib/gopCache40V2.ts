/**
 * gopCache40V2.ts — Nối GOP Range (đợt 39 T3) vào ReversePreviewController
 * (Phase 9 đợt 40, luồng V2).
 *
 * VẤN ĐỀ: `fetchVideoTrackByGopRange` (T3) đã chứng minh fetch từng GOP
 * bằng Range + fallback an toàn, nhưng chưa có code nào gọi nó từ
 * controller: controller vẫn tải toàn file mỗi lần đổi cửa sổ (hướng
 * (b) đợt 35 R3). Module này là lớp nối thuần (không cần browser):
 * quyết ngưỡng kích hoạt, cache GOP có giới hạn, và fetch bù 1 GOP
 * duy nhất khi cache miss — để controller dùng mà không phải viết lại
 * demux/fetch hay sửa cổng gate U2.
 *
 * NGƯỠNG KÍCH HOẠT (resolveGopRangeWiring) — lý do chọn, không cảm tính:
 * - Chỉ khi caller đã bật (mặc định TẮT; preview bật tường minh).
 *   Controller tự tạo trong test cũ không đổi hành vi.
 * - Chỉ khi đã biết size trước cửa sổ đầu tiên. Gate U2 vốn yêu cầu
 *   đã biết size; size chưa biết thì controller đi đường full-file cũ
 *   (học size qua HEAD/GET) và KHÔNG thử GOP lại sau — tránh 1 lượt
 *   GOP thử muộn sau khi file đã tải xong (vô ích).
 * - Chỉ khi threshold < size <= largeFileBytes. Trần dưới mặc định
 *   32 MiB: dưới đó, tải lại toàn file trên bridge local rẻ hơn chi
 *   phí HEAD + probe + tiền tố 512 KiB + 1 request/GOP của đường GOP
 *   (tiền tố đã là 1,6% của 32 MiB; file càng nhỏ, overhead càng lớn
 *   theo tỷ lệ, và với file nhỏ tiền tố gần như là toàn file nên GOP
 *   không tiết kiệm byte nào — xem LIMITS T3 §4). Trần trên là đúng
 *   ngưỡng S4 (128 MiB): file lớn hơn vẫn bị khóa fallback element
 *   như cũ — luồng này KHÔNG mở lại file > 128 MiB cho WebCodecs
 *   (cần chứng minh heap riêng, chưa có), và mọi số đo > 128 MiB của
 *   đợt 39 T4 (0 request khi bị khóa) vẫn giữ nguyên giá trị.
 * - Gate U2 KHÔNG bị sửa: ngưỡng trên là ngưỡng S4 của controller,
 *   không phải ngưỡng của resolveRangeGopFetch; đường GOP vẫn phải qua
 *   gate + probe 206 bên trong fetchVideoTrackByGopRange, và mọi lý do
 *   gate từ chối (moov cuối, 200 phớt Range, Accept-Ranges none) đều
 *   chảy thành fallback full-file ở controller, không throw.
 *
 * CACHE GOP (GopSegmentCache):
 * - LRU theo thứ tự chèn/chạm: get() chạm lại, put() vượt trần thì
 *   evict GOP cũ nhất trước. Trần kép: 16 MiB tổng rangeBytes VÀ
 *   32 GOP — trần byte giữ cache trong ngân sách tổng 320 MiB của
 *   controller (frame 192 MiB + cache GOP 16 MiB vẫn còn biên cho
 *   decoder/canvas); trần số GOP chặn trường hợp nhiều GOP nhỏ làm
 *   Map phình dù chưa chạm trần byte.
 * - Đợt 51 H4 — trần byte 32 → 16 MiB (quyết định có số đo, xem
 *   docs/PHASE9_ROUND51_H4_GOP_HEAP_LIMITS.md §2): 6 lượt headed
 *   fixture 37 MiB cho thấy cache thật chỉ giữ tối đa 8,24 MiB,
 *   evicted = 0 ở mọi trần (kể cả 8 MiB), settled heap không đổi
 *   theo trần (do frame cache quyết định) và tốc độ lùi không đổi;
 *   16 MiB giữ biên 2× trên mức tối đa quan sát được, còn 8 MiB
 *   chỉ còn biên ~1,3 MiB nên không chọn.
 * - 1 GOP đơn lẻ vượt trần byte thì KHÔNG cache (put trả false) nhưng
 *   vẫn dùng được cho lần decode hiện tại qua windowSegments của
 *   controller — tránh 1 GOP thưa evict sạch cache rồi vẫn không vừa.
 * - Đợt 50 F4 — streaming là đường chính: T3 (`streamGops: true`)
 *   chỉ trả meta mọi GOP, KHÔNG fetch byte GOP nào lượt đầu; mỗi cửa
 *   sổ decode fetch đúng GOP nó giao (fetchSingleGopRange) rồi put
 *   vào cache này, GOP ngoài cửa sổ chưa từng được fetch. Cache miss
 *   sau đó cũng fetch bù đúng 1 GOP bằng Range, không tải lại toàn
 *   file, không fetch lại mọi GOP. (Trước F4, T3 trả mọi GOP lượt đầu
 *   và controller chỉ put GOP giao cửa sổ, còn lại rơi khỏi scope —
 *   đỉnh heap transient khi đó giữ chunk mọi GOP, xem LIMITS F4 §4.)
 *
 * KHÔNG CHUNK NỬA VỜI: fetchSingleGopRange chỉ nhận 206 +
 * Content-Range khớp đúng range (qua cổng gate); mọi trường hợp khác
 * trả { ok: false } và huỷ body best-effort, không throw vì lỗi
 * mạng/server. Controller chỉ bắt đầu decode 1 cửa sổ khi mọi GOP
 * giao cửa sổ đó đã có trong cache/windowSegments; fetch bù hỏng thì
 * cửa sổ đó trả false trước khi decode — frameAt rơi về đường element
 * cũ cho tick đó, không decode nửa cửa sổ.
 *
 * GIỚI HẠN KẾ THỪA (không giấu): chỉ avc1 không fragmented, moov
 * > 16 MiB → fallback (của T3); Safari/Firefox/máy thật chưa đo cho
 * đường này; file có audio xen kẽ thì range GOP bao cả byte audio
 * giữa các sample (overhead, xem T3 §2). Đường GOP không dùng cho
 * file > 128 MiB và không dùng khi chưa biết size — xem LIMITS V2.
 */

import { checkRangeProbeResponse } from "./reverseRangeGate38U2";
import type { GopRangeFetchFn, GopSegment } from "./gopRangeFetch39T3";
import { sampleChunkInit } from "./mp4Demux";
import type { Mp4Sample, Mp4VideoTrack } from "./mp4Demux";

/** Ngưỡng dưới mặc định: chỉ file lớn hơn 32 MiB mới xét đường GOP. */
export const GOP_RANGE_ACTIVATION_THRESHOLD_BYTES = 32 * 1024 * 1024;

/**
 * Đợt 61 R6 — lookup i18n tùy chọn (mẫu Q4: file này được test bằng Node
 * nên KHÔNG import `../i18n` trực tiếp). Khi `lookup` vắng → fallback
 * đúng từng chữ chuỗi VI cũ nên test cũ + hành vi mặc định không đổi.
 * Key trong fragment R6 (`gop.cache.*`).
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
/** Trần cache GOP mặc định: 16 MiB tổng rangeBytes.
 * Đợt 51 H4 — 32 → 16 MiB sau 6 lượt đo headed (xem
 * docs/PHASE9_ROUND51_H4_GOP_HEAP_LIMITS.md §2). Ngưỡng kích hoạt
 * đường GOP (32 MiB) KHÔNG đổi — chỉ trần retention đổi. */
export const GOP_CACHE_MAX_BYTES = 16 * 1024 * 1024;
/** Trần số GOP giữ trong cache (kèm trần byte). */
export const GOP_CACHE_MAX_SEGMENTS = 32;

export interface GopWiringInput {
  /** Caller đã bật đường GOP chưa (mặc định tắt). */
  enabled: boolean;
  /** Size caller đã biết trước cửa sổ đầu tiên (null = chưa biết). */
  knownSizeBytes: number | null | undefined;
  /** Ngưỡng dưới (mặc định 32 MiB; test có thể truyền nhỏ). */
  thresholdBytes?: number;
  /** Ngưỡng file lớn của controller (mặc định 128 MiB — cổng S4). */
  largeFileBytes?: number;
  /** Lookup i18n tùy chọn (đợt 61 R6) — vắng thì lý do giữ chuỗi VI cũ. */
  lookup?: I18nLookup;
}

export interface GopWiringDecision {
  useGop: boolean;
  /** Lý do ngắn, đủ để log/debug (không phải chuỗi UI). */
  reason: string;
}

/**
 * Quyết ngưỡng kích hoạt đường GOP. Thuần, không fetch, không sửa gate.
 * Thứ tự kiểm tra cố ý: tắt → chưa biết size → dưới ngưỡng → vượt
 * ngưỡng file lớn → bật; reason luôn chỉ ra đúng rào cản đầu tiên.
 */
export function resolveGopRangeWiring(input: GopWiringInput): GopWiringDecision {
  const threshold =
    input.thresholdBytes ?? GOP_RANGE_ACTIVATION_THRESHOLD_BYTES;
  const large = input.largeFileBytes ?? 128 * 1024 * 1024;
  const lookup = input.lookup;
  if (!input.enabled) {
    return {
      useGop: false,
      reason: trKey(lookup, "gop.cache.disabled", {}, "gop-disabled: caller chưa bật đường GOP"),
    };
  }
  const size = input.knownSizeBytes;
  if (
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    size <= 0
  ) {
    return {
      useGop: false,
      reason: trKey(lookup, "gop.cache.sizeUnknown", {}, "gop-size-unknown: chưa biết size trước cửa sổ đầu tiên"),
    };
  }
  if (size <= threshold) {
    return {
      useGop: false,
      reason: trKey(
        lookup,
        "gop.cache.belowThreshold",
        { size: String(size), threshold: String(threshold) },
        `gop-below-threshold: ${size} <= ${threshold}`,
      ),
    };
  }
  if (size > large) {
    return {
      useGop: false,
      reason: trKey(
        lookup,
        "gop.cache.largeFileLocked",
        { size: String(size), large: String(large) },
        `gop-large-file-locked: ${size} > ${large} (cổng S4 giữ nguyên)`,
      ),
    };
  }
  return {
    useGop: true,
    reason: trKey(
      lookup,
      "gop.cache.rangeOk",
      { threshold: String(threshold), size: String(size), large: String(large) },
      `gop-range: ${threshold} < ${size} <= ${large}`,
    ),
  };
}

/** Metadata GOP đủ để tìm đoạn giao cửa sổ decode (không giữ chunk). */
export interface GopMeta {
  index: number;
  firstSampleIndex: number;
  lastSampleIndex: number;
  rangeStart: number;
  rangeEnd: number;
}

export function gopMetaFor(segments: GopSegment[]): GopMeta[] {
  return segments.map((g) => ({
    index: g.index,
    firstSampleIndex: g.firstSampleIndex,
    lastSampleIndex: g.lastSampleIndex,
    rangeStart: g.rangeStart,
    rangeEnd: g.rangeEnd,
  }));
}

/** Chỉ số các GOP giao đoạn sample decode [from, to] (theo sample, không theo byte). */
export function gopsForDecodeRange(
  meta: GopMeta[],
  from: number,
  to: number,
): number[] {
  const out: number[] = [];
  for (const g of meta) {
    if (g.lastSampleIndex >= from && g.firstSampleIndex <= to) out.push(g.index);
  }
  return out;
}

/**
 * Cache GOP có giới hạn (LRU). Lưu đúng đối tượng GopSegment của T3
 * (chunks đã là sample bytes qua sampleChunkInit) hoặc segment dựng
 * từ fetchSingleGopRange + buildGopSegment.
 */
export class GopSegmentCache {
  private map = new Map<number, GopSegment>();
  private storedBytes = 0;
  private hitCount = 0;
  private missCount = 0;
  private evictedBytes = 0;

  constructor(
    private maxBytes: number = GOP_CACHE_MAX_BYTES,
    private maxSegments: number = GOP_CACHE_MAX_SEGMENTS,
  ) {}

  get size(): number {
    return this.map.size;
  }

  /** Tổng rangeBytes đang giữ (0 khi rỗng). */
  get bytes(): number {
    return this.storedBytes;
  }

  get hits(): number {
    return this.hitCount;
  }

  get misses(): number {
    return this.missCount;
  }

  get evicted(): number {
    return this.evictedBytes;
  }

  /** Lấy + chạm LRU; miss thì đếm miss (không throw). */
  get(index: number): GopSegment | undefined {
    const seg = this.map.get(index);
    if (!seg) {
      this.missCount++;
      return undefined;
    }
    // Chạm: xóa + chèn lại để thành mới nhất trong thứ tự Map.
    this.map.delete(index);
    this.map.set(index, seg);
    this.hitCount++;
    return seg;
  }

  has(index: number): boolean {
    return this.map.has(index);
  }

  /**
   * Put có trần. GOP đơn lẻ vượt trần byte → từ chối (trả false, không
   * evict gì, không giữ) để 1 GOP thưa không xóa sạch cache. Vượt
   * trần số lượng/byte thì evict cũ nhất cho tới khi vừa (kể cả khi
   * phải evict hết các GOP khác, miễn là GOP mới tự nó vừa trần).
   */
  put(seg: GopSegment): boolean {
    const segBytes = seg.rangeEnd - seg.rangeStart;
    if (!(segBytes > 0) || segBytes > this.maxBytes) return false;
    const prev = this.map.get(seg.index);
    if (prev) {
      this.storedBytes -= prev.rangeEnd - prev.rangeStart;
      this.map.delete(seg.index);
    }
    while (
      (this.storedBytes + segBytes > this.maxBytes ||
        this.map.size + 1 > this.maxSegments) &&
      this.map.size > 0
    ) {
      const oldestKey = this.map.keys().next().value as number;
      const oldest = this.map.get(oldestKey) as GopSegment;
      this.evictedBytes += oldest.rangeEnd - oldest.rangeStart;
      this.storedBytes -= oldest.rangeEnd - oldest.rangeStart;
      this.map.delete(oldestKey);
    }
    this.map.set(seg.index, seg);
    this.storedBytes += segBytes;
    return true;
  }

  clear(): void {
    this.map.clear();
    this.storedBytes = 0;
    this.evictedBytes = 0;
  }

  stats(): {
    segments: number;
    bytes: number;
    hits: number;
    misses: number;
    evictedBytes: number;
  } {
    return {
      segments: this.map.size,
      bytes: this.storedBytes,
      hits: this.hitCount,
      misses: this.missCount,
      evictedBytes: this.evictedBytes,
    };
  }
}

export type SingleGopFetchResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: string };

/**
 * Fetch bù đúng 1 GOP bằng Range, kiểm chứng bằng cổng gate (206 +
 * Content-Range khớp đúng range + khớp tổng đã biết). Không throw vì
 * lỗi mạng/server/dạng response — trả { ok: false } để controller
 * quyết fallback; chỉ throw khi tham số range/size sai kiểu (lỗi lập
 * trình của caller), giống hợp đồng của T3.
 */
export async function fetchSingleGopRange(
  url: string,
  rangeStart: number,
  rangeEnd: number,
  knownSizeBytes: number | null,
  fetchImpl: GopRangeFetchFn,
  lookup?: I18nLookup,
): Promise<SingleGopFetchResult> {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("fetchSingleGopRange: url phải là string không rỗng");
  }
  if (!(rangeStart >= 0) || !(rangeEnd > rangeStart)) {
    throw new TypeError("fetchSingleGopRange: range GOP không hợp lệ");
  }
  try {
    const resp = await fetchImpl(url, {
      headers: { Range: `bytes=${rangeStart}-${rangeEnd - 1}` },
    });
    if (resp.status !== 206) {
      try {
        await resp.body?.cancel();
      } catch {
        /* bỏ qua */
      }
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.cache.statusNot206",
          { status: String(resp.status), start: String(rangeStart), end: String(rangeEnd - 1) },
          `gop-status-${resp.status}: server không trả 206 cho Range GOP ${rangeStart}-${rangeEnd - 1}`,
        ),
      };
    }
    const check = checkRangeProbeResponse(
      resp.status,
      resp.headers.get("content-range"),
      { start: rangeStart, end: rangeEnd - 1 },
      knownSizeBytes,
      lookup,
    );
    if (check.outcome !== "range-ok") {
      try {
        await resp.body?.cancel();
      } catch {
        /* bỏ qua */
      }
      return { ok: false, reason: `gop-${check.reason}` };
    }
    const buf = new Uint8Array(await resp.arrayBuffer());
    if (buf.length !== rangeEnd - rangeStart) {
      return {
        ok: false,
        reason: trKey(
          lookup,
          "gop.cache.shortBody",
          { wanted: String(rangeEnd - rangeStart), got: String(buf.length) },
          `gop-short-body: xin ${rangeEnd - rangeStart} byte, nhận ${buf.length}`,
        ),
      };
    }
    return { ok: true, bytes: buf };
  } catch (e) {
    return { ok: false, reason: `gop-exception: ${(e as Error).message}` };
  }
}

/**
 * Dựng 1 GopSegment từ byte GOP thô đã fetch: cắt từng sample theo
 * offset tuyệt đối rồi qua sampleChunkInit (cùng cách T3 ghép chunk).
 * Sample nằm ngoài buffer → throw (lỗi lập trình/dữ liệu mâu thuẫn —
 * controller chỉ gọi sau khi fetchSingleGopRange đã kiểm chứng range,
 * nên trường hợp này không được nuốt thành chunk nửa vời).
 */
export function buildGopSegment(
  track: Mp4VideoTrack,
  meta: GopMeta,
  gopBytes: Uint8Array,
): GopSegment {
  const chunks: GopSegment["chunks"] = [];
  let sampleBytes = 0;
  for (let si = meta.firstSampleIndex; si <= meta.lastSampleIndex; si++) {
    const s: Mp4Sample = track.samples[si];
    const rel = s.offset - meta.rangeStart;
    if (rel < 0 || rel + s.size > gopBytes.length) {
      throw new Error(
        `buildGopSegment: sample ${si} nằm ngoài buffer GOP ${meta.rangeStart}-${meta.rangeEnd}`,
      );
    }
    chunks.push(sampleChunkInit(track, s, gopBytes.slice(rel, rel + s.size)));
    sampleBytes += s.size;
  }
  return {
    index: meta.index,
    firstSampleIndex: meta.firstSampleIndex,
    lastSampleIndex: meta.lastSampleIndex,
    sampleCount: meta.lastSampleIndex - meta.firstSampleIndex + 1,
    rangeStart: meta.rangeStart,
    rangeEnd: meta.rangeEnd,
    rangeBytes: meta.rangeEnd - meta.rangeStart,
    sampleBytes,
    chunks,
  };
}
