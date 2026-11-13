#!/usr/bin/env node
/**
 * preset45-safearea-74b5.cdp.mjs — Click-test thật preset 4:5 + safe-area
 * overlay trên Chromium thật qua CDP (Phase 9 đợt 74 B5 — đóng nợ A9).
 *
 * KHÔNG cần @playwright/test (chưa cài trong repo): dùng Chromium đã có
 * trong ~/.cache/ms-playwright + WebSocket có sẵn của Node 24.
 *
 * Chạy:  node apps/web/e2e/preset45-safearea-74b5.cdp.mjs
 *   [--url http://localhost:4173/] [--chrome <path>] [--shot /tmp/x.png]
 * Yêu cầu: `npm run build` + `npm run preview -- --port 4173` đang chạy.
 *
 * Ghi chú trung thực: đây là Chromium HEADLESS qua CDP (click chuột thật
 * bằng Input.dispatchMouseEvent, render thật trong browser), KHÔNG phải
 * headed GUI (VM này không có màn hình/X). Mọi assert đều đo trên DOM
 * + getBoundingClientRect thật của browser đang chạy.
 *
 * Kiểm tra:
 *  1. App load: splash biến mất, brand "VCut Studio".
 *  2. Toggle "Vùng an toàn": ban đầu tắt, không có zone; bấm thật →
 *     bật, xuất hiện zone + title-safe; zone nằm gọn trong khung video,
 *     title-safe không giao zone nào.
 *  3. Mặc định preset 1080p → nền tảng youtube → đúng 1 zone (endScreen).
 *  4. Mở panel Xuất bản, chọn preset ig-portrait → overlay tự đổi sang
 *     instagram-portrait: đúng 2 zone; bottomCaption chiếm 85–100% chiều
 *     cao khung (top ≈85%, height ≈15%), topBar cao ≈6%; mô tả preset
 *     hiện "1080×1350".
 *  5. Bấm toggle lần nữa → tắt, zone biến mất.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "../scripts/eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const URL = opt("--url", "http://localhost:4173/");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const SHOT = opt("--shot", "/tmp/preset45-74b5-overlay.png");
const CDP_PORT = Number(opt("--cdp-port", "9223"));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Khởi động Chromium headless với remote debugging -----------------------
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-74b5-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });

const cleanup = () => {
  try { chrome.kill("SIGKILL"); } catch { /* noop */ }
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* noop */ }
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

// --- Kết nối CDP ------------------------------------------------------------
let target = null;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch { /* chưa lên */ }
  await sleep(500);
}
if (!target) { console.error("✗ FAIL: không kết nối được CDP sau 20s"); cleanup(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) {
    throw new Error("evaluate lỗi: " + JSON.stringify(r.result.exceptionDetails).slice(0, 400));
  }
  return r.result?.result?.value;
}
async function waitFor(expression, timeoutMs = 30000, label = expression) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await evalJs(expression)) return true; } catch { /* retry */ }
    await sleep(300);
  }
  throw new Error(`timeout chờ: ${label}`);
}
/** Click chuột thật tại tâm phần tử (CDP Input.dispatchMouseEvent). */
async function realClick(selector) {
  const rect = await evalJs(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; })()`);
  if (!rect) throw new Error(`không tìm thấy ${selector} để click`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await sleep(400);
  return rect;
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  // Splash chỉ tồn tại khi !ready; nhưng ngay sau navigate, bundle chưa
  // chạy nên DOM shell cũng chưa có .splash — chờ splash XUẤT HIỆN trước
  // rồi mới chờ nó biến mất, kẻo bắt nhầm khoảng trống trước khi mount.
  await waitFor(`!!document.querySelector(".splash")`, 30000, "splash xuất hiện (app mount)");
  await waitFor(`!document.querySelector(".splash")`, 60000, "splash biến mất");
  // Chống splash nhấp nháy: xác nhận vắng mặt bền vững 3 lần liên tiếp.
  for (let i = 0; i < 3; i++) {
    await sleep(500);
    if (await evalJs(`!!document.querySelector(".splash")`)) {
      await waitFor(`!document.querySelector(".splash")`, 60000, "splash biến mất (lần 2)");
      i = -1;
    }
  }
  await waitFor(`!!document.querySelector(".preview-safearea-toggle")`, 15000, "toggle safe-area");

  console.log("== [1] app load ==");
  ok((await evalJs(`document.querySelector(".topbar .brand-name")?.textContent`)) === "VCut Studio", 'brand "VCut Studio"');
  ok(await evalJs(`!!document.querySelector(".preview-wrap")`), "preview-wrap hiện");
  ok(await evalJs(`!!document.querySelector(".timeline")`), "timeline hiện");

  // Đóng modal chào mừng nếu hiện (profile mới → localStorage trống).
  // Root modal là .modal-backdrop (không chứa chữ "welcome" trong class).
  const welcomed = await evalJs(`(() => { const b = document.querySelector(".modal-backdrop .modal-head .icon-btn"); if (!b) return "none"; return "present"; })()`);
  if (welcomed === "present") {
    await realClick(".modal-backdrop .modal-head .icon-btn");
    await waitFor(`!document.querySelector(".modal-backdrop")`, 5000, "modal chào mừng đóng");
    console.log(`  (welcome modal: closed)`);
  } else {
    console.log(`  (welcome modal: none)`);
  }
  await sleep(500);

  console.log("== [2] toggle safe-area: tắt → bật (preset mặc định 1080p → youtube) ==");
  ok((await evalJs(`document.querySelector(".preview-safearea-toggle").getAttribute("aria-pressed")`)) === "false", "ban đầu aria-pressed=false");
  ok((await evalJs(`document.querySelectorAll(".safe-area-zone").length`)) === 0, "ban đầu không có zone");
  await realClick(".preview-safearea-toggle");
  ok((await evalJs(`document.querySelector(".preview-safearea-toggle").getAttribute("aria-pressed")`)) === "true", "sau click aria-pressed=true");
  await waitFor(`document.querySelectorAll(".safe-area-zone").length > 0`, 5000, "zone xuất hiện");
  const yt = await evalJs(`(() => {
    // Khung video thật là letterbox của project mẫu 1280×720 (sample.ts:211)
    // trong .preview-wrap — .safe-area-overlay (inset:0) và .preview-canvas
    // đều trải hết wrap (kể cả viền đen), nên KHÔNG đo theo chúng.
    const wrap = document.querySelector(".preview-wrap").getBoundingClientRect();
    const scale = Math.min(wrap.width / 1280, wrap.height / 720);
    const fw = 1280 * scale, fh = 720 * scale;
    const fx = wrap.x + (wrap.width - fw) / 2, fy = wrap.y + (wrap.height - fh) / 2;
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.x - fx, y: r.y - fy, w: r.width, h: r.height }; };
    const zones = [...document.querySelectorAll(".safe-area-zone")].map((z) => rel(z));
    const tsEl = document.querySelector(".safe-area-title-safe");
    const ts = tsEl ? rel(tsEl) : null;
    const sel = document.querySelector(".safe-area-select")?.value;
    return { ovW: fw, ovH: fh, zones, ts, sel };
  })()`);
  console.log(`  (overlay ${yt.ovW.toFixed(1)}×${yt.ovH.toFixed(1)}px, platform select = ${yt.sel}, zones = ${yt.zones.length})`);
  ok(yt.sel === "youtube", "preset 1080p → platform select = youtube");
  ok(yt.zones.length === 1, "youtube có đúng 1 zone (endScreen)");
  const inside = (r, W, H) => r.x >= -1 && r.y >= -1 && r.x + r.w <= W + 1 && r.y + r.h <= H + 1;
  ok(yt.zones.every((z) => inside(z, yt.ovW, yt.ovH)), "zone nằm gọn trong khung video (không tràn viền đen)");
  ok(yt.ts && inside(yt.ts, yt.ovW, yt.ovH), "title-safe nằm gọn trong khung video");
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  ok(yt.ts && !yt.zones.some((z) => overlap(yt.ts, z)), "title-safe không giao zone nào");
  // End-screen youtube: góc dưới-phải ~25% rộng × 22% cao.
  const es = yt.zones[0];
  ok(Math.abs(es.x / yt.ovW - 0.75) < 0.02 && Math.abs(es.w / yt.ovW - 0.25) < 0.02, `endScreen x/w ≈ 75%/25% (đo ${((es.x / yt.ovW) * 100).toFixed(1)}%/${((es.w / yt.ovW) * 100).toFixed(1)}%)`);
  ok(Math.abs(es.y / yt.ovH - 0.78) < 0.02 && Math.abs(es.h / yt.ovH - 0.22) < 0.02, `endScreen y/h ≈ 78%/22% (đo ${((es.y / yt.ovH) * 100).toFixed(1)}%/${((es.h / yt.ovH) * 100).toFixed(1)}%)`);

  console.log("== [3] chọn preset ig-portrait trong panel Xuất bản ==");
  await realClick(".topbar button.primary");
  await waitFor(`!!document.querySelector("#export-preset")`, 5000, "#export-preset");
  await evalJs(`(() => {
    const sel = document.querySelector("#export-preset");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    setter.call(sel, "ig-portrait");
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return sel.value;
  })()`);
  await sleep(600);
  ok((await evalJs(`document.querySelector("#export-preset").value`)) === "ig-portrait", "preset select = ig-portrait");
  const desc = await evalJs(`document.querySelector(".preset-desc code")?.textContent || ""`);
  console.log(`  (preset desc: ${desc})`);
  ok(desc.includes("1080×1350") && desc.includes("30fps"), `mô tả preset hiện 1080×1350 @30fps ("${desc}")`);
  // Overlay tự đổi nền tảng theo preset.
  await waitFor(`document.querySelector(".safe-area-select")?.value === "instagram-portrait"`, 5000, "overlay đổi sang instagram-portrait");
  const ig = await evalJs(`(() => {
    const wrap = document.querySelector(".preview-wrap").getBoundingClientRect();
    const scale = Math.min(wrap.width / 1280, wrap.height / 720);
    const fw = 1280 * scale, fh = 720 * scale;
    const fx = wrap.x + (wrap.width - fw) / 2, fy = wrap.y + (wrap.height - fh) / 2;
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.x - fx, y: r.y - fy, w: r.width, h: r.height, label: el.textContent }; };
    const zones = [...document.querySelectorAll(".safe-area-zone")].map((z) => rel(z));
    const tsEl = document.querySelector(".safe-area-title-safe");
    const ts = tsEl ? rel(tsEl) : null;
    return { ovW: fw, ovH: fh, zones, ts };
  })()`);
  console.log(`  (overlay ${ig.ovW.toFixed(1)}×${ig.ovH.toFixed(1)}px, zones = ${ig.zones.length}: ${ig.zones.map((z) => z.label + " " + (z.y / ig.ovH * 100).toFixed(1) + "%+" + (z.h / ig.ovH * 100).toFixed(1) + "%").join(", ")})`);
  ok(ig.zones.length === 2, "instagram-portrait có đúng 2 zone (topBar + bottomCaption)");
  ok(ig.zones.every((z) => inside(z, ig.ovW, ig.ovH)), "zone 4:5 nằm gọn trong khung video");
  ok(ig.ts && inside(ig.ts, ig.ovW, ig.ovH) && !ig.zones.some((z) => overlap(ig.ts, z)), "title-safe 4:5 gọn trong khung, không giao zone");
  const topBar = ig.zones.find((z) => z.y < ig.ovH * 0.1);
  const bottom = ig.zones.find((z) => z.y > ig.ovH * 0.5);
  ok(!!topBar && Math.abs(topBar.h / ig.ovH - 0.06) < 0.015, `topBar cao ≈6% (đo ${topBar ? ((topBar.h / ig.ovH) * 100).toFixed(1) : "?"}%)`);
  ok(!!bottom && Math.abs(bottom.y / ig.ovH - 0.82) < 0.015 && Math.abs(bottom.h / ig.ovH - 0.18) < 0.015,
    `bottomCaption y/h ≈82%/18% (đo ${bottom ? ((bottom.y / ig.ovH) * 100).toFixed(1) : "?"}%/${bottom ? ((bottom.h / ig.ovH) * 100).toFixed(1) : "?"}%)`);

  // Đóng panel Xuất bản (root là .modal-backdrop > .modal, không có class
  // .export-panel) rồi chụp ảnh overlay 4:5 làm bằng chứng.
  await realClick(".modal-backdrop .modal-head .icon-btn");
  await sleep(500);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileEpermRetry(SHOT, Buffer.from(shot.result.data, "base64"));
  console.log(`  (screenshot: ${SHOT})`);

  console.log("== [4] toggle tắt ==");
  await realClick(".preview-safearea-toggle");
  await waitFor(`document.querySelectorAll(".safe-area-zone").length === 0`, 5000, "zone biến mất");
  ok((await evalJs(`document.querySelector(".preview-safearea-toggle").getAttribute("aria-pressed")`)) === "false", "sau click lần 2 aria-pressed=false");
  ok((await evalJs(`document.querySelectorAll(".safe-area-zone").length`)) === 0, "tắt thì không còn zone");
} catch (e) {
  fail++;
  console.error(`  ✗ FAIL: ${e.message}`);
} finally {
  ws.close();
  cleanup();
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
