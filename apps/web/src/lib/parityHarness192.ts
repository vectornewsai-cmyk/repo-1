// parityHarness192.ts — Harness ĐỘC LẬP đo parity render-vs-preview, đợt 192 P4.
//
// Đo thật, không mock: preview = code TS thật trong repo (effectCanvas,
// enhancePreview, speed.ts, reversePlayback, reversePreviewGate) chạy qua
// esbuild bundle; render = FFmpeg 8.1.2 thật + filter string lấy từ code
// render thật (server/render/src/*.js) qua child-process require.
// Fixture tổng hợp xác định (seed cố định) để mọi số tái lập được.
// MỚI đợt 192 (so với 191): N1 telephone gain đo HEADED bằng Chrome thật
// (OfflineAudioContext qua CDP — RBJ sim đã chứng minh SAI so với Chrome,
// xem LIMITS §3.4); N2 pitch artifact: sim JS đã kiểm chứng + đo headed;
// N3 denoise frame 3 s=0.8; N4 sharpen trên nội dung nhiễu; N5 deint R;
// S7c wiring mạnh hơn (loadReversed/playSegment + mute); S6b headed với
// target đã sửa của P3-192 (đọc từ preview.tsx lúc đo).
// Fixture denoise giữ nguyên seed đợt 191 (19100+f) để so trực tiếp được.
//
// Chạy (từ gốc repo, xem scripts/parity192-run.mjs):
//   ./node_modules/.bin/esbuild apps/web/src/lib/parityHarness192.ts \
//     --bundle --format=esm --platform=node \
//     --outfile=/tmp/parity192/harness.mjs && node /tmp/parity192/harness.mjs
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
  denoiseBlendAlpha,
  denoiseWarmupFactor,
  ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR,
  enhancePreviewPlan,
} from "./enhancePreview";
import { PITCH_WINDOW_S, SAW_GAIN_COMP } from "./previewVoiceFx";
import { sourceTimeAt } from "../../../../packages/video-spec/src/speed";
import {
  resolveDecodeAheadGate,
  resolveProxyMainDirection,
} from "./reversePreviewGate";
import { reversePlayhead, reverseStep } from "./reversePlayback";
import {
  ReverseAudioPlayer,
  reversedSampleOffset,
  reversedSegmentWindow,
  reverseFloat32Channel,
} from "./reverseAudio";
import { ReverseCadenceTracker, summarizeIntervals } from "./reverseCadence";

export interface CaseResult {
  id: string;
  name: string;
  verdict: "ĐẠT" | "CHƯA ĐẠT";
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "parity192-"));
const REPO = "/home/hatch/workspace/repo-1";

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
    for (let f = 0; f < 3; f++) {
      const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, f);
      const prevF = denoisePreviewComposite(dec(f), w, h, s, planF.denoiseBlendAlpha);
      const renderF = frameAt(renderAll, w, h, f);
      const yInF = yStd(dec(f));
      const redYF = (x: Buffer) => (1 - yStd(x) / yInF) * 100;
      deltas.push(redYF(prevF) - redYF(renderF));
      mads.push(compareFrames(renderF, prevF, w, h).mad);
      alphas.push(planF.denoiseBlendAlpha);
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
        warmup_f0: denoiseWarmupFactor(0, s), warmup_f1: denoiseWarmupFactor(1, s), warmup_f2: denoiseWarmupFactor(2, s),
      },
      notes: `Tiêu chí: |Δ giảm std Y| <= 5.5 điểm ở cả 3 frame đầu — ngưỡng theo mức chấp nhận đã ghi của P2 (LIMITS §2.2/§5.1: sai số còn lại ≤5.4 điểm, tệ nhất frame 3 s=0.8). Không warm-up, preview overstate +13..+51 điểm ở frame đầu (comment enhancePreview.ts).`,
    });
  }
  // N3 bổ sung — fixture flat15-like (hiệu chuẩn của P2): cùng generator
  // nhưng sigmaNoise=11 → Y-std ≈ 8.25 như flat15 của P2 (fixture σ=15
  // trên có Y-std 11.23 ≈ flat20; P2-192 §1.4: warm-up bậc 2 chỉ hiệu
  // chuẩn trên flat15, trên flat20 sai tới +16.5). ĐO f=0..3 (P2 đếm
  // frame 1-based: "frame 3" của P2 là f=2 — warm-up chỉ áp f=0,1,2;
  // bản N3 đầu đo f=3 là SAI khung, đã sửa — xem F-192-P4-4).
  const flat15frames: Array<{ s: number; deltas: number[]; mads: number[] }> = [];
  // Đo thêm trên ĐÚNG fixture của P2 (gen.sh: color 0x808080 +
  // noise=alls=15:allf=t, 16f yuv420p) — phân biệt "claim P2 sai" với
  // "fixture flat15-like của P4 khác cấu trúc nhiễu" (xem F-192-P4-4).
  const p2flat15f2: Array<{ s: number; delta: number; mad: number }> = [];
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
      for (let f = 0; f < 4; f++) {
        const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, f);
        const prevF = denoisePreviewComposite(dec15(f), w, h, s, planF.denoiseBlendAlpha);
        const renderF = frameAt(renderAll, w, h, f);
        const yInF = yStd(dec15(f));
        const redYF = (x: Buffer) => (1 - yStd(x) / yInF) * 100;
        deltas15.push(redYF(prevF) - redYF(renderF));
        mads15.push(compareFrames(renderF, prevF, w, h).mad);
      }
      flat15frames.push({ s, deltas: deltas15, mads: mads15 });
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
        const planF = enhancePreviewPlan({ denoise: { strength: s } }, true, false, 1.0, 2);
        const prevF = denoisePreviewComposite(decP2f(2), w, h, s, planF.denoiseBlendAlpha);
        const renderF = frameAt(renderAll, w, h, 2);
        const redYF = (x: Buffer) => (1 - yStd(x) / yInP2) * 100;
        p2flat15f2.push({ s, delta: redYF(prevF) - redYF(renderF), mad: compareFrames(renderF, prevF, w, h).mad });
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
    if (/192/.test(f) && /voice/i.test(f)) cands.push(path.join(libDir, f));
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
  // Kỳ vọng tham số preview (từ voicefx.js render): pitch +12 → LFO
  // |2-1|/0.04 = 25Hz, sawGain -0.02×SAW_GAIN_COMP (đợt 192 sửa check:
  // setParams nhân SAW_GAIN_COMP=50/43 để bù chuẩn hoá PeriodicWave
  // của Chrome — P1-191 §4.2; kỳ vọng cũ -0.02 là giá trị TRƯỚC khi
  // P1-191 sửa previewVoiceFx.ts lúc 09:50:28Z, sau snapshot 09:27Z
  // của P4-191 — xem F-192-P4-2), xfade 0.5/0.5, dry 0; robot 25Hz,
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
    checks.push(
      { name: "pitchOscA.freq", got: num(F, "pitchOscA", "frequency"), want: 25, tol: 1e-9 },
      { name: "pitchOscB.freq", got: num(F, "pitchOscB", "frequency"), want: 25, tol: 1e-9 },
      { name: "pitchOscCos.freq", got: num(F, "pitchOscCos", "frequency"), want: 25, tol: 1e-9 },
      { name: "pitchSawGainA", got: num(F, "pitchSawGainA", "gain"), want: -0.02 * SAW_GAIN_COMP, tol: 1e-9 },
      { name: "pitchSawGainB", got: num(F, "pitchSawGainB", "gain"), want: -0.02 * SAW_GAIN_COMP, tol: 1e-9 },
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
      { name: "telWet", got: num(F, "telWet", "gain"), want: 1, tol: 1e-9 },
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
      { name: "pitchOscA.freq(-12)", got: num(G, "pitchOscA", "frequency"), want: 12.5, tol: 1e-9 },
      { name: "pitchSawGainA(-12)", got: num(G, "pitchSawGainA", "gain"), want: 0.02 * SAW_GAIN_COMP, tol: 1e-9 },
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
      verdict: worstMadB <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: { worst_MAD: worstMadB, worst_frame_offset: worstOffB, n_timestamps: 6 },
      notes: perTB.join(" | ") + ` F-191-P4-1: lệch hệ thống +1 frame ở mọi biên (xem LIMITS §4). Đợt 192 P3 đã sửa Ở TẦNG SEEK (reverseSeekTarget: target - 1ms, reversePlayback.ts:476, áp ở preview.tsx 4147/4201/4300) chứ không sửa sourceTimeAt — nên check analytic này (đo mapping sourceTimeAt + floor) vẫn +1 BY DESIGN; check quyết định là S6b-headed (seek thật trên Chrome).`,
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
    const { ctx: ctxLong } = makeFakeCtx(61);
    const playerLong = new ReverseAudioPlayer(ctxLong);
    const loadedLong = await playerLong.loadReversed(new ArrayBuffer(8));
    const logicOk =
      revOk && inputUnchanged && off === 36000 && offOutside === -1 && offStart === 48000 &&
      win !== null && win.startSample === 36000 && win.lengthSamples === 4800 && winNull === null &&
      loaded === true && player.loaded && player.durationSec === 1 && playOk === true &&
      Math.abs(startOffset - 0.75) < 1e-9 && loadedLong === false;
    record({
      id: "S7b-reverse-audio-logic",
      name: "reverse audio logic (P3): đảo mẫu + offset + player phát đoạn đảo",
      verdict: logicOk ? "ĐẠT" : "CHƯA ĐẠT",
      numbers: {
        reverse_exact: revOk && inputUnchanged ? 1 : 0,
        offset_at_0_25s: off, offset_outside: offOutside, offset_at_0s: offStart,
        window_start: win?.startSample ?? -1, window_len: win?.lengthSamples ?? -1,
        load_1s: loaded ? 1 : 0, play_segment: playOk ? 1 : 0, start_offset_s: startOffset,
        load_61s_rejected: loadedLong ? 0 : 1,
      },
      notes: `Hàm thuần + ReverseAudioPlayer chạy thật với fake ctx (decode 1s ramp → đảo → start offset 0.75s). Clip 61s bị từ chối đúng ngưỡng MAX 60s. Logic ĐẠT ≠ đã nối vào preview (xem S7c).`,
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
// N5 — P2 deint: R preview (bob sim, đợt 192) vs yadif render, testsrc2 interlaced
// Đợt 192 P2 đổi preview từ half-res sang BOB: intermediate draw tắt
// smoothing (nearest) giữ đúng TOP FIELD (hàng chẵn), rồi upscale bilinear
// (preview.tsx deintIntermediateSource + P2-192 LIMITS §3.3; đã xác minh
// headed Chromium 1254: 90/90 hàng = hàng chẵn). Mô hình dưới đây = đúng
// hàm bobField(src,0)+upscaleBilinear của probe P2-192 (probe-192-p2.mjs).
// Half-res cũ giữ lại làm cột tham chiếu (không dùng cho verdict).
// ---------------------------------------------------------------------------
export function deintBobSim(src: Buffer, w: number, h: number, divisor: number): Buffer {
  const h2 = Math.floor(h / divisor);
  const field = new Float64Array(w * h2 * 3);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) field[(y * w + x) * 3 + c] = src[((divisor * y) * w + x) * 3 + c];
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const sy = (y + 0.5) / divisor - 0.5;
        const y0 = Math.max(0, Math.floor(sy));
        const y1 = Math.min(h2 - 1, y0 + 1);
        const f = Math.min(1, Math.max(0, sy - y0));
        out[(y * w + x) * 3 + c] = Math.round(field[(y0 * w + x) * 3 + c] * (1 - f) + field[(y1 * w + x) * 3 + c] * f);
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
  console.log("== N5 deint (P2) — preview BOB (đợt 192) vs yadif render, testsrc2 interlaced frame 8 ==");
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
    name: `deint testsrc2 interlaced frame 8 — preview BOB top-field (divisor=${divisor}) vs render ${yadif}`,
    verdict: (tier === "KHỚP" || tier === "XẤP XỈ") && rRel <= 0.15 ? "ĐẠT" : "CHƯA ĐẠT",
    tier,
    numbers: {
      MAD_vs_yadif: m.mad, PSNR_vs_yadif: m.psnr === Infinity ? "inf" : m.psnr,
      le8_pct: m.le8 * 100, le32_pct: m.le32 * 100,
      R_src: rSrc, R_clean: rClean, R_yadif: rYadif, R_preview: rPrev, R_rel_diff: rRel,
      MAD_halfres_ref_vs_yadif: mHalf.mad, R_halfres_ref: rHalf,
    },
    notes: `R = gradient dọc trung bình (luma) — răng cưa làm tăng. Verdict theo mô hình BOB (preview đợt 192); half-res cũ chỉ làm tham chiếu. Baseline P2-192 (LIMITS §3.2, fixture của P2, R_src 6.327): bob-bilinear MAD vs yadif 3.10 (f8) / 2.70 (f3), R 1.89–1.92 (yadif 2.12–2.21); half-res cũ MAD 3.57, R 1.83. Fixture đợt này sinh lại (interlace scan=tff lowpass=0) nên R_src khác — so tuyệt đối với số P2 chỉ mang tính tham chiếu; verdict theo tier + |ΔR|/R_yadif ≤ 15% trên cùng fixture.`,
  });
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
    notes: `Sim đã kiểm chứng với số Chrome của P1-191/P1-192 (OfflineAudioContext): +12@440 sim 889 Hz (+0.18 st) vs Chrome 890.0–890.6 Hz (+0.20–0.21 st); -12@440 sim 215 Hz (-0.40 st) vs Chrome 213.9–215.0 Hz (-0.40–-0.49 st). Tiêu chí: |sai số| ≤ 0.5 st (mức của P1-191; P1-192 đo chính xác max 0.40 st) + AM depth ≤ 0.35 (P1-192 đo AM ở 440 Hz trong 0.10–0.30, cộng biên) + sideband ≤ 0.25. W=${PITCH_WINDOW_S}s, SAW_GAIN_COMP=${SAW_GAIN_COMP} đọc từ code thật.`,
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
}

// ---------------------------------------------------------------------------
// N1 + N2-headed — đọc JSON từ headed-voice-check192.mjs (Chrome thật,
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
  console.log("== N1/N2-headed voice (P1) — JSON từ headed-voice-check192.mjs (Chrome OfflineAudioContext) ==");
  const file = path.join(outDir, "headed-voice192.json");
  let j: HeadedVoiceJson | null = null;
  try {
    j = JSON.parse(fs.readFileSync(file, "utf8")) as HeadedVoiceJson;
  } catch {
    j = null;
  }
  if (!j || j.error || !j.telephone || !j.pitch) {
    record({
      id: "N1-telephone-gain-headed",
      name: "telephone gain preview vs render (headed Chrome) — JSON headed-voice192.json",
      verdict: "CHƯA ĐẠT",
      numbers: {},
      notes: `Không đọc được headed-voice192.json (${j?.error ?? "file thiếu/không parse được"}) — chạy headed-voice-check192.mjs trước rồi chạy lại harness. Không tự suy ra từ RBJ sim (RBJ SAI so với Chrome, xem LIMITS §3.4).`,
    });
    record({
      id: "N2-headed-pitch",
      name: "pitch artifact headed (Chrome OfflineAudioContext qua chain thật)",
      verdict: "CHƯA ĐẠT",
      numbers: {},
      notes: `Không có JSON headed — xem ghi chú N1.`,
    });
    return;
  }
  // Render telephone trên cùng tín hiệu 5-tone (100/440/1000/5000/8000).
  const freqs = j.telephone.freqs;
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
  const deltas = freqs.map((_, i) => j.telephone!.previewDb[i] - renderDb[i]);
  const maxAbs = Math.max(...deltas.map((d) => Math.abs(d)));
  record({
    id: "N1-telephone-gain-headed",
    name: "telephone gain preview (Chrome, chain thật) vs render (ffmpeg) theo tần số",
    verdict: maxAbs <= 2 ? "ĐẠT" : "CHƯA ĐẠT",
    numbers: {
      max_abs_delta_dB: maxAbs,
      delta_100Hz_dB: deltas[0], delta_440Hz_dB: deltas[1], delta_1000Hz_dB: deltas[2],
      delta_5000Hz_dB: deltas[3], delta_8000Hz_dB: deltas[4],
      preview_440Hz_dB: j.telephone.previewDb[1], render_440Hz_dB: renderDb[1],
      preview_5000Hz_dB: j.telephone.previewDb[3], render_5000Hz_dB: renderDb[3],
    },
    notes: `Đo headed: OfflineAudioContext 48kHz qua createVoiceChain thật (telephone-only) vs render ffmpeg ${f}. Baseline P1-192 (§2.1, bảng 9 điểm Chrome vs render, Δ=20·log10(preview/render)): 100Hz +0.61 dB, 200Hz +2.43, 300Hz +3.76, 440Hz +2.60, 700Hz +1.21, 1000Hz +0.91, 2000Hz +1.98, 3400Hz +3.76, 5000Hz +2.43 (max +3.76 dB tại 2 điểm cắt). Số đo đợt này khớp bảng đó trong 0.03 dB ở 4/5 điểm (440: +2.60, 1000: +0.91, 5000: +2.44, 100: +0.59). Tiêu chí ĐẠT: max |Δ| ≤ 2 dB.`,
  });
  // Headed pitch: verdict riêng 440 Hz (bar chặt) và 220 Hz (bar không hồi quy).
  const pitch440 = j.pitch.filter((p) => p.f0 === 440);
  const pitch220 = j.pitch.find((p) => p.f0 === 220);
  const worstErr440 = Math.max(...pitch440.map((p) => Math.abs(p.errSt)));
  const worstAm440 = Math.max(...pitch440.map((p) => p.amDepth));
  const worstSb440 = Math.max(...pitch440.map((p) => p.sidebandRatio));
  const p12 = j.pitch.find((p) => p.f0 === 440 && p.nSemi === 12);
  const m12 = j.pitch.find((p) => p.f0 === 440 && p.nSemi === -12);
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
      AM_p12_220: pitch220?.amDepth ?? -1, ok_220_no_regression: ok220 ? 1 : 0,
    },
    notes: `Đo headed qua chain thật (không sim). Baseline Chrome P1-192 (§3.1/§3.4): +12@440 890.0 Hz (+0.20 st), -12@440 215.0 Hz (-0.40 st), AM 440 Hz 0.10–0.30; 220 Hz +12 420 Hz (-0.81 st), AM 220 Hz 0.51–0.67. Tiêu chí 440 Hz: |err| ≤ 0.5 st + AM ≤ 0.35 + sideband ≤ 0.25; 220 Hz: bar không hồi quy (|err| ≤ 1.0 st, AM ≤ 0.7). Đối chiếu N2-sim: sim phải khớp headed trong ~0.1 st ở 440 Hz, nếu lệch lớn thì sim sai mô hình.`,
  });
}

// ---------------------------------------------------------------------------
// S6b-headed — đọc JSON từ headed-seek-check192.mjs (Chrome thật, <video>
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
  console.log("== S6b-headed reverse video (P3) — JSON từ headed-seek-check192.mjs ==");
  const file = path.join(outDir, "headed-seek192.json");
  let j: HeadedSeekJson | null = null;
  try {
    j = JSON.parse(fs.readFileSync(file, "utf8")) as HeadedSeekJson;
  } catch {
    j = null;
  }
  if (!j || j.error || !j.rows || j.rows.length === 0) {
    record({
      id: "S6b-headed-seek",
      name: "reverse video headed: seek tới target đã sửa của P3-192, frame hiện ra có khớp render không",
      verdict: "CHƯA ĐẠT",
      numbers: {},
      notes: `Không đọc được headed-seek192.json (${j?.error ?? "file thiếu"}) — chạy headed-seek-check192.mjs (với target đọc từ preview.tsx sau khi P3-192 sửa) rồi chạy lại harness.`,
    });
    return;
  }
  // Hàng boundary-raw là đối chứng (seek KHÔNG trừ offset — tái hiện bug
  // 191, kỳ vọng offset +1) nên KHÔNG tính vào verdict; verdict chỉ theo
  // hàng boundary-fixed + midframe-control. Bản check đầu tính cả raw
  // nên không bao giờ ĐẠT được — xem F-192-P4-5.
  const fixedRows = j.rows.filter((r) => r.kind !== "boundary-raw");
  const rawRows = j.rows.filter((r) => r.kind === "boundary-raw");
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
      seek_offset: j.seekOffsetDesc ?? "",
    },
    notes: `Fixture: ${j.fixture ?? ""}. Offset 0 ở mọi target (boundary-fixed + midframe-control) = frame hiện ra khớp frame render. Hàng boundary-raw (seek không trừ offset) kỳ vọng offset +1 — đối chứng tái hiện bug đợt 191, không tính vào verdict. Đối chiếu S6b analytic (sourceTimeAt + floor): nếu analytic vẫn +1 nhưng headed = 0 thì P3 đã sửa ở tầng seek (preview.tsx/rampSourceTimeAt), không phải sourceTimeAt.`,
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
  console.log(`parityHarness192 — FFmpeg ${ffv.stdout.split("\n")[0]} — node ${process.version}`);
  console.log(`TMP=${TMP} OUT=${outDir}`);
  selfTest();
  sectionSharpen();
  sectionDenoise();
  sectionNoise();
  sectionVoiceRender();
  sectionVoicePreview();
  sectionSharpenNoisy();
  sectionDeint();
  sectionPitchArtifactSim();
  sectionHeadedVoice(outDir);
  sectionReverseVideo();
  await sectionReverseAudio();
  sectionHeadedSeek(outDir);
  sectionReverseSmooth();
  const passed = results.filter((r) => r.verdict === "ĐẠT").length;
  const failed = results.filter((r) => r.verdict === "CHƯA ĐẠT");
  console.log(`\n== TỔNG: ${passed}/${results.length} ĐẠT; CHƯA ĐẠT: ${failed.map((r) => r.id).join(", ") || "không có"} ==`);
  fs.writeFileSync(path.join(outDir, "parity192-report.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ffmpeg: ffv.stdout.split("\n")[0], passed, total: results.length, results }, null, 2));
  console.log(`JSON: ${path.join(outDir, "parity192-report.json")}`);
  if (failed.length > 0) process.exitCode = 1;
}

// Chỉ chạy main khi file được chạy trực tiếp làm harness (runner
// parity192-run.mjs đặt PARITY192_RUN_MAIN=1), không chạy khi test
// import helper (parityHarness192.test.ts) — esbuild gộp cả hai vào
// 1 bundle nên không phân biệt được bằng import.meta.url/argv[1].
if (process.env.PARITY192_RUN_MAIN === "1") {
  void main();
}
