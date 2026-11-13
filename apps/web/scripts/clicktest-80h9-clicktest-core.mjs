#!/usr/bin/env node
/**
 * clicktest-80h9-clicktest-core.mjs — Phase 9 đợt 80, luồng H9:
 * mở rộng click-test bao phủ phần còn lại của nợ N3 (PHASE9_GAP_ANALYSIS.md
 * §2.7): responsive (viewport hẹp) + PWA (manifest / service worker /
 * offline cơ bản). Phần thao tác cốt lõi (trim/split/delete/box-select/
 * undo-redo) đã có ở bộ N9 (clicktest-57n9-timeline-core-ops.mjs, 11/11
 * đợt 57) — luồng này CHẠY LẠI bộ N9 nguyên vẹn làm hồi quy, rồi chạy
 * các case mới R1/R2/P1/P2/P3 ở đây.
 *
 * Chạy headed THẬT (vite dev + vite preview PROD + Chromium headed qua
 * Xvfb + CDP, Node thuần, không Playwright), theo mẫu N9.
 *
 * Đợt 80 H9 SỬA 2 bug sản phẩm thật do chính bộ này tìm ra (xem LIMITS):
 * (1) pill FPS (PerfOverlay, fixed góc dưới-phải, z 300) che tay cầm trim
 * + clip ở 390px → dời pill/panel sang góc dưới-trái trên timeline ở
 * ≤768px (PerfOverlay.tsx dùng useIsMobile); (2) MixerMeter tràn 2px ở
 * 390px → thu track/dB trong mobile.css. R1 kiểm chứng cả hai + pill vẫn
 * bấm được (tiền đề M10 của bộ 63r1).
 *
 * Chạy (từ gốc repo, SAU khi đã build dist cho P2/P3):
 *   node apps/web/scripts/clicktest-80h9-clicktest-core.mjs
 * Env: H9_DEV_PORT (mặc định tự chọn 5390–5399), H9_DEBUG_PORT
 * (9490–9499), H9_PREVIEW_PORT (4290–4299), H9_DISPLAY (mặc định :180),
 * H9_SCRATCH (mặc định hidden_files/round80-h9/headed). TMPDIR riêng
 * /tmp/round80-h9/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.H9_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round80-h9", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method: "Page.handleJavaScriptDialog", params: { accept: true } }));
        return;
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params?.exceptionDetails || {};
        this.exceptions.push(d.exception?.description || d.text || JSON.stringify(d).slice(0, 500));
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout 60s: ${method}`));
      }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x: Math.round(x), y: Math.round(y), ...extra });
  }
  async click(x, y, modifiers = 0) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await sleep(400);
  }
  async drag(x0, y0, x1, y1, steps = 12) {
    await this.mouse("mousePressed", x0, y0, { button: "left", clickCount: 1 });
    for (let i = 1; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      await this.mouse("mouseMoved", x, y, { button: "left" });
      await sleep(30);
    }
    await this.mouse("mouseReleased", x1, y1, { button: "left", clickCount: 1 });
    await sleep(500);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(400);
  }
  async setViewport(w, h) {
    await this.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
  }
  async setOffline(offline) {
    await this.send("Network.emulateNetworkConditions", { offline, latency: 0, downloadThroughput: offline ? 0 : -1, uploadThroughput: offline ? 0 : -1 });
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__h9errors = [];
  window.addEventListener("error", (e) => { try { window.__h9errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__h9errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__h9errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__h9errors.push("unhandledrejection: <?>"); } });
  window.__h9boot = Math.random().toString(36).slice(2);
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__h9storeMod || (window.__h9storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, trackKind: t.kind, clipId: c.id, kind: c.kind,
    start: +c.start.toFixed(3), duration: +c.duration.toFixed(3),
    in: c.in ?? null, out: c.out ?? null,
  });
  return {
    clips, clipCount: clips.length,
    videoClips: clips.filter((c) => c.trackId === "v1"),
    textClips: clips.filter((c) => c.trackId === "t1"),
    selection: st.selection.map((s) => ({ trackId: s.trackId, clipId: s.clipId })),
    undoDepth: st.undoDepth, redoDepth: st.redoDepth,
    playhead: +st.playhead.toFixed(3), pxPerSec: st.pxPerSec,
    errors: (window.__h9errors || []).slice(),
  };
})()`;

const RESET_FN = `(async () => {
  const st = await (${STORE_FN});
  await st.loadSample();
  return true;
})()`;

const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const lanes = document.querySelector(".tl-lanes");
  const ruler = document.querySelector(".tl-ruler");
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
    handleL: r(el.querySelector(".clip-handle.left")),
    handleR: r(el.querySelector(".clip-handle.right")),
  }));
  return { lanes: r(lanes), ruler: r(ruler), clips };
})()`;

// Trạng thái layout responsive thật tại viewport hiện tại.
const VIEWPORT_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const cs = (sel, prop) => { const el = document.querySelector(sel); if (!el) return "missing"; return getComputedStyle(el)[prop]; };
  const topbar = document.querySelector("header.topbar");
  const fabbar = document.querySelector(".m-fabbar");
  const timeline = document.querySelector(".timeline");
  const lanes = document.querySelector(".tl-lanes");
  // Phần tử con nào tràn ngang khỏi viewport (chỉ đếm phần tử nhìn thấy,
  // loại trừ phần tử trong vùng cuộn ngang có chủ đích .tl-scroll).
  const vw = window.innerWidth;
  const overflow = [];
  for (const el of document.querySelectorAll("body *")) {
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (el.closest(".tl-scroll") || el.closest(".tl-lanes")) continue;
    if (b.right > vw + 1 || b.left < -1) {
      const cls = (el.className && el.className.baseVal !== undefined) ? el.className.baseVal : (el.className || el.tagName);
      overflow.push(String(cls).slice(0, 60) + "@" + Math.round(b.left) + ".." + Math.round(b.right));
      if (overflow.length >= 8) break;
    }
  }
  return {
    innerW: window.innerWidth, innerH: window.innerHeight,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    topbar: r(topbar), topbarH: topbar ? +topbar.getBoundingClientRect().height.toFixed(1) : null,
    brandDisplay: cs(".brand-name", "display"),
    fabbar: r(fabbar), fabbarVisible: !!fabbar && fabbar.getBoundingClientRect().width > 0,
    timeline: r(timeline), lanes: r(lanes),
    isMobileMatch: window.matchMedia("(max-width: 768px)").matches,
    overflow,
  };
})()`;

const MANIFEST_FN = `(async () => {
  const r = await fetch("/manifest.webmanifest");
  const text = await r.text();
  let j = null, parseErr = null;
  try { j = JSON.parse(text); } catch (e) { parseErr = String(e); }
  if (!j) return { status: r.status, parse: false, parseErr };
  const icons = [];
  for (const ic of (j.icons || [])) {
    try { const rr = await fetch(ic.src); icons.push({ src: ic.src, sizes: ic.sizes, status: rr.status }); }
    catch (e) { icons.push({ src: ic.src, sizes: ic.sizes, status: "fetch-error" }); }
  }
  return { status: r.status, parse: true, name: j.name, short_name: j.short_name,
    display: j.display, start_url: j.start_url, scope: j.scope, icons };
})()`;

const SW_FN = `(async () => {
  if (!("serviceWorker" in navigator)) return { api: false };
  try {
    const reg = await navigator.serviceWorker.ready;
    return { api: true, scope: reg.scope,
      active: reg.active ? reg.active.state : "none",
      controller: !!navigator.serviceWorker.controller };
  } catch (e) { return { api: true, error: String(e && e.message || e) }; }
})()`;

// Trạng thái timeline đọc từ DOM (dùng cho phiên PROD: bundle không còn
// /src/store.ts để import như ở vite dev nên STORE_FN/STATE_FN không chạy
// được ở PROD — lần chạy đầu P3 timeout 180s đúng vì vậy; xem LIMITS §5).
const DOM_STATE_FN = `(() => {
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId,
    label: (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 100),
  }));
  return { clips, clipCount: clips.length,
    videoClips: clips.filter((c) => c.trackId === "v1"),
    textClips: clips.filter((c) => c.trackId === "t1") };
})()`;

// Project mẫu đúng hình học, đọc từ DOM: 2 clip video [0–4, 4–8] + 1 clip chữ.
function domSampleOk(t) {
  if (!t || t.clipCount !== 3) return false;
  const vs = t.videoClips;
  return vs.length === 2
    && vs.some((c) => c.label.includes("00:00.0 → 00:04.0"))
    && vs.some((c) => c.label.includes("00:04.0 → 00:08.0"))
    && t.textClips.length === 1;
}

const approx = (a, b, eps = 0.06) => Math.abs(a - b) <= eps;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, preview = null, xvfb = null, chrome = null;

  const DISPLAY = process.env.H9_DISPLAY || ":180";
  const TMPDIR = "/tmp/round80-h9/tmp";
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { preview?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }

  async function resetProject(cdp) {
    const hasBoot = await cdp.evalJs(`typeof window.__h9boot`).catch(() => "undefined");
    if (hasBoot !== "string") await cdp.evalJs(INJECT_ERRORS);
    await cdp.evalJs(RESET_FN);
    const s = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 ? t : null;
    }, "reset project mẫu (3 clip)", 180000);
    const boot = await cdp.evalJs(`window.__h9boot`);
    const s2 = await cdp.evalJs(STATE_FN).catch(() => null);
    if (!s2 || s2.clipCount !== 3) throw new Error("reset không ổn định (trang có thể vừa reload giữa chừng)");
    return { state: s, boot };
  }

  async function waitMount(cdp, label) {
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.textContent.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, label, 240000);
  }

  async function launchChrome(cdpPort, profileDir, winW, winH) {
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "h9-chrome.log"), "a");
    const ch = spawn(CHROME, ["--remote-debugging-port=" + cdpPort, `--user-data-dir=${profileDir}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      `--window-size=${winW},${winH}`, "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) { try { ch.kill("SIGKILL"); } catch {} throw new Error("không lấy được page target CDP"); }
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    return { ch, cdp };
  }

  try {
    const DEV_PORT = Number(process.env.H9_DEV_PORT || 0) || (await pickFreePort(5390, 5399));
    const DEBUG_PORT = Number(process.env.H9_DEBUG_PORT || 0) || (await pickFreePort(9490, 9499));
    // Đợt 80 H9: KHÔNG dùng 4190–4199 — cổng 4190 nằm trong danh sách
    // bad-port của WHATWG fetch (undici chặn, "bad port") nên node fetch
    // tới vite preview luôn fail dù server đã listen (curl vẫn tới được);
    // 2 lần chờ preview 60s/180s fail đều do vậy. Dùng 4290–4299.
    const PREVIEW_PORT = Number(process.env.H9_PREVIEW_PORT || 0) || (await pickFreePort(4290, 4299));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5390–5399");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9490–9499");
    if (!PREVIEW_PORT) throw new Error("hết cổng preview trống 4290–4299");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock}`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DIST_INDEX = path.join(WEB_DIR, "dist", "index.html");
    if (!fs.existsSync(DIST_INDEX)) throw new Error("chưa có dist/ — chạy `npm run build` trong apps/web trước (cần cho P2/P3 PROD)");
    const distMtime = fs.statSync(DIST_INDEX).mtime.toISOString();
    log(`dist/index.html mtime=${distMtime} (dùng cho P2/P3)`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}/`;
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    // Config vite tắt HMR (tự tạo, chống /tmp bị xóa sau reboot — xem N9 LIMITS §5).
    const viteCfgPath = "/tmp/round80-h9/vite.h9.config.mjs";
    fs.mkdirSync(path.dirname(viteCfgPath), { recursive: true });
    writeFileEpermRetry(viteCfgPath, `import { createRequire } from "node:module";\nconst require = createRequire("/home/hatch/workspace/repo-1/apps/web/package.json");\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, preview :${PREVIEW_PORT}, DISPLAY=${DISPLAY}`);

    // ---------- PHASE A: vite dev — responsive + manifest ----------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "h9-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", viteCfgPath, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);

    const PROFILE = path.join(SCRATCH, "chrome-userdata-dev");
    fs.rmSync(PROFILE, { recursive: true, force: true });
    let launched = await launchChrome(DEBUG_PORT, PROFILE, 1440, 900);
    chrome = launched.ch; let cdp = launched.cdp;

    // R1: viewport hẹp 390×844 (điện thoại) — layout mobile + thao tác cốt lõi.
    {
      await cdp.setViewport(390, 844);
      await cdp.send("Page.navigate", { url: DEV_URL });
      await waitMount(cdp, "app mount 390px");
      const modalGone = await ensureNoModal(cdp);
      if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng (R1)");
      const s0 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 3 ? t : null;
      }, "project mẫu tự load 390px (3 clip)", 180000);
      const v = await cdp.evalJs(VIEWPORT_FN);
      const overflowOk = v.docScrollW <= 391 && v.overflow.length === 0;
      const layoutOk = v.brandDisplay === "none" && v.fabbarVisible && v.topbarH >= 80 && v.timeline && v.timeline.h >= 200;
      log(`R1 viewport: ${JSON.stringify(v)}`);
      // Fab Media mở sheet rồi đóng được.
      let sheetOk = false, sheetDetail = "";
      try {
        const fabs = await cdp.evalJs(`[...document.querySelectorAll(".m-fabbar .m-fab")].map((b) => b.getAttribute("aria-label") || b.textContent.trim())`);
        await cdp.evalJs(`document.querySelector(".m-fabbar .m-fab").click()`);
        await sleep(700);
        const sheet = await cdp.evalJs(`(() => { const s = document.querySelector(".m-sheet"); if (!s) return null; const b = s.getBoundingClientRect(); return { w: +b.width.toFixed(0), h: +b.height.toFixed(0), title: (s.querySelector(".m-sheet-title") || {}).textContent || "" }; })()`);
        if (sheet && sheet.w >= 350) {
          await cdp.evalJs(`document.querySelector(".m-sheet-close").click()`);
          await sleep(500);
          const gone = await cdp.evalJs(`!document.querySelector(".m-sheet")`);
          sheetOk = gone === true;
          sheetDetail = `fab=${JSON.stringify(fabs)}, sheet ${sheet.w}x${sheet.h} "${sheet.title}", đóng xong sheet biến mất=${gone}`;
        } else sheetDetail = `fab=${JSON.stringify(fabs)}, sheet không mở đúng: ${JSON.stringify(sheet)}`;
      } catch (e) { sheetDetail = "lỗi bấm fab: " + (e.message || e); }
      // Trim mép phải ở 390px (handle 22px ở mobile) + click chọn clip.
      // Sau sửa H9 (pill FPS dời khỏi góc dưới-phải), handle không còn bị
      // che. Clip B phải cuộn ngang mới bấm được tâm (tâm ở x=452 ngoài
      // viewport 390) — cuộn .tl-scroll 200px rồi bấm tâm clip B.
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const clipA = g.clips.find((c) => c.trackId === "v1");
      let trimDetail = "không tìm thấy clip v1/handle phải";
      let trimOk = false, selOk = false, selDetail = "";
      if (clipA && clipA.handleR) {
        await cdp.drag(clipA.handleR.cx, clipA.handleR.cy, clipA.handleR.cx - 60, clipA.handleR.cy);
        const s = await cdp.evalJs(STATE_FN);
        const a = s.videoClips[0];
        trimOk = approx(a.start, 0) && approx(a.duration, 3) && approx(a.out, 3) && approx(s.videoClips[1].start, 4);
        trimDetail = `clip A 4s → ${a.duration}s, start=${a.start}, out=${a.out}; clip B start=${s.videoClips[1]?.start}`;
        await cdp.evalJs(`(() => { const s = document.querySelector(".tl-scroll"); if (s) s.scrollLeft = 200; return s ? s.scrollLeft : null; })()`);
        await sleep(500);
        const g2 = await cdp.evalJs(GEOM_FN);
        const clipB = g2.clips.filter((c) => c.trackId === "v1")[1];
        if (clipB) {
          await cdp.click(clipB.rect.cx, clipB.rect.cy);
          const sSel = await cdp.evalJs(STATE_FN);
          selOk = sSel.selection.length === 1 && sSel.selection[0].clipId === clipB.clipId;
          selDetail = `sau cuộn 200px, clip B tâm (${clipB.rect.cx}, ${clipB.rect.cy}): selection=${JSON.stringify(sSel.selection)}`;
        } else selDetail = "không tìm thấy clip B sau trim";
      }
      // Pill FPS vẫn bấm được ở vị trí mới (góc dưới-trái, trên timeline) —
      // tiền đề cho M10 của bộ 63r1: bấm pill → panel mở → đóng panel.
      let pillOk = false, pillDetail = "";
      try {
        const pillBtn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("FPS") && !x.closest('[role="dialog"]')); if (!b) return null; const r = b.getBoundingClientRect(); return { x: +(r.left + r.width / 2).toFixed(1), y: +(r.top + r.height / 2).toFixed(1), w: +r.width.toFixed(0), h: +r.height.toFixed(0), visible: r.width > 0 }; })()`);
        if (pillBtn && pillBtn.visible) {
          await cdp.click(pillBtn.x, pillBtn.y);
          const opened = await cdp.waitFor(async () => {
            const s = await cdp.evalJs(`!![...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview"))`).catch(() => null);
            return s ? true : null;
          }, "panel FPS mở sau khi bấm pill", 10000).catch(() => null);
          if (opened) {
            await cdp.evalJs(`(() => { const p = [...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview")); if (!p) return false; const b = p.querySelector("button"); if (b) b.click(); return true; })()`);
            await sleep(500);
            const closed = await cdp.evalJs(`![...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview"))`);
            pillOk = closed === true;
            pillDetail = `pill tại (${pillBtn.x}, ${pillBtn.y}) ${pillBtn.w}x${pillBtn.h}, panel mở rồi đóng được=${closed}`;
          } else pillDetail = `bấm pill tại (${pillBtn.x}, ${pillBtn.y}) nhưng panel không mở`;
        } else pillDetail = `không tìm thấy pill FPS (pillBtn=${JSON.stringify(pillBtn)})`;
      } catch (e) { pillDetail = "lỗi bấm pill: " + (e.message || e); }
      if (overflowOk && layoutOk && sheetOk && trimOk && selOk && pillOk) {
        pass("R1 responsive 390×844: layout mobile + trim + chọn clip", `không tràn ngang (docScrollW=${v.docScrollW}); brand ẩn, fabbar hiện, topbar ${v.topbarH}px; ${sheetDetail}; trim: ${trimDetail}; chọn clip B: ${selDetail}; pill FPS: ${pillDetail}`);
      } else {
        fail("R1 responsive 390×844: layout mobile + trim + chọn clip", `overflowOk=${overflowOk} (docScrollW=${v.docScrollW}, overflow=${JSON.stringify(v.overflow)}); layoutOk=${layoutOk} (brand=${v.brandDisplay}, fabbar=${v.fabbarVisible}, topbarH=${v.topbarH}, timelineH=${v.timeline?.h}); sheetOk=${sheetOk} (${sheetDetail}); trimOk=${trimOk} (${trimDetail}); selOk=${selOk} (${selDetail}); pillOk=${pillOk} (${pillDetail})`);
      }
      await cdp.shot("h9-r1-390px.png");
    }

    // R2: viewport 768×1024 (đúng breakpoint) — layout mobile + split.
    {
      await cdp.setViewport(768, 1024);
      await cdp.send("Page.navigate", { url: DEV_URL });
      await waitMount(cdp, "app mount 768px");
      const modalGone = await ensureNoModal(cdp);
      if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng (R2)");
      const s0 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 3 ? t : null;
      }, "project mẫu tự load 768px (3 clip)", 180000);
      const v = await cdp.evalJs(VIEWPORT_FN);
      const overflowOk = v.docScrollW <= 769 && v.overflow.length === 0;
      const layoutOk = v.isMobileMatch === true && v.brandDisplay === "none" && v.fabbarVisible && v.topbarH >= 80;
      log(`R2 viewport: ${JSON.stringify(v)}`);
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      let splitOk = false, splitDetail = "không tìm thấy ruler";
      if (g.ruler) {
        const pps = (await cdp.evalJs(STATE_FN)).pxPerSec;
        await cdp.click(g.ruler.x + 6 * pps, g.ruler.cy);
        const sPre = await cdp.evalJs(STATE_FN);
        if (!approx(sPre.playhead, 6)) splitDetail = `click ruler không đặt được playhead: ${sPre.playhead}`;
        else {
          await cdp.key("s", "KeyS");
          await sleep(600);
          const s = await cdp.evalJs(STATE_FN);
          const vs = s.videoClips;
          splitOk = vs.length === 3 && approx(vs[1].start, 4) && approx(vs[1].duration, 2) && approx(vs[2].start, 6) && approx(vs[2].duration, 2);
          splitDetail = `v1: 2 clip → ${vs.length} clip ${JSON.stringify(vs.map((c) => [c.start, c.duration]))}`;
        }
      }
      if (overflowOk && layoutOk && splitOk) {
        pass("R2 responsive 768×1024: layout mobile + split", `không tràn ngang (docScrollW=${v.docScrollW}); breakpoint 768 khớp, brand ẩn, fabbar hiện, topbar ${v.topbarH}px; split 6s: ${splitDetail}`);
      } else {
        fail("R2 responsive 768×1024: layout mobile + split", `overflowOk=${overflowOk} (docScrollW=${v.docScrollW}, overflow=${JSON.stringify(v.overflow)}); layoutOk=${layoutOk} (mobileMatch=${v.isMobileMatch}, brand=${v.brandDisplay}, fabbar=${v.fabbarVisible}, topbarH=${v.topbarH}); splitOk=${splitOk} (${splitDetail})`);
      }
      await cdp.shot("h9-r2-768px.png");
    }

    // P1: manifest PWA (trên vite dev — manifest là file tĩnh, không cần PROD).
    {
      await cdp.setViewport(1440, 900);
      const m = await cdp.evalJs(MANIFEST_FN);
      const iconsOk = Array.isArray(m.icons) && m.icons.length >= 2
        && m.icons.some((i) => String(i.sizes) === "192x192" && i.status === 200)
        && m.icons.some((i) => String(i.sizes) === "512x512" && i.status === 200);
      if (m.status === 200 && m.parse === true && m.name === "VCut Studio" && m.short_name === "VCut"
        && m.display === "standalone" && typeof m.start_url === "string" && iconsOk) {
        pass("P1 manifest PWA hợp lệ", `HTTP ${m.status}, name="${m.name}", short_name="${m.short_name}", display="${m.display}", start_url="${m.start_url}", icons=${JSON.stringify(m.icons)}`);
      } else {
        fail("P1 manifest PWA hợp lệ", JSON.stringify(m));
      }
    }

    const devErrors = (await cdp.evalJs(`(window.__h9errors || []).slice()`)) || [];
    try { chrome?.kill("SIGKILL"); } catch {}
    chrome = null;
    try { vite?.kill("SIGKILL"); } catch {}
    vite = null;

    // ---------- PHASE B: vite preview (PROD) — SW + offline ----------
    const previewLogFd = fs.openSync(path.join(SCRATCH, "h9-preview.log"), "w");
    preview = spawn(VITE_BIN, ["preview", "--port", String(PREVIEW_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", previewLogFd, previewLogFd] });
    up = false;
    let lastFetchErr = "";
    for (let i = 0; i < 180 && !up; i++) {
      try {
        const r = await fetch(PREVIEW_URL);
        if (r.ok) up = true;
        else { lastFetchErr = `HTTP ${r.status}`; await sleep(1000); }
      } catch (e) { lastFetchErr = String((e && e.message) || e); await sleep(1000); }
    }
    if (!up) throw new Error(`vite preview không lên ở ${PREVIEW_URL} sau 180 s (lastFetchErr=${lastFetchErr}; xem h9-preview.log)`);
    log("vite preview (PROD) đã lên");

    const PROFILE2 = path.join(SCRATCH, "chrome-userdata-preview");
    fs.rmSync(PROFILE2, { recursive: true, force: true });
    launched = await launchChrome(DEBUG_PORT, PROFILE2, 1440, 900);
    chrome = launched.ch; cdp = launched.cdp;

    // P2: service worker đăng ký + active + điều khiển trang (PROD).
    {
      await cdp.send("Page.navigate", { url: PREVIEW_URL });
      await waitMount(cdp, "app mount PROD preview");
      const modalGone = await ensureNoModal(cdp);
      if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng (P2)");
      let sw = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(SW_FN).catch(() => null);
        return s && s.api && s.active === "activated" && s.controller === true ? s : null;
      }, "SW activated + controller", 120000).catch(() => null);
      if (!sw) {
        // SW active nhưng chưa claim → reload 1 lần rồi kiểm tra lại.
        const cur = await cdp.evalJs(SW_FN).catch(() => null);
        log(`P2: SW chưa đủ điều kiện sau lần chờ đầu (${JSON.stringify(cur)}) — reload 1 lần`);
        await cdp.send("Page.navigate", { url: PREVIEW_URL });
        await waitMount(cdp, "app mount PROD sau reload (P2)");
        await ensureNoModal(cdp);
        sw = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(SW_FN).catch(() => null);
          return s && s.api && s.active === "activated" && s.controller === true ? s : null;
        }, "SW activated + controller sau reload", 120000).catch(() => null);
      }
      if (sw && sw.api && sw.active === "activated" && sw.controller === true) {
        pass("P2 service worker đăng ký + điều khiển trang (PROD)", `scope=${sw.scope}, active=${sw.active}, controller=true`);
      } else {
        fail("P2 service worker đăng ký + điều khiển trang (PROD)", `sw=${JSON.stringify(sw || await cdp.evalJs(SW_FN).catch(() => null))}`);
      }
      await cdp.shot("h9-p2-sw-prod.png");
    }

    // P3: offline cơ bản — rớt mạng rồi reload, app shell vẫn mở được từ cache.
    // Đọc trạng thái từ DOM (PROD không import được store — xem DOM_STATE_FN).
    {
      // Đảm bảo project mẫu đã load xong khi còn mạng (cache JS + shell).
      const sOnline = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(DOM_STATE_FN).catch(() => null);
        return domSampleOk(t) ? t : null;
      }, "project mẫu tự load PROD (3 clip, trước offline)", 180000);
      await cdp.setOffline(true);
      log("P3: đã giả lập offline, reload trang…");
      await cdp.send("Page.reload", { ignoreCache: false });
      let mountedOffline = false, offlineDetail = "";
      try {
        await cdp.waitFor(async () => {
          const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.textContent.includes('VCut Studio') && !splash ? true : null; })()`).catch(() => null);
          return s;
        }, "app mount khi offline (shell từ cache)", 120000);
        mountedOffline = true;
      } catch (e) { offlineDetail = "mount timeout offline: " + (e.message || e); }
      let clipsOffline = null;
      if (mountedOffline) {
        await ensureNoModal(cdp).catch(() => {});
        clipsOffline = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(DOM_STATE_FN).catch(() => null);
          return domSampleOk(t) ? t : null;
        }, "3 clip khi offline", 120000).catch(() => null);
        if (!clipsOffline) offlineDetail = "mount được offline nhưng không đủ 3 clip đúng hình học: " + JSON.stringify(await cdp.evalJs(DOM_STATE_FN).catch(() => null));
      }
      await cdp.setOffline(false);
      await sleep(500);
      if (mountedOffline && clipsOffline) {
        pass("P3 offline cơ bản: reload khi mất mạng vẫn mở được app", `topbar mount từ cache SW; project mẫu đủ 3 clip khi offline (v1 "00:00.0 → 00:04.0" + "00:04.0 → 00:08.0", t1 1 clip)`);
      } else {
        fail("P3 offline cơ bản: reload khi mất mạng vẫn mở được app", offlineDetail || `mountedOffline=${mountedOffline}, clipsOffline=${JSON.stringify(clipsOffline)}`);
      }
      await cdp.shot("h9-p3-offline.png");
    }

    const previewErrors = (await cdp.evalJs(`(window.__h9errors || []).slice()`)) || [];
    const allErrors = [...devErrors, ...previewErrors];
    if (allErrors.length === 0) pass("H9 0 lỗi trang (dev + PROD)", "không có window.onerror/unhandledrejection trong cả 2 phiên");
    else fail("H9 0 lỗi trang (dev + PROD)", allErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "h9-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED H9: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
