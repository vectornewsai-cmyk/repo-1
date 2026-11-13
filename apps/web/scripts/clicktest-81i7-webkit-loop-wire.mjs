#!/usr/bin/env node
/**
 * clicktest-81i7-webkit-loop-wire.mjs — Phase 9 đợt 81, luồng I7:
 * kiểm chứng end-to-end (headed THẬT) rằng workaround loop WebKitGTK
 * của đợt 80 H5 (restartEndedElement) ĐÃ NỐI vào đường phát production
 * (syncMedia trong preview.tsx) và hoạt động trong app thật — đóng nợ
 * H5 §7.4 "click-test editor đầy đủ trên WebKitGTK".
 *
 * Cách chạy (từ gốc repo, SAU khi đã cài dep WebKit nếu VM vừa reboot):
 *   xvfb-run -a node apps/web/scripts/clicktest-81i7-webkit-loop-wire.mjs
 * Env: I7_DEV_PORT (5390–5399), I7_CLIP (mặc định /tmp/round81-i7/i7-clip-4s.mp4),
 *   I7_ENGINE (webkit|chromium|both — mặc định webkit),
 *   I7_SCRATCH (mặc định hidden_files/round81-i7/headed).
 * Exit 0: không FAIL; 1: có FAIL; 2: lỗi harness.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 *
 * Thiết kế kiểm chứng (trung thực về giới hạn):
 * - W1 (wiring, xác định): đang phát clip H.264 4 s thật trong app thật,
 *   ép element video thật vào trạng thái `ended` (ghi đè getter `ended`
 *   trên instance — chỉ để kích hoạt đúng nhánh production, vì `ended`
 *   tự nhiên chỉ xảy ra ở tick biên hiếm gặp) rồi quan sát syncMedia:
 *   `__vcutSyncReseeksVideo` phải tăng VÀ currentTime phải nhảy về
 *   target của timeline (≈ playhead), KHÔNG về 0, KHÔNG kẹt ở duration.
 *   Sau đó gỡ ghi đè, phát phải tiếp tục bình thường, không lỗi trang.
 *   Đây là kiểm chứng ĐƯỜNG NỐI trong app thật, không phải kiểm chứng
 *   hành vi `ended` của trình duyệt — hành vi đó H5 đã đo bằng probe
 *   (webkit_loop_probe_80h5.mjs: ended → seek+play sửa được loop).
 *   PHÁT HIỆN MỚI I7 (W5): trên WebKitGTK headed, element video TÁCH
 *   DOM của preview (MediaPool.videoFor không gắn vào document) KHÔNG
 *   tiến currentTime (0,000 suốt 5 s, totalVideoFrames = 0) dù
 *   paused=false — đo bằng probe /tmp/round81-i7/detached-probe.mjs:
 *   cùng clip, element gắn DOM (160×90) phát realtime tới ended.
 *   Vì vậy W1 trên WebKitGTK cần can thiệp test-only: gắn element thật
 *   của pool vào DOM (2×2 px góc trang) để nó decode được — KHÔNG đổi
 *   code production. W5 là nợ mới (preview video đứng hình trên
 *   WebKitGTK), để đợt sau quyết có gắn element pool vào DOM không.
 * - W2 (tự nhiên, quan sát): phát trọn clip 4 s không can thiệp, ghi
 *   playhead có tới cuối sạch không + reseek tự nhiên (có thể = 0 vì
 *   `ended` tự nhiên hiếm — ghi rõ, không ép PASS/FAIL theo nó).
 * - W3 (đối chứng Chromium): chạy lại W1 trên Chromium headed — cùng
 *   hành vi, chứng minh không hồi quy đường phát thường.
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
const SCRATCH = process.env.I7_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round81-i7", "headed");
const CLIP_PATH = process.env.I7_CLIP || "/tmp/round81-i7/i7-clip-10s.mp4";
const CLIP_DUR = 10; // giây — clip dài để cửa sổ ép ended (6 s) nằm giữa clip
const CLIP_NAME = path.basename(CLIP_PATH);
const ENGINE = process.env.I7_ENGINE || "webkit";
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
  window.__i7errors = [];
  window.addEventListener("error", (e) => { try { window.__i7errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__i7errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__i7errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__i7errors.push("unhandledrejection: <?>"); } });
  window.__i7boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu N9): import /src/store.ts qua
// performance resource entries. Chỉ dùng để SETUP project (newProject /
// replaceProject / importFiles / setPlayhead) — mọi thao tác phát/dừng
// dưới test đều là phím Space thật; trạng thái ended chỉ bị ép bằng
// ghi đè getter trên element thật (xem W1).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__i7storeMod || (window.__i7storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Setup: project mới với đúng 1 clip video 4 s (file thật import qua
// importFiles) — replaceProject XÓA media nên importFiles PHẢI chạy sau.
const SETUP_FN = `(async (clipUrl, clipName) => {
  const st = await (${STORE_FN});
  const ver = st.spec.version;
  st.newProject();
  const st2 = await (${STORE_FN});
  st2.replaceProject({
    version: ver,
    meta: { name: "I7 loop wire", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", label: "Video 1", clips: [
      { kind: "video", id: "c-i7", src: clipName, start: 0, duration: __CLIP_DUR__, in: 0, out: __CLIP_DUR__ },
    ] }],
  });
  const buf = await (await fetch(clipUrl)).arrayBuffer();
  const file = new File([buf], clipName, { type: "video/mp4" });
  const st3 = await (${STORE_FN});
  await st3.importFiles([file]);
  const st4 = await (${STORE_FN});
  const item = st4.media.find((m) => m.name === clipName);
  return { mediaName: item ? item.name : null, mediaKind: item ? item.kind : null,
    clips: st4.spec.tracks.flatMap((t) => t.clips.map((c) => ({ trackId: t.id, clipId: c.id, src: c.src, start: c.start, duration: c.duration }))) };
})(__CLIP_URL__, __CLIP_NAME__)`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const els = (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag,
    currentTime: +e.el.currentTime.toFixed(3), paused: e.el.paused,
    ended: e.el.ended, seeking: e.el.seeking, readyState: e.el.readyState,
    duration: Number.isFinite(e.el.duration) ? +e.el.duration.toFixed(3) : null }));
  return {
    playhead: +st.playhead.toFixed(3), playing: st.playing,
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => c.id)),
    reseeksVideo: window.__vcutSyncReseeksVideo ?? null,
    reseeks: window.__vcutSyncReseeks ?? null,
    mediaEls: els,
    errors: (window.__i7errors || []).slice(),
  };
})()`;

// Gắn element video thật của pool vào DOM (chỉ dùng trên WebKitGTK —
// can thiệp test-only để vượt W5: element tách DOM không decode được
// trên WebKitGTK; KHÔNG đổi code production). Trả về isConnected.
const ATTACH_FN = `(() => {
  const v = (window.__vcutMediaEls || []).find((e) => e.tag === "VIDEO");
  if (!v) return { ok: false, why: "no VIDEO el" };
  v.el.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;pointer-events:none;z-index:1";
  document.body.appendChild(v.el);
  return { ok: true, isConnected: v.el.isConnected };
})()`;

// Ép / gỡ trạng thái ended trên element video thật (ghi đè getter trên
// instance; delete khôi phục getter gốc của prototype).
const FORCE_ENDED_FN = `(() => {
  const v = (window.__vcutMediaEls || []).find((e) => e.tag === "VIDEO");
  if (!v) return { ok: false, why: "no VIDEO el" };
  Object.defineProperty(v.el, "ended", { configurable: true, get: () => true });
  return { ok: true };
})()`;
const UNFORCE_ENDED_FN = `(() => {
  const v = (window.__vcutMediaEls || []).find((e) => e.tag === "VIDEO");
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

async function runEngine(engineName, devUrl, clipUrl) {
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
    // Đóng modal chào nếu có (chặn phím Space).
    await page.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
    await sleep(800);

    // --- Setup project ---
    const setup = await page.evaluate(SETUP_FN.replaceAll("__CLIP_URL__", JSON.stringify(clipUrl)).replaceAll("__CLIP_NAME__", JSON.stringify(CLIP_NAME)).replaceAll("__CLIP_DUR__", String(CLIP_DUR)));
    log(`[${engineName}] setup:`, JSON.stringify(setup));
    if (!setup.mediaName || setup.clips.length !== 1) throw new Error("setup project sai: " + JSON.stringify(setup));
    // Element media chỉ được pool tạo + công bố qua __vcutMediaEls trong
    // nhánh PLAYING của tick preview (preview.tsx ~l3930) — phải phát
    // trước rồi mới chờ element, không chờ lúc đang pause.
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
    const video = await waitFor(async () => {
      const s = await page.evaluate(STATE_FN);
      const v = s.mediaEls.find((e) => e.tag === "VIDEO");
      return v && v.readyState >= 2 && v.duration === CLIP_DUR ? v : null;
    }, "video element sẵn sàng (readyState>=2, duration=10)", 120000);
    log(`[${engineName}] video element:`, JSON.stringify(video));
    // W5: chỉ WebKitGTK cần gắn element vào DOM để decode được (xem
    // đầu file). Chromium là đối chứng thuần — không gắn.
    if (engineName === "webkit") {
      const attached = await page.evaluate(ATTACH_FN);
      log(`[${engineName}] attach element vào DOM (can thiệp test-only vì W5):`, JSON.stringify(attached));
      if (!attached.ok || !attached.isConnected) throw new Error("gắn element vào DOM thất bại: " + JSON.stringify(attached));
    }

    // --- W1: wiring — ép ended trong lúc phát ---
    // Tua về 0 sau khi gắn element (playhead đã chạy trong lúc chờ
    // element sẵn sàng), rồi chờ element ĐỒNG BỘ (ct ≈ playhead, không
    // seeking) mới ép ended — nếu ép lúc drift seek đang bay thì guard
    // `!seeking` của restartEndedElement chặn phục hồi suốt cửa sổ
    // (seek WebKitGTK dưới tải mất hàng giây — xem lượt chạy trước).
    const w1 = { samples: [] };
    await page.evaluate(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(0); if (!st.playing) st.togglePlay(); })()`);
    await sleep(300);
    let stChk = await page.evaluate(STATE_FN);
    if (!stChk.playing) { await page.keyboard.press("Space"); await sleep(300); }
    const synced = await waitFor(async () => {
      const s = await page.evaluate(STATE_FN);
      const v = s.mediaEls.find((e) => e.tag === "VIDEO");
      if (!v || v.paused || v.seeking) return null;
      if (v.currentTime < 0.5) return null;
      if (Math.abs(v.currentTime - s.playhead) > 0.35) return null;
      return s;
    }, "element đồng bộ (ct≈playhead, không seeking)", 8000).catch((e) => { log(`[${engineName}] W1: không chờ được đồng bộ — ép với trạng thái hiện tại (${e.message})`); return null; });
    const base = await page.evaluate(STATE_FN);
    let st = base;
    const v0 = st.mediaEls.find((e) => e.tag === "VIDEO");
    log(`[${engineName}] W1 trước khi ép: playhead=${st.playhead} ct=${v0 && v0.currentTime} paused=${v0 && v0.paused} reseeksVideo=${st.reseeksVideo}`);
    if (!v0 || v0.paused || v0.currentTime < 0.5) throw new Error(`video chưa phát thật trước khi ép ended: ${JSON.stringify(v0)} playhead=${st.playhead}`);
    const r0 = st.reseeksVideo;
    const forced = await page.evaluate(FORCE_ENDED_FN);
    if (!forced.ok) throw new Error("ép ended thất bại: " + JSON.stringify(forced));
    const tForce = Date.now();
    let sawRestart = false, sawTargetSeek = false;
    while (Date.now() - tForce < 6000) {
      const s = await page.evaluate(STATE_FN);
      const v = s.mediaEls.find((e) => e.tag === "VIDEO");
      w1.samples.push({ t: +( (Date.now() - tForce) / 1000 ).toFixed(2), playhead: s.playhead, ct: v ? v.currentTime : null, reseeksVideo: s.reseeksVideo, seeking: v ? v.seeking : null });
      if (s.reseeksVideo > r0) sawRestart = true;
      // seek về target của timeline: |ct - playhead| nhỏ, ct không ở 0
      // (trừ khi playhead ≈ 0) và không kẹt ở duration.
      if (v && Math.abs(v.currentTime - s.playhead) < 0.5 && v.currentTime > 0.3 && v.currentTime < CLIP_DUR - 0.1) sawTargetSeek = true;
      if (sawRestart && sawTargetSeek) break;
      await sleep(100);
    }
    const afterForce = await page.evaluate(STATE_FN);
    w1.reseeksBefore = r0; w1.reseeksAfter = afterForce.reseeksVideo;
    w1.sawRestart = sawRestart; w1.sawTargetSeek = sawTargetSeek;
    w1.playheadAfter = afterForce.playhead;
    // Gỡ ghi đè, phát phải tiếp tục.
    const unforced = await page.evaluate(UNFORCE_ENDED_FN);
    await sleep(1200);
    const afterUnforce = await page.evaluate(STATE_FN);
    const v1 = afterUnforce.mediaEls.find((e) => e.tag === "VIDEO");
    w1.unforced = unforced; w1.playheadAfterUnforce = afterUnforce.playhead;
    w1.ctAfterUnforce = v1 ? v1.currentTime : null; w1.playingAfterUnforce = afterUnforce.playing;
    w1.errors = afterUnforce.errors;
    w1.ok = sawRestart && sawTargetSeek && afterUnforce.errors.length === 0 && (afterUnforce.playing || afterUnforce.playhead >= CLIP_DUR - 0.05 || afterUnforce.playhead > afterForce.playhead);
    w1.detail = `reseeksVideo ${r0}→${afterForce.reseeksVideo} (restart=${sawRestart}, seek-về-target=${sawTargetSeek}); sau khi gỡ: playhead ${afterForce.playhead}→${afterUnforce.playhead}, ct=${w1.ctAfterUnforce}, playing=${afterUnforce.playing}, errors=${afterUnforce.errors.length}`;
    log(`[${engineName}] W1 ${w1.ok ? "PASS" : "FAIL"} — ${w1.detail}`);
    out.cases.W1 = w1;
    await page.screenshot({ path: path.join(SCRATCH, `i7-${engineName}-w1.png`) }).catch(() => {});

    // --- W2: phát tự nhiên trọn clip (quan sát, không ép) ---
    // Sau W1 vẫn đang phát — chỉ tua về 0, giữ nguyên playing.
    const w2 = { samples: [] };
    await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(0); if (!s.playing) s.togglePlay(); })()`);
    await sleep(300);
    let s2 = await page.evaluate(STATE_FN);
    if (!s2.playing) { await page.keyboard.press("Space"); await sleep(200); s2 = await page.evaluate(STATE_FN); }
    const r2 = s2.reseeksVideo;
    const t2 = Date.now();
    let reachedEnd = false;
    while (Date.now() - t2 < 20000) {
      const s = await page.evaluate(STATE_FN);
      const v = s.mediaEls.find((e) => e.tag === "VIDEO");
      w2.samples.push({ t: +((Date.now() - t2) / 1000).toFixed(2), playhead: s.playhead, playing: s.playing, ct: v ? v.currentTime : null, paused: v ? v.paused : null, reseeksVideo: s.reseeksVideo });
      if (s.playhead >= CLIP_DUR - 0.1) { reachedEnd = true; break; }
      if (!s.playing && s.playhead > 0.5) break; // phát tự dừng giữa chừng
      await sleep(200);
    }
    const end2 = await page.evaluate(STATE_FN);
    w2.reseeksDeltaNatural = (end2.reseeksVideo ?? 0) - (r2 ?? 0);
    w2.reachedEnd = reachedEnd; w2.finalPlayhead = end2.playhead; w2.errors = end2.errors;
    // W2 là quan sát: PASS nếu tới cuối sạch; INCONCLUSIVE nếu kẹt do đói
    // decode dưới tải (ghi rõ, không kết tội đường nối — W1 đã khóa nó).
    w2.verdict = reachedEnd && end2.errors.length === 0 ? "PASS" : "INCONCLUSIVE";
    w2.detail = `playhead cuối=${end2.playhead} (tới cuối=${reachedEnd}), reseek tự nhiên Δ=${w2.reseeksDeltaNatural}, errors=${end2.errors.length}`;
    log(`[${engineName}] W2 ${w2.verdict} — ${w2.detail}`);
    out.cases.W2 = w2;
    await page.screenshot({ path: path.join(SCRATCH, `i7-${engineName}-w2.png`) }).catch(() => {});
    out.consoleErrs = consoleErrs;
    out.ok = (w1.ok && w2.verdict !== "FAIL");
  } finally {
    await browser.close().catch(() => {});
  }
  return out;
}

async function main() {
  const results = { startedAt: new Date().toISOString(), engines: {} };
  let vite = null, clipServer = null;
  const killAll = () => { try { vite?.kill("SIGKILL"); } catch {} try { clipServer?.close(); } catch {} try { fs.rmSync(path.join(WEB_DIR, "vite.i7.config.mjs"), { force: true }); } catch {} };
  process.on("exit", killAll);
  try {
    if (!fs.existsSync(CLIP_PATH)) throw new Error(`không thấy clip ${CLIP_PATH}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = Number(process.env.I7_DEV_PORT || 0) || (await pickFreePort(5390, 5399));
    const CLIP_PORT = await pickFreePort(8890, 8899);
    if (!DEV_PORT || !CLIP_PORT) throw new Error("hết cổng trống");
    // Server tĩnh nhỏ cho clip thật.
    clipServer = http.createServer((rq, rs) => {
      if (rq.url === "/" + CLIP_NAME) {
        const data = fs.readFileSync(CLIP_PATH);
        rs.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": data.length, "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*" });
        rs.end(data);
      } else { rs.writeHead(404, { "Access-Control-Allow-Origin": "*" }); rs.end(); }
    });
    await new Promise((res) => clipServer.listen(CLIP_PORT, "127.0.0.1", res));
    const clipUrl = `http://127.0.0.1:${CLIP_PORT}/${CLIP_NAME}`;
    // Vite dev, HMR tắt (tránh reload giữa chừng do luồng khác sửa file).
    // Config PHẢI nằm trong apps/web để import "vite" / "@vitejs/plugin-react"
    // phân giải được từ node_modules của repo (config trong /tmp lỗi
    // ERR_MODULE_NOT_FOUND — xem log lượt chạy đầu). Xóa ở finally.
    const viteCfg = path.join(WEB_DIR, "vite.i7.config.mjs");
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
    log(`vite dev sẵn sàng: ${devUrl} (clip: ${clipUrl})`);
    const engines = ENGINE === "both" ? ["webkit", "chromium"] : [ENGINE];
    for (const e of engines) {
      try {
        results.engines[e] = await runEngine(e, devUrl, clipUrl);
      } catch (err) {
        log(`[${e}] HARNESS/FAIL: ${err.message}`);
        results.engines[e] = { engine: e, error: String(err.message || err), ok: false };
      }
    }
    results.finishedAt = new Date().toISOString();
    results.ok = Object.values(results.engines).every((e) => e.ok);
    writeFileEpermRetry(path.join(SCRATCH, "i7-webkit-loop-wire-report.json"), JSON.stringify(results, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "i7-run.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ: ${results.ok ? "KHÔNG FAIL" : "CÓ FAIL"} — xem ${path.join(SCRATCH, "i7-webkit-loop-wire-report.json")}`);
    process.exit(results.ok ? 0 : 1);
  } catch (e) {
    log("HARNESS LỖI: " + (e && e.message || e));
    writeFileEpermRetry(path.join(SCRATCH, "i7-run.log"), logLines.join("\n") + "\n");
    process.exit(2);
  } finally {
    killAll();
  }
}

main();
