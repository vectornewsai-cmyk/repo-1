// parityHarness201.ts — Harness ĐỘC LẬP đo parity render-vs-preview, đợt 201 P4.
//
// Đo thật, không mock: preview = code TS thật trong repo chạy qua esbuild
// bundle; render = FFmpeg 8.1.2 thật + filter string lấy từ code render thật.
// Fixture tổng hợp xác định (seed cố định) để mọi số tái lập được.
// MỚI đợt 201 (so với 200):
// - N12a GATE MỚI THEO QUYẾT (a4)-199 (parent, aggregate 199 §14.2 — bản đã
//   KHÔI PHỤC 86.880 B; tiền đề (a4)-198 SAI, thước domFreq/errHarm ở −12
//   ĐÃ BỎ): ở −12, gate = CAO ĐỘ AUTOCORR (errSt ≤ 0,1 st) + cao độ wide
//   10/10. Helper xuất ra: psolaAutocorrPitch + n12aGate201 (khóa trong
//   parityHarness201.test.ts). Ở −7/+7/+12 thước mag cũ vẫn đứng
//   (magTarget ≥ 10×magOrig). Tỉ số mag ở −12 chỉ còn là thông tin.
//   Phần wide 10/10 kiểm bằng tái tính độc lập từ JSON headed thô của
//   P1-200 (round200-p4/scratch/wide-rederive-200.mjs), không nằm trong
//   sim lõi này. N12a ĐÃ ĐẠT theo thước mới ở đợt 199 (parent quyết) —
//   harness 200 đo LẠI trên code hiện tại, không kế thừa verdict.
// - N11a/N11b chạy lại trên dữ liệu P3-200 (benchmarks/reverse201/ +
//   ~/workspace/tmp-round201-p3/ + hidden_files/round201-p3/ tìm 201
//   TRƯỚC, rồi 200, rồi 199 — dữ liệu NHIỆM VỤ đợt này là P3-200).
//   Verdict N11a theo quyết (a5)-200: longB ĐẢO QUYẾT thành ĐẠT — cờ
//   parent_hold_199_longB ĐÃ GỠ (xem F-200-P4-1 + (a5)-200); longA ĐẠT
//   theo tiền lệ (chỉ 1 mẫu vượt = mẫu sounding đầu tiên của pass).
//   Helper xuất ra: n11aVerdict201 (khóa trong test). Sửa F-199-P4-3:
//   ghi chú cap chỉ ghi "đã kích hoạt" khi holdCapStop_end > 0.
// - MỚI: thước R_rel theo σ (nợ (a1)-199): sectionRrelSigma201 đo độc lập
//   R_rel ở σ=5/10/15 trên cùng fixture N5b (pipeline α thích nghi) —
//   GHI NHẬN, không verdict (bar 0,15 KHÔNG đổi đợt này, quyết (a1)-199).
// - N10/N5b chạy lại tươi trên code enhancePreview hiện tại (pipeline α thích
//   nghi của P2-198); bar R_rel 0,15 VẪN ĐỨNG (quyết (a1)-198: N10 ĐẠT lần đầu đợt 198).
//   Harness NỐI α thích nghi vào N10/N5b bằng ĐÚNG hàm thuần P2 ship
//   (motionEstimateFromBandLuma C5b_box + denoiseMotionMultiplier): α199 =
//   α_cố_định × m(M); đường α cố định giữ làm đối chiếu hồi quy.
//   (Tên biến/khóa số *199 giữ nguyên theo lineage pipeline P2-198 đã kiểm
//   ở đợt 199 — để so trực tiếp được giữa các đợt, không phải số cũ.)
// - N11a dùng quy tắc lọc S2 làm thước CHÍNH (quyết (a4)-197). Chirp-70s
//   KHÔNG là fixture bar N11a (quyết (a4)-196: bin 0,611 s > bar 0,5 s).
// Hồi quy: toàn bộ record đợt 200 chạy lại; headed voice/seek dùng
// JSON 201 khi có, nếu chưa có thì GHI NHẬN, không verdict từ số cũ
// (code voice đã đổi sang PSOLA từ 196; dữ liệu WSOLA 195 hết hiệu lực).
// // Fixture denoise giữ nguyên seed đợt 191 (19100+f) để so trực tiếp được.
//
// Chạy (từ gốc repo, xem scripts/parity201-run.mjs):
//   ./node_modules/.bin/esbuild apps/web/src/lib/parityHarness201.ts \
//     --bundle --format=esm --platform=node \
//     --outfile=/tmp/parity201/harness.mjs && node /tmp/parity201/harness.mjs
//
// Tiêu chí pixel (theo harness V6 / effectCanvas.parity.test.ts):
//   KHỚP    = MAD <= 2   và >= 99% pixel lệch <= 8 (mỗi kênh, max)
//   XẤP XỈ  = MAD <= 20  và >= 90% pixel lệch <= 32
//   CHƯA ĐẠT = ngoài 2 band trên.
// Verdict từng mục: ĐẠT / CHƯA ĐẠT (ghi rõ tier đạt được).
// Âm thanh: đo bằng Goertzel trên PCM thật (không nghe bằng tai).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { applyNoise, applySharpen, type ImageDataLike } from "./effectCanvas";
import {
  deintBobFieldForOutputFrame,
  deintVerticalBlendWeight,
  denoiseAdaptiveK,
  denoiseBlendAlpha,
  denoiseMotionMultiplier,
  denoiseWarmupFactor,
  ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR,
  enhancePreviewPlan,
  estimateNoiseSigmaFromRgba,
  motionBandLumaFromRgba,
  motionEstimateFromBandLuma,
} from "./enhancePreview";
import { PITCH_WINDOW_S, SAW_GAIN_COMP, TELEPHONE_WET_GAIN_COMP } from "./previewVoiceFx";
import { psolaPitchShift, semitoneRatio } from "./psola";
import { sourceTimeAt } from "../../../../packages/video-spec/src/speed";
import {
  resolveDecodeAheadGate,
  resolveProxyMainDirection,
} from "./reversePreviewGate";
import { reversePlayhead, reverseScrubSeekTarget, reverseStep } from "./reversePlayback";
import {
  MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
  REVERSED_AUDIO_CROSSFADE_SEC,
  REVERSED_AUDIO_WINDOW_SEC,
  ReverseAudioPlayer,
  reversedSampleOffset,
  reversedSegmentWindow,
  reverseFloat32Channel,
} from "./reverseAudio";
import { ReverseCadenceTracker, summarizeIntervals } from "./reverseCadence";

export interface CaseResult {
  id: string;
  name: string;
  verdict: "ĐẠT" | "CHƯA ĐẠT" | "GHI NHẬN";
  tier?: string;
  numbers: Record<string, number | string>;
  notes: string;
}

const results: CaseResult[] = [];
function record(r: CaseResult): void {
  results.push(r);
  console.log(
    `[${r.verdict === "ĐẠT" ? "ĐẠT " : "CHƯA"}] ${r.id} — ${r.name} | ` +
      Object.entries(r.numbers)
        .map(([k, v]) => `${k}=${typeof v === "number" ? round(v) : v}`)
        .join(" "),
  );
  if (r.notes) console.log(`        ${r.notes}`);
}
function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Tiện ích chung
// ---------------------------------------------------------------------------
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "parity201-"));
const REPO = "/home/hatch/workspace/repo-1";
const HIDDEN195 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/parity195");
const VOICE_MTIME_195 = Date.parse("2026-11-25T20:56:13.047Z"); // previewVoiceFx.ts lúc P4-195 đóng
const SEEK_MTIME_195 = Date.parse("2026-11-25T21:08:03.687Z"); // reversePlayback.ts lúc P4-195 đóng

function ff(args: string[], what: string): void {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0)
    throw new Error(`ffmpeg ${what} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
}
function nodeRequireJs(relJs: string, expr: string): string {
  // Gọi code render thật (CJS) qua child process, trả stdout JSON/string.
  const abs = path.join(REPO, relJs);
  const code = `const m=require(${JSON.stringify(abs)}); const v=(${expr}); process.stdout.write(typeof v==="string"?v:JSON.stringify(v));`;
  const r = spawnSync("node", ["-e", code], { encoding: "utf8" });
  if (r.status !== 0)
    throw new Error(`node require ${relJs} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r.stdout;
}
/** PRNG xác định (mulberry32). */
function mulberry32(seed: number): () => number {
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
function gauss(rng: () => number): number {
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
function tierOf(m: FrameCmp): string {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le32 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}
function patternFrame(w: number, h: number): Buffer {
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
function toImg(src: Buffer, w: number, h: number): ImageDataLike {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = src[i * 3];
    data[i * 4 + 1] = src[i * 3 + 1];
    data[i * 4 + 2] = src[i * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}
function fromImg(im: ImageDataLike, w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    buf[i * 3] = im.data[i * 4];
    buf[i * 3 + 1] = im.data[i * 4 + 1];
    buf[i * 3 + 2] = im.data[i * 4 + 2];
  }
  return buf;
}
/** Blur Gauss tách được σ, biên nhân (khớp ctx.filter blur của canvas ở mức mô hình). */
function gaussianBlurRgb(src: Buffer, w: number, h: number, sigma: number): Buffer {
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
function denoisePreviewComposite(
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
function renderYuv444(
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
function frameAt(buf: Buffer, w: number, h: number, idx: number): Buffer {
  const sz = w * h * 3;
  return Buffer.from(buf.subarray(idx * sz, (idx + 1) * sz));
}

// ---------------------------------------------------------------------------
// Âm thanh: Goertzel + PCM
// ---------------------------------------------------------------------------
function goertzelMag(samples: Float64Array, sr: number, freq: number): number {
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
function spectralPeak(samples: Float64Array, sr: number, fLo: number, fHi: number, step: number): { freq: number; mag: number } {
  let best = { freq: fLo, mag: -1 };
  for (let f = fLo; f <= fHi; f += step) {
    const m = goertzelMag(samples, sr, f);
    if (m > best.mag) best = { freq: f, mag: m };
  }
  return best;
}
/** Decode wav/mono bất kỳ → Float64Array PCM [-1,1] + sample rate (qua ffmpeg). */
function decodeAudioToPcm(inFile: string): { samples: Float64Array; sr: number } {
  const raw = path.join(TMP, "pcm.raw");
  ff(["-v", "error", "-y", "-i", inFile, "-ac", "1", "-ar", "48000", "-f", "f32le", raw], "decode pcm");
  const buf = fs.readFileSync(raw);
  const samples = new Float64Array(buf.length / 4);
  for (let i = 0; i < samples.length; i++) samples[i] = buf.readFloatLE(i * 4);
  return { samples, sr: 48000 };
}
function writeSineWav(file: string, freqs: number[], amps: number[], seconds: number, sr = 48000): void {
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
function applyAudioFilter(inWav: string, filter: string, outWav: string): void {
  ff(["-v", "error", "-y", "-i", inWav, "-af", filter, "-c:a", "pcm_s16le", outWav], `audio filter ${filter}`);
}
function rmsWindow(s: Float64Array, sr: number, t0: number, t1: number): number {
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
function sectionSharpen(): void {
  console.log("== S1 sharpen (P2) — preview applySharpen vs render unsharp bt709 ==");
  const w = 72;
  const h = 45;
  const src = patternFrame(w, h);
  for (const [t, amount] of [[0.5, 1.1], [1, 2.0]] as const) {
    const filter = nodeRequireJs(
      "server/render/src/effects.js",
      `m.buildEffectFilter({type:"sharpen",intensity:${t}})`,
    );
    const ffOut = renderYuv444(filter, src, w, h);
    const prev = fromImg(applySharpen(toImg(src, w, h), t), w, h);
    const m = compareFrames(ffOut, prev, w, h);
    const tier = tierOf(m);
    record({
      id: `S1-sharpen-t${t}`,
      name: `sharpen t=${t} — preview vs render ${filter}`,
      verdict: tier === "KHỚP" ? "ĐẠT" : "CHƯA ĐẠT",
      tier,
      numbers: { MAD: m.mad, PSNR: m.psnr === Infinity ? "inf" : m.psnr, le8_pct: m.le8 * 100, le32_pct: m.le32 * 100, renderAmount: amount },
      notes: `Tiêu chí KHỚP: MAD<=2 & le8>=99%. Filter render lấy từ effects.js thật: ${filter}.`,
    });
  }
}

// ---------------------------------------------------------------------------
// S2 — P2 denoise: composite preview (blend alpha + blur σ=3) vs hqdn3d render
// ---------------------------------------------------------------------------
function sectionDenoise(): void {
  console.log("== S2 denoise (P2) — preview blend vs render hqdn3d (fixture YUV như footage thật) ==");
  const w = 320;
  const h = 180;
  const sigmaNoise = 15;
  const NFRAMES = 30;
  // Fixture: 30 frame phẳng 128 + nhiễu Gauss độc lập mỗi frame, sinh ở
  // RGB rồi chuyển 1 lần sang yuv420p bt709 = "footage". Cả 2 phía xuất
  // phát từ CÙNG footage này (như sản phẩm thật: nguồn đã là yuv420p):
  //  - render: footage yuv420p → hqdn3d → rgb24 (hqdn3d chạy trên yuv,
  //    không có roundtrip rgb→yuv thừa như bản harness v1 — bản đó đo
  //    render -33% @s=0.3, sai so với -18.5% của P2 vì nhiễu chroma bị
  //    subsampling làm loãng thêm một lần).
  //  - preview: decode footage → rgb24 rồi blend (1-a)·gốc + a·blur σ=1.5.
  // % giảm nhiễu đo trên plane Y (theo P2 LIMITS §1) + MAD/PSNR trên RGB.
  // Khổ 320×180 như probe P2 để so trực tiếp được với bảng P2 §2.1/§2.2.
  const rgbFrames: Buffer[] = [];
  for (let f = 0; f < NFRAMES; f++) {
    const rng = mulberry32(19100 + f);
    const buf = Buffer.alloc(w * h * 3);
    for (let i = 0; i < buf.length; i++)
      buf[i] = Math.max(0, Math.min(255, Math.round(128 + sigmaNoise * gauss(rng))));
    rgbFrames.push(buf);
  }
  const rgbIn = path.join(TMP, "dn-rgb.raw");
  const yuvFoot = path.join(TMP, "dn-foot.yuv");
  fs.writeFileSync(rgbIn, Buffer.concat(rgbFrames));
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
    "-i", rgbIn, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
    "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvFoot], "rgb->yuv footage");
  const decRgb = path.join(TMP, "dn-dec.raw");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", yuvFoot, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
    "-f", "rawvideo", "-pix_fmt", "rgb24", decRgb], "yuv->rgb decode");
  const decAll = fs.readFileSync(decRgb);
  const dec = (f: number): Buffer => frameAt(decAll, w, h, f);
  const renderSeq = (filter: string): Buffer => {
    const out = path.join(TMP, "dn-out.raw");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", yuvFoot, "-vf", `${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", out], `hqdn3d ${filter}`);
    return fs.readFileSync(out);
  };
  const yStd = (x: Buffer): number => {
    const n = w * h;
    let mean = 0;
    for (let i = 0; i < n; i++) mean += 0.2126 * x[i * 3] + 0.7152 * x[i * 3 + 1] + 0.0722 * x[i * 3 + 2];
    mean /= n;
    let s2 = 0;
    for (let i = 0; i < n; i++) {
      const d = 0.2126 * x[i * 3] + 0.7152 * x[i * 3 + 1] + 0.0722 * x[i * 3 + 2] - mean;
      s2 += d * d;
    }
    return Math.sqrt(s2 / n);
  };
  const steadyIdx = 8; // frame 8 như bảng P2 §2.1 (frame 8+ = ổn định)
  for (const s of [0.3, 0.5, 0.8, 1.0]) {
    const filter = nodeRequireJs(
      "server/render/src/enhance.js",
      `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
    ).replace(/^,/, "");
    const renderAll = renderSeq(filter);
    const renderMid = frameAt(renderAll, w, h, steadyIdx);
    const prev = denoisePreviewComposite(dec(steadyIdx), w, h, s);
    const yIn = yStd(dec(steadyIdx));
    const redY = (x: Buffer) => (1 - yStd(x) / yIn) * 100;
    const mA = compareFrames(renderMid, prev, w, h);
    const tierA = tierOf(mA);
    record({
      id: `S2-denoise-s${s}`,
      name: `denoise s=${s} — preview blend (alpha=${round(denoiseBlendAlpha(s))}, blur σ=1.5) vs hqdn3d ${filter} (frame 8, fixture YUV 320×180)`,
      verdict: tierA === "KHỚP" || tierA === "XẤP XỈ" ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierA,
      numbers: {
        MAD_frame8: mA.mad, PSNR_frame8: mA.psnr === Infinity ? "inf" : mA.psnr,
        le8_frame8_pct: mA.le8 * 100, le32_frame8_pct: mA.le32 * 100,
        reduceY_render_pct: redY(renderMid), reduceY_preview_pct: redY(prev),
        deltaY_pts: redY(prev) - redY(renderMid),
        srcY_std: yIn,
        alpha: denoiseBlendAlpha(s),
      },
      notes: `Mục tiêu P2 §2.1 (cùng phương pháp): render -18.5/-44.8/-71.1/-78.9%, preview -18.1/-43.7/-70.3/-80.0% (sai ≤1.1 điểm). Verdict theo tier MAD (XẤP XỈ kỳ vọng — preview là xấp xỉ không gian).`,
    });
  }
  // Warm-up (đợt 191 P2): 3 frame đầu clip — alpha nhân denoiseWarmupFactor,
  // đo trên ĐÚNG frame render 0/1/2 của cùng chuỗi 30f (không render lại).
  // Đợt 192 N3: đo thêm frame 3 (hết warm-up, alpha đầy đủ) — P2-191 ghi
  // frame 3 s=0.8 còn sai -5.4 điểm (hồi quy tuyến tính), frame ≥3 khác ≤1.1.
  // Đợt 193 P2 (LIMITS §1.4): warm-up THÍCH NGHI — S2 PHẢI truyền σ̂ ước
  // lượng của fixture làm đối số thứ 6 của enhancePreviewPlan (không truyền
  // = đo hành vi cũ k=1). σ̂ đo bằng đúng estimator P2 dùng trong preview
  // (estimateNoiseSigmaFromRgba trên RGBA của frame giải mã). Fixture σ=15
  // của P4 (Y-std 11,23) → σ̂≈11,2 → k(0,5; 11,2)≈0,63 → S2-warmup-s0.5
  // dự kiến ~0,6–1,5 (đợt 192: +8,82).
  /** σ̂ của một frame RGB24 (đo như preview.tsx: RGBA → estimator của P2). */
  function sigmaHatOf(rgb: Buffer, w: number, h: number): number {
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = rgb[i * 3];
      rgba[i * 4 + 1] = rgb[i * 3 + 1];
      rgba[i * 4 + 2] = rgb[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
    return estimateNoiseSigmaFromRgba(rgba, w, h);
  }
  const frame2noisy: Array<{ s: number; delta: number; mad: number }> = [];
  for (const s of [0.3, 0.5, 0.8, 1.0]) {
    const filter = nodeRequireJs(
      "server/render/src/enhance.js",
      `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
    ).replace(/^,/, "");
    const renderAll = renderSeq(filter);
    const deltas: number[] = [];
    const mads: number[] = [];
    const alphas: number[] = [];
    const sigmas: number[] = [];
    const ks: number[] = [];
    for (let f = 0; f < 3; f++) {
      const sigmaHat = sigmaHatOf(dec(f), w, h);
      const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, f, sigmaHat);
      const prevF = denoisePreviewComposite(dec(f), w, h, s, planF.denoiseBlendAlpha);
      const renderF = frameAt(renderAll, w, h, f);
      const yInF = yStd(dec(f));
      const redYF = (x: Buffer) => (1 - yStd(x) / yInF) * 100;
      deltas.push(redYF(prevF) - redYF(renderF));
      mads.push(compareFrames(renderF, prevF, w, h).mad);
      alphas.push(planF.denoiseBlendAlpha);
      sigmas.push(sigmaHat);
      ks.push(denoiseAdaptiveK(s, sigmaHat));
    }
    frame2noisy.push({ s, delta: deltas[2], mad: mads[2] });
    const maxAbsDelta = Math.max(...deltas.slice(0, 3).map((d) => Math.abs(d)));
    record({
      id: `S2-warmup-s${s}`,
      name: `denoise warm-up s=${s} — preview alpha×warmup vs hqdn3d frame 0/1/2`,
      verdict: maxAbsDelta <= 5.5 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        delta_f0_pts: deltas[0], delta_f1_pts: deltas[1], delta_f2_pts: deltas[2],
        max_abs_delta_pts: maxAbsDelta,
        MAD_f0: mads[0], MAD_f1: mads[1], MAD_f2: mads[2],
        alpha_f0: alphas[0], alpha_f1: alphas[1], alpha_f2: alphas[2],
        warmup_f0: denoiseWarmupFactor(0, s, sigmas[0]), warmup_f1: denoiseWarmupFactor(1, s, sigmas[1]), warmup_f2: denoiseWarmupFactor(2, s, sigmas[2]),
        noiseSigma_f0: sigmas[0], noiseSigma_f1: sigmas[1], noiseSigma_f2: sigmas[2],
        adaptK_f0: ks[0], adaptK_f1: ks[1], adaptK_f2: ks[2],
      },
      notes: `Tiêu chí: |Δ giảm std Y| <= 5.5 điểm ở cả 3 frame đầu — ngưỡng theo mức chấp nhận đã ghi của P2 (LIMITS §2.2/§5.1: sai số còn lại ≤5.4 điểm, tệ nhất frame 3 s=0.8). Không warm-up, preview overstate +13..+51 điểm ở frame đầu (comment enhancePreview.ts). Đợt 193: đo với σ̂ thích nghi (P2-193 §1.4) — σ̂ đo bằng estimator của P2 trên frame giải mã; không truyền σ̂ = đo hành vi cũ.`,
    });
  }
  // N3 bổ sung — fixture flat15-like (hiệu chuẩn của P2): cùng generator
  // nhưng sigmaNoise=11 → Y-std ≈ 8.25 như flat15 của P2 (fixture σ=15
  // trên có Y-std 11.23 ≈ flat20; P2-192 §1.4: warm-up bậc 2 chỉ hiệu
  // chuẩn trên flat15, trên flat20 sai tới +16.5). ĐO f=0..3 (P2 đếm
  // frame 1-based: "frame 3" của P2 là f=2 — warm-up chỉ áp f=0,1,2;
  // bản N3 đầu đo f=3 là SAI khung, đã sửa — xem F-192-P4-4).
  const flat15frames: Array<{ s: number; deltas: number[]; mads: number[]; sigmas: number[] }> = [];
  // Đo thêm trên ĐÚNG fixture của P2 (gen.sh: color 0x808080 +
  // noise=alls=15:allf=t, 16f yuv420p) — phân biệt "claim P2 sai" với
  // "fixture flat15-like của P4 khác cấu trúc nhiễu" (xem F-192-P4-4).
  const p2flat15f2: Array<{ s: number; delta: number; mad: number; sigma: number }> = [];
  {
    const sigma15 = 11;
    const rgbFrames15: Buffer[] = [];
    for (let f = 0; f < NFRAMES; f++) {
      const rng = mulberry32(19200 + f);
      const buf = Buffer.alloc(w * h * 3);
      for (let i = 0; i < buf.length; i++)
        buf[i] = Math.max(0, Math.min(255, Math.round(128 + sigma15 * gauss(rng))));
      rgbFrames15.push(buf);
    }
    const rgbIn15 = path.join(TMP, "dn15-rgb.raw");
    const yuvFoot15 = path.join(TMP, "dn15-foot.yuv");
    fs.writeFileSync(rgbIn15, Buffer.concat(rgbFrames15));
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", rgbIn15, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvFoot15], "rgb->yuv footage flat15");
    const decRgb15 = path.join(TMP, "dn15-dec.raw");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", yuvFoot15, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
      "-f", "rawvideo", "-pix_fmt", "rgb24", decRgb15], "yuv->rgb decode flat15");
    const decAll15 = fs.readFileSync(decRgb15);
    const dec15 = (f: number): Buffer => frameAt(decAll15, w, h, f);
    const renderSeq15 = (filter: string): Buffer => {
      const out = path.join(TMP, "dn15-out.raw");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", yuvFoot15, "-vf", `${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], `hqdn3d flat15 ${filter}`);
      return fs.readFileSync(out);
    };
    for (const s of [0.3, 0.5, 0.8, 1.0]) {
      const filter = nodeRequireJs(
        "server/render/src/enhance.js",
        `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
      ).replace(/^,/, "");
      const renderAll = renderSeq15(filter);
      const deltas15: number[] = [];
      const mads15: number[] = [];
      const sigmas15: number[] = [];
      for (let f = 0; f < 4; f++) {
        const sigmaHat = sigmaHatOf(dec15(f), w, h);
        const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, f, sigmaHat);
        const prevF = denoisePreviewComposite(dec15(f), w, h, s, planF.denoiseBlendAlpha);
        const renderF = frameAt(renderAll, w, h, f);
        const yInF = yStd(dec15(f));
        const redYF = (x: Buffer) => (1 - yStd(x) / yInF) * 100;
        deltas15.push(redYF(prevF) - redYF(renderF));
        mads15.push(compareFrames(renderF, prevF, w, h).mad);
        sigmas15.push(sigmaHat);
      }
      flat15frames.push({ s, deltas: deltas15, mads: mads15, sigmas: sigmas15 });
    }
    console.log(`   flat15-like fixture: Y-std frame2=${yStd(dec15(2)).toFixed(2)} frame3=${yStd(dec15(3)).toFixed(2)} (P2 flat15: 8.25)`);
    // Fixture đúng của P2 (gen.sh round192-p2): color 0x808080 +
    // noise=alls=15:allf=t, 16 frame. Chỉ đo f=2 (frame 3 của P2).
    {
      const seqYuv = path.join(TMP, "p2flat15seq.yuv");
      ff(["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x808080:s=320x180:r=30:d=16",
        "-vf", "noise=alls=15:allf=t,format=yuv420p", "-frames:v", "16", seqYuv], "P2 flat15seq");
      const decP2 = path.join(TMP, "p2flat15-dec.raw");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", seqYuv, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
        "-f", "rawvideo", "-pix_fmt", "rgb24", decP2], "P2 flat15 decode");
      const decAllP2 = fs.readFileSync(decP2);
      const decP2f = (f: number): Buffer => frameAt(decAllP2, w, h, f);
      const yInP2 = yStd(decP2f(2));
      const renderSeqP2 = (filter: string): Buffer => {
        const out = path.join(TMP, "p2flat15-out.raw");
        ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
          "-i", seqYuv, "-vf", `${filter},scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
          "-f", "rawvideo", "-pix_fmt", "rgb24", out], `hqdn3d P2flat15 ${filter}`);
        return fs.readFileSync(out);
      };
      for (const s of [0.3, 0.5, 0.8, 1.0]) {
        const filter = nodeRequireJs(
          "server/render/src/enhance.js",
          `m.buildEnhancePostChain({denoise:{strength:${s}}})`,
        ).replace(/^,/, "");
        const renderAll = renderSeqP2(filter);
        const sigmaHatP2 = sigmaHatOf(decP2f(2), w, h);
        const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, 2, sigmaHatP2);
        const prevF = denoisePreviewComposite(decP2f(2), w, h, s, planF.denoiseBlendAlpha);
        const renderF = frameAt(renderAll, w, h, 2);
        const redYF = (x: Buffer) => (1 - yStd(x) / yInP2) * 100;
        p2flat15f2.push({ s, delta: redYF(prevF) - redYF(renderF), mad: compareFrames(renderF, prevF, w, h).mad, sigma: sigmaHatP2 });
      }
      console.log(`   P2 flat15seq (gen.sh): Y-std frame2=${yInP2.toFixed(2)} (P2: 8.25)`);
    }
  }
  // N3 — denoise "frame 3" của P2 = f=2 (đếm 1-based; warm-up chỉ áp
  // f=0,1,2). Verdict theo ĐÚNG fixture của P2 (flat15seq, gen.sh);
  // flat15-like (Gauss RGB) + f=3 + fixture σ=15 chỉ là hàng phụ.
  {
    const d08 = p2flat15f2.find((r) => r.s === 0.8)?.delta ?? NaN;
    const maxAbs = Math.max(...p2flat15f2.map((r) => Math.abs(r.delta)));
    const maxAbsLike = Math.max(...flat15frames.map((r) => Math.abs(r.deltas[2])));
    const maxAbsF3 = Math.max(...flat15frames.map((r) => Math.abs(r.deltas[3])));
    const maxAbsNoisyF2 = Math.max(...frame2noisy.map((r) => Math.abs(r.delta)));
    record({
      id: "N3-denoise-frame3",
      name: "denoise frame 3 (P2: f=2) — preview blend vs hqdn3d (s=0.3/0.5/0.8/1.0)",
      verdict: Math.abs(d08) <= 2 && maxAbs <= 5.5 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        p2flat15_delta_f2_s03_pts: p2flat15f2[0].delta, p2flat15_delta_f2_s05_pts: p2flat15f2[1].delta,
        p2flat15_delta_f2_s08_pts: p2flat15f2[2].delta, p2flat15_delta_f2_s10_pts: p2flat15f2[3].delta,
        p2flat15_max_abs_delta_f2_pts: maxAbs,
        p2flat15_MAD_f2_s08: p2flat15f2[2].mad,
        p2flat15_noiseSigma_f2: p2flat15f2[0].sigma,
        flat15_noiseSigma_f2_s05: flat15frames[1].sigmas[2],
        flat15_delta_f2_s03_pts: flat15frames[0].deltas[2], flat15_delta_f2_s05_pts: flat15frames[1].deltas[2],
        flat15_delta_f2_s08_pts: flat15frames[2].deltas[2], flat15_delta_f2_s10_pts: flat15frames[3].deltas[2],
        flat15_max_abs_delta_f2_pts: maxAbsLike,
        flat15_MAD_f2_s08: flat15frames[2].mads[2],
        flat15_delta_f3_s03_pts: flat15frames[0].deltas[3], flat15_delta_f3_s05_pts: flat15frames[1].deltas[3],
        flat15_delta_f3_s08_pts: flat15frames[2].deltas[3], flat15_delta_f3_s10_pts: flat15frames[3].deltas[3],
        flat15_max_abs_delta_f3_pts: maxAbsF3,
        noisy_delta_f2_s03_pts: frame2noisy[0].delta, noisy_delta_f2_s05_pts: frame2noisy[1].delta,
        noisy_delta_f2_s08_pts: frame2noisy[2].delta, noisy_delta_f2_s10_pts: frame2noisy[3].delta,
        noisy_max_abs_delta_f2_pts: maxAbsNoisyF2,
      },
      notes: `Baseline P2-192 (LIMITS §1, đo trên flat15seq Y-std 8.25, frame 3 = f=2): s=0.3 -0.3 / s=0.5 +0.2 / s=0.8 -0.8 (trước -5.4) / s=1.0 +0.5 — tệ nhất 1.5 điểm. Tiêu chí ĐẠT (theo ĐÚNG fixture flat15seq của P2, f=2): |Δ s=0.8| ≤ 2 điểm và không s nào vượt 5.5 điểm. Hàng "flat15-like" (Gauss RGB σ=11, Y-std ≈8.28) + f=3 + hàng "noisy" (σ=15, Y-std 11.23 ≈ flat20) chỉ là phụ — P2-192 §1.4 đã ghi trên flat20 f=2: s=0.5 +16.5, s=0.8 +10.0 (bậc 2 tệ hơn tuyến tính tối đa +3.6 ở 1 ô).`,
    });
  }
  // enhancePreviewPlan: cờ applied/notApproximated ở các mốc strength.
  const plan = enhancePreviewPlan({ denoise: { strength: 0.5 } }, true, false, 1.0);
  record({
    id: "S2-plan",
    name: "enhancePreviewPlan denoise s=0.5 — applied/notApproximated",
    verdict: plan.applied.includes("denoise") && plan.denoiseBlendAlpha > 0 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { alpha: plan.denoiseBlendAlpha, blurPx: plan.denoiseBlurPx, zoom: plan.stabilizeZoom },
    notes: `applied=[${plan.applied.join(",")}] notApproximated=[${plan.notApproximated.join(",")}].`,
  });
}

// ---------------------------------------------------------------------------
// S3 — P2 noise effect: applyNoise (preview) vs noise render (yuv420p)
// ---------------------------------------------------------------------------
function channelStats(buf: Buffer, base: number): { std: number[]; kurt: number[]; corr: number[][] } {
  const n = buf.length / 3;
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let i = c; i < buf.length; i += 3) s += buf[i] - base;
    mean[c] = s / n;
  }
  const std = [0, 0, 0];
  const kurt = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let s2 = 0;
    let s4 = 0;
    for (let i = c; i < buf.length; i += 3) {
      const v = buf[i] - base - mean[c];
      s2 += v * v;
      s4 += v * v * v * v;
    }
    std[c] = Math.sqrt(s2 / n);
    kurt[c] = s4 / n / std[c] ** 4 - 3;
  }
  const corr = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += (buf[i * 3 + a] - base - mean[a]) * (buf[i * 3 + b] - base - mean[b]);
      corr[a][b] = s / n / (std[a] * std[b]);
    }
  return { std, kurt, corr };
}
function renderNoiseYuv(alls: number, src: Buffer, w: number, h: number): Buffer {
  const inp = path.join(TMP, "ny-in.raw");
  const yuv = path.join(TMP, "ny-mid.raw");
  const yuvN = path.join(TMP, "ny-n.raw");
  const out = path.join(TMP, "ny-out.raw");
  fs.writeFileSync(inp, src);
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
    "-i", inp, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuv], "rgb->yuv");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", yuv, "-vf", `noise=alls=${alls}:allf=t`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvN], "noise yuv");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", yuvN, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yuv->rgb");
  return fs.readFileSync(out);
}
function sectionNoise(): void {
  console.log("== S3 noise effect (P2) — preview applyNoise vs render noise yuv420p ==");
  const w = 144;
  const h = 90;
  const flat = Buffer.alloc(w * h * 3, 128);
  for (const [intensity, alls] of [[0.5, 28], [1, 50]] as const) {
    const ffOut = renderNoiseYuv(alls, flat, w, h);
    const prev = fromImg(applyNoise(toImg(flat, w, h), intensity, 42), w, h);
    const sR = channelStats(ffOut, 128);
    const sP = channelStats(prev, 128);
    const ratios = sR.std.map((v, i) => sP.std[i] / v);
    const dKurt = sR.kurt.map((v, i) => Math.abs(sP.kurt[i] - v));
    const dCorr = [
      Math.abs(sP.corr[0][1] - sR.corr[0][1]),
      Math.abs(sP.corr[0][2] - sR.corr[0][2]),
      Math.abs(sP.corr[1][2] - sR.corr[1][2]),
    ];
    const guardOK =
      sR.std[0] / sR.std[1] >= 1.4 && sR.std[0] / sR.std[1] <= 1.9 &&
      sR.std[2] / sR.std[1] >= 1.6 && sR.std[2] / sR.std[1] <= 2.1 &&
      sR.corr[1][2] >= 0.15;
    const ok =
      guardOK &&
      ratios.every((r) => r >= 0.85 && r <= 1.18) &&
      dKurt.every((d) => d <= 0.35) &&
      dCorr.every((d) => d <= 0.12);
    record({
      id: `S3-noise-t${intensity}`,
      name: `noise t=${intensity} (alls=${alls}) — thống kê preview vs render yuv420p`,
      verdict: ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        std_ratio_R: ratios[0], std_ratio_G: ratios[1], std_ratio_B: ratios[2],
        max_dKurt: Math.max(...dKurt), max_dCorr: Math.max(...dCorr),
        guard_pipeline_yuv: guardOK ? 1 : 0,
      },
      notes: `Tiêu chí đợt 63 R8: tỉ lệ std [0.85,1.18], |Δkurt|<=0.35, |Δcorr|<=0.12 + guard pipeline YUV. std render=[${sR.std.map((v) => round(v)).join(",")}] preview=[${sP.std.map((v) => round(v)).join(",")}].`,
    });
  }
}

// ---------------------------------------------------------------------------
// S4 — P1 voice RENDER (nền): filter voicefx.js thật qua FFmpeg + Goertzel
// ---------------------------------------------------------------------------
function voiceFilter(voiceJson: string): string {
  const s = nodeRequireJs("server/render/src/voicefx.js", `m.buildVoiceFilters(${voiceJson})`);
  if (!s) throw new Error(`buildVoiceFilters(${voiceJson}) trả "" — không có effect nào bật?`);
  return s.replace(/^,/, "");
}
function sectionVoiceRender(): void {
  console.log("== S4 voice render (P1 nền) — filter voicefx.js thật qua FFmpeg ==");
  // Pitch: sine 440Hz → đỉnh phổ đo được phải ≈ 440 * 2^(n/12).
  const sine = path.join(TMP, "sine440.wav");
  writeSineWav(sine, [440], [0.5], 1.0);
  for (const [n, expected] of [[12, 880], [-12, 220], [7, 440 * Math.pow(2, 7 / 12)]] as const) {
    const f = voiceFilter(JSON.stringify({ pitch: n }));
    const out = path.join(TMP, `pitch${n}.wav`);
    applyAudioFilter(sine, f, out);
    const { samples, sr } = decodeAudioToPcm(out);
    const seg = samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const peak = spectralPeak(seg, sr, Math.max(50, expected * 0.7), expected * 1.4, 2);
    const errPct = ((peak.freq - expected) / expected) * 100;
    record({
      id: `S4-voice-pitch${n > 0 ? "+" : ""}${n}`,
      name: `voice pitch ${n} — render ${f} → đỉnh phổ đo được`,
      verdict: Math.abs(errPct) <= 3 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { expected_Hz: expected, measured_Hz: peak.freq, err_pct: errPct, peak_mag: peak.mag },
      notes: `Tiêu chí: đỉnh phổ trong ±3% của 440×2^(n/12). Chuỗi filter lấy từ voicefx.js thật.`,
    });
  }
  // Robot: sine 440 qua vibrato f=25 d=0.6 → sideband 415/465 phải xuất hiện.
  {
    const f = voiceFilter(JSON.stringify({ robot: { rate: 25, depth: 0.6 } }));
    const out = path.join(TMP, "robot.wav");
    applyAudioFilter(sine, f, out);
    const { samples, sr } = decodeAudioToPcm(out);
    const seg = samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const carrier = goertzelMag(seg, sr, 440);
    const sb = (goertzelMag(seg, sr, 415) + goertzelMag(seg, sr, 465)) / 2;
    const ratio = carrier > 0 ? sb / carrier : 0;
    record({
      id: "S4-voice-robot",
      name: `voice robot — render ${f} → sideband 415/465Hz`,
      verdict: ratio >= 0.05 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { carrier_440: carrier, sideband_avg: sb, sideband_ratio: ratio },
      notes: `Tiêu chí: năng lượng sideband/carrier >= 0.05 (vibrato điều chế thật, không phải sine khô).`,
    });
  }
  // Telephone: đa âm 100/1000/5000/8000Hz → 100 & 5000/8000 bị chặn, 1000 giữ.
  // Tiêu chí theo đúng đáp tuyến filter render (highpass 300 + lowpass 3400,
  // mỗi cái 2 cực Butterworth): ở 100Hz ≈ -19dB đo được; ở 5000Hz (1.47×
  // cutoff) chỉ ≈ -7.8dB — KHÔNG đòi -15dB ở đó (ngưỡng cũ sai filter);
  // ở 8000Hz (2.35× cutoff) ≈ -15dB mới là điểm kiểm dốc lowpass.
  {
    const multi = path.join(TMP, "multi.wav");
    // Amp 0.2/tone (không phải 0.5 như đợt 191): 4 tone × 0.5 có đỉnh tới
    // 2.0 → clip khi ghi pcm_s16le, làm lệch Goertzel ở 100 Hz (đợt 191 đo
    // att100 -21.06 dB, trong khi P1-191/P1-192 đo đơn tone + lý thuyết
    // Butterworth đều cho -19.1 dB = tỉ lệ 0.110). 5 tone × 0.2 ≤ 1.0.
    writeSineWav(multi, [100, 1000, 5000, 8000], [0.2, 0.2, 0.2, 0.2], 1.0);
    const f = voiceFilter(JSON.stringify({ telephone: true }));
    const out = path.join(TMP, "tel.wav");
    applyAudioFilter(multi, f, out);
    const { samples, sr } = decodeAudioToPcm(out);
    const seg = samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const dry = decodeAudioToPcm(multi).samples.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
    const db = (a: number, b: number) => 20 * Math.log10(a / b);
    const att100 = db(goertzelMag(seg, sr, 100), goertzelMag(dry, sr, 100));
    const att1000 = db(goertzelMag(seg, sr, 1000), goertzelMag(dry, sr, 1000));
    const att5000 = db(goertzelMag(seg, sr, 5000), goertzelMag(dry, sr, 5000));
    const att8000 = db(goertzelMag(seg, sr, 8000), goertzelMag(dry, sr, 8000));
    record({
      id: "S4-voice-telephone",
      name: `voice telephone — render ${f} → suy hao theo tần số`,
      verdict: att100 <= -15 && att5000 <= -5 && att8000 <= -12 && Math.abs(att1000) <= 3 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { att_100Hz_dB: att100, att_1000Hz_dB: att1000, att_5000Hz_dB: att5000, att_8000Hz_dB: att8000 },
      notes: `Tiêu chí: 100Hz suy hao >=15dB, 5000Hz >=5dB, 8000Hz >=12dB, 1000Hz giữ trong ±3dB (highpass 300 + lowpass 3400, mỗi cái 2 cực).`,
    });
  }
  // Echo: burst 0.05s tại 0.1s → năng lượng lặp lại ở cửa sổ [0.3,0.4]s.
  {
    const burstRaw = path.join(TMP, "burst.raw");
    const sr = 48000;
    const n = sr;
    const buf = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const on = t >= 0.1 && t < 0.15 ? 0.5 * Math.sin((2 * Math.PI * 440 * i) / sr) : 0;
      buf.writeFloatLE(on, i * 4);
    }
    fs.writeFileSync(burstRaw, buf);
    const burst = path.join(TMP, "burst.wav");
    ff(["-v", "error", "-y", "-f", "f32le", "-ar", "48000", "-ac", "1", "-i", burstRaw, "-c:a", "pcm_s16le", burst], "write burst");
    const f = voiceFilter(JSON.stringify({ echo: { delayMs: 200, decay: 0.5 } }));
    const out = path.join(TMP, "echo.wav");
    applyAudioFilter(burst, f, out);
    const { samples } = decodeAudioToPcm(out);
    const dryRms = rmsWindow(samples, sr, 0.1, 0.15);
    const echoRms = rmsWindow(samples, sr, 0.3, 0.35);
    const ratio = dryRms > 0 ? echoRms / dryRms : 0;
    record({
      id: "S4-voice-echo",
      name: `voice echo — render ${f} → lặp lại sau 200ms`,
      verdict: ratio >= 0.3 && ratio <= 0.7 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { dry_rms: dryRms, echo_rms: echoRms, echo_ratio: ratio },
      notes: `Tiêu chí: RMS cửa sổ echo [0.3,0.35]s / RMS burst gốc ∈ [0.3,0.7] (aecho delay 200ms decay 0.5, in_gain 0.8/out_gain 0.9 → kỳ vọng ≈0.5).`,
    });
  }
  // Chuỗi filter: kiểm tra đúng chuỗi voicefx.js cho preset đầy đủ.
  {
    const s = nodeRequireJs(
      "server/render/src/voicefx.js",
      `m.buildVoiceFilters({pitch:12,robot:{rate:25,depth:0.6},telephone:true,echo:{delayMs:200,decay:0.5}})`,
    );
    const okChain =
      s.includes("rubberband=tempo=1:pitch=2") &&
      s.includes("vibrato=f=25:d=0.6") &&
      s.includes("highpass=f=300") &&
      s.includes("lowpass=f=3400") &&
      s.includes("aecho=") &&
      s.includes("delays=200") &&
      s.includes("decays=0.5");
    record({
      id: "S4-voice-chain",
      name: "voice chain đầy đủ — buildVoiceFilters render",
      verdict: okChain ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { chain_len: s.length },
      notes: `Chuỗi render: ${s}`,
    });
  }
}

// ---------------------------------------------------------------------------
// S5 — P1 voice PREVIEW: P1 đã nối voice vào preview chưa?
// ---------------------------------------------------------------------------
function discoverVoicePreviewModules(): string[] {
  const libDir = path.join(REPO, "apps/web/src/lib");
  const cands: string[] = [];
  for (const f of fs.readdirSync(libDir)) {
    if (!/\.ts$/.test(f) || /\.test\.ts$/.test(f)) continue;
    if (/voice/i.test(f) && !/^clonedVoices/.test(f)) cands.push(path.join(libDir, f));
    if (/195/.test(f) && /voice/i.test(f)) cands.push(path.join(libDir, f));
  }
  return [...new Set(cands)];
}
/** Chạy thử code TS của 1 module voice ứng viên qua esbuild bundle + node:
 * dựng fake AudioContext ghi lại mọi AudioParam, gọi createVoiceChain +
 * setParams(preset đầy đủ / null / pitch -12), trả snapshot tham số node.
 * Đây là THỰC THI code P1 (không phải grep source). */
function probeVoiceModule(file: string): {
  exports: string[];
  full: Record<string, Record<string, number | string>>;
  nullParams: Record<string, Record<string, number | string>>;
  neg12: Record<string, Record<string, number | string>>;
  error?: string;
} {
  const probe = path.join(TMP, "probe-voice.ts");
  const modUrl = JSON.stringify(file);
  fs.writeFileSync(
    probe,
    `import * as m from ${modUrl};\n` +
      `function param() { const p: any = { value: 0, setTargetAtTime(v: number) { p.value = v; }, setValueAtTime(v: number) { p.value = v; }, linearRampToValueAtTime(v: number) { p.value = v; } }; return p; }\n` +
      `function base() { return { connect() {}, disconnect() {} }; }\n` +
      `function gain() { return { ...base(), gain: param() }; }\n` +
      `function delay() { return { ...base(), delayTime: param() }; }\n` +
      `function biquad() { return { ...base(), type: "", frequency: param(), Q: param(), gain: param() }; }\n` +
      `function osc() { return { ...base(), type: "sine", frequency: param(), setPeriodicWave() {}, start() {}, stop() {} }; }\n` +
      `const ctx: any = { currentTime: 0, createGain: gain, createDelay: delay, createBiquadFilter: biquad, createOscillator: osc, createPeriodicWave() { return {}; } };\n` +
      `const out: any = { exports: Object.keys(m) };\n` +
      `if (typeof (m as any).createVoiceChain !== "function") { out.error = "no createVoiceChain export"; console.log(JSON.stringify(out)); }\n` +
      `else {\n` +
      `  const chain: any = (m as any).createVoiceChain(ctx);\n` +
      `  const snap = () => { const o: any = {}; for (const [k, v] of Object.entries(chain.nodes)) { const n: any = v; o[k] = {}; for (const p of ["gain", "delayTime", "frequency", "Q"]) if (n[p]) o[k][p] = n[p].value; if (typeof n.type === "string") o[k].type = n.type; } return o; };\n` +
      `  chain.setParams({ pitch: 12, robot: { rate: 25, depth: 0.6 }, telephone: true, echo: { delayMs: 200, decay: 0.5 } }, 0);\n` +
      `  out.full = snap();\n` +
      `  chain.setParams(null, 0);\n` +
      `  out.nullParams = snap();\n` +
      `  chain.setParams({ pitch: -12 }, 0);\n` +
      `  out.neg12 = snap();\n` +
      `  console.log(JSON.stringify(out));\n` +
      `}\n`,
  );
  const bundled = path.join(TMP, "probe-voice.mjs");
  const b = spawnSync(path.join(REPO, "node_modules/.bin/esbuild"), [probe, "--bundle", "--format=esm", "--platform=node", `--outfile=${bundled}`, "--log-level=error"], { encoding: "utf8" });
  if (b.status !== 0) return { exports: [], full: {}, nullParams: {}, neg12: {}, error: `esbuild: ${(b.stderr || "").slice(0, 300)}` };
  const r = spawnSync("node", [bundled], { encoding: "utf8" });
  if (r.status !== 0) return { exports: [], full: {}, nullParams: {}, neg12: {}, error: `node probe: ${(r.stderr || "").slice(0, 300)}` };
  try {
    return JSON.parse(r.stdout) as {
      exports: string[];
      full: Record<string, Record<string, number | string>>;
      nullParams: Record<string, Record<string, number | string>>;
      neg12: Record<string, Record<string, number | string>>;
      error?: string;
    };
  } catch {
    return { exports: [], full: {}, nullParams: {}, neg12: {}, error: `parse probe output: ${r.stdout.slice(0, 200)}` };
  }
}
function sectionVoicePreview(): void {
  console.log("== S5 voice preview (P1) — voice đã vào preview chain chưa? ==");
  const audioEngineSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/audioEngine.ts"), "utf8");
  const wired =
    audioEngineSrc.includes("createVoiceChain(this.ctx)") &&
    audioEngineSrc.includes("setParams(fx?.voice") &&
    audioEngineSrc.includes("comp.connect(voice.input)");
  const voiceMentions = (audioEngineSrc.match(/voice/gi) || []).length;
  const cands = discoverVoicePreviewModules();
  const detail: string[] = [];
  detail.push(`audioEngine.ts nhắc "voice" ${voiceMentions} lần; nối chain: ${wired ? "CÓ (createVoiceChain + setParams(fx?.voice) + comp→voice→gain)" : "CHƯA"}.`);
  detail.push(cands.length ? `module voice ứng viên: ${cands.map((c) => path.basename(c)).join(", ")}` : "không có module voice* mới nào trong apps/web/src/lib (ngoài clonedVoices).");
  // Kỳ vọng tham số preview (từ voicefx.js render) — SUY RA TỪ HẰNG CODE
  // THẬT (không hardcode W): pitch +12 → LFO |2-1|/W, sawGain ∓(W/2)×
  // SAW_GAIN_COMP; W = PITCH_WINDOW_S (đợt 193 P1: 0,04 → 0,08 — xem
  // F-193-P4-1: kỳ vọng cũ 25 Hz / ∓0,02× là giá trị W=0,04); telWet =
  // TELEPHONE_WET_GAIN_COMP = 0,76 (bù RBJ, parent duyệt §14.2-192 —
  // kỳ vọng cũ 1 là TRƯỚC bù); xfade 0.5/0.5, dry 0; robot 25Hz,
  // delay 0.6×0.0027 = 0.00162s; telephone HP 300/LP 3400 Q 1/√2;
  // echo delay 0.2s, dry 0.8×0.9 = 0.72, wet 0.9×0.5 = 0.45.
  const Q = 1 / Math.SQRT2;
  const checks: Array<{ name: string; got: unknown; want: number | string; tol: number }> = [];
  let probeInfo = "";
  let paramsOk = false;
  for (const c of cands) {
    const probe = probeVoiceModule(c);
    if (probe.error || !probe.full || Object.keys(probe.full).length === 0) {
      probeInfo += ` ${path.basename(c)}: LỖI ${probe.error ?? "không snapshot được"};`;
      continue;
    }
    const F = probe.full;
    const N = probe.nullParams;
    const G = probe.neg12;
    const num = (o: Record<string, Record<string, number | string>> | undefined, node: string, param: string): number =>
      Number(o?.[node]?.[param] ?? NaN);
    const lfo12 = Math.abs(2 - 1) / PITCH_WINDOW_S; // +12: |r-1|/W
    const lfoM12 = Math.abs(0.5 - 1) / PITCH_WINDOW_S; // -12: |r-1|/W
    const sawHalf = (PITCH_WINDOW_S / 2) * SAW_GAIN_COMP;
    checks.push(
      { name: "pitchOscA.freq", got: num(F, "pitchOscA", "frequency"), want: lfo12, tol: 1e-9 },
      { name: "pitchOscB.freq", got: num(F, "pitchOscB", "frequency"), want: lfo12, tol: 1e-9 },
      { name: "pitchOscCos.freq", got: num(F, "pitchOscCos", "frequency"), want: lfo12, tol: 1e-9 },
      { name: "pitchSawGainA", got: num(F, "pitchSawGainA", "gain"), want: -sawHalf, tol: 1e-9 },
      { name: "pitchSawGainB", got: num(F, "pitchSawGainB", "gain"), want: -sawHalf, tol: 1e-9 },
      { name: "pitchXfadeA", got: num(F, "pitchXfadeA", "gain"), want: 0.5, tol: 1e-9 },
      { name: "pitchXfadeB", got: num(F, "pitchXfadeB", "gain"), want: 0.5, tol: 1e-9 },
      { name: "pitchDry(full)", got: num(F, "pitchDry", "gain"), want: 0, tol: 1e-9 },
      { name: "pitchXfadeModA", got: num(F, "pitchXfadeModA", "gain"), want: -0.5, tol: 1e-9 },
      { name: "pitchXfadeModB", got: num(F, "pitchXfadeModB", "gain"), want: 0.5, tol: 1e-9 },
      { name: "robotOsc.freq", got: num(F, "robotOsc", "frequency"), want: 25, tol: 1e-9 },
      { name: "robotDelay.delayTime", got: num(F, "robotDelay", "delayTime"), want: 0.00162, tol: 1e-9 },
      { name: "robotLfoGain", got: num(F, "robotLfoGain", "gain"), want: 0.00162, tol: 1e-9 },
      { name: "robotDry(full)", got: num(F, "robotDry", "gain"), want: 0, tol: 1e-9 },
      { name: "robotWet", got: num(F, "robotWet", "gain"), want: 1, tol: 1e-9 },
      { name: "telHp.freq", got: num(F, "telHp", "frequency"), want: 300, tol: 1e-9 },
      { name: "telHp.Q", got: num(F, "telHp", "Q"), want: Q, tol: 1e-9 },
      { name: "telLp.freq", got: num(F, "telLp", "frequency"), want: 3400, tol: 1e-9 },
      { name: "telLp.Q", got: num(F, "telLp", "Q"), want: Q, tol: 1e-9 },
      { name: "telDry(full)", got: num(F, "telDry", "gain"), want: 0, tol: 1e-9 },
      { name: "telWet", got: num(F, "telWet", "gain"), want: TELEPHONE_WET_GAIN_COMP, tol: 1e-9 },
      { name: "echoDelay.delayTime", got: num(F, "echoDelay", "delayTime"), want: 0.2, tol: 1e-9 },
      { name: "echoDry(full)", got: num(F, "echoDry", "gain"), want: 0.72, tol: 1e-9 },
      { name: "echoWet", got: num(F, "echoWet", "gain"), want: 0.45, tol: 1e-9 },
      { name: "pitchDry(null)", got: num(N, "pitchDry", "gain"), want: 1, tol: 1e-9 },
      { name: "robotDry(null)", got: num(N, "robotDry", "gain"), want: 1, tol: 1e-9 },
      { name: "telDry(null)", got: num(N, "telDry", "gain"), want: 1, tol: 1e-9 },
      { name: "echoDry(null)", got: num(N, "echoDry", "gain"), want: 1, tol: 1e-9 },
      { name: "robotWet(null)", got: num(N, "robotWet", "gain"), want: 0, tol: 1e-9 },
      { name: "telWet(null)", got: num(N, "telWet", "gain"), want: 0, tol: 1e-9 },
      { name: "echoWet(null)", got: num(N, "echoWet", "gain"), want: 0, tol: 1e-9 },
      { name: "pitchOscA.freq(-12)", got: num(G, "pitchOscA", "frequency"), want: lfoM12, tol: 1e-9 },
      { name: "pitchSawGainA(-12)", got: num(G, "pitchSawGainA", "gain"), want: sawHalf, tol: 1e-9 },
    );
    const telHpType = F.telHp?.type;
    const telLpType = F.telLp?.type;
    checks.push(
      { name: "telHp.type", got: telHpType, want: "highpass", tol: 0 },
      { name: "telLp.type", got: telLpType, want: "lowpass", tol: 0 },
    );
    const failed = checks.filter(
      (ch) => typeof ch.got !== "number" || Number.isNaN(ch.got as number)
        ? ch.got !== ch.want
        : Math.abs((ch.got as number) - (ch.want as number)) > ch.tol,
    );
    paramsOk = failed.length === 0;
    probeInfo += ` ${path.basename(c)}: ${checks.length - failed.length}/${checks.length} tham số khớp render` +
      (failed.length ? ` — LỆCH: ${failed.map((f) => `${f.name}=${f.got} (muốn ${f.want})`).join("; ")}` : " — toàn bộ khớp.") +
      ` telHp.type=${telHpType} telLp.type=${telLpType}.`;
  }
  record({
    id: "S5-voice-preview",
    name: "voice → preview: chain preview áp đúng tham số như render + đã nối vào audioEngine",
    verdict: wired && cands.length > 0 && paramsOk ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      audioEngine_voice_mentions: voiceMentions, candidate_modules: cands.length,
      wired: wired ? 1 : 0, params_checked: checks.length,
      params_matched: checks.filter((ch) => typeof ch.got === "number" && !Number.isNaN(ch.got) ? Math.abs(ch.got - (ch.want as number)) <= ch.tol : ch.got === ch.want).length,
    },
    notes: detail.join(" ") + probeInfo +
      ` Tiêu chí ĐẠT: audioEngine nối chain (comp→voice→gain, setParams mỗi frame) + mọi tham số node khớp render (pitch 2^(n/12) qua LFO |r-1|/W, vibrato f/d, HP 300/LP 3400 Q=1/√2, aecho dry 0.72/wet 0.45). Không claim nghe bằng tai — pitch-shifter là xấp xỉ (không phải rubberband phase-vocoder), xem LIMITS §3.`,
  });
}

// ---------------------------------------------------------------------------
// S6 — P3 reverse VIDEO: sourceTimeAt (preview) vs filter reverse (render)
// ---------------------------------------------------------------------------
function indexedFixtureVideo(): { file: string; w: number; h: number; fps: number; frames: number } {
  const w = 160;
  const h = 90;
  const fps = 30;
  const frames = 60;
  const raw = path.join(TMP, "rev-src.raw");
  const chunks: Buffer[] = [];
  for (let k = 0; k < frames; k++) {
    const buf = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3;
        buf[i] = (k * 37 + x * 2) % 256; // mã hoá số frame vào R
        buf[i + 1] = (255 - k * 4 + y) % 256; // ... và G
        buf[i + 2] = (x + y + k * 11) % 256;
      }
    chunks.push(buf);
  }
  fs.writeFileSync(raw, Buffer.concat(chunks));
  const file = path.join(TMP, "rev-src.mkv");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", String(fps),
    "-i", raw, "-c:v", "libx264rgb", "-crf", "0", "-pix_fmt", "rgb24", file], "encode fixture");
  return { file, w, h, fps, frames };
}
function extractFrames(file: string, vf: string): Buffer {
  const out = path.join(TMP, "rev-out.raw");
  const args = ["-v", "error", "-y", "-i", file];
  if (vf) args.push("-vf", vf);
  args.push("-f", "rawvideo", "-pix_fmt", "rgb24", out);
  ff(args, `extract ${vf || "copy"}`);
  return fs.readFileSync(out);
}
function sectionReverseVideo(): void {
  console.log("== S6 reverse video (P3) — sourceTimeAt preview vs filter reverse render ==");
  const { file, w, h, fps, frames } = indexedFixtureVideo();
  const orig = extractFrames(file, "");
  const rev = extractFrames(file, "reverse");
  const clip = { start: 0, in: 0, out: 2, speed: 1, reverse: true } as never;
  // Đối chứng xuôi: mapping không đảo phải cho MAD 0 (khóa harness).
  const fwdClip = { start: 0, in: 0, out: 2, speed: 1, reverse: false } as never;
  {
    let worst = 0;
    for (const t of [0, 0.5, 1.0, 1.5]) {
      const s = sourceTimeAt(fwdClip, t);
      const idx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
      const m = compareFrames(frameAt(orig, w, h, idx), frameAt(orig, w, h, Math.floor(t * fps)), w, h);
      worst = Math.max(worst, m.mad);
    }
    record({
      id: "S6-control-forward",
      name: "đối chứng xuôi: sourceTimeAt (không reverse) khớp frame gốc",
      verdict: worst === 0 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { worst_MAD: worst },
      notes: `Harness tự kiểm: mapping xuôi phải cho MAD đúng 0 trên fixture lossless (libx264rgb crf 0).`,
    });
  }
  // Ngược, lấy mẫu GIỮA frame (S6a — phép so đúng): frame render k phủ
  // output [k/30,(k+1)/30); lấy mẫu tại t=(k+0.5)/30 thì sourceTimeAt cho
  // đúng frame N-1-k. Lấy mẫu đúng biên k/30 (S6b) là quy ước khác — xem dưới.
  let worstMad = 0;
  const perT: string[] = [];
  for (const k of [0, 1, 15, 30, 45, 59]) {
    const t = (k + 0.5) / fps;
    const s = sourceTimeAt(clip, t);
    const srcIdx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
    const expectedIdx = frames - 1 - k; // filter reverse: frame k = nguồn N-1-k
    const m = compareFrames(frameAt(rev, w, h, k), frameAt(orig, w, h, srcIdx), w, h);
    worstMad = Math.max(worstMad, m.mad);
    perT.push(`k=${k} t=${round(t)} srcIdx=${srcIdx} expect=${expectedIdx} MAD=${round(m.mad)}`);
  }
  record({
    id: "S6a-reverse-video-midframe",
    name: "reverse video (giữa frame): frame preview (sourceTimeAt) vs frame render (filter reverse)",
    verdict: worstMad <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
    tier: worstMad <= 2 ? "KHỚP" : tierOf({ mad: worstMad, mse: 0, psnr: 0, le8: 0, le32: 0 }),
    numbers: { worst_MAD: worstMad, n_timestamps: 6 },
    notes: perT.join(" | ") + ` Tiêu chí: MAD<=2 ở mọi mốc (lấy mẫu giữa frame).`,
  });
  // Ngược, lấy mẫu ĐÚNG BIÊN k/30 (S6b — đường seek-stepping thật của
  // preview): preview seek element tới đúng sourceTimeAt(t) = out-k/30,
  // trình duyệt hiện frame floor(s*30) = N-k, trong khi render frame k là
  // nguồn N-1-k. Lệch hệ thống +1 frame ở MỌI biên — đúng đường phát ngược
  // từng bước của preview.tsx (a.el.currentTime = a.target, target từ
  // sourceTimeAt; reversePlayback bước đúng bội số frameDur). Phát xuôi
  // không lệch ở biên vì frame k bắt đầu đúng tại k/30.
  {
    let worstMadB = 0;
    let worstOffB = 0;
    const perTB: string[] = [];
    for (const k of [0, 1, 15, 30, 45, 59]) {
      const t = k / fps;
      const s = sourceTimeAt(clip, t);
      const srcIdx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
      const expectedIdx = frames - 1 - k;
      const off = srcIdx - expectedIdx;
      const m = compareFrames(frameAt(rev, w, h, k), frameAt(orig, w, h, srcIdx), w, h);
      worstMadB = Math.max(worstMadB, m.mad);
      worstOffB = Math.max(worstOffB, off);
      perTB.push(`k=${k} srcIdx=${srcIdx} expect=${expectedIdx} off=${off} MAD=${round(m.mad)}`);
    }
    record({
      id: "S6b-reverse-video-boundary",
      name: "reverse video (đúng biên lưới frame): frame preview vs render — đường seek-stepping",
      verdict: "GHI NHẬN",
      numbers: { worst_MAD: worstMadB, worst_frame_offset: worstOffB, n_timestamps: 6 },
      notes: perTB.join(" | ") + ` GHI NHẬN (KHÔNG VERDICT — theo P4-192 §4.2): check này đo mapping GỐC sourceTimeAt + floor, P3 sửa Ở TẦNG SEEK (reverseSeekTarget: target - 1ms) chứ không sửa sourceTimeAt nên analytic vẫn +1 BY DESIGN; không tính vào tổng. Check quyết định là S6b-headed (seek thật trên Chrome).`,
    });
  }
  // Ngược + speed 2: timeline 1s, t=0.25 → nguồn out - 0.5 = 1.5.
  {
    const clip2 = { start: 0, in: 0, out: 2, speed: 2, reverse: true } as never;
    const s = sourceTimeAt(clip2, 0.25);
    const srcIdx = Math.min(frames - 1, Math.max(0, Math.floor(s * fps)));
    const expectedIdx = 45; // nguồn 1.5s → frame 45
    const outIdx = Math.min(frames - 1, Math.floor(0.25 * fps)); // output frame 7 trong clip 1s
    // Render tương đương: reverse rồi setpts=PTS/2 → frame output 7 = nguồn frame 45.
    const rev2 = extractFrames(file, "reverse,setpts=PTS/2,fps=30");
    const m = compareFrames(frameAt(rev2, w, h, outIdx), frameAt(orig, w, h, srcIdx), w, h);
    record({
      id: "S6-reverse-speed2",
      name: "reverse + speed 2: sourceTimeAt vs render reverse+setpts",
      verdict: Math.abs(srcIdx - expectedIdx) <= 1 && m.mad <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { sourceTime_s: s, srcIdx, expectedIdx, MAD: m.mad },
      notes: `t=0.25s → nguồn ${round(s)}s (frame ${srcIdx}); render frame ${outIdx} sau reverse+setpts=PTS/2.`,
    });
  }
}

// ---------------------------------------------------------------------------
// S7 — P3 reverse AUDIO: areverse render (exact) + preview có đảo audio không
// ---------------------------------------------------------------------------
async function sectionReverseAudio(): Promise<void> {
  console.log("== S7 reverse audio (P3) — areverse render + preview wiring ==");
  const sr = 48000;
  const n = sr; // 1s
  const raw = path.join(TMP, "aramp.raw");
  const buf = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = t; // ramp 0→1: bất đối xứng nên đảo là phát hiện được
    buf.writeFloatLE(0.5 * env * Math.sin((2 * Math.PI * 440 * i) / sr), i * 4);
  }
  fs.writeFileSync(raw, buf);
  const inWav = path.join(TMP, "aramp.wav");
  ff(["-v", "error", "-y", "-f", "f32le", "-ar", "48000", "-ac", "1", "-i", raw, "-c:a", "pcm_s16le", inWav], "write aramp");
  const outWav = path.join(TMP, "aramp-rev.wav");
  applyAudioFilter(inWav, "areverse", outWav);
  const { samples: orig } = decodeAudioToPcm(inWav);
  const { samples: rev } = decodeAudioToPcm(outWav);
  let maxAbs = 0;
  let sumAbs = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(rev[i] - orig[n - 1 - i]);
    maxAbs = Math.max(maxAbs, d);
    sumAbs += d;
  }
  const mad = sumAbs / n;
  record({
    id: "S7-areverse-render",
    name: "areverse render: mẫu đảo phải trùng mẫu gốc đảo thời gian",
    verdict: maxAbs <= 0.002 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { max_abs_diff: maxAbs, mean_abs_diff: mad },
    notes: `Render areverse là đảo mẫu chính xác (ngưỡng 0.002 ≈ 1 LSB 16-bit + làm tròn float).`,
  });
  // S7b — logic đảo audio của P3 (reverseAudio.ts): chạy thật các hàm thuần
  // + player với fake AudioContext (ghi lại lệnh start).
  {
    const ch = new Float32Array([1, 2, 3, 4]);
    const rev = reverseFloat32Channel(ch);
    const inputUnchanged = ch[0] === 1 && ch[3] === 4;
    const revOk = rev[0] === 4 && rev[1] === 3 && rev[2] === 2 && rev[3] === 1;
    const off = reversedSampleOffset({ playheadSec: 0.25, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000 });
    const offOutside = reversedSampleOffset({ playheadSec: 1.5, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000 });
    const offStart = reversedSampleOffset({ playheadSec: 0, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000 });
    const win = reversedSegmentWindow({ playheadSec: 0.25, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000, windowSec: 0.1 });
    const winNull = reversedSegmentWindow({ playheadSec: 0.25, clipStartSec: 0, clipDurationSec: 1, sampleRate: 48000, windowSec: 0 });
    // Player với fake ctx.
    const makeFakeCtx = (durSec: number) => {
      const calls: { startArgs: unknown[] } = { startArgs: [] };
      const buf = {
        numberOfChannels: 1, length: Math.floor(durSec * 48000), sampleRate: 48000, duration: durSec,
        getChannelData: () => {
          const a = new Float32Array(Math.floor(durSec * 48000));
          for (let i = 0; i < a.length; i++) a[i] = i / 48000;
          return a;
        },
      };
      const ctx = {
        sampleRate: 48000, currentTime: 0, state: "running", destination: {},
        decodeAudioData: async () => buf,
        createBuffer: (channels: number, length: number, sampleRate: number) => {
          const chs = Array.from({ length: channels }, () => new Float32Array(length));
          return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (c: number) => chs[c] };
        },
        createBufferSource: () => ({
          buffer: null as unknown, connect() {}, disconnect() {},
          start: (...a: unknown[]) => { calls.startArgs = a; }, stop() {},
        }),
        createGain: () => ({
          gain: { value: 0, setTargetAtTime() {}, linearRampToValueAtTime() {} },
          connect() {}, disconnect() {},
        }),
        resume: async () => {},
      };
      return { ctx: ctx as never, calls };
    };
    const { ctx, calls } = makeFakeCtx(1);
    const player = new ReverseAudioPlayer(ctx);
    const loaded = await player.loadReversed(new ArrayBuffer(8));
    const playOk = loaded && player.playSegment(36000, 0.1);
    const startOffset = calls.startArgs.length >= 2 ? Number(calls.startArgs[1]) : NaN;
    // Đợt 193 P3 — cổng clip dài ĐỔI: loadReversed (không cửa sổ) vẫn
    // từ chối > 60 s, nhưng wiring nay đưa clip 61–600 s sang
    // loadReversedWindow (cửa sổ 30 s) thay vì mute; chỉ > 600 s mới
    // mute. S7b cũ assert "61 s bị từ chối" nay SAI về hành vi người
    // dùng — cập nhật theo thiết kế mới (P3-193 §2.2c, test 192 đã sửa
    // tương tự 61 s → 601 s).
    const { ctx: ctxLong } = makeFakeCtx(61);
    const playerLong = new ReverseAudioPlayer(ctxLong);
    const loadedLongPlain = await playerLong.loadReversed(new ArrayBuffer(8));
    const loadedLongWindowed = await playerLong.loadReversedWindow(new ArrayBuffer(8), 31, REVERSED_AUDIO_WINDOW_SEC);
    const win61Start = playerLong.windowStartSec;
    const win61End = playerLong.windowEndSec;
    const dur61 = playerLong.durationSec;
    const { ctx: ctxTooLong } = makeFakeCtx(601);
    const playerTooLong = new ReverseAudioPlayer(ctxTooLong);
    const loadedTooLongWindowed = await playerTooLong.loadReversedWindow(new ArrayBuffer(8), 571, REVERSED_AUDIO_WINDOW_SEC);
    const logicOk =
      revOk && inputUnchanged && off === 36000 && offOutside === -1 && offStart === 48000 &&
      win !== null && win.startSample === 36000 && win.lengthSamples === 4800 && winNull === null &&
      loaded === true && player.loaded && player.durationSec === 1 && playOk === true &&
      Math.abs(startOffset - 0.75) < 1e-9 &&
      loadedLongPlain === false && loadedLongWindowed === true &&
      Math.abs(win61Start - 31) < 1e-9 && Math.abs(win61End - 61) < 1e-9 && Math.abs(dur61 - 61) < 1e-9 &&
      loadedTooLongWindowed === false;
    record({
      id: "S7b-reverse-audio-logic",
      name: "reverse audio logic (P3): đảo mẫu + offset + player phát đoạn đảo",
      verdict: logicOk ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        reverse_exact: revOk && inputUnchanged ? 1 : 0,
        offset_at_0_25s: off, offset_outside: offOutside, offset_at_0s: offStart,
        window_start: win?.startSample ?? -1, window_len: win?.lengthSamples ?? -1,
        load_1s: loaded ? 1 : 0, play_segment: playOk ? 1 : 0, start_offset_s: startOffset,
        load_61s_plain_rejected: loadedLongPlain ? 0 : 1,
        load_61s_windowed: loadedLongWindowed ? 1 : 0,
        window_61s_start_s: win61Start, window_61s_end_s: win61End, duration_61s_s: dur61,
        load_601s_windowed_rejected: loadedTooLongWindowed ? 0 : 1,
        max_windowed_s: MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
      },
      notes: `Hàm thuần + ReverseAudioPlayer chạy thật với fake ctx (decode 1s ramp → đảo → start offset 0.75s). Đợt 193: clip 61 s KHÔNG còn bị từ chối — load theo cửa sổ 30 s [31,61], durationSec vẫn 61; chỉ clip > ${MAX_REVERSED_AUDIO_WINDOWED_SECONDS} s mới mute. loadReversed (không cửa sổ) vẫn giữ cổng 60 s. Logic ĐẠT ≠ đã nối vào preview (xem S7c) và ≠ crossfade đã kích hoạt headed (xem N7).`,
    });
  }
  // S7c — wiring: ReverseAudioPlayer đã nối vào preview chưa?
  // Đợt 192 P3 nối qua module trung gian reverseAudioWiring.ts (không
  // nhắc trực tiếp ReverseAudioPlayer trong preview.tsx): preview.tsx
  // import + tạo lười ReverseAudioWiring rồi gọi wiring.tick(t, entries)
  // mỗi tick phát ngược; wiring gọi loadReversed + playSegment trên
  // player. Mute element (gain 0 khi phát ngược) CÒN NGUYÊN theo thiết
  // kế — element vẫn paused, tiếng ngược đi qua player với gain GỐC
  // (preview.tsx ~5900-5907) — nên số nhánh mute không còn là tín hiệu
  // lỗi; badge "audio đảo" hiển thị theo wiring.isPlaying (~6575/7732).
  {
    const previewSrc = fs.readFileSync(path.join(REPO, "apps/web/src/preview.tsx"), "utf8");
    const engineSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/audioEngine.ts"), "utf8");
    const wiringSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/reverseAudioWiring.ts"), "utf8");
    const wiringInPreview = (previewSrc.match(/ReverseAudioWiring/g) || []).length;
    const tickCalls = (previewSrc.match(/wiring\.tick\(/g) || []).length;
    const wiringFactoryCalls = (previewSrc.match(/getReverseAudioWiring\(/g) || []).length;
    const playerInWiring = (wiringSrc.match(/ReverseAudioPlayer/g) || []).length;
    const loadCalls = (wiringSrc.match(/loadReversed/g) || []).length;
    const playCalls = (wiringSrc.match(/playSegment/g) || []).length;
    const playerInEngine = (engineSrc.match(/ReverseAudioPlayer/g) || []).length;
    const offsetUses = ((previewSrc.match(/reversedSampleOffset/g) || []).length) + ((wiringSrc.match(/reversedSampleOffset/g) || []).length);
    // Nhánh mute phát-ngược (preview.tsx ~5887): playing && reversePlayback
    // → mọi audioSource gain 0 — CÒN theo thiết kế (element paused).
    const muteBranches = (previewSrc.match(/playing && reversePlayback/g) || []).length;
    const wired = wiringInPreview > 0 && tickCalls > 0 && playerInWiring > 0 && (loadCalls > 0 || playCalls > 0);
    record({
      id: "S7c-reverse-audio-wiring",
      name: "reverse audio preview: ReverseAudioWiring nối vào preview (tick + load/play + mute)",
      verdict: wired ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        wiring_mentions_preview: wiringInPreview, wiring_tick_calls: tickCalls,
        wiring_factory_calls: wiringFactoryCalls, player_mentions_wiring: playerInWiring,
        loadReversed_calls: loadCalls, playSegment_calls: playCalls,
        player_mentions_engine: playerInEngine,
        reversedSampleOffset_uses: offsetUses, mute_branches: muteBranches,
      },
      notes: `Tiêu chí ĐẠT: preview.tsx nhắc ReverseAudioWiring + gọi wiring.tick VÀ reverseAudioWiring.ts nhắc ReverseAudioPlayer + gọi loadReversed/playSegment. Mute element "playing && reversePlayback" còn ${muteBranches} chỗ — BY DESIGN (element paused, tiếng ngược qua player với gain gốc, preview.tsx ~5900-5907); badge "audio đảo" theo wiring.isPlaying. S7b (logic) ĐẠT nhưng người dùng chỉ nghe được tiếng ngược khi wiring này ĐẠT.`,
    });
  }
  // S7d — mapping thời gian audio reverse (sourceTimeAt dùng chung cho audio clip).
  const audioClip = { start: 0, in: 0, out: 1, speed: 1, reverse: true } as never;
  const sMid = sourceTimeAt(audioClip, 0.25); // kỳ vọng 0.75
  record({
    id: "S7d-reverse-audio-mapping",
    name: "reverse audio mapping: sourceTimeAt cho audio clip reverse",
    verdict: Math.abs(sMid - 0.75) < 1e-9 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { sourceTime_at_0_25s: sMid },
    notes: `Chỉ kiểm mapping thời gian (đã ĐẠT). Nghe được tiếng ngược hay không là S7b/S7c: logic có, wiring xem S7c (đợt 192 nối qua ReverseAudioWiring).`,
  });
  // N7 — audio đảo clip dài + crossfade (P3-193 §2.2): cửa sổ 30 s tới
  // 600 s, offset tuyệt đối, crossfade 80 ms. Kiểm bằng fake ctx (ghi
  // lại lệnh start/stop) + đếm wiring. KHÔNG claim crossfade đã kích
  // hoạt headed — P3-193 F-193-P3-1: restart=0 headed dưới tải nên
  // crossfade chỉ chứng minh ở unit; P4 đo headed lại clip 70 s ở
  // N7-headed (xem LIMITS §2.7).
  {
    const sr = 48000;
    const sources: { startArgs: unknown[]; stopArgs: unknown[] }[] = [];
    const mkCtx = (durSec: number) => {
      const buf = {
        numberOfChannels: 1, length: Math.floor(durSec * sr), sampleRate: sr, duration: durSec,
        getChannelData: () => {
          const a = new Float32Array(Math.floor(durSec * sr));
          for (let i = 0; i < a.length; i++) a[i] = i / sr; // giá trị = chỉ số mẫu / sr (mã hoá vị trí)
          return a;
        },
      };
      const ctx = {
        sampleRate: sr, currentTime: 0, state: "running", destination: {},
        decodeAudioData: async () => buf,
        createBuffer: (channels: number, length: number, sampleRate: number) => {
          const chs = Array.from({ length: channels }, () => new Float32Array(length));
          return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (c: number) => chs[c] };
        },
        createBufferSource: () => {
          const s = { buffer: null as unknown, connect() {}, disconnect() {}, start: (...a: unknown[]) => { (s as { startArgs: unknown[] }).startArgs = a; }, stop: (...a: unknown[]) => { (s as { stopArgs: unknown[] }).stopArgs = a; }, startArgs: [] as unknown[], stopArgs: [] as unknown[] };
          sources.push(s);
          return s;
        },
        createGain: () => ({
          gain: { value: 0, setTargetAtTime() {}, linearRampToValueAtTime() {} },
          connect() {}, disconnect() {},
        }),
        resume: async () => {},
      };
      return ctx as never;
    };
    const ctx100 = mkCtx(100);
    const p100 = new ReverseAudioPlayer(ctx100);
    const loaded100 = await p100.loadReversedWindow(new ArrayBuffer(8), 60, REVERSED_AUDIO_WINDOW_SEC);
    const wStart = p100.windowStartSec;
    const wEnd = p100.windowEndSec;
    const dur100 = p100.durationSec;
    // Nội dung cửa sổ: mẫu đầu = forward[endIdx−1] ≈ 90 s, mẫu cuối = forward[startIdx] = 60 s.
    const winData = (p100 as unknown as { reversed: { getChannelData: (c: number) => Float32Array } | null }).reversed;
    const firstVal = winData ? winData.getChannelData(0)[0] : NaN;
    const lastVal = winData ? winData.getChannelData(0)[winData.getChannelData(0).length - 1] : NaN;
    // playSegment nhận offset TUYỆT ĐỐI: forward 75 s → abs = total − 75·sr
    // = 1.200.000 mẫu; tương đối trong cửa sổ [60,90] = 720.000 mẫu = 15 s.
    const total = 100 * sr;
    const abs75 = total - 75 * sr;
    const ok75 = p100.playSegment(abs75, 0.5);
    const startArgs75 = sources.length > 0 ? (sources[sources.length - 1].startArgs as unknown[]) : [];
    const startOff75 = startArgs75.length >= 2 ? Number(startArgs75[1]) : NaN;
    // Ngoài cửa sổ: forward 95 s → abs = 240.000 < windowBase 480.000 → false.
    const ok95 = p100.playSegment(total - 95 * sr, 0.5);
    // Crossfade: phát đoạn thứ hai (cùng cửa sổ) → đoạn cũ phải stop ở
    // t0 + 0,08 s (không cắt ngay), đoạn mới bắt đầu ngay.
    const ok2nd = p100.playSegment(abs75 + 24000, 0.5);
    const prevStop = sources.length >= 2 ? (sources[0].stopArgs as unknown[]) : [];
    const prevStopSec = prevStop.length >= 1 ? Number(prevStop[0]) : NaN;
    // Wiring: clip dài đi qua loadReversedWindow + longClips + counters +
    // restart-exact (không đếm verdict theo số lần nhắc tuyệt đối, chỉ
    // cần > 0 cho mỗi cơ chế).
    const wiringSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/reverseAudioWiring.ts"), "utf8");
    const loadWindowedCalls = (wiringSrc.match(/loadReversedWindow/g) || []).length;
    const longClipsMentions = (wiringSrc.match(/longClips/g) || []).length;
    const countersMentions = (wiringSrc.match(/counters/g) || []).length;
    const restartExactMentions = (wiringSrc.match(/restart-exact/g) || []).length;
    const gate600 = (wiringSrc.match(/MAX_REVERSED_AUDIO_WINDOWED_SECONDS/g) || []).length;
    const n7Ok =
      loaded100 === true && Math.abs(wStart - 60) < 1e-9 && Math.abs(wEnd - 90) < 1e-9 && Math.abs(dur100 - 100) < 1e-9 &&
      Math.abs(firstVal - 90) < 1e-3 && Math.abs(lastVal - 60) < 1e-9 &&
      ok75 === true && Math.abs(startOff75 - 15) < 1e-9 && ok95 === false &&
      ok2nd === true && Math.abs(prevStopSec - REVERSED_AUDIO_CROSSFADE_SEC) < 1e-9 &&
      loadWindowedCalls > 0 && longClipsMentions > 0 && countersMentions > 0 && restartExactMentions > 0 && gate600 > 0;
    record({
      id: "N7-reverse-audio-longclip",
      name: "audio đảo clip dài (P3-193): cửa sổ 30 s + offset tuyệt đối + crossfade 80 ms",
      verdict: n7Ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        window_100s_loaded: loaded100 ? 1 : 0, window_start_s: wStart, window_end_s: wEnd, duration_100s_s: dur100,
        window_data_first_s: firstVal, window_data_last_s: lastVal,
        play_abs75_ok: ok75 ? 1 : 0, play_abs75_start_offset_s: startOff75,
        play_outside_window_rejected: ok95 ? 0 : 1,
        crossfade_prev_stop_s: prevStopSec, crossfade_sec: REVERSED_AUDIO_CROSSFADE_SEC,
        wiring_loadWindowed_calls: loadWindowedCalls, wiring_longClips_mentions: longClipsMentions,
        wiring_counters_mentions: countersMentions, wiring_restart_exact_mentions: restartExactMentions,
        wiring_gate600_mentions: gate600,
      },
      notes: `Player chạy thật với fake ctx (100 s ramp): cửa sổ [60,90] đúng, durationSec vẫn 100, offset tuyệt đối đổi đúng về tương đối (75 s → start 15 s), ngoài cửa sổ từ chối, đoạn cũ stop ở t0+0,08 s (crossfade). Wiring có đủ 5 cơ chế (loadReversedWindow/longClips/counters/restart-exact/cổng 600 s). GIỚI HẠN: crossfade + restart-exact chỉ chứng minh ở mức unit/fake-ctx — headed dưới tải P3 đo restart=0 (F-193-P3-1), cần cửa sổ rảnh đo lại; clip 70 s phát thật headed xem N7-headed (LIMITS §2.7).`,
    });
  }
}

// ---------------------------------------------------------------------------
// N6 — P3 scrub NGƯỢC tại biên (nợ S6b đợt 192): đường pause/seek
// (Seeker trong seek.ts) trước đây seek tới đúng target nên scrub tại
// biên ngược hiện N−k thay vì N−1−k (P3-193 đo headed: 0/4 biên đúng).
// Đợt 193 P3 tách backoff riêng cho scrub: reverseScrubSeekTarget +
// cờ per-target reverseScrub (seekElement không snapToFrame — round
// sẽ nuốt mất 1 ms — và so frame bằng floor). Check này gồm 3 lớp:
// (a) hàm thuần reverseScrubSeekTarget đúng ở mọi biên; (b) mapping
// scrub (sourceTimeAt → reverseScrubSeekTarget → floor) cho đúng
// frame render; (c) wiring: executor scrub ở preview.tsx áp backoff
// cho video ngược + seek.ts tôn trọng cờ. Hành vi element với target
// đã lùi 1 ms đã chứng minh headed ở S6b-headed (9/9 offset 0) —
// N6 không lái UI app thật (ghi rõ giới hạn), mà kiểm target mà
// đường scrub tính + wiring đưa target đó tới element.
// ---------------------------------------------------------------------------
function sectionScrubReverse(): void {
  console.log("== N6 scrub ngược tại biên (P3) — reverseScrubSeekTarget + wiring ==");
  // (a) Hàm thuần: biên k/30 → k/30 − 1ms khi reverse; xuôi giữ nguyên; 0 → 0.
  const fps = 30;
  const frames = 60;
  const clip = { start: 0, in: 0, out: 2, speed: 1, reverse: true } as never;
  const pureRows: string[] = [];
  let pureOk = true;
  for (const k of [0, 1, 15, 30, 45, 59]) {
    const t = k / fps;
    const s = sourceTimeAt(clip, t);
    const scrub = reverseScrubSeekTarget(s, true);
    const fwd = reverseScrubSeekTarget(s, false);
    const want = s - 0.001; // k=0: t=0 ngược → s=out=2,0 (không phải 0); clamp 0 chỉ khi s≈0, kiểm riêng dưới
    const ok = Math.abs(scrub - want) < 1e-9 && Math.abs(fwd - s) < 1e-9;
    pureOk = pureOk && ok;
    pureRows.push(`k=${k} s=${s.toFixed(4)} scrub=${scrub.toFixed(4)} want=${want.toFixed(4)} fwd=${fwd.toFixed(4)} ${ok ? "ok" : "SAI"}`);
  }
  const zeroOk = reverseScrubSeekTarget(0, true) === 0 && reverseScrubSeekTarget(-1, true) === 0;
  pureOk = pureOk && zeroOk;
  // (b) Mapping scrub: floor(scrubTarget × fps) phải = frame render N−1−k.
  let worstOff = 0;
  const mapRows: string[] = [];
  for (const k of [0, 1, 15, 30, 45, 59]) {
    const t = k / fps;
    const s = sourceTimeAt(clip, t);
    const scrub = reverseScrubSeekTarget(s, true);
    const shown = Math.min(frames - 1, Math.max(0, Math.floor(scrub * fps)));
    const expectedIdx = frames - 1 - k;
    const off = shown - expectedIdx;
    worstOff = Math.max(worstOff, Math.abs(off));
    mapRows.push(`k=${k} scrub=${scrub.toFixed(4)} shown=${shown} expect=${expectedIdx} off=${off}`);
  }
  // (c) Wiring: executor scrub preview.tsx + seek.ts tôn trọng cờ.
  const previewSrc = fs.readFileSync(path.join(REPO, "apps/web/src/preview.tsx"), "utf8");
  const seekSrc = fs.readFileSync(path.join(REPO, "apps/web/src/lib/seek.ts"), "utf8");
  const execUses = (previewSrc.match(/reverseScrubSeekTarget\(/g) || []).length;
  const flagSets = (previewSrc.match(/reverseScrub: true/g) || []).length;
  const flagInSeekTarget = seekSrc.includes("reverseScrub?: boolean");
  const noSnap = seekSrc.includes("reverseScrub ? target : snapToFrame");
  const floorCmp = seekSrc.includes("reverseScrub ? frameIndexFloor : frameIndexOf");
  const wired = execUses > 0 && flagSets > 0 && flagInSeekTarget && noSnap && floorCmp;
  record({
    id: "N6-scrub-reverse-boundary",
    name: "scrub ngược tại biên: reverseScrubSeekTarget + mapping + wiring (Seeker không snap 1ms)",
    verdict: pureOk && worstOff === 0 && wired ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      pure_fn_ok: pureOk ? 1 : 0, worst_frame_offset: worstOff, n_boundaries: 6,
      executor_uses: execUses, flag_sets: flagSets,
      seek_flag: flagInSeekTarget ? 1 : 0, no_snap_when_flag: noSnap ? 1 : 0, floor_compare: floorCmp ? 1 : 0,
      wired: wired ? 1 : 0,
    },
    notes: `Hàm thuần: ${pureRows.join(" | ")} (clamp 0/âm → 0: ${zeroOk ? "ok" : "SAI"}). Mapping scrub: ${mapRows.join(" | ")}. Wiring: preview.tsx dùng reverseScrubSeekTarget ${execUses} lần + đặt cờ reverseScrub ${flagSets} lần (chỉ video ngược; audio/xuôi giữ target gốc); seek.ts có cờ per-target + không snap khi cờ bật + so frame bằng floor. Giới hạn: N6 kiểm target + wiring + hành vi element đã chứng minh ở S6b-headed (seek tới biên−1ms hiện đúng frame, 9/9) — KHÔNG lái UI scrub thật trong app (P3-193 đo headed đường scrub: xem LIMITS P3 §1).`,
  });
}

// ---------------------------------------------------------------------------
// S8 — P3 reverse MƯỢT: bước lùi đều + cổng decode-ahead + proxy
// ---------------------------------------------------------------------------
function sectionReverseSmooth(): void {
  console.log("== S8 reverse mượt (P3) — bước lùi đều + cổng gate ==");
  // Mô phỏng 60 bước lùi 1/30s từ t=2.0: mỗi bước đúng 1 frame, chạm 0 đúng bước 60.
  const frameDur = 1 / 30;
  let t = 2.0;
  let acc = 0;
  let maxStepErr = 0;
  let reachedAt: number | null = null;
  for (let step = 1; step <= 60; step++) {
    const r = reverseStep(acc, frameDur, frameDur);
    maxStepErr = Math.max(maxStepErr, Math.abs(r.steps - 1));
    acc = r.accumulated;
    const p = reversePlayhead(t, r.steps, frameDur);
    t = p.t;
    if (p.reachedStart && reachedAt === null) reachedAt = step;
  }
  record({
    id: "S8-reverse-steps",
    name: "reverse mượt: 60 bước lùi 1/30s đều, chạm 0 đúng bước 60",
    verdict: maxStepErr === 0 && reachedAt === 60 && Math.abs(t) < 1e-9 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { max_step_err_frames: maxStepErr, reached_start_at_step: reachedAt ?? -1, final_t: t },
    notes: `reverseStep/reversePlayhead thật (không tích lũy lệch). Mượt ở đây = bước đều 1 frame, không nhảy/bỏ frame do làm tròn.`,
  });
  // Cổng decode-ahead: mặc định chặn khi opt-in tắt; cho phép thử nghiệm
  // chỉ khi opt-in + footage dễ decode (hoặc HW đã chứng minh).
  const blocked = resolveDecodeAheadGate({ optIn: false, hardwareProof: null, softwareMeasurement: null });
  const blockedNoProof = resolveDecodeAheadGate({
    optIn: true,
    hardwareProof: null,
    softwareMeasurement: { decodeFps: 30, loadLabel: "quiet", resolution: "1280x720" },
  });
  const allowed = resolveDecodeAheadGate({
    optIn: true,
    hardwareProof: null,
    softwareMeasurement: { decodeFps: 60, loadLabel: "quiet", resolution: "1280x720" },
  });
  const gateOk =
    blocked.verdict === "blocked" && blockedNoProof.verdict === "blocked" && allowed.verdict === "allowed-experiment";
  record({
    id: "S8-decode-ahead-gate",
    name: "cổng decode-ahead (đợt 36 S3): chặn mặc định, chỉ mở khi đủ bằng chứng",
    verdict: gateOk ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { optin_off: blocked.verdict === "blocked" ? 1 : 0, optin_no_proof: blockedNoProof.verdict === "blocked" ? 1 : 0, optin_easy: allowed.verdict === "allowed-experiment" ? 1 : 0 },
    notes: `opt-in tắt → ${blocked.verdict}; opt-in + decode 30fps (dưới ngưỡng dễ 2×) → ${blockedNoProof.verdict}; opt-in + decode 60fps → ${allowed.verdict}.`,
  });
  // Cadence tracker (đợt 191 P3): hàm thuần + đã nối vào preview.tsx
  // (window.__vcutReverseCadence). Chỉ kiểm tra DỤNG CỤ ĐO — fps ngược
  // thật khi phát (P3 baseline headed: 0,08 fps) KHÔNG đo lại được headless.
  {
    const sum = summarizeIntervals([10, 20, 30, 40]);
    const tracker = new ReverseCadenceTracker();
    tracker.start(0);
    const r1 = tracker.recordPresented(10, 0);
    const rDup = tracker.recordPresented(10, 33);
    const r2 = tracker.recordPresented(9, 33);
    const r3 = tracker.recordPresented(8, 66);
    const snap = tracker.snapshot();
    const previewSrc = fs.readFileSync(path.join(REPO, "apps/web/src/preview.tsx"), "utf8");
    const wiredCadence =
      previewSrc.includes("ReverseCadenceTracker") && previewSrc.includes("__vcutReverseCadence");
    const ok =
      sum.median === 30 && sum.p90 === 40 && sum.max === 40 && sum.mean === 25 &&
      r1 === true && rDup === false && r2 === true && r3 === true &&
      snap !== null && snap.presentedFrames === 3 && snap.distinctFrames === 3 &&
      snap.intervalMedianMs === 33 && snap.stallsOver100Ms === 0 &&
      Math.abs(snap.presentedFps - 45.45) < 0.01 && wiredCadence;
    record({
      id: "S8-cadence-tracker",
      name: "cadence ngược: tracker đo đúng + đã nối vào preview (dụng cụ đo)",
      verdict: ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        median_ms: sum.median ?? -1, p90_ms: sum.p90 ?? -1, max_ms: sum.max ?? -1, mean_ms: sum.mean ?? -1,
        presented_frames: snap?.presentedFrames ?? -1, distinct_frames: snap?.distinctFrames ?? -1,
        interval_median_ms: snap?.intervalMedianMs ?? -1, presented_fps: snap?.presentedFps ?? -1,
        wired_preview: wiredCadence ? 1 : 0,
      },
      notes: `summarizeIntervals([10,20,30,40]) → median 30/p90 40/max 40/mean 25; tracker khử trùng vẽ lại (dup → false), 3 frame mới trong 66ms → 45.45 fps. Đây là kiểm tra dụng cụ đo, KHÔNG phải verdict "phát ngược đã mượt" — fps ngược thật cần đo headed (P3 baseline: 0,08 fps trên fixture 300 frame/1 GOP; xem LIMITS §4).`,
    });
  }
  // Proxy làm hướng chính cho chiều ngược: cần đủ 3 điều kiện đo thật.
  const proxyYes = resolveProxyMainDirection({
    proxyDisplayedFps: 30, originalDisplayedFps: 28, proxyDecodeFps: 60,
  });
  const proxyNo = resolveProxyMainDirection({
    proxyDisplayedFps: 24, originalDisplayedFps: 30, proxyDecodeFps: 60,
  });
  record({
    id: "S8-proxy-direction",
    name: "proxy hướng chính chiều ngược: chỉ yes khi đủ điều kiện đo",
    verdict: proxyYes.verdict === "yes" && proxyNo.verdict === "no" ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { proxy_ok_yes: proxyYes.verdict === "yes" ? 1 : 0, proxy_slow_no: proxyNo.verdict === "no" ? 1 : 0 },
    notes: `proxy 30fps >= gốc 28fps + decode 60fps → ${proxyYes.verdict}; proxy 24fps < 30fps phát → ${proxyNo.verdict}.`,
  });
}

// ---------------------------------------------------------------------------
// N4 — P2 sharpen trên nội dung NHIỄU: applySharpen vs unsharp render
// ---------------------------------------------------------------------------
function sectionSharpenNoisy(): void {
  console.log("== N4 sharpen nhiễu (P2) — preview applySharpen vs render unsharp trên pattern+nhiễu σ=15 ==");
  const w = 144;
  const h = 90;
  const base = patternFrame(w, h);
  const rng = mulberry32(19200);
  const src = Buffer.from(base);
  for (let i = 0; i < src.length; i++)
    src[i] = Math.max(0, Math.min(255, Math.round(src[i] + 15 * gauss(rng))));
  for (const t of [0.5, 1.0] as const) {
    const filter = nodeRequireJs("server/render/src/effects.js", `m.buildEffectFilter({type:"sharpen",intensity:${t}})`);
    const ffOut = renderYuv444(filter, src, w, h);
    const prev = fromImg(applySharpen(toImg(src, w, h), t), w, h);
    const m = compareFrames(ffOut, prev, w, h);
    const tier = tierOf(m);
    record({
      id: `N4-sharpen-noisy-t${t}`,
      name: `sharpen t=${t} trên nội dung nhiễu σ=15 — preview vs render ${filter}`,
      verdict: tier === "KHỚP" || tier === "XẤP XỈ" ? "ĐẠT" : "CHƯA ĐẠT",
      tier,
      numbers: { MAD: m.mad, PSNR: m.psnr === Infinity ? "inf" : m.psnr, le8_pct: m.le8 * 100, le32_pct: m.le32 * 100 },
      notes: `Baseline đợt 191 (P2 LIMITS §5.2): sharpen trên nội dung nhiễu lệch MAD 1.5–3.0, le8 81–91% (giới hạn mô hình Y_est). Tiêu chí ĐẠT: tier XẤP XỈ trở lên (MAD≤20 & le32≥90%).`,
    });
  }
}

// ---------------------------------------------------------------------------
// N5 — P2 deint: R preview (bob sim) vs yadif render, testsrc2 interlaced
// Đợt 192 P2 đổi preview từ half-res sang BOB: intermediate draw tắt
// smoothing (nearest) giữ đúng TOP FIELD (hàng chẵn), rồi upscale bilinear
// (preview.tsx deintIntermediateSource + P2-192 LIMITS §3.3; đã xác minh
// headed Chromium 1254: 90/90 hàng = hàng chẵn). Mô hình dưới đây = đúng
// hàm bobField(src,0)+upscaleBilinear của probe P2-192 (probe-192-p2.mjs).
// ĐỢT 193 P2 (LIMITS §3.1/§6.2): bước upscale cuối nay TẮT smoothing
// (nearest) — deintBobNearestSource: half nearest rồi upscale nearest lên
// full-res (line doubling khi divisor=2). Mô hình dưới = bob-nearest.
// Half-res cũ giữ lại làm cột tham chiếu (không dùng cho verdict).
// ---------------------------------------------------------------------------
export function deintBobSim(src: Buffer, w: number, h: number, divisor: number): Buffer {
  const h2 = Math.floor(h / divisor);
  const field = new Float64Array(w * h2 * 3);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) field[(y * w + x) * 3 + c] = src[((divisor * y) * w + x) * 3 + c];
  // Upscale NEAREST (đợt 193): hàng đích y lấy hàng field gần nhất —
  // với divisor=2 là line doubling [0,0,1,1,2,2,...] (đúng canvas
  // imageSmoothingEnabled=false của deintBobNearestSource).
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = (y + 0.5) / divisor - 0.5;
        const yn = Math.max(0, Math.min(h2 - 1, Math.round(sy)));
        out[(y * w + x) * 3 + c] = Math.round(field[(yn * w + x) * 3 + c]);
      }
  return out;
}
export function deintHalfResSim(src: Buffer, w: number, h: number, divisor: number): Buffer {
  const h2 = Math.floor(h / divisor);
  const mid = new Float64Array(w * h2 * 3);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let k = 0; k < divisor; k++) s += src[((divisor * y + k) * w + x) * 3 + c];
        mid[(y * w + x) * 3 + c] = s / divisor;
      }
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = (y + 0.5) / divisor - 0.5;
        const y0 = Math.max(0, Math.floor(sy));
        const y1 = Math.min(h2 - 1, y0 + 1);
        const f = Math.min(1, Math.max(0, sy - y0));
        out[(y * w + x) * 3 + c] = Math.round(mid[(y0 * w + x) * 3 + c] * (1 - f) + mid[(y1 * w + x) * 3 + c] * f);
      }
  return out;
}
/** Bob một field chỉ định (đợt 194 P2 — mode 1 luân phiên): field 0 = hàng
 * chẵn (top), field 1 = hàng lẻ (bottom); upscale nearest như bob. */
export function deintBobFieldSim(src: Buffer, w: number, h: number, divisor: number, field: 0 | 1): Buffer {
  const h2 = Math.floor(h / divisor);
  const f = new Float64Array(w * h2 * 3);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) f[(y * w + x) * 3 + c] = src[((divisor * y + field) * w + x) * 3 + c];
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = (y + 0.5) / divisor - 0.5;
        const yn = Math.max(0, Math.min(h2 - 1, Math.round(sy)));
        out[(y * w + x) * 3 + c] = Math.round(f[(yn * w + x) * 3 + c]);
      }
  return out;
}
/** Dịch dọc ảnh dy px (nội suy bilinear) — mô hình tap +0,5px cũ của P2
 * (ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX, đã BỎ khỏi preview đợt 193). */
export function tapShiftVerticalSim(src: Buffer, w: number, h: number, dy: number): Buffer {
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = y + dy;
        const y0 = Math.max(0, Math.min(h - 1, Math.floor(sy)));
        const y1 = Math.max(0, Math.min(h - 1, y0 + 1));
        const f = Math.min(1, Math.max(0, sy - y0));
        out[(y * w + x) * 3 + c] = Math.round(src[(y0 * w + x) * 3 + c] * (1 - f) + src[(y1 * w + x) * 3 + c] * f);
      }
  return out;
}
/** Bob-first (P2-193 §3.2): bob-nearest TRƯỚC rồi blend denoise trên khung
 * đã bob (alphaOverride = alpha thích nghi đã tính, không tự tính lại). */
export function bobFirstPreview(src: Buffer, w: number, h: number, divisor: number, alpha: number): Buffer {
  return denoisePreviewComposite(deintBobSim(src, w, h, divisor), w, h, 0.5, alpha);
}
/** Bob-first đợt 196 (P2-196 — blend dọc sau bob): bob-nearest → blend dọc
 * với trọng số w = deintVerticalBlendWeight(σ̂) (0,75 khi σ̂ ≥ 8, 0 khi
 * sạch) → denoise trên khung đã blend. Blend = (1−w)·bob + w·blurV(bob),
 * blurV = dịch +0,5px bilinear (tapShiftVerticalSim — đúng canvas
 * drawImage smoothing-ON lệch +0,5px với globalAlpha=w của preview.tsx
 * deintBobNearestSource). w=0 → đúng bobFirstPreview cũ; w=1 → đúng
 * tap-P4 (denoise trên khung đã blur dọc hoàn toàn). */
export function bobFirstPreview196(src: Buffer, w: number, h: number, divisor: number, alpha: number, verticalBlendW: number): Buffer {
  const bob = deintBobSim(src, w, h, divisor);
  let blended = bob;
  if (verticalBlendW > 0) {
    const shifted = tapShiftVerticalSim(bob, w, h, 0.5);
    blended = Buffer.alloc(w * h * 3);
    for (let i = 0; i < blended.length; i++)
      blended[i] = Math.round(bob[i] * (1 - verticalBlendW) + shifted[i] * verticalBlendW);
  }
  return denoisePreviewComposite(blended, w, h, 0.5, alpha);
}
/** R combing: năng lượng gradient dọc trung bình (luma) — răng cưa làm tăng (P2-191). */
export function combingRLuma(rgb: Buffer, w: number, h: number): number {
  let s = 0;
  let n = 0;
  for (let y = 0; y < h - 1; y++)
    for (let x = 0; x < w; x++) {
      const ya = 0.2126 * rgb[(y * w + x) * 3] + 0.7152 * rgb[(y * w + x) * 3 + 1] + 0.0722 * rgb[(y * w + x) * 3 + 2];
      const yb = 0.2126 * rgb[((y + 1) * w + x) * 3] + 0.7152 * rgb[((y + 1) * w + x) * 3 + 1] + 0.0722 * rgb[((y + 1) * w + x) * 3 + 2];
      s += Math.abs(yb - ya);
      n++;
    }
  return s / n;
}
function sectionDeint(): void {
  console.log("== N5 deint (P2) — preview BOB-NEAREST (đợt 193) vs yadif render, testsrc2 interlaced frame 8 ==");
  const w = 320;
  const h = 180;
  const divisor = ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR;
  const cleanYuv = path.join(TMP, "deint-clean.yuv");
  const interYuv = path.join(TMP, "deint-inter.yuv");
  ff(["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=${w}x${h}:rate=30:duration=1`,
    "-vf", "scale=out_color_matrix=bt709,format=yuv420p", "-f", "rawvideo", "-pix_fmt", "yuv420p", cleanYuv], "testsrc2 clean");
  ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
    "-i", cleanYuv, "-vf", "interlace=scan=tff:lowpass=0",
    "-f", "rawvideo", "-pix_fmt", "yuv420p", interYuv], "interlace");
  const yadif = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePreChain({deinterlace:true})`).replace(/^,/, "");
  // buildEnhancePreChain trả ",yadif=..." (dấu phẩy đầu là separator
  // trong chain render) — strip để dùng trực tiếp làm filter ffmpeg.
  const frameRgb = (yuvFile: string, idx: number): Buffer => {
    const FS = (w * h * 3) / 2;
    const buf = fs.readFileSync(yuvFile);
    const one = path.join(TMP, "deint-one.yuv");
    fs.writeFileSync(one, buf.subarray(idx * FS, (idx + 1) * FS));
    const out = path.join(TMP, "deint-one.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`,
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-i", one, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yuv->rgb");
    return fs.readFileSync(out);
  };
  const idx = 7; // frame 8
  const srcRgb = frameRgb(interYuv, idx);
  const cleanRgb = frameRgb(cleanYuv, idx);
  const yadifRgb = (() => {
    const out = path.join(TMP, "deint-yadif.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", interYuv, "-vf", `${yadif},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif");
    const all = fs.readFileSync(out);
    return Buffer.from(all.subarray(idx * w * h * 3, (idx + 1) * w * h * 3));
  })();
  const bobRgb = deintBobSim(srcRgb, w, h, divisor);
  const halfRgb = deintHalfResSim(srcRgb, w, h, divisor);
  const prevRgb = bobRgb;
  const m = compareFrames(yadifRgb, prevRgb, w, h);
  const mHalf = compareFrames(yadifRgb, halfRgb, w, h);
  const tier = tierOf(m);
  const rSrc = combingRLuma(srcRgb, w, h);
  const rClean = combingRLuma(cleanRgb, w, h);
  const rYadif = combingRLuma(yadifRgb, w, h);
  const rPrev = combingRLuma(prevRgb, w, h);
  const rHalf = combingRLuma(halfRgb, w, h);
  const rRel = Math.abs(rPrev - rYadif) / rYadif;
  record({
    id: "N5-deint",
    name: `deint testsrc2 interlaced frame 8 — preview BOB-NEAREST top-field (divisor=${divisor}) vs render ${yadif}`,
    verdict: (tier === "KHỚP" || tier === "XẤP XỈ") && rRel <= 0.15 ? "ĐẠT" : "CHƯA ĐẠT",
    tier,
    numbers: {
      MAD_vs_yadif: m.mad, PSNR_vs_yadif: m.psnr === Infinity ? "inf" : m.psnr,
      le8_pct: m.le8 * 100, le32_pct: m.le32 * 100,
      R_src: rSrc, R_clean: rClean, R_yadif: rYadif, R_preview: rPrev, R_rel_diff: rRel,
      MAD_halfres_ref_vs_yadif: mHalf.mad, R_halfres_ref: rHalf,
    },
    notes: `R = gradient dọc trung bình (luma) — răng cưa làm tăng. Verdict theo mô hình BOB-NEAREST (preview đợt 193, P2-193 §3.1/§6.2); half-res cũ chỉ làm tham chiếu. Baseline P2-193 (LIMITS §3.1, fixture của P2): bob-nearest MAD vs yadif 2,55 (f8) / 2,32 (f3) / 2,51 (f7), le8 95%; bob-bilinear cũ 3,10 (f8). Fixture đợt này sinh lại (interlace scan=tff lowpass=0) nên R_src khác — so tuyệt đối với số P2 chỉ mang tính tham chiếu; verdict theo tier + |ΔR|/R_yadif ≤ 15% trên cùng fixture.`,
  });
  // N5b — bob-first (P4-193 §2.5 note; P2-193 §3.2 đo 12/12 ô thắng):
  // bob-nearest TRƯỚC rồi blend denoise trên khung đã bob vs truth
  // yadif→hqdn3d; đối chiếu biến thể tap cũ (+0,5px trước denoise).
  // Fixture CÓ nhiễu: 30 frame testsrc2 (lấy từng frame qua frameRgb
  // từ cleanYuv) + nhiễu Gauss σ=15 độc lập mỗi frame (seed 19100+f
  // như S2) rồi interlace — trên khung sạch denoise không đổi gì nên
  // ô này vô nghĩa. Cần đủ 30 frame vì frameRgb/truth đọc theo idx.
  {
    const s = 0.5;
    const noisyFrames: Buffer[] = [];
    for (let f = 0; f < 30; f++) {
      const baseF = frameRgb(cleanYuv, f);
      const rngF = mulberry32(19100 + f);
      const nb = Buffer.alloc(w * h * 3);
      for (let i = 0; i < nb.length; i++)
        nb[i] = Math.max(0, Math.min(255, Math.round(baseF[i] + 15 * gauss(rngF))));
      noisyFrames.push(nb);
    }
    const noisyIn = path.join(TMP, "deint-noisy.rgb");
    fs.writeFileSync(noisyIn, Buffer.concat(noisyFrames));
    const noisyYuv = path.join(TMP, "deint-noisy.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyIn, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", noisyYuv], "noisy rgb->yuv");
    const interNoisyYuv = path.join(TMP, "deint-interno.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyYuv, "-vf", "interlace=scan=tff:lowpass=0",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", interNoisyYuv], "interlace noisy");
    const hq = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePostChain({denoise:{strength:${s}}})`).replace(/^,/, "");
    const truthAll = (() => {
      const out = path.join(TMP, "deint-truth.rgb");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interNoisyYuv, "-vf", `${yadif},${hq},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif+hqdn3d truth");
      return fs.readFileSync(out);
    })();
    const truthAt = (i: number): Buffer => Buffer.from(truthAll.subarray(i * w * h * 3, (i + 1) * w * h * 3));
    // 3 frame (idx 3/7/11 — như các ô f3/f7/f11 của probe P2-193 §3.2):
    // σ̂ đo trên khung NGUỒN xen kẽ (đúng preview.tsx: estimateEnhanceNoise-
    // Sigma đọc drawSrc TRƯỚC bob — xem F-194-P4-2; đo trên khung đã bob
    // làm σ̂ thấp giả vì line doubling tương quan các cặp kề dọc).
    const rows: Array<{ i: number; mBf: number; mTap: number; mBf196: number; mBf199: number; mBfF: number; vbW: number; le8Bf: number; le32Bf: number; le8Bf196: number; le32Bf196: number; le8Bf199: number; le32Bf199: number; rRel: number; rRel196: number; rRel199: number; sigmaHat: number; k: number; alpha: number; motion: number | null; motionK: number; alpha199: number }> = [];
    for (const i of [3, 7, 11]) {
      const truthRgb = truthAt(i);
      const srcNoisyRgb = frameRgb(interNoisyYuv, i);
      const bobNoisy = deintBobSim(srcNoisyRgb, w, h, divisor);
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let p = 0; p < w * h; p++) {
        rgba[p * 4] = srcNoisyRgb[p * 3];
        rgba[p * 4 + 1] = srcNoisyRgb[p * 3 + 1];
        rgba[p * 4 + 2] = srcNoisyRgb[p * 3 + 2];
        rgba[p * 4 + 3] = 255;
      }
      const sigmaHat = estimateNoiseSigmaFromRgba(rgba, w, h);
      const k = denoiseAdaptiveK(s, sigmaHat);
      const wf = denoiseWarmupFactor(3, s, sigmaHat);
      const alpha = denoiseBlendAlpha(s) * k * wf;
      // Đợt 198 P2 — α thích nghi theo chuyển động (quyết (a1)-197): ước
      // lượng C5b_box giữa khung này và khung trước (hàm thuần P2 ship)
      // rồi nhân α (α199 = α × m(M)); khung i−1 luôn có (i ≥ 3).
      const rgbaPrev = new Uint8ClampedArray(w * h * 4);
      {
        const prevRgb = frameRgb(interNoisyYuv, i - 1);
        for (let p = 0; p < w * h; p++) {
          rgbaPrev[p * 4] = prevRgb[p * 3];
          rgbaPrev[p * 4 + 1] = prevRgb[p * 3 + 1];
          rgbaPrev[p * 4 + 2] = prevRgb[p * 3 + 2];
          rgbaPrev[p * 4 + 3] = 255;
        }
      }
      const motion = motionEstimateFromBandLuma(motionBandLumaFromRgba(rgba, w, h), motionBandLumaFromRgba(rgbaPrev, w, h), w);
      const motionK = motion === null ? 1 : denoiseMotionMultiplier(motion);
      const alpha199 = alpha * motionK;
      const prevBf = denoisePreviewComposite(bobNoisy, w, h, s, alpha);
      const tapNoisy = tapShiftVerticalSim(bobNoisy, w, h, 0.5);
      const prevTap = denoisePreviewComposite(tapNoisy, w, h, s, alpha);
      // Preview 196 thật (P2-196): blend dọc w(σ̂) sau bob rồi mới denoise.
      const vbW = deintVerticalBlendWeight(sigmaHat);
      const prevBf196 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha, vbW);
      // Preview 199 thật (pipeline α thích nghi P2-198): cùng pipeline 196 nhưng α thích nghi.
      const prevBf199 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha199, vbW);
      // Phản thực: w=0,75 cưỡng bức mọi frame — kiểm ngưỡng σ̂≥8 có phải
      // nút thắt không (f3 σ̂ 7,98 sát ngưỡng; xem F-196-P4-2).
      const prevBfF = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha, 0.75);
      const mBf = compareFrames(truthRgb, prevBf, w, h);
      const mTap = compareFrames(truthRgb, prevTap, w, h);
      const mBf196 = compareFrames(truthRgb, prevBf196, w, h);
      const mBf199 = compareFrames(truthRgb, prevBf199, w, h);
      const mBfF = compareFrames(truthRgb, prevBfF, w, h);
      const rTruth = combingRLuma(truthRgb, w, h);
      const rBf = combingRLuma(prevBf, w, h);
      const rBf196 = combingRLuma(prevBf196, w, h);
      const rBf199 = combingRLuma(prevBf199, w, h);
      rows.push({ i, mBf: mBf.mad, mTap: mTap.mad, mBf196: mBf196.mad, mBf199: mBf199.mad, mBfF: mBfF.mad, vbW, le8Bf: mBf.le8 * 100, le32Bf: mBf.le32 * 100, le8Bf196: mBf196.le8 * 100, le32Bf196: mBf196.le32 * 100, le8Bf199: mBf199.le8 * 100, le32Bf199: mBf199.le32 * 100, rRel: Math.abs(rBf - rTruth) / rTruth, rRel196: Math.abs(rBf196 - rTruth) / rTruth, rRel199: Math.abs(rBf199 - rTruth) / rTruth, sigmaHat, k, alpha, motion, motionK, alpha199 });
    }
    const madBfAvg = rows.reduce((a, r) => a + r.mBf, 0) / rows.length;
    const madTapAvg = rows.reduce((a, r) => a + r.mTap, 0) / rows.length;
    const le8BfAvg = rows.reduce((a, r) => a + r.le8Bf, 0) / rows.length;
    const le32BfAvg = rows.reduce((a, r) => a + r.le32Bf, 0) / rows.length;
    const rRelWorst = Math.max(...rows.map((r) => r.rRel));
    const madBf196Avg = rows.reduce((a, r) => a + r.mBf196, 0) / rows.length;
    const le8Bf196Avg = rows.reduce((a, r) => a + r.le8Bf196, 0) / rows.length;
    const le32Bf196Avg = rows.reduce((a, r) => a + r.le32Bf196, 0) / rows.length;
    const rRel196Worst = Math.max(...rows.map((r) => r.rRel196));
    const tierBf196Avg = madBf196Avg <= 2 && le8Bf196Avg >= 99 ? "KHỚP" : madBf196Avg <= 20 && le32Bf196Avg >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    // Đường 199 (verdict): cùng pipeline 196 nhưng α thích nghi.
    const madBf199Avg = rows.reduce((a, r) => a + r.mBf199, 0) / rows.length;
    const le8Bf199Avg = rows.reduce((a, r) => a + r.le8Bf199, 0) / rows.length;
    const le32Bf199Avg = rows.reduce((a, r) => a + r.le32Bf199, 0) / rows.length;
    const rRel199Worst = Math.max(...rows.map((r) => r.rRel199));
    const tierBf199Avg = madBf199Avg <= 2 && le8Bf199Avg >= 99 ? "KHỚP" : madBf199Avg <= 20 && le32Bf199Avg >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    record({
      id: "N5b-deint-bob-first",
      name: `deint bob-first 199 s=0.5 (α thích nghi P2-198) — bob-nearest + blend dọc w(σ̂) rồi denoise α×m(M) vs render yadif→${hq}, 3 frame có nhiễu σ=15`,
      verdict: (tierBf199Avg === "KHỚP" || tierBf199Avg === "XẤP XỈ") && madBf199Avg < madTapAvg && rRel199Worst <= 0.15 ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierBf199Avg,
      numbers: {
        MAD_bobfirst199_avg: madBf199Avg, MAD_tap_avg: madTapAvg, MAD_bobfirst199_minus_tap_avg: madBf199Avg - madTapAvg,
        MAD_bobfirst199_f3: rows[0].mBf199, MAD_tap_f3: rows[0].mTap,
        MAD_bobfirst199_f7: rows[1].mBf199, MAD_tap_f7: rows[1].mTap,
        MAD_bobfirst199_f11: rows[2].mBf199, MAD_tap_f11: rows[2].mTap,
        MAD_bobfirst196_avg: madBf196Avg, MAD_bobfirst196_minus_tap_avg: madBf196Avg - madTapAvg,
        MAD_bobfirst196_f3: rows[0].mBf196, MAD_bobfirst196_f7: rows[1].mBf196, MAD_bobfirst196_f11: rows[2].mBf196,
        MAD_bobfirst_old_avg: madBfAvg, MAD_bobfirst_old_minus_tap_avg: madBfAvg - madTapAvg,
        MAD_bobfirst196_forced075_avg: rows.reduce((a, r) => a + r.mBfF, 0) / rows.length, MAD_bobfirst196_forced075_f3: rows[0].mBfF, MAD_bobfirst196_forced075_f7: rows[1].mBfF, MAD_bobfirst196_forced075_f11: rows[2].mBfF,
        le8_bobfirst199_avg_pct: le8Bf199Avg, le32_bobfirst199_avg_pct: le32Bf199Avg, R_rel_diff_worst199: rRel199Worst, tier_bobfirst196: tierBf196Avg, tier_bobfirst199: tierBf199Avg,
        le8_bobfirst196_avg_pct: le8Bf196Avg, le32_bobfirst196_avg_pct: le32Bf196Avg, R_rel_diff_worst196: rRel196Worst,
        le8_bobfirst_old_avg_pct: le8BfAvg, le32_bobfirst_old_avg_pct: le32BfAvg, R_rel_diff_worst_old: rRelWorst,
        vertical_blend_w_f3: rows[0].vbW, vertical_blend_w_f7: rows[1].vbW, vertical_blend_w_f11: rows[2].vbW,
        sigma_hat_f3: rows[0].sigmaHat, sigma_hat_f7: rows[1].sigmaHat, sigma_hat_f11: rows[2].sigmaHat,
        sigma_hat_src_avg: rows.reduce((a, r) => a + r.sigmaHat, 0) / rows.length,
        adaptive_k_avg: rows.reduce((a, r) => a + r.k, 0) / rows.length,
        alpha_avg: rows.reduce((a, r) => a + r.alpha, 0) / rows.length,
        motion_estimate_f3: rows[0].motion ?? -1, motion_estimate_f7: rows[1].motion ?? -1, motion_estimate_f11: rows[2].motion ?? -1,
        motion_multiplier_f3: rows[0].motionK, motion_multiplier_f7: rows[1].motionK, motion_multiplier_f11: rows[2].motionK,
        alpha199_f3: rows[0].alpha199, alpha199_f7: rows[1].alpha199, alpha199_f11: rows[2].alpha199,
        alpha199_avg: rows.reduce((a, r) => a + r.alpha199, 0) / rows.length,
      },
      notes: `Preview 199 thật (pipeline α thích nghi P2-198): bob-nearest → blend dọc (1−w)·bob + w·blurV(bob), w = deintVerticalBlendWeight(σ̂) → denoise α199 = α × m(M), M = motionEstimateFromBandLuma (C5b_box, khung này − khung trước) + denoiseMotionMultiplier (neo N5b 7,194 → 1,0; N10 13,803 → 1,08; kẹp [1,0; 1,12]). Đường 196 (α cố định) giữ làm đối chiếu hồi quy (MAD_bobfirst196_*). Fixture có nhiễu σ=15 trên nền testsrc2 (3 frame xen kẽ idx 3/7/11); σ̂ đo trên khung nguồn xen kẽ bằng estimator P2 (F-194-P4-2); M đo trên cùng khung nguồn xen kẽ (khung i − khung i−1). Tiêu chí: tier KHỚP/XẤP XỈ (trung bình 3 frame, preview 199) + MAD preview-199 < MAD tap trung bình + |ΔR|/R ≤ 15% ở mọi frame. Đối chiếu số sim P2-198 §5 (C5b_box: N5b 6,810/0,109).`,
    });
  }
  // N5c — bob LUÂN PHIÊN mode 1 @60fps (P2-194: MediaItem.fps +
  // deintBobFieldForConsumedTime/ForOutputFrame): preview luân phiên
  // top/bottom theo frame output vs truth yadif mode=1 (60fps); đối
  // chiếu top-only (hành vi cũ). Field lấy bằng ĐÚNG hàm P2 ship,
  // không tự tính parity.
  {
    const yadif1 = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePreChain({deinterlace:{mode:1}})`).replace(/^,/, "");
    const truth60 = (() => {
      const out = path.join(TMP, "deint-truth60.rgb");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interYuv, "-vf", `${yadif1},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif mode=1 60fps");
      const all = fs.readFileSync(out);
      return { f14: Buffer.from(all.subarray(14 * w * h * 3, 15 * w * h * 3)), f15: Buffer.from(all.subarray(15 * w * h * 3, 16 * w * h * 3)), nFrames: all.length / (w * h * 3) };
    })();
    const src7 = frameRgb(interYuv, idx);
    const field14 = deintBobFieldForOutputFrame(14, 60, 30);
    const field15 = deintBobFieldForOutputFrame(15, 60, 30);
    const alt14 = deintBobFieldSim(src7, w, h, divisor, field14);
    const alt15 = deintBobFieldSim(src7, w, h, divisor, field15);
    const top14 = deintBobSim(src7, w, h, divisor);
    const top15 = deintBobSim(src7, w, h, divisor);
    const mAlt14 = compareFrames(truth60.f14, alt14, w, h);
    const mAlt15 = compareFrames(truth60.f15, alt15, w, h);
    const mTop14 = compareFrames(truth60.f14, top14, w, h);
    const mTop15 = compareFrames(truth60.f15, top15, w, h);
    const madAlt = (mAlt14.mad + mAlt15.mad) / 2;
    const madTop = (mTop14.mad + mTop15.mad) / 2;
    const le8Alt = ((mAlt14.le8 + mAlt15.le8) / 2) * 100;
    const le8Top = ((mTop14.le8 + mTop15.le8) / 2) * 100;
    const le32Alt = ((mAlt14.le32 + mAlt15.le32) / 2) * 100;
    const tierAlt = madAlt <= 2 && le8Alt >= 99 ? "KHỚP" : madAlt <= 20 && le32Alt >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    record({
      id: "N5c-deint-bob-alternating",
      name: `deint bob luân phiên mode 1 @60fps (P2-194) — field theo deintBobFieldForOutputFrame vs render ${yadif1}, frame nguồn 8 → output 14/15`,
      verdict: (tierAlt === "KHỚP" || tierAlt === "XẤP XỈ") && madAlt < madTop ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierAlt,
      numbers: {
        MAD_alternating_avg: madAlt, MAD_toponly_avg: madTop, MAD_alternating_minus_toponly: madAlt - madTop,
        MAD_alt_f14_top: mAlt14.mad, MAD_alt_f15_bottom: mAlt15.mad,
        le8_alternating_avg_pct: le8Alt, le8_toponly_avg_pct: le8Top, le32_alternating_avg_pct: le32Alt,
        field_f14: field14, field_f15: field15, truth60_frames: truth60.nFrames,
      },
      notes: `Field lấy bằng đúng hàm P2-194 ship (deintBobFieldForOutputFrame(14/15, 60, 30) = ${field14}/${field15} — luân phiên khi projFps = 2×inputFps; proj 30fps/nguồn 30fps luôn top, khớp đo đợt 193 MAD 0,000). Claim P2-194 (probe-194-p2a): MAD top-only 2,888 → luân phiên 2,297, le8 94% → 95%, vẫn tier XẤP XỈ. Tiêu chí: tier KHỚP/XẤP XỈ + MAD luân phiên < MAD top-only trên cùng fixture.`,
    });
  }
  // N10 — bob-first vs tap trên FIXTURE CHUYỂN ĐỘNG (quyết (a1)-194,
  // nợ F-194-P4-3): trên fixture testsrc2+nhiễu của P4-194, tap cũ thắng
  // bob-first 0,13 MAD (1,9%) ở cả 3/3 frame — mâu thuẫn P2-193 (bob-first
  // thắng 12/12 ô). P2-195 probe lại trên fixture chuyển động; P4 đo
  // ĐỘC LẬP bằng fixture chuyển động MẠNH HƠN: cửa sổ crop 320×180
  // trượt ngang 3 px/frame trên testsrc2 640×180 (mọi pixel dịch chuyển
  // giữa các field) + nhiễu σ=15, cùng pipeline N5b (bob-nearest →
  // denoise α từ σ̂ trên khung nguồn xen kẽ vs truth yadif→hqdn3d
  // s=0,5; đối chiếu tap +0,5px).
  // Verdict ĐỘC LẬP: tier + bob-first < tap trên fixture này — KHÔNG
  // suy ra từ số của P2-195; số P2-195 chỉ đối chiếu sau (xem LIMITS).
  {
    const motionCleanYuv = path.join(TMP, "deint-motion-clean.yuv");
    ff(["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=640x${h}:rate=30:duration=1`,
      "-vf", "crop=320:180:3*n:0,scale=out_color_matrix=bt709,format=yuv420p", "-f", "rawvideo", "-pix_fmt", "yuv420p", motionCleanYuv], "testsrc2 crop-slide clean");
    const s10 = 0.5;
    const noisyFrames10: Buffer[] = [];
    for (let f = 0; f < 30; f++) {
      const baseF = frameRgb(motionCleanYuv, f);
      const rngF = mulberry32(19100 + f);
      const nb = Buffer.alloc(w * h * 3);
      for (let i = 0; i < nb.length; i++)
        nb[i] = Math.max(0, Math.min(255, Math.round(baseF[i] + 15 * gauss(rngF))));
      noisyFrames10.push(nb);
    }
    const noisyIn10 = path.join(TMP, "deint-motion-noisy.rgb");
    fs.writeFileSync(noisyIn10, Buffer.concat(noisyFrames10));
    const noisyYuv10 = path.join(TMP, "deint-motion-noisy.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyIn10, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", noisyYuv10], "motion noisy rgb->yuv");
    const interNoisyYuv10 = path.join(TMP, "deint-motion-interno.yuv");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyYuv10, "-vf", "interlace=scan=tff:lowpass=0",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", interNoisyYuv10], "interlace motion noisy");
    const hq10 = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePostChain({denoise:{strength:${s10}}})`).replace(/^,/, "");
    const truthAll10 = (() => {
      const out = path.join(TMP, "deint-motion-truth.rgb");
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interNoisyYuv10, "-vf", `${yadif},${hq10},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yadif+hqdn3d motion truth");
      return fs.readFileSync(out);
    })();
    const truthAt10 = (i: number): Buffer => Buffer.from(truthAll10.subarray(i * w * h * 3, (i + 1) * w * h * 3));
    const rows10: Array<{ i: number; mBf: number; mTap: number; mBf196: number; mBf199: number; mBfF: number; vbW: number; le8Bf: number; le32Bf: number; le8Bf196: number; le32Bf196: number; le8Bf199: number; le32Bf199: number; rRel: number; rRel196: number; rRel199: number; sigmaHat: number; k: number; alpha: number; motion: number | null; motionK: number; alpha199: number }> = [];
    for (const i of [3, 7, 11]) {
      const truthRgb = truthAt10(i);
      const srcNoisyRgb = frameRgb(interNoisyYuv10, i);
      const bobNoisy = deintBobSim(srcNoisyRgb, w, h, divisor);
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let p = 0; p < w * h; p++) {
        rgba[p * 4] = srcNoisyRgb[p * 3];
        rgba[p * 4 + 1] = srcNoisyRgb[p * 3 + 1];
        rgba[p * 4 + 2] = srcNoisyRgb[p * 3 + 2];
        rgba[p * 4 + 3] = 255;
      }
      const sigmaHat = estimateNoiseSigmaFromRgba(rgba, w, h);
      const k = denoiseAdaptiveK(s10, sigmaHat);
      const wf = denoiseWarmupFactor(3, s10, sigmaHat);
      const alpha = denoiseBlendAlpha(s10) * k * wf;
      // Đợt 198 P2 — α thích nghi theo chuyển động (quyết (a1)-197): ước
      // lượng C5b_box giữa khung này và khung trước (hàm thuần P2 ship)
      // rồi nhân α (α199 = α × m(M)); khung i−1 luôn có (i ≥ 3).
      const rgbaPrev = new Uint8ClampedArray(w * h * 4);
      {
        const prevRgb = frameRgb(interNoisyYuv10, i - 1);
        for (let p = 0; p < w * h; p++) {
          rgbaPrev[p * 4] = prevRgb[p * 3];
          rgbaPrev[p * 4 + 1] = prevRgb[p * 3 + 1];
          rgbaPrev[p * 4 + 2] = prevRgb[p * 3 + 2];
          rgbaPrev[p * 4 + 3] = 255;
        }
      }
      const motion = motionEstimateFromBandLuma(motionBandLumaFromRgba(rgba, w, h), motionBandLumaFromRgba(rgbaPrev, w, h), w);
      const motionK = motion === null ? 1 : denoiseMotionMultiplier(motion);
      const alpha199 = alpha * motionK;
      const prevBf = denoisePreviewComposite(bobNoisy, w, h, s10, alpha);
      const tapNoisy = tapShiftVerticalSim(bobNoisy, w, h, 0.5);
      const prevTap = denoisePreviewComposite(tapNoisy, w, h, s10, alpha);
      // Preview 196 thật (P2-196): blend dọc w(σ̂) sau bob rồi mới denoise.
      const vbW = deintVerticalBlendWeight(sigmaHat);
      const prevBf196 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha, vbW);
      // Preview 199 thật (pipeline α thích nghi P2-198): cùng pipeline 196 nhưng α thích nghi.
      const prevBf199 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha199, vbW);
      // Phản thực: w=0,75 cưỡng bức mọi frame — kiểm ngưỡng σ̂≥8 có phải
      // nút thắt không (xem F-196-P4-2).
      const prevBfF = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha, 0.75);
      const mBf = compareFrames(truthRgb, prevBf, w, h);
      const mTap = compareFrames(truthRgb, prevTap, w, h);
      const mBf196 = compareFrames(truthRgb, prevBf196, w, h);
      const mBf199 = compareFrames(truthRgb, prevBf199, w, h);
      const mBfF = compareFrames(truthRgb, prevBfF, w, h);
      const rTruth = combingRLuma(truthRgb, w, h);
      const rBf = combingRLuma(prevBf, w, h);
      const rBf196 = combingRLuma(prevBf196, w, h);
      const rBf199 = combingRLuma(prevBf199, w, h);
      rows10.push({ i, mBf: mBf.mad, mTap: mTap.mad, mBf196: mBf196.mad, mBf199: mBf199.mad, mBfF: mBfF.mad, vbW, le8Bf: mBf.le8 * 100, le32Bf: mBf.le32 * 100, le8Bf196: mBf196.le8 * 100, le32Bf196: mBf196.le32 * 100, le8Bf199: mBf199.le8 * 100, le32Bf199: mBf199.le32 * 100, rRel: Math.abs(rBf - rTruth) / rTruth, rRel196: Math.abs(rBf196 - rTruth) / rTruth, rRel199: Math.abs(rBf199 - rTruth) / rTruth, sigmaHat, k, alpha, motion, motionK, alpha199 });
    }
    const madBfAvg10 = rows10.reduce((a, r) => a + r.mBf, 0) / rows10.length;
    const madTapAvg10 = rows10.reduce((a, r) => a + r.mTap, 0) / rows10.length;
    const le8BfAvg10 = rows10.reduce((a, r) => a + r.le8Bf, 0) / rows10.length;
    const le32BfAvg10 = rows10.reduce((a, r) => a + r.le32Bf, 0) / rows10.length;
    const rRelWorst10 = Math.max(...rows10.map((r) => r.rRel));
    const madBf196Avg10 = rows10.reduce((a, r) => a + r.mBf196, 0) / rows10.length;
    const le8Bf196Avg10 = rows10.reduce((a, r) => a + r.le8Bf196, 0) / rows10.length;
    const le32Bf196Avg10 = rows10.reduce((a, r) => a + r.le32Bf196, 0) / rows10.length;
    const rRel196Worst10 = Math.max(...rows10.map((r) => r.rRel196));
    const tierBf196Avg10 = madBf196Avg10 <= 2 && le8Bf196Avg10 >= 99 ? "KHỚP" : madBf196Avg10 <= 20 && le32Bf196Avg10 >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    // Đường 199 (verdict): cùng pipeline 196 nhưng α thích nghi.
    const madBf199Avg10 = rows10.reduce((a, r) => a + r.mBf199, 0) / rows10.length;
    const le8Bf199Avg10 = rows10.reduce((a, r) => a + r.le8Bf199, 0) / rows10.length;
    const le32Bf199Avg10 = rows10.reduce((a, r) => a + r.le32Bf199, 0) / rows10.length;
    const rRel199Worst10 = Math.max(...rows10.map((r) => r.rRel199));
    const tierBf199Avg10 = madBf199Avg10 <= 2 && le8Bf199Avg10 >= 99 ? "KHỚP" : madBf199Avg10 <= 20 && le32Bf199Avg10 >= 90 ? "XẤP XỈ" : "CHƯA ĐẠT";
    record({
      id: "N10-motion-bob-first",
      name: `deint bob-first 199 trên FIXTURE CHUYỂN ĐỘNG (quyết (a1)-197) — testsrc2 crop trượt 3px/frame + nhiễu σ=15, bob-nearest + blend dọc w(σ̂) rồi denoise α×m(M) vs render yadif→${hq10}, 3 frame`,
      verdict: (tierBf199Avg10 === "KHỚP" || tierBf199Avg10 === "XẤP XỈ") && madBf199Avg10 < madTapAvg10 && rRel199Worst10 <= 0.15 ? "ĐẠT" : "CHƯA ĐẠT",
      tier: tierBf199Avg10,
      numbers: {
        MAD_bobfirst199_avg: madBf199Avg10, MAD_tap_avg: madTapAvg10, MAD_bobfirst199_minus_tap_avg: madBf199Avg10 - madTapAvg10,
        MAD_bobfirst199_f3: rows10[0].mBf199, MAD_tap_f3: rows10[0].mTap,
        MAD_bobfirst199_f7: rows10[1].mBf199, MAD_tap_f7: rows10[1].mTap,
        MAD_bobfirst199_f11: rows10[2].mBf199, MAD_tap_f11: rows10[2].mTap,
        MAD_bobfirst196_avg: madBf196Avg10, MAD_bobfirst196_minus_tap_avg: madBf196Avg10 - madTapAvg10,
        MAD_bobfirst196_f3: rows10[0].mBf196, MAD_bobfirst196_f7: rows10[1].mBf196, MAD_bobfirst196_f11: rows10[2].mBf196,
        MAD_bobfirst_old_avg: madBfAvg10, MAD_bobfirst_old_minus_tap_avg: madBfAvg10 - madTapAvg10,
        MAD_bobfirst196_forced075_avg: rows10.reduce((a, r) => a + r.mBfF, 0) / rows10.length, MAD_bobfirst196_forced075_f3: rows10[0].mBfF, MAD_bobfirst196_forced075_f7: rows10[1].mBfF, MAD_bobfirst196_forced075_f11: rows10[2].mBfF,
        le8_bobfirst199_avg_pct: le8Bf199Avg10, le32_bobfirst199_avg_pct: le32Bf199Avg10, R_rel_diff_worst199: rRel199Worst10, tier_bobfirst196: tierBf196Avg10, tier_bobfirst199: tierBf199Avg10,
        le8_bobfirst196_avg_pct: le8Bf196Avg10, le32_bobfirst196_avg_pct: le32Bf196Avg10, R_rel_diff_worst196: rRel196Worst10,
        le8_bobfirst_old_avg_pct: le8BfAvg10, le32_bobfirst_old_avg_pct: le32BfAvg10, R_rel_diff_worst_old: rRelWorst10,
        vertical_blend_w_f3: rows10[0].vbW, vertical_blend_w_f7: rows10[1].vbW, vertical_blend_w_f11: rows10[2].vbW,
        sigma_hat_f3: rows10[0].sigmaHat, sigma_hat_f7: rows10[1].sigmaHat, sigma_hat_f11: rows10[2].sigmaHat,
        sigma_hat_src_avg: rows10.reduce((a, r) => a + r.sigmaHat, 0) / rows10.length,
        adaptive_k_avg: rows10.reduce((a, r) => a + r.k, 0) / rows10.length,
        alpha_avg: rows10.reduce((a, r) => a + r.alpha, 0) / rows10.length,
        motion_estimate_f3: rows10[0].motion ?? -1, motion_estimate_f7: rows10[1].motion ?? -1, motion_estimate_f11: rows10[2].motion ?? -1,
        motion_multiplier_f3: rows10[0].motionK, motion_multiplier_f7: rows10[1].motionK, motion_multiplier_f11: rows10[2].motionK,
        alpha199_f3: rows10[0].alpha199, alpha199_f7: rows10[1].alpha199, alpha199_f11: rows10[2].alpha199,
        alpha199_avg: rows10.reduce((a, r) => a + r.alpha199, 0) / rows10.length,
      },
      notes: `Preview 199 thật (pipeline α thích nghi P2-198): bob-nearest → blend dọc w = deintVerticalBlendWeight(σ̂) → denoise α199 = α × m(M), M = motionEstimateFromBandLuma (C5b_box, khung này − khung trước) + denoiseMotionMultiplier (neo N5b 7,194 → 1,0; N10 13,803 → 1,08; kẹp [1,0; 1,12]). Đường 196 (α cố định) giữ làm đối chiếu hồi quy (MAD_bobfirst196_* — kỳ vọng 6,240/0,155 CHƯA ĐẠT như đợt 197). Fixture chuyển động: testsrc2 + crop trượt ngang 3 px/frame — mọi pixel dịch chuyển giữa các field, mạnh hơn fixture N5b. Cùng pipeline N5b: σ̂ đo trên khung nguồn xen kẽ (F-194-P4-2), α = a·k·w·m. Tiêu chí: tier KHỚP/XẤP XỈ (trung bình 3 frame, preview 199) + MAD preview-199 < MAD tap trung bình + |ΔR|/R ≤ 15%. Đối chiếu số sim P2-198 §5 (C5b_box: N10 6,126/0,082 ĐẠT, N5b 6,810/0,109 ĐẠT; m N10 1,093/1,091/1,056) — verdict này ĐỘC LẬP với số P2-198; f11 KHÔNG phải outlier (P2-198 §4: f12–f14 tệ hơn) nên GIỮ frame, KHÔNG đổi bar 0,15 (quyết (a1)-197).`,
    });
  }
  // N5d — blend dọc sau bob (P2-196): trọng số + cổng tap theo plan thật.
  // Đợt 198 P2: khóa thêm plan α thích nghi (motionEstimate → multiplier).
  {
    const wNoisy = deintVerticalBlendWeight(8.14);
    const wClean = deintVerticalBlendWeight(2.0);
    const wNull = deintVerticalBlendWeight(null);
    const wEdge = deintVerticalBlendWeight(2.7);
    const wUnder = deintVerticalBlendWeight(2.69);
    const planNoisy = enhancePreviewPlan({ deinterlace: true }, true, false, 1, undefined, 8.14);
    const planClean = enhancePreviewPlan({ deinterlace: true }, true, false, 1, undefined, 2.0);
    const planSmall = enhancePreviewPlan({ deinterlace: true }, true, false, 0.5, undefined, 9);
    const planMotionBase = enhancePreviewPlan({ deinterlace: true, denoise: { strength: 0.5 } }, true, false, 1, 3, 8.14);
    const planMotion = enhancePreviewPlan({ deinterlace: true, denoise: { strength: 0.5 } }, true, false, 1, 3, 8.14, undefined, undefined, 13.803);
    const ok = wNoisy === 0.8 && wClean === 0 && wNull === 0 && wEdge === 0.8 && wUnder === 0 &&
      planNoisy.deintVerticalBlend === 0.8 && planNoisy.deinterlaceTap &&
      planClean.deintVerticalBlend === 0 && planSmall.deintVerticalBlend === 0 && !planSmall.deinterlaceTap &&
      planMotionBase.denoiseMotionMultiplier === 1 && planMotionBase.motionEstimate === null &&
      Math.abs(planMotion.denoiseMotionMultiplier - 1.08) < 1e-12 && planMotion.motionEstimate === 13.803 &&
      Math.abs(planMotion.denoiseBlendAlpha - planMotionBase.denoiseBlendAlpha * 1.08) < 1e-9;
    record({
      id: "N5d-deint-vertical-blend-plan",
      name: "blend dọc sau bob (P2-197): w=0,8 khi σ̂≥2,7, 0 khi sạch; chỉ khi tap áp (drawScaleY≥0,9)",
      verdict: ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { w_sigma_8_14: wNoisy, w_sigma_2: wClean, w_sigma_null: wNull, w_sigma_2_7: wEdge, w_sigma_2_69: wUnder, plan_noisy_blend: planNoisy.deintVerticalBlend, plan_noisy_tap: planNoisy.deinterlaceTap ? 1 : 0, plan_clean_blend: planClean.deintVerticalBlend, plan_small_blend: planSmall.deintVerticalBlend, plan_small_tap: planSmall.deinterlaceTap ? 1 : 0, plan_motion_multiplier_base: planMotionBase.denoiseMotionMultiplier, plan_motion_estimate_base: planMotionBase.motionEstimate ?? -1, plan_motion_multiplier_13803: planMotion.denoiseMotionMultiplier, plan_motion_estimate_13803: planMotion.motionEstimate ?? -1, plan_motion_alpha: planMotion.denoiseBlendAlpha, plan_base_alpha: planMotionBase.denoiseBlendAlpha },
      notes: `Hàm thuần deintVerticalBlendWeight(σ̂) + plan enhancePreviewPlan thật. Ngưỡng σ̂≥2,7 (P2 hiệu chuẩn lại từ 8,0 → 2,7 trong đợt 196 — F-196-P4-2 vách 8,0 ĐÃ SỬA). TRỌNG SỐ ĐỔI 0,75→0,8 trong đợt 197 (P2-197, ENHANCE_PREVIEW_DEINT_VERTICAL_BLEND_W): có số đo — w-sweep probe-197-p2a.json (20:47Z) N10 avg MAD 6,256 (w=0,75) → 6,240 (w=0,8), w=0,85: 6,237; P4-197 đo độc lập bằng harness khớp từng số (N10 6,240; N5b 6,803 ≈ 6,804 đợt 196). Bar N5d cập nhật theo giá trị thiết kế mới 0,8 — giá trị khóa LITERAL trong test + record (đổi lặng lần nữa sẽ FAIL và bắt cập nhật có ý thức). Bước nhảy, không ramp (chưa có số σ̂ 2–3,6 để hiệu chuẩn ramp). Rủi ro còn lại: texture mịn sạch có thể đọc σ̂ tới ~2–3 → dương tính giả, chi phí +0,044 MAD (P2 chấp nhận). Cổng tap: drawScaleY<0,9 → blend 0 dù nhiễu (downscale giấu răng cưa). MỚI đợt 198: plan khóa α thích nghi — motionEstimate 13,803 (neo cao N10) → multiplier đúng 1,08, α plan = α gốc × 1,08; không motion → multiplier 1, motionEstimate null.`,
    });
  }
}

// ---------------------------------------------------------------------------
// N2-sim — P1 pitch artifact: mô phỏng 2-delay shifter bằng số học thuần
// (hằng số + cấu trúc đúng code previewVoiceFx.ts; đã kiểm chứng với số
// Chrome của P1-191 — xem notes case N2a).
// ---------------------------------------------------------------------------
export function pitchShifterSim(f0: number, nSemi: number): { domFreq: number; errSt: number; amDepth: number; sidebandRatio: number; fLfo: number } {
  const sr = 48000;
  const r = Math.pow(2, nSemi / 12);
  const fLfo = Math.abs(r - 1) / PITCH_WINDOW_S;
  const sawGain = (r > 1 ? -PITCH_WINDOW_S / 2 : PITCH_WINDOW_S / 2) * SAW_GAIN_COMP;
  // Saw đã chuẩn hoá theo Chrome: PeriodicWave chuẩn hoá → độ dốc saw hiệu
  // dụng 43/s thay vì 50/s lý tưởng (P1-191 LIMITS §4.2). Dùng saw lý tưởng
  // (không chuẩn hoá) cho domFreq +12@440 = 939 Hz (sai +1.1 st) — SAI.
  const SAW_NORM = 43 / 50;
  const sawA = (theta: number): number => {
    const t = (((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    return SAW_NORM * (t / Math.PI - 1);
  };
  const sawB = (theta: number): number => sawA(theta + Math.PI);
  const T0 = -0.1;
  const T1 = 0.6;
  const N = Math.floor((T1 - T0) * sr);
  const x = new Float64Array(N);
  for (let i = 0; i < N; i++) { const t = T0 + i / sr; x[i] = Math.sin(2 * Math.PI * f0 * t); }
  const y = new Float64Array(N);
  const at = (tt: number): number => {
    const pos = (tt - T0) * sr;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    if (i0 < 0) return 0;
    if (i0 + 1 >= N) return x[N - 1];
    return x[i0] * (1 - frac) + x[i0 + 1] * frac;
  };
  for (let i = 0; i < N; i++) {
    const t = T0 + i / sr;
    const th = 2 * Math.PI * fLfo * t;
    const dA = Math.max(0, Math.min(0.1, PITCH_WINDOW_S / 2 + sawGain * sawA(th)));
    const dB = Math.max(0, Math.min(0.1, PITCH_WINDOW_S / 2 + sawGain * sawB(th)));
    const xfA = 0.5 * (1 - Math.cos(th));
    const xfB = 0.5 * (1 + Math.cos(th));
    y[i] = xfA * at(t - dA) + xfB * at(t - dB);
  }
  const a = Math.floor((0.1 - T0) * sr);
  const seg = y.subarray(a, N);
  const target = f0 * r;
  const peak = spectralPeak(seg, sr, target * 0.7, target * 1.4, 1);
  const errSt = 12 * Math.log2(peak.freq / target);
  const win = Math.floor(0.005 * sr);
  let mn = Infinity;
  let mx = -Infinity;
  for (let s0 = a; s0 + win <= N; s0 += win) {
    let ss = 0;
    for (let i = s0; i < s0 + win; i++) ss += y[i] * y[i];
    const rms = Math.sqrt(ss / win);
    mn = Math.min(mn, rms);
    mx = Math.max(mx, rms);
  }
  const amDepth = (mx - mn) / (mx + mn);
  const sb = (goertzelMag(seg, sr, peak.freq - fLfo) + goertzelMag(seg, sr, peak.freq + fLfo)) / 2 / peak.mag;
  return { domFreq: peak.freq, errSt, amDepth, sidebandRatio: sb, fLfo };
}
function sectionPitchArtifactSim(): void {
  console.log("== N2-sim pitch artifact (P1) — mô phỏng 2-delay shifter (hằng số từ code thật) ==");
  const cases: Array<{ f0: number; n: number }> = [
    { f0: 440, n: 12 },
    { f0: 440, n: -12 },
    { f0: 440, n: 7 },
    { f0: 440, n: -7 },
  ];
  const rows = cases.map((c) => ({ ...c, ...pitchShifterSim(c.f0, c.n) }));
  const worstErr = Math.max(...rows.map((r) => Math.abs(r.errSt)));
  const worstAm = Math.max(...rows.map((r) => r.amDepth));
  const worstSb = Math.max(...rows.map((r) => r.sidebandRatio));
  record({
    id: "N2a-pitch-artifact-440",
    name: "pitch artifact @440Hz (sim) — domFreq + AM depth + sideband, n=+12/-12/+7/-7",
    verdict: worstErr <= 0.5 && worstAm <= 0.35 && worstSb <= 0.25 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      worst_err_st: worstErr, worst_AM_depth: worstAm, worst_sideband_ratio: worstSb,
      domFreq_p12: rows[0].domFreq, err_p12_st: rows[0].errSt, AM_p12: rows[0].amDepth,
      domFreq_m12: rows[1].domFreq, err_m12_st: rows[1].errSt, AM_m12: rows[1].amDepth,
      domFreq_p7: rows[2].domFreq, err_p7_st: rows[2].errSt,
      domFreq_m7: rows[3].domFreq, err_m7_st: rows[3].errSt,
      PITCH_WINDOW_S, SAW_GAIN_COMP,
    },
    notes: `Sim đã kiểm chứng với số Chrome của P1-191/P1-192 (OfflineAudioContext): +12@440 sim 889 Hz (+0.18 st) vs Chrome 890.0–890.6 Hz (+0.20–0.21 st); -12@440 sim 215 Hz (-0.40 st) vs Chrome 213.9–215.0 Hz (-0.40–-0.49 st). Tiêu chí: |sai số| ≤ 0.5 st (mức của P1-191; P1-192 đo chính xác max 0.40 st) + AM depth ≤ 0.35 (P1-192 đo AM ở 440 Hz trong 0.10–0.30, cộng biên) + sideband ≤ 0.25. W=${PITCH_WINDOW_S}s, SAW_GAIN_COMP=${SAW_GAIN_COMP} đọc từ code thật. TỪ ĐỢT 196: 2-delay chỉ còn là FALLBACK khi PSOLA upgrade thất bại (previewVoiceFx upgradePitchToPsola); verdict đường chính ở N12/N12a/N2-headed.`,
  });
  // N2b — phụ thuộc tần số nền (caveat P1-191 §3.4, P1-192 §3.4): 220 Hz +12.
  const r220 = pitchShifterSim(220, 12);
  // Hàng phụ: -12@220 là case lệch tệ nhất của P1-192 (+1.51 st, 120 Hz) —
  // kiểm độc lập bằng sim (không đổi verdict, verdict chỉ theo +12).
  const r220m12 = pitchShifterSim(220, -12);
  record({
    id: "N2b-pitch-artifact-220",
    name: "pitch artifact @220Hz +12 (sim) — kiểm phụ thuộc tần số nền",
    verdict: Math.abs(r220.errSt) <= 1.0 && r220.amDepth <= 0.7 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: { domFreq: r220.domFreq, target_Hz: 440, err_st: r220.errSt, AM_depth: r220.amDepth, sideband_ratio: r220.sidebandRatio, minus12_domFreq: r220m12.domFreq, minus12_target_Hz: 110, minus12_err_st: r220m12.errSt, minus12_AM_depth: r220m12.amDepth },
    notes: `Baseline P1-192 (§3.1/§3.4, đo Chrome chính xác): 220 Hz +12 → 420 Hz (-0.81 st); AM ở 220 Hz trong 0.51–0.67; -12 → 120 Hz (+1.51 st, triệt răng trung tâm). Tiêu chí ĐẠT là KHÔNG HỒI QUY so với baseline đó (|err| ≤ 1.0 st, AM ≤ 0.7) — không phải bar ±0.5 st như 440 Hz, vì đây là giới hạn nội tại của thiết kế 2-delay mà P1-192 đã chứng minh không sửa được bằng tham số (SAW_GAIN_COMP giữ 50/43). Sim baseline code 191: domFreq 419 Hz (-0.85 st), AM 0.311. Hàng phụ -12@220 (sim): kiểm độc lập claim +1.51 st của P1-192.`,
  });
  // N9a — ĐƯỜNG CONG trade-off pitch W=0,08 (P1-195 map f0 220–660 Hz):
  // sim 20 điểm f0 ∈ {220,330,440,550,660} × n ∈ {+12,−12,+7,−7} bằng
  // đúng pitchShifterSim (hằng số từ code thật). Lượng tử hoá răng lược:
  // răng cách nhau fLfo = |r−1|/W (vd +12: 12,5 Hz; +7: 6,24 Hz) nên
  // domFreq "dính" răng gần mục tiêu nhất — errSt chính là sai số lượng
  // tử hoá. Verdict theo bar sai số ≤ 0,5 st ở cả 20 điểm; AM ghi theo
  // từng f0 để đối chiếu với map headed của P1-195 (AM@440 vượt bar 0,35
  // là trade-off đã quyết — verdict AM vẫn nằm ở N2a/N2-headed, không
  // lặp lại ở đây để tránh đếm trùng một lỗi thành hai CHƯA ĐẠT).
  {
    const grid: Array<{ f0: number; n: number }> = [];
    for (const f0 of [220, 330, 440, 550, 660])
      for (const n of [12, -12, 7, -7]) grid.push({ f0, n });
    const rows = grid.map((c) => ({ ...c, ...pitchShifterSim(c.f0, c.n) }));
    const worstErr = Math.max(...rows.map((r) => Math.abs(r.errSt)));
    const worstAm = Math.max(...rows.map((r) => r.amDepth));
    const nums: Record<string, number> = { worst_err_st: worstErr, worst_AM_depth: worstAm };
    for (const f0 of [220, 330, 440, 550, 660]) {
      const sub = rows.filter((r) => r.f0 === f0);
      nums[`worst_err_${f0}_st`] = Math.max(...sub.map((r) => Math.abs(r.errSt)));
      nums[`worst_AM_${f0}`] = Math.max(...sub.map((r) => r.amDepth));
      for (const r of sub) {
        const s = r.n > 0 ? `p${r.n}` : `m${-r.n}`;
        nums[`err_${f0}_${s}_st`] = r.errSt;
        nums[`AM_${f0}_${s}`] = r.amDepth;
        nums[`domFreq_${f0}_${s}_Hz`] = r.domFreq;
      }
    }
    record({
      id: "N9a-pitch-curve-sim",
      name: "pitch trade-off curve W=0,08 (sim) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm",
      verdict: worstErr <= 0.5 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: nums,
      notes: `Sim 2-delay (hằng số từ code thật, W=${PITCH_WINDOW_S}s). Sai số lượng tử hoá = errSt: domFreq dính răng lược cách nhau fLfo = |r−1|/W (n=+12: 12,5 Hz; n=+7: 6,24 Hz; n=−12: 12,5 Hz; n=−7: 6,24 Hz). Tiêu chí: |err| ≤ 0,5 st ở cả 20 điểm. AM theo từng f0 chỉ đối chiếu với map headed P1-195 (không verdict AM ở đây — xem N2a/N2-headed). Kỳ vọng từ P1-194 §1: 440 Hz err ≤ 0,40 st; 220 Hz err ≤ 0,40 st (trừ −12: −0,40 st sau W=0,08); 880 Hz err ≤ 0,10 st — các f0 mới 330/550/660 chưa có baseline, sim này là baseline độc lập đầu tiên.`,
    });
  }
}

// ---------------------------------------------------------------------------
// N1 + N2-headed — đọc JSON từ headed-voice-check195.mjs (Chrome thật,
// OfflineAudioContext qua createVoiceChain thật). Render đo trong section
// này bằng ffmpeg (cùng tín hiệu 5-tone) để so trực tiếp.
// ---------------------------------------------------------------------------
interface HeadedVoiceJson {
  generatedAt?: string;
  telephone?: { freqs: number[]; previewDb: number[] };
  pitch?: Array<{ f0: number; nSemi: number; domFreq: number; errSt: number; amDepth: number; sidebandRatio: number }>;
  error?: string;
}
function sectionHeadedVoice(outDir: string): void {
  console.log("== N1/N2-headed voice (P1) — JSON từ headed-voice-check195.mjs (Chrome OfflineAudioContext) ==");
  const file201 = path.join(outDir, "headed-voice201.json");
  const file195 = path.join(HIDDEN195, "headed-voice195.json");
  let j: HeadedVoiceJson | null = null;
  let voiceProv = "";
  const loadVoice = (f: string): HeadedVoiceJson | null => {
    try {
      const v = JSON.parse(fs.readFileSync(f, "utf8")) as HeadedVoiceJson;
      return v && !v.error && v.telephone && v.pitch ? v : null;
    } catch { return null; }
  };
  j = loadVoice(file201);
  if (j) voiceProv = "201";
  if (!j) {
    // Fallback hồi quy: chỉ dùng dữ liệu headed 195 khi code voice chưa
    // đổi (previewVoiceFx.ts mtime vẫn mốc 195). Code đã đổi mà chưa có
    // probe 196 → GHI NHẬN, KHÔNG verdict từ số cũ (PSOLA mới của P1-196/197
    // làm dữ liệu WSOLA cũ hết hiệu lực).
    let vfUnchanged = false;
    try { vfUnchanged = fs.statSync(path.join(REPO, "apps/web/src/lib/previewVoiceFx.ts")).mtimeMs <= VOICE_MTIME_195 + 1000; } catch { vfUnchanged = false; }
    if (vfUnchanged) { j = loadVoice(file195); if (j) voiceProv = "195-regression"; }
  }
  const voiceProvNote = voiceProv === "201"
    ? "Nguồn headed: probe P1-201 (mới)."
    : "Nguồn headed: dữ liệu 195 — HỒI QUY (code voice chưa đổi kể từ mốc P4-195, chờ probe P1-201).";
  if (!j) {
    for (const [id, name] of [
      ["N1-telephone-gain-headed", "telephone gain preview vs render (headed Chrome) — JSON headed-voice201.json"],
      ["N2-headed-pitch", "pitch artifact headed (Chrome OfflineAudioContext qua chain thật)"],
      ["N2c-pitch-220m12-headed", "pitch headed: triệt răng sine trầm — 220Hz -12/-7 + 880Hz ±12"],
      ["N9b-pitch-curve-headed", "pitch trade-off curve headed (Chrome) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm"],
    ] as const) {
      record({
        id, name, verdict: "GHI NHẬN", numbers: {},
        notes: `Chưa có headed-voice201.json và code voice ĐÃ ĐỔI so với mốc P4-195 (previewVoiceFx.ts mtime > 2026-11-25T20:56:13Z) — dữ liệu headed 195 là WSOLA cũ, không còn hiệu lực cho PSOLA mới. Chạy lại harness sau khi P1-200 publish probe headed-voice201.json. KHÔNG verdict từ số cũ.`,
      });
    }
    return;
  }
  const tel: NonNullable<HeadedVoiceJson["telephone"]> = j.telephone!;
  const pitchArr: NonNullable<HeadedVoiceJson["pitch"]> = j.pitch!;
  // Render telephone trên cùng tín hiệu 5-tone (100/440/1000/5000/8000).
  const freqs = tel.freqs;
  const multi = path.join(TMP, "n1-multi.wav");
  // Amp 0.2/tone như S4 (đợt 191 dùng 0.5/tone gây clip pcm_s16le).
  writeSineWav(multi, freqs, freqs.map(() => 0.2), 1.0);
  const f = voiceFilter(JSON.stringify({ telephone: true }));
  const out = path.join(TMP, "n1-tel.wav");
  applyAudioFilter(multi, f, out);
  const { samples: segR } = decodeAudioToPcm(out);
  const dryPcm = decodeAudioToPcm(multi).samples;
  const sr = 48000;
  const segRs = segR.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
  const segDry = dryPcm.subarray(Math.floor(0.2 * sr), Math.floor(0.8 * sr));
  const renderDb = freqs.map((fr) => 20 * Math.log10(goertzelMag(segRs, sr, fr) / goertzelMag(segDry, sr, fr)));
  const deltas = freqs.map((_, i) => tel!.previewDb[i] - renderDb[i]);
  const maxAbs = Math.max(...deltas.map((d) => Math.abs(d)));
  record({
    id: "N1-telephone-gain-headed",
    name: "telephone gain preview (Chrome, chain thật) vs render (ffmpeg) theo tần số",
    verdict: maxAbs <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      max_abs_delta_dB: maxAbs,
      delta_100Hz_dB: deltas[0], delta_440Hz_dB: deltas[1], delta_1000Hz_dB: deltas[2],
      delta_5000Hz_dB: deltas[3], delta_8000Hz_dB: deltas[4],
      preview_440Hz_dB: tel.previewDb[1], render_440Hz_dB: renderDb[1],
      preview_5000Hz_dB: tel.previewDb[3], render_5000Hz_dB: renderDb[3],
      headed_source: voiceProv,
    },
    notes: `Đo headed: OfflineAudioContext 48kHz qua createVoiceChain thật (telephone-only, SAU bù g=0,76 của P1-193 — parent duyệt §14.2-192) vs render ffmpeg ${f}. Kỳ vọng từ P1-192 §2.3 (minimax g=0,76, sai tối đa 18,5% ≈ 1,47 dB trên đường cong 9 điểm): Δ 5 điểm = Δ cũ − 2,39 dB → 100Hz ≈ −1,80; 440Hz ≈ +0,21; 1000Hz ≈ −1,48; 5000Hz ≈ +0,05; 8000Hz ≈ −1,56 (Δ cũ đợt 192: +0,59/+2,60/+0,91/+2,44/+0,83). Max |Δ| kỳ vọng ≈ 1,8 dB @100Hz. Tiêu chí ĐẠT: max |Δ| ≤ 2 dB (bar VẪN ĐỨNG theo quyết (o)-192). ${voiceProvNote}`,
  });
  // Headed pitch: verdict riêng 440 Hz (bar chặt) và 220 Hz (bar không hồi quy).
  const pitch440 = pitchArr.filter((p) => p.f0 === 440);
  const pitch220 = pitchArr.find((p) => p.f0 === 220 && p.nSemi === 12);
  const m12_220 = pitchArr.find((p) => p.f0 === 220 && p.nSemi === -12);
  const m7_220 = pitchArr.find((p) => p.f0 === 220 && p.nSemi === -7);
  const p12_880 = pitchArr.find((p) => p.f0 === 880 && p.nSemi === 12);
  const m12_880 = pitchArr.find((p) => p.f0 === 880 && p.nSemi === -12);
  const worstErr440 = Math.max(...pitch440.map((p) => Math.abs(p.errSt)));
  const worstAm440 = Math.max(...pitch440.map((p) => p.amDepth));
  const worstSb440 = Math.max(...pitch440.map((p) => p.sidebandRatio));
  const p12 = pitchArr.find((p) => p.f0 === 440 && p.nSemi === 12);
  const m12 = pitchArr.find((p) => p.f0 === 440 && p.nSemi === -12);
  const ok220 = pitch220 !== undefined && Math.abs(pitch220.errSt) <= 1.0 && pitch220.amDepth <= 0.7;
  record({
    id: "N2-headed-pitch",
    name: "pitch artifact headed (Chrome OfflineAudioContext qua chain thật) — 440Hz +12/-12/+7/-7 + 220Hz +12",
    verdict: worstErr440 <= 0.5 && worstAm440 <= 0.35 && worstSb440 <= 0.25 && ok220 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      worst_err_440_st: worstErr440, worst_AM_440: worstAm440, worst_sideband_440: worstSb440,
      domFreq_p12_440: p12?.domFreq ?? -1, err_p12_st: p12?.errSt ?? -99,
      domFreq_m12_440: m12?.domFreq ?? -1, err_m12_st: m12?.errSt ?? -99,
      domFreq_p12_220: pitch220?.domFreq ?? -1, err_p12_220_st: pitch220?.errSt ?? -99,
      AM_p12_220: pitch220?.amDepth ?? -1, ok_220_no_regression: ok220 ? 1 : 0, headed_source: voiceProv,
    },
    notes: `Đo headed qua chain thật (không sim), phương pháp P1-193 §2.2: render 4 s, cửa sổ [1,0, 3,5)s, đỉnh phổ Goertzel 0,25 Hz + nội suy parabol log-mag (≈ FFT zero-pad 2^18 của P1), AM = RMS khối 5 ms trên cùng cửa sổ (F-193-P4-2: bản probe cũ dùng cửa sổ [0,2, 1,0)s + bước 1 Hz + fLfo cứng /0,04 nên đo sai sau khi W → 0,08). Baseline P1-193 (§2.2, W=0,08): 440 Hz tần trội y hệt W=0,04 (215/290,3/327,1/414,7/466,8/590,7/664,2/890) nhưng AM 0,10–0,30 → 0,37–0,72 (triệt răng xen kẽ — trade-off đã ghi của P1, bar AM ≤ 0,35 VẪN ĐỨNG nên AM vượt bar là CHƯA ĐẠT); 220 Hz +12: 420 → 445 Hz (−0,81 → +0,20 st), AM 0,30 → 0,17. Tiêu chí 440 Hz: |err| ≤ 0.5 st + AM ≤ 0.35 + sideband ≤ 0.25; 220 Hz +12: bar không hồi quy (|err| ≤ 1.0 st, AM ≤ 0.7). Đối chiếu N2-sim: sim phải khớp headed trong ~0.1 st ở 440 Hz (sim +12 889 vs Chrome 890; −12 215 vs 215). ${voiceProvNote}`,
  });
  // N2c — claim headline của P1-193: triệt răng ở sine trầm 220 Hz ĐÃ SỬA
  // (−12@220: 120 Hz/+1,51 st → 107,5 Hz/−0,40 st) + 880 Hz tốt lên.
  const okM12_220 = m12_220 !== undefined && Math.abs(m12_220.errSt) <= 0.5 && m12_220.amDepth <= 0.7;
  record({
    id: "N2c-pitch-220m12-headed",
    name: "pitch headed: triệt răng sine trầm — 220Hz -12/-7 + 880Hz ±12 (claim P1-193 §2.3)",
    verdict: okM12_220 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      domFreq_m12_220: m12_220?.domFreq ?? -1, err_m12_220_st: m12_220?.errSt ?? -99, AM_m12_220: m12_220?.amDepth ?? -1,
      domFreq_m7_220: m7_220?.domFreq ?? -1, err_m7_220_st: m7_220?.errSt ?? -99, AM_m7_220: m7_220?.amDepth ?? -1,
      domFreq_p12_880: p12_880?.domFreq ?? -1, err_p12_880_st: p12_880?.errSt ?? -99, AM_p12_880: p12_880?.amDepth ?? -1,
      domFreq_m12_880: m12_880?.domFreq ?? -1, err_m12_880_st: m12_880?.errSt ?? -99, AM_m12_880: m12_880?.amDepth ?? -1, headed_source: voiceProv,
    },
    notes: `Claim P1-193 (§2.3, phương pháp [1,0, 3,5)s): 220/−12 → 107,5 Hz (−0,40 st, răng lược gần mục tiêu nhất với W=0,08), AM 0,51 → 0,16; 220/−7 → 145,2 Hz (−0,20 st); 880/−12 → 442,5 Hz (+0,10 st), 880/+12 → 1755 Hz (−0,05 st). Tiêu chí verdict: 220/−12 |err| ≤ 0,5 st + AM ≤ 0,7 (bar không hồi quy như +12@220); các điểm còn lại chỉ đối chiếu số, không verdict riêng. ${voiceProvNote}`,
  });
  // N9b — ĐƯỜNG CONG trade-off pitch headed (P1-195 map f0 220–660 Hz):
  // 22 điểm headed từ probe-voice195.ts (9 điểm cũ + 220/+7 + 12 điểm mới
  // 330/550/660 × ±12/±7); 20 điểm thuộc đường cong (trừ 2 điểm 880 legacy).
  // AM theo từng f0 đối chiếu với map P1-195 + sim N9a (sim phải khớp
  // headed trong ~0,1 st như tiền lệ 194). AM@440 vượt bar 0,35 là
  // trade-off đã quyết — không lặp verdict AM ở đây (xem N2-headed).
  {
    const curve = pitchArr.filter((p) => [220, 330, 440, 550, 660].includes(p.f0));
    const want = 20;
    if (curve.length < want) {
      record({
        id: "N9b-pitch-curve-headed",
        name: "pitch trade-off curve headed (Chrome) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm",
        verdict: "CHƯA ĐẠT",
        numbers: { headed_points: curve.length, want_points: want },
        notes: `Thiếu ${want - curve.length} điểm headed trong headed-voice201.json (có ${curve.length}/${want}) — probe-voice200.ts phải đo đủ lưới 330/550/660 mới trước khi chạy harness. Chạy lại headed-voice-check200.mjs rồi chạy lại harness.`,
      });
    } else {
      const worstErr = Math.max(...curve.map((p) => Math.abs(p.errSt)));
      const worstAm = Math.max(...curve.map((p) => p.amDepth));
      const nums: Record<string, number | string> = { worst_err_st: worstErr, worst_AM_depth: worstAm, headed_points: curve.length, headed_source: voiceProv };
      for (const f0 of [220, 330, 440, 550, 660]) {
        const sub = curve.filter((p) => p.f0 === f0);
        nums[`worst_err_${f0}_st`] = Math.max(...sub.map((p) => Math.abs(p.errSt)));
        nums[`worst_AM_${f0}`] = Math.max(...sub.map((p) => p.amDepth));
        for (const p of sub) {
          const s = p.nSemi > 0 ? `p${p.nSemi}` : `m${-p.nSemi}`;
          nums[`err_${f0}_${s}_st`] = p.errSt;
          nums[`AM_${f0}_${s}`] = p.amDepth;
          nums[`domFreq_${f0}_${s}_Hz`] = p.domFreq;
        }
      }
      record({
        id: "N9b-pitch-curve-headed",
        name: "pitch trade-off curve headed (Chrome) — f0 220/330/440/550/660 × n ±12/±7, 20 điểm",
        verdict: worstErr <= 0.5 ? "ĐẠT" : "CHƯA ĐẠT",
        numbers: nums,
        notes: `Headed qua chain thật (OfflineAudioContext 48kHz, phương pháp P1-193 §2.2: render 4 s, cửa sổ [1,0, 3,5)s, Goertzel 0,25 Hz + nội suy parabol). Tiêu chí: |err| ≤ 0,5 st ở cả 20 điểm (12 điểm mới 330/550/660 + 8 điểm cũ). AM theo từng f0 đối chiếu với map P1-195 + sim N9a — kỳ vọng sim khớp headed trong ~0,1 st (tiền lệ 194: sim +12@440 889 vs Chrome 890 Hz). AM@440 vượt bar 0,35 là trade-off đã quyết (xem N2-headed). ${voiceProvNote}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// S6b-headed — đọc JSON từ headed-seek-check195.mjs (Chrome thật, <video>
// seek tới target đã sửa của P3-192).
// ---------------------------------------------------------------------------
interface HeadedSeekJson {
  generatedAt?: string;
  fixture?: string;
  seekOffsetDesc?: string;
  rows?: Array<{ t: number; currentTime: number; kind?: string; k?: number; shownFrame: number; expectedRenderFrame: number; offset: number; madToNearest: number; secondMad: number }>;
  error?: string;
}
function sectionHeadedSeek(outDir: string): void {
  console.log("== S6b-headed reverse video (P3) — JSON từ headed-seek-check195.mjs ==");
  const seekFile201 = path.join(outDir, "headed-seek201.json");
  const seekFile195 = path.join(HIDDEN195, "headed-seek195.json");
  let j: HeadedSeekJson | null = null;
  let seekProv = "";
  const loadSeek = (f: string): HeadedSeekJson | null => {
    try {
      const v = JSON.parse(fs.readFileSync(f, "utf8")) as HeadedSeekJson;
      return v && !v.error && v.rows && v.rows.length > 0 ? v : null;
    } catch { return null; }
  };
  j = loadSeek(seekFile201);
  if (j) seekProv = "201";
  if (!j) {
    let rpUnchanged = false;
    try { rpUnchanged = fs.statSync(path.join(REPO, "apps/web/src/lib/reversePlayback.ts")).mtimeMs <= SEEK_MTIME_195 + 1000; } catch { rpUnchanged = false; }
    if (rpUnchanged) { j = loadSeek(seekFile195); if (j) seekProv = "195-regression"; }
  }
  if (!j) {
    record({
      id: "S6b-headed-seek",
      name: "reverse video headed: seek tới target đã sửa của P3-192, frame hiện ra có khớp render không",
      verdict: "GHI NHẬN",
      numbers: {},
      notes: `Chưa có headed-seek201.json và reversePlayback.ts ĐÃ ĐỔI so với mốc P4-195 — dữ liệu seek 195 không còn hiệu lực. Chạy lại harness sau khi có probe seek 201. KHÔNG verdict từ số cũ.`,
    });
    return;
  }
  const seekProvNote = seekProv === "201"
    ? "Nguồn headed: probe seek 201 (mới)."
    : "Nguồn headed: dữ liệu 195 — HỒI QUY (reversePlayback.ts chưa đổi kể từ mốc P4-195).";
  // Hàng boundary-raw là đối chứng (seek KHÔNG trừ offset — tái hiện bug
  // 191, kỳ vọng offset +1) nên KHÔNG tính vào verdict; verdict chỉ theo
  // hàng boundary-fixed + midframe-control. Bản check đầu tính cả raw
  // nên không bao giờ ĐẠT được — xem F-192-P4-5.
  const fixedRows = j.rows!.filter((r) => r.kind !== "boundary-raw");
  const rawRows = j.rows!.filter((r) => r.kind === "boundary-raw");
  const worstOff = Math.max(...fixedRows.map((r) => Math.abs(r.offset)));
  const worstMad = Math.max(...fixedRows.map((r) => r.madToNearest));
  const rawOff = rawRows.map((r) => r.offset);
  record({
    id: "S6b-headed-seek",
    name: "reverse video headed (Chrome thật): seek tới target đã sửa của P3-192",
    verdict: worstOff === 0 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      worst_frame_offset: worstOff, worst_mad_to_nearest: worstMad, n_targets: fixedRows.length,
      raw_control_offsets: rawOff.join(","),
      seek_offset: j.seekOffsetDesc ?? "", headed_source: seekProv,
    },
    notes: `Fixture: ${j.fixture ?? ""}. Offset 0 ở mọi target (boundary-fixed + midframe-control) = frame hiện ra khớp frame render. Hàng boundary-raw (seek không trừ offset) kỳ vọng offset +1 — đối chứng tái hiện bug đợt 191, không tính vào verdict. Đối chiếu S6b analytic (sourceTimeAt + floor): nếu analytic vẫn +1 nhưng headed = 0 thì P3 đã sửa ở tầng seek (preview.tsx/rampSourceTimeAt), không phải sourceTimeAt. ${seekProvNote}`,
  });
}

// ---------------------------------------------------------------------------
// N11 — Trần drift 0,5 s headed + decode cửa sổ 300–600 s (P3-196, cap 0,3 s theo quyết (a4)-195).
// P4 TÍNH LẠI ĐỘC LẬP từ JSON waveform thô của P3 (không copy số P3):
// một record N11a-<tag> + một record N11b-<tag> cho mỗi fixture P3 đã
// publish — đợt 201 tìm dữ liệu P3-201 TRƯỚC, rồi P3-200 (nhiệm vụ đợt
// này), rồi 199 (benchmarks/reverse201/ + ~/workspace/tmp-round201-p3/ +
// hidden_files/round201-p3/ và các thư mục đuôi -200/-199); dữ liệu 200
// là dữ liệu NHIỆM VỤ, không phải fallback tạm (quyết (r)-200).
// (F-199-P4-2: P3-199 ghi ra thư mục thứ ba)
// — P3 ghi dữ liệu headed ra tmp, không stage). In-pass theo định nghĩa
// P3: afterStart = mẫu đầu tiên có RMS>0, chỉ tính mẫu RMS>0 (định nghĩa
// "chuỗi playhead giảm dài nhất" của harness cũ BỊ BÁC — nó lẫn mẫu
// khởi động RMS=0/peakHz cũ, thổi drift max lên 1,311 s sai).
// Chirp: LẤY TỪ CHUỖI THIẾT KẾ trong JSON (f(t)=a+b*(t mod T) hoặc
// f(t)=a+b*t), kiểm chứng bằng trung vị |drift| ≤ 0,3 s; fallback hồi
// quy tuyến tính khi chuỗi sai (clip 70 s đợt 193). KHÔNG hồi quy chirp
// tuần hoàn từ dữ liệu (wrap + cụm hold phá OLS — slope 219 thay vì
// 270, R² 0,65; F-195-P4-5). Drift = t_audio − playhead, wrap về
// [−T/2,+T/2] khi tuần hoàn. Lọc mẫu stale-peak theo quy tắc P3 §1.4
// (peakHz giống hệt mẫu trước trong khi playhead chạy ≥0,2 s); báo cả
// drift max THÔ và ĐÃ LỌC để thấy hiệu chỉnh. Counters: giá trị countersEnd của probe (khớp số P3 in) + delta
// in-pass (cuối−đầu); holdMaxSec lấy MAX (running max, không phải
// delta); khi countersEnd null (longB — trang mất trạng thái) thì lấy
// counters ở mẫu in-pass cuối cùng còn đọc được. N11a verdict theo
// drift max (đã lọc) ≤ 0,5 s; ghi rõ cap có chạm (holdCapStop) hay
// không. N11b: decode âm thanh-only bằng ffmpeg trên cùng fixture
// (proxy cho decodeAudioData của trình duyệt — decode toàn file video
// KHÔNG phải proxy đúng) + đối chiếu lastWindowDecodeMs/loadMs của P3;
// bar 5 s là bar THAM CHIẾU từ nợ P3-194 §5.2, chưa do parent đặt.
// ---------------------------------------------------------------------------
interface WaveformJson201 {
  video?: string;
  bundle?: string[];
  chirp?: string;
  samples?: Array<{
    t?: number; timeText?: string; rms?: number; peakHz?: number;
    waveMin?: number; waveMax?: number; wave?: number[];
    counters?: Record<string, number>; load1?: string;
    windows?: Array<{ windowStartSec?: number; windowEndSec?: number; rebuilding?: boolean; lastDecodeMs?: number }>;
  }>;
}
interface ProbeJson201 {
  revClickT?: number;
  revSamples?: Array<{ t?: number; revAudio?: { loaded?: number; counters?: Record<string, number> } }>;
  fwdSamples?: Array<{ audio?: { rms?: number } }>;
  countersEnd?: Record<string, number> | null;
}
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
// Verdict N11a đợt 200 theo quyết (a5)-199 (parent): thước max S2 đứng;
// ngoại lệ duy nhất: đúng 1 mẫu vượt và là mẫu sounding đầu tiên của pass
// (startup transient — thước S2 không loại được vì không có mẫu trước;
// tiền lệ (a5)-198 cho longA, parent áp lại ở (a5)-199) → ĐẠT.
export function n11aVerdict201(maxS2: number, overBarCount: number, firstOnlyOverBar: boolean): "ĐẠT" | "CHƯA ĐẠT" {
  if (maxS2 <= 0.5) return "ĐẠT";
  if (overBarCount === 1 && firstOnlyOverBar) return "ĐẠT";
  return "CHƯA ĐẠT";
}
function sectionDriftCeiling201(): void {
  console.log("== N11 trần drift 0,5s headed + decode cửa sổ 300–600s (P3-195) — tính lại từ JSON waveform thô của P3 ==");
  const benchDir = path.join(REPO, "benchmarks/reverse201");
  const tmpDir = path.join(REPO, "..", "tmp-round201-p3");
  // F-199-P4-2: P3-199 ghi dữ liệu headed ra hidden_files/round199-p3/
  // (không phải tmp-round199-p3/ như đợt 198) — tìm cả ba thư mục.
  const p3Dir = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round201-p3");
  // Dữ liệu NHIỆM VỤ đợt này là P3-200 (quyết (r)-200): tìm 201 TRƯỚC,
  // rồi 200, rồi 199.
  const benchDir200 = path.join(REPO, "benchmarks/reverse200");
  const tmpDir200 = path.join(REPO, "..", "tmp-round200-p3");
  const p3Dir200 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round200-p3");
  const benchDir199 = path.join(REPO, "benchmarks/reverse199");
  const tmpDir199 = path.join(REPO, "..", "tmp-round199-p3");
  const p3Dir199 = path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/round199-p3");
  const searchDirs = [benchDir, tmpDir, p3Dir, benchDir200, tmpDir200, p3Dir200, benchDir199, tmpDir199, p3Dir199];
  // Thu thập waveform JSON của P3 (201 trước, rồi 200, rồi 199; trùng tag
  // chỉ lấy bản đầu — tức bản mới nhất thắng).
  const found: Array<{ tag: string; wavePath: string; probePath: string | null; dataRound: number }> = [];
  const seenTags = new Set<string>();
  for (const dir of searchDirs) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir).filter((f) => /^audio-waveform-(201|200|199)-(.+)\.json$/.test(f)).sort();
    } catch {
      files = [];
    }
    for (const f of files) {
      const m = /^audio-waveform-(201|200|199)-(.+)\.json$/.exec(f);
      const tag = m?.[2] ?? f;
      const round = Number(m?.[1] ?? 201);
      if (seenTags.has(tag)) continue;
      seenTags.add(tag);
      // Probe JSON có thể ở thư mục KHÁC với waveform — thử mọi thư mục,
      // tên 201 trước, rồi 200, rồi 199.
      let probe = "";
      for (const d of searchDirs) {
        for (const rr of [201, 200, 199]) {
          const cand = path.join(d, `audio-probe-${rr}-${tag}.json`);
          if (fs.existsSync(cand)) { probe = cand; break; }
        }
        if (probe !== "") break;
      }
      found.push({ tag, wavePath: path.join(dir, f), probePath: probe !== "" ? probe : null, dataRound: round });
    }
  }
  // Đọc decode-probe: thử 201 rồi 200 rồi 199, tmp → p3Dir → benchmarks.
  const readDecodeProbe = (): { files?: Array<{ base?: string; decodes?: number[]; fetchMs?: number }> } | null => {
    for (const rr of [201, 200, 199]) {
      for (const d of [tmpDir, p3Dir, benchDir, tmpDir200, p3Dir200, benchDir200, tmpDir199, p3Dir199, benchDir199]) {
        try { return JSON.parse(fs.readFileSync(path.join(d, `decode-probe-${rr}.json`), "utf8")); } catch { /* thử thư mục sau */ }
      }
    }
    return null;
  };
  // N11b luôn chạy phần logic cửa sổ 300 s ở mức hàm thuần (không cần
  // dữ liệu P3); N11a cần JSON waveform của P3.
  {
    const win300 = reversedSegmentWindow({ playheadSec: 285, clipStartSec: 0, clipDurationSec: 300, sampleRate: 48000, windowSec: 30 });
    const win300Ok = win300 !== null && win300.startSample === 720000 && win300.lengthSamples === 1440000;
    const win600 = reversedSegmentWindow({ playheadSec: 585, clipStartSec: 0, clipDurationSec: 600, sampleRate: 48000, windowSec: 30 });
    const win600Ok = win600 !== null && win600.startSample === 720000 && win600.lengthSamples === 1440000;
    record({
      id: "N11b-window-logic-300-600s",
      name: "decode cửa sổ: logic cửa sổ 30 s ở clip 300 s / 600 s (hàm thuần reversedSegmentWindow)",
      verdict: win300Ok && win600Ok ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        window_300s_start_sample: win300?.startSample ?? -1, window_300s_len_samples: win300?.lengthSamples ?? -1,
        window_600s_start_sample: win600?.startSample ?? -1, window_600s_len_samples: win600?.lengthSamples ?? -1,
        max_windowed_s: MAX_REVERSED_AUDIO_WINDOWED_SECONDS,
      },
      notes: `Clip 300 s @playhead 285 s → cửa sổ đảo bắt đầu ở nguồn 15 s (startSample 720000 = 15×48000), dài 30 s (1440000 mẫu); clip 600 s @585 s tương tự. Đây là kiểm logic cửa sổ — thời gian decode thật đo ở N11b-decode-time (cần fixture P3-195).`,
    });
  }
  if (found.length === 0) {
    record({
      id: "N11a-drift-ceiling-headed",
      name: "trần drift 0,5 s headed — tính lại từ JSON waveform thô của P3-200 (fallback 199)",
      verdict: "GHI NHẬN",
      numbers: {},
      notes: `Chưa có file audio-waveform-201-*.json (cũng không có bản 199) trong benchmarks/reverse201/ hay tmp-round201-p3/ hay hidden_files/round201-p3/ lúc harness chạy — P3-200 chưa publish dữ liệu headed (hoặc probe chưa chạy). KHÔNG verdict (tiền lệ N8-194: ghi nhận từ dữ liệu P3, không tự suy ra). Chạy lại harness sau khi P3-200 đóng cờ.`,
    });
    record({
      id: "N11b-decode-time-300-600s",
      name: "decode cửa sổ clip 300–600 s — đo lại thời gian decode trên fixture P3-200 (fallback 199)",
      verdict: "GHI NHẬN",
      numbers: {},
      notes: `Chưa có fixture mp4 dài (≥200 s) để đo decode. Logic cửa sổ đã kiểm ở N11b-window-logic-300-600s. Chạy lại harness sau khi P3-200 publish fixture + timing decode.`,
    });
    // Probe decode riêng P3-200 có thể đã chạy trước khi có waveform headed —
    // ghi số decodeAudioData toàn file (đối chiếu chéo; verdict vẫn chờ
    // timing headed lastWindowDecodeMs).
    try {
      const dp = readDecodeProbe() as { files?: Array<{ base?: string; decodes?: number[]; fetchMs?: number }> };
      if (!dp) throw new Error("no decode-probe");
      for (const f of dp.files ?? []) {
        const ds = f.decodes ?? [];
        record({
          id: `N11b-decode-probe-201-${(f.base ?? "file").replace(/\.mp4$/, "")}`,
          name: `decode riêng P3-200 — ${f.base ?? "?"} (decodeAudioData toàn file, AudioContext rảnh)`,
          verdict: "GHI NHẬN",
          numbers: {
            probe_decode_1st_ms: ds.length > 0 ? ds[0] : -1,
            probe_decode_2nd_ms: ds.length > 1 ? ds[1] : -1,
            probe_decode_3rd_ms: ds.length > 2 ? ds[2] : -1,
            fetch_ms: f.fetchMs ?? -1,
          },
          notes: `Số decode riêng của P3 (decode-probe, thử 200 rồi 199): ${ds.map((v) => `${v.toFixed(0)} ms`).join(" / ") || "không có"}. Đây là decode TOÀN FILE trong AudioContext rảnh — KHÔNG phải timing cửa sổ headed (lastWindowDecodeMs); chỉ đối chiếu chéo, chưa verdict N11b. Bar tham chiếu 5.000 ms (nợ P3-194 §5.2).`,
        });
      }
    } catch { /* chưa có decode-probe-201.json */ }
    return;
  }
  const parseT = (s: string): number => {
    const mm = /^(\d+):(\d+(?:\.\d+)?)/.exec(s.trim());
    return mm ? Number(mm[1]) * 60 + Number(mm[2]) : NaN;
  };
  const medianOf = (xs: number[]): number => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length === 0 ? NaN : s[Math.floor(s.length / 2)];
  };
  // --- N11a: một record cho mỗi fixture P3 đã publish ---
  for (const item of found) {
    let wj: WaveformJson201 | null = null;
    try {
      wj = JSON.parse(fs.readFileSync(item.wavePath, "utf8")) as WaveformJson201;
    } catch {
      wj = null;
    }
    if (!wj || !wj.samples || wj.samples.length === 0) {
      record({
        id: `N11a-drift-ceiling-headed-${item.tag}`,
        name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-200, fallback 199)`,
        verdict: "CHƯA ĐẠT",
        numbers: {},
        notes: `File ${path.basename(item.wavePath)} không parse được hoặc không có samples — không tính lại được drift. Xem lại file P3-195.`,
      });
      continue;
    }
    type Row201 = NonNullable<WaveformJson201["samples"]>[number] & { ph: number };
    const rows: Row201[] = (wj.samples ?? []).map((s) => ({ ...s, ph: parseT((s.timeText ?? "").split("/")[0]) }));
    // In-pass theo P3: afterStart = mẫu đầu tiên có RMS>0; chỉ mẫu RMS>0.
    // (Định nghĩa cũ "chuỗi playhead giảm dài nhất" BỊ BÁC: nó lẫn mẫu
    // khởi động RMS=0/peakHz cũ, thổi drift max lên 1,311 s sai.)
    const startIdx = rows.findIndex((r) => (r.rms ?? 0) > 0);
    const inPass = (startIdx < 0 ? [] : rows.slice(startIdx)).filter(
      (r) => (r.rms ?? 0) > 0 && !Number.isNaN(r.ph) && (r.peakHz ?? 0) > 0,
    );
    if (inPass.length < 10) {
      record({
        id: `N11a-drift-ceiling-headed-${item.tag}`,
        name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-200, fallback 199)`,
        verdict: "GHI NHẬN",
        numbers: { total_samples: rows.length, inpass_samples: inPass.length },
        notes: `Không đủ mẫu in-pass trong ${path.basename(item.wavePath)} (${inPass.length} mẫu / tổng ${rows.length}) — có thể pass không chạy hoặc format đổi. KHÔNG verdict; xem lại file P3-195.`,
      });
      continue;
    }
    // Lọc mẫu stale-peak TRƯỚC (quy tắc S1 của P3 §1.4): peakHz giống hệt mẫu
    // in-pass trước trong khi playhead chạy ≥0,2 s. Báo cả max THÔ (chưa
    // lọc) để thấy hiệu chỉnh (longB 196: 0,993 thô → 0,537 S1 → 0,481 S2).
    const kept: Row201[] = [];
    let nStale = 0;
    for (let i = 0; i < inPass.length; i++) {
      if (i > 0 && isStalePeak(inPass[i - 1].peakHz ?? 0, inPass[i].peakHz ?? 0, inPass[i - 1].ph, inPass[i].ph)) { nStale++; continue; }
      kept.push(inPass[i]);
    }
    const keptNonEmpty = kept.length > 0 ? kept : inPass;
    // Lọc S2 (P3-196 §1.4; P4-197 kiểm chứng độc lập từ JSON thô 196 — xem
    // LIMITS P4-197 §2.4): |ΔpeakHz| ≤ 24 Hz trong khi playhead chạy ≥ 0,15 s
    // → analyser lag. Verdict N11a đợt 199 theo max S2; max S1 + max thô
    // in kèm làm đối chiếu (S1 đã sửa float; S1-chưa-sửa 0,737 longB là số
    // lỗi, không dùng).
    const keptS2: Row201[] = [];
    const keptS2Idx: number[] = [];
    let nLag = 0;
    for (let i = 0; i < inPass.length; i++) {
      if (i > 0 && isLaggingPeak(inPass[i - 1].peakHz ?? 0, inPass[i].peakHz ?? 0, inPass[i - 1].ph, inPass[i].ph)) { nLag++; continue; }
      keptS2.push(inPass[i]);
      keptS2Idx.push(i);
    }
    const keptS2NonEmpty = keptS2.length > 0 ? keptS2 : inPass;
    const keptS2IdxNonEmpty = keptS2.length > 0 ? keptS2Idx : inPass.map((_, i) => i);
    // Chirp: LẤY TỪ CHUỖI THIẾT KẾ trong JSON (f(t)=a+b*(t mod T) hoặc
    // f(t)=a+b*t), rồi KIỂM CHỨNG bằng dữ liệu (trung vị |drift| ≤ 0,3 s).
    // KHÔNG hồi quy chirp tuần hoàn từ dữ liệu: wrap quanh biên chu kỳ +
    // cụm hold (playhead đứng yên, peakHz vẫn chạy) phá OLS — thử nghiệm
    // đợt này cho slope 219 thay vì 270 thật, R² 0,65 (F-195-P4-5).
    // Clip 70 s của đợt 193 có chirp tuyến tính thật (f≈302,5+38,26t) dù
    // JSON ghi "TUAN HOAN" — kiểm chứng trung vị sẽ bắt sai và rơi về
    // hồi quy tuyến tính (R²=0,997).
    const chirpM = /f\(t\)\s*=\s*([\d.]+)\s*\+\s*([\d.]+)\s*(?:\*?\s*\(t\s*mod\s*([\d.]+)\))?/.exec(wj.chirp ?? "");
    const parsed = chirpM ? { f0: Number(chirpM[1]), slope: Number(chirpM[2]), period: chirpM[3] ? Number(chirpM[3]) : 0 } : null;
    const fitLin = linearFit(inPass.map((r) => r.ph), inPass.map((r) => r.peakHz ?? 0));
    const driftWith = (f0v: number, slopev: number, periodv: number): number[] => {
      return keptNonEmpty.map((r) => {
        const tAudio = ((r.peakHz ?? 0) - f0v) / slopev;
        return periodv > 0 ? wrapDrift(tAudio - (r.ph % periodv), periodv) : tAudio - r.ph;
      });
    };
    let periodic = false;
    let f0 = fitLin.a;
    let slope = fitLin.b;
    let chirpParsed = 0;
    let chirpFitR2 = fitLin.r2;
    if (parsed && parsed.period > 0 && Math.abs(parsed.slope) > 1e-9) {
      const dParsed = driftWith(parsed.f0, parsed.slope, parsed.period);
      const medParsed = medianOf(dParsed.map((d) => Math.abs(d)));
      if (medParsed <= 0.3) {
        periodic = true; f0 = parsed.f0; slope = parsed.slope; chirpParsed = 1;
        // Độ khớp của mô hình đã parse: tỉ lệ mẫu có |drift| ≤ 0,5 s.
        chirpFitR2 = dParsed.filter((d) => Math.abs(d) <= 0.5).length / Math.max(dParsed.length, 1);
      }
    }
    if (Math.abs(slope) < 1e-9) {
      record({
        id: `N11a-drift-ceiling-headed-${item.tag}`,
        name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-200, fallback 199)`,
        verdict: "GHI NHẬN",
        numbers: { inpass_samples: inPass.length, fit_linear_r2: fitLin.r2, chirp_parsed: chirpParsed },
        notes: `Không xác định được công thức chirp (chuỗi JSON: ${wj.chirp ?? "?"}, hồi quy tuyến tính R²=${fitLin.r2.toFixed(3)}, slope≈0) — KHÔNG verdict; xem lại file P3-195.`,
      });
      continue;
    }
    const period = periodic && parsed ? parsed.period : 0;
    const driftOf = (r: Row201): number => {
      const tAudio = ((r.peakHz ?? 0) - f0) / slope;
      return period > 0 ? wrapDrift(tAudio - (r.ph % period), period) : tAudio - r.ph;
    };
    const rawAbs = inPass.map((r) => Math.abs(driftOf(r)));
    const absDrifts = keptNonEmpty.map((r) => Math.abs(driftOf(r))).sort((a, b) => a - b);
    const drifts = keptNonEmpty.map(driftOf);
    const median = medianOf(absDrifts);
    const p90 = absDrifts[Math.floor(absDrifts.length * 0.9)] ?? NaN;
    const maxDrift = absDrifts.length > 0 ? absDrifts[absDrifts.length - 1] : NaN;
    const rawMax = rawAbs.length > 0 ? Math.max(...rawAbs) : NaN;
    // Thống kê S2 (thước CHÍNH đợt 199): tính trên tập đã loại lag.
    const absDriftsS2 = keptS2NonEmpty.map((r) => Math.abs(driftOf(r))).sort((a, b) => a - b);
    const medianS2 = medianOf(absDriftsS2);
    const p90S2 = absDriftsS2[Math.floor(absDriftsS2.length * 0.9)] ?? NaN;
    const maxDriftS2 = absDriftsS2.length > 0 ? absDriftsS2[absDriftsS2.length - 1] : NaN;
    // Vị trí các mẫu vượt bar S2 (để P3-200 xác định transient — quyết
    // (a5)-199): chỉ tính trên tập S2; firstOnlyOverBar = đúng 1 mẫu vượt
    // và là mẫu sounding đầu tiên của pass (idx in-pass 0).
    const overBarS2 = keptS2NonEmpty.map((r, k) => ({ r, idxInPass: keptS2IdxNonEmpty[k] ?? -1, d: driftOf(r) })).filter((o) => Math.abs(o.d) > 0.5);
    const firstOnlyOverBar = overBarS2.length === 1 && overBarS2[0].idxInPass === 0;
    const rmsVals = inPass.map((s) => s.rms ?? 0);
    const meanRms = rmsVals.reduce((a, b) => a + b, 0) / rmsVals.length;
    const flat = inPass.filter((s) => (s.waveMax ?? 0) - (s.waveMin ?? 0) < 4).length;
    // Counters: giá trị cuối in-pass (khớp countersEnd của probe khi có);
    // holdMaxSec lấy MAX (running max). Probe JSON (nếu có) cho loadMs,
    // RMS forward (median các mẫu RMS>0 — bền với transient 0,11/0,40)
    // và countersEnd tuyệt đối để đối chiếu số P3 in.
    const firstC = inPass[0].counters ?? {};
    const lastC = inPass[inPass.length - 1].counters ?? {};
    const delta = (k: string): number => (lastC[k] ?? 0) - (firstC[k] ?? 0);
    let holdMaxSec = 0;
    const decodeMsSet = new Set<number>();
    for (const r of inPass) {
      holdMaxSec = Math.max(holdMaxSec, r.counters?.holdMaxSec ?? 0);
      if (typeof r.counters?.lastWindowDecodeMs === "number" && (r.counters?.lastWindowDecodeMs ?? 0) > 0) decodeMsSet.add(r.counters.lastWindowDecodeMs);
    }
    let probe: ProbeJson201 | null = null;
    if (item.probePath) {
      try { probe = JSON.parse(fs.readFileSync(item.probePath, "utf8")) as ProbeJson201; } catch { probe = null; }
    }
    let loadMs: number | null = null;
    let fwdRmsMedian: number | null = null;
    let probeEnd: Record<string, number> | null = null;
    if (probe) {
      if (typeof probe.revClickT === "number" && probe.revSamples) {
        for (const s of probe.revSamples) {
          if ((s.revAudio?.loaded ?? 0) >= 1 && typeof s.t === "number") { loadMs = s.t - probe.revClickT; break; }
        }
      }
      if (probe.fwdSamples) {
        const fwd = probe.fwdSamples.map((s) => s.audio?.rms ?? 0).filter((v) => v > 0);
        if (fwd.length > 0) fwdRmsMedian = medianOf(fwd);
      }
      if (probe.countersEnd) probeEnd = probe.countersEnd;
    }
    const endC = probeEnd ?? lastC;
    // Chirp-70s KHÔNG còn là fixture bar N11a (quyết (a4)-196: bin 0,611 s >
    // bar 0,5 s — giới hạn đo, không chứng minh drift thật vượt bar) →
    // GHI NHẬN, không verdict. Fixture khác verdict theo max S2 (thước chính
    // đợt 197, đã kiểm chứng độc lập — LIMITS P4-197 §2.4).
    const isChirpFixture = /chirp/i.test(item.tag);
    const ruleVerdict = isChirpFixture ? "GHI NHẬN" : n11aVerdict201(maxDriftS2, overBarS2.length, firstOnlyOverBar);
    // F-201-P4-1 — GỠ CỜ parent_hold_199_longB theo quyết (a5)-200 (parent,
    // aggregate 200 §14.2): longB ĐẢO QUYẾT thành ĐẠT. Cơ sở (F-200-P4-1):
    // đếm "7 mẫu vượt" của P4-199 là đếm trên tập THÔ chưa lọc; trên thước
    // verdict S2 chỉ còn 1 mẫu vượt (mẫu đầu 2,756 s, leftover phát xuôi —
    // loại được, cùng lớp với 1 transient của longA theo tiền lệ (a5)-198);
    // 6 mẫu giữa pass (ph 198,8–237,1, drift 0,53–0,70 s) đều có peakHz
    // ĐÓNG BĂNG y hệt mẫu trước (Δpeak = 0 Hz) trong khi playhead chạy
    // 0,2–0,3 s — đúng định nghĩa stale-peak S1 (P3 §1.4), đã bị S1 loại.
    // Verdict nay = ruleVerdict thuần (n11aVerdict201), KHÔNG còn hold nào.
    const verdict = ruleVerdict;
    const binResSec = 23.4375 / Math.abs(slope); // analyser fftSize 2048 @48k → bin 23,44 Hz
    record({
      id: `N11a-drift-ceiling-headed-${item.tag}`,
      name: `trần drift 0,5 s headed — ${item.tag} (tính lại độc lập từ JSON waveform thô của P3-200, fallback 199)`,
      verdict,
      numbers: {
        n_inpass_samples: inPass.length, n_stale_excluded: nStale, n_lag_excluded_s2: nLag, n_total_samples: rows.length,
        rms_mean: meanRms, rms_min: Math.min(...rmsVals), rms_max: Math.max(...rmsVals),
        rms_forward_median: fwdRmsMedian ?? -1,
        flat_waveform_inpass: flat,
        drift_median_s: median, drift_p90_s: p90, drift_max_s: maxDrift, drift_max_raw_s: rawMax,
        drift_median_s2_s: medianS2, drift_p90_s2_s: p90S2, drift_max_s2_s: maxDriftS2,
        n_over_bar_s2: overBarS2.length, over_bar_first_only: firstOnlyOverBar ? 1 : 0, data_round: item.dataRound, parent_hold_199_longB: 0, // cờ ĐÃ GỠ (a5)-200 — giữ khóa = 0 để lineage report so được giữa các đợt
        over_bar_playheads_s: overBarS2.map((o) => o.r.ph.toFixed(1)).join(",") || "—",
        over_bar_drifts_s: overBarS2.map((o) => o.d.toFixed(3)).join(",") || "—",
        drift_min_signed_s: Math.min(...drifts), drift_max_signed_s: Math.max(...drifts),
        chirp_periodic: periodic ? 1 : 0, chirp_f0_hz: f0, chirp_slope_hz_per_s: slope,
        chirp_fit_r2: chirpFitR2, chirp_parsed: chirpParsed, chirp_bin_resolution_s: binResSec,
        holdCapStop_end: endC.holdCapStop ?? 0, holdCapStop_delta_inpass: delta("holdCapStop"),
        holdMaxSec_max: holdMaxSec, holdKeep_end: endC.holdKeep ?? 0, holdStop_end: endC.holdStop ?? 0,
        restart_end: endC.restart ?? 0, restartExact_end: endC.restartExact ?? 0,
        tick_end: endC.tick ?? 0, playOk_end: endC.playOk ?? 0, playFalse_end: endC.playFalse ?? 0,
        windowRebuilds_end: endC.windowRebuilds ?? 0,
        first_window_decode_ms: firstC.lastWindowDecodeMs ?? 0,
        last_window_decode_ms: lastC.lastWindowDecodeMs ?? 0,
        load_ms: loadMs ?? -1,
      },
      notes: `File: ${path.basename(item.wavePath)} (chirp ${periodic ? "tuần hoàn 10 s (lấy từ chuỗi thiết kế JSON, đã kiểm chứng trung vị |drift| ≤ 0,3 s)" : "tuyến tính (hồi quy)"} f0=${f0.toFixed(1)} Hz, slope=${slope.toFixed(2)} Hz/s, ${periodic ? `khớp ${(chirpFitR2 * 100).toFixed(1)}% mẫu |drift|≤0,5 s` : `R²=${chirpFitR2.toFixed(4)}`}; bin ${binResSec.toFixed(3)} s). In-pass ${inPass.length}/${rows.length} mẫu (playhead ${(inPass[0]?.ph ?? NaN).toFixed(1)}→${(inPass[inPass.length - 1]?.ph ?? NaN).toFixed(1)} s). Drift = t_audio − playhead${periodic ? `, wrap về [−${period / 2},${period / 2}]` : ""}; đã loại ${nStale} mẫu stale-peak S1 + ${nLag} mẫu lag S2 (|Δpeak|≤24 Hz, playhead ≥0,15 s) — max thô ${rawMax.toFixed(3)} s → S1 ${maxDrift.toFixed(3)} s → S2 ${maxDriftS2.toFixed(3)} s (thước verdict đợt 200, quyết (a5)-199). Counters cuối: tick ${endC.tick ?? 0}, holdStop ${endC.holdStop ?? 0}, holdKeep ${endC.holdKeep ?? 0}, holdCapStop ${endC.holdCapStop ?? 0}, holdMaxSec ${holdMaxSec.toFixed(3)} s, restart ${endC.restart ?? 0}, restartExact ${endC.restartExact ?? 0}, playOk ${endC.playOk ?? 0}, playFalse ${endC.playFalse ?? 0}, windowRebuilds ${endC.windowRebuilds ?? 0} (countersEnd của probe${probeEnd ? "" : " — KHÔNG có, dùng mẫu in-pass cuối"}). Decode cửa sổ (lastWindowDecodeMs): ${[...decodeMsSet].sort((a, b) => a - b).join("/")} ms; load tới loaded=1: ${loadMs === null ? "?" : `${loadMs} ms`}. ${isChirpFixture ? "Chirp-70s KHÔNG phải fixture bar N11a từ đợt 197 (giữ nguyên đợt 199) (quyết (a4)-196: bin 0,611 s > bar 0,5 s — số chỉ tham khảo, KHÔNG verdict). " : ""}${!isChirpFixture ? `Vượt bar S2: ${overBarS2.length} mẫu (playhead ${overBarS2.map((o) => o.r.ph.toFixed(1)).join(", ") || "—"} s; drift ${overBarS2.map((o) => o.d.toFixed(3)).join(", ") || "—"} s). ` : ""}${!isChirpFixture && maxDriftS2 > 0.5 ? ((endC.holdCapStop ?? 0) > 0 ? "Vượt bar tuyệt đối 0,5 s theo thước S2 — cap 0,3 s (quyết (a4)-195) đã kích hoạt (holdCapStop > 0) nhưng drift tuyệt đối vẫn vượt: drift = drift-lúc-giữ + 0,3 s, nghĩa là drift-lúc-giữ > ~0,2 s hoặc cap chưa đủ siết với hold này. " : `Vượt bar tuyệt đối 0,5 s theo thước S2 — cap CHƯA kích hoạt ở pass này (holdCapStop = 0, holdMaxSec ${holdMaxSec.toFixed(3)} s). `) : ""}Dữ liệu: ${item.dataRound === 201 ? "P3-201 (mới)" : item.dataRound === 200 ? "P3-200 — DỮ LIỆU NHIỆM VỤ đợt 201 (quyết (r)-200)" : "thô 199 — tái tính để đối chiếu, không phải verdict pass mới"}. Cờ parent_hold_199_longB ĐÃ GỠ theo quyết (a5)-200 (F-201-P4-1). Đối chiếu số P3 ở LIMITS P4-201.`,
    });
  }
  // --- N11b: decode âm thanh-only (ffmpeg) + đối chiếu timing P3 ---
  for (const item of found) {
    let wj2: WaveformJson201 | null = null;
    try {
      wj2 = JSON.parse(fs.readFileSync(item.wavePath, "utf8")) as WaveformJson201;
    } catch {
      wj2 = null;
    }
    const mp4Candidates = [
      wj2?.video ?? "",
      path.join(tmpDir, `${item.tag}.mp4`),
      path.join(benchDir, `${item.tag}.mp4`),
      path.join(p3Dir, `${item.tag}.mp4`),
      path.join(tmpDir199, `${item.tag}.mp4`),
      path.join(benchDir199, `${item.tag}.mp4`),
      path.join(p3Dir199, `${item.tag}.mp4`),
    ].filter((p) => p !== "" && fs.existsSync(p));
    if (mp4Candidates.length === 0) {
      record({
        id: `N11b-decode-time-300-600s-${item.tag}`,
        name: `decode cửa sổ clip 300–600 s — ${item.tag} (đo lại thời gian decode trên fixture P3-200, fallback 199)`,
        verdict: "GHI NHẬN",
        numbers: {},
        notes: `Không tìm được fixture mp4 cho ${item.tag} (waveform.video + tmp-round201-p3 + benchmarks/reverse201 + hidden_files/round201-p3 đều không có) — chưa đo decode. Logic cửa sổ đã kiểm ở N11b-window-logic-300-600s.`,
      });
      continue;
    }
    const fixPath = mp4Candidates[0];
    const probeDur = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fixPath], { encoding: "utf8" });
    const dur = Number.parseFloat((probeDur.stdout || "").trim());
    // Decode CHỈ ÂM THANH (−vn): proxy đúng cho decodeAudioData của trình
    // duyệt khi load cửa sổ (wiring decode TOÀN FILE tạm thời mỗi lần đổi
    // cửa sổ). Decode cả video KHÔNG phải proxy đúng (nặng gấp ~10×).
    const t0 = Date.now();
    const dec = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", fixPath, "-vn", "-f", "null", "-"], { encoding: "utf8" });
    const audioSec = (Date.now() - t0) / 1000;
    const okDec = dec.status === 0;
    // Timing P3 (đọc lại từ JSON waveform: lastWindowDecodeMs ở mẫu
    // in-pass đầu/cuối — khớp số P3 in ở LIMITS §2.1/§3).
    let firstDecodeMs = -1;
    let lastDecodeMs = -1;
    if (wj2?.samples) {
      const withC = wj2.samples.filter((s) => typeof s.counters?.lastWindowDecodeMs === "number" && (s.counters?.lastWindowDecodeMs ?? 0) > 0);
      if (withC.length > 0) {
        firstDecodeMs = withC[0].counters?.lastWindowDecodeMs ?? -1;
        lastDecodeMs = withC[withC.length - 1].counters?.lastWindowDecodeMs ?? -1;
      }
    }
    const verdict = !okDec ? "GHI NHẬN" : firstDecodeMs > 0 && firstDecodeMs <= 5000 ? "ĐẠT" : "CHƯA ĐẠT";
    // Probe decode riêng của P3 (decode-probe, thử 200 rồi 199 — thử tmp,
    // hidden_files/round201-p3, benchmarks): decode toàn file bằng
    // decodeAudioData thật trong AudioContext rảnh (không phải headed pass)
    // — đối chiếu chéo, KHÔNG thay thước verdict (verdict vẫn theo timing
    // P3 headed lastWindowDecodeMs khi có).
    let probeDecodeMs: number[] = [];
    try {
      const dp = readDecodeProbe() as { files?: Array<{ base?: string; decodes?: number[] }> };
      const hit = (dp?.files ?? []).find((f) => (f.base ?? "") === `${item.tag}.mp4`);
      if (hit?.decodes) probeDecodeMs = hit.decodes;
    } catch { probeDecodeMs = []; }
    record({
      id: `N11b-decode-time-300-600s-${item.tag}`,
      name: `decode cửa sổ clip 300–600 s — ${item.tag} (đo lại thời gian decode trên fixture P3-200, fallback 199)`,
      verdict,
      numbers: {
        fixture_duration_s: Number.isNaN(dur) ? -1 : dur,
        ffmpeg_audio_only_decode_s: audioSec,
        p3_first_window_decode_ms: firstDecodeMs,
        p3_last_window_decode_ms: lastDecodeMs,
        probe_decode_first_ms: probeDecodeMs.length > 0 ? probeDecodeMs[0] : -1,
        probe_decode_2nd_ms: probeDecodeMs.length > 1 ? probeDecodeMs[1] : -1,
        probe_decode_3rd_ms: probeDecodeMs.length > 2 ? probeDecodeMs[2] : -1,
        ffmpeg_ok: okDec ? 1 : 0,
      },
      notes: `Fixture: ${path.basename(fixPath)} (${Number.isNaN(dur) ? "?" : dur.toFixed(1)} s). Decode âm thanh-only bằng ffmpeg: ${audioSec.toFixed(2)} s (proxy cho decodeAudioData — wiring decode TOÀN FILE tạm thời mỗi lần đổi cửa sổ). Timing P3 headed (lastWindowDecodeMs): cửa sổ đầu ${firstDecodeMs} ms, gần nhất ${lastDecodeMs} ms. Probe decode riêng P3 (decodeAudioData toàn file, AudioContext rảnh): ${probeDecodeMs.length > 0 ? probeDecodeMs.map((v) => `${v.toFixed(0)} ms`).join(" / ") : "chưa có"}. Bar tham chiếu: decode cửa sổ đầu ≤ 5 s (nợ P3-194 §5.2 — CHƯA do parent đặt, chỉ tham chiếu; verdict theo timing P3 headed, ffmpeg + probe riêng chỉ đối chiếu chéo). Đối chiếu timing decode của P3 ở LIMITS P4-200.`,
    });
  }
}

// ---------------------------------------------------------------------------
// N12a — PSOLA sim ĐỘC LẬP: gọi đúng lõi psolaPitchShift thật (psola.ts,
// thuần TS — cùng hàm worklet mirror) trên sine tổng hợp, đo bằng đúng
// thước đo của harness (spectralPeak + AM khối RMS 5 ms, như
// pitchShifterSim). Không dùng số sim của P1 — chỉ đối chiếu sau ở LIMITS.
// Sine 0,7 s (T0=−0,1, T1=0,6), phân tích đoạn [0,1, 0,6) như N2a.
// ---------------------------------------------------------------------------
export function psolaShiftSim(f0: number, nSemi: number): { domFreq: number; errSt: number; errStHarm: number; pitchShifted: boolean; amDepth: number; magTarget: number; magOrig: number; nanSamples: number } {
  const sr = 48000;
  const T0 = -0.1;
  const T1 = 0.6;
  const N = Math.floor((T1 - T0) * sr);
  const x = new Float32Array(N);
  for (let i = 0; i < N; i++) { const t = T0 + i / sr; x[i] = Math.sin(2 * Math.PI * f0 * t); }
  const y = psolaPitchShift(x, sr, semitoneRatio(nSemi));
  const y64 = new Float64Array(y.length);
  let nanSamples = 0;
  for (let i = 0; i < y.length; i++) {
    const v = y[i];
    if (!Number.isFinite(v)) { nanSamples++; y64[i] = 0; }
    else y64[i] = v;
  }
  const a = Math.floor((0.1 - T0) * sr);
  const seg = y64.subarray(a, N);
  const target = f0 * semitoneRatio(nSemi);
  // Đỉnh TOÀN CỤC (phổ rộng 50–2000 Hz, thô bước 2 Hz rồi mịn ±2 Hz bước
  // 0,25 Hz) — KHÔNG tìm hẹp quanh mục tiêu: tìm hẹp sẽ báo sideband yếu
  // ở đúng mục tiêu là "đỉnh" trong khi sóng mang gốc vẫn trội (F-196-P4-3:
  // 440/−12: Goertzel 440 Hz = 11115 vs 30 ở 220 Hz — lõi PSOLA không
  // dịch sine thuần ở r=0,5; đo hẹp [0,8×,1,25×] của P1 báo 110,2 Hz là
  // sideband yếu, không phải đỉnh trội).
  const coarse = spectralPeak(seg, sr, 50, 2000, 2);
  const peak = spectralPeak(seg, sr, Math.max(50, coarse.freq - 2), coarse.freq + 2, 0.25);
  const errSt = 12 * Math.log2(peak.freq / target);
  const magTarget = goertzelMag(seg, sr, target);
  const magOrig = goertzelMag(seg, sr, f0);
  // Dịch thật = nền tảng mục tiêu có mặt + sóng mang gốc biến mất. Đỉnh
  // toàn cục có thể rơi vào hài 2 của mục tiêu (nền yếu — PSOLA down-shift
  // 220/550/660 ở −7) nên errSt thô báo +12 st là SAI: đo lại theo hài
  // k×target gần đỉnh nhất (k∈{1,2}). pitchShifted là thước phân biệt:
  // −12: magTarget≈0,003 vs magOrig≈0,93 (không dịch); −7: magTarget
  // 0,34–0,52 vs magOrig 0,003–0,008 (đã dịch, chỉ nền yếu).
  const pitchShifted = magTarget >= 10 * magOrig;
  const kHarm = Math.abs(peak.freq - 2 * target) < Math.abs(peak.freq - target) ? 2 : 1;
  const errStHarm = 12 * Math.log2(peak.freq / (kHarm * target));
  const win = Math.floor(0.005 * sr);
  let mn = Infinity;
  let mx = -Infinity;
  for (let s0 = a; s0 + win <= N; s0 += win) {
    let ss = 0;
    for (let i = s0; i < s0 + win; i++) ss += y64[i] * y64[i];
    const rms = Math.sqrt(ss / win);
    mn = Math.min(mn, rms);
    mx = Math.max(mx, rms);
  }
  const amDepth = (mx - mn) / (mx + mn);
  return { domFreq: peak.freq, errSt, errStHarm, pitchShifted, amDepth, magTarget, magOrig, nanSamples };
}
// ---------------------------------------------------------------------------
// Gate N12a MỚI THEO QUYẾT (a4)-199 (parent, aggregate 199 §14.2 — bản đã
// KHÔI PHỤC 86.880 B; tiền đề (a4)-198 SAI nên thước domFreq/errHarm ở −12
// ĐÃ BỎ — F-199-P4-1: domFreq 330/550 ở −12 = 495/825 Hz, hài 3 của đích,
// errHarm 7,02 st; thước đó không đứng). Ở −12: gate = CAO ĐỘ AUTOCORR
// (|errSt| ≤ 0,1 st — bộ ước cao độ theo chu kỳ đọc đúng đích dù hài 3
// trội hơn nền: P4-199 đo autocorr đúng đích cả 5 f0, errSt ≤ 0,054 st,
// r ≈ 0,99) + cao độ wide 10/10 (phần wide kiểm bằng tái tính độc lập từ
// JSON headed thô của P1-200 — round200-p4/scratch/wide-rederive-200.mjs,
// LIMITS P4-200 §2 — không nằm trong sim lõi này). Ở −7/+7/+12 thước mag
// cũ vẫn đứng (pitchShifted = magTarget ≥ 10×magOrig). Tỉ số mag ở −12 và
// domFreq/errHarm chỉ còn là thông tin, KHÔNG chặn verdict.
// psolaAutocorrPitch: sine 2 s qua đúng lõi psolaPitchShift, đo tự tương
// quan chuẩn hoá trên đoạn [0,5, 1,5), lag ứng với 80–700 Hz, báo đỉnh
// cục bộ cao nhất (top-1) + r + errSt so với đích. Đúng phương pháp probe
// acorr-verify-199.mjs của P4-199 (đã kiểm chứng: errSt ≤ 0,054 st).
// ---------------------------------------------------------------------------
export function psolaAutocorrPitch(f0: number, nSemi: number): { f0est: number; r: number; errSt: number; top3: Array<{ f: number; r: number }> } {
  const sr = 48000;
  const N = 2 * sr;
  const x = new Float32Array(N);
  for (let i = 0; i < N; i++) x[i] = Math.sin((2 * Math.PI * f0 * i) / sr);
  const y = psolaPitchShift(x, sr, semitoneRatio(nSemi));
  const seg = y.slice(Math.floor(0.5 * sr), Math.floor(1.5 * sr));
  const n = seg.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += seg[i];
  mean /= n;
  const xc = new Float64Array(n);
  for (let i = 0; i < n; i++) xc[i] = seg[i] - mean;
  let e0 = 0;
  for (let i = 0; i < n; i++) e0 += xc[i] * xc[i];
  const lagMin = Math.floor(sr / 700);
  const lagMax = Math.ceil(sr / 80);
  const vals: Array<{ lag: number; f: number; r: number }> = [];
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let sv = 0;
    for (let i = 0; i + lag < n; i++) sv += xc[i] * xc[i + lag];
    vals.push({ lag, f: sr / lag, r: e0 === 0 ? 0 : sv / e0 });
  }
  const peaks: Array<{ lag: number; f: number; r: number }> = [];
  for (let i = 1; i < vals.length - 1; i++)
    if (vals[i].r > vals[i - 1].r && vals[i].r >= vals[i + 1].r) peaks.push(vals[i]);
  peaks.sort((a, b) => b.r - a.r);
  const top = peaks.slice(0, 3);
  const target = f0 * semitoneRatio(nSemi);
  const f0est = top.length > 0 ? top[0].f : NaN;
  return { f0est, r: top.length > 0 ? top[0].r : 0, errSt: top.length > 0 ? 12 * Math.log2(top[0].f / target) : NaN, top3: top.map((t) => ({ f: t.f, r: t.r })) };
}
export function n12aGate201(r: { n: number; errStAcorr: number; pitchShifted: boolean }): { gateShifted: boolean; gate: string } {
  if (r.n === -12) return { gateShifted: Math.abs(r.errStAcorr) <= 0.1, gate: "minus12-autocorr" };
  return { gateShifted: r.pitchShifted, gate: "mag-ratio-10x" };
}
function sectionPsolaSim201(): void {
  console.log("== N12a PSOLA sim độc lập (P1-200) — lõi psolaPitchShift thật trên sine, gate mới (a4)-199 ==");
  const grid: Array<{ f0: number; n: number }> = [];
  for (const f0 of [220, 330, 440, 550, 660])
    for (const n of [12, -12, 7, -7]) grid.push({ f0, n });
  const rows = grid.map((c) => {
    const s = psolaShiftSim(c.f0, c.n);
    // Thước (a4)-199 ở −12: cao độ autocorr (errSt ≤ 0,1 st). Chỉ đo
    // autocorr ở −12 (đắt: sine 2 s + quét lag) — các n khác giữ mag.
    const ac = c.n === -12 ? psolaAutocorrPitch(c.f0, c.n) : null;
    const g = n12aGate201({ n: c.n, errStAcorr: ac ? ac.errSt : 0, pitchShifted: s.pitchShifted });
    return { ...c, ...s, acorrF0est: ac ? ac.f0est : -1, acorrR: ac ? ac.r : -1, errStAcorr: ac ? ac.errSt : NaN, gateShifted: g.gateShifted, gate: g.gate };
  });
  const worstErr = Math.max(...rows.map((r) => Math.abs(r.errSt)));
  // worstErrHarm nay CHỈ LÀ THÔNG TIN (thước domFreq/errHarm ở −12 đã bỏ
  // theo (a4)-199) — giữ worstErrHarmMag để đối chiếu với hồ sơ 198/199.
  const worstErrHarm = Math.max(...rows.map((r) => Math.abs(r.errStHarm)));
  const worstErrHarmMag = Math.max(...rows.filter((r) => r.pitchShifted).map((r) => Math.abs(r.errStHarm)));
  const worstErrAcorrM12 = Math.max(...rows.filter((r) => r.n === -12).map((r) => Math.abs(r.errStAcorr)));
  const worstAm = Math.max(...rows.map((r) => r.amDepth));
  // Điểm KHÔNG dịch theo thước mag cũ (chỉ còn là thông tin ở −12).
  const notShifted = rows.filter((r) => !r.pitchShifted).map((r) => `${r.f0}/${r.n > 0 ? "+" : ""}${r.n}`);
  // Điểm RỚT gate mới (a4)-199: −12 rớt khi |errSt autocorr| > 0,1 st;
  // các n khác rớt khi không qua thước mag.
  const gateFail = rows.filter((r) => !r.gateShifted).map((r) => `${r.f0}/${r.n > 0 ? "+" : ""}${r.n}`);
  const weakFund = rows.filter((r) => r.pitchShifted && Math.abs(r.errSt) > 0.5).map((r) => `${r.f0}/${r.n > 0 ? "+" : ""}${r.n}`);
  const nums: Record<string, number | string> = { worst_err_st: worstErr, worst_err_harm_st: worstErrHarm, worst_err_harm_mag_st: worstErrHarmMag, worst_err_acorr_m12_st: worstErrAcorrM12, worst_AM_depth: worstAm, not_shifted_count: notShifted.length, pitch_shifted_count: rows.filter((r) => r.pitchShifted).length, gate_fail_count: gateFail.length, gate_fail_points: gateFail.join(", ") || "không có", weak_fundamental_count: weakFund.length, nan_samples_max: Math.max(...rows.map((r) => r.nanSamples)) };
  for (const f0 of [220, 330, 440, 550, 660]) {
    const sub = rows.filter((r) => r.f0 === f0);
    nums[`worst_err_${f0}_st`] = Math.max(...sub.map((r) => Math.abs(r.errSt)));
    nums[`worst_AM_${f0}`] = Math.max(...sub.map((r) => r.amDepth));
    for (const r of sub) {
      const sgn = r.n > 0 ? `p${r.n}` : `m${-r.n}`;
      nums[`err_${f0}_${sgn}_st`] = r.errSt;
      nums[`errHarm_${f0}_${sgn}_st`] = r.errStHarm;
      nums[`shifted_${f0}_${sgn}`] = r.pitchShifted ? 1 : 0;
      nums[`gate_shifted_${f0}_${sgn}`] = r.gateShifted ? 1 : 0;
      nums[`mag_ratio_${f0}_${sgn}`] = r.magOrig === 0 ? -1 : r.magTarget / r.magOrig;
      nums[`AM_${f0}_${sgn}`] = r.amDepth;
      nums[`domFreq_${f0}_${sgn}_Hz`] = r.domFreq;
      nums[`magTarget_${f0}_${sgn}`] = r.magTarget;
      nums[`magOrig_${f0}_${sgn}`] = r.magOrig;
      if (r.n === -12) {
        nums[`errStAcorr_${f0}_m12_st`] = r.errStAcorr;
        nums[`acorr_f0est_${f0}_m12_Hz`] = r.acorrF0est;
        nums[`acorr_r_${f0}_m12`] = r.acorrR;
      }
    }
  }
  record({
    id: "N12a-psola-sim",
    name: "PSOLA pitch sim độc lập — lõi psolaPitchShift thật trên sine, f0 220/330/440/550/660 × n ±12/±7, 20 điểm (gate mới (a4)-199)",
    verdict: gateFail.length === 0 && worstAm <= 0.35 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: nums,
    notes: `Sim độc lập: gọi đúng psolaPitchShift (psola.ts — lõi thuần TS mà AudioWorklet mirror) trên sine 0,7 s, đo bằng thước đo của harness (đỉnh TOÀN CỤC 50–2000 Hz + AM khối RMS 5 ms); riêng −12 đo thêm cao độ autocorr trên sine 2 s (đoạn [0,5, 1,5), lag 80–700 Hz). GATE MỚI theo quyết (a4)-199: ở −12 chỉ xét cao độ autocorr (|errSt| ≤ 0,1 st) — thước domFreq/errHarm ĐÃ BỎ (tiền đề (a4)-198 SAI, F-199-P4-1) và tỉ số mag KHÔNG còn là điều kiện flip ở −12 (cấu trúc, F-198-P1-1); ở −7/+7/+12 thước mag ≥ 10× vẫn đứng. Bar PSOLA theo quyết (a2)-195: AM ≤ 0,35 ở MỌI f0. Điểm KHÔNG dịch theo thước mag cũ: ${notShifted.join(", ") || "không có"} (ở −12 chỉ là thông tin, không chặn verdict); điểm RỚT gate mới: ${gateFail.join(", ") || "không có"}; điểm nền yếu (hài 2 trội): ${weakFund.join(", ") || "không có"}. Phần "cao độ wide 10/10" của gate kiểm riêng bằng tái tính độc lập từ JSON headed thô của P1 (LIMITS P4-200 §2). Đối chiếu số sim P1-196 (round196-p1/sim-psola-196.json + sim-psola2-196.json) ở LIMITS P4-196 §2.2 — số P1 KHÔNG dùng làm số của P4.`,
  });
}

// ---------------------------------------------------------------------------
// N12 — PSOLA pitch (P1-200, quyết (a2)-197 + gate −12 mới (a4)-199):
// AM ≤ 0,35 ở MỌI f0 + |err| ≤ 0,5 st, trên dữ liệu headed P1-200 (mọi n
// có trong JSON, không chỉ ±12/±7). WSOLA cũ: AM@440 tệ nhất 0,72,
// AM@660 tệ nhất 0,58 (đợt 195).
// Tới khi P1-200 publish headed-voice201.json thì N12 = GHI NHẬN.
// N12a: sim PSOLA độc lập — P1-200 công bố tham số
// PSOLA (pitch-mark, cửa sổ grain); pitchShifterSim hiện tại mô hình
// WSOLA 2-delay cũ, không dùng làm sim PSOLA.
// ---------------------------------------------------------------------------
function sectionPsola201(outDir: string): void {
  console.log("== N12 PSOLA pitch (P1-199) — AM ≤ 0,35 mọi f0 trên headed ==");
  const file201 = path.join(outDir, "headed-voice201.json");
  const file195 = path.join(HIDDEN195, "headed-voice195.json");
  let j: HeadedVoiceJson | null = null;
  let prov = "";
  const load = (f: string): HeadedVoiceJson | null => {
    try {
      const v = JSON.parse(fs.readFileSync(f, "utf8")) as HeadedVoiceJson;
      return v && !v.error && v.pitch && v.pitch.length > 0 ? v : null;
    } catch { return null; }
  };
  j = load(file201);
  if (j) prov = "201";
  if (!j) {
    let vfUnchanged = false;
    try { vfUnchanged = fs.statSync(path.join(REPO, "apps/web/src/lib/previewVoiceFx.ts")).mtimeMs <= VOICE_MTIME_195 + 1000; } catch { vfUnchanged = false; }
    if (vfUnchanged) { j = load(file195); if (j) prov = "195-regression"; }
  }
  if (!j) {
    record({
      id: "N12-psola-pitch-curve",
      name: "PSOLA pitch: AM ≤ 0,35 ở MỌI f0 (220–660 Hz) + |errSt| ≤ 0,5 st (headed)",
      verdict: "GHI NHẬN", numbers: {},
      notes: `Chưa có headed-voice201.json và code voice ĐÃ ĐỔI so với mốc P4-195 — PSOLA mới của P1-196/197 chưa đo được. Chạy lại harness sau khi P1-201 publish probe. KHÔNG verdict từ số WSOLA cũ.`,
    });
    return;
  }
  const pts = j.pitch!.filter((p) => [220, 330, 440, 550, 660].includes(p.f0));
  const nums: Record<string, number | string> = { headed_points: pts.length, headed_source: prov };
  let worstAm = 0;
  let worstErr = 0;
  for (const f0 of [220, 330, 440, 550, 660]) {
    const sub = pts.filter((p) => p.f0 === f0);
    if (sub.length === 0) { nums[`worst_AM_${f0}`] = -1; continue; }
    const wAm = Math.max(...sub.map((p) => p.amDepth));
    const wErr = Math.max(...sub.map((p) => Math.abs(p.errSt)));
    nums[`worst_AM_${f0}`] = wAm;
    nums[`worst_err_${f0}_st`] = wErr;
    nums[`n_${f0}`] = sub.length;
    worstAm = Math.max(worstAm, wAm);
    worstErr = Math.max(worstErr, wErr);
  }
  nums.worst_AM_depth = worstAm;
  nums.worst_err_st = worstErr;
  const psolaNote = prov === "200"
    ? "Dữ liệu headed PSOLA mới của P1-200."
    : "Dữ liệu headed 195 — HỒI QUY WSOLA cũ (code voice chưa đổi, chờ probe P1-200); AM@440 0,72 / AM@660 0,58 đợt 195 là baseline trước PSOLA, KHÔNG phải verdict PSOLA.";
  record({
    id: "N12-psola-pitch-curve",
    name: "PSOLA pitch: AM ≤ 0,35 ở MỌI f0 (220–660 Hz) + |errSt| ≤ 0,5 st (headed)",
    verdict: worstAm <= 0.35 && worstErr <= 0.5 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: nums,
    notes: `Bar PSOLA theo quyết (a2)-195: AM ≤ 0,35 ở mọi f0 (mọi n có trong JSON: ${pts.length} điểm), |errSt| ≤ 0,5 st. ${psolaNote}`,
  });

}

// ---------------------------------------------------------------------------
// N13 — fps nguồn media (P2-198 ghi fps:30): P4 kiểm file/code + LIMITS P2,
// không đo lại headed fps (probe fps là của P2, port/CDP riêng).
// Tên LIMITS P2 đổi theo chủ đề từng đợt (F-198-P4-1) — đợt 199 quét glob
// docs/PHASE9_ROUND201_P2_*.md thay vì hard-code tên (không đọc file 198:
// dữ liệu cũ không còn hiệu lực cho đợt mới).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// R_rel theo σ (nợ (a1)-199, parent aggregate 199 §14.2): P2-199 §5 phát hiện
// R_rel phụ thuộc σ — w0s (footage thật, nội dung nhẹ) ở σ=5 cho R_rel
// 0,245/0,216/0,213 CHƯA ĐẠT (cả adapt lẫn fixed; tap cũng 0,246), trong khi
// ở σ=15 bar 0,15 đạt được. Bar KHÔNG đổi đợt này — section này ĐO ĐỘC LẬP
// trên fixture tổng hợp của harness (cùng fixture N5b: testsrc2 + nhiễu
// Gauss seed 19100+f, interlace, truth yadif→hqdn3d, pipeline α thích nghi
// 199) ở σ=5/10/15 để xem phụ thuộc σ có tái hiện không, và cơ chế có đúng
// như P2 mô tả (σ̂ thấp → α cao → làm mờ quá mức → R_out tụt dưới R_truth).
// Verdict: GHI NHẬN (nghiên cứu thước — không phải gate; N10/N5b ở σ=15
// vẫn là verdict chính, giữ nguyên trong sectionDeint).
// ---------------------------------------------------------------------------
function sectionRrelSigma201(): void {
  console.log("== R_rel theo sigma (nợ (a1)-199) — N5b-style fixture ở sigma=5/10/15 ==");
  const w = 320;
  const h = 180;
  const divisor = ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR;
  const s = 0.5;
  const cleanYuv = path.join(TMP, "rrel-clean.yuv");
  ff(["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=${w}x${h}:rate=30:duration=1`,
    "-vf", "scale=out_color_matrix=bt709,format=yuv420p", "-f", "rawvideo", "-pix_fmt", "yuv420p", cleanYuv], "testsrc2 clean (rrel)");
  const yadif = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePreChain({deinterlace:true})`).replace(/^,/, "");
  const hq = nodeRequireJs("server/render/src/enhance.js", `m.buildEnhancePostChain({denoise:{strength:${s}}})`).replace(/^,/, "");
  const frameRgbS = (yuvFile: string, idx: number): Buffer => {
    const FS = (w * h * 3) / 2;
    const buf = fs.readFileSync(yuvFile);
    const one = path.join(TMP, "rrel-one.yuv");
    fs.writeFileSync(one, buf.subarray(idx * FS, (idx + 1) * FS));
    const out = path.join(TMP, "rrel-one.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`,
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-i", one, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], "yuv->rgb (rrel)");
    return fs.readFileSync(out);
  };
  const baseClean = (() => {
    const out = path.join(TMP, "rrel-clean.rgb");
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", cleanYuv, "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24",
      "-f", "rawvideo", "-pix_fmt", "rgb24", out], "clean yuv->rgb (rrel)");
    return fs.readFileSync(out);
  })();
  const cleanAt = (i: number): Buffer => Buffer.from(baseClean.subarray(i * w * h * 3, (i + 1) * w * h * 3));
  for (const sigma of [5, 10, 15]) {
    const noisyFrames: Buffer[] = [];
    for (let f = 0; f < 30; f++) {
      const baseF = cleanAt(f);
      const rngF = mulberry32(19100 + f);
      const nb = Buffer.alloc(w * h * 3);
      for (let i = 0; i < nb.length; i++)
        nb[i] = Math.max(0, Math.min(255, Math.round(baseF[i] + sigma * gauss(rngF))));
      noisyFrames.push(nb);
    }
    const noisyIn = path.join(TMP, `rrel-noisy-${sigma}.rgb`);
    fs.writeFileSync(noisyIn, Buffer.concat(noisyFrames));
    const noisyYuv = path.join(TMP, `rrel-noisy-${sigma}.yuv`);
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyIn, "-vf", "scale=out_color_matrix=bt709,format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", noisyYuv], `noisy rgb->yuv sigma=${sigma}`);
    const interNoisyYuv = path.join(TMP, `rrel-interno-${sigma}.yuv`);
    ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
      "-i", noisyYuv, "-vf", "interlace=scan=tff:lowpass=0",
      "-f", "rawvideo", "-pix_fmt", "yuv420p", interNoisyYuv], `interlace noisy sigma=${sigma}`);
    const truthAll = (() => {
      const out = path.join(TMP, `rrel-truth-${sigma}.rgb`);
      ff(["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${w}x${h}`, "-r", "30",
        "-i", interNoisyYuv, "-vf", `${yadif},${hq},scale=in_color_matrix=bt709:out_color_matrix=bt709:out_range=pc,format=rgb24`,
        "-f", "rawvideo", "-pix_fmt", "rgb24", out], `yadif+hqdn3d truth sigma=${sigma}`);
      return fs.readFileSync(out);
    })();
    const truthAt = (i: number): Buffer => Buffer.from(truthAll.subarray(i * w * h * 3, (i + 1) * w * h * 3));
    const nums: Record<string, number | string> = { sigma_noise: sigma };
    const rRels: number[] = [];
    const rRelsTap: number[] = [];
    const mads: number[] = [];
    for (const i of [3, 7, 11]) {
      const truthRgb = truthAt(i);
      const srcNoisyRgb = frameRgbS(interNoisyYuv, i);
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let p = 0; p < w * h; p++) {
        rgba[p * 4] = srcNoisyRgb[p * 3];
        rgba[p * 4 + 1] = srcNoisyRgb[p * 3 + 1];
        rgba[p * 4 + 2] = srcNoisyRgb[p * 3 + 2];
        rgba[p * 4 + 3] = 255;
      }
      const sigmaHat = estimateNoiseSigmaFromRgba(rgba, w, h);
      const k = denoiseAdaptiveK(s, sigmaHat);
      const wf = denoiseWarmupFactor(3, s, sigmaHat);
      const alpha = denoiseBlendAlpha(s) * k * wf;
      const rgbaPrev = new Uint8ClampedArray(w * h * 4);
      {
        const prevRgb = frameRgbS(interNoisyYuv, i - 1);
        for (let p = 0; p < w * h; p++) {
          rgbaPrev[p * 4] = prevRgb[p * 3];
          rgbaPrev[p * 4 + 1] = prevRgb[p * 3 + 1];
          rgbaPrev[p * 4 + 2] = prevRgb[p * 3 + 2];
          rgbaPrev[p * 4 + 3] = 255;
        }
      }
      const motion = motionEstimateFromBandLuma(motionBandLumaFromRgba(rgba, w, h), motionBandLumaFromRgba(rgbaPrev, w, h), w);
      const motionK = motion === null ? 1 : denoiseMotionMultiplier(motion);
      const alpha199 = alpha * motionK;
      const vbW = deintVerticalBlendWeight(sigmaHat);
      const prevBf199 = bobFirstPreview196(srcNoisyRgb, w, h, divisor, alpha199, vbW);
      const bobNoisy = deintBobSim(srcNoisyRgb, w, h, divisor);
      const prevTap = denoisePreviewComposite(tapShiftVerticalSim(bobNoisy, w, h, 0.5), w, h, s, alpha);
      const mBf199 = compareFrames(truthRgb, prevBf199, w, h);
      const mTap = compareFrames(truthRgb, prevTap, w, h);
      const rTruth = combingRLuma(truthRgb, w, h);
      const rBf199 = combingRLuma(prevBf199, w, h);
      const rTap = combingRLuma(prevTap, w, h);
      const rRel = Math.abs(rBf199 - rTruth) / rTruth;
      const rRelTap = Math.abs(rTap - rTruth) / rTruth;
      rRels.push(rRel);
      rRelsTap.push(rRelTap);
      mads.push(mBf199.mad);
      nums[`sigma_hat_f${i}`] = sigmaHat;
      nums[`alpha_f${i}`] = alpha;
      nums[`alpha199_f${i}`] = alpha199;
      nums[`MAD_f${i}`] = mBf199.mad;
      nums[`MAD_tap_f${i}`] = mTap.mad;
      nums[`R_truth_f${i}`] = rTruth;
      nums[`R_out_f${i}`] = rBf199;
      nums[`R_tap_f${i}`] = rTap;
      nums[`R_rel_f${i}`] = rRel;
      nums[`R_rel_tap_f${i}`] = rRelTap;
    }
    const worst = Math.max(...rRels);
    const worstTap = Math.max(...rRelsTap);
    nums.R_rel_worst = worst;
    nums.R_rel_tap_worst = worstTap;
    nums.MAD_avg = mads.reduce((a, b) => a + b, 0) / mads.length;
    const shAvg = ((nums.sigma_hat_f3 as number) + (nums.sigma_hat_f7 as number) + (nums.sigma_hat_f11 as number)) / 3;
    const a19Avg = ((nums.alpha199_f3 as number) + (nums.alpha199_f7 as number) + (nums.alpha199_f11 as number)) / 3;
    nums.sigma_hat_avg = shAvg;
    nums.alpha199_avg = a19Avg;
    record({
      id: `Rrel-sigma-${sigma}`,
      name: `R_rel theo σ — fixture N5b ở σ=${sigma} (pipeline α thích nghi 199, 3 frame idx 3/7/11)`,
      verdict: "GHI NHẬN",
      numbers: nums,
      notes: `Đo độc lập (nợ (a1)-199): cùng fixture + pipeline như N5b, chỉ đổi σ nhiễu ${sigma}. R_rel worst ${worst.toFixed(3)} (tap ${worstTap.toFixed(3)}) vs bar 0,15 — so với P2-199 §5 trên footage thật w0s (σ=5: R_rel 0,245/0,216/0,213, tap 0,246). GHI NHẬN, không verdict: bar 0,15 KHÔNG đổi đợt này (quyết (a1)-199); N10/N5b ở σ=15 vẫn là verdict chính.`,
    });
  }
}

function sectionP2Fps201(): void {
  console.log("== N13 fps nguồn media (P2-200) — kiểm file/code + LIMITS P2 ==");
  let limitsCandidates: string[] = [];
  try {
    limitsCandidates = fs.readdirSync(path.join(REPO, "docs"))
      .filter((f) => /^PHASE9_ROUND201_P2_.*\.md$/.test(f))
      .sort()
      .map((f) => `docs/${f}`);
  } catch { limitsCandidates = []; }
  let limits = "";
  let limitsFound = "";
  for (const cand of limitsCandidates) {
    try { limits = fs.readFileSync(path.join(REPO, cand), "utf8"); limitsFound = cand; break; } catch { /* thử tên sau */ }
  }
  let mediaSrc = "";
  try { mediaSrc = fs.readFileSync(path.join(REPO, "apps/web/src/media.ts"), "utf8"); } catch { mediaSrc = ""; }
  const fpsInCode = /fps\s*[:?]/.test(mediaSrc);
  if (!limits) {
    record({
      id: "N13-fps-source-media",
      name: "fps nguồn media ghi trong MediaItem (P2-198: fps:30)",
      verdict: "GHI NHẬN",
      numbers: { fps_field_in_media_ts: fpsInCode ? 1 : 0 },
      notes: `P2-200 chưa đóng cờ (chưa có docs/PHASE9_ROUND201_P2_*.md) — chưa kiểm được claim fps:30. media.ts ${fpsInCode ? "CÓ" : "KHÔNG có"} trường fps. Chạy lại harness sau khi P2-200 đóng cờ.`,
    });
    return;
  }
  const fpsLines = limits.split("\n").filter((l) => /fps/i.test(l)).slice(0, 5);
  record({
    id: "N13-fps-source-media",
    name: "fps nguồn media ghi trong MediaItem (P2-198: fps:30)",
    verdict: "GHI NHẬN",
    numbers: { fps_field_in_media_ts: fpsInCode ? 1 : 0, limits_has_fps_claim: fpsLines.length > 0 ? 1 : 0 },
    notes: `P2-200 đã đóng cờ (${limitsFound}); claim fps trong LIMITS P2-200: ${fpsLines.join(" / ").slice(0, 300) || "(không tìm thấy dòng fps)"}. media.ts ${fpsInCode ? "CÓ" : "KHÔNG có"} trường fps. GHI NHẬN vì fps headed là probe riêng của P2 (requestVideoFrameCallback lúc import) — P4 chỉ kiểm file/code + LIMITS, không đo lại độc lập.`,
  });
}

// ---------------------------------------------------------------------------
// Self-test (khóa harness): forward MAD=0 đã có ở S6-control; thêm Goertzel
// trên sine khô + PSNR identity.
// ---------------------------------------------------------------------------
function selfTest(): void {
  const sine = path.join(TMP, "self-sine.wav");
  writeSineWav(sine, [440], [0.5], 0.5);
  const { samples, sr } = decodeAudioToPcm(sine);
  const peak = spectralPeak(samples, sr, 400, 480, 1);
  if (Math.abs(peak.freq - 440) > 2) throw new Error(`self-test Goertzel: đỉnh ${peak.freq}Hz, kỳ vọng 440Hz`);
  const a = patternFrame(16, 16);
  const m = compareFrames(a, Buffer.from(a), 16, 16);
  if (m.mad !== 0 || m.psnr !== Infinity) throw new Error(`self-test compare identity: MAD=${m.mad} PSNR=${m.psnr}`);
  if (Math.abs(denoiseBlendAlpha(0.5) - 0.486) > 1e-9) throw new Error("self-test denoiseBlendAlpha(0.5) != 0.486");
  console.log("self-test OK: Goertzel 440Hz, compare identity MAD=0/PSNR=inf, alpha(0.5)=0.486");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : path.join(TMP, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const ffv = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  console.log(`parityHarness201 — FFmpeg ${ffv.stdout.split("\n")[0]} — node ${process.version}`);
  console.log(`TMP=${TMP} OUT=${outDir}`);
  selfTest();
  sectionSharpen();
  sectionDenoise();
  sectionNoise();
  sectionVoiceRender();
  sectionVoicePreview();
  sectionSharpenNoisy();
  sectionDeint();
  sectionRrelSigma201();
  sectionP2Fps201();
  sectionPitchArtifactSim();
  sectionPsolaSim201();
  sectionHeadedVoice(outDir);
  sectionPsola201(outDir);
  sectionReverseVideo();
  await sectionReverseAudio();
  sectionHeadedSeek(outDir);
  sectionScrubReverse();
  sectionReverseSmooth();
  sectionDriftCeiling201();
  const passed = results.filter((r) => r.verdict === "ĐẠT").length;
  const failed = results.filter((r) => r.verdict === "CHƯA ĐẠT");
  const noted = results.filter((r) => r.verdict === "GHI NHẬN").length;
  const total = passed + failed.length;
  console.log(`\n== TỔNG: ${passed}/${total} ĐẠT; CHƯA ĐẠT: ${failed.map((r) => r.id).join(", ") || "không có"}; GHI NHẬN (không verdict): ${noted} ==`);
  fs.writeFileSync(path.join(outDir, "parity201-report.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ffmpeg: ffv.stdout.split("\n")[0], passed, total, noted, results }, null, 2));
  console.log(`JSON: ${path.join(outDir, "parity201-report.json")}`);
  // Dọn TMP của chính lần chạy này (trung gian wav/raw/yuv 50–85 MB) —
  // /tmp là tmpfs 512 MB; 4 lần chạy không dọn đã làm đầy và crash run 3
  // bằng ENOSPC giữa sectionDeint (F-195-P4-4). Báo cáo đã ghi ra outDir.
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* không chặn verdict */ }
  if (failed.length > 0) process.exitCode = 1;
}

// Chỉ chạy main khi file được chạy trực tiếp làm harness (runner
// parity201-run.mjs đặt PARITY201_RUN_MAIN=1), không chạy khi test
// import helper (parityHarness201.test.ts) — esbuild gộp cả hai vào
// 1 bundle nên không phân biệt được bằng import.meta.url/argv[1].
if (process.env.PARITY201_RUN_MAIN === "1") {
  void main();
}
