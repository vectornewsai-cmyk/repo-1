#!/usr/bin/env node
/**
 * probe-downscale-r62.mjs — ĐO cho R3 đợt 62 (a): cơ chế downscale-upscale
 * thay blur thuần cho denoise preview.
 *
 * Đo trên frame phẳng+nhiễu thật (frame15.png / frame40.png, media đợt 61):
 * std reduction, meanAbsDiff, step-edge 25–75% cho các hệ số downscale f
 * (vẽ xuống W*f×H*f rồi vẽ ngược lên W×H), ở full-res 1280×720 và ở
 * kích thước preview 488×275; cộng thêm vài điểm hybrid downscale+blur.
 * Mục tiêu: tìm ánh xạ strength → f khớp hqdn3d (-19% @0.3, -47% @0.5,
 * -74% @0.8, -83% @1.0) mà không có vùng chết / plateau như blur.
 *
 * Chạy: node apps/web/scripts/probe-downscale-r62.mjs (từ gốc repo).
 * Media: ~/workspace/.scratch-r61r3-1cOf/media (đợt 61).
 * KHÔNG sửa code sản phẩm, KHÔNG push.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MEDIA_DIR = "/home/hatch/workspace/.scratch-r61r3-1cOf/media";
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const PROFILE = "/tmp/round62-r3/probe-profile";
const DISPLAY = ":176";
const OUT_DIR = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round62-r3");
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

const PROBE_FN = (imgUrl, factors, hybrids, targetW, targetH) => `(async () => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("không tải được ảnh")); img.src = ${JSON.stringify(imgUrl)}; });
  // Chuẩn hoá về khổ đo (full-res hoặc preview 488x275) bằng 1 lần drawImage.
  const W = ${JSON.stringify(targetW)}, H = ${JSON.stringify(targetH)};
  const base = document.createElement("canvas"); base.width = W; base.height = H;
  const bctx = base.getContext("2d", { willReadFrequently: true });
  bctx.drawImage(img, 0, 0, W, H);
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
  const edgeCanvas = document.createElement("canvas"); edgeCanvas.width = W; edgeCanvas.height = H;
  const ectx0 = edgeCanvas.getContext("2d");
  ectx0.fillStyle = "#000"; ectx0.fillRect(0, 0, W / 2, H);
  ectx0.fillStyle = "#fff"; ectx0.fillRect(W / 2, 0, W, H);
  const applyDownscale = (src, f, blurPx) => {
    const sw = Math.max(2, Math.round(W * f)), sh = Math.max(2, Math.round(H * f));
    const small = document.createElement("canvas"); small.width = sw; small.height = sh;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(src, 0, 0, sw, sh);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const octx = out.getContext("2d", { willReadFrequently: true });
    if (blurPx > 0) octx.filter = \`blur(\${blurPx}px)\`;
    octx.drawImage(small, 0, 0, W, H);
    octx.filter = "none";
    return out;
  };
  const edgeWidth = (canvas) => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0);
    const y = Math.floor(H / 2);
    const data = ctx.getImageData(0, y, W, 1).data;
    const v = (x) => data[x * 4];
    let x25 = -1, x75 = -1;
    for (let x = 0; x < W; x++) { if (x25 < 0 && v(x) >= 64) x25 = x; if (x75 < 0 && v(x) >= 192) x75 = x; }
    return (x25 >= 0 && x75 >= 0) ? x75 - x25 : -1;
  };
  const baseData = bctx.getImageData(0, 0, W, H).data;
  const baseStats = stats(baseData);
  const measure = (canvas) => {
    const data = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const s = stats(data);
    let sum = 0, cnt = 0;
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) { sum += Math.abs(data[i + ch] - baseData[i + ch]); cnt++; }
    }
    return { stdMean: +s.stdMean.toFixed(3), reduct: +(((baseStats.stdMean - s.stdMean) / baseStats.stdMean) * 100).toFixed(1), meanAbs: +(sum / cnt).toFixed(3), edge: edgeWidth(canvas) };
  };
  const rows = [{ f: 1, ...measure(base), note: "gốc" }];
  for (const f of ${JSON.stringify(factors)}) {
    rows.push({ f, ...measure(applyDownscale(base, f, 0)) });
  }
  const hyb = [];
  for (const h of ${JSON.stringify(hybrids)}) {
    hyb.push({ f: h.f, blur: h.b, ...measure(applyDownscale(base, h.f, h.b)) });
  }
  return { base: +baseStats.stdMean.toFixed(3), rows, hyb };
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
      { stdio: "ignore", env: { ...process.env, DISPLAY, TMPDIR: "/tmp/round62-r3/tmp" } });
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
    const FACTORS = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15];
    const HYBRIDS = [{ f: 0.5, b: 0.9 }, { f: 0.4, b: 0.9 }, { f: 0.5, b: 1.5 }, { f: 0.35, b: 0.9 }, { f: 0.3, b: 0.9 }];
    const out = {};
    for (const [name, url, W, H] of [
      ["frame15-720p", `http://127.0.0.1:${PORT}/frame15.png`, 1280, 720],
      ["frame40-720p", `http://127.0.0.1:${PORT}/frame40.png`, 1280, 720],
      ["frame15-preview", `http://127.0.0.1:${PORT}/frame15.png`, 488, 275],
      ["frame40-preview", `http://127.0.0.1:${PORT}/frame40.png`, 488, 275],
    ]) {
      const r = await cdp.evalJs(PROBE_FN(url, FACTORS, HYBRIDS, W, H));
      out[name] = r;
      log(`== ${name} base std ${r.base} ==`);
      for (const row of r.rows) log(`  f=${row.f}: std ${row.stdMean}, giảm ${row.reduct}%, meanAbs ${row.meanAbs}, edge ${row.edge}px`);
      for (const h of r.hyb) log(`  HYB f=${h.f}+blur${h.blur}: std ${h.stdMean}, giảm ${h.reduct}%, meanAbs ${h.meanAbs}, edge ${h.edge}px`);
    }
    // Lặp lại 1 lần vài điểm để kiểm tra tính lặp lại.
    const r2 = await cdp.evalJs(PROBE_FN(`http://127.0.0.1:${PORT}/frame15.png`, [0.9, 0.7, 0.5, 0.3], [], 1280, 720));
    log(`lặp lại frame15-720p: ` + r2.rows.slice(1).map((x) => `f=${x.f}→giảm ${x.reduct}% edge ${x.edge}px`).join(", "));
    out.repeat = r2;
    fs.mkdirSync(OUT_DIR, { recursive: true });
    writeFileEpermRetry(path.join(OUT_DIR, "downscale-probe.json"), JSON.stringify(out, null, 2));
    log("xong, đã ghi downscale-probe.json");
    process.exitCode = 0;
  } catch (e) {
    log(`PROBE LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
