#!/usr/bin/env node
/**
 * r85m8-proxy-progress-verify.mjs — Kiểm chứng thật job proxy async + % (đợt 85 M8).
 *
 * - Sinh clip 1080p thật bằng ffmpeg (testsrc + sine, 20 s, 30 fps, h264+aac).
 * - Khởi động bridge thật trên cổng test (BRIDGE_PORT) với WORK_ROOT tạm.
 * - POST /api/proxy?async=1 → 202 + jobId; poll GET /api/proxy/jobs/:id
 *   mỗi 250 ms: % phải tăng đơn điệu, có >= 3 giá trị trung gian khác nhau
 *   trong (0,100) (chứng minh % thật từ ffmpeg, không phải timer/fake),
 *   cuối job done + progress 100 + proxyUrl; ffprobe proxy 1280x720;
 *   GET /api/proxy/file/<proxy> → 200.
 * - Dedupe: 2 POST async cùng file + height lúc đang encode → cùng jobId.
 * - GET job không tồn tại → 404 PROXY_JOB_NOT_FOUND.
 * - Clip 480p qua async → job skipped (không upscale).
 * - POST sync (không async) vẫn 200 + proxyUrl như trước (tương thích).
 * - POST async height=400 → 400 PROXY_BAD_HEIGHT (validate trước khi tạo job).
 *
 * Dùng: node apps/web/scripts/r85m8-proxy-progress-verify.mjs
 * Kết quả in ra stdout, exit 0 khi mọi assert xanh, ngược lại exit 1.
 * Mọi file tạm nằm dưới /tmp/r85m8-proxy-progress/ (xóa sau khi chạy xong,
 * trừ khi KEEP_TMP=1). Đây là script kiểm chứng, không phải tính năng.
 */
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TMP = "/tmp/r85m8-proxy-progress";
const PORT = 18895;
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
function makeClip(file, w, h, dur = 20) {
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
async function postProxyAsync(file, height) {
  const buf = fs.readFileSync(file);
  const form = new FormData();
  form.append("file", new File([buf], path.basename(file), { type: "video/mp4" }));
  form.append("height", String(height));
  const res = await fetch(`${BRIDGE}/api/proxy?async=1`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}
/** Poll job tới trạng thái cuối; trả {job, samples} (samples = các % đã thấy). */
async function pollJob(jobId, timeoutMs = 180000) {
  const samples = [];
  const t0 = Date.now();
  let job = null;
  while (Date.now() - t0 < timeoutMs) {
    const r = await fetch(`${BRIDGE}/api/proxy/jobs/${encodeURIComponent(jobId)}`);
    job = await r.json().catch(() => ({}));
    if (typeof job.progress === "number") samples.push(job.progress);
    if (job.status === "done" || job.status === "failed" || job.status === "skipped") return { job, samples };
    await sleep(250);
  }
  return { job, samples, timedOut: true };
}

console.log("== r85m8: chuẩn bị ==");
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const clip1080 = path.join(TMP, "clip1080.mp4");
const clip480 = path.join(TMP, "clip480.mp4");
makeClip(clip1080, 1920, 1080, 20);
makeClip(clip480, 854, 480, 10);
const src = ffprobe(clip1080);
console.log(`  clip gốc: ${src.width}x${src.height} ${src.codec} ${src.fps}fps ${src.duration}s, ${fs.statSync(clip1080).size} byte`);
check("clip gốc đúng 1080p h264 30fps 20s", src.width === 1920 && src.height === 1080 && src.codec === "h264" && Math.abs(src.fps - 30) < 0.5 && Math.abs(src.duration - 20) < 0.5);

console.log("== r85m8: khởi động bridge ==");
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
  console.log("== r85m8: POST async 720p + poll % ==");
  const t0 = Date.now();
  const a = await postProxyAsync(clip1080, 720);
  check("POST ?async=1 trả 202 + jobId + processing", a.res.status === 202 && typeof a.data.jobId === "string" && a.data.status === "processing");
  check("progress ban đầu = 0", a.data.progress === 0);
  // Dedupe: POST trùng lúc job đang chạy → cùng jobId, không encode trùng.
  const a2 = await postProxyAsync(clip1080, 720);
  check("POST trùng (cùng file + height) trả cùng jobId", a2.res.status === 202 && a2.data.jobId === a.data.jobId);
  const { job, samples, timedOut } = await pollJob(a.data.jobId);
  const ms = Date.now() - t0;
  const mid = [...new Set(samples.filter((p) => p > 0 && p < 100))];
  const monotonic = samples.every((v, i) => i === 0 || v >= samples[i - 1]);
  console.log(`  poll ${samples.length} mẫu trong ${ms} ms: đầu=${samples.slice(0, 5).join(",")}… cuối=${samples.slice(-3).join(",")} (trung gian khác nhau: ${mid.length})`);
  check("poll không timeout", !timedOut);
  check("progress tăng đơn điệu", monotonic);
  check(">= 3 giá trị % trung gian khác nhau trong (0,100)", mid.length >= 3, `thấy ${mid.length}: ${mid.slice(0, 8).join(",")}`);
  check("mẫu % đầu tiên < 90 (thấy tiến trình giữa chừng, không chỉ 99 cuối)", samples.length > 0 && samples[0] < 90, `mẫu đầu=${samples[0]}`);
  check("job cuối done + progress 100", job.status === "done" && job.progress === 100);
  check("job done có proxyUrl + proxyHeight 720", typeof job.proxyUrl === "string" && job.proxyHeight === 720, `proxyUrl=${job.proxyUrl ?? "?"}`);
  const proxyPath = path.join(workRoot, "proxies", job.proxy ?? "");
  check("file proxy có trên đĩa bridge", typeof job.proxy === "string" && fs.existsSync(proxyPath));
  const p = fs.existsSync(proxyPath) ? ffprobe(proxyPath) : {};
  console.log(`  proxy: ${p.width}x${p.height} ${p.codec} ${p.fps}fps ${p.duration}s`);
  check("proxy đúng 1280x720 h264, giữ fps/duration", p.width === 1280 && p.height === 720 && p.codec === "h264" && Math.abs((p.fps || 0) - 30) < 0.5 && Math.abs((p.duration || 0) - 20) < 0.5);
  const g = await fetch(`${BRIDGE}${job.proxyUrl}`);
  check("GET proxy file 200 (preview phát được)", g.status === 200);

  console.log("== r85m8: job lạ + skipped + sync compat + bad height ==");
  const nj = await fetch(`${BRIDGE}/api/proxy/jobs/khong-co-job`);
  const njData = await nj.json().catch(() => ({}));
  check("GET job không tồn tại -> 404 PROXY_JOB_NOT_FOUND", nj.status === 404 && njData.errorCode === "PROXY_JOB_NOT_FOUND");
  const s = await postProxyAsync(clip480, 720);
  check("clip 480p async -> 202 + jobId", s.res.status === 202 && typeof s.data.jobId === "string");
  const sp = await pollJob(s.data.jobId);
  check("clip 480p async -> job skipped (không upscale)", sp.job.status === "skipped", `status=${sp.job.status}`);
  const syncBuf = fs.readFileSync(clip1080);
  const syncForm = new FormData();
  syncForm.append("file", new File([syncBuf], "clip1080.mp4", { type: "video/mp4" }));
  syncForm.append("height", "720");
  const syncRes = await fetch(`${BRIDGE}/api/proxy`, { method: "POST", body: syncForm });
  const syncData = await syncRes.json().catch(() => ({}));
  check("POST sync (không async) vẫn 200 + proxyUrl", syncRes.status === 200 && typeof syncData.proxyUrl === "string");
  const badBuf = fs.readFileSync(clip1080);
  const badForm = new FormData();
  badForm.append("file", new File([badBuf], "clip1080.mp4", { type: "video/mp4" }));
  badForm.append("height", "400");
  const badRes = await fetch(`${BRIDGE}/api/proxy?async=1`, { method: "POST", body: badForm });
  const badData = await badRes.json().catch(() => ({}));
  check("POST async height=400 -> 400 PROXY_BAD_HEIGHT, không tạo job", badRes.status === 400 && badData.errorCode === "PROXY_BAD_HEIGHT");
} finally {
  bridge.kill("SIGTERM");
  await sleep(500);
  if (process.env.KEEP_TMP !== "1") fs.rmSync(TMP, { recursive: true, force: true });
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
