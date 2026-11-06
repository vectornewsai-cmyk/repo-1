#!/usr/bin/env node
/**
 * measure-v22-sleep-scrub-pipe.mjs — Phase 9 đợt 22, luồng C:
 * truy nguyên scrub chuột + đo tab ẩn/hiện trong lúc preview ngủ.
 *
 * Phương pháp kế thừa đợt 18/19/20/21 (T5): Playwright Chromium 156
 * headed dưới Xvfb 1920x1080x24, điều khiển qua --remote-debugging-pipe,
 * build thật apps/web/dist chạy bằng `vite preview`, project mẫu tự load
 * (2 clip webm 640x360 + 1 clip chữ, 1280x720@30fps, 8 s).
 *
 * Gồm 3 pha, chạy trên CÙNG một trang (đo trước/sau sửa bằng cách chạy
 * lại script sau khi rebuild):
 *  - PHA A (scrub click): gắn probe đếm event THẬT trên .tl-ruler
 *    (pointerdown / mousedown / click / pointermove / pointerup, cả
 *    bubble trên ruler lẫn capture trên window) + elementFromPoint tại
 *    điểm click + computed style. Sau đó click chuột CDP vào ruler 50%
 *    và đọc: event nào đã nổ, playhead có đổi không.
 *  - PHA A2 (click đơn sau khi modal đã đóng): click đơn lần nữa vào
 *    ruler 50% — kiểm chứng click scrub (không kéo) có đổi playhead
 *    khi không còn modal chắn hay không.
 *  - PHA B (scrub kéo): mousePressed ở 30% ruler, mouseMoved từng bước
 *    tới 70%, mouseReleased — đọc playhead trong/khi thả và sau settle.
 *    Đối chứng: dispatch PointerEvent bằng JS trực tiếp lên ruler để
 *    chứng minh handler React tự nó có chạy không.
 *  - PHA C (tab ẩn/hiện lúc ngủ): pause + settle tới khi hook báo
 *    sleeping=true, ghi px hash + ticks; mở tab trắng thứ 2 và
 *    activate nó (tab app thành hidden THẬT, visibilitychange nổ thật),
 *    chờ 3 s, activate lại tab app (visible THẬT), ghi lại ticks/draws/
 *    px hash/sleeping sau 3 s. Kết luận: canvas có giữ frame cũ không,
 *    vòng có tỉnh rồi ngủ lại không.
 *
 * Chạy từ gốc repo:
 *   node apps/web/scripts/measure-v22-sleep-scrub-pipe.mjs
 * Env: V22_PREVIEW_PORT (mặc định 4186), V22_XVFB_DISPLAY (mặc định :95),
 *   V22_CHROME_BINS (mặc định Playwright chromium-1248 rồi /opt/meta-chromium).
 * Exit 0 khi đo xong cả 3 pha (kể cả khi scrub click FAIL — fail đó là
 * dữ liệu chẩn đoán, không phải lỗi harness; script in DIAG kết luận).
 * Exit 2 khi harness không dựng được trang (không đo được gì).
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG ghi gì vào repo ngoài stdout.
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
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "measure-v22-sleep-scrub-pipe");

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.V22_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const PREVIEW_PORT = Number(process.env.V22_PREVIEW_PORT || 4186);
// Chọn display trống THẬT: chỉ tin socket khi có Xvfb đang chạy; socket
// mồ côi (không còn tiến trình Xvfb nào) thì dọn, không tái dùng mù như
// bản đầu (pgrep chung trúng Xvfb của luồng khác -> dùng display chết).
const DISPLAYS_CANDIDATES = (process.env.V22_XVFB_DISPLAYS || ":96,:97,:98,:99").split(",").map((s) => s.trim());
const DISPLAY = process.env.V22_XVFB_DISPLAY || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; } };

/** Client CDP qua pipe (fd 3 ghi JSON+\0, fd 4 đọc tách \0) — như đợt 18/21. */
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    // Pipe socket có thể ECONNRESET nếu Chrome chết sớm — nuốt lỗi ở đây
    // để harness báo BLOCKER sạch thay vì crash unhandled (bài học run 2).
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
  async mouseDown(x, y) {
    await this.mouseMove(x, y);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }, this.sessionId);
  }
  async mouseUp(x, y) {
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
  try {
    if (canvas) {
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
    hidden: document.hidden,
    hook: hook ? { ticks: hook.ticks, sleeping: hook.sleeping, lastDrawn: hook.lastDrawn,
      lastRequested: hook.lastRequested, pendingSeek: hook.pendingSeek, redrawFlag: hook.redrawFlag } : null };
})()
`;

/** Probe event trên ruler: đếm từng loại event + ghi event cuối + hit-test. */
const PROBE_JS = `
(() => {
  const el = document.querySelector('.tl-ruler');
  if (!el) return { ok: false, why: 'không thấy .tl-ruler' };
  if (window.__v22probe) return { ok: true, again: true };
  const st = { pointerdown: 0, pointermove: 0, pointerup: 0, mousedown: 0, mousemove: 0,
    mouseup: 0, click: 0, winPointerdown: 0, winPointermove: 0, winPointerup: 0,
    winResize: 0, winFocus: 0, winPageshow: 0,
    lastPointerdown: null, lastMousedown: null, lastClick: null, visChanges: [] };
  window.__v22probe = st;
  const rec = (key, e) => { st[key]++; };
  el.addEventListener('pointerdown', (e) => { st.pointerdown++; st.lastPointerdown = { x: e.clientX, y: e.clientY, type: e.pointerType, button: e.button, target: e.target && e.target.className }; });
  el.addEventListener('pointermove', () => { st.pointermove++; });
  el.addEventListener('pointerup', () => { st.pointerup++; });
  el.addEventListener('mousedown', (e) => { st.mousedown++; st.lastMousedown = { x: e.clientX, y: e.clientY, button: e.button, target: e.target && e.target.className }; });
  el.addEventListener('mousemove', () => { st.mousemove++; });
  el.addEventListener('mouseup', () => { st.mouseup++; });
  el.addEventListener('click', (e) => { st.click++; st.lastClick = { x: e.clientX, y: e.clientY, target: e.target && e.target.className }; });
  window.addEventListener('pointerdown', () => { st.winPointerdown++; }, true);
  window.addEventListener('pointermove', () => { st.winPointermove++; }, true);
  window.addEventListener('pointerup', () => { st.winPointerup++; }, true);
  // Đếm thêm các trigger ngoài có thể đánh thức vòng ngủ lúc restore tab
  // (nghi phạm cho lần tỉnh +9 ticks ở baseline pha C — xem LIMITS C).
  window.addEventListener('resize', () => { st.winResize++; });
  window.addEventListener('focus', () => { st.winFocus++; });
  window.addEventListener('pageshow', () => { st.winPageshow++; });
  document.addEventListener('visibilitychange', () => { st.visChanges.push(document.visibilityState); });
  st.reset = () => { for (const k of ['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','click','winPointerdown','winPointermove','winPointerup','winResize','winFocus','winPageshow']) st[k] = 0; st.lastPointerdown = null; st.lastMousedown = null; st.lastClick = null; };
  return { ok: true };
})()
`;

const PROBE_READ_JS = `
(() => {
  const st = window.__v22probe;
  if (!st) return null;
  const out = {};
  for (const k of ['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','click','winPointerdown','winPointermove','winPointerup','winResize','winFocus','winPageshow']) out[k] = st[k];
  out.lastPointerdown = st.lastPointerdown; out.lastMousedown = st.lastMousedown; out.lastClick = st.lastClick;
  out.visChanges = st.visChanges.slice();
  return out;
})()
`;

const RULER_INFO_JS = `
(() => {
  const el = document.querySelector('.tl-ruler');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const chain = [];
  let n = el;
  while (n && n !== document.body) { const s = getComputedStyle(n); chain.push({ cls: n.className && String(n.className).slice(0, 40), pe: s.pointerEvents, pos: s.position, z: s.zIndex }); n = n.parentElement; }
  return { x: r.x, y: r.y, w: r.width, h: r.height, pe: cs.pointerEvents, touchAction: cs.touchAction,
    cursor: cs.cursor, display: cs.display, visibility: cs.visibility, ancestors: chain.slice(0, 6) };
})()
`;

const HIT_JS = (x, y) => `
(() => {
  const el = document.elementFromPoint(${x}, ${y});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { tag: el.tagName, cls: String(el.className).slice(0, 80), pe: cs.pointerEvents,
    x: r.x, y: r.y, w: r.width, h: r.height };
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

async function runOne(label, chromeBin, display, previewUrl) {
  const out = { run: label, ok: false };
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v22sleep-"));
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

    // Probe event + draw probe (đếm draw qua identity-setTransform như R5/T5).
    const probeOk = await cdp.evaluate(PROBE_JS);
    if (!probeOk.ok) throw new Error(`cài probe ruler thất bại: ${probeOk.why}`);
    await cdp.evaluate(`
      (() => {
        const canvas = document.querySelector('#vcut-preview-wrap canvas');
        if (!canvas || window.__v22draw) return;
        const ctx = canvas.getContext('2d');
        const orig = ctx.setTransform.bind(ctx);
        const st = { id: 0 };
        window.__v22draw = st;
        ctx.setTransform = function (a, b, c, d, e, f) {
          if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) st.id++;
          return orig(a, b, c, d, e, f);
        };
      })()`);
    const draws = async () => cdp.evaluate(`window.__v22draw ? window.__v22draw.id / 2 : null`);
    const resetProbe = async () => cdp.evaluate(`window.__v22probe.reset()`);

    // Đưa về playhead 0 rồi chờ ngủ (pause + settle).
    await cdp.pressKey("Home", "Home", 36);
    await sleep(3000);
    let st0 = await cdp.evaluate(STATE_JS);
    log(`${label} sau Home+settle 3s: time=${st0.timeText} hook=${JSON.stringify(st0.hook)} draws=${await draws()}`);
    out.sleepBaseline = { time: st0.timeText, hook: st0.hook };

    // ---------- PHA A: click ruler 50% ----------
    const info = await cdp.evaluate(RULER_INFO_JS);
    log(`${label} PHA-A ruler info: ${JSON.stringify(info)}`);
    out.rulerInfo = info;
    const cx = Math.min(Math.max(0, info.x + info.w * 0.5), 1910);
    const cy = Math.min(Math.max(0, info.y + info.h / 2), 1070);
    const hitBefore = await cdp.evaluate(HIT_JS(cx, cy));
    log(`${label} PHA-A elementFromPoint(${cx},${cy}): ${JSON.stringify(hitBefore)}`);
    out.hitBefore = hitBefore;
    await resetProbe();
    const beforeA = await cdp.evaluate(STATE_JS);
    await cdp.mouseClick(cx, cy);
    await sleep(2500);
    const probeA = await cdp.evaluate(PROBE_READ_JS);
    const afterA = await cdp.evaluate(STATE_JS);
    log(`${label} PHA-A click ruler 50% (${cx},${cy}): probe=${JSON.stringify(probeA)}`);
    log(`${label} PHA-A playhead: ${beforeA.timeText} -> ${afterA.timeText} px ${beforeA.pxHash} -> ${afterA.pxHash} hook=${JSON.stringify(afterA.hook)}`);
    out.phaseA = { click: { x: cx, y: cy }, probe: probeA, before: beforeA.timeText, after: afterA.timeText, pxBefore: beforeA.pxHash, pxAfter: afterA.pxHash, hook: afterA.hook };

    // ---------- PHA A2: click đơn lần nữa (modal đã đóng ở pha A) ----------
    await resetProbe();
    const beforeA2 = await cdp.evaluate(STATE_JS);
    await cdp.mouseClick(cx, cy);
    await sleep(2500);
    const probeA2 = await cdp.evaluate(PROBE_READ_JS);
    const afterA2 = await cdp.evaluate(STATE_JS);
    log(`${label} PHA-A2 click đơn ruler 50% (${cx},${cy}) sau khi modal đóng: probe=${JSON.stringify(probeA2)}`);
    log(`${label} PHA-A2 playhead: ${beforeA2.timeText} -> ${afterA2.timeText} px ${beforeA2.pxHash} -> ${afterA2.pxHash}`);
    out.phaseA2 = { click: { x: cx, y: cy }, probe: probeA2, before: beforeA2.timeText, after: afterA2.timeText, pxBefore: beforeA2.pxHash, pxAfter: afterA2.pxHash };

    // ---------- PHA B: kéo scrub 30% -> 70% ----------
    // Đưa playhead về 0 trước để kéo có hướng đo rõ (Home; nếu Home không về
    // 0 thì ghi nhận, không ép).
    await cdp.pressKey("Home", "Home", 36);
    await sleep(2500);
    const beforeB = await cdp.evaluate(STATE_JS);
    const x1 = info.x + info.w * 0.3, x2 = info.x + info.w * 0.7;
    await resetProbe();
    await cdp.mouseDown(x1, cy);
    await sleep(200);
    const midSamples = [];
    for (let i = 1; i <= 10; i++) {
      const x = x1 + (x2 - x1) * (i / 10);
      await cdp.mouseMove(x, cy);
      await sleep(120);
      if (i === 5 || i === 10) midSamples.push(await cdp.evaluate(STATE_JS).then((s) => s.timeText));
    }
    await cdp.mouseUp(x2, cy);
    await sleep(2500);
    const probeB = await cdp.evaluate(PROBE_READ_JS);
    const afterB = await cdp.evaluate(STATE_JS);
    log(`${label} PHA-B kéo ${x1.toFixed(0)}->${x2.toFixed(0)}: probe=${JSON.stringify(probeB)}`);
    log(`${label} PHA-B playhead: ${beforeB.timeText} -> giữa ${JSON.stringify(midSamples)} -> ${afterB.timeText} px ${beforeB.pxHash} -> ${afterB.pxHash}`);
    out.phaseB = { probe: probeB, before: beforeB.timeText, mid: midSamples, after: afterB.timeText, pxBefore: beforeB.pxHash, pxAfter: afterB.pxHash };

    // Đối chứng: dispatch PointerEvent JS trực tiếp lên ruler.
    const beforeC = await cdp.evaluate(STATE_JS);
    await resetProbe();
    const jsCtrl = await cdp.evaluate(`(() => {
      const el = document.querySelector('.tl-ruler');
      const r = el.getBoundingClientRect();
      const x = r.x + r.width * 0.5;
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: x, clientY: r.y + r.height / 2, pointerId: 99, pointerType: 'mouse', button: 0, buttons: 1 }));
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: x, clientY: r.y + r.height / 2, pointerId: 99, pointerType: 'mouse', button: 0, buttons: 0 }));
      return { x, time: null };
    })()`);
    await sleep(2500);
    const probeC = await cdp.evaluate(PROBE_READ_JS);
    const afterC = await cdp.evaluate(STATE_JS);
    log(`${label} PHA-B-đối-chứng dispatch PointerEvent JS: probe=${JSON.stringify(probeC)} playhead ${beforeC.timeText} -> ${afterC.timeText}`);
    out.phaseBJsControl = { probe: probeC, before: beforeC.timeText, after: afterC.timeText, clickX: jsCtrl.x };

    // ---------- PHA C: tab ẩn/hiện lúc ngủ ----------
    // Đưa về trạng thái ngủ chắc chắn: Home + settle tới khi sleeping=true.
    await cdp.pressKey("Home", "Home", 36);
    for (let i = 0; i < 10; i++) {
      await sleep(1000);
      const s = await cdp.evaluate(STATE_JS);
      if (s.hook && s.hook.sleeping) break;
    }
    const sleepPre = await cdp.evaluate(STATE_JS);
    const drawsPre = await draws();
    log(`${label} PHA-C trước ẩn: time=${sleepPre.timeText} px=${sleepPre.pxHash} hook=${JSON.stringify(sleepPre.hook)} draws=${drawsPre} vis=${sleepPre.visibility}`);
    await resetProbe();
    // Mở tab trắng thứ 2, activate nó => tab app hidden thật.
    const blank = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.activateTarget", { targetId: blank.targetId });
    await sleep(3000);
    const hiddenSt = await cdp.evaluate(STATE_JS);
    log(`${label} PHA-C lúc ẩn (đọc qua CDP vẫn được): vis=${hiddenSt.visibility} hidden=${hiddenSt.hidden} hook=${JSON.stringify(hiddenSt.hook)} px=${hiddenSt.pxHash}`);
    // Activate lại tab app => visible thật.
    await cdp.send("Target.activateTarget", { targetId: appTargetId });
    await sleep(1000);
    const visSt1 = await cdp.evaluate(STATE_JS);
    await sleep(3000);
    const visSt2 = await cdp.evaluate(STATE_JS);
    const drawsPost = await draws();
    const probeVis = await cdp.evaluate(PROBE_READ_JS);
    log(`${label} PHA-C sau hiện 1s: vis=${visSt1.visibility} hook=${JSON.stringify(visSt1.hook)} px=${visSt1.pxHash}`);
    log(`${label} PHA-C sau hiện 4s: vis=${visSt2.visibility} hook=${JSON.stringify(visSt2.hook)} px=${visSt2.pxHash} draws ${drawsPre}->${drawsPost} visChanges=${JSON.stringify(probeVis.visChanges)}`);
    log(`${label} PHA-C trigger ngoài trong lúc ẩn/hiện: resize=${probeVis.winResize} focus=${probeVis.winFocus} pageshow=${probeVis.winPageshow}`);
    out.phaseC = { pre: { time: sleepPre.timeText, px: sleepPre.pxHash, hook: sleepPre.hook, draws: drawsPre },
      hidden: { vis: hiddenSt.visibility, hook: hiddenSt.hook, px: hiddenSt.pxHash },
      post1s: { vis: visSt1.visibility, hook: visSt1.hook, px: visSt1.pxHash },
      post4s: { vis: visSt2.visibility, hook: visSt2.hook, px: visSt2.pxHash, draws: drawsPost },
      visChanges: probeVis.visChanges };

    // Hồi quy nhanh: Space phát/dừng + ArrowRight + phím L vẫn đúng (sau mọi pha).
    await cdp.pressKey("Space", " ", 32);
    await sleep(2000);
    const playSt = await cdp.evaluate(STATE_JS);
    await cdp.pressKey("Space", " ", 32);
    await sleep(3000);
    const pauseSt = await cdp.evaluate(STATE_JS);
    await cdp.pressKey("ArrowRight", "ArrowRight", 39);
    await sleep(2000);
    const stepSt = await cdp.evaluate(STATE_JS);
    // Phím L (+5 s, đường scrub phím đã chứng minh ở T5): phải đổi playhead
    // rồi ngủ lại — kiểm chứng scrub phím vẫn đúng sau sửa visibility.
    await cdp.pressKey("KeyL", "l", 76);
    await sleep(2500);
    const keyLSt = await cdp.evaluate(STATE_JS);
    await sleep(2000);
    const keyLSettle = await cdp.evaluate(STATE_JS);
    log(`${label} HỒI-QUY Space phát: time=${playSt.timeText} hook.sleeping=${playSt.hook && playSt.hook.sleeping} | dừng: time=${pauseSt.timeText} sleeping=${pauseSt.hook && pauseSt.hook.sleeping} | ArrowRight: ${pauseSt.timeText} -> ${stepSt.timeText} lastDrawn ${pauseSt.hook && pauseSt.hook.lastDrawn} -> ${stepSt.hook && stepSt.hook.lastDrawn} ticks ${pauseSt.hook && pauseSt.hook.ticks} -> ${stepSt.hook && stepSt.hook.ticks} sleeping=${stepSt.hook && stepSt.hook.sleeping} | KeyL: ${stepSt.timeText} -> ${keyLSt.timeText} sleeping=${keyLSt.hook && keyLSt.hook.sleeping} settle sleeping=${keyLSettle.hook && keyLSettle.hook.sleeping} ticks ${keyLSt.hook && keyLSt.hook.ticks} -> ${keyLSettle.hook && keyLSettle.hook.ticks}`);
    out.regression = { play: playSt.timeText, playSleeping: playSt.hook && playSt.hook.sleeping,
      pause: pauseSt.timeText, pauseSleeping: pauseSt.hook && pauseSt.hook.sleeping,
      step: stepSt.timeText, stepLastDrawn: stepSt.hook && stepSt.hook.lastDrawn, stepTicks: stepSt.hook && stepSt.hook.ticks, stepSleeping: stepSt.hook && stepSt.hook.sleeping,
      keyL: keyLSt.timeText, keyLSleeping: keyLSt.hook && keyLSt.hook.sleeping,
      keyLSettleSleeping: keyLSettle.hook && keyLSettle.hook.sleeping, keyLSettleTicks: keyLSettle.hook && keyLSettle.hook.ticks };

    out.ok = true;
    out.loadavgEnd = loadavg();
    return out;
  } finally {
    try { chrome.kill("SIGKILL"); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  log(`binaries thử: ${BINARIES.join(" | ")} | preview-port=${PREVIEW_PORT} | display=${DISPLAY}`);
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
        result = await runOne("run1", bin, display, previewUrl);
        break;
      } catch (e) {
        log(`BLOCKER ${bin}: ${e && e.message ? e.message : e}`);
      }
    }
    if (!result) { log("DONE v22-sleep-scrub: KHÔNG đo được run nào"); process.exit(2); }
    log(`=== TỔNG HỢP ===`);
    log(JSON.stringify(result, null, 1));
    log(`DONE v22-sleep-scrub ok=${result.ok}`);
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
