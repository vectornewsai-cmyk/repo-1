"use strict";
/**
 * measure_r24_colorspace_probe.js — Phase 9 đợt 24 (luồng H4), probe
 * chẩn đoán tiếp theo thí nghiệm frand-mosaic: sau khi block-mosaic
 * cho sàn 0.0000 trên cùng cặp K→L (chứng minh cấu trúc mosaic
 * KHÔNG phải nguyên nhân), và cặp R1→R2 có HF blend cao hơn
 * (74,79 > 52,77) mà sàn vẫn KHỚP, câu hỏi còn lại là: sàn
 * 1,6946/98,36% của dissolve frand K→L đến từ đâu, nếu RGB đã
 * khớp 0,0039?
 *
 * Giả thuyết mới cần kiểm chứng: LỆCH HỆ SỐ CHUYỂN MÀU.
 *  - Mọi clip J/K/L/R1/R2 đều gắn metadata bt709 (ffprobe §0).
 *  - Chuỗi encode: xfade (rgb24) → format=yuv420p TRONG filter
 *    graph — FFmpeg dùng metadata bt709 của frame để chuyển.
 *  - Preview đối chứng: harnessShared.ffmpegRgbToYuv420 chuyển
 *    buffer RGB qua rawvideo KHÔNG metadata → mặc định bt601.
 *  - Hai phép chuyển khác hệ số → lệch YUV hệ thống, lớn nhất ở
 *    vùng màu bão hoà/tối và ở ô chroma 2×2 trộn A/B (frand trộn
 *    trong MỌI ô; block thì ô thuần nên lệch triệt tiêu gần hết
 *    — nhất quán với sàn block 0.0000 khi input là rawvideo
 *    không metadata, cả hai phía đều bt601).
 *
 * Probe này (chỉ script đo, không sửa code sản phẩm):
 *  1. Dựng preview frand dissolve từ module thật (như R24).
 *  2. Dump yuv encoder-input từ chuỗi xfade với chuyển mặc định
 *     (format=yuv420p) và với chuyển ÉP bt601
 *     (scale=out_color_matrix=bt601 trước format=yuv420p).
 *  3. So từng yuv với preview-yuv (bt601 mặc định của harness).
 * Nếu yuv ép-bt601 ≈ preview-yuv (MAD ~0) trong khi yuv mặc định
 * lệch ~1,69 thì giả thuyết được CHỨNG MINH: sàn trượt là lệch hệ
 * số chuyển màu, không phải subsample, không phải lỗi render.
 * Nếu cả hai đều lệch ~1,69 thì giả thuyết bị BÁC, quay lại tìm
 * cơ chế khác.
 *
 * Cách chạy (từ server/render/):
 *   R24_SCRATCH=<đĩa> node src/measure_r24_colorspace_probe.js \
 *     <clipA> <winA> <clipB> <winB> <W> <H>
 * Scratch trên đĩa (không /tmp) theo quy tắc đợt 24.
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
const TMP = fs.mkdtempSync(path.join(SCRATCH_BASE, "r24-cs-"));
const FPS = 30;

const args = process.argv.slice(2);
const FILE_A = args[0];
const WIN_A = parseFloat(args[1]);
const FILE_B = args[2];
const WIN_B = parseFloat(args[3]);
const W = parseInt(args[4] || "1280", 10);
const H = parseInt(args[5] || "720", 10);
if (!FILE_A || isNaN(WIN_A) || !FILE_B || isNaN(WIN_B) || !W || !H) {
  throw new Error("Dùng: node measure_r24_colorspace_probe.js <clipA> <winA> <clipB> <winB> <W> <H>");
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
  spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}`);
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
  for (let k = 0; k < n; k++) { const d = Math.abs(a[k] - b[k]); sum += d; if (d <= 8) le8++; }
  return { mad: sum / n, le8: le8 / n };
}
function normChain(w, h) { return `fps=${FPS},scale=${w}:${h},format=rgb24,settb=AVTB`; }
function sourceFrame(file, win, n, tag, w, h) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-ss", String(win), "-t", "2", "-i", file,
    "-filter_complex", `[0:v]${normChain(w, h)},select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}
// Dump yuv encoder-input của chuỗi xfade dissolve tại frame 45,
// với tail chuyển màu cho trước (mặc định hoặc ép bt601).
function chainYuv(tail, tag, w, h) {
  const out = path.join(TMP, `${tag}.yuv`);
  const NORM = normChain(w, h);
  ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=dissolve:duration=1:offset=1,${tail},select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", out]);
  return fs.readFileSync(out);
}

function main() {
  console.log(`== R24 colorspace probe (dissolve K→L ${W}x${H}, frame 45 @30fps) ==`);
  console.log(`A: ${FILE_A} (cửa sổ ${WIN_A}–${WIN_A + 2}s)`);
  console.log(`B: ${FILE_B} (cửa sổ ${WIN_B}–${WIN_B + 2}s)`);
  console.log(`scratch: ${TMP}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  const frameA = sourceFrame(FILE_A, WIN_A, 45, "srcA-45", W, H);
  const frameB = sourceFrame(FILE_B, WIN_B, 15, "srcB-15", W, H);
  const visual = tp.describeTransition("dissolve", 0.5, W, H);
  const preview = previewFrame(visual, frameA, frameB, W, H);
  const prevYuv = shared.ffmpegRgbToYuv420(preview, W, H, TMP, "prev");
  console.log(`preview-yuv: ${prevYuv.w}x${prevYuv.h} (chuyển rawvideo mặc định bt601)`);
  // (1) Chuyển mặc định trong graph (metadata bt709 của frame).
  const yuvDefault = chainYuv("format=yuv420p", "chain-default", W, H);
  const mDef = shared.yuv420Mad(prevYuv.yuv, yuvDefault, prevYuv.w, prevYuv.h);
  console.log(`R24-cs | xfade→format=yuv420p (mặc định, metadata bt709) | ${shared.formatYuvMad(mDef)}`);
  // (2) Ép bt601 trước khi sang yuv420p.
  const yuv601 = chainYuv("scale=out_color_matrix=bt601,format=yuv420p", "chain-601", W, H);
  const m601 = shared.yuv420Mad(prevYuv.yuv, yuv601, prevYuv.w, prevYuv.h);
  console.log(`R24-cs | xfade→scale(out_color_matrix=bt601)→yuv420p | ${shared.formatYuvMad(m601)}`);
  // (3) Đối chứng: ép bt709 (phải giống mặc định nếu metadata đã là 709).
  const yuv709 = chainYuv("scale=out_color_matrix=bt709,format=yuv420p", "chain-709", W, H);
  const m709 = shared.yuv420Mad(prevYuv.yuv, yuv709, prevYuv.w, prevYuv.h);
  console.log(`R24-cs | xfade→scale(out_color_matrix=bt709)→yuv420p (đối chứng) | ${shared.formatYuvMad(m709)}`);
  // (4) Đối chứng đảo: preview chuyển bằng bt709 thì có khớp chuỗi mặc định không?
  // (dùng ffmpeg trực tiếp: rawvideo rgb -> yuv420p với colorspace bt709 qua scale filter)
  const prevRgbPath = path.join(TMP, "prev.rgb");
  writeFileEpermRetry(prevRgbPath, preview);
  const prevYuv709Path = path.join(TMP, "prev709.yuv");
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", prevRgbPath,
    "-filter_complex", `[0:v]scale=out_color_matrix=bt709,format=yuv420p[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", prevYuv709Path]);
  const prevYuv709 = fs.readFileSync(prevYuv709Path);
  const mDef709 = shared.yuv420Mad(prevYuv709, yuvDefault, prevYuv.w, prevYuv.h);
  console.log(`R24-cs | preview-yuv(bt709 ép) vs chuỗi mặc định | ${shared.formatYuvMad(mDef709)}`);
  // (5) Hệ quả thực hành: encode crf14 với chuyển ÉP bt601 (khớp
  // preview) thì verdict K→L ra sao? Nếu KHỚP thì quy tắc crf đợt
  // 23 cần sửa: "ngoại lệ K→L" chỉ là artifact đo, không phải tính
  // chất nội dung. Chạy cho dissolve + circleopen.
  for (const type of ["dissolve", "circleopen"]) {
    const mp4 = path.join(TMP, `enc-${type}-crf14.mp4`);
    ffmpeg(["-ss", String(WIN_A), "-t", "2", "-i", FILE_A, "-ss", String(WIN_B), "-t", "2", "-i", FILE_B,
      "-filter_complex", `[0:v]${normChain(W, H)}[a];[1:v]${normChain(W, H)}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,scale=out_color_matrix=bt601,format=yuv420p[v]`,
      "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", "-t", "2", "-y", mp4]);
    const yuvOut = path.join(TMP, `enc-${type}-crf14.yuv`);
    ffmpeg(["-i", mp4, "-filter_complex", "[0:v]select='eq(n,45)'[v]", "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", yuvOut]);
    const encYuv = fs.readFileSync(yuvOut);
    const vis = tp.describeTransition(type, 0.5, W, H);
    const pv = previewFrame(vis, frameA, frameB, W, H);
    const pvYuv = shared.ffmpegRgbToYuv420(pv, W, H, TMP, `prev-${type}`);
    const m = shared.yuv420Mad(pvYuv.yuv, encYuv, pvYuv.w, pvYuv.h);
    console.log(`R24-cs | ${type} crf14 ÉP bt601 (khớp preview) | ${shared.formatYuvMad(m)}`);
    try { fs.unlinkSync(mp4); } catch { /* bỏ qua */ }
  }
  console.log(`scratch: ${TMP} (giữ lại để đối chứng, không đưa vào batch stage)`);
}
main();
