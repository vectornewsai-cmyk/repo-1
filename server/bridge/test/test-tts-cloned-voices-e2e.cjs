/**
 * E2E cho đợt 84 L8: giọng đã clone LƯU LẠI ĐƯỢC (POST/GET/DELETE
 * /api/tts/cloned-voices + POST /api/tts { clonedVoiceId }).
 * Chạy bridge THẬT (server/bridge/src/index.js) trên cổng test 18799 với
 * stub python (in progress chậm, ghi WAV tối thiểu), gọi HTTP thật:
 *   [1] GET list rỗng ban đầu
 *   [2] POST create: thiếu tên → 400; đuôi lạ → 400; hợp lệ → NDJSON
 *       progress + ETA + done { clonedVoice, downloadUrl } → preview
 *       tải 1 lần (200 rồi 404); list có 1 giọng
 *   [3] POST /api/tts { clonedVoiceId } → done cloned=true, tải WAV 200
 *   [4] Lỗi dùng giọng: id lạ → 404; gửi cả voice + clonedVoiceId → 400
 *   [5] Trùng tên → 400 NAME_DUP
 *   [6] Hủy giữa chừng khi tạo giọng → event cancelled, không để lại
 *       giọng dở dang trong list, không còn process stub sống
 *   [7] DELETE: id lạ → 404; xóa thật → list rỗng; xóa lại → 404
 *
 * Chạy bằng: node test/test-tts-cloned-voices-e2e.cjs
 * (không cần model thật, không cần GPU; stub chỉ giả lập tiến trình chậm.)
 */
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TEST_DIR = path.join(__dirname);
const PORT = 18799;
const BASE = `http://127.0.0.1:${PORT}`;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-l8-e2e-"));
const VOICES_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-l8-voices-"));

// Env PHẢI set trước khi require index.js (server listen ngay lúc import).
process.env.BRIDGE_PORT = String(PORT);
process.env.BRIDGE_WORK_DIR = WORK;
process.env.BRIDGE_CLONED_VOICES_DIR = VOICES_ROOT;
process.env.BRIDGE_RATE_PERSIST_PATH = path.join(WORK, "rate-limit.json");
process.env.TTS_PY = path.join(TEST_DIR, "test-tts-progress-stub.py");

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

/** Đọc NDJSON từ Response fetch; gọi onEvent cho mỗi event; trả done payload. */
async function readNdjson(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let donePayload = null;
  let cancelled = false;
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
      if (evt.type === "cancelled") cancelled = true;
    }
  }
  return { donePayload, cancelled };
}

function createForm(name, wavBuf, filename = "mau.wav") {
  const fd = new FormData();
  if (name !== undefined && name !== null) fd.append("name", name);
  fd.append("refAudio", new Blob([wavBuf], { type: "audio/wav" }), filename);
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

async function getVoices() {
  const r = await fetch(`${BASE}/api/tts/cloned-voices`);
  const j = await r.json().catch(() => null);
  return { status: r.status, voices: j && Array.isArray(j.voices) ? j.voices : null };
}

async function main() {
  ok(await waitReady(), "bridge lên ở cổng 18799");

  console.log("== [1] GET /api/tts/cloned-voices: rỗng ban đầu ==");
  {
    const { status, voices } = await getVoices();
    ok(status === 200, `GET list → 200 (nhận ${status})`);
    ok(Array.isArray(voices) && voices.length === 0, "list rỗng ban đầu");
  }

  console.log("== [2] POST create: lỗi validate + tạo thật ==");
  {
    // Thiếu tên → 400 NAME_EMPTY.
    let res = await fetch(`${BASE}/api/tts/cloned-voices`, {
      method: "POST", body: createForm("", tinyWav()),
    });
    let j = await res.json().catch(() => null);
    ok(res.status === 400 && j && j.errorCode === "TTS_CLONED_VOICE_NAME_EMPTY",
      `thiếu tên → 400 NAME_EMPTY (nhận ${res.status}/${j && j.errorCode})`);
    // Đuôi lạ → 400 TTS_REF_AUDIO_TYPE.
    res = await fetch(`${BASE}/api/tts/cloned-voices`, {
      method: "POST", body: createForm("Giọng Test", Buffer.from("MZ..."), "mau.exe"),
    });
    j = await res.json().catch(() => null);
    ok(res.status === 400 && j && j.errorCode === "TTS_REF_AUDIO_TYPE",
      `đuôi .exe → 400 TTS_REF_AUDIO_TYPE (nhận ${res.status}/${j && j.errorCode})`);
    // Tạo hợp lệ → NDJSON progress + done { clonedVoice, downloadUrl }.
    const events = [];
    res = await fetch(`${BASE}/api/tts/cloned-voices`, {
      method: "POST", body: createForm("Giọng Test", tinyWav()),
    });
    ok(res.ok, `create hợp lệ HTTP ${res.status}`);
    ok((res.headers.get("content-type") || "").includes("ndjson"), "create trả NDJSON");
    const { donePayload } = await readNdjson(res, (e) => events.push(e));
    const progs = events.filter((e) => e.type === "progress");
    ok(events.some((e) => e.type === "phase" && e.phase === "load"), "có phase load");
    ok(progs.length >= 2, `≥2 event progress (nhận ${progs.length})`);
    ok(progs.every((p) => "etaSeconds" in p), "mọi progress event đều có etaSeconds");
    ok(progs.some((p) => typeof p.etaSeconds === "number" && p.etaSeconds > 0),
      "có event mang ETA hữu hạn > 0 giữa chừng (đợt 81 I6)");
    ok(donePayload && donePayload.cloned === true, "done mang cloned=true");
    ok(donePayload && donePayload.clonedVoice && donePayload.clonedVoice.name === "Giọng Test",
      "done mang clonedVoice { name }");
    ok(donePayload && typeof donePayload.downloadUrl === "string",
      "done mang downloadUrl (bản đọc thử)");
    // Preview tải 1 lần: 200 rồi 404.
    const dl1 = await fetch(`${BASE}${donePayload.downloadUrl}`);
    ok(dl1.status === 200, `GET preview → 200 (nhận ${dl1.status})`);
    const dlBody = Buffer.from(await dl1.arrayBuffer());
    ok(dlBody.slice(0, 4).toString() === "RIFF", "preview là WAV (RIFF)");
    const dl2 = await fetch(`${BASE}${donePayload.downloadUrl}`);
    ok(dl2.status === 404, `GET preview lần 2 → 404 (nhận ${dl2.status})`);
    // List có 1 giọng, không lộ đường dẫn tuyệt đối.
    const listed = await getVoices();
    ok(listed.voices && listed.voices.length === 1, "list có 1 giọng sau khi tạo");
    ok(listed.voices[0].id === donePayload.clonedVoice.id, "id trong list khớp id trong done");
    ok(!JSON.stringify(listed.voices[0]).includes(VOICES_ROOT), "list không lộ đường dẫn tuyệt đối");
  }

  console.log("== [3] POST /api/tts { clonedVoiceId } ==");
  let voiceId;
  {
    const listed = await getVoices();
    voiceId = listed.voices[0].id;
    const events = [];
    const res = await fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Xin chào, đây là câu thử giọng đã clone.", clonedVoiceId: voiceId }),
    });
    ok(res.ok, `synth bằng giọng clone HTTP ${res.status}`);
    const { donePayload } = await readNdjson(res, (e) => events.push(e));
    ok(donePayload && donePayload.cloned === true, "done mang cloned=true");
    ok(donePayload && donePayload.voice === "Giọng Test", `done voice = tên giọng clone (nhận ${donePayload && donePayload.voice})`);
    ok(donePayload && typeof donePayload.downloadUrl === "string", "done có downloadUrl");
    const dl = await fetch(`${BASE}${donePayload.downloadUrl}`);
    ok(dl.status === 200, `GET WAV giọng clone → 200 (nhận ${dl.status})`);
    const hdr = dl.headers.get("X-TTS-Cloned");
    ok(hdr === "1", `header X-TTS-Cloned=1 (nhận ${hdr})`);
  }

  console.log("== [4] Lỗi dùng giọng ==");
  {
    const res404 = await fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "test", clonedVoiceId: "0123456789abcdef" }),
    });
    const j404 = await res404.json().catch(() => null);
    ok(res404.status === 404 && j404 && j404.errorCode === "TTS_CLONED_VOICE_NOT_FOUND",
      `id lạ → 404 NOT_FOUND (nhận ${res404.status}/${j404 && j404.errorCode})`);
    const res400 = await fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "test", voice: "Hải Đăng", clonedVoiceId: voiceId }),
    });
    ok(res400.status === 400, `gửi cả voice + clonedVoiceId → 400 (nhận ${res400.status})`);
  }

  console.log("== [5] Trùng tên → 400 NAME_DUP ==");
  {
    const res = await fetch(`${BASE}/api/tts/cloned-voices`, {
      method: "POST", body: createForm("giọng test", tinyWav()),
    });
    const j = await res.json().catch(() => null);
    ok(res.status === 400 && j && j.errorCode === "TTS_CLONED_VOICE_NAME_DUP",
      `trùng tên (khác hoa/thường) → 400 NAME_DUP (nhận ${res.status}/${j && j.errorCode})`);
  }

  console.log("== [6] Hủy giữa chừng khi tạo giọng: không để lại giọng dở ==");
  {
    const ctrl = new AbortController();
    const fetchP = fetch(`${BASE}/api/tts/cloned-voices`, {
      method: "POST", body: createForm("Giọng Hủy", tinyWav()), signal: ctrl.signal,
    });
    const res = await fetchP;
    ok(res.ok, `create (abort) HTTP ${res.status}`);
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
    ok(countProcs("test-tts-progress-stub") >= 1, "stub đang chạy lúc hủy");
    ctrl.abort();
    try { await reader.cancel(); } catch { /* đã đóng */ }
    await sleep(800);
    ok(countProcs("test-tts-progress-stub") === 0,
      "không còn process stub sau khi client hủy (kill cây thật)");
    const listed = await getVoices();
    ok(listed.voices.length === 1 && listed.voices[0].name === "Giọng Test",
      "hủy giữa chừng không để lại giọng dở dang trong list");
    ok(!fs.existsSync(path.join(VOICES_ROOT, "voices.json")) ||
      JSON.parse(fs.readFileSync(path.join(VOICES_ROOT, "voices.json"), "utf8")).voices.length === 1,
      "registry vẫn chỉ có 1 giọng");
  }

  console.log("== [7] DELETE ==");
  {
    const res404 = await fetch(`${BASE}/api/tts/cloned-voices/0123456789abcdef`, { method: "DELETE" });
    const j404 = await res404.json().catch(() => null);
    ok(res404.status === 404 && j404 && j404.errorCode === "TTS_CLONED_VOICE_NOT_FOUND",
      `DELETE id lạ → 404 (nhận ${res404.status})`);
    const resBad = await fetch(`${BASE}/api/tts/cloned-voices/not-an-id`, { method: "DELETE" });
    ok(resBad.status === 404, `DELETE id sai dạng → 404 (nhận ${resBad.status})`);
    const res = await fetch(`${BASE}/api/tts/cloned-voices/${voiceId}`, { method: "DELETE" });
    const j = await res.json().catch(() => null);
    ok(res.ok && j && j.ok === true && j.name === "Giọng Test",
      `DELETE giọng thật → ok (nhận ${res.status})`);
    const listed = await getVoices();
    ok(listed.voices.length === 0, "list rỗng sau khi xóa");
    const resAgain = await fetch(`${BASE}/api/tts/cloned-voices/${voiceId}`, { method: "DELETE" });
    ok(resAgain.status === 404, `DELETE lại → 404 (nhận ${resAgain.status})`);
  }

  console.log(`\n== KẾT QUẢ E2E L8: ${pass} pass, ${fail} fail ==`);
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.rmSync(VOICES_ROOT, { recursive: true, force: true });
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("LỖI E2E:", e);
  try { fs.rmSync(WORK, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  try { fs.rmSync(VOICES_ROOT, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(1);
});
