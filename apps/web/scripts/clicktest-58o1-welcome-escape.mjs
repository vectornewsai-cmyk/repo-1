#!/usr/bin/env node
/**
 * clicktest-58o1-welcome-escape.mjs — Phase 9 đợt 58, luồng O1: chứng
 * minh headed phím Escape có/không đóng được WelcomeModal (nợ đợt 57
 * §6.1(a), phát hiện harness của luồng N9 đợt 57).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-57n9-timeline-core-ops.mjs.
 * Profile Chrome MỚI mỗi lần chạy → localStorage trống → WelcomeModal
 * hiện lúc mount (App: welcomeOpen = !isWelcomed()).
 *
 * Các bước: chờ app mount → chờ modal chào hiện → focus nút "Để sau"
 * BẰNG .focus() (không click — chứng minh Escape hoạt động khi focus
 * đang ở trong modal) → gửi Escape thật qua CDP Input.dispatchKeyEvent
 * → assert modal biến mất VÀ localStorage vcut-welcomed === "1"
 * (Escape phải đi đúng đường đóng của nút: đánh dấu đã chào, nếu không
 * modal mở lại ở lần mount sau).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-58o1-welcome-escape.mjs
 * Env: O1_DEV_PORT (mặc định tự chọn 5410–5419), O1_DEBUG_PORT (9510–9519),
 * O1_DISPLAY (mặc định :159 — display RIÊNG của O1, không dùng chung),
 * O1_SCRATCH (mặc định hidden_files/round58-o1/headed). TMPDIR riêng
 * /tmp/round58-o1/tmp. Exit 0 PASS, 1 FAIL (Escape không đóng / không
 * đánh dấu), 2 harness lỗi.
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
const SCRATCH = process.env.O1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round58-o1", "headed");
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

// Trạng thái modal chào thật trên DOM: có dialog role=dialog với
// aria-label là tiêu đề chào, và nút "Để sau" còn thấy được.
const MODAL_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
  const later = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau");
  const title = dlg ? dlg.getAttribute("aria-label") : null;
  return {
    open: !!(dlg && later),
    title,
    welcomed: (() => { try { return localStorage.getItem("vcut-welcomed"); } catch { return "<no-storage>"; } })(),
    activeTag: document.activeElement ? document.activeElement.tagName + ":" + (document.activeElement.textContent || "").trim().slice(0, 20) : null,
  };
})()`;

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
    const DEV_PORT = Number(process.env.O1_DEV_PORT || 0) || (await pickFreePort(5410, 5419));
    const DEBUG_PORT = Number(process.env.O1_DEBUG_PORT || 0) || (await pickFreePort(9510, 9519));
    const DISPLAY = process.env.O1_DISPLAY || ":159";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5410–5419");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9510–9519");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (O1 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round58-o1/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tạm tắt HMR (mẫu N9): luồng khác sửa file giữa chừng không
    // reload trang đang test. Tạo lại mỗi lần chạy vì /tmp mất sau reboot.
    const VITE_CFG = "/tmp/round58-o1/vite.o1.config.mjs";
    fs.mkdirSync("/tmp/round58-o1", { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(ROOT, "apps", "web", "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "o1-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "o1-chrome.log"), "w");
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

    // E1: modal chào phải hiện trên profile mới (localStorage trống).
    const before = await cdp.waitFor(async () => {
      const m = await cdp.evalJs(MODAL_FN).catch(() => null);
      return m && m.open ? m : null;
    }, "WelcomeModal hiện (profile mới)", 60000);
    log(`modal trước Escape: open=${before.open} title=${JSON.stringify(before.title)} welcomed=${JSON.stringify(before.welcomed)}`);
    await cdp.shot("o1-before-escape.png");

    // Focus nút "Để sau" bằng .focus() (không click): Escape phải đóng
    // được cả khi focus đang ở trong modal.
    const focused = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (!b) return false; b.focus(); return document.activeElement === b; })()`);
    log(`focus nút "Để sau": ${focused}`);
    const activeBefore = await cdp.evalJs(MODAL_FN);
    log(`activeElement trước Escape: ${activeBefore.activeTag}`);

    // E2: gửi Escape thật qua CDP.
    await cdp.key("Escape", "Escape");
    await cdp.shot("o1-after-escape.png");
    const after = await cdp.evalJs(MODAL_FN);
    log(`modal sau Escape: open=${after.open} welcomed=${JSON.stringify(after.welcomed)} active=${after.activeTag}`);

    const ok = !after.open && after.welcomed === "1";
    results.push({ name: "E1 modal hiện trên profile mới", ok: true, detail: `title=${JSON.stringify(before.title)} welcomed=${JSON.stringify(before.welcomed)}` });
    results.push({ name: "E2 Escape đóng modal khi focus trong modal + đánh dấu đã chào", ok, detail: `open=${after.open} welcomed=${JSON.stringify(after.welcomed)}` });
    const errors = cdp.exceptions;
    results.push({ name: "E3 0 lỗi trang trong phiên", ok: errors.length === 0, detail: errors.length ? errors.join(" | ").slice(0, 500) : "không có window.onerror/unhandledrejection" });

    const passCount = results.filter((r) => r.ok).length;
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    writeFileEpermRetry(path.join(SCRATCH, "o1-headed-report.json"), JSON.stringify({ pass: passCount, total: results.length, results, log: logLines }, null, 2));
    log(`O1 headed Escape: ${passCount}/${results.length} pass`);
    process.exitCode = passCount === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${(e && e.stack) || e}`);
    try { writeFileEpermRetry(path.join(SCRATCH, "o1-headed-report.json"), JSON.stringify({ pass: 0, total: 0, error: String((e && e.message) || e), log: logLines }, null, 2)); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
