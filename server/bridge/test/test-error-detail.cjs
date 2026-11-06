/**
 * Test cho Phase 9 đợt 28 luồng L3: bridge hết mù với CLI/MCP.
 * Chạy bằng: node server/bridge/test/test-error-detail.cjs
 * (không cần ffmpeg, không cần server thật, không cần network)
 *
 * Bao phủ 4 trường hợp bắt buộc của luồng:
 *  (a) project speed-curve vi phạm qua đường bridge (fake proc) nhận được
 *      thông báo nêu rõ clip/keyframe/giá trị, không còn mù;
 *  (b) redact thật sự xóa đường dẫn tuyệt đối + home dir + token trong
 *      stderr mẫu độc hại;
 *  (c) lỗi ffmpeg thông thường vẫn truyền được dòng cuối có ích;
 *  (d) hành vi cũ của ExportPanel qua bridge không hồi quy: job.error
 *      giữ nguyên chuỗi cũ, và publicJob mặc định KHÔNG kèm errorDetail
 *      (chỉ ?detail=1 mới kèm).
 *
 * Test chỉ in nhãn pass/fail, KHÔNG in lại giá trị secret mẫu.
 */
"use strict";

const { EventEmitter } = require("events");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  redactStderr,
  buildErrorDetail,
  formatErrorDetail,
} = require("../src/errorDetail.js");
const { publicJob } = require("../src/publicJob.js");
const { RenderJobService } = require("../src/jobQueue.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Stderr mẫu độc hại: đường dẫn tuyệt đối, home dir, token, stack trace. */
const MALICIOUS_STDERR = [
  "ffmpeg version 6.0",
  "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from \"/home/tranhai/projects/secret/clip.mp4\":",
  "  Duration: 00:00:03.00",
  "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signaturehere",
  "api_key=sk-abcdefghijklmnop1234567890",
  "token: ghp_abcdefghijklmnopqrstuvwx",
  "C:\\Users\\TranHai\\Documents\\secret.mp4 not found",
  "    at validateSpec (/home/tranhai/workspace/repo-1/server/render/src/validate.js:123:45)",
  "❌ Spec không hợp lệ (1 lỗi):",
  "  1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)",
].join("\n");

/** Stderr đúng như đợt 27 K2 ghi nhận từ render worker thật. */
const CURVE_STDERR =
  "❌ Spec không hợp lệ (1 lỗi):\n" +
  "  1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)\n";

const FFMPEG_STDERR = [
  "ffmpeg version 6.0 Copyright (c) 2000-2023 the FFmpeg developers",
  "Input #0, mp4, from \"/home/tranhai/media/input.mp4\":",
  "  Duration: 00:00:05.00, start: 0.000000, bitrate: 1200 kb/s",
  "[libx264 @ 0x55a1] Invalid argument",
  "Error opening output file /tmp/vcut-out/final.mp4.",
  "Error opening output file /tmp/vcut-out/final.mp4.",
].join("\n");

function fakeProc() {
  const p = new EventEmitter();
  p.pid = 10000 + Math.floor(Math.random() * 50000);
  p.stderr = new EventEmitter();
  p.stdout = new EventEmitter();
  p.kill = () => true;
  return p;
}

async function main() {
  console.log("== [b] redact stderr mẫu độc hại ==");
  {
    const red = redactStderr(MALICIOUS_STDERR);
    ok(!red.includes("/home/tranhai"), "không còn /home/tranhai");
    ok(!red.includes("tranhai"), "không còn tên user tranhai");
    ok(!red.includes("eyJhbGci"), "không còn bearer token mẫu");
    ok(!red.includes("sk-abcdefghijklmnop"), "không còn sk- token mẫu");
    ok(!red.includes("ghp_abcdefghijklmnop"), "không còn ghp_ token mẫu");
    ok(!red.includes("/workspace/repo-1"), "không còn đường dẫn repo nội bộ");
    ok(!red.includes("validate.js:123"), "dòng stack trace đã bị bỏ");
    ok(!red.includes("C:\\Users"), "không còn đường dẫn Windows Users");
    ok(!red.includes("/projects/secret"), "không còn cây thư mục sau home");
    ok(red.includes("<path>/clip.mp4"), "basename clip.mp4 còn lại để nhận diện file");
    ok(red.includes("<path>/secret.mp4"), "basename secret.mp4 còn lại");
    ok(red.includes("speedKeyframes.keyframes[0].v"), "dòng validator không bị redact oan");
    ok(redactStderr(red) === red, "redact lũy đẳng");
  }

  console.log("== [a] phân loại vi phạm speed-curve ==");
  {
    const d = buildErrorDetail({ stderr: CURVE_STDERR, exitCode: 1 });
    ok(d.code === "SPEED_CURVE_VIOLATION", "code = SPEED_CURVE_VIOLATION");
    ok(d.summary.includes("tracks[0].clips[0]"), "summary nêu đường dẫn clip");
    ok(d.summary.includes("keyframes[0]"), "summary nêu keyframe");
    ok(d.summary.includes("5"), "summary nêu giá trị vi phạm 5");
    ok(d.details.some((l) => l.includes("0.25..4")), "details nêu khoảng cho phép");
    ok(!d.redactedTail.includes("/home/"), "redactedTail không có đường dẫn tuyệt đối");
    const formatted = formatErrorDetail(d);
    ok(formatted.includes("[SPEED_CURVE_VIOLATION]"), "format in mã code");
    ok(formatted.includes("tracks[0].clips[0]"), "format nêu clip nguyên văn");
    ok(formatted.includes("keyframes[0]"), "format nêu keyframe nguyên văn");
  }

  console.log("== [a2] vi phạm curve lẫn trong stderr độc hại vẫn phân loại đúng ==");
  {
    const d = buildErrorDetail({ stderr: MALICIOUS_STDERR, exitCode: 1 });
    ok(d.code === "SPEED_CURVE_VIOLATION", "stderr độc hại + curve → SPEED_CURVE_VIOLATION");
    ok(!JSON.stringify(d).includes("/home/tranhai"), "toàn bộ detail không còn home mẫu");
    ok(!JSON.stringify(d).includes("sk-abcdefghijklmnop"), "toàn bộ detail không còn token mẫu");
  }

  console.log("== [c] lỗi ffmpeg thông thường ==");
  {
    const d = buildErrorDetail({ stderr: FFMPEG_STDERR, exitCode: 1 });
    ok(d.code === "FFMPEG_ERROR", "code = FFMPEG_ERROR");
    ok(d.details.some((l) => /Invalid argument|Error opening output/.test(l)),
      "details giữ dòng ffmpeg có ích cuối");
    ok(!d.redactedTail.includes("/home/tranhai"), "redactedTail không còn home");
    ok(!d.redactedTail.includes("/tmp/vcut-out"), "redactedTail không còn /tmp/vcut-out");
    ok(d.redactedTail.includes("<path>/final.mp4"), "basename output còn lại");
  }

  console.log("== [c2] spec chung + asset thiếu + QA + spawn ==");
  {
    const spec = buildErrorDetail({
      stderr: "❌ Spec không hợp lệ (2 lỗi):\n  1. [tracks[0]] meta.fps phải > 0 (nhận được: 0)\n",
      exitCode: 1,
    });
    ok(spec.code === "SPEC_VALIDATION", "spec chung → SPEC_VALIDATION");
    const asset = buildErrorDetail({
      stderr: "[tracks[1].clips[0]] không tìm thấy asset \"intro.mp4\": file không tồn tại\n",
      exitCode: 1,
    });
    ok(asset.code === "MISSING_ASSET", "asset thiếu → MISSING_ASSET");
    ok(asset.summary.includes("intro.mp4"), "summary asset nêu tên asset");
    const qa = buildErrorDetail({
      message: "Kiểm tra chất lượng output thất bại: duration lệch (file lỗi đã bị giữ lại, không trả cho người dùng)",
    });
    ok(qa.code === "OUTPUT_QA", "QA fail → OUTPUT_QA");
    ok(!qa.summary.includes("file lỗi đã bị giữ lại"), "summary QA đã lược hậu tố nội bộ");
    const spawn = buildErrorDetail({ message: "Lỗi spawn render worker: ffmpeg crash giả lập" });
    ok(spawn.code === "WORKER_START", "spawn lỗi → WORKER_START");
    ok(/ffmpeg crash/.test(spawn.summary), "summary spawn giữ nguyên thông báo gốc");
    const generic = buildErrorDetail({ stderr: "", exitCode: 3 });
    ok(generic.code === "WORKER_EXIT", "exit code lạ không stderr → WORKER_EXIT");
  }

  console.log("== [a+d] jobQueue fake proc: bridge hết mù, error cũ không đổi ==");
  {
    let proc;
    const svc = new RenderJobService({
      enableQA: false,
      maxConcurrent: 1,
      spawnJob: () => (proc = fakeProc()),
    });
    const w = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-err-test-"));
    const d = path.join(w, "j");
    fs.mkdirSync(d, { recursive: true });
    const job = svc.enqueue({ dir: d, totalDuration: 5 });
    proc.stderr.emit("data", Buffer.from(MALICIOUS_STDERR));
    proc.emit("close", 1, null);
    await sleep(20);
    ok(job.status === "error", "job error sau close 1");
    ok(job.error === "Render worker thoát với mã 1.",
      "job.error GIỮ NGUYÊN chuỗi cũ (ExportPanel không hồi quy)");
    ok(job.errorCode === "SPEED_CURVE_VIOLATION", "job.errorCode = SPEED_CURVE_VIOLATION");
    ok(job.errorDetail && job.errorDetail.summary.includes("tracks[0].clips[0]"),
      "job.errorDetail.summary nêu clip");
    ok(job.errorDetail && job.errorDetail.summary.includes("keyframes[0]"),
      "job.errorDetail.summary nêu keyframe");
    ok(job.errorDetail && job.errorDetail.summary.includes("5"),
      "job.errorDetail.summary nêu giá trị 5");
    ok(!JSON.stringify(job.errorDetail).includes("/home/tranhai"),
      "job.errorDetail không leak home mẫu");
    ok(!JSON.stringify(job.errorDetail).includes("sk-abcdefghijklmnop"),
      "job.errorDetail không leak token mẫu");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [d] publicJob opt-in: mặc định không detail, ?detail=1 mới có ==");
  {
    const job = {
      id: "abcdef1234567890",
      status: "error",
      progress: 0,
      etaSeconds: null,
      queuePosition: null,
      attempts: 1,
      error: "Render worker thoát với mã 1.",
      errorCode: "SPEED_CURVE_VIOLATION",
      errorDetail: {
        code: "SPEED_CURVE_VIOLATION",
        summary: "Vi phạm speed-curve: 1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)",
        details: ["1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)"],
        detailsOmitted: 0,
        redactedTail: "<path>/clip.mp4",
      },
      outputName: null,
      outputSize: null,
      createdAt: 1,
      startedAt: 1,
      finishedAt: 2,
      recovered: false,
      note: null,
      qaReport: null,
    };
    const def = publicJob(job);
    ok(!("errorDetail" in def), "publicJob mặc định KHÔNG có errorDetail");
    ok(def.error === "Render worker thoát với mã 1.", "publicJob mặc định error cũ nguyên vẹn");
    ok(def.errorCode === "SPEED_CURVE_VIOLATION", "publicJob mặc định vẫn có errorCode (enum an toàn)");
    ok(!("errorDetail" in publicJob(job, false)), "publicJob(false) cũng không có errorDetail");
    const det = publicJob(job, true);
    ok(det.errorDetail && det.errorDetail.code === "SPEED_CURVE_VIOLATION",
      "publicJob(true) kèm errorDetail");
    ok(det.errorDetail.summary.includes("keyframes[0]"),
      "errorDetail opt-in nêu keyframe nguyên văn");
    ok(publicJob(null) === null, "publicJob(null) → null");
    const noDetail = publicJob({ ...job, errorDetail: null }, true);
    ok(!("errorDetail" in noDetail), "job không có detail thì opt-in cũng không bịa field");
  }

  console.log("== [d2] retry xóa lỗi có cấu trúc cũ ==");
  {
    let proc;
    const svc = new RenderJobService({
      enableQA: false,
      maxConcurrent: 1,
      spawnJob: () => (proc = fakeProc()),
    });
    const w = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-err-test-"));
    const d = path.join(w, "j");
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "spec.json"), "{}"); // retry yêu cầu spec còn tồn tại
    const job = svc.enqueue({ dir: d, totalDuration: 5 });
    proc.stderr.emit("data", Buffer.from(CURVE_STDERR));
    proc.emit("close", 1, null);
    await sleep(20);
    ok(job.errorCode === "SPEED_CURVE_VIOLATION", "trước retry có errorCode");
    svc.retry(job.id);
    ok(job.error === null && job.errorCode === null && job.errorDetail === null,
      "retry reset error/errorCode/errorDetail");
    svc.shutdown();
    fs.rmSync(w, { recursive: true, force: true });
  }

  console.log("== [e] Đợt 34 Q4: contract mới summaryKey + summaryParams (additive) ==");
  {
    const d = buildErrorDetail({ stderr: CURVE_STDERR, exitCode: 1 });
    ok(d.summaryKey === "speedCurveViolation", "curve → summaryKey = speedCurveViolation");
    ok(d.summaryParams &&
      d.summaryParams.clip === "tracks[0].clips[0]" &&
      d.summaryParams.field === "speedKeyframes.keyframes[0].v" &&
      d.summaryParams.range === "0.25..4" &&
      d.summaryParams.value === "5",
      "curve → summaryParams clip/field/range/value đúng");
    ok(d.summary.includes("tracks[0].clips[0]") && d.summary.includes("5"),
      "summary cũ KHÔNG đổi khi thêm field mới (tương thích consumer cũ)");
    const sig = buildErrorDetail({ stderr: "", signal: "SIGKILL" });
    ok(sig.summaryKey === "workerExitSignal" && sig.summaryParams.signal === "SIGKILL",
      "signal → workerExitSignal + param signal");
    const code = buildErrorDetail({ stderr: "", exitCode: 3 });
    ok(code.summaryKey === "workerExitCode" && code.summaryParams.exitCode === "3",
      "exit code → workerExitCode + param exitCode (string)");
    ok(Object.values(d.summaryParams).every((v) => typeof v === "string"),
      "mọi summaryParam đều là string");
    const formatted = formatErrorDetail(d);
    ok(formatted.includes("[SPEED_CURVE_VIOLATION]") && !formatted.includes("summaryKey"),
      "formatErrorDetail cũ bỏ qua field mới, output không đổi dạng");
    const pub = publicJob({
      id: "abcdef1234567890", status: "error", progress: 0, etaSeconds: null,
      queuePosition: null, attempts: 1, error: "Render worker thoát với mã 1.",
      errorCode: d.code, errorDetail: d, outputName: null, outputSize: null,
      createdAt: 1, startedAt: 1, finishedAt: 2, recovered: false, note: null, qaReport: null,
    }, true);
    ok(pub.errorDetail.summaryKey === "speedCurveViolation" &&
      pub.errorDetail.summaryParams.value === "5",
      "publicJob(true) lộ nguyên summaryKey/summaryParams");
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test crash:", e);
  process.exit(1);
});
