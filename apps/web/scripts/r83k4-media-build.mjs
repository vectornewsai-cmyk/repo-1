#!/usr/bin/env node
/**
 * r83k4-media-build.mjs — Phase 9 đợt 83, luồng K4: THÍ NGHIỆM CODEC
 * VP9-vs-h264 (nợ đợt 82 §4.4 / J4 §3.5+§5: thí nghiệm quyết định bị
 * sóng EPERM cắt, chưa chạy).
 *
 * CÂU HỎI: codec decode (VP9 vs h264) có làm lệch các verdict đang săn
 * (G2/G12, Q4 resid, độ sắc) hay không — tức sự khác biệt đo được có
 * phải artifact của codec thay vì của pipeline xử lý.
 *
 * THIẾT KẾ CÓ KIỂM SOÁT — cùng nguồn, chỉ đổi codec (3 nhánh slov +
 * 2 nhánh tp, tất cả 1920×1080, 4 s, khung đo ở t=1,0 s):
 *   slov-vp9-orig  : slovenska.webm gốc (VP9, untagged, 5,51 Mbps), f25
 *   slov-h264-1920: transcode Y HỆT lệnh J4 (libx264 crf 18 bt709), f25
 *   slov-vp9-1920 : libvpx-vp9 2-pass, target bitrate = bitrate đo được
 *                    của slov-h264-1920, tag bt709, f25 — NHÁNH KIỂM
 *                    SOÁT: cùng codec VP9 nhưng cùng bitrate + tag màu
 *                    với nhánh h264 → tách "codec" khỏi "re-encode /
 *                    bitrate / tag màu".
 *   tp-h264-1920  : test-pattern 1280 upscale bicubic → 1920, x264
 *                    crf 18 bt709, f30
 *   tp-vp9-1920   : cùng upscale, libvpx-vp9 2-pass target = bitrate
 *                    đo được của tp-h264-1920, tag bt709, f30
 *
 * RENDER THAM CHIẾU (theo đúng method Z2/C3 của J4/F7): decode khung N
 * bằng ffmpeg (mp4: scale in/out bt709; webm: scale trơn — đúng quy
 * ước F7/J4 để so được với baseline 2,947), resample trilinear
 * 1920→1280 = plain; noise05/10 = method F (yuv420p + noise alls 28/50).
 *
 * KIỂM CHỨNG TRONG SCRIPT:
 *   0. Chuỗi Z2: decode tp-1280 f30 vs fullrgb-plain.raw MAD ≈ 0.
 *   1. Decode chéo native (ffmpeg, rgb24, cùng khung): MAD cặp slov
 *      (orig/h264/vp9-reenc) và cặp tp (h264/vp9) + gradient detail
 *      (frac|Δ|>8, mean|Δ| H/V) từng khung — đo codec lệch bao nhiêu
 *      TRƯỚC khi qua preview/render.
 *   2. Motion: slov f25 vs f40 MAD >> 0; tp f30 vs f45 MAD ≈ 0 (still).
 *   3. Bảng bitrate/size/ffprobe từng media (ghi vào JSON).
 *
 * File ra (KHÔNG stage — binary; script này là cách tái lập):
 *   hidden_files/round83-k4/media/{5 nguồn}.{mp4,webm}
 *   hidden_files/round83-k4/render/{name}-{plain,noise05,noise10}.raw
 *   hidden_files/round83-k4/r83k4-media-build.json (mọi số đo)
 * Chạy (từ gốc repo): node apps/web/scripts/r83k4-media-build.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const U3 = path.join(GOAL, "round67-u3");
const R65 = path.join(GOAL, "round65-s7");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const K4 = path.join(GOAL, "round83-k4");
const MEDIA = path.join(K4, "media");
const RENDER = path.join(K4, "render");
fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(RENDER, { recursive: true });

const SLOV_WEBM = path.join(U3, "media", "slovenska.webm");
const TP_MP4 = path.join(R65, "media", "test-pattern.mp4");

const FFMPEG_VERSION = (() => {
  try { return execFileSync("ffmpeg", ["-version"], { encoding: "utf8" }).split("\n")[0]; }
  catch { return "ffmpeg: không đọc được version"; }
})();

function ff(args, timeoutMs = 600000) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs });
}
function ffprobeJson(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,r_frame_rate,color_space,color_primaries,color_transfer",
    "-show_entries", "format=duration,size,bit_rate", "-of", "json", file], { encoding: "utf8" });
  return JSON.parse(out);
}
function madBetween(a, b) {
  let s = 0, max = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); s += d; if (d > max) max = d; }
  return { mad: +(s / a.length).toFixed(4), max };
}
function frameStats(buf) {
  const n = buf.length / 3;
  const out = { std: [], kurt: [], mean: [] };
  for (let c = 0; c < 3; c++) {
    let mean = 0; for (let i = c; i < buf.length; i += 3) mean += buf[i]; mean /= n;
    let s2 = 0, s4 = 0;
    for (let i = c; i < buf.length; i += 3) { const v = buf[i] - mean; s2 += v * v; s4 += v * v * v * v; }
    const sd = Math.sqrt(s2 / n);
    out.std.push(+sd.toFixed(2));
    out.kurt.push(+(s4 / n / (sd ** 4) - 3).toFixed(2));
    out.mean.push(+mean.toFixed(2));
  }
  return out;
}
// Độ sắc / chi tiết tần số cao trên khung RGB native (như J4 §3.3).
function gradientStats(buf, w, h) {
  const out = { fracGt8H: [], fracGt8V: [], meanAbsH: [], meanAbsV: [] };
  for (let c = 0; c < 3; c++) {
    let gtH = 0, nH = 0, sH = 0, gtV = 0, nV = 0, sV = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3 + c;
      if (x + 1 < w) { const d = Math.abs(buf[i + 3] - buf[i]); sH += d; nH++; if (d > 8) gtH++; }
      if (y + 1 < h) { const d = Math.abs(buf[i + w * 3] - buf[i]); sV += d; nV++; if (d > 8) gtV++; }
    }
    out.fracGt8H.push(+(gtH / nH).toFixed(4));
    out.fracGt8V.push(+(gtV / nV).toFixed(4));
    out.meanAbsH.push(+(sH / nH).toFixed(3));
    out.meanAbsV.push(+(sV / nV).toFixed(3));
  }
  return out;
}
function decodeFrameNative(file, n, outPath, isWebm) {
  const vf = isWebm
    ? `select=eq(n\\,${n}),scale=1920:1080`
    : `select=eq(n\\,${n}),scale=1920:1080:in_color_matrix=bt709:out_color_matrix=bt709`;
  ff(["-i", file, "-vf", vf, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
  return fs.readFileSync(outPath);
}
function vp9TwoPass(input, outFile, bitrateKbps, gop, extraIn = []) {
  const passlog = path.join("/tmp", "round83-k4", `vp9-${path.basename(outFile, ".webm")}`);
  fs.mkdirSync("/tmp/round83-k4", { recursive: true });
  const common = ["-i", input, ...extraIn, "-t", "4", "-an", "-c:v", "libvpx-vp9",
    "-b:v", `${bitrateKbps}k`, "-deadline", "good", "-cpu-used", "2", "-row-mt", "1",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-g", String(gop)];
  ff([...common, "-pass", "1", "-passlogfile", passlog, "-f", "null", "/dev/null"]);
  ff([...common, "-pass", "2", "-passlogfile", passlog, outFile]);
}
function buildRenderRef(name, frameBuf) {
  const plain1280 = resampleRgb24Trilinear(frameBuf, 1920, 1080, 1280, 720);
  const plainPath = path.join(RENDER, `${name}-plain.raw`);
  writeFileEpermRetry(plainPath, plain1280);
  const yuvPath = path.join(RENDER, `${name}.yuv`);
  ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "rgb24", "-i", plainPath,
    "-vf", "scale=1280:720", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvPath]);
  for (const [lv, alls] of [["noise05", 28], ["noise10", 50]]) {
    const outPath = path.join(RENDER, `${name}-${lv}.raw`);
    ff(["-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "yuv420p", "-i", yuvPath,
      "-vf", `noise=alls=${alls}:allf=t,scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", outPath]);
  }
  return { plainStats: frameStats(plain1280) };
}

const report = { generated: new Date().toISOString(), ffmpeg: FFMPEG_VERSION, arms: {}, checks: {}, detail: {}, crossCodecMad: {} };

async function main() {
  // ---- 0. Kiểm chứng chuỗi Z2 bằng test-pattern 1280 ----
  console.log("== 0. Kiểm chứng chuỗi build bằng test-pattern 1280 ==");
  const tpCheck = path.join(RENDER, "check-tp-plain-1280.raw");
  ff(["-i", TP_MP4, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", tpCheck]);
  const tpMad = madBetween(fs.readFileSync(tpCheck), fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw")));
  console.log(`  decode test-pattern.mp4 f30 vs fullrgb-plain.raw: MAD=${tpMad.mad} max=${tpMad.max} (kỳ vọng ~0)`);
  report.checks.z2TpMad = tpMad;
  if (tpMad.mad > 0.05) { console.log("DỪNG: chuỗi plain không khớp"); process.exitCode = 2; return; }

  // ---- 1. slov → h264 1920 (lệnh Y HỆT J4 §5) ----
  console.log("== 1. slov → h264-1920 (lệnh J4) ==");
  const slovH264 = path.join(MEDIA, "slov-h264-1920.mp4");
  ff(["-i", SLOV_WEBM, "-t", "4", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-crf", "18", "-g", "25", slovH264]);
  const slovH264Probe = ffprobeJson(slovH264);
  const slovH264Kbps = Math.round(Number(slovH264Probe.format.bit_rate) / 1000);
  console.log(`  ${slovH264}: ${fs.statSync(slovH264).size} byte, bitrate ${slovH264Probe.format.bit_rate} bps → target VP9 ${slovH264Kbps}k`);
  report.arms["slov-h264-1920"] = { file: "slov-h264-1920.mp4", codec: "h264", probe: slovH264Probe };

  // ---- 2. slov → VP9 1920 re-encode, target bitrate = h264 ----
  console.log("== 2. slov → VP9-1920 re-encode (2-pass, target = h264 bitrate) ==");
  const slovVp9 = path.join(MEDIA, "slov-vp9-1920.webm");
  vp9TwoPass(SLOV_WEBM, slovVp9, slovH264Kbps, 25);
  const slovVp9Probe = ffprobeJson(slovVp9);
  console.log(`  ${slovVp9}: ${fs.statSync(slovVp9).size} byte, bitrate ${slovVp9Probe.format.bit_rate} bps (target ${slovH264Kbps}k)`);
  report.arms["slov-vp9-1920"] = { file: "slov-vp9-1920.webm", codec: "vp9-reencode", targetKbps: slovH264Kbps, probe: slovVp9Probe };
  report.arms["slov-vp9-orig"] = { file: path.relative(K4, SLOV_WEBM), codec: "vp9-orig", probe: ffprobeJson(SLOV_WEBM), note: "file gốc round67-u3, KHÔNG copy vào media/ (chỉ tham chiếu)" };

  // ---- 3. tp 1280 → 1920 h264 + VP9 (cùng upscale) ----
  console.log("== 3. tp → 1920 h264 + VP9 (cùng upscale bicubic) ==");
  const tpH264 = path.join(MEDIA, "tp-h264-1920.mp4");
  ff(["-i", TP_MP4, "-vf", "scale=1920:1080:flags=bicubic", "-t", "4", "-an", "-c:v", "libx264",
    "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-crf", "18", "-g", "30", tpH264]);
  const tpH264Probe = ffprobeJson(tpH264);
  const tpH264Kbps = Math.round(Number(tpH264Probe.format.bit_rate) / 1000);
  console.log(`  ${tpH264}: ${fs.statSync(tpH264).size} byte, bitrate ${tpH264Probe.format.bit_rate} bps → target VP9 ${tpH264Kbps}k`);
  report.arms["tp-h264-1920"] = { file: "tp-h264-1920.mp4", codec: "h264", probe: tpH264Probe };
  const tpVp9 = path.join(MEDIA, "tp-vp9-1920.webm");
  vp9TwoPass(TP_MP4, tpVp9, tpH264Kbps, 30, ["-vf", "scale=1920:1080:flags=bicubic"]);
  const tpVp9Probe = ffprobeJson(tpVp9);
  console.log(`  ${tpVp9}: ${fs.statSync(tpVp9).size} byte, bitrate ${tpVp9Probe.format.bit_rate} bps (target ${tpH264Kbps}k)`);
  report.arms["tp-vp9-1920"] = { file: "tp-vp9-1920.webm", codec: "vp9-reencode", targetKbps: tpH264Kbps, probe: tpVp9Probe };

  // ---- 4. Decode khung đo + render tham chiếu C3 + detail/sharpness ----
  console.log("== 4. Decode khung đo + render C3 + detail ==");
  const frames = {};
  const specs = [
    ["slov-vp9-orig", SLOV_WEBM, 25, true],
    ["slov-h264-1920", slovH264, 25, false],
    ["slov-vp9-1920", slovVp9, 25, true],
    ["tp-h264-1920", tpH264, 30, false],
    ["tp-vp9-1920", tpVp9, 30, true],
  ];
  for (const [name, file, frameNo, isWebm] of specs) {
    const raw = decodeFrameNative(file, frameNo, path.join(RENDER, `${name}-decoded${frameNo}-1920.raw`), isWebm);
    frames[name] = raw;
    const ref = buildRenderRef(name, raw);
    report.detail[name] = { frame: frameNo, stats: frameStats(raw), gradient: gradientStats(raw, 1920, 1080), renderPlainStats: ref.plainStats };
    console.log(`  ${name} f${frameNo}: stats=${JSON.stringify(frameStats(raw))}`);
    console.log(`    gradient fracGt8H=${JSON.stringify(report.detail[name].gradient.fracGt8H)} meanAbsH=${JSON.stringify(report.detail[name].gradient.meanAbsH)}`);
  }

  // ---- 5. Decode chéo native (ffmpeg): codec lệch bao nhiêu trước preview ----
  console.log("== 5. Decode chéo native (ffmpeg rgb24, cùng khung) ==");
  const pairs = [
    ["slov-vp9-orig", "slov-h264-1920"],
    ["slov-vp9-orig", "slov-vp9-1920"],
    ["slov-vp9-1920", "slov-h264-1920"],
    ["tp-h264-1920", "tp-vp9-1920"],
  ];
  for (const [a, b] of pairs) {
    const m = madBetween(frames[a], frames[b]);
    report.crossCodecMad[`${a} vs ${b}`] = m;
    console.log(`  ${a} vs ${b}: MAD=${m.mad} max=${m.max}`);
  }

  // ---- 6. Motion check ----
  console.log("== 6. Motion check ==");
  const slovF40 = decodeFrameNative(slovH264, 40, path.join(RENDER, "slov-h264-1920-decoded40-1920.raw"), false);
  const motionSlov = madBetween(frames["slov-h264-1920"], slovF40);
  const tpF45 = decodeFrameNative(tpH264, 45, path.join(RENDER, "tp-h264-1920-decoded45-1920.raw"), false);
  const motionTp = madBetween(frames["tp-h264-1920"], tpF45);
  report.checks.motionSlovH264_f25vsf40 = motionSlov;
  report.checks.motionTpH264_f30vsf45 = motionTp;
  console.log(`  slov-h264 f25 vs f40: MAD=${motionSlov.mad} (kỳ vọng >> 0, video chuyển động)`);
  console.log(`  tp-h264 f30 vs f45: MAD=${motionTp.mad} (kỳ vọng ~0, still-loop)`);

  writeFileEpermRetry(path.join(K4, "r83k4-media-build.json"), JSON.stringify(report, null, 2));
  console.log("\nDONE — 5 media + render C3 + số đo decode chéo (binary KHÔNG stage; script này tái lập được).");
  console.log(`JSON: ${path.join(K4, "r83k4-media-build.json")}`);
}
main().catch((e) => { console.error(`K4-MEDIA-BUILD LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
