// webkit_clipd_appswap_91s3.mjs — Phase 9 đợt 91, luồng S3 (c):
// Đo swap-trượt của blob prefetch TRONG APP THẬT. Bài học từ lần chạy đầu:
// preview của app KHÔNG gắn <video> vào DOM (MediaPool giữ element rời,
// vẽ lên canvas qua drawImage) nên querySelectorAll("video") luôn rỗng.
// Cách đo đúng: addInitScript vá HTMLMediaElement.prototype.src (ghi lại
// mọi lần gán src: http -> blob -> http) + play()/error, và lấy mẫu canvas
// preview để biết khung hình có chạy thật không.
// Flow mỗi run: mở app (context mới) -> tắt overlay chào mừng -> import
// clip 1080p c2h.mp4 -> chờ proxy 720p xong (auto) -> bấm "Thêm vào
// timeline" (nút của c2h.mp4) rồi bấm Phát NGAY -> ghi log src 20 s ->
// pause rồi phát lại (lần 2) -> đọc log.
// Chạy: APP_URL=http://localhost:4173/ APP_CLIP=<clip 1080p>
//   DISPLAY=:199 GST_PLUGIN_PATH=... node benchmarks/render/webkit_clipd_appswap_91s3.mjs [RUNS]
// Kết quả append vào benchmarks/results/webkit-clipd-appswap-92t1.json.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const browserType = pw.webkit;
const APP_URL = process.env.APP_URL || "http://localhost:4173/";
const CLIP = process.env.APP_CLIP || "/home/hatch/workspace/round91-s3/clips/c2h.mp4";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-clipd-appswap-92t1.json");

function withTimeout(p, ms, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(label + "-timeout-" + ms + "ms")), ms); });
  try { return Promise.race([p, to]); } finally { clearTimeout(timer); }
}

// Vá src/play/error của mọi <video> TRƯỚC khi app load (kể cả element rời
// mà MediaPool giữ, không gắn DOM). Log vào window.__vcutSrcLog.
const INIT_SCRIPT = `(() => {
  window.__vcutSrcLog = [];
  window.__vcutT0 = performance.now();
  const kindOf = (s) => !s ? "empty" : s.startsWith("blob:") ? "blob" : s.startsWith("http") ? "http" : "other";
  // Gắn id cho từng element để tách các element trong log (app tạo nhiều
  // element: preview, thumbnail, audio...).
  let nextId = 1;
  const ids = new WeakMap();
  const idOf = (el) => { let id = ids.get(el); if (!id) { id = nextId++; ids.set(el, id); } return id; };
  const log = (op, el, extra) => {
    try { window.__vcutSrcLog.push({ t: +((performance.now() - window.__vcutT0) / 1000).toFixed(2), id: idOf(el), op, src: kindOf(el.src), ct: +el.currentTime.toFixed(2), paused: el.paused, vw: el.videoWidth || 0, dur: +(el.duration || 0).toFixed(1), ...(extra || {}) }); } catch {}
  };
  const proto = window.HTMLMediaElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "src");
  if (desc && desc.set) {
    Object.defineProperty(proto, "src", {
      configurable: true, enumerable: true,
      get() { return desc.get.call(this); },
      set(v) { log("src", this, { to: kindOf(v) }); desc.set.call(this, v); },
    });
  }
  const origPlay = proto.play;
  proto.play = function (...a) { log("play", this); return origPlay.apply(this, a); };
  const origPause = proto.pause;
  proto.pause = function (...a) { log("pause", this); return origPause.apply(this, a); };
  window.addEventListener("error", (e) => {
    const t = e.target;
    if (t && t.tagName === "VIDEO") log("error", t);
  }, true);
})();`;

async function runOne(runIdx) {
  const t00 = Date.now();
  const browser = await withTimeout(browserType.launch({ headless: false }), 60000, "launch");
  const result = { run: runIdx, clip: path.basename(CLIP) };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      try {
        await page.addInitScript(INIT_SCRIPT);
        await withTimeout(page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
        await withTimeout(page.waitForSelector('input[type="file"][accept*="video"]', { state: "attached", timeout: 60000 }), 65000, "waitImportInput");
        result.appMountedMs = Date.now() - t00;
        // Tắt overlay chào mừng ("Để sau") nếu có — nó che nút media-add.
        try {
          const later = page.locator('button:has-text("Để sau")').first();
          if (await later.isVisible({ timeout: 5000 })) { await later.click({ timeout: 5000 }); result.welcomeDismissed = true; }
        } catch { /* không có overlay thì thôi */ }
        const input = page.locator('input[type="file"][accept*="video"]').first();
        await input.setInputFiles(CLIP);
        result.importedAtMs = Date.now() - t00;
        await withTimeout(page.waitForSelector(".media-name", { timeout: 60000 }), 65000, "waitMediaName");
        // Chờ proxy: nút .media-proxy có title "Đang dùng proxy ..." (proxyOnTitle).
        const proxyReady = async (timeoutMs) => {
          const t0 = Date.now();
          while (Date.now() - t0 < timeoutMs) {
            const ok = await page.evaluate(() => [...document.querySelectorAll("button.media-proxy")].some((b) => (b.getAttribute("title") || "").startsWith("Đang dùng proxy")));
            if (ok) return true;
            await new Promise((r) => setTimeout(r, 500));
          }
          return false;
        };
        let proxyOk = await proxyReady(90000);
        result.proxyAuto = proxyOk;
        if (!proxyOk) {
          try { await page.locator("button.media-proxy").first().click({ timeout: 10000 }); result.proxyManualClicked = true; } catch (e) { result.proxyManualClickErr = String(e && e.message).slice(0, 120); }
          proxyOk = await proxyReady(120000);
        }
        result.proxyReadyMs = Date.now() - t00;
        result.proxyOk = proxyOk;
        if (!proxyOk) { result.note = "proxy không xong trong thời gian chờ — dừng run này trước khi đo swap"; return result; }
        // Lấy proxyUrl thật (để đối chiếu log src): đọc từ network log của page.
        // Thêm clip c2h.mp4 vào timeline rồi Phát NGAY.
        const clipName = path.basename(CLIP);
        const tAdd0 = Date.now();
        await page.locator(`button.media-add[aria-label*="${clipName}"]`).first().click({ timeout: 20000 });
        result.addClickedAtMs = Date.now() - t00;
        await page.locator('button[aria-label="Phát (Space)"]').first().click({ timeout: 10000 });
        result.addToPlayGapMs = Date.now() - tAdd0;
        result.playClickedAtMs = Date.now() - t00;
        // Quan sát 20 s: log src + trạng thái nút play + mẫu canvas preview.
        const canvasSample = async () => page.evaluate(() => {
          const cs = [...document.querySelectorAll("canvas")];
          // Canvas preview là canvas lớn nhất trong vùng preview.
          let best = null, bestArea = 0;
          for (const c of cs) { const a = c.width * c.height; if (a > bestArea) { bestArea = a; best = c; } }
          if (!best) return null;
          try { return { w: best.width, h: best.height, hash: best.toDataURL().length + ":" + best.toDataURL().slice(30, 60) }; } catch { return { w: best.width, h: best.height, hash: "tainted" }; }
        });
        const c1 = await canvasSample();
        await new Promise((r) => setTimeout(r, 3000));
        const c2 = await canvasSample();
        // Lần phát thứ 2: pause NGAY khi còn đang phát (clip chỉ 8 s —
        // chờ 20 s thì phát đã xong, không còn nút Tạm dừng). Sau đó phát
        // lại và quan sát thêm 4 s.
        try {
          await page.locator('button[aria-label="Tạm dừng (Space)"]').first().click({ timeout: 10000 });
          result.pausedAtMs = Date.now() - t00;
          await new Promise((r) => setTimeout(r, 800));
          await page.locator('button[aria-label="Phát (Space)"]').first().click({ timeout: 10000 });
          result.replayedAtMs = Date.now() - t00;
          await new Promise((r) => setTimeout(r, 4000));
        } catch (e) { result.secondPlayErr = String(e && e.message).slice(0, 160); }
        const c3 = await canvasSample();
        result.canvasSamples = [c1, c2, c3];
        result.canvasChanged = !!(c1 && c2 && c1.hash !== c2.hash) || !!(c2 && c3 && c2.hash !== c3.hash);
        result.playLabelAfter = await page.evaluate(() => document.querySelector('button[aria-label="Tạm dừng (Space)"]') ? "Tạm dừng" : (document.querySelector('button[aria-label="Phát (Space)"]') ? "Phát" : "?"));
        result.srcLog = await page.evaluate(() => window.__vcutSrcLog || []);
        return result;
      } catch (e) { result.runError = String(e && e.message).slice(0, 300); return result; }
    } finally { try { await withTimeout(page.close(), 15000, "pageClose"); } catch {} }
  } finally { try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {} }
}

const results = { date: new Date().toISOString(), round: "phase9-round92-t1", appUrl: APP_URL, clip: CLIP, cases: [] };
let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); if (prev && Array.isArray(prev.cases)) results.cases = prev.cases; } catch {}
const runs = Math.max(1, parseInt(process.argv[2] || "1", 10));
const startIdx = Math.max(1, parseInt(process.env.Q6_START || "1", 10));
for (let i = startIdx; i < startIdx + runs; i++) {
  let r;
  try { r = await runOne(i); } catch (e) { r = { run: i, runError: String(e && e.message).slice(0, 300) }; }
  const log = r.srcLog || [];
  const byId = {};
  for (const e of log) { (byId[e.id] = byId[e.id] || []).push(e); }
  // Element video chính: element có play() và videoWidth lớn nhất.
  let mainId = null, mainVw = -1;
  for (const [id, es] of Object.entries(byId)) {
    const vw = Math.max(...es.map((x) => x.vw || 0));
    const hasPlay = es.some((x) => x.op === "play");
    if (hasPlay && vw >= mainVw) { mainVw = vw; mainId = id; }
  }
  const main = mainId ? byId[mainId] : [];
  const mainSrcOps = main.filter((x) => x.op === "src").map((x) => `${x.t}s:${x.src}->${x.to}`).join(" ");
  const mainPlayOps = main.filter((x) => x.op === "play").map((x) => `${x.t}s:${x.src}@ct${x.ct}`).join(" ");
  console.log(`APP-run${i}`, JSON.stringify({ proxyOk: r.proxyOk, proxyReadyMs: r.proxyReadyMs,
    addToPlayGapMs: r.addToPlayGapMs, pausedAtMs: r.pausedAtMs, replayedAtMs: r.replayedAtMs,
    playLabelAfter: r.playLabelAfter, canvasChanged: r.canvasChanged,
    mainVideoId: mainId, mainVw, mainSrcOps: mainSrcOps || null, mainPlayOps: mainPlayOps || null,
    errorOps: log.filter((x) => x.op === "error").length,
    secondPlayErr: r.secondPlayErr || null, runError: r.runError || null }));
  results.cases.push({ name: `APP-run${i}`, date: new Date().toISOString(), ...r });
  await writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
}
console.log("DONE", OUT);
