#!/usr/bin/env node
/**
 * measure-64r3-decode-only.mjs — Phase 9 đợt 64, luồng R3: đo LẠI FPS
 * decode riêng (rVFC, tab trắng) cho long1080 sau khi lần chạy
 * fps-long 1080p chết ở decode seek-10 (video chạm cuối clip 20s →
 * rVFC ngừng bắn → promise treo → CDP timeout 60s; DECODE_FPS_FN đã
 * vá guard 'ended' + timeout tường — xem clicktest-64r3-fps-long.mjs).
 *
 * Đo cả 3 vị trí seek (0/5/10s, cửa sổ 10s) trong CÙNG 1 phiên để số
 * so sánh được với nhau; ghi JSON + log. Chỉ đo decode, không đụng app.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/measure-64r3-decode-only.mjs
 * Env: R3_DECODE_RES (720|1080, mặc định 1080), R3_DECODE_OUT (mặc định
 * hidden_files/round64-r3/decode-fps-1080.json). Exit 0 khi xong.
 * KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const RES = process.env.R3_DECODE_RES === "720" ? "720" : "1080";
const LONG_FILE = RES === "1080" ? "long1080.mp4" : "long720.mp4";
const OUT = process.env.R3_DECODE_OUT || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round64-r3", `decode-fps-${RES}.json`);
const PROFILE = "/tmp/round64-r3/decode-profile";
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
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
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

// FPS decode riêng — bản đã vá guard 'ended' + timeout tường (sao chép
// DECODE_FPS_FN của clicktest-64r3-fps-long.mjs sau khi vá).
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
  return { frames, wallSecs: +wallSecs.toFixed(3),
    fps: +((frames - 1) / wallSecs).toFixed(2),
    mediaRate: +((lastMedia - firstMedia) / wallSecs).toFixed(3),
    dropped: q1 ? q1.droppedVideoFrames - (q0 ? q0.droppedVideoFrames : 0) : null,
    total: q1 ? q1.totalVideoFrames - (q0 ? q0.totalVideoFrames : 0) : null,
    presented: q1 ? q1.totalVideoFrames : null, ended };
})()`;

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
    server = http.createServer((req, res) => {
      const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "");
      const fp = path.join(MEDIA_DIR, name);
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (!name || name.includes("..") || !fs.existsSync(fp)) { res.statusCode = 404; res.end("nf"); return; }
      res.setHeader("Content-Type", name.endsWith(".png") ? "image/png" : "video/mp4");
      fs.createReadStream(fp).pipe(res);
    });
    await new Promise((res) => server.listen(PORT, "127.0.0.1", res));
    log(`http :${PORT}, debug :${DEBUG_PORT}, display ${DISPLAY}, clip ${LONG_FILE}, load ${loadAvg()}`);
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
    fs.mkdirSync("/tmp/round64-r3/tmp", { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: "ignore", env: { ...process.env, DISPLAY, TMPDIR: "/tmp/round64-r3/tmp" } });
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
    const rows = [];
    for (const seekTo of [0, 5, 10]) {
      const d = await cdp.evalJs(DECODE_FPS_FN(U(LONG_FILE), seekTo, 10));
      rows.push({ seek: seekTo, ...d, load: loadAvg() });
      log(`DECODE ${LONG_FILE} seek ${seekTo}s: ${d.fps} fps (frame rVFC ${d.frames}/${d.wallSecs}s), mediaRate ${d.mediaRate}x, dropped ${d.dropped}/${d.total}, ended=${d.ended}, load ${loadAvg()}`);
    }
    const stats = (arr) => {
      const mean = arr.reduce((a, v) => a + v, 0) / arr.length;
      const sd = Math.sqrt(arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length);
      return { mean: +mean.toFixed(2), min: Math.min(...arr), max: Math.max(...arr), std: +sd.toFixed(2), n: arr.length };
    };
    const agg = { fps: stats(rows.map((r) => r.fps)), mediaRate: stats(rows.map((r) => r.mediaRate)), droppedTotal: rows.reduce((a, r) => a + (r.dropped || 0), 0), presentedTotal: rows.reduce((a, r) => a + (r.presented || 0), 0) };
    log(`DECODE SPREAD ${LONG_FILE}: fps mean ${agg.fps.mean} min ${agg.fps.min} max ${agg.fps.max} std ${agg.fps.std} (n=3 vị trí); dropped tổng ${agg.droppedTotal}/${agg.presentedTotal}`);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ res: RES, clip: LONG_FILE, rows, aggregate: agg }, null, 2));
    log(`đã ghi ${OUT}`);
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
