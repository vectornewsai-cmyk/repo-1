#!/usr/bin/env node
/**
 * clicktest-58o2-autosave-sample-reload.mjs — Phase 9 đợt 58, luồng O2:
 * đóng nợ đợt 57 §6.1(b) — sau reload, autosave khôi phục spec nhưng
 * MẤT media mẫu (media bin trống, 2 clip video mẫu biến mất, chỉ còn
 * clip chữ). Đây là quan sát CHƯA kết luận bug (dưới nhiễu HMR lượt 2
 * của N9), cần verify bằng reload sạch có chủ đích.
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-57n9-timeline-core-ops.mjs.
 * CHỈ thêm file test/harness — KHÔNG sửa code sản phẩm apps/web/src
 * trừ khi reload sạch chứng minh được bug thật (khi đó sửa tối thiểu
 * + test đỏ-trước/xanh-sau, ghi rõ trong LIMITS).
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   A0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item mau-1/mau-2.webm) → chờ autosave ghi xong
 *        (debounce 5s) → đếm manifest mẫu trong IndexedDB.
 *   A1 reload sạch: Page.reload → chờ mount + rehydrate → assert media
 *        bin còn đủ 2 item (có file thật + blob: URL), timeline 2 video
 *        + 1 chữ, missingAssets null, không panel Relink.
 *   A2 tái hiện cơ chế §7 N9: xóa cả 2 clip video bằng chuột/phím thật
 *        → chờ autosave → reload → assert timeline chỉ còn clip chữ,
 *        media bin 0, NHƯNG manifest IndexedDB vẫn đủ 2 (bytes còn
 *        nguyên — bin trống là do rehydrate chỉ nạp media mà spec còn
 *        tham chiếu, không phải mất dữ liệu).
 *   A3 tự hồi phục: bấm "↺ Dự án mẫu" → loadSample lại → reload lần nữa
 *        → media bin lại đủ 2.
 *   H9 0 lỗi trang trong phiên (gộp qua các lần reload).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-58o2-autosave-sample-reload.mjs
 * Env: O2_DEV_PORT (mặc định tự chọn 5390–5399), O2_DEBUG_PORT (9490–9499),
 * O2_DISPLAY (mặc định :159 — display RIÊNG của O2, không dùng chung),
 * O2_SCRATCH (mặc định hidden_files/round58-o2/headed). TMPDIR riêng
 * /tmp/round58-o2/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm (trừ khi có bug thật), KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.O2_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round58-o2", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round58-o2";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.o2.config.mjs");

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
  window.__o2errors = [];
  window.addEventListener("error", (e) => { try { window.__o2errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__o2errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__o2errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__o2errors.push("unhandledrejection: <?>"); } });
  // Marker phát hiện trang bị reload giữa chừng (HMR/full-reload do file
  // luồng khác đổi): sau reload mọi window.* đều mất nên marker mất theo.
  window.__o2boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu N9): import /src/store.ts qua
// performance resource entries rồi dùng useStore.getState().
// Chỉ dùng để ĐỌC state + setup, mọi thao tác dưới test đều là
// chuột/phím thật qua CDP (trừ loadSample ở setup A0 — app tự load).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__o2storeMod || (window.__o2storeMod = await import(hit));
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
    errors: (window.__o2errors || []).slice(),
  };
})()`;

// Autosave trong localStorage: envelope { spec, name, savedAt, session? }.
const AUTOSAVE_FN = `(() => {
  const raw = localStorage.getItem("vcut-studio:autosave:v1");
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const srcs = [];
    for (const t of (d.spec && d.spec.tracks) || []) for (const c of t.clips || []) if (c.src) srcs.push(c.src);
    return { savedAt: d.savedAt || null, name: d.name || null, srcs };
  } catch (e) { return { error: String(e) }; }
})()`;

// Manifest trong IndexedDB vcut-studio-assets (bytes mẫu đã ingest?).
const MANIFESTS_FN = `(async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open("vcut-studio-assets", 1);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  try {
    const all = await new Promise((res, rej) => {
      const q = db.transaction("manifests", "readonly").objectStore("manifests").getAll();
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
    return all.map((m) => ({ name: m.originalName, assetId: m.assetId, kind: m.kind, size: m.size }));
  } finally { db.close(); }
})()`;

// Hình học thật của clip để tính tọa độ click (mẫu N9).
const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

const approx = (a, b, eps = 0.06) => Math.abs(a - b) <= eps;

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
    const boot = await cdp.evalJs(`window.__o2boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function bootOk(cdp, boot) {
    return (await cdp.evalJs(`window.__o2boot`).catch(() => null)) === boot;
  }

  // Gom lỗi trang của phase hiện tại rồi reset để phase sau đo riêng.
  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__o2errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__o2errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.O2_DEV_PORT || 0) || (await pickFreePort(5390, 5399));
    const DEBUG_PORT = Number(process.env.O2_DEBUG_PORT || 0) || (await pickFreePort(9490, 9499));
    const DISPLAY = process.env.O2_DISPLAY || ":161";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5390–5399");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9490–9499");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (O2 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round58-o2/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tắt HMR (tự tạo lại — /tmp mất sau reboot, xem N9 LIMITS §9.3):
    // luồng khác sửa .tsx/.ts giữa chừng không reload trang đang test.
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "o2-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "o2-chrome.log"), "w");
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

    // ---- A0: project mẫu tự load + autosave ghi xong + manifest mẫu ----
    const t0 = Date.now();
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
    }, "project mẫu tự load (3 clip, media bin 2 item)", 180000);
    const loadMs = Date.now() - t0;
    const names0 = s0.media.map((m) => m.name).sort();
    const filesOk0 = s0.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob);
    // Chờ autosave ghi xong (debounce 5s sau khi spec đổi): envelope phải
    // chứa cả 2 src mẫu thì reload sau đó mới có spec để khôi phục.
    const auto0 = await cdp.waitFor(async () => {
      const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
      return a && a.srcs && a.srcs.includes("mau-1.webm") && a.srcs.includes("mau-2.webm") ? a : null;
    }, "autosave ghi xong (envelope chứa mau-1/mau-2.webm)", 60000);
    const manifests0 = await cdp.evalJs(MANIFESTS_FN).catch((e) => ({ error: String(e) }));
    const sampleManifests0 = Array.isArray(manifests0) ? manifests0.filter((m) => /^mau-[12]\.(webm|png)$/.test(m.name)) : [];
    log(`A0: load mẫu ${loadMs}ms; autosave savedAt=${auto0.savedAt}; manifests mẫu=${JSON.stringify(sampleManifests0)}`);
    await drainErrors(cdp);
    if (names0.join(",") === "mau-1.webm,mau-2.webm" && filesOk0
      && s0.videoClips.length === 2 && s0.textClips.length === 1
      && sampleManifests0.length === 2) {
      pass("A0 setup: mẫu tự load + autosave + manifest mẫu đủ", `3 clip (v1 [0–4, 4–8], t1 [0.5–5.5]), media bin 2 item ${names0.join(", ")} (file thật ${s0.media.map((m) => m.fileSize).join("/") } byte, blob: URL), autosave savedAt=${auto0.savedAt}, IDB manifest mẫu=2 (load ${loadMs}ms)`);
    } else {
      fail("A0 setup: mẫu tự load + autosave + manifest mẫu đủ", `media=${JSON.stringify(s0.media)}, clips=${s0.clipCount}, manifests mẫu=${JSON.stringify(sampleManifests0)}, autosave=${JSON.stringify(auto0)}`);
    }
    await cdp.shot("o2-a0-sample-loaded.png");

    // ---- A1: reload SẠCH có chủ đích → media mẫu còn không? ----
    const bootA1 = await cdp.evalJs(`window.__o2boot`);
    const t1 = Date.now();
    await cdp.send("Page.reload", { ignoreCache: false });
    const boot1 = await afterReload(cdp);
    const s1 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.mediaCount === 2 && t.clipCount === 3 ? t : null;
    }, "sau reload: media bin 2 item + timeline 3 clip", 120000);
    const reloadMs = Date.now() - t1;
    const names1 = s1.media.map((m) => m.name).sort();
    const filesOk1 = s1.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob);
    const bootStable1 = await bootOk(cdp, boot1);
    const auto1 = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
    log(`A1: reload ${reloadMs}ms; boot đổi ${bootA1}→${boot1} ổn định=${bootStable1}; autosave srcs=${JSON.stringify(auto1 && auto1.srcs)}`);
    await drainErrors(cdp);
    if (bootStable1 && names1.join(",") === "mau-1.webm,mau-2.webm" && filesOk1
      && s1.videoClips.length === 2 && s1.textClips.length === 1
      && s1.missingAssets === null && !s1.relinkVisible
      && s1.mediaCards === 2 && !s1.mediaEmptyVisible) {
      pass("A1 reload sạch: media mẫu còn đủ sau reload", `media bin 2 item ${names1.join(", ")} (file thật ${s1.media.map((m) => m.fileSize).join("/")} byte, blob: URL, assetId có), timeline 2 video + 1 chữ, missingAssets=null, không panel Relink, 2 media-card DOM, reload ${reloadMs}ms`);
    } else {
      fail("A1 reload sạch: media mẫu còn đủ sau reload", `boot ổn định=${bootStable1}, media=${JSON.stringify(s1.media)}, video=${s1.videoClips.length}, text=${s1.textClips.length}, missing=${JSON.stringify(s1.missingAssets)}, relink=${s1.relinkVisible}, cards=${s1.mediaCards}, empty=${s1.mediaEmptyVisible}`);
    }
    await cdp.shot("o2-a1-after-clean-reload.png");

    // ---- A2: tái hiện cơ chế §7 N9 — xóa 2 clip video rồi reload ----
    {
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const vs = g.clips.filter((c) => c.trackId === "v1");
      if (vs.length < 2) throw new Error("không đủ 2 clip video (A2)");
      await cdp.click(vs[0].rect.cx, vs[0].rect.cy);
      await cdp.click(vs[1].rect.cx, vs[1].rect.cy, 8); // Shift+click
      const sSel = await cdp.evalJs(STATE_FN);
      if (sSel.clips.filter((c) => c.trackId === "v1").length !== 2) throw new Error("setup A2: clip video không còn 2 trước khi xóa");
      await cdp.key("Delete", "Delete");
      await sleep(600);
      const sDel = await cdp.evalJs(STATE_FN);
      const deletedOk = sDel.videoClips.length === 0 && sDel.textClips.length === 1;
      // Chờ autosave ghi trạng thái đã xóa (debounce 5s + dư).
      const autoDel = await cdp.waitFor(async () => {
        const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
        return a && a.srcs && a.srcs.length === 0 ? a : null;
      }, "autosave ghi xong trạng thái đã xóa (0 src video)", 60000);
      // Ghi lại số manifest TRƯỚC reload để đối chiếu sau reload.
      const manifestsBefore = await cdp.evalJs(MANIFESTS_FN).catch((e) => ({ error: String(e) }));
      const sampleBefore = Array.isArray(manifestsBefore) ? manifestsBefore.filter((m) => /^mau-[12]\.(webm|png)$/.test(m.name)) : [];
      await drainErrors(cdp);
      if (!deletedOk) {
        fail("A2 xóa 2 clip video rồi reload (cơ chế §7)", `xóa bằng Delete không ra 0 clip video: v1=${JSON.stringify(sDel.videoClips)}`);
      } else {
        const t2 = Date.now();
        await cdp.send("Page.reload", { ignoreCache: false });
        const boot2 = await afterReload(cdp);
        const s2 = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(STATE_FN).catch(() => null);
          return t && t.clipCount === 1 && t.mediaCount === 0 ? t : null;
        }, "sau reload: timeline 1 clip chữ + media bin 0", 120000);
        const reload2Ms = Date.now() - t2;
        const manifestsAfter = await cdp.evalJs(MANIFESTS_FN).catch((e) => ({ error: String(e) }));
        const sampleAfter = Array.isArray(manifestsAfter) ? manifestsAfter.filter((m) => /^mau-[12]\.(webm|png)$/.test(m.name)) : [];
        const bootStable2 = await bootOk(cdp, boot2);
        await drainErrors(cdp);
        log(`A2: reload ${reload2Ms}ms; manifest mẫu trước=${sampleBefore.length} sau=${sampleAfter.length}; autosave đã xóa savedAt=${autoDel.savedAt}`);
        if (bootStable2 && s2.textClips.length === 1 && s2.videoClips.length === 0
          && s2.mediaCount === 0 && s2.mediaEmptyVisible && s2.mediaCards === 0
          && sampleAfter.length === 2 && s2.missingAssets === null) {
          pass("A2 xóa 2 clip video rồi reload (cơ chế §7)", `timeline chỉ còn 1 clip chữ, media bin 0 (hiện "Chưa có file nào"), NHƯNG manifest mẫu trong IndexedDB vẫn đủ 2 (${sampleAfter.map((m) => m.name + ":" + m.size + "B").join(", ")}) → bytes không mất, bin trống vì rehydrate chỉ nạp media mà spec còn tham chiếu (thiết kế S5); reload ${reload2Ms}ms`);
        } else {
          fail("A2 xóa 2 clip video rồi reload (cơ chế §7)", `boot ổn định=${bootStable2}, state=${JSON.stringify({ video: s2.videoClips.length, text: s2.textClips.length, media: s2.mediaCount, empty: s2.mediaEmptyVisible, cards: s2.mediaCards, missing: s2.missingAssets })}, manifest mẫu sau reload=${JSON.stringify(sampleAfter)}`);
        }
        await cdp.shot("o2-a2-after-delete-reload.png");
      }
    }

    // ---- A3: bấm "↺ Dự án mẫu" → loadSample lại → reload → media lại đủ ----
    {
      const clicked = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().includes("Dự án mẫu")); if (b) { b.click(); return true; } return false; })()`);
      if (!clicked) throw new Error("không tìm thấy nút 'Dự án mẫu' (A3)");
      const t3 = Date.now();
      const s3 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
      }, "loadSample lại (3 clip, media bin 2 item)", 180000);
      const load3Ms = Date.now() - t3;
      const auto3 = await cdp.waitFor(async () => {
        const a = await cdp.evalJs(AUTOSAVE_FN).catch(() => null);
        return a && a.srcs && a.srcs.includes("mau-1.webm") && a.srcs.includes("mau-2.webm") ? a : null;
      }, "autosave ghi xong sau loadSample lại", 60000);
      await drainErrors(cdp);
      await cdp.send("Page.reload", { ignoreCache: false });
      const boot3 = await afterReload(cdp);
      const s4 = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.mediaCount === 2 && t.clipCount === 3 ? t : null;
      }, "sau reload lần 2: media bin 2 item + timeline 3 clip", 120000);
      const names4 = s4.media.map((m) => m.name).sort();
      const filesOk4 = s4.media.every((m) => m.hasFile && m.fileSize > 0 && m.urlBlob);
      const bootStable3 = await bootOk(cdp, boot3);
      await drainErrors(cdp);
      if (bootStable3 && names4.join(",") === "mau-1.webm,mau-2.webm" && filesOk4
        && s4.videoClips.length === 2 && s4.textClips.length === 1 && s4.missingAssets === null) {
        pass("A3 loadSample lại + reload: media mẫu tự hồi phục", `loadSample lại ${load3Ms}ms → 3 clip + bin 2 item; reload lần 2 → bin lại đủ ${names4.join(", ")} (file thật, blob: URL), timeline 2 video + 1 chữ, missingAssets=null`);
      } else {
        fail("A3 loadSample lại + reload: media mẫu tự hồi phục", `boot ổn định=${bootStable3}, sau load lại media=${JSON.stringify(s3.media)}, sau reload media=${JSON.stringify(s4.media)}, missing=${JSON.stringify(s4.missingAssets)}`);
      }
      await cdp.shot("o2-a3-after-resample-reload.png");
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 3 lần reload)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "o2-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED O2: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
