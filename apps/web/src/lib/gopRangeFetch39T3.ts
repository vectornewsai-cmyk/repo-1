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
 *      Đợt 51 H4 — tail-scan streaming (`fetchTrailingMoovChunked`):
 *      đuôi không fetch một lần cả cửa sổ 16 MiB nữa mà lấy theo
 *      chunk từ EOF lùi về, gấp đôi mỗi lần (2 → 4 → 8 → 16 MiB),
 *      dừng khi tìm thấy moov + xác nhận bằng 1 chunk nữa; moov
 *      24 KiB ở cuối fixture 37 MiB chỉ cần 4 MiB đuôi thay vì
 *      16,7 MiB. Mọi chunk vẫn qua kiểm chứng 206 nghiêm ngặt như cũ.
 *   5. Demux mảnh: chỉ lấy đúng box moov (từ tiền tố, từ range moov
 *      đã fetch riêng ở bước 4 khi moov tràn tiền tố, hoặc fetch
 *      thêm đúng range moov nếu moov tràn tiền tố; moov > 16 MiB →
 *      fallback) rồi gọi `parseMp4VideoTrack` trên buffer CHỈ chứa
 *      moov. Được phép vì parser chỉ cần moov để dựng sample table,
 *      còn offset sample là tuyệt đối trong file nên không đổi.
 *      Đợt 52 I6 — sau demux, kiểm tra mọi sample offset+size nằm
 *      trong tổng file đã biết (moov giả lồng trong moov thật có thể
 *      qua tail-scan + demux nhưng sample table trỏ ngoài file — đo
 *      thật ở LIMITS I6 §2); sample nào vượt thì fallback rõ ràng
 *      thay vì trả meta sai cho controller ở stream-mode.
 *      Đợt 53 J6 — thêm 2 lớp chặn moov giả trỏ VÀO TRONG file (nợ I6
 *      §2.4): (a) stco-khớp-mdat — mọi sample phải nằm gọn trong một
 *      box mdat đã biết từ tiền tố (`mdatRangesInPrefix`); (b) kiểm
 *      AVCC sample đầu (`validateAvccSample` trong mp4Demux.ts) —
 *      stream-mode fetch riêng sample đầu (tối đa 256 KiB, kind
 *      "sample"), all-mode kiểm từ buffer GOP 0 vừa fetch. Moov giả
 *      trỏ đúng vào byte H.264 thật vẫn qua được — decoder +
 *      controller fallback là cửa cuối (ghi rõ trong LIMITS J6).
 *      Đợt 54 K8 — thêm lớp (c) bố cục sample + nhất quán bảng
 *      (`validateSampleLayout` + ctts-total == stsz + stss trong
 *      [1, sampleCount]): bắt moov giả trỏ mọi sample về cùng offset,
 *      đảo thứ tự chunk, khai offset ngẫu nhiên, hay bảng ctts/stss
 *      lệch — mà không cần fetch thêm byte nào. Moov giả sao chép y
 *      nguyên bảng sample thật nhưng sửa timestamp thì vẫn qua được
 *      lớp này (xem LIMITS K8 §3).
 *      Đợt 55 L8 — nối trial-decode VideoDecoder vào SAU lớp K8 +
 *      kiểm AVCC sample đầu (xem `gopTrialDecode55L8.ts`): probe
 *      inject được, fail-open khi không có decoder/lỗi/timeout; chỉ
 *      decoder báo lỗi thật mới fallback full-file. Bắt đúng lớp moov
 *      giả tinh vi "AVCC-đúng-cấu-trúc nhưng H.264-rác" mà AVCC +
 *      K8 bỏ lọt (K8 §3.1 case B: decoder lỗi trong 0,5 ms, sample
 *      thật decode OK 15,5 ms). Stream-mode chỉ chạy khi sample 0 ≤
 *      cap fetch 256 KiB (đủ sample); all-mode chạy trên toàn bộ
 *      sample 0 trong GOP 0 (không cap).
 *      Đợt 56 M10 — (a) thêm lớp kiểm timestamp stts
 *      (`validateSampleTimestamps` trong mp4Demux.ts: đối chiếu stts
 *      với mdhd/mvhd + hình dạng delta) sau lớp K8, áp cả 2 mode —
 *      bắt moov giả sửa timestamp mà K8 + AVCC + trial-decode đều bỏ
 *      lọt; (b) stream-mode fetch thêm đúng phần còn lại của sample 0
 *      khi 256 KiB < s0.size ≤ 2 MiB rồi mới trial-decode; (c) probe
 *      trả "unsupported-config" (decoder không hỗ trợ profile, vd
 *      High 4:4:4) thì fail-open, không chặn oan.
 *      Đợt 57 N10 — (b) nâng tiếp: cap 2 MiB → 8 MiB, phần còn lại
 *      của sample 0 fetch theo chunk 512 KiB rồi ráp lại (xem
 *      `fetchSampleRemainderChunked`); sample > 8 MiB vẫn bỏ qua.
 *      Đợt 59 P6 — nâng tiếp: cap 8 MiB → 32 MiB, tối đa 64 chunk;
 *      sample > 32 MiB vẫn bỏ qua (timeout trần 2500 ms của O6 giữ
 *      nguyên — keyframe thật ≳16 MiB vẫn timeout → fail-open).
 *      Đợt 60 Q5 — nâng tiếp: cap 32 MiB → 64 MiB, tối đa 128 chunk;
 *      sample > 64 MiB vẫn bỏ qua; probe null thì KHÔNG fetch
 *      remainder nữa (đóng nợ N10 §6.2 — trước đây caller tắt
 *      trial-decode vẫn trả phí fetch chunked tới 32 MiB). Timeout
 *      trần 2500 ms của O6 giữ nguyên — keyframe thật ≳16 MiB vẫn
 *      timeout → fail-open; phần chặn được thêm chỉ là rác lớn trong
 *      (32, 64] MiB (fail trong ~ms).
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
import type { TailMoovCandidate } from "./gopTail45A4";
import {
  parseMp4VideoTrack,
  sampleChunkInit,
  validateAvccSample,
  validateSampleLayout,
  validateSampleTimestamps,
} from "./mp4Demux";
import type { Mp4Sample, Mp4VideoTrack } from "./mp4Demux";
import {
  createBrowserTrialDecodeProbe,
  DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  isTrialDecodeTimeoutReason,
  runTrialDecode,
  scanAvccZeroRun,
  trialDecodeConfigFromTrack,
} from "./gopTrialDecode55L8";
import type { GopTrialDecodeProbe, TrialDecodeResult } from "./gopTrialDecode55L8";
import { planTrialDecodeCall } from "./gopTrialDecodeWorker62R4";
// Đợt 71 Y5 — registry run trial-decode đang chạy (cho toast trạng
// thái khi trial lâu): begin trước runTrialDecode, end trong finally.
// Đợt 72 Z5 — thêm begin/update/mark cho GIAI ĐOẠN FETCH remainder:
// run nay bắt đầu TỪ LÚC fetch (toast "đang tải keyframe…" với tiến
// độ thật theo chunk), rồi chuyển sang phase decode khi fetch xong.
import {
  beginTrialDecodeRun,
  beginTrialFetchRun,
  endTrialDecodeRun,
  markTrialDecodeStarted,
  updateTrialFetchProgress,
} from "./trialDecodeRunning71Y5";

/**
 * Đợt 60 Q4 — lookup i18n tùy chọn (mẫu projectRepo.ts đợt 56 M5: file
 * này được test bằng Node nên KHÔNG import `../i18n` trực tiếp).
 * Khi `lookup` vắng → fallback đúng từng chữ chuỗi VI cũ nên test cũ +
 * hành vi mặc định không đổi; UI (preview.tsx → ReversePreviewController)
 * truyền `t()` xuống qua `GopRangeFetchOptions.lookup`. Đợt 61 R6 —
 * các lý do Q4 còn để thô (gate, checkRangeProbe, `size-too-small`,
 * `moov-missing-after-gate`, `demux-moov: track không có sample`,
 * `demux-moov: sample 0 rỗng`) nay đi qua key `gop.gate.*` /
 * `gop.probe.*` / `gop.range.*` trong fragment R6; `demux-moov:
 * <lỗi parser>` nay nhúng message parser đã dịch (mp4Demux nhận
 * lookup). Còn giữ thô, có lý do: `exception: ...`, `tail-scan:
 * <message>` (message động từ fetch/parser — xem LIMITS R6 §2.4).
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

/**
 * Đợt 65 S6 — ghi chú timeout fail-open cho UI (đóng nợ LIMITS R10 đợt 64
 * §6.4: lý do timeout chưa hiển thị cho user). Khi trial-decode hết
 * timeout mà chưa có verdict, file vẫn mở bình thường nhưng bước kiểm
 * keyframe chưa xong — user cần biết lý do, không phải chỉ thấy file mở.
 * Chuỗi qua key `gop.trial.timeoutNote` trong dict (fragment round65-s6,
 * parent gộp sau); lookup chưa có key (trả đúng key, đúng hợp đồng `t()`)
 * thì rớt về `trialReason` — lý do timeout đã localize sẵn qua
 * `gop.trial.timeout`. Không dùng trKey ở đây: key chưa vào dict nên
 * trKey sẽ bị test P7 báo TRKEY-UNKNOWN-KEY (mẫu fragment R8 đợt 64 —
 * chuỗi sống trong fragment trước, dict sau).
 * Chỉ gọi khi trial skipped DO timeout (xem `isTrialDecodeTimeoutReason`).
 */
export function trialDecodeTimeoutNote(
  lookup: I18nLookup | undefined,
  trialReason: string,
  timeoutMs: number,
  sampleBytes: number,
): string {
  const key = "gop.trial.timeoutNote";
  const vars = {
    timeout: String(timeoutMs),
    size: (sampleBytes / (1024 * 1024)).toFixed(1),
  };
  if (!lookup) return trialReason;
  const out = lookup(key, vars);
  return out === key ? trialReason : out;
}

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
  kind: "head" | "probe" | "prefix" | "moov" | "tail" | "gop" | "sample";
  start: number | null;
  end: number | null;
  status: number;
  bytes: number;
}

/**
 * Đợt 53 J6 — số byte tối đa fetch để kiểm AVCC sample đầu ở mode
 * stream (sample keyframe thật thường chỉ vài chục KiB; sample lớn
 * hơn thì chỉ kiểm tiền tố — xem `validateAvccSample`).
 */
export const MAX_FIRST_SAMPLE_PROBE_BYTES = 256 * 1024;

/**
 * Đợt 56 M10 — trần kích thước sample 0 được trial-decode ở mode
 * stream, đợt 57 N10 nâng 2 MiB → 8 MiB, đợt 59 P6 nâng 8 MiB →
 * 32 MiB (đóng nợ đợt 58 §6.6 + đợt 57 N10), đợt 60 Q5 nâng 32 MiB →
 * 64 MiB (đóng nợ đợt 59 §6.2). Sample 0 ≤ 256 KiB thì
 * đã fetch đủ (cap J6 ở trên); lớn hơn thì T3 fetch thêm phần còn
 * lại theo chunk 512 KiB (xem `fetchSampleRemainderChunked`) rồi mới
 * decode — nhưng chỉ tới trần này. Lý do chọn 64 MiB (đo thật, xem
 * LIMITS N10 §2 + LIMITS P6 §1 + LIMITS Q5 §1): keyframe thật đo được
 * 720p ~30 KiB, 1080p ~100 KiB, 4K crf 12 ~300–350 KiB, 4K lossless
 * ~461 KiB, 4K nhiễu ~4,1 MiB, 4K nhiễu mạnh crf 12 ~9,7 MiB (P6),
 * 8K nhiễu crf 18 ~19,7 MiB, 8K nhiễu mạnh crf 12 ~30,7 MiB (P6),
 * 8K nhiễu mạnh crf 8 ~37,2 MB (Q5) — 64 MiB gấp ~2× keyframe thật
 * lớn nhất đo được và bao phủ cả 8K bitrate rất cao; decode sample
 * 300 KiB đo headed ~68 ms nên sample ~8 MiB (8K) có thể chạm timeout
 * và fail-open (hướng an toàn) — timeout theo kích thước (đợt 58 O6,
 * trần 2500 ms) chặn cứng chi phí decode bất kể cap; keyframe thật
 * ≳16 MiB (decode ~0,15 ms/KiB) vẫn timeout → fail-open, còn rác
 * lớn fail nhanh (~5 ms) nên nay có verdict thật thay vì bị bỏ qua.
 * Nói thẳng: phần chặn được THÊM của đợt Q5 so với P6 chỉ là rác lớn
 * trong (32, 64] MiB — keyframe thật trong khoảng đó vẫn fail-open vì
 * timeout (chỉ tốn thêm phí fetch, đo headed thật xem LIMITS Q5 §2).
 * Cap chặn kẻ giả khai sample đầu khổng lồ để ép fetch: tối đa
 * 64 MiB qua ≤ 128 request 512 KiB. Sample 0 > 64 MiB vẫn bỏ qua
 * trial-decode (fail-open) như hành vi cũ — all-mode vẫn chặn được
 * vì GOP 0 đã fetch đủ range. KHÔNG tải toàn bộ file vào RAM: T3
 * chỉ fetch đúng range sample 0 (tiền tố + chunk remainder), đỉnh
 * heap transient ≈ sample (≤ 64 MiB) + 1 chunk 512 KiB — file (có
 * thể hàng trăm MiB) không bao giờ được tải trọn. Decode vẫn 1 lần
 * trên sample đã ráp đủ (VideoDecoder chỉ nhận 1 access unit trọn
 * vẹn — xem LIMITS P6 §1.2, không có decode streaming từng đoạn).
 * Đợt 60 Q5 (b): khi probe trial-decode là null (caller tắt hẳn)
 * thì T3 KHÔNG fetch remainder nữa (đóng nợ N10 §6.2) — fetch đó
 * là phí thuần vì runTrialDecode(null) trả pass ngay không decode;
 * kiểm AVCC trên tiền tố vẫn chạy như cũ.
 */
export const MAX_TRIAL_DECODE_SAMPLE_BYTES = 64 * 1024 * 1024;

/**
 * Đợt 57 N10 — kích thước 1 chunk khi fetch phần còn lại của sample 0
 * lớn ở mode stream: 512 KiB. Lý do: bằng đúng tiền tố mặc định
 * (512 KiB) nên cùng bậc với mọi fetch khác của T3; đủ nhỏ để nằm
 * dưới giới hạn độ dài Range của hầu hết server/proxy (một request
 * Range 8 MiB duy nhất có thể bị server kẹp/clamp → 416 hoặc trả
 * thiếu → fetchRangeChecked ném lỗi, trong khi chunk 512 KiB đi qua
 * được), đủ lớn để sample tối đa 64 MiB chỉ cần ≤ 128 request; mỗi
 * chunk qua đúng kiểm chứng 206 + Content-Range như mọi range khác.
 * (Đợt 77 E7 sửa comment: cap nay là 64 MiB / 128 request sau đợt
 * 60 Q5, câu cũ ghi 32 MiB / 64 request từ thời P6.)
 */
export const TRIAL_DECODE_SAMPLE_CHUNK_BYTES = 512 * 1024;

/**
 * Đợt 57 N10 — số request Range tối đa để fetch phần còn lại của
 * sample 0 lớn: ceil((cap 64 MiB − tiền tố 256 KiB) / chunk 512 KiB)
 * = ceil(127,5) = 128 (đợt 60 Q5 nâng cap 32 MiB → 64 MiB). Suy ra từ 3
 * hằng trên (không hard-code số rời) để đổi cap/chunk là giới hạn tự
 * khớp. Vòng fetch trong `fetchSampleRemainderChunked` dừng bằng giới
 * hạn này (phòng thủ chống lặp vô hạn nếu logic tính chunk sai); T3
 * không bao giờ gọi tới mức này vì cap đã chặn trước (remainder tối
 * đa cần đúng 128).
 */
export const MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES = Math.ceil(
  (MAX_TRIAL_DECODE_SAMPLE_BYTES - MAX_FIRST_SAMPLE_PROBE_BYTES) /
    TRIAL_DECODE_SAMPLE_CHUNK_BYTES,
);

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
      /**
       * Đợt 65 S6 — ghi chú trial-decode timeout (fail-open): chỉ có khi
       * trial-decode sample 0 HẾT timeout mà chưa có verdict — file vẫn mở
       * bình thường nhưng bước kiểm keyframe chưa xong; UI hiện cho user
       * biết lý do (toast + getter controller). Vắng = trial-decode có
       * verdict (decode-ok) hoặc không chạy/không timeout (probe null,
       * no-decoder, unsupported-config, sample > 64 MiB).
       */
      trialDecodeNote?: string;
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
   * Đợt 51 H4 — chunk đầu của tail-scan streaming (mặc định 2 MiB):
   * tail-scan không fetch một lần cả cửa sổ đuôi (16,7 MiB ở fixture
   * 37 MiB) nữa mà lấy từng chunk từ EOF lùi về, mỗi lần gấp đôi
   * (2 → 4 → 8 → 16 MiB) cho tới khi tìm thấy moov + xác nhận bằng
   * 1 chunk nữa (xem `fetchTrailingMoovChunked`). Chỉ là gợi ý đo/test
   * (production không truyền); phải > 0.
   */
  tailInitialChunkBytes?: number;
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
  /**
   * Đợt 55 L8 — probe trial-decode cho sample 0 (xem
   * `gopTrialDecode55L8.ts`): chạy SAU lớp kiểm K8 + kiểm AVCC,
   * chỉ khi đã có đủ toàn bộ sample 0.
   * - undefined (mặc định): dùng probe VideoDecoder thật của trình
   *   duyệt khi có, bỏ qua (fail-open) khi không có — Node/test cũ
   *   không đổi hành vi (Node không có VideoDecoder).
   * - null: tắt hẳn trial-decode (opt-out; vd caller đã tự kiểm
   *   decode ở nơi khác).
   * - function: probe inject (test / caller tự cung cấp decoder).
   * Probe trả false (decode lỗi thật) → T3 fallback full-file với
   * lý do `trial-decode: ...`; probe lỗi/timeout/không có → cho qua
   * (fail-open), không chặn file thật.
   */
  trialDecodeProbe?: GopTrialDecodeProbe | null;
  /**
   * Đợt 55 L8 — timeout GỐC cho 1 lần trial-decode (mặc định 200 ms —
   * đo thật: sample thật 720p decode OK 15,5–17,1 ms, mẫu rác lỗi
   * 0,5–1,6 ms). Quá timeout → fail-open (cho qua). ≤ 0 / không
   * finite → dùng mặc định.
   * Đợt 58 O6 — đây là timeout gốc cho sample NHỎ (≤ 256 KiB); sample
   * lớn hơn được cộng thêm theo kích thước ở cả 2 điểm gọi trial-decode
   * dưới đây — keyframe 4K nhiễu 4,1 MiB decode ~623 ms (median,
   * LIMITS O6 §1) nên không còn bị cắt ở 200 ms.
   * Đợt 62 R4 — sample mà timeout main-thread chạm trần 2500 ms thì
   * `planTrialDecodeCall` đưa sang worker nền với trần riêng 90 s
   * (đợt 63 R4 nâng từ 30 s lên 45 s; đợt 64 R10 nâng lên 60 s; đợt 67 U5
   * nâng lên 90 s — xem gopTrialDecodeWorker62R4.ts; đợt 73 A7 xác nhận
   * trần 90 s không bao giờ ràng buộc vì công thức ở cap 64 MiB chỉ
   * 78.536 ms < 90.000 ms);
   * timeout gốc này vẫn là base cho cả 2 đường.
   */
  trialDecodeTimeoutMs?: number;
  /**
   * Đợt 60 Q4 — lookup i18n tùy chọn: các lý do fallback/diagnostic
   * của T3 đi qua key `gop.range.*` / `gop.demux.*` trong dict (và
   * `gop.trial.*` qua runTrialDecode); vắng → fallback VI cũ.
   */
  lookup?: I18nLookup;
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
 * Đợt 53 J6 — vùng mdat theo header box top-level trong tiền tố
 * (dùng cho kiểm tra stco-khớp-mdat ở bước 5).
 *
 * Khác `scanTopBoxes` ở chỗ KHÔNG dừng ở mdat cắt dở: mdat trailing
 * khổng lồ luôn tràn tiền tố, nhưng size khai trong header vẫn cho
 * biết vùng [start, start+size) mà mọi sample phải nằm trong. Box
 * khác cắt dở thì dừng (không thấy được box sau nó). `size == 0`
 * (kéo tới cuối file) thì end = knownSize, vắng knownSize thì cuối
 * tiền tố. Trả [] khi không thấy mdat nào — caller BỎ QUA kiểm tra
 * (fail-open, xem bước 5) thay vì fallback oan file thật (vd moov
 * phình > tiền tố che mất header mdat). Rủi ro dư ghi trong LIMITS:
 * file nhiều mdat mà mdat thứ hai nằm ngoài tiền tố thì sample trong
 * đó bị fallback oan về full-file (vẫn phát được, chỉ chậm hơn).
 */
export function mdatRangesInPrefix(
  prefix: Uint8Array,
  knownSize: number | null,
): Array<{ start: number; end: number }> {
  const view = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);
  const ranges: Array<{ start: number; end: number }> = [];
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
      size = (knownSize !== null ? knownSize : prefix.length) - off;
    }
    if (size < header) break;
    if (type === "mdat") {
      ranges.push({ start: off, end: off + size });
      // mdat cắt dở (end vượt tiền tố) thì không thấy box sau — dừng.
      if (off + size > prefix.length) break;
      off += size;
      continue;
    }
    if (off + size > prefix.length) break;
    off += size;
  }
  return ranges;
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

/** Huỷ body best-effort (để không nuốt body file lớn khi đã quyết fallback). */
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
 *
 * Đợt 60 Q4 — `lookup` tùy chọn: lý do status/short-body đi qua key
 * `gop.range.statusNot206` / `gop.range.shortBody`; vắng → VI cũ.
 * Lý do của `checkRangeProbeResponse` (range-probe-*) KHÔNG có trong
 * fragment P7 nên giữ nguyên chuỗi thô.
 */
async function fetchRangeChecked(
  fetchImpl: GopRangeFetchFn,
  url: string,
  start: number,
  end: number,
  knownTotal: number | null,
  kind: "probe" | "prefix" | "moov" | "tail" | "gop" | "sample",
  requests: GopRangeRequestLog[],
  lookup?: I18nLookup,
): Promise<Uint8Array> {
  const resp = await fetchImpl(url, {
    headers: { Range: `bytes=${start}-${end}` },
  });
  if (resp.status !== 206) {
    requests.push({ kind, start, end, status: resp.status, bytes: 0 });
    await cancelBody(resp);
    throw new GopRangeFailure(
      trKey(
        lookup,
        "gop.range.statusNot206",
        { kind, status: String(resp.status), start: String(start), end: String(end) },
        `${kind}-status-${resp.status}: server không trả 206 cho Range ${start}-${end}`,
      ),
    );
  }
  const contentRange = resp.headers.get("content-range");
  const check = checkRangeProbeResponse(
    resp.status,
    contentRange,
    { start, end },
    knownTotal,
    lookup,
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
      trKey(
        lookup,
        "gop.range.shortBody",
        { kind, wanted: String(end - start + 1), got: String(buf.length) },
        `${kind}-short-body: xin ${end - start + 1} byte, nhận ${buf.length}`,
      ),
    );
  }
  return buf;
}

/**
 * Đợt 57 N10 — fetch phần còn lại của sample 0 lớn theo chunk rồi ráp
 * lại thành đủ sample để trial-decode (thay cho 1 request Range duy
 * nhất của M10 — xem LIMITS N10 §1.2: vì sao không decode streaming).
 *
 *   - `prefix` là đúng byte đầu của sample đã fetch (tiền tố AVCC
 *     256 KiB của J6); hàm KHÔNG fetch lại phần này.
 *   - Phần còn lại `[offset+prefix.length, offset+size-1]` được lấy
 *     từng chunk `TRIAL_DECODE_SAMPLE_CHUNK_BYTES` (512 KiB), mỗi
 *     chunk qua `fetchRangeChecked` nghiêm ngặt (206 + Content-Range
 *     khớp mới nhận, kind "sample" như request tiền tố) rồi `set`
 *     vào đúng vị trí trong buffer đích đã cấp trước (size = sample
 *     đầy đủ) — không nối chuỗi buffer tạm nên đỉnh heap transient
 *     ≈ size + 1 chunk thay vì size + remainder-copy như M10.
 *   - Chunk nào lỗi (416/200/mạng) thì throw ngay (không thử chunk
 *     sau): caller bắt và bỏ qua trial-decode (fail-open) — AVCC trên
 *     tiền tố đã qua nên phần còn lại chỉ phục vụ probe, không đáng
 *     fallback file thật vì lỗi mạng giữa chừng.
 *   - Vòng lặp chặn bởi `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES`
 *     (128): quá giới hạn thì throw `sample-chunk-limit` thay vì
 *     fetch tiếp — phòng thủ, T3 không bao giờ chạm tới vì cap 64 MiB
 *     đã chặn trước (remainder tối đa cần đúng 128 chunk).
 *     (Đợt 77 E7 sửa comment: giới hạn nay là 128 sau đợt 60 Q5, câu
 *     cũ ghi 64 chunk / cap 32 MiB từ thời P6.)
 *   - Trả buffer sample ĐẦY ĐỦ (không phải chỉ phần còn lại) để
 *     caller đưa thẳng vào probe; `prefix.length > size` hoặc
 *     `size <= 0` là lỗi lập trình của caller → throw TypeError.
 *   - Đợt 72 Z5 — `onProgress` tùy chọn: gọi sau mỗi chunk về với
 *     tổng số byte sample ĐÃ CÓ (prefix + các chunk đã fetch) — tiến
 *     độ THẬT theo chunk, không ước lượng; T3 truyền vào để registry
 *     trial cập nhật toast "đang tải keyframe…". Vắng thì không gọi.
 */
export async function fetchSampleRemainderChunked(
  fetchImpl: GopRangeFetchFn,
  url: string,
  sampleOffset: number,
  sampleSize: number,
  prefix: Uint8Array,
  knownSize: number | null,
  requests: GopRangeRequestLog[],
  lookup?: I18nLookup,
  onProgress?: (fetchedBytes: number) => void,
): Promise<Uint8Array> {
  if (!(sampleSize > 0) || prefix.length > sampleSize) {
    throw new TypeError(
      trKey(
        lookup,
        "gop.range.sampleRemainderInvalid",
        { sampleSize: String(sampleSize), prefixLength: String(prefix.length) },
        `fetchSampleRemainderChunked: sampleSize ${sampleSize} / prefix ${prefix.length} không hợp lệ`,
      ),
    );
  }
  const full = new Uint8Array(sampleSize);
  full.set(prefix, 0);
  let fetched = prefix.length;
  let chunkCount = 0;
  while (fetched < sampleSize) {
    if (++chunkCount > MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES) {
      throw new GopRangeFailure(
        trKey(
          lookup,
          "gop.range.sampleChunkLimit",
          { maxChunks: String(MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES), sampleSize: String(sampleSize) },
          `sample-chunk-limit: sample 0 cần quá ${MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES} chunk 512 KiB (size ${sampleSize})`,
        ),
      );
    }
    const chunkEnd = Math.min(
      fetched + TRIAL_DECODE_SAMPLE_CHUNK_BYTES,
      sampleSize,
    ) - 1;
    const chunk = await fetchRangeChecked(
      fetchImpl,
      url,
      sampleOffset + fetched,
      sampleOffset + chunkEnd,
      knownSize,
      "sample",
      requests,
      lookup,
    );
    full.set(chunk, fetched);
    fetched += chunk.length;
    // Đợt 72 Z5 — báo tiến độ thật sau mỗi chunk (prefix + chunk đã
    // về); callback lỗi không được làm hỏng đường fetch (try/catch).
    if (onProgress) {
      try {
        onProgress(fetched);
      } catch {
        /* tiến độ chỉ phục vụ toast — không chặn fetch */
      }
    }
  }
  return full;
}

/**
 * Đợt 51 H4 — chunk đầu mặc định của tail-scan streaming (2 MiB).
 * Moov trailing thật thường chỉ vài chục KiB và nằm sát EOF (fixture
 * 37 MiB: moov 24.639 byte ở đúng cuối file) nên lấy cả cửa sổ đuôi
 * 16,7 MiB một lần là lãng phí đỉnh heap transient; lấy 2 MiB đầu là
 * đủ tìm thấy trong đa số trường hợp thật.
 */
export const DEFAULT_TAIL_INITIAL_CHUNK_BYTES = 2 * 1024 * 1024;

export interface ChunkedTailScan {
  /** Đã tìm thấy moov trailing hợp lệ chưa. */
  found: boolean;
  /** Buffer đuôi đã fetch (đúng hậu tố file, kết thúc ở EOF). */
  tailBuf: Uint8Array;
  /** Offset bắt đầu buffer đuôi trong file (= fileSize - tailBuf.length). */
  tailStart: number;
  /** Ứng viên moov (chỉ có khi found). */
  candidate: TailMoovCandidate | null;
  /** Lý do không thấy (chỉ có khi !found). */
  reason: string | null;
  /** Tổng byte đuôi đã chuyển qua mạng (= tailBuf.length, fetch tăng dần). */
  fetchedBytes: number;
  /** Số request Range đuôi đã phát. */
  chunkCount: number;
}

/**
 * Đợt 51 H4 — tail-scan streaming: fetch đuôi file theo chunk từ EOF
 * lùi về, thay vì một lần cả cửa sổ đuôi (nợ F4 §5.3: đuôi 16,7 MiB
 * nằm trong đỉnh transient T3).
 *
 * Thuật toán (mọi chunk đều qua `fetchRangeChecked` nghiêm ngặt như
 * đường cũ — 206 + Content-Range khớp mới nhận body):
 *   - Cửa sổ bắt đầu ở `initialChunkBytes` (mặc định 2 MiB), kẹp về
 *     min(tailScanBytes, fileSize). Mỗi lần không thấy moov thì gấp
 *     đôi cửa sổ (fetch thêm đúng phần mới ở phía trước rồi nối vào
 *     đầu buffer cũ — tổng byte chuyển qua mạng = đúng cửa sổ cuối,
 *     không fetch trùng), cho tới khi chạm trần cửa sổ.
 *   - Thấy moov mà cửa sổ chưa chạm trần thì xác nhận bằng 1 lần gấp
 *     đôi nữa rồi quét lại: ứng viên giữ nguyên (cùng start+size) thì
 *     nhận; ứng viên đổi (quét rộng hơn thấy moov ngoài cùng hơn —
 *     đúng luật "chọn start nhỏ nhất" của findTrailingMoov) thì nhận
 *     ứng viên mới và xác nhận thêm tối đa 1 lần nữa. Vòng xác nhận
 *     có chặn (tối đa 2 lần) và cửa sổ chỉ tăng nên vòng lặp luôn dừng,
 *     trường hợp xấu nhất fetch đúng bằng cửa sổ cũ.
 *   - Chunk nào lỗi mạng/server (416/200/...) thì throw ngay như
 *     đường cũ (không thử cửa sổ lớn hơn — server đã từ chối range
 *     đuôi thì range lớn hơn cũng không cứu được), caller chuyển thành
 *     fallback với cùng dạng lý do `tail-scan: ...`.
 *
 * Tính chất an toàn: buffer tích lũy LUÔN là đúng hậu tố file kết
 * thúc ở EOF nên `findTrailingMoov` nhận đúng đầu vào nó yêu cầu;
 * ứng viên tìm thấy ở cửa sổ hẹp vẫn phải qua đủ 3 cửa (kết thúc ở
 * EOF/hậu tố hợp lệ + nằm gọn + payload parse thành cây box có
 * mvhd/trak) và demux ở bước 5 vẫn là cửa cuối. Rủi ro còn lại (ghi
 * trong LIMITS H4 §5.3): file chế tác có moov giả lọt 3 cửa nằm trong
 * moov thật mà moov thật bắt đầu TRƯỚC cửa sổ đã xác nhận thì bước
 * xác nhận không nhìn thấy moov thật — trường hợp này cần byte chế
 * tác cố ý, file encode thật không gặp.
 *
 * Đỉnh heap: buffer đuôi lớn nhất giữ cùng lúc ≈ cửa sổ lúc tìm thấy
 * + 1 chunk xác nhận (fixture 37 MiB: 4 MiB thay vì 16,7 MiB);
 * lúc nối chunk, transient ≈ 2× cửa sổ mới (buffer cũ + chunk mới +
 * buffer nối) — vẫn thấp hơn hẳn 16,7 MiB một lần.
 */
export async function fetchTrailingMoovChunked(
  fetchImpl: GopRangeFetchFn,
  url: string,
  knownSize: number,
  tailScanBytes: number,
  maxMoovBytes: number,
  requests: GopRangeRequestLog[],
  initialChunkBytes: number = DEFAULT_TAIL_INITIAL_CHUNK_BYTES,
  // Đợt 60 Q4 — lookup i18n tùy chọn, truyền xuống fetchRangeChecked
  // (lý do status/short-body của chunk đuôi đi qua key gop.range.*).
  lookup?: I18nLookup,
): Promise<ChunkedTailScan> {
  const fullWindow = Math.min(tailScanBytes, knownSize);
  let window = Math.min(initialChunkBytes, fullWindow);
  // Lần đầu: fetch đúng cửa sổ đầu [size-window, size-1].
  let acc = await fetchRangeChecked(
    fetchImpl,
    url,
    knownSize - window,
    knownSize - 1,
    knownSize,
    "tail",
    requests,
    lookup,
  );
  let chunkCount = 1;
  // Mở rộng cửa sổ gấp đôi (kẹp trần): fetch thêm đúng phần mới ở
  // phía trước rồi nối vào đầu buffer cũ.
  const growOnce = async (): Promise<boolean> => {
    if (window >= fullWindow) return false;
    const next = Math.min(window * 2, fullWindow);
    const extra = await fetchRangeChecked(
      fetchImpl,
      url,
      knownSize - next,
      knownSize - window - 1,
      knownSize,
      "tail",
      requests,
      lookup,
    );
    const joined = new Uint8Array(next);
    joined.set(extra, 0);
    joined.set(acc, extra.length);
    acc = joined;
    window = next;
    chunkCount++;
    return true;
  };
  let scan = findTrailingMoov(acc, knownSize, { maxMoovBytes });
  let confirms = 0;
  for (;;) {
    if (!scan.found) {
      if (window >= fullWindow) {
        return {
          found: false,
          tailBuf: acc,
          tailStart: knownSize - window,
          candidate: null,
          reason: scan.reason,
          fetchedBytes: window,
          chunkCount,
        };
      }
      await growOnce();
      scan = findTrailingMoov(acc, knownSize, { maxMoovBytes });
      continue;
    }
    // Thấy moov: cửa sổ đã chạm trần thì nhận ngay; chưa thì xác
    // nhận bằng 1 lần mở rộng rồi quét lại (xem header hàm).
    if (window >= fullWindow || confirms >= 2) {
      return {
        found: true,
        tailBuf: acc,
        tailStart: knownSize - window,
        candidate: scan.candidate,
        reason: null,
        fetchedBytes: window,
        chunkCount,
      };
    }
    const prev = scan.candidate;
    await growOnce();
    confirms++;
    scan = findTrailingMoov(acc, knownSize, { maxMoovBytes });
    if (!scan.found) continue; // không xảy ra trên suffix lớn hơn
    // (ứng viên cũ vẫn hợp lệ trong suffix rộng hơn); vòng lặp sẽ
    // mở rộng tiếp hoặc trả không-thấy khi chạm trần — phòng thủ.
    if (
      prev !== null &&
      scan.candidate.start === prev.start &&
      scan.candidate.size === prev.size
    ) {
      return {
        found: true,
        tailBuf: acc,
        tailStart: knownSize - window,
        candidate: scan.candidate,
        reason: null,
        fetchedBytes: window,
        chunkCount,
      };
    }
    // Ứng viên đổi (thấy moov ngoài cùng hơn): nhận ứng viên mới và
    // xác nhận thêm 1 lần nữa ở vòng lặp sau (confirms đã tăng).
  }
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
  // Đợt 60 Q4 — lookup i18n cho các lý do gop.range.*/gop.demux.*
  // (xem GopRangeFetchOptions.lookup); vắng → fallback VI cũ.
  const lookup = opts.lookup;
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError(
      trKey(lookup, "gop.range.fetchUrlInvalid", {}, "fetchVideoTrackByGopRange: url phải là string không rỗng"),
    );
  }
  const prefixBytes = opts.prefixBytes ?? 512 * 1024;
  const maxMoovBytes = opts.maxMoovBytes ?? 16 * 1024 * 1024;
  // ROUND45-A4: cửa sổ đuôi mặc định = trần moov, kẹp về trần moov.
  const tailScanBytes =
    opts.tailScanBytes === undefined
      ? maxMoovBytes
      : Math.min(opts.tailScanBytes, maxMoovBytes);
  // ROUND51-H4: chunk đầu của tail-scan streaming (mặc định 2 MiB).
  const tailInitialChunkBytes =
    opts.tailInitialChunkBytes ?? DEFAULT_TAIL_INITIAL_CHUNK_BYTES;
  if (!(prefixBytes > 0) || !(maxMoovBytes > 0) || !(tailScanBytes > 0) || !(tailInitialChunkBytes > 0)) {
    throw new TypeError(
      trKey(
        lookup,
        "gop.range.fetchParamsInvalid",
        {},
        "fetchVideoTrackByGopRange: prefixBytes/maxMoovBytes/tailScanBytes/tailInitialChunkBytes phải > 0",
      ),
    );
  }
  const fetchImpl: GopRangeFetchFn =
    opts.fetchImpl ??
    ((u, init) => fetch(u, init) as unknown as Promise<GopRangeResponse>);
  // Đợt 55 L8 — phân giải probe trial-decode 1 lần: undefined = probe
  // trình duyệt thật (null trong Node → bỏ qua, fail-open); null =
  // tắt hẳn; function = probe inject. Phân giải ở đây để cả 2 mode
  // dùng chung 1 probe, không tạo VideoDecoder thừa.
  const trialProbe =
    opts.trialDecodeProbe === undefined
      ? createBrowserTrialDecodeProbe()
      : opts.trialDecodeProbe;
  const trialTimeoutMs =
    opts.trialDecodeTimeoutMs ?? DEFAULT_TRIAL_DECODE_TIMEOUT_MS;
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
    if (probeEnd < 0) {
      return fallback(
        trKey(
          lookup,
          "gop.range.sizeTooSmall",
          {},
          "size-too-small: file nhỏ hơn 1 byte, không cần Range",
        ),
      );
    }
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
      lookup,
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
        trKey(
          lookup,
          "gop.range.prefixStatusNot206",
          { status: String(prefixResp.status) },
          `prefix-status-${prefixResp.status}: server không trả 206 cho Range tiền tố`,
        ),
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
      lookup,
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
        trKey(
          lookup,
          "gop.range.prefixShortBody",
          { wanted: String(effectivePrefixEnd + 1), got: String(prefix.length) },
          `prefix-short-body: xin ${effectivePrefixEnd + 1} byte, nhận ${prefix.length}`,
        ),
      );
    }

    // 4. Vị trí moov + cổng gate (lần đầu tiên gate được code fetch gọi).
    const moovPosition = detectMoovPosition(prefix);
    const decision = resolveRangeGopFetch(
      {
        moovPosition,
        acceptRanges,
        knownSizeBytes: knownSize,
        rangeProvenByVerifiedProbe,
      },
      lookup,
    );
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
        const faststartDecision = resolveRangeGopFetch(
          {
            moovPosition: "faststart",
            acceptRanges,
            knownSizeBytes: knownSize,
            rangeProvenByVerifiedProbe,
          },
          lookup,
        );
        if (faststartDecision.mode !== "range-gop-attempt") {
          return fallback(`gate: ${faststartDecision.reasons.join("; ")}`);
        }
        if (truncated.size > maxMoovBytes) {
          return fallback(
            trKey(
              lookup,
              "gop.range.moovTooLarge",
              { size: String(truncated.size), max: String(maxMoovBytes) },
              `moov-too-large: moov ${truncated.size} byte vượt trần ${maxMoovBytes}`,
            ),
          );
        }
        if (knownSize !== null && truncated.start + truncated.size > knownSize) {
          return fallback(
            trKey(
              lookup,
              "gop.range.moovOutOfFile",
              { start: String(truncated.start), size: String(truncated.size), total: String(knownSize) },
              `moov-out-of-file: moov ${truncated.start}+${truncated.size} vượt tổng ${knownSize}`,
            ),
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
          lookup,
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
        // ROUND51-H4 — tail-scan streaming: fetch đuôi theo chunk từ
        // EOF lùi về (2 → 4 → 8 → 16 MiB) thay vì một lần cả cửa sổ
        // đuôi 16,7 MiB; moov 24 KiB ở cuối fixture 37 MiB chỉ cần
        // 2 MiB + 1 chunk xác nhận 2 MiB = 4 MiB. Lỗi chunk nào thì
        // throw ngay như đường cũ (1 request tail, cùng dạng lý do).
        let tailScan: ChunkedTailScan;
        try {
          tailScan = await fetchTrailingMoovChunked(
            fetchImpl,
            url,
            knownSize,
            tailScanBytes,
            maxMoovBytes,
            requests,
            tailInitialChunkBytes,
            lookup,
          );
        } catch (e) {
          return fallback(`${gateReason}; tail-scan: ${(e as Error).message}`);
        }
        if (!tailScan.found) {
          return fallback(`${gateReason}; tail-scan: ${tailScan.reason}`);
        }
        const tailBuf = tailScan.tailBuf;
        const tailResult = { found: true as const, candidate: tailScan.candidate as TailMoovCandidate, tailStart: tailScan.tailStart };
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
        return fallback(
          trKey(
            lookup,
            "gop.range.moovMissingAfterGate",
            {},
            "moov-missing-after-gate: gate báo faststart nhưng không tìm thấy box moov",
          ),
        );
      }
      if (moovBox.size > maxMoovBytes) {
        return fallback(
          trKey(
            lookup,
            "gop.range.moovTooLarge",
            { size: String(moovBox.size), max: String(maxMoovBytes) },
            `moov-too-large: moov ${moovBox.size} byte vượt trần ${maxMoovBytes}`,
          ),
        );
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
          lookup,
        );
      }
    }
    // Buffer mới chỉ chứa moov (copy để ArrayBuffer không dính tiền tố).
    const moovBuf = new Uint8Array(moovBytes).buffer as ArrayBuffer;
    let track: Mp4VideoTrack;
    try {
      track = parseMp4VideoTrack(moovBuf, lookup);
    } catch (e) {
      return fallback(`demux-moov: ${(e as Error).message}`);
    }
    if (track.samples.length === 0) {
      return fallback(
        trKey(
          lookup,
          "gop.range.trackNoSamples",
          {},
          "demux-moov: track không có sample",
        ),
      );
    }
    // Đợt 52 I6 — kiểm tra sample table nằm trong file: moov GIẢ lồng
    // trong moov thật (moov thật bắt đầu TRƯỚC cửa sổ tail-scan đã
    // xác nhận) có thể qua đủ 3 cửa tail-scan rồi demux vẫn parse
    // được, nhưng sample table của nó trỏ ngoài file (đo thật: range
    // 100.000.000 trong file 5.061.286 byte vẫn được stream-mode trả
    // gop-range — xem LIMITS I6 §2). Mode all đã tự chặn ở bước fetch
    // GOP (rangeEnd vượt tổng), còn stream-mode trả meta ngay nên cần
    // chặn tại đây: sample nào offset+size vượt tổng file đã biết thì
    // fallback rõ ràng, không trả meta sai cho controller. File thật
    // luôn có sample nằm trong file nên kiểm tra này không đổi hành vi
    // với file thật. knownSize null (chưa xác định được size) thì bỏ
    // qua — không đoán.
    if (knownSize !== null) {
      for (let si = 0; si < track.samples.length; si++) {
        const s = track.samples[si];
        if (!(s.offset >= 0) || s.offset + s.size > knownSize) {
          return fallback(
            trKey(
              lookup,
              "gop.demux.sampleOutOfFile",
              { si: String(si), offset: String(s.offset), size: String(s.size), total: String(knownSize) },
              `demux-moov: sample ${si} vượt ngoài file (offset ${s.offset}+${s.size} > tổng ${knownSize})`,
            ),
          );
        }
      }
    }
    // Đợt 53 J6 — kiểm tra stco khớp mdat: mọi sample phải nằm gọn
    // trong một box mdat đã biết từ tiền tố (xem `mdatRangesInPrefix`).
    // Moov giả trỏ vào vùng không phải mdat (ftyp, moov, free, udta...)
    // thì fallback ngay — tầng byte này chặn được mọi moov giả trỏ
    // ngoài mdat, kể cả khi offset vẫn trong file (tầng I6 chỉ chặn
    // trỏ ngoài file). Không thấy mdat nào trong tiền tố (vd moov
    // phình > tiền tố che mất header mdat) thì BỎ QUA kiểm tra
    // (fail-open) thay vì fallback oan file thật. File thật luôn có
    // sample trong mdat nên kiểm tra này không đổi hành vi với file thật.
    const mdatRanges = mdatRangesInPrefix(prefix, knownSize);
    if (mdatRanges.length > 0) {
      for (let si = 0; si < track.samples.length; si++) {
        const s = track.samples[si];
        const inside = mdatRanges.some(
          (r) => s.offset >= r.start && s.offset + s.size <= r.end,
        );
        if (!inside) {
          return fallback(
            trKey(
              lookup,
              "gop.demux.sampleOutsideMdat",
              { si: String(si), offset: String(s.offset), size: String(s.size) },
              `demux-moov: sample ${si} trỏ ngoài mdat (offset ${s.offset}+${s.size} — moov giả?)`,
            ),
          );
        }
      }
    }
    // Đợt 54 K8 — kiểm tra bố cục sample + nhất quán bảng sample (sau
    // demux, trước khi chia mode — áp cho cả stream lẫn all). Bắt moov
    // giả mà 3 lớp trước bỏ lọt: (a) bố cục — sample offset phải tăng
    // dần và không chồng lấn (xem `validateSampleLayout` trong
    // mp4Demux.ts): moov giả trỏ mọi sample về cùng offset, đảo thứ
    // tự chunk hay khai offset ngẫu nhiên đều lộ; (b) ctts khai tổng
    // số sample phải bằng đúng stsz — file hợp lệ luôn khớp (demux
    // trước đây pad/cắt lặng lẽ); (c) entry stss phải nằm trong
    // [1, sampleCount]. Cả 3 đều là bất biến của file hợp lệ nên
    // không đổi hành vi file thật; file lạ vi phạm thì chỉ fallback
    // về full-file (vẫn phát được, chỉ chậm hơn), không ném lỗi.
    // Moov giả sao chép y nguyên bảng sample thật nhưng sửa timestamp
    // thì vẫn qua được lớp này — lớp kiểm timestamp stts của đợt 56
    // M10 (`validateSampleTimestamps`, ngay dưới đây) bắt phần lớn
    // trường hợp đó; phần còn lọt (đổi tỉ lệ đều + sửa khớp mdhd/mvhd,
    // hoán đổi delta) ghi trong LIMITS M10 §3.
    const layout = validateSampleLayout(track.samples, lookup);
    if (!layout.ok) {
      return fallback(
        trKey(
          lookup,
          "gop.demux.badLayout",
          { reason: String(layout.reason) },
          `demux-moov: bố cục sample bất thường (${layout.reason} — moov giả?)`,
        ),
      );
    }
    if (
      track.cttsTotal !== null &&
      track.cttsTotal !== undefined &&
      track.cttsTotal !== track.samples.length
    ) {
      return fallback(
        trKey(
          lookup,
          "gop.demux.cttsStszMismatch",
          { cttsTotal: String(track.cttsTotal), count: String(track.samples.length) },
          `demux-moov: ctts khai ${track.cttsTotal} sample nhưng stsz có ${track.samples.length} — moov giả?`,
        ),
      );
    }
    if ((track.stssOutOfRange ?? 0) > 0) {
      return fallback(
        trKey(
          lookup,
          "gop.demux.stssOutOfRange",
          { count: String(track.stssOutOfRange), total: String(track.samples.length) },
          `demux-moov: stss có ${track.stssOutOfRange} keyframe ngoài [1, ${track.samples.length}] — moov giả?`,
        ),
      );
    }
    // Đợt 56 M10 — kiểm tra nhất quán timestamp stts (sau lớp K8, trước
    // khi chia mode — áp cho cả stream lẫn all): bắt moov giả sao chép
    // y nguyên bảng sample thật nhưng sửa timestamp — lớp này K8 + AVCC
    // + trial-decode đều bỏ lọt vì bảng sample và byte sample đều là
    // thật (xem `validateSampleTimestamps` trong mp4Demux.ts; trial-decode
    // thêm sample giữa/cuối KHÔNG bắt được lớp này nên không nối thêm).
    // Chỉ fallback về full-file (vẫn phát được), không ném lỗi.
    const tsCheck = validateSampleTimestamps(track, lookup);
    if (!tsCheck.ok) {
      return fallback(
        trKey(
          lookup,
          "gop.demux.badStts",
          { reason: String(tsCheck.reason) },
          `demux-moov: timestamp stts bất thường (${tsCheck.reason} — moov giả?)`,
        ),
      );
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
    // Đợt 65 S6 — ghi chú timeout fail-open (chung cả 2 mode): chỉ gán
    // khi trial-decode hết timeout (xem 2 khối trial bên dưới); undefined
    // thì outcome không mang trường này (spread có điều kiện ở return).
    let trialDecodeNote: string | undefined;
    // Đợt 53 J6 — kiểm AVCC sample đầu ở mode stream: T3 không fetch
    // byte GOP nào lượt đầu nên phải fetch riêng sample đầu (tối đa
    // 256 KiB, 1 request Range kind "sample") rồi kiểm cấu trúc AVCC
    // (xem `validateAvccSample` trong mp4Demux.ts). Moov giả trỏ lệch
    // vào giữa dữ liệu mdat (vẫn trong mdat nên qua được kiểm mdat ở
    // trên) sẽ đọc length NAL rác và bị chặn tại đây. Sample đầu rỗng
    // thì fallback luôn (không fetch range rỗng). Fetch lỗi mạng/server
    // cũng fallback rõ ràng — không đoán sample đầu là đúng.
    if (opts.streamGops === true) {
      const s0 = track.samples[0];
      if (!(s0.size > 0)) {
        return fallback(
          trKey(
            lookup,
            "gop.range.sampleZeroEmpty",
            {},
            "demux-moov: sample 0 rỗng (size 0) — moov giả?",
          ),
        );
      }
      const probeBytes = Math.min(s0.size, MAX_FIRST_SAMPLE_PROBE_BYTES);
      let firstSample: Uint8Array;
      try {
        firstSample = await fetchRangeChecked(
          fetchImpl,
          url,
          s0.offset,
          s0.offset + probeBytes - 1,
          knownSize,
          "sample",
          requests,
          lookup,
        );
      } catch (e) {
        return fallback(
          trKey(
            lookup,
            "gop.demux.avccReadFailed",
            { error: (e as Error).message },
            `demux-moov: không đọc được sample đầu để kiểm AVCC: ${(e as Error).message}`,
          ),
        );
      }
      const v = validateAvccSample(firstSample, s0.size, lookup);
      if (!v.ok) {
        return fallback(
          trKey(
            lookup,
            "gop.demux.notAvcc",
            { reason: String(v.reason) },
            `demux-moov: sample 0 không phải AVCC hợp lệ (${v.reason} — moov giả?)`,
          ),
        );
      }
      // Đợt 55 L8 — trial-decode sample 0 bằng VideoDecoder (sau lớp
      // K8 + kiểm AVCC, tái dùng đúng request "sample" của J6, không
      // thêm fetch). CHỈ chạy khi đã fetch đủ toàn bộ sample 0
      // (s0.size ≤ cap 256 KiB): decode tiền tố cắt dở của sample lớn
      // sẽ lỗi oan file thật nên trường hợp đó BỎ QUA (fail-open, ghi
      // rõ trong LIMITS), không fetch thêm byte nào. Probe lỗi/timeout/
      // không có decoder → cho qua (fail-open); chỉ decoder báo lỗi
      // thật mới fallback — bắt đúng lớp moov giả tinh vi mà AVCC +
      // K8 bỏ lọt (AVCC-đúng-cấu-trúc nhưng H.264-rác, xem LIMITS K8
      // §3.1 case B: decoder lỗi trong 0,5 ms).
      // Đợt 56 M10 — sample 0 > cap 256 KiB nhưng ≤ 2 MiB
      // (MAX_TRIAL_DECODE_SAMPLE_BYTES): fetch thêm đúng phần còn lại
      // của sample 0 (1 request Range kind "sample") rồi trial-decode
      // đủ sample — keyframe 4K thật ~300–350 KiB nên không còn bỏ qua
      // oan. Fetch phần còn lại lỗi → bỏ qua trial-decode (fail-open):
      // AVCC trên tiền tố đã qua, phần còn lại chỉ phục vụ probe.
      // Đợt 57 N10 — nâng cap lên 8 MiB, phần còn lại fetch theo
      // chunk 512 KiB rồi ráp lại (`fetchSampleRemainderChunked`,
      // tối đa 16 chunk) thay cho 1 request duy nhất — vì sao không
      // decode streaming: xem LIMITS N10 §1.2 (VideoDecoder chỉ nhận
      // EncodedVideoChunk trọn 1 access unit, không có API đưa từng
      // mảnh của 1 sample). Chunk nào lỗi → bỏ qua trial-decode
      // (fail-open) như M10. Sample 0 > 8 MiB vẫn bỏ qua như cũ
      // (all-mode chặn được vì GOP 0 đã fetch đủ range).
      // Đợt 59 P6 — nâng cap lên 32 MiB, tối đa 64 chunk; sample 0 >
      // 32 MiB vẫn bỏ qua như cũ. Timeout trần 2500 ms của O6 giữ
      // nguyên: keyframe thật ≳16 MiB decode ~0,15 ms/KiB nên vẫn
      // timeout → fail-open (hướng an toàn), rác lớn fail nhanh nên
      // nay có verdict thật thay vì bị bỏ qua (xem LIMITS P6 §1–§2).
      // Đợt 62 R4 — sample lớn KHÔNG còn timeout → fail-open mù như trước:
      // `planTrialDecodeCall` ở dưới đưa sample mà timeout main-thread đã
      // chạm trần 2500 ms sang worker nền với trần 60 s (đợt 63 R4 nâng
      // từ 30 s lên 45 s; đợt 64 R10 nâng lên 60 s; keyframe thật
      // 9,7–58 MiB nay có verdict decode-ok ở tải trung bình; tải cực
      // nặng vẫn có thể timeout → fail-open có lý do
      // — xem LIMITS R4 đợt 63).
      // Sample 0 > 64 MiB vẫn bỏ qua như cũ (xem LIMITS Q5 §1–§2).
      // KHÔNG fetch remainder khi probe null (đóng nợ N10 §6.2, xem khối `if` ngay dưới).
      // Đợt 58 O6 — timeout theo kích thước sample
      // (`trialDecodeTimeoutForSampleSize`): sample ≤ 256 KiB giữ
      // timeout gốc, sample lớn cộng 0,3 ms/KiB, trần 2500 ms —
      // keyframe 4K nhiễu 4,1 MiB decode median 623 ms nên timeout
      // của nó là 1327 ms (LIMITS O6 §1–§2), không còn bị cắt ở 200 ms.
      // Đợt 60 Q5 (b) — KHÔNG fetch remainder khi probe null (đóng nợ
      // N10 §6.2): trialDecodeProbe === null nghĩa là caller tắt hẳn
      // trial-decode (opt-out) — runTrialDecode(null) trả pass ngay
      // không decode (xem gopTrialDecode55L8.ts) nên fetch remainder
      // là phí thuần (tới 64 MiB ở cap mới; đo thật: sample 12 MiB +
      // probe null trước đây fetch 24 request / 12 MiB, nay chỉ còn
      // 1 request tiền tố AVCC 256 KiB — tiết kiệm 23 request /
      // 11.737.856 byte, xem test Q5). Chỉ fetch khi probe khác null.
      // Kiểm AVCC trên tiền tố ở trên KHÔNG bị ảnh hưởng: vẫn chạy và
      // vẫn chặn moov giả trỏ lệch dù probe null (xem test Q5 AVCC).
      let trialSample: Uint8Array | null = null;
      // Đợt 72 Z5 — run fetch remainder (chỉ khi thật sự fetch):
      // đăng ký TRƯỚC khi fetch để toast "đang tải keyframe…" hiện
      // ngay sau ngưỡng 5 s (trước đây user chờ mù ~48 s); null khi
      // sample nhỏ (không fetch remainder) hoặc probe null.
      let trialFetchRunId: number | null = null;
      if (trialProbe !== null) {
        if (s0.size <= MAX_FIRST_SAMPLE_PROBE_BYTES) {
          trialSample = firstSample;
        } else if (s0.size <= MAX_TRIAL_DECODE_SAMPLE_BYTES) {
          // Tính plan sớm để run mang đúng timeout/viaWorker ngay từ
          // lúc fetch (plan chỉ phụ thuộc kích thước sample + probe,
          // không đổi trong lúc fetch — xem planTrialDecodeCall).
          const trialPlanEarly = planTrialDecodeCall({
            sampleBytes: s0.size,
            baseTimeoutMs: trialTimeoutMs,
            defaultProbe: trialProbe,
            allowWorker: opts.trialDecodeProbe === undefined,
          });
          trialFetchRunId = beginTrialFetchRun({
            sampleBytes: s0.size,
            timeoutMs: trialPlanEarly.timeoutMs,
            viaWorker: trialPlanEarly.viaWorker,
            fetchedBytes: firstSample.length,
          });
          try {
            trialSample = await fetchSampleRemainderChunked(
              fetchImpl,
              url,
              s0.offset,
              s0.size,
              firstSample,
              knownSize,
              requests,
              lookup,
              // Tiến độ thật theo chunk → registry → toast fetch.
              (fetched) => {
                if (trialFetchRunId !== null) {
                  updateTrialFetchProgress(trialFetchRunId, fetched);
                }
              },
            );
          } catch {
            trialSample = null; // bỏ qua trial-decode (fail-open)
          }
        }
      }
      if (trialSample !== null) {
        // Đợt 62 R4 — sample lớn (timeout main-thread chạm trần 2500 ms)
        // thì decode ở worker nền với trần dài hơn (60 s), không kẹt UI;
        // sample nhỏ / probe inject / không có Worker giữ nguyên đường cũ.
        // Chỉ probe mặc định mới được đưa sang worker (allowWorker).
        const trialPlan = planTrialDecodeCall({
          sampleBytes: trialSample.length,
          baseTimeoutMs: trialTimeoutMs,
          defaultProbe: trialProbe,
          allowWorker: opts.trialDecodeProbe === undefined,
        });
        // Đợt 71 Y5 — đăng ký run trial đang chạy để UI hiện toast trạng
        // thái khi trial lâu (ngưỡng 5 s, phía preview.tsx); end trong
        // finally để run không kẹt lại dù probe thắng/thua/timeout/throw.
        // Đợt 72 Z5 — nếu run fetch đã đăng ký ở trên thì TÁI DÙNG nó
        // (chuyển sang phase decode, không tạo run mới — toast giữ
        // nguyên 1 toast, chỉ đổi nội dung fetch → decode); nếu không
        // thì đăng ký run decode mới như Y5.
        let trialRunId: number;
        if (trialFetchRunId !== null) {
          markTrialDecodeStarted(trialFetchRunId);
          trialRunId = trialFetchRunId;
        } else {
          trialRunId = beginTrialDecodeRun({
            sampleBytes: trialSample.length,
            timeoutMs: trialPlan.timeoutMs,
            viaWorker: trialPlan.viaWorker,
          });
        }
        let trial: TrialDecodeResult;
        try {
          // Đợt 77 E7 — quét zero-run AVCC trước khi decode, CHỈ ở đường
          // main-thread: sample lớn đi worker thì quét TRONG worker (xem
          // gopTrialDecodeWorker62R4.worker.ts) để không kẹt UI tới ~1 s
          // ở 50 MiB lossless. Violation → coi như probe-false (fallback
          // về full-file qua nhánh `!trial.passed` dưới đây, cùng key
          // i18n `gop.demux.trialDecodeFailed` nên không thêm chuỗi mới);
          // inconclusive → decode như cũ (fail-open).
          const zeroRun = !trialPlan.viaWorker
            ? scanAvccZeroRun(trialSample, track.codec)
            : null;
          trial =
            zeroRun !== null && zeroRun.violation
              ? {
                  passed: false,
                  skipped: false,
                  reason: `zero-run: ${zeroRun.reason}`,
                }
              : await runTrialDecode(
                  trialPlan.probe,
                  trialSample,
                  trialDecodeConfigFromTrack(track),
                  trialPlan.timeoutMs,
                  lookup,
                );
        } finally {
          endTrialDecodeRun(trialRunId);
        }
        if (!trial.passed) {
          return fallback(
            trKey(
              lookup,
              "gop.demux.trialDecodeFailed",
              { reason: trial.reason },
              `demux-moov: trial-decode sample 0 lỗi (${trial.reason} — moov giả?)`,
            ),
          );
        }
        // Đợt 65 S6 — timeout fail-open: file vẫn mở (passed=true) nhưng
        // bước kiểm keyframe chưa xong — ghi chú để UI báo user lý do
        // (toast + getter controller), không im lặng như trước.
        if (trial.skipped && isTrialDecodeTimeoutReason(trial.reason)) {
          trialDecodeNote = trialDecodeTimeoutNote(
            lookup,
            trial.reason,
            trialPlan.timeoutMs,
            trialSample.length,
          );
        }
      } else if (trialFetchRunId !== null) {
        // Đợt 72 Z5 — fetch remainder lỗi giữa chừng (trialSample null,
        // fail-open như M10): run fetch không còn việc gì, dọn ngay để
        // toast không kẹt lại sau khi T3 đã trả về.
        endTrialDecodeRun(trialFetchRunId);
      }
      return {
        mode: "gop-range",
        track,
        gops: [],
        gopMeta,
        sampleCount: track.samples.length,
        totalGopRangeBytes: 0,
        totalSampleBytes: 0,
        requests,
        ...(trialDecodeNote !== undefined ? { trialDecodeNote } : {}),
      };
    }
    const gops: GopSegment[] = [];
    let totalGopRangeBytes = 0;
    let totalSampleBytes = 0;
    for (let gi = 0; gi < gopDefs.length; gi++) {
      const def = gopDefs[gi];
      if (knownSize !== null && def.rangeEnd > knownSize) {
        return fallback(
          trKey(
            lookup,
            "gop.range.gopOutOfFile",
            { gi: String(gi), rangeEnd: String(def.rangeEnd), total: String(knownSize) },
            `gop-${gi}-out-of-file: rangeEnd ${def.rangeEnd} vượt tổng ${knownSize}`,
          ),
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
        lookup,
      );
      const chunks: GopSegment["chunks"] = [];
      for (let si = def.firstSampleIndex; si <= def.lastSampleIndex; si++) {
        const s = track.samples[si];
        const rel = s.offset - def.rangeStart;
        if (rel < 0 || rel + s.size > gopBuf.length) {
          return fallback(
            trKey(
              lookup,
              "gop.range.gopSampleOutOfRange",
              { gi: String(gi), si: String(si) },
              `gop-${gi}-sample-out-of-range: sample ${si} nằm ngoài buffer GOP đã fetch`,
            ),
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
      // Đợt 53 J6 — kiểm AVCC sample đầu ở mode all: dùng luôn byte
      // sample 0 vừa fetch trong GOP 0 (không thêm request), chặn moov
      // giả trỏ lệch vào giữa dữ liệu mdat như mode stream ở trên.
      // Kiểm ngay sau GOP 0 để không fetch thừa các GOP sau khi đã biết
      // moov giả.
      if (gi === 0) {
        const v0 = validateAvccSample(chunks[0].data, track.samples[0].size, lookup);
        if (!v0.ok) {
          return fallback(
            trKey(
              lookup,
              "gop.demux.notAvcc",
              { reason: String(v0.reason) },
              `demux-moov: sample 0 không phải AVCC hợp lệ (${v0.reason} — moov giả?)`,
            ),
          );
        }
        // Đợt 55 L8 — trial-decode sample 0 (như mode stream ở trên,
        // nhưng ở đây chunks[0].data LUÔN là toàn bộ sample 0 vì GOP 0
        // đã fetch đủ range — không có cap 256 KiB, không có trường
        // hợp bỏ qua vì sample lớn). Kiểm ngay sau GOP 0 để không
        // fetch thừa các GOP sau khi đã biết moov giả.
        // Đợt 58 O6 — timeout theo kích thước sample như mode stream
        // (sample lớn ở all-mode cũng được cộng thời gian).
        // Đợt 62 R4 — như mode stream: sample lớn đi worker nền
        // (planTrialDecodeCall), sample nhỏ / probe inject giữ đường cũ.
        const trialPlan = planTrialDecodeCall({
          sampleBytes: chunks[0].data.length,
          baseTimeoutMs: trialTimeoutMs,
          defaultProbe: trialProbe,
          allowWorker: opts.trialDecodeProbe === undefined,
        });
        // Đợt 71 Y5 — như mode stream: đăng ký run trial đang chạy để UI
        // hiện toast trạng thái khi trial lâu; end trong finally.
        const trialRunId = beginTrialDecodeRun({
          sampleBytes: chunks[0].data.length,
          timeoutMs: trialPlan.timeoutMs,
          viaWorker: trialPlan.viaWorker,
        });
        let trial: TrialDecodeResult;
        try {
          // Đợt 77 E7 — như mode stream: quét zero-run AVCC trước khi
          // decode ở đường main-thread; đường worker quét trong worker.
          // trialProbe null (opt-out, Q5(b)) thì BỎ QUA cả quét — opt-out
          // là tắt hẳn trial-decode, không chỉ tắt probe (test L8 khóa:
          // probe null thì moov giả phải lọt như trước).
          const zeroRun =
            trialProbe !== null && !trialPlan.viaWorker
              ? scanAvccZeroRun(chunks[0].data, track.codec)
              : null;
          trial =
            zeroRun !== null && zeroRun.violation
              ? {
                  passed: false,
                  skipped: false,
                  reason: `zero-run: ${zeroRun.reason}`,
                }
              : await runTrialDecode(
                  trialPlan.probe,
                  chunks[0].data,
                  trialDecodeConfigFromTrack(track),
                  trialPlan.timeoutMs,
                  lookup,
                );
        } finally {
          endTrialDecodeRun(trialRunId);
        }
        if (!trial.passed) {
          return fallback(
            trKey(
              lookup,
              "gop.demux.trialDecodeFailed",
              { reason: trial.reason },
              `demux-moov: trial-decode sample 0 lỗi (${trial.reason} — moov giả?)`,
            ),
          );
        }
        // Đợt 65 S6 — timeout fail-open như mode stream ở trên.
        if (trial.skipped && isTrialDecodeTimeoutReason(trial.reason)) {
          trialDecodeNote = trialDecodeTimeoutNote(
            lookup,
            trial.reason,
            trialPlan.timeoutMs,
            chunks[0].data.length,
          );
        }
      }
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
      ...(trialDecodeNote !== undefined ? { trialDecodeNote } : {}),
    };
  } catch (e) {
    if (e instanceof GopRangeFailure) return fallback(e.message);
    return fallback(`exception: ${(e as Error).message}`);
  }
}
