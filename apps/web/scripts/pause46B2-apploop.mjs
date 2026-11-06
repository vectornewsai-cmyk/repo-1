// pause46B2-apploop.mjs — Phase 9 đợt 46, luồng B2: bằng chứng vòng
// lặp preview ĐẦY ĐỦ trong app thật cho 3 sửa Z2 (nợ A2 §5.2).
//
// Chạy từ gốc repo (dist đã build sẵn ra /tmp/b2-app-dist từ source
// hiện tại — KHÔNG dùng apps/web/dist đóng băng):
//   node apps/web/scripts/pause46B2-apploop.mjs <broken-gap|valid-gop>
// Script tự: serve dist scratch + media ở /tmp, bật Xvfb riêng +
// Chromium Playwright (chromium-1248) qua CDP pipe, seed project qua
// IndexedDB + localStorage autosave (mẫu harness43 Y2: DB
// "vcut-studio-assets", key "vcut-studio:autosave:v1"), scrub qua
// .tl-ruler, poll window.__vcutPreviewIdle, in JSON kết quả.
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / NOT_MEASURED /
// OBSERVED. Không đo được thì ghi rõ lý do, không bịa PASS.
//
// Luồng đo (variant broken-gap):
//   1. Settle → scrub tới 1,5 (GOP hỏng) → poll tới khi cạn cap seek
//      (seekFailureExhausted) + ngủ: chứng minh đường timeout → cap
//      X2 → phục hồi Y2 (seekElementRecreated ≥ 1, cùng hunk gọi
//      releaseElement của Z2) chạy trong app thật.
//   2. Scrub về đúng lastDrawn lúc cạn cap → poll tới khi ngủ với
//      lastRequested == playhead (đường ngủ thường qua guard Z2):
//      chứng minh guard scrub trong app thật, không chỉ mức helper.
//   3. Scrub tới 2,5 (target quirk): OBSERVED — quirk không tái hiện
//      ở mức element nên kỳ vọng app vẽ được 2,5; nếu app fail nhanh
//      thì đó mới là bằng chứng fail-fast trong app (ghi đúng cái đo).
// Variant valid-gop là đối chứng: scrub 1,5 phải vẽ được, không cạn cap.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const VARIANT = process.argv[2] || "broken-gap";
if (!["broken-gap", "valid-gop"].includes(VARIANT)) { console.error("usage: pause46B2-apploop.mjs <broken-gap|valid-gop>"); process.exit(2); }
const DIST = "/tmp/b2-app-dist";
const SCRATCH = "/tmp/pause46b2-apploop-" + process.pid;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const MEDIA_DIR = path.join("/tmp", fs.readdirSync("/tmp").filter((d) => d.startsWith("pause46b2-headed-")).sort().pop() || "");
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.B2_APP_DISPLAY || pickFreeDisplay();
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
  if (!fs.existsSync(path.join(DIST, "index.html"))) fail("chưa có dist scratch /tmp/b2-app-dist — chạy vite build --outDir /tmp/b2-app-dist trước");
  if (!DISPLAY) fail("không còn display trống trong :90-:99");
  const mediaFile = path.join(MEDIA_DIR, VARIANT + ".mp4");
  if (!fs.existsSync(mediaFile)) fail("không có media " + mediaFile + " — chạy pause46B2-headed.mjs trước để tạo fixture");
  const server = http.createServer((req, res) => {
    let file;
    if (req.url.startsWith("/media/")) file = path.join(MEDIA_DIR, decodeURIComponent(req.url.slice(7)));
    else file = path.join(DIST, req.url === "/" ? "index.html" : decodeURIComponent(req.url.slice(1)));
    if (!file.startsWith(DIST) && !file.startsWith(MEDIA_DIR)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      // SPA fallback: mọi route không phải file → index.html (trừ /media).
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
  log("app server tại " + ORIGIN + " variant " + VARIANT + " display " + DISPLAY);

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
    fs.mkdirSync(SCRATCH, { recursive: true });
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

    async function snapshot() {
      return ev(`(() => { const i = window.__vcutPreviewIdle; const h = window.__vcutHoldStats; return i ? { ticks: i.ticks, sleeping: i.sleeping, lastDrawn: i.lastDrawn, lastRequested: i.lastRequested, pendingSeek: i.pendingSeek, seekFailureCount: i.seekFailureCount, seekFailureExhausted: i.seekFailureExhausted, seekFailureKind: i.seekFailureKind, seekFailureTarget: i.seekFailureTarget, seekElementRecreated: (typeof i.seekElementRecreated === "number" ? i.seekElementRecreated : null), seekRecreatedSeeking: (typeof i.seekRecreatedSeeking === "number" ? i.seekRecreatedSeeking : null), pauseRetrySkipped: i.pauseRetrySkipped, pauseRetryExhausted: i.pauseRetryExhausted, holdDraw: h ? h.draw : null, holdSkip: h ? h.skip : null } : null; })()`);
    }
    async function scrubToSeconds(sec) {
      return ev(`(() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const rect = el.getBoundingClientRect(); const x = rect.left + ${Math.round(sec * 60)}; const y = rect.top + rect.height / 2; el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); el.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); return { x: x, rectLeft: rect.left, sec: ${sec} }; })()`);
    }
    async function waitSleeping(maxMs) {
      const t0 = Date.now();
      while (Date.now() - t0 < maxMs) {
        const s = await snapshot();
        if (s && s.sleeping) return s;
        await sleep(500);
      }
      return snapshot();
    }

    // Seed project (mẫu harness43 Y2, giữ nguyên DB/key/spec format).
    const seedFn = `
(async () => {
  const file = ${JSON.stringify(VARIANT + ".mp4")};
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
  const spec = { version: "0.2.0", meta: { name: "b2-seed", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "c1", src: "asset:" + assetId, start: 0, duration: 3, in: 0, out: 3 }] }] };
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "b2-seed", spec, session: { playhead: 2 } };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(env));
  return { assetId, sha, bytes: buf.byteLength };
})()`;
    const seed = await ev(seedFn).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
    log("seed: " + JSON.stringify(seed));
    await ev(`location.reload()`);
    await sleep(3000);
    const settle = await waitSleeping(30000);
    log("settle: " + JSON.stringify(settle));
    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 800)); };
    if (!settle) {
      check("APP-loop", "NOT_MEASURED", { reason: "khong doc duoc __vcutPreviewIdle sau seed+reload (app co the doi UI/seed format)", seed });
      console.log(JSON.stringify({ variant: VARIANT, seed, checks }, null, 2));
      process.exit(0);
    }
    if (VARIANT === "valid-gop") {
      const s1 = await scrubToSeconds(1.5);
      await sleep(1000);
      const after = await waitSleeping(30000);
      const ok = after && after.lastDrawn === 1.5 && after.sleeping === true && after.seekFailureExhausted !== true;
      check("APP-valid-control-1.5-drawn", ok ? "PASS" : "FAIL", { scrub: s1, after });
      console.log(JSON.stringify({ variant: VARIANT, seed, settle, checks }, null, 2));
      process.exit(checks.some((c) => c.status === "FAIL") ? 1 : 0);
    }
    // broken-gap: scrub tới 1,5 (GOP hỏng) → poll tới cạn cap + ngủ.
    const sBad = await scrubToSeconds(1.5);
    await sleep(1000);
    const afterBad = await snapshot();
    log("afterBadScrub: " + JSON.stringify(afterBad));
    const samples = [];
    const t0 = Date.now();
    let exhaustedAt = null;
    while (Date.now() - t0 < 120000) {
      const s = await snapshot();
      if (s) {
        samples.push({ t: +((Date.now() - t0) / 1000).toFixed(1), ...s });
        if (s.seekFailureExhausted && s.sleeping && exhaustedAt === null) exhaustedAt = (Date.now() - t0) / 1000;
        if (exhaustedAt !== null && (Date.now() - t0) / 1000 - exhaustedAt >= 5) break;
      }
      await sleep(500);
    }
    const exhaustedSnap = samples[samples.length - 1] ?? null;
    const capOk = exhaustedSnap && exhaustedSnap.seekFailureExhausted === true && exhaustedSnap.sleeping === true
      && typeof exhaustedSnap.seekElementRecreated === "number" && exhaustedSnap.seekElementRecreated >= 1;
    check("APP-broken-1.5-cap-exhausted-plus-recovery", capOk ? "PASS" : "FAIL",
      { scrub: sBad, afterBad, exhaustedSnap, tailSamples: samples.slice(-6) });
    // Guard: scrub về đúng lastDrawn lúc cạn cap → phải ngủ với
    // lastRequested == playhead (đường ngủ thường qua guard Z2).
    let guardCheck = null;
    if (exhaustedSnap && typeof exhaustedSnap.lastDrawn === "number") {
      const drawn = exhaustedSnap.lastDrawn;
      const sGuard = await scrubToSeconds(drawn);
      const afterGuard = await waitSleeping(30000);
      const guardOk = afterGuard && afterGuard.sleeping === true && afterGuard.lastRequested === drawn;
      guardCheck = { scrub: sGuard, drawn, afterGuard };
      check("APP-guard-scrub-to-drawn-sleeps", guardOk ? "PASS" : "FAIL", guardCheck);
    } else {
      check("APP-guard-scrub-to-drawn-sleeps", "NOT_MEASURED", { reason: "khong co lastDrawn so o snapshot can cap", exhaustedSnap });
    }
    // Scrub tới 2,5 (target quirk): chỉ quan sát, không gate.
    const s25 = await scrubToSeconds(2.5);
    const after25 = await waitSleeping(30000);
    check("APP-broken-2.5-observed", "OBSERVED", { scrub: s25, after25 });
    console.log(JSON.stringify({ variant: VARIANT, seed, settle, afterBad, exhaustedSnap, guardCheck, after25, checks }, null, 2));
    process.exit(checks.some((c) => c.status === "FAIL") ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
