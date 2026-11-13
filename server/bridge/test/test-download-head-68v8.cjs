/**
 * test-download-head-68v8.cjs — Phase 9 đợt 68, luồng V8: endpoint HEAD
 * kiểm tra download được trước khi hiện nút tải (đóng nợ U7 đợt 67 §5.2).
 *
 * Chạy bằng (từ gốc repo):
 *   node server/bridge/test/test-download-head-68v8.cjs
 * Khởi động 1 bridge thật trên cổng ngẫu nhiên (WORK_DIR trên đĩa home +
 * rate persist riêng — theo quy tắc T9 đợt 66, đã đăng ký inventory ở
 * test-bridge-persist-audit.cjs) rồi:
 *   1. HEAD job lạ → 404 JOB_NOT_FOUND.
 *   2. HEAD jobId sai định dạng → 400 INVALID_JOB_ID.
 *   3. POST render thật (fixture clip 720p, xuất 320×180 1s) → HEAD ngay
 *      lúc job chưa xong → 409 JOB_NOT_DONE.
 *   4. Chờ job DONE → HEAD → 200 + Content-Length khớp outputSize +
 *      Content-Type video/mp4 (không có body: HEAD không stream MP4).
 *   5. Xoá output.mp4 khỏi thư mục job trên đĩa → HEAD → 409
 *      JOB_NOT_DONE (đúng case UI phải ẩn nút tải) + GET download → 409.
 *   6. GET download lúc job xong → 200 video/mp4 (hồi quy: GET không đổi).
 * Cần render worker thật (ffmpeg của bridge). Exit 0 mọi case pass, 1 có FAIL.
 *
 * Kiên cố với VM: ghi file qua exec bị EPERM theo đợt từ ~01:05 09/11
 * (xem LIMITS §6) nên POST render retry khi 500; bridge chết giữa chừng
 * (pkill broad của luồng khác) thì tự khởi động lại cùng work dir + cổng
 * (job queue recover lại job từ đĩa). Log bridge giữ trong workDir.
 */
"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const net = require("net");
const os = require("os");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..", "..");
const BRIDGE_ENTRY = path.join(REPO, "server", "bridge", "src", "index.js");

let pass = 0;
let fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ""}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pickFreePort(lo, hi) {
  return new Promise((resolve) => {
    const tryPort = (p) => {
      if (p > hi) return resolve(null);
      const s = net.createServer();
      s.once("error", () => tryPort(p + 1));
      s.once("listening", () => s.close(() => resolve(p)));
      s.listen(p, "127.0.0.1");
    };
    tryPort(lo);
  });
}

// --- Bridge lifecycle (state module-level để fetch tự khởi động lại) ------
let BRIDGE_PORT = 0;
let BRIDGE_WORK_DIR = "";
let bridge = null;

function startBridge() {
  // stdio pipe (KHÔNG dùng fd file): bridge console.error ghi ra fd file
  // mà gặp đợt EPERM của VM thì throw → uncaught → bridge chết exit 1
  // (tái lập ở dbg-die3); ghi ra pipe thì lỗi chỉ thành event, không
  // giết process. Log vẫn ghi ra bridge.log qua WriteStream có guard
  // (EPERM trên WriteStream mà không có handler 'error' thì giết luôn
  // tiến trình test — bài học lượt chạy trước).
  const child = spawn("node", [BRIDGE_ENTRY], {
    cwd: REPO,
    env: {
      ...process.env,
      BRIDGE_PORT: String(BRIDGE_PORT),
      BRIDGE_WORK_DIR: BRIDGE_WORK_DIR,
      // Đợt 66 T9: persist rate limiter riêng cho test này.
      BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, "rate-limit.json"),
      BRIDGE_RATE_RENDER: "1000",
      BRIDGE_RATE_GENERAL: "1000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logPath = path.join(BRIDGE_WORK_DIR, "bridge.log");
  const logStream = fs.createWriteStream(logPath, { flags: "w" });
  logStream.on("error", () => { /* đợt EPERM: bỏ qua, không giết test */ });
  const forward = (d) => { try { logStream.write(d); } catch { /* đợt EPERM */ } };
  child.stdout.on("data", forward);
  child.stderr.on("data", (d) => { forward(d); process.stdout.write(`[bridge ${child.pid} err] ${d}`); });
  child.on("exit", (code, signal) => {
    console.log(`[bridge ${child.pid} EXIT] code=${code} signal=${signal} at ${new Date().toISOString()}`);
    try { logStream.end(); } catch {}
  });
  return { child, logPath };
}

async function waitHealth(tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/health`);
      if (r.ok) return true;
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  return false;
}

async function ensureBridge() {
  if (bridge && bridge.child.exitCode === null) {
    try { const r = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/api/health`); if (r.ok) return; } catch { /* chết rồi — khởi động lại dưới đây */ }
  }
  if (bridge) { try { bridge.child.kill("SIGKILL"); } catch { /* đã chết */ } }
  bridge = startBridge();
  if (!(await waitHealth())) throw new Error(`bridge không lên (lại) :${BRIDGE_PORT} — xem ${bridge.logPath}`);
}

async function stopBridge() {
  if (!bridge) return;
  try { bridge.child.kill("SIGTERM"); } catch { /* đã chết */ }
  for (let i = 0; i < 20; i++) {
    if (bridge.child.exitCode !== null) return;
    await sleep(100);
  }
  try { bridge.child.kill("SIGKILL"); } catch { /* đã chết */ }
}

/** fetch tự khởi động lại bridge 1 lần khi mất kết nối (ECONNREFUSED). */
async function fetchWithRestart(url, init) {
  try {
    return await fetch(url, init);
  } catch (e) {
    if (e && (e.cause?.code === "ECONNREFUSED" || e.code === "ECONNREFUSED")) {
      console.log("  (mất kết nối bridge — khởi động lại rồi thử lại 1 lần)");
      await ensureBridge();
      return fetch(url, init);
    }
    throw e;
  }
}

async function req(method, urlPath) {
  const res = await fetchWithRestart(`http://127.0.0.1:${BRIDGE_PORT}${urlPath}`, { method });
  const text = await res.text().catch(() => "");
  let body = {};
  try { body = JSON.parse(text); } catch { /* HEAD/200 không có JSON */ }
  return { status: res.status, body, headers: res.headers, text };
}

async function postRender(spec, mediaPath) {
  const form = new FormData();
  form.append("spec", JSON.stringify(spec));
  form.append("preset", JSON.stringify({ crf: 23, x264Preset: "veryfast", audioBitrateKbps: 128 }));
  const buf = fs.readFileSync(mediaPath);
  form.append("media", new Blob([buf], { type: "video/mp4" }), "a.mp4");
  const res = await fetchWithRestart(`http://127.0.0.1:${BRIDGE_PORT}/api/render`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

/**
 * POST render có retry: bridge trên VM này thỉnh thoảng trả 500
 * INTERNAL_ERROR do ghi file qua exec bị EPERM theo đợt (tình trạng VM
 * từ ~01:05 09/11, xem LIMITS §6) — retry tối đa 6 lần, mỗi lần cách 8s
 * (đợt EPERM thường qua trong <1 phút).
 * Trả về kết quả lần cuối (kể cả khi vẫn 500 để caller assert rõ).
 */
async function postRenderRetry(spec, mediaPath, attempts = 6) {
  let last = null;
  for (let i = 1; i <= attempts; i++) {
    last = await postRender(spec, mediaPath);
    if (last.status === 201) return last;
    if (i < attempts) await sleep(8000);
  }
  return last;
}

/**
 * Chờ tới khi ghi file được vào work dir: VM này có đợt EPERM (ghi file
 * qua exec bị từ chối, xem LIMITS §6) — POST render trong đợt đó luôn
 * 500 nên chờ cửa sổ ghi được trước thay vì đốt POST retry. Probe bằng
 * file thật trong chính work dir.
 *
 * Sửa 09/11 (sau 2 lần skip render vì chờ 5 phút không qua): đợt EPERM
 * không chỉ dài vài phút mà còn NHẤP NHÁY theo giây — probe shell lúc
 * 18:48:14 ghi OK trong khi probe node cùng phút vẫn EPERM (file probe
 * còn sót lại 0 byte: open thành công, write bị EPERM). Vì vậy probe
 * mỗi 1s (thay vì 10s) trong tối đa ~3 phút: cửa sổ ghi được chỉ cần
 * mở 1s là bắt được, thay vì phải trùng đúng nhịp 10s.
 */
async function waitForWritableDir(dir, attempts = 180) {
  for (let i = 1; i <= attempts; i++) {
    const probe = path.join(dir, ".v8-write-probe");
    try {
      writeFileEpermRetry(probe, "x");
      fs.unlinkSync(probe);
      if (i > 1) console.log(`  (ghi được sau ${i} lần chờ — qua đợt EPERM)`);
      return true;
    } catch (e) {
      try { fs.unlinkSync(probe); } catch {} // dọn file 0 byte do write EPERM để lại
      if (i === 1) console.log("  (work dir chưa ghi được — chờ qua đợt EPERM của VM…)");
      await sleep(1000);
    }
  }
  return false;
}

async function main() {
  // Work dir trên đĩa home (103G trống): /tmp chỉ còn ~97M lúc chạy
  // (dưới ngưỡng 256M của bridge → POST render trả 507, xem LIMITS).
  const scratchBase = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v8");
  fs.mkdirSync(scratchBase, { recursive: true });
  BRIDGE_WORK_DIR = fs.mkdtempSync(path.join(scratchBase, "head-bridge-"));
  BRIDGE_PORT = await pickFreePort(8990, 8999);
  if (!BRIDGE_PORT) { console.error("hết cổng trống 8990–8999"); process.exitCode = 1; return; }
  try {
    await ensureBridge();

    // 1. HEAD job lạ → 404 JOB_NOT_FOUND (chỉ assert status: Express
    // strip body của HEAD theo chuẩn HTTP nên không có errorCode để đọc).
    const notFound = await req("HEAD", "/api/render/0123456789abcdef/download");
    ok(notFound.status === 404, "HEAD job lạ: 404", notFound.status);
    ok(notFound.text === "", "HEAD job lạ: body rỗng (chuẩn HEAD)", notFound.text.slice(0, 40));

    // 2. HEAD jobId sai định dạng → 400 INVALID_JOB_ID.
    const badId = await req("HEAD", "/api/render/khong-hop-le!/download");
    ok(badId.status === 400, "HEAD jobId sai định dạng: 400", badId.status);

    // 3. Render thật 1s → HEAD lúc chưa xong → 409 JOB_NOT_DONE.
    // Media lấy từ fixture có sẵn trong repo (clip 720p 8s, 104KB) —
    // KHÔNG tạo bằng ffmpeg: ffmpeg trên VM này lỗi EPERM "Could not
    // write header" theo đợt khi nhiều luồng round-68 chạy song song
    // (xem LIMITS §6), không liên quan endpoint đang test.
    const mediaPath = path.join(REPO, "server", "render", "examples", "media", "clip1.mp4");
    if (!fs.existsSync(mediaPath) || fs.statSync(mediaPath).size === 0) {
      console.error("thiếu fixture media:", mediaPath);
      process.exitCode = 1;
      return;
    }
    const spec = {
      version: "0.2.0",
      meta: { name: "v8-head", width: 320, height: 180, fps: 30 },
      tracks: [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 1, src: "a.mp4", in: 0, out: 1 }] }],
    };
    if (!(await waitForWritableDir(BRIDGE_WORK_DIR))) {
      console.error("work dir vẫn không ghi được sau ~3 phút (đợt EPERM dài) — bỏ qua phần render thật");
      process.exitCode = 1;
      return;
    }
    const created = await postRenderRetry(spec, mediaPath);
    ok(created.status === 201, "POST render thật: job được tạo (201)", created.status);
    const jobId = created.body.jobId;
    ok(typeof jobId === "string" && /^[0-9a-f]{16}$/.test(jobId), "POST render thật: jobId hợp lệ", jobId);
    if (!jobId) return;
    const notDone = await req("HEAD", `/api/render/${jobId}/download`);
    ok(notDone.status === 409, "HEAD job chưa xong: 409", notDone.status);
    ok(notDone.text === "", "HEAD job chưa xong: body rỗng (chuẩn HEAD)", notDone.text.slice(0, 40));

    // 4. Chờ DONE → HEAD 200 + Content-Length khớp outputSize, không body.
    let done = null;
    for (let i = 0; i < 240; i++) {
      const g = await req("GET", `/api/render/${jobId}`);
      if (g.body.status === "done") { done = g.body; break; }
      if (g.body.status === "error") break;
      await sleep(500);
    }
    ok(done !== null && done.status === "done", "render thật: job về done (poll ≤120s)", done && done.status);
    if (done) {
      ok(typeof done.outputSize === "number" && done.outputSize > 0, "render thật: outputSize > 0", done.outputSize);
      const headOk = await req("HEAD", `/api/render/${jobId}/download`);
      ok(headOk.status === 200, "HEAD job done: 200", headOk.status);
      ok(headOk.headers.get("content-type") === "video/mp4", "HEAD job done: Content-Type video/mp4", headOk.headers.get("content-type"));
      ok(
        headOk.headers.get("content-length") === String(done.outputSize),
        "HEAD job done: Content-Length khớp outputSize",
        headOk.headers.get("content-length"),
      );
      ok(headOk.text === "", "HEAD job done: không có body (không stream MP4 vô ích)", headOk.text.slice(0, 40));

      // 6. Hồi quy: GET download lúc job xong → 200 video/mp4.
      const getOk = await req("GET", `/api/render/${jobId}/download`);
      ok(getOk.status === 200, "GET download job done: 200 (hồi quy)", getOk.status);
      ok(getOk.headers.get("content-type") === "video/mp4", "GET download: Content-Type video/mp4", getOk.headers.get("content-type"));

      // 5. Xoá output.mp4 khỏi đĩa → HEAD 409 + GET 409 (đúng case UI ẩn nút).
      const outPath = path.join(BRIDGE_WORK_DIR, jobId, "output.mp4");
      ok(fs.existsSync(outPath), "output.mp4 có trên đĩa trước khi xoá", outPath);
      fs.unlinkSync(outPath);
      const headGone = await req("HEAD", `/api/render/${jobId}/download`);
      ok(headGone.status === 409, "HEAD sau khi xoá output: 409", headGone.status);
      ok(headGone.text === "", "HEAD sau khi xoá output: body rỗng (chuẩn HEAD)", headGone.text.slice(0, 40));
      const getGone = await req("GET", `/api/render/${jobId}/download`);
      ok(getGone.status === 409, "GET download sau khi xoá output: 409 (khớp HEAD)", getGone.status);
    }
  } finally {
    await stopBridge();
    // Giữ workDir (log + job) trong hidden_files để soi khi đỏ — dọn tay.
  }
  console.log(`HEAD download round 68 V8: ${pass}/${pass + fail} pass`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("lỗi harness:", e);
  process.exitCode = 1;
});
