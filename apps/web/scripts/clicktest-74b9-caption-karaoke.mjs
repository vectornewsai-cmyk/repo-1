#!/usr/bin/env node
/**
 * clicktest-74b9-caption-karaoke.mjs — Phase 9 đợt 74, luồng B9 (gap A1):
 * kiểm chứng HEADED THẬT cho template style karaoke trong CaptionModal +
 * preview highlight.
 *
 * Chạy headed THẬT (vite dev + bridge stub + Chromium headed qua Xvfb + CDP,
 * Node thuần, không Playwright), theo mẫu clicktest-60q3-caption-modal.mjs.
 * Bridge chạy với CAPTION_PY=stub (server/bridge/test/test-caption-stub.py)
 * nên caption trả nhanh 3 câu + 2 word timestamps, KHÔNG cần model
 * faster-whisper. KHÔNG sửa code sản phẩm trong harness này — chỉ đo.
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   B0 setup vi: mount → project mẫu tự load (3 clip, media bin 2 item).
 *   B1 chạy caption stub: mở CaptionModal → "Bắt đầu tạo phụ đề" → bước
 *        review lên (3 câu) với checkbox karaoke + select template 3 lựa
 *        chọn, mặc định "Vàng nổi bật".
 *   B2 chọn template "Nền mờ": select đổi sang nen-mo, nút Áp dụng còn
 *        nguyên, modal không tràn (đo hình học như Q3).
 *   B3 Apply bằng chuột thật → track "Phụ đề" mới lên timeline, clip 1
 *        mang đúng style template (nền #00000080, highlight #00e5ff) VÀ
 *        karaoke clip-local 2 từ [0,0.4] [0.4,0.8] (đọc từ store thật).
 *   B4 preview highlight: playhead 1.0 (đang hát từ "chào") → canvas
 *        preview có >100 pixel cyan sáng (#00e5ff); playhead 0.1 (trước
 *        clip) → <10 pixel cyan. Screenshot cả hai.
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-74b9-caption-karaoke.mjs
 * Env: B9_DEV_PORT (mặc định tự chọn 5480–5489), B9_DEBUG_PORT (9580–9589),
 * B9_DISPLAY (mặc định :172 — display RIÊNG của B9), B9_BRIDGE_PORT (mặc
 * định 8787), B9_SCRATCH (mặc định
 * hidden_files/round74-b9/headed). TMPDIR riêng /tmp/round74-b9/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
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
const SCRATCH = process.env.B9_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round74-b9", "headed");
const CHROME = path.join(os.homedir(), ".cache", "ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round74-b9";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.b9.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const CAPTION_STUB = path.join(ROOT, "server", "bridge", "test", "test-caption-stub.py");

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
  window.__b9errors = [];
  window.addEventListener("error", (e) => { try { window.__b9errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__b9errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__b9errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__b9errors.push("unhandledrejection: <?>"); } });
  window.__b9boot = Math.random().toString(36).slice(2);
})()`;

// Tọa độ giữa của nút có text chứa substr (đo thật trên DOM headed).
const BTN_RECT_FN = (substr) => `((s) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(s));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled };
})(${JSON.stringify(substr)})`;

// Trạng thái store thật: track phụ đề + clip karaoke (đọc qua module store).
const STATE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__b9storeMod || (window.__b9storeMod = await import(hit));
  const st = mod.useStore.getState();
  const capTracks = st.spec.tracks.filter((t) => t.kind === "text" && t.label.startsWith("Phụ đề"));
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    labels: st.spec.tracks.map((t) => t.label),
    playhead: st.playhead,
    capTracks: capTracks.map((t) => ({
      label: t.label,
      clips: t.clips.map((c) => ({
        id: c.id, text: c.text, start: c.start, duration: c.duration,
        bg: c.style?.backgroundColor, hi: c.style?.highlightColor,
        color: c.style?.color, karaoke: c.karaoke || null,
      })),
    })),
    errors: (window.__b9errors || []).slice(),
  };
})()`;

// Thông tin select template trong modal review (B9).
const TEMPLATE_SELECT_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const sel = dlg.querySelector('select[aria-label="Kiểu karaoke:"]');
  if (!sel) return { found: false };
  return {
    found: true,
    value: sel.value,
    options: [...sel.options].map((o) => ({ value: o.value, text: o.textContent.trim() })),
    karaokeChecked: (() => { const cb = dlg.querySelector('input[type="checkbox"]'); return cb ? cb.checked : null; })(),
  };
})()`;

// Chọn template bằng native setter (React controlled select).
const SET_TEMPLATE_FN = (id) => `(() => {
  const sel = document.querySelector('select[aria-label="Kiểu karaoke:"]');
  if (!sel) return { ok: false, reason: "không thấy select template" };
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(sel, ${JSON.stringify(id)});
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: true, value: sel.value };
})(${JSON.stringify(id)})`;

// Đếm pixel cyan sáng (#00e5ff ±40) trên mọi canvas của trang (preview 2D).
// Video mẫu tối (gradient lightness 16–32%, không có cyan sáng) nên cyan
// chỉ có thể đến từ chữ karaoke đang hát. Trả về canvas có nhiều cyan nhất.
const CYAN_COUNT_FN = `(() => {
  const out = [];
  for (const cv of document.querySelectorAll("canvas")) {
    try {
      const ctx = cv.getContext("2d");
      if (!ctx) { out.push({ w: cv.width, h: cv.height, skipped: "no-2d" }); continue; }
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let cyan = 0, white = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r <= 40 && g >= 189 && g <= 255 && b >= 215) cyan++;
        if (r > 235 && g > 235 && b > 235) white++;
      }
      out.push({ w: cv.width, h: cv.height, cyan, white });
    } catch (e) { out.push({ w: cv.width, h: cv.height, skipped: String(e).slice(0, 80) }); }
  }
  return out;
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, bridge = null, xvfb = null, chrome = null;
  const phaseErrors = [];
  const DEV_PORT = await pickFreePort(5480, 5489);
  const DEBUG_PORT = await pickFreePort(9580, 9589);
  const BRIDGE_PORT = parseInt(process.env.B9_BRIDGE_PORT || "8787", 10);
  const DISPLAY = process.env.B9_DISPLAY || ":172";
  function killAll() {
    for (const [name, p] of [["vite", vite], ["bridge", bridge], ["chrome", chrome], ["xvfb", xvfb]]) {
      try { if (p && p.exitCode === null) p.kill("SIGKILL"); } catch { /* đã chết */ }
    }
  }
  async function drainErrors(cdp) {
    const errs = [...(cdp.exceptions || [])];
    cdp.exceptions = [];
    const w = await cdp.evalJs(`(window.__b9errors || []).slice()`).catch(() => []);
    phaseErrors.push(...errs, ...w);
    return errs.concat(w);
  }
  async function ensureNoModal(cdp) {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => ["Later", "Để sau", "Skip", "Đóng", "Close"].includes(x.textContent.trim())); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }
  async function afterReload(cdp) {
    await cdp.waitFor(async () => {
      const b = await cdp.evalJs(`window.__b9boot`).catch(() => null);
      return b || null;
    }, "boot marker sau reload", 120000);
    await ensureNoModal(cdp);
    return cdp.evalJs(`window.__b9boot`);
  }
  // Mở CaptionModal bằng chuột thật qua nút TopBar, chờ dialog có tiêu đề.
  // Cứng cáp như mẫu Q3: welcome modal mở TRỄ (khi `ready` bật sau khi mẫu
  // load xong) nên có thể phủ lên TopBar SAU khi ensureNoModal đã chạy —
  // kiểm tra lại overlay ngay trước mỗi cú click, bấm lại tối đa 3 lần;
  // nút TopBar tìm trong header.topbar (không tìm toàn document).
  async function openModal(cdp, topBtnSubstr, titleSubstr) {
    const topBtnFn = `(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => x.textContent.includes(${JSON.stringify(topBtnSubstr)})); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim() }; })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await ensureNoModal(cdp);
      const btn = await cdp.evalJs(topBtnFn);
      if (!btn) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" (lần ${attempt})`);
      await cdp.click(btn.x, btn.y);
      const opened = await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes(${JSON.stringify(titleSubstr)}) ? true : null; })()`).catch(() => null);
        return m;
      }, `CaptionModal mở (tiêu đề ${titleSubstr}, lần ${attempt})`, 8000).catch(() => null);
      if (opened) return true;
      log(`openModal lần ${attempt}: CaptionModal chưa mở — kiểm tra overlay rồi bấm lại`);
      await sleep(1000);
    }
    throw new Error(`timeout chờ CaptionModal mở (tiêu đề ${titleSubstr}) sau 3 lần bấm`);
  }
  async function ensureCaptionClosed(cdp) {
    await cdp.waitFor(async () => {
      const d = await cdp.evalJs(`!!document.querySelector('[role="dialog"]')`).catch(() => true);
      return d === false ? true : null;
    }, "modal đã đóng", 30000);
  }

  try {
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (B9 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(BRIDGE_ENTRY)) throw new Error("không thấy bridge");
    if (!fs.existsSync(CAPTION_STUB)) throw new Error("không thấy caption stub");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round74-b9/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, bridge :${BRIDGE_PORT} (CAPTION_PY=stub), debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    // Bridge với caption stub (trả 3 câu + 2 word timestamps, không cần model).
    const bridgeLogFd = fs.openSync(path.join(SCRATCH, "b9-bridge.log"), "w");
    bridge = spawn("node", [BRIDGE_ENTRY], {
      cwd: path.join(ROOT, "server", "bridge"),
      stdio: ["ignore", bridgeLogFd, bridgeLogFd],
      env: { ...process.env, BRIDGE_PORT: String(BRIDGE_PORT), CAPTION_PY: CAPTION_STUB },
    });
    let bridgeUp = false;
    for (let i = 0; i < 60 && !bridgeUp; i++) {
      try { const r = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/health`); if (r.ok) bridgeUp = true; else await sleep(1000); } catch { await sleep(1000); }
    }
    if (!bridgeUp) {
      // /api/health có thể không tồn tại — thử root, không được thì vẫn tiếp
      // tục (caption POST sẽ chứng minh bridge sống hay không).
      log(`bridge chưa trả /api/health sau 60s — tiếp tục, caption POST sẽ chứng minh`);
    } else log("bridge đã lên");

    const viteLogFd = fs.openSync(path.join(SCRATCH, "b9-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd],
        env: { ...process.env, VITE_BRIDGE_URL: `http://127.0.0.1:${BRIDGE_PORT}` } });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "b9-chrome.log"), "w");
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

    // ---- B0: setup vi + mount + mẫu tự load ---------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount lần đầu (locale vi mặc định)", 240000);
    const boot0 = await afterReload(cdp);
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
    }, "project mẫu tự load (3 clip, media bin 2 item) dưới locale vi", 180000);
    const captionsBtn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => x.textContent.includes("Phụ đề")); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled }; })()`);
    const bootStable0 = (await cdp.evalJs(`window.__b9boot`).catch(() => null)) === boot0;
    await drainErrors(cdp);
    if (bootStable0 && s0 && captionsBtn && !captionsBtn.disabled) {
      pass("B0 setup: locale vi + mẫu tự load + nút Phụ đề", `boot ổn định, 3 clip (labels ${JSON.stringify(s0.labels)}), media bin 2 item, nút TopBar "${captionsBtn.text}"`);
    } else {
      fail("B0 setup: locale vi + mẫu tự load + nút Phụ đề", `boot ổn định=${bootStable0}, captionsBtn=${JSON.stringify(captionsBtn)}, state=${JSON.stringify(s0)}`);
    }

    // ---- B1: chạy caption stub → review có select template ------------
    {
      await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
      const startBtn = await cdp.evalJs(BTN_RECT_FN("Bắt đầu tạo phụ đề"));
      if (!startBtn || startBtn.disabled) {
        fail("B1 caption stub → review có select template", `không thấy nút Bắt đầu (hoặc bị disable): ${JSON.stringify(startBtn)}`);
      } else {
        await cdp.click(startBtn.x, startBtn.y);
        const tpl = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(TEMPLATE_SELECT_FN).catch(() => null);
          return t && t.found ? t : null;
        }, "bước review lên với select template karaoke (caption stub ~1s)", 120000);
        await drainErrors(cdp);
        const opts = tpl ? tpl.options.map((o) => `${o.value}="${o.text}"`).join(", ") : "";
        if (tpl && tpl.options.length === 3 && tpl.value === "vang-noi-bat" && tpl.karaokeChecked === true) {
          pass("B1 caption stub → review có select template", `3 lựa chọn [${opts}], mặc định vang-noi-bat, karaoke đang bật`);
        } else {
          fail("B1 caption stub → review có select template", `select=${JSON.stringify(tpl)}`);
        }
        await cdp.shot("b9-review-vi.png");
      }
    }

    // ---- B2: chọn template "Nền mờ" ------------------------------------
    {
      const set = await cdp.evalJs(SET_TEMPLATE_FN("nen-mo")).catch((e) => ({ ok: false, reason: e.message }));
      const tpl = await cdp.evalJs(TEMPLATE_SELECT_FN).catch(() => null);
      const applyBtn = await cdp.evalJs(BTN_RECT_FN("Áp dụng 3 câu"));
      await drainErrors(cdp);
      if (set.ok && tpl && tpl.value === "nen-mo" && applyBtn && !applyBtn.disabled) {
        pass("B2 chọn template Nền mờ", `select=nen-mo, nút "${applyBtn.text}" vẫn bấm được`);
      } else {
        fail("B2 chọn template Nền mờ", `set=${JSON.stringify(set)}, select=${JSON.stringify(tpl)}, apply=${JSON.stringify(applyBtn)}`);
      }
    }

    // ---- B3: Apply → track phụ đề mang style template + karaoke -------
    {
      const applyBtn = await cdp.evalJs(BTN_RECT_FN("Áp dụng 3 câu"));
      if (!applyBtn) {
        fail("B3 Apply → track phụ đề style template + karaoke", "không thấy nút Áp dụng 3 câu");
      } else {
        await cdp.click(applyBtn.x, applyBtn.y);
        const s3 = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(STATE_FN).catch(() => null);
          return t && t.capTracks.length > 0 ? t : null;
        }, "track Phụ đề mới lên timeline sau Apply", 30000);
        await ensureNoModal(cdp);
        await drainErrors(cdp);
        const track = s3?.capTracks[0];
        const c1 = track?.clips.find((c) => c.text === "Xin chào các bạn");
        const kaOk = c1 && Array.isArray(c1.karaoke) && c1.karaoke.length === 2 &&
          c1.karaoke[0].word === "Xin" && c1.karaoke[0].start === 0 && c1.karaoke[0].end === 0.4 &&
          c1.karaoke[1].word === "chào" && c1.karaoke[1].start === 0.4 && c1.karaoke[1].end === 0.8;
        if (track && c1 && c1.bg === "#00000080" && c1.hi === "#00e5ff" && kaOk) {
          pass("B3 Apply → track phụ đề style template + karaoke", `track "${track.label}" ${track.clips.length} clip; clip 1 bg #00000080 hi #00e5ff, karaoke 2 từ clip-local [0,0.4] [0.4,0.8]`);
        } else {
          fail("B3 Apply → track phụ đề style template + karaoke", `track=${JSON.stringify(track)}`);
        }
      }
    }

    // ---- B4: preview highlight — pixel cyan thật trên canvas -----------
    {
      const setT = async (t) => cdp.evalJs(`(async () => {
        const entries = performance.getEntriesByType("resource").map((e) => e.name);
        const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
        const mod = window.__b9storeMod || (window.__b9storeMod = await import(hit));
        mod.useStore.getState().setPlayhead(${t});
        return mod.useStore.getState().playhead;
      })()`);
      const ph1 = await setT(1.0);
      await sleep(1500);
      const c1 = await cdp.evalJs(CYAN_COUNT_FN);
      await cdp.shot("b9-preview-t1.0.png");
      const ph01 = await setT(0.1);
      await sleep(1500);
      const c01 = await cdp.evalJs(CYAN_COUNT_FN);
      await cdp.shot("b9-preview-t0.1.png");
      await drainErrors(cdp);
      const maxCyan = (arr) => Math.max(0, ...arr.filter((c) => typeof c.cyan === "number").map((c) => c.cyan));
      const cyan1 = maxCyan(c1);
      const cyan01 = maxCyan(c01);
      log(`B4 pixel: playhead=${ph1} cyan max=${cyan1} (canvas ${JSON.stringify(c1)}); playhead=${ph01} cyan max=${cyan01} (${JSON.stringify(c01)})`);
      if (cyan1 > 100 && cyan01 < 10) {
        pass("B4 preview highlight karaoke (pixel thật)", `t=1.0: ${cyan1} pixel cyan (từ đang hát sáng); t=0.1: ${cyan01} pixel (trước clip, không caption)`);
      } else {
        fail("B4 preview highlight karaoke (pixel thật)", `t=1.0 cyan=${cyan1} (cần >100), t=0.1 cyan=${cyan01} (cần <10)`);
      }
    }

    // H9: 0 lỗi trang gộp qua các phase.
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (caption stub + Apply + 2 lần set playhead)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "b9-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED B9: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
