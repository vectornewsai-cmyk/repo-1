#!/usr/bin/env node
/**
 * test_round72_z6_signal_log.js — Phase 9 đợt 72, luồng Z6:
 * đóng nợ đợt 67 §7 mục 6 (đợt 71 Y6 §5 mục 5) — log `r.signal` trong
 * server/render/src/render.js khi ffmpeg bị kill bởi signal.
 *
 * Bối cảnh: spawnSync trả status=null + signal="SIGSEGV" khi ffmpeg bị
 * kill bởi signal (vd crash vidstab, xem
 * docs/PHASE9_ROUND71_Y6_VIDSTAB_SEGFAULT_LIMITS.md). Trước đợt này
 * render.js chỉ in "ffmpeg thoát với mã null" nên không phân biệt được
 * SIGSEGV (crash) với SIGKILL (OOM-kill) hay SIGTERM. Sửa này chỉ thêm
 * log, KHÔNG đổi hành vi (vẫn exit 2, vẫn giữ file tạm để debug) và
 * KHÔNG đụng `copy` trước vidstabtransform (production giữ nguyên).
 *
 * Cách test (KHÔNG mock render.js — chạy thật bằng fake ffmpeg):
 * - Fake ffmpeg (shell script) trả lời đúng các probe của render.js
 *   (-version → dòng version, -filters → rỗng, nullsrc → exit 0 để
 *   tryEncode probe OK) và tự kill theo FAKE_FF_MODE khi tới lệnh
 *   encode thật (arg cuối là .mp4): segv / kill / exit1.
 * - 4 case lỗi + 1 case render thật bằng ffmpeg thật (không hồi quy
 *   đường thành công). Case GPU chạy với HOME trỏ vào thư mục tạm để
 *   clearGpuProbeCache() của nhánh fallback không xoá cache chung.
 *
 * Cách chạy: node server/render/src/test_round72_z6_signal_log.js
 * (cần ffmpeg + ffprobe thật trên PATH cho case 5 và để tạo clip).
 * File tạm nằm trong os.tmpdir(), tự dọn cuối test.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..");
const RENDER = path.join(__dirname, "render.js");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-z6-signal-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}

// --- Fake ffmpeg ---------------------------------------------------------
const fakeFfmpeg = path.join(work, "fake-ffmpeg.sh");
writeFileEpermRetry(fakeFfmpeg, `#!/bin/sh
# Fake ffmpeg cho test signal-log: probe thì trả lời như thật, encode thì
# tự kill theo FAKE_FF_MODE (segv | kill | exit1).
for a in "$@"; do
  case "$a" in
    -version) echo "ffmpeg version 8.1.2-fake"; exit 0 ;;
    -filters) exit 0 ;;
    *nullsrc*) exit 0 ;;
    *.mp4)
      case "$FAKE_FF_MODE" in
        segv) kill -SEGV $$ ;;
        kill) kill -KILL $$ ;;
        exit1) exit 1 ;;
        *) exit 1 ;;
      esac
      ;;
  esac
done
exit 1
`);
fs.chmodSync(fakeFfmpeg, 0o755);

// --- Clip thật (testsrc 320x240, 2s) cho spec tối thiểu ------------------
const clip = path.join(mediaDir, "clip1.mp4");
{
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi",
    "-i", "testsrc=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", clip],
    { stdio: ["ignore", "pipe", "pipe"] });
  if (r.status !== 0) {
    console.error(`❌ không tạo được clip test:\n${(r.stderr || "").toString()}`);
    process.exit(2);
  }
}

const spec = {
  version: "0.2.0",
  meta: { name: "z6-signal-test", width: 320, height: 240, fps: 30 },
  tracks: [{
    id: "v1", kind: "video", label: "Video chính",
    clips: [{ id: "c1", kind: "video", src: "clip1.mp4", in: 0, out: 2, duration: 2, start: 0 }],
  }],
};

function runRender(name, { ffmpeg, mode, extraArgs = [], useRealFfmpeg = false, home = null }) {
  const specPath = path.join(work, `${name}.json`);
  writeFileEpermRetry(specPath, JSON.stringify(spec));
  const outPath = path.join(work, `${name}.mp4`);
  const env = { ...process.env };
  if (mode) env.FAKE_FF_MODE = mode;
  if (home) env.HOME = home;
  // Tắt cache probe GPU đĩa để test không đọc/ghi cache chung.
  env.VCUT_GPU_PROBE_CACHE = "0";
  const args = [RENDER, "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "-y", "--ffmpeg", useRealFfmpeg ? "ffmpeg" : ffmpeg,
    ...extraArgs];
  const r = spawnSync("node", args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  return { status: r.status, signal: r.signal, stderr: (r.stderr || "").toString(), outPath };
}

// --- Case 1: encode bị SIGSEGV (libx264 mặc định) ------------------------
{
  const { status, stderr } = runRender("case-segv", { ffmpeg: fakeFfmpeg, mode: "segv" });
  ok(status === 2, `SIGSEGV: render.js exit 2 (được ${status})`);
  ok(stderr.includes("bị kill bởi signal SIGSEGV"), "SIGSEGV: stderr log đúng signal SIGSEGV");
  ok(stderr.includes("(status=null)"), "SIGSEGV: stderr ghi rõ status=null");
  ok(!stderr.includes("thoát với mã null"), "SIGSEGV: không còn in 'thoát với mã null'");
  ok(stderr.includes("PHASE9_ROUND71_Y6_VIDSTAB_SEGFAULT_LIMITS.md"),
    "SIGSEGV: có dòng gợi ý tài liệu vidstab");
}

// --- Case 2: encode bị SIGKILL (OOM-kill) --------------------------------
{
  const { status, stderr } = runRender("case-kill", { ffmpeg: fakeFfmpeg, mode: "kill" });
  ok(status === 2, `SIGKILL: render.js exit 2 (được ${status})`);
  ok(stderr.includes("bị kill bởi signal SIGKILL"), "SIGKILL: stderr log đúng signal SIGKILL");
  ok(!stderr.includes("PHASE9_ROUND71_Y6_VIDSTAB_SEGFAULT_LIMITS.md"),
    "SIGKILL: không có gợi ý vidstab (chỉ dành cho SIGSEGV)");
}

// --- Case 3: encode exit 1 bình thường (không signal) --------------------
{
  const { status, stderr } = runRender("case-exit1", { ffmpeg: fakeFfmpeg, mode: "exit1" });
  ok(status === 2, `exit 1: render.js exit 2 (được ${status})`);
  ok(stderr.includes("thoát với mã 1"), "exit 1: stderr vẫn in 'thoát với mã 1'");
  ok(!stderr.includes("bị kill bởi signal"), "exit 1: không log signal khi không bị kill");
}

// --- Case 4: GPU encoder ép tay + SIGSEGV → fallback warning có signal ---
{
  const fakeHome = path.join(work, "fake-home");
  fs.mkdirSync(fakeHome, { recursive: true });
  const { status, stderr } = runRender("case-gpu-segv",
    { ffmpeg: fakeFfmpeg, mode: "segv", extraArgs: ["--encoder", "h264_nvenc"], home: fakeHome });
  ok(status === 2, `GPU+SIGSEGV: render.js exit 2 (được ${status})`);
  ok(stderr.includes("encoder GPU h264_nvenc encode thất bại (bị kill bởi signal SIGSEGV"),
    "GPU+SIGSEGV: cảnh báo fallback log đúng signal");
  ok(stderr.includes("bị kill bởi signal SIGSEGV (status=null) — render thất bại"),
    "GPU+SIGSEGV: thông báo lỗi cuối (sau retry libx264) vẫn log signal");
}

// --- Case 5: render thật bằng ffmpeg thật (không hồi quy đường success) --
{
  const { status, stderr, outPath } = runRender("case-real", { useRealFfmpeg: true });
  ok(status === 0, `render thật: exit 0 (được ${status})`);
  ok(fs.existsSync(outPath) && fs.statSync(outPath).size > 0,
    `render thật: có file MP4 (${fs.existsSync(outPath) ? fs.statSync(outPath).size : 0} byte)`);
  ok(!stderr.includes("bị kill bởi signal") && !stderr.includes("thoát với mã"),
    "render thật: stderr không có thông báo lỗi/signal");
}

console.log(`\n== Z6 signal-log: ${pass} PASS, ${fail} FAIL (work=${work}) ==`);
fs.rmSync(work, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);
