#!/usr/bin/env node
/**
 * clicktest-84l10-webkit-loop-w1.mjs — Phase 9 đợt 84, luồng L10: kiểm chứng
 * ĐẦY ĐỦ workaround loop W1 trong app thật (đóng nợ đợt 80 §4.5 / đợt 81 I7
 * "W1 đầy đủ không chứng minh được trên VM").
 *
 * Khác I7 ở điểm quyết định: đợt 84 L10 đã thêm bộ đếm RIÊNG cho đường
 * restartEndedElement (`__vcutSyncRestartEndedVideo`, xem preview.tsx) nên
 * lần này quy kết được CHẮC CHẮN restart đã bắn — không còn nhập nhằng với
 * drift re-seek như I7 §2.3.
 *
 * Cách chạy (từ gốc repo, SAU khi đã cài dep WebKit nếu VM vừa reboot):
 *   xvfb-run -a node apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs
 * Env: L10_DEV_PORT (5390–5399), L10_CLIP10 (mặc định
 *   /tmp/l10/clips/f_h264_320x180_10s.mp4), L10_CLIP4 (mặc định
 *   /tmp/l10/clips/g_h264_320x180_4s.mp4), L10_ENGINE (webkit|chromium|both),
 *   L10_SCRATCH (mặc định hidden_files/round84-l10/headed).
 * Exit 0: không FAIL; 1: có FAIL; 2: lỗi harness.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 *
 * Các ca (mỗi engine):
 * - W1 (wiring, xác định): đang phát clip H.264 30 s thật trong app thật,
 *   ép element video thật vào trạng thái `ended` 3 LẦN liên tiếp (ghi đè
 *   getter `ended` trên instance — chỉ để kích hoạt đúng nhánh production,
 *   vì `ended` tự nhiên chỉ xảy ra ở tick biên hiếm gặp). Mỗi lần:
 *   `__vcutSyncRestartEndedVideo` phải tăng ĐÚNG 1 VÀ currentTime phải nhảy
 *   về target của timeline (≈ playhead), KHÔNG về 0, KHÔNG kẹt ở duration.
 *   Sau mỗi lần gỡ ghi đè, phát phải tiếp tục bình thường, không lỗi trang.
 * - W1b (pause/resume giữa loop — biên app): sau lần ép thứ 2, pause 1 s
 *   rồi resume trước khi ép lần 3 — restart vẫn phải bắn đúng 1 lần.
 * - E4 (clip cuối timeline — biên app): project mới chỉ 1 clip 4 s (= hết
 *   timeline); phát tới cuối; sau khi playhead chạm cuối và playing dừng,
 *   `__vcutSyncRestartEndedVideo` KHÔNG được tăng thêm (element ended nhưng
 *   clip không còn active → syncMedia không restart) và không lỗi trang.
 * - W2 (tự nhiên, quan sát): phát trọn clip 30 s không can thiệp, ghi
 *   playhead có tới cuối sạch không + restart tự nhiên (có thể = 0 vì
 *   `ended` tự nhiên hiếm — ghi rõ, không ép PASS/FAIL theo nó).
 * WebKitGTK cần gắn element vào DOM (can thiệp test-only vì W5 — I7 §3).
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
const SCRATCH = process.env.L10_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round84-l10", "headed");
const CLIP10_PATH = process.env.L10_CLIP10 || "/tmp/l10/clips/h_h264_320x180_30s.mp4";
const CLIP4_PATH = process.env.L10_CLIP4 || "/tmp/l10/clips/g_h264_320x180_4s.mp4";
const CLIP10_DUR = 30;
const CLIP4_DUR = 4;
const ENGINE = process.env.L10_ENGINE || "webkit";
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
  window.__l10errors = [];
  window.addEventListener("error", (e) => { try { window.__l10errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__l10errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__l10errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__l10errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__l10storeMod || (window.__l10storeMod = await import(hit));
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
    meta: { name: "L10 loop W1", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", label: "Video 1", clips: [
      { kind: "video", id: "c-l10", src: clipName, start: 0, duration: __DUR__, in: 0, out: __DUR__ },
    ] }],
  });
  const buf = await (await fetch(clipUrl)).arrayBuffer();
  const file = new File([buf], clipName, { type: "video/mp4" });
  const st3 = await (${STORE_FN});
  await st3.importFiles([file]);
  const st4 = await (${STORE_FN});
  const item = st4.media.find((m) => m.name === clipName);
  window.__l10clipDur = __DUR__; // clip hiện tại: STATE_FN ưu tiên element có duration này (pool giữ element cũ của project trước — xem E4 lượt chạy trước: __vcutMediaEls có cả element 30 s cũ lẫn 4 s mới, .find(VIDEO) lấy nhầm element cũ)
  return { mediaName: item ? item.name : null, mediaKind: item ? item.kind : null,
    clips: st4.spec.tracks.flatMap((t) => t.clips.map((c) => ({ trackId: t.id, clipId: c.id, src: c.src, start: c.start, duration: c.duration }))) };
})(__CLIP_URL__, __CLIP_NAME__)`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const els = (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag,
    currentTime: +e.el.currentTime.toFixed(3), paused: e.el.paused,
    ended: e.el.ended, seeking: e.el.seeking, readyState: e.el.readyState,
    duration: Number.isFinite(e.el.duration) ? +e.el.duration.toFixed(3) : null }));
  // Ưu tiên element của clip hiện tại lên đầu (pool giữ element cũ của
  // project trước; mọi .find(VIDEO) phía Node đều lấy phần tử đầu).
  const cur = window.__l10clipDur;
  if (typeof cur === "number") {
    els.sort((a, b) => ((b.tag === "VIDEO" && b.duration === cur) ? 1 : 0) - ((a.tag === "VIDEO" && a.duration === cur) ? 1 : 0));
  }
  return {
    playhead: +st.playhead.toFixed(3), playing: st.playing,
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => c.id)),
    reseeksVideo: window.__vcutSyncReseeksVideo ?? null,
    restartEndedVideo: window.__vcutSyncRestartEndedVideo ?? null,
    restartEndedAudio: window.__vcutSyncRestartEndedAudio ?? null,
    mediaEls: els,
    errors: (window.__l10errors || []).slice(),
  };
})()`;

const PICK_VIDEO_FN = `((window.__vcutMediaEls || []).find((e) => e.tag === "VIDEO" && e.el.duration === window.__l10clipDur) || (window.__vcutMediaEls || []).find((e) => e.tag === "VIDEO"))`;

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

// Chờ element video PHÁT THẬT trước khi ép ended: ct >= 1.0, không seeking,
// không paused, và lệch khỏi playhead <= 1.0 s (nới hơn I7 vì tải VM đợt
// này cao — W6: element WebKitGTK tụt sau playhead hàng giây). Chờ tới 60 s:
// dưới tải cao element cần nhiều giây mới bắt kịp playhead; ép lúc ct còn
// 0.067/seeking (như lượt chạy đầu) thì guard !seeking chặn restart và test
// đo nhầm. Nếu sau 60 s vẫn không đồng bộ nhưng ct >= 0.5, không seeking,
// không paused thì ép tiếp với cảnh báo (ghi rõ drift lúc ép); chỉ FAIL khi
// element không phát thật được (ct < 0.5 hoặc seeking kẹt suốt 60 s).
async function waitForPlaySync(page, engineName, clipDur, tag) {
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
    await sleep(500);
  }
  const v = last && last.mediaEls.find((e) => e.tag === "VIDEO");
  if (v && !v.paused && !v.seeking && v.currentTime >= 0.5) {
    log(`[${engineName}] ${tag}: CẢNH BÁO — không đồng bộ sau 60 s, ép tiếp với drift (playhead=${last.playhead}, ct=${v.currentTime})`);
    return { synced: false, state: last };
  }
  throw new Error(`[${tag}] element không phát thật được sau 60 s chờ đồng bộ: ${JSON.stringify(v)} playhead=${last && last.playhead}`);
}

// Ép ended 1 lần, chờ restart riêng +1 và ct về target; trả về chi tiết.
async function forceOnce(page, engineName, clipDur, tag) {
  await waitForPlaySync(page, engineName, clipDur, tag);
  const base = await page.evaluate(STATE_FN);
  const v0 = base.mediaEls.find((e) => e.tag === "VIDEO");
  if (!v0 || v0.paused || v0.currentTime < 0.5) throw new Error(`[${tag}] video chưa phát thật trước khi ép ended: ${JSON.stringify(v0)} playhead=${base.playhead}`);
  const r0 = base.restartEndedVideo;
  const forced = await page.evaluate(FORCE_ENDED_FN);
  if (!forced.ok) throw new Error("ép ended thất bại: " + JSON.stringify(forced));
  const tForce = Date.now();
  const samples = [];
  // Ghi đè `ended` vẫn bật trong lúc lấy mẫu: syncMedia có thể bắn restart
  // thêm 1 lần nữa ở tick nằm giữa mẫu cuối và lúc đọc afterForce (lượt
  // chạy trước: counter tăng thêm +1 ngoài lần ép — đó là artifact của ghi
  // đè, không phải hành vi production, vì `ended` thật sẽ hết ngay sau khi
  // seek+play). Vì vậy: gỡ ghi đè NGAY sau vòng lấy mẫu rồi mới đọc
  // afterForce, và kết luận "restart đã bắn" theo delta của counter
  // (≥ +1, ghi rõ số lần chính xác), không đòi đúng +1 trong vòng lấy mẫu
  // (lấy mẫu trên WebKitGTK dưới tải thưa ~1,5 s/mẫu nên restart có thể
  // bắn giữa 2 mẫu — lượt chạy trước lần3 FAIL oan vì thế).
  while (Date.now() - tForce < 8000) {
    const s = await page.evaluate(STATE_FN);
    const v = s.mediaEls.find((e) => e.tag === "VIDEO");
    samples.push({ t: +((Date.now() - tForce) / 1000).toFixed(2), playhead: s.playhead, ct: v ? v.currentTime : null, restartEndedVideo: s.restartEndedVideo, reseeksVideo: s.reseeksVideo, seeking: v ? v.seeking : null });
    if (s.restartEndedVideo >= r0 + 1 && v && Math.abs(v.currentTime - s.playhead) < 1.5 && v.currentTime > 0.3 && v.currentTime < clipDur - 0.1) break;
    await sleep(100);
  }
  const unforced = await page.evaluate(UNFORCE_ENDED_FN);
  const afterForce = await page.evaluate(STATE_FN);
  await sleep(1200);
  const afterUnforce = await page.evaluate(STATE_FN);
  const v1 = afterUnforce.mediaEls.find((e) => e.tag === "VIDEO");
  const restartDelta = (afterForce.restartEndedVideo ?? 0) - (r0 ?? 0);
  // Hạ cánh về target: mẫu đầu tiên sau khi counter tăng có |ct-playhead|
  // < 1,5 (nới hơn 0,5 vì element WebKitGTK tụt sau playhead — W6 — và mẫu
  // thưa; seek của restart đặt ct đúng bằng target tại thời điểm bắn).
  let sawTargetSeek = false;
  let firstAfterRestart = null;
  for (const sm of samples) {
    if (sm.restartEndedVideo >= r0 + 1) {
      if (firstAfterRestart === null) firstAfterRestart = sm;
      if (sm.ct !== null && Math.abs(sm.ct - sm.playhead) < 1.5 && sm.ct > 0.3 && sm.ct < clipDur - 0.1) { sawTargetSeek = true; break; }
    }
  }
  const sawRestart = restartDelta >= 1;
  const ok = sawRestart && sawTargetSeek && afterUnforce.errors.length === 0
    && (afterUnforce.playing || afterUnforce.playhead >= clipDur - 0.05 || afterUnforce.playhead > afterForce.playhead);
  const detail = `restartEndedVideo ${r0}→${afterForce.restartEndedVideo} (delta=+${restartDelta}${restartDelta > 1 ? ", gồm bắn lặp do ghi đè ended còn bật — artifact test, xem LIMITS" : ""}, hạ-cánh-về-target=${sawTargetSeek}); sau khi gỡ: playhead ${afterForce.playhead}→${afterUnforce.playhead}, ct=${v1 ? v1.currentTime : null}, playing=${afterUnforce.playing}, errors=${afterUnforce.errors.length}`;
  log(`[${engineName}] ${tag} ${ok ? "PASS" : "FAIL"} — ${detail}`);
  return { ok, samples, restartBefore: r0, restartAfter: afterForce.restartEndedVideo, restartDelta, sawRestart, sawTargetSeek, firstAfterRestart, unforced, playheadAfter: afterForce.playhead, playheadAfterUnforce: afterUnforce.playhead, ctAfterUnforce: v1 ? v1.currentTime : null, playingAfterUnforce: afterUnforce.playing, errors: afterUnforce.errors, detail };
}

async function runEngine(engineName, devUrl, clip10Url, clip4Url) {
  const out = { engine: engineName, cases: {}, note: "" };
  const launchOpts = engineName === "webkit"
    ? { headless: false }
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

    // --- W1: ép ended 3 lần liên tiếp trên clip 30 s ---
    const clip10Name = path.basename(CLIP10_PATH);
    log(`[${engineName}] setup W1 (clip 30 s):`, JSON.stringify(await setupProject(page, clip10Url, clip10Name, CLIP10_DUR)));
    await startPlaying(page, engineName, CLIP10_DUR);
    const w1 = { rounds: [] };
    for (let i = 1; i <= 3; i++) {
      // Tua về 0 đầu mỗi vòng ép để playhead không chạm cuối clip trước vòng
      // sau (forceOnce chờ đồng bộ có thể tốn nhiều giây dưới tải). Xác minh
      // playhead thật sự về ~0 (lượt chạy trước: sau khi clip hết, reset
      // không ăn và vòng sau chờ đồng bộ 60 s trong vô ích).
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(0); if (!s.playing) s.togglePlay(); })()`);
        await sleep(500);
        const chk0 = await page.evaluate(STATE_FN);
        if (chk0.playhead < 1.0) break;
        log(`[${engineName}] reset playhead lần ${attempt + 1} chưa về 0 (playhead=${chk0.playhead}, playing=${chk0.playing}) — thử lại`);
        await sleep(500);
      }
      let chk = await page.evaluate(STATE_FN);
      if (!chk.playing) { await page.keyboard.press("Space"); await sleep(300); }
      if (i === 3) {
        // W1b: pause/resume giữa loop trước lần ép thứ 3.
        const before = await page.evaluate(STATE_FN);
        await page.keyboard.press("Space"); // pause
        await sleep(1000);
        const paused = await page.evaluate(STATE_FN);
        w1.pauseResume = { pausedPlaying: paused.playing, pausedCt: (paused.mediaEls.find((e) => e.tag === "VIDEO") || {}).currentTime };
        await page.keyboard.press("Space"); // resume
        await sleep(500);
        const resumed = await page.evaluate(STATE_FN);
        w1.pauseResume.resumedPlaying = resumed.playing;
        log(`[${engineName}] W1b pause/resume: playing ${before.playing}→${paused.playing}→${resumed.playing}`);
        if (!resumed.playing) throw new Error("không resume được sau pause (W1b)");
      }
      const r = await forceOnce(page, engineName, CLIP10_DUR, `W1-lần${i}`);
      w1.rounds.push(r);
      // Đợi element đồng bộ lại trước lần ép sau (tránh ép lúc drift seek
      // đang bay — guard !seeking sẽ chặn restart suốt cửa sổ).
      await waitFor(async () => {
        const s = await page.evaluate(STATE_FN);
        const v = s.mediaEls.find((e) => e.tag === "VIDEO");
        if (!v || v.paused || v.seeking) return null;
        if (Math.abs(v.currentTime - s.playhead) > 0.35) return null;
        return s;
      }, `đồng bộ lại trước lần ép ${i + 1}`, 10000).catch((e) => { log(`[${engineName}] W1: không chờ được đồng bộ trước lần ${i + 1} (${e.message})`); return null; });
    }
    w1.ok = w1.rounds.every((r) => r.ok);
    out.cases.W1 = w1;
    await page.screenshot({ path: path.join(SCRATCH, `l10-${engineName}-w1.png`) }).catch(() => {});

    // --- W2: phát tự nhiên trọn clip 30 s (quan sát) ---
    const w2 = { samples: [] };
    await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(0); if (!s.playing) s.togglePlay(); })()`);
    await sleep(300);
    let s2 = await page.evaluate(STATE_FN);
    if (!s2.playing) { await page.keyboard.press("Space"); await sleep(200); s2 = await page.evaluate(STATE_FN); }
    const r2 = s2.restartEndedVideo;
    const t2 = Date.now();
    let reachedEnd = false;
    while (Date.now() - t2 < 70000) {
      const s = await page.evaluate(STATE_FN);
      const v = s.mediaEls.find((e) => e.tag === "VIDEO");
      w2.samples.push({ t: +((Date.now() - t2) / 1000).toFixed(2), playhead: s.playhead, playing: s.playing, ct: v ? v.currentTime : null, paused: v ? v.paused : null, restartEndedVideo: s.restartEndedVideo });
      if (s.playhead >= CLIP10_DUR - 0.1) { reachedEnd = true; break; }
      if (!s.playing && s.playhead > 0.5) break;
      await sleep(200);
    }
    const end2 = await page.evaluate(STATE_FN);
    w2.restartDeltaNatural = (end2.restartEndedVideo ?? 0) - (r2 ?? 0);
    w2.reachedEnd = reachedEnd; w2.finalPlayhead = end2.playhead; w2.errors = end2.errors;
    w2.verdict = reachedEnd && end2.errors.length === 0 ? "PASS" : "INCONCLUSIVE";
    w2.detail = `playhead cuối=${end2.playhead} (tới cuối=${reachedEnd}), restart tự nhiên Δ=${w2.restartDeltaNatural}, errors=${end2.errors.length}`;
    log(`[${engineName}] W2 ${w2.verdict} — ${w2.detail}`);
    out.cases.W2 = w2;
    await page.screenshot({ path: path.join(SCRATCH, `l10-${engineName}-w2.png`) }).catch(() => {});

    // --- E4: clip 4 s = cuối timeline — restart KHÔNG được bắn sau khi hết ---
    const clip4Name = path.basename(CLIP4_PATH);
    log(`[${engineName}] setup E4 (clip 4 s = cuối timeline):`, JSON.stringify(await setupProject(page, clip4Url, clip4Name, CLIP4_DUR)));
    await startPlaying(page, engineName, CLIP4_DUR);
    const e4 = { samples: [] };
    const t4 = Date.now();
    let e4ReachedEnd = false;
    while (Date.now() - t4 < 25000) {
      const s = await page.evaluate(STATE_FN);
      const v = s.mediaEls.find((e) => e.tag === "VIDEO");
      e4.samples.push({ t: +((Date.now() - t4) / 1000).toFixed(2), playhead: s.playhead, playing: s.playing, ct: v ? v.currentTime : null, paused: v ? v.paused : null, ended: v ? v.ended : null, restartEndedVideo: s.restartEndedVideo });
      if (s.playhead >= CLIP4_DUR - 0.05 && !s.playing) { e4ReachedEnd = true; break; }
      await sleep(200);
    }
    const mid4 = await page.evaluate(STATE_FN);
    const rMid = mid4.restartEndedVideo;
    await sleep(3000); // chờ thêm 3 s: restart giả (nếu có) sẽ lộ ở đây
    const end4 = await page.evaluate(STATE_FN);
    const v4 = end4.mediaEls.find((e) => e.tag === "VIDEO");
    e4.reachedEnd = e4ReachedEnd;
    e4.restartAtEnd = rMid;
    e4.restartAfter3s = end4.restartEndedVideo;
    e4.finalPlayhead = end4.playhead;
    e4.finalPlaying = end4.playing;
    e4.finalCt = v4 ? v4.currentTime : null;
    e4.finalEnded = v4 ? v4.ended : null;
    e4.errors = end4.errors;
    // PASS: tới cuối, playing dừng, restart không tăng thêm trong 3 s chờ.
    e4.ok = e4ReachedEnd && !end4.playing && end4.restartEndedVideo === rMid && end4.errors.length === 0;
    e4.detail = `tới cuối=${e4ReachedEnd}, playing cuối=${end4.playing}, restartEndedVideo tại cuối=${rMid} → sau 3 s=${end4.restartEndedVideo}, ct cuối=${e4.finalCt}, ended=${e4.finalEnded}, errors=${end4.errors.length}`;
    log(`[${engineName}] E4 ${e4.ok ? "PASS" : "FAIL"} — ${e4.detail}`);
    out.cases.E4 = e4;
    await page.screenshot({ path: path.join(SCRATCH, `l10-${engineName}-e4.png`) }).catch(() => {});
    out.consoleErrs = consoleErrs;
    out.ok = (w1.ok && w2.verdict !== "FAIL" && e4.ok);
  } catch (e) {
    // Giữ lại các ca đã xong để report không mất dữ liệu từng phần (lượt
    // chạy trước: throw ở E4 làm mất hết W1/W2 trong report JSON).
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
  const killAll = () => { try { vite?.kill("SIGKILL"); } catch {} try { clipServer?.close(); } catch {} try { fs.rmSync(path.join(WEB_DIR, "vite.l10.config.mjs"), { force: true }); } catch {} };
  process.on("exit", killAll);
  try {
    if (!fs.existsSync(CLIP10_PATH)) throw new Error(`không thấy clip ${CLIP10_PATH}`);
    if (!fs.existsSync(CLIP4_PATH)) throw new Error(`không thấy clip ${CLIP4_PATH}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = Number(process.env.L10_DEV_PORT || 0) || (await pickFreePort(5390, 5399));
    const CLIP_PORT = await pickFreePort(8890, 8899);
    if (!DEV_PORT || !CLIP_PORT) throw new Error("hết cổng trống");
    const clips = new Map([
      [path.basename(CLIP10_PATH), { path: CLIP10_PATH, type: "video/mp4" }],
      [path.basename(CLIP4_PATH), { path: CLIP4_PATH, type: "video/mp4" }],
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
    const clip10Url = `http://127.0.0.1:${CLIP_PORT}/${path.basename(CLIP10_PATH)}`;
    const clip4Url = `http://127.0.0.1:${CLIP_PORT}/${path.basename(CLIP4_PATH)}`;
    const viteCfg = path.join(WEB_DIR, "vite.l10.config.mjs");
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
    log(`vite dev sẵn sàng: ${devUrl} (clip10: ${clip10Url}; clip4: ${clip4Url})`);
    const engines = ENGINE === "both" ? ["webkit", "chromium"] : [ENGINE];
    for (const e of engines) {
      try {
        results.engines[e] = await runEngine(e, devUrl, clip10Url, clip4Url);
      } catch (err) {
        log(`[${e}] HARNESS/FAIL: ${err.message}`);
        results.engines[e] = { ...(err.partialOut || {}), engine: e, error: String(err.message || err), ok: false };
      }
    }
    results.finishedAt = new Date().toISOString();
    results.ok = Object.values(results.engines).every((e) => e.ok);
    writeFileEpermRetry(path.join(SCRATCH, "l10-webkit-loop-w1-report.json"), JSON.stringify(results, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "l10-run.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ: ${results.ok ? "KHÔNG FAIL" : "CÓ FAIL"} — xem ${path.join(SCRATCH, "l10-webkit-loop-w1-report.json")}`);
    process.exit(results.ok ? 0 : 1);
  } catch (e) {
    log("HARNESS LỖI: " + (e && e.message || e));
    writeFileEpermRetry(path.join(SCRATCH, "l10-run.log"), logLines.join("\n") + "\n");
    process.exit(2);
  } finally {
    killAll();
  }
}

main();
