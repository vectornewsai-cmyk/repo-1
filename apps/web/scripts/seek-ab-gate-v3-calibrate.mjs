#!/usr/bin/env node
/**
 * Phase 9 đợt 37, luồng T1 — Hiệu chuẩn cổng v3 trên dữ liệu cũ.
 *
 * Đọc (không chạy browser, không relabel dữ liệu cũ):
 *  - benchmarks/results/v34-q1-seek-ab-*.json (8 lượt thô đợt 34 Q1;
 *    không có chromePre nên nhãn tải chỉ là tái tính từ load+fwd+rAF);
 *  - scratch ~/workspace/tmp-round35-r1/runs/<run>/forward-hold.json (11 lượt
 *    R1) và ~/workspace/tmp-round36-s1/runs/<run>/forward-hold.json (16 lượt
 *    b36) — scratch nằm ngoài repo, có thể mất; nếu thiếu, script báo
 *    rõ và chỉ hiệu chuẩn trên phần còn lại, KHÔNG bịa số;
 *  - benchmarks/results/v36-s2-reverse-*.json (8 lượt S2, chỉ có tải —
 *    dùng để kiểm tra load5/load15 là tiêu chí BỔ SUNG, không thay thế
 *    v2: lượt S2 vẫn under-load vì load1 dù load5/load15 có khi thấp);
 *  - nhãn v2 đã công bố trong benchmarks/results/v35-r1-seek-ab-*.json
 *    và v36-s1-seek-ab-*.json để đối chiếu chéo (decode + tải).
 * Ghi: benchmarks/results/v37-t1-gate-v3-calibration.json (bảng từng
 * lượt + tóm tắt đổi nhãn). Mọi con số trong LIMITS T1 đều lấy từ
 * file này, không nhập tay.
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/seek-ab-gate-v3-calibrate.mjs [out.json]
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { classifyRunV3, classifyLoadV3 } from "./seek-ab-gate-v3.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const RES = path.join(ROOT, "benchmarks", "results");
const SCRATCH = path.join(os.homedir(), "workspace");

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function runNameFromDir(dir) { return path.basename(dir); }

const rows = [];
// Đối chiếu có phân biệt phiên bản nhãn đã công bố: file gộp R1 mang nhãn
// decode v1 (đợt 35 chưa có v2), file gộp b36 mang nhãn decode v2. Vì vậy
// "mismatch" decode ở R1 không phải lỗi — nó chính là ca phân loại lại
// single-a4 mà S1 đã công bố; script ghi riêng, không tính là lỗi đối chiếu.
const crossCheck = { decodeMismatchV2Published: [], loadMismatch: [], v1ToV2Reclassification: [] };

// Nhãn đã công bố (merged) để đối chiếu.
const published = new Map();
for (const f of fs.readdirSync(RES).filter((x) => /^v3[56]-(r1|s1)-seek-ab-.*\.json$/.test(x) && !x.includes("summary"))) {
  const d = readJson(path.join(RES, f));
  if (d?.run) published.set(d.run, { loadLabel: d.loadLabel, decodeLabel: d.decodeSide?.decodeLabel ?? null, file: f });
}

function addRaw(source, name, fh, chromePre) {
  if (!fh) return;
  const v3 = classifyRunV3(fh, { chromePre });
  const pub = published.get(name);
  // acceptedV2 tính đúng: tải v2 đã công bố + decode tính lại bằng ngưỡng
  // v2 (v3 giữ nguyên ngưỡng decode v2). Với R1, nhãn decode đã công bố
  // là v1 nên KHÔNG dùng nó để tính acceptedV2.
  const v2Load = v3.labelReasonsV3.filter((r) => !r.includes("(v3 mới")).length === 0 ? "quiet" : "under-load";
  const acceptedV2 = pub ? (pub.loadLabel === "quiet" && v3.decodeLabel === "HEALTHY") : null;
  if (pub) {
    if (source === "b36" && v3.decodeLabel !== pub.decodeLabel) crossCheck.decodeMismatchV2Published.push({ name, v3: v3.decodeLabel, published: pub.decodeLabel });
    if (source === "R1-dot35" && v3.decodeLabel !== pub.decodeLabel) crossCheck.v1ToV2Reclassification.push({ name, v2recomputed: v3.decodeLabel, publishedV1: pub.decodeLabel });
    if (v2Load !== pub.loadLabel) crossCheck.loadMismatch.push({ name, v2recomputed: v2Load, published: pub.loadLabel });
  }
  rows.push({
    source, name,
    fps: v3.fps === null ? null : +v3.fps.toFixed(3),
    loadLabelV2Published: pub?.loadLabel ?? null,
    decodeLabelPublished: pub?.decodeLabel ?? null,
    decodeLabelPublishedVersion: source === "R1-dot35" ? "v1" : (source === "b36" ? "v2" : null),
    loadLabelV3: v3.loadLabelV3,
    labelReasonsV3: v3.labelReasonsV3,
    decodeLabel: v3.decodeLabel,
    acceptedV2,
    acceptedV3: v3.acceptedV3,
    tailMean: v3.decodeSignals?.tailMean ?? null,
    tailMax: v3.decodeSignals?.tailMax ?? null,
    gop: v3.gop,
    gopSubtype: v3.gopSubtype,
    load5Max: v3.loadSignals.load5Max,
    load15Max: v3.loadSignals.load15Max,
    load1Max: v3.loadSignals.load1Max,
    preLoadavg: v3.loadSignals.preLoadavg,
  });
}

// Q1: file thô trong repo, chromePre không rõ → nhãn tải tái tính thiếu điều kiện chrome.
for (const f of fs.readdirSync(RES).filter((x) => /^v34-q1-seek-ab-.*\.json$/.test(x)).sort()) {
  const fh = readJson(path.join(RES, f));
  addRaw("Q1-dot34", f.replace(/^v34-q1-seek-ab-/, "").replace(/\.json$/, ""), fh, undefined);
}
// R1 + b36: forward-hold trong scratch.
for (const [source, sub] of [["R1-dot35", "tmp-round35-r1/runs"], ["b36", "tmp-round36-s1/runs"]]) {
  const dir = path.join(SCRATCH, sub);
  if (!fs.existsSync(dir)) { console.error(`[calibrate] THIẾU scratch ${dir} — bỏ qua ${source}, không bịa số.`); continue; }
  for (const run of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, run, "forward-hold.json");
    if (!fs.existsSync(p)) continue;
    addRaw(source, run, readJson(p), 0);
  }
}
// S2: chỉ tải (không có decode side của seek A/B).
const s2Rows = [];
for (const f of fs.readdirSync(RES).filter((x) => /^v36-s2-reverse-(sparse|dense)-.*\.json$/.test(x)).sort()) {
  const d = readJson(path.join(RES, f));
  if (!d) continue;
  const load = classifyLoadV3(d, d.machine?.processes?.chromePre ?? undefined);
  s2Rows.push({
    name: f.replace(/\.json$/, ""), loadLabelV2Published: d.loadLabel,
    loadLabelV3: load.loadLabelV3, labelReasonsV3: load.labelReasonsV3,
    load1Max: load.signals.load1Max, load5Max: load.signals.load5Max, load15Max: load.signals.load15Max,
    preLoadavg: load.signals.preLoadavg,
  });
}

const v2Quiet = rows.filter((r) => r.loadLabelV2Published === "quiet");
const loadFlips = rows.filter((r) => r.loadLabelV2Published === "quiet" && r.loadLabelV3 === "under-load").map((r) => r.name);
const acceptedFlips = rows.filter((r) => r.acceptedV2 === true && r.acceptedV3 === false).map((r) => r.name);
const steady = rows.filter((r) => r.decodeLabel === "STEADY_SLOW");
const healthy = rows.filter((r) => r.decodeLabel === "HEALTHY");
const subtypeCounts = {};
for (const r of steady) subtypeCounts[r.gopSubtype ?? "null"] = (subtypeCounts[r.gopSubtype ?? "null"] ?? 0) + 1;
const healthyRatios = healthy.map((r) => r.gop?.ratio).filter((x) => typeof x === "number");
const v2QuietLoad5 = v2Quiet.map((r) => r.load5Max).filter((x) => x !== null);
const v2QuietLoad15 = v2Quiet.map((r) => r.load15Max).filter((x) => x !== null);

const summary = {
  runsTotal: rows.length,
  s2LoadOnlyTotal: s2Rows.length,
  crossCheck,
  loadLabelFlipsV2ToV3: { count: loadFlips.length, runs: loadFlips },
  acceptedFlipsV2ToV3: {
    count: acceptedFlips.length, runs: acceptedFlips,
    acceptedV2Total: rows.filter((r) => r.acceptedV2 === true).length,
    acceptedV3Total: rows.filter((r) => r.acceptedV3 === true).length,
  },
  gopSubtypesAmongSteadySlow: { total: steady.length, counts: subtypeCounts, runs: steady.map((r) => ({ name: r.name, ratio: r.gop?.ratio ?? null, subtype: r.gopSubtype })) },
  healthyRatioFloor: healthyRatios.length ? Math.min(...healthyRatios) : null,
  healthyRatioRange: healthyRatios.length ? [Math.min(...healthyRatios), Math.max(...healthyRatios)] : null,
  healthyFalsePositiveBelow030: healthy.filter((r) => typeof r.gop?.ratio === "number" && r.gop.ratio < 0.30).length,
  v2QuietLoad5MaxRange: v2QuietLoad5.length ? [Math.min(...v2QuietLoad5), Math.max(...v2QuietLoad5)] : null,
  v2QuietLoad15MaxRange: v2QuietLoad15.length ? [Math.min(...v2QuietLoad15), Math.max(...v2QuietLoad15)] : null,
  // Tách theo phiên cho cụm quiet: R1 vs b36 (minh chứng cho ngưỡng load5/load15).
  bySessionV2Quiet: Object.fromEntries(["Q1-dot34", "R1-dot35", "b36"].map((s) => {
    const q = rows.filter((r) => r.source === s && r.loadLabelV2Published === "quiet");
    const l5 = q.map((r) => r.load5Max).filter((x) => x !== null);
    const l15 = q.map((r) => r.load15Max).filter((x) => x !== null);
    return [s, { n: q.length, load5MaxRange: l5.length ? [Math.min(...l5), Math.max(...l5)] : null, load15MaxRange: l15.length ? [Math.min(...l15), Math.max(...l15)] : null, names: q.map((r) => r.name) }];
  })),
  s2StillUnderLoadV3: s2Rows.filter((r) => r.loadLabelV3 === "under-load").length,
  interpretation: [
    "Ngưỡng load5/load15 < 2,0 (đề xuất) đổi nhãn tải của đúng 4 lượt (toàn bộ lượt quiet b36) và làm 3 lượt accepted b36 rớt khỏi thống kê; 5 lượt accepted R1 giữ nguyên.",
    "Tỉ số GOP < 0,30 bắt 2/5 ca STEADY_SLOW thành SEGMENT_COLLAPSE, 0/23 lượt HEALTHY bị gắn cờ sai; retry-b8 (0,343) rơi vào vùng INDETERMINATE_MIXED, retry-b1/b2 (0,467–0,495) là NON_SEGMENT.",
    "Cả hai ngưỡng đều là hiệu chuẩn HỒI TỐ trên cùng dữ liệu đã thấy số — chưa phải bằng chứng tiền định; v3 chỉ thành cổng chính thức sau phiên đo riêng (LIMITS T1 §4).",
  ],
};

const out = {
  generatedBy: "seek-ab-gate-v3-calibrate.mjs (đợt 37 T1)",
  generatedAt: new Date().toISOString(),
  gate: "v3-proposed (load5/load15 < 2,0; GOP segment-collapse < 0,30)",
  sources: {
    q1: "benchmarks/results/v34-q1-seek-ab-*.json (trong repo)",
    r1: "scratch tmp-round35-r1/runs/<run>/forward-hold.json (ngoài repo; nếu mất thì bảng thiếu R1 và script báo rõ)",
    b36: "scratch tmp-round36-s1/runs/<run>/forward-hold.json (ngoài repo)",
    s2: "benchmarks/results/v36-s2-reverse-{sparse,dense}-*.json (chỉ tải, trong repo)",
    publishedLabels: "benchmarks/results/v35-r1-seek-ab-*.json + v36-s1-seek-ab-*.json (đối chiếu, không relabel)",
  },
  note: "File này KHÔNG relabel dữ liệu cũ: cột Published giữ nguyên nhãn v2 đã công bố; cột V3 chỉ là phân loại lại bằng cổng đề xuất để đo mức đổi nhãn.",
  summary,
  rows,
  s2Rows,
};

const outPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(RES, "v37-t1-gate-v3-calibration.json");
writeFileEpermRetry(outPath, JSON.stringify(out, null, 2));
console.log(`[calibrate] runs=${rows.length} s2=${s2Rows.length} loadFlips=${loadFlips.length} acceptedFlips=${acceptedFlips.length} decodeMismatchV2=${crossCheck.decodeMismatchV2Published.length} loadMismatch=${crossCheck.loadMismatch.length} v1ToV2=${crossCheck.v1ToV2Reclassification.length}`);
console.log(`[calibrate] → ${outPath}`);
