#!/usr/bin/env node
/**
 * measure-67u4-mediarate-probe.mjs — Phase 9 đợt 67, luồng U4:
 * giải thích mediaRate app ≈ 1,0x vs tab trắng 0,579x (nợ T5 §7 mục 3 / S8 §7 mục 4).
 *
 * Giả thuyết kiểm chứng (M1): preview `syncMedia` (apps/web/src/preview.tsx)
 * phát seek lại `currentTime = target` mỗi khi |currentTime − target| > 0,35 s
 * (playheadPacing.ts: shouldIssueForwardReseek), target = playhead ≈ wall-clock
 * (phRate ~0,99x). Mỗi cú seek kéo currentTime về phía trước theo đồng hồ
 * tường → ΔcurrentTime/Δwall ≈ 1,0x BẤT KỂ presented fps thấp bao nhiêu.
 * Tab trắng phát tự do: currentTime chỉ tiến theo frame thật sự trình chiếu →
 * decode không kịp thì mediaRate < 1.
 *
 * Thiết kế (tab trắng, cùng clip long1080.mp4 20 s, cùng phiên, đo liền nhau):
 *   A-vis: element VISIBLE, phát tự do, rate 1,0 (đối chứng T5)
 *   A-det: element TÁCH DOM (như MediaPool trong app), phát tự do, rate 1,0
 *   B-vis: VISIBLE + vòng re-anchor mô phỏng syncMedia (drift > 0,35 s → seek về target wall-clock), rate 1,0
 *   B-det: TÁCH DOM + re-anchor (mô phỏng sát nhất preview trong app), rate 1,0
 *   C-vis: VISIBLE, phát tự do, rate 0,5 — mô hình XÁC ĐỊNH của "trình chiếu chậm hơn wall-clock"
 *           (không phụ thuộc tải VM): presented ~15 fps, mediaRate kỳ vọng ~0,5x
 *   D-vis: VISIBLE + re-anchor, rate 0,5 — kiểm chứng nhân quả: NẾU re-anchor
 *           là cơ chế gây ra mediaRate ≈ 1,0x thì D phải cho mediaRate ≈ 1,0x
 *           trong khi presented VẪN ~15 fps như C (frame bị seek nhảy qua).
 *
 * Mỗi điều kiện 10 s: rVFC fps, presented fps (getVideoPlaybackQuality),
 * dropped, mediaRate (từ meta.mediaTime của rVFC + đối chiếu từ
 * element.currentTime đầu/cuối), số lần re-seek, tổng độ nhảy currentTime.
 * KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary. Exit 0 khi đo xong,
 * 2 khi harness lỗi.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const SCRATCH = process.env.U4_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round67-u4", "mediarate-probe");
const SECS = Math.max(3, Number(process.env.U4_PROBE_SECS || 10));
const RES = process.env.U4_PROBE_RES === "720" ? "720" : "1080";
const LONG_FILE = RES === "1080" ? "long1080.mp4" : "long720.mp4";
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
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
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params?.exceptionDetails || {};
        this.exceptions.push(d.exception?.description || d.text || JSON.stringify(d).slice(0, 500));
        return;
      }
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
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout 60s: ${method}`));
      }, 60000);
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

// Một điều kiện đo: tạo <video>, phát `secs` giây, đếm rVFC + quality.
// opts: { visible, reanchor, rate } — reanchor = mô phỏng syncMedia:
// rAF loop, target = media0 + wall/1000, seek khi |ct − target| > 0,35 s.
const COND_FN = (videoUrl, secs, opts) => `(async () => {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
  if (${opts.visible}) { v.style.width = "640px"; v.style.height = "360px"; document.body.appendChild(v); }
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  await new Promise((res) => { v.onseeked = res; v.currentTime = 0; });
  // Đợt 67 U4 (sửa sau lần chạy 1): gán playbackRate SAU seek/load (tránh
  // nghi ngờ gán trước src bị mất) + đọc lại để verify trong kết quả.
  v.playbackRate = ${opts.rate};
  const rateReadback = v.playbackRate;
  const q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  const ct0 = v.currentTime;
  let frames = 0, t0 = 0, t1 = 0, firstMedia = 0, lastMedia = 0, ended = false;
  let reseeks = 0, jumpSum = 0, anchorTicks = 0;
  let rafId = 0;
  const media0 = v.currentTime;
  const wall0 = performance.now();
  const targetAt = () => media0 + (performance.now() - wall0) / 1000;
  // Lấy mẫu currentTime mỗi 50 ms để thấy quỹ đạo (nhảy seek vs trôi mượt).
  const ctTrace = [];
  const traceTimer = setInterval(() => ctTrace.push([+((performance.now() - wall0) / 1000).toFixed(2), +v.currentTime.toFixed(3), v.seeking ? 1 : 0]), 50);
  if (${opts.reanchor}) {
    const tick = () => {
      anchorTicks++;
      const target = targetAt();
      if (!v.seeking && !v.paused && Math.abs(v.currentTime - target) > 0.35) {
        jumpSum += (target - v.currentTime);
        reseeks++;
        v.currentTime = target;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }
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
  cancelAnimationFrame(rafId);
  clearInterval(traceTimer);
  await new Promise((r) => setTimeout(r, 200));
  const ct1 = v.currentTime;
  v.pause();
  const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  const wallSecs = frames >= 2 ? (t1 - t0) / 1000 : null;
  const total = q1 ? q1.totalVideoFrames - (q0 ? q0.totalVideoFrames : 0) : null;
  const dropped = q1 ? q1.droppedVideoFrames - (q0 ? q0.droppedVideoFrames : 0) : null;
  v.remove();
  return { frames, wallSecs: wallSecs === null ? null : +wallSecs.toFixed(3),
    rvfcFps: wallSecs === null ? null : +((frames - 1) / wallSecs).toFixed(2),
    presentedFps: total === null || wallSecs === null ? null : +(total / wallSecs).toFixed(2),
    droppedFps: dropped === null || wallSecs === null ? null : +(dropped / wallSecs).toFixed(2),
    mediaRateRvfc: wallSecs === null ? null : +((lastMedia - firstMedia) / wallSecs).toFixed(3),
    mediaRateCt: +((ct1 - ct0) / ${secs}).toFixed(3),
    ct0: +ct0.toFixed(3), ct1: +ct1.toFixed(3),
    dropped, total, ended, reseeks, jumpSum: +jumpSum.toFixed(3), anchorTicks,
    rateReadback, ctTrace };
})()`;

const ONLY = (process.env.U4_PROBE_ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const CONDITIONS_ALL = [
  { name: "A-vis", visible: true, reanchor: false, rate: 1.0, note: "VISIBLE, tự do, rate 1,0 — đối chứng T5" },
  { name: "A-det", visible: false, reanchor: false, rate: 1.0, note: "TÁCH DOM, tự do, rate 1,0 — loại trừ yếu tố DOM" },
  { name: "B-vis", visible: true, reanchor: true, rate: 1.0, note: "VISIBLE + re-anchor syncMedia, rate 1,0" },
  { name: "B-det", visible: false, reanchor: true, rate: 1.0, note: "TÁCH DOM + re-anchor, rate 1,0 — sát nhất preview app" },
  { name: "C-vis", visible: true, reanchor: false, rate: 0.5, note: "VISIBLE, tự do, rate 0,5 — trình chiếu chậm xác định" },
  { name: "D-vis", visible: true, reanchor: true, rate: 0.5, note: "VISIBLE + re-anchor, rate 0,5 — kiểm chứng nhân quả M1" },
];
const CONDITIONS = ONLY.length ? CONDITIONS_ALL.filter((c) => ONLY.includes(c.name)) : CONDITIONS_ALL;

let xvfb = null, chrome = null, server = null;
const results = [];
async function cleanup() {
  try { if (chrome) chrome.kill("SIGTERM"); } catch {}
  try { if (xvfb) xvfb.kill("SIGTERM"); } catch {}
  try { if (server) await new Promise((r) => server.close(r)); } catch {}
}
process.on("SIGTERM", async () => { await cleanup(); process.exit(2); });
process.on("SIGINT", async () => { await cleanup(); process.exit(2); });

try {
  fs.mkdirSync(SCRATCH, { recursive: true });
  if (!fs.existsSync(path.join(MEDIA_DIR, LONG_FILE))) throw new Error(`không thấy media fixture ${LONG_FILE} ở ${MEDIA_DIR}`);
  const DEBUG_PORT = (await pickFreePort(9650, 9659)) || 0;
  const HTTP_PORT = (await pickFreePort(5760, 5769)) || 0;
  if (!DEBUG_PORT || !HTTP_PORT) throw new Error("hết cổng trống");
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 180; n <= 189; n++) {
      const sock = `/tmp/.X11-unix/X${n}`;
      if (fs.existsSync(sock)) {
        let alive = false;
        try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
        if (alive) continue;
        try { fs.unlinkSync(sock); } catch {}
        try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
        log(`đã dọn socket X mồ côi ${sock}`);
      }
      return `:${n}`;
    }
    return null;
  }
  const DISPLAY = process.env.U4_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  const MEDIA_URL = `http://127.0.0.1:${HTTP_PORT}/${LONG_FILE}`;
  log(`probe mediaRate: clip ${LONG_FILE}, ${SECS}s/điều kiện, 6 điều kiện, loadavg lúc bắt đầu ${loadAvg()}`);

  // HTTP server tĩnh tối giản (hỗ trợ Range để seek được).
  server = http.createServer((req, res) => {
    const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "");
    const fp = path.join(MEDIA_DIR, name);
    if (!name || name.includes("..") || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.statusCode = 404; res.end("not found"); return; }
    const st = fs.statSync(fp);
    const range = req.headers.range;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${st.size}`);
        res.setHeader("Content-Length", String(end - start + 1));
        fs.createReadStream(fp, { start, end }).pipe(res);
        return;
      }
    }
    res.setHeader("Content-Length", String(st.size));
    fs.createReadStream(fp).pipe(res);
  });
  await new Promise((res) => server.listen(HTTP_PORT, "127.0.0.1", res));

  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
  {
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
      else await sleep(500);
    }
    if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s`);
  }
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "u4-probe-chrome.log"), "w");
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
    { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
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

  for (const cond of CONDITIONS) {
    const loadBefore = loadAvg();
    const r = await cdp.evalJs(COND_FN(MEDIA_URL, SECS, cond));
    const loadAfter = loadAvg();
    const row = { ...cond, ...r, loadBefore, loadAfter };
    results.push(row);
    log(`${cond.name} (${cond.note}): rVFC ${r.rvfcFps} fps (frame ${r.frames}/${r.wallSecs}s), presented ${r.presentedFps} fps (Δtotal ${r.total}), dropped ${r.dropped} (${r.droppedFps} fps), mediaRate rVFC ${r.mediaRateRvfc}x / ct ${r.mediaRateCt}x (ct ${r.ct0}→${r.ct1}), rateReadback ${r.rateReadback}, reseeks ${r.reseeks}, jumpSum ${r.jumpSum}s, anchorTicks ${r.anchorTicks}, load ${loadBefore} → ${loadAfter}`);
    // Checkpoint sớm: ghi partial ra đĩa sau mỗi điều kiện (daemon có thể restart).
    writeFileEpermRetry(path.join(SCRATCH, "mediarate-probe.json"), JSON.stringify({ res: RES, secs: SECS, clip: LONG_FILE, results }, null, 2));
    await sleep(500);
  }
  if (cdp.exceptions.length) log(`cảnh báo: ${cdp.exceptions.length} lỗi trang: ${cdp.exceptions.slice(0, 3).join(" | ")}`);
  await cleanup();
  writeFileEpermRetry(path.join(SCRATCH, "mediarate-probe.log"), logLines.join("\n") + "\n");
  log(`PROBE XONG: ${results.length}/${CONDITIONS.length} điều kiện, JSON ${path.join(SCRATCH, "mediarate-probe.json")}`);
  process.exit(0);
} catch (e) {
  log(`HARNESS LỖI: ${e.message}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "mediarate-probe.json"), JSON.stringify({ res: RES, secs: SECS, clip: LONG_FILE, results, error: e.message }, null, 2)); } catch {}
  try { writeFileEpermRetry(path.join(SCRATCH, "mediarate-probe.log"), logLines.join("\n") + "\n"); } catch {}
  await cleanup();
  process.exit(2);
}
