#!/usr/bin/env node
/**
 * measure-64r3-encode-fps.mjs — Phase 9 đợt 64, luồng R3: tách FPS
 * decode / enhance / encode trên clip dài 20s (đóng nợ đợt 63 R2 §8
 * "đo FPS enhance trên clip dài thật (>5s)" phía render + đợt 63 R3
 * "FPS blend đo lại khi VM rảnh").
 *
 * Đo bằng ffmpeg thật (không ước lượng), mỗi cấu hình ×3 lần, 720p +
 * 1080p, clip long720/long1080.mp4 (testsrc2 + noise alls=15, 20s,
 * 30fps = 600 frame, libx264 veryfast crf 23):
 *   - decode-only: ffmpeg -i in -an -f null - (giải mã + bỏ, không encode)
 *   - encode: libx264 veryfast crf 23 (không filter)
 *   - encode+denoise: + hqdn3d=12:9:12:9 (= denoise strength 0.5 theo
 *     thang render.js/enhance.js — xem docs đợt 63 R2 §2.2)
 * Báo cả fps wall (frame/real) và fps CPU (frame/(user+sys) qua bash
 * `time -p` — CPU time kháng tải VM như đợt 63 R2 §2 đã chứng minh,
 * spread wall có thể 2–6× dưới tải song song) + loadavg từng lần chạy.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/measure-64r3-encode-fps.mjs
 * Env: R3_ENCODE_REPEATS (mặc định 3), R3_ENCODE_OUT (mặc định
 * hidden_files/round64-r3/encode-fps.json). Exit 0 khi xong (kể cả khi
 * có cấu hình chậm — số liệu là kết quả, không phải pass/fail).
 * KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const REPEATS = Math.max(1, Number(process.env.R3_ENCODE_REPEATS || 3));
const OUT = process.env.R3_ENCODE_OUT || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round64-r3", "encode-fps.json");
const FRAMES = 600; // 20s × 30fps

function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function log(...a) { console.log(`[${new Date().toISOString()}]`, ...a); }

function runFfmpeg(label, args) {
  const cmd = `time -p ffmpeg -v info -nostdin ${args} 2>&1`;
  const loadBefore = loadAvg();
  const t0 = Date.now();
  const r = spawnSync("bash", ["-c", cmd], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const wallMs = Date.now() - t0;
  const err = (r.stderr || "") + (r.stdout || "");
  const fpsMatches = [...err.matchAll(/fps=\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const frameMatches = [...err.matchAll(/frame=\s*(\d+)/g)].map((m) => Number(m[1]));
  const real = /real\s+([\d.]+)/.exec(err)?.[1];
  const user = /user\s+([\d.]+)/.exec(err)?.[1];
  const sys = /sys\s+([\d.]+)/.exec(err)?.[1];
  const frames = frameMatches.length ? frameMatches[frameMatches.length - 1] : null;
  const row = {
    label,
    status: r.status,
    frames,
    fpsFfmpeg: fpsMatches.length ? fpsMatches[fpsMatches.length - 1] : null,
    realS: real ? Number(real) : null,
    userS: user ? Number(user) : null,
    sysS: sys ? Number(sys) : null,
    wallMs,
    loadBefore,
    loadAfter: loadAvg(),
  };
  if (row.realS && frames) row.fpsWall = +(frames / row.realS).toFixed(2);
  if (row.userS !== null && row.sysS !== null && frames) {
    const cpu = row.userS + row.sysS;
    row.cpuS = +cpu.toFixed(2);
    row.fpsCpu = +(frames / cpu).toFixed(2);
  }
  if (r.status !== 0) row.tail = err.slice(-400);
  log(`${label}: status=${r.status} frames=${frames} fps(ffmpeg)=${row.fpsFfmpeg} fpsWall=${row.fpsWall} fpsCpu=${row.fpsCpu} real=${row.realS}s cpu=${row.cpuS}s load ${loadBefore} → ${row.loadAfter}`);
  return row;
}

function stats(arr) {
  const xs = arr.filter((v) => typeof v === "number");
  if (!xs.length) return null;
  const mean = xs.reduce((a, v) => a + v, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, v) => a + (v - mean) ** 2, 0) / xs.length);
  return { mean: +mean.toFixed(2), min: Math.min(...xs), max: Math.max(...xs), std: +sd.toFixed(2), n: xs.length };
}

async function main() {
  const configs = [
    { key: "decode", label: "decode-only", mkArgs: (f) => `-i ${f} -an -f null -` },
    { key: "encode", label: "encode libx264 veryfast crf23", mkArgs: (f) => `-i ${f} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -an -f null -` },
    { key: "encode-denoise", label: "encode + hqdn3d=12:9:12:9 (denoise 0.5)", mkArgs: (f) => `-i ${f} -vf hqdn3d=12:9:12:9 -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -an -f null -` },
  ];
  const results = { frames: FRAMES, repeats: REPEATS, mediaDir: MEDIA_DIR, resolutions: {} };
  for (const res of ["720", "1080"]) {
    const file = path.join(MEDIA_DIR, res === "1080" ? "long1080.mp4" : "long720.mp4");
    if (!fs.existsSync(file)) { log(`BỎ QUA ${res}p: không thấy ${file}`); continue; }
    results.resolutions[res] = {};
    for (const cfg of configs) {
      const rows = [];
      for (let i = 1; i <= REPEATS; i++) {
        rows.push(runFfmpeg(`${res}p ${cfg.key} #${i}`, cfg.mkArgs(file)));
      }
      const ok = rows.filter((r) => r.status === 0 && r.frames === FRAMES);
      const agg = {
        nOk: ok.length,
        fpsWall: stats(ok.map((r) => r.fpsWall)),
        fpsCpu: stats(ok.map((r) => r.fpsCpu)),
        fpsFfmpeg: stats(ok.map((r) => r.fpsFfmpeg)),
        realS: stats(ok.map((r) => r.realS)),
        cpuS: stats(ok.map((r) => r.cpuS)),
      };
      results.resolutions[res][cfg.key] = { label: cfg.label, rows, aggregate: agg };
      log(`GỘP ${res}p ${cfg.key}: fpsWall mean ${agg.fpsWall?.mean} (min ${agg.fpsWall?.min} max ${agg.fpsWall?.max} std ${agg.fpsWall?.std}), fpsCpu mean ${agg.fpsCpu?.mean} (min ${agg.fpsCpu?.min} max ${agg.fpsCpu?.max} std ${agg.fpsCpu?.std})`);
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
  log(`đã ghi ${OUT}`);
}

main();
