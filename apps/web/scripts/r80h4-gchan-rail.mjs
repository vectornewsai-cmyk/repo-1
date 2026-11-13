#!/usr/bin/env node
/**
 * r80h4-gchan-rail.mjs — Phase 9 đợt 80, luồng H4: CHỨNG MINH cơ chế
 * kênh G test-pattern bằng tỉ lệ pixel chạm ray (rail) của frame shifted.
 *
 * BỐI CẢNH (r80h4-gchan.mjs): d0std_G test-pattern ~4,4 trong khi
 * d0std_R ~1,15, d0std_B ~0,67; chỉ-Cr-shift tái lập gần như toàn bộ
 * G (4,45) còn chỉ-Cb-shift chỉ cho G 0,82. Giả thuyết: output clamp
 * [0,255] trong estShiftFrame_70x6 dập d0_R/d0_B ở sọc bão hoà (R/B
 * chạm ray) nhưng G không bao giờ chạm ray nên d0_G sống sót nguyên vẹn.
 * Script đo (frame render plain 1280x720, không capture):
 *  1. Tỉ lệ pixel frame shifted chạm ray 0/255 từng kênh (R/G/B).
 *  2. d0std full-res (không resample) có clamp vs không clamp (Int16,
 *     tránh Buffer wrap) — kiểm chứng clamp dập R/B nhưng không dập G.
 *
 * JSON: hidden_files/round80-h4/r80h4-gchan-rail.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { channelStats, rgbToYuv709_70x6, yuv709ToRgb_70x6, estimateNativeChroma_70x6 } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const H4 = path.join(GOAL, "round80-h4");
fs.mkdirSync(H4, { recursive: true });
const OUT = path.join(H4, "r80h4-gchan-rail.json");
const W = 1280, H = 720;

function shiftFrame(rgb, clampOut) {
  // Sao chép estShiftFrame_70x6 nhưng trả về Int16 (không wrap) khi clampOut=false.
  const out = new Int16Array(W * H * 3);
  const cw = (W + 1) >> 1, ch = (H + 1) >> 1;
  const Y = new Float64Array(W * H), CB = new Float64Array(W * H), CR = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= W || y >= H) continue;
      const i = y * W + x;
      sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma_70x6(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma_70x6(sCr / n, 1.12);
  }
  const cl = (v) => { const r = Math.round(v); return clampOut ? (r < 0 ? 0 : r > 255 ? 255 : r) : r; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const [r, g, b] = yuv709ToRgb_70x6(Y[i], estCb[ci], estCr[ci]);
    out[p] = cl(r); out[p + 1] = cl(g); out[p + 2] = cl(b);
  }
  return out;
}

async function main() {
  const frames = {
    "test-pattern": fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw")),
    ocean: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw")),
    basgo: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-basgo-plain.raw")),
    slovenska: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw")),
  };
  const out = { generated: new Date().toISOString(), frames: {} };
  for (const [label, rgb] of Object.entries(frames)) {
    const shiftedClamped = shiftFrame(rgb, true);
    const shiftedRaw = shiftFrame(rgb, false);
    // 1) Tỉ lệ pixel shifted (có clamp) chạm ray 0/255 từng kênh.
    const rail = [0, 0, 0];
    for (let p = 0; p < W * H; p++) for (let c = 0; c < 3; c++) {
      const v = shiftedClamped[p * 3 + c];
      if (v === 0 || v === 255) rail[c]++;
    }
    const railPct = rail.map((n) => +(100 * n / (W * H)).toFixed(1));
    // Tỉ lệ pixel plain gốc đã ở ray (đối chứng: plain đã bão hoà sẵn?).
    const railPlain = [0, 0, 0];
    for (let p = 0; p < W * H; p++) for (let c = 0; c < 3; c++) {
      const v = rgb[p * 3 + c];
      if (v === 0 || v === 255) railPlain[c]++;
    }
    const railPlainPct = railPlain.map((n) => +(100 * n / (W * H)).toFixed(1));
    // 2) d0std full-res (không resample) có clamp vs không clamp.
    const d0std = (shifted) => {
      const d0 = new Float64Array(W * H * 3);
      for (let i = 0; i < W * H * 3; i++) d0[i] = shifted[i] - rgb[i];
      return channelStats(d0).std;
    };
    const withClamp = d0std(shiftedClamped);
    const withoutClamp = d0std(shiftedRaw);
    console.log(`== ${label} ==`);
    console.log(`  shifted chạm ray: R=${railPct[0]}% G=${railPct[1]}% B=${railPct[2]}% (plain gốc chạm ray: R=${railPlainPct[0]}% G=${railPlainPct[1]}% B=${railPlainPct[2]}%)`);
    console.log(`  d0std full-res có clamp: ${JSON.stringify(withClamp)} | không clamp (Int16, không wrap): ${JSON.stringify(withoutClamp)}`);
    out.frames[label] = { railPctShifted: railPct, railPctPlain: railPlainPct, d0stdFullResWithClamp: withClamp, d0stdFullResWithoutClamp: withoutClamp };
  }
  writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  console.log(`\nJSON rail: ${OUT}`);
}
main().catch((e) => { console.error(`H4-GCHAN-RAIL LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
