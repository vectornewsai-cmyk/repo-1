#!/usr/bin/env node
/**
 * clicktest-85m8-proxy-progress-headed.mjs — Phase 9 đợt 85, luồng M8:
 * CLICK-TEST HEADED đường UI proxy tự động (tiến trình % + hàng đợi retry).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP Node thuần,
 * không Playwright), mẫu clicktest-62r10-headed-gaps.mjs (R10).
 *
 * Pha A (tiến trình % + badge + preview dùng proxy), bridge đang chạy:
 *   A1. Checkbox "Tự tạo proxy" mặc định BẬT.
 *   A2. Import clip 1080p 20 s thật qua input file của MediaBin
 *       (DOM.setFileInputFiles) → thẻ media xuất hiện.
 *   A3. Poll nút .media-proxy của thẻ: data-proxy-progress phải cho
 *       >= 2 giá trị % khác nhau trong (0,100) — % thật từ bridge,
 *       không phải timer; nút chuyển sang "✓ PROXY 720p".
 *   A4. Bấm "＋ Thêm" đưa clip lên timeline, play → badge
 *       .preview-proxy-badge hiện "PROXY 720p" + CDP Network thấy request
 *       tới /api/proxy/file/ (preview phát đúng bản proxy).
 *   A5. Store: media item có proxyUrl trỏ bridge + proxyHeight 720.
 *
 * Pha B (hàng đợi thử lại khi bridge tắt):
 *   B1. Tắt bridge → import clip 1080p 10 s khác → ghi chú retry hiện:
 *       "lần 2/5" + "sau 5 giây" (backoff lần 1 = 5 s), nút "Thử lại ngay".
 *   B2. Bấm "Thử lại ngay" khi bridge vẫn tắt → attempts tăng
 *       (ghi chú lên "lần 3/5", delay 10 s) — không crash, không treo.
 *   B3. Khởi động lại bridge (cùng cổng + WORK_ROOT) → bấm "Thử lại ngay"
 *       → badge "✓ PROXY 720p" hiện (retry thành công thật, file proxy
 *       có trên đĩa bridge, GET 200).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-85m8-proxy-progress-headed.mjs
 * Env: M8_DEV_PORT (mặc định tự chọn 5590–5599), M8_DEBUG_PORT (9690–9699),
 *   M8_DISPLAY (mặc định :185 — display RIÊNG của M8),
 *   M8_SCRATCH (mặc định hidden_files/round85-m8/headed).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 * Ảnh chụp + log ở M8_SCRATCH (ngoài repo).
 */
import { spawn, execSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.M8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round85-m8", "headed");
const CHROME = [path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome"),
  path.join(os.homedir(), ".cache/ms-playwright", "chromium-1187", "chrome-linux", "chrome")].find((c) => fs.existsSync(c));
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const CFG_DIR = "/tmp/round85-m8";
const VITE_CFG = path.join(CFG_DIR, "vite.m8.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round85-m8/bridge-work";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = [];
function pass(name, detail = "") { results.push({ name, ok: true, detail }); log(`PASS: ${name}${detail ? ` — ${detail}` : ""}`); }
function fail(name, detail = "") { results.push({ name, ok: false, detail }); log(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`); }

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
    this.proxyRequests = [];
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
      if (msg.method === "Network.requestWillBeSent") {
        const url = msg.params?.request?.url || "";
        if (url.includes("/api/proxy/file/")) this.proxyRequests.push(url);
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

// Trạng thái store phục vụ đo (mẫu R10).
const STORE_FN = `(async () => {
  const mod = window.__m8storeMod || (window.__m8storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file, proxyUrl: m.proxyUrl || null, proxyHeight: m.proxyHeight || null })),
  };
})()`;

// Thẻ media theo tên file: nút proxy + % + ghi chú retry.
const CARD_FN = (name) => `(() => {
  const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
  if (!card) return null;
  const btn = card.querySelector(".media-proxy");
  const note = card.querySelector('[data-testid="proxy-retry-note"]');
  const retryBtn = card.querySelector('[data-testid="proxy-retry-now"]');
  const addBtn = [...card.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Thêm"));
  return {
    found: true,
    btnText: btn ? btn.textContent.trim() : null,
    btnDisabled: btn ? btn.disabled : null,
    progress: btn ? btn.getAttribute("data-proxy-progress") : null,
    status: btn ? btn.getAttribute("data-proxy-status") : null,
    note: note ? note.textContent.trim() : null,
    hasRetryNow: !!retryBtn,
    addRect: addBtn ? (() => { const r = addBtn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : null,
  };
})()`;

// Badge PROXY trên preview.
const PREVIEW_BADGE_FN = `(() => {
  const b = document.querySelector(".preview-proxy-badge");
  if (!b) return null;
  const cs = getComputedStyle(b);
  return { text: (b.textContent || "").trim(), display: cs.display, visible: cs.display !== "none" && b.getBoundingClientRect().width > 0 };
})()`;

// Checkbox tự tạo proxy có BẬT không.
const AUTO_CHECK_FN = `[...document.querySelectorAll('label')].find(l => l.textContent.includes('Tự tạo proxy'))?.querySelector('input')?.checked ?? null`;

function makeClip(file, w, h, dur) {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    `testsrc=size=${w}x${h}:rate=30:duration=${dur}`,
    "-f", "lavfi", "-i", `sine=frequency=440:duration=${dur}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest", file], { stdio: "pipe" });
}

let vite = null, bridge = null, xvfb = null, chrome = null;

async function startBridge(port) {
  const logFd = fs.openSync(path.join(SCRATCH, "m8-bridge.log"), "a");
  const b = spawn("node", [BRIDGE_ENTRY], {
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      BRIDGE_PORT: String(port),
      BRIDGE_WORK_DIR,
      BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-m8-${process.pid}.json`),
    },
  });
  const url = `http://127.0.0.1:${port}`;
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { const r = await fetch(`${url}/api/proxy/file/nope.mp4`); if (r.status === 404 || r.status === 400) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`bridge không lên ở ${url} sau 120s`);
  log(`bridge OK: ${url}`);
  return b;
}

async function waitBridgeDown(port) {
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    try { await fetch(`http://127.0.0.1:${port}/api/proxy/file/nope.mp4`); await sleep(500); }
    catch { return true; }
  }
  return false;
}

async function importClip(cdp, file) {
  const doc = await cdp.send("DOM.getDocument", { depth: 0 });
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type='file']" });
  if (!q.nodeId) throw new Error("không thấy input file của MediaBin");
  await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [file] });
}

async function main() {
  const bridgePort = await pickFreePort(8891, 8899);
  if (!bridgePort) throw new Error("hết cổng bridge trống 8891–8899");
  const BRIDGE_URL = `http://127.0.0.1:${bridgePort}`;
  const DEV_PORT = Number(process.env.M8_DEV_PORT || 0) || (await pickFreePort(5590, 5599));
  const DEBUG_PORT = Number(process.env.M8_DEBUG_PORT || 0) || (await pickFreePort(9690, 9699));
  const DISPLAY = process.env.M8_DISPLAY || ":185";
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5590–5599");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9690–9699");
  const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
    if (alive) throw new Error(`display ${DISPLAY} đã có X server khác`);
    fs.unlinkSync(sock);
    log(`đã dọn socket X mồ côi ${sock}`);
  }
  if (!CHROME) throw new Error("không thấy chrome playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  const TMPDIR = "/tmp/round85-m8/tmp";
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.mkdirSync(CFG_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
  // Fixture: 2 clip thật (pha A 20 s để % kịp hiện nhiều mẫu, pha B 10 s).
  const clipA = path.join(SCRATCH, "m8-clip-a-1080p-20s.mp4");
  const clipB = path.join(SCRATCH, "m8-clip-b-1080p-10s.mp4");
  if (!fs.existsSync(clipA)) makeClip(clipA, 1920, 1080, 20);
  if (!fs.existsSync(clipB)) makeClip(clipB, 1920, 1080, 10);
  const clipAName = path.basename(clipA);
  const clipBName = path.basename(clipB);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, bridge :${bridgePort}`);

  // ---- Bridge (pha A: đang chạy) ---------------------------------------
  bridge = await startBridge(bridgePort);

  // ---- Vite + Xvfb + Chrome --------------------------------------------
  const viteLogFd = fs.openSync(path.join(SCRATCH, "m8-vite.log"), "w");
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
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "m8-chrome.log"), "w");
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
  await cdp.send("Network.enable");

  // ---- S0: mount + mẫu tự load ------------------------------------------
  await cdp.send("Page.navigate", { url: DEV_URL });
  const s0 = await cdp.waitFor(async () => {
    const t = await cdp.evalJs(STORE_FN).catch(() => null);
    return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
  }, "project mẫu tự load (3 clip, media bin 2 item)", 180000);
  if (s0) pass("S0 setup: locale vi + mẫu tự load", `3 clip, media [${s0.media.map((m) => m.name).join(", ")}]`);
  else fail("S0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(await cdp.evalJs(STORE_FN).catch(() => null))}`);

  // ---- A1: checkbox tự động mặc định BẬT --------------------------------
  const autoChecked = await cdp.evalJs(AUTO_CHECK_FN).catch(() => null);
  if (autoChecked === true) pass("A1 checkbox tự tạo proxy mặc định BẬT", "checked=true");
  else fail("A1 checkbox tự tạo proxy mặc định BẬT", `checked=${autoChecked}`);

  // ---- A2: import clip A -------------------------------------------------
  await importClip(cdp, clipA);
  const cardA = await cdp.waitFor(async () => {
    const c = await cdp.evalJs(CARD_FN(clipAName)).catch(() => null);
    return c && c.found ? c : null;
  }, `thẻ media ${clipAName} xuất hiện`, 120000);
  if (cardA) pass("A2 import clip A: thẻ media xuất hiện", `btn="${cardA.btnText}"`);
  else fail("A2 import clip A: thẻ media xuất hiện", "không thấy thẻ sau 120s");

  // ---- A3: poll % thật + chờ badge ---------------------------------------
  const seenPct = new Set();
  const tA3 = Date.now();
  let badgeA = null;
  while (Date.now() - tA3 < 240000) {
    const c = await cdp.evalJs(CARD_FN(clipAName)).catch(() => null);
    if (!c) { await sleep(500); continue; }
    const p = c.progress === "" || c.progress === null ? null : Number(c.progress);
    if (typeof p === "number" && Number.isFinite(p) && p > 0 && p < 100) seenPct.add(p);
    if (c.btnText && c.btnText.includes("✓ PROXY 720p")) { badgeA = c; break; }
    await sleep(500);
  }
  await cdp.shot("m8-a3-badge.png");
  if (seenPct.size >= 2) pass("A3 tiến trình % thật trong lúc tạo proxy", `thấy ${seenPct.size} giá trị % khác nhau trong (0,100): ${[...seenPct].slice(0, 10).join(",")}`);
  else fail("A3 tiến trình % thật trong lúc tạo proxy", `chỉ thấy ${seenPct.size} giá trị % khác nhau: ${[...seenPct].join(",")}`);
  if (badgeA) pass("A3 badge ✓ PROXY 720p hiện sau khi tạo xong", `btn="${badgeA.btnText}"`);
  else fail("A3 badge ✓ PROXY 720p hiện sau khi tạo xong", `btn cuối=${JSON.stringify(await cdp.evalJs(CARD_FN(clipAName)).catch(() => null))}`);

  // ---- A4: thêm lên timeline + play → preview dùng proxy -----------------
  // Thẻ clip A nằm ở hàng 2 của grid (cuộn khỏi vùng nhìn thấy — xem
  // ảnh m8-a4 lần 1: bin chỉ hiện 2 clip mẫu) nên phải scrollIntoView
  // rồi đo lại tọa độ, không click mù theo rect cũ.
  const scrolled = await cdp.evalJs(`(() => {
    const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(clipAName)});
    if (!card) return false;
    card.scrollIntoView({ block: "center" });
    return true;
  })()`).catch(() => false);
  await sleep(500);
  const cardA2 = await cdp.evalJs(CARD_FN(clipAName)).catch(() => null);
  let added = false;
  let cdpClicked = false;
  if (scrolled && cardA2?.addRect) {
    // CDP click có thể trượt nếu grid còn cuộn mượt sau scrollIntoView
    // (tọa độ đo lúc đang cuộn đã cũ) — thử lại tối đa 3 lần, mỗi lần
    // đo lại tọa độ mới; chỉ khi cả 3 lần đều trượt mới dùng JS .click().
    for (let attempt = 1; attempt <= 3 && !added; attempt++) {
      const c = await cdp.evalJs(CARD_FN(clipAName)).catch(() => null);
      if (!c?.addRect) break;
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(c.addRect.x), y: Math.round(c.addRect.y), button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(c.addRect.x), y: Math.round(c.addRect.y), button: "left", clickCount: 1 });
      await sleep(800);
      const afterAdd = await cdp.evalJs(STORE_FN).catch(() => null);
      added = !!(afterAdd && afterAdd.clipCount > 3);
      if (added) { cdpClicked = true; log(`A4: CDP mouse click thêm được clip (lần thử ${attempt})`); }
      else await sleep(700);
    }
    if (!added) {
      // Fallback: click trực tiếp nút thật bằng JS (vẫn là nút UI thật,
      // chỉ khác cách dispatch) — ghi rõ trong report khi dùng fallback.
      const jsClicked = await cdp.evalJs(`(() => {
        const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(clipAName)});
        const b = [...(card?.querySelectorAll("button") || [])].find((x) => (x.textContent || "").includes("Thêm"));
        if (!b) return false;
        b.click();
        return true;
      })()`).catch(() => false);
      await sleep(800);
      const afterJs = await cdp.evalJs(STORE_FN).catch(() => null);
      added = !!(afterJs && afterJs.clipCount > 3);
      if (added) log("A4: CDP click trượt cả 3 lần, JS .click() fallback đã thêm được clip");
    }
  }
  if (added) {
    const afterAdd = await cdp.evalJs(STORE_FN).catch(() => null);
    pass("A4 thêm clip A vào timeline (click chuột thật)", `clipCount 3 → ${afterAdd.clipCount}${cdpClicked ? ", CDP mouse click" : ", JS .click() fallback (CDP click trượt 3 lần)"}`);
    // Đặt playhead vào giữa clip A vừa thêm rồi phát preview.
    const clipStart = await cdp.evalJs(`(async () => {
      const mod = await import("/src/store.ts");
      const st = mod.useStore.getState();
      let start = null;
      for (const t of st.spec.tracks) for (const c of t.clips) {
        if (c.src === ${JSON.stringify(clipAName)}) { start = c.start; break; }
      }
      if (start === null) return null;
      st.setPlayhead(start + 0.5);
      st.togglePlay();
      return { start, playing: mod.useStore.getState().playing };
    })()`).catch(() => null);
    if (clipStart) log(`A4: playhead đặt ở ${clipStart.start + 0.5}s (đầu clip A), playing=${clipStart.playing}`);
    await sleep(5000);
    await cdp.evalJs(`(async () => { const mod = await import("/src/store.ts"); const st = mod.useStore.getState(); if (st.playing) st.togglePlay(); return true; })()`).catch(() => null);
    const badge = await cdp.evalJs(PREVIEW_BADGE_FN).catch(() => null);
    await cdp.shot("m8-a4-preview-badge.png");
    if (badge && badge.visible && badge.text.includes("PROXY 720p")) pass("A4 preview dùng proxy: badge PROXY 720p hiện", `badge="${badge.text}"`);
    else fail("A4 preview dùng proxy: badge PROXY 720p hiện", `badge=${JSON.stringify(badge)}`);
    if (cdp.proxyRequests.length >= 1) pass("A4 preview fetch đúng file proxy qua mạng", `${cdp.proxyRequests.length} request /api/proxy/file/: ${cdp.proxyRequests[0]}`);
    else fail("A4 preview fetch đúng file proxy qua mạng", "không thấy request /api/proxy/file/ nào trong lúc play");
  } else {
    fail("A4 thêm clip A vào timeline (click chuột thật)", `scrolled=${scrolled}, card=${JSON.stringify(cardA2)}, clipCount=${(await cdp.evalJs(STORE_FN).catch(() => null))?.clipCount}`);
  }

  // ---- A5: store có proxyUrl ----------------------------------------------
  const stA = await cdp.evalJs(STORE_FN).catch(() => null);
  const itemA = stA?.media?.find((m) => m.name === clipAName);
  if (itemA && itemA.proxyUrl && itemA.proxyUrl.includes("/api/proxy/file/") && itemA.proxyHeight === 720) pass("A5 store: proxyUrl bridge + proxyHeight 720", `proxyUrl=${itemA.proxyUrl}`);
  else fail("A5 store: proxyUrl bridge + proxyHeight 720", `item=${JSON.stringify(itemA)}`);

  // ================= PHA B: bridge tắt → hàng đợi thử lại =================
  // ---- B1: tắt bridge, import clip B → ghi chú retry ----------------------
  bridge.kill("SIGTERM");
  bridge = null;
  const down = await waitBridgeDown(bridgePort);
  if (down) pass("B0 bridge đã tắt hẳn (cổng đóng)", `:${bridgePort} không trả lời`);
  else fail("B0 bridge đã tắt hẳn (cổng đóng)", "cổng vẫn trả lời sau 20s");
  await importClip(cdp, clipB);
  await cdp.waitFor(async () => {
    const c = await cdp.evalJs(CARD_FN(clipBName)).catch(() => null);
    return c && c.found ? c : null;
  }, `thẻ media ${clipBName} xuất hiện`, 120000);
  let noteB = null;
  try {
    noteB = await cdp.waitFor(async () => {
      const c = await cdp.evalJs(CARD_FN(clipBName)).catch(() => null);
      return c && c.note && c.note.includes("lần 2/5") ? c : null;
    }, "ghi chú retry lần 2/5 hiện", 60000);
  } catch (e) { /* fail bên dưới */ }
  await cdp.shot("m8-b1-retry-note.png");
  if (noteB && noteB.hasRetryNow && /sau 5 giây/.test(noteB.note || "")) pass("B1 bridge tắt → chờ thử lại lần 2/5 sau 5 giây + nút Thử lại ngay", `note="${noteB.note}"`);
  else fail("B1 bridge tắt → chờ thử lại lần 2/5 sau 5 giây + nút Thử lại ngay", `card=${JSON.stringify(await cdp.evalJs(CARD_FN(clipBName)).catch(() => null))}`);

  // ---- B2: bấm Thử lại ngay khi bridge vẫn tắt → attempts tăng ------------
  const clickedB2 = await cdp.evalJs(`(() => {
    const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(clipBName)});
    const b = card?.querySelector('[data-testid="proxy-retry-now"]');
    if (!b) return false;
    b.click();
    return true;
  })()`).catch(() => false);
  let noteB2 = null;
  if (clickedB2) {
    try {
      noteB2 = await cdp.waitFor(async () => {
        const c = await cdp.evalJs(CARD_FN(clipBName)).catch(() => null);
        // Lần thử lại tay thất bại (bridge vẫn tắt) → attempts=2, lần tiếp là 3/5, delay 10 s.
        // Timer tự động 5 s cũng có thể chạy trước — chấp nhận lần >= 3.
        return c && c.note && /lần [3-9]\/5/.test(c.note) ? c : null;
      }, "ghi chú retry tăng lên lần >= 3/5", 60000);
    } catch { /* fail bên dưới */ }
  }
  if (clickedB2 && noteB2) pass("B2 thử lại ngay khi bridge tắt → attempts tăng, không crash", `note="${noteB2.note}"`);
  else fail("B2 thử lại ngay khi bridge tắt → attempts tăng, không crash", `clicked=${clickedB2}, card=${JSON.stringify(await cdp.evalJs(CARD_FN(clipBName)).catch(() => null))}`);

  // ---- B3: khởi động lại bridge → thử lại → badge -------------------------
  bridge = await startBridge(bridgePort);
  const clickedB3 = await cdp.evalJs(`(() => {
    const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(clipBName)});
    const b = card?.querySelector('[data-testid="proxy-retry-now"]');
    if (!b) return false;
    b.click();
    return true;
  })()`).catch(() => false);
  // Timer tự động cũng có thể chạy trước nút bấm — badge mới là verdict.
  let badgeB = null;
  const tB3 = Date.now();
  while (Date.now() - tB3 < 240000) {
    const c = await cdp.evalJs(CARD_FN(clipBName)).catch(() => null);
    if (c && c.btnText && c.btnText.includes("✓ PROXY 720p")) { badgeB = c; break; }
    await sleep(500);
  }
  await cdp.shot("m8-b3-badge.png");
  if (badgeB) pass("B3 bridge lên lại → thử lại thành công, badge ✓ PROXY 720p", `clickedRetryNow=${clickedB3}, btn="${badgeB.btnText}"`);
  else fail("B3 bridge lên lại → thử lại thành công, badge ✓ PROXY 720p", `clickedRetryNow=${clickedB3}, card=${JSON.stringify(await cdp.evalJs(CARD_FN(clipBName)).catch(() => null))}`);
  const stB = await cdp.evalJs(STORE_FN).catch(() => null);
  const itemB = stB?.media?.find((m) => m.name === clipBName);
  if (itemB?.proxyUrl) {
    // proxyUrl đã là URL đầy đủ (http://127.0.0.1:PORT/api/...) — KHÔNG
    // cộng thêm BRIDGE_URL (lỗi lần 1: URL kép, fetch throw).
    const g = await fetch(itemB.proxyUrl);
    if (g.status === 200) pass("B3 file proxy của clip B có trên bridge (GET 200)", `proxyUrl=${itemB.proxyUrl}`);
    else fail("B3 file proxy của clip B có trên bridge (GET 200)", `GET ${g.status}`);
    const proxyOnDisk = fs.existsSync(path.join(BRIDGE_WORK_DIR, "proxies", path.basename(itemB.proxyUrl)));
    if (proxyOnDisk) pass("B3 file proxy của clip B có trên đĩa bridge", path.basename(itemB.proxyUrl));
    else fail("B3 file proxy của clip B có trên đĩa bridge", itemB.proxyUrl);
  } else {
    fail("B3 file proxy của clip B có trên bridge (GET 200)", `item=${JSON.stringify(itemB)}`);
  }

  // ---- Lỗi JS trang --------------------------------------------------------
  const errs = cdp.exceptions;
  if (errs.length === 0) pass("E0 không có lỗi JS/unhandledrejection trong trang", "");
  else fail("E0 không có lỗi JS/unhandledrejection trong trang", errs.slice(0, 3).join(" | "));

  const failed = results.filter((r) => !r.ok).length;
  log(`\n== KẾT QUẢ CLICK-TEST: ${results.length - failed}/${results.length} pass ==`);
  writeFileEpermRetry(path.join(SCRATCH, "m8-clicktest-report.json"), JSON.stringify({ results, logLines }, null, 2));
  return failed === 0 ? 0 : 1;
}

let code = 2;
try {
  code = await main();
} catch (e) {
  console.error(`[m8] HARNESS LỖI: ${e.message}\n${e.stack || ""}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "m8-clicktest-report.json"), JSON.stringify({ results, logLines, harnessError: e.message }, null, 2)); } catch {}
  code = 2;
} finally {
  for (const p of [chrome, xvfb, vite, bridge]) {
    try { if (p && p.exitCode === null) p.kill("SIGTERM"); } catch {}
  }
  await sleep(800);
  for (const p of [chrome, xvfb, vite, bridge]) {
    try { if (p && p.exitCode === null) p.kill("SIGKILL"); } catch {}
  }
}
process.exit(code);
