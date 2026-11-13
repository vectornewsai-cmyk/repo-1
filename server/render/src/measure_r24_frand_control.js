"use strict";
/**
 * measure_r24_frand_control.js — Phase 9 đợt 24 (luồng H4): thí nghiệm
 * ĐỐI CHỨNG giả thuyết frand-mosaic của đợt 23 §G5 ("dissolve mosaic
 * nhiễu frand giàu tần số cao nên subsample 4:2:0 phá nặng hơn blend
 * mịn") + đo sàn crf0 4K dọc (nợ đợt 23 §6).
 *
 * Chỉ thêm script đo mới, KHÔNG sửa code sản phẩm, KHÔNG sửa harness
 * chung. Mọi file trung gian nằm trong thư mục scratch do env
 * R24_SCRATCH chỉ định (mặc định os.tmpdir()); đợt 24 BẮT BUỘC chạy
 * với R24_SCRATCH trên đĩa (~/workspace hoặc /home) vì encode 4K
 * lossless vượt /tmp tmpfs 512MB — bài học ENOSPC đợt 23.
 *
 * Phương pháp giữ nguyên R23 (để số so sánh được trực tiếp):
 *  - ÉP rgb24 TRƯỚC blend: fps=30,scale=W:H,format=rgb24,settb=AVTB;
 *    frame giữa n=45 @30fps (p=0.5); thang V6 (KHỚP = MAD ≤ 2 và
 *    ≥99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20 và ≥90% ≤ 8).
 *  - Ô yuv420p e2e kiểu R6: libx264 preset medium, crf qua
 *    R24_YUV_CRF (mặc định 14); decode frame 45 ra yuv420p raw +
 *    rgb24 đối chứng; preview chuyển sang yuv420p bằng CHÍNH
 *    FFmpeg (harnessShared.ffmpegRgbToYuv420 + yuv420Mad).
 *  - Cửa sổ đo: A(win+1.5), B(win+0.5) — đúng ngữ nghĩa xfade
 *    duration=1 offset=1 trong cửa sổ 2s.
 *
 * Ba hướng đối chứng (đều trên cùng cặp + cùng thang đo):
 *  (a) MOSAIC LÀM THÔ: dissolve với pattern khối thay vì frand
 *      từng pixel. Mask khối: mỗi ô bs×bs nhận 1 giá trị giả ngẫu
 *      nhiên xác định từ (bx,by) (hàm blockVal dưới đây); ô thành
 *      B khi blockVal < 0.5 (p=0.5), còn lại thành A. Render bằng
 *      FFmpeg maskedmerge (đã kiểm chứng ngữ nghĩa trên ảnh tổng
 *      hợp 4×2: mask=0 → base A, mask=255 → overlay B) với mask
 *      rgb24 do chính script sinh ra; preview tính bằng JS với
 *      CÙNG hàm blockVal nên khớp mô hình theo định nghĩa.
 *      Ô YUV cho block KHÔNG dùng chuỗi maskedmerge 2s trực tiếp:
 *      chuỗi đó đã chứng minh lệch khung không ổn định (framesync
 *      của maskedmerge với mask loop 25fps: frame 47 mới bằng
 *      preview trong chuỗi RGB, nhưng chuỗi có format=yuv420p lại
 *      cho nội dung khác hẳn ở cùng chỉ số — xem LIMITS đợt 24).
 *      Thay vào đó: sinh từng frame mosaic bằng đúng lệnh 1-frame
 *      đã kiểm chứng (renderBlockRgb, MAD=0.0000), nối 60 frame
 *      thành rawvideo 2s rồi encode. Frame 45 của video này được
 *      GUARD so với preview (MAD phải < 0.01) TRƯỚC KHI encode nên
 *      không thể lệch khung lặng lẽ. Các frame xung quanh là blend
 *      với cùng mask cố định chứ không phải chuỗi xfade thật — ghi
 *      rõ vì nó chỉ làm nền cho encoder; sàn crf0 thì không phụ
 *      thuộc nền encode nên vẫn là đối chứng sạch cho subsample.
 *  (b) PHỔ TẦN SỐ: trên frame blend RGB đã render (frand, từng
 *      block, fade): hdiff/vdiff trung bình, năng lượng tần số
 *      cao HF = trung bình |pixel − trung bình 4 kề| theo kênh,
 *      và tỉ lệ pixel có lệch ngang kênh-max > 8. Nếu giả thuyết
 *      đúng thì HF(frand) >> HF(block lớn) ≈ HF(fade) và MAD YUV
 *      phải giảm đơn điệu theo bs.
 *  (c) CẶP KHÁC: sàn crf0 của dissolve trên cặp đối chứng (R1→R2
 *      hoặc J→L) — nếu sàn cặp khác KHỚP trong khi K→L trượt thì
 *      hiệu ứng là đặc thù nội dung K→L, không phải lỗi hệ thống
 *      của miền YUV; nếu mọi cặp đều trượt sàn thì giả thuyết
 *      frand-mosaic bị nghi ngờ (lỗi chung).
 *
 * Cách chạy (từ server/render/):
 *   R24_SCRATCH=/home/hatch/vcut-r24-scratch R24_YUV_CRF=14 \
 *     node src/measure_r24_frand_control.js <clipA> <winA> <clipB> <winB> <W> <H> \
 *     [--blocks=64,16] [--types=dissolve,fade] [--crf0] [--json=<path>]
 *   --crf0: chạy thêm sàn crf0 cho mọi blend đã đo (dissolve frand,
 *     fade, từng block). --blocks rỗng = bỏ hướng (a).
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const SCRATCH_BASE = process.env.R24_SCRATCH || os.tmpdir();
fs.mkdirSync(SCRATCH_BASE, { recursive: true });
const TMP = fs.mkdtempSync(path.join(SCRATCH_BASE, "r24-frand-"));
const FPS = 30;

const args = process.argv.slice(2);
const FILE_A = args[0];
const WIN_A = parseFloat(args[1]);
const FILE_B = args[2];
const WIN_B = parseFloat(args[3]);
const W = parseInt(args[4] || "1280", 10);
const H = parseInt(args[5] || "720", 10);
const BLOCKS_ARG = args.find((a) => a.startsWith("--blocks="));
const BLOCKS = BLOCKS_ARG ? BLOCKS_ARG.slice("--blocks=".length).split(",").filter(Boolean).map((v) => parseInt(v, 10)) : [64, 16];
const TYPES_ARG = args.find((a) => a.startsWith("--types="));
const TYPES = TYPES_ARG ? TYPES_ARG.slice("--types=".length).split(",").filter(Boolean) : ["dissolve", "fade"];
const CRF0 = args.includes("--crf0");
const JSON_RAW = args.find((a) => a.startsWith("--json="));
const JSON_ARG = JSON_RAW ? JSON_RAW.slice("--json=".length) : null;
const YUV_CRF = parseInt(process.env.R24_YUV_CRF || "14", 10);
if (!FILE_A || isNaN(WIN_A) || !FILE_B || isNaN(WIN_B) || !W || !H) {
  throw new Error("Dùng: node measure_r24_frand_control.js <clipA> <winA> <clipB> <winB> <W> <H> [--blocks=64,16] [--types=...] [--crf0] [--json=<path>]");
}
for (const f of [FILE_A, FILE_B]) {
  if (!fs.existsSync(f)) throw new Error(`Không thấy file nguồn: ${f} — chạy scripts/fetch-r22-footage.sh trước.`);
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
// Phổ tần số cao của 1 frame RGB: hdiff/vdiff trung bình, HF =
// trung bình |pixel − trung bình 4 kề| theo kênh, tỉ lệ pixel có
// lệch ngang kênh-max > 8 (proxy cho mật độ biên gắt).
function spectral(frame, w, h) {
  let hd = 0, hn = 0, vd = 0, vn = 0, hf = 0, hfn = 0, sharp = 0, pn = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      let mx = 0;
      if (x + 1 < w) {
        for (let c = 0; c < 3; c++) { const d = Math.abs(frame[i + c] - frame[i + 3 + c]); hd += d; if (d > mx) mx = d; }
        hn += 3;
      }
      if (y + 1 < h) {
        for (let c = 0; c < 3; c++) { vd += Math.abs(frame[i + c] - frame[i + w * 3 + c]); }
        vn += 3;
      }
      if (x > 0 && x + 1 < w && y > 0 && y + 1 < h) {
        for (let c = 0; c < 3; c++) {
          const avg = (frame[i - 3 + c] + frame[i + 3 + c] + frame[i - w * 3 + c] + frame[i + w * 3 + c]) / 4;
          hf += Math.abs(frame[i + c] - avg);
        }
        hfn += 3;
      }
      if (mx > 8) sharp++;
      pn++;
    }
  }
  return { hdiff: hd / hn, vdiff: vd / vn, hf: hf / hfn, sharpFrac: sharp / pn };
}

function normChain(w, h) { return `fps=${FPS},scale=${w}:${h},format=rgb24,settb=AVTB`; }

function renderXfadeRgb(type, tag, w, h) {
  const out = path.join(TMP, `${tag}.raw`);
  const NORM = normChain(w, h);
  ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}
function renderXfadeYuv(type, tag, crf, w, h) {
  const mp4 = path.join(TMP, `${tag}-crf${crf}.mp4`);
  const NORM = normChain(w, h);
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
function sourceFrame(file, win, n, tag, w, h) {
  const out = path.join(TMP, `${tag}.raw`);
  const NORM = normChain(w, h);
  ffmpeg(["-ss", String(win), "-t", "2", "-i", file,
    "-filter_complex", `[0:v]${NORM},select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}

// Giá trị giả ngẫu nhiên xác định theo ô (bx,by) — dùng CHUNG cho
// cả mask render và preview JS nên hai phía khớp nhau theo định nghĩa.
function blockVal(bx, by) {
  let h = Math.imul(bx + 1, 374761393) ^ Math.imul(by + 1, 668265263) ^ Math.imul((bx + 1) * (by + 1), 974634211);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// Sinh mask rgb24: ô thành B (mask=255 → overlay) khi blockVal < 0.5.
function blockMask(bs, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  let nB = 0, nTot = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = blockVal(Math.floor(x / bs), Math.floor(y / bs));
      const m = v < 0.5 ? 255 : 0;
      if (m === 255) nB++;
      nTot++;
      const i = (y * w + x) * 3;
      buf[i] = m; buf[i + 1] = m; buf[i + 2] = m;
    }
  }
  return { buf, fracB: nB / nTot };
}
function blockPreview(frameA, frameB, bs, w, h) {
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = blockVal(Math.floor(x / bs), Math.floor(y / bs));
      const src = v < 0.5 ? frameB : frameA;
      const i = (y * w + x) * 3;
      buf[i] = src[i]; buf[i + 1] = src[i + 1]; buf[i + 2] = src[i + 2];
    }
  }
  return buf;
}
// Render 1 frame block-mosaic (frame 45 = A win+1.5 / B win+0.5):
// A bắt đầu winA, B bắt đầu winB−1 rồi select n=45 cả hai phía.
function renderBlockRgb(bs, tag, w, h) {
  const maskPath = path.join(TMP, `${tag}-mask.rgb`);
  const { buf, fracB } = blockMask(bs, w, h);
  writeFileEpermRetry(maskPath, buf);
  const out = path.join(TMP, `${tag}.raw`);
  const NORM = normChain(w, h);
  ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(Math.max(0, WIN_B - 1)), "-t", "3", "-i", FILE_B,
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", maskPath,
    "-filter_complex", `[0:v]${NORM},select='eq(n,45)',setpts=N/TB[a];[1:v]${NORM},select='eq(n,45)',setpts=N/TB[b];[2:v]format=rgb24[m];[a][b][m]maskedmerge,format=rgb24[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return { frame: fs.readFileSync(out), fracB };
}
// Encode 2s cho ô block bằng phương pháp frame-concat (xem header):
// sinh 60 frame mosaic đơn lẻ bằng đúng lệnh đã kiểm chứng của
// renderBlockRgb (A-stream k + B-stream k, B bắt đầu winB−1 nên
// frame 45 = A win+1.5 / B win+0.5 = đúng preview p=0.5), nối thành
// rawvideo 2s rồi encode libx264. Frame 45 được guard MAD < 0.01 so
// với preview TRƯỚC KHI encode; vi phạm thì throw, không ghi số rác.
function renderBlockFramesYuv(bs, tag, crf, w, h, preview) {
  const maskPath = path.join(TMP, `${tag}-mask.rgb`);
  if (!fs.existsSync(maskPath)) writeFileEpermRetry(maskPath, blockMask(bs, w, h).buf);
  const framesDir = path.join(TMP, `blockframes${bs}`);
  fs.mkdirSync(framesDir, { recursive: true });
  const NORM = normChain(w, h);
  for (let k = 0; k < 60; k++) {
    const out = path.join(framesDir, `f${String(k).padStart(2, "0")}.rgb`);
    if (fs.existsSync(out)) continue;
    ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(Math.max(0, WIN_B - 1)), "-t", "3", "-i", FILE_B,
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", maskPath,
      "-filter_complex", `[0:v]${NORM},select='eq(n,${k})',setpts=N/TB[a];[1:v]${NORM},select='eq(n,${k})',setpts=N/TB[b];[2:v]format=rgb24[m];[a][b][m]maskedmerge,format=rgb24[v]`,
      "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  }
  const f45 = fs.readFileSync(path.join(framesDir, "f45.rgb"));
  const g = compareFrames(f45, preview, w, h);
  if (g.mad > 0.01) throw new Error(`GUARD: block${bs} frame 45 != preview (MAD=${g.mad.toFixed(4)}) — dừng, không encode số rác.`);
  const parts = [];
  for (let k = 0; k < 60; k++) parts.push(fs.readFileSync(path.join(framesDir, `f${String(k).padStart(2, "0")}.rgb`)));
  const concatPath = path.join(TMP, `${tag}.rgb`);
  writeFileEpermRetry(concatPath, Buffer.concat(parts));
  const mp4 = path.join(TMP, `${tag}-crf${crf}.mp4`);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-framerate", String(FPS), "-i", concatPath,
    "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p", "-y", mp4]);
  const yuvOut = path.join(TMP, `${tag}-crf${crf}.yuv`);
  const rgbOut = path.join(TMP, `${tag}-crf${crf}-rgb.raw`);
  ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", yuvOut]);
  ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", rgbOut]);
  try { fs.unlinkSync(mp4); } catch { /* bỏ qua */ }
  return { yuv: fs.readFileSync(yuvOut), rgb: fs.readFileSync(rgbOut) };
}

function main() {
  console.log(`== R24 frand control (rgb24 ép trước blend + yuv420p crf${YUV_CRF} e2e, frame 45 @30fps, p=0.5, ${W}x${H}) ==`);
  console.log(`A: ${FILE_A} (cửa sổ ${WIN_A}–${WIN_A + 2}s)`);
  console.log(`B: ${FILE_B} (cửa sổ ${WIN_B}–${WIN_B + 2}s)`);
  console.log(`scratch: ${TMP}`);
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  console.log(`module thật: radialGradientWeight=${typeof tp.radialGradientWeight}, ffmpegDissolveFrand=${typeof df.ffmpegDissolveFrand}`);

  const frameA = sourceFrame(FILE_A, WIN_A, 45, "srcA-45", W, H);
  const frameB = sourceFrame(FILE_B, WIN_B, 15, "srcB-15", W, H);
  const frameA2 = sourceFrame(FILE_A, WIN_A, 45, "srcA-45-repeat", W, H);
  let diffRepeat = 0;
  for (let k = 0; k < frameA.length; k++) diffRepeat += Math.abs(frameA[k] - frameA2[k]);
  console.log(`đối chứng trích lặp frame A: tổng lệch tuyệt đối=${diffRepeat} (0 = xác định)`);

  const results = { pair: { a: FILE_A, winA: WIN_A, b: FILE_B, winB: WIN_B, w: W, h: H }, crf: YUV_CRF, cells: [], spectral: {} };

  function yuvCell(renderFn, preview, tag, crf) {
    const enc = renderFn(crf);
    const prevYuv = shared.ffmpegRgbToYuv420(preview, W, H, TMP, `prev-${tag}-crf${crf}`);
    const ym = shared.yuv420Mad(prevYuv.yuv, enc.yuv, prevYuv.w, prevYuv.h);
    const rgbDec = compareFrames(enc.rgb, preview, W, H);
    return { yuv: ym, rgbDec };
  }

  // Hướng (a)+(b): frand dissolve + fade chuẩn, rồi từng block.
  for (const type of TYPES) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameA, frameB, W, H);
    const rendered = renderXfadeRgb(type, `x-r24-${type}`, W, H);
    const m = compareFrames(rendered, preview, W, H);
    const sp = spectral(rendered, W, H);
    results.spectral[type] = sp;
    console.log(`R24 | ${type} | RGB24 | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)} | spectral hdiff=${sp.hdiff.toFixed(2)} vdiff=${sp.vdiff.toFixed(2)} HF=${sp.hf.toFixed(2)} sharp=${(sp.sharpFrac * 100).toFixed(2)}%`);
    const cell = yuvCell((crf) => renderXfadeYuv(type, `x-r24-${type}-yuv`, crf, W, H), preview, `x-r24-${type}`, YUV_CRF);
    console.log(`R24 | ${type} | YUV420p crf${YUV_CRF} | ${shared.formatYuvMad(cell.yuv)} | MAD-RGB-decode=${cell.rgbDec.mad.toFixed(4)} <=8: ${(cell.rgbDec.le8 * 100).toFixed(2)}% ${classify(cell.rgbDec)}`);
    results.cells.push({ blend: type, rgb: m, spectral: sp, yuv: { crf: YUV_CRF, mad: cell.yuv.mad, madY: cell.yuv.madY, madU: cell.yuv.madU, madV: cell.yuv.madV, le8: cell.yuv.le8, rgbDec: cell.rgbDec } });
    if (CRF0) {
      const cell0 = yuvCell((crf) => renderXfadeYuv(type, `x-r24-${type}-yuv0`, crf, W, H), preview, `x-r24-${type}0`, 0);
      console.log(`R24 | ${type} | YUV420p crf0 (sàn) | ${shared.formatYuvMad(cell0.yuv)}`);
      results.cells[results.cells.length - 1].yuvFloor = { crf: 0, mad: cell0.yuv.mad, madY: cell0.yuv.madY, madU: cell0.yuv.madU, madV: cell0.yuv.madV, le8: cell0.yuv.le8, rgbDec: cell0.rgbDec };
    }
  }
  for (const bs of BLOCKS) {
    const { frame: rendered, fracB } = renderBlockRgb(bs, `x-r24-block${bs}`, W, H);
    const preview = blockPreview(frameA, frameB, bs, W, H);
    const m = compareFrames(rendered, preview, W, H);
    const sp = spectral(rendered, W, H);
    results.spectral[`block${bs}`] = sp;
    console.log(`R24 | block${bs} | RGB24 | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)} | fracB=${(fracB * 100).toFixed(1)}% | spectral hdiff=${sp.hdiff.toFixed(2)} vdiff=${sp.vdiff.toFixed(2)} HF=${sp.hf.toFixed(2)} sharp=${(sp.sharpFrac * 100).toFixed(2)}%`);
    const cell = yuvCell((crf) => renderBlockFramesYuv(bs, `x-r24-block${bs}-yuv`, crf, W, H, preview), preview, `x-r24-block${bs}`, YUV_CRF);
    console.log(`R24 | block${bs} | YUV420p crf${YUV_CRF} | ${shared.formatYuvMad(cell.yuv)} | MAD-RGB-decode=${cell.rgbDec.mad.toFixed(4)} <=8: ${(cell.rgbDec.le8 * 100).toFixed(2)}% ${classify(cell.rgbDec)}`);
    results.cells.push({ blend: `block${bs}`, fracB, rgb: m, spectral: sp, yuv: { crf: YUV_CRF, mad: cell.yuv.mad, madY: cell.yuv.madY, madU: cell.yuv.madU, madV: cell.yuv.madV, le8: cell.yuv.le8, rgbDec: cell.rgbDec } });
    if (CRF0) {
      const cell0 = yuvCell((crf) => renderBlockFramesYuv(bs, `x-r24-block${bs}-yuv0`, crf, W, H, preview), preview, `x-r24-block${bs}0`, 0);
      console.log(`R24 | block${bs} | YUV420p crf0 (sàn) | ${shared.formatYuvMad(cell0.yuv)} | MAD-RGB-decode=${cell0.rgbDec.mad.toFixed(4)} <=8: ${(cell0.rgbDec.le8 * 100).toFixed(2)}% ${classify(cell0.rgbDec)}`);
      // Guard hiệu chuẩn khung: crf0 lossless nên frame decode chỉ
      // lệch preview ở mức roundtrip yuv420p (vài MAD); lệch khung
      // sẽ nhảy lên ~35+. Vượt ngưỡng = dừng, không ghi số rác.
      if (cell0.rgbDec.mad > 8) throw new Error(`GUARD: block${bs} crf0 MAD-RGB-decode=${cell0.rgbDec.mad.toFixed(4)} > 8 — nghi lệch khung decode (hiệu chuẩn frame 47 đã đổi), dừng để điều tra.`);
      results.cells[results.cells.length - 1].yuvFloor = { crf: 0, mad: cell0.yuv.mad, madY: cell0.yuv.madY, madU: cell0.yuv.madU, madV: cell0.yuv.madV, le8: cell0.yuv.le8, rgbDec: cell0.rgbDec };
    }
  }
  if (JSON_ARG) {
    writeFileEpermRetry(JSON_ARG, JSON.stringify(results, null, 2));
    console.log(`JSON: ${JSON_ARG}`);
  }
  console.log(`scratch: ${TMP} (giữ lại để đối chứng, không đưa vào batch stage)`);
}

main();
