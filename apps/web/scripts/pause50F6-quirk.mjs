// pause50F6-quirk.mjs — Phase 9 đợt 50, luồng F6: thử hướng fixture mới
// cho quirk đáp sai frame + fail-fast seek-landing-0 headed
// (nối E4 §7.1–7.2, D3 §8, C3 §9).
//
// Hướng mới đợt này (chưa thử ở C3/D3/E4): CẮT GOP NHƯNG GIỮ moov/stss
// hợp lệ + keyframe lỗi ở vị trí khác trong GOP. Cụ thể, trên
// valid-gop.mp4 (3 GOP ở 0/1/2 s, 30 fps, moov NẰM TRƯỚC mdat nên cắt
// đuôi file không chạm moov):
//   V1 var-gop1zero: zero TOÀN BỘ GOP 1 (pts 1.0–2.0, ~30 packet) —
//      moov/stss giữ nguyên, offsets giữ nguyên (cùng độ dài file).
//      Seek 1.5: decoder cần keyframe 1.0 (đã zero) + toàn bộ P/B sau
//      nó (đã zero) — có thể hỏng pipeline error 3, hoặc rơi về
//      keyframe 0.0 rồi decode tiến (đáp đúng 1.5), hoặc đáp sai.
//   V2 var-gop1pzero: GIỮ keyframe 1.0 nguyên, zero toàn bộ P/B của
//      GOP 1 (pts 1.0333–2.0) — decoder decode được keyframe 1.0 rồi
//      gặp P-frame rác: có thể xuất frame 1.0 và bắn seeked@1.0
//      (đáp sai khác 0 — ứng viên tốt nhất), hoặc hỏng pipeline.
//   V3 var-p15zero: zero đúng 1 packet P-frame ở pts 1.5 (frame đích)
//      — decoder có thể đáp frame tốt gần nhất trước đó (1.4667,
//      đáp sai khác 0), hoặc bỏ qua packet hỏng và đáp đúng.
//   V4 var-trunc-gop2: CẮT ĐUÔI FILE ở offset 206286 (= đầu keyframe
//      2.0, cuối GOP 1) — moov còn nguyên, vẫn khai duration 3 s /
//      3 keyframe, nhưng sample GOP 2 không còn trong mdat. Seek 2.5:
//      demuxer tìm keyframe 2.0 ở offset = EOF — có thể error, kẹt
//      seeking, hoặc đáp sai.
//   V5 var-gop2zero: zero TOÀN BỘ GOP 2 (pts 2.0–3.0). Seek 2.5.
// Đối chứng: valid-gop seek 1.5 raw + seekElement; trunc-gop2 seek 1.5
// (GOP 1 còn nguyên → phải đáp đúng, chứng minh file cắt vẫn chơi được
// phần còn lại).
//
// Nếu biến thể nào đáp sai ở mức raw (seeked@ct với ct != target, kể cả
// ct == 0), chạy tiếp seekElement trên biến thể đó để đo fail-fast:
// kỳ vọng Z2 fail-fast = seekElement trả { seeked:false, timedOut:false }
// sau đúng 3 landing sai liên tiếp (không treo tới timeout 20 s).
// Không biến thể nào đáp sai = NOT_MEASURED (không phải FAIL của
// harness) — ghi rõ đã thử gì để đợt sau tiếp tục.
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause50F6-quirk.mjs
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / NOT_MEASURED / OBSERVED.

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join("/tmp", "pause50f6-quirk-" + process.pid);
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");
const PORT = parseInt(process.env.F6Q_PORT || "9226", 10);

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.F6Q_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

// ---------- fixture ----------
const Y2_MD5 = { "valid-gop.mp4": "2c2e4771954fd26e1c377ce5900e377d" };
function md5(file) {
  return execFileSync("md5sum", [file], { encoding: "utf8" }).split(/\s+/)[0];
}
function buildFixtures() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const out = {};
  for (const [name, want] of Object.entries(Y2_MD5)) {
    const src = path.join(Y2_MEDIA, name);
    const dst = path.join(SCRATCH, name);
    fs.copyFileSync(src, dst);
    const got = md5(dst);
    if (got !== want) fail("md5 " + name + " lệch: " + got + " != " + want);
    out[name] = { file: dst, md5: got, size: fs.statSync(dst).size };
  }
  // Zero packet theo khoảng pts (cùng cách làm B2/Y2/C3/E4).
  const py = path.join(SCRATCH, "make-variant.py");
  writeFileEpermRetry(py, [
    "import json, subprocess, sys",
    "src, dst, lo, hi = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])",
    "out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',",
    "  '-show_entries', 'packet=pts_time,pos,size', '-of', 'json', src],",
    "  capture_output=True, text=True, check=True).stdout",
    "packets = json.loads(out)['packets']",
    "data = bytearray(open(src, 'rb').read())",
    "n = 0; total = 0; first = None; last = None; lastSize = 0",
    "for p in packets:",
    "    try: t = float(p['pts_time'])",
    "    except (KeyError, TypeError, ValueError): continue",
    "    if lo <= t < hi:",
    "        pos = int(p['pos']); size = int(p['size'])",
    "        data[pos:pos+size] = b'\\x00' * size",
    "        n += 1; total += size",
    "        first = pos if first is None else first; last = pos; lastSize = size",
    "open(dst, 'wb').write(bytes(data))",
    "print(json.dumps({'packetsZeroed': n, 'bytesZeroed': total, 'firstPos': first, 'lastPos': last, 'lastEnd': last + lastSize if last is not None else None, 'size': len(data)}))",
    "",
  ].join("\n"));
  const base = path.join(SCRATCH, "valid-gop.mp4");
  // V1: zero toàn bộ GOP 1 (pts 1.0–2.0).
  const gop1zero = JSON.parse(execFileSync("python3", [py, base, path.join(SCRATCH, "var-gop1zero.mp4"), "1.0", "2.0"], { encoding: "utf8" }));
  out["var-gop1zero.mp4"] = { file: path.join(SCRATCH, "var-gop1zero.mp4"), ...gop1zero };
  // V2: giữ keyframe 1.0, zero toàn bộ P/B GOP 1 (pts 1.0333–2.0).
  const gop1pzero = JSON.parse(execFileSync("python3", [py, base, path.join(SCRATCH, "var-gop1pzero.mp4"), "1.0333", "2.0"], { encoding: "utf8" }));
  out["var-gop1pzero.mp4"] = { file: path.join(SCRATCH, "var-gop1pzero.mp4"), ...gop1pzero };
  // V3: zero đúng 1 packet P-frame ở pts 1.5.
  const p15zero = JSON.parse(execFileSync("python3", [py, base, path.join(SCRATCH, "var-p15zero.mp4"), "1.5", "1.5334"], { encoding: "utf8" }));
  out["var-p15zero.mp4"] = { file: path.join(SCRATCH, "var-p15zero.mp4"), ...p15zero };
  // V5: zero toàn bộ GOP 2 (pts 2.0–3.0).
  const gop2zero = JSON.parse(execFileSync("python3", [py, base, path.join(SCRATCH, "var-gop2zero.mp4"), "2.0", "3.0"], { encoding: "utf8" }));
  out["var-gop2zero.mp4"] = { file: path.join(SCRATCH, "var-gop2zero.mp4"), ...gop2zero };
  // V4: cắt đuôi file ở đầu keyframe 2.0 — tính từ packet list: offset
  // bắt đầu của packet keyframe pts 2.0 (= cuối GOP 1). moov nằm TRƯỚC
  // mdat (ftyp 32 + moov 1828 + free 8 + mdat @1868) nên cắt đuôi
  // không chạm moov/stss.
  const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "packet=pts_time,pos,size", "-of", "json", base], { encoding: "utf8" }));
  const kf2 = probe.packets.find((p) => Math.abs(parseFloat(p.pts_time) - 2.0) < 1e-6);
  if (!kf2) fail("không tìm thấy packet keyframe pts 2.0");
  const cutAt = parseInt(kf2.pos, 10);
  const data = fs.readFileSync(base);
  const trunc = data.subarray(0, cutAt);
  writeFileEpermRetry(path.join(SCRATCH, "var-trunc-gop2.mp4"), trunc);
  out["var-trunc-gop2.mp4"] = { file: path.join(SCRATCH, "var-trunc-gop2.mp4"), cutAt, origSize: data.length, size: trunc.length };
  return out;
}

function buildBundles() {
  for (const [src, out] of [["seek.ts", "seek.mjs"], ["pause45A2.ts", "pause45A2.mjs"]]) {
    execFileSync(ESBUILD, [path.join(WEB_DIR, "src", "lib", src), "--bundle", "--platform=browser", "--format=esm",
      "--outfile=" + path.join(SCRATCH, out)], { stdio: "ignore" });
  }
}

function buildPages() {
  const raw = "<!doctype html><meta charset=\"utf-8\"><title>F6 raw probe</title><body>\n"
    + "<script>\n"
    + "window.__c3 = { events: [], error: null, seeked: false, setThrew: null, done: false };\n"
    + "var q = new URLSearchParams(location.search);\n"
    + "var f = q.get('f'); var t = parseFloat(q.get('t') || '0.1');\n"
    + "window.__c3.targetParam = t; window.__c3.file = f;\n"
    + "var v = document.createElement('video');\n"
    + "v.preload = 'auto'; v.muted = true;\n"
    + "v.addEventListener('error', function () { var e = v.error; window.__c3.error = e ? { code: e.code, message: e.message } : null; window.__c3.events.push('error'); });\n"
    + "v.addEventListener('seeked', function () { window.__c3.seeked = true; window.__c3.atSeeked = v.currentTime; window.__c3.events.push('seeked@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('seeking', function () { window.__c3.events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('loadedmetadata', function () { window.__c3.events.push('loadedmetadata'); });\n"
    + "v.addEventListener('canplay', function () { window.__c3.events.push('canplay'); });\n"
    + "v.addEventListener('waiting', function () { window.__c3.events.push('waiting'); });\n"
    + "v.addEventListener('stalled', function () { window.__c3.events.push('stalled'); });\n"
    + "v.src = '/media/' + f;\n"
    + "document.body.appendChild(v);\n"
    + "setTimeout(function () {\n"
    + "  window.__c3.beforeSet = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "  try { v.currentTime = t; window.__c3.setThrew = false; }\n"
    + "  catch (err) { window.__c3.setThrew = String(err && err.name); }\n"
    + "  setTimeout(function () {\n"
    + "    window.__c3.after = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "    window.__c3.done = true;\n"
    + "  }, 6000);\n"
    + "}, 3000);\n"
    + "</script>\n";
  writeFileEpermRetry(path.join(SCRATCH, "raw.html"), raw);
  const seekel = "<!doctype html><meta charset=\"utf-8\"><title>F6 seekElement probe</title>\n"
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
    + "R.targetParam = t; R.file = f;\n"
    + "var v = document.createElement('video');\n"
    + "v.preload = 'auto'; v.muted = true;\n"
    + "v.addEventListener('seeking', function () { R.seekingEvents++; R.events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('seeked', function () { R.landings.push({ ct: v.currentTime, seeking: v.seeking, rs: v.readyState }); R.events.push('seeked@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('error', function () { var e = v.error; R.events.push('error:' + (e ? e.code : null)); });\n"
    + "v.src = '/media/' + f;\n"
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

async function runProbe(origin, page, query, timeoutMs = 40000) {
  const target = await (await fetch("http://127.0.0.1:" + PORT + "/json/new", { method: "PUT" })).json();
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
    try { await fetch("http://127.0.0.1:" + PORT + "/json/close/" + target.id); } catch {}
  }
}

async function main() {
  if (!fs.existsSync(CHROME)) fail("không có chrome " + CHROME);
  if (!DISPLAY) fail("không còn display trống trong :90-:99 (các luồng khác đang giữ)");
  const fixtures = buildFixtures();
  log("fixture: " + JSON.stringify(fixtures));
  buildBundles();
  buildPages();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file;
    if (url.pathname.startsWith("/media/")) file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(7)));
    else file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(1)) === "" ? "raw.html" : decodeURIComponent(url.pathname.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mjs") ? "text/javascript" : file.endsWith(".mp4") ? "video/mp4" : "text/html";
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
    profileDir = path.join(SCRATCH, "chrome-profile-" + process.pid);
    const flags = ["--no-sandbox", "--remote-debugging-port=" + PORT, "--remote-debugging-address=127.0.0.1",
      "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
      "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"];
    log("chrome flags: " + JSON.stringify(flags));
    chrome = spawn(CHROME, flags, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    let version = null;
    for (let i = 0; i < 60 && !version; i++) {
      await sleep(500);
      try { const r = await fetch("http://127.0.0.1:" + PORT + "/json/version"); if (r.ok) version = await r.json(); } catch {}
    }
    if (!version) fail("Chrome không mở được DevTools port " + PORT + " sau 30 s");
    log("Chrome DevTools: " + version.Browser + " | " + version["Protocol-Version"]);

    const results = {};
    const run = async (key, page, query) => {
      try {
        const r = await runProbe(ORIGIN, page, query);
        results[key] = r;
        log("PROBE " + key + " done: " + JSON.stringify(r).slice(0, 400));
      } catch (e) {
        results[key] = { error: String(e && e.message ? e.message : e) };
        log("PROBE " + key + " ERROR: " + results[key].error);
      }
    };
    // Đối chứng + 5 hướng fixture mới (V1/V2/V3/V4/V5).
    await run("R1-raw-valid-1.5", "raw.html", "?f=valid-gop.mp4&t=1.5");
    await run("R2-raw-gop1zero-1.5", "raw.html", "?f=var-gop1zero.mp4&t=1.5");
    await run("R3-raw-gop1zero-2.5", "raw.html", "?f=var-gop1zero.mp4&t=2.5");
    await run("R4-raw-gop1pzero-1.5", "raw.html", "?f=var-gop1pzero.mp4&t=1.5");
    await run("R5-raw-p15zero-1.5", "raw.html", "?f=var-p15zero.mp4&t=1.5");
    await run("R6-raw-gop2zero-2.5", "raw.html", "?f=var-gop2zero.mp4&t=2.5");
    await run("R7-raw-trunc-2.5", "raw.html", "?f=var-trunc-gop2.mp4&t=2.5");
    await run("R8-raw-trunc-1.5", "raw.html", "?f=var-trunc-gop2.mp4&t=1.5");
    await run("R9-seekel-valid-1.5", "seekel.html", "?f=valid-gop.mp4&t=1.5");

    // Tìm biến thể đáp sai ở mức raw (seeked@ct, ct != target — kể cả 0).
    const near = (ct, t) => typeof ct === "number" && Math.abs(ct - t) < 0.01;
    const rawKeys = ["R2-raw-gop1zero-1.5", "R3-raw-gop1zero-2.5", "R4-raw-gop1pzero-1.5", "R5-raw-p15zero-1.5", "R6-raw-gop2zero-2.5", "R7-raw-trunc-2.5", "R8-raw-trunc-1.5"];
    const wrongKeys = rawKeys.filter((k) => {
      const r = results[k];
      return r && typeof r.atSeeked === "number" && !near(r.atSeeked, r.targetParam ?? 0);
    });
    log("biến thể đáp sai ở mức raw: " + JSON.stringify(wrongKeys));
    if (wrongKeys.length > 0) {
      const k = wrongKeys[0];
      const r = results[k];
      await run("R10-seekel-" + k.slice(3), "seekel.html", "?f=" + r.file + "&t=" + r.targetParam);
      results["R10-source"] = k;
    } else {
      results["R10-source"] = null;
      log("R10 bỏ qua: không biến thể nào đáp sai ở mức raw");
    }

    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 900)); };
    const r1 = results["R1-raw-valid-1.5"] || {};
    const r1Ok = Array.isArray(r1.events) && r1.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 1.5));
    check("CONTROL-valid-raw-1.5", r1Ok ? "PASS" : "FAIL", r1);
    const r9 = results["R9-seekel-valid-1.5"] || {};
    const r9Ok = r9.settled === true && r9.result && r9.result.seeked === true
      && Array.isArray(r9.landings) && r9.landings.length >= 1 && r9.landings.every((l) => near(l.ct, 1.5));
    check("CONTROL-valid-seekElement-1.5", r9Ok ? "PASS" : "FAIL", r9);
    const r8 = results["R8-raw-trunc-1.5"] || {};
    const r8Ok = Array.isArray(r8.events) && r8.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 1.5));
    check("CONTROL-trunc-gop1-intact-1.5", r8Ok ? "PASS" : "FAIL", r8);
    const variantSummary = {};
    for (const k of rawKeys) {
      const r = results[k] || {};
      variantSummary[k] = { file: r.file, target: r.targetParam, events: r.events, atSeeked: r.atSeeked, after: r.after, error: r.error };
    }
    check("F6-quirk-variants-observed", "OBSERVED", variantSummary);
    if (!r1Ok || !r9Ok) {
      check("F6-fail-fast-headed", "NOT_MEASURED", { reason: "đối chứng valid hỏng nên kết quả biến thể vô nghĩa", R1: r1, R9: r9 });
    } else if (!results["R10-source"]) {
      check("F6-fail-fast-headed", "NOT_MEASURED", { reason: "không biến thể nào đáp sai ở mức raw (xem variantSummary) — 5 hướng fixture mới đều không tạo được landing sai", variantSummary });
    } else {
      const r10 = results["R10-seekel-" + results["R10-source"].slice(3)] || {};
      const target = r10.targetParam ?? 0;
      const allWrong = Array.isArray(r10.landings) && r10.landings.length === 3
        && r10.landings.every((l) => !near(l.ct, target));
      const pass = r10.settled === true && r10.result && r10.result.seeked === false && r10.result.timedOut === false && allWrong;
      check("F6-fail-fast-headed", pass ? "PASS" : "FAIL", r10);
    }

    console.log(JSON.stringify({ chrome: version, fixtures, checks, results }, null, 2));
    const failed = checks.filter((c) => c.status === "FAIL").length;
    log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
