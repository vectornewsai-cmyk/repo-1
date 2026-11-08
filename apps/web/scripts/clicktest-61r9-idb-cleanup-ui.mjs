#!/usr/bin/env node
/**
 * clicktest-61r9-idb-cleanup-ui.mjs — Phase 9 đợt 61, luồng R9: UI dọn kho
 * IndexedDB + refCount thật (đóng nợ đợt 60 §5.9 = LIMITS 60 Q7 §5.1 + §5.5).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-60q7-idb-orphans.mjs (HMR tắt bằng
 * config tạm; profile Chrome mới tinh).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   R0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item mau-1/mau-2.webm) → chờ autosave ghi xong
 *        (binMedia 2 entry) → đọc IndexedDB thật: cả 2 assetId đều có
 *        manifest + blob.
 *   R1 tạo bytes mồ côi "từ trước đợt 60": ghi thẳng 1 manifest + blob
 *        vào IndexedDB thật bằng API IDB thô trong trang (tên
 *        cu-xoa-truoc.webm, 4321 byte, refCount 0, không bin item/clip
 *        nào tham chiếu) → IDB có 3 manifest.
 *   R2 mở panel "Dọn kho" (bấm nút thật) → panel liệt kê 3 mục: mục mồ
 *        côi hiện tên + dung lượng, checkbox chọn được; mau-1/mau-2
 *        hiện "đang dùng", checkbox bị khóa (không cho chọn).
 *   R3 đọc IndexedDB thật sau quét: refCount của mau-1/mau-2 ≥ 1 (lần
 *        quét đã đồng bộ), của mục mồ côi = 0.
 *   R4 tick chọn mục mồ côi + bấm xóa thật (confirm tự accept) → IDB
 *        hết manifest + blob của mục đó NGAY, mau-1/mau-2 còn nguyên,
 *        panel quét lại không còn hàng đó, bin vẫn 2 item.
 *   R5 reload → bin vẫn 2, timeline 3 clip, missing null → IDB sau
 *        reload: mục mồ côi vẫn hết, mau-1/mau-2 còn nguyên.
 *   H9 0 lỗi trang trong phiên (gộp qua reload).
 *
 * LƯU Ý: key i18n `storageCleanup.*` nằm ở fragment
 * hidden_files/round61-r9-fragment.json, parent gộp vào dict ở cuối đợt
 * 61 — trước lúc gộp, `t()` trả về chính key nên harness KHÔNG assert
 * theo nhãn chữ mà assert theo data-testid / tên file / dung lượng /
 * trạng thái data-in-use (dữ liệu thật, không phụ thuộc chuỗi).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-61r9-idb-cleanup-ui.mjs
 * Env: R9_DEV_PORT (mặc định tự chọn 5610–5619), R9_DEBUG_PORT (9710–9719),
 * R9_DISPLAY (mặc định :173 — display RIÊNG của R9), R9_SCRATCH (mặc định
 * hidden_files/round61-r9/headed). TMPDIR riêng /tmp/round61-r9/tmp.
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
const SCRATCH = process.env.R9_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r9", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round61-r9";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r9.config.mjs");

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
  window.__r9errors = [];
  window.addEventListener("error", (e) => { try { window.__r9errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r9errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r9errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r9errors.push("unhandledrejection: <?>"); } });
  window.__r9boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu 59P1): chỉ ĐỌC state, mọi thao tác
// dưới test đều là chuột/phím thật qua CDP.
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r9storeMod || (window.__r9storeMod = await import(hit));
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
    errors: (window.__r9errors || []).slice(),
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
// key của blob store + refCount từng manifest. Không qua AssetStore —
// đo đúng bytes còn hay hết và refCount thật trong kho.
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
      manifests: manifests.map((m) => ({ assetId: m.assetId, originalName: m.originalName, size: m.size, refCount: m.refCount ?? null })),
      blobKeys,
    };
  } finally { db.close(); }
})()`;

// Ghi thẳng 1 manifest + blob mồ côi "từ trước đợt 60" vào IndexedDB
// thật bằng API IDB thô (không qua AssetStore — mô phỏng bytes còn sót
// từ khi chưa có dọn dẹp). sha256 giả nhưng duy nhất trong index.
const ORPHAN_FN = `(async () => {
  const assetId = "a_61r9orphan000001";
  const blob = new Blob(["x".repeat(4321)], { type: "video/webm" });
  const manifest = {
    assetId,
    originalName: "cu-xoa-truoc.webm",
    sha256: "00000000000000000000000000000000000000000000000000000000000061e9",
    size: 4321,
    mimeType: "video/webm",
    kind: "video",
    ingestedAt: new Date(Date.now() - 86400000).toISOString(),
    refCount: 0,
  };
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open("vcut-studio-assets", 1);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error || new Error("open IDB thất bại"));
  });
  try {
    await new Promise((res, rej) => {
      const tx = db.transaction(["manifests", "blobs"], "readwrite");
      const putM = tx.objectStore("manifests").put(manifest);
      const putB = tx.objectStore("blobs").put(blob, assetId);
      let done = 0;
      const check = () => { if (++done === 2) res(true); };
      putM.onsuccess = check;
      putB.onsuccess = check;
      putM.onerror = () => rej(putM.error);
      putB.onerror = () => rej(putB.error);
      tx.onerror = () => rej(tx.error);
    });
    return { assetId, size: 4321 };
  } finally { db.close(); }
})()`;

// Tọa độ phần tử theo selector (để bấm chuột thật qua CDP).
const GEOM_BY_SELECTOR_FN = `(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: +(b.left + b.width / 2).toFixed(1), y: +(b.top + b.height / 2).toFixed(1),
    w: +b.width.toFixed(1), h: +b.height.toFixed(1), disabled: !!el.disabled };
}`;

// Trạng thái panel dọn kho: các hàng (assetId, tên, dung lượng hiển thị,
// đang dùng hay mồ côi, checkbox có bị khóa không) + có nút xóa không.
const PANEL_FN = `(() => {
  const panel = document.querySelector('[data-testid="storage-cleanup-panel"]');
  if (!panel) return null;
  const rows = [...panel.querySelectorAll('[data-testid="storage-cleanup-row"]')].map((li) => {
    const box = li.querySelector('input[type="checkbox"]');
    return {
      assetId: li.dataset.assetId, inUse: li.dataset.inUse === "1",
      text: li.textContent || "",
      checkboxDisabled: box ? !!box.disabled : null,
      checkboxChecked: box ? !!box.checked : null,
    };
  });
  const delBtn = panel.querySelector('[data-testid="storage-cleanup-delete-selected"]');
  return {
    rows,
    orphanRows: rows.filter((r) => !r.inUse).length,
    inUseRows: rows.filter((r) => r.inUse).length,
    deleteDisabled: delBtn ? !!delBtn.disabled : null,
    hasResult: !!panel.querySelector('[data-testid="storage-cleanup-result"]'),
  };
})()`;

const TOASTS_FN = `[...document.querySelectorAll(".toast-msg")].map((e) => e.textContent || "")`;

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
    const boot = await cdp.evalJs(`window.__r9boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function bootOk(cdp, boot) {
    return (await cdp.evalJs(`window.__r9boot`).catch(() => null)) === boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r9errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r9errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.R9_DEV_PORT || 0) || (await pickFreePort(5610, 5619));
    const DEBUG_PORT = Number(process.env.R9_DEBUG_PORT || 0) || (await pickFreePort(9710, 9719));
    const DISPLAY = process.env.R9_DISPLAY || ":173";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5610–5619");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9710–9719");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (R9 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round61-r9/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r9-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r9-chrome.log"), "w");
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

    // ---- R0: mẫu tự load + autosave binMedia 2 + IDB đủ 2 asset ----
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
    log(`R0: load mẫu ${loadMs}ms; assetId mau-1=${a1}, mau-2=${a2}; IDB manifests=${JSON.stringify(idb0.manifests)}, blobKeys=${JSON.stringify(idb0.blobKeys)}`);
    if (idb0ok && s0.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob)) {
      pass("R0 setup: mẫu tự load + IDB đủ bytes 2 asset", `3 clip, bin 2 item (file thật ${s0.media.map((m) => m.fileSize).join("/")} byte), autosave binMedia 2 entry, IDB manifests ${idb0.manifests.length} + blobs ${idb0.blobKeys.length}`);
    } else {
      fail("R0 setup: mẫu tự load + IDB đủ bytes 2 asset", `media=${JSON.stringify(s0.media)}, autosave=${JSON.stringify(auto0)}, idb=${JSON.stringify(idb0)}`);
    }
    await cdp.shot("r9-r0-sample-loaded.png");

    // ---- R1: ghi thẳng 1 manifest + blob mồ côi "từ trước đợt 60" vào IDB thật ----
    const ORPHAN_ID = "a_61r9orphan000001";
    {
      const put = await cdp.evalJs(ORPHAN_FN);
      const idb1 = await cdp.evalJs(IDB_FN);
      const orphanOk = put && put.assetId === ORPHAN_ID && put.size === 4321
        && idb1.manifests.some((m) => m.assetId === ORPHAN_ID && m.size === 4321 && m.refCount === 0)
        && idb1.blobKeys.includes(ORPHAN_ID)
        && idb1.manifests.length === 3 && idb1.blobKeys.length === 3;
      await drainErrors(cdp);
      log(`R1: orphan đã ghi: ${JSON.stringify(put)}; IDB manifests=${JSON.stringify(idb1.manifests)}, blobKeys=${JSON.stringify(idb1.blobKeys)}`);
      if (orphanOk) {
        pass("R1 tạo bytes mồ côi từ trước đợt 60 trong IndexedDB thật", `manifest + blob cu-xoa-truoc.webm 4321 byte (refCount 0) đã có trong IDB; tổng 3 manifest + 3 blob`);
      } else {
        fail("R1 tạo bytes mồ côi từ trước đợt 60 trong IndexedDB thật", `put=${JSON.stringify(put)}, idb=${JSON.stringify(idb1)}`);
      }
    }

    // ---- R2: mở panel Dọn kho → liệt kê đúng 3 mục, mồ côi chọn được, đang dùng bị khóa ----
    {
      await ensureNoModal(cdp);
      const btnGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-open"]')`);
      if (!btnGeom) throw new Error("không tìm thấy nút Dọn kho (R2)");
      await cdp.click(btnGeom.x, btnGeom.y);
      const panel = await cdp.waitFor(async () => {
        const p = await cdp.evalJs(PANEL_FN).catch(() => null);
        return p && p.rows.length === 3 ? p : null;
      }, "panel Dọn kho liệt kê đủ 3 mục", 60000);
      const orphanRow = panel.rows.find((r) => r.assetId === ORPHAN_ID);
      const inUseRows = panel.rows.filter((r) => r.inUse);
      const orphanRowOk = orphanRow && !orphanRow.inUse && orphanRow.checkboxDisabled === false
        && orphanRow.text.includes("cu-xoa-truoc.webm") && /4[.,]2/.test(orphanRow.text);
      const inUseOk = inUseRows.length === 2
        && inUseRows.every((r) => r.checkboxDisabled === true)
        && inUseRows.some((r) => r.text.includes("mau-1.webm"))
        && inUseRows.some((r) => r.text.includes("mau-2.webm"));
      await drainErrors(cdp);
      log(`R2: panel rows=${JSON.stringify(panel.rows)}, deleteDisabled=${panel.deleteDisabled}`);
      if (orphanRowOk && inUseOk && panel.deleteDisabled === true) {
        pass("R2 panel Dọn kho liệt kê đúng: mồ côi chọn được, đang dùng bị khóa", `3 hàng: cu-xoa-truoc.webm 4321 byte (4.22 KB, checkbox mở, chưa chọn nên nút xóa đang disabled), mau-1/mau-2 đang dùng (checkbox khóa)`);
      } else {
        fail("R2 panel Dọn kho liệt kê đúng: mồ côi chọn được, đang dùng bị khóa", `orphanRowOk=${orphanRowOk}, inUseOk=${inUseOk}, panel=${JSON.stringify(panel)}`);
      }
      await cdp.shot("r9-r2-cleanup-panel.png");
    }

    // ---- R3: refCount thật sau quét (mau-1/mau-2 ≥ 1, mồ côi = 0) ----
    {
      const idb3 = await cdp.evalJs(IDB_FN);
      const r1 = idb3.manifests.find((m) => m.assetId === a1)?.refCount;
      const r2 = idb3.manifests.find((m) => m.assetId === a2)?.refCount;
      const ro = idb3.manifests.find((m) => m.assetId === ORPHAN_ID)?.refCount;
      await drainErrors(cdp);
      log(`R3: refCount sau quét: mau-1=${r1}, mau-2=${r2}, orphan=${ro}`);
      if (typeof r1 === "number" && r1 >= 1 && typeof r2 === "number" && r2 >= 1 && ro === 0) {
        pass("R3 refCount thật sau quét: đang dùng ≥ 1, mồ côi = 0", `mau-1 refCount=${r1}, mau-2 refCount=${r2} (bin item + clip), cu-xoa-truoc refCount=0`);
      } else {
        fail("R3 refCount thật sau quét: đang dùng ≥ 1, mồ côi = 0", `idb=${JSON.stringify(idb3.manifests)}`);
      }
    }

    // ---- R4: tick chọn mục mồ côi + bấm xóa thật → IDB hết bytes đó, mau-1/mau-2 còn nguyên ----
    // KHÔNG gọi ensureNoModal ở đây: panel dọn kho đang mở cũng là
    // .modal-backdrop, ensureNoModal sẽ bấm Escape đóng mất panel.
    {
      const boxGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-check-${ORPHAN_ID}"]')`);
      if (!boxGeom || boxGeom.disabled) throw new Error("không tìm thấy checkbox của mục mồ côi (R4)");
      await cdp.click(boxGeom.x, boxGeom.y);
      const checked = await cdp.evalJs(PANEL_FN);
      if (!checked || checked.deleteDisabled !== false) throw new Error(`sau khi tick, nút xóa vẫn disabled (R4): ${JSON.stringify(checked)}`);
      const delGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-delete-selected"]')`);
      if (!delGeom) throw new Error("không tìm thấy nút Xóa đã chọn (R4)");
      await cdp.click(delGeom.x, delGeom.y); // confirm tự accept qua CDP
      await sleep(800);
      const toasts4 = await cdp.evalJs(TOASTS_FN).catch(() => []);
      // Xóa + quét lại đều async nên poll tới khi IDB thật sự hết.
      const idb4 = await cdp.waitFor(async () => {
        const d = await cdp.evalJs(IDB_FN).catch(() => null);
        if (!d) return null;
        const gone = !d.manifests.some((m) => m.assetId === ORPHAN_ID) && !d.blobKeys.includes(ORPHAN_ID);
        return gone ? d : null;
      }, "IndexedDB hết manifest + blob của mục mồ côi (mau-1/mau-2 còn nguyên)", 30000);
      const kept = idb4.manifests.some((m) => m.assetId === a1) && idb4.manifests.some((m) => m.assetId === a2)
        && idb4.blobKeys.includes(a1) && idb4.blobKeys.includes(a2);
      const panel4 = await cdp.waitFor(async () => {
        const p = await cdp.evalJs(PANEL_FN).catch(() => null);
        return p && p.rows.length === 2 && !p.rows.some((r) => r.assetId === ORPHAN_ID) ? p : null;
      }, "panel quét lại còn 2 mục, không còn hàng mồ côi", 30000);
      const s4 = await cdp.evalJs(STATE_FN);
      await drainErrors(cdp);
      log(`R4: sau khi xóa: toasts=${JSON.stringify(toasts4)}, IDB manifests=${JSON.stringify(idb4.manifests)}, blobKeys=${JSON.stringify(idb4.blobKeys)}, panel rows=${panel4.rows.length}, bin=${s4.mediaCount}`);
      if (kept && panel4.hasResult && s4.mediaCount === 2) {
        pass("R4 xóa mục mồ côi thật: bytes biến mất khỏi IndexedDB, đang dùng còn nguyên", `IDB hết manifest/blob của ${ORPHAN_ID}, mau-1/mau-2 còn nguyên manifest + blob, panel còn 2 hàng đang dùng, bin vẫn 2 item`);
      } else {
        fail("R4 xóa mục mồ côi thật: bytes biến mất khỏi IndexedDB, đang dùng còn nguyên", `kept=${kept}, hasResult=${panel4.hasResult}, media=${JSON.stringify(s4.media)}, idb=${JSON.stringify(idb4)}`);
      }
      await cdp.shot("r9-r4-orphan-deleted.png");
      // Đóng panel trước khi reload (Escape — panel tự xử lý).
      await cdp.key("Escape", "Escape");
      await sleep(600);
    }

    // ---- R5: reload → bin vẫn 2, IDB vẫn hết mục mồ côi ----
    {
      const t5 = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot5 = await afterReload(cdp);
      const s5 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
      }, "sau reload: timeline 3 clip + media bin 2 item", 120000);
      const reloadMs = Date.now() - t5;
      const bootStable5 = await bootOk(cdp, boot5);
      const idb5 = await cdp.evalJs(IDB_FN);
      const orphanGone = !idb5.manifests.some((m) => m.assetId === ORPHAN_ID) && !idb5.blobKeys.includes(ORPHAN_ID);
      const kept = idb5.manifests.some((m) => m.assetId === a1) && idb5.manifests.some((m) => m.assetId === a2)
        && idb5.blobKeys.includes(a1) && idb5.blobKeys.includes(a2);
      await drainErrors(cdp);
      log(`R5: reload ${reloadMs}ms; boot ổn định=${bootStable5}; IDB manifests=${JSON.stringify(idb5.manifests)}, blobKeys=${JSON.stringify(idb5.blobKeys)}`);
      if (bootStable5 && s5.mediaCount === 2 && s5.missingAssets === null && orphanGone && kept) {
        pass("R5 reload: mục mồ côi không hồi lại, mau-1/mau-2 còn nguyên", `bin vẫn 2 item (file thật), timeline 3 clip, missingAssets=null, IDB sau reload vẫn không có manifest/blob của ${ORPHAN_ID}; reload ${reloadMs}ms`);
      } else {
        fail("R5 reload: mục mồ côi không hồi lại, mau-1/mau-2 còn nguyên", `boot ổn định=${bootStable5}, media=${JSON.stringify(s5.media)}, missing=${JSON.stringify(s5.missingAssets)}, idb=${JSON.stringify(idb5)}`);
      }
      await cdp.shot("r9-r5-after-reload.png");
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 1 lần reload)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "r9-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED R9: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
