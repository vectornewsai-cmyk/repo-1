#!/usr/bin/env node
/**
 * clicktest-68v8-export-dest-electron.mjs — Phase 9 đợt 68, luồng V8:
 * đo headed THẬT trên Electron "đích export .mp4 bền qua reopen theo
 * jobId + kiểm tra download trước khi hiện nút tải" (đóng nợ đợt 67 U7
 * / ROUND67_LIMITS §5 mục 1–2), ở phía app desktop thật.
 *
 * Luồng đo (vite dev :5173 + Electron thật qua Xvfb + CDP; bridge do
 * ServiceManager của app tự khởi động, work dir <userData>/bridge-jobs):
 *   E0 app thật lên, `window.vcutDesktop` có mặt và BỊ FREEZE bởi
 *        contextBridge (không override được saveVideoDialog qua CDP) —
 *        vì vậy flow "chọn đích bằng dialog GTK thật" KHÔNG lái được
 *        trong harness này; phần đó đã được đo ở script Chrome
 *        (stub dialog trả đích cố định). Ở đây đo phần còn lại bằng
 *        seed lịch sử đúng shape mà startRender ghi (xem jobHistory67U7):
 *   E1 render THẬT qua bridge của app (POST multipart, clip thật) →
 *        job DONE, output.mp4 có trên đĩa → seed localStorage
 *        `vcut.jobHistory.v1` với entry done có exportDest=DEST →
 *        RELOAD (reopen) → mở ExportPanel → "Xem kết quả" → banner
 *        done (data-download-state="available", data-export-dest=DEST)
 *        → bấm nút tải bằng chuột thật → main process PHẢI ghi file
 *        thật ra DEST trên đĩa, size khớp outputSize, KHÔNG anchor.
 *   E2 xoá output.mp4 khỏi <userData>/bridge-jobs/<jobId>/ → reload →
 *        "Xem kết quả" → banner missing (data-download-state="missing"):
 *        KHÔNG nút tải, có chuỗi báo mất + nút "Xoá khỏi lịch sử" →
 *        bấm xoá → lịch sử rỗng + localStorage không còn mục.
 *   E3 0 lỗi trang trong cả phiên.
 *
 * Kiên cố với VM: ghi file qua exec bị EPERM theo đợt từ ~01:05 09/11
 * (xem LIMITS §6) — mọi process spawn bằng PIPE stdio + WriteStream
 * có guard on("error") (ghi log ra fd file mà gặp EPERM thì process
 * chết), chờ cửa sổ ghi được trước khi render, POST render retry.
 * TMPDIR NGẮN /tmp/round68-v8/tmp (không dùng đường dẫn sâu trong
 * scratch — Chromium đặt SingletonSocket dưới $TMPDIR, giới hạn ~108
 * ký tự).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-68v8-export-dest-electron.mjs
 * Env: V8E_DEBUG_PORT (mặc định 9237), V8E_DISPLAY (:266–:275),
 * V8E_SCRATCH (mặc định hidden_files/round68-v8/electron).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
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
const DESKTOP_DIR = path.join(ROOT, "apps", "desktop");
const SCRATCH = process.env.V8E_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v8", "electron");
const ELECTRON_BIN = path.join(ROOT, "node_modules", ".bin", "electron");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const CLIP = path.join(ROOT, "server", "render", "examples", "media", "clip1.mp4");
const USER_DATA = path.join(SCRATCH, "electron-userdata");
const BRIDGE_JOBS = path.join(USER_DATA, "bridge-jobs");
const DEST = path.join(SCRATCH, "v8-electron-export.mp4");
const DEV_PORT = 5173;
const DEBUG_PORT = Number(process.env.V8E_DEBUG_PORT || 9237);
const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;

const EXPECT_OPEN_RESULT_VI = "Xem kết quả";
const EXPECT_MISSING_VI = "Không còn file MP4 để tải";
const EXPECT_DELETE_HISTORY_VI = "Xoá khỏi lịch sử";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

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

async function portFree(p) {
  return new Promise((res) => {
    const s = net.createServer();
    s.once("error", () => res(false));
    s.once("listening", () => s.close(() => res(true)));
    s.listen(p, "127.0.0.1");
  });
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
    window.__v8anchors = [];
    window.addEventListener("error", (e) => { try { window.__v8errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__v8errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__v8errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__v8errors.push("unhandledrejection: <?>"); } });
    const _click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      try { if (this.href && this.href.includes("/download")) window.__v8anchors.push(this.href); } catch {}
      return _click.call(this);
    };
  }
  window.__v8boot = window.__v8boot || Math.random().toString(36).slice(2);
})()`;

const STORE_FN = `(async () => {
  const mod = window.__v8storeMod || (window.__v8storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
  };
})()`;

const HISTORY_LS_FN = `(() => { try { const a = JSON.parse(localStorage.getItem("vcut.jobHistory.v1") || "[]"); return Array.isArray(a) ? a : "not-array"; } catch { return "parse-error"; } })()`;

const HISTORY_FN = `(() => {
  const sec = document.querySelector(".job-history");
  if (!sec) return null;
  const rows = [...sec.querySelectorAll(".job-history-row")].map((r) => ({
    jobId: r.getAttribute("data-job-id") || null,
    status: r.getAttribute("data-status") || null,
    buttons: [...r.querySelectorAll("button")].map((b) => (b.textContent || "").trim()),
  }));
  return { count: Number(sec.getAttribute("data-history-count") || rows.length), rows };
})()`;

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
    missing: (banner.textContent || "").includes(${JSON.stringify(EXPECT_MISSING_VI)}),
    hasDeleteBtn: !!delBtn,
    deleteRect: delBtn ? (() => { delBtn.scrollIntoView({ block: "center" }); const r = delBtn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : null,
    text: (banner.textContent || "").trim().slice(0, 300),
  };
})()`;

const OPEN_RESULT_BTN_FN = `(() => {
  const row = document.querySelector('.job-history-row[data-status="done"]');
  if (!row) return null;
  const b = [...row.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(EXPECT_OPEN_RESULT_VI)});
  if (!b) return null;
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled, visible: r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight };
})()`;

const CLOSE_MODAL_FN = `(() => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return false; b.click(); return true; })()`;

/** Chờ tới khi ghi file được vào dir (qua đợt EPERM của VM).
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
  let vite = null, xvfb = null, electron = null;
  const phaseErrors = [];

  // SIGTERM cho Electron TRƯỚC (app tự tắt bridge của nó qua
  // ServiceManager khi quit bình thường); chỉ SIGKILL sau 8s nếu còn
  // sống — SIGKILL thẳng sẽ mồ côi bridge (nợ Phase 10, run1 đã gặp:
  // bridge :8787 còn chạy sau khi script kết thúc).
  const killAll = async () => {
    try { electron?.kill("SIGTERM"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    if (electron && electron.exitCode === null) {
      await sleep(8000);
      try { electron?.kill("SIGKILL"); } catch {}
    }
  };
  process.on("exit", () => {
    try { electron?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  });

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

  /** POST render thật lên bridge của app (FormData + clip fixture). */
  async function postRender(bridgeUrl) {
    const spec = { version: "0.2.0", meta: { name: "v8-electron", width: 320, height: 180, fps: 30 }, tracks: [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 1, src: "a.mp4", in: 0, out: 1 }] }] };
    const form = new FormData();
    form.append("spec", JSON.stringify(spec));
    form.append("preset", JSON.stringify({ crf: 23, x264Preset: "veryfast", audioBitrateKbps: 128 }));
    form.append("media", new Blob([fs.readFileSync(CLIP)], { type: "video/mp4" }), "a.mp4");
    const res = await fetch(`${bridgeUrl}/api/render`, { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  }

  async function getJob(bridgeUrl, id) {
    const r = await fetch(`${bridgeUrl}/api/render/${id}`);
    if (!r.ok) return null;
    return r.json();
  }

  try {
    const DISPLAY = process.env.V8E_DISPLAY || (await pickFreeDisplay(266, 275));
    if (!DISPLAY) throw new Error("hết display X trống :266–:275");
    if (!(await portFree(DEV_PORT))) throw new Error(`cổng vite ${DEV_PORT} đang bận — app desktop hardcode 127.0.0.1:5173, dừng tiến trình đang giữ rồi chạy lại`);
    if (!(await portFree(DEBUG_PORT))) throw new Error(`cổng CDP ${DEBUG_PORT} đang bận`);
    if (!fs.existsSync(ELECTRON_BIN)) throw new Error("không thấy electron binary");
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(CLIP)) throw new Error(`không thấy clip fixture ${CLIP}`);
    const TMPDIR = "/tmp/round68-v8/tmp";
    // TMPDIR NGẮN trong /tmp (không dùng đường dẫn sâu trong scratch):
    // Electron/Chromium đặt SingletonSocket dưới $TMPDIR, đường dẫn Unix
    // socket giới hạn ~108 ký tự — TMPDIR sâu (hidden_files/...) làm
    // Chromium chết FATAL "Socket path too long", không lấy được page
    // target CDP (bài học từ headed Chrome run2 19:18). /tmp còn ~97M
    // nhưng Electron chỉ để socket/lock nhỏ ở đây; dữ liệu thật nằm ở
    // user-data-dir trong scratch (đĩa home).
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(USER_DATA, { recursive: true, force: true });
    fs.mkdirSync(USER_DATA, { recursive: true });
    try { fs.unlinkSync(DEST); } catch {}
    const loadavg = fs.readFileSync("/proc/loadavg", "utf8").trim();
    log(`vite dev :${DEV_PORT}, CDP :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}, loadavg=${loadavg}`);

    // ---- Vite (config thật của apps/web) ----------------------------------
    const viteLogStream = fs.createWriteStream(path.join(SCRATCH, "v8e-vite.log"), { flags: "w" });
    viteLogStream.on("error", () => { /* đợt EPERM */ });
    // Vite với config thật của apps/web. --configLoader runner (thay vì
    // bundle mặc định): runner không ghi file tạm .vite-temp/*.mjs nên
    // tránh được lỗi EPERM "loadConfigFromBundledFile" của VM (xem LIMITS
    // §6); semantics config thật vẫn giữ nguyên như dev-desktop.
    vite = spawn(VITE_BIN, ["--configLoader", "runner", "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, TMPDIR } });
    vite.stdout.on("data", (d) => { try { viteLogStream.write(d); } catch {} });
    vite.stderr.on("data", (d) => { try { viteLogStream.write(d); } catch {} });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    // ---- Xvfb + Electron thật ----------------------------------------------
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const electronLogStream = fs.createWriteStream(path.join(SCRATCH, "v8e-electron.log"), { flags: "w" });
    electronLogStream.on("error", () => { /* đợt EPERM */ });
    const electronArgs = [".", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${USER_DATA}`];
    if (typeof process.getuid === "function" && process.getuid() === 0) electronArgs.push("--no-sandbox");
    electron = spawn(ELECTRON_BIN, electronArgs, {
      cwd: DESKTOP_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, VCUT_DESKTOP_DEV: "1", DISPLAY, TMPDIR },
    });
    electron.stdout.on("data", (d) => { try { electronLogStream.write(d); } catch {} });
    electron.stderr.on("data", (d) => { try { electronLogStream.write(d); } catch {} });
    electron.on("exit", (code, signal) => log(`electron exit code=${code} signal=${signal}`));

    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page" && p.url.startsWith(`http://127.0.0.1:${DEV_PORT}`));
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error(`không lấy được page target CDP của app (debug :${DEBUG_PORT})`);
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT_ERRORS });

    // ---- E0: app mount + vcutDesktop bị freeze ------------------------------
    await waitMounted(cdp, null);
    const s0 = await cdp.evalJs(STORE_FN).catch(() => null);
    const desktopInfo = await cdp.evalJs(`(() => {
      const api = window.vcutDesktop;
      if (!api) return null;
      return {
        hasApi: true,
        frozen: Object.isFrozen(api),
        hasSaveVideoDialog: typeof api.saveVideoDialog === "function",
        hasSaveExportFile: typeof api.saveExportFile === "function",
        hasGetBridgeUrl: typeof api.getBridgeUrl === "function",
      };
    })()`).catch(() => null);
    await drainErrors(cdp);
    if (desktopInfo && desktopInfo.hasApi && desktopInfo.frozen && desktopInfo.hasSaveVideoDialog && desktopInfo.hasSaveExportFile) {
      pass("E0 app Electron thật + vcutDesktop bị freeze", `frozen=${desktopInfo.frozen}, saveVideoDialog/saveExportFile/getBridgeUrl đều có; mẫu: ${JSON.stringify(s0)}`);
    } else {
      fail("E0 app Electron thật + vcutDesktop bị freeze", `desktopInfo=${JSON.stringify(desktopInfo)}, store=${JSON.stringify(s0)}`);
    }

    // ---- Bridge của app: lấy URL + chờ health -------------------------------
    const bridgeUrl = await cdp.waitFor(async () => {
      const u = await cdp.evalJs(`(async () => { try { return await window.vcutDesktop.getBridgeUrl(); } catch { return null; } })()`).catch(() => null);
      if (!u) return null;
      try { const r = await fetch(`${u}/api/health`); return r.ok ? u : null; } catch { return null; }
    }, "bridge của app lên (getBridgeUrl + /api/health)", 180000);
    log(`bridge của app: ${bridgeUrl} (jobs dir ${BRIDGE_JOBS})`);

    // ---- Render thật qua bridge của app --------------------------------------
    const okWrite = await waitForWritableDir(BRIDGE_JOBS, "bridge-jobs của app");
    if (!okWrite) throw new Error("bridge-jobs của app vẫn không ghi được sau ~3 phút (đợt EPERM dài)");
    let posted = null;
    for (let i = 1; i <= 6; i++) {
      posted = await postRender(bridgeUrl).catch((e) => ({ status: 0, body: { error: String(e) } }));
      if (posted.status === 201) break;
      log(`POST render lần ${i}: status=${posted.status} ${JSON.stringify(posted.body).slice(0, 200)} — chờ 8s thử lại`);
      if (i < 6) await sleep(8000);
    }
    if (!posted || posted.status !== 201 || !posted.body.jobId) {
      fail("E1 render thật qua bridge của app → 201", `posted=${JSON.stringify(posted)}`);
      throw new Error("không POST được render (xem log trên) — dừng script");
    }
    const jobId = posted.body.jobId;
    log(`job ${jobId} đã tạo — chờ DONE`);
    let job = null;
    // Poll 2s/lần (không 500ms): mọi GET /api/ đều tính vào quota
    // general 120/phút của bridge — poll 500ms suốt render 60s+ sẽ
    // đốt hết quota (bài học headed Chrome run3 19:20).
    for (let i = 0; i < 150; i++) {
      await sleep(2000);
      job = await getJob(bridgeUrl, jobId).catch(() => null);
      if (job && job.status === "done") break;
      if (job && (job.status === "error" || job.status === "interrupted" || job.status === "cancelled")) {
        throw new Error(`job ${jobId} về ${job.status} (error=${JSON.stringify(job.error || job.errorCode)})`);
      }
      job = null;
    }
    if (!job || job.status !== "done") throw new Error(`job ${jobId} chưa DONE sau 300s`);
    const outputSize = job.outputSize;
    const outPath = path.join(BRIDGE_JOBS, jobId, "output.mp4");
    if (!fs.existsSync(outPath) || fs.statSync(outPath).size !== outputSize) {
      fail("E1 render thật → output.mp4 trên đĩa", `outPath=${outPath} exists=${fs.existsSync(outPath)} size=${fs.existsSync(outPath) ? fs.statSync(outPath).size : -1} outputSize=${outputSize}`);
      throw new Error("output.mp4 không khớp — dừng script");
    }
    log(`job ${jobId} DONE, outputSize=${outputSize}, output.mp4 đã có trên đĩa`);

    // ---- Seed lịch sử (đúng shape startRender ghi) + RELOAD = reopen -------
    const entry = {
      id: jobId, jobId, kind: "render", status: "done", progress: 100,
      createdAt: typeof job.createdAt === "number" ? job.createdAt : Date.now(),
      updatedAt: Date.now(), projectName: null, presetLabel: null,
      outputName: typeof job.outputName === "string" ? job.outputName : "output.mp4",
      outputSize, error: null, note: null, exportDest: DEST,
    };
    await cdp.evalJs(`localStorage.setItem("vcut.jobHistory.v1", JSON.stringify([${JSON.stringify(entry)}]))`);
    const lsSeeded = await cdp.evalJs(HISTORY_LS_FN);
    if (!Array.isArray(lsSeeded) || lsSeeded.length !== 1 || lsSeeded[0].exportDest !== DEST) {
      fail("E1 seed lịch sử job có exportDest", `ls=${JSON.stringify(lsSeeded)}`);
      throw new Error("seed localStorage thất bại — dừng script");
    }
    log("đã seed lịch sử: 1 mục done, exportDest=DEST");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    await drainErrors(cdp);
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const histAfter = await cdp.evalJs(HISTORY_FN);
    const doneRow = histAfter && histAfter.rows.find((r) => r.jobId === jobId && r.status === "done");
    if (!doneRow) {
      fail("E1 reopen → lịch sử còn mục done", `history=${JSON.stringify(histAfter)}`);
    } else {
      const openBtn = await cdp.evalJs(OPEN_RESULT_BTN_FN);
      if (!openBtn) {
        fail("E1 reopen → nút Xem kết quả", "không tìm thấy nút trên dòng done");
      } else {
        await cdp.click(openBtn.x, openBtn.y);
        const banner = await cdp.waitFor(async () => {
          const b = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
          return b && b.hasBanner && (b.state === "available" || b.state === "unknown") ? b : null;
        }, "banner done sau Xem kết quả (state available/unknown)", 30000).catch(() => null);
        if (!banner) {
          const bNow = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
          fail("E1 reopen → banner done + nút tải sau HEAD check", `banner=${JSON.stringify(bNow)}`);
        } else if (!banner.hasDownloadBtn) {
          fail("E1 reopen → banner done + nút tải sau HEAD check", `banner có nhưng thiếu nút tải: ${JSON.stringify(banner)}`);
        } else if (banner.dest !== DEST) {
          fail("E1 reopen → đích khôi phục đúng", `data-export-dest=${banner.dest}, muốn ${DEST}`);
        } else {
          await cdp.click(banner.downloadRect.x, banner.downloadRect.y);
          // Main process ghi file thật ra DEST (không dialog — đích đã có sẵn).
          let written = null;
          for (let i = 0; i < 60; i++) {
            await sleep(500);
            try {
              if (fs.existsSync(DEST) && fs.statSync(DEST).size === outputSize) { written = fs.statSync(DEST).size; break; }
            } catch {}
          }
          const anchors = await cdp.evalJs(`(window.__v8anchors || []).slice()`).catch(() => []);
          if (written === outputSize) {
            pass("E1 reopen → tải MP4 ghi file thật ra đích đã chọn", `DEST=${DEST} bytes=${written} (khớp outputSize=${outputSize})`);
          } else {
            fail("E1 reopen → tải MP4 ghi file thật ra đích đã chọn", `DEST exists=${fs.existsSync(DEST)} size=${fs.existsSync(DEST) ? fs.statSync(DEST).size : -1} outputSize=${outputSize}`);
          }
          if (anchors.length > 0) {
            fail("E1 reopen → KHÔNG rớt về anchor download", `anchor đã bấm: ${JSON.stringify(anchors)}`);
          } else {
            pass("E1 reopen → KHÔNG rớt về anchor download", "không có anchor /download nào bị bấm");
          }
          await cdp.shot("v8e-reopen-download.png");
        }
      }
    }

    // ---- E2: xoá output trên đĩa → reopen → missing, không nút tải ---------
    if (fs.existsSync(outPath)) {
      fs.unlinkSync(outPath);
      log(`E2: đã xoá ${outPath}`);
      const headGone = await fetch(`${bridgeUrl}/api/render/${jobId}/download`, { method: "HEAD" });
      if (headGone.status !== 409) {
        fail("E2 HEAD sau khi xoá output → 409", `status=${headGone.status}`);
      } else {
        pass("E2 HEAD sau khi xoá output → 409", "bridge của app báo output đã mất");
      }
      await cdp.evalJs(CLOSE_MODAL_FN);
      await sleep(500);
      await cdp.send("Page.navigate", { url: DEV_URL });
      await waitMounted(cdp, null);
      await drainErrors(cdp);
      await openModalTopBar(cdp, "Xuất bản", "Xuất video");
      const openBtn = await cdp.evalJs(OPEN_RESULT_BTN_FN);
      if (!openBtn) {
        fail("E2 reopen → dòng done còn để mở", "không tìm thấy nút Xem kết quả");
      } else {
        await cdp.click(openBtn.x, openBtn.y);
        const banner = await cdp.waitFor(async () => {
          const b = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
          return b && b.hasBanner && b.state === "missing" ? b : null;
        }, "banner done chuyển missing sau HEAD check", 30000).catch(() => null);
        if (!banner) {
          const bNow = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
          fail("E2 reopen → banner báo output đã mất (state missing)", `banner=${JSON.stringify(bNow)}`);
        } else if (banner.hasDownloadBtn || !banner.missing || !banner.hasDeleteBtn) {
          fail("E2 reopen → ẩn nút tải + báo rõ + cho xoá", `banner=${JSON.stringify(banner)}`);
        } else {
          pass("E2 reopen → ẩn nút tải + báo rõ + cho xoá", `state=${banner.state}, missing=${banner.missing}, hasDeleteBtn=${banner.hasDeleteBtn}`);
          await cdp.shot("v8e-output-missing.png");
          await cdp.click(banner.deleteRect.x, banner.deleteRect.y);
          await sleep(1000);
          const histAfterDel = await cdp.evalJs(HISTORY_FN);
          const lsAfterDel = await cdp.evalJs(HISTORY_LS_FN);
          const goneLs = Array.isArray(lsAfterDel) && !lsAfterDel.some((e) => e.id === jobId);
          if (histAfterDel && histAfterDel.count === 0 && goneLs) {
            pass("E2 xoá khỏi lịch sử khi output đã mất", "history count=0, localStorage không còn job");
          } else {
            fail("E2 xoá khỏi lịch sử khi output đã mất", `history=${JSON.stringify(histAfterDel)}, ls còn job=${!goneLs}`);
          }
        }
      }
    } else {
      fail("E2 xoá output.mp4 khỏi đĩa", `không thấy file ${outPath} (đã bị xoá ở E1?)`);
    }

    // ---- E3: 0 lỗi trang ------------------------------------------------------
    const errs = await drainErrors(cdp);
    if (errs.length === 0 && phaseErrors.length === 0) {
      pass("E3 0 lỗi trang", "không window.onerror / unhandledrejection cả phiên");
    } else {
      fail("E3 0 lỗi trang", `errors=${JSON.stringify([...phaseErrors, ...errs].slice(0, 5))}`);
    }
  } catch (e) {
    fail("harness", e.message || String(e));
    try { await cdp.shot("v8e-harness-error.png"); } catch {}
  } finally {
    await killAll();
    try {
      writeFileEpermRetry(path.join(SCRATCH, "v8e-results.json"), JSON.stringify({ results, loadavg: fs.readFileSync("/proc/loadavg", "utf8").trim() }, null, 2));
    } catch { /* đợt EPERM: bỏ qua, kết quả đã in ra stdout */ }
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\nV8 export dest Electron: ${results.filter((r) => r.ok).length}/${results.length} pass`);
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
