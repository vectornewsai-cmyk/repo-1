#!/usr/bin/env node
/**
 * r82j7-post-upscale-test.mjs — Phase 9 đợt 82, luồng J7: kiểm chứng E7a.
 *
 * Phát hiện từ r82j7-lineart-aliasing (E1/E3): trên lineart bilevel, delta
 * project-size ≈ 0 (sharpen bị kẹp ở 0/255 cả hai đầu), nhưng delta preview
 * Chrome lại lớn (dip −7,8 ở đường 1px, năng lượng gấp 5–7× mô hình).
 * Một pipeline tuyến tính không thể tạo delta lớn từ delta ≈ 0 — nên delta
 * phải sinh RA SAU khâu project-size, tức sharpen SAU upscale (hoặc trong
 * lúc upscale). I3 E6 đã loại giả thuyết này, NHƯNG E6 dùng tri(R_plain)
 * thay vì snapshot plain thật của Chrome — sai số plain (MAD ~2,6) bị
 * sharpen khuếch đại, có thể làm E6 đo sai.
 *
 * Test này dùng CHÍNH P_plain (snapshot plain của Chrome, kích thước
 * viewport): d_post = applySharpen(P_plain) − P_plain, so với dp_prev.
 * Nếu MAD(d_post, dp_prev) << MAD(tri(d_render), dp_prev) thì cơ chế là
 * sharpen-sau-upscale (I3 E6 kết luận sai do dùng tri(R_plain)).
 * Đối chứng sqw4-640: ở đó delta project-size lớn, E6 đã loại dứt khoát —
 * nếu E7a cũng thua ở sqw thì phương pháp này không phân biệt được gì.
 *
 * Chạy: node apps/web/scripts/r82j7-post-upscale-test.mjs
 * Env: R82J7_OUT (mặc định hidden_files/round82-j7/r82j7-post-upscale.json).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { applySharpen } = require("/tmp/r82j7-effectCanvas.cjs");

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");
const H3 = path.join(GOAL, "round80-h3");
const OUT = process.env.R82J7_OUT || path.join(GOAL, "round82-j7", "r82j7-post-upscale.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

function deltaOf(a, b) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}
function deltaMadFloat(dp, dr) {
  let sum = 0;
  for (let i = 0; i < dp.length; i++) sum += Math.abs(dp[i] - dr[i]);
  return +(sum / dp.length).toFixed(3);
}
function rgb24ToRgba(rgb, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2]; out[i * 4 + 3] = 255;
  }
  return out;
}
function rgbaToRgb24(rgba, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { out[i * 3] = rgba[i * 4]; out[i * 3 + 1] = rgba[i * 4 + 1]; out[i * 3 + 2] = rgba[i * 4 + 2]; }
  return out;
}
function xProfile(arr, w, h, x0, x1) {
  const prof = [];
  for (let x = x0; x < x1; x++) {
    let s = 0;
    for (let y = 0; y < h; y++) s += arr[(y * w + x) * 3];
    prof.push(+(s / h).toFixed(1));
  }
  return prof;
}

const DATASETS = [
  { key: "L1px-1280@1.132", thick: 1, snaps: path.join(G5, "headed-w2560x1440-p1280x720", "r79g5-snaps-w2560x1440-p1280x720.json"), content: "lineart", projW: 1280, lineX: 64 },
  { key: "L1px-640@1.264", thick: 1, snaps: path.join(G5, "headed-w1920x1080-p640x360", "r79g5-snaps-w1920x1080-p640x360.json"), content: "lineart640", projW: 640, lineX: 32 },
  { key: "L2px-1280@1.132", thick: 2, snaps: path.join(H3, "headed-w2560x1440-p1280x720-ph1", "r80h3-snaps-w2560x1440-p1280x720.json"), content: "lineart2px", projW: 1280, lineX: 64 },
  { key: "L2px-640@1.264", thick: 2, snaps: path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), content: "lineart2px-640", projW: 640, lineX: 32 },
  { key: "sqw4-640@1.264-control", thick: null, snaps: path.join(H3, "headed-w1920x1080-p640x360-ph1", "r80h3-snaps-w1920x1080-p640x360.json"), content: "sqw4-640", projW: 640, lineX: null },
];

const report = { generated: new Date().toISOString(), datasets: {} };
for (const ds of DATASETS) {
  const doc = JSON.parse(fs.readFileSync(ds.snaps, "utf8"));
  const snaps = doc.snaps[ds.content];
  const vw = snaps.plain.w, vh = snaps.plain.h;
  const scale = snaps.plain.rect.scale;
  console.log(`\n######## ${ds.key}: ${vw}x${vh} scale=${scale.toFixed(4)} ########`);
  const prev = {};
  for (const v of ["plain", "sharp05", "sharp10"]) prev[v] = Buffer.from(snaps[v].rgbB64, "base64");
  const rep = { scale: +scale.toFixed(4), vw, vh };
  for (const [v, intensity] of [["sharp05", 0.5], ["sharp10", 1.0]]) {
    const img = { width: vw, height: vh, data: rgb24ToRgba(prev.plain, vw, vh) };
    applySharpen(img, intensity);
    const postSharp = rgbaToRgb24(img.data, vw, vh);
    const dPost = deltaOf(postSharp, prev.plain);
    const dpPrev = deltaOf(prev[v], prev.plain);
    const mad = deltaMadFloat(dpPrev, dPost);
    // năng lượng: sum|d_post| vs sum|dp_prev|
    let sPost = 0, sPrev = 0;
    for (let i = 0; i < dPost.length; i++) { sPost += Math.abs(dPost[i]); sPrev += Math.abs(dpPrev[i]); }
    rep[v] = { mad_dPost_vs_dpPrev: mad, sumAbs_dPost: Math.round(sPost), sumAbs_dpPrev: Math.round(sPrev), ratio: +(sPost / sPrev).toFixed(3) };
    console.log(`  [E7a ${v}] MAD(d_post-upscale, dp_prev)=${mad} | sum|d_post|=${Math.round(sPost)} sum|dp|=${Math.round(sPrev)} tỉ lệ=${rep[v].ratio}`);
    if (ds.lineX !== null) {
      const vcX = ds.lineX * scale;
      const vpX0 = Math.max(0, Math.round(vcX) - 12), vpX1 = Math.min(vw, Math.round(vcX) + 13);
      const pPost = xProfile(dPost, vw, vh, vpX0, vpX1);
      const pPrev = xProfile(dpPrev, vw, vh, vpX0, vpX1);
      rep[v].profile_dPost = pPost;
      rep[v].profile_dpPrev = pPrev;
      console.log(`    d_post profile = [${pPost.join(", ")}]`);
      console.log(`    dp_prev profile= [${pPrev.join(", ")}]`);
    }
  }
  report.datasets[ds.key] = rep;
}
writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
console.log(`\nJSON: ${OUT}`);
