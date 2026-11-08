#!/usr/bin/env node
/**
 * clicktest-62r10-proxy-redo.mjs — Phase 9 đợt 62, luồng R10: đo lại (d)
 * sau khi lượt chạy chính D1 FAIL vì chọn sai file test.
 *
 * Nguyên nhân D1 lượt chính (đã xác minh, KHÔNG phải bug sản phẩm):
 * r4-test.mp4 chỉ 320×180 — proxy.js có luật KHÔNG upscale (nguồn ≤
 * target 720p → trả {skipped:true, reason:"source-already-small"}),
 * bridge trả 200 {skipped:true}, client toast info mediabin.smallEnough
 * ("…đã đủ nhỏ, không cần proxy.") rồi return — không tạo proxy, không
 * badge. Đúng thiết kế.
 *
 * Redo này dùng nguồn 1080p thật (r10-test-1080p.mp4, 1920×1080, 2s,
 * ffmpeg testsrc2) + TẮT auto-proxy (localStorage vcut-auto-proxy=0,
 * mặc định BẬT nên phải tắt trước khi import để cú bấm tay là đường
 * duy nhất tạo proxy) rồi:
 *   P1 bấm nút proxy THẬT bằng chuột → proxy được tạo (file
 *       r10-test-1080p__proxy_720p.mp4 + sidecar JSON trên đĩa bridge,
 *       ffprobe 1280×720), badge PROXY 720p hiện, HEAD proxyUrl 200,
 *       toast proxyAttached, đo thời gian thật.
 *   P2 đường skipped (bấm proxy trên file nhỏ r4-test.mp4) → toast info
 *       smallEnough, KHÔNG proxy, nút mở lại — khóa hành vi đúng thiết
 *       kế của D1 lượt chính.
 *
 * Chạy headed THẬT (vite dev đóng băng + Chromium headed qua Xvfb + CDP
 * Node thuần). Bridge riêng (cổng 8792–8799 + BRIDGE_WORK_DIR riêng),
 * display RIÊNG :174. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG push/tag/binary.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round62-r10", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const CFG_DIR = "/tmp/round62-r10";
const VITE_CFG = path.join(CFG_DIR, "vite.r10p.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round62-r10/bridge-work2";
const STATIC_DIR = "/tmp/round62-r10/static";
const VI = JSON.parse(fs.readFileSync(path.join(WEB_DIR, "src", "i18n", "vi.json"), "utf8"));

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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 60s: ${method}`)); }, 60000);
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

const INJECT_ERRORS = `(() => {
  if (!window.__r10pinjected) {
    window.__r10pinjected = true;
    window.__r10perrors = [];
    window.addEventListener("error", (e) => { try { window.__r10perrors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r10perrors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__r10perrors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r10perrors.push("unhandledrejection: <?>"); } });
  }
  window.__r10pboot = window.__r10pboot || Math.random().toString(36).slice(2);
})()`;

const STORE_FN = `(async () => {
  const mod = window.__r10pstoreMod || (window.__r10pstoreMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file, proxyUrl: m.proxyUrl || null, proxyHeight: m.proxyHeight || null, proxySizeBytes: m.proxySizeBytes || null })),
  };
})()`;

const PROXY_CARD_FN = (name) => `((n) => {
  const cards = [...document.querySelectorAll(".media-card")];
  const card = cards.find((c) => (c.querySelector(".media-name") || {}).textContent === n);
  if (!card) return null;
  const btn = card.querySelector(".media-proxy");
  const badgeText = [...card.querySelectorAll("*")].map((e) => e.textContent || "").find((t) => /^PROXY \\d+p/.test(t.trim()));
  const br = btn ? btn.getBoundingClientRect() : null;
  return {
    found: true,
    btnText: btn ? (btn.textContent || "").trim() : null,
    btnDisabled: btn ? !!btn.disabled : null,
    btnRect: br ? { x: br.left + br.width / 2, y: br.top + br.height / 2 } : null,
    badge: badgeText ? badgeText.trim() : null,
  };
})(${JSON.stringify(name)})`;

const TOASTS_FN = `[...document.querySelectorAll(".toast")].map((e) => (e.textContent || "").trim())`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null, staticSrv = null;
  const phaseErrors = [];
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { bridge?.kill("SIGTERM"); } catch {}
    try { staticSrv?.kill("SIGKILL"); } catch {}
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
  async function waitMounted(cdp, oldBoot) {
    const oldBootJson = JSON.stringify(oldBoot ?? null);
    const boot = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__r10pboot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount", 240000);
    await ensureNoModal(cdp);
    return boot;
  }
  async function reloadPage(cdp) {
    const oldBoot = await cdp.evalJs(`window.__r10pboot`).catch(() => null);
    await cdp.send("Page.reload", { ignoreCache: false });
    return waitMounted(cdp, oldBoot);
  }
  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r10perrors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r10perrors = []`).catch(() => {});
    return e;
  }
  async function scrollBtnIntoView(cdp, elExpr) {
    const ok = await cdp.evalJs(`(() => {
      const el = (${elExpr});
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "center" });
      return true;
    })()`).catch(() => null);
    if (!ok) return null;
    await sleep(500);
    return cdp.evalJs(`(() => {
      const el = (${elExpr});
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2, disabled: !!el.disabled, inViewport: b.top >= 0 && b.bottom <= window.innerHeight };
    })()`).catch(() => null);
  }
  async function importFile(cdp, staticPort, fname, mime) {
    return cdp.evalJs(`(async () => {
      const buf = await (await fetch("http://127.0.0.1:${staticPort}/${fname}")).arrayBuffer();
      const file = new File([buf], ${JSON.stringify(fname)}, { type: ${JSON.stringify(mime)} });
      const mod = window.__r10pstoreMod || (window.__r10pstoreMod = await import("/src/store.ts"));
      const st = mod.useStore.getState();
      await st.importFiles([file]);
      const item = mod.useStore.getState().media.find((m) => m.name === ${JSON.stringify(fname)});
      if (!item) return { ok: false, why: "importFiles xong mà media không có " + ${JSON.stringify(fname)} };
      return { ok: true, kind: item.kind, duration: item.duration, hasFile: !!item.file, proxyUrl: item.proxyUrl || null };
    })()`);
  }

  try {
    const bridgePort = await pickFreePort(8792, 8799);
    const STATIC_PORT = await pickFreePort(5820, 5829);
    const DEV_PORT = await pickFreePort(5500, 5509);
    const DEBUG_PORT = await pickFreePort(9600, 9609);
    // Display RIÊNG: các luồng round-62 khác đang chạy song song đã chiếm
    // :160/:170/:174 — chọn display trống động trong 174–190.
    let DISPLAY = null;
    for (let d = 174; d <= 190; d++) {
      const s = `/tmp/.X11-unix/X${d}`;
      if (fs.existsSync(s)) continue;
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb :${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (!alive) { DISPLAY = `:${d}`; break; }
    }
    if (!DISPLAY) throw new Error("hết display X trống 174–190");
    if (!bridgePort || !STATIC_PORT || !DEV_PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock}`);
    }
    const BRIDGE_URL = `http://127.0.0.1:${bridgePort}`;
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata-redo");
    const TMPDIR = "/tmp/round62-r10/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, bridge :${bridgePort}, static :${STATIC_PORT}`);

    const staticLogFd = fs.openSync(path.join(SCRATCH, "r10p-static.log"), "w");
    staticSrv = spawn("python3", [path.join(os.homedir(), "scratch-round62-r10", "cors-server.py"), String(STATIC_PORT), STATIC_DIR], { stdio: ["ignore", staticLogFd, staticLogFd] });
    for (let i = 0; i < 30; i++) {
      try { const r = await fetch(`http://127.0.0.1:${STATIC_PORT}/r10-test-1080p.mp4`, { method: "HEAD" }); if (r.ok) break; } catch {}
      await sleep(500);
    }
    log(`static server :${STATIC_PORT} lên`);

    const bridgeLogFd = fs.openSync(path.join(SCRATCH, "r10p-bridge.log"), "w");
    // Dọn proxies dir của WORK_DIR riêng trước khi đo để diff file
    // before/after có nghĩa (lượt redo trước đã để lại proxy cũ cùng tên —
    // generateProxy ghi đè cùng tên file nên diff sẽ rỗng nếu không dọn).
    fs.rmSync(path.join(BRIDGE_WORK_DIR, "proxies"), { recursive: true, force: true });
    bridge = spawn("node", [BRIDGE_ENTRY], {
      stdio: ["ignore", bridgeLogFd, bridgeLogFd],
      // Đợt 66 T9 — persist riêng theo PID (BRIDGE_WORK_DIR cố định): tránh rò mốc limiter (đợt 65 §3b).
      env: { ...process.env, BRIDGE_PORT: String(bridgePort), CAPTION_PYTHON: path.join(ROOT, "server", "caption", ".venv", "bin", "python"), TTS_PYTHON: path.join(ROOT, "server", "tts", ".venv2", "bin", "python"), BRIDGE_WORK_DIR, BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-${process.pid}.json`) },
    });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const h = await fetch(BRIDGE_URL + "/api/health"); const j = await h.json(); if (j.caption && j.caption.available) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`bridge không lên ở ${BRIDGE_URL} sau 120s`);
    log(`bridge OK: ${BRIDGE_URL} (WORK_DIR=${BRIDGE_WORK_DIR})`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r10p-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd], env: { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL } });
    up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r10p-chrome.log"), "w");
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

    // ---- Mount + tắt auto-proxy trước khi import ----------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STORE_FN).catch(() => null);
      return t && t.media.length === 2 ? t : null;
    }, "project mẫu tự load (media bin 2 item)", 180000);
    await cdp.evalJs(`localStorage.setItem("vcut-auto-proxy", "0")`);
    await reloadPage(cdp);
    const autoOff = await cdp.evalJs(`localStorage.getItem("vcut-auto-proxy")`);
    await drainErrors(cdp);
    if (s0 && autoOff === "0") pass("P0 setup: mẫu tự load + auto-proxy ĐÃ TẮT", `media [${s0.media.map((m) => m.name).join(", ")}], vcut-auto-proxy=${autoOff} (mặc định BẬT — tắt để cú bấm tay là đường duy nhất tạo proxy)`);
    else fail("P0 setup: mẫu tự load + auto-proxy ĐÃ TẮT", `s0=${JSON.stringify(s0)}, autoOff=${autoOff}`);

    // ---- P1: proxy thật trên nguồn 1080p ------------------------------
    const proxiesDir = path.join(BRIDGE_WORK_DIR, "proxies");
    const beforeList = fs.existsSync(proxiesDir) ? fs.readdirSync(proxiesDir) : [];
    const imp = await importFile(cdp, STATIC_PORT, "r10-test-1080p.mp4", "video/mp4");
    if (!imp.ok) {
      fail("P1 proxy 1080p: bấm nút tạo proxy thật (bridge chạy)", `không import được MP4 1080p: ${imp.why}`);
    } else {
      log(`P1: MP4 1080p đã import: ${JSON.stringify(imp)}`);
      // Chờ 3s: nếu auto-proxy vẫn chạy lén thì proxyUrl sẽ tự xuất hiện
      // → đo bấm tay bị nhiễm, phải FAIL rõ thay vì đo nhầm.
      await sleep(3000);
      const afterImport = await cdp.evalJs(STORE_FN);
      const item0 = afterImport.media.find((m) => m.name === "r10-test-1080p.mp4");
      if (item0 && item0.proxyUrl) {
        fail("P1 proxy 1080p: bấm nút tạo proxy thật (bridge chạy)", `auto-proxy đã tạo proxy TRƯỚC khi bấm tay (proxyUrl=${item0.proxyUrl}) — không đo được cú bấm tay`);
      } else {
        await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector(".media-proxy")`).catch(() => false), "nút .media-proxy hiện", 60000);
        await scrollBtnIntoView(cdp, `(() => { const cards = [...document.querySelectorAll(".media-card")]; const card = cards.find((c) => (c.querySelector(".media-name") || {}).textContent === "r10-test-1080p.mp4"); return card ? card.querySelector(".media-proxy") : null; })()`);
        const card0 = await cdp.evalJs(PROXY_CARD_FN("r10-test-1080p.mp4"));
        if (!card0 || !card0.btnRect) {
          fail("P1 proxy 1080p: bấm nút tạo proxy thật (bridge chạy)", `không thấy nút proxy của card r10-test-1080p.mp4 (card=${JSON.stringify(card0)})`);
        } else {
          const t0 = Date.now();
          await cdp.click(card0.btnRect.x, card0.btnRect.y);
          // Poll store + bắt toast ngay lúc nó hiện (toast tự tắt sau vài s).
          let done = null;
          let seenToasts = [];
          for (let i = 0; i < 240 && !done; i++) {
            const st = await cdp.evalJs(STORE_FN).catch(() => null);
            const it = st ? st.media.find((m) => m.name === "r10-test-1080p.mp4") : null;
            const ts = await cdp.evalJs(TOASTS_FN).catch(() => []);
            for (const t of ts) if (!seenToasts.includes(t)) seenToasts.push(t);
            if (it && it.proxyUrl) { done = it; break; }
            await sleep(500);
          }
          const elapsedMs = Date.now() - t0;
          const card1 = await cdp.evalJs(PROXY_CARD_FN("r10-test-1080p.mp4"));
          const afterList = fs.existsSync(proxiesDir) ? fs.readdirSync(proxiesDir) : [];
          const newFiles = afterList.filter((f) => !beforeList.includes(f));
          let headOk = false;
          let probeOut = "";
          if (done && done.proxyUrl) {
            try { const r = await fetch(done.proxyUrl, { method: "HEAD" }); headOk = r.ok; } catch { headOk = false; }
            try {
              const proxyFile = path.join(proxiesDir, "r10-test-1080p__proxy_720p.mp4");
              if (fs.existsSync(proxyFile)) {
                probeOut = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of csv=p=0 ${JSON.stringify(proxyFile)}`, { encoding: "utf8" }).trim();
              }
            } catch (e) { probeOut = "ffprobe lỗi: " + String(e.message).slice(0, 200); }
          }
          const sidecar = path.join(proxiesDir, "r10-test-1080p__proxy_720p.json");
          const sidecarJson = fs.existsSync(sidecar) ? JSON.parse(fs.readFileSync(sidecar, "utf8")) : null;
          fs.writeFileSync(path.join(SCRATCH, "r10-measure-proxy-redo.json"), JSON.stringify({ done, cardAfter: card1, newFiles, headOk, probeOut, sidecarJson, seenToasts, elapsedMs }, null, 2));
          await cdp.shot("r10-proxy-redo-after.png");
          const problems = [];
          if (!done) problems.push("proxyUrl không xuất hiện sau 120s");
          if (done && done.proxyHeight !== 720) problems.push(`proxyHeight=${done.proxyHeight} (kỳ vọng 720)`);
          // "Badge" PROXY thực chất là chính nút proxy đổi text thành
          // "✓ PROXY 720p" (MediaBin.tsx:140) — không có element badge
          // riêng; chấp nhận btnText chứa PROXY 720p làm bằng chứng hiển
          // thị (lượt redo 1 đo sai chỗ này nên FAIL oan).
          const badgeShown = (card1 && ((card1.badge && /^PROXY 720p/.test(card1.badge)) || (card1.btnText && card1.btnText.includes("PROXY 720p"))));
          if (!badgeShown) problems.push(`không hiện PROXY 720p (badge=${card1 ? JSON.stringify(card1.badge) : "không thấy card"}, btnText=${card1 ? JSON.stringify(card1.btnText) : "?"})`);
          if (!headOk) problems.push("HEAD proxyUrl không 200");
          if (!newFiles.includes("r10-test-1080p__proxy_720p.mp4")) problems.push(`không thấy file proxy trên đĩa bridge (mới: ${newFiles.join(", ")})`);
          if (!newFiles.includes("r10-test-1080p__proxy_720p.json")) problems.push("không thấy sidecar JSON");
          if (probeOut !== "1280,720,2.000000") problems.push(`ffprobe proxy = "${probeOut}" (kỳ vọng "1280,720,2.000000")`);
          if (!seenToasts.some((t) => t.includes("proxy 720p") || t.includes("Proxy"))) problems.push(`không bắt được toast proxyAttached (toasts đã thấy: ${JSON.stringify(seenToasts)})`);
          await drainErrors(cdp);
          if (problems.length) fail("P1 proxy 1080p: bấm nút tạo proxy thật (bridge chạy)", `${problems.join(" || ")} — sau ${elapsedMs}ms, proxyUrl=${done ? done.proxyUrl : "?"}`);
          else pass("P1 proxy 1080p: bấm nút tạo proxy thật (bridge chạy)", `proxy tạo xong sau ${elapsedMs}ms: ${done.proxyUrl} (720p, proxySizeBytes=${done.proxySizeBytes}), nút hiện "✓ PROXY 720p", HEAD 200, ffprobe proxy 1280×720 2.0s, file+sidecar trên đĩa bridge, toast=${JSON.stringify(seenToasts)}`);
        }
      }
    }
    await drainErrors(cdp);

    // ---- P2: đường skipped trên file nhỏ (khóa hành vi D1 lượt chính) --
    {
      const imp2 = await importFile(cdp, STATIC_PORT, "r4-test.mp4", "video/mp4");
      if (!imp2.ok) {
        fail("P2 skipped: bấm proxy trên nguồn nhỏ → toast smallEnough, không proxy", `không import được r4-test.mp4: ${imp2.why}`);
      } else {
        await scrollBtnIntoView(cdp, `(() => { const cards = [...document.querySelectorAll(".media-card")]; const card = cards.find((c) => (c.querySelector(".media-name") || {}).textContent === "r4-test.mp4"); return card ? card.querySelector(".media-proxy") : null; })()`);
        const card0 = await cdp.evalJs(PROXY_CARD_FN("r4-test.mp4"));
        if (!card0 || !card0.btnRect) {
          fail("P2 skipped: bấm proxy trên nguồn nhỏ → toast smallEnough, không proxy", `không thấy nút proxy của card r4-test.mp4`);
        } else {
          const t0 = Date.now();
          await cdp.click(card0.btnRect.x, card0.btnRect.y);
          let seenToasts = [];
          let settled = null;
          for (let i = 0; i < 40 && !settled; i++) {
            const ts = await cdp.evalJs(TOASTS_FN).catch(() => []);
            for (const t of ts) if (!seenToasts.includes(t)) seenToasts.push(t);
            const st = await cdp.evalJs(STORE_FN).catch(() => null);
            const it = st ? st.media.find((m) => m.name === "r4-test.mp4") : null;
            const c = await cdp.evalJs(PROXY_CARD_FN("r4-test.mp4")).catch(() => null);
            // Toast smallEnough đã hiện + nút mở lại (không còn busy) là đủ
            // kết luận đường skipped (bridge trả skipped ngay, không chờ).
            if (seenToasts.some((t) => t.includes("đủ nhỏ")) && c && !c.btnDisabled) { settled = { toasts: seenToasts, proxyUrl: it ? it.proxyUrl : null, btnDisabled: c.btnDisabled }; break; }
            await sleep(500);
          }
          const elapsedMs = Date.now() - t0;
          const expectedToast = VI.mediabin.smallEnough.replace("{name}", "r4-test.mp4");
          fs.writeFileSync(path.join(SCRATCH, "r10-measure-proxy-skipped.json"), JSON.stringify({ settled, expectedToast, elapsedMs }, null, 2));
          await cdp.shot("r10-proxy-skipped.png");
          await drainErrors(cdp);
          // Toast có kèm nút đóng "×" ở cuối textContent nên so startsWith
          // (lượt redo 1 so exact nên FAIL oan dù toast đã hiện đúng).
          if (settled && settled.toasts.some((t) => t.startsWith(expectedToast)) && !settled.proxyUrl && !settled.btnDisabled) {
            pass("P2 skipped: bấm proxy trên nguồn nhỏ → toast smallEnough, không proxy", `toast exact "${expectedToast}" sau ${elapsedMs}ms, proxyUrl vẫn null, nút mở lại (không busy) — đúng thiết kế KHÔNG upscale (nguồn 180px ≤ 720p)`);
          } else {
            fail("P2 skipped: bấm proxy trên nguồn nhỏ → toast smallEnough, không proxy", `settled=${JSON.stringify(settled)} (kỳ vọng toast exact "${expectedToast}", proxyUrl null, nút mở lại)`);
          }
        }
      }
    }
    await drainErrors(cdp);

    fs.writeFileSync(path.join(SCRATCH, "r10-proxy-redo-report.json"), JSON.stringify({ results, phaseErrors, at: new Date().toISOString() }, null, 2));
    fs.writeFileSync(path.join(SCRATCH, "r10-proxy-redo-log.txt"), logLines.join("\n") + "\n");
    if (phaseErrors.length === 0) pass("P9 0 lỗi trang trong phiên redo", "window.onerror / unhandledrejection = 0");
    else fail("P9 0 lỗi trang trong phiên redo", `${phaseErrors.length} lỗi: ${phaseErrors.slice(0, 5).join(" | ")}`);

    const failed = results.filter((r) => !r.ok);
    log(`\n=== KẾT QUẢ REDO: ${results.length - failed.length}/${results.length} PASS ===`);
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name}`);
    killAll();
    process.exit(failed.length ? 1 : 0);
  } catch (e) {
    log("HARNESS ERROR: " + (e && e.stack || e));
    try { fs.writeFileSync(path.join(SCRATCH, "r10-proxy-redo-log.txt"), logLines.join("\n") + "\n"); } catch {}
    killAll();
    process.exit(2);
  }
}

main();
