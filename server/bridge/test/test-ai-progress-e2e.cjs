/**
 * E2E cho đợt 80 H8 (gap N4): chạy bridge THẬT (server/bridge/src/index.js)
 * trên cổng test 18798 với stub python (in progress chậm), gọi HTTP thật:
 *   [1] POST /api/caption → NDJSON progress tăng dần + done có segments
 *   [2] POST /api/caption + hủy giữa chừng → không còn process stub nào
 *       sống (pgrep rỗng) — hủy thật, không mồ côi
 *   [3] POST /api/caption/translate → progress + done
 *   [4] POST /api/tts → NDJSON chunk progress + done {downloadUrl} →
 *       GET downloadUrl 200 (+ header X-TTS-Duration) → GET lại 404
 *   [5] POST /api/bgremove → frame progress + done + download 1 lần
 *   [6] POST /api/reframe → progress + done + download 1 lần
 *   [7] GET /api/ai-download/<token sai> → 400, token đúng dạng nhưng lạ → 404
 *
 * Chạy bằng: node test/test-ai-progress-e2e.cjs
 * (không cần model thật, không cần GPU; stub chỉ giả lập tiến trình chậm.)
 */
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TEST_DIR = path.join(__dirname);
const PORT = 18798;
const BASE = `http://127.0.0.1:${PORT}`;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-h8-e2e-"));

// Env PHẢI set trước khi require index.js (server listen ngay lúc import).
process.env.BRIDGE_PORT = String(PORT);
process.env.BRIDGE_WORK_DIR = WORK;
process.env.BRIDGE_RATE_PERSIST_PATH = path.join(WORK, "rate-limit.json");
process.env.CAPTION_PY = path.join(TEST_DIR, "test-caption-progress-stub.py");
process.env.TTS_PY = path.join(TEST_DIR, "test-tts-progress-stub.py");
process.env.BGREMOVE_PY = path.join(TEST_DIR, "test-bgremove-progress-stub.py");
process.env.REFRAME_PY = path.join(TEST_DIR, "test-reframe-progress-stub.py");
// Stub translate: copy stub sang tên chứa "translate" để tag đúng.
const trStub = path.join(WORK, "test-translate-progress-stub.py");
fs.copyFileSync(process.env.CAPTION_PY, trStub);
process.env.TRANSLATE_PY = trStub;

require("../src/index.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countProcs(pattern) {
  try {
    const out = execFileSync("pgrep", ["-f", pattern], { encoding: "utf8" });
    return out.trim().split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

/** WAV tối thiểu hợp lệ (RIFF/WAVE, 0.1s im lặng) cho magic-check của bridge. */
function tinyWav() {
  const sr = 16000;
  const frames = sr / 10;
  const pcm = Buffer.alloc(frames * 2);
  const buf = Buffer.alloc(44 + pcm.length);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + pcm.length, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(pcm.length, 40);
  pcm.copy(buf, 44);
  return buf;
}

/** MP4 giả: chỉ cần magic "ftyp" ở offset 4 cho magic-check (stub không decode). */
function tinyMp4() {
  const buf = Buffer.alloc(32);
  buf.writeUInt32BE(24, 0);
  buf.write("ftypisom", 4);
  return buf;
}

/** Đọc NDJSON từ Response fetch; gọi onEvent cho mỗi event; trả done payload. */
async function readNdjson(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let donePayload = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      let evt;
      try { evt = JSON.parse(line); } catch { continue; }
      onEvent(evt);
      if (evt.type === "done") donePayload = evt;
    }
  }
  return donePayload;
}

function multipartMedia(buf, filename, type) {
  const fd = new FormData();
  fd.append("media", new Blob([buf], { type }), filename);
  return fd;
}

async function waitReady() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/api/ai-download/bad-token`);
      if (r.status === 400) return true; // server đã lên (400 = token sai định dạng)
    } catch { /* chưa lên */ }
    await sleep(200);
  }
  return false;
}

async function main() {
  ok(await waitReady(), "bridge lên ở cổng 18798");

  console.log("== [1] POST /api/caption: progress thật + done ==");
  {
    const events = [];
    const res = await fetch(`${BASE}/api/caption`, {
      method: "POST",
      body: (() => {
        const fd = multipartMedia(tinyWav(), "test.wav", "audio/wav");
        fd.append("lang", "vi");
        return fd;
      })(),
    });
    ok(res.ok, `caption HTTP ${res.status}`);
    ok((res.headers.get("content-type") || "").includes("ndjson"), "caption trả NDJSON");
    const done = await readNdjson(res, (e) => events.push(e));
    const progs = events.filter((e) => e.type === "progress");
    ok(events.some((e) => e.type === "phase" && e.phase === "load"), "có phase load (nạp model)");
    ok(progs.length >= 3, `≥3 event progress (nhận ${progs.length})`);
    let increasing = true;
    for (let i = 1; i < progs.length; i++) {
      if (progs[i].done < progs[i - 1].done) increasing = false;
    }
    ok(increasing, "progress done tăng đơn điệu qua HTTP");
    ok(progs.length > 0 && progs[progs.length - 1].progress === 1, "progress cuối = 1");
    ok(progs.every((p) => "etaSeconds" in p), "mọi progress event đều có etaSeconds");
    // Đợt 81 I6: ETA THẬT (không chỉ có key): giữa chừng phải có event
    // mang ETA hữu hạn > 0 (từ tốc độ thật), event cuối mang ETA 0.
    ok(progs.some((p) => typeof p.etaSeconds === "number" && p.etaSeconds > 0),
      "có event progress mang ETA hữu hạn > 0 giữa chừng");
    ok(progs[progs.length - 1].etaSeconds === 0, "event progress cuối mang ETA 0 (đã xong)");
    ok(done && Array.isArray(done.segments) && done.segments.length === 2, "done có 2 segments");
  }

  console.log("== [2] POST /api/caption + hủy giữa chừng: không mồ côi ==");
  {
    const ctrl = new AbortController();
    const fd = multipartMedia(tinyWav(), "test.wav", "audio/wav");
    fd.append("lang", "vi");
    const fetchP = fetch(`${BASE}/api/caption`, {
      method: "POST", body: fd, signal: ctrl.signal,
    });
    const res = await fetchP;
    ok(res.ok, `caption (abort) HTTP ${res.status}`);
    // Đọc tới event progress đầu tiên rồi hủy.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let sawProgress = false;
    while (!sawProgress) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.type === "progress") sawProgress = true;
        } catch { /* bỏ qua */ }
      }
    }
    ok(sawProgress, "nhận được progress trước khi hủy");
    ok(countProcs("test-caption-progress-stub") >= 1, "stub đang chạy lúc hủy");
    ctrl.abort();
    try { await reader.cancel(); } catch { /* đã đóng */ }
    await sleep(800);
    ok(countProcs("test-caption-progress-stub") === 0,
      "không còn process stub caption sau khi client hủy (kill cây thật)");
  }

  console.log("== [3] POST /api/caption/translate ==");
  {
    const events = [];
    const fd = multipartMedia(tinyWav(), "test.wav", "audio/wav");
    fd.append("lang", "vi");
    const res = await fetch(`${BASE}/api/caption/translate`, { method: "POST", body: fd });
    ok(res.ok, `translate HTTP ${res.status}`);
    const done = await readNdjson(res, (e) => events.push(e));
    const progs = events.filter((e) => e.type === "progress");
    ok(progs.length >= 3 && progs[progs.length - 1].progress === 1, "translate progress tới 1");
    // Đợt 81 I6: ETA thật như caption (giữa chừng > 0, cuối = 0).
    ok(progs.some((p) => typeof p.etaSeconds === "number" && p.etaSeconds > 0),
      "translate: có event mang ETA hữu hạn > 0 giữa chừng");
    ok(progs[progs.length - 1].etaSeconds === 0, "translate: event cuối mang ETA 0");
    ok(done && Array.isArray(done.segments) && done.segments.length === 2, "translate done có 2 segments");
  }

  console.log("== [4] POST /api/tts: stream + download 1 lần ==");
  {
    const events = [];
    const res = await fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Xin chào các bạn, đây là test TTS.", voice: "Hải Đăng" }),
    });
    ok(res.ok, `tts HTTP ${res.status}`);
    const done = await readNdjson(res, (e) => events.push(e));
    const progs = events.filter((e) => e.type === "progress");
    ok(progs.length >= 4, `≥4 event chunk progress (nhận ${progs.length})`);
    ok(progs.length > 0 && progs[progs.length - 1].done === 4 && progs[progs.length - 1].total === 4,
      "chunk progress cuối = 4/4");
    // Đợt 81 I6: ETA thật (giữa chừng > 0, cuối = 0).
    ok(progs.some((p) => typeof p.etaSeconds === "number" && p.etaSeconds > 0),
      "tts: có event mang ETA hữu hạn > 0 giữa chừng");
    ok(progs[progs.length - 1].etaSeconds === 0, "tts: event cuối mang ETA 0");
    ok(done && typeof done.downloadUrl === "string" && done.downloadUrl.startsWith("/api/ai-download/"),
      "done có downloadUrl");
    const dl1 = await fetch(`${BASE}${done.downloadUrl}`);
    ok(dl1.status === 200, `GET downloadUrl lần 1 → 200 (nhận ${dl1.status})`);
    ok(dl1.headers.get("x-tts-duration") !== null, "giữ header X-TTS-Duration trên download");
    const bytes = new Uint8Array(await dl1.arrayBuffer());
    ok(bytes.length > 100, `file WAV tải về ${bytes.length} byte`);
    const dl2 = await fetch(`${BASE}${done.downloadUrl}`);
    ok(dl2.status === 404, `GET downloadUrl lần 2 → 404 (nhận ${dl2.status})`);
  }

  console.log("== [5] POST /api/bgremove: frame progress + download 1 lần ==");
  {
    const events = [];
    const fd = multipartMedia(tinyMp4(), "test.mp4", "video/mp4");
    fd.append("session", "u2net");
    const res = await fetch(`${BASE}/api/bgremove`, { method: "POST", body: fd });
    ok(res.ok, `bgremove HTTP ${res.status}`);
    const done = await readNdjson(res, (e) => events.push(e));
    const progs = events.filter((e) => e.type === "progress");
    ok(progs.length >= 5, `≥5 event frame progress (nhận ${progs.length})`);
    ok(progs.length > 0 && progs[progs.length - 1].done === 9 && progs[progs.length - 1].total === 9,
      "frame progress cuối = 9/9");
    // Đợt 81 I6: ETA thật (giữa chừng > 0, cuối = 0).
    ok(progs.some((p) => typeof p.etaSeconds === "number" && p.etaSeconds > 0),
      "bgremove: có event mang ETA hữu hạn > 0 giữa chừng");
    ok(progs[progs.length - 1].etaSeconds === 0, "bgremove: event cuối mang ETA 0");
    ok(done && done.sessionUsed === "u2net", "done có sessionUsed=u2net");
    ok(done && typeof done.downloadUrl === "string", "done có downloadUrl");
    const dl1 = await fetch(`${BASE}${done.downloadUrl}`);
    ok(dl1.status === 200, `GET download bgremove lần 1 → 200 (nhận ${dl1.status})`);
    const dl2 = await fetch(`${BASE}${done.downloadUrl}`);
    ok(dl2.status === 404, `GET download bgremove lần 2 → 404 (nhận ${dl2.status})`);
  }

  console.log("== [6] POST /api/reframe: progress + download ==");
  {
    const events = [];
    const fd = multipartMedia(tinyMp4(), "test.mp4", "video/mp4");
    fd.append("aspect", "9:16");
    const res = await fetch(`${BASE}/api/reframe`, { method: "POST", body: fd });
    ok(res.ok, `reframe HTTP ${res.status}`);
    const done = await readNdjson(res, (e) => events.push(e));
    const progs = events.filter((e) => e.type === "progress");
    ok(progs.length >= 4, `≥4 event frame progress (nhận ${progs.length})`);
    // Đợt 81 I6: ETA thật (giữa chừng > 0). Event cuối KHÔNG mang ETA 0:
    // progressFromLine của reframe kẹp pct tối đa 99 (pin ở
    // test-reframe.cjs: 100% → 99, để 100% chỉ hiện khi có event done) nên
    // progress cuối = 0.99, còn 1 đơn vị → ETA nhỏ > 0 chứ không phải 0.
    ok(progs.some((p) => typeof p.etaSeconds === "number" && p.etaSeconds > 0),
      "reframe: có event mang ETA hữu hạn > 0 giữa chừng");
    ok(progs[progs.length - 1].progress === 0.99, "reframe: progress cuối = 0.99 (kẹp 99)");
    ok(typeof progs[progs.length - 1].etaSeconds === "number" &&
      progs[progs.length - 1].etaSeconds > 0 && progs[progs.length - 1].etaSeconds < 5,
      "reframe: event cuối mang ETA nhỏ > 0 (còn 1% — xem LIMITS I6 §4.3)");
    ok(done && typeof done.downloadUrl === "string", "reframe done có downloadUrl");
    const dl1 = await fetch(`${BASE}${done.downloadUrl}`);
    ok(dl1.status === 200, `GET download reframe → 200 (nhận ${dl1.status})`);
  }

  console.log("== [7] GET /api/ai-download: token sai ==");
  {
    // Token sai định dạng (không phải 16 hex) → 400. Lưu ý: KHÔNG test
    // traversal "../" qua HTTP vì fetch/Express chuẩn hoá dot-segment
    // trước khi tới route; guard traversal đã kiểm chứng trực tiếp ở
    // test-ai-progress-cancel.cjs [10c] (serveAiDownload → 400).
    const bad = await fetch(`${BASE}/api/ai-download/bad-token!`);
    ok(bad.status === 400, `token sai định dạng → 400 (nhận ${bad.status})`);
    const unknown = await fetch(`${BASE}/api/ai-download/0123456789abcdef`);
    ok(unknown.status === 404, `token đúng dạng nhưng lạ → 404 (nhận ${unknown.status})`);
  }

  console.log(`\n== KẾT QUẢ E2E: ${pass} pass, ${fail} fail ==`);
  fs.rmSync(WORK, { recursive: true, force: true });
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("LỖI E2E:", e);
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(1);
});
