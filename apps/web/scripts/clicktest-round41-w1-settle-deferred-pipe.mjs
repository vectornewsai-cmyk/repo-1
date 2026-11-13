// clicktest-round41-w1-settle-deferred-pipe.mjs — Đợt 41 luồng W1:
// bằng chứng browser cho nhánh HOÃN-DỌN của settle-drop (nợ đợt 40
// §5.5, V4 §5.1: khi prefetch settle đúng lúc decode cửa sổ đang bay,
// dropSettledPrefetchIfOff chain thử lại vào decodePromise thay vì
// evict ngay — trước đây chỉ có test thuần predicate
// shouldDropSettledPrefetch với decodeInFlight=true).
//
// Cách chạy (từ gốc repo; BẮT BUỘC vite preview, không dùng vite dev
// vì các luồng đợt 41 khác sửa file song song sẽ gây HMR reload —
// bài học V4):
//   1. cd apps/web && ../../node_modules/.bin/vite build
//   2. ../../node_modules/.bin/vite preview --port 5182 --strictPort
//   3. node apps/web/scripts/clicktest-round41-w1-settle-deferred-pipe.mjs [debug-port]
// Chrome headless mới (ms-playwright cache) + profile mới /tmp/w1-cdprof-41,
// app tải project mẫu như r6-clicktest / V4.
//
// Thiết kế bắt nhánh (khác V4: V4 tắt + pause ngay nên chỉ thấy nhánh
// dọn-ngay; ở đây KHÔNG pause, mà mở thêm một decode cửa sổ W2):
// - Setup như V4 S1: fixture 640x360 GOP90 90 s, seek gần cuối, phát
//   ngược tới khi running + prefetch > 0. Cổng chỉ mở khi decode phần
//   mềm >= 2× fps phát (60 fps), nên fixture phải vừa đủ dễ decode
//   để qua cổng, vừa đủ nặng (GOP 90 → cửa sổ decode GOP-aligned tới
//   ~165 frame) để cửa sổ decode kéo dài hàng trăm ms, đủ cho race.
// - Mỗi lượt: poll nhanh inFlightPrefetchWindows; khi >= 1 thì tắt
//   toggle NGAY bằng clickFast, rồi clickFast seek tới thời gian cách
//   playhead hiện tại 20 s (xa hơn 2 cửa sổ, chắc chắn chưa cache,
//   không trùng đoạn prefetch) để mở decode cửa sổ W2. KHÔNG pause:
//   vòng lặp preview vẫn tick nên mirror tươi liên tục.
// - Trace từng mẫu mirror (mỗi vòng 1 eval, không sleep dài) và phân
//   loại lượt:
//   + DEFERRED (bằng chứng cần): mẫu đầu tiên sau seek mà inFlight
//     1 → 0 (prefetch đã settle) NHƯNG decodeWindowInFlight vẫn true
//     VÀ settledPrefetchDroppedFrames chưa tăng VÀ cacheFrames không
//     sụt (không có evict nào xảy ra tại thời điểm settle).
//   + Lượt vô hiệu (thử lại): prefetch settle trước khi seek kịp mở
//     W2, hoặc W2 kết thúc trước khi prefetch settle — khi đó settled
//     tăng trong lúc decodeWindowInFlight=false, tức nhánh dọn-ngay
//     của V4, không phải nhánh hoãn.
// - Mẫu cuối = mẫu đầu tiên sau khi decodeWindowInFlight về false:
//   trạng thái cuối phải là uiStatus=off, prefetchFrames=0. settled
//   delta cuối được GHI NHẬN chứ không làm cổng PASS/FAIL tuyệt đối,
//   vì có một sự thật về thứ tự code phải ghi rõ (xem LIMITS W1 §3):
//   W2 tự nó evictExcept(keep=cửa sổ W2) trước khi trả về, nên nếu
//   W2 kết thúc sau prefetch settle thì frame prefetch có thể đã bị
//   chính evict của W2 dọn trước khi lần thử lại hoãn-dọn chạy — khi
//   đó settled delta cuối = 0 dù thời điểm dọn vẫn là "sau khi decode
//   xong". Cổng PASS của script này vì vậy là: DEFERRED quan sát được
//   + trạng thái cuối đúng; settled delta chỉ là dữ liệu kèm theo,
//   không được trích làm "số frame do lần thử lại dọn" khi delta = 0.
// - Giới hạn script: tối đa 8 lượt; mỗi lượt trace tối đa 30 s.
//
// Mỗi bước in PASS/FAIL kèm số đo; exit 1 khi không bắt được DEFERRED.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const DEBUG_PORT = Number(process.argv[2] || 9351);
const DEV_URL = process.env.W1_DEV_URL || "http://localhost:5182/";
const CHROME =
  process.env.W1_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/w1-cdprof-41";
const SCRATCH = "/tmp/round41-w1";
const FIX = path.join(SCRATCH, "w1-slow-360p-gop90-90s.mp4");
const FIX_NAME = path.basename(FIX);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
    return r.result.value;
  }
  async mouse(type, x, y, extra = {}) { return this.send("Input.dispatchMouseEvent", { type, x, y, ...extra }); }
  async click(x, y, pauseMs = 400) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    if (pauseMs) await sleep(pauseMs);
  }
  async clickFast(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
  }
  async clickEl(elJs, label) {
    await this.evalJs(`(() => { const el = ${elJs}; if (el && el.scrollIntoView) el.scrollIntoView({ block: "center" }); return true; })()`);
    await sleep(300);
    const info = await this.evalJs(`(() => { const el = ${elJs}; if (!el) return null; const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const top = document.elementFromPoint(cx, cy); return { x: cx, y: cy, inside: !!(top && (top === el || el.contains(top))), topCls: top ? (top.tagName + "." + top.className) : null }; })()`);
    if (!info) throw new Error(`không tìm thấy để click: ${label}`);
    if (!info.inside) throw new Error(`click ${label} bị che bởi ${info.topCls}`);
    await this.click(Math.round(info.x), Math.round(info.y));
  }
  async waitFor(fn, label, timeoutMs = 60000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn(); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const TIME_JS = `(() => { const el = document.querySelector('.time-display'); if (!el) return null; const parts = (el.textContent || '').split('/'); if (parts.length < 2) return null; const parse = (s) => { const a = s.trim().split(':'); if (a.length < 2) return null; const v = Number(a[0]) * 60 + Number(a[1]); return Number.isNaN(v) ? null : v; }; const cur = parse(parts[0]); const total = parse(parts[1]); if (cur === null || total === null) return null; return { cur, total }; })()`;
const STATUS_JS = `(() => { const m = window.__vcutReverseDecodeAheadStatus; const t = document.querySelector('.preview-decodeahead-toggle'); const b = document.querySelector('.preview-decodeahead-warn-badge'); return { toggle: t ? { text: t.textContent, status: t.dataset.status || null } : null, badge: b ? { text: b.textContent } : null, mirror: m || null }; })()`;
const MIRROR_JS = `window.__vcutReverseDecodeAheadStatus`;
const TOGGLE_EL = `document.querySelector('.preview-decodeahead-toggle')`;
const REVERSE_EL = `[...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Phát ngược')`;
const cardJs = (name) => `[...document.querySelectorAll('.media-card')].find((c) => (c.querySelector('.media-name')?.textContent || '').trim() === '${name}')`;
const cardAddJs = (name) => `${cardJs(name)}?.querySelector('.media-add')`;
const RULER_JS = `(() => { const el = document.querySelector('.tl-ruler'); if (!el) return null; const r = el.getBoundingClientRect(); const h = document.querySelector('.tl-playhead-handle'); const sc = document.querySelector('.tl-scroll'); return { x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight, handleLeft: h ? h.style.left : null, scrollLeft: sc ? sc.scrollLeft : null, scrollW: sc ? sc.scrollWidth : null }; })()`;

async function closeModalIfOpen(cdp) {
  const open = await cdp.evalJs(`!!document.querySelector('.modal-backdrop, .tour-card, .welcome-modal')`);
  if (!open) return false;
  await cdp.click(20, 20);
  await sleep(500);
  return true;
}
async function clickElRetry(cdp, elJs, label) {
  try { await cdp.clickEl(elJs, label); }
  catch (e) {
    if (!String(e.message || "").includes("modal")) throw e;
    await closeModalIfOpen(cdp);
    await sleep(500);
    await cdp.clickEl(elJs, label);
  }
}
async function importFile(cdp, filePath, fileName) {
  const doc = await cdp.send("DOM.getDocument", {});
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: "aside.mediabin input[type=\"file\"]" });
  if (!q.nodeId) throw new Error("không tìm thấy file input của MediaBin");
  await cdp.send("DOM.setFileInputFiles", { files: [filePath], nodeId: q.nodeId });
  await cdp.waitFor(async () => { const f = await cdp.evalJs(`!!${cardJs(fileName)}`); return f || null; }, `media card ${fileName}`, 120000);
}
async function centerOf(cdp, elJs, label) {
  const info = await cdp.evalJs(`(() => { const el = ${elJs}; if (!el) return null; const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const top = document.elementFromPoint(cx, cy); return { x: cx, y: cy, inside: !!(top && (top === el || el.contains(top))), topCls: top ? (top.tagName + "." + top.className) : null }; })()`);
  if (!info) throw new Error(`không tìm thấy: ${label}`);
  if (!info.inside) throw new Error(`${label} bị che bởi ${info.topCls}`);
  return { x: Math.round(info.x), y: Math.round(info.y) };
}
// Cuộn .tl-scroll cho tới khi điểm thời gian mục tiêu vào viewport.
// Chỉ dùng TRƯỚC khi bắt prefetch (không dùng trong cửa sổ race).
async function scrollTargetIntoView(cdp, target, pps) {
  const sc = `document.querySelector('.tl-scroll')`;
  for (let i = 0; i < 4; i++) {
    const rect = await cdp.evalJs(RULER_JS);
    const x = Math.round(rect.x + target * pps);
    if (x > 100 && x < rect.vw - 100) return { x, y: Math.round(rect.y + rect.h / 2), iters: i };
    await cdp.evalJs(`(() => { const el = ${sc}; el.scrollLeft += (${x} - window.innerWidth / 2); return true; })()`);
    await sleep(150);
  }
  throw new Error(`không đưa được thời gian ${target} vào viewport sau 4 lần cuộn`);
}
async function playReverseAndWaitForMovement(cdp, timeoutMs = 30000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const t0 = await cdp.evalJs(TIME_JS);
    try { await cdp.clickEl(REVERSE_EL, "nút Phát ngược"); }
    catch (e) {
      if (!String(e.message || "").includes("modal")) throw e;
      await closeModalIfOpen(cdp);
      await sleep(500);
      await cdp.clickEl(REVERSE_EL, "nút Phát ngược (lại sau khi đóng modal)");
    }
    try {
      return await cdp.waitFor(async () => {
        const t = await cdp.evalJs(TIME_JS);
        if (!t || !t0) return null;
        return Math.abs(t.cur - t0.cur) >= 2.6 ? t : null;
      }, "playhead ngược chạy ≥2,6 s", timeoutMs);
    } catch { /* thử bấm lại */ }
  }
  return null;
}
async function waitForRunningPrefetch(cdp, passes = 4) {
  let last = null;
  for (let pass = 0; pass < passes; pass++) {
    await playReverseAndWaitForMovement(cdp);
    try {
      return await cdp.waitFor(async () => {
        const s = await cdp.evalJs(STATUS_JS);
        last = s;
        return (s.mirror?.uiStatus === "running" && (s.mirror?.prefetchFrames || 0) > 0) ? s : null;
      }, "decode-ahead running + prefetch > 0", 20000);
    } catch { /* lượt này chưa mở -> phát lại */ }
  }
  return null;
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  if (!fs.existsSync(FIX)) throw new Error(`không thấy fixture tại ${FIX} (tạo bằng ffmpeg trước, xem header LIMITS)`);
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${PROFILE}`, "--no-sandbox", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  const kill = () => { try { chrome.kill("SIGKILL"); } catch {} };
  process.on("exit", kill);
  try {
    let pages = null;
    for (let i = 0; i < 60 && !pages; i++) { try { pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); } catch { await sleep(500); } }
    const pageTarget = (pages || []).find((p) => p.type === "page");
    if (!pageTarget) throw new Error("không tìm thấy target type=page");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => { const t = await cdp.evalJs(`!!document.querySelector('.preview-decodeahead-toggle')`); return t || null; }, "nút toggle decode-ahead", 90000);
    await cdp.waitFor(async () => { const gone = !(await cdp.evalJs(`!!document.querySelector('.splash')`)); return gone || null; }, "splash tắt", 120000);
    if (await cdp.evalJs(`!!document.querySelector('.modal-backdrop, .tour-card, .welcome-modal')`)) {
      await cdp.click(20, 20); await sleep(500);
    }
    record("T0 app + toggle", true, `time=${JSON.stringify(await cdp.evalJs(TIME_JS))}`);

    await importFile(cdp, FIX, FIX_NAME);
    await closeModalIfOpen(cdp);
    await clickElRetry(cdp, cardAddJs(FIX_NAME), "nút ＋ Thêm của fixture W1");
    await sleep(1000);
    // Hiệu chuẩn pxPerSec như V4 (click x = rect.x + 300 rồi đọc handle).
    const rect0 = await cdp.evalJs(RULER_JS);
    await cdp.click(Math.round(rect0.x + 300), Math.round(rect0.y + rect0.h / 2));
    const tCalib = await cdp.evalJs(TIME_JS);
    const rectCalib = await cdp.evalJs(RULER_JS);
    const handlePx = parseFloat(rectCalib.handleLeft || "0");
    const pps = tCalib && tCalib.cur > 0 ? handlePx / tCalib.cur : NaN;
    const ppsOk = Number.isFinite(pps) && pps > 0;
    record("CALIB pxPerSec từ playhead-handle", ppsOk,
      `click x=${Math.round(rect0.x + 300)} → cur=${tCalib?.cur} handleLeft=${rectCalib.handleLeft} pps=${pps}`);
    if (!ppsOk) throw new Error("không hiệu chuẩn được pxPerSec");
    const ppsUse = pps;

    // Bật đường reverse WebCodecs (opt-in, như V4 S1) rồi bật toggle.
    await cdp.evalJs(`window.__vcutReverseWebcodecs = true;`);
    let st0 = await cdp.evalJs(STATUS_JS);
    if (st0.mirror?.uiStatus === "off" || !st0.mirror) {
      await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật)");
      await sleep(800);
      st0 = await cdp.evalJs(STATUS_JS);
    }
    // Kiểm tra trường mirror mới của W1 có mặt (dist phải build từ code mới).
    const hasNewFields = st0.mirror && ("decodeWindowInFlight" in st0.mirror) && ("cacheFrames" in st0.mirror);
    record("MIRROR có trường W1 (decodeWindowInFlight/cacheFrames)", !!hasNewFields,
      `mirror keys=${st0.mirror ? Object.keys(st0.mirror).join(",") : "null"}`);
    if (!hasNewFields) throw new Error("dist cũ: mirror thiếu trường W1, build lại rồi chạy tiếp");

    // Seek gần cuối rồi phát ngược tới running + prefetch > 0.
    const tEnd = await cdp.evalJs(TIME_JS);
    const total = tEnd?.total || 90;
    await scrollTargetIntoView(cdp, Math.max(1, total - 1.5), ppsUse);
    {
      const rect = await cdp.evalJs(RULER_JS);
      const x = Math.round(rect.x + Math.max(1, total - 1.5) * ppsUse);
      await cdp.click(x, Math.round(rect.y + rect.h / 2));
    }
    const running = await waitForRunningPrefetch(cdp, 4);
    record("S-setup decode-ahead running + prefetch > 0", !!running,
      running ? `prefetch=${running.mirror?.prefetchFrames} fps=${running.mirror?.measurementFps} res=${running.mirror?.measurementResolution} badge=${JSON.stringify(running.badge?.text)}`
        : `không đạt running sau 4 lượt; mirror cuối=${JSON.stringify((await cdp.evalJs(STATUS_JS)).mirror)}`);
    if (!running) throw new Error("setup không đạt running — không thể bắt nhánh hoãn-dọn");

    // Vòng bắt nhánh hoãn-dọn, tối đa 8 lượt.
    let deferredPass = false;
    let deferredDetail = "chưa chạy lượt nào";
    let finalSample = null;
    let attemptsLog = [];
    for (let attempt = 1; attempt <= 8 && !deferredPass; attempt++) {
      if (attempt > 1) {
        // Bật lại toggle + phát ngược tới running cho lượt mới.
        const cur = await cdp.evalJs(STATUS_JS);
        if (cur.mirror?.uiStatus === "off") {
          await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật lại)");
          await sleep(800);
        }
        const r2 = await waitForRunningPrefetch(cdp, 3);
        if (!r2) { attemptsLog.push(`lượt ${attempt}: không đạt lại running`); continue; }
      }
      // Mục tiêu seek: cách playhead 20 s (xa hơn 2 cửa sổ), ưu tiên
      // tiến, không đủ chỗ thì lùi. Cuộn TRƯỚC khi poll bắt prefetch.
      const curT = await cdp.evalJs(TIME_JS);
      const cur = curT?.cur ?? 45;
      const target = (cur + 20 <= total - 2) ? cur + 20 : cur - 20;
      if (target < 1 || target > total - 1) { attemptsLog.push(`lượt ${attempt}: không có mục tiêu seek hợp lệ (cur=${cur})`); continue; }
      try { await scrollTargetIntoView(cdp, target, ppsUse); }
      catch (e) { attemptsLog.push(`lượt ${attempt}: cuộn mục tiêu thất bại: ${e.message}`); continue; }
      const settledAtSetup = (await cdp.evalJs(STATUS_JS)).mirror?.settledPrefetchDroppedFrames ?? 0;
      // Poll nhanh bắt prefetch đang bay.
      let caught = null;
      const poll0 = Date.now();
      while (Date.now() - poll0 < 90000) {
        const m = await cdp.evalJs(MIRROR_JS);
        if ((m?.inFlightPrefetchWindows ?? 0) >= 1) { caught = { inFlight: m.inFlightPrefetchWindows, ms: Date.now() - poll0, cache: m.cacheFrames ?? -1, settled: m.settledPrefetchDroppedFrames ?? -1 }; break; }
        await sleep(5);
      }
      if (!caught) { attemptsLog.push(`lượt ${attempt}: không thấy inFlight>0 trong 90 s`); continue; }
      // Tắt NGAY + seek NGAY bằng clickFast (đo lại tọa độ: chỉ 2 eval).
      const tg = await centerOf(cdp, TOGGLE_EL, "toggle decode-ahead");
      const rectS = await cdp.evalJs(RULER_JS);
      const seekX = Math.round(rectS.x + target * ppsUse);
      const seekY = Math.round(rectS.y + rectS.h / 2);
      const topAtSeek = await cdp.evalJs(`(() => { const t = document.elementFromPoint(${seekX}, ${seekY}); return t ? (t.tagName + "." + t.className) : null; })()`);
      if (topAtSeek !== "DIV.tl-ruler") {
        attemptsLog.push(`lượt ${attempt}: điểm seek không trúng ruler (top=${topAtSeek}, x=${seekX}) — playhead/scroll đã trôi, thử lại`);
        continue;
      }
      const tToggle = Date.now();
      await cdp.clickFast(tg.x, tg.y);
      await cdp.clickFast(seekX, seekY);
      const tSeek = Date.now();
      // Trace sau seek: mỗi vòng 1 eval mirror.
      const trace = [];
      let w2Seen = false;
      let outcome = "timeout";
      const trace0 = Date.now();
      while (Date.now() - trace0 < 30000) {
        const m = await cdp.evalJs(MIRROR_JS);
        const s = {
          t: Date.now() - tSeek,
          inFlight: m?.inFlightPrefetchWindows ?? -1,
          settled: m?.settledPrefetchDroppedFrames ?? -1,
          winInFlight: m?.decodeWindowInFlight ?? false,
          cache: m?.cacheFrames ?? -1,
          prefetch: m?.prefetchFrames ?? -1,
          ui: m?.uiStatus ?? "?",
        };
        trace.push(s);
        if (s.winInFlight) w2Seen = true;
        // Đã thấy W2 rồi W2 kết thúc → mẫu cuối là mẫu này.
        if (w2Seen && !s.winInFlight) { outcome = "w2-ended"; break; }
        await sleep(5);
      }
      // Phân loại từ trace.
      const settledBefore = settledAtSetup;
      // Mẫu settle đầu tiên sau seek: inFlight về 0 (prefetch đã settle).
      // Mẫu trace đầu tiên đã có thể settle xong (settle xảy ra giữa
      // click seek và eval đầu): khi đó đối chiếu với mẫu ảo lúc bắt
      // prefetch (inFlight>=1, settled/cache lúc bắt) — nếu settle xảy
      // ra trước khi W2 kịp bắt đầu thì settled đã tăng ngay rồi, nên
      // settled chưa tăng + winInFlight=true ở mẫu này vẫn là hoãn.
      let settleIdx = trace.findIndex((s, i) => i > 0 && s.inFlight === 0 && trace[i - 1].inFlight >= 1);
      let virtualPrev = null;
      if (settleIdx < 0 && trace.length > 0 && trace[0].inFlight === 0) {
        settleIdx = 0;
        virtualPrev = { inFlight: caught.inFlight, settled: caught.settled, cache: caught.cache };
      }
      let cls = "";
      if (settleIdx < 0) {
        cls = `không thấy prefetch settle trong trace (${trace.length} mẫu, w2Seen=${w2Seen}, outcome=${outcome})`;
      } else {
        const ss = trace[settleIdx];
        const prev = virtualPrev || trace[settleIdx - 1];
        const deferredHere = ss.winInFlight === true && ss.settled === prev.settled && ss.cache >= prev.cache;
        const finalS = outcome === "w2-ended" ? trace[trace.length - 1] : null;
        cls = `settle tại +${ss.t} ms: winInFlight=${ss.winInFlight} settled ${settledBefore}→${ss.settled} cache ${prev.cache}→${ss.cache} (inFlight ${prev.inFlight}→0); ` +
          `deferredHere=${deferredHere}; mẫu cuối=${finalS ? `+${finalS.t} ms winInFlight=${finalS.winInFlight} settled=${finalS.settled} cache=${finalS.cache} ui=${finalS.ui} prefetch=${finalS.prefetch}` : "chưa có (W2 chưa kết thúc trong 30 s)"}`;
        if (deferredHere && finalS && finalS.ui === "off" && finalS.prefetch === 0) {
          deferredPass = true;
          finalSample = finalS;
          deferredDetail = `lượt ${attempt}: bắt inFlight=${caught.inFlight} sau ${caught.ms} ms poll; toggle→seek trong ${tSeek - tToggle} ms; ${cls}; settled delta cuối=${finalS.settled - settledBefore}`;
          writeFileEpermRetry(path.join(SCRATCH, "w1-trace.json"), JSON.stringify({ attempt, target, pps: ppsUse, settledBefore, trace }, null, 2));
        }
      }
      attemptsLog.push(`lượt ${attempt}: ${cls}`);
      if (!deferredPass) {
        // Lượt vô hiệu: pause để trạng thái ổn định rồi lượt sau bật lại.
        try { const rv = await centerOf(cdp, REVERSE_EL, "nút Phát ngược"); await cdp.clickFast(rv.x, rv.y); } catch {}
        await sleep(500);
      }
    }
    for (const l of attemptsLog) console.log(`  [attempt] ${l}`);
    record("W1 nhánh hoãn-dọn bắt được trên browser (settle trong lúc decode bay, chưa dọn; cuối off + prefetch 0)", deferredPass, deferredDetail);
  } finally { kill(); }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== W1 clicktest: ${results.length - failed.length}/${results.length} pass ==`);
  if (failed.length > 0) process.exitCode = 1;
}
main().catch((e) => { console.error(`FATAL: ${e.message}`); process.exitCode = 1; });
