// pause47C3-headed.mjs — Phase 9 đợt 47, luồng C3: bằng chứng headed
// cho fail-fast seek-landing-0 + quirk đáp sai frame khác 0 + kind
// "error" + chênh lệch releaseElement (nợ đợt 46 §4 mục 4).
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause47C3-headed.mjs
// Script tự: copy fixture Y2 GỐC (md5 verify, KHÔNG encode lại), build
// 5 fixture biến thể ở /tmp (KHÔNG vào repo, KHÔNG binary vào batch),
// bundle source HIỆN TẠI ra scratch /tmp, bật Xvfb riêng + Chromium
// Playwright (chromium-1248) với --remote-debugging-port=9223 (HTTP,
// KHÔNG dùng --remote-debugging-pipe như B2), mở TAB MỚI cho mỗi probe
// qua /json/new + CDP Page.navigate (Chrome 156 bỏ qua URL ở /json/new
// — xem C3-FIX trong runProbe), chạy các probe rồi in JSON.
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / NOT_MEASURED /
// OBSERVED (không đo được thì ghi rõ lý do, không bịa PASS).
//
// §0. Vì sao harness này khác B2 (và vì sao cần nó): B2 dùng element
// MỚI trong CÙNG tab + pipe + server hỗ trợ Range, fixture
// byte-identical với Y2 mà quirk vẫn không tái hiện. Các biến còn lại
// chưa loại trừ (B2 §3.3): (a) TAB MỚI riêng cho mỗi probe qua
// /json/new trên Chrome chạy tay (thay vì element mới trong cùng tab);
// (b) server Y2 KHÔNG hỗ trợ Range (serve43.mjs trả toàn file, code
// 200, bỏ qua header Range — khác server B2 trả 206); (c) cờ khởi
// động Chrome của phiên Y2 KHÔNG còn bản ghi — harness này dùng xấp
// xỉ tốt nhất (chromium-1248 + DSF=1 + autoplay flag, ghi rõ ở §7).
// Harness này A/B cả hai biến (a) và (b): chuỗi chính dùng server
// Y2-exact (không Range) + tab mới; hai probe cuối lặp lại broken-gap
// 2.5 với server hỗ trợ Range để xem server có phải là biến quyết
// định không. Nếu quirk vẫn vắng mặt ở cả hai chế độ thì kết luận vẫn
// là NOT_MEASURED kèm đầy đủ số liệu — và biến còn lại duy nhất là
// cờ/trạng thái của phiên Chrome Y2 (không tái tạo được nữa).
//
// §0.1. Về "cap 10" ở tầng app (đọc kỹ trước khi trích số): cap X2
// chỉ đếm timeout/error (classifySeekOutcome). seekElement fail
// nhanh (failed-only, ok:true, timedOut:0) ĐI NHÁNH VẼ theo thiết kế
// X2 §1 — failed-only không tới nhánh đếm cap X2 mà đi cap W2 (skip
// 600). Nên fail-fast seek-landing-0 KHÔNG BAO GIỜ chạm cap 10 của
// X2; cap 10 ở tầng app chỉ chạm được qua timeout (B2 đã đo: 17,1 s,
// kind "timeout") hoặc qua kind "error" (cần executor ném — nhiệm vụ
// 3 của luồng này). Harness app-loop riêng (pause47C3-apploop.mjs)
// đo đúng phân biệt này thay vì gán cap 10 cho fail-fast.

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join("/tmp", "pause47c3-headed-" + process.pid);
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.C3_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

// ---------- fixture ----------
// Y2-exact: copy nguyên file gốc, verify md5 (không encode lại).
const Y2_MD5 = {
  "valid-gop.mp4": "2c2e4771954fd26e1c377ce5900e377d",
  "broken-gap.mp4": "f0e11b602e714246466f6936e58afcd1",
};
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
    if (got !== want) fail("md5 " + name + " lệch: " + got + " != " + want + " (file Y2 gốc đã đổi?)");
    out[name] = { file: dst, md5: got, size: fs.statSync(dst).size };
  }
  // Fixture biến thể: zero packet theo khoảng pts (cùng cách làm của
  // B2/Y2: ffprobe JSON có tên trường, zero đúng byte packet).
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
  const truncPy = path.join(SCRATCH, "make-trunc.py");
  writeFileEpermRetry(truncPy, [
    "import json, subprocess, sys",
    "src, dst, upto = sys.argv[1], sys.argv[2], float(sys.argv[3])",
    "out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',",
    "  '-show_entries', 'packet=pts_time,pos,size', '-of', 'json', src],",
    "  capture_output=True, text=True, check=True).stdout",
    "packets = json.loads(out)['packets']",
    "cut = None; lastPts = None",
    "for p in packets:",
    "    try: t = float(p['pts_time'])",
    "    except (KeyError, TypeError, ValueError): continue",
    "    if t <= upto:",
    "        cut = int(p['pos']) + int(p['size']); lastPts = t",
    "data = open(src, 'rb').read()",
    "open(dst, 'wb').write(data[:cut])",
    "print(json.dumps({'cutAt': cut, 'lastPts': lastPts, 'origSize': len(data), 'size': cut}))",
    "",
  ].join("\n"));
  const base = path.join(SCRATCH, "valid-gop.mp4");
  const variants = {
    // Chỉ keyframe GOP2 (pts 2.0, 1 packet): Chrome mất keyframe 2.0
    // nhưng còn GOP1 nguyên + phần sau GOP2 — có thể đáp về keyframe
    // 1.0 (frame 30, sai khác 0) thay vì 0.
    "var-kf20.mp4": ["2.0", "2.0334"],
    // Nửa đầu GOP2: keyframe 2.0 còn nhưng frame 2.0-2.5 hỏng — có thể
    // đáp 2.0 (frame 60) vì không decode tiến được tới 2.5.
    "var-half2.mp4": ["2.0", "2.5"],
    // Toàn GOP2: keyframe 2.0 + frame sau đều hỏng — có thể đáp 1.0
    // (keyframe cuối còn nguyên) thay vì 0.
    "var-gop2.mp4": ["2.0", "3.0"],
    // Nửa đầu GOP1, probe ở 1.5: ứng viên đáp sai 1.0.
    "var-half1.mp4": ["1.0", "1.5"],
  };
  for (const [name, [lo, hi]] of Object.entries(variants)) {
    const info = JSON.parse(execFileSync("python3", [py, base, path.join(SCRATCH, name), lo, hi], { encoding: "utf8" }));
    out[name] = { file: path.join(SCRATCH, name), ...info };
  }
  const truncInfo = JSON.parse(execFileSync("python3", [truncPy, base, path.join(SCRATCH, "var-trunc25.mp4"), "2.5"], { encoding: "utf8" }));
  out["var-trunc25.mp4"] = { file: path.join(SCRATCH, "var-trunc25.mp4"), ...truncInfo };
  return out;
}

function buildBundles() {
  const jobs = [
    ["seek.ts", "seek.mjs"],
    ["pause45A2.ts", "pause45A2.mjs"],
    ["audioEngine.ts", "audioEngine.mjs"],
    ["pauseSeekCap42X2.ts", "pauseSeekCap42X2.mjs"],
  ];
  for (const [src, out] of jobs) {
    execFileSync(ESBUILD, [path.join(WEB_DIR, "src", "lib", src), "--bundle", "--platform=browser", "--format=esm",
      "--outfile=" + path.join(SCRATCH, out)], { stdio: "ignore" });
  }
}

// ---------- trang probe (không dùng backtick / ${} bên trong) ----------
function buildPages() {
  // raw.html — ĐÚNG logic probe2.html của Y2: element mới, gán src,
  // CHỜ 3000 ms rồi gán currentTime MỘT lần, quan sát 6000 ms.
  // ?f=<file>&t=<giây>&range=0|1 (range=1: lấy qua /media-range/ có
  // hỗ trợ Range như server B2; range=0: /media/ kiểu serve43 Y2).
  const raw = "<!doctype html><meta charset=\"utf-8\"><title>C3 raw probe</title><body>\n"
    + "<script>\n"
    + "window.__c3 = { events: [], error: null, seeked: false, setThrew: null, done: false };\n"
    + "var q = new URLSearchParams(location.search);\n"
    + "var f = q.get('f'); var t = parseFloat(q.get('t') || '0.1');\n"
    + "var base = q.get('range') === '1' ? '/media-range/' : '/media/';\n"
    + "window.__c3.targetParam = t; window.__c3.file = f; window.__c3.rangeMode = base;\n"
    + "var v = document.createElement('video');\n"
    + "v.preload = 'auto'; v.muted = true;\n"
    + "v.addEventListener('error', function () { var e = v.error; window.__c3.error = e ? { code: e.code, message: e.message } : null; window.__c3.events.push('error'); });\n"
    + "v.addEventListener('seeked', function () { window.__c3.seeked = true; window.__c3.atSeeked = v.currentTime; window.__c3.events.push('seeked@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('seeking', function () { window.__c3.events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('loadedmetadata', function () { window.__c3.events.push('loadedmetadata'); });\n"
    + "v.addEventListener('canplay', function () { window.__c3.events.push('canplay'); });\n"
    + "v.addEventListener('waiting', function () { window.__c3.events.push('waiting'); });\n"
    + "v.addEventListener('stalled', function () { window.__c3.events.push('stalled'); });\n"
    + "v.src = base + f;\n"
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
  // seekel.html — seekElement (code mới, có WrongLandingTracker B2)
  // trên element đã load + chờ 3000 ms như probe v3; ghi landings,
  // số seeking-event (proxy cho số lần gán), phân loại từng landing.
  const seekel = "<!doctype html><meta charset=\"utf-8\"><title>C3 seekElement probe</title>\n"
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
    + "  var x2Mod = await import('./pauseSeekCap42X2.mjs');\n"
    + "  R.imports = 'ok';\n"
    + "} catch (e) { R.imports = 'FAIL:' + (e && e.message ? e.message : String(e)); window.__c3 = R; window.__c3Ready = true; throw e; }\n"
    + "var q = new URLSearchParams(location.search);\n"
    + "var f = q.get('f'); var t = parseFloat(q.get('t') || '0.1');\n"
    + "var base = q.get('range') === '1' ? '/media-range/' : '/media/';\n"
    + "R.targetParam = t; R.file = f; R.rangeMode = base;\n"
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
  // release.html — đo chênh lệch mock vs Chrome thật về releaseElement
  // (A2 §5.7): đếm createMediaElementSource thật + ghi nó có ném ở lần
  // 2 cho cùng element không, nodes Map còn giữ element không, và gain
  // có rơi về fallback el.volume không.
  const release = "<!doctype html><meta charset=\"utf-8\"><title>C3 releaseElement probe</title>\n"
    + "<script type=\"module\">\n"
    + "var R = { done: false };\n"
    + "function withTimeout(p, ms, label) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error(label + ' khong settle sau ' + ms + ' ms')); }, ms); })]); }\n"
    + "var origCreate = AudioContext.prototype.createMediaElementSource;\n"
    + "var calls = 0; var throws = 0; var throwNames = [];\n"
    + "AudioContext.prototype.createMediaElementSource = function (el) {\n"
    + "  calls++;\n"
    + "  try { return origCreate.call(this, el); }\n"
    + "  catch (e) { throws++; throwNames.push(e && e.name ? e.name : String(e)); throw e; }\n"
    + "};\n"
    + "try {\n"
    + "  var audioMod = await import('./audioEngine.mjs');\n"
    + "  R.imports = 'ok';\n"
    + "} catch (e) { R.imports = 'FAIL:' + (e && e.message ? e.message : String(e)); window.__c3 = R; window.__c3Ready = true; throw e; }\n"
    + "function loadVideo(url) { return new Promise(function (resolve) {\n"
    + "  var v = document.createElement('video'); v.preload = 'auto'; v.muted = true;\n"
    + "  var done = false;\n"
    + "  function fin(kind) { if (done) return; done = true; resolve({ el: v, kind: kind }); }\n"
    + "  v.addEventListener('loadedmetadata', function () { fin('loadedmetadata'); });\n"
    + "  v.addEventListener('error', function () { fin('error'); });\n"
    + "  setTimeout(function () { fin('timeout'); }, 10000);\n"
    + "  v.src = url; document.body.appendChild(v);\n"
    + "}); }\n"
    + "try {\n"
    + "  var engine = new audioMod.AudioEngine();\n"
    + "  var ensured = engine.ensure();\n"
    + "  R.ensured = ensured; R.isReady = engine.isReady; R.ctxState = engine.ctx ? engine.ctx.state : null;\n"
    + "  R.nodesSize0 = engine.nodes ? engine.nodes.size : null;\n"
    + "  if (ensured) {\n"
    + "    var a1 = await loadVideo('./valid-gop.mp4');\n"
    + "    var a2 = await loadVideo('./valid-gop.mp4');\n"
    + "    R.loads = [a1.kind, a2.kind];\n"
    + "    var c0 = calls, th0 = throws;\n"
    + "    engine.update([{ el: a1.el, gain: 0.5 }]);\n"
    + "    R.afterFirstUpdate = { callsDelta: calls - c0, throwsDelta: throws - th0, nodesSize: engine.nodes.size, hasEl1: engine.nodes.has(a1.el), el1Volume: a1.el.volume };\n"
    + "    var rel1 = engine.releaseElement(a1.el);\n"
    + "    R.afterRelease = { rel1: rel1, nodesSize: engine.nodes.size, hasEl1: engine.nodes.has(a1.el) };\n"
    + "    var c1 = calls, th1 = throws;\n"
    + "    engine.update([{ el: a1.el, gain: 0.5 }]);\n"
    + "    R.afterReUpdateSameEl = { callsDelta: calls - c1, throwsDelta: throws - th1, throwNames: throwNames.slice(th1), nodesSize: engine.nodes.size, hasEl1: engine.nodes.has(a1.el), el1Volume: a1.el.volume };\n"
    + "    var c2 = calls, th2 = throws;\n"
    + "    engine.update([{ el: a2.el, gain: 0.5 }]);\n"
    + "    R.afterUpdateFreshEl = { callsDelta: calls - c2, throwsDelta: throws - th2, nodesSize: engine.nodes.size, hasEl2: engine.nodes.has(a2.el) };\n"
    + "    R.mockClaimWouldBe = 'sources.length==2 sau release+update-lai (test mock Z2)';\n"
    + "  }\n"
    + "} catch (e) { R.error = String(e && e.message ? e.message : e); }\n"
    + "R.callsTotal = calls; R.throwsTotal = throws; R.throwNames = throwNames;\n"
    + "R.done = true;\n"
    + "window.__c3 = R;\n"
    + "window.__c3Ready = true;\n"
    + "</script>\n";
  writeFileEpermRetry(path.join(SCRATCH, "release.html"), release);
}

// ---------- CDP qua /json/new + WebSocket (đúng mẫu probe243.mjs) ----------
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
  // C3-FIX (05/11, sau lần chạy đầu bị giết + rerun R1/R2 timeout):
  // Chrome 156 KHÔNG navigate tab mới qua /json/new — cả PUT + JSON
  // body {"url"} lẫn PUT ?url=... đều trả tab about:blank (đã thử
  // tay trên cùng binary: tab ở mãi about:blank sau 12 s). Đây đúng
  // là lỗi "trả undefined cho cả đối chứng valid" mà B2 §3.3 gặp ở
  // scratch probe-y2exact. Cách sửa: tạo tab trống qua /json/new rồi
  // navigate bằng CDP Page.navigate (mẫu đã chứng minh ở apploop
  // B2 / Target.createTarget + Page.navigate).
  const target = await (await fetch("http://127.0.0.1:9223/json/new", {
    method: "PUT",
  })).json();
  if (!target || !target.webSocketDebuggerUrl) throw new Error("json/new không trả webSocketDebuggerUrl: " + JSON.stringify(target));
  const cdp = new TabCdp(target.webSocketDebuggerUrl);
  try {
    await cdp.ready;
    await cdp.send("Runtime.enable", {});
    await cdp.send("Page.enable", {});
    await cdp.send("Page.navigate", { url: origin + "/" + page + query });
    // C3-FIX2: tab mới qua /json/new mở ở NỀN — Chrome đóng băng timer
    // của tab nền (R1/R2 rerun: loadedmetadata/canplay có, nhưng
    // setTimeout 3 s không bao giờ chạy sau 40 s). Đưa tab lên trước
    // thì timer mới chạy.
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
    try { await fetch("http://127.0.0.1:9223/json/close/" + target.id); } catch {}
  }
}

async function main() {
  if (!fs.existsSync(CHROME)) fail("không có chrome " + CHROME);
  if (!DISPLAY) fail("không còn display trống trong :90-:99 (các luồng khác đang giữ)");
  const fixtures = buildFixtures();
  log("fixture Y2 md5 ok: valid-gop " + fixtures["valid-gop.mp4"].md5 + " broken-gap " + fixtures["broken-gap.mp4"].md5);
  for (const name of ["var-kf20.mp4", "var-half2.mp4", "var-gop2.mp4", "var-half1.mp4", "var-trunc25.mp4"]) {
    log("variant " + name + ": " + JSON.stringify(fixtures[name]));
  }
  buildBundles();
  buildPages();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file;
    let rangeMode = false;
    if (url.pathname.startsWith("/media-range/")) { file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(13))); rangeMode = true; }
    else if (url.pathname.startsWith("/media/")) { file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(7))); rangeMode = false; }
    else file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(1)) === "" ? "raw.html" : decodeURIComponent(url.pathname.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mjs") ? "text/javascript" : file.endsWith(".mp4") ? "video/mp4" : "text/html";
    const size = fs.statSync(file).size;
    if (rangeMode && req.headers.range) {
      // Chế độ B2: hỗ trợ Range thật (206).
      const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? parseInt(m[2], 10) : size - 1;
        if (start < size && end >= start) {
          res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": end - start + 1 });
          fs.createReadStream(file, { start, end }).pipe(res);
          return;
        }
      }
      res.writeHead(416, { "Content-Range": "bytes */" + size }); res.end(); return;
    }
    // Chế độ Y2-exact (serve43.mjs): trả TOÀN file, code 200, bỏ qua
    // header Range (chỉ gắn Accept-Ranges) — đúng server phiên Y2.
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://127.0.0.1:" + server.address().port;
  log("scratch server tại " + ORIGIN + " display " + DISPLAY);

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
    log("đã bật Xvfb riêng " + DISPLAY + " (headed thật)");
    profileDir = path.join(SCRATCH, "chrome-profile-" + process.pid);
    // Cờ Chrome: xấp xỉ tốt nhất cho phiên Y2 (KHÔNG còn bản ghi cờ
    // gốc — xem §7 LIMITS): cùng binary chromium-1248 như B2, headed
    // qua Xvfb, DSF=1 (Y2 §5.6 ghi "DSF=1 ép bằng cờ"), autoplay
    // không cần gesture. KHÁC B2: --remote-debugging-port=9223
    // (HTTP endpoint cho /json/new) thay vì --remote-debugging-pipe.
    chrome = spawn(CHROME, ["--no-sandbox", "--remote-debugging-port=9223", "--remote-debugging-address=127.0.0.1",
      "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
      "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    let version = null;
    for (let i = 0; i < 60 && !version; i++) {
      await sleep(500);
      try { const r = await fetch("http://127.0.0.1:9223/json/version"); if (r.ok) version = await r.json(); } catch {}
    }
    if (!version) fail("Chrome không mở được DevTools port 9223 sau 30 s");
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
    // Thứ tự Y2: gap-15 trước gap-25 trong cùng process (B2 §3.3).
    await run("R1-raw-broken-1.5", "raw.html", "?f=broken-gap.mp4&t=1.5&range=0");
    await run("R2-raw-broken-2.5", "raw.html", "?f=broken-gap.mp4&t=2.5&range=0");
    await run("R3-raw-valid-2.5", "raw.html", "?f=valid-gop.mp4&t=2.5&range=0");
    await run("R4-raw-broken-2.5-repeat", "raw.html", "?f=broken-gap.mp4&t=2.5&range=0");
    await run("R5-raw-valid-2.5-repeat", "raw.html", "?f=valid-gop.mp4&t=2.5&range=0");
    await run("R6-seekel-broken-2.5", "seekel.html", "?f=broken-gap.mp4&t=2.5&range=0");
    await run("R7-seekel-valid-2.5", "seekel.html", "?f=valid-gop.mp4&t=2.5&range=0");
    await run("R8-raw-var-kf20-2.5", "raw.html", "?f=var-kf20.mp4&t=2.5&range=0");
    await run("R9-raw-var-half2-2.5", "raw.html", "?f=var-half2.mp4&t=2.5&range=0");
    await run("R10-raw-var-gop2-2.5", "raw.html", "?f=var-gop2.mp4&t=2.5&range=0");
    await run("R11-raw-var-half1-1.5", "raw.html", "?f=var-half1.mp4&t=1.5&range=0");
    await run("R12-raw-var-trunc25-2.5", "raw.html", "?f=var-trunc25.mp4&t=2.5&range=0");
    // A/B chế độ server: cùng broken-gap 2.5 nhưng qua Range (kiểu B2).
    await run("R13-raw-broken-2.5-range", "raw.html", "?f=broken-gap.mp4&t=2.5&range=1");
    await run("R14-seekel-broken-2.5-range", "seekel.html", "?f=broken-gap.mp4&t=2.5&range=1");
    // R15: seekElement trên biến thể đáp sai khác 0 ĐẦU TIÊN (nếu có).
    const wrongNonZero = ["R8-raw-var-kf20-2.5", "R9-raw-var-half2-2.5", "R10-raw-var-gop2-2.5", "R11-raw-var-half1-1.5", "R12-raw-var-trunc25-2.5"]
      .find((k) => {
        const r = results[k];
        return r && typeof r.atSeeked === "number" && r.atSeeked > 0 && Math.abs(r.atSeeked - (r.targetParam ?? 0)) > 0.01;
      });
    if (wrongNonZero) {
      const r = results[wrongNonZero];
      await run("R15-seekel-" + wrongNonZero.slice(7), "seekel.html", "?f=" + r.file + "&t=" + r.targetParam + "&range=0");
      results["R15-source"] = wrongNonZero;
    } else {
      results["R15-source"] = null;
      log("R15 bỏ qua: không biến thể nào đáp sai khác 0 ở mức raw");
    }
    await run("R16-releaseElement", "release.html", "");

    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 700)); };
    const near = (ct, t) => typeof ct === "number" && Math.abs(ct - t) < 0.01;
    // Đối chứng valid (cả 2 lần): raw probe phải đáp đúng 2,5 — nếu
    // đối chứng hỏng thì mọi kết quả broken đều vô nghĩa (bài học A2).
    const validOk = ["R3-raw-valid-2.5", "R5-raw-valid-2.5-repeat"].every((k) => {
      const r = results[k] || {};
      return Array.isArray(r.events) && r.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 2.5));
    });
    check("CONTROL-valid-raw-2.5-x2", validOk ? "PASS" : "FAIL", { R3: results["R3-raw-valid-2.5"], R5: results["R5-raw-valid-2.5-repeat"] });
    check("R1-raw-broken-1.5-observed", "OBSERVED", results["R1-raw-broken-1.5"]);
    check("R2-R4-raw-broken-2.5-observed", "OBSERVED", { R2: results["R2-raw-broken-2.5"], R4: results["R4-raw-broken-2.5-repeat"] });
    // Fail-fast: PASS chỉ khi quirk tái hiện (mọi seeked đều 0) VÀ
    // seekElement fail nhanh (seeked false, timedOut false, đúng 3
    // landing @0, elapsed nhỏ hơn nhiều so với timeout 1200 ms).
    const r6 = results["R6-seekel-broken-2.5"] || {};
    const quirkReproduced = [results["R2-raw-broken-2.5"], results["R4-raw-broken-2.5-repeat"]].every((r) =>
      r && Array.isArray(r.events) && r.events.some((e) => e.startsWith("seeked@")) && r.events.filter((e) => e.startsWith("seeked@")).every((e) => near(parseFloat(e.slice(7)), 0)));
    if (!validOk) {
      check("C3-zero-landing-fail-fast-headed", "NOT_MEASURED", { reason: "doi chung valid hong nen ket qua broken vo nghia", R6: r6 });
    } else if (!quirkReproduced) {
      check("C3-zero-landing-fail-fast-headed", "NOT_MEASURED", { reason: "quirk seeked@0 khong tai hien ngay ca voi tab-moi + server Y2-exact (xem R2/R4)", R6: r6, R2: results["R2-raw-broken-2.5"], R4: results["R4-raw-broken-2.5-repeat"] });
    } else if (r6.settled === true && r6.result && r6.result.seeked === false && r6.result.timedOut === false
      && Array.isArray(r6.landings) && r6.landings.length === 3 && r6.landings.every((l) => l.ct === 0)) {
      check("C3-zero-landing-fail-fast-headed", "PASS", r6);
    } else {
      check("C3-zero-landing-fail-fast-headed", "FAIL", r6);
    }
    // Quirk đáp sai khác 0: liệt kê mọi biến thể, PASS cho seekElement
    // chỉ khi có biến thể đáp sai khác 0 ổn định + seekElement fail ở
    // lần thứ 3 với đúng 3 landing sai.
    const variantKeys = ["R8-raw-var-kf20-2.5", "R9-raw-var-half2-2.5", "R10-raw-var-gop2-2.5", "R11-raw-var-half1-1.5", "R12-raw-var-trunc25-2.5"];
    const variantSummary = {};
    for (const k of variantKeys) {
      const r = results[k] || {};
      variantSummary[k] = { file: r.file, target: r.targetParam, events: r.events, atSeeked: r.atSeeked, after: r.after, error: r.error };
    }
    check("C3-wrong-nonzero-raw-variants-observed", "OBSERVED", variantSummary);
    const r15 = results["R15-seekel-" + (results["R15-source"] ? results["R15-source"].slice(7) : "none")] || null;
    if (!results["R15-source"]) {
      check("C3-wrong-nonzero-fail-fast-headed", "NOT_MEASURED", { reason: "khong bien the nao dap sai khac 0 o muc raw (xem variantSummary)", variantSummary });
    } else if (r15 && r15.settled === true && r15.result && r15.result.seeked === false && r15.result.timedOut === false
      && Array.isArray(r15.landings) && r15.landings.length === 3
      && r15.landings.every((l) => l.ct > 0 && Math.abs(l.ct - (r15.targetParam ?? 0)) > 0.01)) {
      check("C3-wrong-nonzero-fail-fast-headed", "PASS", r15);
    } else {
      check("C3-wrong-nonzero-fail-fast-headed", "FAIL", r15);
    }
    // A/B server: raw + seekel broken-gap 2.5 qua Range có khác không?
    check("C3-server-range-AB-observed", "OBSERVED", { R13: results["R13-raw-broken-2.5-range"], R14: results["R14-seekel-broken-2.5-range"] });
    // releaseElement: đo thật — PASS khi hành vi Chrome khớp A2 §5.7
    // (lần 2 createMediaElementSource NÉM, nodes không tạo lại, gain
    // rơi về fallback el.volume); FAIL nếu tạo source mới như mock.
    const r16 = results["R16-releaseElement"] || {};
    if (!r16.ensured) {
      check("C3-releaseElement-headed", "NOT_MEASURED", r16);
    } else if (r16.afterReUpdateSameEl && r16.afterReUpdateSameEl.throwsDelta >= 1 && r16.afterReUpdateSameEl.nodesSize === 0 && r16.afterReUpdateSameEl.hasEl1 === false) {
      check("C3-releaseElement-headed", "PASS", r16);
    } else if (r16.afterReUpdateSameEl && r16.afterReUpdateSameEl.nodesSize === 1 && r16.afterReUpdateSameEl.hasEl1 === true) {
      check("C3-releaseElement-headed", "FAIL", { ...r16, note: "Chrome tao source moi sau release — DAO NGUOC A2 §5.7, can xem lai" });
    } else {
      check("C3-releaseElement-headed", "FAIL", r16);
    }
    // Đối chứng seekElement valid: phải seeked true, 1 landing đúng.
    const r7 = results["R7-seekel-valid-2.5"] || {};
    const r7Ok = r7.settled === true && r7.result && r7.result.seeked === true
      && Array.isArray(r7.landings) && r7.landings.length >= 1 && r7.landings.every((l) => near(l.ct, 2.5));
    check("CONTROL-valid-seekElement-2.5", r7Ok ? "PASS" : "FAIL", r7);

    console.log(JSON.stringify({ chrome: version, fixtures, checks, results }, null, 2));
    const failed = checks.filter((c) => c.status === "FAIL").length;
    log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
