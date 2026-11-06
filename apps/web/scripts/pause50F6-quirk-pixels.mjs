// pause50F6-quirk-pixels.mjs — Phase 9 đợt 50, luồng F6: follow-up của
// pause50F6-quirk.mjs.
//
// Phát hiện ở lần chạy quirk chính: var-trunc-gop2.mp4 (cắt đuôi file ở
// đầu keyframe 2.0, moov còn nguyên) seek 2.5 vẫn bắn `seeked@2.500`,
// error null, rs 4 — currentTime "đáp đúng" dù sample GOP 2 không còn
// trong file. Câu hỏi: FRAME HIỂN THỊ lúc đó là frame nào — frame 2.5
// thật (không thể, dữ liệu đã mất), frame cũ kẹt lại (vd. 1.9 — cuối
// GOP 1), hay màn đen? currentTime đúng nhưng frame sai thì đó vẫn là
// quirk đáp sai frame ở tầng pixel, chỉ là seekElement (chỉ nhìn
// currentTime) không thấy được.
//
// Cách đo: trang pixel.html load video, seek tới t, chờ `seeked` + 500 ms,
// drawImage lên canvas 160×90, hash FNV-1a trên pixel mẫu + mean RGB.
// So sánh hash của trunc@2.5 với các frame tham chiếu của file valid
// (0.0 / 1.5 / 1.9 / 2.0 / 2.5). Mỗi probe một tab mới, cùng Chrome
// headed + Xvfb như harness quirk chính. Fixture lấy từ scratch của
// lần chạy quirk chính (F6Q_SCRATCH, mặc định /tmp/pause50f6-quirk-*
// mới nhất) — không build lại fixture.
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause50F6-quirk-pixels.mjs
// Exit 0 khi mọi probe done (kể cả khi frame sai — đó là OBSERVED,
// không phải FAIL của harness); exit 1 khi đối chứng hỏng; exit 2 khi
// harness lỗi.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PORT = parseInt(process.env.F6QP_PORT || "9227", 10);
const SCRATCH = process.env.F6Q_SCRATCH || fs.readdirSync("/tmp").filter((d) => d.startsWith("pause50f6-quirk-")).sort().map((d) => path.join("/tmp", d)).pop();

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.F6QP_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

if (!SCRATCH || !fs.existsSync(path.join(SCRATCH, "var-trunc-gop2.mp4"))) fail("không tìm thấy scratch quirk chính (F6Q_SCRATCH?) — chạy pause50F6-quirk.mjs trước");
log("dùng fixture ở " + SCRATCH);

const PAGE = "<!doctype html><meta charset=\"utf-8\"><title>F6 pixel probe</title><body>\n"
  + "<script>\n"
  + "window.__px = { done: false };\n"
  + "var q = new URLSearchParams(location.search);\n"
  + "var f = q.get('f'); var t = parseFloat(q.get('t') || '0.1');\n"
  + "var t2 = q.get('t2') === null ? null : parseFloat(q.get('t2'));\n"
  + "window.__px.file = f; window.__px.target = t; window.__px.target2 = t2;\n"
  + "var v = document.createElement('video');\n"
  + "v.preload = 'auto'; v.muted = true; v.crossOrigin = 'anonymous';\n"
  + "var seeks = 0;\n"
  + "v.addEventListener('error', function () { var e = v.error; window.__px.error = e ? e.code : null; window.__px.done = true; });\n"
  + "v.addEventListener('seeked', function () {\n"
  + "  window.__px.atSeeked = v.currentTime;\n"
  + "  seeks++;\n"
  + "  if (t2 !== null && seeks === 1) {\n"
  + "    window.__px.atSeeked1 = v.currentTime;\n"
  + "    setTimeout(function () { try { v.currentTime = t2; } catch (e) { window.__px.setThrew = String(e && e.name); window.__px.done = true; } }, 500);\n"
  + "    return;\n"
  + "  }\n"
  + "  setTimeout(function () {\n"
  + "    try {\n"
  + "      var c = document.createElement('canvas'); c.width = 160; c.height = 90;\n"
  + "      var ctx = c.getContext('2d');\n"
  + "      ctx.drawImage(v, 0, 0, 160, 90);\n"
  + "      var d = ctx.getImageData(0, 0, 160, 90).data;\n"
  + "      var h = 2166136261 >>> 0; var r = 0, g = 0, b = 0, n = 0;\n"
  + "      for (var i = 0; i < d.length; i += 64) {\n"
  + "        h ^= d[i]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "        h ^= d[i + 1]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "        h ^= d[i + 2]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "        r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;\n"
  + "      }\n"
  + "      window.__px.hash = ('0000000' + h.toString(16)).slice(-8);\n"
  + "      window.__px.mean = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];\n"
  + "      window.__px.videoW = v.videoWidth; window.__px.videoH = v.videoHeight;\n"
  + "      window.__px.readyState = v.readyState;\n"
  + "    } catch (e) { window.__px.drawError = String(e && e.message ? e.message : e); }\n"
  + "    window.__px.done = true;\n"
  + "  }, 500);\n"
  + "});\n"
  + "v.src = '/media/' + f;\n"
  + "document.body.appendChild(v);\n"
  + "setTimeout(function () {\n"
  + "  try { v.currentTime = t; } catch (e) { window.__px.setThrew = String(e && e.name); window.__px.done = true; }\n"
  + "}, 3000);\n"
  + "setTimeout(function () { if (!window.__px.done) { window.__px.timeout = true; window.__px.done = true; } }, 20000);\n"
  + "</script>\n";
fs.writeFileSync(path.join(SCRATCH, "pixel.html"), PAGE);

class TabCdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      let d; try { d = JSON.parse(m.data); } catch { return; }
      if (d.id && this.pending.has(d.id)) {
        const { res, rej } = this.pending.get(d.id); this.pending.delete(d.id);
        if (d.error) rej(new Error(JSON.stringify(d.error))); else res(d.result);
      }
    };
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = this.nextId++;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { this.pending.delete(id); rej(new Error("CDP timeout " + method)); }, timeoutMs);
      this.pending.set(id, { res: (v) => { clearTimeout(timer); res(v); }, rej: (e) => { clearTimeout(timer); rej(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result?.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

async function runProbe(origin, query, timeoutMs = 40000) {
  const target = await (await fetch("http://127.0.0.1:" + PORT + "/json/new", { method: "PUT" })).json();
  if (!target || !target.webSocketDebuggerUrl) throw new Error("json/new không trả webSocketDebuggerUrl");
  const cdp = new TabCdp(target.webSocketDebuggerUrl);
  try {
    await cdp.ready;
    await cdp.send("Runtime.enable", {});
    await cdp.send("Page.enable", {});
    await cdp.send("Page.navigate", { url: origin + "/pixel.html" + query });
    await cdp.send("Page.bringToFront", {}).catch(() => {});
    let result = null;
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      await sleep(500);
      result = await cdp.evaluate("window.__px").catch(() => null);
      if (result && result.done) break;
    }
    if (!result || !result.done) throw new Error("probe không done sau " + timeoutMs + " ms");
    return result;
  } finally {
    cdp.close();
    try { await fetch("http://127.0.0.1:" + PORT + "/json/close/" + target.id); } catch {}
  }
}

async function main() {
  if (!fs.existsSync(CHROME)) fail("không có chrome " + CHROME);
  if (!DISPLAY) fail("không còn display trống trong :90-:99");
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file;
    if (url.pathname.startsWith("/media/")) file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(7)));
    else file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(1)) === "" ? "pixel.html" : decodeURIComponent(url.pathname.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mp4") ? "video/mp4" : "text/html";
    const size = fs.statSync(file).size;
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://127.0.0.1:" + server.address().port;
  log("scratch server tại " + ORIGIN + " display " + DISPLAY + " port " + PORT);

  let xvfb = null; let chrome = null; let profileDir = null;
  const cleanup = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGTERM"); } catch {}
    try { server.close(); } catch {}
    try { if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };
  process.on("exit", cleanup);
  try {
    const num = DISPLAY.replace(":", "");
    const sock = "/tmp/.X11-unix/X" + num;
    if (fs.existsSync(sock)) fail("display " + DISPLAY + " vừa bị luồng khác chiếm");
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail("Xvfb không tạo socket");
    profileDir = path.join(SCRATCH, "chrome-profile-px-" + process.pid);
    const flags = ["--no-sandbox", "--remote-debugging-port=" + PORT, "--remote-debugging-address=127.0.0.1",
      "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
      "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"];
    chrome = spawn(CHROME, flags, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    let version = null;
    for (let i = 0; i < 60 && !version; i++) {
      await sleep(500);
      try { const r = await fetch("http://127.0.0.1:" + PORT + "/json/version"); if (r.ok) version = await r.json(); } catch {}
    }
    if (!version) fail("Chrome không mở được DevTools port " + PORT + " sau 30 s");
    log("Chrome DevTools: " + version.Browser);

    const results = {};
    const cases = [
      ["P1-valid-2.5", "valid-gop.mp4", 2.5],
      ["P2-trunc-2.5", "var-trunc-gop2.mp4", 2.5],
      ["P3-valid-1.9", "valid-gop.mp4", 1.9],
      ["P4-valid-2.0", "valid-gop.mp4", 2.0],
      ["P5-trunc-1.5", "var-trunc-gop2.mp4", 1.5],
      ["P6-valid-1.5", "valid-gop.mp4", 1.5],
      ["P7-valid-0.0", "valid-gop.mp4", 0.0],
      ["P8-trunc-2.5-repeat", "var-trunc-gop2.mp4", 2.5],
      // P9: hai bước trên file cắt — seek 1.5 trước (frame hiện = 1.5),
      // rồi seek 2.5 (GOP 2 đã mất). Nếu frame sau vẫn = 1.5 → Chrome
      // giữ frame cũ khi seek thất bại; nếu = 0.0 → reset về frame 0.
      ["P9-trunc-1.5-then-2.5", "var-trunc-gop2.mp4", 1.5, 2.5],
      ["P10-valid-1.5-then-2.5", "valid-gop.mp4", 1.5, 2.5],
    ];
    for (const [key, f, t, t2] of cases) {
      try {
        const r = await runProbe(ORIGIN, `?f=${f}&t=${t}` + (t2 !== undefined ? `&t2=${t2}` : ""));
        results[key] = r;
        log(`PROBE ${key}: hash=${r.hash} mean=${JSON.stringify(r.mean)} atSeeked=${r.atSeeked} atSeeked1=${r.atSeeked1 ?? null} video=${r.videoW}x${r.videoH} rs=${r.readyState} err=${r.error ?? r.drawError ?? r.setThrew ?? r.noSeeked ?? r.timeout ?? null}`);
      } catch (e) {
        results[key] = { error: String(e && e.message ? e.message : e) };
        log(`PROBE ${key} ERROR: ${results[key].error}`);
      }
    }

    const h = (k) => results[k]?.hash;
    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 600)); };
    // Đối chứng: trunc@1.5 phải bằng valid@1.5 (GOP 1 còn nguyên, cùng frame).
    check("CONTROL-trunc-1.5-eq-valid-1.5", h("P5-trunc-1.5") && h("P5-trunc-1.5") === h("P6-valid-1.5") ? "PASS" : "FAIL",
      { p5: results["P5-trunc-1.5"], p6: results["P6-valid-1.5"] });
    // Các frame tham chiếu phải khác nhau (nếu không, hash không phân biệt được frame → phép so sánh vô nghĩa).
    const refs = ["P1-valid-2.5", "P3-valid-1.9", "P4-valid-2.0", "P6-valid-1.5", "P7-valid-0.0"].map(h);
    const refsDistinct = refs.every(Boolean) && new Set(refs).size === refs.length;
    check("CONTROL-ref-frames-distinct", refsDistinct ? "PASS" : "FAIL", { refs: Object.fromEntries(["P1-valid-2.5", "P3-valid-1.9", "P4-valid-2.0", "P6-valid-1.5", "P7-valid-0.0"].map((k) => [k, h(k)])) });
    // Câu hỏi chính: trunc@2.5 hiển thị frame nào?
    const p2 = results["P2-trunc-2.5"] || {};
    const p8 = results["P8-trunc-2.5-repeat"] || {};
    const match = ["P1-valid-2.5", "P3-valid-1.9", "P4-valid-2.0", "P6-valid-1.5", "P7-valid-0.0"].find((k) => h(k) && h(k) === p2.hash);
    check("F6-trunc-2.5-pixel-frame", "OBSERVED", {
      trunc25: { hash: p2.hash, mean: p2.mean, atSeeked: p2.atSeeked },
      trunc25repeat: { hash: p8.hash, mean: p8.mean, atSeeked: p8.atSeeked },
      matchesReference: match ?? null,
      isBlack: Array.isArray(p2.mean) && p2.mean.every((v) => v < 4),
      refs: Object.fromEntries(["P1-valid-2.5", "P3-valid-1.9", "P4-valid-2.0", "P6-valid-1.5", "P7-valid-0.0"].map((k) => [k, { hash: h(k), mean: results[k]?.mean }])),
    });

    // P9/P10 (hai bước): trunc 1.5→2.5 hiển thị frame nào — 1.5 (giữ
    // frame cũ) hay 0.0 (reset về frame 0)? Đối chứng valid 1.5→2.5
    // phải = frame 2.5.
    const p9 = results["P9-trunc-1.5-then-2.5"] || {};
    const p10 = results["P10-valid-1.5-then-2.5"] || {};
    const p9match = ["P1-valid-2.5", "P3-valid-1.9", "P4-valid-2.0", "P6-valid-1.5", "P7-valid-0.0"].find((k) => h(k) && h(k) === p9.hash);
    check("F6-trunc-two-step-frame", "OBSERVED", {
      trunc15then25: { hash: p9.hash, mean: p9.mean, atSeeked1: p9.atSeeked1, atSeeked: p9.atSeeked, matchesReference: p9match ?? null },
      valid15then25: { hash: p10.hash, mean: p10.mean, atSeeked1: p10.atSeeked1, atSeeked: p10.atSeeked, matchesReference: ["P1-valid-2.5"].find((k) => h(k) === p10.hash) ?? null },
    });

    console.log(JSON.stringify({ chrome: version, checks, results }, null, 2));
    const failed = checks.filter((c) => c.status === "FAIL").length;
    log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
