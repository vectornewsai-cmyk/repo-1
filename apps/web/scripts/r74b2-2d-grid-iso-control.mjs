#!/usr/bin/env node
/**
 * r74b2-2d-grid-iso-control.mjs — Phase 9 đợt 74, luồng B2 (task 1, đối chứng):
 * chạy LẠI probe lưới pha mịn với dst VUÔNG 230x230 (s=0,4492) và 384x384
 * (s=0,75) bằng ĐÚNG code probe dị hướng (r74b2-2d-grid-aniso.mjs) để kiểm
 * chứng harness: nếu harness đúng, dữ liệu đẳng hướng phải khớp production
 * blend-at-end tới maxAbs=1 như Z7/A1 đã đo (259.584 ô). Nếu khớp → kết
 * luận "kernel dẹt hẹp hơn hẳn kernel đẳng hướng" là THẬT (không phải lỗi
 * harness); nếu không khớp → probe dị hướng có lỗi hệ thống.
 * Chạy: node r74b2-2d-grid-iso-control.mjs (~1 phút).
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round74-b2");
const CHROME = process.env.R74B2_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; console.log(l); }

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
    this.nextId = 1; this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 300s: ${method}`)); }, 300000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 900));
    return r.result.value;
  }
}
async function pickDisplay() {
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
async function launch(extraFlags, profileName, logName) {
  let xvfb = null, chrome = null;
  const killAll = () => { try { chrome?.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} };
  const DEBUG_PORT = await pickFreePort(9590, 9599);
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9590–9599");
  const DISPLAY = process.env.R74B2_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :170–:179");
  const PROFILE = path.join(GOAL, profileName);
  const TMPDIR = "/tmp/round74-b2/tmp";
  fs.mkdirSync(GOAL, { recursive: true });
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  log(`launch flags=[${extraFlags.join(" ")}] debug :${DEBUG_PORT} DISPLAY=${DISPLAY}`);
  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "800x600x24"], { stdio: "ignore" });
  await sleep(1200);
  if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
  const chromeLogFd = fs.openSync(path.join(GOAL, logName), "w");
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
    "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
    "--no-default-browser-check", "--window-size=800,600", "--hide-scrollbars",
    ...extraFlags, "about:blank"],
    { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
  try {
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
    return { cdp, killAll };
  } catch (e) {
    killAll();
    throw e;
  }
}
function probeFnFor(dw, dh) {
  return `(() => {
  const S = 512, dw = ${dw}, dh = ${dh}, sx = dw / S, sy = dh / S;
  const src = document.createElement("canvas"); src.width = S; src.height = S;
  const sx2 = src.getContext("2d");
  const dst = document.createElement("canvas"); dst.width = dw; dst.height = dh;
  const dx = dst.getContext("2d");
  const P0 = 248, PN = 16, HALF = 6;
  const points = [];
  for (let py = P0; py < P0 + PN; py++) {
    for (let px = P0; px < P0 + PN; px++) {
      sx2.fillStyle = "#000"; sx2.fillRect(0, 0, S, S);
      sx2.fillStyle = "#fff"; sx2.fillRect(px, py, 1, 1);
      dx.imageSmoothingEnabled = true; dx.imageSmoothingQuality = "high";
      dx.drawImage(src, 0, 0, dw, dh);
      const ex = Math.round((px + 0.5) * sx - 0.5), ey = Math.round((py + 0.5) * sy - 0.5);
      const sx0 = Math.max(0, ex - 10), sy0 = Math.max(0, ey - 10);
      const sw = Math.min(21, dw - sx0), sh = Math.min(21, dh - sy0);
      const d = dx.getImageData(sx0, sy0, sw, sh).data;
      let peak = -1, pkx = -1, pky = -1, sum21 = 0;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const v = d[(y * sw + x) * 4];
        sum21 += v;
        if (v > peak) { peak = v; pkx = sx0 + x; pky = sy0 + y; }
      }
      const wx0 = Math.max(0, pkx - HALF), wy0 = Math.max(0, pky - HALF);
      const ww = Math.min(2 * HALF + 1, dw - wx0), wh = Math.min(2 * HALF + 1, dh - wy0);
      const wd = dx.getImageData(wx0, wy0, ww, wh).data;
      const win = [];
      let edgePeak = (pkx - sx0 <= 0 || pkx - sx0 >= sw - 1 || pky - sy0 <= 0 || pky - sy0 >= sh - 1);
      for (let b = -HALF; b <= HALF; b++) {
        const row = [];
        for (let a = -HALF; a <= HALF; a++) {
          const x = pkx + a, y = pky + b;
          if (x < wx0 || y < wy0 || x >= wx0 + ww || y >= wy0 + wh) { row.push(-1); continue; }
          row.push(wd[((y - wy0) * ww + (x - wx0)) * 4]);
        }
        win.push(row);
      }
      points.push({ px, py, peak, peakX: pkx, peakY: pky, expX: ex, expY: ey, sum21, edgePeak, win });
    }
  }
  return { userAgent: navigator.userAgent, dw, dh, sx, sy, grid: [P0, PN], half: HALF, points };
})()`;
}
const PAIRS = [[230, 230], [384, 384]];
async function main() {
  try {
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    fs.mkdirSync(GOAL, { recursive: true });
    const { cdp, killAll } = await launch(["--disable-gpu"], "chrome-userdata-b2-iso", "r74b2-chrome-iso.log");
    const all = { userAgent: null, pairs: {} };
    const outPath = path.join(GOAL, "r74b2-2d-grid-iso-control.json");
    try {
      for (const [dw, dh] of PAIRS) {
        const t0 = Date.now();
        const res = await cdp.evalJs(probeFnFor(dw, dh));
        if (!res || !res.points || res.points.length !== 256) throw new Error(`probe ${dw}x${dh} không trả đủ 256 điểm`);
        if (!all.userAgent) all.userAgent = res.userAgent;
        all.pairs[`${dw}x${dh}`] = res;
        writeFileEpermRetry(outPath, JSON.stringify(all));
        log(`${dw}x${dh} xong trong ${((Date.now() - t0) / 1000).toFixed(1)}s; edgePeak=${res.points.filter((p) => p.edgePeak).length}/256; sum21=[${Math.min(...res.points.map((p) => p.sum21))},${Math.max(...res.points.map((p) => p.sum21))}]`);
      }
      log("probe đối chứng xong: " + Object.keys(all.pairs).length + " cặp");
    } finally { killAll(); await sleep(400); }
    log("xong");
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  }
}
main();
