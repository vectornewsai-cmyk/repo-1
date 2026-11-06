#!/usr/bin/env node
/**
 * measure-v24-hidden-discard-pixel-pipe.mjs — Phase 9 đợt 24, luồng H6:
 * đóng 3 nợ của đợt 23 G4 §4/§5 (không sửa code sản phẩm):
 *  (b1) tab ẩn LÂU 600 s (10 phút, mô phỏng — KHÔNG mạo nhận "hàng giờ")
 *       lúc ngủ, đọc trạng thái lúc ẩn ở 5 s / 60 s / 300 s / 600 s;
 *  (b2) tab ẩn lúc đang phát mà playback ĐÁNG LẼ đã tới cuối timeline
 *       trong lúc ẩn (phát 2 s rồi ẩn 10 s, timeline mẫu 8 s): hiện lại
 *       rồi xem playhead có tiếp tục tới cuối, dừng đúng cuối và ngủ
 *       lại không;
 *  (b3) discard thật dưới áp lực bộ nhớ CÓ TRẦN: tab ẩn lúc ngủ, process
 *       phụ cấp phát tối đa 500 MB theo từng chunk 100 MB, dừng sớm nếu
 *       MemAvailable < 300 MB, giữ tối đa 30 s sau khi cấp đủ — ghi rõ
 *       tab sống/chết; KHÔNG ép quá trần này vì VM chỉ còn ~1 GB trống,
 *       không swap, và các luồng đợt 24 khác đang chạy song song
 *       (ép mạnh có thể OOM-kill tiến trình của luồng khác);
 *  (c) so pixel TRỰC TIẾP trước/sau redraw: dump ImageData đầy đủ
 *       (không chỉ hash mẫu thưa) trước khi ẩn và sau khi hiện lại,
 *       đếm pixel lệch + max/mean lệch kênh + bbox + 10 pixel lệch đầu
 *       — kết luận dị thường hash nhẹ sau redraw của đợt 23 G4 là khác
 *       thật hay artifact lấy mẫu thưa. So pixel thứ hai quanh bfcache
 *       restore (nếu bfcache thành công và heap còn sống).
 *
 * Kế thừa harness đợt 23 G4 (pipe CDP + Xvfb + vite preview + project
 * mẫu, click modal ở góc, tab trắng background:true): chỉ thay case
 * đo, KHÔNG đổi phương pháp nền. Thứ tự case trên cùng một trang:
 * L (ẩn lâu + pixel) → E (phát-tới-cuối qua ẩn) → C (bfcache + pixel)
 * → X (discard, để cuối vì tab có thể reload/chết, không case nào sau
 * đó nữa).
 *
 * Ghi kết quả: append 1 run vào V24_OUT (mặc định
 * benchmarks/results/v24-hidden-discard-pixel.json).
 * Exit 0 khi đo xong các case (kể cả bfcache/discard NOT_MEASURED —
 * đó là dữ liệu). Exit 2 khi không dựng được trang.
 *
 * Chạy từ gốc repo:
 *   node apps/web/scripts/measure-v24-hidden-discard-pixel-pipe.mjs
 * Env: V24_PREVIEW_PORT (mặc định 4191), V24_XVFB_DISPLAYS (mặc định
 *   :80,:81,:82,:83,:84), V24_CHROME_BINS, V24_OUT, V24_RUN_LABEL,
 *   V24_LONG_HIDE_MS (mặc định 600000), V24_PLAY_HIDE_MS (mặc định
 *   10000), V24_PRESSURE_MAX_MB (mặc định 500), V24_PRESSURE_FLOOR_MB
 *   (mặc định 300).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "measure-v24-hidden-discard-pixel-pipe");

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.V24_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const PREVIEW_PORT = Number(process.env.V24_PREVIEW_PORT || 4191);
const DISPLAYS_CANDIDATES = (process.env.V24_XVFB_DISPLAYS || ":80,:81,:82,:83,:84").split(",").map((s) => s.trim());
const DISPLAY = process.env.V24_XVFB_DISPLAY || null;
const OUT_PATH = process.env.V24_OUT || path.join(ROOT, "benchmarks", "results", "v24-hidden-discard-pixel.json");
const RUN_LABEL = process.env.V24_RUN_LABEL || "run1";
const LONG_HIDE_MS = Number(process.env.V24_LONG_HIDE_MS || 600000);
const PLAY_HIDE_MS = Number(process.env.V24_PLAY_HIDE_MS || 10000);
const PRESSURE_MAX_MB = Number(process.env.V24_PRESSURE_MAX_MB || 500);
const PRESSURE_FLOOR_MB = Number(process.env.V24_PRESSURE_FLOOR_MB || 300);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; } };
function memAvailableMb() {
  try {
    const txt = fs.readFileSync("/proc/meminfo", "utf8");
    const m = txt.match(/MemAvailable:\s+(\d+) kB/);
    return m ? Math.round(Number(m[1]) / 1024) : null;
  } catch { return null; }
}

/** Client CDP qua pipe (fd 3 ghi JSON+\0, fd 4 đọc tách \0) — như đợt 23. */
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    proc.stdio[3].on("error", () => {});
    proc.stdio[4].on("error", () => {});
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const msg = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!msg.trim()) continue;
        let obj;
        try { obj = JSON.parse(msg); } catch { continue; }
        if (obj.method === "Target.attachedToTarget" && obj.params && obj.params.sessionId) {
          this.sessionId = obj.params.sessionId;
        }
        if (obj.id && this.pending.has(obj.id)) {
          const h = this.pending.get(obj.id);
          this.pending.delete(obj.id);
          if (obj.error) h.reject(new Error(`CDP ${obj.error.code}: ${obj.error.message}`));
          else h.resolve(obj.result);
        }
      }
    });
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE,
            extra: { display: DISPLAY, port: PREVIEW_PORT },
          });
          if (hangSnap.file) log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        reject(new Error(`CDP timeout ${method} sau ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId, 120000);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    }
    return r.result.value;
  }
  async mouseMove(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, this.sessionId);
  }
  async mouseClick(x, y) {
    await this.mouseMove(x, y);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }, this.sessionId);
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }, this.sessionId);
  }
  async pressKey(code, key, vk) {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code, key, windowsVirtualKeyCode: vk }, this.sessionId);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code, key, windowsVirtualKeyCode: vk }, this.sessionId);
  }
}

const STATE_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  const timeMatch = (document.body.innerText.match(/\\d+:\\d+\\.\\d+ \\/ \\d+:\\d+\\.\\d+/) || document.body.innerText.match(/\\d+:\\d+ \\/ \\d+:\\d+/) || [])[0] || null;
  let pxHash = null;
  let canvasW = null, canvasH = null;
  try {
    if (canvas) {
      canvasW = canvas.width; canvasH = canvas.height;
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 64) s = (s + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
      pxHash = s;
    }
  } catch (e) { pxHash = 'tainted:' + String(e).slice(0, 40); }
  const hook = window.__vcutPreviewIdle;
  const bundle = (() => {
    const s = document.querySelector('script[src*="index-"]');
    return s ? s.getAttribute('src') : null;
  })();
  return { timeText: timeMatch, pxHash, bundle, visibility: document.visibilityState,
    hidden: document.hidden, canvasW, canvasH,
    hook: hook ? { ticks: hook.ticks, sleeping: hook.sleeping, lastDrawn: hook.lastDrawn,
      lastRequested: hook.lastRequested, pendingSeek: hook.pendingSeek, redrawFlag: hook.redrawFlag } : null };
})()
`;

/** Chụp ImageData ĐẦY ĐỦ vào window.__v24pix (không trả data về harness). */
const PIX_SNAP_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  if (!canvas) return { stored: false, error: 'no-canvas' };
  try {
    const ctx = canvas.getContext('2d');
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    let sum = 0, sparse = 0;
    for (let i = 0; i < d.length; i++) sum = (sum + d[i]) % 1000000007;
    for (let i = 0; i < d.length; i += 64) sparse = (sparse + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
    window.__v24pix = { w: canvas.width, h: canvas.height, data: new Uint8ClampedArray(d), sum, sparse };
    return { stored: true, w: canvas.width, h: canvas.height, sum, sparse, bytes: d.length };
  } catch (e) { return { stored: false, error: String(e).slice(0, 120) }; }
})()
`;

/** So pixel trực tiếp khung hiện tại với snapshot đã lưu (tính trong trang). */
const PIX_DIFF_JS = `
(() => {
  const prev = window.__v24pix;
  if (!prev) return { available: false, error: 'no-snapshot (trang đã reload hoặc chưa chụp)' };
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  if (!canvas) return { available: false, error: 'no-canvas' };
  try {
    const ctx = canvas.getContext('2d');
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    if (canvas.width !== prev.w || canvas.height !== prev.h || d.length !== prev.data.length) {
      return { available: false, error: 'canvas-size-changed', w: canvas.width, h: canvas.height, prevW: prev.w, prevH: prev.h };
    }
    let sum = 0, sparse = 0, diffPixels = 0, maxDiff = 0, sumAbs = 0;
    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    const first = [];
    const W = canvas.width;
    for (let p = 0; p < d.length; p += 4) {
      sum = (sum + d[p] + d[p + 1] + d[p + 2] + d[p + 3]) % 1000000007;
      let pd = 0;
      for (let c = 0; c < 4; c++) {
        const dd = Math.abs(d[p + c] - prev.data[p + c]);
        if (dd > pd) pd = dd;
        sumAbs += dd;
      }
      if (pd > 0) {
        diffPixels++;
        if (pd > maxDiff) maxDiff = pd;
        const idx = p / 4, x = idx % W, y = Math.floor(idx / W);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (first.length < 10) first.push({ x, y, pre: [prev.data[p], prev.data[p + 1], prev.data[p + 2], prev.data[p + 3]], post: [d[p], d[p + 1], d[p + 2], d[p + 3]] });
      }
    }
    for (let i = 0; i < d.length; i += 64) sparse = (sparse + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
    const total = W * canvas.height;
    return { available: true, w: W, h: canvas.height, totalPixels: total,
      diffPixels, diffPct: +(100 * diffPixels / total).toFixed(4),
      maxChannelDiff: maxDiff, sumAbsDiff: sumAbs,
      meanAbsDiffPerChannel: +(sumAbs / (total * 4)).toFixed(4),
      bbox: diffPixels ? { minX, minY, maxX, maxY } : null, firstDiffs: first,
      preSum: prev.sum, postSum: sum, preSparse: prev.sparse, postSparse: sparse,
      sumEqual: sum === prev.sum, sparseEqual: sparse === prev.sparse };
  } catch (e) { return { available: false, error: String(e).slice(0, 120) }; }
})()
`;

const BC_PROBE_JS = `
(() => {
  if (window.__v24bc) return { ok: true, again: true };
  window.__v24bc = { marker: 'v24-bfcache-probe', pageshows: [], visChanges: [] };
  window.addEventListener('pageshow', (e) => {
    window.__v24bc.pageshows.push({ persisted: !!e.persisted, at: Date.now() });
  });
  document.addEventListener('visibilitychange', () => {
    window.__v24bc.visChanges.push(document.visibilityState);
  });
  return { ok: true };
})()
`;

const BC_READ_JS = `
(() => {
  const b = window.__v24bc;
  if (!b) return { present: false, pageshows: null, visChanges: null };
  return { present: true, marker: b.marker, pageshows: b.pageshows.slice(), visChanges: b.visChanges.slice() };
})()
`;

function startVitePreview() {
  return new Promise((resolve) => {
    if (!fs.existsSync(path.join(WEB_DIR, "dist", "index.html"))) { log("vite preview: không có dist, BLOCKER"); resolve(null); return; }
    const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
    const proc = fs.existsSync(viteBin)
      ? spawn(process.execPath, [viteBin, "preview", "--port", String(PREVIEW_PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" })
      : spawn("npx", ["vite", "preview", "--port", String(PREVIEW_PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" });
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(proc); } }, 15000);
    (async () => {
      for (let i = 0; i < 30 && !done; i++) {
        await sleep(500);
        try { const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`); if (r.ok) { done = true; clearTimeout(timer); resolve(proc); return; } } catch { /* chưa lên */ }
      }
    })();
    proc.on("exit", () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

const snap = (st, draws) => ({
  time: st.timeText, px: st.pxHash, vis: st.visibility, hidden: st.hidden,
  canvasW: st.canvasW, canvasH: st.canvasH,
  ticks: st.hook ? st.hook.ticks : null, sleeping: st.hook ? st.hook.sleeping : null,
  lastDrawn: st.hook ? st.hook.lastDrawn : null,
  lastRequested: st.hook ? st.hook.lastRequested : null,
  pendingSeek: st.hook ? st.hook.pendingSeek : null, draws,
});

async function waitSleeping(cdp, maxS = 20) {
  for (let i = 0; i < maxS; i++) {
    await sleep(1000);
    const s = await cdp.evaluate(STATE_JS);
    if (s.hook && s.hook.sleeping) return { st: s, timedOut: false };
  }
  const s = await cdp.evaluate(STATE_JS);
  return { st: s, timedOut: true };
}

async function runOne(label, chromeBin, display, previewUrl) {
  const out = { run: label, ok: false, longHideMs: LONG_HIDE_MS, playHideMs: PLAY_HIDE_MS,
    pressureMaxMb: PRESSURE_MAX_MB, pressureFloorMb: PRESSURE_FLOOR_MB,
    memAvailableMbStart: memAvailableMb() };
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v24hidden-"));
  const chrome = spawn(chromeBin, [
    "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
    "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
    "--remote-debugging-pipe", `--user-data-dir=${profile}`,
    "--window-size=1920,1080", "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
  chrome.stderr.on("data", () => {});
  try {
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId");
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    const appTargetId = target.targetId;
    out.loadavgStart = loadavg();

    await cdp.send("Page.navigate", { url: previewUrl }, cdp.sessionId);
    let href = "";
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      try { href = await cdp.evaluate("location.href"); } catch { href = ""; }
      if (href.startsWith(previewUrl)) break;
      if (href.startsWith("chrome-error")) break;
    }
    if (!href.startsWith(previewUrl)) throw new Error(`navigate thất bại, href=${href}`);
    let ready = null;
    for (let i = 0; i < 90; i++) {
      await sleep(1000);
      try {
        const st = await cdp.evaluate(STATE_JS);
        if (st.timeText && (await cdp.evaluate(`!!document.querySelector('.project-name') && document.querySelector('.project-name').value === 'Dự án mẫu'`))) { ready = st; break; }
        if (i % 10 === 9) log(`${label} chờ sample: ${i + 1}s time=${st.timeText} bundle=${st.bundle}`);
      } catch { /* chưa sẵn sàng */ }
    }
    if (!ready) throw new Error("quá 90s chưa thấy project mẫu sẵn sàng");
    log(`${label} sample sẵn sàng: time=${ready.timeText} bundle=${ready.bundle} hook=${JSON.stringify(ready.hook)}`);
    out.bundle = ready.bundle;

    const modalBefore = await cdp.evaluate(`!!document.querySelector('.modal-backdrop')`);
    if (modalBefore) {
      await cdp.mouseClick(20, 20);
      await sleep(1500);
      let still = await cdp.evaluate(`!!document.querySelector('.modal-backdrop')`);
      if (still) {
        const btn = await cdp.evaluate(`(() => {
          const b = document.querySelector('.modal .icon-btn');
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        })()`);
        if (btn) { await cdp.mouseClick(btn.x, btn.y); await sleep(1500); }
        still = await cdp.evaluate(`!!document.querySelector('.modal-backdrop')`);
      }
    }
    const modalAfter = await cdp.evaluate(`!!document.querySelector('.modal-backdrop')`);
    log(`${label} WelcomeModal: trước=${modalBefore} sau click=${modalAfter}`);
    out.welcomeModal = { before: modalBefore, afterClick: modalAfter };
    if (modalAfter) throw new Error("WelcomeModal vẫn còn sau click đóng — không đo tiếp");

    const bcOk = await cdp.evaluate(BC_PROBE_JS);
    if (!bcOk.ok) throw new Error("cài probe bfcache thất bại");
    await cdp.evaluate(`
      (() => {
        const canvas = document.querySelector('#vcut-preview-wrap canvas');
        if (!canvas || window.__v24draw) return;
        const ctx = canvas.getContext('2d');
        const orig = ctx.setTransform.bind(ctx);
        const st = { id: 0 };
        window.__v24draw = st;
        ctx.setTransform = function (a, b, c, d, e, f) {
          if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) st.id++;
          return orig(a, b, c, d, e, f);
        };
      })()`);
    const draws = async () => cdp.evaluate(`window.__v24draw ? window.__v24draw.id / 2 : null`);

    const blank = await cdp.send("Target.createTarget", { url: "about:blank", background: true });
    const hideTab = async () => cdp.send("Target.activateTarget", { targetId: blank.targetId });
    const showTab = async () => cdp.send("Target.activateTarget", { targetId: appTargetId });

    // ---------- CASE L: ẩn 600 s lúc ngủ + so pixel đầy đủ ----------
    {
      await cdp.pressKey("Home", "Home", 36);
      const preRes = await waitSleeping(cdp);
      const pre = snap(preRes.st, await draws());
      const pixPre = await cdp.evaluate(PIX_SNAP_JS);
      log(`${label} CASE-L pre: ${JSON.stringify(pre)} pixPre=${JSON.stringify(pixPre)}`);
      await hideTab();
      const samples = [];
      const marks = [5000, 60000, 300000, LONG_HIDE_MS]
        .filter((m, i, a) => m <= LONG_HIDE_MS && a.indexOf(m) === i).sort((a, b) => a - b);
      let elapsed = 0;
      for (const m of marks) {
        if (m > elapsed) { await sleep(m - elapsed); elapsed = m; }
        samples.push({ atMs: m, ...snap(await cdp.evaluate(STATE_JS), await draws()) });
      }
      if (elapsed < LONG_HIDE_MS) { await sleep(LONG_HIDE_MS - elapsed); }
      await showTab();
      await sleep(1000);
      const post1 = snap(await cdp.evaluate(STATE_JS), await draws());
      const pixDiff1 = await cdp.evaluate(PIX_DIFF_JS);
      await sleep(3000);
      const post4 = snap(await cdp.evaluate(STATE_JS), await draws());
      const pixDiff4 = await cdp.evaluate(PIX_DIFF_JS);
      await sleep(6000);
      const post10 = snap(await cdp.evaluate(STATE_JS), await draws());
      log(`${label} CASE-L lúc ẩn: ${JSON.stringify(samples)}`);
      log(`${label} CASE-L sau hiện 1s: ${JSON.stringify(post1)} pixDiff=${JSON.stringify(pixDiff1)}`);
      log(`${label} CASE-L sau hiện 4s: ${JSON.stringify(post4)} pixDiff=${JSON.stringify(pixDiff4)}`);
      log(`${label} CASE-L sau hiện 10s: ${JSON.stringify(post10)}`);
      out.caseL_longHidePixel = { pre, sleepWaitTimedOut: preRes.timedOut, pixPre, hiddenSamples: samples,
        post1s: post1, pixDiff1s: pixDiff1, post4s: post4, pixDiff4s: pixDiff4, post10s: post10 };
    }

    // ---------- CASE E: phát 2 s → ẩn 10 s (đáng lẽ đã tới cuối 8 s) → hiện, xem có về cuối + ngủ lại ----------
    {
      await cdp.pressKey("Home", "Home", 36);
      await waitSleeping(cdp);
      await cdp.pressKey("Space", " ", 32);
      await sleep(2000);
      const playPre = snap(await cdp.evaluate(STATE_JS), await draws());
      log(`${label} CASE-E trước ẩn (đang phát): ${JSON.stringify(playPre)}`);
      await hideTab();
      await sleep(PLAY_HIDE_MS);
      const hiddenAtEnd = snap(await cdp.evaluate(STATE_JS), await draws());
      log(`${label} CASE-E lúc ẩn ${PLAY_HIDE_MS}ms: ${JSON.stringify(hiddenAtEnd)}`);
      await showTab();
      // Poll mỗi 1 s tới 25 s: playhead phải tiếp tục từ điểm cũ, tới
      // cuối timeline (~8 s) rồi vòng ngủ lại (sleeping=true).
      const trajectory = [];
      let reachedSleepAfterEnd = false;
      for (let i = 0; i < 25; i++) {
        await sleep(1000);
        const s = snap(await cdp.evaluate(STATE_JS), await draws());
        trajectory.push({ afterShowS: i + 1, ...s });
        if (s.sleeping === true) { reachedSleepAfterEnd = true; break; }
      }
      await sleep(3000);
      const settled = snap(await cdp.evaluate(STATE_JS), await draws());
      log(`${label} CASE-E trajectory sau hiện: ${JSON.stringify(trajectory)}`);
      log(`${label} CASE-E settled: ${JSON.stringify(settled)} reachedSleep=${reachedSleepAfterEnd}`);
      out.caseE_playToEndThroughHide = { prePlay: playPre, hiddenAtEnd, trajectory, reachedSleepAfterEnd, settled };
    }

    // ---------- CASE C: bfcache + so pixel quanh restore ----------
    {
      await cdp.pressKey("Home", "Home", 36);
      await waitSleeping(cdp);
      const pixPreC = await cdp.evaluate(PIX_SNAP_JS);
      const depart = snap(await cdp.evaluate(STATE_JS), await draws());
      const bcPre = await cdp.evaluate(BC_READ_JS);
      let back = null;
      try {
        await cdp.send("Page.navigate", { url: "about:blank" }, cdp.sessionId);
        await sleep(2000);
        const hist = await cdp.send("Page.getNavigationHistory", {}, cdp.sessionId);
        const backEntry = hist.entries[hist.currentIndex - 1];
        if (backEntry) {
          await cdp.send("Page.navigateToHistoryEntry", { entryId: backEntry.id }, cdp.sessionId);
          await sleep(3000);
          try {
            const st = await cdp.evaluate(STATE_JS);
            if (!st.timeText) { for (let i = 0; i < 30; i++) { await sleep(1000); const s2 = await cdp.evaluate(STATE_JS); if (s2.timeText) break; } }
          } catch (e) { back = { error: String(e).slice(0, 200) }; }
          if (!back) {
            const bcAfter = await cdp.evaluate(BC_READ_JS).catch((e) => ({ present: false, error: String(e).slice(0, 200) }));
            const stAfter = await cdp.evaluate(STATE_JS).catch(() => null);
            await sleep(1000);
            const post1 = snap(await cdp.evaluate(STATE_JS), await draws());
            const pixDiff1 = await cdp.evaluate(PIX_DIFF_JS);
            await sleep(3000);
            const post4 = snap(await cdp.evaluate(STATE_JS), await draws());
            const pixDiff4 = await cdp.evaluate(PIX_DIFF_JS);
            back = { bcAfter, bundleAfter: stAfter ? stAfter.bundle : null,
              hrefAfter: await cdp.evaluate("location.href").catch(() => null),
              post1s: post1, pixDiff1s: pixDiff1, post4s: post4, pixDiff4s: pixDiff4 };
          }
        } else back = { error: "không có history entry trước đó để quay lại" };
      } catch (e) {
        back = { error: String(e).slice(0, 300) };
      }
      const isBfcache = back && back.bcAfter && back.bcAfter.present
        && back.bcAfter.pageshows && back.bcAfter.pageshows.some((p) => p.persisted);
      log(`${label} CASE-C: depart=${JSON.stringify(depart)} pixPre=${JSON.stringify(pixPreC)} back=${JSON.stringify(back)} bfcache=${isBfcache}`);
      out.caseC_bfcachePixel = { depart, pixPre: pixPreC, pre: bcPre, back, isBfcache: !!isBfcache };
    }

    // ---------- CASE X: discard dưới áp lực bộ nhớ CÓ TRẦN (để cuối) ----------
    {
      // Về trạng thái ngủ chắc chắn trước khi ẩn + ép RAM.
      await cdp.pressKey("Home", "Home", 36);
      const preRes = await waitSleeping(cdp);
      const pre = snap(preRes.st, await draws());
      const memBefore = memAvailableMb();
      await hideTab();
      await sleep(2000);
      const hiddenPre = snap(await cdp.evaluate(STATE_JS), await draws());
      // Process phụ cấp RAM theo chunk 100 MB, tối đa PRESSURE_MAX_MB,
      // dừng sớm nếu MemAvailable < PRESSURE_FLOOR_MB. Buffer.alloc
      // fill 1 chạm đủ page để RAM thật sự bị chiếm (không phải ảo).
      const chunks = Math.max(0, Math.floor(PRESSURE_MAX_MB / 100));
      const pressure = spawn(process.execPath, ["-e",
        `const a=[]; let n=0; const max=${chunks};
         const step=()=>{ if(n>=max){ setInterval(()=>{}, 60000); return; }
           a.push(Buffer.alloc(100*1024*1024, 1)); n++;
           setTimeout(step, 2000); }; step();`],
        { stdio: "ignore" });
      const pressureSamples = [];
      let tabAlive = true;
      let tabDeathAtS = null;
      // Giữ áp lực tối đa ~ (2s × chunks + 30s); poll tab mỗi 5 s.
      const totalHoldS = chunks * 2 + 30;
      for (let s = 0; s < totalHoldS; s += 5) {
        await sleep(5000);
        const memNow = memAvailableMb();
        let stNow = null;
        try { stNow = snap(await cdp.evaluate(STATE_JS), await draws()); }
        catch (e) { tabAlive = false; tabDeathAtS = s + 5; pressureSamples.push({ atS: s + 5, memAvailableMb: memNow, tabAlive: false, error: String(e).slice(0, 200) }); break; }
        pressureSamples.push({ atS: s + 5, memAvailableMb: memNow, tabAlive: true,
          ticks: stNow.ticks, sleeping: stNow.sleeping, lastDrawn: stNow.lastDrawn, px: stNow.px });
        if (memNow !== null && memNow < PRESSURE_FLOOR_MB) {
          pressureSamples.push({ note: `dừng sớm: MemAvailable ${memNow}MB < floor ${PRESSURE_FLOOR_MB}MB` });
          break;
        }
      }
      try { pressure.kill("SIGKILL"); } catch {}
      await sleep(2000);
      const memAfterKill = memAvailableMb();
      // Hiện lại tab (nếu còn sống) hoặc kiểm tra trạng thái sau ép.
      let afterShow = null;
      try {
        await showTab();
        await sleep(2000);
        afterShow = snap(await cdp.evaluate(STATE_JS), await draws());
        const bcAfter = await cdp.evaluate(BC_READ_JS).catch(() => null);
        afterShow = { ...afterShow, bcAfter };
      } catch (e) { afterShow = { error: String(e).slice(0, 300) }; }
      log(`${label} CASE-X: pre=${JSON.stringify(pre)} memBefore=${memBefore} hiddenPre=${JSON.stringify(hiddenPre)} tabAlive=${tabAlive} tabDeathAtS=${tabDeathAtS} memAfterKill=${memAfterKill} afterShow=${JSON.stringify(afterShow)}`);
      for (const s of pressureSamples) log(`${label} CASE-X sample: ${JSON.stringify(s)}`);
      out.caseX_discardPressure = { pre, sleepWaitTimedOut: preRes.timedOut, memAvailableMbBefore: memBefore,
        hiddenPre, pressureSamples, tabAliveDuringPressure: tabAlive, tabDeathAtS,
        memAvailableMbAfterKill: memAfterKill, afterShow,
        verdict: tabAlive
          ? `TAB_SONG: tab không bị discard dưới áp lực tối đa ${PRESSURE_MAX_MB}MB (có trần an toàn) — discard thật CHƯA đo được, không phải "đã chứng minh không discard"`
          : "TAB_CHET_TRONG_LUC_EP: renderer/target mất trong lúc ép RAM (cần đối chiếu afterShow để phân biệt discard vs crash)" };
    }

    out.ok = true;
    out.loadavgEnd = loadavg();
    out.memAvailableMbEnd = memAvailableMb();
    return out;
  } finally {
    try { chrome.kill("SIGKILL"); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  log(`binaries thử: ${BINARIES.join(" | ")} | preview-port=${PREVIEW_PORT} | display=${DISPLAY} | out=${OUT_PATH} | longHide=${LONG_HIDE_MS}ms playHide=${PLAY_HIDE_MS}ms pressureMax=${PRESSURE_MAX_MB}MB floor=${PRESSURE_FLOOR_MB}MB memAvailStart=${memAvailableMb()}MB`);
  log(`dist mtime: ${(() => { try { return fs.statSync(path.join(WEB_DIR, "dist", "index.html")).mtime.toISOString(); } catch { return "n/a"; } })()}`);
  const preview = await startVitePreview();
  let previewUp = false;
  if (preview) {
    try { const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`); previewUp = r.ok; } catch { previewUp = false; }
  }
  log(`vite preview: ${previewUp ? `lên tại 127.0.0.1:${PREVIEW_PORT}` : "KHÔNG lên — BLOCKER, không đo được"}`);
  if (!previewUp) { try { preview && preview.kill("SIGKILL"); } catch {} process.exit(2); }
  const previewUrl = `http://127.0.0.1:${PREVIEW_PORT}/`;

  let xvfb = null;
  let display = null;
  try {
    const candidates = DISPLAY ? [DISPLAY] : DISPLAYS_CANDIDATES;
    for (const d of candidates) {
      const num = d.replace(":", "");
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) {
        const anyX = spawnSync("pgrep", ["-x", "Xvfb"]);
        if (anyX.status !== 0) {
          try { fs.unlinkSync(`/tmp/.X11-unix/X${num}`); } catch {}
          try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
          log(`Xvfb: dọn socket mồ côi DISPLAY ${d}`);
        } else { log(`Xvfb: DISPLAY ${d} đã có socket + có Xvfb chạy — bỏ qua, thử display khác`); continue; }
      }
      xvfb = spawn("Xvfb", [d, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
      for (let i = 0; i < 40; i++) {
        if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) break;
        await sleep(250);
      }
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) { display = d; break; }
      try { xvfb.kill("SIGKILL"); } catch {}
      xvfb = null;
    }
    if (!display) throw new Error("không khởi động được Xvfb");
    log(`Xvfb: DISPLAY=${display}`);

    let result = null;
    for (const bin of BINARIES) {
      if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
      try {
        log(`bắt đầu: binary=${bin} loadavg=${loadavg()}`);
        result = await runOne(RUN_LABEL, bin, display, previewUrl);
        break;
      } catch (e) {
        log(`BLOCKER ${bin}: ${e && e.message ? e.message : e}`);
      }
    }
    if (!result) { log("DONE v24-hidden-discard-pixel: KHÔNG đo được run nào"); process.exit(2); }
    log(`=== TỔNG HỢP ===`);
    log(JSON.stringify(result, null, 1));
    try {
      fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
      let doc = { generatedBy: "measure-v24-hidden-discard-pixel-pipe.mjs", bundle: result.bundle, runs: [] };
      if (fs.existsSync(OUT_PATH)) {
        try { const prev = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")); if (prev && Array.isArray(prev.runs)) doc = prev; } catch { /* file hỏng -> ghi đè */ }
      }
      doc.bundle = result.bundle;
      doc.runs = doc.runs.filter((r) => r.run !== result.run);
      doc.runs.push(result);
      fs.writeFileSync(OUT_PATH, JSON.stringify(doc, null, 1) + "\n");
      log(`đã ghi run ${result.run} vào ${OUT_PATH} (tổng ${doc.runs.length} run)`);
    } catch (e) {
      log(`CẢNH BÁO: không ghi được ${OUT_PATH}: ${e.message} (kết quả vẫn có ở stdout)`);
    }
    log(`DONE v24-hidden-discard-pixel ok=${result.ok}`);
  } finally {
    try { xvfb && xvfb.kill("SIGKILL"); } catch {}
    try { preview && preview.kill("SIGKILL"); } catch {}
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
