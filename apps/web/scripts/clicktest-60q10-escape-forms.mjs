#!/usr/bin/env node
/**
 * clicktest-60q10-escape-forms.mjs — Phase 9 đợt 60, luồng Q10: đo headed
 * Escape ở form TemplatePicker (focus trong input/select) + Escape khi
 * TemplatePackModal đang busy + Escape bước 2 đóng hẳn (nợ đợt 59 §6.8).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-59p2-escape-modals.mjs.
 * Profile Chrome MỚI mỗi lần chạy → localStorage trống → WelcomeModal
 * hiện lúc mount (App: welcomeOpen = !isWelcomed()).
 *
 * Các bước: chờ app mount → WelcomeModal đóng bằng Escape (O1) →
 * mở TemplatePicker bằng TopBar "🎬 Mẫu" → chọn card đầu (Bìa album:
 * có cả input text + select) → form bước 2: focus input text rồi
 * Escape (F1: guard — form vẫn mở), focus select rồi Escape (F2:
 * guard — form vẫn mở), focus nút "Tạo project từ mẫu" rồi Escape
 * (F3: Q10 — đóng HẲN modal, không về gallery) → mở TemplatePackModal
 * bằng TopBar "👋 Bắt đầu" + nút "⚡ Tạo video 1 chạm" → bấm "Tạo ngay"
 * ở pack thứ 2 (Intro YouTube, video 5s → cửa sổ busy ~5s): đợi busy
 * rồi Escape (F4a: modal vẫn mở, nút ✕ disabled), đợi tạo xong rồi
 * Escape (F4b: modal đóng) — mỗi lần focus bằng .focus() (không click)
 * rồi gửi Escape thật qua CDP.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-60q10-escape-forms.mjs
 * Env: Q10_DEV_PORT (mặc định tự chọn 5430–5439), Q10_DEBUG_PORT (9530–9539),
 * Q10_DISPLAY (mặc định :170 — display RIÊNG của Q10, không dùng chung),
 * Q10_SCRATCH (mặc định hidden_files/round60-q10/headed). TMPDIR riêng
 * /tmp/round60-q10/tmp. Exit 0 PASS, 1 FAIL, 2 harness lỗi.
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
const SCRATCH = process.env.Q10_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round60-q10", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
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
  async key(key, code) {
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyUp" });
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

// Trạng thái thật trên DOM cho từng modal (đọc 1 lần, trả về object).
const STATE_FN = `(() => {
  const btn = (txt) => [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === txt);
  const welcomeDlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("Chào mừng"));
  const packDlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("Template pack"));
  const packCloseBtn = packDlg ? packDlg.querySelector('.modal-head button[aria-label="Đóng"]') : null;
  const packRows = packDlg ? [...packDlg.querySelectorAll(".pack-row button")] : [];
  return {
    welcome: !!welcomeDlg,
    tour: !!document.querySelector(".tour-card"),
    pack: !!packDlg,
    packBusy: packDlg ? packRows.some((b) => b.disabled) || (packDlg.innerText || "").includes("Đang tạo media mẫu") : false,
    packDone: packDlg ? !!btn("▶ Xem ngay") : false,
    packCloseDisabled: packCloseBtn ? !!packCloseBtn.disabled : null,
    pickerGallery: !!document.querySelector(".template-grid"),
    pickerForm: !!document.querySelector(".template-form"),
    formInputFocused: document.activeElement ? document.activeElement.tagName === "INPUT" : false,
    formSelectFocused: document.activeElement ? document.activeElement.tagName === "SELECT" : false,
    activeTag: document.activeElement ? document.activeElement.tagName + ":" + (document.activeElement.textContent || document.activeElement.value || "").trim().slice(0, 20) : null,
  };
})()`;

// Focus ô input text đầu tiên trong form Picker bước 2.
const FOCUS_INPUT_FN = `(() => { const i = document.querySelector('.template-form input[type="text"]'); if (!i) return false; i.focus(); return document.activeElement === i; })()`;
// Focus select đầu tiên trong form Picker bước 2.
const FOCUS_SELECT_FN = `(() => { const s = document.querySelector(".template-form select"); if (!s) return false; s.focus(); return document.activeElement === s; })()`;

// Click 1 nút theo text chính xác; throw nếu không thấy.
const CLICK_FN = (txt) => `(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(txt)}); if (!b) throw new Error("không thấy nút " + ${JSON.stringify(txt)}); b.click(); return true; })()`;
// Click nút TopBar theo title (ShortLabel có thể rút gọn text).
const CLICK_TITLE_FN = (title) => `(() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("title") === ${JSON.stringify(title)}); if (!b) throw new Error("không thấy nút title=" + ${JSON.stringify(title)}); b.click(); return true; })()`;
// Focus 1 nút theo text chính xác (không click).
const FOCUS_FN = (txt) => `(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(txt)}); if (!b) return false; b.focus(); return document.activeElement === b; })()`;

async function main() {
  const results = [];
  let vite = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  try {
    const DEV_PORT = Number(process.env.Q10_DEV_PORT || 0) || (await pickFreePort(5430, 5439));
    const DEBUG_PORT = Number(process.env.Q10_DEBUG_PORT || 0) || (await pickFreePort(9530, 9539));
    const DISPLAY = process.env.Q10_DISPLAY || ":170";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5430–5439");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9530–9539");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (Q10 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round60-q10/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tạm tắt HMR (mẫu O1): luồng khác sửa file giữa chừng không
    // reload trang đang test. Tạo lại mỗi lần chạy vì /tmp mất sau reboot.
    const VITE_CFG = "/tmp/round60-q10/vite.q10.config.mjs";
    fs.mkdirSync("/tmp/round60-q10", { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(ROOT, "apps", "web", "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "q10-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "q10-chrome.log"), "w");
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
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");

    const state = () => cdp.evalJs(STATE_FN);

    // Đóng WelcomeModal bằng Escape (O1) để vào app sạch.
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.welcome ? s : null; }, "WelcomeModal hiện (profile mới)", 60000);
    await cdp.key("Escape", "Escape");
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && !s.welcome ? s : null; }, "WelcomeModal đóng sau Escape (O1)", 30000);
    log("welcome đã đóng bằng Escape (O1)");

    // Mở TemplatePicker → chọn card đầu (Bìa album: select ảnh bìa +
    // input text tên album/nghệ sĩ) → form bước 2.
    await cdp.evalJs(CLICK_TITLE_FN("Tạo project mới từ 10 mẫu video có sẵn (intro, outro, TikTok, slideshow...)"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.pickerGallery ? s : null; }, "TemplatePicker gallery hiện", 30000);
    await cdp.evalJs(`(() => { const c = document.querySelector(".template-card"); if (!c) throw new Error("không thấy .template-card"); c.click(); return true; })()`);
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.pickerForm ? s : null; }, "TemplatePicker form bước 2 hiện", 30000);
    log("picker form bước 2 hiện (card Bìa album)");

    // F1: focus ô input text → Escape → guard: form VẪN MỞ.
    const focusedInput = await cdp.evalJs(FOCUS_INPUT_FN);
    log(`F1 focus input text: ${focusedInput}`);
    await cdp.shot("q10-picker-input-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterInputEsc = await state();
    log(`F1 sau Escape trong input: gallery=${afterInputEsc.pickerGallery} form=${afterInputEsc.pickerForm} active=${afterInputEsc.activeTag}`);
    results.push({ name: "F1 Escape khi focus trong input text (guard) — form vẫn mở", ok: !afterInputEsc.pickerGallery && afterInputEsc.pickerForm, detail: `gallery=${afterInputEsc.pickerGallery} form=${afterInputEsc.pickerForm}` });
    await cdp.shot("q10-picker-input-after-escape.png");

    // F2: focus select → Escape → guard: form VẪN MỞ.
    const focusedSelect = await cdp.evalJs(FOCUS_SELECT_FN);
    log(`F2 focus select: ${focusedSelect}`);
    await cdp.shot("q10-picker-select-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterSelectEsc = await state();
    log(`F2 sau Escape trong select: gallery=${afterSelectEsc.pickerGallery} form=${afterSelectEsc.pickerForm} active=${afterSelectEsc.activeTag}`);
    results.push({ name: "F2 Escape khi focus trong select (guard) — form vẫn mở", ok: !afterSelectEsc.pickerGallery && afterSelectEsc.pickerForm, detail: `gallery=${afterSelectEsc.pickerGallery} form=${afterSelectEsc.pickerForm}` });
    await cdp.shot("q10-picker-select-after-escape.png");

    // F3: focus nút "Tạo project từ mẫu" → Escape → Q10: ĐÓNG HẲN modal.
    const focusedCreate = await cdp.evalJs(FOCUS_FN("Tạo project từ mẫu"));
    log(`F3 focus nút tạo: ${focusedCreate}`);
    await cdp.shot("q10-picker-button-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterBtnEsc = await state();
    log(`F3 sau Escape ở nút tạo: gallery=${afterBtnEsc.pickerGallery} form=${afterBtnEsc.pickerForm}`);
    results.push({ name: "F3 Escape ở nút trong form bước 2 — ĐÓNG HẲN modal (Q10, không về gallery)", ok: !afterBtnEsc.pickerGallery && !afterBtnEsc.pickerForm, detail: `gallery=${afterBtnEsc.pickerGallery} form=${afterBtnEsc.pickerForm}` });
    await cdp.shot("q10-picker-button-after-escape.png");

    // F4: TemplatePackModal busy — mở pack, bấm "Tạo ngay" ở pack thứ 2
    // (Intro YouTube: placeholder video 5s → recordPackMedia ghi thật
    // ~5s, cửa sổ busy đo được), đợi busy rồi Escape.
    await cdp.evalJs(CLICK_TITLE_FN("Mở lại màn chào / tour / template pack 1 chạm"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.welcome ? s : null; }, "WelcomeModal mở lại từ TopBar", 30000);
    await cdp.evalJs(CLICK_FN("⚡ Tạo video 1 chạm"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.pack && !s.welcome ? s : null; }, "TemplatePackModal hiện sau khi bấm pack", 30000);
    // Bấm "Tạo ngay" của pack-row thứ 2 (youtube-intro, video 5s).
    const clickedPack2 = await cdp.evalJs(`(() => { const rows = [...document.querySelectorAll(".pack-row")]; if (rows.length < 2) throw new Error("không đủ pack-row, chỉ có " + rows.length); const b = rows[1].querySelector("button"); if (!b) throw new Error("pack-row 2 không có nút"); b.click(); return rows[1].innerText.slice(0, 40); })()`);
    log(`F4 đã bấm tạo pack thứ 2: ${clickedPack2}`);
    // Đợi busy xuất hiện (poll 200ms, tối đa 20s — job bắt đầu ngay).
    let busySeen = null;
    for (let i = 0; i < 100; i++) {
      const st = await state().catch(() => null);
      if (st && st.packBusy) { busySeen = st; break; }
      await sleep(200);
    }
    if (!busySeen) {
      const st = await state().catch(() => ({}));
      results.push({ name: "F4a Escape khi PackModal đang busy — modal vẫn mở", ok: false, detail: `không bắt được trạng thái busy (pack=${st.pack} done=${st.packDone}) — job có thể đã xong trước khi poll kịp, cần chạy lại` });
      log("F4a FAIL: không bắt được busy");
    } else {
      log(`F4 busy bắt được: packBusy=${busySeen.packBusy} closeDisabled=${busySeen.packCloseDisabled}`);
      await cdp.shot("q10-pack-busy-before-escape.png");
      await cdp.key("Escape", "Escape");
      const afterBusyEsc = await state();
      log(`F4a sau Escape lúc busy: pack=${afterBusyEsc.pack} busy=${afterBusyEsc.packBusy} closeDisabled=${afterBusyEsc.packCloseDisabled}`);
      results.push({ name: "F4a Escape khi PackModal đang busy — modal vẫn mở + nút ✕ disabled", ok: !!afterBusyEsc.pack && busySeen.packCloseDisabled === true, detail: `pack=${afterBusyEsc.pack} closeDisabled(lúc busy)=${busySeen.packCloseDisabled}` });
      await cdp.shot("q10-pack-busy-after-escape.png");
      // Đợi tạo xong (nút "▶ Xem ngay" hiện, tối đa 180s) rồi Escape → đóng.
      await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.packDone ? s : null; }, "PackModal tạo xong (nút Xem ngay hiện)", 180000);
      log("F4 pack đã tạo xong, Escape để đóng");
      await cdp.shot("q10-pack-done-before-escape.png");
      await cdp.key("Escape", "Escape");
      const afterDoneEsc = await state();
      log(`F4b sau Escape lúc rảnh: pack=${afterDoneEsc.pack}`);
      results.push({ name: "F4b Escape sau khi tạo xong — modal đóng", ok: !afterDoneEsc.pack, detail: `pack=${afterDoneEsc.pack}` });
      await cdp.shot("q10-pack-done-after-escape.png");
    }

    // F5: 0 lỗi trang trong phiên.
    const errors = cdp.exceptions;
    results.push({ name: "F5 0 lỗi trang trong phiên", ok: errors.length === 0, detail: errors.length ? errors.join(" | ").slice(0, 500) : "không có window.onerror/unhandledrejection" });

    const passCount = results.filter((r) => r.ok).length;
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    writeFileEpermRetry(path.join(SCRATCH, "q10-headed-report.json"), JSON.stringify({ pass: passCount, total: results.length, results, log: logLines }, null, 2));
    log(`Q10 headed Escape forms: ${passCount}/${results.length} pass`);
    process.exitCode = passCount === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${(e && e.stack) || e}`);
    try { writeFileEpermRetry(path.join(SCRATCH, "q10-headed-report.json"), JSON.stringify({ pass: 0, total: 0, error: String((e && e.message) || e), log: logLines }, null, 2)); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();