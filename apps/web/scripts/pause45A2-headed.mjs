// pause45A2-headed.mjs — Phase 9 đợt 45, luồng A2: bằng chứng browser
// headed cho 3 sửa pause đợt 44 Z2 + thử tái hiện kind "error" + quan
// sát quirk đáp sai frame khác 0 (nợ đợt 44 §4.3).
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause45A2-headed.mjs
// Script tự: tạo fixture ở /tmp (KHÔNG vào repo, KHÔNG binary vào
// batch), bundle source HIỆN TẠI ra scratch /tmp (không dùng
// apps/web/dist đóng băng — xem lý do ở §0), bật Xvfb riêng + Chromium
// headed qua CDP pipe (mẫu clicktest-round44-z6-compat-pipe.mjs), chạy
// các kiểm tra rồi in JSON kết quả. Exit 1 khi có kiểm tra FAIL;
// exit 0 khi mọi kiểm tra PASS hoặc NOT_MEASURED (không đo được thì
// ghi rõ lý do, không bịa PASS).
//
// §0. Vì sao không dùng app/dist đóng băng: dist đã strip comment nên
// không đối chiếu được hunk marker ROUND44-Z2, và không chứng minh
// được dist đó chứa đúng code Z2 hiện tại. Bundle trực tiếp seek.ts /
// pauseLoopGuard44Z2.ts / pause45A2.ts / audioEngine.ts / helper pause
// từ source hiện tại rồi chạy trong Chromium thật vẫn là bằng chứng
// browser cho đúng code đang xét — chỉ khác ở chỗ chưa chạy qua vòng
// lặp preview.tsx đầy đủ (xem LIMITS A2 §2: vòng lặp preview đầy đủ
// cần project state + điều khiển app, ngoài phạm vi luồng này và bị
// chặn bởi quy tắc không sửa preview.tsx do A6 đang sửa file đó).
// Vì vậy kết quả (a) ở đây là "guard + điều kiện ngủ chạy đúng trong
// Chromium thật", KHÔNG phải "vòng lặp preview thật đã ngủ".

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join("/tmp", "pause45a2-headed-" + process.pid);
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.A2_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id); this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) { try { proc.stdio[s]?.on("error", () => {}); } catch {} }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error("CDP timeout " + method)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); } catch (e) { this.pending.delete(id); clearTimeout(timer); reject(e); }
    });
  }
  async evaluate(expr, sessionId) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
}

function buildFixtures() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const valid = path.join(SCRATCH, "valid-gop.mp4");
  const broken = path.join(SCRATCH, "broken-gap.mp4");
  const mpeg4 = path.join(SCRATCH, "mpeg4-unsupported.mp4");
  const empty = path.join(SCRATCH, "empty.mp4");
  const garbage = path.join(SCRATCH, "garbage.mp4");
  // valid: testsrc2 640x360, 3 s, 30 fps, GOP 30 (keyframe 0/1/2 s) + sine 440 Hz.
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=3",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-c:v", "libx264", "-g", "30", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest", valid], { stdio: "ignore" });
  // broken-gap: copy valid, zero toàn bộ packet có pts_time trong [1.0, 2.0)
  // (phương pháp Y2 §3.1, dùng ffprobe JSON có tên trường — không dùng CSV).
  const py = path.join(SCRATCH, "make-broken-gap.py");
  writeFileEpermRetry(py, [
    "import json, subprocess, sys",
    "src, dst = sys.argv[1], sys.argv[2]",
    "out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',",
    "  '-show_entries', 'packet=pts_time,pos,size', '-of', 'json', src],",
    "  capture_output=True, text=True, check=True).stdout",
    "packets = json.loads(out)['packets']",
    "data = bytearray(open(src, 'rb').read())",
    "n = 0; total = 0; first = None; last = None",
    "for p in packets:",
    "    try: t = float(p['pts_time'])",
    "    except (KeyError, TypeError, ValueError): continue",
    "    if 1.0 <= t < 2.0:",
    "        pos = int(p['pos']); size = int(p['size'])",
    "        data[pos:pos+size] = b'\\x00' * size",
    "        n += 1; total += size",
    "        first = pos if first is None else first; last = pos",
    "open(dst, 'wb').write(bytes(data))",
    "print(json.dumps({'packetsZeroed': n, 'bytesZeroed': total, 'firstPos': first, 'lastPos': last, 'size': len(data)}))",
    "",
  ].join("\n"));
  const brokenInfo = JSON.parse(execFileSync("python3", [py, valid, broken], { encoding: "utf8" }));
  // mpeg4-unsupported: MPEG-4 Part 2 (Chrome không decode) — fixture Y2 §1.1.
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=3",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-c:v", "mpeg4", "-c:a", "aac", "-shortest", mpeg4], { stdio: "ignore" });
  writeFileEpermRetry(empty, Buffer.alloc(0));
  writeFileEpermRetry(garbage, Buffer.from(Array.from({ length: 1024 }, (_, i) => (i * 37 + 11) % 256)));
  return { valid, broken, mpeg4, empty, garbage, brokenInfo };
}

function buildBundles() {
  const jobs = [
    ["seek.ts", "seek.mjs"],
    ["pauseLoopGuard44Z2.ts", "guard.mjs"],
    ["pause45A2.ts", "pause45A2.mjs"],
    ["audioEngine.ts", "audioEngine.mjs"],
    ["pauseDraw40V3.ts", "pauseDraw40V3.mjs"],
    ["pauseDraw41W2.ts", "pauseDraw41W2.mjs"],
    ["pauseSeekCap42X2.ts", "pauseSeekCap42X2.mjs"],
  ];
  for (const [src, out] of jobs) {
    execFileSync(ESBUILD, [path.join(WEB_DIR, "src", "lib", src), "--bundle", "--platform=browser", "--format=esm",
      "--outfile=" + path.join(SCRATCH, out)], { stdio: "ignore" });
  }
}

function buildPage() {
  // Trang test: KHÔNG dùng backtick / ${} bên trong để khỏi xung đột
  // với template literal của harness. Mọi bước đều try/catch riêng và
  // ghi vào window.__a2Result; một bước lỗi không giết các bước sau.
  const page = "<!doctype html><meta charset=\"utf-8\"><title>Pause 45A2 headed</title>\n"
    + "<script type=\"module\">\n"
    + "window.__a2Uncaught = [];\n"
    + "window.addEventListener('error', function (e) { window.__a2Uncaught.push('error:' + e.message); });\n"
    + "window.addEventListener('unhandledrejection', function (e) { window.__a2Uncaught.push('unhandledrejection:' + String(e.reason && e.reason.message ? e.reason.message : e.reason)); });\n"
    + "var R = {};\n"
    + "function withTimeout(p, ms, label) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error(label + ' khong settle sau ' + ms + ' ms')); }, ms); })]); }\n"
    + "function loadVideo(url) { return new Promise(function (resolve) {\n"
    + "  var v = document.createElement('video'); v.preload = 'auto'; v.muted = true;\n"
    + "  v.style.cssText = 'position:absolute;left:0;top:0;width:320px;height:180px;';\n"
    + "  document.body.appendChild(v);\n"
    + "  var done = false;\n"
    + "  function fin(kind, extra) { if (done) return; done = true; resolve({ el: v, kind: kind, extra: extra || null }); }\n"
    + "  v.addEventListener('loadedmetadata', function () { fin('loadedmetadata', { duration: v.duration, readyState: v.readyState }); });\n"
    + "  v.addEventListener('error', function () { var e = v.error; fin('error', { code: e ? e.code : null, message: e ? e.message : null }); });\n"
    + "  setTimeout(function () { fin('timeout', { readyState: v.readyState }); }, 10000);\n"
    + "  v.src = url;\n"
    + "}); }\n"
    + "function rangeList(tr) { var out = []; for (var i = 0; i < tr.length; i++) out.push([Math.round(tr.start(i) * 1000) / 1000, Math.round(tr.end(i) * 1000) / 1000]); return out; }\n"
    + "function seekWithLandings(seekMod, el, target) { return new Promise(function (resolve) {\n"
    + "  var landings = [];\n"
    + "  var preSeek = { buffered: rangeList(el.buffered), seekable: rangeList(el.seekable), readyState: el.readyState, currentTime: el.currentTime };\n"
    + "  function onSeeked() { landings.push({ ct: el.currentTime, seeking: el.seeking, rs: el.readyState }); }\n"
    + "  el.addEventListener('seeked', onSeeked);\n"
    + "  var t0 = performance.now();\n"
    + "  withTimeout(seekMod.seekElement(el, target, { fps: 30, timeoutMs: 1200 }), 20000, 'seekElement')\n"
    + "    .then(function (r) { el.removeEventListener('seeked', onSeeked); resolve({ result: r, landings: landings, elapsedMs: Math.round(performance.now() - t0), settled: true, preSeek: preSeek, errorAfter: el.error ? el.error.code : null, currentTimeAfter: el.currentTime }); })\n"
    + "    .catch(function (e) { el.removeEventListener('seeked', onSeeked); resolve({ result: null, landings: landings, elapsedMs: Math.round(performance.now() - t0), settled: false, preSeek: preSeek, error: String(e && e.message ? e.message : e) }); });\n"
    + "}); }\n"
    + "try {\n"
    + "  var seekMod = await import('./seek.mjs');\n"
    + "  var guardMod = await import('./guard.mjs');\n"
    + "  var a2Mod = await import('./pause45A2.mjs');\n"
    + "  var audioMod = await import('./audioEngine.mjs');\n"
    + "  var v3Mod = await import('./pauseDraw40V3.mjs');\n"
    + "  var w2Mod = await import('./pauseDraw41W2.mjs');\n"
    + "  var x2Mod = await import('./pauseSeekCap42X2.mjs');\n"
    + "  R.imports = 'ok';\n"
    + "} catch (e) { R.imports = 'FAIL:' + (e && e.message ? e.message : String(e)); window.__a2Result = R; window.__a2Ready = true; throw e; }\n"
    + "try {\n"
    + "  var t = 0.1, lastDrawn = 0.1, lastRequested = 1.5;\n"
    + "  var before = {\n"
    + "    requestSeek: (t !== lastDrawn && t !== lastRequested),\n"
    + "    needsRetry: v3Mod.pauseTickNeedsRetry(t, lastDrawn, lastRequested, false),\n"
    + "    normalSleep: (t === lastDrawn && lastRequested === t),\n"
    + "    seekCapSleep: x2Mod.seekFailureMaySleep(true, false, lastRequested, t),\n"
    + "    w2CapSleep: w2Mod.pauseRetryMaySleep(true, false, lastRequested, t)\n"
    + "  };\n"
    + "  var rec = guardMod.planDrawnPlayheadRecovery({ lastDrawn: lastDrawn, lastRequested: lastRequested, pendingSeek: false, pauseRetryExhausted: false, seekFailureExhausted: true, seekFailureTarget: 1.5 }, t);\n"
    + "  var after = null;\n"
    + "  if (rec) { var lr2 = rec.lastRequested; after = { requestSeek: (t !== lastDrawn && t !== lr2), needsRetry: v3Mod.pauseTickNeedsRetry(t, lastDrawn, lr2, false), normalSleep: (t === lastDrawn && lr2 === t) }; }\n"
    + "  R.guardA = { before: before, recovery: rec, after: after };\n"
    + "} catch (e) { R.guardA = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try {\n"
    + "  var validLoad = await loadVideo('./valid-gop.mp4');\n"
    + "  var validSeek = null;\n"
    + "  if (validLoad.kind === 'loadedmetadata') validSeek = await seekWithLandings(seekMod, validLoad.el, 2.5);\n"
    + "  R.validControl = { load: validLoad.kind, loadExtra: validLoad.extra, seek: validSeek };\n"
    + "} catch (e) { R.validControl = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try {\n"
    + "  var brokenLoad = await loadVideo('./broken-gap.mp4');\n"
    + "  var brokenSeek25 = null, brokenSeek15 = null;\n"
    + "  if (brokenLoad.kind === 'loadedmetadata') {\n"
    + "    brokenSeek25 = await seekWithLandings(seekMod, brokenLoad.el, 2.5);\n"
    + "    var tracker = new a2Mod.WrongLandingTracker();\n"
    + "    var kinds25 = [];\n"
    + "    if (brokenSeek25) { for (var i = 0; i < brokenSeek25.landings.length; i++) { var lf = a2Mod.frameIndex45A2(brokenSeek25.landings[i].ct, 30); var ob = tracker.observe(lf, 75); kinds25.push({ landedFrame: lf, kind: ob.kind, consecutiveWrong: ob.consecutiveWrong, shouldFail: ob.shouldFail }); } }\n"
    + "    brokenSeek25.classified = kinds25;\n"
    + "    brokenSeek15 = await seekWithLandings(seekMod, brokenLoad.el, 1.5);\n"
    + "    var tracker15 = new a2Mod.WrongLandingTracker();\n"
    + "    var kinds15 = [];\n"
    + "    if (brokenSeek15) { for (var j = 0; j < brokenSeek15.landings.length; j++) { var lf15 = a2Mod.frameIndex45A2(brokenSeek15.landings[j].ct, 30); var ob15 = tracker15.observe(lf15, 45); kinds15.push({ landedFrame: lf15, kind: ob15.kind, consecutiveWrong: ob15.consecutiveWrong, shouldFail: ob15.shouldFail }); } }\n"
    + "    brokenSeek15.classified = kinds15;\n"
    + "    var rawLandings = [];\n"
    + "    var rawBefore = { ct: brokenLoad.el.currentTime, seeking: brokenLoad.el.seeking, rs: brokenLoad.el.readyState, err: brokenLoad.el.error ? brokenLoad.el.error.code : null };\n"
    + "    function onRawSeeked() { rawLandings.push({ ct: brokenLoad.el.currentTime, seeking: brokenLoad.el.seeking, rs: brokenLoad.el.readyState }); }\n"
    + "    brokenLoad.el.addEventListener('seeked', onRawSeeked);\n"
    + "    try { brokenLoad.el.currentTime = 2.5; } catch (e) { rawLandings.push({ assignThrew: String(e && e.message ? e.message : e) }); }\n"
    + "    await new Promise(function (res) { setTimeout(res, 5000); });\n"
    + "    brokenLoad.el.removeEventListener('seeked', onRawSeeked);\n"
    + "    var rawAfter = { ct: brokenLoad.el.currentTime, seeking: brokenLoad.el.seeking, rs: brokenLoad.el.readyState, err: brokenLoad.el.error ? brokenLoad.el.error.code : null };\n"
    + "    var seek25AfterDamage = await seekWithLandings(seekMod, brokenLoad.el, 2.5);\n"
    + "    R.brokenGapRaw = { before: rawBefore, landings: rawLandings, after: rawAfter, seek25AfterDamage: seek25AfterDamage };\n"
    + "  }\n"
    + "  R.brokenGap = { load: brokenLoad.kind, loadExtra: brokenLoad.extra, seek25: brokenSeek25, seek15: brokenSeek15 };\n"
    + "} catch (e) { R.brokenGap = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try {\n"
    + "  var engine = new audioMod.AudioEngine();\n"
    + "  var ensured = engine.ensure();\n"
    + "  var audioDetail = { ensured: ensured, isReady: engine.isReady };\n"
    + "  if (ensured) {\n"
    + "    var a1 = await loadVideo('./valid-gop.mp4');\n"
    + "    var a2 = await loadVideo('./valid-gop.mp4');\n"
    + "    engine.update([{ el: a1.el, gain: 1, duration: 3 }, { el: a2.el, gain: 1, duration: 3 }]);\n"
    + "    var rel1 = engine.releaseElement(a1.el);\n"
    + "    var rel1Again = engine.releaseElement(a1.el);\n"
    + "    var a3 = await loadVideo('./valid-gop.mp4');\n"
    + "    engine.update([{ el: a3.el, gain: 1, duration: 3 }]);\n"
    + "    var rel3 = engine.releaseElement(a3.el);\n"
    + "    engine.update([{ el: a1.el, gain: 1, duration: 3 }]);\n"
    + "    var rel1AfterReupdate = engine.releaseElement(a1.el);\n"
    + "    audioDetail.loads = [a1.kind, a2.kind, a3.kind];\n"
    + "    audioDetail.releases = { el1First: rel1, el1Second: rel1Again, el3NewElement: rel3, el1AfterReupdate: rel1AfterReupdate };\n"
    + "    audioDetail.note = 'el3 la element MOI (pool tao lai sau drop) — dung chu trinh production; el1 sau release + update lai la quan sat them, khong phai gate';\n"
    + "  }\n"
    + "  R.audioC = audioDetail;\n"
    + "} catch (e) { R.audioC = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try {\n"
    + "  var seeker = new seekMod.Seeker(10);\n"
    + "  var outcome = await seeker.request(1.5, function () { return Promise.reject(new Error('a2-synthetic-reject')); });\n"
    + "  R.errorSynthetic = { outcome: outcome, classified: x2Mod.classifySeekOutcome(outcome) };\n"
    + "  var seeker2 = new seekMod.Seeker(10);\n"
    + "  var outcome2 = await seeker2.request(1.5, function () { return Promise.resolve({ done: 0, timedOut: 0, failed: 1 }); });\n"
    + "  R.errorFailedOnly = { outcome: outcome2, classified: x2Mod.classifySeekOutcome(outcome2) };\n"
    + "} catch (e) { R.errorSynthetic = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try {\n"
    + "  var fixtures = {};\n"
    + "  var names = ['empty.mp4', 'garbage.mp4', 'mpeg4-unsupported.mp4'];\n"
    + "  for (var k = 0; k < names.length; k++) {\n"
    + "    var name = names[k];\n"
    + "    var lv = await loadVideo('./' + name);\n"
    + "    var sr = null, rejected = false;\n"
    + "    try { sr = await withTimeout(seekMod.seekElement(lv.el, 1.5, { fps: 30, timeoutMs: 1200 }), 10000, 'seekElement-' + name); }\n"
    + "    catch (e) { rejected = true; sr = { error: String(e && e.message ? e.message : e) }; }\n"
    + "    fixtures[name] = { load: lv.kind, loadExtra: lv.extra, seekResult: sr, seekRejected: rejected, currentTimeAfter: lv.el.currentTime, seekingAfter: lv.el.seeking, readyStateAfter: lv.el.readyState };\n"
    + "  }\n"
    + "  R.errorFixtures = fixtures;\n"
    + "} catch (e) { R.errorFixtures = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try {\n"
    + "  var beforeUncaught = window.__a2Uncaught.length;\n"
    + "  var seeker3 = new seekMod.Seeker(10);\n"
    + "  var settled = false;\n"
    + "  seeker3.request(1.5, function () { throw new Error('a2-sync-boom'); }).then(function () { settled = true; }, function () { settled = true; });\n"
    + "  await new Promise(function (res) { setTimeout(res, 700); });\n"
    + "  R.errorSyncThrow = { settledAfter700ms: settled, uncaughtNew: window.__a2Uncaught.slice(beforeUncaught) };\n"
    + "} catch (e) { R.errorSyncThrow = { error: String(e && e.message ? e.message : e) }; }\n"
    + "R.uncaughtAll = window.__a2Uncaught;\n"
    + "window.__a2Result = R;\n"
    + "window.__a2Ready = true;\n"
    + "</script>\n";
  writeFileEpermRetry(path.join(SCRATCH, "page.html"), page);
}

async function main() {
  if (!fs.existsSync(CHROME)) fail("không có chrome " + CHROME);
  if (!DISPLAY) fail("không còn display trống trong :90-:99 (các luồng khác đang giữ)");
  const fixtures = buildFixtures();
  log("fixture: valid=" + fixtures.valid + " broken=" + JSON.stringify(fixtures.brokenInfo));
  buildBundles();
  buildPage();
  const server = http.createServer((req, res) => {
    const file = path.join(SCRATCH, req.url === "/" ? "page.html" : decodeURIComponent(req.url.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mjs") ? "text/javascript" : file.endsWith(".mp4") ? "video/mp4" : "text/html";
    // Hỗ trợ Range thật (206 + Content-Range): lần chạy đầu server chỉ
    // trả 200 toàn file dù gắn header Accept-Ranges, khiến Chrome không
    // seek được và đối chứng valid cũng đáp 0 như broken — kết quả B
    // lần đó vô hiệu, phải chạy lại sau khi sửa server (xem LIMITS).
    const size = fs.statSync(file).size;
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? parseInt(m[2], 10) : size - 1;
        if (start < size && end >= start) {
          res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": end - start + 1 });
          fs.createReadStream(file, { start, end }).pipe(res);
          return;
        }
      }
      res.writeHead(416, { "Content-Range": "bytes */" + size });
      res.end();
      return;
    }
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
    chrome = spawn(CHROME, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check",
      "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) fail("không nhận được sessionId");
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
    let ready = false;
    for (let i = 0; i < 180 && !ready; i++) {
      await sleep(500);
      ready = await cdp.evaluate("!!window.__a2Ready", cdp.sessionId).catch(() => false);
    }
    if (!ready) fail("trang test không ready sau 90s");
    const result = await cdp.evaluate("window.__a2Result", cdp.sessionId);

    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 600)); };
    // (a) guard trong Chromium thật (mức helper + điều kiện ngủ, chưa phải vòng lặp preview đầy đủ).
    const g = result.guardA || {};
    const guardOk = g.recovery && g.recovery.resetSeekFailure === true && g.recovery.lastRequested === 0.1
      && g.before && g.before.requestSeek === false && g.before.needsRetry === false && g.before.normalSleep === false
      && g.after && g.after.normalSleep === true;
    check("A-guard-drawn-playhead-headed", guardOk ? "PASS" : "FAIL", g);
    // Đối chứng valid phải seek được, nếu không thì mọi kết quả broken đều vô nghĩa.
    const vc = result.validControl || {};
    const validOk = vc.load === "loadedmetadata" && vc.seek && vc.seek.settled === true && vc.seek.result && vc.seek.result.seeked === true;
    check("CONTROL-valid-seek-2.5", validOk ? "PASS" : "FAIL", vc);
    // (b) quirk zero: PASS chỉ khi quirk tái hiện (mọi landing đều 0) VÀ seekElement fail nhanh failed (không timedOut, không treo).
    const b = (result.brokenGap && result.brokenGap.seek25) || {};
    const quirkReproduced = Array.isArray(b.landings) && b.landings.length >= 1 && b.landings.every((l) => l.ct === 0);
    if (!result.brokenGap || result.brokenGap.load !== "loadedmetadata") {
      check("B-zero-landing-fail-fast-headed", "NOT_MEASURED", result.brokenGap);
    } else if (!quirkReproduced) {
      check("B-zero-landing-fail-fast-headed", "NOT_MEASURED", { reason: "quirk seeked@0 khong tai hien trong lan chay nay (landings khac 0 hoac khong co seeked)", seek: b });
    } else if (b.settled === true && b.result && b.result.seeked === false && b.result.timedOut === false) {
      check("B-zero-landing-fail-fast-headed", "PASS", b);
    } else {
      check("B-zero-landing-fail-fast-headed", "FAIL", b);
    }
    // (b2) quan sát đáp sai 1.5 + phân loại bằng lib mới — chỉ quan sát, không gate PASS/FAIL cho production (lib chưa nối vào seek.ts).
    check("B2-broken-seek-1.5-observed-classified", "OBSERVED", (result.brokenGap && result.brokenGap.seek15) || null);
    // (b-raw) quirk trên element đã hỏng bởi seek 1.5 trước đó (giả thuyết
    // từ Y2 §3.1: quirk 2.5→0 có thể phụ thuộc trạng thái element, không
    // tái hiện trên element mới). PASS chỉ khi raw đáp 0 VÀ seekElement
    // sau đó fail nhanh kiểu Z2; còn lại là OBSERVED, không bịa PASS.
    const raw = result.brokenGapRaw || {};
    const rawHitZero = Array.isArray(raw.landings) && raw.landings.some((l) => l.ct === 0);
    const sad = raw.seek25AfterDamage || {};
    if (rawHitZero && sad.settled === true && sad.result && sad.result.seeked === false && sad.result.timedOut === false) {
      check("B-raw-damaged-element-zero-landing", "PASS", raw);
    } else {
      check("B-raw-damaged-element-zero-landing", "OBSERVED", raw);
    }
    // (c) audio release trong Chromium thật.
    const ac = result.audioC || {};
    if (!ac.ensured) {
      check("C-audio-release-headed", "NOT_MEASURED", ac);
    } else {
      const rel = ac.releases || {};
      check("C-audio-release-headed", (rel.el1First === true && rel.el1Second === false && rel.el3NewElement === true) ? "PASS" : "FAIL", ac);
    }
    // (e1) chuỗi phân loại kind error chạy được trong browser (executor reject tổng hợp).
    const es = result.errorSynthetic || {};
    check("E1-kind-error-synthetic-reject-headed", (es.outcome && es.outcome.ok === false && es.outcome.cancelled === false && es.classified === "error") ? "PASS" : "FAIL", es);
    // (e2) fixture lỗi production: ghi nhận, không gate — Y2 đã kết luận không fixture nào đi nhánh này.
    check("E2-kind-error-production-fixtures", "OBSERVED", result.errorFixtures || null);
    // (e3) hazard sync-throw: PASS khi đúng chữ ký treo (không settle + uncaught bắt được).
    const e3 = result.errorSyncThrow || {};
    check("E3-seeker-sync-throw-hang-headed", (e3.settledAfter700ms === false && Array.isArray(e3.uncaughtNew) && e3.uncaughtNew.some((s) => s.includes("a2-sync-boom"))) ? "PASS" : "FAIL", e3);

    const out = { scratch: SCRATCH, display: DISPLAY, fixtures: { valid: fixtures.valid, broken: fixtures.broken, brokenInfo: fixtures.brokenInfo }, result, checks };
    console.log(JSON.stringify(out, null, 2));
    const failed = checks.filter((c) => c.status === "FAIL");
    const nm = checks.filter((c) => c.status === "NOT_MEASURED").length;
    log("A2 headed: " + checks.filter((c) => c.status === "PASS").length + " PASS, " + failed.length + " FAIL, " + nm + " NOT_MEASURED, " + checks.filter((c) => c.status === "OBSERVED").length + " OBSERVED");
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("BLOCKER:", e?.message || e); process.exit(2); });
