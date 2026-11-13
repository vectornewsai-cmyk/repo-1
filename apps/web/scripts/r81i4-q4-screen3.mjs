#!/usr/bin/env node
/**
 * r81i4-q4-screen3.mjs — Phase 9 đợt 81, luồng I4: SÀNG BỔ SUNG (không
 * capture) chroma-scale slovenska s ∈ {14, 16, 20, 24} — nối họ G của
 * screen2 (dừng ở s12: d0std_R 2,06–2,11 ở rect lớn nhưng sau encode chỉ
 * còn 1,63; resid ở 1129×635 chỉ 0,70 nên không Q4).
 *
 * LÝ DO SÀNG TIẾP: capture đối chứng plain-slovenska w2240 cho thấy
 * residStd_R slovenska ở 809×455 là 2,95 (cao) trong khi ở 1129×635
 * chỉ 0,71 — chroma-scale KHÔNG làm sụp resid (s12 giữ nguyên 0,70).
 * Vì vậy hướng chroma-scale vẫn sống ở rect 809×455 (w1920): cần s đủ
 * lớn để d0std_R SAU ENCODE vượt 2,0 (screen s12@809 = 1,92; encode
 * làm suy giảm ~10–21% ở rect lớn) trong khi resid 2,95 vẫn giữ ratio
 * ≤ 1. Mục tiêu: d0std_R (decoded, ước ~0,85× screen) ≈ 2,7–3,0.
 *
 * JSON: ghi thêm vào hidden_files/round81-i4/r81i4-q4-screen2.json
 * (cùng file screen2, resume theo label).
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { channelStatsRaw, estShiftFrame_70x6, rgbToYuv709_70x6, yuv709ToRgb_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const RENDER_NEW = path.join(GOAL, "round72-z2", "render-1k");
const I4 = path.join(GOAL, "round81-i4");
const OUT = path.join(I4, "r81i4-q4-screen2.json");

const RECTS = [
  [311, 175, "w1280x800"], [489, 275, "w1440x900/w1600x900"], [667, 375, "w1760x1000"],
  [809, 455, "w1920x1080"], [1129, 635, "w2240x1260"], [1449, 815, "w2560x1440"], [1769, 995, "w2880x1620"],
];

function chromaScale(rgb, s) {
  const out = Buffer.alloc(rgb.length);
  const clamp = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  let clampCount = 0;
  for (let i = 0; i < rgb.length; i += 3) {
    const [y, cb, cr] = rgbToYuv709_70x6(rgb[i], rgb[i + 1], rgb[i + 2]);
    const ncb = 128 + (cb - 128) * s, ncr = 128 + (cr - 128) * s;
    if (ncb < 16 || ncb > 240 || ncr < 16 || ncr > 240) clampCount++;
    const [r, g, b] = yuv709ToRgb_70x6(y, ncb, ncr);
    out[i] = clamp(r); out[i + 1] = clamp(g); out[i + 2] = clamp(b);
  }
  return { frame: out, clampFrac: +(clampCount / (rgb.length / 3)).toFixed(4) };
}

async function main() {
  const slovenska = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw"));
  const out = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const doneLabels = new Set(out.frames.map((f) => f.label));
  const flush = () => writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  for (const s of [14, 16, 20, 24]) {
    const label = `slov-chroma-s${s}`;
    if (doneLabels.has(label)) { console.log(`  bỏ qua ${label} (đã có)`); continue; }
    const t0 = Date.now();
    const { frame, clampFrac } = chromaScale(slovenska, s);
    const shifted = estShiftFrame_70x6(frame, 1280, 720);
    const rows = [];
    for (const [vw, vh, win] of RECTS) {
      const a = resampleRgb24Trilinear(frame, 1280, 720, vw, vh);
      const b = resampleRgb24Trilinear(shifted, 1280, 720, vw, vh);
      const d0 = new Int16Array(vw * vh * 3);
      for (let i = 0; i < vw * vh * 3; i++) d0[i] = b[i] - a[i];
      const d0std = channelStatsRaw(Float64Array.from(d0)).std;
      rows.push({ rect: `${vw}x${vh}`, window: win, d0std: d0std.map((x) => +x.toFixed(4)), d0stdR: +d0std[0].toFixed(4) });
    }
    out.frames.push({ label, rows, extra: { s, clampFrac } });
    flush();
    console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${label}: d0std_R=[${rows.map((x) => x.d0stdR).join(", ")}] clampFrac=${clampFrac} | @809x455=${rows[3].d0stdR} (ước decoded ~${(rows[3].d0stdR * 0.85).toFixed(2)}–${(rows[3].d0stdR * 0.95).toFixed(2)})`);
  }
  console.log(`\nJSON: ${OUT}`);
}
main().catch((e) => { console.error(`I4-Q4-SCREEN3 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
