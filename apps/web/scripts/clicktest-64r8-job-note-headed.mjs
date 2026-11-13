#!/usr/bin/env node
/**
 * clicktest-64r8-job-note-headed.mjs — Phase 9 đợt 64, luồng R8: đo headed
 * THẬT "job recover → note hiện trong UI" (đóng nợ đợt 63 §2/§6.7).
 *
 * Luồng đo (vite dev + bridge THẬT + Chromium headed qua Xvfb + CDP,
 * theo mẫu clicktest-63r1-modal-headed.mjs; KHÔNG mock, KHÔNG stub poll):
 *   H0 setup: profile Chrome mới tinh (locale vi mặc định), project mẫu
 *        tự load (3 clip, media bin 2 item, media có file thật).
 *   H1 mở ExportPanel (TopBar "Xuất bản") → chưa render nên `.render-note`
 *        PHẢI VẮNG (job thường không có note thì UI không hiện rác).
 *   H2 bấm CTA "🎬 Xuất MP4 (1920×1080)" → render thật qua bridge; node
 *        poll `GET /api/render` mỗi 300ms; ngay khi job chuyển "running"
 *        thì SIGKILL bridge giữa chừng (ghi lại status lúc kill).
 *   H3 khởi động LẠI bridge (cùng BRIDGE_WORK_DIR + cùng cổng) → bridge
 *        recover job từ job.json lúc boot; node GET job trực tiếp:
 *        `noteCode` PHẢI là "JOB_RECOVERED_RESTART", `note` PHẢI là chuỗi
 *        RECOVER_NOTE (bằng chứng phía server, độc lập với UI).
 *   H4 trong trang: chờ `.render-note` xuất hiện (poll CDP, tối đa 90s)
 *        với đúng chuỗi vi "Phục hồi sau khi server restart — render lại
 *        từ đầu." — đây là poll 1s của ExportPanel đọc lại job đã phục
 *        hồi (fetch lỗi lúc bridge chết thì giữ polling, không dừng).
 *   H5 0 lỗi trang trong cả phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-64r8-job-note-headed.mjs
 * Env: R8_DEV_PORT (mặc định tự chọn 5640–5649), R8_DEBUG_PORT (9740–9749),
 * R8_BRIDGE_PORT (8890–8899), R8_DISPLAY (mặc định :196–:205),
 * R8_SCRATCH (mặc định hidden_files/round64-r8/headed). TMPDIR riêng
 * /tmp/round64-r8/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG push/tag/binary. Ảnh chụp + log bridge/vite/chrome nằm ở SCRATCH.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round64-r8", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round64-r8";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r8.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round64-r8/bridge-work";

/** Chuỗi note bridge gắn khi phục hồi — KHỚP jobQueue.js RECOVER_NOTE. */
const EXPECT_NOTE_VI = "Phục hồi sau khi server restart — render lại từ đầu.";

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

async function pickFreeDisplay(lo, hi) {
  for (let n = lo; n <= hi; n++) {
    const sock = `/tmp/.X11-unix/X${n}`;
    const lock = `/tmp/.X${n}-lock`;
    if (!fs.existsSync(sock) && !fs.existsSync(lock)) return `:${n}`;
    let alive = false;
    try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
    if (!alive) {
      try { if (fs.existsSync(sock)) fs.unlinkSync(sock); } catch {}
      try { if (fs.existsSync(lock)) fs.unlinkSync(lock); } catch {}
      log(`đã dọn socket/lock X mồ côi :${n} (Xvfb cũ đã chết)`);
      return `:${n}`;
    }
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
  async send(method, params = {}, timeoutMs = 60000) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout ${timeoutMs / 1000}s: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression, timeoutMs = 60000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
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
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(400);
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
  if (!window.__r8injected) {
    window.__r8injected = true;
    window.__r8errors = [];
    window.addEventListener("error", (e) => { try { window.__r8errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r8errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__r8errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r8errors.push("unhandledrejection: <?>"); } });
  }
  window.__r8boot = window.__r8boot || Math.random().toString(36).slice(2);
})()`;

/** Trạng thái store phục vụ đo: project mẫu + media. */
const STORE_FN = `(async () => {
  const mod = window.__r8storeMod || (window.__r8storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    duration: st.spec.tracks.reduce((mx, t) => Math.max(mx, ...t.clips.map((c) => c.start + c.duration)), 0),
  };
})()`;

/** Đọc .render-note trong trang: null = vắng, chuỗi = text hiện tại. */
const NOTE_FN = `(() => {
  const el = document.querySelector(".render-note");
  if (!el) return null;
  return { text: (el.textContent || "").trim(), role: el.getAttribute("role"), visible: el.getBoundingClientRect().width > 0 };
})()`;

/** Tìm nút CTA "Xuất MP4" trong ExportPanel, trả rect để bấm chuột thật. */
const CTA_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const btns = [...dlg.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("Xuất MP4") && !b.disabled && b.getBoundingClientRect().width > 0);
  if (!btns.length) return { found: false, texts: [...dlg.querySelectorAll("button")].map((b) => (b.textContent || "").trim().slice(0, 40)) };
  const b = btns[btns.length - 1];
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { found: true, x: r.left + r.width / 2, y: r.top + r.height / 2, text: (b.textContent || "").trim() };
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { bridge?.kill("SIGTERM"); } catch {}
  };
  process.on("exit", killAll);

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 5; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .m-sheet-backdrop, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => {
        const clickFirst = (sel) => { const b = document.querySelector(sel); if (b) { b.click(); return true; } return false; };
        if (clickFirst('[role="dialog"] .modal-head .icon-btn')) return "x";
        if (clickFirst('.tour-card .icon-btn')) return "tour-x";
        if (clickFirst('.m-sheet-close')) return "sheet-x";
        const b = [...document.querySelectorAll('[role="dialog"] button')].find((x) => ["Later", "Để sau", "Skip", "Đóng", "Close"].includes(x.textContent.trim()));
        if (b) { b.click(); return "later"; }
        return null;
      })()`).catch(() => {});
      await sleep(500);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(500);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .m-sheet-backdrop, .welcome-modal")`));
  }

  async function waitMounted(cdp, oldBoot) {
    const oldBootJson = JSON.stringify(oldBoot ?? null);
    const boot = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__r8boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r8errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r8errors = []`).catch(() => {});
    return e;
  }

  async function openModalTopBar(cdp, topBtnSubstr, titleSubstr) {
    const topBtnFn = `(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes(${JSON.stringify(topBtnSubstr)})); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled, visible: r.width > 0 && r.left >= 0 && r.right <= window.innerWidth }; })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await ensureNoModal(cdp);
      let btn = await cdp.evalJs(topBtnFn);
      if (!btn) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" (lần ${attempt})`);
      if (btn.disabled) {
        let enabled = false;
        for (let i = 0; i < 60 && !enabled; i++) {
          await sleep(500);
          const b2 = await cdp.evalJs(topBtnFn);
          if (b2 && !b2.disabled) enabled = true;
        }
        if (!enabled) throw new Error(`nút TopBar "${topBtnSubstr}" vẫn disabled sau 30s chờ (media chưa rehydrate?)`);
      }
      const btnNow = await cdp.evalJs(topBtnFn);
      if (!btnNow) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" sau chờ enable`);
      btn = btnNow;
      if (!btn.visible) {
        await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes(${JSON.stringify(topBtnSubstr)})); if (b) b.scrollIntoView({ block: "nearest", inline: "center" }); return true; })()`);
        await sleep(400);
        const btn2 = await cdp.evalJs(topBtnFn);
        if (!btn2) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" sau scrollIntoView`);
        await cdp.click(btn2.x, btn2.y);
      } else {
        await cdp.click(btn.x, btn.y);
      }
      const opened = await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes(${JSON.stringify(titleSubstr)}) ? true : null; })()`).catch(() => null);
        return m;
      }, `modal mở (tiêu đề ${titleSubstr}, lần ${attempt})`, 8000).catch(() => null);
      if (opened) return true;
      log(`openModalTopBar lần ${attempt}: modal chưa mở (tiêu đề ${titleSubstr}) — bấm lại`);
      await sleep(1000);
    }
    throw new Error(`timeout chờ modal mở (tiêu đề ${titleSubstr}) sau 3 lần bấm`);
  }

  /** Khởi động bridge (cùng cổng + WORK_DIR); chờ /api/health 200. */
  async function startBridge(port, workDir, logName) {
    const fd = fs.openSync(path.join(SCRATCH, logName), "w");
    const proc = spawn("node", [BRIDGE_ENTRY], {
      stdio: ["ignore", fd, fd],
      // Đợt 66 T9 — persist riêng theo PID (cùng process restart vẫn cùng file — đúng ngữ nghĩa restart; khác process thì khác file).
      env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR: workDir, BRIDGE_RATE_PERSIST_PATH: path.join(workDir, `rate-limit-${process.pid}.json`) },
    });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (r.ok) up = true;
      } catch { /* chưa lên */ }
      if (!up) await sleep(1000);
    }
    if (!up) throw new Error(`bridge không lên ở :${port} sau 120s (xem ${logName})`);
    return proc;
  }

  /** Lấy job mới nhất từ bridge (GET /api/render). */
  async function latestJob(port) {
    const r = await fetch(`http://127.0.0.1:${port}/api/render?limit=1`);
    if (!r.ok) return null;
    const j = await r.json();
    const list = j.jobs || [];
    return list.length ? list[0] : null;
  }

  try {
    const DEV_PORT = Number(process.env.R8_DEV_PORT || 0) || (await pickFreePort(5640, 5649));
    const DEBUG_PORT = Number(process.env.R8_DEBUG_PORT || 0) || (await pickFreePort(9740, 9749));
    const BRIDGE_PORT = Number(process.env.R8_BRIDGE_PORT || 0) || (await pickFreePort(8890, 8899));
    const DISPLAY = process.env.R8_DISPLAY || (await pickFreeDisplay(196, 205));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5640–5649");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9740–9749");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8890–8899");
    if (!DISPLAY) throw new Error("hết display X trống :196–:205");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1248)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round64-r8/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // WORK_DIR mới tinh mỗi lần chạy: không còn job cũ làm nhiễu latestJob.
    fs.rmSync(BRIDGE_WORK_DIR, { recursive: true, force: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, bridge :${BRIDGE_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    // ---- Bridge lần 1 ------------------------------------------------------
    bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "r8-bridge-1.log");
    log(`bridge lần 1 OK: ${BRIDGE_URL} (WORK_DIR=${BRIDGE_WORK_DIR})`);

    // ---- Vite + Xvfb + Chrome ----------------------------------------------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-vite.log"), "w");
    const viteEnv = { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL };
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd], env: viteEnv });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error("không lấy được page target CDP");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // ---- H0: setup vi + mount + mẫu ---------------------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    const s0 = await cdp.evalJs(STORE_FN).catch(() => null);
    await drainErrors(cdp);
    if (s0 && s0.clipCount === 3 && s0.mediaCount === 2 && s0.media.every((m) => m.hasFile)) {
      pass("H0 setup: locale vi + mẫu tự load", `3 clip, media bin 2 item đều có file, duration ${s0.duration}s`);
    } else {
      fail("H0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(s0)}`);
    }

    // ---- H1: mở ExportPanel, .render-note phải vắng trước khi render -----
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const noteBefore = await cdp.evalJs(NOTE_FN);
    if (noteBefore === null) pass("H1 .render-note vắng trước khi render", "job chưa có note → UI không hiện rác");
    else fail("H1 .render-note vắng trước khi render", `thấy note trước khi render: ${JSON.stringify(noteBefore)}`);
    await drainErrors(cdp);

    // ---- H2: bấm Xuất MP4 → render thật → kill bridge lúc job running ----
    const cta = await cdp.evalJs(CTA_FN);
    if (!cta || !cta.found) throw new Error(`không tìm thấy CTA Xuất MP4 trong ExportPanel: ${JSON.stringify(cta)}`);
    log(`CTA Xuất MP4: "${cta.text}" tại (${cta.x}, ${cta.y})`);
    await cdp.click(cta.x, cta.y);
    // Poll bridge mỗi 300ms cho tới khi job running (tối đa 60s); job
    // tạo ra lúc POST nên thấy ngay cả khi còn queued/uploading.
    let jobAtKill = null;
    let killStatus = null;
    const tKill0 = Date.now();
    while (Date.now() - tKill0 < 60000) {
      const j = await latestJob(BRIDGE_PORT).catch(() => null);
      if (j && j.status === "running") { jobAtKill = j; killStatus = "running"; break; }
      if (j && j.status === "done") { jobAtKill = j; killStatus = "done-truoc-kill"; break; }
      await sleep(300);
    }
    if (!jobAtKill) throw new Error("không thấy job nào xuất hiện trên bridge sau 60s kể từ khi bấm Xuất MP4");
    if (killStatus === "done-truoc-kill") {
      fail("H2 kill bridge lúc job running", `job render xong trước khi kill kịp (status done sau ${Date.now() - tKill0}ms) — mẫu render quá nhanh, cần preset chậm hơn`);
    } else {
      bridge.kill("SIGKILL");
      log(`đã SIGKILL bridge lúc job ${jobAtKill.id} status=${killStatus} progress=${jobAtKill.progress}`);
      // Đợi cổng bridge chết hẳn rồi mới khởi động lại (tránh EADDRINUSE).
      for (let i = 0; i < 30; i++) {
        const dead = await fetch(BRIDGE_URL + "/api/health").then(() => false).catch(() => true);
        if (dead) break;
        await sleep(500);
      }
      pass("H2 kill bridge lúc job running", `job ${jobAtKill.id} status=${killStatus} progress=${jobAtKill.progress} lúc kill`);
    }

    // ---- H3: restart bridge → recover job, kiểm chứng phía server --------
    bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "r8-bridge-2.log");
    log("bridge lần 2 đã lên (cùng WORK_DIR, recover lúc boot)");
    const recovered = await cdp.waitFor(async () => {
      const r = await fetch(`${BRIDGE_URL}/api/render/${jobAtKill.id}`).catch(() => null);
      if (!r || !r.ok) return null;
      const j = await r.json();
      return j && j.noteCode ? j : null;
    }, "bridge lần 2 trả job có noteCode", 60000).catch(() => null);
    if (recovered && recovered.noteCode === "JOB_RECOVERED_RESTART" && recovered.note === EXPECT_NOTE_VI) {
      pass("H3 bridge recover: noteCode + note đúng", `job ${recovered.id} status=${recovered.status} noteCode=${recovered.noteCode}`);
    } else {
      fail("H3 bridge recover: noteCode + note đúng", `job sau restart: ${JSON.stringify(recovered)}`);
    }
    await cdp.shot("r8-after-restart.png").catch(() => {});

    // ---- H4: UI hiện .render-note với đúng chuỗi vi -----------------------
    const noteShown = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(NOTE_FN).catch(() => null);
      return n && n.text === EXPECT_NOTE_VI ? n : null;
    }, ".render-note hiện đúng chuỗi vi", 90000).catch(() => null);
    if (noteShown) {
      pass("H4 .render-note hiện sau recover", `role=${noteShown.role} visible=${noteShown.visible} text="${noteShown.text}"`);
    } else {
      const cur = await cdp.evalJs(NOTE_FN).catch(() => "eval-loi");
      fail("H4 .render-note hiện sau recover", `.render-note hiện tại: ${JSON.stringify(cur)} (chờ "${EXPECT_NOTE_VI}")`);
    }
    await cdp.shot("r8-note-visible.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H5: 0 lỗi trang ---------------------------------------------------
    if (phaseErrors.length === 0) pass("H5 0 lỗi trang", "không có window.onerror / unhandledrejection cả phiên");
    else fail("H5 0 lỗi trang", `${phaseErrors.length} lỗi: ${phaseErrors.slice(0, 3).join(" || ")}`);
  } catch (e) {
    results.push({ name: "HARNESS", ok: false, detail: (e && e.stack) || String(e) });
    log(`HARNESS LỖI: ${(e && e.message) || e}`);
  } finally {
    killAll();
    await sleep(500);
    writeFileEpermRetry(path.join(SCRATCH, "r8-results.json"), JSON.stringify({ results, logLines }, null, 2));
    const nPass = results.filter((r) => r.ok).length;
    log(`KẾT QUẢ: ${nPass}/${results.length} pass`);
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    process.exit(results.every((r) => r.ok) ? 0 : 1);
  }
}

main();
