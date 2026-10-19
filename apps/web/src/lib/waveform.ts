/**
 * waveform.ts — Tính peaks cho audio waveform hiển thị trên timeline.
 *
 * Thiết kế (giống CapCut web): 100% client-side bằng Web Audio API.
 *  - `computePeaksForRange`: hàm THUẦN (không chạm DOM) — tính peak từng bucket
 *    trên đoạn [fromSec, toSec) của PCM. Dễ unit test bằng Node.
 *  - `decodeAudioPeaks`: browser-only — fetch file audio (blob: URL từ MediaBin),
 *    decode bằng AudioContext, rồi gọi computePeaksForRange. Có cache LRU.
 *
 * NGUYÊN TẮC TRUNG THỰC: peaks luôn được tính từ PCM thật của file,
 * không bao giờ vẽ bừa hay dùng số ngẫu nhiên.
 */

/** Kết quả decode + tính peaks cho một đoạn audio. */
export interface PeaksResult {
  /** Mảng peak 0..1, độ dài = bucketCount yêu cầu. */
  peaks: number[];
  /** Độ dài thực tế của đoạn đã tính (giây, sau khi clamp). */
  duration: number;
  sampleRate: number;
}

/**
 * Tính peak (max |mẫu|) cho từng bucket trên đoạn [fromSec, toSec) của PCM.
 *
 * @param channels  mảng Float32Array-like, mỗi phần tử là 1 kênh (mono = 1 kênh).
 *                  Nhiều kênh → lấy max giữa các kênh (chuẩn hiển thị waveform).
 * @param sampleRate  số mẫu/giây của PCM.
 * @param fromSec / toSec  đoạn cần tính (giây). Tự clamp về [0, duration].
 * @param bucketCount  số bucket muốn ra (>= 1).
 * @returns mảng number[] độ dài bucketCount, giá trị 0..1.
 * @throws khi channels rỗng, sampleRate không hợp lệ, hoặc bucketCount < 1.
 */
export function computePeaksForRange(
  channels: ArrayLike<ArrayLike<number>>,
  sampleRate: number,
  fromSec: number,
  toSec: number,
  bucketCount: number,
): number[] {
  if (!Number.isInteger(bucketCount) || bucketCount < 1) {
    throw new Error(`bucketCount phải là số nguyên >= 1, nhận được: ${bucketCount}`);
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error(`sampleRate không hợp lệ: ${sampleRate}`);
  }
  if (channels.length === 0 || channels[0].length === 0) {
    throw new Error("channels rỗng — không có mẫu PCM nào để tính");
  }
  const totalSamples = channels[0].length;
  const fileDuration = totalSamples / sampleRate;

  const from = Math.max(0, Math.min(fileDuration, fromSec));
  const to = Math.max(0, Math.min(fileDuration, toSec));
  const startSample = Math.floor(from * sampleRate);
  const endSample = Math.ceil(to * sampleRate);
  const span = Math.max(0, endSample - startSample);

  const peaks = new Array<number>(bucketCount).fill(0);
  if (span === 0) return peaks; // đoạn rỗng → toàn 0 (đã clamp, không throw)

  const samplesPerBucket = span / bucketCount;
  for (let b = 0; b < bucketCount; b++) {
    const s0 = startSample + Math.floor(b * samplesPerBucket);
    const s1 = startSample + Math.floor((b + 1) * samplesPerBucket);
    let peak = 0;
    // Ít nhất 1 mẫu mỗi bucket để không bỏ sót (khi bucket < 1 mẫu).
    const lo = Math.min(s0, totalSamples - 1);
    const hi = Math.max(s0 + 1, Math.min(s1, totalSamples));
    for (let s = lo; s < hi; s++) {
      for (let c = 0; c < channels.length; c++) {
        const v = Math.abs(channels[c][s] ?? 0);
        if (v > peak) peak = v;
      }
    }
    peaks[b] = Math.min(1, peak);
  }
  return peaks;
}

/** Tiện ích: tính peaks cho TOÀN BỘ buffer. */
export function computePeaks(
  channels: ArrayLike<ArrayLike<number>>,
  sampleRate: number,
  bucketCount: number,
): number[] {
  if (channels.length === 0 || channels[0].length === 0) {
    throw new Error("channels rỗng — không có mẫu PCM nào để tính");
  }
  const duration = channels[0].length / sampleRate;
  return computePeaksForRange(channels, sampleRate, 0, duration, bucketCount);
}

// ---------------------------------------------------------------------------
// Browser-only: decode bằng Web Audio API + cache
// ---------------------------------------------------------------------------

interface DecodedAudio {
  channels: Float32Array[];
  sampleRate: number;
  duration: number;
}

/** Cache decode theo URL: tối đa 8 file (LRU thô — xoá entry cũ nhất khi đầy). */
const decodeCache = new Map<string, Promise<DecodedAudio>>();
const MAX_CACHE_ENTRIES = 8;

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (sharedCtx) return sharedCtx;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) throw new Error("Trình duyệt không hỗ trợ Web Audio API");
  sharedCtx = new AC();
  return sharedCtx;
}

/**
 * Decode toàn bộ file audio thành PCM (float32). Kết quả được cache theo URL,
 * các lần gọi đồng thời cùng URL dùng chung 1 promise (không decode 2 lần).
 */
function decodeFile(url: string): Promise<DecodedAudio> {
  const cached = decodeCache.get(url);
  if (cached) return cached;
  const p = (async (): Promise<DecodedAudio> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được audio (HTTP ${res.status})`);
    const buf = await res.arrayBuffer();
    const audioBuf = await getAudioContext().decodeAudioData(buf);
    const channels: Float32Array[] = [];
    for (let c = 0; c < audioBuf.numberOfChannels; c++) {
      channels.push(audioBuf.getChannelData(c));
    }
    return { channels, sampleRate: audioBuf.sampleRate, duration: audioBuf.duration };
  })();
  // LRU thô: khi đầy thì xoá entry đầu tiên (cũ nhất).
  if (decodeCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = decodeCache.keys().next().value;
    if (oldest !== undefined) decodeCache.delete(oldest);
  }
  decodeCache.set(url, p);
  // Decode lỗi thì gỡ khỏi cache để lần sau thử lại được.
  p.catch(() => {
    if (decodeCache.get(url) === p) decodeCache.delete(url);
  });
  return p;
}

/**
 * Decode file audio tại `url` rồi tính peaks cho đoạn [fromSec, toSec).
 * Dùng cho audio clip trên timeline: fromSec = clip.in, toSec = clip.out.
 */
export async function decodeAudioPeaks(
  url: string,
  fromSec: number,
  toSec: number,
  bucketCount: number,
): Promise<PeaksResult> {
  const { channels, sampleRate } = await decodeFile(url);
  const peaks = computePeaksForRange(channels, sampleRate, fromSec, toSec, bucketCount);
  const duration = Math.max(0, Math.min(toSec, channels[0].length / sampleRate) - Math.max(0, fromSec));
  return { peaks, duration, sampleRate };
}

/** Xoá cache decode (hữu ích khi test hoặc khi media bị thay thế). */
export function clearWaveformCache(): void {
  decodeCache.clear();
}
