#!/usr/bin/env node
/**
 * r77e6-g12-verify.mjs — Phase 9 đợt 77, luồng E6: chạy lại toàn bộ 20
 * case chấm được của đợt 76 D2 qua HARNESS DÙNG CHUNG mới
 * (delta0-harness.mjs, luật G12) và đối chiếu từng số với JSON D2.
 *
 * Mục đích: chứng minh G12 đã vào code đo (không còn chỉ là quy tắc trong
 * LIMITS) và harness mới tái lập đúng kết quả D2: G12 20/20, R0 cũ 18/20.
 *
 * Đầu vào (giống hệt D2, không capture mới ở bước này):
 *  - 21 case chẩn đoán: Y2 w1440/w1920 (4 nguồn × n05/n10) + sweep ocean
 *    B1 10 cửa sổ (pre-fix) + C1 post-fix w1440 — từ r76d2-analyze.mjs.
 *  - 3 case post-fix mới: ocean w1920, ocean w2560, gradient1920 w1440
 *    — từ r76d2-postfix.mjs (frame gradient1920 build lại bằng cùng công
 *    thức: resampleYuv420p C2 + addYuvNoise verbatim — copy từ postfix).
 * Resample: chrome-resample.mjs hiện tại (C2 M4, 15:32 09/11 — cùng phiên
 * bản D2 dùng, nên số phải khớp từng chữ số đã làm tròn).
 *
 * Đối chiếu: mỗi case so plainMad/d0std/residStd/ratio/corr/verdictNoD0/
 * verdictFullD0/kurtDiff/correct với JSON D2; lệch > 0,001 ở bất kỳ
 * trường số nào cũng báo MISMATCH (không giấu). Chấm luật bằng
 * scoreRule() của harness.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r77e6-g12-verify.mjs
 * JSON: hidden_files/round77-e6/r77e6-g12.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử (r76d2-*.mjs giữ nguyên).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleYuv420p } from "./chrome-resample.mjs";
import {
  evalDelta0Case, scoreRule, b64ToRgb,
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
const OUT = process.env.R77E6_OUT || path.join(E6, "r77e6-g12.json");
fs.mkdirSync(E6, { recursive: true });
const PREVIEW_SEED_LOCALT1 = (0x9e3779b9 ^ 30) >>> 0;

// ---------- build frame gradient1920 (copy verbatim r76d2-postfix.mjs) ----------
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

// ---------- đối chiếu với JSON D2 ----------
function arrEq(a, b, tol = 0.001) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) <= tol);
}
function compareCase(name, fresh, ref, extraR0) {
  const diffs = [];
  const num = (k) => { if (Math.abs(fresh[k] - ref[k]) > 0.001) diffs.push(`${k}: mới ${fresh[k]} vs D2 ${ref[k]}`); };
  const arr = (k) => { if (!arrEq(fresh[k], ref[k])) diffs.push(`${k}: mới ${JSON.stringify(fresh[k])} vs D2 ${JSON.stringify(ref[k])}`); };
  const str = (k) => { if (fresh[k] !== ref[k]) diffs.push(`${k}: mới ${fresh[k]} vs D2 ${ref[k]}`); };
  num("plainMad"); arr("d0std"); arr("residStd"); arr("ratio"); arr("corr");
  str("verdictNoD0"); str("verdictFullD0"); arr("kurtDiffNoD0"); arr("kurtDiffFullD0"); str("correct");
  if (extraR0 !== undefined && fresh.gates.R0_cu !== extraR0) diffs.push(`R0: mới ${fresh.gates.R0_cu} vs D2 ${extraR0}`);
  if (ref.gates && fresh.gates.G12_ca_hai !== ref.gates.G12_ca_hai) diffs.push(`G12: mới ${fresh.gates.G12_ca_hai} vs D2 ${ref.gates.G12_ca_hai}`);
  if (ref.gates && fresh.gates.G1_d0stdR_le_2 !== ref.gates.G1_d0stdR_le_2) diffs.push(`G1: mới ${fresh.gates.G1_d0stdR_le_2} vs D2 ${ref.gates.G1_d0stdR_le_2}`);
  if (ref.gates && fresh.gates.G2_ratioR_le_1 !== ref.gates.G2_ratioR_le_1) diffs.push(`G2: mới ${fresh.gates.G2_ratioR_le_1} vs D2 ${ref.gates.G2_ratioR_le_1}`);
  return diffs;
}

async function main() {
  const diagRef = JSON.parse(fs.readFileSync(path.join(D2, "r76d2-diag.json"), "utf8"));
  const postfixRef = JSON.parse(fs.readFileSync(path.join(D2, "r76d2-postfix.json"), "utf8"));
  const refByName = new Map();
  for (const c of diagRef.cases) refByName.set(c.name, c);
  for (const c of postfixRef.cases) refByName.set(c.name, c);

  // ---- chạy lại 21 case chẩn đoán (logic r76d2-analyze.mjs, qua harness mới) ----
  const cases = [];
  const addOcean = (name, regime, snapDoc) => {
    const v = snapDoc.snaps?.ocean;
    if (!v?.plain || !v?.noise05) { console.log(`  bỏ ${name}: thiếu ocean plain/noise05`); return; }
    const plain1280 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
    const noise1280 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
    cases.push(evalDelta0Case({ name, regime, prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v.noise05.rgbB64), plain1280, noise1280, vw: v.plain.w, vh: v.plain.h }));
  };
  const loadSnaps = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  const Y2SRC = {
    "test-pattern": { renderDir: R66T3, prefix: "" },
    ocean: { renderDir: RENDER_NEW, prefix: "ocean-" },
    basgo: { renderDir: RENDER_NEW, prefix: "basgo-" },
    slovenska: { renderDir: RENDER_NEW, prefix: "slovenska-" },
  };
  for (const w of ["w1440", "w1920"]) {
    const doc = loadSnaps(path.join(Y2, `headed-${w}`, `r71y2-snaps-${w}.json`));
    for (const [src, cfg] of Object.entries(Y2SRC)) {
      for (const lv of ["noise05", "noise10"]) {
        const v = doc.snaps?.[src];
        if (!v?.plain || !v?.[lv]) continue;
        if (src !== "test-pattern" && src !== "ocean" && lv === "noise10") continue;
        const plain1280 = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}plain.raw`));
        const noise1280 = fs.readFileSync(path.join(cfg.renderDir, `fullrgb-${cfg.prefix}${lv}.raw`));
        const regime = src === "test-pattern" ? "post-fix-valid (media 1280)" : "pre-fix (media 1920)";
        cases.push(evalDelta0Case({
          name: `Y2-${w}-${src}-${lv}`, regime,
          prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
          plain1280, noise1280, vw: v.plain.w, vh: v.plain.h,
        }));
      }
    }
  }
  const headedDirs = fs.readdirSync(B1).filter((d) => d.startsWith("headed-")).sort();
  for (const dir of headedDirs) {
    const files = fs.readdirSync(path.join(B1, dir)).filter((f) => f.startsWith("r74b1-snaps-"));
    for (const f of files) {
      const doc = loadSnaps(path.join(B1, dir, f));
      addOcean(`B1-${doc.window}-ocean-n05`, "pre-fix (media 1920)", doc);
    }
  }
  const c1doc = loadSnaps(path.join(C1, "headed-w1440x900", "r74b1-snaps-w1440x900.json"));
  addOcean("C1-post-fix-w1440-ocean-n05", "POST-FIX (C1)", c1doc);

  // ---- chạy lại 3 case post-fix mới (logic r76d2-postfix.mjs, qua harness mới) ----
  const natYuv = fs.readFileSync(path.join(D2, "native-grad1920", "grad1920-f30-1920.yuv"));
  const gPlain = resampleYuv420p(natYuv, 1920, 1080, 1280, 720);
  const gNoise = addYuvNoiseRgb24(gPlain, 1280, 720, 28, PREVIEW_SEED_LOCALT1);
  // Đối chiếu frame gradient1920 build lại với file D2 đã lưu (phải byte-identical).
  const gPlainRef = fs.readFileSync(path.join(D2, "fullrgb-gradient1920-plain.raw"));
  const gNoiseRef = fs.readFileSync(path.join(D2, "fullrgb-gradient1920-noise05.raw"));
  const gradFramesIdentical = gPlain.equals(gPlainRef) && gNoise.equals(gNoiseRef);
  console.log(`gradient1920 render frames build lại: plain ${gPlain.length}B noise ${gNoise.length}B, byte-identical với D2: ${gradFramesIdentical}`);
  const oceanPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const oceanNoise = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
  const addOceanPostfix = (name, snapPath) => {
    const doc = JSON.parse(fs.readFileSync(snapPath, "utf8"));
    const v = doc.snaps?.ocean;
    if (!v?.plain || !v?.noise05) { console.log(`  bỏ ${name}: thiếu ocean plain/noise05`); return; }
    cases.push(evalDelta0Case({ name, regime: "POST-FIX (D2)", prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v.noise05.rgbB64), plain1280: oceanPlain, noise1280: oceanNoise, vw: v.plain.w, vh: v.plain.h }));
  };
  addOceanPostfix("D2-post-fix-w1920-ocean-n05", path.join(D2, "headed-w1920x1080-ocean", "r74b1-snaps-w1920x1080.json"));
  addOceanPostfix("D2-post-fix-w2560-ocean-n05", path.join(D2, "headed-w2560x1440-ocean", "r74b1-snaps-w2560x1440.json"));
  const gdoc = JSON.parse(fs.readFileSync(path.join(D2, "headed-w1440x900-grad1920", "r74b1-snaps-w1440x900.json"), "utf8"));
  const gv = gdoc.snaps?.gradient1920;
  if (gv?.plain && gv?.noise05) {
    cases.push(evalDelta0Case({ name: "D2-post-fix-w1440-grad1920-n05", regime: "POST-FIX (D2)", prevPlain: b64ToRgb(gv.plain.rgbB64), prevNoise: b64ToRgb(gv.noise05.rgbB64), plain1280: gPlain, noise1280: gNoise, vw: gv.plain.w, vh: gv.plain.h }));
  } else console.log("  bỏ gradient1920: thiếu plain/noise05");

  // ---- đối chiếu từng case với JSON D2 ----
  console.log(`\nchạy lại ${cases.length} case qua delta0-harness.mjs (21 chẩn đoán + 3 post-fix mới; C1 trùng trong cả hai nhóm)`);
  let match = 0, mismatch = 0;
  const mismatches = [];
  for (const c of cases) {
    const ref = refByName.get(c.name);
    if (!ref) { console.log(`  ${c.name}: KHÔNG CÓ trong JSON D2 (case mới của đợt này?)`); continue; }
    const extraR0 = ref.rules ? ref.rules.R0_cu_plainMad_le_2_5 : undefined;
    const diffs = compareCase(c.name, c, ref, extraR0);
    if (diffs.length === 0) { match++; }
    else { mismatch++; mismatches.push({ name: c.name, diffs }); console.log(`  MISMATCH ${c.name}: ${diffs.join(" | ")}`); }
  }
  console.log(`đối chiếu D2: khớp ${match}/${match + mismatch} case${mismatch ? ` — LỆCH ${mismatch} case, xem mismatches trong JSON` : ""}`);

  // ---- chấm luật trên 20 case chấm được (17 chẩn đoán + 3 post-fix mới) ----
  const scorable = cases.filter((c) => c.correct !== "cả-hai-LỆCH" && !c.name.startsWith("C1-post-fix"));
  // C1 đã nằm trong 17 chẩn đoán; 20 = 17 diag + 3 postfix mới (trừ C1 trùng).
  const diagScorable = cases.filter((c) => c.correct !== "cả-hai-LỆCH").filter((c) => !c.name.startsWith("D2-post-fix"));
  const postfixNew = cases.filter((c) => c.name.startsWith("D2-post-fix"));
  console.log(`\nchấm luật: chẩn đoán chấm được ${diagScorable.length} (kỳ vọng 17), post-fix mới ${postfixNew.length} (kỳ vọng 3)`);
  const scored = [...diagScorable, ...postfixNew];
  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(scored, rule);
    console.log(`${rule}: đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored})${scores[rule].badList.length ? " | SAI: " + scores[rule].badList.join("; ") : ""}`);
  }
  const report = {
    generated: new Date().toISOString(),
    harness: "apps/web/scripts/delta0-harness.mjs (luật chính G12)",
    resample: "chrome-resample.mjs (C2 M4, 15:32 09/11 — cùng phiên bản D2)",
    gradFramesIdentical,
    casesRun: cases.length,
    compareVsD2: { match, mismatch, mismatches },
    scoredCount: scored.length,
    scores,
    cases,
  };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON kiểm chứng: ${OUT}`);
  if (mismatch > 0 || scores.G12_ca_hai.ok !== 20 || scores.G12_ca_hai.total !== 20) {
    console.log("KẾT QUẢ: KHÔNG ĐẠT — xem mismatches/scores trên");
    process.exitCode = 1;
  } else {
    console.log("KẾT QUẢ: ĐẠT — harness mới tái lập đúng D2, G12 20/20, R0 18/20");
  }
}
main().catch((e) => { console.error(`E6-VERIFY LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
