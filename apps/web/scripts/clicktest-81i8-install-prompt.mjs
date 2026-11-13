#!/usr/bin/env node
/**
 * clicktest-81i8-install-prompt.mjs — Phase 9 đợt 81, luồng I8: kiểm tra
 * install prompt PWA ở mức làm được trên VM (nợ đợt 80 H9 §6.2).
 *
 * Đo headed THẬT (vite preview PROD + Chromium headed qua Xvfb + CDP,
 * Node thuần, mẫu H9/63r1):
 *   I1 manifest + icons HTTP 200 ở PROD.
 *   I2 service worker đăng ký + điều khiển trang (PROD).
 *   I3 sự kiện `beforeinstallprompt` có fire không (listener đăng ký qua
 *       Page.addScriptToEvaluateOnNewDocument TRƯỚC khi navigate, giữ
 *       event + preventDefault để không hiện mini-infobar; chờ 30s).
 *   I4 Page.getInstallabilityErrors — danh sách lỗi cài đặt theo Chrome.
 *   I5 app có UI/handler nào cho cài đặt không (grep tĩnh trong luồng,
 *       không phải đo runtime — ghi rõ).
 *   H9 0 lỗi trang trong phiên.
 *
 * GIỚI HẠN (ghi rõ, không bịa): máy thật chưa test (không có điện thoại);
 * "Add to Home Screen" trên iOS/Android thật, chạm vào prompt thật, và
 * prompt sau khi user đã từ chối trước đó đều CHƯA test. Chromium desktop
 * giả lập viewport 390×844, mobile:false — prompt desktop (mini-infobar /
 * biểu tượng cài đặt ở omnibox) khác prompt mobile.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-81i8-install-prompt.mjs
 * Env: I8_PREVIEW_PORT (mặc định tự chọn 4390–4399), I8_DEBUG_PORT
 * (9690–9699), I8_DISPLAY (mặc định tự chọn :210–:219),
 * I8_SCRATCH (mặc định hidden_files/round81-i8/headed-install).
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
const SCRATCH = process.env.I8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round81-i8", "headed-install");
const CHROME = [
  path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome"),
  path.join(os.homedir(), ".cache/ms-playwright", "chromium-1187", "chrome-linux64", "chrome"),
].find((c) => fs.existsSync(c));
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

async function pickFreeDisplay(lo, hi) {
  const { execSync } = await import("node:child_process");
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
  if (!window.__i8injected) {
    window.__i8injected = true;
    window.__i8errors = [];
    window.addEventListener("error", (e) => { try { window.__i8errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__i8errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__i8errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__i8errors.push("unhandledrejection: <?>"); } });
  }
})()`;

// Đăng ký TRƯỚC khi trang tải: beforeinstallprompt chỉ fire 1 lần sau khi
// Chrome xác nhận đủ tiêu chí cài đặt; listener đăng ký muộn sẽ bỏ lỡ.
const INJECT_BIP = `(() => {
  window.__i8bip = window.__i8bip || { fired: false, at: null, platforms: null };
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__i8bip = { fired: true, at: new Date().toISOString(), platforms: e.platforms || null };
    window.__i8bipEvent = e;
  });
  window.addEventListener("appinstalled", () => { window.__i8bip.installed = true; });
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let preview = null, xvfb = null, chrome = null;
  try {
    const PREVIEW_PORT = Number(process.env.I8_PREVIEW_PORT || 0) || (await pickFreePort(4390, 4399));
    const DEBUG_PORT = Number(process.env.I8_DEBUG_PORT || 0) || (await pickFreePort(9690, 9699));
    const DISPLAY = process.env.I8_DISPLAY || (await pickFreeDisplay(210, 219));
    if (!PREVIEW_PORT) throw new Error("hết cổng preview trống 4390–4399");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9690–9699");
    if (!DISPLAY) throw new Error("hết display X trống :210–:219");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1187)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DIST = path.join(WEB_DIR, "dist");
    if (!fs.existsSync(path.join(DIST, "index.html"))) throw new Error("dist/index.html không có — cần vite build trước");
    if (!fs.existsSync(path.join(DIST, "sw.js"))) throw new Error("dist/sw.js không có");
    const PROD_URL = `http://127.0.0.1:${PREVIEW_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite preview :${PREVIEW_PORT} (dist), debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}`);

    const previewLogFd = fs.openSync(path.join(SCRATCH, "i8-preview.log"), "w");
    preview = spawn(VITE_BIN, ["preview", "--port", String(PREVIEW_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", previewLogFd, previewLogFd] });
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      try { const r = await fetch(PROD_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite preview không lên ở ${PROD_URL} sau 60s`);
    log("vite preview đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "i8-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
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
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT_ERRORS + ";" + INJECT_BIP });
    await cdp.send("Page.navigate", { url: PROD_URL });

    // Mount: topbar có mặt (textContent — brand ẩn ở mobile nên innerText rỗng).
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); if (!top || document.querySelector('.splash')) return null; return (top.textContent || "").includes('VCut') ? true : null; })()`).catch(() => null);
      return s;
    }, "app mount PROD (topbar)", 120000);
    log("app PROD đã mount ở 390x844");

    // ---- I1: manifest + icons -------------------------------------------
    try {
      const man = await cdp.evalJs(`(async () => {
        const r = await fetch("/manifest.webmanifest");
        if (!r.ok) return { ok: false, status: r.status };
        const j = await r.json();
        const icons = [];
        for (const ic of (j.icons || [])) {
          const rr = await fetch(ic.src);
          icons.push({ src: ic.src, sizes: ic.sizes, purpose: ic.purpose || "", status: rr.status });
        }
        return { ok: true, name: j.name, short_name: j.short_name, display: j.display, start_url: j.start_url, icons };
      })()`);
      writeFileEpermRetry(path.join(SCRATCH, "i8-measure-i1-manifest.json"), JSON.stringify(man, null, 2));
      if (man.ok && man.name === "VCut Studio" && man.display === "standalone" && man.icons.every((i) => i.status === 200)) {
        pass("I1 manifest PWA hợp lệ ở PROD", `name="${man.name}", short_name="${man.short_name}", display="${man.display}", start_url="${man.start_url}", icons ${man.icons.map((i) => `${i.sizes}${i.purpose ? `(${i.purpose})` : ""}:${i.status}`).join(", ")}`);
      } else {
        fail("I1 manifest PWA hợp lệ ở PROD", JSON.stringify(man));
      }
    } catch (e) { fail("I1 manifest PWA hợp lệ ở PROD", `HARNESS: ${e.message}`); }

    // ---- I2: SW đăng ký + điều khiển trang --------------------------------
    let swState = null;
    try {
      swState = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(`(async () => {
          if (!("serviceWorker" in navigator)) return null;
          const reg = await navigator.serviceWorker.getRegistration();
          if (!reg || !reg.active) return null;
          return { scope: reg.scope, activeState: reg.active.state, controller: !!navigator.serviceWorker.controller };
        })()`).catch(() => null);
        return swState && swState.controller ? swState : null;
      }, "SW active + controller", 60000).catch(() => null);
      if (!swState) swState = await cdp.evalJs(`(async () => { const reg = await navigator.serviceWorker.getRegistration().catch(() => null); return reg ? { scope: reg.scope, activeState: reg.active ? reg.active.state : null, controller: !!navigator.serviceWorker.controller } : null; })()`).catch(() => null);
      writeFileEpermRetry(path.join(SCRATCH, "i8-measure-i2-sw.json"), JSON.stringify(swState, null, 2));
      if (swState && swState.activeState === "activated" && swState.controller) {
        pass("I2 service worker đăng ký + điều khiển trang (PROD)", `scope=${swState.scope}, active=${swState.activeState}, controller=true`);
      } else {
        fail("I2 service worker đăng ký + điều khiển trang (PROD)", JSON.stringify(swState));
      }
    } catch (e) { fail("I2 service worker đăng ký + điều khiển trang (PROD)", `HARNESS: ${e.message}`); }

    // ---- I3: beforeinstallprompt có fire không (chờ 30s) ------------------
    let bip = null;
    try {
      const t0 = Date.now();
      while (Date.now() - t0 < 30000) {
        bip = await cdp.evalJs(`window.__i8bip || null`).catch(() => null);
        if (bip && bip.fired) break;
        await sleep(1000);
      }
      writeFileEpermRetry(path.join(SCRATCH, "i8-measure-i3-bip.json"), JSON.stringify({ waitedMs: Date.now() - t0, bip }, null, 2));
      if (bip && bip.fired) {
        pass("I3 sự kiện beforeinstallprompt fire (app đủ tiêu chí cài đặt)", `fire lúc ${bip.at} (sau ${Math.round((Date.now() - t0) / 1000)}s chờ), platforms=${JSON.stringify(bip.platforms)} — Chrome coi app là installable; event đã preventDefault nên không hiện mini-infobar trong lúc đo`);
      } else {
        fail("I3 sự kiện beforeinstallprompt fire (app đủ tiêu chí cài đặt)", `không fire sau 30s chờ (bip=${JSON.stringify(bip)}) — xem I4 để biết lỗi tiêu chí nào`);
      }
    } catch (e) { fail("I3 sự kiện beforeinstallprompt fire (app đủ tiêu chí cài đặt)", `HARNESS: ${e.message}`); }

    // ---- I4: Page.getInstallabilityErrors ----------------------------------
    try {
      let errs = null;
      try { errs = await cdp.send("Page.getInstallabilityErrors", {}, 15000); } catch (e) { errs = { error: e.message }; }
      writeFileEpermRetry(path.join(SCRATCH, "i8-measure-i4-installability.json"), JSON.stringify(errs, null, 2));
      const list = errs && Array.isArray(errs.installabilityErrors) ? errs.installabilityErrors : null;
      if (list) {
        if (list.length === 0) pass("I4 Page.getInstallabilityErrors: 0 lỗi", "Chrome không báo lỗi tiêu chí cài đặt nào");
        else fail("I4 Page.getInstallabilityErrors: 0 lỗi", `Chrome báo ${list.length} lỗi: ${list.map((e) => e.errorId || JSON.stringify(e)).join("; ")}`);
      } else {
        fail("I4 Page.getInstallabilityErrors: 0 lỗi", `không đọc được danh sách lỗi (CDP trả: ${JSON.stringify(errs).slice(0, 300)}) — ghi nhận là HARNESS/Chrome, xem I3 làm căn cứ chính`);
      }
    } catch (e) { fail("I4 Page.getInstallabilityErrors: 0 lỗi", `HARNESS: ${e.message}`); }

    // ---- I5: app có UI/handler cài đặt không -------------------------------
    // Đo runtime: có phần tử nào nhắc cài đặt / nút "Cài đặt" không; grep
    // tĩnh đã làm trong luồng (không có beforeinstallprompt trong src).
    try {
      const ui = await cdp.evalJs(`(() => {
        const btns = [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim()).filter((t) => /cài đặt|install|home screen|màn hình chính/i.test(t));
        return { installButtons: btns, hasBipListener: false };
      })()`);
      await cdp.shot("i8-i5-prod-390px.png");
      if (ui.installButtons.length === 0) {
        fail("I5 app có đường UI kích install prompt", `không có nút/link nào nhắc "Cài đặt/Install/Add to Home Screen" trong DOM lúc mount (buttons khớp: 0) — app đủ tiêu chí cài đặt (xem I3/I4) nhưng KHÔNG có UI tự giới thiệu cài đặt; user chỉ cài được qua menu trình duyệt (Chrome ⋮ → "Install VCut..." / biểu tượng cài đặt ở omnibox). Đây là PHÁT HIỆN, verdict FAIL theo tiêu chí "có đường UI", không phải lỗi tiêu chí PWA.`);
      } else {
        pass("I5 app có đường UI kích install prompt", `tìm thấy: ${ui.installButtons.join(" | ")}`);
      }
    } catch (e) { fail("I5 app có đường UI kích install prompt", `HARNESS: ${e.message}`); }

    // H9: 0 lỗi trang.
    const errs = (await cdp.evalJs(`(window.__i8errors || []).slice()`)) || [];
    if (errs.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong phiên PROD");
    else fail("H9 0 lỗi trang", errs.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "i8-install-prompt-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length, at: new Date().toISOString() }, null, 2));
    log(`KẾT QUẢ HEADED I8-INSTALL: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { preview?.kill("SIGKILL"); } catch {}
  }
}

main();
