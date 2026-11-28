// reverseAudioPartial.ts — Đợt 198 P3: decode TỪNG PHẦN audio cho N11b.
//
// Vấn đề: cửa sổ đầu của clip dài 300 s vẫn decode TOÀN FILE bằng
// decodeAudioData (đợt 197: 5.414 / 6.314 ms > bar 5.000 ms) vì
// decodeAudioData không decode được một đoạn của file. Giải pháp
// thật: demux MP4 lấy đúng các frame AAC phủ cửa sổ 30 s cần phát
// (mp4AudioDemux.ts) rồi decode chỉ các frame đó bằng WebCodecs
// AudioDecoder (codec mp4a.40.2, description = AudioSpecificConfig
// trong esds). File 300 s → chỉ decode ~30 s (~1/10 số frame).
//
// An toàn: mọi bước đều có fallback — demux lỗi / AudioDecoder vắng
// / config không hỗ trợ / decode lỗi / PCM thiếu mẫu → trả
// { ok: false } và caller (ReverseAudioPlayer.loadReversedWindow)
// rơi về đường decode toàn file + cache cũ, không bao giờ làm hỏng
// preview. Không sửa hành vi khi partial thất bại.
//
// Priming AAC + frame đầu thiếu tiền lệ: frame AAC decode bằng
// overlap-add với frame TRƯỚC — frame đầu tiên nạp mà không có tiền
// lệ cho ra ~1024 mẫu gần im (đo thật: RMS 0,0039 vs 0,32 bình
// thường). Nên nạp thêm 1 frame tiền lệ (firstIndex−1, nếu có) rồi
// BỎ output của nó (theo timestamp, xem dưới) để frame đầu cửa sổ
// decode đúng. Frame tiền lệ không tính vào samplesDecoded.
// Ngoài ra stts của file thật có 29 frame duration 1793 (không phải
// 1024) rải đều mỗi 469 frame — timestamp stts trôi khỏi lưới PCM
// tới 0,48 s cuối file — nên việc bỏ output tiền lệ phải theo
// TIMESTAMP OUTPUT (không theo số mẫu): output tiền lệ kết thúc đúng
// tại timestamp frame đầu cửa sổ, dù duration stts của nó là 1793.
//
// Module thuần (trừ AudioDecoder/EncodedAudioChunk lấy qua globalThis
// hoặc deps truyền vào để test bằng fake), cú pháp TypeScript erasable.
import { audioChunkInit, parseMp4AudioTrack } from "./mp4AudioDemux.ts";

export interface PartialDecodeOk {
  ok: true;
  /** PCM từng kênh, mẫu 0 = coverStartSec (đã cắt priming). */
  channels: Float32Array[];
  sampleRate: number;
  numberOfChannels: number;
  /** Thời gian nguồn của mẫu PCM đầu (giây). */
  coverStartSec: number;
  /** Thời gian nguồn của mẫu PCM cuối (giây). */
  coverEndSec: number;
  /** Thời lượng file nguồn đầy đủ (giây, từ stts). */
  durationSec: number;
  /** Số frame AAC đã decode. */
  samplesDecoded: number;
  /** Số mẫu PCM mỗi kênh (sau khi cắt priming). */
  sampleCount: number;
  decodeMs: number;
  /** Số mẫu priming đã cắt ở đầu (0 nếu decoder không sinh priming). */
  primingTrimmedSamples: number;
  /** Chỉ số frame AAC đầu tiên của cửa sổ (để đối chiếu mốc tuyệt đối). */
  firstSampleIndex: number;
  /** Số mẫu PCM mỗi frame AAC (1024 với AAC-LC thật; đo từ stts sample đầu). */
  samplesPerFrame: number;
  /** Đợt 199 P3 — độ trôi timestamp (mẫu, ≥ 0): output đầu giữ lại có
   * timestamp sớm hơn timestamp stts của frame đầu cửa sổ bao nhiêu —
   * do frame tiền lệ có duration stts ≠ spf (vd 1793), KHÔNG phải mẫu
   * thừa: decoder vẫn trả đúng spf mẫu/frame theo lưới PCM nên KHÔNG
   * cắt mẫu theo con số này (bài học đợt 198: cắt 769 mẫu thật làm
   * slice null → fallback). Chỉ để chẩn đoán. */
  timestampDriftSamples: number;
  /** Đợt 199 P3 — tổng số mẫu PCM thật của file (sau trim priming),
   * chỉ biết chắc khi cửa sổ chứa frame cuối file; null khi chưa biết
   * (slice dùng durationSec làm trần như cũ). Cần vì durationSec (tổng
   * stts) thổi phồng tổng tới 0,48 s do 29 frame duration 1793. */
  totalPcmSamples: number | null;
}

export type PartialDecodeResult =
  | PartialDecodeOk
  | { ok: false; reason: string };

/** AudioDecoder / EncodedAudioChunk (thật từ globalThis hoặc fake cho test). */
export interface PartialDecodeDeps {
  AudioDecoder?: unknown;
  EncodedAudioChunk?: unknown;
}

interface AudioDataLike {
  readonly numberOfChannels: number;
  readonly numberOfFrames: number;
  readonly sampleRate: number;
  readonly timestamp: number;
  readonly duration: number;
  copyTo(destination: Float32Array, options: { planeIndex: number }): void;
  close(): void;
}

interface AudioDecoderLike {
  decode(chunk: unknown): void;
  flush(): Promise<void>;
  close(): void;
  configure(config: unknown): void;
}

type AudioDecoderCtorLike = new (init: {
  output: (data: AudioDataLike) => void;
  error: (e: Error) => void;
}) => AudioDecoderLike;

type EncodedAudioChunkCtorLike = new (init: {
  type: string;
  timestamp: number;
  duration: number;
  data: Uint8Array;
}) => unknown;

function fail(reason: string): { ok: false; reason: string } {
  return { ok: false, reason };
}

/**
 * Decode chỉ các frame AAC phủ cửa sổ [windowStartSec, windowStartSec
 * + windowSec] của file MP4. Trả PCM đã cắt priming (mẫu 0 =
 * coverStartSec) hoặc { ok: false } để caller fallback.
 *
 * CHỌN FRAME THEO LƯỚI PCM (không theo timestamp stts): stts của
 * file thật có 29 frame duration 1793 (không phải 1024) rải đều mỗi
 * 469 frame nên timestamp stts trôi khỏi lưới PCM tới 0,48 s cuối
 * file — chọn theo stts sẽ thiếu frame ở cuối cửa sổ và slice ở
 * caller trả null (đợt 198: cửa sổ [270.154, 300.154] thiếu 2.246
 * mẫu → rơi về decode toàn file 5.106 ms). Lưới PCM: mỗi frame AAC-LC
 * = 1024 mẫu; mốc 0 của lưới = sau 1 frame priming (encoder delay,
 * decodeAudioData/ffmpeg đều trim 1024 mẫu đầu) nên cộng thêm 1 frame.
 * spf (mẫu/frame) lấy từ duration stts của sample đầu
 * (duration × sampleRate / timescale) — 1024 với file thật, 4800 với
 * fixture tổng hợp trong test (frame 100 ms).
 */
export async function decodeAudioWindowPartial(
  data: ArrayBuffer,
  windowStartSec: number,
  windowSec: number,
  deps: PartialDecodeDeps = {},
): Promise<PartialDecodeResult> {
  const t0 = Date.now();
  let track;
  try {
    track = parseMp4AudioTrack(data);
  } catch (e) {
    return fail(`demux audio lỗi: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (track.samples.length === 0) return fail("track audio rỗng");
  const sr0 = track.sampleRate;
  const spf =
    Math.round(
      (track.samples[0].duration * sr0) / track.timescale,
    ) || 1024;
  if (!(spf > 0)) return fail("spf không hợp lệ");
  // Chọn frame theo lưới PCM (xem ghi chú trên): cửa sổ [w0, w0+wSec]
  // tính theo mẫu tuyến tính + 1 frame priming, rồi chia cho spf.
  const rawStart = Math.floor(windowStartSec * sr0) + spf;
  const rawEnd = Math.ceil((windowStartSec + windowSec) * sr0) + spf;
  const firstIndex = Math.max(0, Math.floor(rawStart / spf));
  const lastIndex = Math.min(
    track.samples.length - 1,
    Math.ceil(rawEnd / spf) - 1,
  );
  if (lastIndex < firstIndex) return fail("cửa sổ ngoài file audio");
  const sel = {
    firstIndex,
    lastIndex,
    coverStartSec: track.samples[firstIndex].timestamp / track.timescale,
    coverEndSec:
      (track.samples[lastIndex].timestamp +
        track.samples[lastIndex].duration) /
      track.timescale,
  };
  const g = globalThis as unknown as Record<string, unknown>;
  const ADCtor = (deps.AudioDecoder ?? g.AudioDecoder) as
    | AudioDecoderCtorLike
    | undefined;
  const EACCtor = (deps.EncodedAudioChunk ?? g.EncodedAudioChunk) as
    | EncodedAudioChunkCtorLike
    | undefined;
  if (typeof ADCtor !== "function" || typeof EACCtor !== "function") {
    return fail("browser này không có AudioDecoder");
  }
  const config = {
    codec: track.codec,
    sampleRate: track.sampleRate,
    numberOfChannels: track.channels,
    description: track.description,
  };
  const probe = (
    ADCtor as unknown as {
      isConfigSupported?: (
        config: unknown,
      ) => Promise<{ supported: boolean }>;
    }
  ).isConfigSupported;
  if (typeof probe === "function") {
    try {
      const r = await probe.call(ADCtor, config);
      if (!r.supported) return fail(`AudioDecoder không hỗ trợ ${track.codec}`);
    } catch {
      // Probe lỗi thì vẫn thử configure (configure mới quyết định cuối).
    }
  }
  const outputs: AudioDataLike[] = [];
  // Lỗi decoder thu vào mảng (không dùng `let ...: Error | null` vì
  // tsc thu hẹp biến gán trong closure thành never ở điểm đọc).
  const decoderErrors: Error[] = [];
  let decoder: AudioDecoderLike;
  try {
    decoder = new ADCtor({
      output: (d) => outputs.push(d),
      error: (e) => {
        decoderErrors.push(e);
      },
    });
    decoder.configure(config);
  } catch (e) {
    return fail(
      `AudioDecoder configure lỗi: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const fileBytes = new Uint8Array(data);
  // Nạp thêm 1 frame tiền lệ để frame đầu cửa sổ có overlap-add đúng.
  const feedFirstIndex = sel.firstIndex > 0 ? sel.firstIndex - 1 : sel.firstIndex;
  try {
    for (let i = feedFirstIndex; i <= sel.lastIndex; i++) {
      const s = track.samples[i];
      const init = audioChunkInit(
        track,
        s,
        fileBytes.subarray(s.offset, s.offset + s.size),
      );
      decoder.decode(new EACCtor(init));
    }
    // Tránh treo mãi nếu decoder kẹt: flush quá 30 s thì bỏ (fallback).
    const flushed = await Promise.race([
      decoder.flush().then(() => true),
      new Promise<boolean>((res) => setTimeout(() => res(false), 30000)),
    ]);
    if (!flushed) {
      try {
        decoder.close();
      } catch {
        /* bỏ qua */
      }
      return fail("AudioDecoder flush timeout 30 s");
    }
  } catch (e) {
    try {
      decoder.close();
    } catch {
      /* bỏ qua */
    }
    return fail(
      `AudioDecoder decode lỗi: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  try {
    decoder.close();
  } catch {
    /* bỏ qua */
  }
  if (decoderErrors.length > 0) {
    return fail(`AudioDecoder error: ${decoderErrors[0].message}`);
  }
  if (outputs.length === 0) return fail("AudioDecoder không trả frame nào");
  // Bỏ output tiền lệ / priming: các output dẫn kết thúc đúng tại (hoặc
  // trước) timestamp frame đầu cửa sổ thì không thuộc cửa sổ. So theo
  // TIMESTAMP (ts + duration <= firstChunkTsUs) chứ không theo số mẫu —
  // vì stts có frame duration 1793 (xem trên) nên 1 frame tiền lệ vẫn
  // chỉ decode ra 1024 mẫu PCM, cắt theo mẫu sẽ cắt lố vào frame sau.
  // Đợt 199 P3 — SỬA HIỂU LẦM ĐỢT 198 (xác minh bằng đo thật, xem
  // LIMITS 199 §1.2): timestamp output của AudioDecoder advance theo
  // SỐ MẪU DECODE (1024/frame, cộng dồn từ chunk đầu nạp) chứ KHÔNG
  // theo timestamp stts. Frame tiền lệ duration 1793 làm output đầu
  // giữ lại có timestamp SỚM hơn firstChunkTsUs 769 mẫu — code cũ
  // tưởng "priming lẻ trong cùng 1 output" và CẮT 769 mẫu THẬT
  // (extraTrim) → sampleCount 1.439.999, slice cần 1.440.480 mẫu →
  // null → fallback full decode (N11b CHƯA ĐẠT đợt 198, giả thuyết
  // "frame cuối decode 768 mẫu" BỊ BÁC: decoder trả đủ 1024 cho mọi
  // frame kể cả frame cuối). Output của decoder là các frame PCM LIÊN
  // TIẾP theo lưới nên timestamp sớm KHÔNG có nghĩa là thừa mẫu:
  // KHÔNG CẮT theo timestamp nữa, chỉ ghi lại độ trôi để chẩn đoán.
  // Priming thật (frame 0, 1024 mẫu gần im) là cả 1 output riêng, đã
  // bỏ ở vòng while dưới.
  const firstChunkTsUs = Math.round(
    (track.samples[sel.firstIndex].timestamp * 1_000_000) / track.timescale,
  );
  let dropOutputs = 0;
  let primingTrimmedSamples = 0;
  while (
    dropOutputs < outputs.length &&
    outputs[dropOutputs].timestamp + outputs[dropOutputs].duration <=
      firstChunkTsUs
  ) {
    primingTrimmedSamples += outputs[dropOutputs].numberOfFrames;
    dropOutputs++;
  }
  if (dropOutputs >= outputs.length) {
    return fail("AudioDecoder chỉ trả output tiền lệ/priming");
  }
  const firstKeptTsUs = outputs[dropOutputs].timestamp;
  if (firstKeptTsUs > firstChunkTsUs) {
    // Decoder nuốt mất đầu cửa sổ (thiếu mẫu) — không đoán, fallback.
    return fail(
      `AudioData đầu trễ ${firstKeptTsUs - firstChunkTsUs} µs so với chunk đầu`,
    );
  }
  // Gộp PCM từng kênh theo thứ tự output (chỉ các output còn lại).
  const sr = track.sampleRate;
  const chCount = track.channels;
  // Đợt 199 P3 — độ trôi timestamp (mẫu, ≥ 0; xem ghi chú ở vòng drop
  // trên): không cắt mẫu theo con số này, chỉ ghi lại để chẩn đoán.
  const timestampDriftSamples = Math.max(
    0,
    Math.round(((firstChunkTsUs - firstKeptTsUs) * sr) / 1_000_000),
  );
  const perChannel: Float32Array[][] = Array.from(
    { length: chCount },
    () => [],
  );
  let totalFrames = 0;
  for (let oi = dropOutputs; oi < outputs.length; oi++) {
    const out = outputs[oi];
    if (out.sampleRate !== sr || out.numberOfChannels !== chCount) {
      return fail(
        `AudioData lệch format: ${out.sampleRate} Hz/${out.numberOfChannels}ch (mong ${sr}/${chCount})`,
      );
    }
    totalFrames += out.numberOfFrames;
    for (let ch = 0; ch < chCount; ch++) {
      const buf = new Float32Array(out.numberOfFrames);
      out.copyTo(buf, { planeIndex: ch });
      perChannel[ch].push(buf);
    }
    try {
      out.close();
    } catch {
      /* bỏ qua */
    }
  }
  // Đóng các output đã bỏ (tiền lệ/priming) để khỏi rò AudioData.
  for (let oi = 0; oi < dropOutputs; oi++) {
    try {
      outputs[oi].close();
    } catch {
      /* bỏ qua */
    }
  }
  let channels: Float32Array[] = perChannel.map((parts) => {
    const out = new Float32Array(totalFrames);
    let w = 0;
    for (const p of parts) {
      out.set(p, w);
      w += p.length;
    }
    return out;
  });
  // Đợt 199 P3 — KHÔNG cắt "priming lẻ trong cùng 1 output" theo
  // timestamp nữa (xem ghi chú ở vòng drop trên: timestamp sớm là trôi
  // stts, mẫu vẫn là PCM thật theo lưới; code cũ cắt 769 mẫu thật ở
  // cửa sổ cuối longA → slice null → fallback). sampleCount = tổng mẫu
  // của các output đã giữ.
  const sampleCount = totalFrames;
  if (sampleCount <= 0) return fail("PCM sau khi cắt priming rỗng");
  // Kiểm tra lưới PCM (KHOAN DUNG — đợt 199): mỗi frame decode đúng
  // spf mẫu, TRỪ frame cuối file có thể ngắn (stts 768 — decoder thật
  // Chromium trả đủ 1024, nhưng decoder khác có thể trả 768). Chấp
  // nhận khoảng [minFrames, keptFrames×spf]; ngoài khoảng → thiếu/
  // thừa mẫu thật → fallback. (Đợt 198 check bằng nhau tuyệt đối nên
  // giả thuyết frame cuối ngắn chưa xác minh đã đủ làm fallback — nay
  // đã xác minh decoder trả đủ 1024, check khoan dung chỉ để phòng
  // decoder khác.)
  const keptFrames = lastIndex - firstIndex + 1;
  const lastFrameSamples =
    lastIndex === track.samples.length - 1
      ? Math.round(
          (track.samples[lastIndex].duration * sr) / track.timescale,
        )
      : spf;
  const minFrames =
    (keptFrames - 1) * spf + Math.min(spf, Math.max(1, lastFrameSamples));
  if (totalFrames < minFrames || totalFrames > keptFrames * spf) {
    return fail(
      `decoder trả ${totalFrames} mẫu cho ${keptFrames} frame (mong ${minFrames}–${keptFrames * spf})`,
    );
  }
  // Tổng PCM thật của file (sau trim priming) — chỉ biết chắc khi cửa
  // sổ chứa frame cuối file: PCM[0] ở lưới firstIndex×spf nên tổng =
  // firstIndex×spf + sampleCount − spf (trừ 1 frame priming). Slice
  // dùng số này làm trần thay vì durationSec (stts) — stts thổi phồng
  // tổng tới 0,48 s do 29 frame duration 1793.
  const totalPcmSamples =
    lastIndex === track.samples.length - 1
      ? firstIndex * spf + sampleCount - spf
      : null;
  return {
    ok: true,
    channels,
    sampleRate: sr,
    numberOfChannels: chCount,
    coverStartSec: sel.coverStartSec,
    coverEndSec: sel.coverEndSec,
    durationSec: track.durationSec,
    samplesDecoded: sel.lastIndex - sel.firstIndex + 1,
    sampleCount,
    decodeMs: Date.now() - t0,
    primingTrimmedSamples,
    firstSampleIndex: sel.firstIndex,
    samplesPerFrame: spf,
    timestampDriftSamples,
    totalPcmSamples,
  };
}

/**
 * Cắt lát PCM forward cho đúng cửa sổ [windowStartSec, windowStartSec
 * + windowSec] từ kết quả partial decode. Mốc lát cắt tính theo LƯỚI
 * FRAME (firstSampleIndex × samplesPerFrame + 1 frame priming — xem
 * ghi chú ở decodeAudioWindowPartial), KHÔNG theo coverStartSec
 * (timestamp stts trôi khỏi lưới PCM tới 0,48 s cuối file — dùng
 * coverStartSec sẽ cắt sai 0,46 s và trả null ở cửa sổ cuối). Trả
 * lát forward (CHƯA đảo) + mốc tuyệt đối [startIdx, endIdx) trong
 * file (mẫu forward), để player đảo + đặt windowBaseSample như đường
 * cũ. null khi PCM thiếu mẫu cho cửa sổ — caller fallback decode
 * toàn file.
 */
export function slicePartialPcmForWindow(
  partial: PartialDecodeOk,
  windowStartSec: number,
  windowSec: number,
): {
  channels: Float32Array[];
  startIdx: number;
  endIdx: number;
} | null {
  const sr = partial.sampleRate;
  const spf = partial.samplesPerFrame;
  if (!(spf > 0)) return null;
  // Đợt 199 P3 — trần tổng PCM: dùng tổng thật từ decode khi cửa sổ
  // chứa frame cuối file (durationSec theo stts thổi phồng tổng tới
  // 0,48 s — xem decodeAudioWindowPartial); không thì dùng durationSec
  // như cũ (cửa sổ giữa file không chạm trần này).
  const total =
    partial.totalPcmSamples ?? Math.floor(partial.durationSec * sr);
  // Đợt 199 P3 — SỬA LỖI TRƯỢT CỬA SỔ (đo thật pass A-199): code cũ
  // tính startIdx = endIdx − windowSec×sr nên khi endIdx bị kẹp bởi
  // cuối file thật, cửa sổ TRƯỢT VỀ TRƯỚC (vd app xin [270.6, 300.6]
  // nhưng endIdx kẹp ở 300.16 → startIdx 270.16) trong khi partial
  // decode chỉ phủ cửa sổ ĐƯỢC XIN [270.6, 300.6] → off −20736 → null
  // → fallback full decode 44.415 ms (N11b vẫn CHƯA ĐẠT ở pass A).
  // Nay startIdx tính từ ĐẦU CỬA SỔ ĐƯỢC XIN (floor(w0×sr)), endIdx
  // kẹp ở cuối file thật: cửa sổ cuối ngắn lại (29,56 s thay vì 30 s)
  // thay vì trượt — đúng với đường full decode (cửa sổ cũng chỉ giữ
  // mẫu thật tới cuối file). Với cửa sổ giữa file, hai công thức cho
  // cùng startIdx (sai khác ≤ 1 mẫu do làm tròn).
  const startIdx = Math.max(0, Math.floor(windowStartSec * sr));
  const endIdx = Math.min(
    total,
    Math.max(0, Math.floor((windowStartSec + windowSec) * sr)),
  );
  const len = endIdx - startIdx;
  if (len <= 0) return null;
  // PCM[0] = mẫu đầu frame firstSampleIndex; mốc 0 của lưới = sau 1
  // frame priming (spf mẫu) nên lát cắt bắt đầu ở startIdx + spf
  // trong hệ lưới frame.
  const off = startIdx + spf - partial.firstSampleIndex * spf;
  if (off < 0 || off + len > partial.sampleCount) return null;
  return {
    channels: partial.channels.map((ch) => ch.subarray(off, off + len)),
    startIdx,
    endIdx,
  };
}

/**
 * Đợt 199 P3 — lý do slicePartialPcmForWindow trả null (để player ghi
 * log chẩn đoán thay vì fallback câm như đợt 198): null khi slice
 * thành công, chuỗi lý do (kèm số off/len/sampleCount) khi slice null.
 * Tính lại đúng công thức của slicePartialPcmForWindow — chỉ dùng để
 * chẩn đoán, không dùng để cắt lát.
 */
export function slicePartialPcmFailureReason(
  partial: PartialDecodeOk,
  windowStartSec: number,
  windowSec: number,
): string | null {
  if (slicePartialPcmForWindow(partial, windowStartSec, windowSec)) {
    return null;
  }
  const sr = partial.sampleRate;
  const spf = partial.samplesPerFrame;
  if (!(spf > 0)) return "slice null: samplesPerFrame không hợp lệ";
  const total =
    partial.totalPcmSamples ?? Math.floor(partial.durationSec * sr);
  const startIdx = Math.max(0, Math.floor(windowStartSec * sr));
  const endIdx = Math.min(
    total,
    Math.max(0, Math.floor((windowStartSec + windowSec) * sr)),
  );
  const len = endIdx - startIdx;
  if (len <= 0) {
    return `slice null: len=${len} (endIdx=${endIdx} startIdx=${startIdx} totalPcm=${total})`;
  }
  const off = startIdx + spf - partial.firstSampleIndex * spf;
  if (off < 0) {
    return `slice null: off=${off} < 0 (startIdx=${startIdx} trước PCM từng phần, firstIndex=${partial.firstSampleIndex})`;
  }
  if (off + len > partial.sampleCount) {
    return `slice null: cần off+len=${off + len} mẫu, chỉ có sampleCount=${partial.sampleCount} (thiếu ${off + len - partial.sampleCount}; firstIndex=${partial.firstSampleIndex} spf=${spf} driftTs=${partial.timestampDriftSamples})`;
  }
  return "slice null: lý do không xác định";
}
