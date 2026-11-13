#!/usr/bin/env node
/**
 * clicktest-o2-round32-snapshot-probe.mjs — Phase 9 đợt 32, luồng O2:
 * chứng minh động 3 đổi của đợt này bằng treo GIẢ LẬP 1ms có chủ đích
 * trên class TRÍCH ĐÚNG từ file harness đã sửa (mẫu probe N5 đợt 31):
 *
 *  (a) Nhóm 13 harness không SCRATCH: snapshot không còn ghi ra /tmp mà
 *      ghi ra ~/workspace/vcut-cdp-hang-snapshots/<tên-script>/ — target
 *      đại diện clicktest-nested-ramp-pipe.mjs (pipe Chrome thật).
 *  (b) 2 harness WebSocket mới nối (bench-preview-fps, check-proxy-auto):
 *      timeout handler trong class Cdp qua WebSocket vẫn chụp snapshot
 *      với proc.pid khớp Chrome do chính script spawn.
 *  (c) Default của module cdp-snapshot.mjs khi harness quên truyền
 *      outDir: ghi vào .../vcut-cdp-hang-snapshots/_unspecified/ thay
 *      vì throw (không che lỗi timeout gốc).
 *
 * Đây vẫn là treo GIẢ LẬP — lần treo THẬT có snapshot vẫn là nợ mở.
 * Display :93 (pipe target, Xvfb), cổng WS 19493. Kết quả JSON:
 * benchmarks/results/v32-o2-snapshot-probe.json (parent quyết stage).
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SCRIPTS_DIR = path.join(ROOT, "apps", "web", "scripts");
const OUT_FILE = path.join(ROOT, "benchmarks", "results", "v32-o2-snapshot-probe.json");
const DURABLE_ROOT = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.O2_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.O2_DISPLAY || ":93";
const WS_PORT = Number(process.env.O2_WS_PORT || 19493);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) { const l = `[${stamp()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

// Quét khối class (copy mẫu N5, tổng quát theo tên class): đếm brace ở
// tầng code, bỏ qua chuỗi '...', "...", template `...` (brace trong
// ${} tự triệt tiêu khi quét thô), comment // và /* */.
function extractClass(src, className) {
  const start = src.indexOf(`class ${className}`);
  if (start < 0) throw new Error(`không tìm thấy class ${className}`);
  const open = src.indexOf("{", start);
  if (open < 0) throw new Error(`không tìm thấy { mở của class ${className}`);
  let depth = 0;
  let i = open;
  let mode = null;
  while (i < src.length) {
    const ch = src[i];
    if (mode === "'") { if (ch === "\\") { i += 2; continue; } if (ch === "'") mode = null; i++; continue; }
    if (mode === '"') { if (ch === "\\") { i += 2; continue; } if (ch === '"') mode = null; i++; continue; }
    if (mode === "`") {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "`") { mode = null; i++; continue; }
      if (ch === "{") depth++;
      if (ch === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
      i++; continue;
    }
    if (ch === "'") { mode = "'"; i++; continue; }
    if (ch === '"') { mode = '"'; i++; continue; }
    if (ch === "`") { mode = "`"; i++; continue; }
    if (ch === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (ch === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
    i++;
  }
  throw new Error(`không tìm thấy } đóng của class ${className}`);
}

// Lấy giá trị hằng CDP_HANG_OUT_DIR từ source file (dạng
// path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "<slug>"))
// để kiểm chứng đúng hằng của file, không phải hằng probe tự đặt.
function extractOutDirSlug(src) {
  const m = /CDP_HANG_OUT_DIR = path\.join\(os\.homedir\(\), "workspace", "vcut-cdp-hang-snapshots", "([^"]+)"\)/.exec(src);
  if (!m) throw new Error("không tìm thấy CDP_HANG_OUT_DIR bền trong source");
  return m[1];
}

function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      try { if (spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0) { log(`Xvfb: dùng chung display ${DISPLAY}`); resolve(null); return; } } catch { /* kệ */ }
      try { fs.unlinkSync(sock); } catch { /* kệ */ }
    }
    const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    (async () => {
      for (let i = 0; i < 40; i++) { if (fs.existsSync(sock)) { log(`Xvfb lên: DISPLAY=${DISPLAY}`); resolve(xvfb); return; } await sleep(250); }
      reject(new Error(`Xvfb không tạo socket ${sock}`));
    })();
  });
}

async function startPipeChrome(PipeCdp) {
  for (const bin of BINARIES) {
    if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "o2-probe-"));
    const chrome = spawn(bin, ["--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required", "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => {});
    try {
      const cdp = new PipeCdp(chrome);
      await cdp.send("Target.getTargets", {}, undefined, 30000);
      log(`pipe OK (${bin}) pid=${chrome.pid}`);
      return { cdp, chrome, profile };
    } catch (e) {
      log(`BLOCKER-PIPE ${bin}: ${e.message}`);
      try { chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  }
  return null;
}

async function startWsChrome() {
  for (const bin of BINARIES) {
    if (!fs.existsSync(bin)) { log(`BLOCKER-WS ${bin}: không thấy binary`); continue; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "o2-probe-ws-"));
    const chrome = spawn(bin, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
      "--mute-audio", `--remote-debugging-port=${WS_PORT}`, `--user-data-dir=${profile}`,
      "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
    try {
      let targets = [];
      for (let i = 0; i < 30 && targets.length === 0; i++) {
        await sleep(1000);
        try { targets = await (await fetch(`http://127.0.0.1:${WS_PORT}/json/list`)).json(); } catch { /* chưa lên */ }
      }
      const page = targets.find((t) => t.type === "page");
      if (!page?.webSocketDebuggerUrl) throw new Error("không lấy được page webSocketDebuggerUrl");
      log(`ws OK (${bin}) pid=${chrome.pid}`);
      return { chrome, profile, wsUrl: page.webSocketDebuggerUrl };
    } catch (e) {
      log(`BLOCKER-WS ${bin}: ${e.message}`);
      try { chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  }
  return null;
}

function waitWsOpen(ws) {
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
}

function readSnapshots(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}

async function main() {
  const results = [];
  let xvfb = null;
  let exitCode = 0;
  try {
    xvfb = await startXvfb();

    // ---- Target 1: pipe, outDir bền mới (nested-ramp) ----
    {
      const r = { target: "pipe-durable-nested-ramp", file: "clicktest-nested-ramp-pipe.mjs", checks: {} };
      results.push(r);
      try {
        const src = fs.readFileSync(path.join(SCRIPTS_DIR, r.file), "utf8");
        const slug = extractOutDirSlug(src);
        r.outDirSlug = slug;
        r.checks.outDirIsDurable = slug === "clicktest-nested-ramp-pipe";
        r.checks.outDirNotTmp = !src.includes('os.tmpdir(), "vcut-cdp-hang');
        const outDir = path.join(DURABLE_ROOT, slug);
        r.outDir = outDir;
        const classSrc = extractClass(src, "PipeCdp");
        r.checks.classHasSnapshotCall = classSrc.includes("captureCdpHangSnapshot");
        const PipeCdp = new Function("log", "captureCdpHangSnapshot", "CDP_HANG_OUT_DIR", "HANG_BUNDLE", "DISPLAY", "PORT",
          `${classSrc}\nreturn PipeCdp;`)(log, captureCdpHangSnapshot, outDir, null, DISPLAY, 4193);
        fs.rmSync(outDir, { recursive: true, force: true });
        const holder = await startPipeChrome(PipeCdp);
        if (!holder) { r.checks.pipeOk = false; r.pass = false; exitCode = 2; }
        else {
          r.checks.pipeOk = true;
          r.chromePid = holder.chrome.pid;
          let timeoutErr = null;
          try { await holder.cdp.send("Target.getTargets", {}, undefined, 1); }
          catch (e) { timeoutErr = e.message; }
          r.timeoutErr = timeoutErr;
          r.checks.rejectIsOriginalTimeoutError = typeof timeoutErr === "string"
            && timeoutErr.startsWith("CDP timeout Target.getTargets") && timeoutErr.includes("sau 1ms");
          await sleep(500);
          const files = readSnapshots(outDir);
          r.checks.snapshotFileCount = files.length;
          let snap = null;
          if (files.length === 1) snap = JSON.parse(fs.readFileSync(path.join(outDir, files[0]), "utf8"));
          r.checks.snapshotMethod = snap?.method ?? null;
          r.checks.snapshotTimeoutMs = snap?.timeoutMs ?? null;
          r.checks.snapshotPidMatchesChrome = snap?.proc?.pid === holder.chrome.pid;
          r.checks.snapshotChromeAlive = snap?.proc?.exitCode === null && snap?.proc?.signalCode === null && snap?.proc?.killed === false;
          r.checks.snapshotPsHasChrome = typeof snap?.ps === "string" && snap.ps.includes("chrome");
          try {
            const after = await holder.cdp.send("Target.getTargets", {}, undefined, 30000);
            r.checks.pipeAliveAfterTimeout = after !== undefined;
          } catch (e) { r.checks.pipeAliveAfterTimeout = false; r.checks.pipeAliveError = e.message; }
          try { holder.chrome.kill("SIGKILL"); } catch {}
          try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
          r.pass = r.checks.outDirIsDurable && r.checks.outDirNotTmp && r.checks.classHasSnapshotCall
            && r.checks.pipeOk && r.checks.rejectIsOriginalTimeoutError && r.checks.snapshotFileCount === 1
            && r.checks.snapshotMethod === "Target.getTargets" && r.checks.snapshotTimeoutMs === 1
            && r.checks.snapshotPidMatchesChrome && r.checks.snapshotChromeAlive && r.checks.snapshotPsHasChrome
            && r.checks.pipeAliveAfterTimeout;
          if (!r.pass) exitCode = 1;
        }
        log(`pipe-durable: pass=${r.pass}`);
      } catch (e) { r.error = e.message; r.pass = false; exitCode = 1; log(`pipe-durable: LỖI probe: ${e.message}`); }
    }

    // ---- Target 2+3: WebSocket Cdp (bench + check-proxy) ----
    for (const file of ["bench-preview-fps.mjs", "check-proxy-auto.mjs"]) {
      const r = { target: `ws-${file}`, file, checks: {} };
      results.push(r);
      try {
        const src = fs.readFileSync(path.join(SCRIPTS_DIR, file), "utf8");
        const slug = extractOutDirSlug(src);
        r.outDirSlug = slug;
        r.checks.outDirIsDurable = slug === file.replace(/\.mjs$/, "");
        const outDir = path.join(DURABLE_ROOT, slug);
        r.outDir = outDir;
        const classSrc = extractClass(src, "Cdp");
        r.checks.classHasSnapshotCall = classSrc.includes("captureCdpHangSnapshot");
        r.checks.classHasProcField = classSrc.includes("this.proc");
        r.checks.fileAssignsProc = src.includes("cdp.proc = chrome;");
        const Cdp = new Function("captureCdpHangSnapshot", "CDP_HANG_OUT_DIR",
          `${classSrc}\nreturn Cdp;`)(captureCdpHangSnapshot, outDir);
        fs.rmSync(outDir, { recursive: true, force: true });
        const holder = await startWsChrome();
        if (!holder) { r.checks.wsOk = false; r.pass = false; exitCode = 2; }
        else {
          r.checks.wsOk = true;
          r.chromePid = holder.chrome.pid;
          const cdp = new Cdp(holder.wsUrl);
          cdp.proc = holder.chrome;
          await waitWsOpen(cdp.ws);
          let timeoutErr = null;
          try { await cdp.send("Target.getTargets", {}, 1); }
          catch (e) { timeoutErr = e.message; }
          r.timeoutErr = timeoutErr;
          r.checks.rejectIsOriginalTimeoutError = timeoutErr === "CDP timeout: Target.getTargets";
          await sleep(500);
          const files = readSnapshots(outDir);
          r.checks.snapshotFileCount = files.length;
          let snap = null;
          if (files.length === 1) snap = JSON.parse(fs.readFileSync(path.join(outDir, files[0]), "utf8"));
          r.checks.snapshotMethod = snap?.method ?? null;
          r.checks.snapshotTimeoutMs = snap?.timeoutMs ?? null;
          r.checks.snapshotPidMatchesChrome = snap?.proc?.pid === holder.chrome.pid;
          r.checks.snapshotChromeAlive = snap?.proc?.exitCode === null && snap?.proc?.signalCode === null && snap?.proc?.killed === false;
          r.checks.snapshotPsHasChrome = typeof snap?.ps === "string" && snap.ps.includes("chrome");
          r.checks.snapshotTransportWs = snap?.extra?.transport === "websocket";
          r.checks.snapshotBundleNull = snap?.bundle === null;
          try {
            const after = await cdp.send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, 30000);
            r.checks.wsAliveAfterTimeout = after?.result?.value === 2;
          } catch (e) { r.checks.wsAliveAfterTimeout = false; r.checks.wsAliveError = e.message; }
          try { cdp.close(); } catch {}
          try { holder.chrome.kill("SIGKILL"); } catch {}
          try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
          r.pass = r.checks.outDirIsDurable && r.checks.classHasSnapshotCall && r.checks.classHasProcField
            && r.checks.fileAssignsProc && r.checks.wsOk && r.checks.rejectIsOriginalTimeoutError
            && r.checks.snapshotFileCount === 1 && r.checks.snapshotMethod === "Target.getTargets"
            && r.checks.snapshotTimeoutMs === 1 && r.checks.snapshotPidMatchesChrome
            && r.checks.snapshotChromeAlive && r.checks.snapshotPsHasChrome && r.checks.snapshotTransportWs
            && r.checks.snapshotBundleNull && r.checks.wsAliveAfterTimeout;
          if (!r.pass) exitCode = 1;
        }
        log(`${r.target}: pass=${r.pass}`);
      } catch (e) { r.error = e.message; r.pass = false; exitCode = 1; log(`${r.target}: LỖI probe: ${e.message}`); }
    }

    // ---- Target 4: default module khi quên outDir ----
    {
      const r = { target: "module-default-outdir", checks: {} };
      results.push(r);
      try {
        const dir = path.join(DURABLE_ROOT, "_unspecified");
        fs.rmSync(dir, { recursive: true, force: true });
        const res = captureCdpHangSnapshot({ proc: null, pendingCount: 0, method: "O2Probe", timeoutMs: 1, extra: { probe: "o2-default" } });
        r.checks.fileWritten = typeof res.file === "string" && fs.existsSync(res.file);
        r.checks.fileUnderDurableRoot = typeof res.file === "string" && res.file.startsWith(dir);
        r.checks.noError = !res.error;
        r.file = res.file ?? null;
        // Dọn file probe để thư mục _unspecified chỉ chứa snapshot treo thật sau này.
        if (res.file) fs.rmSync(res.file, { force: true });
        r.pass = r.checks.fileWritten && r.checks.fileUnderDurableRoot && r.checks.noError;
        if (!r.pass) exitCode = 1;
        log(`module-default: pass=${r.pass} file=${r.file}`);
      } catch (e) { r.error = e.message; r.pass = false; exitCode = 1; log(`module-default: LỖI probe: ${e.message}`); }
    }
  } catch (e) {
    log(`BLOCKER: ${e.message}`);
    exitCode = 2;
  } finally {
    try { xvfb?.kill("SIGKILL"); } catch {}
  }
  const out = { at: new Date().toISOString(), display: DISPLAY, wsPort: WS_PORT, results };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileEpermRetry(OUT_FILE, JSON.stringify(out, null, 2));
  log(`kết quả: ${OUT_FILE} exit=${exitCode}`);
  process.exit(exitCode);
}

main();
