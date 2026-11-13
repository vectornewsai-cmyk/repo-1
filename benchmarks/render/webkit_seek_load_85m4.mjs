// webkit_seek_load_85m4.mjs — Phase 9 đợt 85, luồng M4: W6 follow-up.
//
// Probe đầu (webkit_seek_latency_85m4.mjs) cho kết quả bất ngờ: seek trên
// element video THÔ trên WebKitGTK NHANH (seeked 14–1517 ms, cả GOP 250
// keyframe 8,33 s) — KHÔNG phải 5–9 s như đóng băng trong app (L10 §6,
// run 2 P2: ct kẹt 14 s+). Vậy đóng băng trong app KHÔNG phải do seek
// intrinsic của GStreamer. Probe này tách 3 giả thuyết:
//   (a) tải CPU: seek thô dưới tải nhân tạo (3 tiến trình đốt CPU).
//   (b) churn kiểu app: seek thô + play() mỗi tick + drawImage mỗi rAF +
//       gán playbackRate/preservesPitch mỗi tick (đúng những gì syncMedia
//       làm) — xem churn có làm seek kẹt không.
//   (c) đo lại giảm thiểu bằng metric ĐÚNG: probe đầu đo "settled" bằng
//       |ct-target| < 0,15 — hỏng với element đang phát (ct chạy qua cửa
//       sổ 0,15 s trong 150 ms → TIMEOUT giả). Nay đo bằng
//       requestVideoFrameCallback: ms tới frame đầu tiên có mediaTime
//       trong 0,5 s quanh target (frame thật sự trình diễn được).
// Các ca (WebKitGTK headed, clip H.264 30 s 640×360 GOP 30 / GOP 250):
//   A: plain, không tải (baseline — lặp lại probe đầu).
//   B: plain, tải nhân tạo 3 CPU.
//   C: plain + churn kiểu app, không tải.
//   D: giảm thiểu (plain vs pause-seek-play vs fastSeek) trên g250,
//      metric rVFC.
// Chạy: xvfb-run -a node benchmarks/render/webkit_seek_load_85m4.mjs
// Env: M4_SEEK2_ENGINE (webkit|chromium|both, mặc định webkit).
// Clip ở /tmp/m4/clips (KHÔNG stage binary). KHÔNG sửa file sản phẩm.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const FULL = "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
const CLIP_DIR = "/tmp/m4/clips";
const PORT = 8899;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-seek-load-85m4.json");
const ENGINE = process.env.M4_SEEK2_ENGINE || "webkit";
const SEEK_TIMEOUT_MS = 20000;

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

/** Đốt CPU: n tiến trình node vòng lặp vô hạn (kill sau ca đo). */
function startCpuLoad(n) {
  const procs = [];
  for (let i = 0; i < n; i++) {
    const p = spawn(process.execPath, ["-e", "while (true) { Math.sqrt(Math.random()); }"], { stdio: "ignore" });
    procs.push(p);
  }
  return procs;
}
function stopCpuLoad(procs) {
  for (const p of procs) { try { p.kill("SIGKILL"); } catch {} }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Một ca seek: nạp clip, phát, seek tới các vị trí; mỗi seek đo ms tới
 * `seeked` + ms tới frame đầu tiên tại target (rVFC, mediaTime trong
 * 0,5 s quanh target). opts: { churn: boolean, method: "currentTime" |
 * "pause-seek-play" | "fastSeek" }.
 */
async function seekCase(page, clipUrl, positions, opts) {
  return await page.evaluate(async ({ clipUrl, positions, opts }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (cond, timeoutMs) => {
      const t0 = performance.now();
      while (performance.now() - t0 < timeoutMs) {
        if (cond()) return performance.now() - t0;
        await sleep2(25);
      }
      return null;
    };
    try {
      await Promise.race([
        new Promise((res, rej) => { v.addEventListener("loadedmetadata", res, { once: true }); v.addEventListener("error", () => rej(new Error("load-error")), { once: true }); }),
        sleep2(15000).then(() => { throw new Error("metadata-timeout"); }),
      ]);
    } catch (e) {
      const out0 = { duration: v.duration, error: String(e && e.message), seeks: [] };
      v.pause(); v.remove(); v.src = "";
      return out0;
    }
    const dur = v.duration;
    // Churn kiểu app (đúng những gì syncMedia làm mỗi tick): play() khi
    // paused + gán playbackRate/preservesPitch + drawImage mỗi rAF.
    let churnStop = false;
    let churnTicks = 0;
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 180;
    const ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);
    const churnLoop = () => {
      if (churnStop) return;
      churnTicks++;
      try {
        if (v.paused) { const p = v.play(); if (p) p.catch(() => {}); }
        if (v.playbackRate !== 1) v.playbackRate = 1;
        if ("preservesPitch" in v) v.preservesPitch = true;
        if (v.readyState >= 2) ctx.drawImage(v, 0, 0, 320, 180);
      } catch {}
      requestAnimationFrame(churnLoop);
    };
    if (opts.churn) requestAnimationFrame(churnLoop);
    try { await v.play(); } catch {}
    await waitFor(() => v.currentTime > 0.2 && !v.paused, 10000);
    const seeks = [];
    for (const pos of positions) {
      const target = +(pos * dur).toFixed(3);
      const t0 = performance.now();
      let seekedMs = null;
      let frameMs = null;
      let frameMediaTime = null;
      const seekedP = new Promise((res) => {
        const h = () => { seekedMs = performance.now() - t0; v.removeEventListener("seeked", h); res(); };
        v.addEventListener("seeked", h);
        setTimeout(() => { v.removeEventListener("seeked", h); res(); }, opts.timeoutMs);
      });
      // rVFC: frame đầu tiên có mediaTime trong 0,5 s quanh target.
      let rvfcDone = false;
      const rvfcP = new Promise((res) => {
        const tick = () => {
          if (rvfcDone) return;
          v.requestVideoFrameCallback((_now, md) => {
            if (rvfcDone) return;
            if (Math.abs(md.mediaTime - target) < 0.5) {
              rvfcDone = true; frameMs = performance.now() - t0; frameMediaTime = +md.mediaTime.toFixed(3); res();
            } else if (performance.now() - t0 > opts.timeoutMs) {
              rvfcDone = true; res();
            } else {
              tick();
            }
          });
        };
        tick();
        setTimeout(() => { if (!rvfcDone) { rvfcDone = true; res(); } }, opts.timeoutMs + 1000);
      });
      if (opts.method === "fastSeek" && typeof v.fastSeek === "function") {
        v.fastSeek(target);
      } else if (opts.method === "pause-seek-play") {
        v.pause();
        v.currentTime = target;
        await seekedP;
        const p = v.play(); if (p) p.catch(() => {});
      } else {
        v.currentTime = target;
      }
      if (opts.method !== "pause-seek-play") await seekedP;
      await rvfcP;
      seeks.push({
        target, method: opts.method || "currentTime",
        seekedMs: seekedMs === null ? null : +seekedMs.toFixed(0),
        frameMs: frameMs === null ? null : +frameMs.toFixed(0),
        frameMediaTime,
        ctAfter: +v.currentTime.toFixed(3),
        seekingAfter: v.seeking, pausedAfter: v.paused,
        timeout: seekedMs === null || frameMs === null,
      });
      await sleep2(500);
    }
    churnStop = true;
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { duration: dur, churnTicks, seeks,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null };
    v.pause(); v.remove(); v.src = ""; canvas.remove();
    return out;
  }, { clipUrl, positions, opts: { ...opts, timeoutMs: SEEK_TIMEOUT_MS } }, { timeout: 600000 });
}

function median(xs) {
  const a = xs.filter((x) => typeof x === "number").sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

async function runEngine(engineName) {
  const launchOpts = engineName === "webkit"
    ? { headless: false }
    : { headless: false, executablePath: FULL, args: ["--no-sandbox"] };
  const browser = await (engineName === "webkit" ? webkit : chromium).launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const out = { engine: engineName, cases: {} };
  const clips = [
    { id: "h264_30s_g30_640", file: "w6_h264_30s_g30_640.mp4" },
    { id: "h264_30s_g250_640", file: "w6_h264_30s_g250_640.mp4" },
  ];
  const POS = [0.1, 0.5, 0.9];
  try {
    // A: baseline không tải.
    for (const c of clips) {
      const raw = await seekCase(page, `${BASE}/${c.file}`, POS, { method: "currentTime" });
      out.cases[`${c.id}|A-noload`] = { clip: c.id, cond: "A-noload", raw };
      console.log(`[${engineName}] A ${c.id}: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms/frame ${s.frameMs}ms`).join(" | "));
    }
    // B: tải nhân tạo 3 CPU trong lúc đo.
    const burners = startCpuLoad(3);
    await sleep(2000); // để tải lên mức ổn định
    console.log(`[${engineName}] B: tải nhân tạo bật (loadavg ${os.loadavg().map((x) => x.toFixed(2)).join("/")})`);
    try {
      for (const c of clips) {
        const raw = await seekCase(page, `${BASE}/${c.file}`, POS, { method: "currentTime" });
        out.cases[`${c.id}|B-load3cpu`] = { clip: c.id, cond: "B-load3cpu", loadavg: os.loadavg(), raw };
        console.log(`[${engineName}] B ${c.id}: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms/frame ${s.frameMs}ms${s.timeout ? " TIMEOUT" : ""}`).join(" | "));
      }
    } finally {
      stopCpuLoad(burners);
    }
    await sleep(2000);
    // C: churn kiểu app, không tải.
    for (const c of clips) {
      const raw = await seekCase(page, `${BASE}/${c.file}`, POS, { method: "currentTime", churn: true });
      out.cases[`${c.id}|C-churn`] = { clip: c.id, cond: "C-churn", raw };
      console.log(`[${engineName}] C ${c.id} (churnTicks=${raw.churnTicks}): ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms/frame ${s.frameMs}ms${s.timeout ? " TIMEOUT" : ""}`).join(" | "));
    }
    // D: giảm thiểu trên g250, metric rVFC (không tải).
    const worst = clips[1];
    for (const method of ["currentTime", "pause-seek-play", "fastSeek"]) {
      for (let rep = 1; rep <= 2; rep++) {
        const raw = await seekCase(page, `${BASE}/${worst.file}`, POS, { method });
        out.cases[`${worst.id}|D-${method}|rep${rep}`] = { clip: worst.id, cond: `D-${method}`, method, raw };
        console.log(`[${engineName}] D ${method} rep${rep}: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms/frame ${s.frameMs}ms${s.timeout ? " TIMEOUT" : ""}`).join(" | "));
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  // Tóm tắt trung vị frameMs theo điều kiện.
  const summary = {};
  for (const [k, c] of Object.entries(out.cases)) {
    summary[k] = {
      medianSeekedMs: median(c.raw.seeks.map((s) => s.seekedMs)),
      medianFrameMs: median(c.raw.seeks.map((s) => s.frameMs)),
      timeouts: c.raw.seeks.filter((s) => s.timeout).length,
    };
  }
  out.summary = summary;
  out.loadEnd = os.loadavg();
  return out;
}

async function main() {
  const results = { startedAt: new Date().toISOString(), engines: {} };
  const engines = ENGINE === "both" ? ["webkit", "chromium"] : [ENGINE];
  try {
    for (const e of engines) {
      try {
        results.engines[e] = await runEngine(e);
      } catch (err) {
        console.log(`[${e}] PROBE LỖI: ${err.message}`);
        results.engines[e] = { engine: e, error: String(err.message || err) };
      }
    }
    results.finishedAt = new Date().toISOString();
    writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
    console.log(`XONG — kết quả thô: ${OUT}`);
    console.log(JSON.stringify(results.engines.webkit?.summary || results.engines.chromium?.summary, null, 2));
    process.exit(0);
  } catch (e) {
    console.log("PROBE LỖI: " + (e && e.message || e));
    try { writeFileEpermRetry(OUT, JSON.stringify(results, null, 2)); } catch {}
    process.exit(2);
  } finally {
    server.close();
  }
}

main();
