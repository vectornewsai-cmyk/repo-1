// audio-probe-202.mjs — Đợt 202 P3: đo lại hold-mute SAU C3-loop (quyết (a6)-201).
// Bản sao của audio-probe-201.mjs (chỉ đổi thư mục ra round202-p3 +
// tên file JSON audio-probe-202-* + profile Chrome; biến môi trường
// giữ tiền tố P201_ để tương thích cách gọi cũ).
// Chạy 2 pass như 201: chirp-70s (14 s, fftSize 8192) + longA-300s
// GOP300 720p (40 s, fftSize 2048), ghi JSON vào
// hidden_files/round202-p3/audio-probe-202-<tag>.json.
// Chạy: P201_AUDIO_VIDEO=<mp4> P201_REC_MS=<ms> P201_FFTSIZE=<n>
//   P201_PORT=<p> P201_CDP_PORT=<p> P201_PROFILE=<dir>
//   node audio-probe-202.mjs
// Ghi JSON vào hidden_files/round202-p3/audio-probe-202-<tag>.json
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const HOME = "/home/hatch";
const DIR201 = `${HOME}/workspace/goals/capcut-clone-video-editor/hidden_files/round202-p3`;
const VIDEO = process.env.P201_AUDIO_VIDEO || `${HOME}/workspace/tmp-round193-p3/chirp-70s.mp4`;
const TAG = path.basename(VIDEO, ".mp4");
const REC_MS = parseInt(process.env.P201_REC_MS || "14000", 10);
const FFTSIZE = parseInt(process.env.P201_FFTSIZE || "8192", 10);
const DIST = `${HOME}/workspace/repo-1/apps/web/dist`;
const PORT = parseInt(process.env.P201_PORT || "4245", 10);
const CDP_PORT = parseInt(process.env.P201_CDP_PORT || "9269", 10);
const PROFILE = process.env.P201_PROFILE || `/tmp/round202-p3-profile-${TAG}`;
const CHROME = `${HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome`;

const bundleBefore = (() => {
  try {
    return fs.readdirSync(`${DIST}/assets`).filter((f) => f.startsWith("index-") && f.endsWith(".js")).sort();
  } catch { return []; }
})();

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
    let file = path.join(DIST, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu",
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${PROFILE}`,
  "--autoplay-policy=no-user-gesture-required", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = null;
for (let i = 0; i < 90; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    if (targets.length) break;
  } catch {}
  await sleep(500);
}
if (!targets?.length) throw new Error("không lấy được CDP targets");
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(`CDP timeout ${method}`)); } }, 60000);
  });
}
async function ev(expr) {
  const r = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(`evaluate lỗi: ${JSON.stringify(r.result.exceptionDetails).slice(0, 400)}`);
  return r.result?.result?.value;
}
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/).slice(0, 3).join(" "); } catch { return "?"; } };

// Recorder trong trang: mẫu mỗi ~10 ms (setInterval), nhẹ (không wave).
const RECORDER_FN = `(()=>{
  window.__vcutRec202 = [];
  window.__vcutRec202Timer = setInterval(()=>{
    try {
      const an = window.__vcutAudioAnalyser; if(!an||!an.context) return;
      const sr = an.context.sampleRate;
      const f = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(f);
      let pk=0, pi=0; for(let i=0;i<f.length;i++){ if(f[i]>pk){pk=f[i];pi=i;} }
      const td = new Uint8Array(an.fftSize); an.getByteTimeDomainData(td);
      let sq=0, mn=255, mx=0, zc=0, prev=0;
      for(let i=0;i<td.length;i++){ const v=td[i]; if(v<mn)mn=v; if(v>mx)mx=v; const d=(v-128)/128; sq+=d*d; const sgn=d>0?1:(d<0?-1:0); if(sgn!==0){ if(prev!==0&&sgn!==prev)zc++; prev=sgn; } }
      const ra = window.__vcutReverseAudio||null;
      const hs = window.__vcutHoldStats||null;
      window.__vcutRec202.push({ t: performance.now(), ctxT: an.context.currentTime,
        ph: ra?ra.lastPlayheadSec:null, rms: +Math.sqrt(sq/td.length).toFixed(4),
        peakHz: Math.round(pi*sr/an.fftSize), peakMag: pk, waveMin: mn, waveMax: mx,
        zcrHz: Math.round(zc*sr/(2*td.length)), sr, fftSize: an.fftSize,
        c: ra?ra.counters:null, loaded: ra?ra.loaded:null,
        draw: hs?hs.draw:null, hold: hs?hs.hold:null, skip: hs?hs.skip:null });
    } catch(e){}
  }, 10);
  return true;
})()`;

const SAMPLE_FN = `(()=>{
  const td=document.querySelector(".time-display");
  const revAudio = window.__vcutReverseAudio||null;
  const audio = (()=>{try{const an=window.__vcutAudioAnalyser; if(!an||!an.context) return null; const sr=an.context.sampleRate; const f=new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(f); let pk=0,pi=0; for(let i=0;i<f.length;i++){if(f[i]>pk){pk=f[i];pi=i;}} const td2=new Uint8Array(an.fftSize); an.getByteTimeDomainData(td2); let sq=0,mn=255,mx=0,zc=0,prev=0; for(let i=0;i<td2.length;i++){const v=td2[i]; if(v<mn)mn=v; if(v>mx)mx=v; const d=(v-128)/128; sq+=d*d; const sgn=d>0?1:(d<0?-1:0); if(sgn!==0){if(prev!==0&&sgn!==prev)zc++; prev=sgn;}} return {peakHz: Math.round(pi*sr/an.fftSize), peakMag: pk, rms: +Math.sqrt(sq/td2.length).toFixed(4), waveMin: mn, waveMax: mx, zcrHz: Math.round(zc*sr/(2*td2.length)), sr, fftSize: an.fftSize};}catch(e){return {error:String(e)};}})();
  return {t: Date.now(), timeText: td?(td.textContent||"").trim():null, playheadSec: (revAudio&&typeof revAudio.lastPlayheadSec==="number")?revAudio.lastPlayheadSec:null, revAudio, audio};
})()`;

try {
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("DOM.enable");
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await sleep(2000);
  await ev(`(()=>{localStorage.setItem("vcut-welcomed","1"); localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify({format:"vcut-project",formatVersion:1,appVersion:"0.1.0",specVersion:"1",savedAt:new Date().toISOString(),name:"audio198 seed",spec:{version:"0.2.0",meta:{name:"audio198",width:1280,height:720,fps:30},tracks:[]}})); return true;})()`);
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) { await sleep(1000); ready = await ev(`!!(document.querySelector("canvas.preview-canvas") && document.querySelector(".transport"))`).catch(() => false); }
  if (!ready) throw new Error("app không ready sau 60s");
  log(`app ready, video=${VIDEO}, bundle=${JSON.stringify(bundleBefore)}, load ${loadavg()}`);
  const fftSet = await ev(`(()=>{const an=window.__vcutAudioAnalyser; if(!an) return "no-analyser"; an.fftSize=${FFTSIZE}; return an.fftSize+"@"+an.context.sampleRate;})()`).catch((e) => `loi: ${String(e).slice(0, 120)}`);
  log(`fftSize dat: ${fftSet} (yeu cau ${FFTSIZE})`);
  const base = path.basename(VIDEO);
  const doc = await cdp("DOM.getDocument", { depth: 0 });
  const q = await cdp("DOM.querySelector", { nodeId: doc.result.root.nodeId, selector: ".mediabin input[type=file]" });
  if (!q.result?.nodeId) throw new Error("không tìm thấy input file MediaBin");
  const o = await cdp("DOM.resolveNode", { nodeId: q.result.nodeId });
  const objectId = o.result?.object?.objectId;
  if (!objectId) throw new Error("không resolve được input file");
  await cdp("DOM.setFileInputFiles", { files: [VIDEO], objectId });
  let imported = false;
  for (let i = 0; i < 60 && !imported; i++) {
    await sleep(1000);
    const names = await ev(`[...document.querySelectorAll(".media-name")].map((el)=>(el.textContent||"").trim())`).catch(() => []);
    imported = names.some((n) => n.includes(base));
  }
  if (!imported) throw new Error(`import ${base} không hiện sau 60s`);
  let durKnown = false;
  for (let i = 0; i < 30 && !durKnown; i++) { await sleep(1000); durKnown = await ev(`!!document.querySelector(".media-dur")`).catch(() => false); }
  if (!durKnown) throw new Error("MediaBin chưa đo xong duration sau 30s");
  const addRes = await ev(`(()=>{const cards=[...document.querySelectorAll(".media-grid > *")]; const card=cards.find((c)=>(c.querySelector(".media-name")?.textContent||"").includes(${JSON.stringify(base)})); if(!card) return "no-card"; const btn=card.querySelector(".media-add"); if(!btn) return "no-btn"; btn.click(); return "clicked";})()`);
  if (addRes !== "clicked") throw new Error(`không bấm được nút Thêm: ${addRes}`);
  await sleep(2000);
  log("clip đã thêm");
  const clickTransport = async (want) => ev(`((want)=>{const btns=[...document.querySelectorAll(".transport button")]; const b = want==="reverse" ? btns.find((x)=>x.getAttribute("aria-label")==="Phát ngược") : btns.find((x)=>(x.textContent||"").includes(want)); if(!b) return "no-btn"; b.click(); return "clicked";})(${JSON.stringify(want)})`);
  const fwdClick = await clickTransport("▶");
  if (fwdClick !== "clicked") throw new Error("không bấm được nút phát xuôi");
  const fwdSamples = [];
  for (let i = 0; i < 6; i++) { await sleep(500); fwdSamples.push(await ev(SAMPLE_FN)); }
  await clickTransport("⏸");
  log(`xuôi: ${fwdSamples.map((s) => `${s.audio?.peakHz ?? "?"}Hz/rms${s.audio?.rms ?? "?"}`).join(" | ")}`);
  await ev(`(()=>{const ev2=new KeyboardEvent("keydown",{key:"End",code:"End",bubbles:true}); window.dispatchEvent(ev2); return true;})()`);
  await sleep(1000);
  await ev(`(()=>{const an=window.__vcutAudioAnalyser; if(an) an.fftSize=${FFTSIZE}; return true;})()`).catch(() => false);
  // Bật recorder TRƯỚC khi bấm ngược, ghi mốc click (performance.now).
  await ev(RECORDER_FN);
  const revClick = await clickTransport("reverse");
  if (revClick !== "clicked") throw new Error("không bấm được nút Phát ngược");
  const revClickT = Date.now();
  const clickPerfT = await ev(`(()=>{window.__vcutRec202ClickT = performance.now(); return window.__vcutRec202ClickT;})()`);
  const loadStart = loadavg();
  log(`da bam nguoc, ghi ${REC_MS} ms o ~10 ms/mau`);
  await sleep(REC_MS);
  const recCount = await ev(`window.__vcutRec202 ? window.__vcutRec202.length : -1`);
  await ev(`(()=>{try{clearInterval(window.__vcutRec202Timer);}catch(e){} return true;})()`);
  await clickTransport("reverse"); // dừng
  const records = await ev(`window.__vcutRec202 || []`);
  const countersEnd = records.length ? records[records.length - 1]?.c || null : null;
  const bundleAfter = (() => {
    try {
      return fs.readdirSync(`${DIST}/assets`).filter((f) => f.startsWith("index-") && f.endsWith(".js")).sort();
    } catch { return []; }
  })();
  const out = { video: VIDEO, dist: DIST, bundleBefore, bundleAfter, loadStart, loadEnd: loadavg(), fwdSamples, records, recCount, clickPerfT, revClickT, recMs: REC_MS, fftSize: FFTSIZE, ruler: TAG.includes("chirp-70s") ? "sweep-70s f=300+38.5714*t" : "periodic-10s f=300+270*(t mod 10)", countersEnd };
  fs.writeFileSync(`${DIR201}/audio-probe-202-${TAG}.json`, JSON.stringify(out, null, 2));
  // Tóm tắt nhanh (chi tiết trong analyze201.py).
  const sounding = records.filter((r) => r.rms > 0);
  const rmsVals = sounding.map((r) => r.rms);
  const c0 = records.find((r) => r.c)?.c || {};
  const cN = countersEnd || {};
  const d = (k) => (cN[k] ?? 0) - (c0[k] ?? 0);
  const IS_CHIRP70 = TAG.includes("chirp-70s");
  const SLOPE = IS_CHIRP70 ? 2700 / 70 : 270;
  const driftOf = (r) => {
    if (r.ph === null || typeof r.peakHz !== "number") return null;
    if (IS_CHIRP70) return (r.peakHz - 300) / SLOPE - r.ph;
    let ta = ((r.peakHz - 300) / 270) % 10; if (ta < 0) ta += 10;
    let dd = (ta - (r.ph % 10)) % 10; if (dd > 5) dd -= 10; if (dd < -5) dd += 10;
    return dd;
  };
  const BIN_HZ = records.find((r) => r.sr && r.fftSize) ? records.find((r) => r.sr && r.fftSize).sr / records.find((r) => r.sr && r.fftSize).fftSize : 24;
  const statStr = (vals) => {
    if (!vals.length) return "?";
    const a = vals.map((x) => Math.abs(x)).sort((x, y) => x - y);
    return `n=${vals.length} med=${a[Math.floor(a.length / 2)].toFixed(3)} p90=${a[Math.floor(a.length * 0.9)].toFixed(3)} max=${a[a.length - 1].toFixed(3)}`;
  };
  const drifts = sounding.map(driftOf).filter((x) => x !== null);
  // S2-clean: peakHz dịch < 1 bin so với mẫu sounding trước, playhead chạy >= 0,15 s.
  const lagIdx = new Set();
  for (let i = 1; i < sounding.length; i++) {
    const s = sounding[i], p = sounding[i - 1];
    if (Math.abs(s.peakHz - p.peakHz) <= BIN_HZ && s.ph !== null && p.ph !== null && Math.abs(s.ph - p.ph) >= 0.15) lagIdx.add(i);
  }
  const cleanDrifts = sounding.filter((_, i) => !lagIdx.has(i)).map(driftOf).filter((x) => x !== null);
  const loadMs = (() => { const f = records.find((r) => (r.loaded ?? 0) >= 1); return f ? Math.round(f.t - clickPerfT) : null; })();
  const firstSound = sounding[0];
  log(`KET LUAN ${TAG}: records ${records.length} (recCount luc dung ${recCount}), sounding ${sounding.length}, RMS ${rmsVals.length ? Math.min(...rmsVals).toFixed(4) : "?"}–${rmsVals.length ? Math.max(...rmsVals).toFixed(4) : "?"}; drift peakHz/ph THO ${statStr(drifts)} | LOC-S2 ${statStr(cleanDrifts)} (lag ${lagIdx.size}, bin ${BIN_HZ.toFixed(2)}Hz, bar 0,5s); holdMaxSec ${(cN.holdMaxSec ?? 0).toFixed(3)}s holdCapStop Δ=${d("holdCapStop")} holdStop Δ=${d("holdStop")} holdKeep Δ=${d("holdKeep")} restart Δ=${d("restart")} restartExact Δ=${d("restartExact")} playOk Δ=${d("playOk")} playFalse Δ=${d("playFalse")} playClamped Δ=${d("playClamped")} windowRebuilds Δ=${d("windowRebuilds")} Δpartial=${d("windowDecodePartial")} Δcached=${d("windowDecodeCached")} Δfull=${d("windowDecodeFull")} ΔpartialFail=${d("partialFail")}; load cua so dau ${loadMs ?? "?"}ms; ph ${firstSound ? firstSound.ph : "?"}→${sounding.length ? sounding[sounding.length - 1].ph : "?"}; bundle ${JSON.stringify(bundleBefore)} → ${JSON.stringify(bundleAfter)}; load ${loadStart} → ${loadavg()}`);
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  await sleep(2000);
  server.close();
}
