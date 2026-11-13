#!/usr/bin/env node
/**
 * r82j7-render-frames.mjs — Phase 9 đợt 82, luồng J7: sinh frame render
 * full-res cho lineart 3px/4px (media round82-j7/media/, sinh bởi
 * r82j7-make-media.py).
 *
 * Chuỗi preencode = đúng chuỗi R65 (như r79g5-render-frames.mjs):
 * trim 0–4, setpts, scale W:H:force_original_aspect_ratio=decrease,
 * pad W:H, setsar=1, fps=30, format=yuv420p + effect.
 * EFFECT (đúng effects.js): sharp05 unsharp=5:5:1.1:5:5:0, sharp10
 * unsharp=5:5:2:5:5:0, noise05 noise=alls=28:allf=t, noise10
 * noise=alls=50:allf=t.
 * Frame đo: 30 (playhead 1,0 s, như T3/E9/F6/G5) VÀ 60 (playhead 2,0 s —
 * đa-frame, chống PASS giả do 1 mẫu; xem LIMITS G5 §9.5). Nội dung sqw/
 * lineart2px là tĩnh nên frame 60 = frame 30 về nội dung, nhưng render
 * chain chạy lại độc lập (noise temporal khác nhau giữa 2 frame).
 * fullrgb: yuv → select eq(n,F), scale W:H bt709/bt601, format rgb24.
 *   MA TRẬN MÀU (như G5 §7b): 640×360 dùng bt601, 1280×720 dùng bt709.
 * Ra: hidden_files/round80-h3/render/<content>/{preencode-<v>.yuv,
 * fullrgb-<v>.raw (frame 30), fullrgb-<v>-f60.raw (frame 60)}.
 * Chỉ chạy ffmpeg, không sửa code production. KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const H3MEDIA = path.join(GOAL, "round82-j7", "media");
const OUT = path.join(GOAL, "round82-j7", "render");
const FRAMES = [30, 60];

const EFFECT = {
  plain: "",
  sharp05: ",unsharp=5:5:1.1:5:5:0",
  sharp10: ",unsharp=5:5:2:5:5:0",
  noise05: ",noise=alls=28:allf=t",
  noise10: ",noise=alls=50:allf=t",
};
const VARIANTS = ["plain", "sharp05", "sharp10"];

const CONTENTS = [
  { name: "lineart3px-640", media: path.join(H3MEDIA, "lineart3px-640.mp4"), W: 640, H: 360 },
  { name: "lineart4px-640", media: path.join(H3MEDIA, "lineart4px-640.mp4"), W: 640, H: 360 },
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

function fullRgb(c, v, frame) {
  const dir = path.join(OUT, c.name);
  const yuv = preencode(c, v);
  const suffix = frame === 30 ? "" : `-f${frame}`;
  const out = path.join(dir, `fullrgb-${v}${suffix}.raw`);
  if (fs.existsSync(out)) {
    const buf = fs.readFileSync(out);
    if (buf.length !== c.W * c.H * 3) throw new Error(`${out} sai kích thước ${buf.length}`);
    return out;
  }
  const matrix = c.W <= 640 ? "bt601" : "bt709";
  run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", `${c.W}x${c.H}`, "-r", "30", "-i", yuv,
    "-vf", `select='eq(n,${frame})',scale=${c.W}:${c.H}:in_color_matrix=${matrix}:out_color_matrix=${matrix},format=rgb24`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", out], `full-rgb ${c.name}/${v} f${frame} (${matrix})`);
  const buf = fs.readFileSync(out);
  if (buf.length !== c.W * c.H * 3) throw new Error(`${out} sai kích thước ${buf.length}`);
  console.log(`  ${c.name}/${v}: fullrgb frame ${frame} (${buf.length} byte)`);
  return out;
}

function main() {
  for (const c of CONTENTS) {
    if (!fs.existsSync(c.media)) throw new Error(`không thấy media ${c.media}`);
    fs.mkdirSync(path.join(OUT, c.name), { recursive: true });
    console.log(`== ${c.name} (${c.W}x${c.H}, media ${path.basename(c.media)}) ==`);
    for (const v of VARIANTS) for (const f of FRAMES) fullRgb(c, v, f);
  }
  console.log(`\nXONG — render frames tại ${OUT}`);
}
main();
