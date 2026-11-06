// pause48D3-chromevar.mjs — Phase 9 đợt 48, luồng D3: loại trừ biến
// cờ/binary Chrome cho fail-fast seek-landing-0 (nợ C3 §9 mục 1) +
// thử 2 hướng fixture mới cho quirk đáp sai frame khác 0 (nợ C3 §9
// mục 2, time-box: chỉ 2 hướng).
//
// Chạy từ gốc repo (mỗi lần chạy = 1 tổ hợp binary/cờ):
//   D3_VARIANT=v1-meta node apps/web/scripts/pause48D3-chromevar.mjs
//   D3_VARIANT=v2-nodsf node apps/web/scripts/pause48D3-chromevar.mjs
//   D3_VARIANT=v3-noautoplay node apps/web/scripts/pause48D3-chromevar.mjs
//   D3_VARIANT=v4-nogpu node apps/web/scripts/pause48D3-chromevar.mjs
// Script tự: copy fixture Y2 GỐC (md5 verify), build 2 fixture biến
// thể mới ở /tmp, bundle seek.mjs + pause45A2.mjs, bật Xvfb riêng +
// Chrome theo variant qua --remote-debugging-port (HTTP), mở TAB MỚI
// cho mỗi probe qua /json/new + CDP Page.navigate (Chrome 156 bỏ qua
// URL ở /json/new — xem C3-FIX), chạy các probe rồi in JSON.
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / NOT_MEASURED /
// OBSERVED.
//
// Variant (binary/cờ — biến còn mở sau C3 §3.4):
//   v1-meta:       /opt/meta-chromium/chrome (Muse Browser
//                  155.0.8059.91) + cờ C3 (DSF=1 + autoplay).
//                  CHẠY KHÔNG ĐƯỢC nếu thiếu WebGL policy (xem
//                  v1-meta-policy): binary Hatch từ chối khởi động
//                  ("Hatch WebGL domain policy is required for
//                  browser startup") khi không có policy.
//   v1-meta-policy: như v1-meta + policy "all origins" cho binary
//                  Hatch (file `hatch-webgl-all-origins-v1\n` + cờ
//                  --hatch-webgl-allowed-domains-file/sha256; đã
//                  xác minh bằng validator có sẵn của binary:
//                  `--hatch-validate-webgl-allowed-domains --version`
//                  in lại đúng contract + sha256. Policy chỉ mở
//                  cổng khởi động; probe không dùng WebGL).
//   v2-nodsf:      chromium-1248 + cờ C3 TRỪ --force-device-scale-factor=1.
//   v3-noautoplay: chromium-1248 + cờ C3 TRỪ --autoplay-policy=... .
//   v4-nogpu:      chromium-1248 + cờ C3 + --disable-gpu (đường
//                  decode phần mềm — trạng thái GPU của phiên Y2
//                  cũng là biến chưa loại trừ).
// Baseline so sánh: C3 trên chromium-1248 + cờ C3 (R2/R4 seeked@2.5,
// R6 1 landing @2.5). PASS fail-fast chỉ khi quirk seeked@0 tái
// hiện + seekElement fail nhanh đúng 3 landing @0.
//
// Fixture biến thể mới (quirk khác 0 — C3 thử 5 biến thể zero-packet
// đều cho error code 3 kẹt seeking, chưa có biến thể nào đáp sai):
//   var-garbage-kf20.mp4: packet keyframe pts 2.0–2.0334 điền 0xFF
//     (không phải 0x00) — decoder có thể bỏ NAL hỏng mà tiếp tục
//     thay vì hỏng pipeline như khi zero.
//   var-broken-av.mp4: broken-gap + track audio AAC im lặng
//     (ffmpeg -c:v copy) — seek audio+video đồng bộ có thể đáp khác
//     video-only.
//   var-av.mp4: đối chứng valid-gop + audio (để biết audio track
//     tự thân có đổi landing không).

import { spawn, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join("/tmp", "pause48d3-chromevar-" + process.pid);
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const CHROME_1248 = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const CHROME_META = "/opt/meta-chromium/chrome";
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");

const VARIANT = process.env.D3_VARIANT || "v1-meta";
const PORT = parseInt(process.env.D3_PORT || "9224", 10);
const VARIANTS = {
  "v1-meta": { chrome: CHROME_META, extra: [], drop: [] },
  // v1-meta-policy: binary Hatch chỉ khởi động khi có WebGL domain
  // policy hợp lệ (file + sha256). Harness tự ghi file policy
  // "hatch-webgl-all-origins-v1\n" vào scratch + tính sha256 của
  // đúng bytes đó (xem main(), khối policy) — không hardcode hash.
  // v1-meta-policy-noproxy: như v1-meta-policy + --no-proxy-server.
  // Lý do thêm (đo ở lượt v1-meta-policy): binary Hatch KHỞI ĐỘNG
  // được với policy (DevTools lên, Chrome/155.0.8059.91) nhưng mọi
  // probe timeout 40 s vì trang không load (`window.__c3` mãi
  // undefined, tab vẫn ở URL đích nhưng title chỉ còn host) trong
  // khi server trả 200 qua curl. Nghi ngờ: máy có proxy env
  // (http_proxy/https_proxy → hatch-egress-proxy:3128, NO_PROXY có
  // 127.0.0.1) mà binary Hatch không tôn trọng NO_PROXY như
  // chromium-1248, nên request loopback bị đẩy qua egress proxy và
  // chết. --no-proxy-server ép nối trực tiếp để kiểm chứng giả
  // thuyết này.
  "v1-meta-policy-noproxy": { chrome: CHROME_META, extra: ["--no-proxy-server"], drop: [], policy: true },
  "v2-nodsf": { chrome: CHROME_1248, extra: [], drop: ["--force-device-scale-factor=1"] },
  "v3-noautoplay": { chrome: CHROME_1248, extra: [], drop: ["--autoplay-policy=no-user-gesture-required"] },
  "v4-nogpu": { chrome: CHROME_1248, extra: ["--disable-gpu"], drop: [] },
};
if (!VARIANTS[VARIANT]) { console.error("usage: D3_VARIANT=<v1-meta|v1-meta-policy|v1-meta-policy-noproxy|v2-nodsf|v3-noautoplay|v4-nogpu> node apps/web/scripts/pause48D3-chromevar.mjs"); process.exit(2); }
const VCFG = VARIANTS[VARIANT];
const CHROME = VCFG.chrome;

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.D3_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

// ---------- fixture ----------
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
    if (got !== want) fail("md5 " + name + " lệch: " + got + " != " + want);
    out[name] = { file: dst, md5: got, size: fs.statSync(dst).size };
  }
  // Điền byte 0xFF (không phải 0x00) vào packet theo khoảng pts.
  const py = path.join(SCRATCH, "make-garbage.py");
  fs.writeFileSync(py, [
    "import json, subprocess, sys",
    "src, dst, lo, hi, fill = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5], 0)",
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
    "        data[pos:pos+size] = bytes([fill]) * size",
    "        n += 1; total += size",
    "        first = pos if first is None else first; last = pos; lastSize = size",
    "open(dst, 'wb').write(bytes(data))",
    "print(json.dumps({'packetsFilled': n, 'bytesFilled': total, 'fill': fill, 'firstPos': first, 'lastPos': last, 'lastEnd': last + lastSize if last is not None else None, 'size': len(data)}))",
    "",
  ].join("\n"));
  const g = JSON.parse(execFileSync("python3", [py, path.join(SCRATCH, "valid-gop.mp4"), path.join(SCRATCH, "var-garbage-kf20.mp4"), "2.0", "2.0334", "0xFF"], { encoding: "utf8" }));
  out["var-garbage-kf20.mp4"] = { file: path.join(SCRATCH, "var-garbage-kf20.mp4"), ...g };
  // Thêm track audio AAC im lặng (copy video nguyên).
  for (const [srcName, dstName] of [["broken-gap.mp4", "var-broken-av.mp4"], ["valid-gop.mp4", "var-av.mp4"]]) {
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", path.join(SCRATCH, srcName),
      "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "96k", "-shortest", path.join(SCRATCH, dstName)], { stdio: "ignore" });
    const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name",
      "-show_entries", "format=duration", "-of", "json", path.join(SCRATCH, dstName)], { encoding: "utf8" }));
    out[dstName] = { file: path.join(SCRATCH, dstName), size: fs.statSync(path.join(SCRATCH, dstName)).size, streams: probe.streams, duration: probe.format.duration };
  }
  return out;
}

function buildBundles() {
  const jobs = [
    ["seek.ts", "seek.mjs"],
    ["pause45A2.ts", "pause45A2.mjs"],
  ];
  for (const [src, out] of jobs) {
    execFileSync(ESBUILD, [path.join(WEB_DIR, "src", "lib", src), "--bundle", "--platform=browser", "--format=esm",
      "--outfile=" + path.join(SCRATCH, out)], { stdio: "ignore" });
  }
}

function buildPages() {
  const raw = "<!doctype html><meta charset=\"utf-8\"><title>D3 raw probe</title><body>\n"
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
  fs.writeFileSync(path.join(SCRATCH, "raw.html"), raw);
  const seekel = "<!doctype html><meta charset=\"utf-8\"><title>D3 seekElement probe</title>\n"
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
  fs.writeFileSync(path.join(SCRATCH, "seekel.html"), seekel);
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
    // Tab mới mở ở nền — đưa lên trước thì timer mới chạy (C3-FIX2).
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
  log("fixture Y2 md5 ok: valid-gop " + fixtures["valid-gop.mp4"].md5 + " broken-gap " + fixtures["broken-gap.mp4"].md5);
  log("variant garbage: " + JSON.stringify(fixtures["var-garbage-kf20.mp4"]));
  log("variant broken-av: " + JSON.stringify(fixtures["var-broken-av.mp4"]));
  log("variant av (control): " + JSON.stringify(fixtures["var-av.mp4"]));
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
    // Y2-exact: trả toàn file, code 200, bỏ qua header Range.
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://127.0.0.1:" + server.address().port;
  log("scratch server tại " + ORIGIN + " display " + DISPLAY + " variant " + VARIANT + " chrome " + CHROME + " port " + PORT);

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
    const baseFlags = ["--no-sandbox", "--remote-debugging-port=" + PORT, "--remote-debugging-address=127.0.0.1",
      "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
      "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"];
    const flags = baseFlags.filter((f) => !VCFG.drop.some((d) => f === d || f.startsWith(d.split("=")[0] + "="))).concat(VCFG.extra);
    if (VCFG.policy) {
      // Binary Hatch đòi policy WebGL thì mới khởi động. File policy
      // "all origins": nội dung đúng `hatch-webgl-all-origins-v1\n`
      // (đã xác minh bằng validator của chính binary: thiếu \n cuối
      // → "invalid WebGL domain policy contract"; file list domain
      // chứa 127.0.0.1 → "non-registrable domain"). Sha256 tính từ
      // đúng bytes đã ghi, không hardcode.
      const policyFile = path.join(SCRATCH, "webgl-policy.txt");
      fs.writeFileSync(policyFile, "hatch-webgl-all-origins-v1\n");
      const policySha = crypto.createHash("sha256").update(fs.readFileSync(policyFile)).digest("hex");
      flags.push("--hatch-webgl-allowed-domains-file=" + policyFile);
      flags.push("--hatch-webgl-allowed-domains-sha256=" + policySha);
      log("webgl policy: file " + policyFile + " sha256 " + policySha);
    }
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
    // Thứ tự Y2: gap-15 trước gap-25 trong cùng process.
    await run("R1-raw-broken-1.5", "raw.html", "?f=broken-gap.mp4&t=1.5");
    await run("R2-raw-broken-2.5", "raw.html", "?f=broken-gap.mp4&t=2.5");
    await run("R3-raw-valid-2.5", "raw.html", "?f=valid-gop.mp4&t=2.5");
    await run("R4-raw-broken-2.5-repeat", "raw.html", "?f=broken-gap.mp4&t=2.5");
    await run("R6-seekel-broken-2.5", "seekel.html", "?f=broken-gap.mp4&t=2.5");
    await run("R7-seekel-valid-2.5", "seekel.html", "?f=valid-gop.mp4&t=2.5");
    // 2 hướng fixture mới cho quirk khác 0 (mức raw trước).
    await run("RA-raw-garbage-kf20-2.5", "raw.html", "?f=var-garbage-kf20.mp4&t=2.5");
    await run("RB-raw-broken-av-2.5", "raw.html", "?f=var-broken-av.mp4&t=2.5");
    await run("RC-raw-av-control-2.5", "raw.html", "?f=var-av.mp4&t=2.5");
    // seekElement trên biến thể đáp sai khác 0 ĐẦU TIÊN (nếu có).
    const wrongNonZero = ["RA-raw-garbage-kf20-2.5", "RB-raw-broken-av-2.5"]
      .find((k) => {
        const r = results[k];
        return r && typeof r.atSeeked === "number" && r.atSeeked > 0 && Math.abs(r.atSeeked - (r.targetParam ?? 0)) > 0.01;
      });
    if (wrongNonZero) {
      const r = results[wrongNonZero];
      await run("R15-seekel-" + wrongNonZero.slice(3), "seekel.html", "?f=" + r.file + "&t=" + r.targetParam);
      results["R15-source"] = wrongNonZero;
    } else {
      results["R15-source"] = null;
      log("R15 bỏ qua: không biến thể nào đáp sai khác 0 ở mức raw");
    }

    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 700)); };
    const near = (ct, t) => typeof ct === "number" && Math.abs(ct - t) < 0.01;
    const validOk = ["R3-raw-valid-2.5"].every((k) => {
      const r = results[k] || {};
      return Array.isArray(r.events) && r.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 2.5));
    });
    check("CONTROL-valid-raw-2.5", validOk ? "PASS" : "FAIL", { R3: results["R3-raw-valid-2.5"] });
    check("R1-raw-broken-1.5-observed", "OBSERVED", results["R1-raw-broken-1.5"]);
    check("R2-R4-raw-broken-2.5-observed", "OBSERVED", { R2: results["R2-raw-broken-2.5"], R4: results["R4-raw-broken-2.5-repeat"] });
    const r6 = results["R6-seekel-broken-2.5"] || {};
    const quirkReproduced = [results["R2-raw-broken-2.5"], results["R4-raw-broken-2.5-repeat"]].every((r) =>
      r && Array.isArray(r.events) && r.events.some((e) => e.startsWith("seeked@")) && r.events.filter((e) => e.startsWith("seeked@")).every((e) => near(parseFloat(e.slice(7)), 0)));
    if (!validOk) {
      check("D3-zero-landing-fail-fast-headed", "NOT_MEASURED", { reason: "doi chung valid hong nen ket qua broken vo nghia", R6: r6 });
    } else if (!quirkReproduced) {
      check("D3-zero-landing-fail-fast-headed", "NOT_MEASURED", { reason: "quirk seeked@0 khong tai hien voi variant " + VARIANT + " (xem R2/R4)", R6: r6, R2: results["R2-raw-broken-2.5"], R4: results["R4-raw-broken-2.5-repeat"] });
    } else if (r6.settled === true && r6.result && r6.result.seeked === false && r6.result.timedOut === false
      && Array.isArray(r6.landings) && r6.landings.length === 3 && r6.landings.every((l) => l.ct === 0)) {
      check("D3-zero-landing-fail-fast-headed", "PASS", r6);
    } else {
      check("D3-zero-landing-fail-fast-headed", "FAIL", r6);
    }
    const variantSummary = {};
    for (const k of ["RA-raw-garbage-kf20-2.5", "RB-raw-broken-av-2.5", "RC-raw-av-control-2.5"]) {
      const r = results[k] || {};
      variantSummary[k] = { file: r.file, target: r.targetParam, events: r.events, atSeeked: r.atSeeked, after: r.after, error: r.error };
    }
    check("D3-wrong-nonzero-raw-variants-observed", "OBSERVED", variantSummary);
    const r15 = results["R15-seekel-" + (results["R15-source"] ? results["R15-source"].slice(3) : "none")] || null;
    if (!results["R15-source"]) {
      check("D3-wrong-nonzero-fail-fast-headed", "NOT_MEASURED", { reason: "khong bien the nao dap sai khac 0 o muc raw (xem variantSummary)", variantSummary });
    } else if (r15 && r15.settled === true && r15.result && r15.result.seeked === false && r15.result.timedOut === false
      && Array.isArray(r15.landings) && r15.landings.length === 3
      && r15.landings.every((l) => l.ct > 0 && Math.abs(l.ct - (r15.targetParam ?? 0)) > 0.01)) {
      check("D3-wrong-nonzero-fail-fast-headed", "PASS", r15);
    } else {
      check("D3-wrong-nonzero-fail-fast-headed", "FAIL", r15);
    }
    const r7 = results["R7-seekel-valid-2.5"] || {};
    const r7Ok = r7.settled === true && r7.result && r7.result.seeked === true
      && Array.isArray(r7.landings) && r7.landings.length >= 1 && r7.landings.every((l) => near(l.ct, 2.5));
    check("CONTROL-valid-seekElement-2.5", r7Ok ? "PASS" : "FAIL", r7);

    console.log(JSON.stringify({ variant: VARIANT, chrome: version, fixtures, checks, results }, null, 2));
    const failed = checks.filter((c) => c.status === "FAIL").length;
    log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
