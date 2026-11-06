// pause48D3-malspec.mjs — Phase 9 đợt 48, luồng D3: săn kind "error"
// qua spec dị dạng trong app thật (đổi hướng theo C3 §4.4 / §9 mục 3:
// fixture media thật không tạo được kind "error"; thử dữ liệu spec
// dị dạng qua đường code thật).
//
// Chạy từ gốc repo (dist đã build sẵn ra /tmp/d3-app-dist từ source
// hiện tại — KHÔNG dùng apps/web/dist đóng băng):
//   node apps/web/scripts/pause48D3-malspec.mjs <case-id>
// Script tự: serve dist scratch + media ở /tmp, bật Xvfb riêng +
// Chromium Playwright (chromium-1248) qua CDP pipe, seed project qua
// IndexedDB + localStorage autosave (mẫu harness43 Y2 / apploop C3),
// scrub qua .tl-ruler, poll window.__vcutPreviewIdle, in JSON kết quả.
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / NOT_MEASURED /
// OBSERVED. Kết quả âm tính (không thấy kind "error") là OBSERVED,
// không phải FAIL của harness.
//
// Cách đọc kết quả mỗi case:
//  - loaded: "seeded" (tl-clip == 1, project d3-<case> đã load) hay
//    "sample" (tl-clip == 2, cổng load từ chối spec → App rơi về
//    project mẫu "Dự án mẫu", xem projectRepo.ts loadAutosave).
//  - loopDead: ticks đóng băng + window error ghi được (tick chết ở
//    syncMedia/collectActives trước khi seek request kịp phát — xem
//    LIMITS D3 §1.1: wake() chỉ đặt lại rAF khi sleeping=true, mà
//    tick ném thì scheduleNext không chạy nên sleeping mãi false →
//    vòng lặp chết hẳn, scrub cũng không cứu).
//  - kindsSeen: mọi seekFailureKind từng xuất hiện trong quỹ đạo.
//    PASS = thấy kind "error" (executor ném qua Seeker B2).

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CASE = process.argv[2] || "";
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const D3_MEDIA = "/tmp/d3-media";
const DIST = "/tmp/d3-app-dist";
const SCRATCH = "/tmp/d3-malspec-" + process.pid;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.D3_APP_DISPLAY || pickFreeDisplay();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

// --- Định nghĩa case: media + spec (assetId điền lúc chạy) ---------
function meta(name) {
  return { name, width: 1280, height: 720, fps: 30 };
}
function videoClip(assetId, extra = {}) {
  return { kind: "video", id: "c1", src: "asset:" + assetId, start: 0, duration: 3, in: 0, out: 3, ...extra };
}
function audioClip(assetId, extra = {}) {
  return { kind: "audio", id: "c1", src: "asset:" + assetId, start: 0, duration: 3, in: 0, out: 3, ...extra };
}
const CASES = {
  // M1: ứng viên số 1 — volumeKeyframes [null] qua cổng load (validate
  // không kiểm tra field này) rồi ném TypeError ở interpolateKeyframes.
  "m1-volkf-null": { media: "audio", spec: (id) => ({ version: "0.2.0", meta: meta("d3-m1-volkf-null"), tracks: [{ id: "a1", kind: "audio", clips: [audioClip(id, { volumeKeyframes: { keyframes: [null] } })] }] }) },
  // M2/M3: đối chứng audio volumeKeyframes rỗng / hợp lệ.
  "m2-volkf-empty": { media: "audio", spec: (id) => ({ version: "0.2.0", meta: meta("d3-m2-volkf-empty"), tracks: [{ id: "a1", kind: "audio", clips: [audioClip(id, { volumeKeyframes: { keyframes: [] } })] }] }) },
  "m3-volkf-ok": { media: "audio", spec: (id) => ({ version: "0.2.0", meta: meta("d3-m3-volkf-ok"), tracks: [{ id: "a1", kind: "audio", clips: [audioClip(id, { volumeKeyframes: { keyframes: [{ t: 0, v: 0.5, easing: "linear" }, { t: 3, v: 0.5, easing: "linear" }] } })] }] }) },
  // M4: clip trỏ asset không tồn tại (mediaByName miss → continue).
  "m4-src-dead": { media: "video", spec: () => ({ version: "0.2.0", meta: meta("d3-m4-src-dead"), tracks: [{ id: "v1", kind: "video", clips: [videoClip("0000000000000000")] }] }) },
  // M5: src rỗng → validate "thiếu src." → load reject.
  "m5-src-empty": { media: "video", spec: (id) => ({ version: "0.2.0", meta: meta("d3-m5-src-empty"), tracks: [{ id: "v1", kind: "video", clips: [videoClip(id, { src: "" })] }] }) },
  // M6: tracks null → validate "tracks phải là mảng." → load reject.
  "m6-tracks-null": { media: "video", spec: () => ({ version: "0.2.0", meta: meta("d3-m6-tracks-null"), tracks: null }) },
  // M7: clips null → validate "clips phải là mảng." → load reject.
  "m7-clips-null": { media: "video", spec: () => ({ version: "0.2.0", meta: meta("d3-m7-clips-null"), tracks: [{ id: "v1", kind: "video", clips: null }] }) },
  // M8: kind lạ → validate "kind không hỗ trợ" → load reject.
  "m8-kind-weird": { media: "video", spec: (id) => ({ version: "0.2.0", meta: meta("d3-m8-kind-weird"), tracks: [{ id: "v1", kind: "video", clips: [videoClip(id, { kind: "weird" })] }] }) },
  // M9: duration âm → validate "duration phải là số > 0." → load reject.
  "m9-duration-neg": { media: "video", spec: (id) => ({ version: "0.2.0", meta: meta("d3-m9-duration-neg"), tracks: [{ id: "v1", kind: "video", clips: [videoClip(id, { duration: -1 })] }] }) },
  // M10: speedKeyframes [null] → chỉ warning load; ramp try/catch → không ném.
  "m10-speedkf-null": { media: "video", spec: (id) => ({ version: "0.2.0", meta: meta("d3-m10-speedkf-null"), tracks: [{ id: "v1", kind: "video", clips: [videoClip(id, { speedKeyframes: { keyframes: [null] } })] }] }) },
  // M11: thiếu meta → isVideoSpec false → load reject.
  "m11-meta-missing": { media: "video", spec: (id) => ({ version: "0.2.0", tracks: [{ id: "v1", kind: "video", clips: [videoClip(id)] }] }) },
};
if (!CASES[CASE]) { console.error("usage: pause48D3-malspec.mjs <" + Object.keys(CASES).join("|") + ">"); process.exit(2); }
const CASEDEF = CASES[CASE];
const MEDIA_FILE = CASEDEF.media === "audio" ? "tone3s.mp3" : "valid-gop.mp4";
const MEDIA_DIR = CASEDEF.media === "audio" ? D3_MEDIA : Y2_MEDIA;
const MEDIA_MIME = CASEDEF.media === "audio" ? "audio/mpeg" : "video/mp4";

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
  if (!fs.existsSync(path.join(DIST, "index.html"))) fail("chưa có dist scratch /tmp/d3-app-dist — chạy vite build --outDir /tmp/d3-app-dist trước");
  if (!fs.existsSync(path.join(MEDIA_DIR, MEDIA_FILE))) fail("không có media " + path.join(MEDIA_DIR, MEDIA_FILE));
  if (!DISPLAY) fail("không còn display trống trong :90-:99");
  fs.mkdirSync(SCRATCH, { recursive: true });
  const mediaBytes = fs.readFileSync(path.join(MEDIA_DIR, MEDIA_FILE));
  const sha = crypto.createHash("sha256").update(mediaBytes).digest("hex");
  const assetId = "a_" + sha.slice(0, 16);
  const spec = CASEDEF.spec(assetId);
  const specJson = JSON.stringify(spec);
  const mediaFile = path.join(SCRATCH, MEDIA_FILE);
  fs.copyFileSync(path.join(MEDIA_DIR, MEDIA_FILE), mediaFile);
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
  log("app server tại " + ORIGIN + " case " + CASE + " media " + MEDIA_FILE + " assetId " + assetId + " display " + DISPLAY);

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
    // Thu lỗi uncaught của trang (tick chết ở syncMedia sẽ hiện ở đây).
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__d3errors = []; window.addEventListener("error", (e) => { if (window.__d3errors.length < 20) { const st = (e.error && e.error.stack ? String(e.error.stack) : "").split("\\n").slice(0, 6).join(" | "); window.__d3errors.push("error: " + (e.message || String(e.error || e)) + (st ? " || " + st : "")); } }); window.addEventListener("unhandledrejection", (e) => { if (window.__d3errors.length < 20) window.__d3errors.push("unhandledrejection: " + String(e.reason && e.reason.message ? e.reason.message : e.reason)); });`,
    }, sid);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, sid);
    await sleep(4000);
    const ev = (expr) => cdp.evaluate(expr, sid);

    async function snapshot() {
      return ev(`(() => { const i = window.__vcutPreviewIdle; const clips = [...document.querySelectorAll(".tl-clip")].map((e) => (e.textContent || "").slice(0, 60)); let autoName = null; try { const raw = localStorage.getItem("vcut-studio:autosave:v1"); if (raw) autoName = JSON.parse(raw).name ?? null; } catch {} return { idle: i ? { ticks: i.ticks, sleeping: i.sleeping, lastDrawn: i.lastDrawn, lastRequested: i.lastRequested, pendingSeek: i.pendingSeek, seekFailureCount: i.seekFailureCount, seekFailureExhausted: i.seekFailureExhausted, seekFailureKind: i.seekFailureKind, seekFailureTarget: i.seekFailureTarget, seekElementRecreated: i.seekElementRecreated, pauseRetrySkipped: i.pauseRetrySkipped, pauseRetryExhausted: i.pauseRetryExhausted } : null, tlClipCount: clips.length, tlClipTexts: clips, autoName, errors: window.__d3errors ? window.__d3errors.slice() : null }; })()`);
    }
    async function scrubToSeconds(sec) {
      return ev(`(() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const rect = el.getBoundingClientRect(); const x = rect.left + ${Math.round(sec * 60)}; const y = rect.top + rect.height / 2; el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); el.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); return { x, rectLeft: rect.left, sec: ${sec} }; })()`);
    }
    // Poll tới khi ngủ, hoặc ticks đóng băng 5 s liên tiếp (vòng lặp chết),
    // hoặc hết maxMs. Trả về toàn bộ mẫu.
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

    // Seed project (mẫu apploop C3; spec do harness build sẵn ở Node,
    // assetId khớp sha256 media — verify sha trong trang).
    const manifestFields = CASEDEF.media === "audio"
      ? `{ assetId, originalName: file, sha256: sha, size: buf.byteLength, mimeType: "audio/mpeg", kind: "audio", duration: 3, ingestedAt: new Date().toISOString(), refCount: 1 }`
      : `{ assetId, originalName: file, sha256: sha, size: buf.byteLength, mimeType: "video/mp4", kind: "video", width: 640, height: 360, duration: 3, ingestedAt: new Date().toISOString(), refCount: 1 }`;
    const seedFn = `
(async () => {
  const file = ${JSON.stringify(MEDIA_FILE)};
  const buf = await (await fetch("/media/" + file)).arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const sha = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const assetId = "a_" + sha.slice(0, 16);
  const blob = new Blob([buf], { type: ${JSON.stringify(MEDIA_MIME)} });
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
      tx.objectStore("manifests").put(${manifestFields});
      tx.objectStore("blobs").put(blob, assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
  const spec = ${specJson};
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: ${JSON.stringify("d3-" + CASE)}, spec, session: { playhead: 2 } };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(env));
  return { assetId, sha, bytes: buf.byteLength, expectedAssetId: ${JSON.stringify(assetId)} };
})()`;
    const seed = await ev(seedFn).catch((e) => ({ error: String(e && e.message ? e.message : e) }));
    log("seed: " + JSON.stringify(seed));
    if (seed && seed.assetId !== seed.expectedAssetId) {
      fail("sha media trong trang khác Node — seed sai assetId");
    }
    await ev(`location.reload()`);
    await sleep(3000);
    const checks = [];
    const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 1200)); };

    // Giai đoạn 0: project nào đã load? seeded (1 clip) hay mẫu (2 clip
    // video mau-1/mau-2 + 1 clip text = 3 .tl-clip, tên "Dự án mẫu")?
    // Project mẫu load BẤT ĐỒNG BỘ (loadSample await buildSampleProject)
    // nên +3 s sau reload timeline có thể còn 0 clip — poll tới 20 s
    // cho tới khi tlClipCount != 0 rồi mới kết luận.
    let afterLoad = await snapshot();
    {
      const t0 = Date.now();
      while (Date.now() - t0 < 20000) {
        if (afterLoad && afterLoad.tlClipCount !== 0) break;
        await sleep(500);
        afterLoad = await snapshot();
      }
    }
    log("after-load: " + JSON.stringify(afterLoad));
    const loaded = afterLoad && afterLoad.tlClipCount === 1 ? "seeded"
      : afterLoad && (afterLoad.tlClipTexts || []).some((t) => t.includes("mau-1.webm")) ? "sample" : "unknown";
    check("D3-load", loaded === "seeded" ? "OBSERVED" : loaded === "sample" ? "OBSERVED" : "NOT_MEASURED",
      { loaded, tlClipCount: afterLoad?.tlClipCount, tlClipTexts: afterLoad?.tlClipTexts, autoName: afterLoad?.autoName, ticks: afterLoad?.idle?.ticks, errors: afterLoad?.errors });
    if (loaded !== "seeded") {
      // Cổng load đã từ chối spec → App rơi về project mẫu. Không scrub:
      // kind "error" không thể xuất hiện vì spec dị dạng không vào vòng lặp.
      console.log(JSON.stringify({ case: CASE, seed, afterLoad, checks }, null, 2));
      process.exit(0);
    }
    // Giai đoạn 1: settle — poll tới khi ngủ hoặc ticks đóng băng (vòng chết).
    const settleSamples = await pollTrack(30000, "settle");
    const lastSettle = settleSamples[settleSamples.length - 1] ?? null;
    const ticksFrozenSettle = settleSamples.length >= 10
      && settleSamples.slice(-10).every((s) => s.idle && s.idle.ticks === lastSettle?.idle?.ticks);
    const loopDeadAtSettle = ticksFrozenSettle && lastSettle?.idle?.sleeping !== true;
    check("D3-settle", loopDeadAtSettle ? "OBSERVED" : "OBSERVED",
      { loopDead: loopDeadAtSettle, last: lastSettle, tailSamples: settleSamples.slice(-4) });
    // Giai đoạn 2: scrub 2.5 rồi poll — nếu vòng còn sống thì đây là lúc
    // executor chạy; nếu vòng đã chết thì scrub không cứu được (wake
    // no-op khi sleeping=false) — ghi rõ ticks trước/sau scrub.
    const ticksBeforeScrub = lastSettle?.idle?.ticks ?? null;
    const s25 = await scrubToSeconds(2.5);
    const samples25 = await pollTrack(60000, "scrub-2.5");
    const last25 = samples25[samples25.length - 1] ?? null;
    const all = settleSamples.concat(samples25);
    const kindsSeen = [...new Set(all.map((s) => s.idle?.seekFailureKind).filter((k) => k !== null && k !== undefined))];
    const maxCount = Math.max(0, ...all.map((s) => s.idle?.seekFailureCount ?? 0));
    const anyError = kindsSeen.includes("error");
    const ticksAfterScrub = last25?.idle?.ticks ?? null;
    const loopDead = last25?.idle?.sleeping !== true
      && samples25.length >= 10
      && samples25.slice(-10).every((s) => s.idle && s.idle.ticks === last25?.idle?.ticks);
    check("D3-kind-error", anyError ? "PASS" : "OBSERVED",
      { kindsSeen, maxSeekFailureCount: maxCount, exhaustedEver: all.some((s) => s.idle?.seekFailureExhausted === true),
        loopDead, ticksBeforeScrub, ticksAfterScrub, scrub: s25, last: last25,
        errors: last25?.errors, tail25: samples25.slice(-4) });
    console.log(JSON.stringify({ case: CASE, seed, afterLoad, settleSamples, samples25, checks }, null, 2));
    process.exit(checks.some((c) => c.status === "FAIL") ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
