#!/usr/bin/env node
/**
 * probe-blur-fine.mjs — ĐO THÊM cho R3 (b): tìm bậc lượng tử hóa chính xác
 * của ctx.filter blur() trong Chromium (không qua vite — chỉ cần 1 HTTP
 * server tĩnh + Xvfb + Chrome + CDP).
 *
 * Đo: (1) std reduction trên frame phẳng+nhiễu thật (frame15.png) ở các
 * mức blur mịn 0.65–3.0 (tìm đầu gối dead-zone và các bậc plateau);
 * (2) step-edge 25–75% width ở cùng các mức.
 * Kết quả dùng để chọn floor + thang hiệu chuẩn cho denoiseBlurPx.
 *
 * Chạy: node apps/web/scripts/probe-blur-fine.mjs (từ gốc repo).
 * Media: ~/workspace/.scratch-r61r3-XXXX/media (đọc từ round61-r3-scratch.txt).
 * KHÔNG sửa code sản phẩm, KHÔNG push.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const PROFILE = "/tmp/round61-r3/probe-profile";
const DISPLAY = ":175";

const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);

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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`timeout: ${method}`)); }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
}

const PROBE_FN = (imgUrl, levels) => `(async () => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("không tải được ảnh")); img.src = ${JSON.stringify(imgUrl)}; });
  const W = img.naturalWidth, H = img.naturalHeight;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const step = 2;
  const stats = (data) => {
    let n = 0; const sum = [0, 0, 0]; const sq = [0, 0, 0];
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) { const v = data[i + c]; sum[c] += v; sq[c] += v * v; }
      n++;
    }
    const std = [0, 1, 2].map((c) => Math.sqrt(Math.max(0, sq[c] / n - (sum[c] / n) ** 2)));
    return { stdMean: (std[0] + std[1] + std[2]) / 3 };
  };
  // Step edge (1280x720, cùng khổ ảnh).
  const edge = document.createElement("canvas"); edge.width = W; edge.height = H;
  const ectx = edge.getContext("2d");
  ectx.fillStyle = "#000"; ectx.fillRect(0, 0, W / 2, H);
  ectx.fillStyle = "#fff"; ectx.fillRect(W / 2, 0, W, H);
  const edgeWidth = (b) => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.filter = b > 0 ? \`blur(\${b}px)\` : "none";
    ctx.drawImage(edge, 0, 0);
    ctx.filter = "none";
    const y = Math.floor(H / 2);
    const data = ctx.getImageData(0, y, W, 1).data;
    const v = (x) => data[x * 4];
    let x25 = -1, x75 = -1;
    for (let x = 0; x < W; x++) { if (x25 < 0 && v(x) >= 64) x25 = x; if (x75 < 0 && v(x) >= 192) x75 = x; }
    return (x25 >= 0 && x75 >= 0) ? x75 - x25 : -1;
  };
  let baseStats = null; let baseData = null;
  const rows = [];
  for (const b of ${JSON.stringify(levels)}) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.filter = b > 0 ? \`blur(\${b}px)\` : "none";
    ctx.drawImage(img, 0, 0);
    ctx.filter = "none";
    const data = ctx.getImageData(0, 0, W, H).data;
    const s = stats(data);
    if (baseStats === null) { baseStats = s; baseData = data; rows.push({ blur: b, stdMean: +s.stdMean.toFixed(3), reduct: 0, meanAbs: 0, edge: edgeWidth(b) }); continue; }
    let sum = 0, cnt = 0;
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) { sum += Math.abs(data[i + ch] - baseData[i + ch]); cnt++; }
    }
    rows.push({ blur: b, stdMean: +s.stdMean.toFixed(3), reduct: +(((baseStats.stdMean - s.stdMean) / baseStats.stdMean) * 100).toFixed(1), meanAbs: +(sum / cnt).toFixed(3), edge: edgeWidth(b) });
  }
  return { base: +baseStats.stdMean.toFixed(3), rows };
})()`;

async function main() {
  let server = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  };
  process.on("exit", killAll);
  try {
    const PORT = await pickFreePort(5790, 5799);
    const DEBUG_PORT = await pickFreePort(9660, 9669);
    if (!PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
    server = http.createServer((req, res) => {
      const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "");
      const fp = path.join(MEDIA_DIR, name);
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (!name || name.includes("..") || !fs.existsSync(fp)) { res.statusCode = 404; res.end("nf"); return; }
      res.setHeader("Content-Type", name.endsWith(".png") ? "image/png" : "video/mp4");
      fs.createReadStream(fp).pipe(res);
    });
    await new Promise((res) => server.listen(PORT, "127.0.0.1", res));
    log(`http :${PORT}, debug :${DEBUG_PORT}, media ${MEDIA_DIR}`);
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    fs.rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: "ignore", env: { ...process.env, DISPLAY, TMPDIR: "/tmp/round61-r3/tmp" } });
    let pageTarget = null;
    for (let i = 0; i < 120 && !pageTarget; i++) {
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
    const LEVELS = [0, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0];
    const r = await cdp.evalJs(PROBE_FN(`http://127.0.0.1:${PORT}/frame15.png`, LEVELS));
    log(`frame15 base stdMean ${r.base}`);
    for (const row of r.rows) log(`  blur ${row.blur}px: std ${row.stdMean}, giảm ${row.reduct}%, meanAbs ${row.meanAbs}, edge25-75 ${row.edge}px`);
    // Lặp lại 1 lần để kiểm tra tính lặp lại của các bậc.
    const r2 = await cdp.evalJs(PROBE_FN(`http://127.0.0.1:${PORT}/frame15.png`, [0.8, 0.9, 1.2, 1.8, 2.4]));
    log(`lặp lại: ` + r2.rows.map((x) => `${x.blur}px→giảm ${x.reduct}% edge ${x.edge}px`).join(", "));
    fs.writeFileSync(path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3", "blur-fine-probe.json"), JSON.stringify({ levels: r, repeat: r2 }, null, 2));
    log("xong, đã ghi blur-fine-probe.json");
    process.exitCode = 0;
  } catch (e) {
    log(`PROBE LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
