#!/usr/bin/env node
/**
 * Phase 9 đợt 36, luồng S1 — tổng hợp A/B seekElement đợt 36 + gộp với
 * đợt 35 R1 sau khi phân loại lại R1 bằng cổng decode v2.
 *
 * Đọc: benchmarks/results/v36-s1-seek-ab-*.json (lượt đợt 36, đã gắn
 * nhãn v2 bởi seek-ab-quiet-run36.sh) và phân loại lại 11 lượt đợt 35
 * R1 bằng seek-ab-decode-side-v2-analyze.mjs trên forward-hold.json
 * trong scratch ~/workspace/tmp-round35-r1/runs/ (R1 chỉ có nhãn v1;
 * v2 gắn cờ mới đúng single-a4 → STEADY_SLOW, nên tập accepted của
 * R1 theo v2 chỉ còn retry 3 / single 2, không còn 3+3).
 *
 * Thống kê: trung vị / trung bình / độ lệch chuẩn mẫu / khoảng cho
 * mỗi phía (chỉ lượt accepted), tỉ số từng cặp theo thứ tự nhận,
 * và kiểm định dấu hiệu ứng nhỏ: hiệu ứng <10% được coi là "khóa
 * được" chỉ khi khoảng tin cậy 95% của chênh lệch trung bình (Welch)
 * nằm gọn trong ±10% của trung bình retry — nếu không, kết luận là
 * CHƯA khóa được, kèm số lượt cần thêm ước tính từ phương sai quan
 * sát (công thức cỡ mẫu cho hiệu ứng 10% hai phía, power 80%).
 * Mọi con số đều tính từ file, không nhập tay.
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/seek-ab36-summarize.mjs [out.json]
 * Mặc định in JSON ra stdout; nếu cho out.json thì ghi file đó.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const RES = path.join(ROOT, "benchmarks", "results");
const V2 = path.join(import.meta.dirname, "seek-ab-decode-side-v2-analyze.mjs");

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}
function mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
function sd(a) {
  if (a.length < 2) return null;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}
function stats(a) {
  return a.length ? { n: a.length, median: +median(a).toFixed(3), mean: +mean(a).toFixed(3), sd: sd(a) === null ? null : +sd(a).toFixed(3), min: +Math.min(...a).toFixed(3), max: +Math.max(...a).toFixed(3) } : { n: 0 };
}
// Khoảng tin cậy Welch 95% cho chênh lệch trung bình (single - retry),
// dùng phân vị t xấp xỉ: t≈2.776 (df nhỏ, bảo thủ cho n<=8/phía khi
// df Welch < 10); công thức ghi rõ trong output để kiểm tra lại.
function welchCI(a, b) {
  if (a.length < 2 || b.length < 2) return null;
  const ma = mean(a); const mb = mean(b);
  const va = sd(a) ** 2 / a.length; const vb = sd(b) ** 2 / b.length;
  const se = Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  const t = df >= 10 ? 2.228 : 2.776; // bảo thủ khi df nhỏ
  const diff = mb - ma;
  return { diff: +diff.toFixed(3), diffPctOfRetryMean: +(100 * diff / ma).toFixed(2), se: +se.toFixed(3), df: +df.toFixed(1), tUsed: t, lo: +(diff - t * se).toFixed(3), hi: +(diff + t * se).toFixed(3), loPct: +(100 * (diff - t * se) / ma).toFixed(2), hiPct: +(100 * (diff + t * se) / ma).toFixed(2) };
}
// Cỡ mẫu/phía cần để phát hiện hiệu ứng 10% với power 80% (z=1.96+0.84),
// từ độ lệch chuẩn gộp quan sát: n ≈ 2 * ((2.80 * sdPooled) / (0.10*meanRetry))^2.
function requiredN(a, b) {
  if (a.length < 2 || b.length < 2) return null;
  const sp = Math.sqrt(((a.length - 1) * sd(a) ** 2 + (b.length - 1) * sd(b) ** 2) / (a.length + b.length - 2));
  const delta = 0.10 * mean(a);
  return Math.ceil(2 * ((2.80 * sp) / delta) ** 2);
}

function load36() {
  const out = [];
  for (const f of fs.readdirSync(RES).filter((x) => /^v36-s1-seek-ab-(retry|single)-b\d+\.json$/.test(x)).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(RES, f), "utf8"));
    out.push({ file: f, ...d });
  }
  return out;
}
function loadR1v2() {
  const dir = path.join(os.homedir(), "workspace", "tmp-round35-r1", "runs");
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const run of fs.readdirSync(dir).sort()) {
    const fh = path.join(dir, run, "forward-hold.json");
    const merged = path.join(RES, `v35-r1-seek-ab-${run}.json`);
    if (!fs.existsSync(fh) || !fs.existsSync(merged)) continue;
    const m = JSON.parse(fs.readFileSync(merged, "utf8"));
    const v2 = JSON.parse(execFileSync("node", [V2, fh], { encoding: "utf8" }));
    const variant = run.startsWith("retry") ? "retry" : "single";
    out.push({
      file: `v35-r1-seek-ab-${run}.json`, run, variant,
      fps: m.reverseFps, loadLabel: m.loadLabel, decodeLabelV1: m.decodeSide.decodeLabel,
      decodeLabelV2: v2.decodeLabel, decodeReasonsV2: v2.reasons,
      tailMean: v2.signals.tailMean, tailMax: v2.signals.tailMax,
      acceptedV2: m.loadLabel === "quiet" && v2.decodeLabel === "HEALTHY",
    });
  }
  return out;
}

function summarizeSet(rows, label) {
  const acc = { retry: [], single: [] };
  for (const r of rows) if (r.acceptedV2 ?? r.accepted) acc[r.variant].push(r.fps ?? r.reverseFps);
  const pairs = [];
  const n = Math.min(acc.retry.length, acc.single.length);
  // Ghép theo thứ tự nhận: sắp xếp accepted theo tên run (b1..b8 / a1..a6
  // đã là thứ tự chạy xen kẽ; thứ tự file sort tương đương thứ tự nhận
  // khi mọi lượt bị loại đã tách riêng — ghi rõ giả định này).
  // Ghép cặp CHỈ trong cùng phiên (cùng session): ghép xuyên phiên
  // (ví dụ retry-b7 với single-a1) là vô nghĩa vì mức tuyệt đối trôi
  // giữa các phiên (xem LIMITS S1 §5). Tập gộp 36+R1 vì vậy chỉ có
  // các cặp cùng phiên b (b6/b7); các lượt R1 đã có cặp riêng ở tập
  // round35R1ReclassifiedV2 và không ghép lại ở đây.
  const retryAcc = rows.filter((r) => r.variant === "retry" && (r.acceptedV2 ?? r.accepted));
  const singleAcc = rows.filter((r) => r.variant === "single" && (r.acceptedV2 ?? r.accepted));
  const pairedSingle = new Set();
  let pairNo = 0;
  for (const rr of retryAcc) {
    const s = singleAcc.find((x) => !pairedSingle.has(x.run) && (rr.session === undefined || x.session === undefined || x.session === rr.session));
    if (!s) continue;
    pairedSingle.add(s.run);
    pairNo++;
    const rf = rr.fps ?? rr.reverseFps;
    const sf = s.fps ?? s.reverseFps;
    pairs.push({ pair: pairNo, retry: rr.run, single: s.run, ratio: +(sf / rf).toFixed(4) });
  }
  const ci = welchCI(acc.retry, acc.single);
  // "Khóa được hiệu ứng <10%" = toàn bộ CI 95% nằm trong [-10%, +10%]
  // (dấu của CI không quan trọng: CI [-3%, +2%] vẫn khóa được vì
  // |hiệu ứng| < 10% với độ tin cậy 95%).
  const locked = ci !== null && ci.loPct >= -10 && ci.hiPct <= 10
    ? "KHÓA ĐƯỢC (toàn bộ CI 95% nằm trong ±10%)"
    : (ci !== null
      ? "CHƯA KHÓA ĐƯỢC (CI 95% vẫn chạm/vượt ±10%)"
      : "CHƯA ĐỦ DỮ LIỆU cho CI (cần n>=2/phía)");
  return {
    set: label, retry: stats(acc.retry), single: stats(acc.single),
    medianRatioSingleOverRetry: acc.retry.length && acc.single.length ? +(median(acc.single) / median(acc.retry)).toFixed(4) : null,
    meanRatioSingleOverRetry: acc.retry.length && acc.single.length ? +(mean(acc.single) / mean(acc.retry)).toFixed(4) : null,
    pairsByAcceptanceOrder: pairs, welchCI_singleMinusRetry: ci,
    requiredNPerSideFor10pct: requiredN(acc.retry, acc.single),
    smallEffectLockVerdict: locked,
  };
}

const rows36 = load36().map((r) => ({
  run: r.run, variant: r.variant, fps: r.reverseFps, loadLabel: r.loadLabel,
  decodeLabelV2: r.decodeSide?.decodeLabel ?? null, acceptedV2: r.accepted === true && r.decodeSide?.decodeLabel === "HEALTHY" ? true : (r.accepted ?? false),
  exclusionReasons: r.exclusionReasons ?? (r.exclusionReason ? [r.exclusionReason] : []),
  gateTimeout: !r.reverseFps,
}));
// accepted của runner36 đã = quiet && v2 HEALTHY (runner kiểm tra cả
// hai); acceptedV2 ở trên tái khẳng định từ decodeLabel để tránh
// trường hợp file gate-timeout (không có reverseFps) lọt vào.
for (const r of rows36) if (r.gateTimeout) r.acceptedV2 = false;
const rowsR1 = loadR1v2();
const pooled = [
  ...rows36.filter((r) => !r.gateTimeout).map((r) => ({ ...r, session: "36" })),
  ...rowsR1.map((r) => ({ ...r, session: "R1" })),
].map((r) => ({
  run: r.run, variant: r.variant, fps: r.fps, acceptedV2: r.acceptedV2, session: r.session,
}));
const out = {
  generatedBy: "seek-ab36-summarize.mjs (đợt 36 S1)",
  note: "Cặp ghép theo thứ tự nhận trong từng tập; tập gộp (36+R1) chỉ hợp lệ vì cùng bundle đóng băng R1 (retry BqxQgBuf / single xfaJXEFE, 212 module) — xem LIMITS S1.",
  round36: { runs: rows36, summary: summarizeSet(rows36, "round36-only") },
  round35R1ReclassifiedV2: { runs: rowsR1, summary: summarizeSet(rowsR1, "round35R1-under-v2") },
  pooled36PlusR1: summarizeSet(pooled, "pooled-36+R1-v2"),
};
const text = JSON.stringify(out, null, 2);
if (process.argv[2]) writeFileEpermRetry(process.argv[2], text);
console.log(text);
