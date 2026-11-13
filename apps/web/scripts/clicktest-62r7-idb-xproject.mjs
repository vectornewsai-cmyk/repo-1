#!/usr/bin/env node
/**
 * clicktest-62r7-idb-xproject.mjs — Phase 9 đợt 62, luồng R7: sổ tham chiếu
 * liên project + chặn xóa liên project (đóng nợ đợt 61 R9 §5.1/§5.2/§5.8).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-61r9-idb-cleanup-ui.mjs (HMR tắt bằng
 * config tạm; profile Chrome mới tinh).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   X0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item mau-1/mau-2.webm) → autosave binMedia 2 entry →
 *        IDB thật: 2 manifest + 2 blob.
 *   X1 ghi sổ tự động: sau mount + effect App (debounce 1s + mount 1,5s),
 *        store `projectRefs` có 1 bản ghi cho project hiện tại, liệt kê
 *        đúng 2 assetId của mau-1/mau-2 (đường ghi thật, không seed tay).
 *   X2 locale en + seed project B: đặt localStorage vcut-lang=en, reload,
 *        ghi thẳng 1 manifest + blob mồ côi (4321 byte) + 1 bản ghi sổ
 *        cho "Dự án B" dùng đúng bytes mồ côi đó (mô phỏng project B đã
 *        mở/lưu trước đây trên trình duyệt này).
 *   X3 panel chặn liên project: nút "Select all orphaned items" hiện
 *        tiếng Anh (locale en, key đã gộp đợt 61); hàng mồ côi hiện
 *        data-used-by-other chứa "Dự án B", checkbox bị khóa; nút chọn
 *        tất cả bị disabled (0 mục mồ côi thật); mục sổ liệt kê 2 project
 *        (hiện tại + B), nút Quên của project hiện tại bị khóa.
 *   X4 quên project B bằng UI thật (bấm nút Quên + confirm) → sổ chỉ còn
 *        1 bản ghi, hàng mồ côi thành chọn được.
 *   X5 chọn tất cả + xóa thật: bấm nút "Select all orphaned items" thật
 *        → checkbox mồ côi được tick, nút xóa hiện "Delete selected (1)"
 *        → bấm xóa thật → IDB hết manifest + blob của mục đó, mau-1/
 *        mau-2 còn nguyên, bản ghi project hiện tại còn nguyên.
 *   X6 viewport 390px: đổi metrics 390×844, reload (check mount bằng
 *        topbar + fabbar vì topbar mobile ẩn tên "VCut Studio"), mở
 *        MediaBin bằng nút 📁 ở fabbar (mobile giấu MediaBin trong
 *        bottom-sheet), seed mồ côi thứ 2, mở panel → panel nằm gọn
 *        trong viewport (không tràn ngang), bấm chọn-tất-cả + xóa thật
 *        bằng chuột (scrollIntoView trước) → IDB hết bytes mồ côi thứ 2.
 *   X7 tab-sync (BroadcastChannel thật): seed mồ côi thứ 3 + project C
 *        dùng nó, mở panel (hàng bị khóa) → xóa bản ghi C bằng IDB thô
 *        rồi post {type:"refs-changed"} qua một BroadcastChannel khác
 *        trong cùng tab → panel TỰ quét lại (không bấm Quét lại), hàng
 *        thành chọn được. Chứng minh panel lắng nghe kênh liên tab thật.
 *   H9 0 lỗi trang trong phiên (gộp qua các lần reload).
 *
 * LƯU Ý: key i18n mới của R7 (`storageCleanup.usedByOther`,
 * `projectsTitle`, ...) nằm ở fragment hidden_files/round62-r7-fragment.json,
 * parent gộp vào dict ở cuối đợt 62 — trước lúc gộp, `t()` trả về chính key
 * nên harness KHÔNG assert theo nhãn chữ mới mà assert theo data-testid /
 * data-used-by-other / tên file / dung lượng. Riêng nút chọn-tất-cả và nút
 * xóa dùng key đã gộp từ đợt 61 nên assert được chuỗi tiếng Anh.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-62r7-idb-xproject.mjs
 * Env: R7_DEV_PORT (mặc định tự chọn 5620–5629), R7_DEBUG_PORT (9720–9729),
 * R7_DISPLAY (mặc định :174 — display RIÊNG của R7), R7_SCRATCH (mặc định
 * hidden_files/round62-r7/headed). TMPDIR riêng /tmp/round62-r7/tmp.
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
const SCRATCH = process.env.R7_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round62-r7", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round62-r7";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r7.config.mjs");

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
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__r7errors = [];
  window.addEventListener("error", (e) => { try { window.__r7errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r7errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r7errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r7errors.push("unhandledrejection: <?>"); } });
  window.__r7boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu 59P1): chỉ ĐỌC state, mọi thao tác
// dưới test đều là chuột/phím thật qua CDP.
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r7storeMod || (window.__r7storeMod = await import(hit));
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
    media: st.media.map((m) => ({
      name: m.name, kind: m.kind,
      hasFile: !!m.file, fileSize: m.file ? m.file.size : null,
      urlBlob: typeof m.url === "string" && m.url.startsWith("blob:"),
      assetId: m.assetId ?? null,
    })),
    mediaCount: st.media.length,
    missingAssets: st.missingAssets,
    mediaCards: document.querySelectorAll(".media-card").length,
    projectName: st.spec.meta.name,
    errors: (window.__r7errors || []).slice(),
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

// Đọc thẳng IndexedDB thật của app (db vcut-studio-assets, KHÔNG ghi
// version — DB đã lên v2 từ đợt 62 R7, open với version 1 sẽ ném
// VersionError): manifest + key blob store + refCount + bản ghi sổ
// tham chiếu liên project (store projectRefs). Không qua AssetStore —
// đo đúng bytes còn hay hết và sổ ghi gì.
const IDB_FN = `(async () => {
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open("vcut-studio-assets");
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error || new Error("open IDB thất bại"));
  });
  try {
    const tx = db.transaction(["manifests", "blobs", "projectRefs"], "readonly");
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
    const refs = await new Promise((res, rej) => {
      const r = tx.objectStore("projectRefs").getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return {
      manifests: manifests.map((m) => ({ assetId: m.assetId, originalName: m.originalName, size: m.size, refCount: m.refCount ?? null })),
      blobKeys,
      refs: refs.map((r) => ({ projectKey: r.projectKey, projectName: r.projectName, assetIds: r.assetIds, updatedAt: r.updatedAt })),
    };
  } finally { db.close(); }
})()`;

// Ghi thẳng 1 manifest + blob mồ côi + 1 bản ghi sổ cho project B vào
// IndexedDB thật bằng API IDB thô (không qua AssetStore — mô phỏng
// bytes còn sót từ trước + project B đã mở/lưu trước đây trên trình
// duyệt này). sha256 giả nhưng duy nhất trong index.
const SEED_FN = `(async (orphanId, orphanName, orphanSize, projKey, projName, projAssets, sha256) => {
  const blob = new Blob(["x".repeat(orphanSize)], { type: "video/webm" });
  const manifest = {
    assetId: orphanId,
    originalName: orphanName,
    sha256,
    size: orphanSize,
    mimeType: "video/webm",
    kind: "video",
    ingestedAt: new Date(Date.now() - 86400000).toISOString(),
    refCount: 0,
  };
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open("vcut-studio-assets");
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error || new Error("open IDB thất bại"));
  });
  try {
    await new Promise((res, rej) => {
      const tx = db.transaction(["manifests", "blobs", "projectRefs"], "readwrite");
      const putM = tx.objectStore("manifests").put(manifest);
      const putB = tx.objectStore("blobs").put(blob, orphanId);
      const putR = tx.objectStore("projectRefs").put({
        projectKey: projKey, projectName: projName,
        assetIds: projAssets, updatedAt: new Date().toISOString(),
      });
      let done = 0;
      const check = () => { if (++done === 3) res(true); };
      putM.onsuccess = check;
      putB.onsuccess = check;
      putR.onsuccess = check;
      putM.onerror = () => rej(putM.error);
      putB.onerror = () => rej(putB.error);
      putR.onerror = () => rej(putR.error);
      tx.onerror = () => rej(tx.error);
    });
    return { assetId: orphanId, size: orphanSize, projKey };
  } finally { db.close(); }
})`;

// Tọa độ phần tử theo selector (để bấm chuột thật qua CDP).
const GEOM_BY_SELECTOR_FN = `(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: +(b.left + b.width / 2).toFixed(1), y: +(b.top + b.height / 2).toFixed(1),
    w: +b.width.toFixed(1), h: +b.height.toFixed(1), disabled: !!el.disabled };
}`;

// Trạng thái panel dọn kho: các hàng (assetId, tên, dung lượng, đang
// dùng hay mồ côi, checkbox khóa không, project khác nào dùng) + nút
// chọn-tất-cả / xóa + mục sổ tham chiếu (từng project + nút Quên).
const PANEL_FN = `(() => {
  const panel = document.querySelector('[data-testid="storage-cleanup-panel"]');
  if (!panel) return null;
  const rows = [...panel.querySelectorAll('[data-testid="storage-cleanup-row"]')].map((li) => {
    const box = li.querySelector('input[type="checkbox"]');
    return {
      assetId: li.dataset.assetId, inUse: li.dataset.inUse === "1",
      usedByOther: li.dataset.usedByOther || "",
      text: li.textContent || "",
      checkboxDisabled: box ? !!box.disabled : null,
      checkboxChecked: box ? !!box.checked : null,
    };
  });
  const delBtn = panel.querySelector('[data-testid="storage-cleanup-delete-selected"]');
  const selBtn = panel.querySelector('[data-testid="storage-cleanup-select-orphans"]');
  const projSection = panel.querySelector('[data-testid="storage-cleanup-projects"]');
  const projects = projSection
    ? [...projSection.querySelectorAll('[data-testid="storage-cleanup-project-row"]')].map((li) => {
        const forgetBtn = li.querySelector('[data-testid="storage-cleanup-forget"]');
        return {
          key: li.dataset.projectKey, text: li.textContent || "",
          forgetDisabled: forgetBtn ? !!forgetBtn.disabled : null,
        };
      })
    : [];
  const rect = panel.getBoundingClientRect();
  return {
    rows,
    orphanRows: rows.filter((r) => !r.inUse).length,
    inUseRows: rows.filter((r) => r.inUse).length,
    deleteDisabled: delBtn ? !!delBtn.disabled : null,
    deleteLabel: delBtn ? (delBtn.textContent || "") : null,
    selectDisabled: selBtn ? !!selBtn.disabled : null,
    selectLabel: selBtn ? (selBtn.textContent || "") : null,
    hasResult: !!panel.querySelector('[data-testid="storage-cleanup-result"]'),
    projects,
    rect: { left: +rect.left.toFixed(1), right: +rect.right.toFixed(1), width: +rect.width.toFixed(1) },
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
    const boot = await cdp.evalJs(`window.__r7boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function afterReloadMobile(cdp) {
    // Biến thể cho viewport mobile: topbar ở ≤768px ẨN tên "VCut Studio"
    // (CSS) nên check mount cũ (topbar chứa tên) không bao giờ đúng ở
    // 390px — check bằng topbar + fabbar mobile + splash đã tắt.
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const fab = !!document.querySelector('.m-fabbar'); return top && fab && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount lại sau reload 390px (topbar + fabbar, splash đã tắt)", 240000);
    const boot = await cdp.evalJs(`window.__r7boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r7errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r7errors = []`).catch(() => {});
    return e;
  }

  // Mở panel Dọn kho bằng nút thật; chờ panel liệt kê đủ n hàng.
  async function openPanel(cdp, expectRows, label) {
    await ensureNoModal(cdp);
    // Nút Dọn kho có thể nằm dưới nếp gấp ở viewport nhỏ: cuộn tới rồi mới bấm chuột thật.
    await cdp.evalJs(`document.querySelector('[data-testid="storage-cleanup-open"]')?.scrollIntoView({ block: "nearest" })`).catch(() => {});
    await sleep(300);
    const btnGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-open"]')`);
    if (!btnGeom) throw new Error(`không tìm thấy nút Dọn kho (${label})`);
    await cdp.click(btnGeom.x, btnGeom.y);
    return cdp.waitFor(async () => {
      const p = await cdp.evalJs(PANEL_FN).catch(() => null);
      return p && p.rows.length === expectRows ? p : null;
    }, `panel Dọn kho liệt kê đủ ${expectRows} mục (${label})`, 60000);
  }

  try {
    const DEV_PORT = Number(process.env.R7_DEV_PORT || 0) || (await pickFreePort(5620, 5629));
    const DEBUG_PORT = Number(process.env.R7_DEBUG_PORT || 0) || (await pickFreePort(9720, 9729));
    const DISPLAY = process.env.R7_DISPLAY || ":174";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5620–5629");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9720–9729");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (R7 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round62-r7/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r7-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r7-chrome.log"), "w");
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

    // ---- X0: mẫu tự load + autosave binMedia 2 + IDB đủ 2 asset ----
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
    const projName = s0.projectName;
    const idb0ok = a1 && a2
      && idb0.manifests.some((m) => m.assetId === a1)
      && idb0.manifests.some((m) => m.assetId === a2)
      && idb0.blobKeys.includes(a1) && idb0.blobKeys.includes(a2);
    await drainErrors(cdp);
    log(`X0: load mẫu ${loadMs}ms; projectName=${JSON.stringify(projName)}; assetId mau-1=${a1}, mau-2=${a2}; IDB manifests=${JSON.stringify(idb0.manifests)}, blobKeys=${JSON.stringify(idb0.blobKeys)}, refs=${JSON.stringify(idb0.refs)}`);
    if (idb0ok && s0.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob)) {
      pass("X0 setup: mẫu tự load + IDB đủ bytes 2 asset", `3 clip, bin 2 item (file thật ${s0.media.map((m) => m.fileSize).join("/")} byte), autosave binMedia 2 entry, IDB manifests ${idb0.manifests.length} + blobs ${idb0.blobKeys.length}, project "${projName}"`);
    } else {
      fail("X0 setup: mẫu tự load + IDB đủ bytes 2 asset", `media=${JSON.stringify(s0.media)}, autosave=${JSON.stringify(auto0)}, idb=${JSON.stringify(idb0)}`);
    }
    await cdp.shot("r7-x0-sample-loaded.png");

    // ---- X1: sổ tham chiếu được ghi TỰ ĐỘNG bởi App effect (không seed tay) ----
    {
      const wantKey = `name:${projName}`;
      const refs1 = await cdp.waitFor(async () => {
        const d = await cdp.evalJs(IDB_FN).catch(() => null);
        if (!d) return null;
        const rec = d.refs.find((r) => r.projectKey === wantKey);
        return rec && rec.assetIds.includes(a1) && rec.assetIds.includes(a2) ? d.refs : null;
      }, "sổ projectRefs có bản ghi project hiện tại liệt kê đủ 2 assetId", 30000);
      await drainErrors(cdp);
      const rec = refs1.find((r) => r.projectKey === wantKey);
      log(`X1: refs=${JSON.stringify(refs1)}`);
      if (rec && rec.assetIds.length === 2 && rec.projectName === projName) {
        pass("X1 App effect ghi sổ tham chiếu tự động (không seed tay)", `bản ghi ${wantKey} có đúng 2 assetId (mau-1/mau-2), projectName="${rec.projectName}", updatedAt=${rec.updatedAt}`);
      } else {
        fail("X1 App effect ghi sổ tham chiếu tự động (không seed tay)", `refs=${JSON.stringify(refs1)}, wantKey=${wantKey}`);
      }
    }

    // ---- X2: locale en + seed mồ côi + bản ghi project B dùng chung bytes đó ----
    const ORPHAN_ID = "a_62r7orphan000001";
    const ORPHAN2_ID = "a_62r7orphan000002";
    {
      await cdp.evalJs(`localStorage.setItem("vcut-lang", "en")`);
      await cdp.send("Page.reload", { ignoreCache: false });
      await afterReload(cdp);
      const s2 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
      }, "sau reload en: timeline 3 clip + media bin 2 item", 120000);
      const seed = await cdp.evalJs(`(${SEED_FN})(${JSON.stringify(ORPHAN_ID)}, "cu-xoa-truoc.webm", 4321, "name:Dự án B", "Dự án B", ${JSON.stringify([ORPHAN_ID])}, "00000000000000000000000000000000000000000000000000000000000062e7")`);
      const idb2 = await cdp.evalJs(IDB_FN);
      const seedOk = seed && seed.assetId === ORPHAN_ID
        && idb2.manifests.some((m) => m.assetId === ORPHAN_ID && m.size === 4321 && m.refCount === 0)
        && idb2.blobKeys.includes(ORPHAN_ID)
        && idb2.refs.some((r) => r.projectKey === "name:Dự án B" && r.assetIds.includes(ORPHAN_ID))
        && idb2.refs.some((r) => r.projectKey === `name:${projName}` && r.assetIds.includes(a1) && r.assetIds.includes(a2))
        && idb2.manifests.length === 3 && idb2.blobKeys.length === 3;
      await drainErrors(cdp);
      log(`X2: locale en, projectName=${JSON.stringify(s2.projectName)}; seed=${JSON.stringify(seed)}; IDB manifests=${JSON.stringify(idb2.manifests)}, refs=${JSON.stringify(idb2.refs)}`);
      if (seedOk) {
        pass("X2 locale en + seed project B dùng chung bytes mồ côi", `localStorage vcut-lang=en, reload xong (3 clip + bin 2); IDB: manifest+blob cu-xoa-truoc.webm 4321 byte (refCount 0) + bản ghi name:Dự án B → [${ORPHAN_ID}] + bản ghi project hiện tại còn đủ 2 assetId; tổng 3 manifest + 3 blob`);
      } else {
        fail("X2 locale en + seed project B dùng chung bytes mồ côi", `seed=${JSON.stringify(seed)}, idb=${JSON.stringify(idb2)}`);
      }
    }

    // ---- X3: panel chặn liên project — mồ côi bị khóa vì B dùng, chọn-tất-cả disabled ----
    // KHÔNG gọi ensureNoModal ở đây: panel dọn kho đang mở cũng là
    // .modal-backdrop, ensureNoModal sẽ bấm Escape đóng mất panel.
    let panel3 = null;
    {
      panel3 = await openPanel(cdp, 3, "X3");
      const orphanRow = panel3.rows.find((r) => r.assetId === ORPHAN_ID);
      const orphanOk = orphanRow && orphanRow.inUse && orphanRow.checkboxDisabled === true
        && orphanRow.usedByOther.includes("Dự án B")
        && orphanRow.text.includes("cu-xoa-truoc.webm") && /4[.,]2/.test(orphanRow.text);
      const selectOk = panel3.selectDisabled === true && panel3.selectLabel === "Select all orphaned items";
      const inUseOk = panel3.inUseRows === 3; // mau-1, mau-2 (project hiện tại) + mồ côi (B dùng)
      const projectsOk = panel3.projects.some((p) => p.key === `name:${projName}` && p.forgetDisabled === true)
        && panel3.projects.some((p) => p.key === "name:Dự án B" && p.forgetDisabled === false);
      await drainErrors(cdp);
      log(`X3: panel rows=${JSON.stringify(panel3.rows)}, selectLabel=${JSON.stringify(panel3.selectLabel)}, selectDisabled=${panel3.selectDisabled}, projects=${JSON.stringify(panel3.projects)}`);
      if (orphanOk && selectOk && inUseOk && projectsOk) {
        pass("X3 panel chặn liên project: mồ côi bị khóa vì Dự án B dùng, chọn-tất-cả disabled (locale en)", `hàng cu-xoa-truoc.webm inUse=1, usedByOther="Dự án B", checkbox khóa; nút "Select all orphaned items" (tiếng Anh) disabled vì 0 mục mồ côi thật; mục sổ liệt kê 2 project, nút Quên của project hiện tại bị khóa, của B mở`);
      } else {
        fail("X3 panel chặn liên project: mồ côi bị khóa vì Dự án B dùng, chọn-tất-cả disabled (locale en)", `orphanOk=${orphanOk}, selectOk=${selectOk}, inUseOk=${inUseOk}, projectsOk=${projectsOk}, panel=${JSON.stringify(panel3)}`);
      }
      await cdp.shot("r7-x3-blocked-by-project-b.png");
    }

    // ---- X4: quên project B bằng UI thật → mồ côi thành chọn được ----
    {
      const forgetGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-forget"][data-project-key="name:Dự án B"]')`);
      if (!forgetGeom || forgetGeom.disabled) throw new Error("không tìm thấy nút Quên của Dự án B (X4)");
      await cdp.click(forgetGeom.x, forgetGeom.y); // confirm tự accept qua CDP
      const panel4 = await cdp.waitFor(async () => {
        const p = await cdp.evalJs(PANEL_FN).catch(() => null);
        return p && p.projects.length === 1 && p.rows.some((r) => r.assetId === ORPHAN_ID && !r.inUse) ? p : null;
      }, "sau khi quên B: sổ còn 1 project, hàng mồ côi thành chọn được", 30000);
      const orphanRow = panel4.rows.find((r) => r.assetId === ORPHAN_ID);
      const idb4 = await cdp.evalJs(IDB_FN);
      const forgetOk = orphanRow && !orphanRow.inUse && orphanRow.checkboxDisabled === false
        && orphanRow.usedByOther === ""
        && panel4.selectDisabled === false
        && idb4.refs.length === 1 && idb4.refs[0].projectKey === `name:${projName}`
        && idb4.manifests.some((m) => m.assetId === ORPHAN_ID);
      await drainErrors(cdp);
      log(`X4: sau quên B: projects=${JSON.stringify(panel4.projects)}, orphanRow=${JSON.stringify(orphanRow)}, refs=${JSON.stringify(idb4.refs)}`);
      if (forgetOk) {
        pass("X4 quên project B bằng UI thật: sổ chỉ còn project hiện tại, mồ côi thành chọn được", `bấm Quên + confirm → panel quét lại: sổ còn 1 bản ghi (project hiện tại), hàng cu-xoa-truoc.webm inUse=0, checkbox mở, nút chọn-tất-cả mở; bytes mồ côi vẫn còn trong IDB (quên chỉ xóa bản ghi)`);
      } else {
        fail("X4 quên project B bằng UI thật: sổ chỉ còn project hiện tại, mồ côi thành chọn được", `panel=${JSON.stringify(panel4)}, idb=${JSON.stringify(idb4)}`);
      }
      await cdp.shot("r7-x4-forgot-project-b.png");
    }

    // ---- X5: bấm "Chọn tất cả mục mồ côi" thật + xóa thật ----
    {
      const selGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-select-orphans"]')`);
      if (!selGeom || selGeom.disabled) throw new Error("không tìm thấy nút Chọn tất cả mục mồ côi (X5)");
      await cdp.click(selGeom.x, selGeom.y);
      const afterSel = await cdp.evalJs(PANEL_FN);
      const selRow = afterSel.rows.find((r) => r.assetId === ORPHAN_ID);
      const selOk = selRow && selRow.checkboxChecked === true
        && afterSel.rows.filter((r) => r.inUse).every((r) => r.checkboxChecked === false)
        && afterSel.deleteDisabled === false
        && afterSel.deleteLabel === "Delete selected (1)";
      if (!selOk) throw new Error(`sau khi bấm chọn-tất-cả, trạng thái không đúng (X5): ${JSON.stringify(afterSel)}`);
      const delGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-delete-selected"]')`);
      if (!delGeom) throw new Error("không tìm thấy nút Xóa đã chọn (X5)");
      await cdp.click(delGeom.x, delGeom.y); // confirm tự accept qua CDP
      await sleep(800);
      const idb5 = await cdp.waitFor(async () => {
        const d = await cdp.evalJs(IDB_FN).catch(() => null);
        if (!d) return null;
        const gone = !d.manifests.some((m) => m.assetId === ORPHAN_ID) && !d.blobKeys.includes(ORPHAN_ID);
        return gone ? d : null;
      }, "IndexedDB hết manifest + blob của mục mồ côi (mau-1/mau-2 còn nguyên)", 30000);
      const kept = idb5.manifests.some((m) => m.assetId === a1) && idb5.manifests.some((m) => m.assetId === a2)
        && idb5.blobKeys.includes(a1) && idb5.blobKeys.includes(a2);
      const panel5 = await cdp.waitFor(async () => {
        const p = await cdp.evalJs(PANEL_FN).catch(() => null);
        return p && p.rows.length === 2 && !p.rows.some((r) => r.assetId === ORPHAN_ID) ? p : null;
      }, "panel quét lại còn 2 mục, không còn hàng mồ côi", 30000);
      const refsKept = idb5.refs.length === 1 && idb5.refs[0].projectKey === `name:${projName}`
        && idb5.refs[0].assetIds.includes(a1) && idb5.refs[0].assetIds.includes(a2);
      const s5 = await cdp.evalJs(STATE_FN);
      await drainErrors(cdp);
      log(`X5: sau khi xóa: IDB manifests=${JSON.stringify(idb5.manifests)}, blobKeys=${JSON.stringify(idb5.blobKeys)}, refs=${JSON.stringify(idb5.refs)}, panel rows=${panel5.rows.length}, bin=${s5.mediaCount}`);
      if (kept && refsKept && panel5.hasResult && s5.mediaCount === 2) {
        pass("X5 chọn-tất-cả + xóa thật: mồ côi biến mất khỏi IndexedDB, đang dùng + sổ còn nguyên", `bấm "Select all orphaned items" → chỉ tick cu-xoa-truoc.webm, nút xóa hiện "Delete selected (1)"; xóa xong IDB hết manifest/blob của ${ORPHAN_ID}, mau-1/mau-2 còn nguyên, bản ghi sổ của project hiện tại còn đủ 2 assetId, panel còn 2 hàng, bin vẫn 2 item`);
      } else {
        fail("X5 chọn-tất-cả + xóa thật: mồ côi biến mất khỏi IndexedDB, đang dùng + sổ còn nguyên", `kept=${kept}, refsKept=${refsKept}, hasResult=${panel5.hasResult}, media=${JSON.stringify(s5.media)}, idb=${JSON.stringify(idb5)}`);
      }
      await cdp.shot("r7-x5-select-all-deleted.png");
      await cdp.key("Escape", "Escape");
      await sleep(600);
    }

    // ---- X6: viewport 390px — panel gọn trong viewport, chọn-tất-cả + xóa thật bằng chuột ----
    {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await cdp.send("Page.reload", { ignoreCache: false });
      await afterReloadMobile(cdp);
      const s6 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
      }, "sau reload 390px: timeline 3 clip + media bin 2 item", 120000);
      const seed2 = await cdp.evalJs(`(${SEED_FN})(${JSON.stringify(ORPHAN2_ID)}, "cu-xoa-390.webm", 2048, "name:Dự án B", "Dự án B", ${JSON.stringify([])}, "00000000000000000000000000000000000000000000000000000000000062f1")`);
      // Ghi chú: seed lần 2 dùng bản ghi B rỗng (không dùng bytes này)
      // để X6 chỉ đo viewport + chọn-tất-cả, không đo lại chặn liên project.
      // Mobile: MediaBin nằm trong bottom-sheet, mở bằng nút 📁 ở fabbar
      // (nút đầu tiên trong .m-fabbar) trước khi bấm Dọn kho.
      const fabGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('.m-fabbar button')`);
      if (!fabGeom) throw new Error("không tìm thấy nút mở thư viện media (fab) ở 390px (X6)");
      await cdp.click(fabGeom.x, fabGeom.y);
      await cdp.waitFor(async () => await cdp.evalJs(`!!document.querySelector('.mediabin')`).catch(() => null), "bottom-sheet media mở ở 390px", 30000);
      const panel6 = await openPanel(cdp, 3, "X6 390px");
      const orphanRow = panel6.rows.find((r) => r.assetId === ORPHAN2_ID);
      const rectOk = panel6.rect.left >= 0 && panel6.rect.right <= 391;
      const orphanOk = orphanRow && !orphanRow.inUse && orphanRow.checkboxDisabled === false;
      // Nút chọn-tất-cả có thể nằm dưới nếp gấp của panel cuộn: cuộn tới rồi mới bấm chuột thật.
      await cdp.evalJs(`document.querySelector('[data-testid="storage-cleanup-select-orphans"]')?.scrollIntoView({ block: "nearest" })`);
      await sleep(400);
      const selGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-select-orphans"]')`);
      if (!selGeom || selGeom.disabled) throw new Error(`không tìm thấy nút Chọn tất cả ở 390px (X6): ${JSON.stringify(selGeom)}`);
      await cdp.click(selGeom.x, selGeom.y);
      const afterSel = await cdp.evalJs(PANEL_FN);
      const selRow = afterSel.rows.find((r) => r.assetId === ORPHAN2_ID);
      const selOk = selRow && selRow.checkboxChecked === true && afterSel.deleteDisabled === false;
      await cdp.evalJs(`document.querySelector('[data-testid="storage-cleanup-delete-selected"]')?.scrollIntoView({ block: "nearest" })`);
      await sleep(400);
      const delGeom = await cdp.evalJs(`(${GEOM_BY_SELECTOR_FN})('[data-testid="storage-cleanup-delete-selected"]')`);
      if (!delGeom) throw new Error("không tìm thấy nút Xóa đã chọn ở 390px (X6)");
      await cdp.click(delGeom.x, delGeom.y); // confirm tự accept qua CDP
      const idb6 = await cdp.waitFor(async () => {
        const d = await cdp.evalJs(IDB_FN).catch(() => null);
        if (!d) return null;
        const gone = !d.manifests.some((m) => m.assetId === ORPHAN2_ID) && !d.blobKeys.includes(ORPHAN2_ID);
        return gone ? d : null;
      }, "IndexedDB hết manifest + blob của mồ côi thứ 2 ở 390px", 30000);
      const kept = idb6.manifests.some((m) => m.assetId === a1) && idb6.manifests.some((m) => m.assetId === a2);
      await drainErrors(cdp);
      log(`X6: 390px: seed2=${JSON.stringify(seed2)}; panel rect=${JSON.stringify(panel6.rect)}; orphanRow=${JSON.stringify(orphanRow)}; selOk=${selOk}; IDB manifests=${JSON.stringify(idb6.manifests)}`);
      if (rectOk && orphanOk && selOk && kept) {
        pass("X6 viewport 390px: panel gọn trong viewport, chọn-tất-cả + xóa thật bằng chuột", `panel rect left=${panel6.rect.left} right=${panel6.rect.right} (≤391); hàng cu-xoa-390.webm chọn được; bấm chọn-tất-cả thật → tick đúng mục đó, nút xóa mở; xóa xong IDB hết manifest/blob của ${ORPHAN2_ID}, mau-1/mau-2 còn nguyên; project "${s6.projectName}"`);
      } else {
        fail("X6 viewport 390px: panel gọn trong viewport, chọn-tất-cả + xóa thật bằng chuột", `rectOk=${rectOk}, orphanOk=${orphanOk}, selOk=${selOk}, kept=${kept}, panel=${JSON.stringify(panel6)}, idb=${JSON.stringify(idb6)}`);
      }
      await cdp.shot("r7-x6-viewport-390.png");
      await cdp.key("Escape", "Escape");
      await sleep(600);
      await cdp.send("Emulation.clearDeviceMetricsOverride");
    }

    // ---- X7: tab-sync — panel tự quét lại khi BroadcastChannel báo sổ đổi ----
    const ORPHAN3_ID = "a_62r7orphan000003";
    {
      const seed3 = await cdp.evalJs(`(${SEED_FN})(${JSON.stringify(ORPHAN3_ID)}, "cu-xoa-bc.webm", 1024, "name:Dự án C", "Dự án C", ${JSON.stringify([ORPHAN3_ID])}, "00000000000000000000000000000000000000000000000000000000000062aa")`);
      const panel7a = await openPanel(cdp, 3, "X7");
      const rowA = panel7a.rows.find((r) => r.assetId === ORPHAN3_ID);
      const blockedOk = rowA && rowA.inUse && rowA.usedByOther.includes("Dự án C") && rowA.checkboxDisabled === true;
      // Xóa bản ghi C bằng IDB thô (mô phỏng tab khác quên project C),
      // rồi post refs-changed qua một BroadcastChannel KHÁC trong cùng
      // tab — panel phải tự quét lại mà không cần bấm Quét lại.
      await cdp.evalJs(`(async () => {
        const db = await new Promise((res, rej) => {
          const req = indexedDB.open("vcut-studio-assets");
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });
        await new Promise((res, rej) => {
          const tx = db.transaction(["projectRefs"], "readwrite");
          const del = tx.objectStore("projectRefs").delete("name:Dự án C");
          del.onsuccess = () => res(true);
          del.onerror = () => rej(del.error);
        });
        db.close();
        const ch = new BroadcastChannel("vcut-projrefs");
        ch.postMessage({ type: "refs-changed", at: Date.now() });
        ch.close();
        return true;
      })()`);
      const panel7b = await cdp.waitFor(async () => {
        const p = await cdp.evalJs(PANEL_FN).catch(() => null);
        return p && p.rows.some((r) => r.assetId === ORPHAN3_ID && !r.inUse && r.checkboxDisabled === false) ? p : null;
      }, "panel tự quét lại sau broadcast refs-changed: hàng mồ côi thứ 3 thành chọn được", 30000);
      const rowB = panel7b.rows.find((r) => r.assetId === ORPHAN3_ID);
      const idb7 = await cdp.evalJs(IDB_FN);
      const autoOk = rowB && !rowB.inUse && rowB.usedByOther === ""
        && !idb7.refs.some((r) => r.projectKey === "name:Dự án C")
        && idb7.manifests.some((m) => m.assetId === ORPHAN3_ID);
      await drainErrors(cdp);
      log(`X7: seed3=${JSON.stringify(seed3)}; trước broadcast: blockedOk=${blockedOk}; sau broadcast: row=${JSON.stringify(rowB)}, refs=${JSON.stringify(idb7.refs)}`);
      if (blockedOk && autoOk) {
        pass("X7 tab-sync: panel tự quét lại khi BroadcastChannel báo sổ đổi", `mở panel: hàng cu-xoa-bc.webm bị khóa vì Dự án C dùng; xóa bản ghi C bằng IDB thô + post refs-changed qua BroadcastChannel thật → panel tự quét lại, hàng thành chọn được (inUse=0, checkbox mở), bytes vẫn còn trong IDB`);
      } else {
        fail("X7 tab-sync: panel tự quét lại khi BroadcastChannel báo sổ đổi", `blockedOk=${blockedOk}, autoOk=${autoOk}, panel7a=${JSON.stringify(panel7a)}, panel7b=${JSON.stringify(panel7b)}, idb=${JSON.stringify(idb7)}`);
      }
      await cdp.shot("r7-x7-broadcast-rescan.png");
      await cdp.key("Escape", "Escape");
      await sleep(600);
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 3 lần reload)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "r7-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED R7: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
