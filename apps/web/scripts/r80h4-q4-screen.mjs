#!/usr/bin/env node
/**
 * r80h4-q4-screen.mjs — Phase 9 đợt 80, luồng H4: SÀNG LỌC TÍNH TOÁN
 * (không capture) tìm nội dung có d0std_R trong khoảng trống
 * (1,17; 3,27] giữa test-pattern (~1,17) và ocean (~3,3) — săn góc Q4
 * (d0std_R > 2 nhưng ratio_R <= 1) để phân biệt G2 vs G12.
 *
 * BỐI CẢNH (G6 §5.6, F7 §5.2/§6.2): không frame nào trong tập hiện tại
 * có d0std_R trong (1,17; 3,27]; mọi case bất đồng G1/G2 đều ở Q3.
 * d0std_R chỉ phụ thuộc frame render plain 1280x720 + rect viewport nên
 * sàng được thuần túy từ frame, KHÔNG cần capture. ratio_R thì cần
 * residStd_R (cần snapshot preview thật) nên màn này chỉ SÀNG d0std_R,
 * đồng thời ƯỚC LƯỢNG residStd_R bằng nội suy tuyến tính từ residStd_R
 * của 2 nội dung cha ở cùng rect (ghi rõ là ƯỚC LƯỢNG, không phải đo —
 * residStd_R thật chỉ có sau capture).
 *
 * TỐI ƯU (v2): estShiftFrame chỉ tính 1 lần/frame (không phụ thuộc rect)
 * thay vì 7 lần như delta0Viewport_70x6; ghi JSON tăng dần sau mỗi frame
 * để không mất kết quả nếu bị kill giữa chừng (VM đông, load cao).
 *
 * Họ nội dung sàng:
 *  A. Blend RGB test-pattern × ocean, α ∈ {0,125..0,875}.
 *  B. Blend RGB slovenska × ocean — slovenska có residStd_R lớn
 *     (2,58–2,95) ở mọi rect, có thể giữ ratio_R ≤ 1 khi d0std_R > 2.
 *  C. Blend RGB basgo × ocean (đối chứng).
 *  D. Chroma-scale ocean: giữ Y, scale (Cb-128),(Cr-128) theo s ∈
 *     {0,2; 0,4; 0,6; 0,8} trong không gian YUV709.
 *  E. Synth gradient + nhiễu: gradient luma dọc + sinus chroma biên độ
 *     A, bước sóng λ.
 *
 * Cửa sổ: 7 rect đã biết (B1/Y2). JSON (ghi tăng dần):
 * hidden_files/round80-h4/r80h4-q4-screen.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { channelStats, estShiftFrame_70x6, rgbToYuv709_70x6, yuv709ToRgb_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const G6 = path.join(GOAL, "round79-g6");
const H4 = path.join(GOAL, "round80-h4");
fs.mkdirSync(H4, { recursive: true });
const OUT = path.join(H4, "r80h4-q4-screen.json");

// 7 rect đã biết (B1 sweep + Y2): [w, h, tên cửa sổ gốc].
const RECTS = [
  [311, 175, "w1280x800"], [489, 275, "w1440x900/w1600x900"], [667, 375, "w1760x1000"],
  [809, 455, "w1920x1080"], [1129, 635, "w2240x1260"], [1449, 815, "w2560x1440"], [1769, 995, "w2880x1620"],
];
const GAP_LO = 1.17, GAP_HI = 3.27; // khoảng trống d0std_R (F7 §5.2, G6 §5.6)
const Q4_D0_MIN = 2.0; // Q4 cần d0std_R > 2,0

// residStd_R của nội dung cha ở từng rect — lấy từ JSON recheck G6
// (harness hiện tại, đã tính lại bằng resample BC). Dùng để ƯỚC LƯỢNG
// residStd_R của blend (nội suy tuyến tính theo α).
function loadParentResid() {
  const map = {}; // `${src}|${vw}x${vh}` -> residStd_R (trung bình các case n05/n10 cùng rect)
  const files = [
    path.join(G6, "r79g6-f7-recheck.json"),
    path.join(G6, "r79g6-sweep.json"),
    path.join(G6, "r79g6-e6-recheck.json"),
    path.join(G6, "r79g6-e6-newcases-recheck.json"),
  ];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const c of j.cases || []) {
      if (!c.residStd || !c.rect) continue;
      const key = `${c.source || "?"}|${c.rect}`;
      (map[key] = map[key] || []).push(c.residStd[0]);
    }
  }
  const avg = {};
  for (const [k, v] of Object.entries(map)) avg[k] = +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2);
  return avg;
}

function screenFrame(label, plain1280) {
  // shifted chỉ tính 1 lần (không phụ thuộc rect); mỗi rect chỉ còn 2 resample.
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

function blendRgb(a, b, alpha) {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] * (1 - alpha) + b[i] * alpha);
  return out;
}

function chromaScale(rgb, s) {
  const out = Buffer.alloc(rgb.length);
  const clamp = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let i = 0; i < rgb.length; i += 3) {
    const [y, cb, cr] = rgbToYuv709_70x6(rgb[i], rgb[i + 1], rgb[i + 2]);
    const [r, g, b] = yuv709ToRgb_70x6(y, 128 + (cb - 128) * s, 128 + (cr - 128) * s);
    out[i] = clamp(r); out[i + 1] = clamp(g); out[i + 2] = clamp(b);
  }
  return out;
}

function synthGradientChroma(w, h, amp, lambda) {
  const out = Buffer.alloc(w * h * 3);
  const clamp = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < h; y++) {
    const yv = 16 + (219 * y) / Math.max(1, h - 1);
    for (let x = 0; x < w; x++) {
      const ph = (2 * Math.PI * x) / lambda;
      const cb = 128 + amp * Math.sin(ph);
      const cr = 128 + amp * Math.cos(ph);
      const [r, g, b] = yuv709ToRgb_70x6(yv, cb, cr);
      const p = (y * w + x) * 3;
      out[p] = clamp(r); out[p + 1] = clamp(g); out[p + 2] = clamp(b);
    }
  }
  return out;
}

async function main() {
  const tp = fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw"));
  const ocean = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const basgo = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-basgo-plain.raw"));
  const slovenska = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw"));
  for (const [n, f] of [["tp", tp], ["ocean", ocean], ["basgo", basgo], ["slovenska", slovenska]]) {
    if (f.length !== 1280 * 720 * 3) throw new Error(`${n}: frame sai kích thước ${f.length}`);
  }
  const parentResid = loadParentResid();
  console.log("residStd_R cha (trung bình theo rect, từ JSON recheck G6):");
  for (const k of Object.keys(parentResid).sort()) console.log(`  ${k}: ${parentResid[k]}`);

  let out = { generated: new Date().toISOString(), gap: `(${GAP_LO}; ${GAP_HI}]`, q4D0Min: Q4_D0_MIN, parentResid, frames: [], q4Candidates: [] };
  if (fs.existsSync(OUT)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
      if (Array.isArray(prev.frames) && prev.frames.length) {
        out.frames = prev.frames;
        console.log(`resume: giữ ${prev.frames.length} frame đã sàng: ${prev.frames.map((f) => f.label).join(", ")}`);
      }
    } catch { console.log("resume: không đọc được JSON cũ, bắt đầu mới"); }
  }
  const doneLabels = new Set(out.frames.map((f) => f.label));
  const flush = () => writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  const screen = (label, frame) => {
    if (doneLabels.has(label)) { console.log(`  bỏ qua ${label} (đã có)`); return null; }
    const t0 = Date.now();
    const r = screenFrame(label, frame);
    out.frames.push(r);
    flush();
    const inGap = r.rows.filter((row) => row.d0stdR > GAP_LO && row.d0stdR <= GAP_HI).map((row) => `${row.rect}:${row.d0stdR}`);
    console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${label}: d0std_R=[${r.rows.map((x) => x.d0stdR).join(", ")}]${inGap.length ? `  <-- TRONG KHOẢNG TRỐNG ở ${inGap.join(" ")}` : ""}`);
    return r;
  };

  console.log("== A. Blend test-pattern × ocean: BỎ (a0125=10,61, a025=11,0 đã chứng minh vượt khoảng — unmask clamp, xem LIMITS §2) ==");
  console.log("== B. Blend slovenska × ocean ==");
  for (const a of [0.25, 0.375, 0.5, 0.625, 0.75]) {
    screen(`blend-slov-ocean-a${String(a).replace(".", "")}`, blendRgb(slovenska, ocean, a));
  }
  console.log("== C. Blend basgo × ocean (đối chứng) ==");
  for (const a of [0.25, 0.5, 0.75]) {
    screen(`blend-basgo-ocean-a${String(a).replace(".", "")}`, blendRgb(basgo, ocean, a));
  }
  console.log("== D. Chroma-scale ocean (giữ Y, scale Cb/Cr) ==");
  for (const s of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
    screen(`ocean-chroma-s${String(s).replace(".", "")}`, chromaScale(ocean, s));
  }
  console.log("== E. Synth gradient + sinus chroma ==");
  for (const [amp, lambda] of [[10, 8], [15, 8], [20, 8], [30, 8], [40, 8], [80, 8], [20, 16], [40, 16]]) {
    screen(`synth-amp${amp}-lam${lambda}`, synthGradientChroma(1280, 720, amp, lambda));
  }
  console.log("== F. Chroma-scale test-pattern (giữ Y, scale Cb/Cr — test unmask clamp ngược) ==");
  for (const s of [0.5, 0.7, 0.9]) {
    screen(`tp-chroma-s${String(s).replace(".", "")}`, chromaScale(tp, s));
  }

  const cands = [];
  for (const fr of out.frames) {
    const m = fr.label.match(/^blend-(\w+)-ocean-a(\d+)$/);
    if (!m) continue;
    const [, cha, aDigits] = m;
    const alpha = Number(`0.${aDigits}`);
    const chaSrc = cha === "tp" ? "test-pattern" : cha === "slov" ? "slovenska" : "basgo";
    for (const row of fr.rows) {
      if (!(row.d0stdR > Q4_D0_MIN && row.d0stdR <= GAP_HI)) continue;
      const r1 = parentResid[`${chaSrc}|${row.rect}`];
      const r2 = parentResid[`ocean|${row.rect}`];
      const residEst = (r1 !== undefined && r2 !== undefined) ? +((1 - alpha) * r1 + alpha * r2).toFixed(2) : null;
      const ratioEst = residEst ? +(row.d0stdR / residEst).toFixed(2) : null;
      cands.push({
        frame: fr.label, rect: row.rect, d0stdR: row.d0stdR,
        residStdR_est: residEst, ratioR_est: ratioEst,
        q4_est: ratioEst !== null && ratioEst <= 1.0,
        note: "residStd_R là ƯỚC LƯỢNG nội suy tuyến tính từ cha — cần capture để đo thật",
      });
    }
  }
  out.q4Candidates = cands;
  flush();
  console.log(`\nỨng viên Q4 (d0std_R ∈ (2,0; 3,27], kèm ước lượng ratio_R): ${cands.length}`);
  for (const c of cands) console.log(`  ${c.q4_est ? "Q4? " : "    "}${c.frame} ${c.rect} d0std_R=${c.d0stdR} residStd_R~${c.residStdR_est} ratio_R~${c.ratioR_est}`);
  console.log(`\nJSON sàng lọc Q4: ${OUT}`);
}
main().catch((e) => { console.error(`H4-Q4-SCREEN LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
