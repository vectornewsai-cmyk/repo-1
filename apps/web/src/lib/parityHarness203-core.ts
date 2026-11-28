// parityHarness203-core.ts — Phần chung của harness parity đợt 203 P4.
// (Tách từ parityHarness203.ts đợt 203 để mỗi file dưới trần push 37.768 B;
// cùng code, chỉ chia file — coverage/số đo không đổi.)
// Chứa: state dùng chung (results/record), helper thuần (compare/psnr/Goertzel/
// decode/wav), helper drift S1/S2 + verdict N11a + motionMultiplierCap112.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { type ImageDataLike } from "./effectCanvas";
import {
  DENOISE_MOTION_MULTIPLIER_ANCHOR_HIGH,
  DENOISE_MOTION_MULTIPLIER_ANCHOR_LOW,
  DENOISE_MOTION_MULTIPLIER_AT_HIGH,
  DENOISE_MOTION_MULTIPLIER_AT_LOW,
  denoiseBlendAlpha,
} from "./enhancePreview";

export interface CaseResult {
  id: string;
  name: string;
  verdict: "ĐẠT" | "CHƯA ĐẠT" | "GHI NHẬN";
  tier?: string;
  numbers: Record<string, number | string>;
  notes: string;
}

export const results: CaseResult[] = [];
export function record(r: CaseResult): void {
  results.push(r);
  console.log(
    `[${r.verdict === "ĐẠT" ? "ĐẠT " : r.verdict === "GHI NHẬN" ? "GHI " : "CHƯA"}] ${r.id} — ${r.name} | ` +
      Object.entries(r.numbers)
        .map(([k, v]) => `${k}=${typeof v === "number" ? round(v) : v}`)
        .join(" "),
  );
  if (r.notes) console.log(`        ${r.notes}`);
}
export function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Tiện ích chung
// ---------------------------------------------------------------------------
export const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "parity203-"));
export const REPO = "/home/hatch/workspace/repo-1";
export const HIDDEN195 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/parity195");
export const VOICE_MTIME_195 = Date.parse("2026-11-25T20:56:13.047Z"); // previewVoiceFx.ts lúc P4-195 đóng
export const SEEK_MTIME_195 = Date.parse("2026-11-25T21:08:03.687Z"); // reversePlayback.ts lúc P4-195 đóng

export function ff(args: string[], what: string): void {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0)
    throw new Error(`ffmpeg ${what} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
}
export function nodeRequireJs(relJs: string, expr: string): string {
  // Gọi code render thật (CJS) qua child process, trả stdout JSON/string.
  const abs = path.join(REPO, relJs);
  const code = `const m=require(${JSON.stringify(abs)}); const v=(${expr}); process.stdout.write(typeof v==="string"?v:JSON.stringify(v));`;
  const r = spawnSync("node", ["-e", code], { encoding: "utf8" });
  if (r.status !== 0)
    throw new Error(`node require ${relJs} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r.stdout;
}
/** PRNG xác định (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Nhiễu Gauss chuẩn (Box-Muller, PRNG seed cố định). */
export function gauss(rng: () => number): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export function psnrOf(mse: number): number {
  if (mse <= 0) return Number.POSITIVE_INFINITY;
  return 10 * Math.log10((255 * 255) / mse);
}
export interface FrameCmp {
  mad: number;
  mse: number;
  psnr: number;
  le8: number;
  le32: number;
}
export function compareFrames(a: Buffer, b: Buffer, w: number, h: number): FrameCmp {
  let sum = 0;
  let sq = 0;
  let le8 = 0;
  let le32 = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    sum += d;
    sq += d * d;
  }
  for (let p = 0; p < w * h; p++) {
    const d = Math.max(
      Math.abs(a[p * 3] - b[p * 3]),
      Math.abs(a[p * 3 + 1] - b[p * 3 + 1]),
      Math.abs(a[p * 3 + 2] - b[p * 3 + 2]),
    );
    if (d <= 8) le8++;
    if (d <= 32) le32++;
  }
  const mse = sq / a.length;
  return { mad: sum / a.length, mse, psnr: psnrOf(mse), le8: le8 / (w * h), le32: le32 / (w * h) };
}
export function tierOf(m: FrameCmp): string {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
export function patternFrame(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      buf[i] = (x * 4) % 256;
      buf[i + 1] = (y * 5) % 256;
      buf[i + 2] = (x + y * 3) % 256;
    }
  return buf;
}
export function toImg(src: Buffer, w: number, h: number): ImageDataLike {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = src[i * 3];
    data[i * 4 + 1] = src[i * 3 + 1];
    data[i * 4 + 2] = src[i * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}
export function fromImg(im: ImageDataLike, w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = im.data[i * 4];
    buf[i * 3 + 1] = im.data[i * 4 + 1];
    buf[i * 3 + 2] = im.data[i * 4 + 2];
  }
  return buf;
}
/** Blur Gauss tách được σ, biên nhân (khớp ctx.filter blur của canvas ở mức mô hình). */
export function gaussianBlurRgb(src: Buffer, w: number, h: number, sigma: number): Buffer {
  const radius = Math.ceil(sigma * 3);
  const k: number[] = [];
  let ks = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(v);
    ks += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= ks;
  const tmp = new Float64Array(w * h * 3);
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let t = -radius; t <= radius; t++) {
          const xx = Math.min(w - 1, Math.max(0, x + t));
          s += src[(y * w + xx) * 3 + c] * k[t + radius];
        }
        tmp[(y * w + x) * 3 + c] = s;
      }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let t = -radius; t <= radius; t++) {
          const yy = Math.min(h - 1, Math.max(0, y + t));
          s += tmp[(yy * w + x) * 3 + c] * k[t + radius];
        }
        out[(y * w + x) * 3 + c] = Math.max(0, Math.min(255, Math.round(s)));
      }
  return out;
}
/** Composite preview denoise theo đúng mô hình enhancePreview.ts:
 * (1-a)·gốc + a·blur(σ=3px), a = denoiseBlendAlpha(strength) — hoặc
 * alphaOverride khi caller đã tính alpha (vd. đã nhân warm-up). */
export function denoisePreviewComposite(
  src: Buffer,
  w: number,
  h: number,
  strength: number,
  alphaOverride?: number,
): Buffer {
  const a = alphaOverride ?? denoiseBlendAlpha(strength);
  if (a <= 0) return Buffer.from(src);
  // Blur của canvas: ctx.filter blur(3.0px) ≈ Gaussian σ=1.5 (kiểm chứng
  // đợt 191 P2 LIMITS §1: σ=1.5 cho -80% @s=1.0, khớp mốc đợt 63 -82.9%;
  // σ=3.0 cho -90%, xa mốc hơn). Bản harness v1 dùng σ=3.0 là SAI.
  const blurred = gaussianBlurRgb(src, w, h, 1.5);
  const out = Buffer.alloc(src.length);
  for (let i = 0; i < src.length; i++)
    out[i] = Math.max(0, Math.min(255, Math.round((1 - a) * src[i] + a * blurred[i])));
  return out;
}
export function renderYuv444(
  filter: string,
  src: Buffer,
  w: number,
  h: number,
): Buffer {
  const inp = path.join(TMP, "y444-in.raw");
  const out = path.join(TMP, "y444-out.raw");
  fs.writeFileSync(inp, src);
  ff(
    ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", inp, "-vf",
      `scale=out_color_matrix=bt709,format=yuv444p,${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out],
    `yuv444 ${filter}`,
  );
  return fs.readFileSync(out);
}
export function frameAt(buf: Buffer, w: number, h: number, idx: number): Buffer {
  const sz = w * h * 3;
  return Buffer.from(buf.subarray(idx * sz, (idx + 1) * sz));
}

// ---------------------------------------------------------------------------
// Âm thanh: Goertzel + PCM
// ---------------------------------------------------------------------------
export function goertzelMag(samples: Float64Array, sr: number, freq: number): number {
  const n = samples.length;
  const k = Math.round((freq * n) / sr);
  const w = (2 * Math.PI * k) / n;
  const cw = Math.cos(w);
  const coeff = 2 * cw;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return Math.sqrt(Math.max(0, power)) / (n / 2);
}
/** Tìm đỉnh phổ trong [fLo, fHi] (bước step Hz) trên đoạn mẫu cho trước. */
export function spectralPeak(samples: Float64Array, sr: number, fLo: number, fHi: number, step: number): { freq: number; mag: number } {
  let best = { freq: fLo, mag: -1 };
  for (let f = fLo; f <= fHi; f += step) {
    const m = goertzelMag(samples, sr, f);
    if (m > best.mag) best = { freq: f, mag: m };
  }
  return best;
}
/** Decode wav/mono bất kỳ → Float64Array PCM [-1,1] + sample rate (qua ffmpeg). */
export function decodeAudioToPcm(inFile: string): { samples: Float64Array; sr: number } {
  const raw = path.join(TMP, "pcm.raw");
  ff(["-v", "error", "-y", "-i", inFile, "-ac", "1", "-ar", "48000", "-f", "f32le", raw], "decode pcm");
  const buf = fs.readFileSync(raw);
  const samples = new Float64Array(buf.length / 4);
  for (let i = 0; i < samples.length; i++) samples[i] = buf.readFloatLE(i * 4);
  return { samples, sr: 48000 };
}
export function writeSineWav(file: string, freqs: number[], amps: number[], seconds: number, sr = 48000): void {
  // Viết WAV PCM16 mono bằng ffmpeg từ raw f32 (không cần lib ngoài).
  const n = Math.floor(seconds * sr);
  const raw = path.join(TMP, "sine.raw");
  const buf = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let j = 0; j < freqs.length; j++)
      v += amps[j] * Math.sin((2 * Math.PI * freqs[j] * i) / sr);
    buf.writeFloatLE(v, i * 4);
  }
  fs.writeFileSync(raw, buf);
  ff(["-v", "error", "-y", "-f", "f32le", "-ar", String(sr), "-ac", "1", "-i", raw, "-c:a", "pcm_s16le", file], "write sine wav");
}
export function applyAudioFilter(inWav: string, filter: string, outWav: string): void {
  ff(["-v", "error", "-y", "-i", inWav, "-af", filter, "-c:a", "pcm_s16le", outWav], `audio filter ${filter}`);
}
export function rmsWindow(s: Float64Array, sr: number, t0: number, t1: number): number {
  const a = Math.max(0, Math.floor(t0 * sr));
  const b = Math.min(s.length, Math.floor(t1 * sr));
  if (b <= a) return 0;
  let sum = 0;
  for (let i = a; i < b; i++) sum += s[i] * s[i];
  return Math.sqrt(sum / (b - a));
}

// ---------------------------------------------------------------------------
// S1 — P2 sharpen: applySharpen (preview) vs unsharp render (bt709 yuv444p)
// ---------------------------------------------------------------------------
// Helper thuần N11 (exported để test khóa): wrap drift về [−period/2,
// +period/2]; hồi quy tuyến tính y = a + b·x kèm R²; quy tắc stale-peak
// của P3-195 §1.4 (peakHz giống hệt mẫu trước + playhead chạy ≥0,2 s).
export function wrapDrift(d: number, period: number): number {
  let x = d % period;
  if (x > period / 2) x -= period;
  if (x < -period / 2) x += period;
  return x;
}
export function linearFit(xs: number[], ys: number[]): { a: number; b: number; r2: number } {
  const n = xs.length;
  if (n === 0) return { a: 0, b: 0, r2: 0 };
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0, sxy = 0, sst = 0;
  for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); sst += (ys[i] - my) ** 2; }
  const b = sxx === 0 ? 0 : sxy / sxx;
  const a = my - b * mx;
  let sse = 0;
  for (let i = 0; i < n; i++) { const r = ys[i] - (a + b * xs[i]); sse += r * r; }
  return { a, b, r2: sst === 0 ? 1 : 1 - sse / sst };
}
export function isStalePeak(prevPeakHz: number, peakHz: number, prevPh: number, ph: number): boolean {
  // Quy tắc P3 §1.4: peakHz giống hệt mẫu trước + playhead chạy ≥0,2 s.
  // Playhead chỉ có 1 chữ số thập phân (timeText) nên làm tròn hiệu về
  // 0,1 s trước khi so — nếu không 282,3−282,1 = 0,1999… (float) sẽ rớt
  // khỏi ngưỡng 0,2 s dù hiển thị đúng 0,2 s.
  return peakHz === prevPeakHz && Math.round(Math.abs(ph - prevPh) * 10) / 10 >= 0.2;
}
export function isLaggingPeak(prevPeakHz: number, peakHz: number, prevPh: number, ph: number): boolean {
  // Quy tắc S2 (P3-196 §1.4, P4-197 kiểm chứng độc lập từ JSON waveform thô
  // 196 — xem LIMITS P4-197 §2.4): |ΔpeakHz| ≤ 24 Hz (1 bin FFT @48k/2048)
  // trong khi playhead chạy ≥ 0,15 s → analyser LAG (smoothing 0,8 giữ đỉnh
  // cũ), không phải drift thật. Cơ sở vật lý: chirp quét 270 Hz/s nên
  // playhead chạy 0,15 s ⇒ đỉnh thật phải dịch ≥ ~40 Hz; dịch ≤ 24 Hz là
  // không thể với audio thật. Trong HOLD playhead đứng yên nên S2 không lọc
  // mất drift freeze thật. Ngưỡng 0,15 s an toàn float: Δph chỉ lấy giá trị
  // bội 0,1 s (timeText 1 chữ số thập phân) nên không có trường hợp 0,15
  // đúng biên; mẫu Δph = 0,2 s (float 0,1999…) vẫn ≥ 0,15.
  return Math.abs(peakHz - prevPeakHz) <= 24 && Math.abs(ph - prevPh) >= 0.15;
}
// Verdict N11a đợt 203 theo quyết (a5)-202 (parent, aggregate 202 §14.2):
// thước max S2 đứng; ngoại lệ ĐÃ SỬA: đúng 1 CỤM mẫu vượt liên tiếp cùng
// playhead trong pass = 1 sự kiện — BỎ yêu cầu "cụm ở đầu pass" của
// (a5)-201 (yêu cầu đó không phân biệt được drift thật với tick kẹt đơn lẻ;
// longA-201: 32 mẫu, 1 cụm, cùng playhead 300,3 s, bắt đầu idxInPass 10 →
// ĐẠT theo bản chất, quyết (a5)-202; longA-200: 4 mẫu idxInPass 0–3, cùng
// playhead 300,4 s → ĐẠT đứng). Cụm = các mẫu vượt liên tiếp nhau theo
// idxInPass, không có mẫu trong bar xen giữa; firstClusterSamePlayhead =
// mọi mẫu của cụm đầu cùng 1 playhead (làm tròn 0,1 s). firstClusterAtStart
// chỉ còn để ghi chú, KHÔNG dùng trong verdict. Tham số mặc định giữ tương
// thích luật cũ (1 mẫu = 1 cụm; 1 mẫu thì cùng-playhead là hiển nhiên).
export function n11aVerdict203(maxS2: number, overBarCount: number, firstOnlyOverBar: boolean, clusterCount: number = overBarCount, _firstClusterAtStart: boolean = firstOnlyOverBar, firstClusterSamePlayhead: boolean = false): "ĐẠT" | "CHƯA ĐẠT" {
  if (maxS2 <= 0.5) return "ĐẠT";
  if (clusterCount === 1 && (overBarCount <= 1 || firstClusterSamePlayhead)) return "ĐẠT";
  return "CHƯA ĐẠT";
}
// Đợt 202 (quyết (a1)-201): tính lại m(M) với kẹp TRÊN CŨ 1,12 để đối chiếu
// hồi quy với đường ship cap 1,05. Công thức tuyến tính theo neo P2
// (xem enhancePreview.ts): m = 1,0 + (M − 7,194)/(13,803 − 7,194) × 0,08.
// Thuần; không đọc code ship (đã đổi sang 1,05) nên không lẫn.
export function motionMultiplierCap112(motion: number): number {
  if (typeof motion !== "number" || !Number.isFinite(motion)) return 1;
  const m =
    DENOISE_MOTION_MULTIPLIER_AT_LOW +
    ((motion - DENOISE_MOTION_MULTIPLIER_ANCHOR_LOW) /
      (DENOISE_MOTION_MULTIPLIER_ANCHOR_HIGH - DENOISE_MOTION_MULTIPLIER_ANCHOR_LOW)) *
      (DENOISE_MOTION_MULTIPLIER_AT_HIGH - DENOISE_MOTION_MULTIPLIER_AT_LOW);
  return Math.min(1.12, Math.max(1.0, m));
}
export interface HeadedVoiceJson {
  generatedAt?: string;
  telephone?: { freqs: number[]; previewDb: number[] };
  pitch?: Array<{ f0: number; nSemi: number; domFreq: number; errSt: number; amDepth: number; sidebandRatio: number }>;
  error?: string;
}
