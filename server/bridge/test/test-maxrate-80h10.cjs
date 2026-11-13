#!/usr/bin/env node
/**
 * test-maxrate-80h10.cjs — Phase 9 đợt 80, luồng H10 (S4): trần bitrate
 * video của preset mạng xã hội đi từ ExportPanel → bridge → render.js.
 *
 * Kiểm chứng ĐẦU-CUỐI qua bridge THẬT (không mock spawnJob, mẫu 68 V2):
 *   A. POST /api/render với preset videoBitrateKbps:8000 → worker
 *      render.js được spawn PHẢI có `--maxrate 8000` trong argv
 *      (soi qua `ps`, khớp theo job id trong đường dẫn --spec).
 *   B. preset không có videoBitrateKbps → worker KHÔNG có `--maxrate`
 *      (CRF-only, hành vi cũ).
 *   C. preset videoBitrateKbps:99 → 400 PRESET_BITRATE_RANGE (tái dùng
 *      mã cũ — catalog bridge khóa 102 mã, không thêm mã mới).
 *   D. preset videoBitrateKbps:"8000" (chuỗi, sai kiểu) → 400.
 * Sau mỗi job A–B: huỷ ngay bằng DELETE /api/render/:id (không chờ
 * render xong — chỉ cần argv lúc spawn).
 *
 * Media tự tạo bằng ffmpeg (testsrc 1280×720 5s) trong thư mục làm việc
 * của test — không phụ thuộc file scratch của đợt khác.
 *
 * Cách chạy (từ gốc repo): node server/bridge/test/test-maxrate-80h10.cjs
 * Env: H10_BRIDGE_PORT (mặc định tự chọn 8930–8939), H10_WORK_DIR
 * (mặc định /tmp/round80-h10/bridge-work). Exit 0 mọi case PASS,
 * 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
"use strict";

const { spawn, execSync, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const WORK_DIR = process.env.H10_WORK_DIR || "/tmp/round80-h10/bridge-work";
const MEDIA = path.join(WORK_DIR, "maxrate-src.mp4");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}

const SPEC = {
  version: "0.2.0",
  meta: { name: "r80h10-maxrate", width: 1280, height: 720, fps: 30 },
  tracks: [{
    id: "v0", kind: "video",
    clips: [{
      id: "c0", kind: "video", src: "maxrate-src.mp4", start: 0, duration: 5,
      in: 0, out: 5, sourceAudioMode: "mute",
    }],
  }],
};

/** POST /api/render, trả { status, body }. */
async function postRender(port, preset) {
  const buf = fs.readFileSync(MEDIA);
  const form = new FormData();
  form.append("spec", JSON.stringify(SPEC));
  if (preset !== undefined) form.append("preset", JSON.stringify(preset));
  form.append("media", new File([buf], "maxrate-src.mp4", { type: "video/mp4" }));
  const res = await fetch(`http://127.0.0.1:${port}/api/render`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

/** Soi argv worker render.js của job (khớp --spec chứa job id) qua ps. */
function workerArgv(jobId) {
  try {
    const out = execSync("ps -eo args", { encoding: "utf8" });
    for (const line of out.split("\n")) {
      if (line.includes("render.js") && line.includes("--spec") && line.includes(jobId)) return line.trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function waitWorkerArgv(jobId, timeoutMs = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const argv = workerArgv(jobId);
    if (argv) return argv;
    await sleep(300);
  }
  return null;
}

async function cancelJob(port, jobId) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/render/${jobId}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false }); log(`FAIL ${n} — ${d}`); };
  let bridge = null;
  const killAll = () => { try { bridge?.kill("SIGTERM"); } catch {} };
  process.on("exit", killAll);

  try {
    if (!fs.existsSync(BRIDGE_ENTRY)) throw new Error(`không thấy bridge ${BRIDGE_ENTRY}`);
    fs.rmSync(WORK_DIR, { recursive: true, force: true });
    fs.mkdirSync(WORK_DIR, { recursive: true });
    // Media tự tạo: testsrc 1280×720 5s 30fps (đủ làm input render).
    execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
      "-i", "testsrc2=size=1280x720:duration=5:rate=30",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", MEDIA], { stdio: "inherit" });
    if (!fs.existsSync(MEDIA)) throw new Error(`không tạo được media ${MEDIA}`);
    log(`media tự tạo: ${MEDIA} (${fs.statSync(MEDIA).size} bytes)`);

    const PORT = Number(process.env.H10_BRIDGE_PORT || 0) || (await pickFreePort(8930, 8939));
    if (!PORT) throw new Error("hết cổng bridge trống 8930–8939");
    const logFd = fs.openSync(path.join(WORK_DIR, "bridge-test.log"), "w");
    bridge = spawn("node", [BRIDGE_ENTRY], {
      stdio: ["ignore", logFd, logFd],
      env: {
        ...process.env,
        BRIDGE_PORT: String(PORT),
        BRIDGE_WORK_DIR: WORK_DIR,
        BRIDGE_RATE_PERSIST_PATH: path.join(WORK_DIR, `rate-limit-${process.pid}.json`),
      },
    });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(`http://127.0.0.1:${PORT}/api/health`); if (r.ok) up = true; } catch { /* chưa lên */ }
      if (!up) await sleep(1000);
    }
    if (!up) throw new Error(`bridge không lên ở :${PORT} sau 120s`);
    log(`bridge đã lên :${PORT} (WORK_DIR=${WORK_DIR})`);

    const basePreset = { crf: 20, x264Preset: "medium", audioBitrateKbps: 160 };

    // --- A. videoBitrateKbps:8000 → worker có --maxrate 8000 -----------
    const a = await postRender(PORT, { ...basePreset, videoBitrateKbps: 8000 });
    // Bridge tạo job trả 200 hoặc 201 (đợt này ghi nhận 201) — chấp nhận cả hai.
    if ((a.status !== 200 && a.status !== 201) || !a.body.jobId) {
      fail("A preset maxrate 8000 → worker có --maxrate 8000", `POST trả ${a.status}: ${JSON.stringify(a.body).slice(0, 300)}`);
    } else {
      const argv = await waitWorkerArgv(a.body.jobId);
      if (argv && argv.includes("--maxrate 8000")) {
        pass("A preset maxrate 8000 → worker có --maxrate 8000", `job ${a.body.jobId} argv có --maxrate 8000`);
      } else {
        fail("A preset maxrate 8000 → worker có --maxrate 8000", `job ${a.body.jobId} argv=${argv ? JSON.stringify(argv.slice(0, 400)) : "không thấy worker sau 60s"}`);
      }
      await cancelJob(PORT, a.body.jobId);
      await sleep(1000);
    }

    // --- B. preset vắng field → worker KHÔNG có --maxrate ---------------
    const b = await postRender(PORT, { ...basePreset });
    if ((b.status !== 200 && b.status !== 201) || !b.body.jobId) {
      fail("B preset vắng maxrate → worker KHÔNG có --maxrate", `POST trả ${b.status}: ${JSON.stringify(b.body).slice(0, 300)}`);
    } else {
      const argv = await waitWorkerArgv(b.body.jobId);
      if (argv && !argv.includes("--maxrate")) {
        pass("B preset vắng maxrate → worker KHÔNG có --maxrate", `job ${b.body.jobId} argv CRF-only như trước`);
      } else {
        fail("B preset vắng maxrate → worker KHÔNG có --maxrate", `job ${b.body.jobId} argv=${argv ? JSON.stringify(argv.slice(0, 400)) : "không thấy worker sau 60s"}`);
      }
      await cancelJob(PORT, b.body.jobId);
      await sleep(1000);
    }

    // --- C. videoBitrateKbps:99 → 400 PRESET_BITRATE_RANGE ---------------
    const c = await postRender(PORT, { ...basePreset, videoBitrateKbps: 99 });
    if (c.status === 400 && c.body.errorCode === "PRESET_BITRATE_RANGE") {
      pass("C preset maxrate 99 → 400 PRESET_BITRATE_RANGE", "whitelist chặn trần ngoài 500..100000, tái dùng mã cũ");
    } else {
      fail("C preset maxrate 99 → 400 PRESET_BITRATE_RANGE", `trả ${c.status}: ${JSON.stringify(c.body).slice(0, 300)}`);
    }

    // --- D. videoBitrateKbps:"8000" (chuỗi) → 400 ------------------------
    const d = await postRender(PORT, { ...basePreset, videoBitrateKbps: "8000" });
    if (d.status === 400 && d.body.errorCode === "PRESET_BITRATE_RANGE") {
      pass("D preset maxrate chuỗi → 400 PRESET_BITRATE_RANGE", "sai kiểu bị chặn, không lọt xuống worker");
    } else {
      fail("D preset maxrate chuỗi → 400 PRESET_BITRATE_RANGE", `trả ${d.status}: ${JSON.stringify(d.body).slice(0, 300)}`);
    }

    const nPass = results.filter((r) => r.ok).length;
    log(`KẾT QUẢ: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (err) {
    log(`HARNESS LỖI: ${err && err.message ? err.message : err}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
