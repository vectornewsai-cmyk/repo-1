// webkit_blob_flaky_97y1_w1light.mjs — Phase 9 đợt 97, luồng Y1(a): copy Y NGUYEN probe W1/X1b (GST nhe), chi doi OUT/bundle/GST/port/ten case.
// ĐO LẠI + PHÂN LOẠI blob-load flaky (nợ LIMITS gộp đợt 93 §4 mục 9) và
// ĐO ĐỐI CHỨNG biến thể probe-only "preload-none" (không cho pipeline http
// preload trước khi blob sẵn — hướng sửa S3 §2, chưa từng đo đối chứng).
// Dựa trên probe U2 (webkit_flipflop_counter_93u2_bundle.mjs), khác biệt:
//  (1) gắn mọi media-event listener NGAY sau videoFor (trước vòng chờ blob)
//      — probe U2 gắn sau vòng chờ nên mất mọi event lúc swap;
//  (2) ghi thời điểm swap http->blob + readyState/networkState lúc swap +
//      http đã loadstart/progress/loadeddata trước swap hay chưa;
//  (3) biến thể bundle probe-only: prod (preload auto) vs preload-none
//      (esbuild plugin thay `el.preload = "auto"` trong media.ts — source
//      production KHÔNG đổi); mode MATRIX chạy xen kẽ A/B từng run để
//      khử nhiễu tải; (4) GST_DEBUG cho mọi run blob; (5) loadavg +
//      MemAvailable ghi theo từng case.
// Kết quả append vào benchmarks/results/webkit-blob-flaky-94v3.json.
// Clip tại ~/workspace/round91-s3/clips/. Server HTTP range-support port 8897.
// WebKitGTK 27.2 headed, Xvfb :199.
// Chạy: DISPLAY=:199 GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
//   GST_DEBUG_BLOB=1 node benchmarks/render/webkit_blob_flaky_94v3.mjs MATRIX [RUNS]
// MATRIX: load-play L2/L4/L6/L8, mỗi run: blob-A, blob-B, prog (xen kẽ).
// LOOPMATRIX: loop rút gọn, mỗi clip 1 run: blob-A, blob-B, prog.
// L2|L4|L6|L8 (load 8 s, blob vs progressive — chạy cả 2),
// LOOP2|LOOP4|LOOP6|LOOP8 (loop rút gọn), ALL (L2/L4/L6/L8/L10).
// Pass loop = đủ target vòng ended, không stall >= 1,5 s (như Q6/R3).
// Pass load = play() OK + frames > 0 + ct tiến tới ~8 s trong 8 s đo.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const esbuild = req("/home/hatch/workspace/repo-1/node_modules/esbuild");
const browserType = pw.webkit;
const CLIP_DIR = "/home/hatch/workspace/round96-x1/clips-faststart";
const BUNDLE_DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y1/a-light/bundle";
const GST_DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y1/a-light/gst";
const PORT = 8901;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-blob-flaky-97y1-w1light.json");
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MIME = { ".mp4": "video/mp4", ".js": "text/javascript", ".html": "text/html" };
fs.mkdirSync(BUNDLE_DIR, { recursive: true });
fs.mkdirSync(GST_DIR, { recursive: true });

// Bundle production (ngưỡng 8 MiB thật) + biến thể probe-only preload-none
// (esbuild plugin thay `el.preload = "auto"` trong media.ts lúc bundle,
// source production KHÔNG đổi): element không preload http trước khi blob
// sẵn → swap http->blob diễn ra trên element chưa từng load gì.
async function buildBundle(maxBytes, outName, variant) {
  const isDbg = maxBytes !== 8 * 1024 * 1024;
  const plugins = [];
  if (isDbg) {
    plugins.push({
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
    });
  }
  if (variant === "preload-none") {
    plugins.push({
      name: "preload-none-probe-only",
      setup(build) {
        build.onLoad({ filter: /[/\\]media\.ts$/ }, async (args) => {
          const text = await fs.promises.readFile(args.path, "utf8");
          // Chi doi preload cua <video> trong videoFor (audioFor o sau
          // cung co `el.preload = "auto"` — giu nguyen, khong lien quan).
          const needle = "el = document.createElement(\"video\");\n      el.preload = \"auto\";";
          const count = text.split(needle).length - 1;
          if (count !== 1) throw new Error(`preload-none: ky vong dung 1 lan video preload auto trong media.ts, thay ${count}`);
          return { contents: text.replace(needle, "el = document.createElement(\"video\");\n      el.preload = \"none\";"), loader: "ts", resolveDir: path.dirname(args.path) };
        });
      },
    });
  }
  if (variant === "reset-swap") {
    plugins.push({
      name: "reset-swap-probe-only",
      setup(build) {
        build.onLoad({ filter: /[/\\]media\.ts$/ }, async (args) => {
          const text = await fs.promises.readFile(args.path, "utf8");
          // F2: truoc khi gan blob, removeAttribute + load() de teardown
          // pipeline http cu mot cach dong bo, roi moi gan blob.
          const needle = "el.dataset.srcKey = blobUrl;\n        el.src = blobUrl;";
          const count = text.split(needle).length - 1;
          if (count !== 1) throw new Error(`reset-swap: ky vong dung 1 lan gan blobUrl trong media.ts, thay ${count}`);
          return { contents: text.replace(needle, "el.dataset.srcKey = blobUrl;\n        el.removeAttribute(\"src\");\n        el.load();\n        el.src = blobUrl;"), loader: "ts", resolveDir: path.dirname(args.path) };
        });
      },
    });
  }
  if (variant === "fresh-element") {
    plugins.push({
      name: "fresh-element-probe-only",
      setup(build) {
        build.onLoad({ filter: /[/\\]media\.ts$/ }, async (args) => {
          const text = await fs.promises.readFile(args.path, "utf8");
          // F4: thay vi swap src tren element dang song, drop element cu
          // roi tao element MOI voi blob da cache lam src DAU TIEN.
          const needle = "      if (MediaPool.isPristineForBlobSwap(el)) {\n        latch.src = blobUrl;\n        latch.blob = true;\n        el.dataset.srcKey = blobUrl;\n        el.src = blobUrl;\n      }";
          const count = text.split(needle).length - 1;
          if (count !== 1) throw new Error(`fresh-element: ky vong dung 1 lan khoi upgrade prefetch trong media.ts, thay ${count}`);
          const repl = "      if (MediaPool.isPristineForBlobSwap(el)) {\n        const it = this.videoItems.get(item.id);\n        if (it) {\n          this.dropElement(el);\n          const el2 = this.videoFor(it);\n          if (el2) { el2.muted = true; document.body.appendChild(el2); }\n        }\n      }";
          return { contents: text.replace(needle, repl), loader: "ts", resolveDir: path.dirname(args.path) };
        });
      },
    });
  }
  await esbuild.build({
    entryPoints: [path.join(REPO_ROOT, "benchmarks/render/webkit-blob-prefetch-entry.ts")],
    bundle: true, format: "iife", platform: "browser",
    outfile: path.join(BUNDLE_DIR, outName),
    plugins,
    logLevel: "silent",
  });
  console.log("BUNDLE OK", outName, isDbg ? "(probe-only 16 MiB)" : (variant && variant !== "prod" ? "(probe-only " + variant + ")" : "(production 8 MiB)"));
}
await buildBundle(8 * 1024 * 1024, "media-pool-bundle.js");
await buildBundle(8 * 1024 * 1024, "media-pool-bundle-preload-none.js", "preload-none");
await buildBundle(8 * 1024 * 1024, "media-pool-bundle-reset-swap.js", "reset-swap");
await buildBundle(8 * 1024 * 1024, "media-pool-bundle-fresh-element.js", "fresh-element");

const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
  if (p.startsWith("/media-pool-bundle") && p.endsWith(".js")) {
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
  c2: { file: "c2.mp4", dur: 8 }, c8: { file: "c8.mp4", dur: 32 },
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
        // V3 — phân loại: ghi swap + trạng thái element lúc swap + event http
        // trước swap. Probe U2 gắn listener SAU vòng chờ blob nên mất hết
        // event lúc swap — đây là lỗ đo phải vá để phân loại nguyên nhân.
        let swapMs = null, swapRs = null, swapNs = null, swapPaused = null, swapCt = null, swapSeeking = null;
        let httpLoadstartBeforeSwap = false, httpProgressBeforeSwap = false;
        let httpLoadedBeforeSwap = false, httpLoadedMetaBeforeSwap = false;
        let playCalledMs = null;
        const srcTrace = [];
        const errEvents = [];
        const evs = [];
        const stateOf = () => { try { return { rs: v.readyState, ns: v.networkState, ct: +v.currentTime.toFixed(2), paused: v.paused, seeking: v.seeking }; } catch { return {}; } };
        const trace = () => { try { const st = stateOf(); srcTrace.push({ t: +((performance.now() - t0) / 1000).toFixed(2), src: kindOf(v.src), ct: st.ct, rs: st.rs, ns: st.ns }); } catch {} };
        const t0 = performance.now();
        // Gắn listener TRƯỚC vòng chờ blob để bắt event lúc swap.
        const attachListeners = () => {
          for (const en of ["playing", "pause", "waiting", "stalled", "suspend", "canplay", "canplaythrough", "loadedmetadata", "loadeddata", "loadstart", "progress", "seeking", "seeked", "emptied", "abort"]) {
            v.addEventListener(en, () => {
              const st = stateOf();
              evs.push({ e: en, t: +((performance.now() - t0) / 1000).toFixed(2), rs: st.rs, ns: st.ns, ct: st.ct });
              // Chi dem event TRUOC swap: sau swap, error handler co the dua src
              // ve http (fallback) — event cua pipeline fallback khong duoc
              // tinh la "http truoc swap" (loi phan loai o run 1).
              if (kindOf(v.src) === "http" && swapMs === null) {
                if (en === "loadstart") httpLoadstartBeforeSwap = true;
                if (en === "progress") httpProgressBeforeSwap = true;
                if (en === "loadeddata") httpLoadedBeforeSwap = true;
                if (en === "loadedmetadata") httpLoadedMetaBeforeSwap = true;
              }
              if (en === "emptied") trace();
            });
          }
          v.addEventListener("error", () => { const st = stateOf(); errEvents.push({ t: +((performance.now() - t0) / 1000).toFixed(2), src: kindOf(v.src), code: v.error ? v.error.code : null, msg: v.error ? v.error.message : null, rs: st.rs, ns: st.ns }); trace(); });
        };
        if (o.pool) {
          pool = new window.__MediaPool();
          item = { id: "m-s3", name: o.clipFile, kind: "video", url: o.clipUrl, duration: o.duration, proxyUrl: o.proxyUrl, proxySizeBytes: o.knownSize };
          if (o.directBlob) {
            // E probe-only: fetch truoc, blob lam src DAU TIEN (khong http, khong swap).
            const _buf = await (await fetch(o.proxyUrl)).arrayBuffer();
            const _burl = URL.createObjectURL(new Blob([_buf], { type: "video/mp4" }));
            item.proxyUrl = _burl;
            item.proxySizeBytes = _buf.byteLength;
          }
          v = pool.videoFor(item);
          v.muted = true;
          document.body.appendChild(v);
          attachListeners();
          trace();
          const tW0 = performance.now();
          while (performance.now() - tW0 < o.waitBlobMs) {
            if (o.variant === "fresh-element") {
              try { const cur = pool.videoFor(item); if (cur && cur !== v) { v = cur; attachListeners(); trace(); } } catch {}
            }
            if (swapMs === null && v.src.startsWith("blob:")) {
              const st = stateOf();
              swapMs = Math.round(performance.now() - tW0);
              blobReadyMs = swapMs;
              swapRs = st.rs; swapNs = st.ns; swapPaused = st.paused; swapCt = st.ct; swapSeeking = st.seeking;
              trace();
            }
            if (v.src.startsWith("blob:")) break;
            let info = null;
            try { info = pool.blobPrefetchInfo(item); } catch {}
            if (info && info.mode === "skipped") break;
            await sleep(10);
          }
          srcAtPlay = kindOf(v.src);
          try { poolInfoMode = pool.blobPrefetchInfo(item).mode; } catch {}
          trace();
        } else {
          v = document.createElement("video");
          v.muted = true; v.playsInline = true; v.preload = "auto";
          v.src = o.clipUrl;
          document.body.appendChild(v);
          attachListeners();
          srcAtPlay = "http";
          trace();
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
        playCalledMs = Math.round(performance.now() - t0);
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
          variant: o.variant || "prod", swapMs, swapRs, swapNs, swapPaused, swapCt, swapSeeking,
          httpLoadstartBeforeSwap, httpProgressBeforeSwap, httpLoadedMetaBeforeSwap, httpLoadedBeforeSwap, playCalledMs, directBlob: !!o.directBlob,
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
    swapMs: raw.swapMs ?? null, swapRs: raw.swapRs ?? null, swapNs: raw.swapNs ?? null,
    httpLoadstartBeforeSwap: !!raw.httpLoadstartBeforeSwap, httpProgressBeforeSwap: !!raw.httpProgressBeforeSwap,
    httpLoadedMetaBeforeSwap: !!raw.httpLoadedMetaBeforeSwap, httpLoadedBeforeSwap: !!raw.httpLoadedBeforeSwap,
    playCalledMs: raw.playCalledMs ?? null,
    wallS: raw.samples.length ? raw.samples[raw.samples.length - 1].t : 0,
    srcTrace: raw.srcTrace, errEvents: raw.errEvents };
}

function summarizeLoad(raw) {
  const played = raw.quality && raw.quality.total > 0 && !raw.playErr;
  const failKind = played ? "ok"
    : (raw.errEvents && raw.errEvents.length ? "error-event"
    : (raw.playErr && String(raw.playErr).includes("timeout") ? "stall-timeout" : "other"));
  return { srcAtPlay: raw.srcAtPlay, blobReadyMs: raw.blobReadyMs, poolInfoMode: raw.poolInfoMode,
    playDelayAppliedMs: raw.playDelayAppliedMs ?? 0,
    playOk: !!played, failKind, directBlob: !!raw.directBlob, firstErrCode: raw.errEvents && raw.errEvents.length ? raw.errEvents[0].code : null,
    playErr: raw.playErr, totalFrames: raw.quality ? raw.quality.total : null,
    droppedFrames: raw.quality ? raw.quality.dropped : null, finalCt: raw.finalCt,
    finalPaused: raw.finalPaused, finalSrcKind: raw.finalSrcKind,
    swapMs: raw.swapMs ?? null, swapRs: raw.swapRs ?? null, swapNs: raw.swapNs ?? null,
    swapPaused: raw.swapPaused ?? null, swapCt: raw.swapCt ?? null, swapSeeking: raw.swapSeeking ?? null,
    httpLoadstartBeforeSwap: !!raw.httpLoadstartBeforeSwap, httpProgressBeforeSwap: !!raw.httpProgressBeforeSwap,
    httpLoadedMetaBeforeSwap: !!raw.httpLoadedMetaBeforeSwap, httpLoadedBeforeSwap: !!raw.httpLoadedBeforeSwap,
    playCalledMs: raw.playCalledMs ?? null,
    ctReached: raw.samples.length ? raw.samples[raw.samples.length - 1].ct : null,
    evs: raw.evs || [], firstSample: raw.samples.length ? raw.samples[0] : null,
    lastSample: raw.samples.length ? raw.samples[raw.samples.length - 1] : null };
}

const results = { date: new Date().toISOString(), round: "phase9-round97-y1a-w1light", clips: CLIPS, cases: [], env: {} };
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

function caseEnv() {
  let memAvailMB = null;
  try {
    const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)\s+kB/);
    if (m) memAvailMB = Math.round(+m[1] / 1024);
  } catch {}
  let loadavg = null;
  try { loadavg = os.loadavg().map((x) => +x.toFixed(2)); } catch {}
  return { loadavg, memAvailMB };
}

async function doLoad(clipKey, usePool, runIdx, extra) {
  const c = CLIPS[clipKey];
  const wallMs = 10000;
  const variant = extra?.variant || "prod";
  const bundle = extra?.bundle || (variant === "prod" || variant === "blob-direct" ? "media-pool-bundle.js" : `media-pool-bundle-${variant}.js`);
  const gstTag = extra?.gstTag;
  const wantGst = process.env.GST_DEBUG_BLOB === "1" && usePool;
  const gstDebugFile = wantGst ? path.join(GST_DIR, `${gstTag || `L${clipKey}-blob-run${runIdx}`}.log`) : undefined;
  try { if (gstDebugFile) fs.unlinkSync(gstDebugFile); } catch {}
  const envAtStart = caseEnv();
  const raw = await runPage({ pool: usePool, bundle, variant, directBlob: variant === "blob-direct", clipFile: c.file,
    clipUrl: `${BASE}/${c.file}`, proxyUrl: `${BASE}/${c.file}`, knownSize: c.bytes,
    duration: c.dur, wallMs, waitBlobMs: usePool ? 15000 : 0, traceSrc: true,
    playDelayMs: Number(process.env.PLAY_DELAY_MS || 0) || 0,
    gstDebugFile });
  let gstDebugBytes = 0;
  try { if (gstDebugFile) gstDebugBytes = fs.statSync(gstDebugFile).size; } catch {}
  return { mode: usePool ? "blob" : "progressive", variant, clip: c.file, clipBytes: c.bytes, clipDurS: c.dur,
    playDelayMs: Number(process.env.PLAY_DELAY_MS || 0) || 0,
    gstDebugFile, gstDebugBytes: gstDebugFile ? gstDebugBytes : undefined,
    ...envAtStart,
    run: runIdx, ...summarizeLoad(raw), srcTrace: raw.srcTrace, errEvents: raw.errEvents };
}

async function doLoop(clipKey, usePool, runIdx, extra) {
  const c = CLIPS[clipKey];
  const target = LOOP_TARGET[clipKey];
  const wallMs = Math.ceil(c.dur * target * 1000 * 1.6 + 10000);
  const variant = extra?.variant || "prod";
  const bundle = extra?.bundle || (variant === "prod" || variant === "blob-direct" ? "media-pool-bundle.js" : `media-pool-bundle-${variant}.js`);
  const gstTag = extra?.gstTag;
  const wantGst = process.env.GST_DEBUG_BLOB === "1" && usePool;
  const gstDebugFile = wantGst ? path.join(GST_DIR, `${gstTag || `LOOP${clipKey}-blob-run${runIdx}`}.log`) : undefined;
  try { if (gstDebugFile) fs.unlinkSync(gstDebugFile); } catch {}
  const envAtStart = caseEnv();
  const raw = await runPage({ pool: usePool, bundle, variant, directBlob: variant === "blob-direct", clipFile: c.file,
    clipUrl: `${BASE}/${c.file}`, proxyUrl: `${BASE}/${c.file}`, knownSize: c.bytes,
    duration: c.dur, wallMs, waitBlobMs: usePool ? 15000 : 0, targetLoops: target, traceSrc: true,
    gstDebugFile });
  let gstDebugBytes = 0;
  try { if (gstDebugFile) gstDebugBytes = fs.statSync(gstDebugFile).size; } catch {}
  return { mode: usePool ? "blob" : "progressive", variant, clip: c.file, clipBytes: c.bytes, clipDurS: c.dur,
    gstDebugFile, gstDebugBytes: gstDebugFile ? gstDebugBytes : undefined,
    ...envAtStart,
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
} else if (key === "MATRIX") {
  // MATRIX: load-play xen kẽ A/B từng run để khử nhiễu tải.
  for (const ck of ["c2", "c4", "c6", "c8"]) {
    for (let j = startIdx; j < startIdx + runs; j++) {
      try { await pushCase(`L${ck}-blobA-run${j}`, await doLoad(ck, true, j, { variant: "prod", gstTag: `L${ck}-blobA-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobA-run${j}`, { mode: "blob", variant: "prod", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-blobB-run${j}`, await doLoad(ck, true, j, { variant: "preload-none", gstTag: `L${ck}-blobB-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobB-run${j}`, { mode: "blob", variant: "preload-none", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-prog-run${j}`, await doLoad(ck, false, j, { gstTag: `L${ck}-prog-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-prog-run${j}`, { mode: "progressive", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
    }
  }
} else if (key === "LOOPMATRIX") {
  for (const ck of ["c2", "c4", "c6", "c8"]) {
    for (let j = startIdx; j < startIdx + runs; j++) {
      try { await pushCase(`LOOP${ck}-blobA-run${j}`, await doLoop(ck, true, j, { variant: "prod", gstTag: `LOOP${ck}-blobA-run${j}` })); }
      catch (e) { await pushCase(`LOOP${ck}-blobA-run${j}`, { mode: "blob", variant: "prod", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`LOOP${ck}-blobB-run${j}`, await doLoop(ck, true, j, { variant: "preload-none", gstTag: `LOOP${ck}-blobB-run${j}` })); }
      catch (e) { await pushCase(`LOOP${ck}-blobB-run${j}`, { mode: "blob", variant: "preload-none", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`LOOP${ck}-prog-run${j}`, await doLoop(ck, false, j, { gstTag: `LOOP${ck}-prog-run${j}` })); }
      catch (e) { await pushCase(`LOOP${ck}-prog-run${j}`, { mode: "progressive", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
    }
  }
} else if (key === "MATRIX2") {
  // MATRIX2: doi chung C (reset-swap) / D (fresh-element) / E (blob-direct)
  // voi A (prod control). Moi clip x run: C, D, E, A (xen ke).
  for (const ck of ["c2", "c4", "c6", "c8"]) {
    for (let j = startIdx; j < startIdx + runs; j++) {
      try { await pushCase(`L${ck}-blobC-run${j}`, await doLoad(ck, true, j, { variant: "reset-swap", gstTag: `L${ck}-blobC-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobC-run${j}`, { mode: "blob", variant: "reset-swap", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-blobD-run${j}`, await doLoad(ck, true, j, { variant: "fresh-element", gstTag: `L${ck}-blobD-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobD-run${j}`, { mode: "blob", variant: "fresh-element", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-blobE-run${j}`, await doLoad(ck, true, j, { variant: "blob-direct", gstTag: `L${ck}-blobE-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobE-run${j}`, { mode: "blob", variant: "blob-direct", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-blobA-run${j}`, await doLoad(ck, true, j, { variant: "prod", gstTag: `L${ck}-blobA-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobA-run${j}`, { mode: "blob", variant: "prod", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
    }
  }
} else if (key === "MATRIX3") {
  // MATRIX3: doi chung nhe tai — A (prod) vs E (blob-direct), khong prog.
  // Dung Q6_START=4 de ten case khong dung voi MATRIX/MATRIX2 (run1-3).
  for (const ck of ["c2", "c4", "c6", "c8"]) {
    for (let j = startIdx; j < startIdx + runs; j++) {
      try { await pushCase(`L${ck}-blobA-run${j}`, await doLoad(ck, true, j, { variant: "prod", gstTag: `L${ck}-blobA-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobA-run${j}`, { mode: "blob", variant: "prod", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-blobE-run${j}`, await doLoad(ck, true, j, { variant: "blob-direct", gstTag: `L${ck}-blobE-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-blobE-run${j}`, { mode: "blob", variant: "blob-direct", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
    }
  }
} else if (key === "MATRIXFS") {
  // W1 faststart: chi c2/c8 (moov dau file), moi clip 6 run: blob-A (prod)
  // xen ke prog. Ten case co "-fs" de khong dung V3.
  for (const ck of ["c2", "c8"]) {
    for (let j = startIdx; j < startIdx + runs; j++) {
      try { await pushCase(`L${ck}-y1a-blobA-run${j}`, await doLoad(ck, true, j, { variant: "prod", gstTag: `L${ck}-y1a-blobA-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-y1a-blobA-run${j}`, { mode: "blob", variant: "prod", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
      try { await pushCase(`L${ck}-y1a-prog-run${j}`, await doLoad(ck, false, j, { gstTag: `L${ck}-y1a-prog-run${j}` })); }
      catch (e) { await pushCase(`L${ck}-y1a-prog-run${j}`, { mode: "progressive", clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
    }
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
  console.error("MODE không rõ:", rawWhich, "(L2|L4|L6|L8|L10|LOOP2|LOOP4|LOOP6|LOOP8|ALL)");
  process.exit(2);
}
server.close();
console.log("DONE", OUT);
