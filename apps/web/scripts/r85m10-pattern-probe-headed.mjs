#!/usr/bin/env node
/**
 * r85m10-pattern-probe-headed.mjs — Phase 9 đợt 85, luồng M10 (thí nghiệm
 * E3): canvas→canvas upscale có phải Mitchell trên MỌI nội dung? E2 chứng
 * minh putImageData(lineart S0) vẫn lệch Mitchell 1,601 — còn lại 2 ứng
 * viên: (a) đường 1px chu kỳ 8 (duty 1/8) khác sọc 4px của J2 (duty 1/2),
 * (b) tương tác 2D (lưới dọc+ngang) — kernel tách được 2D của J2 chỉ đo
 * trên checker 8px (tần số thấp). Probe này sinh pattern tổng hợp TRONG
 * trang (putImageData, giá trị chính xác) và upscale 640x360 -> 809x455:
 *   V1: sọc dọc đen 1px/8px (1D) | H1: sọc ngang 1px/8px (1D)
 *   G1: lưới V1+H1 (2D tách được) | C1: lưới + vòng tròn (gần lineart)
 *   S4hi: sọc 0/255 4px/8px kiểu J2 (đối chứng: phải khớp Mitchell ~0)
 *   V2/V4: sọc dọc 2px/4px (ngưỡng độ dày)
 * Mỗi pattern còn upscale 640->1280x720 (s=2,0) để kiểm phụ thuộc thang.
 * Chạy: node apps/web/scripts/r85m10-pattern-probe-headed.mjs
 * Env: R85M10E3_DISPLAY (:172–:179), R85M10E3_DEBUG_PORT (9772–9779),
 *   R85M10E3_HTTP_PORT (5672–5679).
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
const OUT = path.join(OUT_DIR, "r85m10-e3-probe.json");
const CHROME = process.env.R85M10E3_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");

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

const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r85m10-e3 probe</title></head>
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
function mkCanvas(w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  return { c, x };
}
function makePattern(kind) {
  const W = 640, H = 360;
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) { data[i*4] = 255; data[i*4+1] = 255; data[i*4+2] = 255; data[i*4+3] = 255; }
  const set = (x, y) => { if (x < 0 || x >= W || y < 0 || y >= H) return; const o = (y * W + x) * 4; data[o] = 0; data[o+1] = 0; data[o+2] = 0; };
  const vline = (x0, w) => { for (let x = x0; x < x0 + w; x++) for (let y = 0; y < H; y++) set(x, y); };
  const hline = (y0, w) => { for (let y = y0; y < y0 + w; y++) for (let x = 0; x < W; x++) set(x, y); };
  if (kind === "V1" || kind === "G1" || kind === "C1") for (let x = 0; x < W; x += 8) vline(x, 1);
  if (kind === "H1" || kind === "G1" || kind === "C1") for (let y = 0; y < H; y += 8) hline(y, 1);
  if (kind === "V2") for (let x = 0; x < W; x += 8) vline(x, 2);
  if (kind === "V4") for (let x = 0; x < W; x += 8) vline(x, 4);
  if (kind === "S4hi") { // sọc 0/255 4px như J2 (64/192 -> 0/255)
    for (let x = 0; x < W; x++) if (Math.floor(x / 4) % 2 === 0) for (let y = 0; y < H; y++) set(x, y);
  }
  if (kind === "C1") { // vòng tròn đồng tâm như lineart G5 (r=12, bước 7)
    const cx = W / 2, cy = H / 2;
    for (let r = 12; r < Math.min(W, H) / 2; r += 7) {
      for (let a = 0; a < 360; a++) {
        const rad = a * Math.PI / 180;
        set(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)));
      }
    }
  }
  return data;
}
window.__e3cap = (kind, dw, dh) => {
  const data = makePattern(kind);
  const { c: sc, x: sx } = mkCanvas(640, 360);
  const img = sx.createImageData(640, 360);
  img.data.set(data);
  sx.putImageData(img, 0, 0);
  // Trả cả S0 (đọc lại canvas nguồn) để phân tích offline dùng đúng input.
  const s0 = rgb24b64(sx, 640, 360);
  const { x: dx } = mkCanvas(dw, dh);
  dx.drawImage(sc, 0, 0, dw, dh);
  return { ok: true, kind, dw, dh, s0, up: rgb24b64(dx, dw, dh) };
};
document.title = "r85m10-e3-ready";
</script></body></html>`;

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
    const HTTP_PORT = Number(process.env.R85M10E3_HTTP_PORT || 0) || (await pickFreePort(5672, 5679));
    const DEBUG_PORT = Number(process.env.R85M10E3_DEBUG_PORT || 0) || (await pickFreePort(9772, 9779));
    if (!HTTP_PORT) throw new Error("hết cổng http trống 5672–5679");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9772–9779");
    let display = process.env.R85M10E3_DISPLAY || null;
    if (!display) {
      for (let n = 172; n <= 179; n++) {
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
    if (!display) throw new Error("hết display trống :172–:179");
    log(`http :${HTTP_PORT} debug :${DEBUG_PORT} DISPLAY=${display}`);
    server = http.createServer((req, res) => {
      if (req.url === "/probe.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE_HTML); return; }
      res.writeHead(404); res.end();
    });
    await new Promise((res, rej) => { server.once("error", rej); server.listen(HTTP_PORT, "127.0.0.1", res); });
    xvfb = spawn("Xvfb", [display, "-screen", "0", "1200x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${display} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(OUT_DIR, "r85m10-e3-chrome.log"), "w");
    const PROFILE = "/tmp/r85m10e3-prof";
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync("/tmp/r85m10e3-tmp", { recursive: true }); // Chrome cần TMPDIR tồn tại để tạo socket Singleton
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1200,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display, TMPDIR: "/tmp/r85m10e3-tmp" } });
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
      ready = await cdp.evalJs(`document.title === "r85m10-e3-ready" && typeof window.__e3cap === "function"`).catch(() => false);
      if (!ready) await sleep(500);
    }
    if (!ready) throw new Error("trang probe không sẵn sau 60 s");
    const out = { ua: await cdp.evalJs(`navigator.userAgent`), caps: {} };
    for (const kind of ["V1", "H1", "G1", "C1", "S4hi", "V2", "V4"]) {
      for (const [dw, dh] of [[809, 455], [1280, 720]]) {
        const c = await cdp.evalJs(`window.__e3cap(${JSON.stringify(kind)}, ${dw}, ${dh})`);
        if (!c.ok) throw new Error(`cap ${kind} ${dw}x${dh} thất bại`);
        out.caps[`${kind}@${dw}x${dh}`] = c;
        log(`${kind} ${dw}x${dh}: s0 mean ${c.s0.mean} up mean ${c.up.mean}`);
      }
    }
    // D1: lặp lại pixel-identical?
    const r1 = await cdp.evalJs(`window.__e3cap("G1", 809, 455)`);
    const r2 = await cdp.evalJs(`window.__e3cap("G1", 809, 455)`);
    if (r1.up.rgbB64 === r2.up.rgbB64) pass("D1 G1 lặp lại pixel-identical", `809x455 mean ${r1.up.mean}`);
    else fail("D1 G1 lặp lại pixel-identical", `mean ${r1.up.mean} vs ${r2.up.mean}`);
    if (cdp.exceptions.length === 0) pass("H9 0 lỗi trang", "không có Runtime.exceptionThrown");
    else fail("H9 0 lỗi trang", cdp.exceptions.slice(0, 3).join(" || "));
    writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
    log(`đã ghi ${OUT} (${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB)`);
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-e3-probe.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED R85M10-E3: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-e3-probe.log"), logLines.join("\n") + "\n");
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
