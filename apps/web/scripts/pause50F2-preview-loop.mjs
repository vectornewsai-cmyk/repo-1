// pause50F2-preview-loop.mjs — Phase 9 đợt 50, luồng F2: đối chứng
// headed vòng lặp preview trước/sau sửa §7.6 (early-return ctx) + §7.7
// (footage không decode được quay ~19 tick/s 30–40 s mới ngủ).
//
// Chạy từ gốc repo (dist đã build sẵn từ source cần đo — KHÔNG dùng
// apps/web/dist đóng băng):
//   node apps/web/scripts/pause50F2-preview-loop.mjs [/tmp/f2-baseline-dist|/tmp/f2-app-dist] [D,E,C,A,B]
// Script tự: serve dist scratch + media ở /tmp, bật Xvfb riêng +
// Chromium Playwright (chromium-1248) qua CDP pipe, seed project qua
// IndexedDB + localStorage autosave (mẫu harness43 Y2 / C3), scrub qua
// .tl-ruler, poll window.__vcutPreviewIdle, in JSON kết quả.
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / OBSERVED.
//
// Các phase (một tab, chạy nối tiếp, mỗi phase seed lại project của nó):
//   D (control valid-gop): scrub 2.5 → phải vẽ được + ngủ nhanh, không
//     cạn cap nào (đối chứng: sửa §7.7 không phá đường vẽ thường).
//   E (pause/play): scrub 0.5 → ngủ → Space phát → ticks tăng → Space
//     tạm dừng → ngủ lại (đối chứng: sửa §7.6 không phá ngữ nghĩa
//     ngủ/đánh thức ở đường thường).
//   C (§7.7 garbage): seed garbage.mp4 (không decode được), scrub 2.5,
//     poll tới khi ngủ (tối đa 120 s), ghi quỹ đạo: ticks/s lúc quay,
//     thời gian tới khi ngủ, pauseRetrySkipped + cờ cạn lúc ngủ.
//     Baseline (trước sửa): ngủ sau ~30–40 s, skipped = 600 (cap W2).
//     Sau sửa (wall cap 10 s): ngủ sau ~10–12 s, skipped < 600, cờ
//     wall = true. Phase này là OBSERVED + số đo, không FAIL chỉ vì
//     chậm — FAIL chỉ khi không ngủ trong 120 s.
//   A (canvas bị gỡ khỏi document): gỡ node .preview-canvas, scrub 2.0
//     để đánh thức, poll 10 s — vòng lặp phải CÒN SỐNG (ticks tăng
//     hoặc ngủ sạch), FAIL chỉ khi chết cứng (ticks đứng yên mà
//     sleeping = false). Lưu ý: gỡ node DOM không null được canvasRef
//     của React nên phase này KHÔNG chạm được nhánh `!canvas` trong
//     tickInner — nhánh đó được khóa bằng unit test previewLoopShouldSleep
//     (surfaceMissing → không ngủ); phase này chỉ khóa tính sống của
//     vòng lặp khi canvas rời document.
//   B (§7.6 ctx null): override getContext("2d") → null trước khi app
//     load (Page.addScriptToEvaluateOnNewDocument), reload, poll ticks
//     2 lần cách nhau 3 s. TRƯỚC SỬA: ticks đóng băng (early-return
//     `if (!ctx) return;` không đặt lịch, sleeping false, wake no-op
//     → vòng lặp chết) → FAIL. SAU SỬA: ticks tăng, sleeping false
//     (wrapper loop đặt lịch lại) → PASS.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const DIST = process.argv[2] || "/tmp/f2-baseline-dist";
const PHASES = (process.argv[3] || "D,E,C,A,B").split(",").map((s) => s.trim().toUpperCase());
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const SCRATCH = "/tmp/pause50f2-looploop-" + process.pid;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.F2_APP_DISPLAY || pickFreeDisplay();
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
  if (!fs.existsSync(path.join(DIST, "index.html"))) fail("chưa có dist scratch " + DIST + " — chạy vite build --outDir <dist> trước");
  if (!DISPLAY) fail("không còn display trống trong :90-:99");
  fs.mkdirSync(SCRATCH, { recursive: true });
  for (const f of ["valid-gop.mp4", "garbage.mp4"]) {
    fs.copyFileSync(path.join(Y2_MEDIA, f), path.join(SCRATCH, f));
  }
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
      : file.endsWith(".json") ? "application/json" : file.endsWith(".mp4") ? "video/mp4" : file.endsWith(".webmanifest") ? "application/manifest+json" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://127.0.0.1:" + server.address().port;
  log("app server tại " + ORIGIN + " dist " + DIST + " display " + DISPLAY + " phases " + PHASES.join(","));

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
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, sid);
    await sleep(4000);
    const ev = (expr) => cdp.evaluate(expr, sid);
    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 900)); };

    async function snapshot() {
      return ev(`(() => { const i = window.__vcutPreviewIdle; const h = window.__vcutHoldStats; return i ? { ticks: i.ticks, sleeping: i.sleeping, lastDrawn: i.lastDrawn, lastRequested: i.lastRequested, pendingSeek: i.pendingSeek, seekFailureCount: i.seekFailureCount, seekFailureExhausted: i.seekFailureExhausted, seekFailureKind: i.seekFailureKind, pauseRetrySkipped: i.pauseRetrySkipped, pauseRetryExhausted: i.pauseRetryExhausted, pauseRetryWallExhausted: (typeof i.pauseRetryWallExhausted === "boolean" ? i.pauseRetryWallExhausted : null), tickErrors: i.tickErrors, holdDraw: h ? h.draw : null, holdSkip: h ? h.skip : null } : null; })()`);
    }
    async function scrubToSeconds(sec) {
      return ev(`(() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const rect = el.getBoundingClientRect(); const x = rect.left + ${Math.round(sec * 60)}; const y = rect.top + rect.height / 2; el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); el.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); return { x, rectLeft: rect.left, sec: ${sec} }; })()`);
    }
    // Poll có lấy mẫu quỹ đạo (mỗi 500 ms) tới khi ngủ ổn định 3 s
    // hoặc hết maxMs. Trả { samples, sleptAtSec|null }.
    async function pollToSleep(maxMs, label) {
      const samples = [];
      const t0 = Date.now();
      let sleepSince = null;
      let sleptAtSec = null;
      while (Date.now() - t0 < maxMs) {
        const s = await snapshot();
        if (s) {
          const tSec = +((Date.now() - t0) / 1000).toFixed(1);
          samples.push({ t: tSec, ...s });
          if (s.sleeping) {
            if (sleepSince === null) { sleepSince = Date.now(); sleptAtSec = tSec; }
            else if (Date.now() - sleepSince >= 3000) break;
          } else sleepSince = null;
        }
        await sleep(500);
      }
      log(label + ": " + samples.length + " mẫu, cuối: " + JSON.stringify(samples[samples.length - 1] ?? null));
      return { samples, sleptAtSec };
    }

    // Seed project (mẫu harness43 Y2 / C3, giữ nguyên DB/key/spec format).
    async function seedProject(variantFile) {
      const seedFn = `
(async () => {
  const file = ${JSON.stringify(variantFile)};
  const buf = await (await fetch("/media/" + file)).arrayBuffer();
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
      tx.objectStore("manifests").put({ assetId, originalName: file, sha256: sha, size: buf.byteLength, mimeType: "video/mp4", kind: "video", width: 640, height: 360, duration: 3, ingestedAt: new Date().toISOString(), refCount: 1 });
      tx.objectStore("blobs").put(blob, assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
  const spec = { version: "0.2.0", meta: { name: "f2-seed", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "c1", src: "asset:" + assetId, start: 0, duration: 3, in: 0, out: 3 }] }] };
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "f2-seed", spec, session: { playhead: 2 } };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(env));
  return { assetId, sha, bytes: buf.byteLength };
})()`;
      const seed = await ev(seedFn).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
      log("seed " + variantFile + ": " + JSON.stringify(seed));
      await ev(`location.reload()`);
      await sleep(4000);
      return seed;
    }

    const out = { dist: DIST, phases: PHASES, checks };

    // ---- Phase D: control valid-gop ----
    if (PHASES.includes("D")) {
      const seed = await seedProject("valid-gop.mp4");
      const s25 = await scrubToSeconds(2.5);
      const { samples, sleptAtSec } = await pollToSleep(60000, "D-valid-2.5");
      const last = samples[samples.length - 1] ?? null;
      const ok = !!last && last.lastDrawn === 2.5 && last.sleeping === true
        && last.pauseRetryExhausted !== true && last.seekFailureExhausted !== true;
      check("F2-D-valid-2.5-drawn-sleeps", ok ? "PASS" : "FAIL",
        { scrub: s25, sleptAtSec, last, seed });
      out.samplesD = samples;
    }

    // ---- Phase E: pause/play (trên project valid-gop của phase D) ----
    if (PHASES.includes("E")) {
      if (!PHASES.includes("D")) await seedProject("valid-gop.mp4");
      const s05 = await scrubToSeconds(0.5);
      const r05 = await pollToSleep(30000, "E-0.5-settle");
      const last05 = r05.samples[r05.samples.length - 1] ?? null;
      let playDetail = { scrub05: s05, last05 };
      if (last05 && last05.sleeping === true) {
        await ev(`window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true, cancelable: true }))`);
        await sleep(1000);
        const a = await snapshot();
        await sleep(2000);
        const b = await snapshot();
        const grew = !!a && !!b && b.ticks > a.ticks;
        playDetail = { ...playDetail, ticksBeforePlay: a, ticksAfter2s: b, grew };
        check("F2-E-play-ticks-grow", grew ? "PASS" : "FAIL", playDetail);
        await ev(`window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true, cancelable: true }))`);
        const rPause = await pollToSleep(30000, "E-pause-settle");
        const lastPause = rPause.samples[rPause.samples.length - 1] ?? null;
        check("F2-E-pause-sleeps-again", lastPause && lastPause.sleeping === true ? "PASS" : "FAIL",
          { sleptAtSec: rPause.sleptAtSec, last: lastPause });
        out.samplesE = r05.samples.concat(rPause.samples);
      } else {
        check("F2-E-play-ticks-grow", "NOT_MEASURED", { reason: "khong ngu duoc o 0.5 truoc khi phat", ...playDetail });
        check("F2-E-pause-sleeps-again", "NOT_MEASURED", { reason: "khong ngu duoc o 0.5 truoc khi phat", ...playDetail });
      }
    }

    // ---- Phase C: §7.7 garbage (không decode được) ----
    if (PHASES.includes("C")) {
      const seed = await seedProject("garbage.mp4");
      const pre = await snapshot();
      const tScrub = Date.now();
      const s25 = await scrubToSeconds(2.5);
      const { samples, sleptAtSec } = await pollToSleep(120000, "C-garbage-2.5");
      const last = samples[samples.length - 1] ?? null;
      // ticks/s lúc quay: cửa sổ từ mẫu đầu sau scrub tới mẫu cuối chưa ngủ.
      const spinning = samples.filter((s) => !s.sleeping);
      let ticksPerSec = null;
      if (spinning.length >= 2) {
        const f = spinning[0]; const l = spinning[spinning.length - 1];
        if (l.t > f.t) ticksPerSec = +((l.ticks - f.ticks) / (l.t - f.t)).toFixed(1);
      }
      const slept = !!last && last.sleeping === true;
      const detail = { scrub: s25, preScrub: pre, sleptAtSec,
        wallSecToSleep: sleptAtSec, ticksPerSec,
        last, spinningSamples: spinning.length,
        tailSpinning: spinning.slice(-3) };
      check("F2-C-garbage-sleeps", slept ? "OBSERVED" : "FAIL", detail);
      out.samplesC = samples;
      out.metricsC = { ticksPerSec, sleptAtSec, skippedAtSleep: last ? last.pauseRetrySkipped : null,
        exhaustedAtSleep: last ? last.pauseRetryExhausted : null,
        wallAtSleep: last ? last.pauseRetryWallExhausted : null, seed };
    }

    // ---- Phase A: canvas bị gỡ khỏi document ----
    if (PHASES.includes("A")) {
      const removed = await ev(`(() => { const c = document.querySelector(".preview-canvas"); if (!c) return { removed: false, reason: "khong thay canvas" }; c.remove(); return { removed: true, stillInDoc: !!document.querySelector(".preview-canvas") }; })()`);
      const s20 = await scrubToSeconds(2.0);
      const t0 = await snapshot();
      await sleep(4000);
      const t1 = await snapshot();
      // Chết cứng = ticks đứng yên MÀ sleeping = false. Ngủ sạch
      // (sleeping true) hoặc ticks tăng đều là vòng lặp còn sống.
      const dead = !!t0 && !!t1 && t1.ticks === t0.ticks && t1.sleeping === false;
      check("F2-A-canvas-removed-loop-alive", dead ? "FAIL" : "PASS",
        { removed, scrub20: s20, ticksBefore: t0, ticksAfter4s: t1 });
      await ev(`location.reload()`);
      await sleep(3000);
    }

    // ---- Phase B: §7.6 getContext("2d") → null ----
    if (PHASES.includes("B")) {
      const scriptId = await cdp.send("Page.addScriptToEvaluateOnNewDocument",
        { source: `const __f2gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...a) { if (type === "2d") return null; return __f2gc.call(this, type, ...a); };` }, sid);
      await ev(`location.reload()`);
      await sleep(4000);
      const b0 = await snapshot();
      await sleep(3000);
      const b1 = await snapshot();
      const alive = !!b0 && !!b1 && b1.ticks > b0.ticks && b1.sleeping === false;
      check("F2-B-noctx-loop-alive", alive ? "PASS" : "FAIL",
        { ticksAt1s: b0, ticksAt4s: b1, scriptId: scriptId.identifier ?? null });
      try { await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId.identifier }, sid); } catch {}
      await ev(`location.reload()`);
      await sleep(2000);
    }

    console.log(JSON.stringify(out, null, 2));
    process.exit(checks.some((c) => c.status === "FAIL") ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
