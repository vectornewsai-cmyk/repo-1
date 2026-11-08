#!/usr/bin/env node
/**
 * clicktest-59p1-bin-persist-toast.mjs — Phase 9 đợt 59, luồng P1:
 * đóng nợ đợt 58 §6.1 (O2):
 * (a) Thiết kế bin theo spec: media import rồi xóa hết clip khỏi
 *     timeline biến mất khỏi bin sau reload (rehydrate chỉ nạp media mà
 *     spec còn tham chiếu). Đợt này autosave mang manifest bin
 *     (`binMedia` trong envelope) và rehydrate nạp đủ manifest.
 * (b) Toast "đã điền style mặc định cho 1 text clip…" lặp lại mỗi lần
 *     reload — điều tra nguyên nhân gốc.
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-58o2-autosave-sample-reload.mjs
 * (HMR tắt bằng config tạm; profile Chrome mới tinh).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   B0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item mau-1/mau-2.webm) → chờ autosave ghi xong:
 *        envelope phải chứa cả 2 src mẫu VÀ binMedia đủ 2 entry.
 *   B1 reload #1: Page.reload → assert bin 2 + timeline 3 clip + KHÔNG
 *        có toast "Đã điền style" (mẫu sinh ra đã đủ style nhờ fix P1
 *        ở sample.ts — không còn seed thiếu italic).
 *   B2 reload #2 (không sửa gì): assert vẫn KHÔNG có toast "Đã điền
 *        style" (không lặp lại trên cùng một autosave) + bin 2 + 3 clip.
 *   B3 seed thiếu style (bơm tay): xóa `italic` khỏi style text clip
 *        trong autosave rồi reload → assert toast CÓ "Đã điền style"
 *        (đường toast còn sống + K1 normalize chạy thật trong browser),
 *        bin vẫn 2; đọc lại localStorage: style đã có italic:false VÀ
 *        binMedia vẫn đủ 2 (ghi lại O6 không ghi đè mất bin) → reload
 *        lần nữa → assert KHÔNG còn toast style (tự lành bền vững).
 *   B4 (fix (a)): xóa 2 clip video bằng chuột/phím thật → chờ autosave
 *        (srcs rỗng, binMedia vẫn 2) → reload → assert timeline chỉ còn
 *        1 clip chữ NHƯNG bin VẪN 2 item (trước fix: bin 0) + missing null.
 *   B5 xóa chủ đích khỏi bin: bấm ✕ trên card mau-1 (chuột thật, dialog
 *        confirm tự accept) → chờ autosave binMedia còn 1 → reload →
 *        assert bin 1 item (chỉ mau-2), timeline 1 chữ, missing null.
 *   B6 chặn xóa media đang dùng: bấm "＋ Thêm" trên card mau-2 (thêm clip
 *        vào timeline) → bấm ✕ trên card mau-2 → assert bin vẫn 1 item
 *        + toast lỗi "còn 1 clip" (hoặc key store.toastMediaInUse khi
 *        fragment chưa gộp vào dict).
 *   H9 0 lỗi trang trong phiên (gộp qua các lần reload).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-59p1-bin-persist-toast.mjs
 * Env: P1_DEV_PORT (mặc định tự chọn 5490–5499), P1_DEBUG_PORT (9590–9599),
 * P1_DISPLAY (mặc định :164 — display RIÊNG của P1, không dùng chung),
 * P1_SCRATCH (mặc định hidden_files/round59-p1/headed). TMPDIR riêng
 * /tmp/round59-p1/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.P1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round59-p1", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round59-p1";
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
  window.__p1errors = [];
  window.addEventListener("error", (e) => { try { window.__p1errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__p1errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__p1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__p1errors.push("unhandledrejection: <?>"); } });
  // Marker phát hiện trang bị reload giữa chừng (HMR/full-reload do file
  // luồng khác đổi): sau reload mọi window.* đều mất nên marker mất theo.
  window.__p1boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu O2): import /src/store.ts qua
// performance resource entries rồi dùng useStore.getState().
// Chỉ dùng để ĐỌC state + setup, mọi thao tác dưới test đều là
// chuột/phím thật qua CDP (trừ bơm seed thiếu style ở B3 — can thiệp
// localStorage có chủ đích để tái hiện seed cũ).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p1storeMod || (window.__p1storeMod = await import(hit));
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
    errors: (window.__p1errors || []).slice(),
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
    const boot = await cdp.evalJs(`window.__p1boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function bootOk(cdp, boot) {
    return (await cdp.evalJs(`window.__p1boot`).catch(() => null)) === boot;
  }

  // Gom lỗi trang của phase hiện tại rồi reset để phase sau đo riêng.
  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__p1errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__p1errors = []`).catch(() => {});
    return e;
  }

  // Toast khôi phục được push sau rehydrate (async) nên phải chờ một
  // nhịp sau khi state đã đủ rồi mới đọc (toast sống 4.5s).
  async function readToastsSoon(cdp) {
    await sleep(1500);
    return (await cdp.evalJs(TOASTS_FN).catch(() => [])) || [];
  }

  try {
    const DEV_PORT = Number(process.env.P1_DEV_PORT || 0) || (await pickFreePort(5490, 5499));
    const DEBUG_PORT = Number(process.env.P1_DEBUG_PORT || 0) || (await pickFreePort(9590, 9599));
    const DISPLAY = process.env.P1_DISPLAY || ":164";
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
    const TMPDIR = "/tmp/round59-p1/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tắt HMR (tự tạo lại — /tmp mất sau reboot, xem LIMITS O2 §4):
    // luồng khác sửa .tsx/.ts giữa chừng không reload trang đang test.
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "p1-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "p1-chrome.log"), "w");
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

    // ---- B0: project mẫu tự load + autosave ghi xong (srcs + binMedia) ----
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
      pass("B0 setup: mẫu tự load + autosave mang binMedia", `3 clip (v1 [0–4, 4–8], t1 [0.5–5.5]), media bin 2 item ${names0.join(", ")} (file thật ${s0.media.map((m) => m.fileSize).join("/")} byte, blob: URL), autosave savedAt=${auto0.savedAt}, binMedia 2 entry, text clip style đã có italic:false (load ${loadMs}ms)`);
    } else {
      fail("B0 setup: mẫu tự load + autosave mang binMedia", `media=${JSON.stringify(s0.media)}, clips=${s0.clipCount}, autosave=${JSON.stringify(auto0)}`);
    }
    await cdp.shot("p1-b0-sample-loaded.png");

    // ---- B1: reload #1 → KHÔNG toast style (mẫu sinh ra đã đủ style) ----
    {
      const t1 = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot1 = await afterReload(cdp);
      const s1 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.mediaCount === 2 && t.clipCount === 3 ? t : null;
      }, "sau reload #1: media bin 2 item + timeline 3 clip", 120000);
      const toasts1 = await readToastsSoon(cdp);
      const reloadMs = Date.now() - t1;
      const bootStable1 = await bootOk(cdp, boot1);
      const names1 = s1.media.map((m) => m.name).sort();
      await drainErrors(cdp);
      log(`B1: reload ${reloadMs}ms; boot ổn định=${bootStable1}; toasts=${JSON.stringify(toasts1)}`);
      if (bootStable1 && names1.join(",") === "mau-1.webm,mau-2.webm"
        && s1.videoClips.length === 2 && s1.textClips.length === 1
        && s1.missingAssets === null && !hasStyleToast(toasts1)) {
        pass("B1 reload #1: KHÔNG toast style (mẫu sinh ra đã đủ style)", `bin 2 item ${names1.join(", ")}, timeline 2 video + 1 chữ, missingAssets=null, toasts sau reload=${JSON.stringify(toasts1)} (không có "đã điền style"), reload ${reloadMs}ms`);
      } else {
        fail("B1 reload #1: KHÔNG toast style (mẫu sinh ra đã đủ style)", `boot ổn định=${bootStable1}, media=${JSON.stringify(s1.media)}, toasts=${JSON.stringify(toasts1)}`);
      }
      await cdp.shot("p1-b1-after-reload-1.png");
    }

    // ---- B2: reload #2 (không sửa gì) → vẫn KHÔNG toast style ----
    {
      const t2 = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot2 = await afterReload(cdp);
      const s2 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.mediaCount === 2 && t.clipCount === 3 ? t : null;
      }, "sau reload #2: media bin 2 item + timeline 3 clip", 120000);
      const toasts2 = await readToastsSoon(cdp);
      const reloadMs = Date.now() - t2;
      const bootStable2 = await bootOk(cdp, boot2);
      await drainErrors(cdp);
      log(`B2: reload ${reloadMs}ms; boot ổn định=${bootStable2}; toasts=${JSON.stringify(toasts2)}`);
      if (bootStable2 && s2.mediaCount === 2 && s2.clipCount === 3 && !hasStyleToast(toasts2)) {
        pass("B2 reload #2: KHÔNG toast style lặp lại", `bin 2 item, timeline 3 clip, toasts sau reload=${JSON.stringify(toasts2)} (không có "đã điền style"), reload ${reloadMs}ms`);
      } else {
        fail("B2 reload #2: KHÔNG toast style lặp lại", `boot ổn định=${bootStable2}, media=${s2.mediaCount}, clips=${s2.clipCount}, toasts=${JSON.stringify(toasts2)}`);
      }
      await cdp.shot("p1-b2-after-reload-2.png");
    }

    // ---- B3: bơm seed thiếu style → reload → toast CÓ, ghi lại giữ bin, reload nữa → hết ----
    {
      const seeded = await cdp.evalJs(STALE_SEED_FN);
      if (!seeded.ok) throw new Error(`bơm seed thiếu style thất bại: ${seeded.error}`);
      const autoBefore = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
      log(`B3: seed đã bơm — textItalic=${JSON.stringify(autoBefore && autoBefore.textItalic)}, binMedia=${JSON.stringify(autoBefore && autoBefore.binMedia)}`);
      const t3 = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot3 = await afterReload(cdp);
      const s3 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.mediaCount === 2 && t.clipCount === 3 ? t : null;
      }, "sau reload seed thiếu style: media bin 2 item + timeline 3 clip", 120000);
      const toasts3 = await readToastsSoon(cdp);
      const reloadMs = Date.now() - t3;
      const bootStable3 = await bootOk(cdp, boot3);
      const autoAfter = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
      await drainErrors(cdp);
      log(`B3a: reload ${reloadMs}ms; boot ổn định=${bootStable3}; toasts=${JSON.stringify(toasts3)}; autosave sau ghi lại: textItalic=${JSON.stringify(autoAfter && autoAfter.textItalic)}, binMedia=${JSON.stringify(autoAfter && autoAfter.binMedia)}`);
      const toastOk = hasStyleToast(toasts3);
      const rewriteOk = autoAfter && autoAfter.textItalic === false
        && Array.isArray(autoAfter.binMedia) && autoAfter.binMedia.length === 2;
      if (bootStable3 && s3.mediaCount === 2 && s3.clipCount === 3 && toastOk && rewriteOk) {
        pass("B3a seed thiếu style: toast CÓ 1 lần + ghi lại giữ bin", `toast sau reload=${JSON.stringify(toasts3)} (có "Đã điền style"), bin 2 item, autosave ghi lại: textItalic=false, binMedia vẫn 2 entry`);
      } else {
        fail("B3a seed thiếu style: toast CÓ 1 lần + ghi lại giữ bin", `boot ổn định=${bootStable3}, media=${s3.mediaCount}, toasts=${JSON.stringify(toasts3)}, autosave=${JSON.stringify(autoAfter)}`);
      }
      await cdp.shot("p1-b3a-stale-seed-reload.png");
      // Reload lần nữa (không sửa gì) → toast style phải HẾT (tự lành bền vững).
      const t3b = Date.now();
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot3b = await afterReload(cdp);
      const s3b = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.mediaCount === 2 && t.clipCount === 3 ? t : null;
      }, "sau reload lần 2 (seed đã lành): media bin 2 item + timeline 3 clip", 120000);
      const toasts3b = await readToastsSoon(cdp);
      const reload3bMs = Date.now() - t3b;
      const bootStable3b = await bootOk(cdp, boot3b);
      await drainErrors(cdp);
      log(`B3b: reload ${reload3bMs}ms; boot ổn định=${bootStable3b}; toasts=${JSON.stringify(toasts3b)}`);
      if (bootStable3b && s3b.mediaCount === 2 && s3b.clipCount === 3 && !hasStyleToast(toasts3b)) {
        pass("B3b seed đã lành: reload nữa KHÔNG còn toast style", `bin 2 item, timeline 3 clip, toasts=${JSON.stringify(toasts3b)} (không có "đã điền style"), reload ${reload3bMs}ms`);
      } else {
        fail("B3b seed đã lành: reload nữa KHÔNG còn toast style", `boot ổn định=${bootStable3b}, media=${s3b.mediaCount}, toasts=${JSON.stringify(toasts3b)}`);
      }
      await cdp.shot("p1-b3b-healed-reload.png");
    }

    // ---- B4 (fix (a)): xóa 2 clip video rồi reload → bin VẪN 2 item ----
    {
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const vs = g.clips.filter((c) => c.trackId === "v1");
      if (vs.length < 2) throw new Error("không đủ 2 clip video (B4)");
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
      if (!deletedOk) {
        fail("B4 xóa 2 clip video rồi reload (fix (a))", `xóa bằng Delete không ra 0 clip video: v1=${JSON.stringify(sDel.videoClips)}`);
      } else {
        const t4 = Date.now();
        await cdp.send("Page.reload", { ignoreCache: false });
        const boot4 = await afterReload(cdp);
        const s4 = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(STATE_FN).catch(() => null);
          return t && t.clipCount === 1 && t.mediaCount === 2 ? t : null;
        }, "sau reload: timeline 1 clip chữ + media bin 2 item", 120000);
        const reload4Ms = Date.now() - t4;
        const names4 = s4.media.map((m) => m.name).sort();
        const filesOk4 = s4.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob);
        const bootStable4 = await bootOk(cdp, boot4);
        await drainErrors(cdp);
        log(`B4: reload ${reload4Ms}ms; autosave đã xóa savedAt=${autoDel.savedAt}; binMedia lúc xóa=${JSON.stringify(autoDel.binMedia)}`);
        if (bootStable4 && s4.textClips.length === 1 && s4.videoClips.length === 0
          && names4.join(",") === "mau-1.webm,mau-2.webm" && filesOk4
          && s4.missingAssets === null && s4.mediaCards === 2 && !s4.mediaEmptyVisible) {
          pass("B4 xóa 2 clip video rồi reload: bin VẪN 2 item (fix (a))", `timeline chỉ còn 1 clip chữ, media bin vẫn 2 item ${names4.join(", ")} (file thật, blob: URL) nhờ manifest binMedia trong autosave — trước fix bin về 0; reload ${reload4Ms}ms`);
        } else {
          fail("B4 xóa 2 clip video rồi reload (fix (a))", `boot ổn định=${bootStable4}, state=${JSON.stringify({ video: s4.videoClips.length, text: s4.textClips.length, media: s4.mediaCount, names: names4, filesOk: filesOk4, missing: s4.missingAssets, cards: s4.mediaCards, empty: s4.mediaEmptyVisible })}`);
        }
        await cdp.shot("p1-b4-after-delete-reload.png");
      }
    }

    // ---- B5: xóa chủ đích mau-1 khỏi bin (nút ✕) → reload → bin còn 1 ----
    {
      await ensureNoModal(cdp);
      const btn = await cdp.evalJs(REMOVE_BTN_FN);
      if (!btn) throw new Error("không tìm thấy nút ✕ media-remove (B5)");
      log(`B5: bấm ✕ trên card "${btn.name}" tại (${btn.x.toFixed(0)}, ${btn.y.toFixed(0)}), tổng ${btn.count} nút ✕`);
      await cdp.click(btn.x, btn.y);
      await sleep(800);
      const toasts5 = await cdp.evalJs(TOASTS_FN).catch(() => []);
      const s5 = await cdp.evalJs(STATE_FN);
      const auto5 = await cdp.waitFor(async () => {
        const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
        return a && Array.isArray(a.binMedia) && a.binMedia.length === 1 ? a : null;
      }, "autosave ghi xong sau khi xóa khỏi bin (binMedia còn 1)", 60000);
      await drainErrors(cdp);
      log(`B5: sau khi bấm ✕: media=${JSON.stringify(s5.media.map((m) => m.name))}, toasts=${JSON.stringify(toasts5)}, binMedia=${JSON.stringify(auto5.binMedia)}`);
      if (s5.mediaCount !== 1 || s5.media[0].name !== "mau-2.webm") {
        fail("B5 xóa chủ đích mau-1 khỏi bin (nút ✕)", `sau khi bấm ✕: media=${JSON.stringify(s5.media)}, toasts=${JSON.stringify(toasts5)}`);
      } else {
        const t5 = Date.now();
        await cdp.send("Page.reload", { ignoreCache: false });
        const boot5 = await afterReload(cdp);
        const s5b = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(STATE_FN).catch(() => null);
          return t && t.clipCount === 1 && t.mediaCount === 1 ? t : null;
        }, "sau reload: timeline 1 clip chữ + media bin 1 item", 120000);
        const reload5Ms = Date.now() - t5;
        const bootStable5 = await bootOk(cdp, boot5);
        await drainErrors(cdp);
        if (bootStable5 && s5b.mediaCount === 1 && s5b.media[0].name === "mau-2.webm"
          && s5b.textClips.length === 1 && s5b.missingAssets === null) {
          pass("B5 xóa chủ đích mau-1 khỏi bin: reload vẫn chỉ còn mau-2", `bấm ✕ + confirm → bin còn mau-2, autosave binMedia 1 entry, reload ${reload5Ms}ms → bin vẫn 1 item (mau-1 không hồi lại), timeline 1 chữ, missingAssets=null`);
        } else {
          fail("B5 xóa chủ đích mau-1 khỏi bin: reload vẫn chỉ còn mau-2", `boot ổn định=${bootStable5}, media=${JSON.stringify(s5b.media)}, missing=${JSON.stringify(s5b.missingAssets)}`);
        }
        await cdp.shot("p1-b5-after-bin-delete-reload.png");
      }
    }

    // ---- B6: chặn xóa media đang dùng (thêm mau-2 vào timeline rồi bấm ✕) ----
    {
      await ensureNoModal(cdp);
      const add = await cdp.evalJs(ADD_BTN_FN);
      if (!add) throw new Error("không tìm thấy nút ＋ Thêm (B6)");
      await cdp.click(add.x, add.y);
      await sleep(800);
      const sAdd = await cdp.evalJs(STATE_FN);
      const addedOk = sAdd.videoClips.length === 1 && sAdd.videoClips[0].src === "mau-2.webm";
      if (!addedOk) {
        fail("B6 chặn xóa media đang dùng", `thêm mau-2 vào timeline thất bại: video=${JSON.stringify(sAdd.videoClips)}`);
      } else {
        // Chờ autosave ghi clip mới rồi mới thử xóa (khỏi lẫn trạng thái).
        await cdp.waitFor(async () => {
          const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
          return a && a.srcs && a.srcs.includes("mau-2.webm") ? a : null;
        }, "autosave ghi xong clip mau-2 mới thêm", 60000);
        const btn = await cdp.evalJs(REMOVE_BTN_FN);
        if (!btn) throw new Error("không tìm thấy nút ✕ media-remove (B6)");
        await cdp.click(btn.x, btn.y);
        await sleep(800);
        const toasts6 = await cdp.evalJs(TOASTS_FN).catch(() => []);
        const s6 = await cdp.evalJs(STATE_FN);
        await drainErrors(cdp);
        log(`B6: sau khi bấm ✕ trên media đang dùng: media=${JSON.stringify(s6.media.map((m) => m.name))}, video=${s6.videoClips.length}, toasts=${JSON.stringify(toasts6)}`);
        const blockedToast = (toasts6 || []).some((m) => m.includes("còn 1 clip") || m.includes("store.toastMediaInUse"));
        if (s6.mediaCount === 1 && s6.media[0].name === "mau-2.webm" && s6.videoClips.length === 1 && blockedToast) {
          pass("B6 chặn xóa media đang dùng (mau-2 còn 1 clip)", `bấm ✕ + confirm → bin vẫn 1 item mau-2, clip video còn nguyên, toast lỗi=${JSON.stringify(toasts6)}`);
        } else {
          fail("B6 chặn xóa media đang dùng (mau-2 còn 1 clip)", `media=${JSON.stringify(s6.media)}, video=${s6.videoClips.length}, toasts=${JSON.stringify(toasts6)}`);
        }
        await cdp.shot("p1-b6-blocked-delete.png");
      }
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 5 lần reload)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "p1-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED P1: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
