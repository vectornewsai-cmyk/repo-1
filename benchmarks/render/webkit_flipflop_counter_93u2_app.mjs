// webkit_flipflop_counter_93u2_app.mjs — Phase 9 đợt 93, luồng U2:
// ĐO ĐỐI CHỨNG sau fix flip-flop T1 (latch srcLatch trong media.ts) TRONG APP
// THẬT (vite preview dist + bridge 8787), clip 1080p c2h.mp4 -> proxy 720p.
// Ba pha mỗi run:
//   (b1) Bấm Phát NGAY sau "Thêm vào timeline" (mục tiêu <400ms sau khi
//        videoFor gọi lần đầu): src chốt gì (http vì blob chưa về kịp?),
//        có flip blob<->http trong lúc phát không, có stall không.
//   (c)  Pause ở ct!=0 -> phát lại: src có giữ nguyên http đã chốt không?
//        Rồi Home (scrub về 0) -> bấm Phát NGAY (<400ms sau seek): có
//        upgrade http->blob trước khi phát không, phát trên src nào, có
//        flip trong 4 s sau không.
//   (c2) PHA 4 (từ run7): TẠM DỪNG rồi Home về 0, chờ 800 ms cho element
//        pristine thật (paused + ct=0) rồi mới phát: kiểm tra upgrade
//        http->blob có xảy ra không — pha 3 bấm Home lúc đang phát nên
//        element không bao giờ pristine, không phân biệt được "blob chưa
//        cache" với "chưa có khoảnh khắc pristine".
// Kỳ vọng theo code latch (media.ts videoFor + prefetch callback):
//   lần phát đầu chốt http -> phát lại vẫn http tới khi scrub về 0; scrub
//   về 0 -> upgrade http->blob đúng 1 lần rồi giữ blob; flip-flop = 0.
// Chạy: APP_URL=http://127.0.0.1:4173/ APP_CLIP=<clip 1080p>
//   DISPLAY=:199 GST_PLUGIN_PATH=... node benchmarks/render/webkit_flipflop_counter_93u2_app.mjs [RUNS]
// Kết quả append vào benchmarks/results/webkit-flipflop-counter-93u2-app.json.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const browserType = pw.webkit;
const APP_URL = process.env.APP_URL || "http://127.0.0.1:4173/";
const CLIP = process.env.APP_CLIP || "/home/hatch/workspace/round91-s3/clips/c2h.mp4";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-flipflop-counter-93u2-app.json");

function withTimeout(p, ms, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(label + "-timeout-" + ms + "ms")), ms); });
  try { return Promise.race([p, to]); } finally { clearTimeout(timer); }
}

const INIT_SCRIPT = `(() => {
  window.__vcutSrcLog = [];
  window.__vcutT0 = performance.now();
  const kindOf = (s) => !s ? "empty" : s.startsWith("blob:") ? "blob" : s.startsWith("http") ? "http" : "other";
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

// Đọc trạng thái các <video> thật của app qua hook __vcutMediaEls
// (preview.tsx) — dùng để lấy mẫu ct/pause trong lúc phát + xác nhận seek.
const ELS_FN = `((window.__vcutMediaEls || []).map((e) => {
  const v = e.el || e;
  return { src: (v.currentSrc || v.src || "").startsWith("blob:") ? "blob" : ((v.currentSrc || v.src || "").startsWith("http") ? "http" : "other"), t: +v.currentTime.toFixed(2), paused: v.paused, seeking: v.seeking, vw: v.videoWidth || 0 };
}))`;

async function runOne(runIdx) {
  const t00 = Date.now();
  const browser = await withTimeout(browserType.launch({ headless: false }), 60000, "launch");
  const result = { run: runIdx, clip: path.basename(CLIP), phases: {} };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      try {
        await page.addInitScript(INIT_SCRIPT);
        await withTimeout(page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
        await withTimeout(page.waitForSelector('input[type="file"][accept*="video"]', { state: "attached", timeout: 60000 }), 65000, "waitImportInput");
        result.appMountedMs = Date.now() - t00;
        try {
          const later = page.locator('button:has-text("Để sau")').first();
          if (await later.isVisible({ timeout: 5000 })) { await later.click({ timeout: 5000 }); result.welcomeDismissed = true; }
        } catch { /* không có overlay thì thôi */ }
        const input = page.locator('input[type="file"][accept*="video"]').first();
        await input.setInputFiles(CLIP);
        result.importedAtMs = Date.now() - t00;
        await withTimeout(page.waitForSelector(".media-name", { timeout: 60000 }), 65000, "waitMediaName");
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
        if (!proxyOk) { result.note = "proxy không xong trong thời gian chờ — dừng run này trước khi đo"; return result; }

        const clipName = path.basename(CLIP);
        const canvasSample = async () => page.evaluate(() => {
          const cs = [...document.querySelectorAll("canvas")];
          let best = null, bestArea = 0;
          for (const c of cs) { const a = c.width * c.height; if (a > bestArea) { bestArea = a; best = c; } }
          if (!best) return null;
          try { return { w: best.width, h: best.height, hash: best.toDataURL().length + ":" + best.toDataURL().slice(30, 60) }; } catch { return { w: best.width, h: best.height, hash: "tainted" }; }
        });
        const sampleEls = async () => { try { return await page.evaluate(ELS_FN); } catch { return null; } };
        // Sampler nền: lấy mẫu ct mỗi 250 ms trong lúc quan sát phát.
        let samples = [];
        let samplerOn = false;
        const samplerStart = () => { samples = []; samplerOn = true; (async () => { while (samplerOn) { const s = await sampleEls(); if (s) samples.push({ t: +(Date.now() - t00) / 1000, els: s }); await new Promise((r) => setTimeout(r, 250)); } })(); };
        const samplerStop = () => { samplerOn = false; const out = samples; samples = []; return out; };

        // ---- PHA 1 (b1): thêm vào timeline -> Phát NGAY (<400ms) ----
        const p1 = result.phases.p1 = {};
        const logLenBefore = await page.evaluate(() => (window.__vcutSrcLog || []).length);
        const tAdd0 = Date.now();
        const addRes = await page.evaluate((name) => {
          const b = document.querySelector(`button.media-add[aria-label*="${name}"]`);
          if (!b) return "no-add-btn";
          b.click();
          return "clicked-add";
        }, clipName);
        p1.addRes = addRes;
        if (addRes !== "clicked-add") { result.note = "không bấm được nút thêm clip: " + addRes; return result; }
        // Chờ videoFor gọi lần đầu (src op mới) rồi bấm Phát ngay trong
        // cùng 1 evaluate để gap nhỏ nhất.
        const fast = await page.evaluate(async (before) => {
          const t0 = performance.now();
          let sawSrcAt = null;
          while (performance.now() - t0 < 300) {
            const log = window.__vcutSrcLog || [];
            if (log.length > before && log.slice(before).some((e) => e.op === "src")) { sawSrcAt = performance.now(); break; }
            await new Promise((r) => setTimeout(r, 10));
          }
          const play = document.querySelector('button[aria-label="Phát (Space)"]');
          const clicked = !!play;
          if (play) play.click();
          return { sawSrcAt: sawSrcAt ? +((sawSrcAt - window.__vcutT0) / 1000).toFixed(2) : null,
            playClickT: +((performance.now() - window.__vcutT0) / 1000).toFixed(2), clicked };
        }, logLenBefore);
        p1.addToPlayGapMs = Date.now() - tAdd0;
        p1.firstSrcToPlayGapMs = (fast.sawSrcAt !== null)
          ? Math.round((fast.playClickT - fast.sawSrcAt) * 1000)
          : null;
        p1.playClicked = fast.clicked;
        p1.firstSrcT = fast.sawSrcAt;
        p1.playClickT = fast.playClickT;
        // Marker pha trong srcLog để gán play op đúng pha (app có thể gọi
        // play() thêm vài lần ngoài lần bấm của probe).
        await page.evaluate(() => window.__vcutSrcLog.push({ t: +((performance.now() - window.__vcutT0) / 1000).toFixed(2), id: 0, op: "MARK", src: "p1-play", ct: 0, paused: true, vw: 0, dur: 0 }));
        result.addClickedAtMs = Date.now() - t00;
        const c1 = await canvasSample();
        samplerStart();
        await new Promise((r) => setTimeout(r, 3000));
        const c2 = await canvasSample();
        p1.samples = samplerStop();
        p1.canvasChanged = !!(c1 && c2 && c1.hash !== c2.hash);
        p1.playLabelAfter = await page.evaluate(() => document.querySelector('button[aria-label="Tạm dừng (Space)"]') ? "Tạm dừng" : (document.querySelector('button[aria-label="Phát (Space)"]') ? "Phát" : "?"));

        // ---- PHA 2 (c): pause ở ct!=0 -> phát lại ----
        const p2 = result.phases.p2 = {};
        const pauseRes = await page.evaluate(() => {
          const b = document.querySelector('button[aria-label="Tạm dừng (Space)"]');
          if (!b) return "no-pause-btn";
          b.click();
          return "clicked-pause";
        });
        p2.pauseRes = pauseRes;
        p2.pausedAtMs = Date.now() - t00;
        await new Promise((r) => setTimeout(r, 800));
        p2.elsAtPause = await sampleEls();
        await page.evaluate(() => window.__vcutSrcLog.push({ t: +((performance.now() - window.__vcutT0) / 1000).toFixed(2), id: 0, op: "MARK", src: "p2-replay", ct: 0, paused: true, vw: 0, dur: 0 }));
        const replayRes = await page.evaluate(() => {
          const b = document.querySelector('button[aria-label="Phát (Space)"]');
          if (!b) return "no-play-btn";
          b.click();
          return "clicked-play";
        });
        p2.replayRes = replayRes;
        p2.replayedAtMs = Date.now() - t00;
        samplerStart();
        await new Promise((r) => setTimeout(r, 4000));
        const c3 = await canvasSample();
        p2.samples = samplerStop();
        p2.canvasChanged = !!(c2 && c3 && c2.hash !== c3.hash);
        p2.playLabelAfter = await page.evaluate(() => document.querySelector('button[aria-label="Tạm dừng (Space)"]') ? "Tạm dừng" : (document.querySelector('button[aria-label="Phát (Space)"]') ? "Phát" : "?"));

        // ---- PHA 3 (b2+c): Home (scrub về 0) -> Phát NGAY (<400ms) ----
        const p3 = result.phases.p3 = {};
        p3.elsBeforeHome = await sampleEls();
        const tHome0 = Date.now();
        await page.keyboard.press("Home");
        await page.evaluate(() => window.__vcutSrcLog.push({ t: +((performance.now() - window.__vcutT0) / 1000).toFixed(2), id: 0, op: "MARK", src: "p3-play", ct: 0, paused: true, vw: 0, dur: 0 }));
        const homeRes = await page.evaluate(() => {
          const play = document.querySelector('button[aria-label="Phát (Space)"]');
          if (!play) return "no-play-btn";
          play.click();
          return "clicked-play";
        });
        p3.homeRes = homeRes;
        p3.homeToPlayGapMs = Date.now() - tHome0;
        p3.playedAtMs = Date.now() - t00;
        samplerStart();
        await new Promise((r) => setTimeout(r, 4000));
        const c4 = await canvasSample();
        p3.samples = samplerStop();
        p3.canvasChanged = !!(c3 && c4 && c3.hash !== c4.hash);
        p3.elsAfter = await sampleEls();
        p3.playLabelAfter = await page.evaluate(() => document.querySelector('button[aria-label="Tạm dừng (Space)"]') ? "Tạm dừng" : (document.querySelector('button[aria-label="Phát (Space)"]') ? "Phát" : "?"));

        // ---- PHA 4 (c, bổ sung từ run7): TẠM DỪNG rồi scrub về 0 ----
        // Pha 3 bấm Home lúc đang phát nên element không bao giờ pristine
        // (ct>0 ngay sau seek) -> không upgrade được. Pha 4 tạo khoảnh
        // khắc pristine thật: pause -> Home -> chờ 800 ms (vài tick
        // videoFor lúc paused + ct=0) -> đọc src (kỳ vọng upgrade
        // http->blob nếu blob đã cache) -> phát lại.
        const p4 = result.phases.p4 = {};
        const pause4Res = await page.evaluate(() => {
          const b = document.querySelector('button[aria-label="Tạm dừng (Space)"]');
          if (!b) return "no-pause-btn";
          b.click();
          return "clicked-pause";
        });
        p4.pauseRes = pause4Res;
        await new Promise((r) => setTimeout(r, 300));
        p4.elsAtPause = await sampleEls();
        const tHome4 = Date.now();
        await page.keyboard.press("Home");
        await new Promise((r) => setTimeout(r, 800));
        p4.elsAfterHome = await sampleEls();
        p4.homeToReadGapMs = Date.now() - tHome4;
        await page.evaluate(() => window.__vcutSrcLog.push({ t: +((performance.now() - window.__vcutT0) / 1000).toFixed(2), id: 0, op: "MARK", src: "p4-play", ct: 0, paused: true, vw: 0, dur: 0 }));
        const play4Res = await page.evaluate(() => {
          const b = document.querySelector('button[aria-label="Phát (Space)"]');
          if (!b) return "no-play-btn";
          b.click();
          return "clicked-play";
        });
        p4.playRes = play4Res;
        p4.playedAtMs = Date.now() - t00;
        samplerStart();
        await new Promise((r) => setTimeout(r, 3000));
        const c5 = await canvasSample();
        p4.samples = samplerStop();
        p4.canvasChanged = !!(c4 && c5 && c4.hash !== c5.hash);
        p4.elsAfter = await sampleEls();
        p4.playLabelAfter = await page.evaluate(() => document.querySelector('button[aria-label="Tạm dừng (Space)"]') ? "Tạm dừng" : (document.querySelector('button[aria-label="Phát (Space)"]') ? "Phát" : "?"));

        result.canvasSamples = [c1, c2, c3, c4, c5];
        result.srcLog = await page.evaluate(() => window.__vcutSrcLog || []);
        return result;
      } catch (e) { result.runError = String(e && e.message).slice(0, 300); return result; }
    } finally { try { await withTimeout(page.close(), 15000, "pageClose"); } catch {} }
  } finally { try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {} }
}

// Tóm tắt 1 run từ srcLog + samples: đếm flip-flop, src ở từng lần play,
// stall (ct đứng yên >=1,5 s trong lúc !paused). Play op được gán theo
// MARK pha đã chèn vào srcLog lúc bấm (p1-play / p2-replay / p3-play / p4-play).
function summarize(r) {
  const log = r.srcLog || [];
  const byId = {};
  for (const e of log) { (byId[e.id] = byId[e.id] || []).push(e); }
  let mainId = null, mainVw = -1;
  for (const [id, es] of Object.entries(byId)) {
    const vw = Math.max(...es.map((x) => x.vw || 0));
    const hasPlay = es.some((x) => x.op === "play");
    if (hasPlay && vw >= mainVw) { mainVw = vw; mainId = id; }
  }
  const main = mainId ? byId[mainId] : [];
  const srcOps = main.filter((x) => x.op === "src");
  let kindChanges = 0;
  for (let i = 1; i < srcOps.length; i++) if (srcOps[i].to !== srcOps[i - 1].to) kindChanges++;
  const playOps = main.filter((x) => x.op === "play");
  const errorOps = log.filter((x) => x.op === "error");
  const p1 = r.phases.p1 || {}, p2 = r.phases.p2 || {}, p3 = r.phases.p3 || {};
  // Gán play op theo MARK pha (chắc hơn thứ tự thời gian vì app có thể gọi
  // play() thêm vài lần trong 1 pha).
  const logIdx = new Map();
  log.forEach((e, i) => logIdx.set(e, i));
  const firstPlayAfterMark = (mark) => {
    const mi = log.findIndex((e) => e.op === "MARK" && e.src === mark);
    if (mi < 0) return null;
    return main.find((e) => e.op === "play" && (logIdx.get(e) ?? -1) > mi) || null;
  };
  const p1Play = firstPlayAfterMark("p1-play") || playOps.find((x) => x.t >= (p1.playClickT ?? 0)) || null;
  const p2Play = firstPlayAfterMark("p2-replay");
  const p3Play = firstPlayAfterMark("p3-play");
  const p4 = r.phases.p4 || {};
  const p4Play = firstPlayAfterMark("p4-play");
  // Upgrade http->blob xảy ra giữa MARK p3-play và MARK p4-play (tức là
  // trong lúc pause + Home + chờ 800 ms ở pha 4), hoặc trước đó.
  const markIdx = (m) => log.findIndex((e) => e.op === "MARK" && e.src === m);
  const iP3 = markIdx("p3-play"), iP4 = markIdx("p4-play");
  const upgradeInP4 = (iP3 >= 0 && iP4 >= 0)
    ? srcOps.some((x) => {
        const li = logIdx.get(x) ?? -1;
        return li > iP3 && li < iP4 && x.to === "blob" && srcOps[srcOps.indexOf(x) - 1]?.to === "http";
      })
    : false;
  const upgradeBeforeP4Play = p4Play
    ? srcOps.some((x, i) => i > 0 && srcOps[i - 1].to === "http" && x.to === "blob" && x.t < p4Play.t && (!p3Play || x.t > p3Play.t))
    : false;
  const stallOf = (samples) => {
    const stalls = [];
    if (!samples || samples.length < 2) return stalls;
    let runStart = null;
    const ctOf = (s) => {
      const els = s.els || [];
      let best = null;
      for (const e of els) if (!best || (e.vw || 0) > (best.vw || 0)) best = e;
      return best;
    };
    for (let i = 1; i < samples.length; i++) {
      const a = ctOf(samples[i - 1]), b = ctOf(samples[i]);
      if (!a || !b) continue;
      const frozen = Math.abs(b.t - a.t) < 0.015 && !b.paused && !b.seeking;
      if (frozen && runStart === null) runStart = samples[i - 1];
      if ((!frozen || i === samples.length - 1) && runStart !== null) {
        const dur = samples[i].t - runStart.t;
        if (dur >= 1.5) stalls.push({ fromT: +runStart.t.toFixed(2), durS: +dur.toFixed(2), ct: ctOf(runStart).t });
        runStart = null;
      }
    }
    return stalls;
  };
  const upgradeBeforeP3 = p3Play
    ? srcOps.some((x, i) => i > 0 && srcOps[i - 1].to === "http" && x.to === "blob" && x.t < p3Play.t && (!p2Play || x.t > p2Play.t))
    : false;
  return {
    proxyOk: r.proxyOk, proxyReadyMs: r.proxyReadyMs,
    mainVideoId: mainId, mainVw,
    srcOpsTotal: srcOps.length, kindChanges,
    srcSeq: srcOps.map((x) => `${x.t}s:${x.src}->${x.to}`).join(" "),
    playOpsTotal: playOps.length,
    playOps: playOps.slice(0, 12).map((x) => `${x.t}s:${x.src}@ct${x.ct}`).join(" "),
    errorOps: errorOps.length,
    p1: { addToPlayGapMs: p1.addToPlayGapMs, firstSrcToPlayGapMs: p1.firstSrcToPlayGapMs,
      playClicked: p1.playClicked, firstPlaySrc: p1Play ? p1Play.src : null,
      firstPlayCt: p1Play ? p1Play.ct : null, canvasChanged: p1.canvasChanged,
      playLabelAfter: p1.playLabelAfter, stalls: stallOf(p1.samples) },
    p2: { pauseRes: p2.pauseRes, replayRes: p2.replayRes,
      elsAtPause: p2.elsAtPause, replaySrc: p2Play ? p2Play.src : null,
      replayCt: p2Play ? p2Play.ct : null, canvasChanged: p2.canvasChanged,
      playLabelAfter: p2.playLabelAfter, stalls: stallOf(p2.samples) },
    p3: { homeToPlayGapMs: p3.homeToPlayGapMs, homeRes: p3.homeRes,
      elsBeforeHome: p3.elsBeforeHome, elsAfter: p3.elsAfter,
      playSrc: p3Play ? p3Play.src : null, playCt: p3Play ? p3Play.ct : null,
      upgradeBeforePlay: upgradeBeforeP3, canvasChanged: p3.canvasChanged,
      playLabelAfter: p3.playLabelAfter, stalls: stallOf(p3.samples) },
    p4: { pauseRes: p4.pauseRes, playRes: p4.playRes,
      elsAtPause: p4.elsAtPause, elsAfterHome: p4.elsAfterHome,
      homeToReadGapMs: p4.homeToReadGapMs,
      upgradeInP4, upgradeBeforePlay: upgradeBeforeP4Play,
      playSrc: p4Play ? p4Play.src : null, playCt: p4Play ? p4Play.ct : null,
      canvasChanged: p4.canvasChanged,
      playLabelAfter: p4.playLabelAfter, stalls: stallOf(p4.samples) },
    runError: r.runError || null,
  };
}

const results = { date: new Date().toISOString(), round: "phase9-round93-u2-app", appUrl: APP_URL, clip: CLIP, cases: [] };
let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); if (prev && Array.isArray(prev.cases)) results.cases = prev.cases; } catch {}
const runs = Math.max(1, parseInt(process.argv[2] || "1", 10));
const startIdx = Math.max(1, parseInt(process.env.Q6_START || "1", 10));
for (let i = startIdx; i < startIdx + runs; i++) {
  let r;
  try { r = await runOne(i); } catch (e) { r = { run: i, runError: String(e && e.message).slice(0, 300) }; }
  const sum = summarize(r);
  console.log(`APP-run${i}`, JSON.stringify(sum));
  results.cases.push({ name: `APP-run${i}`, date: new Date().toISOString(), ...r, summary: sum });
  await writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
}
console.log("DONE", OUT);
