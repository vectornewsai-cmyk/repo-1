#!/usr/bin/env node
/**
 * r84l2-base-probe-headed.mjs — Phase 9 đợt 84, luồng L2: đo TRỰC TIẾP base
 * B của Chrome (đóng nợ K2 §7 mục 1 — phần dư delta sqw4).
 *
 * Câu hỏi: p_Mit = snap_plain − Mit(R_plain) (MAD 2,44, không màu, mean≈0,
 * khóa theo cạnh) là gì? Phân rã phần dư đã cho: r ≈ −0,85·p_Mit (hồi quy,
 * không tỉ lệ với amount) + clip (sharp10) + phần chưa giải thích
 * ~1,3–1,5 MAD. Linear-sharpen không thể làm a_sharp < p_Mit, nên cần
 * biết B thật: B = frame video giải mã bởi Chrome ở native size.
 *
 * Probe tối giản (không qua editor): trang HTML load <video> sqw4-640.mp4
 * (640×360 native) và sqw4-1280.mp4 (1280×720), seek 1,0 s, rồi:
 *   (a) drawImage(video) → canvas native-size → getImageData (B gốc);
 *   (b) drawImage(canvas-a) → canvas viewport 1449×815 (640) / 1449×815
 *       (1280, s=1,132) — mô phỏng đúng bước upscale canvas→canvas của
 *       preview (đối chiếu offline với Mitchell trên cùng B).
 * So offline với fullrgb-plain.raw của H3 (bt601 cho 640, bt709 cho 1280):
 *   b = B − R (MAD/le8/profile) và U(B) vs Mit(B).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r84l2-base-probe-headed.mjs
 * Env: R84L2_BP_HTTP_PORT (mặc định 5680), R84L2_BP_DEBUG_PORT (9760),
 *   R84L2_BP_DISPLAY (mặc định tự chọn :181–:189).
 * Ra: hidden_files/round84-l2/r84l2-base-probe.json (+ log console).
 * KHÔNG push/tag/binary/workflow. Không sửa production, không sửa repo
 * ngoài 1 script đo này (media copy vào hidden_files, không stage).
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
const OUT = path.join(L2, "r84l2-base-probe.json");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const HTTP_PORT = Number(process.env.R84L2_BP_HTTP_PORT || 5680);
const DEBUG_PORT = Number(process.env.R84L2_BP_DEBUG_PORT || 9760);

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

const PROBE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r84l2 base probe</title></head><body>
<video id="v" muted playsinline preload="auto" style="display:none"></video>
<script>
window.__probe = {};
async function dumpOne(file, vw, vh, upW, upH) {
  const v = document.getElementById("v");
  v.src = file;
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("load lỗi " + file)); });
  v.currentTime = 1.0;
  await new Promise((res) => { v.onseeked = res; });
  await new Promise((r) => setTimeout(r, 300));
  const vw0 = v.videoWidth, vh0 = v.videoHeight;
  const c = document.createElement("canvas");
  c.width = vw0; c.height = vh0;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(v, 0, 0, vw0, vh0);
  const d = x.getImageData(0, 0, vw0, vh0).data;
  const rgb = new Uint8Array(vw0 * vh0 * 3);
  for (let i = 0; i < vw0 * vh0; i++) { rgb[i*3] = d[i*4]; rgb[i*3+1] = d[i*4+1]; rgb[i*3+2] = d[i*4+2]; }
  let b64 = "";
  const CH = 0x8000;
  for (let i = 0; i < rgb.length; i += CH) b64 += String.fromCharCode.apply(null, rgb.subarray(i, i + CH));
  // (b) upscale canvas->canvas như preview (drawImage 2D, smoothing mặc định).
  const c2 = document.createElement("canvas");
  c2.width = upW; c2.height = upH;
  const x2 = c2.getContext("2d", { willReadFrequently: true });
  x2.drawImage(c, 0, 0, upW, upH);
  const d2 = x2.getImageData(0, 0, upW, upH).data;
  const rgb2 = new Uint8Array(upW * upH * 3);
  for (let i = 0; i < upW * upH; i++) { rgb2[i*3] = d2[i*4]; rgb2[i*3+1] = d2[i*4+1]; rgb2[i*3+2] = d2[i*4+2]; }
  let b64b = "";
  for (let i = 0; i < rgb2.length; i += CH) b64b += String.fromCharCode.apply(null, rgb2.subarray(i, i + CH));
  return { file, videoW: vw0, videoH: vh0, currentTime: +v.currentTime.toFixed(3),
    native: { w: vw0, h: vh0, rgbB64: btoa(b64) },
    upscaled: { w: upW, h: upH, rgbB64: btoa(b64b) } };
}
window.__probe.run = async () => {
  const out = {};
  out.sqw640 = await dumpOne("sqw4-640.mp4", 640, 360, 1449, 815);
  out.sqw1280 = await dumpOne("sqw4-1280.mp4", 1280, 720, 1449, 815);
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
    writeFileEpermRetry(path.join(L2MEDIA, "r84l2-base-probe.html"), PROBE_HTML);
    const httpPort = (await pickFreePort(HTTP_PORT, HTTP_PORT + 9)) || HTTP_PORT;
    http = spawn("python3", ["-m", "http.server", String(httpPort), "--bind", "127.0.0.1"], { cwd: L2MEDIA, stdio: "ignore" });
    let up = false;
    for (let i = 0; i < 30 && !up; i++) {
      try { const r = await fetch(`http://127.0.0.1:${httpPort}/r84l2-base-probe.html`); if (r.ok) up = true; } catch { await sleep(500); }
    }
    if (!up) throw new Error(`http server không lên :${httpPort}`);
    log(`http server :${httpPort} (phục vụ ${L2MEDIA})`);
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 181; n <= 189; n++) {
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
    const DISPLAY = process.env.R84L2_BP_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :181–:189");
    const PROFILE = path.join(L2, "base-probe-chrome-userdata");
    fs.rmSync(PROFILE, { recursive: true, force: true });
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "2560x1440x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(L2, "r84l2-base-probe-chrome.log"), "w");
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/r84l2-base-probe.html` });
    await cdp.evalJs(`new Promise((r) => { const t = setInterval(() => { if (window.__probe && window.__probe.run) { clearInterval(t); r(true); } }, 200); })`);
    log("trang probe đã load");
    const out = await cdp.evalJs(`window.__probe.run()`);
    log(`sqw640: video ${out.sqw640.videoW}x${out.sqw640.videoH} ct=${out.sqw640.currentTime}; sqw1280: video ${out.sqw1280.videoW}x${out.sqw1280.videoH} ct=${out.sqw1280.currentTime}`);
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
