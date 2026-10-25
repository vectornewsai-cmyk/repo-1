/**
 * audioEngine.ts — Web Audio graph cho preview (R1-063, mở rộng R1-076).
 *
 * Mục tiêu: "nghe đúng những gì sẽ xuất" — preview audio phải khớp render worker
 * ở các tham số: volume, fadeIn/fadeOut (+ đường cong fade P3), volumeKeyframes,
 * track muted, track volume (P3), speed, và (R1-076) audio effects: bass/treble/compressor.
 *
 * Kiến trúc:
 *   HTMLMediaElement (từ MediaPool, gồm cả <video> cho audio kế thừa)
 *     → MediaElementAudioSourceNode (1 node / 1 element / 1 AudioContext)
 *     → BiquadFilterNode lowshelf (bass, ~100Hz — khớp filter `bass` của FFmpeg)
 *     → BiquadFilterNode highshelf (treble, ~3000Hz — khớp filter `treble`)
 *     → DynamicsCompressorNode (compressor — khớp `acompressor`)
 *     → GainNode riêng cho từng element (volume + fade + keyframes + mute)
 *     → master GainNode → AnalyserNode (VU meter) → destination
 *
 * R1-076: reverb và noiseReduction KHÔNG có node Web Audio tương đương
 * (aecho/afftdn là filter FFmpeg) → render-only, ghi rõ trong AUDIOFX_LIMITS.md.
 *
 * Mỗi frame của vòng lặp preview: preview.tsx tính gain mục tiêu cho từng
 * source đang active rồi gọi engine.update(). Gain được làm mượt bằng
 * setTargetAtTime để không bị "click" khi nhảy giá trị.
 *
 * Fallback trung thực: nếu Web Audio không khả dụng (trình duyệt chặn,
 * AudioContext chưa được mở), update() gán el.volume trực tiếp như code cũ.
 */
import type { KeyframedValue, FadeCurve } from "@repo-1/video-spec";
import { interpolateKeyframes } from "@repo-1/video-spec";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Đầu vào tính gain cho 1 clip audio (AudioClip thỏa mãn interface này). */
export interface VolumeEnvelopeInput {
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  fadeInCurve?: FadeCurve;
  fadeOutCurve?: FadeCurve;
  duration: number;
  volumeKeyframes?: KeyframedValue;
}

/** Hệ số fade tại tiến trình p (mirror audiomix.js fadeCurveFactor). */
export function fadeCurveFactor(curve: FadeCurve, p: number): number {
  const c = clamp(p, 0, 1);
  if (curve === "ease-in") return c * c;
  if (curve === "ease-out") return 1 - (1 - c) * (1 - c);
  if (curve === "sine") return Math.sin((c * Math.PI) / 2);
  return c; // linear
}

/**
 * Tính gain mục tiêu cho 1 clip audio tại `elapsed` giây (tính từ đầu clip).
 *
 * Thứ tự khớp render worker (server/render/src/render.js + audiomix.js):
 *   (volumeKeyframes GHI ĐÈ volume tĩnh) × fadeIn(curve) × fadeOut(curve)
 *   × trackVolume → (track muted ? 0 : gain)
 * Clamp về [0, 2] vì track.volume cho phép tới 2 (render cũng không clamp trên 1).
 */
export function computeClipGain(
  clip: VolumeEnvelopeInput,
  elapsed: number,
  trackMuted: boolean,
  trackVolume = 1,
): number {
  if (trackMuted) return 0;
  const el = clamp(elapsed, 0, Math.max(0, clip.duration));
  let v: number;
  const kfs = clip.volumeKeyframes?.keyframes;
  if (kfs && kfs.length > 0) {
    v = interpolateKeyframes(kfs, el);
  } else {
    v = clip.volume ?? 1;
  }
  const fadeIn = clip.fadeIn ?? 0;
  if (fadeIn > 0) v *= fadeCurveFactor(clip.fadeInCurve ?? "linear", el / fadeIn);
  const fadeOut = clip.fadeOut ?? 0;
  if (fadeOut > 0) v *= fadeCurveFactor(clip.fadeOutCurve ?? "linear", (clip.duration - el) / fadeOut);
  return clamp(v * trackVolume, 0, 2);
}

/** 1 nguồn audio đang active tại frame hiện tại. */
export interface ActiveAudioSource {
  el: HTMLMediaElement;
  /** Gain mục tiêu 0..2 (đã gồm volume × fades × keyframes × trackVolume × mute). */
  gain: number;
  /** Hiệu ứng audio cho preview (R1-076) — subset của AudioEffects. */
  fx?: PreviewAudioFx;
}

/**
 * Hiệu ứng audio mà preview (Web Audio) hỗ trợ (R1-076).
 * - bass/treble (dB): BiquadFilter lowshelf ~100Hz / highshelf ~3000Hz
 *   (khớp tần số mặc định của filter `bass`/`treble` trong FFmpeg).
 * - compressor: DynamicsCompressorNode (khớp `acompressor`).
 * reverb và noiseReduction không có node tương đương → render-only.
 */
export interface PreviewAudioFx {
  bass?: number;
  treble?: number;
  compressor?: {
    thresholdDb?: number;
    ratio?: number;
    attackMs?: number;
    releaseMs?: number;
  };
}

/**
 * Rút gọn AudioEffects (video-spec) về subset mà preview hỗ trợ.
 * Trả về undefined nếu không có effect nào preview áp dụng được.
 */
export function toPreviewFx(fx?: {
  bass?: number;
  treble?: number;
  compressor?: PreviewAudioFx["compressor"];
  noiseReduction?: number;
  reverb?: number;
}): PreviewAudioFx | undefined {
  if (!fx) return undefined;
  const out: PreviewAudioFx = {};
  if (Math.abs(fx.bass ?? 0) > 1e-9) out.bass = fx.bass;
  if (Math.abs(fx.treble ?? 0) > 1e-9) out.treble = fx.treble;
  if (fx.compressor !== undefined) out.compressor = fx.compressor;
  return Object.keys(out).length > 0 ? out : undefined;
}

export interface AudioEngineOptions {
  /**
   * Factory tạo AudioContext — dùng để inject mock trong test Node.
   * Mặc định: `new AudioContext()` (có fallback webkitAudioContext).
   */
  createContext?: () => AudioContext;
  /**
   * Callback VU meter: rms và peak trong 0..1, đo SAU master gain
   * (phản ánh đúng cái người dùng nghe được). Được throttle ~12Hz.
   */
  onLevel?: (rms: number, peak: number) => void;
}

/** Hằng số thời gian làm mượt gain (giây) — đủ nhanh để theo fade, đủ chậm để không click. */
export const GAIN_SMOOTHING_TC = 0.03;

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    return new AC();
  } catch {
    return null;
  }
}

export class AudioEngine {
  private opts: AudioEngineOptions;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private nodes = new Map<
    HTMLMediaElement,
    { gain: GainNode; low: BiquadFilterNode; high: BiquadFilterNode; comp: DynamicsCompressorNode }
  >();
  private levelBuf: Uint8Array | null = null;
  private lastLevelAt = -1;

  constructor(opts: AudioEngineOptions = {}) {
    this.opts = opts;
  }

  /** Graph đã sẵn sàng chưa. */
  get isReady(): boolean {
    return this.ctx !== null && this.master !== null;
  }

  /**
   * Phase 9 (MixerMeter): AnalyserNode của master bus (SAU master gain,
   * TRƯỚC loa — đúng tín hiệu người dùng nghe, tức mix TỔNG của mọi element
   * đang phát trong preview). Null khi graph chưa mở (chưa bấm play lần nào
   * trong phiên — AudioContext chỉ được tạo từ user gesture).
   * Lưu ý: analyser này là mono-mix theo Web Audio (getByteTimeDomainData
   * trả về kênh đã mix), không tách được L/R — xem MARKERS_LIMITS.md.
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Mở AudioContext + dựng graph. PHẢI gọi từ user gesture (nút play)
   * nếu không trình duyệt giữ context ở trạng thái "suspended".
   * Trả về true khi graph sẵn sàng (hoặc đã sẵn sàng từ trước).
   */
  ensure(): boolean {
    if (this.ctx && this.master) {
      if (this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => {
          /* trình duyệt vẫn chặn — chờ gesture tiếp theo */
        });
      }
      return true;
    }
    try {
      this.ctx = this.opts.createContext ? this.opts.createContext() : createAudioContext();
    } catch {
      this.ctx = null;
    }
    if (!this.ctx) return false;
    try {
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      // master → analyser → loa: VU meter đo đúng tín hiệu đầu ra
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
      this.master = null;
      this.analyser = null;
      return false;
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {});
    }
    return true;
  }

  /** Lấy (hoặc tạo) GainNode cho 1 element. Null = không tạo được → dùng fallback. */
  private nodeFor(el: HTMLMediaElement): {
    gain: GainNode;
    low: BiquadFilterNode;
    high: BiquadFilterNode;
    comp: DynamicsCompressorNode;
  } | null {
    const hit = this.nodes.get(el);
    if (hit) return hit;
    if (!this.ctx || !this.master) return null;
    try {
      // Mỗi element chỉ được createMediaElementSource 1 lần / 1 context (ném lỗi nếu lặp lại).
      const src = this.ctx.createMediaElementSource(el);
      // R1-076: chuỗi FX — lowshelf (bass ~100Hz) → highshelf (treble ~3000Hz)
      // → compressor → gain. Mặc định trung tính (không đổi tiếng).
      const low = this.ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 100;
      low.gain.value = 0;
      const high = this.ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 3000;
      high.gain.value = 0;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = 0; // 0 dBFS = không nén (tắt)
      comp.ratio.value = 1; // 1:1 = không nén (tắt)
      const gain = this.ctx.createGain();
      gain.gain.value = 1;
      src.connect(low);
      low.connect(high);
      high.connect(comp);
      comp.connect(gain);
      gain.connect(this.master);
      // Từ đây engine nắm toàn quyền gain — element không tự áp volume/mute nữa
      // (tránh nhân đôi với GainNode).
      el.volume = 1;
      el.muted = false;
      const rec = { gain, low, high, comp };
      this.nodes.set(el, rec);
      return rec;
    } catch {
      return null;
    }
  }

  /**
   * Cập nhật gain cho mọi source đang active. Gọi mỗi frame từ vòng lặp preview.
   * - Có Web Audio: setTargetAtTime (mượt, không click).
   * - Không có Web Audio: fallback gán el.volume trực tiếp (hành vi cũ).
   *
   * R1-076: đồng thời cập nhật tham số FX (bass/treble/compressor) từ s.fx.
   * Cùng 1 element chia sẻ cho nhiều clip → clip active đầu tiên thắng
   * (giới hạn kiến trúc đã ghi trong AUDIOPREVIEW_LIMITS.md).
   */
  update(sources: ActiveAudioSource[]): void {
    const seen = new Set<HTMLMediaElement>();
    for (const s of sources) {
      if (seen.has(s.el)) continue;
      seen.add(s.el);
      const g = clamp(s.gain, 0, 1);
      const n = this.nodeFor(s.el);
      if (n && this.ctx) {
        const t = this.ctx.currentTime;
        n.gain.gain.setTargetAtTime(g, t, GAIN_SMOOTHING_TC);
        // R1-076: FX params — về trung tính khi clip không có effect.
        const fx = s.fx;
        n.low.gain.setTargetAtTime(clamp(fx?.bass ?? 0, -12, 12), t, GAIN_SMOOTHING_TC);
        n.high.gain.setTargetAtTime(clamp(fx?.treble ?? 0, -12, 12), t, GAIN_SMOOTHING_TC);
        const comp = fx?.compressor;
        n.comp.threshold.setTargetAtTime(
          comp ? clamp(comp.thresholdDb ?? -20, -60, 0) : 0,
          t,
          GAIN_SMOOTHING_TC,
        );
        n.comp.ratio.setTargetAtTime(comp ? clamp(comp.ratio ?? 4, 1, 20) : 1, t, GAIN_SMOOTHING_TC);
        n.comp.attack.setTargetAtTime(
          comp ? clamp((comp.attackMs ?? 20) / 1000, 0, 1) : 0.003,
          t,
          GAIN_SMOOTHING_TC,
        );
        n.comp.release.setTargetAtTime(
          comp ? clamp((comp.releaseMs ?? 250) / 1000, 0, 1) : 0.25,
          t,
          GAIN_SMOOTHING_TC,
        );
      } else {
        // Fallback: chưa có graph (ensure() chưa gọi / thất bại).
        try {
          s.el.volume = g;
        } catch {
          /* element chưa sẵn sàng */
        }
      }
    }
    this.pumpLevel();
  }

  /** Âm lượng tổng 0..1. */
  setMasterVolume(v: number): void {
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(clamp(v, 0, 1), this.ctx.currentTime, 0.02);
    }
  }

  /** Đẩy 1 mẫu VU meter tới onLevel (throttle ~12Hz). */
  private pumpLevel(): void {
    if (!this.opts.onLevel || !this.analyser || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.lastLevelAt >= 0 && now - this.lastLevelAt < 1 / 12) return;
    this.lastLevelAt = now;
    if (!this.levelBuf || this.levelBuf.length !== this.analyser.fftSize) {
      this.levelBuf = new Uint8Array(this.analyser.fftSize);
    }
    try {
      this.analyser.getByteTimeDomainData(this.levelBuf);
    } catch {
      return;
    }
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < this.levelBuf.length; i++) {
      const v = (this.levelBuf[i] - 128) / 128;
      sum += v * v;
      const a = Math.abs(v);
      if (a > peak) peak = a;
    }
    const rms = Math.sqrt(sum / this.levelBuf.length);
    this.opts.onLevel(clamp(rms, 0, 1), clamp(peak, 0, 1));
  }

  /** Dọn dẹp: đóng context, quên mọi node. */
  dispose(): void {
    this.nodes.clear();
    this.levelBuf = null;
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.master = null;
    this.analyser = null;
    this.lastLevelAt = -1;
  }
}
