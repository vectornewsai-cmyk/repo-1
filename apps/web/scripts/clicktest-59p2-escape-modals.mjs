#!/usr/bin/env node
/**
 * clicktest-59p2-escape-modals.mjs — Phase 9 đợt 59, luồng P2: chứng
 * minh headed phím Escape có/không đóng được TourCard,
 * TemplatePackModal, TemplatePicker (nợ đợt 58 §6.2, pattern O1 đợt 58).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-58o1-welcome-escape.mjs.
 * Profile Chrome MỚI mỗi lần chạy → localStorage trống → WelcomeModal
 * hiện lúc mount (App: welcomeOpen = !isWelcomed()).
 *
 * Các bước: chờ app mount → WelcomeModal → mở TourCard bằng nút
 * "🧭 Xem tour 5 bước" (E1) → mở TemplatePackModal bằng TopBar
 * "👋 Bắt đầu" + nút "⚡ Tạo video 1 chạm" (E2) → mở TemplatePicker
 * bằng TopBar "🎬 Mẫu" (E3 gallery, E4 form bước 2: Escape lần 1 quay
 * lại danh sách như nút ✕, Escape lần 2 đóng hẳn) — mỗi lần focus 1 nút
 * trong modal bằng .focus() (không click) rồi gửi Escape thật qua CDP.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-59p2-escape-modals.mjs
 * Env: P2_DEV_PORT (mặc định tự chọn 5420–5429), P2_DEBUG_PORT (9520–9529),
 * P2_DISPLAY (mặc định :169 — display RIÊNG của P2, không dùng chung),
 * P2_SCRATCH (mặc định hidden_files/round59-p2/headed). TMPDIR riêng
 * /tmp/round59-p2/tmp. Exit 0 PASS, 1 FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.P2_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round59-p2", "headed");
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
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

// Trạng thái thật trên DOM cho từng modal (đọc 1 lần, trả về object).
const STATE_FN = `(() => {
  const btn = (txt) => [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === txt);
  const welcomeDlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("Chào mừng"));
  const packDlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("Template pack"));
  return {
    welcome: !!welcomeDlg,
    tour: !!document.querySelector(".tour-card"),
    pack: !!packDlg,
    pickerGallery: !!document.querySelector(".template-grid"),
    pickerForm: !!document.querySelector(".template-form"),
    activeTag: document.activeElement ? document.activeElement.tagName + ":" + (document.activeElement.textContent || "").trim().slice(0, 20) : null,
  };
})()`;

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
    const DEV_PORT = Number(process.env.P2_DEV_PORT || 0) || (await pickFreePort(5420, 5429));
    const DEBUG_PORT = Number(process.env.P2_DEBUG_PORT || 0) || (await pickFreePort(9520, 9529));
    const DISPLAY = process.env.P2_DISPLAY || ":169";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5420–5429");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9520–9529");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (P2 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round59-p2/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tạm tắt HMR (mẫu O1): luồng khác sửa file giữa chừng không
    // reload trang đang test. Tạo lại mỗi lần chạy vì /tmp mất sau reboot.
    const VITE_CFG = "/tmp/round59-p2/vite.p2.config.mjs";
    fs.mkdirSync("/tmp/round59-p2", { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(ROOT, "apps", "web", "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "p2-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "p2-chrome.log"), "w");
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

    // E1: TourCard — WelcomeModal → nút tour → Escape đóng tour.
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.welcome ? s : null; }, "WelcomeModal hiện (profile mới)", 60000);
    await cdp.evalJs(CLICK_FN("🧭 Xem tour 5 bước"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.tour && !s.welcome ? s : null; }, "TourCard hiện sau khi bấm tour", 30000);
    log(`tour hiện, focus "Bỏ qua": ${await cdp.evalJs(FOCUS_FN("Bỏ qua"))}`);
    await cdp.shot("p2-tour-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterTour = await state();
    log(`tour sau Escape: tour=${afterTour.tour} active=${afterTour.activeTag}`);
    results.push({ name: "E1 Escape đóng TourCard (focus ở nút Bỏ qua)", ok: !afterTour.tour, detail: `tour=${afterTour.tour}` });
    await cdp.shot("p2-tour-after-escape.png");

    // E2: TemplatePackModal — TopBar "Bắt đầu" → WelcomeModal → nút pack → Escape đóng pack.
    await cdp.evalJs(CLICK_TITLE_FN("Mở lại màn chào / tour / template pack 1 chạm"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.welcome ? s : null; }, "WelcomeModal mở lại từ TopBar", 30000);
    await cdp.evalJs(CLICK_FN("⚡ Tạo video 1 chạm"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.pack && !s.welcome ? s : null; }, "TemplatePackModal hiện sau khi bấm pack", 30000);
    // Focus nút ✕ của pack modal (aria-label "Đóng") — không click.
    const focusedPack = await cdp.evalJs(`(() => { const d = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((x) => (x.getAttribute("aria-label") || "").includes("Template pack")); if (!d) return false; const b = d.querySelector('button[aria-label="Đóng"]'); if (!b) return false; b.focus(); return document.activeElement === b; })()`);
    log(`pack hiện, focus nút ✕: ${focusedPack}`);
    await cdp.shot("p2-pack-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterPack = await state();
    log(`pack sau Escape: pack=${afterPack.pack}`);
    results.push({ name: "E2 Escape đóng TemplatePackModal (focus ở nút ✕)", ok: !afterPack.pack, detail: `pack=${afterPack.pack}` });
    await cdp.shot("p2-pack-after-escape.png");

    // E3: TemplatePicker gallery — TopBar "Mẫu" → Escape đóng gallery.
    await cdp.evalJs(CLICK_TITLE_FN("Tạo project mới từ 10 mẫu video có sẵn (intro, outro, TikTok, slideshow...)"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.pickerGallery ? s : null; }, "TemplatePicker gallery hiện", 30000);
    const focusedPicker = await cdp.evalJs(`(() => { const d = document.querySelector(".modal.template-modal"); if (!d) return false; const b = d.querySelector(".modal-head .icon-btn"); if (!b) return false; b.focus(); return document.activeElement === b; })()`);
    log(`picker gallery hiện, focus nút ✕: ${focusedPicker}`);
    await cdp.shot("p2-picker-gallery-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterGallery = await state();
    log(`picker gallery sau Escape: gallery=${afterGallery.pickerGallery} form=${afterGallery.pickerForm}`);
    results.push({ name: "E3 Escape đóng TemplatePicker (gallery)", ok: !afterGallery.pickerGallery && !afterGallery.pickerForm, detail: `gallery=${afterGallery.pickerGallery} form=${afterGallery.pickerForm}` });
    await cdp.shot("p2-picker-gallery-after-escape.png");

    // E4: TemplatePicker bước 2 — chọn 1 template → form → Escape lần 1
    // quay lại gallery (như nút ✕ bước 2), Escape lần 2 đóng hẳn.
    await cdp.evalJs(CLICK_TITLE_FN("Tạo project mới từ 10 mẫu video có sẵn (intro, outro, TikTok, slideshow...)"));
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.pickerGallery ? s : null; }, "TemplatePicker gallery hiện lại", 30000);
    await cdp.evalJs(`(() => { const c = document.querySelector(".template-card"); if (!c) throw new Error("không thấy .template-card"); c.click(); return true; })()`);
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.pickerForm ? s : null; }, "TemplatePicker form bước 2 hiện", 30000);
    // Focus nút "Tạo project từ mẫu" (không phải input/select — guard
    // O1 bỏ qua Escape khi focus trong ô nhập, nên phải focus nút).
    const focusedForm = await cdp.evalJs(FOCUS_FN("Tạo project từ mẫu"));
    log(`picker form hiện, focus nút tạo: ${focusedForm}`);
    await cdp.shot("p2-picker-form-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterEsc1 = await state();
    log(`picker sau Escape lần 1: gallery=${afterEsc1.pickerGallery} form=${afterEsc1.pickerForm}`);
    const backOk = afterEsc1.pickerGallery && !afterEsc1.pickerForm;
    await cdp.shot("p2-picker-form-after-escape1.png");
    // form sau Escape lần 1, focus nút ✕ (bước 2) — nếu lần 1 đã quay
    // lại gallery thì đây là nút ✕ gallery, nếu chưa thì là nút ✕ form.
    const focusedGallery2 = await cdp.evalJs(`(() => { const d = document.querySelector(".modal.template-modal"); if (!d) return false; const b = d.querySelector(".modal-head .icon-btn"); if (!b) return false; b.focus(); return document.activeElement === b; })()`);
    log(`form sau Escape lần 1, focus nút ✕ (bước 2/gallery): ${focusedGallery2}`);
    await cdp.key("Escape", "Escape");
    const afterEsc2 = await state();
    log(`picker sau Escape lần 2: gallery=${afterEsc2.pickerGallery} form=${afterEsc2.pickerForm}`);
    results.push({ name: "E4 Escape bước 2 quay lại gallery, Escape lần 2 đóng hẳn", ok: backOk && !afterEsc2.pickerGallery && !afterEsc2.pickerForm, detail: `lần1 gallery=${afterEsc1.pickerGallery} form=${afterEsc1.pickerForm}; lần2 gallery=${afterEsc2.pickerGallery} form=${afterEsc2.pickerForm}` });
    await cdp.shot("p2-picker-form-after-escape2.png");

    // E5: 0 lỗi trang trong phiên.
    const errors = cdp.exceptions;
    results.push({ name: "E5 0 lỗi trang trong phiên", ok: errors.length === 0, detail: errors.length ? errors.join(" | ").slice(0, 500) : "không có window.onerror/unhandledrejection" });

    const passCount = results.filter((r) => r.ok).length;
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    fs.writeFileSync(path.join(SCRATCH, "p2-headed-report.json"), JSON.stringify({ pass: passCount, total: results.length, results, log: logLines }, null, 2));
    log(`P2 headed Escape: ${passCount}/${results.length} pass`);
    process.exitCode = passCount === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${(e && e.stack) || e}`);
    try { fs.writeFileSync(path.join(SCRATCH, "p2-headed-report.json"), JSON.stringify({ pass: 0, total: 0, error: String((e && e.message) || e), log: logLines }, null, 2)); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
