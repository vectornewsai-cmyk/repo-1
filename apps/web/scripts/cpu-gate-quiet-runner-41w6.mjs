#!/usr/bin/env node
/**
 * cpu-gate-quiet-runner-41w6.mjs — Runner quiet CÓ ĐIỀU PHỐI cho cổng CPU
 * (Phase 9 đợt 41, luồng W6; nợ đợt 40 §5.3, V6).
 *
 * Vấn đề: cổng CPU (cpuGate39T6.ts, locked:false) trượt cả 3 bộ số thật
 * chỉ ở tiêu chí Node busy > 50, và cả 3 bộ đều đo under-load (U4:
 * 41,4/55,0/58,9; T6 lần 1: 39,9/39,4/39,4; T6 lần 2: 77,4/39,4/39,5),
 * trong khi idle luôn đạt. Cấm khóa từ dữ liệu under-load — vì vậy
 * runner này KHÔNG đo probe khi máy bận, và KHÔNG BAO GIỜ khóa cổng:
 * mọi report nó ghi đều có locked:false và dòng "CHƯA KHÓA".
 *
 * Điều phối (ngưỡng yên GHI TRƯỚC, không sửa sau khi thấy số):
 *   QUIET khi TẤT CẢ 3 mẫu hệ thống (cách nhau 2000 ms) đều thỏa:
 *     - load1  < 0.25 × nproc   (máy 4 core: < 1,0)
 *     - load5  < 0.50 × nproc   (máy 4 core: < 2,0)
 *     - memAvailable / memTotal >= 0,20
 *
 * THỨ TỰ ĐÁNH GIÁ — ĐỢT 42 X6 (RAM TRƯỚC, KHÔNG NỚI NGƯỠNG):
 *   Đợt 41 W6 phát hiện runner trượt vì RAM available chỉ 4–10%
 *   (ngưỡng 20%) trong khi CPU dần yên, nhưng báo cáo liệt kê
 *   blocker theo thứ tự load trước RAM và verdict REFUSED-BUSY
 *   không chỉ rõ nguyên nhân trượt đầu tiên. Từ đợt 42, thứ tự
 *   đánh giá và báo cáo là: RAM → CPU load → busy. Cụ thể:
 *     1. evaluateQuietGate() xét memAvailable TRƯỚC load1/load5:
 *        blockers xếp RAM lên đầu, firstFailedGate/firstFailure
 *        nêu đúng gate trượt đầu tiên theo thứ tự này.
 *     2. busy (chẩn đoán Node V6) CHỈ được hỏi SAU KHI cổng yên
 *        đạt và probe đã chạy — nếu cổng yên trượt thì report ghi
 *        rõ busy chưa được đánh giá (không phải busy trượt).
 *   Verdict REFUSED-BUSY và locked:false giữ nguyên (verdict là mã
 *   điều phối cũ, wrapper dựa vào exit code 2; nguyên nhân thật
 *   nằm ở firstFailedGate). Ngưỡng RAM 20% KHÔNG đổi, KHÔNG có
 *   biến môi trường override ngưỡng (xem LIMITS đợt 42 X6 §4:
 *   override qua env sẽ phá nguyên tắc "ngưỡng ghi trước").
 *   Lý do chọn: busy-loop cần gần như 1 core rảnh; load1 từ ~1 core
 *   runnable trở lên đã đủ đè busy-loop xuống mức phẳng ~39% như T6
 *   thấy; RAM available < 20% là trạng thái đi kèm các phiên tải nặng
 *   đã ghi ở đợt 39/40 (RAM dùng ~88%). Một mẫu yên lẻ không đủ —
 *   phải yên bền qua 3 mẫu mới đo, để không đo trúng một khe yên
 *   thoáng qua giữa các luồng khác.
 *
 * Mã thoát (đã ghi trước, wrapper W6 dựa vào đúng mã này):
 *   0 = cổng yên (và probe đã chạy, trừ --gate-only) + report đã ghi.
 *       Vẫn CHƯA KHÓA: report chỉ là bằng chứng để phiên quyết khóa
 *       xem xét, không phải quyết định khóa.
 *   2 = TỪ CHỐI vì máy bận/under-load + report đã ghi. Đây là kết quả
 *       HỢP LỆ, không phải lỗi runner — và probe KHÔNG chạy trong
 *       trường hợp này (không tạo thêm dữ liệu under-load để ai đó
 *       vô tình dùng khóa).
 *   1 = lỗi thực thi (không đọc được /proc, sampler lỗi, helper lỗi).
 *
 * Khi yên, probe chạy ĐÚNG protocol phần (a) của U4 (3 vòng, mỗi vòng
 * spawn đồng thời busy-loop + idle, lấy mẫu cây tiến trình 2000 ms
 * bằng sampleCpuTree gốc — không sampler riêng, không ngưỡng riêng).
 * Mỗi vòng ghi loadavg trước/sau; chẩn đoán cuối chạy qua module V6
 * gốc cpuGateNodeDiag40V6.ts (helper strip-types, không copy logic).
 * Tầng CDP KHÔNG đo ở runner này (T6 đã phân biệt CDP 3/3; khóa thật
 * vẫn cần phiên U4 đầy đủ CDP + Node lúc yên — xem LIMITS W6 §3).
 *
 * Chạy:
 *   node apps/web/scripts/cpu-gate-quiet-runner-41w6.mjs [--gate-only]
 *     [--out <report.json>] [--rounds 3] [--window-ms 2000]
 * Mặc định --out ghi vào /tmp/round41-w6/ (scratch của luồng W6);
 * phiên quiet sau này muốn giữ report bền thì truyền --out tới
 * benchmarks/results/… một cách tường minh.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sampleCpuTree } from "./cdp-cpu-sample.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const DIAG_HELPER = path.join(SCRIPTS_DIR, "cpu-gate-quiet-diag-41w6.ts");

/** Dòng từ chối bắt buộc in ra khi máy bận — test khóa chuỗi này. */
export const REFUSAL_LINE = "CHƯA KHÓA — máy bận/under-load";

/** Ngưỡng yên ghi trước (xem đầu file). */
export const QUIET_GATE_DEFAULTS = {
  load1PerCore: 0.25,
  load5PerCore: 0.5,
  memAvailableMinFrac: 0.2,
  minSamples: 3,
  sampleIntervalMs: 2000,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Một mẫu tải hệ thống: loadavg + RAM available (ghi rõ nguồn). */
export function sampleSystemLoad() {
  const [load1, load5, load15] = os.loadavg();
  const nproc = os.cpus().length;
  let memTotal = os.totalmem();
  let memAvailable = os.freemem();
  let memSource = "os-freemem-fallback";
  try {
    const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
    const total = /MemTotal:\s+(\d+)\s+kB/.exec(meminfo);
    const avail = /MemAvailable:\s+(\d+)\s+kB/.exec(meminfo);
    if (total && avail) {
      memTotal = Number(total[1]) * 1024;
      memAvailable = Number(avail[1]) * 1024;
      memSource = "proc-meminfo";
    }
  } catch { /* giữ fallback, nguồn đã ghi rõ */ }
  return {
    at: new Date().toISOString(),
    load1: Number(load1.toFixed(2)),
    load5: Number(load5.toFixed(2)),
    load15: Number(load15.toFixed(2)),
    nproc,
    memTotalBytes: memTotal,
    memAvailableBytes: memAvailable,
    memAvailableFrac: Number((memAvailable / memTotal).toFixed(4)),
    memSource,
  };
}

function checkSample(s, cfg, nproc) {
  // Thứ tự key RAM trước (đợt 42 X6): báo cáo per-sample cũng đọc
  // RAM trước load, khớp thứ tự đánh giá của evaluateQuietGate.
  return {
    memAvailable: s.memAvailableFrac >= cfg.memAvailableMinFrac,
    load1: s.load1 < cfg.load1PerCore * nproc,
    load5: s.load5 < cfg.load5PerCore * nproc,
  };
}

/**
 * Đánh giá cổng yên trên nhiều mẫu. Yên chỉ khi ĐỦ mẫu VÀ mọi mẫu đều
 * đạt mọi tiêu chí (một mẫu spike cũng đủ chặn — chống khe yên ảo).
 * Thuần, không I/O — test được bằng fixture, không cần máy yên thật.
 *
 * THỨ TỰ RAM TRƯỚC (đợt 42 X6): blockers xếp theo RAM → load1 →
 * load5 → thiếu mẫu, và firstFailedGate/firstFailure nêu đúng gate
 * trượt đầu tiên theo thứ tự đó — bất kể mẫu nào trượt trước về
 * mặt thời gian. busy KHÔNG nằm trong hàm này: busy chỉ được hỏi
 * sau khi cổng yên đạt (xem main() và LIMITS X6); khi cổng trượt,
 * firstFailedGate không bao giờ là "busy".
 */
export function evaluateQuietGate(samples, cfg = QUIET_GATE_DEFAULTS, nproc = os.cpus().length) {
  const perSample = samples.map((s) => ({ sample: s, checks: checkSample(s, cfg, nproc) }));
  // Vòng 1 — RAM trước: mọi blocker memAvailable, theo thứ tự mẫu.
  const blockers = [];
  for (const { sample } of perSample.filter((p) => !p.checks.memAvailable)) {
    blockers.push(`memAvailable ${(sample.memAvailableFrac * 100).toFixed(1)}% < ${(cfg.memAvailableMinFrac * 100).toFixed(0)}%`);
  }
  // Vòng 2 — CPU load.
  for (const { sample } of perSample.filter((p) => !p.checks.load1)) {
    blockers.push(`load1 ${sample.load1} >= ${(cfg.load1PerCore * nproc).toFixed(2)} (0.25×${nproc} core)`);
  }
  for (const { sample } of perSample.filter((p) => !p.checks.load5)) {
    blockers.push(`load5 ${sample.load5} >= ${(cfg.load5PerCore * nproc).toFixed(2)} (0.50×${nproc} core)`);
  }
  // Vòng 3 — thiếu mẫu (chỉ có nghĩa khi các gate trên đã xét xong).
  if (samples.length < cfg.minSamples)
    blockers.push(`chỉ ${samples.length} mẫu, cần >= ${cfg.minSamples}`);
  const quiet = samples.length >= cfg.minSamples && perSample.every((p) => Object.values(p.checks).every(Boolean));
  // Gate trượt đầu tiên theo thứ tự RAM → load1 → load5 → thiếu mẫu.
  let firstFailedGate = null;
  let firstFailure = null;
  const firstRamFail = perSample.find((p) => !p.checks.memAvailable);
  const firstLoad1Fail = perSample.find((p) => !p.checks.load1);
  const firstLoad5Fail = perSample.find((p) => !p.checks.load5);
  if (firstRamFail) {
    firstFailedGate = "memAvailable";
    firstFailure = `RAM: memAvailable ${(firstRamFail.sample.memAvailableFrac * 100).toFixed(1)}% < ${(cfg.memAvailableMinFrac * 100).toFixed(0)}%`;
  } else if (firstLoad1Fail) {
    firstFailedGate = "load1";
    firstFailure = `CPU: load1 ${firstLoad1Fail.sample.load1} >= ${(cfg.load1PerCore * nproc).toFixed(2)} (0.25×${nproc} core)`;
  } else if (firstLoad5Fail) {
    firstFailedGate = "load5";
    firstFailure = `CPU: load5 ${firstLoad5Fail.sample.load5} >= ${(cfg.load5PerCore * nproc).toFixed(2)} (0.50×${nproc} core)`;
  } else if (samples.length < cfg.minSamples) {
    firstFailedGate = "samples";
    firstFailure = `thiếu mẫu: chỉ ${samples.length} mẫu, cần >= ${cfg.minSamples}`;
  }
  return { quiet, perSample, blockers: [...new Set(blockers)], firstFailedGate, firstFailure };
}

/**
 * Probe Node 3 vòng, đúng protocol U4 phần (a). Chỉ ghi HÌNH DẠNG số
 * (busy/idle từng vòng + loadavg trước/sau); KHÔNG kết luận ngưỡng ở
 * đây — chẩn đoán ngưỡng thuộc về helper diagnoseNodeLayer.
 * sampleFn inject được để test smoke (mặc định sampleCpuTree gốc).
 */
export async function runNodeProbeRounds({ rounds = 3, windowMs = 2000, sampleFn = sampleCpuTree } = {}) {
  const out = [];
  for (let i = 0; i < rounds; i++) {
    const busy = spawn(process.execPath, ["-e", "while(true){}"], { stdio: "ignore" });
    const idle = spawn(process.execPath, ["-e", "setTimeout(()=>{},30000)"], { stdio: "ignore" });
    await sleep(500);
    const loadBefore = sampleSystemLoad();
    const [busySample, idleSample] = await Promise.all([
      sampleFn(busy.pid, windowMs),
      sampleFn(idle.pid, windowMs),
    ]);
    const loadAfter = sampleSystemLoad();
    try { busy.kill("SIGKILL"); } catch {}
    try { idle.kill("SIGKILL"); } catch {}
    if (!busySample.ok || !idleSample.ok) {
      throw new Error(`vòng ${i + 1}: sampler lỗi (busy ok=${busySample.ok}, idle ok=${idleSample.ok})`);
    }
    out.push({
      round: i + 1,
      loadBefore,
      loadAfter,
      busyCpuPctOneCore: Number(busySample.cpuPctOneCore.toFixed(1)),
      busyDeltaTicks: busySample.deltaTicks,
      idleCpuPctOneCore: Number(idleSample.cpuPctOneCore.toFixed(1)),
      idleDeltaTicks: idleSample.deltaTicks,
      windowMs,
    });
    console.log(`Node vòng ${i + 1}: busy=${busySample.cpuPctOneCore.toFixed(1)}% idle=${idleSample.cpuPctOneCore.toFixed(1)}% (load1 ${loadBefore.load1} → ${loadAfter.load1})`);
  }
  return out;
}

/** Chạy chẩn đoán V6 gốc qua helper strip-types (không copy logic). */
export function diagnoseWithV6Module(probeRounds) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w6-diag-"));
  const roundsFile = path.join(tmpDir, "rounds.json");
  writeFileEpermRetry(roundsFile, JSON.stringify(probeRounds, null, 2) + "\n");
  const r = spawnSync(process.execPath, ["--experimental-strip-types", DIAG_HELPER, roundsFile], { encoding: "utf8", timeout: 60000 });
  try { fs.unlinkSync(roundsFile); fs.rmdirSync(tmpDir); } catch {}
  if (r.status !== 0) throw new Error(`helper chẩn đoán lỗi: ${(r.stderr || r.stdout || "").slice(0, 500)}`);
  return JSON.parse(r.stdout);
}

function parseArgs(argv) {
  const args = { gateOnly: false, out: null, rounds: 3, windowMs: 2000 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--gate-only") args.gateOnly = true;
    else if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--rounds") args.rounds = Number(argv[++i]);
    else if (argv[i] === "--window-ms") args.windowMs = Number(argv[++i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(args.rounds) || args.rounds < 1) throw new Error("--rounds phải >= 1");
  if (!Number.isFinite(args.windowMs) || args.windowMs < 100) throw new Error("--window-ms phải >= 100");

  console.log(`[W6 quiet-runner] lấy ${QUIET_GATE_DEFAULTS.minSamples} mẫu cổng yên, cách nhau ${QUIET_GATE_DEFAULTS.sampleIntervalMs} ms…`);
  const samples = [];
  for (let i = 0; i < QUIET_GATE_DEFAULTS.minSamples; i++) {
    if (i > 0) await sleep(QUIET_GATE_DEFAULTS.sampleIntervalMs);
    samples.push(sampleSystemLoad());
    const s = samples[samples.length - 1];
    console.log(`  mẫu ${i + 1}: RAM available ${(s.memAvailableFrac * 100).toFixed(1)}% [${s.memSource}], loadavg ${s.load1}/${s.load5}/${s.load15} (${s.nproc} core)`);
  }
  const gate = evaluateQuietGate(samples);
  const outPath = args.out || path.join("/tmp/round41-w6", `cpu-quiet-run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  if (!gate.quiet) {
    const report = {
      schema: "w6-quiet-run-v1",
      date: new Date().toISOString(),
      verdict: "REFUSED-BUSY",
      locked: false,
      // Đợt 42 X6: nêu gate trượt đầu tiên NGAY ĐẦU note (RAM trước
      // CPU load; busy chưa được hỏi ở bước này nên không thể là
      // nguyên nhân — ghi rõ để khỏi đọc lệch như đợt 41).
      note: `${REFUSAL_LINE}: trượt đầu tiên — ${gate.firstFailure}. Cổng yên không đạt (${gate.blockers.join("; ")}). Busy CHƯA được đánh giá (chỉ hỏi sau khi cổng yên đạt). Probe KHÔNG chạy — không tạo dữ liệu under-load.`,
      gate: { quiet: false, firstFailedGate: gate.firstFailedGate, firstFailure: gate.firstFailure, blockers: gate.blockers, thresholds: QUIET_GATE_DEFAULTS },
      gateSamples: samples,
      probeRounds: null,
      diagnosis: null,
    };
    writeFileEpermRetry(outPath, JSON.stringify(report, null, 2) + "\n");
    console.log(`${REFUSAL_LINE}: trượt đầu tiên — ${gate.firstFailure} (gate: ${gate.firstFailedGate}); các blocker: ${gate.blockers.join("; ")}`);
    console.log(`Probe KHÔNG chạy. Report: ${outPath}`);
    process.exit(2);
  }

  if (args.gateOnly) {
    const report = {
      schema: "w6-quiet-run-v1",
      date: new Date().toISOString(),
      verdict: "GATE-QUIET",
      locked: false,
      note: "CHƯA KHÓA: cổng yên đạt nhưng --gate-only nên probe chưa chạy, chưa có gì để khóa.",
      gate: { quiet: true, firstFailedGate: null, firstFailure: null, blockers: [], thresholds: QUIET_GATE_DEFAULTS },
      gateSamples: samples,
      probeRounds: null,
      diagnosis: null,
    };
    writeFileEpermRetry(outPath, JSON.stringify(report, null, 2) + "\n");
    console.log(`Cổng yên đạt (${samples.length} mẫu). --gate-only: probe chưa chạy. Report: ${outPath}`);
    process.exit(0);
  }

  console.log("[W6 quiet-runner] cổng yên đạt — chạy probe Node 3 vòng (protocol U4 phần a)…");
  const probeRounds = await runNodeProbeRounds({ rounds: args.rounds, windowMs: args.windowMs });
  const diagnosis = diagnoseWithV6Module(probeRounds);
  // Đợt 42 X6: chuỗi quyết định đầy đủ RAM → CPU load → busy.
  // Cổng yên đã đạt nên RAM/CPU load không còn là ứng viên trượt;
  // gate trượt đầu tiên (nếu có) ở bước này chỉ có thể là busy
  // (hoặc idle) từ chẩn đoán V6 — ghi rõ để phân biệt với trượt
  // cổng yên ở nhánh REFUSED-BUSY phía trên.
  const nodeVerdict = diagnosis?.node?.verdict;
  const busyPassed = diagnosis?.node?.busy?.passed;
  const idlePassed = diagnosis?.node?.idle?.passed;
  // pass/disabled: không có gate trượt (disabled = tiêu chí tắt, không
  // phải trượt). insufficient-rounds: thiếu vòng, chưa hỏi được busy.
  const decisionFirstFailedGate = nodeVerdict === "pass" || nodeVerdict === "disabled" ? null
    : nodeVerdict === "insufficient-rounds" ? "rounds"
    : (busyPassed === false ? "busy" : "idle");
  const decisionFirstFailure = nodeVerdict === "pass" ? null
    : nodeVerdict === "disabled" ? "node disabled (busy+idle đều tắt) — không có gate trượt"
    : nodeVerdict === "insufficient-rounds" ? `thiếu vòng: chỉ ${diagnosis?.node?.roundCount ?? "?"} vòng, cần >= ${diagnosis?.node?.config?.minRounds ?? "?"}`
    : (busyPassed === false ? `busy: ${diagnosis.node.busy.detail}` : `idle: ${diagnosis?.node?.idle?.detail ?? nodeVerdict}`);
  const report = {
    schema: "w6-quiet-run-v1",
    date: new Date().toISOString(),
    verdict: "PROBED-QUIET",
    locked: false,
    note: "CHƯA KHÓA: đây là bằng chứng phiên quiet, KHÔNG phải quyết định khóa. Khóa thật cần quyết riêng sau khi đối chiếu đủ tầng CDP + Node (xem LIMITS W6 §3).",
    gate: { quiet: true, firstFailedGate: null, firstFailure: null, blockers: [], thresholds: QUIET_GATE_DEFAULTS },
    decision: { firstFailedGate: decisionFirstFailedGate, firstFailure: decisionFirstFailure, nodeVerdict },
    gateSamples: samples,
    probeRounds,
    diagnosis,
  };
  writeFileEpermRetry(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`Chẩn đoán Node (module V6 gốc): verdict=${diagnosis.node.verdict}`);
  console.log(`  busy: ${diagnosis.node.busy.detail}`);
  console.log(`  idle: ${diagnosis.node.idle.detail}`);
  console.log(`CHƯA KHÓA — report: ${outPath} (khóa cần quyết riêng, xem LIMITS W6 §3)`);
  process.exit(0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error("RUNNER LỖI:", e.message);
    process.exit(1);
  });
}
