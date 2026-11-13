// webkit_loop_d_fix_89q6.mjs — Phase 9 đợt 89, luồng Q6: A/B fix căn nguyên
// race preroll GStreamer vs HTTP progressive cho clip D kẹt loop (nợ
// LIMITS gộp đợt 88 §4 mục 3; cơ chế gốc: docs/PHASE9_ROUND86_N1_WEBKIT_CLIPD_LOOP_LIMITS.md).
//
// Clip D: 1280x720, 4 s, 24 fps, libx264 testsrc2 mặc định (~2,6 Mbps),
// tại /tmp/q6/clips/d.mp4 (encode lại sau reboot, KHÔNG stage binary).
// Server HTTP có range-support (port 8896). WebKitGTK 27.2 headed, xvfb.
// Chạy: GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0 xvfb-run -a
//   node benchmarks/render/webkit_loop_d_fix_89q6.mjs <CASE> [RUNS]
// CASE: B0 | F1 | F2 | F3 | F4 | F5 | ALL  (mặc định B0, RUNS mặc định 1)
// Kết quả append vào benchmarks/results/webkit-loop-d-fix-89q6.json.
//
// Các ca (mỗi run = loop 5 vòng trên D qua HTTP progressive, trừ F4):
//  B0 baseline: ended -> currentTime=0 + play() ngay (tái hiện N1 P0).
//  F1 gated-restart: MỖI lần restart (kể cả lần play đầu) đều chờ preroll
//     thật: seek(0) -> chờ 'seeked' -> chờ 1 frame đã decode tại t=0
//     (requestVideoFrameCallback nếu có, fallback: totalVideoFrames tăng,
//     timeout 5 s) -> mới play(). Giả thuyết: play() chỉ sau khi pipeline
//     đã có frame sẵn thì không còn cửa sổ race.
//  F2 load-restart: ended -> load() (tạo lại pipeline) -> chờ 'canplay'
//     -> seek(0) -> chờ 'seeked' -> play(). Giả thuyết: pipeline mới với
//     dữ liệu đã cache sẽ preroll sạch.
//  F3 prime-only: trước lần play đầu: play() -> chờ ct>0.05 -> pause()
//     -> seek(0) -> chờ 'seeked' -> play(); các restart sau dùng baseline
//     (seek+play ngay). Tách riêng "mồi pipeline" khỏi "gác mọi restart".
//  F4 blob-control: fetch toàn bộ file -> blob URL, restart baseline
//     (đối chứng N1 P6: 5/5 — kiểm lại trên boot này).
//  F5 delay1s-restart: MỖI restart (kể cả lần play đầu): seek(0) ->
//     chờ 'seeked' -> sleep(1000) -> play(). Hỏi: delay 1 s (thay vì
//     5 s của F1) có đủ tránh stall vĩnh viễn không? Nếu 5/5 thì gate
//     1 s là ứng viên production (chấp nhận được cho preview); nếu
//     fail thì ngưỡng delay nằm trong (1 s, 5 s] — không ship được.
// Pass = đủ 5 vòng ended, không stall >=1,5 s, finalCt chạy tiếp.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
// Q6_BROWSER=chromium: smoke-test logic harness trên Chromium (không cần
// dep WebKit) trước khi chạy WebKit thật. Mặc định webkit.
const BROWSER_NAME = (process.env.Q6_BROWSER || "webkit").toLowerCase();
const browserType = BROWSER_NAME === "chromium" ? pw.chromium : pw.webkit;
const { webkit } = pw;
const CLIP_DIR = "/tmp/q6/clips";
const PORT = 8896;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-loop-d-fix-89q6.json");
const MIME = { ".mp4": "video/mp4", ".webm": "video/webm", ".html": "text/html" };

const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
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

// Chờ 1 frame đã decode tại vị trí hiện tại. Trả {method, waitMs, framesBefore, framesAfter}.
// method: 'rvfc' | 'frames' | 'timeout' | 'unsupported'.
// rVFC trên video đang pause: sau seek, callback bắn khi frame mới sẵn sàng
// trình bày. Fallback: poll totalVideoFrames.
function gateFnSource() {
  return `
  async function waitFrame(v, timeoutMs) {
    const t0 = performance.now();
    let framesBefore = null;
    try { framesBefore = v.getVideoPlaybackQuality().totalVideoFrames; } catch {}
    if (typeof v.requestVideoFrameCallback === "function") {
      const r = await new Promise((resolve) => {
        let done = false;
        const to = setTimeout(() => { if (!done) { done = true; resolve("timeout"); } }, timeoutMs);
        try {
          v.requestVideoFrameCallback(() => { if (!done) { done = true; clearTimeout(to); resolve("rvfc"); } });
        } catch { if (!done) { done = true; clearTimeout(to); resolve("unsupported"); } }
      });
      let framesAfter = null;
      try { framesAfter = v.getVideoPlaybackQuality().totalVideoFrames; } catch {}
      return { method: r, waitMs: Math.round(performance.now() - t0), framesBefore, framesAfter };
    }
    // Fallback: poll totalVideoFrames tăng.
    const poll = async () => {
      while (performance.now() - t0 < timeoutMs) {
        let f = null;
        try { f = v.getVideoPlaybackQuality().totalVideoFrames; } catch {}
        if (framesBefore !== null && f !== null && f > framesBefore) {
          return { method: "frames", waitMs: Math.round(performance.now() - t0), framesBefore, framesAfter: f };
        }
        await new Promise((r2) => setTimeout(r2, 50));
      }
      let framesAfter = null;
      try { framesAfter = v.getVideoPlaybackQuality().totalVideoFrames; } catch {}
      return { method: "timeout", waitMs: Math.round(performance.now() - t0), framesBefore, framesAfter };
    };
    return poll();
  }
  async function waitEvent(v, name, timeoutMs) {
    return new Promise((resolve) => {
      let done = false;
      const to = setTimeout(() => { if (!done) { done = true; resolve(false); } }, timeoutMs);
      const h = () => { if (!done) { done = true; clearTimeout(to); resolve(true); } };
      v.addEventListener(name, h, { once: true });
    });
  }
  // NOTE (89Q6 fix): sleep PHAI la function declaration de thoat khoi
  // direct eval — ban cu dung 'const sleep' nen F3-run4/run5 nem
  // "Can't find variable: sleep" va bo qua prime (xem LIMITS).
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  `;
}

async function blobLoopCase(page, clipUrl, targetLoops, wallMs) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs }) => {
    const buf = await (await fetch(clipUrl)).arrayBuffer();
    const blobUrl = URL.createObjectURL(new Blob([buf], { type: "video/mp4" }));
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = blobUrl;
    document.body.appendChild(v);
    const endedAt = [];
    const resumeMs = [];
    let seekedCount = 0;
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    v.addEventListener("ended", () => {
      const t = performance.now();
      endedAt.push(+t.toFixed(1));
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
      const tick = () => {
        if (v.currentTime > 0.1 && !v.paused) resumeMs.push(+(performance.now() - t).toFixed(1));
        else if (performance.now() - t < 5000) requestAnimationFrame(tick);
        else resumeMs.push(null);
      };
      requestAnimationFrame(tick);
    });
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { playErr = String(e && e.message); }
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      if (endedAt.length >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { mode: "F4-blob", fetchedBytes: buf.byteLength, duration: v.duration, samples, endedAt, resumeMs, seekedCount,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = ""; URL.revokeObjectURL(blobUrl);
    return out;
  }, { clipUrl, targetLoops, wallMs }, { timeout: wallMs + 60000 });
}

function summarize(raw, targetLoops) {
  const ended = raw.endedAt ? raw.endedAt.length : 0;
  const resume = (raw.resumeMs || []).filter((x) => x !== null);
  const med = (a) => a.length ? +a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)].toFixed(1) : null;
  let stalls = [];
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
  const pass = ended >= targetLoops && stalls.length === 0;
  return { mode: raw.mode, targetLoops, loopsCompleted: ended, pass,
    resumeMsMedian: med(resume), resumeNull: (raw.resumeMs || []).filter((x) => x === null).length,
    seekedCount: raw.seekedCount, restarts: raw.restarts ?? null,
    totalFrames: raw.quality ? raw.quality.total : null, droppedFrames: raw.quality ? raw.quality.dropped : null,
    stalls, gates: raw.gates ?? null, firstPlayGate: raw.firstPlayGate ?? null,
    rvfcSupported: raw.rvfcSupported ?? null, fetchedBytes: raw.fetchedBytes ?? null,
    finalCt: raw.finalCt, finalPaused: raw.finalPaused, finalEnded: raw.finalEnded,
    playErr: raw.playErr, wallS: raw.samples.length ? raw.samples[raw.samples.length - 1].t : 0 };
}

const D = `${BASE}/d.mp4`;
const results = { date: new Date().toISOString(), cases: [], env: {} };
let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); if (prev && Array.isArray(prev.cases)) results.cases = prev.cases; } catch {}
const which = (process.argv[2] || "B0").toUpperCase();
const runs = Math.max(1, parseInt(process.argv[3] || "1", 10));
// Q6_START: chỉ số run bắt đầu (để chạy tiếp sau khi JSON đã có run1..run2).
const startIdx = Math.max(1, parseInt(process.env.Q6_START || "1", 10));
const targetLoops = 5;
const wallMs = Math.ceil(4 * targetLoops * 1000 * 1.6 + 10000);

// Hẹn giờ cho mọi await không có timeout sẵn (newPage/close/browser):
// B0-run3 đã treo ~8 phút ở một await không timeout (browser kẹt sau khi
// WebProcess crash) làm chết cả lượt 600 s — mỗi run phải tự chết sau
// 240 s và được ghi là run fail, không được treo lượt.
async function withTimeout(p, ms, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(label + "-timeout-" + ms + "ms")), ms); });
  try { return await Promise.race([p, to]); } finally { clearTimeout(timer); }
}

// Gate helpers (waitFrame/waitEvent/sleep) được gắn vào window.__gateSrc
// trước mỗi page.evaluate, vì evaluate không đọc được closure ngoài.
const gateSrc = gateFnSource();
// Browser MỚI mỗi run (cô lập browser kẹt sau WebProcess crash).
async function runOne(mode, runIdx) {
  const browser = await withTimeout(browserType.launch({ headless: false }), 60000, "launch");
  try {
    const page = await withTimeout(browser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "newPage");
    try {
      await withTimeout(page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
      // Gắn helper vào window trước mỗi evaluate (evaluate dùng eval(window.__gateSrc)).
      await page.evaluate((src) => { window.__gateSrc = src; }, gateSrc);
      return await runOneOnPage(page, mode);
    } finally {
      try { await withTimeout(page.close(), 15000, "pageClose"); } catch {}
    }
  } finally {
    try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {}
  }
}
async function runOneOnPage(page, mode) {
  const raw = await page.evaluate(async ({ clipUrl, targetLoops, wallMs, mode }) => {
    // eslint-disable-next-line no-eval
    eval(window.__gateSrc);
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const endedAt = [];
    const resumeMs = [];
    const gates = [];
    let seekedCount = 0;
    let restarts = 0;
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    let firstPlayGate = null;
    async function gatedRestart() {
      restarts++;
      const g0 = performance.now();
      v.currentTime = 0;
      const seekedOk = await waitEvent(v, "seeked", 5000);
      const gate = await waitFrame(v, 5000);
      gates.push({ restart: restarts, seekedOk, ...gate, gateTotalMs: Math.round(performance.now() - g0) });
      const p = v.play(); if (p) p.catch(() => {});
    }
    async function loadRestart() {
      restarts++;
      const g0 = performance.now();
      v.load();
      const canplayOk = await waitEvent(v, "canplay", 5000);
      v.currentTime = 0;
      const seekedOk = await waitEvent(v, "seeked", 5000);
      gates.push({ restart: restarts, loadCanplayOk: canplayOk, seekedOk, gateTotalMs: Math.round(performance.now() - g0) });
      const p = v.play(); if (p) p.catch(() => {});
    }
    async function delayedRestart() {
      restarts++;
      const g0 = performance.now();
      v.currentTime = 0;
      const seekedOk = await waitEvent(v, "seeked", 5000);
      await sleep(1000);
      gates.push({ restart: restarts, seekedOk, method: "delay1s", gateTotalMs: Math.round(performance.now() - g0) });
      const p = v.play(); if (p) p.catch(() => {});
    }
    function baselineRestart() {
      restarts++;
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
    }
    const watchResume = (endedT) => {
      const tick = () => {
        if (v.currentTime > 0.1 && !v.paused) { resumeMs.push(+(performance.now() - endedT).toFixed(1)); }
        else if (performance.now() - endedT < 5000) requestAnimationFrame(tick);
        else resumeMs.push(null);
      };
      requestAnimationFrame(tick);
    };
    v.addEventListener("ended", () => {
      const t = performance.now();
      endedAt.push(+t.toFixed(1));
      if (mode === "F1") void gatedRestart();
      else if (mode === "F2") void loadRestart();
      else if (mode === "F5") void delayedRestart();
      else baselineRestart();
      watchResume(t);
    });
    const rvfcSupported = typeof v.requestVideoFrameCallback === "function";
    try {
      if (mode === "F1") {
        await waitEvent(v, "loadedmetadata", 10000);
        firstPlayGate = await waitFrame(v, 5000);
        await v.play();
      } else if (mode === "F5") {
        await waitEvent(v, "loadedmetadata", 10000);
        v.currentTime = 0;
        const seekedOk = await waitEvent(v, "seeked", 5000);
        await sleep(1000);
        firstPlayGate = { method: "delay1s", seekedOk };
        await v.play();
      } else if (mode === "F3") {
        await v.play();
        const tP = performance.now();
        while (v.currentTime < 0.05 && performance.now() - tP < 10000) await sleep(50);
        const primedCt = +v.currentTime.toFixed(3);
        v.pause();
        v.currentTime = 0;
        const seekedOk = await waitEvent(v, "seeked", 5000);
        firstPlayGate = { prime: true, primedCt, seekedOk, primedMs: Math.round(performance.now() - tP) };
        await v.play();
      } else {
        await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]);
      }
    } catch (e) { playErr = String(e && e.message); }
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      if (endedAt.length >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { mode, rvfcSupported, duration: v.duration, samples, endedAt, resumeMs, seekedCount, restarts,
      gates, firstPlayGate,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl: D, targetLoops, wallMs, mode }, { timeout: wallMs + 60000 });
  return raw;
}

// ENV probe trên browser riêng (không chặn lượt nếu fail).
try {
  const envBrowser = await withTimeout(browserType.launch({ headless: false }), 60000, "envLaunch");
  try {
    const probePage = await withTimeout(envBrowser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "envNewPage");
    try {
      await withTimeout(probePage.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "envGoto");
      results.env.userAgent = await probePage.evaluate(() => navigator.userAgent);
      results.env.mediaRecorder = await probePage.evaluate(() => typeof MediaRecorder);
      results.env.hardwareConcurrency = await probePage.evaluate(() => navigator.hardwareConcurrency);
      results.env.rvfc = await probePage.evaluate(() => { const v = document.createElement("video"); return typeof v.requestVideoFrameCallback; });
    } finally { try { await withTimeout(probePage.close(), 15000, "envPageClose"); } catch {} }
  } finally { try { await withTimeout(envBrowser.close(), 15000, "envBrowserClose"); } catch {} }
} catch (e) { results.env.probeErr = String(e && e.message); }
console.log("ENV", JSON.stringify(results.env));
const cases = which === "ALL" ? ["B0", "F1", "F2", "F3", "F4", "F5"] : [which];
for (const mode of cases) {
  for (let i = startIdx; i < startIdx + runs; i++) {
    const name = `${mode}-run${i}`;
    let sum;
    try {
      // KHÔNG race timeout ngoài ở đây: mọi await trong runOne/runBlob đã
      // có timeout riêng (tổng tệ nhất ~292 s/run); race ngoài sẽ cắt
      // run đang tiến triển và rò browser. Lỗi/hết timeout trong được
      // ghi là run FAIL để lượt không mất run.
      const raw = mode === "F4" ? await runBlob(mode) : await runOne(mode, i);
      sum = summarize(raw, targetLoops);
    } catch (e) {
      sum = { mode, targetLoops, loopsCompleted: 0, pass: false, runError: String(e && e.message).slice(0, 200) };
    }
    results.cases.push({ name, date: new Date().toISOString(), ...sum });
    console.log(name, JSON.stringify(sum));
    await writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
  }
}
server.close();
console.log("DONE", OUT);

// F4 trên browser riêng (cùng cơ chế timeout/cô lập như runOne).
async function runBlob(mode) {
  const browser = await withTimeout(browserType.launch({ headless: false }), 60000, "launch");
  try {
    const page = await withTimeout(browser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "newPage");
    try {
      await withTimeout(page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
      return await blobLoopCase(page, D, targetLoops, wallMs);
    } finally { try { await withTimeout(page.close(), 15000, "pageClose"); } catch {} }
  } finally { try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {} }
}
