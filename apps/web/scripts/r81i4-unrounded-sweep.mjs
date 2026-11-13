#!/usr/bin/env node
/**
 * r81i4-unrounded-sweep.mjs — Phase 9 đợt 81, luồng I4: TÍNH LẠI TOÀN BỘ
 * 77 case (73 G6 + 4 H4) bằng số học KHÔNG làm tròn (evalDelta0CaseRaw
 * trong delta0-harness.mjs — đường đo song song mới của đợt này) và chấm
 * lại 4 luật R0/G1/G2/G12 ở ngưỡng Δkurt 0,35.
 *
 * MỤC ĐÍCH (nợ H4 §5/§7): channelStats làm tròn kurt 2 chữ số → sai số
 * lượng tử hoá ±0,01, đúng bằng bước ngưỡng. H4 chỉ tính không-làm-tròn
 * cho 13 case sát ngưỡng và tìm được 1 case phân biệt G1/G2
 * (F7-sweep-w2240-testpattern-n10 fullD0 maxKurt 0,3508, biên 0,0008).
 * Script này tính không-làm-tròn cho CẢ 77 case để trả lời dứt khoát:
 * G1 vs G2 có phân biệt được thật không, và có case nào khác lật không
 * (kể cả qua stdRatio/corrDiff/cổng gate — những kênh mà H4 chưa quét
 * hết). Số làm tròn lấy từ 5 JSON recheck/sweep cũ để đối chiếu.
 *
 * LOADER: gộp logic nạp snapshot của r79g6-e6-recheck.mjs (Y2/B1/C1/D2
 * + build frame gradient1920 verbatim), r79g6-e6-newcases-recheck.mjs,
 * r79g6-f7-recheck.mjs, r79g6-sweep.mjs, r80h4-sweep.mjs — KHÔNG sửa
 * các script đó. Gradient build lại phải byte-identical với file D2
 * (kiểm chứng trong script, như e6-recheck).
 *
 * GHI TĂNG DẦN + RESUME: JSON ra được ghi sau mỗi case (VM đông, tránh
 * mất kết quả nếu bị kill); chạy lại sẽ bỏ qua case đã có.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r81i4-unrounded-sweep.mjs
 * JSON: hidden_files/round81-i4/r81i4-unrounded-sweep.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa hàm làm tròn trong delta0-harness.mjs
 * (chỉ dùng thêm hàm *Raw mới của đợt này).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs"; // M5 (đợt 85): ghi JSON qua helper retry EPERM + verify đủ byte (nối nốt nợ L6 §5).
import os from "node:os";
import path from "node:path";
import { resampleYuv420p } from "./chrome-resample.mjs";
import {
  evalDelta0CaseRaw, scoreRule, b64ToRgb,
  rgbToYuv709_70x6, yuv709ToRgb_70x6, estimateNativeChroma_70x6,
} from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const B1 = path.join(GOAL, "round74-b1");
const C1 = path.join(GOAL, "round75-c1");
const D2 = path.join(GOAL, "round76-d2");
const E6 = path.join(GOAL, "round77-e6");
const F7 = path.join(GOAL, "round78-f7");
const G6 = path.join(GOAL, "round79-g6");
const H4 = path.join(GOAL, "round80-h4");
const I4 = path.join(GOAL, "round81-i4");
fs.mkdirSync(I4, { recursive: true });
// Chia tải: R81I4_ONLY (regex tên case, vd "^(G6|H4)") + R81I4_OUT (file
// JSON riêng) để chạy 2 instance song song trên 2 nhóm case rời nhau,
// rồi gộp bằng r81i4-merge-sweep.mjs. Không đặt 2 env này = chạy đủ 77 case.
const OUT = process.env.R81I4_OUT || path.join(I4, "r81i4-unrounded-sweep.json");
const ONLY = process.env.R81I4_ONLY ? new RegExp(process.env.R81I4_ONLY) : null;
const PREVIEW_SEED_LOCALT1 = (0x9e3779b9 ^ 30) >>> 0;

// ---------- build frame gradient1920 (copy VERBATIM r79g6-e6-recheck.mjs) ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussianGenerator(rnd) {
  let spare = null;
  return () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0;
    while (u === 0) u = rnd();
    const v = rnd();
    const m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
}
function addYuvNoiseRgb24(rgb, w, h, strength, seed) {
  const sigma = strength / Math.sqrt(3);
  const gauss = gaussianGenerator(mulberry32(seed));
  const cw = (w + 1) >> 1, ch = (h + 1) >> 1;
  const Y = new Float64Array(w * h), CB = new Float64Array(w * h), CR = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 3;
    const [yy, cb, cr] = rgbToYuv709_70x6(rgb[p], rgb[p + 1], rgb[p + 2]);
    Y[i] = yy; CB[i] = cb; CR[i] = cr;
  }
  const estCb = new Float64Array(cw * ch), estCr = new Float64Array(cw * ch);
  const cbNoise = new Float64Array(cw * ch), crNoise = new Float64Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let sCb = 0, sCr = 0, n = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = cx * 2 + dx, y = cy * 2 + dy;
      if (x >= w || y >= h) continue;
      const i = y * w + x;
      sCb += CB[i]; sCr += CR[i]; n++;
    }
    const i = cy * cw + cx;
    estCb[i] = estimateNativeChroma_70x6(sCb / n, 1.04);
    estCr[i] = estimateNativeChroma_70x6(sCr / n, 1.12);
    cbNoise[i] = gauss() * sigma;
    crNoise[i] = gauss() * sigma;
  }
  const out = Buffer.alloc(w * h * 3);
  const clamp255 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = (y >> 1) * cw + (x >> 1), p = i * 3;
    const ny = Math.min(255, Math.max(0, Y[i] + gauss() * sigma));
    const ncb = Math.min(255, Math.max(0, estCb[ci] + cbNoise[ci]));
    const ncr = Math.min(255, Math.max(0, estCr[ci] + crNoise[ci]));
    const [r, g, b] = yuv709ToRgb_70x6(ny, ncb, ncr);
    out[p] = clamp255(r); out[p + 1] = clamp255(g); out[p + 2] = clamp255(b);
  }
  return out;
}

// ---------- bảng case F7 (26) + G6 (20) — copy từ script gốc ----------
const F7_CASES = [
  ["F7-post-fix-w1440-basgo-n05", "headed-w1440x900-basgo-r2", "r78f7-snaps-w1440x900.json", "basgo", "noise05"],
  ["F7-post-fix-w1440-basgo-n10", "headed-w1440x900-basgo-r2", "r78f7-snaps-w1440x900.json", "basgo", "noise10"],
  ["F7-post-fix-w1440-slovenska-n05", "headed-w1440x900-slovenska-r2", "r78f7-snaps-w1440x900.json", "slovenska", "noise05"],
  ["F7-post-fix-w1440-slovenska-n10", "headed-w1440x900-slovenska-r2", "r78f7-snaps-w1440x900.json", "slovenska", "noise10"],
  ["F7-post-fix-w1920-basgo-n05", "headed-w1920x1080-basgo-slovenska", "r78f7-snaps-w1920x1080.json", "basgo", "noise05"],
  ["F7-post-fix-w1920-basgo-n10", "headed-w1920x1080-basgo-slovenska", "r78f7-snaps-w1920x1080.json", "basgo", "noise10"],
  ["F7-post-fix-w1920-slovenska-n05", "headed-w1920x1080-slovenska-r2", "r78f7-snaps-w1920x1080.json", "slovenska", "noise05"],
  ["F7-post-fix-w1920-slovenska-n10", "headed-w1920x1080-slovenska-r2", "r78f7-snaps-w1920x1080.json", "slovenska", "noise10"],
  ["F7-post-fix-w1600-ocean-n05", "headed-w1600x900-ocean-r2", "r78f7-snaps-w1600x900.json", "ocean", "noise05"],
  ["F7-post-fix-w1600-ocean-n10", "headed-w1600x900-ocean-r2", "r78f7-snaps-w1600x900.json", "ocean", "noise10"],
  ["F7-post-fix-w1760-ocean-n05", "headed-w1760x1000-ocean", "r78f7-snaps-w1760x1000.json", "ocean", "noise05"],
  ["F7-post-fix-w1760-ocean-n10", "headed-w1760x1000-ocean", "r78f7-snaps-w1760x1000.json", "ocean", "noise10"],
  ["F7-post-fix-w2240-ocean-n05", "headed-w2240x1260-ocean-r2", "r78f7-snaps-w2240x1260.json", "ocean", "noise05"],
  ["F7-post-fix-w2240-ocean-n10", "headed-w2240x1260-ocean-r2", "r78f7-snaps-w2240x1260.json", "ocean", "noise10"],
  ["F7-post-fix-w2880-ocean-n05", "headed-w2880x1620-ocean", "r78f7-snaps-w2880x1620.json", "ocean", "noise05"],
  ["F7-post-fix-w2880-ocean-n10", "headed-w2880x1620-ocean", "r78f7-snaps-w2880x1620.json", "ocean", "noise10"],
  ["F7-sweep-w1280-testpattern-n05", "headed-w1280x800-testpattern", "r78f7-snaps-w1280x800.json", "test-pattern", "noise05"],
  ["F7-sweep-w1280-testpattern-n10", "headed-w1280x800-testpattern", "r78f7-snaps-w1280x800.json", "test-pattern", "noise10"],
  ["F7-sweep-w1760-testpattern-n05", "headed-w1760x1000-testpattern", "r78f7-snaps-w1760x1000.json", "test-pattern", "noise05"],
  ["F7-sweep-w1760-testpattern-n10", "headed-w1760x1000-testpattern", "r78f7-snaps-w1760x1000.json", "test-pattern", "noise10"],
  ["F7-sweep-w2240-testpattern-n05", "headed-w2240x1260-testpattern", "r78f7-snaps-w2240x1260.json", "test-pattern", "noise05"],
  ["F7-sweep-w2240-testpattern-n10", "headed-w2240x1260-testpattern", "r78f7-snaps-w2240x1260.json", "test-pattern", "noise10"],
  ["F7-sweep-w2560-testpattern-n05", "headed-w2560x1440-testpattern", "r78f7-snaps-w2560x1440.json", "test-pattern", "noise05"],
  ["F7-sweep-w2560-testpattern-n10", "headed-w2560x1440-testpattern", "r78f7-snaps-w2560x1440.json", "test-pattern", "noise10"],
  ["F7-sweep-w2880-testpattern-n05", "headed-w2880x1620-testpattern-r2", "r78f7-snaps-w2880x1620.json", "test-pattern", "noise05"],
  ["F7-sweep-w2880-testpattern-n10", "headed-w2880x1620-testpattern-r2", "r78f7-snaps-w2880x1620.json", "test-pattern", "noise10"],
];
const G6_CASES = [
  ["G6-sweep-w2048-testpattern-n05", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise05"],
  ["G6-sweep-w2048-testpattern-n07", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise07"],
  ["G6-sweep-w2048-testpattern-n08", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise08"],
  ["G6-sweep-w2048-testpattern-n10", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise10"],
  ["G6-sweep-w2400-testpattern-n05", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise05"],
  ["G6-sweep-w2400-testpattern-n07", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise07"],
  ["G6-sweep-w2400-testpattern-n08", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise08"],
  ["G6-sweep-w2400-testpattern-n10", "headed-w2400x1350", "r79g6-snaps-w2400x1350.json", "test-pattern", "noise10"],
  ["G6-sweep-w2720-testpattern-n05", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise05"],
  ["G6-sweep-w2720-testpattern-n07", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise07"],
  ["G6-sweep-w2720-testpattern-n08", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise08"],
  ["G6-sweep-w2720-testpattern-n10", "headed-w2720x1530", "r79g6-snaps-w2720x1530.json", "test-pattern", "noise10"],
  ["G6-sweep-w2880-testpattern-n07", "headed-w2880x1620-testpattern", "r79g6-snaps-w2880x1620.json", "test-pattern", "noise07"],
  ["G6-sweep-w2880-testpattern-n08", "headed-w2880x1620-testpattern", "r79g6-snaps-w2880x1620.json", "test-pattern", "noise08"],
  ["G6-sweep-w2240-basgo-n05", "headed-w2240x1260", "r79g6-snaps-w2240x1260.json", "basgo", "noise05"],
  ["G6-sweep-w2240-basgo-n10", "headed-w2240x1260", "r79g6-snaps-w2240x1260.json", "basgo", "noise10"],
  ["G6-sweep-w2560-basgo-n05", "headed-w2560x1440", "r79g6-snaps-w2560x1440.json", "basgo", "noise05"],
  ["G6-sweep-w2560-basgo-n10", "headed-w2560x1440", "r79g6-snaps-w2560x1440.json", "basgo", "noise10"],
  ["G6-sweep-w2880-basgo-n05", "headed-w2880x1620", "r79g6-snaps-w2880x1620.json", "basgo", "noise05"],
  ["G6-sweep-w2880-basgo-n10", "headed-w2880x1620", "r79g6-snaps-w2880x1620.json", "basgo", "noise10"],
];

const RENDER = {
  ocean: { plain: "fullrgb-ocean-plain.raw", noise05: "fullrgb-ocean-noise05.raw", noise10: "fullrgb-ocean-noise10.raw", dir: RENDER_NEW },
  basgo: { plain: "fullrgb-basgo-plain.raw", noise05: "fullrgb-basgo-noise05.raw", noise10: "fullrgb-basgo-noise10.raw", dir: RENDER_NEW },
  slovenska: { plain: "fullrgb-slovenska-plain.raw", noise05: "fullrgb-slovenska-noise05.raw", noise10: "fullrgb-slovenska-noise10.raw", dir: RENDER_NEW },
  "test-pattern": {
    plain: "fullrgb-plain.raw", noise05: "fullrgb-noise05.raw", noise10: "fullrgb-noise10.raw", dir: R66T3,
    noise07: "fullrgb-noise07.raw", noise08: "fullrgb-noise08.raw", dir78: path.join(G6, "render"),
  },
};

// ---------- nạp số làm tròn + số không-làm-tròn H4 để đối chiếu ----------
function loadRounded() {
  const map = new Map();
  const files = [
    path.join(G6, "r79g6-e6-recheck.json"),
    path.join(G6, "r79g6-e6-newcases-recheck.json"),
    path.join(G6, "r79g6-f7-recheck.json"),
    path.join(G6, "r79g6-sweep.json"),
    path.join(H4, "r80h4-sweep.json"),
    path.join(H4, "r80h4-sweep-blend-tp-slov-a85.json"),
  ];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const c of j.cases || []) map.set(c.name, c);
  }
  return map;
}
function loadH4Unrounded() {
  const map = new Map();
  for (const f of ["r80h4-threshold-unrounded.json", "r80h4-threshold-unrounded-034.json", "r80h4-threshold-unrounded-034b.json", "r80h4-threshold-unrounded-034c.json"]) {
    const j = JSON.parse(fs.readFileSync(path.join(H4, f), "utf8"));
    for (const r of j.results || []) map.set(r.name, r);
  }
  return map;
}

const r4 = (x) => +x.toFixed(4);

async function main() {
  const roundedByName = loadRounded();
  const h4ByName = loadH4Unrounded();
  console.log(`đối chiếu: ${roundedByName.size} case làm tròn, ${h4ByName.size} case không-làm-tròn H4`);

  // ---- build frame gradient1920 (kiểm chứng byte-identical với D2) ----
  const natYuv = fs.readFileSync(path.join(D2, "native-grad1920", "grad1920-f30-1920.yuv"));
  const gPlain = resampleYuv420p(natYuv, 1920, 1080, 1280, 720);
  const gNoise = addYuvNoiseRgb24(gPlain, 1280, 720, 28, PREVIEW_SEED_LOCALT1);
  const gPlainRef = fs.readFileSync(path.join(D2, "fullrgb-gradient1920-plain.raw"));
  const gNoiseRef = fs.readFileSync(path.join(D2, "fullrgb-gradient1920-noise05.raw"));
  const gradFramesIdentical = gPlain.equals(gPlainRef) && gNoise.equals(gNoiseRef);
  console.log(`gradient1920 build lại: byte-identical với D2: ${gradFramesIdentical}`);
  if (!gradFramesIdentical) { console.log("DỪNG: frame gradient build lại không khớp D2"); process.exitCode = 2; return; }

  // ---- thu thập đầu vào từng case: {name, regime, prevPlain, prevNoise, plain1280, noise1280, vw, vh} ----
  const inputs = [];
  const loadDoc = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  // Y2: 12 case (2 cửa sổ × 4 nguồn; basgo/slovenska chỉ noise05).
  const Y2SRC = {
    "test-pattern": { renderDir: R66T3, prefix: "" },
    ocean: { renderDir: RENDER_NEW, prefix: "ocean-" },
    basgo: { renderDir: RENDER_NEW, prefix: "basgo-" },
    slovenska: { renderDir: RENDER_NEW, prefix: "slovenska-" },
  };
  for (const w of ["w1440", "w1920"]) {
    const doc = loadDoc(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`));
    for (const [src, cfg] of Object.entries(Y2SRC)) {
      for (const lv of ["noise05", "noise10"]) {
        const v = doc.snaps?.[src];
        if (!v?.plain || !v?.[lv]) continue;
        if (src !== "test-pattern" && src !== "ocean" && lv === "noise10") continue;
        const plain1280 = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}plain.raw`));
        const noise1280 = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}${lv}.raw`));
        const regime = src === "test-pattern" ? "post-fix-valid (media 1280)" : "pre-fix (media 1920)";
        const it = {
          name: `Y2-${w}-${src}-${lv}`, regime, source: src, noiseLevel: lv,
          prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
          plain1280, noise1280, vw: v.plain.w, vh: v.plain.h,
        };
        inputs.push(it);
      }
    }
  }
  // B1: quét thư mục (8 case ocean pre-fix).
  for (const dir of fs.readdirSync(B1).filter((d) => d.startsWith("headed-")).sort()) {
    for (const f of fs.readdirSync(path.join(B1, dir)).filter((x) => x.startsWith("r74b1-snaps-"))) {
      const doc = loadDoc(path.join(B1, dir, f));
      const v = doc.snaps?.ocean;
      if (!v?.plain || !v?.noise05) continue;
      inputs.push({
        name: `B1-${doc.window}-ocean-n05`, regime: "pre-fix (media 1920)", source: "ocean", noiseLevel: "noise05",
        prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v.noise05.rgbB64),
        plain1280: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw")),
        noise1280: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw")),
        vw: v.plain.w, vh: v.plain.h,
      });
    }
  }
  // C1 post-fix w1440.
  {
    const doc = loadDoc(path.join(C1, "headed-w1440x900", "r74b1-snaps-w1440x900.json"));
    const v = doc.snaps?.ocean;
    inputs.push({
      name: "C1-post-fix-w1440-ocean-n05", regime: "POST-FIX (C1)", source: "ocean", noiseLevel: "noise05",
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v.noise05.rgbB64),
      plain1280: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw")),
      noise1280: fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw")),
      vw: v.plain.w, vh: v.plain.h,
    });
  }
  // D2 post-fix mới: ocean w1920/w2560 + gradient1920 w1440.
  const oceanPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const oceanNoise05 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
  for (const [name, snapPath] of [
    ["D2-post-fix-w1920-ocean-n05", path.join(D2, "headed-w1920x1080-ocean", "r74b1-snaps-w1920x1080.json")],
    ["D2-post-fix-w2560-ocean-n05", path.join(D2, "headed-w2560x1440-ocean", "r74b1-snaps-w2560x1440.json")],
  ]) {
    const doc = loadDoc(snapPath);
    const v = doc.snaps?.ocean;
    inputs.push({
      name, regime: "POST-FIX (D2)", source: "ocean", noiseLevel: "noise05",
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v.noise05.rgbB64),
      plain1280: oceanPlain, noise1280: oceanNoise05, vw: v.plain.w, vh: v.plain.h,
    });
  }
  {
    const gdoc = loadDoc(path.join(D2, "headed-w1440x900-grad1920", "r74b1-snaps-w1440x900.json"));
    const gv = gdoc.snaps?.gradient1920;
    inputs.push({
      name: "D2-post-fix-w1440-grad1920-n05", regime: "POST-FIX (D2)", source: "gradient1920", noiseLevel: "noise05",
      prevPlain: b64ToRgb(gv.plain.rgbB64), prevNoise: b64ToRgb(gv.noise05.rgbB64),
      plain1280: gPlain, noise1280: gNoise, vw: gv.plain.w, vh: gv.plain.h,
    });
  }
  // E6 case mới (3 ocean post-fix).
  for (const [name, snapPath, lv] of [
    ["E6-post-fix-w1440-ocean-n10", path.join(E6, "headed-w1440x900-ocean-n10", "r74b1-snaps-w1440x900.json"), "noise10"],
    ["E6-post-fix-w1920-ocean-n10", path.join(E6, "headed-w1920x1080-ocean-n10", "r74b1-snaps-w1920x1080.json"), "noise10"],
    ["E6-post-fix-w1280-ocean-n05", path.join(E6, "headed-w1280x800-ocean", "r74b1-snaps-w1280x800.json"), "noise05"],
  ]) {
    const doc = loadDoc(snapPath);
    const v = doc.snaps?.ocean;
    inputs.push({
      name, regime: "POST-FIX (E6)", source: "ocean", noiseLevel: lv,
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
      plain1280: oceanPlain, noise1280: lv === "noise10"
        ? fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise10.raw")) : oceanNoise05,
      vw: v.plain.w, vh: v.plain.h,
    });
  }
  // F7 (26) + G6 (20): bảng [tên, thư mục, file, nguồn, mức noise].
  const tableCases = (list, base, regime) => {
    const docs = new Map();
    for (const [name, dir, file, src, lv] of list) {
      const key = `${dir}/${file}`;
      if (!docs.has(key)) docs.set(key, loadDoc(path.join(base, dir, file)));
      const doc = docs.get(key);
      const v = doc.snaps?.[src];
      if (!v?.plain || !v?.[lv]) { console.log(`  bỏ ${name}: thiếu ${src} plain/${lv}`); continue; }
      const cfg = RENDER[src];
      const noiseDir = cfg[lv] && cfg.dir78 && (lv === "noise07" || lv === "noise08") ? cfg.dir78 : cfg.dir;
      inputs.push({
        name, regime, source: src, noiseLevel: lv,
        prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
        plain1280: fs.readFileSync(path.join(cfg.dir, cfg.plain)),
        noise1280: fs.readFileSync(path.join(noiseDir, cfg[lv])),
        vw: v.plain.w, vh: v.plain.h,
      });
    }
  };
  tableCases(F7_CASES, F7, "POST-FIX mới (F7, code C1)");
  tableCases(G6_CASES, G6, "sweep mới (G6)");
  // H4 blend (4): a65 + a85, n05/n10, rect 1769x995.
  {
    const doc = loadDoc(path.join(H4, "headed-w2880x1620", "r80h4-snaps-w2880x1620.json"));
    for (const blend of ["blend-slov-ocean-a65", "blend-tp-slov-a85"]) {
      const v = doc.snaps?.[blend];
      if (!v?.plain || !v?.noise05 || !v?.noise10) { console.log(`  bỏ ${blend}: thiếu snapshot`); continue; }
      for (const lv of ["noise05", "noise10"]) {
        inputs.push({
          name: `H4-q4-w2880-${blend}-${lv === "noise05" ? "n05" : "n10"}`, regime: "Q4 hunt (blend tổng hợp, post-fix C1)",
          source: blend, noiseLevel: lv,
          prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
          plain1280: fs.readFileSync(path.join(H4, "render", `${blend}-plain.raw`)),
          noise1280: fs.readFileSync(path.join(H4, "render", `${blend}-${lv}.raw`)),
          vw: v.plain.w, vh: v.plain.h,
        });
      }
    }
  }
  console.log(`thu thập được ${inputs.length} case (kỳ vọng 77)`);
  const names = new Set(inputs.map((c) => c.name));
  const missingRounded = [...roundedByName.keys()].filter((n) => !names.has(n));
  const extraInputs = inputs.filter((c) => !roundedByName.has(c.name)).map((c) => c.name);
  if (missingRounded.length) console.log(`  CẢNH BÁO: thiếu trong inputs so với JSON làm tròn: ${missingRounded.join(", ")}`);
  if (extraInputs.length) console.log(`  CẢNH BÁO: inputs thừa so với JSON làm tròn: ${extraInputs.join(", ")}`);

  // ---- resume: giữ case đã tính ----
  let out = { generated: new Date().toISOString(), harness: "delta0-harness.mjs *Raw (không làm tròn) + chrome-resample HIỆN TẠI (C2 M4 + BC upscale F6)", kurtThreshold: 0.35, gradFramesIdentical, cases: [], crossChecks: [], scores: null };
  if (fs.existsSync(OUT)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
      if (Array.isArray(prev.cases) && prev.cases.length) { out = prev; console.log(`resume: giữ ${prev.cases.length} case đã tính`); }
    } catch { console.log("resume: không đọc được JSON cũ, bắt đầu mới"); }
  }
  const done = new Set(out.cases.map((c) => c.name));
  const flush = () => writeFileEpermRetry(OUT, JSON.stringify(out, null, 2), { label: "r81i4-unrounded-sweep-sweep" });

  // ---- tính từng case bằng số không-làm-tròn ----
  const todo = ONLY ? inputs.filter((it) => ONLY.test(it.name)) : inputs;
  if (ONLY) console.log(`lọc R81I4_ONLY=${ONLY}: ${todo.length}/${inputs.length} case`);
  for (const it of todo) {
    if (done.has(it.name)) continue;
    const t0 = Date.now();
    const c = evalDelta0CaseRaw({
      name: it.name, regime: it.regime, prevPlain: it.prevPlain, prevNoise: it.prevNoise,
      plain1280: it.plain1280, noise1280: it.noise1280, vw: it.vw, vh: it.vh,
    });
    c.source = it.source; c.noiseLevel = it.noiseLevel;
    // Đối chiếu với số làm tròn (plainMad ±0,001; gates phải giống).
    const rnd = roundedByName.get(it.name);
    const checks = {};
    if (rnd) {
      checks.plainMadDiff = +(c.plainMad - rnd.plainMad).toFixed(4);
      checks.gatesMatch = JSON.stringify(c.gates) === JSON.stringify(rnd.gates);
      checks.correctMatch = c.correct === rnd.correct;
      checks.verdictNoD0Match = c.verdictNoD0 === rnd.verdictNoD0;
      checks.verdictFullD0Match = c.verdictFullD0 === rnd.verdictFullD0;
      // Đối chiếu maxKurt không-làm-tròn với H4 (nếu có).
      const h4 = h4ByName.get(it.name);
      if (h4) {
        checks.h4MaxKurtNoD0 = { h4: h4.noD0.maxKurtRaw, i4: r4(Math.max(...c.kurtDiffNoD0)) };
        checks.h4MaxKurtFullD0 = { h4: h4.fullD0.maxKurtRaw, i4: r4(Math.max(...c.kurtDiffFullD0)) };
        checks.h4Match = Math.abs(h4.noD0.maxKurtRaw - Math.max(...c.kurtDiffNoD0)) <= 0.0001
          && Math.abs(h4.fullD0.maxKurtRaw - Math.max(...c.kurtDiffFullD0)) <= 0.0001;
      }
    }
    c.crossCheck = checks;
    out.cases.push(c);
    out.crossChecks.push({ name: it.name, ...checks });
    flush();
    const maxKNo = r4(Math.max(...c.kurtDiffNoD0)), maxKFu = r4(Math.max(...c.kurtDiffFullD0));
    console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${it.name} ${c.rect} maxKurt raw noD0=${maxKNo} fullD0=${maxKFu} | ${c.verdictNoD0}/${c.verdictFullD0} correct=${c.correct} | gates R0=${c.gates.R0_cu} G1=${c.gates.G1_d0stdR_le_2} G2=${c.gates.G2_ratioR_le_1} G12=${c.gates.G12_ca_hai} | check plainMadΔ=${checks.plainMadDiff} gatesMatch=${checks.gatesMatch} correctMatch=${checks.correctMatch}${checks.h4Match !== undefined ? ` h4Match=${checks.h4Match}` : ""}`);
  }

  // ---- chấm luật (số không-làm-tròn) + so với số làm tròn ----
  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(out.cases, rule);
    const rndScore = (() => {
      const all = [...roundedByName.values()];
      return scoreRule(all, rule);
    })();
    console.log(`${rule} RAW: đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored}) | ROUNDED: ${rndScore.ok}/${rndScore.total}${scores[rule].badList.length ? " | SAI RAW: " + scores[rule].badList.join("; ") : ""}`);
  }
  // Phân biệt verdict giữa các luật (số không-làm-tròn).
  const disc = { g1g2: [], g2g12: [], g1g12: [] };
  for (const c of out.cases) {
    if (c.correct === "cả-hai-LỆCH") continue;
    if (c.verdictUnder.G1_d0stdR_le_2 !== c.verdictUnder.G2_ratioR_le_1) disc.g1g2.push(c.name);
    if (c.verdictUnder.G2_ratioR_le_1 !== c.verdictUnder.G12_ca_hai) disc.g2g12.push(c.name);
    if (c.verdictUnder.G1_d0stdR_le_2 !== c.verdictUnder.G12_ca_hai) disc.g1g12.push(c.name);
  }
  console.log(`\nPHÂN BIỆT VERDICT (raw, case chấm được): G1 vs G2 = ${disc.g1g2.length} ${JSON.stringify(disc.g1g2)} | G2 vs G12 = ${disc.g2g12.length} ${JSON.stringify(disc.g2g12)} | G1 vs G12 = ${disc.g1g12.length} ${JSON.stringify(disc.g1g12)}`);
  const gateDisagree = out.cases.filter((c) => c.gates.G1_d0stdR_le_2 !== c.gates.G2_ratioR_le_1).length;
  console.log(`bất đồng cổng G1/G2: ${gateDisagree}/${out.cases.length} case`);
  out.scores = scores;
  out.discriminating = disc;
  out.gateDisagreeCount = gateDisagree;
  out.totalCases = out.cases.length;
  flush();
  console.log(`\nJSON không-làm-tròn: ${OUT} (${out.cases.length} case)`);
  const badChecks = out.crossChecks.filter((x) => x.plainMadDiff === undefined || Math.abs(x.plainMadDiff) > 0.001 || x.gatesMatch === false || x.h4Match === false);
  if (badChecks.length) { console.log(`CẢNH BÁO cross-check: ${badChecks.length} case lệch loader/H4: ${JSON.stringify(badChecks)}`); process.exitCode = 1; }
  else console.log("KẾT QUẢ: loader tái lập đúng số làm tròn (plainMad ±0,001, gates khớp) + khớp H4 ở mọi case đối chiếu được");
}
main().catch((e) => { console.error(`I4-UNROUNDED-SWEEP LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
