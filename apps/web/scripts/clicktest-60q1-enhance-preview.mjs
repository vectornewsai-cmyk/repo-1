#!/usr/bin/env node
/**
 * clicktest-60q1-enhance-preview.mjs — Phase 9 đợt 60, luồng Q1: enhance vào
 * preview ở mức xấp xỉ (đóng nợ đợt 59 §6.9 + gap E3 phần còn lại).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-59p8-enhance-presets.mjs.
 * KHÔNG sửa code sản phẩm (mọi sửa đã làm trước khi chạy).
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   B0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item) → clip video đầu chưa có enhance; hook đo
 *        window.__vcutPreviewEnhance đã xuất hiện (clipId đúng, hasEnhance
 *        false, enabled true, offscreenApplied false) sau khi frame đầu vẽ.
 *   B1 khử nhiễu: click thật vào clip video đầu → Inspector hiện section
 *        Tăng cường → bấm checkbox "Khử nhiễu" bằng chuột thật →
 *        store clip.enhance.denoise === true; hook: denoiseBlurPx 3.0
 *        (bán kính cố định) + denoiseBlendAlpha 0.486 (piecewise đợt 63), applied ["denoise"],
 *        offscreenApplied true. Bằng chứng pixel: lấy mẫu pixel canvas
 *        preview trước/sau → mean abs diff > 0.02 và > 0.1% pixel đổi
 *        (blend alpha 0.486 đổi pixel thật trên cạnh sắc).
 *   B2 chống rung: bấm checkbox "Chống rung" bằng chuột thật → store
 *        stabilize {smoothing:10}; hook: stabilizeZoom ≈ 1.023, applied
 *        ["stabilize","denoise"] (thứ tự enhanceActiveFeatures:
 *        deinterlace → stabilize → denoise); pixel đổi tiếp so với B1.
 *   B3 tắt xem trước: bấm toggle "Xem trước enhance (xấp xỉ)" bằng chuột
 *        thật → hook: enabled false, blur 0, zoom 1, applied [],
 *        notApproximated ["stabilize","denoise"], offscreenApplied false;
 *        pixel đổi ngược về gần khung gốc (so với snapshot A: mean < 2.0).
 *   B4 bật lại: bấm toggle lần nữa → hook trở lại blur 3.0 + alpha 0.486,
 *        zoom 1.023, offscreenApplied true.
 *   B5 khử răng cưa: bấm checkbox "Khử răng cưa" bằng chuột thật → store
 *        deinterlace true; hook: notApproximated chứa "deinterlace", blur/
 *        zoom KHÔNG đổi, applied vẫn ["stabilize","denoise"]; pixel gần như
 *        không đổi so với sau B4 (mean < 0.1) — chứng minh deinterlace
 *        không có xấp xỉ trực quan trong preview.
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-60q1-enhance-preview.mjs
 * Env: Q1_DEV_PORT (mặc định tự chọn 5520–5529), Q1_DEBUG_PORT (9620–9629),
 * Q1_DISPLAY (mặc định quét :190–:199 — display RIÊNG của Q1, không dùng
 * chung), Q1_SCRATCH (mặc định hidden_files/round60-q1/headed). TMPDIR riêng
 * /tmp/round60-q1/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.Q1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round60-q1", "headed");
const CHROME_PW = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
// Đợt 63 R3: chromium-1248 biến mất khỏi cache 08/11 (giữa 2 lần chạy);
// tìm mọi bản chromium-* còn trong cache, ưu tiên bản mới nhất
// (lúc viết: chromium-1254, Chrome 158).
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = fs.existsSync(CHROME_PW) ? CHROME_PW : (findChrome() || (() => { throw new Error("không thấy chrome trong ~/.cache/ms-playwright (cần npx playwright install chromium)"); })());
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round60-q1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.q1.config.mjs");

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
  window.__q1errors = [];
  window.addEventListener("error", (e) => { try { window.__q1errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__q1errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__q1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__q1errors.push("unhandledrejection: <?>"); } });
  window.__q1boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu O2/P8): chỉ dùng để ĐỌC state, mọi thao
// tác dưới test đều là chuột/phím thật qua CDP.
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__q1storeMod || (window.__q1storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Snapshot trạng thái enhance thật từ store + hook đo preview + DOM.
const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
  });
  const sel = document.querySelector('[data-testid="enhance-preset"]');
  const hook = window.__vcutPreviewEnhance ? { ...window.__vcutPreviewEnhance } : null;
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  return {
    clips,
    selection: st.selection,
    playhead: st.playhead,
    playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled,
    enhancePreset: sel ? sel.value : null,
    enhancePresetVisible: !!sel,
    previewToggleVisible: !!document.querySelector('[data-testid="enhance-preview-toggle"]'),
    previewToggleChecked: document.querySelector('[data-testid="enhance-preview-toggle"]')?.checked ?? null,
    hook,
    idle,
    errors: (window.__q1errors || []).slice(),
  };
})()`;

// Hình học thật của clip để tính tọa độ click (mẫu O2/P8).
const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

// Lấy mẫu pixel canvas preview vào 1 slot trong trang (mỗi 4px, RGB).
// Trả về số mẫu + kích thước (không trả mảng pixel qua CDP — mảng ở lại
// trong trang để hàm DIFF so sánh, tránh chuyển ~100k số qua WebSocket).
const SNAP_FN = (slot) => `(window.__q1snaps = window.__q1snaps || {}, window.__q1snaps[${JSON.stringify(slot)}] = (() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  if (!ctx) return { ok: false, reason: "không lấy được ctx 2d" };
  const w = c.width, h = c.height;
  if (!w || !h) return { ok: false, reason: "canvas 0 kích thước" };
  const img = ctx.getImageData(0, 0, w, h).data;
  const step = 4;
  const data = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      data.push(img[i], img[i + 1], img[i + 2]);
    }
  }
  return { ok: true, w, h, n: data.length / 3, data };
})(), { ok: window.__q1snaps[${JSON.stringify(slot)}].ok, w: window.__q1snaps[${JSON.stringify(slot)}].w, h: window.__q1snaps[${JSON.stringify(slot)}].h, n: window.__q1snaps[${JSON.stringify(slot)}].n, reason: window.__q1snaps[${JSON.stringify(slot)}].reason || null })`;

// So sánh 2 slot snapshot: mean abs diff + % channel đổi (trong trang).
const DIFF_FN = (a, b) => `((sa, sb) => {
  if (!sa || !sb || !sa.ok || !sb.ok) return { ok: false, reason: "snapshot thiếu: " + JSON.stringify({ a: sa && sa.ok, b: sb && sb.ok }) };
  if (sa.w !== sb.w || sa.h !== sb.h) return { ok: false, reason: "canvas đổi kích thước " + sa.w + "x" + sa.h + " -> " + sb.w + "x" + sb.h };
  if (sa.data.length !== sb.data.length) return { ok: false, reason: "số mẫu lệch" };
  let sum = 0, changed = 0;
  for (let i = 0; i < sa.data.length; i++) {
    const d = Math.abs(sa.data[i] - sb.data[i]);
    sum += d;
    if (d > 0) changed++;
  }
  const n = sa.data.length;
  return { ok: true, meanAbs: +(sum / n).toFixed(4), changedPct: +((changed / n) * 100).toFixed(2), n };
})(window.__q1snaps[${JSON.stringify(a)}], window.__q1snaps[${JSON.stringify(b)}])`;

// Bấm checkbox Enhance bằng chuột thật (theo data-testid; cuộn vào giữa
// khung nhìn trước như P8 B4 — control ở mép dưới dễ bị .tl-hint che).
const CLICK_ENH_FN = (testid) => `(() => {
  const el = document.querySelector('[data-testid="${testid}"]');
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const b = el.getBoundingClientRect();
  const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, coveredBy: at === el || el.contains(at) ? null : (at?.tagName + "." + (at?.className || "")) };
})()`;

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

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__q1errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__q1errors = []`).catch(() => {});
    return e;
  }

  // Chờ vòng preview ngủ (frame đã vẽ xong, ổn định) trước khi lấy mẫu pixel.
  async function waitIdle(cdp, label) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, 90000);
  }

  // Bấm checkbox Enhance bằng chuột thật; kiểm tra elementFromPoint trước.
  async function clickEnhCheckbox(cdp, testid, label) {
    const g = await cdp.evalJs(CLICK_ENH_FN(testid));
    if (!g) throw new Error(`không tìm thấy [data-testid="${testid}"] (${label})`);
    if (g.coveredBy) log(`cảnh báo: ${testid} bị che bởi ${g.coveredBy} tại điểm bấm — vẫn thử bấm`);
    await cdp.click(g.x, g.y);
    await sleep(600);
  }

  try {
    const DEV_PORT = Number(process.env.Q1_DEV_PORT || 0) || (await pickFreePort(5520, 5529));
    const DEBUG_PORT = Number(process.env.Q1_DEBUG_PORT || 0) || (await pickFreePort(9620, 9629));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 190; n <= 199; n++) {
        const d = `:${n}`;
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = process.env.Q1_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :190–:199");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5520–5529");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9620–9629");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round60-q1/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "q1-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    // Đợt 63 R3: chờ socket X xuất hiện thật thay cho sleep cố định 900ms
    // (VM tải cao → Xvfb chưa kịp bind đã spawn Chrome, CDP không lên).
    {
      const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) {
        if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
        else await sleep(500);
      }
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s (socket ${sock} chưa có)`);
    }
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "q1-chrome.log"), "w");
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

    // ---- B0: project mẫu tự load; hook enhance xuất hiện ------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện", 180000);
    const v0 = s0.clips.find((c) => c.trackId === "v1");
    const firstClipId = v0.clipId;
    await drainErrors(cdp);
    if (v0.enhance === null && s0.hook.clipId === firstClipId && s0.hook.hasEnhance === false
      && s0.hook.enabled === true && s0.hook.offscreenApplied === false
      && s0.hook.denoiseBlurPx === 0 && s0.hook.stabilizeZoom === 1
      && s0.enhancePreviewEnabled === true && s0.playing === false) {
      pass("B0 setup: mẫu load, hook enhance xuất hiện, clip chưa enhance", `3 clip, clip video đầu ${firstClipId} enhance=null; hook clipId=${s0.hook.clipId} hasEnhance=false enabled=true blur=0 zoom=1 offscreen=false; store enhancePreviewEnabled=true (mặc định bật), đang pause tại playhead ${s0.playhead}`);
    } else {
      fail("B0 setup: mẫu load, hook enhance xuất hiện, clip chưa enhance", `state=${JSON.stringify(s0)}`);
    }
    // Snapshot A: khung gốc (chưa enhance) — chờ vòng ngủ cho frame ổn định.
    await waitIdle(cdp, "snapshot A (khung gốc)");
    const snapA = await cdp.evalJs(SNAP_FN("A"));
    log(`snapshot A: ${JSON.stringify(snapA)}`);
    if (!snapA.ok) fail("B0 snapshot A: lấy mẫu pixel khung gốc", snapA.reason || "SNAP_FN thất bại");
    await cdp.shot("q1-b0-baseline.png");

    // ---- B1: click clip video → bấm checkbox Khử nhiễu bằng chuột thật ----
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (B1)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    const sSel = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.enhancePresetVisible && t.enhancePreset === "off" ? t : null;
    }, "Inspector hiện section Tăng cường, select preset ở off", 60000);
    await clickEnhCheckbox(cdp, "enhance-denoise-toggle", "B1 khử nhiễu");
    const s1 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const e = t?.clips.find((c) => c.clipId === firstClipId)?.enhance;
      return t && e && e.denoise === true && t.hook && t.hook.denoiseBlurPx === 3.0 && t.hook.denoiseBlendAlpha === 0.486 && t.hook.offscreenApplied ? t : null;
    }, "denoise:true + hook blur 3.0 + alpha 0.486 + offscreen true", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const enh1 = s1.clips.find((c) => c.clipId === firstClipId)?.enhance;
    await waitIdle(cdp, "snapshot B (denoise bật)");
    const snapB = await cdp.evalJs(SNAP_FN("B"));
    const diffAB = await cdp.evalJs(DIFF_FN("A", "B"));
    await drainErrors(cdp);
    const b1ok = enh1 && enh1.denoise === true && s1.hook
      && s1.hook.denoiseBlurPx === 3.0 && s1.hook.denoiseBlendAlpha === 0.486 && s1.hook.stabilizeZoom === 1
      && JSON.stringify(s1.hook.applied) === JSON.stringify(["denoise"])
      && s1.hook.offscreenApplied === true && s1.previewToggleVisible === true
      && s1.previewToggleChecked === true
      && snapB.ok && diffAB.ok && diffAB.meanAbs > 0.02 && diffAB.changedPct > 0.1;
    if (b1ok) {
      pass("B1 khử nhiễu: store + hook + pixel đổi thật", `enhance=${JSON.stringify(enh1)}, hook blur=3.0 alpha=0.486 applied=["denoise"] offscreen=true, toggle xem trước hiện + checked; pixel A→B: mean abs diff ${diffAB.meanAbs}, ${diffAB.changedPct}% channel đổi (n=${diffAB.n} mẫu)`);
    } else {
      fail("B1 khử nhiễu: store + hook + pixel đổi thật", `enhance=${JSON.stringify(enh1)}, hook=${JSON.stringify(s1.hook)}, toggle visible=${s1.previewToggleVisible} checked=${s1.previewToggleChecked}, snapB=${JSON.stringify(snapB)}, diffAB=${JSON.stringify(diffAB)}`);
    }
    await cdp.shot("q1-b1-denoise.png");

    // ---- B2: bấm checkbox Chống rung bằng chuột thật ----------------------
    await clickEnhCheckbox(cdp, "enhance-stabilize-toggle", "B2 chống rung");
    const s2 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const e = t?.clips.find((c) => c.clipId === firstClipId)?.enhance;
      return t && e && e.stabilize && e.stabilize.smoothing === 10 && t.hook && Math.abs(t.hook.stabilizeZoom - 1.023) < 1e-9 ? t : null;
    }, "stabilize smoothing 10 + hook zoom 1.023", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const enh2 = s2.clips.find((c) => c.clipId === firstClipId)?.enhance;
    await waitIdle(cdp, "snapshot C (denoise + stabilize)");
    const snapC = await cdp.evalJs(SNAP_FN("C"));
    const diffBC = await cdp.evalJs(DIFF_FN("B", "C"));
    await drainErrors(cdp);
    const b2ok = enh2 && enh2.stabilize && enh2.stabilize.smoothing === 10 && s2.hook
      && Math.abs(s2.hook.stabilizeZoom - 1.023) < 1e-9 && s2.hook.denoiseBlurPx === 3.0 && s2.hook.denoiseBlendAlpha === 0.486
      && JSON.stringify(s2.hook.applied) === JSON.stringify(["stabilize", "denoise"])
      && s2.hook.offscreenApplied === true
      && snapC.ok && diffBC.ok && diffBC.meanAbs > 0.02 && diffBC.changedPct > 0.1;
    if (b2ok) {
      pass("B2 chống rung: store + hook + pixel đổi thật", `enhance=${JSON.stringify(enh2)}, hook zoom=1.023 applied=["stabilize","denoise"] offscreen=true; pixel B→C: mean abs diff ${diffBC.meanAbs}, ${diffBC.changedPct}% channel đổi`);
    } else {
      fail("B2 chống rung: store + hook + pixel đổi thật", `enhance=${JSON.stringify(enh2)}, hook=${JSON.stringify(s2.hook)}, snapC=${JSON.stringify(snapC)}, diffBC=${JSON.stringify(diffBC)}`);
    }
    await cdp.shot("q1-b2-stabilize.png");

    // ---- B3: tắt toggle xem trước enhance ---------------------------------
    await clickEnhCheckbox(cdp, "enhance-preview-toggle", "B3 tắt xem trước");
    const s3 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.enhancePreviewEnabled === false && t.previewToggleChecked === false
        && t.hook && t.hook.enabled === false && t.hook.offscreenApplied === false ? t : null;
    }, "toggle tắt + hook enabled false + offscreen false", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    await waitIdle(cdp, "snapshot D (xem trước tắt)");
    const snapD = await cdp.evalJs(SNAP_FN("D"));
    const diffCD = await cdp.evalJs(DIFF_FN("C", "D"));
    const diffAD = await cdp.evalJs(DIFF_FN("A", "D"));
    await drainErrors(cdp);
    const b3ok = s3.enhancePreviewEnabled === false && s3.previewToggleChecked === false && s3.hook
      && s3.hook.enabled === false && s3.hook.denoiseBlurPx === 0 && s3.hook.stabilizeZoom === 1
      && JSON.stringify(s3.hook.applied) === JSON.stringify([])
      && JSON.stringify(s3.hook.notApproximated) === JSON.stringify(["stabilize", "denoise"])
      && s3.hook.offscreenApplied === false
      && snapD.ok && diffCD.ok && diffCD.meanAbs > 0.02 && diffCD.changedPct > 0.1
      && diffAD.ok && diffAD.meanAbs < 2.0;
    if (b3ok) {
      pass("B3 tắt xem trước: hook off + pixel về gần khung gốc", `store enhancePreviewEnabled=false, hook enabled=false blur=0 zoom=1 applied=[] notApproximated=["stabilize","denoise"]; pixel C→D: mean ${diffCD.meanAbs} (${diffCD.changedPct}% đổi); pixel A→D (khung gốc): mean ${diffAD.meanAbs} — toggle tắt trả đúng khung gốc`);
    } else {
      fail("B3 tắt xem trước: hook off + pixel về gần khung gốc", `enabled=${s3.enhancePreviewEnabled} checked=${s3.previewToggleChecked}, hook=${JSON.stringify(s3.hook)}, snapD=${JSON.stringify(snapD)}, diffCD=${JSON.stringify(diffCD)}, diffAD=${JSON.stringify(diffAD)}`);
    }
    await cdp.shot("q1-b3-preview-off.png");

    // ---- B4: bật lại toggle xem trước --------------------------------------
    await clickEnhCheckbox(cdp, "enhance-preview-toggle", "B4 bật lại xem trước");
    const s4 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.enhancePreviewEnabled === true && t.previewToggleChecked === true
        && t.hook && t.hook.enabled === true && t.hook.offscreenApplied === true ? t : null;
    }, "toggle bật lại + hook enabled true + offscreen true", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    await drainErrors(cdp);
    const b4ok = s4.enhancePreviewEnabled === true && s4.previewToggleChecked === true && s4.hook
      && s4.hook.enabled === true && s4.hook.denoiseBlurPx === 3.0 && s4.hook.denoiseBlendAlpha === 0.486
      && Math.abs(s4.hook.stabilizeZoom - 1.023) < 1e-9 && s4.hook.offscreenApplied === true;
    if (b4ok) {
      pass("B4 bật lại xem trước: hook trở lại blur 3.0 + alpha 0.486 + zoom 1.023", `hook=${JSON.stringify(s4.hook)}`);
    } else {
      fail("B4 bật lại xem trước: hook trở lại blur 3.0 + alpha 0.486 + zoom 1.023", `enabled=${s4.enhancePreviewEnabled} checked=${s4.previewToggleChecked}, hook=${JSON.stringify(s4.hook)}`);
    }
    await waitIdle(cdp, "snapshot E (bật lại, trước deinterlace)");
    const snapE = await cdp.evalJs(SNAP_FN("E"));
    log(`snapshot E: ${JSON.stringify(snapE)}`);

    // ---- B5: khử răng cưa — không có xấp xỉ trực quan ----------------------
    await clickEnhCheckbox(cdp, "enhance-deinterlace-toggle", "B5 khử răng cưa");
    const s5 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const e = t?.clips.find((c) => c.clipId === firstClipId)?.enhance;
      return t && e && e.deinterlace === true && t.hook && t.hook.notApproximated.includes("deinterlace") ? t : null;
    }, "deinterlace:true + hook notApproximated chứa deinterlace", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const enh5 = s5.clips.find((c) => c.clipId === firstClipId)?.enhance;
    await waitIdle(cdp, "snapshot F (thêm deinterlace)");
    const snapF = await cdp.evalJs(SNAP_FN("F"));
    const diffEF = await cdp.evalJs(DIFF_FN("E", "F"));
    await drainErrors(cdp);
    const b5ok = enh5 && enh5.deinterlace === true && s5.hook
      && s5.hook.notApproximated.includes("deinterlace")
      && s5.hook.denoiseBlurPx === 3.0 && s5.hook.denoiseBlendAlpha === 0.486 && Math.abs(s5.hook.stabilizeZoom - 1.023) < 1e-9
      && JSON.stringify(s5.hook.applied) === JSON.stringify(["stabilize", "denoise"])
      && snapF.ok && diffEF.ok && diffEF.meanAbs < 0.1;
    if (b5ok) {
      pass("B5 khử răng cưa: store đúng, hook ghi notApproximated, pixel gần như không đổi", `enhance=${JSON.stringify(enh5)}, hook applied=["stabilize","denoise"] notApproximated=${JSON.stringify(s5.hook.notApproximated)} blur/zoom không đổi; pixel E→F: mean abs diff ${diffEF.meanAbs} (${diffEF.changedPct}% đổi) — deinterlace không đổi pixel preview như thiết kế`);
    } else {
      fail("B5 khử răng cưa: store đúng, hook ghi notApproximated, pixel gần như không đổi", `enhance=${JSON.stringify(enh5)}, hook=${JSON.stringify(s5.hook)}, snapF=${JSON.stringify(snapF)}, diffEF=${JSON.stringify(diffEF)}`);
    }
    await cdp.shot("q1-b5-deinterlace.png");

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "q1-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED Q1: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
