#!/usr/bin/env node
/**
 * test_v17_source_align.mjs — Phase 9 đợt 17, luồng N5: truy nguyên
 * cặp clip1/clip2 XẤP XỈ mà đợt 16 (H6) để lại.
 *
 * Bối cảnh (đọc từ docs/PHASE9_ROUND16_H6_SHARED_FOOTAGE_LIMITS.md):
 * cùng phương pháp H6 (xfade duration=1 offset=1, format rgb24, frame
 * giữa transition n=45 @30fps, t=1.5, p=0.5, khung 1280×720) thì nguồn
 * photo-like tổng hợp KHỚP ở rgb24 (dissolve 0,0012 / circleopen
 * 0,2817) nhưng cặp file repo clip1.mp4/clip2.mp4 chỉ XẤP XỈ
 * (dissolve 1,2424 / circleopen 1,5943). H6 nghi "căn frame thời gian"
 * nhưng CHƯA chứng minh bằng thực nghiệm đối chứng từng frame.
 *
 * Script này KHÔNG sửa V11/V12/V13/V14/harnessShared.js. Nó chỉ đo,
 * bằng cách tách riêng từng giả thuyết và đo MAD cho từng giả thuyết:
 *
 *   H-ALIGN : lệch 1 (hoặc vài) frame ở A, ở B, hoặc cả hai.
 *   H-OUT   : frame render n=45 không ứng với p=0.5 (sai chỉ số đầu
 *             ra), hoặc p thật của nó lệch khỏi 0.5.
 *   H-SEEK  : cách H6 lấy frame bằng `-ss t` trước `-i` cho frame
 *             khác với frame thứ n theo thứ tự trình chiếu.
 *   H-TB    : fps / timebase / start_time của 2 file khác nhau nên
 *             xfade căn sai (kiểm bằng ffprobe + khung neo §E1/E6).
 *   H-CSPACE: xfade blend trong miền yuv420p gốc (chroma subsample)
 *             trong khi preview blend 2 frame đã decode sang rgb24.
 *             Bằng chứng quyết định: ép format=rgb24 (và yuv444p)
 *             TRƯỚC xfade — nếu MAD sụp về ~0 thì nguyên nhân là
 *             miền blend, không phải căn frame.
 *   H-ALPHA : nền/alpha khác nhau (2 file đều yuv420p = không kênh
 *             alpha; kiểm bằng ffprobe, không có gì để blend thêm).
 *
 * Thang phân loại (thang V6, như H6): KHỚP = MAD ≤ 2 và ≥99% pixel
 * lệch ≤ 8; XẤP XỈ = MAD ≤ 20 và ≥90% ≤ 8; còn lại LỆCH.
 *
 * Cách chạy (từ server/render/): node src/test_v17_source_align.mjs
 * Exit 0 khi đo xong (kể cả LỆCH — đó là kết quả đo, không phải lỗi).
 * Script tái dùng tên file tạm cố định trong 1 thư mục /tmp để không
 * đầy ổ (bài học H6: /tmp VM chỉ 512MB), và xoá thư mục tạm khi xong.
 */
"use strict";

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "..", "..", "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "v17-align-"));
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

// ---- Preview: sao chép đúng logic previewFrame của H6 (không sửa) ----
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
const fmt = (m) => `MAD=${m.mad.toFixed(4)} <=8: ${(m.le8 * 100).toFixed(2)}% ${classify(m)}`;

// ---- Trích frame: tái dùng 1 tên file tạm cho mỗi loại trích ----
// Frame thứ n theo thứ tự trình chiếu (decode tuần tự, select eq(n)).
function frameByIndex(file, n, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-i", file, "-vf", `select='eq(n,${n})'`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  return fs.readFileSync(out);
}
// Frame theo cách H6: -ss trước -i (input seeking).
function frameBySeek(file, t, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  ffmpeg(["-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-y", out]);
  return fs.readFileSync(out);
}
// Render xfade, chỉ lấy frame đầu ra thứ n (select eq(n)).
// variant: "orig" (đúng H6), "rgb" (format=rgb24 trước xfade),
// "yuv444" (format=yuv444p trước xfade), "norm" (fps=30+settb trước).
function renderXfade(type, fileA, fileB, outN, variant, tag) {
  const out = path.join(TMP, `${tag}.raw`);
  let preA = "[0:v]", preB = "[1:v]";
  let pre = "";
  if (variant === "rgb") { pre = "[0:v]format=rgb24[a0];[1:v]format=rgb24[b0];"; preA = "[a0]"; preB = "[b0]"; }
  if (variant === "yuv444") { pre = "[0:v]format=yuv444p[a0];[1:v]format=yuv444p[b0];"; preA = "[a0]"; preB = "[b0]"; }
  if (variant === "norm") { pre = "[0:v]fps=30,settb=AVTB[a0];[1:v]fps=30,settb=AVTB[b0];"; preA = "[a0]"; preB = "[b0]"; }
  const fc = `${pre}${preA}${preB}xfade=transition=${type}:duration=1:offset=1,format=rgb24,select='eq(n,${outN})'[v]`;
  ffmpeg(["-i", fileA, "-i", fileB, "-filter_complex", fc, "-map", "[v]", "-frames:v", "1", "-f", "rawvideo", "-y", out]);
  return fs.readFileSync(out);
}

function main() {
  console.log("== V17 source align: truy nguyên cặp clip1/clip2 XẤP XỈ của H6 ==");
  console.log(`ffmpeg: ${spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.split("\n")[0]}`);
  const fileA = path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
  const fileB = path.join(ROOT, "server", "render", "examples", "media", "clip2.mp4");

  // ---- E0: ffprobe — H-TB và H-ALPHA (đọc số, không đoán) ----
  const probe = (f) => JSON.parse(run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,avg_frame_rate,r_frame_rate,time_base,start_time,duration,nb_frames,pix_fmt,color_space,color_transfer,color_primaries,color_range,chroma_location,sample_aspect_ratio",
    "-show_entries", "format=duration,start_time", "-of", "json", f]).stdout);
  const pa = probe(fileA).streams[0];
  const pb = probe(fileB).streams[0];
  console.log("E0 ffprobe clip1:", JSON.stringify(pa));
  console.log("E0 ffprobe clip2:", JSON.stringify(pb));
  console.log(`E0 H-TB: fps ${pa.avg_frame_rate} vs ${pb.avg_frame_rate}; timebase ${pa.time_base} vs ${pb.time_base}; start ${pa.start_time} vs ${pb.start_time}; size ${pa.width}x${pa.height} vs ${pb.width}x${pb.height}`);
  console.log(`E0 H-ALPHA: pix_fmt ${pa.pix_fmt} vs ${pb.pix_fmt} (yuv420p = KHÔNG kênh alpha; không có gì để blend nền/alpha thêm)`);

  const tp = transpileTs(path.join("apps", "web", "src", "lib", "transitionPreview.ts"), "tp-js");
  const df = transpileTs(path.join("apps", "web", "src", "lib", "dissolveFrand.ts"), "df-js");
  if (typeof tp.radialGradientWeight === "function") shared.setRadialWeight(tp.radialGradientWeight);
  if (typeof df.ffmpegDissolveFrand === "function") shared.setDissolveFrand(df.ffmpegDissolveFrand);

  // ---- E1: H-SEEK — frame seek của H6 có bằng frame theo chỉ số? ----
  const seekA = frameBySeek(fileA, 1.5, "seekA");
  const idxA45 = frameByIndex(fileA, 45, "idxA45");
  const seekB = frameBySeek(fileB, 0.5, "seekB");
  const idxB15 = frameByIndex(fileB, 15, "idxB15");
  console.log(`E1 H-SEEK clip1: seek(1.5) vs index45: ${fmt(compareFrames(seekA, idxA45))}`);
  console.log(`E1 H-SEEK clip2: seek(0.5) vs index15: ${fmt(compareFrames(seekB, idxB15))}`);

  // ---- E2: tái tạo số H6 (baseline) ----
  const visDiss = tp.describeTransition("dissolve", 0.5, W, H);
  const visCirc = tp.describeTransition("circleopen", 0.5, W, H);
  const prevDiss = previewFrame(visDiss, seekA, seekB);
  const prevCirc = previewFrame(visCirc, seekA, seekB);
  const rendDissOrig = renderXfade("dissolve", fileA, fileB, 45, "orig", "orig-diss");
  const rendCircOrig = renderXfade("circleopen", fileA, fileB, 45, "orig", "orig-circ");
  console.log(`E2 baseline H6 dissolve (seek-preview vs orig-render n=45): ${fmt(compareFrames(rendDissOrig, prevDiss))} (H6: 1,2424 / 97,48%)`);
  console.log(`E2 baseline H6 circleopen (seek-preview vs orig-render n=45): ${fmt(compareFrames(rendCircOrig, prevCirc))} (H6: 1,5943 / 96,47%)`);
  // Cùng baseline nhưng preview từ frame theo chỉ số (loại H-SEEK khỏi số còn lại).
  const prevDissIdx = previewFrame(visDiss, idxA45, idxB15);
  const prevCircIdx = previewFrame(visCirc, idxA45, idxB15);
  console.log(`E2 baseline bằng frame-chỉ-số dissolve: ${fmt(compareFrames(rendDissOrig, prevDissIdx))}`);
  console.log(`E2 baseline bằng frame-chỉ-số circleopen: ${fmt(compareFrames(rendCircOrig, prevCircIdx))}`);

  // ---- E3: H-ALIGN — quét lệch frame da, db ∈ [-3, +3] (dissolve: quét đủ 7×7) ----
  const aFrames = {}, bFrames = {};
  for (let d = -3; d <= 3; d++) {
    aFrames[d] = d === 0 ? idxA45 : frameByIndex(fileA, 45 + d, `idxA${45 + d}`);
    bFrames[d] = d === 0 ? idxB15 : frameByIndex(fileB, 15 + d, `idxB${15 + d}`);
  }
  console.log("E3 H-ALIGN dissolve: MAD theo (da, db), hàng=da, cột=db [-3..+3] (in đậm số nhỏ nhất trong log phân tích)");
  let best = { mad: Infinity, da: 0, db: 0 };
  const table = [];
  for (let da = -3; da <= 3; da++) {
    const row = [];
    for (let db = -3; db <= 3; db++) {
      const m = compareFrames(rendDissOrig, previewFrame(visDiss, aFrames[da], bFrames[db]));
      row.push(m.mad);
      if (m.mad < best.mad) best = { mad: m.mad, da, db, le8: m.le8 };
    }
    table.push(row);
    console.log(`  da=${da >= 0 ? "+" : ""}${da}: ${row.map((v) => v.toFixed(4)).join(" ")}`);
  }
  console.log(`E3 H-ALIGN dissolve tốt nhất: da=${best.da}, db=${best.db} MAD=${best.mad.toFixed(4)} <=8: ${(best.le8 * 100).toFixed(2)}% (so với da=db=0: ${table[3][3].toFixed(4)})`);
  // Circleopen: quét trục + đường chéo (đủ để bắt lệch 1 frame, rẻ hơn 7×7).
  console.log("E3 H-ALIGN circleopen: quét trục và đường chéo");
  let bestC = { mad: Infinity, da: 0, db: 0 };
  for (const [da, db] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2], [2, 2], [-2, -2]]) {
    const m = compareFrames(rendCircOrig, previewFrame(visCirc, aFrames[da] || idxA45, bFrames[db] || idxB15));
    console.log(`  da=${da >= 0 ? "+" : ""}${da} db=${db >= 0 ? "+" : ""}${db}: ${fmt(m)}`);
    if (m.mad < bestC.mad) bestC = { mad: m.mad, da, db, le8: m.le8 };
  }
  console.log(`E3 H-ALIGN circleopen tốt nhất trong quét: da=${bestC.da}, db=${bestC.db} MAD=${bestC.mad.toFixed(4)}`);

  // ---- E4: H-OUT — frame render n≠45, hoặc p≠0.5, có khớp preview p=0.5 không? ----
  console.log("E4 H-OUT dissolve: render frame n=42..48 so với preview p=0.5 (frame-chỉ-số)");
  for (let n = 42; n <= 48; n++) {
    const r = n === 45 ? rendDissOrig : renderXfade("dissolve", fileA, fileB, n, "orig", `out-diss-${n}`);
    console.log(`  render n=${n}: ${fmt(compareFrames(r, prevDissIdx))}`);
  }
  console.log("E4 H-OUT dissolve: render n=45 so với preview p quét (p thật có lệch khỏi 0.5?)");
  for (const p of [0.40, 0.4333, 0.4667, 0.5, 0.5333, 0.5667, 0.60]) {
    const v = tp.describeTransition("dissolve", p, W, H);
    console.log(`  preview p=${p}: ${fmt(compareFrames(rendDissOrig, previewFrame(v, idxA45, idxB15)))}`);
  }
  console.log("E4 H-OUT circleopen: render n=45 so với preview p quét");
  for (const p of [0.40, 0.4333, 0.4667, 0.5, 0.5333, 0.5667, 0.60]) {
    const v = tp.describeTransition("circleopen", p, W, H);
    console.log(`  preview p=${p}: ${fmt(compareFrames(rendCircOrig, previewFrame(v, idxA45, idxB15)))}`);
  }

  // ---- E5: khung neo — xfade đi qua không blend có khớp frame gốc không? ----
  // Trước transition (n=10 → A frame 10) và sau transition (n=70 → B frame 40).
  const rendPre = renderXfade("dissolve", fileA, fileB, 10, "orig", "anchor-pre");
  const frameA10 = frameByIndex(fileA, 10, "idxA10");
  console.log(`E5 neo trước transition: render n=10 vs A frame 10: ${fmt(compareFrames(rendPre, frameA10))}`);
  const rendPost = renderXfade("dissolve", fileA, fileB, 70, "orig", "anchor-post");
  const frameB40 = frameByIndex(fileB, 40, "idxB40");
  console.log(`E5 neo sau transition: render n=70 vs B frame 40: ${fmt(compareFrames(rendPost, frameB40))}`);

  // ---- E6: H-CSPACE — ép format TRƯỚC xfade (thí nghiệm quyết định) ----
  for (const variant of ["rgb", "yuv444", "norm"]) {
    const rd = renderXfade("dissolve", fileA, fileB, 45, variant, `var-${variant}-diss`);
    const rc = renderXfade("circleopen", fileA, fileB, 45, variant, `var-${variant}-circ`);
    console.log(`E6 H-CSPACE variant ${variant}: dissolve ${fmt(compareFrames(rd, prevDissIdx))} | circleopen ${fmt(compareFrames(rc, prevCircIdx))}`);
  }

  // ---- E7: dấu vết subsample — sai số tập trung ở biên màu hay dàn đều? ----
  // Biên màu: pixel mà A hoặc B khác pixel kề phải > 16 ở kênh bất kỳ.
  {
    const isEdge = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      let edge = false;
      if (x + 1 < W) for (let c = 0; c < 3; c++) {
        if (Math.abs(idxA45[i + c] - idxA45[i + 3 + c]) > 16 || Math.abs(idxB15[i + c] - idxB15[i + 3 + c]) > 16) edge = true;
      }
      if (y + 1 < H) for (let c = 0; c < 3; c++) {
        const j = ((y + 1) * W + x) * 3;
        if (Math.abs(idxA45[i + c] - idxA45[j + c]) > 16 || Math.abs(idxB15[i + c] - idxB15[j + c]) > 16) edge = true;
      }
      isEdge[y * W + x] = edge ? 1 : 0;
    }
    const madSplit = (rendered, preview) => {
      let se = 0, ne = 0, sf = 0, nf = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3;
        for (let c = 0; c < 3; c++) {
          const d = Math.abs(rendered[i + c] - preview[i + c]);
          if (isEdge[y * W + x]) { se += d; ne++; } else { sf += d; nf++; }
        }
      }
      return { edge: se / ne, flat: sf / nf, edgeFrac: ne / (ne + nf) };
    };
    const dd = madSplit(rendDissOrig, prevDissIdx);
    const dc = madSplit(rendCircOrig, prevCircIdx);
    console.log(`E7 dissolve orig-render vs preview: MAD biên màu=${dd.edge.toFixed(4)} (tỉ lệ pixel biên ${(dd.edgeFrac * 100).toFixed(1)}%), MAD vùng phẳng=${dd.flat.toFixed(4)}`);
    console.log(`E7 circleopen orig-render vs preview: MAD biên màu=${dc.edge.toFixed(4)}, MAD vùng phẳng=${dc.flat.toFixed(4)}`);
    console.log("E7 đọc: nếu MAD phẳng ≈ 0 còn MAD biên vọt → sai số là hiệu ứng biên (subsample/chuyển miền), không phải lệch frame toàn cục (lệch frame sẽ làm cả vùng phẳng của pattern chuyển động cũng lệch).");
  }

  console.log(`tmp: ${TMP} (sẽ xoá sau khi in xong)`);
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log("== V17 đo xong, exit 0 ==");
}

main();
