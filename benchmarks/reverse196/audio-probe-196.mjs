// audio-probe-196.mjs — Đợt 196 P3: (1) cap drift SIẾT 0,5 → 0,3 s
// (quyết parent (a4)-195) — đo lại drift TUYỆT ĐỐI trên longA (bar ≤ 0,5 s) +
// HEADED — fixture dài GOP dài (seek chậm → hold > 0,5 s) để
// holdCapStop > 0 + drift chạm trần rồi dừng; (2) decode cửa sổ clip
// 300–600 s — đo thời gian decode cửa sổ đầu + đổi cửa sổ tại mép
// (windowRebuilds/lastWindowDecodeMs) + hành vi RMS tại mép.
// Đo TRÊN APP THẬT (dist snapshot hiện tại): import fixture chirp
// TUẦN HOÀN 10 s (f(t) = 300+270*(t mod 10) Hz — t_audio =
// ((peakHz−300)/270) mod 10, drift wrap về [−5; 5]), phát ngược từ
// cuối, lấy mẫu mỗi SAMPLE_MS: RMS + peakHz + waveform 64 điểm +
// counters wiring (tick/holdStop/holdKeep/holdCapStop/holdMaxSec/
// windowRebuilds/lastWindowDecodeMs) + windows + holdStats + timeText
// playhead + load1.
// Chạy: P196_AUDIO_VIDEO=<mp4> P196_SAMPLES=<n> P196_INTERVAL_MS=<ms>
//   node audio-probe-196.mjs
// Ghi JSON vào ~/workspace/tmp-round196-p3/audio-probe-196-<tag>.json
// + waveform JSON riêng audio-waveform-196-<tag>.json
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const HOME = "/home/hatch";
const DIR196 = `${HOME}/workspace/tmp-round196-p3`;
const VIDEO = process.env.P196_AUDIO_VIDEO || `${HOME}/workspace/tmp-round195-p3/longA-300s-gop300-720p.mp4`;
const TAG = path.basename(VIDEO, ".mp4");
const SAMPLES = parseInt(process.env.P196_SAMPLES || "200", 10);
const INTERVAL_MS = parseInt(process.env.P196_INTERVAL_MS || "100", 10);
const DIST = `${HOME}/workspace/repo-1/apps/web/dist`;
const PORT = parseInt(process.env.P196_PORT || "4201", 10);
const CDP_PORT = parseInt(process.env.P196_CDP_PORT || "9225", 10);
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
  "--user-data-dir=/tmp/round196-p3-audio-profile",
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
  const audio = (()=>{try{const an=window.__vcutAudioAnalyser; if(!an||!an.context) return null; const sr=an.context.sampleRate; const f=new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(f); let pk=0,pi=0; for(let i=0;i<f.length;i++){if(f[i]>pk){pk=f[i];pi=i;}} const td2=new Uint8Array(an.fftSize); an.getByteTimeDomainData(td2); let sq=0,mn=255,mx=0; const wave=[]; for(let i=0;i<td2.length;i++){const v=td2[i]; if(v<mn)mn=v; if(v>mx)mx=v; const d=(v-128)/128; sq+=d*d; if(i%32===0) wave.push(v);} return {peakHz: Math.round(pi*sr/an.fftSize), peakMag: pk, rms: +Math.sqrt(sq/td2.length).toFixed(4), waveMin: mn, waveMax: mx, wave};}catch(e){return {error:String(e)};}})();
  const badge = (()=>{const b=document.querySelector(".preview-reverse-badge"); return b?(b.textContent||"").trim():null;})();
  const hold = window.__vcutHoldStats||null;
  return {t: Date.now(), timeText: td?(td.textContent||"").trim():null, revAudio, audio, badge, hold, holdStats};
})()`;

try {
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("DOM.enable");
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await sleep(2000);
  await ev(`(()=>{localStorage.setItem("vcut-welcomed","1"); localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify({format:"vcut-project",formatVersion:1,appVersion:"0.1.0",specVersion:"1",savedAt:new Date().toISOString(),name:"audio196 seed",spec:{version:"0.2.0",meta:{name:"audio196",width:1280,height:720,fps:30},tracks:[]}})); return true;})()`);
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
  const out = { video: VIDEO, dist: DIST, bundleBefore, bundleAfter, loadStart, loadEnd: loadavg(), fwdSamples, revSamples, countersEnd, revClickT, samples: SAMPLES, intervalMs: INTERVAL_MS };
  fs.writeFileSync(`${DIR196}/audio-probe-196-${TAG}.json`, JSON.stringify(out, null, 2));
  // Waveform riêng (nhẹ, chỉ t + wave + rms + peakHz + counters + windows).
  const waveOut = {
    video: VIDEO, bundle: bundleAfter, chirp: "300->3000Hz/10s TUAN HOAN, f(t)=300+270*(t mod 10)",
    samples: revSamples.map((s) => ({
      t: s.t, timeText: s.timeText, rms: s.audio?.rms ?? null,
      peakHz: s.audio?.peakHz ?? null, waveMin: s.audio?.waveMin ?? null,
      waveMax: s.audio?.waveMax ?? null, wave: s.audio?.wave ?? null,
      counters: s.revAudio?.counters ?? null,
      windows: s.revAudio?.windows ?? null,
      holdStats: s.holdStats ?? null, load1: s.load1,
    })),
  };
  fs.writeFileSync(`${DIR196}/audio-waveform-196-${TAG}.json`, JSON.stringify(waveOut));
  // Tóm tắt.
  const parseT = (tt) => {
    if (!tt) return null;
    // timeText đợt 195/196: "MM:SS.t / MM:SS.t" (hiện tại / tổng) — lấy phần trước " / ".
    const head = String(tt).trim().split("/")[0].trim();
    const m = head.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
    if (!m) return null;
    return (m[1] ? parseInt(m[1], 10) * 60 : 0) + parseFloat(m[2]);
  };
  // Chirp tuần hoàn: t_audio = ((peakHz-300)/270) mod 10; drift wrap về [-5;5].
  const driftOf = (s) => {
    const pt = parseT(s.timeText);
    if (pt === null || typeof s.audio?.peakHz !== "number") return null;
    let ta = ((s.audio.peakHz - 300) / 270) % 10;
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
    if (Math.abs(s.audio.peakHz - p.audio.peakHz) > 24) return false;
    const tp = parseT(s.timeText), tq = parseT(p.timeText);
    return tp !== null && tq !== null && Math.abs(tp - tq) >= 0.15;
  };
  const staleIdx = inPass.map((_, i) => (isStale(i) ? i : -1)).filter((i) => i >= 0);
  const lagIdx = inPass.map((_, i) => (isLagging(i) ? i : -1)).filter((i) => i >= 0);
  const cleanPass = inPass.filter((_, i) => !isLagging(i));
  const drifts = inPass.map(driftOf).filter((d) => d !== null);
  const absDrift = drifts.map((d) => Math.abs(d)).sort((a, b) => a - b);
  const medDrift = absDrift.length ? absDrift[Math.floor(absDrift.length / 2)] : null;
  const maxDrift = absDrift.length ? absDrift[absDrift.length - 1] : null;
  const cleanDrifts = cleanPass.map(driftOf).filter((d) => d !== null);
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
  log(`KET LUAN ${TAG}: sau khi tieng len: ${afterStart.length} mau, co tieng ${inPass.length}, lang RMS=0: ${silent}; RMS ${rmsMin}–${rmsMax} mean ${rmsMean}; drift THO |.| median ${medDrift !== null ? medDrift.toFixed(3) : "?"}s max ${maxDrift !== null ? maxDrift.toFixed(3) : "?"}s; drift LOC S1 (peakHz giong het mau truoc, playhead >=0,2s): ${staleIdx.length}/${inPass.length} mau; drift DA LOC S2 (peakHz dich <1 bin=24Hz, playhead >=0,15s): ${lagIdx.length}/${inPass.length} mau lag, median ${cleanMed !== null ? cleanMed.toFixed(3) : "?"}s p90 ${cleanP90 !== null ? cleanP90.toFixed(3) : "?"}s max ${cleanMax !== null ? cleanMax.toFixed(3) : "?"}s (bar ≤0,5 s); drift tai cap: ${JSON.stringify(capSamples)}; waveform phang (max-min<4): ${flatWave}/${inPass.length}; playhead ${playheads[0] ?? "?"}→${playheads[playheads.length - 1] ?? "?"}; holdMaxSec ${(cN.holdMaxSec ?? 0).toFixed(3)}s holdCapStop Δ=${dCap} holdStop Δ=${(cN.holdStop ?? 0) - (c0.holdStop ?? 0)} holdKeep Δ=${(cN.holdKeep ?? 0) - (c0.holdKeep ?? 0)}; windowRebuilds Δ=${dRebuild} lastDecodeMs ${cN.lastWindowDecodeMs ?? "?"}ms; load cua so dau ${loadMs ?? "?"}ms (tu luc bam nguoc toi loaded=1); rebuilding thay ${rebuildingSeen} mau; cua so: ${JSON.stringify(winSeq)}; counters cuoi ${JSON.stringify(countersEnd)}; bundle ${JSON.stringify(bundleBefore)} → ${JSON.stringify(bundleAfter)}; load ${loadStart} → ${loadavg()}`);
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  server.close();
}
