#!/usr/bin/env node
/**
 * clicktest-86n2-webkit-w7.mjs — Phase 9 đợt 86, luồng N2: truy cơ chế W7
 * (+1 restart DƯ sau tương tác test) ở mức tick + kiểm lại W1.
 *
 * Bối cảnh (đợt 84 L10, docs/PHASE9_ROUND84_L10_WEBKIT_LOOP_W1_LIMITS.md §5):
 * - W7: đúng +1 restart dư sau mỗi tương tác test (gỡ ghi đè `ended` /
 *   reset playhead về 0), cả 2 engine; đã cô lập (không tự phát trong 20 s
 *   phát thường; tác động lành — seek về đúng target); cơ chế tick CHƯA rõ.
 * - Đợt này đã thêm dấu vết mức tick trong preview.tsx
 *   (`__vcutRestartEndedTrace`, xem lib/webkitRestartTrace85M4.ts): mỗi
 *   lần restart bắn đều kèm snapshot (ended/seeking/ct/dur/paused/
 *   readyState/target/playhead) + tick trước + streak ended + số tick từ
 *   lúc seek hạ cánh + causeTag (ended-at-duration vs ended-mid-clip).
 *
 * Cách chạy (từ gốc repo):
 *   xvfb-run -a node apps/web/scripts/clicktest-86n2-webkit-w7.mjs
 * Env: N2_DEV_PORT (5490–5499), N2_CLIP30 (mặc định
 *   /tmp/n2/clips/h_h264_320x180_30s.mp4), N2_CLIP_DUR (mặc định 30 —
 *   phải khớp duration file clip; đợt 86 N2 dùng 60 cho run2/run3 để
 *   clip đủ dài dưới tải cao, xem LIMITS §2), N2_ENGINE (webkit|chromium|both),
 *   N2_SCRATCH (mặc định hidden_files/round86-n2/headed).
 * Exit 0: không FAIL; 1: có FAIL (W7 còn tái hiện sau fix / W1 hỏng);
 *   2: lỗi harness.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 *
 * Các phase (mỗi engine, clip H.264 30 s thật trong app thật):
 * - P1 (tái hiện W7 — gỡ ghi đè): ép ended 1 lần → chờ restart +1 → gỡ
 *   ghi đè NGAY → quan sát 20 s không đụng gì. Ghi mọi restart bắn sau
 *   lúc gỡ (counter + trace event) — đó là +1 dư W7 nếu có.
 * - P2 (tái hiện W7 — reset playhead): setPlayhead(0) → quan sát 15 s.
 *   Ghi mọi restart trong cửa sổ + trace event.
 * - P3 (đối chứng — phát thường 20 s, không tương tác): expect 0 restart
 *   dư; restart tự nhiên (nếu có) phải là ended-at-duration (cơ chế W2).
 * - P4 (W1 còn nguyên không): ép ended 3 lần liên tiếp, mỗi lần restart
 *   phải +1 và ct hạ cánh về target — kiểm wiring sau fix (nếu có).
 * WebKitGTK cần gắn element vào DOM (can thiệp test-only vì W5).
 * WebKitGTK ≠ Safari thật (ghi rõ trong LIMITS).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.N2_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round86-n2", "headed");
const CLIP30_PATH = process.env.N2_CLIP30 || "/tmp/n2/clips/h_h264_320x180_30s.mp4";
const CLIP30_DUR = Number(process.env.N2_CLIP_DUR || 30);
const ENGINE = process.env.N2_ENGINE || "both";
const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

fs.mkdirSync(SCRATCH, { recursive: true });
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

const INJECT_ERRORS = `(() => {
  window.__n2errors = [];
  window.addEventListener("error", (e) => { try { window.__n2errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__n2errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__n2errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__n2errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__n2storeMod || (window.__n2storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Setup project với đúng 1 clip (duration tham số hóa qua __DUR__).
const SETUP_FN = `(async (clipUrl, clipName) => {
  const st = await (${STORE_FN});
  const ver = st.spec.version;
  st.newProject();
  const st2 = await (${STORE_FN});
  st2.replaceProject({
    version: ver,
    meta: { name: "N2 W7", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", label: "Video 1", clips: [
      { kind: "video", id: "c-m4", src: clipName, start: 0, duration: __DUR__, in: 0, out: __DUR__ },
    ] }],
  });
  const buf = await (await fetch(clipUrl)).arrayBuffer();
  const file = new File([buf], clipName, { type: "video/mp4" });
  const st3 = await (${STORE_FN});
  await st3.importFiles([file]);
  const st4 = await (${STORE_FN});
  const item = st4.media.find((m) => m.name === clipName);
  window.__n2clipDur = __DUR__;
  return { mediaName: item ? item.name : null, mediaKind: item ? item.kind : null,
    clips: st4.spec.tracks.flatMap((t) => t.clips.map((c) => ({ trackId: t.id, clipId: c.id, src: c.src, start: c.start, duration: c.duration }))) };
})(__CLIP_URL__, __CLIP_NAME__)`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const els = (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag,
    currentTime: +e.el.currentTime.toFixed(3), paused: e.el.paused,
    ended: e.el.ended, seeking: e.el.seeking, readyState: e.el.readyState,
    duration: Number.isFinite(e.el.duration) ? +e.el.duration.toFixed(3) : null }));
  const cur = window.__n2clipDur;
  if (typeof cur === "number") {
    els.sort((a, b) => ((b.tag === "VIDEO" && b.duration === cur) ? 1 : 0) - ((a.tag === "VIDEO" && a.duration === cur) ? 1 : 0));
  }
  return {
    playhead: +st.playhead.toFixed(3), playing: st.playing,
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => c.id)),
    reseeksVideo: window.__vcutSyncReseeksVideo ?? null,
    restartEndedVideo: window.__vcutSyncRestartEndedVideo ?? null,
    restartEndedAudio: window.__vcutSyncRestartEndedAudio ?? null,
    traceEvents: (window.__vcutRestartEndedTrace && window.__vcutRestartEndedTrace.events) || null,
    traceRingLen: (window.__vcutRestartEndedTrace && window.__vcutRestartEndedTrace.ring && window.__vcutRestartEndedTrace.ring.length) || null,
    mediaEls: els,
    errors: (window.__n2errors || []).slice(),
  };
})()`;

const PICK_VIDEO_FN = `((window.__vcutMediaEls || []).find((e) => e.tag === "VIDEO" && e.el.duration === window.__n2clipDur) || (window.__vcutMediaEls || []).find((e) => e.tag === "VIDEO"))`;

const ATTACH_FN = `(() => {
  const v = ${PICK_VIDEO_FN};
  if (!v) return { ok: false, why: "no VIDEO el" };
  v.el.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;pointer-events:none;z-index:1";
  document.body.appendChild(v.el);
  return { ok: true, isConnected: v.el.isConnected };
})()`;

const FORCE_ENDED_FN = `(() => {
  const v = ${PICK_VIDEO_FN};
  if (!v) return { ok: false, why: "no VIDEO el" };
  Object.defineProperty(v.el, "ended", { configurable: true, get: () => true });
  return { ok: true };
})()`;
const UNFORCE_ENDED_FN = `(() => {
  const v = ${PICK_VIDEO_FN};
  if (!v) return { ok: false, why: "no VIDEO el" };
  try { delete v.el.ended; } catch {}
  return { ok: true, endedNow: v.el.ended };
})()`;

async function waitFor(fn, desc, timeoutMs = 120000) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeoutMs) {
    try { const v = await fn(); if (v) return v; last = v; } catch (e) { last = String(e && e.message || e).slice(0, 200); }
    await sleep(500);
  }
  throw new Error(`timeout chờ ${desc} (${timeoutMs}ms) — last=${JSON.stringify(last)}`);
}

async function setupProject(page, clipUrl, clipName, dur) {
  const setup = await page.evaluate(SETUP_FN.replaceAll("__CLIP_URL__", JSON.stringify(clipUrl)).replaceAll("__CLIP_NAME__", JSON.stringify(clipName)).replaceAll("__DUR__", String(dur)));
  if (!setup.mediaName || setup.clips.length !== 1) throw new Error("setup project sai: " + JSON.stringify(setup));
  return setup;
}

async function startPlaying(page, engineName, clipDur) {
  let lastState = null;
  await page.evaluate(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(0); })()`);
  await page.keyboard.press("Space");
  await sleep(300);
  let stPlay = await page.evaluate(STATE_FN);
  if (!stPlay.playing) {
    await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.togglePlay(); })()`);
    await sleep(300);
    stPlay = await page.evaluate(STATE_FN);
  }
  if (!stPlay.playing) throw new Error("không phát được (playing vẫn false sau Space + togglePlay)");
  try {
    await waitFor(async () => {
      const s = await page.evaluate(STATE_FN);
      const v = s.mediaEls.find((e) => e.tag === "VIDEO");
      lastState = s;
      return v && v.readyState >= 2 && v.duration === clipDur ? v : null;
    }, `video element sẵn sàng (readyState>=2, duration=${clipDur})`, 120000);
  } catch (e) {
    throw new Error(`${e.message} — lastState=${JSON.stringify(lastState)}`);
  }
  if (engineName === "webkit") {
    const attached = await page.evaluate(ATTACH_FN);
    if (!attached.ok || !attached.isConnected) throw new Error("gắn element vào DOM thất bại: " + JSON.stringify(attached));
  }
}

async function waitForPlaySync(page, engineName, clipDur, tag, resets = 0) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < 60000) {
    const s = await page.evaluate(STATE_FN);
    const v = s.mediaEls.find((e) => e.tag === "VIDEO");
    last = s;
    if (v && !v.paused && !v.seeking && v.currentTime >= 1.0 && Math.abs(v.currentTime - s.playhead) <= 1.0) {
      log(`[${engineName}] ${tag}: element đồng bộ sau ${((Date.now() - t0) / 1000).toFixed(1)} s (playhead=${s.playhead}, ct=${v.currentTime})`);
      return { synced: true, state: s };
    }
    // Đợt 86 N2: clip hết giữa chừng trong lúc chờ (tải cao → playhead
    // chạy hết 30 s trước khi element đồng bộ) — tua về 0 và chờ lại,
    // tối đa 2 lần, thay vì FAIL oan (WebKit run 1: playhead=30, ct=28).
    if (v && s.playhead >= clipDur - 0.1 && !s.playing && resets < 2) {
      log(`[${engineName}] ${tag}: clip hết giữa chừng lúc chờ đồng bộ (playhead=${s.playhead}) — reset về 0, chờ lại (lần ${resets + 1})`);
      await resetPlayhead0(page);
      return waitForPlaySync(page, engineName, clipDur, tag, resets + 1);
    }
    await sleep(500);
  }
  const v = last && last.mediaEls.find((e) => e.tag === "VIDEO");
  if (v && !v.paused && !v.seeking && v.currentTime >= 0.5) {
    log(`[${engineName}] ${tag}: CẢNH BÁO — không đồng bộ sau 60 s, ép tiếp với drift (playhead=${last.playhead}, ct=${v.currentTime})`);
    return { synced: false, state: last };
  }
  throw new Error(`[${tag}] element không phát thật được sau 60 s chờ đồng bộ: ${JSON.stringify(v)} playhead=${last && last.playhead}`);
}

async function resetPlayhead0(page) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(0); if (!s.playing) s.togglePlay(); })()`);
    await sleep(500);
    const chk0 = await page.evaluate(STATE_FN);
    if (chk0.playhead < 1.0) return chk0;
    await sleep(500);
  }
  return await page.evaluate(STATE_FN);
}

/**
 * Đợt 86 N2 — chờ tới lúc element video KHÔNG seeking (tối đa timeoutMs):
 * guard `!seeking` của restartEndedElement chặn restart suốt cửa sổ ép
 * nếu ép đúng lúc seek đang kẹt (W6) — run 2 P4 WebKit FAIL oan 3/3 vì
 * thế (seeking=true toàn bộ cửa sổ 8 s). Ép ngay khi seeking vừa hết.
 */
async function waitForNotSeeking(page, tag, timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await page.evaluate(STATE_FN);
    const v = s.mediaEls.find((e) => e.tag === "VIDEO");
    if (v && !v.seeking && !v.paused) return { ok: true, state: s };
    await sleep(200);
  }
  const s = await page.evaluate(STATE_FN);
  const v = s.mediaEls.find((e) => e.tag === "VIDEO");
  return { ok: false, state: s, lastSeeking: v ? v.seeking : null, lastPaused: v ? v.paused : null };
}

/** Lấy mẫu 200 ms trong `secs` giây; trả samples + state cuối. */
async function sampleFor(page, secs, tag) {
  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < secs * 1000) {
    const s = await page.evaluate(STATE_FN);
    const v = s.mediaEls.find((e) => e.tag === "VIDEO");
    samples.push({ t: +((Date.now() - t0) / 1000).toFixed(2), playhead: s.playhead, playing: s.playing, ct: v ? v.currentTime : null, paused: v ? v.paused : null, ended: v ? v.ended : null, seeking: v ? v.seeking : null, restartEndedVideo: s.restartEndedVideo, reseeksVideo: s.reseeksVideo, traceEvents: (s.traceEvents || []).length });
    await sleep(200);
  }
  return samples;
}

async function runEngine(engineName, devUrl, clip30Url) {
  const out = { engine: engineName, phases: {}, note: "" };
  const launchOpts = engineName === "webkit"
    ? { headless: false,
        // Đợt 86 N2 — BẮT BUỘC trên boot này (không có là WebProcess crash
        // 100% khi app tạo media): libgstreamer của Playwright WebKitGTK
        // bị relocate, chỉ quét plugin trong
        // minibrowser-gtk/sys/lib/gstreamer-1.0 (KHÔNG TỒN TẠI) nên
        // appsink/autoaudiosink = NULL → g_signal_connect_data trên NULL
        // → WebProcess CRASH. GST_PLUGIN_SYSTEM_PATH chỉ nó quét thêm
        // plugin hệ thống; đã chứng minh: không có → crash 4/4 lần
        // (run 2/2b + diag ×2), có → app load ngon, sống > 20 s (diag ×2).
        // Không sửa production, chỉ env của harness.
        env: { ...process.env, GST_PLUGIN_SYSTEM_PATH: "/usr/lib/x86_64-linux-gnu/gstreamer-1.0" } }
    : { headless: false, executablePath: CHROME, args: ["--no-sandbox"] };
  const browser = await (engineName === "webkit" ? webkit : chromium).launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrs = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => consoleErrs.push("pageerror: " + String(e && e.message || e).slice(0, 300)));
  try {
    await page.goto(devUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await waitFor(async () => {
      const ok = await page.evaluate(() => {
        const tb = document.querySelector(".topbar");
        return tb && (tb.textContent || "").includes("VCut") ? true : null;
      });
      return ok;
    }, "app mount (topbar VCut)", 240000);
    await page.evaluate(INJECT_ERRORS);
    await page.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
    await sleep(800);

    const clip30Name = path.basename(CLIP30_PATH);
    log(`[${engineName}] setup (clip ${CLIP30_DUR} s):`, JSON.stringify(await setupProject(page, clip30Url, clip30Name, CLIP30_DUR)));
    await startPlaying(page, engineName, CLIP30_DUR);

    // --- P1: ép ended 1 lần → gỡ ngay → quan sát 20 s ---
    {
      await resetPlayhead0(page);
      await waitForPlaySync(page, engineName, CLIP30_DUR, "P1");
      const base = await page.evaluate(STATE_FN);
      const r0 = base.restartEndedVideo ?? 0;
      // Đợt 86 N2: chờ !seeking ngay trước khi ép (tránh ép đúng lúc seek
      // đang kẹt — guard chặn restart suốt cửa sổ).
      const preForce = await waitForNotSeeking(page, "P1");
      if (!preForce.ok) log(`[${engineName}] P1 CẢNH BÁO — ép khi seeking chưa hết (seeking=${preForce.lastSeeking}, paused=${preForce.lastPaused})`);
      const forced = await page.evaluate(FORCE_ENDED_FN);
      if (!forced.ok) throw new Error("P1 ép ended thất bại: " + JSON.stringify(forced));
      const tForce = Date.now();
      // Chờ restart do ép bắn (+1), tối đa 8 s. Poll 100 ms + gỡ NGAY khi
      // thấy +1 để cửa sổ ghi đè còn bật ngắn nhất (hạn chế bắn lặp do
      // ghi đè — L10 §5.3: Chromium bắn lặp mỗi tick khi ghi đè còn bật).
      let fired = false;
      let tFired = null;
      for (let i = 0; i < 80; i++) {
        const s = await page.evaluate(STATE_FN);
        if ((s.restartEndedVideo ?? 0) >= r0 + 1) { fired = true; tFired = Date.now(); break; }
        await sleep(100);
      }
      const unforced = await page.evaluate(UNFORCE_ENDED_FN);
      const tUnforce = Date.now();
      const afterUnforce = await page.evaluate(STATE_FN);
      // Đợt 86 N2 — settle 1,5 s sau khi gỡ: hook counter được publish mỗi
      // tick rAF nên dưới tải cao có thể lag sau sự kiện thật (run 1:
      // counter 1→2 lộ ở mẫu t=0,53 s trong khi event đã ghi trước đó);
      // baseline CHỐT sau khi hook kịp cập nhật, rồi mới bắt đầu phase A.
      // Extra tính bằng CHỈ SỐ mảng events (không phụ thuộc clock):
      // mọi event append sau baseline đều là restart bắn trong phase A.
      await sleep(1500);
      const settled = await page.evaluate(STATE_FN);
      const baselineRestart = settled.restartEndedVideo ?? 0;
      const baselineEvents = settled.traceEvents || [];
      log(`[${engineName}] P1: ép ended → restart ${r0}→${afterUnforce.restartEndedVideo} (fired=${fired}), gỡ ghi đè: endedNow=${unforced.endedNow}; sau settle 1,5 s: restart=${baselineRestart}, events=${baselineEvents.length}`);
      const samplesA = await sampleFor(page, 20, "P1-phaseA");
      const endA = await page.evaluate(STATE_FN);
      const endEvents = endA.traceEvents || [];
      const extraEvents = endEvents.slice(baselineEvents.length);
      const extraCount = (endA.restartEndedVideo ?? 0) - baselineRestart;
      const p1 = {
        baseRestart: r0, afterUnforceRestart: afterUnforce.restartEndedVideo,
        baselineRestart, tForce, tFired, tUnforce,
        traceEventsBaseline: baselineEvents, traceEventsEnd: endEvents,
        endRestart: endA.restartEndedVideo, extraCount, extraEvents,
        samples: samplesA, errors: endA.errors,
        verdict: extraCount === 0 ? "PASS (không restart dư)" : `W7-TÁI-HIỆN (+${extraCount})`,
      };
      log(`[${engineName}] P1 ${p1.verdict} — extraEvents=${JSON.stringify(extraEvents.map((e) => ({ wallMs: e.wallMs, dtUnforceMs: e.wallMs - tUnforce, causeTag: e.causeTag, ct: e.ct, dur: e.dur, seeking: e.seeking, paused: e.paused, ticksEndedTrue: e.ticksEndedTrue, ticksSinceSeekLanded: e.ticksSinceSeekLanded, endedFlippedThisTick: e.endedFlippedThisTick, seekJustLanded: e.seekJustLanded, prevCt: e.prev ? e.prev.ct : null, prevSeeking: e.prev ? e.prev.seeking : null, prevEnded: e.prev ? e.prev.ended : null })))}`);
      out.phases.P1 = p1;
      await page.screenshot({ path: path.join(SCRATCH, `n2-${engineName}-p1.png`) }).catch(() => {});
    }

    // --- P2: reset playhead về 0 → quan sát 15 s ---
    {
      const before = await page.evaluate(STATE_FN);
      const r0 = before.restartEndedVideo ?? 0;
      const ev0 = (before.traceEvents || []).length;
      const tReset = Date.now();
      await resetPlayhead0(page);
      const tResetDone = Date.now();
      const samplesB = await sampleFor(page, 15, "P2-phaseB");
      const endB = await page.evaluate(STATE_FN);
      const endEvents = endB.traceEvents || [];
      const extraEvents = endEvents.slice(ev0);
      const extraCount = (endB.restartEndedVideo ?? 0) - r0;
      const p2 = {
        baseRestart: r0, endRestart: endB.restartEndedVideo, extraCount, extraEvents,
        tReset, traceEventsBaseline: (before.traceEvents || []), traceEventsEnd: endEvents,
        samples: samplesB, errors: endB.errors,
        verdict: extraCount === 0 ? "PASS (không restart dư)" : `W7-TÁI-HIỆN (+${extraCount})`,
      };
      log(`[${engineName}] P2 ${p2.verdict} — reset lúc ${new Date(tReset).toISOString()} (xong ${tResetDone - tReset} ms), extraEvents=${JSON.stringify(extraEvents.map((e) => ({ dtResetMs: e.wallMs - tReset, causeTag: e.causeTag, ct: e.ct, dur: e.dur, seeking: e.seeking, paused: e.paused, ticksEndedTrue: e.ticksEndedTrue, ticksSinceSeekLanded: e.ticksSinceSeekLanded, endedFlippedThisTick: e.endedFlippedThisTick, seekJustLanded: e.seekJustLanded, prevCt: e.prev ? e.prev.ct : null, prevSeeking: e.prev ? e.prev.seeking : null, prevEnded: e.prev ? e.prev.ended : null })))}`);
      out.phases.P2 = p2;
      await page.screenshot({ path: path.join(SCRATCH, `n2-${engineName}-p2.png`) }).catch(() => {});
    }

    // --- P3: đối chứng — phát thường 20 s, không tương tác ---
    {
      await resetPlayhead0(page);
      await waitForPlaySync(page, engineName, CLIP30_DUR, "P3").catch(() => null);
      const before = await page.evaluate(STATE_FN);
      const r0 = before.restartEndedVideo ?? 0;
      const ev0 = (before.traceEvents || []).length;
      const t0 = Date.now();
      const samplesC = await sampleFor(page, 20, "P3-control");
      const endC = await page.evaluate(STATE_FN);
      const endEvents = endC.traceEvents || [];
      const extraEvents = endEvents.slice(ev0);
      const extraCount = (endC.restartEndedVideo ?? 0) - r0;
      const natural = extraEvents.filter((e) => e.causeTag === "ended-at-duration");
      const p3 = {
        baseRestart: r0, endRestart: endC.restartEndedVideo, extraCount, extraEvents,
        t0, traceEventsBaseline: (before.traceEvents || []), traceEventsEnd: endEvents,
        samples: samplesC, errors: endC.errors,
        verdict: extraCount === 0 ? "PASS (0 restart — phát thường ổn định)" : (natural.length === extraCount ? "PASS (chỉ restart tự nhiên ended-at-duration — cơ chế W2)" : `CẦN-XEM (+${extraCount}, không phải ended-at-duration)`),
      };
      log(`[${engineName}] P3 ${p3.verdict} — extraEvents=${JSON.stringify(extraEvents.map((e) => ({ dtMs: e.wallMs - t0, causeTag: e.causeTag, ct: e.ct, dur: e.dur, playhead: e.playhead })))}`);
      out.phases.P3 = p3;
      await page.screenshot({ path: path.join(SCRATCH, `n2-${engineName}-p3.png`) }).catch(() => {});
    }

    // --- P4: W1 còn nguyên không — ép ended 3 lần liên tiếp ---
    {
      const rounds = [];
      for (let i = 1; i <= 3; i++) {
        await resetPlayhead0(page);
        await waitForPlaySync(page, engineName, CLIP30_DUR, `P4-lần${i}`).catch(() => null);
        const base = await page.evaluate(STATE_FN);
        const r0 = base.restartEndedVideo ?? 0;
        // Đợt 86 N2: chờ !seeking ngay trước khi ép (run 2: ép đúng lúc
        // seek kẹt → guard chặn, FAIL oan).
        const preForce = await waitForNotSeeking(page, `P4-lần${i}`);
        if (!preForce.ok) log(`[${engineName}] P4-lần${i} CẢNH BÁO — ép khi seeking chưa hết (seeking=${preForce.lastSeeking}, paused=${preForce.lastPaused})`);
        const forced = await page.evaluate(FORCE_ENDED_FN);
        if (!forced.ok) throw new Error(`P4-lần${i} ép ended thất bại`);
        const tForce = Date.now();
        const samples = [];
        let fired = false;
        while (Date.now() - tForce < 8000) {
          const s = await page.evaluate(STATE_FN);
          const v = s.mediaEls.find((e) => e.tag === "VIDEO");
          samples.push({ t: +((Date.now() - tForce) / 1000).toFixed(2), playhead: s.playhead, ct: v ? v.currentTime : null, restartEndedVideo: s.restartEndedVideo, seeking: v ? v.seeking : null });
          if ((s.restartEndedVideo ?? 0) >= r0 + 1 && v && Math.abs(v.currentTime - s.playhead) < 1.5 && v.currentTime > 0.3 && v.currentTime < CLIP30_DUR - 0.1) { fired = true; break; }
          await sleep(100);
        }
        const unforced = await page.evaluate(UNFORCE_ENDED_FN);
        const afterForce = await page.evaluate(STATE_FN);
        await sleep(1200);
        const afterUnforce = await page.evaluate(STATE_FN);
        const v1 = afterUnforce.mediaEls.find((e) => e.tag === "VIDEO");
        const delta = (afterForce.restartEndedVideo ?? 0) - r0;
        let sawTargetSeek = false;
        for (const sm of samples) {
          if (sm.restartEndedVideo >= r0 + 1 && sm.ct !== null && Math.abs(sm.ct - sm.playhead) < 1.5 && sm.ct > 0.3 && sm.ct < CLIP30_DUR - 0.1) { sawTargetSeek = true; break; }
        }
        const ok = delta >= 1 && sawTargetSeek && afterUnforce.errors.length === 0;
        log(`[${engineName}] P4-lần${i} ${ok ? "PASS" : "FAIL"} — delta=+${delta}, hạ-cánh-về-target=${sawTargetSeek}, ct=${v1 ? v1.currentTime : null}, playing=${afterUnforce.playing}, errors=${afterUnforce.errors.length}`);
        rounds.push({ ok, delta, sawTargetSeek, samples, unforced, errors: afterUnforce.errors });
      }
      out.phases.P4 = { rounds, ok: rounds.every((r) => r.ok) };
    }

    // --- P5: tái hiện phase B của L10 (WebKit +1 ở t=9,3 s sau reset) —
    // cửa sổ quan sát DÀI 40 s: run 2 P2 (15 s) không tái hiện vì seek sau
    // reset đóng băng suốt 15 s không hạ cánh; +1 của L10 bắn đúng lúc
    // seek kẹt 8,7 s vừa hạ cánh. Chỉ quan sát (không ép), ghi mọi restart
    // + trace event trong cửa sổ. PASS = 0 restart dư; nếu có restart thì
    // trace event là bằng chứng cơ chế (seekJustLanded/endedFlipped). ---
    {
      const before = await page.evaluate(STATE_FN);
      const r0 = before.restartEndedVideo ?? 0;
      const ev0 = (before.traceEvents || []).length;
      const tReset = Date.now();
      await resetPlayhead0(page);
      const samplesD = await sampleFor(page, 40, "P5-phaseB-long");
      const endD = await page.evaluate(STATE_FN);
      const endEvents = endD.traceEvents || [];
      const extraEvents = endEvents.slice(ev0);
      const extraCount = (endD.restartEndedVideo ?? 0) - r0;
      // Seek dài nhất trong cửa sổ (ct đứng yên + seeking=true liên tiếp).
      let longestFrozen = 0, cur = 0, prevCt = null;
      for (const s of samplesD) {
        if (s.ct === prevCt && s.seeking) { cur++; if (cur > longestFrozen) longestFrozen = cur; }
        else cur = 0;
        prevCt = s.ct;
      }
      const p5 = {
        baseRestart: r0, endRestart: endD.restartEndedVideo, extraCount, extraEvents,
        tReset, longestFrozenSeekSamples: longestFrozen,
        traceEventsBaseline: (before.traceEvents || []), traceEventsEnd: endEvents,
        samples: samplesD, errors: endD.errors,
        verdict: extraCount === 0 ? "PASS (không restart dư trong 40 s sau reset)" : `CÓ-RESTART (+${extraCount}) — xem trace event`,
      };
      log(`[${engineName}] P5 ${p5.verdict} — seek kẹt dài nhất ${longestFrozen} mẫu (~${(longestFrozen * 0.2).toFixed(1)} s), extraEvents=${JSON.stringify(extraEvents.map((e) => ({ dtResetMs: e.wallMs - tReset, causeTag: e.causeTag, ct: e.ct, dur: e.dur, seeking: e.seeking, paused: e.paused, ticksEndedTrue: e.ticksEndedTrue, ticksSinceSeekLanded: e.ticksSinceSeekLanded, endedFlippedThisTick: e.endedFlippedThisTick, seekJustLanded: e.seekJustLanded, prevCt: e.prev ? e.prev.ct : null, prevSeeking: e.prev ? e.prev.seeking : null, prevEnded: e.prev ? e.prev.ended : null })))}`);
      out.phases.P5 = p5;
      await page.screenshot({ path: path.join(SCRATCH, `n2-${engineName}-p5.png`) }).catch(() => {});
    }

    // --- P6 (đợt 86 N2, mới): chờ seek kẹt hạ cánh rồi quan sát 10 s ---
    // L10 +1 bắn đúng lúc seek kẹt 8,7 s vừa hạ cánh; M4 P5 đã thấy 7 lần
    // hạ cánh (0 restart) nhưng run 2 P5 seek kẹt ~33 s KHÔNG hạ cánh
    // trong cửa sổ 40 s (ct đứng 7,367, playhead chạy tới 39) nên điều
    // kiện "hạ cánh sau kẹt dài" chưa được bắt trực tiếp ở run 2. P6 chờ
    // tới lúc !seeking (tối đa 90 s), ghi cú nhảy ct lúc hạ cánh, rồi
    // quan sát thêm 10 s. Chỉ quan sát (không tính vào out.ok).
    {
      const before = await page.evaluate(STATE_FN);
      const r0 = before.restartEndedVideo ?? 0;
      const ev0 = (before.traceEvents || []).length;
      const tWait0 = Date.now();
      let landed = null;
      let wasSeeking = false;
      let frozenCt = null;
      for (let i = 0; i < 450; i++) {
        const s = await page.evaluate(STATE_FN);
        const v = s.mediaEls.find((e) => e.tag === "VIDEO");
        if (v) {
          // Chỉ tính là "hạ cánh" khi trước đó đã từng seeking (kẹt) rồi
          // hết seeking với cú nhảy ct > 0,5 s — tránh nhận nhầm phát
          // thường (ct trôi đều mỗi poll) thành hạ cánh.
          if (v.seeking) { wasSeeking = true; frozenCt = v.currentTime; }
          else if (wasSeeking && frozenCt !== null && Math.abs(v.currentTime - frozenCt) > 0.5) {
            landed = { dtWaitMs: Date.now() - tWait0, fromCt: frozenCt, toCt: v.currentTime, playhead: s.playhead };
            break;
          }
        }
        await sleep(200);
      }
      const samplesE = await sampleFor(page, 10, "P6-after-landing");
      const endE = await page.evaluate(STATE_FN);
      const endEvents = endE.traceEvents || [];
      const extraEvents = endEvents.slice(ev0);
      const extraCount = (endE.restartEndedVideo ?? 0) - r0;
      const p6 = {
        baseRestart: r0, endRestart: endE.restartEndedVideo, extraCount, extraEvents,
        landed, tWait0,
        traceEventsBaseline: (before.traceEvents || []), traceEventsEnd: endEvents,
        samples: samplesE, errors: endE.errors,
        verdict: landed === null ? (wasSeeking ? "KHÔNG-HẠ-CÁNH (seek vẫn kẹt sau 90 s chờ — 0 restart trong lúc kẹt)" : "KHÔNG-KẸT (element phát thường suốt 90 s chờ — 0 restart)") : (extraCount === 0 ? "PASS (hạ cánh xong, 0 restart dư trong 10 s sau)" : `CÓ-RESTART (+${extraCount}) — xem trace event`),
      };
      log(`[${engineName}] P6 ${p6.verdict} — landed=${JSON.stringify(landed)}, extraEvents=${JSON.stringify(extraEvents.map((e) => ({ causeTag: e.causeTag, ct: e.ct, dur: e.dur, seeking: e.seeking, ticksEndedTrue: e.ticksEndedTrue, ticksSinceSeekLanded: e.ticksSinceSeekLanded, endedFlippedThisTick: e.endedFlippedThisTick, seekJustLanded: e.seekJustLanded })))}`);
      out.phases.P6 = p6;
      await page.screenshot({ path: path.join(SCRATCH, `n2-${engineName}-p6.png`) }).catch(() => {});
    }

    out.consoleErrs = consoleErrs;
    out.ok = ["P1", "P2", "P3"].every((p) => out.phases[p] && (out.phases[p].extraCount === 0 || (p === "P3" && out.phases[p].extraEvents.every((e) => e.causeTag === "ended-at-duration"))))
      && out.phases.P4.ok && consoleErrs.length === 0;
  } catch (e) {
    e.partialOut = out;
    throw e;
  } finally {
    await browser.close().catch(() => {});
  }
  return out;
}

async function main() {
  const results = { startedAt: new Date().toISOString(), engines: {} };
  let vite = null, clipServer = null;
  const killAll = () => { try { vite?.kill("SIGKILL"); } catch {} try { clipServer?.close(); } catch {} try { fs.rmSync(path.join(WEB_DIR, "vite.n2.config.mjs"), { force: true }); } catch {} };
  process.on("exit", killAll);
  try {
    if (!fs.existsSync(CLIP30_PATH)) throw new Error(`không thấy clip ${CLIP30_PATH}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = Number(process.env.N2_DEV_PORT || 0) || (await pickFreePort(5490, 5499));
    const CLIP_PORT = await pickFreePort(8990, 8999);
    if (!DEV_PORT || !CLIP_PORT) throw new Error("hết cổng trống");
    const clips = new Map([
      [path.basename(CLIP30_PATH), { path: CLIP30_PATH, type: "video/mp4" }],
    ]);
    clipServer = http.createServer((rq, rs) => {
      const name = decodeURIComponent(new URL(rq.url, "http://x").pathname).slice(1);
      const hit = clips.get(name);
      if (hit) {
        const data = fs.readFileSync(hit.path);
        rs.writeHead(200, { "Content-Type": hit.type, "Content-Length": data.length, "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*" });
        rs.end(data);
      } else { rs.writeHead(404, { "Access-Control-Allow-Origin": "*" }); rs.end(); }
    });
    await new Promise((res) => clipServer.listen(CLIP_PORT, "127.0.0.1", res));
    const clip30Url = `http://127.0.0.1:${CLIP_PORT}/${path.basename(CLIP30_PATH)}`;
    const viteCfg = path.join(WEB_DIR, "vite.n2.config.mjs");
    writeFileEpermRetry(viteCfg, `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()], server: { host: "127.0.0.1", port: ${DEV_PORT}, strictPort: true, hmr: false } });\n`);
    vite = spawn(VITE_BIN, ["--config", viteCfg], { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"] });
    let viteLog = "";
    vite.stdout.on("data", (d) => { viteLog += d.toString(); });
    vite.stderr.on("data", (d) => { viteLog += d.toString(); });
    const devUrl = `http://127.0.0.1:${DEV_PORT}/`;
    let lastFetchErr = "";
    try {
      await waitFor(async () => {
        try { const r = await fetch(devUrl); return r.ok ? true : null; } catch (e) { lastFetchErr = String(e && e.message || e).slice(0, 200); return null; }
      }, "vite dev trả 200", 240000);
    } catch (e) {
      log("vite log (đuôi): " + viteLog.slice(-2000));
      log("lastFetchErr: " + lastFetchErr);
      throw e;
    }
    log(`vite dev sẵn sàng: ${devUrl} (clip30: ${clip30Url})`);
    const engines = ENGINE === "both" ? ["webkit", "chromium"] : [ENGINE];
    for (const e of engines) {
      try {
        results.engines[e] = await runEngine(e, devUrl, clip30Url);
      } catch (err) {
        log(`[${e}] HARNESS/FAIL: ${err.message}`);
        results.engines[e] = { ...(err.partialOut || {}), engine: e, error: String(err.message || err), ok: false };
      }
    }
    results.finishedAt = new Date().toISOString();
    results.ok = Object.values(results.engines).every((e) => e.ok);
    writeFileEpermRetry(path.join(SCRATCH, "n2-webkit-w7-report.json"), JSON.stringify(results, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "n2-run.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ: ${results.ok ? "KHÔNG FAIL" : "CÓ FAIL"} — xem ${path.join(SCRATCH, "n2-webkit-w7-report.json")}`);
    process.exit(results.ok ? 0 : 1);
  } catch (e) {
    log("HARNESS LỖI: " + (e && e.message || e));
    writeFileEpermRetry(path.join(SCRATCH, "n2-run.log"), logLines.join("\n") + "\n");
    process.exit(2);
  } finally {
    killAll();
  }
}

main();
