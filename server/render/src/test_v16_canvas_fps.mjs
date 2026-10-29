#!/usr/bin/env node
/**
 * test_v16_canvas_fps.mjs — Phase 9 đợt 16, luồng H4: đo tốc độ vẽ ghost
 * bằng Canvas 2D THẬT trong Chromium headless (không phải toán Node).
 *
 * PHẠM VI — ĐỌC KỸ TRƯỚC KHI TRÍCH SỐ:
 * - Đây là Chromium headless chạy bằng CDP trên máy đo (không GPU thật,
 *   --disable-gpu → SwiftShader phần mềm), KHÔNG có màn hình, KHÔNG
 *   có compositor hiển thị thật, KHÔNG phải trình duyệt của user.
 * - Số "fps" dưới đây = 1000 / (ms composite trung vị) — tức tốc độ
 *   vẽ tối đa nếu vẽ liên tục, KHÔNG phải fps hiển thị đo qua màn hình.
 *   Ngoài ra script đo thêm vòng rAF 3s (số frame rAF kích được trong
 *   headless) để đối chiếu, nhưng rAF headless không bị vsync màn hình
 *   ràng buộc nên cũng KHÔNG được trích thành "FPS trình duyệt".
 * - Đường vẽ đo: composite ghost đúng plan của preview — vẽ các frame
 *   nguồn bằng drawImage với globalAlpha theo motionBlurBlendPlan
 *   (frame đầu alpha 1, frame i alpha = w_i / Σ_{j≤i} w_j), lên 1 lớp
 *   canvas rồi tính thời gian. Baseline: 1 lần drawImage không ghost.
 * - Nguồn: pattern giả lập bằng ImageData (LCG xác định) — đo CHI PHÍ
 *   VẼ, không đo giải mã video. Frame video thật còn tốn decode trước
 *   khi vẽ nên số này là cận trên cho phần vẽ, không phải FPS preview
 *   tổng thể.
 *
 * Cách chạy (từ gốc repo; script tự bật/tắt Chrome):
 *   CHROME_BIN=/opt/meta-chromium/chrome node server/render/src/test_v16_canvas_fps.mjs
 *   (không đặt CHROME_BIN thì mặc định /opt/meta-chromium/chrome;
 *   Chrome khác vẫn chạy được nếu hỗ trợ --headless=new + CDP.)
 * Exit 0 khi đo xong; 2 khi không bật được Chrome / lỗi CDP (khi đó
 * KHÔNG có số canvas — ghi rõ là chưa đo được, không thay bằng số Node).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_BIN || "/opt/meta-chromium/chrome";
const PORT = Number(process.env.CDP_PORT || 9223);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "h4-chrome-"));

function log(...a) { console.log(...a); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForVersion(tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return await r.json();
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  throw new Error(`không lấy được /json/version sau ${tries} lần thử (port ${PORT})`);
}

/** Client CDP tối thiểu qua WebSocket toàn cục của Node 22. */
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
  // Plan blend đúng công thức motionBlurBlendPlan (previewEngine.ts):
  // alpha[0] = 1; alpha[i] = w_i / sum(w_0..w_i).
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
  function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }
  function benchCase(W, H, frames, weights) {
    const srcs = [];
    for (let i = 0; i < frames; i++) srcs.push(makeSource(W, H, 1000 + i * 77));
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    const ctx = layer.getContext('2d');
    const alphas = planAlphas(weights);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < frames; i++) { ctx.globalAlpha = alphas[i]; ctx.drawImage(srcs[i], 0, 0); }
      ctx.globalAlpha = 1;
    };
    for (let i = 0; i < 3; i++) draw(); // warmup
    const times = [];
    for (let i = 0; i < 15; i++) { const t0 = performance.now(); draw(); times.push(performance.now() - t0); }
    return { W, H, frames, w: weights.map(v => +v.toFixed(4)).join(','), medianMs: +median(times).toFixed(3), times: times.map(v => +v.toFixed(2)), fpsEquiv: +(1000 / median(times)).toFixed(2) };
  }
  function benchBaseline(W, H) {
    const src = makeSource(W, H, 42);
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    const ctx = layer.getContext('2d');
    const draw = () => { ctx.clearRect(0, 0, W, H); ctx.drawImage(src, 0, 0); };
    for (let i = 0; i < 3; i++) draw();
    const times = [];
    for (let i = 0; i < 15; i++) { const t0 = performance.now(); draw(); times.push(performance.now() - t0); }
    return { W, H, frames: 1, w: 'baseline', medianMs: +median(times).toFixed(3), times: times.map(v => +v.toFixed(2)), fpsEquiv: +(1000 / median(times)).toFixed(2) };
  }
  async function benchRaf(W, H, frames, weights, msBudget) {
    const srcs = [];
    for (let i = 0; i < frames; i++) srcs.push(makeSource(W, H, 1000 + i * 77));
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    // Gắn vào DOM (như canvas preview thật) thay vì để canvas rời:
    // canvas rời có thể không bao giờ được raster/present, còn canvas
    // trong trang thì compositor headless vẫn chạy qua nó.
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
    return { W, H, frames, rafFrames: count, rafMs: +dur.toFixed(1), rafFps: +(count / (dur / 1000)).toFixed(2) };
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
    return { W: 0, H: 0, frames: 0, rafFrames: count, rafMs: +dur.toFixed(1), rafFps: +(count / (dur / 1000)).toFixed(2) };
  }
  const uniform = (n) => Array.from({ length: n }, () => 1 / n);
  const ramp = (n) => { const s = n * (n + 1) / 2; return Array.from({ length: n }, (_, i) => (i + 1) / s); };
  const out = {
    ua: navigator.userAgent,
    baseline720: benchBaseline(1280, 720),
    baseline1080: benchBaseline(1920, 1080),
    ghost720f3: benchCase(1280, 720, 3, uniform(3)),
    ghost720f8: benchCase(1280, 720, 8, uniform(8)),
    ghost1080f3: benchCase(1920, 1080, 3, uniform(3)),
    ghost1080f8: benchCase(1920, 1080, 8, uniform(8)),
    ghost1080f3ramp: benchCase(1920, 1080, 3, ramp(3)),
    rafEmpty: await benchRafEmpty(3000),
    raf1080f1: await benchRaf(1920, 1080, 1, [1], 3000),
    raf1080f8: await benchRaf(1920, 1080, 8, uniform(8), 3000),
    raf1080f8b: await benchRaf(1920, 1080, 8, uniform(8), 3000),
    raf1080f3: await benchRaf(1920, 1080, 3, uniform(3), 3000),
    raf1080f3b: await benchRaf(1920, 1080, 3, uniform(3), 3000),
    raf720f1: await benchRaf(1280, 720, 1, [1], 3000),
    raf720f3: await benchRaf(1280, 720, 3, uniform(3), 3000),
    raf720f8: await benchRaf(1280, 720, 8, uniform(8), 3000),
  };
  return out;
})()
`;

async function main() {
  log(`CHROME=${CHROME} port=${PORT} profile=${PROFILE}`);
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy Chrome tại ${CHROME}`);
  const chrome = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--hide-scrollbars", `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`, "--window-size=1920,1080", "about:blank",
  ], { stdio: "ignore" });
  try {
    const ver = await waitForVersion();
    log(`chrome version: ${ver.Browser} | UA-kem: ${ver["User-Agent"]}`);
    const cdp = new Cdp(ver.webSocketDebuggerUrl);
    await cdp.ready;
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    const result = await cdp.evaluate(BENCH_JS);
    cdp.close();
    for (const [k, v] of Object.entries(result)) {
      if (k === "ua") { log(`UA: ${v}`); continue; }
      log(`CANVAS ${k}: ${JSON.stringify(v)}`);
    }
    log("\nDONE v16-canvas-fps");
  } finally {
    try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  }
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
