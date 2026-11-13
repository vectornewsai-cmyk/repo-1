/**
 * E2E cho đợt 85 M7: export/backup + import giọng đã clone
 * (GET /api/tts/cloned-voices/:id/export, GET .../export,
 *  POST /api/tts/cloned-voices/import).
 * Chạy bridge THẬT (server/bridge/src/index.js) trên cổng test 18798 với
 * stub python (in progress chậm, ghi WAV tối thiểu), gọi HTTP thật:
 *   [1] Tạo 1 giọng (stub synth) → export 1 giọng: JSON đúng format,
 *       sha256 khớp đúng bytes mẫu đã upload, base64 giải ra đúng bytes.
 *   [2] Export toàn bộ: format backup, count 1; export id lạ → 404.
 *   [3] Xóa giọng → import file backup vừa export → list có lại giọng,
 *       POST /api/tts { clonedVoiceId } tổng hợp được (round-trip đủ).
 *   [4] Import lại cùng file → 400 NAME_DUP; import với tên mới → được.
 *   [5] Import file rác / sha bị sửa / thiếu file → 400 REGISTRY/MISSING.
 *   [6] Backup toàn bộ 2–3 giọng → xóa hết → import multi → đủ giọng;
 *       import multi lại → skipped (trùng tên), không nhân đôi;
 *       import multi 1 giọng mới + 2 giọng cũ → imported 1 + skipped 2.
 *
 * Chạy bằng: node test/test-tts-cloned-voices-export-import-e2e.cjs
 * (không cần model thật, không cần GPU.)
 */
"use strict";

const { createHash } = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TEST_DIR = path.join(__dirname);
const PORT = 18798;
const BASE = `http://127.0.0.1:${PORT}`;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-m7-e2e-"));
const VOICES_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-m7-voices-"));

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
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** WAV tối thiểu hợp lệ (RIFF/WAVE, 0.1s im lặng) cho magic-check của bridge. */
function tinyWav(seed = 0) {
  const sr = 16000;
  const frames = sr / 10;
  const pcm = Buffer.alloc(frames * 2);
  for (let i = 0; i < pcm.length; i++) pcm[i] = (seed + i) % 256;
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

async function readNdjson(res) {
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
      try {
        const evt = JSON.parse(line);
        if (evt.type === "done") donePayload = evt;
      } catch { /* bỏ qua */ }
    }
  }
  return donePayload;
}

async function waitReady() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/api/ai-download/bad-token`);
      if (r.status === 400) return true;
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

async function createVoice(name, wavBuf) {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("refAudio", new Blob([wavBuf], { type: "audio/wav" }), "mau.wav");
  const res = await fetch(`${BASE}/api/tts/cloned-voices`, { method: "POST", body: fd });
  const done = await readNdjson(res);
  return { res, done };
}

async function importBackup(backupObj, rename) {
  const fd = new FormData();
  fd.append("backup",
    new Blob([typeof backupObj === "string" ? backupObj : JSON.stringify(backupObj)],
      { type: "application/json" }),
    "backup.json");
  if (rename) fd.append("name", rename);
  const res = await fetch(`${BASE}/api/tts/cloned-voices/import`, { method: "POST", body: fd });
  const j = await res.json().catch(() => null);
  return { res, j };
}

async function main() {
  ok(await waitReady(), "bridge lên ở cổng 18798");

  console.log("== [1] Tạo giọng + export 1 giọng ==");
  const sample = tinyWav(7);
  const { res: cRes, done } = await createVoice("Giọng M7", sample);
  ok(cRes.ok && done && done.clonedVoice, `tạo giọng M7 qua stub (HTTP ${cRes.status})`);
  const voiceId = done.clonedVoice.id;
  let backupText;
  {
    const r = await fetch(`${BASE}/api/tts/cloned-voices/${voiceId}/export`);
    ok(r.status === 200, `GET export 1 giọng → 200 (nhận ${r.status})`);
    const cd = r.headers.get("content-disposition") || "";
    ok(cd.includes("attachment") && cd.includes("vcut-voice-") && cd.endsWith(".json\""),
      `export có Content-Disposition attachment .json (nhận ${cd})`);
    backupText = await r.text();
    const b = JSON.parse(backupText);
    ok(b.format === "vcut-cloned-voice" && b.version === 1, "backup format/version đúng");
    ok(b.voice && b.voice.name === "Giọng M7", "backup giữ tên giọng");
    ok(b.refSha256 === sha256(sample),
      `backup sha256 khớp bytes mẫu đã upload (${(b.refSha256 || "").slice(0, 12)}…)`);
    ok(Buffer.from(b.refAudioBase64, "base64").equals(sample),
      "backup base64 giải ra đúng từng byte mẫu đã upload");
    ok(!backupText.includes(VOICES_ROOT), "backup không lộ đường dẫn tuyệt đối");
  }

  console.log("== [2] Export toàn bộ + export id lạ ==");
  let backupAllText;
  {
    const r = await fetch(`${BASE}/api/tts/cloned-voices/export`);
    ok(r.status === 200, `GET export tất cả → 200 (nhận ${r.status})`);
    backupAllText = await r.text();
    const b = JSON.parse(backupAllText);
    ok(b.format === "vcut-cloned-voices-backup" && b.count === 1
      && Array.isArray(b.voices) && b.voices.length === 1,
      "backup tất cả: format đúng, count 1");
    ok(b.voices[0].refSha256 === sha256(sample), "backup tất cả: sha khớp mẫu");
    const r404 = await fetch(`${BASE}/api/tts/cloned-voices/0123456789abcdef/export`);
    const j404 = await r404.json().catch(() => null);
    ok(r404.status === 404 && j404 && j404.errorCode === "TTS_CLONED_VOICE_NOT_FOUND",
      `export id lạ → 404 NOT_FOUND (nhận ${r404.status}/${j404 && j404.errorCode})`);
  }

  console.log("== [3] Xóa → import lại → dùng được (round-trip) ==");
  {
    const del = await fetch(`${BASE}/api/tts/cloned-voices/${voiceId}`, { method: "DELETE" });
    ok(del.status === 200, `DELETE giọng → 200 (nhận ${del.status})`);
    const listed0 = await getVoices();
    ok(listed0.voices && listed0.voices.length === 0, "list rỗng sau khi xóa");
    const { res, j } = await importBackup(backupText);
    ok(res.status === 200, `POST import → 200 (nhận ${res.status})`);
    ok(j && Array.isArray(j.imported) && j.imported.length === 1
      && j.imported[0].name === "Giọng M7",
      `import: imported 1 giọng tên Giọng M7 (nhận ${JSON.stringify(j && j.imported)})`);
    ok(j && Array.isArray(j.skipped) && j.skipped.length === 0
      && Array.isArray(j.failed) && j.failed.length === 0,
      "import: không skipped/failed");
    const listed = await getVoices();
    ok(listed.voices && listed.voices.length === 1, "list có lại 1 giọng sau import");
    // Giọng đã import tổng hợp được như giọng vừa tạo.
    const newId = listed.voices[0].id;
    const synth = await fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Xin chào, giọng đã nhập lại.", clonedVoiceId: newId }),
    });
    const synthDone = await readNdjson(synth);
    ok(synth.ok && synthDone && synthDone.cloned === true,
      `synth bằng giọng đã import → done cloned=true (HTTP ${synth.status})`);
  }

  console.log("== [4] Import trùng tên + import đổi tên ==");
  {
    const { res, j } = await importBackup(backupText);
    ok(res.status === 400 && j && j.errorCode === "TTS_CLONED_VOICE_NAME_DUP",
      `import lại cùng file → 400 NAME_DUP (nhận ${res.status}/${j && j.errorCode})`);
    const renamed = await importBackup(backupText, "Giọng M7 Đổi Tên");
    ok(renamed.res.status === 200 && renamed.j && renamed.j.imported.length === 1
      && renamed.j.imported[0].name === "Giọng M7 Đổi Tên",
      "import với name mới → imported 1 giọng tên mới");
    const listed = await getVoices();
    ok(listed.voices && listed.voices.length === 2, "list có 2 giọng sau import đổi tên");
  }

  console.log("== [5] Import file hỏng ==");
  {
    const garbage = await importBackup("{khong phai json");
    ok(garbage.res.status === 400 && garbage.j
      && garbage.j.errorCode === "TTS_CLONED_VOICE_REGISTRY",
      `import JSON rác → 400 REGISTRY (nhận ${garbage.res.status}/${garbage.j && garbage.j.errorCode})`);
    const tampered = JSON.parse(backupText);
    tampered.refSha256 = "0".repeat(64);
    const bad = await importBackup(tampered);
    ok(bad.res.status === 400 && bad.j && bad.j.errorCode === "TTS_CLONED_VOICE_REGISTRY",
      `import sha bị sửa → 400 REGISTRY (nhận ${bad.res.status}/${bad.j && bad.j.errorCode})`);
    const noFile = await fetch(`${BASE}/api/tts/cloned-voices/import`, {
      method: "POST", body: new FormData(),
    });
    const noFileJ = await noFile.json().catch(() => null);
    ok(noFile.status === 400 && noFileJ && noFileJ.errorCode === "TTS_REF_AUDIO_MISSING",
      `import thiếu file → 400 MISSING (nhận ${noFile.status}/${noFileJ && noFileJ.errorCode})`);
  }

  console.log("== [6] Backup toàn bộ nhiều giọng: round-trip + skip trùng ==");
  {
    // Hiện có 2 giọng; tạo giọng thứ 3 rồi export tất cả.
    const { done: done3 } = await createVoice("Giọng M7 Ba", tinyWav(99));
    ok(done3 && done3.clonedVoice, "tạo giọng thứ 3 qua stub");
    const allRes = await fetch(`${BASE}/api/tts/cloned-voices/export`);
    const allText = await allRes.text();
    const allB = JSON.parse(allText);
    ok(allB.count === 3, `export tất cả lúc 3 giọng: count 3 (nhận ${allB.count})`);
    // Xóa hết 3 giọng rồi import multi.
    const listed = await getVoices();
    for (const v of listed.voices) {
      await fetch(`${BASE}/api/tts/cloned-voices/${v.id}`, { method: "DELETE" });
    }
    const empty = await getVoices();
    ok(empty.voices && empty.voices.length === 0, "list rỗng sau khi xóa hết");
    const imp = await importBackup(allText);
    ok(imp.res.status === 200 && imp.j && imp.j.imported.length === 3
      && imp.j.skipped.length === 0 && imp.j.failed.length === 0,
      `import multi 3 giọng → imported 3 (nhận ${JSON.stringify(imp.j && imp.j.imported.map((x) => x.name))})`);
    const imp2 = await importBackup(allText);
    ok(imp2.res.status === 200 && imp2.j && imp2.j.imported.length === 0
      && imp2.j.skipped.length === 3,
      `import multi lại → imported 0, skipped 3 (không nhân đôi) (nhận imported=${imp2.j && imp2.j.imported.length}, skipped=${imp2.j && imp2.j.skipped.length})`);
    // Hỗn hợp: xóa 1 giọng, import multi → imported 1 + skipped 2.
    const listed2 = await getVoices();
    const one = listed2.voices.find((v) => v.name === "Giọng M7 Ba");
    await fetch(`${BASE}/api/tts/cloned-voices/${one.id}`, { method: "DELETE" });
    const imp3 = await importBackup(allText);
    ok(imp3.res.status === 200 && imp3.j && imp3.j.imported.length === 1
      && imp3.j.imported[0].name === "Giọng M7 Ba" && imp3.j.skipped.length === 2,
      `import multi hỗn hợp → imported 1 + skipped 2 (nhận imported=${imp3.j && imp3.j.imported.length}, skipped=${imp3.j && imp3.j.skipped.length})`);
  }

  console.log(`\nexport-import e2e: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("e2e crash:", e);
  process.exit(1);
});
