#!/usr/bin/env node
/**
 * r84l9-proxy-auto-verify.mjs — Kiểm chứng thật proxy tự động (đợt 84 L9).
 *
 * - Sinh clip 1080p thật bằng ffmpeg (testsrc + sine, 10 s, 30 fps, h264+aac).
 * - Khởi động bridge thật trên cổng test (BRIDGE_PORT) với WORK_ROOT tạm.
 * - POST /api/proxy height=720 → đo thời gian; ffprobe proxy: đúng 1280x720,
 *   codec h264, fps ~30, duration ~10 s. Lặp lại height=480 → 854x480.
 * - POST clip 480p → {skipped:true} (không upscale, không tạo vô ích).
 * - GET /api/proxy/file/<proxy> → 200 (preview phát được bằng proxy).
 * - Preview dùng proxy / export dùng gốc: KHÔNG đo lại ở đây — đã có
 *   test_proxy_q8.js (server/render) chứng minh spec trỏ gốc → output
 *   1920x1080, và previewUrlFor/isUsingProxy có unit test trong
 *   proxyAuto.test.ts. Script này chỉ đo đường tạo proxy của bridge.
 *
 * Dùng: node apps/web/scripts/r84l9-proxy-auto-verify.mjs
 * Kết quả in ra stdout, exit 0 khi mọi assert xanh, ngược lại exit 1.
 * Mọi file tạm nằm dưới /tmp/r84l9-proxy-auto/ (xóa sau khi chạy xong,
 * trừ khi KEEP_TMP=1). Đây là script kiểm chứng, không phải tính năng.
 */
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TMP = "/tmp/r84l9-proxy-auto";
const PORT = 18894;
const BRIDGE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0;
let fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}${extra ? ` — ${extra}` : ""}`); }
  else { fail++; console.error(`  ✗ ${name}${extra ? ` — ${extra}` : ""}`); }
}
function ffprobe(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,codec_name,r_frame_rate,duration",
    "-show_entries", "format=duration", "-of", "json", file], { encoding: "utf8" });
  const d = JSON.parse(out);
  const st = (d.streams || [])[0] || {};
  const [n, dd] = String(st.r_frame_rate || "0/1").split("/").map(Number);
  return { width: st.width, height: st.height, codec: st.codec_name,
    fps: dd ? n / dd : 0, duration: parseFloat(st.duration || d.format?.duration || 0) || 0 };
}
function makeClip(file, w, h, dur = 10) {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    `testsrc=size=${w}x${h}:rate=30:duration=${dur}`,
    "-f", "lavfi", "-i", `sine=frequency=440:duration=${dur}`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest", file], { stdio: "pipe" });
}
async function waitBridge(timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(`${BRIDGE}/api/proxy/file/nope.mp4`);
      if (r.status === 404 || r.status === 400) return true;
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  return false;
}
async function postProxy(file, height) {
  const buf = fs.readFileSync(file);
  const form = new FormData();
  form.append("file", new File([buf], path.basename(file), { type: "video/mp4" }));
  form.append("height", String(height));
  const t0 = Date.now();
  const res = await fetch(`${BRIDGE}/api/proxy`, { method: "POST", body: form });
  const ms = Date.now() - t0;
  const data = await res.json().catch(() => ({}));
  return { res, data, ms };
}

console.log("== r84l9: chuẩn bị ==");
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const clip1080 = path.join(TMP, "clip1080.mp4");
const clip480 = path.join(TMP, "clip480.mp4");
makeClip(clip1080, 1920, 1080);
makeClip(clip480, 854, 480);
const src = ffprobe(clip1080);
console.log(`  clip gốc: ${src.width}x${src.height} ${src.codec} ${src.fps}fps ${src.duration}s, ${fs.statSync(clip1080).size} byte`);
check("clip gốc đúng 1080p h264 30fps", src.width === 1920 && src.height === 1080 && src.codec === "h264" && Math.abs(src.fps - 30) < 0.5);

console.log("== r84l9: khởi động bridge ==");
const workRoot = path.join(TMP, "work");
const bridge = spawn("node", [path.join(ROOT, "server/bridge/src/index.js")], {
  cwd: path.join(ROOT, "server/bridge"),
  env: { ...process.env, BRIDGE_PORT: String(PORT), BRIDGE_WORK_DIR: workRoot },
  stdio: ["ignore", "pipe", "pipe"],
});
let bridgeLog = "";
bridge.stdout.on("data", (d) => { bridgeLog += d.toString(); });
bridge.stderr.on("data", (d) => { bridgeLog += d.toString(); });
const up = await waitBridge();
check("bridge lên trên cổng test", up);
if (!up) {
  console.error(bridgeLog.slice(-2000));
  bridge.kill("SIGTERM");
  process.exit(1);
}

try {
  console.log("== r84l9: POST /api/proxy height=720 ==");
  const r720 = await postProxy(clip1080, 720);
  console.log(`  POST 720p: HTTP ${r720.res.status}, ${r720.ms} ms, proxy=${r720.data.proxy ?? "?"} height=${r720.data.proxyHeight ?? "?"} size=${r720.data.proxySizeBytes ?? "?"} byte`);
  check("POST 720 trả 200 + proxyUrl", r720.res.ok && typeof r720.data.proxyUrl === "string");
  check("proxyHeight trả về = 720", r720.data.proxyHeight === 720);
  const proxy720Path = path.join(workRoot, "proxies", r720.data.proxy);
  check("file proxy 720p có trên đĩa bridge", fs.existsSync(proxy720Path));
  const p720 = fs.existsSync(proxy720Path) ? ffprobe(proxy720Path) : {};
  console.log(`  proxy 720: ${p720.width}x${p720.height} ${p720.codec} ${p720.fps}fps ${p720.duration}s`);
  check("proxy đúng 1280x720 h264", p720.width === 1280 && p720.height === 720 && p720.codec === "h264");
  check("proxy giữ fps ~30", Math.abs((p720.fps || 0) - 30) < 0.5);
  check("proxy giữ duration ~10 s", Math.abs((p720.duration || 0) - 10) < 0.5);
  const get720 = await fetch(`${BRIDGE}${r720.data.proxyUrl}`);
  check("GET proxy file -> 200 (preview phát được)", get720.status === 200);

  console.log("== r84l9: POST /api/proxy height=480 ==");
  const r480 = await postProxy(clip1080, 480);
  console.log(`  POST 480p: HTTP ${r480.res.status}, ${r480.ms} ms, proxy=${r480.data.proxy ?? "?"} height=${r480.data.proxyHeight ?? "?"}`);
  check("POST 480 trả 200 + proxyHeight 480", r480.res.ok && r480.data.proxyHeight === 480);
  const proxy480Path = path.join(workRoot, "proxies", r480.data.proxy);
  const p480 = fs.existsSync(proxy480Path) ? ffprobe(proxy480Path) : {};
  console.log(`  proxy 480: ${p480.width}x${p480.height} ${p480.codec}`);
  check("proxy đúng 854x480 h264", p480.width === 854 && p480.height === 480 && p480.codec === "h264");

  console.log("== r84l9: clip 480p -> skipped ==");
  const rSkip = await postProxy(clip480, 720);
  console.log(`  POST 480p-clip height=720: HTTP ${rSkip.res.status}, skipped=${rSkip.data.skipped}`);
  check("clip 480p bị skip (không tạo proxy vô ích)", rSkip.res.ok && rSkip.data.skipped === true);

  console.log("== r84l9: thời gian (bằng chứng mặc định BẬT) ==");
  console.log(`  tạo proxy 720p cho clip 1080p 10 s: ${r720.ms} ms (chạy nền sau import, import không đợi)`);
  console.log(`  tạo proxy 480p: ${r480.ms} ms`);
  check("proxy 720p xong trong < 60 s", r720.ms < 60000);
} finally {
  bridge.kill("SIGTERM");
  await sleep(500);
  if (!bridge.killed) bridge.kill("SIGKILL");
  if (process.env.KEEP_TMP !== "1") fs.rmSync(TMP, { recursive: true, force: true });
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
