"use strict";
/**
 * clonedVoices.js — Giọng đã clone LƯU LẠI ĐƯỢC cho TTS local (Phase 9 đợt 84 L8).
 *
 * Khoảng trống nó lấp: từ R4 (2026-10-24) bridge đã có `POST /api/tts/clone`
 * (clone 1 lần: upload mẫu + text → WAV, mẫu bị xóa ngay) và UI checkbox
 * "Clone giọng từ file mẫu" — nhưng KHÔNG lưu được giọng đã clone để dùng
 * lại như 1 giọng preset. Module này là kho giọng clone bền vững:
 *
 *   <root>/voices.json            registry { version, voices: [...] }
 *   <root>/<id>/ref.<ext>         file giọng mẫu đã lưu (1 giọng = 1 thư mục)
 *
 * - root mặc định: ~/.vcut/cloned-voices (KHÔNG nằm dưới WORK_ROOT/tmpdir
 *   của bridge — VM từng reboot 2 lần trong đợt 83, file trong tmp sẽ mất;
 *   giọng user tạo phải sống qua lần khởi động bridge sau). Override bằng
 *   env BRIDGE_CLONED_VOICES_DIR (test/e2e dùng thư mục tạm riêng).
 * - Tạo giọng = lưu mẫu tạm → chạy câu thăm dò bằng tts.py --ref-audio
 *   (verify mẫu thật sự tổng hợp được) → ghi registry. Hủy/lỗi giữa chừng
 *   → xóa thư mục tạm, KHÔNG để lại giọng dở dang trong registry.
 * - Dùng giọng đã lưu: POST /api/tts { clonedVoiceId } → bridge tự lấy
 *   ref audio đã lưu, chạy tts.py --ref-audio như clone 1 lần.
 * - Mọi thao tác file đều đồng bộ (fs sync) để cặp đọc-ghi registry không
 *   bị xen ngang giữa 2 request trong cùng 1 process Node.
 *
 * License: không model/API mới — vẫn VieNeu-TTS v3 Turbo 0.5B Apache-2.0
 * như tts.py; watermark vẫn TẮT ở mọi đường gọi (xem TTS_LIMITS.md).
 */

const fs = require("fs");
const os = require("os");
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port CJS của
// apps/web/scripts/eperm-retry.mjs; xem server/eperm-retry.cjs).
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const { execFileSync } = require("child_process");
const { codedError } = require("./errorCodes"); // Đợt 62 R5: mã lỗi bridge→web
const { newJobId } = require("./jobQueue");
const { REF_AUDIO_EXTS, MAX_REF_AUDIO_BYTES } = require("./tts");

// Số giọng clone tối đa lưu cùng lúc (20 giọng × 20MB mẫu = tối đa ~400MB).
const MAX_CLONED_VOICES = 20;
// Tên giọng: 1–40 ký tự sau trim.
const MAX_VOICE_NAME_LEN = 40;
// Câu thăm dò khi tạo giọng: ngắn (~35 ký tự → 1 chunk), đủ để verify
// mẫu tổng hợp được trước khi ghi registry.
const PROBE_TEXT = "Xin chào, đây là giọng mới của tôi.";
// Id giọng: 16 ký tự hex do newJobId() tạo (như token ai-download).
const VOICE_ID_RE = /^[0-9a-f]{16}$/;
// Tên giọng cho phép: chữ/số/khoảng trắng/dấu - _ . (không mở đầu bằng dấu
// chấm, không chứa / \ hay ký tự điều khiển) — tên chỉ hiển thị trong UI
// và KHÔNG bao giờ dùng làm tên file/thư mục (thư mục dùng id hex).
const VOICE_NAME_RE = /^[^\s./\\][^/\\]*$/;

/** Thư mục gốc kho giọng clone (env thắng mặc định). */
function clonedVoicesRootFromEnv(env = process.env) {
  const fromEnv = String(env.BRIDGE_CLONED_VOICES_DIR || "").trim();
  if (fromEnv) return fromEnv;
  return path.join(os.homedir(), ".vcut", "cloned-voices");
}

/** Validate tên giọng; throw codedError → endpoint trả 400. */
function validateClonedVoiceName(raw, existingNames = []) {
  const name = String(raw ?? "").trim();
  if (!name) {
    throw codedError("TTS_CLONED_VOICE_NAME_EMPTY", "Chưa nhập tên cho giọng clone.");
  }
  if (name.length > MAX_VOICE_NAME_LEN) {
    throw codedError("TTS_CLONED_VOICE_NAME_TOO_LONG",
      `Tên giọng tối đa ${MAX_VOICE_NAME_LEN} ký tự (đang ${name.length}).`,
      { max: MAX_VOICE_NAME_LEN, length: name.length });
  }
  if (!VOICE_NAME_RE.test(name) || /[\u0000-\u001f\u007f]/.test(name)) {
    throw codedError("TTS_CLONED_VOICE_NAME_EMPTY",
      "Tên giọng không chứa ký tự / \\ hay ký tự điều khiển.");
  }
  const dup = (existingNames || []).some(
    (n) => String(n).trim().toLowerCase() === name.toLowerCase());
  if (dup) {
    throw codedError("TTS_CLONED_VOICE_NAME_DUP",
      `Đã có giọng tên "${name}" — chọn tên khác.`, { name });
  }
  return name;
}

/** Validate id giọng (16 hex); throw 404-style codedError khi sai dạng. */
function validateClonedVoiceId(raw) {
  const id = String(raw ?? "").trim();
  if (!VOICE_ID_RE.test(id)) {
    throw codedError("TTS_CLONED_VOICE_NOT_FOUND",
      "Không tìm thấy giọng đã clone.");
  }
  return id;
}

function registryPath(root) {
  return path.join(root, "voices.json");
}

/** Đọc registry; thiếu file → rỗng; JSON hỏng → lỗi rõ (không lặng lẽ mất giọng). */
function readRegistry(root) {
  const p = registryPath(root);
  if (!fs.existsSync(p)) return { version: 1, voices: [] };
  let raw;
  try {
    raw = fs.readFileSync(p, "utf8");
  } catch (e) {
    throw codedError("TTS_CLONED_VOICE_REGISTRY",
      `Không đọc được registry giọng đã clone: ${e.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw codedError("TTS_CLONED_VOICE_REGISTRY",
      "Registry giọng đã clone bị hỏng (không phải JSON) — sửa/xóa file voices.json rồi thử lại.");
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.voices)) {
    throw codedError("TTS_CLONED_VOICE_REGISTRY",
      "Registry giọng đã clone sai cấu trúc — sửa/xóa file voices.json rồi thử lại.");
  }
  return data;
}

/** Ghi registry nguyên tử (tmp + rename) — không để lại file nửa vời. */
function writeRegistry(root, data) {
  fs.mkdirSync(root, { recursive: true });
  const p = registryPath(root);
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  writeFileEpermRetry(tmp, JSON.stringify(data, null, 2) + "\n", { label: "bridge-cloned-voices-registry" });
  fs.renameSync(tmp, p);
}

/** Bản ghi công khai của 1 giọng (KHÔNG lộ đường dẫn tuyệt đối). */
function publicVoice(v) {
  return {
    id: v.id,
    name: v.name,
    refExt: v.refExt,
    refDurationSec: typeof v.refDurationSec === "number" ? v.refDurationSec : null,
    createdAt: v.createdAt,
  };
}

/** Liệt kê giọng đã lưu (mới nhất trước). */
function listClonedVoices(root) {
  const data = readRegistry(root);
  return data.voices
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map(publicVoice);
}

/** Lấy 1 giọng theo id (bản ghi đầy đủ nội bộ); không có → throw 404. */
function getClonedVoice(root, rawId) {
  const id = validateClonedVoiceId(rawId);
  const data = readRegistry(root);
  const v = data.voices.find((x) => x.id === id);
  if (!v) {
    throw codedError("TTS_CLONED_VOICE_NOT_FOUND",
      "Không tìm thấy giọng đã clone.");
  }
  return v;
}

/** Đường dẫn file mẫu đã lưu của 1 giọng (kiểm tra prefix chống traversal). */
function clonedVoiceRefPath(root, voice) {
  const dir = path.join(root, voice.id);
  const full = path.join(dir, voice.refFile);
  if (!full.startsWith(dir + path.sep) || !fs.existsSync(full)) return null;
  return full;
}

/**
 * Đo thời lượng file audio (giây) qua ffprobe; null nếu không đo được
 * (ffprobe thiếu/file lỗi) — caller vẫn cho qua vì tts.py tự chặn mẫu
 * >120s ở bước tổng hợp.
 */
function probeAudioDurationSec(filePath) {
  const ffprobe = process.env.FFPROBE || "ffprobe";
  try {
    const out = execFileSync(ffprobe,
      ["-v", "quiet", "-print_format", "json", "-show_format", filePath],
      { encoding: "utf8", timeout: 30_000 });
    const d = JSON.parse(out || "{}");
    const dur = parseFloat(d && d.format && d.format.duration);
    return Number.isFinite(dur) && dur > 0 ? dur : null;
  } catch {
    return null;
  }
}

/**
 * Bước 1 tạo giọng: dời file mẫu upload vào thư mục riêng <root>/<id>/,
 * CHƯA ghi registry (giọng chỉ "tồn tại" sau khi câu thăm dò tổng hợp
 * thành công ở bước 2). Validate tên + số lượng + trùng tên ở đây.
 * @returns {{ id, dir, refPath, refExt, name }}
 */
function prepareClonedVoice(root, { name: rawName, tmpUploadPath, ext }) {
  const data = readRegistry(root);
  if (data.voices.length >= MAX_CLONED_VOICES) {
    throw codedError("TTS_CLONED_VOICE_LIMIT",
      `Đã lưu tối đa ${MAX_CLONED_VOICES} giọng clone — xóa bớt giọng cũ rồi tạo mới.`,
      { max: MAX_CLONED_VOICES });
  }
  const name = validateClonedVoiceName(rawName, data.voices.map((v) => v.name));
  const refExt = String(ext || "").toLowerCase();
  if (!REF_AUDIO_EXTS.includes(refExt)) {
    throw codedError("TTS_REF_AUDIO_TYPE",
      `File giọng mẫu phải là audio (${REF_AUDIO_EXTS.join(", ")}).`,
      { exts: REF_AUDIO_EXTS.join(", ") });
  }
  const id = newJobId();
  const dir = path.join(root, id);
  fs.mkdirSync(dir, { recursive: true });
  const refFile = `ref${refExt}`;
  const refPath = path.join(dir, refFile);
  try {
    fs.renameSync(tmpUploadPath, refPath);
  } catch (e) {
    if (e.code !== "EXDEV") throw e;
    fs.copyFileSync(tmpUploadPath, refPath);
    fs.rmSync(tmpUploadPath, { force: true });
  }
  return { id, dir, refPath, refExt, refFile, name };
}

/** Bước 2 tạo giọng: ghi registry sau khi câu thăm dò tổng hợp xong. */
function commitClonedVoice(root, { id, dir, name, refFile, refExt, refDurationSec }) {
  const data = readRegistry(root);
  if (data.voices.length >= MAX_CLONED_VOICES) {
    throw codedError("TTS_CLONED_VOICE_LIMIT",
      `Đã lưu tối đa ${MAX_CLONED_VOICES} giọng clone — xóa bớt giọng cũ rồi tạo mới.`,
      { max: MAX_CLONED_VOICES });
  }
  // Kiểm tra trùng tên lần nữa (2 request tạo cùng tên cùng lúc).
  validateClonedVoiceName(name, data.voices.map((v) => v.name));
  if (data.voices.some((v) => v.id === id)) {
    throw codedError("TTS_CLONED_VOICE_NAME_DUP",
      "Giọng này đã được lưu rồi.", { name });
  }
  const entry = {
    id,
    name,
    refFile,
    refExt,
    refDurationSec: typeof refDurationSec === "number" ? refDurationSec : null,
    createdAt: new Date().toISOString(),
  };
  data.voices.push(entry);
  writeRegistry(root, data);
  return publicVoice(entry);
}

/** Xóa thư mục tạm của giọng chưa commit (hủy/lỗi giữa chừng) — không throw. */
function discardClonedVoiceDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* bỏ qua */ }
}

/** Xóa hẳn 1 giọng đã lưu (registry + file mẫu); không có → throw 404. */
function deleteClonedVoice(root, rawId) {
  const id = validateClonedVoiceId(rawId);
  const data = readRegistry(root);
  const idx = data.voices.findIndex((v) => v.id === id);
  if (idx === -1) {
    throw codedError("TTS_CLONED_VOICE_NOT_FOUND",
      "Không tìm thấy giọng đã clone.");
  }
  const [removed] = data.voices.splice(idx, 1);
  writeRegistry(root, data);
  discardClonedVoiceDir(path.join(root, id));
  return { id, name: removed.name };
}

// ---------------------------------------------------------------------------
// Export / backup giọng clone — Phase 9 đợt 85 M7.
//
// Nợ L8 §8: "không backup/export. Xóa home dir hoặc đổi máy → mất giọng".
// Định dạng backup: 1 file JSON (KHÔNG zip — bridge không có dep zip nào,
// thêm dep chỉ để nén là không đáng; JSON base64 vẫn import lại được y
// hệt, xem parseVoiceBackup). File backup chứa TOÀN BỘ file mẫu (base64)
// + sha256 để import verify tính toàn vẹn trước khi ghi.
//   { format: "vcut-cloned-voice", version: 1, exportedAt,
//     voice: { name, refExt, refDurationSec, createdAt },
//     refAudioBase64, refSha256 }
//   { format: "vcut-cloned-voices-backup", version: 1, exportedAt, count,
//     voices: [ { voice, refAudioBase64, refSha256 }, ... ] }
// File backup là dữ liệu nhạy cảm theo nghĩa nó LÀ giọng của user — chỉ
// lưu/truyền theo ý user, không commit vào repo, không tự upload đi đâu.
// ---------------------------------------------------------------------------
const VOICE_BACKUP_FORMAT = "vcut-cloned-voice";
const VOICES_BACKUP_FORMAT = "vcut-cloned-voices-backup";
const BACKUP_VERSION = 1;
// File backup tối đa 30MB: ref audio ≤20MB → base64 ~27MB + JSON overhead.
// Multer cho file tới 2GB nên cap này là cap của riêng định dạng backup.
const MAX_BACKUP_BYTES = 30 * 1024 * 1024;

function sha256Buffer(buf) {
  return require("crypto").createHash("sha256").update(buf).digest("hex");
}

/** 1 entry backup (voice + ref audio base64 + sha256) cho 1 giọng đã lưu. */
function buildVoiceBackupEntry(root, voice) {
  const refPath = clonedVoiceRefPath(root, voice);
  if (!refPath) {
    throw codedError("TTS_CLONED_VOICE_NOT_FOUND",
      `Giọng "${voice.name}" mất file mẫu — không xuất được.`);
  }
  const buf = fs.readFileSync(refPath);
  if (buf.length > MAX_REF_AUDIO_BYTES) {
    throw codedError("TTS_REF_AUDIO_TOO_LARGE",
      `File giọng mẫu quá lớn (${(buf.length / 1048576).toFixed(1)}MB > 20MB).`,
      { sizeMb: (buf.length / 1048576).toFixed(1) });
  }
  return {
    voice: {
      name: voice.name,
      refExt: voice.refExt,
      refDurationSec: typeof voice.refDurationSec === "number" ? voice.refDurationSec : null,
      createdAt: voice.createdAt,
    },
    refAudioBase64: buf.toString("base64"),
    refSha256: sha256Buffer(buf),
  };
}

/** Backup 1 giọng: object JSON sẵn sàng ghi file / trả HTTP. */
function buildVoiceBackup(root, voice) {
  return {
    format: VOICE_BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...buildVoiceBackupEntry(root, voice),
  };
}

/** Backup TOÀN BỘ giọng đã lưu (1 file JSON): giọng mất file mẫu bị bỏ qua. */
function buildAllVoicesBackup(root) {
  const data = readRegistry(root);
  const voices = [];
  const skipped = [];
  for (const v of data.voices) {
    try {
      voices.push(buildVoiceBackupEntry(root, v));
    } catch {
      skipped.push({ name: v.name, reason: "missing-ref" });
    }
  }
  return {
    format: VOICES_BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    count: voices.length,
    voices,
    skipped,
  };
}

/**
 * Tên file export an toàn: "vcut-voice-<tên>-<id>.json" — tên chỉ để hiển
 * thị, bỏ dấu/ký tự lạ, tối đa 40 ký tự; không bao giờ dùng tên user làm
 * đường dẫn trên server (chỉ là tên file tải về ở client).
 */
function backupExportFilename(name, id) {
  const slug = String(name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40) || "voice";
  return `vcut-voice-${slug}-${id}.json`;
}

/**
 * Parse + validate file backup (chuỗi JSON đã đọc từ file upload).
 * @returns {{ kind: "single"|"multi", entries: Array<{name,refExt,refDurationSec,refAudioBase64,refSha256,createdAt}> }}
 * Lỗi cấu trúc / sha không khớp / ref quá lớn → codedError
 * TTS_CLONED_VOICE_REGISTRY (tái dùng mã "registry hỏng" của L8 — không
 * thêm mã mới để khỏi phá khóa 3 chiều server/web/dict).
 */
function parseVoiceBackup(rawText) {
  const bad = (msg) => codedError("TTS_CLONED_VOICE_REGISTRY",
    `File backup giọng không hợp lệ: ${msg}`);
  if (typeof rawText !== "string" || rawText.length === 0) {
    throw bad("file rỗng.");
  }
  if (Buffer.byteLength(rawText, "utf8") > MAX_BACKUP_BYTES) {
    throw bad(`file quá lớn (tối đa ${MAX_BACKUP_BYTES / 1048576}MB).`);
  }
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw bad("không phải JSON.");
  }
  if (!data || typeof data !== "object") throw bad("không phải object JSON.");
  let entries;
  if (data.format === VOICE_BACKUP_FORMAT) {
    if (data.version !== BACKUP_VERSION) {
      throw bad(`version không hỗ trợ (${data.version}).`);
    }
    entries = [data];
  } else if (data.format === VOICES_BACKUP_FORMAT) {
    if (data.version !== BACKUP_VERSION) {
      throw bad(`version không hỗ trợ (${data.version}).`);
    }
    if (!Array.isArray(data.voices) || data.voices.length === 0) {
      throw bad("backup toàn bộ nhưng không có giọng nào.");
    }
    entries = data.voices;
  } else {
    throw bad(`format lạ (${data.format ?? "?"}), cần "${VOICE_BACKUP_FORMAT}" hoặc "${VOICES_BACKUP_FORMAT}".`);
  }
  return {
    kind: data.format === VOICES_BACKUP_FORMAT ? "multi" : "single",
    entries: entries.map((e, i) => parseVoiceBackupEntry(e, i, bad)),
  };
}

function parseVoiceBackupEntry(e, i, bad) {
  const where = `giọng thứ ${i + 1}`;
  if (!e || typeof e !== "object") throw bad(`${where}: không phải object.`);
  const v = e.voice;
  if (!v || typeof v !== "object") throw bad(`${where}: thiếu voice.`);
  const name = String(v.name ?? "").trim();
  if (!name) throw bad(`${where}: thiếu tên giọng.`);
  const refExt = String(v.refExt || "").toLowerCase();
  if (!REF_AUDIO_EXTS.includes(refExt)) {
    throw bad(`${where}: đuôi mẫu lạ (${v.refExt ?? "?"}).`);
  }
  if (typeof e.refAudioBase64 !== "string" || !e.refAudioBase64) {
    throw bad(`${where}: thiếu refAudioBase64.`);
  }
  let buf;
  try {
    buf = Buffer.from(e.refAudioBase64, "base64");
  } catch {
    throw bad(`${where}: base64 hỏng.`);
  }
  // Base64 hợp lệ phải round-trip đúng (chặn chuỗi rác vẫn decode được).
  if (buf.toString("base64").replace(/=+$/, "") !== e.refAudioBase64.replace(/=+$/, "")) {
    throw bad(`${where}: base64 không chuẩn.`);
  }
  if (buf.length === 0) throw bad(`${where}: file mẫu rỗng.`);
  if (buf.length > MAX_REF_AUDIO_BYTES) {
    throw codedError("TTS_REF_AUDIO_TOO_LARGE",
      `File giọng mẫu trong backup quá lớn (${(buf.length / 1048576).toFixed(1)}MB > 20MB).`,
      { sizeMb: (buf.length / 1048576).toFixed(1) });
  }
  if (typeof e.refSha256 !== "string" || sha256Buffer(buf) !== e.refSha256.toLowerCase()) {
    throw bad(`${where}: sha256 không khớp — file backup đã bị sửa/hỏng.`);
  }
  return {
    name,
    refExt,
    refDurationSec: typeof v.refDurationSec === "number" ? v.refDurationSec : null,
    refAudioBase64: e.refAudioBase64,
    refSha256: e.refSha256.toLowerCase(),
    createdAt: typeof v.createdAt === "string" ? v.createdAt : null,
  };
}

/**
 * Ghi file mẫu từ 1 entry backup đã validate vào thư mục giọng MỚI
 * (dir đã tạo bởi prepareClonedVoice — KHÔNG dùng prepare vì nó rename
 * file upload; ở đây bytes đã có trong RAM). Trả về tên file ref.
 */
function writeBackupRefAudio(dir, entry) {
  const refFile = `ref${entry.refExt}`;
  const refPath = path.join(dir, refFile);
  if (!refPath.startsWith(dir + path.sep)) {
    throw codedError("TTS_CLONED_VOICE_REGISTRY", "Đường dẫn file mẫu không hợp lệ.");
  }
  const buf = Buffer.from(entry.refAudioBase64, "base64");
  writeFileEpermRetry(refPath, buf, { label: "bridge-cloned-voice-backup-ref" });
  if (sha256Buffer(fs.readFileSync(refPath)) !== entry.refSha256) {
    try { fs.rmSync(refPath, { force: true }); } catch { /* bỏ qua */ }
    throw codedError("TTS_CLONED_VOICE_REGISTRY",
      "Ghi file mẫu xong nhưng sha256 không khớp — đã xóa file vừa ghi.");
  }
  return refFile;
}

module.exports = {
  MAX_CLONED_VOICES,
  MAX_VOICE_NAME_LEN,
  MAX_REF_AUDIO_BYTES,
  PROBE_TEXT,
  VOICE_ID_RE,
  clonedVoicesRootFromEnv,
  validateClonedVoiceName,
  validateClonedVoiceId,
  readRegistry,
  listClonedVoices,
  getClonedVoice,
  clonedVoiceRefPath,
  probeAudioDurationSec,
  prepareClonedVoice,
  commitClonedVoice,
  discardClonedVoiceDir,
  deleteClonedVoice,
  publicVoice,
  // Đợt 85 M7: export/backup + import giọng clone.
  VOICE_BACKUP_FORMAT,
  VOICES_BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  sha256Buffer,
  buildVoiceBackup,
  buildVoiceBackupEntry,
  buildAllVoicesBackup,
  backupExportFilename,
  parseVoiceBackup,
  writeBackupRefAudio,
};
