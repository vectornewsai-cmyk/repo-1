#!/usr/bin/env node
/**
 * gpu_safari_probe_77e8.mjs — Phase 9 đợt 77, luồng E8.
 *
 * Đo WebKit thật (Playwright webkit-2388 — engine cùng họ Safari, KHÔNG
 * phải Safari shipping) so với Chromium 1254 trên cùng máy này:
 *  - canPlayType / MediaSource.isTypeSupported / VideoDecoder.isConfigSupported
 *    cho cùng ma trận MIME mà codecProbe.ts dùng (đối chiếu baseline B3 §3.2).
 *  - Feature-check các mục audit Safari đợt 73 A7 §4 (roundRect,
 *    backdrop-filter, 100dvh, decodeAudioData, captureStream,
 *    MediaRecorder mặc định, module worker, webkitAudioContext...).
 *  - Phát video thật (file test 320x180: h264/mp4, vp9/webm, vp8/webm,
 *    av1/mp4, hevc/mp4) qua điều hướng file://, ghi readyState/error.
 *
 * playwright-core resolve: env PLAYWRIGHT_CORE_PATH, rồi các bản đã có
 * trên máy này (scratch-round63-r4, cache npx), rồi require thường.
 * Browser lấy từ cache ~/.cache/ms-playwright (webkit-2388, chromium-1254).
 *
 * Chạy: node benchmarks/render/gpu_safari_probe_77e8.mjs [outDir]
 * Ra: <outDir>/webkit-safari-probe-77e8.json (kết quả thô cả 2 engine).
 * Không sửa production, không ghi GitHub.
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
const CLIPS_DIR = process.env.E8_CLIPS_DIR || "/tmp/e8/clips";

function resolvePlaywrightCore() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_CORE_PATH) candidates.push(process.env.PLAYWRIGHT_CORE_PATH);
  candidates.push("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
  for (const d of fs.readdirSync(path.join(os.homedir(), ".npm", "_npx"))) {
    candidates.push(path.join(os.homedir(), ".npm", "_npx", d, "node_modules", "playwright-core"));
  }
  candidates.push("playwright-core");
  for (const c of candidates) {
    try {
      const req = createRequire(import.meta.url);
      const mod = req(c);
      return mod;
    } catch { /* thử tiếp */ }
  }
  throw new Error("Không tìm thấy playwright-core trên máy này.");
}

const { webkit, chromium } = resolvePlaywrightCore();

const MIMES = [
  'video/webm;codecs="vp9"',
  'video/webm;codecs="vp8"',
  'video/webm;codecs="av1"',
  "video/webm",
  'video/mp4;codecs="avc1.42E01E"',
  'video/mp4;codecs="hev1.1.6.L93.B0"',
  'video/mp4;codecs="av01.0.05M.08"',
  'video/mp4;codecs="mp4v.20.3"',
  "video/mp4",
  'video/x-matroska;codecs="vp9"',
  'video/ogg;codecs="theora"',
  "audio/mpeg",
  'audio/mp4;codecs="mp4a.40.2"',
  'audio/ogg;codecs="vorbis"',
  'audio/ogg;codecs="opus"',
  'audio/webm;codecs="opus"',
];

const VIDEO_DECODER_CONFIGS = [
  { codec: "vp09.00.10.08", label: "vp9" },
  { codec: "vp8", label: "vp8" },
  { codec: "av01.0.05M.08", label: "av1" },
  { codec: "avc1.42E01E", label: "h264" },
  { codec: "hvc1.1.6.L93.B0", label: "hevc" },
];

const CLIPS = ["h264.mp4", "vp9.webm", "vp8.webm", "av1.mp4", "hevc.mp4"];

async function featureProbe(page) {
  return await page.evaluate(async ({ mimes, vdConfigs }) => {
    const out = {};
    out.userAgent = navigator.userAgent;
    out.vendor = navigator.vendor;
    out.platform = navigator.platform;
    const v = document.createElement("video");
    const a = document.createElement("audio");
    out.canPlayType = {};
    for (const m of mimes) {
      try { out.canPlayType[m] = v.canPlayType(m) || a.canPlayType(m); }
      catch (e) { out.canPlayType[m] = "THROW:" + e.message; }
    }
    out.mse = {};
    if (typeof MediaSource !== "undefined" && typeof MediaSource.isTypeSupported === "function") {
      for (const m of mimes) {
        try { out.mse[m] = MediaSource.isTypeSupported(m); }
        catch (e) { out.mse[m] = "THROW:" + e.message; }
      }
    } else out.mse = null;
    out.videoDecoder = typeof VideoDecoder !== "undefined";
    out.videoDecoderConfigs = {};
    if (out.videoDecoder) {
      for (const c of vdConfigs) {
        try {
          const r = await VideoDecoder.isConfigSupported({ codec: c.codec, codedWidth: 320, codedHeight: 180 });
          out.videoDecoderConfigs[c.label] = r.supported;
        } catch (e) { out.videoDecoderConfigs[c.label] = "THROW:" + e.message; }
      }
    }
    out.videoEncoder = typeof VideoEncoder !== "undefined";
    out.audioDecoder = typeof AudioDecoder !== "undefined";
    out.encodedVideoChunk = typeof EncodedVideoChunk !== "undefined";
    out.videoFrame = typeof VideoFrame !== "undefined";
    // MediaRecorder: mime mặc định thật (S1/A7) qua canvas.captureStream.
    out.mediaRecorder = typeof MediaRecorder !== "undefined";
    out.mediaRecorderIsTypeSupported = {};
    if (out.mediaRecorder) {
      for (const m of ['video/webm', 'video/webm;codecs="vp9"', 'video/mp4', 'video/mp4;codecs="avc1.42E01E"']) {
        try { out.mediaRecorderIsTypeSupported[m] = MediaRecorder.isTypeSupported(m); }
        catch (e) { out.mediaRecorderIsTypeSupported[m] = "THROW:" + e.message; }
      }
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16; canvas.height = 16;
        if (typeof canvas.captureStream === "function") {
          const stream = canvas.captureStream(1);
          const rec = new MediaRecorder(stream);
          out.mediaRecorderDefaultMime = rec.mimeType || "(empty)";
          out.captureStream = true;
          rec.stop?.();
        } else { out.captureStream = false; out.mediaRecorderDefaultMime = null; }
      } catch (e) { out.mediaRecorderDefaultMime = "THROW:" + e.message; out.captureStream = "THROW"; }
    }
    // Canvas 2D (S2/A7).
    try {
      const c = document.createElement("canvas").getContext("2d");
      out.roundRect = typeof c.roundRect === "function";
      out.ctxFilter = "filter" in c;
    } catch (e) { out.roundRect = "THROW:" + e.message; }
    // CSS (S3/S4/A7).
    out.css = {
      backdropFilter: CSS.supports("backdrop-filter", "blur(3px)"),
      webkitBackdropFilter: CSS.supports("-webkit-backdrop-filter", "blur(3px)"),
      dvh: CSS.supports("height", "100dvh"),
      aspectRatio: CSS.supports("aspect-ratio", "16 / 9"),
      colorMix: CSS.supports("color", "color-mix(in srgb, red 50%, blue)"),
      hasSelector: CSS.supports("selector(:has(*))"),
    };
    // Audio (S6/A7).
    out.webkitAudioContext = typeof window.webkitAudioContext !== "undefined";
    out.audioContext = typeof window.AudioContext !== "undefined";
    try {
      out.decodeAudioDataArity = AudioContext.prototype.decodeAudioData.length;
      const ctx = new OfflineAudioContext(1, 8000, 8000);
      // WAV PCM 8kHz mono, 0.1s silence — header hợp lệ tối thiểu.
      const n = 800, bytes = new ArrayBuffer(44 + n * 2), dv = new DataView(bytes);
      const wstr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
      wstr(0, "RIFF"); dv.setUint32(4, 36 + n * 2, true); wstr(8, "WAVE"); wstr(12, "fmt ");
      dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, 8000, true); dv.setUint32(28, 16000, true); dv.setUint16(32, 2, true);
      dv.setUint16(34, 16, true); wstr(36, "data"); dv.setUint32(40, n * 2, true);
      const ret = ctx.decodeAudioData(bytes);
      out.decodeAudioDataReturnsPromise = ret && typeof ret.then === "function";
      if (out.decodeAudioDataReturnsPromise) {
        try { const buf = await ret; out.decodeAudioDataResolves = true; out.decodeAudioDataChannels = buf.numberOfChannels; }
        catch (e) { out.decodeAudioDataResolves = false; out.decodeAudioDataError = String(e && e.message || e); }
      } else out.decodeAudioDataResolves = "not-a-promise";
    } catch (e) { out.decodeAudioDataError = "THROW:" + e.message; }
    out.audioWorklet = false;
    try { const ctx = new OfflineAudioContext(1, 8000, 8000); out.audioWorklet = !!ctx.audioWorklet; } catch {}
    // Workers / misc.
    out.moduleWorker = "unknown";
    try {
      const blob = new Blob(["onmessage=()=>postMessage(7)"], { type: "text/javascript" });
      const w = new Worker(URL.createObjectURL(blob), { type: "module" });
      out.moduleWorker = await new Promise((resolve) => {
        const t = setTimeout(() => { try { w.terminate(); } catch {} resolve("timeout-no-reply"); }, 1500);
        w.onmessage = (e) => { clearTimeout(t); try { w.terminate(); } catch {} resolve("ok-reply:" + e.data); };
        w.onerror = (e) => { clearTimeout(t); resolve("error:" + (e.message || "worker-error")); };
        w.postMessage(1);
      });
    } catch (e) { out.moduleWorker = "THROW:" + e.message; }
    out.offscreenCanvas = typeof OffscreenCanvas !== "undefined";
    out.createImageBitmap = typeof createImageBitmap !== "undefined";
    out.requestVideoFrameCallback = typeof v.requestVideoFrameCallback === "function";
    out.getVideoPlaybackQuality = typeof v.getVideoPlaybackQuality === "function";
    out.playsInline = "playsInline" in v;
    out.structuredClone = typeof structuredClone !== "undefined";
    out.randomUUID = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
    out.broadcastChannel = typeof BroadcastChannel !== "undefined";
    out.resizeObserver = typeof ResizeObserver !== "undefined";
    out.navigatorGpu = typeof navigator.gpu !== "undefined";
    out.sharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
    out.mediaSource = typeof MediaSource !== "undefined";
    out.showOpenFilePicker = typeof window.showOpenFilePicker !== "undefined";
    out.clipboard = !!(navigator.clipboard && navigator.clipboard.writeText);
    return out;
  }, { mimes: MIMES, vdConfigs: VIDEO_DECODER_CONFIGS });
}

async function playbackProbe(browser, engineName) {
  const results = {};
  const ctx = await browser.newContext({ acceptDownloads: false });
  const page = await ctx.newPage();
  for (const clip of CLIPS) {
    const fileUrl = "file://" + path.join(CLIPS_DIR, clip);
    const rec = { file: clip, url: fileUrl };
    try {
      await page.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
      const state = await page.evaluate(() => {
        const vid = document.querySelector("video");
        if (!vid) return { videoElement: false, bodyText: document.body ? document.body.innerText.slice(0, 200) : "" };
        return {
          videoElement: true,
          readyState: vid.readyState,
          videoWidth: vid.videoWidth,
          videoHeight: vid.videoHeight,
          duration: vid.duration,
          error: vid.error ? { code: vid.error.code, message: vid.error.message } : null,
          currentSrc: vid.currentSrc,
          networkState: vid.networkState,
        };
      });
      // Đợi thêm tối đa 8s để readyState lên >= 2 hoặc error xuất hiện.
      let waited = state;
      for (let i = 0; i < 16 && waited.videoElement && waited.readyState < 2 && !waited.error; i++) {
        await page.waitForTimeout(500);
        waited = await page.evaluate(() => {
          const vid = document.querySelector("video");
          return {
            videoElement: true,
            readyState: vid.readyState,
            videoWidth: vid.videoWidth,
            videoHeight: vid.videoHeight,
            duration: vid.duration,
            error: vid.error ? { code: vid.error.code, message: vid.error.message } : null,
            currentSrc: vid.currentSrc,
            networkState: vid.networkState,
          };
        });
      }
      rec.result = waited;
      rec.playable = waited.videoElement && waited.readyState >= 2 && !waited.error;
    } catch (e) {
      rec.result = { error: "GOTO-THROW:" + e.message };
      rec.playable = false;
    }
    results[clip] = rec;
  }
  await ctx.close();
  return results;
}

async function runEngine(kind) {
  const t0 = Date.now();
  const browser = kind === "webkit"
    ? await webkit.launch({ headless: true })
    : await chromium.launch({ headless: true });
  const out = { engine: kind, launchedMs: Date.now() - t0, version: browser.version() };
  try {
    const page = await browser.newPage();
    await page.goto("about:blank");
    out.features = await featureProbe(page);
    await page.close();
    out.playback = await playbackProbe(browser, kind);
  } finally {
    await browser.close();
  }
  return out;
}

const results = { measuredAt: new Date().toISOString(), host: { os: os.type() + " " + os.release(), cpus: os.cpus().length, totalMemMiB: Math.round(os.totalmem() / 1048576) }, clipsDir: CLIPS_DIR };
for (const kind of ["webkit", "chromium"]) {
  try {
    results[kind] = await runEngine(kind);
    console.log(`[${kind}] OK — version ${results[kind].version}`);
  } catch (e) {
    results[kind] = { engine: kind, launchError: String(e && e.stack || e) };
    console.log(`[${kind}] LAUNCH/PROBE FAILED: ${e.message}`);
  }
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, "webkit-safari-probe-77e8.json");
writeFileEpermRetry(outPath, JSON.stringify(results, null, 2) + "\n");
console.log("Wrote " + outPath);
