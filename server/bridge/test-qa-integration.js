#!/usr/bin/env node
/**
 * test-qa-integration.js — Test tích hợp QA vào RenderJobService (R1-043)
 * mà không cần HTTP server (tránh tranh port với agent khác).
 *
 * Tạo RenderJobService thật với spawnJob chạy render worker THẬT,
 * enqueue 1 job render thật, chờ xong, kiểm tra job.qaReport.
 */
"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const { RenderJobService, newJobId } = require("./src/jobQueue");

const RENDER_JS = path.resolve(__dirname, "..", "render", "src", "render.js");

async function main() {
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "qa-int-"));
  const mediaDir = path.join(workRoot, "media");
  fs.mkdirSync(mediaDir, { recursive: true });

  // Media thật: 3s 1280x720 + audio
  const clipPath = path.join(mediaDir, "clip.mp4");
  const { execFileSync } = require("child_process");
  execFileSync("ffmpeg", ["-y", "-v", "error",
    "-f", "lavfi", "-i", "testsrc=duration=3:size=1280x720:rate=30",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", clipPath]);

  const spec = {
    version: "0.2.0",
    meta: { name: "QA integration", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", label: "V", clips: [
      { id: "c1", kind: "video", src: "clip.mp4", start: 0, in: 0, out: 3, duration: 3 },
    ]}],
  };
  const id = newJobId();
  const dir = path.join(workRoot, id);
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });
  fs.copyFileSync(clipPath, path.join(dir, "media", "clip.mp4"));
  const specPath = path.join(dir, "spec.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const outPath = path.join(dir, "output.mp4");

  const service = new RenderJobService({
    maxConcurrent: 1,
    ffprobeBin: "ffprobe",
    spawnJob(job) {
      return spawn(process.execPath,
        [RENDER_JS, "--spec", job.specPath, "--out", job.outPath,
         "--media-dir", job.mediaDir, "--ffmpeg", "ffmpeg", "--ffprobe", "ffprobe", "-y"],
        { cwd: path.dirname(RENDER_JS), stdio: ["ignore", "pipe", "pipe"], shell: false });
    },
  });

  const job = service.enqueue({ id, dir, mediaDir: path.join(dir, "media"), specPath, outPath, totalDuration: 3 });
  console.log("job enqueued:", job.id, "status:", job.status);

  // Chờ terminal
  let j;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    j = service.get(id);
    if (["done", "error", "cancelled"].includes(j.status)) break;
  }

  let pass = 0, fail = 0;
  const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✅ ${name}`); }
    else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
  };

  console.log("== kết quả ==");
  ok("job done", j.status === "done", "status=" + j.status + " error=" + j.error);
  ok("có qaReport", !!j.qaReport, JSON.stringify(j.error));
  if (j.qaReport) {
    const c = j.qaReport.checks;
    ok("5 checks", Object.keys(c).length === 5, Object.keys(c).join(","));
    ok("fileSize ok", c.fileSize && c.fileSize.ok);
    ok("videoCodec h264", c.videoCodec && c.videoCodec.ok && c.videoCodec.actual === "h264");
    ok("audioCodec aac", c.audioCodec && c.audioCodec.ok && c.audioCodec.actual === "aac");
    ok("duration 3s", c.duration && c.duration.ok && c.duration.actual === 3);
    ok("resolution 1280x720", c.resolution && c.resolution.ok);
  }

  // Dọn
  try { service.shutdown(); } catch {}
  fs.rmSync(workRoot, { recursive: true, force: true });

  console.log(`\n${fail === 0 ? "🎉" : "⚠️"} INTEGRATION TEST: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("crash:", e); process.exit(1); });
