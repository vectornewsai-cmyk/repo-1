// seek-p2-underload-probe.mjs — Phase 9 đợt 32, luồng P2.
// Điểm khác duy nhất so với probe O3 (seek-o3-browser-probe.mjs):
// tải nhân tạo (4x `yes` bão hòa 4 nhân) được BẬT TRƯỚC pha scrub và
// GIỮ XUYÊN SUỐT cả pha phát xuôi lẫn phát ngược, chỉ tắt ở cuối.
// O3 tắt tải sau scrub nên "phát xuôi/ngược dưới tải" vẫn là nợ mở
// (O3 LIMITS §7.2) — probe này đóng đúng nợ đó, không đo lại thứ O3
// đã đo xong (hội tụ không tải, retry Node 120s) ngoài 1 lượt scrub
// dưới tải xác nhận cửa sổ 25s vẫn đủ.
// Cách đo: CDP qua WebSocket, Chromium Playwright headless, viewport
// 1440x900, snapshot dist B8u (sha 6d0a6c00e188d3e4, khớp bundle O3 —
// seek.ts/preview.tsx không đổi từ lúc O3 build nên không build lại,
// tránh đua với các luồng P khác đang sửa cây).
// Kết quả: benchmarks/results/v32-p2-seek-underload.json (KHÔNG ghi
// đè file bằng chứng nào của O3/N1). KHÔNG push, KHÔNG sửa code sản phẩm.
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { snapshotBundleFromDist } from "./cdp-bundle.mjs";

// Phase 9 đợt 34 Q5 — kỷ luật snapshot treo CDP (mẫu đợt 32 O3/P3):
// file này từng được P3 cố tình chưa nối vì luồng P2 đang chạy; nay
// P2 đã xong nên nối. Đợt 35 R5: probe có snapshotDist từ SNAP (HANG_BUNDLE) nên snapshot ghi bundle thật.
// (SNAP thiếu index.html → null → module snapshot ghi status "not-captured", xem cdp-snapshot.mjs).
// outDir bền ngoài repo, ngoài /tmp (mẫu đợt 32 O2). Cdp.proc được
// gán trong main() sau khi spawn Chrome.
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "seek-p2-underload-probe");

// Phase 9 đợt 35 R5 — snapshotDist riêng cho harness WS (nợ đợt 34
// §3 mục 5) + fetch /json có AbortSignal, cùng mẫu seek-o3: probe
// serve đúng SNAP nên bundle đang đo xác định được từ SNAP/index.html
// (entry script + sha, xem cdp-bundle.mjs), tính một lần lúc khởi
// động; SNAP thiếu index.html → null → "not-captured" như cũ.
// Fetch mỗi lần cắt sau 5000ms (CDP_JSON_ATTEMPT_TIMEOUT_MS), nhịp
// 60 lần × 500ms giữ nguyên; chờ ws.onopen đã có timeout 15s nên
// giữ nguyên.
const CDP_JSON_ATTEMPT_TIMEOUT_MS = Number(process.env.CDP_JSON_ATTEMPT_TIMEOUT_MS || 5000);

const SNAP = process.env.P2_SNAP || path.join(os.homedir(), "workspace", "tmp-round32-o3", "dist");
// R5: bundle thật đang serve (tính sau khi SNAP đã khai báo).
const HANG_BUNDLE = snapshotBundleFromDist(SNAP);
const PORT = Number(process.env.P2_PORT || 4322);
const CDP_PORT = Number(process.env.P2_CDP_PORT || 9322);
const CHROME = process.env.P2_CHROME || path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[p2] ${a.join(" ")}`);

function serve(dir) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p === "/") p = "/index.html";
      const file = path.join(dir, p);
      if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end("not found"); return;
      }
      const ext = path.extname(file);
      const type = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : ext === ".html" ? "text/html" : ext === ".mp4" ? "video/mp4" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(PORT, "127.0.0.1", () => resolve(srv));
  });
}

class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pend = new Map(); this.proc = null;
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && this.pend.has(d.id)) { const { resolve, reject } = this.pend.get(d.id); this.pend.delete(d.id); d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result); } };
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pend.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pend.has(id)) { this.pend.delete(id); try { const hangSnap = captureCdpHangSnapshot({ proc: this.proc, pendingCount: this.pend.size, method, timeoutMs: 60000, outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE, extra: { transport: "websocket", port: PORT, cdpPort: CDP_PORT, ...(HANG_BUNDLE ? { distDir: HANG_BUNDLE.dist } : {}) } }); if (hangSnap.file) log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`); else log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`); } catch (e) { log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); } reject(new Error("cdp timeout " + method)); } }, 60000); }); }
  async eval(expr) { const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails).slice(0, 500)); return r.result.value; }
}

function installProbeInPage() {
  if (window.__p2) return { already: true };
  var st = { nextId: 1, byEl: [], sets: [] };
  window.__p2 = st;
  var origCreate = document.createElement.bind(document);
  document.createElement = function (tag) {
    var el = origCreate.apply(document, arguments);
    if (typeof tag === "string" && tag.toLowerCase() === "video") {
      var id = st.nextId++;
      el.__p2id = id;
      st.byEl.push({ id: id, el: el });
    }
    return el;
  };
  try {
    var desc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, "currentTime");
    if (desc && desc.set) {
      var origSet = desc.set;
      Object.defineProperty(window.HTMLVideoElement.prototype, "currentTime", {
        configurable: true, enumerable: !!desc.enumerable, get: desc.get,
        set: function (v) {
          var id = (this.__p2id !== undefined) ? this.__p2id : -1;
          st.sets.push({ t: Math.round(performance.now()), id: id, value: v });
          if (st.sets.length > 20000) st.sets.splice(0, 1000);
          origSet.call(this, v);
        },
      });
    }
  } catch (e) { st.setterError = String(e).slice(0, 200); }
  return { installed: true };
}
function sampleFrame() {
  var canvas = document.querySelector("canvas.preview-canvas");
  var hash = null, mean = null;
  if (canvas && canvas.width > 1 && canvas.height > 1) {
    try {
      var ctx = canvas.getContext("2d");
      var d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      var s = 0, r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < d.length; i += 256) { s = (s + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007; }
      for (var j = 0; j < d.length; j += 64) { r += d[j]; g += d[j + 1]; b += d[j + 2]; n++; }
      hash = s; mean = n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : null;
    } catch (e) { hash = null; }
  }
  var st = window.__p2 || null;
  var els = st ? st.byEl.map(function (rec) { var el = rec.el; var src = el.currentSrc || el.src || ""; return { id: rec.id, srcKind: src.slice(0, 5) === "blob:" ? "blob" : (src.slice(0, 4) === "http" ? "http" : "other"), seeking: el.seeking, ct: el.currentTime, rs: el.readyState, paused: el.paused }; }) : [];
  var idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, lastDrawn: window.__vcutPreviewIdle.lastDrawn, lastRequested: window.__vcutPreviewIdle.lastRequested } : null;
  var tc = document.querySelector(".tl-timecode");
  return { t: Math.round(performance.now()), hash: hash, mean: mean, els: els, idle: idle, timecode: tc ? tc.textContent.trim() : null };
}
async function clickButton(cdp, matchText) {
  return cdp.eval(`(() => { const b = [...document.querySelectorAll("button")].find((x) => ((x.textContent || "") + " " + (x.getAttribute("aria-label") || "") + " " + (x.getAttribute("title") || "")).includes(${JSON.stringify(matchText)})); if (!b) return null; b.click(); return { text: (b.textContent || "").trim(), aria: b.getAttribute("aria-label") || "" }; })()`);
}
function parseTimecode(tc) {
  if (!tc) return null;
  const m = tc.match(/(\d+):(\d+):(\d+):(\d+)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 30;
}
function activeEl(els) {
  const blob = (els || []).filter((e) => e.srcKind === "blob");
  if (!blob.length) return null;
  blob.sort((a, b) => (b.rs - a.rs) || (a.id - b.id));
  return blob[0];
}
// Phân tích 1 pha phát: đếm set trong cửa sổ, bước ct lớn nhất giữa
// 2 sample liên tiếp CỦA CÙNG MỘT element (so khác element khi chuyển
// clip sẽ cho bước nhảy giả — lỗi của bản run1), số frame đen SAU
// khi nội dung đã bắt đầu (mean tổng <= 6; mẫu trước nội dung không
// tính), và quỹ đạo timecode đầu/cuối.
function analyzePhase(samples, setsInPhase) {
  let maxStepSigned = 0, blackAfterContent = 0, contentStarted = false, seekingSamples = 0;
  const prevById = new Map();
  for (const s of samples) {
    if (s.mean) {
      const sum = s.mean[0] + s.mean[1] + s.mean[2];
      if (sum > 30) contentStarted = true;
      else if (contentStarted && sum <= 6) blackAfterContent++;
    }
    for (const e of (s.els || []).filter((x) => x.srcKind === "blob")) {
      if (e.seeking) seekingSamples++;
      if (prevById.has(e.id)) {
        const step = e.ct - prevById.get(e.id);
        if (Math.abs(step) > Math.abs(maxStepSigned)) maxStepSigned = step;
      }
      prevById.set(e.id, e.ct);
    }
  }
  return { samples: samples.length, setsInPhase: setsInPhase.length, setValues: setsInPhase.map((x) => x.value),
    tcFirst: samples.length ? samples[0].timecode : null, tcLast: samples.length ? samples[samples.length - 1].timecode : null,
    tcFirstSec: samples.length ? parseTimecode(samples[0].timecode) : null, tcLastSec: samples.length ? parseTimecode(samples[samples.length - 1].timecode) : null,
    maxStepAbsSameEl: Math.round(Math.abs(maxStepSigned) * 1000) / 1000,
    maxStepSignedSameEl: Math.round(maxStepSigned * 1000) / 1000, seekingSamples, blackAfterContent };
}

async function main() {
  const out = { run: "v32-p2-seek-underload", date: new Date().toISOString(), load: "4x yes, xuyên suốt scrub + phát xuôi + phát ngược" };
  let server = null, chrome = null;
  const loadProcs = [];
  const killLoad = () => { for (const p of loadProcs) try { p.kill("SIGKILL"); } catch {} loadProcs.length = 0; };
  try {
    if (!fs.existsSync(path.join(SNAP, "index.html"))) throw new Error("snapshot thiếu index.html: " + SNAP);
    server = await serve(SNAP);
    log("server lên", PORT, "snapshot", SNAP);
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "p2-chrome-"));
    chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
    let targets = null;
    for (let i = 0; i < 60 && !targets; i++) {
      await sleep(500);
      try { const ctrl = new AbortController(); const at = setTimeout(() => ctrl.abort(), CDP_JSON_ATTEMPT_TIMEOUT_MS); try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`, { signal: ctrl.signal }); const j = await r.json(); if (j.length) targets = j; } finally { clearTimeout(at); } } catch {}
    }
    if (!targets) throw new Error("không lấy được /json/list");
    const page = targets.find((t) => t.type === "page") || targets[0];
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error("ws timeout")), 15000); });
    const cdp = new Cdp(ws);
    cdp.proc = chrome; // Q5: snapshot treo cần proc (mẫu O2/O3)
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
    try { await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); } catch {}
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
    await sleep(5000);
    await cdp.eval(`(${installProbeInPage.toString()})()`);
    log("click Dự án mẫu:", JSON.stringify(await clickButton(cdp, "Dự án mẫu")));
    await sleep(6000);
    const afterSample = await cdp.eval(`(() => { const canvas = document.querySelector("canvas.preview-canvas"); const tc = document.querySelector(".tl-timecode"); return { canvas: canvas ? { w: canvas.width, h: canvas.height } : null, timecode: tc ? tc.textContent.trim() : null }; })()`);
    out.afterSample = afterSample;
    log("sau Dự án mẫu:", JSON.stringify(afterSample));
    const poolCount = (await cdp.eval(`(${sampleFrame.toString()})()`)).els.filter((e) => e.srcKind === "blob").length;
    if (poolCount === 0) throw new Error("không có pool video blob — không đo được");
    // Về đầu + chờ idle (chưa bật tải, giống O3) rồi mới bật tải.
    await clickButton(cdp, "Về đầu");
    for (let i = 0; i < 30; i++) { const s = await cdp.eval(`(${sampleFrame.toString()})()`); if (s.idle && s.idle.sleeping) break; await sleep(200); }
    // BẬT TẢI — giữ tới cuối mọi pha.
    for (let i = 0; i < 4; i++) loadProcs.push(spawn("yes", [], { stdio: "ignore" }));
    log("bật tải: 4x yes (giữ xuyên suốt)");
    // (a) Scrub M3 dưới tải, poll 200ms tới 25s, tiêu chí hội tụ như O3.
    // BÀI HỌC RUN1: kéo handle mà playhead không nhúc nhích thì vòng
    // poll vẫn "hội tụ" ngay (idle ngủ sẵn ở 0) — hội tụ GIẢ kiểu O3
    // §3.1. Nên: sau mỗi lần kéo phải XÁC MINH playhead đã tới ~2,9s
    // mới được tính hội tụ; kéo tới 3 lần, ghi rõ từng lần.
    async function dragTo3s() {
      const geom = await cdp.eval(`(() => { const r = document.querySelector(".tl-ruler"); const h = document.querySelector(".tl-playhead-handle"); const rr = r.getBoundingClientRect(); const hr = h.getBoundingClientRect(); return { rx: rr.x, ry: rr.y, rh: rr.height, hx: hr.x + hr.width / 2, hy: hr.y + hr.height / 2 }; })()`);
      const targetX = geom.rx - 6.5 + 180;
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: geom.hx, y: geom.hy });
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: geom.hx, y: geom.hy, button: "left", clickCount: 1 });
      for (let k = 1; k <= 10; k++) { await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: geom.hx + (targetX - geom.hx) * k / 10, y: geom.hy }); await sleep(30); }
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: targetX, y: geom.hy, button: "left", clickCount: 1 });
    }
    const dragAttempts = [];
    let scrubOk = false;
    for (let att = 1; att <= 3 && !scrubOk; att++) {
      const setsBefore = await cdp.eval(`window.__p2.sets.length`);
      await dragTo3s();
      await sleep(2000);
      const chk = await cdp.eval(`(${sampleFrame.toString()})()`);
      const moved = parseTimecode(chk.timecode);
      const setsAfter = await cdp.eval(`window.__p2.sets.length`);
      dragAttempts.push({ attempt: att, timecode: chk.timecode, sec: moved, setsDelta: setsAfter - setsBefore, idle: chk.idle });
      log(`kéo lần ${att}: tc = ${chk.timecode} setsDelta = ${setsAfter - setsBefore}`);
      if (moved !== null && moved >= 2.0) scrubOk = true;
    }
    let series = [], convergedAt = null;
    if (scrubOk) {
      const t0 = Date.now();
      for (let i = 0; i < 125; i++) {
        const s = await cdp.eval(`(${sampleFrame.toString()})()`);
        const act = activeEl(s.els);
        const conv = !!(s.idle && s.idle.sleeping && s.idle.lastDrawn !== null && s.idle.lastDrawn === s.idle.lastRequested && act && !act.seeking);
        series.push({ wallMs: Date.now() - t0, converged: conv, active: act, hash: s.hash, mean: s.mean, timecode: s.timecode, idle: s.idle });
        if (conv && series.length >= 3 && series.slice(-3).every((x) => x.converged) && convergedAt === null) convergedAt = series[series.length - 3].wallMs;
        if (convergedAt !== null) break;
        await sleep(200);
      }
    }
    out.scrubUnderLoad = { dragAttempts, scrubOk, convergedAtMs: convergedAt, polls: series.length, final: series.length ? series[series.length - 1] : null, series };
    log("scrub dưới tải: ok =", scrubOk, "convergedAtMs =", convergedAt, "polls =", series.length);
    // (b) Phát xuôi DƯỚI TẢI (không tắt tải như O3).
    await clickButton(cdp, "Về đầu");
    await sleep(1500);
    const fwdHome = await cdp.eval(`(${sampleFrame.toString()})()`);
    const fwdSetMark = await cdp.eval(`window.__p2.sets.length`);
    await clickButton(cdp, "Phát");
    const fwd = [];
    for (let i = 0; i < 60; i++) { fwd.push(await cdp.eval(`(${sampleFrame.toString()})()`)); await sleep(100); }
    await clickButton(cdp, "Phát"); // toggle pause
    await sleep(1000);
    const fwdSets = (await cdp.eval(`window.__p2.sets`)).slice(fwdSetMark);
    out.forwardUnderLoad = { homeBeforePlay: fwdHome, analysis: analyzePhase(fwd, fwdSets), samples: fwd };
    log("phát xuôi dưới tải:", JSON.stringify(out.forwardUnderLoad.analysis));
    // (c) Phát ngược DƯỚI TẢI. Ghi timecode ngay trước khi bấm ngược
    // (nợ O3 §7.4: Về đầu trước pha ngược từng không có tác dụng).
    await clickButton(cdp, "Về đầu");
    await sleep(1500);
    const revHome = await cdp.eval(`(${sampleFrame.toString()})()`);
    const revBtn = await clickButton(cdp, "Phát ngược");
    const revSetMark = await cdp.eval(`window.__p2.sets.length`);
    const rev = [];
    for (let i = 0; i < 50; i++) { rev.push(await cdp.eval(`(${sampleFrame.toString()})()`)); await sleep(100); }
    const revSets = (await cdp.eval(`window.__p2.sets`)).slice(revSetMark);
    out.reverseUnderLoad = { homeBeforeReverse: revHome, button: revBtn, analysis: analyzePhase(rev, revSets), samples: rev };
    log("phát ngược dưới tải:", JSON.stringify(out.reverseUnderLoad.analysis));
    await clickButton(cdp, "Về đầu");
    await sleep(500);
    out.allSets = await cdp.eval(`window.__p2.sets`);
    ws.close();
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 500);
    log("LỖI:", out.error);
  } finally {
    killLoad();
    try { chrome?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  }
  const outPath = process.env.P2_OUTFILE || path.join("benchmarks/results/v32-p2-seek-underload.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  log("JSON:", outPath);
  process.exit(out.error ? 2 : 0);
}
main();
