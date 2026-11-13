#!/usr/bin/env node
/**
 * clicktest-59p5-captions-headed.mjs — Phase 9 đợt 59, luồng P5:
 * đóng nợ đợt 58 §6.5 (O5): click-test headed nhãn "Subtitles (EN)" +
 * xuất SRT/VTT của track dịch. Ở O5, recognition song ngữ + key
 * captions.translatedTrack đã sửa xong ở tầng lib (12/12) nhưng CHƯA
 * click-test headed nhãn dưới locale en và chưa verify xuất SRT/VTT
 * của track dịch qua UI thật.
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-58o2-autosave-sample-reload.mjs.
 * KHÔNG sửa code sản phẩm apps/web/src trừ khi headed chứng minh được bug
 * thật (khi đó sửa tối thiểu + test đỏ-trước/xanh-sau, ghi rõ trong LIMITS).
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   B0 setup: locale en (localStorage vcut-lang=en + reload) → mount →
 *        modal chào đóng → project mẫu tự load (3 clip, media bin 2 item)
 *        → TopBar có nút "💬 Captions" (locale en).
 *   B1 import thật: mở CaptionModal bằng chuột thật → đưa file SRT VI
 *        (2 câu) qua file input bằng DataTransfer + dispatch change
 *        (mẫu 46b1/47c1 — DOM.setFileInputFiles từng không dính ở setup
 *        này) → bấm Apply bằng chuột thật → timeline có track "Phụ đề 2".
 *   B2 track dịch: tạo track EN qua đúng hàm store mà CaptionModal.apply()
 *        dùng (addCaptionTrack + translatedTrackLabel("en") — bước dịch
 *        whisper qua bridge KHÔNG chạy headed vì media mẫu không có lời
 *        thoại; xem LIMITS) → timeline hiện nhãn "Subtitles (EN)";
 *        collectProjectCaptions trong trang: 4 cue, trackLabels chứa
 *        "Subtitles (EN)".
 *   B3 xuất thật: mở lại modal bằng chuột thật → dòng exportIncludes
 *        chứa "Subtitles (EN)" → bấm "⬇ SRT project" và "⬇ VTT project"
 *        bằng chuột thật → đọc file tải về thật, so byte-exact với
 *        EXPECTED_SRT / EXPECTED_VTT (cùng fixture với test node P5) +
 *        tên file phải giữ đúng "Dự án mẫu.srt"/"Dự án mẫu.vtt" (fix
 *        downloadText: anchor phải gắn vào body, xem CaptionModal.tsx).
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-59p5-captions-headed.mjs
 * Env: P5_DEV_PORT (mặc định tự chọn 5490–5499), P5_DEBUG_PORT (9590–9599),
 * P5_DISPLAY (mặc định :162 — display RIÊNG của P5, không dùng chung),
 * P5_SCRATCH (mặc định hidden_files/round59-p5/headed). TMPDIR riêng
 * /tmp/round59-p5/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm (trừ khi có bug thật), KHÔNG push/tag/binary.
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
const SCRATCH = process.env.P5_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round59-p5", "headed");
const DOWNLOADS = path.join(SCRATCH, "downloads");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round59-p5";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.p5.config.mjs");

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
  window.__p5errors = [];
  window.addEventListener("error", (e) => { try { window.__p5errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__p5errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__p5errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__p5errors.push("unhandledrejection: <?>"); } });
  window.__p5boot = Math.random().toString(36).slice(2);
})()`;

// Fixture SRT VI — cùng câu + mốc với test node P5 (captionsExport59P5).
const SRT_VI =
  "1\n00:00:00,500 --> 00:00:02,000\nXin chào các bạn\n\n" +
  "2\n00:00:02,500 --> 00:00:04,000\nĐây là video thử nghiệm\n";

// Kỳ vọng byte-exact cho file tải về (cùng EXPECTED_* của test node P5).
const EXPECTED_SRT =
  "1\n00:00:00,500 --> 00:00:02,000\nXin chào các bạn\n\n" +
  "2\n00:00:00,500 --> 00:00:02,000\nHello everyone\n\n" +
  "3\n00:00:02,500 --> 00:00:04,000\nĐây là video thử nghiệm\n\n" +
  "4\n00:00:02,500 --> 00:00:04,000\nThis is a test video\n";
const EXPECTED_VTT =
  "WEBVTT\n\n" +
  "00:00:00.500 --> 00:00:02.000\nXin chào các bạn\n\n" +
  "00:00:00.500 --> 00:00:02.000\nHello everyone\n\n" +
  "00:00:02.500 --> 00:00:04.000\nĐây là video thử nghiệm\n\n" +
  "00:00:02.500 --> 00:00:04.000\nThis is a test video\n";

const STATE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p5storeMod || (window.__p5storeMod = await import(hit));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    labels: st.spec.tracks.map((t) => t.label),
    lang: localStorage.getItem("vcut-lang"),
    errors: (window.__p5errors || []).slice(),
  };
})()`;

// Nhãn track hiển thị thật trên timeline (DOM).
const LABELS_FN = `[...document.querySelectorAll(".tl-track-label")].map((el) => el.textContent)`;

// Tạo track dịch qua đúng hàm store mà CaptionModal.apply() dùng.
const SEED_EN_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const storeMod = window.__p5storeMod || (window.__p5storeMod = await import(hit));
  const capHit = entries.find((u) => /\\/src\\/lib\\/captions\\.ts(\\?|$)/.test(u)) || "/src/lib/captions.ts";
  const capMod = window.__p5capMod || (window.__p5capMod = await import(capHit));
  const st = storeMod.useStore.getState();
  const label = capMod.translatedTrackLabel("en");
  const segs = [
    { start: 0.5, end: 2, text: "Hello everyone" },
    { start: 2.5, end: 4, text: "This is a test video" },
  ];
  const trackId = st.addCaptionTrack(segs, { label });
  return { label, trackId };
})()`;

// Thu thập phụ đề project trong trang (cùng hàm exportProject dùng).
const CAPTIONS_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const subHit = entries.find((u) => /\\/src\\/lib\\/subtitles\\.ts(\\?|$)/.test(u)) || "/src/lib/subtitles.ts";
  const subMod = window.__p5subMod || (window.__p5subMod = await import(subHit));
  const storeMod = window.__p5storeMod || (window.__p5storeMod = await import("/src/store.ts"));
  const st = storeMod.useStore.getState();
  const { cues, trackLabels } = subMod.collectProjectCaptions(st.spec.tracks);
  return { cues, trackLabels };
})()`;

// Đưa file SRT vào input import của CaptionModal (mẫu 46b1/47c1).
const IMPORT_SRT_FN = `(async () => {
  const el = document.querySelector('input[aria-label="Import an SRT or VTT file"]');
  if (!el) return { ok: false, reason: "không tìm thấy input import SRT/VTT trong modal" };
  const f = new File([${JSON.stringify(SRT_VI)}], "phu-de-vi.srt", { type: "text/plain" });
  const dt = new DataTransfer();
  dt.items.add(f);
  el.files = dt.files;
  const assigned = el.files.length;
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: true, assigned };
})()`;

// Tọa độ giữa của nút có text chứa substr (đo thật trên DOM headed).
const BTN_RECT_FN = (substr) => `((s) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(s));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled };
})(${JSON.stringify(substr)})`;

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
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => ["Later", "Để sau", "Skip", "Đóng", "Close"].includes(x.textContent.trim())); if (b) b.click(); return !!b; })()`).catch(() => {});
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
    const boot = await cdp.evalJs(`window.__p5boot`);
    await ensureNoModal(cdp);
    return boot;
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__p5errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__p5errors = []`).catch(() => {});
    return e;
  }

  // Chờ file tải về xuất hiện (không còn .crdownload) rồi đọc nội dung.
  // Lần chạy 1: Browser.setDownloadBehavior KHÔNG có tác dụng trên Chrome
  // này — file rơi vào ~/Downloads với tên chung "download" thay vì thư
  // mục scratch; vì vậy theo dõi CẢ hai thư mục, đối chiếu theo nội dung.
  const DL_HOME = path.join(os.homedir(), "Downloads");
  function listDl(dir) {
    try { return fs.readdirSync(dir); } catch { return []; }
  }
  async function waitDownload(sinceMs, timeoutMs = 20000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      for (const dir of [DOWNLOADS, DL_HOME]) {
        const files = listDl(dir);
        if (files.some((f) => f.endsWith(".crdownload"))) { await sleep(500); continue; }
        // Bỏ qua file tạm/dotfile của Chrome (vd ".org.chromium.*") — lần
        // chạy 4 nhận nhầm file này làm SRT dù "Du an mau.srt" đã về sau.
        const fresh = files.filter((f) => {
          if (f.startsWith(".")) return false;
          try { return fs.statSync(path.join(dir, f)).mtimeMs >= sinceMs - 1000; } catch { return false; }
        });
        // File .srt/.vtt có đuôi trước, rồi file tên chung "download...".
        fresh.sort((a, b) => ((/\.(srt|vtt)$/.test(b) ? 1 : 0) - (/\.(srt|vtt)$/.test(a) ? 1 : 0)));
        for (const name of fresh) {
          const full = path.join(dir, name);
          try { return { name, dir, content: fs.readFileSync(full, "utf8") }; } catch { /* tiếp */ }
        }
      }
      await sleep(500);
    }
    return null;
  }

  try {
    const DEV_PORT = Number(process.env.P5_DEV_PORT || 0) || (await pickFreePort(5490, 5499));
    const DEBUG_PORT = Number(process.env.P5_DEBUG_PORT || 0) || (await pickFreePort(9590, 9599));
    const DISPLAY = process.env.P5_DISPLAY || ":162";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5490–5499");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9590–9599");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (P5 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round59-p5/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(DOWNLOADS, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "p5-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "p5-chrome.log"), "w");
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

    // Tải về: Browser.setDownloadBehavior qua browser-level WS (mẫu mới;
    // fallback Page.setDownloadBehavior nếu browser-level không dính).
    let dlMode = null;
    try {
      const version = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json();
      const bws = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise((res, rej) => { bws.onopen = res; bws.onerror = rej; });
      const bsend = (method, params) => new Promise((res, rej) => {
        const id = 9001;
        const onMsg = (m) => {
          const msg = JSON.parse(m.data);
          if (msg.id === id) { bws.removeEventListener("message", onMsg); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
        };
        bws.addEventListener("message", onMsg);
        bws.send(JSON.stringify({ id, method, params }));
        setTimeout(() => rej(new Error("browser WS timeout")), 15000);
      });
      await bsend("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: DOWNLOADS });
      dlMode = "Browser.setDownloadBehavior";
      bws.close();
    } catch (e) {
      log(`browser-level download behavior thất bại (${e.message}) — fallback Page.setDownloadBehavior`);
      try {
        await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DOWNLOADS });
        dlMode = "Page.setDownloadBehavior";
      } catch (e2) {
        log(`Page.setDownloadBehavior cũng thất bại (${e2.message}) — download có thể về thư mục mặc định`);
      }
    }
    log(`download behavior: ${dlMode ?? "KHÔNG đặt được"}`);

    // ---- B0: locale en + mount + mẫu tự load ---------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount lần đầu (locale vi mặc định)", 240000);
    // Đổi locale sang en rồi reload để i18n nạp dict en từ đầu.
    await cdp.evalJs(`localStorage.setItem("vcut-lang", "en")`);
    await cdp.send("Page.reload", { ignoreCache: false });
    const boot0 = await afterReload(cdp);
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
    }, "project mẫu tự load (3 clip, media bin 2 item) dưới locale en", 180000);
    const captionsBtn = await cdp.evalJs(BTN_RECT_FN("Captions"));
    const bootStable0 = (await cdp.evalJs(`window.__p5boot`).catch(() => null)) === boot0;
    await drainErrors(cdp);
    if (bootStable0 && s0.lang === "en" && captionsBtn && !captionsBtn.disabled) {
      pass("B0 setup: locale en + mẫu tự load + nút Captions", `vcut-lang=en, boot ổn định, 3 clip (labels ${JSON.stringify(s0.labels)}), media bin 2 item, nút TopBar "${captionsBtn.text}" tại (${captionsBtn.x.toFixed(0)}, ${captionsBtn.y.toFixed(0)})`);
    } else {
      fail("B0 setup: locale en + mẫu tự load + nút Captions", `boot ổn định=${bootStable0}, lang=${s0 && s0.lang}, captionsBtn=${JSON.stringify(captionsBtn)}, state=${JSON.stringify(s0)}`);
    }
    await cdp.shot("p5-b0-sample-en.png");

    // ---- B1: import SRT VI thật qua modal + Apply bằng chuột thật -------
    {
      const btn = await cdp.evalJs(BTN_RECT_FN("Captions"));
      if (!btn) throw new Error("không tìm thấy nút Captions (B1)");
      await cdp.click(btn.x, btn.y);
      const modalOpen = await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Auto-generate captions") ? true : null; })()`).catch(() => null);
        return m;
      }, "CaptionModal mở (tiêu đề Auto-generate captions)", 30000);
      const delivery = await cdp.evalJs(IMPORT_SRT_FN);
      log(`B1 import SRT: ${JSON.stringify(delivery)}`);
      const applyBtn = await cdp.waitFor(async () => {
        const b = await cdp.evalJs(BTN_RECT_FN("Apply 2 caption")).catch(() => null);
        return b && !b.disabled ? b : null;
      }, "nút Apply 2 caption sentences xuất hiện sau import", 30000);
      await drainErrors(cdp);
      if (!delivery.ok) {
        fail("B1 import SRT VI + Apply bằng chuột thật", delivery.reason);
      } else if (!applyBtn) {
        fail("B1 import SRT VI + Apply bằng chuột thật", "import xong nhưng không thấy nút Apply 2 caption (review step không lên)");
      } else {
        await cdp.click(applyBtn.x, applyBtn.y);
        const s1 = await cdp.waitFor(async () => {
          const t = await cdp.evalJs(STATE_FN).catch(() => null);
          return t && t.labels.includes("Phụ đề 2") ? t : null;
        }, "timeline có track 'Phụ đề 2' sau Apply", 30000);
        const labels1 = await cdp.evalJs(LABELS_FN);
        await drainErrors(cdp);
        if (s1 && labels1.includes("Phụ đề 2")) {
          pass("B1 import SRT VI + Apply bằng chuột thật", `import 2 câu qua file input thật, bấm Apply "${applyBtn.text}" bằng chuột thật → track "Phụ đề 2" (store labels ${JSON.stringify(s1.labels)}, DOM labels ${JSON.stringify(labels1)})`);
        } else {
          fail("B1 import SRT VI + Apply bằng chuột thật", `sau Apply: store labels=${JSON.stringify(s1 && s1.labels)}, DOM labels=${JSON.stringify(labels1)}`);
        }
      }
      await cdp.shot("p5-b1-after-import-apply.png");
      // Đảm bảo modal đã đóng trước khi sang B2.
      await ensureNoModal(cdp);
    }

    // ---- B2: track dịch EN + nhãn hiển thị thật -------------------------
    {
      const seed = await cdp.evalJs(SEED_EN_FN);
      log(`B2 seed EN track: ${JSON.stringify(seed)}`);
      const labels2 = await cdp.waitFor(async () => {
        const l = await cdp.evalJs(LABELS_FN).catch(() => null);
        return l && l.includes("Subtitles (EN)") ? l : null;
      }, "timeline hiện nhãn 'Subtitles (EN)'", 30000);
      const caps = await cdp.evalJs(CAPTIONS_FN);
      await drainErrors(cdp);
      const cuesOk = caps.cues.length === 4
        && caps.cues.some((c) => c.text === "Hello everyone")
        && caps.cues.some((c) => c.text === "This is a test video");
      if (seed.label === "Subtitles (EN)" && labels2 && caps.trackLabels.includes("Subtitles (EN)") && cuesOk) {
        pass("B2 nhãn track dịch 'Subtitles (EN)' hiển thị thật", `translatedTrackLabel("en") dưới locale en = "${seed.label}" (track ${seed.trackId}); DOM timeline labels ${JSON.stringify(labels2)}; collectProjectCaptions: 4 cue, trackLabels ${JSON.stringify(caps.trackLabels)}`);
      } else {
        fail("B2 nhãn track dịch 'Subtitles (EN)' hiển thị thật", `seed=${JSON.stringify(seed)}, DOM labels=${JSON.stringify(labels2)}, collect=${JSON.stringify(caps)}`);
      }
      await cdp.shot("p5-b2-subtitles-en-label.png");
    }

    // ---- B3: xuất SRT/VTT project bằng chuột thật, đọc file tải về -----
    {
      const btn = await cdp.evalJs(BTN_RECT_FN("Captions"));
      if (!btn) throw new Error("không tìm thấy nút Captions (B3)");
      await cdp.click(btn.x, btn.y);
      const modalText = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Export the project's captions") ? b.innerText : null; })()`).catch(() => null);
        return t;
      }, "CaptionModal mở lại (bước config, có dòng export project)", 30000);
      const includesEn = typeof modalText === "string" && modalText.includes("Subtitles (EN)");
      const srtBtn = await cdp.evalJs(BTN_RECT_FN("SRT project"));
      const vttBtn = await cdp.evalJs(BTN_RECT_FN("VTT project"));
      await drainErrors(cdp);
      if (!modalText) {
        fail("B3 xuất SRT/VTT project bằng chuột thật", "modal không mở lại ở bước config");
      } else if (!includesEn) {
        fail("B3 xuất SRT/VTT project bằng chuột thật", `dòng exportIncludes không chứa "Subtitles (EN)": ${JSON.stringify(modalText.slice(0, 600))}`);
      } else if (!srtBtn || srtBtn.disabled || !vttBtn || vttBtn.disabled) {
        fail("B3 xuất SRT/VTT project bằng chuột thật", `nút export: SRT=${JSON.stringify(srtBtn)}, VTT=${JSON.stringify(vttBtn)}`);
      } else {
        // Lấy lại tọa độ MỚI ngay trước mỗi cú bấm (lần chạy 1 lấy cả hai
        // tọa độ trước rồi mới bấm — VTT không tải được, chưa rõ do tọa độ
        // cũ hay do Chrome; lần này đo lại + nghỉ 2 s giữa hai lần tải).
        const srtBtn2 = await cdp.evalJs(BTN_RECT_FN("SRT project"));
        if (!srtBtn2 || srtBtn2.disabled) throw new Error(`nút SRT project biến mất trước khi bấm: ${JSON.stringify(srtBtn2)}`);
        const tSrt = Date.now();
        await cdp.click(srtBtn2.x, srtBtn2.y);
        const srtFile = await waitDownload(tSrt);
        log(`B3 SRT file: ${srtFile ? `${srtFile.dir}/${srtFile.name} (${srtFile.content.length}B)` : "KHÔNG TẢI ĐƯỢC"}`);
        await sleep(2000);
        const vttBtn2 = await cdp.evalJs(BTN_RECT_FN("VTT project"));
        if (!vttBtn2 || vttBtn2.disabled) throw new Error(`nút VTT project biến mất trước khi bấm: ${JSON.stringify(vttBtn2)}`);
        const tVtt = Date.now();
        await cdp.click(vttBtn2.x, vttBtn2.y);
        const vttFile = await waitDownload(tVtt);
        log(`B3 VTT file: ${vttFile ? `${vttFile.dir}/${vttFile.name} (${vttFile.content.length}B)` : "KHÔNG TẢI ĐƯỢC"}`);
        await drainErrors(cdp);
        const srtOk = srtFile && srtFile.content === EXPECTED_SRT;
        const vttOk = vttFile && vttFile.content === EXPECTED_VTT;
        // Đợt 59 P5 (fix tên file): trước fix, tên project "Dự án mẫu"
        // (không-ASCII) làm Chrome lưu tên chung "download" — sau fix
        // exportProject chuẩn hoá base về ASCII nên tên phải đúng
        // "Du an mau.srt" / "Du an mau.vtt".
        const srtNameOk = !!srtFile && srtFile.name === "Du an mau.srt";
        const vttNameOk = !!vttFile && vttFile.name === "Du an mau.vtt";
        if (srtOk && vttOk && srtNameOk && vttNameOk) {
          pass("B3 xuất SRT/VTT project bằng chuột thật (byte-exact)", `modal hiện "Includes 4 sentences from track: Phụ đề 2, Subtitles (EN)"; bấm "⬇ SRT project" → ${srtFile.dir}/${srtFile.name} (${srtFile.content.length} byte) khớp byte-exact EXPECTED_SRT; bấm "⬇ VTT project" → ${vttFile.dir}/${vttFile.name} (${vttFile.content.length} byte) khớp byte-exact EXPECTED_VTT (download qua ${dlMode})`);
        } else {
          fail("B3 xuất SRT/VTT project bằng chuột thật", `SRT khớp=${srtOk} tên đúng .srt=${srtNameOk} (file=${srtFile ? srtFile.dir + "/" + srtFile.name + " " + srtFile.content.length + "B" : "KHÔNG TẢI ĐƯỢC"}), VTT khớp=${vttOk} tên đúng .vtt=${vttNameOk} (file=${vttFile ? vttFile.dir + "/" + vttFile.name + " " + vttFile.content.length + "B" : "KHÔNG TẢI ĐƯỢC"}); SRT nhận được=${srtFile ? JSON.stringify(srtFile.content) : "null"}; VTT nhận được=${vttFile ? JSON.stringify(vttFile.content) : "null"}`);
        }
      }
      await cdp.shot("p5-b3-after-export.png");
      await ensureNoModal(cdp);
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 2 lần reload + import + export)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "p5-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length, downloadMode: dlMode }, null, 2));
    log(`KẾT QUẢ HEADED P5: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
