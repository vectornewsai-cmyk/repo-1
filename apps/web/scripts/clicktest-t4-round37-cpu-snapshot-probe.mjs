#!/usr/bin/env node
/**
 * clicktest-t4-round37-cpu-snapshot-probe.mjs — Phase 9 đợt 37, luồng T4.
 *
 * Kiểm chứng 3 mảnh của T4 (nợ §3.6 đợt 36 của S6):
 *
 *   (1) Đường timeout snapshot của CHÍNH bench được kích hoạt live:
 *       kiểm chứng TĨNH ở đây (bench chứa cờ --cdp-hang-probe +
 *       result.hangProbe + snapshot qua Cdp.send() của bench); lần
 *       chạy live của bench với cờ đó nằm trong LIMITS T4 (chạy tay
 *       ngoài probe này, vì bench cần editor + vite preview, còn
 *       probe này chỉ cần Chrome trần cho phần CPU).
 *   (2) Đóng băng dist cho mobile/check-proxy: kiểm chứng tĩnh wiring
 *       (import + manifest trước/sau + verdict bị loại khi INVALID);
 *       lần chạy live mobile VALID nằm trong LIMITS T4; nhánh INVALID
 *       của mobile/check-proxy KHÔNG kích hoạt live bằng cách sửa
 *       dist thật giữa lượt (dist dùng chung với luồng khác) — nó
 *       dùng đúng hàm verifyDistManifest đã chứng minh INVALID live
 *       ở bench đợt 36 và unit tamper trong probe này.
 *   (3) Chữ ký CPU /proc tick-delta (cdp-cpu-sample.mjs): CHỨNG MINH
 *       THẬT, 2 tầng độc lập —
 *       (a) tầng Node thuần: tiến trình con busy-loop vs idle, lấy
 *           mẫu cây tiến trình 2000ms mỗi đứa, không cần Chrome;
 *       (b) tầng CDP thật: H1 promise không settle vs H2 while(true)
 *           trên Chrome thật, lấy mẫu /proc trong đúng cửa sổ treo
 *           (bắt đầu +500ms sau khi gửi lệnh treo, mẫu 3000ms, kết
 *           thúc trước timeout 5000ms), đối chiếu với ps
 *           lifetime-average trong snapshot treo cùng lần đó.
 *
 * Tiêu chí phân biệt (ghi trước khi chạy, không sửa sau khi thấy số):
 *   H2 cpuPctOneCore > 50 VÀ (H2 - H1) > 30 điểm %. ps lifetime-average
 *   chỉ ghi số thật dưới dạng đo thông tin, KHÔNG dùng làm check
 *   (S6 đã chứng minh nó không phân biệt được).
 *
 * Snapshot treo của probe ghi vào thư mục bền riêng
 * ~/workspace/vcut-cdp-hang-snapshots/t4-round37-cpu-snapshot-probe/
 * rồi XÓA đúng các file probe tự tạo (kỷ luật R5/S6: đếm delta
 * trước/sau, thư mục trở lại baseline). Snapshot treo của bench
 * (khi chạy live với cờ) thì KHÔNG xóa — nó là bằng chứng bền.
 *
 * Chạy: node apps/web/scripts/clicktest-t4-round37-cpu-snapshot-probe.mjs
 * Kết quả: benchmarks/results/v37-t4-cpu-snapshot-probe.json, exit 0
 * khi allPass, ngược lại exit 1.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { distManifest, verifyDistManifest } from "./cdp-dist-freeze.mjs";
import { clkTck, readProcStat, readTreeTicks, sampleCpuTree } from "./cdp-cpu-sample.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPTS_DIR, "..", "..", "..");
const CDP_PORT = Number(process.env.T4_CDP_PORT || 19457);
const CHROME = process.env.T4_CHROME || path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const OUT = path.join(ROOT, "benchmarks/results/v37-t4-cpu-snapshot-probe.json");
const SNAP_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "t4-round37-cpu-snapshot-probe");
const HANG_TIMEOUT_MS = 5000;

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

let ws, nextId = 1;
const pending = new Map();
let chromeProc = null;

function send(method, params = {}, timeoutMs = 60000) {
  const id = nextId++;
  return new Promise((res, rej) => {
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({ proc: chromeProc, pendingCount: pending.size, method, timeoutMs, outDir: SNAP_OUT_DIR, bundle: null, extra: { transport: "websocket", port: CDP_PORT, probe: "t4-round37-cpu" } });
          if (hangSnap.file) console.log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
        } catch (e) { console.log(`CDP-HANG snapshot lỗi: ${e.message}`); }
        rej(new Error("cdp timeout " + method));
      }
    }, timeoutMs);
    pending.set(id, { resolve: (v) => { clearTimeout(timer); res(v); }, reject: (e) => { clearTimeout(timer); rej(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  // ---- (3a) unit module CPU trên /proc thật ----
  const tck = clkTck();
  check("u1.clkTck100", tck === 100, `getconf CLK_TCK=${tck}`);
  const selfStat = readProcStat(process.pid);
  check("u2.readOwnProcStat", !!selfStat && selfStat.ticks >= 0, `pid=${process.pid} ticks=${selfStat?.ticks}`);
  const selfTree = readTreeTicks(process.pid);
  check("u3.ownTreeContainsSelf", selfTree.pids.includes(process.pid), `pids=${selfTree.pids.length}`);
  check("u4.deadPidReturnsNull", readProcStat(999999) === null, "pid không tồn tại → null, không throw");

  // Tầng Node thuần: busy-loop vs idle, mỗi đứa mẫu 2000ms.
  const busy = spawn(process.execPath, ["-e", "while(true){}"], { stdio: "ignore" });
  const idle = spawn(process.execPath, ["-e", "setTimeout(()=>{},30000)"], { stdio: "ignore" });
  await sleep(500);
  const busySample = await sampleCpuTree(busy.pid, 2000);
  const idleSample = await sampleCpuTree(idle.pid, 2000);
  try { busy.kill("SIGKILL"); } catch {}
  try { idle.kill("SIGKILL"); } catch {}
  check("u5.busyLoopCpuHigh", busySample.ok && busySample.cpuPctOneCore > 50, `busy=${busySample.cpuPctOneCore?.toFixed(1)}% (1 core) topPid=${busySample.topPid?.pid} deltaTicks=${busySample.deltaTicks}`);
  check("u6.idleCpuLow", idleSample.ok && idleSample.cpuPctOneCore < 20, `idle=${idleSample.cpuPctOneCore?.toFixed(1)}% deltaTicks=${idleSample.deltaTicks}`);
  check("u7.nodeLevelDiscriminates", busySample.ok && idleSample.ok && (busySample.cpuPctOneCore - idleSample.cpuPctOneCore) > 30, `chênh=${(busySample.cpuPctOneCore - idleSample.cpuPctOneCore).toFixed(1)} điểm %`);

  // ---- (2) unit đóng băng: tamper trên fixture → INVALID (hàm mà
  // mobile/check-proxy dùng chung, không cần sửa dist thật) ----
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "t4-fixture-dist-"));
  writeFileEpermRetry(path.join(fixDir, "index.html"), "<script src='/assets/x.js'></script>");
  fs.mkdirSync(path.join(fixDir, "assets"), { recursive: true });
  writeFileEpermRetry(path.join(fixDir, "assets", "x.js"), "console.log(1);");
  const m1 = distManifest(fixDir);
  fs.appendFileSync(path.join(fixDir, "assets", "x.js"), "// tamper\n");
  const vTamper = verifyDistManifest(fixDir, m1);
  check("u8.tamperInvalid", !vTamper.valid, vTamper.problems.join(" | "));
  try { fs.rmSync(fixDir, { recursive: true, force: true }); } catch {}

  // ---- (1)+(2) kiểm chứng tĩnh wiring ----
  const read = (f) => fs.readFileSync(path.join(SCRIPTS_DIR, f), "utf8");
  const bench = read("bench-preview-fps.mjs");
  check("w1.benchHangProbeFlag", bench.includes("--cdp-hang-probe") && bench.includes("BENCH_CDP_HANG_PROBE") && bench.includes("result.hangProbe"), "cờ + result.hangProbe");
  check("w2.benchHangProbeUsesOwnSend", bench.includes("await cdp.send(\"Runtime.evaluate\", { expression: \"new Promise(()=>{})\"") && bench.includes("newFiles.length === 1"), "dùng Cdp.send() của bench + đếm đúng 1 snapshot mới");
  const mobile = read("mobile-touch-check.mjs");
  check("w3.mobileFreezeWiring", mobile.includes('from "./cdp-dist-freeze.mjs"') && mobile.includes("distManifest(HANG_DIST_DIR)") && mobile.includes("verifyDistManifest(HANG_DIST_DIR, FROZEN_START)") && mobile.includes("FROZEN INVALID"), "import + manifest trước/sau + loại kết quả khi INVALID");
  const checkProxy = read("check-proxy-auto.mjs");
  check("w4.checkProxyPreviewFreezeWiring", checkProxy.includes("--preview-dist") && checkProxy.includes("viteArgs") && checkProxy.includes("finishFrozenDist()") && checkProxy.includes("process.exitCode = frozenInvalid ? 3"), "preview-dist + vite preview + INVALID → exit 3");
  check("w5.checkProxyRefusesMismatchedDist", checkProxy.includes("CHECK_PROXY_DIST_DIR") && checkProxy.includes("APP_DIST_DIR") && checkProxy.includes("process.exit(2)"), "dist lệch apps/web/dist → từ chối chạy exit 2, không claim sai");

  // ---- (3b) treo thật H1/H2 trên Chrome thật + lấy mẫu /proc ----
  if (!fs.existsSync(CHROME)) throw new Error("Thiếu Chromium: " + CHROME);
  const snapBefore = listSnapFiles();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "t4-chrome-"));
  chromeProc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  const hangResults = {};
  try {
    let targets = null;
    for (let i = 0; i < 60 && !targets; i++) {
      await sleep(500);
      try {
        const ctrl = new AbortController();
        const at = setTimeout(() => ctrl.abort(), 5000);
        try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`, { signal: ctrl.signal }); const j = await r.json(); if (j.length) targets = j; } finally { clearTimeout(at); }
      } catch { /* chưa lên */ }
    }
    check("h.chromeJsonUp", !!targets, targets ? `${targets.length} targets` : "không lấy được /json/list");
    if (!targets) throw new Error("Chrome CDP không lên");
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

    async function runHang(label, expression, awaitPromise) {
      const before = listSnapFiles();
      const hangPromise = send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true }, HANG_TIMEOUT_MS);
      hangPromise.catch(() => {}); // tránh unhandled rejection trong lúc lấy mẫu
      await sleep(500); // để vòng lặp / promise treo bắt đầu thật
      const cpu = await sampleCpuTree(chromeProc.pid, 3000); // kết thúc ~3500ms, trước timeout 5000ms
      const start = Date.now();
      let err = null;
      try { await hangPromise; err = "RESOLVED-BẤT-NGỜ"; } catch (e) { err = e.message; }
      const wall = Date.now() - start + 3500; // wall tính từ lúc gửi lệnh (500 mẫu-chờ + 3000 mẫu ≈ 3500ms trước khi await)
      const newFiles = listSnapFiles().filter((f) => !before.includes(f));
      let snap = null;
      if (newFiles.length === 1) { try { snap = JSON.parse(fs.readFileSync(path.join(SNAP_OUT_DIR, newFiles[0]), "utf8")); } catch {} }
      return { wallMsApprox: wall, error: err, cpu, newFiles, snapshot: snap, psMaxCpu: maxChromeCpu(snap?.ps) };
    }

    // H1: promise không settle — renderer rảnh, CPU cửa sổ treo phải thấp.
    const h1 = runHang("H1", "new Promise(()=>{})", true);
    const h1r = await h1;
    check("h1.timeoutRejects", h1r.error === "cdp timeout Runtime.evaluate", h1r.error);
    check("h1.exactlyOneSnapshot", h1r.newFiles.length === 1, h1r.newFiles.join(","));
    check("h1.snapshotFields", h1r.snapshot?.method === "Runtime.evaluate" && h1r.snapshot?.timeoutMs === HANG_TIMEOUT_MS && h1r.snapshot?.proc?.pid === chromeProc.pid, JSON.stringify(h1r.snapshot?.bundle));
    check("h1.cpuSampleOk", h1r.cpu.ok, h1r.cpu.ok ? `cpu=${h1r.cpu.cpuPctOneCore.toFixed(1)}% pids=${h1r.cpu.pidsAfter.length}` : h1r.cpu.reason);
    hangResults.h1 = { cpuPctOneCore: h1r.cpu.cpuPctOneCore, deltaTicks: h1r.cpu.deltaTicks, topPid: h1r.cpu.topPid, psMaxCpuLifetime: h1r.psMaxCpu, wallMsApprox: h1r.wallMsApprox };
    let h1Free = null;
    try { h1Free = await send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, 10000); } catch (e) { h1Free = `LỖI: ${e.message}`; }
    check("h1.rendererStillFree", h1Free?.result?.value === 2, JSON.stringify(h1Free));
    console.log(`H1 cpuTickDelta=${h1r.cpu.cpuPctOneCore?.toFixed(1)}% psLifetimeMax=${h1r.psMaxCpu}`);

    // H2: while(true) — renderer spin, CPU cửa sổ treo phải cao.
    const h2 = runHang("H2", "while(true){}", false);
    const h2r = await h2;
    check("h2.timeoutRejects", h2r.error === "cdp timeout Runtime.evaluate", h2r.error);
    check("h2.exactlyOneSnapshot", h2r.newFiles.length === 1, h2r.newFiles.join(","));
    check("h2.cpuSampleOk", h2r.cpu.ok, h2r.cpu.ok ? `cpu=${h2r.cpu.cpuPctOneCore.toFixed(1)}% topPid=${h2r.cpu.topPid?.pid} topCpu=${h2r.cpu.topPid?.cpuPctOneCore.toFixed(1)}%` : h2r.cpu.reason);
    hangResults.h2 = { cpuPctOneCore: h2r.cpu.cpuPctOneCore, deltaTicks: h2r.cpu.deltaTicks, topPid: h2r.cpu.topPid, psMaxCpuLifetime: h2r.psMaxCpu, wallMsApprox: h2r.wallMsApprox };
    console.log(`H2 cpuTickDelta=${h2r.cpu.cpuPctOneCore?.toFixed(1)}% psLifetimeMax=${h2r.psMaxCpu}`);
    // Tiêu chí phân biệt ghi trước khi chạy — đây là check quyết định.
    check("h3.procTickDeltaDiscriminates", h2r.cpu.ok && h1r.cpu.ok && h2r.cpu.cpuPctOneCore > 50 && (h2r.cpu.cpuPctOneCore - h1r.cpu.cpuPctOneCore) > 30,
      `H1=${h1r.cpu.cpuPctOneCore?.toFixed(1)}% H2=${h2r.cpu.cpuPctOneCore?.toFixed(1)}% chênh=${(h2r.cpu.cpuPctOneCore - h1r.cpu.cpuPctOneCore).toFixed(1)} (ngưỡng: H2>50 và chênh>30)`);
    // ps lifetime-average chỉ ghi số, không làm check (S6 đã chứng minh nó mù).
    check("h4.psLifetimeRecordedOnly", h1r.psMaxCpu !== null && h2r.psMaxCpu !== null, `ps H1 max=${h1r.psMaxCpu} H2 max=${h2r.psMaxCpu} (đo thông tin, không phân biệt)`);
    let alive2 = false;
    try { const t = await send("Target.getTargets", {}, 10000); alive2 = Array.isArray(t?.targetInfos); } catch { alive2 = false; }
    check("h2.browserAliveAfter", alive2, "Target.getTargets mức browser vẫn trả lời dù renderer spin");
    const beforeBlocked = listSnapFiles();
    let blockedErr = null;
    try { await send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, 3000); blockedErr = "RESOLVED-BẤT-NGỜ"; }
    catch (e) { blockedErr = e.message; }
    const blockedNew = listSnapFiles().filter((f) => !beforeBlocked.includes(f));
    check("h2.rendererBlocked", blockedErr === "cdp timeout Runtime.evaluate" && blockedNew.length === 1, `err=${blockedErr} newSnapshots=${blockedNew.length}`);
    hangResults.h2BlockedProbe = { error: blockedErr, newSnapshots: blockedNew.length };

    const probeFiles = [...h1r.newFiles, ...h2r.newFiles, ...blockedNew];
    for (const f of probeFiles) { try { fs.unlinkSync(path.join(SNAP_OUT_DIR, f)); } catch {} }
    check("h.cleanupDirBackToBaseline", JSON.stringify(listSnapFiles()) === JSON.stringify(snapBefore), `trước=${snapBefore.length} sau=${listSnapFiles().length}`);
  } finally {
    try { ws?.close(); } catch {}
    try { chromeProc?.kill("SIGKILL"); } catch {}
  }

  const allPass = Object.values(checks).every((c) => c.pass);
  const result = {
    date: new Date().toISOString(),
    allPass,
    checks,
    nodeLevel: { busyCpuPctOneCore: busySample.cpuPctOneCore, idleCpuPctOneCore: idleSample.cpuPctOneCore, busyDeltaTicks: busySample.deltaTicks, idleDeltaTicks: idleSample.deltaTicks },
    hangResults,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(result, null, 2) + "\n");
  console.log(`allPass=${allPass} -> ${OUT}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE LỖI:", e);
  try { chromeProc?.kill("SIGKILL"); } catch {}
  process.exit(1);
});
