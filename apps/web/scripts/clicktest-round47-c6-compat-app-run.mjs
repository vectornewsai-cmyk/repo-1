#!/usr/bin/env node
/**
 * Phase 9 đợt 47, luồng C6 — compat APP THẬT: wiring effect đổi lang qua
 * nút TopBar + badge failed từ controller.failed thật (đóng nợ đợt 46 §4
 * mục 8: B6 chỉ chứng minh ở mức HELPER — display thật + dict thật +
 * ghi DOM thật, KHÔNG chứng minh wiring React thật qua nút TopBar trong
 * app đầy đủ, cũng không chứng minh controller.failed thật từ footage hỏng).
 *
 * PHẠM VI TRUNG THỰC — ĐỌC TRƯỚC KHI TRÍCH SỐ:
 * - App thật: dist đóng băng bundle index-D4oCKuDp.js (cùng bundle B5/B6
 *   và sync-cap C6 dùng), serve tĩnh qua HTTP 127.0.0.1, Chromium thật
 *   headed Xvfb, CDP pipe (mẫu B6). Không sửa code app trong script này.
 * - Phase A (lang): project có 1 clip video reverse=true, asset là file
 *   flat 45 KB thật (10 s) qua blob: trong IDB (không proxy). Scrub qua
 *   timeline UI thật (.tl-ruler pointer events, mẫu B2) → vòng lặp
 *   preview tick → badge hiện. Pause (vòng lặp ngủ) → BẤM NÚT ĐỔI LANG
 *   THẬT ở TopBar (aria-label "Ngôn ngữ"/"Language") → đọc badge DOM thật.
 * - Phase B (failed): cùng project nhưng asset là 64 KiB byte rác xác
 *   định (không có box ftyp/moov — không phải mp4 hợp lệ), clip
 *   reverse=true. Controller WebCodecs phải tự fail khi load/decode
 *   (unsupported=true → failed=true) rồi badge mới đổi sang
 *   element-failed. BÀI HỌC LẦN 1 (compat1): poll 90 s lúc PAUSE thì badge
 *   kẹt WEBCODECS — vì drawTransport đặt playing:false lúc pause/seek nên
 *   stepping=false, frameAt/load không chạy, controller không bao giờ fail.
 *   Muốn controller fail PHẢI PHÁT clip (playing=true + clip.reverse).
 *   Ghi rõ badge từng mốc: có hiện WEBCODECS trước rồi mới lật sang failed
 *   không, sau bao lâu, có cần nudge để ép tick/phát lại không.
 * - Mọi số đều under-load (chạy cùng các luồng đợt 47 khác) — cấm dùng
 *   làm baseline quiet. Safari/Firefox/máy thật: KHÔNG đo ở đây.
 * - Badge từng track: script này KHÔNG tách badge (giữ 1 badge toàn cục
 *   như B6 §4); chỉ đọc badge hiện tại.
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/clicktest-round47-c6-compat-app-run.mjs \
 *     --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
 *     --dist ~/workspace/tmp-round47-c6/app-dist \
 *     --scratch ~/workspace/tmp-round47-c6/compat1 \
 *     [--display :94] [--port 4297]
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
  const o = { display: ":94", port: 4297 };
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
  console.log(`[c6compat] dist bundle=${bundle} loadBefore=${loadBefore}`);
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
  console.log(`[c6compat] app server http://127.0.0.1:${opts.port}`);
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
  } else console.log(`[c6compat] Xvfb: dùng chung display ${opts.display}`);
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
    console.log(`[c6compat] app ready: ${JSON.stringify(await waitReady())}`);

    // ---------- PHASE A: footage tốt, đổi lang qua nút TopBar ----------
    const seedA = await ev(`(${SEED_FN})("good")`).catch((e) => ({ error: String(e?.message ?? e) }));
    console.log(`[c6compat] seed A: ${JSON.stringify(seedA)}`);
    if (seedA.error) throw new Error(`seed A thất bại: ${seedA.error}`);
    await ev(`location.reload()`);
    console.log(`[c6compat] A sau reload: ${JSON.stringify(await waitReady())}`);
    const settleA = await waitSleeping(60000);
    console.log(`[c6compat] A settle: ${JSON.stringify(settleA)}`);
    await scrubToSeconds(5);
    // Chờ vòng lặp vẽ xong frame 5 rồi ngủ hẳn (tiền đề cho check no-tick):
    // lần 1 bấm lang khi loop còn thức nên ticks tăng 3->5, không kết luận được effect.
    let settleDrawA = null;
    for (let i = 0; i < 60; i++) {
      await sleep(500);
      const s2 = await ev(IDLE_JS);
      if (s2 && s2.sleeping && s2.lastDrawn === 5) { settleDrawA = { afterSec: (i + 1) * 0.5, idle: s2 }; break; }
      settleDrawA = { afterSec: (i + 1) * 0.5, idle: s2 };
    }
    console.log(`[c6compat] A chờ vẽ/ngủ sau scrub: ${JSON.stringify(settleDrawA)}`);
    check("A-drawn-and-sleeping", settleDrawA && settleDrawA.idle && settleDrawA.idle.sleeping === true && settleDrawA.idle.lastDrawn === 5, settleDrawA);
    const seenA = await pollBadge("A-webcodecs-vi", (b) => b.display === "block" && b.text === VI.reverseEngine.badgeWebcodecs, 60);
    console.log(`[c6compat] A badge WEBCODECS vi: ${JSON.stringify(seenA)}`);
    check("A-badge-webcodecs-vi", seenA.badge && seenA.badge.text === VI.reverseEngine.badgeWebcodecs && seenA.badge.display === "block", seenA.badge);
    const idleA = await ev(IDLE_JS);
    check("A-loop-sleeping-before-lang", idleA && idleA.sleeping === true, idleA);
    const langBtnA = await ev(LANG_BTN_JS);
    check("A-lang-button-found", !!langBtnA && langBtnA.visible, langBtnA);
    const ticksBeforeLang = idleA?.ticks ?? null;
    await ev(CLICK_LANG_JS);
    await sleep(1500);
    const badgeEn = await ev(BADGE_JS);
    const idleAfterLang = await ev(IDLE_JS);
    console.log(`[c6compat] A sau bấm lang: badge=${JSON.stringify(badgeEn)} idle=${JSON.stringify(idleAfterLang)} ticksBefore=${ticksBeforeLang}`);
    check("A-lang-en-badge", badgeEn && badgeEn.text === EN.reverseEngine.badgeWebcodecs && badgeEn.title === EN.reverseEngine.titleWebcodecs, badgeEn);
    check("A-lang-no-tick-needed", idleAfterLang && idleAfterLang.ticks === ticksBeforeLang, { before: ticksBeforeLang, after: idleAfterLang?.ticks });
    await ev(CLICK_LANG_JS);
    await sleep(1500);
    const badgeViAgain = await ev(BADGE_JS);
    check("A-lang-vi-again", badgeViAgain && badgeViAgain.text === VI.reverseEngine.badgeWebcodecs, badgeViAgain);

    // ---------- PHASE B: footage hỏng, badge failed thật ----------
    const seedB = await ev(`(${SEED_FN})("broken")`).catch((e) => ({ error: String(e?.message ?? e) }));
    console.log(`[c6compat] seed B: ${JSON.stringify(seedB)}`);
    if (seedB.error) throw new Error(`seed B thất bại: ${seedB.error}`);
    await ev(`location.reload()`);
    console.log(`[c6compat] B sau reload: ${JSON.stringify(await waitReady())}`);
    const settleB = await waitSleeping(60000);
    console.log(`[c6compat] B settle: ${JSON.stringify(settleB)}`);
    await scrubToSeconds(5);
    // PHÁT clip ngược (nút Phát thật ở TopBar): chỉ khi playing=true thì
    // stepping mới true trong drawVideoClip, frameAt/load mới chạy và
    // controller mới có cơ hội fail. Lần 1 poll 90 s lúc pause nên badge
    // kẹt WEBCODECS — không phải controller khỏe. Poll giữ phát: playhead
    // ngược chạy 5->0 trong ~5 s rồi dừng nên mỗi 6 s kiểm tra, hết phát
    // thì scrub lại 5 + bấm Phát.
    const playBtnB = await ev(PLAY_BTN_JS);
    console.log(`[c6compat] B nút Phát: ${JSON.stringify(playBtnB)}`);
    check("B-play-button-found", !!playBtnB, playBtnB);
    await ev(CLICK_PLAY_JS);
    await sleep(1000);
    const seenB = await (async () => {
      const timeline = []; let nudges = 0; const t0 = Date.now(); let last = null;
      while (Date.now() - t0 < 90 * 1000) {
        const b = await ev(BADGE_JS);
        const playing = await ev(PLAYING_JS);
        const key = b ? `${b.display}|${b.text}|playing=${playing}` : "null";
        if (key !== last) { timeline.push({ atSec: +((Date.now() - t0) / 1000).toFixed(1), badge: b, playing }); last = key; }
        if (b && b.display === "block" && b.text === VI.reverseEngine.badgeElementFailed) return { badge: b, timeline, nudges, waitedSec: +((Date.now() - t0) / 1000).toFixed(1) };
        if (Date.now() - t0 > (nudges + 1) * 6000) {
          nudges++;
          if (playing !== true) { await scrubToSeconds(5); await ev(CLICK_PLAY_JS); }
        }
        await sleep(1000);
      }
      return { badge: await ev(BADGE_JS), timeline, nudges, waitedSec: +((Date.now() - t0) / 1000).toFixed(1), timeout: true };
    })();
    console.log(`[c6compat] B badge failed vi: ${JSON.stringify(seenB)}`);
    check("B-badge-failed-vi", seenB.badge && seenB.badge.text === VI.reverseEngine.badgeElementFailed && seenB.badge.display === "block", { badge: seenB.badge, timeline: seenB.timeline, nudges: seenB.nudges });
    check("B-badge-title-vi", seenB.badge && seenB.badge.title === VI.reverseEngine.titleElementFailed, seenB.badge?.title);
    const idleB = await ev(IDLE_JS);
    const ticksBeforeLangB = idleB?.ticks ?? null;
    await ev(CLICK_LANG_JS);
    await sleep(1500);
    const badgeFailedEn = await ev(BADGE_JS);
    const idleAfterLangB = await ev(IDLE_JS);
    console.log(`[c6compat] B sau bấm lang: badge=${JSON.stringify(badgeFailedEn)} idle=${JSON.stringify(idleAfterLangB)} ticksBefore=${ticksBeforeLangB}`);
    check("B-lang-en-failed", badgeFailedEn && badgeFailedEn.text === EN.reverseEngine.badgeElementFailed && badgeFailedEn.title === EN.reverseEngine.titleElementFailed, badgeFailedEn);
    // (Không assert no-tick ở phase B: clip hỏng không vẽ được nên loop
    // không ngủ được — tiền đề không đứng; ticks chỉ ghi nhận trong log.)
    await ev(CLICK_LANG_JS);
    await sleep(1500);
    const badgeFailedViAgain = await ev(BADGE_JS);
    check("B-lang-vi-again", badgeFailedViAgain && badgeFailedViAgain.text === VI.reverseEngine.badgeElementFailed, badgeFailedViAgain);
    const alive = await ev(`(()=>({onePlusOne:1+1, rs:document.readyState}))()`);
    check("app-alive-after", alive && alive.onePlusOne === 2, alive);

    const evidence = {
      runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port,
      appBundle: bundle, loadBefore, loadAfter: loadavg(),
      loadCondition: "under-load: phiên chạy cùng các luồng đợt 47 khác",
      seedA, seedB, phaseA: seenA, phaseB: seenB,
      checks: checks.map((c) => ({ name: c.name, pass: c.pass })),
      scope: "COMPAT-APP: wiring effect [previewLang] qua nút đổi lang TopBar trong app đầy đủ + badge failed từ controller.failed thật (footage rác 64 KiB) trong app đầy đủ. Badge từng track vẫn 1 badge toàn cục (không tách).",
    };
    fs.writeFileSync(path.join(opts.scratch, "compat-app-evidence.json"), JSON.stringify(evidence, null, 2));
    console.log(`[c6compat] evidence → ${path.join(opts.scratch, "compat-app-evidence.json")}`);
    const failed = checks.filter((c) => !c.pass);
    console.log(`[c6compat] ${checks.length - failed.length}/${checks.length} PASS`);
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    cleanup();
  }
  process.exit(process.exitCode ?? 0);
}
main().catch((e) => { console.error(`BLOCKER: ${e.message}`); process.exit(2); });
