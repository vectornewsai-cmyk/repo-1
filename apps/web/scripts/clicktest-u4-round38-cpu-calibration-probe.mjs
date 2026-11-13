#!/usr/bin/env node
/**
 * clicktest-u4-round38-cpu-calibration-probe.mjs — Phase 9 đợt 38, luồng U4.
 *
 * Nợ đóng: ngưỡng CPU phân biệt H1/H2 của T4 đợt 37 mới hiệu chuẩn trên
 * 1 lần CDP + 1 lần Node — chưa đủ để làm cổng tự động (ROUND37 §3.6).
 * Probe này LẶP LẠI hiệu chuẩn, mỗi loại ít nhất 3 lần, báo phân tán:
 *
 *   (a) Tầng Node thuần: 3 vòng, mỗi vòng spawn đồng thời 1 tiến trình
 *       busy-loop (while(true)) + 1 tiến trình idle (setTimeout), lấy
 *       mẫu cây tiến trình 2000ms mỗi đứa (như T4).
 *   (b) Tầng CDP thật: 3 vòng H1 (promise không settle, chung 1 Chrome —
 *       renderer vẫn rảnh sau H1 nên dùng lại được, kiểm tra 1+1 sau mỗi
 *       vòng) + 3 vòng H2 (while(true), MỖI VÒNG 1 Chrome mới — sau H2
 *       renderer kẹt nên không dùng lại được). Mỗi vòng treo: gửi lệnh,
 *       chờ +500ms, lấy mẫu /proc 3000ms, kết thúc trước timeout 5000ms.
 *
 * Tiêu chí phân biệt GHI TRƯỚC khi chạy (giữ nguyên ngưỡng T4, không
 * sửa sau khi thấy số): mọi vòng H2 cpuPctOneCore > 50, mọi vòng H1
 * cpuPctOneCore < 20, và (min H2 − max H1) > 30 điểm %. ps
 * lifetime-average chỉ ghi số, KHÔNG làm check (S6/T4 đã chứng minh nó mù).
 *
 * QUYẾT ĐỊNH NGƯỠNG (ghi trước): chỉ đề xuất ngưỡng mới / cổng tự động
 * khi TẤT CẢ các vòng đều đạt tiêu chí trên. Nếu bất kỳ vòng nào lệch,
 * probe exit 1 và LIMITS giữ ngưỡng cũ, ghi rõ "chưa đủ để làm cổng
 * tự động" — không nới ngưỡng cho vừa số đo.
 *
 * Snapshot treo của probe ghi vào thư mục bền riêng
 * ~/workspace/vcut-cdp-hang-snapshots/u4-round38-cpu-calibration-probe/
 * rồi XÓA đúng các file probe tự tạo (kỷ luật R5/S6/T4: thư mục trở lại
 * baseline). Snapshot treo của bench (khi chạy live với cờ H2) thì
 * KHÔNG xóa — nó là bằng chứng bền, nằm ở thư mục của bench.
 *
 * Chạy: node apps/web/scripts/clicktest-u4-round38-cpu-calibration-probe.mjs
 * Kết quả: benchmarks/results/v38-u4-cpu-calibration.json, exit 0 khi
 * allPass, ngược lại exit 1.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { sampleCpuTree } from "./cdp-cpu-sample.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPTS_DIR, "..", "..", "..");
const CDP_PORT_BASE = Number(process.env.U4_CDP_PORT || 19458);
const CHROME = process.env.U4_CHROME || path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const OUT = path.join(ROOT, "benchmarks/results/v38-u4-cpu-calibration.json");
const SNAP_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "u4-round38-cpu-calibration-probe");
const HANG_TIMEOUT_MS = 5000;
const ROUNDS = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = {};
function check(name, ok, detail = "") { checks[name] = { pass: !!ok, detail: String(detail).slice(0, 500) }; console.log(`${ok ? "PASS" : "FAIL"} ${name} ${detail}`); }
function listSnapFiles() { try { return fs.readdirSync(SNAP_OUT_DIR).filter((f) => f.endsWith(".json")).sort(); } catch { return []; } }
function maxChromeCpu(psText) {
  let max = null;
  for (const line of String(psText || "").split("\n")) {
    if (!line.includes("chrome")) continue;
    const parts = line.trim().split(/\s+/);
    const cpu = Number(parts[4]);
    if (Number.isFinite(cpu) && (max === null || cpu > max)) max = cpu;
  }
  return max;
}
function stats(vals) {
  const xs = vals.filter((v) => Number.isFinite(v));
  if (!xs.length) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return { n: xs.length, min: Math.min(...xs), max: Math.max(...xs), mean, values: xs.map((v) => Number(v.toFixed(1))) };
}

let ws = null, nextId = 1;
const pending = new Map();
let chromeProc = null;

function send(method, params = {}, timeoutMs = 60000) {
  const id = nextId++;
  return new Promise((res, rej) => {
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({ proc: chromeProc, pendingCount: pending.size, method, timeoutMs, outDir: SNAP_OUT_DIR, bundle: null, extra: { transport: "websocket", port: CDP_PORT_BASE, probe: "u4-round38-cpu-calibration" } });
          if (hangSnap.file) console.log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
        } catch (e) { console.log(`CDP-HANG snapshot lỗi: ${e.message}`); }
        rej(new Error("cdp timeout " + method));
      }
    }, timeoutMs);
    pending.set(id, { resolve: (v) => { clearTimeout(timer); res(v); }, reject: (e) => { clearTimeout(timer); rej(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function startChrome(port) {
  nextId = 1; pending.clear();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "u4-chrome-"));
  chromeProc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    await sleep(500);
    try {
      const ctrl = new AbortController();
      const at = setTimeout(() => ctrl.abort(), 5000);
      try { const r = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: ctrl.signal }); const j = await r.json(); if (j.length) targets = j; } finally { clearTimeout(at); }
    } catch { /* chưa lên */ }
  }
  if (!targets) throw new Error(`Chrome CDP không lên ở cổng ${port}`);
  const page = targets.find((t) => t.type === "page") || targets[0];
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("ws open timeout 30000ms")), 30000);
    ws.onopen = () => { clearTimeout(t); resolve(); };
    ws.onerror = (e) => { clearTimeout(t); reject(new Error("ws open error: " + (e?.message || "WebSocket error"))); };
  });
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const entry = pending.get(d.id);
      pending.delete(d.id);
      if (d.error) entry.reject(new Error(JSON.stringify(d.error)));
      else entry.resolve(d.result);
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: "about:blank" });
  await sleep(1000);
}

function stopChrome() {
  try { ws?.close(); } catch {}
  ws = null;
  try { chromeProc?.kill("SIGKILL"); } catch {}
  chromeProc = null;
}

async function runHang(expression, awaitPromise) {
  const before = listSnapFiles();
  const hangPromise = send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true }, HANG_TIMEOUT_MS);
  hangPromise.catch(() => {});
  await sleep(500);
  const cpu = await sampleCpuTree(chromeProc.pid, 3000);
  let err = null;
  try { await hangPromise; err = "RESOLVED-BẤT-NGỜ"; } catch (e) { err = e.message; }
  const newFiles = listSnapFiles().filter((f) => !before.includes(f));
  let snap = null;
  if (newFiles.length === 1) { try { snap = JSON.parse(fs.readFileSync(path.join(SNAP_OUT_DIR, newFiles[0]), "utf8")); } catch {} }
  return { error: err, cpu, newFiles, snapshot: snap, psMaxCpu: maxChromeCpu(snap?.ps) };
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error("Thiếu Chromium: " + CHROME);
  const snapBaseline = listSnapFiles();

  // ---- (a) Tầng Node: 3 vòng busy vs idle ----
  const nodeRounds = [];
  for (let i = 0; i < ROUNDS; i++) {
    const busy = spawn(process.execPath, ["-e", "while(true){}"], { stdio: "ignore" });
    const idle = spawn(process.execPath, ["-e", "setTimeout(()=>{},30000)"], { stdio: "ignore" });
    await sleep(500);
    const [busySample, idleSample] = await Promise.all([sampleCpuTree(busy.pid, 2000), sampleCpuTree(idle.pid, 2000)]);
    try { busy.kill("SIGKILL"); } catch {}
    try { idle.kill("SIGKILL"); } catch {}
    nodeRounds.push({ round: i + 1, busyCpuPctOneCore: busySample.cpuPctOneCore, busyDeltaTicks: busySample.deltaTicks, idleCpuPctOneCore: idleSample.cpuPctOneCore, idleDeltaTicks: idleSample.deltaTicks });
    console.log(`Node vòng ${i + 1}: busy=${busySample.cpuPctOneCore?.toFixed(1)}% idle=${idleSample.cpuPctOneCore?.toFixed(1)}%`);
  }
  check("n.busyHighAllRounds", nodeRounds.every((r) => r.busyCpuPctOneCore > 50), nodeRounds.map((r) => r.busyCpuPctOneCore?.toFixed(1)).join(","));
  check("n.idleLowAllRounds", nodeRounds.every((r) => r.idleCpuPctOneCore < 20), nodeRounds.map((r) => r.idleCpuPctOneCore?.toFixed(1)).join(","));
  check("n.gapAllRounds", nodeRounds.every((r) => (r.busyCpuPctOneCore - r.idleCpuPctOneCore) > 30), nodeRounds.map((r) => (r.busyCpuPctOneCore - r.idleCpuPctOneCore).toFixed(1)).join(","));

  // ---- (b1) Tầng CDP: 3 vòng H1 trên cùng 1 Chrome ----
  const h1Rounds = [];
  const h1ProbeFiles = [];
  await startChrome(CDP_PORT_BASE);
  try {
    for (let i = 0; i < ROUNDS; i++) {
      const r = await runHang("new Promise(()=>{})", true);
      h1Rounds.push({ round: i + 1, cpuPctOneCore: r.cpu.cpuPctOneCore, deltaTicks: r.cpu.deltaTicks, topPid: r.cpu.topPid, error: r.error, newSnapshots: r.newFiles.length, psMaxCpuLifetime: r.psMaxCpu });
      h1ProbeFiles.push(...r.newFiles);
      console.log(`CDP H1 vòng ${i + 1}: cpu=${r.cpu.cpuPctOneCore?.toFixed(1)}% err=${r.error} snaps=${r.newFiles.length} psMax=${r.psMaxCpu}`);
      let free = null;
      try { free = await send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, 10000); } catch (e) { free = `LỖI: ${e.message}`; }
      check(`h1.${i + 1}.timeoutAndSnapshot`, r.error === "cdp timeout Runtime.evaluate" && r.newFiles.length === 1, `err=${r.error} snaps=${r.newFiles.length}`);
      check(`h1.${i + 1}.rendererStillFree`, free?.result?.value === 2, JSON.stringify(free));
    }
  } finally { stopChrome(); }

  // ---- (b2) Tầng CDP: 3 vòng H2, mỗi vòng 1 Chrome mới ----
  const h2Rounds = [];
  const h2ProbeFiles = [];
  for (let i = 0; i < ROUNDS; i++) {
    await startChrome(CDP_PORT_BASE + 1 + i);
    try {
      const r = await runHang("while(true){}", false);
      h2Rounds.push({ round: i + 1, cpuPctOneCore: r.cpu.cpuPctOneCore, deltaTicks: r.cpu.deltaTicks, topPid: r.cpu.topPid, error: r.error, newSnapshots: r.newFiles.length, psMaxCpuLifetime: r.psMaxCpu });
      h2ProbeFiles.push(...r.newFiles);
      console.log(`CDP H2 vòng ${i + 1}: cpu=${r.cpu.cpuPctOneCore?.toFixed(1)}% topPid=${r.cpu.topPid?.pid} topCpu=${r.cpu.topPid?.cpuPctOneCore?.toFixed(1)}% err=${r.error} snaps=${r.newFiles.length} psMax=${r.psMaxCpu}`);
      check(`h2.${i + 1}.timeoutAndSnapshot`, r.error === "cdp timeout Runtime.evaluate" && r.newFiles.length === 1, `err=${r.error} snaps=${r.newFiles.length}`);
    } finally { stopChrome(); }
  }

  // ---- Tiêu chí phân biệt ghi trước (ngưỡng T4, không sửa sau) ----
  const h1Vals = h1Rounds.map((r) => r.cpuPctOneCore);
  const h2Vals = h2Rounds.map((r) => r.cpuPctOneCore);
  const gap = Math.min(...h2Vals) - Math.max(...h1Vals);
  check("c.h2Above50AllRounds", h2Vals.every((v) => v > 50), h2Vals.map((v) => v.toFixed(1)).join(","));
  check("c.h1Below20AllRounds", h1Vals.every((v) => v < 20), h1Vals.map((v) => v.toFixed(1)).join(","));
  check("c.minGapAbove30", gap > 30, `minH2=${Math.min(...h2Vals).toFixed(1)} maxH1=${Math.max(...h1Vals).toFixed(1)} gap=${gap.toFixed(1)}`);
  check("c.psRecordedOnly", h1Rounds.every((r) => r.psMaxCpuLifetime !== null) && h2Rounds.every((r) => r.psMaxCpuLifetime !== null), `ps H1: ${h1Rounds.map((r) => r.psMaxCpuLifetime).join(",")} H2: ${h2Rounds.map((r) => r.psMaxCpuLifetime).join(",")} (đo thông tin, không phân biệt)`);

  // Dọn snapshot probe, trở lại baseline.
  for (const f of [...h1ProbeFiles, ...h2ProbeFiles]) { try { fs.unlinkSync(path.join(SNAP_OUT_DIR, f)); } catch {} }
  check("z.cleanupDirBackToBaseline", JSON.stringify(listSnapFiles()) === JSON.stringify(snapBaseline), `trước=${snapBaseline.length} sau=${listSnapFiles().length}`);

  const allPass = Object.values(checks).every((c) => c.pass);
  const result = {
    date: new Date().toISOString(),
    allPass,
    criteriaPreregistered: { h2Above50: true, h1Below20: true, minGapAbove30: true, note: "Ngưỡng T4 giữ nguyên; chỉ đề xuất ngưỡng mới/cổng tự động khi allPass." },
    thresholdDecision: allPass
      ? "Dữ liệu lặp 3 vòng ủng hộ ngưỡng T4 (H2>50, chênh>30): ngưỡng được tái xác nhận, nhưng cổng tự động vẫn cần phiên quiet có điều phối trước khi khóa (xem LIMITS)."
      : "GIỮ NGƯỠNG CŨ — dữ liệu lặp KHÔNG đạt đủ tiêu chí ghi trước, chưa đủ để làm cổng tự động (xem check FAIL + LIMITS).",
    checks,
    nodeLevel: { rounds: nodeRounds, busyStats: stats(nodeRounds.map((r) => r.busyCpuPctOneCore)), idleStats: stats(nodeRounds.map((r) => r.idleCpuPctOneCore)) },
    cdpLevel: { h1Rounds, h2Rounds, h1Stats: stats(h1Vals), h2Stats: stats(h2Vals), minGap: gap },
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(result, null, 2) + "\n");
  console.log(`allPass=${allPass} -> ${OUT}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE LỖI:", e);
  try { ws?.close(); } catch {}
  try { chromeProc?.kill("SIGKILL"); } catch {}
  process.exit(1);
});
