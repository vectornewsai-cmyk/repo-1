#!/usr/bin/env node
/**
 * clicktest-60q7-idb-orphans.mjs — Phase 9 đợt 60, luồng Q7: dọn bytes
 * IndexedDB mồ côi khi xóa media khỏi bin + race debounce 5s
 * (đóng nợ đợt 59 P1 §5.1 + §5.2).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-59p1-bin-persist-toast.mjs
 * (HMR tắt bằng config tạm; profile Chrome mới tinh).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   Q0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item mau-1/mau-2.webm) → chờ autosave ghi xong
 *        (binMedia 2 entry) → đọc IndexedDB thật: cả 2 assetId đều có
 *        manifest + blob.
 *   Q1 xóa 2 clip video (chuột thật + Delete) → chờ autosave (srcs 0,
 *        binMedia vẫn 2) — để media thành bin-only, xóa khỏi bin sau
 *        đó không bị chặn theo tên.
 *   Q2 xóa chủ đích mau-1 khỏi bin (bấm ✕ thật, confirm tự accept) →
 *        bin còn mau-2, autosave binMedia còn 1 → đọc IndexedDB thật
 *        NGAY (chưa reload): assetId của mau-1 PHẢI hết cả manifest
 *        lẫn blob; assetId mau-2 còn nguyên.
 *   Q3 reload → bin vẫn 1 (mau-2), timeline 1 chữ, missing null →
 *        đọc IndexedDB thật sau reload: mau-1 vẫn hết, mau-2 còn
 *        (mau-1 không hồi lại nhờ manifest + bytes đều hết).
 *   H9 0 lỗi trang trong phiên (gộp qua reload).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-60q7-idb-orphans.mjs
 * Env: Q7_DEV_PORT (mặc định tự chọn 5590–5599), Q7_DEBUG_PORT (9690–9699),
 * Q7_DISPLAY (mặc định :172 — display RIÊNG của Q7), Q7_SCRATCH (mặc định
 * hidden_files/round60-q7/headed). TMPDIR riêng /tmp/round60-q7/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.Q7_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round60-q7", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round60-q7";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.q7.config.mjs");

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
  async click(x, y, modifiers = 0) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await sleep(400);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
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
  window.__q7errors = [];
  window.addEventListener("error", (e) => { try { window.__q7errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__q7errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__q7errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__q7errors.push("unhandledrejection: <?>"); } });
  window.__q7boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu 59P1): chỉ ĐỌC state, mọi thao tác
// dưới test đều là chuột/phím thật qua CDP.
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__q7storeMod || (window.__q7storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, trackKind: t.kind, clipId: c.id, kind: c.kind,
    start: +c.start.toFixed(3), duration: +c.duration.toFixed(3),
    src: c.src ?? null,
  });
  return {
    clips, clipCount: clips.length,
    videoClips: clips.filter((c) => c.trackId === "v1"),
    textClips: clips.filter((c) => c.trackId === "t1"),
    media: st.media.map((m) => ({
      name: m.name, kind: m.kind,
      hasFile: !!m.file, fileSize: m.file ? m.file.size : null,
      urlBlob: typeof m.url === "string" && m.url.startsWith("blob:"),
      assetId: m.assetId ?? null,
    })),
    mediaCount: st.media.length,
    missingAssets: st.missingAssets,
    mediaCards: document.querySelectorAll(".media-card").length,
    errors: (window.__q7errors || []).slice(),
  };
})()`;

const AUTOSAVE_FN = `(() => {
  const raw = localStorage.getItem("vcut-studio:autosave:v1");
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const srcs = [];
    for (const t of (d.spec && d.spec.tracks) || []) for (const c of t.clips || []) {
      if (c.src) srcs.push(c.src);
    }
    return { savedAt: d.savedAt || null, name: d.name || null, srcs,
      binMedia: Array.isArray(d.binMedia) ? d.binMedia : null };
  } catch (e) { return { error: String(e) }; }
})()`;

// Đọc thẳng IndexedDB thật của app (db vcut-studio-assets): manifest +
// key của blob store. Không qua AssetStore — đo đúng bytes còn hay hết.
const IDB_FN = `(async () => {
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open("vcut-studio-assets", 1);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error || new Error("open IDB thất bại"));
  });
  try {
    const tx = db.transaction(["manifests", "blobs"], "readonly");
    const manifests = await new Promise((res, rej) => {
      const r = tx.objectStore("manifests").getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const blobKeys = await new Promise((res, rej) => {
      const r = tx.objectStore("blobs").getAllKeys();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return {
      manifests: manifests.map((m) => ({ assetId: m.assetId, originalName: m.originalName, size: m.size })),
      blobKeys,
    };
  } finally { db.close(); }
})()`;

const TOASTS_FN = `[...document.querySelectorAll(".toast-msg")].map((e) => e.textContent || "")`;

const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

// Tọa độ nút ✕ (media-remove) của card có tên cho trước.
const REMOVE_BTN_BY_NAME_FN = `(name) => {
  const btns = [...document.querySelectorAll(".media-remove")];
  for (const b of btns) {
    const card = b.closest(".media-card");
    const n = card ? (card.querySelector(".media-name") || {}).textContent : null;
    if (n === name) {
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, name: n, count: btns.length };
    }
  }
  return null;
}`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }

  async function afterReload(cdp) {
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount lại sau reload (topbar có VCut Studio, splash đã tắt)", 240000);
    const boot = await cdp.evalJs(`window.__q7boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function bootOk(cdp, boot) {
    return (await cdp.evalJs(`window.__q7boot`).catch(() => null)) === boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__q7errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__q7errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.Q7_DEV_PORT || 0) || (await pickFreePort(5590, 5599));
    const DEBUG_PORT = Number(process.env.Q7_DEBUG_PORT || 0) || (await pickFreePort(9690, 9699));
    const DISPLAY = process.env.Q7_DISPLAY || ":172";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5590–5599");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9690–9699");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (Q7 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round60-q7/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "q7-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "q7-chrome.log"), "w");
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
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");

    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- Q0: mẫu tự load + autosave binMedia 2 + IDB đủ 2 asset ----
    const t0 = Date.now();
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
    }, "project mẫu tự load (3 clip, media bin 2 item)", 180000);
    const loadMs = Date.now() - t0;
    const auto0 = await cdp.waitFor(async () => {
      const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
      return a && a.srcs && a.srcs.includes("mau-1.webm") && a.srcs.includes("mau-2.webm")
        && Array.isArray(a.binMedia) && a.binMedia.length === 2 ? a : null;
    }, "autosave ghi xong (envelope chứa mau-1/mau-2.webm + binMedia 2 entry)", 60000);
    const idb0 = await cdp.evalJs(IDB_FN);
    const a1 = s0.media.find((m) => m.name === "mau-1.webm")?.assetId ?? null;
    const a2 = s0.media.find((m) => m.name === "mau-2.webm")?.assetId ?? null;
    const idb0ok = a1 && a2
      && idb0.manifests.some((m) => m.assetId === a1)
      && idb0.manifests.some((m) => m.assetId === a2)
      && idb0.blobKeys.includes(a1) && idb0.blobKeys.includes(a2);
    await drainErrors(cdp);
    log(`Q0: load mẫu ${loadMs}ms; assetId mau-1=${a1}, mau-2=${a2}; IDB manifests=${JSON.stringify(idb0.manifests)}, blobKeys=${JSON.stringify(idb0.blobKeys)}`);
    if (idb0ok && s0.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob)) {
      pass("Q0 setup: mẫu tự load + IDB đủ bytes 2 asset", `3 clip, bin 2 item (file thật ${s0.media.map((m) => m.fileSize).join("/")} byte), autosave binMedia 2 entry, IDB manifests ${idb0.manifests.length} + blobs ${idb0.blobKeys.length}`);
    } else {
      fail("Q0 setup: mẫu tự load + IDB đủ bytes 2 asset", `media=${JSON.stringify(s0.media)}, autosave=${JSON.stringify(auto0)}, idb=${JSON.stringify(idb0)}`);
    }
    await cdp.shot("q7-q0-sample-loaded.png");

    // ---- Q1: xóa 2 clip video → media thành bin-only ----
    {
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const vs = g.clips.filter((c) => c.trackId === "v1");
      if (vs.length < 2) throw new Error("không đủ 2 clip video (Q1)");
      await cdp.click(vs[0].rect.cx, vs[0].rect.cy);
      await cdp.click(vs[1].rect.cx, vs[1].rect.cy, 8); // Shift+click
      await cdp.key("Delete", "Delete");
      await sleep(600);
      const sDel = await cdp.evalJs(STATE_FN);
      const deletedOk = sDel.videoClips.length === 0 && sDel.textClips.length === 1;
      const autoDel = await cdp.waitFor(async () => {
        const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
        return a && a.srcs && a.srcs.length === 0 && Array.isArray(a.binMedia) && a.binMedia.length === 2 ? a : null;
      }, "autosave ghi xong trạng thái đã xóa (0 src video, binMedia vẫn 2)", 60000);
      await drainErrors(cdp);
      if (deletedOk) {
        pass("Q1 xóa 2 clip video: media thành bin-only", `timeline chỉ còn 1 clip chữ, autosave srcs=0 + binMedia vẫn 2 entry (savedAt=${autoDel.savedAt})`);
      } else {
        fail("Q1 xóa 2 clip video: media thành bin-only", `video=${JSON.stringify(sDel.videoClips)}`);
      }
      await cdp.shot("q7-q1-clips-deleted.png");
    }

    // ---- Q2: bấm ✕ xóa mau-1 khỏi bin → IDB hết bytes mau-1 NGAY ----
    {
      await ensureNoModal(cdp);
      const btn = await cdp.evalJs(`(${REMOVE_BTN_BY_NAME_FN})("mau-1.webm")`);
      if (!btn) throw new Error("không tìm thấy nút ✕ của card mau-1.webm (Q2)");
      log(`Q2: bấm ✕ trên card "${btn.name}" tại (${btn.x.toFixed(0)}, ${btn.y.toFixed(0)})`);
      await cdp.click(btn.x, btn.y);
      await sleep(800);
      const toasts2 = await cdp.evalJs(TOASTS_FN).catch(() => []);
      const s2 = await cdp.evalJs(STATE_FN);
      const auto2 = await cdp.waitFor(async () => {
        const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
        return a && Array.isArray(a.binMedia) && a.binMedia.length === 1 ? a : null;
      }, "autosave ghi xong sau khi xóa khỏi bin (binMedia còn 1)", 60000);
      // Bytes xóa fire-and-forget (không await) nên poll tới khi IDB thật sự hết.
      const idb2 = await cdp.waitFor(async () => {
        const d = await cdp.evalJs(IDB_FN).catch(() => null);
        if (!d) return null;
        const gone = !d.manifests.some((m) => m.assetId === a1) && !d.blobKeys.includes(a1);
        return gone ? d : null;
      }, "IndexedDB hết manifest + blob của mau-1 (mau-2 còn nguyên)", 30000);
      const mau2ok = idb2.manifests.some((m) => m.assetId === a2) && idb2.blobKeys.includes(a2);
      await drainErrors(cdp);
      log(`Q2: sau khi bấm ✕: media=${JSON.stringify(s2.media.map((m) => m.name))}, toasts=${JSON.stringify(toasts2)}, binMedia=${JSON.stringify(auto2.binMedia)}, IDB manifests=${JSON.stringify(idb2.manifests)}, blobKeys=${JSON.stringify(idb2.blobKeys)}`);
      if (s2.mediaCount === 1 && s2.media[0].name === "mau-2.webm" && mau2ok) {
        pass("Q2 xóa mau-1 khỏi bin: bytes biến mất khỏi IndexedDB thật", `bin còn mau-2, autosave binMedia 1 entry, IDB không còn manifest/blob của ${a1} (mau-1), mau-2 (${a2}) còn nguyên manifest + blob`);
      } else {
        fail("Q2 xóa mau-1 khỏi bin: bytes biến mất khỏi IndexedDB thật", `media=${JSON.stringify(s2.media)}, idb=${JSON.stringify(idb2)}`);
      }
      await cdp.shot("q7-q2-bin-deleted.png");
    }

    // ---- Q3: reload → bin vẫn 1 (mau-2), IDB vẫn hết mau-1 ----
    {
      const t3 = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot3 = await afterReload(cdp);
      const s3 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 1 && t.mediaCount === 1 ? t : null;
      }, "sau reload: timeline 1 clip chữ + media bin 1 item", 120000);
      const reloadMs = Date.now() - t3;
      const bootStable3 = await bootOk(cdp, boot3);
      const idb3 = await cdp.evalJs(IDB_FN);
      const mau1Gone = !idb3.manifests.some((m) => m.assetId === a1) && !idb3.blobKeys.includes(a1);
      const mau2ok = idb3.manifests.some((m) => m.assetId === a2) && idb3.blobKeys.includes(a2);
      await drainErrors(cdp);
      log(`Q3: reload ${reloadMs}ms; boot ổn định=${bootStable3}; IDB manifests=${JSON.stringify(idb3.manifests)}, blobKeys=${JSON.stringify(idb3.blobKeys)}`);
      if (bootStable3 && s3.mediaCount === 1 && s3.media[0].name === "mau-2.webm"
        && s3.textClips.length === 1 && s3.missingAssets === null && mau1Gone && mau2ok) {
        pass("Q3 reload: mau-1 không hồi lại, mau-2 còn nguyên", `bin vẫn 1 item mau-2 (file thật, blob: URL), timeline 1 chữ, missingAssets=null, IDB sau reload vẫn không có manifest/blob của mau-1, mau-2 còn nguyên; reload ${reloadMs}ms`);
      } else {
        fail("Q3 reload: mau-1 không hồi lại, mau-2 còn nguyên", `boot ổn định=${bootStable3}, media=${JSON.stringify(s3.media)}, missing=${JSON.stringify(s3.missingAssets)}, idb=${JSON.stringify(idb3)}`);
      }
      await cdp.shot("q7-q3-after-reload.png");
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 1 lần reload)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "q7-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED Q7: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
