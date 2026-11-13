#!/usr/bin/env node
/**
 * r78f7-g1g2-screen.mjs — Phase 9 đợt 78, luồng F7: SÀNG LỌC TÍNH TOÁN
 * (không capture) d0std_R theo (nội dung × cửa sổ viewport) để săn case
 * phân biệt G1 vs G2.
 *
 * BỐI CẢNH: G1 (chỉ cổng d0std_R ≤ 2,0) và G2 (chỉ cổng ratio_R ≤ 1,0)
 * đồng ý nhau trên cả 23 case chấm được tới nay (D2 §6.1, E6 §5.1).
 * Hai cổng chỉ bất đồng ở 2 góc phần tư:
 *   Q3: d0std_R ≤ 2,0 NHƯNG ratio_R > 1  (G1 áp d0, G2 từ chối)
 *   Q4: d0std_R > 2,0 NHƯNG ratio_R ≤ 1  (G1 từ chối, G2 áp d0)
 * d0std_R chỉ phụ thuộc frame render + kích thước viewport nên tính được
 * thuần túy từ frame render đã có, KHÔNG cần capture. ratio_R thì cần
 * residStd_R (cần snapshot preview thật) nên màn này chỉ SÀNG d0std_R:
 * tìm (nội dung, cửa sổ) mà d0std_R rơi vào vùng có thể bất đồng, rồi
 * mới bỏ công capture để đo residStd_R thật.
 *
 * Nội dung sàng: ocean/basgo/slovenska (render-1k, frame Z2) +
 * test-pattern (R66T3/render/fullrgb-plain.raw) + ocean khung khác
 * f23/f24/f26/f27 (build 1280 bằng C1 RGB resample — CHỈ ĐỂ SÀNG, ghi rõ;
 * frame render chính thức cho verdict vẫn phải build bằng C2 YUV như Z2).
 * Cửa sổ: 7 rect đã biết từ B1/Y2 (311x175 … 1769x995).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r78f7-g1g2-screen.mjs
 * JSON: hidden_files/round78-f7/r78f7-screen.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { delta0Viewport_70x6, channelStats } from "./delta0-harness.mjs";
import { resampleRgb24 } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const NATIVE = path.join(Z2, "native");
const F7 = path.join(GOAL, "round78-f7");
fs.mkdirSync(F7, { recursive: true });
const OUT = path.join(F7, "r78f7-screen.json");

// 7 rect đã biết (B1 sweep + Y2): [w, h, tên cửa sổ gốc].
const RECTS = [
  [311, 175, "w1280x800"], [489, 275, "w1440x900/w1600x900"], [667, 375, "w1760x1000"],
  [809, 455, "w1920x1080"], [1129, 635, "w2240x1260"], [1449, 815, "w2560x1440"], [1769, 995, "w2880x1620"],
];

function screenFrame(label, plain1280, buildNote) {
  const rows = [];
  for (const [vw, vh, win] of RECTS) {
    const d0 = delta0Viewport_70x6(plain1280, 1280, 720, vw, vh);
    const d0std = channelStats(Float64Array.from(d0)).std;
    rows.push({ rect: `${vw}x${vh}`, window: win, d0std, d0stdR: d0std[0] });
    console.log(`  ${label} ${vw}x${vh} (${win}): d0std=${JSON.stringify(d0std)}`);
  }
  return { label, buildNote, rows };
}

async function main() {
  const out = { generated: new Date().toISOString(), rects: RECTS.map(([w, h, n]) => `${w}x${h} (${n})`), frames: [] };
  // 1) Frame render chính thức (Z2 C2 / R66T3) — 4 nội dung.
  for (const [label, file] of [
    ["ocean-f25", path.join(RENDER_NEW, "fullrgb-ocean-plain.raw")],
    ["basgo-f30", path.join(RENDER_NEW, "fullrgb-basgo-plain.raw")],
    ["slovenska-f25", path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw")],
    ["test-pattern-f30", path.join(R66T3, "fullrgb-plain.raw")],
  ]) {
    const plain = fs.readFileSync(file);
    if (plain.length !== 1280 * 720 * 3) throw new Error(`${label}: frame sai kích thước ${plain.length}`);
    console.log(`== ${label} (${path.basename(file)}, canonical) ==`);
    out.frames.push(screenFrame(label, plain, "canonical (Z2 C2 / R66T3)"));
  }
  // 2) Ocean khung khác f23/f24/f26/f27 — build 1280 bằng C1 RGB (CHỈ SÀNG).
  for (const f of [23, 24, 26, 27]) {
    const nat = fs.readFileSync(path.join(NATIVE, `ocean-f${f}-1920.rgb`));
    if (nat.length !== 1920 * 1080 * 3) throw new Error(`ocean-f${f}: native sai kích thước`);
    const plain1280 = resampleRgb24(nat, 1920, 1080, 1280, 720);
    console.log(`== ocean-f${f} (C1 RGB resample — CHỈ SÀNG, không phải frame verdict) ==`);
    out.frames.push(screenFrame(`ocean-f${f}`, plain1280, "SCREEN-ONLY C1 RGB resample 1920->1280 (Z2: C2 YUV thắng; C1 chỉ để sàng d0std_R)"));
  }
  // 3) Tóm tắt vùng bất đồng tiềm năng.
  const summary = [];
  for (const fr of out.frames) {
    for (const r of fr.rows) {
      const zone = r.d0stdR <= 2.0 ? "d0stdR<=2 (G1 áp; Q3 nếu ratioR>1)" : "d0stdR>2 (G1 từ chối; Q4 nếu ratioR<=1)";
      summary.push({ frame: fr.label, rect: r.rect, d0stdR: r.d0stdR, zone });
    }
  }
  out.summary = summary;
  const q3cand = summary.filter((s) => s.d0stdR <= 2.0 && s.d0stdR > 0.5);
  const q4cand = summary.filter((s) => s.d0stdR > 2.0);
  console.log(`\nỨng viên Q3 (d0std_R ∈ (0,5; 2] — cần đo residStd_R, bất đồng nếu residStd_R < d0std_R): ${q3cand.length}`);
  for (const c of q3cand) console.log(`  Q3? ${c.frame} ${c.rect} d0std_R=${c.d0stdR}`);
  console.log(`Ứng viên Q4 (d0std_R > 2 — cần residStd_R > d0std_R, tức plain xa render kênh R): ${q4cand.length}`);
  for (const c of q4cand) console.log(`  Q4? ${c.frame} ${c.rect} d0std_R=${c.d0stdR}`);
  writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  console.log(`\nJSON sàng lọc: ${OUT}`);
}
main().catch((e) => { console.error(`F7-SCREEN LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
