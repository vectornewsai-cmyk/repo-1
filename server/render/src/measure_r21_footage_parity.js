"use strict";
/**
 * measure_r21_footage_parity.js — Phase 9 đợt 21 (T6): đo parity trên
 * FOOTAGE MÁY QUAY THẬT H.264 mới (NASA Artemis phóng đêm 1080p, IA
 * Prelinger 1950, NASA Earth from Orbit 720p — xem
 * docs/PHASE9_ROUND21_T6_FOOTAGE_LIMITS.md và scripts/fetch-r21-footage.sh).
 *
 * Chuyển thể từ measure_r19_footage_parity.js, thêm 2 ô đo mới (không
 * sửa code sản phẩm, không sửa harness chung — chỉ thêm mode đo trong
 * chính script này):
 *  (a) Ô yuv420p e2e theo ĐÚNG phương pháp R20 R6 §1: encode 2 giây
 *      bằng libx264 preset medium crf14 (ngưỡng KHỚP YUV đã khóa cho
 *      dissolve: crf ≤ 14; crf15 đã XẤP XỈ), decode frame 45 ra
 *      yuv420p raw, so với preview chuyển sang yuv420p bằng CHÍNH
 *      FFmpeg (harnessShared.ffmpegRgbToYuv420 + yuv420Mad, kiểu S5b
 *      đợt 18). Phân loại V6-tham-chiếu (thang V6 gốc định nghĩa cho
 *      MAD RGB; số miền YUV chỉ tham chiếu, không phải badge mới).
 *      Kèm MAD-RGB của frame decode (kỳ vọng LỆCH ~58 như R6 — sàn
 *      subsample 4:2:0, không phải lỗi parity).
 *  (b) Ô dissolve native 1920x1080 rgb24 (chỉ khi truyền cờ
 *      --native1080-dissolve): lần đầu đo parity ở native 1080p trên
 *      footage thật (R19 chỉ đo 1080p nguồn scale xuống 720p).
 *
 * Ô rgb24 gốc giữ nguyên phương pháp R18/R19: ÉP rgb24 TRƯỚC xfade
 * bằng cùng filter chain fps=30,scale=W:H,format=rgb24,settb=AVTB;
 * xfade duration=1 offset=1; frame giữa n=45 @30fps (p=0.5); preview
 * từ describeTransition của module thật + raster harnessShared.
 * Thang V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20
 * và ≥90% ≤ 8; còn lại LỆCH.
 *
 * Cửa sổ đo: mỗi clip dùng cửa sổ 2 giây bắt đầu tại <winA>/<winB>
 * (giây, số thực) thay vì 2 giây đầu file — vì clip phóng đêm cần
 * cửa sổ chứa thời điểm phóng (58–60s), clip 1950 cần cửa sổ phố
 * (30–32s). Ngữ nghĩa xfade giữ nguyên trong cửa sổ: A(win+1.5),
 * B(win+0.5). Cửa sổ được in ra log và ghi trong LIMITS.
 *
 * Cách chạy (từ server/render/):
 *   node src/measure_r21_footage_parity.js <clipA> <winA> <clipB> <winB> <W> <H> [--native1080-dissolve] [--crf0-ref]
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 * Mọi file trung gian nằm trong thư mục tmp riêng (in cuối log);
 * file encode mp4 2s bị xoá ngay sau khi decode để tiết kiệm /tmp.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "r21-footage-"));
const FPS = 30;

const args = process.argv.slice(2);
const FILE_A = args[0];
const WIN_A = parseFloat(args[1]);
const FILE_B = args[2];
const WIN_B = parseFloat(args[3]);
const W = parseInt(args[4] || "1280", 10);
const H = parseInt(args[5] || "720", 10);
const NATIVE1080 = args.includes("--native1080-dissolve");
const CRF0REF = args.includes("--crf0-ref");
// Bổ sung đợt 21 (sau cặp 1): cho phép quét crf YUV khác 14 và chỉ chạy
// 1 số type, để kiểm tra ngưỡng R6 có chuyển sang footage thật không
// mà không phải chạy lại toàn bộ cặp. Mặc định giữ đúng phương pháp
// gốc (crf14, đủ 3 type).
const YUV_CRF = parseInt(process.env.R21_YUV_CRF || "14", 10);
const TYPES_ARG = args.find((a) => a.startsWith("--types="));
const TYPES = TYPES_ARG ? TYPES_ARG.slice("--types=".length).split(",").filter(Boolean) : ["dissolve", "circleopen", "fade"];
if (!FILE_A || isNaN(WIN_A) || !FILE_B || isNaN(WIN_B) || !W || !H) {
  throw new Error("Dùng: node measure_r21_footage_parity.js <clipA> <winA> <clipB> <winB> <W> <H> [--native1080-dissolve] [--crf0-ref]");
}
for (const f of [FILE_A, FILE_B]) {
  if (!fs.existsSync(f)) throw new Error(`Không thấy file nguồn: ${f} — chạy scripts/fetch-r21-footage.sh trước.`);
}

const shared = require("./harnessShared");

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(cmdArgs) { return run("ffmpeg", ["-v", "error", ...cmdArgs]); }

function findTsc() {
  for (const c of [path.join(ROOT, "apps", "web", "node_modules", ".bin", "tsc"), path.join(ROOT, "node_modules", ".bin", "tsc"), "tsc"]) {
    if (spawnSync(c, ["--version"], { encoding: "utf8" }).status === 0) return c;
  }
  return null;
}
function transpileTs(srcRel, outName) {
  const src = path.join(ROOT, srcRel);
  const outDir = path.join(TMP, outName);
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}: ${(r.stderr || "").slice(0, 300)}`);
  return require(jsFile);
}

// ---- Preview tổng quát (copy đúng logic H6/R19, dùng module chung) ----
function previewFrame(visual, frameA, frameB, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  const hasRadial =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5, py = y + 0.5, i = (y * w + x) * 3;
      let r = 0, g = 0, b = 0;
      if (hasRadial) {
        const ca = shared.layerPixelAlpha(visual.a, x, y, w, h);
        const cb = shared.layerPixelAlpha(visual.b, x, y, w, h);
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else if (!visual.geometric) {
        const ca = shared.layerCovers(visual.a, px, py, w, h) ? visual.a.alpha : 0;
        const cb = shared.layerCovers(visual.b, px, py, w, h) ? visual.b.alpha : 0;
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else {
        if (shared.layerCovers(visual.a, px, py, w, h)) {
          r = frameA[i] * visual.a.alpha + r * (1 - visual.a.alpha);
          g = frameA[i + 1] * visual.a.alpha + g * (1 - visual.a.alpha);
          b = frameA[i + 2] * visual.a.alpha + b * (1 - visual.a.alpha);
        }
        if (shared.layerCovers(visual.b, px, py, w, h)) {
          r = frameB[i] * visual.b.alpha + r * (1 - visual.b.alpha);
          g = frameB[i + 1] * visual.b.alpha + g * (1 - visual.b.alpha);
          b = frameB[i + 2] * visual.b.alpha + b * (1 - visual.b.alpha);
        }
      }
      buf[i] = Math.round(r); buf[i + 1] = Math.round(g); buf[i + 2] = Math.round(b);
    }
  }
  return buf;
}

function compareFrames(a, b, w, h) {
  let sum = 0, le8 = 0, n = w * h * 3;
  for (let k = 0; k < n; k++) {
    const d = Math.abs(a[k] - b[k]);
    sum += d;
    if (d <= 8) le8++;
  }
  return { mad: sum / n, le8: le8 / n };
}
function classify(m) {
  if (m.mad <= 2 && m.le8 >= 0.99) return "KHỚP";
  if (m.mad <= 20 && m.le8 >= 0.90) return "XẤP XỈ";
  return "LỆCH";
}
function complexity(frame, w, h) {
  let sum = 0, sum2 = 0, dsum = 0, dn = 0;
  const n = w * h * 3;
  for (let k = 0; k < n; k++) { sum += frame[k]; sum2 += frame[k] * frame[k]; }
  const mean = sum / n;
  const std = Math.sqrt(sum2 / n - mean * mean);
  for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) {
    const i = (y * w + x) * 3;
    for (let c = 0; c < 3; c++) { dsum += Math.abs(frame[i + c] - frame[i + 3 + c]); dn++; }
  }
  return { std, hdiff: dsum / dn };
}

function normChain(w, h) { return `fps=${FPS},scale=${w}:${h},format=rgb24,settb=AVTB`; }

// Render xfade rgb24, chỉ lấy frame giữa transition (n=45 @30fps).
function renderXfadeRgb(type, tag, w, h) {
  const out = path.join(TMP, `${tag}.raw`);
  const NORM = normChain(w, h);
  ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}
// Encode e2e kiểu R6: xfade rồi format=yuv420p, libx264 preset medium
// crf cho trước; decode frame 45 ra yuv420p raw + rgb24. Xoá mp4 ngay
// sau khi decode xong để tiết kiệm /tmp.
function renderXfadeYuv(type, tag, crf) {
  const mp4 = path.join(TMP, `${tag}-crf${crf}.mp4`);
  const NORM = normChain(W, H);
  ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=yuv420p[v]`,
    "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p", "-t", "2", "-y", mp4]);
  const yuvOut = path.join(TMP, `${tag}-crf${crf}.yuv`);
  const rgbOut = path.join(TMP, `${tag}-crf${crf}-rgb.raw`);
  ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", yuvOut]);
  ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", rgbOut]);
  try { fs.unlinkSync(mp4); } catch { /* bỏ qua */ }
  return { yuv: fs.readFileSync(yuvOut), rgb: fs.readFileSync(rgbOut) };
}
// Frame của clip nguồn tại frame n sau chuẩn hoá (A: n=45 tức win+1.5,
// B: n=15 tức win+0.5 — đúng ngữ nghĩa xfade offset=1 duration=1).
function sourceFrame(file, win, n, tag, w, h) {
  const out = path.join(TMP, `${tag}.raw`);
  const NORM = normChain(w, h);
  ffmpeg(["-ss", String(win), "-t", "2", "-i", file,
    "-filter_complex", `[0:v]${NORM},select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}

function main() {
  console.log(`== R21 footage parity (H.264 thật, rgb24 ép trước xfade + yuv420p crf${YUV_CRF} e2e, frame 45 @30fps, p=0.5, ${W}x${H}) ==`);
  console.log(`A: ${FILE_A} (cửa sổ ${WIN_A}–${WIN_A + 2}s)`);
  console.log(`B: ${FILE_B} (cửa sổ ${WIN_B}–${WIN_B + 2}s)`);
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  console.log(`module thật: radialGradientWeight=${typeof tp.radialGradientWeight}, ffmpegDissolveFrand=${typeof df.ffmpegDissolveFrand}`);

  const frameA = sourceFrame(FILE_A, WIN_A, 45, "srcA-45", W, H);
  const frameB = sourceFrame(FILE_B, WIN_B, 15, "srcB-15", W, H);
  const cA = complexity(frameA, W, H), cB = complexity(frameB, W, H);
  console.log(`độ phức tạp frame A(win+1.5): std=${cA.std.toFixed(1)} diff-ngang=${cA.hdiff.toFixed(2)}`);
  console.log(`độ phức tạp frame B(win+0.5): std=${cB.std.toFixed(1)} diff-ngang=${cB.hdiff.toFixed(2)}`);
  const frameA2 = sourceFrame(FILE_A, WIN_A, 45, "srcA-45-repeat", W, H);
  let diffRepeat = 0;
  for (let k = 0; k < frameA.length; k++) diffRepeat += Math.abs(frameA[k] - frameA2[k]);
  console.log(`đối chứng trích lặp frame A: tổng lệch tuyệt đối=${diffRepeat} (0 = xác định)`);

  for (const type of TYPES) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameA, frameB, W, H);
    const rendered = renderXfadeRgb(type, `x-r21-${type}`, W, H);
    const m = compareFrames(rendered, preview, W, H);
    console.log(`R21 footage thật | ${type} | RGB24 | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
    // Ô yuv420p e2e (ngưỡng khóa R6: crf14; R21_YUV_CRF cho phép quét
    // thêm khi ngưỡng đó không chuyển sang footage thật).
    const enc = renderXfadeYuv(type, `x-r21-${type}-yuv`, YUV_CRF);
    const prevYuv = shared.ffmpegRgbToYuv420(preview, W, H, TMP, `prev-${type}`);
    const ym = shared.yuv420Mad(prevYuv.yuv, enc.yuv, prevYuv.w, prevYuv.h);
    const rgbDec = compareFrames(enc.rgb, preview, W, H);
    console.log(`R21 footage thật | ${type} | YUV420p crf${YUV_CRF} | ${shared.formatYuvMad(ym)} | MAD-RGB-decode=${rgbDec.mad.toFixed(4)} <=8: ${(rgbDec.le8 * 100).toFixed(2)}% ${classify(rgbDec)}`);
    if (CRF0REF && type === "dissolve") {
      const enc0 = renderXfadeYuv(type, `x-r21-${type}-yuv0`, 0);
      const ym0 = shared.yuv420Mad(prevYuv.yuv, enc0.yuv, prevYuv.w, prevYuv.h);
      console.log(`R21 footage thật | dissolve | YUV420p crf0 (đối chứng) | ${shared.formatYuvMad(ym0)}`);
    }
  }
  if (NATIVE1080) {
    const NW = 1920, NH = 1080;
    const fA1080 = sourceFrame(FILE_A, WIN_A, 45, "srcA-45-1080", NW, NH);
    const fB1080 = sourceFrame(FILE_B, WIN_B, 15, "srcB-15-1080", NW, NH);
    const visual = tp.describeTransition("dissolve", 0.5, NW, NH);
    const preview = previewFrame(visual, fA1080, fB1080, NW, NH);
    const rendered = renderXfadeRgb("dissolve", "x-r21-dissolve-1080", NW, NH);
    const m = compareFrames(rendered, preview, NW, NH);
    console.log(`R21 footage thật | dissolve | RGB24 NATIVE 1920x1080 | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  console.log(`tmp: ${TMP} (giữ lại để đối chứng, không đưa vào batch stage)`);
}

main();
