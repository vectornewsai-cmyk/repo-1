#!/usr/bin/env node
/**
 * probe-55l6-audio-drift.mjs — Phase 9 đợt 55, luồng L6:
 * điều tra nguyên nhân GỐC của audio drift khi phát xuôi (nợ K9 đợt 54:
 * audio re-seek còn sàn 9–11/lượt do drift gốc).
 *
 * Khác K9: lấy mẫu TRONG TRANG mỗi 50 ms (setInterval) thay vì CDP
 * poll 250 ms — bắt spike thoáng qua giữa các tick mà K9 chỉ suy ra
 * gián tiếp. Mỗi mẫu ghi: playhead, audio currentTime/seeking/paused/
 * readyState/playbackRate, video currentTime, currentTime của một
 * AudioContext thăm dò độc lập (đồng hồ audio riêng — xem nó có chạy
 * 1:1 với wall-clock không), bộ đếm re-seek. Kèm log event seeking/
 * seeked/waiting/playing/stalled trên element AUDIO (đo đúng độ dài
 * mỗi lần seek) + chuỗi timestamp rAF (tách stall do main thread vs
 * do audio thread).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/probe-55l6-audio-drift.mjs
 * Env: L6_DEV_PORT (mặc định tự chọn 5481–5499), L6_DEBUG_PORT
 * (9671–9689), L6_TONE_PORT (5581–5599), L6_DISPLAY (mặc định :156 —
 * RIÊNG, nếu đã có X156 thì lỗi thay vì dùng chung), L6_SCRATCH
 * (mặc định hidden_files/round55-l6), L6_TMPDIR (mặc định
 * /tmp/vcut55l6 — TMPDIR riêng cho vite/chrome/xvfb + profile),
 * L6_TONE (mặc định ~/workspace/tmp-round53-j5/fixtures/tone440.wav),
 * L6_WINDOW_S (mặc định 15), L6_SAMPLE_MS (mặc định 250 — mẫu ngoài
 * CDP, giữ như K9 để so sánh), L6_INNER_MS (mặc định 50 — mẫu trong
 * trang), L6_BURNERS (mặc định 2), L6_TAG (mặc định "base1").
 * Exit 0 khi đo xong (kể cả re-seek cao — probe đo, không phải cổng
 * pass/fail); exit 2 khi harness lỗi. KHÔNG sửa file sản phẩm ngoài
 * hook đo __vcutMediaEls, KHÔNG push/tag/binary.
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
const SCRATCH = process.env.L6_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round55-l6");
const TMPDIR = process.env.L6_TMPDIR || "/tmp/vcut55l6";
const TONE_PATH = process.env.L6_TONE || path.join(os.homedir(), "workspace", "tmp-round53-j5", "fixtures", "tone440.wav");
const WINDOW_S = Number(process.env.L6_WINDOW_S || 15);
const BURNERS = Number(process.env.L6_BURNERS || 2);
const SAMPLE_MS = Number(process.env.L6_SAMPLE_MS || 250);
const INNER_MS = Number(process.env.L6_INNER_MS || 50);
const TAG = process.env.L6_TAG || "base1";
const DISPLAY = process.env.L6_DISPLAY || ":156";
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadavg() { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "?"; } }

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

// Sampler trong trang, 50 ms: đọc element thật qua hook __vcutMediaEls
// (đợt 55 L6), playhead qua store, đồng hồ AudioContext thăm dò độc
// lập, bộ đếm re-seek. Event seeking/seeked/waiting/... trên AUDIO để
// đo đúng độ dài seek. Chuỗi rAF riêng để tách stall main thread.
const INSTALL_SAMPLER_FN = (innerMs) => `(async () => {
  if (window.__l6) return "already-installed";
  const L = window.__l6 = {
    samples: [], events: [], raf: [], audioFound: false,
    probeCtxState: null, probeCtxError: null, rafStop: false,
  };
  // Chuỗi timestamp rAF (main thread).
  const rafTick = (t) => {
    if (!L.rafStop) { L.raf.push(+t.toFixed(1)); requestAnimationFrame(rafTick); }
  };
  requestAnimationFrame(rafTick);
  // AudioContext thăm dò độc lập (đồng hồ audio riêng, không nối element).
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctor();
    L.probeCtx = ctx;
    L.probeCtxState = ctx.state;
    try { await ctx.resume(); L.probeCtxState = ctx.state; } catch (e) { L.probeCtxError = "resume: " + String(e); }
  } catch (e) { L.probeCtxError = String(e); }
  let audioEl = null;
  const attach = (el) => {
    if (audioEl) return;
    audioEl = el;
    L.audioFound = true;
    for (const ev of ["seeking", "seeked", "waiting", "playing", "stalled", "emptied", "canplay", "canplaythrough", "ratechange", "pause", "play", "suspend", "abort", "error"]) {
      el.addEventListener(ev, () => {
        L.events.push({ ev, t: +performance.now().toFixed(1), ct: +el.currentTime.toFixed(3), seeking: !!el.seeking, rs: el.readyState, rate: +el.playbackRate.toFixed(3) });
      });
    }
  };
  // Store module (cache như K9).
  let storeMod = null;
  try {
    const entries = performance.getEntriesByType("resource").map((e) => e.name);
    const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
    storeMod = await import(hit);
  } catch (e) { L.storeError = String(e); }
  L.timer = setInterval(() => {
    const els = window.__vcutMediaEls || [];
    const a = els.find((x) => x.tag === "AUDIO");
    const v = els.find((x) => x.tag === "VIDEO");
    if (a && !audioEl) attach(a.el);
    const st = storeMod ? storeMod.useStore.getState() : null;
    L.samples.push({
      t: +performance.now().toFixed(1),
      ph: st ? +st.playhead.toFixed(3) : null,
      playing: st ? !!st.playing : null,
      aCt: a ? +a.el.currentTime.toFixed(3) : null,
      aSeeking: a ? !!a.el.seeking : null,
      aPaused: a ? !!a.el.paused : null,
      aRs: a ? a.el.readyState : null,
      aRate: a ? +a.el.playbackRate.toFixed(3) : null,
      vCt: v ? +v.el.currentTime.toFixed(3) : null,
      vSeeking: v ? !!v.el.seeking : null,
      ctxT: L.probeCtx ? +L.probeCtx.currentTime.toFixed(3) : null,
      ctxState: L.probeCtx ? L.probeCtx.state : null,
      rA: typeof window.__vcutSyncReseeksAudio === "number" ? window.__vcutSyncReseeksAudio : null,
      rV: typeof window.__vcutSyncReseeksVideo === "number" ? window.__vcutSyncReseeksVideo : null,
    });
  }, ${innerMs});
  return "installed";
})()`;

const STOP_SAMPLER_FN = `(() => {
  const L = window.__l6;
  if (!L) return null;
  try { clearInterval(L.timer); } catch {}
  L.rafStop = true;
  return {
    samples: L.samples, events: L.events, raf: L.raf,
    audioFound: L.audioFound, probeCtxState: L.probeCtxState,
    probeCtxError: L.probeCtxError, storeError: L.storeError || null,
  };
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

// Thống kê gap rAF của vòng preview (hook __vcutPreviewRaf).
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

// Bấm nút Phát bằng click chuột THẬT qua CDP (tạo user gesture).
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

/** Phân tích mẫu 50 ms trong trang: stall / tốc độ audio / seek / ctx clock. */
function analyzeInner(inner) {
  if (!inner || !inner.samples) return { n: 0, note: "không có sampler" };
  const ss = inner.samples.filter((s) => s.playing && s.aCt !== null && s.ph !== null);
  if (ss.length < 10) return { n: ss.length, note: "quá ít mẫu đang phát", audioFound: inner.audioFound };
  const dts = [];
  for (let i = 1; i < ss.length; i++) dts.push(ss[i].t - ss[i - 1].t);
  dts.sort((a, b) => a - b);
  const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
  // Bước tiến audio theo từng mẫu — phân loại theo TỐC ĐỘ (dCt/dt),
  // không theo dCt tuyệt đối: dt mẫu thực tế 90–650 ms (main thread
  // bận), nên dCt của bước 1× là ~dt, không phải ~50 ms.
  const steps = [];
  for (let i = 1; i < ss.length; i++) {
    const dt = (ss[i].t - ss[i - 1].t) / 1000;
    const dCt = ss[i].aCt - ss[i - 1].aCt;
    const dPh = ss[i].ph - ss[i - 1].ph;
    steps.push({ dt, dCt, dPh, rate: dt > 0 ? dCt / dt : 0, phRate: dt > 0 ? dPh / dt : 0, seeking: ss[i].aSeeking, t: ss[i].t, ph: ss[i].ph, lag: +(ss[i].ph - ss[i].aCt).toFixed(3) });
  }
  const adv = steps.filter((s) => !s.seeking && s.rate < 1.5);
  const frozen = adv.filter((s) => s.rate < 0.1);
  const slow = adv.filter((s) => s.rate >= 0.1 && s.rate < 0.7);
  const normal = adv.filter((s) => s.rate >= 0.7 && s.rate <= 1.15);
  const jump = steps.filter((s) => s.rate > 1.5); // nhảy do seek (kể cả mẫu seeking)
  const seekingSteps = steps.filter((s) => s.seeking);
  // Tốc độ audio trung bình ngoài seek (ΣdCt / Σdt, loại bước nhảy seek).
  const advRate = adv.length ? +(adv.reduce((a, s) => a + s.dCt, 0) / adv.reduce((a, s) => a + s.dt, 0)).toFixed(3) : null;
  // Cơn đóng băng: chuỗi bước rate < 0,1 liên tiếp kéo dài >= 150 ms wall.
  const stalls = [];
  let run = [];
  const flush = () => {
    if (run.length > 0) {
      const durMs = Math.round(run.reduce((a, s) => a + s.dt, 0) * 1000);
      if (durMs >= 150) {
        const lag0 = run[0].lag;
        const lag1 = run[run.length - 1].lag;
        stalls.push({
          tStartMs: Math.round(run[0].t),
          durMs,
          samples: run.length,
          lagBefore: lag0,
          lagAfter: lag1,
          lagGrowth: +(lag1 - lag0).toFixed(3),
        });
      }
    }
    run = [];
  };
  for (const s of adv) {
    if (s.rate < 0.1) run.push(s); else flush();
  }
  flush();
  // Lag theo mẫu (ngoài seeking).
  const lags = steps.filter((s) => !s.seeking).map((s) => s.lag).sort((a, b) => a - b);
  // Độ dài seek từ event seeking→seeked.
  const seeks = [];
  let pendingSeek = null;
  for (const e of inner.events || []) {
    if (e.ev === "seeking") pendingSeek = e;
    else if (e.ev === "seeked" && pendingSeek) {
      seeks.push({ tMs: Math.round(e.t), durMs: Math.round(e.t - pendingSeek.t), ctTarget: pendingSeek.ct, ctTo: e.ct });
      pendingSeek = null;
    }
  }
  const seekDurs = seeks.map((s) => s.durMs).sort((a, b) => a - b);
  // Lag lúc seek vừa đáp (mẫu đầu tiên sau mỗi lần rA tăng).
  const lagAfterLanding = [];
  for (let i = 1; i < ss.length; i++) {
    if (ss[i].rA !== null && ss[i - 1].rA !== null && ss[i].rA > ss[i - 1].rA) {
      lagAfterLanding.push(+(ss[i].ph - ss[i].aCt).toFixed(3));
    }
  }
  // Tốc độ tăng lag giữa các seek: lag là răng cưa (tăng rồi reset khi
  // seek), nên hồi quy toàn cửa sổ ra ~0 — phải tính theo từng đoạn
  // giữa 2 lần seek (nhóm mẫu theo rA), rồi lấy trung bình có trọng số
  // theo độ dài đoạn. Mỗi đoạn: (lag cuối − lag đầu) / wall của đoạn.
  let lagGrowthRate = null;
  {
    const segs = [];
    let cur = null;
    for (const s of steps) {
      if (s.seeking || s.rate >= 1.5) { if (cur && cur.pts.length >= 2) segs.push(cur); cur = null; continue; }
      if (!cur) cur = { pts: [] };
      cur.pts.push(s);
    }
    if (cur && cur.pts.length >= 2) segs.push(cur);
    let num = 0, den = 0;
    for (const g of segs) {
      const a = g.pts[0], b = g.pts[g.pts.length - 1];
      const dtS = (b.t - a.t) / 1000;
      if (dtS > 0.15) { num += (b.lag - a.lag); den += dtS; }
    }
    lagGrowthRate = den > 0 ? +(num / den).toFixed(3) : null;
  }
  // Đồng hồ AudioContext thăm dò vs wall: hồi quy ctxT ~ t (t đổi ra giây).
  let ctxFit = null;
  const ctxPts = ss.filter((s) => s.ctxT !== null && s.ctxState === "running");
  if (ctxPts.length >= 10) {
    const n = ctxPts.length;
    const mt = ctxPts.reduce((a, s) => a + s.t / 1000, 0) / n;
    const mc = ctxPts.reduce((a, s) => a + s.ctxT, 0) / n;
    let num = 0, den = 0;
    for (const s of ctxPts) { const ts = s.t / 1000; num += (ts - mt) * (s.ctxT - mc); den += (ts - mt) * (ts - mt); }
    const slope = den > 0 ? num / den : null; // ctx giây / wall giây
    ctxFit = { n, slope: slope !== null ? +slope.toFixed(3) : null, state: ctxPts[0].ctxState };
  }
  // Gap rAF trong trang (main thread).
  const rafGaps = [];
  for (let i = 1; i < (inner.raf || []).length; i++) rafGaps.push(inner.raf[i] - inner.raf[i - 1]);
  rafGaps.sort((a, b) => a - b);
  // Đếm event theo loại.
  const evCount = {};
  for (const e of inner.events || []) evCount[e.ev] = (evCount[e.ev] || 0) + 1;
  // Tốc độ playhead (ΣdPh / Σdt) + bước nhảy playhead lớn nhất (catch-up burst).
  const phRate = steps.length ? +(steps.reduce((a, s) => a + s.dPh, 0) / steps.reduce((a, s) => a + s.dt, 0)).toFixed(3) : null;
  const maxPhStep = steps.length ? +Math.max(...steps.map((s) => s.dPh)).toFixed(3) : null;
  const bigPhSteps = steps.filter((s) => s.dPh > 0.2).length;
  return {
    n: ss.length,
    sampleDtMs: { p50: +pct(dts, 0.5).toFixed(1), p95: +pct(dts, 0.95).toFixed(1), max: +dts[dts.length - 1].toFixed(1) },
    audioStepClass: {
      frozen: frozen.length, slow: slow.length, normal: normal.length,
      jumpSeek: jump.length, seeking: seekingSteps.length,
      fracFrozen: +(frozen.length / Math.max(1, adv.length)).toFixed(3),
      fracSlow: +(slow.length / Math.max(1, adv.length)).toFixed(3),
      fracNormal: +(normal.length / Math.max(1, adv.length)).toFixed(3),
    },
    audioAdvanceRateExSeeking: advRate,
    playheadRate: phRate,
    maxPhStepS: maxPhStep,
    bigPhStepsOver02: bigPhSteps,
    lag: lags.length ? { mean: +(lags.reduce((a, b) => a + b, 0) / lags.length).toFixed(3), p50: +pct(lags, 0.5).toFixed(3), p95: +pct(lags, 0.95).toFixed(3), max: +lags[lags.length - 1].toFixed(3), min: +lags[0].toFixed(3) } : null,
    lagGrowthRatePerS: lagGrowthRate,
    lagAfterLanding,
    stalls: { count: stalls.length, totalFrozenMs: stalls.reduce((a, s) => a + s.durMs, 0), list: stalls },
    seeksFromEvents: { count: seeks.length, durMs: seekDurs.length ? { p50: pct(seekDurs, 0.5), p95: pct(seekDurs, 0.95), max: seekDurs[seekDurs.length - 1] } : null, list: seeks },
    ctxFit,
    rafGapMs: rafGaps.length ? { p50: +pct(rafGaps, 0.5).toFixed(1), p95: +pct(rafGaps, 0.95).toFixed(1), max: +rafGaps[rafGaps.length - 1].toFixed(1) } : null,
    evCount,
    audioFound: inner.audioFound,
    probeCtxState: inner.probeCtxState,
    probeCtxError: inner.probeCtxError,
    storeError: inner.storeError || null,
  };
}

async function main() {
  const result = { tag: TAG, windowS: WINDOW_S, innerMs: INNER_MS, burners: BURNERS, loadavgStart: loadavg(), cases: {}, samples: [], rafStats: null, errors: [] };
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
    const DEV_PORT = Number(process.env.L6_DEV_PORT || 0) || (await pickFreePort(5481, 5499));
    const DEBUG_PORT = Number(process.env.L6_DEBUG_PORT || 0) || (await pickFreePort(9671, 9689));
    const TONE_PORT = await pickFreePort(5581, 5599);
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5481–5499");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9671–9689");
    if (!TONE_PORT) throw new Error("hết cổng tone trống 5581–5599");
    if (fs.existsSync(`/tmp/.X11-unix/X${DISPLAY.replace(":", "")}`)) throw new Error(`display ${DISPLAY} đã có X server (không dùng chung)`);
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(TONE_PATH)) throw new Error(`không thấy tone ${TONE_PATH}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const TONE_URL = `http://127.0.0.1:${TONE_PORT}/tone440.wav`;
    const PROFILE = path.join(TMPDIR, `cdprof-drift-${TAG}`);
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, tone :${TONE_PORT}, DISPLAY=${DISPLAY}, tag=${TAG}, TMPDIR=${TMPDIR}, loadavg=${result.loadavgStart}`);

    const toneBytes = fs.readFileSync(TONE_PATH);
    toneServer = http.createServer((req, res) => {
      if (req.url === "/tone440.wav") {
        res.writeHead(200, { "Content-Type": "audio/wav", "Content-Length": toneBytes.length, "Access-Control-Allow-Origin": "*" });
        res.end(toneBytes);
      } else { res.writeHead(404); res.end(); }
    });
    await new Promise((res, rej) => { toneServer.once("error", rej); toneServer.listen(TONE_PORT, "127.0.0.1", res); });

    const viteLogFd = fs.openSync(path.join(SCRATCH, `drift-${TAG}-vite.log`), "w");
    const childEnv = { ...process.env, TMPDIR };
    vite = spawn(VITE_BIN, ["--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd], env: childEnv });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore", env: childEnv });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, `drift-${TAG}-chrome.log`), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
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

    const samplerRes = await cdp.evalJs(INSTALL_SAMPLER_FN(INNER_MS));
    log(`sampler trong trang (${INNER_MS} ms): ${samplerRes}`);

    const base = await cdp.evalJs(SAMPLE_FN);
    result.base = base;
    log(`baseline: playhead=${base.playhead} ticks=${base.ticks} reseeks=${base.reseeks} (video ${base.reseeksVideo} / audio ${base.reseeksAudio}) tickErrors=${base.tickErrors}`);
    const burners = [];
    for (let i = 0; i < BURNERS; i++) {
      try { burners.push(spawn("yes", [], { stdio: "ignore" })); } catch {}
    }
    if (burners.length > 0) log(`đốt CPU: ${burners.length} tiến trình yes trong cửa sổ đo`);
    await clickPlay(cdp);
    // L6: dưới tải nặng, 1 click có thể chưa kịp đăng ký (React/store
    // chưa xử lý xong trong 300 ms) — thử lại tối đa 3 lần, mỗi lần
    // chờ 1 s rồi mới kiểm tra playing (K9 chỉ bấm 1 lần).
    let playingOk = false;
    for (let attempt = 1; attempt <= 3 && !playingOk; attempt++) {
      await sleep(1000);
      const chk = await cdp.evalJs(STORE_FN);
      playingOk = chk.playing === true;
      log(`kiểm tra Phát lần ${attempt}: playing=${chk.playing}`);
      if (!playingOk && attempt < 3) await clickPlay(cdp);
    }
    const playingCheck = { playing: playingOk };
    result.cases.playPressed = { ok: playingOk, playing: playingOk };
    log(`sau bấm Phát: playing=${playingCheck.playing} (cần true)`);
    if (!playingCheck.playing) {
      for (const b of burners) { try { b.kill("SIGKILL"); } catch {} }
      throw new Error("bấm Phát không có tác dụng sau 3 lần thử");
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
    if (endSnap.playing) await cdp.evalJs(`document.querySelector('.tbtn.play')?.click()`).catch(() => {});
    await sleep(400);
    // Dừng sampler trong trang + lấy mẫu thô 50 ms.
    const inner = await cdp.evalJs(STOP_SAMPLER_FN);
    result.inner = inner;
    result.innerAnalysis = analyzeInner(inner);
    const errList = await cdp.evalJs(`(window.__j5errors || []).slice()`);
    result.errors = errList;
    result.cdpExceptions = cdp.exceptions.slice();
    result.loadavgEnd = loadavg();

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
    const seekingSamples = playingSamples.filter((s) => (s.mediaState || []).some((m) => m.tag === "AUDIO" && m.seeking)).length;
    result.audioSeekingSamples = seekingSamples;
    log(`KẾT QUẢ [${TAG}]: ratio=${ratio}, reseekDelta=${reseekDelta} (video ${reseekVideoDelta} / audio ${reseekAudioDelta}), tickErrorDelta=${tickErrorDelta}, raf=${JSON.stringify(rafStats)}, errors=${errList.length}, cdpExc=${cdp.exceptions.length}, loadavg ${result.loadavgStart} -> ${result.loadavgEnd}`);
    log(`LAG AUDIO [${TAG}]: ${JSON.stringify(lagStats)}, mẫu seeking=${seekingSamples}/${playingSamples.length}`);
    log(`INNER 50ms [${TAG}]: ${JSON.stringify(result.innerAnalysis)}`);
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
