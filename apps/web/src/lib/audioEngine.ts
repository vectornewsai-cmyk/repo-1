/**
 * audioEngine.ts — Web Audio graph cho preview (R1-063).
 *
 * Mục tiêu: "nghe đúng những gì sẽ xuất" — preview audio phải khớp render worker
 * ở các tham số: volume, fadeIn/fadeOut, volumeKeyframes, track muted, speed.
 *
 * Kiến trúc:
 *   HTMLMediaElement (từ MediaPool, gồm cả <video> cho audio kế thừa)
 *     → MediaElementAudioSourceNode (1 node / 1 element / 1 AudioContext)
 *     → GainNode riêng cho từng element (volume + fade + keyframes + mute)
 *     → master GainNode → AnalyserNode (VU meter) → destination
 *
 * Mỗi frame của vòng lặp preview: preview.tsx tính gain mục tiêu cho từng
 * source đang active rồi gọi engine.update(). Gain được làm mượt bằng
 * setTargetAtTime để không bị "click" khi nhảy giá trị.
 *
 * Fallback trung thực: nếu Web Audio không khả dụng (trình duyệt chặn,
 * AudioContext chưa được mở), update() gán el.volume trực tiếp như code cũ.
 */
import type { KeyframedValue } from "@repo-1/video-spec";
import { interpolateKeyframes } from "@repo-1/video-spec";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Đầu vào tính gain cho 1 clip audio (AudioClip thỏa mãn interface này). */
export interface VolumeEnvelopeInput {
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  duration: number;
  volumeKeyframes?: KeyframedValue;
}

/**
 * Tính gain mục tiêu 0..1 cho 1 clip audio tại `elapsed` giây (tính từ đầu clip).
 *
 * Thứ tự khớp render worker (server/render/src/render.js):
 *   volume → afade in → afade out → (track muted ? 0 : 1)
 * volumeKeyframes (nếu có) GHI ĐÈ volume tĩnh — ngữ nghĩa keyframes.ts.
 */
export function computeClipGain(
  clip: VolumeEnvelopeInput,
  elapsed: number,
  trackMuted: boolean,
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
  if (fadeIn > 0) v *= clamp(el / fadeIn, 0, 1);
  const fadeOut = clip.fadeOut ?? 0;
  if (fadeOut > 0) v *= clamp((clip.duration - el) / fadeOut, 0, 1);
  return clamp(v, 0, 1);
}

/** 1 nguồn audio đang active tại frame hiện tại. */
export interface ActiveAudioSource {
  el: HTMLMediaElement;
  /** Gain mục tiêu 0..1 (đã gồm volume × fades × keyframes × mute). */
  gain: number;
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
  private nodes = new Map<HTMLMediaElement, { gain: GainNode }>();
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
  private nodeFor(el: HTMLMediaElement): { gain: GainNode } | null {
    const hit = this.nodes.get(el);
    if (hit) return hit;
    if (!this.ctx || !this.master) return null;
    try {
      // Mỗi element chỉ được createMediaElementSource 1 lần / 1 context (ném lỗi nếu lặp lại).
      const src = this.ctx.createMediaElementSource(el);
      const gain = this.ctx.createGain();
      gain.gain.value = 1;
      src.connect(gain);
      gain.connect(this.master);
      // Từ đây engine nắm toàn quyền gain — element không tự áp volume/mute nữa
      // (tránh nhân đôi với GainNode).
      el.volume = 1;
      el.muted = false;
      const rec = { gain };
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
   */
  update(sources: ActiveAudioSource[]): void {
    const seen = new Set<HTMLMediaElement>();
    for (const s of sources) {
      if (seen.has(s.el)) continue;
      seen.add(s.el);
      const g = clamp(s.gain, 0, 1);
      const n = this.nodeFor(s.el);
      if (n && this.ctx) {
        n.gain.gain.setTargetAtTime(g, this.ctx.currentTime, GAIN_SMOOTHING_TC);
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
