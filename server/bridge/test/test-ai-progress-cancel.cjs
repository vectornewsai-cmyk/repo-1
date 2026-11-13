/**
 * Test cho đợt 80 H8 (gap N4): tiến trình THẬT + hủy THẬT cho job AI dài.
 * Chạy bằng: node test/test-ai-progress-cancel.cjs
 * (không cần model thật, không cần server — dùng stub python in progress
 * chậm rồi ngủ, để kiểm chứng hủy giữa chừng kill đúng process).
 *
 * Kiểm chứng:
 *  [1] Parser tiến trình thật (caption/translate/TTS/bgremove)
 *  [2] EtaTracker: progress đơn điệu, ETA null khi thiếu dữ liệu, ETA đúng
 *      (đợt 81 I6: + biên tốc độ 0 / cùng timestamp / đã xong → ETA 0)
 *  [3] createProgressSender: progress đơn điệu + null khi chưa biết total
 *      (đợt 81 I6: + event cuối done=total mang ETA 0)
 *  [4] killChildTree: kill process group, không còn process con
 *  [5] attachClientAbort: res 'close' khi chưa end → abort; đã end → không
 *  [6] runCaption (stub): progress tăng dần → done; abort giữa chừng →
 *      lỗi AI_JOB_ABORTED + KHÔNG còn process stub nào sống
 *  [7] runTranslate (stub): progress translate → done
 *  [8] runTts (stub): chunk progress → done; abort giữa chừng → hủy thật
 *  [9] runBgremove (stub): frame progress → done; abort giữa chừng →
 *      AI_JOB_ABORTED (KHÔNG fallback retry sang u2net)
 *  [10] aiDownload: đăng ký → tải 1 lần rồi mất; token sai → 400/404;
 *      sweep xóa token quá hạn
 */
"use strict";

const { EventEmitter } = require("events");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");

const {
  EtaTracker,
  attachClientAbort,
  createProgressSender,
  isAbortError,
  killChildTree,
  progressFromDoneTotal,
} = require("../src/aiProgress.js");
const {
  progressFromLine,
  runCaption,
  runTranslate,
} = require("../src/caption.js");
const {
  parseTtsChunkLine,
  parseTtsChunkTotal,
  runTts,
} = require("../src/tts.js");
const {
  parseBgremoveProgressLine,
  runBgremove,
} = require("../src/bgremove.js");
const {
  registerAiDownload,
  serveAiDownload,
  sweepAiDownloads,
} = require("../src/aiDownload.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Số process còn sống có cmdline chứa `pattern` (0 khi không còn). */
function countProcs(pattern) {
  try {
    const out = execFileSync("pgrep", ["-f", pattern], { encoding: "utf8" });
    return out.trim().split("\n").filter(Boolean).length;
  } catch {
    return 0; // pgrep exit 1 = không khớp process nào
  }
}

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

const TEST_DIR = path.join(__dirname);
const CAPTION_STUB = path.join(TEST_DIR, "test-caption-progress-stub.py");
const TTS_STUB = path.join(TEST_DIR, "test-tts-progress-stub.py");
const BGREMOVE_STUB = path.join(TEST_DIR, "test-bgremove-progress-stub.py");

async function main() {
  console.log("== [1] parser tiến trình thật ==");
  {
    const c1 = progressFromLine("[caption] progress 12.3/60.0", "caption");
    ok(c1 && c1.done === 12.3 && c1.total === 60, "caption progress 12.3/60.0");
    const c2 = progressFromLine("[translate] progress 3.0/9.5", "translate");
    ok(c2 && c2.done === 3 && c2.total === 9.5, "translate progress 3.0/9.5");
    ok(progressFromLine("[caption] đang transcribe...", "caption") === null, "dòng phase không phải progress");
    ok(progressFromLine("[caption] progress 1.0/0", "caption") === null, "total 0 → null (không bịa %)");
    const t1 = parseTtsChunkLine("[tts]   chunk 2/5 xong (123 ký tự)");
    ok(t1 && t1.done === 2 && t1.total === 5, "tts chunk 2/5 xong");
    ok(parseTtsChunkLine("[tts] tổng hợp 10 ký tự...") === null, "dòng tts khác → null");
    ok(parseTtsChunkTotal("[tts] chia thành 5 chunk theo câu") === 5, "tts tổng chunk = 5");
    const b1 = parseBgremoveProgressLine("[bgremove] 30/90 (33%)");
    ok(b1 && b1.done === 30 && b1.total === 90 && Math.abs(b1.progress - 1 / 3) < 1e-9, "bgremove 30/90 (33%)");
    const b2 = parseBgremoveProgressLine("[bgremove] 7/? (7%)");
    ok(b2 && b2.done === 7 && b2.total === null && b2.progress === null, "bgremove total ? → progress null");
    ok(parseBgremoveProgressLine("[bgremove] khởi tạo session...") === null, "dòng bgremove khác → null");
    ok(progressFromDoneTotal(3, 10) === 0.3, "progressFromDoneTotal 3/10");
    ok(progressFromDoneTotal(3, null) === null, "total null → null");
    ok(progressFromDoneTotal(12, 10) === 1, "done vượt total → clamp 1");
  }

  console.log("== [2] EtaTracker ==");
  {
    const tr = new EtaTracker();
    ok(tr.etaSeconds(100) === null, "chưa đủ sample → ETA null");
    tr.push(0, 100);
    ok(tr.etaSeconds(100) === null, "1 sample → ETA null");
    // Giả lập tốc độ: push sample cách nhau bằng cách sửa timestamp.
    tr.samples[0].at = Date.now() - 2000;
    tr.push(20, 100);
    const eta = tr.etaSeconds(100);
    ok(eta !== null && eta > 5 && eta < 15, `ETA ≈ 8s ở tốc độ 10 đơn vị/s (nhận ${eta})`);
    // done lùi → progress không giảm (đơn điệu).
    const p1 = tr.push(20, 100);
    tr.push(15, 100);
    const p2 = tr.push(25, 100);
    ok(p2 >= p1, "progress đơn điệu không giảm khi done lùi");
    // Đợt 81 I6: các biên của etaSeconds (ghi trực tiếp samples như mẫu
    // trên — test logic etaSeconds, không test Date.now).
    const now = Date.now();
    const trZeroSpeed = new EtaTracker();
    trZeroSpeed.samples = [
      { at: now - 2000, done: 10 },
      { at: now, done: 10 },
    ];
    ok(trZeroSpeed.etaSeconds(100) === null, "tốc độ 0 (done không tăng) → ETA null");
    const trSameTs = new EtaTracker();
    trSameTs.samples = [
      { at: now, done: 10 },
      { at: now, done: 20 },
    ];
    ok(trSameTs.etaSeconds(100) === null, "2 sample cùng timestamp (dWall=0) → ETA null");
    const trDone = new EtaTracker();
    trDone.samples = [
      { at: now, done: 50 },
      { at: now, done: 100 },
    ];
    ok(trDone.etaSeconds(100) === 0, "đã xong (done=total, kể cả cùng timestamp) → ETA 0");
    const trDoneEarly = new EtaTracker();
    trDoneEarly.samples = [
      { at: now - 2000, done: 40 },
      { at: now, done: 120 },
    ];
    ok(trDoneEarly.etaSeconds(100) === 0, "done vượt total → ETA 0 (không âm)");
  }

  console.log("== [3] createProgressSender ==");
  {
    const sent = [];
    const send = createProgressSender((o) => sent.push(o));
    send("transcribe", 0, 60);
    ok(sent[0].progress === 0 && sent[0].etaSeconds === null, "progress 0 + ETA null lúc đầu");
    send("transcribe", 30, 60);
    ok(Math.abs(sent[1].progress - 0.5) < 1e-9, "progress 0.5 ở giữa");
    send("transcribe", 20, 60); // done lùi (không xảy ra thật, nhưng phải đơn điệu)
    ok(Math.abs(sent[2].progress - 0.5) < 1e-9, "progress không giảm khi done lùi");
    send("synth", 1, null); // chưa biết total
    ok(sent[3].progress === null, "total null → progress null (không bịa %)");
    // Đợt 81 I6: event cuối (done=total) mang ETA 0 — kể cả khi mọi
    // progress event dồn trong cùng 1ms (dWall=0), ETA vẫn là 0 chứ
    // không phải null (xem reorder trong EtaTracker.etaSeconds).
    const sent2 = [];
    const send2 = createProgressSender((o) => sent2.push(o));
    send2("transcribe", 0, 60);
    send2("transcribe", 60, 60);
    ok(sent2[1].progress === 1 && sent2[1].etaSeconds === 0,
      "progress cuối = 1 + ETA 0 (đã xong)");
  }

  console.log("== [4] killChildTree ==");
  {
    const child = spawn("sleep", ["30"], { detached: true, stdio: "ignore" });
    const pid = child.pid;
    ok(typeof pid === "number" && pid > 0, "spawn sleep 30 có pid");
    const dead = await killChildTree(child, 500);
    await sleep(100);
    let alive = true;
    try { process.kill(pid, 0); } catch { alive = false; }
    ok(dead === true && alive === false, "killChildTree diệt được sleep (không mồ côi)");
  }

  console.log("== [5] attachClientAbort ==");
  {
    const res = new EventEmitter();
    res.writableEnded = false;
    const ctrl = new AbortController();
    const detach = attachClientAbort(res, ctrl);
    res.emit("close");
    ok(ctrl.signal.aborted === true, "res close khi chưa end → abort");
    detach();
    const res2 = new EventEmitter();
    res2.writableEnded = true; // đã res.end() bình thường
    const ctrl2 = new AbortController();
    attachClientAbort(res2, ctrl2);
    res2.emit("close");
    ok(ctrl2.signal.aborted === false, "res close sau end → không abort");
  }

  console.log("== [6] runCaption (stub): progress thật + hủy thật ==");
  {
    const dir = tmpDir("vcut-h8-cap-");
    const input = path.join(dir, "in.wav");
    writeFileEpermRetry(input, Buffer.alloc(64));
    // 6a. Chạy hết: progress tăng dần, done có segments.
    const events = [];
    const r = await runCaption({
      inputPath: input,
      lang: "vi",
      config: { pythonBin: "python3", captionPy: CAPTION_STUB, timeoutMs: 30000 },
      onPhase: (p) => events.push({ t: "phase", p }),
      onProgress: (pr) => events.push({ t: "progress", ...pr }),
    });
    ok(r.segments.length === 2, "caption stub trả 2 segments");
    const progs = events.filter((e) => e.t === "progress");
    ok(progs.length >= 3, `nhận ≥3 event progress (nhận ${progs.length})`);
    let increasing = true;
    for (let i = 1; i < progs.length; i++) {
      if (progs[i].done < progs[i - 1].done) increasing = false;
    }
    ok(increasing, "progress done tăng đơn điệu");
    ok(progs[progs.length - 1].done === 10 && progs[progs.length - 1].total === 10,
      "progress cuối = 10/10 (tổng giây stub)");
    ok(events.some((e) => e.t === "phase" && e.p === "load"), "có phase load (nạp model)");
    // 6b. Hủy giữa chừng: abort sau 700ms, lỗi AI_JOB_ABORTED, không còn process stub.
    const ctrl = new AbortController();
    const p = runCaption({
      inputPath: input,
      lang: "vi",
      config: { pythonBin: "python3", captionPy: CAPTION_STUB, timeoutMs: 30000 },
      signal: ctrl.signal,
      onProgress: () => {},
    });
    await sleep(700);
    ok(countProcs("test-caption-progress-stub") >= 1, "stub đang chạy trước khi hủy");
    ctrl.abort();
    let err = null;
    try { await p; } catch (e) { err = e; }
    ok(err && isAbortError(err), "abort → lỗi AI_JOB_ABORTED");
    await sleep(300);
    ok(countProcs("test-caption-progress-stub") === 0, "không còn process stub sau khi hủy");
    fs.rmSync(dir, { recursive: true, force: true });
  }

  console.log("== [7] runTranslate (stub) ==");
  {
    const dir = tmpDir("vcut-h8-tr-");
    const input = path.join(dir, "in.wav");
    writeFileEpermRetry(input, Buffer.alloc(64));
    // Stub translate: copy stub sang tên chứa "translate" để tag đúng.
    const trStub = path.join(dir, "test-translate-progress-stub.py");
    fs.copyFileSync(CAPTION_STUB, trStub);
    const progs = [];
    const r = await runTranslate({
      inputPath: input,
      lang: "vi",
      target: "en",
      config: { pythonBin: "python3", translatePy: trStub, timeoutMs: 30000 },
      onProgress: (pr) => progs.push(pr),
    });
    ok(r.segments.length === 2, "translate stub trả 2 segments");
    ok(progs.length >= 3 && progs[progs.length - 1].total === 10, "translate progress tới 10/10");
    fs.rmSync(dir, { recursive: true, force: true });
  }

  console.log("== [8] runTts (stub): chunk progress + hủy thật ==");
  {
    const dir = tmpDir("vcut-h8-tts-");
    const chunks = [];
    const phases = [];
    const r = await runTts({
      text: "Xin chào các bạn, đây là test TTS.",
      voice: "Hải Đăng",
      outDir: dir,
      cfg: { pythonBin: "python3", ttsPy: TTS_STUB, timeoutMs: 30000 },
      onPhase: (p) => phases.push(p),
      onProgress: (pr) => chunks.push(pr),
    });
    ok(fs.existsSync(r.outPath), "tts stub tạo file WAV");
    // 5 event: {0,4} khi đọc "chia thành 4 chunk" + chunk 1..4/4 xong.
    ok(chunks.length === 5 && chunks[0].done === 0 && chunks[0].total === 4 &&
      chunks[4].done === 4 && chunks[4].total === 4,
      `chunk progress 0/4 → 4/4 (nhận ${chunks.length} event)`);
    ok(phases.includes("load"), "có phase load (nạp model)");
    // Hủy giữa chừng.
    const dir2 = tmpDir("vcut-h8-tts2-");
    const ctrl = new AbortController();
    const p = runTts({
      text: "Text dài để test hủy giữa chừng khi tổng hợp.",
      voice: "Hải Đăng",
      outDir: dir2,
      cfg: { pythonBin: "python3", ttsPy: TTS_STUB, timeoutMs: 30000 },
      signal: ctrl.signal,
    });
    await sleep(700);
    ok(countProcs("test-tts-progress-stub") >= 1, "stub tts đang chạy trước khi hủy");
    ctrl.abort();
    let err = null;
    try { await p; } catch (e) { err = e; }
    ok(err && isAbortError(err), "abort tts → lỗi AI_JOB_ABORTED");
    await sleep(300);
    ok(countProcs("test-tts-progress-stub") === 0, "không còn process stub tts sau khi hủy");
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(dir2, { recursive: true, force: true });
  }

  console.log("== [9] runBgremove (stub): frame progress + hủy thật, không fallback ==");
  {
    const dir = tmpDir("vcut-h8-bg-");
    const input = path.join(dir, "in.mp4");
    writeFileEpermRetry(input, Buffer.alloc(64));
    const output = path.join(dir, "out.mov");
    const prevPy = process.env.BGREMOVE_PY;
    process.env.BGREMOVE_PY = BGREMOVE_STUB;
    try {
      const progs = [];
      const r = await runBgremove({
        inputPath: input, outputPath: output, session: "u2net",
        onPhase: (ev) => { if (ev.phase === "processing") progs.push(ev); },
      });
      ok(fs.existsSync(output), "bgremove stub tạo file output");
      ok(r.sessionUsed === "u2net", "sessionUsed = u2net");
      ok(progs.length >= 5, `nhận ≥5 event frame progress (nhận ${progs.length})`);
      ok(progs[progs.length - 1].done === 9 && progs[progs.length - 1].total === 9,
        "frame progress cuối = 9/9");
      let mono = true;
      for (let i = 1; i < progs.length; i++) {
        if (progs[i].done < progs[i - 1].done) mono = false;
      }
      ok(mono, "frame progress tăng đơn điệu");
      // Hủy giữa chừng với session retryable (birefnet-general): phải ra
      // lỗi AI_JOB_ABORTED, KHÔNG fallback sang u2net.
      const output2 = path.join(dir, "out2.mov");
      const ctrl = new AbortController();
      const p = runBgremove({
        inputPath: input, outputPath: output2, session: "birefnet-general",
        signal: ctrl.signal,
      });
      await sleep(700);
      ok(countProcs("test-bgremove-progress-stub") >= 1, "stub bgremove đang chạy trước khi hủy");
      ctrl.abort();
      let err = null;
      try { await p; } catch (e) { err = e; }
      ok(err && isAbortError(err), "abort bgremove → lỗi AI_JOB_ABORTED (không bọc thành lỗi 2 session)");
      await sleep(300);
      ok(countProcs("test-bgremove-progress-stub") === 0, "không còn process stub bgremove sau khi hủy");
    } finally {
      if (prevPy === undefined) delete process.env.BGREMOVE_PY;
      else process.env.BGREMOVE_PY = prevPy;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  console.log("== [10] aiDownload: tải 1 lần, token sai, sweep ==");
  {
    const work = tmpDir("vcut-h8-dl-");
    const src = path.join(work, "src.wav");
    writeFileEpermRetry(src, Buffer.from("FAKE-WAV-DATA"));
    const { token, url } = registerAiDownload(work, src, "tts-test.wav", {
      "X-TTS-Duration": "1.5",
    });
    ok(/^[0-9a-f]{16}$/.test(token), "token 16 hex");
    ok(url === `/api/ai-download/${token}`, "url đúng dạng /api/ai-download/<token>");
    ok(!fs.existsSync(src), "file gốc đã move sang ai-downloads");
    // Fake res kiểu Express tối thiểu cho serveAiDownload.
    const fakeRes = (downloadImpl) => {
      const r = new EventEmitter();
      r.headers = {};
      r.statusCode = 200;
      r.setHeader = (k, v) => { r.headers[k] = v; };
      r.status = (c) => { r.statusCode = c; return r; };
      r.json = (o) => { r.body = o; return r; };
      r.download = downloadImpl;
      return r;
    };
    // 10a. Tải lần 1: thành công + xóa file ngay sau đó.
    const res1 = fakeRes((file, name, cb) => {
      ok(fs.existsSync(file), "file tồn tại lúc download");
      ok(name === "tts-test.wav", "tên file tải về đúng");
      cb(null);
    });
    serveAiDownload(work, { params: { token } }, res1);
    await sleep(50);
    ok(!fs.existsSync(path.join(work, "ai-downloads", token)), "thư mục token đã xóa sau khi tải");
    ok(res1.headers["X-TTS-Duration"] === "1.5", "header X-TTS-Duration giữ lại trên response download");
    // 10b. Tải lần 2: 404 (đã tải rồi).
    const res2 = fakeRes(() => { throw new Error("không được gọi download lần 2"); });
    serveAiDownload(work, { params: { token } }, res2);
    ok(res2.statusCode === 404, "tải lần 2 → 404");
    // 10c. Token sai định dạng → 400.
    const res3 = fakeRes(() => { throw new Error("không được gọi download"); });
    serveAiDownload(work, { params: { token: "../etc/passwd" } }, res3);
    ok(res3.statusCode === 400, "token traversal → 400");
    // 10d. Sweep xóa token quá hạn, giữ token mới.
    const src2 = path.join(work, "src2.wav");
    writeFileEpermRetry(src2, Buffer.from("X"));
    const old = registerAiDownload(work, src2, "old.wav");
    // Giả già token: lùi mtime thư mục 3h.
    const oldDir = path.join(work, "ai-downloads", old.token);
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
    fs.utimesSync(oldDir, past, past);
    const n = sweepAiDownloads(work);
    ok(n === 1 && !fs.existsSync(oldDir), "sweep xóa 1 token quá 2h");
    fs.rmSync(work, { recursive: true, force: true });
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("LỖI TEST:", e);
  process.exit(1);
});
