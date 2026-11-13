#!/usr/bin/env node
/**
 * clicktest-65s10-job-note-locale-headed.mjs — Phase 9 đợt 65, luồng S10:
 * đo headed THẬT "đổi locale giữa chừng lúc jobNote đang hiện" (đóng nợ
 * đợt 64 R8 §7.3 / ROUND64_LIMITS §8.10).
 *
 * Luồng đo (vite dev + bridge THẬT + Chromium headed qua Xvfb + CDP,
 * theo mẫu clicktest-64r8-job-note-headed.mjs; KHÔNG mock, KHÔNG stub poll):
 *   H0 setup: profile Chrome mới tinh (locale vi mặc định), project mẫu
 *        tự load (3 clip, media bin 2 item, media có file thật).
 *   H1 mở ExportPanel → chưa render nên `.render-note` PHẢI VẮNG.
 *   H2 bấm CTA "🎬 Xuất MP4 (1920×1080)" → render thật qua bridge; node
 *        poll `GET /api/render` mỗi 300ms; ngay khi job chuyển "running"
 *        thì SIGKILL bridge giữa chừng.
 *   H3 khởi động LẠI bridge (cùng BRIDGE_WORK_DIR + cùng cổng) → bridge
 *        recover job từ job.json lúc boot; node GET job trực tiếp:
 *        `noteCode` PHẢI là "JOB_RECOVERED_RESTART", `note` PHẢI là chuỗi
 *        RECOVER_NOTE (bằng chứng phía server, độc lập với UI).
 *   H4 trong trang: chờ `.render-note` xuất hiện với đúng chuỗi vi
 *        "Phục hồi sau khi server restart — render lại từ đầu."
 *   H5 ĐỔI LOCALE GIỮA CHỪNG (nợ chính): gọi setLang("en") THẬT của app
 *        (dynamic import "/src/i18n/index.ts" — cùng module instance với
 *        app, đúng hàm desktop.ts gọi khi menu native Xem > Ngôn ngữ đổi;
 *        nút TopBar không bấm được khi modal mở vì backdrop z 400 che —
 *        xem unit test S10 §3) trong lúc note vi đang hiện → chờ
 *        `.render-note` đổi sang đúng chuỗi en trong ≤10s (poll 1s của
 *        ExportPanel dùng getLang() nên tối đa ~1s + độ trễ đo); đồng
 *        thời tiêu đề modal phải sang "Export video" (re-render toàn
 *        panel, không crash), thanh tiến trình vẫn hiện.
 *   H6 đổi ngược về vi bằng cùng đường → note về đúng chuỗi vi ≤10s,
 *        tiêu đề modal về "Xuất video".
 *   H7 đóng modal → nút ngôn ngữ TopBar bấm được bằng chuột thật →
 *        bấm 1 lần → locale lật sang en (TopBar hiện 🇺🇸, nút Xuất bản
 *        thành "⬇ Publish") → mở lại ExportPanel → panel mở bằng en
 *        (tiêu đề "Export video") và `.render-note` VẮNG (không resume
 *        job — hành vi có chủ đích từ R8 §3: đóng modal dừng polling,
 *        mở lại không nối lại job đang chạy; ghi nhận, không phải lỗi).
 *   H8 0 lỗi trang trong cả phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-65s10-job-note-locale-headed.mjs
 * Env: S10_DEV_PORT (mặc định tự chọn 5650–5659), S10_DEBUG_PORT (9750–9759),
 * S10_BRIDGE_PORT (8900–8909), S10_DISPLAY (mặc định :206–:215),
 * S10_SCRATCH (mặc định hidden_files/round65-s10/headed). TMPDIR riêng
 * /tmp/round65-s10/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
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
const SCRATCH = process.env.S10_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round65-s10", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round65-s10";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.s10.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round65-s10/bridge-work";

/** Chuỗi note bridge gắn khi phục hồi — KHỚP jobQueue.js RECOVER_NOTE + fragment round64-r8. */
const EXPECT_NOTE_VI = "Phục hồi sau khi server restart — render lại từ đầu.";
const EXPECT_NOTE_EN = "Recovered after a server restart — rendering again from the start.";

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
  if (!window.__s10injected) {
    window.__s10injected = true;
    window.__s10errors = [];
    window.addEventListener("error", (e) => { try { window.__s10errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__s10errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__s10errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__s10errors.push("unhandledrejection: <?>"); } });
  }
  window.__s10boot = window.__s10boot || Math.random().toString(36).slice(2);
})()`;

/** Trạng thái store phục vụ đo: project mẫu + media. */
const STORE_FN = `(async () => {
  const mod = window.__s10storeMod || (window.__s10storeMod = await import("/src/store.ts"));
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

/** Đổi locale bằng đúng hàm setLang của app (cùng module instance với app,
 *  mẫu STORE_FN của R8). Đây là hàm desktop.ts gọi khi menu native đổi ngôn
 *  ngữ — đường đổi locale duy nhất khi modal đang mở (nút TopBar bị backdrop
 *  che, xem unit test S10 §3). */
const SET_LANG_FN = `(async (l) => {
  const m = window.__s10i18nMod || (window.__s10i18nMod = await import("/src/i18n/index.ts"));
  m.setLang(l);
  return m.getLang();
})`;

/** Đọc locale hiện tại từ đúng module i18n của app (đã import ở H5/H6). */
const GET_LANG_FN = `(() => { const m = window.__s10i18nMod; return m ? m.getLang() : "no-mod"; })()`;

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

/** Tìm nút đổi ngôn ngữ TopBar (cờ 🇻🇳/🇺🇸), trả rect để bấm chuột thật. */
const LANG_BTN_FN = `(() => {
  const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes("🇻🇳") || (x.textContent || "").includes("🇺🇸"));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, flag: (b.textContent || "").trim(), visible: r.width > 0 };
})()`;

/** Tiêu đề modal ExportPanel hiện tại (null = modal đã đóng). */
const MODAL_TITLE_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const head = dlg.querySelector(".modal-head");
  return head ? (head.textContent || "").trim() : null;
})()`;

/** Text nút Xuất bản trên TopBar (đổi theo locale: "⬇ Xuất bản" / "⬇ Publish"). */
const PUBLISH_BTN_FN = `(() => {
  const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes("Xuất bản") || (x.textContent || "").includes("Publish"));
  return b ? (b.textContent || "").trim() : null;
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
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__s10boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__s10errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__s10errors = []`).catch(() => {});
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
    const DEV_PORT = Number(process.env.S10_DEV_PORT || 0) || (await pickFreePort(5650, 5659));
    const DEBUG_PORT = Number(process.env.S10_DEBUG_PORT || 0) || (await pickFreePort(9750, 9759));
    const BRIDGE_PORT = Number(process.env.S10_BRIDGE_PORT || 0) || (await pickFreePort(8900, 8909));
    const DISPLAY = process.env.S10_DISPLAY || (await pickFreeDisplay(206, 215));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5650–5659");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9750–9759");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8900–8909");
    if (!DISPLAY) throw new Error("hết display X trống :206–:215");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1248)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round65-s10/tmp";
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
    bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "s10-bridge-1.log");
    log(`bridge lần 1 OK: ${BRIDGE_URL} (WORK_DIR=${BRIDGE_WORK_DIR})`);

    // ---- Vite + Xvfb + Chrome ----------------------------------------------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "s10-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "s10-chrome.log"), "w");
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
      for (let i = 0; i < 30; i++) {
        const dead = await fetch(BRIDGE_URL + "/api/health").then(() => false).catch(() => true);
        if (dead) break;
        await sleep(500);
      }
      pass("H2 kill bridge lúc job running", `job ${jobAtKill.id} status=${killStatus} progress=${jobAtKill.progress} lúc kill`);
    }

    // ---- H3: restart bridge → recover job, kiểm chứng phía server --------
    bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "s10-bridge-2.log");
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
    await cdp.shot("s10-after-restart.png").catch(() => {});

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
    await cdp.shot("s10-note-visible-vi.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H5: đổi locale vi→en giữa chừng lúc note đang hiện ---------------
    const t5 = Date.now();
    const langAfter = await cdp.evalJs(`${SET_LANG_FN}("en")`).catch((e) => `eval-loi: ${e.message}`);
    if (langAfter !== "en") {
      fail("H5 đổi locale vi→en lúc note đang hiện", `setLang("en") trả về ${JSON.stringify(langAfter)} (không đổi được locale)`);
    } else {
      const noteEn = await cdp.waitFor(async () => {
        const n = await cdp.evalJs(NOTE_FN).catch(() => null);
        return n && n.text === EXPECT_NOTE_EN ? n : null;
      }, ".render-note đổi sang chuỗi en", 10000).catch(() => null);
      const ms5 = Date.now() - t5;
      if (noteEn) {
        const titleEn = await cdp.evalJs(MODAL_TITLE_FN).catch(() => null);
        const progressStillThere = await cdp.evalJs(`!!document.querySelector(".render-progress .progress-bar")`).catch(() => false);
        if (titleEn && titleEn.includes("Export video") && progressStillThere) {
          pass("H5 đổi locale vi→en lúc note đang hiện", `note sang en sau ${ms5}ms (≤1 poll + độ trễ đo); tiêu đề modal "Export video"; thanh tiến trình còn; không kẹt text vi`);
        } else {
          fail("H5 đổi locale vi→en lúc note đang hiện", `note đã sang en sau ${ms5}ms nhưng tiêu đề modal=${JSON.stringify(titleEn)} / progressBar=${progressStillThere}`);
        }
      } else {
        const cur = await cdp.evalJs(NOTE_FN).catch(() => "eval-loi");
        fail("H5 đổi locale vi→en lúc note đang hiện", `.render-note sau 10s: ${JSON.stringify(cur)} (chờ "${EXPECT_NOTE_EN}") — KẸT TEXT VI hoặc không cập nhật`);
      }
    }
    await cdp.shot("s10-note-visible-en.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H6: đổi ngược en→vi, note phải về chuỗi vi -----------------------
    const t6 = Date.now();
    const langBack = await cdp.evalJs(`${SET_LANG_FN}("vi")`).catch((e) => `eval-loi: ${e.message}`);
    if (langBack !== "vi") {
      fail("H6 đổi locale en→vi lúc note đang hiện", `setLang("vi") trả về ${JSON.stringify(langBack)}`);
    } else {
      const noteVi = await cdp.waitFor(async () => {
        const n = await cdp.evalJs(NOTE_FN).catch(() => null);
        return n && n.text === EXPECT_NOTE_VI ? n : null;
      }, ".render-note về lại chuỗi vi", 10000).catch(() => null);
      const ms6 = Date.now() - t6;
      if (noteVi) {
        const titleVi = await cdp.evalJs(MODAL_TITLE_FN).catch(() => null);
        if (titleVi && titleVi.includes("Xuất video")) {
          pass("H6 đổi locale en→vi lúc note đang hiện", `note về vi sau ${ms6}ms; tiêu đề modal "Xuất video"; không kẹt text en`);
        } else {
          fail("H6 đổi locale en→vi lúc note đang hiện", `note đã về vi sau ${ms6}ms nhưng tiêu đề modal=${JSON.stringify(titleVi)}`);
        }
      } else {
        const cur = await cdp.evalJs(NOTE_FN).catch(() => "eval-loi");
        fail("H6 đổi locale en→vi lúc note đang hiện", `.render-note sau 10s: ${JSON.stringify(cur)} (chờ "${EXPECT_NOTE_VI}") — KẸT TEXT EN`);
      }
    }
    await drainErrors(cdp);

    // ---- H7: đóng modal → nút ngôn ngữ TopBar bấm được → mở lại panel ----
    // Đóng modal bằng nút X (handleClose → stopPolling). Sau đó bấm nút cờ
    // bằng chuột thật: locale phải lật sang en. Mở lại ExportPanel: panel
    // mở bằng en, .render-note VẮNG (không resume job — hành vi có chủ
    // đích R8 §3, ghi nhận tại đây).
    let h7ok = true; let h7detail = "";
    const closed = await cdp.evalJs(`(() => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return false; b.click(); return true; })()`).catch(() => false);
    if (!closed) { h7ok = false; h7detail = "không bấm được nút X đóng modal"; }
    else {
      const gone = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(MODAL_TITLE_FN).catch(() => "eval-loi");
        return t === null ? true : null;
      }, "modal đóng hẳn", 8000).catch(() => false);
      if (!gone) { h7ok = false; h7detail = "modal không đóng sau khi bấm X"; }
      else {
        const langBtn = await cdp.evalJs(LANG_BTN_FN).catch(() => null);
        if (!langBtn || !langBtn.visible) { h7ok = false; h7detail = `không tìm thấy nút cờ TopBar sau khi đóng modal: ${JSON.stringify(langBtn)}`; }
        else {
          await cdp.click(langBtn.x, langBtn.y);
          const langNow = await cdp.evalJs(GET_LANG_FN).catch(() => "eval-loi");
          const publishNow = await cdp.evalJs(PUBLISH_BTN_FN).catch(() => null);
          if (langNow !== "en" || publishNow !== "⬇ Publish") {
            h7ok = false; h7detail = `sau khi bấm nút cờ: getLang=${JSON.stringify(langNow)}, nút Xuất bản=${JSON.stringify(publishNow)} (chờ en / "⬇ Publish")`;
          } else {
            await openModalTopBar(cdp, "Publish", "Export video");
            const titleEn2 = await cdp.evalJs(MODAL_TITLE_FN).catch(() => null);
            const noteReopen = await cdp.evalJs(NOTE_FN).catch(() => "eval-loi");
            await sleep(2500); // chờ 2+ tick poll nếu có resume thì note sẽ hiện
            const noteReopen2 = await cdp.evalJs(NOTE_FN).catch(() => "eval-loi");
            if (titleEn2 && titleEn2.includes("Export video") && noteReopen === null && noteReopen2 === null) {
              h7detail = `đóng modal → bấm cờ TopBar bằng chuột thật → locale en (nút "⬇ Publish"); mở lại panel bằng en, .render-note vắng (không resume job — đúng thiết kế R8 §3)`;
            } else {
              h7ok = false; h7detail = `mở lại panel: tiêu đề=${JSON.stringify(titleEn2)}, note lúc mở=${JSON.stringify(noteReopen)}, note sau 2.5s=${JSON.stringify(noteReopen2)}`;
            }
          }
        }
      }
    }
    if (h7ok) pass("H7 đóng modal → bấm cờ TopBar → mở lại panel en, note vắng", h7detail);
    else fail("H7 đóng modal → bấm cờ TopBar → mở lại panel en, note vắng", h7detail);
    await drainErrors(cdp);

    // ---- H8: 0 lỗi trang ---------------------------------------------------
    if (phaseErrors.length === 0) pass("H8 0 lỗi trang", "không có window.onerror / unhandledrejection cả phiên");
    else fail("H8 0 lỗi trang", `${phaseErrors.length} lỗi: ${phaseErrors.slice(0, 3).join(" || ")}`);
  } catch (e) {
    results.push({ name: "HARNESS", ok: false, detail: (e && e.stack) || String(e) });
    log(`HARNESS LỖI: ${(e && e.message) || e}`);
  } finally {
    killAll();
    await sleep(500);
    writeFileEpermRetry(path.join(SCRATCH, "s10-results.json"), JSON.stringify({ results, logLines }, null, 2));
    const nPass = results.filter((r) => r.ok).length;
    log(`KẾT QUẢ: ${nPass}/${results.length} pass`);
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    process.exit(results.every((r) => r.ok) ? 0 : 1);
  }
}

main();
