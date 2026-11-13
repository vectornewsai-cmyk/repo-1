#!/usr/bin/env node
/**
 * preset45-export-e2e-75c7.cdp.mjs — Click-test end-to-end preset 4:5 qua
 * ExportPanel flow chính (Phase 9 đợt 75 C7 — đóng nợ đợt 74 §4.8).
 *
 * Khác với B5 (render.js trực tiếp + chỉ kiểm select/overlay): script này
 * đi đúng flow user thật — mở panel Xuất bản, chọn preset ig-portrait,
 * bấm nút "Xuất MP4" bằng chuột thật, chờ bridge render xong, tải MP4 về
 * và ffprobe verify 1080×1350 @30fps, đủ frame cho project mẫu 8s.
 *
 * KHÔNG cần @playwright/test: dùng Chromium đã có trong
 * ~/.cache/ms-playwright + WebSocket có sẵn của Node 24.
 *
 * Chạy:  node apps/web/e2e/preset45-export-e2e-75c7.cdp.mjs
 *   [--url http://localhost:4175/] [--bridge http://127.0.0.1:8787]
 *   [--chrome <path>] [--out /tmp/preset45-75c7.mp4]
 * Yêu cầu: bridge đang chạy ở cổng 8787 + `vite preview` đang chạy
 * (dist đã build; KHÔNG build lại trong script để khỏi đua với luồng khác).
 *
 * Ghi chú trung thực: Chromium HEADLESS qua CDP (click chuột thật bằng
 * Input.dispatchMouseEvent, render thật trong browser), KHÔNG phải headed
 * GUI (VM này không có màn hình/X). Mọi assert đều đo trên DOM thật,
 * bridge thật, ffprobe thật trên file MP4 tải về.
 */
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
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
const URL = opt("--url", "http://localhost:4175/");
const BRIDGE = opt("--bridge", "http://127.0.0.1:8787").replace(/\/+$/, "");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const OUT = opt("--out", "/tmp/preset45-75c7.mp4");
const CDP_PORT = Number(opt("--cdp-port", "9224"));
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
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-75c7-"));
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

let jobId = null;
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
  // Project mẫu: 2 clip video + 1 text, meta 1280×720, 8s.
  const sample = await evalJs(`(() => {
    const clips = document.querySelectorAll(".timeline .clip");
    return { clipCount: clips.length };
  })()`);
  console.log(`  (timeline clips trong DOM: ${sample.clipCount})`);

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

  console.log("== [2] bật overlay vùng an toàn, mở panel Xuất bản, chọn preset ig-portrait ==");
  // Overlay chỉ render .safe-area-select khi toggle đang bật (SafeAreaOverlay
  // return null khi !enabled) — bật trước để kiểm tra đồng bộ nền tảng.
  await realClick(".preview-safearea-toggle");
  await waitFor(`document.querySelectorAll(".safe-area-zone").length > 0`, 5000, "zone xuất hiện");
  ok((await evalJs(`document.querySelector(".safe-area-select")?.value`)) === "youtube", "preset mặc định 1080p → overlay platform = youtube");
  await realClick(".topbar button.primary");
  await waitFor(`!!document.querySelector("#export-preset")`, 5000, "#export-preset");
  // Các option của select có sẵn từ EXPORT_PRESETS (A9): ig-portrait phải
  // có trong danh sách — đây là điểm nối chính của đợt này.
  const options = await evalJs(`[...document.querySelectorAll("#export-preset option")].map((o) => o.value)`);
  console.log(`  (preset options: ${options.join(", ")})`);
  ok(options.includes("ig-portrait"), "select Xuất bản có option ig-portrait");
  ok(options.includes("tiktok") && options.includes("ig-square"), "select vẫn có tiktok + ig-square (không mất preset cũ)");
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
  ok(desc.includes("1080×1350") && desc.includes("30fps") && desc.includes("CRF 21"), `mô tả preset hiện 1080×1350 @30fps CRF 21 ("${desc}")`);
  // Nút Xuất phải đổi nhãn theo preset đang chọn.
  const exportBtnLabel = await evalJs(`(() => {
    const b = [...document.querySelectorAll(".mp4-export button.primary")].find((x) => x.textContent.includes("Xuất MP4"));
    return b ? b.textContent.trim() : null;
  })()`);
  console.log(`  (nút xuất: ${exportBtnLabel})`);
  ok(exportBtnLabel !== null && exportBtnLabel.includes("1080×1350"), `nút Xuất ghi 1080×1350 ("${exportBtnLabel}")`);
  // Overlay vùng an toàn phải tự đổi sang instagram-portrait khi chọn
  // preset 4:5 (pub/sub exportPresetSelection, A9) — kiểm tra lại trong
  // flow export, không chỉ flow toggle của B5.
  await waitFor(`document.querySelector(".safe-area-select")?.value === "instagram-portrait"`, 5000, "overlay đổi sang instagram-portrait");
  ok(true, "overlay safe-area tự đổi sang instagram-portrait theo preset");

  console.log("== [3] bấm Xuất MP4 bằng chuột thật, chờ bridge render xong ==");
  const t0 = Date.now();
  await realClickButtonByText(".mp4-export", "Xuất MP4");
  // Panel phải chuyển sang trạng thái uploading/rendering.
  // Lưu ý: waitFor phải nhận boolean — Runtime.evaluate + returnByValue
  // trả `value: undefined` cho DOM node nên KHÔNG được chờ
  // `document.querySelector(...)` trần (bẫy đã gặp ở lần chạy 1: job render
  // thật đã done 1080×1350 nhưng waitFor timeout vì expression trả node).
  await waitFor(
    `!!document.querySelector(".render-progress") || !!document.querySelector(".mp4-export .valid-banner.bad")`,
    30000, "khối tiến trình render xuất hiện",
  );
  ok(true, "sau khi bấm Xuất, khối tiến trình render xuất hiện");
  // Poll bridge trực tiếp (job của lần bấm này = job mới nhất) tới khi done.
  let job = null;
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`${BRIDGE}/api/render?limit=5`)).json();
      const jobs = Array.isArray(list?.jobs) ? list.jobs : [];
      // Job mới nhất tạo sau khi bấm Xuất (createdAt >= t0 - 5s).
      job = jobs.find((j) => typeof j.createdAt === "number" && j.createdAt >= t0 - 5000) ?? jobs[0] ?? null;
      if (job && (job.status === "done" || job.status === "error" || job.status === "interrupted" || job.status === "cancelled")) break;
      if (job) process.stdout.write(`\r  (render: ${job.status} ${Math.round((job.progress ?? 0) * 100)}% — ${((Date.now() - t0) / 1000).toFixed(0)}s)   `);
    } catch { /* bridge lag tạm thời */ }
    await sleep(2000);
  }
  console.log("");
  if (!job) throw new Error("không thấy job render nào trên bridge sau khi bấm Xuất");
  jobId = job.id;
  console.log(`  (job ${job.id}: status=${job.status}, output=${job.outputName ?? "—"}, ${(Date.now() - t0) / 1000}s)`);
  ok(job.status === "done", `job render done (status=${job.status}${job.error ? `, error=${job.error}` : ""})`);
  if (job.status !== "done") throw new Error(`job không done: ${JSON.stringify(job).slice(0, 500)}`);
  // UI phải hiện banner done + nút tải MP4.
  await waitFor(`!!document.querySelector(".mp4-export .valid-banner")`, 10000, "banner done trong panel");
  ok(true, "panel hiện banner done sau khi render xong");

  console.log("== [4] tải MP4 về, ffprobe verify ==");
  const dl = await fetch(`${BRIDGE}/api/render/${job.id}/download`);
  ok(dl.ok, `GET download trả ${dl.status}`);
  if (!dl.ok) throw new Error(`download thất bại: HTTP ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  writeFileEpermRetry(OUT, buf);
  console.log(`  (đã tải ${buf.length} byte → ${OUT})`);
  ok(buf.length > 10000, `file MP4 > 10KB (${buf.length} byte)`);
  const { stdout: probeOut } = await execFileP("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,r_frame_rate,avg_frame_rate,codec_name,nb_read_frames",
    "-show_entries", "format=duration",
    "-count_frames", "-of", "default=noprint_wrappers=1", OUT,
  ]);
  console.log(`  (ffprobe:\n${probeOut.split("\n").map((l) => "    " + l).join("\n")})`);
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
} catch (e) {
  fail++;
  console.error(`  ✗ FAIL: ${e.message}`);
} finally {
  ws.close();
  cleanup();
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (jobId) console.log(`(job bridge: ${jobId}, file: ${OUT})`);
process.exit(fail === 0 ? 0 : 1);
