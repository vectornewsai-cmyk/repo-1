#!/usr/bin/env node
/**
 * gpu_safari_probe_79g8.mjs — Phase 9 đợt 79, luồng G8.
 *
 * Nối tiếp E8 (đợt 77, docs/PHASE9_ROUND77_E8_GPU_SAFARI_LIMITS.md):
 *  - (a) GPU trên VM này: WebGL renderer qua Chromium full build HEADED
 *    (xvfb-run) — hardware hay SwiftShader; navigator.gpu adapter info;
 *    chrome://gpu feature status (Video Decode/Encode...); FFmpeg hwaccel
 *    đo lại bằng shell (không trong script này).
 *  - (b) WebKit thêm: MediaRecorder đo lại; phát lại 5 codec; FPS
 *    rAF-canvas + FPS phát video (requestVideoFrameCallback) trên cả
 *    WebKit và Chromium để có số preview/render đầu tiên trên WebKit.
 *  - (c) Nếu không có GPU/Safari thật: ghi rõ giới hạn, không bịa số.
 *
 * Playwright mới nhất trên npm vẫn là 1.65.0 (kiểm 10/11/2026) nên
 * webkit-2388 (WebKit 27.2) ĐÃ LÀ WebKitGTK mới nhất qua kênh này —
 * không có bản WebKit mới hơn để cài. Không có libwebkitgtk hệ thống.
 *
 * Chạy: xvfb-run -a node benchmarks/render/gpu_safari_probe_79g8.mjs [outDir]
 * Ra: <outDir>/webkit-safari-probe-79g8.json. Không sửa production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..", "..");
const OUT_DIR = process.argv[2] || path.join(REPO, "benchmarks", "results");
const CLIPS_DIR = process.env.G8_CLIPS_DIR || "/tmp/g8/clips";
const HTTP_BASE = process.env.G8_HTTP_BASE || "http://127.0.0.1:8899";
const CHROMIUM_FULL = path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome");

function resolvePlaywrightCore() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_CORE_PATH) candidates.push(process.env.PLAYWRIGHT_CORE_PATH);
  candidates.push("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
  for (const d of fs.readdirSync(path.join(os.homedir(), ".npm", "_npx"))) {
    candidates.push(path.join(os.homedir(), ".npm", "_npx", d, "node_modules", "playwright-core"));
  }
  candidates.push("playwright-core");
  for (const c of candidates) {
    try { return createRequire(import.meta.url)(c); } catch { /* tiếp */ }
  }
  throw new Error("Không tìm thấy playwright-core trên máy này.");
}

const { webkit, chromium } = resolvePlaywrightCore();
const CLIPS = ["h264.mp4", "vp9.webm", "vp8.webm", "av1.mp4", "hevc.mp4"];

async function gpuProbe(page) {
  return await page.evaluate(async () => {
    const out = {};
    // WebGL1 + WebGL2 unmasked renderer.
    for (const ver of ["webgl2", "webgl"]) {
      try {
        const c = document.createElement("canvas");
        const gl = c.getContext(ver, { failIfMajorPerformanceCaveat: false });
        if (!gl) { out[ver] = { context: false }; continue; }
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const info = { context: true, version: gl.getParameter(gl.VERSION), shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) };
        if (ext) {
          info.unmaskedVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
          info.unmaskedRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        } else info.unmaskedRenderer = "(no WEBGL_debug_renderer_info)";
        // failIfMajorPerformanceCaveat=true: context null => software-only.
        const c2 = document.createElement("canvas");
        const gl2 = c2.getContext(ver, { failIfMajorPerformanceCaveat: true });
        info.hwContextAllowed = !!gl2;
        out[ver] = info;
      } catch (e) { out[ver] = { error: String(e && e.message || e) }; }
    }
    // WebGPU adapter.
    out.webgpu = { present: typeof navigator.gpu !== "undefined" };
    if (out.webgpu.present) {
      for (const pref of ["high-performance", "low-power", null]) {
        const key = pref || "default";
        try {
          const adapter = await navigator.gpu.requestAdapter(pref ? { powerPreference: pref } : undefined);
          if (!adapter) { out.webgpu[key] = { adapter: null }; continue; }
          let info = null;
          try { info = adapter.info || (adapter.requestAdapterInfo ? await adapter.requestAdapterInfo() : null); } catch (e) { info = { infoError: String(e.message) }; }
          out.webgpu[key] = { adapter: true, isFallbackAdapter: adapter.isFallbackAdapter, info };
        } catch (e) { out.webgpu[key] = { error: String(e && e.message || e) }; }
      }
    }
    // VideoDecoder hardwareAcceleration preference (chỉ là preference, không chứng minh HW thật).
    out.videoDecoderHw = {};
    if (typeof VideoDecoder !== "undefined") {
      for (const pref of ["prefer-hardware", "prefer-software"]) {
        try {
          const r = await VideoDecoder.isConfigSupported({ codec: "avc1.42E01E", codedWidth: 1280, codedHeight: 720, hardwareAcceleration: pref });
          out.videoDecoderHw[pref] = r.supported;
        } catch (e) { out.videoDecoderHw[pref] = "THROW:" + e.message; }
      }
    } else out.videoDecoderHw = null;
    out.mediaRecorder = typeof MediaRecorder !== "undefined";
    out.canvasCaptureStream = typeof document.createElement("canvas").captureStream === "function";
    // WebGL shader timing (nhẹ, để phân biệt software rasterizer):
    // fullscreen quad 640x360, fragment shader 30 vòng sin/cos, 12 frame, gl.finish().
    // SwiftShader/llvmpipe: hàng chục ms/frame; GPU thật: < 2 ms. Chỉ so tương đối
    // giữa 2 engine trên cùng máy — không suy ra được "GPU thật" từ một con số.
    try {
      const c = document.createElement("canvas"); c.width = 640; c.height = 360;
      document.body.appendChild(c);
      const gl = c.getContext("webgl2");
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, "attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }");
      gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, "precision highp float; uniform float t; uniform vec2 r; void main(){ vec2 uv = gl_FragCoord.xy/r; float v=0.; for(int i=0;i<30;i++){ v += sin(uv.x*20.+float(i)*.7+t)*cos(uv.y*20.+float(i)*.3); } gl_FragColor = vec4(vec3(.5+.5*sin(v)),1.); }");
      gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error("fs compile: " + gl.getShaderInfoLog(fs));
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tl = gl.getUniformLocation(pr, "t"), rl = gl.getUniformLocation(pr, "r");
      gl.uniform2f(rl, 640, 360);
      const N = 12, times = [];
      for (let i = 0; i < N; i++) {
        const t0 = performance.now();
        gl.uniform1f(tl, i * 0.1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.finish();
        times.push(performance.now() - t0);
      }
      times.sort((a, b) => a - b);
      out.webglShaderMs = { frames: N, size: "640x360", iterations: 30, median: +times[Math.floor(N / 2)].toFixed(2), p95: +times[Math.floor(N * 0.95)].toFixed(2), min: +times[0].toFixed(2) };
      c.remove();
    } catch (e) { out.webglShaderMs = { error: String(e && e.message || e) }; }
    return out;
  });
}

async function chromeGpuPage(browser) {
  // chrome://gpu — đọc Graphics Feature Status. Có thể bị chặn tùy build.
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("chrome://gpu", { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body ? document.body.innerText : "");
    const contentLen = await page.content().then((c) => c.length).catch(() => -1);
    await ctx.close();
    const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
    const keep = [];
    const want = /^(Canvas|Compositing|Multiple Raster Threads|Out-of-process Rasterization|OpenGL|Rasterization|Raw Draw|Skia Graphite|Video Decode|Video Encode|Video Rasterization|WebGL|WebGL2|WebGPU|WebNN|Vulkan|Direct Rendering Display Compositor|Surface Synchronization|Graphics|Protected video decode|ANGLE|Dawn|Metal|Sandboxed)/i;
    let inStatus = false;
    for (const l of lines) {
      if (/Graphics Feature Status/i.test(l)) { inStatus = true; keep.push(l); continue; }
      if (inStatus) {
        if (/^(Driver Information|Problems Detected|Version Information|Compositor Information|GpuProcessHost|Log Messages|Disabled Extensions|Da?ta|ANGLE|Dawn)/i.test(l)) break;
        if (want.test(l)) keep.push(l);
      }
    }
    return { ok: true, featureStatus: keep, rawHead: lines.slice(0, 8), contentLength: contentLen };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

async function fpsProbe(page, clipFile) {
  return await page.evaluate(async ({ clipFile }) => {
    const out = {};
    // (1) rAF canvas animation FPS, 1280x720, 5 s, 2 reps.
    async function rafFps(ms) {
      const c = document.createElement("canvas");
      c.width = 1280; c.height = 720;
      document.body.appendChild(c);
      const ctx = c.getContext("2d");
      const gaps = [];
      let frames = 0, last = 0;
      const t0 = performance.now();
      await new Promise((resolve) => {
        // Guard: nếu rAF dừng hẳn (tab ẩn/headless), vẫn kết thúc sau ms+2s.
        const guard = setTimeout(resolve, ms + 2000);
        function tick(t) {
          if (last) gaps.push(t - last);
          last = t;
          frames++;
          // workload giống preview nhẹ: gradient + shapes + text.
          const g = ctx.createLinearGradient(0, 0, 1280, 720);
          g.addColorStop(0, `hsl(${(t / 20) % 360},70%,50%)`);
          g.addColorStop(1, "#222");
          ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
          ctx.fillStyle = "#fff";
          for (let i = 0; i < 40; i++) ctx.fillRect((i * 97 + t / 5) % 1280, (i * 53) % 720, 24, 24);
          ctx.font = "48px sans-serif"; ctx.fillText("VCut FPS " + frames, 40, 100);
          if (t - t0 < ms) requestAnimationFrame(tick); else { clearTimeout(guard); resolve(); }
        }
        requestAnimationFrame(tick);
      });
      const wall = performance.now() - t0;
      gaps.sort((a, b) => a - b);
      const p = (q) => gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))] : null;
      c.remove();
      return { frames, wallMs: Math.round(wall), fps: +(frames / (wall / 1000)).toFixed(2), gapMedianMs: p(0.5) ? +p(0.5).toFixed(2) : null, gapP95Ms: p(0.95) ? +p(0.95).toFixed(2) : null, gapMaxMs: gaps.length ? +gaps[gaps.length - 1].toFixed(2) : null };
    }
    out.rafCanvas = [await rafFps(5000), await rafFps(5000)];
    // (2) Video playback FPS qua requestVideoFrameCallback, clip loop 5 s.
    if (clipFile) {
      try {
        const v = document.createElement("video");
        v.muted = true; v.loop = true; v.playsInline = true;
        v.src = clipFile; // URL http (file:// từ about:blank bị chặn ở cả 2 engine)
        document.body.appendChild(v);
        // play() có thể treo trên WebKitGTK tải nặng — race với timeout 10 s.
        await Promise.race([
          v.play().then(() => "played").catch((e) => { throw e; }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000)),
        ]);
        let presented = 0;
        let lastMedia = -1;
        const hasRvfc = typeof v.requestVideoFrameCallback === "function";
        const t0 = performance.now();
        if (hasRvfc) {
          await new Promise((resolve) => {
            // Guard: nếu rVFC dừng hẳn (video stall), vẫn kết thúc sau 7 s.
            const guard = setTimeout(resolve, 7000);
            const cb = (now, meta) => {
              if (meta.mediaTime !== lastMedia) { presented++; lastMedia = meta.mediaTime; }
              if (performance.now() - t0 < 5000) v.requestVideoFrameCallback(cb); else { clearTimeout(guard); resolve(); }
            };
            v.requestVideoFrameCallback(cb);
          });
        } else {
          await new Promise((r) => setTimeout(r, 5000));
        }
        const wall = performance.now() - t0;
        let q = null;
        try { if (typeof v.getVideoPlaybackQuality === "function") q = v.getVideoPlaybackQuality(); } catch {}
        out.videoPlayback = {
          clip: clipFile.split("/").pop(), hasRvfc,
          presentedFrames: presented, wallMs: Math.round(wall),
          fps: hasRvfc ? +(presented / (wall / 1000)).toFixed(2) : null,
          currentTime: +v.currentTime.toFixed(2),
          quality: q ? { totalVideoFrames: q.totalVideoFrames, droppedVideoFrames: q.droppedVideoFrames, corruptedVideoFrames: q.corruptedVideoFrames } : null,
        };
        v.pause(); v.remove();
      } catch (e) { out.videoPlayback = { error: String(e && e.message || e) }; }
    }
    return out;
  }, { clipFile: clipFile || null });
}

async function playbackProbe(browser) {
  const results = {};
  const ctx = await browser.newContext({ acceptDownloads: false });
  const page = await ctx.newPage();
  for (const clip of CLIPS) {
    const rec = { file: clip };
    try {
      await page.goto("file://" + path.join(CLIPS_DIR, clip), { waitUntil: "load", timeout: 15000 });
      let state = await page.evaluate(() => {
        const vid = document.querySelector("video");
        if (!vid) return { videoElement: false };
        return { videoElement: true, readyState: vid.readyState, videoWidth: vid.videoWidth, videoHeight: vid.videoHeight, duration: vid.duration, error: vid.error ? { code: vid.error.code } : null, networkState: vid.networkState };
      });
      for (let i = 0; i < 16 && state.videoElement && state.readyState < 2 && !state.error; i++) {
        await page.waitForTimeout(500);
        state = await page.evaluate(() => {
          const vid = document.querySelector("video");
          return { videoElement: true, readyState: vid.readyState, videoWidth: vid.videoWidth, videoHeight: vid.videoHeight, duration: vid.duration, error: vid.error ? { code: vid.error.code } : null, networkState: vid.networkState };
        });
      }
      rec.result = state;
      rec.playable = state.videoElement && state.readyState >= 2 && !state.error;
    } catch (e) { rec.result = { error: "GOTO-THROW:" + e.message }; rec.playable = false; }
    results[clip] = rec;
  }
  await ctx.close();
  return results;
}

async function runChromium() {
  const t0 = Date.now();
  const headed = !!process.env.DISPLAY;
  const browser = await chromium.launch({
    headless: !headed,
    executablePath: fs.existsSync(CHROMIUM_FULL) ? CHROMIUM_FULL : undefined,
    args: ["--no-sandbox"],
  });
  const out = { engine: "chromium", mode: headed ? "headed-xvfb" : "headless-new", launchedMs: Date.now() - t0, version: browser.version(), executablePath: CHROMIUM_FULL };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(HTTP_BASE + "/index.html");
    console.log("  gpuProbe..."); out.gpu = await gpuProbe(page); console.log("  gpuProbe done");
    console.log("  chromeGpu..."); out.chromeGpu = await chromeGpuPage(browser); console.log("  chromeGpu done");
    console.log("  fpsProbe..."); const _lb = os.loadavg().map((x) => +x.toFixed(2)); out.fps = await fpsProbe(page, HTTP_BASE + "/h264.mp4"); out.fpsLoadavg = { before: _lb, after: os.loadavg().map((x) => +x.toFixed(2)) }; console.log("  fpsProbe done");
    await page.close();
    console.log("  playback..."); out.playback = await playbackProbe(browser); console.log("  playback done");
  } finally { await browser.close(); }
  return out;
}

async function runWebkit() {
  const t0 = Date.now();
  const headed = !!process.env.DISPLAY;
  let browser;
  try {
    browser = await webkit.launch({ headless: !headed });
  } catch (e) {
    // headed webkit có thể không chạy dưới xvfb — fallback headless.
    browser = await webkit.launch({ headless: true });
  }
  const out = { engine: "webkit", mode: headed ? "headed-xvfb-or-fallback" : "headless", launchedMs: Date.now() - t0, version: browser.version() };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(HTTP_BASE + "/index.html");
    console.log("  gpuProbe..."); out.gpu = await gpuProbe(page); console.log("  gpuProbe done");
    console.log("  fpsProbe..."); const _lb = os.loadavg().map((x) => +x.toFixed(2)); out.fps = await fpsProbe(page, HTTP_BASE + "/h264.mp4"); out.fpsLoadavg = { before: _lb, after: os.loadavg().map((x) => +x.toFixed(2)) }; console.log("  fpsProbe done");
    await page.close();
    console.log("  playback..."); out.playback = await playbackProbe(browser); console.log("  playback done");
  } finally { await browser.close(); }
  return out;
}

const results = {
  measuredAt: new Date().toISOString(),
  host: { os: os.type() + " " + os.release(), cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model, totalMemMiB: Math.round(os.totalmem() / 1048576), loadavg: os.loadavg().map((x) => +x.toFixed(2)), display: process.env.DISPLAY || null },
  clipsDir: CLIPS_DIR,
  notes: "webkit-2388 is the newest Playwright WebKit (playwright-core 1.65.0 is latest on npm, checked 2026-11-10). No system libwebkitgtk. No /dev/dri. See docs/PHASE9_ROUND79_G8_GPU_SAFARI_LIMITS.md.",
};
for (const [name, fn] of [["chromium", runChromium], ["webkit", runWebkit]]) {
  try { console.log(`[${name}] starting...`); results[name] = await fn(); console.log(`[${name}] OK — version ${results[name].version}`); }
  catch (e) { results[name] = { engine: name, launchError: String(e && e.stack || e) }; console.log(`[${name}] FAILED: ${e.message}`); }
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, "webkit-safari-probe-79g8.json");
writeFileEpermRetry(outPath, JSON.stringify(results, null, 2) + "\n");
console.log("Wrote " + outPath);
