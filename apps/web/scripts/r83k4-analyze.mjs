#!/usr/bin/env node
/**
 * r83k4-analyze.mjs — Phase 9 đợt 83, luồng K4: PHÂN TÍCH gộp thí nghiệm
 * codec VP9-vs-h264 từ mọi sweep JSON (r83k4-sweep-*.json) + snapshot
 * headed (r83k4-snaps-*.json) + render tham chiếu.
 *
 * SO SÁNH THEO CẶP (paired): cùng family (slov/tp) + cùng window +
 * cùng mức noise, chỉ khác codec → mọi chênh lệch còn lại là do codec
 * (hoặc do nhiễu đo, đã tách bằng cặp đối chứng VP9-gốc vs VP9-reenc).
 *
 * Nhánh (arm): slov-vp9-orig | slov-h264-1920 | slov-vp9-1920 |
 *              tp-h264-1920 | tp-vp9-1920.
 * Đo mỗi arm: n case, mean/median residStd_R, d0std_R, ratio_R,
 * plainMad; số case Q4; điểm 4 luật (scoreRule); số verdict lật theo
 * cặp codec (noD0 / fullD0 / R0 / G1 / G2 / G12); Δ số học theo cặp
 * (mean/median/max |ΔresidStd_R|, |Δratio_R|, |ΔplainMad|).
 * Độ sắc: gradient (mean|Δ| H/V, frac>8) của snapshot preview plain vs
 * render plain resample về cùng rect → tỉ số preview/render theo arm.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r83k4-analyze.mjs
 * JSON: hidden_files/round83-k4/r83k4-analysis.json
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { scoreRule, b64ToRgb } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const K4 = path.join(GOAL, "round83-k4");
const RENDER = path.join(K4, "render");
const r4 = (x) => +x.toFixed(4);
const ARM_FAMILY = {
  "slov-vp9-orig": { family: "slov", codec: "vp9-orig" },
  "slov-h264-1920": { family: "slov", codec: "h264" },
  "slov-vp9-1920": { family: "slov", codec: "vp9-reenc" },
  "tp-h264-1920": { family: "tp", codec: "h264" },
  "tp-vp9-1920": { family: "tp", codec: "vp9-reenc" },
};
function stats(xs) {
  if (!xs.length) return { n: 0 };
  const s = [...xs].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const mid = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { n: s.length, mean: r4(mean), median: r4(mid), min: r4(s[0]), max: r4(s[s.length - 1]) };
}
function gradientStats(buf, w, h) {
  const out = { fracGt8H: [], fracGt8V: [], meanAbsH: [], meanAbsV: [] };
  for (let c = 0; c < 3; c++) {
    let gtH = 0, nH = 0, sH = 0, gtV = 0, nV = 0, sV = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3 + c;
      if (x + 1 < w) { const d = Math.abs(buf[i + 3] - buf[i]); sH += d; nH++; if (d > 8) gtH++; }
      if (y + 1 < h) { const d = Math.abs(buf[i + w * 3] - buf[i]); sV += d; nV++; if (d > 8) gtV++; }
    }
    out.fracGt8H.push(+(gtH / nH).toFixed(4));
    out.fracGt8V.push(+(gtV / nV).toFixed(4));
    out.meanAbsH.push(+(sH / nH).toFixed(3));
    out.meanAbsV.push(+(sV / nV).toFixed(3));
  }
  return out;
}
const mean3 = (a) => +((a[0] + a[1] + a[2]) / 3).toFixed(4);

async function main() {
  const files = fs.readdirSync(K4).filter((f) => /^r83k4-sweep-.*\.json$/.test(f)).sort();
  if (!files.length) throw new Error("không thấy sweep JSON nào trong round83-k4");
  const cases = []; // casesRaw, kèm arm/window
  for (const f of files) {
    const doc = JSON.parse(fs.readFileSync(path.join(K4, f), "utf8"));
    for (const c of doc.casesRaw || []) cases.push({ ...c, window: doc.window, file: f });
  }
  console.log(`đọc ${files.length} sweep JSON → ${cases.length} case (raw)`);
  const byArm = {};
  for (const c of cases) {
    const arm = c.source;
    (byArm[arm] = byArm[arm] || []).push(c);
  }
  const arms = {};
  for (const [arm, cs] of Object.entries(byArm)) {
    const q4 = cs.filter((c) => !c.gates.G1_d0stdR_le_2 && c.gates.G2_ratioR_le_1).length;
    const scores = {};
    for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) scores[rule] = scoreRule(cs, rule);
    arms[arm] = {
      ...ARM_FAMILY[arm], n: cs.length,
      residStdR: stats(cs.map((c) => c.residStd[0])),
      d0stdR: stats(cs.map((c) => c.d0stdR)),
      ratioR: stats(cs.map((c) => c.ratioR)),
      plainMad: stats(cs.map((c) => c.plainMad)),
      q4Count: q4,
      scores,
      verdictNoD0: { KHOP: cs.filter((c) => c.verdictNoD0 === "KHỚP-THỐNG-KÊ").length, LECH: cs.filter((c) => c.verdictNoD0 === "LỆCH-THỐNG-KÊ").length },
      verdictFullD0: { KHOP: cs.filter((c) => c.verdictFullD0 === "KHỚP-THỐNG-KÊ").length, LECH: cs.filter((c) => c.verdictFullD0 === "LỆCH-THỐNG-KÊ").length },
    };
    console.log(`${arm}: n=${cs.length} residStd_R mean=${arms[arm].residStdR.mean} median=${arms[arm].residStdR.median} | ratio_R mean=${arms[arm].ratioR.mean} | plainMad mean=${arms[arm].plainMad.mean} | Q4=${q4}`);
  }

  // ---- So sánh theo cặp: cùng family + window + noise ----
  const groups = {};
  for (const c of cases) {
    const key = `${ARM_FAMILY[c.source].family}|${c.window}|${c.noiseLevel}`;
    (groups[key] = groups[key] || {})[c.source] = c;
  }
  const RULES = ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"];
  const pairDefs = [
    ["slov-vp9-orig", "slov-h264-1920", "slov: VP9-gốc vs h264 (câu hỏi chính J4)"],
    ["slov-vp9-1920", "slov-h264-1920", "slov: VP9-reenc (cùng bitrate/tag) vs h264 (tách codec khỏi re-encode)"],
    ["slov-vp9-orig", "slov-vp9-1920", "slov: VP9-gốc vs VP9-reenc (đối chứng re-encode/bitrate/tag)"],
    ["tp-h264-1920", "tp-vp9-1920", "tp: h264 vs VP9-reenc (cùng bitrate/tag)"],
  ];
  const pairs = {};
  for (const [a, b, label] of pairDefs) {
    const keys = Object.keys(groups).filter((k) => groups[k][a] && groups[k][b]);
    const dResid = [], dRatio = [], dMad = [], dD0 = [];
    const flips = { verdictNoD0: 0, verdictFullD0: 0 };
    for (const r of RULES) flips[r] = 0;
    const gateFlips = { G1: 0, G2: 0, G12: 0 };
    const flipCases = [];
    for (const k of keys) {
      const ca = groups[k][a], cb = groups[k][b];
      dResid.push(Math.abs(ca.residStd[0] - cb.residStd[0]));
      dRatio.push(Math.abs(ca.ratioR - cb.ratioR));
      dMad.push(Math.abs(ca.plainMad - cb.plainMad));
      dD0.push(Math.abs(ca.d0stdR - cb.d0stdR));
      const fl = [];
      if (ca.verdictNoD0 !== cb.verdictNoD0) { flips.verdictNoD0++; fl.push("noD0"); }
      if (ca.verdictFullD0 !== cb.verdictFullD0) { flips.verdictFullD0++; fl.push("fullD0"); }
      for (const r of RULES) if (ca.verdictUnder[r] !== cb.verdictUnder[r]) { flips[r]++; fl.push(r); }
      if (ca.gates.G1_d0stdR_le_2 !== cb.gates.G1_d0stdR_le_2) { gateFlips.G1++; fl.push("gateG1"); }
      if (ca.gates.G2_ratioR_le_1 !== cb.gates.G2_ratioR_le_1) { gateFlips.G2++; fl.push("gateG2"); }
      if (ca.gates.G12_ca_hai !== cb.gates.G12_ca_hai) { gateFlips.G12++; fl.push("gateG12"); }
      if (fl.length) flipCases.push({ key: k, flips: fl, a: { resid: r4(ca.residStd[0]), ratio: r4(ca.ratioR), verdictNoD0: ca.verdictNoD0, verdictFullD0: ca.verdictFullD0 }, b: { resid: r4(cb.residStd[0]), ratio: r4(cb.ratioR), verdictNoD0: cb.verdictNoD0, verdictFullD0: cb.verdictFullD0 } });
    }
    pairs[`${a} vs ${b}`] = { label, nPaired: keys.length, dResid: stats(dResid), dRatio: stats(dRatio), dPlainMad: stats(dMad), dD0stdR: stats(dD0), flips, gateFlips, flipCases };
    console.log(`${label}: n=${keys.length} |Δresid| mean=${stats(dResid).mean} max=${stats(dResid).max} | flips noD0=${flips.verdictNoD0} fullD0=${flips.verdictFullD0} G1=${flips.G1_d0stdR_le_2} G2=${flips.G2_ratioR_le_1} G12=${flips.G12_ca_hai}`);
  }

  // ---- Độ sắc preview vs render (cùng rect) ----
  const sharp = {};
  const snapFiles = fs.readdirSync(K4).filter((f) => /^headed-(w\d+x\d+)$/.test(f)).sort();
  for (const dir of snapFiles) {
    const win = dir.slice("headed-".length);
    const doc = JSON.parse(fs.readFileSync(path.join(K4, dir, `r83k4-snaps-${win}.json`), "utf8"));
    for (const [name, variants] of Object.entries(doc.snaps || {})) {
      if (!variants.plain) continue;
      const prev = b64ToRgb(variants.plain.rgbB64);
      const vw = variants.plain.w, vh = variants.plain.h;
      const renderPlain = fs.readFileSync(path.join(RENDER, `${name}-plain.raw`));
      const renderTri = resampleRgb24Trilinear(renderPlain, 1280, 720, vw, vh);
      const gp = gradientStats(prev, vw, vh), gr = gradientStats(renderTri, vw, vh);
      const entry = {
        window: win, rect: `${vw}x${vh}`,
        previewMeanAbsH: mean3(gp.meanAbsH), renderMeanAbsH: mean3(gr.meanAbsH),
        ratioH: +(mean3(gp.meanAbsH) / mean3(gr.meanAbsH)).toFixed(4),
        previewMeanAbsV: mean3(gp.meanAbsV), renderMeanAbsV: mean3(gr.meanAbsV),
        ratioV: +(mean3(gp.meanAbsV) / mean3(gr.meanAbsV)).toFixed(4),
      };
      (sharp[name] = sharp[name] || []).push(entry);
    }
  }
  const sharpSummary = {};
  for (const [arm, list] of Object.entries(sharp)) {
    sharpSummary[arm] = {
      ...ARM_FAMILY[arm], n: list.length,
      ratioH: stats(list.map((x) => x.ratioH)),
      ratioV: stats(list.map((x) => x.ratioV)),
      previewMeanAbsH: stats(list.map((x) => x.previewMeanAbsH)),
      renderMeanAbsH: stats(list.map((x) => x.renderMeanAbsH)),
    };
    console.log(`${arm} sharpness: n=${list.length} ratioH mean=${sharpSummary[arm].ratioH.mean} median=${sharpSummary[arm].ratioH.median} | ratioV mean=${sharpSummary[arm].ratioV.mean}`);
  }

  const analysis = { generated: new Date().toISOString(), totalCases: cases.length, arms, pairs, sharpness: sharpSummary, sharpnessDetail: sharp };
  writeFileEpermRetry(path.join(K4, "r83k4-analysis.json"), JSON.stringify(analysis, null, 2));
  console.log(`\nJSON phân tích: ${path.join(K4, "r83k4-analysis.json")} (${cases.length} case)`);
}
main().catch((e) => { console.error(`K4-ANALYZE LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
