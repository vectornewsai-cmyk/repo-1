#!/usr/bin/env node
/**
 * r85m10-downscale-ab.mjs — Phase 9 đợt 85, luồng M10 (bổ sung):
 * A/B downscale s=0,632 với ĐÚNG model render (chromeResampleRgb24 =
 * trilinear LOD-bias -0,5, mọi thang — không phải Mitchell).
 * Câu hỏi: two-step có thắng ở downscale không? Quyết định gate của fix.
 * Chạy: node apps/web/scripts/r85m10-downscale-ab.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { chromeResampleRgb24 } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M10 = path.join(GOAL, "round85-m10");
const PROBE = JSON.parse(fs.readFileSync(path.join(M10, "r85m10-probe.json"), "utf8"));
const OUT = path.join(M10, "r85m10-downscale-ab.json");
const MEDIA = path.join(M10, "media");
const G5MEDIA = path.join(GOAL, "round79-g5", "media");
const H3MEDIA = path.join(GOAL, "round80-h3", "media");
const W = 640, H = 360;
const CLIP_FILE = {
  "step-640": path.join(MEDIA, "step-640.mp4"),
  "impulse-red-640": path.join(MEDIA, "impulse-red-640.mp4"),
  "impulse-v-640-f320": path.join(MEDIA, "impulse-v-640.mp4"),
  "impulse-h-640-f180": path.join(MEDIA, "impulse-h-640.mp4"),
  "lineart640": path.join(G5MEDIA, "lineart-640.mp4"),
  "lineart2px-640": path.join(H3MEDIA, "lineart2px-640.mp4"),
  "sqw4-640": path.join(H3MEDIA, "sqw4-640.mp4"),
};
const CLIP_T = { "step-640": 0, "impulse-red-640": 0, "impulse-v-640-f320": 320 / 30, "impulse-h-640-f180": 180 / 30, "lineart640": 1.0, "lineart2px-640": 1.0, "sqw4-640": 1.0 };
const b64buf = (s) => Buffer.from(s, "base64");
function madU8(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return +(s / a.length).toFixed(3); }
function decodeOneFrame(file, t) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
    const chunks = [];
    let err = "";
    ff.stdout.on("data", (d) => chunks.push(d));
    ff.stderr.on("data", (d) => { err += d; });
    ff.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg decode exit ${code}: ${err.slice(-300)}`));
      const buf = Buffer.concat(chunks);
      if (buf.length !== W * H * 3) return reject(new Error(`frame ngắn: ${buf.length}`));
      resolve(buf);
    });
  });
}
async function main() {
  const res = { generatedAt: new Date().toISOString(), model: "chromeResampleRgb24 (trilinear LOD-bias -0.5)", s0632: {}, s2000: {} };
  for (const name of Object.keys(PROBE.statics)) {
    const ff = await decodeOneFrame(CLIP_FILE[name], CLIP_T[name]);
    for (const [key, dw, dh, capD, capT] of [["s0632", 405, 228, "direct0632", "two0632"], ["s2000", 1280, 720, "direct2000", "two2000"]]) {
      const Bv = b64buf(PROBE.statics[name].caps[capD].rgbB64);
      const C2v = b64buf(PROBE.statics[name].caps[capT].rgbB64);
      const model = chromeResampleRgb24(ff, W, H, dw, dh);
      res[key][name] = { direct_vs_renderTrilinear: madU8(Bv, model), twoStep_vs_renderTrilinear: madU8(C2v, model) };
    }
    console.log(`  ${name}: s0632 direct ${res.s0632[name].direct_vs_renderTrilinear} vs two-step ${res.s0632[name].twoStep_vs_renderTrilinear} | s2000 direct ${res.s2000[name].direct_vs_renderTrilinear} vs two-step ${res.s2000[name].twoStep_vs_renderTrilinear}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify(res, null, 2));
  console.log(`ghi ${OUT}`);
}
main().catch((e) => { console.error("LỖI:", e); process.exit(2); });
