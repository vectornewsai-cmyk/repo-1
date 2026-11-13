#!/usr/bin/env node
/**
 * r82j4-corr-decompose.mjs — Phase 9 đợt 82, luồng J4: ĐÀO SÂU 2 case sát
 * ngưỡng corr LỆCH ở sweep không-làm-tròn đợt 81 I4:
 *   Y2-w1440-test-pattern-noise10  (noD0 maxCorrDiff 0,1207 — cặp RG)
 *   Y2-w1920-test-pattern-noise05  (noD0 maxCorrDiff 0,1208 — cặp RG)
 * Cả hai đều: kurt qua (0,31 / 0,25), stdRatio qua, CHỈ corr RG vượt 0,12
 * có 0,0007/0,0008; fullD0 thì KHỚP (corr RG rơi về 0,0294/0,0058); cả 4
 * luật đều áp d0 → KHỚP nên 2 case này KHÔNG mang thông tin phân biệt
 * G2 vs G12. Câu hỏi: 0,1207/0,1208 từ đâu ra — ngưỡng corr, hay luật khác?
 *
 * PHƯƠNG PHÁP: phân rã corr từng cặp kênh (RG/RB/GB) của 4 đại lượng:
 *   previewDelta noD0 (= prevNoise - prevPlain), renderDelta
 *   (= renderNoise - renderPlain), d0 (mô hình chroma-shift), và
 *   previewDelta fullD0 (= previewDelta noD0 - d0).
 * Nếu corr RG của previewDelta noD0 ≈ corr RG của d0 (hoặc bị d0 kéo),
 * thì LỆCH là do thành phần d0 — tức ngưỡng corr đang "đo" đúng cái mà
 * d0 sửa, và verdict LỆCH của noD0 là ĐÚNG theo thiết kế (không-d0 thì
 * lệch, có-d0 thì khớp). Đối chứng: 2 case tp khác gần ngưỡng
 * (F7-w2240-tp-n05: 0,1025; G6-w2048-tp-n05: 0,1019) + 2 case natural
 * (D2-post-fix-w1920-ocean-n05: corr thấp; B1-w1280-ocean-n05: corr cao
 * 0,2532 nhưng kurt đã lệch 1,14 — LỆCH do kurt, không phải corr).
 *
 * CHỈ ĐỌC dữ liệu cũ + tính toán offline. Không sửa harness/production.
 * Chạy (từ gốc repo): node apps/web/scripts/r82j4-corr-decompose.mjs
 * JSON: hidden_files/round82-j4/r82j4-corr-decompose.json.
 * KHÔNG push/tag/binary/workflow.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";
import {
  channelStatsRaw, corrPerChannelRaw, delta0Viewport_70x6, b64ToRgb,
} from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const F7 = path.join(GOAL, "round78-f7");
const G6 = path.join(GOAL, "round79-g6");
const D2 = path.join(GOAL, "round76-d2");
const B1 = path.join(GOAL, "round74-b1");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const RENDER_NEW = path.join(GOAL, "round72-z2", "render-1k");
const J4 = path.join(GOAL, "round82-j4");
fs.mkdirSync(J4, { recursive: true });
const OUT = path.join(J4, "r82j4-corr-decompose.json");

const r4 = (x) => +x.toFixed(4);
const PAIRS = ["RG", "RB", "GB"];

/** corr từng cặp kênh của một delta (Float64Array n*3) — dùng channelStatsRaw. */
function deltaCorr(d) {
  return channelStatsRaw(d).corr;
}
/** corr từng cặp kênh của d0 (Int16Array n*3) — qua Float64Array. */
function d0Corr(d0) {
  return channelStatsRaw(Float64Array.from(d0)).corr;
}

function decompose(name, prevPlain, prevNoise, plain1280, noise1280, vw, vh) {
  const renderPlainTri = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
  const renderNoiseTri = resampleRgb24Trilinear(noise1280, 1280, 720, vw, vh);
  const n = vw * vh;
  const dPrevNo = new Float64Array(n * 3);
  const dRend = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    dPrevNo[i] = prevNoise[i] - prevPlain[i];
    dRend[i] = renderNoiseTri[i] - renderPlainTri[i];
  }
  const d0 = delta0Viewport_70x6(plain1280, 1280, 720, vw, vh);
  const dPrevFu = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) dPrevFu[i] = dPrevNo[i] - d0[i];
  const cPrevNo = deltaCorr(dPrevNo);
  const cRend = deltaCorr(dRend);
  const cD0 = d0Corr(d0);
  const cPrevFu = deltaCorr(dPrevFu);
  const diffNo = cPrevNo.map((c, i) => Math.abs(c - cRend[i]));
  const diffFu = cPrevFu.map((c, i) => Math.abs(c - cRend[i]));
  // Tương quan Pearson giữa d0 và phần dư plain (resid) từng kênh — xem d0 có
  // "ăn khớp" với resid không (corrPerChannelRaw(d0, resid)).
  const resid = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) resid[i] = prevPlain[i] - renderPlainTri[i];
  const d0ResidCorr = corrPerChannelRaw(d0, resid);
  // d0std từng kênh (độ lớn thành phần d0) + corr RG nội bộ của d0.
  const d0std = channelStatsRaw(Float64Array.from(d0)).std;
  return {
    name, rect: `${vw}x${vh}`,
    corrPreviewNoD0: cPrevNo.map(r4), corrRender: cRend.map(r4),
    corrD0: cD0.map(r4), corrPreviewFullD0: cPrevFu.map(r4),
    corrDiffNoD0: diffNo.map(r4), corrDiffFullD0: diffFu.map(r4),
    maxCorrDiffNoD0: r4(Math.max(...diffNo)), maxCorrDiffFullD0: r4(Math.max(...diffFu)),
    d0std: d0std.map(r4), d0ResidCorr: d0ResidCorr.map(r4),
    // Đóng góp của d0 vào corr RG của previewDelta: corr RG của (dPrevNo)
    // so với corr RG của (dPrevNo - d0). Số này cho thấy d0 kéo corr RG
    // của preview đi bao nhiêu.
    d0PullRG: r4(cPrevNo[0] - cPrevFu[0]),
  };
}

function loadDoc(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

async function main() {
  const cases = [];
  // 2 case then chốt Y2 (test-pattern, render R66T3).
  const tpPlain = fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw"));
  const tpN05 = fs.readFileSync(path.join(R66T3, "fullrgb-noise05.raw"));
  const tpN10 = fs.readFileSync(path.join(R66T3, "fullrgb-noise10.raw"));
  for (const [w, snapFile, lv, noise1280] of [
    ["w1440", "r71y2-snaps-w1440.json", "noise10", tpN10],
    ["w1920", "r71y2-snaps-w1920.json", "noise05", tpN05],
  ]) {
    const doc = loadDoc(path.join(Y2, `headed-${w}`, snapFile));
    const v = doc.snaps?.["test-pattern"];
    cases.push(decompose(`Y2-${w}-test-pattern-${lv}`, b64ToRgb(v.plain.rgbB64),
      b64ToRgb(v[lv].rgbB64), tpPlain, noise1280, v.plain.w, v.plain.h));
  }
  // Đối chứng tp gần ngưỡng: F7 w2240 n05 (0,1025), G6 w2048 n05 (0,1019).
  {
    const doc = loadDoc(path.join(F7, "headed-w2240x1260-testpattern", "r78f7-snaps-w2240x1260.json"));
    const v = doc.snaps?.["test-pattern"];
    cases.push(decompose("F7-sweep-w2240-testpattern-n05", b64ToRgb(v.plain.rgbB64),
      b64ToRgb(v.noise05.rgbB64), tpPlain, tpN05, v.plain.w, v.plain.h));
  }
  {
    const doc = loadDoc(path.join(G6, "headed-w2048x1152", "r79g6-snaps-w2048x1152.json"));
    const v = doc.snaps?.["test-pattern"];
    cases.push(decompose("G6-sweep-w2048-testpattern-n05", b64ToRgb(v.plain.rgbB64),
      b64ToRgb(v.noise05.rgbB64), tpPlain, tpN05, v.plain.w, v.plain.h));
  }
  // Đối chứng natural: D2 post-fix ocean w1920 n05 (corr thấp) + B1 pre-fix
  // ocean w1280 n05 (corr cao 0,2532 nhưng kurt lệch 1,14).
  const ocPlain = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-plain.raw"));
  const ocN05 = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-ocean-noise05.raw"));
  {
    const doc = loadDoc(path.join(D2, "headed-w1920x1080-ocean", "r74b1-snaps-w1920x1080.json"));
    const v = doc.snaps?.ocean;
    cases.push(decompose("D2-post-fix-w1920-ocean-n05", b64ToRgb(v.plain.rgbB64),
      b64ToRgb(v.noise05.rgbB64), ocPlain, ocN05, v.plain.w, v.plain.h));
  }
  {
    const doc = loadDoc(path.join(B1, "headed-w1280x800", "r74b1-snaps-w1280x800.json"));
    const v = doc.snaps?.ocean;
    cases.push(decompose("B1-w1280x800-ocean-n05", b64ToRgb(v.plain.rgbB64),
      b64ToRgb(v.noise05.rgbB64), ocPlain, ocN05, v.plain.w, v.plain.h));
  }

  for (const c of cases) {
    console.log(`\n== ${c.name} (${c.rect}) ==`);
    console.log(`  corr RG/RB/GB: prevNoD0=${JSON.stringify(c.corrPreviewNoD0)} render=${JSON.stringify(c.corrRender)} d0=${JSON.stringify(c.corrD0)} prevFullD0=${JSON.stringify(c.corrPreviewFullD0)}`);
    console.log(`  corrDiff noD0=${JSON.stringify(c.corrDiffNoD0)} (max ${c.maxCorrDiffNoD0}) | fullD0=${JSON.stringify(c.corrDiffFullD0)} (max ${c.maxCorrDiffFullD0})`);
    console.log(`  d0std=${JSON.stringify(c.d0std)} | d0-resid corr/ch=${JSON.stringify(c.d0ResidCorr)} | d0 kéo corr RG của preview: ${c.d0PullRG}`);
  }
  writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), cases }, null, 2));
  console.log(`\nJSON: ${OUT} (${cases.length} case)`);
}
main().catch((e) => { console.error(`J4-CORR-DECOMPOSE LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
