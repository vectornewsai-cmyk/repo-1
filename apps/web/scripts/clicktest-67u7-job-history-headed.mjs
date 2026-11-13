#!/usr/bin/env node
/**
 * clicktest-67u7-job-history-headed.mjs — Phase 9 đợt 67, luồng U7:
 * đo headed THẬT "UI lịch sử job + nhánh `interrupted` trong poll khi
 * bridge restart + resume upload khi đóng panel" (đóng nợ đợt 66 T8 /
 * ROUND66_LIMITS §8.7).
 *
 * Luồng đo (vite dev + bridge THẬT + Chromium headed qua Xvfb + CDP,
 * theo mẫu clicktest-66t8-resume-job-headed.mjs; KHÔNG mock, KHÔNG
 * stub poll):
 *   H0 setup: profile Chrome mới tinh (locale vi mặc định), project mẫu
 *        tự load (3 clip, media bin 2 item, media có file thật).
 *   H1 mở ExportPanel → chưa render nên `.render-note` PHẢI VẮNG và
 *        lịch sử PHẢI RỖNG (data-history-count=0, "Chưa có lần xuất nào.").
 *   H2 bấm CTA "🎬 Xuất MP4 (1920×1080)" → render thật qua bridge; node
 *        poll `GET /api/render` mỗi 300ms; ngay khi job chuyển "running"
 *        thì ghi lại job id + progress lúc đó.
 *   H3 PANEL ĐANG MỞ + SIGKILL bridge → restart bridge (cùng WORK_DIR +
 *        cổng) → job thành `interrupted` + noteCode JOB_RECOVERED_RESTART
 *        (bằng chứng server) → panel PHẢI tự chuyển sang trạng thái LỖI
 *        mà KHÔNG CẦN mở lại (nhánh `interrupted` mới trong pollStatus):
 *        `.valid-banner.bad` + `.render-note` chuỗi vi + nút "Render lại
 *        từ đầu" hiện + dòng lịch sử của job có data-status="interrupted".
 *   H4 bấm nút "Render lại từ đầu" bằng chuột thật → job chạy lại
 *        (status running, progress tăng tiếp) → chờ job DONE (≤300s).
 *   H5 ĐÓNG modal → mở lại → lịch sử PHẢI có mục done của job vừa xong
 *        → bấm "Xem kết quả" → banner done + nút "⬇ Tải xuống MP4" hiện
 *        (không idle mù như T8 §5.1).
 *   H6 ĐÓNG PANEL GIỮA LÚC UPLOAD: throttle upload qua CDP
 *        (Network.emulateNetworkConditions, throughput tính theo tổng
 *        byte media thật để upload kéo dài ~30s) → bấm CTA → thấy nhãn
 *        "Đang tải media lên..." → ĐÓNG modal giữa lúc upload → mở lại
 *        → panel PHẢI hiện trạng thái uploading + ghi chú "Đang tải file
 *        lên máy chủ…" (chờ job, không POST lại) → chờ panel nối đúng job
 *        mới (`.render-progress[data-job-id]` khác job H2) → bridge chỉ
 *        có ĐÚNG 1 job tạo sau phiên upload (không nhân đôi) → tắt
 *        throttle → job chạy tiếp (progress > 0) → huỷ bằng nút "Huỷ".
 *   H7 xoá mục lịch sử: bấm "Xoá" trên dòng job vừa huỷ → dòng biến mất
 *        (data-history-count giảm 1) + localStorage không còn id đó.
 *   H8 0 lỗi trang trong cả phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-67u7-job-history-headed.mjs
 * Env: U7_DEV_PORT (mặc định tự chọn 5780–5789), U7_DEBUG_PORT (9890–9899),
 * U7_BRIDGE_PORT (8970–8979), U7_DISPLAY (mặc định :246–:255),
 * U7_SCRATCH (mặc định hidden_files/round67-u7/headed). TMPDIR riêng
 * /tmp/round67-u7/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
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
const SCRATCH = process.env.U7_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round67-u7", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round67-u7";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.u7.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round67-u7/bridge-work";

/** Chuỗi resume + note bridge gắn khi phục hồi — KHỚP fragment round66-t8 + jobQueue.js RECOVER_NOTE. */
const EXPECT_RESUMED_VI = "Đã nối lại tiến trình xuất đang chạy.";
const EXPECT_RETRY_VI = "Render lại từ đầu";
const EXPECT_NOTE_VI = "Phục hồi sau khi server restart — render lại từ đầu.";
/** Chuỗi fragment round67-u7 (lịch sử job). */
const EXPECT_HISTORY_TITLE_VI = "Lịch sử xuất";
const EXPECT_HISTORY_EMPTY_VI = "Chưa có lần xuất nào.";
const EXPECT_UPLOAD_WAITING_VI = "Đang tải file lên máy chủ";
const EXPECT_OPEN_RESULT_VI = "Xem kết quả";
const EXPECT_DELETE_VI = "Xoá";
const EXPECT_STATUS_DONE_VI = "Xong";
const EXPECT_DOWNLOAD_VI = "⬇ Tải xuống MP4";
const EXPECT_CANCELLED_VI = "Đã huỷ render.";
const EXPECT_UPLOADING_LABEL_VI = "Đang tải media lên...";

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
    // Timeout dài (4 phút): VM chạy nhiều luồng round-67 song song nên
    // một Runtime.evaluate tầm thường cũng có thể mất >60s (bài học T8).
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
  if (!window.__u7injected) {
    window.__u7injected = true;
    window.__u7errors = [];
    window.addEventListener("error", (e) => { try { window.__u7errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__u7errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__u7errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__u7errors.push("unhandledrejection: <?>"); } });
  }
  window.__u7boot = window.__u7boot || Math.random().toString(36).slice(2);
})()`;

/** Trạng thái store phục vụ đo: project mẫu + media. */
const STORE_FN = `(async () => {
  const mod = window.__u7storeMod || (window.__u7storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    duration: st.spec.tracks.reduce((mx, t) => Math.max(mx, ...t.clips.map((c) => c.start + c.duration)), 0),
  };
})()`;

/** Tổng byte media có file thật (để tính throttle upload cho H6). */
const MEDIA_BYTES_FN = `(async () => {
  const mod = window.__u7storeMod || (window.__u7storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  let total = 0; const per = [];
  for (const m of st.media) { if (m.file) { total += m.file.size; per.push({ name: m.name, size: m.file.size }); } }
  return { total, per };
})()`;

/** Đọc .render-note trong trang: null = vắng, chuỗi = text hiện tại. */
const NOTE_FN = `(() => {
  const el = document.querySelector(".render-note");
  if (!el) return null;
  return { text: (el.textContent || "").trim(), role: el.getAttribute("role"), visible: el.getBoundingClientRect().width > 0 };
})()`;

/** Đọc locale hiện tại từ đúng module i18n của app. */
const GET_LANG_FN = `(() => { const m = window.__u7i18nMod; return m ? m.getLang() : "no-mod"; })()`;

/** Nạp module i18n của app (để GET_LANG_FN đọc được). */
const LOAD_I18N_FN = `(async () => {
  const m = window.__u7i18nMod || (window.__u7i18nMod = await import("/src/i18n/index.ts"));
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

/** Tiêu đề modal ExportPanel hiện tại (null = modal đã đóng). */
const MODAL_TITLE_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const head = dlg.querySelector(".modal-head");
  return head ? (head.textContent || "").trim() : null;
})()`;

/** Trạng thái khối tiến trình render trong panel: data-job-id + nhãn + có thanh progress không. */
const PROGRESS_FN = `(() => {
  const p = document.querySelector(".render-progress");
  if (!p) return null;
  return {
    jobId: p.getAttribute("data-job-id") || null,
    label: ((p.querySelector(".progress-label") || {}).textContent || "").trim(),
    text: (p.textContent || "").trim().slice(0, 400),
    hasBar: !!p.querySelector(".progress-bar"),
  };
})()`;

/** Nút "Render lại từ đầu" trong dialog (null = chưa có). Modal là
 *  overflow:hidden nên phải scrollIntoView rồi mới đo rect (bài học T8). */
const RETRY_BTN_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const b = [...dlg.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(EXPECT_RETRY_VI)});
  if (!b) return null;
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled, visible: r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight };
})()`;

/** Nút "Huỷ" render trong dialog (null = chưa có). */
const CANCEL_BTN_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const b = [...dlg.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Huỷ");
  if (!b) return null;
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled, visible: r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight };
})()`;

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

/** Nút "Xoá" trên dòng lịch sử có status cho trước (null = chưa có). */
const DELETE_BTN_FN = (status) => `(() => {
  const row = document.querySelector('.job-history-row[data-status="${status}"]');
  if (!row) return null;
  const b = [...row.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === ${JSON.stringify(EXPECT_DELETE_VI)});
  if (!b) return null;
  b.scrollIntoView({ block: "center" });
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, jobId: row.getAttribute("data-job-id") || null };
})()`;

/** Banner done + nút tải MP4 (null = chưa xong). */
const DONE_BANNER_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const banner = dlg.querySelector(".mp4-export .valid-banner.ok");
  if (!banner) return null;
  const btn = [...banner.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Tải xuống MP4"));
  return { hasBanner: true, hasDownloadBtn: !!btn, text: (banner.textContent || "").trim().slice(0, 200) };
})()`;

/** Đóng modal bằng nút X (trả false nếu không có nút). */
const CLOSE_MODAL_FN = `(() => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return false; b.click(); return true; })()`;

/** Phiên upload đang bay trong localStorage (null = không có). */
const UPLOAD_SESSION_FN = `(() => { try { return JSON.parse(localStorage.getItem("vcut.uploadSession.v1") || "null"); } catch { return "parse-error"; } })()`;

/** Lịch sử job trong localStorage (mảng id, để đối chiếu sau khi xoá). */
const HISTORY_LS_FN = `(() => { try { const a = JSON.parse(localStorage.getItem("vcut.jobHistory.v1") || "[]"); return Array.isArray(a) ? a.map((e) => e.id) : "not-array"; } catch { return "parse-error"; } })()`;

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
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__u7boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__u7errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__u7errors = []`).catch(() => {});
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
    const DEV_PORT = Number(process.env.U7_DEV_PORT || 0) || (await pickFreePort(5780, 5789));
    const DEBUG_PORT = Number(process.env.U7_DEBUG_PORT || 0) || (await pickFreePort(9890, 9899));
    const BRIDGE_PORT = Number(process.env.U7_BRIDGE_PORT || 0) || (await pickFreePort(8970, 8979));
    const DISPLAY = process.env.U7_DISPLAY || (await pickFreeDisplay(246, 255));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5780–5789");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9890–9899");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8970–8979");
    if (!DISPLAY) throw new Error("hết display X trống :246–:255");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1248)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round67-u7/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // WORK_DIR mới tinh mỗi lần chạy: không còn job cũ làm nhiễu latestJob.
    fs.rmSync(BRIDGE_WORK_DIR, { recursive: true, force: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, bridge :${BRIDGE_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    // ---- Bridge lần 1 ------------------------------------------------------
    bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "u7-bridge-1.log");
    log(`bridge lần 1 OK: ${BRIDGE_URL} (WORK_DIR=${BRIDGE_WORK_DIR})`);

    // ---- Vite + Xvfb + Chrome desktop --------------------------------------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "u7-vite.log"), "w");
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
    const desk = await launchChrome(DEBUG_PORT, PROFILE, 1440, 900, "u7-chrome.log", DISPLAY, TMPDIR);
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

    // ---- H1: mở ExportPanel, .render-note vắng + lịch sử rỗng -------------
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const noteBefore = await cdp.evalJs(NOTE_FN);
    const histBefore = await cdp.evalJs(HISTORY_FN);
    if (noteBefore === null && histBefore && histBefore.count === 0 && histBefore.title === EXPECT_HISTORY_TITLE_VI) {
      pass("H1 .render-note vắng + lịch sử rỗng trước khi render", `note vắng; section "${histBefore.title}" count=0 ("${EXPECT_HISTORY_EMPTY_VI}")`);
    } else {
      fail("H1 .render-note vắng + lịch sử rỗng trước khi render", `note=${JSON.stringify(noteBefore)}, history=${JSON.stringify(histBefore)}`);
    }
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

    // ---- H3: PANEL ĐANG MỞ + SIGKILL bridge → restart → nhánh interrupted
    // (KHÔNG đóng/mở lại panel — nhánh poll mới phải tự chuyển trạng thái).
    let jobBeforeKill = await getJob(BRIDGE_PORT, jobId).catch(() => null);
    if (!jobBeforeKill || jobBeforeKill.status === "done") {
      fail("H3 panel mở + restart → nhánh interrupted hiện ngay", `job đã ${jobBeforeKill ? jobBeforeKill.status : "không đọc được"} trước khi kill (render xong quá nhanh, không kill kịp)`);
    } else {
      bridge.kill("SIGKILL");
      log(`đã SIGKILL bridge lúc job ${jobId} status=${jobBeforeKill.status} progress=${jobBeforeKill.progress} (panel vẫn mở)`);
      for (let i = 0; i < 30; i++) {
        const dead = await fetch(BRIDGE_URL + "/api/health").then(() => false).catch(() => true);
        if (dead) break;
        await sleep(500);
      }
      bridge = await startBridge(BRIDGE_PORT, BRIDGE_WORK_DIR, "u7-bridge-2.log");
      log("bridge lần 2 đã lên (cùng WORK_DIR, recover lúc boot)");
      const recovered = await cdp.waitFor(async () => {
        const j = await getJob(BRIDGE_PORT, jobId).catch(() => null);
        return j && j.noteCode ? j : null;
      }, "bridge lần 2 trả job có noteCode", 60000).catch(() => null);
      if (!recovered || recovered.status !== "interrupted" || recovered.noteCode !== "JOB_RECOVERED_RESTART") {
        fail("H3 panel mở + restart → nhánh interrupted hiện ngay", `job sau restart: ${JSON.stringify(recovered)} (chờ status=interrupted + noteCode=JOB_RECOVERED_RESTART)`);
      } else {
        log(`job sau restart: status=${recovered.status} noteCode=${recovered.noteCode}`);
        const errState = await cdp.waitFor(async () => {
          const n = await cdp.evalJs(NOTE_FN).catch(() => null);
          const retry = await cdp.evalJs(RETRY_BTN_FN).catch(() => null);
          const bannerBad = await cdp.evalJs(`!!document.querySelector(".mp4-export .valid-banner.bad")`).catch(() => false);
          const progGone = await cdp.evalJs(`!document.querySelector(".render-progress")`).catch(() => false);
          const hist = await cdp.evalJs(HISTORY_FN).catch(() => null);
          const histInterrupted = hist && hist.rows.some((r) => r.jobId === jobId && r.status === "interrupted");
          return n && n.text === EXPECT_NOTE_VI && retry && retry.visible && bannerBad && progGone && histInterrupted
            ? { note: n, retry, hist } : null;
        }, "panel tự chuyển lỗi khi đang mở: note vi + nút retry + banner lỗi + lịch sử interrupted", 60000).catch(() => null);
        if (!errState) {
          const cur = {
            note: await cdp.evalJs(NOTE_FN).catch(() => "eval-loi"),
            retry: await cdp.evalJs(RETRY_BTN_FN).catch(() => "eval-loi"),
            bannerBad: await cdp.evalJs(`!!document.querySelector(".mp4-export .valid-banner.bad")`).catch(() => "eval-loi"),
            progressGone: await cdp.evalJs(`!document.querySelector(".render-progress")`).catch(() => "eval-loi"),
            hist: await cdp.evalJs(HISTORY_FN).catch(() => "eval-loi"),
          };
          fail("H3 panel mở + restart → nhánh interrupted hiện ngay", `trạng thái sau restart (panel KHÔNG đóng/mở lại): ${JSON.stringify(cur)} (chờ note vi + nút "Render lại từ đầu" + banner lỗi + progress biến mất + dòng lịch sử interrupted)`);
        } else {
          pass("H3 panel mở + restart → nhánh interrupted hiện ngay", `panel đang mở tự chuyển lỗi (không cần mở lại): note vi + nút retry + banner lỗi + progress biến mất; lịch sử có dòng job ${jobId} status=interrupted`);
        }
      }
    }
    await cdp.shot("u7-interrupted.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H4: bấm retry bằng chuột thật → job chạy lại → chờ DONE ---------
    const retryBtn = await cdp.evalJs(RETRY_BTN_FN).catch(() => null);
    if (!retryBtn || !retryBtn.visible) {
      fail("H4 retry → job chạy lại → DONE", `không tìm thấy nút retry: ${JSON.stringify(retryBtn)}`);
    } else {
      log(`nút retry tại (${retryBtn.x}, ${retryBtn.y})`);
      await cdp.click(retryBtn.x, retryBtn.y);
      const renderingAfterRetry = await cdp.waitFor(async () => {
        const p = await cdp.evalJs(`!!document.querySelector(".render-progress")`).catch(() => null);
        return p ? true : null;
      }, "panel chuyển sang rendering sau khi bấm retry", 20000).catch(() => null);
      if (!renderingAfterRetry) {
        fail("H4 retry → job chạy lại → DONE", "bấm retry nhưng panel không chuyển sang rendering trong 20s (click trượt?)");
      } else {
        let retryOk = false; let retryDetail = "";
        const tR0 = Date.now();
        let prev = null;
        while (Date.now() - tR0 < 300000) {
          const j = await getJob(BRIDGE_PORT, jobId).catch(() => null);
          if (!j) { await sleep(2000); continue; }
          if (j.status === "running") {
            if (prev !== null && typeof j.progress === "number" && j.progress > prev) { retryDetail = `status=running, progress ${prev} → ${j.progress} (tăng tiếp sau retry)`; }
            if (prev === null) prev = typeof j.progress === "number" ? j.progress : 0;
          }
          if (j.status === "done") { retryOk = true; retryDetail = `job DONE sau retry (${retryDetail || `progress cuối ${j.progress}`})`; break; }
          await sleep(2000);
        }
        if (retryOk) pass("H4 retry → job chạy lại → DONE", `bấm "Render lại từ đầu" bằng chuột thật → ${retryDetail}`);
        else fail("H4 retry → job chạy lại → DONE", `sau khi bấm retry 300s, job không DONE (last=${JSON.stringify(await getJob(BRIDGE_PORT, jobId).catch(() => null))})`);
      }
    }
    await drainErrors(cdp);

    // ---- H5: đóng modal → mở lại → lịch sử có job done → Xem kết quả ----
    const closed5 = await cdp.evalJs(CLOSE_MODAL_FN).catch(() => false);
    if (!closed5) throw new Error("H5: không bấm được nút X đóng modal");
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(MODAL_TITLE_FN).catch(() => "eval-loi");
      return t === null ? true : null;
    }, "modal đóng hẳn (H5)", 8000);
    await openModalTopBar(cdp, "Xuất bản", "Xuất video");
    const histAfterReopen = await cdp.waitFor(async () => {
      const h = await cdp.evalJs(HISTORY_FN).catch(() => null);
      return h && h.rows.some((r) => r.jobId === jobId && r.status === "done") ? h : null;
    }, "lịch sử có mục done của job vừa xong", 15000).catch(() => null);
    if (!histAfterReopen) {
      const cur = await cdp.evalJs(HISTORY_FN).catch(() => "eval-loi");
      fail("H5 đóng/mở panel → lịch sử job done → Xem kết quả", `lịch sử sau khi mở lại: ${JSON.stringify(cur)} (chờ dòng job ${jobId} status=done)`);
    } else {
      const doneRow = histAfterReopen.rows.find((r) => r.jobId === jobId);
      const openBtn = await cdp.evalJs(OPEN_RESULT_BTN_FN).catch(() => null);
      if (!openBtn || !openBtn.visible) {
        fail("H5 đóng/mở panel → lịch sử job done → Xem kết quả", `lịch sử có dòng done (${JSON.stringify(doneRow)}) nhưng không thấy nút "Xem kết quả": ${JSON.stringify(openBtn)}`);
      } else {
        await cdp.click(openBtn.x, openBtn.y);
        const doneBanner = await cdp.waitFor(async () => {
          const d = await cdp.evalJs(DONE_BANNER_FN).catch(() => null);
          return d && d.hasBanner && d.hasDownloadBtn ? d : null;
        }, "banner done + nút tải MP4 sau khi bấm Xem kết quả", 15000).catch(() => null);
        if (!doneBanner) {
          const cur = await cdp.evalJs(DONE_BANNER_FN).catch(() => "eval-loi");
          fail("H5 đóng/mở panel → lịch sử job done → Xem kết quả", `sau khi bấm "Xem kết quả": ${JSON.stringify(cur)} (chờ banner done + nút "⬇ Tải xuống MP4", không idle)`);
        } else {
          pass("H5 đóng/mở panel → lịch sử job done → Xem kết quả", `mở lại panel thấy dòng lịch sử job ${jobId} status=${EXPECT_STATUS_DONE_VI}; bấm "Xem kết quả" → banner done + nút "⬇ Tải xuống MP4" hiện (không idle)`);
        }
      }
    }
    await cdp.shot("u7-history-done.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H6: đóng panel giữa lúc UPLOAD → mở lại resume upload -----------
    // Throttle upload qua CDP: tổng byte media thật / 30s ≈ tốc độ để
    // upload kéo dài ~30s (đủ đóng/mở panel giữa chừng, đủ nhanh để chờ
    // job xuất hiện trong hạn 120s của panel).
    const mediaBytes = await cdp.evalJs(MEDIA_BYTES_FN).catch(() => null);
    if (!mediaBytes || !mediaBytes.total || mediaBytes.total <= 0) {
      fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `không đo được tổng byte media: ${JSON.stringify(mediaBytes)}`);
    } else {
      const throughput = Math.max(8192, Math.floor(mediaBytes.total / 30));
      log(`H6: tổng media ${mediaBytes.total} byte (${JSON.stringify(mediaBytes.per)}) → throttle upload ${throughput} B/s (~${Math.round(mediaBytes.total / throughput)}s)`);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: throughput });
      const cta6 = await cdp.evalJs(CTA_FN);
      if (!cta6 || !cta6.found) {
        fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `không tìm thấy CTA Xuất MP4: ${JSON.stringify(cta6)}`);
      } else {
        await cdp.click(cta6.x, cta6.y);
        const uploadingSeen = await cdp.waitFor(async () => {
          const p = await cdp.evalJs(PROGRESS_FN).catch(() => null);
          return p && p.label.includes(EXPECT_UPLOADING_LABEL_VI) ? p : null;
        }, "panel hiện nhãn Đang tải media lên...", 15000).catch(() => null);
        if (!uploadingSeen) {
          fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `sau khi bấm Xuất, panel không hiện nhãn upload trong 15s: ${JSON.stringify(await cdp.evalJs(PROGRESS_FN).catch(() => "eval-loi"))}`);
        } else {
          // ĐÓNG modal NGAY giữa lúc upload đang bay (POST chưa xong).
          const closed6 = await cdp.evalJs(CLOSE_MODAL_FN).catch(() => false);
          if (!closed6) throw new Error("H6: không bấm được nút X đóng modal giữa lúc upload");
          await cdp.waitFor(async () => {
            const t = await cdp.evalJs(MODAL_TITLE_FN).catch(() => "eval-loi");
            return t === null ? true : null;
          }, "modal đóng hẳn (H6)", 8000);
          // Session upload phải còn trong localStorage sau khi đóng panel.
          const session = await cdp.evalJs(UPLOAD_SESSION_FN).catch(() => null);
          if (!session || typeof session.startedAt !== "number") {
            fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `đóng panel xong không còn phiên upload trong localStorage: ${JSON.stringify(session)} (upload đã xong quá nhanh / session không được ghi)`);
          } else {
            const sessionStart = session.startedAt;
            log(`H6: phiên upload còn lại sau khi đóng panel: startedAt=${sessionStart}`);
            await openModalTopBar(cdp, "Xuất bản", "Xuất video");
            const waitingSeen = await cdp.waitFor(async () => {
              const p = await cdp.evalJs(PROGRESS_FN).catch(() => null);
              return p && p.label.includes(EXPECT_UPLOADING_LABEL_VI) && p.text.includes(EXPECT_UPLOAD_WAITING_VI) ? p : null;
            }, "panel mở lại hiện uploading + ghi chú chờ job", 15000).catch(() => null);
            if (!waitingSeen) {
              const cur = await cdp.evalJs(PROGRESS_FN).catch(() => "eval-loi");
              fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `mở lại panel không thấy trạng thái chờ upload: ${JSON.stringify(cur)} (chờ nhãn upload + ghi chú "${EXPECT_UPLOAD_WAITING_VI}")`);
            } else {
              // Chờ panel nối đúng job mới (khác job H2).
              const attached = await cdp.waitFor(async () => {
                const p = await cdp.evalJs(PROGRESS_FN).catch(() => null);
                return p && p.jobId && p.jobId !== jobId ? p : null;
              }, "panel nối job mới sau upload (data-job-id khác job H2)", 150000).catch(() => null);
              if (!attached) {
                const cur = await cdp.evalJs(PROGRESS_FN).catch(() => "eval-loi");
                fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `150s sau khi mở lại, panel chưa nối job mới: ${JSON.stringify(cur)}`);
              } else {
                const newJobId = attached.jobId;
                // Không nhân đôi upload: bridge chỉ có ĐÚNG 1 job tạo
                // sau khi phiên upload bắt đầu (dung sai 5s).
                const listRes = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/render?limit=50`);
                const listJson = await listRes.json();
                const createdAfter = (listJson.jobs || []).filter((j) => typeof j.createdAt === "number" && j.createdAt >= sessionStart - 5000);
                // Tắt throttle để job chạy tiếp bình thường.
                await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
                if (createdAfter.length !== 1) {
                  fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `panel nối job ${newJobId} nhưng bridge có ${createdAfter.length} job tạo sau phiên upload (chờ đúng 1 — nhân đôi upload?): ${JSON.stringify(createdAfter.map((j) => ({ id: j.id, status: j.status })))}`);
                } else {
                  // Job mới phải chạy tiếp thật (progress > 0 sau khi tắt throttle).
                  let runningOk = false;
                  const tU0 = Date.now();
                  while (Date.now() - tU0 < 120000) {
                    const j = await getJob(BRIDGE_PORT, newJobId).catch(() => null);
                    if (j && j.status === "running" && typeof j.progress === "number" && j.progress > 0) { runningOk = true; break; }
                    if (j && j.status === "done") { runningOk = true; break; }
                    await sleep(2000);
                  }
                  if (!runningOk) {
                    fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `job mới ${newJobId} không chạy tiếp sau khi tắt throttle (last=${JSON.stringify(await getJob(BRIDGE_PORT, newJobId).catch(() => null))})`);
                  } else {
                    // Huỷ job mới bằng nút "Huỷ" để khỏi chờ render xong.
                    const cancelBtn = await cdp.evalJs(CANCEL_BTN_FN).catch(() => null);
                    if (!cancelBtn || !cancelBtn.visible) {
                      fail("H6 đóng panel giữa lúc upload → mở lại resume upload", `job mới chạy tiếp nhưng không thấy nút "Huỷ": ${JSON.stringify(cancelBtn)}`);
                    } else {
                      await cdp.click(cancelBtn.x, cancelBtn.y);
                      const cancelledSeen = await cdp.waitFor(async () => {
                        const d = await cdp.evalJs(`(() => { const dlg = document.querySelector('[role="dialog"]'); return dlg ? dlg.textContent.includes(${JSON.stringify(EXPECT_CANCELLED_VI)}) : false; })()`).catch(() => null);
                        return d ? true : null;
                      }, "panel hiện 'Đã huỷ render.' sau khi bấm Huỷ", 15000).catch(() => null);
                      if (!cancelledSeen) {
                        fail("H6 đóng panel giữa lúc upload → mở lại resume upload", "bấm Huỷ nhưng panel không hiện 'Đã huỷ render.' trong 15s");
                      } else {
                        pass("H6 đóng panel giữa lúc upload → mở lại resume upload", `đóng panel giữa lúc upload → mở lại thấy uploading + ghi chú chờ job; panel nối job mới ${newJobId} (khác job H2); bridge chỉ có 1 job tạo sau phiên upload (không nhân đôi); job chạy tiếp rồi huỷ được`);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      // Tắt throttle cho chắc (dù H6 pass hay fail).
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }).catch(() => {});
    }
    await cdp.shot("u7-upload-resumed.png").catch(() => {});
    await drainErrors(cdp);

    // ---- H7: xoá mục lịch sử ----------------------------------------------
    const histBeforeDel = await cdp.evalJs(HISTORY_FN).catch(() => null);
    const cancelledRow = histBeforeDel && histBeforeDel.rows.find((r) => r.status === "cancelled");
    if (!histBeforeDel || !cancelledRow) {
      fail("H7 xoá mục lịch sử", `không thấy dòng cancelled để xoá: ${JSON.stringify(histBeforeDel)}`);
    } else {
      const delBtn = await cdp.evalJs(DELETE_BTN_FN("cancelled")).catch(() => null);
      if (!delBtn) {
        fail("H7 xoá mục lịch sử", `không thấy nút "Xoá" trên dòng cancelled: ${JSON.stringify(histBeforeDel)}`);
      } else {
        const countBefore = histBeforeDel.count;
        await cdp.click(delBtn.x, delBtn.y);
        const afterDel = await cdp.waitFor(async () => {
          const h = await cdp.evalJs(HISTORY_FN).catch(() => null);
          return h && h.count === countBefore - 1 && !h.rows.some((r) => r.jobId === cancelledRow.jobId) ? h : null;
        }, "dòng cancelled biến mất, count giảm 1", 10000).catch(() => null);
        if (!afterDel) {
          fail("H7 xoá mục lịch sử", `sau khi bấm Xoá: ${JSON.stringify(await cdp.evalJs(HISTORY_FN).catch(() => "eval-loi"))} (chờ count ${countBefore - 1}, không còn job ${cancelledRow.jobId})`);
        } else {
          const lsIds = await cdp.evalJs(HISTORY_LS_FN).catch(() => null);
          if (Array.isArray(lsIds) && lsIds.includes(cancelledRow.jobId)) {
            fail("H7 xoá mục lịch sử", `dòng đã biến khỏi UI nhưng localStorage vẫn còn id ${cancelledRow.jobId}: ${JSON.stringify(lsIds)}`);
          } else {
            pass("H7 xoá mục lịch sử", `bấm "Xoá" trên dòng job ${cancelledRow.jobId} (cancelled) → count ${countBefore} → ${afterDel.count}, localStorage không còn id đó`);
          }
        }
      }
    }
    await drainErrors(cdp);

    // ---- H8: 0 lỗi trang ---------------------------------------------------
    if (phaseErrors.length === 0) pass("H8 0 lỗi trang", "không có window.onerror / unhandledrejection cả phiên");
    else fail("H8 0 lỗi trang", `${phaseErrors.length} lỗi: ${phaseErrors.slice(0, 3).join(" || ")}`);
  } catch (e) {
    results.push({ name: "HARNESS", ok: false, detail: (e && e.stack) || String(e) });
    log(`HARNESS LỖI: ${(e && e.message) || e}`);
  } finally {
    killAll();
    await sleep(500);
    writeFileEpermRetry(path.join(SCRATCH, "u7-results.json"), JSON.stringify({ results, logLines }, null, 2));
    const nPass = results.filter((r) => r.ok).length;
    log(`KẾT QUẢ: ${nPass}/${results.length} pass`);
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    process.exit(results.every((r) => r.ok) ? 0 : 1);
  }
}

main();
