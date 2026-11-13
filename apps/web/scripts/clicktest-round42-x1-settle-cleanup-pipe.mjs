// clicktest-round42-x1-settle-cleanup-pipe.mjs — Đợt 42 luồng X1:
// bằng chứng browser HEADED cho TÁC NHÂN DỌN của lần thử lại trong
// settle-drop (nợ đợt 41 §5.2, LIMITS W1 §0.2/§3).
//
// Vấn đề W1 để lại: trong race tự nhiên, cửa sổ W2 bình thường tự
// evictExcept(keep = cửa sổ W2) TRƯỚC khi decodePromise resolve, nên
// lần thử lại hoãn-dọn chain sau đó tìm thấy 0 frame → counter
// settledPrefetchDroppedFrames KHÔNG tăng. Muốn counter tăng cần W2
// suy biến: kết thúc mà KHÔNG evict. Script này tạo đúng trường hợp
// đó bằng fixture có 1 GOP hỏng (IDR của GOP chứa 60 s bị zero toàn
// bộ packet): cửa sổ decode chứa GOP hỏng đó trả 0 frame → controller
// về unsupported và return false TRƯỚC khối evict — nên lần thử lại
// (chain vào decodePromise của W2) là tác nhân duy nhất dọn frame
// prefetch, và counter TĂNG là bằng chứng trực tiếp cho tác nhân đó.
//
// Cách chạy (từ gốc repo; script TỰ lo Xvfb + Chrome headed, chỉ cần
// preview đang chạy — build snapshot riêng để không xung đột dist với
// các luồng đợt 42 khác):
//   1. cp -r apps/web <scratch>/app-snapshot (trừ node_modules, dist)
//      + ln -s <repo>/apps/web/node_modules <scratch>/app-snapshot/
//   2. cd <scratch>/app-snapshot && ../../repo-1/node_modules/.bin/vite build
//   3. ../../repo-1/node_modules/.bin/vite preview --port 5183 --strictPort
//   4. node apps/web/scripts/clicktest-round42-x1-settle-cleanup-pipe.mjs [debug-port]
// Biến môi trường: X1_DEV_URL (mặc định http://localhost:5183/),
// X1_FIX (mặc định ~/workspace/tmp-round42-x1/x1-corrupt-gop60-...mp4),
// X1_CHROME (mặc định ms-playwright chromium-1248).
//
// Luồng mỗi lần thử (shot): setup phát ngược tới running + prefetch > 0
// (như W1, fixture hỏng nhưng vùng setup gần cuối 88,5 s là GOP lành),
// cuộn mục tiêu hỏng 62,7 s vào viewport TRƯỚC khi poll, poll bắt
// prefetch đang bay, canh cache tăng tới ~60% prefetchFrames rồi tắt
// toggle + seek NGAY tới 62,7 s (cửa sổ decode của nó nằm trọn trong
// GOP hỏng: present slice 75 frame = 2,5 s, [60,2 .. 62,7] trong GOP
// [60,63), decodeFrom = IDR hỏng 60,0 s) để mở W2 suy biến, rồi trace
// mirror mỗi ~5 ms và phân loại:
//   + SUCCESS (bằng chứng cần): mẫu settle đầu tiên có winInFlight =
//     true VÀ settled chưa tăng VÀ cache không sụt (nhánh hoãn, như
//     W1), rồi mẫu cuối (W2 kết thúc, winInFlight về false) có settled
//     TĂNG ≥ 1, uiStatus = off, prefetchFrames = 0. Vì W2 hỏng không
//     evict gì cả, mức tăng counter này CHỈ có thể tới từ lần thử lại.
//   + INVALID-immediate: settle trước khi W2 kịp bắt đầu
//     (winInFlight = false tại mẫu settle) — nhánh dọn-ngay của V4.
//   + INVALID-competing: W2 là cửa sổ lành (playhead trôi qua biên
//     cửa sổ trước khi seek tới) nên tự evict, lần thử lại về 0.
//   + INVALID-settled-early / timeout: prefetch settle trước khi tắt
//     toggle, hoặc không thấy settle trong 30 s.
// Sau mỗi shot hỏng mà controller còn sống thì bật lại toggle + phát
// ngược tới running để thử lại trên cùng trang; sau shot W2 hỏng
// (controller về unsupported) thì reload trang để có controller mới.
// Tối đa 8 lần tải trang × 4 shot. Mỗi bước in PASS/FAIL kèm số đo;
// exit 1 khi không bắt được SUCCESS.
//
// Giới hạn trung thực (xem LIMITS X1): fixture hỏng là trường hợp suy
// biến có chủ đích, KHÔNG phải đường phát ngược bình thường — nó chứng
// minh lần thử lại CÓ THỂ dọn và counter tăng, không chứng minh lần
// thử lại thường dọn trong phát ngược bình thường (ở đó evict của W2
// đã dọn thay, như W1 đã kết luận).
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const DEBUG_PORT = Number(process.argv[2] || 9352);
const DEV_URL = process.env.X1_DEV_URL || "http://localhost:5183/";
const SCRATCH = process.env.X1_SCRATCH || path.join(os.homedir(), "workspace/tmp-round42-x1");
const FIX = process.env.X1_FIX || path.join(SCRATCH, "x1-corrupt-gop60-360p-gop90-90s.mp4");
const FIX_NAME = path.basename(FIX);
const CHROME =
  process.env.X1_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = path.join(SCRATCH, "cdprof-x1");
const SETUP_SEEK = 88.5;
const CORRUPT_SEEK = 62.7;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function loadavg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; }
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

// Setup 1 trang: import + add + calib + bật reverse + running.
// Trả { pps, total } hoặc null khi setup thất bại.
async function setupPage(cdp) {
  await cdp.send("Page.navigate", { url: DEV_URL });
  await cdp.waitFor(async () => { const t = await cdp.evalJs(`!!document.querySelector('.preview-decodeahead-toggle')`); return t || null; }, "nút toggle decode-ahead", 90000);
  await cdp.waitFor(async () => { const gone = !(await cdp.evalJs(`!!document.querySelector('.splash')`)); return gone || null; }, "splash tắt", 120000);
  if (await cdp.evalJs(`!!document.querySelector('.modal-backdrop, .tour-card, .welcome-modal')`)) {
    await cdp.click(20, 20); await sleep(500);
  }
  await importFile(cdp, FIX, FIX_NAME);
  await closeModalIfOpen(cdp);
  await clickElRetry(cdp, cardAddJs(FIX_NAME), "nút ＋ Thêm của fixture X1");
  await sleep(1000);
  const rect0 = await cdp.evalJs(RULER_JS);
  await cdp.click(Math.round(rect0.x + 300), Math.round(rect0.y + rect0.h / 2));
  const tCalib = await cdp.evalJs(TIME_JS);
  const rectCalib = await cdp.evalJs(RULER_JS);
  const handlePx = parseFloat(rectCalib.handleLeft || "0");
  const pps = tCalib && tCalib.cur > 0 ? handlePx / tCalib.cur : NaN;
  if (!Number.isFinite(pps) || pps <= 0) return null;
  await cdp.evalJs(`window.__vcutReverseWebcodecs = true;`);
  let st0 = await cdp.evalJs(STATUS_JS);
  if (st0.mirror?.uiStatus === "off" || !st0.mirror) {
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật)");
    await sleep(800);
    st0 = await cdp.evalJs(STATUS_JS);
  }
  if (!st0.mirror || !("decodeWindowInFlight" in st0.mirror) || !("cacheFrames" in st0.mirror)) return null;
  const tEnd = await cdp.evalJs(TIME_JS);
  const total = tEnd?.total || 90;
  await scrollTargetIntoView(cdp, SETUP_SEEK, pps);
  {
    const rect = await cdp.evalJs(RULER_JS);
    const x = Math.round(rect.x + SETUP_SEEK * pps);
    await cdp.click(x, Math.round(rect.y + rect.h / 2));
  }
  const running = await waitForRunningPrefetch(cdp, 4);
  if (!running) return null;
  return { pps, total, setupMirror: running.mirror };
}

let chromeProc = null;
let xvfbProc = null;
let cdpGlobal = null;
function killAll() {
  try { cdpGlobal?.ws?.close(); } catch {}
  try { chromeProc?.kill("SIGKILL"); } catch {}
  try { xvfbProc?.kill("SIGKILL"); } catch {}
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  if (!fs.existsSync(FIX)) throw new Error(`không thấy fixture tại ${FIX}`);
  console.log(`loadavg lúc bắt đầu: ${loadavg()}`);
  // Xvfb: thử các display ít đụng với luồng khác (:99/:97/:96 đã có
  // luồng khác dùng theo tiền lệ) rồi mới tới :99.
  let xvfb = null;
  let display = process.env.DISPLAY || null;
  if (!display) {
    for (const num of [94, 93, 92, 91, 99]) {
      xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
      await sleep(800);
      if (xvfb.exitCode === null) { display = `:${num}`; break; }
      xvfb = null;
    }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  xvfbProc = xvfb;
  console.log(`xvfb: DISPLAY=${display} (headed thật, không cờ --headless)`);
  fs.rmSync(PROFILE, { recursive: true, force: true });
  // Bài học lần chạy đầu: Chrome headed KHÔNG --disable-gpu bị treo
  // khởi động trên Xvfb (tiến trình sống nhưng /json/list không trả
  // gì sau 30 s); công thức headed đã chứng minh của luồng X2 là
  // --disable-gpu + --no-first-run + --force-device-scale-factor=1.
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "x1-chrome.log"), "w");
  const chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--force-device-scale-factor=1", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display } });
  chromeProc = chrome;
  process.on("exit", killAll);
  // Chờ /json/list trả JSON có target page THẬT (không chỉ fetch
  // thành công): lần đầu list rỗng vì chrome treo GPU đã làm script
  // chết oan sau 30 s trong khi tiến trình chrome vẫn sống.
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      pageTarget = (pages || []).find((p) => p.type === "page") || null;
    } catch { /* chrome chưa lên */ }
    if (!pageTarget) await sleep(500);
  }
  if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s (xem x1-chrome.log)");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  cdpGlobal = cdp;
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
  record("T0 headed chrome + Xvfb", true, `DISPLAY=${display} debugPort=${DEBUG_PORT}`);

  let success = null;
  const shotLog = [];
  try {
    for (let page = 1; page <= 8 && !success; page++) {
      const setup = await setupPage(cdp).catch((e) => { console.log(`  [setup trang ${page}] lỗi: ${e.message}`); return null; });
      if (!setup) { shotLog.push(`trang ${page}: setup thất bại`); continue; }
      record(`S-setup trang ${page} (running + prefetch > 0)`, true,
        `pps=${setup.pps} prefetch=${setup.setupMirror?.prefetchFrames} fps=${setup.setupMirror?.measurementFps} res=${setup.setupMirror?.measurementResolution} badge=${JSON.stringify((await cdp.evalJs(STATUS_JS)).badge?.text)}`);
      const { pps, total } = setup;
      for (let shot = 1; shot <= 4 && !success; shot++) {
        if (shot > 1) {
          // Bật lại toggle + phát ngược tới running cho shot mới.
          const cur = await cdp.evalJs(STATUS_JS);
          if (cur.mirror?.uiStatus === "off") {
            await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật lại)");
            await sleep(800);
          }
          const r2 = await waitForRunningPrefetch(cdp, 3);
          if (!r2) { shotLog.push(`trang ${page} shot ${shot}: không đạt lại running (controller có thể đã chết sau W2 hỏng) → tải lại trang`); break; }
        }
        // Cuộn mục tiêu hỏng vào viewport TRƯỚC khi poll bắt prefetch.
        try { await scrollTargetIntoView(cdp, CORRUPT_SEEK, pps); }
        catch (e) { shotLog.push(`trang ${page} shot ${shot}: cuộn mục tiêu thất bại: ${e.message}`); continue; }
        // Poll nhanh bắt prefetch đang bay.
        let caught = null;
        const poll0 = Date.now();
        while (Date.now() - poll0 < 90000) {
          const m = await cdp.evalJs(MIRROR_JS);
          if ((m?.inFlightPrefetchWindows ?? 0) >= 1) {
            caught = { inFlight: m.inFlightPrefetchWindows, cache: m.cacheFrames ?? -1, settled: m.settledPrefetchDroppedFrames ?? -1, prefetchSize: m.prefetchFrames ?? 0, ms: Date.now() - poll0 };
            break;
          }
          await sleep(5);
        }
        if (!caught) { shotLog.push(`trang ${page} shot ${shot}: không thấy inFlight>0 trong 90 s`); continue; }
        // Canh: chờ cache tăng tới ~60% prefetchSize (prefetch sắp xong)
        // hoặc cache đứng yên 250 ms (đoạn còn lại toàn frame trùng) hoặc
        // quá 8 s; nếu prefetch settle trước khi tắt thì shot vô hiệu.
        let aim = "timeout-8s";
        let lastCache = caught.cache;
        let lastGrowAt = Date.now();
        const aim0 = Date.now();
        let settledEarly = false;
        while (Date.now() - aim0 < 8000) {
          const m = await cdp.evalJs(MIRROR_JS);
          if ((m?.inFlightPrefetchWindows ?? 0) < 1) { settledEarly = true; break; }
          const c = m.cacheFrames ?? -1;
          if (c > lastCache) { lastCache = c; lastGrowAt = Date.now(); }
          if (caught.prefetchSize > 0 && c >= caught.cache + 0.6 * caught.prefetchSize) { aim = "cache-60pct"; break; }
          if (Date.now() - lastGrowAt >= 250) { aim = "cache-stall-250ms"; break; }
          await sleep(5);
        }
        if (settledEarly) { shotLog.push(`trang ${page} shot ${shot}: prefetch settle trước khi tắt toggle (inFlight về 0 lúc canh) → vô hiệu`); continue; }
        const preToggle = await cdp.evalJs(MIRROR_JS);
        if ((preToggle?.inFlightPrefetchWindows ?? 0) < 1) { shotLog.push(`trang ${page} shot ${shot}: prefetch settle ngay trước toggle → vô hiệu`); continue; }
        // Tắt NGAY + seek NGAY bằng clickFast.
        const tg = await centerOf(cdp, TOGGLE_EL, "toggle decode-ahead");
        const rectS = await cdp.evalJs(RULER_JS);
        const seekX = Math.round(rectS.x + CORRUPT_SEEK * pps);
        const seekY = Math.round(rectS.y + rectS.h / 2);
        const topAtSeek = await cdp.evalJs(`(() => { const t = document.elementFromPoint(${seekX}, ${seekY}); return t ? (t.tagName + "." + t.className) : null; })()`);
        if (topAtSeek !== "DIV.tl-ruler") {
          shotLog.push(`trang ${page} shot ${shot}: điểm seek không trúng ruler (top=${topAtSeek}) → vô hiệu`);
          continue;
        }
        const tToggle = Date.now();
        await cdp.clickFast(tg.x, tg.y);
        await cdp.clickFast(seekX, seekY);
        const tSeek = Date.now();
        // Trace sau seek.
        const trace = [];
        let w2Seen = false;
        let outcome = "timeout-30s";
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
          if (w2Seen && !s.winInFlight) { outcome = "w2-ended"; break; }
          await sleep(5);
        }
        // Phân loại.
        let settleIdx = trace.findIndex((s, i) => i > 0 && s.inFlight === 0 && trace[i - 1].inFlight >= 1);
        let prevForSettle = null;
        if (settleIdx < 0 && trace.length > 0 && trace[0].inFlight === 0) { settleIdx = 0; prevForSettle = { settled: preToggle?.settledPrefetchDroppedFrames ?? -1, cache: preToggle?.cacheFrames ?? -1, inFlight: preToggle?.inFlightPrefetchWindows ?? -1 }; }
        else if (settleIdx >= 0) { prevForSettle = trace[settleIdx - 1]; }
        const finalS = outcome === "w2-ended" ? trace[trace.length - 1] : null;
        let cls = "";
        let isSuccess = false;
        if (settleIdx < 0) {
          cls = `không thấy prefetch settle trong trace (${trace.length} mẫu, w2Seen=${w2Seen}, outcome=${outcome})`;
        } else {
          const ss = trace[settleIdx];
          const settledAtSettleUnchanged = ss.settled === prevForSettle.settled;
          const cacheNotDroppedAtSettle = ss.cache >= prevForSettle.cache;
          const deferredHere = ss.winInFlight === true && settledAtSettleUnchanged && cacheNotDroppedAtSettle;
          const settledDelta = finalS ? finalS.settled - ss.settled : null;
          const cacheDrop = finalS ? ss.cache - finalS.cache : null;
          cls = `aim=${aim} toggle→seek ${tSeek - tToggle} ms; settle tại +${ss.t} ms: winInFlight=${ss.winInFlight} settled ${prevForSettle.settled}→${ss.settled} cache ${prevForSettle.cache}→${ss.cache} deferredHere=${deferredHere}; ` +
            `cuối=${finalS ? `+${finalS.t} ms winInFlight=${finalS.winInFlight} settled=${finalS.settled} (delta=${settledDelta}) cache=${finalS.cache} (sụt=${cacheDrop}) ui=${finalS.ui} prefetch=${finalS.prefetch}` : "chưa có (W2 chưa kết thúc trong 30 s)"}`;
          if (deferredHere && finalS && (settledDelta ?? 0) >= 1 && finalS.ui === "off" && finalS.prefetch === 0) {
            isSuccess = true;
            success = {
              page, shot, aim, toggleSeekMs: tSeek - tToggle,
              settleAtMs: ss.t, finalAtMs: finalS.t,
              settledBefore: prevForSettle.settled, settledAtSettle: ss.settled, settledFinal: finalS.settled, settledDelta,
              cacheBefore: prevForSettle.cache, cacheAtSettle: ss.cache, cacheFinal: finalS.cache, cacheDrop,
              cacheAnomaly: cacheDrop !== settledDelta,
              uiFinal: finalS.ui, prefetchFinal: finalS.prefetch,
              badgeFinal: (await cdp.evalJs(STATUS_JS)).badge?.text ?? null,
              trace,
            };
            writeFileEpermRetry(path.join(SCRATCH, "x1-success-trace.json"), JSON.stringify(success, null, 2));
          }
        }
        shotLog.push(`trang ${page} shot ${shot}: ${cls}`);
        if (isSuccess) break;
        // Shot hỏng: nếu trace cho thấy W2 hỏng đã chạy (controller chết)
        // thì vòng re-arm sẽ thất bại và tải lại trang ở shot sau.
        try { const rv = await centerOf(cdp, REVERSE_EL, "nút Phát ngược"); await cdp.clickFast(rv.x, rv.y); } catch {}
        await sleep(500);
      }
    }
  } finally { killAll(); }
  for (const l of shotLog) console.log(`  [shot] ${l}`);
  console.log(`loadavg lúc kết thúc: ${loadavg()}`);
  record("X1 lần thử lại hoãn-dọn dọn được frame trên browser headed (counter tăng)", !!success,
    success ? `trang ${success.page} shot ${success.shot} aim=${success.aim} toggle→seek ${success.toggleSeekMs} ms; settle +${success.settleAtMs} ms, cuối +${success.finalAtMs} ms; settled ${success.settledBefore}→${success.settledFinal} (delta=${success.settledDelta}); cache ${success.cacheAtSettle}→${success.cacheFinal} (sụt=${success.cacheDrop}${success.cacheAnomaly ? " — LỆCH so với delta, xem LIMITS" : ""}); ui=${success.uiFinal} prefetch=${success.prefetchFinal} badge=${JSON.stringify(success.badgeFinal)}`
      : "không bắt được SUCCESS sau tối đa 8 trang × 4 shot");
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== X1 clicktest: ${results.length - failed.length}/${results.length} pass ==`);
  return failed.length > 0 ? 1 : 0;
}
// Thoát dứt khoát: lần chạy đầu chỉ set process.exitCode trong catch
// nhưng WebSocket CDP còn mở giữ event loop nên tiến trình treo mãi
// (log FATAL đã in nhưng shell không kết thúc, chrome còn sống).
main().then((code) => { killAll(); process.exit(code); }).catch((e) => { console.error(`FATAL: ${e.message}`); killAll(); process.exit(1); });
