#!/usr/bin/env node
/**
 * measure_h6_photo_parity.js — Phase 9 đợt 16, luồng H6: đo parity
 * dissolve/circleopen ở 720p trên nguồn KHÔNG PHẢI lavfi thuần sắc,
 * để trả lời câu hỏi đợt 15 để lại: footage (nội dung có chi tiết)
 * có làm đổi hạng badge matched hay không.
 *
 * Nguồn đo (GHI RÕ, không mạo nhận footage máy quay thật):
 * - Cặp P "photo-like": 2 ảnh tĩnh tổng hợp bằng FFmpeg (gradient +
 *   nhiễu + khối hình chữ nhật) — gọi là "giống ảnh chụp" ở mức trừu
 *   tượng, KHÔNG phải ảnh chụp thật, KHÔNG phải footage máy quay.
 * - Cặp L "lavfi đối chứng": 2 frame testsrc2/smptebars ở 720p, cùng
 *   phương pháp đo, để so sánh apples-to-apples với cặp P.
 * - Cặp C "file trong repo": server/render/examples/media/clip1.mp4
 *   và clip2.mp4 — đây cũng là test pattern tổng hợp (đã kiểm tra bằng
 *   mắt: clip1 là smptebars/testsrc2, clip2 là smptebars + drawtext),
 *   KHÔNG phải footage máy quay; cặp này chỉ chứng minh đường dẫn
 *   decode file (không phải lavfi trực tiếp) cho cùng kết quả.
 *   Cặp C cần căn thời gian đúng ngữ nghĩa xfade: frame giữa transition
 *   (t=1.5, offset=1, duration=1) lấy A(t=1.5) và B(t=0.5) — ngữ nghĩa
 *   này đã kiểm chứng bằng timestamp cháy trong clip2 trước khi đo.
 *
 * Phương pháp (khớp quy ước harness V11/V12/V14, khung 1280×720):
 * - Render: FFmpeg thật, xfade duration=1 offset=1, format rgb24,
 *   lấy frame index 45 @30fps (t=1.5, p=0.5) — trừ ô yuv420p e2e.
 * - Preview: describeTransition(type, 0.5, 1280, 720) từ module thật
 *   (transpile bằng tsc sang /tmp, như harness) + raster tổng quát
 *   dùng CHÍNH module dùng chung harnessShared.js (layerPixelAlpha /
 *   layerCovers / regionCovers), nhưng lấy màu pixel từ frame A/B thật
 *   thay vì màu thuần đỏ/xanh của harness. Nhờ đó số đo này đồng thời
 *   kiểm chứng module chung trên nội dung có chi tiết.
 * - Phân loại thang V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8.
 *
 * Cách chạy (từ server/render/): node src/measure_h6_photo_parity.js
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 */
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "h6-photo-"));
const W = 1280;
const H = 720;
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
  const r = spawnSync(findTsc(), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  const jsFile = path.join(outDir, `${path.basename(src, ".ts")}.js`);
  if (!fs.existsSync(jsFile)) throw new Error(`tsc không sinh ra ${jsFile}: ${(r.stderr || "").slice(0, 300)}`);
  return require(jsFile);
}

// ---- Ảnh preview tổng quát từ visual + frame A/B thật (rgb24) ----
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

// ---- Nguồn ----
function stillPng(name, filter) {
  const out = path.join(TMP, name);
  ffmpeg(["-f", "lavfi", "-i", filter, "-frames:v", "1", "-y", out]);
  return out;
}
function pngToRaw(png, rawName) {
  const out = path.join(TMP, rawName);
  ffmpeg(["-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  return fs.readFileSync(out);
}
// Render xfade rgb24, chỉ lấy frame giữa transition (index 45 @30fps,
// t=1.5, p=0.5) qua select — KHÔNG ghi 60 frame raw (mỗi frame 720p
// rgb24 là 2,7MB, 60 frame là 165MB; /tmp VM chỉ 512MB, đợt chạy đầu
// đã đầy ổ giữa chừng vì lỗi này).
// Đầu vào ảnh tĩnh ép framerate 30 để select đếm đúng khung 30fps;
// file mp4 nguồn vốn đã 30fps nên select cũng đếm đúng.
function renderXfadeFromStills(type, pngA, pngB, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-framerate", String(FPS), "-loop", "1", "-t", "2", "-i", pngA,
    "-framerate", String(FPS), "-loop", "1", "-t", "2", "-i", pngB,
    "-filter_complex", `[0:v][1:v]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}
// Render xfade rgb24 từ 2 file mp4, chỉ lấy frame giữa transition.
function renderXfadeFromFiles(type, fileA, fileB, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", fileA, "-i", fileB,
    "-filter_complex", `[0:v][1:v]xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,45)'[v]`,
    "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}
// Frame của file nguồn tại thời điểm t (rgb24).
function fileFrameAt(file, t, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  return fs.readFileSync(out);
}
// Ô yuv420p e2e cho cặp ảnh tĩnh: xfade rồi encode libx264 yuv420p,
// decode lại frame giữa, so với preview rgb.
function renderXfadeYuv420(type, pngA, pngB, tag) {
  const mp4 = path.join(TMP, `${tag}.mp4`);
  ffmpeg(["-loop", "1", "-t", "2", "-i", pngA, "-loop", "1", "-t", "2", "-i", pngB,
    "-filter_complex", `[0:v][1:v]xfade=transition=${type}:duration=1:offset=1,format=yuv420p[v]`,
    "-map", "[v]", "-r", String(FPS), "-t", "2", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-y", mp4]);
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", mp4, "-vf", "select=eq(n\\,45)", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  return fs.readFileSync(out);
}

function main() {
  console.log(`== H6 photo parity (720p, rgb24, frame 45 @30fps, p=0.5) ==`);
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);
  console.log(`module thật: radialGradientWeight=${typeof tp.radialGradientWeight}, ffmpegDissolveFrand=${typeof df.ffmpegDissolveFrand}`);

  // Cặp P: ảnh "giống ảnh chụp" tổng hợp (gradient + nhiễu + khối).
  const pngPA = stillPng("photoA.png",
    `gradients=s=${W}x${H}:c0=0x3a7bd5:c1=0xf7b733:x0=0:y0=0:x1=0:y1=${H},noise=alls=18:allf=t,` +
    `drawbox=x=80:y=380:w=220:h=340:color=0x1c2733:t=fill,drawbox=x=360:y=300:w=180:h=420:color=0x2a3a4a:t=fill,` +
    `drawbox=x=620:y=430:w=260:h=290:color=0x22303e:t=fill,drawbox=x=980:y=340:w=180:h=380:color=0x1c2733:t=fill,` +
    `drawbox=x=1050:y=120:w=90:h=90:color=0xfff2b0:t=fill`);
  const pngPB = stillPng("photoB.png",
    `gradients=s=${W}x${H}:c0=0x2b1055:c1=0x7597de:x0=0:y0=0:x1=0:y1=${H},noise=alls=22:allf=t,` +
    `drawbox=x=60:y=420:w=300:h=300:color=0x12081f:t=fill,drawbox=x=430:y=360:w=150:h=360:color=0x1e1033:t=fill,` +
    `drawbox=x=700:y=450:w=220:h=270:color=0x2a1846:t=fill,drawbox=x=1000:y=300:w=200:h=420:color=0x12081f:t=fill,` +
    `drawbox=x=180:y=90:w=120:h=120:color=0xffd9ec:t=fill`);
  const framePA = pngToRaw(pngPA, "photoA.raw");
  const framePB = pngToRaw(pngPB, "photoB.raw");
  // Cặp L: lavfi đối chứng.
  const pngLA = stillPng("lavfiA.png", `testsrc2=s=${W}x${H}:rate=${FPS}`);
  const pngLB = stillPng("lavfiB.png", `smptebars=s=${W}x${H}:rate=${FPS}`);
  const frameLA = pngToRaw(pngLA, "lavfiA.raw");
  const frameLB = pngToRaw(pngLB, "lavfiB.raw");
  // Cặp C: file trong repo (test pattern, không phải footage máy quay).
  const fileA = path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
  const fileB = path.join(ROOT, "server", "render", "examples", "media", "clip2.mp4");
  const frameCA = fileFrameAt(fileA, 1.5, "clipA-1.5");
  const frameCB = fileFrameAt(fileB, 0.5, "clipB-0.5");

  const pairs = [
    { name: "P photo-like (tổng hợp)", a: framePA, b: framePB, pngA: pngPA, pngB: pngPB, mode: "stills" },
    { name: "L lavfi đối chứng", a: frameLA, b: frameLB, pngA: pngLA, pngB: pngLB, mode: "stills" },
    { name: "C file repo clip1/clip2", a: frameCA, b: frameCB, fileA, fileB, mode: "files" },
  ];
  for (const pair of pairs) {
    for (const type of ["dissolve", "circleopen"]) {
      const visual = tp.describeTransition(type, 0.5, W, H);
      const preview = previewFrame(visual, pair.a, pair.b);
      const rendered = pair.mode === "stills"
        ? renderXfadeFromStills(type, pair.pngA, pair.pngB, `x-${pair.name}-${type}`.replace(/[^a-z0-9]+/gi, "-"))
        : renderXfadeFromFiles(type, pair.fileA, pair.fileB, `x-${pair.name}-${type}`.replace(/[^a-z0-9]+/gi, "-"));
      const m = compareFrames(rendered, preview);
      console.log(`${pair.name} | ${type} | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
    }
  }
  // Ô yuv420p e2e cho cặp P (đối chứng phạm vi badge).
  for (const type of ["dissolve", "circleopen"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, framePA, framePB);
    const rendered = renderXfadeYuv420(type, pngPA, pngPB, `yuv-P-${type}`);
    const m = compareFrames(rendered, preview);
    console.log(`P photo-like yuv420p-e2e | ${type} | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  // Đối chứng màu thuần 720p (cùng phương pháp): nếu màu thuần KHỚP mà
  // ảnh chi tiết LỆCH thì lỗi nằm ở phía nội dung, không phải cỡ khung.
  const pngRA = stillPng("solidA.png", `color=c=red:s=${W}x${H}:r=${FPS}:d=1`);
  const pngRB = stillPng("solidB.png", `color=c=blue:s=${W}x${H}:r=${FPS}:d=1`);
  const frameRA = pngToRaw(pngRA, "solidA.raw");
  const frameRB = pngToRaw(pngRB, "solidB.raw");
  for (const type of ["dissolve", "circleopen"]) {
    const visual = tp.describeTransition(type, 0.5, W, H);
    const preview = previewFrame(visual, frameRA, frameRB);
    const rendered = renderXfadeFromStills(type, pngRA, pngRB, `solid-${type}`);
    const m = compareFrames(rendered, preview);
    console.log(`S solid 720p đối chứng | ${type} | MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% | ${classify(m)}`);
  }
  // Chẩn đoán circleopen trên cặp P: MAD theo vành bán kính + dump 2
  // frame để nhìn trực tiếp (xem LIMITS H6).
  {
    const visual = tp.describeTransition("circleopen", 0.5, W, H);
    const preview = previewFrame(visual, framePA, framePB);
    const rendered = renderXfadeFromStills("circleopen", pngPA, pngPB, "diag-P-circleopen");
    const cx = Math.floor(W / 2), cy = Math.floor(H / 2), rMax = Math.hypot(cx, cy);
    const bins = Array.from({ length: 11 }, () => ({ sum: 0, n: 0 }));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const rho = Math.hypot(x - cx, y - cy) / rMax;
      const bi = Math.min(10, Math.floor(rho * 10));
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) { bins[bi].sum += Math.abs(rendered[i + c] - preview[i + c]); bins[bi].n++; }
    }
    console.log(`chẩn đoán P circleopen theo vành rho (MAD từng vành):`);
    bins.forEach((b, k) => console.log(`  rho ${k === 10 ? ">1.0" : `${(k / 10).toFixed(1)}-${((k + 1) / 10).toFixed(1)}`}: MAD=${(b.sum / b.n).toFixed(3)} (n=${b.n})`));
    const dumpRaw = (buf, name) => {
      const p = path.join(TMP, name);
      fs.writeFileSync(p, buf);
      ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", p, "-frames:v", "1", "-y", p.replace(/\.raw$/, ".png")]);
    };
    dumpRaw(preview, "diag-P-circleopen-preview.raw");
    dumpRaw(rendered, "diag-P-circleopen-render.raw");
    console.log(`dump chẩn đoán: ${TMP}/diag-P-circleopen-preview.png và -render.png`);
  }
  console.log(`tmp: ${TMP} (giữ lại để đối chứng, không đưa vào batch stage)`);
}

main();
