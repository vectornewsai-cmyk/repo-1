// test-tts-cloned-voices.cjs — unit test cho server/bridge/src/clonedVoices.js
// (Phase 9 đợt 84 L8: giọng đã clone LƯU LẠI ĐƯỢC).
// Không cần model TTS, không cần bridge đang chạy — chỉ thao tác registry
// + file mẫu trong thư mục tạm. Chạy bằng: node test/test-tts-cloned-voices.cjs
"use strict";

const assert = require("node:assert/strict");
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");

const {
  MAX_CLONED_VOICES,
  MAX_VOICE_NAME_LEN,
  PROBE_TEXT,
  clonedVoicesRootFromEnv,
  validateClonedVoiceName,
  validateClonedVoiceId,
  readRegistry,
  listClonedVoices,
  getClonedVoice,
  clonedVoiceRefPath,
  prepareClonedVoice,
  commitClonedVoice,
  discardClonedVoiceDir,
  deleteClonedVoice,
} = require("../src/clonedVoices");

let pass = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cv-test-"));
}

/** File mẫu giả (WAV tối thiểu) để prepareClonedVoice dời vào kho. */
function fakeSample(dir, name = "sample.wav") {
  const p = path.join(dir, name);
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
  writeFileEpermRetry(p, buf);
  return p;
}

console.log("== [1] validateClonedVoiceName ==");
ok("tên rỗng / toàn khoảng trắng → NAME_EMPTY", () => {
  assert.throws(() => validateClonedVoiceName(""), (e) => e.code === "TTS_CLONED_VOICE_NAME_EMPTY");
  assert.throws(() => validateClonedVoiceName("   "), (e) => e.code === "TTS_CLONED_VOICE_NAME_EMPTY");
  assert.throws(() => validateClonedVoiceName(undefined), (e) => e.code === "TTS_CLONED_VOICE_NAME_EMPTY");
});
ok(`tên > ${MAX_VOICE_NAME_LEN} ký tự → NAME_TOO_LONG`, () => {
  assert.throws(() => validateClonedVoiceName("x".repeat(MAX_VOICE_NAME_LEN + 1)),
    (e) => e.code === "TTS_CLONED_VOICE_NAME_TOO_LONG");
  assert.equal(validateClonedVoiceName("x".repeat(MAX_VOICE_NAME_LEN)).length, MAX_VOICE_NAME_LEN);
});
ok("tên chứa / hoặc \\ → từ chối", () => {
  assert.throws(() => validateClonedVoiceName("a/b"), (e) => e.code === "TTS_CLONED_VOICE_NAME_EMPTY");
  assert.throws(() => validateClonedVoiceName("a\\b"), (e) => e.code === "TTS_CLONED_VOICE_NAME_EMPTY");
});
ok("trim + trùng tên không phân biệt hoa/thường → NAME_DUP", () => {
  assert.equal(validateClonedVoiceName("  Giọng Tôi  "), "Giọng Tôi");
  assert.throws(() => validateClonedVoiceName("giọng tôi", ["Giọng Tôi"]),
    (e) => e.code === "TTS_CLONED_VOICE_NAME_DUP");
  assert.equal(validateClonedVoiceName("Giọng Khác", ["Giọng Tôi"]), "Giọng Khác");
});
ok("tên tiếng Việt có dấu + số + gạch ngang hợp lệ", () => {
  assert.equal(validateClonedVoiceName("Giọng bà ngoại 2"), "Giọng bà ngoại 2");
});

console.log("== [2] validateClonedVoiceId ==");
ok("id sai dạng → NOT_FOUND (không lộ lý do khác)", () => {
  for (const bad of ["", "abc", "zzzzzzzzzzzzzzzz", "../etc", "0123456789abcdef0"]) {
    assert.throws(() => validateClonedVoiceId(bad), (e) => e.code === "TTS_CLONED_VOICE_NOT_FOUND");
  }
  assert.equal(validateClonedVoiceId("0123456789abcdef"), "0123456789abcdef");
});

console.log("== [3] registry rỗng + root mặc định ==");
ok("list rỗng khi chưa có registry", () => {
  assert.deepEqual(listClonedVoices(tmpRoot()), []);
});
ok("root mặc định nằm ngoài tmpdir (sống qua reboot)", () => {
  const def = clonedVoicesRootFromEnv({});
  assert.ok(def.includes(".vcut") && def.includes("cloned-voices"), def);
  assert.ok(!def.startsWith(os.tmpdir()), def);
});
ok("env BRIDGE_CLONED_VOICES_DIR thắng mặc định", () => {
  assert.equal(clonedVoicesRootFromEnv({ BRIDGE_CLONED_VOICES_DIR: "/tmp/x-cv" }), "/tmp/x-cv");
});
ok("câu thăm dò ngắn, 1 chunk", () => {
  assert.ok(PROBE_TEXT.length > 0 && PROBE_TEXT.length < 100, PROBE_TEXT);
});

console.log("== [4] prepare → commit → list/get → delete ==");
ok("prepare dời file mẫu vào kho, CHƯA ghi registry", () => {
  const root = tmpRoot();
  const tmp = fakeSample(root);
  const p = prepareClonedVoice(root, { name: "Giọng Test", tmpUploadPath: tmp, ext: ".wav" });
  assert.match(p.id, /^[0-9a-f]{16}$/);
  assert.ok(fs.existsSync(p.refPath), "file mẫu đã vào kho");
  assert.ok(!fs.existsSync(tmp), "file tạm đã dời đi");
  assert.deepEqual(listClonedVoices(root), [], "chưa commit → list vẫn rỗng");
  discardClonedVoiceDir(p.dir);
  assert.ok(!fs.existsSync(p.dir), "discard xóa thư mục tạm");
});
ok("commit ghi registry; list/get trả bản ghi công khai (không lộ path)", () => {
  const root = tmpRoot();
  const tmp = fakeSample(root);
  const p = prepareClonedVoice(root, { name: "Giọng Test", tmpUploadPath: tmp, ext: ".wav" });
  const v = commitClonedVoice(root, { ...p, refDurationSec: 12.5 });
  assert.equal(v.name, "Giọng Test");
  assert.equal(v.refExt, ".wav");
  assert.equal(v.refDurationSec, 12.5);
  assert.ok(!("refFile" in v) && !("refPath" in v), "không lộ tên file nội bộ");
  const listed = listClonedVoices(root);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, v.id);
  const full = getClonedVoice(root, v.id);
  assert.equal(full.name, "Giọng Test");
  assert.equal(clonedVoiceRefPath(root, full), p.refPath);
});
ok("tên trùng sau commit → prepare từ chối (không tạo thư mục rác)", () => {
  const root = tmpRoot();
  const p1 = prepareClonedVoice(root, { name: "Giọng A", tmpUploadPath: fakeSample(root, "a.wav"), ext: ".wav" });
  commitClonedVoice(root, { ...p1, refDurationSec: null });
  assert.throws(
    () => prepareClonedVoice(root, { name: "giọng a", tmpUploadPath: fakeSample(root, "b.wav"), ext: ".wav" }),
    (e) => e.code === "TTS_CLONED_VOICE_NAME_DUP");
});
ok("đuôi file lạ → prepare từ chối", () => {
  const root = tmpRoot();
  assert.throws(
    () => prepareClonedVoice(root, { name: "Giọng X", tmpUploadPath: fakeSample(root, "x.exe"), ext: ".exe" }),
    (e) => e.code === "TTS_REF_AUDIO_TYPE");
});
ok("delete xóa registry + file mẫu; get sau đó → NOT_FOUND", () => {
  const root = tmpRoot();
  const p = prepareClonedVoice(root, { name: "Giọng Xóa", tmpUploadPath: fakeSample(root), ext: ".wav" });
  const v = commitClonedVoice(root, { ...p, refDurationSec: null });
  const removed = deleteClonedVoice(root, v.id);
  assert.equal(removed.name, "Giọng Xóa");
  assert.deepEqual(listClonedVoices(root), []);
  assert.ok(!fs.existsSync(p.dir), "thư mục giọng đã xóa");
  assert.throws(() => getClonedVoice(root, v.id), (e) => e.code === "TTS_CLONED_VOICE_NOT_FOUND");
  assert.throws(() => deleteClonedVoice(root, v.id), (e) => e.code === "TTS_CLONED_VOICE_NOT_FOUND");
});
ok("registry JSON hỏng → list throw REGISTRY (không lặng lẽ mất giọng)", () => {
  const root = tmpRoot();
  fs.mkdirSync(root, { recursive: true });
  writeFileEpermRetry(path.join(root, "voices.json"), "{ hỏng", "utf8");
  assert.throws(() => listClonedVoices(root), (e) => e.code === "TTS_CLONED_VOICE_REGISTRY");
});
ok("registry sai cấu trúc → throw REGISTRY", () => {
  const root = tmpRoot();
  fs.mkdirSync(root, { recursive: true });
  writeFileEpermRetry(path.join(root, "voices.json"), JSON.stringify({ voices: "không phải mảng" }), "utf8");
  assert.throws(() => readRegistry(root), (e) => e.code === "TTS_CLONED_VOICE_REGISTRY");
});
ok(`giới hạn ${MAX_CLONED_VOICES} giọng: giọng thứ ${MAX_CLONED_VOICES + 1} bị chặn`, () => {
  const root = tmpRoot();
  for (let i = 0; i < MAX_CLONED_VOICES; i++) {
    const p = prepareClonedVoice(root, { name: `Giọng ${i}`, tmpUploadPath: fakeSample(root, `s${i}.wav`), ext: ".wav" });
    commitClonedVoice(root, { ...p, refDurationSec: null });
  }
  assert.equal(listClonedVoices(root).length, MAX_CLONED_VOICES);
  assert.throws(
    () => prepareClonedVoice(root, { name: "Giọng thừa", tmpUploadPath: fakeSample(root, "extra.wav"), ext: ".wav" }),
    (e) => e.code === "TTS_CLONED_VOICE_LIMIT");
});

console.log(`\n${pass} test pass`);
