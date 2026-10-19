/**
 * Test cho server/bridge/src/jobQueue.js (R1-041).
 * Chạy bằng: node test/test-jobqueue.cjs   (không cần ffmpeg, không cần server)
 *
 * Dùng spawnJob giả để kiểm tra: FIFO, cancel (queued + running, kill thật
 * bằng process sleep), retry, recover, parseFfmpegTime.
 */
"use strict";

const { EventEmitter } = require("events");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const {
  RenderJobService,
  parseFfmpegTime,
  specDuration,
  isAlive,
} = require("../src/jobQueue.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fake ChildProcess: EventEmitter + pid giả + kill() ghi nhận. */
function fakeProc({ pid } = {}) {
  const p = new EventEmitter();
  p.pid = pid ?? (10000 + Math.floor(Math.random() * 50000));
  p.killedWith = null;
  p.stderr = new EventEmitter();
  p.stdout = new EventEmitter();
  p.kill = (sig) => { p.killedWith = sig || "SIGTERM"; return true; };
  return p;
}

function tmpWork() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vcut-jq-test-"));
}

async function main() {
  console.log("== [1] parseFfmpegTime ==");
  ok(parseFfmpegTime("frame=  100 fps=30 time=00:00:03.42 bitrate=1.2") === 3.42, "parse time=00:00:03.42");
  ok(parseFfmpegTime("frame=  100 fps=30 time=01:02:03.50 bitrate=1.2") === 3723.5, "parse time=01:02:03.50");
  ok(parseFfmpegTime("không có time ở đây") === null, "dòng thường → null");
  ok(parseFfmpegTime("") === null, "dòng rỗng → null");
  ok(parseFfmpegTime(null) === null, "null → null");

  console.log("== [2] specDuration ==");
  ok(specDuration({ meta: { duration: 7 } }) === 7, "meta.duration");
  ok(specDuration({ tracks: [{ clips: [{ start: 2, duration: 3 }] }] }) === 5, "max end của clip");
  ok(specDuration({}) === 0, "spec rỗng → 0");
  ok(specDuration(null) === 0, "null → 0");

  console.log("== [3] FIFO với maxConcurrent=1, 3 job chạy tuần tự ==");
  {
    const started = [];
    const procs = [];
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1,
      spawnJob: (job) => {
        started.push(job.id);
        const p = fakeProc();
        procs.push({ job, p });
        return p;
      },
    });
    const w = tmpWork();
    const j1 = svc.enqueue({ dir: w + "/a", totalDuration: 10 });
    const j2 = svc.enqueue({ dir: w + "/b", totalDuration: 10 });
    const j3 = svc.enqueue({ dir: w + "/c", totalDuration: 10 });
    ok(j1.status === "running", "job1 running ngay");
    ok(j2.status === "queued" && j2.queuePosition === 1, "job2 queued, position 1");
    ok(j3.status === "queued" && j3.queuePosition === 2, "job3 queued, position 2");
    ok(svc.runningCount() === 1 && svc.queuedCount() === 2, "1 running, 2 queued");
    ok(started.length === 1 && started[0] === j1.id, "chỉ job1 được spawn");

    // job1 xong → job2 chạy (giả lập output file)
    fs.mkdirSync(w + "/a", { recursive: true });
    fs.writeFileSync(w + "/a/output.mp4", Buffer.alloc(100));
    procs[0].p.emit("close", 0, null);
    await sleep(10);
    ok(j1.status === "done" && j1.progress === 1, "job1 done");
    ok(j2.status === "running", "job2 chạy tiếp");
    ok(j2.queuePosition === null, "job2 hết queuePosition khi running");
    ok(j3.queuePosition === 1, "job3 lên position 1");
    ok(started[1] === j2.id && started[2] === undefined, "thứ tự FIFO đúng");

    fs.mkdirSync(w + "/b", { recursive: true });
    fs.writeFileSync(w + "/b/output.mp4", Buffer.alloc(100));
    procs[1].p.emit("close", 0, null);
    await sleep(10);
    fs.mkdirSync(w + "/c", { recursive: true });
    fs.writeFileSync(w + "/c/output.mp4", Buffer.alloc(100));
    procs[2].p.emit("close", 0, null);
    await sleep(10);
    ok(j3.status === "done", "job3 done");
    ok(svc.list().length === 3, "list() có 3 job");
    ok(svc.list()[0].id === j3.id, "list() mới nhất trước");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [4] Progress từ stderr ==");
  {
    let proc;
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1,
      spawnJob: () => (proc = fakeProc()),
    });
    const job = svc.enqueue({ dir: tmpWork(), totalDuration: 10 });
    proc.stderr.emit("data", Buffer.from("frame= 10 time=00:00:02.50 bitrate=1\n"));
    ok(Math.abs(job.progress - 0.25) < 1e-9, "progress = 2.5/10 = 0.25");
    proc.stderr.emit("data", Buffer.from("frame= 10 time=00:00:30.00 bitrate=1\n"));
    ok(job.progress === 0.99, "progress clamp ở 0.99 khi vượt duration");
    svc.shutdown();
  }

  console.log("== [5] Cancel job queued (chưa chạy, xóa dir) ==");
  {
    const spawned = [];
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1,
      spawnJob: (job) => { spawned.push(job.id); return fakeProc(); },
    });
    const w = tmpWork();
    const d1 = path.join(w, "j1"); fs.mkdirSync(d1, { recursive: true });
    const d2 = path.join(w, "j2"); fs.mkdirSync(d2, { recursive: true });
    const j1 = svc.enqueue({ dir: d1, totalDuration: 5 });
    const j2 = svc.enqueue({ dir: d2, totalDuration: 5 });
    ok(svc.cancel(j2.id) === true, "cancel job queued → true");
    ok(j2.status === "cancelled", "job2 cancelled");
    ok(!fs.existsSync(d2), "thư mục job2 bị xóa");
    ok(svc.queuedCount() === 0, "hàng đợi trống");
    ok(spawned.length === 1 && spawned[0] === j1.id, "job2 không bao giờ được spawn");
    ok(svc.cancel(j2.id) === false, "cancel lần 2 → false");
    ok(svc.cancel("khong-ton-tai") === false, "cancel id lạ → false");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [6] Cancel job running → kill process THẬT (sleep) ==");
  {
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1,
      killGraceMs: 300,
      spawnJob: () =>
        spawn("sleep", ["30"], { detached: true, stdio: "ignore" }),
    });
    const w = tmpWork();
    const d = path.join(w, "j"); fs.mkdirSync(d, { recursive: true });
    const job = svc.enqueue({ dir: d, totalDuration: 5 });
    await sleep(300); // đợi sleep chạy
    const pid = job.proc && job.proc.pid;
    ok(typeof pid === "number" && isAlive(pid), `sleep đang chạy (pid=${pid})`);
    ok(svc.cancel(job.id) === true, "cancel → true");
    ok(job.status === "cancelled", "status cancelled");
    // đợi SIGTERM có hiệu lực
    let dead = false;
    for (let i = 0; i < 40 && !dead; i++) {
      await sleep(100);
      dead = !isAlive(pid);
    }
    ok(dead, "process sleep đã chết sau cancel (kill group, không mồ côi)");
    ok(!fs.existsSync(d), "thư mục job bị xóa sau cancel");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [7] Job lỗi → retry chạy lại ==");
  {
    const runs = [];
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1,
      spawnJob: (job) => {
        runs.push(job.id);
        const p = fakeProc();
        // lần 1: lỗi; lần 2: thành công
        setImmediate(() => {
          if (runs.length === 1) p.emit("error", new Error("ffmpeg crash giả lập"));
          else {
            fs.mkdirSync(job.dir, { recursive: true });
            fs.writeFileSync(path.join(job.dir, "output.mp4"), Buffer.alloc(50));
            p.emit("close", 0, null);
          }
        });
        return p;
      },
    });
    const w = tmpWork();
    const d = path.join(w, "j"); fs.mkdirSync(d, { recursive: true });
    const job = svc.enqueue({ dir: d, specPath: path.join(d, "spec.json"), outPath: path.join(d, "output.mp4"), totalDuration: 5 });
    fs.writeFileSync(path.join(d, "spec.json"), "{}");
    await sleep(50);
    ok(job.status === "error", "job lỗi sau lần chạy 1");
    ok(job.attempts === 1, "attempts = 1");
    ok(/ffmpeg crash/.test(job.error), "error message rõ ràng");
    ok(fs.existsSync(d), "thư mục job còn nguyên sau lỗi (để debug + retry)");

    const r = svc.retry(job.id);
    // slot đang trống → service start ngay (running) hoặc vẫn queued;
    // cả hai đều đúng, quan trọng là job được chạy lại.
    ok(r.status === "queued" || r.status === "running", "retry → queued/running");
    await sleep(50);
    ok(job.status === "done", "lần 2 thành công → done");
    ok(job.attempts === 2, "attempts = 2");
    ok(job.error === null, "error được reset");

    // retry từ done → từ chối
    let threw = null;
    try { svc.retry(job.id); } catch (e) { threw = e; }
    ok(threw && threw.code === "BAD_STATE", "retry từ done → BAD_STATE");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [8] Retry sau cancel → từ chối (dir đã xóa) ==");
  {
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1,
      spawnJob: () => fakeProc(),
    });
    const w = tmpWork();
    const d = path.join(w, "j"); fs.mkdirSync(d, { recursive: true });
    const job = svc.enqueue({ dir: d, totalDuration: 5 }); // running ngay
    svc.cancel(job.id);
    let threw = null;
    try { svc.retry(job.id); } catch (e) { threw = e; }
    ok(threw && threw.code === "BAD_STATE", "retry sau cancel → BAD_STATE (dir đã xóa)");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [9] recover() sau restart ==");
  {
    const w = tmpWork();
    // job A: còn spec.json + media → phục hồi
    const da = path.join(w, "aaa"); fs.mkdirSync(path.join(da, "media"), { recursive: true });
    fs.writeFileSync(path.join(da, "spec.json"),
      JSON.stringify({ meta: { duration: 4 }, tracks: [] }));
    // job B: có output.mp4 dở dang → vẫn phục hồi (xóa output cũ, render lại)
    const db = path.join(w, "bbb"); fs.mkdirSync(path.join(db, "media"), { recursive: true });
    fs.writeFileSync(path.join(db, "spec.json"),
      JSON.stringify({ tracks: [{ clips: [{ start: 0, duration: 2 }] }] }));
    fs.writeFileSync(path.join(db, "output.mp4"), Buffer.alloc(10));
    // dir C: không có spec.json → bỏ qua
    fs.mkdirSync(path.join(w, "ccc"), { recursive: true });

    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 2,
      spawnJob: () => { const p = fakeProc(); setImmediate(() => p.emit("close", 1, null)); return p; },
    });
    const n = svc.recover(w);
    ok(n === 2, "phục hồi 2 job (bỏ qua dir không có spec.json)");
    const rec = svc.list().filter((j) => j.recovered);
    ok(rec.length === 2, "cờ recovered=true");
    ok(!fs.existsSync(path.join(db, "output.mp4")), "output.mp4 dở dang bị xóa trước khi render lại");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [10] Hàng đợi đầy → QUEUE_FULL ==");
  {
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1, maxQueueLength: 1,
      spawnJob: () => fakeProc(),
    });
    svc.enqueue({ dir: tmpWork(), totalDuration: 1 }); // running
    svc.enqueue({ dir: tmpWork(), totalDuration: 1 }); // queued (đầy)
    let threw = null;
    try { svc.enqueue({ dir: tmpWork(), totalDuration: 1 }); } catch (e) { threw = e; }
    ok(threw && threw.code === "QUEUE_FULL", "enqueue thứ 3 → QUEUE_FULL");
    svc.shutdown();
  }

  console.log("== [11] enqueue với id do caller cấp ==");
  {
    const svc = new RenderJobService({
      enableQA: false, // unit test: không chạy ffprobe QA
      maxConcurrent: 1,
      spawnJob: () => fakeProc(),
    });
    const job = svc.enqueue({ id: "abcdef1234567890", dir: tmpWork(), totalDuration: 1 });
    ok(job.id === "abcdef1234567890", "dùng id caller cấp");
    let threw = null;
    try { svc.enqueue({ id: "khong-hop-le", dir: tmpWork(), totalDuration: 1 }); }
    catch (e) { threw = e; }
    ok(threw && threw.code === "BAD_ID", "id sai format → BAD_ID");
    svc.shutdown();
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test crash:", e);
  process.exit(1);
});
