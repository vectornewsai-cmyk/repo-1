// webkit_seek_latency_85m4.mjs — Phase 9 đợt 85, luồng M4: đo W6 (seek
// WebKitGTK đóng băng 5–9 s mỗi lần, kể cả tải thấp — L10 §6).
//
// Câu hỏi: seek chậm là do (a) khoảng cách tới keyframe trước (GOP thưa →
// phải decode nhiều frame mới tới được target), (b) decode/resolution
// (720p nặng hơn), (c) duration/codec, hay (d) intrinsic của GStreamer
// seek (chậm bất kể vị trí)? Và có cách giảm nào đo được không?
//
// Ma trận (element video THÔ, gắn DOM tránh W5, muted, preload auto):
//  - Clip: H.264 640×360 30 s với GOP 12 / 30 / 250 (keyframe mỗi
//    0,4 s / 1 s / 8,33 s — đã xác nhận bằng ffprobe), + H.264 10 s /
//    60 s / 720p / 320×180 (GOP 30), + VP9 30 s GOP 30. Tất cả testsrc2
//    30 fps, encode bằng ffmpeg, ở /tmp/m4/clips (KHÔNG stage binary).
//  - Vị trí seek: 10% / 50% / 90% duration (g250: 3 s / 15 s / 27 s —
//    cách keyframe trước lần lượt 3 s / 6,67 s / 2 s → tách được giả
//    thuyết (a) ngay trong một clip).
//  - Chế độ: đang phát (trường hợp app — preview seek trong lúc phát)
//    là chính; paused chỉ đo trên g30/g250 để đối chứng.
//  - Giảm thiểu (chỉ trên clip tệ nhất g250): (1) pause→seek→play,
//    (2) fastSeek nếu có (typeof check), (3) seek 2 bước: tới keyframe
//    gần nhất trước target rồi mới tới target (keyframe lấy bằng ffprobe).
//    Chỉ giữ cách nào cải thiện ĐO ĐƯỢC (so trung vị cùng vị trí).
//  - Đối chứng Chromium: g30 + g250 × 3 vị trí (đang phát).
// Đo mỗi seek: ms tới sự kiện `seeked` + ms tới khi seeking=false và
// |ct-target| < 0,15 (poll 25 ms), timeout 20 s/seek. Ghi cả loadavg.
// Chạy: xvfb-run -a node benchmarks/render/webkit_seek_latency_85m4.mjs
// Env: M4_SEEK_ENGINE (webkit|chromium|both, mặc định webkit),
//   M4_SEEK_CLIP_DIR (mặc định /tmp/m4/clips).
// KHÔNG sửa file sản phẩm, KHÔNG push/tag.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const FULL = "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
const CLIP_DIR = process.env.M4_SEEK_CLIP_DIR || "/tmp/m4/clips";
const PORT = 8899;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-seek-latency-85m4.json");
const ENGINE = process.env.M4_SEEK_ENGINE || "webkit";
const SEEK_TIMEOUT_MS = 20000;

const CLIPS = [
  { id: "h264_30s_g12_640", file: "w6_h264_30s_g12_640.mp4", codec: "h264", dur: 30, gop: 12, res: "640x360" },
  { id: "h264_30s_g30_640", file: "w6_h264_30s_g30_640.mp4", codec: "h264", dur: 30, gop: 30, res: "640x360" },
  { id: "h264_30s_g250_640", file: "w6_h264_30s_g250_640.mp4", codec: "h264", dur: 30, gop: 250, res: "640x360" },
  { id: "h264_10s_g30_640", file: "w6_h264_10s_g30_640.mp4", codec: "h264", dur: 10, gop: 30, res: "640x360" },
  { id: "h264_60s_g30_640", file: "w6_h264_60s_g30_640.mp4", codec: "h264", dur: 60, gop: 30, res: "640x360" },
  { id: "h264_30s_g30_720", file: "w6_h264_30s_g30_720.mp4", codec: "h264", dur: 30, gop: 30, res: "1280x720" },
  { id: "h264_30s_g30_320", file: "w6_h264_30s_g30_320.mp4", codec: "h264", dur: 30, gop: 30, res: "320x180" },
  { id: "vp9_30s_g30_640", file: "w6_vp9_30s_g30_640.webm", codec: "vp9", dur: 30, gop: 30, res: "640x360" },
];
const POS_FRAC = [0.1, 0.5, 0.9];

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

/** Keyframe timestamps (giây) của một clip, qua ffprobe. */
function keyframesOf(file) {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "frame=key_frame,best_effort_timestamp_time", "-of", "csv=p=0", path.join(CLIP_DIR, file)], { encoding: "utf8", timeout: 120000 });
    return out.split("\n").map((l) => l.split(",")).filter((p) => p[0] === "1").map((p) => +p[1]).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/**
 * Một ca seek trên element thô: nạp clip, phát (hoặc pause theo mode),
 * rồi seek lần lượt tới các vị trí; mỗi seek đo ms tới `seeked` và ms
 * tới khi settled (|ct-target| < 0,15 và !seeking). Trả dữ liệu thô.
 */
async function seekCase(page, clipUrl, positions, opts) {
  return await page.evaluate(async ({ clipUrl, positions, opts }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const fastSeekType = typeof v.fastSeek;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (cond, timeoutMs) => {
      const t0 = performance.now();
      while (performance.now() - t0 < timeoutMs) {
        if (cond()) return performance.now() - t0;
        await sleep(25);
      }
      return null;
    };
    try {
      await Promise.race([
        new Promise((res, rej) => { v.addEventListener("loadedmetadata", res, { once: true }); v.addEventListener("error", () => rej(new Error("load-error")), { once: true }); }),
        sleep(15000).then(() => { throw new Error("metadata-timeout"); }),
      ]);
    } catch (e) {
      const out0 = { duration: v.duration, fastSeekType, error: String(e && e.message), seeks: [] };
      v.pause(); v.remove(); v.src = "";
      return out0;
    }
    const dur = v.duration;
    if (opts.mode === "playing") {
      try { await v.play(); } catch {}
      await waitFor(() => v.currentTime > 0.2 && !v.paused, 10000);
    }
    const seeks = [];
    for (const pos of positions) {
      const target = +(pos * dur).toFixed(3);
      const t0 = performance.now();
      let seekedMs = null;
      let settledMs = null;
      let method = opts.method || "currentTime";
      const seekedP = new Promise((res) => {
        const h = () => { seekedMs = performance.now() - t0; v.removeEventListener("seeked", h); res(); };
        v.addEventListener("seeked", h);
        setTimeout(() => { v.removeEventListener("seeked", h); res(); }, opts.timeoutMs || 20000);
      });
      if (method === "fastSeek" && typeof v.fastSeek === "function") {
        v.fastSeek(target);
      } else if (method === "keyframe-first" && opts.keyframes && opts.keyframes.length) {
        // Bước 1: tới keyframe gần nhất ≤ target; chờ seeked; bước 2: tới target.
        let kf = 0;
        for (const k of opts.keyframes) if (k <= target) kf = k;
        v.currentTime = kf;
        await seekedP;
        // Bước 2: đo lại từ đây (t0 giữ nguyên — tổng thời gian 2 bước).
        const seekedP2 = new Promise((res) => {
          const h = () => { seekedMs = performance.now() - t0; v.removeEventListener("seeked", h); res(); };
          v.addEventListener("seeked", h);
          setTimeout(() => { v.removeEventListener("seeked", h); res(); }, opts.timeoutMs || 20000);
        });
        v.currentTime = target;
        await seekedP2;
      } else if (method === "pause-seek-play") {
        v.pause();
        v.currentTime = target;
        await seekedP;
        const p = v.play(); if (p) p.catch(() => {});
      } else {
        v.currentTime = target;
      }
      if (method !== "keyframe-first") await seekedP;
      settledMs = await waitFor(() => !v.seeking && Math.abs(v.currentTime - target) < 0.15, 20000);
      seeks.push({
        target, method,
        seekedMs: seekedMs === null ? null : +seekedMs.toFixed(0),
        settledMs: settledMs === null ? null : +settledMs.toFixed(0),
        ctAfter: +v.currentTime.toFixed(3),
        seekingAfter: v.seeking, pausedAfter: v.paused,
        timeout: seekedMs === null || settledMs === null,
      });
      await sleep(500);
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { duration: dur, fastSeekType, seeks,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null };
    v.pause(); v.remove(); v.src = "";
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
  const out = { engine: engineName, loadStart: os.loadavg(), cases: {} };
  const kfG250 = keyframesOf("w6_h264_30s_g250_640.mp4");
  out.keyframesG250 = kfG250;
  try {
    // Ma trận chính (đang phát, 1 rep): mọi clip × 3 vị trí.
    for (const c of CLIPS) {
      if (engineName === "chromium" && !(c.id === "h264_30s_g30_640" || c.id === "h264_30s_g250_640")) continue;
      const raw = await seekCase(page, `${BASE}/${c.file}`, POS_FRAC, { mode: "playing" });
      out.cases[`${c.id}|playing|rep1`] = { clip: c.id, mode: "playing", method: "currentTime", raw };
      console.log(`[${engineName}] ${c.id} playing: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms/settled ${s.settledMs}ms${s.timeout ? " TIMEOUT" : ""}`).join(" | "));
    }
    if (engineName === "webkit") {
      // GOP A/B thêm 2 rep (đang phát): g12/g30/g250.
      for (const c of CLIPS.filter((x) => x.gop === 12 || x.gop === 30 || x.gop === 250)) {
        if (c.dur !== 30 || c.codec !== "h264" || c.res !== "640x360") continue;
        for (let rep = 2; rep <= 3; rep++) {
          const raw = await seekCase(page, `${BASE}/${c.file}`, POS_FRAC, { mode: "playing" });
          out.cases[`${c.id}|playing|rep${rep}`] = { clip: c.id, mode: "playing", method: "currentTime", raw };
          console.log(`[${engineName}] ${c.id} playing rep${rep}: ` + raw.seeks.map((s) => `${s.target}s→${s.settledMs}ms`).join(" | "));
        }
      }
      // Paused: g30 + g250.
      for (const c of CLIPS.filter((x) => x.id === "h264_30s_g30_640" || x.id === "h264_30s_g250_640")) {
        const raw = await seekCase(page, `${BASE}/${c.file}`, POS_FRAC, { mode: "paused" });
        out.cases[`${c.id}|paused|rep1`] = { clip: c.id, mode: "paused", method: "currentTime", raw };
        console.log(`[${engineName}] ${c.id} paused: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms/settled ${s.settledMs}ms`).join(" | "));
      }
      // Giảm thiểu trên clip tệ nhất (g250): 3 cách × 3 vị trí × 2 rep.
      const worst = CLIPS.find((x) => x.id === "h264_30s_g250_640");
      for (const method of ["pause-seek-play", "fastSeek", "keyframe-first"]) {
        for (let rep = 1; rep <= 2; rep++) {
          const raw = await seekCase(page, `${BASE}/${worst.file}`, POS_FRAC, { mode: "playing", method, keyframes: kfG250 });
          out.cases[`${worst.id}|playing|${method}|rep${rep}`] = { clip: worst.id, mode: "playing", method, raw };
          console.log(`[${engineName}] ${worst.id} ${method} rep${rep}: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms/settled ${s.settledMs}ms${s.timeout ? " TIMEOUT" : ""}`).join(" | "));
        }
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
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
    // Tóm tắt trung vị settled theo clip (playing, currentTime, WebKit).
    const summary = {};
    for (const [k, c] of Object.entries(results.engines.webkit?.cases || {})) {
      if (!k.includes("|playing|") || !k.endsWith("rep1") && !c.method) continue;
      if (c.method !== "currentTime" || c.mode !== "playing") continue;
      const vals = c.raw.seeks.map((s) => s.settledMs);
      summary[c.clip] = { medianSettledMs: median(vals), settledMs: vals, seekedMs: c.raw.seeks.map((s) => s.seekedMs), timeouts: c.raw.seeks.filter((s) => s.timeout).length };
    }
    results.summary = summary;
    results.finishedAt = new Date().toISOString();
    writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
    console.log(`XONG — kết quả thô: ${OUT}`);
    console.log(JSON.stringify(summary, null, 2));
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
