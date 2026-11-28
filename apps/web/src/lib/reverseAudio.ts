// reverseAudio.ts — Đợt 191 P3: phát audio NGƯỢC thật cho clip ngắn.
// Đợt 192 P3: ĐÃ NỐI vào preview qua reverseAudioWiring.ts (S7c,
// F-191-P4-3) — xem module đó để biết điểm nối + điều kiện. Module này
// vẫn chỉ chứa logic thuần + player tối giản, không tự nối vào preview.
//
// Giới hạn an toàn: chỉ clip ≤ 60 s mới decode + đảo TOÀN BỘ vào RAM;
// clip dài hơn (tới MAX_REVERSED_AUDIO_WINDOWED_SECONDS) phát đảo theo
// CỬA SỔ 30 s (loadReversedWindow — chỉ giữ 1 cửa sổ đảo + bytes nén
// gốc; đợt 198 P3 decode TỪNG PHẦN bằng WebCodecs AudioDecoder — chỉ
// decode các frame AAC phủ cửa sổ — nên không còn giữ buffer đã decode
// toàn file khi partial thành công; khi partial hỏng thì rơi về cache
// decode-once đợt 197 P3, ≤ 160 MB).
//
// Đợt 193 P3: (a) crossfade 80 ms giữa các đoạn 0,5 s — đợt 192 cắt đoạn
// cũ ở +20 ms nên 2/16 mẫu RMS=0 tại điểm nối; nay đoạn cũ mờ dần
// trong khi đoạn mới mờ vào, chồng nhau đúng nội dung nối tiếp.
// (b) clip > 60 s phát thật bằng cửa sổ (nợ S7c đợt 192).
//
// Thuần + test được bằng Node type-stripping (player nhận AudioContext
// qua interface tối thiểu nên test dùng fake, không cần browser thật).

import {
  decodeAudioWindowPartial,
  slicePartialPcmForWindow,
  slicePartialPcmFailureReason,
  type PartialDecodeDeps,
} from "./reverseAudioPartial.ts";
export const MAX_REVERSED_AUDIO_SECONDS = 60;

/** Clip dài hơn 60 s mà không quá ngưỡng này thì phát đảo theo cửa sổ. */
export const MAX_REVERSED_AUDIO_WINDOWED_SECONDS = 600;

/** Độ dài cửa sổ đảo cho clip dài (giây, theo thời gian nguồn). */
export const REVERSED_AUDIO_WINDOW_SEC = 30;

/** Thời gian fade vào/ra khi bắt/dừng đoạn đảo (giây) — chống click. */
export const REVERSED_AUDIO_FADE_SEC = 0.01;

/** Đợt 197 P3 — trần bộ nhớ cho cache buffer đã decode (byte PCM,
 * length × channels × 4): 300 s stereo 48 kHz ≈ 115 MB (longA/longB
 * vừa trần, được cache); 600 s stereo ≈ 230 MB thì KHÔNG cache (giữ
 * hành vi cũ: decode lại toàn file mỗi lần đổi cửa sổ). Cache chỉ giữ
 * 1 file / 1 player, nhả ở dispose() (xem loadReversedWindow). */
export const REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES = 160_000_000;

/** Crossfade giữa 2 đoạn đảo nối tiếp (giây) — đoạn cũ mờ dần trong
 * khi đoạn mới mờ vào, chồng nhau đúng nội dung nối tiếp nên không còn
 * khoảng lặng tại điểm nối (đợt 192: 2/16 mẫu RMS=0). Đoạn đầu tiên
 * (không có đoạn cũ) vẫn fade vào 10 ms như cũ. */
export const REVERSED_AUDIO_CROSSFADE_SEC = 0.08;

/** Đảo 1 kênh: mẫu cuối thành đầu. Không sửa input (trả mảng mới). */
export function reverseFloat32Channel(input: Float32Array): Float32Array {
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    out[i] = input[input.length - 1 - i];
  }
  return out;
}

/**
 * Vị trí mẫu trong buffer ĐÃ ĐẢO ứng với playhead timeline.
 * Clip [clipStartSec, clipStartSec + clipDurationSec]: tại playhead p,
 * source xuôi ở (p - start), nên trong buffer đảo nó nằm ở
 * (duration - (p - start)) * sampleRate. Clamp về [0, dur*sr].
 * Trả -1 khi playhead ngoài clip.
 */
export function reversedSampleOffset(args: {
  playheadSec: number;
  clipStartSec: number;
  clipDurationSec: number;
  sampleRate: number;
}): number {
  const { playheadSec, clipStartSec, clipDurationSec, sampleRate } = args;
  if (!(clipDurationSec > 0) || !(sampleRate > 0)) return -1;
  const local = playheadSec - clipStartSec;
  if (local < 0 || local >= clipDurationSec) return -1;
  const offset = Math.floor((clipDurationSec - local) * sampleRate);
  return Math.max(0, Math.min(Math.floor(clipDurationSec * sampleRate), offset));
}

/**
 * Cửa sổ mẫu trong buffer đảo để phát từ playhead lùi trong windowSec.
 * null khi playhead ngoài clip hoặc windowSec <= 0.
 */
export function reversedSegmentWindow(args: {
  playheadSec: number;
  clipStartSec: number;
  clipDurationSec: number;
  sampleRate: number;
  windowSec: number;
}): { startSample: number; lengthSamples: number } | null {
  const start = reversedSampleOffset(args);
  if (start < 0) return null;
  if (!(args.windowSec > 0)) return null;
  const total = Math.floor(args.clipDurationSec * args.sampleRate);
  // Phát ngược: từ offset đi LÙI về 0 (buffer đảo đã xếp theo chiều phát).
  // Trong buffer đảo, chiều phát là tăng dần: offset hiện tại + window.
  const length = Math.max(
    0,
    Math.min(Math.floor(args.windowSec * args.sampleRate), total - start),
  );
  if (length <= 0) return null;
  return { startSample: start, lengthSamples: length };
}

/**
 * Vị trí mẫu trong buffer ĐÃ ĐẢO ứng với source time (giây trong file
 * nguồn, không phải playhead timeline). Buffer đảo chứa toàn bộ file
 * nguồn đã đảo: source time s nằm ở (sourceDuration − s) * sampleRate.
 * Trả -1 khi ngoài file. Dùng cho wiring preview (reverseAudioWiring):
 * preview đã có source time tại playhead qua rampSourceTimeAt.
 */
export function reversedSampleOffsetFromSourceTime(args: {
  sourceTimeSec: number;
  sourceDurationSec: number;
  sampleRate: number;
}): number {
  const { sourceTimeSec, sourceDurationSec, sampleRate } = args;
  if (!(sourceDurationSec > 0) || !(sampleRate > 0)) return -1;
  if (!(sourceTimeSec >= 0) || sourceTimeSec > sourceDurationSec) return -1;
  const total = Math.floor(sourceDurationSec * sampleRate);
  const offset = Math.floor((sourceDurationSec - sourceTimeSec) * sampleRate);
  return Math.max(0, Math.min(total, offset));
}

/** Interface tối thiểu của AudioContext mà player cần (để test bằng fake). */
export interface ReversedAudioContextLike {
  readonly sampleRate: number;
  readonly currentTime: number;
  readonly state: string;
  decodeAudioData(data: ArrayBuffer): Promise<ReversedAudioBufferLike>;
  createBuffer(
    channels: number,
    length: number,
    sampleRate: number,
  ): ReversedAudioBufferLike;
  createBufferSource(): ReversedAudioSourceLike;
  createGain(): ReversedGainNodeLike;
  resume(): Promise<void>;
  readonly destination: unknown;
}

export interface ReversedAudioBufferLike {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  readonly duration: number;
  getChannelData(channel: number): Float32Array;
}

export interface ReversedAudioSourceLike {
  buffer: ReversedAudioBufferLike | null;
  /** Tốc độ phát (đợt 192 P3, tùy chọn — fake ctx có thể không có). */
  playbackRate?: { value: number };
  connect(node: unknown): void;
  disconnect(): void;
  start(when?: number, offset?: number, duration?: number): void;
  stop(when?: number): void;
}

export interface ReversedGainNodeLike {
  readonly gain: {
    value: number;
    setTargetAtTime(v: number, t: number, tc: number): void;
    linearRampToValueAtTime(v: number, t: number): void;
  };
  connect(node: unknown): void;
  disconnect(): void;
}

/**
 * Player audio đảo tối giản: load 1 lần (decode + đảo), phát từng đoạn
 * theo offset mẫu. Mọi lỗi (decode hỏng, clip quá dài, ctx chưa chạy)
 * trả false / no-op — không bao giờ throw ra caller, không phá preview.
 * Chưa nối vào preview (xem đầu file).
 */
export class ReverseAudioPlayer {
  private readonly ctx: ReversedAudioContextLike;
  private readonly destination: unknown;
  private reversed: ReversedAudioBufferLike | null = null;
  private source: ReversedAudioSourceLike | null = null;
  private gainNode: ReversedGainNodeLike | null = null;
  // Đợt 193 P3 — đoạn đang mờ dần sau crossfade (đoạn cũ của playSegment
  // trước): giữ tham chiếu để stop()/dispose() tắt nốt nếu bị gọi giữa
  // chừng; ngắt kết nối sau khi mờ xong (xem playSegment).
  private prevSource: ReversedAudioSourceLike | null = null;
  private prevGainNode: ReversedGainNodeLike | null = null;
  /** Độ dài đoạn playSegment vừa lên lịch (mẫu, đã clamp ở cuối buffer /
   * cuối cửa sổ) — wiring dùng để biết đoạn thật sự hết lúc nào. */
  private lastSegLength = 0;
  // Đợt 193 P3 — cửa sổ đảo cho clip dài: buffer `reversed` chỉ giữ 1
  // cửa sổ; windowBaseSample = offset đảo TUYỆT ĐỐI (trong buffer đảo
  // toàn file) của mẫu đầu cửa sổ; windowStartSec/windowEndSec = biên
  // cửa sổ theo thời gian nguồn XUÔI. Load toàn bộ thì cửa sổ = cả file
  // (windowBaseSample = 0, windowStartSec = 0, windowEndSec = duration)
  // nên playSegment dùng offset tuyệt đối như cũ, không đổi gì.
  private windowBaseSample = 0;
  private windowStartSecValue = 0;
  private windowEndSecValue = 0;
  private fullDurationSec = 0;
  // Đợt 197 P3 — cache buffer đã decode TOÀN FILE cho 1 lần load cửa sổ
  // (key = đúng object ArrayBuffer bytes nén mà wiring truyền vào —
  // wiring giữ 1 object `compressed` duy nhất / slot nên mọi lần đổi
  // cửa sổ của cùng 1 clip đều trúng cache; URL đổi → player mới nên
  // không lẫn clip). Chỉ cache khi PCM vừa trần
  // REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES (300 s stereo ≈ 101–115 MB
  // vừa; 600 s stereo ≈ 230 MB thì không cache). Nhả ở dispose().
  private decodedCache: {
    data: ArrayBuffer;
    decoded: ReversedAudioBufferLike;
  } | null = null;
  /** Lần loadReversedWindow gần nhất có lấy cửa sổ từ cache không
   * (không decode lại) — wiring đếm windowDecodeCached/windowDecodeFull. */
  private lastWindowUsedCache = false;
  // Đợt 198 P3 — decode TỪNG PHẦN (WebCodecs AudioDecoder, chỉ decode
  // các frame AAC phủ cửa sổ): lần load gần nhất có dùng partial không
  // (wiring đếm windowDecodePartial); partialFailedData = bytes nén đã
  // thử partial và hỏng (không thử lại mỗi lần đổi cửa sổ, rơi thẳng
  // về decode toàn file). Partial thành công thì KHÔNG giữ cache decode
  // toàn file — tiết kiệm ~101 MB RAM cho clip 300 s.
  private lastWindowDecodePartialValue = false;
  private partialFailedData: ArrayBuffer | null = null;
  /** Đợt 199 P3 — lý do lần loadReversedWindow gần nhất KHÔNG dùng
   * được partial (decode fail / slice null / duration quá max), để
   * wiring + probe headed đọc thay vì fallback câm như đợt 198 (partial
   * không engage mà không biết vì sao). null = lần load gần nhất dùng
   * partial thành công, lấy từ cache, hoặc chưa load lần nào. Đặt lại
   * null ở đầu mỗi lần load. */
  private lastPartialFailReasonValue: string | null = null;

  /** Lần loadReversedWindow gần nhất có dùng cache decode không. */
  get lastWindowDecodeCached(): boolean {
    return this.lastWindowUsedCache;
  }

  /** Đợt 198 P3 — lần loadReversedWindow gần nhất có decode từng phần không. */
  get lastWindowDecodePartial(): boolean {
    return this.lastWindowDecodePartialValue;
  }

  /** Đợt 199 P3 — sample rate của buffer đảo đang giữ (Hz). Đường
   * partial decode ở rate GỐC của file (48.000 Hz) trong khi
   * decodeAudioData resample về rate của AudioContext (44.100 Hz ở
   * headless) — wiring PHẢI tính offset mẫu theo rate này (xem
   * reverseAudioWiring.tickEntry), nếu không offset lệch hệ số
   * 48000/44100 ≈ 1,09× và drift vọt lên ~1,3 s (đo thật pass A-199).
   * 0 = chưa load. */
  get bufferSampleRate(): number {
    return this.reversed ? this.reversed.sampleRate : 0;
  }

  /** Đợt 199 P3 — lý do lần load gần nhất không dùng được partial (null = không có lỗi partial ở lần load này). */
  get lastPartialFailReason(): string | null {
    return this.lastPartialFailReasonValue;
  }

  /** Đợt 198 P3 — offset đảo TUYỆT ĐỐI của mẫu đầu cửa sổ hiện tại. */
  get windowBaseSampleAbs(): number {
    return this.windowBaseSample;
  }

  /** Đợt 198 P3 — độ dài cửa sổ đảo hiện tại (mẫu). */
  get windowLengthSamples(): number {
    return this.reversed ? this.reversed.length : 0;
  }

  /**
   * Đợt 198 P3 — clamp offset đảo tuyệt đối vào trong cửa sổ hiện tại
   * (fix F-197-P3-1: tick đầu sau khi cửa sổ đổi, source time ramp chạy
   * trước display ~0,1–0,3 s nên offset kỳ vọng vừa vượt mép cửa sổ mới;
   * clamp về mép thay vì playSegment trả false). Chưa load thì trả
   * nguyên offset (caller tự xử lý false như cũ).
   */
  clampSampleOffsetToWindow(startSample: number): number {
    if (!this.reversed) return startSample;
    const lo = this.windowBaseSample;
    const hi = this.windowBaseSample + this.reversed.length - 1;
    if (startSample < lo) return lo;
    if (startSample > hi) return hi;
    return startSample;
  }

  /**
   * Đợt 192 P3: destination tùy chọn — wiring preview truyền nút master
   * của AudioEngine để audio đảo đi qua volume tổng + VU meter (mặc
   * định: ctx.destination, giữ hành vi cũ cho mọi caller/test cũ).
   */
  constructor(ctx: ReversedAudioContextLike, destination?: unknown) {
    this.ctx = ctx;
    this.destination = destination ?? ctx.destination;
  }

  get loaded(): boolean {
    return this.reversed !== null;
  }

  /**
   * Đợt 193 P3 — thời lượng file NGUỒN (giây), kể cả khi chỉ giữ 1 cửa
   * sổ đảo: wiring tính offset đảo từ duration này (xem
   * reversedSampleOffsetFromSourceTime) nên phải là duration đầy đủ,
   * không phải độ dài cửa sổ.
   */
  get durationSec(): number {
    if (this.fullDurationSec > 0) return this.fullDurationSec;
    return this.reversed ? this.reversed.duration : 0;
  }

  /** Độ dài đoạn playSegment vừa lên lịch (mẫu, đã clamp ở cuối buffer /
   * cuối cửa sổ); 0 = chưa phát đoạn nào / lần phát cuối hỏng. */
  get lastSegmentLengthSamples(): number {
    return this.lastSegLength;
  }

  /** Biên dưới cửa sổ đảo theo thời gian nguồn xuôi (giây). */
  get windowStartSec(): number {
    return this.windowStartSecValue;
  }

  /** Biên trên cửa sổ đảo theo thời gian nguồn xuôi (giây). */
  get windowEndSec(): number {
    return this.windowEndSecValue;
  }

  /**
   * Decode + đảo toàn bộ audio. Trả false (không load) khi clip quá dài
   * hoặc decode lỗi — caller giữ mute như cũ.
   */
  async loadReversed(
    data: ArrayBuffer,
    maxSeconds: number = MAX_REVERSED_AUDIO_SECONDS,
  ): Promise<boolean> {
    try {
      const decoded = await this.ctx.decodeAudioData(data);
      if (!(decoded.duration > 0) || decoded.duration > maxSeconds) {
        return false;
      }
      const out = this.ctx.createBuffer(
        decoded.numberOfChannels,
        decoded.length,
        decoded.sampleRate,
      );
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        const src = decoded.getChannelData(ch);
        const rev = reverseFloat32Channel(src);
        out.getChannelData(ch).set(rev);
      }
      this.reversed = out;
      // Đợt 193 P3: load toàn bộ = cửa sổ phủ cả file.
      this.windowBaseSample = 0;
      this.windowStartSecValue = 0;
      this.windowEndSecValue = decoded.duration;
      this.fullDurationSec = decoded.duration;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Đợt 193 P3 — decode + đảo 1 CỬA SỔ cho clip dài (nợ S7c đợt 192).
   * Cửa sổ phủ thời gian nguồn xuôi [windowStartSec, windowStartSec +
   * windowSec] (clamp về [0, duration]); buffer đảo chỉ giữ cửa sổ đó,
   * nhưng `durationSec` vẫn trả duration đầy đủ và `playSegment` vẫn
   * nhận offset đảo TUYỆT ĐỐI (trong buffer đảo toàn file) nên wiring
   * không đổi cách tính offset — offset ngoài cửa sổ trả false để
   * wiring đợi đổi cửa sổ. `data` được slice trước khi decode vì
   * decodeAudioData DETACH buffer truyền vào — wiring giữ bytes nén gốc
   * để decode lại khi đổi cửa sổ.
   * Đợt 198 P3 — DECODE TỪNG PHẦN THẬT (N11b cửa sổ đầu): trước khi
   * decode toàn file, thử decode chỉ các frame AAC phủ cửa sổ bằng
   * WebCodecs AudioDecoder (reverseAudioPartial). Thành công → cửa sổ
   * đầu chỉ trả giá decode ~30 s thay vì 300 s, KHÔNG giữ cache decode
   * toàn file (~101 MB) — các lần đổi cửa sổ sau cũng decode từng phần
   * lại (vẫn dưới bar 5.000 ms, đo thật ở probe 198) thay vì trích từ
   * cache 20–90 ms như đợt 197 (đánh đổi: đổi cửa sổ chậm hơn cache
   * nhưng nhẹ RAM hơn nhiều — xem LIMITS 198). Partial hỏng (file
   * không phải MP4/AAC, browser không có AudioDecoder, decode lỗi) →
   * rơi về đường decode toàn file + cache cũ bên dưới, không đổi hành
   * vi. Trả false khi clip quá dài (> maxSeconds) hoặc decode lỗi.
   */
  async loadReversedWindow(
    data: ArrayBuffer,
    windowStartSec: number,
    windowSec: number = REVERSED_AUDIO_WINDOW_SEC,
    maxSeconds: number = MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
    partialDeps?: PartialDecodeDeps,
  ): Promise<boolean> {
    try {
      // Đợt 199 P3 — lý do partial fail của lần load này (ghi đè mỗi
      // lần load; cache hit thì giữ null vì lần này không thử partial).
      this.lastPartialFailReasonValue = null;
      let decoded: ReversedAudioBufferLike;
      if (this.decodedCache && this.decodedCache.data === data) {
        decoded = this.decodedCache.decoded;
        this.lastWindowUsedCache = true;
        this.lastWindowDecodePartialValue = false;
      } else if (this.partialFailedData !== data) {
        // Đợt 198 P3 — thử decode từng phần trước (chỉ các frame AAC
        // phủ cửa sổ). Thành công thì dựng cửa sổ từ PCM từng phần,
        // không cần decode toàn file.
        const partial = await decodeAudioWindowPartial(
          data,
          windowStartSec,
          windowSec,
          partialDeps,
        );
        if (partial.ok) {
          if (!(partial.durationSec > 0) || partial.durationSec > maxSeconds) {
            this.lastPartialFailReasonValue =
              `partial ok nhưng durationSec ${partial.durationSec} > max ${maxSeconds}`;
            return false;
          }
          const slice = slicePartialPcmForWindow(
            partial,
            windowStartSec,
            windowSec,
          );
          if (slice) {
            const sr = partial.sampleRate;
            const len = slice.endIdx - slice.startIdx;
            const out = this.ctx.createBuffer(
              partial.numberOfChannels,
              len,
              sr,
            );
            for (let ch = 0; ch < partial.numberOfChannels; ch++) {
              const rev = reverseFloat32Channel(slice.channels[ch]);
              out.getChannelData(ch).set(rev);
            }
            this.reversed = out;
            const total = Math.floor(partial.durationSec * sr);
            this.windowBaseSample = total - slice.endIdx;
            this.windowStartSecValue = slice.startIdx / sr;
            this.windowEndSecValue = slice.endIdx / sr;
            this.fullDurationSec = partial.durationSec;
            this.lastWindowDecodePartialValue = true;
            this.lastWindowUsedCache = false;
            return true;
          }
          // PCM từng phần thiếu mẫu cho cửa sổ (decoder rớt frame):
          // rơi xuống decode toàn file bên dưới (không ghi hỏng partial
          // vĩnh viễn cho data này — cửa sổ khác có thể decode được).
          // Đợt 199 P3 — ghi rõ lý do slice null để chẩn đoán (đợt 198
          // fallback câm ở đúng chỗ này với cửa sổ cuối longA).
          this.lastPartialFailReasonValue =
            `slice null: ${slicePartialPcmFailureReason(partial, windowStartSec, windowSec) ?? "không rõ"}`;
        } else {
          // Partial hỏng cho data này (không phải MP4/AAC, không có
          // AudioDecoder, decode lỗi): ghi nhớ để các lần đổi cửa sổ
          // sau không thử lại vô ích, đi thẳng decode toàn file.
          // Đợt 199 P3 — ghi rõ lý do decode fail để chẩn đoán.
          this.lastPartialFailReasonValue = `partial fail: ${partial.reason}`;
          this.partialFailedData = data;
        }
        decoded = await this.ctx.decodeAudioData(data.slice(0));
        this.lastWindowUsedCache = false;
        this.lastWindowDecodePartialValue = false;
        const pcmBytes =
          decoded.length * decoded.numberOfChannels * 4;
        this.decodedCache =
          pcmBytes <= REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES
            ? { data, decoded }
            : null;
      } else {
        decoded = await this.ctx.decodeAudioData(data.slice(0));
        this.lastWindowUsedCache = false;
        this.lastWindowDecodePartialValue = false;
        const pcmBytes =
          decoded.length * decoded.numberOfChannels * 4;
        this.decodedCache =
          pcmBytes <= REVERSED_AUDIO_DECODE_CACHE_MAX_BYTES
            ? { data, decoded }
            : null;
      }
      if (!(decoded.duration > 0) || decoded.duration > maxSeconds) {
        return false;
      }
      if (!(windowSec > 0) || !(decoded.sampleRate > 0)) return false;
      const sr = decoded.sampleRate;
      const total = decoded.length;
      const D = decoded.duration;
      // Cửa sổ kết thúc ở windowStartSec + windowSec (clamp về duration);
      // bắt đầu lùi windowSec từ đó (clamp về 0). Mốc tuyệt đối của mẫu
      // đầu cửa sổ trong buffer đảo toàn file: total − endIdx.
      const endIdx = Math.min(total, Math.max(0, Math.floor((windowStartSec + windowSec) * sr)));
      const startIdx = Math.max(0, endIdx - Math.floor(windowSec * sr));
      const len = endIdx - startIdx;
      if (len <= 0) return false;
      const out = this.ctx.createBuffer(decoded.numberOfChannels, len, sr);
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        const src = decoded.getChannelData(ch);
        // Cửa sổ đảo: window[i] = forward[endIdx−1−i] (xem ghi chú
        // windowBaseSample ở trên — mẫu đầu cửa sổ = mẫu đảo ở offset
        // tuyệt đối total − endIdx).
        const rev = reverseFloat32Channel(src.subarray(startIdx, endIdx));
        out.getChannelData(ch).set(rev);
      }
      this.reversed = out;
      this.windowBaseSample = total - endIdx;
      this.windowStartSecValue = startIdx / sr;
      this.windowEndSecValue = endIdx / sr;
      this.fullDurationSec = D;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Phát đoạn đảo từ startSample (offset TUYỆT ĐỐI trong buffer đảo toàn
   * file — wiring tính bằng reversedSampleOffsetFromSourceTime; player tự
   * đổi về offset tương đối trong cửa sổ, ngoài cửa sổ thì false) trong
   * seconds giây. Trả false khi chưa load / tham số sai / ctx lỗi /
   * ngoài cửa sổ.
   * Đợt 192 P3: gain mục tiêu tùy chọn (mặc định 1) — wiring preview
   * truyền gain clip (volume × fades × keyframes × trackVolume, đã
   * clamp 0..1 như AudioEngine.update) để audio đảo nghe đúng mức
   * như phát xuôi; fade vào vẫn ramp từ 0 lên đúng gain đó.
   * rate tùy chọn (mặc định 1): tốc độ clip (speed/ramp) — buffer đảo
   * phát nhanh/chậm theo đúng tốc độ source time lùi, khớp hình.
   * Fake ctx không có playbackRate thì bỏ qua (giữ tương thích test).
   * Đợt 193 P3 — crossfade: đoạn cũ đang phát thì KHÔNG cắt ngay mà mờ
   * dần trong crossfadeSec (mặc định 80 ms) trong khi đoạn mới mờ vào
   * cùng khoảng đó (đoạn mới bắt đầu đúng mẫu nối tiếp nên nội dung
   * chồng nhau — không còn khoảng lặng tại điểm nối như đợt 192).
   * Đoạn đầu tiên (không có đoạn cũ) vẫn fade vào 10 ms như cũ.
   * `lastSegmentLengthSamples` ghi độ dài thật đã lên lịch (đã clamp ở
   * cuối buffer/cửa sổ) để wiring biết đoạn hết lúc nào.
   */
  playSegment(
    startSample: number,
    seconds: number,
    gain = 1,
    rate = 1,
    crossfadeSec: number = REVERSED_AUDIO_CROSSFADE_SEC,
  ): boolean {
    if (!this.reversed) return false;
    if (!(seconds > 0) || !(startSample >= 0)) return false;
    // Đợt 193 P3 — đổi offset tuyệt đối về tương đối trong cửa sổ.
    const relStart = startSample - this.windowBaseSample;
    if (relStart < 0 || relStart >= this.reversed.length) return false;
    const targetGain = Number.isFinite(gain) ? Math.min(1, Math.max(0, gain)) : 1;
    const playRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
    const fadeSec = Number.isFinite(crossfadeSec) && crossfadeSec > 0 ? crossfadeSec : 0;
    try {
      const t0 = this.ctx.currentTime;
      // Đoạn cũ đang phát → chuyển sang "đang mờ dần": gain về 0 trong
      // fadeSec, dừng hẳn ở t0 + fadeSec. Đoạn mới bắt đầu NGAY (không
      // đợi đoạn cũ hết) nên 2 đoạn chồng nhau đúng nội dung nối tiếp.
      // Không có đoạn cũ thì fadeSec của đoạn mới = REVERSED_AUDIO_FADE_SEC.
      const prevSrc = this.source;
      const prevGain = this.gainNode;
      const overlapping = prevSrc !== null && prevGain !== null && fadeSec > 0;
      if (prevSrc && prevGain) {
        if (overlapping) {
          try {
            prevGain.gain.setTargetAtTime(0, t0, fadeSec / 3);
          } catch {
            /* gain lạ — vẫn dừng đoạn cũ bên dưới */
          }
          try {
            prevSrc.stop(t0 + fadeSec);
          } catch {
            /* dừng lỗi — vẫn dọn tham chiếu bên dưới */
          }
          // Ngắt kết nối sau khi mờ xong (chỉ dọn — tiếng đã dừng bằng
          // stop(t0 + fadeSec)). Giữ tham chiếu prev để stop()/dispose()
          // tắt nốt nếu bị gọi giữa chừng (xem silencePrev).
          this.prevSource = prevSrc;
          this.prevGainNode = prevGain;
          const ps = prevSrc;
          const pg = prevGain;
          setTimeout(() => {
            try {
              ps.disconnect();
            } catch {
              /* bỏ qua */
            }
            try {
              pg.disconnect();
            } catch {
              /* bỏ qua */
            }
            if (this.prevSource === ps) this.prevSource = null;
            if (this.prevGainNode === pg) this.prevGainNode = null;
          }, Math.ceil(fadeSec * 1000) + 50);
        } else {
          // Không crossfade (fadeSec = 0 — caller tắt tường minh): cắt
          // đoạn cũ kiểu cũ (mờ nhanh 10 ms) để không chồng tiếng.
          this.silenceSource(prevSrc, prevGain, t0);
        }
      }
      this.source = null;
      this.gainNode = null;
      if (this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => {});
      }
      const src = this.ctx.createBufferSource();
      const gainNode = this.ctx.createGain();
      src.buffer = this.reversed;
      if (src.playbackRate && playRate !== 1) {
        try {
          src.playbackRate.value = playRate;
        } catch {
          /* context không cho đặt rate — phát ở 1×, wiring restart bù */
        }
      }
      const fadeInSec = overlapping ? fadeSec : REVERSED_AUDIO_FADE_SEC;
      gainNode.gain.setTargetAtTime(0, t0, 0.001);
      gainNode.gain.linearRampToValueAtTime(targetGain, t0 + fadeInSec);
      src.connect(gainNode);
      gainNode.connect(this.destination);
      const dur = Math.min(
        seconds,
        (this.reversed.length - relStart) / this.reversed.sampleRate,
      );
      src.start(t0, relStart / this.reversed.sampleRate, dur);
      this.source = src;
      this.gainNode = gainNode;
      this.lastSegLength = Math.max(0, Math.floor(dur * this.reversed.sampleRate));
      return true;
    } catch {
      return false;
    }
  }

  /** Tắt 1 cặp source/gain kiểu cũ (mờ nhanh 10 ms rồi dừng) — dùng khi
   * playSegment không crossfade và khi stop()/dispose() dọn. Không throw. */
  private silenceSource(
    src: ReversedAudioSourceLike,
    gainNode: ReversedGainNodeLike,
    t0: number,
  ): void {
    try {
      gainNode.gain.setTargetAtTime(0, t0, 0.005);
      src.stop(t0 + REVERSED_AUDIO_FADE_SEC * 2);
    } catch {
      /* dừng lỗi thì bỏ qua, vẫn dọn tham chiếu */
    }
    try {
      src.disconnect();
    } catch {
      /* bỏ qua */
    }
    try {
      gainNode.disconnect();
    } catch {
      /* bỏ qua */
    }
  }

  /** Dừng đoạn đang phát (fade ra 10 ms, không click) + tắt nốt đoạn
   * đang mờ dần sau crossfade (nếu có). */
  stop(): void {
    // Đoạn đang mờ dần sau crossfade: tắt ngay (không đợi hết fade).
    if (this.prevSource && this.prevGainNode) {
      const ps = this.prevSource;
      const pg = this.prevGainNode;
      this.prevSource = null;
      this.prevGainNode = null;
      this.silenceSource(ps, pg, this.ctx.currentTime);
    }
    if (!this.source || !this.gainNode) return;
    const src = this.source;
    const gn = this.gainNode;
    this.source = null;
    this.gainNode = null;
    this.silenceSource(src, gn, this.ctx.currentTime);
  }

  /** Nhả buffer đảo (khi clip không còn active). */
  dispose(): void {
    this.stop();
    this.reversed = null;
    this.decodedCache = null;
    this.lastWindowUsedCache = false;
    this.lastWindowDecodePartialValue = false;
    this.partialFailedData = null;
    this.lastPartialFailReasonValue = null;
    this.lastSegLength = 0;
    this.windowBaseSample = 0;
    this.windowStartSecValue = 0;
    this.windowEndSecValue = 0;
    this.fullDurationSec = 0;
  }
}
