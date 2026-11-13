#!/usr/bin/env node
/**
 * r72z7-2d-grid.mjs — Phase 9 đợt 72, luồng Z7 (nợ đợt 71 §5 mục 8):
 * probe 2D LƯỚI PHA MỊN để xác định dạng kernel 2D thật của Chrome.
 *
 * Bối cảnh (Y8): production trilinear tách trục lệch điểm 2D đo được tới
 * maxAbs 13 (14/50 ô ≥ 4) trên 5 điểm (px,py) × 10 thang; chữ ký: peak đo
 * cao hơn production 5–8%, hàng xóm trục thấp hơn 2–5%, chéo +1–2% —
 * kernel thật "tròn hơn" outer product; 2 ô ngoại lệ ở (260,250) đo
 * PHẲNG/RỘNG hơn (khối lượng nằm ngoài cửa sổ 5×5). Chưa biết dạng kernel.
 *
 * Probe: headed Chromium 1254 qua Xvfb (--disable-gpu, như U2/V3/W6/Y7
 * để so sánh được), canvas 512×512, drawImage smoothing "high", xung
 * điểm 1px trắng tại (px,py) với px,py ∈ 248..263 (lưới 16×16 = 256 điểm
 * pha mỗi thang — pha (φx,φy) phủ gần kín [0,1)² vì bước pha = s mỗi px),
 * ghi cửa sổ 13×13 quanh peak đo (scan 21×21 quanh peak kỳ vọng để tìm
 * peak thật; 13×13 đủ bao support đo được kể cả ô ngoại lệ rộng).
 * Thang: dw 256 (s=0,5, đối chứng sạch), 230 (0,4492 — tệ nhất Y8),
 * 282 (0,5508), 307 (0,5996), 323 (0,6309), 384 (0,75 — thang cao chưa
 * đo 2D). Lặp lại dw=282 cuối phiên để kiểm tra tính xác định.
 * Ghi JSON tăng dần sau mỗi thang (mất phiên sau không mất dữ liệu trước).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r72z7-2d-grid.mjs
 * Env: R72Z7_DISPLAY (mặc định quét :160–:169), R72Z7_DEBUG_PORT
 * (mặc định quét 9580–9589). KHÔNG push/tag/binary.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round72-z7");
const CHROME = process.env.R72Z7_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
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
  for (let n = 160; n <= 169; n++) {
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
  const DEBUG_PORT = await pickFreePort(9580, 9589);
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9580–9589");
  const DISPLAY = process.env.R72Z7_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :160–:169");
  const PROFILE = path.join(GOAL, profileName);
  const TMPDIR = "/tmp/round72-z7/tmp";
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

// Probe 1 thang: lưới 16×16 điểm (px,py), cửa sổ 13×13 quanh peak đo.
function probeFnFor(dw) {
  return `(() => {
  const S = 512, dw = ${dw}, s = dw / S;
  const src = document.createElement("canvas"); src.width = S; src.height = S;
  const sx = src.getContext("2d");
  const dst = document.createElement("canvas"); dst.width = dw; dst.height = dw;
  const dx = dst.getContext("2d");
  const P0 = 248, PN = 16, HALF = 6; // cửa sổ ghi 13×13 (±6); scan 21×21 (±10)
  const points = [];
  for (let py = P0; py < P0 + PN; py++) {
    for (let px = P0; px < P0 + PN; px++) {
      sx.fillStyle = "#000"; sx.fillRect(0, 0, S, S);
      sx.fillStyle = "#fff"; sx.fillRect(px, py, 1, 1);
      dx.imageSmoothingEnabled = true; dx.imageSmoothingQuality = "high";
      dx.drawImage(src, 0, 0, dw, dw);
      const ex = Math.round((px + 0.5) * s - 0.5), ey = Math.round((py + 0.5) * s - 0.5);
      const sx0 = Math.max(0, ex - 10), sy0 = Math.max(0, ey - 10);
      const sw = Math.min(21, dw - sx0), sh = Math.min(21, dw - sy0);
      const d = dx.getImageData(sx0, sy0, sw, sh).data;
      let peak = -1, pkx = -1, pky = -1, sum21 = 0;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const v = d[(y * sw + x) * 4];
        sum21 += v;
        if (v > peak) { peak = v; pkx = sx0 + x; pky = sy0 + y; }
      }
      // cửa sổ 13×13 quanh peak đo (đọc lại riêng, kẹp biên ảnh, pad -1);
      // không tái dùng dữ liệu scan 21×21 vì peak lệch có thể làm tràn.
      const wx0 = Math.max(0, pkx - HALF), wy0 = Math.max(0, pky - HALF);
      const ww = Math.min(2 * HALF + 1, dw - wx0), wh = Math.min(2 * HALF + 1, dw - wy0);
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
  return { userAgent: navigator.userAgent, dw, s, grid: [P0, PN], half: HALF, points };
})()`;
}

async function main() {
  try {
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    fs.mkdirSync(GOAL, { recursive: true });
    log("loadavg lúc bắt đầu: " + fs.readFileSync("/proc/loadavg", "utf8").trim());
    const { cdp, killAll } = await launch(["--disable-gpu"], "chrome-userdata-z7", "r72z7-chrome-A-chrome.log");
    const DWS = [256, 230, 282, 307, 323, 384];
    const all = { userAgent: null, scales: {} };
    const outPath = path.join(GOAL, "r72z7-2d-grid-A.json");
    try {
      for (const dw of DWS) {
        const t0 = Date.now();
        const res = await cdp.evalJs(probeFnFor(dw));
        if (!res || !res.points || res.points.length !== 256) throw new Error(`probe dw=${dw} không trả đủ 256 điểm`);
        if (!all.userAgent) all.userAgent = res.userAgent;
        all.scales[String(dw)] = res;
        writeFileEpermRetry(outPath, JSON.stringify(all)); // ghi tăng dần
        const edgeN = res.points.filter((p) => p.edgePeak).length;
        const sumMin = Math.min(...res.points.map((p) => p.sum21));
        const sumMax = Math.max(...res.points.map((p) => p.sum21));
        log(`dw=${dw} (s=${(dw / 512).toFixed(4)}) xong trong ${((Date.now() - t0) / 1000).toFixed(1)}s; edgePeak=${edgeN}/256; sum21=[${sumMin},${sumMax}] (kỳ vọng ~255 nếu support trong ±10)`);
        log("loadavg: " + fs.readFileSync("/proc/loadavg", "utf8").trim());
      }
      // determinism: lặp lại dw=282
      const rep = await cdp.evalJs(probeFnFor(282));
      all.repeat282 = rep;
      writeFileEpermRetry(outPath, JSON.stringify(all));
      const det = JSON.stringify(all.scales["282"]) === JSON.stringify(rep);
      log("determinism dw=282: " + (det ? "IDENTICAL (byte-identical)" : "KHÁC NHAU — xem xét"));
      log("probe xong: " + Object.keys(all.scales).length + " thang");
      log("loadavg lúc kết thúc: " + fs.readFileSync("/proc/loadavg", "utf8").trim());
    } finally { killAll(); await sleep(400); }
    log("xong");
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  }
}
main();
