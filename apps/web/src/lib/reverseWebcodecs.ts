/**
 * Phase 9 đợt 32, luồng P5 — Cache frame phát ngược bằng WebCodecs.
 *
 * Đây là nền tảng (library), CHƯA nối vào preview.tsx: preview vẫn dùng
 * đường element-seek cũ cho tới khi prototype này đo xong trên footage
 * nhiễu + bộ nhớ thật (xem LIMITS P5). Không claim preview đã chạy
 * 30 fps ngược — chỉ claim library này decode + present ngược được
 * ở tốc độ đo trong harness probe-round32-p5-webcodecs-pipe.mjs.
 *
 * Thiết kế (từ số đo spike O5):
 * - Decode theo GOP (từ keyframe), KHÔNG decode từng frame lẻ: seek
 *   ngược từng frame bằng element-seek là bottleneck cũ (holdDelta
 *   487–591 ở GOP thưa); decode 1 GOP thưa chỉ ~1.1 s rồi present
 *   ngược từ cache.
 * - Cache là cửa sổ trượt, KHÔNG giữ cả video: caller giữ tối đa
 *   ~windowSize frame, evict phần ngoài cửa sổ và close() VideoFrame
 *   để trả bộ nhớ (VideoFrame nằm ngoài JS heap — jsHeap không thấy
 *   nó, nên không dùng jsHeap để ước bộ nhớ cache).
 * - Decode-ahead chạy nền: trong lúc present cửa sổ hiện tại, caller
 *   decode GOP kế tiếp (theo chiều ngược = GOP trước đó) rồi swap.
 *   Library không tự chạy decode-ahead (tránh race với vòng present);
 *   nó chỉ cung cấp decodeGop + presentReverse + evict.
 *
 * Giới hạn: decoder tạo mới mỗi GOP (đơn giản, tránh state reuse);
 * chi phí tạo decoder chưa đo riêng — nằm trong wall decode của probe.
 * Không xử lý audio (phát ngược vốn mute, như đường cũ).
 *
 * Đợt 34 Q2 (nối vào preview, sau cờ opt-in — xem reversePlayback.ts):
 * - presentReverse nay duyệt theo PRESENTATION timestamp giảm dần
 *   (đúng thứ tự present của footage có B-frame), không còn duyệt
 *   index giảm dần mù: decodeGop ghi lại presentation timestamp của
 *   từng sample đã decode; khi không có thông tin đó (caller cũ) thì
 *   giữ hành vi cũ (index giảm dần).
 * - Cửa sổ cache chốt theo NGÂN SÁCH BỘ NHỚ ĐO ĐƯỢC (không còn theo
 *   số frame cảm tính): xem REVERSE_CACHE_DEFAULT_WINDOW_FRAMES và
 *   windowFramesForMeasuredBudget; số đo thật nằm ở
 *   benchmarks/results/v34-q2-videoframe-memory.json.
 * - ReversePreviewController là điểm nối preview dùng: fetch + demux
 *   1 lần cho 1 source URL, decode cửa sổ chứa mốc thời gian được hỏi,
 *   frameAt() đồng bộ trả frame đúng mốc đó hoặc null (caller rơi về
 *   đường element cũ). Controller KHÔNG tự decode-ahead nhiều GOP —
 *   hoạch định decode-ahead thuộc luồng Q3 (reverseDecodeAhead.ts),
 *   không làm trùng ở đây.
 * - Ranh giới an toàn của controller: frameAt chỉ trả frame của đúng
 *   decode-index mà mốc thời gian tra ra; decode cửa sổ cũ (stale)
 *   có thể làm mất frame cửa sổ mới (evict) nhưng KHÔNG BAO GIỜ trả
 *   frame sai mốc — trường hợp xấu nhất là null -> fallback element.
 *
 * Đợt 35 R3 (sửa nợ buffer file của đợt 34 Q2 §5.1 — chọn hướng (b)):
 * - Hướng (a) fetch theo khoảng GOP KHÔNG chọn: cần phát hiện moov
 *   trước (moov có thể ở cuối file, kích thước chưa biết, cần nhiều
 *   lượt probe), cần server/proxy/blob hỗ trợ Range một cách đáng tin
 *   (nguồn preview là proxyUrl ?? url, không đảm bảo Range), và cần
 *   viết lại demux để parse moov từ mảnh byte rời — rủi ro vỡ đường
 *   decode đang chạy, đổi lại chỉ tiết kiệm lượt fetch lại.
 * - Hướng (b) ĐÃ chọn: giữ buffer file CHỈ trong lúc decode 1 cửa sổ,
 *   nhả ngay sau khi decodeGop trả về (đã flush, frame đã độc lập),
 *   cửa sổ khác thì fetch lại. Không cần server hỗ trợ gì thêm, không
 *   đổi demux, không đổi thứ tự decode. Đánh đổi ghi rõ: đổi cửa sổ
 *   tốn 1 lượt fetch lại toàn file (xem LIMITS R3); file lớn hơn
 *   ngưỡng thì không vào đường WebCodecs ngay từ đầu (fallback
 *   element cũ), nên lượt fetch lại chỉ xảy ra với file <= ngưỡng.
 * - Ngân sách nay tính cả buffer file: ngân sách tổng 320 MiB =
 *   192 MiB frame + 128 MiB file tối đa; cửa sổ hiệu dụng thu hẹp
 *   theo byte file còn giữ (windowFramesForTotalBudget); sau khi nhả
 *   thì retainedFileBytes = 0 nên trạng thái ổn định chỉ còn frame.
 *
 * Đợt 36 S4 (chặn đỉnh heap thoáng qua bằng File.size truyền trước):
 * - Controller nhận thêm `knownFileSizeBytes` (kích thước file mà
 *   caller đã biết trước khi fetch — ở preview là `item.file.size`).
 *   Nếu kích thước đó vượt ngưỡng file lớn thì controller khóa về
 *   fallback NGAY TỪ LÚC TẠO, trước cả HEAD và GET: không một request
 *   nào được phát ra, nên đỉnh heap thoáng qua ở cổng sau-tải của R3
 *   (file không header vẫn bị tải trọn vào heap rồi mới vứt) không
 *   còn xảy ra với nguồn local. Cổng này CHỈ có tác dụng khi caller
 *   truyền size đúng của chính URL đang fetch: preview chỉ truyền
 *   `item.file.size` khi KHÔNG có proxyUrl (đang phát bản gốc); khi
 *   có proxyUrl thì size gốc không phải size của proxy nên không
 *   truyền, các cổng HEAD/GET của R3 vẫn làm việc.
 * - Hướng (a) Range-fetch theo GOP cho file > 128 MiB KHÔNG làm ở
 *   đợt này: vẫn cần probe moov trước + hợp đồng Range cho mọi
 *   nguồn preview mà codebase không có (xem LIMITS S4 §4). File lớn
 *   vẫn fallback về đường element cũ — cổng File.size chỉ chặn sớm
 *   hơn, không mở đường WebCodecs cho file lớn.
 *
 * Đợt 37 T5 (huỷ fetch đang bay khi size tới muộn — nợ S4 §5.1):
 * - load() nay chạy dưới 1 AbortController riêng cho mỗi lần tải:
 *   HEAD và GET đều nhận signal của nó. Khi size vượt ngưỡng tới
 *   muộn (trong lúc fetch đang bay, controller chưa biết size) thì
 *   applyKnownFileSize huỷ fetch đó ngay thay vì để body chạy tới
 *   hết như trước — đỉnh heap ở cổng sau-tải không còn xảy ra trong
 *   trường hợp này, vì arrayBuffer() không bao giờ được gọi (fetch
 *   bị abort trước) hoặc bị reject khi đang chờ body.
 * - Giới hạn còn lại của cơ chế này (ghi rõ, không giấu): abort chỉ
 *   cứu được khi nó tới TRƯỚC lúc arrayBuffer() resolve. Sau khi
 *   buffer đã vật chất hóa thì không có cách nào "huỷ ngược" heap:
 *   load() chỉ còn tránh parse/decode (kiểm tra largeFile sau
 *   arrayBuffer) chứ đỉnh heap lúc đó đã xảy ra rồi. Tương tự, nếu
 *   tầng fetch phớt lờ signal (không phải fetch chuẩn của browser)
 *   thì arrayBuffer vẫn resolve đủ buffer rồi mới bị chặn ở kiểm
 *   tra sau-tải — hành vi an toàn (không decode, không giữ) nhưng
 *   không tiết kiệm heap. Xem LIMITS T5.
 * - dispose() cũng huỷ fetch đang bay (cùng controller), tránh
 *   fetch mồ côi sau khi preview đã bỏ controller.
 */
import type { Mp4Sample, Mp4VideoTrack } from "./mp4Demux";
import {
  gopStartFor,
  parseMp4VideoTrack,
  presentOrderFor,
  sampleChunkInit,
  sampleIndexForPresentationTime,
} from "./mp4Demux";
import {
  resolveDecodeAheadGate,
  type DecodeAheadDecision,
  type DecodeAheadGateInput,
  type SoftwareDecodeMeasurement,
} from "./reversePreviewGate";
import { ReverseDecodeAhead } from "./reverseDecodeAhead";
// Đợt 38 U1: logic thuần cho toggle decode-ahead (trạng thái UI + gộp
// decision). Module này không import ngược reverseWebcodecs nên không
// tạo chu trình import.
import {
  aggregateDecodeAheadDecisions,
  controllerLabel,
  decodeAheadGateInputForToggle,
  keepIndicesForWindow,
  prefetchFrameCount,
  resolveDecodeAheadUiStatus,
  shouldAutoApplyDecodeAhead,
  shouldDropSettledPrefetch,
  type DecodeAheadPerControllerStatus,
  type DecodeAheadUiStatus,
} from "./reverseDecodeAheadToggle";
// Đợt 40 V2 — nối GOP Range (T3) vào controller: ngưỡng + cache GOP +
// fetch bù 1 GOP. Chỉ import, không sửa gate U2 hay module T3.
import {
  buildGopSegment,
  fetchSingleGopRange,
  gopsForDecodeRange,
  GopSegmentCache,
  resolveGopRangeWiring,
  type GopMeta,
} from "./gopCache40V2";
import {
  fetchVideoTrackByGopRange,
  type GopRangeFetchFn,
  type GopSegment,
} from "./gopRangeFetch39T3";
// Đợt 41 W4 — phát hiện size cho proxy chưa biết size (HEAD /
// Content-Range) để đường GOP có thể kích hoạt khi size đã biết;
// probe hỏng thì rơi về full-file cũ, không throw, không bypass S4.
import {
  discoverSizeBytes,
  type GopSizeProbeSource,
} from "./gopSizeProbe41W4";

/**
 * Đợt 61 R6 — dịch lý do fallback GOP của chính controller (mẫu Q4).
 * `lookup` là `this.gopI18nLookup` (preview truyền `t()` lúc tạo
 * controller); vắng → fallback đúng từng chữ chuỗi VI cũ. Key trong
 * fragment R6 (`gop.controller.*`).
 */
type I18nLookup = (key: string, vars?: Record<string, string>) => string;
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
 * Ngân sách bộ nhớ mặc định cho 1 cửa sổ cache phát ngược (byte).
 * 192 MiB: đủ chứa cửa sổ 90 frame 720p theo số đo thật đợt này
 * (~1,9 MiB/frame, xem LIMITS Q2) với biên, đồng thời không nuốt hết
 * RAM máy yếu. Đổi hằng này phải kèm số đo mới, không đổi cảm tính.
 */
export const REVERSE_CACHE_MEMORY_BUDGET_BYTES = 192 * 1024 * 1024;

/**
 * Số frame cửa sổ tối đa trong ngân sách, theo số byte/frame ĐO ĐƯỢC
 * (không phải NV12 lý thuyết). Luôn >= 1. bytesPerFrame <= 0 -> 1
 * (không chia cho 0, không trả 0 frame gây cửa sổ rỗng).
 */
export function windowFramesForMeasuredBudget(
  bytesPerFrame: number,
  budgetBytes: number,
): number {
  if (!(bytesPerFrame > 0) || !(budgetBytes > 0)) return 1;
  return Math.max(1, Math.floor(budgetBytes / bytesPerFrame));
}

/**
 * Cửa sổ mặc định của controller nối preview, chốt từ số đo thật đợt
 * 34 Q2 (benchmarks/results/v34-q2-videoframe-memory.json): RSS cây
 * Chrome tăng ~732.708 KB cho 298 frame 720p giữ trong cache, tức
 * ~2,46 MB/frame (gấp ~1,8× NV12 lý thuyết 1,32 MB — VideoFrame
 * backing + đệm decoder/canvas, đo bằng delta RSS nên gồm cả nhiễu
 * chung của tiến trình, xem LIMITS Q2 §2). 192 MiB / 2,46 MB ≈ 79
 * frame; chốt 75 để chừa biên cho decoder + canvas + process khác.
 * 1080p đo được ~3,3 MB/frame nhưng mẫu đó nhiễm buffer file noise
 * 420 MB chưa GC nên chỉ mang tính chỉ dẫn (xem LIMITS Q2 §2.3);
 * cửa sổ vẫn đếm bằng frame, không tự thu theo độ phân giải.
 */
export const REVERSE_CACHE_DEFAULT_WINDOW_FRAMES = 75;

/**
 * Đợt 35 R3 — ngân sách bộ nhớ tính cả buffer file (nợ đợt 34 Q2 §5).
 *
 * - REVERSE_MEASURED_BYTES_PER_FRAME_720P: ~2,40 MiB/frame ở 720p,
 *   số đo thật đợt 34 Q2 (delta RSS cây Chrome cho 298 frame giữ).
 *   Dùng làm ước lượng mặc định; theo độ phân giải thì scale theo
 *   số pixel (cận trên thận trọng, không claim là số đo từng res).
 * - REVERSE_LARGE_FILE_FALLBACK_BYTES: file lớn hơn ngưỡng này thì
 *   controller KHÔNG vào đường WebCodecs (fallback đường element cũ
 *   ngay từ load, không decode). 128 MiB chọn sao cho trường hợp xấu
 *   nhất lúc đang decode vẫn trong ngân sách tổng: 128 MiB file +
 *   75 frame × 2,40 MiB ≈ 180 MiB frame = ~308 MiB < 320 MiB.
 * - REVERSE_TOTAL_MEMORY_BUDGET_BYTES: 320 MiB = 192 MiB frame +
 *   128 MiB file. Đây là trần cho tổng (frame + buffer file còn giữ)
 *   trong lúc decode; sau khi nhả buffer thì tổng ổn định chỉ còn
 *   frame (<= 192 MiB).
 */
export const REVERSE_MEASURED_BYTES_PER_FRAME_720P = Math.floor(
  2.4 * 1024 * 1024,
);
export const REVERSE_LARGE_FILE_FALLBACK_BYTES = 128 * 1024 * 1024;
export const REVERSE_TOTAL_MEMORY_BUDGET_BYTES =
  REVERSE_CACHE_MEMORY_BUDGET_BYTES + REVERSE_LARGE_FILE_FALLBACK_BYTES;

/** Ước byte/frame theo độ phân giải, scale pixel từ số đo 720p. */
export function estimatedBytesPerFrame(width: number, height: number): number {
  if (!(width > 0) || !(height > 0)) {
    return REVERSE_MEASURED_BYTES_PER_FRAME_720P;
  }
  return Math.max(
    1,
    Math.floor(
      (REVERSE_MEASURED_BYTES_PER_FRAME_720P * width * height) /
        (1280 * 720),
    ),
  );
}

/**
 * Số frame cửa sổ vừa ngân sách tổng khi còn giữ retainedFileBytes
 * byte file. Luôn >= 1 (không trả cửa sổ rỗng); file đã vượt ngân
 * sách tổng thì vẫn trả 1 — caller phải chặn file lớn bằng ngưỡng
 * fallback riêng trước khi gọi hàm này (controller làm vậy ở load).
 */
export function windowFramesForTotalBudget(
  bytesPerFrame: number,
  retainedFileBytes: number,
  totalBudgetBytes: number = REVERSE_TOTAL_MEMORY_BUDGET_BYTES,
): number {
  if (!(bytesPerFrame > 0) || !(totalBudgetBytes > 0)) return 1;
  const remaining = totalBudgetBytes - Math.max(0, retainedFileBytes);
  return Math.max(1, Math.floor(remaining / bytesPerFrame));
}

/** Tách bộ nhớ thành frame + buffer file + tổng (để test + harness đọc). */
export function reverseMemoryUsageBytes(
  frameCount: number,
  bytesPerFrame: number,
  retainedFileBytes: number,
): {
  frameBytes: number;
  retainedFileBytes: number;
  totalBytes: number;
} {
  const frameBytes = Math.max(0, frameCount) * Math.max(0, bytesPerFrame);
  const retained = Math.max(0, retainedFileBytes);
  return { frameBytes, retainedFileBytes: retained, totalBytes: frameBytes + retained };
}

export type ReverseFrame = {
  index: number;
  /** VideoFrame thật của browser (đã decode, chưa close). */
  frame: VideoFrame;
};

export type ReverseDrawFn = (frame: VideoFrame, index: number) => void;

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

/** Lấy dữ liệu sample (AVCC length-prefixed) từ file: caller tự fetch/slice. */
export type SampleDataProvider = (
  sample: Mp4Sample,
) => Promise<Uint8Array> | Uint8Array;

export class ReverseFrameCache {
  private cache = new Map<number, VideoFrame>();
  /** Presentation timestamp (µs, từ sampleChunkInit) theo decode-index. */
  private presentTs = new Map<number, number>();
  private closed = false;

  get size(): number {
    return this.cache.size;
  }

  has(index: number): boolean {
    return this.cache.has(index);
  }

  /** Frame đã decode tại decode-index, hoặc undefined khi chưa có. */
  get(index: number): VideoFrame | undefined {
    return this.cache.get(index);
  }

  /**
   * Decode toàn bộ sample [from, to] (from phải là keyframe — caller
   * dùng gopStartFor/reverseWindowFor để align). Trả về số frame
   * decode được; frame lỗi (nếu có) không vào cache, không ném —
   * caller kiểm tra số lượng so với kỳ vọng.
   */
  async decodeGop(
    track: Mp4VideoTrack,
    samples: Mp4Sample[],
    from: number,
    to: number,
    getData: SampleDataProvider,
    preferHardware = false,
  ): Promise<number> {
    if (this.closed) throw new Error("cache đã đóng");
    if (typeof VideoDecoder === "undefined") {
      throw new Error("browser này không có VideoDecoder");
    }
    // ROUND43-Y6 — WebCodecs từng phần: có VideoDecoder nhưng thiếu
    // EncodedVideoChunk thì không dựng decoder vô ích rồi mới hỏng ở
    // vòng decode (lỗi ReferenceError bị nuốt trong IIFE async, chỉ
    // còn lại decoded = 0 không rõ nguyên nhân). Trả 0 ngay để caller
    // khóa unsupported -> rơi về đường element như cũ, có lý do rõ ở
    // tầng resolveReverseEngineDetailed (badge/status).
    if (typeof EncodedVideoChunk === "undefined") {
      return 0;
    }
    // ROUND44-Z6 — probe VideoDecoder.isConfigSupported TRƯỚC configure
    // (khi API có): codec không hỗ trợ thì trả 0 ngay, KHÔNG dựng
    // decoder rồi mới hỏng ở configure như trước. Khi API vắng (bản
    // WebCodecs cũ / test fake không có static này) thì bỏ qua probe
    // và đi đường configure cũ — configure throw vẫn được bắt ở dưới.
    // Probe tự nó throw/reject thì cũng rơi xuống configure (không
    // đoán mò unsupported từ lỗi probe, vì configure mới là quyết
    // định cuối). Lưu ý: probe chỉ biết codec/config có được hỗ trợ
    // hay không, không chứng minh decode thật — caller vẫn khóa
    // unsupported khi decoded = 0 như cũ.
    const decoderConfig: VideoDecoderConfig = {
      codec: track.codec,
      codedWidth: track.width,
      codedHeight: track.height,
      description: track.description,
      hardwareAcceleration: preferHardware
        ? "prefer-hardware"
        : "prefer-software",
    };
    const vdWithProbe = VideoDecoder as unknown as {
      isConfigSupported?: (
        config: VideoDecoderConfig,
      ) => Promise<{ supported: boolean }>;
    };
    if (typeof vdWithProbe.isConfigSupported === "function") {
      try {
        const probe = await vdWithProbe.isConfigSupported(decoderConfig);
        if (!probe.supported) return 0;
      } catch {
        // Rơi xuống configure như cũ (xem trên).
      }
    }
    const range = samples.slice(from, to + 1);
    const byTimestamp = new Map<number, number>();
    for (const s of range) {
      const init = sampleChunkInit(track, s, new Uint8Array(0));
      // sampleChunkInit nay dùng presentation timestamp: decoder output
      // mang timestamp này nên map đúng cả khi có B-frame. Hai sample
      // trùng presentation timestamp (file lỗi) thì sample sau không
      // ghi đè sample trước — frame đó bị đếm thiếu, không map nhầm.
      if (!byTimestamp.has(init.timestamp)) {
        byTimestamp.set(init.timestamp, s.index);
      }
      this.presentTs.set(
        s.index,
        s.presentationTimestamp ?? s.timestamp,
      );
    }
    let decoded = 0;
    let decoderError: string | null = null;
    // ROUND49-E3 — số frame MỚI cần để resolve sớm (xem LIMITS E3 §1):
    // range thường chồng cache hiện tại (prefetch 412 chồng cửa sổ 412
    // 46/136 frame) nên decoded không bao giờ chạm range.length và
    // `done` chỉ resolve sau flush (đuôi flush 71–281 ms, D2 §3).
    // expectedNew = số sample trong range chưa có trong cache lúc bắt
    // đầu; khi mọi frame mới đã output thì caller đã đủ frame để
    // present, không cần chờ flush xả nốt các frame trùng (chúng chỉ
    // bị close). Fallback IIFE (feed hết + flush + resolve) giữ nguyên:
    // frame hỏng / decode dở thì decoded không chạm expectedNew và
    // `done` vẫn resolve ở cuối như cũ. expectedNew = 0 (toàn bộ đã
    // cache) thì giữ hành vi cũ (không resolve sớm trên output đầu).
    // An toàn vòng đời: điều kiện resolve-sớm-trước-flush đã tồn tại
    // cho range không chồng (decoded >= range.length); đổi này chỉ dời
    // ngưỡng xuống expectedNew, không thêm trạng thái mới — decoder
    // vẫn flush + close nền trong IIFE sau khi `done` resolve.
    const expectedNew = range.filter((s) => !this.cache.has(s.index)).length;
    // ROUND43-Y6 — dựng/configure thất bại (codec không hỗ trợ, cấu hình
    // lạ) trước đây làm promise `done` reject: decodeGop tự nó ném thay
    // vì trả 0, nên đường gọi không có try sẽ thành unhandled rejection
    // (caller ensureWindow có bắt, nhưng harness/gọi trực tiếp thì
    // không). Nay bắt tại chỗ, trả 0 để caller khóa unsupported -> về
    // đường element như cũ — cùng kết quả cuối, không còn rejection.
    let decoderSetupFailed = false;
    const done = new Promise<void>((resolve) => {
      let decoder: VideoDecoder;
      try {
        decoder = new VideoDecoder({
          output: (frame) => {
            const idx = byTimestamp.get(frame.timestamp);
            if (idx !== undefined && !this.cache.has(idx)) {
              this.cache.set(idx, frame);
              decoded++;
            } else {
              frame.close();
            }
            if (expectedNew > 0 && decoded >= expectedNew) resolve();
          },
          error: (e) => {
            decoderError = errMsg(e);
            resolve();
          },
        });
        decoder.configure(decoderConfig);
      } catch (e) {
        decoderError = errMsg(e);
        decoderSetupFailed = true;
        resolve();
        return;
      }
      void (async () => {
        try {
          for (const s of range) {
            const data = await getData(s);
            decoder.decode(
              new EncodedVideoChunk(sampleChunkInit(track, s, data)),
            );
          }
          await decoder.flush();
        } catch (e) {
          decoderError = errMsg(e);
        }
        resolve();
        try {
          decoder.close();
        } catch {
          /* đã đóng */
        }
      })();
    });
    await done;
    void decoderError;
    // ROUND43-Y6: dựng/configure thất bại -> 0 frame, caller khóa
    // unsupported -> đường element (xem khối try/catch phía trên).
    if (decoderSetupFailed) return 0;
    return decoded;
  }

  /**
   * Present ngược: gọi draw cho từng frame trong cache theo thứ tự
   * PRESENTATION giảm dần (đúng thứ tự xem của footage có B-frame).
   * Khi mọi frame trong đoạn đều có presentation timestamp đã ghi
   * (đường decodeGop mới) thì sắp theo timestamp đó; ngược lại giữ
   * hành vi cũ (index giảm dần). Frame thiếu trong cache bị bỏ qua
   * và đếm vào `missing` (không ném, không vẽ frame sai) — caller
   * dùng missing để biết cửa sổ chưa đủ frame.
   */
  presentReverse(
    from: number,
    to: number,
    draw: ReverseDrawFn,
  ): { drawn: number; missing: number } {
    let drawn = 0;
    let missing = 0;
    const present: number[] = [];
    for (let i = from; i <= to; i++) {
      if (this.cache.has(i)) present.push(i);
    }
    const allHaveTs = present.every((i) => this.presentTs.has(i));
    present.sort((a, b) => {
      if (allHaveTs) {
        const ta = this.presentTs.get(a) as number;
        const tb = this.presentTs.get(b) as number;
        if (ta !== tb) return tb - ta;
      }
      return b - a;
    });
    for (const i of present) {
      const frame = this.cache.get(i) as VideoFrame;
      draw(frame, i);
      drawn++;
    }
    missing = to - from + 1 - drawn;
    return { drawn, missing };
  }

  /** Đóng + xóa mọi frame ngoài tập keep (giữ cửa sổ trượt gọn). */
  evictExcept(keep: Set<number>): number {
    let evicted = 0;
    for (const [idx, frame] of this.cache) {
      if (!keep.has(idx)) {
        try {
          frame.close();
        } catch {
          /* đã đóng */
        }
        this.cache.delete(idx);
        this.presentTs.delete(idx);
        evicted++;
      }
    }
    return evicted;
  }

  closeAll(): void {
    this.closed = true;
    for (const frame of this.cache.values()) {
      try {
        frame.close();
      } catch {
        /* đã đóng */
      }
    }
    this.cache.clear();
    this.presentTs.clear();
  }
}

/**
 * Controller nối preview (đợt 34 Q2): 1 instance cho 1 source URL.
 * Luồng dùng từ preview: frameAt(timeSec) đồng bộ — có frame đúng
 * mốc thì trả, chưa có thì kích decode nền (không await trong draw)
 * và trả null để caller rơi về đường element cũ. Mọi lỗi fetch/demux/
 * decode đều khóa controller về unsupported (không ném ra draw) và
 * mọi lần hỏi sau đều trả null ngay — đường cũ không bao giờ bị
 * chặn bởi lỗi của đường mới.
 */
/**
 * Đợt 37 T2 — đoạn decode của cửa sổ present NGAY TRƯỚC cửa sổ hiện tại
 * (theo chiều ngược = present position nhỏ hơn), để prefetch decode-ahead.
 * Hàm thuần (test được không cần browser):
 * - Lấy windowFrames sample present ngay trước presentFromPos (vị trí
 *   present đầu cửa sổ hiện tại trong mảng order), sắp theo decode-index
 *   rồi GOP-align đầu đoạn về keyframe (gopStartFor) — decode luôn bắt
 *   đầu từ keyframe, như Q3.
 * - Trả null khi không còn cửa sổ trước (đầu video) hoặc đoạn rỗng.
 * - Caller chỉ prefetch khi đoạn này mở rộng về phía trước so với cửa
 *   sổ hiện tại (from < decodeFrom hiện tại); đoạn nằm trọn trong cửa
 *   sổ hiện tại thì đã decode rồi, không prefetch lại.
 */
export function precedingDecodeRange(
  order: number[],
  presentFromPos: number,
  windowFrames: number,
  samples: Mp4Sample[],
): { from: number; to: number } | null {
  if (!(windowFrames > 0) || presentFromPos <= 0) return null;
  const prevFrom = Math.max(0, presentFromPos - windowFrames);
  if (prevFrom >= presentFromPos) return null;
  const decodeIdx = order.slice(prevFrom, presentFromPos).sort((a, b) => a - b);
  if (decodeIdx.length === 0) return null;
  return {
    from: gopStartFor(samples, decodeIdx[0]),
    to: decodeIdx[decodeIdx.length - 1],
  };
}

export type ReversePreviewControllerOptions = {
  /** Ngưỡng file lớn -> fallback element (mặc định 128 MiB). Test có
   *  thể truyền ngưỡng nhỏ để chứng minh cổng mà không cần file lớn thật. */
  largeFileBytes?: number;
  /** Ngân sách tổng (frame + buffer file) cho cửa sổ hiệu dụng. */
  totalBudgetBytes?: number;
  /** Đợt 36 S4 — kích thước file caller đã biết TRƯỚC khi fetch
   *  (vd: `File.size` của file local). Chỉ có nghĩa khi đây đúng là
   *  kích thước của URL đang fetch (xem ghi chú ở đầu file: khi phát
   *  proxy thì KHÔNG truyền size của file gốc). Giá trị không hợp lệ
   *  (<= 0, NaN, vô cực) được coi như chưa biết. Vượt ngưỡng file
   *  lớn -> khóa fallback ngay từ constructor, trước cả HEAD/GET. */
  knownFileSizeBytes?: number;
  /**
   * Đợt 40 V2 — bật đường GOP Range cho controller này (mặc định TẮT,
   * giữ nguyên hành vi cũ cho mọi controller tự tạo/test cũ). Chỉ có
   * tác dụng khi preview bật tường minh qua registry; quyết ngưỡng
   * thật (32 MiB < size <= 128 MiB) nằm ở resolveGopRangeWiring và
   * được đánh giá lúc cửa sổ đầu tiên, dựa trên size đã biết lúc đó.
   */
  gopRangeEnabled?: boolean;
  /** Đợt 40 V2 — ghi đè ngưỡng dưới cho test (production không truyền). */
  gopThresholdBytes?: number;
  /** Đợt 40 V2 — ghi đè trần cache GOP cho test (production không truyền). */
  gopCacheMaxBytes?: number;
  /** Đợt 40 V2 — fetch dùng cho đường GOP (test truyền fake; production
   *  để trống để dùng global fetch qua module T3 / adapter bên dưới). */
  gopFetchImpl?: GopRangeFetchFn;
  /**
   * Đợt 60 Q4 — lookup i18n tùy chọn cho lý do fallback GOP
   * (`gopFallbackReason`, chỉ test/diagnostics đọc, không phải chuỗi
   * UI): preview truyền `t()` để lý do đi qua key `gop.*` trong dict;
   * vắng → fallback VI cũ như trước.
   */
  i18nLookup?: (key: string, vars?: Record<string, string>) => string;
};

export class ReversePreviewController {
  private cache = new ReverseFrameCache();
  private track: Mp4VideoTrack | null = null;
  private bytes: Uint8Array | null = null;
  private loadPromise: Promise<boolean> | null = null;
  /** Đợt 37 T5 — controller huỷ lần tải đang bay (null khi không tải). */
  private loadAbort: AbortController | null = null;
  private unsupported = false;
  private largeFile = false;
  private knownFileSize: number | null = null;
  private decodePromise: Promise<boolean> | null = null;
  private lastWindowKey: string | null = null;
  private lastDecodeRange: { from: number; to: number } | null = null;
  // Đợt 37 T2 — nối cửa sổ Q3 vào controller, SAU cổng opt-in S3:
  // mặc định TẮT; chỉ bật khi enableDecodeAheadFromGate trả
  // allowed-experiment. Khi bật, mỗi lần decode xong 1 cửa sổ thì
  // prefetch cửa sổ present ngay trước nó (precedingDecodeRange) bằng
  // ReverseDecodeAhead, và tập keep của evict mở rộng thêm đoạn đó để
  // frame prefetch không bị xóa ngay. Khi tắt, hành vi y hệt cũ
  // (không prefetch, keep chỉ cửa sổ hiện tại). Bật giữa chừng chỉ có
  // tác dụng từ lần decode cửa sổ MỚI tiếp theo (buffer file của cửa
  // sổ cũ đã nhả nên không prefetch ngược được cho cửa sổ đang giữ).
  private decodeAheadEnabled = false;
  private decodeAheadWarnings: string[] = [];
  private decodeAhead: ReverseDecodeAhead | null = null;
  private aheadRange: { from: number; to: number } | null = null;
  // Đợt 39 T4: decision cổng gần nhất của RIÊNG controller này (để
  // status nhiều controller không dùng chung decision toàn cục) và số
  // frame prefetch đã bị dọn sau khi tắt (để harness đếm, xem
  // dropSettledPrefetchIfOff). Cả hai đều reset ở disable/dispose.
  private lastGateDecision: DecodeAheadDecision | null = null;
  private settledPrefetchDropped = 0;
  // Đợt 38 U1: số đo decode phần mềm của cửa sổ vừa decode xong trên
  // đúng controller/footage này (frames / wall của decodeGop, KHÔNG
  // tính thời gian fetch). Null = chưa decode cửa sổ nào → cổng chưa
  // có gì để mở (toggle bật lúc này sẽ hiện "bị chặn", không bịa số).
  // Nhãn tải luôn "under-load": app không chứng minh được cửa sổ quiet
  // nên không bao giờ ghi "quiet" cho số đo này (luật cổng S3).
  private lastDecodeMeasurement: SoftwareDecodeMeasurement | null = null;
  private disposed = false;
  // Đợt 40 V2 — trạng thái đường GOP Range (mặc định tắt hoàn toàn):
  // gopAttempted: đã thử GOP 1 lần (chỉ thử 1 lần cho 1 controller —
  // thử lại mỗi cửa sổ khi gate đã từ chối chỉ tốn request vô ích);
  // gopActive: lần thử đó thành công và track đang từ đường GOP;
  // gopMeta: range từng GOP (không giữ chunk); gopCache: chunk GOP
  // của các cửa sổ đã decode, có trần; gopFallbackReason: lý do T3
  // trả full-file (để test/harness đọc, không phải chuỗi UI).
  private gopEnabled = false;
  private gopThresholdBytes?: number;
  private gopFetchImpl?: GopRangeFetchFn;
  // Đợt 60 Q4 — lookup i18n cho lý do fallback GOP (xem options).
  private gopI18nLookup?: (key: string, vars?: Record<string, string>) => string;
  private gopCache: GopSegmentCache;
  private gopAttempted = false;
  private gopActive = false;
  private gopMeta: GopMeta[] = [];
  private gopFallbackReasonValue: string | null = null;
  // Đợt 65 S6 — ghi chú trial-decode timeout (fail-open) từ outcome T3
  // (null = không timeout / chưa thử GOP); UI đọc qua getter
  // `gopTrialDecodeNote` + hàm registry `reverseTrialDecodeTimeoutNotes`
  // để báo user lý do keyframe chưa kịp kiểm chứng.
  private gopTrialDecodeNoteValue: string | null = null;
  // Đợt 41 W4 — kết quả probe size cho controller chưa biết size:
  // source/size khi probe thành công, lý do khi probe hỏng (để
  // test/harness đọc; probe hỏng không đánh dấu gopAttempted để
  // lần cửa sổ sau — khi load cũ đã hỏng mà track vẫn chưa có —
  // còn được probe lại, theo gợi ý V2 §5.2).
  private gopSizeProbeSourceValue: GopSizeProbeSource | null = null;
  private gopSizeProbeSizeValue: number | null = null;
  private gopSizeProbeReasonValue: string | null = null;
  private url: string;
  private windowFrames: number;
  private largeFileBytes: number;
  private totalBudgetBytes: number;

  constructor(
    url: string,
    windowFrames: number = REVERSE_CACHE_DEFAULT_WINDOW_FRAMES,
    options: ReversePreviewControllerOptions = {},
  ) {
    // Không dùng parameter properties (private trong constructor) vì
    // Node type-stripping không erasable được cú pháp đó.
    this.url = url;
    this.windowFrames = windowFrames;
    this.largeFileBytes =
      options.largeFileBytes ?? REVERSE_LARGE_FILE_FALLBACK_BYTES;
    this.totalBudgetBytes =
      options.totalBudgetBytes ?? REVERSE_TOTAL_MEMORY_BUDGET_BYTES;
    // Đợt 40 V2: ghi nhận cờ GOP + ghi đè test (không đổi mặc định
    // production: tắt, ngưỡng 32 MiB, cache 16 MiB (đợt 51 H4) — xem gopCache40V2).
    this.gopEnabled = options.gopRangeEnabled ?? false;
    this.gopThresholdBytes = options.gopThresholdBytes;
    this.gopFetchImpl = options.gopFetchImpl;
    // Đợt 60 Q4 — lookup i18n cho lý do fallback GOP (preview truyền t()).
    this.gopI18nLookup = options.i18nLookup;
    this.gopCache = new GopSegmentCache(options.gopCacheMaxBytes);
    // Đợt 36 S4: cổng File.size truyền trước — chặn trước cả HEAD.
    // applyKnownFileSize chỉ ghi nhận size hợp lệ; size vượt ngưỡng
    // khóa luôn largeFile + unsupported tại đây.
    this.applyKnownFileSize(options.knownFileSizeBytes);
  }

  /**
   * Đợt 36 S4 — ghi nhận kích thước file đã biết trước khi fetch.
   * Quy tắc "biết trước thắng một lần": controller đã có known size
   * thì lần gọi sau bị bỏ qua (tránh registry ghi đè size đúng bằng
   * size sai của một caller khác cùng URL). Trả true khi cổng file
   * lớn đã khóa (fallback), false khi chưa khóa. Không phát request.
   * Lưu ý: cổng này chỉ chặn được khi size được truyền TRƯỚC lần
   * fetch đầu tiên — preview luôn truyền ở lần gọi frameAt đầu tiên
   * nên đường production thỏa điều kiện này; nếu fetch đã bay thì
   * Đợt 37 T5: size tới muộn TRONG LÚC fetch đang bay nay HỦY ĐƯỢC
   * (AbortController của lần tải đó) — xem LIMITS T5 cho trường hợp
   * không huỷ được (đã tải xong / đã biết size / buffer đã vật chất
   * hóa) và fallback an toàn của từng trường hợp.
   */
  applyKnownFileSize(size: number | undefined): boolean {
    if (this.knownFileSize !== null) return this.largeFile;
    if (!(typeof size === "number") || !Number.isFinite(size) || size <= 0) {
      return false;
    }
    // Đợt 37 T5: size vượt ngưỡng tới muộn thì huỷ lần tải đang bay
    // TRƯỚC khi khóa, để fetch không chạy tiếp tới arrayBuffer().
    // Size trong ngưỡng không huỷ (tải tiếp bình thường).
    if (size > this.largeFileBytes) this.abortInFlightLoad();
    return this.rejectLargeFile(size);
  }

  /**
   * Đợt 37 T5 — huỷ lần tải đang bay nếu có (HEAD hoặc GET). Không
   * làm gì khi không tải (loadAbort đã null sau khi tải settle).
   * Abort chỉ dừng phía client: body chưa đọc sẽ không vào heap;
   * tầng network có thể vẫn xả nốt phần đã đệm, nhưng arrayBuffer()
   * không bao giờ resolve với dữ liệu đó (promise bị reject).
   */
  private abortInFlightLoad(): void {
    try {
      this.loadAbort?.abort();
    } catch {
      /* abort không được làm hỏng đường khóa fallback */
    }
  }

  get ready(): boolean {
    return this.track !== null;
  }

  get failed(): boolean {
    return this.unsupported;
  }

  get cacheSize(): number {
    return this.cache.size;
  }

  /** Byte file còn giữ lúc này: > 0 chỉ trong lúc decode 1 cửa sổ,
   *  = 0 sau khi decode xong (đã nhả) hoặc khi fallback file lớn. */
  get retainedFileBytes(): number {
    // Đợt 40 V2: ở đường GOP không giữ buffer file (bytes null) nhưng
    // có giữ chunk GOP trong cache — tính đúng byte đó vào ngân sách
    // để memoryUsage không báo 0 sai. Đường full-file cũ không đổi.
    if (this.bytes) return this.bytes.length;
    return this.gopCache ? this.gopCache.bytes : 0;
  }

  /** Đợt 40 V2 — trạng thái đường GOP (để test/harness đọc). */
  get gopMode(): "off" | "gop-range" | "full-file-fallback" {
    if (this.gopActive) return "gop-range";
    if (this.gopAttempted) return "full-file-fallback";
    return "off";
  }

  /** Đợt 40 V2 — lý do T3 trả full-file (null khi chưa thử / đang chạy GOP). */
  get gopFallbackReason(): string | null {
    return this.gopFallbackReasonValue;
  }

  /**
   * Đợt 65 S6 — ghi chú trial-decode timeout (fail-open) của lần thử GOP
   * gần nhất: null khi trial-decode có verdict / không chạy / chưa thử.
   * Chuỗi đã localize (qua lookup `gop.trial.timeoutNote` hoặc rớt về lý
   * do timeout `gop.trial.timeout`) — UI hiển thị nguyên văn.
   */
  get gopTrialDecodeNote(): string | null {
    return this.gopTrialDecodeNoteValue;
  }

  /** Đợt 41 W4 — probe size đã chạy chưa và kết quả (null = chưa probe). */
  get gopSizeProbe(): {
    source: GopSizeProbeSource;
    size: number | null;
  } | null {
    if (this.gopSizeProbeSourceValue === null) return null;
    return {
      source: this.gopSizeProbeSourceValue,
      size: this.gopSizeProbeSizeValue,
    };
  }

  /** Đợt 41 W4 — lý do probe size hỏng (null khi probe thành công/chưa chạy). */
  get gopSizeProbeReason(): string | null {
    return this.gopSizeProbeReasonValue;
  }

  /** Đợt 40 V2 — thống kê cache GOP (segments/bytes/hits/misses/evicted). */
  get gopCacheStats(): {
    segments: number;
    bytes: number;
    hits: number;
    misses: number;
    evictedBytes: number;
  } {
    return this.gopCache.stats();
  }

  /** true khi file bị chặn ở cổng file lớn -> preview dùng đường element cũ. */
  get largeFileFallback(): boolean {
    return this.largeFile;
  }

  /**
   * Đợt 37 T2 — bật/tắt decode-ahead Q3 QUA CỔNG S3, không bật trực tiếp.
   * Trả về đúng decision của resolveDecodeAheadGate; chỉ khi
   * allowed-experiment mới bật + giữ warnings (đúng chuỗi trong module
   * cổng, UI hiển thị nguyên văn — xem preview.tsx badge decode-ahead).
   * Khi blocked thì tắt (kể cả khi trước đó đã bật) và xóa warnings, để
   * không còn cảnh báo cũ treo sau khi cổng đóng. Mirror warnings lên
   * window.__vcutReverseDecodeAheadWarnings theo mẫu __vcutReverseWc.
   * Đợt 39 T4: decision này còn ghi riêng cho từng controller
   * (lastGateDecision) để status/badge nhiều controller không phải
   * dùng chung 1 decision toàn cục rồi hiện nhầm lý do của clip khác.
   */
  enableDecodeAheadFromGate(
    input: DecodeAheadGateInput,
  ): DecodeAheadDecision {
    const decision = resolveDecodeAheadGate(input);
    if (decision.verdict === "allowed-experiment") {
      this.decodeAheadEnabled = true;
      this.decodeAheadWarnings = [...decision.warnings];
    } else {
      this.decodeAheadEnabled = false;
      this.decodeAheadWarnings = [];
    }
    // Đợt 38 U1: ghi decision gần nhất để UI toggle hiện đúng lý do
    // chặn (kể cả khi caller là probe trực tiếp, không qua toggle).
    decodeAheadLastDecision = decision;
    this.lastGateDecision = decision;
    this.mirrorDecodeAheadWarnings();
    return decision;
  }

  /**
   * Đợt 38 U1 — tắt decode-ahead do user bấm toggle (khác với bị cổng
   * chặn: không tạo decision, không để lại lý do chặn). Prefetch đang
   * bay (nếu có) vẫn có thể hoàn tất 1 cửa sổ rồi thôi — "tắt" ở đây
   * nghĩa là không khởi động prefetch MỚI nào nữa, và aheadRange về
   * null ngay để badge không còn báo prefetch đang chạy.
   * Đợt 39 T4: prefetch đang bay đó nay bị DỌN khi settle (xem
   * dropSettledPrefetchIfOff) thay vì nằm lại trong cache tới lần
   * decode cửa sổ sau — nên "tắt" nay có nghĩa đầy đủ: không prefetch
   * mới + không giữ frame prefetch dở sau khi tắt.
   */
  disableDecodeAhead(): void {
    this.decodeAheadEnabled = false;
    this.decodeAheadWarnings = [];
    this.aheadRange = null;
    this.lastGateDecision = null;
    this.mirrorDecodeAheadWarnings();
    // ROUND49-E3 — dọn prefetch đã settle TRƯỚC khi tắt (xem LIMITS E3 §0.2):
    // hướng (b) cho decodeGop resolve sớm khi đủ frame mới nên prefetch
    // có thể settle trước toggle; lúc đó .then(drop) đã chạy khi còn bật
    // nên no-op, frame prefetch nằm lại cache sau khi tắt (badge báo
    // prefetch 0 nhưng cache vẫn giữ 90 frame). Chỉ dọn khi KHÔNG còn
    // prefetch nào bay — prefetch đang bay thì .then(drop) sau settle
    // vẫn dọn như cũ (tránh evict frame của decoder đang output dở);
    // dropSettledPrefetchIfOff tự hoãn khi có decode cửa sổ bay.
    if (this.decodeAhead && this.decodeAhead.inFlightCount === 0) {
      this.dropSettledPrefetchIfOff();
    }
  }

  /**
   * Đợt 39 T4 — dọn đoạn prefetch vừa settle khi controller đang tắt
   * (luật shouldDropSettledPrefetch: chỉ evict khi đang tắt + không
   * dispose + không có decode cửa sổ nào đang bay). Nếu lúc settle mà
   * đang có decode cửa sổ bay thì CHỜ decode đó xong rồi thử lại
   * (tránh evict nhầm frame của cửa sổ đang decode dở; đồng thời đóng
   * khe frame prefetch đáp sau lần evict của cửa sổ đó mà không còn
   * lần decode nào sau nữa để dọn). Số frame đã đóng cộng vào
   * settledPrefetchDropped để status phơi cho harness đếm.
   */
  private dropSettledPrefetchIfOff(): void {
    // Không biết cửa sổ hiện tại thì không evict (tránh xóa nhầm):
    // trường hợp này không xảy ra trên đường thật vì prefetch chỉ bắt
    // đầu sau một lần decode cửa sổ đã ghi lastDecodeRange, nhưng giữ
    // guard để settle-drop không bao giờ xóa mù.
    if (!this.lastDecodeRange) return;
    if (
      !shouldDropSettledPrefetch(
        this.decodeAheadEnabled,
        this.disposed,
        this.decodePromise !== null,
      )
    ) {
      // Chỉ hoãn khi đúng trường hợp "decode đang bay" (còn tắt mà đã
      // bật lại / đã dispose thì thôi, không dọn nữa).
      if (
        !this.decodeAheadEnabled &&
        !this.disposed &&
        this.decodePromise !== null
      ) {
        const p = this.decodePromise;
        void p.then(
          () => this.dropSettledPrefetchIfOff(),
          () => this.dropSettledPrefetchIfOff(),
        );
      }
      return;
    }
    const dropped = this.cache.evictExcept(
      keepIndicesForWindow(this.lastDecodeRange),
    );
    this.settledPrefetchDropped += dropped;
  }

  /** Số cửa sổ prefetch đang bay của controller này (0 khi không có). */
  get inFlightPrefetchCount(): number {
    return this.decodeAhead ? this.decodeAhead.inFlightCount : 0;
  }

  /** Số frame prefetch đã bị dọn sau khi tắt (cộng dồn, để harness đếm). */
  get settledPrefetchDroppedCount(): number {
    return this.settledPrefetchDropped;
  }

  /**
   * Đợt 41 W1 — quan sát cho harness bắt nhánh hoãn-dọn (chỉ đọc,
   * không đổi hành vi decode): true khi đang có decode cửa sổ bay
   * (decodePromise != null), và số frame thật đang giữ trong cache.
   * Hai số này là thứ duy nhất phân biệt "prefetch settle mà chưa dọn
   * vì decode đang bay" với "prefetch settle rồi dọn ngay": mirror cũ
   * chỉ có settled counter + aheadRange (về null ngay khi tắt) nên
   * không thấy được frame còn nằm lại trong cache trong lúc hoãn.
   */
  get decodeWindowInFlight(): boolean {
    return this.decodePromise !== null;
  }

  /** Số VideoFrame thật đang giữ trong cache (không phải aheadRange). */
  get cacheFrameCount(): number {
    return this.cache.size;
  }

  /** Decision cổng gần nhất của riêng controller này (null = chưa thử). */
  get lastGateDecisionForController(): DecodeAheadDecision | null {
    return this.lastGateDecision
      ? {
          ...this.lastGateDecision,
          reasons: [...this.lastGateDecision.reasons],
          warnings: [...this.lastGateDecision.warnings],
        }
      : null;
  }

  /** Số đo decode thật gần nhất của controller này (null = chưa đo). */
  get lastSoftwareDecodeMeasurement(): SoftwareDecodeMeasurement | null {
    return this.lastDecodeMeasurement
      ? { ...this.lastDecodeMeasurement }
      : null;
  }

  /** Decode-ahead Q3 có đang bật cho controller này không (mặc định false). */
  get decodeAheadActive(): boolean {
    return this.decodeAheadEnabled;
  }

  /** Cảnh báo UI đi kèm lần bật gần nhất (rỗng khi chưa bật / bị chặn). */
  get decodeAheadWarningList(): string[] {
    return [...this.decodeAheadWarnings];
  }

  /** Đoạn decode-ahead đang giữ (null khi chưa prefetch / đã tắt). */
  get aheadDecodeRange(): { from: number; to: number } | null {
    return this.aheadRange ? { ...this.aheadRange } : null;
  }

  private mirrorDecodeAheadWarnings(): void {
    try {
      if (typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).__vcutReverseDecodeAheadWarnings =
          [...this.decodeAheadWarnings];
      }
    } catch {
      /* đo thống kê không được làm hỏng draw */
    }
  }

  /** Kích thước file đã biết qua header (null khi server không báo). */
  get knownFileSizeBytes(): number | null {
    return this.knownFileSize;
  }

  /** Bộ nhớ ước lượng lúc này: frame trong cache + buffer file còn giữ. */
  memoryUsage(): {
    frameBytes: number;
    retainedFileBytes: number;
    totalBytes: number;
    frameBudgetBytes: number;
    totalBudgetBytes: number;
    largeFileFallback: boolean;
  } {
    const bytesPerFrame = this.track
      ? estimatedBytesPerFrame(this.track.width, this.track.height)
      : REVERSE_MEASURED_BYTES_PER_FRAME_720P;
    const usage = reverseMemoryUsageBytes(
      this.cache.size,
      bytesPerFrame,
      this.retainedFileBytes,
    );
    return {
      ...usage,
      frameBudgetBytes: REVERSE_CACHE_MEMORY_BUDGET_BYTES,
      totalBudgetBytes: this.totalBudgetBytes,
      largeFileFallback: this.largeFile,
    };
  }

  /** Nhả buffer file ngay (không chờ GC): dùng sau decode và khi dispose. */
  private releaseFileBuffer(): void {
    this.bytes = null;
    this.loadPromise = null;
  }

  /**
   * Thử đọc kích thước file bằng HEAD (không tải body). Trả null khi
   * server không hỗ trợ HEAD, không báo content-length, hoặc lỗi —
   * caller khi đó vẫn thử GET và kiểm tra header GET trước khi đọc body.
   * HEAD không bao giờ tự nó chặn file: chỉ là gợi ý sớm để tránh tải
   * body của file lớn.
   */
  private async probeFileSize(signal?: AbortSignal): Promise<number | null> {
    try {
      reverseControllerFetchStats.fetches++;
      const resp = await fetch(this.url, { method: "HEAD", signal });
      if (!resp.ok) return null;
      const raw = resp.headers ? resp.headers.get("content-length") : null;
      const n = raw === null ? NaN : Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }

  /** Cổng file lớn: true = file này không được vào đường WebCodecs. */
  private rejectLargeFile(size: number): boolean {
    if (size > this.largeFileBytes) {
      this.knownFileSize = size;
      this.largeFile = true;
      this.unsupported = true;
      this.releaseFileBuffer();
      return true;
    }
    this.knownFileSize = size;
    return false;
  }

  private async load(): Promise<boolean> {
    if (this.track && this.bytes) return true;
    if (this.unsupported || this.disposed) return false;
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        // Đợt 37 T5: mỗi lần tải có 1 AbortController riêng để
        // applyKnownFileSize / dispose huỷ được fetch đang bay.
        // ROUND43-Y6 — AbortController vắng mặt (browser rất cũ) thì
        // `new AbortController()` trước đây ném RA NGOÀI khối try/catch
        // của IIFE này, làm loadPromise reject, rồi ensureWindow
        // reject theo, trong khi frameAt chỉ void promise đó -> thành
        // unhandled rejection dù draw vẫn rơi về element. Nay chặn
        // ngay: loadPromise resolve false -> load() khóa unsupported
        // -> đường element, không còn rejection trôi nổi.
        if (typeof AbortController === "undefined") return false;
        const abort = new AbortController();
        this.loadAbort = abort;
        try {
          // Cổng 1 — HEAD: biết trước file lớn thì không tải body.
          const headSize = await this.probeFileSize(abort.signal);
          // Size tới muộn đã huỷ trong lúc HEAD bay: không phát GET.
          if (abort.signal.aborted) return false;
          if (headSize !== null && this.rejectLargeFile(headSize)) {
            return false;
          }
          reverseControllerFetchStats.fetches++;
          const resp = await fetch(this.url, { signal: abort.signal });
          if (abort.signal.aborted) {
            try {
              await resp.body?.cancel();
            } catch {
              /* đã huỷ, không đọc tiếp */
            }
            return false;
          }
          if (!resp.ok) return false;
          // Cổng 2 — header GET: biết trước khi đọc body thì huỷ body,
          // không để arrayBuffer() nuốt cả file lớn vào heap.
          const getRaw = resp.headers
            ? resp.headers.get("content-length")
            : null;
          const getSize = getRaw === null ? NaN : Number(getRaw);
          if (Number.isFinite(getSize) && getSize > 0) {
            if (this.rejectLargeFile(getSize)) {
              try {
                await resp.body?.cancel();
              } catch {
                /* huỷ body thất bại thì vẫn đã chặn, không đọc tiếp */
              }
              return false;
            }
          }
          const buf = await resp.arrayBuffer();
          // Đợt 37 T5: size tới muộn đã khóa fallback trong lúc
          // arrayBuffer bay (tầng fetch phớt lờ signal, hoặc abort
          // tới sau khi buffer resolve): KHÔNG parse/decode buffer
          // này nữa — đỉnh heap lúc đó đã xảy ra và không huỷ ngược
          // được, nhưng ít nhất không decode thêm và không giữ buffer
          // (buf rơi khỏi scope khi hàm trả về, xem LIMITS T5).
          if (this.largeFile || this.disposed) return false;
          // Cổng 3 — không header nào báo kích thước: chỉ sau khi tải
          // mới biết file lớn thì vứt ngay, không parse/decode, và khóa
          // unsupported để không tải lại. Đỉnh heap thoáng qua trong
          // lúc tải là giới hạn còn lại của hướng (b) — xem LIMITS R3.
          if (buf.byteLength > this.largeFileBytes) {
            this.rejectLargeFile(buf.byteLength);
            return false;
          }
          const track = parseMp4VideoTrack(buf, this.gopI18nLookup);
          if (this.disposed) return false;
          this.track = track;
          this.bytes = new Uint8Array(buf);
          this.knownFileSize = buf.byteLength;
          return true;
        } catch {
          return false;
        } finally {
          // Tải đã settle: lần tải sau (nếu có) dùng controller mới,
          // applyKnownFileSize sau thời điểm này không huỷ nhầm tải cũ.
          if (this.loadAbort === abort) this.loadAbort = null;
        }
      })();
    }
    const ok = await this.loadPromise;
    if (!ok) this.unsupported = true;
    return ok;
  }

  /**
   * Đợt 40 V2 — fetch dùng cho đường GOP khi test không truyền
   * gopFetchImpl: global fetch chuẩn (đủ shape GopRangeFetchFn: status,
   * headers.get, arrayBuffer, body.cancel). T3 dùng mặc định này khi
   * fetchImpl vắng; adapter này chỉ phục vụ fetchSingleGopRange.
   */
  private gopDefaultFetch(): GopRangeFetchFn {
    // Response chuẩn đã đủ shape GopRangeFetchFn (status, headers.get,
    // arrayBuffer, body.cancel); chỉ cần cast qua unknown vì kiểu
    // init của fetch rộng hơn kiểu init thu hẹp của T3.
    return fetch as unknown as GopRangeFetchFn;
  }

  /**
   * Đợt 40 V2 — lấy sample bytes từ cache GOP, fetch bù 1 GOP khi
   * miss (dùng cho prefetch decode-ahead; đường decode chính đã
   * pre-resolve mọi GOP trước khi decode nên không dựa vào đây để
   * tránh decode nửa vời). Fetch bù hỏng thì throw để decodeGop của
   * prefetch nuốt thành prefetch thiếu frame (mềm, không chặn cửa
   * sổ chính); cửa sổ chính không gọi hàm này sau pre-resolve.
   */
  private async gopSampleData(s: Mp4Sample): Promise<Uint8Array> {
    const meta = this.gopMeta.find(
      (g) => s.index >= g.firstSampleIndex && s.index <= g.lastSampleIndex,
    );
    if (!meta) throw new Error(`gopSampleData: sample ${s.index} không thuộc GOP nào`);
    const track = this.track as Mp4VideoTrack;
    let seg = this.gopCache.get(meta.index);
    if (!seg) {
      const fetchImpl = this.gopFetchImpl ?? this.gopDefaultFetch();
      const res = await fetchSingleGopRange(
        this.url,
        meta.rangeStart,
        meta.rangeEnd,
        this.knownFileSize,
        fetchImpl,
        this.gopI18nLookup,
      );
      if (!res.ok) throw new Error(`gopSampleData: fetch bù GOP ${meta.index} hỏng: ${res.reason}`);
      seg = buildGopSegment(track, meta, res.bytes);
      // Put best-effort: GOP vượt trần thì vẫn decode được lần này
      // qua segment trả về, chỉ không giữ lại cho lần sau.
      this.gopCache.put(seg);
    }
    const chunk = seg.chunks[s.index - seg.firstSampleIndex];
    if (!chunk) throw new Error(`gopSampleData: thiếu chunk sample ${s.index} trong GOP ${meta.index}`);
    return chunk.data;
  }

  /**
   * Đợt 40 V2 — decode cửa sổ present từ đường GOP (thay cho nhánh
   * bytes của load() cũ). Chỉ chạy khi track đã từ T3 và gopActive.
   * Quy tắc không chunk nửa vời: mọi GOP giao cửa sổ decode phải có
   * mặt trong cache/windowSegments TRƯỚC khi decodeGop chạy; fetch
   * bù hỏng → trả false ngay, chưa decode frame nào của cửa sổ đó.
   * Đo wall + auto-apply cổng + prefetch + evict mirror nhánh cũ
   * (cùng thứ tự: đo → aheadRange trước evict → evict → prefetch),
   * chỉ khác nguồn bytes (GOP cache thay cho buffer file).
   */
  private async ensureWindowViaGop(
    timeSec: number,
    transientGops: GopSegment[] | null,
  ): Promise<boolean> {
    const track = this.track as Mp4VideoTrack;
    const bytesPerFrame = estimatedBytesPerFrame(track.width, track.height);
    // Cửa sổ hiệu dụng: trừ byte GOP cache đang giữ (không phải byte
    // file, vì đường này không giữ buffer file) khỏi ngân sách tổng.
    const effectiveWindow = Math.min(
      this.windowFrames,
      windowFramesForTotalBudget(
        bytesPerFrame,
        this.gopCache.bytes,
        this.totalBudgetBytes,
      ),
    );
    const order = presentOrderFor(track.samples);
    const targetIdx = sampleIndexForPresentationTime(track, timeSec);
    const targetPos = order.indexOf(targetIdx);
    const presentFrom = Math.max(0, targetPos - effectiveWindow + 1);
    const windowDecodeIdx = order
      .slice(presentFrom, targetPos + 1)
      .sort((a, b) => a - b);
    if (windowDecodeIdx.length === 0) return false;
    let decodeFrom = windowDecodeIdx[0];
    for (let i = decodeFrom; i >= 0; i--) {
      if (track.samples[i].isKey) {
        decodeFrom = i;
        break;
      }
    }
    const decodeTo = windowDecodeIdx[windowDecodeIdx.length - 1];
    const key = `${decodeFrom}-${decodeTo}`;
    if (key === this.lastWindowKey && this.cache.size > 0) {
      return true;
    }
    // Pre-resolve mọi GOP giao cửa sổ: cache → transient lần tải T3
    // → fetch bù 1 GOP. Hỏng ở đây thì chưa decode gì cả.
    const windowSegments = new Map<number, GopSegment>();
    const transientByIndex = new Map<number, GopSegment>();
    if (transientGops) {
      for (const g of transientGops) transientByIndex.set(g.index, g);
    }
    for (const gi of gopsForDecodeRange(this.gopMeta, decodeFrom, decodeTo)) {
      let seg = this.gopCache.get(gi);
      if (!seg) seg = transientByIndex.get(gi);
      if (!seg) {
        const meta = this.gopMeta.find((g) => g.index === gi);
        if (!meta) return false;
        const fetchImpl = this.gopFetchImpl ?? this.gopDefaultFetch();
        const res = await fetchSingleGopRange(
          this.url,
          meta.rangeStart,
          meta.rangeEnd,
          this.knownFileSize,
          fetchImpl,
          this.gopI18nLookup,
        );
        if (!res.ok) return false;
        seg = buildGopSegment(track, meta, res.bytes);
      }
      // Put best-effort (GOP vượt trần vẫn decode được lần này qua
      // windowSegments, chỉ không giữ lại).
      this.gopCache.put(seg);
      windowSegments.set(gi, seg);
    }
    const getData = (s: Mp4Sample): Uint8Array => {
      const meta = this.gopMeta.find(
        (g) => s.index >= g.firstSampleIndex && s.index <= g.lastSampleIndex,
      );
      const seg = meta ? windowSegments.get(meta.index) : undefined;
      const chunk = seg ? seg.chunks[s.index - seg.firstSampleIndex] : undefined;
      if (!chunk) {
        // Không bao giờ xảy ra sau pre-resolve (mọi GOP giao cửa sổ
        // đã có mặt); throw để decodeGop nuốt thành lỗi decode mềm
        // thay vì trả bytes sai — không chunk nửa vời, không sai dữ liệu.
        throw new Error(`ensureWindowViaGop: thiếu chunk sample ${s.index}`);
      }
      return chunk.data;
    };
    let decoded = 0;
    let decodeMs = 0;
    try {
      const decodeStart =
        typeof performance !== "undefined"
          ? performance.now()
          : Date.now();
      decoded = await this.cache.decodeGop(
        track,
        track.samples,
        decodeFrom,
        decodeTo,
        getData,
        false,
      );
      decodeMs =
        (typeof performance !== "undefined"
          ? performance.now()
          : Date.now()) - decodeStart;
      if (decoded <= 0) {
        this.unsupported = true;
        return false;
      }
    } catch {
      this.unsupported = true;
      return false;
    }
    if (this.disposed) return false;
    if (decoded > 0 && decodeMs > 0) {
      const measurement: SoftwareDecodeMeasurement = {
        decodeFps: decoded / (decodeMs / 1000),
        loadLabel: "under-load",
        resolution: `${track.width}x${track.height}`,
      };
      this.lastDecodeMeasurement = measurement;
      if (shouldAutoApplyDecodeAhead(decodeAheadWanted, this.decodeAheadEnabled)) {
        this.enableDecodeAheadFromGate(
          decodeAheadGateInputForToggle(true, measurement),
        );
      }
    }
    let aheadRange: { from: number; to: number } | null = null;
    if (this.decodeAheadEnabled) {
      const prev = precedingDecodeRange(
        order,
        presentFrom,
        effectiveWindow,
        track.samples,
      );
      if (prev && prev.from < decodeFrom) aheadRange = prev;
    }
    const keep = new Set<number>();
    for (let i = decodeFrom; i <= decodeTo; i++) keep.add(i);
    if (aheadRange) {
      for (let i = aheadRange.from; i <= aheadRange.to; i++) keep.add(i);
    }
    this.cache.evictExcept(keep);
    this.lastWindowKey = key;
    this.lastDecodeRange = { from: decodeFrom, to: decodeTo };
    if (aheadRange && !this.disposed) {
      this.aheadRange = aheadRange;
      if (!this.decodeAhead) this.decodeAhead = new ReverseDecodeAhead(this.cache);
      const p = this.decodeAhead.prefetchWindow(
        track,
        track.samples,
        aheadRange.from,
        aheadRange.to,
        (s: Mp4Sample) => this.gopSampleData(s),
        false,
      );
      if (p) {
        p.then(() => {
          this.dropSettledPrefetchIfOff();
        }).catch(() => {});
      }
    }
    return true;
  }

  /**
   * Decode cửa sổ present chứa mốc timeSec (không chờ caller).
   * Cửa sổ present = windowFrames sample theo thứ tự present, decode
   * từ đầu GOP chứa sample decode-nhỏ nhất trong cửa sổ đó tới sample
   * decode-lớn nhất. Gọi nối tiếp: cửa sổ đang decode thì không kích
   * thêm; cửa sổ khác thì xếp sau (tránh 2 decoder tranh nhau).
   */
  ensureWindowForTime(timeSec: number): Promise<boolean> {
    if (this.decodePromise) return this.decodePromise.then(() => true);
    const run = async (): Promise<boolean> => {
      // Đường nhanh không fetch: frame đích đã nằm trong cache (cửa sổ
      // cũ vẫn ấm) thì không cần tải lại file dù buffer đã nhả.
      if (this.track) {
        const cachedIdx = sampleIndexForPresentationTime(this.track, timeSec);
        if (cachedIdx >= 0 && this.cache.get(cachedIdx)) return true;
      }
      // Đợt 40 V2 — thử đường GOP Range TRƯỚC khi tải toàn file, chỉ
      // 1 lần cho 1 controller. Thành công thì decode bằng GOP branch
      // bên dưới (không qua load()); thất bại (gate từ chối, moov
      // cuối, 200 phớt Range, lỗi mạng — T3 đã trả full-file, không
      // throw) thì rơi về load() cũ nguyên vẹn, không thử GOP lại.
      // Size chưa biết lúc này thì wiring trả off (không thử muộn).
      let transientGops: GopSegment[] | null = null;
      // Đợt 42 X4 — probe vừa chạy trong lượt này (nếu có) được truyền
      // sang T3 để khỏi HEAD lần nữa; chỉ tồn tại trong lượt này, không
      // lưu thành trạng thái controller (tránh dùng lại probe cũ cho
      // một lần T3 khác sau khi URL/track đã đổi).
      let sharedSizeProbe: { size: number; acceptRanges: string | null } | undefined;
      if (!this.track && !this.gopAttempted) {
        // Đợt 41 W4 — proxy chưa biết size: probe HEAD / Content-Range
        // TRƯỚC khi quyết wiring, chỉ khi caller đã bật GOP (tránh
        // thêm request cho controller không dùng GOP). Probe thành
        // công thì size đó được ghi nhận như size đã biết từ đầu
        // (applyKnownFileSize; vượt trần S4 thì khóa fallback như
        // khi size truyền trước — probe không bypass cổng nào).
        // Probe hỏng thì ghi lý do, KHÔNG đánh dấu gopAttempted, và
        // đi tiếp đường full-file cũ bên dưới; lần cửa sổ sau (nếu
        // load cũ hỏng mà track vẫn chưa có) sẽ probe lại.
        if (this.gopEnabled && this.knownFileSize === null) {
          try {
            const probeFetch = this.gopFetchImpl ?? this.gopDefaultFetch();
            const probe = await discoverSizeBytes(this.url, probeFetch, this.gopI18nLookup);
            this.gopSizeProbeSourceValue = probe.source;
            this.gopSizeProbeSizeValue = probe.size;
            this.gopSizeProbeReasonValue =
              probe.source === "unknown" ? probe.reason : null;
            if (probe.size !== null) {
              this.applyKnownFileSize(probe.size);
              // Đợt 42 X4 — chia sẻ kết quả probe vào T3 ngay lượt này:
              // T3 bỏ HEAD của nó (chỉ khi size khớp, xem T3), còn lại
              // 1 HEAD duy nhất là của probe.
              sharedSizeProbe = { size: probe.size, acceptRanges: probe.acceptRanges };
            }
          } catch {
            // discoverSizeBytes cam kết không throw vì lỗi mạng/server;
            // đai an toàn thứ hai: lỗi bất ngờ cũng chỉ rơi về
            // full-file cũ, không bao giờ ném ra draw.
            this.gopSizeProbeSourceValue = "unknown";
            this.gopSizeProbeSizeValue = null;
            this.gopSizeProbeReasonValue = trKey(
              this.gopI18nLookup,
              "gop.controller.sizeProbeUnexpectedException",
              {},
              "gop-size-probe-unexpected-exception: rơi về full-file",
            );
          }
        }
        const wiring = resolveGopRangeWiring({
          enabled: this.gopEnabled,
          knownSizeBytes: this.knownFileSize,
          thresholdBytes: this.gopThresholdBytes,
          largeFileBytes: this.largeFileBytes,
          lookup: this.gopI18nLookup,
        });
        if (wiring.useGop) {
          this.gopAttempted = true;
          try {
            const outcome = await fetchVideoTrackByGopRange(this.url, {
              knownSizeBytes: this.knownFileSize,
              fetchImpl: this.gopFetchImpl,
              sharedSizeProbe,
              // Đợt 60 Q4 — lookup i18n: lý do fallback GOP đi qua key
              // gop.* trong dict (preview truyền t() lúc tạo controller).
              lookup: this.gopI18nLookup,
              // Đợt 50 F4 — streaming: T3 chỉ demux + trả meta mọi
              // GOP, KHÔNG fetch byte GOP nào lượt đầu; cửa sổ đầu
              // fetch đúng GOP nó cần qua pre-resolve trong
              // ensureWindowViaGop (fetchSingleGopRange + cache LRU),
              // các GOP khác fetch khi cửa sổ dịch tới. Nhờ vậy đỉnh
              // heap transient của lượt tải đầu không còn chunk mọi
              // GOP (~kích thước file) — nợ E2 §7.1.
              streamGops: true,
            });
            if (outcome.mode === "gop-range") {
              this.track = outcome.track;
              this.gopActive = true;
              this.gopMeta = outcome.gopMeta;
              // Đợt 65 S6 — giữ ghi chú timeout fail-open (nếu có) để UI
              // báo user lý do keyframe chưa kịp kiểm chứng.
              this.gopTrialDecodeNoteValue = outcome.trialDecodeNote ?? null;
              transientGops = outcome.gops;
            } else {
              this.gopActive = false;
              this.gopFallbackReasonValue = outcome.reason;
              this.gopTrialDecodeNoteValue = null;
            }
          } catch {
            // T3 cam kết không throw vì lỗi mạng/server/demux, nhưng
            // controller vẫn fail-soft: lỗi bất ngờ cũng chỉ rơi về
            // đường full-file, không bao giờ ném ra draw.
            this.gopActive = false;
            this.gopFallbackReasonValue = trKey(
              this.gopI18nLookup,
              "gop.controller.unexpectedException",
              {},
              "gop-unexpected-exception: rơi về full-file",
            );
          }
        } else {
          // Wiring off (tắt / dưới ngưỡng / vượt S4 / chưa biết size):
          // không đánh dấu attempted — cửa sổ này đi đường full-file
          // cũ, và khi track đã có thì GOP không còn được xét nữa.
          // (Không thử GOP muộn sau khi file đã tải: vô ích.)
        }
      }
      if (this.gopActive && this.track) {
        return this.ensureWindowViaGop(timeSec, transientGops);
      }
      if (!(await this.load())) return false;
      const track = this.track as Mp4VideoTrack;
      const bytes = this.bytes as Uint8Array;
      // Cửa sổ hiệu dụng: trừ byte file còn giữ khỏi ngân sách tổng
      // rồi mới chia cho byte/frame (đợt 35 R3 — ngân sách tính cả file).
      const bytesPerFrame = estimatedBytesPerFrame(track.width, track.height);
      const effectiveWindow = Math.min(
        this.windowFrames,
        windowFramesForTotalBudget(
          bytesPerFrame,
          bytes.length,
          this.totalBudgetBytes,
        ),
      );
      const order = presentOrderFor(track.samples);
      const targetIdx = sampleIndexForPresentationTime(track, timeSec);
      const targetPos = order.indexOf(targetIdx);
      const presentFrom = Math.max(0, targetPos - effectiveWindow + 1);
      const windowDecodeIdx = order
        .slice(presentFrom, targetPos + 1)
        .sort((a, b) => a - b);
      if (windowDecodeIdx.length === 0) {
        this.releaseFileBuffer();
        return false;
      }
      // GOP-align: decode từ keyframe <= sample decode-nhỏ nhất.
      let decodeFrom = windowDecodeIdx[0];
      for (let i = decodeFrom; i >= 0; i--) {
        if (track.samples[i].isKey) {
          decodeFrom = i;
          break;
        }
      }
      const decodeTo = windowDecodeIdx[windowDecodeIdx.length - 1];
      const key = `${decodeFrom}-${decodeTo}`;
      if (key === this.lastWindowKey && this.cache.size > 0) {
        // Cùng cửa sổ: không decode lại, nhưng vẫn nhả buffer vừa tải.
        this.releaseFileBuffer();
        return true;
      }
      const getData = (s: Mp4Sample): Uint8Array =>
        bytes.subarray(s.offset, s.offset + s.size);
      let decoded = 0;
      // Đợt 38 U1: đo wall của riêng lần decodeGop này (không tính fetch)
      // để làm số đo phần mềm cho cổng toggle. performance.now có sẵn
      // cả ở browser lẫn Node; fallback Date.now khi không có.
      let decodeMs = 0;
      try {
        // decodeGop await flush bên trong nên frame đã độc lập với
        // buffer file khi hàm này trả về — nhả ở finally là an toàn.
        // decodeGop nuốt lỗi từng chunk và trả số frame decode được:
        // 0 frame = cửa sổ vô dụng nên coi là lỗi decode (fallback),
        // còn decode một phần (> 0) thì giữ hành vi cũ — frame thiếu
        // rơi về đường element qua frameAt null / missing.
        const decodeStart =
          typeof performance !== "undefined"
            ? performance.now()
            : Date.now();
        decoded = await this.cache.decodeGop(
          track,
          track.samples,
          decodeFrom,
          decodeTo,
          getData,
          false,
        );
        decodeMs =
          (typeof performance !== "undefined"
            ? performance.now()
            : Date.now()) - decodeStart;
        if (decoded <= 0) {
          this.unsupported = true;
          return false;
        }
      } catch {
        // Fail-soft đúng bất biến đã ghi ở đầu file: lỗi decode khóa
        // controller về unsupported, caller rơi về đường element cũ,
        // không ném ra draw. Buffer vẫn nhả ở finally.
        this.unsupported = true;
        return false;
      } finally {
        this.releaseFileBuffer();
      }
      if (this.disposed) return false;
      // Đợt 38 U1: ghi số đo decode thật của cửa sổ vừa xong, rồi (chỉ
      // khi user đã bật toggle mà controller chưa bật) thử lại cổng
      // ngay bằng số đo mới này, TRƯỚC khối tính aheadRange bên dưới —
      // nên cửa sổ vừa decode cũng prefetch được đoạn trước nó ngay,
      // không phải chờ thêm một cửa sổ nữa. Nếu cổng vẫn chặn thì giữ
      // tắt + decision chặn để UI hiện đúng lý do; cửa sổ sau sẽ thử
      // lại với số đo mới của chính nó (điều kiện tải thay đổi thì
      // verdict có thể đổi — không khóa cứng lần chặn đầu).
      if (decoded > 0 && decodeMs > 0) {
        const measurement: SoftwareDecodeMeasurement = {
          decodeFps: decoded / (decodeMs / 1000),
          loadLabel: "under-load",
          resolution: `${track.width}x${track.height}`,
        };
        this.lastDecodeMeasurement = measurement;
        // Đợt 39 T4: giữ luật T2 — chỉ tự thử lại cổng khi wanted mà
        // controller CHƯA bật (shouldAutoApplyDecodeAhead). Controller
        // ĐANG bật thì số đo cửa sổ mới không re-gate (xem quyết định
        // re-gate trong reverseDecodeAheadToggle.ts): cửa sổ sau đo
        // chậm hơn không tự tắt decode-ahead đang chạy.
        if (shouldAutoApplyDecodeAhead(decodeAheadWanted, this.decodeAheadEnabled)) {
          this.enableDecodeAheadFromGate(
            decodeAheadGateInputForToggle(true, measurement),
          );
        }
      }
      // Đợt 37 T2: tính đoạn prefetch TRƯỚC evict để đưa vào keep —
      // nếu tính sau evict thì frame prefetch của lần trước đã bị xóa
      // (bài học probe T2 lượt 1: held/keep thiếu làm mất cả GOP kế).
      // Chỉ prefetch khi đoạn mở rộng về phía trước cửa sổ hiện tại.
      let aheadRange: { from: number; to: number } | null = null;
      if (this.decodeAheadEnabled) {
        const prev = precedingDecodeRange(
          order,
          presentFrom,
          effectiveWindow,
          track.samples,
        );
        if (prev && prev.from < decodeFrom) aheadRange = prev;
      }
      const keep = new Set<number>();
      for (let i = decodeFrom; i <= decodeTo; i++) keep.add(i);
      if (aheadRange) {
        for (let i = aheadRange.from; i <= aheadRange.to; i++) keep.add(i);
      }
      this.cache.evictExcept(keep);
      this.lastWindowKey = key;
      this.lastDecodeRange = { from: decodeFrom, to: decodeTo };
      if (aheadRange && !this.disposed) {
        // Prefetch nền, không chặn caller: buffer file đã nhả ở finally
        // nhưng closure getData vẫn giữ Uint8Array đó cho tới khi
        // prefetch xong (giữ tạm có giới hạn = đúng 1 file đang decode,
        // cùng bậc với lúc decode cửa sổ hiện tại — không phải giữ mới).
        this.aheadRange = aheadRange;
        if (!this.decodeAhead) this.decodeAhead = new ReverseDecodeAhead(this.cache);
        const p = this.decodeAhead.prefetchWindow(
          track,
          track.samples,
          aheadRange.from,
          aheadRange.to,
          getData,
          false,
        );
        // Đợt 39 T4: khi prefetch settle, nếu user đã tắt giữa chừng
        // thì dọn đoạn đó khỏi cache (dropSettledPrefetchIfOff) thay
        // vì để frame nằm lại tới lần decode cửa sổ sau.
        if (p) {
          p.then(() => {
            this.dropSettledPrefetchIfOff();
          }).catch(() => {});
        }
      }
      return true;
    };
    const pending = run().finally(() => {
      this.decodePromise = null;
    });
    this.decodePromise = pending;
    return pending;
  }

  /**
   * Đồng bộ: frame đúng mốc timeSec nếu đã nằm trong cache, ngược
   * lại kích decode nền và trả null. KHÔNG BAO GIỜ trả frame của mốc
   * khác (tra đúng decode-index từ presentation time).
   */
  frameAt(timeSec: number): {
    frame: VideoFrame;
    width: number;
    height: number;
  } | null {
    if (this.disposed || this.unsupported) return null;
    if (!this.track) {
      void this.ensureWindowForTime(timeSec);
      return null;
    }
    const idx = sampleIndexForPresentationTime(this.track, timeSec);
    const frame = idx >= 0 ? this.cache.get(idx) : undefined;
    if (frame) {
      return { frame, width: this.track.width, height: this.track.height };
    }
    void this.ensureWindowForTime(timeSec);
    return null;
  }

  /**
   * Trình tự present ngược của cửa sổ decode hiện tại (cho probe đo
   * fps): vẽ mọi frame đang giữ trong cache theo present giảm dần.
   * missing = số sample trong đoạn decode [from, to] chưa có frame
   * (decode lỗi / chưa decode xong), không hardcode 0.
   */
  presentCachedReverse(
    draw: ReverseDrawFn,
  ): { drawn: number; missing: number } {
    if (!this.track || !this.lastDecodeRange) {
      return { drawn: 0, missing: 0 };
    }
    const order = presentOrderFor(this.track.samples);
    if (order.length === 0) return { drawn: 0, missing: 0 };
    // Cửa sổ = các sample đã decode, duyệt theo present giảm dần.
    const decoded = order.filter((idx) => this.cache.has(idx));
    let drawn = 0;
    for (let p = decoded.length - 1; p >= 0; p--) {
      const idx = decoded[p];
      const frame = this.cache.get(idx) as VideoFrame;
      draw(frame, idx);
      drawn++;
    }
    const rangeSize =
      this.lastDecodeRange.to - this.lastDecodeRange.from + 1;
    return { drawn, missing: Math.max(0, rangeSize - drawn) };
  }

  dispose(): void {
    this.disposed = true;
    // Đợt 37 T5: huỷ fetch đang bay để không còn tải mồ côi sau
    // khi preview đã bỏ controller (cùng cơ chế với size tới muộn).
    this.abortInFlightLoad();
    this.cache.closeAll();
    this.track = null;
    this.releaseFileBuffer();
    // Đợt 40 V2: dọn đường GOP (cache chunk + meta + lý do fallback)
    // để controller dispose không giữ byte GOP sau khi bỏ.
    this.gopCache.clear();
    this.gopActive = false;
    this.gopMeta = [];
    this.gopFallbackReasonValue = null;
    // Đợt 65 S6 — dọn cả ghi chú trial-decode timeout cùng đường GOP.
    this.gopTrialDecodeNoteValue = null;
    // Đợt 41 W4: dọn cả trạng thái probe size.
    this.gopSizeProbeSourceValue = null;
    this.gopSizeProbeSizeValue = null;
    this.gopSizeProbeReasonValue = null;
    this.largeFile = false;
    this.knownFileSize = null;
    this.lastDecodeRange = null;
    this.lastWindowKey = null;
    // Đợt 37 T2: tắt decode-ahead + xóa warnings để controller tái dùng
    // không mang trạng thái thử nghiệm cũ.
    this.decodeAheadEnabled = false;
    this.decodeAheadWarnings = [];
    this.decodeAhead = null;
    this.aheadRange = null;
    // Đợt 38 U1: số đo của controller đã dispose không còn dùng cho
    // cổng nữa (controller mới phải đo lại trên footage của nó).
    this.lastDecodeMeasurement = null;
    // Đợt 39 T4: decision riêng cũng xóa để status không hiện lý do
    // của controller đã dispose như thể còn hiệu lực.
    this.lastGateDecision = null;
    this.settledPrefetchDropped = 0;
    this.mirrorDecodeAheadWarnings();
  }
}

/** Registry controller theo source URL (preview dùng, 1 URL = 1 cái). */
const previewControllers = new Map<string, ReversePreviewController>();

export function getReversePreviewController(
  url: string,
  knownFileSizeBytes?: number,
  options?: {
    gopRangeEnabled?: boolean;
    // Đợt 60 Q4 — lookup i18n cho lý do fallback GOP (preview truyền t()).
    i18nLookup?: (key: string, vars?: Record<string, string>) => string;
  },
): ReversePreviewController {
  let c = previewControllers.get(url);
  if (!c) {
    c = new ReversePreviewController(url, undefined, {
      knownFileSizeBytes,
      // Đợt 40 V2: cờ GOP chỉ có tác dụng lúc tạo controller (registry
      // 1 URL = 1 controller); preview luôn truyền nên đường production
      // thỏa điều kiện này. Controller đã tạo trước mà không có cờ thì
      // giữ nguyên (không bật lén giữa chừng).
      gopRangeEnabled: options?.gopRangeEnabled ?? false,
      i18nLookup: options?.i18nLookup,
    });
    previewControllers.set(url, c);
  } else if (knownFileSizeBytes !== undefined) {
    // Controller đã tồn tại nhưng chưa biết size (vd: tạo trước khi
    // caller có File): ghi nhận nếu còn kịp trước lần fetch đầu tiên.
    // Đã biết size rồi thì giữ nguyên (first-wins, xem
    // applyKnownFileSize) — không ghi đè size đúng bằng size lạ.
    c.applyKnownFileSize(knownFileSizeBytes);
  }
  return c;
}

/**
 * Đợt 37 T2 — warnings decode-ahead đang bật trên mọi controller trong
 * registry (preview.tsx badge đọc hàm này mỗi tick; thường chỉ 1
 * controller bật tại 1 thời điểm). Trả về đúng chuỗi trong module cổng,
 * không tự bịa thêm chuỗi — UI hiển thị nguyên văn.
 */
export function reverseDecodeAheadWarnings(): string[] {
  const out: string[] = [];
  for (const c of previewControllers.values()) {
    for (const w of c.decodeAheadWarningList) {
      if (!out.includes(w)) out.push(w);
    }
  }
  return out;
}

/**
 * Đợt 65 S6 — ghi chú trial-decode timeout (fail-open) đang bật trên mọi
 * controller trong registry (preview.tsx đọc mỗi tick, mẫu
 * `reverseDecodeAheadWarnings` đợt 37 T2): mỗi controller tối đa 1 ghi
 * chú, khử trùng giữa các controller. Trả về đúng chuỗi T3 đã localize,
 * không tự bịa thêm chuỗi — UI hiển thị nguyên văn (toast keyed).
 */
export function reverseTrialDecodeTimeoutNotes(): string[] {
  const out: string[] = [];
  for (const c of previewControllers.values()) {
    const n = c.gopTrialDecodeNote;
    if (n !== null && !out.includes(n)) out.push(n);
  }
  return out;
}

// Đợt 38 U1 — cờ "muốn bật" của toggle UI (mức registry, sống qua
// dispose/tạo lại controller để toggle bật trước khi có footage vẫn có
// tác dụng ở cửa sổ decode đầu tiên đo được). Mặc định false — KHÔNG
// đổi mặc định TẮT của T2. wanted=true một mình KHÔNG bật prefetch:
// mọi lần bật đều qua enableDecodeAheadFromGate (cổng S3).
let decodeAheadWanted = false;
/** Decision cổng gần nhất (null = chưa từng thử cổng trong phiên). */
let decodeAheadLastDecision: DecodeAheadDecision | null = null;

/** Cờ "muốn bật" hiện tại của toggle (không phải trạng thái prefetch). */
export function getReverseDecodeAheadWanted(): boolean {
  return decodeAheadWanted;
}

export interface ReverseDecodeAheadStatus {
  /** User đã bật toggle chưa (cờ wanted). */
  wanted: boolean;
  /** Có controller nào đang prefetch thật không. */
  active: boolean;
  /** Trạng thái UI gộp: off | blocked | running. */
  uiStatus: DecodeAheadUiStatus;
  /** Tổng số frame prefetch đang giữ trên mọi controller. */
  prefetchFrames: number;
  /** Cảnh báo cổng đang bật (nguyên văn chuỗi cổng, rỗng khi tắt). */
  warnings: string[];
  /** Lý do chặn của decision gần nhất (rỗng khi chưa thử / đang chạy). */
  reasons: string[];
  /** Decision cổng gần nhất (null = chưa từng thử). */
  decision: DecodeAheadDecision | null;
  /** Số đo decode thật gần nhất còn sống (null = chưa đo). */
  measurementFps: number | null;
  /** Độ phân giải của số đo gần nhất (null = chưa đo). */
  measurementResolution: string | null;
  /**
   * Đợt 39 T4 — trạng thái từng controller (theo thứ tự registry) để
   * badge/title không phải hiện 1 lý do gộp đại diện cho mọi clip.
   * Controller chưa từng thử cổng có reasons rỗng (UI hiện lý do
   * unknown cho dòng đó, không bịa lý do).
   */
  controllers: DecodeAheadPerControllerStatus[];
  /** Tổng số cửa sổ prefetch đang bay trên mọi controller. */
  inFlightPrefetchWindows: number;
  /** Tổng số frame prefetch đã bị dọn sau khi tắt (cộng dồn). */
  settledPrefetchDroppedFrames: number;
  /**
   * Đợt 41 W1 — true khi có controller nào đang decode cửa sổ bay
   * (decodePromise != null); tổng số VideoFrame thật trong cache mọi
   * controller. Chỉ phục vụ harness, UI không dùng hai trường này.
   */
  decodeWindowInFlight: boolean;
  cacheFrames: number;
}

function mirrorDecodeAheadStatus(status: ReverseDecodeAheadStatus): void {
  try {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__vcutReverseDecodeAheadStatus =
        { ...status };
    }
  } catch {
    /* đo thống kê không được làm hỏng draw */
  }
}

/** Trạng thái gộp decode-ahead cho UI toggle + badge (đọc mỗi tick). */
export function reverseDecodeAheadStatus(): ReverseDecodeAheadStatus {
  let active = false;
  let prefetchFrames = 0;
  let measurementFps: number | null = null;
  let measurementResolution: string | null = null;
  let inFlightPrefetchWindows = 0;
  let settledPrefetchDroppedFrames = 0;
  let decodeWindowInFlight = false;
  let cacheFrames = 0;
  const controllers: DecodeAheadPerControllerStatus[] = [];
  let idx = 0;
  for (const [url, c] of previewControllers) {
    if (c.decodeAheadActive) active = true;
    prefetchFrames += prefetchFrameCount(c.aheadDecodeRange);
    const m = c.lastSoftwareDecodeMeasurement;
    if (m) {
      measurementFps = m.decodeFps;
      measurementResolution = m.resolution;
    }
    inFlightPrefetchWindows += c.inFlightPrefetchCount;
    settledPrefetchDroppedFrames += c.settledPrefetchDroppedCount;
    if (c.decodeWindowInFlight) decodeWindowInFlight = true;
    cacheFrames += c.cacheFrameCount;
    // Đợt 39 T4: mỗi controller mang decision RIÊNG của nó (không
    // dùng chung decision toàn cục) để badge nhiều clip hiện đúng
    // lý do từng clip; controller chưa thử cổng có reasons rỗng.
    const d = c.lastGateDecisionForController;
    controllers.push({
      label: controllerLabel(url, idx),
      active: c.decodeAheadActive,
      prefetchFrames: prefetchFrameCount(c.aheadDecodeRange),
      measurementFps: m ? m.decodeFps : null,
      measurementResolution: m ? m.resolution : null,
      reasons: d ? [...d.reasons] : [],
    });
    idx++;
  }
  // Đợt 39 T4: reasons gộp (cho toast chặn) nay là HỢP lý do của mọi
  // controller đã thử cổng (giữ thứ tự registry, không trùng) thay vì
  // decision toàn cục "controller decode sau cùng thắng" — đó chính là
  // chỗ badge U1 có thể hiện nhầm lý do khi nhiều controller. Khi
  // không có controller nào có decision thì rơi về decision toàn cục
  // (đường toggle bật khi chưa có controller, U1) để không mất lý do
  // "chưa đo". Khi đang chạy thì reasons rỗng như cũ (toast không bắn
  // trong lúc chạy; lý do clip bị chặn còn lại đọc ở controllers).
  let reasons: string[] = [];
  if (!active) {
    const seen = new Set<string>();
    for (const e of controllers) {
      for (const r of e.reasons) {
        if (!seen.has(r)) {
          seen.add(r);
          reasons.push(r);
        }
      }
    }
    if (reasons.length === 0 && decodeAheadLastDecision) {
      reasons = [...decodeAheadLastDecision.reasons];
    }
  }
  const status: ReverseDecodeAheadStatus = {
    wanted: decodeAheadWanted,
    active,
    uiStatus: resolveDecodeAheadUiStatus(decodeAheadWanted, active),
    prefetchFrames,
    warnings: reverseDecodeAheadWarnings(),
    reasons,
    decision: decodeAheadLastDecision
      ? { ...decodeAheadLastDecision, reasons: [...decodeAheadLastDecision.reasons], warnings: [...decodeAheadLastDecision.warnings] }
      : null,
    measurementFps,
    measurementResolution,
    controllers,
    inFlightPrefetchWindows,
    settledPrefetchDroppedFrames,
    decodeWindowInFlight,
    cacheFrames,
  };
  mirrorDecodeAheadStatus(status);
  return status;
}

/**
 * Đợt 38 U1 — đặt cờ wanted của toggle, áp dụng qua cổng ngay trên mọi
 * controller đã có (không bypass cổng, không đổi mặc định):
 * - wanted=false: tắt mọi controller ngay (không prefetch mới), xóa
 *   decision gần nhất để UI không còn báo lý do chặn cũ.
 * - wanted=true: mỗi controller thử cổng với đúng số đo của nó (null =
 *   chưa đo → cổng chặn với hardware/software-not-measured). Không có
 *   controller nào thì tính thẳng decision "chưa đo" để UI hiện bị chặn
 *   đúng lý do thay vì im lặng; wanted vẫn giữ để cửa sổ decode đầu
 *   tiên sau đó tự thử lại cổng (xem ensureWindowForTime).
 * Trả về decision gộp (null khi vừa tắt).
 */
export function setReverseDecodeAheadWanted(
  wanted: boolean,
): DecodeAheadDecision | null {
  decodeAheadWanted = wanted;
  if (!wanted) {
    for (const c of previewControllers.values()) c.disableDecodeAhead();
    decodeAheadLastDecision = null;
    return null;
  }
  const decisions: DecodeAheadDecision[] = [];
  for (const c of previewControllers.values()) {
    decisions.push(
      c.enableDecodeAheadFromGate(
        decodeAheadGateInputForToggle(true, c.lastSoftwareDecodeMeasurement),
      ),
    );
  }
  if (decisions.length === 0) {
    const d = resolveDecodeAheadGate(
      decodeAheadGateInputForToggle(true, null),
    );
    decodeAheadLastDecision = d;
    return d;
  }
  const agg = aggregateDecodeAheadDecisions(decisions);
  decodeAheadLastDecision = agg;
  return agg;
}

export function disposeReverseWebcodecsControllers(): void {
  for (const c of previewControllers.values()) c.dispose();
  previewControllers.clear();
}

/** Thống kê nối preview (mirror lên window cho harness đọc). */
export const reverseWebcodecsDrawStats = { hits: 0, misses: 0 };

/**
 * Đợt 39 T4 — số lần controller WebCodecs thật sự phát fetch (HEAD +
 * GET) để tải file. Cổng S4 khóa từ constructor (known size vượt
 * ngưỡng) thì load() trả false trước cả HEAD nên counter này đứng yên
 * — click-test proxy lớn khẳng định "0 request từ controller" bằng
 * delta của counter này (KHÔNG đếm request của <video> element ở đường
 * fallback, đường đó vẫn tải file bình thường và không thuộc cổng).
 */
export const reverseControllerFetchStats = { fetches: 0 };

function mirrorDrawStats(): void {
  try {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__vcutReverseWc = {
        ...reverseWebcodecsDrawStats,
        // Đợt 39 T4: thêm 2 trường để click-test proxy lớn đọc được
        // mà không cần gọi store nội bộ: controllerFetches = số fetch
        // controller đã phát (delta = 0 khi bị khóa S4); largeFileLocked
        // = có controller nào đang bị khóa fallback file lớn không.
        controllerFetches: reverseControllerFetchStats.fetches,
        largeFileLocked: [...previewControllers.values()].some(
          (c) => c.largeFileFallback,
        ),
        // Đợt 47 C5: trạng thái GOP để click-test app thật đọc được
        // mà không cần gọi store nội bộ: gopActive = có controller
        // nào đang chạy đường gop-range không; gopFallbackReasons =
        // lý do T3 trả full-file của từng controller đã thử GOP
        // (rỗng khi chưa thử / đang chạy GOP). Mirror chạy mỗi lần
        // frameAt nên harness poll sau khi stepping sẽ thấy đúng.
        gopActive: [...previewControllers.values()].some(
          (c) => c.gopMode === "gop-range",
        ),
        gopFallbackReasons: [...previewControllers.values()]
          .map((c) => c.gopFallbackReason)
          .filter((r): r is string => r !== null),
        // Đợt 51 H4 — thống kê cache GOP gộp của mọi controller (để
        // harness headed đọc settled/evicted mà không cần DOM video:
        // video element có thể đã bị gỡ khi dừng phát ngược nên DIAG
        // qua getReversePreviewController(src) khi đó trả [] — gặp
        // thật ở lượt cap32a). Chỉ cộng dồn số đo, không đổi hành vi.
        gopCache: [...previewControllers.values()].reduce(
          (acc, c) => {
            const s = c.gopCacheStats;
            acc.segments += s.segments;
            acc.bytes += s.bytes;
            acc.hits += s.hits;
            acc.misses += s.misses;
            acc.evictedBytes += s.evictedBytes;
            return acc;
          },
          { segments: 0, bytes: 0, hits: 0, misses: 0, evictedBytes: 0 },
        ),
      };
    }
  } catch {
    /* đo thống kê không được làm hỏng draw */
  }
}

/**
 * Điểm nối preview gọi trong drawVideoClip: trả frame cache đúng mốc
 * source time, hoặc null để rơi về đường element cũ. Chỉ đếm hit khi
 * frame thật đã trả; miss (chưa decode / unsupported) cũng đếm để
 * harness phân biệt "chưa ấm cache" với "đường mới không chạy".
 */
export function reverseWebcodecsFrameFor(
  url: string,
  sourceTimeSec: number,
  knownFileSizeBytes?: number,
  // Đợt 40 V2: preview bật đường GOP tường minh (mặc định tắt khi
  // gọi trực tiếp không có options — giữ nguyên hành vi test cũ).
  // Đợt 60 Q4: i18nLookup tùy chọn cho lý do fallback GOP (preview
  // truyền t(); test cũ không truyền → fallback VI cũ).
  options?: {
    gopRangeEnabled?: boolean;
    i18nLookup?: (key: string, vars?: Record<string, string>) => string;
  },
): { frame: VideoFrame; width: number; height: number } | null {
  const c = getReversePreviewController(url, knownFileSizeBytes, options);
  const hit = c.frameAt(sourceTimeSec);
  if (hit) reverseWebcodecsDrawStats.hits++;
  else reverseWebcodecsDrawStats.misses++;
  mirrorDrawStats();
  return hit;
}
