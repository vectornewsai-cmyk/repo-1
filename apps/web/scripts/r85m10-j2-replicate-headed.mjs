#!/usr/bin/env node
/**
 * r85m10-j2-replicate-headed.mjs — Phase 9 đợt 85, luồng M10 (thí nghiệm
 * E4): tái lập ĐÚNG J2 (đợt 82): nguồn 512x512 putImageData, pattern
 * sqw4/sqw4-hi/step/impulse/checker8, thang 512->580/647/1024, trong
 * harness M10 (Chrome 1254, --disable-gpu, Xvfb). E3 cho S4hi vs Mitchell
 * 2,296 trong khi J2 đo 0,002 — cần biết J2 có tái lập được trong harness
 * này không: nếu tái lập được (Mitchell ~0) thì khác biệt là kích thước
 * nguồn (512 vs 640); nếu không (~2,3) thì khác biệt là môi trường/cờ
 * Chrome giữa 2 đợt.
 * Chạy: node apps/web/scripts/r85m10-j2-replicate-headed.mjs
 * Env: R85M10E4_DISPLAY (:173–:179), R85M10E4_DEBUG_PORT (9773–9779),
 *   R85M10E4_HTTP_PORT (5673–5679).
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
const OUT = path.join(OUT_DIR, "r85m10-e4-probe.json");
const CHROME = process.env.R85M10E4_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");

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

// Sao đúng PAGE của J2 (patternValue/makeSource/capture/rowsOf), chỉ đổi
// tên hàm chạy để driver gọi từng capture (tránh 1 evaluate khổng lồ).
const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r85m10-e4 probe</title></head>
<body><script>
const SRC = 512;
function patternValue(kind, x, y) {
  switch (kind) {
    case "sqw4": return (Math.floor(x / 4) % 2 === 0) ? 64 : 192;
    case "sqw8": return (Math.floor(x / 8) % 2 === 0) ? 64 : 192;
    case "sqw4-hi": return (Math.floor(x / 4) % 2 === 0) ? 0 : 255;
    case "sqw4-lo": return (Math.floor(x / 4) % 2 === 0) ? 112 : 144;
    case "step": return x < 256 ? 64 : 192;
    case "impulse": return x === 256 ? 255 : 128;
    case "checker8": return ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) ? 64 : 192;
    default: throw new Error("mẫu không biết: " + kind);
  }
}
function makeSource(kind) {
  const c = document.createElement("canvas"); c.width = SRC; c.height = SRC;
  const x = c.getContext("2d");
  const img = x.createImageData(SRC, SRC);
  const d = img.data;
  for (let y = 0; y < SRC; y++) for (let px = 0; px < SRC; px++) {
    const v = patternValue(kind, px, y);
    const o = (y * SRC + px) * 4;
    d[o] = v; d[o + 1] = v; d[o + 2] = v; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}
function b64encode(u8) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(s);
}
function rowsOf(ctx, DW, DH) {
  const ys = [0, Math.floor(DH / 4), Math.floor(DH / 2), Math.floor(3 * DH / 4)];
  const rows = [];
  for (const y of ys) {
    const d = ctx.getImageData(0, y, DW, 1).data;
    const row = new Array(DW);
    for (let i = 0; i < DW; i++) row[i] = d[i * 4];
    rows.push(row);
  }
  return { ys, rows };
}
window.__e4cap = (kind, DW, DH, quality) => {
  const src = makeSource(kind);
  const c = document.createElement("canvas"); c.width = DW; c.height = DH;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = quality;
  x.drawImage(src, 0, 0, DW, DH);
  const out = { kind, dw: DW, dh: DH, quality, ...rowsOf(x, DW, DH) };
  if (kind === "checker8") {
    const d = x.getImageData(0, 0, DW, DH).data;
    const rgb = new Uint8Array(DW * DH * 3);
    for (let i = 0; i < DW * DH; i++) { rgb[i * 3] = d[i * 4]; rgb[i * 3 + 1] = d[i * 4 + 1]; rgb[i * 3 + 2] = d[i * 4 + 2]; }
    out.rgbB64 = b64encode(rgb);
  }
  return out;
};
document.title = "r85m10-e4-ready";
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
    const HTTP_PORT = Number(process.env.R85M10E4_HTTP_PORT || 0) || (await pickFreePort(5673, 5679));
    const DEBUG_PORT = Number(process.env.R85M10E4_DEBUG_PORT || 0) || (await pickFreePort(9773, 9779));
    if (!HTTP_PORT) throw new Error("hết cổng http trống 5673–5679");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9773–9779");
    let display = process.env.R85M10E4_DISPLAY || null;
    if (!display) {
      for (let n = 173; n <= 179; n++) {
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
    if (!display) throw new Error("hết display trống :173–:179");
    log(`http :${HTTP_PORT} debug :${DEBUG_PORT} DISPLAY=${display}`);
    server = http.createServer((req, res) => {
      if (req.url === "/probe.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE_HTML); return; }
      res.writeHead(404); res.end();
    });
    await new Promise((res, rej) => { server.once("error", rej); server.listen(HTTP_PORT, "127.0.0.1", res); });
    xvfb = spawn("Xvfb", [display, "-screen", "0", "1200x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${display} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(OUT_DIR, "r85m10-e4-chrome.log"), "w");
    const PROFILE = "/tmp/r85m10e4-prof";
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync("/tmp/r85m10e4-tmp", { recursive: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1200,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display, TMPDIR: "/tmp/r85m10e4-tmp" } });
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
      ready = await cdp.evalJs(`document.title === "r85m10-e4-ready" && typeof window.__e4cap === "function"`).catch(() => false);
      if (!ready) await sleep(500);
    }
    if (!ready) throw new Error("trang probe không sẵn sau 60 s");
    const out = { ua: await cdp.evalJs(`navigator.userAgent`), captures: {} };
    for (const [dw, dh, key] of [[580, 580, "s1132"], [647, 647, "s1264"], [1024, 1024, "s2000"]]) {
      for (const kind of ["sqw4", "sqw8", "sqw4-hi", "sqw4-lo", "step", "impulse", "checker8"]) {
        const c = await cdp.evalJs(`window.__e4cap(${JSON.stringify(kind)}, ${dw}, ${dh}, "high")`);
        out.captures[`${kind}@${key}`] = c;
        log(`${kind}@${key}: hàng giữa mẫu ${c.rows[2].slice(0, 8).join(",")}...`);
      }
    }
    // Đối chứng medium = tri (J2 §5) + lặp lại.
    const med = await cdp.evalJs(`window.__e4cap("sqw4", 580, 580, "medium")`);
    out.captures["sqw4@s1132-medium"] = med;
    const r1 = await cdp.evalJs(`window.__e4cap("sqw4", 580, 580, "high")`);
    const r2 = await cdp.evalJs(`window.__e4cap("sqw4", 580, 580, "high")`);
    if (JSON.stringify(r1.rows) === JSON.stringify(r2.rows)) pass("D1 sqw4@s1132 lặp lại pixel-identical", "4 hàng giống nhau");
    else fail("D1 sqw4@s1132 lặp lại pixel-identical", "hàng khác nhau");
    if (cdp.exceptions.length === 0) pass("H9 0 lỗi trang", "không có Runtime.exceptionThrown");
    else fail("H9 0 lỗi trang", cdp.exceptions.slice(0, 3).join(" || "));
    writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
    log(`đã ghi ${OUT}`);
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-e4-probe.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED R85M10-E4: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    writeFileEpermRetry(path.join(OUT_DIR, "r85m10-e4-probe.log"), logLines.join("\n") + "\n");
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
