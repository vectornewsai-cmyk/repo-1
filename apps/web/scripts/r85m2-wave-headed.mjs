#!/usr/bin/env node
/**
 * r85m2-wave-headed.mjs — Phase 9 đợt 85, luồng M2: probe sóng vuông
 * dày (sqw2/4/8 + sqw4-640 gốc) — kiểm tra xem toán tử video có phụ
 * thuộc mật độ nội dung / thang "xấu" 1,2639 hay không, sau khi probe
 * xung/bậc rời rạc cho thấy video = triangle (MAD <= 0,015) trong khi
 * L2 đo triangle lệch 0,96 trên sqw4. Thang thêm 1,2638889 (809x455,
 * đúng thang editor) để loại giả thuyết pha điểm cố định theo thang.
 *
 * Câu hỏi: toán tử resample của đường video (drawImage(video)) là gì?
 * Mọi kernel RGB offline đều không khớp (tốt nhất triangle@phase−0,03px,
 * MAD 0,49 trên sqw4; tri 3,95 trên lineart 1px). Probe này đọc TRỰC
 * TIẾP đáp ứng xung/bậc: clip tổng hợp có ground truth (bậc luma dọc/
 * ngang, vạch 1px dọc/ngang, xung 1px, bậc chroma Cb/Cr ở Y hằng),
 * drawImage(video) ở nhiều thang, đối chiếu offline với các kernel ứng
 * viên (tri/Mitchell/BC/CR/B-spline/Lanczos/Gauss/box + bilinear điểm
 * cố định kiểu libyuv + fit tự do) và với đường canvas (đối chứng).
 *
 * Hình học: EXPLICIT dw/dh (không CTM) cho sạch — thang s ∈ {1,125;
 * 1,5; 2,25; 3,0} → dw = round(640·s); cộng 1 lần CTM ở s=2,2639
 * (khung 1449×815, offX=0) để nối với số L2. Chỉ grab dải/strip quanh
 * đặc trưng (không grab full-frame) để JSON gọn.
 * Chất lượng: high + low (đối chứng — L2 thấy video không đổi theo
 * quality; canvas high ≡ Mitchell, low ≡ video).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r85m2-wave-headed.mjs
 * Env: R85M2_WV_HTTP_PORT (5693), R85M2_WV_DEBUG_PORT (9773).
 * Ra: hidden_files/round85-m2/r85m2-wave.json (+ log console).
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
const OUT = path.join(M2, "r85m2-wave.json");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const HTTP_PORT = Number(process.env.R85M2_WV_HTTP_PORT || 5693);
const DEBUG_PORT = Number(process.env.R85M2_WV_DEBUG_PORT || 9773);
const SCALES = [1.125, 1.2638889, 1.5, 2.25, 3.0];

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

const VIDEOS = ["sqw4-640", "sqw2-mid", "sqw4-mid", "sqw8-mid", "sqw4x-mid"];
const PROBE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r85m2 video operator probe</title></head><body>
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
// Dải grab theo loại clip: V = strip ngang y=170..189 (20 hàng) full-width;
// H = strip dọc x=310..329 (20 cột) full-height; impulse = patch 80x80
// TÂM TẠI VỊ TRÍ XUNG ĐÃ SCALE (320*s, 180*s).
function stripFor(kind, dw, dh, s) {
  if (kind === "H") return { x: 310, y: 0, w: 20, h: dh };
  if (kind === "impulse") {
    const cx = Math.round(320 * s), cy = Math.round(180 * s);
    return { x: Math.max(0, cx - 40), y: Math.max(0, cy - 40), w: 80, h: 80 };
  }
  return { x: 0, y: 170, w: dw, h: 20 };
}
function stripForSrc(kind) {
  if (kind === "H") return { x: 310, y: 0, w: 20, h: 360 };
  if (kind === "impulse") return { x: 280, y: 140, w: 80, h: 80 };
  return { x: 0, y: 170, w: 640, h: 20 };
}
async function dumpOne(file, kind) {
  const v = await loadVideo(file);
  const vw0 = v.videoWidth, vh0 = v.videoHeight;
  const out = { file, videoW: vw0, videoH: vh0, currentTime: +v.currentTime.toFixed(3), duration: v.duration, readyState: v.readyState, seekableEnd: v.seekable.length ? +v.seekable.end(0).toFixed(3) : -1, dumps: {} };
  const cB = document.createElement("canvas");
  cB.width = vw0; cB.height = vh0;
  const xB = cB.getContext("2d", { willReadFrequently: true });
  xB.drawImage(v, 0, 0, vw0, vh0);
  const sB = stripForSrc(kind);
  out.dumps["B-1to1"] = grab(cB, sB.x, sB.y, sB.w, sB.h);
  for (const s of ${JSON.stringify(SCALES)}) {
    const dw = Math.round(vw0 * s), dh = Math.round(vh0 * s);
    const st = stripFor(kind, dw, dh, s);
    // explicit video high/low + explicit canvas high (đối chứng).
    for (const q of ["high", "low"]) {
      const c = document.createElement("canvas");
      c.width = dw; c.height = dh;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = q;
      x.drawImage(v, 0, 0, dw, dh);
      out.dumps["exp-" + q + "-video-s" + s] = grab(c, st.x, st.y, st.w, st.h);
    }
    const c2 = document.createElement("canvas");
    c2.width = dw; c2.height = dh;
    const x2 = c2.getContext("2d", { willReadFrequently: true });
    x2.imageSmoothingEnabled = true;
    x2.imageSmoothingQuality = "high";
    x2.drawImage(cB, 0, 0, dw, dh);
    out.dumps["exp-high-canvas-s" + s] = grab(c2, st.x, st.y, st.w, st.h);
  }
  // CTM ở s=2,2639 đúng thang L2 (khung 1449x815, offX=0, offY=0).
  {
    const s = 815 / 360, dw = 1449, dh = 815;
    const st = stripFor(kind, dw, dh, s);
    const c = document.createElement("canvas");
    c.width = dw; c.height = dh;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = "#000"; x.fillRect(0, 0, dw, dh);
    x.setTransform(s, 0, 0, s, 0, 0);
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = "high";
    x.drawImage(v, 0, 0, vw0, vh0);
    out.dumps["ctm-high-video-s2.2639"] = grab(c, st.x, st.y, st.w, st.h);
    const c2 = document.createElement("canvas");
    c2.width = dw; c2.height = dh;
    const x2 = c2.getContext("2d", { willReadFrequently: true });
    x2.fillStyle = "#000"; x2.fillRect(0, 0, dw, dh);
    x2.setTransform(s, 0, 0, s, 0, 0);
    x2.imageSmoothingEnabled = true;
    x2.imageSmoothingQuality = "high";
    x2.drawImage(cB, 0, 0, vw0, vh0);
    out.dumps["ctm-high-canvas-s2.2639"] = grab(c2, st.x, st.y, st.w, st.h);
  }
  return out;
}
window.__probe.run = async () => {
  const out = {};
  const kinds = { "sqw4-640": "H", "sqw2-mid": "H", "sqw4-mid": "H", "sqw8-mid": "H", "sqw4x-mid": "V" };
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
    writeFileEpermRetry(path.join(MEDIA, "r85m2-wave-probe.html"), PROBE_HTML);
    const httpPort = (await pickFreePort(HTTP_PORT, HTTP_PORT + 9)) || HTTP_PORT;
    http = spawn("python3", ["-m", "http.server", String(httpPort), "--bind", "127.0.0.1"], { cwd: MEDIA, stdio: "ignore" });
    let up = false;
    for (let i = 0; i < 30 && !up; i++) {
      try { const r = await fetch(`http://127.0.0.1:${httpPort}/r85m2-wave-probe.html`); if (r.ok) up = true; } catch { await sleep(500); }
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
    const DISPLAY = process.env.R85M2_WV_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :190–:199");
    const PROFILE = path.join(M2, "video-operator-chrome-userdata");
    fs.rmSync(PROFILE, { recursive: true, force: true });
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "2560x1440x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(M2, "r85m2-video-operator-chrome.log"), "w");
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/r85m2-wave-probe.html` });
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
