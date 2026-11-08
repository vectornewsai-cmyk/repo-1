#!/usr/bin/env node
/**
 * test_round65_s4_gpu_bridge.js — Đợt 65 S4: endpoint bridge cho nút
 * "Probe lại GPU" (GET /api/gpu-probe + POST /api/gpu-probe/reprobe).
 *
 * Chạy bridge THẬT trên cổng test (BRIDGE_PORT=8791, work dir riêng,
 * cache probe riêng qua VCUT_GPU_PROBE_CACHE) rồi gọi bằng fetch:
 *   (1) GET khi cache đã gieo encoder=h264_nvenc → probed=true,
 *       encoder=h264_nvenc (CHỈ ĐỌC cache, không probe).
 *   (2) POST /reprobe → xoá cache cũ + probe lại THẬT trên VM này
 *       (không GPU → encoder=null, cacheCleared=true, source="probe").
 *   (3) GET sau reprobe → encoder=null, probed=true; file cache trên đĩa
 *       cũng đã ghi lại encoder=null.
 *   (4) GET /api/openapi.json → chứa /api/gpu-probe (YAML parse được).
 *
 * Chạy: node server/render/src/test_round65_s4_gpu_bridge.js
 * (cần ffmpeg; ~30s).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r65s4b-"));
const ROOT = path.join(__dirname, "..", "..", ".."); // gốc repo (src → render → server → repo)
const GPUENC = require("./gpuencode");
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}`;
const cachePath = path.join(work, "gpu-probe.json");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
async function getJson(p) {
  const r = await fetch(`${BASE}${p}`);
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function postJson(p) {
  const r = await fetch(`${BASE}${p}`, { method: "POST" });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function waitHealth(tries = 30) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return true;
    } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

(async () => {
  console.log("== Đợt 65 S4 — endpoint bridge GPU probe (bridge thật, cổng 8791) ==");
  console.log(`   WORK=${work}`);

  // Gieo cache encoder=h264_nvenc cho ffmpeg thật (fingerprint đúng binary).
  const seedOk = GPUENC.writeGpuProbeCache(cachePath,
    { encoder: "h264_nvenc", tried: ["h264_nvenc"], detail: "h264_nvenc encode thử 1 frame thành công (gieo tay)" },
    "ffmpeg");
  ok(seedOk, "gieo cache đĩa encoder=h264_nvenc (fingerprint ffmpeg thật)");

  const bridge = spawn("node", [path.join(ROOT, "server", "bridge", "src", "index.js")], {
    env: {
      ...process.env,
      BRIDGE_PORT: String(PORT),
      BRIDGE_WORK_DIR: path.join(work, "bridge-work"),
      // Đợt 66 T9 — persist riêng (work là mkdtemp): tránh rò mốc limiter sang test khác (đợt 65 §3b).
      BRIDGE_RATE_PERSIST_PATH: path.join(work, "rate-limit.json"),
      VCUT_GPU_PROBE_CACHE: cachePath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let bridgeLog = "";
  bridge.stdout.on("data", (d) => { bridgeLog += d.toString(); });
  bridge.stderr.on("data", (d) => { bridgeLog += d.toString(); });
  try {
    const up = await waitHealth();
    if (!up) console.error(`   bridge log (khởi động thất bại, đầu):\n${bridgeLog.slice(0, 2000)}`);
    ok(up, "bridge lên trên cổng 8791 (/api/health 200)");

    // (1) GET — chỉ đọc cache đã gieo.
    const g1 = await getJson("/api/gpu-probe");
    console.log(`   GET /api/gpu-probe → ${JSON.stringify(g1.body)}`);
    ok(g1.status === 200, "GET /api/gpu-probe trả 200");
    ok(g1.body && g1.body.probed === true && g1.body.encoder === "h264_nvenc",
      "GET thấy cache đã gieo: probed=true, encoder=h264_nvenc");
    ok(g1.body && g1.body.cached === true && g1.body.source === "disk",
      "GET báo cached=true, source=disk (không probe lại)");

    // (2) POST reprobe — xoá cache + probe thật (VM không GPU → null).
    const t0 = Date.now();
    const p1 = await postJson("/api/gpu-probe/reprobe");
    const ms = Date.now() - t0;
    console.log(`   POST /api/gpu-probe/reprobe (${ms}ms) → ${JSON.stringify(p1.body)}`);
    ok(p1.status === 200, "POST /api/gpu-probe/reprobe trả 200");
    ok(p1.body && p1.body.encoder === null, "reprobe trên VM không GPU → encoder=null");
    ok(p1.body && p1.body.cacheCleared === true, "reprobe báo cacheCleared=true (đã xoá cache lỗi)");
    ok(p1.body && p1.body.source === "probe" && p1.body.cached === false,
      "reprobe báo source=probe, cached=false (probe thật, không đọc cache)");
    ok(Array.isArray(p1.body && p1.body.tried) && p1.body.tried.length === 3,
      "reprobe đã thử cả 3 encoder (nvenc → qsv → vaapi)");

    // (3) GET sau reprobe + file cache trên đĩa.
    const g2 = await getJson("/api/gpu-probe");
    console.log(`   GET sau reprobe → ${JSON.stringify(g2.body)}`);
    ok(g2.body && g2.body.probed === true && g2.body.encoder === null,
      "GET sau reprobe: probed=true, encoder=null (cache mới đã ghi)");
    const onDisk = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    ok(onDisk.encoder === null, "file cache trên đĩa đã ghi lại encoder=null");

    // (4) openapi.json chứa endpoint mới (YAML parse được).
    const oa = await getJson("/api/openapi.json");
    ok(oa.status === 200 && oa.body && oa.body.paths && oa.body.paths["/api/gpu-probe"],
      "GET /api/openapi.json chứa /api/gpu-probe (YAML sửa đúng)");
  } finally {
    bridge.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
    try { bridge.kill("SIGKILL"); } catch { /* đã chết */ }
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  console.log(`   WORK=${work}`);
  if (fail > 0) process.exit(1);
  console.log("✅ Đợt 65 S4 — endpoint bridge GPU probe: tất cả check pass");
})().catch((e) => { console.error(e); process.exit(2); });
