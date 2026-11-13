/**
 * timeouts.js — Timeout cho mọi lần spawn process trong render pipeline.
 *
 * Nợ đóng: Phase 9 đợt 73 §4 mục 8 (A8 phát hiện render.js:1805 dùng
 * spawnSync KHÔNG timeout — ffmpeg treo thì job treo theo, fallback
 * GPU→CPU không kích hoạt). Đợt 74 B4 rà toàn bộ pipeline và thêm
 * timeout cho MỌI điểm spawn đồng bộ còn thiếu (xem danh sách ở cuối
 * file). Module này là NGUỒN DUY NHẤT của các con số timeout để test
 * được công thức mà không cần chạy render thật.
 *
 * Nguyên tắc:
 * - Timeout encode ffmpeg PHẢI tỉ lệ với độ dài output, KHÔNG phải hằng
 *   số nhỏ cố định. Đề xuất của A8 ("1 lần thời lượng clip + đệm") là
 *   QUÁ CHẶT so với số đo thật: benchmark trên VM này
 *   (benchmarks/RESULTS.md) — 4K 10s tốn 110,5s wall (11,05s wall / 1s
 *   output, veryfast/23), 1080p preset mặc định medium/20 tốn 47,9s cho
 *   10s (4,79s/s). Hệ số mặc định 60s wall / 1s output cho ~5,4× biên
 *   trên nền 4K đo được + 120s cố định cho khởi động/graph/probe, đủ
 *   chỗ cho filter nặng (hqdn3d, vidstabtransform, minterpolate slow-mo).
 *   Render nào chậm hơn thì fail rõ ràng (exit 2 + log timeout) thay vì
 *   treo vô hạn — user nâng bằng --ffmpeg-timeout hoặc env.
 * - killSignal LUÔN là SIGKILL: SIGTERM (mặc định của Node) có thể bị
 *   tiến trình treo bỏ qua (vd lời gọi driver GPU kẹt); SIGKILL đảm bảo
 *   tiến trình chết và fallback kích hoạt. Ngoại lệ duy nhất: tiến trình
 *   đang ở D-state (uninterruptible sleep trong kernel/driver) thì
 *   KHÔNG signal nào giết được — timeout khi đó vẫn trả về sau khi
 *   Node chờ, và tiến trình mồ côi D-state phải được ghi nhận (không
 *   có cách giết từ userspace).
 * - Mọi env override không hợp lệ (không phải số, < 1000ms) đều RƠI VỀ
 *   mặc định, không crash — timeout là cơ chế an toàn, không được tự
 *   nó thành điểm fail.
 * - spawnSync trả về r.error.code === "ETIMEDOUT" + status null khi
 *   timeout (dùng isTimeoutResult để nhận diện, đừng đoán theo status).
 *
 * Cấu hình (env, đều tùy chọn):
 *   VCUT_ENCODE_TIMEOUT_MS      — override tuyệt đối cho bước encode
 *     ffmpeg (ms); --ffmpeg-timeout <giây> của render.js cũng ghi vào đây.
 *   VCUT_ENCODE_TIMEOUT_FACTOR  — giây wall cho mỗi giây output (mặc định 60).
 *   VCUT_ENCODE_TIMEOUT_BASE_MS — phần cố định (mặc định 120000).
 *   VCUT_RETRY_TIMEOUT_MS       — override tuyệt đối cho lần retry re-exec.
 *   VCUT_HELPER_TIMEOUT_MS      — override tuyệt đối cho helper python3.
 *   VCUT_DETECT_TIMEOUT_MS      — override tuyệt đối cho vidstabdetect.
 *   VCUT_PROBE_TIMEOUT_MS       — probe nhanh (-filters, -version; mặc định 15000,
 *     khớp timeout sẵn có của gpuencode.js tryEncode).
 *   VCUT_FFPROBE_TIMEOUT_MS     — probe media ffprobe (mặc định 30000).
 *   VCUT_MEASURE_TIMEOUT_MS     — fastMotion measureMotion (mặc định 300000).
 *
 * Điểm spawn đã có timeout sau đợt này (kiểm chứng bằng test
 * test_round74_b4_render_timeout.js):
 *   render.js  — ffmpeg encode bước 7, re-exec retry, 5 helper python3
 *     (measure_text / render_text_png / mask_png ×2 / mask_anim).
 *   validate.js — ffprobe probeFile (execFileSync).
 *   enhance.js — vidstabdetect (runStabilizeDetect), -filters (probeFilterSupport).
 *   trfCache.js — ffmpeg -version (ffmpegVersionLine).
 *   proxy.js   — ffprobe probeMedia + ffmpeg encode generateProxy (qua run()).
 *   fastMotion.js — measureMotion (chỉ test dùng phía server, vẫn chặn).
 *   gpuencode.js — tryEncode đã có timeout 15000 (đợt 64); đợt này thêm
 *     killSignal SIGKILL cho nhất quán.
 * Đã rà nhưng NGOÀI PHẠM VI đợt này (ghi rõ lý do, không sửa):
 *   server/bridge/src/index.js spawnJob — spawn BẤT ĐỒNG BỘ (không có
 *     option timeout của spawnSync); job render giờ đã tự kết thúc nhờ
 *     timeout trong worker nên bridge không còn treo vô hạn theo. Watchdog
 *     riêng ở tầng bridge là defense-in-depth, để đợt sau.
 *   server/bridge/src/beats.js, bgremove.js — spawn python AI service
 *     (không thuộc render pipeline); caption.js đã có timeout riêng.
 *   cli/src/commands/render.ts — đã có WORKER_TIMEOUT_MS 30 phút cố định
 *     (cả 2 đường streamed/quiet). Lưu ý: 30 phút cố định có thể cắt
 *     project 4K dài hợp lệ — nợ riêng của CLI, không đụng ở đây.
 */
"use strict";

/** Signal kill cho mọi timeout: xem lý do ở header (SIGTERM bị bỏ qua được). */
const KILL_SIGNAL = "SIGKILL";

/** Encode ffmpeg: phần cố định (ms) — khởi động + dựng graph + probe. */
const ENCODE_TIMEOUT_BASE_MS = 120_000;
/** Encode ffmpeg: ms wall cho mỗi giây output (60s/s ≈ 5,4× nền 4K đo được). */
const ENCODE_TIMEOUT_FACTOR_MS_PER_SEC = 60_000;
/** Retry re-exec: biên thêm trên encode timeout (khởi động lại worker +
 *  probe/helper trước khi encode của nó kịp chạy tới timeout riêng). */
const RETRY_TIMEOUT_MARGIN_MS = 300_000;
/** Helper python3 nhanh (đo/vẽ PNG): cố định + theo độ dài clip (mask_anim). */
const HELPER_TIMEOUT_BASE_MS = 60_000;
const HELPER_TIMEOUT_PER_SEC_MS = 10_000;
/** vidstabdetect: cố định + theo độ dài đoạn phân tích. */
const DETECT_TIMEOUT_BASE_MS = 60_000;
const DETECT_TIMEOUT_PER_SEC_MS = 10_000;
/** Probe nhanh: -filters, -version (khớp gpuencode.js tryEncode: 15000). */
const PROBE_TIMEOUT_MS = 15_000;
/** Probe media ffprobe (đọc header, không decode). */
const FFPROBE_TIMEOUT_MS = 30_000;
/** fastMotion measureMotion: decode toàn bộ file ở 160px — chậm nhất. */
const MEASURE_TIMEOUT_MS = 300_000;

/** Đọc env ms: chỉ nhận số nguyên ≥ 1000, còn lại trả mặc định. */
function envMs(name, def) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return def;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1000) return def;
  return n;
}

/** Đọc env hệ số (giây wall / giây output): chỉ nhận số > 0, còn lại mặc định. */
function envFactor(name, def) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return def;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return def;
  return n;
}

function saneDurationSec(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Timeout cho bước encode ffmpeg chính (render.js bước 7, proxy encode).
 * @param {number} durationSec thời lượng output (giây)
 * @param {number} [overrideMs] override tuyệt đối (CLI --ffmpeg-timeout);
 *   undefined → đọc env VCUT_ENCODE_TIMEOUT_MS.
 * @returns {number} ms, luôn ≥ 1000.
 */
function encodeTimeoutMs(durationSec, overrideMs) {
  if (overrideMs !== undefined && overrideMs !== null) {
    const n = Number(overrideMs);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1000) return n;
  }
  const abs = envMs("VCUT_ENCODE_TIMEOUT_MS", 0);
  if (abs > 0) return abs;
  const base = envMs("VCUT_ENCODE_TIMEOUT_BASE_MS", ENCODE_TIMEOUT_BASE_MS);
  const factor = envFactor("VCUT_ENCODE_TIMEOUT_FACTOR", ENCODE_TIMEOUT_FACTOR_MS_PER_SEC / 1000);
  return Math.max(1000, Math.ceil(base + saneDurationSec(durationSec) * factor * 1000));
}

/**
 * Timeout cho lần retry re-exec render.js (bước 7 fallback). Retry chạy
 * lại toàn bộ pipeline nên phải dài hơn encode timeout của chính nó +
 * biên khởi động; nếu retry tự timeout thì job fail rõ (exit 2).
 */
function retryTimeoutMs(durationSec, overrideMs) {
  if (overrideMs !== undefined && overrideMs !== null) {
    const n = Number(overrideMs);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1000) return n;
  }
  const abs = envMs("VCUT_RETRY_TIMEOUT_MS", 0);
  if (abs > 0) return abs;
  return encodeTimeoutMs(durationSec) + RETRY_TIMEOUT_MARGIN_MS;
}

/**
 * Timeout cho helper python3 nhanh (measure_text / render_text_png /
 * mask_png / mask_anim). mask_anim vẽ theo từng frame nên tỉ lệ với
 * độ dài clip; các helper khác truyền durationSec = 0.
 */
function helperTimeoutMs(durationSec, overrideMs) {
  if (overrideMs !== undefined && overrideMs !== null) {
    const n = Number(overrideMs);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1000) return n;
  }
  const abs = envMs("VCUT_HELPER_TIMEOUT_MS", 0);
  if (abs > 0) return abs;
  return Math.max(1000, HELPER_TIMEOUT_BASE_MS + saneDurationSec(durationSec) * HELPER_TIMEOUT_PER_SEC_MS);
}

/**
 * Timeout cho pass vidstabdetect (enhance.js runStabilizeDetect).
 * @param {number} segmentSec độ dài đoạn nguồn phân tích (giây).
 */
function detectTimeoutMs(segmentSec, overrideMs) {
  if (overrideMs !== undefined && overrideMs !== null) {
    const n = Number(overrideMs);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1000) return n;
  }
  const abs = envMs("VCUT_DETECT_TIMEOUT_MS", 0);
  if (abs > 0) return abs;
  return Math.max(1000, DETECT_TIMEOUT_BASE_MS + saneDurationSec(segmentSec) * DETECT_TIMEOUT_PER_SEC_MS);
}

/** Timeout cho probe nhanh: ffmpeg -filters / -version. */
function probeTimeoutMs(overrideMs) {
  if (overrideMs !== undefined && overrideMs !== null) {
    const n = Number(overrideMs);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1000) return n;
  }
  return envMs("VCUT_PROBE_TIMEOUT_MS", PROBE_TIMEOUT_MS);
}

/** Timeout cho ffprobe đọc metadata media. */
function ffprobeTimeoutMs(overrideMs) {
  if (overrideMs !== undefined && overrideMs !== null) {
    const n = Number(overrideMs);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1000) return n;
  }
  return envMs("VCUT_FFPROBE_TIMEOUT_MS", FFPROBE_TIMEOUT_MS);
}

/** Timeout cho fastMotion measureMotion (decode toàn bộ file). */
function measureTimeoutMs(overrideMs) {
  if (overrideMs !== undefined && overrideMs !== null) {
    const n = Number(overrideMs);
    if (Number.isFinite(n) && Number.isInteger(n) && n >= 1000) return n;
  }
  return envMs("VCUT_MEASURE_TIMEOUT_MS", MEASURE_TIMEOUT_MS);
}

/** Kết quả spawnSync có phải do timeout không (Node đặt error.code ETIMEDOUT). */
function isTimeoutResult(r) {
  return !!(r && r.error && r.error.code === "ETIMEDOUT");
}

module.exports = {
  KILL_SIGNAL,
  ENCODE_TIMEOUT_BASE_MS,
  ENCODE_TIMEOUT_FACTOR_MS_PER_SEC,
  RETRY_TIMEOUT_MARGIN_MS,
  HELPER_TIMEOUT_BASE_MS,
  HELPER_TIMEOUT_PER_SEC_MS,
  DETECT_TIMEOUT_BASE_MS,
  DETECT_TIMEOUT_PER_SEC_MS,
  PROBE_TIMEOUT_MS,
  FFPROBE_TIMEOUT_MS,
  MEASURE_TIMEOUT_MS,
  encodeTimeoutMs,
  retryTimeoutMs,
  helperTimeoutMs,
  detectTimeoutMs,
  probeTimeoutMs,
  ffprobeTimeoutMs,
  measureTimeoutMs,
  isTimeoutResult,
};
