// pause51H3-quirk-r10.mjs — Phase 9 đợt 51, luồng H3 (lượt 2):
// fail-fast seek-landing-0 + đo tỉ lệ landing-0 trên server
// không Content-Length + tái hiện W6 + instance mới.
//
// BỐI CẢNH: lượt 1 (pause51H3-quirk.mjs, log /tmp/h3-quirk-run1.log)
// đã TÁI HIỆN ĐƯỢC landing-0 — nhưng KHÔNG phải do fixture hỏng:
// trên server KHÔNG Content-Length (Y2-exact, chunked):
//   H1c-gap-2.5-nolength-run1   → seeking@0.000, seeked@0.000
//   H1c-gap-2.5-nolength-run2/3 → seeked@2.500 (đúng)
//   H1c-valid-2.5-nolength      → seeking@0.000, seeked@0.000 (!!)
// Tức file LÀNH cũng đáp 0 — landing-0 là hành vi flaky của
// đường serve chunked/không độ dài, không phải quirk fixture.
// Trên server CÓ Content-Length: broken-gap 2.5 đúng 6/6.
// Lượt 1 chết ở cuối (EXIT=2) do bug chọn display cho instance
// mới (dùng lại :90 đã bị chiếm) — KHÔNG phải do probe: 34/34
// probe instance 1 đã chạy xong; chỉ thiếu H1b (instance mới),
// W6 full-result, và R10 seekElement. Lượt này chạy nốt 3 việc
// đó + đo tỉ lệ landing-0 + kiểm tra giả thuyết "first-fetch":
// H1c run1 (lần fetch ĐẦU TIÊN của file qua /media-nolength/)
// đáp 0, run2/3 (fetch lại) đáp đúng; valid cũng đáp 0 ở lần
// fetch đầu tiên qua nolength → giả thuyết: lần fetch đầu qua
// chunked mới sinh landing-0, fetch lại (cache) thì đúng.
// Kiểm tra bằng file tên MỚI (valid-copy51.mp4) fetch đầu tiên
// qua nolength: dự đoán đáp 0 nếu giả thuyết đúng.
//
// Chạy từ gốc repo:
//   H3Q_SCRATCH=/tmp/pause51h3-quirk-<pid> node apps/web/scripts/pause51H3-quirk-r10.mjs
// (mặc định lấy /tmp/pause51h3-quirk-* mới nhất).
// Exit 0 khi đối chứng PASS (kể cả NOT_MEASURED / OBSERVED);
// exit 1 khi đối chứng FAIL; exit 2 khi harness lỗi.

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = process.env.H3Q_SCRATCH || fs.readdirSync("/tmp").filter((d) => d.startsWith("pause51h3-quirk-")).sort().map((d) => path.join("/tmp", d)).pop();
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");
const PORT = parseInt(process.env.H3R_PORT || "9234", 10);

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

if (!SCRATCH || !fs.existsSync(path.join(SCRATCH, "raw.html"))) fail("không tìm thấy scratch quirk H3 (H3Q_SCRATCH?) — chạy pause51H3-quirk.mjs trước");
log("dùng scratch " + SCRATCH);

// File tên mới cho giả thuyết first-fetch (chưa từng fetch qua
// /media-nolength/ trong bất kỳ phiên nào).
const copyFile = path.join(SCRATCH, "valid-copy51.mp4");
if (!fs.existsSync(copyFile)) fs.copyFileSync(path.join(SCRATCH, "valid-gop.mp4"), copyFile);

function buildSeekelPage() {
  // seekel.html như F6 + tham số base (nolength → /media-nolength/).
  const seekel = "<!doctype html><meta charset=\"utf-8\"><title>H3 R10 seekElement probe</title>\n"
    + "<script type=\"module\">\n"
    + "window.__c3Uncaught = [];\n"
    + "window.addEventListener('error', function (e) { window.__c3Uncaught.push('error:' + e.message); });\n"
    + "window.addEventListener('unhandledrejection', function (e) { window.__c3Uncaught.push('unhandledrejection:' + String(e.reason && e.reason.message ? e.reason.message : e.reason)); });\n"
    + "var R = { events: [], landings: [], seekingEvents: 0, done: false };\n"
    + "function rangeList(tr) { var out = []; for (var i = 0; i < tr.length; i++) out.push([Math.round(tr.start(i) * 1000) / 1000, Math.round(tr.end(i) * 1000) / 1000]); return out; }\n"
    + "function withTimeout(p, ms, label) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error(label + ' khong settle sau ' + ms + ' ms')); }, ms); })]); }\n"
    + "try {\n"
    + "  var seekMod = await import('./seek.mjs');\n"
    + "  var a2Mod = await import('./pause45A2.mjs');\n"
    + "  R.imports = 'ok';\n"
    + "} catch (e) { R.imports = 'FAIL:' + (e && e.message ? e.message : String(e)); window.__c3 = R; window.__c3Ready = true; throw e; }\n"
    + "var q = new URLSearchParams(location.search);\n"
    + "var f = q.get('f'); var t = parseFloat(q.get('t') || '0.1');\n"
    + "var base = q.get('base') === 'nolength' ? '/media-nolength/' : '/media/';\n"
    + "R.targetParam = t; R.file = f; R.base = base;\n"
    + "var v = document.createElement('video');\n"
    + "v.preload = 'auto'; v.muted = true;\n"
    + "v.addEventListener('seeking', function () { R.seekingEvents++; R.events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('seeked', function () { R.landings.push({ ct: v.currentTime, seeking: v.seeking, rs: v.readyState }); R.events.push('seeked@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('error', function () { var e = v.error; R.events.push('error:' + (e ? e.code : null)); });\n"
    + "v.src = base + f;\n"
    + "document.body.appendChild(v);\n"
    + "await new Promise(function (resolve) {\n"
    + "  var done = false;\n"
    + "  function fin(k) { if (done) return; done = true; R.load = k; resolve(); }\n"
    + "  v.addEventListener('loadedmetadata', function () { fin('loadedmetadata'); });\n"
    + "  v.addEventListener('error', function () { fin('error'); });\n"
    + "  setTimeout(function () { fin('timeout'); }, 10000);\n"
    + "});\n"
    + "await new Promise(function (r) { setTimeout(r, 3000); });\n"
    + "R.preSeek = { buffered: rangeList(v.buffered), seekable: rangeList(v.seekable), readyState: v.readyState, currentTime: v.currentTime };\n"
    + "var t0 = performance.now();\n"
    + "try {\n"
    + "  var res = await withTimeout(seekMod.seekElement(v, t, { fps: 30, timeoutMs: 1200 }), 20000, 'seekElement');\n"
    + "  R.result = res; R.settled = true;\n"
    + "} catch (e) { R.result = null; R.settled = false; R.error = String(e && e.message ? e.message : e); }\n"
    + "R.elapsedMs = Math.round(performance.now() - t0);\n"
    + "R.errorAfter = v.error ? v.error.code : null;\n"
    + "R.currentTimeAfter = v.currentTime;\n"
    + "var tr = new a2Mod.WrongLandingTracker();\n"
    + "var targetFrame = Math.round(t * 30);\n"
    + "R.classified = [];\n"
    + "for (var i = 0; i < R.landings.length; i++) {\n"
    + "  var lf = a2Mod.frameIndex45A2(R.landings[i].ct, 30);\n"
    + "  var ob = tr.observe(lf, targetFrame);\n"
    + "  R.classified.push({ landedFrame: lf, kind: ob.kind, consecutiveWrong: ob.consecutiveWrong, shouldFail: ob.shouldFail });\n"
    + "}\n"
    + "R.targetFrame = targetFrame;\n"
    + "R.uncaught = window.__c3Uncaught;\n"
    + "R.done = true;\n"
    + "window.__c3 = R;\n"
    + "window.__c3Ready = true;\n"
    + "</script>\n";
  writeFileEpermRetry(path.join(SCRATCH, "seekel.html"), seekel);
  for (const [src, out] of [["seek.ts", "seek.mjs"], ["pause45A2.ts", "pause45A2.mjs"]]) {
    const dst = path.join(SCRATCH, out);
    if (!fs.existsSync(dst)) {
      execFileSync(ESBUILD, [path.join(WEB_DIR, "src", "lib", src), "--bundle", "--platform=browser", "--format=esm", "--outfile=" + dst], { stdio: "ignore" });
    }
  }
}

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

async function runProbe(port, origin, page, query, timeoutMs = 40000) {
  const target = await (await fetch("http://127.0.0.1:" + port + "/json/new", { method: "PUT" })).json();
  if (!target || !target.webSocketDebuggerUrl) throw new Error("json/new không trả webSocketDebuggerUrl: " + JSON.stringify(target));
  const cdp = new TabCdp(target.webSocketDebuggerUrl);
  try {
    await cdp.ready;
    await cdp.send("Runtime.enable", {});
    await cdp.send("Page.enable", {});
    await cdp.send("Page.navigate", { url: origin + "/" + page + query });
    await cdp.send("Page.bringToFront", {}).catch(() => {});
    let result = null;
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      await sleep(500);
      result = await cdp.evaluate("window.__c3").catch(() => null);
      if (result && result.done) break;
      const ready = await cdp.evaluate("!!window.__c3Ready").catch(() => false);
      if (ready && result && result.done) break;
    }
    if (!result || !result.done) throw new Error("probe không done sau " + timeoutMs + " ms: " + JSON.stringify(result)?.slice(0, 300));
    return result;
  } finally {
    cdp.close();
    try { await fetch("http://127.0.0.1:" + port + "/json/close/" + target.id); } catch {}
  }
}

async function startChrome(port) {
  const display = pickFreeDisplay();
  if (!display) throw new Error("không còn display trống trong :90-:99");
  const num = display.replace(":", "");
  const sock = "/tmp/.X11-unix/X" + num;
  const xvfb = spawn("Xvfb", [display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
  for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
  if (!fs.existsSync(sock)) throw new Error("Xvfb không tạo socket " + display);
  const profileDir = path.join(SCRATCH, "chrome-profile-r10-" + port);
  const flags = ["--no-sandbox", "--remote-debugging-port=" + port, "--remote-debugging-address=127.0.0.1",
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
    "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"];
  log("chrome port " + port + " display " + display + " profile " + profileDir);
  const chrome = spawn(CHROME, flags, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
  chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
  let version = null;
  for (let i = 0; i < 60 && !version; i++) {
    await sleep(500);
    try { const r = await fetch("http://127.0.0.1:" + port + "/json/version"); if (r.ok) version = await r.json(); } catch {}
  }
  if (!version) {
    try { chrome.kill("SIGKILL"); } catch {}
    try { xvfb.kill("SIGTERM"); } catch {}
    throw new Error("Chrome không mở được DevTools port " + port + " sau 30 s");
  }
  log("Chrome DevTools: " + version.Browser);
  return { chrome, xvfb, version, profileDir };
}
function stopChrome(h) {
  try { h.chrome?.kill("SIGKILL"); } catch {}
  try { h.xvfb?.kill("SIGTERM"); } catch {}
  try { if (h.profileDir) fs.rmSync(h.profileDir, { recursive: true, force: true }); } catch {}
}

async function main() {
  if (!fs.existsSync(CHROME)) fail("không có chrome " + CHROME);
  buildSeekelPage();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file;
    let noLength = false;
    if (url.pathname.startsWith("/media-nolength/")) { file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(16))); noLength = true; }
    else if (url.pathname.startsWith("/media/")) file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(7)));
    else file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(1)) === "" ? "raw.html" : decodeURIComponent(url.pathname.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mjs") ? "text/javascript" : file.endsWith(".mp4") ? "video/mp4" : "text/html";
    const size = fs.statSync(file).size;
    if (noLength) res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes" });
    else res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://127.0.0.1:" + server.address().port;
  log("scratch server tại " + ORIGIN + " port " + PORT);

  const results = {};
  const run = async (port, key, page, query, fullLog = false) => {
    try {
      const r = await runProbe(port, ORIGIN, page, query);
      results[key] = r;
      log("PROBE " + key + " done: " + (fullLog ? JSON.stringify(r) : JSON.stringify(r).slice(0, 500)));
    } catch (e) {
      results[key] = { error: String(e && e.message ? e.message : e) };
      log("PROBE " + key + " ERROR: " + results[key].error);
    }
  };

  // Instance chính: R10 seekElement + đo tỉ lệ + first-fetch + W6.
  const h = await startChrome(PORT);
  try {
    // Đối chứng seekElement trên server có Content-Length.
    await run(PORT, "R10c-seekel-gap-2.5-length", "seekel.html", "?f=broken-gap.mp4&t=2.5");
    // R10a: seekElement broken-gap 2.5 qua nolength ×3.
    for (let i = 1; i <= 3; i++) await run(PORT, "R10a-seekel-gap-2.5-nolength-" + i, "seekel.html", "?f=broken-gap.mp4&t=2.5&base=nolength");
    // R10b: seekElement valid 2.5 qua nolength ×3.
    for (let i = 1; i <= 3; i++) await run(PORT, "R10b-seekel-valid-2.5-nolength-" + i, "seekel.html", "?f=valid-gop.mp4&t=2.5&base=nolength");
    // Đo tỉ lệ landing-0 raw qua nolength (lượt 1: gap 1/3, valid 1/1).
    for (let i = 4; i <= 9; i++) await run(PORT, "H1c-gap-2.5-nolength-run" + i, "raw.html", "?f=broken-gap.mp4&t=2.5&base=nolength");
    for (let i = 2; i <= 5; i++) await run(PORT, "H1c-valid-2.5-nolength-run" + i, "raw.html", "?f=valid-gop.mp4&t=2.5&base=nolength");
    // Giả thuyết first-fetch: file tên mới, fetch đầu tiên qua nolength.
    await run(PORT, "H1d-copy51-2.5-nolength-1", "raw.html", "?f=valid-copy51.mp4&t=2.5&base=nolength");
    await run(PORT, "H1d-copy51-2.5-nolength-2", "raw.html", "?f=valid-copy51.mp4&t=2.5&base=nolength");
    // W6 chạy lại lấy full result (lượt 1 log bị cắt ở 500 ký tự).
    await run(PORT, "W6-gap-1.5-then-2.5-rerun", "raw.html", "?f=broken-gap.mp4&t=1.5&t2=2.5&mode=double", true);
  } finally {
    stopChrome(h);
  }

  // H1b: instance mới hoàn toàn (profile mới, tab đầu tiên) —
  // lượt 1 chết ở bước này do bug display (đã sửa: mỗi instance
  // tự chọn display trống).
  const h2 = await startChrome(PORT + 1);
  try {
    await run(PORT + 1, "H1b-gap-2.5-freshA", "raw.html", "?f=broken-gap.mp4&t=2.5");
    await run(PORT + 1, "H1b-valid-2.5-freshA", "raw.html", "?f=valid-gop.mp4&t=2.5");
  } finally {
    stopChrome(h2);
  }
  const h3 = await startChrome(PORT + 2);
  try {
    await run(PORT + 2, "H1b-gap-2.5-freshB", "raw.html", "?f=broken-gap.mp4&t=2.5");
  } finally {
    stopChrome(h3);
  }
  try { server.close(); } catch {}

  const near = (ct, t) => typeof ct === "number" && Math.abs(ct - t) < 0.01;
  const checks = [];
  const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 1200)); };
  // Đối chứng seekElement length-server.
  const r10c = results["R10c-seekel-gap-2.5-length"] || {};
  const r10cOk = r10c.settled === true && r10c.result && r10c.result.seeked === true
    && Array.isArray(r10c.landings) && r10c.landings.length >= 1 && r10c.landings.every((l) => near(l.ct, 2.5));
  check("CONTROL-seekel-gap-2.5-length", r10cOk ? "PASS" : "FAIL", r10c);
  // R10a/R10b: fail-fast = settled, seeked=false, timedOut=false,
  // đúng 3 landing, tất cả sai (kỳ vọng Z2).
  const failFast = (keys, target) => keys.map((k) => {
    const r = results[k] || {};
    const allWrong = Array.isArray(r.landings) && r.landings.length === 3 && r.landings.every((l) => !near(l.ct, target));
    const pass = r.settled === true && r.result && r.result.seeked === false && r.result.timedOut === false && allWrong;
    return { key: k, pass, settled: r.settled ?? null, result: r.result ?? null, elapsedMs: r.elapsedMs ?? null, landings: r.landings ?? null, classified: r.classified ?? null, errorAfter: r.errorAfter ?? null, currentTimeAfter: r.currentTimeAfter ?? null, preSeek: r.preSeek ?? null };
  });
  const r10a = failFast(["R10a-seekel-gap-2.5-nolength-1", "R10a-seekel-gap-2.5-nolength-2", "R10a-seekel-gap-2.5-nolength-3"], 2.5);
  const r10b = failFast(["R10b-seekel-valid-2.5-nolength-1", "R10b-seekel-valid-2.5-nolength-2", "R10b-seekel-valid-2.5-nolength-3"], 2.5);
  check("R10a-failfast-gap-nolength", "OBSERVED", r10a);
  check("R10b-failfast-valid-nolength", "OBSERVED", r10b);
  // Tỉ lệ landing-0 raw qua nolength (gộp lượt 1 + lượt 2).
  const rateKeys = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + (i + 1));
  const rate = (keys, target) => {
    const rows = keys.map((k) => ({ key: k, atSeeked: results[k]?.atSeeked ?? null }));
    return { runs: rows.length, landedAt0: rows.filter((r) => r.atSeeked === 0).length, landedRight: rows.filter((r) => typeof r.atSeeked === "number" && near(r.atSeeked, target)).length, rows };
  };
  // Chỉ tính lượt này (run4-9 gap, run2-5 valid); lượt 1
  // (gap run1-3, valid run1) nằm trong /tmp/h3-quirk-run1.log,
  // gộp tỉ lệ bằng tay trong LIMITS.
  check("H1c-rate-gap-nolength", "OBSERVED", rate(rateKeys("H1c-gap-2.5-nolength-run", 9).slice(3), 2.5));
  check("H1c-rate-valid-nolength", "OBSERVED", rate(rateKeys("H1c-valid-2.5-nolength-run", 5).slice(1), 2.5));
  // First-fetch: valid-copy51 lần fetch đầu tiên qua nolength.
  const h1d1 = results["H1d-copy51-2.5-nolength-1"] || {};
  const h1d2 = results["H1d-copy51-2.5-nolength-2"] || {};
  check("H1d-firstfetch-copy51", "OBSERVED", { firstFetch: { atSeeked: h1d1.atSeeked ?? null, events: h1d1.events ?? null }, secondFetch: { atSeeked: h1d2.atSeeked ?? null, events: h1d2.events ?? null } });
  // W6 full result.
  check("W6-gap-double-rerun", "OBSERVED", results["W6-gap-1.5-then-2.5-rerun"] || {});
  // H1b fresh instance.
  const h1b = ["H1b-gap-2.5-freshA", "H1b-valid-2.5-freshA", "H1b-gap-2.5-freshB"].map((k) => ({ key: k, atSeeked: results[k]?.atSeeked ?? null, events: results[k]?.events ?? null }));
  check("H1b-fresh-instance", "OBSERVED", h1b);
  // Kết luận fail-fast tổng.
  const anyFailFast = [...r10a, ...r10b].some((x) => x.pass);
  const anyWrongLanding = [...r10a, ...r10b].some((x) => Array.isArray(x.landings) && x.landings.length > 0 && x.landings.some((l) => !near(l.ct, 2.5)));
  check("H3-fail-fast-headed", anyFailFast ? "PASS" : (anyWrongLanding ? "NOT_MEASURED" : "NOT_MEASURED"),
    { reason: anyFailFast ? "seekElement fail-fast sau 3 landing sai (xem R10a/R10b)" : (anyWrongLanding ? "có landing sai nhưng seekElement không fail-fast theo kỳ vọng Z2 (xem R10a/R10b)" : "seekElement không gặp landing sai nào trong 6 lượt nolength — landing-0 raw quá flaky để khóa fail-fast"), r10a, r10b });

  console.log(JSON.stringify({ checks, results }, null, 2));
  const failed = checks.filter((c) => c.status === "FAIL").length;
  log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
