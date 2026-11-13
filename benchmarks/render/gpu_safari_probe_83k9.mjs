#!/usr/bin/env node
/**
 * gpu_safari_probe_83k9.mjs — Phase 9 đợt 83, luồng K9: GPU thật / Safari thật.
 *
 * Nối tiếp E8 (đợt 77) + G8 (đợt 79): đo SÂU HƠN trên WebKit thật (webkit-2388)
 * so với Chromium full build, trên cùng VM, ở TẢI THẤP (G8 đo lúc load ~28,
 * số FPS của G8 bị nhiễm nặng — đợt này đo lại lúc tải ~2).
 *
 * Đo trong trang (cả 2 engine, cùng code):
 *   A. WebGL1/2: UNMASKED_VENDOR/RENDERER (failIfMajorPerformanceCaveat
 *      false + true), MAX_TEXTURE_SIZE, MAX_RENDERBUFFER_SIZE,
 *      MAX_VIEWPORT_DIMS, MAX_TEXTURE_IMAGE_UNITS. WebGPU present?
 *   B. rAF trống 3 s × 2 lần (tách throttle rAF khỏi chi phí vẽ).
 *   C. rAF drawImage upscale canvas 1280×720 → 1991×815 (đúng kích thước
 *      preview J9), quality "high", 5 s: số frame + ms/call (median/p95).
 *   D. Video h264 320×180 loop 6 s: currentTime mỗi 1 s, rVFC presented
 *      frames, getVideoPlaybackQuality; nếu kẹt thì thử workaround H5
 *      (ended → seek(0) + play) và ghi kết quả.
 *   E. Kernel drawImage upscale (phương pháp J2, đợt 82): mẫu sqw4
 *      512×512 qua putImageData → drawImage 512→580 (s=1,1328) và
 *      512→1024 (s=2,0), quality high + medium; đọc hàng giữa.
 *      Phân tích Node-side so với 6 kernel (tri / BC(0,25,0,375) /
 *      Mitchell(1/3,1/3) / Catmull / B-spline / Lanczos2) bằng đúng
 *      chromeWeights1D của chrome-resample.mjs (quy ước S=(i+0,5)/s).
 *   F. Feature-check nhanh: MediaRecorder, ctx.filter, OffscreenCanvas,
 *      video.captureStream, canvas.captureStream (đính chính E8/G8).
 *
 * Chạy: xvfb-run -a node benchmarks/render/gpu_safari_probe_83k9.mjs
 * Ra: benchmarks/results/webkit-safari-probe-83k9.json
 * Clip: /tmp/k9/clips (tự encode bằng ffmpeg, KHÔNG stage — không binary).
 * Không sửa production. Không push/tag/workflow.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..", "..");
const OUT = path.join(REPO, "benchmarks", "results", "webkit-safari-probe-83k9.json");
const CLIPS_DIR = process.env.K9_CLIPS_DIR || "/tmp/k9/clips";
const HTTP_PORT = Number(process.env.K9_HTTP_PORT || 8899);
const CHROMIUM_FULL = path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome");
const PW = createRequire(import.meta.url)("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const { webkit, chromium } = PW;

// --- kernel analysis (Node-side), tái dùng chrome-resample.mjs ---
const resampleMod = await import(path.join(REPO, "apps/web/scripts/chrome-resample.mjs"));
const { chromeWeights1D, triangleKernel } = resampleMod;
function bcCubic(x, B, C) {
  const a = Math.abs(x);
  if (a < 1) return ((12 - 9 * B - 6 * C) * a ** 3 + (-18 + 12 * B + 6 * C) * a ** 2 + (6 - 2 * B)) / 6;
  if (a < 2) return ((-B - 6 * C) * a ** 3 + (6 * B + 30 * C) * a ** 2 + (-12 * B - 48 * C) * a + (8 * B + 24 * C)) / 6;
  return 0;
}
function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
function lanczos2(x) { const a = Math.abs(x); return a < 2 ? sinc(x) * sinc(x / 2) : 0; }
const KERNELS = {
  tri: triangleKernel,
  "bc025-0375": (x) => bcCubic(x, 0.25, 0.375),
  mitchell: (x) => bcCubic(x, 1 / 3, 1 / 3),
  catmull: (x) => bcCubic(x, 0, 0.5),
  bspline: (x) => bcCubic(x, 1, 0),
  lanczos2,
};
function resampleRow1D(row, dstLen, kernel) {
  const srcLen = row.length, out = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let acc = 0;
    for (const [j, w] of chromeWeights1D(i, dstLen / srcLen, srcLen, kernel)) acc += w * row[j];
    out[i] = acc;
  }
  return out;
}
function mad(a, b) {
  // J2-compatible: so sánh với dự báo ĐÃ LÀM TRÒN (Chrome trả số nguyên).
  // MAD trên dự báo float thô bị nhiễm ~0,2 do phần lẻ .5 (xem LIMITS K9 §2.3).
  let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - Math.max(0, Math.min(255, Math.round(b[i]))));
  return +(s / a.length).toFixed(3);
}
function sqw4Row(w = 512) {
  const r = new Float64Array(w);
  for (let x = 0; x < w; x++) r[x] = (Math.floor(x / 4) % 2 === 0) ? 64 : 192;
  return r;
}
function stepRow(w = 512) {
  const r = new Float64Array(w);
  for (let x = 0; x < w; x++) r[x] = x < 256 ? 64 : 192;
  return r;
}
function analyzeKernel(captures) {
  // captures: { "sqw4@s1132-high": {row:[...]}, ... } — row là kênh R hàng giữa.
  const out = {};
  for (const [name, cap] of Object.entries(captures)) {
    const [kind, scale, _q] = name.split("@").length ? name.split("@") : [name];
    const m = name.match(/^(sqw4|step)@s(\d+)-(\w+)$/);
    if (!m) { out[name] = { error: "tên capture không khớp mẫu" }; continue; }
    const [, pat, sTag, quality] = m;
    const dstLen = cap.row.length;
    const src = pat === "sqw4" ? sqw4Row() : stepRow();
    const per = {};
    for (const [kname, kfn] of Object.entries(KERNELS)) {
      const pred = resampleRow1D(src, dstLen, kfn);
      const clamped = Array.from(pred, (v) => Math.max(0, Math.min(255, Math.round(v))));
      let exact = 0;
      for (let i = 0; i < dstLen; i++) if (clamped[i] === cap.row[i]) exact++;
      per[kname] = { mad: mad(cap.row, pred), exactFrac: +(exact / dstLen).toFixed(3) };
    }
    const best = Object.entries(per).sort((a, b) => a[1].mad - b[1].mad)[0][0];
    out[name] = { quality, dstLen, best, per };
  }
  return out;
}

function loadavg() { return os.loadavg().map((v) => +v.toFixed(2)); }
function writeFileRetry(p, data, tries = 12) {
  for (let i = 0; i < tries; i++) {
    try { writeFileEpermRetry(p, data); return true; } catch (e) {
      if (i === tries - 1) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10000);
    }
  }
  return false;
}

const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>k9-ready</title></head>
<body><script>
window.__k9run = async function (clipUrl) {
  const out = {};
  const q = (arr) => { const s=[...arr].sort((a,b)=>a-b); const n=s.length;
    return { n, median: n? +s[Math.floor(n/2)].toFixed(2):null, p95: n? +s[Math.floor(n*0.95)].toFixed(2):null,
      mean: n? +(s.reduce((a,b)=>a+b,0)/n).toFixed(2):null, min: n? +s[0].toFixed(2):null, max: n? +s[n-1].toFixed(2):null }; };
  // A. WebGL
  out.webgl = {};
  for (const ver of ["webgl2", "webgl"]) {
    for (const caveat of [false, true]) {
      const c = document.createElement("canvas");
      const gl = c.getContext(ver, { failIfMajorPerformanceCaveat: caveat });
      if (!gl) { out.webgl[ver + (caveat ? "-strict" : "")] = { context: false }; continue; }
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const unmasked = ext ? { vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL), renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) } : null;
      out.webgl[ver + (caveat ? "-strict" : "")] = { context: true, version: gl.getParameter(gl.VERSION),
        shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION), unmasked,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
        maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) };
    }
  }
  out.webgpu = { present: typeof navigator.gpu !== "undefined" };
  // F. features
  const tctx = document.createElement("canvas").getContext("2d");
  out.features = { mediaRecorder: typeof MediaRecorder !== "undefined",
    ctxFilter: "filter" in tctx, offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    createImageBitmap: typeof createImageBitmap === "function",
    videoCaptureStream: "captureStream" in document.createElement("video"),
    canvasCaptureStream: "captureStream" in document.createElement("canvas"),
    requestVideoFrameCallback: "requestVideoFrameCallback" in document.createElement("video") };
  // B. rAF trống 3 s × 2
  out.rafEmpty = [];
  for (let r = 0; r < 2; r++) {
    const gaps = []; let frames = 0, last = 0; const t0 = performance.now();
    await new Promise((resolve) => { const guard = setTimeout(resolve, 5000);
      (function tick(t) { if (last) gaps.push(t - last); last = t; frames++;
        if (t - t0 < 3000) requestAnimationFrame(tick); else { clearTimeout(guard); resolve(); } })(0); });
    const wall = performance.now() - t0;
    out.rafEmpty.push({ frames, wallMs: Math.round(wall), fps: +(frames / (wall / 1000)).toFixed(2), gaps: q(gaps) });
  }
  // C2. Thí nghiệm tách chi phí composite: 4 arm × 4 s (K9 §2.2 — arm C lần
  // đầu chỉ được 9 frame/5,6 s, cần biết có phải do composite canvas gắn DOM).
  {
    const mkSrc = () => { const s = document.createElement("canvas"); s.width = 1280; s.height = 720;
      const x = s.getContext("2d"); const img = x.createImageData(1280, 720);
      for (let y = 0; y < 720; y++) for (let xx = 0; xx < 1280; xx++) {
        const i = (y * 1280 + xx) * 4, v = ((Math.floor(xx / 8) + Math.floor(y / 8)) % 2 === 0) ? 64 : 192;
        img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 255; }
      x.putImageData(img, 0, 0); return s; };
    const runArm = async (name, attach, draw) => {
      const src = mkSrc();
      const dst = document.createElement("canvas"); dst.width = 1991; dst.height = 815;
      if (attach) document.body.appendChild(dst);
      const dx = dst.getContext("2d"); dx.imageSmoothingEnabled = true; dx.imageSmoothingQuality = "high";
      const times = []; const gaps = []; let frames = 0, last = 0; const t0 = performance.now();
      const vis = document.visibilityState, foc = document.hasFocus();
      await new Promise((resolve) => { const guard = setTimeout(resolve, 6000);
        (function tick(t) { if (last) gaps.push(t - last); last = t;
          if (draw) { const a = performance.now(); dx.drawImage(src, 0, 0, 1991, 815); times.push(performance.now() - a); }
          frames++; if (t - t0 < 4000) requestAnimationFrame(tick); else { clearTimeout(guard); resolve(); } })(0); });
      const wall = performance.now() - t0;
      const r = { frames, wallMs: Math.round(wall), fps: +(frames / (wall / 1000)).toFixed(2),
        gaps: q(gaps), drawMs: times.length ? q(times) : null, visibility: vis, hasFocus: foc };
      if (attach) dst.remove();
      return [name, r]; };
    out.drawArms = Object.fromEntries([
      await runArm("empty", false, false),
      await runArm("draw-detached", false, true),
      await runArm("draw-attached", true, true),
      await runArm("attached-nodraw", true, false),
    ]);
  }
  // D. video h264 loop 6 s
  {
    const v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.src = clipUrl;
    document.body.appendChild(v);
    const samples = []; let presented = 0; let rvfcActive = false;
    if ("requestVideoFrameCallback" in v) { rvfcActive = true;
      const cb = () => { presented++; v.requestVideoFrameCallback(cb); };
      v.requestVideoFrameCallback(cb); }
    let endedCount = 0; v.addEventListener("ended", () => endedCount++);
    let playErr = null;
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { playErr = String(e.message || e); }
    samples.push({ t: 0, paused: v.paused, currentTime: +v.currentTime.toFixed(2), readyState: v.readyState });
    for (let i = 1; i <= 6; i++) { await new Promise((r) => setTimeout(r, 1000));
      samples.push({ t: i, paused: v.paused, currentTime: +v.currentTime.toFixed(2), readyState: v.readyState }); }
    let quality = null; try { const qq = v.getVideoPlaybackQuality();
      quality = { total: qq.totalVideoFrames, dropped: qq.droppedVideoFrames, corrupted: qq.corruptedVideoFrames }; } catch {}
    // H5 workaround nếu video kẹt (currentTime không tiến sau 6 s phát)
    let workaround = null;
    if (!playErr && samples[6].currentTime <= 0.01 && !v.paused) {
      try { v.pause(); v.currentTime = 0; await v.play();
        await new Promise((r) => setTimeout(r, 2000));
        workaround = { afterSeekPlay: true, currentTime: +v.currentTime.toFixed(2), paused: v.paused }; }
      catch (e) { workaround = { error: String(e.message || e) }; }
    }
    out.video = { clip: clipUrl.split("/").pop(), playErr, hasRvfc: rvfcActive, presentedFrames: presented,
      samples, quality, endedCount, workaround };
    v.pause(); v.remove();
  }
  // E. kernel probe (phương pháp J2): sqw4 + step, s=1,1328 & 2,0, high + medium
  {
    const caps = {};
    const mkSrc = (kind) => { const c = document.createElement("canvas"); c.width = 512; c.height = 512;
      const x = c.getContext("2d"); const img = x.createImageData(512, 512);
      for (let yy = 0; yy < 512; yy++) for (let xx = 0; xx < 512; xx++) {
        const i = (yy * 512 + xx) * 4;
        let val; if (kind === "sqw4") val = (Math.floor(xx / 4) % 2 === 0) ? 64 : 192;
        else val = xx < 256 ? 64 : 192;
        img.data[i] = val; img.data[i+1] = val; img.data[i+2] = val; img.data[i+3] = 255; }
      x.putImageData(img, 0, 0); return c; };
    for (const kind of ["sqw4", "step"]) {
      const src = mkSrc(kind);
      for (const [sTag, dw] of [["s1132", 580], ["s2000", 1024]]) {
        for (const quality of ["high", "medium"]) {
          const dst = document.createElement("canvas"); dst.width = dw; dst.height = dw;
          const dx = dst.getContext("2d"); dx.imageSmoothingEnabled = true; dx.imageSmoothingQuality = quality;
          dx.drawImage(src, 0, 0, dw, dw);
          const d = dx.getImageData(0, 256, dw, 1).data;
          const row = []; for (let i = 0; i < dw; i++) row.push(d[i * 4]);
          caps[kind + "@" + sTag + "-" + quality] = { row };
        }
      }
    }
    out.kernelCaptures = caps;
  }
  return out;
};
</script></body></html>`;

const MIME = { ".mp4": "video/mp4", ".webm": "video/webm", ".html": "text/html" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/probe.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE_HTML); return; }
  const fp = path.join(CLIPS_DIR, path.basename(url));
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
    fs.createReadStream(fp).pipe(res); return;
  }
  res.writeHead(404); res.end();
});
await new Promise((res, rej) => { server.once("error", rej); server.listen(HTTP_PORT, "127.0.0.1", res); });
console.log(`K9 http :${HTTP_PORT} clips=${CLIPS_DIR} load=${JSON.stringify(loadavg())}`);

const result = {
  measuredAt: new Date().toISOString(),
  host: { os: `${os.type()} ${os.release()}`, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model,
    totalMemMiB: Math.round(os.totalmem() / 1048576), loadavgStart: loadavg() },
  clipsDir: CLIPS_DIR, notes: "Chromium full build 1254 headed (xvfb) vs WebKit 2388 headed (xvfb). Load ghi kèm từng engine.",
};

async function runEngine(label, launcher) {
  const before = loadavg();
  let browser;
  try {
    browser = await launcher();
  } catch (e) {
    console.log(`${label}: KHỞI ĐỘNG THẤT BẠI — ${String(e.message || e).split("\n")[0]}`);
    return { engine: label, launchOk: false, loadBefore: before, loadAfter: loadavg(),
      launchError: String(e.message || e).slice(0, 1200) };
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${HTTP_PORT}/probe.html`, { waitUntil: "load", timeout: 30000 });
  const ready = await page.evaluate(() => document.title === "k9-ready" && typeof window.__k9run === "function");
  if (!ready) throw new Error(`${label}: trang probe không sẵn`);
  const t0 = Date.now();
  const data = await page.evaluate((u) => window.__k9run(u), `http://127.0.0.1:${HTTP_PORT}/h264.mp4`);
  const wallS = +((Date.now() - t0) / 1000).toFixed(1);
  data.kernelAnalysis = analyzeKernel(data.kernelCaptures);
  await browser.close();
  const after = loadavg();
  console.log(`${label}: xong ${wallS}s, load trước ${JSON.stringify(before)} sau ${JSON.stringify(after)}, pageerrors=${errors.length}`);
  return { engine: label, launchOk: true, version: label === "chromium" ? "158.0.8127.18 (chromium-1254 full build)" : "27.2 (webkit-2388)",
    mode: "headed-xvfb", wallS, loadBefore: before, loadAfter: after, pageErrors: errors, ...data };
}

result.chromium = await runEngine("chromium", () =>
  chromium.launch({ headless: false, executablePath: CHROMIUM_FULL, args: ["--no-sandbox", "--disable-dev-shm-usage"] }));
writeFileRetry(OUT, JSON.stringify(result, null, 1));
console.log(`K9 đã ghi tạm ${OUT} (chromium xong, webkit chưa)`);
result.webkit = await runEngine("webkit", () =>
  webkit.launch({ headless: false, args: ["--no-sandbox"] }));
if (!result.webkit.launchOk) {
  // Thử lại đường headless (bản WPE) — ghi cả hai lỗi làm bằng chứng.
  result.webkitHeadlessWpe = await runEngine("webkit-headless-wpe", () =>
    webkit.launch({ headless: true, args: ["--no-sandbox"] }));
}
result.host.loadavgEnd = loadavg();
server.close();
writeFileRetry(OUT, JSON.stringify(result, null, 1));
console.log(`K9 đã ghi ${OUT}`);
