#!/usr/bin/env node
/**
 * clicktest-68v8-export-dest-headed.mjs — Phase 9 đợt 68, luồng V8:
 * đo headed THẬT "đích export .mp4 bền qua reopen theo jobId + kiểm tra
 * download được trước khi hiện nút tải" (đóng nợ đợt 67 U7 / ROUND67_LIMITS
 * §5 mục 1–2).
 *
 * Luồng đo (vite dev + bridge THẬT + Chromium headed qua Xvfb + CDP,
 * theo mẫu clicktest-67u7-job-history-headed.mjs):
 *   - Chạy web app ở chế độ "Electron giả lập": stub `window.vcutDesktop`
 *     qua Page.addScriptToEvaluateOnNewDocument (chỉ stub dialog chọn đích
 *     + lưu file; mọi logic web — persist đích, HEAD check, banner — là
 *     code thật). Ghi đĩa thật ra đích được chứng minh ở script Electron
 *     riêng (clicktest-68v8-export-dest-electron.mjs).
 *   H0 setup: profile Chrome mới tinh (locale vi), project mẫu tự load
 *        (3 clip, media bin 2 item, media có file thật).
 *   H1 bấm CTA "🎬 Xuất MP4" → stub saveVideoDialog trả đích DEST →
 *        render thật qua bridge → job DONE; localStorage lịch sử của job
 *        PHẢI có exportDest === DEST (đích đã persist theo jobId).
 *   H2 HEAD /api/render/:id/download trực tiếp (node fetch) → 200 +
 *        Content-Length khớp outputSize (endpoint mới của bridge).
 *   H3 ĐÓNG modal + RELOAD TRANG → mở lại panel → lịch sử còn mục done
 *        → bấm "Xem kết quả" → banner done PHẢI hiện nút tải (sau HEAD
 *        check: data-download-state="available") + ghi chú đích DEST
 *        (data-export-dest) → bấm nút tải bằng chuột thật → stub
 *        saveExportFile PHẢI được gọi với đúng {jobId, destPath: DEST}
 *        (ghi thẳng ra đích đã chọn, KHÔNG rớt về anchor download:
 *        không có anchor /download nào bị bấm).
 *   H4 XOÁ output.mp4 khỏi thư mục job trên đĩa → HEAD trực tiếp → 409
 *        → reload + mở panel → "Xem kết quả" → banner PHẢI ở trạng thái
 *        missing (data-download-state="missing"): KHÔNG có nút tải,
 *        có chuỗi báo file đã mất + nút "Xoá khỏi lịch sử" → bấm xoá →
 *        lịch sử rỗng + localStorage không còn mục đó.
 *   H5 0 lỗi trang trong cả phiên.
 *
 * Kiên cố với VM: ghi file qua exec bị EPERM theo đợt từ ~01:05 09/11
 * (xem LIMITS §6) — bridge spawn bằng PIPE stdio (bridge console.error
 * ghi ra fd file mà gặp EPERM thì throw → bridge chết exit 1, bài học
 * dbg-die3), chờ cửa sổ ghi được trước khi render, CTA render retry tối
 * đa 3 lần khi panel báo lỗi do 500.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-68v8-export-dest-headed.mjs
 * Env: V8_DEV_PORT (mặc định tự chọn 5790–5799), V8_DEBUG_PORT (9900–9909),
 * V8_BRIDGE_PORT (8980–8989), V8_DISPLAY (mặc định :256–:265),
 * V8_SCRATCH (mặc định hidden_files/round68-v8/headed). TMPDIR NGẮN
 * /tmp/round68-v8/tmp (không dùng đường dẫn sâu trong scratch — Chrome
 * đặt SingletonSocket dưới $TMPDIR, giới hạn ~108 ký tự). Exit 0 mọi case PASS,
 * 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary. Ảnh chụp + log
 * bridge/vite/chrome nằm ở SCRATCH.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.V8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v8", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = path.join(SCRATCH, "vite-cfg");
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.v8.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = path.join(SCRATCH, "bridge-work");
const DEST = path.join(SCRATCH, "v8-export.mp4");

const EXPECT_HISTORY_TITLE_VI = "Lịch sử xuất";
const EXPECT_OPEN_RESULT_VI = "Xem kết quả";
const EXPECT_DOWNLOAD_VI = "⬇ Tải xuống MP4";
const EXPECT_MISSING_VI = "Không còn file MP4 để tải";
const EXPECT_DELETE_HISTORY_VI = "Xoá khỏi lịch sử";
const EXPECT_CHECKING_VI = "Đang kiểm tra file xuất";

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
  async send(method, params = {}, timeoutMs = 240000) {
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
  async evalJs(expression, timeoutMs = 240000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
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
  if (!window.__v8injected) {
    window.__v8injected = true;
    window.__v8errors = [];
    window.addEventListener("error", (e) => { try { window.__v8errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__v8errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__v8errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__v8errors.push("unhandledrejection: <?>"); } });
  }
  window.__v8boot = window.__v8boot || Math.random().toString(36).slice(2);
})()`;

/** Stub window.vcutDesktop (chỉ dialog đích + lưu file) — chạy trước app. */
function desktopStubScript(bridgeUrl, dest) {
  return `(() => {
  window.__v8bridge = ${JSON.stringify(bridgeUrl)};
  window.__v8dest = ${JSON.stringify(dest)};
  window.__v8calls = { saveVideoDialog: [], saveExportFile: [], anchors: [] };
  window.vcutDesktop = {
    readProjectFile: async () => ({ ok: false, error: "stub" }),
    getBridgeUrl: async () => window.__v8bridge,
    getCurrentProjectPath: async () => null,
    setCurrentProjectPath: async () => {},
    getPaths: async () => ({ logPath: "", settingsPath: "", userData: "" }),
    getServices: async () => [],
    getModels: async () => ({ ok: false, error: "stub" }),
    downloadModel: async () => ({ ok: false, error: "stub" }),
    cancelModelDownload: async () => ({ ok: false }),
    onModelDownloadProgress: () => () => {},
    openMediaDialog: async () => null,
    openProjectDialog: async () => null,
    onMenuAction: () => () => {},
    onOpenFile: () => () => {},
    onLanguageChanged: () => () => {},
    notifyLanguageChanged: async () => {},
    setLanguage: () => {},
    onServicesStatus: () => () => {},
    platform: "linux",
    saveProjectDialog: async () => null,
    saveVideoDialog: async (name) => {
      window.__v8calls.saveVideoDialog.push({ name: name || null, dest: window.__v8dest });
      return window.__v8dest;
    },
    versions: { chrome: "", electron: "", node: "" },
    writeProjectFile: async () => ({ ok: false, error: "stub" }),
    readMediaFile: async () => ({ ok: false, error: "stub" }),
    saveExportFile: async (jobId, destPath) => {
      const res = await fetch(window.__v8bridge + "/api/render/" + jobId + "/download");
      const buf = await res.arrayBuffer().catch(() => new ArrayBuffer(0));
      window.__v8calls.saveExportFile.push({ jobId, destPath, status: res.status, bytes: buf.byteLength });
      return res.ok ? { ok: true, bytes: buf.byteLength, path: destPath } : { ok: false, error: "bridge " + res.status };
    },
    noteProjectOpened: async () => ({ ok: true }),
  };
  const _click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    try { if (this.href && this.href.includes("/download")) window.__v8calls.anchors.push(this.href); } catch {}
    return _click.call(this);
  };
})()`;
}

const STORE_FN = `(async () => {
  const mod = window.__v8storeMod || (window.__v8storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    duration: st.spec.tracks.reduce((mx, t) => Math.max(mx, ...t.clips.map((c) => c.start + c.duration)), 0),
  };
})()`;

/** Lịch sử job đầy đủ trong localStorage (để đọc exportDest đã persist). */
const HISTORY_LS_FN = `(() => { try { const a = JSON.parse(localStorage.getItem("vcut.jobHistory.v1") || "[]"); return Array.isArray(a) ? a : "not-array"; } catch { return "parse-error"; } })()`;

/** Section lịch sử: số mục + từng dòng (jobId, status, nút nào có). */
const HISTORY_FN = `(() => {
  const sec = document.querySelector(".job-history");
  if (!sec) return null;
  const rows = [...sec.querySelectorAll(".job-history-row")].map((r) => ({
    jobId: r.getAttribute("data-job-id") || null,
    status: r.getAttribute("data-status") || null,
    buttons: [...r.querySelectorAll("button")].map((b) => (b.textContent || "").trim()),
  }));
  return {
    count: Number(sec.getAttribute("data-history-count") || rows.length),
    title: ((sec.querySelector(".panel-head") || {}).textContent || "").trim(),
    rows,
  };
})()`;

/** Banner done: trạng thái kiểm tra download + nút tải + ghi chú đích + chuỗi báo mất. */
const DONE_BANNER_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const banner = dlg.querySelector(".mp4-export .valid-banner.ok");
  if (!banner) return null;
  const btn = [...banner.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Tải xuống MP4"));
  const destNote = banner.querySelector("[data-export-dest]");
  const delBtn = [...banner.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(EXPECT_DELETE_HISTORY_VI)});
  return {
    hasBanner: true,
    state: banner.getAttribute("data-download-state") || null,
    hasDownloadBtn: !!btn,
    downloadRect: btn ? (() => { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : null,
    dest: destNote ? destNote.getAttribute("data-export-dest") : null,
    destText: destNote ? (destNote.textContent || "").trim() : null,
    missing: (banner.textContent || "").includes(${JSON.stringify(EXPECT_MISSING_VI)}),
    checking: (banner.textContent || "").includes(${JSON.stringify(EXPECT_CHECKING_VI)}),
    hasDeleteBtn: !!delBtn,
    deleteRect: delBtn ? (() => { delBtn.scrollIntoView({ block: "center" }); const r = delBtn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : null,
    text: (banner.textContent || "").trim().slice(0, 300),
  };
})()`;

/** Các lời gọi native stub đã ghi (dialog đích / lưu file / anchor). */
const CALLS_FN = `(() => window.__v8calls || null)()`;

/** Banner lỗi render (để retry CTA khi POST 500 do đợt EPERM). */
const ERROR_BANNER_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const bad = dlg.querySelector(".mp4-export .valid-banner.bad");
  return bad ? (bad.textContent || "").trim().slice(0, 200) : null;
})()`;

/** Nút CTA "Xuất MP4" trong ExportPanel, trả rect để bấm chuột thật. */
const CTA_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const btns = [...dlg.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("Xuất MP4") && !b.disabled && b.getBoundingClientRect().width > 0);
  if (!btns.length) return { found: false, texts: [...dlg.querySelectorAll("button")].map((b) => (b.textContent || "").trim().slice(0, 40)) };
  const b = btns[btns.length - 1];
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { found: true, x: r.left + r.width / 2, y: r.top + r.height / 2, text: (b.textContent || "").trim() };
})()`;

/** Nút "Xem kết quả" trên dòng lịch sử done (null = chưa có). */
const OPEN_RESULT_BTN_FN = `(() => {
  const row = document.querySelector('.job-history-row[data-status="done"]');
  if (!row) return null;
  const b = [...row.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(EXPECT_OPEN_RESULT_VI)});
  if (!b) return null;
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled, visible: r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight };
})()`;

/** Đóng modal bằng nút X (trả false nếu không có nút). */
const CLOSE_MODAL_FN = `(() => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return false; b.click(); return true; })()`;

/** Trạng thái khối tiến trình render trong panel. */
const PROGRESS_FN = `(() => {
  const p = document.querySelector(".render-progress");
  if (!p) return null;
  return { jobId: p.getAttribute("data-job-id") || null, label: ((p.querySelector(".progress-label") || {}).textContent || "").trim() };
})()`;

/** Đọc locale hiện tại từ đúng module i18n của app. */
const LOAD_I18N_FN = `(async () => {
  const m = window.__v8i18nMod || (window.__v8i18nMod = await import("/src/i18n/index.ts"));
  return m.getLang();
})()`;

/** Chờ tới khi ghi file được vào work dir (qua đợt EPERM của VM).
 * Probe mỗi 1s (đợt EPERM nhấp nháy theo giây — probe 10s dễ trượt
 * cửa sổ ghi được, xem LIMITS §6). */
async function waitForWritableDir(dir, label) {
  for (let i = 1; i <= 180; i++) {
    const probe = path.join(dir, ".v8-write-probe");
    try {
      writeFileEpermRetry(probe, "x");
      fs.unlinkSync(probe);
      if (i > 1) log(`ghi được vào ${label} sau ${i} lần chờ — qua đợt EPERM`);
      return true;
    } catch {
      try { fs.unlinkSync(probe); } catch {} // dọn file 0 byte do write EPERM để lại
      if (i === 1) log(`${label} chưa ghi được — chờ qua đợt EPERM của VM…`);
      await sleep(1000);
    }
  }
  return false;
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { bridge?.kill("SIGTERM"); } catch {}
  };
  process.on("exit", killAll);

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 5; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .m-sheet-backdrop, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => {
        const clickFirst = (sel) => { const b = document.querySelector(sel); if (b) { b.click(); return true; } return false; };
        if (clickFirst('[role="dialog"] .modal-head .icon-btn')) return "x";
        if (clickFirst('.tour-card .icon-btn')) return "tour-x";
        if (clickFirst('.m-sheet-close')) return "sheet-x";
        const b = [...document.querySelectorAll('[role="dialog"] button')].find((x) => ["Later", "Để sau", "Skip", "Đóng", "Close"].includes(x.textContent.trim()));
        if (b) { b.click(); return "later"; }
        return null;
      })()`).catch(() => {});
      await sleep(500);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(500);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .m-sheet-backdrop, .welcome-modal")`));
  }

  async function waitMounted(cdp, oldBoot) {
    const oldBootJson = JSON.stringify(oldBoot ?? null);
    const boot = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__v8boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__v8errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__v8errors = []`).catch(() => {});
    return e;
  }

  async function openModalTopBar(cdp, topBtnSubstr, titleSubstr) {
    const topBtnFn = `(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes(${JSON.stringify(topBtnSubstr)})); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled, visible: r.width > 0 && r.left >= 0 && r.right <= window.innerWidth }; })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await ensureNoModal(cdp);
      let btn = await cdp.evalJs(topBtnFn);
      if (!btn) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" (lần ${attempt})`);
      if (btn.disabled) {
        let enabled = false;
        for (let i = 0; i < 60 && !enabled; i++) {
          await sleep(500);
          const b2 = await cdp.evalJs(topBtnFn);
          if (b2 && !b2.disabled) enabled = true;
        }
        if (!enabled) throw new Error(`nút TopBar "${topBtnSubstr}" vẫn disabled sau 30s chờ (media chưa rehydrate?)`);
      }
      const btnNow = await cdp.evalJs(topBtnFn);
      if (!btnNow) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" sau chờ enable`);
      btn = btnNow;
      if (!btn.visible) {
        await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes(${JSON.stringify(topBtnSubstr)})); if (b) b.scrollIntoView({ block: "nearest", inline: "center" }); return true; })()`);
        await sleep(400);
        const btn2 = await cdp.evalJs(topBtnFn);
        if (!btn2) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" sau scrollIntoView`);
        await cdp.click(btn2.x, btn2.y);
      } else {
        await cdp.click(btn.x, btn.y);
      }
      const opened = await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes(${JSON.stringify(titleSubstr)}) ? true : null; })()`).catch(() => null);
        return m;
      }, `modal mở (tiêu đề ${titleSubstr}, lần ${attempt})`, 8000).catch(() => null);
      if (opened) return true;
      log(`openModalTopBar lần ${attempt}: modal chưa mở (tiêu đề ${titleSubstr}) — bấm lại`);
      await sleep(1000);
    }
    throw new Error(`timeout chờ modal mở (tiêu đề ${titleSubstr}) sau 3 lần bấm`);
  }

  /** Khởi động bridge (cùng cổng + WORK_DIR, PIPE stdio — xem đầu file); chờ /api/health 200. */
  async function startBridge(port, workDir, logName) {
    const logStream = fs.createWriteStream(path.join(SCRATCH, logName), { flags: "w" });
    logStream.on("error", () => { /* đợt EPERM: không giết harness */ });
    const proc = spawn("node", [BRIDGE_ENTRY], {
      stdio: ["ignore", "pipe", "pipe"],
      // Cách ly persist rate limiter theo script chạy (đợt 66 T9).
      env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR: workDir, BRIDGE_RATE_PERSIST_PATH: path.join(workDir, `rate-limit-${process.pid}.json`) },
    });
    proc.stdout.on("data", (d) => { try { logStream.write(d); } catch {} });
    proc.stderr.on("data", (d) => { try { logStream.write(d); } catch {} });
    proc.on("exit", (code, signal) => log(`bridge exit code=${code} signal=${signal}`));
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (r.ok) up = true;
      } catch { /* chưa lên */ }
      if (!up) await sleep(1000);
    }
    if (!up) throw new Error(`bridge không lên ở :${port} sau 120s (xem ${logName})`);
    return proc;
  }

  /** Lấy job mới nhất từ bridge (GET /api/render). Chỉ dùng khi chưa biết
   *  jobId (renderOnce trả alreadyDone); 429 (hết quota general 120/phút
   *  do poll) thì chờ 3s thử lại 1 lần — cửa sổ trượt sẽ nhả quota. */
  async function latestJob(port) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const r = await fetch(`http://127.0.0.1:${port}/api/render?limit=1`);
      if (r.ok) {
        const j = await r.json();
        const list = j.jobs || [];
        return list.length ? list[0] : null;
      }
      if (r.status === 429 && attempt === 1) {
        log("GET /api/render bị 429 (hết quota general) — chờ 3s thử lại");
        await sleep(3000);
        continue;
      }
      return null;
    }
    return null;
  }

  /** Lấy job theo id từ bridge. */
  async function getJob(port, id) {
    const r = await fetch(`http://127.0.0.1:${port}/api/render/${id}`);
    if (!r.ok) return null;
    return r.json();
  }

  /** Mở 1 Chrome headed mới trên cùng Xvfb, trả { chrome, cdp }. */
  async function launchChrome(debugPort, profile, winW, winH, logName, display, tmpdir) {
    const logStream = fs.createWriteStream(path.join(SCRATCH, logName), { flags: "w" });
    logStream.on("error", () => { /* đợt EPERM */ });
    const proc = spawn(CHROME, ["--remote-debugging-port=" + debugPort, `--user-data-dir=${profile}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      `--window-size=${winW},${winH}`, "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY: display, TMPDIR: tmpdir } });
    proc.stdout.on("data", (d) => { try { logStream.write(d); } catch {} });
    proc.stderr.on("data", (d) => { try { logStream.write(d); } catch {} });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error(`không lấy được page target CDP (debug :${debugPort})`);
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    return { chrome: proc, cdp };
  }

  /** Bấm CTA Xuất MP4 rồi chờ job DONE; lỗi panel (500 do EPERM) thì retry tối đa 3 lần. */
  async function renderOnce(cdp, port) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const cta = await cdp.evalJs(CTA_FN);
      if (!cta || !cta.found) throw new Error(`không tìm thấy CTA Xuất MP4 (lần ${attempt}): ${JSON.stringify(cta)}`);
      await cdp.click(cta.x, cta.y);
      // Chờ tiến trình HOẶC banner lỗi (poll 1s).
      let outcome = null;
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        const prog = await cdp.evalJs(PROGRESS_FN).catch(() => null);
        if (prog && prog.jobId) { outcome = { kind: "running", jobId: prog.jobId }; break; }
        const err = await cdp.evalJs(ERROR_BANNER_FN).catch(() => null);
        if (err) { outcome = { kind: "error", error: err }; break; }
        const banner = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
        if (banner && banner.hasBanner) { outcome = { kind: "done" }; break; }
      }
      if (!outcome) throw new Error(`sau CTA lần ${attempt}: không thấy tiến trình/lỗi/banner trong 30s`);
      if (outcome.kind === "error") {
        log(`render lần ${attempt}: panel báo lỗi (${outcome.error}) — chờ qua đợt EPERM rồi thử lại`);
        const okWrite = await waitForWritableDir(BRIDGE_WORK_DIR, "bridge-work");
        if (!okWrite) throw new Error("bridge-work vẫn không ghi được sau ~3 phút");
        continue;
      }
      if (outcome.kind === "done") return { jobId: null, alreadyDone: true };
      const jobId = outcome.jobId;
      log(`render lần ${attempt}: job ${jobId} đang chạy — chờ DONE`);
      let done = false, jobErrored = null;
      // Poll 2s/lần (không 500ms): mọi GET /api/ đều tính vào quota
      // general 120/phút của bridge — poll 500ms suốt render 60s+ sẽ
      // đốt hết quota rồi latestJob sau đó ăn 429 (bài học run3 19:20).
      for (let i = 0; i < 150; i++) {
        await sleep(2000);
        const j = await getJob(port, jobId).catch(() => null);
        if (j && j.status === "done") { done = true; break; }
        if (j && (j.status === "error" || j.status === "interrupted" || j.status === "cancelled")) {
          jobErrored = `${j.status} (error=${JSON.stringify(j.error || j.errorCode)})`;
          break;
        }
      }
      if (done) return { jobId, alreadyDone: false };
      if (jobErrored) {
        log(`render lần ${attempt}: job ${jobId} về ${jobErrored} — chờ qua đợt EPERM rồi thử lại`);
        const okWrite = await waitForWritableDir(BRIDGE_WORK_DIR, "bridge-work");
        if (!okWrite) throw new Error("bridge-work vẫn không ghi được sau ~3 phút");
        continue;
      }
      throw new Error(`job ${jobId} chưa DONE sau 300s`);
    }
    throw new Error("render thất bại sau 3 lần thử CTA");
  }

  try {
    const DEV_PORT = Number(process.env.V8_DEV_PORT || 0) || (await pickFreePort(5790, 5799));
    const DEBUG_PORT = Number(process.env.V8_DEBUG_PORT || 0) || (await pickFreePort(9900, 9909));
    const BRIDGE_PORT = Number(process.env.V8_BRIDGE_PORT || 0) || (await pickFreePort(8980, 8989));
    const DISPLAY = process.env.V8_DISPLAY || (await pickFreeDisplay(256, 265));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5790–5799");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9900–9909");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8980–8989");
    if (!DISPLAY) throw new Error("hết display X trống :256–:265");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1248)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    // TMPDIR NGẮN trong /tmp (không dùng đường dẫn sâu trong scratch):
    // Chrome đặt SingletonSocket dưới $TMPDIR, đường dẫn Unix socket
    // giới hạn ~108 ký tự — TMPDIR sâu (hidden_files/...) làm Chrome
    // chết FATAL "Socket path too long", không lấy được page target CDP
    // (lỗi run2 19:18). /tmp còn ~97M nhưng Chrome chỉ để socket/lock
    // nhỏ ở đây; dữ liệu thật nằm ở profile trong scratch (đĩa home).
    const TMPDIR = "/tmp/round68-v8/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // WORK_DIR mới tinh mỗi lần chạy: không còn job cũ làm nhiễu latestJob.
    fs.rmSync(BRIDGE_WORK_DIR, { recursive: true, force: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    const loadavg = fs.readFileSync("/proc/loadavg", "utf8").trim();
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, bridge :${BRIDGE_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}, loadavg=${loadavg}`);

    // ---- Bridge ------------------------------------------------------------
    bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "v8-bridge.log");
    log(`bridge OK: ${BRIDGE_URL} (WORK_DIR=${BRIDGE_WORK_DIR})`);

    // ---- Vite + Xvfb + Chrome desktop --------------------------------------
    const viteLogStream = fs.createWriteStream(path.join(SCRATCH, "v8-vite.log"), { flags: "w" });
    viteLogStream.on("error", () => { /* đợt EPERM */ });
    const viteEnv = { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL };
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"], env: viteEnv });
    vite.stdout.on("data", (d) => { try { viteLogStream.write(d); } catch {} });
    vite.stderr.on("data", (d) => { try { viteLogStream.write(d); } catch {} });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const desk = await launchChrome(DEBUG_PORT, PROFILE, 1440, 900, "v8-chrome.log", DISPLAY, TMPDIR);
    chrome = desk.chrome;
    const cdp = desk.cdp;

    // Stub vcutDesktop TRƯỚC khi app load (mọi lần navigate).
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: desktopStubScript(BRIDGE_URL, DEST) });

    // ---- H0: setup vi + mount + mẫu ---------------------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    const s0 = await cdp.evalJs(STORE_FN).catch(() => null);
    await cdp.evalJs(LOAD_I18N_FN).catch(() => null);
    await drainErrors(cdp);
    if (s0 && s0.clipCount === 3 && s0.mediaCount === 2 && s0.media.every((m) => m.hasFile)) {
      pass("H0 setup: locale vi + mẫu tự load", `3 clip, media bin 2 item đều có file, duration ${s0.duration}s`);
    } else {
      fail("H0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(s0)}`);
    }

    // ---- H1: render thật (stub-Electron) → lịch sử có exportDest ---------
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const histBefore = await cdp.evalJs(HISTORY_FN);
    if (histBefore && histBefore.count === 0) {
      log("H1: lịch sử rỗng trước render (đúng)");
    } else {
      fail("H1 lịch sử rỗng trước render", `history=${JSON.stringify(histBefore)}`);
    }
    const okWrite = await waitForWritableDir(BRIDGE_WORK_DIR, "bridge-work");
    if (!okWrite) throw new Error("bridge-work vẫn không ghi được sau ~3 phút (đợt EPERM dài)");
    const rendered = await renderOnce(cdp, BRIDGE_PORT);
    // Dùng đúng jobId vừa render (không dùng latestJob — list cũng tính
    // vào quota general; latestJob chỉ là fallback khi renderOnce thấy
    // banner done ngay mà không bắt được jobId).
    const job = rendered.jobId
      ? await getJob(BRIDGE_PORT, rendered.jobId)
      : await latestJob(BRIDGE_PORT);
    if (!job || job.status !== "done") {
      fail("H1 render thật → job DONE", `latestJob=${JSON.stringify(job)}`);
    } else {
      const jobId = job.id;
      const lsHist = await cdp.evalJs(HISTORY_LS_FN);
      const row = Array.isArray(lsHist) ? lsHist.find((e) => e.id === jobId) : null;
      if (row && row.exportDest === DEST) {
        pass("H1 render thật → lịch sử persist exportDest", `job ${jobId} done, outputSize=${job.outputSize}, exportDest=${row.exportDest}`);
      } else {
        fail("H1 render thật → lịch sử persist exportDest", `job ${jobId} done nhưng lịch sử không có exportDest đúng: ${JSON.stringify(row)}`);
      }
      await cdp.shot("v8-done.png");
      // Giữ jobId cho các case sau.
      globalThis.__v8jobId = jobId;
      globalThis.__v8outputSize = job.outputSize;
    }
    const jobId = globalThis.__v8jobId;
    const outputSize = globalThis.__v8outputSize;

    // ---- H2: HEAD trực tiếp → 200 + Content-Length khớp ------------------
    if (jobId) {
      const headRes = await fetch(`${BRIDGE_URL}/api/render/${jobId}/download`, { method: "HEAD" });
      if (headRes.status === 200 && headRes.headers.get("content-length") === String(outputSize)) {
        pass("H2 HEAD download job done → 200", `Content-Length=${headRes.headers.get("content-length")} khớp outputSize=${outputSize}`);
      } else {
        fail("H2 HEAD download job done → 200", `status=${headRes.status}, content-length=${headRes.headers.get("content-length")}, outputSize=${outputSize}`);
      }
    }

    // ---- H3: RELOAD TRANG → mở lại từ lịch sử → tải ghi đúng đích -------
    if (jobId) {
      await cdp.evalJs(CLOSE_MODAL_FN);
      await sleep(500);
      await cdp.send("Page.navigate", { url: DEV_URL });
      const boot2 = await waitMounted(cdp, await cdp.evalJs(`window.__v8boot`).catch(() => null));
      await drainErrors(cdp);
      await openModalTopBar(cdp, "Xuất bản", "Xuất video");
      const histAfter = await cdp.evalJs(HISTORY_FN);
      const doneRow = histAfter && histAfter.rows.find((r) => r.jobId === jobId && r.status === "done");
      if (!doneRow) {
        fail("H3 reopen → lịch sử còn mục done", `history=${JSON.stringify(histAfter)}`);
      } else {
        const openBtn = await cdp.evalJs(OPEN_RESULT_BTN_FN);
        if (!openBtn) {
          fail("H3 reopen → nút Xem kết quả", "không tìm thấy nút trên dòng done");
        } else {
          await cdp.click(openBtn.x, openBtn.y);
          const banner = await cdp.waitFor(async () => {
            const b = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
            return b && b.hasBanner && (b.state === "available" || b.state === "unknown") ? b : null;
          }, "banner done sau Xem kết quả (state available/unknown)", 30000).catch(() => null);
          if (!banner) {
            const bNow = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
            fail("H3 reopen → banner done + nút tải sau HEAD check", `banner=${JSON.stringify(bNow)}`);
          } else if (!banner.hasDownloadBtn) {
            fail("H3 reopen → banner done + nút tải sau HEAD check", `banner có nhưng thiếu nút tải: ${JSON.stringify(banner)}`);
          } else if (banner.dest !== DEST) {
            fail("H3 reopen → đích khôi phục đúng", `data-export-dest=${banner.dest}, muốn ${DEST}`);
          } else {
            // Bấm nút tải bằng chuột thật → stub saveExportFile phải gọi đúng đích.
            await cdp.click(banner.downloadRect.x, banner.downloadRect.y);
            await sleep(1500);
            const calls = await cdp.evalJs(CALLS_FN);
            const saveCall = calls && calls.saveExportFile.find((c) => c.jobId === jobId);
            const anchorHit = calls && calls.anchors.length > 0;
            if (saveCall && saveCall.destPath === DEST && saveCall.status === 200 && saveCall.bytes === outputSize) {
              pass("H3 reopen → tải MP4 ghi đúng đích đã chọn", `saveExportFile job=${jobId} dest=${saveCall.destPath} bytes=${saveCall.bytes}`);
            } else {
              fail("H3 reopen → tải MP4 ghi đúng đích đã chọn", `saveCalls=${JSON.stringify(calls && calls.saveExportFile)}, anchors=${JSON.stringify(calls && calls.anchors)}`);
            }
            if (anchorHit) {
              fail("H3 reopen → KHÔNG rớt về anchor download", `anchor đã bấm: ${JSON.stringify(calls.anchors)}`);
            } else {
              pass("H3 reopen → KHÔNG rớt về anchor download", "không có anchor /download nào bị bấm");
            }
            await cdp.shot("v8-reopen-download.png");
          }
        }
      }
    }

    // ---- H4: xoá output trên đĩa → mở lại → missing, không nút tải ------
    if (jobId) {
      const outPath = path.join(BRIDGE_WORK_DIR, jobId, "output.mp4");
      if (!fs.existsSync(outPath)) {
        fail("H4 xoá output.mp4 khỏi đĩa", `không thấy file ${outPath}`);
      } else {
        fs.unlinkSync(outPath);
        log(`H4: đã xoá ${outPath}`);
        const headGone = await fetch(`${BRIDGE_URL}/api/render/${jobId}/download`, { method: "HEAD" });
        if (headGone.status !== 409) {
          fail("H4 HEAD sau khi xoá output → 409", `status=${headGone.status}`);
        } else {
          pass("H4 HEAD sau khi xoá output → 409", "bridge báo output đã mất");
        }
        await cdp.evalJs(CLOSE_MODAL_FN);
        await sleep(500);
        await cdp.send("Page.navigate", { url: DEV_URL });
        await waitMounted(cdp, null);
        await drainErrors(cdp);
        await openModalTopBar(cdp, "Xuất bản", "Xuất video");
        const openBtn = await cdp.evalJs(OPEN_RESULT_BTN_FN);
        if (!openBtn) {
          fail("H4 reopen → dòng done còn để mở", "không tìm thấy nút Xem kết quả (lịch sử có thể đã mất mục)");
        } else {
          await cdp.click(openBtn.x, openBtn.y);
          const banner = await cdp.waitFor(async () => {
            const b = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
            return b && b.hasBanner && b.state === "missing" ? b : null;
          }, "banner done chuyển missing sau HEAD check", 30000).catch(() => null);
          if (!banner) {
            const bNow = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
            fail("H4 reopen → banner báo output đã mất (state missing)", `banner=${JSON.stringify(bNow)}`);
          } else if (banner.hasDownloadBtn || !banner.missing || !banner.hasDeleteBtn) {
            fail("H4 reopen → ẩn nút tải + báo rõ + cho xoá", `banner=${JSON.stringify(banner)}`);
          } else {
            pass("H4 reopen → ẩn nút tải + báo rõ + cho xoá", `state=${banner.state}, missing=${banner.missing}, hasDeleteBtn=${banner.hasDeleteBtn}`);
            await cdp.shot("v8-output-missing.png");
            // Bấm "Xoá khỏi lịch sử" → mục biến mất khỏi lịch sử + localStorage.
            await cdp.click(banner.deleteRect.x, banner.deleteRect.y);
            await sleep(1000);
            const histAfterDel = await cdp.evalJs(HISTORY_FN);
            const lsAfterDel = await cdp.evalJs(HISTORY_LS_FN);
            const goneLs = Array.isArray(lsAfterDel) && !lsAfterDel.some((e) => e.id === jobId);
            if (histAfterDel && histAfterDel.count === 0 && goneLs) {
              pass("H4 xoá khỏi lịch sử khi output đã mất", "history count=0, localStorage không còn job");
            } else {
              fail("H4 xoá khỏi lịch sử khi output đã mất", `history=${JSON.stringify(histAfterDel)}, ls còn job=${!goneLs}`);
            }
          }
        }
      }
    }

    // ---- H5: 0 lỗi trang ----------------------------------------------------
    const errs = await drainErrors(cdp);
    if (errs.length === 0 && phaseErrors.length === 0) {
      pass("H5 0 lỗi trang", "không window.onerror / unhandledrejection cả phiên");
    } else {
      fail("H5 0 lỗi trang", `errors=${JSON.stringify([...phaseErrors, ...errs].slice(0, 5))}`);
    }
  } catch (e) {
    fail("harness", e.message || String(e));
    try { await cdp.shot("v8-harness-error.png"); } catch {}
  } finally {
    killAll();
    try {
      writeFileEpermRetry(path.join(SCRATCH, "v8-results.json"), JSON.stringify({ results, loadavg: fs.readFileSync("/proc/loadavg", "utf8").trim() }, null, 2));
    } catch { /* đợt EPERM: bỏ qua, kết quả đã in ra stdout */ }
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\nV8 export dest headed: ${results.filter((r) => r.ok).length}/${results.length} pass`);
  if (failed.length > 0) {
    console.log("FAILURES:");
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("lỗi harness:", e);
  process.exit(2);
});
