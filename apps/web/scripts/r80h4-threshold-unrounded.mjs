#!/usr/bin/env node
/**
 * r80h4-threshold-unrounded.mjs — Phase 9 đợt 80, luồng H4: kiểm tra
 * lại 4 ứng viên lật ngưỡng bằng Δkurt KHÔNG làm tròn.
 *
 * LÝ DO: channelStats trong delta0-harness.mjs làm tròn kurt về 2 chữ
 * số thập phân (toFixed(2)) rồi mới tính kurtDiff (toFixed(3)). Vì vậy
 * kurtDiff "chính xác" ở r80h4-threshold-verify.mjs vẫn mang sai số
 * lượng tử hoá tới ±0,01 — đúng bằng bước ngưỡng đang xét (±0,01).
 * Script này tính lại kurt/std/corr KHÔNG làm tròn từ cùng mảng delta
 * (dP/dR) của 4 case, rồi chấm verdict ở 0,34/0,35/0,36 bằng số chưa
 * làm tròn. Nếu verdict đổi so với bản làm tròn thì kết luận lật ở
 * 0,36 là artefact làm tròn, phải ghi rõ.
 *
 * JSON: hidden_files/round80-h4/r80h4-threshold-unrounded.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { b64ToRgb, delta0Viewport_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const D2 = path.join(GOAL, "round76-d2");
const Y2 = path.join(GOAL, "round71-y2");
const B1 = path.join(GOAL, "round74-b1");
const F7 = path.join(GOAL, "round78-f7");
const G6 = path.join(GOAL, "round79-g6");
const H4 = path.join(GOAL, "round80-h4");
fs.mkdirSync(H4, { recursive: true });
const OUT = path.join(H4, "r80h4-threshold-unrounded-034c.json");

const RENDER = {
  ocean: { plain: "fullrgb-ocean-plain.raw", noise05: "fullrgb-ocean-noise05.raw", noise10: "fullrgb-ocean-noise10.raw", dir: RENDER_NEW },
  "test-pattern": { plain: "fullrgb-plain.raw", noise05: "fullrgb-noise05.raw", noise10: "fullrgb-noise10.raw", dir: R66T3 },
};
const CASES = [
  // Bổ sung: B1-w1920 (lần chạy 034b trỏ nhầm thư mục headed-w1920x1080 chỉ có gradient).
  ["B1-w1920x1080-ocean-n05", "headed-w1920x1080-ocean", "r74b1-snaps-w1920x1080.json", "ocean", "noise05", B1],
];

// Thống kê KHÔNG làm tròn (sao chép công thức channelStats, bỏ toFixed).
function statsRaw(d) {
  const n = d.length / 3;
  const mean = [0, 0, 0];
  for (let c = 0; c < 3; c++) { let s = 0; for (let i = c; i < d.length; i += 3) s += d[i]; mean[c] = s / n; }
  const std = [], kurt = [], corr = [];
  for (let c = 0; c < 3; c++) {
    let s2 = 0, s4 = 0;
    for (let i = c; i < d.length; i += 3) { const v = d[i] - mean[c]; s2 += v * v; s4 += v * v * v * v; }
    const sd = Math.sqrt(s2 / n);
    std.push(sd);
    kurt.push(sd > 0 ? s4 / n / (sd ** 4) - 3 : 0);
  }
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += (d[i * 3 + a] - mean[a]) * (d[i * 3 + b] - mean[b]);
    corr.push(std[a] > 0 && std[b] > 0 ? s / n / (std[a] * std[b]) : 0);
  }
  return { std, kurt, corr };
}

function modeStatsRaw(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, delta0) {
  const n = vw * vh;
  const dP = new Float64Array(n * 3), dR = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    dP[i] = prevNoise[i] - prevPlain[i] - (delta0 ? delta0[i] : 0);
    dR[i] = renderNoiseTri[i] - renderPlainTri[i];
  }
  const p = statsRaw(dP), r = statsRaw(dR);
  const ratios = r.std.map((s, i) => p.std[i] / s);
  const dKurt = p.kurt.map((k, i) => Math.abs(k - r.kurt[i]));
  const dCorr = p.corr.map((c, i) => Math.abs(c - r.corr[i]));
  const verdict = (t) => (ratios.every((x) => x >= 0.85 && x <= 1.18) && dKurt.every((x) => x <= t) && dCorr.every((x) => x <= 0.12))
    ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ";
  return { ratios, kurtDiffRaw: dKurt, corrDiffRaw: dCorr, verdictAt: (t) => verdict(t) };
}

async function main() {
  const results = [];
  for (const [name, dir, file, src, lv, base] of CASES) {
    const doc = JSON.parse(fs.readFileSync(path.join(base, dir, file), "utf8"));
    const v = doc.snaps?.[src];
    if (!v?.plain || !v?.[lv]) { console.log(`  bỏ ${name}`); continue; }
    const cfg = RENDER[src];
    const plain1280 = fs.readFileSync(path.join(cfg.dir, cfg.plain));
    const noise1280 = fs.readFileSync(path.join(cfg.dir, cfg[lv]));
    const vw = v.plain.w, vh = v.plain.h;
    const prevPlain = b64ToRgb(v.plain.rgbB64), prevNoise = b64ToRgb(v[lv].rgbB64);
    const renderPlainTri = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
    const renderNoiseTri = resampleRgb24Trilinear(noise1280, 1280, 720, vw, vh);
    const d0 = delta0Viewport_70x6(plain1280, 1280, 720, vw, vh);
    const noD0 = modeStatsRaw(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
    const fullD0 = modeStatsRaw(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
    const r = {
      name, rect: `${vw}x${vh}`,
      noD0: { kurtDiffRaw: noD0.kurtDiffRaw.map((x) => +x.toFixed(4)), maxKurtRaw: +Math.max(...noD0.kurtDiffRaw).toFixed(4), verdict034: noD0.verdictAt(0.34), verdict035: noD0.verdictAt(0.35), verdict036: noD0.verdictAt(0.36) },
      fullD0: { kurtDiffRaw: fullD0.kurtDiffRaw.map((x) => +x.toFixed(4)), maxKurtRaw: +Math.max(...fullD0.kurtDiffRaw).toFixed(4), verdict034: fullD0.verdictAt(0.34), verdict035: fullD0.verdictAt(0.35), verdict036: fullD0.verdictAt(0.36) },
    };
    results.push(r);
    console.log(`== ${name} ==`);
    console.log(`  noD0:   kurtDiff chưa làm tròn=${JSON.stringify(r.noD0.kurtDiffRaw)} max=${r.noD0.maxKurtRaw} | 0,34=${r.noD0.verdict034} 0,35=${r.noD0.verdict035} 0,36=${r.noD0.verdict036}`);
    console.log(`  fullD0: kurtDiff chưa làm tròn=${JSON.stringify(r.fullD0.kurtDiffRaw)} max=${r.fullD0.maxKurtRaw} | 0,34=${r.fullD0.verdict034} 0,35=${r.fullD0.verdict035} 0,36=${r.fullD0.verdict036}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), note: "kurtDiff chưa làm tròn (4 chữ số); verdict tính từ số chưa làm tròn", results }, null, 2));
  console.log(`\nJSON không làm tròn: ${OUT}`);
}
main().catch((e) => { console.error(`H4-THRESHOLD-UNROUNDED LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
