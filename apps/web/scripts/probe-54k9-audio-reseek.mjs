#!/usr/bin/env node
/**
 * probe-54k9-audio-reseek.mjs — Phase 9 đợt 54, luồng K9:
 * đo THẬT số lần syncMedia seek lại audio + độ tụt audio vs playhead,
 * TRƯỚC và SAU khi thêm chặn nhịp/deadband vào nhánh forward của syncMedia
 * (nợ J5 §6(b): audio re-seek ~10–12/lượt không đổi sau sửa clamp dt).
 *
 * Cách đo: vite dev + Chromium headed qua Xvfb + CDP (mẫu I2 đợt 52).
 * Project mẫu (8 s) + 1 clip audio tone 440 Hz 8 s import thật qua
 * fetch → File → store.importFiles → addMediaAtPlayhead. Bấm Phát,
 * lấy mẫu playhead/wall/ticks/reseeks/tickErrors mỗi 500 ms cho tới
 * khi hết timeline hoặc hết cửa sổ đo. Tỉ lệ playhead/wall + số lần
 * seek lại là số đo chính; gap rAF (p50/p95/max, lostMs) lấy từ
 * window.__vcutPreviewRaf để đối chiếu với clamp.
 *
 * Kỳ vọng TRƯỚC fix (clamp 0,1 s): playhead ~0,15× wall-clock ở
 * ~1,5 fps, reseek tăng đều (audio phát đúng tốc độ thật rồi bị seek
 * ngược về playhead mỗi khi drift > 0,35 s).
 * Kỳ vọng SAU fix (trần 2 s): playhead ~1,0× wall-clock, reseek chỉ
 * còn lần forceSeek lúc bấm Phát (+ sai số nhỏ do đồng hồ media).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/probe-54k9-audio-reseek.mjs
 * Env: K9_DEV_PORT (mặc định tự chọn 5281–5299), K9_DEBUG_PORT (9471–9489),
 * K9_DISPLAY (mặc định tự chọn :90–:99), K9_SCRATCH (mặc định
 * ~/workspace/tmp-round54-k9/reseek), K9_TONE (mặc định
 * ~/workspace/tmp-round53-j5/fixtures/tone440.wav), K9_WINDOW_S (mặc
 * định 15), K9_SAMPLE_MS (mặc định 250), K9_BURNERS (mặc định 2),
 * K9_TAG (mặc định "before" — tên file kết quả). Exit 0 khi đo xong
 * (kể cả khi re-seek cao — đây là probe đo, không phải cổng pass/fail);
 * exit 2 khi harness lỗi. KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.K9_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round54-k9", "reseek");
const TONE_PATH = process.env.K9_TONE || path.join(os.homedir(), "workspace", "tmp-round53-j5", "fixtures", "tone440.wav");
const WINDOW_S = Number(process.env.K9_WINDOW_S || 15);
// Đợt 53 J5 — số tiến trình đốt CPU trong cửa sổ phát (mặc định 2):
// FPS thấp của I9 đến từ VM bị tranh chấp; để tái hiện có chủ đích thì
// đốt CPU trong lúc đo (dừng ngay sau cửa sổ). 0 = không đốt (đo ở tải
// tự nhiên của VM lúc chạy).
const BURNERS = Number(process.env.K9_BURNERS || 2);
const SAMPLE_MS = Number(process.env.K9_SAMPLE_MS || 250);
const TAG = process.env.K9_TAG || "before";
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

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
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
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
  async waitFor(fn, label, timeoutMs = 180000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const INJECT_ERRORS = `(() => {
  window.__j5errors = [];
  window.addEventListener("error", (e) => {
    try { window.__j5errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__j5errors.push("window.onerror: <?>"); }
  });
  window.addEventListener("unhandledrejection", (e) => {
    try { window.__j5errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__j5errors.push("unhandledrejection: <?>"); }
  });
})()`;

// Snapshot store qua module thật mà app đã nạp (mẫu H6/I2).
const STORE_FN = `(() => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  return (async () => {
    const mod = window.__j5storeMod || (window.__j5storeMod = await import(hit));
    const st = mod.useStore.getState();
    return {
      name: st.spec.meta?.name ?? null,
      playhead: st.playhead,
      playing: st.playing,
      duration: st.duration(),
      tracks: st.spec.tracks.map((t) => ({ id: t.id, kind: t.kind, clips: t.clips.map((c) => ({
        id: c.id, kind: c.kind, start: +c.start.toFixed(3), duration: +c.duration.toFixed(3),
        volume: c.volume ?? null, volumeKeyframes: c.volumeKeyframes ?? null,
      })) })),
      media: st.media.map((m) => ({ id: m.id, name: m.name, kind: m.kind, duration: +m.duration.toFixed(3), proxyUrl: m.proxyUrl ?? null })),
    };
  })();
})()`;

// Import tone WAV thật qua fetch từ server tĩnh của harness → File →
// importFiles → thêm vào timeline ở playhead 0.
const IMPORT_TONE_FN = (toneUrl) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__j5storeMod || (window.__j5storeMod = await import(hit));
  const st = mod.useStore.getState();
  const res = await fetch(${JSON.stringify(toneUrl)});
  if (!res.ok) return { ok: false, reason: "fetch tone HTTP " + res.status };
  const blob = await res.blob();
  const file = new File([blob], "tone440.wav", { type: "audio/wav" });
  st.setPlayhead(0);
  await st.importFiles([file]);
  const after = mod.useStore.getState();
  const item = after.media.find((m) => m.name === "tone440.wav");
  if (!item) return { ok: false, reason: "importFiles xong mà không thấy tone440.wav trong bin" };
  after.addMediaAtPlayhead(item.id);
  const st2 = mod.useStore.getState();
  const audioTrack = st2.spec.tracks.find((t) => t.kind === "audio");
  const clip = audioTrack?.clips.find((c) => c.kind === "audio");
  return { ok: true, mediaId: item.id, itemDuration: item.duration,
    trackId: audioTrack?.id ?? null, clipId: clip?.id ?? null,
    clipStart: clip?.start ?? null, clipDuration: clip?.duration ?? null };
})()`;

// Mẫu đo 1 lần: playhead + wall + ticks + reseeks + tickErrors + playing.
const SAMPLE_FN = `(() => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  return (async () => {
    const mod = window.__j5storeMod || (window.__j5storeMod = await import(hit));
    const st = mod.useStore.getState();
    const idle = window.__vcutPreviewIdle || null;
    return {
      wallMs: performance.now(),
      playhead: st.playhead,
      playing: st.playing,
      ticks: idle ? idle.ticks : null,
      tickErrors: idle ? idle.tickErrors : null,
      reseeks: typeof window.__vcutSyncReseeks === "number" ? window.__vcutSyncReseeks : null,
      reseeksVideo: typeof window.__vcutSyncReseeksVideo === "number" ? window.__vcutSyncReseeksVideo : null,
      reseeksAudio: typeof window.__vcutSyncReseeksAudio === "number" ? window.__vcutSyncReseeksAudio : null,
      mediaState: window.__vcutMediaState ?? null,
      errors: (window.__j5errors || []).length,
    };
  })();
})()`;

// Thống kê gap rAF của vòng preview (hook __vcutPreviewRaf) — CHỈ mẫu
// đang phát (playing=true, loại justWoke). lost tính dưới cả 2 trần:
// 100 ms (clamp cũ) và 2000 ms (trần mới) để đối chiếu trước/sau mà
// không phụ thuộc hook đang mirror trần nào.
const RAF_STATS_FN = `(() => {
  const hook = window.__vcutPreviewRaf;
  if (!hook || !hook.samples || hook.samples.length === 0) return null;
  const playing = hook.samples.filter((s) => s.playing && !s.justWoke);
  if (playing.length === 0) return { n: 0, note: "không có mẫu đang phát" };
  const gaps = playing.map((s) => s.gapMs).sort((a, b) => a - b);
  const pct = (p) => gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))];
  const lostUnder = (capMs) => playing.reduce((s, x) => s + Math.max(0, x.gapMs - capMs), 0);
  const wallMs = playing[playing.length - 1].t - playing[0].t;
  return {
    n: playing.length,
    gapP50: +pct(0.5).toFixed(1),
    gapP95: +pct(0.95).toFixed(1),
    gapMax: +gaps[gaps.length - 1].toFixed(1),
    fpsApprox: +(1000 / pct(0.5)).toFixed(2),
    lostMsCap100: +lostUnder(100).toFixed(1),
    lostMsCap2000: +lostUnder(2000).toFixed(1),
    predictedRateCap100: wallMs > 0 ? +(1 - lostUnder(100) / wallMs).toFixed(3) : null,
    predictedRateCap2000: wallMs > 0 ? +(1 - lostUnder(2000) / wallMs).toFixed(3) : null,
  };
})()`;

const MODAL_SEL = ".modal-backdrop, .tour-card, .welcome-modal";

// Bấm nút Phát bằng click chuột THẬT qua CDP (tạo user gesture —
// .click() tổng hợp qua evaluate KHÔNG tạo activation nên AudioContext
// có thể giữ suspended và el.play() bị chặn). Trả về rect đã bấm.
async function clickPlay(cdp) {
  const r = await cdp.evalJs(`(() => {
    const b = document.querySelector('.tbtn.play');
    if (!b) return null;
    const rect = b.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  if (!r) throw new Error("không thấy nút .tbtn.play");
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(r.x), y: Math.round(r.y), button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(r.x), y: Math.round(r.y), button: "left", clickCount: 1 });
  await sleep(300);
  return r;
}


async function closeModal(cdp) {
  const present = await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`);
  if (!present) return "không có modal";
  await cdp.evalJs(`(() => { const m = document.querySelector(${JSON.stringify(MODAL_SEL)}); if (m) { const b = m.querySelector("button"); b?.click(); } return true; })()`).catch(() => {});
  await sleep(600);
  let gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  if (!gone) {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" }).catch(() => {});
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" }).catch(() => {});
    await sleep(600);
    gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  }
  return gone ? "đã đóng modal" : "modal vẫn mở sau các cách đóng";
}

async function main() {
  const result = { tag: TAG, windowS: WINDOW_S, cases: {}, samples: [], rafStats: null, errors: [] };
  let vite = null, xvfb = null, chrome = null, toneServer = null;
  let harnessError = null;

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { toneServer?.close(); } catch {}
  };
  process.on("exit", killAll);

  try {
    const DEV_PORT = Number(process.env.K9_DEV_PORT || 0) || (await pickFreePort(5281, 5299));
    const DEBUG_PORT = Number(process.env.K9_DEBUG_PORT || 0) || (await pickFreePort(9471, 9489));
    const TONE_PORT = await pickFreePort(5381, 5399);
    const DISPLAY = process.env.K9_DISPLAY || pickFreeDisplay();
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5281–5299");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9471–9489");
    if (!TONE_PORT) throw new Error("hết cổng tone trống 5381–5399");
    if (!DISPLAY) throw new Error("hết display Xvfb trống :90–:99");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(TONE_PATH)) throw new Error(`không thấy tone ${TONE_PATH}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const TONE_URL = `http://127.0.0.1:${TONE_PORT}/tone440.wav`;
    const PROFILE = path.join(SCRATCH, `cdprof-drift-${TAG}`);
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, tone :${TONE_PORT}, DISPLAY=${DISPLAY}, tag=${TAG}`);

    // Server tĩnh phục vụ tone WAV cho import thật trong trang.
    const toneBytes = fs.readFileSync(TONE_PATH);
    toneServer = http.createServer((req, res) => {
      if (req.url === "/tone440.wav") {
        res.writeHead(200, { "Content-Type": "audio/wav", "Content-Length": toneBytes.length, "Access-Control-Allow-Origin": "*" });
        res.end(toneBytes);
      } else { res.writeHead(404); res.end(); }
    });
    await new Promise((res, rej) => { toneServer.once("error", rej); toneServer.listen(TONE_PORT, "127.0.0.1", res); });

    const viteLogFd = fs.openSync(path.join(SCRATCH, `drift-${TAG}-vite.log`), "w");
    vite = spawn(VITE_BIN, ["--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [`${DISPLAY}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, `drift-${TAG}-chrome.log`), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
    let pageTarget = null;
    for (let i = 0; i < 360 && !pageTarget; i++) {
      try {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 5000);
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`, { signal: ctl.signal })).json();
        clearTimeout(to);
        pageTarget = (pages || []).find((p) => p.type === "page") || null;
      } catch {}
      if (!pageTarget) await sleep(500);
    }
    if (!pageTarget) throw new Error("không tìm thấy target type=page sau 180 s");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT_ERRORS });
    log("CDP đã nối, đã cài thu lỗi trang (__j5errors)");

    await cdp.send("Page.navigate", { url: DEV_URL });
    // Chờ từ phía Node (eval ngắn mỗi lần) — KHÔNG chờ bằng vòng lặp
    // dài trong trang: CDP.send timeout 60 s sẽ giết evaluate đó.
    const st0 = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll(".tl-clip").length`).catch(() => 0);
      return n >= 3 ? true : null;
    }, "project mẫu >= 3 clip", 180000).catch(() => false);
    if (!st0) throw new Error("project mẫu không load (>= 3 clip) sau 180 s");
    const snap0 = await cdp.evalJs(STORE_FN);
    log(`sample: name=${snap0.name} duration=${snap0.duration} tracks=${snap0.tracks.length}`);
    result.cases.sample = { ok: snap0.name === "Dự án mẫu", duration: snap0.duration };

    const modalRes = await closeModal(cdp);
    log(`modal: ${modalRes}`);

    const imp = await cdp.evalJs(IMPORT_TONE_FN(TONE_URL));
    log(`import tone: ${JSON.stringify(imp)}`);
    result.cases.importTone = { ok: !!imp.ok, ...imp };
    if (!imp.ok) throw new Error(`import tone thất bại: ${imp.reason}`);

    // Bấm Phát (nút thật), lấy mẫu cho tới khi hết timeline / hết cửa sổ.
    const base = await cdp.evalJs(SAMPLE_FN);
    result.base = base;
    log(`baseline: playhead=${base.playhead} ticks=${base.ticks} reseeks=${base.reseeks} (video ${base.reseeksVideo} / audio ${base.reseeksAudio}) tickErrors=${base.tickErrors}`);
    // Đốt CPU trong cửa sổ đo để tái hiện VM tranh chấp (FPS thấp như I9).
    const burners = [];
    for (let i = 0; i < BURNERS; i++) {
      try { burners.push(spawn("yes", [], { stdio: "ignore" })); } catch {}
    }
    if (burners.length > 0) log(`đốt CPU: ${burners.length} tiến trình yes trong cửa sổ đo`);
    await clickPlay(cdp);
    const playingCheck = await cdp.evalJs(STORE_FN);
    result.cases.playPressed = { ok: playingCheck.playing === true, playing: playingCheck.playing };
    log(`sau bấm Phát: playing=${playingCheck.playing} (cần true)`);
    if (!playingCheck.playing) {
      for (const b of burners) { try { b.kill("SIGKILL"); } catch {} }
      throw new Error("bấm Phát không có tác dụng");
    }

    const t0 = Date.now();
    let lastSample = null;
    while (Date.now() - t0 < WINDOW_S * 1000) {
      const s = await cdp.evalJs(SAMPLE_FN);
      result.samples.push(s);
      lastSample = s;
      if (!s.playing) break;
      await sleep(SAMPLE_MS);
    }
    for (const b of burners) { try { b.kill("SIGKILL"); } catch {} }
    log("đã dừng đốt CPU");
    const rafStats = await cdp.evalJs(RAF_STATS_FN);
    result.rafStats = rafStats;
    const endSnap = await cdp.evalJs(STORE_FN);
    result.endPlaying = endSnap.playing;
    result.endPlayhead = endSnap.playhead;
    // Dừng phát nếu còn chạy (để dọn dẹp sạch).
    if (endSnap.playing) await cdp.evalJs(`document.querySelector('.tbtn.play')?.click()`).catch(() => {});
    await sleep(400);
    const errList = await cdp.evalJs(`(window.__j5errors || []).slice()`);
    result.errors = errList;
    result.cdpExceptions = cdp.exceptions.slice();

    // Tính tỉ lệ playhead/wall trên cửa sổ ĐANG PHÁT (loại mẫu đã dừng).
    const playingSamples = result.samples.filter((s) => s.playing);
    let ratio = null, reseekDelta = null, reseekVideoDelta = null, reseekAudioDelta = null, tickErrorDelta = null;
    if (playingSamples.length >= 2) {
      const first = playingSamples[0];
      const last = playingSamples[playingSamples.length - 1];
      const wallS = (last.wallMs - first.wallMs) / 1000;
      const phDelta = last.playhead - first.playhead;
      ratio = wallS > 0 ? +(phDelta / wallS).toFixed(3) : null;
      reseekDelta = (last.reseeks ?? 0) - (first.reseeks ?? 0);
      reseekVideoDelta = (last.reseeksVideo ?? 0) - (first.reseeksVideo ?? 0);
      reseekAudioDelta = (last.reseeksAudio ?? 0) - (first.reseeksAudio ?? 0);
      tickErrorDelta = (last.tickErrors ?? 0) - (first.tickErrors ?? 0);
      result.measure = {
        samples: playingSamples.length,
        wallS: +wallS.toFixed(2),
        playheadDeltaS: +phDelta.toFixed(3),
        ratio,
        reseekDelta,
        reseekVideoDelta,
        reseekAudioDelta,
        tickErrorDelta,
        firstPlayhead: first.playhead,
        lastPlayhead: last.playhead,
      };
    }
    // K9 — thống kê độ tụt audio vs playhead theo từng mẫu đang phát:
    // lag = playhead - currentTime của element AUDIO (dương = tụt sau).
    // Ghi cả lag ngay trước mỗi lần reseekAudio tăng (ngưỡng kích hoạt thật)
    // và lag ngay sau (điểm rơi sau seek), để tách jitter thoáng qua khỏi
    // drift tăng đều — quyết định deadband có tác dụng hay không.
    const lagStats = (() => {
      const lags = [];
      const lagAtReseek = [];
      const lagAfterReseek = [];
      let prevAudio = null;
      let prevLag = null;
      for (const smp of playingSamples) {
        const audioEls = (smp.mediaState || []).filter((m) => m.tag === "AUDIO");
        if (audioEls.length === 0) continue;
        const lag = +(smp.playhead - audioEls[0].currentTime).toFixed(3);
        lags.push(lag);
        const curAudio = smp.reseeksAudio;
        if (prevAudio !== null && curAudio !== null && curAudio > prevAudio) {
          if (prevLag !== null) lagAtReseek.push(prevLag);
          lagAfterReseek.push(lag);
        }
        prevAudio = curAudio;
        prevLag = lag;
      }
      if (lags.length === 0) return { n: 0, note: "không có mẫu AUDIO đang phát" };
      const sorted = [...lags].sort((a, b) => a - b);
      const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
      const mean = lags.reduce((a, b) => a + b, 0) / lags.length;
      const over = lags.filter((l) => l > 0.35).length;
      return {
        n: lags.length,
        mean: +mean.toFixed(3),
        p50: +pct(0.5).toFixed(3),
        p95: +pct(0.95).toFixed(3),
        max: +sorted[sorted.length - 1].toFixed(3),
        min: +sorted[0].toFixed(3),
        fracOver035: +(over / lags.length).toFixed(3),
        lagAtReseek,
        lagAfterReseek,
      };
    })();
    result.lagStats = lagStats;
    // K9 — số mẫu đang phát mà element AUDIO ở trạng thái seeking (seek chồng?).
    const seekingSamples = playingSamples.filter((s) => (s.mediaState || []).some((m) => m.tag === "AUDIO" && m.seeking)).length;
    result.audioSeekingSamples = seekingSamples;
    log(`KẾT QUẢ [${TAG}]: ratio=${ratio} (playhead/wall), reseekDelta=${reseekDelta} (video ${reseekVideoDelta} / audio ${reseekAudioDelta}), tickErrorDelta=${tickErrorDelta}, raf=${JSON.stringify(rafStats)}, errors=${errList.length}, cdpExc=${cdp.exceptions.length}`);
    log(`LAG AUDIO [${TAG}]: ${JSON.stringify(lagStats)}, mẫu seeking=${seekingSamples}/${playingSamples.length}`);
  } catch (e) {
    harnessError = e;
    log(`HARNESS LỖI: ${e instanceof Error ? e.message : e}`);
  } finally {
    killAll();
  }
  result.harnessError = harnessError ? String(harnessError.message || harnessError) : null;
  writeFileEpermRetry(path.join(SCRATCH, `drift-${TAG}-result.json`), JSON.stringify(result, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, `drift-${TAG}-log.txt`), logLines.join("\n") + "\n");
  log(`đã ghi ${path.join(SCRATCH, `drift-${TAG}-result.json`)}`);
  process.exit(harnessError ? 2 : 0);
}

void main();
