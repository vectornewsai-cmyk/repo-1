// pause51H3-quirk.mjs — Phase 9 đợt 51, luồng H3: fail-fast
// seek-landing-0 headed + quirk frame khác 0 (nối E4 §7.1–7.2,
// F2 §6.4, F6 §5.1).
//
// BỐI CẢNH (đọc trước khi chạy lại):
// - Quan sát gốc duy nhất: Y2 probe v3 (probe2-gap-25d) — file
//   broken-gap.mp4 (GOP 1 zero, GOP 0/2 nguyên) seek 2.5 →
//   `seeking@0.000`, `seeked@0.000`, currentTime 0. Cùng phiên,
//   valid-gop 2.5 → 2.5 (25c). Đây là bằng chứng duy nhất cho
//   "seek-landing-0".
// - NHƯNG: C3/D3/E4/F6 đều KHÔNG tái hiện được trên cùng file
//   (byte-identical — H3 đã verify md5 f0e11b60… khớp F6 V1):
//   broken-gap seek 2.5 → `seeked@2.500` trên chromium-1248
//   156.0.8078.4 + cờ C3, server F6 (có Content-Length) lẫn
//   server Y2-exact không Range (D3 §4). 3 cờ DSF/autoplay/GPU
//   đã loại trừ (D3 §4.1). Binary meta-chromium 155 không load
//   được trang probe loopback khi chạy tay (D3 §4.2, đã chẩn
//   đoán tới cùng — KHÔNG lặp lại, KHÔNG sửa policy hệ thống).
// - Binary/cờ phiên Chrome Y2 gốc KHÔNG còn bản ghi; Chrome đó
//   chạy cổng 9223, load được loopback, và README meta-chromium
//   ghi "Normal startup requires the image-owned WebGL policy
//   supplied by browser-daemon" — nhiều khả năng đó là Muse
//   Browser 155 do browser-daemon chạy, KHÔNG phải chromium-1248.
//   Harness 3 (pause51H3-meta155-dataurl.mjs) thử binary 155 qua
//   data: URL để tránh chặn loopback; harness này chỉ chạy
//   chromium-1248.
//
// HƯỚNG MỚI ĐỢT NÀY (chưa thử ở C3/D3/E4/F6):
//   H1  tái hiện Y2 25d: broken-gap seek 2.5, N=6 tab mới cùng
//       instance + 2 lượt instance mới (profile mới, tab đầu
//       tiên) — đo tỉ lệ landing-0, nếu có.
//   W1  zero CHỈ keyframe 2.0 (giữ P/B GOP 2) — F6 V5 zero cả
//       GOP 2; E4 zero keyframe 1.0 nhưng chưa thử keyframe 2.0.
//   W2  zero TOÀN BỘ GOP 0 (pts 0–1.0, gồm keyframe 0.0) —
//       chưa đợt nào zero GOP đầu; seek 0.5 / 2.5 / 0.0.
//   W3  seek NGAY SAU LOAD: (a) tại loadedmetadata, (b) ngay
//       sau khi gán src (trước metadata) — F6/E4 luôn seek ở
//       3 s sau load.
//   W4  seek KHI ĐANG PLAY (play() rồi seek sau 500 ms) — các
//       đợt trước chỉ seek khi paused.
//   W5  seek VƯỢT duration (3.5, 10) — chưa thử.
//   W6  seek HAI BƯỚC cùng element: 1.5 (GOP hỏng → error 3,
//       seeking kẹt) rồi 2.5 trên CÙNG element — F6 chỉ dùng
//       tab/element mới mỗi probe; đây là đường app thật (Y2
//       §3.4 nghi seekElement lặp gán sau seeked@0).
//   W7  zero 1 packet P-frame ở pts 2.5 (đích, GOP 2) — F6 V3
//       làm ở pts 1.5 (GOP 1).
//   W10 seek khi video KHÔNG append vào DOM.
//   W11 zero B-frame CUỐI GOP 1 (pts 1.9667), seek 1.9.
//   W12 zero P-frame GIỮA GOP 1 (pts 1.3–1.7, giữ keyframe 1.0
//       + đuôi GOP), seek 1.5 — "GOP hỏng giữa file".
//   W13 zero toàn bộ box moov (giữ kích thước/offsets) —
//       "moov thiếu" (dạng hỏng khác cho pixel harness).
// Đối chứng: valid-gop seek 1.5/2.5 raw + seekElement.
//
// Nếu biến thể nào đáp sai ở mức raw (seeked@ct, ct != target,
// kể cả ct == 0), chạy tiếp seekElement trên biến thể đó để đo
// fail-fast (kỳ vọng Z2: {seeked:false, timedOut:false} sau
// đúng 3 landing sai). Không biến thể nào đáp sai = NOT_MEASURED
// (không phải FAIL của harness).
//
// Chạy từ gốc repo:
//   node apps/web/scripts/pause51H3-quirk.mjs
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / NOT_MEASURED /
// OBSERVED. Scratch + log JSON in ra cuối lượt (giữ lại để
// pixels harness dùng lại fixture).

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.join(os.homedir(), "workspace", "repo-1");
const WEB_DIR = path.join(REPO, "apps", "web");
const SCRATCH = path.join("/tmp", "pause51h3-quirk-" + process.pid);
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");
const PORT = parseInt(process.env.H3Q_PORT || "9228", 10);

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.H3Q_DISPLAY || pickFreeDisplay();
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
function zeroRange(py, src, dst, lo, hi) {
  return JSON.parse(execFileSync("python3", [py, src, dst, String(lo), String(hi)], { encoding: "utf8" }));
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
  const py = path.join(SCRATCH, "make-variant.py");
  fs.writeFileSync(py, [
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
  // W1: zero chỉ keyframe 2.0 (packet pts == 2.0; E4 var-kf10 cho
  // keyframe 1.0 là 2 packet — keyframe 2.0 tương tự).
  out["var-kf20zero.mp4"] = { file: path.join(SCRATCH, "var-kf20zero.mp4"), ...zeroRange(py, base, path.join(SCRATCH, "var-kf20zero.mp4"), 2.0, 2.0334) };
  // W2: zero toàn bộ GOP 0 (pts 0–1.0).
  out["var-gop0zero.mp4"] = { file: path.join(SCRATCH, "var-gop0zero.mp4"), ...zeroRange(py, base, path.join(SCRATCH, "var-gop0zero.mp4"), 0.0, 1.0) };
  // W7: zero 1 packet P-frame ở pts 2.5 (đích, GOP 2).
  out["var-p25zero.mp4"] = { file: path.join(SCRATCH, "var-p25zero.mp4"), ...zeroRange(py, base, path.join(SCRATCH, "var-p25zero.mp4"), 2.5, 2.5334) };
  // W11: zero B-frame cuối GOP 1 (pts 1.9667).
  out["var-lastb-zero.mp4"] = { file: path.join(SCRATCH, "var-lastb-zero.mp4"), ...zeroRange(py, base, path.join(SCRATCH, "var-lastb-zero.mp4"), 1.9667, 1.9999) };
  // W12: zero P-frame giữa GOP 1 (pts 1.3–1.7), giữ keyframe 1.0 + đuôi GOP.
  out["var-midp-zero.mp4"] = { file: path.join(SCRATCH, "var-midp-zero.mp4"), ...zeroRange(py, base, path.join(SCRATCH, "var-midp-zero.mp4"), 1.3, 1.7) };
  // W13: zero toàn bộ box moov (giữ kích thước/offsets) — parse box
  // ftyp/moov/free/mdat, zero payload của moov (giữ 8 byte header).
  const moovPy = path.join(SCRATCH, "make-moovzero.py");
  fs.writeFileSync(moovPy, [
    "import json, struct, sys",
    "src, dst = sys.argv[1], sys.argv[2]",
    "data = bytearray(open(src, 'rb').read())",
    "pos = 0; boxes = []",
    "while pos + 8 <= len(data):",
    "    size = struct.unpack('>I', data[pos:pos+4])[0]",
    "    typ = data[pos+4:pos+8].decode('latin1')",
    "    if size == 0: size = len(data) - pos",
    "    if size == 1:",
    "        size = struct.unpack('>Q', data[pos+8:pos+16])[0]",
    "    boxes.append((typ, pos, size))",
    "    if size < 8: break",
    "    pos += size",
    "moov = [b for b in boxes if b[0] == 'moov']",
    "assert len(moov) == 1, boxes",
    "typ, mpos, msize = moov[0]",
    "data[mpos+8:mpos+msize] = b'\\x00' * (msize - 8)",
    "open(dst, 'wb').write(bytes(data))",
    "print(json.dumps({'boxes': boxes, 'moovPos': mpos, 'moovSize': msize, 'size': len(data)}))",
    "",
  ].join("\n"));
  out["var-moovzero.mp4"] = { file: path.join(SCRATCH, "var-moovzero.mp4"), ...JSON.parse(execFileSync("python3", [moovPy, base, path.join(SCRATCH, "var-moovzero.mp4")], { encoding: "utf8" })) };
  return out;
}

function buildBundles() {
  for (const [src, out] of [["seek.ts", "seek.mjs"], ["pause45A2.ts", "pause45A2.mjs"]]) {
    execFileSync(ESBUILD, [path.join(WEB_DIR, "src", "lib", src), "--bundle", "--platform=browser", "--format=esm",
      "--outfile=" + path.join(SCRATCH, out)], { stdio: "ignore" });
  }
}

function buildPages() {
  // raw.html — như F6 (seek ở 3 s, chờ 6 s), thêm ?mode= để thử
  // W3/W4/W6/W10 mà không nhân bản trang:
  //   mode=std     : seek t ở 3 s (mặc định)
  //   mode=meta    : seek t ngay khi loadedmetadata bắn
  //   mode=immediate: gán currentTime=t ngay sau khi gán src
  //   mode=play    : play() ở 3 s, seek t sau 500 ms
  //   mode=double  : seek t ở 3 s, rồi seek t2 khi seeked/error
  //                  bắn hoặc sau 4 s (cùng element)
  //   mode=nodom   : video KHÔNG append vào DOM, seek t ở 3 s
  const raw = "<!doctype html><meta charset=\"utf-8\"><title>H3 raw probe</title><body>\n"
    + "<script>\n"
    + "window.__c3 = { events: [], error: null, seeked: false, setThrew: null, done: false };\n"
    + "var q = new URLSearchParams(location.search);\n"
    + "var f = q.get('f'); var t = parseFloat(q.get('t') || '0.1');\n"
    + "var t2 = q.get('t2') === null ? null : parseFloat(q.get('t2'));\n"
    + "var mode = q.get('mode') || 'std';\n"
    + "var base = q.get('base') === 'nolength' ? '/media-nolength/' : '/media/';\n"
    + "window.__c3.targetParam = t; window.__c3.target2 = t2; window.__c3.file = f; window.__c3.mode = mode; window.__c3.base = base;\n"
    + "var v = document.createElement('video');\n"
    + "v.preload = 'auto'; v.muted = true;\n"
    + "var seeks = 0; var secondArmed = false;\n"
    + "function doSecondSeek() {\n"
    + "  if (t2 === null || secondArmed) return; secondArmed = true;\n"
    + "  window.__c3.secondSeekAt = v.currentTime;\n"
    + "  try { v.currentTime = t2; window.__c3.secondSetThrew = false; }\n"
    + "  catch (err) { window.__c3.secondSetThrew = String(err && err.name); }\n"
    + "}\n"
    + "v.addEventListener('error', function () { var e = v.error; window.__c3.error = e ? { code: e.code, message: e.message } : null; window.__c3.events.push('error'); if (mode === 'double') setTimeout(doSecondSeek, 1000); });\n"
    + "v.addEventListener('seeked', function () { window.__c3.seeked = true; window.__c3.atSeeked = v.currentTime; window.__c3.events.push('seeked@' + v.currentTime.toFixed(3)); seeks++; if (mode === 'double') setTimeout(doSecondSeek, 1000); });\n"
    + "v.addEventListener('seeking', function () { window.__c3.events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
    + "v.addEventListener('loadedmetadata', function () { window.__c3.events.push('loadedmetadata'); if (mode === 'meta') { window.__c3.beforeSet = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime }; try { v.currentTime = t; window.__c3.setThrew = false; } catch (err) { window.__c3.setThrew = String(err && err.name); } } });\n"
    + "v.addEventListener('canplay', function () { window.__c3.events.push('canplay'); });\n"
    + "v.addEventListener('waiting', function () { window.__c3.events.push('waiting'); });\n"
    + "v.addEventListener('stalled', function () { window.__c3.events.push('stalled'); });\n"
    + "v.addEventListener('playing', function () { window.__c3.events.push('playing'); });\n"
    + "v.src = base + f;\n"
    + "if (mode !== 'nodom') document.body.appendChild(v);\n"
    + "if (mode === 'immediate') { window.__c3.beforeSet = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime }; try { v.currentTime = t; window.__c3.setThrew = false; } catch (err) { window.__c3.setThrew = String(err && err.name); } }\n"
    + "setTimeout(function () {\n"
    + "  if (mode === 'std' || mode === 'nodom') {\n"
    + "    window.__c3.beforeSet = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "    try { v.currentTime = t; window.__c3.setThrew = false; }\n"
    + "    catch (err) { window.__c3.setThrew = String(err && err.name); }\n"
    + "  } else if (mode === 'play') {\n"
    + "    window.__c3.beforeSet = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "    v.play().then(function () { window.__c3.playOk = true; }, function (e) { window.__c3.playOk = 'FAIL:' + (e && e.message); });\n"
    + "    setTimeout(function () { try { v.currentTime = t; window.__c3.setThrew = false; } catch (err) { window.__c3.setThrew = String(err && err.name); } }, 500);\n"
    + "  } else if (mode === 'double') {\n"
    + "    window.__c3.beforeSet = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "    try { v.currentTime = t; window.__c3.setThrew = false; }\n"
    + "    catch (err) { window.__c3.setThrew = String(err && err.name); }\n"
    + "    setTimeout(function () { doSecondSeek(); }, 4000);\n"
    + "  }\n"
    + "  setTimeout(function () {\n"
    + "    window.__c3.after = { seeking: v.seeking, readyState: v.readyState, currentTime: v.currentTime };\n"
    + "    window.__c3.done = true;\n"
    + "  }, 6000);\n"
    + "}, 3000);\n"
    + "</script>\n";
  fs.writeFileSync(path.join(SCRATCH, "raw.html"), raw);
  // seekel.html — y hệt F6 (seekElement bundle), dùng cho R10 nếu có
  // biến thể đáp sai ở mức raw.
  const seekel = "<!doctype html><meta charset=\"utf-8\"><title>H3 seekElement probe</title>\n"
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

function startChrome(port, display) {
  return new Promise(async (resolve, reject) => {
    const num = display.replace(":", "");
    const sock = "/tmp/.X11-unix/X" + num;
    if (fs.existsSync(sock)) return reject(new Error("display " + display + " vừa bị luồng khác chiếm"));
    const xvfb = spawn("Xvfb", [display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) return reject(new Error("Xvfb không tạo socket"));
    const profileDir = path.join(SCRATCH, "chrome-profile-" + process.pid + "-" + port);
    const flags = ["--no-sandbox", "--remote-debugging-port=" + port, "--remote-debugging-address=127.0.0.1",
      "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
      "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"];
    log("chrome flags: " + JSON.stringify(flags));
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
      return reject(new Error("Chrome không mở được DevTools port " + port + " sau 30 s"));
    }
    log("Chrome DevTools: " + version.Browser + " | " + version["Protocol-Version"]);
    resolve({ chrome, xvfb, version, profileDir });
  });
}
function stopChrome(h) {
  try { h.chrome?.kill("SIGKILL"); } catch {}
  try { h.xvfb?.kill("SIGTERM"); } catch {}
  try { if (h.profileDir) fs.rmSync(h.profileDir, { recursive: true, force: true }); } catch {}
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
    let noLength = false;
    if (url.pathname.startsWith("/media-nolength/")) { file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(16))); noLength = true; }
    else if (url.pathname.startsWith("/media/")) file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(7)));
    else file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(1)) === "" ? "raw.html" : decodeURIComponent(url.pathname.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mjs") ? "text/javascript" : file.endsWith(".mp4") ? "video/mp4" : "text/html";
    const size = fs.statSync(file).size;
    // Biến server H1c: Y2 serve43.mjs KHÔNG đặt Content-Length
    // (chunked); D3 "Y2-exact" thực ra vẫn đặt Content-Length nên
    // biến này chưa từng được loại trừ bằng số.
    if (noLength) res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes" });
    else res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://127.0.0.1:" + server.address().port;
  log("scratch server tại " + ORIGIN + " display " + DISPLAY + " port " + PORT);

  const results = {};
  const run = async (port, key, page, query, retries = 1) => {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const r = await runProbe(port, ORIGIN, page, query);
        results[key] = r;
        log("PROBE " + key + " done (attempt " + attempt + "): " + JSON.stringify(r).slice(0, 500));
        return;
      } catch (e) {
        log("PROBE " + key + " ERROR attempt " + attempt + ": " + String(e && e.message ? e.message : e));
        if (attempt > retries) { results[key] = { error: String(e && e.message ? e.message : e) }; return; }
        await sleep(2000);
      }
    }
  };

  // LƯỢT 1 — Chrome instance chính (profile mới, tab mới mỗi probe).
  const h1 = await startChrome(PORT, DISPLAY);
  try {
    // Đối chứng.
    await run(PORT, "R1-raw-valid-1.5", "raw.html", "?f=valid-gop.mp4&t=1.5");
    await run(PORT, "R2-raw-valid-2.5", "raw.html", "?f=valid-gop.mp4&t=2.5");
    await run(PORT, "R3-seekel-valid-1.5", "seekel.html", "?f=valid-gop.mp4&t=1.5");
    // H1: tái hiện Y2 25d — broken-gap seek 2.5, N=6 tab mới.
    for (let i = 1; i <= 6; i++) {
      await run(PORT, "H1-gap-2.5-run" + i, "raw.html", "?f=broken-gap.mp4&t=2.5");
    }
    // H1c: biến server — cùng file broken-gap, serve KHÔNG
    // Content-Length (Y2-exact), N=3 + đối chứng valid.
    for (let i = 1; i <= 3; i++) {
      await run(PORT, "H1c-gap-2.5-nolength-run" + i, "raw.html", "?f=broken-gap.mp4&t=2.5&base=nolength");
    }
    await run(PORT, "H1c-valid-2.5-nolength", "raw.html", "?f=valid-gop.mp4&t=2.5&base=nolength");
    // W1: zero chỉ keyframe 2.0.
    await run(PORT, "W1-kf20zero-2.5", "raw.html", "?f=var-kf20zero.mp4&t=2.5");
    await run(PORT, "W1b-kf20zero-1.5", "raw.html", "?f=var-kf20zero.mp4&t=1.5");
    // W2: zero toàn bộ GOP 0.
    await run(PORT, "W2-gop0zero-0.5", "raw.html", "?f=var-gop0zero.mp4&t=0.5");
    await run(PORT, "W2b-gop0zero-2.5", "raw.html", "?f=var-gop0zero.mp4&t=2.5");
    await run(PORT, "W2c-gop0zero-0.0", "raw.html", "?f=var-gop0zero.mp4&t=0.0");
    // W3: seek ngay sau load.
    await run(PORT, "W3a-gap-2.5-meta", "raw.html", "?f=broken-gap.mp4&t=2.5&mode=meta");
    await run(PORT, "W3b-gap-2.5-immediate", "raw.html", "?f=broken-gap.mp4&t=2.5&mode=immediate");
    await run(PORT, "W3c-valid-2.5-meta", "raw.html", "?f=valid-gop.mp4&t=2.5&mode=meta");
    await run(PORT, "W3d-valid-2.5-immediate", "raw.html", "?f=valid-gop.mp4&t=2.5&mode=immediate");
    // W4: seek khi đang play.
    await run(PORT, "W4a-gap-2.5-play", "raw.html", "?f=broken-gap.mp4&t=2.5&mode=play");
    await run(PORT, "W4b-valid-2.5-play", "raw.html", "?f=valid-gop.mp4&t=2.5&mode=play");
    // W5: seek vượt duration.
    await run(PORT, "W5a-valid-3.5", "raw.html", "?f=valid-gop.mp4&t=3.5");
    await run(PORT, "W5b-valid-10", "raw.html", "?f=valid-gop.mp4&t=10");
    await run(PORT, "W5c-gap-3.5", "raw.html", "?f=broken-gap.mp4&t=3.5");
    // W6: hai bước cùng element (1.5 hỏng → 2.5).
    await run(PORT, "W6-gap-1.5-then-2.5", "raw.html", "?f=broken-gap.mp4&t=1.5&t2=2.5&mode=double");
    await run(PORT, "W6b-valid-1.5-then-2.5", "raw.html", "?f=valid-gop.mp4&t=1.5&t2=2.5&mode=double");
    // W7: zero 1 P-frame ở pts 2.5.
    await run(PORT, "W7-p25zero-2.5", "raw.html", "?f=var-p25zero.mp4&t=2.5");
    // W10: video không append vào DOM.
    await run(PORT, "W10-gap-2.5-nodom", "raw.html", "?f=broken-gap.mp4&t=2.5&mode=nodom");
    // W11: zero B-frame cuối GOP 1, seek 1.9.
    await run(PORT, "W11-lastb-1.9", "raw.html", "?f=var-lastb-zero.mp4&t=1.9");
    // W12: zero P-frame giữa GOP 1, seek 1.5.
    await run(PORT, "W12-midp-1.5", "raw.html", "?f=var-midp-zero.mp4&t=1.5");
    // W13: zero box moov.
    await run(PORT, "W13-moovzero-1.5", "raw.html", "?f=var-moovzero.mp4&t=1.5");
  } finally {
    stopChrome(h1);
  }

  // LƯỢT 2 — instance mới hoàn toàn (profile mới, tab đầu tiên):
  // kiểm tra "tab mới / instance mới" có đổi landing không.
  const h2port = PORT + 1;
  const h2 = await startChrome(h2port, DISPLAY);
  try {
    await run(h2port, "H1b-gap-2.5-freshA", "raw.html", "?f=broken-gap.mp4&t=2.5");
    await run(h2port, "H1b-valid-2.5-freshA", "raw.html", "?f=valid-gop.mp4&t=2.5");
  } finally {
    stopChrome(h2);
  }
  const h3port = PORT + 2;
  const h3 = await startChrome(h3port, DISPLAY);
  try {
    await run(h3port, "H1b-gap-2.5-freshB", "raw.html", "?f=broken-gap.mp4&t=2.5");
  } finally {
    stopChrome(h3);
  }
  try { server.close(); } catch {}

  // Tìm biến thể đáp sai ở mức raw (seeked@ct, ct != target — kể cả 0).
  // Với mode=double: xét lần seeked CUỐI (sau lần seek thứ hai).
  const near = (ct, t) => typeof ct === "number" && Math.abs(ct - t) < 0.01;
  const lastSeeked = (r) => {
    if (!r || !Array.isArray(r.events)) return null;
    const s = r.events.filter((e) => e.startsWith("seeked@"));
    if (s.length === 0) return null;
    return parseFloat(s[s.length - 1].slice(7));
  };
  const targetOf = (r) => {
    if (!r) return null;
    if (r.mode === "double" && typeof r.target2 === "number") return r.target2;
    return r.targetParam ?? null;
  };
  const rawKeys = Object.keys(results).filter((k) => !k.startsWith("R3-"));
  const wrongKeys = rawKeys.filter((k) => {
    const r = results[k];
    const ct = lastSeeked(r);
    const tgt = targetOf(r);
    return ct !== null && tgt !== null && !near(ct, tgt);
  });
  log("biến thể đáp sai ở mức raw: " + JSON.stringify(wrongKeys));
  // R10 chỉ chạy được trong instance chính (đã tắt) — ghi nhận để
  // lượt sau chạy seekElement nếu có biến thể đáp sai; không mở
  // thêm instance chỉ cho R10 khi không có biến thể nào đáp sai.
  results["R10-source"] = wrongKeys.length > 0 ? wrongKeys : null;
  if (wrongKeys.length > 0) {
    log("CÓ biến thể đáp sai — cần chạy seekElement riêng (xem LIMITS); harness này KHÔNG mở thêm instance");
  } else {
    log("R10 bỏ qua: không biến thể nào đáp sai ở mức raw");
  }

  const checks = [];
  const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 900)); };
  const r1 = results["R1-raw-valid-1.5"] || {};
  const r1Ok = Array.isArray(r1.events) && r1.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 1.5));
  check("CONTROL-valid-raw-1.5", r1Ok ? "PASS" : "FAIL", r1);
  const r2 = results["R2-raw-valid-2.5"] || {};
  const r2Ok = Array.isArray(r2.events) && r2.events.some((e) => e.startsWith("seeked@") && near(parseFloat(e.slice(7)), 2.5));
  check("CONTROL-valid-raw-2.5", r2Ok ? "PASS" : "FAIL", r2);
  const r3 = results["R3-seekel-valid-1.5"] || {};
  const r3Ok = r3.settled === true && r3.result && r3.result.seeked === true
    && Array.isArray(r3.landings) && r3.landings.length >= 1 && r3.landings.every((l) => near(l.ct, 1.5));
  check("CONTROL-valid-seekElement-1.5", r3Ok ? "PASS" : "FAIL", r3);
  // H1: phân bố landing của broken-gap 2.5 qua 8 lần (6 tab + 2 fresh instance).
  const h1Keys = ["H1-gap-2.5-run1", "H1-gap-2.5-run2", "H1-gap-2.5-run3", "H1-gap-2.5-run4", "H1-gap-2.5-run5", "H1-gap-2.5-run6", "H1b-gap-2.5-freshA", "H1b-gap-2.5-freshB"];
  const h1Summary = h1Keys.map((k) => ({ key: k, atSeeked: results[k]?.atSeeked ?? null, events: results[k]?.events ?? null, error: results[k]?.error ?? null }));
  const h1Zero = h1Summary.filter((s) => s.atSeeked === 0).length;
  const h1Right = h1Summary.filter((s) => typeof s.atSeeked === "number" && near(s.atSeeked, 2.5)).length;
  check("H1-reproduce-Y2-landing0", "OBSERVED", { runs: h1Keys.length, landedAt0: h1Zero, landedAt2_5: h1Right, detail: h1Summary });
  const h1cKeys = ["H1c-gap-2.5-nolength-run1", "H1c-gap-2.5-nolength-run2", "H1c-gap-2.5-nolength-run3", "H1c-valid-2.5-nolength"];
  const h1cSummary = h1cKeys.map((k) => ({ key: k, atSeeked: results[k]?.atSeeked ?? null, events: results[k]?.events ?? null, error: results[k]?.error ?? null }));
  check("H1c-server-nolength", "OBSERVED", { detail: h1cSummary });
  // Tóm tắt các hướng W.
  const wSummary = {};
  for (const k of rawKeys) {
    if (k.startsWith("H1") || k.startsWith("R")) continue;
    const r = results[k] || {};
    wSummary[k] = { file: r.file, mode: r.mode, target: r.targetParam, target2: r.target2 ?? null, events: r.events, atSeeked: r.atSeeked ?? null, lastSeeked: lastSeeked(r), after: r.after, error: r.error ?? null };
  }
  check("H3-variants-observed", "OBSERVED", wSummary);
  if (!r1Ok || !r2Ok || !r3Ok) {
    check("H3-fail-fast-headed", "NOT_MEASURED", { reason: "đối chứng valid hỏng nên kết quả biến thể vô nghĩa", R1: r1, R2: r2, R3: r3 });
  } else if (wrongKeys.length === 0) {
    check("H3-fail-fast-headed", "NOT_MEASURED", { reason: "không biến thể nào đáp sai ở mức raw (xem wSummary + H1) — 13 hướng mới đều không tạo được landing sai currentTime", variantSummary: wSummary, h1: h1Summary });
  } else {
    check("H3-fail-fast-headed", "NOT_MEASURED", { reason: "có biến thể đáp sai ở mức raw nhưng chưa chạy seekElement trong lượt này (cần instance riêng) — xem R10-source", wrongKeys, variantSummary: wSummary });
  }

  console.log(JSON.stringify({ fixtures, checks, results }, null, 2));
  const failed = checks.filter((c) => c.status === "FAIL").length;
  log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
