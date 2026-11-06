// clicktest-round40-v4-settle-ruler-pipe.mjs — Click-test đợt 40 luồng V4:
// (a) settle-drop của prefetch khi tắt decode-ahead giữa chừng — bằng
// chứng browser còn thiếu từ đợt 39 T4 (lượt 3 đọc settledDropped=0
// vì prefetch đã settle trước lúc tắt, và chỉ đọc 3 s sau khi tắt);
// (b) seekRuler (click ruler) — T4 báo "không có tác dụng" (0 → 0).
//
// Cách chạy (từ gốc repo; BẮT BUỘC vite preview, không dùng vite dev
// vì các luồng đợt 40 khác sửa file song song sẽ gây HMR reload — bài
// học T4 lượt 1):
//   1. cd apps/web && ../../node_modules/.bin/vite build
//   2. ../../node_modules/.bin/vite preview --port 5181 --strictPort
//   3. node apps/web/scripts/clicktest-round40-v4-settle-ruler-pipe.mjs [debug-port]
// Chrome headless mới (ms-playwright cache) + profile mới /tmp/v4-cdprof-40
// nên không có autosave: app tải project mẫu như r6-clicktest.
//
// Điểm mới so với T4 (đây chính là cách bắt được khoảnh khắc hiếm):
// - S1 không tắt toggle theo lịch cố định mà POLL NHANH mirror
//   (inFlightPrefetchWindows) trong lúc đang phát ngược, và tắt NGAY
//   khi inFlight >= 1 bằng click thô tại tọa độ toggle đã đo trước
//   (không qua clickEl: clickEl ngủ 300 ms + 400 ms, đủ để prefetch
//   settle trước khi toggle kịp tắt). Tắt xong bấm Phát ngược lần nữa
//   để pause, tránh lần decode cửa sổ sau evict prefetch trước.
// - Mirror chỉ tươi khi vòng lặp preview tick (lúc đang phát) hoặc
//   ngay sau click toggle: sau khi chờ prefetch settle 3 s, script
//   phát ngược lại 1,5 s rồi pause để tick refresh mirror, rồi mới
//   đọc settledPrefetchDroppedFrames — đọc trực tiếp sau khi tắt sẽ
//   thấy số cũ (mirror stale), không phải "không có settle-drop".
// - Ruler: T4 click theo frac của chiều rộng ruler mà không kiểm tra
//   viewport. Script này (R1) tự hiệu chuẩn pxPerSec từ vị trí
//   playhead-handle sau 1 click, rồi click theo thời gian mục tiêu;
//   (R2) tái hiện đúng điều kiện T4: timeline dài làm ruler rộng hơn
//   viewport → click thô ngoài viewport PHẢI không đổi (kỳ vọng của
//   trình duyệt, không phải lỗi sản phẩm), rồi cuộn .tl-scroll cho
//   mục tiêu vào viewport và click lại → seek đúng.
//
// Mỗi bước in PASS/FAIL kèm số đo; exit 1 khi R1/R2-seek/S1 có FAIL.
// KHÔNG claim FPS: chỉ đếm prefetch frame + trạng thái cổng + thời gian.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEBUG_PORT = Number(process.argv[2] || 9347);
const DEV_URL = process.env.V4_DEV_URL || "http://localhost:5181/";
const CHROME =
  process.env.V4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/v4-cdprof-40";
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const SCRATCH = path.join(path.dirname(REPO_ROOT), "tmp-round40-v4");
const EASY = path.join(SCRATCH, "v4-easy-360p.mp4");
const EASY_NAME = path.basename(EASY);
const LONG = path.join(SCRATCH, "v4-long-360p-60s.mp4");
const LONG_NAME = path.basename(LONG);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureFixture(file, duration) {
  if (fs.existsSync(file)) return;
  fs.mkdirSync(SCRATCH, { recursive: true });
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
    "-i", `testsrc2=size=640x360:rate=30:duration=${duration}`, "-g", "30",
    "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", file],
    { stdio: "inherit" });
  if (r.status !== 0 || !fs.existsSync(file)) throw new Error(`không tạo được fixture ${file}`);
}

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
  // Click thô không ngủ (dùng khi cần tắt toggle ngay lúc prefetch bay).
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
const STATUS_JS = `(() => { const t = document.querySelector('.preview-decodeahead-toggle'); const b = document.querySelector('.preview-decodeahead-warn-badge'); return { toggle: t ? { text: t.textContent, status: t.dataset.status || null, pressed: t.getAttribute('aria-pressed'), title: t.title } : null, badge: b ? { text: b.textContent, display: b.style.display, title: b.title } : null, mirror: window.__vcutReverseDecodeAheadStatus || null }; })()`;
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
// Tâm một nút theo aria/selector, kèm kiểm tra elementFromPoint.
async function centerOf(cdp, elJs, label) {
  const info = await cdp.evalJs(`(() => { const el = ${elJs}; if (!el) return null; const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const top = document.elementFromPoint(cx, cy); return { x: cx, y: cy, inside: !!(top && (top === el || el.contains(top))), topCls: top ? (top.tagName + "." + top.className) : null }; })()`);
  if (!info) throw new Error(`không tìm thấy: ${label}`);
  if (!info.inside) throw new Error(`${label} bị che bởi ${info.topCls}`);
  return { x: Math.round(info.x), y: Math.round(info.y) };
}
// Click ruler tại thời gian mục tiêu (đã biết pxPerSec). Trả về time sau click.
async function rulerClickAtTime(cdp, target, pps) {
  const rect = await cdp.evalJs(RULER_JS);
  const x = Math.round(rect.x + target * pps);
  const y = Math.round(rect.y + rect.h / 2);
  const top = await cdp.evalJs(`(() => { const t = document.elementFromPoint(${x}, ${y}); return t ? (t.tagName + "." + t.className) : null; })()`);
  if (top !== "DIV.tl-ruler") throw new Error(`điểm click thời gian ${target} không trúng ruler (top=${top}, x=${x})`);
  await cdp.click(x, y);
  return { x, y, time: await cdp.evalJs(TIME_JS) };
}
// Cuộn .tl-scroll cho tới khi điểm thời gian mục tiêu vào viewport rồi click.
async function rulerClickAtTimeScrolled(cdp, target, pps) {
  const sc = `document.querySelector('.tl-scroll')`;
  for (let i = 0; i < 6; i++) {
    const rect = await cdp.evalJs(RULER_JS);
    const x = Math.round(rect.x + target * pps);
    const y = Math.round(rect.y + rect.h / 2);
    if (x > 100 && x < rect.vw - 100) {
      const top = await cdp.evalJs(`(() => { const t = document.elementFromPoint(${x}, ${y}); return t ? (t.tagName + "." + t.className) : null; })()`);
      if (top === "DIV.tl-ruler") { await cdp.click(x, y); return { x, y, scrolled: i > 0, time: await cdp.evalJs(TIME_JS) }; }
    }
    await cdp.evalJs(`(() => { const el = ${sc}; const r = document.querySelector('.tl-ruler').getBoundingClientRect(); el.scrollLeft += (${x} - window.innerWidth / 2); return true; })()`);
    await sleep(400);
  }
  throw new Error(`không đưa được thời gian ${target} vào viewport sau 6 lần cuộn`);
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
  ensureFixture(EASY, 10);
  ensureFixture(LONG, 60);
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

    // R1 — ruler timeline ngắn: hiệu chuẩn pxPerSec rồi click đúng thời gian.
    await importFile(cdp, EASY, EASY_NAME);
    await closeModalIfOpen(cdp);
    await clickElRetry(cdp, cardAddJs(EASY_NAME), "nút ＋ Thêm của fixture dễ decode");
    await sleep(1000);
    const tBefore = await cdp.evalJs(TIME_JS);
    const rect0 = await cdp.evalJs(RULER_JS);
    const calibX = Math.round(rect0.x + 300);
    const calibY = Math.round(rect0.y + rect0.h / 2);
    await cdp.click(calibX, calibY);
    const tCalib = await cdp.evalJs(TIME_JS);
    const rectCalib = await cdp.evalJs(RULER_JS);
    const handlePx = parseFloat(rectCalib.handleLeft || "0");
    const pps = tCalib && tCalib.cur > 0 ? handlePx / tCalib.cur : NaN;
    const ppsOk = Number.isFinite(pps) && pps > 0;
    record("R1-calib pxPerSec từ playhead-handle", ppsOk,
      `click x=${calibX} → cur=${tCalib?.cur} handleLeft=${rectCalib.handleLeft} pps=${pps}`);
    let ppsUse = ppsOk ? pps : 60;
    const target1 = 6;
    const r1 = await rulerClickAtTime(cdp, target1, ppsUse);
    record("R1 click ruler seek đúng thời gian", Math.abs((r1.time?.cur ?? -99) - target1) <= 0.3,
      `mục tiêu ${target1}s → cur=${r1.time?.cur} (tổng ${r1.time?.total}) x=${r1.x} pps=${ppsUse.toFixed(2)}`);

    // R2 — tái hiện điều kiện T4: timeline dài, ruler rộng hơn viewport.
    await importFile(cdp, LONG, LONG_NAME);
    await closeModalIfOpen(cdp);
    await clickElRetry(cdp, cardAddJs(LONG_NAME), "nút ＋ Thêm của fixture dài 60 s");
    await sleep(1000);
    const tLong = await cdp.evalJs(TIME_JS);
    const rectLong = await cdp.evalJs(RULER_JS);
    const rulerWider = rectLong.w > rectLong.vw;
    const target2 = Math.max(5, Math.floor((tLong?.total || 60) * 0.5));
    const rawX = Math.round(rectLong.x + target2 * ppsUse);
    const rawY = Math.round(rectLong.y + rectLong.h / 2);
    const rawOutside = rawX >= rectLong.vw || rawX < 0;
    let rawDetail = `ruler w=${rectLong.w} vw=${rectLong.vw} target=${target2}s rawX=${rawX} outside=${rawOutside} total=${tLong?.total}`;
    let rawOk = true;
    if (rulerWider && rawOutside) {
      const beforeRaw = await cdp.evalJs(TIME_JS);
      await cdp.click(rawX, rawY);
      const afterRaw = await cdp.evalJs(TIME_JS);
      rawOk = Math.abs((afterRaw?.cur ?? -99) - (beforeRaw?.cur ?? -98)) < 0.05;
      rawDetail += ` cur ${beforeRaw?.cur} → ${afterRaw?.cur} (ngoài viewport phải không đổi)`;
    } else if (!rulerWider) {
      rawDetail += " (ruler không rộng hơn viewport — không tái hiện được điều kiện T4, bỏ qua bước raw)";
    } else {
      rawDetail += " (điểm mục tiêu vẫn trong viewport — không tái hiện được bước raw)";
    }
    record("R2 click thô ngoài viewport không đổi (điều kiện T4)", rawOk, rawDetail);
    const r2 = await rulerClickAtTimeScrolled(cdp, target2, ppsUse);
    record("R2 click ruler sau khi cuộn vào viewport seek đúng", Math.abs((r2.time?.cur ?? -99) - target2) <= 0.3,
      `mục tiêu ${target2}s → cur=${r2.time?.cur} x=${r2.x} scrolled=${r2.scrolled}`);

    // S1 — settle-drop: poll nhanh inFlight, tắt ngay khi prefetch đang bay.
    // BẮT BUỘC đặt cờ opt-in đường reverse WebCodecs trước (như T4 đã
    // làm): reversePlayback.ts mặc định TẮT đường này, chỉ bật khi
    // window.__vcutReverseWebcodecs === true — thiếu cờ thì preview vẽ
    // bằng <video> fallback, không tạo controller nào, mirror mãi
    // blocked "not-measured" (đúng lỗi lượt chạy đầu của script này).
    await cdp.evalJs(`window.__vcutReverseWebcodecs = true;`);
    const toggleC = await centerOf(cdp, TOGGLE_EL, "toggle decode-ahead");
    const reverseC = await centerOf(cdp, REVERSE_EL, "nút Phát ngược");
    let st0 = await cdp.evalJs(STATUS_JS);
    if (st0.mirror?.uiStatus === "off" || !st0.mirror) {
      await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật)");
      await sleep(800);
      st0 = await cdp.evalJs(STATUS_JS);
    }
    // Seek gần cuối timeline rồi phát ngược để decode-ahead chạy.
    const tEnd = await cdp.evalJs(TIME_JS);
    await rulerClickAtTimeScrolled(cdp, Math.max(1, (tEnd?.total || 10) - 1.5), ppsUse);
    const running = await waitForRunningPrefetch(cdp, 4);
    record("S1-setup decode-ahead running + prefetch > 0", !!running,
      running ? `prefetch=${running.mirror?.prefetchFrames} fps=${running.mirror?.measurementFps} badge=${JSON.stringify(running.badge?.text)}`
        : `không đạt running sau 4 lượt; mirror cuối=${JSON.stringify((await cdp.evalJs(STATUS_JS)).mirror)}`);
    let settlePass = false;
    let settleDetail = "chưa chạy vòng bắt";
    if (running) {
      for (let attempt = 1; attempt <= 3 && !settlePass; attempt++) {
        // Đảm bảo đang phát ngược (lượt 2+ sau lần pause trước).
        if (attempt > 1) {
          await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật lại)");
          await sleep(800);
          await playReverseAndWaitForMovement(cdp, 20000);
        }
        const before = await cdp.evalJs(STATUS_JS);
        const settledBefore = before.mirror?.settledPrefetchDroppedFrames ?? 0;
        // Poll nhanh: mỗi vòng chỉ 1 lần eval, không sleep dài.
        let caught = null;
        const poll0 = Date.now();
        while (Date.now() - poll0 < 90000) {
          const m = await cdp.evalJs(`window.__vcutReverseDecodeAheadStatus`);
          const inFlight = m?.inFlightPrefetchWindows ?? 0;
          if (inFlight >= 1) { caught = { inFlight, ms: Date.now() - poll0 }; break; }
          await sleep(10);
        }
        if (!caught) {
          settleDetail = `lượt ${attempt}: không thấy inFlight>0 trong 90 s (mirror cuối=${JSON.stringify((await cdp.evalJs(STATUS_JS)).mirror)})`;
          continue;
        }
        // Tắt ngay + pause ngay bằng click thô (không ngủ giữa chừng).
        const tg = await centerOf(cdp, TOGGLE_EL, "toggle decode-ahead");
        await cdp.clickFast(tg.x, tg.y);
        const rv = await centerOf(cdp, REVERSE_EL, "nút Phát ngược");
        await cdp.clickFast(rv.x, rv.y);
        await sleep(3000);
        // Phát lại ngắn để tick refresh mirror (tránh đọc số stale), rồi pause.
        await cdp.clickFast(rv.x, rv.y);
        await sleep(1500);
        await cdp.clickFast(rv.x, rv.y);
        await sleep(800);
        const after = await cdp.evalJs(STATUS_JS);
        const settledAfter = after.mirror?.settledPrefetchDroppedFrames ?? 0;
        const delta = settledAfter - settledBefore;
        settleDetail = `lượt ${attempt}: bắt inFlight=${caught.inFlight} sau ${caught.ms} ms poll; ` +
          `settled ${settledBefore} → ${settledAfter} (delta ${delta}); ` +
          `status=${after.mirror?.uiStatus} prefetch=${after.mirror?.prefetchFrames} badge=${JSON.stringify(after.badge?.text)}`;
        if (delta > 0 && after.mirror?.uiStatus === "off" && (after.mirror?.prefetchFrames || 0) === 0) settlePass = true;
      }
    }
    record("S1 settle-drop bắt được trên browser (delta settled > 0, TẮT, prefetch 0)", settlePass, settleDetail);
  } finally { kill(); }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== V4 clicktest: ${results.length - failed.length}/${results.length} pass ==`);
  if (failed.length > 0) process.exitCode = 1;
}
main().catch((e) => { console.error(`FATAL: ${e.message}`); process.exitCode = 1; });
