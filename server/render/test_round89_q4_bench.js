/**
 * test_round89_q4_bench.js — Đo giới hạn render mask+track (Phase 9 đợt 89 Q4).
 * Chạy: node test_round89_q4_bench.js (từ server/render).
 *
 * Đo (render thật, không mock):
 *  B1 4K: 3840x2160, 30fps, 2s, video đỏ + mask ellipse + track 0.35→0.65,
 *      mode png mặc định. Ghi wall time, fps, đỉnh RSS cây tiến trình
 *      (lấy mẫu 4 lần/s qua ps), centroid mask 3 mốc.
 *  B2 dài: 1280x720, 30fps, 30s, cùng hình học/track. Ghi wall, fps,
 *      đỉnh RSS, centroid 3 mốc.
 *
 * Script LUÔN exit 0 và in JSON tóm tắt — case nào fail (vd: 4K OOM trên
 * VM ít RAM) được ghi rõ failed + lý do + RAM/load lúc đo, để LIMITS doc
 * ghi trung thực thay vì bịa số. RSS đỉnh là tổng RSS của cây tiến trình
 * render (node render.js + ffmpeg + helper python) lấy mẫu qua `ps`.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawn, spawnSync, execSync } = require("child_process");

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

// Retry tạo file — sóng EPERM thoáng qua có thể làm ffmpeg ghi file fail.
// Cửa sổ retry RỘNG (tới ~4 phút): sóng EPERM đo được đợt này kéo dài
// 1–2 phút, cửa sổ 36s của bản đầu đã không đủ.
function runRetry(cmd, args, attempts = 20) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      return run(cmd, args);
    } catch (e) {
      lastErr = e;
      spawnSync("sleep", [String(Math.min(2 * i, 15))], { stdio: "ignore" }); // ngủ thật: Atomics.wait trả ngay 0ms trên VM này
    }
  }
  throw lastErr;
}

function sysState() {
  const mem = fs.readFileSync("/proc/meminfo", "utf8");
  const avail = /MemAvailable:\s+(\d+) kB/.exec(mem);
  const total = /MemTotal:\s+(\d+) kB/.exec(mem);
  const load = fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/).slice(0, 3).join(" ");
  return {
    memAvailableMb: avail ? Math.round(Number(avail[1]) / 1024) : null,
    memTotalMb: total ? Math.round(Number(total[1]) / 1024) : null,
    loadavg: load,
    uptime: fs.readFileSync("/proc/uptime", "utf8").trim().split(/\s+/)[0],
  };
}

// Tổng RSS (KB) của cây tiến trình gốc rootPid (gồm chính nó + mọi con cháu).
function treeRssKb(rootPid) {
  try {
    const out = execSync("ps -eo pid,ppid,rss --no-headers", { encoding: "utf8" });
    const children = new Map(); // ppid -> [pid]
    const rss = new Map(); // pid -> rss KB
    for (const line of out.trim().split("\n")) {
      const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(line);
      if (!m) continue;
      const pid = Number(m[1]), ppid = Number(m[2]);
      rss.set(pid, Number(m[3]));
      if (!children.has(ppid)) children.set(ppid, []);
      children.get(ppid).push(pid);
    }
    let sum = 0;
    const stack = [rootPid];
    const seen = new Set();
    while (stack.length) {
      const p = stack.pop();
      if (seen.has(p)) continue;
      seen.add(p);
      sum += rss.get(p) || 0;
      for (const c of children.get(p) || []) stack.push(c);
    }
    return sum;
  } catch {
    return 0;
  }
}

// Chạy render.js bất đồng bộ, lấy mẫu RSS cây tiến trình mỗi 250ms.
// CHỈ retry khi fail đúng vì EPERM ("Operation not permitted") — lỗi môi
// trường; mọi lỗi khác trả về ngay để số đo trung thực.
function renderMeasured(dir, mediaDir, spec, name, extraArgs = []) {
  const specPath = path.join(dir, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const out = path.join(dir, `${name}.mp4`);
  const once = () => new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn("node",
      ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir, ...extraArgs],
      { cwd: __dirname, encoding: "utf8" });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    let peakRssKb = 0;
    const timer = setInterval(() => {
      const rss = treeRssKb(child.pid);
      if (rss > peakRssKb) peakRssKb = rss;
    }, 250);
    child.on("close", (code) => {
      clearInterval(timer);
      const secs = (Date.now() - t0) / 1000;
      resolve({ out, code, secs, stdout, stderr, peakRssMb: Math.round(peakRssKb / 1024) });
    });
    child.on("error", (e) => {
      clearInterval(timer);
      resolve({ out, code: -1, secs: (Date.now() - t0) / 1000, stdout, stderr: String(e), peakRssMb: 0 });
    });
  });
  return (async () => {
    let r = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      r = await once();
      const all = (r.stdout || "") + (r.stderr || "");
      if (r.code === 0 || !/Operation not permitted/.test(all)) break;
      console.error(`  (bench render "${name}" fail vì EPERM, thử lại lần ${attempt}/3 sau 10s)`);
      spawnSync("sleep", ["10"], { stdio: "ignore" });
    }
    return r;
  })();
}

function framePng(out, t, dir, tag) {
  const png = path.join(dir, `${tag}.png`);
  // Retry: sóng EPERM thoáng qua có thể làm ffmpeg ghi PNG fail.
  let lastErr = null;
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      run("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", out, "-frames:v", "1", png]);
      if (fs.existsSync(png) && fs.statSync(png).size > 0) return png;
      lastErr = new Error(`ffmpeg exit 0 nhưng ${png} rỗng/thiếu (attempt ${attempt})`);
    } catch (e) {
      lastErr = e;
    }
    spawnSync("sleep", [String(Math.min(0.5 * attempt, 8))], { stdio: "ignore" }); // ngủ thật: Atomics.wait trả ngay 0ms trên VM này
  }
  throw lastErr;
}

function centroid(png, chan) {
  const py = `import numpy as np
from PIL import Image
im = np.asarray(Image.open(${JSON.stringify(png)}).convert("RGB")).astype(float)
m = im[:, :, ${chan}] > 100
m &= (im[:, :, ( ${chan} + 1) % 3] < 100) & (im[:, :, (${chan} + 2) % 3] < 100)
ys, xs = np.nonzero(m)
H, W = m.shape
print(f"{xs.mean()/W:.4f} {ys.mean()/H:.4f} {len(xs)}")`;
  const s = run("python3", ["-c", py]).trim().split(/\s+/).map(Number);
  return { x: s[0], y: s[1], n: s[2] };
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-q4bench-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  const summary = { workdir: dir, sysBefore: sysState(), cases: {} };
  console.log("sys trước đo:", JSON.stringify(summary.sysBefore));

  const mask = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.3, h: 0.5, feather: 0 };

  // ---- B1: 4K 3840x2160, 30fps, 2s, track 0.35→0.65 ----
  console.log("== B1: 4K 3840x2160 30fps 2s mask+track ==");
  try {
    runRetry("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
      "color=c=0xff0000:s=3840x2160:d=2:r=30", "-c:v", "libx264", "-preset", "veryfast",
      "-crf", "18", "-pix_fmt", "yuv420p", path.join(mediaDir, "red4k.mp4")]);
    const spec4k = {
      version: "0.2.0",
      meta: { name: "q4-4k", width: 3840, height: 2160, fps: 30, duration: 2 },
      tracks: [{
        id: "v1", kind: "video",
        clips: [{
          kind: "video", id: "c1", src: "red4k.mp4", start: 0, duration: 2, in: 0, out: 2, speed: 1,
          mask, track: { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 2, x: 0.65, y: 0.5 }] },
        }],
      }],
    };
    const sysAt = sysState();
    const r = await renderMeasured(dir, mediaDir, spec4k, "bench-4k");
    const frames = 60;
    const c = { sysAt, wallSecs: +r.secs.toFixed(1), fps: +(frames / r.secs).toFixed(2), peakRssMb: r.peakRssMb };
    if (r.code === 0 && fs.existsSync(r.out)) {
      c.ok = true;
      const size = fs.statSync(r.out).size;
      c.outBytes = size;
      // track: t=0.5 → 0.425; t=1.0 → 0.5; t=1.5 → 0.575.
      c.centroids = {};
      for (const [t, ex] of [[0.5, 0.425], [1.0, 0.5], [1.5, 0.575]]) {
        const cc = centroid(framePng(r.out, t, dir, `b1-${String(t).replace(".", "")}`), 0);
        c.centroids[`t${t}`] = { x: cc.x, y: cc.y, expectedX: ex, dev: +(Math.abs(cc.x - ex)).toFixed(4) };
      }
      console.log("B1 OK:", JSON.stringify(c));
    } else {
      c.ok = false;
      c.exitCode = r.code;
      c.stderrTail = (r.stderr || "").slice(-500);
      console.log("B1 FAIL (không đo được 4K):", JSON.stringify(c));
    }
    summary.cases["4k-2s"] = c;
  } catch (e) {
    summary.cases["4k-2s"] = { ok: false, error: String(e).slice(0, 500), sysAt: sysState() };
    console.log("B1 EXCEPTION:", String(e).slice(0, 500));
  }

  // Chờ RAM hồi giữa 2 case nặng.
  await new Promise((res) => setTimeout(res, 5000));
  console.log("sys giữa 2 case:", JSON.stringify(sysState()));

  // ---- B2: clip dài 1280x720, 30fps, 30s, track 0.35→0.65 ----
  console.log("== B2: 720p 30fps 30s mask+track ==");
  try {
    runRetry("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
      "color=c=0xff0000:s=1280x720:d=30:r=30", "-c:v", "libx264", "-preset", "veryfast",
      "-crf", "18", "-pix_fmt", "yuv420p", path.join(mediaDir, "red30.mp4")]);
    const spec30 = {
      version: "0.2.0",
      meta: { name: "q4-long30", width: 1280, height: 720, fps: 30, duration: 30 },
      tracks: [{
        id: "v1", kind: "video",
        clips: [{
          kind: "video", id: "c1", src: "red30.mp4", start: 0, duration: 30, in: 0, out: 30, speed: 1,
          mask, track: { points: [{ t: 0, x: 0.35, y: 0.5 }, { t: 30, x: 0.65, y: 0.5 }] },
        }],
      }],
    };
    const sysAt = sysState();
    const r = await renderMeasured(dir, mediaDir, spec30, "bench-30s");
    const frames = 900;
    const c = { sysAt, wallSecs: +r.secs.toFixed(1), fps: +(frames / r.secs).toFixed(2), peakRssMb: r.peakRssMb };
    if (r.code === 0 && fs.existsSync(r.out)) {
      c.ok = true;
      c.outBytes = fs.statSync(r.out).size;
      // track: t=7.5 → 0.425; t=15 → 0.5; t=22.5 → 0.575.
      c.centroids = {};
      for (const [t, ex] of [[7.5, 0.425], [15, 0.5], [22.5, 0.575]]) {
        const cc = centroid(framePng(r.out, t, dir, `b2-${String(t).replace(".", "")}`), 0);
        c.centroids[`t${t}`] = { x: cc.x, y: cc.y, expectedX: ex, dev: +(Math.abs(cc.x - ex)).toFixed(4) };
      }
      console.log("B2 OK:", JSON.stringify(c));
    } else {
      c.ok = false;
      c.exitCode = r.code;
      c.stderrTail = (r.stderr || "").slice(-500);
      console.log("B2 FAIL:", JSON.stringify(c));
    }
    summary.cases["720p-30s"] = c;
  } catch (e) {
    summary.cases["720p-30s"] = { ok: false, error: String(e).slice(0, 500), sysAt: sysState() };
    console.log("B2 EXCEPTION:", String(e).slice(0, 500));
  }

  summary.sysAfter = sysState();
  console.log("Q4-BENCH-SUMMARY " + JSON.stringify(summary));
  process.exit(0);
}

main();
