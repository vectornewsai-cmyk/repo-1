#!/usr/bin/env node
/**
 * measure-headed-fps-pipe.mjs — Phase 9 đợt 18, luồng FPS headed (pipe).
 *
 * VẤN ĐỀ GỐC (đợt 17, docs/PHASE9_ROUND17_LIMITS.md): headed Chrome không
 * bao giờ mở cổng CDP TCP trên VM này (đã thử Xvfb + meta-chromium 152 +
 * Playwright 156, tiến trình sống nhưng /json/version không bao giờ lên),
 * nên FPS canvas trình duyệt thật vẫn chưa đo được; số headless của đợt
 * 16 (H4) KHÔNG được trích thành FPS trình duyệt thật.
 *
 * HƯỚNG MỚI Ở ĐÂY: --remote-debugging-pipe. CDP đi qua file descriptor
 * 3 (ghi lệnh, JSON + byte NUL) / 4 (đọc trả lời, tách bằng byte NUL),
 * không qua TCP nên không chạm blocker cổng CDP của đợt 17. Đã kiểm
 * chứng bằng probe /tmp trước khi viết script này: Chrome 156 headed
 * dưới Xvfb trả lời Target.getTargets qua pipe.
 *
 * PHẠM VI — ĐỌC KỸ TRƯỚC KHI TRÍCH SỐ:
 * - "Headed thật" ở đây = Chromium thật chạy HEADED trong Xvfb
 *   (1920x1080x24, có cửa sổ + compositor headed), điều khiển qua pipe.
 *   VM KHÔNG có GPU thật nên Chrome vẫn raster bằng SwiftShader phần
 *   mềm (chuỗi renderer in ra để đối chiếu, không đoán) — số này KHÔNG
 *   phải FPS trên GPU thật của user.
 * - Xvfb KHÔNG có vsync phần cứng thật: rAF headed dưới Xvfb có thể
 *   chạy không bị khóa 60 Hz như màn hình thật, hoặc khóa theo nhịp
 *   ảo của Xvfb. Vì vậy script ghi thêm phân phối khoảng cách rAF
 *   (median dt) để đọc được nhịp khóa, và KHÔNG claim "FPS hiển thị
 *   trên màn hình thật" — số đo là throughput rAF của canvas headed
 *   trong điều kiện VM này.
 * - Đường vẽ đo: composite ghost đúng plan của preview (frame đầu
 *   alpha 1, frame i alpha = w_i / Σ_{j≤i} w_j), nguồn là pattern
 *   ImageData LCG như H4/v17 — đo CHI PHÍ VẼ, không đo decode video,
 *   không phải FPS editor thật (không UI/timeline, không footage).
 * - Trang đo chính là trang canvas tối giản tự phục vụ qua HTTP nội
 *   bộ. Script CŨNG thử vite preview của build thật (apps/web/dist):
 *   nếu preview lên và trang tải được, cùng bench được tiêm vào trang
 *   đó (canvas gắn vào body) và báo riêng; nếu preview không lên thì
 *   chỉ có số trang tối giản, ghi rõ — KHÔNG mạo nhận đó là FPS editor.
 * - Binary mặc định là Playwright Chromium 156 (binary đợt 17 xác nhận
 *   navigate localhost bình thường); meta-chromium 152 là fallback và
 *   có thể lại chặn localhost (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS
 *   như đợt 17) — khi đó vòng đó báo BLOCKER rõ ràng, không bịa số.
 *
 * Cách chạy (từ gốc repo; script tự bật/tắt Xvfb + Chrome + HTTP server
 * + vite preview, không ghi gì vào repo ngoài stdout):
 *   node apps/web/scripts/measure-headed-fps-pipe.mjs
 * Exit 0 khi có ít nhất một vòng headed đo được; exit 2 khi cả 2 binary
 * đều không đo được qua pipe (khi đó KHÔNG có số FPS — ghi rõ blocker).
 * KHÔNG sửa code sản phẩm, KHÔNG tải gì về repo, KHÔNG push.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", ".."); // scripts/ -> web/ -> apps/ -> repo
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.PIPE_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const HTTP_PORT = Number(process.env.PIPE_HTTP_PORT || 18741);
const PREVIEW_PORT = Number(process.env.PIPE_PREVIEW_PORT || 4173);
const DISPLAY = process.env.PIPE_XVFB_DISPLAY || ":99";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

/** Client CDP qua pipe: ghi JSON+\0 vào fd 3, đọc trả lời tách \0 từ fd 4. */
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg;
        try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) {
          this.sessionId = msg.params.sessionId;
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
    proc.stdio[4].on("error", () => { /* đóng pipe khi kill */ });
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout ${method} sau ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId, 120000);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    }
    return r.result.value;
  }
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
  function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }
  async function benchRaf(W, H, frames, weights, msBudget) {
    const srcs = [];
    for (let i = 0; i < frames; i++) srcs.push(makeSource(W, H, 1000 + i * 77));
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    layer.style.cssText = 'position:fixed;left:0;top:0;';
    document.body.appendChild(layer);
    const ctx = layer.getContext('2d');
    const alphas = planAlphas(weights);
    let count = 0;
    const dts = [];
    let prev = 0;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const step = (t) => {
        if (prev) dts.push(t - prev);
        prev = t;
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
    return { W, H, frames, rafFrames: count, rafMs: +dur.toFixed(1),
      rafFps: +(count / (dur / 1000)).toFixed(2),
      rafDtMedianMs: dts.length ? +median(dts).toFixed(2) : null,
      rafDtP90Ms: dts.length ? +[...dts].sort((a, b) => a - b)[Math.floor(dts.length * 0.9)].toFixed(2) : null };
  }
  async function benchRafEmpty(msBudget) {
    let count = 0;
    const dts = [];
    let prev = 0;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const step = (t) => {
        if (prev) dts.push(t - prev);
        prev = t;
        count++;
        if (performance.now() - t0 < msBudget) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    const dur = performance.now() - t0;
    return { frames: 0, rafFrames: count, rafMs: +dur.toFixed(1),
      rafFps: +(count / (dur / 1000)).toFixed(2),
      rafDtMedianMs: dts.length ? +median(dts).toFixed(2) : null };
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
  const uniform = (n) => Array.from({ length: n }, () => 1 / n);
  const out = { ua: navigator.userAgent, gpu: gpuRenderer(), href: location.href };
  out.rafEmpty = await benchRafEmpty(3000);
  out.ghost720f1 = await benchRaf(1280, 720, 1, [1], 3000);
  out.ghost720f3 = await benchRaf(1280, 720, 3, uniform(3), 3000);
  out.ghost720f8 = await benchRaf(1280, 720, 8, uniform(8), 3000);
  out.ghost1080f1 = await benchRaf(1920, 1080, 1, [1], 3000);
  out.ghost1080f3 = await benchRaf(1920, 1080, 3, uniform(3), 3000);
  out.ghost1080f8 = await benchRaf(1920, 1080, 8, uniform(8), 3000);
  out.ghost1080f8b = await benchRaf(1920, 1080, 8, uniform(8), 3000);
  return out;
})()
`;

function startHttp() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!doctype html><html><body style='margin:0;background:#000'></body></html>");
    });
    srv.listen(HTTP_PORT, "127.0.0.1", () => resolve(srv));
    srv.on("error", reject);
  });
}

function startVitePreview() {
  return new Promise((resolve) => {
    if (!fs.existsSync(path.join(WEB_DIR, "dist", "index.html"))) {
      log("vite preview: không có apps/web/dist/index.html, bỏ qua vòng preview");
      resolve(null);
      return;
    }
    // Chạy thẳng node -> vite bin (không qua npx) để proc.kill() giết đúng
    // tiến trình vite; kill npx wrapper sẽ để vite con sống sót (đã gặp).
    // vite được hoist lên node_modules gốc repo (không nằm dưới apps/web).
    const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
    const proc = fs.existsSync(viteBin)
      ? spawn(process.execPath, [viteBin, "preview", "--port", String(PREVIEW_PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" })
      : spawn("npx", ["vite", "preview", "--port", String(PREVIEW_PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" });
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; resolve(proc); } // vẫn trả proc, vòng navigate sẽ quyết định
    }, 15000);
    (async () => {
      for (let i = 0; i < 30 && !done; i++) {
        await sleep(500);
        try {
          const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`);
          if (r.ok) { done = true; clearTimeout(timer); resolve(proc); return; }
        } catch { /* chưa lên */ }
      }
    })();
    proc.on("exit", () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

async function runHeaded(label, chromeBin, xvfbDisplay, targets) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "fps-pipe-"));
  const chrome = spawn(chromeBin, [
    "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
    "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
    "--remote-debugging-pipe", `--user-data-dir=${profile}`,
    "--window-size=1920,1080", "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: xvfbDisplay } });
  chrome.stderr.on("data", () => { /* dbus/gpu noise của VM, bỏ qua */ });
  try {
    const cdp = new PipeCdp(chrome);
    // Chờ pipe trả lời: Target.getTargets phải về trong 30s.
    const targets0 = await cdp.send("Target.getTargets", {}, undefined, 30000);
    log(`${label} pipe OK: ${(targets0.targetInfos || []).length} target ban đầu`);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    const results = {};
    for (const t of targets) {
      try {
        await cdp.send("Page.navigate", { url: t.url }, cdp.sessionId);
        let href = "";
        for (let i = 0; i < 20; i++) {
          await sleep(1000);
          try { href = await cdp.evaluate("location.href"); } catch { href = ""; }
          if (href.startsWith(t.expectPrefix)) break;
        }
        log(`${label} ${t.name} href: ${href}`);
        if (!href.startsWith(t.expectPrefix)) throw new Error(`navigate thất bại, href=${href}`);
        // Đợi trang preview React render xong (chỉ vòng preview; trang tối giản không cần).
        if (t.waitFor) {
          for (let i = 0; i < 20; i++) {
            try { if (await cdp.evaluate(t.waitFor)) break; } catch { /* chưa */ }
            await sleep(1000);
          }
        }
        const result = await cdp.evaluate(BENCH_JS);
        results[t.name] = result;
        for (const [k, v] of Object.entries(result)) log(`${label} ${t.name} ${k}: ${JSON.stringify(v)}`);
      } catch (e) {
        log(`${label} ${t.name} BLOCKER: ${e && e.message ? e.message : e}`);
        results[t.name] = { error: String(e && e.message ? e.message : e).slice(0, 300) };
      }
    }
    return { ok: Object.values(results).some((r) => !r.error), results };
  } finally {
    try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  }
}

async function main() {
  log(`binaries thử: ${BINARIES.join(" | ")}`);
  const srv = await startHttp();
  log(`http bench server: 127.0.0.1:${HTTP_PORT}`);
  const preview = await startVitePreview();
  let previewUp = false;
  if (preview) {
    try { const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`); previewUp = r.ok; } catch { previewUp = false; }
  }
  log(`vite preview: ${previewUp ? `lên tại 127.0.0.1:${PREVIEW_PORT}` : "KHÔNG lên / không tải được (chỉ đo trang tối giản)"}`);
  const targets = [
    { name: "minimal", url: `http://127.0.0.1:${HTTP_PORT}/`, expectPrefix: `http://127.0.0.1:${HTTP_PORT}/` },
  ];
  if (previewUp) {
    targets.push({ name: "vitePreview", url: `http://127.0.0.1:${PREVIEW_PORT}/`,
      expectPrefix: `http://127.0.0.1:${PREVIEW_PORT}/`,
      waitFor: "document.querySelector('#root') && document.querySelector('#root').children.length > 0" });
  }
  // PIPE_ONLY=minimal|vitePreview: chạy vòng đơn lẻ trên tiến trình Chrome
  // mới (tránh nhiễm chéo bộ nhớ/GC giữa các vòng trong cùng tiến trình).
  if (process.env.PIPE_ONLY) {
    const only = targets.filter((t) => t.name === process.env.PIPE_ONLY);
    if (only.length) targets.splice(0, targets.length, ...only);
    else log(`PIPE_ONLY=${process.env.PIPE_ONLY} không khớp vòng nào, chạy tất cả`);
  }
  let xvfb = null;
  let anyOk = false;
  try {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    const num = DISPLAY.replace(":", "");
    for (let i = 0; i < 40; i++) {
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) break;
      await sleep(250);
    }
    if (!fs.existsSync(`/tmp/.X11-unix/X${num}`)) throw new Error(`Xvfb không tạo socket X${num}`);
    log(`Xvfb lên: DISPLAY=${DISPLAY}`);
    for (const bin of BINARIES) {
      if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
      try {
        const r = await runHeaded(bin.includes("ms-playwright") ? "PW156" : "META152", bin, DISPLAY, targets);
        if (r.ok) { anyOk = true; break; }
        log(`BLOCKER-PIPE ${bin}: chạy được pipe nhưng không vòng nào đo được`);
      } catch (e) {
        log(`BLOCKER-PIPE ${bin}: ${e && e.message ? e.message : e}`);
      }
    }
  } finally {
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { preview && preview.kill("SIGKILL"); } catch { /* bỏ qua */ }
  }
  srv.close();
  log(`DONE measure-headed-fps-pipe headedOk=${anyOk} vitePreviewUp=${previewUp}`);
  if (!anyOk) process.exit(2);
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
