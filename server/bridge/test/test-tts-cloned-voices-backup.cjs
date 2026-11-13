/**
 * Unit test cho export/backup giọng clone (Phase 9 đợt 85 M7).
 * Chỉ test module thuần server/bridge/src/clonedVoices.js (không cần bridge,
 * không cần model TTS): build backup → parse lại → sha khớp; file backup
 * bị sửa (base64/sha/format/đuôi) → lỗi rõ; backup toàn bộ; tên file export.
 *
 * Chạy: node test/test-tts-cloned-voices-backup.cjs
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");

const {
  readRegistry,
  commitClonedVoice,
  buildVoiceBackup,
  buildVoiceBackupEntry,
  buildAllVoicesBackup,
  backupExportFilename,
  parseVoiceBackup,
  writeBackupRefAudio,
  VOICE_BACKUP_FORMAT,
  VOICES_BACKUP_FORMAT,
} = require("../src/clonedVoices");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
function throwsCode(fn, code, label) {
  try {
    fn();
    ok(false, `${label} (không throw)`);
  } catch (e) {
    ok(e && e.code === code, `${label} (code=${e && e.code}, cần ${code})`);
  }
}

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-m7-backup-"));
// 2 giọng giả: file mẫu là bytes WAV tối thiểu (không cần audio thật —
/// module backup chỉ hash + base64, không decode audio).
function seedVoice(name, bytes, ext = ".wav") {
  const id = `a${"0".repeat(14)}${seedVoice.n++}`.slice(0, 16);
  const dir = path.join(ROOT, id);
  fs.mkdirSync(dir, { recursive: true });
  writeFileEpermRetry(path.join(dir, `ref${ext}`), bytes);
  const voice = commitClonedVoice(ROOT, {
    id, dir, name, refFile: `ref${ext}`, refExt: ext, refDurationSec: 12.5,
  });
  return voice;
}
seedVoice.n = 1;
const v1 = seedVoice("Giọng Thật 2277", Buffer.from("RIFFxxxxWAVEfake-audio-1"));
const v2 = seedVoice("Giọng Hai", Buffer.from("RIFFyyyyWAVEfake-audio-2"));

// [1] Build backup 1 giọng → parse lại khớp từng trường.
const backup = buildVoiceBackup(ROOT, readRegistry(ROOT).voices[0]);
ok(backup.format === VOICE_BACKUP_FORMAT, "backup 1 giọng: format đúng");
ok(backup.version === 1, "backup 1 giọng: version 1");
ok(backup.voice.name === "Giọng Thật 2277", "backup 1 giọng: tên đúng");
ok(typeof backup.refAudioBase64 === "string" && backup.refAudioBase64.length > 0,
  "backup 1 giọng: có refAudioBase64");
ok(/^[0-9a-f]{64}$/.test(backup.refSha256), "backup 1 giọng: sha256 hex 64 ký tự");
const parsed = parseVoiceBackup(JSON.stringify(backup));
ok(parsed.kind === "single", "parse lại: kind single");
ok(parsed.entries.length === 1 && parsed.entries[0].name === "Giọng Thật 2277",
  "parse lại: tên giọng đúng");
ok(parsed.entries[0].refSha256 === backup.refSha256, "parse lại: sha giữ nguyên");
ok(Buffer.from(parsed.entries[0].refAudioBase64, "base64").toString()
  === "RIFFxxxxWAVEfake-audio-1", "parse lại: bytes mẫu khôi phục đúng");

// [2] Backup toàn bộ → parse lại đủ 2 giọng.
const all = buildAllVoicesBackup(ROOT);
ok(all.format === VOICES_BACKUP_FORMAT, "backup tất cả: format đúng");
ok(all.count === 2 && all.voices.length === 2, "backup tất cả: count 2");
ok(Array.isArray(all.skipped) && all.skipped.length === 0, "backup tất cả: không skip");
const parsedAll = parseVoiceBackup(JSON.stringify(all));
ok(parsedAll.kind === "multi" && parsedAll.entries.length === 2,
  "parse backup tất cả: kind multi, 2 giọng");
ok(parsedAll.entries.map((e) => e.name).sort().join("|") === "Giọng Hai|Giọng Thật 2277",
  "parse backup tất cả: đủ tên 2 giọng");

// [3] File backup bị sửa → lỗi mã TTS_CLONED_VOICE_REGISTRY (không thêm mã mới).
const tamperedSha = { ...backup, refSha256: "0".repeat(64) };
throwsCode(() => parseVoiceBackup(JSON.stringify(tamperedSha)),
  "TTS_CLONED_VOICE_REGISTRY", "sha256 sai → REGISTRY");
const tamperedB64 = { ...backup, refAudioBase64: Buffer.from("khac").toString("base64") };
throwsCode(() => parseVoiceBackup(JSON.stringify(tamperedB64)),
  "TTS_CLONED_VOICE_REGISTRY", "base64 khác sha → REGISTRY");
throwsCode(() => parseVoiceBackup(JSON.stringify({ ...backup, format: "vcut-x" })),
  "TTS_CLONED_VOICE_REGISTRY", "format lạ → REGISTRY");
throwsCode(() => parseVoiceBackup(JSON.stringify({ ...backup, version: 99 })),
  "TTS_CLONED_VOICE_REGISTRY", "version lạ → REGISTRY");
throwsCode(() => parseVoiceBackup("{khong phai json"),
  "TTS_CLONED_VOICE_REGISTRY", "không phải JSON → REGISTRY");
throwsCode(() => parseVoiceBackup(""),
  "TTS_CLONED_VOICE_REGISTRY", "file rỗng → REGISTRY");
const badExt = JSON.parse(JSON.stringify(backup));
badExt.voice.refExt = ".exe";
throwsCode(() => parseVoiceBackup(JSON.stringify(badExt)),
  "TTS_CLONED_VOICE_REGISTRY", "đuôi mẫu lạ → REGISTRY");
const emptyMulti = { format: VOICES_BACKUP_FORMAT, version: 1, voices: [] };
throwsCode(() => parseVoiceBackup(JSON.stringify(emptyMulti)),
  "TTS_CLONED_VOICE_REGISTRY", "backup toàn bộ rỗng → REGISTRY");

// [4] writeBackupRefAudio: ghi lại file mẫu từ entry đã parse, sha khớp.
const ROOT2 = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-m7-backup2-"));
const dir2 = path.join(ROOT2, "ffffffffffffffff");
fs.mkdirSync(dir2, { recursive: true });
const refFile = writeBackupRefAudio(dir2, parsed.entries[0]);
ok(refFile === "ref.wav", "writeBackupRefAudio: tên file ref.wav");
ok(fs.readFileSync(path.join(dir2, refFile)).toString() === "RIFFxxxxWAVEfake-audio-1",
  "writeBackupRefAudio: bytes ghi đúng");
const entry2 = buildVoiceBackupEntry(ROOT2, {
  id: "ffffffffffffffff", name: "Giọng Thật 2277", refFile, refExt: ".wav",
  refDurationSec: 12.5, createdAt: "2026-11-11T00:00:00.000Z",
});
ok(entry2.refSha256 === backup.refSha256,
  "build lại từ file đã ghi: sha khớp backup gốc (round-trip ở tầng module)");

// [5] Tên file export: bỏ dấu, an toàn, có id.
ok(backupExportFilename("Giọng Thật 2277", "abcdef0123456789")
  === "vcut-voice-giong-that-2277-abcdef0123456789.json",
  "tên file export: bỏ dấu + slug + id");
ok(backupExportFilename("///", "abcdef0123456789")
  === "vcut-voice-voice-abcdef0123456789.json",
  "tên file export: tên toàn ký tự lạ → fallback 'voice'");
ok(!backupExportFilename("A/B", "abcdef0123456789").includes("/"),
  "tên file export: không chứa / (chống traversal)");

console.log(`\nbackup unit: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
