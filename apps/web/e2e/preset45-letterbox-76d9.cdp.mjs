#!/usr/bin/env node
/**
 * preset45-letterbox-76d9.cdp.mjs — Click-test E2E cảnh báo letterbox +
 * lựa chọn crop/reframe khi xuất preset 4:5 (Phase 9 đợt 76 D9 — đóng nợ
 * đợt 75 C7 §6: panel không cảnh báo khi preset 4:5 gặp nguồn 16:9).
 *
 * Đi đúng flow user thật qua ExportPanel (mẫu CDP của C7 — Chromium 1254
 * headless qua WebSocket Node 24, không cần @playwright/test):
 *
 *  [1] app load + project mẫu (meta 1280×720, 2 clip video × 4s + text).
 *  [2] preset mặc định 1080p (khớp tỉ lệ nguồn) → KHÔNG có cảnh báo,
 *      KHÔNG có select #export-aspect-fit (không cảnh báo thừa).
 *  [3] chọn ig-portrait (1080×1350) → cảnh báo hiện, nêu đúng "viền đen
 *      trên/dưới" + "16:9" + "4:5"; select #export-aspect-fit hiện,
 *      mặc định "fit"; chưa có hint crop.
 *  [4] chọn crop → hint crop hiện; bấm Xuất MP4 bằng chuột thật → chờ
 *      bridge render xong → tải MP4 → ffprobe 1080×1350, đủ 240 frame →
 *      đo pixel: viền trên YAVG > 5 (CÓ nội dung — hết viền đen),
 *      dải giữa YAVG > 5.
 *  [5] chọn lại fit → bấm Xuất lần nữa → MP4 1080×1350, viền trên
 *      YAVG < 2 (đen — letterbox giữ nguyên như mặc định cũ), dải giữa
 *      YAVG > 5 (đối chứng: cùng nguồn, cùng preset, chỉ khác lựa chọn).
 *
 * Chạy:  node apps/web/e2e/preset45-letterbox-76d9.cdp.mjs
 *   [--url http://localhost:4177/] [--bridge http://127.0.0.1:8787]
 *   [--chrome <path>] [--out-dir /tmp/preset45-76d9]
 * Yêu cầu: bridge đang chạy ở cổng 8787 + `vite preview` đang chạy
 * (dist đã build; KHÔNG build lại trong script để khỏi đua với luồng khác).
 *
 * Ghi chú trung thực: Chromium HEADLESS qua CDP (click chuột thật bằng
 * Input.dispatchMouseEvent, render thật trong browser), KHÔNG phải headed
 * GUI (VM này không có màn hình/X). Mọi assert đều đo trên DOM thật,
 * bridge thật, ffprobe + pixel thật trên file MP4 tải về.
 */
import { spawn, execFile } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "../scripts/eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const URL = opt("--url", "http://localhost:4177/");
const BRIDGE = opt("--bridge", "http://127.0.0.1:8787").replace(/\/+$/, "");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const OUT_DIR = opt("--out-dir", "/tmp/preset45-76d9");
fs.mkdirSync(OUT_DIR, { recursive: true });
const CDP_PORT = Number(opt("--cdp-port", "9226"));
// Project mẫu: 2 clip video × 4s + text 5s → tổng 8s @30fps = 240 frame.
const EXPECTED_DURATION = 8;
const EXPECTED_FRAMES = 240;

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Khởi động Chromium headless với remote debugging -----------------------
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-76d9-"));
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
/** Click chuột thật vào nút có text chứa `text` trong scope selector. */
async function realClickButtonByText(scopeSelector, text) {
  const rect = await evalJs(`(() => {
    const scope = document.querySelector(${JSON.stringify(scopeSelector)});
    if (!scope) return null;
    const btn = [...scope.querySelectorAll("button")].find((b) => b.textContent.includes(${JSON.stringify(text)}));
    if (!btn) return null;
    btn.scrollIntoView({ block: "center" });
    const r = btn.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: btn.textContent.trim() };
  })()`);
  if (!rect) throw new Error(`không tìm thấy nút chứa "${text}" trong ${scopeSelector}`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await sleep(400);
  return rect;
}
/** Đặt giá trị select qua native setter + change event (mẫu C7). */
async function setSelectValue(selector, value) {
  const v = await evalJs(`(() => {
    const sel = document.querySelector(${JSON.stringify(selector)});
    if (!sel) return null;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    setter.call(sel, ${JSON.stringify(value)});
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return sel.value;
  })()`);
  await sleep(600);
  return v;
}

/** Chờ job render mới nhất trên bridge về done; trả job. */
async function waitJobDone(t0) {
  let job = null;
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`${BRIDGE}/api/render?limit=5`)).json();
      const jobs = Array.isArray(list?.jobs) ? list.jobs : [];
      job = jobs.find((j) => typeof j.createdAt === "number" && j.createdAt >= t0 - 5000) ?? jobs[0] ?? null;
      if (job && (job.status === "done" || job.status === "error" || job.status === "interrupted" || job.status === "cancelled")) break;
      if (job) process.stdout.write(`\r  (render: ${job.status} ${Math.round((job.progress ?? 0) * 100)}% — ${((Date.now() - t0) / 1000).toFixed(0)}s)   `);
    } catch { /* bridge lag tạm thời */ }
    await sleep(2000);
  }
  console.log("");
  if (!job) throw new Error("không thấy job render nào trên bridge sau khi bấm Xuất");
  return job;
}

/** Tải MP4 của job về file, ffprobe verify khung/frame/duration. */
async function downloadAndProbe(job, outFile) {
  const dl = await fetch(`${BRIDGE}/api/render/${job.id}/download`);
  ok(dl.ok, `GET download trả ${dl.status}`);
  if (!dl.ok) throw new Error(`download thất bại: HTTP ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  writeFileEpermRetry(outFile, buf);
  console.log(`  (đã tải ${buf.length} byte → ${outFile})`);
  ok(buf.length > 10000, `file MP4 > 10KB (${buf.length} byte)`);
  const { stdout: probeOut } = await execFileP("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,r_frame_rate,avg_frame_rate,codec_name,nb_read_frames",
    "-show_entries", "format=duration",
    "-count_frames", "-of", "default=noprint_wrappers=1", outFile,
  ]);
  const get = (k) => {
    const m = probeOut.match(new RegExp(`^${k}=(.+)$`, "m"));
    return m ? m[1].trim() : null;
  };
  ok(get("width") === "1080", `width = 1080 (đo ${get("width")})`);
  ok(get("height") === "1350", `height = 1350 (đo ${get("height")})`);
  ok(get("r_frame_rate") === "30/1", `r_frame_rate = 30/1 (đo ${get("r_frame_rate")})`);
  ok(get("codec_name") === "h264", `codec h264 (đo ${get("codec_name")})`);
  const dur = parseFloat(get("duration") ?? "NaN");
  ok(Math.abs(dur - EXPECTED_DURATION) < 0.2, `duration ≈ ${EXPECTED_DURATION}s (đo ${dur}s)`);
  const frames = parseInt(get("nb_read_frames") ?? "NaN", 10);
  ok(Math.abs(frames - EXPECTED_FRAMES) <= 2, `nb_read_frames ≈ ${EXPECTED_FRAMES} (đo ${frames})`);
  return outFile;
}

/** Y trung bình của một band (crop → 1 frame gray → mean) tại thời điểm t. */
async function bandYavg(mp4, t, band) {
  const { stdout } = await execFileP("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-ss", String(t), "-i", mp4,
    "-vf", `crop=${band.w}:${band.h}:${band.x}:${band.y}`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-",
  ], { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  let sum = 0;
  for (const b of stdout) sum += b;
  return sum / stdout.length;
}
// Viền đen trên của letterbox 16:9 → 4:5: (1350-608)/2 = 371px; band
// y=0..270 nằm gọn trong viền, band giữa y=270..1080 là nội dung.
const TOP_BAND = { w: 1080, h: 270, x: 0, y: 0 };
const MID_BAND = { w: 1080, h: 810, x: 0, y: 270 };

const jobs = [];
try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: URL });
  // B5 §2 bẫy 2: chờ splash XUẤT HIỆN trước rồi mới chờ nó biến mất.
  await waitFor(`!!document.querySelector(".splash")`, 30000, "splash xuất hiện (app mount)");
  await waitFor(`!document.querySelector(".splash")`, 60000, "splash biến mất");
  for (let i = 0; i < 3; i++) {
    await sleep(500);
    if (await evalJs(`!!document.querySelector(".splash")`)) {
      await waitFor(`!document.querySelector(".splash")`, 60000, "splash biến mất (lần 2)");
      i = -1;
    }
  }
  await waitFor(`!!document.querySelector(".preview-wrap")`, 15000, "preview-wrap");

  console.log("== [1] app load + project mẫu ==");
  ok((await evalJs(`document.querySelector(".topbar .brand-name")?.textContent`)) === "VCut Studio", 'brand "VCut Studio"');
  ok(await evalJs(`!!document.querySelector(".timeline")`), "timeline hiện");

  // Đóng modal chào mừng nếu hiện (profile mới → localStorage trống).
  const welcomed = await evalJs(`(() => { const b = document.querySelector(".modal-backdrop .modal-head .icon-btn"); if (!b) return "none"; return "present"; })()`);
  if (welcomed === "present") {
    await realClick(".modal-backdrop .modal-head .icon-btn");
    await waitFor(`!document.querySelector(".modal-backdrop")`, 5000, "modal chào mừng đóng");
    console.log(`  (welcome modal: closed)`);
  } else {
    console.log(`  (welcome modal: none)`);
  }
  await sleep(500);

  console.log("== [2] mở panel Xuất bản: preset 1080p khớp tỉ lệ → KHÔNG cảnh báo ==");
  await realClick(".topbar button.primary");
  await waitFor(`!!document.querySelector("#export-preset")`, 5000, "#export-preset");
  ok((await evalJs(`document.querySelector("#export-preset").value`)) === "1080p", "preset mặc định = 1080p");
  ok(await evalJs(`!document.querySelector('[data-testid="aspect-fit-warning"]')`), "preset 1080p (khớp 16:9): không có khối cảnh báo");
  ok(await evalJs(`!document.querySelector("#export-aspect-fit")`), "preset 1080p: không có select #export-aspect-fit");

  console.log("== [3] chọn ig-portrait → cảnh báo letterbox hiện, mặc định fit ==");
  await setSelectValue("#export-preset", "ig-portrait");
  await waitFor(`!!document.querySelector('[data-testid="aspect-fit-warning"]')`, 5000, "khối cảnh báo xuất hiện");
  const warnText = await evalJs(`document.querySelector('[data-testid="aspect-fit-warning"]')?.textContent || ""`);
  console.log(`  (cảnh báo: ${warnText.slice(0, 220)})`);
  ok(warnText.includes("viền đen trên/dưới"), `cảnh báo nêu "viền đen trên/dưới"`);
  ok(warnText.includes("16:9") && warnText.includes("4:5"), `cảnh báo nêu đúng tỉ lệ nguồn 16:9 → khung 4:5`);
  ok((await evalJs(`document.querySelector("#export-aspect-fit")?.value`)) === "fit", "select #export-aspect-fit mặc định = fit");
  ok(!warnText.includes("Crop giữa"), "chế độ fit: chưa hiện hint crop");

  console.log("== [4] chọn crop → bấm Xuất → MP4 lấp đầy khung (hết viền đen) ==");
  await setSelectValue("#export-aspect-fit", "crop");
  const warnTextCrop = await evalJs(`document.querySelector('[data-testid="aspect-fit-warning"]')?.textContent || ""`);
  ok(warnTextCrop.includes("Crop giữa"), "chế độ crop: hiện hint crop");
  const tCrop = Date.now();
  await realClickButtonByText(".mp4-export", "Xuất MP4");
  await waitFor(
    `!!document.querySelector(".render-progress") || !!document.querySelector(".mp4-export .valid-banner.bad")`,
    30000, "khối tiến trình render xuất hiện (crop)",
  );
  ok(true, "sau khi bấm Xuất (crop), khối tiến trình render xuất hiện");
  const jobCrop = await waitJobDone(tCrop);
  jobs.push(jobCrop.id);
  console.log(`  (job crop ${jobCrop.id}: status=${jobCrop.status}, ${(Date.now() - tCrop) / 1000}s)`);
  ok(jobCrop.status === "done", `job crop done (status=${jobCrop.status}${jobCrop.error ? `, error=${jobCrop.error}` : ""})`);
  if (jobCrop.status !== "done") throw new Error(`job crop không done: ${JSON.stringify(jobCrop).slice(0, 500)}`);
  const cropMp4 = await downloadAndProbe(jobCrop, path.join(OUT_DIR, "preset45-crop-76d9.mp4"));
  const cropTop = await bandYavg(cropMp4, 1, TOP_BAND);
  const cropMid = await bandYavg(cropMp4, 1, MID_BAND);
  console.log(`  (crop: viền trên YAVG = ${cropTop.toFixed(1)}, dải giữa YAVG = ${cropMid.toFixed(1)})`);
  ok(cropTop > 5, `crop: viền trên CÓ nội dung (YAVG ${cropTop.toFixed(1)} > 5) — hết viền đen`);
  ok(cropMid > 5, `crop: dải giữa có nội dung (YAVG ${cropMid.toFixed(1)} > 5)`);

  console.log("== [5] chọn lại fit → bấm Xuất → MP4 giữ letterbox (đối chứng) ==");
  await setSelectValue("#export-aspect-fit", "fit");
  const tFit = Date.now();
  await realClickButtonByText(".mp4-export", "Xuất MP4");
  await waitFor(
    `!!document.querySelector(".render-progress") || !!document.querySelector(".mp4-export .valid-banner.bad")`,
    30000, "khối tiến trình render xuất hiện (fit)",
  );
  ok(true, "sau khi bấm Xuất (fit), khối tiến trình render xuất hiện");
  const jobFit = await waitJobDone(tFit);
  jobs.push(jobFit.id);
  console.log(`  (job fit ${jobFit.id}: status=${jobFit.status}, ${(Date.now() - tFit) / 1000}s)`);
  ok(jobFit.status === "done", `job fit done (status=${jobFit.status}${jobFit.error ? `, error=${jobFit.error}` : ""})`);
  if (jobFit.status !== "done") throw new Error(`job fit không done: ${JSON.stringify(jobFit).slice(0, 500)}`);
  const fitMp4 = await downloadAndProbe(jobFit, path.join(OUT_DIR, "preset45-fit-76d9.mp4"));
  const fitTop = await bandYavg(fitMp4, 1, TOP_BAND);
  const fitMid = await bandYavg(fitMp4, 1, MID_BAND);
  console.log(`  (fit: viền trên YAVG = ${fitTop.toFixed(2)}, dải giữa YAVG = ${fitMid.toFixed(1)})`);
  ok(fitTop < 2, `fit: viền trên đen (YAVG ${fitTop.toFixed(2)} < 2) — letterbox giữ nguyên như mặc định cũ`);
  ok(fitMid > 5, `fit: dải giữa có nội dung (YAVG ${fitMid.toFixed(1)} > 5)`);
} catch (e) {
  fail++;
  console.error(`  ✗ FAIL: ${e.message}`);
} finally {
  ws.close();
  cleanup();
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (jobs.length > 0) console.log(`(job bridge: ${jobs.join(", ")}, file: ${OUT_DIR})`);
process.exit(fail === 0 ? 0 : 1);
