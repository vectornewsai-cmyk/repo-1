#!/usr/bin/env node
/**
 * clicktest-66t8-resume-job-headed.mjs — Phase 9 đợt 66, luồng T8:
 * đo headed THẬT "resume job khi mở lại ExportPanel + nút ngôn ngữ
 * TopBar bấm được khi modal Export mở" (đóng nợ đợt 65 S10 /
 * ROUND65_LIMITS §8.7).
 *
 * Luồng đo (vite dev + bridge THẬT + Chromium headed qua Xvfb + CDP,
 * theo mẫu clicktest-65s10-job-note-locale-headed.mjs; KHÔNG mock,
 * KHÔNG stub poll):
 *   H0 setup: profile Chrome mới tinh (locale vi mặc định), project mẫu
 *        tự load (3 clip, media bin 2 item, media có file thật).
 *   H1 mở ExportPanel → chưa render nên `.render-note` PHẢI VẮNG.
 *   H2 bấm CTA "🎬 Xuất MP4 (1920×1080)" → render thật qua bridge; node
 *        poll `GET /api/render` mỗi 300ms; ngay khi job chuyển "running"
 *        thì ghi lại job id + progress lúc đó.
 *   H3 ĐÓNG modal giữa lúc render (nút X) → mở lại bằng nút Xuất bản →
 *        panel PHẢI nối lại đúng job (`.render-progress[data-job-id]`
 *        bằng id cũ), tiến trình không lùi, nhãn "Đã nối lại tiến trình
 *        xuất đang chạy." hiện (resume — khác S10 H7: mở lại không
 *        resume nay đã là hành vi cũ, bị thay bằng resume ở đợt 66 T8).
 *   H4 nút ngôn ngữ bấm được KHI MODAL ĐANG MỞ (nợ chính #2): chuột
 *        thật bấm nút cờ trong lúc modal mở + job đang chạy →
 *        `elementFromPoint` tại tâm nút PHẢI là chính nút đó (không
 *        phải backdrop), locale lật sang en (tiêu đề modal "Export
 *        video", nút "⬇ Publish"), modal vẫn mở, thanh tiến trình vẫn
 *        hiện; bấm lại → về vi ("Xuất video").
 *   H5 SIGKILL bridge giữa lúc render → restart bridge (cùng WORK_DIR
 *        + cổng) → job thành `interrupted` + noteCode
 *        JOB_RECOVERED_RESTART (bằng chứng server) → mở lại panel →
 *        trạng thái LỖI + `.render-note` chuỗi vi + nút "Render lại từ
 *        đầu" hiện (resume job retryable) → bấm nút bằng chuột thật →
 *        job chạy lại (status running, progress tăng tiếp).
 *   H6 MOBILE (Chrome mới 390×844, cùng vite + bridge): mở Export
 *        modal → đo chồng lấn nút cờ vs nút × của modal → `elementFromPoint`
 *        tại tâm nút cờ PHẢI là nút cờ → bấm chuột thật → locale lật en,
 *        modal vẫn mở; bấm lại → về vi.
 *   H7 0 lỗi trang trong cả phiên (desktop + mobile).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-66t8-resume-job-headed.mjs
 * Env: T8_DEV_PORT (mặc định tự chọn 5750–5759), T8_DEBUG_PORT (9850–9859),
 * T8_BRIDGE_PORT (8950–8959), T8_DISPLAY (mặc định :226–:235),
 * T8_SCRATCH (mặc định hidden_files/round66-t8/headed). TMPDIR riêng
 * /tmp/round66-t8/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG push/tag/binary. Ảnh chụp + log bridge/vite/chrome nằm ở SCRATCH.
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
const SCRATCH = process.env.T8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round66-t8", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round66-t8";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.t8.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round66-t8/bridge-work";

/** Chuỗi resume + note bridge gắn khi phục hồi — KHỚP fragment round66-t8 + jobQueue.js RECOVER_NOTE. */
const EXPECT_RESUMED_VI = "Đã nối lại tiến trình xuất đang chạy.";
const EXPECT_RESUMED_EN = "Resumed the running export job.";
const EXPECT_RETRY_VI = "Render lại từ đầu";
const EXPECT_NOTE_VI = "Phục hồi sau khi server restart — render lại từ đầu.";

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
    // Timeout dài (4 phút): VM chạy nhiều luồng round-66 song song,
    // load trung bình >30 (đo 12:06 08/11) nên một Runtime.evaluate
    // tầm thường cũng có thể mất >60s — timeout 60s cũ làm harness
    // chết oan giữa H4 ở lượt chạy 1 (xem LIMITS T8 §5).
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
  if (!window.__t8injected) {
    window.__t8injected = true;
    window.__t8errors = [];
    window.addEventListener("error", (e) => { try { window.__t8errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__t8errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__t8errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__t8errors.push("unhandledrejection: <?>"); } });
  }
  window.__t8boot = window.__t8boot || Math.random().toString(36).slice(2);
})()`;

/** Trạng thái store phục vụ đo: project mẫu + media. */
const STORE_FN = `(async () => {
  const mod = window.__t8storeMod || (window.__t8storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    duration: st.spec.tracks.reduce((mx, t) => Math.max(mx, ...t.clips.map((c) => c.start + c.duration)), 0),
  };
})()`;

/** Đọc .render-note trong trang: null = vắng, chuỗi = text hiện tại. */
const NOTE_FN = `(() => {
  const el = document.querySelector(".render-note");
  if (!el) return null;
  return { text: (el.textContent || "").trim(), role: el.getAttribute("role"), visible: el.getBoundingClientRect().width > 0 };
})()`;

/** Đọc locale hiện tại từ đúng module i18n của app. */
const GET_LANG_FN = `(() => { const m = window.__t8i18nMod; return m ? m.getLang() : "no-mod"; })()`;

/** Nạp module i18n của app (để GET_LANG_FN đọc được). */
const LOAD_I18N_FN = `(async () => {
  const m = window.__t8i18nMod || (window.__t8i18nMod = await import("/src/i18n/index.ts"));
  return m.getLang();
})()`;

/** Tìm nút CTA "Xuất MP4" trong ExportPanel, trả rect để bấm chuột thật. */
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

/** Tìm nút đổi ngôn ngữ TopBar (cờ 🇻🇳/🇺🇸), trả rect để bấm chuột thật. */
const LANG_BTN_FN = `(() => {
  const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes("🇻🇳") || (x.textContent || "").includes("🇺🇸"));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, flag: (b.textContent || "").trim(), visible: r.width > 0, cls: b.className, left: r.left, top: r.top, width: r.width, height: r.height };
})()`;

/** Phần tử nào đang ở tâm nút cờ — bằng chứng clickability (phải là chính nút cờ, không phải backdrop/modal). */
const LANG_HIT_FN = `(() => {
  const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes("🇻🇳") || (x.textContent || "").includes("🇺🇸"));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!el) return { hit: "none" };
  return { hit: el === b ? "button" : (b.contains(el) ? "button-child" : (el.className || el.tagName || "?").toString().slice(0, 60)), tag: el.tagName, cls: (el.className || "").toString().slice(0, 60) };
})()`;

/** Tiêu đề modal ExportPanel hiện tại (null = modal đã đóng). */
const MODAL_TITLE_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const head = dlg.querySelector(".modal-head");
  return head ? (head.textContent || "").trim() : null;
})()`;

/** Text nút Xuất bản trên TopBar (đổi theo locale: "⬇ Xuất bản" / "⬇ Publish"). */
const PUBLISH_BTN_FN = `(() => {
  const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes("Xuất bản") || (x.textContent || "").includes("Publish"));
  return b ? (b.textContent || "").trim() : null;
})()`;

/** Trạng thái khối tiến trình render trong panel: data-job-id + nhãn resume + có thanh progress không. */
const PROGRESS_FN = `(() => {
  const p = document.querySelector(".render-progress");
  if (!p) return null;
  return {
    jobId: p.getAttribute("data-job-id") || null,
    label: ((p.querySelector(".progress-label") || {}).textContent || "").trim(),
    hasBar: !!p.querySelector(".progress-bar"),
    resumedLabel: (p.textContent || "").includes(${JSON.stringify(EXPECT_RESUMED_VI)}) ? "vi" : ((p.textContent || "").includes(${JSON.stringify(EXPECT_RESUMED_EN)}) ? "en" : null),
  };
})()`;

/** Nút "Render lại từ đầu" trong dialog (null = chưa có).
 *  QUAN TRỌNG: .modal là overflow:hidden nên nội dung dài (banner lỗi
 *  + nút retry nằm cuối section mp4-export) có thể ở dưới fold — phải
 *  scrollIntoView như CTA_FN rồi mới đo rect, nếu không click sẽ trượt
 *  ra ngoài viewport (lượt chạy headed 1: click trượt, job ở yên
 *  interrupted 180s). */
const RETRY_BTN_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const b = [...dlg.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(EXPECT_RETRY_VI)});
  if (!b) return null;
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled, visible: r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight };
})()`;

/** Chồng lấn giữa nút cờ TopBar và nút × đóng modal (mobile): diện tích giao nhau. */
const OVERLAP_FN = `(() => {
  const lang = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes("🇻🇳") || (x.textContent || "").includes("🇺🇸"));
  const xBtn = document.querySelector('[role="dialog"] .modal-head .icon-btn');
  if (!lang || !xBtn) return null;
  const a = lang.getBoundingClientRect();
  const b = xBtn.getBoundingClientRect();
  const iw = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const ih = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return {
    lang: { x: Math.round(a.left), y: Math.round(a.top), w: Math.round(a.width), h: Math.round(a.height) },
    xBtn: { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) },
    overlapArea: Math.round(iw * ih),
    xBtnArea: Math.round(b.width * b.height),
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

/** Đóng modal bằng nút X (trả false nếu không có nút). */
const CLOSE_MODAL_FN = `(() => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return false; b.click(); return true; })()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null;
  let mobileChrome = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { mobileChrome?.kill("SIGKILL"); } catch {}
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
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__t8boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__t8errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__t8errors = []`).catch(() => {});
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

  /** Khởi động bridge (cùng cổng + WORK_DIR); chờ /api/health 200. */
  async function startBridge(port, workDir, logName) {
    const fd = fs.openSync(path.join(SCRATCH, logName), "w");
    const proc = spawn("node", [BRIDGE_ENTRY], {
      stdio: ["ignore", fd, fd],
      // Cách ly persist rate limiter theo script chạy (đợt 66 T9: mọi test
      // spawn bridge phải đặt BRIDGE_RATE_PERSIST_PATH riêng; cả 2 bridge
      // instance trong script dùng chung file này — đúng vì cùng 1 lượt test).
      env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR: workDir, BRIDGE_RATE_PERSIST_PATH: path.join(workDir, `rate-limit-${process.pid}.json`) },
    });
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

  /** Lấy job mới nhất từ bridge (GET /api/render). */
  async function latestJob(port) {
    const r = await fetch(`http://127.0.0.1:${port}/api/render?limit=1`);
    if (!r.ok) return null;
    const j = await r.json();
    const list = j.jobs || [];
    return list.length ? list[0] : null;
  }

  /** Lấy job theo id từ bridge. */
  async function getJob(port, id) {
    const r = await fetch(`http://127.0.0.1:${port}/api/render/${id}`);
    if (!r.ok) return null;
    return r.json();
  }

  /** Mở 1 Chrome headed mới trên cùng Xvfb, trả { chrome, cdp }. */
  async function launchChrome(debugPort, profile, winW, winH, logName, display, tmpdir) {
    const chromeLogFd = fs.openSync(path.join(SCRATCH, logName), "w");
    const proc = spawn(CHROME, ["--remote-debugging-port=" + debugPort, `--user-data-dir=${profile}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      `--window-size=${winW},${winH}`, "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display, TMPDIR: tmpdir } });
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

  try {
    const DEV_PORT = Number(process.env.T8_DEV_PORT || 0) || (await pickFreePort(5750, 5759));
    const DEBUG_PORT = Number(process.env.T8_DEBUG_PORT || 0) || (await pickFreePort(9850, 9859));
    const DEBUG_PORT_MOBILE = Number(process.env.T8_DEBUG_PORT_MOBILE || 0) || (await pickFreePort(9860, 9869));
    const BRIDGE_PORT = Number(process.env.T8_BRIDGE_PORT || 0) || (await pickFreePort(8950, 8959));
    const DISPLAY = process.env.T8_DISPLAY || (await pickFreeDisplay(226, 235));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5750–5759");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9850–9859");
    if (!DEBUG_PORT_MOBILE) throw new Error("hết cổng debug mobile trống 9860–9869");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8950–8959");
    if (!DISPLAY) throw new Error("hết display X trống :226–:235");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1248)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const PROFILE_MOBILE = path.join(SCRATCH, "chrome-userdata-mobile");
    const TMPDIR = "/tmp/round66-t8/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.rmSync(PROFILE_MOBILE, { recursive: true, force: true });
    // WORK_DIR mới tinh mỗi lần chạy: không còn job cũ làm nhiễu latestJob.
    fs.rmSync(BRIDGE_WORK_DIR, { recursive: true, force: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}/:${DEBUG_PORT_MOBILE}, bridge :${BRIDGE_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    // ---- Bridge lần 1 ------------------------------------------------------
    bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "t8-bridge-1.log");
    log(`bridge lần 1 OK: ${BRIDGE_URL} (WORK_DIR=${BRIDGE_WORK_DIR})`);

    // ---- Vite + Xvfb + Chrome desktop --------------------------------------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "t8-vite.log"), "w");
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
    const desk = await launchChrome(DEBUG_PORT, PROFILE, 1440, 900, "t8-chrome.log", DISPLAY, TMPDIR);
    chrome = desk.chrome;
    const cdp = desk.cdp;

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

    // ---- H1: mở ExportPanel, .render-note phải vắng trước khi render -----
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const noteBefore = await cdp.evalJs(NOTE_FN);
    if (noteBefore === null) pass("H1 .render-note vắng trước khi render", "job chưa có note → UI không hiện rác");
    else fail("H1 .render-note vắng trước khi render", `thấy note trước khi render: ${JSON.stringify(noteBefore)}`);
    await drainErrors(cdp);

    // ---- H2: bấm Xuất MP4 → render thật, ghi job id + progress ----------
    const cta = await cdp.evalJs(CTA_FN);
    if (!cta || !cta.found) throw new Error(`không tìm thấy CTA Xuất MP4 trong ExportPanel: ${JSON.stringify(cta)}`);
    log(`CTA Xuất MP4: "${cta.text}" tại (${cta.x}, ${cta.y})`);
    await cdp.click(cta.x, cta.y);
    let jobAtStart = null;
    const tStart0 = Date.now();
    while (Date.now() - tStart0 < 60000) {
      const j = await latestJob(BRIDGE_PORT).catch(() => null);
      if (j && (j.status === "running" || j.status === "queued")) { jobAtStart = j; break; }
      if (j && j.status === "done") { jobAtStart = j; break; }
      await sleep(300);
    }
    if (!jobAtStart) throw new Error("không thấy job nào xuất hiện trên bridge sau 60s kể từ khi bấm Xuất MP4");
    if (jobAtStart.status === "done") {
      fail("H2 render thật bắt đầu (job running)", `job render xong trước khi đo kịp (status done sau ${Date.now() - tStart0}ms) — mẫu render quá nhanh`);
    } else {
      pass("H2 render thật bắt đầu (job running)", `job ${jobAtStart.id} status=${jobAtStart.status} progress=${jobAtStart.progress}`);
    }
    const jobId = jobAtStart.id;
    const progressAtStart = jobAtStart.progress ?? 0;

    // ---- H3: đóng modal giữa lúc render → mở lại phải RESUME đúng job ----
    const closed = await cdp.evalJs(CLOSE_MODAL_FN).catch(() => false);
    if (!closed) throw new Error("H3: không bấm được nút X đóng modal");
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(MODAL_TITLE_FN).catch(() => "eval-loi");
      return t === null ? true : null;
    }, "modal đóng hẳn", 8000);
    const progressAtClose = (await getJob(BRIDGE_PORT, jobId).catch(() => null))?.progress ?? progressAtStart;
    log(`H3: progress lúc đóng modal: ${progressAtClose} (job ${jobId})`);
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const resumed = await cdp.waitFor(async () => {
      const p = await cdp.evalJs(PROGRESS_FN).catch(() => null);
      return p && p.jobId === jobId && p.resumedLabel === "vi" && p.hasBar ? p : null;
    }, "panel resume đúng job + nhãn vi", 15000).catch(() => null);
    if (resumed) {
      const progressAfter = (await getJob(BRIDGE_PORT, jobId).catch(() => null))?.progress ?? -1;
      if (progressAfter >= progressAtClose) {
        pass("H3 đóng modal → mở lại RESUME đúng job", `data-job-id=${resumed.jobId} (khớp job cũ), nhãn resume vi hiện, progress ${progressAtClose} → ${progressAfter} (không lùi, job vẫn chạy)`);
      } else {
        fail("H3 đóng modal → mở lại RESUME đúng job", `data-job-id khớp nhưng progress lùi ${progressAtClose} → ${progressAfter}`);
      }
    } else {
      const cur = await cdp.evalJs(PROGRESS_FN).catch(() => "eval-loi");
      fail("H3 đóng modal → mở lại RESUME đúng job", `.render-progress hiện tại: ${JSON.stringify(cur)} (chờ data-job-id=${jobId} + nhãn resume vi)`);
    }
    await cdp.shot("t8-resumed.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H4: nút cờ bấm được KHI MODAL ĐANG MỞ (desktop) ------------------
    const hitBefore = await cdp.evalJs(LANG_HIT_FN).catch(() => null);
    if (!hitBefore || (hitBefore.hit !== "button" && hitBefore.hit !== "button-child")) {
      fail("H4 nút cờ bấm được khi modal mở (desktop)", `elementFromPoint tại tâm nút cờ = ${JSON.stringify(hitBefore)} (chờ button — nút đang bị backdrop/modal che)`);
    } else {
      const langBtn = await cdp.evalJs(LANG_BTN_FN).catch(() => null);
      if (!langBtn || !langBtn.visible) {
        fail("H4 nút cờ bấm được khi modal mở (desktop)", `không tìm thấy nút cờ: ${JSON.stringify(langBtn)}`);
      } else {
        await cdp.click(langBtn.x, langBtn.y);
        const langNow = await cdp.evalJs(GET_LANG_FN).catch(() => "eval-loi");
        const publishNow = await cdp.evalJs(PUBLISH_BTN_FN).catch(() => null);
        const titleEn = await cdp.evalJs(MODAL_TITLE_FN).catch(() => null);
        const progressStillThere = await cdp.evalJs(`!!document.querySelector(".render-progress .progress-bar")`).catch(() => false);
        if (langNow === "en" && publishNow === "⬇ Publish" && titleEn && titleEn.includes("Export video") && progressStillThere) {
          // Bấm lại → về vi (chứng minh toggle 2 chiều khi modal mở).
          const langBtn2 = await cdp.evalJs(LANG_BTN_FN).catch(() => null);
          await cdp.click(langBtn2.x, langBtn2.y);
          const langBack = await cdp.evalJs(GET_LANG_FN).catch(() => "eval-loi");
          const titleVi = await cdp.evalJs(MODAL_TITLE_FN).catch(() => null);
          if (langBack === "vi" && titleVi && titleVi.includes("Xuất video")) {
            pass("H4 nút cờ bấm được khi modal mở (desktop)", `elementFromPoint=tâm nút là button (không bị backdrop che); bấm → en ("Export video", "⬇ Publish", modal vẫn mở, progress còn); bấm lại → vi ("Xuất video")`);
          } else {
            fail("H4 nút cờ bấm được khi modal mở (desktop)", `bấm lần 2: getLang=${JSON.stringify(langBack)}, tiêu đề=${JSON.stringify(titleVi)} (chờ vi / "Xuất video")`);
          }
        } else {
          fail("H4 nút cờ bấm được khi modal mở (desktop)", `sau khi bấm cờ: getLang=${JSON.stringify(langNow)}, nút Xuất bản=${JSON.stringify(publishNow)}, tiêu đề=${JSON.stringify(titleEn)}, progressBar=${progressStillThere}`);
        }
      }
    }
    await cdp.shot("t8-lang-while-modal-open.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H5: SIGKILL bridge → restart → mở lại panel resume job lỗi -----
    const closed5 = await cdp.evalJs(CLOSE_MODAL_FN).catch(() => false);
    if (!closed5) throw new Error("H5: không bấm được nút X đóng modal trước khi kill bridge");
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(MODAL_TITLE_FN).catch(() => "eval-loi");
      return t === null ? true : null;
    }, "modal đóng hẳn (H5)", 8000);
    let jobBeforeKill = await getJob(BRIDGE_PORT, jobId).catch(() => null);
    if (!jobBeforeKill || jobBeforeKill.status === "done") {
      fail("H5 SIGKILL + restart → resume job lỗi + retry", `job đã ${jobBeforeKill ? jobBeforeKill.status : "không đọc được"} trước khi kill (render xong quá nhanh, không kill kịp)`);
    } else {
      bridge.kill("SIGKILL");
      log(`đã SIGKILL bridge lúc job ${jobId} status=${jobBeforeKill.status} progress=${jobBeforeKill.progress}`);
      for (let i = 0; i < 30; i++) {
        const dead = await fetch(BRIDGE_URL + "/api/health").then(() => false).catch(() => true);
        if (dead) break;
        await sleep(500);
      }
      bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "t8-bridge-2.log");
      log("bridge lần 2 đã lên (cùng WORK_DIR, recover lúc boot)");
      const recovered = await cdp.waitFor(async () => {
        const j = await getJob(BRIDGE_PORT, jobId).catch(() => null);
        return j && j.noteCode ? j : null;
      }, "bridge lần 2 trả job có noteCode", 60000).catch(() => null);
      if (!recovered || recovered.status !== "interrupted" || recovered.noteCode !== "JOB_RECOVERED_RESTART") {
        fail("H5 SIGKILL + restart → resume job lỗi + retry", `job sau restart: ${JSON.stringify(recovered)} (chờ status=interrupted + noteCode=JOB_RECOVERED_RESTART)`);
      } else {
        log(`job sau restart: status=${recovered.status} noteCode=${recovered.noteCode}`);
        await openModalTopBar(cdp, "Xuất bản", "Xuất video");
        const errState = await cdp.waitFor(async () => {
          const n = await cdp.evalJs(NOTE_FN).catch(() => null);
          const retry = await cdp.evalJs(RETRY_BTN_FN).catch(() => null);
          const resumedTxt = await cdp.evalJs(`(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.textContent.includes(${JSON.stringify(EXPECT_RESUMED_VI)}) : false; })()`).catch(() => false);
          return n && n.text === EXPECT_NOTE_VI && retry && retry.visible && resumedTxt ? { note: n, retry } : null;
        }, "panel resume job lỗi: note vi + nút retry + nhãn resume", 15000).catch(() => null);
        if (!errState) {
          const cur = { note: await cdp.evalJs(NOTE_FN).catch(() => "eval-loi"), retry: await cdp.evalJs(RETRY_BTN_FN).catch(() => "eval-loi") };
          fail("H5 SIGKILL + restart → resume job lỗi + retry", `trạng thái lỗi sau khi mở lại: ${JSON.stringify(cur)} (chờ note vi + nút "Render lại từ đầu" + nhãn resume)`);
        } else {
          log(`resume job lỗi: note vi + nút retry hiện; bấm retry…`);
          log(`nút retry tại (${errState.retry.x}, ${errState.retry.y})`);
          await cdp.click(errState.retry.x, errState.retry.y);
          // Fail nhanh nếu click trượt: retry thành công thì panel phải
          // chuyển sang rendering ngay (retryRender set trạng thái
          // trước cả khi GET trạng thái mới về) — không thấy progress
          // trong 20s nghĩa là click không tới nút (lượt chạy 1).
          const renderingAfterRetry = await cdp.waitFor(async () => {
            const p = await cdp.evalJs(`!!document.querySelector(".render-progress")`).catch(() => null);
            return p ? true : null;
          }, "panel chuyển sang rendering sau khi bấm retry", 20000).catch(() => null);
          if (!renderingAfterRetry) {
            const diag = { modal: await cdp.evalJs(MODAL_TITLE_FN).catch(() => "eval-loi"), note: await cdp.evalJs(NOTE_FN).catch(() => "eval-loi"), retryNow: await cdp.evalJs(RETRY_BTN_FN).catch(() => "eval-loi"), job: await getJob(BRIDGE_PORT, jobId).catch(() => null) };
            fail("H5 SIGKILL + restart → resume job lỗi + retry", `bấm retry nhưng panel không chuyển sang rendering trong 20s (click trượt?): ${JSON.stringify(diag)}`);
          } else {
            // Chờ job chạy lại: status running + progress tăng (2 mẫu cách nhau, chống kẹt ở progress cũ).
            let retryOk = false; let retryDetail = "";
            const tR0 = Date.now();
            let prev = null;
            while (Date.now() - tR0 < 180000) {
              const j = await getJob(BRIDGE_PORT, jobId).catch(() => null);
              if (!j) { await sleep(2000); continue; }
              if (j.status === "running") {
                if (prev !== null && typeof j.progress === "number" && j.progress > prev) { retryOk = true; retryDetail = `status=running, progress ${prev} → ${j.progress} (tăng tiếp sau retry)`; break; }
                if (prev === null) prev = typeof j.progress === "number" ? j.progress : 0;
              }
              if (j.status === "done") { retryOk = true; retryDetail = `job đã done sau retry (render lại xong)`; break; }
              await sleep(2000);
            }
            if (retryOk) pass("H5 SIGKILL + restart → resume job lỗi + retry", `job interrupted + note vi hiện lại sau khi mở panel; bấm "Render lại từ đầu" bằng chuột thật → ${retryDetail}`);
            else fail("H5 SIGKILL + restart → resume job lỗi + retry", `sau khi bấm retry 180s, job không chạy lại/tăng progress (last=${JSON.stringify(await getJob(BRIDGE_PORT, jobId).catch(() => null))})`);
          }
        }
      }
    }
    await cdp.shot("t8-after-retry.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H6: MOBILE 390×844 — nút cờ bấm được khi modal mở ---------------
    const mob = await launchChrome(DEBUG_PORT_MOBILE, PROFILE_MOBILE, 390, 844, "t8-chrome-mobile.log", DISPLAY, TMPDIR);
    mobileChrome = mob.chrome;
    const mcdp = mob.cdp;
    await mcdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(mcdp, null);
    const sMob = await mcdp.evalJs(STORE_FN).catch(() => null);
    await mcdp.evalJs(LOAD_I18N_FN).catch(() => null);
    await drainErrors(mcdp);
    if (!sMob || sMob.clipCount !== 3) {
      fail("H6 mobile: setup + nút cờ bấm được khi modal mở", `mẫu mobile không load được: state=${JSON.stringify(sMob)}`);
    } else {
      await openModalTopBar(mcdp, "Xuất bản", "Xuất video");
      const overlap = await mcdp.evalJs(OVERLAP_FN).catch(() => null);
      log(`H6 mobile overlap nút cờ vs nút × modal: ${JSON.stringify(overlap)}`);
      const hitMob = await mcdp.evalJs(LANG_HIT_FN).catch(() => null);
      if (!hitMob || (hitMob.hit !== "button" && hitMob.hit !== "button-child")) {
        fail("H6 mobile: setup + nút cờ bấm được khi modal mở", `elementFromPoint tại tâm nút cờ = ${JSON.stringify(hitMob)} (chờ button)`);
      } else {
        const langBtn = await mcdp.evalJs(LANG_BTN_FN).catch(() => null);
        await mcdp.click(langBtn.x, langBtn.y);
        const langNow = await mcdp.evalJs(GET_LANG_FN).catch(() => "eval-loi");
        const titleEn = await mcdp.evalJs(MODAL_TITLE_FN).catch(() => null);
        if (langNow === "en" && titleEn && titleEn.includes("Export video")) {
          const langBtn2 = await mcdp.evalJs(LANG_BTN_FN).catch(() => null);
          await mcdp.click(langBtn2.x, langBtn2.y);
          const langBack = await mcdp.evalJs(GET_LANG_FN).catch(() => "eval-loi");
          const titleVi = await mcdp.evalJs(MODAL_TITLE_FN).catch(() => null);
          if (langBack === "vi" && titleVi && titleVi.includes("Xuất video")) {
            const ov = overlap ? `chồng lấn nút cờ vs nút ×: ${overlap.overlapArea}px² trên ${overlap.xBtnArea}px² (nút × vẫn bấm được phần còn lại / đóng bằng backdrop)` : "không đo được chồng lấn";
            pass("H6 mobile: setup + nút cờ bấm được khi modal mở", `390×844: elementFromPoint=tâm nút là button; bấm → en ("Export video"), bấm lại → vi ("Xuất video"), modal vẫn mở; ${ov}`);
          } else {
            fail("H6 mobile: setup + nút cờ bấm được khi modal mở", `bấm lần 2: getLang=${JSON.stringify(langBack)}, tiêu đề=${JSON.stringify(titleVi)}`);
          }
        } else {
          fail("H6 mobile: setup + nút cờ bấm được khi modal mở", `sau khi bấm cờ: getLang=${JSON.stringify(langNow)}, tiêu đề=${JSON.stringify(titleEn)}`);
        }
      }
      await mcdp.shot("t8-mobile-lang.png").catch(() => {});
      await drainErrors(mcdp);
    }

    // ---- H7: 0 lỗi trang ---------------------------------------------------
    if (phaseErrors.length === 0) pass("H7 0 lỗi trang", "không có window.onerror / unhandledrejection cả phiên (desktop + mobile)");
    else fail("H7 0 lỗi trang", `${phaseErrors.length} lỗi: ${phaseErrors.slice(0, 3).join(" || ")}`);
  } catch (e) {
    results.push({ name: "HARNESS", ok: false, detail: (e && e.stack) || String(e) });
    log(`HARNESS LỖI: ${(e && e.message) || e}`);
  } finally {
    killAll();
    await sleep(500);
    writeFileEpermRetry(path.join(SCRATCH, "t8-results.json"), JSON.stringify({ results, logLines }, null, 2));
    const nPass = results.filter((r) => r.ok).length;
    log(`KẾT QUẢ: ${nPass}/${results.length} pass`);
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    process.exit(results.every((r) => r.ok) ? 0 : 1);
  }
}

main();
