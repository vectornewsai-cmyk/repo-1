// pause46B2-headed.mjs — Phase 9 đợt 46, luồng B2: nối lib A2 vào
// seek.ts thật + quyết định Seeker sync-throw + tái tạo fixture Y2 đúng.
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause46B2-headed.mjs
// Script tự: tạo fixture ở /tmp (KHÔNG vào repo, KHÔNG binary vào
// batch), bundle source HIỆN TẠI ra scratch /tmp (seek.ts lúc này đã
// chứa wiring ROUND46-B2 nên seekElement trong browser là code mới),
// bật Xvfb riêng + Chromium Playwright (chromium-1248) qua CDP pipe,
// chạy các kiểm tra rồi in JSON kết quả. Exit 1 khi có kiểm tra FAIL;
// exit 0 khi mọi kiểm tra PASS / NOT_MEASURED / OBSERVED (không đo
// được thì ghi rõ lý do, không bịa PASS — tiền lệ đợt 45 A2 §2.1).
//
// §0. Khác biệt cốt lõi so với harness A2 (vì sao A2 không tái hiện
// được quirk): A2 dùng fixture CÓ track audio sine (layout packet
// lệch: 108.574–218.536 thay vì 101.878–206.286 của Y2) và seek ngay
// sau loadedmetadata. Harness này tái tạo ĐÚNG Y2:
//   - valid video-only: testsrc2 640x360, 3 s, 30 fps, GOP 30, libx264,
//     yuv420p, KHÔNG track audio (ffprobe Y2: chỉ 1 stream video).
//   - broken-gap: copy valid, zero đúng packet video có pts trong
//     [1,0, 2,0) bằng ffprobe JSON có tên trường (không dùng CSV).
//   - probe v3 (Y2 §3.1 / probe2.html): element MỚI cho mỗi target,
//     gán src, CHỜ 3 s rồi mới gán currentTime, quan sát 6 s — không
//     seek ngay sau loadedmetadata như A2.
// Nếu quirk vẫn không tái hiện thì kết luận vẫn là NOT_MEASURED kèm
// số liệu lệch (fixture lệch chỗ nào), và HỦY mọi PASS giả như A2.

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join("/tmp", "pause46b2-headed-" + process.pid);
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.B2_DISPLAY || pickFreeDisplay();
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
  // Y2-exact: video-only, KHÔNG sine audio (A2 có audio → lệch layout),
  // VÀ -movflags +faststart: file Y2 còn lưu có layout ftyp+moov(1828)+
  // mdat (packet đầu ở 1876), trong khi encode mặc định cho ftyp+mdat+
  // moov (packet đầu ở 48) — cùng 90 packet, cùng size từng packet,
  // cùng tổng 313311 byte, chỉ lệch đúng 1828 byte vị trí. Lần chạy 1
  // của B2 (không faststart) không tái hiện quirk nên đây là ứng viên
  // lệch còn lại phải loại trừ trước khi kết luận NOT_MEASURED.
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=3",
    "-c:v", "libx264", "-g", "30", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", valid], { stdio: "ignore" });
  const py = path.join(SCRATCH, "make-broken-gap.py");
  writeFileEpermRetry(py, [
    "import json, subprocess, sys",
    "src, dst = sys.argv[1], sys.argv[2]",
    "out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',",
    "  '-show_entries', 'packet=pts_time,pos,size', '-of', 'json', src],",
    "  capture_output=True, text=True, check=True).stdout",
    "packets = json.loads(out)['packets']",
    "data = bytearray(open(src, 'rb').read())",
    "n = 0; total = 0; first = None; last = None; lastSize = 0",
    "for p in packets:",
    "    try: t = float(p['pts_time'])",
    "    except (KeyError, TypeError, ValueError): continue",
    "    if 1.0 <= t < 2.0:",
    "        pos = int(p['pos']); size = int(p['size'])",
    "        data[pos:pos+size] = b'\\x00' * size",
    "        n += 1; total += size",
    "        first = pos if first is None else first; last = pos; lastSize = size",
    "open(dst, 'wb').write(bytes(data))",
    "print(json.dumps({'packetsZeroed': n, 'bytesZeroed': total, 'firstPos': first, 'lastPos': last, 'lastEnd': last + lastSize if last is not None else None, 'size': len(data)}))",
    "",
  ].join("\n"));
  const brokenInfo = JSON.parse(execFileSync("python3", [py, valid, broken], { encoding: "utf8" }));
  const streams = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height", "-show_entries", "format=duration,size", "-of", "json", valid], { encoding: "utf8" }));
  return { valid, broken, brokenInfo, streams };
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
  // ghi vào window.__b2Result; một bước lỗi không giết các bước sau.
  const page = "<!doctype html><meta charset=\"utf-8\"><title>Pause 46B2 headed</title>\n"
    + "<script type=\"module\">\n"
    + "window.__b2Uncaught = [];\n"
    + "window.addEventListener('error', function (e) { window.__b2Uncaught.push('error:' + e.message); });\n"
    + "window.addEventListener('unhandledrejection', function (e) { window.__b2Uncaught.push('unhandledrejection:' + String(e.reason && e.reason.message ? e.reason.message : e.reason)); });\n"
    + "var R = {};\n"
    + "function withTimeout(p, ms, label) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error(label + ' khong settle sau ' + ms + ' ms')); }, ms); })]); }\n"
    + "function rangeList(tr) { var out = []; for (var i = 0; i < tr.length; i++) out.push([Math.round(tr.start(i) * 1000) / 1000, Math.round(tr.end(i) * 1000) / 1000]); return out; }\n"
    + "function newVideo() { var v = document.createElement('video'); v.preload = 'auto'; v.muted = true; v.style.cssText = 'position:absolute;left:0;top:0;width:320px;height:180px;'; document.body.appendChild(v); return v; }\n"
    + "function loadVideo(url) { return new Promise(function (resolve) {\n"
    + "  var v = newVideo(); var done = false;\n"
    + "  function fin(kind, extra) { if (done) return; done = true; resolve({ el: v, kind: kind, extra: extra || null }); }\n"
    + "  v.addEventListener('loadedmetadata', function () { fin('loadedmetadata', { duration: v.duration, readyState: v.readyState }); });\n"
    + "  v.addEventListener('error', function () { var e = v.error; fin('error', { code: e ? e.code : null, message: e ? e.message : null }); });\n"
    + "  setTimeout(function () { fin('timeout', { readyState: v.readyState }); }, 10000);\n"
    + "  v.src = url;\n"
    + "}); }\n"
    // Probe v3 Y2: element MỚI, gán src, CHỜ 3000 ms rồi mới gán
    // currentTime một lần, quan sát 6000 ms (không retry seekElement).
    + "function rawProbe(url, target) { return new Promise(function (resolve) {\n"
    + "  var v = newVideo(); var events = [];\n"
    + "  v.addEventListener('seeking', function () { events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
    + "  v.addEventListener('seeked', function () { events.push('seeked@' + v.currentTime.toFixed(3)); });\n"
    + "  v.addEventListener('error', function () { var e = v.error; events.push('error:' + (e ? e.code : null)); });\n"
    + "  v.src = url;\n"
    + "  setTimeout(function () {\n"
    + "    var before = { ct: v.currentTime, seeking: v.seeking, rs: v.readyState, buffered: rangeList(v.buffered), seekable: rangeList(v.seekable), err: v.error ? v.error.code : null };\n"
    + "    var setThrew = null;\n"
    + "    try { v.currentTime = target; } catch (e) { setThrew = String(e && e.message ? e.message : e); }\n"
    + "    setTimeout(function () {\n"
    + "      resolve({ events: events, before: before, setThrew: setThrew, after: { ct: v.currentTime, seeking: v.seeking, rs: v.readyState, err: v.error ? v.error.code : null } });\n"
    + "    }, 6000);\n"
    + "  }, 3000);\n"
    + "}); }\n"
    // seekElement trên element đã load metadata + chờ thêm 3000 ms
    // (cùng điều kiện buffer như probe v3, chỉ khác dùng code mới).
    + "function seekWithLandings(seekMod, url, target) { return new Promise(function (resolve) {\n"
    + "  loadVideo(url).then(function (lv) {\n"
    + "    if (lv.kind !== 'loadedmetadata') { resolve({ load: lv.kind, loadExtra: lv.extra, settled: false }); return; }\n"
    + "    var el = lv.el; var landings = [];\n"
    + "    function onSeeked() { landings.push({ ct: el.currentTime, seeking: el.seeking, rs: el.readyState }); }\n"
    + "    el.addEventListener('seeked', onSeeked);\n"
    + "    setTimeout(function () {\n"
    + "      var preSeek = { buffered: rangeList(el.buffered), seekable: rangeList(el.seekable), readyState: el.readyState, currentTime: el.currentTime };\n"
    + "      var t0 = performance.now();\n"
    + "      withTimeout(seekMod.seekElement(el, target, { fps: 30, timeoutMs: 1200 }), 20000, 'seekElement')\n"
    + "        .then(function (r) { el.removeEventListener('seeked', onSeeked); resolve({ load: lv.kind, result: r, landings: landings, elapsedMs: Math.round(performance.now() - t0), settled: true, preSeek: preSeek, errorAfter: el.error ? el.error.code : null, currentTimeAfter: el.currentTime }); })\n"
    + "        .catch(function (e) { el.removeEventListener('seeked', onSeeked); resolve({ load: lv.kind, result: null, landings: landings, elapsedMs: Math.round(performance.now() - t0), settled: false, preSeek: preSeek, error: String(e && e.message ? e.message : e) }); });\n"
    + "    }, 3000);\n"
    + "  });\n"
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
    + "} catch (e) { R.imports = 'FAIL:' + (e && e.message ? e.message : String(e)); window.__b2Result = R; window.__b2Ready = true; throw e; }\n"
    // A. Guard helper (tái xác nhận mức helper như A2).
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
    // Đối chứng valid: raw probe v3 + seekElement (cả hai phải đúng 2,5).
    + "try { R.validRaw25 = await rawProbe('./valid-gop.mp4', 2.5); } catch (e) { R.validRaw25 = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try { R.validSeek25 = await seekWithLandings(seekMod, './valid-gop.mp4', 2.5); } catch (e) { R.validSeek25 = { error: String(e && e.message ? e.message : e) }; }\n"
    // Broken-gap: raw probe v3 cho 2,5 và 1,5 (mỗi cái element mới),
    // rồi seekElement code mới cho 2,5 và 1,5 (mỗi cái element mới).
    + "try { R.brokenRaw25 = await rawProbe('./broken-gap.mp4', 2.5); } catch (e) { R.brokenRaw25 = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try { R.brokenRaw15 = await rawProbe('./broken-gap.mp4', 1.5); } catch (e) { R.brokenRaw15 = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try {\n"
    + "  R.brokenSeek25 = await seekWithLandings(seekMod, './broken-gap.mp4', 2.5);\n"
    + "  var tr25 = new a2Mod.WrongLandingTracker(); var kinds25 = [];\n"
    + "  if (R.brokenSeek25.landings) { for (var i = 0; i < R.brokenSeek25.landings.length; i++) { var lf = a2Mod.frameIndex45A2(R.brokenSeek25.landings[i].ct, 30); var ob = tr25.observe(lf, 75); kinds25.push({ landedFrame: lf, kind: ob.kind, consecutiveWrong: ob.consecutiveWrong, shouldFail: ob.shouldFail }); } }\n"
    + "  R.brokenSeek25.classified = kinds25;\n"
    + "} catch (e) { R.brokenSeek25 = { error: String(e && e.message ? e.message : e) }; }\n"
    + "try { R.brokenSeek15 = await seekWithLandings(seekMod, './broken-gap.mp4', 1.5); } catch (e) { R.brokenSeek15 = { error: String(e && e.message ? e.message : e) }; }\n"
    // C. Audio release (tái xác nhận như A2).
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
    + "    audioDetail.loads = [a1.kind, a2.kind, a3.kind];\n"
    + "    audioDetail.releases = { el1First: rel1, el1Second: rel1Again, el3NewElement: rel3 };\n"
    + "  }\n"
    + "  R.audioC = audioDetail;\n"
    + "} catch (e) { R.audioC = { error: String(e && e.message ? e.message : e) }; }\n"
    // E. Seeker sync-throw với CODE MỚI: phải settle thành error,
    // không treo, không uncaught mới (A2 đo treo trên code cũ).
    + "try {\n"
    + "  var beforeUncaught = window.__b2Uncaught.length;\n"
    + "  var seeker = new seekMod.Seeker(10);\n"
    + "  var syncOutcome = await withTimeout(seeker.request(1.5, function () { throw new Error('b2-sync-boom'); }), 5000, 'seeker-sync');\n"
    + "  R.seekerSyncThrow = { settled: true, outcome: syncOutcome, classified: x2Mod.classifySeekOutcome(syncOutcome), uncaughtNew: window.__b2Uncaught.slice(beforeUncaught) };\n"
    + "} catch (e) { R.seekerSyncThrow = { settled: false, error: String(e && e.message ? e.message : e), uncaughtNew: window.__b2Uncaught }; }\n"
    + "try {\n"
    + "  var seeker2 = new seekMod.Seeker(10);\n"
    + "  var rejOutcome = await seeker2.request(1.5, function () { return Promise.reject(new Error('b2-async-boom')); });\n"
    + "  R.seekerAsyncReject = { outcome: rejOutcome, classified: x2Mod.classifySeekOutcome(rejOutcome) };\n"
    + "} catch (e) { R.seekerAsyncReject = { error: String(e && e.message ? e.message : e) }; }\n"
    + "R.uncaughtAll = window.__b2Uncaught;\n"
    + "window.__b2Result = R;\n"
    + "window.__b2Ready = true;\n"
    + "</script>\n";
  writeFileEpermRetry(path.join(SCRATCH, "page.html"), page);
}

async function main() {
  if (!fs.existsSync(CHROME)) fail("không có chrome " + CHROME);
  if (!DISPLAY) fail("không còn display trống trong :90-:99 (các luồng khác đang giữ)");
  const fixtures = buildFixtures();
  log("fixture valid streams=" + JSON.stringify(fixtures.streams.streams) + " broken=" + JSON.stringify(fixtures.brokenInfo));
  buildBundles();
  buildPage();
  const server = http.createServer((req, res) => {
    const file = path.join(SCRATCH, req.url === "/" ? "page.html" : decodeURIComponent(req.url.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mjs") ? "text/javascript" : file.endsWith(".mp4") ? "video/mp4" : "text/html";
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
      res.writeHead(416, { "Content-Range": "bytes */" + size }); res.end(); return;
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
    for (let i = 0; i < 360 && !ready; i++) {
      await sleep(500);
      ready = await cdp.evaluate("!!window.__b2Ready", cdp.sessionId).catch(() => false);
    }
    if (!ready) fail("trang test không ready sau 180s");
    const result = await cdp.evaluate("window.__b2Result", cdp.sessionId);

    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 700)); };
    const near = (ct, t) => typeof ct === "number" && Math.abs(ct - t) < 0.01;
    // (a) guard helper.
    const g = result.guardA || {};
    const guardOk = g.recovery && g.recovery.resetSeekFailure === true && g.recovery.lastRequested === 0.1
      && g.before && g.before.requestSeek === false && g.before.needsRetry === false && g.before.normalSleep === false
      && g.after && g.after.normalSleep === true;
    check("A-guard-drawn-playhead-headed", guardOk ? "PASS" : "FAIL", g);
    // Đối chứng valid: raw probe v3 VÀ seekElement đều phải đáp 2,5.
    // Nếu đối chứng hỏng thì mọi kết quả broken đều vô nghĩa (bài học A2 §2.1).
    const vr = result.validRaw25 || {};
    const validRawOk = Array.isArray(vr.events) && vr.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 2.5));
    check("CONTROL-valid-raw-2.5", validRawOk ? "PASS" : "FAIL", vr);
    const vs = result.validSeek25 || {};
    const validSeekOk = vs.settled === true && vs.result && vs.result.seeked === true
      && Array.isArray(vs.landings) && vs.landings.length >= 1 && vs.landings.every((l) => near(l.ct, 2.5));
    check("CONTROL-valid-seekElement-2.5", validSeekOk ? "PASS" : "FAIL", vs);
    const controlOk = validRawOk && validSeekOk;
    // (b) quirk zero-landing với code mới: PASS chỉ khi quirk tái hiện
    // (mọi seeked đều 0) VÀ seekElement fail nhanh failed (không timedOut).
    check("B-raw-broken-2.5-observed", "OBSERVED", result.brokenRaw25 || null);
    check("B-raw-broken-1.5-observed", "OBSERVED", result.brokenRaw15 || null);
    const b = result.brokenSeek25 || {};
    const quirkReproduced = Array.isArray(b.landings) && b.landings.length >= 1 && b.landings.every((l) => l.ct === 0);
    if (!controlOk) {
      check("B-zero-landing-fail-fast-headed", "NOT_MEASURED", { reason: "doi chung valid hong nen ket qua broken vo nghia (bai hoc A2)", validRaw: vr, validSeek: vs });
    } else if (!quirkReproduced) {
      check("B-zero-landing-fail-fast-headed", "NOT_MEASURED", { reason: "quirk seeked@0 khong tai hien trong lan chay nay", seek: b, raw: result.brokenRaw25 || null });
    } else if (b.settled === true && b.result && b.result.seeked === false && b.result.timedOut === false) {
      check("B-zero-landing-fail-fast-headed", "PASS", b);
    } else {
      check("B-zero-landing-fail-fast-headed", "FAIL", b);
    }
    check("B-broken-seek-1.5-observed", "OBSERVED", result.brokenSeek15 || null);
    // (c) audio release.
    const ac = result.audioC || {};
    if (!ac.ensured) {
      check("C-audio-release-headed", "NOT_MEASURED", ac);
    } else {
      const rel = ac.releases || {};
      check("C-audio-release-headed", (rel.el1First === true && rel.el1Second === false && rel.el3NewElement === true) ? "PASS" : "FAIL", ac);
    }
    // (e) Seeker sync-throw với code mới: phải settle thành error,
    // không treo, không uncaught mới. Đây là bằng chứng headed cho
    // quyết định B2 §5 (A2 đo treo trên code cũ).
    const st = result.seekerSyncThrow || {};
    const syncOk = st.settled === true && st.outcome && st.outcome.ok === false && st.outcome.cancelled === false
      && st.classified === "error" && Array.isArray(st.uncaughtNew) && st.uncaughtNew.length === 0;
    check("E-seeker-sync-throw-settles-error-headed", syncOk ? "PASS" : "FAIL", st);
    const ar = result.seekerAsyncReject || {};
    check("E-seeker-async-reject-control", (ar.outcome && ar.outcome.ok === false && ar.outcome.cancelled === false && ar.classified === "error") ? "PASS" : "FAIL", ar);

    console.log(JSON.stringify({ fixture: { validStreams: fixtures.streams, brokenInfo: fixtures.brokenInfo }, checks, result }, null, 2));
    const failed = checks.filter((c) => c.status === "FAIL").length;
    log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
