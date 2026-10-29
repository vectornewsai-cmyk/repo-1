"use strict";
/**
 * measure_r18_cc0_parity.js — Phase 9 đợt 18: đo parity dissolve/circleopen
 * trên FOOTAGE MÁY QUAY THẬT license sạch (không còn là test pattern
 * tổng hợp hay ảnh tĩnh tổng hợp).
 *
 * Nguồn: 2 clip .ogv do scripts/fetch-cc0-footage.sh tải về /tmp
 * (mặc định /tmp/vcut-cc0-sample, NGOÀI repo):
 *   A = clip-a-swifts.ogv     (chim yến bay, Theora 1280x720 30fps)
 *   B = clip-b-firetrucks.ogv (xe cứu hỏa trên phố, Theora 1280x720 30fps)
 * Cả hai đã xác minh qua API Commons: License=pd, Copyrighted=False.
 * Script này KHÔNG tải gì, KHÔNG ghi vào repo; mọi file trung gian nằm
 * trong thư mục tmp riêng (xem cuối log).
 *
 * Phương pháp (khớp quy ước harness V11/V12/V14 + H6, khung 1280x720):
 * - Chuẩn hoá cả 2 đầu vào bằng CÙNG filter chain
 *   fps=30,scale=1280:720,format=rgb24,settb=AVTB (cả 2 clip vốn đã
 *   30fps/720p nên bước này gần như trung tính, nhưng nó khoá chặt
 *   căn khung để so sánh apples-to-apples).
 * - Render: xfade duration=1 offset=1 trên 2 giây đầu mỗi clip, chỉ
 *   lấy frame giữa transition (index 45 @30fps, t=1.5, p=0.5).
 *   Ngữ nghĩa xfade: tại t=1.5 lấy A(1.5) và B(0.5).
 * - Preview: describeTransition(type, 0.5, 1280, 720) từ module thật
 *   (transpile bằng tsc sang /tmp, như H6) + raster tổng quát dùng
 *   CHÍNH module dùng chung harnessShared.js, lấy màu pixel từ frame
 *   A(1.5)/B(0.5) thật trích bằng cùng filter chain chuẩn hoá.
 * - Phân loại thang V6: KHỚP = MAD <= 2 và >=99% pixel lệch <= 8.
 *
 * Cách chạy (từ server/render/):
 *   node src/measure_r18_cc0_parity.js [clipA] [clipB]
 * Mặc định lấy /tmp/vcut-cc0-sample/clip-a-swifts.ogv và
 * /tmp/vcut-cc0-sample/clip-b-firetrucks.ogv. Exit 0 khi đo xong
 * (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "r18-cc0-"));
const W = 1280;
const H = 720;
const FPS = 30;

const FILE_A = process.argv[2] || "/tmp/vcut-cc0-sample/clip-a-swifts.ogv";
const FILE_B = process.argv[3] || "/tmp/vcut-cc0-sample/clip-b-firetrucks.ogv";
for (const f of [FILE_A, FILE_B]) {
  if (!fs.existsSync(f)) throw new Error(`Không thấy file nguồn: ${f} — chạy scripts/fetch-cc0-footage.sh trước.`);
}

const shared = require("./harnessShared");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} exit ${r.status}: ${(r.stderr || "").slice(0, 400)}`);
  return r;
}
function ffmpeg(args) { return run("ffmpeg", ["-v", "error", ...args]); }

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

// ---- Preview tổng quát (copy đúng logic H6, dùng module chung) ----
function previewFrame(visual, frameA, frameB) {
  const buf = Buffer.alloc(W * H * 3);
  const hasRadial =
    (visual.a.region && visual.a.region.kind === "radial-gradient") ||
    (visual.b.region && visual.b.region.kind === "radial-gradient");
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5, i = (y * W + x) * 3;
      let r = 0, g = 0, b = 0;
      if (hasRadial) {
        const ca = shared.layerPixelAlpha(visual.a, x, y, W, H);
        const cb = shared.layerPixelAlpha(visual.b, x, y, W, H);
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else if (!visual.geometric) {
        const ca = shared.layerCovers(visual.a, px, py, W, H) ? visual.a.alpha : 0;
        const cb = shared.layerCovers(visual.b, px, py, W, H) ? visual.b.alpha : 0;
        r = frameA[i] * ca + frameB[i] * cb;
        g = frameA[i + 1] * ca + frameB[i + 1] * cb;
        b = frameA[i + 2] * ca + frameB[i + 2] * cb;
      } else {
        if (shared.layerCovers(visual.a, px, py, W, H)) {
          r = frameA[i] * visual.a.alpha + r * (1 - visual.a.alpha);
          g = frameA[i + 1] * visual.a.alpha + g * (1 - visual.a.alpha);
          b = frameA[i + 2] * visual.a.alpha + b * (1 - visual.a.alpha);
        }
        if (shared.layerCovers(visual.b, px, py, W, H)) {
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

function compareFrames(a, b) {
  let sum = 0, le8 = 0, n = W * H * 3;
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
// Chỉ số độ phức tạp của 1 frame thật (để chứng minh đây là nội dung
// chi tiết thật, không phải màu thuần): std kênh + diff ngang trung bình.
function complexity(frame) {
  let sum = 0, sum2 = 0, dsum = 0, dn = 0;
  const n = W * H * 3;
  for (let k = 0; k < n; k++) { sum += frame[k]; sum2 += frame[k] * frame[k]; }
  const mean = sum / n;
  const std = Math.sqrt(sum2 / n - mean * mean);
  for (let y = 0; y < H; y++) for (let x = 0; x < W - 1; x++) {
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) { dsum += Math.abs(frame[i + c] - frame[i + 3 + c]); dn++; }
  }
  return { std, hdiff: dsum / dn };
}

const NORM = `fps=${FPS},scale=${W}:${H},format=rgb24,settb=AVTB`;
// Render xfade rgb24, chỉ lấy frame giữa transition (n=45 @30fps).
// Chỉ ghi 1 frame raw (2,7 MB) — không ghi 90 frame (249 MB, /tmp chỉ 512 MB).
function renderXfade(type, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-t", "2", "-i", FILE_A, "-t", "2", "-i", FILE_B,
    "-filter_complex", `[0:v]${NORM}[a];[1:v]${NORM}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}
// Frame của clip nguồn tại frame n sau chuẩn hoá (A: n=45 tức t=1.5,
// B: n=15 tức t=0.5 — đúng ngữ nghĩa xfade offset=1 duration=1).
function sourceFrame(file, n, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-t", "2", "-i", file,
    "-filter_complex", `[0:v]${NORM},select='eq(n,${n})'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}

function main() {
  console.log(`== R18 CC0 parity (footage thật, 720p, rgb24, frame 45 @30fps, p=0.5) ==`);
  console.log(`A: ${FILE_A}`);
  console.log(`B: ${FILE_B}`);
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  console.log(`module thật: radialGradientWeight=${typeof tp.radialGradientWeight}, ffmpegDissolveFrand=${typeof df.ffmpegDissolveFrand}`);

  const frameA = sourceFrame(FILE_A, 45, "srcA-45");
  const frameB = sourceFrame(FILE_B, 15, "srcB-15");
  const cA = complexity(frameA), cB = complexity(frameB);
  console.log(`độ phức tạp frame A(1.5): std=${cA.std.toFixed(1)} diff-ngang=${cA.hdiff.toFixed(2)}`);
  console.log(`độ phức tạp frame B(0.5): std=${cB.std.toFixed(1)} diff-ngang=${cB.hdiff.toFixed(2)}`);
  // Đối chứng: 2 frame A trích 2 lần phải giống hệt nhau (chuỗi chuẩn
  // hoá xác định) — nếu khác thì phép đo không ổn định, không kết luận.
  const frameA2 = sourceFrame(FILE_A, 45, "srcA-45-repeat");
  let diffRepeat = 0;
  for (let k = 0; k < frameA.length; k++) diffRepeat += Math.abs(frameA[k] - frameA2[k]);
  console.log(`đối chứng trích lặp frame A: tổng lệch tuyệt đối=${diffRepeat} (0 = xác định)`);

  for (const type of ["dissolve", "circleopen"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameA, frameB);
    const rendered = renderXfade(type, `x-cc0-${type}`);
    const m = compareFrames(rendered, preview);
    console.log(`CC0 footage thật | ${type} | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  console.log(`tmp: ${TMP} (giữ lại để đối chứng, không đưa vào batch stage)`);
}

main();
