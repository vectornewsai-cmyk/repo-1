#!/usr/bin/env node
/**
 * r82j4-detail1920.mjs — Phase 9 đợt 82, luồng J4: so sánh ĐỘ CHI TIẾT
 * tại 1920 native giữa blend-1920 f30 (x264 crf 18) và webm f25 native
 * (VP9 gốc) — test (i) phân biệt giả thuyết (a) codec vs (b) x264 làm
 * mượt chi tiết tần số cao (xem round82-j4.md § chẩn đoán resid).
 *
 * Đọc 2 file .raw 1920×1080 rgb24 đã có trên đĩa (KHÔNG cần ffmpeg):
 *   render/blend-1920-tp-slov-a88-decoded30-1920.raw  (f30 của mp4 blend)
 *   render/check-webm-f25-1920.raw                   (f25 webm native)
 * Metric (mỗi kênh R/G/B): std, frac|Δ|>8 (Δ = hiệu với pixel kề phải,
 * proxy chi tiết tần số cao), mean|Δ| ngang + dọc. Nếu detail blend ≈
 * detail webm thì (b) yếu (x264 crf 18 giữ chi tiết); nếu blend thấp
 * hẳn thì (b) được ủng hộ.
 * Ra: stdout + hidden_files/round82-j4/r82j4-detail1920.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// Đợt 83 K8: ghi JSON qua helper chống sóng EPERM (xem eperm-retry.mjs).
import { writeFileEpermRetry } from "./eperm-retry.mjs";

const J4 = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round82-j4");
const W = 1920, H = 1080;
const files = {
  blend1920f30: path.join(J4, "render", "blend-1920-tp-slov-a88-decoded30-1920.raw"),
  webmF25: path.join(J4, "render", "check-webm-f25-1920.raw"),
  // Thêm tp-1920 để phân rã detail của blend: blend ≈ 0,12·tp + 0,88·slov
  // (nội suy tuyến tính trên frac/meanAbs) — xem có phải x264 làm mượt
  // riêng thành phần slov trong blend hay không.
  tp1920: path.join(J4, "render", "check-tp-f30-1920.raw"),
};

function detailStats(buf, w, h) {
  const n = w * h;
  const out = { std: [], mean: [], fracGt8H: [], fracGt8V: [], meanAbsH: [], meanAbsV: [] };
  for (let c = 0; c < 3; c++) {
    let mean = 0;
    for (let i = c; i < buf.length; i += 3) mean += buf[i];
    mean /= n;
    let s2 = 0, gt8h = 0, cntH = 0, sumH = 0, gt8v = 0, cntV = 0, sumV = 0;
    for (let i = c; i < buf.length; i += 3) { const v = buf[i] - mean; s2 += v * v; }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w - 1; x++) {
        const d = Math.abs(buf[(y * w + x) * 3 + c] - buf[(y * w + x + 1) * 3 + c]);
        sumH += d; cntH++; if (d > 8) gt8h++;
      }
    }
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.abs(buf[(y * w + x) * 3 + c] - buf[((y + 1) * w + x) * 3 + c]);
        sumV += d; cntV++; if (d > 8) gt8v++;
      }
    }
    out.std.push(+(Math.sqrt(s2 / n)).toFixed(3));
    out.mean.push(+mean.toFixed(2));
    out.fracGt8H.push(+(gt8h / cntH).toFixed(4));
    out.fracGt8V.push(+(gt8v / cntV).toFixed(4));
    out.meanAbsH.push(+(sumH / cntH).toFixed(3));
    out.meanAbsV.push(+(sumV / cntV).toFixed(3));
  }
  return out;
}

const res = {};
for (const [k, p] of Object.entries(files)) {
  const buf = fs.readFileSync(p);
  if (buf.length !== W * H * 3) { console.error(`KÍCH THƯỚC SAI ${k}: ${buf.length}`); process.exitCode = 2; }
  res[k] = detailStats(buf, W, H);
  console.log(`${k}: ${JSON.stringify(res[k])}`);
}
// So sánh trực tiếp 2 frame (MAD) — cùng nội dung slov, khác encode/blend.
const a = fs.readFileSync(files.blend1920f30), b = fs.readFileSync(files.webmF25);
let s = 0, max = 0;
for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); s += d; if (d > max) max = d; }
res.madBlendVsWebm = { mad: +(s / a.length).toFixed(3), max };
console.log(`MAD blend-f30 vs webm-f25 @1920: ${res.madBlendVsWebm.mad} max=${max} (kỳ vọng ~15: blend = 0,12·tp + 0,88·slov, tp sáng hơn slov nhiều — KHÁC với BLEND check MAD 3,5 của media-build1920 vốn so với node-blend đã có tp)`);
// Phân rã tuyến tính fracGt8H/meanAbsH của blend → ước lượng detail của
// thành phần slov BÊN TRONG blend (đã qua x264): x ≈ (blend − 0,12·tp)/0,88.
for (const m of ["fracGt8H", "fracGt8V", "meanAbsH", "meanAbsV"]) {
  res[`slovInBlend_${m}`] = res.blend1920f30[m].map((v, c) =>
    +((v - 0.12 * res.tp1920[m][c]) / 0.88).toFixed(4));
  console.log(`slov-in-blend ${m}: [${res[`slovInBlend_${m}`]}] vs webm ${m}: [${res.webmF25[m]}]`);
}
// Ghi JSON qua helper EPERM (đợt 83 K8 — thay vòng retry tay 5×2 s của J4:
// J4 ghi fail 5/5 lần lúc ~16:02; helper thêm verify đủ byte và nhịp
// 5×20 s theo pattern package-ship).
let saved = false;
try {
  writeFileEpermRetry(path.join(J4, "r82j4-detail1920.json"), JSON.stringify(res, null, 2), { label: "r82j4-detail1920.json" });
  saved = true;
} catch (e) {
  console.log(`  ghi JSON lỗi: ${e.code || e.message} — số liệu vẫn có ở stdout trên.`);
}
if (!saved) { console.log("KHÔNG GHI ĐƯỢC JSON (sóng EPERM) — số liệu vẫn có ở stdout trên."); process.exitCode = 3; }
console.log("DONE — r82j4-detail1920.json");
