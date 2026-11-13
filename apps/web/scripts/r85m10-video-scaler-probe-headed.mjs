#!/usr/bin/env node
/**
 * r85m10-video-scaler-probe-headed.mjs — Phase 9 đợt 85, luồng M10: probe
 * scaler video kiểu J2 nhưng với NGUỒN VIDEO thật (nợ L5 đợt 84 §7 mục 1).
 *
 * J2 đo toán tử drawImage upscale trên mẫu putImageData (canvas→canvas =
 * Mitchell, MAD 0,000–0,003). L5 chứng minh đường plain (video→viewport
 * trực tiếp) LỆCH Mitchell 5,61/4,25 trong khi đường sharp (video→effect
 * canvas 1:1 rồi canvas→canvas) KHỚP Mitchell 0,000–0,013 — delta lineart
 * 5,39/4,05 nằm ở khâu upscale VIDEO của đường plain. Probe này tách khâu:
 *   (decode)  S0 = drawImage video→native 1:1 (so offline với ffmpeg);
 *   (scale)   Bview = drawImage video→viewport trực tiếp (đường plain);
 *   (two-step) C2 = video→native canvas rồi canvas→viewport (ứng viên sửa:
 *             cùng 2 chặng như đường sharp; kỳ vọng ≈ Mitchell(S0));
 *   (app-geom) Bapp/C2app = như trên nhưng dưới đúng transform vp.scale
 *             + căn giữa của app (scale 1,2638889, offX 0,0556 — L5 §2);
 *   (sweep)   video xung dọc/ngang: mỗi frame 1 vị trí xung, seek từng
 *             frame, đọc đáp ứng xung của scaler video (kiểu J2 §2.3).
 * Trang probe TRẦN (không qua app VCut) — chỉ còn video element +
 * drawImage; decode/scale/color-convert tách được sạch.
 *
 * Chạy (từ gốc repo):
 *   node apps/web/scripts/r85m10-video-scaler-probe-headed.mjs
 * Env: R85M10_DISPLAY (:170–:179), R85M10_DEBUG_PORT (9770–9779),
 *   R85M10_HTTP_PORT (5670–5679), R85M10_OUT (mặc định
 *   hidden_files/round85-m10/r85m10-probe.json).
 * Exit 0 khi mọi capture xong, 1 có capture FAIL, 2 harness lỗi.
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const OUT_DIR = path.join(GOAL, "round85-m10");
const MEDIA = path.join(OUT_DIR, "media");
const G5MEDIA = path.join(GOAL, "round79-g5", "media");
const H3MEDIA = path.join(GOAL, "round80-h3", "media");
const OUT = process.env.R85M10_OUT || path.join(OUT_DIR, "r85m10-probe.json");
const CHROME = process.env.R85M10_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");

// Hình học app thật (L5 §2): snapshot 809x455, rect.scale = 1,2638889,
// offX = (809 - 640*1,2638889)/2 = 0,0556, offY = 0.
const APP_SCALE = 809 / 640 > 455 / 360 ? 455 / 360 : 809 / 640; // min(809/640, 455/360) = 455/360
const APP_OFFX = (809 - 640 * APP_SCALE) / 2;
const SCALES = {
  s1264: { w: 809, h: 455 },
  s2000: { w: 1280, h: 720 },
  s0632: { w: 405, h: 228 },
};

const STATIC_SOURCES = [
  { name: "step-640", url: "/m10/step-640.mp4", t: 0 },
  { name: "impulse-red-640", url: "/m10/impulse-red-640.mp4", t: 0 },
  { name: "impulse-v-640-f320", url: "/m10/impulse-v-640.mp4", t: 320 / 30 },
  { name: "impulse-h-640-f180", url: "/m10/impulse-h-640.mp4", t: 180 / 30 },
  { name: "lineart640", url: "/g5/lineart-640.mp4", t: 1.0 },
  { name: "lineart2px-640", url: "/h3/lineart2px-640.mp4", t: 1.0 },
  { name: "sqw4-640", url: "/h3/sqw4-640.mp4", t: 1.0 },
];
const CAPTURE_KINDS = ["native", "direct1264", "two1264", "app1264", "apptwo1264", "direct2000", "two2000", "direct0632", "two0632"];

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

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
  async send(method, params = {}, timeoutMs = 120000) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout ${timeoutMs / 1000}s: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression, timeoutMs = 300000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
}

const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r85m10 probe</title></head>
<body><script>
const W = 640, H = 360;
const APP_SCALE = ${APP_SCALE};
const APP_OFFX = ${APP_OFFX};
function b64encode(u8) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(s);
}
function rgb24b64(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data;
  const rgb = new Uint8Array(w * h * 3);
  let sum = 0;
  for (let i = 0; i < w * h; i++) { rgb[i*3] = d[i*4]; rgb[i*3+1] = d[i*4+1]; rgb[i*3+2] = d[i*4+2]; sum += d[i*4] + d[i*4+1] + d[i*4+2]; }
  return { w, h, mean: +(sum / (w * h * 3)).toFixed(2), rgbB64: b64encode(rgb) };
}
function mkCanvas(w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  return { c, x };
}
const M = window.__m10 = { v: null, native: null };
function ensureVideo() {
  if (!M.v) {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.playsInline = true;
    v.style.display = "none";
    document.body.appendChild(v);
    M.v = v;
  }
  return M.v;
}
function ensureNative() {
  if (!M.native) { const { c, x } = mkCanvas(W, H); M.native = { c, x }; }
  return M.native;
}
window.__m10load = async (url) => {
  const v = ensureVideo();
  await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error("load timeout " + url)), 60000);
    v.onloadedmetadata = () => { clearTimeout(to); res(); };
    v.onerror = () => { clearTimeout(to); rej(new Error("video error " + url)); };
    v.src = url; v.load();
  });
  return { w: v.videoWidth, h: v.videoHeight, duration: +v.duration.toFixed(3) };
};
window.__m10seek = async (t) => {
  const v = ensureVideo();
  await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error("seek timeout t=" + t)), 15000);
    v.onseeked = () => { clearTimeout(to); res(); };
    v.onerror = () => { clearTimeout(to); rej(new Error("video error on seek")); };
    v.currentTime = t;
  });
  return { currentTime: +v.currentTime.toFixed(4), readyState: v.readyState, paused: v.paused };
};
function drawNative() {
  const v = ensureVideo();
  const { c, x } = ensureNative();
  x.drawImage(v, 0, 0, W, H);
  return { c, x };
}
window.__m10cap = (kind) => {
  const v = ensureVideo();
  if (!v.videoWidth) return { ok: false, reason: "video chưa load" };
  const S = { s1264: [809, 455], s2000: [1280, 720], s0632: [405, 228] };
  let out;
  if (kind === "native") {
    const { c, x } = drawNative();
    out = rgb24b64(x, W, H);
  } else if (kind === "direct1264" || kind === "direct2000" || kind === "direct0632") {
    const [dw, dh] = S["s" + kind.slice(6)];
    const { x } = mkCanvas(dw, dh);
    x.drawImage(v, 0, 0, dw, dh);
    out = rgb24b64(x, dw, dh);
  } else if (kind === "two1264" || kind === "two2000" || kind === "two0632") {
    const [dw, dh] = S["s" + kind.slice(3)];
    const { c } = drawNative();
    const { x } = mkCanvas(dw, dh);
    x.drawImage(c, 0, 0, dw, dh);
    out = rgb24b64(x, dw, dh);
  } else if (kind === "app1264" || kind === "apptwo1264") {
    const { x } = mkCanvas(809, 455);
    x.setTransform(APP_SCALE, 0, 0, APP_SCALE, APP_OFFX, 0);
    if (kind === "app1264") x.drawImage(v, 0, 0, W, H);
    else { const { c } = drawNative(); x.drawImage(c, 0, 0, W, H); }
    out = rgb24b64(x, 809, 455);
  } else return { ok: false, reason: "kind không biết: " + kind };
  return { ok: true, kind, ...out };
};
// Sweep xung: dir "v" (cột dọc x=f, đọc hàng giữa) hoặc "h" (hàng ngang
// y=f, đọc cột giữa). Mỗi frame: seek, S0 window + Bview window (cả 3 kênh).
window.__m10sweep = async (dir, f0, f1) => {
  const v = ensureVideo();
  const frames = [];
  const HALF = 12;
  for (let f = f0; f < f1; f++) {
    const t = f / 30;
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error("seek timeout f=" + f)), 15000);
      v.onseeked = () => { clearTimeout(to); res(); };
      v.onerror = () => { clearTimeout(to); rej(new Error("video error on seek f=" + f)); };
      v.currentTime = t;
    });
    const ct = +v.currentTime.toFixed(4);
    const { c: nc, x: nx } = drawNative();
    let s0win, bvwin;
    if (dir === "v") {
      const d0 = nx.getImageData(Math.max(0, f - HALF), 180, Math.min(2 * HALF + 1, W - Math.max(0, f - HALF)), 1).data;
      const x0 = Math.max(0, f - HALF);
      s0win = { x0, n: d0.length / 4, vals: Array.from(d0) };
      const cx = Math.round((f + 0.5) * 809 / 640);
      const { x: bx } = mkCanvas(809, 455);
      bx.drawImage(v, 0, 0, 809, 455);
      const d1 = bx.getImageData(Math.max(0, cx - HALF), 228, Math.min(2 * HALF + 1, 809 - Math.max(0, cx - HALF)), 1).data;
      bvwin = { x0: Math.max(0, cx - HALF), n: d1.length / 4, vals: Array.from(d1) };
    } else {
      const d0 = nx.getImageData(320, Math.max(0, f - HALF), 1, Math.min(2 * HALF + 1, H - Math.max(0, f - HALF))).data;
      const y0 = Math.max(0, f - HALF);
      s0win = { y0, n: d0.length / 4, vals: Array.from(d0) };
      const cy = Math.round((f + 0.5) * 455 / 360);
      const { x: bx } = mkCanvas(809, 455);
      bx.drawImage(v, 0, 0, 809, 455);
      const d1 = bx.getImageData(405, Math.max(0, cy - HALF), 1, Math.min(2 * HALF + 1, 455 - Math.max(0, cy - HALF))).data;
      bvwin = { y0: Math.max(0, cy - HALF), n: d1.length / 4, vals: Array.from(d1) };
    }
    frames.push({ f, t, ct, s0win, bvwin });
  }
  return { dir, f0, f1, n: frames.length, frames };
};
document.title = "r85m10-ready";
</script></body></html>`;

function serveFile(req, res, file) {
  if (!fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
  // Video cần Range (Chrome load/seek theo byte-range; trả 200 cho Range
  // request làm Chrome treo metadata ở file dài — gặp ở impulse-v-640).
  const size = fs.statSync(file).size;
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : size - 1;
    if (start >= size || end >= size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); res.end(); return; }
    res.writeHead(206, { "content-type": "video/mp4", "accept-ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "content-type": "video/mp4", "accept-ranges": "bytes", "Content-Length": size });
  fs.createReadStream(file).pipe(res);
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let xvfb = null, chrome = null, server = null;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  };
  process.on("exit", killAll);
  try {
    for (const s of STATIC_SOURCES) {
      const root = s.url.startsWith("/m10/") ? MEDIA : s.url.startsWith("/g5/") ? G5MEDIA : H3MEDIA;
      if (!fs.existsSync(path.join(root, path.basename(s.url)))) throw new Error(`không thấy media ${s.url}`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    const HTTP_PORT = Number(process.env.R85M10_HTTP_PORT || 0) || (await pickFreePort(5670, 5679));
    const DEBUG_PORT = Number(process.env.R85M10_DEBUG_PORT || 0) || (await pickFreePort(9770, 9779));
    if (!HTTP_PORT) throw new Error("hết cổng http trống 5670–5679");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9770–9779");
    let display = process.env.R85M10_DISPLAY || null;
    if (!display) {
      for (let n = 170; n <= 179; n++) {
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock}`);
        }
        display = `:${n}`;
        break;
      }
    }
    if (!display) throw new Error("hết display trống :170–:179");
    const WIN_W = 1200, WIN_H = 900;
    log(`http :${HTTP_PORT} debug :${DEBUG_PORT} DISPLAY=${display} APP_SCALE=${APP_SCALE} APP_OFFX=${APP_OFFX}`);

    server = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      if (u === "/probe.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE_HTML); return; }
      if (u.startsWith("/m10/")) return serveFile(req, res, path.join(MEDIA, path.basename(u)));
      if (u.startsWith("/g5/")) return serveFile(req, res, path.join(G5MEDIA, path.basename(u)));
      if (u.startsWith("/h3/")) return serveFile(req, res, path.join(H3MEDIA, path.basename(u)));
      res.writeHead(404); res.end();
    });
    await new Promise((res, rej) => { server.once("error", rej); server.listen(HTTP_PORT, "127.0.0.1", res); });
    log("http server đã lên");

    xvfb = spawn("Xvfb", [display, "-screen", "0", `${WIN_W}x${WIN_H}x24`], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${display} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(OUT_DIR, "r85m10-chrome.log"), "w");
    // Đường dẫn profile/TMPDIR PHẢI NGẮN: Chrome giới hạn độ dài socket
    // Unix SingletonSocket (~108 ký tự) — đường dẫn dài dưới hidden_files
    // làm Chrome FATAL ngay khi khởi động (gặp ở lần chạy đầu).
    const PROFILE = "/tmp/r85m10-prof";
    fs.rmSync(PROFILE, { recursive: true, force: true });
    const SCRATCH_TMP = "/tmp/r85m10-tmp";
    fs.mkdirSync(SCRATCH_TMP, { recursive: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      `--window-size=${WIN_W},${WIN_H}`, "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display, TMPDIR: SCRATCH_TMP } });
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/probe.html` });
    let ready = false;
    for (let i = 0; i < 120 && !ready; i++) {
      ready = await cdp.evalJs(`document.title === "r85m10-ready" && typeof window.__m10cap === "function"`).catch(() => false);
      if (!ready) await sleep(500);
    }
    if (!ready) throw new Error("trang probe không sẵn sau 60 s");
    const ua = await cdp.evalJs(`navigator.userAgent`);
    log(`trang probe đã sẵn — ${ua}`);

    const out = { ua, appScale: APP_SCALE, appOffX: APP_OFFX, scales: SCALES, statics: {}, sweeps: {}, checks: {} };

    // ---- Captures tĩnh ----
    for (const src of STATIC_SOURCES) {
      const t0 = Date.now();
      const meta = await cdp.evalJs(`window.__m10load(${JSON.stringify(src.url)})`);
      const sk = await cdp.evalJs(`window.__m10seek(${src.t})`);
      const caps = {};
      for (const kind of CAPTURE_KINDS) {
        const c = await cdp.evalJs(`window.__m10cap(${JSON.stringify(kind)})`);
        if (!c.ok) throw new Error(`capture ${src.name}/${kind} thất bại: ${c.reason}`);
        caps[kind] = c;
      }
      out.statics[src.name] = { url: src.url, t: src.t, meta, seek: sk, caps };
      log(`static ${src.name}: ${meta.w}x${meta.h} dur=${meta.duration} ct=${sk.currentTime} nativeMean=${caps.native.mean} direct1264Mean=${caps.direct1264.mean} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
    // D1: lặp lại direct1264 của step-640 ở cùng frame → pixel-identical?
    await cdp.evalJs(`window.__m10load("/m10/step-640.mp4")`);
    await cdp.evalJs(`window.__m10seek(0)`);
    const r1 = await cdp.evalJs(`window.__m10cap("direct1264")`);
    const r2 = await cdp.evalJs(`window.__m10cap("direct1264")`);
    if (r1.rgbB64 === r2.rgbB64) pass("D1 direct1264 lặp lại pixel-identical (step-640, cùng frame)", `809x455 mean ${r1.mean}`);
    else fail("D1 direct1264 lặp lại pixel-identical (step-640, cùng frame)", `mean ${r1.mean} vs ${r2.mean}, b64 khác nhau`);
    out.checks.repeat = { identical: r1.rgbB64 === r2.rgbB64 };

    // ---- Sweep xung ----
    await cdp.evalJs(`window.__m10load("/m10/impulse-v-640.mp4")`);
    const sweepV = [];
    for (let f0 = 0; f0 < 640; f0 += 160) {
      const t0 = Date.now();
      const chunk = await cdp.evalJs(`window.__m10sweep("v", ${f0}, ${Math.min(640, f0 + 160)})`);
      sweepV.push(...chunk.frames);
      log(`sweep-v ${f0}..${Math.min(640, f0 + 160) - 1}: ${chunk.n} frame (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
    out.sweeps.v = { dir: "v", n: sweepV.length, frames: sweepV };
    await cdp.evalJs(`window.__m10load("/m10/impulse-h-640.mp4")`);
    const sweepH = [];
    for (let f0 = 0; f0 < 360; f0 += 120) {
      const t0 = Date.now();
      const chunk = await cdp.evalJs(`window.__m10sweep("h", ${f0}, ${Math.min(360, f0 + 120)})`);
      sweepH.push(...chunk.frames);
      log(`sweep-h ${f0}..${Math.min(360, f0 + 120) - 1}: ${chunk.n} frame (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
    out.sweeps.h = { dir: "h", n: sweepH.length, frames: sweepH };

    // D2: seek chính xác — sweep ct phải khớp f/30 trong 2ms.
    const badCt = [...sweepV, ...sweepH].filter((fr) => Math.abs(fr.ct - fr.t) > 0.002);
    if (badCt.length === 0) pass("D2 seek chính xác khung (ct == f/30 trong 2ms, 1000 frame sweep)", `v=${sweepV.length} h=${sweepH.length}`);
    else fail("D2 seek chính xác khung", `${badCt.length}/1000 frame lệch ct, vd f=${badCt[0]?.f} ct=${badCt[0]?.ct} t=${badCt[0]?.t}`);
    out.checks.seekExact = { bad: badCt.length, total: sweepV.length + sweepH.length };

    if (cdp.exceptions.length === 0) pass("H9 0 lỗi trang", "không có Runtime.exceptionThrown");
    else fail("H9 0 lỗi trang", cdp.exceptions.slice(0, 3).join(" || "));

    writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
    log(`đã ghi ${OUT} (${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB)`);
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-probe.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED R85M10: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-probe.log"), logLines.join("\n") + "\n");
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
