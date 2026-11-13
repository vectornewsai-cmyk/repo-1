#!/usr/bin/env node
/**
 * probe87o4-mask-track-preview.cdp.mjs — Phase 9 đợt 87, luồng O4: parity
 * preview–render cho mask bám motion track (mirror render --mask-mode
 * trackgeq của O3 / png của O2).
 *
 * SETUP (trước khi chạy):
 *   1. Tạo video trắng 1280x720 3s rồi đặt vào apps/web/public/:
 *        ffmpeg -y -f lavfi -i color=c=white:s=1280x720:r=30:d=3 \
 *          -c:v libx264 -pix_fmt yuv420p apps/web/public/white720-o4.mp4
 *      (xóa file này sau khi đo xong — KHÔNG stage binary vào batch.)
 *   2. Chạy vite dev ở gốc apps/web:  npm run dev -- --port 5173 --host 127.0.0.1
 *   3. Chạy từ gốc repo:
 *        node apps/web/scripts/probe87o4-mask-track-preview.cdp.mjs
 *      [--url http://127.0.0.1:5173/] [--media white720-o4.mp4] [--times 0.5,1,1.5]
 *
 * Luồng: mở app thật (Chromium headless qua CDP) → replaceProject với spec
 * mask ellipse tĩnh tâm (0.3, 0.5) + track tuyến tính (0,0.3,0.5)→(2,0.7,0.5)
 * → import video trắng qua store.importFiles (SAU replaceProject, vì
 * replaceProject reset media: [] — đã đo) → setPlayhead từng mốc → đọc
 * pixel canvas preview thật (#vcut-preview-wrap canvas.preview-canvas) →
 * tâm/bbox vùng sáng (ngưỡng > 128, centroid không trọng số).
 *
 * Kết quả đo 11/11/2026 (canvas 872x276, project letterbox dx=190.67,
 * dw=490.67 — đổi về hệ project rồi mới so; xem O4_LIMITS §1):
 *   preview MỚI (O4): cx project 0.4006 / 0.5007 / 0.6007 @0.5/1.0/1.5s
 *     — khớp render png + trackgeq (0.4004 / 0.5004 / 0.6004), lệch ≤0.0005.
 *   preview CŨ (revert tạm O4, đo đối chứng): 0.2008 / 0.3006 / 0.4007
 *     — khớp render --mask-mode geq (0.2004 / 0.3004 / 0.4004), lệch ≤0.0004.
 * KHÔNG tự kết luận pass/fail — in số đo thô, parent/so sánh với render.
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
const MEDIA = opt("--media", "white720-o4.mp4");
const TIMES = opt("--times", "0.5,1,1.5").split(",").map(Number);
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9225"));

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

// Đọc store thật mà app đã nạp (mẫu L1 của clicktest-57n9).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__o4storeMod || (window.__o4storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Đo tâm/bbox vùng sáng trên canvas preview thật (tính in-page).
const MEASURE_FN = `(() => {
  const el = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!el) return { error: "không thấy canvas preview" };
  const W = el.width, H = el.height;
  const ctx = el.getContext("2d");
  if (!ctx) return { error: "không lấy được ctx 2d" };
  const d = ctx.getImageData(0, 0, W, H).data;
  let sx = 0, sy = 0, n = 0, x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (l > 128) {
      sx += x; sy += y; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (!n) return { error: "không có pixel sáng", W, H };
  return {
    cx: +((sx / n + 0.5) / W).toFixed(4), cy: +((sy / n + 0.5) / H).toFixed(4),
    x0: +(x0 / W).toFixed(4), x1: +((x1 + 1) / W).toFixed(4),
    y0: +(y0 / H).toFixed(4), y1: +((y1 + 1) / H).toFixed(4),
    count: n, W, H,
  };
})()`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-87o4-"));
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
// Chờ canvas preview xuất hiện (app boot xong).
let booted = false;
for (let i = 0; i < 60; i++) {
  const has = await cdp.eval(`!!document.querySelector("#vcut-preview-wrap canvas.preview-canvas")`, false).catch(() => false);
  if (has) { booted = true; break; }
  await sleep(500);
}
if (!booted) { console.error("app không boot (không thấy canvas preview)"); process.exit(2); }
console.log("app boot OK");

// Đóng modal chào mừng (profile mới) nếu có — bấm nút "Để sau".
await cdp.eval(`(() => {
  const btns = [...document.querySelectorAll("button")];
  const b = btns.find((x) => x.textContent.trim() === "Để sau");
  if (b) { b.click(); return "closed"; }
  return "no-modal";
})()`, false);
await sleep(800);

// Seed: replaceProject TRƯỚC (nó reset media: []), rồi importFiles SAU
// (import trước + replace sau sẽ mất media khỏi bin — đã đo).
const seeded = await cdp.eval(`(async () => {
  const st = await (${STORE_FN});
  const spec = {
    version: "0.2.0",
    meta: { name: "o4-mask-track", width: 1280, height: 720, fps: 30, duration: 3 },
    tracks: [{ id: "v1", kind: "video", clips: [{
      id: "c1", kind: "video", src: "${MEDIA}", start: 0, duration: 3,
      in: 0, out: 3,
      mask: { shape: "ellipse", x: 0.3, y: 0.5, w: 0.4, h: 0.5, feather: 0 },
      track: { points: [{ t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 }] },
    }] }],
  };
  st.replaceProject(spec);
  const res = await fetch("/${MEDIA}");
  if (!res.ok) return { error: "fetch media lỗi " + res.status };
  const blob = await res.blob();
  const file = new File([blob], "${MEDIA}", { type: "video/mp4" });
  const st2 = await (${STORE_FN});
  await st2.importFiles([file]);
  const st3 = await (${STORE_FN});
  return {
    media: (st3.media || []).map((m) => m.name),
    clips: st3.spec.tracks[0].clips.map((c) => ({ id: c.id, src: c.src, mask: !!c.mask, track: !!c.track })),
  };
})()`);
console.log("seed:", JSON.stringify(seeded));
if (!seeded || seeded.error || !(seeded.media || []).includes(MEDIA)) {
  console.error("seed media thất bại:", JSON.stringify(seeded));
  process.exit(2);
}

// Đo từng mốc: setPlayhead rồi poll tới khi tâm ổn định 2 lần liên tiếp.
const results = [];
for (const t of TIMES) {
  await cdp.eval(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(${t}); return st.playhead; })()`);
  let last = null, stable = 0, cur = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    cur = await cdp.eval(MEASURE_FN, false).catch((e) => ({ error: String(e).slice(0, 200) }));
    if (cur && !cur.error && last && Math.abs(cur.cx - last.cx) < 0.0015 && Math.abs(cur.cy - last.cy) < 0.0015) {
      stable++;
      if (stable >= 2) break;
    } else stable = 0;
    last = cur;
  }
  results.push({ t, ...cur });
  console.log(`t=${t}:`, JSON.stringify(cur));
}
console.log("KẾT QUẢ:", JSON.stringify({ media: MEDIA, results }, null, 1));
cdp.close();
cleanup();
