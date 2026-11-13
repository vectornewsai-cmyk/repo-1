#!/usr/bin/env node
/**
 * r84l2-ctm-probe-headed.mjs — Phase 9 đợt 84, luồng L2: probe CTM vs explicit
 * (đóng nợ K2 §7 mục 1 — phần dư delta sqw4).
 *
 * Phát hiện từ B-probe: B (frame video giải mã ở native size) = R (frame
 * render) byte-identical (MAD 0,000) — base VÔ TỘI. Nhưng plain snapshot
 * vẫn lệch Mit(R) MAD 2,44, và mọi kernel trực tiếp (tri/BC/Mitchell,
 * mip-trilinear) đều không khớp plain; dịch nguyên (dx,dy) cũng không
 * cứu (tối thiểu ở (0,0)). Điểm khác còn lại giữa preview thật và probe
 * J2: preview vẽ dưới CTM (renderFrame setTransform(vp.scale) rồi
 * drawImage(src, dx,dy,dw,dh) tọa độ project, quality "high"), còn J2
 * vẽ explicit dw/dh không CTM. Ngoài ra nguồn plain là VIDEO element,
 * còn sharp là effect CANVAS — hai nguồn có thể resample khác nhau.
 *
 * Probe này tái tạo đúng hình học preview (canvas 1351×455 / 1991×815,
 * offX=271, scale 1,2639 / 1,1320) và đo ma trận: nguồn {video, canvas}
 * × chất lượng {high, medium, low} × cách vẽ {CTM, explicit} trên
 * sqw4-640 và sqw4-1280, seek 1,0 s (handler seeked đặt trước khi gán
 * currentTime — sửa race của B-probe). So offline với snap_plain H3
 * (phải khớp ~0,5 nếu tái tạo đúng đường preview) và với Mitchell(B).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r84l2-ctm-probe-headed.mjs
 * Env: R84L2_CP_HTTP_PORT (5682), R84L2_CP_DEBUG_PORT (9762),
 *   R84L2_CP_DISPLAY (tự chọn :182–:189).
 * Ra: hidden_files/round84-l2/r84l2-ctm-probe.json (+ log console).
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
const L2 = path.join(GOAL, "round84-l2");
const L2MEDIA = path.join(L2, "media");
const OUT = path.join(L2, "r84l2-ctm-probe.json");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const HTTP_PORT = Number(process.env.R84L2_CP_HTTP_PORT || 5682);
const DEBUG_PORT = Number(process.env.R84L2_CP_DEBUG_PORT || 9762);

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

const PROBE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r84l2 ctm probe</title></head><body>
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
  // Đặt handler seeked TRƯỚC khi gán currentTime (tránh race bỏ lỡ event).
  const seeked = new Promise((res) => { v.onseeked = res; });
  v.currentTime = 1.0;
  await seeked;
  await new Promise((r) => setTimeout(r, 300));
  if (Math.abs(v.currentTime - 1.0) > 0.01) {
    const s2 = new Promise((res) => { v.onseeked = res; });
    v.currentTime = 1.0;
    await s2;
    await new Promise((r) => setTimeout(r, 300));
  }
  return v;
}
async function dumpOne(file, projW, projH, cw, ch, offX, offY) {
  const v = await loadVideo(file);
  const vw0 = v.videoWidth, vh0 = v.videoHeight;
  const out = { file, videoW: vw0, videoH: vh0, currentTime: +v.currentTime.toFixed(3), duration: v.duration, readyState: v.readyState, seekableEnd: v.seekable.length ? +v.seekable.end(0).toFixed(3) : -1, ctm: {}, explicit: {} };
  // Canvas nguồn B native (drawImage video 1:1).
  const cB = document.createElement("canvas");
  cB.width = vw0; cB.height = vh0;
  const xB = cB.getContext("2d", { willReadFrequently: true });
  xB.drawImage(v, 0, 0, vw0, vh0);
  const scale = (ch - 2 * offY) / projH; // đúng vp.scale của editor (chiều cao thắng)
  const rw = Math.round(projW * scale), rh = Math.round(projH * scale);
  out.scale = scale; out.rect = { x: offX, y: offY, w: rw, h: rh };
  out.native = grab(cB, 0, 0, vw0, vh0);
  for (const q of ["high", "medium", "low"]) {
    // CTM: setTransform(scale) rồi drawImage(src, 0,0,projW,projH) — đúng renderFrame.
    for (const [srcKind, src] of [["video", v], ["canvas", cB]]) {
      const c = document.createElement("canvas");
      c.width = cw; c.height = ch;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.fillStyle = "#000"; x.fillRect(0, 0, cw, ch);
      x.setTransform(scale, 0, 0, scale, offX, offY);
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = q;
      x.drawImage(src, 0, 0, projW, projH);
      out.ctm[q + "-" + srcKind] = grab(c, offX, offY, rw, rh);
    }
    // Explicit dw/dh kiểu J2 (không CTM): drawImage(src, 0,0,rw,rh).
    for (const [srcKind, src] of [["video", v], ["canvas", cB]]) {
      const c = document.createElement("canvas");
      c.width = rw; c.height = rh;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = q;
      x.drawImage(src, 0, 0, rw, rh);
      out.explicit[q + "-" + srcKind] = grab(c, 0, 0, rw, rh);
    }
  }
  // CTM với offX PHÂN SỐ đúng của editor: offX = (cw - W*scale)/2 không làm
  // tròn (cw suy từ rect: 1350 -> 270,56 / 1351 -> 271,06; A2 tương tự).
  out.ctmFx = {};
  for (const fx of [270.5556, 271.0556]) {
    for (const [srcKind, src] of [["video", v], ["canvas", cB]]) {
      const c = document.createElement("canvas");
      c.width = cw; c.height = ch;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.fillStyle = "#000"; x.fillRect(0, 0, cw, ch);
      x.setTransform(scale, 0, 0, scale, fx, offY);
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = "high";
      x.drawImage(src, 0, 0, projW, projH);
      out.ctmFx["fx" + fx.toFixed(2) + "-" + srcKind] = grab(c, offX, offY, rw, rh);
    }
  }
  return out;
}
window.__probe.run = async () => {
  const out = {};
  out.sqw640 = await dumpOne("sqw4-640.mp4", 640, 360, 1351, 455, 271, 0);
  out.sqw1280 = await dumpOne("sqw4-1280.mp4", 1280, 720, 1991, 815, 271, 0);
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
    for (const f of ["sqw4-640.mp4", "sqw4-1280.mp4"]) if (!fs.existsSync(path.join(L2MEDIA, f))) throw new Error(`thiếu media ${f}`);
    writeFileEpermRetry(path.join(L2MEDIA, "r84l2-ctm-probe.html"), PROBE_HTML);
    const httpPort = (await pickFreePort(HTTP_PORT, HTTP_PORT + 9)) || HTTP_PORT;
    http = spawn("python3", ["-m", "http.server", String(httpPort), "--bind", "127.0.0.1"], { cwd: L2MEDIA, stdio: "ignore" });
    let up = false;
    for (let i = 0; i < 30 && !up; i++) {
      try { const r = await fetch(`http://127.0.0.1:${httpPort}/r84l2-ctm-probe.html`); if (r.ok) up = true; } catch { await sleep(500); }
    }
    if (!up) throw new Error(`http server không lên :${httpPort}`);
    log(`http server :${httpPort} (phục vụ ${L2MEDIA})`);
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 182; n <= 189; n++) {
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
    const DISPLAY = process.env.R84L2_CP_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :182–:189");
    const PROFILE = path.join(L2, "ctm-probe-chrome-userdata");
    fs.rmSync(PROFILE, { recursive: true, force: true });
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "2560x1440x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(L2, "r84l2-ctm-probe-chrome.log"), "w");
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/r84l2-ctm-probe.html` });
    await cdp.evalJs(`new Promise((r) => { const t = setInterval(() => { if (window.__probe && window.__probe.run) { clearInterval(t); r(true); } }, 200); })`);
    log("trang probe đã load");
    const out = await cdp.evalJs(`window.__probe.run()`);
    log(`sqw640: video ${out.sqw640.videoW}x${out.sqw640.videoH} ct=${out.sqw640.currentTime} scale=${out.sqw640.scale} rect=${JSON.stringify(out.sqw640.rect)}; sqw1280: video ${out.sqw1280.videoW}x${out.sqw1280.videoH} ct=${out.sqw1280.currentTime} scale=${out.sqw1280.scale} rect=${JSON.stringify(out.sqw1280.rect)}`);
    if (cdp.exceptions.length) log(`CẢNH BÁO page exceptions: ${cdp.exceptions.slice(0, 3).join(" || ")}`);
    writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), ...out }, null, 2));
    log(`Đã ghi ${OUT}`);
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
