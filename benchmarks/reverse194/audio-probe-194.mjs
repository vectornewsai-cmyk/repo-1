// audio-probe-194.mjs — Đợt 194 P3 (a2)+(a3): audio đảo chạy xuyên hold +
// crossfade/restart-exact đo lại + GHI WAVEFORM.
// Đo TRÊN APP THẬT (dist snapshot hiện tại): import fixture chirp 10 s
// (300→3000 Hz), phát ngược từ cuối, lấy mẫu mỗi 100 ms trong ~13 s:
// RMS + peakHz + waveform 64 điểm (time-domain, byte 0-255) + counters
// wiring (tick/holdStop/holdKeep/holdCapStop/playOk/keep/restart/
// restartExact) + timeText playhead + load1.
// Drift hình-tiếng: chirp là đồng hồ — source time từ audio
// t_audio = (peakHz−300)/270; drift = t_audio − t_playhead (âm = audio
// đi trước hình theo chiều ngược); độ phân giải bin 23,4 Hz ≈ 0,087 s.
// Chạy: node audio-probe-194.mjs  (mặc định chirp-10s.mp4)
// Ghi JSON vào ~/workspace/tmp-round194-p3/audio-probe-194-chirp-10s.json
// + waveform JSON riêng audio-waveform-194-chirp-10s.json
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const HOME = "/home/hatch";
const DIR194 = `${HOME}/workspace/tmp-round194-p3`;
const VIDEO = process.env.P194_AUDIO_VIDEO || `${HOME}/workspace/tmp-round192-p3/chirp-10s.mp4`;
const TAG = path.basename(VIDEO, ".mp4");
const DIST = `${HOME}/workspace/repo-1/apps/web/dist`;
const PORT = 4201;
const CDP_PORT = 9225;
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
  "--user-data-dir=/tmp/round194-p3-audio-profile",
  "--autoplay-policy=no-user-gesture-required", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = null;
for (let i = 0; i < 30; i++) {
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

// Waveform: 64 điểm time-domain (mỗi 32 mẫu của 2048) + min/max/RMS.
const SAMPLE_FN = `(()=>{
  const td=document.querySelector(".time-display");
  const revAudio = window.__vcutReverseAudio||null;
  const audio = (()=>{try{const an=window.__vcutAudioAnalyser; if(!an||!an.context) return null; const sr=an.context.sampleRate; const f=new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(f); let pk=0,pi=0; for(let i=0;i<f.length;i++){if(f[i]>pk){pk=f[i];pi=i;}} const td2=new Uint8Array(an.fftSize); an.getByteTimeDomainData(td2); let sq=0,mn=255,mx=0; const wave=[]; for(let i=0;i<td2.length;i++){const v=td2[i]; if(v<mn)mn=v; if(v>mx)mx=v; const d=(v-128)/128; sq+=d*d; if(i%32===0) wave.push(v);} return {peakHz: Math.round(pi*sr/an.fftSize), peakMag: pk, rms: +Math.sqrt(sq/td2.length).toFixed(4), waveMin: mn, waveMax: mx, wave};}catch(e){return {error:String(e)};}})();
  const badge = (()=>{const b=document.querySelector(".preview-reverse-badge"); return b?(b.textContent||"").trim():null;})();
  const hold = window.__vcutHoldStats||null;
  return {t: Date.now(), timeText: td?(td.textContent||"").trim():null, revAudio, audio, badge, hold};
})()`;

try {
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("DOM.enable");
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await sleep(2000);
  await ev(`(()=>{localStorage.setItem("vcut-welcomed","1"); localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify({format:"vcut-project",formatVersion:1,appVersion:"0.1.0",specVersion:"1",savedAt:new Date().toISOString(),name:"audio194 seed",spec:{version:"0.2.0",meta:{name:"audio194",width:1280,height:720,fps:30},tracks:[]}})); return true;})()`);
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) { await sleep(1000); ready = await ev(`!!(document.querySelector("canvas.preview-canvas") && document.querySelector(".transport"))`).catch(() => false); }
  if (!ready) throw new Error("app không ready sau 60s");
  log(`app ready, video=${VIDEO}, bundle=${JSON.stringify(bundleBefore)}, load ${loadavg()}`);
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
  const revClick = await clickTransport("reverse");
  if (revClick !== "clicked") throw new Error("không bấm được nút Phát ngược");
  const loadStart = loadavg();
  const revSamples = [];
  for (let i = 0; i < 130; i++) { await sleep(100); revSamples.push({ ...await ev(SAMPLE_FN), load1: loadavg().split(" ")[0] }); }
  await clickTransport("reverse"); // dừng
  const countersEnd = revSamples[revSamples.length - 1]?.revAudio?.counters || null;
  const bundleAfter = (() => {
    try {
      return fs.readdirSync(`${DIST}/assets`).filter((f) => f.startsWith("index-") && f.endsWith(".js")).sort();
    } catch { return []; }
  })();
  const out = { video: VIDEO, dist: DIST, bundleBefore, bundleAfter, loadStart, loadEnd: loadavg(), fwdSamples, revSamples, countersEnd };
  fs.writeFileSync(`${DIR194}/audio-probe-194-${TAG}.json`, JSON.stringify(out, null, 2));
  // Waveform riêng (nhẹ, chỉ t + wave + rms + peakHz + counters).
  const waveOut = {
    video: VIDEO, bundle: bundleAfter, chirp: "300->3000Hz/10s, f(t)=300+270t",
    samples: revSamples.map((s) => ({
      t: s.t, timeText: s.timeText, rms: s.audio?.rms ?? null,
      peakHz: s.audio?.peakHz ?? null, waveMin: s.audio?.waveMin ?? null,
      waveMax: s.audio?.waveMax ?? null, wave: s.audio?.wave ?? null,
      counters: s.revAudio?.counters ?? null, load1: s.load1,
    })),
  };
  fs.writeFileSync(`${DIR194}/audio-waveform-194-${TAG}.json`, JSON.stringify(waveOut));
  // Tóm tắt.
  const parseT = (tt) => {
    if (!tt) return null;
    const m = String(tt).trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
    if (!m) return null;
    return (m[1] ? parseInt(m[1], 10) * 60 : 0) + parseFloat(m[2]);
  };
  const afterStart = [];
  let started = false;
  for (const s of revSamples) {
    if (!started && s.audio && s.audio.rms > 0) started = true;
    if (started) afterStart.push(s);
  }
  const inPass = afterStart.filter((s) => s.audio && s.audio.rms > 0);
  const silent = afterStart.filter((s) => s.audio && s.audio.rms === 0).length;
  const peaks = inPass.map((s) => s.audio.peakHz);
  const decreasing = peaks.length >= 4 && peaks[peaks.length - 1] < peaks[0] - 100;
  const drifts = [];
  for (const s of inPass) {
    const pt = parseT(s.timeText);
    if (pt === null || typeof s.audio.peakHz !== "number") continue;
    const tAudio = (s.audio.peakHz - 300) / 270;
    drifts.push(tAudio - pt);
  }
  const absDrift = drifts.map((d) => Math.abs(d)).sort((a, b) => a - b);
  const medDrift = absDrift.length ? absDrift[Math.floor(absDrift.length / 2)] : null;
  const maxDrift = absDrift.length ? absDrift[absDrift.length - 1] : null;
  const flatWave = inPass.filter((s) => s.audio && (s.audio.waveMax - s.audio.waveMin) < 4).length;
  const rmsVals = inPass.map((s) => s.audio.rms);
  const rmsMin = rmsVals.length ? Math.min(...rmsVals) : null;
  const rmsMax = rmsVals.length ? Math.max(...rmsVals) : null;
  log(`KẾT LUẬN ${TAG}: sau khi tiếng lên: ${afterStart.length} mẫu, có tiếng ${inPass.length}, lặng RMS=0: ${silent}; RMS ${rmsMin}–${rmsMax}; peakHz ${peaks[0] ?? "?"}→${peaks[peaks.length - 1] ?? "?"} (${decreasing ? "GIẢM = đúng hướng đảo" : "KHÔNG giảm rõ"}); drift |.| median ${medDrift !== null ? medDrift.toFixed(3) : "?"}s max ${maxDrift !== null ? maxDrift.toFixed(3) : "?"}s (bar ≤0,5 s); waveform phẳng (max-min<4): ${flatWave}/${inPass.length}; counters cuối ${JSON.stringify(countersEnd)}; bundle ${JSON.stringify(bundleBefore)} → ${JSON.stringify(bundleAfter)}; load ${loadStart} → ${loadavg()}`);
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  server.close();
}
