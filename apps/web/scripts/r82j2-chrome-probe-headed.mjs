#!/usr/bin/env node
/**
 * r82j2-chrome-probe-headed.mjs — Phase 9 đợt 82, luồng J2: probe TRỰC TIẾP
 * toán tử upscale drawImage của Chrome trên mẫu bipolar đặc đã biết
 * (không qua sharpen, không qua app VCut, không qua video decode).
 *
 * Nợ I3 §7.1: I3 chỉ kết luận bằng loại trừ rằng "toán tử upscale hiệu
 * dụng của Chrome trên mẫu delta đặc khác tam giác lý tưởng" — chưa đo
 * trực tiếp toán tử đó. Probe này đưa mẫu đã biết (putImageData, giá trị
 * chính xác từng pixel) vào canvas 512×512 rồi drawImage upscale
 * (imageSmoothingQuality="high") và đọc lại pixel — tách "kernel Chrome
 * khác tri" khỏi "khâu khác trong pipeline preview".
 *
 * Mẫu (grayscale, R=G=B): sqw4 (chu kỳ 8px, 64/192 — giống H3/I3),
 * sqw8 (chu kỳ 16px, 64/192), sqw4-hi (0/255), sqw4-lo (112/144),
 * step (64→192 tại x=256), impulse (nền 128, cột 255 tại x=256),
 * checker8 (bàn cờ 8×8, 64/192 — kiểm 2D), linA/linB/linAB (xung 128
 * tại x=200 / x=208 / cả hai — kiểm tuyến tính).
 * Thang: s=1,1328125 (512→580), s=1,263671875 (512→647),
 * s=2,0 (512→1024). Thêm sweep impulse p=0..511 (hàng giữa) ở s=1,1328
 * và s=2,0 để tái tạo kernel hiệu dụng, và so high-vs-medium.
 *
 * Chạy (từ gốc repo):
 *   node apps/web/scripts/r82j2-chrome-probe-headed.mjs            # --disable-gpu
 *   R82J2_GPU=1 node apps/web/scripts/r82j2-chrome-probe-headed.mjs  # đường GPU (SwiftShader)
 * Env: R82J2_DISPLAY (:191–:199), R82J2_DEBUG_PORT (9790–9799),
 *   R82J2_HTTP_PORT (5690–5699), R82J2_OUT (mặc định
 *   hidden_files/round82-j2/r82j2-probe-gpu{g}.json).
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
const OUT_DIR = path.join(GOAL, "round82-j2");
const GPU = process.env.R82J2_GPU === "1" ? 1 : 0;
const OUT = process.env.R82J2_OUT || path.join(OUT_DIR, `r82j2-probe-gpu${GPU}.json`);
const CHROME = process.env.R82J2_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");

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
    // Probe headed mất ~120 s ở gpu0, lâu hơn ở đường SwiftShader (gpu1)
    // nên evaluate cho 300 s thay vì 60 s như mẫu H3.
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
}

// Trang probe: mọi mẫu vẽ bằng putImageData (giá trị chính xác), upscale
// bằng drawImage duy nhất, đọc lại bằng getImageData. Không video, không app.
const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>r82j2 probe</title></head>
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
    case "linA": return x === 200 ? 128 : 0;
    case "linB": return x === 208 ? 128 : 0;
    case "linAB": return (x === 200 || x === 208) ? 128 : 0;
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
function capture(srcCanvas, DW, DH, quality) {
  const c = document.createElement("canvas"); c.width = DW; c.height = DH;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = quality;
  x.drawImage(srcCanvas, 0, 0, DW, DH);
  return { canvas: c, ctx: x };
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
function b64encode(u8) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(s);
}
window.__r82j2run = async () => {
  const scales = [
    { key: "s1132", dw: 580, dh: 580, s: 580 / 512 },
    { key: "s1264", dw: 647, dh: 647, s: 647 / 512 },
    { key: "s2000", dw: 1024, dh: 1024, s: 2.0 },
  ];
  const rowPatterns = ["sqw4", "sqw8", "sqw4-hi", "sqw4-lo", "step", "impulse", "linA", "linB", "linAB"];
  const out = { ua: navigator.userAgent, src: SRC, scales, captures: {}, sweep: {}, quality: {} };
  const sources = {};
  for (const k of [...rowPatterns, "checker8"]) sources[k] = makeSource(k);
  for (const sc of scales) {
    for (const k of rowPatterns) {
      const { ctx } = capture(sources[k], sc.dw, sc.dh, "high");
      out.captures[k + "@" + sc.key] = { w: sc.dw, h: sc.dh, ...rowsOf(ctx, sc.dw, sc.dh) };
    }
    // checker8: full frame (cần cho kiểm 2D)
    const { ctx } = capture(sources.checker8, sc.dw, sc.dh, "high");
    const d = ctx.getImageData(0, 0, sc.dw, sc.dh).data;
    const rgb = new Uint8Array(sc.dw * sc.dh * 3);
    for (let i = 0; i < sc.dw * sc.dh; i++) { rgb[i * 3] = d[i * 4]; rgb[i * 3 + 1] = d[i * 4 + 1]; rgb[i * 3 + 2] = d[i * 4 + 2]; }
    out.captures["checker8@" + sc.key] = { w: sc.dw, h: sc.dh, rgbB64: b64encode(rgb) };
    // repeatability: sqw4 high lần 2 ở thang đầu
    if (sc.key === "s1132") {
      const r2 = capture(sources.sqw4, sc.dw, sc.dh, "high");
      out.captures["sqw4@s1132-repeat"] = { w: sc.dw, h: sc.dh, ...rowsOf(r2.ctx, sc.dw, sc.dh) };
      const med = capture(sources.sqw4, sc.dw, sc.dh, "medium");
      out.quality["sqw4@s1132-medium"] = { w: sc.dw, h: sc.dh, ...rowsOf(med.ctx, sc.dw, sc.dh) };
    }
  }
  // Sweep impulse: cột 255 trên nền 0, p=0..511, chỉ hàng giữa.
  for (const sc of [scales[0], scales[2]]) {
    const rows = new Uint8Array(512 * sc.dw);
    const yMid = Math.floor(sc.dh / 2);
    for (let p = 0; p < 512; p++) {
      const c = document.createElement("canvas"); c.width = SRC; c.height = SRC;
      const x = c.getContext("2d");
      const img = x.createImageData(SRC, SRC);
      const d = img.data;
      for (let i = 0; i < SRC * SRC; i++) { d[i * 4] = 0; d[i * 4 + 1] = 0; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
      for (let y = 0; y < SRC; y++) { const o = (y * SRC + p) * 4; d[o] = 255; d[o + 1] = 255; d[o + 2] = 255; }
      x.putImageData(img, 0, 0);
      const { ctx } = capture(c, sc.dw, sc.dh, "high");
      const rd = ctx.getImageData(0, yMid, sc.dw, 1).data;
      for (let i = 0; i < sc.dw; i++) rows[p * sc.dw + i] = rd[i * 4];
    }
    out.sweep[sc.key] = { w: sc.dw, yMid, rowsB64: b64encode(rows) };
  }
  return out;
};
document.title = "r82j2-ready";
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
    const HTTP_PORT = Number(process.env.R82J2_HTTP_PORT || 0) || (await pickFreePort(5690, 5699));
    const DEBUG_PORT = Number(process.env.R82J2_DEBUG_PORT || 0) || (await pickFreePort(9790, 9799));
    if (!HTTP_PORT) throw new Error("hết cổng http trống 5690–5699");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9790–9799");
    let display = process.env.R82J2_DISPLAY || null;
    if (!display) {
      for (let n = 191; n <= 199; n++) {
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
    if (!display) throw new Error("hết display trống :191–:199");
    const WIN_W = 1200, WIN_H = 900;
    log(`gpu=${GPU} http :${HTTP_PORT} debug :${DEBUG_PORT} DISPLAY=${display}`);

    server = http.createServer((req, res) => {
      if (req.url === "/probe.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE_HTML); return; }
      res.writeHead(404); res.end();
    });
    await new Promise((res, rej) => { server.once("error", rej); server.listen(HTTP_PORT, "127.0.0.1", res); });
    log("http server đã lên");

    xvfb = spawn("Xvfb", [display, "-screen", "0", `${WIN_W}x${WIN_H}x24`], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${display} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(OUT_DIR, `r82j2-chrome-gpu${GPU}.log`), "w");
    const PROFILE = path.join(OUT_DIR, "chrome-userdata-gpu" + GPU);
    fs.rmSync(PROFILE, { recursive: true, force: true });
    const args = ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--no-default-browser-check",
      `--window-size=${WIN_W},${WIN_H}`, "--hide-scrollbars", "about:blank"];
    if (GPU === 0) args.push("--disable-gpu");
    chrome = spawn(CHROME, args, { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display, TMPDIR: "/tmp" } });
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
      ready = await cdp.evalJs(`document.title === "r82j2-ready" && typeof window.__r82j2run === "function"`).catch(() => false);
      if (!ready) await sleep(500);
    }
    if (!ready) throw new Error("trang probe không sẵn sau 60 s");
    log("trang probe đã sẵn — chạy __r82j2run()");
    const t0 = Date.now();
    const data = await cdp.evalJs(`window.__r82j2run()`);
    log(`probe chạy xong trong ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    const nCap = Object.keys(data.captures || {}).length;
    const nSweep = Object.keys(data.sweep || {}).length;
    if (nCap < 30) fail("số capture", `chỉ có ${nCap} capture (kỳ vọng ≥30)`);
    else pass("số capture", `${nCap} capture + ${nSweep} sweep`);
    if (cdp.exceptions.length === 0) pass("0 lỗi trang", "không có Runtime.exceptionThrown");
    else fail("0 lỗi trang", cdp.exceptions.slice(0, 3).join(" || "));
    writeFileEpermRetry(OUT, JSON.stringify({ gpu: GPU, display, generated: new Date().toISOString(), ...data }, null, 2));
    log(`đã ghi ${OUT}`);
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(OUT_DIR, `r82j2-probe-gpu${GPU}.log`), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED R82J2 gpu${GPU}: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    writeFileEpermRetry(path.join(OUT_DIR, `r82j2-probe-gpu${GPU}.log`), logLines.join("\n") + "\n");
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
