#!/usr/bin/env node
/**
 * r72z9-chrome-dense.mjs — Phase 9 đợt 72, luồng Z9 (đóng nợ đợt 71 §5 mục 10):
 * probe thang DÀY (dense scale sweep) để fit bias LOD theo thang. BẢN SỬA (v2): chia probe thành
 * từng eval nhỏ theo thang (3 thang/eval) thay vì 1 eval 15 thang — lần chạy
 * v1 timeout CDP 180s do máy tải cao (loadavg ~10, các luồng đợt 71 khác
 * chạy song song) + log node bị file log Chrome truncate đè mất (đã tách
 * file log: node stdout riêng, chrome log riêng). Ghi JSON tăng dần sau
 * mỗi chunk để dữ liệu từng phần không mất nếu eval sau lỗi.
 *
 * Bối cảnh: nợ gốc U2 §7.1 (0,45–0,63 chưa đo) đã được V3 đợt 68 pin ở 0,5
 * DƯỚI MÔ HÌNH 2-STAGE CŨ; W5 đợt 69 chứng minh mô hình đúng là trilinear
 * mipmap LOD-bias −0,5 (ngưỡng 0,5 chỉ là hệ quả: λ*=0,5 tại s=0,5) và X1
 * đợt 70 đã áp trilinear vào production. Ngưỡng halve CÒN LẠI chưa đo
 * chính xác là NGƯỠNG BẬT MIP-1: s* = 2^(−0,5) ≈ 0,7071 theo mô hình —
 * trên s* Chrome dùng thuần triangle h=1 (không halve), dưới s* bắt đầu
 * blend mip 1 (halve một lần). W5 chỉ bracket (0,70; 0,7656] qua probe
 * chặng-2 (t=0,02 ở s2=0,70; t=0 ở s2≥0,7656), chưa pin.
 *
 * Probe đường toàn trình 512→dw (hình học vuông, như U2/V3/W5):
 *  - 6 thang vùng nhiệm vụ: dw 230/246/256/282/307/323 (s≈0,45–0,63)
 *  - 9 thang vùng bật mip-1: dw 333/348/353/358/362/364/369/384/410
 *    (s≈0,65–0,80, lưới mịn quanh 0,7071)
 * Mỗi thang: sweep X 128 pha + sweep Y 128 pha (xung 1D), texture trắng
 * 3 seed → V_1D, xung điểm 2D (256,256), phẳng 128 → DC.
 * Lặp lại dw=282 cuối phiên để kiểm tra tính xác định (U2: n=3 identical).
 *
 * Chrome 1254 headed qua Xvfb (--disable-gpu; U2 đã chứng minh 3 bộ flag
 * byte-identical). Display :180–189, cổng debug 9680–9689 (tránh đụng
 * các luồng đợt 71 khác dùng dải W5 :190–199 / 9780–9789).
 * Ghi JSON: r71y7-threshold-A.json. KHÔNG push/tag/binary.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round72-z9");
const CHROME = process.env.R72Z9_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
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
  for (let n = 150; n <= 159; n++) {
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
  const DEBUG_PORT = await pickFreePort(9610, 9619);
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9610–9619");
  const DISPLAY = await pickDisplay();
  if (!DISPLAY) throw new Error("hết display trống :150–:159");
  const PROFILE = path.join(GOAL, profileName);
  const TMPDIR = "/tmp/round72-z9/tmp";
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

// Probe 1 chunk (mảng dw) — trả {scales:{dw:entry}, userAgent}
function probeFnFor(dws) {
  return `(() => {
  const NP = 128;
  function drawInto(src, dw, dh) {
    const c = document.createElement("canvas"); c.width = dw; c.height = dh;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    x.drawImage(src, 0, 0, dw, dh);
    return { canvas: c, ctx: x };
  }
  function rowR(ctx, dw, y) { const d = ctx.getImageData(0, y, dw, 1).data; const r = []; for (let i = 0; i < dw; i++) r.push(d[i * 4]); return r; }
  function colR(ctx, dw, x) { const d = ctx.getImageData(x, 0, 1, dw).data; const r = []; for (let i = 0; i < dw; i++) r.push(d[i * 4]); return r; }
  function rnd(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  function probeDraw(S, dw, phaseBase, point) {
    const entry = { S, dw, actualScale: dw / S, sweepSqX: [], sweepSqY: [], texture: [], point: null, dc: null };
    const src = document.createElement("canvas"); src.width = S; src.height = S;
    const sx = src.getContext("2d");
    const yMid = Math.floor(dw / 2), xMid = Math.floor(dw / 2);
    for (let k = 0; k < NP; k++) {
      const x = phaseBase + k;
      sx.fillStyle = "#000"; sx.fillRect(0, 0, S, S);
      sx.fillStyle = "#fff"; sx.fillRect(x, 0, 1, S);
      const { ctx } = drawInto(src, dw, dw);
      entry.sweepSqX.push({ p: x, row: rowR(ctx, dw, yMid) });
    }
    for (let k = 0; k < NP; k++) {
      const y = phaseBase + k;
      sx.fillStyle = "#000"; sx.fillRect(0, 0, S, S);
      sx.fillStyle = "#fff"; sx.fillRect(0, y, S, 1);
      const { ctx } = drawInto(src, dw, dw);
      entry.sweepSqY.push({ p: y, row: colR(ctx, dw, xMid) });
    }
    for (const seed of [42, 43, 44]) {
      const r = rnd(seed);
      const img = sx.createImageData(S, S);
      for (let i = 0; i < S * S; i++) { const v = Math.floor(r() * 256); img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
      sx.putImageData(img, 0, 0);
      const { ctx } = drawInto(src, dw, dw);
      const d = ctx.getImageData(0, 0, dw, dw).data;
      let m = 0; for (let i = 0; i < dw * dw; i++) m += d[i * 4]; m /= dw * dw;
      let v = 0; for (let i = 0; i < dw * dw; i++) v += (d[i * 4] - m) * (d[i * 4] - m); v /= dw * dw;
      entry.texture.push({ seed, mean: +m.toFixed(2), V: +(v / ((255 * 255) / 12)).toFixed(4) });
    }
    {
      const [px, py] = point;
      sx.fillStyle = "#000"; sx.fillRect(0, 0, S, S);
      sx.fillStyle = "#fff"; sx.fillRect(px, py, 1, 1);
      const { ctx } = drawInto(src, dw, dw);
      const d = ctx.getImageData(0, 0, dw, dw).data;
      let peak = 0, peakX = -1, peakY = -1;
      for (let y = 0; y < dw; y++) for (let x = 0; x < dw; x++) { const v = d[(y * dw + x) * 4]; if (v > peak) { peak = v; peakX = x; peakY = y; } }
      entry.point = { peak, peakX, peakY };
    }
    {
      sx.fillStyle = "rgb(128,128,128)"; sx.fillRect(0, 0, S, S);
      const { ctx } = drawInto(src, dw, dw);
      const d = ctx.getImageData(0, 0, dw, dw).data;
      let m = 0, mn = 255, mx = 0;
      for (let i = 0; i < dw * dw; i++) { const v = d[i * 4]; m += v; if (v < mn) mn = v; if (v > mx) mx = v; }
      entry.dc = { mean: +(m / (dw * dw)).toFixed(3), min: mn, max: mx };
    }
    return entry;
  }
  const out = { userAgent: navigator.userAgent, scales: {} };
  for (const dw of ${JSON.stringify(dws)}) out.scales[String(dw)] = probeDraw(512, dw, 256, [256, 256]);
  return out;
})()`;
}

async function main() {
  try {
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    fs.mkdirSync(GOAL, { recursive: true });
    log("loadavg lúc bắt đầu: " + fs.readFileSync("/proc/loadavg", "utf8").trim());
    const { cdp, killAll } = await launch(["--disable-gpu"], "chrome-userdata-z9", "r72z9-chrome-A-chrome.log");
    const DWS = [154, 170, 180, 188, 192, 195, 196, 197, 200, 203, 206, 210, 220, 270, 295, 312, 318, 322, 326, 330, 334, 338, 342, 346, 375, 395, 415, 435]; // 28 thang mới (Y7 đã đo 15 thang khác — fit gộp sau)
    const CHUNK = 3;
    const all = { userAgent: null, scales: {} };
    const outPath = path.join(GOAL, "r72z9-dense-A.json");
    try {
      for (let i = 0; i < DWS.length; i += CHUNK) {
        const chunk = DWS.slice(i, i + CHUNK);
        const t0 = Date.now();
        const res = await cdp.evalJs(probeFnFor(chunk));
        if (!res || !res.scales) throw new Error("probe chunk không trả dữ liệu: " + chunk.join(","));
        if (!all.userAgent) all.userAgent = res.userAgent;
        Object.assign(all.scales, res.scales);
        writeFileEpermRetry(outPath, JSON.stringify(all)); // ghi tăng dần
        log(`chunk [${chunk.join(",")}] xong trong ${((Date.now() - t0) / 1000).toFixed(1)}s; UA=${res.userAgent}`);
        log("loadavg: " + fs.readFileSync("/proc/loadavg", "utf8").trim());
      }
      // determinism: lặp lại dw=282
      const rep = await cdp.evalJs(probeFnFor([195]));
      all.repeat195 = rep.scales["195"];
      writeFileEpermRetry(outPath, JSON.stringify(all));
      const det = JSON.stringify(all.scales["195"]) === JSON.stringify(all.repeat195);
      log("determinism dw=195 (s≈0,38, thang then chốt): " + (det ? "IDENTICAL (byte-identical)" : "KHÁC NHAU — xem xét"));
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
