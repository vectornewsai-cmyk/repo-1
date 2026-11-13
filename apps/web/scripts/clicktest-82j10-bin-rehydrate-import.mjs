#!/usr/bin/env node
/**
 * clicktest-82j10-bin-rehydrate-import.mjs — Phase 9 đợt 82, luồng J10:
 * đóng nợ O2 còn lại sau đợt 59 P1:
 * (a) P1 đã đổi thiết kế bin theo spec (autosave mang manifest binMedia)
 *     và kiểm chứng bằng media MẪU (B4). Chưa ai kiểm lại bằng media
 *     USER IMPORT thật: import file → xóa hết clip khỏi timeline →
 *     reload → bin còn không? Đây là repro chính của luồng này.
 * (b) Toast "đã điền style mặc định…" lặp lại mỗi lần reload — P1 đã sửa
 *     2 nguồn sinh style thiếu italic (sample.ts, store.addTextClip) và
 *     kiểm chứng headed B1/B2/B3 không lặp. Luồng này kiểm chứng lại
 *     trên đường import + xóa hết clip + reload liên tiếp (J2/J3/J4),
 *     đồng thời rà soát code mọi nơi còn sinh text clip (captions,
 *     captionFollow, subtitles, templates) xem còn nguồn thiếu style nào.
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-59p1-bin-persist-toast.mjs
 * (HMR tắt bằng config tạm; profile Chrome mới tinh).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   J0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item mau-1/mau-2.webm) → chờ autosave ghi xong:
 *        envelope phải chứa cả 2 src mẫu VÀ binMedia đủ 2 entry.
 *   J1 import thật: set file input ẩn của MediaBin bằng file mp4 test
 *        (ffmpeg testsrc 2s, /tmp/round82-j10/j10-import.mp4) → bin 3
 *        item (file thật + assetId) → chờ autosave binMedia 3 entry.
 *   J2 reload #1 (media import CHƯA có clip nào): reload → assert bin
 *        VẪN 3 item (điểm khác P1 B4: media import không clip cũng bền),
 *        timeline 3 clip, missing null, KHÔNG toast "đã điền style".
 *   J3 xóa HẾT clip rồi reload: thêm j10-import.mp4 vào timeline (nút
 *        ＋ Thêm trên card của nó) → chọn hết clip (click + Shift+click)
 *        → Delete → timeline 0 clip, bin vẫn 3 → chờ autosave (srcs 0,
 *        binMedia 3) → reload → assert bin VẪN 3 item, timeline 0 clip,
 *        missing null, KHÔNG toast style.
 *   J4 reload #2 (không sửa gì): assert bin vẫn 3 + KHÔNG toast style
 *        (toast không lặp trên cùng một autosave đã lành).
 *   J5 xóa chủ đích media import khỏi bin: bấm ✕ trên card
 *        j10-import.mp4 (chuột thật, dialog confirm tự accept) → bin
 *        còn 2 (chỉ mẫu) → chờ autosave binMedia 2 → reload → assert
 *        bin vẫn 2 item, missing null (media import không hồi lại).
 *   H9 0 lỗi trang trong phiên (gộp qua các lần reload).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs
 * Env: J10_DEV_PORT (mặc định tự chọn 5490–5499), J10_DEBUG_PORT (9590–9599),
 * J10_DISPLAY (mặc định :165 — display RIÊNG của J10, không dùng chung),
 * J10_SCRATCH (mặc định hidden_files/round82-j10/headed). TMPDIR riêng
 * /tmp/round82-j10/tmp. File import: J10_IMPORT (mặc định
 * /tmp/round82-j10/j10-import.mp4). Exit 0 mọi case PASS, 1 có FAIL,
 * 2 harness lỗi. KHÔNG push/tag/binary.
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
const SCRATCH = process.env.J10_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round82-j10", "headed");
const IMPORT_FILE = process.env.J10_IMPORT || "/tmp/round82-j10/j10-import.mp4";
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"));
const CHROME = process.env.J10_CHROME || CHROME_CANDIDATES.find((c) => fs.existsSync(c))
  || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1187", "chrome-linux", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round82-j10";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.p1.config.mjs");

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
  async setFileInput(files) {
    await this.send("DOM.enable");
    const doc = await this.send("DOM.getDocument", { depth: -1 });
    const q = await this.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" });
    if (!q.nodeId) throw new Error("không tìm thấy input file của MediaBin");
    await this.send("DOM.setFileInputFiles", { files, nodeId: q.nodeId });
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
  window.__j10errors = [];
  window.addEventListener("error", (e) => { try { window.__j10errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__j10errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__j10errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__j10errors.push("unhandledrejection: <?>"); } });
  // Marker phát hiện trang bị reload giữa chừng (HMR/full-reload do file
  // luồng khác đổi): sau reload mọi window.* đều mất nên marker mất theo.
  window.__j10boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu O2): import /src/store.ts qua
// performance resource entries rồi dùng useStore.getState().
// Chỉ dùng để ĐỌC state + setup, mọi thao tác dưới test đều là
// chuột/phím thật qua CDP (trừ bơm seed thiếu style ở B3 — can thiệp
// localStorage có chủ đích để tái hiện seed cũ).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__j10storeMod || (window.__j10storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Snapshot trạng thái thật từ store + DOM media bin.
const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, trackKind: t.kind, clipId: c.id, kind: c.kind,
    start: +c.start.toFixed(3), duration: +c.duration.toFixed(3),
    in: c.in ?? null, out: c.out ?? null, src: c.src ?? null,
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
    mediaEmptyVisible: !!document.querySelector(".media-empty"),
    relinkVisible: !!document.querySelector(".relink-panel, [class*='relink-panel']"),
    errors: (window.__j10errors || []).slice(),
  };
})()`;

// Autosave trong localStorage: envelope { spec, name, savedAt, session?, binMedia? }.
const AUTOSAVE_FN = `(() => {
  const raw = localStorage.getItem("vcut-studio:autosave:v1");
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const srcs = [];
    let textItalic = "khong-co-text-clip";
    for (const t of (d.spec && d.spec.tracks) || []) for (const c of t.clips || []) {
      if (c.src) srcs.push(c.src);
      if (c.kind === "text" && c.style) textItalic = ("italic" in c.style) ? c.style.italic : "THIEU-italic";
    }
    return { savedAt: d.savedAt || null, name: d.name || null, srcs,
      binMedia: Array.isArray(d.binMedia) ? d.binMedia : null,
      textItalic };
  } catch (e) { return { error: String(e) }; }
})()`;

// Bơm seed thiếu style (B3): xóa `italic` khỏi style text clip trong
// autosave (giữ nguyên binMedia + spec) để tái hiện seed cũ.
const STALE_SEED_FN = `(() => {
  const raw = localStorage.getItem("vcut-studio:autosave:v1");
  if (!raw) return { ok: false, error: "no autosave" };
  const d = JSON.parse(raw);
  let found = false;
  for (const t of d.spec.tracks || []) for (const c of t.clips || []) {
    if (c.kind === "text" && c.style && "italic" in c.style) { delete c.style.italic; found = true; }
  }
  if (!found) return { ok: false, error: "no text style with italic" };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(d));
  return { ok: true };
})()`;

// Toast đang hiện trên màn hình (tự đóng sau 4.5s nên phải đọc sớm).
const TOASTS_FN = `[...document.querySelectorAll(".toast-msg")].map((e) => e.textContent || "")`;

// Hình học thật của clip để tính tọa độ click (mẫu O2).
const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

// Tọa độ nút ✕ (media-remove) của card đầu tiên + tên card đó.
const REMOVE_BTN_FN = `(() => {
  const btns = [...document.querySelectorAll(".media-remove")];
  if (btns.length === 0) return null;
  const b = btns[0].getBoundingClientRect();
  const card = btns[0].closest(".media-card");
  const name = card ? (card.querySelector(".media-name") || {}).textContent : null;
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, name, count: btns.length };
})()`;

// Tọa độ nút "＋ Thêm" (media-add) của card đầu tiên.
const ADD_BTN_FN = `(() => {
  const btns = [...document.querySelectorAll(".media-add")];
  if (btns.length === 0) return null;
  const b = btns[0].getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, count: btns.length };
})()`;

// Tọa độ nút (media-add / media-remove) của card có tên cho trước.
const CARD_BTN_FN = (name, cls) => `(() => {
  const cards = [...document.querySelectorAll(".media-card")];
  const card = cards.find((c) => (c.querySelector(".media-name") || {}).textContent === ${JSON.stringify(name)});
  if (!card) return null;
  const btn = card.querySelector(${JSON.stringify(cls)});
  if (!btn) return null;
  // Lưới media cuộn được: card thứ 3 nằm dưới nếp gấp, rect ngoài
  // viewport → click trượt. Cuộn card vào tầm nhìn trước rồi mới đo.
  btn.scrollIntoView({ block: "nearest" });
  const b = btn.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, name: ${JSON.stringify(name)} };
})()`;

const hasStyleToast = (toasts) => (toasts || []).some((m) => m.includes("đã điền style") || m.includes("Đã điền style"));

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

  // Sau reload: window.* mất hết → inject lại listener lỗi + boot marker,
  // chờ app mount lại, trả về boot mới.
  async function afterReload(cdp) {
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount lại sau reload (topbar có VCut Studio, splash đã tắt)", 240000);
    const boot = await cdp.evalJs(`window.__j10boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function bootOk(cdp, boot) {
    return (await cdp.evalJs(`window.__j10boot`).catch(() => null)) === boot;
  }

  // Gom lỗi trang của phase hiện tại rồi reset để phase sau đo riêng.
  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__j10errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__j10errors = []`).catch(() => {});
    return e;
  }

  // Toast khôi phục được push sau rehydrate (async) nên phải chờ một
  // nhịp sau khi state đã đủ rồi mới đọc (toast sống 4.5s).
  async function readToastsSoon(cdp) {
    await sleep(1500);
    return (await cdp.evalJs(TOASTS_FN).catch(() => [])) || [];
  }

  try {
    const DEV_PORT = Number(process.env.J10_DEV_PORT || 0) || (await pickFreePort(5490, 5499));
    const DEBUG_PORT = Number(process.env.J10_DEBUG_PORT || 0) || (await pickFreePort(9590, 9599));
    const DISPLAY = process.env.J10_DISPLAY || ":165";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5490–5499");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9590–9599");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (P1 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round82-j10/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tắt HMR (tự tạo lại — /tmp mất sau reboot, xem LIMITS O2 §4):
    // luồng khác sửa .tsx/.ts giữa chừng không reload trang đang test.
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "j10-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "j10-chrome.log"), "w");
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
    await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");

    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- J0: project mẫu tự load + autosave ghi xong (srcs + binMedia) ----
    const t0 = Date.now();
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
    }, "project mẫu tự load (3 clip, media bin 2 item)", 180000);
    const loadMs = Date.now() - t0;
    const names0 = s0.media.map((m) => m.name).sort();
    const filesOk0 = s0.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob);
    const auto0 = await cdp.waitFor(async () => {
      const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
      return a && a.srcs && a.srcs.includes("mau-1.webm") && a.srcs.includes("mau-2.webm")
        && Array.isArray(a.binMedia) && a.binMedia.length === 2 ? a : null;
    }, "autosave ghi xong (envelope chứa mau-1/mau-2.webm + binMedia 2 entry)", 60000);
    log(`B0: load mẫu ${loadMs}ms; autosave savedAt=${auto0.savedAt}; binMedia=${JSON.stringify(auto0.binMedia)}; textItalic=${JSON.stringify(auto0.textItalic)}`);
    await drainErrors(cdp);
    if (names0.join(",") === "mau-1.webm,mau-2.webm" && filesOk0
      && s0.videoClips.length === 2 && s0.textClips.length === 1
      && auto0.textItalic === false) {
      pass("J0 setup: mẫu tự load + autosave mang binMedia", `3 clip (v1 [0–4, 4–8], t1 [0.5–5.5]), media bin 2 item ${names0.join(", ")} (file thật ${s0.media.map((m) => m.fileSize).join("/")} byte, blob: URL), autosave savedAt=${auto0.savedAt}, binMedia 2 entry, text clip style đã có italic:false (load ${loadMs}ms)`);
    } else {
      fail("J0 setup: mẫu tự load + autosave mang binMedia", `media=${JSON.stringify(s0.media)}, clips=${s0.clipCount}, autosave=${JSON.stringify(auto0)}`);
    }
    await cdp.shot("j10-b0-sample-loaded.png");

    // ---- J1: import file thật qua input ẩn của MediaBin ----
    {
      if (!fs.existsSync(IMPORT_FILE)) throw new Error(`không thấy file import ${IMPORT_FILE}`);
      const importSize = fs.statSync(IMPORT_FILE).size;
      await ensureNoModal(cdp);
      await cdp.setFileInput([IMPORT_FILE]);
      const s1i = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        const imp = t && t.media.find((m) => m.name === "j10-import.mp4");
        return t && t.mediaCount === 3 && imp && imp.hasFile && imp.fileSize === importSize && imp.assetId ? t : null;
      }, "import xong: bin 3 item, j10-import.mp4 có file thật + assetId", 120000);
      const impItem = s1i.media.find((m) => m.name === "j10-import.mp4");
      const auto1 = await cdp.waitFor(async () => {
        const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
        return a && Array.isArray(a.binMedia) && a.binMedia.length === 3
          && a.binMedia.some((e) => e.name === "j10-import.mp4") ? a : null;
      }, "autosave ghi xong sau import (binMedia 3 entry, có j10-import.mp4)", 60000);
      await drainErrors(cdp);
      log(`J1: import ${importSize} byte; binMedia=${JSON.stringify(auto1.binMedia)}`);
      if (impItem.urlBlob && auto1.textItalic === false) {
        pass("J1 import file thật: bin 3 item + autosave binMedia 3", `j10-import.mp4 (${importSize} byte, file thật, blob: URL, assetId ${impItem.assetId}) vào bin; autosave binMedia 3 entry`);
      } else {
        fail("J1 import file thật: bin 3 item + autosave binMedia 3", `media=${JSON.stringify(s1i.media)}, autosave=${JSON.stringify(auto1)}`);
      }
      await cdp.shot("j10-j1-imported.png");
    }


    // ---- J2: reload #1 (sau import) → bin 3 + KHÔNG toast style ----
    {
      const t1 = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot1 = await afterReload(cdp);
      const s1 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.mediaCount === 3 && t.clipCount === 3 ? t : null;
      }, "sau reload #1: media bin 3 item + timeline 3 clip", 120000);
      const toasts1 = await readToastsSoon(cdp);
      const reloadMs = Date.now() - t1;
      const bootStable1 = await bootOk(cdp, boot1);
      const names1 = s1.media.map((m) => m.name).sort();
      await drainErrors(cdp);
      log(`J2: reload ${reloadMs}ms; boot ổn định=${bootStable1}; toasts=${JSON.stringify(toasts1)}`);
      if (bootStable1 && names1.join(",") === "j10-import.mp4,mau-1.webm,mau-2.webm"
        && s1.videoClips.length === 2 && s1.textClips.length === 1
        && s1.mediaCards === 3
        && s1.missingAssets === null && !hasStyleToast(toasts1)) {
        pass("J2 reload #1 (sau import, chưa clip): bin VẪN 3 + KHÔNG toast style", `bin 3 item ${names1.join(", ")}, timeline 2 video + 1 chữ, missingAssets=null, toasts sau reload=${JSON.stringify(toasts1)} (không có "đã điền style"), reload ${reloadMs}ms`);
      } else {
        fail("J2 reload #1 (sau import, chưa clip): bin VẪN 3 + KHÔNG toast style", `boot ổn định=${bootStable1}, media=${JSON.stringify(s1.media)}, toasts=${JSON.stringify(toasts1)}`);
      }
      await cdp.shot("j10-j2-after-reload-1.png");
    }

    // ---- J3: thêm media import vào timeline, xóa HẾT clip, reload → bin vẫn 3 ----
    {
      await ensureNoModal(cdp);
      const addBtn = await cdp.evalJs(CARD_BTN_FN("j10-import.mp4", ".media-add"));
      if (!addBtn) throw new Error("không tìm thấy nút ＋ Thêm trên card j10-import.mp4 (J3)");
      await cdp.click(addBtn.x, addBtn.y);
      const sAdd = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clips.some((c) => c.src === "j10-import.mp4") ? t : null;
      }, "thêm j10-import.mp4 vào timeline (clip có thể sang track video mới vì v1 kín 0–8s)", 30000);
      const addedOk = sAdd.clips.some((c) => c.src === "j10-import.mp4");
      if (!addedOk) {
        fail("J3 xóa hết clip rồi reload: bin VẪN 3 item", `thêm j10-import.mp4 vào timeline thất bại: video=${JSON.stringify(sAdd.videoClips)}`);
      } else {
        await cdp.waitFor(async () => {
          const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
          return a && a.srcs && a.srcs.includes("j10-import.mp4") ? a : null;
        }, "autosave ghi xong clip j10-import.mp4 mới thêm", 60000);
        // Chọn hết clip: click clip đầu, Shift+click các clip còn lại, Delete.
        const g = await cdp.evalJs(GEOM_FN);
        if (g.clips.length !== 4) throw new Error(`J3 cần đúng 4 clip để xóa hết, nhận ${g.clips.length}`);
        await cdp.click(g.clips[0].rect.cx, g.clips[0].rect.cy);
        for (let i = 1; i < g.clips.length; i++) await cdp.click(g.clips[i].rect.cx, g.clips[i].rect.cy, 8);
        await cdp.key("Delete", "Delete");
        await sleep(600);
        const sDel = await cdp.evalJs(STATE_FN);
        const deletedOk = sDel.clipCount === 0;
        const autoDel = await cdp.waitFor(async () => {
          const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
          return a && a.srcs && a.srcs.length === 0 && Array.isArray(a.binMedia) && a.binMedia.length === 3 ? a : null;
        }, "autosave ghi xong trạng thái đã xóa hết (0 src, binMedia vẫn 3)", 60000);
        await drainErrors(cdp);
        if (!deletedOk) {
          fail("J3 xóa hết clip rồi reload: bin VẪN 3 item", `xóa hết bằng Delete không ra 0 clip: clips=${JSON.stringify(sDel.clips)}`);
        } else {
          const t3 = Date.now();
          await cdp.send("Page.reload", { ignoreCache: false });
          const boot3 = await afterReload(cdp);
          const s3 = await cdp.waitFor(async () => {
            const t = await cdp.evalJs(STATE_FN).catch(() => null);
            return t && t.clipCount === 0 && t.mediaCount === 3 ? t : null;
          }, "sau reload: timeline 0 clip + media bin 3 item", 120000);
          const toasts3 = await readToastsSoon(cdp);
          const reload3Ms = Date.now() - t3;
          const names3 = s3.media.map((m) => m.name).sort();
          const filesOk3 = s3.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob);
          const bootStable3 = await bootOk(cdp, boot3);
          await drainErrors(cdp);
          log(`J3: reload ${reload3Ms}ms; autosave đã xóa savedAt=${autoDel.savedAt}; toasts=${JSON.stringify(toasts3)}`);
          if (bootStable3 && names3.join(",") === "j10-import.mp4,mau-1.webm,mau-2.webm" && filesOk3
            && s3.missingAssets === null && s3.mediaCards === 3 && !s3.mediaEmptyVisible && !hasStyleToast(toasts3)) {
            pass("J3 xóa hết clip rồi reload: bin VẪN 3 item (media import bền)", `timeline 0 clip, media bin vẫn 3 item ${names3.join(", ")} (file thật, blob: URL) nhờ manifest binMedia — trước P1 bin về 0; toasts sau reload=${JSON.stringify(toasts3)} (không có "đã điền style"), reload ${reload3Ms}ms`);
          } else {
            fail("J3 xóa hết clip rồi reload: bin VẪN 3 item (media import bền)", `boot ổn định=${bootStable3}, media=${JSON.stringify(s3.media)}, toasts=${JSON.stringify(toasts3)}`);
          }
          await cdp.shot("j10-j3-after-delete-all-reload.png");
        }
      }
    }

    // ---- J4: reload #2 (không sửa gì) → bin 3 + KHÔNG toast style ----
    {
      const t2 = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot2 = await afterReload(cdp);
      const s2 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.mediaCount === 3 ? t : null;
      }, "sau reload #2: media bin 3 item", 120000);
      const toasts2 = await readToastsSoon(cdp);
      const reloadMs = Date.now() - t2;
      const bootStable2 = await bootOk(cdp, boot2);
      await drainErrors(cdp);
      log(`J4: reload ${reloadMs}ms; boot ổn định=${bootStable2}; toasts=${JSON.stringify(toasts2)}`);
      if (bootStable2 && s2.mediaCount === 3 && s2.clipCount === 0 && !hasStyleToast(toasts2)) {
        pass("J4 reload #2: bin vẫn 3 + KHÔNG toast style lặp lại", `bin 3 item, timeline 0 clip, toasts sau reload=${JSON.stringify(toasts2)} (không có "đã điền style"), reload ${reloadMs}ms`);
      } else {
        fail("J4 reload #2: bin vẫn 3 + KHÔNG toast style lặp lại", `boot ổn định=${bootStable2}, media=${s2.mediaCount}, clips=${s2.clipCount}, toasts=${JSON.stringify(toasts2)}`);
      }
      await cdp.shot("j10-j4-after-reload-2.png");
    }

    // ---- J5: xóa chủ đích media import khỏi bin (nút ✕) → reload → bin còn 2 ----
    {
      await ensureNoModal(cdp);
      const btn = await cdp.evalJs(CARD_BTN_FN("j10-import.mp4", ".media-remove"));
      if (!btn) throw new Error("không tìm thấy nút ✕ media-remove trên card j10-import.mp4 (J5)");
      log(`J5: bấm ✕ trên card "${btn.name}" tại (${btn.x.toFixed(0)}, ${btn.y.toFixed(0)})`);
      await cdp.click(btn.x, btn.y);
      await sleep(800);
      const toasts5 = await cdp.evalJs(TOASTS_FN).catch(() => []);
      const s5 = await cdp.evalJs(STATE_FN);
      const auto5 = await cdp.waitFor(async () => {
        const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
        return a && Array.isArray(a.binMedia) && a.binMedia.length === 2 ? a : null;
      }, "autosave ghi xong sau khi xóa khỏi bin (binMedia còn 2)", 60000);
      await drainErrors(cdp);
      log(`J5: sau khi bấm ✕: media=${JSON.stringify(s5.media.map((m) => m.name))}, toasts=${JSON.stringify(toasts5)}, binMedia=${JSON.stringify(auto5.binMedia)}`);
      if (s5.mediaCount !== 2 || s5.media.some((m) => m.name === "j10-import.mp4")) {
        fail("J5 xóa chủ đích media import khỏi bin (nút ✕)", `sau khi bấm ✕: media=${JSON.stringify(s5.media)}, toasts=${JSON.stringify(toasts5)}`);
      } else {
        const t5 = Date.now();
        await cdp.send("Page.reload", { ignoreCache: false });
        const boot5 = await afterReload(cdp);
        const s5b = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(STATE_FN).catch(() => null);
          return t && t.mediaCount === 2 ? t : null;
        }, "sau reload: media bin 2 item", 120000);
        const reload5Ms = Date.now() - t5;
        const bootStable5 = await bootOk(cdp, boot5);
        const names5 = s5b.media.map((m) => m.name).sort();
        await drainErrors(cdp);
        if (bootStable5 && names5.join(",") === "mau-1.webm,mau-2.webm" && s5b.missingAssets === null && s5b.clipCount === 0) {
          pass("J5 xóa chủ đích media import khỏi bin: reload vẫn chỉ còn 2 mẫu", `bấm ✕ + confirm → bin còn mau-1/mau-2, autosave binMedia 2 entry, reload ${reload5Ms}ms → bin vẫn 2 item (j10-import.mp4 không hồi lại), timeline 0 clip, missingAssets=null`);
        } else {
          fail("J5 xóa chủ đích media import khỏi bin: reload vẫn chỉ còn 2 mẫu", `boot ổn định=${bootStable5}, media=${JSON.stringify(s5b.media)}, missing=${JSON.stringify(s5b.missingAssets)}`);
        }
        await cdp.shot("j10-j5-after-bin-delete-reload.png");
      }
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 4 lần reload)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "j10-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED J10: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
