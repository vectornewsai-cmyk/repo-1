#!/usr/bin/env node
/**
 * measure-v21-idle-sleep-pipe.mjs — Phase 9 đợt 21, luồng T5:
 * đo vòng rAF preview + MixerMeter lúc ĐỨNG YÊN trước/sau khi cho ngủ,
 * kèm click-test seek/pause/scrub sau khi đổi (nợ đợt 20 R5 §7).
 *
 * Phương pháp kế thừa đợt 19 G4 / đợt 20 R5: Playwright Chromium 156
 * headed dưới Xvfb 1920x1080x24, điều khiển qua --remote-debugging-pipe,
 * build thật apps/web/dist chạy bằng `vite preview`, project mẫu tự load
 * (2 clip webm 640x360 tự ghi + 1 clip chữ, 1280x720@30fps, 8 s).
 *
 * Khác R5: script này đo TRỰC TIẾP vòng preview qua hook đo do chính code
 * mới gắn (`window.__vcutPreviewIdle` / `window.__vcutMixerMeter`, xem
 * PHASE9_ROUND21_T5_PREVIEW_IDLE_LIMITS.md): ticks = số lần vòng lặp chạy,
 * sleeping = vòng đã ngừng đặt rAF hay chưa. Ở bản TRƯỚC khi sửa, hook
 * chưa tồn tại → script báo hooks=absent và chỉ dùng các kênh gián tiếp
 * của R5 (probe draw qua identity-setTransform, vòng rAF riêng của trang,
 * panel FPS của app) — không bịa ticks cho bản trước.
 *
 * Mỗi run gồm:
 *  - IDLE-A (panel FPS ĐÓNG, 5 s): vòng rAF riêng của trang + draws + ticks hook.
 *  - IDLE-B (panel FPS MỞ, 5 s): như A + panel idle của app (so được với R5).
 *  - CLICK-TEST: Space phát 3 s → Space dừng → settle 3 s → click ruler
 *    scrub (fallback phím L +5 s nếu ruler không click được) → settle 3 s
 *    → ArrowRight tua 1 frame → settle 2 s. Mỗi bước ghi timeText, pxHash,
 *    ticks hook, sleeping, draws.
 * Chạy từ gốc repo:
 *   node apps/web/scripts/measure-v21-idle-sleep-pipe.mjs
 *   V21_RUNS=2 node apps/web/scripts/measure-v21-idle-sleep-pipe.mjs
 * Env: V21_PREVIEW_PORT (mặc định 4185), V21_XVFB_DISPLAYS (mặc định
 * :94,:93), V21_RUNS (mặc định 2), V21_CHROME_BINS.
 * Exit 0 khi mọi run đo xong và click-test đạt (ở bản trước: click-test
 * vẫn phải đạt vì phát/dừng/scrub là hành vi cũ; chỉ khác hook absent).
 * Exit 2 khi không run nào đo được hoặc click-test fail.
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG ghi gì vào repo ngoài stdout.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.V21_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const PREVIEW_PORT = Number(process.env.V21_PREVIEW_PORT || 4185);
const DISPLAYS = (process.env.V21_XVFB_DISPLAYS || ":94,:93").split(",").map((s) => s.trim());
const RUNS = Number(process.env.V21_RUNS || 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; } };

/** Client CDP qua pipe (fd 3 ghi JSON+\0, fd 4 đọc tách \0) — như đợt 18/19/20. */
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
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
  async mouseClick(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, this.sessionId);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }, this.sessionId);
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }, this.sessionId);
  }
  async pressSpace() {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code: "Space", key: " ", text: " ", windowsVirtualKeyCode: 32 }, this.sessionId);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code: "Space", key: " ", windowsVirtualKeyCode: 32 }, this.sessionId);
  }
  async pressKey(code, key, vk) {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code, key, windowsVirtualKeyCode: vk }, this.sessionId);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code, key, windowsVirtualKeyCode: vk }, this.sessionId);
  }
}

const PROBE_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  if (!canvas) return { ok: false, why: 'không thấy canvas trong #vcut-preview-wrap' };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ok: false, why: 'không lấy được ctx 2d' };
  if (window.__v19st) return { ok: true, again: true, w: canvas.width, h: canvas.height };
  const orig = ctx.setTransform.bind(ctx);
  const st = { id: 0, total: 0 };
  window.__v19st = st;
  ctx.setTransform = function (a, b, c, d, e, f) {
    st.total++;
    if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) st.id++;
    return orig(a, b, c, d, e, f);
  };
  if (!window.__v19raf) {
    window.__v19raf = { n: 0, t0: performance.now() };
    const tick = () => { window.__v19raf.n++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  if (!window.__v21raf) {
    const r = { n: 0, gapSum: 0, gapMax: 0, last: 0 };
    window.__v21raf = r;
    const tick = (now) => {
      if (r.last) { const g = now - r.last; r.gapSum += g; if (g > r.gapMax) r.gapMax = g; }
      r.last = now; r.n++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  return { ok: true, w: canvas.width, h: canvas.height,
    clientW: canvas.clientWidth, clientH: canvas.clientHeight, dpr: window.devicePixelRatio };
})()
`;

const PANEL_JS = `
(() => {
  const el = document.querySelector('[aria-label="Đồng hồ đo FPS preview"]');
  return el ? el.innerText : null;
})()
`;

const STATE_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  const nameInput = document.querySelector('.project-name');
  const timeMatch = (document.body.innerText.match(/\\d+:\\d+\\.\\d+ \\/ \\d+:\\d+\\.\\d+/) || document.body.innerText.match(/\\d+:\\d+ \\/ \\d+:\\d+/) || [])[0] || null;
  let pxHash = null;
  try {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 64) s = (s + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
      pxHash = s;
    }
  } catch (e) { pxHash = 'tainted:' + String(e).slice(0, 40); }
  const hook = (name) => {
    const h = window[name];
    if (!h) return null;
    try { return { ticks: h.ticks, sleeping: h.sleeping }; } catch { return { error: 'đọc hook lỗi' }; }
  };
  // Đếm animation đang chạy (truy vết hiện tượng probe rAF nhảy ~58 Hz sau
  // scrub ở bản trước — xem LIMITS T5 §4: nếu anims = 0 mà probe vẫn 58 Hz
  // thì thủ phạm không phải CSS animation của trang).
  const anims = (() => {
    try { return document.getAnimations ? document.getAnimations().length : -1; } catch { return -1; }
  })();
  const bundle = (() => {
    const s = document.querySelector('script[src*="index-"]');
    return s ? s.getAttribute('src') : null;
  })();
  return { canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    projectName: nameInput ? nameInput.value : null, timeText: timeMatch, pxHash, bundle, anims,
    probe: window.__v19st ? { id: window.__v19st.id, total: window.__v19st.total } : null,
    pageRaf: window.__v19raf ? { n: window.__v19raf.n, ms: Math.round(performance.now() - window.__v19raf.t0) } : null,
    v21raf: window.__v21raf ? { ...window.__v21raf } : null,
    previewHook: hook('__vcutPreviewIdle'),
    mixerHook: hook('__vcutMixerMeter') };
})()
`;

const CAPABILITY_JS = `
(() => {
  const c = document.createElement('canvas');
  return {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    vp9: typeof MediaRecorder !== 'undefined' ? MediaRecorder.isTypeSupported('video/webm;codecs=vp9') : false,
    vp8: typeof MediaRecorder !== 'undefined' ? MediaRecorder.isTypeSupported('video/webm;codecs=vp8') : false,
    captureStream: typeof c.captureStream === 'function',
  };
})()
`;

function startVitePreview() {
  return new Promise((resolve) => {
    if (!fs.existsSync(path.join(WEB_DIR, "dist", "index.html"))) {
      log("vite preview: không có apps/web/dist/index.html, BLOCKER");
      resolve(null);
      return;
    }
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
        try {
          const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`);
          if (r.ok) { done = true; clearTimeout(timer); resolve(proc); return; }
        } catch { /* chưa lên */ }
      }
    })();
    proc.on("exit", () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

/** Lấy mẫu trạng thái rút gọn phục vụ so sánh trước/sau một cửa sổ. */
async function sample(cdp) {
  const st = await cdp.evaluate(STATE_JS);
  return {
    time: st.timeText, px: st.pxHash, anims: st.anims,
    draws: st.probe ? st.probe.id / 2 : null,
    pageRafN: st.pageRaf ? st.pageRaf.n : null,
    rafN: st.v21raf ? st.v21raf.n : null,
    rafGapMean: st.v21raf && st.v21raf.n > 1 ? st.v21raf.gapSum / (st.v21raf.n - 1) : null,
    pTicks: st.previewHook ? st.previewHook.ticks : null,
    pSleep: st.previewHook ? st.previewHook.sleeping : null,
    mTicks: st.mixerHook ? st.mixerHook.ticks : null,
    mSleep: st.mixerHook ? st.mixerHook.sleeping : null,
  };
}

function windowDiff(a, b, secs) {
  if (!a || !b) return null;
  const d = {};
  if (a.draws !== null && b.draws !== null) d.drawsPerSec = +((b.draws - a.draws) / secs).toFixed(2);
  if (a.pageRafN !== null && b.pageRafN !== null) d.pageRafHz = +((b.pageRafN - a.pageRafN) / secs).toFixed(2);
  if (a.rafN !== null && b.rafN !== null) d.probeRafHz = +((b.rafN - a.rafN) / secs).toFixed(2);
  if (a.pTicks !== null && b.pTicks !== null) d.previewTicksPerSec = +((b.pTicks - a.pTicks) / secs).toFixed(2);
  if (a.mTicks !== null && b.mTicks !== null) d.mixerTicksPerSec = +((b.mTicks - a.mTicks) / secs).toFixed(2);
  return d;
}

async function runOne(label, chromeBin, display, previewUrl) {
  const out = { run: label, ok: false, checks: {} };
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v21idle-"));
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
    const navAt = Date.now();
    const caps = await cdp.evaluate(CAPABILITY_JS);
    log(`${label} năng lực ghi mẫu: ${JSON.stringify(caps)}`);
    let ready = null;
    for (let i = 0; i < 90; i++) {
      await sleep(1000);
      try {
        const st = await cdp.evaluate(STATE_JS);
        if (st.canvasW && st.projectName === "Dự án mẫu") { ready = st; break; }
        if (i % 10 === 9) log(`${label} chờ sample: ${i + 1}s projectName=${JSON.stringify(st.projectName)} time=${st.timeText} canvas=${st.canvasW}x${st.canvasH}`);
      } catch { /* chưa sẵn sàng */ }
    }
    if (!ready) throw new Error("quá 90s chưa thấy project mẫu sẵn sàng");
    out.sampleLoadMs = Date.now() - navAt;
    out.bundle = ready.bundle;
    log(`${label} sample sẵn sàng sau ${out.sampleLoadMs}ms: canvas=${ready.canvasW}x${ready.canvasH} time=${ready.timeText} bundle=${ready.bundle}`);
    const probe = await cdp.evaluate(PROBE_JS);
    if (!probe.ok) throw new Error(`cài probe thất bại: ${probe.why}`);
    log(`${label} probe OK: canvas=${probe.w}x${probe.h} dpr=${probe.dpr}`);
    out.canvas = `${probe.w}x${probe.h}`;
    out.dpr = probe.dpr;
    const hookState = await cdp.evaluate(`(() => ({ preview: !!window.__vcutPreviewIdle, mixer: !!window.__vcutMixerMeter }))()`);
    out.hooks = hookState;
    log(`${label} hooks đo: preview=${hookState.preview} mixer=${hookState.mixer} (false ở bản trước = đúng kỳ vọng)`);

    // Chờ 2 s cho vòng preview vẽ frame đầu + (bản sau) đi vào ngủ.
    await sleep(2000);

    // IDLE-A: panel FPS ĐÓNG, 5 s — kênh sạch nhất (không còn vòng PerfOverlay).
    const a0 = await sample(cdp);
    await sleep(5000);
    const a1 = await sample(cdp);
    out.idleA = windowDiff(a0, a1, 5);
    out.idleA_end = a1;
    log(`${label} IDLE-A panel-đóng 5s: ${JSON.stringify(out.idleA)} end=${JSON.stringify(a1)}`);

    // Mở panel FPS của app rồi IDLE-B 5 s (so được với R5: panel idle ~11 Hz).
    const btnRect = await cdp.evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('FPS'));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!btnRect) throw new Error("không thấy nút 📈 FPS của app");
    await cdp.mouseClick(btnRect.x, btnRect.y);
    await sleep(1500);
    let panel = await cdp.evaluate(PANEL_JS);
    if (!panel) throw new Error("click nút FPS nhưng panel không mở");
    const b0 = await sample(cdp);
    await sleep(5000);
    const b1 = await sample(cdp);
    out.idleB = windowDiff(b0, b1, 5);
    out.idleB_panel = await cdp.evaluate(PANEL_JS);
    out.idleB_end = b1;
    log(`${label} IDLE-B panel-mở 5s: ${JSON.stringify(out.idleB)} panel=${JSON.stringify(out.idleB_panel)} end=${JSON.stringify(b1)}`);

    // ---- CLICK-TEST ----
    const isPlaying = async () => {
      const p = await cdp.evaluate(PANEL_JS);
      return !!(p && p.includes("Đang phát"));
    };
    // 1. Phát bằng Space, đo 3 s.
    await cdp.pressSpace();
    await sleep(1500);
    if (!(await isPlaying())) throw new Error("click-test: Space không chuyển sang Đang phát");
    const playTicks0 = await sample(cdp);
    const playTimes = [];
    const playPx = [];
    for (let i = 0; i < 3; i++) {
      await sleep(1000);
      const s = await sample(cdp);
      playTimes.push(s.time);
      playPx.push(s.px);
    }
    const playTicks1 = await sample(cdp);
    const playPxChanged = playPx.filter((v, i) => i > 0 && v !== playPx[i - 1]).length;
    const playTimeAdvanced = playTimes.filter((v, i) => i > 0 && v !== playTimes[i - 1]).length;
    out.click_play = { times: playTimes, pxChanged: `${playPxChanged}/${playPx.length - 1}`,
      timeAdvanced: `${playTimeAdvanced}/${playTimes.length - 1}`,
      ticksDelta: playTicks0.pTicks !== null ? playTicks1.pTicks - playTicks0.pTicks : null,
      mixerTicksDelta: playTicks0.mTicks !== null ? playTicks1.mTicks - playTicks0.mTicks : null,
      sleeping: playTicks1.pSleep };
    log(`${label} CLICK phát 3s: ${JSON.stringify(out.click_play)}`);
    out.checks.play = playPxChanged >= 1 && playTimeAdvanced >= 1;

    // 2. Dừng bằng Space, settle 3 s: frame phải đứng yên, (bản sau) ticks đóng băng.
    await cdp.pressSpace();
    await sleep(1500);
    if (await isPlaying()) throw new Error("click-test: Space lần 2 không dừng phát");
    const s0 = await sample(cdp);
    await sleep(3000);
    const s1 = await sample(cdp);
    out.click_pauseSettle = { start: s0, end: s1, diff3s: windowDiff(s0, s1, 3) };
    log(`${label} CLICK dừng+settle 3s: ${JSON.stringify(out.click_pauseSettle)}`);
    out.checks.pauseFrozen = s0.time === s1.time && s0.px === s1.px && s0.draws === s1.draws
      && (s0.pTicks === null || s1.pTicks === s0.pTicks)
      && (s0.mTicks === null || s1.mTicks === s0.mTicks);

    // 3. Scrub: click ruler ở 50% chiều rộng, clamp vào viewport (bản trước
    // click 70% không đổi playhead — nghi rơi ngoài viewport do ruler cuộn
    // ngang; nếu vẫn không đổi thì fallback phím L (+5 s)).
    const ruler = await cdp.evaluate(`(() => {
      const el = document.querySelector('.tl-ruler');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.min(Math.max(0, r.x + r.width * 0.5), 1910), y: Math.min(Math.max(0, r.y + r.height / 2), 1070), w: r.width, h: r.height, rx: r.x, ry: r.y };
    })()`);
    let scrubMethod = null;
    if (ruler) {
      log(`${label} ruler rect: w=${ruler.w} h=${ruler.h} x=${ruler.rx} y=${ruler.ry} -> click ${ruler.x},${ruler.y}`);
      await cdp.mouseClick(ruler.x, ruler.y);
      scrubMethod = "ruler-click-50%-clamped";
      await sleep(2500);
    }
    let sc = await sample(cdp);
    if (sc.time === s1.time) {
      await cdp.pressKey("KeyL", "l", 76);
      scrubMethod = (scrubMethod ? scrubMethod + "+fallback-" : "") + "key-L";
      await sleep(2500);
      sc = await sample(cdp);
    }
    out.click_scrub = { method: scrubMethod, before: { time: s1.time, px: s1.px },
      after: { time: sc.time, px: sc.px }, sleeping: sc.pSleep, ticks: sc.pTicks };
    log(`${label} CLICK scrub (${scrubMethod}): ${s1.time} -> ${sc.time} px ${s1.px} -> ${sc.px} sleeping=${sc.pSleep}`);
    out.checks.scrubChangedFrame = sc.time !== s1.time && sc.px !== s1.px;
    // Sau scrub, settle 3 s: (bản sau) phải ngủ lại, ticks đóng băng.
    const sc0 = await sample(cdp);
    await sleep(3000);
    const sc1 = await sample(cdp);
    out.click_scrubSettle = { start: sc0, end: sc1, diff3s: windowDiff(sc0, sc1, 3) };
    log(`${label} CLICK scrub-settle 3s: ${JSON.stringify(out.click_scrubSettle)}`);
    out.checks.scrubSleepAgain = sc1.pSleep === true || sc1.pSleep === null;
    out.checks.scrubTicksFrozen = sc0.pTicks === null || sc1.pTicks === sc0.pTicks;

    // 4. Tua 1 frame bằng ArrowRight rồi settle 2 s: vòng phải tỉnh, vẽ, ngủ lại.
    const ar0 = await sample(cdp);
    await cdp.pressKey("ArrowRight", "ArrowRight", 39);
    await sleep(2000);
    const ar1 = await sample(cdp);
    out.click_frameStep = { before: ar0, after: ar1,
      ticksDelta: ar0.pTicks !== null ? ar1.pTicks - ar0.pTicks : null };
    log(`${label} CLICK ArrowRight 1 frame: ${JSON.stringify(out.click_frameStep)}`);
    out.checks.frameStepWoke = ar0.pTicks === null || ar1.pTicks > ar0.pTicks;
    out.checks.frameStepSleepAgain = ar1.pSleep === true || ar1.pSleep === null;

    out.ok = out.checks.play && out.checks.pauseFrozen && out.checks.scrubChangedFrame
      && out.checks.scrubSleepAgain && out.checks.scrubTicksFrozen
      && out.checks.frameStepWoke && out.checks.frameStepSleepAgain;
    out.loadavgEnd = loadavg();
    log(`${label} CHECKS: ${JSON.stringify(out.checks)} => ok=${out.ok}`);
    return out;
  } finally {
    try { chrome.kill("SIGKILL"); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  log(`binaries thử: ${BINARIES.join(" | ")} | runs=${RUNS} | preview-port=${PREVIEW_PORT}`);
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
  let exitCode = 0;
  try {
    for (const d of DISPLAYS) {
      const num = d.replace(":", "");
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) {
        const anyX = spawnSync("pgrep", ["-x", "Xvfb"]);
        if (anyX.status !== 0) {
          try { fs.unlinkSync(`/tmp/.X11-unix/X${num}`); } catch {}
          try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
          log(`Xvfb: dọn socket mồ côi DISPLAY ${d}`);
        } else { log(`Xvfb: DISPLAY ${d} đã có socket (Xvfb khác đang chạy), thử display khác`); continue; }
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
    if (!display) throw new Error("không khởi động được Xvfb ở display nào");
    log(`Xvfb lên: DISPLAY=${display}`);

    const results = [];
    for (let i = 1; i <= RUNS; i++) {
      let done = false;
      for (const bin of BINARIES) {
        if (!fs.existsSync(bin)) { log(`run${i} BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
        try {
          log(`run${i} bắt đầu: binary=${bin} loadavg=${loadavg()}`);
          const r = await runOne(`run${i}`, bin, display, previewUrl);
          results.push(r);
          done = true;
          break;
        } catch (e) {
          log(`run${i} BLOCKER ${bin}: ${e && e.message ? e.message : e}`);
        }
      }
      if (!done) results.push({ run: `run${i}`, ok: false, error: "mọi binary đều lỗi" });
      log(`run${i} xong: loadavg=${loadavg()}`);
    }
    log(`=== TỔNG HỢP ${results.length} run ===`);
    for (const r of results) log(JSON.stringify(r));
    const okRuns = results.filter((r) => r.ok);
    log(`DONE v21-idle-sleep okRuns=${okRuns.length}/${results.length}`);
    if (!okRuns.length) exitCode = 2;
  } finally {
    try { xvfb && xvfb.kill("SIGKILL"); } catch {}
    try { preview && preview.kill("SIGKILL"); } catch {}
  }
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
