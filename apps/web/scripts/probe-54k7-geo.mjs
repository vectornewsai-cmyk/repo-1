#!/usr/bin/env node
/**
 * clicktest-54k7-proxy-toolbar-stale.mjs — Phase 9 đợt 54, luồng K7:
 * 2 nợ đợt 53 J5 (docs/PHASE9_ROUND53_J5_PROXY_PREVIEW_LIMITS.md §6):
 *  (1) Nút Proxy bị thanh toolbar timeline phủ ở 1440×900 — click chuột
 *      thật trượt (`elementFromPoint` → `tl-toolbar`). Harness bấm nút
 *      bằng CDP Input.dispatchMouseEvent tại tâm nút và kiểm tra proxy
 *      thật sự được tạo (proxyUrl về store), kèm dump hình học để chẩn
 *      đoán nguyên nhân phủ.
 *  (2) Proxy stale nếu WORK_ROOT của bridge bị xóa tay: xóa file proxy
 *      khỏi đĩa → reload → item phải KHÔNG giữ proxyUrl chết, phải báo
 *      rõ (proxyStale + nút "Proxy mất, tạo lại"), manifest phải xóa
 *      proxyPath; bấm nút tạo lại bằng chuột thật → proxy mới được tạo
 *      (file mới trên đĩa, proxyUrl mới, manifest cập nhật).
 *
 * Cách làm: vite dev + bridge thật (BRIDGE_WORK_DIR riêng trong
 * scratch, cổng tự chọn) + Chromium headed qua Xvfb + CDP (mẫu J5).
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-54k7-proxy-toolbar-stale.mjs
 * Env: K7_DEV_PORT (mặc định tự chọn 5301–5319), K7_DEBUG_PORT (9491–9509),
 * K7_BRIDGE_PORT (mặc định tự chọn 8801–8819), K7_DISPLAY (mặc định tự
 * chọn :100–:119), K7_SCRATCH (mặc định ~/workspace/tmp-round54-k7/proxy),
 * K7_CLIP (mặc định ~/workspace/tmp-round53-j5/fixtures/clip1080p.mp4).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG sửa file sản
 * phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.K7_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round54-k7", "proxy");
const CLIP_PATH = process.env.K7_CLIP || path.join(os.homedir(), "workspace", "tmp-round53-j5", "fixtures", "clip1080p.mp4");
const BRIDGE_WORK_DIR = path.join(SCRATCH, "proxy-work");
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
function pickFreeDisplay() {
  for (let n = 100; n <= 119; n++) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
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
  async waitFor(fn, label, timeoutMs = 180000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const INJECT_ERRORS = `(() => {
  window.__k7errors = [];
  window.addEventListener("error", (e) => {
    try { window.__k7errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__k7errors.push("window.onerror: <?>"); }
  });
  window.addEventListener("unhandledrejection", (e) => {
    try { window.__k7errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__k7errors.push("unhandledrejection: <?>"); }
  });
})()`;

const STORE_FN = `(() => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  return (async () => {
    const mod = window.__k7storeMod || (window.__k7storeMod = await import(hit));
    const st = mod.useStore.getState();
    return {
      name: st.spec.meta?.name ?? null,
      playhead: st.playhead,
      playing: st.playing,
      media: st.media.map((m) => ({ id: m.id, name: m.name, kind: m.kind, duration: +m.duration.toFixed(3),
        assetId: m.assetId ?? null, proxyUrl: m.proxyUrl ?? null, proxyHeight: m.proxyHeight ?? null,
        proxySizeBytes: m.proxySizeBytes ?? null, proxyStale: m.proxyStale ?? false, hasFile: !!m.file })),
    };
  })();
})()`;

// Dump hình học layout: rect của mọi khối liên quan + elementFromPoint
// tại tâm nút Proxy + scroll của media-grid. Chẩn đoán T1.
const GEO_FN = `(() => {
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      position: cs.position, overflowY: cs.overflowY, display: cs.display };
  };
  const grid = document.querySelector(".media-grid");
  const clipCard = [...document.querySelectorAll(".media-card")].find((c) => c.querySelector(".media-name")?.textContent?.trim() === "clip1080p.mp4");
  const clipKids = clipCard ? [...clipCard.children].map((el) => {
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { tag: el.tagName, cls: String(el.className).split(" ")[0],
      y: +b.y.toFixed(1), h: +b.height.toFixed(1), display: cs.display, position: cs.position,
      marginTop: cs.marginTop, marginBottom: cs.marginBottom };
  }) : null;
  const clipCardInfo = clipCard ? { scrollH: clipCard.scrollHeight, clientH: clipCard.clientHeight,
    offsetH: clipCard.offsetHeight, csHeight: getComputedStyle(clipCard).height,
    csOverflow: getComputedStyle(clipCard).overflow } : null;
  const cards = [...document.querySelectorAll(".media-card")].map((c) => {
    const b = c.getBoundingClientRect();
    const btn = c.querySelector(".media-proxy");
    const br = btn ? btn.getBoundingClientRect() : null;
    return { name: c.querySelector(".media-name")?.textContent?.trim(),
      card: { y: +b.y.toFixed(1), h: +b.height.toFixed(1), bottom: +(b.bottom).toFixed(1) },
      offsetTop: c.offsetTop, offsetParent: c.offsetParent?.className?.toString().slice(0, 30) || c.offsetParent?.tagName,
      proxyBtn: br ? { y: +br.y.toFixed(1), h: +br.height.toFixed(1) } : null };
  });
  const binKids = [...document.querySelector(".mediabin").children].map((el) => ({
    cls: String(el.className).split(" ")[0], ...r(el) }));
  return {
    innerW: window.innerWidth, innerH: window.innerHeight,
    mediabin: r(document.querySelector(".mediabin")),
    mediaGrid: r(grid),
    gridScroll: grid ? { scrollTop: grid.scrollTop, scrollHeight: grid.scrollHeight, clientHeight: grid.clientHeight } : null,
    gridChildren: grid ? grid.children.length : 0,
    cards, clipKids, clipCardInfo, binKids,
    timeline: r(document.querySelector(".timeline")),
    tlToolbar: r(document.querySelector(".tl-toolbar")),
    topbar: r(document.querySelector(".topbar")),
    editorMain: r(document.querySelector(".editor-main")),
  };
})()`;

// Import clip 1080p thật qua fetch từ server tĩnh của harness → File →
// importFiles → thêm vào timeline ở playhead 0 (mẫu J5).
const IMPORT_CLIP_FN = (clipUrl) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__k7storeMod || (window.__k7storeMod = await import(hit));
  const st = mod.useStore.getState();
  const res = await fetch(${JSON.stringify(clipUrl)});
  if (!res.ok) return { ok: false, reason: "fetch clip HTTP " + res.status };
  const blob = await res.blob();
  const file = new File([blob], "clip1080p.mp4", { type: "video/mp4" });
  st.setPlayhead(0);
  await st.importFiles([file]);
  const after = mod.useStore.getState();
  const item = after.media.find((m) => m.name === "clip1080p.mp4");
  if (!item) return { ok: false, reason: "importFiles xong mà không thấy clip1080p.mp4 trong bin" };
  after.addMediaAtPlayhead(item.id);
  const st2 = mod.useStore.getState();
  const clip = st2.spec.tracks.flatMap((t) => t.clips.map((c) => ({ ...c, trackId: t.id })))
    .find((c) => c.kind === "video" && c.src === "clip1080p.mp4");
  return { ok: true, mediaId: item.id, itemDuration: item.duration, itemHeight: item.height ?? null,
    assetId: item.assetId ?? null, trackId: clip?.trackId ?? null, clipId: clip?.id ?? null };
})()`;

// Đọc manifest của asset từ IndexedDB thật trong trang (AssetStore thật).
const MANIFEST_FN = (assetId) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/lib\\/assetStore\\.ts(\\?|$)/.test(u)) || "/src/lib/assetStore.ts";
  const mod = window.__k7assetMod || (window.__k7assetMod = await import(hit));
  const store = new mod.AssetStore();
  const m = await store.get(${JSON.stringify(assetId)});
  await store.close();
  return m ? { assetId: m.assetId, originalName: m.originalName,
    proxyPath: m.proxyPath ?? null, proxyHeight: m.proxyHeight ?? null,
    proxySizeBytes: m.proxySizeBytes ?? null } : null;
})()`;

// Bấm nút Proxy của clip1080p bằng chuột THẬT qua CDP tại tâm nút.
// Trả về atPoint + text nút trước/sau.
async function clickProxyReal(cdp) {
  const info = await cdp.evalJs(`(() => {
    const cards = [...document.querySelectorAll(".media-card")];
    const card = cards.find((c) => c.querySelector(".media-name")?.textContent?.trim() === "clip1080p.mp4");
    const b = card?.querySelector(".media-proxy");
    if (!b) return null;
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const stack = document.elementsFromPoint(cx, cy).slice(0, 3)
      .map((e) => e.tagName + "." + String(e.className).split(" ")[0]);
    return { x: Math.round(cx), y: Math.round(cy), atPoint: stack,
      btnTextBefore: b.textContent.trim(), disabled: b.disabled };
  })()`);
  if (!info) throw new Error("không thấy nút .media-proxy của clip1080p.mp4");
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: info.x, y: info.y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: info.x, y: info.y, button: "left", clickCount: 1 });
  await sleep(400);
  const after = await cdp.evalJs(`(() => {
    const cards = [...document.querySelectorAll(".media-card")];
    const card = cards.find((c) => c.querySelector(".media-name")?.textContent?.trim() === "clip1080p.mp4");
    return card?.querySelector(".media-proxy")?.textContent.trim() ?? null;
  })()`);
  return { ...info, btnTextAfter: after };
}

// Chờ proxyUrl của clip1080p về store (timeout riêng, trả null khi hết).
async function waitProxyUrl(cdp, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await cdp.evalJs(STORE_FN).catch(() => null);
    const it = s?.media.find((m) => m.name === "clip1080p.mp4");
    if (it?.proxyUrl) return it;
    await sleep(500);
  }
  return null;
}

const MODAL_SEL = ".modal-backdrop, .tour-card, .welcome-modal";

async function closeModal(cdp) {
  const present = await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`);
  if (!present) return "không có modal";
  await cdp.evalJs(`(() => { const m = document.querySelector(${JSON.stringify(MODAL_SEL)}); const b = m?.querySelector("button"); b?.click(); return true; })()`).catch(() => {});
  await sleep(600);
  let gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  if (!gone) {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" }).catch(() => {});
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" }).catch(() => {});
    await sleep(600);
    gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  }
  return gone ? "đã đóng modal" : "modal vẫn mở sau các cách đóng";
}

function proxyFileOnDisk(workDir, proxyUrl) {
  try {
    const name = decodeURIComponent(proxyUrl.split("/").pop() || "");
    const full = path.join(workDir, "proxies", name);
    const st = fs.statSync(full);
    return { name, full, size: st.size, mtimeMs: st.mtimeMs, exists: true };
  } catch {
    return { name: null, full: null, size: null, mtimeMs: null, exists: false };
  }
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null, clipServer = null;
  let harnessError = null;

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { bridge?.kill("SIGKILL"); } catch {}
    try { clipServer?.close(); } catch {}
  };
  process.on("exit", killAll);

  try {
    const DEV_PORT = Number(process.env.K7_DEV_PORT || 0) || (await pickFreePort(5301, 5319));
    const DEBUG_PORT = Number(process.env.K7_DEBUG_PORT || 0) || (await pickFreePort(9491, 9509));
    const BRIDGE_PORT = Number(process.env.K7_BRIDGE_PORT || 0) || (await pickFreePort(8801, 8819));
    const CLIP_PORT = await pickFreePort(5401, 5419);
    const DISPLAY = process.env.K7_DISPLAY || pickFreeDisplay();
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5301–5319");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9491–9509");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8801–8819");
    if (!CLIP_PORT) throw new Error("hết cổng clip trống 5401–5419");
    if (!DISPLAY) throw new Error("hết display Xvfb trống :100–:119");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(CLIP_PATH)) throw new Error(`không thấy clip ${CLIP_PATH}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const CLIP_URL = `http://127.0.0.1:${CLIP_PORT}/clip1080p.mp4`;
    const PROFILE = path.join(SCRATCH, "cdprof-proxy");
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, bridge :${BRIDGE_PORT}, debug :${DEBUG_PORT}, clip :${CLIP_PORT}, DISPLAY=${DISPLAY}`);

    const bridgeLogFd = fs.openSync(path.join(SCRATCH, "proxy-bridge.log"), "w");
    bridge = spawn("node", [path.join(ROOT, "server", "bridge", "src", "index.js")],
      { cwd: path.join(ROOT, "server", "bridge"), stdio: ["ignore", bridgeLogFd, bridgeLogFd],
        // Đợt 66 T9 — persist riêng theo PID (BRIDGE_WORK_DIR cố định): tránh rò mốc limiter (đợt 65 §3b).
        env: { ...process.env, BRIDGE_PORT: String(BRIDGE_PORT), BRIDGE_WORK_DIR, BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-${process.pid}.json`) } });
    let bridgeUp = false;
    for (let i = 0; i < 60 && !bridgeUp; i++) {
      try { const r = await fetch(`${BRIDGE_URL}/api/health`); if (r.ok) bridgeUp = true; } catch { await sleep(1000); }
    }
    if (!bridgeUp) throw new Error(`bridge không lên ở ${BRIDGE_URL} sau 60 s`);
    log("bridge đã lên");

    const clipBytes = fs.readFileSync(CLIP_PATH);
    clipServer = http.createServer((req, res) => {
      if (req.url === "/clip1080p.mp4") {
        res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": clipBytes.length, "Access-Control-Allow-Origin": "*" });
        res.end(clipBytes);
      } else { res.writeHead(404); res.end(); }
    });
    await new Promise((res, rej) => { clipServer.once("error", rej); clipServer.listen(CLIP_PORT, "127.0.0.1", res); });

    const viteLogFd = fs.openSync(path.join(SCRATCH, "proxy-vite.log"), "w");
    vite = spawn(VITE_BIN, ["--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd],
        env: { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL } });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [`${DISPLAY}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "proxy-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
    let pageTarget = null;
    for (let i = 0; i < 360 && !pageTarget; i++) {
      try {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 5000);
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`, { signal: ctl.signal })).json();
        clearTimeout(to);
        pageTarget = (pages || []).find((p) => p.type === "page") || null;
      } catch {}
      if (!pageTarget) await sleep(500);
    }
    if (!pageTarget) throw new Error("không tìm thấy target type=page sau 180 s");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT_ERRORS });
    log("CDP đã nối, đã cài thu lỗi trang (__k7errors)");

    await cdp.send("Page.navigate", { url: DEV_URL });
    const loaded = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll(".tl-clip").length`).catch(() => 0);
      return n >= 3 ? true : null;
    }, "project mẫu >= 3 clip", 180000).catch(() => false);
    if (!loaded) throw new Error("project mẫu không load (>= 3 clip) sau 180 s");
    const snap0 = await cdp.evalJs(STORE_FN);
    if (snap0.name === "Dự án mẫu") pass("A0 load sample", `tên "Dự án mẫu"`);
    else fail("A0 load sample", `name=${snap0.name}`);
    log(`modal: ${await closeModal(cdp)}`);
    log(`bridge URL app đang dùng: ${await cdp.evalJs(`window.__VCUT_BRIDGE_URL__ ?? null`)}`);

    // ---- P0: import clip 1080p + thêm vào timeline ----
    const imp = await cdp.evalJs(IMPORT_CLIP_FN(CLIP_URL));
    if (imp.ok && imp.itemHeight === 1080 && imp.clipId && imp.assetId) {
      pass("P0 import clip 1080p + thêm vào timeline", `media ${imp.mediaId}, assetId=${imp.assetId}, height=${imp.itemHeight}, clip=${imp.clipId}`);
    } else {
      fail("P0 import clip 1080p + thêm vào timeline", JSON.stringify(imp));
      throw new Error("không dựng được clip 1080p — dừng lượt");
    }

    // ---- GEO: dump hình học trước khi bấm (chẩn đoán T1) ----
    const geo = await cdp.evalJs(GEO_FN);
    log(`GEO: ${JSON.stringify(geo)}`);

    log(`GEO-DETAIL: ${JSON.stringify(await cdp.evalJs(GEO_FN))}`);
    // Thí nghiệm CSS trực tiếp trên trang (chưa sửa file): tìm thuộc
    // tính nào khôi phục chiều cao tự nhiên của card + cho grid cuộn.
    // (Source evaluate dựng bằng nối chuỗi, không dùng template literal lồng.)
    const expSrc = [
      "(function(){",
      "  var g = document.querySelector('.media-grid');",
      "  g.style.cssText = __STYLE__;",
      "  var card = Array.prototype.slice.call(document.querySelectorAll('.media-card'))",
      "    .find(function(c){ var n = c.querySelector('.media-name'); return n && n.textContent.trim() === 'clip1080p.mp4'; });",
      "  var btn = card && card.querySelector('.media-proxy');",
      "  var br = btn && btn.getBoundingClientRect();",
      "  var cr = card && card.getBoundingClientRect();",
      "  var cx = br ? br.left + br.width / 2 : 0, cy = br ? br.top + br.height / 2 : 0;",
      "  var top = document.elementFromPoint(cx, cy);",
      "  return { style: __STYLE__, gridScrollH: g.scrollHeight, gridClientH: g.clientHeight,",
      "    cardH: cr ? +cr.height.toFixed(1) : null, cardBottom: cr ? +cr.bottom.toFixed(1) : null,",
      "    btnY: br ? +br.top.toFixed(1) : null, btnH: br ? +br.height.toFixed(1) : null,",
      "    atPoint: top ? (top.className ? String(top.className).slice(0, 40) : top.tagName) : null };",
      "})()",
    ].join("\n");
    for (const style of ["grid-auto-rows: max-content", "align-content: normal", "grid-auto-rows: minmax(0, max-content)", "grid-auto-rows: min-content"]) {
      const expr = expSrc.split("__STYLE__").join(JSON.stringify(style));
      log("EXP " + style + " => " + JSON.stringify(await cdp.evalJs(expr)));
    }
    // Sau khi đặt max-content, cuộn nút vào giữa grid rồi đo lại hit-test.
    const scrollSrc = [
      "(async function(){",
      "  var g = document.querySelector('.media-grid');",
      "  g.style.cssText = 'grid-auto-rows: max-content';",
      "  var btn = Array.prototype.slice.call(document.querySelectorAll('.media-card'))",
      "    .find(function(c){ var n = c.querySelector('.media-name'); return n && n.textContent.trim() === 'clip1080p.mp4'; })",
      "    .querySelector('.media-proxy');",
      "  btn.scrollIntoView({ block: 'center' });",
      "  await new Promise(function(r){ requestAnimationFrame(function(){ requestAnimationFrame(r); }); });",
      "  var br = btn.getBoundingClientRect();",
      "  var cx = br.left + br.width / 2, cy = br.top + br.height / 2;",
      "  var top = document.elementFromPoint(cx, cy);",
      "  return { gridScrollTop: g.scrollTop, btnY: +br.top.toFixed(1),",
      "    atPoint: top ? (top.className ? String(top.className).slice(0, 40) : top.tagName) : null };",
      "})()",
    ].join("\n");
    log("EXP scrollIntoView => " + JSON.stringify(await cdp.evalJs(scrollSrc)));
  } catch (e) {
    harnessError = e;
    log(`HARNESS LỖI: ${e instanceof Error ? e.message : e}`);
  } finally {
    killAll();
  }
  const out = { results, harnessError: harnessError ? String(harnessError.message || harnessError) : null };
  writeFileEpermRetry(path.join(SCRATCH, "geo-result.json"), JSON.stringify(out, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "geo-log.txt"), logLines.join("\n") + "\n");
  process.exit(harnessError ? 2 : 0);
}

void main();
