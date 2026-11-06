#!/usr/bin/env node
/**
 * measure-v23-hidden-bfcache-pipe.mjs — Phase 9 đợt 23, luồng G4:
 * đo tab ẩn LÂU, tab ẩn lúc ĐANG PHÁT, và bfcache restore thật trong
 * lúc preview ngủ (nối tiếp đợt 22 luồng C).
 *
 * Phương pháp kế thừa đợt 22 C: Playwright Chromium 156 headed dưới
 * Xvfb 1920x1080x24, điều khiển qua --remote-debugging-pipe, build thật
 * apps/web/dist chạy bằng `vite preview`, project mẫu tự load
 * (2 clip webm 640x360 + 1 clip chữ, 1280x720@30fps, 8 s).
 * KHÔNG build lại dist (tránh đụng các luồng đợt 23 khác đang chạy song
 * song): harness dùng dist sẵn có và ghi tên bundle vào kết quả để đối
 * chiếu. Bundle lúc viết script đã chứa fix visibility đợt 22 C.
 *
 * Các case, chạy theo thứ tự trên CÙNG một trang (bfcache để cuối vì
 * nó có thể reload trang):
 *  - D (hồi quy ngủ ngắn đợt 22): pause + settle tới sleeping=true,
 *    ẩn tab 3 s qua Target.activateTarget sang tab trắng rồi về,
 *    đọc ticks/sleeping/px-hash trước, lúc ẩn, sau hiện 1 s và 4 s.
 *  - A (ẩn lâu ~60 s): ngủ chắc chắn, ẩn 60 s, đọc trạng thái lúc
 *    ẩn ở ~5 s / ~30 s / ~60 s (canvas có bị discard không: px hash
 *    có đổi/về 0 không), hiện lại, đọc 1 s / 4 s / 10 s (vẽ lại đúng
 *    frame cũ không, có ngủ lại không).
 *  - B (ẩn lúc đang phát): Space phát, chờ 2 s (xác nhận đang phát:
 *    sleeping=false, lastDrawn tăng), ẩn 10 s, đọc lúc ẩn ở ~5 s /
 *    ~10 s (playhead có đứng yên không — rAF bị kẹp thì playhead do
 *    chính vòng lặp đẩy phải đứng yên), hiện lại, đọc 1 s / 3 s
 *    (playhead tiếp tục từ điểm cũ, KHÔNG nhảy vọt bằng thời gian ẩn;
 *    dung sai nhảy vọt: > 1 s so với điểm cũ + thời gian kể từ lúc
 *    hiện mới tính là lệch), rồi Space dừng + settle về ngủ.
 *  - C (bfcache): gắn probe trước khi rời trang — marker trên window
 *    + listener pageshow ghi {persisted} vào mảng. Rời trang trong
 *    cùng tab (navigate sang about:blank, rồi quay lại bằng history
 *    entry; nếu lần 1 không phải bfcache thì thử lần 2 sang
 *    data:text/html rồi quay lại), đọc lại marker + mảng pageshow:
 *    marker còn + persisted=true mới tính là bfcache THẬT; marker mất
 *    = trang đã reload hoàn toàn (không phải bfcache); marker còn
 *    nhưng persisted=false = pageshow không qua bfcache. Nếu CDP/Xvfb
 *    không tạo được bfcache thật thì kết quả ghi rõ NOT_MEASURED,
 *    KHÔNG bịa số.
 *
 * Đóng WelcomeModal trước mọi đo (bài học đợt 22 C): click 1 lần vào
 * backdrop để đóng modal trên profile mới. PHẢI click góc màn hình —
 * dialog ở giữa màn hình có stopPropagation nên click giữa màn hình
 * rơi vào dialog, không đóng được (lỗi harness lần chạy đầu đợt 23:
 * click 960,540 không đóng; sửa thành góc 20,20 + fallback nút ✕).
 * Tab trắng dùng để ẩn tab app PHẢI tạo với background:true — nếu
 * tạo foreground (mặc định), Chrome tự activate tab trắng, tab app
 * thành hidden TRƯỚC khi đo pre, phím Home gửi qua CDP session vẫn
 * tới trang app và đánh thức vòng ngủ (sleeping=false) nhưng rAF
 * không bao giờ nổ khi tab ẩn nên vòng kẹt ở sleeping=false, ticks
 * đóng băng — đó là artifact của harness lần chạy đầu đợt 23 ở
 * case D (pre đọc được vis=hidden, sleeping=false), KHÔNG phải bug
 * app: user thật không thể bấm phím vào tab đang ẩn. Bản sửa này
 * tạo tab trắng background:true nên tab app vẫn active tới lúc đo
 * pre xong mới bị ẩn bởi activateTarget có chủ ý; waitSleeping còn
 * báo timedOut để artifact kiểu này lộ ra trong dữ liệu thay vì
 * bị nuốt.
 *
 * Ghi kết quả: mỗi lần chạy append 1 run vào file JSON ở
 * V23_OUT (mặc định benchmarks/results/v23-hidden-bfcache.json),
 * dạng { generatedBy, bundle, runs: [...] }. Stdout in tóm tắt từng
 * case + JSON run.
 *
 * Chạy từ gốc repo:
 *   node apps/web/scripts/measure-v23-hidden-bfcache-pipe.mjs
 * Env: V23_PREVIEW_PORT (mặc định 4187), V23_XVFB_DISPLAYS (mặc định
 *   :90,:91,:92,:93,:94 — tránh :95/:96–:99 của script đợt 22 nếu còn
 *   chạy), V23_CHROME_BINS, V23_OUT, V23_RUN_LABEL, V23_LONG_HIDE_MS
 *   (mặc định 60000), V23_PLAY_HIDE_MS (mặc định 10000).
 * Exit 0 khi đo xong các case (kể cả khi bfcache NOT_MEASURED — đó là
 * dữ liệu, không phải lỗi harness). Exit 2 khi không dựng được trang.
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG ghi gì vào repo ngoài
 * file JSON kết quả (V23_OUT) khi chạy mặc định.
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
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "measure-v23-hidden-bfcache-pipe");

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.V23_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const PREVIEW_PORT = Number(process.env.V23_PREVIEW_PORT || 4187);
const DISPLAYS_CANDIDATES = (process.env.V23_XVFB_DISPLAYS || ":90,:91,:92,:93,:94").split(",").map((s) => s.trim());
const DISPLAY = process.env.V23_XVFB_DISPLAY || null;
const OUT_PATH = process.env.V23_OUT || path.join(ROOT, "benchmarks", "results", "v23-hidden-bfcache.json");
const RUN_LABEL = process.env.V23_RUN_LABEL || "run1";
const LONG_HIDE_MS = Number(process.env.V23_LONG_HIDE_MS || 60000);
const PLAY_HIDE_MS = Number(process.env.V23_PLAY_HIDE_MS || 10000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; } };

/** Client CDP qua pipe (fd 3 ghi JSON+\0, fd 4 đọc tách \0) — như đợt 22. */
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

/** Probe bfcache + visibility: marker sống qua bfcache, mất khi reload. */
const BC_PROBE_JS = `
(() => {
  if (window.__v23bc) return { ok: true, again: true };
  window.__v23bc = { marker: 'v23-bfcache-probe', pageshows: [], visChanges: [] };
  window.addEventListener('pageshow', (e) => {
    window.__v23bc.pageshows.push({ persisted: !!e.persisted, at: Date.now() });
  });
  document.addEventListener('visibilitychange', () => {
    window.__v23bc.visChanges.push(document.visibilityState);
  });
  return { ok: true };
})()
`;

const BC_READ_JS = `
(() => {
  const b = window.__v23bc;
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

async function waitSleeping(cdp, label, maxS = 20) {
  for (let i = 0; i < maxS; i++) {
    await sleep(1000);
    const s = await cdp.evaluate(STATE_JS);
    if (s.hook && s.hook.sleeping) return { st: s, timedOut: false };
  }
  const s = await cdp.evaluate(STATE_JS);
  return { st: s, timedOut: true };
}

/** Sau khi quay lại từ bfcache (hoặc reload): đọc trạng thái vòng lặp
 *  ở 1 s và 4 s sau khi về trang, để kiểm chứng vòng có tỉnh/vẽ lại/
 *  ngủ lại đúng không — không chỉ marker còn sống. */
async function postRestore(cdp, draws) {
  await sleep(1000);
  const s1 = snap(await cdp.evaluate(STATE_JS), await draws());
  await sleep(3000);
  const s4 = snap(await cdp.evaluate(STATE_JS), await draws());
  return { postRestore1s: s1, postRestore4s: s4 };
}

async function runOne(label, chromeBin, display, previewUrl) {
  const out = { run: label, ok: false, longHideMs: LONG_HIDE_MS, playHideMs: PLAY_HIDE_MS };
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v23hidden-"));
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

    // Đóng WelcomeModal (bài học đợt 22 C): click 1 lần vào backdrop để
    // đóng modal trên profile mới. PHẢI click góc màn hình — dialog ở
    // giữa màn hình có stopPropagation nên click giữa màn hình rơi vào
    // dialog, không đóng được (lỗi harness lần chạy đầu: click 960,540
    // không đóng). Góc (20,20) chắc chắn trúng backdrop (z-index 100
    // phủ toàn màn hình). Nếu vẫn còn thì click nút ✕ của chính modal
    // bằng CDP mouse (vẫn là click thật, không dispatch JS).
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
    if (modalAfter) throw new Error("WelcomeModal vẫn còn sau click đóng — không đo tiếp (hit-test sẽ sai)");

    // Probe draw + bfcache/visibility.
    const bcOk = await cdp.evaluate(BC_PROBE_JS);
    if (!bcOk.ok) throw new Error("cài probe bfcache thất bại");
    await cdp.evaluate(`
      (() => {
        const canvas = document.querySelector('#vcut-preview-wrap canvas');
        if (!canvas || window.__v23draw) return;
        const ctx = canvas.getContext('2d');
        const orig = ctx.setTransform.bind(ctx);
        const st = { id: 0 };
        window.__v23draw = st;
        ctx.setTransform = function (a, b, c, d, e, f) {
          if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) st.id++;
          return orig(a, b, c, d, e, f);
        };
      })()`);
    const draws = async () => cdp.evaluate(`window.__v23draw ? window.__v23draw.id / 2 : null`);

    // Về playhead 0 + chờ ngủ.
    await cdp.pressKey("Home", "Home", 36);
    const sleepBaseRes = await waitSleeping(cdp, label);
    const sleepBase = sleepBaseRes.st;
    log(`${label} ngủ baseline: time=${sleepBase.timeText} hook=${JSON.stringify(sleepBase.hook)} draws=${await draws()} sleepWaitTimedOut=${sleepBaseRes.timedOut}`);
    out.sleepBaseline = snap(sleepBase, await draws());
    out.sleepBaseline.sleepWaitTimedOut = sleepBaseRes.timedOut;

    // Tab trắng dùng chung để làm tab app thành hidden thật. background:
    // true là BẮT BUỘC (xem ghi chú đầu file): tạo foreground sẽ tự
    // activate tab trắng và phá đo pre.
    const blank = await cdp.send("Target.createTarget", { url: "about:blank", background: true });
    const hideTab = async () => cdp.send("Target.activateTarget", { targetId: blank.targetId });
    const showTab = async () => cdp.send("Target.activateTarget", { targetId: appTargetId });

    // ---------- CASE D: hồi quy ngủ ngắn 3 s (đợt 22 C) ----------
    {
      await cdp.pressKey("Home", "Home", 36);
      const preRes = await waitSleeping(cdp, label);
      const preSt = preRes.st;
      const pre = snap(preSt, await draws());
      await hideTab();
      await sleep(3000);
      const hidden = snap(await cdp.evaluate(STATE_JS), await draws());
      await showTab();
      await sleep(1000);
      const post1 = snap(await cdp.evaluate(STATE_JS), await draws());
      await sleep(3000);
      const post4 = snap(await cdp.evaluate(STATE_JS), await draws());
      const bc = await cdp.evaluate(BC_READ_JS);
      log(`${label} CASE-D ẩn 3s: pre=${JSON.stringify(pre)} hidden=${JSON.stringify(hidden)} post1s=${JSON.stringify(post1)} post4s=${JSON.stringify(post4)} visChanges=${JSON.stringify(bc.visChanges)}`);
      out.caseD_shortHide = { pre, sleepWaitTimedOut: preRes.timedOut, hidden, post1s: post1, post4s: post4, visChanges: bc.visChanges };
    }

    // ---------- CASE A: ẩn lâu LONG_HIDE_MS ----------
    {
      await cdp.pressKey("Home", "Home", 36);
      const preRes = await waitSleeping(cdp, label);
      const preSt = preRes.st;
      const pre = snap(preSt, await draws());
      await hideTab();
      const samples = [];
      // Đọc lúc ẩn ở ~5 s, ~30 s và cuối khoảng ẩn (nếu khoảng ẩn < 30 s
      // thì chỉ đọc các mốc <= khoảng ẩn).
      const marks = [5000, 30000, LONG_HIDE_MS].filter((m, i, a) => m <= LONG_HIDE_MS && a.indexOf(m) === i).sort((a, b) => a - b);
      let elapsed = 0;
      for (const m of marks) {
        if (m > elapsed) { await sleep(m - elapsed); elapsed = m; }
        samples.push({ atMs: m, ...snap(await cdp.evaluate(STATE_JS), await draws()) });
      }
      if (elapsed < LONG_HIDE_MS) { await sleep(LONG_HIDE_MS - elapsed); }
      await showTab();
      await sleep(1000);
      const post1 = snap(await cdp.evaluate(STATE_JS), await draws());
      await sleep(3000);
      const post4 = snap(await cdp.evaluate(STATE_JS), await draws());
      await sleep(6000);
      const post10 = snap(await cdp.evaluate(STATE_JS), await draws());
      const bc = await cdp.evaluate(BC_READ_JS);
      log(`${label} CASE-A ẩn ${LONG_HIDE_MS}ms: pre=${JSON.stringify(pre)}`);
      for (const s of samples) log(`${label} CASE-A lúc ẩn ${s.atMs}ms: ${JSON.stringify(s)}`);
      log(`${label} CASE-A sau hiện: 1s=${JSON.stringify(post1)} 4s=${JSON.stringify(post4)} 10s=${JSON.stringify(post10)} visChanges=${JSON.stringify(bc.visChanges)}`);
      out.caseA_longHide = { pre, sleepWaitTimedOut: preRes.timedOut, hiddenSamples: samples, post1s: post1, post4s: post4, post10s: post10, visChanges: bc.visChanges };
    }

    // ---------- CASE B: ẩn lúc ĐANG PHÁT ----------
    {
      await cdp.pressKey("Home", "Home", 36);
      await waitSleeping(cdp, label);
      await cdp.pressKey("Space", " ", 32);
      await sleep(2000);
      const playPre = snap(await cdp.evaluate(STATE_JS), await draws());
      log(`${label} CASE-B trước ẩn (đang phát): ${JSON.stringify(playPre)}`);
      await hideTab();
      const hiddenSamples = [];
      const marks = [5000, PLAY_HIDE_MS].filter((m, i, a) => m <= PLAY_HIDE_MS && a.indexOf(m) === i).sort((a, b) => a - b);
      let elapsed = 0;
      for (const m of marks) {
        if (m > elapsed) { await sleep(m - elapsed); elapsed = m; }
        hiddenSamples.push({ atMs: m, ...snap(await cdp.evaluate(STATE_JS), await draws()) });
      }
      if (elapsed < PLAY_HIDE_MS) { await sleep(PLAY_HIDE_MS - elapsed); }
      await showTab();
      await sleep(1000);
      const post1 = snap(await cdp.evaluate(STATE_JS), await draws());
      await sleep(2000);
      const post3 = snap(await cdp.evaluate(STATE_JS), await draws());
      for (const s of hiddenSamples) log(`${label} CASE-B lúc ẩn ${s.atMs}ms: ${JSON.stringify(s)}`);
      log(`${label} CASE-B sau hiện: 1s=${JSON.stringify(post1)} 3s=${JSON.stringify(post3)}`);
      // Dừng phát + chờ ngủ lại.
      await cdp.pressKey("Space", " ", 32);
      const pausedRes = await waitSleeping(cdp, label);
      const paused = snap(pausedRes.st, await draws());
      log(`${label} CASE-B sau dừng + ngủ lại: ${JSON.stringify(paused)} sleepWaitTimedOut=${pausedRes.timedOut}`);
      const drift = (post3.lastDrawn !== null && playPre.lastDrawn !== null)
        ? { lastDrawnDeltaVsPreHide: +(post3.lastDrawn - playPre.lastDrawn).toFixed(4),
            expectedApprox: 3, note: "post3 đo ~3s sau hiện; nếu playhead nhảy vọt bằng thời gian ẩn thì delta ~13s" }
        : null;
      out.caseB_hiddenWhilePlaying = { prePlay: playPre, hiddenSamples, post1s: post1, post3s: post3, pausedAfter: paused, pausedSleepWaitTimedOut: pausedRes.timedOut, driftCheck: drift };
    }

    // ---------- CASE C: bfcache (để cuối — có thể reload trang) ----------
    {
      const bcPre = await cdp.evaluate(BC_READ_JS);
      const attempts = [];
      // Lần 1: about:blank rồi quay lại bằng history. Ghi trạng thái lúc
      // rời trang (depart) để đối chiếu frame/vòng lặp sau khi về.
      const depart1 = snap(await cdp.evaluate(STATE_JS), await draws());
      try {
        await cdp.send("Page.navigate", { url: "about:blank" }, cdp.sessionId);
        await sleep(2000);
        const hist = await cdp.send("Page.getNavigationHistory", {}, cdp.sessionId);
        const idx = hist.currentIndex;
        const backEntry = hist.entries[idx - 1];
        let back = null;
        if (backEntry) {
          await cdp.send("Page.navigateToHistoryEntry", { entryId: backEntry.id }, cdp.sessionId);
          await sleep(3000);
          // Nếu trang reload hoàn toàn thì phải chờ sample sẵn sàng lại.
          try {
            const st = await cdp.evaluate(STATE_JS);
            if (!st.timeText) { for (let i = 0; i < 30; i++) { await sleep(1000); const s2 = await cdp.evaluate(STATE_JS); if (s2.timeText) break; } }
          } catch (e) { back = { error: String(e).slice(0, 200) }; }
          if (!back) {
            const bcAfter = await cdp.evaluate(BC_READ_JS).catch((e) => ({ present: false, error: String(e).slice(0, 200) }));
            const stAfter = await cdp.evaluate(STATE_JS).catch(() => null);
            back = { bcAfter, bundleAfter: stAfter ? stAfter.bundle : null, hrefAfter: await cdp.evaluate("location.href").catch(() => null) };
          }
        } else {
          back = { error: "không có history entry trước đó để quay lại" };
        }
        if (back && !back.error) Object.assign(back, { depart: depart1 }, await postRestore(cdp, draws));
        attempts.push({ to: "about:blank", pre: bcPre, ...back });
        log(`${label} CASE-C lần 1 (about:blank -> back): ${JSON.stringify(back)}`);
      } catch (e) {
        attempts.push({ to: "about:blank", error: String(e).slice(0, 300) });
        log(`${label} CASE-C lần 1 lỗi: ${e.message}`);
      }
      // Lần 2: chỉ thử khi lần 1 chưa phải bfcache và trang vẫn là app
      // (nếu lần 1 đã reload thì probe đã mất — lần 2 cần cài lại probe
      // trên trang mới rồi mới rời trang lần nữa).
      const firstIsBfcache = attempts[0] && attempts[0].bcAfter && attempts[0].bcAfter.present
        && attempts[0].bcAfter.pageshows && attempts[0].bcAfter.pageshows.some((p) => p.persisted);
      if (!firstIsBfcache) {
        try {
          const hrefNow = await cdp.evaluate("location.href").catch(() => "");
          if (hrefNow.startsWith(previewUrl)) {
            // Trang đã reload ở lần 1: chờ sample + cài lại probe.
            for (let i = 0; i < 30; i++) {
              const s = await cdp.evaluate(STATE_JS).catch(() => null);
              if (s && s.timeText) break;
              await sleep(1000);
            }
            await cdp.evaluate(BC_PROBE_JS);
            const bcPre2 = await cdp.evaluate(BC_READ_JS);
            const depart2 = snap(await cdp.evaluate(STATE_JS), await draws());
            await cdp.send("Page.navigate", { url: "data:text/html,<title>v23-away</title><h1>away</h1>" }, cdp.sessionId);
            await sleep(2000);
            const hist = await cdp.send("Page.getNavigationHistory", {}, cdp.sessionId);
            const backEntry = hist.entries[hist.currentIndex - 1];
            let back = null;
            if (backEntry) {
              await cdp.send("Page.navigateToHistoryEntry", { entryId: backEntry.id }, cdp.sessionId);
              await sleep(3000);
              const bcAfter = await cdp.evaluate(BC_READ_JS).catch((e) => ({ present: false, error: String(e).slice(0, 200) }));
              const stAfter = await cdp.evaluate(STATE_JS).catch(() => null);
              back = { bcAfter, bundleAfter: stAfter ? stAfter.bundle : null, hrefAfter: await cdp.evaluate("location.href").catch(() => null) };
            } else back = { error: "không có history entry trước đó" };
            if (back && !back.error) Object.assign(back, { depart: depart2 }, await postRestore(cdp, draws));
            attempts.push({ to: "data:text/html", pre: bcPre2, ...back });
            log(`${label} CASE-C lần 2 (data: -> back): ${JSON.stringify(back)}`);
          } else {
            attempts.push({ to: "data:text/html", skipped: `trang hiện tại không còn là app (href=${hrefNow})` });
            log(`${label} CASE-C lần 2 bỏ qua: href=${hrefNow}`);
          }
        } catch (e) {
          attempts.push({ to: "data:text/html", error: String(e).slice(0, 300) });
          log(`${label} CASE-C lần 2 lỗi: ${e.message}`);
        }
      }
      const anyBfcache = attempts.some((a) => a.bcAfter && a.bcAfter.present
        && a.bcAfter.pageshows && a.bcAfter.pageshows.some((p) => p.persisted));
      out.caseC_bfcache = {
        measured: anyBfcache,
        verdict: anyBfcache
          ? "BFCACHE_THAT: pageshow persisted=true, marker còn sống"
          : "NOT_MEASURED: không lần nào tạo được bfcache thật qua CDP/Xvfb (marker mất = reload, hoặc persisted=false) — KHÔNG bịa số",
        attempts,
      };
      log(`${label} CASE-C kết luận: ${out.caseC_bfcache.verdict}`);
    }

    out.ok = true;
    out.loadavgEnd = loadavg();
    return out;
  } finally {
    try { chrome.kill("SIGKILL"); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  log(`binaries thử: ${BINARIES.join(" | ")} | preview-port=${PREVIEW_PORT} | display=${DISPLAY} | out=${OUT_PATH} | longHide=${LONG_HIDE_MS}ms playHide=${PLAY_HIDE_MS}ms`);
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
    if (!result) { log("DONE v23-hidden-bfcache: KHÔNG đo được run nào"); process.exit(2); }
    log(`=== TỔNG HỢP ===`);
    log(JSON.stringify(result, null, 1));
    // Append run vào file JSON kết quả (giữ các run trước).
    try {
      fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
      let doc = { generatedBy: "measure-v23-hidden-bfcache-pipe.mjs", bundle: result.bundle, runs: [] };
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
    log(`DONE v23-hidden-bfcache ok=${result.ok}`);
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
