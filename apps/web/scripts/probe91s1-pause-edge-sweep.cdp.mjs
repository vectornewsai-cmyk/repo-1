#!/usr/bin/env node
/**
 * probe91s1-pause-edge-sweep.cdp.mjs — Phase 9 đợt 91, luồng S1:
 * điều tra mép phải max 3.6px (R1 §5.2) bằng cách QUÉT PAUSE.
 *
 * Câu hỏi: edgeR = 3.6px chỉ xuất hiện ở play khi mask track dừng ở
 * cx=0.70 (cuối track) — đó là lỗi của blend/play, hay là pha sub-pixel
 * của chính mép mask (cũng có ở pause)? Quét playhead pause từ 0→2.2
 * bước 0.05 (cx 0.3→0.7), chờ ổn định rồi đo edgeL/R bằng đúng hàm đo
 * của harness R1/S1 (lấy MEASURE_FN_SRC từ probe91s1-motionblur-rvfc).
 *
 * Kết luận kỳ vọng nếu là pha sub-pixel: edgeR ở pause cũng dao động
 * 2.1–3.6 theo cx, và đạt 3.6 tại cx=0.7 — tức KHÔNG phải lỗi blur/play,
 * không sửa code (chỉ ghi nhận: mép đo theo project px khuếch đại
 * lượng tử hoá canvas 1px = 2.6px project).
 *
 * Chạy: node apps/web/scripts/probe91s1-pause-edge-sweep.cdp.mjs
 *   [--out ~/workspace/round91-s1/out/pause-edge-sweep.json]
 * Cần vite dev cổng 5173 + media stripes-static.mp4 trong public/.
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
const CDP_PORT = Number(opt("--cdp-port", "9231"));
const SPEC_PATH = path.join(os.homedir(), "workspace/round90-r1/specs/a-blur.json");

// Lấy đúng hàm đo pixel của harness S1 (đừng copy tay — lệch là số sai).
const harnessSrc = fs.readFileSync(
  path.join(path.dirname(new globalThis.URL(import.meta.url).pathname), "probe91s1-motionblur-rvfc.cdp.mjs"),
  "utf8",
);
const m = harnessSrc.match(/const MEASURE_FN_SRC = `([\s\S]*?)`;\s*const MEASURE_FN/);
if (!m) { console.error("không trích được MEASURE_FN_SRC từ harness S1"); process.exit(2); }
const MEASURE_FN_SRC = m[1];
const MEASURE_FN = `(${MEASURE_FN_SRC})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (ev) => {
      const m2 = JSON.parse(ev.data);
      if (m2.id && this.pending.has(m2.id)) { this.pending.get(m2.id)(m2); this.pending.delete(m2.id); }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, (mm) => (mm.error ? reject(new Error(JSON.stringify(mm.error))) : resolve(mm.result)));
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

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-91s1-sweep-"));
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

await cdp.eval(`window.__p3pw = 1280; window.__p3ph = 720; window.__p3trailFrac = 0.2;`, false);
const specJson = JSON.stringify(spec).replace(/`/g, "\\`").replace(/\$/g, "\\$");
const seeded = await cdp.eval(`(async () => {
  const st = await (${STORE_FN});
  st.replaceProject(${specJson});
  const res = await fetch("/stripes-static.mp4");
  if (!res.ok) return { error: "fetch media lỗi " + res.status };
  const blob = await res.blob();
  const file = new File([blob], "stripes-static.mp4", { type: "video/mp4" });
  const st2 = await (${STORE_FN});
  await st2.importFiles([file]);
  const st3 = await (${STORE_FN});
  return { media: (st3.media || []).map((m) => m.name) };
})()`);
console.log("seed:", JSON.stringify(seeded));
if (!seeded || seeded.error || !(seeded.media || []).includes("stripes-static.mp4")) {
  console.error("seed media thất bại"); process.exit(2);
}
await sleep(1500);

const rows = [];
for (let ti = 0; ti <= 44; ti++) {
  const t = +(ti * 0.05).toFixed(2);
  await cdp.eval(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(${t}); return st.playhead; })()`);
  let last = null, stable = 0, cur = null;
  for (let i = 0; i < 40; i++) {
    await sleep(400);
    cur = await cdp.eval(MEASURE_FN, false).catch((e) => ({ error: String(e).slice(0, 200) }));
    if (cur && !cur.error && last && Math.abs(cur.cx - last.cx) < 0.0015 && Math.abs(cur.cy - last.cy) < 0.0015) {
      stable++;
      if (stable >= 2) break;
    } else stable = 0;
    last = cur;
  }
  const row = { t, cx: cur?.cx ?? null, edgeL: cur?.edgeL_pxProj ?? null, edgeR: cur?.edgeR_pxProj ?? null, w50: cur?.w50_pxProj ?? null, r90frac: cur?.r90frac ?? null, cxCfrac: cur?.cxCfrac ?? null, error: cur?.error ?? null };
  rows.push(row);
  console.log(`t=${t.toFixed(2)} cx=${row.cx} edgeL=${row.edgeL} edgeR=${row.edgeR} w50=${row.w50} r90frac=${row.r90frac} cxCfrac=${row.cxCfrac}`);
}
const valid = rows.filter((r) => r.edgeR !== null);
const maxR = Math.max(...valid.map((r) => r.edgeR));
const at07 = valid.filter((r) => r.cx !== null && Math.abs(r.cx - 0.7) < 0.005);
console.log(`\nTÓM TẮT: n=${valid.length}, edgeR min=${Math.min(...valid.map((r) => r.edgeR))} med=${[...valid.map((r) => r.edgeR)].sort((a, b) => a - b)[Math.floor(valid.length / 2)]} max=${maxR}`);
console.log(`edgeR tại cx=0.7 (track dừng): ${JSON.stringify(at07.map((r) => ({ t: r.t, edgeR: r.edgeR, r90frac: r.r90frac })))}`);
console.log(`số mốc edgeR >= 3.2: ${valid.filter((r) => r.edgeR >= 3.2).length} / ${valid.length} (t=${valid.filter((r) => r.edgeR >= 3.2).map((r) => r.t).join(",")})`);
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify({ mode: "pause-edge-sweep", spec: "a-blur.json", rows }, null, 1)); console.log("ghi:", OUT); }
cdp.close();
cleanup();
console.log("XONG");
