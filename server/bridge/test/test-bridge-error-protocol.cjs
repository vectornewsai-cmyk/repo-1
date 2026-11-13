/**
 * Test cho Phase 9 đợt 62 luồng R5: giao thức mã lỗi bridge→web.
 * Chạy bằng: node server/bridge/test/test-bridge-error-protocol.cjs
 * (không cần ffmpeg, không cần server thật, không cần network)
 *
 * Bao phủ:
 *  (a) errorCodes.js: catalog 102 mã (91 đợt 62 R5 + 11 TASK_* đợt 63
 *      R5), apiError/apiErrorFrom/codedError (shape
 *      { error, errorCode, errorParams? }, message cũ giữ nguyên,
 *      param ép về string, Error không code thì không bịa mã);
 *  (b) validator throw mã đúng + message cũ giữ nguyên từng chữ
 *      (caption/reframe/tts/bgremove/silence/scene);
 *  (c) jobQueue: QUEUE_FULL kèm params, retry NOT_FOUND/BAD_STATE
 *      (kèm params.status, phân biệt cancelled)/GONE, recover() gắn
 *      errorCode cho job phục hồi sau restart;
 *  (d) publicJob luôn kèm errorCode (kể cả mã restore) + noteCode.
 *  (e) Đợt 63 R5: taskErrorPayload — fallback TASK_* chỉ khi error
 *      không có message thật; message thật (phân loại được hay không)
 *      giữ nguyên code/error; buildTaskError ném → nhánh catch dùng
 *      fallback; recover gắn noteCode JOB_RECOVERED_RESTART, retry xóa.
 *
 * HTTP end-to-end (bridge thật) nằm ở test-bridge-error-protocol-e2e.cjs.
 */
"use strict";

const { EventEmitter } = require("events");
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");

const {
  BRIDGE_ERROR_CODES,
  BRIDGE_ERROR_CODE_LIST,
  isBridgeErrorCode,
  apiError,
  apiErrorFrom,
  codedError,
} = require("../src/errorCodes.js");
const { validateLang, validateTranslateTarget } = require("../src/caption.js");
const { validateAspect } = require("../src/reframe.js");
const { validateText, validateVoice, validateRefAudio } = require("../src/tts.js");
const { validateSession, validateTemporal, validateFeather } = require("../src/bgremove.js");
const { validateNoiseDb, validateMinDur } = require("../src/silence.js");
const { validateThreshold, validateRange } = require("../src/scene.js");
const { RenderJobService } = require("../src/jobQueue.js");
const { taskErrorPayload } = require("../src/taskError.js"); // Đợt 63 R5
const { publicJob } = require("../src/publicJob.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
function eq(a, b, label) {
  ok(a === b, `${label} (nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)})`);
}
function throwsCode(fn, code, label) {
  try {
    fn();
    ok(false, `${label} (không throw)`);
  } catch (e) {
    eq(e.code, code, `${label}: code`);
    ok(e instanceof Error, `${label}: là Error`);
  }
}

function tmpWork() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r62r5-"));
}
/** Fake ChildProcess: không bao giờ thoát (giữ job ở running/queued). */
function fakeProc() {
  const p = new EventEmitter();
  p.pid = 10000 + Math.floor(Math.random() * 50000);
  p.stderr = new EventEmitter();
  p.stdout = new EventEmitter();
  p.kill = () => true;
  return p;
}

async function main() {
  console.log("== [1] errorCodes: catalog + helpers ==");
  eq(BRIDGE_ERROR_CODE_LIST.length, 108, "catalog có 108 mã (91 + 11 TASK_* + 6 TTS_CLONED_VOICE_* đợt 84 L8)");
  eq(new Set(BRIDGE_ERROR_CODE_LIST).size, 108, "không trùng mã");
  ok(isBridgeErrorCode("JOB_NOT_FOUND"), "isBridgeErrorCode nhận mã catalog");
  for (const code of ["TASK_CAPTION_FAILED", "TASK_REFRAME_FAILED", "TASK_REFRAME_ANALYZE_FAILED", "TASK_BEATS_FAILED", "TASK_BGREMOVE_FAILED", "TASK_SILENCE_FAILED", "TASK_SCENE_FAILED", "TASK_TRANSLATE_FAILED", "TASK_TTS_FAILED", "TASK_TTS_CLONE_FAILED", "TASK_PROXY_FAILED"]) {
    ok(isBridgeErrorCode(code), `TASK_* trong catalog: ${code}`);
  }
  ok(!isBridgeErrorCode("UNKNOWN"), "UNKNOWN (mã render) không thuộc catalog bridge");
  ok(!isBridgeErrorCode("NOT_FOUND"), "NOT_FOUND (mã jobQueue nội bộ) không thuộc catalog bridge");
  ok(!isBridgeErrorCode(undefined), "isBridgeErrorCode(undefined) false");
  const b1 = apiError("RATE_LIMITED", "Quá nhiều request — thử lại sau 42s.", { retryAfter: 42 });
  eq(b1.error, "Quá nhiều request — thử lại sau 42s.", "apiError giữ message cũ");
  eq(b1.errorCode, "RATE_LIMITED", "apiError code");
  eq(b1.errorParams.retryAfter, "42", "apiError ép param số về string");
  const b2 = apiError("JOB_NOT_FOUND", "Không tìm thấy job.");
  eq(b2.errorCode, "JOB_NOT_FOUND", "apiError không param");
  ok(!("errorParams" in b2), "apiError không kèm errorParams rỗng");
  const b3 = apiError("JOB_NOT_FOUND", "x", { a: null, b: undefined, c: "v" });
  eq(JSON.stringify(b3.errorParams), JSON.stringify({ c: "v" }), "apiError bỏ param null/undefined");
  const coded = codedError("UNSUPPORTED_LANG", "Ngôn ngữ không hỗ trợ.", { lang: "xx" });
  eq(coded.message, "Ngôn ngữ không hỗ trợ.", "codedError giữ message");
  eq(coded.code, "UNSUPPORTED_LANG", "codedError gắn code");
  eq(coded.params.lang, "xx", "codedError gắn params");
  const fromCoded = apiErrorFrom(coded);
  eq(fromCoded.errorCode, "UNSUPPORTED_LANG", "apiErrorFrom lấy code từ Error");
  eq(fromCoded.error, "Ngôn ngữ không hỗ trợ.", "apiErrorFrom giữ message");
  const plain = new Error("Lỗi thường không mã.");
  eq(apiErrorFrom(plain).errorCode, undefined, "apiErrorFrom: Error không code thì không bịa mã");
  eq(apiErrorFrom(plain).error, "Lỗi thường không mã.", "apiErrorFrom: giữ message gốc");
  const parsed = apiErrorFrom(new SyntaxError("Unexpected token"), "assetMap không hợp lệ: Unexpected token", "ASSETMAP_INVALID", { detail: "Unexpected token" });
  eq(parsed.errorCode, "ASSETMAP_INVALID", "apiErrorFrom: fallback code khi Error không mã");
  eq(parsed.errorParams.detail, "Unexpected token", "apiErrorFrom: fallback params");
  eq(apiErrorFrom(new Error("x"), undefined, "NO_SUCH_CODE").errorCode, undefined, "apiErrorFrom: fallback code lạ thì không dùng");

  console.log("== [2] validator: mã đúng + message cũ nguyên vẹn ==");
  throwsCode(() => validateLang("xx"), "UNSUPPORTED_LANG", "validateLang(xx)");
  try { validateLang("xx"); } catch (e) {
    eq(e.message, 'Ngôn ngữ không hỗ trợ: "xx". Chọn một trong: vi, en, auto, zh, ja, ko, th, id, ms, fr, de, es.', "validateLang message cũ");
    eq(e.params.lang, "xx", "validateLang params.lang");
    ok(String(e.params.langs).includes("vi"), "validateLang params.langs");
  }
  throwsCode(() => validateTranslateTarget("vi"), "UNSUPPORTED_TARGET_LANG", "validateTranslateTarget(vi)");
  try { validateTranslateTarget("vi"); } catch (e) {
    eq(e.message, 'Ngôn ngữ đích chưa hỗ trợ: "vi". Hiện chỉ hỗ trợ: en (giới hạn của faster-whisper translate task).', "validateTranslateTarget message cũ");
  }
  throwsCode(() => validateAspect("16:9"), "UNSUPPORTED_ASPECT", "validateAspect(16:9)");
  try { validateAspect("16:9"); } catch (e) {
    eq(e.message, 'Tỉ lệ không hỗ trợ: "16:9". Chọn một trong: 9:16, 1:1, 4:5.', "validateAspect message cũ");
  }
  throwsCode(() => validateText(""), "TTS_TEXT_EMPTY", "validateText rỗng");
  throwsCode(() => validateText("x".repeat(5001)), "TTS_TEXT_TOO_LONG", "validateText quá dài");
  try { validateText("x".repeat(5001)); } catch (e) {
    eq(e.params.length, "5001", "validateText params.length");
    eq(e.params.max, "5000", "validateText params.max");
  }
  throwsCode(() => validateVoice("Nope"), "UNSUPPORTED_VOICE", "validateVoice(Nope)");
  throwsCode(() => validateRefAudio(null), "TTS_REF_AUDIO_MISSING", "validateRefAudio(null)");
  throwsCode(() => validateRefAudio({ path: "/tmp/x.wav", size: 21 * 1024 * 1024, originalname: "x.wav" }), "TTS_REF_AUDIO_TOO_LARGE", "validateRefAudio quá lớn");
  throwsCode(() => validateRefAudio({ path: "/tmp/x.txt", size: 100, originalname: "x.txt" }), "TTS_REF_AUDIO_TYPE", "validateRefAudio sai loại");
  throwsCode(() => validateSession("bria-rmbg"), "BGREMOVE_SESSION_FORBIDDEN", "validateSession bị cấm");
  try { validateSession("bria-rmbg"); } catch (e) {
    eq(e.message, 'Session "bria-rmbg" BỊ CẤM: weights non-commercial, không được dùng. Dùng "birefnet-general" (MIT).', "validateSession forbidden message cũ");
    eq(e.params.fallback, "birefnet-general", "validateSession params.fallback");
  }
  throwsCode(() => validateSession("Bad Name!"), "BGREMOVE_SESSION_INVALID", "validateSession tên sai");
  throwsCode(() => validateTemporal("5"), "BGREMOVE_TEMPORAL_INVALID", "validateTemporal(5)");
  throwsCode(() => validateFeather("9"), "BGREMOVE_FEATHER_INVALID", "validateFeather(9)");
  throwsCode(() => validateNoiseDb("5"), "SILENCE_NOISE_INVALID", "validateNoiseDb(5)");
  try { validateNoiseDb("5"); } catch (e) {
    eq(e.message, 'Ngưỡng noise phải trong [-80, 0] dB (nhận "5").', "validateNoiseDb message cũ");
    eq(e.params.min, "-80", "validateNoiseDb params.min");
    eq(e.params.max, "0", "validateNoiseDb params.max");
  }
  throwsCode(() => validateMinDur("99"), "SILENCE_MINDUR_INVALID", "validateMinDur(99)");
  throwsCode(() => validateThreshold("2"), "SCENE_THRESHOLD_INVALID", "validateThreshold(2)");
  try { validateThreshold("2"); } catch (e) {
    eq(e.message, 'Ngưỡng không hợp lệ: "2". Chọn số trong khoảng 0.05..0.95 (mặc định 0.4).', "validateThreshold message cũ");
  }
  throwsCode(() => validateRange("-1", "5"), "SCENE_START_INVALID", "validateRange start sai");
  throwsCode(() => validateRange("1", "0"), "SCENE_END_INVALID", "validateRange end sai");
  throwsCode(() => validateRange("5", "2"), "SCENE_RANGE_INVALID", "validateRange end<=start");

  console.log("== [3] jobQueue: QUEUE_FULL / retry / recover ==");
  const work = tmpWork();
  const svc = new RenderJobService({
    spawnJob: () => fakeProc(),
    maxConcurrent: 1,
    maxQueueLength: 1,
    enableQA: false,
  });
  const j1 = svc.enqueue({ dir: path.join(work, "j1") });
  eq(j1.status, "running", "job1 chạy (slot trống)");
  const j2 = svc.enqueue({ dir: path.join(work, "j2") });
  eq(j2.status, "queued", "job2 xếp hàng (hết slot)");
  try {
    svc.enqueue({ dir: path.join(work, "j3") });
    ok(false, "enqueue thứ 3 phải throw QUEUE_FULL");
  } catch (e) {
    eq(e.code, "QUEUE_FULL", "QUEUE_FULL code");
    eq(e.params.maxQueue, 1, "QUEUE_FULL params.maxQueue (số)");
    eq(e.message, "Hàng đợi đầy (1 job đang chờ) — thử lại sau.", "QUEUE_FULL message cũ");
  }
  // retry: không tìm thấy
  try { svc.retry("0123456789abcdef"); ok(false, "retry job lạ phải throw"); }
  catch (e) { eq(e.code, "NOT_FOUND", "retry NOT_FOUND"); }
  // retry: job đang chạy → BAD_STATE kèm status
  try { svc.retry(j1.id); ok(false, "retry job running phải throw"); }
  catch (e) {
    eq(e.code, "BAD_STATE", "retry running BAD_STATE");
    eq(e.params.status, "running", "retry BAD_STATE params.status");
  }
  // retry: job đã huỷ → BAD_STATE, message có câu huỷ
  ok(svc.cancel(j2.id), "cancel job2 queued");
  try { svc.retry(j2.id); ok(false, "retry job cancelled phải throw"); }
  catch (e) {
    eq(e.code, "BAD_STATE", "retry cancelled BAD_STATE");
    eq(e.params.status, "cancelled", "retry cancelled params.status");
    ok(e.message.includes("Job đã huỷ"), "retry cancelled message có câu huỷ");
  }
  // retry: job error nhưng spec đã mất → GONE
  const j4 = svc.enqueue({ dir: path.join(work, "j4") });
  const rec4 = svc.get(j4.id);
  rec4.status = "error";
  rec4.error = "Render worker thoát với mã 1.";
  fs.rmSync(rec4.specPath, { force: true });
  try { svc.retry(j4.id); ok(false, "retry job mất spec phải throw"); }
  catch (e) { eq(e.code, "GONE", "retry GONE"); }
  svc.shutdown();

  // recover(): job queued thiếu spec + job running → mã restore.
  const work2 = tmpWork();
  const dirA = path.join(work2, "aabbccddeeff0011");
  const dirB = path.join(work2, "aabbccddeeff0022");
  fs.mkdirSync(dirA, { recursive: true });
  fs.mkdirSync(dirB, { recursive: true });
  writeFileEpermRetry(path.join(dirA, "job.json"), JSON.stringify({
    id: "aabbccddeeff0011", status: "queued",
    specPath: path.join(dirA, "spec.json"), // không tồn tại
    mediaDir: path.join(dirA, "media"), outPath: path.join(dirA, "output.mp4"),
    totalDuration: 2, createdAt: Date.now(), attempts: 0,
  }));
  writeFileEpermRetry(path.join(dirA, "spec.json"), ""); // (ghi rồi xóa để chắc chắn thiếu)
  fs.rmSync(path.join(dirA, "spec.json"), { force: true });
  writeFileEpermRetry(path.join(dirB, "job.json"), JSON.stringify({
    id: "aabbccddeeff0022", status: "running",
    specPath: path.join(dirB, "spec.json"),
    mediaDir: path.join(dirB, "media"), outPath: path.join(dirB, "output.mp4"),
    totalDuration: 2, createdAt: Date.now(), attempts: 0,
  }));
  writeFileEpermRetry(path.join(dirB, "spec.json"), "{}");
  const svc2 = new RenderJobService({ spawnJob: () => fakeProc(), enableQA: false });
  const n = svc2.recover(work2);
  eq(n, 2, "recover đếm 2 job");
  const ra = svc2.get("aabbccddeeff0011");
  eq(ra.status, "error", "recover A: queued thiếu spec → error");
  eq(ra.errorCode, "JOB_SPEC_MISSING_AFTER_RESTART", "recover A: errorCode restore");
  eq(ra.error, "spec.json bị thiếu sau khi server restart — không render lại được, hãy tạo job mới.", "recover A: message cũ");
  const rb = svc2.get("aabbccddeeff0022");
  eq(rb.status, "interrupted", "recover B: running → interrupted");
  eq(rb.errorCode, "JOB_INTERRUPTED_BY_RESTART", "recover B: errorCode restore");
  // publicJob luôn kèm errorCode (kể cả mã restore).
  eq(publicJob(ra).errorCode, "JOB_SPEC_MISSING_AFTER_RESTART", "publicJob kèm errorCode restore A");
  eq(publicJob(rb).errorCode, "JOB_INTERRUPTED_BY_RESTART", "publicJob kèm errorCode restore B");
  eq(publicJob(ra).error, ra.error, "publicJob giữ error cũ");
  // Đợt 63 R5: recover gắn noteCode JOB_RECOVERED_RESTART (cả 2 nhánh),
  // publicJob lộ noteCode; retry xóa note/noteCode.
  eq(ra.noteCode, "JOB_RECOVERED_RESTART", "recover A: noteCode");
  eq(rb.noteCode, "JOB_RECOVERED_RESTART", "recover B: noteCode");
  eq(publicJob(ra).noteCode, "JOB_RECOVERED_RESTART", "publicJob kèm noteCode A");
  eq(publicJob(rb).noteCode, "JOB_RECOVERED_RESTART", "publicJob kèm noteCode B");
  eq(ra.note, "Phục hồi sau khi server restart — render lại từ đầu.", "recover A: note cũ");
  // Job error có spec + noteCode → retry thành công, noteCode bị xóa.
  const dirC = path.join(work2, "aabbccddeeff0033");
  fs.mkdirSync(dirC, { recursive: true });
  writeFileEpermRetry(path.join(dirC, "job.json"), JSON.stringify({
    id: "aabbccddeeff0033", status: "error",
    specPath: path.join(dirC, "spec.json"), mediaDir: path.join(dirC, "media"),
    outPath: path.join(dirC, "output.mp4"), totalDuration: 2, createdAt: Date.now(), attempts: 0,
    error: "Render worker thoát với mã 1.", errorCode: "WORKER_EXIT",
    note: "Phục hồi sau khi server restart — render lại từ đầu.", noteCode: "JOB_RECOVERED_RESTART",
  }));
  writeFileEpermRetry(path.join(dirC, "spec.json"), "{}");
  const svc3 = new RenderJobService({ spawnJob: () => fakeProc(), enableQA: false });
  eq(svc3.recover(work2), 3, "recover đếm 3 job (kèm C)");
  const rc = svc3.get("aabbccddeeff0033");
  eq(rc.noteCode, "JOB_RECOVERED_RESTART", "recover C: noteCode giữ từ job.json");
  const retried = svc3.retry("aabbccddeeff0033");
  // _pump() có thể start job ngay (slot trống) nên status là
  // "queued" hoặc "running" — điểm cần khóa là note/noteCode bị xóa.
  ok(retried.status === "queued" || retried.status === "running", `retry C: queued lại (nhận ${retried.status})`);
  eq(retried.noteCode, null, "retry C: noteCode bị xóa");
  eq(retried.note, null, "retry C: note bị xóa");
  svc3.shutdown();
  svc2.shutdown();

  fs.rmSync(work, { recursive: true, force: true });
  fs.rmSync(work2, { recursive: true, force: true });

  console.log("== [4] Đợt 63 R5: taskErrorPayload ==");
  {
    // (A) Error không message thật → mã TASK_* + chuỗi fallback.
    let p = taskErrorPayload(new Error(""), "Caption thất bại.", "TASK_CAPTION_FAILED");
    eq(p.errorCode, "TASK_CAPTION_FAILED", "(A) error rỗng → TASK_CAPTION_FAILED");
    eq(p.error, "Caption thất bại.", "(A) error = chuỗi fallback");
    ok(p.errorDetail && p.errorDetail.code === "UNKNOWN", "(A) errorDetail gốc UNKNOWN");
    // (A') error chỉ có khoảng trắng cũng tính là không có message thật.
    p = taskErrorPayload(new Error("   "), "Tạo proxy thất bại.", "TASK_PROXY_FAILED");
    eq(p.errorCode, "TASK_PROXY_FAILED", "(A') error trắng → TASK_PROXY_FAILED");
    // (B) Message thật không phân loại được → giữ UNKNOWN + message thật.
    p = taskErrorPayload(new Error("lỗi lạ xyz không phân loại được"), "Caption thất bại.", "TASK_CAPTION_FAILED");
    eq(p.errorCode, "UNKNOWN", "(B) message thật không phân loại → UNKNOWN giữ nguyên");
    eq(p.error, "lỗi lạ xyz không phân loại được", "(B) message thật giữ nguyên, không bị fallback nuốt");
    // (C) Message thật phân loại được → giữ mã thật.
    p = taskErrorPayload(new Error("ffmpeg: No such file or directory"), "Caption thất bại.", "TASK_CAPTION_FAILED");
    eq(p.errorCode, "MISSING_ASSET", "(C) message ffmpeg → MISSING_ASSET giữ nguyên");
    eq(p.error, "ffmpeg: No such file or directory", "(C) message thật giữ nguyên");
    // (D) buildTaskError ném (e.message getter ném) → nhánh catch.
    const evil = {};
    Object.defineProperty(evil, "message", { get() { throw new Error("boom"); } });
    p = taskErrorPayload(evil, "Tạo proxy thất bại.", "TASK_PROXY_FAILED");
    eq(p.errorCode, "TASK_PROXY_FAILED", "(D) buildTaskError ném → fallback code");
    eq(p.error, "Tạo proxy thất bại.", "(D) buildTaskError ném → fallback string");
    eq(p.errorDetail, null, "(D) buildTaskError ném → errorDetail null");
    // (D') không có fallbackCode → catch trả UNKNOWN.
    p = taskErrorPayload(evil, "X thất bại.", undefined);
    eq(p.errorCode, "UNKNOWN", "(D') không fallbackCode → UNKNOWN");
    // (E) e null/undefined → coi như không message → TASK_*.
    p = taskErrorPayload(null, "TTS thất bại.", "TASK_TTS_FAILED");
    eq(p.errorCode, "TASK_TTS_FAILED", "(E) e null → TASK_TTS_FAILED");
    // (F) 9 call site literal trong index.js dùng đúng 9 mã catalog (khóa
    // chống lệch mã giữa call site và catalog). Đợt 80 H8 gộp 2 site TTS
    // (/api/tts + /api/tts/clone) vào streamTtsResponse với mã tham số
    // `failCode` nên regex dưới không đếm được chúng — 2 mã đó
    // (TASK_TTS_FAILED, TASK_TTS_CLONE_FAILED) được khóa riêng ở dưới.
    const indexSrc = fs.readFileSync(path.join(__dirname, "..", "src", "index.js"), "utf8");
    const used = [...indexSrc.matchAll(/taskErrorPayload\(e, "[^"]+", "([A-Z_]+)"\)/g)].map((m) => m[1]);
    eq(used.length, 9, "(F) index.js có đúng 9 call site taskErrorPayload literal");
    eq(new Set(used).size, 9, "(F) 9 call site dùng 9 mã khác nhau");
    for (const code of used) ok(isBridgeErrorCode(code), `(F) call site dùng mã catalog: ${code}`);
    // (F') 2 site TTS tham số qua failCode: mã truyền vào phải có trong catalog.
    for (const code of ["TASK_TTS_FAILED", "TASK_TTS_CLONE_FAILED"]) {
      ok(isBridgeErrorCode(code), `(F') mã TTS tham số trong catalog: ${code}`);
      ok(indexSrc.includes(`failCode: "${code}"`), `(F') route truyền failCode ${code}`);
    }
  }

  console.log(`R5 bridge error protocol (unit): ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exitCode = 1;
});
