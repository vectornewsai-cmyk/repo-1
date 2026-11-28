// voicefx194-render-sample.mjs — Render 1 file wav qua chain voice-effect PREVIEW
// (createVoiceChain thật) bằng headless Chrome + OfflineAudioContext, ghi wav 48k mono.
//   node apps/web/scripts/voicefx194-render-sample.mjs --in <wav> --out <wav>
//     --preset '{"pitch":7,"telephone":true}' [--chrome <bin>] [--sr 48000]
// Dùng để nghe kiểm voice-effect bằng tai người (nợ P1 §5 đợt 193): script chỉ
// stage, KHÔNG stage file wav binary (user tự chạy để gen clip nghe).
// Thoát 2 khi thiếu input/chrome/preset sai; thoát 1 khi render lỗi.
// Đợt 194 P1 (Phase 9 VCut) — bundle previewVoiceFx.ts thật bằng esbuild,
// đo kiểm: render ref.wav 8,32 s tel+pitch+7 cho cùng số đo với page đo đợt 194
// (rms -21,5 dB, centroid 885 Hz, mid 97,6% — xem LIMITS đợt 194 P1 §3).
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const arg = (k, d = "") => { const i = process.argv.indexOf(k); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const IN = arg("--in");
const OUT = arg("--out");
const PRESET_RAW = arg("--preset", '{"telephone":true,"pitch":7}');
const CHROME = arg("--chrome", path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const SR = parseInt(arg("--sr", "48000"), 10);

if (!IN || !fs.existsSync(IN)) { console.error(`thiếu --in <wav> (không thấy file: ${IN || "(trống)"})`); process.exit(2); }
if (!OUT) { console.error("thiếu --out <wav>"); process.exit(2); }
let preset;
try { preset = JSON.parse(PRESET_RAW); } catch { console.error(`preset JSON sai: ${PRESET_RAW}`); process.exit(2); }
if (!fs.existsSync(CHROME)) { console.error(`không thấy Chrome tại ${CHROME} (đặt --chrome)`); process.exit(2); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "voicefx194-sample-"));
const { execFileSync } = await import("node:child_process");
execFileSync(path.join(REPO, "node_modules/.bin/esbuild"), [
  path.join(REPO, "apps/web/src/lib/previewVoiceFx.ts"),
  "--bundle", "--format=esm", "--platform=browser",
  `--outfile=${path.join(tmp, "voicefx-bundle.mjs")}`, "--log-level=warning",
], { stdio: "inherit" });
fs.writeFileSync(path.join(tmp, "page.mjs"), `
import { createVoiceChain } from "./voicefx-bundle.mjs";
function encodeWav(samples, sr) {
  const n = samples.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); ws(8, "WAVE");
  ws(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const x = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
  return new Uint8Array(buf);
}
window.__render = async (preset, sr) => {
  const res = await fetch("./in.wav");
  if (!res.ok) throw new Error("không tải được in.wav");
  const ab = await res.arrayBuffer();
  const dec = new OfflineAudioContext(1, 1, sr);
  const audio = await dec.decodeAudioData(ab);
  const ch0 = audio.getChannelData(0);
  const ctx = new OfflineAudioContext(1, ch0.length, sr);
  const chain = createVoiceChain(ctx);
  chain.setParams(preset, 0);
  const src = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ch0.length, sr);
  buf.getChannelData(0).set(ch0);
  src.buffer = buf;
  src.connect(chain.input);
  chain.output.connect(ctx.destination);
  src.start(0);
  const out = await ctx.startRendering();
  try { chain.dispose(); } catch {}
  const wav = encodeWav(out.getChannelData(0), sr);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < wav.length; i += chunk) bin += String.fromCharCode.apply(null, wav.subarray(i, i + chunk));
  return { b64: btoa(bin), durSec: +(ch0.length / sr).toFixed(2), inRate: audio.sampleRate };
};
window.__ready = true;
`);
fs.writeFileSync(path.join(tmp, "page.html"),
  '<!doctype html><meta charset="utf-8"><script type="module" src="./page.mjs"></script><body>sample</body>');
fs.copyFileSync(IN, path.join(tmp, "in.wav"));

const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".wav": "audio/wav" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = url === "/" ? "page.html" : url.slice(1);
  const p = path.join(tmp, file);
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const PORT = server.address().port;

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map();
    this.ws.addEventListener("message", (ev) => {
      let msg; try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    });
  }
  ready() { return new Promise((res, rej) => { this.ws.addEventListener("open", res, { once: true }); this.ws.addEventListener("error", rej, { once: true }); }); }
  send(method, params = {}, timeoutMs = 120000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, awaitPromise = false, timeoutMs = 120000) {
    const res = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise }, timeoutMs);
    if (res.exceptionDetails) throw new Error(`evaluate failed: ${JSON.stringify(res.exceptionDetails).slice(0, 1000)}`);
    return res.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vf194s-chrome-"));
const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--mute-audio",
  `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--remote-allow-origins=*", "about:blank"],
  { stdio: ["ignore", "pipe", "pipe"] });
let stderr = "";
chrome.stderr.on("data", (d) => { stderr += d.toString(); });
let wsUrl = null;
for (let i = 0; i < 100 && !wsUrl; i++) {
  const m = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
  if (m) wsUrl = m[1];
  else await new Promise((r) => setTimeout(r, 200));
  if (chrome.exitCode !== null) { console.error(`chrome thoát sớm: ${stderr.slice(-1000)}`); process.exit(1); }
}
if (!wsUrl) { console.error("không thấy DevTools ws"); process.exit(1); }
const dbgPort = new URL(wsUrl).port;
const listJson = await new Promise((resolve, reject) => {
  http.get({ host: "127.0.0.1", port: dbgPort, path: "/json/list" }, (res) => {
    let d = ""; res.on("data", (c) => { d += c; }); res.on("end", () => resolve(d));
  }).on("error", reject);
});
const pageTarget = JSON.parse(listJson).find((t) => t.type === "page");
if (!pageTarget) { console.error("không thấy page target"); process.exit(1); }
const tab = new Cdp(pageTarget.webSocketDebuggerUrl);
await tab.ready();
await tab.send("Page.enable");
await tab.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/page.html` });
for (let i = 0; i < 100; i++) {
  if (await tab.evaluate("window.__ready === true").catch(() => false)) break;
  await new Promise((r) => setTimeout(r, 200));
}
const res = await tab.evaluate(`window.__render(${JSON.stringify(preset)}, ${SR})`, true, 300000);
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(res.b64, "base64"));
tab.close();
chrome.kill("SIGKILL");
server.close();
console.log(`[voicefx194-sample] ${IN} --preset ${JSON.stringify(preset)} -> ${OUT} (${res.durSec}s, inRate ${res.inRate}Hz, outRate ${SR}Hz)`);
