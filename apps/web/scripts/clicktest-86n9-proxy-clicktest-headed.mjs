#!/usr/bin/env node
/**
 * clicktest-86n9-proxy-clicktest-headed.mjs — Phase 9 đợt 86, luồng N9:
 * CLICK-TEST HEADED đường UI proxy tự động (nợ còn lại của L9/M8).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP Node thuần,
 * không Playwright), mẫu clicktest-85m8-proxy-progress-headed.mjs (M8).
 *
 * Các ca (bridge thật, clip thật 1080p):
 *   S0. Mẫu tự load (3 clip, media 2 item) + ghi hasFile của media mẫu.
 *   N1. Selector chiều cao proxy 480/720p hiện, mặc định 720;
 *       đổi sang 480 qua change event thật (native setter + Event change)
 *       → select = "480", localStorage vcut-auto-proxy-height = "480".
 *   N2. Import clip C 1080p 12 s (auto BẬT, đích 480) → poll % thật
 *       (>= 2 giá trị khác nhau trong (0,100)) → badge "✓ PROXY 480p" →
 *       file proxy trên đĩa bridge: ffprobe 854x480, size > 0, GET 200,
 *       store proxyHeight 480.
 *   N3. Bấm chuột CDP thật TẮT checkbox "Tự tạo proxy" → checked=false,
 *       localStorage vcut-auto-proxy = "0" → import clip D 1080p 8 s →
 *       sau 20 s vẫn không tự tạo proxy (nút "Proxy 480p", không %,
 *       store proxyUrl null) → bấm lại BẬT (checked=true, ls "1").
 *   N4. Ghi chú mất file gốc: thẻ media mẫu là video mà không còn file
 *       phải hiện ghi chú "Không còn file gốc — không tạo được proxy…"
 *       (L9). Nếu ở S0 không có mẫu nào như vậy thì reload trang 1 lần
 *       (rehydrate từ IndexedDB có thể rớt blob) rồi kiểm lại; nếu vẫn
 *       không có thì FAIL kèm bằng chứng (không bịa ca).
 *   N5. Export dùng file gốc: thêm clip C (đã có proxy 480p) lên timeline
 *       → spec clip src vẫn là tên file gốc (không phải proxyUrl) →
 *       preview phát thì badge PROXY 480p hiện (preview dùng proxy,
 *       export dùng gốc). Kiểm chứng render-level chạy riêng bằng
 *       server/render/test_proxy_q8.js (10/10, Q8).
 *   N6. Đổi selector về 720 → import clip E 1080p 8 s → badge
 *       "✓ PROXY 720p" + ffprobe 1280x720 (selector có tác dụng thật
 *       cho lần auto-proxy sau).
 *   E0. Không lỗi JS/unhandledrejection trong trang.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-86n9-proxy-clicktest-headed.mjs
 * Env: N9_DEV_PORT (mặc định tự chọn 5540–5549), N9_DEBUG_PORT (9640–9649),
 *   N9_DISPLAY (mặc định :186 — display RIÊNG của N9),
 *   N9_SCRATCH (mặc định hidden_files/round86-n9/headed).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 * Ảnh chụp + log ở N9_SCRATCH (ngoài repo).
 *
 * Lần chạy 2 (sửa harness sau lần 1: 16/23): N3 dùng toggleCheckboxTo có
 * verify + thử lại (1 lần bấm CDP trượt lặng làm N3 + N6 fail oan);
 * N4 thêm tạo trạng thái mất file qua store.setState khi mẫu giữ File
 * sau reload; N6 thêm guard auto BẬT trước khi import clip E.
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
const SCRATCH = process.env.N9_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round86-n9", "headed");
const CHROME = [path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome"),
  path.join(os.homedir(), ".cache/ms-playwright", "chromium-1187", "chrome-linux", "chrome"),
  "/opt/meta-chromium/chrome"].find((c) => c && fs.existsSync(c));
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const CFG_DIR = "/tmp/round86-n9";
const VITE_CFG = path.join(CFG_DIR, "vite.n9.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round86-n9/bridge-work";

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
  // Click chuột CDP thật vào rect giữa element, thử lại tối đa 3 lần
  // (mẫu M8 A4: grid cuộn mượt làm tọa độ cũ). Trả về sau lần thử đầu
  // TIÊN nếu caller tự verify trạng thái sau click (xem toggleCheckboxTo).
  async clickRect(getRectFn, label) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const rect = await this.evalJs(getRectFn).catch(() => null);
      if (!rect) return { ok: false, detail: `không đo được rect ${label}` };
      await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(rect.x), y: Math.round(rect.y), button: "none", clickCount: 0 });
      await sleep(120);
      await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(rect.x), y: Math.round(rect.y), button: "left", clickCount: 1 });
      await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(rect.x), y: Math.round(rect.y), button: "left", clickCount: 1 });
      await sleep(600);
      return { ok: true, attempt };
    }
    return { ok: false, detail: "hết 3 lần thử" };
  }
}

// Trạng thái store phục vụ đo (mẫu M8/R10).
const STORE_FN = `(async () => {
  const mod = window.__n9storeMod || (window.__n9storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file, proxyUrl: m.proxyUrl || null, proxyHeight: m.proxyHeight || null })),
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => ({ src: c.src, name: c.name || null, start: c.start }))),
  };
})()`;

// Thẻ media theo tên file.
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
    hasNoOriginalNote: [...card.querySelectorAll("div")].some((d) => (d.textContent || "").includes("Không còn file gốc")),
    noOriginalText: [...card.querySelectorAll("div")].map((d) => (d.textContent || "").trim()).find((t) => t.includes("Không còn file gốc")) || null,
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

// Checkbox + selector proxy tự động.
const AUTO_UI_FN = `(() => {
  const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
  if (!label) return null;
  const cb = label.querySelector('input[type="checkbox"]');
  const sel = label.querySelector("select");
  const r = cb ? cb.getBoundingClientRect() : null;
  return {
    checked: cb ? cb.checked : null,
    selectValue: sel ? sel.value : null,
    selectOptions: sel ? [...sel.options].map((o) => o.value) : null,
    lsAuto: localStorage.getItem("vcut-auto-proxy"),
    lsHeight: localStorage.getItem("vcut-auto-proxy-height"),
    cbRect: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null,
  };
})()`;

// Đổi selector qua change event thật (native setter để React nhận).
const SET_SELECT_FN = (value) => `(() => {
  const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
  const sel = label?.querySelector("select");
  if (!sel) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(sel, ${JSON.stringify(value)});
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
})()`;

function makeClip(file, w, h, dur) {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    `testsrc=size=${w}x${h}:rate=30:duration=${dur}`,
    "-f", "lavfi", "-i", `sine=frequency=440:duration=${dur}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest", file], { stdio: "pipe" });
}

function probeProxyFile(proxyUrl) {
  const name = path.basename(proxyUrl.split("?")[0]);
  const disk = path.join(BRIDGE_WORK_DIR, "proxies", name);
  if (!fs.existsSync(disk)) return { ok: false, detail: `không thấy file trên đĩa: ${disk}` };
  const size = fs.statSync(disk).size;
  let wh = null;
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,duration", "-of", "json", disk], { encoding: "utf8" });
    const j = JSON.parse(out);
    wh = j.streams?.[0] || null;
  } catch (e) { return { ok: false, detail: `ffprobe lỗi: ${e.message.slice(0, 200)}` }; }
  return { ok: true, disk, size, width: wh?.width, height: wh?.height, duration: wh?.duration };
}

let vite = null, bridge = null, xvfb = null, chrome = null;

async function startBridge(port) {
  const logFd = fs.openSync(path.join(SCRATCH, "n9-bridge.log"), "a");
  const b = spawn("node", [BRIDGE_ENTRY], {
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      BRIDGE_PORT: String(port),
      BRIDGE_WORK_DIR,
      BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-n9-${process.pid}.json`),
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

async function importClip(cdp, file) {
  const doc = await cdp.send("DOM.getDocument", { depth: 0 });
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type='file']" });
  if (!q.nodeId) throw new Error("không thấy input file của MediaBin");
  await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [file] });
}

const CHECKBOX_RECT_FN = `(() => {
  const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
  const cb = label?.querySelector('input[type="checkbox"]');
  if (!cb) return null;
  const r = cb.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`;

// Bật/tắt checkbox "Tự tạo proxy" bằng chuột CDP thật, VERIFY trạng thái
// sau mỗi lần bấm và thử lại tối đa 3 lần; chỉ khi cả 3 lần đều trượt mới
// dùng JS .click() trên chính input thật (ghi rõ khi dùng fallback).
// Bài học lần chạy 1: 1 lần bấm CDP trượt lặng (checked không đổi,
// localStorage không ghi) — không được tin "đã bấm" khi chưa verify.
async function toggleCheckboxTo(cdp, wantChecked) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ui = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
    if (ui && ui.checked === wantChecked) return { ok: true, method: attempt === 1 ? "đã đúng trạng thái" : "CDP mouse click", attempt: attempt - 1, ui };
    const r = await cdp.clickRect(CHECKBOX_RECT_FN, "checkbox tự tạo proxy");
    if (!r.ok) return { ok: false, method: "CDP", detail: r.detail };
    await sleep(400);
    const after = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
    if (after && after.checked === wantChecked) return { ok: true, method: "CDP mouse click", attempt, ui: after };
  }
  const jsClicked = await cdp.evalJs(`(() => {
    const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
    const cb = label?.querySelector('input[type="checkbox"]');
    if (!cb) return false;
    cb.click();
    return true;
  })()`).catch(() => false);
  await sleep(400);
  const afterJs = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
  if (jsClicked && afterJs && afterJs.checked === wantChecked) return { ok: true, method: "JS .click() fallback (CDP click trượt 3 lần)", attempt: 3, ui: afterJs };
  return { ok: false, method: "CDP+JS", detail: `jsClicked=${jsClicked}, ui=${JSON.stringify(afterJs)}` };
}

async function waitCard(cdp, name, timeoutMs = 120000) {
  return cdp.waitFor(async () => {
    const c = await cdp.evalJs(CARD_FN(name)).catch(() => null);
    return c && c.found ? c : null;
  }, `thẻ media ${name} xuất hiện`, timeoutMs);
}

async function waitBadge(cdp, name, badgeText, timeoutMs = 240000) {
  const t0 = Date.now();
  const seenPct = new Set();
  let badge = null;
  while (Date.now() - t0 < timeoutMs) {
    const c = await cdp.evalJs(CARD_FN(name)).catch(() => null);
    if (!c) { await sleep(500); continue; }
    const p = c.progress === "" || c.progress === null ? null : Number(c.progress);
    if (typeof p === "number" && Number.isFinite(p) && p > 0 && p < 100) seenPct.add(p);
    if (c.btnText && c.btnText.includes(badgeText)) { badge = c; break; }
    await sleep(500);
  }
  return { badge, seenPct };
}

async function addClipToTimeline(cdp, name) {
  const scrolled = await cdp.evalJs(`(() => {
    const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
    if (!card) return false;
    card.scrollIntoView({ block: "center" });
    return true;
  })()`).catch(() => false);
  await sleep(500);
  const before = await cdp.evalJs(STORE_FN).catch(() => null);
  const beforeCount = before?.clipCount ?? 0;
  let added = false; let cdpClicked = false;
  if (scrolled) {
    for (let attempt = 1; attempt <= 3 && !added; attempt++) {
      const c = await cdp.evalJs(CARD_FN(name)).catch(() => null);
      if (!c?.addRect) break;
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(c.addRect.x), y: Math.round(c.addRect.y), button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(c.addRect.x), y: Math.round(c.addRect.y), button: "left", clickCount: 1 });
      await sleep(800);
      const afterAdd = await cdp.evalJs(STORE_FN).catch(() => null);
      added = !!(afterAdd && afterAdd.clipCount > beforeCount);
      if (added) { cdpClicked = true; log(`addClip: CDP mouse click trúng (lần thử ${attempt})`); }
      else await sleep(700);
    }
    if (!added) {
      const jsClicked = await cdp.evalJs(`(() => {
        const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
        const b = [...(card?.querySelectorAll("button") || [])].find((x) => (x.textContent || "").includes("Thêm"));
        if (!b) return false;
        b.click();
        return true;
      })()`).catch(() => false);
      await sleep(800);
      const afterJs = await cdp.evalJs(STORE_FN).catch(() => null);
      added = !!(afterJs && afterJs.clipCount > beforeCount);
      if (added) log("addClip: CDP click trượt cả 3 lần, JS .click() fallback đã thêm được clip");
    }
  }
  return { added, cdpClicked, beforeCount };
}

async function main() {
  const bridgePort = await pickFreePort(8841, 8849);
  if (!bridgePort) throw new Error("hết cổng bridge trống 8841–8849");
  const BRIDGE_URL = `http://127.0.0.1:${bridgePort}`;
  const DEV_PORT = Number(process.env.N9_DEV_PORT || 0) || (await pickFreePort(5540, 5549));
  const DEBUG_PORT = Number(process.env.N9_DEBUG_PORT || 0) || (await pickFreePort(9640, 9649));
  const DISPLAY = process.env.N9_DISPLAY || ":186";
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5540–5549");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9640–9649");
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
  const TMPDIR = "/tmp/round86-n9/tmp";
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.mkdirSync(CFG_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
  // Fixture: 3 clip thật 1080p (C 12 s để % kịp hiện, D 8 s, E 8 s).
  const clipC = path.join(SCRATCH, "n9-clip-c-1080p-12s.mp4");
  const clipD = path.join(SCRATCH, "n9-clip-d-1080p-8s.mp4");
  const clipE = path.join(SCRATCH, "n9-clip-e-1080p-8s.mp4");
  if (!fs.existsSync(clipC)) makeClip(clipC, 1920, 1080, 12);
  if (!fs.existsSync(clipD)) makeClip(clipD, 1920, 1080, 8);
  if (!fs.existsSync(clipE)) makeClip(clipE, 1920, 1080, 8);
  const clipCName = path.basename(clipC);
  const clipDName = path.basename(clipD);
  const clipEName = path.basename(clipE);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, bridge :${bridgePort}`);

  bridge = await startBridge(bridgePort);

  const viteLogFd = fs.openSync(path.join(SCRATCH, "n9-vite.log"), "w");
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
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "n9-chrome.log"), "w");
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
  if (s0) pass("S0 setup: locale vi + mẫu tự load", `3 clip, media [${s0.media.map((m) => `${m.name}(${m.kind},file=${m.hasFile})`).join(", ")}]`);
  else fail("S0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(await cdp.evalJs(STORE_FN).catch(() => null))}`);

  // ---- N1: selector 480/720p mặc định 720, đổi sang 480 ------------------
  const ui0 = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
  if (ui0 && ui0.checked === true && ui0.selectValue === "720" && JSON.stringify(ui0.selectOptions) === JSON.stringify(["480", "720"])) {
    pass("N1 selector 480/720p hiện, mặc định 720 + checkbox BẬT", `checked=true, select=720, options=[480,720], lsAuto=${ui0.lsAuto}, lsHeight=${ui0.lsHeight}`);
  } else {
    fail("N1 selector 480/720p hiện, mặc định 720 + checkbox BẬT", `ui=${JSON.stringify(ui0)}`);
  }
  const setOk = await cdp.evalJs(SET_SELECT_FN("480")).catch(() => false);
  await sleep(500);
  const ui480 = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
  if (setOk && ui480 && ui480.selectValue === "480" && ui480.lsHeight === "480") pass("N1 đổi selector sang 480p (change event thật)", `select=480, localStorage vcut-auto-proxy-height=480`);
  else fail("N1 đổi selector sang 480p (change event thật)", `setOk=${setOk}, ui=${JSON.stringify(ui480)}`);
  await cdp.shot("n9-n1-selector-480.png");

  // ---- N2: import clip C → proxy 480p thật -------------------------------
  await importClip(cdp, clipC);
  const cardC = await waitCard(cdp, clipCName).catch(() => null);
  if (cardC) pass("N2 import clip C: thẻ media xuất hiện", `btn="${cardC.btnText}"`);
  else fail("N2 import clip C: thẻ media xuất hiện", "không thấy thẻ sau 120s");
  const { badge: badgeC, seenPct: pctC } = await waitBadge(cdp, clipCName, "✓ PROXY 480p");
  await cdp.shot("n9-n2-badge-480.png");
  if (pctC.size >= 2) pass("N2 tiến trình % thật trong lúc tạo proxy 480p", `thấy ${pctC.size} giá trị % khác nhau trong (0,100): ${[...pctC].slice(0, 10).join(",")}`);
  else fail("N2 tiến trình % thật trong lúc tạo proxy 480p", `chỉ thấy ${pctC.size} giá trị % khác nhau: ${[...pctC].join(",")}`);
  if (badgeC) pass("N2 badge ✓ PROXY 480p hiện sau khi tạo xong", `btn="${badgeC.btnText}"`);
  else fail("N2 badge ✓ PROXY 480p hiện sau khi tạo xong", `card=${JSON.stringify(await cdp.evalJs(CARD_FN(clipCName)).catch(() => null))}`);
  const stC = await cdp.evalJs(STORE_FN).catch(() => null);
  const itemC = stC?.media?.find((m) => m.name === clipCName);
  if (itemC && itemC.proxyUrl && itemC.proxyHeight === 480) {
    pass("N2 store: proxyUrl bridge + proxyHeight 480", `proxyUrl=${itemC.proxyUrl}`);
    const pf = probeProxyFile(itemC.proxyUrl);
    if (pf.ok && pf.width === 854 && pf.height === 480 && pf.size > 0) {
      pass("N2 file proxy thật trên đĩa: ffprobe 854x480", `size=${pf.size} byte, dur=${pf.duration}s, ${path.basename(pf.disk)}`);
    } else {
      fail("N2 file proxy thật trên đĩa: ffprobe 854x480", JSON.stringify(pf));
    }
    const g = await fetch(itemC.proxyUrl);
    if (g.status === 200) pass("N2 GET proxy file qua bridge 200", `proxyUrl=${itemC.proxyUrl}`);
    else fail("N2 GET proxy file qua bridge 200", `GET ${g.status}`);
  } else {
    fail("N2 store: proxyUrl bridge + proxyHeight 480", `item=${JSON.stringify(itemC)}`);
  }

  // ---- N3: tắt checkbox auto → import clip D → không tự tạo proxy -------
  const uiBeforeOff = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
  const toggleOff = await toggleCheckboxTo(cdp, false);
  if (toggleOff.ok && toggleOff.ui.lsAuto === "0") {
    pass("N3 bấm chuột thật TẮT checkbox tự tạo proxy", `checked=true → false (trước: ${uiBeforeOff?.checked}), localStorage vcut-auto-proxy=0, ${toggleOff.method} lần ${toggleOff.attempt}`);
  } else {
    fail("N3 bấm chuột thật TẮT checkbox tự tạo proxy", `toggle=${JSON.stringify(toggleOff)}`);
  }
  await importClip(cdp, clipD);
  const cardD = await waitCard(cdp, clipDName).catch(() => null);
  if (cardD) pass("N3 import clip D khi auto TẮT: thẻ media xuất hiện", `btn="${cardD.btnText}"`);
  else fail("N3 import clip D khi auto TẮT: thẻ media xuất hiện", "không thấy thẻ sau 120s");
  await sleep(20000);
  const cardD2 = await cdp.evalJs(CARD_FN(clipDName)).catch(() => null);
  const stD = await cdp.evalJs(STORE_FN).catch(() => null);
  const itemD = stD?.media?.find((m) => m.name === clipDName);
  await cdp.shot("n9-n3-auto-off.png");
  if (cardD2 && cardD2.btnText === "Proxy 480p" && !cardD2.progress && itemD && !itemD.proxyUrl) {
    pass("N3 auto TẮT → không tự tạo proxy sau 20 s", `btn="${cardD2.btnText}", progress=${cardD2.progress}, store proxyUrl=null`);
  } else {
    fail("N3 auto TẮT → không tự tạo proxy sau 20 s", `card=${JSON.stringify(cardD2)}, item=${JSON.stringify(itemD)}`);
  }
  // Bật lại để các ca sau dùng auto (verify — lần chạy 1 bấm "bật lại"
  // thực ra đã TẮT vì lần bấm trước trượt lặng, kéo theo N6 fail oan).
  const toggleOn = await toggleCheckboxTo(cdp, true);
  if (toggleOn.ok && toggleOn.ui.lsAuto === "1") pass("N3 bấm lại BẬT checkbox tự tạo proxy", `checked=false → true, localStorage vcut-auto-proxy=1, ${toggleOn.method} lần ${toggleOn.attempt}`);
  else fail("N3 bấm lại BẬT checkbox tự tạo proxy", `toggle=${JSON.stringify(toggleOn)}`);

  // ---- N4: ghi chú mất file gốc trên thẻ media mẫu -----------------------
  async function findNoOriginalNote() {
    const st = await cdp.evalJs(STORE_FN).catch(() => null);
    if (!st) return null;
    for (const m of st.media) {
      if (m.kind !== "video" || m.hasFile) continue;
      const c = await cdp.evalJs(CARD_FN(m.name)).catch(() => null);
      if (c && c.hasNoOriginalNote) return { name: m.name, text: c.noOriginalText };
    }
    return null;
  }
  let noteFound = await findNoOriginalNote();
  if (!noteFound) {
    // Thử reload 1 lần: media rehydrate từ IndexedDB có thể rớt blob.
    log("N4: S0 chưa thấy mẫu mất file — reload trang 1 lần rồi kiểm lại");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STORE_FN).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount >= 2 ? t : null;
    }, "reload xong, mẫu tự load lại", 180000);
    await sleep(1000);
    noteFound = await findNoOriginalNote();
  }
  if (!noteFound) {
    // Lần chạy 1: cả 2 mẫu đều giữ File sau reload (sample load lại từ
    // asset kèm File thật) nên không có ca mất file qua đường UI thường.
    // Tạo đúng trạng thái đó bằng setState qua store thật (zustand):
    // gỡ `file` khỏi 1 media video mẫu — chỉ đổi state trong phiên test,
    // không sửa code sản phẩm — rồi kiểm nhánh UI L9 render ra sao.
    const stBefore = await cdp.evalJs(STORE_FN).catch(() => null);
    const victim = stBefore?.media?.find((m) => m.kind === "video" && m.hasFile);
    if (victim) {
      const removed = await cdp.evalJs(`(async () => {
        const mod = await import("/src/store.ts");
        mod.useStore.setState((s) => ({ media: s.media.map((m) => m.name === ${JSON.stringify(victim.name)} ? { ...m, file: undefined } : m) }));
        return mod.useStore.getState().media.find((m) => m.name === ${JSON.stringify(victim.name)})?.file === undefined;
      })()`).catch(() => false);
      log(`N4: gỡ file khỏi media mẫu "${victim.name}" qua store.setState: ${removed}`);
      await sleep(800);
      noteFound = await findNoOriginalNote();
      if (noteFound) noteFound.viaStoreState = true;
    }
  }
  await cdp.shot("n9-n4-no-original-note.png");
  if (noteFound && noteFound.text && noteFound.text.startsWith("Không còn file gốc")) {
    pass("N4 ghi chú mất file gốc hiện trên thẻ media mẫu", `item="${noteFound.name}", note="${noteFound.text}"${noteFound.viaStoreState ? " (tạo trạng thái mất file qua store.setState — mẫu giữ File sau reload)" : ""}`);
  } else {
    const stNow = await cdp.evalJs(STORE_FN).catch(() => null);
    fail("N4 ghi chú mất file gốc hiện trên thẻ media mẫu", `noteFound=${JSON.stringify(noteFound)}, media=${JSON.stringify(stNow?.media)}`);
  }

  // ---- N5: export dùng gốc — clip C lên timeline, spec trỏ gốc ----------
  const { added, cdpClicked } = await addClipToTimeline(cdp, clipCName);
  if (added) {
    const stN5 = await cdp.evalJs(STORE_FN).catch(() => null);
    const clipOnTl = stN5?.clips?.find((c) => c.src === clipCName);
    const itemC2 = stN5?.media?.find((m) => m.name === clipCName);
    if (clipOnTl) {
      pass("N5 export dùng gốc: clip trên timeline trỏ file gốc, không trỏ proxy", `clipCount=${stN5.clipCount}, src="${clipOnTl.src}" (proxyUrl vẫn "${itemC2?.proxyUrl}")${cdpClicked ? ", CDP mouse click" : ", JS .click() fallback"}`);
    } else {
      fail("N5 export dùng gốc: clip trên timeline trỏ file gốc, không trỏ proxy", `clips=${JSON.stringify(stN5?.clips)}`);
    }
    // Preview phát → badge PROXY 480p (preview dùng proxy, export dùng gốc).
    const clipStart = await cdp.evalJs(`(async () => {
      const mod = await import("/src/store.ts");
      const st = mod.useStore.getState();
      let start = null;
      for (const t of st.spec.tracks) for (const c of t.clips) {
        if (c.src === ${JSON.stringify(clipCName)}) { start = c.start; break; }
      }
      if (start === null) return null;
      st.setPlayhead(start + 0.5);
      st.togglePlay();
      return { start, playing: mod.useStore.getState().playing };
    })()`).catch(() => null);
    if (clipStart) log(`N5: playhead đặt ở ${clipStart.start + 0.5}s (đầu clip C), playing=${clipStart.playing}`);
    await sleep(5000);
    await cdp.evalJs(`(async () => { const mod = await import("/src/store.ts"); const st = mod.useStore.getState(); if (st.playing) st.togglePlay(); return true; })()`).catch(() => null);
    const badge = await cdp.evalJs(PREVIEW_BADGE_FN).catch(() => null);
    await cdp.shot("n9-n5-preview-badge.png");
    if (badge && badge.visible && badge.text.includes("PROXY 480p")) pass("N5 preview dùng proxy: badge PROXY 480p hiện khi phát", `badge="${badge.text}"`);
    else fail("N5 preview dùng proxy: badge PROXY 480p hiện khi phát", `badge=${JSON.stringify(badge)}`);
    if (cdp.proxyRequests.length >= 1) pass("N5 preview fetch đúng file proxy qua mạng", `${cdp.proxyRequests.length} request /api/proxy/file/`);
    else fail("N5 preview fetch đúng file proxy qua mạng", "không thấy request /api/proxy/file/ nào trong lúc play");
  } else {
    fail("N5 export dùng gốc: thêm clip C vào timeline", `clipCount=${(await cdp.evalJs(STORE_FN).catch(() => null))?.clipCount}`);
  }

  // ---- N6: selector về 720 → import clip E → proxy 720p ------------------
  // Guard: auto phải đang BẬT (lần chạy 1 N3 bấm trượt kéo theo N6 fail
  // oan vì auto thực ra TẮT — không import khi chưa verify).
  const uiN6 = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
  if (uiN6 && uiN6.checked === true) {
    pass("N6 guard: checkbox tự tạo proxy đang BẬT trước khi import clip E", `checked=true, lsAuto=${uiN6.lsAuto}`);
  } else {
    const fixOn = await toggleCheckboxTo(cdp, true);
    if (fixOn.ok) pass("N6 guard: checkbox đã BẬT lại trước khi import clip E", `${fixOn.method} lần ${fixOn.attempt}`);
    else fail("N6 guard: checkbox tự tạo proxy đang BẬT trước khi import clip E", `ui=${JSON.stringify(uiN6)}, toggle=${JSON.stringify(fixOn)}`);
  }
  const set720 = await cdp.evalJs(SET_SELECT_FN("720")).catch(() => false);
  await sleep(500);
  const ui720 = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
  if (set720 && ui720 && ui720.selectValue === "720" && ui720.lsHeight === "720") pass("N6 đổi selector về 720p", `select=720, localStorage vcut-auto-proxy-height=720`);
  else fail("N6 đổi selector về 720p", `setOk=${set720}, ui=${JSON.stringify(ui720)}`);
  await importClip(cdp, clipE);
  const cardE = await waitCard(cdp, clipEName).catch(() => null);
  if (cardE) pass("N6 import clip E: thẻ media xuất hiện", `btn="${cardE.btnText}"`);
  else fail("N6 import clip E: thẻ media xuất hiện", "không thấy thẻ sau 120s");
  const { badge: badgeE, seenPct: pctE } = await waitBadge(cdp, clipEName, "✓ PROXY 720p");
  await cdp.shot("n9-n6-badge-720.png");
  if (pctE.size >= 1) pass("N6 tiến trình % thật trong lúc tạo proxy 720p", `thấy ${pctE.size} giá trị % khác nhau trong (0,100)`);
  else fail("N6 tiến trình % thật trong lúc tạo proxy 720p", `chỉ thấy ${pctE.size} giá trị %`);
  if (badgeE) pass("N6 badge ✓ PROXY 720p hiện sau khi tạo xong", `btn="${badgeE.btnText}"`);
  else fail("N6 badge ✓ PROXY 720p hiện sau khi tạo xong", `card=${JSON.stringify(await cdp.evalJs(CARD_FN(clipEName)).catch(() => null))}`);
  const stE = await cdp.evalJs(STORE_FN).catch(() => null);
  const itemE = stE?.media?.find((m) => m.name === clipEName);
  if (itemE && itemE.proxyUrl && itemE.proxyHeight === 720) {
    const pf = probeProxyFile(itemE.proxyUrl);
    if (pf.ok && pf.width === 1280 && pf.height === 720 && pf.size > 0) {
      pass("N6 file proxy thật trên đĩa: ffprobe 1280x720", `size=${pf.size} byte, dur=${pf.duration}s`);
    } else {
      fail("N6 file proxy thật trên đĩa: ffprobe 1280x720", JSON.stringify(pf));
    }
  } else {
    fail("N6 store: proxyUrl bridge + proxyHeight 720", `item=${JSON.stringify(itemE)}`);
  }

  // ---- E0: lỗi JS trang ----------------------------------------------------
  const errs = cdp.exceptions;
  if (errs.length === 0) pass("E0 không có lỗi JS/unhandledrejection trong trang", "");
  else fail("E0 không có lỗi JS/unhandledrejection trong trang", errs.slice(0, 3).join(" | "));

  const failed = results.filter((r) => !r.ok).length;
  log(`\n== KẾT QUẢ CLICK-TEST N9: ${results.length - failed}/${results.length} pass ==`);
  writeFileEpermRetry(path.join(SCRATCH, "n9-clicktest-report.json"), JSON.stringify({ results, logLines }, null, 2));
  return failed === 0 ? 0 : 1;
}

let code = 2;
try {
  code = await main();
} catch (e) {
  console.error(`[n9] HARNESS LỖI: ${e.message}\n${e.stack || ""}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "n9-clicktest-report.json"), JSON.stringify({ results, logLines, harnessError: e.message }, null, 2)); } catch {}
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
