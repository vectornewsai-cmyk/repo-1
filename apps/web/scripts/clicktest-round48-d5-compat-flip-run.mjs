#!/usr/bin/env node
/**
 * Phase 9 đợt 48, luồng D5 — compat APP THẬT: ghi mốc trung gian
 * WEBCODECS → failed bằng hook event-based (nợ C6 §7.3).
 *
 * File này là BẢN SAO của script C6 (clicktest-round47-c6-compat-app-run.mjs)
 * rút gọn chỉ còn phase B + hook bắt flip; mọi hạ tầng đo (CDP pipe,
 * Xvfb, seed footage hỏng 64 KiB, serve dist tĩnh) giữ nguyên từng dòng.
 * Không sửa file C6 gốc. Không sửa code app trong script này.
 *
 * Vấn đề C6 để lại: lần poll đầu tiên sau khi bấm Phát (poll mỗi 1 s)
 * đã thấy badge failed nên KHÔNG ghi được mốc trung gian "hiện
 * WEBCODECS rồi mới lật sang failed" — flip xảy ra trong ~1 s, nhanh
 * hơn chu kỳ poll. Script này gắn hook TRONG TRANG trước khi bấm Phát:
 *  (a) MutationObserver trên badge `.preview-reverse-engine-badge` +
 *      parent của nó (bắt cả đổi text lẫn thay node) — callback chạy
 *      dạng microtask, timestamp performance.now() chính xác <1 ms;
 *  (b) poll nhanh 50 ms trong trang song song (backup nếu observer hụt).
 * Mọi sự kiện ghi vào window.__d5FlipLog với cùng một đồng hồ
 * performance.now(); cú bấm Phát cũng ghi timestamp trong cùng trang
 * nên độ trễ flip = t(failed) − t(click) là số đo thật, không phải
 * ước lượng từ chu kỳ poll ngoài.
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/clicktest-round48-d5-compat-flip-run.mjs \
 *     --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
 *     --dist ~/workspace/tmp-round47-c6/app-dist \
 *     --scratch ~/workspace/tmp-round48-d5/compat-flip \
 *     [--display :97] [--port 4299]
 * Exit 0 khi mọi kiểm tra bắt buộc pass; exit 1 khi có FAIL;
 * exit 2 khi blocker hạ tầng. KHÔNG push, KHÔNG tag, KHÔNG ghi qua
 * GitHub connector. Scratch ngoài repo (không stage).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..", "..", "..");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const VI = JSON.parse(fs.readFileSync(path.join(REPO, "apps/web/src/i18n/vi.json"), "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(REPO, "apps/web/src/i18n/en.json"), "utf8"));

function parseArgs(argv) {
  const o = { display: ":97", port: 4299 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--flat") o.flat = argv[++i];
    else if (argv[i] === "--dist") o.dist = argv[++i];
    else if (argv[i] === "--scratch") o.scratch = argv[++i];
    else if (argv[i] === "--display") o.display = argv[++i];
    else if (argv[i] === "--port") o.port = Number(argv[++i]);
  }
  return o;
}
const opts = parseArgs(process.argv.slice(2));
if (!opts.flat || !opts.dist || !opts.scratch || !fs.existsSync(opts.flat) || !fs.existsSync(path.join(opts.dist, "index.html"))) {
  console.error("Cách dùng: --flat <flat.mp4> --dist <app-dist> --scratch <dir>");
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return null; } };
const MIME = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm" };

// 64 KiB byte rác xác định (LCG) — không phải mp4: không có ftyp/moov.
const BROKEN = Buffer.alloc(64 * 1024);
{ let s = 0x12345678; for (let i = 0; i < BROKEN.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; BROKEN[i] = (s >> 16) & 0xff; } }

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    proc.on("error", () => {});
    for (const s of [1, 2, 3, 4]) { try { proc.stdio[s]?.on("error", () => {}); } catch {} }
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression, timeoutMs = 120000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 500)}`);
    return r.result?.value;
  }
}

const BADGE_JS = `(() => { const el = document.querySelector(".preview-reverse-engine-badge"); if (!el) return null; return { text: el.textContent, title: el.title, display: el.style.display, bg: el.style.background }; })()`;
const IDLE_JS = `(() => { const i = window.__vcutPreviewIdle; if (!i) return null; return { ticks: i.ticks, sleeping: i.sleeping, lastDrawn: i.lastDrawn, lastRequested: i.lastRequested }; })()`;
const LANG_BTN_JS = `(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "") === "Ngôn ngữ" || (x.getAttribute("aria-label") || "") === "Language"); if (!b) return null; return { label: b.getAttribute("aria-label"), text: b.textContent, visible: b.getBoundingClientRect().width > 0 }; })()`;
const CLICK_LANG_JS = `(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "") === "Ngôn ngữ" || (x.getAttribute("aria-label") || "") === "Language"); if (!b) return null; b.click(); return { clicked: b.getAttribute("aria-label") }; })()`;
const PLAY_BTN_JS = `(() => { const b = [...document.querySelectorAll("button")].find((x) => ["Phát (Space)", "Play (Space)", "Tạm dừng (Space)", "Pause (Space)"].includes(x.getAttribute("aria-label") || "")); if (!b) return null; return { label: b.getAttribute("aria-label"), pressed: b.getAttribute("aria-pressed") }; })()`;
const CLICK_PLAY_JS = `(() => { const b = [...document.querySelectorAll("button")].find((x) => ["Phát (Space)", "Play (Space)", "Tạm dừng (Space)", "Pause (Space)"].includes(x.getAttribute("aria-label") || "")); if (!b) return null; b.click(); return { clicked: b.getAttribute("aria-label") }; })()`;
const PLAYING_JS = `(() => { const b = [...document.querySelectorAll("button")].find((x) => ["Phát (Space)", "Play (Space)", "Tạm dừng (Space)", "Pause (Space)"].includes(x.getAttribute("aria-label") || "")); return b ? b.getAttribute("aria-pressed") === "true" : null; })()`;
// Hook bắt flip trong trang: MutationObserver trên badge + parent của nó,
// poll 50 ms backup; mọi entry dùng performance.now() (cùng đồng hồ với
// cú bấm Phát trong trang, không lệch do round-trip CDP). Observer bắt
// cả đổi text (characterData/childList) lẫn thay node (parent childList).
const HOOK_INSTALL_FN = `
(() => {
  window.__d5FlipLog = [];
  window.__d5LastPollText = null;
  const badge = () => document.querySelector(".preview-reverse-engine-badge");
  const rec = (kind, extra) => {
    const b = badge();
    window.__d5FlipLog.push({ tMs: performance.now(), kind, text: b ? b.textContent : null, title: b ? b.title : null, bg: b ? b.style.background : null, display: b ? b.style.display : null, ...(extra || {}) });
  };
  const b0 = badge();
  if (!b0) return { armed: false, reason: "không thấy badge lúc gắn hook" };
  rec("hook-installed");
  const obs = new MutationObserver((muts) => {
    for (const m of muts) rec("mutation", { mutType: m.type, attr: m.attributeName || null });
  });
  obs.observe(b0, { childList: true, characterData: true, attributes: true, subtree: true });
  if (b0.parentNode) obs.observe(b0.parentNode, { childList: true, subtree: false });
  window.__d5FlipObs = obs;
  window.__d5LastPollText = b0.textContent;
  window.__d5FlipPoll = setInterval(() => {
    const b = badge();
    const txt = b ? b.textContent : null;
    if (txt !== window.__d5LastPollText) {
      window.__d5LastPollText = txt;
      rec("poll");
    }
  }, 50);
  return { armed: true, textAtInstall: b0.textContent };
})`;
// Bấm Phát trong trang để timestamp click cùng đồng hồ với log.
const CLICK_PLAY_INPAGE_FN = `
(() => {
  const b = [...document.querySelectorAll("button")].find((x) => ["Phát (Space)", "Play (Space)", "Tạm dừng (Space)", "Pause (Space)"].includes(x.getAttribute("aria-label") || ""));
  if (!b) return { clicked: false };
  const tMs = performance.now();
  const badge = document.querySelector(".preview-reverse-engine-badge");
  const textBefore = badge ? badge.textContent : null;
  b.click();
  window.__d5FlipLog.push({ tMs, kind: "click-play", text: textBefore, title: badge ? badge.title : null, bg: badge ? badge.style.background : null, display: badge ? badge.style.display : null });
  return { clicked: true, tMs, textBefore };
})`;
// Seed 1 asset + 1 clip reverse. kind "good" = flat thật qua /media/flat.mp4,
// kind "broken" = byte rác qua /media/broken.mp4. Trả assetId.
const SEED_FN = `
(async (kind) => {
  const url = kind === "broken" ? "/media/broken.mp4" : "/media/flat.mp4";
  const buf = await (await fetch(url)).arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const sha = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const assetId = "a_" + sha.slice(0, 16);
  const blob = new Blob([buf], { type: "video/mp4" });
  await new Promise((resolve, reject) => {
    const req = indexedDB.open("vcut-studio-assets", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("manifests")) {
        const s = db.createObjectStore("manifests", { keyPath: "assetId" });
        s.createIndex("bySha256", "sha256", { unique: true });
      }
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(["manifests", "blobs"], "readwrite");
      tx.objectStore("manifests").put({ assetId, originalName: kind === "broken" ? "broken-c6.mp4" : "flat-c6.mp4", sha256: sha, size: buf.byteLength, mimeType: "video/mp4", kind: "video", width: 1280, height: 720, duration: 10, ingestedAt: new Date().toISOString(), refCount: 1 });
      tx.objectStore("blobs").put(blob, assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
  const spec = { version: "0.2.0", meta: { name: "c6-compat-" + kind, width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "c1", src: "asset:" + assetId, start: 0, duration: 10, in: 0, out: 10, reverse: true }] }] };
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "c6-compat-" + kind, spec, session: { playhead: 0 } };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(env));
  return { assetId, sha, bytes: buf.byteLength, kind };
})`;

async function main() {
  const loadBefore = loadavg();
  fs.mkdirSync(opts.scratch, { recursive: true });
  const indexHtml = fs.readFileSync(path.join(opts.dist, "index.html"), "utf8");
  const bundle = (indexHtml.match(/\/assets\/(index-[^"']+\.js)/) || [])[1] ?? null;
  console.log(`[d5flip] dist bundle=${bundle} loadBefore=${loadBefore}`);
  const appServer = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${opts.port}`).pathname);
      if (urlPath === "/media/flat.mp4") { const f = fs.readFileSync(opts.flat); res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": f.length, "Accept-Ranges": "bytes" }); res.end(f); return; }
      if (urlPath === "/media/broken.mp4") { res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": BROKEN.length, "Accept-Ranges": "bytes" }); res.end(BROKEN); return; }
      if (urlPath === "/sw.js") { res.writeHead(404, { "Cache-Control": "no-store" }); res.end(); return; }
      let file = urlPath === "/" ? path.join(opts.dist, "index.html") : path.join(opts.dist, urlPath);
      if (!file.startsWith(opts.dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(opts.dist, "index.html");
      const ext = path.extname(file);
      res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch { try { res.writeHead(500); res.end(); } catch {} }
  });
  await new Promise((res) => appServer.listen(opts.port, "127.0.0.1", res));
  console.log(`[d5flip] app server http://127.0.0.1:${opts.port}`);
  const num = opts.display.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    const { spawnSync } = await import("node:child_process");
    const ps = spawnSync("sh", ["-c", `ps aux | grep -E "Xvfb ${opts.display} " | grep -v grep`], { encoding: "utf8" });
    if (!ps.stdout || !ps.stdout.trim()) { try { fs.unlinkSync(sock); } catch {} }
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [opts.display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) { console.error("BLOCKER: Xvfb không tạo socket"); process.exit(2); }
  } else console.log(`[d5flip] Xvfb: dùng chung display ${opts.display}`);
  const chromeBin = fs.existsSync(CHROME) ? CHROME : (fs.existsSync(META_CHROME) ? META_CHROME : null);
  if (!chromeBin) { console.error("BLOCKER: không tìm thấy Chrome"); process.exit(2); }
  const chrome = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required", "--disable-gpu",
    `--user-data-dir=${opts.scratch}/chrome-profile`, "--window-size=1280,800", "--window-position=0,0",
    "about:blank"],
    { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: opts.display } });
  chrome.stdout?.on("data", () => {});
  chrome.stdio[2].on("data", (c) => { try { fs.appendFileSync(path.join(opts.scratch, "chrome-stderr.log"), c); } catch {} });
  chrome.stdio[2].on("error", () => {});
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} try { appServer.close(); } catch {} };
  const checks = [];
  const check = (name, cond, detail) => { checks.push({ name, pass: !!cond, detail }); console.log(`[${stamp()}] ${cond ? "PASS" : "FAIL"} ${name} ${detail !== undefined ? JSON.stringify(detail).slice(0, 600) : ""}`); };
  try {
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, cdp.sessionId);
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    const ev = (expr) => cdp.evaluate(expr);
    const scrubToSeconds = async (sec) => ev(`(() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const rect = el.getBoundingClientRect(); const x = rect.left + ${Math.round(sec * 60)}; const y = rect.top + rect.height / 2; el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); el.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); return { x, sec: ${sec} }; })()`);
    const waitReady = async () => {
      let ready = null;
      for (let i = 0; i < 30; i++) {
        await sleep(2000);
        ready = await ev(`(()=>({rs:document.readyState, rootChildren:document.getElementById("root")?.children.length ?? -1}))()`);
        if (ready.rs === "complete" && ready.rootChildren > 0) break;
      }
      return ready;
    };
    const waitSleeping = async (maxMs) => {
      const t0 = Date.now();
      while (Date.now() - t0 < maxMs) {
        const s = await ev(IDLE_JS);
        if (s && s.sleeping) return s;
        await sleep(500);
      }
      return ev(IDLE_JS);
    };
    // Poll badge tới khi thỏa điều kiện, nudge-scrub mỗi 6 s để ép tick
    // (vòng lặp ngủ lúc pause). Trả {badge, timeline, nudges}.
    const pollBadge = async (label, cond, maxSec) => {
      const timeline = []; let nudges = 0; const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < maxSec * 1000) {
        const b = await ev(BADGE_JS);
        const key = b ? `${b.display}|${b.text}` : "null";
        if (key !== last) { timeline.push({ atSec: +((Date.now() - t0) / 1000).toFixed(1), badge: b }); last = key; }
        if (b && cond(b)) return { badge: b, timeline, nudges, waitedSec: +((Date.now() - t0) / 1000).toFixed(1) };
        if (Date.now() - t0 > (nudges + 1) * 6000) { nudges++; await scrubToSeconds(5 + (nudges % 2 ? 0.2 : -0.2)); }
        await sleep(1000);
      }
      return { badge: await ev(BADGE_JS), timeline, nudges, waitedSec: +((Date.now() - t0) / 1000).toFixed(1), timeout: true };
    };

    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${opts.port}/` }, cdp.sessionId);
    console.log(`[d5flip] app ready: ${JSON.stringify(await waitReady())}`);

    // ---------- D5: footage hỏng, hook bắt flip WEBCODECS -> failed ----------
    // Seed broken (như phase B C6), reload, scrub 5 để badge hiện
    // WEBCODECS lúc pause, gắn hook TRONG TRANG, rồi bấm Phát và đọc log.
    const seedB = await ev(`(${SEED_FN})("broken")`).catch((e) => ({ error: String(e?.message ?? e) }));
    console.log(`[d5flip] seed B: ${JSON.stringify(seedB)}`);
    if (seedB.error) throw new Error(`seed B thất bại: ${seedB.error}`);
    await ev(`location.reload()`);
    console.log(`[d5flip] B sau reload: ${JSON.stringify(await waitReady())}`);
    const settleB = await waitSleeping(60000);
    console.log(`[d5flip] B settle: ${JSON.stringify(settleB)}`);
    await scrubToSeconds(5);
    // Chờ badge hiện WEBCODECS lúc pause (tiền đề: controller chưa fail
    // khi pause vì stepping=false — bài học C6 compat1).
    let badgeBeforeHook = null;
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      badgeBeforeHook = await ev(BADGE_JS);
      if (badgeBeforeHook && badgeBeforeHook.display === "block" && badgeBeforeHook.text === VI.reverseEngine.badgeWebcodecs) break;
    }
    console.log(`[d5flip] badge trước hook: ${JSON.stringify(badgeBeforeHook)}`);
    check("flip-badge-webcodecs-before-play", badgeBeforeHook && badgeBeforeHook.text === VI.reverseEngine.badgeWebcodecs && badgeBeforeHook.display === "block", badgeBeforeHook);
    // Hook trong trang: MutationObserver (badge + parent) + poll 50 ms.
    const hook = await ev(`(${HOOK_INSTALL_FN})()`);
    console.log(`[d5flip] hook: ${JSON.stringify(hook)}`);
    check("flip-hook-installed", hook && hook.armed === true, hook);
    await sleep(500);
    const playBtnB = await ev(PLAY_BTN_JS);
    check("flip-play-button-found", !!playBtnB, playBtnB);
    // Bấm Phát TRONG TRANG để timestamp click cùng đồng hồ performance.now()
    // với log mutation/poll (không lệch do round-trip CDP).
    const clicked = await ev(`(${CLICK_PLAY_INPAGE_FN})()`);
    console.log(`[d5flip] click Phát: ${JSON.stringify(clicked)}`);
    check("flip-play-clicked", clicked && clicked.clicked === true, clicked);
    // Chờ badge lật sang failed (poll ngoài mỗi 250 ms chỉ để biết khi nào
    // dừng — thời gian flip lấy từ log trong trang, không lấy từ poll ngoài).
    let badgeFailed = null;
    const tPoll0 = Date.now();
    while (Date.now() - tPoll0 < 30000) {
      const b = await ev(BADGE_JS);
      if (b && b.display === "block" && b.text === VI.reverseEngine.badgeElementFailed) { badgeFailed = b; break; }
      await sleep(250);
    }
    console.log(`[d5flip] badge failed: ${JSON.stringify(badgeFailed)} (poll ngoài ${((Date.now() - tPoll0) / 1000).toFixed(1)}s)`);
    check("flip-badge-failed-vi", badgeFailed && badgeFailed.text === VI.reverseEngine.badgeElementFailed && badgeFailed.display === "block", badgeFailed);
    check("flip-badge-title-vi", badgeFailed && badgeFailed.title === VI.reverseEngine.titleElementFailed, badgeFailed?.title);
    await sleep(1000);
    const flipLog = await ev(`(() => { try { clearInterval(window.__d5FlipPoll); } catch {} try { window.__d5FlipObs?.disconnect(); } catch {} return window.__d5FlipLog ?? null; })()`);
    // Phân tích log trong Node: mốc click, mốc failed đầu tiên (mutation
    // hoặc poll), các trạng thái trung gian theo thứ tự.
    const analysis = (() => {
      if (!Array.isArray(flipLog)) return { error: "không đọc được flip log" };
      const click = flipLog.find((e) => e.kind === "click-play");
      const failedEntries = flipLog.filter((e) => e.text === VI.reverseEngine.badgeElementFailed);
      const firstFailed = failedEntries[0] ?? null;
      const preClick = flipLog.filter((e) => click && e.tMs <= click.tMs);
      const between = click ? flipLog.filter((e) => e.tMs > click.tMs && (!firstFailed || e.tMs < firstFailed.tMs)) : [];
      const distinctBetween = [...new Set(between.map((e) => e.text))];
      return {
        logEntries: flipLog.length,
        clickTms: click?.tMs ?? null,
        clickText: click?.text ?? null,
        firstFailedTms: firstFailed?.tMs ?? null,
        firstFailedKind: firstFailed?.kind ?? null,
        flipDelayMs: click && firstFailed ? +(firstFailed.tMs - click.tMs).toFixed(1) : null,
        preClickLastText: preClick.length ? preClick[preClick.length - 1].text : null,
        intermediateTexts: distinctBetween,
        intermediateCount: between.length,
        mutationCount: flipLog.filter((e) => e.kind === "mutation").length,
        pollCount: flipLog.filter((e) => e.kind === "poll").length,
      };
    })();
    console.log(`[d5flip] analysis: ${JSON.stringify(analysis)}`);
    check("flip-observed-in-log", analysis.firstFailedTms !== null && analysis.clickTms !== null, analysis);
    check("flip-delay-le-10s", analysis.flipDelayMs !== null && analysis.flipDelayMs <= 10000, analysis.flipDelayMs);
    check("flip-intermediate-webcodecs-first", analysis.preClickLastText === VI.reverseEngine.badgeWebcodecs, analysis.preClickLastText);
    const alive = await ev(`(()=>({onePlusOne:1+1, rs:document.readyState}))()`);
    check("app-alive-after", alive && alive.onePlusOne === 2, alive);

    const evidence = {
      runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port,
      appBundle: bundle, loadBefore, loadAfter: loadavg(),
      loadCondition: "under-load: phiên chạy cùng các luồng đợt 48 khác",
      seedB, badgeBeforeHook, hook, clicked, badgeFailed, analysis,
      flipLog: Array.isArray(flipLog) ? flipLog : null,
      checks: checks.map((c) => ({ name: c.name, pass: c.pass })),
      scope: "COMPAT-FLIP: mốc trung gian WEBCODECS -> failed của badge reverse trong app đầy đủ, bắt bằng MutationObserver + poll 50 ms TRONG TRANG (cùng đồng hồ performance.now() với cú bấm Phát). Footage hỏng 64 KiB byte rác xác định. Badge từng track vẫn 1 badge toàn cục (không tách).",
    };
    fs.writeFileSync(path.join(opts.scratch, "compat-flip-evidence.json"), JSON.stringify(evidence, null, 2));
    console.log(`[d5flip] evidence → ${path.join(opts.scratch, "compat-app-evidence.json")}`);
    const failed = checks.filter((c) => !c.pass);
    console.log(`[d5flip] ${checks.length - failed.length}/${checks.length} PASS`);
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    cleanup();
  }
  process.exit(process.exitCode ?? 0);
}
main().catch((e) => { console.error(`BLOCKER: ${e.message}`); process.exit(2); });
