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
  const r = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      position: cs.position, zIndex: cs.zIndex, transform: cs.transform === "none" ? null : cs.transform.slice(0, 40) };
  };
  const btn = [...document.querySelectorAll(".media-proxy")].map((el) => {
    const b = el.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const stack = document.elementsFromPoint(cx, cy).slice(0, 4)
      .map((e) => e.tagName + "." + String(e.className).split(" ")[0]);
    return { text: el.textContent.trim(), x: +cx.toFixed(1), y: +cy.toFixed(1),
      w: +b.width.toFixed(1), h: +b.height.toFixed(1), atPoint: stack };
  });
  const grid = document.querySelector(".media-grid");
  return {
    innerW: window.innerWidth, innerH: window.innerHeight,
    docScrollH: document.documentElement.scrollHeight,
    docScrollTop: document.documentElement.scrollTop,
    bodyScrollH: document.body ? document.body.scrollHeight : null,
    app: r(".app"), topbar: r(".topbar"), editorMain: r(".editor-main"),
    mediabin: r(".mediabin"), mediaGrid: r(".media-grid"),
    gridScroll: grid ? { scrollTop: grid.scrollTop, scrollHeight: grid.scrollHeight, clientHeight: grid.clientHeight } : null,
    timeline: r(".timeline"), tlToolbar: r(".tl-toolbar"),
    proxyButtons: btn,
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
// Người dùng thật phải cuộn MediaBin tới nút khi nó nằm dưới nếp gấp
// (grid cuộn được sau sửa K7: card giữ chiều cao tự nhiên, grid
// scrollH > clientH) — harness cuộn trước rồi mới đo tọa độ + bấm,
// y hệt thao tác người dùng. Trả về atPoint + text nút trước/sau.
async function clickProxyReal(cdp) {
  const found = await cdp.evalJs(`(() => {
    const cards = [...document.querySelectorAll(".media-card")];
    const card = cards.find((c) => c.querySelector(".media-name")?.textContent?.trim() === "clip1080p.mp4");
    const b = card?.querySelector(".media-proxy");
    if (!b) return null;
    b.scrollIntoView({ block: "center" });
    return true;
  })()`);
  if (!found) throw new Error("không thấy nút .media-proxy của clip1080p.mp4");
  await sleep(400);
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
  if (!info) throw new Error("không thấy nút .media-proxy của clip1080p.mp4 sau khi cuộn");
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

    // ---- T1: bấm nút Proxy bằng chuột THẬT (CDP), chờ proxyUrl ----
    const click1 = await clickProxyReal(cdp);
    log(`T1 click thật nút proxy: ${JSON.stringify(click1)}`);
    const withProxy = await waitProxyUrl(cdp, 90000);
    if (withProxy) {
      pass("T1 click chuột thật tới nút Proxy tạo được proxy",
        `atPoint=${JSON.stringify(click1.atPoint)} text "${click1.btnTextBefore}" → "${click1.btnTextAfter}", proxyUrl=${withProxy.proxyUrl}`);
    } else {
      fail("T1 click chuột thật tới nút Proxy tạo được proxy",
        `atPoint=${JSON.stringify(click1.atPoint)} text "${click1.btnTextBefore}" → "${click1.btnTextAfter}", không thấy proxyUrl sau 90 s`);
      // Dựng proxy bằng .click() trong trang để còn chạy tiếp T2 (ghi rõ
      // là đường vòng, không tính là pass T1).
      const fb = await cdp.evalJs(`(() => {
        const cards = [...document.querySelectorAll(".media-card")];
        const card = cards.find((c) => c.querySelector(".media-name")?.textContent?.trim() === "clip1080p.mp4");
        card?.querySelector(".media-proxy")?.click();
        return true;
      })()`);
      log(`T1 fallback .click() trong trang: ${fb}`);
      const fbProxy = await waitProxyUrl(cdp, 90000);
      if (!fbProxy) throw new Error("cả .click() trong trang cũng không tạo được proxy — dừng lượt");
      log(`T1 fallback tạo proxy: ${fbProxy.proxyUrl}`);
    }
    const proxyUrl1 = (withProxy || await cdp.evalJs(STORE_FN).then((s) => s.media.find((m) => m.name === "clip1080p.mp4"))).proxyUrl;
    const disk1 = proxyFileOnDisk(BRIDGE_WORK_DIR, proxyUrl1);
    log(`file proxy trên đĩa: ${JSON.stringify(disk1)}`);
    await sleep(1500);
    const man1 = await cdp.evalJs(MANIFEST_FN(imp.assetId));
    log(`manifest sau T1: ${JSON.stringify(man1)}`);

    // ---- T2a: XÓA file proxy khỏi đĩa (mô phỏng WORK_ROOT bị xóa tay) ----
    if (disk1.exists) {
      fs.unlinkSync(disk1.full);
      log(`đã xóa file proxy trên đĩa: ${disk1.full}`);
    } else {
      fail("T2a xóa file proxy khỏi đĩa", "không thấy file proxy để xóa");
      throw new Error("không thấy file proxy — dừng lượt");
    }
    const headAfterDelete = await fetch(proxyUrl1, { method: "HEAD" }).catch((e) => ({ status: `fetch lỗi: ${e.message}` }));
    log(`HEAD proxyUrl sau khi xóa file: status=${headAfterDelete.status}`);
    if (headAfterDelete.status === 404) pass("T2a file proxy đã xóa khỏi đĩa", `HEAD ${proxyUrl1} → 404`);
    else fail("T2a file proxy đã xóa khỏi đĩa", `HEAD trả ${headAfterDelete.status}, kỳ vọng 404`);

    // ---- T2b: RELOAD → item không giữ proxyUrl chết, báo stale, manifest sạch ----
    // Đợi autosave ghi spec (có clip) rồi reload.
    await cdp.waitFor(async () => {
      const v = await cdp.evalJs(`localStorage.getItem("vcut-studio:autosave:v1") || ""`).catch(() => "");
      return v.includes("clip1080p.mp4") ? v : null;
    }, "autosave chứa clip1080p.mp4", 60000).catch(() => null);
    await cdp.send("Page.navigate", { url: DEV_URL });
    const loaded2 = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll(".tl-clip").length`).catch(() => 0);
      return n >= 4 ? true : null;
    }, "project sau reload >= 4 clip", 180000).catch(() => false);
    if (!loaded2) throw new Error("sau reload: project không load (>= 4 clip) sau 180 s");
    await sleep(2500); // chờ rehydrate + kiểm tra proxy chạy xong
    const snapAfter = await cdp.evalJs(STORE_FN);
    const itemAfter = snapAfter.media.find((m) => m.name === "clip1080p.mp4");
    log(`sau reload: clip1080p=${JSON.stringify(itemAfter)}`);
    const manAfter = await cdp.evalJs(MANIFEST_FN(imp.assetId));
    log(`manifest sau reload: ${JSON.stringify(manAfter)}`);
    const btnAfter = await cdp.evalJs(`(() => {
      const cards = [...document.querySelectorAll(".media-card")];
      const card = cards.find((c) => c.querySelector(".media-name")?.textContent?.trim() === "clip1080p.mp4");
      return card?.querySelector(".media-proxy")?.textContent.trim() ?? null;
    })()`);
    log(`nút proxy sau reload: ${JSON.stringify(btnAfter)}`);
    if (itemAfter && !itemAfter.proxyUrl && itemAfter.proxyStale === true) {
      pass("T2b sau reload: proxy chết bị gỡ, item đánh dấu stale",
        `proxyUrl=null, proxyStale=true, nút=${JSON.stringify(btnAfter)}`);
    } else {
      fail("T2b sau reload: proxy chết bị gỡ, item đánh dấu stale",
        `item=${JSON.stringify(itemAfter)} nút=${JSON.stringify(btnAfter)}`);
    }
    if (manAfter && manAfter.proxyPath === null) {
      pass("T2c manifest đã xóa proxyPath chết", `proxyPath=null`);
    } else {
      fail("T2c manifest đã xóa proxyPath chết", JSON.stringify(manAfter));
    }

    // ---- T2d: bấm nút tạo lại bằng chuột THẬT → proxy mới ----
    const click2 = await clickProxyReal(cdp);
    log(`T2d click thật nút tạo lại: ${JSON.stringify(click2)}`);
    const withProxy2 = await waitProxyUrl(cdp, 90000);
    if (withProxy2 && withProxy2.proxyStale === false) {
      pass("T2d bấm tạo lại bằng chuột thật → proxy mới",
        `atPoint=${JSON.stringify(click2.atPoint)} text "${click2.btnTextBefore}" → "${click2.btnTextAfter}", proxyUrl=${withProxy2.proxyUrl}, proxyStale=false`);
    } else {
      fail("T2d bấm tạo lại bằng chuột thật → proxy mới", `click=${JSON.stringify(click2)} item=${JSON.stringify(withProxy2)}`);
    }
    const proxyUrl2 = withProxy2?.proxyUrl;
    if (proxyUrl2) {
      const disk2 = proxyFileOnDisk(BRIDGE_WORK_DIR, proxyUrl2);
      const man2 = await cdp.evalJs(MANIFEST_FN(imp.assetId));
      log(`file proxy mới trên đĩa: ${JSON.stringify(disk2)}; manifest: ${JSON.stringify(man2)}`);
      if (disk2.exists && man2 && man2.proxyPath) {
        pass("T2e file proxy mới + manifest cập nhật", `file ${disk2.name} size=${disk2.size}, manifest proxyPath=${man2.proxyPath}`);
      } else {
        fail("T2e file proxy mới + manifest cập nhật", `disk=${JSON.stringify(disk2)} manifest=${JSON.stringify(man2)}`);
      }
    }

    // ---- T2f: RELOAD lần nữa khi file proxy CÒN → proxy được GIỮ ----
    // (đường alive: không gỡ oan — hồi quy cho logic "chỉ 404 mới stale").
    await cdp.send("Page.navigate", { url: DEV_URL });
    const loaded3 = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll(".tl-clip").length`).catch(() => 0);
      return n >= 4 ? true : null;
    }, "project sau reload lần 2 >= 4 clip", 180000).catch(() => false);
    if (!loaded3) throw new Error("sau reload lần 2: project không load (>= 4 clip) sau 180 s");
    await sleep(2500);
    const snapAfter2 = await cdp.evalJs(STORE_FN);
    const itemAfter2 = snapAfter2.media.find((m) => m.name === "clip1080p.mp4");
    const manAfter2 = await cdp.evalJs(MANIFEST_FN(imp.assetId));
    const btnAfter2 = await cdp.evalJs(`(() => {
      const cards = [...document.querySelectorAll(".media-card")];
      const card = cards.find((c) => c.querySelector(".media-name")?.textContent?.trim() === "clip1080p.mp4");
      return card?.querySelector(".media-proxy")?.textContent.trim() ?? null;
    })()`);
    log(`sau reload lần 2: clip1080p=${JSON.stringify(itemAfter2)} manifest=${JSON.stringify(manAfter2)} nút=${JSON.stringify(btnAfter2)}`);
    if (itemAfter2 && itemAfter2.proxyUrl === proxyUrl2 && itemAfter2.proxyStale === false
      && manAfter2 && manAfter2.proxyPath && /✓ PROXY 720p/.test(btnAfter2 || "")) {
      pass("T2f reload khi file còn: proxy được giữ, không gỡ oan",
        `proxyUrl=${itemAfter2.proxyUrl}, proxyStale=false, manifest proxyPath=${manAfter2.proxyPath}, nút=${btnAfter2}`);
    } else {
      fail("T2f reload khi file còn: proxy được giữ, không gỡ oan",
        `item=${JSON.stringify(itemAfter2)} manifest=${JSON.stringify(manAfter2)} nút=${JSON.stringify(btnAfter2)}`);
    }

    // ---- T3: 0 lỗi console trong phiên ----
    const finalErrs = await cdp.evalJs(`(window.__k7errors || []).slice()`);
    if (finalErrs.length === 0 && cdp.exceptions.length === 0) {
      pass("T3 0 lỗi console trong phiên", "window errors 0, CDP exceptions 0");
    } else {
      fail("T3 0 lỗi console trong phiên", `window=${JSON.stringify(finalErrs)} cdp=${JSON.stringify(cdp.exceptions.slice(-2))}`);
    }
  } catch (e) {
    harnessError = e;
    log(`HARNESS LỖI: ${e instanceof Error ? e.message : e}`);
  } finally {
    killAll();
  }
  const out = { results, harnessError: harnessError ? String(harnessError.message || harnessError) : null };
  fs.writeFileSync(path.join(SCRATCH, "proxy-result.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(SCRATCH, "proxy-log.txt"), logLines.join("\n") + "\n");
  const fails = results.filter((r) => !r.ok).length;
  log(`đã ghi ${path.join(SCRATCH, "proxy-result.json")} — ${results.length - fails}/${results.length} PASS`);
  process.exit(harnessError ? 2 : fails > 0 ? 1 : 0);
}

void main();
