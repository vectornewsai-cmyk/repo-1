#!/usr/bin/env node
/**
 * r71y2-video-probe.mjs — Phase 9 đợt 71, luồng Y2, thí nghiệm (b):
 * probe bộ lọc resample của Chrome với NGUỒN VIDEO THẬT (U2/W5 chỉ
 * probe bằng ảnh/canvas). Cùng một mẫu (vline/hline/step/dot 1280x720)
 * vẽ 1 lần từ <video> (decode YUV420p h264 CRF0) và 1 lần từ <img> PNG,
 * cùng dst size, imageSmoothingQuality="high" như preview.tsx.
 * So MAD video-vs-canvas + fit mô hình ở script phân tích Node
 * (r71y2-analyze.mjs) — harness này chỉ đo và lưu JSON thô.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r71y2-video-probe.mjs
 * Env: R71Y2_PROBE_DIR (mặc định hidden_files/round71-y2/probe),
 * R71Y2_DISPLAY (mặc định quét :170–:179), R71Y2_DEBUG_PORT (9660–9669).
 * Exit 0 đo xong, 1 case fail, 2 harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round71-y2");
const PROBE_DIR = process.env.R71Y2_PROBE_DIR || path.join(GOAL, "probe");
const CHROME = process.env.R71Y2_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params?.exceptionDetails || {};
        this.exceptions.push(d.exception?.description || d.text || JSON.stringify(d).slice(0, 500));
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 60s: ${method}`)); }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const MIME = { ".html": "text/html", ".png": "image/png", ".mp4": "video/mp4", ".json": "application/json" };

async function main() {
  let server = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  };
  process.on("exit", killAll);
  try {
    for (const f of ["probe.html", "probe-vline.mp4", "probe-vline.png", "probe-hline.mp4", "probe-hline.png", "probe-step.mp4", "probe-step.png", "probe-dot.mp4", "probe-dot.png"]) {
      if (!fs.existsSync(path.join(PROBE_DIR, f))) throw new Error(`thiếu probe asset ${f}`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    const PORT = await pickFreePort(5770, 5779);
    const DEBUG_PORT = await pickFreePort(9660, 9669);
    if (!PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
    server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "probe.html";
      const fp = path.join(PROBE_DIR, p);
      if (!fp.startsWith(PROBE_DIR) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404); res.end("nf"); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream", "Accept-Ranges": "bytes" });
      fs.createReadStream(fp).pipe(res);
    });
    await new Promise((res, rej) => { server.once("error", rej); server.listen(PORT, "127.0.0.1", res); });
    log(`probe server :${PORT}, debug :${DEBUG_PORT}`);

    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 170; n <= 179; n++) {
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock}`);
        }
        return `:${n}`;
      }
      return null;
    }
    const DISPLAY = process.env.R71Y2_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :170–:179");
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const PROFILE = path.join(PROBE_DIR, "chrome-userdata");
    fs.rmSync(PROFILE, { recursive: true, force: true });
    const chromeLogFd = fs.openSync(path.join(PROBE_DIR, "r71y2-probe-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR: "/tmp/round71-y2" } });
    fs.mkdirSync("/tmp/round71-y2", { recursive: true });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error("không lấy được page target CDP");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/probe.html` });
    await cdp.waitFor(async () => (await cdp.evalJs(`typeof window.__r71y2probe === "function" ? true : null`).catch(() => null)), "probe.html load", 60000);
    log("probe page đã load");
    const t0 = Date.now();
    const result = await cdp.evalJs(`window.__r71y2probe()`);
    log(`probe chạy xong trong ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    const outPath = path.join(PROBE_DIR, "r71y2-video-probe.json");
    writeFileEpermRetry(outPath, JSON.stringify(result, null, 2));
    log(`JSON kết quả: ${outPath}`);
    log(`meta video: ${JSON.stringify(result.meta)}`);
    log(`determinism: ${JSON.stringify(result.determinism)}`);
    if (cdp.exceptions.length) log(`CẢNH BÁO exceptions trang: ${cdp.exceptions.slice(0, 3).join(" || ")}`);
    process.exitCode = result.determinism?.videoVline489RepeatIdentical ? 0 : 1;
    if (process.exitCode !== 0) log("FAIL determinism: video draw 2 lần không identical");
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
