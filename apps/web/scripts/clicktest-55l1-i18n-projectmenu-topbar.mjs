#!/usr/bin/env node
/**
 * clicktest-55l1-i18n-projectmenu-topbar.mjs — Phase 9 đợt 55, luồng L1:
 * đo headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright) rằng chuyển ngôn ngữ VI→EN đổi hết ProjectMenu +
 * nút "Bắt đầu" ở TopBar — đóng bug M19 của đợt 54 K3.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-55l1-i18n-projectmenu-topbar.mjs
 * Env: L1_DEV_PORT (mặc định tự chọn 5350–5369), L1_DEBUG_PORT (9450–9469),
 * L1_DISPLAY (mặc định :154 — display RIÊNG của L1, không dùng chung),
 * L1_SCRATCH (mặc định hidden_files/round55-l1/headed). TMPDIR riêng
 * /tmp/round55-l1/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
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
const SCRATCH = process.env.L1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round55-l1", "headed");
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
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(300);
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
  window.__l1errors = [];
  window.addEventListener("error", (e) => { try { window.__l1errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__l1errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__l1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__l1errors.push("unhandledrejection: <?>"); } });
})()`;

// Text của TopBar (bao gồm ProjectMenu nhúng trong nó) + chỉ báo autosave.
const TOPBAR_FN = `(() => {
  const top = document.querySelector("header.topbar");
  const menu = document.querySelector(".project-menu");
  const ind = document.querySelector(".autosave-indicator");
  const langBtn = document.querySelector(".topbar-priority .tbtn");
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +(b.left + b.width / 2).toFixed(1), y: +(b.top + b.height / 2).toFixed(1) }; };
  return {
    topbarText: top ? top.innerText : null,
    menuText: menu ? menu.innerText : null,
    indicator: ind ? ind.textContent.trim() : null,
    indicatorTitle: ind ? ind.getAttribute("title") : null,
    langBtnPos: r(langBtn),
    langBtnLabel: langBtn ? langBtn.getAttribute("aria-label") : null,
    // Nút Bắt đầu: label nằm trong innerText, còn title/aria-label thì
    // KHÔNG (innerText không bao gồm attribute) — đo riêng ở đây.
    welcomeTitle: (() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.getAttribute("aria-label") || "").includes("welcome") || (x.getAttribute("aria-label") || "").includes("chào")); return b ? b.getAttribute("title") : null; })(),
    welcomeLabel: (() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.getAttribute("aria-label") || "").includes("welcome") || (x.getAttribute("aria-label") || "").includes("chào")); return b ? b.getAttribute("aria-label") : null; })(),
    splash: !!document.querySelector(".splash"),
    // Phần tử thật nhận click tại tâm nút ngôn ngữ (splash/modal mà còn
    // mở sẽ chặn click — harness phải chờ chúng biến mất trước).
    hitAtLangBtn: (() => { const p = r(langBtn); if (!p) return null;
      const el = document.elementFromPoint(p.x, p.y);
      return el ? (el.closest("button")?.getAttribute("aria-label") ?? el.tagName + "." + (el.className || "")) : null; })(),
    errors: (window.__l1errors || []).slice(),
  };
})()`;

// Đổi tên project qua store thật mà app đã nạp (mẫu H6) → dirty = true.
const DIRTY_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__l1storeMod || (window.__l1storeMod = await import(hit));
  mod.useStore.getState().setProjectName("L1 headed dirty probe");
  return { name: mod.useStore.getState().spec.meta.name };
})()`;

const FORBIDDEN_VI_IN_EN = [
  "Mới", "Mở", "Lưu", "Lưu thành", "Xuất bản nén", "Nhập bản nén",
  "Lịch sử", "Chưa lưu", "Bắt đầu", "Tạo dự án mới", "Mở file dự án",
  "Lưu thành file", "Lưu thành tên khác", "mang đi máy khác",
  "khôi phục project", "Lịch sử phiên bản", "Có thay đổi chưa được lưu",
  "Mọi thay đổi đã được lưu", "Đã lưu", "Mở lại màn chào",
];
const REQUIRED_EN = [
  "New", "Open", "Save", "Save as", "Export archive", "Import archive",
  "History", "Get started",
];
// "Reopen the welcome screen" chỉ nằm ở title/aria-label của nút Bắt
// đầu (không có trong innerText) — đo riêng qua attribute ở H1.
const REQUIRED_EN_ATTRS = ["Reopen the welcome screen", "Reopen the welcome screen / tour / template pack in one tap"];
const REQUIRED_VI = [
  "Mới", "Mở", "Lưu", "Lưu thành", "Xuất bản nén", "Nhập bản nén",
  "Lịch sử", "Bắt đầu",
];

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  try {
    const DEV_PORT = Number(process.env.L1_DEV_PORT || 0) || (await pickFreePort(5350, 5369));
    const DEBUG_PORT = Number(process.env.L1_DEBUG_PORT || 0) || (await pickFreePort(9450, 9469));
    const DISPLAY = process.env.L1_DISPLAY || ":154";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5350–5369");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9450–9469");
    // Socket X154 còn sót sau lần chạy trước thì process Xvfb đã chết —
    // kiểm tra process thật, chỉ dọn socket mồ côi của chính display này.
    const sock154 = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock154)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (L1 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock154);
      log(`đã dọn socket X mồ côi ${sock154} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round55-l1/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "l1-vite.log"), "w");
    vite = spawn(VITE_BIN, ["--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "l1-chrome.log"), "w");
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
    const snap0 = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";" + TOPBAR_FN).catch(() => null);
      // Splash ".splash" (App !ready) phủ toàn màn hình và chặn mọi
      // click — phải chờ nó biến mất rồi mới đo/click, nếu không click
      // nút ngôn ngữ sẽ rơi vào overlay (lỗi harness đợt chạy 1).
      return s && !s.splash && s.topbarText && s.topbarText.includes("VCut Studio") ? s : null;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");

    // H0: mặc định VI — đóng modal chào nếu có rồi đo.
    const modalOpen = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
    if (modalOpen) {
      await cdp.click(20, 20).catch(() => {});
      await sleep(600);
      const still = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (still) await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
      const still2 = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (still2) throw new Error("modal chào vẫn mở sau backdrop+Escape — không đo được TopBar (harness lỗi)");
      log("modal chào đã đóng");
    }
    let s = await cdp.evalJs(TOPBAR_FN);
    if (s.splash) throw new Error("splash quay lại sau khi mount — không đo được (harness lỗi)");
    if (s.hitAtLangBtn !== s.langBtnLabel) throw new Error(`nút ngôn ngữ đang bị che bởi ${JSON.stringify(s.hitAtLangBtn)} (splash=${s.splash})`);
    const missingVi = REQUIRED_VI.filter((x) => !s.topbarText.includes(x));
    if (missingVi.length === 0) pass("H0 VI mặc định: đủ chuỗi VI", s.menuText.replace(/\n/g, " | ").slice(0, 200));
    else fail("H0 VI mặc định: đủ chuỗi VI", `thiếu: ${missingVi.join(", ")} — topbar: ${s.topbarText.slice(0, 300)}`);
    await cdp.shot("l1-topbar-vi.png");

    // H1: click thật nút đổi ngôn ngữ → EN. Kiểm tra hit-test trước:
    // nếu phần tử tại tâm nút không phải nút ngôn ngữ thì splash/modal
    // vẫn đang chặn — báo FAIL rõ ràng thay vì chờ timeout mù.
    if (!s.langBtnPos) throw new Error("không tìm thấy nút đổi ngôn ngữ (.topbar-priority .tbtn)");
    if (s.hitAtLangBtn !== s.langBtnLabel) throw new Error(`click sẽ rơi vào ${JSON.stringify(s.hitAtLangBtn)} thay vì nút ngôn ngữ ${JSON.stringify(s.langBtnLabel)} (splash=${s.splash})`);
    await cdp.click(s.langBtnPos.x, s.langBtnPos.y);
    const sEn = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(TOPBAR_FN).catch(() => null);
      return t && t.topbarText && t.topbarText.includes("Get started") ? t : null;
    }, "chuyển sang EN (topbar có Get started)");
    const stillVi = FORBIDDEN_VI_IN_EN.filter((x) => sEn.topbarText.includes(x));
    const missingEn = REQUIRED_EN.filter((x) => !sEn.topbarText.includes(x));
    const missingAttrs = REQUIRED_EN_ATTRS.filter((x) => !(sEn.welcomeTitle && sEn.welcomeTitle.includes(x)) && !(sEn.welcomeLabel && sEn.welcomeLabel.includes(x)));
    if (stillVi.length === 0 && missingEn.length === 0 && missingAttrs.length === 0) pass("H1 EN: hết literal VI, đủ chuỗi EN", sEn.menuText.replace(/\n/g, " | ").slice(0, 200));
    else fail("H1 EN: hết literal VI, đủ chuỗi EN", `còn VI: ${stillVi.join(", ") || "không"}; thiếu EN: ${missingEn.join(", ") || "không"}; thiếu attr: ${missingAttrs.join(", ") || "không"} — topbar: ${sEn.topbarText.slice(0, 400)}`);
    await cdp.shot("l1-topbar-en.png");

    // H2: nhánh dirty ở EN — đổi tên qua store thật → chỉ báo "● Unsaved".
    await cdp.evalJs(DIRTY_FN);
    const sDirtyEn = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(TOPBAR_FN).catch(() => null);
      return t && t.indicator && t.indicator.includes("Unsaved") ? t : null;
    }, "chỉ báo dirty EN (● Unsaved)");
    if (sDirtyEn.indicator === "● Unsaved") pass("H2 dirty EN: chỉ báo ● Unsaved", `title=${sDirtyEn.indicatorTitle}`);
    else fail("H2 dirty EN: chỉ báo ● Unsaved", `nhận: ${JSON.stringify(sDirtyEn.indicator)}`);
    await cdp.shot("l1-topbar-en-dirty.png");

    // H3: click nút ngôn ngữ về VI — dirty phải là "● Chưa lưu", menu VI trở lại.
    s = await cdp.evalJs(TOPBAR_FN);
    if (s.hitAtLangBtn !== s.langBtnLabel) throw new Error(`H3: nút ngôn ngữ đang bị che bởi ${JSON.stringify(s.hitAtLangBtn)}`);
    await cdp.click(s.langBtnPos.x, s.langBtnPos.y);
    const sVi2 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(TOPBAR_FN).catch(() => null);
      return t && t.topbarText && t.topbarText.includes("Bắt đầu") ? t : null;
    }, "về VI (topbar có Bắt đầu)");
    const missingVi2 = REQUIRED_VI.filter((x) => !sVi2.topbarText.includes(x));
    if (missingVi2.length === 0 && sVi2.indicator === "● Chưa lưu") pass("H3 về VI: đủ chuỗi VI + dirty ● Chưa lưu", `indicator=${sVi2.indicator}`);
    else fail("H3 về VI: đủ chuỗi VI + dirty ● Chưa lưu", `thiếu VI: ${missingVi2.join(", ") || "không"}; indicator=${JSON.stringify(sVi2.indicator)}`);

    // H4: 0 lỗi trang trong phiên.
    const errs = (await cdp.evalJs(`(window.__l1errors || []).slice()`)) || [];
    if (errs.length === 0) pass("H4 0 lỗi trang", "không có window.onerror/unhandledrejection");
    else fail("H4 0 lỗi trang", errs.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "l1-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED L1: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
