#!/usr/bin/env node
/**
 * test-qa-failpath.js — Test nhánh QA-fail trong RenderJobService (R1-043).
 *
 * spawnJob GIẢ: ghi 1 file MP4 bị cụt (thay vì render thật) rồi thoát mã 0.
 * Kỳ vọng: job → error, message bắt đầu bằng "Kiểm tra chất lượng output
 * thất bại", qaReport có mặt, và file lỗi KHÔNG bị xóa ngay (giữ để debug).
 */
"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");
const { EventEmitter } = require("events");

const { RenderJobService, newJobId } = require("./src/jobQueue");

async function main() {
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "qa-fail-"));
  const id = newJobId();
  const dir = path.join(workRoot, id);
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });
  const specPath = path.join(dir, "spec.json");
  fs.writeFileSync(specPath, JSON.stringify({
    version: "0.2.0",
    meta: { name: "fail", width: 1280, height: 720, fps: 30 },
    tracks: [],
  }));
  const outPath = path.join(dir, "output.mp4");

  // Fake proc: ghi file cụt (nửa header mp4) rồi emit close 0
  const fakeSpawn = (job) => {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => true;
    setImmediate(() => {
      // Ghi vài byte không phải mp4 hợp lệ → ffprobe fail
      fs.writeFileSync(job.outPath, Buffer.from("NOT_A_VALID_MP4_FILE_______"));
      proc.emit("close", 0, null);
    });
    return proc;
  };

  const service = new RenderJobService({
    maxConcurrent: 1,
    ffprobeBin: "ffprobe",
    spawnJob: fakeSpawn,
  });

  service.enqueue({ id, dir, mediaDir: path.join(dir, "media"), specPath, outPath, totalDuration: 5 });

  let j;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    j = service.get(id);
    if (["done", "error", "cancelled"].includes(j.status)) break;
  }

  let pass = 0, fail = 0;
  const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✅ ${name}`); }
    else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
  };

  console.log("== kết quả ==");
  ok("job error (không phải done)", j.status === "error", "status=" + j.status);
  ok("message nêu QA thất bại",
    typeof j.error === "string" && j.error.startsWith("Kiểm tra chất lượng output thất bại"),
    j.error);
  ok("có qaReport", !!j.qaReport);
  ok("qaReport.ok === false", j.qaReport && j.qaReport.ok === false);
  ok("file lỗi vẫn còn (giữ để debug)", fs.existsSync(outPath));
  // Mô phỏng logic download endpoint: chỉ phục vụ khi done
  const downloadAllowed = j.status === "done" && fs.existsSync(outPath);
  ok("download bị từ chối (status != done)", downloadAllowed === false);

  try { service.shutdown(); } catch {}
  fs.rmSync(workRoot, { recursive: true, force: true });

  console.log(`\n${fail === 0 ? "🎉" : "⚠️"} FAIL-PATH TEST: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("crash:", e); process.exit(1); });
