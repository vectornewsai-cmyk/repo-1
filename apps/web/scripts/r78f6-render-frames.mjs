#!/usr/bin/env node
/**
 * r78f6-render-frames.mjs — Phase 9 đợt 78, luồng F6: sinh frame render
 * full-res (fullrgb-*.raw) cho nội dung mới để kiểm chứng kernel upscale
 * BC(0,25, 0,375) của E9 trên nội dung khác/thang khác.
 *
 * Nội dung:
 *   ocean / basgo / slovenska — 1280×720, 30 fps (media round67-u3);
 *     preencode plain/sharp05/sharp10 TÁI DÙNG file U3 (cùng chuỗi R65,
 *     đã kiểm tra: trim 0–4, scale 1280:720, pad, setsar, fps 30,
 *     yuv420p + unsharp y hệt); chỉ sinh thêm preencode noise05/noise10.
 *   ocean640 — project 640×360 (nguồn ocean-720p): sinh đủ 5 preencode
 *     với chuỗi scale=640:360 + pad 640:360 (mirror render.js cho
 *     project 640×360), để đo upscale thang 1,264 (w1920) và 2,264 (w2560).
 *
 * Chuỗi preencode = đúng chuỗi R65 (parity-65s7-compare.mjs
 * renderPreEncode): trim 0–4, setpts, scale W:H:force_original_aspect_
 * ratio=decrease, pad W:H, setsar=1, fps=30, format=yuv420p + effect.
 * EFFECT (đúng effects.js): sharp05 unsharp=5:5:1.1:5:5:0, sharp10
 * unsharp=5:5:2:5:5:0, noise05 noise=alls=28:allf=t, noise10
 * noise=alls=50:allf=t. Frame đo = 30 (playhead 1,0 s, như T3/E9).
 * fullrgb: yuv → select eq(n,30), scale W:H bt709, format rgb24 (T3).
 *
 * Ra: hidden_files/round78-f6/render/<content>/{preencode-<v>.yuv,
 * fullrgb-<v>.raw}. Chỉ chạy ffmpeg, không sửa code production.
 * Chạy (từ gốc repo): node apps/web/scripts/r78f6-render-frames.mjs
 * KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const U3MEDIA = path.join(GOAL, "round67-u3", "media");
const U3RENDER = path.join(GOAL, "round67-u3", "render");
const OUT = path.join(GOAL, "round78-f6", "render");
const FRAME = 30;

const EFFECT = {
  plain: "",
  sharp05: ",unsharp=5:5:1.1:5:5:0",
  sharp10: ",unsharp=5:5:2:5:5:0",
  noise05: ",noise=alls=28:allf=t",
  noise10: ",noise=alls=50:allf=t",
};
const VARIANTS = ["plain", "sharp05", "sharp10", "noise05", "noise10"];

// content, media, W, H, preencode có sẵn ở U3 (tái dùng) hay sinh mới
const CONTENTS = [
  { name: "ocean", media: path.join(U3MEDIA, "ocean-720p.mp4"), W: 1280, H: 720, reuseU3: ["plain", "sharp05", "sharp10"] },
  { name: "basgo", media: path.join(U3MEDIA, "basgo-720p.mp4"), W: 1280, H: 720, reuseU3: ["plain", "sharp05", "sharp10"] },
  { name: "slovenska", media: path.join(U3MEDIA, "slovenska-720p.mp4"), W: 1280, H: 720, reuseU3: ["plain", "sharp05", "sharp10"] },
  { name: "ocean640", media: path.join(U3MEDIA, "ocean-720p.mp4"), W: 640, H: 360, reuseU3: [] },
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
  // Tái dùng preencode U3 khi có (chuỗi R65 y hệt) — copy thay vì render lại.
  if (c.reuseU3.includes(v)) {
    const src = path.join(U3RENDER, c.name, `preencode-${v}.yuv`);
    if (!fs.existsSync(src)) throw new Error(`thiếu preencode U3 để tái dùng: ${src}`);
    fs.copyFileSync(src, out);
    console.log(`  ${c.name}/${v}: tái dùng preencode U3 (${fs.statSync(out).size} byte)`);
    return out;
  }
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
  run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${c.W}x${c.H}`, "-r", "30", "-i", yuv,
    "-vf", `select='eq(n,${FRAME})',scale=${c.W}:${c.H}:in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], `full-rgb ${c.name}/${v}`);
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
