#!/usr/bin/env node
/**
 * test_round83_k4_vp9_vs_h264.mjs — Phase 9 đợt 83, luồng K4: kiểm chứng
 * kết luận thí nghiệm codec VP9-vs-h264 bằng số trong
 * hidden_files/round83-k4/r83k4-analysis.json (50 case) +
 * r83k4-media-build.json (decode chéo native).
 *
 * Khẳng định chính: codec (cùng bitrate + tag màu) KHÔNG làm lệch
 * verdict — |ΔresidStd_R| theo cặp chỉ 0,0025 (slov) / 0,0055 (tp),
 * 0 lần lật verdict trong 40 cặp so sánh; lệch lớn orig-vs-h264
 * (2,14) thuộc về re-encode/tag màu, không phải codec (đối chứng
 * orig-vs-vp9-reenc cũng 2,14 trong khi vp9-reenc-vs-h264 chỉ 0,0025).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/test_round83_k4_vp9_vs_h264.mjs
 * Exit 0 khi mọi khẳng định pass. KHÔNG push/tag/binary/workflow.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const K4 = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round83-k4");
const analysis = JSON.parse(fs.readFileSync(path.join(K4, "r83k4-analysis.json"), "utf8"));
const build = JSON.parse(fs.readFileSync(path.join(K4, "r83k4-media-build.json"), "utf8"));

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`); };
const approx = (got, want, tol) => Math.abs(got - want) <= tol;

// ---- 1. Quy mô mẫu ----
check("tổng 50 case (5 nhánh × 10)", analysis.totalCases === 50, `totalCases=${analysis.totalCases}`);
for (const arm of ["slov-vp9-orig", "slov-h264-1920", "slov-vp9-1920", "tp-h264-1920", "tp-vp9-1920"]) {
  check(`nhánh ${arm} đủ 10 case`, analysis.arms[arm].n === 10, `n=${analysis.arms[arm].n}`);
}

// ---- 2. Codec (cùng bitrate + tag) không lệch resid ----
const pSR = analysis.pairs["slov-vp9-1920 vs slov-h264-1920"];
check("slov VP9-reenc vs h264: |Δresid| mean ≈ 0,0025", approx(pSR.dResid.mean, 0.0025, 0.001), `mean=${pSR.dResid.mean}`);
check("slov VP9-reenc vs h264: |Δresid| max ≈ 0,0034", approx(pSR.dResid.max, 0.0034, 0.001), `max=${pSR.dResid.max}`);
const pTP = analysis.pairs["tp-h264-1920 vs tp-vp9-1920"];
check("tp h264 vs VP9: |Δresid| mean ≈ 0,0055", approx(pTP.dResid.mean, 0.0055, 0.001), `mean=${pTP.dResid.mean}`);
check("tp h264 vs VP9: |Δresid| max ≈ 0,0189", approx(pTP.dResid.max, 0.0189, 0.001), `max=${pTP.dResid.max}`);

// ---- 3. Lệch lớn orig-vs-h264 thuộc về re-encode/tag, không phải codec ----
const pOH = analysis.pairs["slov-vp9-orig vs slov-h264-1920"];
check("slov VP9-gốc vs h264: |Δresid| mean ≈ 2,1422", approx(pOH.dResid.mean, 2.1422, 0.01), `mean=${pOH.dResid.mean}`);
const pOR = analysis.pairs["slov-vp9-orig vs slov-vp9-1920"];
check("slov VP9-gốc vs VP9-reenc: |Δresid| mean ≈ 2,1397 (≈ orig-vs-h264)", approx(pOR.dResid.mean, 2.1397, 0.01), `mean=${pOR.dResid.mean}`);
check("đối chứng: orig-vs-reenc ≈ orig-vs-h264 (chênh < 0,01)", Math.abs(pOR.dResid.mean - pOH.dResid.mean) < 0.01, `|${pOR.dResid.mean} - ${pOH.dResid.mean}| = ${Math.abs(pOR.dResid.mean - pOH.dResid.mean).toFixed(4)}`);

// ---- 4. Không lần lật verdict nào (40 cặp × 6 verdict + 3 gate) ----
for (const [key, p] of Object.entries(analysis.pairs)) {
  const flips = p.flips, gates = p.gateFlips;
  const allZero = flips.verdictNoD0 === 0 && flips.verdictFullD0 === 0 && flips.R0_cu === 0
    && flips.G1_d0stdR_le_2 === 0 && flips.G2_ratioR_le_1 === 0 && flips.G12_ca_hai === 0
    && gates.G1 === 0 && gates.G2 === 0 && gates.G12 === 0 && p.flipCases.length === 0;
  check(`0 lần lật verdict/gate — ${key} (n=${p.nPaired})`, allZero, `flips=${JSON.stringify(flips)} gates=${JSON.stringify(gates)}`);
}

// ---- 5. Resid theo nhánh + Q4 ----
check("slov-h264 residStd_R mean ≈ 0,6088", approx(analysis.arms["slov-h264-1920"].residStdR.mean, 0.6088, 0.01), `mean=${analysis.arms["slov-h264-1920"].residStdR.mean}`);
check("slov-vp9-orig residStd_R mean ≈ 2,7511", approx(analysis.arms["slov-vp9-orig"].residStdR.mean, 2.7511, 0.01), `mean=${analysis.arms["slov-vp9-orig"].residStdR.mean}`);
check("tp-h264 residStd_R mean ≈ 0,9465", approx(analysis.arms["tp-h264-1920"].residStdR.mean, 0.9465, 0.01), `mean=${analysis.arms["tp-h264-1920"].residStdR.mean}`);
for (const arm of Object.keys(analysis.arms)) {
  check(`Q4 = 0 — ${arm}`, analysis.arms[arm].q4Count === 0, `Q4=${analysis.arms[arm].q4Count}`);
}

// ---- 6. Verdict theo nhánh (giống nhau trong từng family) ----
for (const arm of ["slov-vp9-orig", "slov-h264-1920", "slov-vp9-1920"]) {
  check(`slov ${arm}: noD0/fullD0 10 KHỚP`, analysis.arms[arm].verdictNoD0.KHOP === 10 && analysis.arms[arm].verdictFullD0.KHOP === 10,
    `noD0=${JSON.stringify(analysis.arms[arm].verdictNoD0)} fullD0=${JSON.stringify(analysis.arms[arm].verdictFullD0)}`);
}
for (const arm of ["tp-h264-1920", "tp-vp9-1920"]) {
  check(`tp ${arm}: noD0/fullD0 10 LỆCH (cả-hai-LỆCH, giống nhau)`, analysis.arms[arm].verdictNoD0.LECH === 10 && analysis.arms[arm].verdictFullD0.LECH === 10,
    `noD0=${JSON.stringify(analysis.arms[arm].verdictNoD0)} fullD0=${JSON.stringify(analysis.arms[arm].verdictFullD0)}`);
}

// ---- 7. Độ sắc preview/render: codec khớp ≈ 1,00; orig ≈ 0,93 ----
check("độ sắc slov-h264 ratioH ≈ 1,004", approx(analysis.sharpness["slov-h264-1920"].ratioH.mean, 1.004, 0.01), `mean=${analysis.sharpness["slov-h264-1920"].ratioH.mean}`);
check("độ sắc slov-vp9-reenc ratioH ≈ 1,0027", approx(analysis.sharpness["slov-vp9-1920"].ratioH.mean, 1.0027, 0.01), `mean=${analysis.sharpness["slov-vp9-1920"].ratioH.mean}`);
check("độ sắc slov-vp9-orig ratioH ≈ 0,9333 (< 1, preview mềm hơn render)", approx(analysis.sharpness["slov-vp9-orig"].ratioH.mean, 0.9333, 0.01), `mean=${analysis.sharpness["slov-vp9-orig"].ratioH.mean}`);
check("độ sắc tp-h264 ratioH ≈ 1,0048", approx(analysis.sharpness["tp-h264-1920"].ratioH.mean, 1.0048, 0.01), `mean=${analysis.sharpness["tp-h264-1920"].ratioH.mean}`);
check("độ sắc tp-vp9 ratioH ≈ 1,004", approx(analysis.sharpness["tp-vp9-1920"].ratioH.mean, 1.004, 0.01), `mean=${analysis.sharpness["tp-vp9-1920"].ratioH.mean}`);

// ---- 8. Decode chéo native (ffmpeg) + kiểm chứng chuỗi build ----
check("decode chéo VP9-reenc vs h264 MAD ≈ 0,6436", approx(build.crossCodecMad["slov-vp9-1920 vs slov-h264-1920"].mad, 0.6436, 0.01), `MAD=${build.crossCodecMad["slov-vp9-1920 vs slov-h264-1920"].mad}`);
check("decode chéo tp h264 vs VP9 MAD ≈ 0,2491", approx(build.crossCodecMad["tp-h264-1920 vs tp-vp9-1920"].mad, 0.2491, 0.01), `MAD=${build.crossCodecMad["tp-h264-1920 vs tp-vp9-1920"].mad}`);
check("decode chéo orig vs VP9-reenc MAD ≈ 1,7614 (> reenc-vs-h264)", approx(build.crossCodecMad["slov-vp9-orig vs slov-vp9-1920"].mad, 1.7614, 0.01), `MAD=${build.crossCodecMad["slov-vp9-orig vs slov-vp9-1920"].mad}`);
check("chuỗi Z2: decode tp-1280 f30 vs fullrgb MAD = 0", build.checks.z2TpMad.mad === 0, `MAD=${build.checks.z2TpMad.mad}`);
check("motion slov f25-vs-f40 MAD ≈ 24,504", approx(build.checks.motionSlovH264_f25vsf40.mad, 24.504, 0.01), `MAD=${build.checks.motionSlovH264_f25vsf40.mad}`);
const slovVp9Bitrate = Number(build.arms["slov-vp9-1920"].probe.format.bit_rate);
check("VP9 slov bitrate khớp target 8243k trong 1%", Math.abs(slovVp9Bitrate - 8243000) / 8243000 < 0.01, `${slovVp9Bitrate} bps`);
const tpVp9Bitrate = Number(build.arms["tp-vp9-1920"].probe.format.bit_rate);
check("VP9 tp bitrate khớp target 7134k trong 2%", Math.abs(tpVp9Bitrate - 7134000) / 7134000 < 0.02, `${tpVp9Bitrate} bps`);

const nPass = results.filter((r) => r.ok).length;
console.log(`\nKẾT QUẢ TEST K4: ${nPass}/${results.length} pass`);
process.exitCode = nPass === results.length ? 0 : 1;
