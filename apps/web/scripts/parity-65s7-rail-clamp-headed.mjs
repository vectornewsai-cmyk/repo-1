#!/usr/bin/env node
/**
 * parity-65s7-rail-clamp-headed.mjs — Phase 9 đợt 65, luồng S7:
 * đóng nợ đợt 61 §5.10(b): effects preview sharpen/noise chưa kiểm chứng
 * parity preview↔render sau khi previewEngine thêm effect mới.
 *
 * Đo THẬT bằng pixel-compare HEADED (Chromium headed qua Xvfb + CDP,
 * vite dev, canvas preview thật) đối chiếu với frame render FFmpeg thật:
 *   - sharpen 0.5 / 1.0: MAD tuyệt đối + MAD của DELTA (preview_sharp −
 *     preview_plain so với render_sharp − render_plain; delta triệt tiêu
 *     sai số YUV↔RGB và nén CRF chung của 2 đường).
 *   - noise 0.5 / 1.0: nhiễu render là ngẫu nhiên theo frame nên KHÔNG so
 *     từng pixel; so thống kê của delta (std từng kênh, kurtosis, tương
 *     quan chéo kênh) theo tiêu chí parity test Node (đợt 16 H5).
 *   - Đối chứng plain (không effect): MAD preview↔render để biết sàn sai
 *     số của chuỗi đo (decode + CRF 20 + downscale viewport).
 *
 * Thiết lập: video test tự sinh bằng ffmpeg (testsrc2 1280×720 30fps 4s,
 * hidden_files/round65-s7/media/test-pattern.mp4), seed project qua
 * localStorage autosave + import media bằng DOM.setFileInputFiles (mẫu
 * R29 L1), effects đặt qua store.patchClip (đúng action panel dùng — mẫu
 * R61 R3; EffectsPanel đã click-test riêng ở các đợt trước).
 * Playhead 1.0 (frame 30); render worker render cùng spec rồi lấy đúng
 * frame 30 bằng select='eq(n,30)' (không -ss, tránh lệch keyframe).
 * Render frame được downscale bilinear về đúng kích thước vùng video
 * trong canvas preview trước khi so (preview vẽ effect ở 1280×720 rồi
 * drawImage xuống viewport — so ở khổ viewport mới công bằng).
 *
 * Tiêu chí (harness V6/V14): KHỚP = MAD <= 2 và >= 99% pixel lệch <= 8;
 * XẤP XỈ = MAD <= 20 và >= 90% pixel lệch <= 32. Noise: tỉ lệ std
 * [0.8, 1.25], |corr| <= 0.1, kurtosis [-0.6, 0.6].
 *
 * Chạy (từ gốc repo): node apps/web/scripts/parity-65s7-rail-clamp-headed.mjs
 * Env: R65_DEV_PORT (mặc định tự chọn 5560–5569), R65_DEBUG_PORT (9660–9669),
 * R65_DISPLAY (mặc định quét :170–:179), R65_SCRATCH (mặc định
 * hidden_files/round65-s7/headed), R65_WIN_W/R65_WIN_H (mặc định 1440×900 —
 * tăng lên 2560×1600 để preview upscale thay vì downscale, kiểm tra cơ
 * chế lệch sharpen có phải do downscale không).
 * Exit 0 khi mọi case đo xong có verdict + xác định 2 lần identical +
 * 0 lỗi trang; verdict KHỚP/XẤP XỈ/LỆCH được ghi vào JSON + LIMITS (không
 * giấu). Exit 1 có case FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 * KHÔNG sửa code sản phẩm trong harness này.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round65-s7");
const SCRATCH = process.env.R65_SCRATCH || path.join(GOAL, "headed");
const MEDIA_DIR = path.join(GOAL, "media");
const RENDER_DIR = path.join(GOAL, "render");
const MEDIA_FILE = path.join(MEDIA_DIR, "test-pattern.mp4");
const CHROME = process.env.R65_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
// Đợt 63 R8: chromium-1248 của đợt 62 không còn trên máy (chỉ còn
// 1187/1254) — dùng 1254 (Chrome for Testing 158); override bằng env
// R65_CHROME nếu cần.
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round65-s7";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r8.config.mjs");
const RENDER_JS = path.join(ROOT, "server", "render", "src", "render.js");

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
  window.__r65errors = [];
  window.addEventListener("error", (e) => { try { window.__r65errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r65errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r65errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r65errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r65storeMod || (window.__r65storeMod = await import(hit));
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
  return {
    clips, selection: st.selection, playhead: st.playhead, playing: st.playing,
    meta: st.spec.meta, idle, media,
    errors: (window.__r65errors || []).slice(),
  };
})()`;

const SPEC_FN = `(async () => {
  const st = await (${STORE_FN});
  return JSON.parse(JSON.stringify(st.spec));
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const st2 = window.__r65storeMod.useStore.getState();
  const c = st2.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)}).clips.find((x) => x.id === ${JSON.stringify(clipId)});
  return { patched: n, effects: c.effects ?? null };
})()`;

// Snapshot canvas preview (mẫu mỗi 4px, như R3) + hình học vùng video.
const SNAP_FN = (slot) => `(window.__r65snaps = window.__r65snaps || {}, window.__r65snaps[${JSON.stringify(slot)}] = (() => {
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
  const W = 1280, H = 720;
  const scale = Math.min(w / W, h / H);
  const rect = { x: (w - W * scale) / 2, y: (h - H * scale) / 2, w: W * scale, h: H * scale, scale };
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  return { ok: true, w, h, step, n: data.length / 3, data, rect, mean: +(sum / data.length).toFixed(2) };
})(), { ok: window.__r65snaps[${JSON.stringify(slot)}].ok, w: window.__r65snaps[${JSON.stringify(slot)}].w, h: window.__r65snaps[${JSON.stringify(slot)}].h, n: window.__r65snaps[${JSON.stringify(slot)}].n, mean: window.__r65snaps[${JSON.stringify(slot)}].mean, rect: window.__r65snaps[${JSON.stringify(slot)}].rect, reason: window.__r65snaps[${JSON.stringify(slot)}].reason || null })`;

const DIFF_FN = (a, b) => `((sa, sb) => {
  if (!sa || !sb || !sa.ok || !sb.ok) return { ok: false, reason: "snapshot thiếu" };
  if (sa.w !== sb.w || sa.h !== sb.h) return { ok: false, reason: "canvas đổi kích thước" };
  if (sa.data.length !== sb.data.length) return { ok: false, reason: "số mẫu lệch" };
  let sum = 0, changed = 0;
  for (let i = 0; i < sa.data.length; i++) {
    const d = Math.abs(sa.data[i] - sb.data[i]);
    sum += d;
    if (d > 0) changed++;
  }
  const n = sa.data.length;
  return { ok: true, meanAbs: +(sum / n).toFixed(4), changedPct: +((changed / n) * 100).toFixed(2), n };
})(window.__r65snaps[${JSON.stringify(a)}], window.__r65snaps[${JSON.stringify(b)}])`;

const SEED_SPEC = {
  version: "0.2.0",
  meta: { name: "R63R8 sharpen-noise parity", width: 1280, height: 720, fps: 30 },
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
  const specs = {};   // variant -> spec JSON (lấy từ store sau mỗi patch)
  const snaps = {};   // variant -> snapshot (lấy từ window.__r65snaps qua CDP)

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
    const e = (await cdp.evalJs(`(window.__r65errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r65errors = []`).catch(() => {});
    return e;
  }

  async function waitIdle(cdp, label) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, 90000);
  }

  async function snapAt(cdp, slot, playhead) {
    await cdp.evalJs(SET_PLAYHEAD_FN(playhead));
    await waitIdle(cdp, `snapshot ${slot} @${playhead}`);
    const s = await cdp.evalJs(SNAP_FN(slot));
    if (!s.ok) throw new Error(`snapshot ${slot} thất bại: ${s.reason}`);
    if (s.mean < 5) throw new Error(`snapshot ${slot} quá tối (mean=${s.mean}) — video chưa load/seek chưa xong?`);
    snaps[slot] = await cdp.evalJs(`window.__r65snaps[${JSON.stringify(slot)}]`);
    return s;
  }

  async function setEffects(cdp, effectsJson, label) {
    const p = await cdp.evalJs(PATCH_FN("v1", "c1", effectsJson));
    const want = effectsJson === "{ effects: undefined }" ? null : JSON.parse(effectsJson).effects;
    const got = JSON.stringify(p.effects ?? null);
    if (got !== JSON.stringify(want ?? null)) throw new Error(`patch effects ${label} thất bại: muốn ${JSON.stringify(want)}, được ${got}`);
    return p;
  }

  try {
    if (!fs.existsSync(MEDIA_FILE)) throw new Error(`không thấy video test ${MEDIA_FILE}`);
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = Number(process.env.R65_DEV_PORT || 0) || (await pickFreePort(5560, 5569));
    const DEBUG_PORT = Number(process.env.R65_DEBUG_PORT || 0) || (await pickFreePort(9660, 9669));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 170; n <= 179; n++) {
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
    const DISPLAY = process.env.R65_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :170–:179");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5560–5569");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9660–9669");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const WIN_W = Number(process.env.R65_WIN_W || 1440);
    const WIN_H = Number(process.env.R65_WIN_H || 900);
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round65-s7/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r65-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r65-chrome.log"), "w");
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
    // Seed project qua autosave envelope rồi reload (mẫu R29 L1).
    await cdp.evalJs(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(SEED_SPEC, "R63R8 sharpen-noise parity"))});`);
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
    // Import media thật vào bin (mẫu R29 L1).
    await cdp.waitFor(async () => (await cdp.evalJs(`!!document.querySelector(".mediabin")`)) ? true : null, "MediaBin sẵn", 30000);
    const doc = await cdp.send("DOM.getDocument", { depth: 0 });
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" });
    if (!q.nodeId) throw new Error("không tìm được file input của MediaBin qua DOM.querySelector");
    await cdp.send("DOM.setFileInputFiles", { files: [MEDIA_FILE], nodeId: q.nodeId });
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.media.some((m) => m.name === "test-pattern.mp4") ? t : null;
    }, "media test-pattern.mp4 vào bin", 60000);
    log("media đã vào bin");
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 1 && t.clips[0].clipId === "c1" && t.idle && t.idle.sleeping ? t : null;
    }, "project seed (1 clip c1) + preview ngủ", 120000);
    await drainErrors(cdp);
    const proxyUsed = s0.media.find((m) => m.name === "test-pattern.mp4")?.proxy === true;
    log(`setup: clip c1, media proxy=${proxyUsed} (video 720p phải là false — proxy skip <=720p)`);
    if (proxyUsed) log("CẢNH BÁO: preview đang dùng proxy — số parity sẽ bao gồm cả sai số proxy, ghi rõ trong LIMITS");

    // ---- C1: plain @1.0, 2 lần -> xác định -------------------------------
    await snapAt(cdp, "plain", 1.0);
    await snapAt(cdp, "plain2", 1.0);
    const dPlain = await cdp.evalJs(DIFF_FN("plain", "plain2"));
    if (dPlain.ok && dPlain.meanAbs === 0) pass("C1 xác định: snapshot plain 2 lần lúc pause pixel-identical", `plain vs plain2: mean ${dPlain.meanAbs}, ${dPlain.changedPct}% đổi (n=${dPlain.n})`);
    else fail("C1 xác định: snapshot plain 2 lần lúc pause pixel-identical", `diff=${JSON.stringify(dPlain)}`);
    specs.plain = await cdp.evalJs(SPEC_FN);
    await drainErrors(cdp);

    // ---- C2: sharpen 0.5 --------------------------------------------------
    await setEffects(cdp, JSON.stringify({ effects: [{ type: "sharpen", intensity: 0.5 }] }), "sharpen 0.5");
    await snapAt(cdp, "sharp05", 1.0);
    const dSharp05 = await cdp.evalJs(DIFF_FN("plain", "sharp05"));
    // Ngưỡng 0.1 (không phải 0.5): ở cửa sổ lớn (upscale) delta sharpen
    // tuyệt đối nhỏ hơn (0.44) nhưng vẫn đổi 6.44% channel — hiệu ứng thật.
    if (dSharp05.ok && dSharp05.meanAbs > 0.1 && dSharp05.changedPct > 1) {
      pass("C2 sharpen 0.5 đổi pixel thật trên preview", `plain vs sharp05: mean ${dSharp05.meanAbs}, ${dSharp05.changedPct}% channel đổi`);
    } else fail("C2 sharpen 0.5 đổi pixel thật trên preview", `diff=${JSON.stringify(dSharp05)}`);
    specs.sharp05 = await cdp.evalJs(SPEC_FN);
    await drainErrors(cdp);

    // ---- C3: sharpen 1.0 --------------------------------------------------
    await setEffects(cdp, JSON.stringify({ effects: [{ type: "sharpen", intensity: 1 }] }), "sharpen 1.0");
    await snapAt(cdp, "sharp10", 1.0);
    const dSharp10 = await cdp.evalJs(DIFF_FN("plain", "sharp10"));
    if (dSharp10.ok && dSharp10.meanAbs > dSharp05.meanAbs) {
      pass("C3 sharpen 1.0 đổi pixel mạnh hơn 0.5 (đơn điệu theo intensity)", `plain vs sharp10: mean ${dSharp10.meanAbs} > sharp05 ${dSharp05.meanAbs}`);
    } else fail("C3 sharpen 1.0 đổi pixel mạnh hơn 0.5", `diff10=${JSON.stringify(dSharp10)}, diff05=${JSON.stringify(dSharp05)}`);
    specs.sharp10 = await cdp.evalJs(SPEC_FN);
    await drainErrors(cdp);

    // ---- C4: noise 0.5 — đổi pixel + xác định -----------------------------
    await setEffects(cdp, JSON.stringify({ effects: [{ type: "noise", intensity: 0.5 }] }), "noise 0.5");
    await snapAt(cdp, "noise05", 1.0);
    await snapAt(cdp, "noise05b", 1.0);
    const dNoise05 = await cdp.evalJs(DIFF_FN("plain", "noise05"));
    const dNoiseDet = await cdp.evalJs(DIFF_FN("noise05", "noise05b"));
    if (dNoise05.ok && dNoise05.meanAbs > 0.5) {
      pass("C4 noise 0.5 đổi pixel thật trên preview", `plain vs noise05: mean ${dNoise05.meanAbs}, ${dNoise05.changedPct}% channel đổi`);
    } else fail("C4 noise 0.5 đổi pixel thật trên preview", `diff=${JSON.stringify(dNoise05)}`);
    if (dNoiseDet.ok && dNoiseDet.meanAbs === 0) pass("C4b noise xác định: snapshot noise 2 lần lúc pause pixel-identical (seed theo localT)", `noise05 vs noise05b: mean ${dNoiseDet.meanAbs}`);
    else fail("C4b noise xác định: snapshot noise 2 lần lúc pause pixel-identical", `diff=${JSON.stringify(dNoiseDet)}`);
    specs.noise05 = await cdp.evalJs(SPEC_FN);
    await drainErrors(cdp);

    // ---- C5: noise 1.0 ----------------------------------------------------
    await setEffects(cdp, JSON.stringify({ effects: [{ type: "noise", intensity: 1 }] }), "noise 1.0");
    await snapAt(cdp, "noise10", 1.0);
    const dNoise10 = await cdp.evalJs(DIFF_FN("plain", "noise10"));
    if (dNoise10.ok && dNoise10.meanAbs > dNoise05.meanAbs) {
      pass("C5 noise 1.0 đổi pixel mạnh hơn 0.5 (đơn điệu theo intensity)", `plain vs noise10: mean ${dNoise10.meanAbs} > noise05 ${dNoise05.meanAbs}`);
    } else fail("C5 noise 1.0 đổi pixel mạnh hơn 0.5", `diff10=${JSON.stringify(dNoise10)}, diff05=${JSON.stringify(dNoise05)}`);
    specs.noise10 = await cdp.evalJs(SPEC_FN);
    await drainErrors(cdp);

    // ---- H9: 0 lỗi trang ---------------------------------------------------
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    // Lưu spec + snapshot để phần so sánh Node dùng.
    fs.mkdirSync(RENDER_DIR, { recursive: true });
    for (const [k, spec] of Object.entries(specs)) {
      fs.writeFileSync(path.join(RENDER_DIR, `spec-${k}.json`), JSON.stringify(spec, null, 2));
    }
    fs.writeFileSync(path.join(SCRATCH, "r65-preview-snaps.json"), JSON.stringify(snaps, null, 2));
    log(`spec đã lưu: ${Object.keys(specs).join(", ")}; snapshot đã lưu (${Object.keys(snaps).length} slot)`);

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "r65-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length, proxyUsed }, null, 2));
    log(`KẾT QUẢ HEADED R65 S7 (preview): ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
