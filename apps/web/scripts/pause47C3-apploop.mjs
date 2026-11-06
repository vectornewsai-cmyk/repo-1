// pause47C3-apploop.mjs — Phase 9 đợt 47, luồng C3: bằng chứng vòng
// lặp preview trong app thật cho fail-fast seek-landing-0 (nợ đợt 46
// §4 mục 4) + phân biệt cap X2 vs cap W2.
//
// Chạy từ gốc repo (dist đã build sẵn ra /tmp/c3-app-dist từ source
// hiện tại — KHÔNG dùng apps/web/dist đóng băng):
//   node apps/web/scripts/pause47C3-apploop.mjs <broken-gap|valid-gop>
// Script tự: serve dist scratch + media Y2 gốc ở /tmp, bật Xvfb riêng +
// Chromium Playwright (chromium-1248) qua CDP pipe, seed project qua
// IndexedDB + localStorage autosave (mẫu harness43 Y2), scrub qua
// .tl-ruler, poll window.__vcutPreviewIdle, in JSON kết quả.
// Exit 1 khi có kiểm tra FAIL; exit 0 khi PASS / NOT_MEASURED /
// OBSERVED.
//
// Luồng đo (variant broken-gap) — THỨ TỰ KHÁC B2 (2.5 trước, để bắt
// quirk trên element pool còn tươi, trước khi 1.5 làm kẹt element):
//   1. Settle → scrub 2.5 (element pool tươi) → poll tới khi ngủ
//      (tối đa 90 s), ghi toàn bộ quỹ đạo idleDebug: nếu quirk tái
//      hiện trong app thì seekElement fail nhanh (failed-only,
//      ok:true, timedOut:0) → THEO THIẾT KẾ X2 §1 đi NHÁNH VẼ, không
//      đếm vào cap X2 (seekFailureCount giữ 0) mà đi cap W2
//      (pauseRetrySkipped leo) — harness ghi đúng cái đo, không gán
//      cap 10 cho fail-fast. Nếu app vẽ được 2.5 thì quirk vắng mặt
//      trong app (nhất quán B2).
//   2. Scrub 1.5 (GOP hỏng) → poll tới cạn cap seek + ngủ: đối chứng
//      đường timeout → cap X2 đúng 10, kind "timeout", phục hồi Y2
//      (seekElementRecreated ≥ 1) — tái xác nhận B2 trong cùng phiên.
//   3. Scrub 2.5 LẦN NỮA trên element MỚI sau drop (phục hồi Y2 đã
//      bỏ element cũ) → poll tới khi ngủ: kiểm tra quirk có tái hiện
//      trên element tươi trong app không (điều kiện gần tab-mới nhất
//      mà app-loop đạt được).
//   4. Ticks đứng yên: sau lần ngủ cuối, đọc ticks 2 lần cách nhau
//      5 s — phải bằng nhau (vòng lặp đã ngủ thật, không tick mãi).
// Variant valid-gop là đối chứng: scrub 2.5 phải vẽ được, không cạn cap.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const VARIANT = process.argv[2] || "broken-gap";
// C3: ngoài 2 variant chính, chấp nhận mọi file trong thư mục media Y2
// để săn kind "error" (nhiệm vụ 3: broken-corrupt, broken-trunc, empty,
// garbage, mpeg4-unsupported). Các fixture lạ chạy luồng HUNT (không
// phải luồng broken-gap: không kiểm tra cap-10-timeout, chỉ ghi quỹ
// đạo + mọi seekFailureKind từng xuất hiện — "error" xuất hiện ở đâu
// thì đó chính là fixture cần tìm).
const Y2_MEDIA = path.join(os.homedir(), "workspace", "tmp-round43-y2", "media");
const HUNT_FIXTURES = fs.existsSync(Y2_MEDIA)
  ? fs.readdirSync(Y2_MEDIA).filter((f) => f.endsWith(".mp4")).map((f) => f.replace(/\.mp4$/, ""))
  : [];
if (!HUNT_FIXTURES.includes(VARIANT)) { console.error("usage: pause47C3-apploop.mjs <" + HUNT_FIXTURES.join("|") + ">"); process.exit(2); }
const IS_HUNT = VARIANT !== "broken-gap" && VARIANT !== "valid-gop";
const DIST = "/tmp/c3-app-dist";
const SCRATCH = "/tmp/pause47c3-apploop-" + process.pid;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const DISPLAY = process.env.C3_APP_DISPLAY || pickFreeDisplay();
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
  if (!fs.existsSync(path.join(DIST, "index.html"))) fail("chưa có dist scratch /tmp/c3-app-dist — chạy vite build --outDir /tmp/c3-app-dist trước");
  if (!DISPLAY) fail("không còn display trống trong :90-:99");
  fs.mkdirSync(SCRATCH, { recursive: true });
  const mediaFile = path.join(SCRATCH, VARIANT + ".mp4");
  fs.copyFileSync(path.join(Y2_MEDIA, VARIANT + ".mp4"), mediaFile);
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
    // Poll có lấy mẫu quỹ đạo (mỗi 500 ms) tới khi ngủ ổn định 5 s
    // hoặc hết maxMs — để thấy cap đếm leo thế nào, không chỉ điểm cuối.
    async function pollToSleep(maxMs, label) {
      const samples = [];
      const t0 = Date.now();
      let sleepSince = null;
      while (Date.now() - t0 < maxMs) {
        const s = await snapshot();
        if (s) {
          samples.push({ t: +((Date.now() - t0) / 1000).toFixed(1), ...s });
          if (s.sleeping) {
            if (sleepSince === null) sleepSince = Date.now();
            else if (Date.now() - sleepSince >= 5000) break;
          } else sleepSince = null;
        }
        await sleep(500);
      }
      log(label + ": " + samples.length + " mẫu, cuối: " + JSON.stringify(samples[samples.length - 1] ?? null));
      return samples;
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
  const spec = { version: "0.2.0", meta: { name: "c3-seed", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "c1", src: "asset:" + assetId, start: 0, duration: 3, in: 0, out: 3 }] }] };
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "c3-seed", spec, session: { playhead: 2 } };
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
      check("APP-loop", "NOT_MEASURED", { reason: "khong doc duoc __vcutPreviewIdle sau seed+reload", seed });
      console.log(JSON.stringify({ variant: VARIANT, seed, checks }, null, 2));
      process.exit(0);
    }
    if (VARIANT === "valid-gop") {
      const s1 = await scrubToSeconds(2.5);
      const samples = await pollToSleep(60000, "valid-2.5");
      const last = samples[samples.length - 1] ?? null;
      const ok = last && last.lastDrawn === 2.5 && last.sleeping === true && last.seekFailureExhausted !== true && last.pauseRetryExhausted !== true;
      check("APP-valid-control-2.5-drawn", ok ? "PASS" : "FAIL", { scrub: s1, last, tailSamples: samples.slice(-4) });
      console.log(JSON.stringify({ variant: VARIANT, seed, settle, samples, checks }, null, 2));
      process.exit(checks.some((c) => c.status === "FAIL") ? 1 : 0);
    }
    if (IS_HUNT) {
      // Luồng HUNT (kind "error" từ fixture media thật): scrub 2.5 rồi
      // 1.5, ghi toàn bộ quỹ đạo + mọi seekFailureKind từng xuất hiện.
      // PASS = tìm thấy kind "error" (fixture làm Seeker ném); nếu
      // không thấy thì OBSERVED kèm danh sách kind đã thấy — đó là kết
      // quả âm tính thật, không phải FAIL của harness.
      const s25 = await scrubToSeconds(2.5);
      const samples25 = await pollToSleep(60000, "hunt-2.5");
      const s15 = await scrubToSeconds(1.5);
      const samples15 = await pollToSleep(60000, "hunt-1.5");
      const all = samples25.concat(samples15);
      const kindsSeen = [...new Set(all.map((s) => s.seekFailureKind).filter((k) => k !== null && k !== undefined))];
      const maxCount = Math.max(0, ...all.map((s) => s.seekFailureCount ?? 0));
      const anyError = kindsSeen.includes("error");
      const lastHunt = all[all.length - 1] ?? null;
      const huntDetail = { scrub25: s25, scrub15: s15, kindsSeen, maxSeekFailureCount: maxCount,
        exhaustedEver: all.some((s) => s.seekFailureExhausted === true),
        last: lastHunt, tail25: samples25.slice(-4), tail15: samples15.slice(-4) };
      check("HUNT-kind-error-from-real-media", anyError ? "PASS" : "OBSERVED", huntDetail);
      console.log(JSON.stringify({ variant: VARIANT, seed, settle, samples25, samples15, checks }, null, 2));
      process.exit(0);
    }
    // broken-gap, giai đoạn 1: scrub 2.5 trên element pool tươi.
    const s25a = await scrubToSeconds(2.5);
    const samples25a = await pollToSleep(90000, "broken-2.5-fresh");
    const last25a = samples25a[samples25a.length - 1] ?? null;
    check("APP-broken-2.5-fresh-observed", "OBSERVED", { scrub: s25a, last: last25a, tailSamples: samples25a.slice(-6) });
    // Giai đoạn 2: scrub 1.5 — đối chứng đường timeout → cap X2.
    const s15 = await scrubToSeconds(1.5);
    const samples15 = await pollToSleep(120000, "broken-1.5-cap");
    const last15 = samples15[samples15.length - 1] ?? null;
    const capOk = last15 && last15.seekFailureExhausted === true && last15.sleeping === true
      && last15.seekFailureCount === 10 && last15.seekFailureKind === "timeout"
      && typeof last15.seekElementRecreated === "number" && last15.seekElementRecreated >= 1;
    check("APP-broken-1.5-cap10-timeout-plus-recovery", capOk ? "PASS" : "FAIL",
      { scrub: s15, last: last15, tailSamples: samples15.slice(-6) });
    // Giai đoạn 3: scrub 2.5 lần nữa, trên element MỚI sau drop.
    // C3-FIX (05/11): bản đầu chỉ scrub thẳng 2.5 — nhưng lastDrawn
    // sau cạn cap 1.5 vẫn là 2.5 (đã vẽ ở giai đoạn 1), nên guard Z2
    // coi scrub-to-2.5 là "đã vẽ" và KHÔNG phát seek mới (NOT_MEASURED
    // ở lần chạy đầu). Sửa: scrub 0.5 trước để vẽ lại lastDrawn=0.5
    // (vùng GOP0 lành), rồi mới scrub 2.5 — lúc đó seek 2.5 phát thật
    // trên element mới sau drop.
    let samples25b = [];
    let last25b = null;
    let s25b = null;
    let s05 = null;
    let samples05 = [];
    s05 = await scrubToSeconds(0.5);
    samples05 = await pollToSleep(60000, "broken-0.5-redraw");
    const last05 = samples05[samples05.length - 1] ?? null;
    if (last05 && last05.lastDrawn === 0.5) {
      s25b = await scrubToSeconds(2.5);
      samples25b = await pollToSleep(90000, "broken-2.5-after-drop");
      last25b = samples25b[samples25b.length - 1] ?? null;
      check("APP-broken-2.5-after-drop-observed", "OBSERVED", { scrub05: s05, last05, scrub: s25b, last: last25b, tailSamples: samples25b.slice(-6) });
    } else {
      check("APP-broken-2.5-after-drop-observed", "NOT_MEASURED", { reason: "khong ve duoc 0.5 truoc de reset lastDrawn (can seek moi 2.5)", last05, tail05: samples05.slice(-4) });
    }
    // Giai đoạn 4: ticks đứng yên sau lần ngủ cuối.
    let ticksCheck = null;
    const finalSnap = last25b ?? last15;
    if (finalSnap && finalSnap.sleeping) {
      const t1 = await snapshot();
      await sleep(5000);
      const t2 = await snapshot();
      ticksCheck = { t1: t1 ? t1.ticks : null, t2: t2 ? t2.ticks : null, sleeping1: t1 ? t1.sleeping : null, sleeping2: t2 ? t2.sleeping : null };
      const still = t1 && t2 && t1.ticks === t2.ticks && t2.sleeping === true;
      check("APP-ticks-stand-still-after-sleep", still ? "PASS" : "FAIL", ticksCheck);
    } else {
      check("APP-ticks-stand-still-after-sleep", "NOT_MEASURED", { reason: "vong lap chua ngu o cuoi luot do", finalSnap });
    }
    console.log(JSON.stringify({ variant: VARIANT, seed, settle, samples25a, samples15, samples25b, ticksCheck, checks }, null, 2));
    process.exit(checks.some((c) => c.status === "FAIL") ? 1 : 0);
  } finally {
    cleanup();
  }
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
