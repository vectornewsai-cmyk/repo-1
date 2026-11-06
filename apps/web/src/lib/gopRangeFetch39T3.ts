/**
 * gopRangeFetch39T3.ts — Đường fetch thật theo GOP bằng HTTP Range,
 * nối cổng Range đợt 38 U2 (Phase 9 đợt 39, luồng T3).
 *
 * VẤN ĐỀ GỐC (LIMITS đợt 38 U2 §5.1): cổng `reverseRangeGate38U2`
 * đã khóa bằng code + test nhưng CHƯA có code fetch nào gọi — mọi
 * claim "Range theo GOP" trước đợt này đều là nói quá. Module này là
 * code fetch đầu tiên gọi cổng đó, theo đúng hợp đồng đã khóa:
 * moov-trước + `Accept-Ranges: bytes` + đã biết size, và lần Range
 * đầu vẫn qua `checkRangeProbeResponse` (chỉ 206 + Content-Range
 * khớp đúng range mới tiếp tục).
 *
 * LUỒNG FETCH (mỗi bước thất bại đều rơi về "full-file", KHÔNG throw
 * ra ngoài trừ tham số đầu vào sai kiểu — xem `fetchVideoTrackByGopRange`):
 *   1. HEAD (best-effort): lấy `Accept-Ranges` + `Content-Length`.
 *      HEAD lỗi/không báo size thì KHÔNG chặn — size sẽ lấy từ
 *      Content-Range của probe ở bước 2 (hợp đồng R3: HEAD chỉ là
 *      gợi ý sớm, không phải cổng chặn). Đợt 42 X4: caller truyền
 *      `sharedSizeProbe` khớp size thì BỎ luôn HEAD này (dùng lại kết
 *      quả probe vừa đo trên cùng URL, không còn 2 HEAD trùng nhau).
 *   2. Probe Range nhỏ (0–1023, kẹp theo size đã biết): qua
 *      `checkRangeProbeResponse` nghiêm ngặt. Server trả 200 (phớt lờ
 *      Range), 206 lệch range/tổng, 416 đều → fallback, KHÔNG đọc
 *      body (body.cancel() best-effort để không nuốt cả file lớn).
 *   3. Fetch tiền tố (mặc định 512 KiB, kẹp theo size): quét box
 *      top-level → `detectMoovPosition`. mdat trước moov (trailing)
 *      hoặc không thấy moov → fallback (đúng cổng gate, không đoán
 *      moov ở cuối file).
 *   4. Cổng gate `resolveRangeGopFetch`: đủ 3 điều kiện mới được THỬ
 *      tiếp; thiếu 1 → fallback với đúng lý do gate trả về.
 *      Đợt 44 Z4 — phân giải moov cắt dở (xem `findTruncatedMoovHeader`):
 *      gate báo `unknown` CHỈ vì header moov nằm trong tiền tố nhưng
 *      box moov tràn tiền tố (moov > 512 KiB mặc định) thì T3 không
 *      kết luận fallback ngay: nếu không có box mdat nào đứng trước
 *      header moov đó (tức moov là box media đầu tiên → faststart đã
 *      chứng minh được từ thứ tự box), T3 kiểm tra lại gate với
 *      `faststart`, rồi fetch đúng range moov (kẹp bởi trần 16 MiB
 *      và tổng file) trước khi demux. Nhờ vậy nhánh fetch moov riêng
 *      + trần 16 MiB không còn là code chết như Y4 đã phát hiện.
 *      Moov cuối file (mdat khổng lồ trước moov, header moov không
 *      nằm trong tiền tố) vẫn fallback như cũ — không đoán moov ở
 *      đuôi file.
 *      Đợt 45 A4 — tail-scan (xem `gopTail45A4.ts`): nhánh `unknown`
 *      mà đường Z4 không cứu được (không thấy header moov trong tiền
 *      tố, hoặc header moov đứng sau một box mdat nằm gọn) thì T3
 *      thử fetch đuôi file và tìm moov trailing bằng 3 cửa kiểm tra
 *      (kết thúc đúng ở EOF + nằm gọn trong đuôi + payload parse
 *      thành cây box có mvhd/trak) trước khi kết luận fallback.
 *      Tail-scan CHỈ chạy từ nhánh `unknown` này: file trailing nhỏ
 *      mà gate đã kết luận `trailing` (moov nằm gọn trong tiền tố)
 *      vẫn fallback như cũ, và moov đã xác định được ở bước Z4 mà
 *      vượt trần/vượt tổng file cũng vẫn fallback ngay, không fetch
 *      đuôi thừa. Trần 128 MiB của wiring và trần moov 16 MiB giữ
 *      nguyên; cửa sổ đuôi mặc định = trần moov.
 *      Đợt 49 E2 — cửa vào tail-scan chấp nhận thêm BẰNG CHỨNG Range
 *      206 đã kiểm chứng (xem `rangeSupportEstablished` ở gate U2):
 *      probe + tiền tố đều đã qua `checkRangeProbeResponse` nghiêm
 *      ngặt TRƯỚC khi tới đây, nên thiếu header `Accept-Ranges`
 *      (vd blob: URL — Chrome không gửi header này, D4 §2.3) không
 *      còn chặn tail-scan; header khẳng định khác "bytes" (vd "none")
 *      vẫn chặn như cũ. Tail fetch sau đó vẫn tự kiểm chứng 206 qua
 *      `fetchRangeChecked`, nên bằng chứng sai ở đuôi vẫn fallback an
 *      toàn. Không có trường hợp riêng theo loại URL.
 *      Đợt 46 B4 — tail-scan chấp nhận thêm moov + hậu tố
 *      `free`/`skip`/`wide` parse sạch tới EOF (xem `gopTail45A4.ts`,
 *      `trailingSuffixValid`); hậu tố khác vẫn fallback. Hợp đồng
 *      gate U2 cho file trailing nhỏ GIỮ NGUYÊN (xem LIMITS B4 §4:
 *      file nhỏ không vào wiring production, và GOP cũng chỉ tiết
 *      kiệm được ~moov so với tải toàn file — đổi gate chỉ phá test
 *      khóa của U2/V2 mà không cứu được đường production nào).
 *      Đợt 47 C5 — tail-scan chấp nhận thêm hậu tố `udta` sau moov
 *      (metadata người dùng, không mang sample; xem
 *      `trailingSuffixValid`); hậu tố nằm ngoài cửa sổ đuôi 16 MiB
 *      (moov bắt đầu trước tailStart) vẫn fallback — QUYẾT GIỮ cửa
 *      sổ, xem LIMITS C5 §4 (đo thật + lý do).
 *   5. Demux mảnh: chỉ lấy đúng box moov (từ tiền tố, từ range moov
 *      đã fetch riêng ở bước 4 khi moov tràn tiền tố, hoặc fetch
 *      thêm đúng range moov nếu moov tràn tiền tố; moov > 16 MiB →
 *      fallback) rồi gọi `parseMp4VideoTrack` trên buffer CHỈ chứa
 *      moov. Được phép vì parser chỉ cần moov để dựng sample table,
 *      còn offset sample là tuyệt đối trong file nên không đổi.
 *   6. Chia GOP: sample keyframe mở đầu GOP mới; range của 1 GOP =
 *      [offset sample đầu, offset+size sample cuối]. Fetch từng GOP
 *      bằng Range, kiểm tra 206 + Content-Range khớp đúng range đã
 *      xin (lại qua `checkRangeProbeResponse`); GOP nào lỗi → toàn
 *      bộ fallback (không trả chunk nửa vời).
 *   7. Ghép cho decoder: mỗi sample cắt đúng bytes của nó ra khỏi
 *      buffer GOP (offset - rangeStart) rồi qua `sampleChunkInit`
 *      thành init của EncodedVideoChunk (type key/delta, timestamp
 *      presentation µs, duration µs, data AVCC length-prefixed, dùng
 *      trực tiếp không chuyển Annex B — như mp4Demux đã chốt).
 *      Đợt 50 F4 — streaming (`streamGops: true`, controller dùng):
 *      bước 6–7 KHÔNG chạy lượt đầu; T3 trả `gopMeta` (range mọi
 *      GOP, không chunk) + `gops: []` ngay sau demux, controller
 *      fetch từng GOP khi cửa sổ decode cần (fetchSingleGopRange +
 *      cache LRU ở gopCache40V2 / ensureWindowViaGop). Nhờ vậy đỉnh
 *      heap transient của T3 chỉ còn tiền tố + đuôi/moov thay vì
 *      tiền tố + đuôi + chunk mọi GOP (~kích thước file) — nợ
 *      E2 §7.1. Mặc định (`streamGops` vắng/false) giữ nguyên bước
 *      6–7 cũ để test hồi quy T3 không đổi ý nghĩa.
 *
 * GIỚI HẠN CỐ TÌNH (ghi rõ, không giấu):
 * - Chỉ file faststart + track video avc1 đầu tiên (kế thừa giới hạn
 *   của `parseMp4VideoTrack`): avc3, HEVC, fragmented (moof/mvex),
 *   nhiều track video đều → fallback (parse ném lỗi → fallback).
 * - File có track audio xen kẽ trong mdat: range GOP vẫn fetch cả
 *   byte audio nằm giữa các sample video (overhead ghi trong stats),
 *   sample video vẫn cắt đúng — không sai dữ liệu, chỉ tốn thêm byte.
 * - Module này CHƯA nối vào ReversePreviewController: controller vẫn
 *   tải toàn file theo hướng (b) đợt 35 R3. Nối controller là việc
 *   của luồng sở hữu preview (cần quyết thêm: ngưỡng nào thì dùng
 *   đường GOP thay vì tải toàn file, cache GOP ra sao) — module này
 *   chỉ chứng minh đường fetch GOP chạy thật end-to-end và fallback
 *   an toàn, để luồng đó nối mà không phải viết lại demux/fetch.
 * - Không xử lý redirect/auth/cookie: dùng fetch của caller (browser
 *   fetch mặc định) nên kế thừa đúng hành vi đó.
 */

import {
  checkRangeProbeResponse,
  detectMoovPosition,
  parseContentRange,
  rangeSupportEstablished,
  resolveRangeGopFetch,
} from "./reverseRangeGate38U2";
import { findTrailingMoov, tailRangeFor } from "./gopTail45A4";
import {
  parseMp4VideoTrack,
  sampleChunkInit,
} from "./mp4Demux";
import type { Mp4Sample, Mp4VideoTrack } from "./mp4Demux";

/** Response tối thiểu mà đường fetch này cần (tương thích fetch chuẩn). */
export interface GopRangeResponse {
  status: number;
  headers: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
  body?: { cancel(): Promise<void> } | null;
}

export type GopRangeFetchFn = (
  url: string,
  init?: { method?: string; headers?: Record<string, string> },
) => Promise<GopRangeResponse>;

/**
 * Đợt 50 F4 — meta 1 GOP (range + vị trí sample, KHÔNG giữ chunk).
 * Cùng hình dạng với GopMeta của gopCache40V2 (giữ 2 interface song
 * song để T3 không import ngược V2; V2 đã import type từ T3).
 * Controller dùng meta này để biết GOP nào giao cửa sổ decode rồi
 * fetch đúng GOP đó qua fetchSingleGopRange, thay vì T3 fetch mọi
 * GOP lượt đầu.
 */
export interface GopRangeMeta {
  index: number;
  firstSampleIndex: number;
  lastSampleIndex: number;
  rangeStart: number;
  rangeEnd: number;
}

/** Một GOP: đoạn sample decode liên tiếp từ 1 keyframe tới trước keyframe sau. */
export interface GopSegment {
  index: number;
  firstSampleIndex: number;
  lastSampleIndex: number;
  sampleCount: number;
  /** Byte-range đã fetch cho GOP này (đóng-mở: [rangeStart, rangeEnd)). */
  rangeStart: number;
  rangeEnd: number;
  /** Số byte server trả về cho range này (rangeEnd - rangeStart). */
  rangeBytes: number;
  /** Tổng size sample video thật trong GOP (nhỏ hơn rangeBytes nếu có audio xen kẽ). */
  sampleBytes: number;
  /** Init EncodedVideoChunk cho từng sample, theo thứ tự decode. */
  chunks: Array<{
    type: "key" | "delta";
    timestamp: number;
    duration: number;
    data: Uint8Array;
  }>;
}

/** Một request Range đã thực hiện (để test/debug đối chiếu, không phải log UI). */
export interface GopRangeRequestLog {
  kind: "head" | "probe" | "prefix" | "moov" | "tail" | "gop";
  start: number | null;
  end: number | null;
  status: number;
  bytes: number;
}

export type GopRangeOutcome =
  | {
      mode: "gop-range";
      track: Mp4VideoTrack;
      /**
       * Các segment ĐÃ fetch kèm chunk (mọi GOP ở mode all mặc định;
       * RỖNG ở mode stream — xem `streamGops`).
       */
      gops: GopSegment[];
      /**
       * Đợt 50 F4 — meta mọi GOP (range, không chunk), có ở cả 2 mode:
       * controller dùng nó để fetch đúng GOP giao cửa sổ khi cần.
       */
      gopMeta: GopRangeMeta[];
      sampleCount: number;
      /** Tổng byte Range THỰC TRẢ VỀ cho các GOP đã fetch (0 ở mode stream). */
      totalGopRangeBytes: number;
      /** Tổng sample byte THỰC trong các GOP đã fetch (0 ở mode stream). */
      totalSampleBytes: number;
      requests: GopRangeRequestLog[];
    }
  | {
      mode: "full-file";
      /** Lý do fallback (lý do gate, lý do probe, hay lỗi fetch/demux). */
      reason: string;
      requests: GopRangeRequestLog[];
    };

/**
 * Đợt 42 X4 — kết quả probe size mà caller vừa đo trên cùng URL
 * (module `gopSizeProbe41W4`), truyền vào để T3 khỏi HEAD lại lần nữa.
 * Chỉ được dùng khi size hợp lệ VÀ khớp `knownSizeBytes` nếu caller có
 * truyền size đó (không khớp → probe bị bỏ qua, T3 HEAD lại như cũ —
 * không tin một size lạ hơn size caller đã biết). `acceptRanges` null
 * hoặc vắng nghĩa là "probe không thu được header này", T3 vẫn lấy từ
 * header tiền tố như cũ; không phải "server không hỗ trợ Range".
 */
export interface GopSharedSizeProbe {
  size: number;
  acceptRanges?: string | null;
}

export interface GopRangeFetchOptions {
  /** Hàm fetch của caller; mặc định global fetch (browser/Node 18+). */
  fetchImpl?: GopRangeFetchFn;
  /** Size đã biết trước (vd proxySizeBytes); vắng thì lấy từ HEAD/probe. */
  knownSizeBytes?: number | null;
  /** Đợt 42 X4 — probe size vừa đo trên cùng URL (xem trên); vắng thì HEAD như cũ. */
  sharedSizeProbe?: GopSharedSizeProbe | null;
  /** Số byte tiền tố fetch để quét moov (mặc định 512 KiB). */
  prefixBytes?: number;
  /** Trần kích thước moov được fetch riêng (mặc định 16 MiB); quá → fallback. */
  maxMoovBytes?: number;
  /**
   * Đợt 45 A4 — số byte đuôi file fetch cho tail-scan khi nhánh moov
   * `unknown` không cứu được bằng đường Z4 (mặc định = maxMoovBytes,
   * và luôn bị kẹp về maxMoovBytes: cửa sổ lớn hơn moov lớn nhất mà
   * ta chịu fetch thì không giúp tìm thêm moov nào chấp nhận được).
   */
  tailScanBytes?: number;
  /**
   * Đợt 50 F4 — streaming: true = chỉ demux + trả meta mọi GOP,
   * KHÔNG fetch byte GOP nào lượt đầu (đỉnh heap transient của T3
   * khi đó chỉ còn tiền tố + đuôi/moov, không còn chunk mọi GOP
   * ~kích thước file — nợ E2 §7.1). Controller fetch từng GOP khi
   * cửa sổ decode cần, qua fetchSingleGopRange + cache LRU hiện có
   * (gopCache40V2). false (mặc định) = hành vi cũ: fetch mọi GOP
   * lượt đầu; test hồi quy T3 khóa mặc định này.
   */
  streamGops?: boolean;
}

interface TopBox {
  type: string;
  start: number;
  size: number;
  header: number;
}

/** Quét box top-level trong tiền tố (cùng luật với gate: size==1 → largesize). */
export function scanTopBoxes(prefix: Uint8Array): TopBox[] {
  const view = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);
  const boxes: TopBox[] = [];
  let off = 0;
  while (off + 8 <= prefix.length) {
    let size = view.getUint32(off);
    const type = String.fromCharCode(
      view.getUint8(off + 4),
      view.getUint8(off + 5),
      view.getUint8(off + 6),
      view.getUint8(off + 7),
    );
    let header = 8;
    if (size === 1) {
      if (off + 16 > prefix.length) break;
      const big = view.getBigUint64(off + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      size = prefix.length - off;
    }
    if (size < header || off + size > prefix.length) break;
    boxes.push({ type, start: off, size, header });
    off += size;
  }
  return boxes;
}

/**
 * Đợt 44 Z4 — header của box moov bị cắt dở ở cuối tiền tố.
 *
 * BỐI CẢNH (phát hiện Y4 §3.3): `detectMoovPosition` và `scanTopBoxes`
 * đều DỪNG ở box cắt dở mà chưa đánh dấu gì, nên với tiền tố mặc định
 * 512 KiB, mọi moov > 512 KiB đều cho gate `unknown` và fallback
 * trước khi T3 kịp tới nhánh fetch moov riêng hay trần 16 MiB.
 * Helper này phân biệt "moov thật sự không thấy" với "header moov đã
 * thấy, chỉ thiếu phần thân": nó quét box top-level như scanner cũ,
 * nhưng khi gặp box moov mà `start + size > prefix.length` (box tràn
 * tiền tố) thì TRẢ VỀ header đó thay vì dừng tay không.
 *
 * Tính chất an toàn (để caller khỏi đoán):
 * - Chỉ trả về khi header moov (8 byte, hoặc 16 byte largesize) nằm
 *   GỌN trong tiền tố — header tự nó bị cắt ở cuối tiền tố thì trả
 *   null (không đọc size từ header dở).
 * - `precededByMdat = true` khi có box mdat (nằm gọn) đứng trước moov
 *   trong tiền tố: đó là moov cuối file, KHÔNG được dùng đường fetch
 *   moov riêng (moov sau mdat thì thứ tự faststart không còn đúng).
 * - Mọi box trước moov mà bị cắt dở (kể cả mdat khổng lồ) đều cho
 *   null: header moov khi đó không nằm trong tiền tố nên không có
 *   gì để fetch — trường hợp moov cuối file thật vẫn fallback.
 * - Moov nằm gọn trong tiền tố cũng trả null: đường cũ đã xử lý,
 *   helper này chỉ phục vụ trường hợp tràn tiền tố.
 * - Box `size == 0` (kéo tới hết tiền tố) cũng trả null: moov thì
 *   không giới hạn được range fetch, box khác thì moov không thể nằm
 *   sau nó trong tiền tố.
 */
export interface TruncatedMoovHeader {
  /** Offset bắt đầu box moov trong file (= offset trong tiền tố). */
  start: number;
  /** Kích thước box moov khai trong header (32-bit hoặc largesize). */
  size: number;
  /** Độ dài header (8, hoặc 16 khi largesize). */
  header: number;
  /** Có box mdat nào (nằm gọn) đứng trước moov trong tiền tố không. */
  precededByMdat: boolean;
}

export function findTruncatedMoovHeader(prefix: Uint8Array): TruncatedMoovHeader | null {
  const view = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);
  let off = 0;
  let precededByMdat = false;
  while (off + 8 <= prefix.length) {
    let size = view.getUint32(off);
    const type = String.fromCharCode(
      view.getUint8(off + 4),
      view.getUint8(off + 5),
      view.getUint8(off + 6),
      view.getUint8(off + 7),
    );
    let header = 8;
    if (size === 1) {
      if (off + 16 > prefix.length) return null;
      const big = view.getBigUint64(off + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      return null;
    }
    if (size < header) return null;
    if (type === "moov") {
      if (off + size <= prefix.length) return null;
      return { start: off, size, header, precededByMdat };
    }
    if (type === "mdat") precededByMdat = true;
    if (off + size > prefix.length) return null;
    off += size;
  }
  return null;
}

/**
 * Chia sample table thành GOP: keyframe mở GOP mới. File không có
 * keyframe nào (stss vắng thì demux đã coi mọi sample là key) vẫn
 * chia được — mỗi sample 1 GOP, không phải lỗi.
 */
export function gopRangesFor(
  samples: Mp4Sample[],
): Array<{
  firstSampleIndex: number;
  lastSampleIndex: number;
  rangeStart: number;
  rangeEnd: number;
  sampleBytes: number;
}> {
  const gops: Array<{
    firstSampleIndex: number;
    lastSampleIndex: number;
    rangeStart: number;
    rangeEnd: number;
    sampleBytes: number;
  }> = [];
  let start = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].isKey && i > start) {
      gops.push(finishGop(samples, start, i - 1));
      start = i;
    }
  }
  if (samples.length > 0) gops.push(finishGop(samples, start, samples.length - 1));
  return gops;
}

function finishGop(
  samples: Mp4Sample[],
  first: number,
  last: number,
): {
  firstSampleIndex: number;
  lastSampleIndex: number;
  rangeStart: number;
  rangeEnd: number;
  sampleBytes: number;
} {
  let rangeStart = samples[first].offset;
  let rangeEnd = samples[first].offset + samples[first].size;
  let sampleBytes = 0;
  for (let i = first; i <= last; i++) {
    rangeStart = Math.min(rangeStart, samples[i].offset);
    rangeEnd = Math.max(rangeEnd, samples[i].offset + samples[i].size);
    sampleBytes += samples[i].size;
  }
  return { firstSampleIndex: first, lastSampleIndex: last, rangeStart, rangeEnd, sampleBytes };
}

class GopRangeFailure extends Error {}

/** Hủy body best-effort (để không nuốt body file lớn khi đã quyết fallback). */
async function cancelBody(resp: GopRangeResponse): Promise<void> {
  try {
    await resp.body?.cancel();
  } catch {
    /* bỏ qua */
  }
}

/**
 * Fetch 1 range và kiểm tra nghiêm ngặt bằng cổng gate: chỉ 206 +
 * Content-Range khớp ĐÚNG range đã xin (+ khớp tổng đã biết) mới
 * nhận body; còn lại → GopRangeFailure (caller chuyển thành fallback).
 */
async function fetchRangeChecked(
  fetchImpl: GopRangeFetchFn,
  url: string,
  start: number,
  end: number,
  knownTotal: number | null,
  kind: "probe" | "prefix" | "moov" | "tail" | "gop",
  requests: GopRangeRequestLog[],
): Promise<Uint8Array> {
  const resp = await fetchImpl(url, {
    headers: { Range: `bytes=${start}-${end}` },
  });
  if (resp.status !== 206) {
    requests.push({ kind, start, end, status: resp.status, bytes: 0 });
    await cancelBody(resp);
    throw new GopRangeFailure(
      `${kind}-status-${resp.status}: server không trả 206 cho Range ${start}-${end}`,
    );
  }
  const contentRange = resp.headers.get("content-range");
  const check = checkRangeProbeResponse(
    resp.status,
    contentRange,
    { start, end },
    knownTotal,
  );
  if (check.outcome !== "range-ok") {
    requests.push({ kind, start, end, status: resp.status, bytes: 0 });
    await cancelBody(resp);
    throw new GopRangeFailure(`${kind}-${check.reason}`);
  }
  const buf = new Uint8Array(await resp.arrayBuffer());
  requests.push({ kind, start, end, status: resp.status, bytes: buf.length });
  if (buf.length !== end - start + 1) {
    throw new GopRangeFailure(
      `${kind}-short-body: xin ${end - start + 1} byte, nhận ${buf.length}`,
    );
  }
  return buf;
}

/**
 * Fetch track video theo GOP bằng Range; thất bại ở bất kỳ bước nào
 * (HEAD lỗi thì không tính — xem header) → `{ mode: "full-file" }`
 * để caller dùng đường tải toàn file cũ. Không bao giờ throw vì lỗi
 * mạng/server/demux; chỉ throw khi `url` không phải string rỗng-hoặc-
 * hợp lệ hoặc option số không hợp lệ (lỗi lập trình của caller).
 */
export async function fetchVideoTrackByGopRange(
  url: string,
  opts: GopRangeFetchOptions = {},
): Promise<GopRangeOutcome> {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("fetchVideoTrackByGopRange: url phải là string không rỗng");
  }
  const prefixBytes = opts.prefixBytes ?? 512 * 1024;
  const maxMoovBytes = opts.maxMoovBytes ?? 16 * 1024 * 1024;
  // ROUND45-A4: cửa sổ đuôi mặc định = trần moov, kẹp về trần moov.
  const tailScanBytes =
    opts.tailScanBytes === undefined
      ? maxMoovBytes
      : Math.min(opts.tailScanBytes, maxMoovBytes);
  if (!(prefixBytes > 0) || !(maxMoovBytes > 0) || !(tailScanBytes > 0)) {
    throw new TypeError("fetchVideoTrackByGopRange: prefixBytes/maxMoovBytes/tailScanBytes phải > 0");
  }
  const fetchImpl: GopRangeFetchFn =
    opts.fetchImpl ??
    ((u, init) => fetch(u, init) as unknown as Promise<GopRangeResponse>);
  const requests: GopRangeRequestLog[] = [];
  const fallback = (reason: string): GopRangeOutcome => ({
    mode: "full-file",
    reason,
    requests,
  });
  try {
    // 1. HEAD best-effort: chỉ lấy header, lỗi thì bỏ qua.
    // Đợt 42 X4 — bỏ HEAD khi caller vừa probe cùng URL và size khớp:
    // size + Accept-Ranges của probe đã đủ cho gate, HEAD lại chỉ tốn
    // thêm 1 request (nợ W4 §5.5). Không khớp / không hợp lệ → HEAD
    // lại như cũ, không tin size lạ.
    let acceptRanges: string | null | undefined;
    let knownSize: number | null =
      typeof opts.knownSizeBytes === "number" &&
      Number.isFinite(opts.knownSizeBytes) &&
      opts.knownSizeBytes > 0
        ? opts.knownSizeBytes
        : null;
    const shared = opts.sharedSizeProbe ?? null;
    const sharedValid =
      shared !== null &&
      Number.isFinite(shared.size) &&
      shared.size > 0 &&
      (knownSize === null || knownSize === shared.size);
    if (sharedValid && shared !== null) {
      knownSize = shared.size;
      if (typeof shared.acceptRanges === "string") {
        acceptRanges = shared.acceptRanges;
      }
      // acceptRanges null/vắng → để undefined, bước tiền tố sẽ điền
      // như khi HEAD không báo header đó.
    } else {
      try {
        const head = await fetchImpl(url, { method: "HEAD" });
        requests.push({
          kind: "head",
          start: null,
          end: null,
          status: head.status,
          bytes: 0,
        });
        if (head.status >= 200 && head.status < 300) {
          acceptRanges = head.headers.get("accept-ranges");
          const len = head.headers.get("content-length");
          const n = len === null ? NaN : Number(len);
          if (knownSize === null && Number.isFinite(n) && n > 0) knownSize = n;
        }
        await cancelBody(head);
      } catch {
        /* HEAD lỗi → tiếp tục, size lấy từ probe */
      }
    }

    // 2. Probe Range nhỏ, kiểm tra nghiêm ngặt bằng cổng gate.
    const probeEnd = knownSize !== null ? Math.min(1023, knownSize - 1) : 1023;
    if (probeEnd < 0) return fallback("size-too-small: file nhỏ hơn 1 byte, không cần Range");
    // Probe chỉ chứng minh server HỖ TRỢ Range thật (206 khớp range);
    // size và Accept-Ranges còn thiếu sẽ lấy từ response tiền tố ở
    // bước 3 — không fetch thừa 1 lần nữa chỉ để đọc header probe.
    // Đợt 49 E2 — probe + tiền tố đều qua kiểm chứng nghiêm ngặt thì
    // cờ rangeProvenByVerifiedProbe được bật: đó là BẰNG CHỨNG Range
    // đã đo trên đúng URL này (thay cho header Accept-Ranges VẮNG —
    // vd blob: URL — ở gate và cửa tail-scan), không phải giả định.
    // Cờ CHỈ bật sau khi cả hai đều pass; bước nào hỏng cũng đã
    // fallback trước khi tới gate, nên gate không bao giờ nhận cờ
    // true trên bằng chứng chưa kiểm chứng.
    let rangeProvenByVerifiedProbe = false;
    await fetchRangeChecked(
      fetchImpl,
      url,
      0,
      probeEnd,
      knownSize,
      "probe",
      requests,
    );

    // 3. Tiền tố: quét moov. End kẹp theo size đã biết (nếu có).
    const prefixEnd =
      knownSize !== null ? Math.min(prefixBytes, knownSize) - 1 : prefixBytes - 1;
    // Cần header của prefix (Accept-Ranges + Content-Range tổng) nên
    // fetch trực tiếp thay vì qua fetchRangeChecked, rồi vẫn kiểm tra
    // bằng đúng cổng gate trước khi đọc body.
    const prefixResp = await fetchImpl(url, {
      headers: { Range: `bytes=0-${prefixEnd}` },
    });
    if (prefixResp.status !== 206) {
      requests.push({ kind: "prefix", start: 0, end: prefixEnd, status: prefixResp.status, bytes: 0 });
      await cancelBody(prefixResp);
      return fallback(
        `prefix-status-${prefixResp.status}: server không trả 206 cho Range tiền tố`,
      );
    }
    const prefixContentRange = prefixResp.headers.get("content-range");
    // Chưa biết size (HEAD lỗi) mà file nhỏ hơn tiền tố: server kẹp
    // end về total-1 — đó KHÔNG phải lỗi Range, mà là cuối file.
    // Chấp nhận end đã kẹp (và lấy tổng từ đó) thay vì fallback oan.
    let effectivePrefixEnd = prefixEnd;
    if (knownSize === null) {
      const parsed = parseContentRange(prefixContentRange);
      if (parsed && parsed.start === 0 && parsed.end === parsed.total - 1) {
        knownSize = parsed.total;
        effectivePrefixEnd = parsed.end;
      }
    }
    const prefixCheck = checkRangeProbeResponse(
      prefixResp.status,
      prefixContentRange,
      { start: 0, end: effectivePrefixEnd },
      knownSize,
    );
    if (prefixCheck.outcome !== "range-ok") {
      requests.push({ kind: "prefix", start: 0, end: prefixEnd, status: prefixResp.status, bytes: 0 });
      await cancelBody(prefixResp);
      return fallback(`prefix-${prefixCheck.reason}`);
    }
    // Đợt 49 E2 — probe (bước 2, qua fetchRangeChecked) + tiền tố
    // (vừa qua checkRangeProbeResponse) đều là 206 khớp đúng range
    // đã xin: Range đã được CHỨNG MINH trên URL này.
    rangeProvenByVerifiedProbe = true;
    if (acceptRanges === undefined || acceptRanges === null) {
      acceptRanges = prefixResp.headers.get("accept-ranges");
    }
    const prefix = new Uint8Array(await prefixResp.arrayBuffer());
    requests.push({ kind: "prefix", start: 0, end: prefixEnd, status: prefixResp.status, bytes: prefix.length });
    if (prefix.length !== effectivePrefixEnd + 1) {
      return fallback(
        `prefix-short-body: xin ${effectivePrefixEnd + 1} byte, nhận ${prefix.length}`,
      );
    }

    // 4. Vị trí moov + cổng gate (lần đầu tiên gate được code fetch gọi).
    const moovPosition = detectMoovPosition(prefix);
    const decision = resolveRangeGopFetch({
      moovPosition,
      acceptRanges,
      knownSizeBytes: knownSize,
      rangeProvenByVerifiedProbe,
    });
    // ROUND44-Z4 — phân giải moov cắt dở trước khi kết luận fallback:
    // gate `unknown` có thể chỉ vì header moov nằm trong tiền tố nhưng
    // box moov tràn tiền tố (moov > tiền tố mặc định). Khi đó, nếu
    // không có box mdat nào đứng trước header moov (tức moov là box
    // media đầu tiên — thứ tự box trước header moov đều nằm gọn trong
    // tiền tố nên kết luận faststart này là chứng minh, không phải
    // đoán), T3 kiểm tra lại gate với `faststart` rồi mới fetch đúng
    // range moov (kẹp bởi trần maxMoovBytes và tổng file). Thứ tự
    // kiểm tra giữ nguyên như đường cũ: gate trước (Accept-Ranges,
    // size), rồi trần moov, rồi tính nhất quán với tổng file, rồi
    // mới fetch — không fetch moov khi gate khác đã chặn. Moov cuối
    // file (header moov không nằm trong tiền tố, hoặc mdat đứng
    // trước) vẫn rơi về fallback gate như cũ.
    let moovFetched: Uint8Array | null = null;
    if (decision.mode !== "range-gop-attempt" && moovPosition === "unknown") {
      const truncated = findTruncatedMoovHeader(prefix);
      if (truncated !== null && !truncated.precededByMdat) {
        const faststartDecision = resolveRangeGopFetch({
          moovPosition: "faststart",
          acceptRanges,
          knownSizeBytes: knownSize,
          rangeProvenByVerifiedProbe,
        });
        if (faststartDecision.mode !== "range-gop-attempt") {
          return fallback(`gate: ${faststartDecision.reasons.join("; ")}`);
        }
        if (truncated.size > maxMoovBytes) {
          return fallback(`moov-too-large: moov ${truncated.size} byte vượt trần ${maxMoovBytes}`);
        }
        if (knownSize !== null && truncated.start + truncated.size > knownSize) {
          return fallback(
            `moov-out-of-file: moov ${truncated.start}+${truncated.size} vượt tổng ${knownSize}`,
          );
        }
        moovFetched = await fetchRangeChecked(
          fetchImpl,
          url,
          truncated.start,
          truncated.start + truncated.size - 1,
          knownSize,
          "moov",
          requests,
        );
      } else {
        // ROUND45-A4 — tail-scan, CHỈ khi đường Z4 không áp dụng:
        // không thấy header moov trong tiền tố (mdat khổng lồ cắt dở
        // — trường hợp moov cuối file thật), hoặc header moov đứng
        // sau một box mdat nằm gọn (cũng là trailing, Z4 từ chối
        // đúng vì chứng minh faststart không còn đúng — nhưng
        // tail-scan có chứng minh riêng của nó: moov kết thúc ở EOF
        // + payload parse thành cây box, nên vẫn được thử). Các
        // nhánh Z4 đã xác định moov mà thất bại (gate chặn, vượt
        // trần, vượt tổng) thì return ngay ở trên, không fetch đuôi
        // thừa — moov đó có tail-scan cũng cho cùng kết luận.
        // Lý do fallback giữ nguyên phần gate cũ rồi mới nối kết quả
        // tail-scan, để test cũ bắt /moov-unknown/ vẫn xanh.
        const gateReason = `gate: ${decision.reasons.join("; ")}`;
        // Tail-scan cũng cần Range thật + đã biết size (để tính range
        // đuôi); thiếu một trong hai thì giữ nguyên fallback gate,
        // không tốn thêm request đuôi. Đợt 49 E2 — "Range thật" ở đây
        // là `rangeSupportEstablished`: header "bytes" HOẶC header
        // vắng + probe/prefix 206 đã kiểm chứng (vd blob: URL);
        // header khẳng định khác "bytes" vẫn chặn.
        if (!rangeSupportEstablished(acceptRanges, rangeProvenByVerifiedProbe) || knownSize === null) {
          return fallback(gateReason);
        }
        const tailRange = tailRangeFor(knownSize, tailScanBytes);
        if (tailRange === null) {
          return fallback(gateReason);
        }
        let tailBuf: Uint8Array;
        try {
          tailBuf = await fetchRangeChecked(
            fetchImpl,
            url,
            tailRange.start,
            tailRange.end,
            knownSize,
            "tail",
            requests,
          );
        } catch (e) {
          return fallback(`${gateReason}; tail-scan: ${(e as Error).message}`);
        }
        const tailResult = findTrailingMoov(tailBuf, knownSize, { maxMoovBytes });
        if (!tailResult.found) {
          return fallback(`${gateReason}; tail-scan: ${tailResult.reason}`);
        }
        const cand = tailResult.candidate;
        moovFetched = tailBuf.slice(
          cand.start - tailResult.tailStart,
          cand.start - tailResult.tailStart + cand.size,
        );
      }
    } else if (decision.mode !== "range-gop-attempt") {
      return fallback(`gate: ${decision.reasons.join("; ")}`);
    }

    // 5. Demux mảnh: lấy đúng box moov.
    // ROUND44-Z4: moov đã fetch riêng ở bước 4 thì dùng luôn buffer
    // đó; còn lại giữ nguyên đường cũ (moov trong tiền tố, hoặc fetch
    // thêm nếu tràn — nhánh cũ vẫn giữ làm đai an toàn dù scanTopBoxes
    // thực tế không bao giờ tìm thấy box tràn).
    let moovBytes: Uint8Array;
    if (moovFetched !== null) {
      moovBytes = moovFetched;
    } else {
      const boxes = scanTopBoxes(prefix);
      const moovBox = boxes.find((b) => b.type === "moov") ?? null;
      if (!moovBox) {
        // Gate đã kết luận faststart nên moov phải có trong tiền tố;
        // không thấy nghĩa là tiền tố quét khác gate — fallback an toàn.
        return fallback("moov-missing-after-gate: gate báo faststart nhưng không tìm thấy box moov");
      }
      if (moovBox.size > maxMoovBytes) {
        return fallback(`moov-too-large: moov ${moovBox.size} byte vượt trần ${maxMoovBytes}`);
      }
      if (moovBox.start + moovBox.size <= prefix.length) {
        moovBytes = prefix.slice(moovBox.start, moovBox.start + moovBox.size);
      } else {
        moovBytes = await fetchRangeChecked(
          fetchImpl,
          url,
          moovBox.start,
          moovBox.start + moovBox.size - 1,
          knownSize,
          "moov",
          requests,
        );
      }
    }
    // Buffer mới chỉ chứa moov (copy để ArrayBuffer không dính tiền tố).
    const moovBuf = new Uint8Array(moovBytes).buffer as ArrayBuffer;
    let track: Mp4VideoTrack;
    try {
      track = parseMp4VideoTrack(moovBuf);
    } catch (e) {
      return fallback(`demux-moov: ${(e as Error).message}`);
    }
    if (track.samples.length === 0) {
      return fallback("demux-moov: track không có sample");
    }

    // 6+7. Fetch từng GOP + ghép chunk cho decoder.
    // Đợt 50 F4 — meta mọi GOP (không chunk) có ở cả 2 mode; mode
    // stream trả ngay tại đây: T3 không fetch byte GOP nào lượt đầu,
    // controller fetch GOP của cửa sổ khi cần (pre-resolve trong
    // ensureWindowViaGop). Mode all giữ nguyên vòng fetch bên dưới.
    const gopDefs = gopRangesFor(track.samples);
    const gopMeta: GopRangeMeta[] = gopDefs.map((d, i) => ({
      index: i,
      firstSampleIndex: d.firstSampleIndex,
      lastSampleIndex: d.lastSampleIndex,
      rangeStart: d.rangeStart,
      rangeEnd: d.rangeEnd,
    }));
    if (opts.streamGops === true) {
      return {
        mode: "gop-range",
        track,
        gops: [],
        gopMeta,
        sampleCount: track.samples.length,
        totalGopRangeBytes: 0,
        totalSampleBytes: 0,
        requests,
      };
    }
    const gops: GopSegment[] = [];
    let totalGopRangeBytes = 0;
    let totalSampleBytes = 0;
    for (let gi = 0; gi < gopDefs.length; gi++) {
      const def = gopDefs[gi];
      if (knownSize !== null && def.rangeEnd > knownSize) {
        return fallback(
          `gop-${gi}-out-of-file: rangeEnd ${def.rangeEnd} vượt tổng ${knownSize}`,
        );
      }
      const gopBuf = await fetchRangeChecked(
        fetchImpl,
        url,
        def.rangeStart,
        def.rangeEnd - 1,
        knownSize,
        "gop",
        requests,
      );
      const chunks: GopSegment["chunks"] = [];
      for (let si = def.firstSampleIndex; si <= def.lastSampleIndex; si++) {
        const s = track.samples[si];
        const rel = s.offset - def.rangeStart;
        if (rel < 0 || rel + s.size > gopBuf.length) {
          return fallback(
            `gop-${gi}-sample-out-of-range: sample ${si} nằm ngoài buffer GOP đã fetch`,
          );
        }
        const data = gopBuf.slice(rel, rel + s.size);
        chunks.push(sampleChunkInit(track, s, data));
      }
      totalGopRangeBytes += def.rangeEnd - def.rangeStart;
      totalSampleBytes += def.sampleBytes;
      gops.push({
        index: gi,
        firstSampleIndex: def.firstSampleIndex,
        lastSampleIndex: def.lastSampleIndex,
        sampleCount: def.lastSampleIndex - def.firstSampleIndex + 1,
        rangeStart: def.rangeStart,
        rangeEnd: def.rangeEnd,
        rangeBytes: def.rangeEnd - def.rangeStart,
        sampleBytes: def.sampleBytes,
        chunks,
      });
    }
    return {
      mode: "gop-range",
      track,
      gops,
      gopMeta,
      sampleCount: track.samples.length,
      totalGopRangeBytes,
      totalSampleBytes,
      requests,
    };
  } catch (e) {
    if (e instanceof GopRangeFailure) return fallback(e.message);
    return fallback(`exception: ${(e as Error).message}`);
  }
}
