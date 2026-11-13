#!/usr/bin/env node
/**
 * deint-fps-verdict-83k3.mjs — Phase 9 đợt 83, luồng K3: verdict FPS
 * deint-only theo TRUNG VỊ 5 lần chạy thay vì 1 lần chạy đơn lẻ.
 *
 * Bối cảnh: G1 (đợt 79) đóng deint FPS theo verdict 1 lần chạy
 * (clicktest-77e1-deint-fps.mjs G5: mean 5 tỉ lệ drift-corrected ≥
 * 0.75×). I5 (đợt 81) và J3 (đợt 82) chứng minh verdict 1 lần là
 * tung đồng xu có lệch: 3/15 lần code mới FAIL dù code không đổi,
 * SD từng-lần 0,16, CI 95% của median gộp chạm ngưỡng ([0,74; 1,03]).
 * J3 §6.1 đề xuất: "PASS ổn định" ⟺ median 5 lần ≥ 0,75× VÀ ≥4/5
 * lần ≥ 0,75×. K3 đo lại trên VM này với cả hai luật và chốt luật
 * này — xem docs/PHASE9_ROUND83_K3_DEINT_VERDICT_MEDIAN_LIMITS.md.
 *
 * Luật verdict (ngưỡng 0,75× giữ nguyên, không nới):
 *   (a) luật cũ — 1 lần: PASS ⟺ mean 5 tỉ lệ của lần đó ≥ 0,75×.
 *   (b) luật mới — median 5 lần: "PASS ổn định" ⟺ median của 5
 *       mean-từng-lần ≥ 0,75× VÀ ≥ 4/5 lần ≥ 0,75×.
 * Luật (b) là verdict CHÍNH cho deint FPS từ đợt 83 trở đi. Luật
 * (a) vẫn được tính và ghi lại để so độ ổn định (tỉ lệ lật verdict).
 *
 * KHÔNG sửa harness E1 (clicktest-77e1-deint-fps.mjs): G5 trong
 * harness vẫn verdict theo 1 lần như cũ để giữ khả năng so sánh
 * với toàn bộ lịch sử 15 lần đo; verdict median được áp ở tầng
 * gộp 5 lần — tức script này. Đổi G5 trong harness sẽ phá nghĩa
 * của mọi số lịch sử và của cửa 10/10.
 *
 * Cách dùng (từ gốc repo):
 *   # Đo 5 lần headed E1 liên tiếp rồi verdict (mỗi lần ~3-5 phút):
 *   node apps/web/scripts/deint-fps-verdict-83k3.mjs measure <outdir>
 *   # Chỉ verdict từ các report JSON đã có (đọc headed-runN/c77e1...):
 *   node apps/web/scripts/deint-fps-verdict-83k3.mjs analyze <dir...>
 *   # Test hồi quy luật median (offline, không cần headed):
 *   node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
 * Exit: 0 khi luật (b) PASS ổn định, 1 khi không đạt / thiếu dữ
 * liệu / harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import path from "node:path";

export const THRESHOLD = 0.75;
export const N_RUNS = 5;
export const MIN_PASS_COUNT = 4;
// Đợt 90 R6 (Q7 §7.4): slot "đóng băng" = draw < 0,5 fps (N10: slot
// 0,00 / 0,27 fps) — ghi kèm mọi verdict. Cùng ngưỡng với harness E1.
export const FROZEN_FPS = 0.5;

/** Trung vị (sắp xếp, không đổi mảng gốc). */
export function medianOf(values) {
  if (!values.length) throw new Error("medianOf: mảng rỗng");
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Mean + CI 95% (t-Student, bảng rút gọn như analyze-82j3). */
export function meanCI(values, conf = 0.95) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (n < 2 || conf !== 0.95) return { mean, lo: mean, hi: mean };
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1));
  const ttab = { 2: 12.706, 3: 4.303, 4: 3.182, 5: 2.776, 6: 2.571, 7: 2.447, 8: 2.365, 9: 2.306, 10: 2.262, 15: 2.131, 20: 2.086 };
  const t = ttab[n] ?? 2.0;
  const h = (t * sd) / Math.sqrt(n);
  return { mean, lo: mean - h, hi: mean + h, sd };
}

/**
 * Verdict cả hai luật từ danh sách mean-từng-lần (G5 của mỗi lần E1).
 * @param {number[]} runMeans — mean 5 tỉ lệ drift-corrected mỗi lần.
 * @param {number} threshold — ngưỡng, mặc định 0.75.
 * @returns {{ n, threshold, ruleA: {passes, passCount, flipRate},
 *   ruleB: {median, passCount, pass, margin}, ci }}
 * ruleA.passes: PASS/FAIL từng lần theo luật cũ.
 * ruleB.pass: "PASS ổn định" ⟺ median ≥ ngưỡng VÀ ≥4/5 lần ≥ ngưỡng.
 * flipRate: tỉ lệ lần chạy mà luật (a) cho kết quả khác với đa số
 * (đo độ bất ổn của verdict 1 lần: 0 = mọi lần đồng thuận).
 */
export function deintFpsVerdict(runMeans, threshold = THRESHOLD) {
  if (!Array.isArray(runMeans) || runMeans.length === 0) {
    throw new Error("deintFpsVerdict: cần ít nhất 1 mean từng-lần");
  }
  for (const v of runMeans) {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`deintFpsVerdict: mean không hợp lệ: ${v}`);
    }
  }
  const passes = runMeans.map((m) => m >= threshold);
  const passCount = passes.filter(Boolean).length;
  const median = medianOf(runMeans);
  const majorityPass = passCount * 2 > runMeans.length;
  const flips = passes.filter((p) => p !== majorityPass).length;
  return {
    n: runMeans.length,
    threshold,
    ruleA: { passes, passCount, flipRate: flips / runMeans.length },
    ruleB: {
      median,
      passCount,
      // Đủ 5 lần mới kết luận "PASS ổn định"; tỉ lệ PASS yêu cầu
      // ≥4/5 (tức ≥ 80%) — áp theo tỉ lệ, không theo số tuyệt đối,
      // để đúng cả khi gộp >5 lần (vd 10 lần cần ≥8/10).
      pass: runMeans.length >= N_RUNS && median >= threshold && passCount / runMeans.length >= MIN_PASS_COUNT / N_RUNS,
      enoughRuns: runMeans.length >= N_RUNS,
      margin: median - threshold,
    },
    ci: meanCI(runMeans),
  };
}

/**
 * Đợt 96 X6 — metric FPS "frozen-safe" M2 (đề xuất, KHÔNG thay G5):
 * G5 cũ (mean 5 tỉ lệ drift-corrected) phồng theo hai chế độ đã đo
 * được trên số thật:
 *   (A) mẫu số đóng băng — W6 e1-run1: tỉ lệ 4,27× do mẫu số kề
 *       0,15 fps (slot baseline 0 fps); G5 cả lần phồng lên 1,82×.
 *   (B) tử số đột biến — R6 e1-verify-run1: tỉ lệ 4,34× do slot
 *       deint 8,4 fps trong lúc máy thoáng tải (mẫu số kề 1,94 fps
 *       bình thường); G5 cả lần 1,58×, tỉ lệ thô còn 1,69×.
 * M2 xử lý cả hai: LOẠI tỉ lệ có mẫu số kề < FROZEN_FPS (0,5 fps —
 * slot đóng băng không mang thông tin tốc độ), rồi lấy MEDIAN các
 * tỉ lệ còn lại (median kháng 2 outlier trong 5). Cần ≥3 tỉ lệ hợp
 * lệ mới verdict; dưới 3 → valid=false (không verdict, không bịa số).
 * Slot deint đóng băng (tử số 0) vẫn GIỮ — deint kẹt thật là tín
 * hiệu, không phải artefact (S6 e1-run1: slot deint 0 fps → tỉ lệ
 * 0,0 giữ trong M2, median 0,57).
 * M2mean (mean sau khi loại) và M2b (tỉ lệ thô mean deint / mean
 * baseline) và M2c (median 5 tỉ lệ cũ, không loại) được trả kèm để
 * đối chiếu — M2mean chỉ sửa (A), M2c chỉ sửa (B), M2 sửa cả hai.
 * G5 KHÔNG đổi: mọi số lịch sử và cửa 10/10 giữ nguyên nghĩa.
 * Tính lại trên report đã có: xem analyze-m2-metric.py (đợt 96 X6).
 *
 * @param {object} report — report JSON của harness E1 / probe N10
 *   (cần fpsSlots 11 slot xen kẽ baseline/combo, bắt đầu baseline).
 * @returns {{ valid, g5, ratios, neighbors, excluded, kept,
 *   m2, m2mean, m2b, m2c, baselineMean, frozenSlots, frozenCount }}
 */
export function g5FrozenSafeFromReport(report) {
  const slots = report.fpsSlots ?? [];
  if (slots.length < 11) throw new Error(`report thiếu fpsSlots (có ${slots.length}, cần 11)`);
  const draw = slots.map((s) => s.drawFps);
  const ratios = [];
  const neighbors = [];
  for (const i of [1, 3, 5, 7, 9]) {
    const neigh = (draw[i - 1] + draw[i + 1]) / 2;
    neighbors.push(+neigh.toFixed(2));
    // Mẫu số 0 → tỉ lệ không xác định (null), M2 loại nó như mẫu số
    // đóng băng; G5 cũ không tính được thì để null thay vì bịa số.
    ratios.push(neigh > 0 ? +(draw[i] / neigh).toFixed(2) : null);
  }
  const base = [0, 2, 4, 6, 8, 10].map((i) => draw[i]);
  const combo = [1, 3, 5, 7, 9].map((i) => draw[i]);
  const baselineMean = +(base.reduce((a, b) => a + b, 0) / base.length).toFixed(2);
  const g5 = ratios.some((r) => r === null)
    ? null
    : +((ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2));
  // Loại tỉ lệ có mẫu số kề đóng băng (< 0,5 fps, gồm cả 0); tử số 0 vẫn giữ.
  const excluded = neighbors.map((nb, k) => (nb < FROZEN_FPS ? k : -1)).filter((k) => k >= 0);
  const kept = ratios.filter((r, k) => r !== null && !excluded.includes(k));
  const m2b = +((combo.reduce((a, b) => a + b, 0) / combo.length) / baselineMean).toFixed(2);
  const frozenSlots = slots.map((s, i) => (s.drawFps < FROZEN_FPS ? i : -1)).filter((i) => i >= 0);
  const out = {
    valid: kept.length >= 3,
    g5,
    ratios,
    neighbors,
    excluded,
    kept: kept.length,
    m2: null,
    m2mean: null,
    m2b,
    m2c: ratios.some((r) => r === null) ? null : +medianOf(ratios).toFixed(2),
    baselineMean,
    frozenSlots,
    frozenCount: frozenSlots.length,
  };
  if (out.valid) {
    out.m2 = +medianOf(kept).toFixed(2);
    out.m2mean = +((kept.reduce((a, b) => a + b, 0) / kept.length).toFixed(2));
  }
  return out;
}

/** Tính lại G5 mean từ report JSON của harness E1 (cùng công thức harness). */
export function g5MeanFromReport(report) {
  const slots = report.fpsSlots ?? [];
  if (slots.length < 11) throw new Error(`report thiếu fpsSlots (có ${slots.length}, cần 11)`);
  const draw = slots.map((s) => s.drawFps);
  const ratio = (i) => {
    const neigh = (draw[i - 1] + draw[i + 1]) / 2;
    return neigh > 0 ? draw[i] / neigh : null;
  };
  const ratios = [1, 3, 5, 7, 9].map(ratio);
  if (ratios.some((r) => r === null)) throw new Error("tỉ lệ drift-corrected có mẫu số 0");
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const base = [0, 2, 4, 6, 8, 10].map((i) => draw[i]);
  // Đợt 90 R6 (Q7 §7.4): slot đóng băng (draw < 0,5 fps) ghi kèm mọi
  // verdict — slot chết đứng không được mean tỉ lệ che đi.
  const frozenSlots = slots.map((s, i) => (s.drawFps < FROZEN_FPS ? i : -1)).filter((i) => i >= 0);
  return {
    mean: +mean.toFixed(2),
    ratios: ratios.map((r) => +r.toFixed(2)),
    baselineMean: +(base.reduce((a, b) => a + b, 0) / base.length).toFixed(2),
    draw,
    frozenSlots,
    frozenCount: frozenSlots.length,
  };
}

function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}

function readReports(dirs) {
  const runs = [];
  for (const d of dirs) {
    const files = fs.readdirSync(d).filter((f) => f.startsWith("headed-run"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    for (const f of files) {
      const jf = path.join(d, f, "c77e1-headed-report.json");
      if (!fs.existsSync(jf)) { console.log(`SKIP ${jf}: không có report`); continue; }
      try {
        const r = JSON.parse(fs.readFileSync(jf, "utf8"));
        const g5 = g5MeanFromReport(r);
        const g5case = (r.cases ?? []).find((c) => c.name.includes("G5"));
        runs.push({ dir: path.join(d, f), ...g5, harnessPass: g5case?.ok ?? null, harnessTotal: `${r.pass}/${r.total}` });
      } catch (e) { console.log(`SKIP ${jf}: ${e.message}`); }
    }
  }
  return runs;
}

function printVerdict(runs) {
  const means = runs.map((r) => r.mean);
  const v = deintFpsVerdict(means);
  const totalFrozen = runs.reduce((a, r) => a + (r.frozenCount ?? 0), 0);
  console.log(`\n== Verdict deint FPS (${runs.length} lần chạy, ngưỡng ${v.threshold}×) ==`);
  for (const r of runs) {
    const frozenNote = (r.frozenCount ?? 0) > 0
      ? `, slot đóng băng ${r.frozenCount}/11 (slot ${(r.frozenSlots ?? []).join(",")})`
      : ", không slot đóng băng";
    console.log(`  ${path.basename(r.dir)}: mean ${r.mean}× [${r.ratios.join(" / ")}] baseline ${r.baselineMean} fps, harness ${r.harnessTotal} (G5 ${r.harnessPass === null ? "?" : r.harnessPass ? "PASS" : "FAIL"})${frozenNote}`);
  }
  console.log(`  Slot đóng băng tổng: ${totalFrozen} slot / ${runs.length * 11} slot`);
  console.log(`  Luật (a) 1 lần: ${v.ruleA.passCount}/${v.n} PASS, tỉ lệ lật verdict ${v.ruleA.flipRate.toFixed(2)}`);
  console.log(`  Luật (b) median ${v.n}: median ${v.ruleB.median.toFixed(3)}× (biên ${v.ruleB.margin >= 0 ? "+" : ""}${v.ruleB.margin.toFixed(3)} so với ngưỡng), ${v.ruleB.passCount}/${v.n} lần ≥ ngưỡng, CI 95% mean [${v.ci.lo.toFixed(3)}; ${v.ci.hi.toFixed(3)}]`);
  console.log(`  => Luật (b): ${v.ruleB.pass ? "PASS ỔN ĐỊNH" : "CHƯA ĐẠT PASS ỔN ĐỊNH"}${v.ruleB.enoughRuns ? "" : ` (chỉ ${v.n}/5 lần — chưa đủ mẫu)`}`);
  return v;
}

async function runOneE1(outdir, idx) {
  const scratch = path.join(outdir, `headed-run${idx}`);
  fs.mkdirSync(scratch, { recursive: true });
  const env = {
    ...process.env,
    E1_SCRATCH: scratch,
    E1_DEV_PORT: String(5590 + idx - 1),
    E1_DEBUG_PORT: String(9690 + idx - 1),
    E1_DISPLAY: `:${189 + idx}`,
  };
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
  console.log(`\n--- E1 lần ${idx}/5 (scratch ${scratch}, load ${loadAvg()}) ---`);
  const started = Date.now();
  const code = await new Promise((resolve) => {
    const p = spawn("node", [path.join(root, "apps", "web", "scripts", "clicktest-77e1-deint-fps.mjs")],
      { env, stdio: ["ignore", "pipe", "pipe"] });
    let tail = "";
    p.stdout.on("data", (d) => { tail += d; });
    p.stderr.on("data", (d) => { tail += d; });
    p.on("error", (e) => { console.log(`lần ${idx}: spawn lỗi: ${e.message}`); resolve(2); });
    p.on("close", (c) => {
      const logFile = path.join(scratch, "..", `run${idx}-console.log`);
      try { writeFileEpermRetry(logFile, tail); } catch {}
      console.log(`lần ${idx}: harness exit ${c} sau ${((Date.now() - started) / 1000).toFixed(0)}s, load ${loadAvg()}`);
      resolve(c ?? 2);
    });
  });
  return { idx, scratch, exitCode: code };
}

const mode = process.argv[2];
// Đợt 90 R6 (L3 §7.5): bọc lỗi trước-try cho verdict script — mọi
// throw trong dispatch (mkdir outdir, đọc report, ghi summary) in
// lỗi cấu trúc thay vì stack thô, exit 2. E1 con tự killAll trong
// finally của nó nên không có process mồ côi từ script này.
try {
if (mode === "analyze" || mode === "measure") {
  const dirs = process.argv.slice(3);
  if (mode === "analyze" && dirs.length === 0) {
    console.error("Dùng: node deint-fps-verdict-83k3.mjs analyze <dir...>");
    process.exit(2);
  }
  if (mode === "measure") {
    const outdir = dirs[0] || path.join(process.env.HOME, "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round83-k3");
    fs.mkdirSync(outdir, { recursive: true });
    console.log(`Đo 5 lần E1 headed vào ${outdir} — VM uptime/load lúc bắt đầu: ${loadAvg()}`);
    for (let i = 1; i <= N_RUNS; i++) {
      const r = await runOneE1(outdir, i);
      if (r.exitCode === 2) console.log(`lần ${i}: HARNESS LỖI (exit 2) — report có thể thiếu, sẽ SKIP khi verdict`);
    }
    const runs = readReports([outdir]);
    if (!runs.length) { console.error("Không có report nào — verdict không thể tính."); process.exit(2); }
    const v = printVerdict(runs);
    // Đợt 90 R6 (Q7 §3.1): ghi summary bọc try/catch — Q7 crash sau khi
    // đã in verdict vì write này ném EPERM, làm mất cả summary lẫn
    // exit code verdict. Nay ghi fail chỉ cảnh báo, verdict + exit
    // code vẫn theo luật; số vẫn đọc lại được từ report JSON + log.
    try {
      writeFileEpermRetry(path.join(outdir, "k3-verdict-summary.json"),
        JSON.stringify({ runs, verdict: v, measuredAt: new Date().toISOString(), loadAtStart: loadAvg() }, null, 2));
    } catch (e) {
      console.error(`CẢNH BÁO: không ghi được k3-verdict-summary.json: ${e.message} (verdict trên vẫn đúng — xem measure-stdout.log + report JSON)`);
    }
    process.exit(v.ruleB.pass ? 0 : 1);
  } else {
    const runs = readReports(dirs);
    if (!runs.length) { console.error("Không có report nào."); process.exit(2); }
    const v = printVerdict(runs);
    process.exit(v.ruleB.pass ? 0 : 1);
  }
} else if (import.meta.url === `file://${process.argv[1]}`) {
  console.error("Dùng: node deint-fps-verdict-83k3.mjs <measure|analyze> <dir...>");
  process.exit(2);
}
} catch (e) {
  console.error(`VERDICT SCRIPT LỖI: ${e && e.message ? e.message : e}`);
  process.exit(2);
}
