// partial-verify-198.mjs — verify lại decode từng phần bằng bundle MỚI
// (bundle cũ build trước khi sửa xong source đã cho PCM sai — "stretch 0.84x").
// Đo: (1) thời gian decode cửa sổ 30 s (3 lặp/file, bar N11b 5.000 ms);
// (2) căn chỉnh PCM vs decodeAudioData (R, có priming) và vs ffmpeg L
// (đã trim priming 1024 mẫu) — so sánh có ý thức priming: P[1024..] vs L[0..]
// và vs R[1024..]; đồng thời ghi cả so sánh ngây thơ P[0..] vs R[0..] để thấy
// hiệu ứng priming. Chạy: node benchmarks/reverse198/partial-verify-198.mjs
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
const HOME = "/home/hatch";
const DIR198 = `${HOME}/workspace/tmp-round198-p3`;
const FIX195 = `${HOME}/workspace/tmp-round195-p3`;
const FIX193 = `${HOME}/workspace/tmp-round193-p3`;
const PORT = 4221, CDP_PORT = 9244;
const CHROME = `${HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome`;
const FILES = [
  { name: "longA", file: "longA-300s-gop300-720p.mp4", dir: FIX195, f32: "/tmp/longA-L.f32", windows: [[270, 30], [120, 30]] },
  { name: "longB", file: "longB-300s-gop15-360p.mp4", dir: FIX195, f32: "/tmp/longB-L.f32", windows: [[270, 30], [120, 30]] },
  { name: "chirp", file: "chirp-70s.mp4", dir: FIX193, f32: "/tmp/chirp-L.f32", windows: [[40, 30], [0, 30]] },
];
const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
    if (urlPath === "/") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><title>v</title><script src=\"/partial198.bundle.js\"></script>"); return; }
    if (urlPath === "/partial198.bundle.js") { res.writeHead(200, { "Content-Type": "text/javascript" }); fs.createReadStream(`${DIR198}/partial198.bundle.js`).pipe(res); return; }
    if (urlPath.endsWith(".f32")) { const f = `/tmp/${path.basename(urlPath)}`; res.writeHead(200, { "Content-Type": "application/octet-stream" }); fs.createReadStream(f).pipe(res); return; }
    const dir = urlPath.includes("chirp") ? FIX193 : FIX195;
    const f = path.join(dir, path.basename(urlPath));
    if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": "video/mp4" }); fs.createReadStream(f).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${CDP_PORT}`, "--user-data-dir=/tmp/round198-p3-verify-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = null;
for (let i = 0; i < 90; i++) { try { targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json(); if (targets.length) break; } catch {} await sleep(500); }
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const id = ++msgId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error("timeout")); } }, 300000); }); }
async function ev(expr) { const r = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800)); return r.result?.result?.value; }
try {
  await cdp("Page.enable"); await cdp("Runtime.enable");
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await sleep(1500);
  const results = {};
  for (const f of FILES) {
    const r = await ev(`(async()=>{
      const resp = await fetch('/${f.file}');
      const buf = await resp.arrayBuffer();
      const L = new Float32Array(await (await fetch('/${path.basename(f.f32)}')).arrayBuffer());
      const ac = new AudioContext();
      const ref = await ac.decodeAudioData(buf.slice(0));
      const R = ref.getChannelData(0);
      // QUAN TRỌNG: decodeAudioData resample về AudioContext rate (headless thường 44100),
      // KHÔNG phải 48000 của file — nên R chỉ dùng cho tham chiếu tần số, KHÔNG dùng
      // so sánh mẫu-by-mẫu. Mốc mẫu tuyệt đối lấy theo sampleRate GỐC của track (48000).
      const srFile = window.__partial198.parseMp4AudioTrack(buf).sampleRate;
      const sr = srFile;
      const mad = (A, a0, B, b0, n) => { let s = 0, sq = 0, mx = 0; for (let i = 0; i < n; i++) { const d = Math.abs(A[a0+i]-B[b0+i]); s += d; sq += d*d; if (d > mx) mx = d; } return { mean: +(s/n).toFixed(6), rms: +Math.sqrt(sq/n).toFixed(6), max: +mx.toFixed(4) }; };
      const out = { sr, refLen: R.length, Llen: L.length, windows: {} };
      for (const [w0, wSec] of ${JSON.stringify(f.windows)}) {
        const times = [];
        let P = null;
        for (let rep = 0; rep < 3; rep++) {
          const t0 = performance.now();
          const p = await window.__partial198.decodeAudioWindowPartial(buf, w0, wSec);
          times.push(+(performance.now() - t0).toFixed(1));
          if (rep === 0) P = p;
        }
        const w = { timesMs: times, prim: P.ok ? P.primingTrimmedSamples : null, n: P.ok ? P.sampleCount : null, cover: P.ok ? [+P.coverStartSec.toFixed(4), +P.coverEndSec.toFixed(4)] : null };
        if (P.ok) {
          const N = 48000;
          const rms = (a, n) => { let s = 0; for (let i = 0; i < n; i++) s += a[i]*a[i]; return +Math.sqrt(s/n).toFixed(4); };
          // Căn chỉnh theo CHỈ SỐ FRAME (không theo timestamp stts — stts
          // có frame 1793 nên coverStartSec trôi khỏi lưới PCM tới 0,48 s).
          // P[0] = mẫu đầu frame firstSampleIndex; L[j] = raw[j+1024]
          // (ffmpeg trim priming) => P[0] = L[firstSampleIndex*1024-1024].
          // Riêng firstSampleIndex=0 (không có tiền lệ): 1024 mẫu đầu
          // của P là frame 0 decode thiếu tiền lệ (gần im) — so từ P[1024].
          const fi = P.firstSampleIndex;
          if (fi === 0) {
            w.alignPrimingVsL = mad(P.channels[0], 1024, L, 0, N);
          } else {
            w.alignPrimingVsL = mad(P.channels[0], 0, L, fi*1024 - 1024, N);
          }
          w.firstSampleIndex = fi;
          w.firstBlockRms = rms(P.channels[0], 1024); // ~0,32 nếu frame đầu đúng; ~0,004 nếu thiếu tiền lệ
          // R (decodeAudioData) đã resample sang rate khác — chỉ ghi sr để ghi chú, không so mẫu
          w.refSampleRate = ref.sampleRate;
        } else w.reason = P.reason;
        out.windows['[' + w0 + ',' + (w0 + wSec) + ']'] = w;
      }
      // tham chiếu decode toàn file bằng decodeAudioData
      const t0 = performance.now();
      await ac.decodeAudioData(buf.slice(0));
      out.fullDecodeMs = +(performance.now() - t0).toFixed(1);
      return out;
    })()`);
    results[f.name] = r;
    console.log(f.name, JSON.stringify(r));
  }
  fs.writeFileSync(`${DIR198}/partial-verify-198.json`, JSON.stringify(results, null, 2));
  console.log("saved", `${DIR198}/partial-verify-198.json`);
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  server.close();
}
