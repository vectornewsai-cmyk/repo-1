#!/usr/bin/env node
/**
 * test_v17_complex_parity.js — Phase 9 đợt 17, luồng N6: parity
 * preview-vs-render trên nguồn PHỨC TẠP HƠN đợt 16 H6 + nguồn CHUYỂN ĐỘNG.
 *
 * GHI RÕ NGUỒN (không mạo nhận footage máy quay thật):
 * - Trong repo KHÔNG có footage máy quay thật: đã kiểm tra bằng mắt 3 file
 *   mp4 lớn nhất (mcp-server/renders/agent-demo.mp4, demos/keyframe-video.mp4,
 *   demo_out/demo-wipes.mp4) — tất cả đều là smptebars + chữ + hình tổng
 *   hợp, giống clip1/clip2 mà H6 đã kết luận. Vì vậy đợt này KHÔNG dùng
 *   chúng làm "footage thật"; chúng chỉ xuất hiện ở script FPS (vai trò
 *   video decode thật), không ở đây.
 * - Nguồn X "complex" của đợt này: ảnh tổng hợp bằng Node (không phải ảnh
 *   chụp): gradient + nhiễu fractal đa tầng (value noise 5 octave) + nhiễu
 *   hạt mịn từng pixel + cạnh sắc (checker, khối, đường chéo). Phức tạp
 *   hơn hẳn nguồn P của H6 (gradient + nhiễu đều + vài khối phẳng) — có
 *   bảng chỉ số độ phức tạp so sánh trực tiếp với P trong output.
 * - Nguồn M "moving complex": cùng ảnh X nhưng cửa sổ crop 1280×720 trượt
 *   tuyến tính trên master 1600×900 trong 2 giây (A xuôi, B ngược), nên
 *   nội dung CHUYỂN ĐỘNG thật trong lúc transition — điều mà nguồn tĩnh
 *   P/X đều không có. Khung A/B lấy bằng ĐÚNG filter chain của render
 *   nên căn thời gian đúng theo ngữ nghĩa xfade (A n=45, B n=15).
 * - Effect: mirror (hflip) + pixelate t=0.43 (k=8, chia hết 1280×720) —
 *   filter render lấy đúng effects.js (hflip; scale neighbor iw/8 rồi iw*8),
 *   model canvas lấy đúng effectCanvas.ts thật (transpile, không copy).
 *
 * Phương pháp (khớp H6/V11/V12/V14, khung 1280×720):
 * - Render: FFmpeg thật, xfade duration=1 offset=1, format rgb24, chỉ lấy
 *   frame index 45 @30fps (t=1.5, p=0.5) qua select — KHÔNG ghi full raw
 *   (mỗi frame 720p rgb24 là 2,7MB; /tmp VM chỉ 512MB).
 * - Preview: describeTransition(type, 0.5, 1280, 720) thật + module chung
 *   harnessShared.js, lấy màu từ frame A/B thật (như H6).
 * - Thang V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20
 *   và ≥90% ≤ 8; còn lại LỆCH.
 *
 * Cách chạy (từ server/render/): node src/test_v17_complex_parity.js
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 * KHÔNG sửa code sản phẩm, KHÔNG sửa harness cũ, KHÔNG tải binary về repo.
 *
 * Đợt 18, luồng harness-YUV: thêm flag --mode cho ô yuv420p e2e cuối
 * script (phần còn lại của script giữ nguyên, chế độ cũ là mặc định):
 * - --mode=old (mặc định): đúng code cũ — xfade trên nguồn PNG rồi
 *   format yuv420p, encode libx264 crf18, decode sang rgb24, so RGB.
 * - --mode=rgb24: chế độ đo (a) — ép format=rgb24 cho cả 2 đầu vào
 *   TRƯỚC xfade (theo phát hiện N5 đợt 17), rồi encode/decode/so RGB
 *   như cũ. Kỳ vọng: số về mức KHỚP của mô hình xfade rgb24.
 * - --mode=yuv: chế độ đo (b) — như rgb24 nhưng decode ra yuv420p
 *   raw và so trong miền YUV bằng harnessShared.rgbToYuv420 +
 *   yuv420Mad (preview RGB chuyển sang YUV bằng cùng hàm JS).
 *   Thang V6 được định nghĩa cho MAD RGB; số YUV in kèm phân loại
 *   V6 chỉ mang tính tham chiếu, không phải chuẩn badge mới.
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "n6-complex-"));
const W = 1280;
const H = 720;
const MW = 1600;
const MH = 900;
const FPS = 30;

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
  spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}`);
  return require(jsFile);
}

// ---- Nhiễu value fractal xác định (hash lattice, không bảng) ----
function hash2(ix, iy, seed) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 974634)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function valueNoise(x, y, cellsX, cellsY, seed) {
  const gx = x * cellsX, gy = y * cellsY;
  const ix = Math.floor(gx), iy = Math.floor(gy);
  const fx = smooth(gx - ix), fy = smooth(gy - iy);
  const v00 = hash2(ix, iy, seed), v10 = hash2(ix + 1, iy, seed);
  const v01 = hash2(ix, iy + 1, seed), v11 = hash2(ix + 1, iy + 1, seed);
  return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Scene: gradient dọc + fractal (5 octave) + hạt mịn + cạnh sắc.
// pal = [c0r,c0g,c0b, c1r,c1g,c1b]; seed khác nhau cho A/B.
function genScene(w, h, pal, seed) {
  const buf = Buffer.alloc(w * h * 3);
  const rnd = mulberry(seed * 7919 + 13);
  const grain = new Float32Array(w * h);
  for (let i = 0; i < grain.length; i++) grain[i] = (rnd() - 0.5) * 50; // hạt ±25: gần mức nhiễu cảm biến ảnh thật hơn ±12 ban đầu
  const octaves = [[4, 0.32], [8, 0.24], [16, 0.18], [32, 0.14], [64, 0.12]];
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const br = pal[0] + (pal[3] - pal[0]) * t;
    const bg = pal[1] + (pal[4] - pal[1]) * t;
    const bb = pal[2] + (pal[5] - pal[2]) * t;
    for (let x = 0; x < w; x++) {
      const nx = x / w, ny = y / h;
      let n = 0;
      for (const [cells, wt] of octaves) n += wt * valueNoise(nx, ny, cells, Math.round(cells * h / w), seed);
      const lum = (n - 0.5) * 110; // dao động độ sáng do fractal
      let r = br + lum, g = bg + lum * 0.9, b = bb + lum * 1.1;
      const gr = grain[y * w + x];
      r += gr; g += gr; b += gr;
      // Cạnh sắc: checker 40px vùng giữa-phải + khối + đường chéo cứng.
      const inChecker = x >= w * 0.55 && x < w * 0.85 && y >= h * 0.45 && y < h * 0.85;
      if (inChecker && ((Math.floor(x / 40) + Math.floor(y / 40)) % 2 === 0)) { r += 70; g += 70; b -= 40; }
      if (x >= 100 && x < 300 && y >= 100 && y < 260) { r = 30; g = 30; b = 30; }
      if (Math.abs((y - 0.25 * h) - (x - 0.1 * w) * 0.35) < 2) { r = 255; g = 220; b = 0; }
      const i = (y * w + x) * 3;
      buf[i] = Math.max(0, Math.min(255, Math.round(r)));
      buf[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      buf[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
  }
  return buf;
}

function rawToPng(raw, w, h, pngPath) {
  const rawPath = pngPath.replace(/\.png$/, ".raw");
  fs.writeFileSync(rawPath, raw);
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", rawPath, "-frames:v", "1", "-y", pngPath]);
  fs.unlinkSync(rawPath);
  return pngPath;
}
function pngToRaw(png, rawName, w, h) {
  const out = path.join(TMP, rawName);
  ffmpeg(["-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}
// Chỉ số độ phức tạp: std kênh, năng lượng cao tần (diff ngang TB), tỉ lệ
// pixel có diff ngang > 32.
function complexity(buf, w, h) {
  let sumR = 0, sumG = 0, sumB = 0;
  const n = w * h;
  for (let i = 0; i < n; i++) { sumR += buf[i * 3]; sumG += buf[i * 3 + 1]; sumB += buf[i * 3 + 2]; }
  const mR = sumR / n, mG = sumG / n, mB = sumB / n;
  let vR = 0, vG = 0, vB = 0, hf = 0, big = 0, cnt = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    vR += (buf[i] - mR) ** 2; vG += (buf[i + 1] - mG) ** 2; vB += (buf[i + 2] - mB) ** 2;
    if (x + 1 < w) {
      const d = (Math.abs(buf[i] - buf[i + 3]) + Math.abs(buf[i + 1] - buf[i + 4]) + Math.abs(buf[i + 2] - buf[i + 5])) / 3;
      hf += d; cnt++;
      if (d > 32) big++;
    }
  }
  return {
    std: ((Math.sqrt(vR / n) + Math.sqrt(vG / n) + Math.sqrt(vB / n)) / 3).toFixed(1),
    hf: (hf / cnt).toFixed(2),
    bigPct: ((big / cnt) * 100).toFixed(2),
  };
}

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
  let sum = 0, le8 = 0;
  const n = W * H * 3;
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
function renderXfadeFromStills(type, pngA, pngB, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-framerate", String(FPS), "-loop", "1", "-t", "2", "-i", pngA,
    "-framerate", String(FPS), "-loop", "1", "-t", "2", "-i", pngB,
    "-filter_complex", `[0:v][1:v]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}
// Nguồn chuyển động: crop trượt trên master (A xuôi, B ngược). Frame A
// lấy đúng n=45, frame B đúng n=15, render xfade cũng đúng 2 chain này.
function movingChain(png, dir) {
  // Dùng biến t (timestamp khung, chắc chắn crop hỗ trợ) thay vì n:
  // input loop 30fps, 2 giây -> t chạy 0..2; A xuôi 0->320/0->180,
  // B ngược 320->0/180->0. Frame n=45 <=> t=1.5 (A), n=15 <=> t=0.5 (B).
  const fx = dir === "fwd" ? "320*t/2" : "320*(1-t/2)";
  const fy = dir === "fwd" ? "180*t/2" : "180*(1-t/2)";
  return { png, filter: `crop=${W}:${H}:x='${fx}':y='${fy}'` };
}
function movingFrame(chain, n, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-framerate", String(FPS), "-loop", "1", "-t", "2", "-i", chain.png,
    "-vf", `${chain.filter},select='eq(n,${n})'`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}
function renderXfadeFromMoving(type, chainA, chainB, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-framerate", String(FPS), "-loop", "1", "-t", "2", "-i", chainA.png,
    "-framerate", String(FPS), "-loop", "1", "-t", "2", "-i", chainB.png,
    "-filter_complex",
    `[0:v]${chainA.filter}[a];[1:v]${chainB.filter}[b];[a][b]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}
function renderEffect(filter, png, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", png, "-vf", `${filter},format=rgb24`, "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}

const MODE = (() => {
  const arg = process.argv.find((a) => a.startsWith("--mode="));
  const m = arg ? arg.slice("--mode=".length) : "old";
  if (!["old", "rgb24", "yuv"].includes(m)) throw new Error(`--mode không hợp lệ: ${m} (chọn old|rgb24|yuv)`);
  return m;
})();

function main() {
  console.log(`== N6 complex parity (1280x720, rgb24, frame 45 @30fps, p=0.5) [đợt 18: yuv-e2e mode=${MODE}] ==`);
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  const ec = transpileTs(path.join("apps", "web", "src", "lib", "effectCanvas.ts"), "ec-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  console.log(`module thật: radialGradientWeight=${typeof tp.radialGradientWeight}, ffmpegDissolveFrand=${typeof df.ffmpegDissolveFrand}, applyMirror=${typeof ec.applyMirror}, applyPixelate=${typeof ec.applyPixelate}`);

  // Master 1600x900 cho cả tĩnh (crop giữa) lẫn chuyển động (crop trượt).
  const masterA = genScene(MW, MH, [58, 123, 213, 247, 183, 51], 11);
  const masterB = genScene(MW, MH, [43, 16, 85, 117, 151, 222], 29);
  const pngMA = rawToPng(masterA, MW, MH, path.join(TMP, "masterA.png"));
  const pngMB = rawToPng(masterB, MW, MH, path.join(TMP, "masterB.png"));
  // Tĩnh: crop giữa 1280x720.
  const pngXA = path.join(TMP, "stillA.png");
  const pngXB = path.join(TMP, "stillB.png");
  ffmpeg(["-i", pngMA, "-vf", `crop=${W}:${H}:(in_w-${W})/2:(in_h-${H})/2`, "-frames:v", "1", "-y", pngXA]);
  ffmpeg(["-i", pngMB, "-vf", `crop=${W}:${H}:(in_w-${W})/2:(in_h-${H})/2`, "-frames:v", "1", "-y", pngXB]);
  const frameXA = pngToRaw(pngXA, "stillA.raw", W, H);
  const frameXB = pngToRaw(pngXB, "stillB.raw", W, H);
  // Đối chứng H6 P: tái tạo đúng filter H6 để đo chỉ số phức tạp.
  const pngPA = path.join(TMP, "h6PA.png");
  const pngPB = path.join(TMP, "h6PB.png");
  ffmpeg(["-f", "lavfi", "-i",
    `gradients=s=${W}x${H}:c0=0x3a7bd5:c1=0xf7b733:x0=0:y0=0:x1=0:y1=${H},noise=alls=18:allf=t,` +
    `drawbox=x=80:y=380:w=220:h=340:color=0x1c2733:t=fill,drawbox=x=360:y=300:w=180:h=420:color=0x2a3a4a:t=fill,` +
    `drawbox=x=620:y=430:w=260:h=290:color=0x22303e:t=fill,drawbox=x=980:y=340:w=180:h=380:color=0x1c2733:t=fill,` +
    `drawbox=x=1050:y=120:w=90:h=90:color=0xfff2b0:t=fill`,
    "-frames:v", "1", "-y", pngPA]);
  ffmpeg(["-f", "lavfi", "-i",
    `gradients=s=${W}x${H}:c0=0x2b1055:c1=0x7597de:x0=0:y0=0:x1=0:y1=${H},noise=alls=22:allf=t,` +
    `drawbox=x=60:y=420:w=300:h=300:color=0x12081f:t=fill,drawbox=x=430:y=360:w=150:h=360:color=0x1e1033:t=fill,` +
    `drawbox=x=700:y=450:w=220:h=270:color=0x2a1846:t=fill,drawbox=x=1000:y=300:w=200:h=420:color=0x12081f:t=fill,` +
    `drawbox=x=180:y=90:w=120:h=120:color=0xffd9ec:t=fill`,
    "-frames:v", "1", "-y", pngPB]);
  const framePA = pngToRaw(pngPA, "h6PA.raw", W, H);
  const framePB = pngToRaw(pngPB, "h6PB.raw", W, H);
  const cXA = complexity(frameXA, W, H), cXB = complexity(frameXB, W, H);
  const cPA = complexity(framePA, W, H), cPB = complexity(framePB, W, H);
  console.log(`độ phức tạp (std kênh / diff ngang TB / %diff>32):`);
  console.log(`  X-A complex: std=${cXA.std} hf=${cXA.hf} big=${cXA.bigPct}%`);
  console.log(`  X-B complex: std=${cXB.std} hf=${cXB.hf} big=${cXB.bigPct}%`);
  console.log(`  H6 P-A:      std=${cPA.std} hf=${cPA.hf} big=${cPA.bigPct}%`);
  console.log(`  H6 P-B:      std=${cPB.std} hf=${cPB.hf} big=${cPB.bigPct}%`);

  for (const type of ["dissolve", "circleopen", "wipeleft"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameXA, frameXB);
    const rendered = renderXfadeFromStills(type, pngXA, pngXB, `static-${type}`);
    const m = compareFrames(rendered, preview);
    console.log(`X tĩnh | ${type} | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  // Chuyển động: A xuôi, B ngược.
  const chainA = movingChain(pngMA, "fwd");
  const chainB = movingChain(pngMB, "rev");
  const frameMA = movingFrame(chainA, 45, "movA-45");
  const frameMB = movingFrame(chainB, 15, "movB-15");
  for (const type of ["dissolve", "circleopen", "wipeleft"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameMA, frameMB);
    const rendered = renderXfadeFromMoving(type, chainA, chainB, `mov-${type}`);
    const m = compareFrames(rendered, preview);
    console.log(`M chuyển động | ${type} | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  // Effect trên X-A tĩnh (model canvas thật, filter render đúng effects.js).
  const rgba = (rgb) => {
    const out = Buffer.alloc(W * H * 4);
    for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) { out[j] = rgb[i]; out[j + 1] = rgb[i + 1]; out[j + 2] = rgb[i + 2]; out[j + 3] = 255; }
    return { width: W, height: H, data: new Uint8ClampedArray(out) };
  };
  const rgbOf = (img) => {
    const out = Buffer.alloc(W * H * 3);
    for (let i = 0, j = 0; i < out.length; i += 3, j += 4) { out[i] = img.data[j]; out[i + 1] = img.data[j + 1]; out[i + 2] = img.data[j + 2]; }
    return out;
  };
  {
    const model = rgbOf(ec.applyMirror(rgba(frameXA)));
    const rendered = renderEffect("hflip", pngXA, "fx-mirror");
    const m = compareFrames(rendered, model);
    console.log(`X tĩnh | effect mirror (hflip) | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  {
    // pixelate t=0.43 -> k = 2+round(0.43*14) = 8; 1280/8, 720/8 đều nguyên.
    const model = rgbOf(ec.applyPixelate(rgba(frameXA), 0.43));
    const rendered = renderEffect("scale=iw/8:ih/8:flags=neighbor,scale=iw*8:ih*8:flags=neighbor", pngXA, "fx-pixelate");
    const m = compareFrames(rendered, model);
    console.log(`X tĩnh | effect pixelate t=0.43 k=8 | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  // Ô yuv420p e2e trên X tĩnh (đối chứng phạm vi badge, như H6).
  // Đợt 18: --mode chọn cách đo của ô này; các ô trên giữ nguyên.
  {
    const mp4 = path.join(TMP, "yuv-X-dissolve.mp4");
    const pre = MODE === "old" ? "" : "[0:v]format=rgb24[a];[1:v]format=rgb24[b];";
    const srcA = MODE === "old" ? "[0:v]" : "[a]";
    const srcB = MODE === "old" ? "[1:v]" : "[b]";
    ffmpeg(["-loop", "1", "-t", "2", "-i", pngXA, "-loop", "1", "-t", "2", "-i", pngXB,
      "-filter_complex", `${pre}${srcA}${srcB}xfade=transition=dissolve:duration=1:offset=1,format=yuv420p[v]`,
      "-map", "[v]", "-r", String(FPS), "-t", "2", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-y", mp4]);
    const out = path.join(TMP, "yuv-X-dissolve.raw");
    const visual = tp.describeTransition("dissolve", 0.5, W, H);
    const preview = previewFrame(visual, frameXA, frameXB);
    if (MODE === "yuv") {
      ffmpeg(["-i", mp4, "-vf", "select=eq(n\\,45)", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-y", out]);
      const renderedYuv = fs.readFileSync(out);
      fs.unlinkSync(out);
      fs.unlinkSync(mp4);
      const previewYuv = shared.rgbToYuv420(preview, W, H);
      const m = shared.yuv420Mad(renderedYuv, previewYuv, W, H);
      console.log(`X tĩnh yuv420p-e2e [mode=yuv] | dissolve | MAD-YUV=${m.mad.toFixed(4)} (Y=${m.madY.toFixed(4)} U=${m.madU.toFixed(4)} V=${m.madV.toFixed(4)}) <=8: ${(m.le8 * 100).toFixed(2)}% | V6-tham-chiếu=${m.mad <= 2 && m.le8 >= 0.99 ? "KHỚP" : m.mad <= 20 && m.le8 >= 0.90 ? "XẤP XỈ" : "LỆCH"} (thang V6 gốc định nghĩa cho RGB)`);
    } else {
      ffmpeg(["-i", mp4, "-vf", "select=eq(n\\,45)", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
      const rendered = fs.readFileSync(out);
      fs.unlinkSync(out);
      fs.unlinkSync(mp4);
      const m = compareFrames(rendered, preview);
      console.log(`X tĩnh yuv420p-e2e [mode=${MODE}] | dissolve | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
    }
  }
  console.log(`tmp: ${TMP} (chỉ còn PNG master + still, không raw lớn; không đưa vào batch stage)`);
  console.log(`DONE v17-complex-parity`);
}

main();
