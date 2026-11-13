// webkit_clipd_bitrate_91s3.mjs — Phase 9 đợt 91, luồng S3 (WebKit clip D).
// Nối nợ R3 §6 mục 1/2/4 + LIMITS gộp đợt 90 §4 mục 3:
//  (a) Điểm bitrate thực trong khoảng 1,3–10 MB: clip ~2 Mbps ở 2/4/6/8/10 MB,
//      đo tỉ lệ loop pass + load-play với blob prefetch 8 MiB (production)
//      so với progressive thuần.
//  (b) Chẩn đoán tầng khi blob-load fail ở file lớn: bundle probe-only với
//      ngưỡng 16 MiB (esbuild plugin thay literal trong media.ts, KHÔNG
//      sửa source production) + GST_DEBUG_FILE, chạy clip c10 10 MB qua blob.
//  (d) Chứng minh error handler đổi src trong probe: proxyUrl = bad.mp4
//      (byte rác, fetch OK -> blob -> element error) + url = c2.mp4 thật;
//      ghi lại dòng thời gian đổi src, kỳ vọng cuối src = http c2 và play OK.
//
// Clip tại ~/workspace/round91-s3/clips/ (sinh lại được, KHÔNG stage binary).
// Server HTTP range-support port 8899. WebKitGTK 27.2 headed, Xvfb :199.
// Chạy: DISPLAY=:199 GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
//   node benchmarks/render/webkit_clipd_bitrate_91s3.mjs <MODE> [RUNS]
// MODE: L2|L4|L6|L8|L10 (load 8 s, blob vs progressive — chạy cả 2),
//       LOOP2|LOOP4|LOOP6|LOOP8 (loop rút gọn), ERR (error-handler), DBG (GST_DEBUG),
//       ALL (mặc định L4, RUNS mặc định 1).
// Kết quả append vào benchmarks/results/webkit-clipd-bitrate-91s3.json.
// Pass loop = đủ target vòng ended, không stall >= 1,5 s (như Q6/R3).
// Pass load = play() OK + frames > 0 + ct tiến tới ~8 s trong 8 s đo.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const esbuild = req("/home/hatch/workspace/repo-1/node_modules/esbuild");
const browserType = pw.webkit;
const CLIP_DIR = "/home/hatch/workspace/round91-s3/clips";
const BUNDLE_DIR = "/home/hatch/workspace/round91-s3/bundle";
const PORT = 8899;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-clipd-bitrate-91s3.json");
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MIME = { ".mp4": "video/mp4", ".js": "text/javascript", ".html": "text/html" };
fs.mkdirSync(BUNDLE_DIR, { recursive: true });

// Bundle production (ngưỡng 8 MiB thật). Bundle DBG: ngưỡng 16 MiB chỉ
// để chẩn đoán — thay literal bằng esbuild plugin, source repo không đổi.
async function buildBundle(maxBytes, outName) {
  const isDbg = maxBytes !== 8 * 1024 * 1024;
  const plugin = isDbg ? {
    name: "raise-blob-threshold-probe-only",
    setup(build) {
      build.onLoad({ filter: /[/\\]media\.ts$/ }, async (args) => {
        let text = await fs.promises.readFile(args.path, "utf8");
        const before = text.includes("8 * 1024 * 1024");
        text = text.replace("export const BLOB_PREFETCH_MAX_BYTES = 8 * 1024 * 1024;",
          "export const BLOB_PREFETCH_MAX_BYTES = 16 * 1024 * 1024;");
        if (!before || !text.includes("16 * 1024 * 1024")) throw new Error("không thay được literal ngưỡng trong media.ts");
        return { contents: text, loader: "ts", resolveDir: path.dirname(args.path) };
      });
    },
  } : null;
  await esbuild.build({
    entryPoints: [path.join(REPO_ROOT, "benchmarks/render/webkit-blob-prefetch-entry.ts")],
    bundle: true, format: "iife", platform: "browser",
    outfile: path.join(BUNDLE_DIR, outName),
    plugins: plugin ? [plugin] : [],
    logLevel: "silent",
  });
  console.log("BUNDLE OK", outName, isDbg ? "(probe-only 16 MiB)" : "(production 8 MiB)");
}
await buildBundle(8 * 1024 * 1024, "media-pool-bundle.js");
await buildBundle(16 * 1024 * 1024, "media-pool-bundle-16mib.js");

const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
  if (p === "/media-pool-bundle.js" || p === "/media-pool-bundle-16mib.js") {
    rs.writeHead(200, { "Content-Type": "text/javascript" });
    fs.createReadStream(path.join(BUNDLE_DIR, path.basename(p))).pipe(rs);
    return;
  }
  const f = path.join(CLIP_DIR, path.basename(p));
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
  const st = fs.statSync(f);
  const range = rq.headers.range;
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    const start = m ? +m[1] : 0;
    const end = m && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
    rs.writeHead(206, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    fs.createReadStream(f, { start, end }).pipe(rs);
  } else {
    rs.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Accept-Ranges": "bytes", "Content-Length": st.size });
    fs.createReadStream(f).pipe(rs);
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}`;

const CLIPS = {
  c2: { file: "c2.mp4", dur: 8 }, c4: { file: "c4.mp4", dur: 16 },
  c6: { file: "c6.mp4", dur: 24 }, c8: { file: "c8.mp4", dur: 32 },
  c10: { file: "c10.mp4", dur: 40 },
};
for (const c of Object.values(CLIPS)) { try { c.bytes = fs.statSync(path.join(CLIP_DIR, c.file)).size; } catch { c.bytes = null; } }
// Loop rút gọn theo độ dài clip (đủ dài để thấy stall, không kéo lượt quá lâu).
const LOOP_TARGET = { c2: 5, c4: 3, c6: 2, c8: 2 };

function withTimeout(p, ms, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(label + "-timeout-" + ms + "ms")), ms); });
  try { return Promise.race([p, to]); } finally { clearTimeout(timer); }
}

async function launchBrowser(extraEnv) {
  return withTimeout(browserType.launch({ headless: false,
    env: { ...process.env, ...(extraEnv || {}) } }), 60000, "launch");
}

// Page-eval chung: tạo element (pool blob hoặc progressive thuần), chờ blob
// tối đa waitBlobMs (0 = play ngay, đo swap-trượt), play, lấy mẫu 100 ms.
// opts: { pool, bundle, clipUrl, proxyUrl, knownSize, duration, wallMs,
//         waitBlobMs, playSeconds (load-mode), targetLoops (loop-mode),
//         traceSrc (ghi dòng thời gian src), errProbe (mode ERR) }
async function runPage(opts) {
  const browser = await launchBrowser(opts.gstDebugFile ? {
    GST_DEBUG: "playbin:5,uridecodebin:5,qtdemux:5,decodebin:5,avidemux:5",
    GST_DEBUG_FILE: opts.gstDebugFile, GST_DEBUG_NO_COLOR: "1",
  } : null);
  try {
    const page = await withTimeout(browser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "newPage");
    try {
      await withTimeout(page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
      if (opts.pool) {
        await withTimeout(page.addScriptTag({ url: `${BASE}/${opts.bundle || "media-pool-bundle.js"}` }), 30000, "addScriptTag");
        const hasPool = await page.evaluate(() => typeof window.__MediaPool);
        if (hasPool !== "function") throw new Error("MediaPool bundle không load được: typeof=" + hasPool);
      }
      return await page.evaluate(async (o) => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const kindOf = (s) => s.startsWith("blob:") ? "blob" : (s.startsWith("http") ? "http" : (s || "empty"));
        let v, pool = null, item = null, blobReadyMs = null, srcAtPlay = null, poolInfoMode = null;
        const srcTrace = [];
        const errEvents = [];
        const trace = () => { try { srcTrace.push({ t: +((performance.now() - t0) / 1000).toFixed(2), src: kindOf(v.src), ct: +v.currentTime.toFixed(2) }); } catch {} };
        const t0 = performance.now();
        if (o.pool) {
          pool = new window.__MediaPool();
          item = { id: "m-s3", name: o.clipFile, kind: "video", url: o.clipUrl, duration: o.duration, proxyUrl: o.proxyUrl, proxySizeBytes: o.knownSize };
          v = pool.videoFor(item);
          v.muted = true;
          document.body.appendChild(v);
          trace();
          const tW0 = performance.now();
          while (performance.now() - tW0 < o.waitBlobMs) {
            if (v.src.startsWith("blob:")) { blobReadyMs = Math.round(performance.now() - tW0); break; }
            let info = null;
            try { info = pool.blobPrefetchInfo(item); } catch {}
            if (info && info.mode === "skipped") break;
            await sleep(25);
          }
          srcAtPlay = kindOf(v.src);
          try { poolInfoMode = pool.blobPrefetchInfo(item).mode; } catch {}
          trace();
        } else {
          v = document.createElement("video");
          v.muted = true; v.playsInline = true; v.preload = "auto";
          v.src = o.clipUrl;
          document.body.appendChild(v);
          srcAtPlay = "http";
          trace();
        }
        v.addEventListener("error", () => { errEvents.push({ t: +((performance.now() - t0) / 1000).toFixed(2), src: kindOf(v.src), code: v.error ? v.error.code : null, msg: v.error ? v.error.message : null }); trace(); });
        v.addEventListener("emptied", () => trace());
        // Chẩn đoán S3: ghi mọi chuyển trạng thái phát để biết vì sao
        // play() resolve mà ct vẫn 0 (pause lạ / waiting / suspend).
        const evs = [];
        for (const en of ["playing", "pause", "waiting", "stalled", "suspend", "canplay", "canplaythrough", "loadeddata", "loadstart", "progress", "seeking", "seeked"]) {
          v.addEventListener(en, () => evs.push(`${en}@${+((performance.now() - t0) / 1000).toFixed(2)}`));
        }
        const endedAt = [];
        const resumeMs = [];
        let seekedCount = 0, restarts = 0;
        v.addEventListener("seeked", () => seekedCount++);
        const samples = [];
        let playErr = null;
        let pollTimer = null;
        if (o.traceSrc) {
          pollTimer = setInterval(() => {
            const k = kindOf(v.src);
            const last = srcTrace[srcTrace.length - 1];
            if (!last || last.src !== k) trace();
          }, 50);
        }
        if (o.targetLoops) {
          v.addEventListener("ended", () => {
            const t = performance.now();
            endedAt.push(+t.toFixed(1));
            restarts++;
            v.currentTime = 0;
            const p = v.play(); if (p) p.catch(() => {});
            const tick = () => {
              if (v.currentTime > 0.1 && !v.paused) resumeMs.push(+(performance.now() - t).toFixed(1));
              else if (performance.now() - t < 5000) requestAnimationFrame(tick);
              else resumeMs.push(null);
            };
            requestAnimationFrame(tick);
          });
        }
        // Chẩn đoán race: PLAY_DELAY_MS trì hoãn play() sau khi blob sẵn
        // (mặc định 0 = play ngay như R3). Ghi lại để phân biệt trong JSON.
        let playDelayAppliedMs = 0;
        if (o.playDelayMs) { playDelayAppliedMs = o.playDelayMs; await sleep(o.playDelayMs); }
        let playErr2 = null;
        let retriedPlay = false;
        try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
        catch (e) { playErr = String(e && e.message); }
        if (o.retryPlay && playErr) {
          retriedPlay = true;
          await sleep(500);
          try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
          catch (e) { playErr2 = String(e && e.message); }
        }
        trace();
        const wallMs = o.wallMs;
        while (performance.now() - t0 < wallMs) {
          let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
          let buf = [];
          try { for (let i = 0; i < v.buffered.length; i++) buf.push([+v.buffered.start(i).toFixed(3), +v.buffered.end(i).toFixed(3)]); } catch {}
          samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState, dur: +v.duration.toFixed(3), buf, frames: q ? q.totalVideoFrames : null });
          if (o.targetLoops && endedAt.length >= o.targetLoops && v.currentTime > 0.5 && !v.paused) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        if (pollTimer) clearInterval(pollTimer);
        let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
        if (pool && item) { try { poolInfoMode = pool.blobPrefetchInfo(item).mode; } catch {} }
        trace();
        const out = { srcAtPlay, blobReadyMs, poolInfoMode, playErr, playErr2, retriedPlay, playDelayAppliedMs, evs, samples, endedAt, resumeMs, seekedCount, restarts,
          quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
          finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended,
          finalSrcKind: kindOf(v.src), srcTrace: o.traceSrc ? srcTrace : undefined, errEvents };
        v.pause(); v.remove(); v.src = "";
        return out;
      }, opts, { timeout: (opts.wallMs || 60000) + 90000 });
    } finally { try { await withTimeout(page.close(), 15000, "pageClose"); } catch {} }
  } finally { try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {} }
}

function summarizeLoop(raw, targetLoops) {
  const ended = raw.endedAt ? raw.endedAt.length : 0;
  const med = (a) => a.length ? +a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)].toFixed(1) : null;
  const stalls = [];
  let runStart = null;
  for (let i = 1; i < raw.samples.length; i++) {
    const s = raw.samples[i], p = raw.samples[i - 1];
    const frozen = Math.abs(s.ct - p.ct) < 0.0015 && !s.paused && !s.ended && !s.seeking;
    if (frozen && runStart === null) runStart = p;
    if ((!frozen || i === raw.samples.length - 1) && runStart !== null) {
      const dur = s.t - runStart.t;
      if (dur >= 1.5) stalls.push({ fromT: runStart.t, durS: +dur.toFixed(2), ct: runStart.ct });
      runStart = null;
    }
  }
  return { loopsCompleted: ended, targetLoops, pass: ended >= targetLoops && stalls.length === 0,
    resumeMsMedian: med((raw.resumeMs || []).filter((x) => x !== null)),
    resumeNull: (raw.resumeMs || []).filter((x) => x === null).length,
    seekedCount: raw.seekedCount, totalFrames: raw.quality ? raw.quality.total : null,
    droppedFrames: raw.quality ? raw.quality.dropped : null, stalls,
    srcAtPlay: raw.srcAtPlay, blobReadyMs: raw.blobReadyMs, poolInfoMode: raw.poolInfoMode,
    finalSrcKind: raw.finalSrcKind, playErr: raw.playErr, finalCt: raw.finalCt,
    finalPaused: raw.finalPaused, finalEnded: raw.finalEnded,
    wallS: raw.samples.length ? raw.samples[raw.samples.length - 1].t : 0 };
}

function summarizeLoad(raw) {
  const played = raw.quality && raw.quality.total > 0 && !raw.playErr;
  return { srcAtPlay: raw.srcAtPlay, blobReadyMs: raw.blobReadyMs, poolInfoMode: raw.poolInfoMode,
    playDelayAppliedMs: raw.playDelayAppliedMs ?? 0,
    playOk: !!played, playErr: raw.playErr, totalFrames: raw.quality ? raw.quality.total : null,
    droppedFrames: raw.quality ? raw.quality.dropped : null, finalCt: raw.finalCt,
    finalPaused: raw.finalPaused, finalSrcKind: raw.finalSrcKind,
    ctReached: raw.samples.length ? raw.samples[raw.samples.length - 1].ct : null,
    evs: raw.evs || [], firstSample: raw.samples.length ? raw.samples[0] : null,
    lastSample: raw.samples.length ? raw.samples[raw.samples.length - 1] : null };
}

const results = { date: new Date().toISOString(), round: "phase9-round91-s3", clips: CLIPS, cases: [], env: {} };
let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); if (prev && Array.isArray(prev.cases)) results.cases = prev.cases; } catch {}
// ENV probe trên browser riêng.
try {
  const envBrowser = await launchBrowser(null);
  try {
    const probePage = await withTimeout(envBrowser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "envNewPage");
    try {
      await withTimeout(probePage.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "envGoto");
      results.env.userAgent = await probePage.evaluate(() => navigator.userAgent);
      results.env.mediaRecorder = await probePage.evaluate(() => typeof MediaRecorder);
      results.env.hardwareConcurrency = await probePage.evaluate(() => navigator.hardwareConcurrency);
      results.env.deviceMemory = await probePage.evaluate(() => navigator.deviceMemory);
      try { const fs2 = await import("node:fs"); const up = fs2.readFileSync("/proc/uptime", "utf8").split(" ")[0]; results.env.uptimeS = +up; } catch {}
      try { const la = (await import("node:os")).loadavg(); results.env.loadavg = la.map((x) => +x.toFixed(2)); } catch {}
    } finally { try { await withTimeout(probePage.close(), 15000, "envPageClose"); } catch {} }
  } finally { try { await withTimeout(envBrowser.close(), 15000, "browserClose"); } catch {} }
} catch (e) { results.env.probeErr = String(e && e.message); }
console.log("ENV", JSON.stringify(results.env));
console.log("CLIPS", JSON.stringify(CLIPS));

async function pushCase(name, sum) {
  results.cases.push({ name, date: new Date().toISOString(), ...sum });
  console.log(name, JSON.stringify(sum));
  await writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
}

const rawWhich = (process.argv[2] || "L4").trim();
const runs = Math.max(1, parseInt(process.argv[3] || "1", 10));
const startIdx = Math.max(1, parseInt(process.env.Q6_START || "1", 10));

async function doLoad(clipKey, usePool, runIdx, extra) {
  const c = CLIPS[clipKey];
  const wallMs = 10000;
  const raw = await runPage({ pool: usePool, bundle: extra?.bundle, clipFile: c.file,
    clipUrl: `${BASE}/${c.file}`, proxyUrl: `${BASE}/${c.file}`, knownSize: c.bytes,
    duration: c.dur, wallMs, waitBlobMs: usePool ? 15000 : 0, traceSrc: !!extra?.traceSrc,
    playDelayMs: Number(process.env.PLAY_DELAY_MS || 0) || 0,
    gstDebugFile: extra?.gstDebugFile || (process.env.GST_DEBUG_LOAD
      ? `/home/hatch/workspace/round91-s3/gst-debug-${clipKey}-${usePool ? "blob" : "prog"}-run${runIdx}.log` : undefined) });
  return { mode: usePool ? "blob" : "progressive", clip: c.file, clipBytes: c.bytes, clipDurS: c.dur,
    playDelayMs: Number(process.env.PLAY_DELAY_MS || 0) || 0,
    gstDebugFile: extra?.gstDebugFile || (process.env.GST_DEBUG_LOAD
      ? `/home/hatch/workspace/round91-s3/gst-debug-${clipKey}-${usePool ? "blob" : "prog"}-run${runIdx}.log` : undefined),
    run: runIdx, ...summarizeLoad(raw), srcTrace: raw.srcTrace, errEvents: raw.errEvents };
}

async function doLoop(clipKey, usePool, runIdx) {
  const c = CLIPS[clipKey];
  const target = LOOP_TARGET[clipKey];
  const wallMs = Math.ceil(c.dur * target * 1000 * 1.6 + 10000);
  const raw = await runPage({ pool: usePool, clipFile: c.file,
    clipUrl: `${BASE}/${c.file}`, proxyUrl: `${BASE}/${c.file}`, knownSize: c.bytes,
    duration: c.dur, wallMs, waitBlobMs: usePool ? 15000 : 0, targetLoops: target });
  return { mode: usePool ? "blob" : "progressive", clip: c.file, clipBytes: c.bytes, clipDurS: c.dur,
    run: runIdx, ...summarizeLoop(raw, target) };
}

// (d) ERR: proxy = bad.mp4 (byte rác), url = c2.mp4 thật. Kỳ vọng: fetch OK
// -> blob -> element error trên blob -> handler thu hồi blob + đổi src về
// http c2 -> play OK, frames > 0. Ghi srcTrace + errEvents đầy đủ.
async function doErr(runIdx) {
  const c = CLIPS.c2;
  const raw = await runPage({ pool: true, clipFile: c.file, clipUrl: `${BASE}/${c.file}`,
    proxyUrl: `${BASE}/bad.mp4`, knownSize: 80000, duration: c.dur, wallMs: 12000,
    waitBlobMs: 15000, traceSrc: true, retryPlay: process.env.RETRY_PLAY === "1" });
  const played = raw.quality && raw.quality.total > 0 && !raw.playErr;
  const playedAfterRetry = raw.quality && raw.quality.total > 0 && raw.playErr && !raw.playErr2;
  return { mode: "err-handler", clip: "bad.mp4->c2.mp4", run: runIdx,
    srcAtPlay: raw.srcAtPlay, blobReadyMs: raw.blobReadyMs, poolInfoMode: raw.poolInfoMode,
    playOk: !!played, playErr: raw.playErr, retriedPlay: raw.retriedPlay, playErr2: raw.playErr2,
    playedAfterRetry: !!playedAfterRetry, totalFrames: raw.quality ? raw.quality.total : null,
    finalCt: raw.finalCt, finalSrcKind: raw.finalSrcKind, srcTrace: raw.srcTrace, errEvents: raw.errEvents };
}

// (b) DBG: c10 qua blob với bundle ngưỡng 16 MiB + GST_DEBUG_FILE.
async function doDbg(runIdx) {
  const c = CLIPS.c10;
  const dbgFile = `/home/hatch/workspace/round91-s3/gst-debug-c10-blob-run${runIdx}.log`;
  try { fs.unlinkSync(dbgFile); } catch {}
  const raw = await runPage({ pool: true, bundle: "media-pool-bundle-16mib.js", clipFile: c.file,
    clipUrl: `${BASE}/${c.file}`, proxyUrl: `${BASE}/${c.file}`, knownSize: c.bytes,
    duration: c.dur, wallMs: 12000, waitBlobMs: 20000, traceSrc: true, gstDebugFile: dbgFile });
  let dbgBytes = 0; try { dbgBytes = fs.statSync(dbgFile).size; } catch {}
  return { mode: "dbg-blob16", clip: c.file, clipBytes: c.bytes, clipDurS: c.dur, run: runIdx,
    gstDebugFile: dbgFile, gstDebugBytes: dbgBytes, ...summarizeLoad(raw),
    srcTrace: raw.srcTrace, errEvents: raw.errEvents };
}

const key = rawWhich.toUpperCase();
const clipKeyOf = (d) => (CLIPS["c" + d] ? "c" + d : null);
if (key.startsWith("L") && clipKeyOf(key.slice(1).toLowerCase())) {
  const ck = clipKeyOf(key.slice(1).toLowerCase());
  for (let i = startIdx; i < startIdx + runs; i++) {
    try { await pushCase(`L${ck}-blob-run${i}`, await doLoad(ck, true, i)); }
    catch (e) { await pushCase(`L${ck}-blob-run${i}`, { mode: "blob", clip: CLIPS[ck].file, run: i, runError: String(e && e.message).slice(0, 200) }); }
    try { await pushCase(`L${ck}-prog-run${i}`, await doLoad(ck, false, i)); }
    catch (e) { await pushCase(`L${ck}-prog-run${i}`, { mode: "progressive", clip: CLIPS[ck].file, run: i, runError: String(e && e.message).slice(0, 200) }); }
  }
} else if (key.startsWith("LOOP") && clipKeyOf(key.slice(4).toLowerCase())) {
  const ck = clipKeyOf(key.slice(4).toLowerCase());
  for (let i = startIdx; i < startIdx + runs; i++) {
    try { await pushCase(`LOOP${ck}-blob-run${i}`, await doLoop(ck, true, i)); }
    catch (e) { await pushCase(`LOOP${ck}-blob-run${i}`, { mode: "blob", clip: CLIPS[ck].file, run: i, runError: String(e && e.message).slice(0, 200) }); }
    try { await pushCase(`LOOP${ck}-prog-run${i}`, await doLoop(ck, false, i)); }
    catch (e) { await pushCase(`LOOP${ck}-prog-run${i}`, { mode: "progressive", clip: CLIPS[ck].file, run: i, runError: String(e && e.message).slice(0, 200) }); }
  }
} else if (key === "ERR") {
  for (let i = startIdx; i < startIdx + runs; i++) {
    try { await pushCase(`ERR-run${i}`, await doErr(i)); }
    catch (e) { await pushCase(`ERR-run${i}`, { mode: "err-handler", run: i, runError: String(e && e.message).slice(0, 200) }); }
  }
} else if (key === "DBG") {
  for (let i = startIdx; i < startIdx + runs; i++) {
    try { await pushCase(`DBG-run${i}`, await doDbg(i)); }
    catch (e) { await pushCase(`DBG-run${i}`, { mode: "dbg-blob16", run: i, runError: String(e && e.message).slice(0, 200) }); }
  }
} else if (key === "ALL") {
  // Lần lượt các cỡ load (blob+prog) — loop chạy riêng sau để kiểm soát thời gian.
  for (const ck of ["c2", "c4", "c6", "c8", "c10"]) {
    for (let i = 1; i <= runs; i++) {
      try { await pushCase(`L${ck}-blob-run${i}`, await doLoad(ck, true, i)); }
      catch (e) { await pushCase(`L${ck}-blob-run${i}`, { mode: "blob", clip: CLIPS[ck].file, run: i, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-prog-run${i}`, await doLoad(ck, false, i)); }
      catch (e) { await pushCase(`L${ck}-prog-run${i}`, { mode: "progressive", clip: CLIPS[ck].file, run: i, runError: String(e && e.message).slice(0, 200) }); }
    }
  }
} else {
  console.error("MODE không rõ:", rawWhich, "(L2|L4|L6|L8|L10|LOOP2|LOOP4|LOOP6|LOOP8|ERR|DBG|ALL)");
  process.exit(2);
}
server.close();
console.log("DONE", OUT);
