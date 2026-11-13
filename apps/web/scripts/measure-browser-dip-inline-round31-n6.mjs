// measure-browser-dip-inline-round31-n6.mjs — Phase 9 đợt 31, luồng N6.
// Đo vòng lặp dip product-vs-inline TRONG Chromium headless qua CDP
// (bổ sung cho nợ "inline trên browser chưa đo" của đợt 30 M6 §6).
// Dùng CHÍNH singleClipDipPixel của transitionPreview.ts (transpile
// verbatim qua tsc, không cài lại công thức). Chỉ đo, không sửa code
// sản phẩm. Chrome: $CHROME_BIN (mặc định bản Playwright trong cache);
// KHÔNG dùng binary browser của Muse (bị chặn bởi policy domain).
// Chạy từ gốc repo:
//   CHROME_BIN=<đường dẫn chrome> node apps/web/scripts/measure-browser-dip-inline-round31-n6.mjs [--json OUT]
// Kết quả in ra stdout (JSON); --json ghi thêm file.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const args = process.argv.slice(2);
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const JSON_OUT = getOpt("--json", null);
const CHROME = process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache", "ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const PORT = 9231;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-n6-r31b-"));
const tsc = path.join(ROOT, "node_modules", ".bin", "tsc");
const r = spawnSync(tsc, [path.join(ROOT, "apps/web/src/lib/transitionPreview.ts"),
  "--outDir", TMP, "--module", "commonjs", "--target", "es2020",
  "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
if (r.status !== 0) throw new Error(`tsc thất bại: ${(r.stdout || "") + (r.stderr || "")}`.slice(0, 500));
const tpCode = fs.readFileSync(path.join(TMP, "transitionPreview.js"), "utf8");

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(TMP, "prof")}`,
  "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
// Đợt 35 R5 — cùng mẫu mobile-touch-check: mỗi lần fetch /json có
// AbortSignal 5000ms (CDP_JSON_ATTEMPT_TIMEOUT_MS) để kết nối kẹt
// không treo cả vòng 50 lần; nhịp 50 lần × 200ms giữ nguyên. Chờ
// ws.onopen có timeout 30000ms (CDP_WS_OPEN_TIMEOUT_MS) thay vì chờ
// vô hạn (trước đây chỉ có onerror).
const CDP_JSON_ATTEMPT_TIMEOUT_MS = Number(process.env.CDP_JSON_ATTEMPT_TIMEOUT_MS || 5000);
const CDP_WS_OPEN_TIMEOUT_MS = Number(process.env.CDP_WS_OPEN_TIMEOUT_MS || 30000);
let targets;
for (let i = 0; i < 50; i++) {
  try {
    const ctrl = new AbortController();
    const at = setTimeout(() => ctrl.abort(), CDP_JSON_ATTEMPT_TIMEOUT_MS);
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`, { signal: ctrl.signal })).json(); } finally { clearTimeout(at); }
    if (targets.length) break;
  } catch { /* chưa lên */ }
  await sleep(200);
}
if (!targets?.length) throw new Error("Chrome CDP không lên");
const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("ws open timeout " + CDP_WS_OPEN_TIMEOUT_MS + "ms")), CDP_WS_OPEN_TIMEOUT_MS); ws.onopen = () => { clearTimeout(t); res(); }; ws.onerror = (e) => { clearTimeout(t); rej(e); }; });
let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) rej(new Error(JSON.stringify(m.error)));
    else res(m.result);
  }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq;
  pending.set(id, { res, rej });
  ws.send(JSON.stringify({ id, method, params }));
});
await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url: "about:blank" });
await sleep(500);
const expr = `
(async () => {
  const module = { exports: {} };
  const exports = module.exports;
  ${tpCode}
  const single = module.exports.singleClipDipPixel;
  const out = {};
  for (const [name, W, H] of [["1080p", 1080, 1920], ["4K", 2160, 3840]]) {
    const npix = W * H;
    const base = new Uint8ClampedArray(npix * 4);
    for (let i = 0; i < npix; i++) {
      const o = i * 4;
      base[o] = (i * 37 + 11) % 256; base[o + 1] = (i * 91 + 53) % 256;
      base[o + 2] = (i * 53 + 97) % 256; base[o + 3] = (i % 10 === 0) ? 0 : 255;
    }
    for (const mode of (name === "1080p" ? ["white", "gray"] : ["white"])) {
      const alpha = 0.5;
      const loopProduct = (data) => {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          const [rr, gg, bb] = single([data[i], data[i + 1], data[i + 2]], alpha, mode);
          data[i] = Math.round(rr); data[i + 1] = Math.round(gg); data[i + 2] = Math.round(bb);
        }
      };
      const loopInline = (data) => {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          const dip = mode === "white" ? 255 : (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = Math.round(alpha * data[i] + (1 - alpha) * dip);
          data[i + 1] = Math.round(alpha * data[i + 1] + (1 - alpha) * dip);
          data[i + 2] = Math.round(alpha * data[i + 2] + (1 - alpha) * dip);
        }
      };
      const d1 = Uint8ClampedArray.from(base); loopProduct(d1);
      const d2 = Uint8ClampedArray.from(base); loopInline(d2);
      let sum = 0; for (let k = 0; k < d1.length; k++) sum += Math.abs(d1[k] - d2[k]);
      const mad = sum / d1.length;
      for (let w = 0; w < 2; w++) { loopProduct(Uint8ClampedArray.from(base)); loopInline(Uint8ClampedArray.from(base)); }
      const tP = [], tI = [];
      const reps = name === "1080p" ? 5 : 3;
      for (let rr = 0; rr < reps; rr++) { const d = Uint8ClampedArray.from(base); const t0 = performance.now(); loopProduct(d); tP.push(performance.now() - t0); }
      for (let rr = 0; rr < reps; rr++) { const d = Uint8ClampedArray.from(base); const t0 = performance.now(); loopInline(d); tI.push(performance.now() - t0); }
      const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
      out[name + "/" + mode] = { productMs: tP.map((v) => +v.toFixed(1)), inlineMs: tI.map((v) => +v.toFixed(1)), productMedian: +med(tP).toFixed(1), inlineMedian: +med(tI).toFixed(1), mad: +mad.toFixed(4) };
    }
  }
  return JSON.stringify(out);
})()
`;
const ev = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
const value = ev.result?.value ?? "";
console.log(value);
if (JSON_OUT) {
  const p = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  writeFileEpermRetry(p, JSON.stringify({ browser: "chromium-headless-playwright-1248", result: JSON.parse(value) }, null, 2));
  console.log(`JSON: ${p}`);
}
ws.close();
chrome.kill("SIGKILL");
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* kệ */ }
