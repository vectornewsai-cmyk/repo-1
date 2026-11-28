// audio-probe-200.mjs — Đợt 200 P3: (1) drift chirp bằng THƯỚC SWEEP 70 s
// ĐÚNG (file chirp-70s.mp4 là sweep tuyến tính 300→3000 Hz / 70 s,
// KHÔNG phải tuần hoàn 10 s — thước 199 SAI cho file này) với 2 thước
// đo ĐỘ PHÂN GIẢI CAO: FFT bin mịn (fftSize 8192 → bin 5,38 Hz @44,1k
// = 0,14 s thang sweep) + ZCR trên toàn bộ time-domain buffer
// (độ phân giải ~0,07 s); playhead chính xác từ lastPlayheadSec
// (song song timeText để đối chiếu 199); (2) longB đo lại ở 100 ms
// (199 dùng 250 ms) để kiểm giả thuyết transient = đuôi freeze
// analyser bị khuếch đại bởi khoảng lấy mẫu; (3) giữ N11b: partial
// engage + playClamped đo lại trên cùng bundle 199 (không đổi code
// reverse — chỉ sửa thước đo). Đo TRÊN APP THẬT (dist snapshot).
// Chạy: P200_AUDIO_VIDEO=<mp4> P200_SAMPLES=<n> P200_INTERVAL_MS=<ms>
//   P200_FFTSIZE=<2048|8192> node audio-probe-200.mjs
// Ghi JSON vào hidden_files/round200-p3/audio-probe-200-<tag>.json
// + waveform JSON riêng audio-waveform-200-<tag>.json
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const HOME = "/home/hatch";
const DIR200 = `${HOME}/workspace/goals/capcut-clone-video-editor/hidden_files/round200-p3`;
const VIDEO = process.env.P200_AUDIO_VIDEO || `${HOME}/workspace/tmp-round195-p3/longA-300s-gop300-720p.mp4`;
const TAG = path.basename(VIDEO, ".mp4");
const SAMPLES = parseInt(process.env.P200_SAMPLES || "200", 10);
const INTERVAL_MS = parseInt(process.env.P200_INTERVAL_MS || "100", 10);
const FFTSIZE = parseInt(process.env.P200_FFTSIZE || "2048", 10);
const DIST = `${HOME}/workspace/repo-1/apps/web/dist`;
const PORT = parseInt(process.env.P200_PORT || "4242", 10);
const CDP_PORT = parseInt(process.env.P200_CDP_PORT || "9266", 10);
// Đợt 200 P3 — port/CDP/profile RIÊNG mỗi pass (bài học đợt 198: 3 lần
// Chrome liên tiếp cùng port/CDP + cùng profile → pass sau fail vì
// profile lock/port chưa nhả). Mỗi pass chạy với P200_PORT /
// P200_CDP_PORT / P200_PROFILE khác nhau; mặc định theo tag.
const PROFILE = process.env.P200_PROFILE || `/tmp/round200-p3-profile-${TAG}`;
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
for (let i = 0; i < 90; i++) { // 45 s — Chrome khởi động chậm khi máy tải (đợt 196: 30 lần/15 s không đủ)
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
  const holdStats = window.__vcutHoldStats||null;
  const audio = (()=>{try{const an=window.__vcutAudioAnalyser; if(!an||!an.context) return null; const sr=an.context.sampleRate; const f=new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(f); let pk=0,pi=0; for(let i=0;i<f.length;i++){if(f[i]>pk){pk=f[i];pi=i;}} const td2=new Uint8Array(an.fftSize); an.getByteTimeDomainData(td2); let sq=0,mn=255,mx=0,zc=0,prev=0; const wave=[]; for(let i=0;i<td2.length;i++){const v=td2[i]; if(v<mn)mn=v; if(v>mx)mx=v; const d=(v-128)/128; sq+=d*d; const sgn=d>0?1:(d<0?-1:0); if(sgn!==0){if(prev!==0&&sgn!==prev)zc++; prev=sgn;} if(i%32===0) wave.push(v);} return {peakHz: Math.round(pi*sr/an.fftSize), peakMag: pk, rms: +Math.sqrt(sq/td2.length).toFixed(4), waveMin: mn, waveMax: mx, wave, zcrHz: Math.round(zc*sr/(2*td2.length)), sr, fftSize: an.fftSize};}catch(e){return {error:String(e)};}})();
  const badge = (()=>{const b=document.querySelector(".preview-reverse-badge"); return b?(b.textContent||"").trim():null;})();
  const hold = window.__vcutHoldStats||null;
  return {t: Date.now(), timeText: td?(td.textContent||"").trim():null, playheadSec: (revAudio&&typeof revAudio.lastPlayheadSec==="number")?revAudio.lastPlayheadSec:null, revAudio, audio, badge, hold, holdStats};
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
  // Đợt 200 P3 — đặt fftSize đo (runtime-only qua CDP, KHÔNG sửa
  // source; app tự cấp lại buffer meter theo fftSize mới): chirp-70s
  // cần bin mịn (8192 → 5,38 Hz @44,1k); longA/longB giữ 2048 như 199.
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
  // Đợt 200 P3 — khẳng định lại fftSize trước khi phát ngược (phòng
  // app tạo lại analyser khi import clip).
  await ev(`(()=>{const an=window.__vcutAudioAnalyser; if(an) an.fftSize=${FFTSIZE}; return true;})()`).catch(() => false);
  const revClick = await clickTransport("reverse");
  if (revClick !== "clicked") throw new Error("không bấm được nút Phát ngược");
  const revClickT = Date.now();
  const loadStart = loadavg();
  const revSamples = [];
  for (let i = 0; i < SAMPLES; i++) { await sleep(INTERVAL_MS); revSamples.push({ ...await ev(SAMPLE_FN), load1: loadavg().split(" ")[0] }); }
  await clickTransport("reverse"); // dừng
  const countersEnd = revSamples[revSamples.length - 1]?.revAudio?.counters || null;
  const bundleAfter = (() => {
    try {
      return fs.readdirSync(`${DIST}/assets`).filter((f) => f.startsWith("index-") && f.endsWith(".js")).sort();
    } catch { return []; }
  })();
  const out = { video: VIDEO, dist: DIST, bundleBefore, bundleAfter, loadStart, loadEnd: loadavg(), fwdSamples, revSamples, countersEnd, revClickT, samples: SAMPLES, intervalMs: INTERVAL_MS, fftSize: FFTSIZE, ruler: TAG.includes("chirp-70s") ? "sweep-70s f=300+38.5714*t" : "periodic-10s f=300+270*(t mod 10)" };
  fs.writeFileSync(`${DIR200}/audio-probe-200-${TAG}.json`, JSON.stringify(out, null, 2));
  // Waveform riêng (nhẹ, chỉ t + wave + rms + peakHz + counters + windows).
  const waveOut = {
    video: VIDEO, bundle: bundleAfter, chirp: TAG.includes("chirp-70s") ? "300->3000Hz/70s SWEEP TUYEN TINH, f(t)=300+38.5714*t" : "300->3000Hz/10s TUAN HOAN, f(t)=300+270*(t mod 10)",
    samples: revSamples.map((s) => ({
      t: s.t, timeText: s.timeText, rms: s.audio?.rms ?? null,
      peakHz: s.audio?.peakHz ?? null, waveMin: s.audio?.waveMin ?? null,
      waveMax: s.audio?.waveMax ?? null, wave: s.audio?.wave ?? null,
      counters: s.revAudio?.counters ?? null,
      windows: s.revAudio?.windows ?? null,
      holdStats: s.holdStats ?? null, load1: s.load1,
    })),
  };
  fs.writeFileSync(`${DIR200}/audio-waveform-200-${TAG}.json`, JSON.stringify(waveOut));
  // Tóm tắt.
  const parseT = (tt) => {
    if (!tt) return null;
    // timeText đợt 195/196: "MM:SS.t / MM:SS.t" (hiện tại / tổng) — lấy phần trước " / ".
    const head = String(tt).trim().split("/")[0].trim();
    const m = head.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
    if (!m) return null;
    return (m[1] ? parseInt(m[1], 10) * 60 : 0) + parseFloat(m[2]);
  };
  // Đợt 200 P3 — thước drift theo file (thước 199 SAI cho chirp-70s):
  // - chirp-70s = sweep TUYẾN TÍNH 300→3000 Hz / 70 s (xác minh bằng
  //   ffmpeg ZCR fit f(t)=300,31+38,5586*t ≈ nominal 300+38,5714*t;
  //   residual RMS 2,25 Hz): t_audio = (freq-300)/38,5714, KHÔNG wrap.
  // - longA/longB = chirp TUẦN HOÀN 10 s: t_audio =
  //   ((freq-300)/270) mod 10, drift wrap về [-5;5].
  // Hai ước lượng tần số: peakHz (FFT) + zcrHz (ZCR time-domain).
  // Hai nguồn playhead: timeText (hiển thị, lượng tử 0,1 s) +
  // playheadSec = lastPlayheadSec (nội bộ player, float đầy đủ).
  const IS_CHIRP70 = TAG.includes("chirp-70s");
  const SWEEP_SLOPE = 2700 / 70; // 38,5714 Hz/s
  const driftOf = (s, freqKey = "peakHz", headKey = "timeText") => {
    const pt = headKey === "playheadSec" ? (typeof s.playheadSec === "number" ? s.playheadSec : null) : parseT(s.timeText);
    const fq = s.audio?.[freqKey];
    if (pt === null || typeof fq !== "number") return null;
    if (IS_CHIRP70) return (fq - 300) / SWEEP_SLOPE - pt;
    let ta = ((fq - 300) / 270) % 10;
    if (ta < 0) ta += 10;
    let d = (ta - (pt % 10)) % 10;
    if (d > 5) d -= 10;
    if (d < -5) d += 10;
    return d;
  };
  const afterStart = [];
  let started = false;
  for (const s of revSamples) {
    if (!started && s.audio && s.audio.rms > 0) started = true;
    if (started) afterStart.push(s);
  }
  const inPass = afterStart.filter((s) => s.audio && s.audio.rms > 0);
  const silent = afterStart.filter((s) => s.audio && s.audio.rms === 0).length;
  // Đợt 196 P3 — LỌC STALE (bài học §1.4 đợt 195 + nợ khớp quy tắc đếm
  // với P4): hai quy tắc, in cả hai để P4 đối chiếu (P4-195 đếm 16/50
  // vs P3 3/35 vì định nghĩa khác nhau — verdicts không đổi).
  // S1 (quy tắc 195): peakHz Y HỆT mẫu trước trong khi playhead đã
  // chạy ≥ 0,2 s. SỬA LỖI FLOAT đợt 196: 291,7−291,5 = 0,19999999999999
  // < 0,2 nên S1 bỏ lọt mẫu stale (pass B idx40, drift +0,737 giả) —
  // so sánh với epsilon 1e-9.
  // S2 (mới đợt 196): peakHz dịch < 1 bin FFT (24 Hz @ 48 kHz/2048)
  // so với mẫu sounding trước trong khi playhead chạy ≥ 0,15 s —
  // analyser TRỄ/LAG (smoothing 0,8 giữ đỉnh cũ) chứ không chỉ đóng
  // băng y hệt. S2 bắt được cả lag dưới-bin mà S1 bỏ lọt; trong lúc
  // HOLD playhead đứng yên nên S2 không lọc mất drift freeze thật.
  // Mọi số drift "đã lọc" dưới đây dùng S2; số S1 + số thô vẫn in kèm.
  // Đợt 200 P3 — bin FFT đọc từ mẫu thật (sr/fftSize), không hardcode
  // 24 Hz: headless ctx 44,1k/2048 → 21,53 Hz; 44,1k/8192 → 5,38 Hz.
  const BIN_HZ = (() => { const a = revSamples.find((s) => s.audio?.sr && s.audio?.fftSize); return a ? a.audio.sr / a.audio.fftSize : 24; })();
  const isStale = (idx) => {
    if (idx <= 0) return false;
    const s = inPass[idx], p = inPass[idx - 1];
    if (!s.audio || !p.audio) return false;
    if (s.audio.peakHz !== p.audio.peakHz) return false;
    const tp = parseT(s.timeText), tq = parseT(p.timeText);
    return tp !== null && tq !== null && Math.abs(tp - tq) >= 0.2 - 1e-9;
  };
  const isLagging = (idx) => {
    if (idx <= 0) return false;
    const s = inPass[idx], p = inPass[idx - 1];
    if (!s.audio || !p.audio) return false;
    if (Math.abs(s.audio.peakHz - p.audio.peakHz) > BIN_HZ) return false;
    const tp = parseT(s.timeText), tq = parseT(p.timeText);
    return tp !== null && tq !== null && Math.abs(tp - tq) >= 0.15;
  };
  // Đợt 200 P3 — S2 cho ZCR: ZCR không bị smoothing FFT giữ đỉnh nên
  // ngưỡng lag riêng = 7 Hz (~2× nhiễu ZCR ±3 Hz ở fftSize 8192).
  const isLaggingZcr = (idx) => {
    if (idx <= 0) return false;
    const s = inPass[idx], p = inPass[idx - 1];
    if (!s.audio || !p.audio) return false;
    if (typeof s.audio.zcrHz !== "number" || typeof p.audio.zcrHz !== "number") return false;
    if (Math.abs(s.audio.zcrHz - p.audio.zcrHz) > 7) return false;
    const tp = parseT(s.timeText), tq = parseT(p.timeText);
    return tp !== null && tq !== null && Math.abs(tp - tq) >= 0.15;
  };
  const staleIdx = inPass.map((_, i) => (isStale(i) ? i : -1)).filter((i) => i >= 0);
  const lagIdx = inPass.map((_, i) => (isLagging(i) ? i : -1)).filter((i) => i >= 0);
  const cleanPass = inPass.filter((_, i) => !isLagging(i));
  const drifts = inPass.map((s) => driftOf(s)).filter((d) => d !== null);
  const absDrift = drifts.map((d) => Math.abs(d)).sort((a, b) => a - b);
  const medDrift = absDrift.length ? absDrift[Math.floor(absDrift.length / 2)] : null;
  const maxDrift = absDrift.length ? absDrift[absDrift.length - 1] : null;
  const cleanDrifts = cleanPass.map((s) => driftOf(s)).filter((d) => d !== null);
  const cleanAbs = cleanDrifts.map((d) => Math.abs(d)).sort((a, b) => a - b);
  const cleanMed = cleanAbs.length ? cleanAbs[Math.floor(cleanAbs.length / 2)] : null;
  const cleanMax = cleanAbs.length ? cleanAbs[cleanAbs.length - 1] : null;
  // p90 đã lọc (để so với trung vị — max đơn lẻ có thể là transient).
  const cleanP90 = cleanAbs.length ? cleanAbs[Math.floor(cleanAbs.length * 0.9)] : null;
  const flatWave = inPass.filter((s) => s.audio && (s.audio.waveMax - s.audio.waveMin) < 4).length;
  const rmsVals = inPass.map((s) => s.audio.rms);
  const rmsMin = rmsVals.length ? Math.min(...rmsVals) : null;
  const rmsMax = rmsVals.length ? Math.max(...rmsVals) : null;
  const rmsMean = rmsVals.length ? +(rmsVals.reduce((a, b) => a + b, 0) / rmsVals.length).toFixed(4) : null;
  // Cửa sổ: các lần windowStartSec đổi + lần rebuilding=true quan sát được.
  const winSeq = [];
  let lastWin = null;
  for (const s of revSamples) {
    const w0 = s.revAudio?.windows?.[0];
    if (!w0) continue;
    const key = `${w0.windowStartSec}|${w0.windowEndSec}`;
    if (key !== lastWin) { winSeq.push({ t: s.t, timeText: s.timeText, start: w0.windowStartSec, end: w0.windowEndSec, rebuilding: w0.rebuilding, lastDecodeMs: w0.lastDecodeMs }); lastWin = key; }
  }
  const rebuildingSeen = revSamples.filter((s) => s.revAudio?.windows?.[0]?.rebuilding).length;
  const firstLoaded = revSamples.find((s) => (s.revAudio?.loaded ?? 0) >= 1);
  const loadMs = firstLoaded ? firstLoaded.t - revClickT : null;
  const c0 = revSamples[0]?.revAudio?.counters || {};
  const cN = countersEnd || {};
  const dCap = (cN.holdCapStop ?? 0) - (c0.holdCapStop ?? 0);
  const dRebuild = (cN.windowRebuilds ?? 0) - (c0.windowRebuilds ?? 0);
  // Đợt 197 P3 — đếm cache decode-once: số lần decode cửa sổ lấy từ
  // cache (trích + đảo) vs decode toàn file; + dãy lastWindowDecodeMs
  // theo từng lần đổi cửa sổ (để đối chiếu bar N11b 5.000 ms).
  const dCached = (cN.windowDecodeCached ?? 0) - (c0.windowDecodeCached ?? 0);
  const dFull = (cN.windowDecodeFull ?? 0) - (c0.windowDecodeFull ?? 0);
  const dPartial = (cN.windowDecodePartial ?? 0) - (c0.windowDecodePartial ?? 0);
  // Đợt 199 P3 — lý do partial fail gần nhất (từ snapshot wiring) + số
  // lần load rơi về full decode vì partial hỏng.
  const dPartialFail = (cN.partialFail ?? 0) - (c0.partialFail ?? 0);
  const failReason = revSamples.map((x) => x.revAudio?.partialFailReason).find((x) => x) || null;
  const decodeSeq = [];
  let lastDm = null;
  for (const s of revSamples) {
    const dm = s.revAudio?.counters?.lastWindowDecodeMs;
    if (typeof dm === "number" && dm !== lastDm) { decodeSeq.push({ t: s.t, timeText: s.timeText, ms: dm }); lastDm = dm; }
  }
  const availKb = () => {
    try { const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)/); return m ? parseInt(m[1], 10) : null; } catch { return null; }
  };
  const availEnd = availKb();
  const playheads = revSamples.map((s) => parseT(s.timeText)).filter((x) => x !== null);
  // Drift tại từng lần cap kích hoạt (holdCapStop tăng): drift tuyệt đối
  // tại cap ≈ drift-lúc-giữ + 0,3 s — ghi rõ để kiểm thiết kế cap 196.
  const capSamples = [];
  let prevCap = revSamples[0]?.revAudio?.counters?.holdCapStop ?? 0;
  for (let i = 1; i < revSamples.length; i++) {
    const cap = revSamples[i]?.revAudio?.counters?.holdCapStop ?? 0;
    if (cap > prevCap) {
      capSamples.push({ idx: i, timeText: revSamples[i].timeText, drift: driftOf(revSamples[i]), holdMaxSec: revSamples[i]?.revAudio?.counters?.holdMaxSec ?? null, cap });
      prevCap = cap;
    }
  }
  // Đợt 200 P3 — khối thước mịn cho chirp-70s: 4 tổ hợp (peakHz/zcrHz)
  // × (timeText/playheadSec), mỗi tổ hợp có mask S2 riêng; + số thô.
  const statStr = (vals) => {
    if (!vals.length) return "?";
    const a = vals.map((x) => Math.abs(x)).sort((x, y) => x - y);
    const sgn = vals.reduce((t, x) => t + x, 0) / vals.length;
    return `n=${vals.length} med=${a[Math.floor(a.length / 2)].toFixed(3)} p90=${a[Math.floor(a.length * 0.9)].toFixed(3)} max=${a[a.length - 1].toFixed(3)} signedMean=${sgn.toFixed(3)}`;
  };
  let chirpFine = "";
  if (IS_CHIRP70) {
    const lagSet = new Set(lagIdx);
    const lagZcrSet = new Set(inPass.map((_, i) => (isLaggingZcr(i) ? i : -1)).filter((i) => i >= 0));
    const dPeakTt = inPass.map((s) => driftOf(s, "peakHz", "timeText")).filter((d) => d !== null);
    const dPeakPh = inPass.map((s) => driftOf(s, "peakHz", "playheadSec")).filter((d) => d !== null);
    const dZcrTt = inPass.map((s) => driftOf(s, "zcrHz", "timeText")).filter((d) => d !== null);
    const dZcrPh = inPass.map((s) => driftOf(s, "zcrHz", "playheadSec")).filter((d) => d !== null);
    const cPeakTt = inPass.filter((_, i) => !lagSet.has(i)).map((s) => driftOf(s, "peakHz", "timeText")).filter((d) => d !== null);
    const cPeakPh = inPass.filter((_, i) => !lagSet.has(i)).map((s) => driftOf(s, "peakHz", "playheadSec")).filter((d) => d !== null);
    const cZcrTt = inPass.filter((_, i) => !lagZcrSet.has(i)).map((s) => driftOf(s, "zcrHz", "timeText")).filter((d) => d !== null);
    const cZcrPh = inPass.filter((_, i) => !lagZcrSet.has(i)).map((s) => driftOf(s, "zcrHz", "playheadSec")).filter((d) => d !== null);
    chirpFine = `SWEEP-70s ruler f=300+38.5714*t, bin=${BIN_HZ.toFixed(2)}Hz=${(BIN_HZ / SWEEP_SLOPE).toFixed(3)}s (fftSize ${FFTSIZE}); peakHz/timeText THO ${statStr(dPeakTt)} | LOC-S2 ${statStr(cPeakTt)} (lag ${lagIdx.length}); peakHz/playheadSec THO ${statStr(dPeakPh)} | LOC-S2 ${statStr(cPeakPh)}; zcrHz/timeText THO ${statStr(dZcrTt)} | LOC-S2zcr ${statStr(cZcrTt)} (lag ${lagZcrSet.size}); zcrHz/playheadSec THO ${statStr(dZcrPh)} | LOC-S2zcr ${statStr(cZcrPh)} (bar 0,5s)`;
  }
  log(`KET LUAN ${TAG}: sau khi tieng len: ${afterStart.length} mau, co tieng ${inPass.length}, lang RMS=0: ${silent}; RMS ${rmsMin}–${rmsMax} mean ${rmsMean}; drift THO |.| median ${medDrift !== null ? medDrift.toFixed(3) : "?"}s max ${maxDrift !== null ? maxDrift.toFixed(3) : "?"}s; drift LOC S1 (peakHz giong het mau truoc, playhead >=0,2s): ${staleIdx.length}/${inPass.length} mau; drift DA LOC S2 (peakHz dich <1 bin=${BIN_HZ.toFixed(1)}Hz, playhead >=0,15s): ${lagIdx.length}/${inPass.length} mau lag, median ${cleanMed !== null ? cleanMed.toFixed(3) : "?"}s p90 ${cleanP90 !== null ? cleanP90.toFixed(3) : "?"}s max ${cleanMax !== null ? cleanMax.toFixed(3) : "?"}s (bar ≤0,5 s); drift tai cap: ${JSON.stringify(capSamples)}; waveform phang (max-min<4): ${flatWave}/${inPass.length}; playhead ${playheads[0] ?? "?"}→${playheads[playheads.length - 1] ?? "?"}; holdMaxSec ${(cN.holdMaxSec ?? 0).toFixed(3)}s holdCapStop Δ=${dCap} holdStop Δ=${(cN.holdStop ?? 0) - (c0.holdStop ?? 0)} holdKeep Δ=${(cN.holdKeep ?? 0) - (c0.holdKeep ?? 0)}; windowRebuilds Δ=${dRebuild} lastDecodeMs ${cN.lastWindowDecodeMs ?? "?"}ms; decode Δpartial=${dPartial} Δcached=${dCached} Δfull=${dFull} ΔpartialFail=${dPartialFail} partialFailReason=${JSON.stringify(failReason)} playClamped Δ=${(cN.playClamped ?? 0) - (c0.playClamped ?? 0)} playFalse Δ=${(cN.playFalse ?? 0) - (c0.playFalse ?? 0)} playOk Δ=${(cN.playOk ?? 0) - (c0.playOk ?? 0)} decodeSeq=${JSON.stringify(decodeSeq)}; load cua so dau ${loadMs ?? "?"}ms (tu luc bam nguoc toi loaded=1); rebuilding thay ${rebuildingSeen} mau; cua so: ${JSON.stringify(winSeq)}; counters cuoi ${JSON.stringify(countersEnd)}; bundle ${JSON.stringify(bundleBefore)} → ${JSON.stringify(bundleAfter)}; load ${loadStart} → ${loadavg()}; availEnd ${availEnd} kB; ${chirpFine}`);
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  // Đợt 199 P3 — chờ Chrome thoát hẳn (nhả profile lock + CDP port)
  // rồi mới kết thúc script, để pass sau dùng port/profile khác không
  // bị kẹt như đợt 198.
  await sleep(2000);
  server.close();
}
