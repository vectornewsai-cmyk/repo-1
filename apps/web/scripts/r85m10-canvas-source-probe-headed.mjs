#!/usr/bin/env node
/**
 * r85m10-canvas-source-probe-headed.mjs — Phase 9 đợt 85, luồng M10
 * (thí nghiệm phân biệt E2): cùng pixel lineart S0, canvas→canvas upscale
 * có phải Mitchell không — hay 1,6 MAD của C2 đến từ (a) nguồn canvas
 * vẽ từ video (thay vì putImageData như J2), (b) canvas đích dùng
 * willReadFrequently:true (canvas chính của app dùng getContext("2d")
 * thường, không willReadFrequently — preview.tsx:3584), (c) nội dung
 * sharpened (S2 của L5) khác nội dung plain?
 *
 * Trang trần: putImageData(S0) rồi drawImage upscale, quét 2x2
 * (src willReadFrequently T/F) x (dst willReadFrequently T/F) trên
 * lineart640 + đối chứng lineart2px/sqw4/step + sharpened + video-drawn.
 * Chạy: node apps/web/scripts/r85m10-canvas-source-probe-headed.mjs
 * Env: R85M10E2_DISPLAY (:171–:179), R85M10E2_DEBUG_PORT (9771–9779),
 *   R85M10E2_HTTP_PORT (5671–5679).
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
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const OUT_DIR = path.join(GOAL, "round85-m10");
const RAW = path.join(OUT_DIR, "raw-s0");
const MEDIA = path.join(OUT_DIR, "media");
const G5MEDIA = path.join(GOAL, "round79-g5", "media");
const H3MEDIA = path.join(GOAL, "round80-h3", "media");
const OUT = path.join(OUT_DIR, "r85m10-e2-probe.json");
const CHROME = process.env.R85M10E2_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");

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

const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r85m10-e2 probe</title></head>
<body><script>
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
function mkCanvas(w, h, wrf) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = wrf ? c.getContext("2d", { willReadFrequently: true }) : c.getContext("2d");
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  return { c, x };
}
// putImageData(rgb) -> drawImage upscale 640x360 -> 809x455.
window.__e2capPut = async (url, srcWrf, dstWrf) => {
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  if (buf.length !== 640 * 360 * 3) return { ok: false, reason: "raw sai kích thước: " + buf.length };
  const { c: sc, x: sx } = mkCanvas(640, 360, srcWrf);
  const img = sx.createImageData(640, 360);
  for (let i = 0; i < 640 * 360; i++) { img.data[i*4] = buf[i*3]; img.data[i*4+1] = buf[i*3+1]; img.data[i*4+2] = buf[i*3+2]; img.data[i*4+3] = 255; }
  sx.putImageData(img, 0, 0);
  const { x: dx } = mkCanvas(809, 455, dstWrf);
  dx.drawImage(sc, 0, 0, 809, 455);
  return { ok: true, ...rgb24b64(dx, 809, 455) };
};
// Đối chứng video-drawn: video -> native canvas (wrf) -> 809x455 (wrf).
// Lặp lại đúng __m10cap("two1264") của probe chính để kiểm tái lập.
window.__e2capVideo = async (url, t) => {
  const v = document.createElement("video");
  v.muted = true; v.preload = "auto"; v.playsInline = true;
  document.body.appendChild(v);
  await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error("load timeout " + url)), 60000);
    v.onloadedmetadata = () => { clearTimeout(to); res(); };
    v.onerror = () => { clearTimeout(to); rej(new Error("video error")); };
    v.src = url; v.load();
  });
  await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error("seek timeout")), 15000);
    v.onseeked = () => { clearTimeout(to); res(); };
    v.currentTime = t;
  });
  const { c: nc, x: nx } = mkCanvas(640, 360, true);
  nx.drawImage(v, 0, 0, 640, 360);
  const native = rgb24b64(nx, 640, 360);
  const { x: dx } = mkCanvas(809, 455, true);
  dx.drawImage(nc, 0, 0, 809, 455);
  v.remove();
  return { ok: true, native, two: rgb24b64(dx, 809, 455) };
};
document.title = "r85m10-e2-ready";
</script></body></html>`;

function serveFile(req, res, file, type) {
  if (!fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
  const size = fs.statSync(file).size;
  const range = req.headers.range;
  if (range && type === "video/mp4") {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : size - 1;
    if (start >= size || end >= size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); res.end(); return; }
    res.writeHead(206, { "content-type": type, "accept-ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "content-type": type, "accept-ranges": "bytes", "Content-Length": size });
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
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    const HTTP_PORT = Number(process.env.R85M10E2_HTTP_PORT || 0) || (await pickFreePort(5671, 5679));
    const DEBUG_PORT = Number(process.env.R85M10E2_DEBUG_PORT || 0) || (await pickFreePort(9771, 9779));
    if (!HTTP_PORT) throw new Error("hết cổng http trống 5671–5679");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9771–9779");
    let display = process.env.R85M10E2_DISPLAY || null;
    if (!display) {
      for (let n = 171; n <= 179; n++) {
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
    if (!display) throw new Error("hết display trống :171–:179");
    log(`http :${HTTP_PORT} debug :${DEBUG_PORT} DISPLAY=${display}`);
    server = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      if (u === "/probe.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE_HTML); return; }
      if (u.startsWith("/raw/")) return serveFile(req, res, path.join(RAW, path.basename(u)), "application/octet-stream");
      if (u.startsWith("/g5/")) return serveFile(req, res, path.join(G5MEDIA, path.basename(u)), "video/mp4");
      res.writeHead(404); res.end();
    });
    await new Promise((res, rej) => { server.once("error", rej); server.listen(HTTP_PORT, "127.0.0.1", res); });
    xvfb = spawn("Xvfb", [display, "-screen", "0", "1200x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${display} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(OUT_DIR, "r85m10-e2-chrome.log"), "w");
    const PROFILE = "/tmp/r85m10e2-prof";
    fs.rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1200,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display, TMPDIR: "/tmp/r85m10e2-tmp" } });
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
      ready = await cdp.evalJs(`document.title === "r85m10-e2-ready" && typeof window.__e2capPut === "function"`).catch(() => false);
      if (!ready) await sleep(500);
    }
    if (!ready) throw new Error("trang probe không sẵn sau 60 s");
    log(`trang probe đã sẵn — ${await cdp.evalJs(`navigator.userAgent`)}`);
    const out = { ua: await cdp.evalJs(`navigator.userAgent`), caps: {} };
    const put = async (name, url, sWrf, dWrf) => {
      const c = await cdp.evalJs(`window.__e2capPut(${JSON.stringify(url)}, ${sWrf}, ${dWrf})`);
      if (!c.ok) throw new Error(`capPut ${name} sWrf=${sWrf} dWrf=${dWrf} thất bại: ${c.reason}`);
      out.caps[`${name}|put|s${sWrf ? 1 : 0}d${dWrf ? 1 : 0}`] = { src: name, kind: "put", srcWrf: sWrf, dstWrf: dWrf, ...c };
      log(`put ${name} sWrf=${sWrf} dWrf=${dWrf}: mean ${c.mean}`);
    };
    // lineart640 2x2 đầy đủ.
    await put("lineart640", "/raw/lineart640.rgb", true, true);
    await put("lineart640", "/raw/lineart640.rgb", true, false);
    await put("lineart640", "/raw/lineart640.rgb", false, true);
    await put("lineart640", "/raw/lineart640.rgb", false, false);
    // Đối chứng nội dung khác + sharpened (cờ mặc định T/T như probe chính).
    await put("lineart2px-640", "/raw/lineart2px-640.rgb", true, true);
    await put("sqw4-640", "/raw/sqw4-640.rgb", true, true);
    await put("step-640", "/raw/step-640.rgb", true, true);
    await put("lineart640-sharp10", "/raw/lineart640-sharp10.rgb", true, true);
    // Đối chứng video-drawn (lặp lại C2 của probe chính).
    const vc = await cdp.evalJs(`window.__e2capVideo("/g5/lineart-640.mp4", 1.0)`);
    if (!vc.ok) throw new Error(`capVideo thất bại`);
    out.caps["lineart640|video|two1264"] = { src: "lineart640", kind: "video-two", native: vc.native, two: vc.two };
    log(`video control lineart640: native mean ${vc.native.mean}, two mean ${vc.two.mean}`);
    // D1: put lặp lại pixel-identical?
    const r1 = await cdp.evalJs(`window.__e2capPut("/raw/step-640.rgb", true, true)`);
    const r2 = await cdp.evalJs(`window.__e2capPut("/raw/step-640.rgb", true, true)`);
    if (r1.rgbB64 === r2.rgbB64) pass("D1 putImageData lặp lại pixel-identical (step-640)", `mean ${r1.mean}`);
    else fail("D1 putImageData lặp lại pixel-identical (step-640)", `mean ${r1.mean} vs ${r2.mean}`);
    if (cdp.exceptions.length === 0) pass("H9 0 lỗi trang", "không có Runtime.exceptionThrown");
    else fail("H9 0 lỗi trang", cdp.exceptions.slice(0, 3).join(" || "));
    writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
    log(`đã ghi ${OUT} (${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB)`);
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-e2-probe.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED R85M10-E2: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-e2-probe.log"), logLines.join("\n") + "\n");
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
