/**
 * Test cho R1-065 (tiến trình export thời gian thực) trong jobQueue.js.
 * Chạy bằng: node test/test-progress.cjs  (không cần ffmpeg, không cần server)
 */
"use strict";

const { EventEmitter } = require("events");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  RenderJobService,
  parseFfmpegTime,
  parseFfmpegProgress,
  computeEta,
} = require("../src/jobQueue.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fakeProc() {
  const p = new EventEmitter();
  p.pid = 10000 + Math.floor(Math.random() * 50000);
  p.stderr = new EventEmitter();
  p.stdout = new EventEmitter();
  p.kill = () => true;
  return p;
}
function tmpWork() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vcut-prog-test-"));
}

async function main() {
  console.log("== [1] parseFfmpegProgress ==");
  {
    const r1 = parseFfmpegProgress("frame=  100 fps=30 time=00:00:03.42 bitrate=1.2");
    ok(r1.time === 3.42 && r1.frame === 100, "time + frame cùng dòng");
    const r2 = parseFfmpegProgress("frame=  250 fps=25 time=01:02:03.50 bitrate=1.2");
    ok(r2.time === 3723.5 && r2.frame === 250, "time giờ:phút:giây");
    const r3 = parseFfmpegProgress("frame=   42 fps=30 q=28.0 size= 100kB");
    ok(r3.time === null && r3.frame === 42, "dòng chỉ có frame= → time null");
    const r4 = parseFfmpegProgress("không có gì ở đây");
    ok(r4.time === null && r4.frame === null, "dòng thường → null/null");
    ok(parseFfmpegProgress("").time === null, "dòng rỗng");
    ok(parseFfmpegProgress(null).frame === null, "null input");
    // tương thích ngược
    ok(parseFfmpegTime("frame=  100 fps=30 time=00:00:03.42 bitrate=1.2") === 3.42,
      "parseFfmpegTime vẫn đúng");
  }

  console.log("== [2] progress đơn điệu + chuẩn hóa \\r ==");
  {
    let proc;
    const svc = new RenderJobService({
      enableQA: false,
      maxConcurrent: 1,
      spawnJob: () => (proc = fakeProc()),
    });
    const job = svc.enqueue({ dir: tmpWork(), totalDuration: 10 });
    // ffmpeg viết progress bằng \r (cùng 1 dòng) trong 1 chunk
    proc.stderr.emit("data", Buffer.from(
      "frame=  30 fps=30 time=00:00:01.00 bitrate=1\r" +
      "frame=  60 fps=30 time=00:00:02.00 bitrate=1\r" +
      "frame=  90 fps=30 time=00:00:03.00 bitrate=1\r"
    ));
    ok(Math.abs(job.progress - 0.3) < 1e-9, "lấy update mới nhất trong chunk (0.3)");
    // time đi lùi (không bao giờ xảy ra thật, nhưng phải đơn điệu)
    proc.stderr.emit("data", Buffer.from("frame=  10 fps=30 time=00:00:01.00 bitrate=1\n"));
    ok(Math.abs(job.progress - 0.3) < 1e-9, "progress không giảm khi time lùi");
    svc.shutdown();
  }

  console.log("== [3] frame= fallback khi thiếu time= ==");
  {
    let proc;
    const svc = new RenderJobService({
      enableQA: false,
      maxConcurrent: 1,
      spawnJob: () => (proc = fakeProc()),
    });
    const w = tmpWork();
    // spec có fps → fallback dùng được
    fs.writeFileSync(path.join(w, "spec.json"), JSON.stringify({
      meta: { name: "t", width: 640, height: 360, fps: 30 },
      tracks: [],
    }));
    const job = svc.enqueue({ dir: w, totalDuration: 10 });
    proc.stderr.emit("data", Buffer.from("frame=  150 fps=30 q=28.0 size= 100kB\n"));
    ok(Math.abs(job.progress - 0.5) < 1e-9, "150/(30*10) = 0.5 qua frame= fallback");
    svc.shutdown();
  }

  console.log("== [4] computeEta ==");
  {
    const job = { totalDuration: 10, _samples: [] };
    ok(computeEta(job) === null, "chưa có sample → null");
    const now = Date.now();
    // render 5s video trong 1s thật → tốc độ 5x → còn 5s video ≈ 1s thật
    job._samples = [
      { at: now - 1000, time: 0 },
      { at: now, time: 5 },
    ];
    const eta = computeEta(job);
    ok(eta !== null && Math.abs(eta - 1) < 0.3, `ETA ≈ 1s (nhận ${eta})`);
    // đã render xong → ETA 0
    job._samples = [
      { at: now - 1000, time: 8 },
      { at: now, time: 10 },
    ];
    ok(computeEta(job) === 0, "render xong → ETA 0");
    // tốc độ = 0 → null
    job._samples = [
      { at: now - 1000, time: 3 },
      { at: now, time: 3 },
    ];
    ok(computeEta(job) === null, "time đứng yên → null");
  }

  console.log("== [5] etaSeconds trên job record ==");
  {
    let proc;
    const svc = new RenderJobService({
      enableQA: false,
      maxConcurrent: 1,
      spawnJob: () => (proc = fakeProc()),
    });
    const job = svc.enqueue({ dir: tmpWork(), totalDuration: 10 });
    ok(job.etaSeconds === null, "ban đầu etaSeconds = null");
    proc.stderr.emit("data", Buffer.from("frame=  30 fps=30 time=00:00:01.00 bitrate=1\n"));
    await sleep(50);
    proc.stderr.emit("data", Buffer.from("frame=  60 fps=30 time=00:00:02.00 bitrate=1\n"));
    ok(typeof job.etaSeconds === "number" && job.etaSeconds >= 0,
      `sau 2 sample có ETA (${job.etaSeconds})`);
    // done → etaSeconds = 0
    fs.writeFileSync(path.join(job.dir, "output.mp4"), Buffer.alloc(100));
    proc.emit("close", 0, null);
    await sleep(20);
    ok(job.status === "done" && job.progress === 1 && job.etaSeconds === 0,
      "done → progress=1, etaSeconds=0");
    svc.shutdown();
  }

  console.log("");
  console.log("==========================================");
  if (fail === 0) console.log(`🎉 PROGRESS UNIT PASS: ${pass}/${pass + fail}`);
  else console.log(`💥 PROGRESS UNIT FAIL: ${pass} pass, ${fail} fail`);
  console.log("==========================================");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
