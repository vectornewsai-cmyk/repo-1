#!/usr/bin/env node
/**
 * clicktest-68v2-stab-toggle-headed.mjs — Phase 9 đợt 68, luồng V2:
 * đo headed THẬT "UI toggle bật/tắt stabilize single-thread decode"
 * (đóng nợ đợt 67 U1 §7 mục 1).
 *
 * Luồng đo (vite dev + Chromium qua Xvfb + CDP, theo mẫu
 * clicktest-67u7-job-history-headed.mjs; fallback --headless=new nếu Xvfb
 * không lên được do sandbox chặn ghi — click chuột thật qua CDP không đổi).
 * clicktest-67u7-job-history-headed.mjs; KHÔNG mock):
 *   H0 setup: profile Chrome mới tinh (locale vi mặc định), project mẫu
 *        tự load (3 clip, media bin 2 item, media có file thật).
 *   H1 mở ExportPanel → toggle `export-stab-single-thread-toggle` PHẢI
 *        có, mặc định CHECKED (BẬT — giữ hành vi U1), nhãn đúng chuỗi
 *        fragment vi, hint hiện.
 *   H2 bấm toggle bằng chuột thật → UNCHECKED + localStorage
 *        `vcut-stab-single-thread` = "0".
 *   H3 bấm lại → CHECKED + localStorage = "1".
 *   H4 tải lại trang → mở lại panel → toggle vẫn CHECKED + localStorage
 *        "1" (persist BẬT qua reload).
 *   H5 set localStorage "0" → tải lại trang → mở lại panel → toggle
 *        UNCHECKED (persist TẮT qua reload).
 *   H6 dry-run node (nối trạng thái toggle → render thật): spec
 *        stabilize mặc định → đúng 1 "-threads 1" ngay trước "-i" của
 *        input stabilize; với --no-stab-single-thread → 0 lần -threads
 *        (mẫu harness U1 mục B; render harness V2 đã chạy 11/11 — đây
 *        là nối lại trong cùng phiên headed).
 *   H7 0 lỗi trang trong cả phiên.
 *
 * KHÔNG cần bridge: toggle là UI + localStorage; ExportPanel chịu được
 * bridge vắng (fetch /api/render + /api/gpu-probe catch im lặng — như
 * U7 H1). Bridge e2e riêng bị chặn môi trường (listen → EPERM write,
 * xem LIMITS V2 §5) nên không chạy bridge ở đây.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-68v2-stab-toggle-headed.mjs
 * Env: V2_DEV_PORT (mặc định tự chọn 5820–5829), V2_DEBUG_PORT (9920–9929),
 * V2_DISPLAY (mặc định :270–:279), V2_SCRATCH (mặc định
 * hidden_files/round68-v2/headed). TMPDIR riêng
 * hidden_files/round68-v2/tmp. Exit 0 mọi case PASS, 1 có FAIL,
 * 2 harness lỗi. KHÔNG push/tag/binary. Ảnh chụp + log vite/chrome nằm
 * ở SCRATCH.
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
const SCRATCH = process.env.V2_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v2", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v2", "vite.config.cjs");
const RENDER_JS = path.join(ROOT, "server", "render", "src", "render.js");
const SRC720 = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/media/shakynoisy720.mp4";

/** Chuỗi fragment round68-v2 (vi) — toggle phải hiện đúng chuỗi này. */
const EXPECT_LABEL_VI = "Chống rung: decode đơn luồng (ổn định hơn)";
const EXPECT_HINT_VI_START = "Bật: ffmpeg decode clip chống rung bằng 1 luồng";

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
  async send(method, params = {}, timeoutMs = 240000) {
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
  async evalJs(expression, timeoutMs = 240000) {
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
  if (!window.__v2injected) {
    window.__v2injected = true;
    window.__v2errors = [];
    window.addEventListener("error", (e) => { try { window.__v2errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__v2errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__v2errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__v2errors.push("unhandledrejection: <?>"); } });
  }
  window.__v2boot = window.__v2boot || Math.random().toString(36).slice(2);
})()`;

/** Trạng thái store phục vụ đo: project mẫu + media. */
const STORE_FN = `(async () => {
  const mod = window.__v2storeMod || (window.__v2storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    duration: st.spec.tracks.reduce((mx, t) => Math.max(mx, ...t.clips.map((c) => c.start + c.duration)), 0),
  };
})()`;

/** Đọc locale hiện tại từ đúng module i18n của app. */
const GET_LANG_FN = `(() => { const m = window.__v2i18nMod; return m ? m.getLang() : "no-mod"; })()`;

/** Nạp module i18n của app (để GET_LANG_FN đọc được). */
const LOAD_I18N_FN = `(async () => {
  const m = window.__v2i18nMod || (window.__v2i18nMod = await import("/src/i18n/index.ts"));
  return m.getLang();
})()`;

/** Toggle stabilize single-thread trong ExportPanel: rect + checked + nhãn + hint. */
const TOGGLE_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const t = dlg.querySelector('[data-testid="export-stab-single-thread-toggle"]');
  if (!t) return { found: false };
  t.scrollIntoView({ block: "center" });
  const r = t.getBoundingClientRect();
  const label = t.closest("label");
  const hint = dlg.querySelector(".preset-desc");
  return {
    found: true,
    x: r.left + r.width / 2, y: r.top + r.height / 2,
    checked: t.checked, disabled: t.disabled,
    visible: r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight,
    label: label ? (label.textContent || "").trim() : null,
    hint: hint ? (hint.textContent || "").trim().slice(0, 120) : null,
  };
})()`;

/** Giá trị localStorage của toggle (null = chưa có key). */
const LS_FN = `(() => { try { return localStorage.getItem("vcut-stab-single-thread"); } catch { return "ls-error"; } })()`;

/** Tiêu đề modal ExportPanel hiện tại (null = modal đã đóng). */
const MODAL_TITLE_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const head = dlg.querySelector(".modal-head");
  return head ? (head.textContent || "").trim() : null;
})()`;

/** Đóng modal bằng nút X (trả false nếu không có nút). */
const CLOSE_MODAL_FN = `(() => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return false; b.click(); return true; })()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
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
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__v2boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__v2errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__v2errors = []`).catch(() => {});
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

  /** Mở 1 Chrome mới trên cùng Xvfb (hoặc headless=new nếu Xvfb chết), trả { chrome, cdp }. */
  async function launchChrome(debugPort, profile, winW, winH, logName, display, tmpdir, headless) {
    const chromeLogFd = fs.openSync(path.join(SCRATCH, logName), "w");
    const args = ["--remote-debugging-port=" + debugPort, `--user-data-dir=${profile}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      `--window-size=${winW},${winH}`, "--hide-scrollbars", "about:blank"];
    if (headless) args.unshift("--headless=new");
    const env = { ...process.env, TMPDIR: tmpdir };
    if (!headless) env.DISPLAY = display;
    const proc = spawn(CHROME, args,
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error(`không lấy được page target CDP (debug :${debugPort})`);
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    return { chrome: proc, cdp };
  }

  /** Đọc toggle hiện tại (null = modal đóng / không thấy). */
  async function readToggle(cdp) {
    return cdp.evalJs(TOGGLE_FN).catch(() => null);
  }

  /** Bấm toggle bằng chuột thật tại rect hiện tại; trả state sau bấm. */
  async function clickToggle(cdp) {
    const t = await readToggle(cdp);
    if (!t || !t.found) throw new Error(`không tìm thấy toggle để bấm: ${JSON.stringify(t)}`);
    if (!t.visible) throw new Error(`toggle không nằm trong viewport sau scrollIntoView: ${JSON.stringify(t)}`);
    await cdp.click(t.x, t.y);
    await sleep(500);
    return readToggle(cdp);
  }

  try {
    const DEV_PORT = Number(process.env.V2_DEV_PORT || 0) || (await pickFreePort(5820, 5829));
    const DEBUG_PORT = Number(process.env.V2_DEBUG_PORT || 0) || (await pickFreePort(9920, 9929));
    const DISPLAY = process.env.V2_DISPLAY || (await pickFreeDisplay(270, 279));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5820–5829");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9920–9929");
    if (!DISPLAY) throw new Error("hết display X trống :270–:279");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1248)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v2", "tmp");
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    if (!fs.existsSync(VITE_CFG)) throw new Error(`không thấy vite config ${VITE_CFG}`);
    if (!fs.existsSync(RENDER_JS)) throw new Error(`không thấy render.js ${RENDER_JS}`);
    if (!fs.existsSync(SRC720)) throw new Error(`không thấy media ${SRC720}`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}, loadavg: ${fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" ")}`);

    // ---- Vite + Xvfb + Chrome desktop --------------------------------------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "v2-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd], env: process.env });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    // Xvfb chết trên VM này do sandbox chặn ghi sau khi tạo socket (xkbcomp
    // không ghi được keymap -> Xvfb exit 1; xem LIMITS). Fallback sang
    // headless=new: render + click chuột thật qua CDP vẫn giữ nguyên.
    let headless = false;
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) {
      log(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode}) — fallback Chrome headless=new`);
      headless = true;
    }
    const desk = await launchChrome(DEBUG_PORT, PROFILE, 1440, 900, "v2-chrome.log", DISPLAY, TMPDIR, headless);
    chrome = desk.chrome;
    const cdp = desk.cdp;

    // ---- H0: setup vi + mount + mẫu ---------------------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    const s0 = await cdp.evalJs(STORE_FN).catch(() => null);
    const lang0 = await cdp.evalJs(LOAD_I18N_FN).catch(() => null);
    await drainErrors(cdp);
    if (s0 && s0.clipCount === 3 && s0.mediaCount === 2 && s0.media.every((m) => m.hasFile)) {
      pass("H0 setup: locale vi + mẫu tự load", `3 clip, media bin 2 item đều có file, duration ${s0.duration}s, lang=${lang0}`);
    } else {
      fail("H0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(s0)}, lang=${lang0}`);
    }

    // ---- H1: mở ExportPanel → toggle có, mặc định BẬT, nhãn vi đúng ------
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const t1 = await readToggle(cdp);
    const ls1 = await cdp.evalJs(LS_FN).catch(() => "eval-loi");
    if (t1 && t1.found && t1.checked === true && !t1.disabled && t1.label === EXPECT_LABEL_VI && (t1.hint || "").startsWith(EXPECT_HINT_VI_START)) {
      pass("H1 toggle có + mặc định BẬT + nhãn/hint vi đúng", `checked=true, label="${t1.label}", hint="${(t1.hint || "").slice(0, 60)}…", localStorage=${JSON.stringify(ls1)} (chưa có key = mặc định BẬT)`);
    } else {
      fail("H1 toggle có + mặc định BẬT + nhãn/hint vi đúng", `toggle=${JSON.stringify(t1)}, localStorage=${JSON.stringify(ls1)} (chờ checked=true, label="${EXPECT_LABEL_VI}", hint bắt đầu "${EXPECT_HINT_VI_START}")`);
    }
    await drainErrors(cdp);

    // ---- H2: bấm toggle → TẮT + localStorage "0" ---------------------------
    const t2 = await clickToggle(cdp).catch((e) => { fail("H2 bấm toggle → TẮT + localStorage \"0\"", `lỗi bấm: ${e.message}`); return null; });
    if (t2) {
      const ls2 = await cdp.evalJs(LS_FN).catch(() => "eval-loi");
      if (t2.checked === false && ls2 === "0") {
        pass("H2 bấm toggle → TẮT + localStorage \"0\"", `checked=false sau click chuột thật, localStorage="0"`);
      } else {
        fail("H2 bấm toggle → TẮT + localStorage \"0\"", `sau click: toggle=${JSON.stringify(t2)}, localStorage=${JSON.stringify(ls2)} (chờ checked=false + "0")`);
      }
    }
    await cdp.shot("v2-toggle-off.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H3: bấm lại → BẬT + localStorage "1" ------------------------------
    const t3 = await clickToggle(cdp).catch((e) => { fail("H3 bấm lại → BẬT + localStorage \"1\"", `lỗi bấm: ${e.message}`); return null; });
    if (t3) {
      const ls3 = await cdp.evalJs(LS_FN).catch(() => "eval-loi");
      if (t3.checked === true && ls3 === "1") {
        pass("H3 bấm lại → BẬT + localStorage \"1\"", `checked=true sau click lần 2, localStorage="1"`);
      } else {
        fail("H3 bấm lại → BẬT + localStorage \"1\"", `sau click lần 2: toggle=${JSON.stringify(t3)}, localStorage=${JSON.stringify(ls3)} (chờ checked=true + "1")`);
      }
    }
    await drainErrors(cdp);

    // ---- H4: tải lại trang → mở lại panel → vẫn BẬT -------------------------
    const bootBefore = await cdp.evalJs(`window.__v2boot`).catch(() => null);
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, bootBefore);
    const ls4pre = await cdp.evalJs(LS_FN).catch(() => "eval-loi");
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const t4 = await readToggle(cdp);
    if (t4 && t4.found && t4.checked === true && ls4pre === "1") {
      pass("H4 reload → mở lại panel → vẫn BẬT (persist qua reload)", `localStorage="1" sau reload, toggle checked=true`);
    } else {
      fail("H4 reload → mở lại panel → vẫn BẬT (persist qua reload)", `sau reload: localStorage=${JSON.stringify(ls4pre)}, toggle=${JSON.stringify(t4)} (chờ "1" + checked=true)`);
    }
    await drainErrors(cdp);

    // ---- H5: set localStorage "0" → reload → toggle TẮT --------------------
    await cdp.evalJs(`(() => { localStorage.setItem("vcut-stab-single-thread", "0"); return localStorage.getItem("vcut-stab-single-thread"); })()`).catch(() => null);
    const bootBefore5 = await cdp.evalJs(`window.__v2boot`).catch(() => null);
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, bootBefore5);
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const t5 = await readToggle(cdp);
    const ls5 = await cdp.evalJs(LS_FN).catch(() => "eval-loi");
    if (t5 && t5.found && t5.checked === false && ls5 === "0") {
      pass("H5 localStorage \"0\" → reload → toggle TẮT (persist chiều tắt)", `localStorage="0" sau reload, toggle checked=false`);
    } else {
      fail("H5 localStorage \"0\" → reload → toggle TẮT (persist chiều tắt)", `sau reload: localStorage=${JSON.stringify(ls5)}, toggle=${JSON.stringify(t5)} (chờ "0" + checked=false)`);
    }
    await cdp.shot("v2-toggle-off-reload.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H6: dry-run node — nối trạng thái toggle → render -----------------
    // (Render harness V2 đã chạy 11/11; đây là nối lại trong phiên headed.)
    const dry = await (async () => {
      const { spawnSync } = await import("node:child_process");
      const mediaDir = path.join(SCRATCH, "dry-media");
      fs.mkdirSync(mediaDir, { recursive: true });
      fs.copyFileSync(SRC720, path.join(mediaDir, "shaky720.mp4"));
      const spec = {
        version: "0.2.0",
        meta: { name: "r68v2-headed", width: 1280, height: 720, fps: 30 },
        tracks: [{ id: "v0", kind: "video",
          clips: [{ id: "c0", kind: "video", src: "shaky720.mp4", start: 0, duration: 5, in: 0, out: 5, sourceAudioMode: "mute", enhance: { stabilize: { smoothing: 10 } } }] }],
      };
      const specPath = path.join(SCRATCH, "dry-spec.json");
      writeFileEpermRetry(specPath, JSON.stringify(spec));
      const run = (extra) => spawnSync("node", [RENDER_JS, "--spec", specPath, "--out", path.join(SCRATCH, "dry.mp4"),
        "--media-dir", mediaDir, "--encoder", "libx264", "--dry-run", ...(extra || [])],
        { cwd: ROOT, encoding: "utf8" });
      const count = (r) => {
        const line = (r.stdout || "").split("\n").find((l) => l.includes("ffmpeg")) || "";
        const toks = line.trim().split(/\s+/);
        let n = 0;
        for (let i = 0; i + 3 < toks.length; i++) {
          if (toks[i] === "-threads" && toks[i + 1] === "1" && toks[i + 2] === "-i") n++;
        }
        return { n, line };
      };
      const dOn = run([]);
      const dOff = run(["--no-stab-single-thread"]);
      return { on: count(dOn), off: count(dOff), onStatus: dOn.status, offStatus: dOff.status };
    })();
    if (dry.onStatus === 0 && dry.offStatus === 0 && dry.on.n === 1 && dry.off.n === 0) {
      pass("H6 dry-run: BẬT → 1× -threads 1, TẮT → 0 (nối toggle → render)", `toggle BẬT: ${dry.on.n} lần "-threads 1" trước "-i"; toggle TẮT: ${dry.off.n} lần`);
    } else {
      fail("H6 dry-run: BẬT → 1× -threads 1, TẮT → 0 (nối toggle → render)", `on=${JSON.stringify(dry.on)}, off=${JSON.stringify(dry.off)}, status on=${dry.onStatus} off=${dry.offStatus}`);
    }

    // ---- H7: 0 lỗi trang ---------------------------------------------------
    await drainErrors(cdp);
    if (phaseErrors.length === 0) {
      pass("H7 0 lỗi trang trong cả phiên", "không có window.onerror / unhandledrejection");
    } else {
      fail("H7 0 lỗi trang trong cả phiên", `${phaseErrors.length} lỗi: ${JSON.stringify(phaseErrors.slice(0, 3))}`);
    }

    const nPass = results.filter((r) => r.ok).length;
    const summary = { pass: nPass, total: results.length, results, loadavg: fs.readFileSync("/proc/loadavg", "utf8").trim() };
    writeFileEpermRetry(path.join(SCRATCH, "v2-results.json"), JSON.stringify(summary, null, 2));
    log(`KẾT QUẢ HEADED: ${nPass}/${results.length} pass (loadavg cuối: ${summary.loadavg})`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (err) {
    log(`HARNESS LỖI: ${err && err.message ? err.message : err}`);
    try {
      writeFileEpermRetry(path.join(SCRATCH, "v2-results.json"), JSON.stringify({ error: String(err && err.message ? err.message : err) }, null, 2));
    } catch { /* bỏ qua */ }
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
