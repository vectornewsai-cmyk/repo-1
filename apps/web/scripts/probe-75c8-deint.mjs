#!/usr/bin/env node
/**
 * probe-75c8-deint.mjs — Phase 9 đợt 75, luồng C8: probe xấp xỉ deinterlace
 * cho preview (gap E3 — deinterlace là tính năng enhance duy nhất chưa có
 * xấp xỉ preview nào; D3 full-res chưa đo — nợ đợt 61 §6.4 / đợt 63 §6.7).
 *
 * Đo trên tab trắng (không cần app): decode interlaced720.mp4 + clean720.mp4
 * + bản render yadif thật (render.js) rồi vẽ qua từng ứng viên xấp xỉ,
 * đo tỉ lệ combing cross-field/same-field (C/S, như D1 đợt 61 R3) và độ
 * sắc nét dọc (vgrad). Ứng viên:
 *   noop  — vẽ thường (đối chứng)
 *   tap1  — drawImage lệch dọc +0.5px (bilinear → trung bình 2 dòng kề:
 *           hạt nhân [1,1]/2, khử xen kẽ Nyquist, chỉ 1 lần vẽ)
 *   tap2  — 2 lần vẽ alpha 0.5 lệch ±0.5px (hạt nhân [1,2,1]/4)
 *   svg08 — ctx.filter url(#f) feGaussianBlur stdDeviation "0 0.8"
 *   svg12 — như trên, stdDeviation "0 1.2"
 *   blur05 — ctx.filter blur(0.5px) đẳng hướng (tham chiếu: làm mờ cả ngang)
 * Sweep tỉ lệ: R của noop khi vẽ interlaced xuống các chiều cao 275 / 360 /
 * 490 / 540 / 720 (scaleY 0.38 / 0.5 / 0.68 / 0.75 / 1.0) để chọn ngưỡng
 * cổng áp xấp xỉ (dưới ngưỡng nào thì downscale đã giấu răng cưa).
 *
 * Ground truth render: render.js với enhance.deinterlace trên interlaced720
 * + đối chứng không enhance; idet prog trước/sau (mẫu D2 đợt 61 R3).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/probe-75c8-deint.mjs
 * Env: C8_DEV_PORT (5550–5559), C8_DEBUG_PORT (9650–9659), C8_DISPLAY
 * (:180–:189), C8_SCRATCH (mặc định hidden_files/round75-c8).
 * Exit 0 khi probe xong (kể cả khi 1 ứng viên không hỗ trợ — ghi rõ),
 * 1 khi harness lỗi. KHÔNG sửa code sản phẩm. KHÔNG push/tag/binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const MEDIA_DIR = path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const SCRATCH = process.env.C8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round75-c8");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round75-c8";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.c8.config.mjs");
const CHROME_PW = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = fs.existsSync(CHROME_PW) ? CHROME_PW : findChrome();

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
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
}

// ---- Probe trong trang: đo C/S + vgrad + MAD-vs-noop cho từng ứng viên ----
const PROBE_FN = (videoUrl) => `(async () => {
  const W = 1280, H = 720;
  // SVG filter dọc (feGaussianBlur chỉ theo y) — gắn 1 lần vào DOM.
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.innerHTML = '<defs>'
    + '<filter id="c8f08" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0 0.8"/></filter>'
    + '<filter id="c8f12" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0 1.2"/></filter>'
    + '</defs>';
  document.body.appendChild(svg);
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const metrics = (d, w, h) => {
    const x0 = Math.floor(w * 0.1), x1 = Math.floor(w * 0.9), y0 = Math.floor(h * 0.1), y1 = Math.floor(h * 0.9);
    const lum = (x, y) => { const i = (y * w + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
    let cross = 0, same = 0, n = 0, vg = 0, vn = 0;
    for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
      cross += Math.abs(lum(x, y) - lum(x, y + 1));
      same += Math.abs(lum(x, y) - lum(x, y + 2));
      n++;
    }
    for (let y = y0; y < y1 - 1; y += 2) for (let x = x0; x < x1; x += 2) {
      vg += Math.abs(lum(x, y) - lum(x, y + 1)); vn++;
    }
    return { cross: +(cross / n).toFixed(3), same: +(same / n).toFixed(3),
      ratio: +((cross / n) / Math.max(same / n, 0.001)).toFixed(2),
      vgrad: +(vg / vn).toFixed(3) };
  };
  const madVs = (d, ref, w, h) => {
    let s = 0, n = 0;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      s += Math.abs(d[i] - ref[i]) + Math.abs(d[i + 1] - ref[i + 1]) + Math.abs(d[i + 2] - ref[i + 2]);
      n += 3;
    }
    return +(s / n).toFixed(3);
  };
  function drawCandidate(name) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.filter = "none";
    if (name === "noop") { ctx.drawImage(v, 0, 0, W, H); }
    else if (name === "tap1") { ctx.drawImage(v, 0, 0.5, W, H); }
    else if (name === "tap2") {
      ctx.globalAlpha = 0.5; ctx.drawImage(v, 0, -0.5, W, H); ctx.drawImage(v, 0, 0.5, W, H);
    }
    else if (name === "svg08") { ctx.filter = "url(#c8f08)"; ctx.drawImage(v, 0, 0, W, H); }
    else if (name === "svg12") { ctx.filter = "url(#c8f12)"; ctx.drawImage(v, 0, 0, W, H); }
    else if (name === "blur05") { ctx.filter = "blur(0.5px)"; ctx.drawImage(v, 0, 0, W, H); }
    else throw new Error("ứng viên lạ " + name);
    ctx.restore();
    return ctx.getImageData(0, 0, W, H).data;
  }
  const CANDS = ["noop", "tap1", "tap2", "svg08", "svg12", "blur05"];
  const out = { video: ${JSON.stringify(videoUrl)}, times: [] };
  for (const t of [1.0, 2.0, 3.0]) {
    await new Promise((res) => { v.onseeked = res; v.currentTime = t; });
    await new Promise((r) => setTimeout(r, 150));
    const row = { t };
    let ref = null;
    for (const name of CANDS) {
      const d = drawCandidate(name);
      const m = metrics(d, W, H);
      if (name === "noop") { ref = d; row.noop = m; }
      else row[name] = { ...m, madVsNoop: madVs(d, ref, W, H) };
    }
    out.times.push(row);
  }
  // Sweep tỉ lệ downscale (noop): R theo chiều cao vẽ.
  out.scaleSweep = [];
  for (const hOut of [275, 360, 490, 540, 576, 612, 648, 684, 720]) {
    const wOut = Math.round(1280 * hOut / 720);
    const cs = document.createElement("canvas"); cs.width = wOut; cs.height = hOut;
    const sctx = cs.getContext("2d", { willReadFrequently: true });
    const rows = [];
    for (const t of [1.0, 2.0, 3.0]) {
      await new Promise((res) => { v.onseeked = res; v.currentTime = t; });
      await new Promise((r) => setTimeout(r, 150));
      sctx.clearRect(0, 0, wOut, hOut);
      sctx.drawImage(v, 0, 0, wOut, hOut);
      rows.push(metrics(sctx.getImageData(0, 0, wOut, hOut).data, wOut, hOut).ratio);
    }
    out.scaleSweep.push({ h: hOut, scaleY: +(hOut / 720).toFixed(2), ratios: rows,
      meanRatio: +(rows.reduce((a, b) => a + b, 0) / rows.length).toFixed(2) });
  }
  return out;
})()`;

function idetProg(mp4) {
  const r = spawnSync("ffmpeg", ["-i", mp4, "-vf", "idet", "-f", "null", "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const m = [...(r.stderr || "").matchAll(/Single frame detection:.*?TFF:\s*(\d+).*?BFF:\s*(\d+).*?Progressive:\s*(\d+).*?Undetermined:\s*(\d+)/gs)];
  if (!m.length) throw new Error(`không parse được idet cho ${mp4}:\n${(r.stderr || "").slice(-500)}`);
  const g = m[m.length - 1];
  const tff = Number(g[1]), bff = Number(g[2]), prog = Number(g[3]), und = Number(g[4]);
  const total = tff + bff + prog + und;
  return { tff, bff, prog, und, progRatio: total ? +(prog / total).toFixed(3) : -1 };
}
function renderSpec(specObj, name) {
  const specPath = path.join(SCRATCH, `${name}.json`);
  const outPath = path.join(SCRATCH, `${name}.mp4`);
  writeFileEpermRetry(specPath, JSON.stringify(specObj));
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(ROOT, "server", "render", "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", MEDIA_DIR, "-y", "--x264-preset", "veryfast", "--crf", "23"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const secs = (Date.now() - t0) / 1000;
  return { status: r.status, stderr: (r.stderr || "").toString(), outPath, secs, fps: 150 / secs };
}

let vite = null, xvfb = null, chrome = null;
async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const DEV_PORT = Number(process.env.C8_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
  const DEBUG_PORT = Number(process.env.C8_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 180; n <= 189; n++) {
      const d = `:${n}`;
      const sock = `/tmp/.X11-unix/X${n}`;
      if (fs.existsSync(sock)) {
        let alive = false;
        try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
        if (alive) continue;
        try { fs.unlinkSync(sock); } catch {}
        try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
        log(`đã dọn socket X mồ côi ${sock}`);
      }
      return d;
    }
    return null;
  }
  const DISPLAY = process.env.C8_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r75c8-media/${f}`;
  const OUT_URL = (f) => `${DEV_URL}r75c8-out/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  const TMPDIR = "/tmp/round75-c8/tmp";
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
  writeFileEpermRetry(VITE_CFG, `import fs from "node:fs";
import path from "node:path";
const MEDIA_DIR = ${JSON.stringify(MEDIA_DIR)};
const OUT_DIR = ${JSON.stringify(SCRATCH)};
const MIME = { ".mp4": "video/mp4", ".png": "image/png", ".webm": "video/webm", ".jpg": "image/jpeg" };
const serveDir = (dir) => (req, res) => {
  const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\\//, "");
  const fp = path.join(dir, name);
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!name || name.includes("..") || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.statusCode = 404; res.end("not found"); return; }
  const st = fs.statSync(fp);
  const range = req.headers.range;
  res.setHeader("Content-Type", MIME[path.extname(fp).toLowerCase()] || "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");
  if (range) {
    const m = /bytes=(\\d+)-(\\d*)/.exec(range);
    if (m) {
      const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
      res.statusCode = 206;
      res.setHeader("Content-Range", \`bytes \${start}-\${end}/\${st.size}\`);
      res.setHeader("Content-Length", String(end - start + 1));
      fs.createReadStream(fp, { start, end }).pipe(res);
      return;
    }
  }
  res.setHeader("Content-Length", String(st.size));
  fs.createReadStream(fp).pipe(res);
};
export default { server: { hmr: false }, plugins: [{ name: "c8-media", configureServer(server) {
  server.middlewares.use("/r75c8-media", serveDir(MEDIA_DIR));
  server.middlewares.use("/r75c8-out", serveDir(OUT_DIR));
} }] };
`);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, loadavg ${loadAvg()}`);

  // ---- Ground truth render: yadif + đối chứng (Node, trước khi mở Chrome) ----
  const vclip = (id, src, duration, extra) => ({ id, kind: "video", src, start: 0, duration, in: 0, out: duration, sourceAudioMode: "mute", ...(extra || {}) });
  const specWith = (tracks) => ({ version: "0.2.0", meta: { name: "r75c8", width: 1280, height: 720, fps: 30 }, tracks });
  const idetSrc = idetProg(path.join(MEDIA_DIR, "interlaced720.mp4"));
  log(`IDET nguồn interlaced720.mp4: TFF=${idetSrc.tff} BFF=${idetSrc.bff} Prog=${idetSrc.prog} Und=${idetSrc.und} prog=${idetSrc.progRatio}`);
  const rDeint = renderSpec(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "interlaced720.mp4", 5, { enhance: { deinterlace: true } })] }]), "c8-deint");
  const rCtrl = renderSpec(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "interlaced720.mp4", 5)] }]), "c8-deint-control");
  let idetDeint = null, idetCtrl = null;
  if (rDeint.status === 0 && rCtrl.status === 0 && fs.existsSync(rDeint.outPath) && fs.existsSync(rCtrl.outPath)) {
    idetDeint = idetProg(rDeint.outPath);
    idetCtrl = idetProg(rCtrl.outPath);
    log(`RENDER yadif: ${rDeint.secs.toFixed(1)}s wall (${rDeint.fps.toFixed(2)} fps), idet prog ${idetDeint.progRatio} (TFF=${idetDeint.tff} Prog=${idetDeint.prog})`);
    log(`RENDER đối chứng: ${rCtrl.secs.toFixed(1)}s wall, idet prog ${idetCtrl.progRatio} (TFF=${idetCtrl.tff} Prog=${idetCtrl.prog})`);
  } else {
    log(`RENDER LỖI: deint status=${rDeint.status} (${(rDeint.stderr || "").slice(-300)}), control status=${rCtrl.status}`);
  }

  const viteLogFd = fs.openSync(path.join(SCRATCH, "c8-vite.log"), "w");
  vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
  log("vite dev đã lên");
  const mediaProbe = await fetch(MEDIA_URL("clean720.mp4"), { headers: { Range: "bytes=0-99" } });
  const mediaCT = mediaProbe.headers.get("content-type") || "";
  if (mediaProbe.status !== 206 || !mediaCT.includes("video/mp4")) throw new Error(`middleware media không phục vụ được clean720.mp4 (HTTP ${mediaProbe.status}, content-type ${mediaCT})`);

  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
  {
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
      else await sleep(500);
    }
    if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s`);
  }
  if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "c8-chrome.log"), "w");
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
    { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
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

  const results = { idetSrc, idetDeint, idetCtrl, renderDeintFps: rDeint.fps, renderCtrlFps: rCtrl.fps, loadavg: loadAvg(), probes: {} };
  for (const [key, url] of [
    ["interlaced", MEDIA_URL("interlaced720.mp4")],
    ["clean", MEDIA_URL("clean720.mp4")],
    ["yadif", OUT_URL("c8-deint.mp4")],
    ["yadifControl", OUT_URL("c8-deint-control.mp4")],
  ]) {
    log(`probe ${key} ... (loadavg ${loadAvg()})`);
    results.probes[key] = await cdp.evalJs(PROBE_FN(url));
    const p = results.probes[key];
    log(`  ${key}: noop R ${p.times.map((r) => r.noop.ratio).join("/")} | tap1 ${p.times.map((r) => r.tap1.ratio).join("/")} | tap2 ${p.times.map((r) => r.tap2.ratio).join("/")} | svg08 ${p.times.map((r) => r.svg08.ratio).join("/")} | svg12 ${p.times.map((r) => r.svg12.ratio).join("/")} | blur05 ${p.times.map((r) => r.blur05.ratio).join("/")}`);
    log(`  ${key}: vgrad noop ${p.times.map((r) => r.noop.vgrad).join("/")} | tap1 ${p.times.map((r) => r.tap1.vgrad).join("/")} | tap2 ${p.times.map((r) => r.tap2.vgrad).join("/")} | svg08 ${p.times.map((r) => r.svg08.vgrad).join("/")} | svg12 ${p.times.map((r) => r.svg12.vgrad).join("/")} | blur05 ${p.times.map((r) => r.blur05.vgrad).join("/")}`);
    log(`  ${key}: madVsNoop tap1 ${p.times.map((r) => r.tap1.madVsNoop).join("/")} | tap2 ${p.times.map((r) => r.tap2.madVsNoop).join("/")} | svg08 ${p.times.map((r) => r.svg08.madVsNoop).join("/")} | svg12 ${p.times.map((r) => r.svg12.madVsNoop).join("/")} | blur05 ${p.times.map((r) => r.blur05.madVsNoop).join("/")}`);
    log(`  ${key} scaleSweep noop R: ${p.scaleSweep.map((s) => `${s.h}=${s.meanRatio}`).join(" ")}`);
  }
  writeFileEpermRetry(path.join(SCRATCH, "probe-75c8-deint.json"), JSON.stringify(results, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "probe-75c8-deint.log"), logLines.join("\n") + "\n");
  log("probe xong — JSON: hidden_files/round75-c8/probe-75c8-deint.json");
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e.stack || e}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-75c8-deint.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
  process.exitCode = 1;
}).finally(() => {
  try { chrome?.kill(); } catch {}
  try { xvfb?.kill(); } catch {}
  try { vite?.kill(); } catch {}
});
