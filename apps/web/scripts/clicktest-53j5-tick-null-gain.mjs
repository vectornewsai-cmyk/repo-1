#!/usr/bin/env node
/**
 * clicktest-53j5-tick-null-gain.mjs — Phase 9 đợt 53, luồng J5 (mảng 2):
 * chứng minh headed ĐƯỜNG TICK PREVIEW THẬT cho computeClipGain với
 * volumeKeyframes [null] (đóng nợ I2 §6.1 — I2 chỉ chứng minh được qua
 * gọi module, chưa qua tick).
 *
 * Cách làm: vite dev + Chromium headed qua Xvfb + CDP (mẫu I2 đợt 52).
 * Import thật tone 440 Hz 8 s → thêm vào timeline → patchClip đặt
 * volume 0.5 + volumeKeyframes {keyframes:[null]} lên clip audio →
 * bấm Phát thật → trong lúc phát:
 *  (a) tickErrors của vòng preview KHÔNG tăng (lỗi tick — gồm cả ném
 *      từ computeClipGain — được loop bọc try/catch và đếm vào
 *      __vcutPreviewIdle.tickErrors, kèm console.error);
 *  (b) 0 window.onerror / unhandledrejection / CDP exception mới;
 *  (c) gain ĐÚNG qua analyser master bus (__vcutAudioAnalyser): đo RMS
 *      tín hiệu khi phát [null] @ volume 0.5, rồi đối chứng cùng clip
 *      với keyframes GỠ BỎ (volume 0.5 tĩnh) và với volume 1.0 — RMS
 *      [null] phải ≈ RMS tĩnh 0.5 (tỉ lệ ~1,0) và ≈ ½ RMS volume 1.0.
 *      Analyser đọc tín hiệu SAU GainNode nên đây là bằng chứng
 *      end-to-end qua tick thật, không phải gọi hàm rời.
 *  (d) đỏ-trước (sanity của harness): đổi volume 0.5 → 1.0 TRONG LÚC
 *      phát bằng patchClip thật và thấy RMS tăng ~2× — chứng tỏ phép đo
 *      RMS thực sự nhạy với gain (không phải số chết).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-53j5-tick-null-gain.mjs
 * Env: J5_DEV_PORT (mặc định tự chọn 5281–5299), J5_DEBUG_PORT (9471–9489),
 * J5_DISPLAY (mặc định tự chọn :90–:99), J5_SCRATCH (mặc định
 * ~/workspace/tmp-round53-j5/ticknull), J5_TONE (mặc định
 * ~/workspace/tmp-round53-j5/fixtures/tone440.wav). Exit 0 mọi case PASS,
 * 1 có FAIL, 2 harness lỗi. KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.J5_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round53-j5", "ticknull");
const TONE_PATH = process.env.J5_TONE || path.join(os.homedir(), "workspace", "tmp-round53-j5", "fixtures", "tone440.wav");
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
    this.consoleErrors = [];
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
      if (msg.method === "Runtime.consoleAPICalled" && msg.params?.type === "error") {
        this.consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? JSON.stringify(a)).join(" ").slice(0, 500));
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
      media: st.media.map((m) => ({ id: m.id, name: m.name, kind: m.kind, duration: +m.duration.toFixed(3) })),
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

// Patch volume/volumeKeyframes lên clip audio qua patchClip thật.
const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__j5storeMod || (window.__j5storeMod = await import(hit));
  const st = mod.useStore.getState();
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const after = mod.useStore.getState().spec.tracks
    .find((t) => t.id === ${JSON.stringify(trackId)})?.clips
    .find((c) => c.id === ${JSON.stringify(clipId)});
  return { patched: n, volume: after?.volume ?? null, volumeKeyframes: after?.volumeKeyframes ?? null };
})()`;

// Đo RMS thật qua AnalyserNode master bus (__vcutAudioAnalyser) trong
// 1,2 s (đọc getByteTimeDomainData 6 lần, cách nhau 200 ms). Trả null
// khi analyser chưa sẵn sàng (chưa ensure() — chưa bấm Phát lần nào).
// RMS tính trên thang 0..1 (byte 128 = 0), bỏ mẫu toàn im lặng (đầu
// phát, element chưa chạy) ra khỏi trung bình.
const RMS_FN = `(async () => {
  const an = window.__vcutAudioAnalyser;
  if (!an) return { ok: false, reason: "analyser chưa sẵn sàng (null)" };
  const buf = new Uint8Array(an.fftSize);
  const vals = [];
  for (let i = 0; i < 6; i++) {
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (let j = 0; j < buf.length; j++) { const d = (buf[j] - 128) / 128; sum += d * d; }
    const rms = Math.sqrt(sum / buf.length);
    vals.push(+rms.toFixed(4));
    await new Promise((r) => setTimeout(r, 200));
  }
  const audible = vals.filter((v) => v > 0.005);
  const mean = audible.length > 0 ? audible.reduce((a, b) => a + b, 0) / audible.length : 0;
  return { ok: true, vals, audible: audible.length, mean: +mean.toFixed(4) };
})()`;

// Gọi computeClipGain THẬT trong trang (module audioEngine mà app nạp)
// để neo giá trị kỳ vọng cho cùng clip (như I2 I3).
const GAIN_FN = (clipJson, elapsed) => `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/lib\\/audioEngine\\.ts(\\?|$)/.test(u)) || "/src/lib/audioEngine.ts";
  const mod = window.__j5audioMod || (window.__j5audioMod = await import(hit));
  try { return { gain: mod.computeClipGain(${clipJson}, ${elapsed}, false, 1) }; }
  catch (e) { return { threw: String(e && e.message || e) }; }
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
  await cdp.evalJs(`(() => { const m = document.querySelector(${JSON.stringify(MODAL_SEL)}); const b = m?.querySelector("button"); b?.click(); return true; })()`).catch(() => {});
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
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
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
    const DEV_PORT = Number(process.env.J5_DEV_PORT || 0) || (await pickFreePort(5281, 5299));
    const DEBUG_PORT = Number(process.env.J5_DEBUG_PORT || 0) || (await pickFreePort(9471, 9489));
    const TONE_PORT = await pickFreePort(5381, 5399);
    const DISPLAY = process.env.J5_DISPLAY || pickFreeDisplay();
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5281–5299");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9471–9489");
    if (!TONE_PORT) throw new Error("hết cổng tone trống 5381–5399");
    if (!DISPLAY) throw new Error("hết display Xvfb trống :90–:99");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(TONE_PATH)) throw new Error(`không thấy tone ${TONE_PATH}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const TONE_URL = `http://127.0.0.1:${TONE_PORT}/tone440.wav`;
    const PROFILE = path.join(SCRATCH, "cdprof-ticknull");
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, tone :${TONE_PORT}, DISPLAY=${DISPLAY}`);

    const toneBytes = fs.readFileSync(TONE_PATH);
    toneServer = http.createServer((req, res) => {
      if (req.url === "/tone440.wav") {
        res.writeHead(200, { "Content-Type": "audio/wav", "Content-Length": toneBytes.length, "Access-Control-Allow-Origin": "*" });
        res.end(toneBytes);
      } else { res.writeHead(404); res.end(); }
    });
    await new Promise((res, rej) => { toneServer.once("error", rej); toneServer.listen(TONE_PORT, "127.0.0.1", res); });

    const viteLogFd = fs.openSync(path.join(SCRATCH, "ticknull-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "ticknull-chrome.log"), "w");
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
    const loaded = await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll(".tl-clip").length`).catch(() => 0);
      return n >= 3 ? true : null;
    }, "project mẫu >= 3 clip", 180000).catch(() => false);
    if (!loaded) throw new Error("project mẫu không load (>= 3 clip) sau 180 s");
    const snap0 = await cdp.evalJs(STORE_FN);
    if (snap0.name === "Dự án mẫu" && snap0.tracks.flatMap((t) => t.clips).length >= 3) {
      pass("A0 load sample", `tên "Dự án mẫu", duration=${snap0.duration}s`);
    } else {
      fail("A0 load sample", `name=${snap0.name} clips=${snap0.tracks.flatMap((t) => t.clips).length}`);
    }
    log(`modal: ${await closeModal(cdp)}`);

    // ---- B0: import tone + thêm vào timeline ----
    const imp = await cdp.evalJs(IMPORT_TONE_FN(TONE_URL));
    if (imp.ok && imp.clipDuration === 8 && imp.clipId) {
      pass("B0 import tone + thêm clip audio", `media ${imp.mediaId}, clip ${imp.clipId} start=${imp.clipStart} dur=${imp.clipDuration}s`);
    } else {
      fail("B0 import tone + thêm clip audio", JSON.stringify(imp));
      throw new Error("không dựng được clip audio — dừng lượt");
    }
    const { trackId, clipId } = imp;

    // ---- B1: patch [null] + volume 0.5, verify store giữ nguyên ----
    const p1 = await cdp.evalJs(PATCH_FN(trackId, clipId, `({ volume: 0.5, volumeKeyframes: { keyframes: [null] } })`));
    const storedNull = Array.isArray(p1.volumeKeyframes?.keyframes) && p1.volumeKeyframes.keyframes.length === 1 && p1.volumeKeyframes.keyframes[0] === null;
    if (storedNull && p1.volume === 0.5) {
      pass("B1 patch volumeKeyframes [null] + volume 0.5", `store giữ [null], volume=${p1.volume}`);
    } else {
      fail("B1 patch volumeKeyframes [null] + volume 0.5", JSON.stringify(p1));
      throw new Error("store không giữ [null] — dừng lượt");
    }

    // ---- B2: neo giá trị kỳ vọng qua module thật (như I2 I3) ----
    const g1 = await cdp.evalJs(GAIN_FN(`({ duration: 8, volume: 0.5, volumeKeyframes: { keyframes: [null] } })`, 2));
    if (g1.gain === 0.5) {
      pass("B2 computeClipGain module [null] → 0.5 (neo kỳ vọng)", `gain=${g1.gain}`);
    } else {
      fail("B2 computeClipGain module [null] → 0.5 (neo kỳ vọng)", JSON.stringify(g1));
    }

    // ---- B3: phát thật với clip [null] — tick không ném, không lỗi mới ----
    const errBase = { win: await cdp.evalJs(`(window.__j5errors || []).length`), cdp: cdp.exceptions.length, console: cdp.consoleErrors.length };
    const tickBase = await cdp.evalJs(`(window.__vcutPreviewIdle || {}).tickErrors ?? null`);
    await clickPlay(cdp);
    await sleep(200);
    const playing = await cdp.evalJs(STORE_FN).then((s) => s.playing);
    if (!playing) {
      fail("B3 phát với clip [null]: tick không ném", "bấm Phát không có tác dụng");
      throw new Error("bấm Phát không có tác dụng — dừng lượt");
    }
    // Đo RMS trong lúc phát [null] @ 0.5 (1,2 s), rồi lấy tickErrors.
    const rmsNull = await cdp.evalJs(RMS_FN);
    await sleep(2000);
    const tickAfter = await cdp.evalJs(`(window.__vcutPreviewIdle || {}).tickErrors ?? null`);
    const errAfter = { win: await cdp.evalJs(`(window.__j5errors || []).length`), cdp: cdp.exceptions.length, console: cdp.consoleErrors.length };
    const tickDelta = (tickAfter ?? 0) - (tickBase ?? 0);
    const errDelta = (errAfter.win - errBase.win) + (errAfter.cdp - errBase.cdp);
    const consoleTickErr = cdp.consoleErrors.slice(errBase.console).filter((m) => /tick lỗi|keyframes rỗng/i.test(m));
    if (tickDelta === 0 && errDelta === 0 && consoleTickErr.length === 0) {
      pass("B3 phát với clip [null]: tick không ném, 0 lỗi mới",
        `tickErrors +${tickDelta} (base ${tickBase} → ${tickAfter}), window/cdp lỗi mới +${errDelta}, console.error tick 0`);
    } else {
      fail("B3 phát với clip [null]: tick không ném, 0 lỗi mới",
        `tickErrors +${tickDelta}, window/cdp lỗi mới +${errDelta}, console.error tick=${JSON.stringify(consoleTickErr)}, winErrs=${JSON.stringify(await cdp.evalJs(`(window.__j5errors || []).slice()`))}`);
    }
    log(`RMS [null] @0.5: ${JSON.stringify(rmsNull)}`);

    // ---- B4: đối chứng gain — gỡ keyframes (volume 0.5 tĩnh), đo RMS ----
    // Vẫn đang phát: patch volumeKeyframes về undefined. patchClip với
    // key volumeKeyframes: undefined có thể bị coi là "không đổi" nếu
    // clip đã có field — dùng patch { volumeKeyframes: undefined } và
    // đọc lại store để xác nhận.
    const p2 = await cdp.evalJs(PATCH_FN(trackId, clipId, `({ volumeKeyframes: undefined })`));
    await sleep(800);
    const rmsStatic = await cdp.evalJs(RMS_FN);
    log(`RMS tĩnh @0.5 (sau khi gỡ [null]): ${JSON.stringify(rmsStatic)} patch=${JSON.stringify(p2)}`);
    const ratioNullStatic = rmsNull.ok && rmsStatic.ok && rmsStatic.mean > 0
      ? +(rmsNull.mean / rmsStatic.mean).toFixed(3) : null;
    if (rmsNull.ok && rmsStatic.ok && rmsNull.mean > 0.005 && rmsStatic.mean > 0.005
      && ratioNullStatic !== null && ratioNullStatic >= 0.8 && ratioNullStatic <= 1.25) {
      pass("B4 gain [null] ≈ gain tĩnh 0.5 qua tick thật",
        `RMS [null]=${rmsNull.mean} vs tĩnh=${rmsStatic.mean}, tỉ lệ=${ratioNullStatic} (kỳ vọng ~1,0)`);
    } else {
      fail("B4 gain [null] ≈ gain tĩnh 0.5 qua tick thật",
        `RMS [null]=${JSON.stringify(rmsNull)} vs tĩnh=${JSON.stringify(rmsStatic)}, tỉ lệ=${ratioNullStatic}`);
    }

    // ---- B5: sanity phép đo — volume 0.5 → 1.0 trong lúc phát, RMS phải tăng ~2× ----
    const p3 = await cdp.evalJs(PATCH_FN(trackId, clipId, `({ volume: 1 })`));
    await sleep(800);
    const rmsFull = await cdp.evalJs(RMS_FN);
    log(`RMS @1.0: ${JSON.stringify(rmsFull)} patch=${JSON.stringify(p3)}`);
    const ratioFull = rmsFull.ok && rmsStatic.ok && rmsStatic.mean > 0
      ? +(rmsFull.mean / rmsStatic.mean).toFixed(3) : null;
    if (rmsFull.ok && rmsFull.mean > 0.005 && ratioFull !== null && ratioFull >= 1.6 && ratioFull <= 2.5) {
      pass("B5 sanity: volume 1.0 cho RMS ~2× volume 0.5 (phép đo nhạy với gain)",
        `RMS 1.0=${rmsFull.mean} vs 0.5=${rmsStatic.mean}, tỉ lệ=${ratioFull} (kỳ vọng ~2,0)`);
    } else {
      fail("B5 sanity: volume 1.0 cho RMS ~2× volume 0.5 (phép đo nhạy với gain)",
        `RMS 1.0=${JSON.stringify(rmsFull)} vs 0.5=${JSON.stringify(rmsStatic)}, tỉ lệ=${ratioFull}`);
    }

    // Dừng phát + tổng kết lỗi phiên.
    await clickPlay(cdp).catch(() => {});
    await sleep(400);
    const finalErrs = await cdp.evalJs(`(window.__j5errors || []).slice()`);
    if (finalErrs.length === 0 && cdp.exceptions.length === 0) {
      pass("B6 0 lỗi console trong phiên", `window errors 0, CDP exceptions 0, console.error ${cdp.consoleErrors.length}`);
    } else {
      fail("B6 0 lỗi console trong phiên", `window=${JSON.stringify(finalErrs)} cdp=${JSON.stringify(cdp.exceptions.slice(-2))} consoleErrors=${cdp.consoleErrors.length}`);
    }
  } catch (e) {
    harnessError = e;
    log(`HARNESS LỖI: ${e instanceof Error ? e.message : e}`);
  } finally {
    killAll();
  }
  const out = { results, harnessError: harnessError ? String(harnessError.message || harnessError) : null };
  fs.writeFileSync(path.join(SCRATCH, "ticknull-result.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(SCRATCH, "ticknull-log.txt"), logLines.join("\n") + "\n");
  const fails = results.filter((r) => !r.ok).length;
  log(`đã ghi ${path.join(SCRATCH, "ticknull-result.json")} — ${results.length - fails}/${results.length} PASS`);
  process.exit(harnessError ? 2 : fails > 0 ? 1 : 0);
}

void main();
