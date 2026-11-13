#!/usr/bin/env node
/**
 * r82j4-screen-motion.mjs — Phase 9 đợt 82, luồng J4: SCREEN media motion
 * trên frame ĐÃ DECODE (bài học I4 §4.1: screen pre-encode nói quá d0
 * 16–21% với chroma-scale) trước khi capture headed.
 *
 * Với mỗi media trong hidden_files/round82-j4/render/{name}-plain.raw
 * (frame 30 đã decode từ mp4 vừa build), tính d0std_R theo rect chuẩn
 * (311/489/667/809/1129/1449/1769) bằng delta0Viewport_70x6 +
 * channelStatsRaw — cùng công thức cổng của harness. residStd_R KHÔNG
 * đo được offline (cần preview capture) nên dự đoán bằng mô hình trung
 * bình-không-tương-quan (I4 §4.3, khớp 2% trên still) từ resid cha đã đo:
 *   - blend-motion tp×slov: resid ≈ √((1-α)·resid_tp(rect))² + (α·resid_slov-motion(rect))²
 *     với resid_tp: 4,458@311 / 3,501@667 / 0,987@1129 / 1,216@1449 / 1,002@1769
 *     (F7, still — tp là still nên giữ nguyên); resid_slov-motion:
 *     2,578@489 / 2,947@809 (F7, video thật); rect khác: nội suy/không dự đoán.
 *   - chroma-motion slov: resid ≈ resid_slov-motion (chroma-scale không
 *     chạm resid — I4 §4.2).
 * Q4 dự đoán ⟺ plainMad (chưa biết, ước ~1,0–1,2 theo blend still) ≤ 2,5
 * ∧ d0std_R > 2 ∧ ratio_dự_đoán ≤ 1.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r82j4-screen-motion.mjs [tên...]
 * JSON: hidden_files/round82-j4/r82j4-screen-motion.json.
 * KHÔNG push/tag/binary/workflow. Không sửa harness/production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { delta0Viewport_70x6, channelStatsRaw } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const J4 = path.join(GOAL, "round82-j4");
const RENDER = path.join(J4, "render");
const OUT = path.join(J4, "r82j4-screen-motion.json");
const NAMES = process.argv.slice(2).length ? process.argv.slice(2) : [
  "blend-motion-tp-slov-a88", "blend-motion-tp-slov-a85",
  "slov-chroma-motion-s16", "slov-chroma-motion-s12",
];
// Rect chuẩn (w × h = w × round(w*9/16)).
const RECTS = [[311, 175], [489, 275], [667, 375], [809, 455], [1129, 635], [1449, 815], [1769, 995]];
// resid cha đã đo (F7, số không-làm-tròn từ sweep I4).
const RESID_TP = { 311: 4.458, 667: 3.501, 1129: 0.987, 1449: 1.216, 1769: 1.002 };
const RESID_SLOV_MOTION = { 489: 2.578, 809: 2.947 };
// Nội suy tuyến tính resid_tp cho rect chưa đo (chỉ dùng cho dự đoán).
function interpResidTp(w) {
  const ks = Object.keys(RESID_TP).map(Number).sort((a, b) => a - b);
  if (RESID_TP[w] !== undefined) return RESID_TP[w];
  for (let i = 0; i < ks.length - 1; i++) {
    if (w > ks[i] && w < ks[i + 1]) {
      const t = (w - ks[i]) / (ks[i + 1] - ks[i]);
      return RESID_TP[ks[i]] * (1 - t) + RESID_TP[ks[i + 1]] * t;
    }
  }
  return null;
}
const r4 = (x) => +x.toFixed(4);

async function main() {
  const out = { generated: new Date().toISOString(), method: "screen trên frame 30 ĐÃ DECODE (plain.raw từ mp4 vừa build)", media: [] };
  for (const name of NAMES) {
    const plainPath = path.join(RENDER, `${name}-plain.raw`);
    if (!fs.existsSync(plainPath)) { console.log(`bỏ ${name}: thiếu ${plainPath}`); continue; }
    const plain1280 = fs.readFileSync(plainPath);
    const isBlend = name.startsWith("blend-");
    const alpha = isBlend ? Number("0." + name.split("-a").pop()) : null;
    const s = !isBlend ? Number(name.split("-s").pop()) : null;
    const rows = [];
    for (const [vw, vh] of RECTS) {
      const d0 = delta0Viewport_70x6(plain1280, 1280, 720, vw, vh);
      const d0std = channelStatsRaw(Float64Array.from(d0)).std;
      const d0stdR = d0std[0];
      let residPred = null, ratioPred = null;
      if (isBlend) {
        const rTp = interpResidTp(vw);
        const rSl = RESID_SLOV_MOTION[vw];
        if (rTp !== null && rSl !== undefined) {
          residPred = Math.sqrt(((1 - alpha) * rTp) ** 2 + (alpha * rSl) ** 2);
          ratioPred = d0stdR / residPred;
        }
      } else if (RESID_SLOV_MOTION[vw] !== undefined) {
        residPred = RESID_SLOV_MOTION[vw];
        ratioPred = d0stdR / residPred;
      }
      const q4pred = d0stdR > 2 && ratioPred !== null && ratioPred <= 1;
      rows.push({
        rect: `${vw}x${vh}`, d0stdR: r4(d0stdR), d0std: d0std.map(r4),
        residPred: residPred === null ? null : r4(residPred),
        ratioPred: ratioPred === null ? null : r4(ratioPred),
        q4Predicted: q4pred,
      });
    }
    console.log(`\n== ${name} (${isBlend ? `blend α=${alpha}` : `chroma ×${s}`}) ==`);
    for (const r of rows) {
      console.log(`  ${r.rect}: d0stdR=${r.d0stdR} residPred=${r.residPred ?? "?"} ratioPred=${r.ratioPred ?? "?"} Q4? ${r.q4Predicted ? "DỰ ĐOÁN CÓ" : "không"}`);
    }
    out.media.push({ name, kind: isBlend ? "blend-motion" : "chroma-motion", alpha, s, rows });
  }
  writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  console.log(`\nJSON: ${OUT}`);
}
main().catch((e) => { console.error(`J4-SCREEN-MOTION LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
