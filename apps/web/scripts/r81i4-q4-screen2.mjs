#!/usr/bin/env node
/**
 * r81i4-q4-screen2.mjs — Phase 9 đợt 81, luồng I4: SÀNG LỌC TÍNH TOÁN v2
 * (không capture) săn góc Q4 (d0std_R > 2 nhưng ratio_R <= 1) để phân
 * biệt G2 vs G12 — tiếp nối H4 (23 frame + 4 capture, thất bại ở phía
 * resid: blend làm sụp residStd_R dưới cả hai cha).
 *
 * HƯỚNG MỚI ĐỢT NÀY (khác H4):
 *  G. Chroma-scale slovenska s ∈ {1,5..12}: slovenska có residStd_R
 *     lớn nhất tập hiện tại (2,58–2,95) nhưng d0std_R chỉ 0,16–0,21
 *     (chroma nghèo). Scale chroma (giữ Y) tăng d0std_R theo biên độ
 *     chroma trong khi resid — chủ yếu do chi tiết luma — kỳ vọng giữ
 *     nguyên. Nếu d0std_R vượt 2,0 ở s nào đó mà resid không sụp → Q4.
 *     Ghi kèm tỉ lệ pixel chạm clamp [16,240] / ray RGB (độ thực tế).
 *  H. Blend tp×slov lưới α mịn {0,86; 0,875; 0,88; 0,89}: nối a085
 *     (d0 2,47) → a09 (d0 1,64); tìm α mà d0std_R ≈ 2,0–2,2 ở rect NHỎ
 *     (311×175) nơi resid cha cao nhất (tp 4,46).
 *  I. Blend slov×ocean lưới α mịn {0,65; 0,68; 0,70; 0,72}: nối a0625
 *     (d0 1,96–2,05) → a075 (d0 2,33–2,44).
 *  J. Chroma-scale ocean s ∈ {0,9; 1,0; 1,2} (nối họ D H4: s08 d0 2,57)
 *     + chroma-scale test-pattern s ∈ {1,5; 2,0} (H4 chỉ thử cắt 0,5–0,9;
 *     tp đã bão hoà nên scale lên có thể không tăng d0 — kiểm chứng).
 *  K. Synth gradient + sinus chroma (họ E H4, chưa xong): amp ∈ {40; 60; 80},
 *     λ ∈ {8; 16} — thăm dò, không phải ứng viên hứa hẹn.
 *
 * d0std_R chỉ phụ thuộc frame render plain 1280x720 + rect nên sàng
 * được thuần túy từ frame. residStd_R chỉ có sau capture — màn này CHỈ
 * sàng d0std_R, KHÔNG ước lượng resid bằng nội suy tuyến tính nữa (H4
 * đã chứng minh nội suy resid sai gấp đôi — xem LIMITS H4 §1.2).
 * Mọi frame có d0std_R ∈ (2,0; 3,27] được liệt kê làm ứng viên cần
 * capture để đo resid thật.
 *
 * Cửa sổ: 7 rect đã biết. JSON (ghi tăng dần):
 * hidden_files/round81-i4/r81i4-q4-screen2.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { channelStatsRaw, estShiftFrame_70x6, rgbToYuv709_70x6, yuv709ToRgb_70x6 } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const I4 = path.join(GOAL, "round81-i4");
fs.mkdirSync(I4, { recursive: true });
const OUT = path.join(I4, "r81i4-q4-screen2.json");

const RECTS = [
  [311, 175, "w1280x800"], [489, 275, "w1440x900/w1600x900"], [667, 375, "w1760x1000"],
  [809, 455, "w1920x1080"], [1129, 635, "w2240x1260"], [1449, 815, "w2560x1440"], [1769, 995, "w2880x1620"],
];
const Q4_D0_MIN = 2.0, GAP_HI = 3.27;

function screenFrame(label, plain1280) {
  const shifted = estShiftFrame_70x6(plain1280, 1280, 720);
  const rows = [];
  for (const [vw, vh, win] of RECTS) {
    const a = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
    const b = resampleRgb24Trilinear(shifted, 1280, 720, vw, vh);
    const d0 = new Int16Array(vw * vh * 3);
    for (let i = 0; i < vw * vh * 3; i++) d0[i] = b[i] - a[i];
    const d0std = channelStatsRaw(Float64Array.from(d0)).std;
    rows.push({ rect: `${vw}x${vh}`, window: win, d0std: d0std.map((x) => +x.toFixed(4)), d0stdR: +d0std[0].toFixed(4) });
  }
  return { label, rows };
}

// Thống kê chroma gốc của frame (để hiểu headroom scale) + tỉ lệ chạm clamp.
function chromaStats(rgb) {
  const n = rgb.length / 3;
  let mCb = 0, mCr = 0, rail = 0, clampCb = 0, clampCr = 0;
  const cbs = [], crs = [];
  for (let i = 0; i < rgb.length; i += 3) {
    const [, cb, cr] = rgbToYuv709_70x6(rgb[i], rgb[i + 1], rgb[i + 2]);
    cbs.push(cb); crs.push(cr); mCb += cb; mCr += cr;
    if (rgb[i] <= 0 || rgb[i] >= 255 || rgb[i + 1] <= 0 || rgb[i + 1] >= 255 || rgb[i + 2] <= 0 || rgb[i + 2] >= 255) rail++;
  }
  mCb /= n; mCr /= n;
  const sd = (arr, m) => Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / n);
  return { meanCb: +mCb.toFixed(2), meanCr: +mCr.toFixed(2), stdCb: +sd(cbs, mCb).toFixed(2), stdCr: +sd(crs, mCr).toFixed(2), railFrac: +(rail / n).toFixed(4) };
}

function blendRgb(a, b, alpha) {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] * (1 - alpha) + b[i] * alpha);
  return out;
}

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
  const slovenska = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw"));
  for (const [n, f] of [["tp", tp], ["ocean", ocean], ["slovenska", slovenska]]) {
    if (f.length !== 1280 * 720 * 3) throw new Error(`${n}: frame sai kích thước ${f.length}`);
  }
  console.log("chroma gốc (YUV709):");
  for (const [n, f] of [["tp", tp], ["ocean", ocean], ["slovenska", slovenska]]) {
    console.log(`  ${n}: ${JSON.stringify(chromaStats(f))}`);
  }

  let out = { generated: new Date().toISOString(), q4D0Range: `(2,0; ${GAP_HI}]`, frames: [], q4Candidates: [] };
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
  const screen = (label, frame, extra = {}) => {
    if (doneLabels.has(label)) { console.log(`  bỏ qua ${label} (đã có)`); return null; }
    const t0 = Date.now();
    const r = screenFrame(label, frame);
    r.extra = extra;
    out.frames.push(r);
    flush();
    const inGap = r.rows.filter((row) => row.d0stdR > Q4_D0_MIN && row.d0stdR <= GAP_HI).map((row) => `${row.rect}:${row.d0stdR}`);
    console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${label}: d0std_R=[${r.rows.map((x) => x.d0stdR).join(", ")}]${inGap.length ? `  <-- TRONG KHOẢNG Q4 ở ${inGap.join(" ")}` : ""}${extra.clampFrac !== undefined ? ` clampFrac=${extra.clampFrac}` : ""}`);
    return r;
  };

  console.log("== G. Chroma-scale slovenska (HƯỚNG MỚI — resid cao sẵn 2,58–2,95) ==");
  for (const s of [1.5, 2, 3, 4, 6, 8, 10, 12]) {
    const { frame, clampFrac } = chromaScale(slovenska, s);
    screen(`slov-chroma-s${String(s).replace(".", "")}`, frame, { s, clampFrac });
  }
  console.log("== H. Blend tp×slov lưới α mịn (nối a085→a09) ==");
  for (const a of [0.86, 0.875, 0.88, 0.89]) {
    screen(`blend-tp-slov-a${String(a).replace("0.", "")}`, blendRgb(tp, slovenska, a));
  }
  console.log("== I. Blend slov×ocean lưới α mịn (nối a0625→a075) ==");
  for (const a of [0.65, 0.68, 0.7, 0.72]) {
    screen(`blend-slov-ocean-a${String(a).replace("0.", "")}`, blendRgb(slovenska, ocean, a));
  }
  console.log("== J. Chroma-scale ocean lên (nối họ D) + tp lên ==");
  for (const s of [0.9, 1.0, 1.2]) {
    const { frame, clampFrac } = chromaScale(ocean, s);
    screen(`ocean-chroma-s${String(s).replace(".", "")}`, frame, { s, clampFrac });
  }
  for (const s of [1.5, 2.0]) {
    const { frame, clampFrac } = chromaScale(tp, s);
    screen(`tp-chroma-s${String(s).replace(".", "")}`, frame, { s, clampFrac });
  }
  console.log("== K. Synth gradient + sinus chroma (họ E H4, chưa xong) ==");
  for (const [amp, lambda] of [[40, 8], [60, 8], [80, 8], [40, 16], [60, 16], [80, 16]]) {
    screen(`synth-amp${amp}-lam${lambda}`, synthGradientChroma(1280, 720, amp, lambda));
  }

  const cands = [];
  for (const fr of out.frames) {
    for (const row of fr.rows) {
      if (row.d0stdR > Q4_D0_MIN && row.d0stdR <= GAP_HI) {
        cands.push({ frame: fr.label, rect: row.rect, d0stdR: row.d0stdR, extra: fr.extra || {}, note: "d0std_R trong khoảng Q4 — cần capture để đo residStd_R thật (KHÔNG ước lượng nội suy)" });
      }
    }
  }
  out.q4Candidates = cands;
  flush();
  console.log(`\nỨng viên Q4 (d0std_R ∈ (2,0; 3,27] — cần capture đo resid thật): ${cands.length}`);
  for (const c of cands) console.log(`  ${c.frame} ${c.rect} d0std_R=${c.d0stdR}${c.extra.s !== undefined ? ` s=${c.extra.s} clampFrac=${c.extra.clampFrac}` : ""}`);
  console.log(`\nJSON sàng lọc Q4 v2: ${OUT}`);
}
main().catch((e) => { console.error(`I4-Q4-SCREEN2 LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
