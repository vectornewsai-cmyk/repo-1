#!/usr/bin/env node
/**
 * clicktest-m5-round30-snapshot-probe.mjs — Phase 9 đợt 30, luồng M5:
 * kiểm chứng kỷ luật snapshot treo CDP (cdp-snapshot.mjs) bằng treo
 * GIẢ LẬP CÓ CHỦ ĐÍCH trên pipe thật: gửi một lệnh CDP với timeout
 * 1ms (quá ngắn để phản hồi kịp) rồi xác nhận:
 *   (a) lệnh reject đúng lỗi timeout gốc (ngữ nghĩa không đổi),
 *   (b) một file snapshot được ghi ra với đủ trường: capturedAt,
 *       method, timeoutMs, proc.pid/exitCode, ps chứa chrome,
 *       bundle name + sha256_16 của dist đang đo,
 *   (c) pipe vẫn dùng được sau đó (lệnh bình thường vẫn resolve).
 * Đây KHÔNG phải một lần treo thật — nó chứng minh cơ chế snapshot
 * kích hoạt đúng lúc timeout, để lần treo thật sau này tự để lại
 * bằng chứng (nợ đợt 28/29). KHÔNG sửa code sản phẩm, KHÔNG push,
 * KHÔNG tag/release, KHÔNG binary. Cổng 4195, display :95.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round30-m5-probe");
const SNAP_DIR = path.join(SCRATCH, "cdp-hang-snapshots");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.M5_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.M5_DISPLAY || ":95";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) { const l = `[${stamp()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
  }
  // Bản send CÓ nối snapshot dùng chung — sao chép đúng kỷ luật
  // cdp-snapshot.mjs §QUY TRÌNH: snapshot đồng bộ trước reject.
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        try {
          const snap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: SNAP_DIR, bundle: this.hangBundle ?? null,
            extra: { display: DISPLAY, probe: "m5-round30-deliberate-1ms-timeout" },
          });
          if (snap.file) log(`CDP-DIAG snapshot đã ghi: ${snap.file}`);
          else log(`CDP-DIAG snapshot GHI LỖI: ${snap.error}`);
        } catch (e) { log(`CDP-DIAG snapshot lỗi: ${e.message}`); }
        reject(new Error(`CDP timeout ${method} sau ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
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

function distBundle() {
  const distDir = path.join(WEB_DIR, "dist");
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  const m = /assets\/index-[A-Za-z0-9_-]+\.js/.exec(html);
  if (!m) return null;
  const bundlePath = path.join(distDir, m[0]);
  if (!fs.existsSync(bundlePath)) return null;
  return { bundle: path.basename(bundlePath), sha: crypto.createHash("sha256").update(fs.readFileSync(bundlePath)).digest("hex").slice(0, 16) };
}

async function startChrome() {
  for (const bin of BINARIES) {
    if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "m5-probe-"));
    const chrome = spawn(bin, ["--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required", "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => {});
    try {
      const cdp = new PipeCdp(chrome);
      await cdp.send("Target.getTargets", {}, undefined, 30000);
      const target = await cdp.send("Target.createTarget", { url: "about:blank" });
      await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
      for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
      if (!cdp.sessionId) throw new Error("không nhận được sessionId");
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

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.rmSync(SNAP_DIR, { recursive: true, force: true });
  const checks = {};
  let xvfb = null, holder = null, exitCode = 2;
  try {
    xvfb = await startXvfb();
    const bundle = distBundle();
    log(`dist bundle: ${bundle ? `${bundle.bundle} sha256[:16]=${bundle.sha}` : "KHÔNG XÁC ĐỊNH"}`);
    holder = await startChrome();
    if (!holder) { log("BLOCKER: không mở được pipe Chrome"); return 2; }
    holder.cdp.hangBundle = bundle;
    // (1) Treo giả lập: timeout 1ms có chủ đích.
    let timeoutErr = null;
    try { await holder.cdp.send("Target.getTargets", {}, undefined, 1); }
    catch (e) { timeoutErr = e.message; }
    checks.rejectIsOriginalTimeoutError = typeof timeoutErr === "string" && timeoutErr.startsWith("CDP timeout Target.getTargets sau 1ms");
    log(`treo giả lập: reject=${JSON.stringify(timeoutErr)} -> ${checks.rejectIsOriginalTimeoutError ? "ĐÚNG lỗi gốc" : "SAI"}`);
    await sleep(500);
    // (2) File snapshot phải tồn tại, đúng method/timeout/pid/bundle/ps.
    const files = fs.existsSync(SNAP_DIR) ? fs.readdirSync(SNAP_DIR).filter((f) => f.endsWith(".json")) : [];
    checks.snapshotFileCount = files.length;
    let snap = null;
    if (files.length === 1) { snap = JSON.parse(fs.readFileSync(path.join(SNAP_DIR, files[0]), "utf8")); }
    checks.snapshotMethod = snap?.method ?? null;
    checks.snapshotTimeoutMs = snap?.timeoutMs ?? null;
    checks.snapshotProcPidMatchesChrome = snap?.proc?.pid === holder.chrome.pid;
    checks.snapshotProcAlive = snap?.proc?.exitCode === null && snap?.proc?.signalCode === null && snap?.proc?.killed === false;
    checks.snapshotPsContainsChrome = typeof snap?.ps === "string" && snap.ps.includes("chrome");
    checks.snapshotBundleMatches = !!bundle && snap?.bundle?.name === bundle.bundle && snap?.bundle?.sha256_16 === bundle.sha;
    checks.snapshotHasTimestamp = typeof snap?.capturedAt === "string" && !Number.isNaN(Date.parse(snap.capturedAt));
    log(`snapshot files: ${JSON.stringify(files)}`);
    log(`snapshot fields: method=${checks.snapshotMethod} timeoutMs=${checks.snapshotTimeoutMs} pidMatch=${checks.snapshotProcPidMatchesChrome} alive=${checks.snapshotProcAlive} psChrome=${checks.snapshotPsContainsChrome} bundleMatch=${checks.snapshotBundleMatches} ts=${checks.snapshotHasTimestamp}`);
    // (3) Pipe vẫn sống sau timeout giả lập.
    try { const r = await holder.cdp.send("Target.getTargets", {}, undefined, 30000); checks.pipeAliveAfterTimeout = Array.isArray(r?.targetInfos); }
    catch (e) { checks.pipeAliveAfterTimeout = false; checks.pipeAliveError = e.message; }
    log(`pipe sau treo giả lập: alive=${checks.pipeAliveAfterTimeout}`);
    const pass = checks.rejectIsOriginalTimeoutError && files.length === 1 && checks.snapshotMethod === "Target.getTargets"
      && checks.snapshotTimeoutMs === 1 && checks.snapshotProcPidMatchesChrome && checks.snapshotProcAlive
      && checks.snapshotPsContainsChrome && checks.snapshotBundleMatches && checks.snapshotHasTimestamp
      && checks.pipeAliveAfterTimeout === true;
    log(pass ? "PROBE PASS: snapshot treo kích hoạt đúng + đủ trường + pipe sống" : "PROBE FAIL: xem checks");
    const out = { runAt: new Date().toISOString(), label: "m5-round30-snapshot-probe", deliberateTimeout: true, bundle, checks, pass, log: logLines };
    writeFileEpermRetry(path.join(ROOT, "benchmarks", "results", "v30-m5-snapshot-probe.json"), JSON.stringify(out, null, 2));
    exitCode = pass ? 0 : 1;
  } catch (e) { log(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`); exitCode = 2; }
  finally {
    try { holder?.chrome.kill("SIGKILL"); } catch {}
    try { holder?.profile && fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
    try { xvfb && xvfb.kill("SIGKILL"); } catch {}
  }
  return exitCode;
}
process.exit(await main());
