#!/usr/bin/env node
/**
 * measure-65r8-decode-idle.mjs — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8):
 * đo LẠI decode 720p lúc LẶNG, lặp nhiều lần để thấy dao động theo tải VM.
 *
 * Nợ gốc (R64 R3 §4.1/§7): decode long720 đo được 15.54 fps (dropped 29%)
 * lúc load 4.9–7.2, trong khi long1080 đo lúc lặng hơn lại 24.15 fps —
 * 1080p "tốt hơn" 720p là do tải, không phải độ phân giải. Đợt này đo
 * lại 720p trong cửa sổ lặng để tách hiệu ứng tải khỏi giới hạn decode.
 *
 * Phương pháp (kế thừa measure-64r3-decode-only.mjs):
 * - Tab trắng, video element 640×360 VISIBLE, requestVideoFrameCallback
 *   10s tại 3 vị trí seek (0/5/10s) — phủ hết clip 20s.
 * - Trước mỗi REP: chờ cửa sổ lặng (load1 < R8_MAX_LOAD1, mặc định 1.5,
 *   tối đa R8_WAIT_QUIET_SECS giây/rep); hết thời gian chờ vẫn đo nhưng
 *   ghi cờ quiet=false + loadavg thật — KHÔNG bịa "lặng".
 * - Mỗi hàng ghi loadavg trước/sau; presentedFps = ΔtotalVideoFrames /
 *   wallSecs từ getVideoPlaybackQuality (tab trắng, element hiển thị
 *   nên totalVideoFrames phải tăng theo frame trình chiếu — đối chứng
 *   cho phép đo presented trong app ở measure-65r8-presented-fps.mjs,
 *   nơi element pool KHÔNG gắn DOM).
 *
 * Chạy (từ gốc repo):
 *   node apps/web/scripts/measure-65r8-decode-idle.mjs
 * Env: R8_DECODE_REPS (mặc định 5), R8_DECODE_SECS (mặc định 10),
 *   R8_MAX_LOAD1 (mặc định 1.5), R8_WAIT_QUIET_SECS (mặc định 180),
 *   R8_DECODE_OUT (mặc định hidden_files/round65-r8/decode-720-idle.json).
 * Exit 0 khi xong (kể cả khi không lặng được — kết quả vẫn ghi kèm cờ),
 * 2 khi harness lỗi. KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const LONG_FILE = "long720.mp4";
const REPS = Math.max(1, Number(process.env.R8_DECODE_REPS || 5));
const SECS = Math.max(3, Number(process.env.R8_DECODE_SECS || 10));
const MAX_LOAD1 = Number(process.env.R8_MAX_LOAD1 || 1.5);
const WAIT_QUIET_SECS = Math.max(0, Number(process.env.R8_WAIT_QUIET_SECS || 180));
const OUT_DIR = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round65-r8");
const OUT = process.env.R8_DECODE_OUT || path.join(OUT_DIR, "decode-720-idle.json");
const LOG = path.join(OUT_DIR, "decode-720-idle.log");
const PROFILE = "/tmp/round65-r8/decode-profile";
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = findChrome() || (() => { throw new Error("không thấy chrome trong ~/.cache/ms-playwright"); })();
const logLines = [];
function log(...a) {
  const l = `[${new Date().toISOString()}] ${a.join(" ")}`;
  logLines.push(l);
  console.log(l);
}
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function load1() {
  try { return Number(fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ")[0]); }
  catch { return NaN; }
}
async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout 120s: ${method}`)); }, 120000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
}

// Như DECODE_FPS_FN của R64, thêm presentedFps = ΔtotalVideoFrames/wall
// (element tab trắng VISIBLE nên totalVideoFrames phải tăng; đây là
// đối chứng cho phép đo presented trong app — xem script presented-fps).
const DECODE_FPS_FN = (videoUrl, seekTo, secs) => `(async () => {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
  v.style.width = "640px"; v.style.height = "360px";
  document.body.appendChild(v);
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  await new Promise((res) => { v.onseeked = res; v.currentTime = ${seekTo}; });
  const q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  let frames = 0, t0 = 0, t1 = 0, firstMedia = 0, lastMedia = 0, ended = false;
  await new Promise((res) => {
    let done = false;
    const finish = () => { if (!done) { done = true; res(); } };
    v.onended = () => { ended = true; finish(); };
    setTimeout(finish, (${secs} + 5) * 1000);
    const cb = (now, meta) => {
      if (frames === 0) { t0 = now; firstMedia = meta.mediaTime; }
      frames++; t1 = now; lastMedia = meta.mediaTime;
      if (t1 - t0 < ${secs} * 1000 && !v.ended) v.requestVideoFrameCallback(cb);
      else finish();
    };
    v.requestVideoFrameCallback(cb);
    v.play();
  });
  await new Promise((r) => setTimeout(r, 200));
  v.pause();
  const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  const wallSecs = (t1 - t0) / 1000;
  const total = q1 ? q1.totalVideoFrames - (q0 ? q0.totalVideoFrames : 0) : null;
  const dropped = q1 ? q1.droppedVideoFrames - (q0 ? q0.droppedVideoFrames : 0) : null;
  return { frames, wallSecs: +wallSecs.toFixed(3),
    fps: +((frames - 1) / wallSecs).toFixed(2),
    presentedFps: total === null ? null : +(total / wallSecs).toFixed(2),
    droppedFps: dropped === null ? null : +(dropped / wallSecs).toFixed(2),
    mediaRate: +((lastMedia - firstMedia) / wallSecs).toFixed(3),
    dropped, total,
    presentedCum: q1 ? q1.totalVideoFrames : null, ended };
})()`;

async function waitQuiet() {
  const t0 = Date.now();
  let waited = 0;
  while (Date.now() - t0 < WAIT_QUIET_SECS * 1000) {
    const l1 = load1();
    if (!Number.isNaN(l1) && l1 < MAX_LOAD1) return { quiet: true, waitedSecs: +((Date.now() - t0) / 1000).toFixed(1), loadAtStart: loadAvg() };
    waited = (Date.now() - t0) / 1000;
    await sleep(5000);
  }
  return { quiet: false, waitedSecs: +waited.toFixed(1), loadAtStart: loadAvg() };
}

async function main() {
  let server = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  };
  process.on("exit", killAll);
  try {
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 190; n <= 199; n++) {
        const d = `:${n}`;
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = await pickDisplay();
    if (!DISPLAY) throw new Error("hết display trống :190–:199");
    const PORT = await pickFreePort(5790, 5799);
    const DEBUG_PORT = await pickFreePort(9670, 9679);
    if (!PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
    if (!fs.existsSync(path.join(MEDIA_DIR, LONG_FILE))) throw new Error(`không thấy media fixture ${LONG_FILE} ở ${MEDIA_DIR}`);
    server = http.createServer((req, res) => {
      const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "");
      const fp = path.join(MEDIA_DIR, name);
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (!name || name.includes("..") || !fs.existsSync(fp)) { res.statusCode = 404; res.end("nf"); return; }
      res.setHeader("Content-Type", name.endsWith(".png") ? "image/png" : "video/mp4");
      fs.createReadStream(fp).pipe(res);
    });
    await new Promise((res) => server.listen(PORT, "127.0.0.1", res));
    log(`http :${PORT}, debug :${DEBUG_PORT}, display ${DISPLAY}, clip ${LONG_FILE}, reps=${REPS}, secs=${SECS}, ngưỡng lặng load1<${MAX_LOAD1} (chờ tối đa ${WAIT_QUIET_SECS}s/rep), load lúc bắt đầu ${loadAvg()}`);
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    {
      const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) {
        if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
        else await sleep(500);
      }
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s (socket ${sock} chưa có)`);
    }
    fs.mkdirSync("/tmp/round65-r8/tmp", { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: "ignore", env: { ...process.env, DISPLAY, TMPDIR: "/tmp/round65-r8/tmp" } });
    let pageTarget = null;
    for (let i = 0; i < 120 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error("không lấy được page target CDP");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.bringToFront");
    await sleep(1000);
    const U = (f) => `http://127.0.0.1:${PORT}/${f}`;
    const stats = (arr) => {
      const mean = arr.reduce((a, v) => a + v, 0) / arr.length;
      const sd = Math.sqrt(arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length);
      return { mean: +mean.toFixed(2), min: Math.min(...arr), max: Math.max(...arr), std: +sd.toFixed(2), n: arr.length };
    };
    const reps = [];
    for (let rep = 1; rep <= REPS; rep++) {
      const w = await waitQuiet();
      log(`REP ${rep}: chờ lặng ${w.waitedSecs}s → quiet=${w.quiet}, load lúc bắt đầu rep ${w.loadAtStart}`);
      const rows = [];
      for (const seekTo of [0, 5, 10]) {
        const loadBefore = loadAvg();
        const d = await cdp.evalJs(DECODE_FPS_FN(U(LONG_FILE), seekTo, SECS));
        const loadAfter = loadAvg();
        rows.push({ rep, seek: seekTo, ...d, loadBefore, loadAfter });
        log(`DECODE rep ${rep} seek ${seekTo}s: rVFC ${d.fps} fps, presented ${d.presentedFps} fps (Δtotal ${d.total}/${d.wallSecs}s), dropped ${d.dropped} (${d.droppedFps} fps), mediaRate ${d.mediaRate}x, load ${loadBefore} → ${loadAfter}`);
      }
      const repAgg = {
        rep, quiet: w.quiet, waitedSecs: w.waitedSecs, loadAtStart: w.loadAtStart,
        fps: stats(rows.map((r) => r.fps)),
        presentedFps: stats(rows.map((r) => r.presentedFps)),
        droppedTotal: rows.reduce((a, r) => a + (r.dropped || 0), 0),
        presentedTotal: rows.reduce((a, r) => a + (r.total || 0), 0),
      };
      log(`REP ${rep} TỔNG: rVFC fps mean ${repAgg.fps.mean} (min ${repAgg.fps.min}, max ${repAgg.fps.max}, std ${repAgg.fps.std}); presentedFps mean ${repAgg.presentedFps.mean} (min ${repAgg.presentedFps.min}, max ${repAgg.presentedFps.max}); dropped ${repAgg.droppedTotal}/${repAgg.presentedTotal}; quiet=${w.quiet}`);
      reps.push({ ...repAgg, rows });
    }
    const allRows = reps.flatMap((r) => r.rows);
    const agg = {
      fps: stats(allRows.map((r) => r.fps)),
      presentedFps: stats(allRows.map((r) => r.presentedFps)),
      mediaRate: stats(allRows.map((r) => r.mediaRate)),
      droppedTotal: allRows.reduce((a, r) => a + (r.dropped || 0), 0),
      presentedTotal: allRows.reduce((a, r) => a + (r.total || 0), 0),
      quietReps: reps.filter((r) => r.quiet).length,
    };
    log(`TỔNG ${REPS} rep (${allRows.length} hàng): rVFC fps mean ${agg.fps.mean} min ${agg.fps.min} max ${agg.fps.max} std ${agg.fps.std}; presentedFps mean ${agg.presentedFps.mean} min ${agg.presentedFps.min} max ${agg.presentedFps.max} std ${agg.presentedFps.std}; dropped ${agg.droppedTotal}/${agg.presentedTotal}; rep lặng ${agg.quietReps}/${REPS}`);
    log(`SO VỚI R64: decode 720p lúc tải 4.9–7.2 là 15.54 fps (dropped 29%) — số mới ở trên đo kèm loadavg từng hàng, xem JSON để tách tải khỏi giới hạn decode.`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    writeFileEpermRetry(OUT, JSON.stringify({ clip: LONG_FILE, reps: REPS, secs: SECS, maxLoad1: MAX_LOAD1, waitQuietSecs: WAIT_QUIET_SECS, repsDetail: reps, aggregate: agg }, null, 2));
    writeFileEpermRetry(LOG, logLines.join("\n") + "\n");
    log(`đã ghi ${OUT} + ${LOG}`);
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { fs.mkdirSync(OUT_DIR, { recursive: true }); writeFileEpermRetry(LOG, logLines.join("\n") + "\n"); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
