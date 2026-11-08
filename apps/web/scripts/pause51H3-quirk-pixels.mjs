// pause51H3-quirk-pixels.mjs — Phase 9 đợt 51, luồng H3:
// quirk frame khác 0 ở tầng PIXEL với các dạng hỏng mới
// (nối F6 §2.3 — F6 chỉ đo được trên file cắt đuôi).
//
// CÂU HỎI: Chrome có giữ frame cũ khi seek tới frame không
// decode được không — với các dạng hỏng KHÁC cắt đuôi? Cụ thể:
//  (a) GOP hỏng giữa file: keyframe 2.0 bị zero (W1), P-frame
//      giữa GOP 1 bị zero (W12), B-frame cuối GOP 1 bị zero
//      (W11), P-frame tại đích 2.5 bị zero (W7);
//  (b) GOP đầu mất hẳn: GOP 0 bị zero (W2) — seek 0.5 / 0.0;
//  (c) moov thiếu: box moov bị zero (W13) — kỳ vọng error 4,
//      không có frame;
//  (d) hai bước cùng element trên broken-gap: 1.5 (lỗi) rồi
//      2.5 (W6) — frame sau lần seek thứ hai là frame nào?
//  (e) tái hiện F6 §2.3 (file cắt đuôi seek 2.5 → frame 0.0)
//      để kiểm chứng phương pháp vẫn phân biệt được frame.
// Cách đo (như F6): seek rồi drawImage lên canvas 160×90,
// hash FNV-1a trên pixel mẫu + mean RGB; mỗi probe một tab mới;
// fixture lấy từ scratch của harness quirk chính H3
// (H3Q_SCRATCH, mặc định /tmp/pause51h3-quirk-* mới nhất) —
// không build lại fixture, trừ var-trunc-gop2.mp4 (cắt ở đầu
// keyframe 2.0, rebuild từ valid-gop để tái hiện F6).
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause51H3-quirk-pixels.mjs
// Exit 0 khi mọi probe done (kể cả khi frame sai — đó là
// OBSERVED, không phải FAIL); exit 1 khi đối chứng hỏng;
// exit 2 khi harness lỗi.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PORT = parseInt(process.env.H3QP_PORT || "9233", 10);
const SCRATCH = process.env.H3Q_SCRATCH || fs.readdirSync("/tmp").filter((d) => d.startsWith("pause51h3-quirk-")).sort().map((d) => path.join("/tmp", d)).pop();

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.H3QP_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

if (!SCRATCH || !fs.existsSync(path.join(SCRATCH, "valid-gop.mp4"))) fail("không tìm thấy scratch quirk chính H3 (H3Q_SCRATCH?) — chạy pause51H3-quirk.mjs trước");
log("dùng fixture ở " + SCRATCH);

// Rebuild var-trunc-gop2.mp4 (F6 V4) nếu chưa có trong scratch:
// cắt ở offset đầu keyframe pts 2.0 (= cuối GOP 1).
if (!fs.existsSync(path.join(SCRATCH, "var-trunc-gop2.mp4"))) {
  const { execFileSync } = await import("node:child_process");
  const base = path.join(SCRATCH, "valid-gop.mp4");
  const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "packet=pts_time,pos,size", "-of", "json", base], { encoding: "utf8" }));
  const kf2 = probe.packets.find((p) => Math.abs(parseFloat(p.pts_time) - 2.0) < 1e-6);
  if (!kf2) fail("không tìm thấy packet keyframe pts 2.0");
  const data = fs.readFileSync(base);
  fs.writeFileSync(path.join(SCRATCH, "var-trunc-gop2.mp4"), data.subarray(0, parseInt(kf2.pos, 10)));
  log("rebuild var-trunc-gop2.mp4: cắt ở " + kf2.pos + " (từ " + data.length + " byte)");
}

const PAGE = "<!doctype html><meta charset=\"utf-8\"><title>H3 pixel probe</title><body>\n"
  + "<script>\n"
  + "window.__px = { done: false };\n"
  + "var q = new URLSearchParams(location.search);\n"
  + "var f = q.get('f'); var t = parseFloat(q.get('t') || '0.1');\n"
  + "var t2 = q.get('t2') === null ? null : parseFloat(q.get('t2'));\n"
  + "var base = q.get('base') === 'nolength' ? '/media-nolength/' : '/media/';\n"
  + "var mode = q.get('mode') || 'std';\n"
  + "window.__px.file = f; window.__px.target = t; window.__px.target2 = t2; window.__px.base = base; window.__px.mode = mode;\n"
  + "function drawNow() {\n"
  + "  try {\n"
  + "    var c = document.createElement('canvas'); c.width = 160; c.height = 90;\n"
  + "    var ctx = c.getContext('2d');\n"
  + "    ctx.drawImage(v, 0, 0, 160, 90);\n"
  + "    var d = ctx.getImageData(0, 0, 160, 90).data;\n"
  + "    var h = 2166136261 >>> 0; var r = 0, g = 0, b = 0, n = 0;\n"
  + "    for (var i = 0; i < d.length; i += 64) {\n"
  + "      h ^= d[i]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "      h ^= d[i + 1]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "      h ^= d[i + 2]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;\n"
  + "    }\n"
  + "    window.__px.hash = ('0000000' + h.toString(16)).slice(-8);\n"
  + "    window.__px.mean = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];\n"
  + "    window.__px.videoW = v.videoWidth; window.__px.videoH = v.videoHeight;\n"
  + "    window.__px.readyState = v.readyState;\n"
  + "  } catch (e) { window.__px.drawError = String(e && e.message ? e.message : e); }\n"
  + "}\n"
  + "var v = document.createElement('video');\n"
  + "v.preload = 'auto'; v.muted = true; v.crossOrigin = 'anonymous';\n"
  + "var seeks = 0;\n"
  + "v.addEventListener('error', function () { var e = v.error; window.__px.error = e ? e.code : null; window.__px.errorMsg = e ? e.message : null; if (mode === 'errdraw' && !window.__px.errDrawn) { window.__px.errDrawn = true; setTimeout(function () { drawNow(); window.__px.afterError = true; window.__px.done = true; }, 500); } else { window.__px.done = true; } });\n"
  + "v.addEventListener('seeked', function () {\n"
  + "  window.__px.atSeeked = v.currentTime;\n"
  + "  seeks++;\n"
  + "  if (t2 !== null && seeks === 1) {\n"
  + "    window.__px.atSeeked1 = v.currentTime;\n"
  + "    setTimeout(function () { try { v.currentTime = t2; } catch (e) { window.__px.setThrew = String(e && e.name); window.__px.done = true; } }, 500);\n"
  + "    return;\n"
  + "  }\n"
  + "  setTimeout(function () { drawNow(); window.__px.done = true; }, 500);\n"
  + "});\n"
  + "v.src = base + f;\n"
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
    let noLength = false;
    if (url.pathname.startsWith("/media-nolength/")) { file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(16))); noLength = true; }
    else if (url.pathname.startsWith("/media/")) file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(7)));
    else file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(1)) === "" ? "pixel.html" : decodeURIComponent(url.pathname.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mp4") ? "video/mp4" : "text/html";
    const size = fs.statSync(file).size;
    if (noLength) res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes" });
    else res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
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
    // Nhiều luồng đợt 51 chạy song song: display chọn lúc load
    // module có thể bị luồng khác chiếm trước khi tới đây — thử
    // lần lượt :90-:99, display nào socket đã tồn tại thì bỏ qua.
    let display = DISPLAY;
    let sock = null;
    for (let n = 90; n <= 99; n++) {
      const cand = ":" + n;
      const s = "/tmp/.X11-unix/X" + n;
      if (fs.existsSync(s)) continue;
      const x = spawn("Xvfb", [cand, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
      let ok = false;
      for (let i = 0; i < 20 && !ok; i++) { await sleep(250); ok = fs.existsSync(s); }
      if (ok) { xvfb = x; display = cand; sock = s; break; }
      try { x.kill("SIGTERM"); } catch {}
    }
    if (!xvfb || !sock) fail("không còn display trống trong :90-:99 (các luồng khác đang giữ)");
    log("dùng display " + display);
    profileDir = path.join(SCRATCH, "chrome-profile-px-" + process.pid);
    const flags = ["--no-sandbox", "--remote-debugging-port=" + PORT, "--remote-debugging-address=127.0.0.1",
      "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
      "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"];
    chrome = spawn(CHROME, flags, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    let version = null;
    for (let i = 0; i < 60 && !version; i++) {
      await sleep(500);
      try { const r = await fetch("http://127.0.0.1:" + PORT + "/json/version"); if (r.ok) version = await r.json(); } catch {}
    }
    if (!version) fail("Chrome không mở được DevTools port " + PORT + " sau 30 s");
    log("Chrome DevTools: " + version.Browser);

    const results = {};
    // Frame tham chiếu (valid) + các probe hỏng mới + tái hiện F6.
    const cases = [
      // refs
      ["R-valid-0.0", "valid-gop.mp4", 0.0],
      ["R-valid-0.5", "valid-gop.mp4", 0.5],
      ["R-valid-1.5", "valid-gop.mp4", 1.5],
      ["R-valid-1.9", "valid-gop.mp4", 1.9],
      ["R-valid-2.0", "valid-gop.mp4", 2.0],
      ["R-valid-2.5", "valid-gop.mp4", 2.5],
      // (a) GOP hỏng giữa file
      ["P-W1-kf20zero-2.5", "var-kf20zero.mp4", 2.5],
      ["P-W12-midp-1.5", "var-midp-zero.mp4", 1.5],
      ["P-W11-lastb-1.9", "var-lastb-zero.mp4", 1.9],
      ["P-W7-p25zero-2.5", "var-p25zero.mp4", 2.5],
      // (b) GOP đầu mất hẳn
      ["P-W2-gop0zero-0.5", "var-gop0zero.mp4", 0.5],
      ["P-W2c-gop0zero-0.0", "var-gop0zero.mp4", 0.0],
      // (c) moov thiếu
      ["P-W13-moovzero-1.5", "var-moovzero.mp4", 1.5],
      // (d) hai bước cùng element (lần 1 lỗi → lần 2)
      ["P-W6-gap-1.5-then-2.5", "broken-gap.mp4", 1.5, 2.5],
      ["P-W6b-valid-1.5-then-2.5", "valid-gop.mp4", 1.5, 2.5],
      // (e) tái hiện F6 §2.3
      ["P-F6-trunc-2.5", "var-trunc-gop2.mp4", 2.5],
      ["P-F6-trunc-2.5-repeat", "var-trunc-gop2.mp4", 2.5],
      ["P-F6-trunc-1.5", "var-trunc-gop2.mp4", 1.5],
      // (f) landing-0 nếu H1 tái hiện (pixel của currentTime 0)
      ["P-H1-gap-2.5", "broken-gap.mp4", 2.5],
      // (g) landing-0 qua server nolength — nếu seeked@0 thì pixel
      // phải là frame 0.0 (landing nhất quán), không phải frame cũ.
      // Flaky (~50% ở lần fetch đầu) nên chạy gap ×2 + valid ×1.
      ["P-H1c-gap-2.5-nolength-1", "broken-gap.mp4", 2.5, null, "nolength"],
      ["P-H1c-gap-2.5-nolength-2", "broken-gap.mp4", 2.5, null, "nolength"],
      ["P-H1c-valid-2.5-nolength-1", "valid-gop.mp4", 2.5, null, "nolength"],
      // (h) frame còn lại SAU LỖI decode (khác F6: ở đây seeked KHÔNG
      // bắn; hỏi element có giữ frame đã trình bày không): seek
      // 1.5 đúng trước (frame 1.5 hiện), rồi seek 2.5 hỏng (E1:
      // keyframe 2.0 zero) — draw sau khi error bắn. E2: seek 1.5
      // trên broken-gap (lỗi ngay, chưa từng có frame nào ngoài 0.0).
      // E3: đối chứng valid hai bước (không lỗi).
      ["P-E1-kf20zero-1.5-then-2.5-errdraw", "var-kf20zero.mp4", 1.5, 2.5, null, "errdraw"],
      ["P-E2-gap-1.5-errdraw", "broken-gap.mp4", 1.5, null, null, "errdraw"],
      ["P-E3-valid-1.5-then-2.5-errdraw", "valid-gop.mp4", 1.5, 2.5, null, "errdraw"],
    ];
    const only = process.env.H3P_ONLY || null;
    const runCases = only ? cases.filter((c) => c[0].includes(only)) : cases;
    if (only) log("chỉ chạy case chứa: " + only + " (" + runCases.length + " case)");
    for (const [key, f, t, t2, base, mode] of runCases) {
      try {
        const r = await runProbe(ORIGIN, `?f=${f}&t=${t}` + (t2 !== undefined && t2 !== null ? `&t2=${t2}` : "") + (base ? `&base=${base}` : "") + (mode ? `&mode=${mode}` : ""));
        results[key] = r;
        log(`PROBE ${key}: hash=${r.hash ?? null} mean=${JSON.stringify(r.mean ?? null)} atSeeked=${r.atSeeked ?? null} atSeeked1=${r.atSeeked1 ?? null} base=${r.base ?? null} mode=${r.mode ?? null} afterError=${r.afterError ?? null} video=${r.videoW ?? null}x${r.videoH ?? null} rs=${r.readyState ?? null} err=${r.error ?? r.drawError ?? r.setThrew ?? r.timeout ?? null}`);
      } catch (e) {
        results[key] = { error: String(e && e.message ? e.message : e) };
        log(`PROBE ${key} ERROR: ${results[key].error}`);
      }
    }

    const h = (k) => results[k]?.hash;
    const refKeys = ["R-valid-0.0", "R-valid-0.5", "R-valid-1.5", "R-valid-1.9", "R-valid-2.0", "R-valid-2.5"];
    const matchRef = (hash) => hash ? refKeys.find((k) => h(k) && h(k) === hash) ?? null : null;
    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 600)); };
    // Đối chứng phương pháp (chỉ khi chạy đủ case; lượt lọc
    // H3P_ONLY bỏ qua các check này thay vì PASS/FAIL oan).
    if (!only) {
      const refs = refKeys.map(h);
      const refsDistinct = refs.every(Boolean) && new Set(refs).size === refs.length;
      check("CONTROL-ref-frames-distinct", refsDistinct ? "PASS" : "FAIL", { refs: Object.fromEntries(refKeys.map((k) => [k, h(k)])) });
      // Tái hiện F6: trunc@2.5 phải = frame 0.0; trunc@1.5 phải = valid@1.5.
      check("CONTROL-f6-trunc-2.5-eq-frame0", h("P-F6-trunc-2.5") && h("P-F6-trunc-2.5") === h("R-valid-0.0") ? "PASS" : "FAIL",
        { trunc25: results["P-F6-trunc-2.5"], trunc25repeat: results["P-F6-trunc-2.5-repeat"], ref0: h("R-valid-0.0") });
      check("CONTROL-trunc-1.5-eq-valid-1.5", h("P-F6-trunc-1.5") && h("P-F6-trunc-1.5") === h("R-valid-1.5") ? "PASS" : "FAIL",
        { p: results["P-F6-trunc-1.5"], ref: h("R-valid-1.5") });
    }
    // Tóm tắt từng probe hỏng mới: frame hiển thị là frame nào
    // (khớp ref nào / màn đen / không có frame vì error).
    const probeKeys = runCases.map((c) => c[0]).filter((k) => !k.startsWith("R-valid") && !k.startsWith("P-F6"));
    const summary = {};
    for (const k of probeKeys) {
      const r = results[k] || {};
      summary[k] = {
        file: r.file, target: r.target, target2: r.target2 ?? null,
        hash: r.hash ?? null, mean: r.mean ?? null,
        matchesReference: matchRef(r.hash),
        isBlack: Array.isArray(r.mean) && r.mean.every((v) => v < 4),
        atSeeked: r.atSeeked ?? null, atSeeked1: r.atSeeked1 ?? null,
        afterError: r.afterError ?? null,
        error: r.error ?? r.drawError ?? r.setThrew ?? r.timeout ?? null,
      };
    }
    check("H3-pixel-corrupt-variants", "OBSERVED", summary);

    console.log(JSON.stringify({ chrome: version, checks, results }, null, 2));
    const failed = checks.filter((c) => c.status === "FAIL").length;
    log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
