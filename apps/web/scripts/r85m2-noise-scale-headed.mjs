#!/usr/bin/env node
/**
 * r85m2-noise-scale-headed.mjs — Phase 9 đợt 85, luồng M2: dump nhiễu
 * qua CTM-canvas ở nhiều thang so với mô hình Mitchell trên cùng B
 * (đóng nợ L2 §5.2 — tách xem Δcorr ở thang ~2 có do lệch CTM-canvas
 * khỏi Mitchell tăng theo thang hay không).
 *
 * Thiết kế: B = frame render F6 (fullrgb-plain/noise05/noise10.raw,
 * 640×360) — cùng một B cho mọi đường. 4 đường × 4 thang:
 *   explicit-canvas / ctm-canvas / explicit-video / ctm-video,
 *   s ∈ {1,125; 1,5; 2,25; 3,0}, cộng CTM s=2,2639 (1449×815).
 * Đường video dùng clip ocean-*.mp4 encode từ đúng frame đó (crf 0);
 * Bv = drawImage(video) 1:1 (base decode) — model cho đường video
 * dùng Bv, cho đường canvas dùng B raw. Grab crop giữa 320×180 (nhiễu
 * dừng — đủ cho thống kê) + full Bv 640×360.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-noise-scale-headed.mjs
 * Env: R85M2_NS_HTTP_PORT (5695), R85M2_NS_DEBUG_PORT (9775).
 * Ra: hidden_files/round85-m2/r85m2-noise-scale.json (+ log console).
 * KHÔNG push/tag/binary/workflow. Không sửa production.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const M2 = path.join(GOAL, "round85-m2");
const MEDIA = path.join(M2, "media");
const OUT = path.join(M2, "r85m2-noise-scale.json");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const HTTP_PORT = Number(process.env.R85M2_NS_HTTP_PORT || 5695);
const DEBUG_PORT = Number(process.env.R85M2_NS_DEBUG_PORT || 9775);
const SCALES = [1.125, 1.5, 2.25, 3.0];
const VARIANTS = ["plain", "noise05", "noise10"];

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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 120s: ${method}`)); }, 120000);
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

const PROBE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r85m2 noise scale probe</title></head><body>
<video id="v" muted playsinline preload="auto" style="display:none"></video>
<script>
window.__probe = {};
function b64Of(rgb) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < rgb.length; i += CH) s += String.fromCharCode.apply(null, rgb.subarray(i, i + CH));
  return btoa(s);
}
function grab(canvas, x, y, w, h) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const d = ctx.getImageData(x, y, w, h).data;
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) { rgb[i*3] = d[i*4]; rgb[i*3+1] = d[i*4+1]; rgb[i*3+2] = d[i*4+2]; }
  return { w, h, rgbB64: b64Of(rgb) };
}
async function loadRaw(name) {
  const r = await fetch(name);
  if (!r.ok) throw new Error("fetch lỗi " + name);
  const buf = new Uint8Array(await r.arrayBuffer());
  const c = document.createElement("canvas");
  c.width = 640; c.height = 360;
  const x = c.getContext("2d", { willReadFrequently: true });
  const img = x.createImageData(640, 360);
  for (let i = 0; i < 640 * 360; i++) { img.data[i*4] = buf[i*3]; img.data[i*4+1] = buf[i*3+1]; img.data[i*4+2] = buf[i*3+2]; img.data[i*4+3] = 255; }
  x.putImageData(img, 0, 0);
  return c;
}
async function loadVideo(file) {
  // Mỗi biến thể một element <video> RIÊNG — tái dùng một element sẽ
  // khiến mọi đường video đều vẽ clip load cuối cùng (lỗi đã mắc ở lần
  // chạy đầu: plain/noise đều thành noise10, stdRatio=0).
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto";
  v.style.display = "none";
  document.body.appendChild(v);
  v.src = file;
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("load lỗi " + file)); });
  const seeked = new Promise((res) => { v.onseeked = res; setTimeout(res, 1500); });
  try { v.currentTime = 1.0; } catch (e) {}
  await seeked;
  await new Promise((r) => setTimeout(r, 300));
  return v;
}
function cropRect(dw, dh) {
  // Crop giữa 320x180 (nhiễu dừng).
  return { x: Math.floor((dw - 320) / 2), y: Math.floor((dh - 180) / 2), w: 320, h: 180 };
}
window.__probe.run = async () => {
  const out = { scales: ${JSON.stringify(SCALES)}, variants: ${JSON.stringify(VARIANTS)}, base: {}, dumps: {} };
  const srcCanvas = {}, srcVideo = {};
  for (const v of ${JSON.stringify(VARIANTS)}) {
    srcCanvas[v] = await loadRaw("fullrgb-" + v + ".raw");
    const vid = await loadVideo("ocean-" + v + ".mp4");
    const cB = document.createElement("canvas");
    cB.width = 640; cB.height = 360;
    cB.getContext("2d", { willReadFrequently: true }).drawImage(vid, 0, 0, 640, 360);
    srcVideo[v] = { video: vid, canvas: cB };
    out.base["Bv-" + v] = grab(cB, 0, 0, 640, 360);
    out.base["Bv-" + v].currentTime = +vid.currentTime.toFixed(3);
  }
  function drawExplicit(src, dw, dh, q) {
    const c = document.createElement("canvas");
    c.width = dw; c.height = dh;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = q || "high";
    x.drawImage(src, 0, 0, dw, dh);
    return c;
  }
  function drawCtm(src, dw, dh, s) {
    const c = document.createElement("canvas");
    c.width = dw; c.height = dh;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = "#000"; x.fillRect(0, 0, dw, dh);
    x.setTransform(s, 0, 0, s, 0, 0);
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = "high";
    x.drawImage(src, 0, 0, 640, 360);
    return c;
  }
  for (const s of ${JSON.stringify(SCALES)}) {
    const dw = Math.round(640 * s), dh = Math.round(360 * s);
    const cr = cropRect(dw, dh);
    for (const [path, draw] of [["exp-canvas", (v) => drawExplicit(srcCanvas[v], dw, dh)], ["ctm-canvas", (v) => drawCtm(srcCanvas[v], dw, dh, s)], ["exp-video", (v) => drawExplicit(srcVideo[v].video, dw, dh)], ["ctm-video", (v) => drawCtm(srcVideo[v].video, dw, dh, s)]]) {
      for (const v of ${JSON.stringify(VARIANTS)}) {
        const c = draw(v);
        out.dumps[path + "-s" + s + "-" + v] = grab(c, cr.x, cr.y, cr.w, cr.h);
      }
    }
  }
  // CTM s=2,2639 đúng thang L2.
  {
    const s = 815 / 360, dw = 1449, dh = 815;
    const cr = cropRect(dw, dh);
    for (const [path, draw] of [["ctm-canvas", (v) => drawCtm(srcCanvas[v], dw, dh, s)], ["ctm-video", (v) => drawCtm(srcVideo[v].video, dw, dh, s)]]) {
      for (const v of ${JSON.stringify(VARIANTS)}) {
        const c = draw(v);
        out.dumps[path + "-s2.2639-" + v] = grab(c, cr.x, cr.y, cr.w, cr.h);
      }
    }
  }
  window.__probe.done = true;
  return out;
};
</script></body></html>`;

async function main() {
  let http = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { http?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);
  try {
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    for (const v of VARIANTS) {
      if (!fs.existsSync(path.join(MEDIA, `fullrgb-${v}.raw`))) throw new Error(`thiếu raw fullrgb-${v}.raw`);
      if (!fs.existsSync(path.join(MEDIA, `ocean-${v}.mp4`))) throw new Error(`thiếu video ocean-${v}.mp4`);
    }
    writeFileEpermRetry(path.join(MEDIA, "r85m2-noise-scale-probe.html"), PROBE_HTML);
    const httpPort = (await pickFreePort(HTTP_PORT, HTTP_PORT + 9)) || HTTP_PORT;
    http = spawn("python3", ["-m", "http.server", String(httpPort), "--bind", "127.0.0.1"], { cwd: MEDIA, stdio: "ignore" });
    let up = false;
    for (let i = 0; i < 30 && !up; i++) {
      try { const r = await fetch(`http://127.0.0.1:${httpPort}/r85m2-noise-scale-probe.html`); if (r.ok) up = true; } catch { await sleep(500); }
    }
    if (!up) throw new Error(`http server không lên :${httpPort}`);
    log(`http server :${httpPort} (phục vụ ${MEDIA})`);
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 190; n <= 199; n++) {
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
    const DISPLAY = process.env.R85M2_NS_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :190–:199");
    const PROFILE = path.join(M2, "noise-scale-chrome-userdata");
    fs.rmSync(PROFILE, { recursive: true, force: true });
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "2560x1440x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(M2, "r85m2-noise-scale-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1280,800", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/r85m2-noise-scale-probe.html` });
    await cdp.evalJs(`new Promise((r) => { const t = setInterval(() => { if (window.__probe && window.__probe.run) { clearInterval(t); r(true); } }, 200); })`);
    log("trang probe đã load");
    const out = await cdp.evalJs(`window.__probe.run()`);
    log(`dumps=${Object.keys(out.dumps).length} base=${Object.keys(out.base).length}`);
    if (cdp.exceptions.length) log(`CẢNH BÁO page exceptions: ${cdp.exceptions.slice(0, 3).join(" || ")}`);
    writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), ...out }, null, 2));
    log(`Đã ghi ${OUT} (${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB)`);
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
