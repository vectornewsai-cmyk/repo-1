#!/usr/bin/env node
/**
 * r72z2-yuv1280.mjs — Phase 9 đợt 72, luồng Z2 (bổ sung cho r72z2-rebuild):
 * tách biến cho ứng viên C2 (1-kernel YUV) của rebuild.
 *
 * C2 (resampleYuv420p) gộp HAI thay đổi cùng lúc so với baseline C0:
 *   (1) filter scale 1920→1280: bicubic ffmpeg → triangle h=1 từng plane;
 *   (2) convert YUV→RGB: ffmpeg (chroma upsample nội suy) → nearest 2×2.
 * Script này chỉ làm (1): resample từng plane YUV420p 1920→1280 bằng
 * triangle h=1 (resamplePlane, cùng hàm mà resampleYuv420p dùng), ghi
 * raw yuv420p 1280×720 để ffmpeg convert/noise (xem LIMITS Z2 §2):
 *   - C2b plain: ffmpeg yuv1280 → rgb24 bt709 (convert chuẩn ffmpeg).
 *   - Method-F noise: ffmpeg yuv1280 + noise=alls=28/50:allf=t → rgb24.
 *     (Chuỗi render thật: noise cộng trong YUV SAU scale rồi mới convert
 *     RGB — method F tái lập đúng chuỗi này với realization nhiễu mới
 *     cùng phân phối; đối chứng với method T (chuyển delta RGB) của
 *     rebuild, vốn kẹp rail 7–15% pixel trên ocean.)
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r72z2-yuv1280.mjs
 * Ghi: hidden_files/round72-z2/yuv1280/fullrgb-{src}-plain-1kyuv.yuv
 * Exit 0 khi xong. KHÔNG push/tag/binary.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resamplePlane } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const NATIVE = path.join(Z2, "native");
const OUT = path.join(Z2, "yuv1280");
fs.mkdirSync(OUT, { recursive: true });

const SOURCES = {
  ocean: "ocean-f25-1920.yuv",
  basgo: "basgo-f30-1920.yuv",
  slovenska: "slovenska-f25-1920.yuv",
};

function resamplePlaneU8(plane, sw, sh, dw, dh) {
  const f = new Float64Array(sw * sh);
  for (let i = 0; i < f.length; i++) f[i] = plane[i];
  const rs = resamplePlane(f, sw, sh, dw, dh, dw / sw, dh / sh);
  const out = Buffer.alloc(dw * dh);
  for (let i = 0; i < rs.length; i++) {
    const v = Math.round(rs[i]);
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}

for (const [src, file] of Object.entries(SOURCES)) {
  const yuv = fs.readFileSync(path.join(NATIVE, file));
  const W = 1920, H = 1080, cw = 960, ch = 540;
  const yOff = 0, uOff = W * H, vOff = uOff + cw * ch;
  const t0 = Date.now();
  const y = resamplePlaneU8(yuv.subarray(yOff, uOff), W, H, 1280, 720);
  const u = resamplePlaneU8(yuv.subarray(uOff, vOff), cw, ch, 640, 360);
  const v = resamplePlaneU8(yuv.subarray(vOff), cw, ch, 640, 360);
  const out = Buffer.concat([y, u, v]);
  if (out.length !== 1280 * 720 * 3 / 2) throw new Error(`${src}: yuv1280 sai kích thước`);
  writeFileEpermRetry(path.join(OUT, `fullrgb-${src}-plain-1kyuv.yuv`), out);
  console.log(`${src}: yuv1280 1-kernel xong (${(Date.now() - t0) / 1000}s), ${out.length} byte`);
}
console.log(`Ghi tại: ${OUT}`);
