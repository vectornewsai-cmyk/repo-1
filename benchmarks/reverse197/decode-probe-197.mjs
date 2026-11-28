// decode-probe-197.mjs — Đợt 197 P3: probe decode TÁCH RIÊNG (nợ §5.1 đợt 195,
// §5.1 LIMITS P3-196): decode cùng file NHIỀU LẦN LIÊN TIẾP trong 1
// AudioContext rảnh, không phát ngược, để tách (a) warmup decoder khỏi
// (b) tranh chấp tải máy — hai giả thuyết đối thủ cho số decode cửa sổ
// 4,8–10,8 s đợt 196. Đồng thời đo chi phí slice+reverse 1 cửa sổ 30 s
// từ buffer đã decode (đường cache đợt 197) + bộ nhớ (jsHeap + avail).
// Chạy: node decode-probe-197.mjs  (mặc định cả 3 fixture, 3 lần decode/file)
// Ghi JSON vào ~/workspace/tmp-round197-p3/decode-probe-197.json
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const HOME = "/home/hatch";
const DIR197 = `${HOME}/workspace/tmp-round197-p3`;
const FIX = `${HOME}/workspace/tmp-round195-p3`;
const FILES = [
  `${FIX}/longA-300s-gop300-720p.mp4`,
  `${FIX}/longB-300s-gop15-360p.mp4`,
  `${HOME}/workspace/tmp-round193-p3/chirp-70s.mp4`,
];
const PORT = parseInt(process.env.P197_PORT || "4211", 10);
const CDP_PORT = parseInt(process.env.P197_CDP_PORT || "9235", 10);
const CHROME = `${HOME}/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome`;
const REPEATS = parseInt(process.env.P197_REPEATS || "3", 10);

const availKb = () => {
  try {
    const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  } catch { return null; }
};
const loadavg = () => {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/).slice(0, 3).join(" "); } catch { return "?"; }
};

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
    if (urlPath === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!doctype html><title>decode-probe-197</title>");
      return;
    }
    const file = path.join(FIX, path.basename(urlPath));
    const alt = path.join(`${HOME}/workspace/tmp-round193-p3`, path.basename(urlPath));
    const f = fs.existsSync(file) ? file : alt;
    if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": "video/mp4" });
    fs.createReadStream(f).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu",
  `--remote-debugging-port=${CDP_PORT}`,
  "--user-data-dir=/tmp/round197-p3-decode-profile",
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
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(`CDP timeout ${method}`)); } }, 120000);
  });
}
async function ev(expr) {
  const r = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(`evaluate lỗi: ${JSON.stringify(r.result.exceptionDetails).slice(0, 400)}`);
  return r.result?.result?.value;
}
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

const results = { port: PORT, loadStart: loadavg(), availStartKb: availKb(), files: [] };
try {
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await sleep(1500);
  // Một AudioContext duy nhất cho toàn bộ probe (decode lặp đo warmup).
  await ev(`(()=>{window.__ac = new (window.AudioContext||window.webkitAudioContext)(); window.__bufs = {}; return window.__ac.sampleRate;})()`);
  for (const file of FILES) {
    const base = path.basename(file);
    const sizeB = fs.statSync(file).size;
    const f = await ev(`(async()=>{
      const t0 = performance.now();
      const resp = await fetch(${JSON.stringify(`/${base}`)});
      const buf = await resp.arrayBuffer();
      const fetchMs = performance.now() - t0;
      window.__raw = buf;
      const ac = window.__ac;
      const decodes = [];
      let decoded = null;
      for (let i = 0; i < ${REPEATS}; i++) {
        const d0 = performance.now();
        decoded = await ac.decodeAudioData(buf.slice(0));
        decodes.push(+(performance.now() - d0).toFixed(1));
      }
      // Slice + reverse 1 cửa sổ 30 s từ buffer đã decode (đường cache 197):
      // trích subarray [startIdx, endIdx) rồi đảo từng kênh (y hệt
      // loadReversedWindow, trừ bước decodeAudioData).
      const sr = decoded.sampleRate, total = decoded.length, D = decoded.duration;
      const slices = [];
      const heapBefore = performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null;
      for (const w0 of [Math.max(0, D - 30), Math.max(0, D - 60), Math.max(0, D - 90)]) {
        const s0 = performance.now();
        const endIdx = Math.min(total, Math.floor((w0 + 30) * sr));
        const startIdx = Math.max(0, endIdx - Math.floor(30 * sr));
        const len = endIdx - startIdx;
        const out = ac.createBuffer(decoded.numberOfChannels, len, sr);
        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          const src = decoded.getChannelData(ch);
          const sub = src.subarray(startIdx, endIdx);
          const rev = new Float32Array(sub.length);
          for (let i = 0; i < sub.length; i++) rev[i] = sub[sub.length - 1 - i];
          out.getChannelData(ch).set(rev);
        }
        slices.push({ w0, ms: +(performance.now() - s0).toFixed(1), len });
      }
      const heapAfter = performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null;
      window.__bufs[${JSON.stringify(base)}] = decoded; // GIỮ buffer đã decode (đo heap khi giữ cache)
      const heapKept = performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null;
      return { base: ${JSON.stringify(base)}, sizeB: ${sizeB}, fetchMs: +fetchMs.toFixed(1), duration: +D.toFixed(2), sampleRate: sr,
        channels: decoded.numberOfChannels, length: total,
        decodedMB: +((total * decoded.numberOfChannels * 4) / 1048576).toFixed(1),
        decodes, slices, heapBefore, heapAfter, heapKept };
    })()`);
    const availAfter = availKb();
    results.files.push({ ...f, loadDuring: loadavg(), availAfterKb: availAfter });
    log(`${f.base}: fetch ${f.fetchMs}ms, dur ${f.duration}s ${f.channels}ch ${f.sampleRate}Hz, decoded ~${f.decodedMB}MB; decode x${REPEATS}: ${f.decodes.join(" / ")} ms; slice+reverse 30s: ${f.slices.map((s) => `${s.ms}ms`).join(" / ")}; heap ${f.heapBefore}→${f.heapAfter}→giữ ${f.heapKept} MB; avail ${availAfter} kB; load ${loadavg()}`);
    // Nhả buffer đã giữ trước file tiếp theo (trừ khi muốn đo giữ lâu — đo riêng ở cuối nếu cần).
    await ev(`(()=>{delete window.__bufs[${JSON.stringify(base)}]; return true;})()`);
    if (global.gc) global.gc();
  }
  results.loadEnd = loadavg();
  results.availEndKb = availKb();
  fs.writeFileSync(`${DIR197}/decode-probe-197.json`, JSON.stringify(results, null, 2));
  log(`GHI ${DIR197}/decode-probe-197.json; load ${results.loadStart} → ${results.loadEnd}; avail ${results.availStartKb} → ${results.availEndKb} kB`);
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  server.close();
}
