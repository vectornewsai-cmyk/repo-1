#!/usr/bin/env node
/**
 * test-stab-single-thread-68v2.cjs — Phase 9 đợt 68, luồng V2: toggle
 * bật/tắt stabilize single-thread decode (đóng nợ đợt 67 U1 §7 mục 1).
 *
 * Kiểm chứng ĐẦU-CUỐI qua bridge THẬT (không mock spawnJob):
 *   A. POST /api/render với preset stabSingleThread:false → worker
 *      render.js được spawn PHẢI có `--no-stab-single-thread` trong argv
 *      (soi qua `ps`, khớp theo job id trong đường dẫn --spec).
 *   B. preset stabSingleThread:true → worker KHÔNG có cờ đó.
 *   C. preset không có field (mặc định) → worker KHÔNG có cờ đó
 *      (mặc định BẬT của render.js, xem U1).
 *   D. preset stabSingleThread:"false" (chuỗi, sai kiểu) → job vẫn tạo
 *      được, worker KHÔNG có cờ tắt (hành vi đã ghi trong code: chỉ
 *      boolean thật được nhận; sai kiểu → về mặc định BẬT — xem LIMITS
 *      V2 §2, lý do lock catalog 102 mã).
 *   E. preset crf:99 → 400 PRESET_CRF_RANGE (whitelist vẫn validate
 *      chặt các field khác — hồi quy parsePreset).
 * Sau mỗi job A–D: huỷ ngay bằng DELETE /api/render/:id (không chờ
 * render xong — chỉ cần argv lúc spawn).
 *
 * Cách chạy (từ gốc repo): node server/bridge/test/test-stab-single-thread-68v2.cjs
 * Env: V2_BRIDGE_PORT (mặc định tự chọn 8990–8999), V2_WORK_DIR
 * (mặc định /tmp/round68-v2/bridge-work). Exit 0 mọi case PASS,
 * 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
"use strict";

const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const MEDIA = "/home/hatch/workspace/.scratch-r65s1-0e63Ph/media/shakynoisy720.mp4";
const WORK_DIR = process.env.V2_WORK_DIR || "/tmp/round68-v2/bridge-work";

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
  meta: { name: "r68v2-bridge", width: 1280, height: 720, fps: 30 },
  tracks: [{
    id: "v0", kind: "video",
    clips: [{
      id: "c0", kind: "video", src: "shaky720.mp4", start: 0, duration: 5,
      in: 0, out: 5, sourceAudioMode: "mute",
      enhance: { stabilize: { smoothing: 10 } },
    }],
  }],
};

/** POST /api/render, trả { status, body }. */
async function postRender(port, preset) {
  const buf = fs.readFileSync(MEDIA);
  const form = new FormData();
  form.append("spec", JSON.stringify(SPEC));
  if (preset !== undefined) form.append("preset", JSON.stringify(preset));
  form.append("media", new File([buf], "shaky720.mp4", { type: "video/mp4" }));
  const res = await fetch(`http://127.0.0.1:${port}/api/render`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

/** Soi argv worker render.js của job (khớp --spec chứa job id) qua ps. */
function workerArgv(jobId) {
  try {
    const out = execSync("ps -eo args", { encoding: "utf8" });
    for (const line of out.split("\n")) {
      if (line.includes("render.js") && line.includes(`--spec`) && line.includes(jobId)) return line.trim();
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
    if (!fs.existsSync(MEDIA)) throw new Error(`không thấy media ${MEDIA}`);
    if (!fs.existsSync(BRIDGE_ENTRY)) throw new Error(`không thấy bridge ${BRIDGE_ENTRY}`);
    const PORT = Number(process.env.V2_BRIDGE_PORT || 0) || (await pickFreePort(8990, 8999));
    if (!PORT) throw new Error("hết cổng bridge trống 8990–8999");
    fs.rmSync(WORK_DIR, { recursive: true, force: true });
    fs.mkdirSync(WORK_DIR, { recursive: true });
    const logFd = fs.openSync("/tmp/round68-v2/bridge-test.log", "w");
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

    const basePreset = { crf: 23, x264Preset: "veryfast", audioBitrateKbps: 128 };

    // --- A. stabSingleThread:false → worker có --no-stab-single-thread ---
    const a = await postRender(PORT, { ...basePreset, stabSingleThread: false });
    if (a.status !== 200 || !a.body.jobId) {
      fail("A preset false → worker có --no-stab-single-thread", `POST trả ${a.status}: ${JSON.stringify(a.body).slice(0, 300)}`);
    } else {
      const argv = await waitWorkerArgv(a.body.jobId);
      if (argv && argv.includes("--no-stab-single-thread")) {
        pass("A preset false → worker có --no-stab-single-thread", `job ${a.body.jobId} argv có cờ tắt`);
      } else {
        fail("A preset false → worker có --no-stab-single-thread", `job ${a.body.jobId} argv=${argv ? JSON.stringify(argv.slice(0, 400)) : "không thấy worker sau 60s"}`);
      }
      await cancelJob(PORT, a.body.jobId);
      await sleep(1000);
    }

    // --- B. stabSingleThread:true → worker KHÔNG có cờ tắt ---------------
    const b = await postRender(PORT, { ...basePreset, stabSingleThread: true });
    if (b.status !== 200 || !b.body.jobId) {
      fail("B preset true → worker KHÔNG có cờ tắt", `POST trả ${b.status}: ${JSON.stringify(b.body).slice(0, 300)}`);
    } else {
      const argv = await waitWorkerArgv(b.body.jobId);
      if (argv && !argv.includes("--no-stab-single-thread")) {
        pass("B preset true → worker KHÔNG có cờ tắt", `job ${b.body.jobId} argv không có cờ tắt (mặc định BẬT)`);
      } else {
        fail("B preset true → worker KHÔNG có cờ tắt", `job ${b.body.jobId} argv=${argv ? JSON.stringify(argv.slice(0, 400)) : "không thấy worker sau 60s"}`);
      }
      await cancelJob(PORT, b.body.jobId);
      await sleep(1000);
    }

    // --- C. preset không có field → worker KHÔNG có cờ tắt ---------------
    const c = await postRender(PORT, { ...basePreset });
    if (c.status !== 200 || !c.body.jobId) {
      fail("C preset vắng field → worker KHÔNG có cờ tắt", `POST trả ${c.status}: ${JSON.stringify(c.body).slice(0, 300)}`);
    } else {
      const argv = await waitWorkerArgv(c.body.jobId);
      if (argv && !argv.includes("--no-stab-single-thread")) {
        pass("C preset vắng field → worker KHÔNG có cờ tắt", `job ${c.body.jobId} argv không có cờ tắt (default true)`);
      } else {
        fail("C preset vắng field → worker KHÔNG có cờ tắt", `job ${c.body.jobId} argv=${argv ? JSON.stringify(argv.slice(0, 400)) : "không thấy worker sau 60s"}`);
      }
      await cancelJob(PORT, c.body.jobId);
      await sleep(1000);
    }

    // --- D. stabSingleThread:"false" (chuỗi) → job tạo được, KHÔNG tắt ---
    const d = await postRender(PORT, { ...basePreset, stabSingleThread: "false" });
    if (d.status !== 200 || !d.body.jobId) {
      fail("D preset chuỗi \"false\" → job tạo được, worker KHÔNG tắt", `POST trả ${d.status}: ${JSON.stringify(d.body).slice(0, 300)}`);
    } else {
      const argv = await waitWorkerArgv(d.body.jobId);
      if (argv && !argv.includes("--no-stab-single-thread")) {
        pass("D preset chuỗi \"false\" → job tạo được, worker KHÔNG tắt", `job ${d.body.jobId}: sai kiểu → về mặc định BẬT (đúng hành vi đã ghi trong code)`);
      } else {
        fail("D preset chuỗi \"false\" → job tạo được, worker KHÔNG tắt", `job ${d.body.jobId} argv=${argv ? JSON.stringify(argv.slice(0, 400)) : "không thấy worker sau 60s"}`);
      }
      await cancelJob(PORT, d.body.jobId);
      await sleep(1000);
    }

    // --- E. crf:99 → 400 PRESET_CRF_RANGE (whitelist vẫn chặt) -----------
    const e = await postRender(PORT, { ...basePreset, crf: 99 });
    if (e.status === 400 && e.body.errorCode === "PRESET_CRF_RANGE") {
      pass("E preset crf:99 → 400 PRESET_CRF_RANGE", "whitelist vẫn validate chặt field khác");
    } else {
      fail("E preset crf:99 → 400 PRESET_CRF_RANGE", `trả ${e.status}: ${JSON.stringify(e.body).slice(0, 300)}`);
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
