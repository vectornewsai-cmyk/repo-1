// clicktest-round37-t5-fallback-pipe.mjs — Phase 9 đợt 37, luồng T5.
//
// Click-test fallback full-app cho file lớn (nợ §5.3 của LIMITS đợt 36
// S4): file noise 420 MB thật, cờ WebCodecs BẬT, phát ngược — app phải
// rơi về đường element cũ và vẫn vẽ bình thường (không đen, không crash).
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs
// Env: T5_NOISE (mặc định fixture noise đợt 34 Q2
// ~/workspace/tmp-round34-q2/sparse-gop-noise.mp4), T5_DISPLAY
// (mặc định :96), T5_APP_PORT (mặc định 5197 — vite dev, KHÔNG build
// dist để khỏi đua với luồng khác; vite phục vụ source hiện tại, gồm
// sửa AbortController của T5).
// Kết quả: benchmarks/results/v37-t5-fallback-clicktest.json, exit 0
// khi PASS.
//
// Luồng click thật (mẫu K4 đợt 27): seed project rỗng qua autosave,
// import file qua input file thật của MediaBin (CDP
// DOM.setFileInputFiles — File backed-by-disk, đúng đường production),
// tắt toggle "Tự tạo proxy" trước khi import để clip phát bản gốc
// (không proxy) — đúng điều kiện cổng File.size của S4 (preview chỉ
// truyền item.file.size khi không có proxyUrl). Bật cờ WebCodecs bằng
// window.__vcutReverseWebcodecs = true từ console (cờ opt-in, chưa có
// toggle UI). Bấm Thêm -> End -> Phát ngược, đo 14 s.
//
// Tiêu chí (đo qua hook thật của app, không stub):
//  - reverseBadgeSeen: badge phát ngược hiện ít nhất 1 mẫu.
//  - drawDelta > 0: đường element đã vẽ (holdStats.draw tăng).
//  - wcHits === 0 và wcMisses > 0: mọi lần hỏi WebCodecs đều miss
//    (controller khóa fallback file lớn) — tức app dùng đường element,
//    không phải đường WebCodecs.
//  - videoContentDrawn: ít nhất 1 mẫu có centerMean khác nền render
//    #0a0c10 (mean 12.67) — tức canvas đã vẽ frame video thật, không
//    chỉ nền. LƯU Ý (bài học từ lần chạy đầu): tiêu chí cũ "mean > 20"
//    và "không đen" là KHÔNG ĐỦ — nền #0a0c10 có mean 12.67, qua
//    được cả hai ngưỡng cũ trong khi canvas chưa hề vẽ frame nào.
//    Vì vậy script nay phân biệt nền (12.67 ± 2) với nội dung thật,
//    và ghi rõ chỉ số mẫu đầu tiên có nội dung (firstContentIndex).
//  - videoContentEarly: nội dung thật xuất hiện trong 8 mẫu đầu
//    (~4 s). Trên file noise 420 MB (GOP hiệu dụng 30 — đính chính 46-B5: trước đây ghi 'GOP thưa'), element seek đuổi
//    target ngược nên frame đầu có thể tới muộn hơn nhiều (lần chạy
//    đầu: mẫu 24/28, ~12 s, trong khi skip leo tới 284 và canvas chỉ
//    vẽ nền — đúng guard K4: seek chưa khớp thì skip, không vẽ frame
//    cũ mạo nhận). Khi routing đúng + có nội dung nhưng tới muộn thì
//    verdict là PARTIAL (không phải PASS, cũng không phải FAIL do
//    code T5 — độ trễ seek này thuộc đường element cũ, có từ trước).
//  - App vẫn đáp evaluate sau khi dừng phát ngược (không crash).
// Chuyển động playhead (timecode giảm) chỉ GHI NHẬN: lần chạy đầu
// playhead giảm đơn điệu 29.4 -> 15.2 trong 14 s (stepping ngược tốt),
// vấn đề chỉ là frame element tới muộn, không phải playhead đứng.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(REPO, "apps/web");
const NOISE = process.env.T5_NOISE ||
  path.join(os.homedir(), "workspace/tmp-round34-q2/sparse-gop-noise.mp4");
const DISPLAY = process.env.T5_DISPLAY || ":96";
const APP_PORT = Number(process.env.T5_APP_PORT || 5197);
const ORIGIN = `http://127.0.0.1:${APP_PORT}`;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const OUT = path.join(REPO, "benchmarks/results/v37-t5-fallback-clicktest.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log(`[${stamp()}]`, ...a); }
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

if (!fs.existsSync(NOISE)) fail(`không có file noise ${NOISE}`);
const NOISE_BYTES = fs.statSync(NOISE).size;
const BASE = path.basename(NOISE);
log(`noise file: ${NOISE} (${NOISE_BYTES} byte)`);

const PAGE = {
  ready: `!!(document.querySelector("canvas.preview-canvas") && document.querySelector(".transport"))`,
  seedEmpty: `(()=>{localStorage.setItem("vcut-welcomed","1"); localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify({format:"vcut-project",formatVersion:1,appVersion:"0.1.0",specVersion:"0.2.0",savedAt:new Date().toISOString(),name:"T5 fallback seed",spec:{version:"0.2.0",meta:{name:"T5 seed",width:1280,height:720,fps:30},tracks:[]}})); return true;})()`,
  mediaNames: `[...document.querySelectorAll(".media-name")].map((el)=>(el.textContent||"").trim())`,
  uncheckAutoProxy: `(()=>{const labels=[...document.querySelectorAll("label")]; const l=labels.find((x)=>(x.textContent||"").includes("Tự tạo proxy")); if(!l) return "no-label"; const inp=l.querySelector("input"); if(!inp) return "no-input"; if(inp.checked) inp.click(); return inp.checked ? "still-checked" : "unchecked";})()`,
  clickAddFor: `(name)=>{const cards=[...document.querySelectorAll(".media-grid > *")]; const card=cards.find((c)=>(c.querySelector(".media-name")?.textContent||"").includes(name)); if(!card) return "no-card"; const btn=card.querySelector(".media-add"); if(!btn) return "no-btn"; btn.click(); return "clicked";}`,
  clickTransport: `(want)=>{const btns=[...document.querySelectorAll(".transport button")]; const b = want==="reverse" ? btns.find((x)=>x.getAttribute("aria-label")==="Phát ngược") : btns.find((x)=>(x.textContent||"").includes(want)); if(!b) return "no-btn"; b.click(); return "clicked";}`,
  sample: `(()=>{const cv=document.querySelector("canvas.preview-canvas"); let mean=null; if(cv && cv.width>0){const ctx=cv.getContext("2d"); const w=cv.width,h=cv.height; const x=Math.floor(w/2-50),y=Math.floor(h/2-50); try{const d=ctx.getImageData(x,y,100,100).data; let s=0; for(let i=0;i<d.length;i+=4) s+=(d[i]+d[i+1]+d[i+2])/3; mean=s/(d.length/4);}catch(e){mean=-1;}} const td=document.querySelector(".time-display"); const rev=document.querySelector(".preview-reverse-badge"); return {timeText: td?(td.textContent||"").trim():"", stats: window.__vcutHoldStats||null, wc: window.__vcutReverseWc||null, centerMean: mean, reverseBadge: !!(rev && rev.offsetParent!==null)};})()`,
  pressEnd: `(()=>{const ev=new KeyboardEvent("keydown",{key:"End",code:"End",bubbles:true}); window.dispatchEvent(ev); return true;})()`,
  enableWcFlag: `(()=>{window.__vcutReverseWebcodecs = true; return true;})()`,
};

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
  send(method, params = {}, sessionId = undefined, timeoutMs = 300000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
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

function waitOk(url, timeoutMs) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve(true);
        if (Date.now() - t0 > timeoutMs) return resolve(false);
        setTimeout(tick, 1000);
      });
      req.on("error", () => {
        if (Date.now() - t0 > timeoutMs) return resolve(false);
        setTimeout(tick, 1000);
      });
    };
    tick();
  });
}

async function main() {
  if (!fs.existsSync(CHROME)) fail(`không có chrome ${CHROME}`);
  const viteBin = path.join(REPO, "node_modules/.bin/vite");
  if (!fs.existsSync(viteBin)) fail(`không có vite ${viteBin}`);
  const vite = spawn(viteBin, ["--port", String(APP_PORT), "--strictPort", "--host", "127.0.0.1"], { cwd: WEB_DIR, stdio: "ignore" });
  let chrome = null;
  let xvfb = null;
  let profileDir = null;
  const cleanup = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGTERM"); } catch {}
    // Profile Chrome đặt ở workspace, dọn khi xong (lý do như probe:
    // /tmp là tmpfs 512M, profile probe file lớn có thể phình tới
    // hàng trăm MB — xem LIMITS T5).
    try { if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };
  process.on("exit", cleanup);
  try {
    if (!(await waitOk(ORIGIN + "/", 60000))) fail("Vite không lên trong 60s.");
    log(`vite lên tại ${ORIGIN}`);
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      let alive = false;
      try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
      if (!alive) {
        log(`Xvfb: socket ${DISPLAY} mồ côi, xoá và bật mới`);
        try { fs.unlinkSync(sock); } catch {}
        try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
      } else log(`dùng chung Xvfb ${DISPLAY}`);
    }
    if (!fs.existsSync(sock)) {
      xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
      for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
      if (!fs.existsSync(sock)) fail(`Xvfb không tạo socket ${DISPLAY}`);
    }
    const profile = path.join(os.homedir(), "workspace", `tmp-round37-t5-chrome-ct-${process.pid}`);
    profileDir = profile;
    chrome = spawn(CHROME, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) fail("không nhận được sessionId");
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    await cdp.send("DOM.enable", {}, cdp.sessionId);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
    await sleep(2000);
    await cdp.evaluate(PAGE.seedEmpty, cdp.sessionId);
    await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(PAGE.ready, cdp.sessionId).catch(() => false);
    }
    if (!ready) fail("app không ready sau 90s");
    log("app ready (project seed rỗng)");

    // Bật cờ WebCodecs trước khi phát ngược.
    await cdp.evaluate(PAGE.enableWcFlag, cdp.sessionId);
    // Tắt proxy tự động để clip phát bản gốc (điều kiện cổng S4).
    const proxyToggle = await cdp.evaluate(PAGE.uncheckAutoProxy, cdp.sessionId);
    log(`toggle proxy tự động: ${proxyToggle}`);

    // Import file noise qua input file thật của MediaBin.
    const doc = await cdp.send("DOM.getDocument", { depth: 0 }, cdp.sessionId);
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" }, cdp.sessionId);
    if (!q.nodeId) fail("không tìm thấy input file MediaBin");
    await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [NOISE] }, cdp.sessionId, 60000);
    log(`đã nạp ${BASE}, chờ card + duration...`);
    let imported = false;
    for (let i = 0; i < 120 && !imported; i++) {
      await sleep(1000);
      const names = await cdp.evaluate(PAGE.mediaNames, cdp.sessionId).catch(() => []);
      imported = names.some((n) => n.includes(BASE));
      if (i % 15 === 14) log(`  ...đang chờ import (${i + 1}s), names=${JSON.stringify(names)}`);
    }
    if (!imported) fail(`import video không hiện trong MediaBin sau 120s (tìm ${BASE})`);
    let durKnown = false;
    for (let i = 0; i < 60 && !durKnown; i++) {
      await sleep(1000);
      durKnown = await cdp.evaluate(`!!document.querySelector(".media-dur")`, cdp.sessionId).catch(() => false);
    }
    if (!durKnown) fail("MediaBin chưa đo xong duration video sau 60s");
    log(`import OK: ${BASE} (duration đã đo)`);
    const addRes = await cdp.evaluate(`(${PAGE.clickAddFor})(${JSON.stringify(BASE)})`, cdp.sessionId);
    if (addRes !== "clicked") fail(`không bấm được nút Thêm: ${addRes}`);
    await sleep(2000);
    const s0 = await cdp.evaluate(PAGE.sample, cdp.sessionId);
    log(`sau khi thêm clip: time=${s0.timeText} stats=${JSON.stringify(s0.stats)} wc=${JSON.stringify(s0.wc)} centerMean=${s0.centerMean}`);

    // Phát ngược: End -> cuối timeline, bấm Phát ngược, đo 14 s.
    await cdp.evaluate(PAGE.pressEnd, cdp.sessionId);
    await sleep(1500);
    const preRev = await cdp.evaluate(PAGE.sample, cdp.sessionId);
    log(`trước phát ngược: time=${preRev.timeText} centerMean=${preRev.centerMean}`);
    const revClick = await cdp.evaluate(`(${PAGE.clickTransport})("reverse")`, cdp.sessionId);
    if (revClick !== "clicked") fail(`không bấm được nút Phát ngược: ${revClick}`);
    const rev = [];
    for (let i = 0; i < 28; i++) {
      await sleep(500);
      rev.push(await cdp.evaluate(PAGE.sample, cdp.sessionId));
    }
    await cdp.evaluate(`(${PAGE.clickTransport})("reverse")`, cdp.sessionId);
    await sleep(500);
    const afterStop = await cdp.evaluate(PAGE.sample, cdp.sessionId);
    log(`sau khi dừng: app vẫn đáp evaluate, time=${afterStop.timeText} centerMean=${afterStop.centerMean}`);

    const first = preRev.stats || { draw: 0, hold: 0, skip: 0 };
    const last = rev[rev.length - 1]?.stats || first;
    const drawDelta = (last.draw || 0) - (first.draw || 0);
    const holdDelta = (last.hold || 0) - (first.hold || 0);
    const wcLast = rev[rev.length - 1]?.wc || null;
    const wcHits = wcLast ? wcLast.hits : null;
    const wcMisses = wcLast ? wcLast.misses : null;
    // Nền renderFrame #0a0c10 có mean (10+12+16)/3 = 12.67: mẫu nào
    // quanh 12.67 (±2) là canvas chưa vẽ frame — KHÔNG tính là nội dung.
    const BG_MEAN = (10 + 12 + 16) / 3;
    const isContent = (s) => s.centerMean !== null && Math.abs(s.centerMean - BG_MEAN) > 2;
    const contentIndices = rev.map((s, i) => (isContent(s) ? i : -1)).filter((i) => i >= 0);
    const firstContentIndex = contentIndices.length ? contentIndices[0] : null;
    const reverseBadgeSeen = rev.some((s) => s.reverseBadge);
    const timeTexts = rev.map((s) => s.timeText);
    const routingChecks = {
      reverseBadgeSeen,
      elementDrawn: drawDelta > 0,
      wcDeclinedEveryDraw: wcHits === 0 && (wcMisses || 0) > 0,
      appResponsiveAfterStop: afterStop.centerMean !== null,
    };
    const checks = {
      ...routingChecks,
      videoContentDrawn: contentIndices.length >= 1,
      videoContentEarly: firstContentIndex !== null && firstContentIndex <= 7,
    };
    const routingOk = Object.values(routingChecks).every(Boolean);
    const verdict = Object.values(checks).every(Boolean)
      ? "PASS"
      : routingOk && checks.videoContentDrawn
        ? "PARTIAL"
        : "FAIL";
    const result = {
      noiseFile: NOISE,
      noiseBytes: NOISE_BYTES,
      appOrigin: ORIGIN,
      proxyToggle,
      preReverse: preRev,
      reverseSamples: rev,
      afterStop,
      drawDelta,
      holdDelta,
      wcHits,
      wcMisses,
      backgroundMean: +BG_MEAN.toFixed(3),
      contentIndices,
      firstContentIndex,
      timeTexts,
      checks,
      verdict,
      verdictNote: verdict === "PARTIAL"
        ? "Routing fallback đúng (wcHits 0, badge, playhead lùi) và có frame thật, nhưng frame thật tới muộn (firstContentIndex > 7): trước đó canvas chỉ vẽ nền #0a0c10 do skip (guard K4) trong lúc element seek đuổi target trên GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] — độ trễ của đường element cũ, không phải do code T5."
        : "",
    };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileEpermRetry(OUT, JSON.stringify(result, null, 2));
    log(`kết quả ghi tại ${OUT}`);
    for (const [k, v] of Object.entries(checks)) log(`check ${k}: ${v ? "PASS" : "FAIL"}`);
    log(`drawDelta=${drawDelta} holdDelta=${holdDelta} wcHits=${wcHits} wcMisses=${wcMisses} firstContentIndex=${firstContentIndex} badge=${reverseBadgeSeen}`);
    log(`T5 CLICKTEST: ${verdict}${result.verdictNote ? " — " + result.verdictNote : ""}`);
    cleanup();
    process.exit(verdict === "PASS" ? 0 : 1);
  } catch (e) {
    console.error(`CLICKTEST LỖI: ${e instanceof Error ? e.message : e}`);
    cleanup();
    process.exit(2);
  }
}
main();
