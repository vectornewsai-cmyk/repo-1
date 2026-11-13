#!/usr/bin/env node
/**
 * probe-82j3-sample-load.mjs — Đợt 82 J3: chẩn đoán vì sao E1 lần 4/4b/4c
 * timeout ở G0 (project mẫu 3 clip + hook __vcutPreviewEnhance không
 * xuất hiện trong 180s) trong khi lần 1–3 load trong vài giây.
 *
 * KHÔNG sửa harness E1, KHÔNG sửa production. Chỉ poll trạng thái app
 * (số clip trong store, hook, lỗi trang, tài nguyên store.ts) mỗi 10s
 * trong tối đa 300s để phân biệt "chậm vì nghẽn" vs "hỏng hẳn".
 *
 * Env: J3P_SCRATCH, J3P_DEV_PORT, J3P_DEBUG_PORT, J3P_DISPLAY.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.J3P_SCRATCH || path.join(os.homedir(), "workspace", "goals",
  "capcut-clone-video-editor", "hidden_files", "round82-j3", "probe-sample-load");
const DEV_PORT = Number(process.env.J3P_DEV_PORT || 5596);
const DEBUG_PORT = Number(process.env.J3P_DEBUG_PORT || 9696);
const DISPLAY = process.env.J3P_DISPLAY || ":196";
const VITE_CFG = "/tmp/round77-e1/vite.e1.headed.config.mjs";
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"),
  path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

fs.mkdirSync(SCRATCH, { recursive: true });
const logLines = [];
function log(...a) {
  const l = `[${new Date().toISOString()}] loadavg=${fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" ")} ${a.join(" ")}`;
  logLines.push(l); console.log(l);
}
function loadAvg() { try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); } catch { return "?"; } }

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl); this.nextId = 1; this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); p(msg); }
    };
  }
  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.nextId++;
      const timer = setTimeout(() => { this.pending.delete(id); rej(new Error(`CDP timeout 60s: ${method}`)); }, 60000);
      this.pending.set(id, (msg) => { clearTimeout(timer); if (msg.error) rej(new Error(msg.error.message)); else res(msg.result); });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 500));
    return r.result.value;
  }
}

const PROBE_FN = `(async () => {
  const st = (() => { try {
    const entries = performance.getEntriesByType("resource").map((e) => e.name);
    const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u));
    return { storeTsLoaded: !!hit };
  } catch (e) { return { storeTsLoaded: false, err: String(e) }; } })();
  let clips = null, hook = null, storeErr = null;
  try {
    const entries = performance.getEntriesByType("resource").map((e) => e.name);
    const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
    const mod = window.__j3pStoreMod || (window.__j3pStoreMod = await import(hit));
    const s = mod.useStore.getState();
    clips = s.spec.tracks.flatMap((t) => t.clips).map((c) => c.id);
  } catch (e) { storeErr = String((e && (e.stack || e.message)) || e).slice(0, 300); }
  try { hook = window.__vcutPreviewEnhance ? { clipId: window.__vcutPreviewEnhance.clipId || null } : null; } catch {}
  return { ...st, nClips: clips ? clips.length : null, clipIds: clips, hook,
    storeErr, errors: (window.__e1errors || []).slice(0, 5),
    canvases: document.querySelectorAll("canvas").length,
    bodyText: (document.body.innerText || "").slice(0, 120) };
})()`;

async function waitPort(port, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const ok = await new Promise((res) => { const s = net.createServer(); s.once("error", () => res(false)); s.once("listening", () => s.close(() => res(true))); s.listen(port, "127.0.0.1"); });
    if (ok) return true; await sleep(500);
  }
  return false;
}

let vite, xvfb, chrome;
try {
  log(`probe bắt đầu: vite :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}`);
  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "2560x1440x24"], { stdio: "ignore" });
  await sleep(1500);
  vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"], { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"] });
  vite.stdout.on("data", (d) => fs.appendFileSync(path.join(SCRATCH, "vite.log"), d));
  vite.stderr.on("data", (d) => fs.appendFileSync(path.join(SCRATCH, "vite.log"), d));
  await waitPort(DEV_PORT, 90000);
  log("vite đã lên");
  const env = { ...process.env, DISPLAY };
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, "--no-sandbox", "--disable-dev-shm-usage",
    "--window-size=2560,1440", "--user-data-dir=" + path.join(SCRATCH, "chrome-userdata"), "about:blank"],
    { env, stdio: ["ignore", "pipe", "pipe"] });
  chrome.stdout.on("data", (d) => fs.appendFileSync(path.join(SCRATCH, "chrome.log"), d));
  chrome.stderr.on("data", (d) => fs.appendFileSync(path.join(SCRATCH, "chrome.log"), d));
  // chờ DevTools
  let targets = null;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`); targets = await r.json(); break; }
    catch { await sleep(1000); }
  }
  if (!targets) throw new Error("không lấy được /json từ Chrome");
  const page = targets.find((t) => t.type === "page");
  const cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${DEV_PORT}/` });
  await sleep(5000);
  // poll trạng thái mỗi 10s, tối đa 300s
  const t0 = Date.now();
  let ready = false;
  while (Date.now() - t0 < 300000) {
    let out;
    try { out = await cdp.evalJs(PROBE_FN); }
    catch (e) { out = { evalError: String(e).slice(0, 200) }; }
    log(`poll t+${Math.round((Date.now() - t0) / 1000)}s: ${JSON.stringify(out)}`);
    if (out && out.nClips === 3 && out.hook && out.hook.clipId) { ready = true; log("PROJECT ĐÃ LOAD (3 clip + hook) — chỉ chậm, không hỏng"); break; }
    await sleep(10000);
  }
  if (!ready) log("KẾT LUẬN PROBE: sau 300s vẫn chưa load — cần điều tra thêm (không phải chỉ chậm vài chục giây)");
  writeFileEpermRetry(path.join(SCRATCH, "probe.log"), logLines.join("\n") + "\n");
} catch (e) {
  log(`PROBE LỖI: ${e && (e.stack || e.message)}`);
  writeFileEpermRetry(path.join(SCRATCH, "probe.log"), logLines.join("\n") + "\n");
} finally {
  try { chrome && chrome.kill("SIGKILL"); } catch {}
  try { vite && vite.kill("SIGKILL"); } catch {}
  try { xvfb && xvfb.kill("SIGKILL"); } catch {}
  log("probe kết thúc, đã kill vite/chrome/xvfb");
  writeFileEpermRetry(path.join(SCRATCH, "probe.log"), logLines.join("\n") + "\n");
}
