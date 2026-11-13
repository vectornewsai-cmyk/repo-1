#!/usr/bin/env node
/**
 * r86n7-video-operator2-headed.mjs — Phase 9 đợt 86, luồng N7: hoàn thiện
 * danh tính toán tử video (đóng nợ M2 §1.4 + L2 §5.1).
 *
 * Khác M2: bậc 0->255 (trích trọng số rời rạc độ phân giải 1/255), 2 vị
 * trí biên (x=320/160, y=180/90) để phủ pha dày, thang 1,0 + 1,2638889 +
 * 2,2639 + downscale 0,5, patch màu bão hoà (định danh ma trận YUV->RGB),
 * thống kê kênh alpha, composite globalAlpha=0,5 trên nền đen/trắng, CTM
 * offX=0,5 (kiểm hình học CTM). Tái dùng media M2 (lineV-gray) + media mới.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r86n7-video-operator2-headed.mjs
 * Env: R86N7_VO_HTTP_PORT (5701), R86N7_VO_DEBUG_PORT (9781).
 * Ra: hidden_files/round86-n7/r86n7-video-operator2.json (+ log console).
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
const N7 = path.join(GOAL, "round86-n7");
const MEDIA = path.join(N7, "media");
const OUT = path.join(N7, "r86n7-video-operator2.json");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const HTTP_PORT = Number(process.env.R86N7_VO_HTTP_PORT || 5701);
const DEBUG_PORT = Number(process.env.R86N7_VO_DEBUG_PORT || 9781);
const SCALES = [1.0, 1.125, 1.2638889, 1.5, 2.25, 2.2639, 3.0, 0.5];

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

const VIDEOS = ["stepV255", "stepH255", "stepV255b", "stepH255b", "patches", "lineV-gray"];
const PROBE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r86n7 video operator probe 2</title></head><body>
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
  let aMin = 255, aMax = 0, aSum = 0;
  for (let i = 0; i < w * h; i++) {
    rgb[i*3] = d[i*4]; rgb[i*3+1] = d[i*4+1]; rgb[i*3+2] = d[i*4+2];
    const a = d[i*4+3]; if (a < aMin) aMin = a; if (a > aMax) aMax = a; aSum += a;
  }
  return { w, h, rgbB64: b64Of(rgb), alpha: { min: aMin, max: aMax, mean: +(aSum / (w * h)).toFixed(2) } };
}
async function loadVideo(file) {
  const v = document.getElementById("v");
  v.src = file;
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("load lỗi " + file)); });
  const seeked = new Promise((res) => { v.onseeked = res; setTimeout(res, 1500); });
  try { v.currentTime = 1.0; } catch (e) {}
  await seeked;
  await new Promise((r) => setTimeout(r, 300));
  return v;
}
// V = strip ngang 8 hàng y=170..177 full-width; H = strip dọc 8 cột
// x=310..317 full-height; patch = 2 strip ngang y=80..99 và y=260..279.
function stripsFor(kind, dw, dh, s) {
  if (kind === "H") return [{ key: "", x: 310, y: 0, w: 8, h: dh }];
  if (kind === "patch") return [
    { key: "-top", x: 0, y: Math.round(90 * s) - 10, w: dw, h: 20 },
    { key: "-bot", x: 0, y: Math.round(270 * s) - 10, w: dw, h: 20 },
  ];
  return [{ key: "", x: 0, y: 170, w: dw, h: 8 }];
}
function stripsForSrc(kind) {
  if (kind === "H") return [{ key: "", x: 310, y: 0, w: 8, h: 360 }];
  if (kind === "patch") return [
    { key: "-top", x: 0, y: 80, w: 640, h: 20 },
    { key: "-bot", x: 0, y: 260, w: 640, h: 20 },
  ];
  return [{ key: "", x: 0, y: 170, w: 640, h: 8 }];
}
function drawScaled(ctx, src, dw, dh, q) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = q;
  ctx.drawImage(src, 0, 0, dw, dh);
}
async function dumpOne(file, kind) {
  const v = await loadVideo(file);
  const vw0 = v.videoWidth, vh0 = v.videoHeight;
  const out = { file, videoW: vw0, videoH: vh0, currentTime: +v.currentTime.toFixed(3), duration: v.duration, readyState: v.readyState, seekableEnd: v.seekable.length ? +v.seekable.end(0).toFixed(3) : -1, dumps: {} };
  const cB = document.createElement("canvas");
  cB.width = vw0; cB.height = vh0;
  const xB = cB.getContext("2d", { willReadFrequently: true });
  xB.drawImage(v, 0, 0, vw0, vh0);
  for (const st of stripsForSrc(kind)) out.dumps["B-1to1" + st.key] = grab(cB, st.x, st.y, st.w, st.h);
  for (const s of ${JSON.stringify(SCALES)}) {
    const dw = Math.round(vw0 * s), dh = Math.round(vh0 * s);
    const sts = stripsFor(kind, dw, dh, s);
    const c = document.createElement("canvas");
    c.width = dw; c.height = dh;
    const x = c.getContext("2d", { willReadFrequently: true });
    drawScaled(x, v, dw, dh, "high");
    for (const st of sts) out.dumps["exp-high-video-s" + s + st.key] = grab(c, st.x, st.y, st.w, st.h);
    if (s === 1.5 || s === 2.25) {
      const cL = document.createElement("canvas");
      cL.width = dw; cL.height = dh;
      const xL = cL.getContext("2d", { willReadFrequently: true });
      drawScaled(xL, v, dw, dh, "low");
      for (const st of sts) out.dumps["exp-low-video-s" + s + st.key] = grab(cL, st.x, st.y, st.w, st.h);
    }
    const c2 = document.createElement("canvas");
    c2.width = dw; c2.height = dh;
    const x2 = c2.getContext("2d", { willReadFrequently: true });
    drawScaled(x2, cB, dw, dh, "high");
    for (const st of sts) out.dumps["exp-high-canvas-s" + s + st.key] = grab(c2, st.x, st.y, st.w, st.h);
  }
  // CTM ở s=2,2639 đúng thang L2 (khung 1449x815), offX=0 và offX=0,5.
  {
    const s = 815 / 360, dw = 1449, dh = 815;
    for (const offX of [0, 0.5]) {
      const c = document.createElement("canvas");
      c.width = dw; c.height = dh;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.fillStyle = "#000"; x.fillRect(0, 0, dw, dh);
      x.setTransform(s, 0, 0, s, offX, 0);
      drawScaled(x, v, vw0, vh0, "high");
      for (const st of stripsFor(kind, dw, dh, s)) out.dumps["ctm-off" + offX + "-video-s2.2639" + st.key] = grab(c, st.x, st.y, st.w, st.h);
    }
  }
  // Composite globalAlpha=0,5 trên nền đen/trắng (chỉ stepV255, s=1,5).
  if (file === "stepV255.mp4") {
    const s = 1.5, dw = Math.round(vw0 * s), dh = Math.round(vh0 * s);
    for (const bg of ["#000", "#fff"]) {
      const c = document.createElement("canvas");
      c.width = dw; c.height = dh;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.fillStyle = bg; x.fillRect(0, 0, dw, dh);
      x.globalAlpha = 0.5;
      drawScaled(x, v, dw, dh, "high");
      x.globalAlpha = 1;
      for (const st of stripsFor(kind, dw, dh, s)) out.dumps["comp-" + (bg === "#000" ? "black" : "white") + "-a05-s1.5" + st.key] = grab(c, st.x, st.y, st.w, st.h);
    }
  }
  return out;
}
window.__probe.run = async () => {
  const out = {};
  const kinds = { "stepV255": "V", "stepH255": "H", "stepV255b": "V", "stepH255b": "H", "patches": "patch", "lineV-gray": "V" };
  for (const name of ${JSON.stringify(VIDEOS)}) {
    out[name] = await dumpOne(name + ".mp4", kinds[name]);
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
    for (const f of VIDEOS) if (!fs.existsSync(path.join(MEDIA, f + ".mp4"))) throw new Error(`thiếu media ${f}.mp4`);
    writeFileEpermRetry(path.join(MEDIA, "r86n7-video-operator2-probe.html"), PROBE_HTML);
    const httpPort = (await pickFreePort(HTTP_PORT, HTTP_PORT + 9)) || HTTP_PORT;
    http = spawn("python3", ["-m", "http.server", String(httpPort), "--bind", "127.0.0.1"], { cwd: MEDIA, stdio: "ignore" });
    let up = false;
    for (let i = 0; i < 30 && !up; i++) {
      try { const r = await fetch(`http://127.0.0.1:${httpPort}/r86n7-video-operator2-probe.html`); if (r.ok) up = true; } catch { await sleep(500); }
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
    const DISPLAY = process.env.R86N7_VO_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :190–:199");
    const PROFILE = path.join(N7, "video-operator2-chrome-userdata");
    fs.rmSync(PROFILE, { recursive: true, force: true });
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "2560x1440x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(N7, "r86n7-video-operator2-chrome.log"), "w");
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/r86n7-video-operator2-probe.html` });
    await cdp.evalJs(`new Promise((r) => { const t = setInterval(() => { if (window.__probe && window.__probe.run) { clearInterval(t); r(true); } }, 200); })`);
    log("trang probe đã load");
    const out = await cdp.evalJs(`window.__probe.run()`);
    for (const [k, v] of Object.entries(out)) log(`${k}: video ${v.videoW}x${v.videoH} ct=${v.currentTime} seekableEnd=${v.seekableEnd} dumps=${Object.keys(v.dumps).length}`);
    if (cdp.exceptions.length) log(`CẢNH BÁO page exceptions: ${cdp.exceptions.slice(0, 3).join(" || ")}`);
    writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), scales: SCALES, ...out }, null, 2));
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
