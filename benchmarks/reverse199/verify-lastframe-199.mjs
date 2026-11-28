// verify-lastframe-199.mjs — XÁC MINH giả thuyết frame cuối (trước khi sửa):
// gọi decodeAudioWindowPartial (bundle từ source HIỆN TẠI) trên longA/longB
// với các cửa sổ app thật ([270.154,30] = cửa sổ cuối) + [270,30] + [0,30],
// in ok/reason/sampleCount/firstSampleIndex + kết quả slice.
// Port/profile RIÊNG đợt 199 (không đụng harness 198).
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
const HOME = "/home/hatch";
const DIR199 = `${HOME}/workspace/goals/capcut-clone-video-editor/hidden_files/round199-p3`;
const FIX195 = `${HOME}/workspace/tmp-round195-p3`;
const PORT = 4231, CDP_PORT = 9255;
const CHROME = `${HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome`;
const FILES = [
  { name: "longA", file: "longA-300s-gop300-720p.mp4", windows: [[270.6, 30], [270.154, 30], [270, 30], [0, 30], [120, 30]] },
  { name: "longB", file: "longB-300s-gop15-360p.mp4", windows: [[270.6, 30], [270.154, 30], [270, 30]] },
];
const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
    if (urlPath === "/") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><title>v</title><script src=\"/partial199.bundle.js\"></script>"); return; }
    if (urlPath === "/partial199.bundle.js") { res.writeHead(200, { "Content-Type": "text/javascript" }); fs.createReadStream(`${DIR199}/partial199.bundle.js`).pipe(res); return; }
    const f = path.join(FIX195, path.basename(urlPath));
    if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": "video/mp4" }); fs.createReadStream(f).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${CDP_PORT}`, "--user-data-dir=/tmp/round199-p3-verify-profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = null;
for (let i = 0; i < 90; i++) { try { targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json(); if (targets.length) break; } catch {} await sleep(500); }
if (!targets?.length) throw new Error("no CDP targets");
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const id = ++msgId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error("timeout")); } }, 120000); }); }
async function ev(expr) { const r = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800)); return r.result?.result?.value; }
const out = {};
try {
  await cdp("Page.enable"); await cdp("Runtime.enable");
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await sleep(1500);
  for (const f of FILES) {
    const r = await ev(`(async()=>{
      const buf = await (await fetch('/${f.file}')).arrayBuffer();
      const res = {};
      for (const [w0, wSec] of ${JSON.stringify(f.windows)}) {
        const t0 = performance.now();
        const p = await window.__partial199.decodeAudioWindowPartial(buf, w0, wSec);
        const ms = +(performance.now() - t0).toFixed(1);
        const e = { ok: p.ok, ms };
        if (p.ok) {
          e.firstSampleIndex = p.firstSampleIndex; e.sampleCount = p.sampleCount;
          e.samplesPerFrame = p.samplesPerFrame; e.durationSec = +p.durationSec.toFixed(4);
          e.cover = [+p.coverStartSec.toFixed(4), +p.coverEndSec.toFixed(4)];
          e.primingTrimmed = p.primingTrimmedSamples;
          const s = window.__partial199.slicePartialPcmForWindow(p, w0, wSec);
          e.slice = s ? { startIdx: s.startIdx, endIdx: s.endIdx, len: s.channels[0].length } : null;
        } else e.reason = p.reason;
        res['[' + w0 + ',' + (w0 + wSec) + ']'] = e;
      }
      return res;
    })()`);
    out[f.name] = r;
    console.log(f.name, JSON.stringify(r, null, 2));
  }
  fs.writeFileSync(`${DIR199}/verify-lastframe-199.json`, JSON.stringify(out, null, 2));
  console.log("saved verify-lastframe-199.json");
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  server.close();
}
