#!/usr/bin/env node
/**
 * test_v17_headed_fps.mjs — Phase 9 đợt 17, luồng N6: đo FPS canvas ghost
 * trên trình duyệt HEADED thật (qua Xvfb) + đối chứng headless cùng máy.
 *
 * PHẠM VI — ĐỌC KỸ TRƯỚC KHI TRÍCH SỐ:
 * - "Trình duyệt thật" ở đây = Chromium thật (/opt/meta-chromium/chrome)
 *   chạy HEADED trong Xvfb (màn hình ảo 1920×1080), có cửa sổ + compositor
 *   headed, khác headless=new của đợt 16 H4. VM KHÔNG có GPU thật nên
 *   Chrome vẫn raster bằng SwiftShader phần mềm (renderer string được in
 *   ra để đối chiếu, không đoán) — số này KHÔNG phải FPS trên GPU thật
 *   của user, KHÔNG phải FPS của editor thật (không có UI/timeline).
 * - Nguồn video là file render thật trong repo
 *   (mcp-server/renders/agent-demo.mp4, 720p) — đã kiểm tra bằng mắt:
 *   đó là smptebars + chữ + hình tổng hợp, KHÔNG phải footage máy quay.
 *   Nó chỉ đóng vai "video decode thật" (thay pattern ImageData của H4),
 *   không đóng vai footage thật.
 * - Video: Chromium trên VM này KHÔNG decode được H.264 mp4 (build
 *   không có codec proprietary — mp4 cho "no supported source"), nên
 *   script tự transcode 5 giây đầu của agent-demo.mp4 sang WebM VP8
 *   trong /tmp (KHÔNG vào repo) và đo decode trên bản WebM đó; codec
 *   nào phát được in ra trong kết quả (video.codec). Nếu cả 2 đều
 *   không phát được thì vòng video báo videoError, vòng pattern vẫn
 *   có số. Headed đã thử thủ công 2 binary × 2 chế độ GPU: tiến
 *   trình sống nhưng KHÔNG BAO GIỜ mở cổng CDP (xem LIMITS) — script
 *   in BLOCKER-HEADED và vẫn chạy đối chứng headless, exit 0.
 *   canvas chụp từ video ở các thời điểm khác (tĩnh trong vòng đo).
 *   Chi phí drawImage mỗi frame là thứ được đo; snapshot tĩnh hay cửa sổ
 *   trượt không đổi chi phí vẽ mỗi frame. Vòng capture snapshot KHÔNG
 *   tính giờ. Vòng video f1 vẽ video live nên CÓ gồm decode + present.
 * - Số dùng được duy nhất: throughput vòng rAF (frame rAF kích được
 *   trong 3 giây), như H4 — thời gian gọi drawImage ≈ 0ms do Chromium
 *   hoãn raster tới lúc present nên KHÔNG trích ms/draw.
 *
 * Cách chạy (từ gốc repo; script tự bật/tắt Xvfb + Chrome + HTTP server):
 *   node server/render/src/test_v17_headed_fps.mjs
 * Exit 0 khi có ít nhất headless control (kể cả khi headed thất bại —
 * khi đó in dòng BLOCKER-HEADED rõ ràng); exit 2 chỉ khi cả 2 đều hỏng.
 * KHÔNG sửa code sản phẩm, KHÔNG tải gì về repo, KHÔNG push.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
// LƯU Ý binary: /opt/meta-chromium/chrome 152 CHẶN navigate tới localhost
// (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS, đã thử cả 127.0.0.1 lẫn
// hostname localhost, cả createTarget lẫn initial-page target) nên vòng
// video cần HTTP server KHÔNG chạy được trên binary đó; Playwright
// chromium 156 (đúng binary C3 dùng) navigate localhost bình thường.
const HTTP_PORT = Number(process.env.N6_HTTP_PORT || 18731);
const HEADED_PORT = Number(process.env.N6_HEADED_PORT || 9231);
const HEADLESS_PORT = Number(process.env.N6_HEADLESS_PORT || 9232);
const DISPLAY = process.env.N6_XVFB_DISPLAY || ":99";
const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const VIDEO_FILE = path.join(ROOT, "mcp-server", "renders", "agent-demo.mp4");
const VIDEO_WEBM = path.join(os.tmpdir(), "n6-agent-demo.webm");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

function waitForVersion(port, tries = 60) {
  return (async () => {
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (r.ok) return await r.json();
      } catch { /* chưa lên */ }
      await sleep(500);
    }
    throw new Error(`không lấy được /json/version port ${port} sau ${tries} lần thử`);
  })();
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve);
      this.ws.addEventListener("error", reject);
    });
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) {
        this.sessionId = msg.params.sessionId;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    }
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch { /* bỏ qua */ } }
}

const BENCH_JS = `
(async () => {
  function planAlphas(weights) {
    const out = [1];
    let s = weights[0];
    for (let i = 1; i < weights.length; i++) { s += weights[i]; out.push(weights[i] / s); }
    return out;
  }
  function makeSource(w, h, seed) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    let x = seed >>> 0;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      d[i] = x & 255; d[i+1] = (x >>> 8) & 255; d[i+2] = (x >>> 16) & 255; d[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  async function benchRafPattern(W, H, frames, weights, msBudget) {
    const srcs = [];
    for (let i = 0; i < frames; i++) srcs.push(makeSource(W, H, 1000 + i * 77));
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    document.body.appendChild(layer);
    const ctx = layer.getContext('2d');
    const alphas = planAlphas(weights);
    let count = 0;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const step = () => {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < frames; i++) { ctx.globalAlpha = alphas[i]; ctx.drawImage(srcs[i], 0, 0); }
        ctx.globalAlpha = 1;
        count++;
        if (performance.now() - t0 < msBudget) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    const dur = performance.now() - t0;
    layer.remove();
    return { frames, rafFrames: count, rafMs: +dur.toFixed(1), rafFps: +(count / (dur / 1000)).toFixed(2) };
  }
  async function benchRafEmpty(msBudget) {
    let count = 0;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const step = () => {
        count++;
        if (performance.now() - t0 < msBudget) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    const dur = performance.now() - t0;
    return { frames: 0, rafFrames: count, rafMs: +dur.toFixed(1), rafFps: +(count / (dur / 1000)).toFixed(2) };
  }
  function gpuRenderer() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (!ext) return 'renderer-masked';
      return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'unknown';
    } catch (e) { return 'error:' + String(e).slice(0, 80); }
  }
  async function setupVideo() {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    // Thử WebM trước (Chromium VM decode được VP8), fallback mp4.
    v.src = '/video.webm';
    document.body.appendChild(v);
    try { await v.play(); } catch (e) {
      v.src = '/video.mp4';
      await v.play().catch((e2) => { throw new Error('video.play thất bại (webm+mp4): ' + e2.message); });
    }
    const t0 = performance.now();
    while ((v.readyState < 3 || v.paused) && performance.now() - t0 < 10000) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (v.paused) throw new Error('video vẫn paused sau 10s (readyState=' + v.readyState + ')');
    return v;
  }
  async function captureSnapshots(v, n) {
    const snaps = [];
    for (let i = 0; i < n; i++) {
      v.currentTime = (i + 0.5) * (v.duration / Math.max(n, 1)) / 2;
      await new Promise((r) => setTimeout(r, 250));
      const c = document.createElement('canvas');
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      snaps.push(c);
    }
    await v.play().catch(() => {});
    return snaps;
  }
  async function benchRafVideo(v, snaps, frames, weights, msBudget) {
    const W = v.videoWidth, H = v.videoHeight;
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    document.body.appendChild(layer);
    const ctx = layer.getContext('2d');
    const alphas = planAlphas(weights);
    const q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
    let count = 0;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const step = () => {
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = 1; ctx.drawImage(v, 0, 0);
        for (let i = 1; i < frames; i++) { ctx.globalAlpha = alphas[i]; ctx.drawImage(snaps[(i - 1) % snaps.length], 0, 0); }
        ctx.globalAlpha = 1;
        count++;
        if (performance.now() - t0 < msBudget) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    const dur = performance.now() - t0;
    const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
    layer.remove();
    return { frames, rafFrames: count, rafMs: +dur.toFixed(1),
      rafFps: +(count / (dur / 1000)).toFixed(2),
      droppedDelta: q0 && q1 ? (q1.droppedVideoFrames - q0.droppedVideoFrames) : null,
      totalDelta: q0 && q1 ? (q1.totalVideoFrames - q0.totalVideoFrames) : null };
  }
  const uniform = (n) => Array.from({ length: n }, () => 1 / n);
  const out = { ua: navigator.userAgent, gpu: gpuRenderer(), video: null };
  out.rafEmpty = await benchRafEmpty(3000);
  out.pattern1080f1 = await benchRafPattern(1920, 1080, 1, [1], 3000);
  out.pattern1080f3 = await benchRafPattern(1920, 1080, 3, uniform(3), 3000);
  out.pattern1080f8 = await benchRafPattern(1920, 1080, 8, uniform(8), 3000);
  try {
    const v = await setupVideo();
    out.video = { w: v.videoWidth, h: v.videoHeight, duration: +v.duration.toFixed(2),
      codec: v.currentSrc.includes('webm') ? 'vp8-webm' : 'h264-mp4' };
    const snaps = await captureSnapshots(v, 8);
    out.video720f1 = await benchRafVideo(v, snaps, 1, [1], 3000);
    out.video720f3 = await benchRafVideo(v, snaps, 3, uniform(3), 3000);
    out.video720f8 = await benchRafVideo(v, snaps, 8, uniform(8), 3000);
  } catch (e) {
    out.videoError = String(e && e.message ? e.message : e).slice(0, 300);
  }
  return out;
})()
`;

function startHttp() {
  return new Promise((resolve, reject) => {
    const serveFile = (req, res, file, type) => {
      const st = fs.statSync(file);
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d+)-(\d*)/.exec(range);
        if (m) {
          const start = Number(m[1]);
          const end = m[2] ? Number(m[2]) : st.size - 1;
          res.writeHead(206, { "Content-Type": type, "Content-Length": end - start + 1,
            "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes" });
          fs.createReadStream(file, { start, end }).pipe(res);
          return;
        }
      }
      res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes" });
      fs.createReadStream(file).pipe(res);
    };
    const srv = http.createServer((req, res) => {
      if (req.url === "/video.webm" && fs.existsSync(VIDEO_WEBM)) { serveFile(req, res, VIDEO_WEBM, "video/webm"); return; }
      if (req.url === "/video.mp4") { serveFile(req, res, VIDEO_FILE, "video/mp4"); return; }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!doctype html><html><body style='margin:0;background:#000'></body></html>");
    });
    srv.listen(HTTP_PORT, "127.0.0.1", () => resolve(srv));
    srv.on("error", reject);
  });
}

function ensureWebm() {
  if (fs.existsSync(VIDEO_WEBM)) { log(`webm có sẵn: ${VIDEO_WEBM}`); return; }
  log(`transcode 5s đầu agent-demo.mp4 -> VP8 webm tại ${VIDEO_WEBM} (chỉ /tmp, không vào repo)`);
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", VIDEO_FILE, "-t", "5",
    "-c:v", "libvpx", "-b:v", "2M", "-cpu-used", "4", "-an", "-y", VIDEO_WEBM], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`transcode webm thất bại: ${(r.stderr || "").slice(0, 300)}`);
  log(`webm xong: ${fs.statSync(VIDEO_WEBM).size} bytes`);
}

async function runBrowser(label, port, headed, xvfbDisplay) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), `n6-${label}-`));
  const args = [
    "--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required", "--mute-audio",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--window-size=1920,1080", "about:blank",
  ];
  if (!headed) args.push("--headless=new", "--disable-gpu");
  const env = { ...process.env };
  if (headed) env.DISPLAY = xvfbDisplay;
  const chrome = spawn(CHROME, args, { stdio: "ignore", env });
  try {
    const ver = await waitForVersion(port);
    log(`${label} chrome: ${ver.Browser}`);
    // Mẫu C3: bám vào page target sẵn có của browser qua /json/list rồi
    // navigate nó (không tạo target mới) — đã kiểm chứng navigate được
    // localhost trên binary Playwright, trong khi binary meta chặn LNA.
    let pages = null;
    for (let i = 0; i < 60 && !pages; i++) {
      try { const r = await fetch(`http://127.0.0.1:${port}/json/list`); pages = await r.json(); } catch { await sleep(500); }
    }
    const pageTarget = (pages || []).find((p) => p.type === "page");
    if (!pageTarget) throw new Error("không tìm thấy page target trong /json/list");
    const cdp = new Cdp(pageTarget.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: `http://localhost:${HTTP_PORT}/` });
    let href = "";
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      try { href = await cdp.evaluate(`location.href`); } catch { href = ""; }
      if (href.startsWith("http://localhost:")) break;
    }
    log(`${label} page href: ${href}`);
    if (!href.startsWith("http://localhost:")) throw new Error(`navigate localhost thất bại, href=${href}`);
    const result = await cdp.evaluate(BENCH_JS);
    cdp.close();
    for (const [k, v] of Object.entries(result)) log(`${label} ${k}: ${JSON.stringify(v)}`);
    return true;
  } finally {
    try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  }
}

async function main() {
  log(`CHROME=${CHROME} video=${VIDEO_FILE} exists=${fs.existsSync(VIDEO_FILE)}`);
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy Chrome tại ${CHROME}`);
  ensureWebm();
  const srv = await startHttp();
  log(`http server: 127.0.0.1:${HTTP_PORT}`);
  let headedOk = false, headlessOk = false;
  // --- Xvfb + headed ---
  let xvfb = null;
  try {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    const num = DISPLAY.replace(":", "");
    for (let i = 0; i < 40; i++) {
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) break;
      await sleep(250);
    }
    if (!fs.existsSync(`/tmp/.X11-unix/X${num}`)) throw new Error(`Xvfb không tạo socket X${num}`);
    log(`Xvfb lên: DISPLAY=${DISPLAY}`);
    headedOk = await runBrowser("HEADED", HEADED_PORT, true, DISPLAY);
  } catch (e) {
    log(`BLOCKER-HEADED: ${e && e.message ? e.message : e}`);
  } finally {
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
  }
  // --- Đối chứng headless (điều kiện H4) ---
  try {
    headlessOk = await runBrowser("HEADLESS", HEADLESS_PORT, false, null);
  } catch (e) {
    log(`BLOCKER-HEADLESS: ${e && e.message ? e.message : e}`);
  }
  srv.close();
  log(`DONE v17-headed-fps headed=${headedOk} headless=${headlessOk}`);
  if (!headedOk && !headlessOk) process.exit(2);
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
