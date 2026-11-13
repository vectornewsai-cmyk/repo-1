#!/usr/bin/env node
/**
 * r71y2-headed-capture.mjs — Phase 9 đợt 71, luồng Y2, thí nghiệm (a)+(c):
 * capture TOÀN BỘ pixel vùng video của preview headed (KHÔNG lấy mẫu
 * thưa step-4 như R65/W6) cho 4 nguồn (test-pattern testsrc2 + 3 clip tự
 * nhiên ocean/basgo/slovenska) × 3 variant (plain/noise05/noise10) tại
 * 1 cửa sổ (env R71Y2_WIN_W). Snapshot lưu RGB24 toàn bộ rect video
 * (base64) để script phân tích Node tính lại verdict Δkurt/Δcorr sau
 * hiệu chỉnh delta0 của X6 — kurt R nhạy pha lấy mẫu (±0,6 qua 4 pha
 * ở w1440) nên chỉ full-pixel mới kết luận chắc được.
 *
 * Thiết lập: mẫu R65 S7 (vite dev + Xvfb + Chromium 1254 headed + CDP,
 * seed project qua localStorage autosave, import media bằng
 * DOM.setFileInputFiles, effects qua store.patchClip, playhead 1.0).
 * Khác R65: import 1 lần 4 media rồi đổi clip.src bằng patchClip giữa
 * các nguồn (không reload lại mỗi nguồn); snapshot full-pixel rect.
 *
 * Chạy (từ gốc repo): R71Y2_WIN_W=1440 node apps/web/scripts/r71y2-headed-capture.mjs
 * Env: R71Y2_WIN_W/R71Y2_WIN_H (mặc định 1440×900), R71Y2_SCRATCH
 * (mặc định hidden_files/round71-y2/headed-w1440), R71Y2_DEV_PORT,
 * R71Y2_DEBUG_PORT, R71Y2_DISPLAY (mặc định quét như R65).
 * Exit 0 mọi case đo xong, 1 có case FAIL, 2 harness lỗi.
 * KHÔNG push/tag/binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs"; // M5 (đợt 85): 3 lần ghi JSON/config qua helper retry EPERM + verify đủ byte (nối nốt nợ L6 §5).
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const R65 = path.join(GOAL, "round65-s7");
const Y2 = path.join(GOAL, "round71-y2");
const WIN_W = Number(process.env.R71Y2_WIN_W || 1440);
const WIN_H = Number(process.env.R71Y2_WIN_H || 900);
const SCRATCH = process.env.R71Y2_SCRATCH || path.join(Y2, `headed-w${WIN_W}`);
const CHROME = process.env.R71Y2_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round71-y2";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r71y2.config.mjs");

const SOURCES = [
  { name: "test-pattern", file: path.join(R65, "media", "test-pattern.mp4"), frame: 30 },
  // ocean: .ogv gốc (Theora) KHÔNG play được trên Chromium 1254
  // (canPlayType "" + DEMUXER_ERROR_NO_SUPPORTED_STREAMS — đo thật
  // 09/11, xem LIMITS Y2 §2) nên dùng bản transcode h264 CRF18 cùng
  // nội dung; frame render cũng build từ chính mp4 này.
  { name: "ocean", file: path.join(Y2, "probe", "ocean06.mp4"), frame: 25 },
  { name: "basgo", file: path.join(os.homedir(), "workspace", ".scratch-r64r4", "basgo.webm"), frame: 30 },
  { name: "slovenska", file: path.join(os.homedir(), "workspace", ".scratch-r64r4", "slovenska.webm"), frame: 25 },
];
const ONLY = (process.env.R71Y2_SOURCES || "").split(",").map((s) => s.trim()).filter(Boolean);
const SOURCES_RUN = ONLY.length ? SOURCES.filter((s) => ONLY.includes(s.name)) : SOURCES;

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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 60s: ${method}`)); }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async click(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(x), y: Math.round(y), button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(x), y: Math.round(y), button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code) {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const INJECT_ERRORS = `(() => {
  window.__r71y2errors = [];
  window.addEventListener("error", (e) => { try { window.__r71y2errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r71y2errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r71y2errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r71y2errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r71y2storeMod || (window.__r71y2storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, src: c.src ?? null,
    effects: c.effects ?? null,
  });
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const media = (st.media || []).map((m) => ({ name: m.name, kind: m.kind, proxy: !!m.proxyUrl }));
  return { clips, selection: st.selection, playhead: st.playhead, playing: st.playing, idle, media, errors: (window.__r71y2errors || []).slice() };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const st2 = window.__r71y2storeMod.useStore.getState();
  const c = st2.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)}).clips.find((x) => x.id === ${JSON.stringify(clipId)});
  return { patched: n, src: c.src ?? null, effects: c.effects ?? null };
})()`;

// Snapshot TOÀN BỘ pixel vùng video (rect nguyên, cùng công thức hình
// học với parity-66t3-compare.mjs: scale=min(cw/1280, ch/720),
// rect=(cw-1280*scale)/2, (ch-720*scale)/2, 1280*scale, 720*scale).
const SNAP_FN = (slot) => `(window.__r71y2snaps = window.__r71y2snaps || {}, window.__r71y2snaps[${JSON.stringify(slot)}] = (() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  if (!ctx) return { ok: false, reason: "không lấy được ctx 2d" };
  const cw = c.width, ch = c.height;
  if (!cw || !ch) return { ok: false, reason: "canvas 0 kích thước" };
  const W = 1280, H = 720;
  const scale = Math.min(cw / W, ch / H);
  const rect = { x: Math.round((cw - W * scale) / 2), y: Math.round((ch - H * scale) / 2), w: Math.round(W * scale), h: Math.round(H * scale), scale };
  const img = ctx.getImageData(rect.x, rect.y, rect.w, rect.h).data;
  const n = rect.w * rect.h;
  const rgb = new Uint8Array(n * 3);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = img[i * 4]; rgb[i * 3 + 1] = img[i * 4 + 1]; rgb[i * 3 + 2] = img[i * 4 + 2];
    sum += img[i * 4] + img[i * 4 + 1] + img[i * 4 + 2];
  }
  let b64 = "";
  const CH = 0x8000;
  for (let i = 0; i < rgb.length; i += CH) b64 += String.fromCharCode.apply(null, rgb.subarray(i, i + CH));
  return { ok: true, w: rect.w, h: rect.h, n, rect, rgbB64: btoa(b64), mean: +(sum / (n * 3)).toFixed(2) };
})(), { ok: window.__r71y2snaps[${JSON.stringify(slot)}].ok, w: window.__r71y2snaps[${JSON.stringify(slot)}].w, h: window.__r71y2snaps[${JSON.stringify(slot)}].h, n: window.__r71y2snaps[${JSON.stringify(slot)}].n, mean: window.__r71y2snaps[${JSON.stringify(slot)}].mean, rect: window.__r71y2snaps[${JSON.stringify(slot)}].rect, reason: window.__r71y2snaps[${JSON.stringify(slot)}].reason || null })`;

const SEED_SPEC = {
  version: "0.2.0",
  meta: { name: "R71Y2 kurt-R full-pixel", width: 1280, height: 720, fps: 30 },
  tracks: [{
    id: "v1", kind: "video",
    clips: [{ kind: "video", id: "c1", src: "test-pattern.mp4", start: 0, duration: 4, in: 0, out: 4 }],
  }],
};

function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];
  const snaps = {}; // source -> variant -> snapshot (full-pixel)
  const proxyUsed = {};

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
    const e = (await cdp.evalJs(`(window.__r71y2errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r71y2errors = []`).catch(() => {});
    return e;
  }

  async function waitIdle(cdp, label) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, 120000);
  }

  async function snapAt(cdp, source, slot, playhead) {
    await cdp.evalJs(SET_PLAYHEAD_FN(playhead));
    await waitIdle(cdp, `snapshot ${source}/${slot} @${playhead}`);
    const s = await cdp.evalJs(SNAP_FN(`${source}/${slot}`));
    if (!s.ok) throw new Error(`snapshot ${source}/${slot} thất bại: ${s.reason}`);
    if (s.mean < 5) throw new Error(`snapshot ${source}/${slot} quá tối (mean=${s.mean}) — video chưa load/seek chưa xong?`);
    snaps[source] = snaps[source] || {};
    snaps[source][slot] = await cdp.evalJs(`window.__r71y2snaps[${JSON.stringify(`${source}/${slot}`)}]`);
    return s;
  }

  async function setEffects(cdp, effectsJson, label) {
    const p = await cdp.evalJs(PATCH_FN("v1", "c1", effectsJson));
    const want = JSON.parse(effectsJson).effects ?? null;
    const got = JSON.stringify(p.effects ?? null);
    if (got !== JSON.stringify(want ?? null)) throw new Error(`patch effects ${label} thất bại: muốn ${JSON.stringify(want)}, được ${got}`);
    return p;
  }

  async function setSource(cdp, srcName) {
    const p = await cdp.evalJs(PATCH_FN("v1", "c1", JSON.stringify({ src: srcName })));
    if (p.src !== srcName) throw new Error(`patch src thất bại: muốn ${srcName}, được ${p.src}`);
    return p;
  }

  try {
    for (const s of SOURCES_RUN) if (!fs.existsSync(s.file)) throw new Error(`không thấy media ${s.file}`);
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = Number(process.env.R71Y2_DEV_PORT || 0) || (await pickFreePort(5560, 5569));
    const DEBUG_PORT = Number(process.env.R71Y2_DEBUG_PORT || 0) || (await pickFreePort(9660, 9669));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 170; n <= 179; n++) {
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return `:${n}`;
      }
      return null;
    }
    const DISPLAY = process.env.R71Y2_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :170–:179");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5560–5569");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9660–9669");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round71-y2/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`, { label: "r71y2-headed-capture vite-config" });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}, window=${WIN_W}x${WIN_H}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r71y2-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", `${WIN_W}x${WIN_H}x24`], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r71y2-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      `--window-size=${WIN_W},${WIN_H}`, "--hide-scrollbars", "about:blank"],
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
    await cdp.evalJs(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(SEED_SPEC, "R71Y2 kurt-R full-pixel"))});`);
    await cdp.send("Page.reload");
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()`).catch(() => null);
      return s;
    }, "app mount sau reload", 240000);
    await sleep(1500);
    const relink = await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
    if (relink) {
      log("setup: RelinkPanel hiện (media seed thiếu) -> đóng bằng click thật");
      const btn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.title === "Đóng (bỏ qua)"); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (btn) await cdp.click(btn.x, btn.y);
      await cdp.waitFor(async () => !(await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`)), "RelinkPanel đóng", 15000);
    } else log("setup: không thấy RelinkPanel");
    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");

    // Import cả 4 media vào bin (mỗi file 1 lần setFileInputFiles).
    await cdp.waitFor(async () => (await cdp.evalJs(`!!document.querySelector(".mediabin")`)) ? true : null, "MediaBin sẵn", 30000);
    const doc = await cdp.send("DOM.getDocument", { depth: 0 });
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" });
    if (!q.nodeId) throw new Error("không tìm được file input của MediaBin qua DOM.querySelector");
    for (const s of SOURCES_RUN) {
      await cdp.send("DOM.setFileInputFiles", { files: [s.file], nodeId: q.nodeId });
      const base = path.basename(s.file);
      await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.media.some((m) => m.name === base) ? t : null;
      }, `media ${base} vào bin`, 60000);
      log(`media đã vào bin: ${base}`);
    }
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 1 && t.clips[0].clipId === "c1" && t.idle && t.idle.sleeping ? t : null;
    }, "project seed (1 clip c1) + preview ngủ", 120000);
    await drainErrors(cdp);
    for (const s of SOURCES_RUN) {
      const base = path.basename(s.file);
      proxyUsed[s.name] = s0.media.find((m) => m.name === base)?.proxy === true;
    }
    log(`setup: clip c1, proxyUsed=${JSON.stringify(proxyUsed)} (kỳ vọng false hết — proxy chỉ gắn tay qua setMediaProxy)`);
    if (Object.values(proxyUsed).some(Boolean)) log("CẢNH BÁO: có nguồn đang dùng proxy — số parity sẽ bao gồm cả sai số proxy, ghi rõ trong LIMITS");

    // ---- Vòng nguồn: plain/plain2/noise05/noise05b/noise10 -------------
    for (const src of SOURCES_RUN) {
      const base = path.basename(src.file);
      log(`--- nguồn ${src.name} (${base}, frame render ${src.frame}) ---`);
      if (src.name !== "test-pattern") await setSource(cdp, base);
      // Xóa effects còn sót từ nguồn trước (plain phải sạch).
      await setEffects(cdp, JSON.stringify({ effects: [] }), `clear effects ${src.name}`);
      const p1 = await snapAt(cdp, src.name, "plain", 1.0);
      const p2 = await snapAt(cdp, src.name, "plain2", 1.0);
      if (snaps[src.name].plain.rgbB64 === snaps[src.name].plain2.rgbB64) {
        pass(`D1 ${src.name}: snapshot plain 2 lần pixel-identical (full-pixel)`, `rect ${p1.w}x${p1.h}, mean ${p1.mean}`);
      } else {
        fail(`D1 ${src.name}: snapshot plain 2 lần pixel-identical (full-pixel)`, `plain mean ${p1.mean} vs plain2 mean ${p2.mean} — b64 khác nhau`);
      }
      await drainErrors(cdp);
      await setEffects(cdp, JSON.stringify({ effects: [{ type: "noise", intensity: 0.5 }] }), `noise 0.5 ${src.name}`);
      const n5 = await snapAt(cdp, src.name, "noise05", 1.0);
      await snapAt(cdp, src.name, "noise05b", 1.0);
      if (snaps[src.name].noise05.rgbB64 === snaps[src.name].noise05b.rgbB64) {
        pass(`D2 ${src.name}: snapshot noise05 2 lần pixel-identical (seed theo localT)`, `rect ${n5.w}x${n5.h}, mean ${n5.mean}`);
      } else {
        fail(`D2 ${src.name}: snapshot noise05 2 lần pixel-identical`, `noise05 mean ${n5.mean} — b64 khác nhau`);
      }
      await drainErrors(cdp);
      await setEffects(cdp, JSON.stringify({ effects: [{ type: "noise", intensity: 1 }] }), `noise 1.0 ${src.name}`);
      const n10 = await snapAt(cdp, src.name, "noise10", 1.0);
      log(`${src.name}: plain mean ${p1.mean}, noise05 mean ${n5.mean}, noise10 mean ${n10.mean}`);
      await drainErrors(cdp);
    }

    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    writeFileEpermRetry(path.join(SCRATCH, `r71y2-snaps-w${WIN_W}.json`), JSON.stringify({
      window: `w${WIN_W}`, winW: WIN_W, winH: WIN_H,
      sources: SOURCES_RUN.map((s) => ({ name: s.name, file: path.basename(s.file), frame: s.frame })),
      proxyUsed, snaps,
    }, null, 2), { label: "r71y2-headed-capture snaps" });
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, `r71y2-headed-report-w${WIN_W}.json`), JSON.stringify({ window: `w${WIN_W}`, cases: results, pass: nPass, total: results.length, proxyUsed }, null, 2), { label: "r71y2-headed-capture report" });
    log(`KẾT QUẢ HEADED R71Y2 w${WIN_W}: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
