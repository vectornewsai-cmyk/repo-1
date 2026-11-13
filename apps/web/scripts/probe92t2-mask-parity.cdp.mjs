#!/usr/bin/env node
/**
 * probe92t2-mask-parity.cdp.mjs — Phase 9 đợt 92, luồng T2:
 * parity pixel giữa đường mask MỚI (canvas alpha cache + destination-in)
 * và đường CŨ (getImageData + applyMask + putImageData) trên cùng 1
 * frame, cùng spec — chứng minh lệch duy nhất là làm tròn compositor.
 *
 * Cách đo: seed spec B (mask ellipse tĩnh + blur), pause tại t=1.0
 * (đường mask trực tiếp — maskedUnitSource là điểm đổi duy nhất),
 * đọc pixels canvas preview; rồi đặt window.__vcutMaskCanvasPath=false
 * (ép đường cũ), vẽ lại cùng frame (setPlayhead 1.001 — cùng frameIdx
 * 30, mask tĩnh nên hình học y hệt), đọc lại; so MAD / max / % pixel
 * lệch > 1. Lặp lại đường mới lần nữa để kiểm tính xác định (A vs A').
 *
 * Chạy: node apps/web/scripts/probe92t2-mask-parity.cdp.mjs
 *   [--spec ~/workspace/round92-t2/specs/b-blur.json]
 *   [--out ~/workspace/round92-t2/out/mask-parity-b.json]
 * Cần vite dev cổng 5173 + media stripes-scroll.mp4 trong public/.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const URL = opt("--url", "http://127.0.0.1:5173/");
const OUT = opt("--out", "");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9233"));
const SPEC_PATH = opt("--spec", path.join(os.homedir(), "workspace/round92-t2/specs/b-blur.json"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { this.pending.get(m.id)(m); this.pending.delete(m.id); }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`timeout ${method}`)); } }, 60000);
    });
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error("evaluate lỗi: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p3storeMod || (window.__p3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const READ_PIXELS_FN = `(async () => {
  const cv = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!cv) return { error: "không thấy canvas preview" };
  const ctx = cv.getContext("2d");
  if (!ctx) return { error: "không lấy được ctx" };
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  // Trả về dạng gọn: tổng checksum + mảng bytes (base64) để so ở Node.
  let sum = 0;
  for (let i = 0; i < img.data.length; i++) sum = (sum + img.data[i]) >>> 0;
  let bin = "";
  const chunk = 8192;
  for (let i = 0; i < img.data.length; i += chunk) {
    bin += String.fromCharCode.apply(null, img.data.subarray(i, i + chunk));
  }
  return { w: img.width, h: img.height, sum, b64: btoa(bin) };
})()`;

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-92t2-parity-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1440,900", "--autoplay-policy=no-user-gesture-required", "about:blank",
], { stdio: "ignore" });
const cleanup = () => {
  try { chrome.kill("SIGKILL"); } catch { /* noop */ }
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* noop */ }
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

let target = null;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch { /* chưa lên */ }
  await sleep(500);
}
if (!target) { console.error("không kết nối được Chrome CDP"); process.exit(2); }
const cdp = new CDP(target.webSocketDebuggerUrl);
await cdp.connect();
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Page.navigate", { url: URL });
let booted = false;
for (let i = 0; i < 60; i++) {
  const hasCanvas = await cdp.eval(`!!document.querySelector("#vcut-preview-wrap canvas.preview-canvas")`, false).catch(() => false);
  if (hasCanvas) { booted = true; break; }
  await sleep(500);
}
if (!booted) { console.error("app không boot (không thấy canvas preview)"); process.exit(2); }
console.log("app boot OK");
for (let i = 0; i < 20; i++) {
  const closed = await cdp.eval(`(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => x.textContent.trim() === "Để sau");
    if (b) { b.click(); return "closed"; }
    return "no-modal";
  })()`, false).catch(() => "err");
  if (closed === "closed") break;
  await sleep(500);
}
const specJson = JSON.stringify(spec).replace(/`/g, "\\`").replace(/\$/g, "\\$");
const seeded = await cdp.eval(`(async () => {
  const st = await (${STORE_FN});
  st.replaceProject(${specJson});
  const res = await fetch("/stripes-scroll.mp4");
  if (!res.ok) return { error: "fetch media lỗi " + res.status };
  const blob = await res.blob();
  const file = new File([blob], "stripes-scroll.mp4", { type: "video/mp4" });
  const st2 = await (${STORE_FN});
  await st2.importFiles([file]);
  const st3 = await (${STORE_FN});
  return { media: (st3.media || []).map((m) => m.name) };
})()`);
console.log("seed:", JSON.stringify(seeded));
if (!seeded || seeded.error || !(seeded.media || []).includes("stripes-scroll.mp4")) {
  console.error("seed media thất bại"); process.exit(2);
}
await sleep(1500);

async function seekAndRead(t, label) {
  // Seek pause tới t, chờ element hết seeking + canvas ổn định (2 lần
  // đọc cách 400ms giống hệt nhau) rồi trả pixels.
  await cdp.eval(`(async () => {
    const st = await (${STORE_FN});
    if (st.playing) st.togglePlay();
    st.setPlayhead(${t});
  })()`);
  let stable = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    const px = await cdp.eval(READ_PIXELS_FN);
    if (px.error) throw new Error(px.error);
    if (stable && stable.sum === px.sum && stable.b64 === px.b64) {
      console.log(`  ${label}: ổn định sau ${(i + 1) * 400}ms (canvas ${px.w}×${px.h})`);
      return px;
    }
    stable = px;
  }
  console.log(`  ${label}: CẢNH BÁO canvas không ổn định sau 12s, lấy mẫu cuối`);
  return stable;
}

function comparePixels(a, b, label) {
  const da = Buffer.from(a.b64, "base64");
  const db = Buffer.from(b.b64, "base64");
  if (da.length !== db.length) return { label, error: `độ dài khác nhau ${da.length} vs ${db.length}` };
  let sumAbs = 0;
  let maxAbs = 0;
  let nDiff = 0;
  let nGt1 = 0;
  for (let i = 0; i < da.length; i++) {
    const d = Math.abs(da[i] - db[i]);
    if (d > 0) nDiff++;
    if (d > 1) nGt1++;
    if (d > maxAbs) maxAbs = d;
    sumAbs += d;
  }
  const n = da.length;
  return {
    label,
    pixels: n / 4,
    mad: +(sumAbs / n).toFixed(4),
    maxAbs,
    diffFrac: +(nDiff / n).toFixed(4),
    gt1Frac: +(nGt1 / n).toFixed(4),
  };
}

// A: đường mới (mặc định). t=1.0, pause.
const pxA = await seekAndRead(1.0, "A (canvas path, t=1.0)");
// B: đường cũ — ép hook rồi vẽ lại cùng frame (t=1.001, cùng frameIdx 30).
await cdp.eval(`window.__vcutMaskCanvasPath = false`, false);
const pxB = await seekAndRead(1.001, "B (CPU path, t=1.001)");
// A': đường mới lại (t=1.0) — kiểm tính xác định.
await cdp.eval(`delete window.__vcutMaskCanvasPath`, false);
const pxA2 = await seekAndRead(1.0, "A' (canvas path lại, t=1.0)");

const cmpAB = comparePixels(pxA, pxB, "A vs B (mới vs cũ)");
const cmpAA = comparePixels(pxA, pxA2, "A vs A' (mới vs mới, xác định)");
console.log("MAD A vs B:", JSON.stringify(cmpAB));
console.log("MAD A vs A':", JSON.stringify(cmpAA));
const out = { mode: "mask-parity", spec: path.basename(SPEC_PATH), cmpAB, cmpAA };
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log("ghi:", OUT); }
cdp.close();
cleanup();
console.log("XONG");
