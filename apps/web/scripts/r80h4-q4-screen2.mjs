#!/usr/bin/env node
/**
 * r80h4-q4-screen2.mjs — Phase 9 đợt 80, luồng H4: SÀNG BỔ SUNG (tính
 * toán, không capture) blend test-pattern × slovenska — probe Q4 cuối
 * cùng sau khi a65 thất bại ở phía resid (n05/n10: residStd_R đo được
 * 1,04, ratio_R 1,93 — nội suy tuyến tính đã đánh giá resid cao gấp đôi).
 *
 * LÝ DO THỬ HỌ NÀY: test-pattern có residStd_R lớn nhất tập (4,46 ở
 * 311x175; 3,50 ở 667x375) + slovenska có residStd_R lớn ở mọi rect
 * (2,58–2,95); blend hai nội dung giàu-resid có thể giữ residStd_R ≥ 2
 * trong khi d0std_R (tp 1,15 + slov 0,22, nhưng tp bị clamp dập — blend
 * có thể unmask như tp×ocean đã làm: a0125 → 10,61) đi vào khoảng trống.
 * Chỉ sàng d0std_R (residStd_R thật cần capture; không nội suy nữa sau
 * bài học a65 — chỉ ghi d0std_R và nhận xét).
 * Ghi thêm vào hidden_files/round80-h4/r80h4-q4-screen.json (frames).
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { channelStats, estShiftFrame_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const H4 = path.join(GOAL, "round80-h4");
const OUT = path.join(H4, "r80h4-q4-screen.json");
const RECTS = [
  [311, 175, "w1280x800"], [489, 275, "w1440x900/w1600x900"], [667, 375, "w1760x1000"],
  [809, 455, "w1920x1080"], [1129, 635, "w2240x1260"], [1449, 815, "w2560x1440"], [1769, 995, "w2880x1620"],
];

function screenFrame(label, plain1280) {
  const shifted = estShiftFrame_70x6(plain1280, 1280, 720);
  const rows = [];
  for (const [vw, vh, win] of RECTS) {
    const a = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
    const b = resampleRgb24Trilinear(shifted, 1280, 720, vw, vh);
    const d0 = new Int16Array(vw * vh * 3);
    for (let i = 0; i < vw * vh * 3; i++) d0[i] = b[i] - a[i];
    const d0std = channelStats(Float64Array.from(d0)).std;
    rows.push({ rect: `${vw}x${vh}`, window: win, d0std, d0stdR: d0std[0] });
  }
  return { label, rows };
}

async function main() {
  const tp = fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw"));
  const slov = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw"));
  const out = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const done = new Set(out.frames.map((f) => f.label));
  for (const a of [0.85, 0.9, 0.95]) {
    const label = `blend-tp-slov-a${String(a).replace(".", "")}`;
    if (done.has(label)) { console.log(`  bỏ qua ${label} (đã có)`); continue; }
    const t0 = Date.now();
    const blend = Buffer.alloc(tp.length);
    for (let i = 0; i < tp.length; i++) blend[i] = Math.round(tp[i] * (1 - a) + slov[i] * a);
    const r = screenFrame(label, blend);
    out.frames.push(r);
    writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
    const inGap = r.rows.filter((row) => row.d0stdR > 1.17 && row.d0stdR <= 3.27).map((row) => `${row.rect}:${row.d0stdR}`);
    console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${label}: d0std_R=[${r.rows.map((x) => x.d0stdR).join(", ")}]${inGap.length ? `  <-- TRONG KHOẢNG TRỐNG ở ${inGap.join(" ")}` : ""}`);
  }
  console.log(`\nJSON sàng lọc Q4 (đã thêm): ${OUT}`);
}
main().catch((e) => { console.error(`H4-Q4-SCREEN2 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
