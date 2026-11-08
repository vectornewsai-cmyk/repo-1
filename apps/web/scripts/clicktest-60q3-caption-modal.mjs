#!/usr/bin/env node
/**
 * clicktest-60q3-caption-modal.mjs — Phase 9 đợt 60, luồng Q3:
 * đóng nợ đợt 59 §6.2 (P4) + §4.5 (P5): nút text trong CaptionModal dùng
 * class .tbtn (nút tròn icon 36×36) nên chữ tràn/chồng nhau ("Bắt đầu tạo
 * ph…" đè "Đóng", "Start generating" bị cắt ở mép phải modal bởi
 * overflow:hidden); modal chạm trần max-height nên cần khóa nút action
 * luôn thấy được ở viewport 900px.
 *
 * Chạy headed THẬT (vite dev đóng băng + Chromium headed qua Xvfb + CDP,
 * Node thuần, không Playwright), theo mẫu clicktest-59p5-captions-headed.mjs.
 * KHÔNG sửa code sản phẩm trong harness này — chỉ đo; sửa ở CaptionModal.tsx
 * rồi chạy lại để chứng minh đỏ-trước/xanh-sau.
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   Q0 setup vi: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item) → TopBar có nút "💬 Phụ đề".
 *   Q1 config vi: mở CaptionModal bằng chuột thật → đo hình học (xem
 *        MEASURE_FN): modal vừa viewport, mọi nút trong dialog không tràn
 *        chữ (scrollWidth <= clientWidth), text không chồng nhau, text
 *        không vượt khỏi mép modal, nút action trong viewport.
 *   Q2 review vi: import SRT VI thật qua file input (mẫu P5) → bước review
 *        → đo lại hình học (nút "← Làm lại" / "✓ Áp dụng 2 câu phụ đề" +
 *        nút xuất SRT/VTT trong body) → bấm Apply bằng chuột thật → modal
 *        đóng, track "Phụ đề 2" lên timeline.
 *   Q3 config en: vcut-lang=en + reload → mở modal → đo lại (chuỗi en dài
 *        hơn vi: "🎙 Start generating captions").
 *   Q4 review en: import SRT → bước review en → đo lại → đóng bằng nút ✕.
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-60q3-caption-modal.mjs
 * Env: Q3_DEV_PORT (mặc định tự chọn 5470–5479), Q3_DEBUG_PORT (9570–9579),
 * Q3_DISPLAY (mặc định :171 — display RIÊNG của Q3), Q3_SCRATCH (mặc định
 * hidden_files/round60-q3/headed). TMPDIR riêng /tmp/round60-q3/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.Q3_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round60-q3", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round60-q3";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.q3.config.mjs");

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
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__q3errors = [];
  window.addEventListener("error", (e) => { try { window.__q3errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__q3errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__q3errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__q3errors.push("unhandledrejection: <?>"); } });
  window.__q3boot = Math.random().toString(36).slice(2);
})()`;

// Fixture SRT VI — cùng câu + mốc với test node P5 (captionsExport59P5).
const SRT_VI =
  "1\n00:00:00,500 --> 00:00:02,000\nXin chào các bạn\n\n" +
  "2\n00:00:02,500 --> 00:00:04,000\nĐây là video thử nghiệm\n";

// Đo hình học modal + mọi nút trong dialog.
// - textFits: scrollWidth <= clientWidth (chữ không tràn khỏi hộp nút).
// - textRect: hộp chữ nhìn thấy được — nút dùng flex căn giữa nên chữ tràn
//   đối xứng quanh tâm nút, rộng = scrollWidth. Dùng để phát hiện 2 nút
//   kề nhau có chữ chồng lên nhau, và chữ vượt khỏi mép modal (bị
//   .modal overflow:hidden cắt) — đúng 2 hiện tượng thấy ở screenshot B3
//   của P5 ("Bắt đầu tạo ph…" đè "Đóng", "generating" cắt ở mép phải).
const MEASURE_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const mr = dlg.getBoundingClientRect();
  const cs = getComputedStyle(dlg);
  const body = dlg.querySelector(".modal-body");
  const btns = [...dlg.querySelectorAll("button")].map((b) => {
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const tw = b.scrollWidth;
    return {
      text: b.textContent.trim().slice(0, 60),
      cls: b.className,
      rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      clientWidth: b.clientWidth, scrollWidth: b.scrollWidth,
      textFits: b.scrollWidth <= b.clientWidth + 1,
      textRect: { left: +(cx - tw / 2).toFixed(1), right: +(cx + tw / 2).toFixed(1), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1) },
      inActions: !!b.closest(".modal-actions"),
    };
  });
  const actions = btns.filter((b) => b.inActions);
  let overlap = null;
  for (let i = 0; i < actions.length; i++) for (let j = i + 1; j < actions.length; j++) {
    const a = actions[i].textRect, c = actions[j].textRect;
    if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) overlap = actions[i].text + " <-> " + actions[j].text;
  }
  const textOutsideModal = btns.filter((b) => b.textRect.right > mr.right + 1 || b.textRect.left < mr.left - 1).map((b) => b.text);
  const overflowing = btns.filter((b) => !b.textFits).map((b) => b.text + " (" + b.clientWidth + "px hộp, chữ " + b.scrollWidth + "px)");
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    modal: { left: +mr.left.toFixed(1), top: +mr.top.toFixed(1), right: +mr.right.toFixed(1), bottom: +mr.bottom.toFixed(1), w: +mr.width.toFixed(1), h: +mr.height.toFixed(1), maxHeight: cs.maxHeight, overflow: cs.overflow },
    modalFitsViewport: mr.top >= -0.5 && mr.bottom <= window.innerHeight + 0.5,
    body: body ? { scrollHeight: body.scrollHeight, clientHeight: body.clientHeight, overflowY: getComputedStyle(body).overflowY } : null,
    buttons: btns,
    allTextFits: btns.every((b) => b.textFits),
    overflowing,
    noTextOverlap: overlap === null,
    overlap,
    textOutsideModal,
    actionsInViewport: actions.every((b) => b.rect.top >= -0.5 && b.rect.bottom <= window.innerHeight + 0.5),
    actions: actions.map((b) => b.text),
  };
})()`;

// Tọa độ giữa của nút có text chứa substr (đo thật trên DOM headed).
const BTN_RECT_FN = (substr) => `((s) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(s));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled };
})(${JSON.stringify(substr)})`;

// Đưa file SRT vào input import của CaptionModal (mẫu 46b1/47c1, P5).
const IMPORT_SRT_FN = (ariaLabel) => `(async () => {
  const el = document.querySelector('input[aria-label=${JSON.stringify(ariaLabel)}]');
  if (!el) return { ok: false, reason: "không tìm thấy input import SRT/VTT trong modal" };
  const f = new File([${JSON.stringify(SRT_VI)}], "phu-de-vi.srt", { type: "text/plain" });
  const dt = new DataTransfer();
  dt.items.add(f);
  el.files = dt.files;
  const assigned = el.files.length;
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: true, assigned };
})()`;

const STATE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__q3storeMod || (window.__q3storeMod = await import(hit));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    labels: st.spec.tracks.map((t) => t.label),
    lang: localStorage.getItem("vcut-lang"),
    errors: (window.__q3errors || []).slice(),
  };
})()`;

// Kết luận PASS/FAIL cho 1 lần đo + chuỗi mô tả ngắn để log.
function verdict(m) {
  const problems = [];
  if (!m) return { ok: false, why: "không đo được modal (dialog không mở?)" };
  if (!m.modalFitsViewport) problems.push(`modal vượt viewport (bottom ${m.modal.bottom} > ${m.viewport.h})`);
  if (!m.allTextFits) problems.push(`chữ tràn hộp nút: ${m.overflowing.join("; ")}`);
  if (!m.noTextOverlap) problems.push(`chữ 2 nút chồng nhau: ${m.overlap}`);
  if (m.textOutsideModal.length) problems.push(`chữ vượt khỏi mép modal: ${m.textOutsideModal.join("; ")}`);
  if (!m.actionsInViewport) problems.push("nút action ngoài viewport");
  const summary = `viewport ${m.viewport.w}x${m.viewport.h}, modal ${m.modal.w}x${m.modal.h} top ${m.modal.top} bottom ${m.modal.bottom} (max-height ${m.modal.maxHeight}), body scroll ${m.body ? m.body.scrollHeight + "/" + m.body.clientHeight + " " + m.body.overflowY : "?"}, nút action [${m.actions.join(" | ")}]`;
  return problems.length ? { ok: false, why: problems.join(" || "), summary } : { ok: true, why: "", summary };
}

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
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount lại sau reload (topbar có VCut Studio, splash đã tắt)", 240000);
    const boot = await cdp.evalJs(`window.__q3boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__q3errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__q3errors = []`).catch(() => {});
    return e;
  }

  // Mở CaptionModal bằng chuột thật qua nút TopBar, chờ dialog có tiêu đề.
  // Cứng cáp hơn mẫu P5: welcome modal mở TRỄ (khi `ready` bật sau khi mẫu
  // load xong) nên có thể phủ lên TopBar SAU khi ensureNoModal đã chạy —
  // đúng lỗi vấp ở lần chạy đỏ-trước Q3 (click "Captions" rơi vào backdrop
  // của welcome modal, CaptionModal không mở, timeout 30s). Vì vậy: kiểm
  // tra lại overlay ngay trước mỗi cú click, bấm lại tối đa 3 lần; nút
  // TopBar tìm trong header.topbar (không tìm toàn document).
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

  try {
    const DEV_PORT = Number(process.env.Q3_DEV_PORT || 0) || (await pickFreePort(5470, 5479));
    const DEBUG_PORT = Number(process.env.Q3_DEBUG_PORT || 0) || (await pickFreePort(9570, 9579));
    const DISPLAY = process.env.Q3_DISPLAY || ":171";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5470–5479");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9570–9579");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (Q3 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round60-q3/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "q3-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "q3-chrome.log"), "w");
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

    // ---- Q0: setup vi + mount + mẫu tự load ---------------------------
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
    const captionsBtn = await cdp.evalJs(BTN_RECT_FN("Phụ đề"));
    const bootStable0 = (await cdp.evalJs(`window.__q3boot`).catch(() => null)) === boot0;
    await drainErrors(cdp);
    if (bootStable0 && s0 && captionsBtn && !captionsBtn.disabled) {
      pass("Q0 setup: locale vi + mẫu tự load + nút Phụ đề", `boot ổn định, 3 clip (labels ${JSON.stringify(s0.labels)}), media bin 2 item, nút TopBar "${captionsBtn.text}" tại (${captionsBtn.x.toFixed(0)}, ${captionsBtn.y.toFixed(0)})`);
    } else {
      fail("Q0 setup: locale vi + mẫu tự load + nút Phụ đề", `boot ổn định=${bootStable0}, captionsBtn=${JSON.stringify(captionsBtn)}, state=${JSON.stringify(s0)}`);
    }

    // ---- Q1: config vi — đo hình học ----------------------------------
    {
      await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
      const m1 = await cdp.evalJs(MEASURE_FN);
      fs.writeFileSync(path.join(SCRATCH, "q3-measure-config-vi.json"), JSON.stringify(m1, null, 2));
      const v1 = verdict(m1);
      await drainErrors(cdp);
      if (v1.ok) pass("Q1 config vi: nút text không tràn/chồng, modal vừa viewport", v1.summary);
      else fail("Q1 config vi: nút text không tràn/chồng, modal vừa viewport", `${v1.why} — ${v1.summary}`);
      await cdp.shot("q3-config-vi.png");
    }

    // ---- Q2: review vi — import SRT thật, đo lại, Apply bằng chuột ----
    {
      const delivery = await cdp.evalJs(IMPORT_SRT_FN("Nhập file SRT hoặc VTT"));
      log(`Q2 import SRT: ${JSON.stringify(delivery)}`);
      const applyBtn = await cdp.waitFor(async () => {
        const b = await cdp.evalJs(BTN_RECT_FN("Áp dụng 2 câu")).catch(() => null);
        return b && !b.disabled ? b : null;
      }, "nút Áp dụng 2 câu xuất hiện sau import (bước review)", 30000);
      const m2 = await cdp.evalJs(MEASURE_FN);
      fs.writeFileSync(path.join(SCRATCH, "q3-measure-review-vi.json"), JSON.stringify(m2, null, 2));
      const v2 = verdict(m2);
      await drainErrors(cdp);
      if (!delivery.ok) {
        fail("Q2 review vi: nút text không tràn/chồng, modal vừa viewport", delivery.reason);
      } else if (!applyBtn) {
        fail("Q2 review vi: nút text không tràn/chồng, modal vừa viewport", "import xong nhưng không thấy nút Áp dụng 2 câu (review step không lên)");
      } else if (!v2.ok) {
        fail("Q2 review vi: nút text không tràn/chồng, modal vừa viewport", `${v2.why} — ${v2.summary}`);
      } else {
        pass("Q2 review vi: nút text không tràn/chồng, modal vừa viewport", v2.summary);
      }
      await cdp.shot("q3-review-vi.png");
      if (applyBtn) {
        await cdp.click(applyBtn.x, applyBtn.y);
        const s2 = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(STATE_FN).catch(() => null);
          return t && t.labels.includes("Phụ đề 2") ? t : null;
        }, "timeline có track 'Phụ đề 2' sau Apply", 30000);
        if (!s2) fail("Q2 Apply tạo track", `sau Apply: labels=${JSON.stringify((await cdp.evalJs(STATE_FN).catch(() => null))?.labels)}`);
        else log(`Q2 Apply OK: track "Phụ đề 2" đã lên timeline`);
      }
      await ensureNoModal(cdp);
    }

    // ---- Q3: config en — reload locale en, đo lại ----------------------
    {
      await cdp.evalJs(`localStorage.setItem("vcut-lang", "en")`);
      await cdp.send("Page.reload", { ignoreCache: false });
      await afterReload(cdp);
      const s3 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 3 && t.lang === "en" ? t : null;
      }, "project mẫu tự load lại dưới locale en", 180000);
      const enBtn = await cdp.evalJs(BTN_RECT_FN("Captions"));
      if (!s3 || !enBtn) {
        fail("Q3 config en: nút text không tràn/chồng, modal vừa viewport", `sau reload en: state=${JSON.stringify(s3)}, nút Captions=${JSON.stringify(enBtn)}`);
      } else {
        await openModal(cdp, "Captions", "Auto-generate captions");
        const m3 = await cdp.evalJs(MEASURE_FN);
        fs.writeFileSync(path.join(SCRATCH, "q3-measure-config-en.json"), JSON.stringify(m3, null, 2));
        const v3 = verdict(m3);
        await drainErrors(cdp);
        if (v3.ok) pass("Q3 config en: nút text không tràn/chồng, modal vừa viewport", v3.summary);
        else fail("Q3 config en: nút text không tràn/chồng, modal vừa viewport", `${v3.why} — ${v3.summary}`);
        await cdp.shot("q3-config-en.png");
      }
    }

    // ---- Q4: review en — import SRT, đo lại, đóng bằng ✕ ---------------
    {
      const delivery = await cdp.evalJs(IMPORT_SRT_FN("Import an SRT or VTT file"));
      log(`Q4 import SRT: ${JSON.stringify(delivery)}`);
      const applyBtn = await cdp.waitFor(async () => {
        const b = await cdp.evalJs(BTN_RECT_FN("Apply 2 caption")).catch(() => null);
        return b && !b.disabled ? b : null;
      }, "nút Apply 2 caption sentences xuất hiện sau import (bước review en)", 30000);
      const m4 = await cdp.evalJs(MEASURE_FN);
      fs.writeFileSync(path.join(SCRATCH, "q3-measure-review-en.json"), JSON.stringify(m4, null, 2));
      const v4 = verdict(m4);
      await drainErrors(cdp);
      if (!delivery.ok) {
        fail("Q4 review en: nút text không tràn/chồng, modal vừa viewport", delivery.reason);
      } else if (!applyBtn) {
        fail("Q4 review en: nút text không tràn/chồng, modal vừa viewport", "import xong nhưng không thấy nút Apply 2 caption (review step không lên)");
      } else if (!v4.ok) {
        fail("Q4 review en: nút text không tràn/chồng, modal vừa viewport", `${v4.why} — ${v4.summary}`);
      } else {
        pass("Q4 review en: nút text không tràn/chồng, modal vừa viewport", v4.summary);
      }
      await cdp.shot("q3-review-en.png");
      // Đóng bằng nút ✕ trong modal-head (không Apply lần 2).
      const xBtn = await cdp.evalJs(`(( ) => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (xBtn) await cdp.click(xBtn.x, xBtn.y);
      await ensureNoModal(cdp);
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 1 lần reload + 2 lần import)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "q3-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED Q3: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
