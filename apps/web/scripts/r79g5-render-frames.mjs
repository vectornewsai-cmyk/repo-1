#!/usr/bin/env node
/**
 * r79g5-render-frames.mjs — Phase 9 đợt 79, luồng G5: sinh frame render
 * full-res (fullrgb-*.raw) cho 6 nội dung MỚI để sweep kernel BC(0,25, 0,375)
 * vs tam giác (nợ đợt 78 §4.5 / LIMITS F6 §7.2, §7.8).
 *
 * Nội dung (media round79-g5/media/, sinh bởi r79g5-make-media.py):
 *   textsmall / gradient / photo / noise / lineart — 1280×720, 30 fps;
 *   videoframe — ocean06.ogv transcode h264 1920×1080, 25 fps;
 *   textsmall640 / gradient640 / photo640 / noise640 / lineart640 — sinh
 *     NATIVE 640×360 (không downscale từ 1280) để thang upscale 1,264 /
 *     2,264 sạch (tránh nhiễm downscale của F6 §4).
 *
 * Chuỗi preencode = đúng chuỗi R65 (parity-65s7-compare.mjs
 * renderPreEncode, tái dùng verbatim từ r78f6-render-frames.mjs):
 * trim 0–4, setpts, scale W:H:force_original_aspect_ratio=decrease,
 * pad W:H, setsar=1, fps=30, format=yuv420p + effect.
 * EFFECT (đúng effects.js): sharp05 unsharp=5:5:1.1:5:5:0, sharp10
 * unsharp=5:5:2:5:5:0, noise05 noise=alls=28:allf=t, noise10
 * noise=alls=50:allf=t. Frame đo = 30 (playhead 1,0 s, như T3/E9/F6).
 * fullrgb: yuv → select eq(n,30), scale W:H bt709, format rgb24 (T3).
 *   MA TRẬN MÀU (sửa G5 sau khi đo lần 1): nội dung 640×360 dùng
 *   bt601, nội dung 1280×720 dùng bt709 — vì mp4 không ghi metadata màu,
 *   cả x264 (lúc encode từ RGB) lẫn Chrome (lúc decode) đều mặc định
 *   theo độ phân giải: SD (640×360) → bt601, HD (1280×720) → bt709.
 *   Bản đầu dùng bt709 cho cả 640 nên render frame lệch màu hệ thống
 *   (gradient640: preview 173,1/114,8/60,6 ≈ decode bt601 172,2/113,6/59,0,
 *   trong khi fullrgb bt709 cho 176,1/116,1/55,9; plain MAD 4,815
 *   le8 34,8%); bản bt601 cho 172,2/113,6/59,0, khớp preview trong ~1.
 *
 * Ra: hidden_files/round79-g5/render/<content>/{preencode-<v>.yuv,
 * fullrgb-<v>.raw}. Chỉ chạy ffmpeg, không sửa code production.
 * Chạy (từ gốc repo): node apps/web/scripts/r79g5-render-frames.mjs
 * KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5MEDIA = path.join(GOAL, "round79-g5", "media");
const OUT = path.join(GOAL, "round79-g5", "render");
const FRAME = 30;

const EFFECT = {
  plain: "",
  sharp05: ",unsharp=5:5:1.1:5:5:0",
  sharp10: ",unsharp=5:5:2:5:5:0",
  noise05: ",noise=alls=28:allf=t",
  noise10: ",noise=alls=50:allf=t",
};
const VARIANTS = ["plain", "sharp05", "sharp10", "noise05", "noise10"];

// content, media, W, H (project W/H = kích thước render frame).
const CONTENTS = [
  { name: "textsmall", media: path.join(G5MEDIA, "textsmall-1280.mp4"), W: 1280, H: 720 },
  { name: "gradient", media: path.join(G5MEDIA, "gradient-1280.mp4"), W: 1280, H: 720 },
  { name: "photo", media: path.join(G5MEDIA, "photo-1280.mp4"), W: 1280, H: 720 },
  { name: "noise", media: path.join(G5MEDIA, "noise-1280.mp4"), W: 1280, H: 720 },
  { name: "lineart", media: path.join(G5MEDIA, "lineart-1280.mp4"), W: 1280, H: 720 },
  { name: "videoframe", media: path.join(G5MEDIA, "videoframe.mp4"), W: 1280, H: 720 },
  { name: "textsmall640", media: path.join(G5MEDIA, "textsmall-640.mp4"), W: 640, H: 360 },
  { name: "gradient640", media: path.join(G5MEDIA, "gradient-640.mp4"), W: 640, H: 360 },
  { name: "photo640", media: path.join(G5MEDIA, "photo-640.mp4"), W: 640, H: 360 },
  { name: "noise640", media: path.join(G5MEDIA, "noise-640.mp4"), W: 640, H: 360 },
  { name: "lineart640", media: path.join(G5MEDIA, "lineart-640.mp4"), W: 640, H: 360 },
];

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${label} thất bại (exit ${r.status}): ${(r.stderr || r.stdout || "").slice(0, 600)}`);
  return r;
}

function preencode(c, v) {
  const dir = path.join(OUT, c.name);
  const out = path.join(dir, `preencode-${v}.yuv`);
  if (fs.existsSync(out)) return out;
  const chain =
    `[0:v]trim=start=0:end=4,setpts=PTS-STARTPTS,` +
    `scale=${c.W}:${c.H}:force_original_aspect_ratio=decrease,` +
    `pad=${c.W}:${c.H}:(ow-iw)/2:(oh-ih)/2:color=black,` +
    `setsar=1,fps=30,format=yuv420p${EFFECT[v]}[vout]`;
  run("ffmpeg", ["-v", "error", "-y", "-i", c.media, "-filter_complex", chain,
    "-map", "[vout]", "-f", "rawvideo", "-pix_fmt", "yuv420p", out], `pre-encode ${c.name}/${v}`);
  console.log(`  ${c.name}/${v}: preencode mới (${fs.statSync(out).size} byte)`);
  return out;
}

function fullRgb(c, v) {
  const dir = path.join(OUT, c.name);
  const yuv = preencode(c, v);
  const out = path.join(dir, `fullrgb-${v}.raw`);
  if (fs.existsSync(out)) {
    const buf = fs.readFileSync(out);
    if (buf.length !== c.W * c.H * 3) throw new Error(`${out} sai kích thước ${buf.length}`);
    return out;
  }
  const matrix = c.W <= 640 ? "bt601" : "bt709";
  run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${c.W}x${c.H}`, "-r", "30", "-i", yuv,
    "-vf", `select='eq(n,${FRAME})',scale=${c.W}:${c.H}:in_color_matrix=${matrix}:out_color_matrix=${matrix},format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], `full-rgb ${c.name}/${v} (${matrix})`);
  const buf = fs.readFileSync(out);
  if (buf.length !== c.W * c.H * 3) throw new Error(`${out} sai kích thước ${buf.length}`);
  console.log(`  ${c.name}/${v}: fullrgb frame ${FRAME} (${buf.length} byte)`);
  return out;
}

function main() {
  for (const c of CONTENTS) {
    if (!fs.existsSync(c.media)) throw new Error(`không thấy media ${c.media}`);
    fs.mkdirSync(path.join(OUT, c.name), { recursive: true });
    console.log(`== ${c.name} (${c.W}x${c.H}, media ${path.basename(c.media)}) ==`);
    for (const v of VARIANTS) fullRgb(c, v);
  }
  console.log(`\nXONG — render frames tại ${OUT}`);
}
main();
