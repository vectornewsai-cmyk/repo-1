#!/usr/bin/env node
/**
 * Phase 9 đợt 34, luồng Q6 — Trích 2 blob clip mẫu seek (mau-1/mau-2.webm)
 * từ app thật để đo GOP bằng ffprobe.
 *
 * Bối cảnh: clip mẫu seek KHÔNG phải file trên đĩa — `apps/web/src/sample.ts`
 * tự sinh bằng Canvas + MediaRecorder trong trình duyệt (VP9 640×360 30fps,
 * 4 s/clip). P2 đợt 32 đã trích kiểu này và đo GOP thưa ~3,4 s; file trích
 * của P2 chỉ nằm ở /tmp nên không còn. Probe này làm lại việc trích đó một
 * cách tái dùng được, để Q6 đo tiếp GOP dày (xem LIMITS Q6).
 *
 * Cách làm (không sửa code sản phẩm, không build lại dist — chỉ snapshot):
 *  1. Copy apps/web/dist sang scratch, phục vụ bằng HTTP tĩnh (SPA fallback).
 *  2. Chạy Chrome headed dưới Xvfb với --remote-debugging-port, nói CDP qua
 *     WebSocket có sẵn của Node 24 (không cần dependency ngoài).
 *  3. Cài Page.addScriptToEvaluateOnNewDocument bọc document.createElement:
 *     mọi <video> app tạo (pool off-DOM của media.ts) được giữ lại trong
 *     window.__q6videos — querySelectorAll("video") trả rỗng nên phải chặn
 *     từ lúc tạo (đúng bẫy P2 đã ghi).
 *  4. Profile Chrome mới → app tự loadSample() (không có autosave), ghi 2
 *     clip mẫu (~8 s), rồi bấm phát xuôi cho playhead chạy hết project 8 s
 *     để cả 2 clip đều được MediaPool tạo element.
 *  5. fetch() từng blob: URL trong trang, ghi .webm + manifest JSON ra scratch.
 *
 * Biến môi trường: Q6_SCRATCH (mặc định ~/workspace/tmp-round34-q6),
 * Q6_DISPLAY (mặc định :91), Q6_PORT (mặc định 4191),
 * Q6_CDP_PORT (mặc định 4391).
 * Thoát: 0 = trích đủ 2 clip; 1 = chỉ trích được 1 clip (partial, vẫn ghi
 * file); 2 = blocker hạ tầng (không dist/chrome/app không ready/không clip).
 * KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo — blob .webm chỉ
 * nằm ở scratch, batch stage chỉ nhận manifest/ffprobe JSON dạng text.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.Q6_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round34-q6");
const DISPLAY = process.env.Q6_DISPLAY || ":91";
const PORT = Number(process.env.Q6_PORT || 4191);
const CDP_PORT = Number(process.env.Q6_CDP_PORT || 4391);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.Q6_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const log = (...a) => console.log(`[${stamp()}]`, ...a);
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

// --- CDP qua WebSocket (Node 24 có global WebSocket, không cần ws) ---
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.sessionWaiters = [];
    this.ws.addEventListener("message", (ev) => {
      let msg; try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) {
        this.sessionId = msg.params.sessionId;
        for (const w of this.sessionWaiters.splice(0)) w(this.sessionId);
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (code ${msg.error.code})`));
        else resolve(msg.result ?? {});
      }
    });
  }
  ready() { return new Promise((res, rej) => { this.ws.addEventListener("open", res, { once: true }); this.ws.addEventListener("error", rej, { once: true }); }); }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); } }, 30000);
    });
  }
  waitSession() {
    if (this.sessionId) return Promise.resolve(this.sessionId);
    return new Promise((res) => this.sessionWaiters.push(res));
  }
  async evaluate(expression, sessionId) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) fail(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails)}`);
    return r.result?.value ?? null;
  }
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
function serveDir(root) {
  return http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
      let file = path.join(root, urlPath === "/" ? "index.html" : urlPath);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "index.html");
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch { res.writeHead(500); res.end(); }
  });
}

async function main() {
  const dist = path.join(WEB_DIR, "dist");
  if (!fs.existsSync(path.join(dist, "index.html"))) fail("chưa có dist (không build lại ở đây — dist là tài nguyên chia sẻ)");
  const bundle = fs.readdirSync(path.join(dist, "assets")).find((f) => f.endsWith(".js"));
  log(`bundle snapshot: ${bundle}`);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const snap = path.join(SCRATCH, "dist-snap");
  fs.rmSync(snap, { recursive: true, force: true });
  fs.cpSync(dist, snap, { recursive: true });
  const server = serveDir(snap);
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  log(`phục vụ snapshot tại ${ORIGIN}`);

  const num = DISPLAY.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
    if (alive) log(`Xvfb: dùng chung display ${DISPLAY}`);
    else {
      log(`Xvfb: socket ${sock} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
    }
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail(`Xvfb không tạo socket ${sock}`);
    log(`Xvfb lên: DISPLAY=${DISPLAY}`);
  }
  const profile = path.join(SCRATCH, "chrome-profile");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeBin = BINARIES.find((b) => fs.existsSync(b));
  if (!chromeBin) fail(`không tìm thấy chrome: ${BINARIES.join(", ")}`);
  log(`chrome: ${chromeBin}`);
  const cleanup = () => { try { chrome?.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} server.close(); };
  process.on("exit", cleanup);
  const chrome = spawn(chromeBin, [
    "--no-sandbox", `--remote-debugging-port=${CDP_PORT}`, "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars",
    "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required",
    `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0",
    "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
  chrome.stdout?.on("data", () => {});
  chrome.stderr?.on("data", () => {});

  let targets = [];
  for (let i = 0; i < 60 && !targets.length; i++) {
    await sleep(500);
    try { targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json(); } catch {}
  }
  const pageTarget = targets.find((t) => t.type === "page");
  if (!pageTarget?.webSocketDebuggerUrl) fail("không lấy được webSocketDebuggerUrl của Chrome");
  const cdp = new Cdp(pageTarget.webSocketDebuggerUrl);
  await cdp.ready();
  const browserCdp = cdp; // dùng cùng socket cho Target.* (không session)
  await browserCdp.send("Target.createTarget", { url: "about:blank" });
  // attach vào target mới: sessionId đến qua event Target.attachedToTarget
  // (lấy targetId từ /json/list sau khi tạo).
  let newTargets = [];
  for (let i = 0; i < 20 && newTargets.length < 2; i++) {
    await sleep(250);
    try { newTargets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json(); } catch {}
  }
  const created = newTargets.filter((t) => t.type === "page" && t.id !== pageTarget.id).at(-1);
  if (!created) fail("không tạo được target mới");
  await browserCdp.send("Target.attachToTarget", { targetId: created.id, flatten: true });
  const sessionId = await Promise.race([
    cdp.waitSession(),
    sleep(10000).then(() => null),
  ]);
  if (!sessionId) fail("không nhận được sessionId từ Target.attachedToTarget");
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  // Bọc createElement TRƯỚC khi app load (xem header: pool off-DOM).
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `(()=>{window.__q6videos=[]; const _ce=document.createElement.bind(document); document.createElement=function(tag,...args){const el=_ce(tag,...args); if(String(tag).toLowerCase()==="video") window.__q6videos.push(el); return el;}; return true;})()`,
  }, sessionId);
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, sessionId);
  let ready = false;
  for (let i = 0; i < 90 && !ready; i++) {
    await sleep(1000);
    ready = await cdp.evaluate(`!!(document.querySelector("canvas.preview-canvas") && document.querySelector(".transport"))`, sessionId).catch(() => false);
  }
  if (!ready) fail("app không ready sau 90s");
  log("app ready — chờ loadSample ghi 2 clip mẫu (mỗi clip 4 s)");
  const listVideos = () => cdp.evaluate(`(window.__q6videos||[]).map((v)=>({src:v.src||"",rs:v.readyState||0,w:v.videoWidth||0,h:v.videoHeight||0,dur:v.duration||0,ct:v.currentTime||0}))`, sessionId);
  // Chờ clip 1 xuất hiện (preview vẽ ở playhead 0) rồi phát hết project.
  let vids = [];
  for (let i = 0; i < 90; i++) {
    await sleep(1000);
    vids = (await listVideos().catch(() => []));
    if (vids.some((v) => v.src.startsWith("blob:") && v.w > 0)) break;
  }
  log(`video blob sau chờ clip 1: ${JSON.stringify(vids)}`);
  const playRes = await cdp.evaluate(`(()=>{const btns=[...document.querySelectorAll(".transport button")]; const b=btns.find((x)=>(x.textContent||"").includes("▶")); if(!b) return "no-btn"; b.click(); return "clicked";})()`, sessionId).catch(() => "eval-fail");
  log(`bấm phát xuôi: ${playRes}`);
  await sleep(12000); // project 8 s + biên: playhead chạy qua cả clip 2
  await cdp.evaluate(`(()=>{const btns=[...document.querySelectorAll(".transport button")]; const b=btns.find((x)=>(x.textContent||"").includes("⏸")); if(b) b.click(); return true;})()`, sessionId).catch(() => false);
  await sleep(1000);
  vids = await listVideos().catch(() => []);
  log(`video blob cuối: ${JSON.stringify(vids)}`);
  const blobs = [];
  for (const v of vids) {
    if (!v.src.startsWith("blob:")) continue;
    if (blobs.some((b) => b.src === v.src)) continue;
    blobs.push(v);
  }
  if (!blobs.length) fail("không trích được blob video nào (pool chưa tạo element?)");
  const manifest = { runAt: new Date().toISOString(), bundle, clips: [] };
  for (let i = 0; i < blobs.length; i++) {
    const v = blobs[i];
    const data = await cdp.evaluate(`(async()=>{const r=await fetch(${JSON.stringify(v.src)}); const buf=await r.arrayBuffer(); const u8=new Uint8Array(buf); let s=""; for(let o=0;o<u8.length;o+=0x8000){s+=String.fromCharCode.apply(null,u8.subarray(o,o+0x8000));} return {size:u8.length,b64:btoa(s)};})()`, sessionId);
    if (!data || data.size === 0) { log(`clip ${i}: fetch blob rỗng, bỏ qua`); continue; }
    const name = `q6-mau-${i + 1}.webm`;
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(data.b64, "base64"));
    const stat = fs.statSync(path.join(SCRATCH, name));
    log(`ghi ${name}: ${stat.size} byte (khai ${data.size})`);
    manifest.clips.push({ file: name, srcScheme: "blob:", videoWidth: v.w, videoHeight: v.h, readyState: v.rs, duration: v.dur, bytes: stat.size, sha256: null });
  }
  // sha256 bằng node crypto (không lệnh ngoài).
  const crypto = await import("node:crypto");
  for (const c of manifest.clips) {
    c.sha256 = crypto.createHash("sha256").update(fs.readFileSync(path.join(SCRATCH, c.file))).digest("hex");
  }
  fs.writeFileSync(path.join(SCRATCH, "q6-sample-manifest.json"), JSON.stringify(manifest, null, 2));
  log(`MANIFEST: ${JSON.stringify(manifest)}`);
  cleanup();
  if (manifest.clips.length >= 2) { log("OK: trích đủ 2 clip mẫu"); process.exit(0); }
  log(`PARTIAL: chỉ trích được ${manifest.clips.length} clip`);
  process.exit(1);
}

main().catch((e) => { console.error(`PROBE LỖI: ${e && e.stack ? e.stack : e}`); process.exit(2); });
