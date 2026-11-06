// pause49E4-tickguard.mjs — Phase 9 đợt 49, luồng E4: chứng minh headed
// cho 2 fix của luồng (xem docs/PHASE9_ROUND49_E4_PAUSE_LIMITS.md):
//
//  A. Load-gate sanitize sửa bug D3 M1: seed project audio clip mang
//     volumeKeyframes.keyframes: [null] qua autosave (đúng case M1 của
//     D3 — hồi đó tick chết cứng, ticks đóng băng ở 4, scrub không cứu).
//     Nay kỳ vọng: load seeded (1 clip), vòng lặp sống (ngủ sau settle),
//     scrub 2.5 vẽ được, KHÔNG có TypeError uncaught.
//  B. Bọc tick try/catch (phòng thủ chiều sâu): sau khi settle, arm lỗi
//     tổng hợp — HTMLCanvasElement.prototype.getContext ném khi tick gọi
//     trên canvas .preview-canvas (mọi tick đều đi qua đây) — trong 3 s,
//     rồi gỡ. Kỳ vọng: ticks vẫn tăng trong lúc lỗi (vòng lặp không chết),
//     idleDebug.tickErrors > 0, không có lỗi uncaught nào thoát ra ngoài,
//     sau khi gỡ + scrub 2.5 thì preview hồi phục (ngủ, lastDrawn 2.5).
//
// Chạy từ gốc repo (dist đã build sẵn ra /tmp/e4-app-dist):
//   node apps/web/scripts/pause49E4-tickguard.mjs
// Script tự: serve dist scratch + media ở /tmp, bật Xvfb riêng +
// Chromium Playwright (chromium-1248) qua CDP pipe, seed project qua
// IndexedDB + localStorage autosave (mẫu harness D3), scrub qua
// .tl-ruler, poll window.__vcutPreviewIdle, in JSON kết quả.
// Exit 1 khi có kiểm tra FAIL; exit 0 khi mọi kiểm tra PASS.

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const E4_MEDIA = "/tmp/e4-media";
const DIST = "/tmp/e4-app-dist";
const SCRATCH = "/tmp/e4-tickguard-" + process.pid;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.E4_APP_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

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
          const { resolve, reject } = this.pending.get(msg.id); this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) { try { proc.stdio[s]?.on("error", () => {}); } catch {} }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error("CDP timeout " + method)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); } catch (e) { this.pending.delete(id); clearTimeout(timer); reject(e); }
    });
  }
  async evaluate(expr, sessionId) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
}

async function main() {
  if (!fs.existsSync(CHROME)) fail("không có chrome " + CHROME);
  if (!fs.existsSync(path.join(DIST, "index.html"))) fail("chưa có dist scratch /tmp/e4-app-dist — chạy vite build --outDir /tmp/e4-app-dist trước");
  if (!fs.existsSync(path.join(E4_MEDIA, "tone3s.mp3"))) fail("không có media /tmp/e4-media/tone3s.mp3");
  if (!DISPLAY) fail("không còn display trống trong :90-:99");
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.copyFileSync(path.join(E4_MEDIA, "tone3s.mp3"), path.join(SCRATCH, "tone3s.mp3"));
  const mediaBytes = fs.readFileSync(path.join(E4_MEDIA, "tone3s.mp3"));
  const sha = crypto.createHash("sha256").update(mediaBytes).digest("hex");
  const assetId = "a_" + sha.slice(0, 16);
  // Spec M1 của D3: audio clip volumeKeyframes [null].
  const spec = {
    version: "0.2.0",
    meta: { name: "e4-m1-volkf-null", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "a1", kind: "audio", clips: [{ kind: "audio", id: "c1", src: "asset:" + assetId, start: 0, duration: 3, in: 0, out: 3, volume: 0.5, volumeKeyframes: { keyframes: [null] } }] }],
  };
  const specJson = JSON.stringify(spec);
  const server = http.createServer((req, res) => {
    let file;
    if (req.url.startsWith("/media/")) file = path.join(SCRATCH, decodeURIComponent(req.url.slice(7)));
    else file = path.join(DIST, req.url === "/" ? "index.html" : decodeURIComponent(req.url.slice(1)));
    if (!file.startsWith(DIST) && !file.startsWith(SCRATCH)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (!req.url.startsWith("/media/")) { file = path.join(DIST, "index.html"); }
      else { res.writeHead(404); res.end(); return; }
    }
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css"
      : file.endsWith(".json") ? "application/json" : file.endsWith(".mp4") ? "video/mp4" : file.endsWith(".mp3") ? "audio/mpeg" : file.endsWith(".webmanifest") ? "application/manifest+json" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://127.0.0.1:" + server.address().port;
  log("app server tại " + ORIGIN + " display " + DISPLAY);

  let xvfb = null; let chrome = null; let profileDir = null;
  const cleanup = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGTERM"); } catch {}
    try { server.close(); } catch {}
    try { if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };
  process.on("exit", cleanup);
  try {
    const num = DISPLAY.replace(":", "");
    const sock = "/tmp/.X11-unix/X" + num;
    if (fs.existsSync(sock)) fail("display " + DISPLAY + " vừa bị luồng khác chiếm");
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail("Xvfb không tạo socket");
    profileDir = path.join(SCRATCH, "chrome-profile-" + process.pid);
    chrome = spawn(CHROME, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check",
      "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required",
      "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) fail("không nhận được sessionId");
    const sid = cdp.sessionId;
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__d3errors = []; window.addEventListener("error", (e) => { if (window.__d3errors.length < 20) { const st = (e.error && e.error.stack ? String(e.error.stack) : "").split("\\n").slice(0, 6).join(" | "); window.__d3errors.push("error: " + (e.message || String(e.error || e)) + (st ? " || " + st : "")); } }); window.addEventListener("unhandledrejection", (e) => { if (window.__d3errors.length < 20) window.__d3errors.push("unhandledrejection: " + String(e.reason && e.reason.message ? e.reason.message : e.reason)); });`,
    }, sid);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, sid);
    await sleep(4000);
    const ev = (expr) => cdp.evaluate(expr, sid);

    async function snapshot() {
      return ev(`(() => { const i = window.__vcutPreviewIdle; const clips = [...document.querySelectorAll(".tl-clip")].map((e) => (e.textContent || "").slice(0, 60)); let autoName = null; try { const raw = localStorage.getItem("vcut-studio:autosave:v1"); if (raw) autoName = JSON.parse(raw).name ?? null; } catch {} return { idle: i ? { ticks: i.ticks, sleeping: i.sleeping, lastDrawn: i.lastDrawn, lastRequested: i.lastRequested, pendingSeek: i.pendingSeek, tickErrors: i.tickErrors } : null, tlClipCount: clips.length, tlClipTexts: clips, autoName, errors: window.__d3errors ? window.__d3errors.slice() : null }; })()`);
    }
    async function scrubToSeconds(sec) {
      return ev(`(() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const rect = el.getBoundingClientRect(); const x = rect.left + ${Math.round(sec * 60)}; const y = rect.top + rect.height / 2; el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); el.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); return { x, rectLeft: rect.left, sec: ${sec} }; })()`);
    }
    // Poll tới khi ngủ, hoặc ticks đóng băng 5 s liên tiếp (vòng lặp chết),
    // hoặc hết maxMs.
    async function pollTrack(maxMs, label) {
      const samples = [];
      const t0 = Date.now();
      let frozenSince = null;
      let lastTicks = null;
      while (Date.now() - t0 < maxMs) {
        const s = await snapshot();
        if (s) {
          samples.push({ t: +((Date.now() - t0) / 1000).toFixed(1), ...s });
          if (s.idle && s.idle.sleeping) break;
          if (s.idle && typeof s.idle.ticks === "number") {
            if (s.idle.ticks === lastTicks) {
              if (frozenSince === null) frozenSince = Date.now();
              else if (Date.now() - frozenSince >= 5000) break;
            } else { frozenSince = null; lastTicks = s.idle.ticks; }
          }
        }
        await sleep(500);
      }
      log(label + ": " + samples.length + " mẫu, cuối: " + JSON.stringify(samples[samples.length - 1] ?? null));
      return samples;
    }

    const seedFn = `
(async () => {
  const file = "tone3s.mp3";
  const buf = await (await fetch("/media/" + file)).arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const sha = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const assetId = "a_" + sha.slice(0, 16);
  const blob = new Blob([buf], { type: "audio/mpeg" });
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
      tx.objectStore("manifests").put({ assetId, originalName: file, sha256: sha, size: buf.byteLength, mimeType: "audio/mpeg", kind: "audio", duration: 3, ingestedAt: new Date().toISOString(), refCount: 1 });
      tx.objectStore("blobs").put(blob, assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
  const spec = ${specJson};
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "e4-m1-volkf-null", spec, session: { playhead: 2 } };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(env));
  return { assetId, sha, bytes: buf.byteLength, expectedAssetId: ${JSON.stringify(assetId)} };
})()`;
    const seed = await ev(seedFn).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
    log("seed: " + JSON.stringify(seed));
    if (seed && seed.assetId !== seed.expectedAssetId) fail("sha media trong trang khác Node — seed sai assetId");
    await ev(`location.reload()`);
    await sleep(3000);
    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 1500)); };

    // --- A. M1 regression: project [null] load + vòng lặp sống ---
    let afterLoad = await snapshot();
    {
      const t0 = Date.now();
      while (Date.now() - t0 < 20000) {
        if (afterLoad && afterLoad.tlClipCount !== 0) break;
        await sleep(500);
        afterLoad = await snapshot();
      }
    }
    const loaded = afterLoad && afterLoad.tlClipCount === 1 ? "seeded"
      : afterLoad && (afterLoad.tlClipTexts || []).some((t) => t.includes("mau-1.webm")) ? "sample" : "unknown";
    check("E4-M1-loaded", loaded === "seeded" ? "PASS" : "FAIL",
      { loaded, tlClipCount: afterLoad?.tlClipCount, tlClipTexts: afterLoad?.tlClipTexts, autoName: afterLoad?.autoName });
    const settleSamples = await pollTrack(30000, "M1-settle");
    const lastSettle = settleSamples[settleSamples.length - 1] ?? null;
    const m1Alive = lastSettle?.idle?.sleeping === true && (lastSettle?.idle?.ticks ?? 0) > 0;
    const m1NoTypeError = !(lastSettle?.errors || []).some((e) => e.includes("Cannot read properties of null"));
    check("E4-M1-loop-alive", m1Alive && m1NoTypeError ? "PASS" : "FAIL",
      { sleeping: lastSettle?.idle?.sleeping, ticks: lastSettle?.idle?.ticks, errors: lastSettle?.errors });

    // --- B. Tick-guard: lỗi tổng hợp ở getContext trong 3 s ---
    const arm = await ev(`(() => { const c = document.querySelector(".preview-canvas"); if (!c) return { armed: false, reason: "no canvas" }; window.__e4canvas = c; window.__e4fault = true; const orig = HTMLCanvasElement.prototype.getContext; window.__e4origGetContext = orig; HTMLCanvasElement.prototype.getContext = function (...args) { if (window.__e4fault && this === window.__e4canvas) throw new Error("E4 synthetic tick fault"); return orig.apply(this, args); }; return { armed: true }; })()`).catch((e) => ({ armed: false, reason: String(e) }));
    check("E4-GUARD-arm", arm && arm.armed ? "PASS" : "FAIL", arm);
    // Scrub nhẹ để đánh thức vòng lặp (đang ngủ) rồi mới đo trong lúc lỗi.
    await scrubToSeconds(1.0);
    await sleep(300);
    const faultStart = await snapshot();
    await sleep(3000);
    const faultEnd = await snapshot();
    const ticksGrew = (faultEnd?.idle?.ticks ?? 0) > (faultStart?.idle?.ticks ?? 0);
    const errorsGrew = (faultEnd?.idle?.tickErrors ?? 0) > (faultStart?.idle?.tickErrors ?? 0);
    check("E4-GUARD-ticks-grow-during-fault", ticksGrew && errorsGrew ? "PASS" : "FAIL",
      { ticksBefore: faultStart?.idle?.ticks, ticksAfter: faultEnd?.idle?.ticks, tickErrorsBefore: faultStart?.idle?.tickErrors, tickErrorsAfter: faultEnd?.idle?.tickErrors, sleepingDuringFault: faultEnd?.idle?.sleeping });
    const disarm = await ev(`(() => { window.__e4fault = false; return { disarmed: true, tickErrors: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.tickErrors : null }; })()`).catch((e) => ({ disarmed: false, reason: String(e) }));
    log("disarm: " + JSON.stringify(disarm));
    // Hồi phục: scrub 2.5 rồi poll tới khi ngủ lại.
    const s25 = await scrubToSeconds(2.5);
    const recSamples = await pollTrack(60000, "recovery-2.5");
    const lastRec = recSamples[recSamples.length - 1] ?? null;
    const recovered = lastRec?.idle?.sleeping === true && lastRec?.idle?.lastDrawn === 2.5;
    const errorsFrozenAfterDisarm = (lastRec?.idle?.tickErrors ?? 0) === (faultEnd?.idle?.tickErrors ?? 0);
    const noPageErrors = !(lastRec?.errors || []).some((e) => e.includes("E4 synthetic tick fault"));
    check("E4-GUARD-recovery", recovered && errorsFrozenAfterDisarm && noPageErrors ? "PASS" : "FAIL",
      { sleeping: lastRec?.idle?.sleeping, lastDrawn: lastRec?.idle?.lastDrawn, tickErrorsAtFaultEnd: faultEnd?.idle?.tickErrors, tickErrorsAfterRecovery: lastRec?.idle?.tickErrors, errors: lastRec?.errors, scrub: s25 });
    console.log(JSON.stringify({ seed, afterLoad, settleSamples, faultStart, faultEnd, recSamples, checks }, null, 2));
    process.exit(checks.some((c) => c.status === "FAIL") ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
