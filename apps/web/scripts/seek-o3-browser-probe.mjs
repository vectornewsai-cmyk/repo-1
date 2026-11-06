// seek-o3-browser-probe.mjs — Phase 9 đợt 32, luồng O3.
// Probe browser TỰ VIẾT cho đợt này (CDP qua WebSocket, không dùng
// lại harness của các đợt trước):
//  1. serve snapshot dist tại /tmp (đã copy trước khi chạy),
//  2. mở Chromium headless với --remote-debugging-port,
//  3. khám phá DOM thật của app: nút bấm, canvas, video element,
//     hook window, rồi (nếu tìm được đường điều khiển) đo scrub /
//     phát xuôi / phát ngược.
//  Chế độ: DISCOVER (mặc định, chỉ khám phá + dump JSON) hoặc
//  MEASURE (thử scrub + play, xem kết quả rồi kết luận).
//  KHÔNG push, KHÔNG sửa code sản phẩm.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { snapshotBundleFromDist } from "./cdp-bundle.mjs";
import { distManifest, verifyDistManifest } from "./cdp-dist-freeze.mjs";

// Phase 9 đợt 32 P3 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs,
// mẫu WebSocket đợt 32 O2): Cdp qua WebSocket, Chrome do chính probe
// spawn nên proc có sẵn (gán cdp.proc = chrome sau khi tạo Cdp).
// Đợt 35 R5: probe có snapshotDist từ SNAP (HANG_BUNDLE) nên snapshot ghi bundle thật; SNAP thiếu thì null → "not-captured". outDir bền ngoài repo,
// ngoài /tmp.
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "seek-o3-browser-probe");

// Phase 9 đợt 35 R5 — snapshotDist riêng cho harness WS (nợ đợt 34
// §3 mục 5): probe serve đúng SNAP nên bundle đang đo xác định được
// từ SNAP/index.html (entry script + sha, xem cdp-bundle.mjs), tính
// một lần lúc khởi động. SNAP thiếu index.html → null → snapshot
// giữ "not-captured" như cũ (main() vốn đã throw khi thiếu index).
// Fetch /json mỗi lần có AbortSignal 5000ms (biến môi trường
// CDP_JSON_ATTEMPT_TIMEOUT_MS): trước đây fetch kẹt treo cả vòng
// 60 lần; nhịp 60 lần × 500ms giữ nguyên. Chờ ws.onopen đã có
// timeout 15s từ trước nên giữ nguyên, không đổi.
// Đợt 36 S6 — đóng băng dist cho harness WS (nợ §3.6 đợt 35, mẫu
// pipe N2 / probe Q6-R2): SNAP vốn đã là bản sao copy trước khi chạy
// (kiểu pipe), nay thêm manifest sha256 toàn SNAP lúc khởi động và
// đối chiếu lại trước khi ghi JSON — lệch → out.frozenDist.validity
// = "INVALID" và (nếu chưa có lỗi khác) out.error + exit 2 theo quy
// ước sẵn có của probe này (bench dùng exit 3 theo quy ước của R2;
// khác số exit nhưng cùng ngữ nghĩa "vi phạm → kết quả bị loại").
// Logic đo/khám phá không đụng một chữ.
const CDP_JSON_ATTEMPT_TIMEOUT_MS = Number(process.env.CDP_JSON_ATTEMPT_TIMEOUT_MS || 5000);

const MODE = process.env.O3_MODE || "DISCOVER";
const SNAP = process.env.O3_SNAP || path.join(os.homedir(), "workspace", "tmp-round32-o3", "dist");
// R5: bundle thật đang serve (tính sau khi SNAP đã khai báo).
const HANG_BUNDLE = snapshotBundleFromDist(SNAP);
const PORT = Number(process.env.O3_PORT || 4321);
const CDP_PORT = Number(process.env.O3_CDP_PORT || 9321);
const CHROME = process.env.O3_CHROME || path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const LOAD = process.env.O3_LOAD || ""; // "yes" => spawn 3 tiến trình yes bão hòa CPU
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[o3] ${a.join(" ")}`);

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
  constructor(ws) { this.ws = ws; this.id = 0; this.pend = new Map(); this.ev = []; this.proc = null;
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && this.pend.has(d.id)) { const { resolve, reject } = this.pend.get(d.id); this.pend.delete(d.id); d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result); } else if (d.method) this.ev.push(d); };
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pend.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pend.has(id)) { this.pend.delete(id); try { const hangSnap = captureCdpHangSnapshot({ proc: this.proc, pendingCount: this.pend.size, method, timeoutMs: 60000, outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE, extra: { transport: "websocket", port: PORT, cdpPort: CDP_PORT, ...(HANG_BUNDLE ? { distDir: HANG_BUNDLE.dist } : {}) } }); if (hangSnap.file) log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`); else log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`); } catch (e) { log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); } reject(new Error("cdp timeout " + method)); } }, 60000); }); }
  async eval(expr) { const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails).slice(0, 500)); return r.result.value; }
}

// ---- MEASURE (tự viết cho O3) ----
function installProbeInPage() {
  if (window.__o3) return { already: true };
  var st = { nextId: 1, byEl: [], events: [], sets: [] };
  window.__o3 = st;
  var origCreate = document.createElement.bind(document);
  document.createElement = function (tag) {
    var el = origCreate.apply(document, arguments);
    if (typeof tag === "string" && tag.toLowerCase() === "video") {
      var id = st.nextId++;
      el.__o3id = id;
      st.byEl.push({ id: id, el: el });
      el.addEventListener("seeking", function () { st.events.push({ t: Math.round(performance.now()), kind: "seeking", id: id, ct: el.currentTime }); });
      el.addEventListener("seeked", function () { st.events.push({ t: Math.round(performance.now()), kind: "seeked", id: id, ct: el.currentTime }); });
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
          var id = (this.__o3id !== undefined) ? this.__o3id : -1;
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
  var st = window.__o3 || null;
  var els = st ? st.byEl.map(function (rec) { var el = rec.el; var src = el.currentSrc || el.src || ""; return { id: rec.id, srcKind: src.slice(0, 5) === "blob:" ? "blob" : (src.slice(0, 4) === "http" ? "http" : "other"), seeking: el.seeking, ct: el.currentTime, rs: el.readyState, paused: el.paused }; }) : [];
  var idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, lastDrawn: window.__vcutPreviewIdle.lastDrawn, lastRequested: window.__vcutPreviewIdle.lastRequested, pendingSeek: window.__vcutPreviewIdle.pendingSeek } : null;
  var tc = document.querySelector(".tl-timecode");
  return { t: Math.round(performance.now()), hash: hash, mean: mean, els: els, idle: idle, timecode: tc ? tc.textContent.trim() : null };
}
async function clickButton(cdp, matchText) {
  // Bấm bằng el.click() trong trang (đáng tin hơn hit-test chuột tổng
  // hợp khi đo state machine; scrub bằng tọa độ ruler vẫn dùng chuột
  // CDP vì vị trí click mới là tín hiệu).
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
async function measure(cdp, out) {
  const installed = await cdp.eval(`(${installProbeInPage.toString()})()`);
  log("hook O3:", JSON.stringify(installed));
  const sampleBtn = await clickButton(cdp, "Dự án mẫu");
  log("click Dự án mẫu:", JSON.stringify(sampleBtn));
  await sleep(6000);
  const afterSample = await cdp.eval(`(() => { const names = [...document.querySelectorAll(".media-name")].map((el) => (el.textContent || "").trim()); const tc = document.querySelector(".tl-timecode"); const canvas = document.querySelector("canvas.preview-canvas"); const tracks = document.querySelectorAll(".tl-lanes > *").length; return { mediaNames: names, timecode: tc ? tc.textContent.trim() : null, canvas: canvas ? { w: canvas.width, h: canvas.height } : null, lanes: tracks }; })()`);
  out.sampleProject = afterSample;
  log("sau Dự án mẫu:", JSON.stringify(afterSample));
  const poolCount = (await cdp.eval(`(${sampleFrame.toString()})()`)).els.filter((e) => e.srcKind === "blob").length;
  out.poolBlobsAfterSample = poolCount;
  if (poolCount === 0) { out.measureSkipped = "không có pool video blob sau Dự án mẫu — không đo play/scrub được"; log(out.measureSkipped); return; }
  // Về đầu + chờ idle thật trước khi đo (tránh nhiễu từ lần seek trước).
  await clickButton(cdp, "Về đầu");
  for (let i = 0; i < 30; i++) { const s = await cdp.eval(`(${sampleFrame.toString()})()`); if (s.idle && s.idle.sleeping) break; await sleep(200); }
  // (a0) Thử 3 cách seek để tìm cách thật (lượt trước click ruler
  // không đổi playhead, 0 set — không được đo hội tụ trên seek giả).
  const seekTrials = [];
  async function resetHome() {
    await clickButton(cdp, "Về đầu");
    for (let i = 0; i < 30; i++) { const s = await cdp.eval(`(${sampleFrame.toString()})()`); if (s.idle && s.idle.sleeping) break; await sleep(200); }
  }
  async function readPlayhead() { const s = await cdp.eval(`(${sampleFrame.toString()})()`); return { tc: s.timecode, sec: parseTimecode(s.timecode), sets: await cdp.eval(`window.__o3.sets.length`) }; }
  {
    const r0 = await cdp.eval(`(() => { const r = document.querySelector(".tl-ruler"); const h = document.querySelector(".tl-playhead-handle"); const rr = r.getBoundingClientRect(); const hr = h.getBoundingClientRect(); return { rx: rr.x, ry: rr.y, rh: rr.height, hx: hr.x + hr.width / 2, hy: hr.y + hr.height / 2 }; })()`);
    const tx = r0.rx + 180, ty = r0.ry + r0.rh / 2;
    // M1: CDP click ruler.
    { const before = await readPlayhead(); await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: tx, y: ty }); await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: tx, y: ty, button: "left", clickCount: 1 }); await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: tx, y: ty, button: "left", clickCount: 1 }); await sleep(1500); const after = await readPlayhead(); seekTrials.push({ method: "M1-cdp-click-ruler", before, after }); await resetHome(); }
    // M2: MouseEvent trong trang lên .tl-ruler.
    { const before = await readPlayhead(); await cdp.eval(`(() => { const r = document.querySelector(".tl-ruler"); const rr = r.getBoundingClientRect(); ["mousedown", "mouseup", "click"].forEach((t) => r.dispatchEvent(new MouseEvent(t, { bubbles: true, clientX: rr.x + 180, clientY: rr.y + rr.height / 2, button: 0 }))); return true; })()`); await sleep(1500); const after = await readPlayhead(); seekTrials.push({ method: "M2-page-mouseevent-ruler", before, after }); await resetHome(); }
    // M3: kéo handle tới vị trí ứng với 3s (handleX0 = hx lúc playhead 0).
    { const before = await readPlayhead(); const targetX = r0.rx - 6.5 + 180; await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r0.hx, y: r0.hy }); await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r0.hx, y: r0.hy, button: "left", clickCount: 1 }); for (let k = 1; k <= 10; k++) { await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r0.hx + (targetX - r0.hx) * k / 10, y: r0.hy }); await sleep(30); } await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: targetX, y: r0.hy, button: "left", clickCount: 1 }); await sleep(1500); const after = await readPlayhead(); seekTrials.push({ method: "M3-cdp-drag-handle", before, after }); await resetHome(); }
  }
  out.seekTrials = seekTrials;
  log("seekTrials:", JSON.stringify(seekTrials));
  // (a) Scrub TRƯỚC (khi đang pause): bật tải nếu LOAD=yes rồi seek
  // bằng cách đầu tiên đổi được playhead, poll 200ms tới 25s. Tiêu
  // chí hội tụ: 3 poll liên tiếp mà idle.sleeping=true,
  // lastDrawn==lastRequested (đã vẽ đúng playhead theo hook của chính
  // preview) và element active không seeking. Canvas hash là bằng
  // chứng phụ (headless có thể xẹp canvas).
  let loadProcs = [];
  if (LOAD === "yes") { for (let i = 0; i < 4; i++) loadProcs.push(spawn("yes", [], { stdio: "ignore" })); log("bật tải: 4x yes"); }
  const ruler = await cdp.eval(`(() => { const r = document.querySelector(".tl-ruler"); const h = document.querySelector(".tl-playhead-handle"); if (!r) return null; const rr = r.getBoundingClientRect(); const hr = h ? h.getBoundingClientRect() : null; const zoom = document.querySelector(".tl-zoom input"); return { x: rr.x, y: rr.y, w: rr.width, h: rr.height, handleX: hr ? hr.x : null, pps: zoom ? Number(zoom.value) : 60 }; })()`);
  out.ruler = ruler;
  log("ruler:", JSON.stringify(ruler));
  let scrub = null;
  const chosen = seekTrials.find((t) => t.after && t.after.sec !== null && t.before && Math.abs(t.after.sec - t.before.sec) > 0.2);
  out.scrubMethod = chosen ? chosen.method : null;
  log("scrubMethod:", out.scrubMethod);
  if (ruler && chosen) {
    const clickX = ruler.x + Math.min(ruler.w - 10, 60 * 3.0);
    const clickY = ruler.y + ruler.h / 2;
    if (chosen.method === "M3-cdp-drag-handle") {
      const h = await cdp.eval(`(() => { const el = document.querySelector(".tl-playhead-handle"); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      const targetX = ruler.x - 6.5 + 180;
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: h.x, y: h.y });
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: h.x, y: h.y, button: "left", clickCount: 1 });
      for (let k = 1; k <= 10; k++) { await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: h.x + (targetX - h.x) * k / 10, y: h.y }); await sleep(30); }
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: targetX, y: h.y, button: "left", clickCount: 1 });
    } else if (chosen.method === "M2-page-mouseevent-ruler") {
      await cdp.eval(`(() => { const r = document.querySelector(".tl-ruler"); const rr = r.getBoundingClientRect(); ["mousedown", "mouseup", "click"].forEach((t) => r.dispatchEvent(new MouseEvent(t, { bubbles: true, clientX: rr.x + 180, clientY: rr.y + rr.height / 2, button: 0 }))); return true; })()`);
    } else {
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: clickX, y: clickY });
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: clickX, y: clickY, button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: clickX, y: clickY, button: "left", clickCount: 1 });
    }
    const series = [];
    const t0 = Date.now();
    let convergedAt = null;
    for (let i = 0; i < 125; i++) {
      const s = await cdp.eval(`(${sampleFrame.toString()})()`);
      const act = activeEl(s.els);
      const conv = !!(s.idle && s.idle.sleeping && s.idle.lastDrawn !== null && s.idle.lastDrawn === s.idle.lastRequested && act && !act.seeking);
      series.push({ wallMs: Date.now() - t0, converged: conv, active: act, ...s });
      if (conv && series.length >= 3 && series.slice(-3).every((x) => x.converged) && convergedAt === null) convergedAt = series[series.length - 3].wallMs;
      if (convergedAt !== null && series.length >= 3 && series.slice(-3).every((x) => x.converged)) break;
      await sleep(200);
    }
    scrub = { clickX, convergedAtMs: convergedAt, series };
  }
  for (const p of loadProcs) try { p.kill("SIGKILL"); } catch {}
  await sleep(2000);
  const afterIdle = await cdp.eval(`(${sampleFrame.toString()})()`);
  out.scrub = { scrub, afterIdle, sets: await cdp.eval(`window.__o3.sets`), events: await cdp.eval(`window.__o3.events`) };
  log("scrub: convergedAtMs =", scrub ? scrub.convergedAtMs : null, "polls =", scrub ? scrub.series.length : 0, "afterIdle hash =", afterIdle.hash, "idle =", JSON.stringify(afterIdle.idle));
  // (b) Phát xuôi: về đầu, bấm Phát, sample 100ms x 60.
  await clickButton(cdp, "Về đầu");
  await sleep(1000);
  const fwdStart = await cdp.eval(`window.__o3.sets.length`);
  await clickButton(cdp, "Phát");
  const fwd = [];
  for (let i = 0; i < 60; i++) { fwd.push(await cdp.eval(`(${sampleFrame.toString()})()`)); await sleep(100); }
  await clickButton(cdp, "Phát"); // toggle pause
  await sleep(1000);
  out.forward = { samples: fwd, setsFrom: fwdStart, sets: await cdp.eval(`window.__o3.sets`), events: await cdp.eval(`window.__o3.events`) };
  // (c) Phát ngược (đo cuối để không nhiễu các pha trước).
  await clickButton(cdp, "Về đầu");
  await sleep(1000);
  const revBtn = await clickButton(cdp, "Phát ngược");
  const rev = [];
  for (let i = 0; i < 50; i++) { rev.push(await cdp.eval(`(${sampleFrame.toString()})()`)); await sleep(100); }
  out.reverse = { button: revBtn, samples: rev, sets: await cdp.eval(`window.__o3.sets`), events: await cdp.eval(`window.__o3.events`) };
  await clickButton(cdp, "Về đầu");
  await sleep(500);
}

async function main() {
  const out = { mode: MODE, date: new Date().toISOString(), load: LOAD, steps: [] };
  let server = null, chrome = null, loadProcs = [];
  let frozenBefore = null;
  try {
    if (!fs.existsSync(path.join(SNAP, "index.html"))) throw new Error("snapshot thiếu index.html: " + SNAP);
    frozenBefore = distManifest(SNAP);
    log(`dist đóng băng (SNAP): files=${frozenBefore.fileCount} manifest=${frozenBefore.manifestSha256}`);
    server = await serve(SNAP);
    log("server lên", PORT, "snapshot", SNAP);
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "o3-chrome-"));
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
    cdp.proc = chrome; // P3: snapshot treo cần proc (mẫu O2)
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
    try { await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); } catch (e) { log("viewport override lỗi (tiếp tục):", e.message); }
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
    await sleep(5000);
    const discover = await cdp.eval(`(() => {
      const btns = [...document.querySelectorAll("button")].slice(0, 120).map((b) => ({ text: (b.textContent || "").trim().slice(0, 40), aria: b.getAttribute("aria-label") || "", cls: (b.className && b.className.toString ? b.className.toString() : "").slice(0, 60), title: b.getAttribute("title") || "" }));
      const canvases = [...document.querySelectorAll("canvas")].map((c) => { const r = c.getBoundingClientRect(); return { w: c.width, h: c.height, x: Math.round(r.x), y: Math.round(r.y), rw: Math.round(r.width), rh: Math.round(r.height), id: c.id || "", cls: (c.className || "").slice(0, 60) }; });
      const videos = [...document.querySelectorAll("video")].map((v) => ({ src: (v.currentSrc || v.src || "").slice(0, 60), ct: v.currentTime, paused: v.paused, seeking: v.seeking, rs: v.readyState }));
      const hooks = Object.keys(window).filter((k) => k.startsWith("__vcut") || k.startsWith("__r"));
      const tl = [...document.querySelectorAll("[class*=tl-],[class*=timeline],[class*=Timeline]")].slice(0, 40).map((e) => ({ cls: (e.className || "").slice(0, 80), tag: e.tagName }));
      const inputs = [...document.querySelectorAll("input")].slice(0, 40).map((e) => ({ type: e.type, cls: (e.className || "").slice(0, 60), val: String(e.value).slice(0, 20) }));
      return { title: document.title, rootText: (document.querySelector("#root")?.textContent || "").slice(0, 300), btns, canvases, videos, hooks, tl, inputs, bodyCls: document.body.className || "" };
    })()`);
    out.discover = discover;
    log("DISCOVER buttons:", JSON.stringify(discover.btns.slice(0, 40)));
    log("DISCOVER canvases:", JSON.stringify(discover.canvases));
    log("DISCOVER videos:", JSON.stringify(discover.videos));
    log("DISCOVER hooks:", JSON.stringify(discover.hooks));
    log("DISCOVER tl:", JSON.stringify(discover.tl.slice(0, 20)));
    out.steps.push("discover-ok");
    if (MODE === "MEASURE") {
      await measure(cdp, out);
      out.steps.push("measure-done");
    }
    ws.close();
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 500);
    log("LỖI:", out.error);
  } finally {
    try { chrome?.kill("SIGKILL"); } catch {}
    for (const p of loadProcs) try { p.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  }
  // S6: đối chiếu manifest SNAP trước/sau (chỉ khi đã tính được lúc đầu).
  if (frozenBefore) {
    const checked = verifyDistManifest(SNAP, frozenBefore);
    out.frozenDist = {
      validity: checked.valid ? "VALID" : "INVALID",
      valid: checked.valid,
      problems: checked.problems,
      distDir: path.resolve(SNAP),
      manifestBefore: frozenBefore.manifestSha256,
      manifestAfter: checked.manifest.manifestSha256,
      fileCountBefore: frozenBefore.fileCount,
      fileCountAfter: checked.manifest.fileCount,
      note: "SNAP là bản sao copy trước khi chạy (kiểu pipe); manifest trước/sau bắt trường hợp bản sao bị sửa giữa lúc đo.",
    };
    if (!checked.valid) {
      log(`FROZEN INVALID: ${checked.problems.join("; ")}`);
      if (!out.error) out.error = `frozen dist INVALID: ${checked.problems.join("; ")}`;
    }
  }
  const outPath = path.join("benchmarks/results/v32-o3-browser-discover.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  log("JSON:", outPath);
  process.exit(out.error ? 2 : 0);
}
main();
