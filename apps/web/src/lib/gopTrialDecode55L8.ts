// gopTrialDecode55L8.ts — Phase 9 đợt 55, luồng L8: trial-decode bất đồng bộ
// (fail-open) cho kiểm tra GOP T3.
//
// BỐI CẢNH (LIMITS K8 §3): probe VideoDecoder thật trên Chromium headed
// chứng minh decoder bắt được đúng lớp moov giả mà AVCC không bắt được —
// mẫu "AVCC-đúng-cấu-trúc nhưng H.264-rác" qua được `validateAvccSample`
// nhưng VideoDecoder lỗi trong 0,5 ms ("wasn't a key frame"); sample thật
// decode OK ra frame trong 15,5 ms (lần 1: 17,1 ms). K8 KHÔNG nối vào T3
// vì (a) cần decode bất đồng bộ trong đường fetch, (b) không test được
// trong Node. Module này là lớp trừu tượng "decode-probe" mà K8 §3.2 đề
// xuất: probe inject được, fail-open khi không có decoder.
//
// NGUYÊN TẮC FAIL-OPEN (cứng): trial-decode chỉ là LỚP CHẶN thêm, không
// phải cổng chứng minh file đúng. Mọi trường hợp không kết luận được —
// không có VideoDecoder (Node, Safari cũ), probe ném lỗi, timeout — đều
// cho qua (passed=true, skipped=true) để file thật không bao giờ bị chặn
// oan vì môi trường decode. Chỉ khi decoder trả lời RÕ RÀNG là "decode
// lỗi" thì T3 mới fallback về full-file (vẫn phát được, chỉ chậm hơn).
// Đợt 56 M10 (c) — file H.264 hợp lệ nhưng decoder của máy người dùng
// không hỗ trợ profile (vd High 4:4:4) cũng fail-open: probe trả kết
// quả riêng `"unsupported-config"` (isConfigSupported báo không hỗ trợ,
// hoặc lỗi configure/decode mang thông điệp unsupported) → cho qua,
// không tính là decode-failed.
//
// THIẾT KẾ:
//   - `GopTrialDecodeProbe`: hàm inject `(sample, config) => Promise<boolean>`
//     — true = decode ra frame OK, false = decode lỗi thật. Probe KHÔNG
//     bao giờ được throw ra ngoài (bản thân probe trình duyệt đã catch
//     hết và trả false); wrapper `runTrialDecode` vẫn phòng thủ thêm.
//   - `createBrowserTrialDecodeProbe()`: probe production dùng VideoDecoder
//     thật; trả null khi `typeof VideoDecoder === "undefined"` (Node /
//     trình duyệt không có WebCodecs) — T3 khi đó bỏ qua trial-decode.
//   - `runTrialDecode(...)`: bọc probe bằng timeout + fail-open. Timeout
//     mặc định 200 ms cho sample nhỏ (xem `DEFAULT_TRIAL_DECODE_TIMEOUT_MS`),
//     tăng theo kích thước sample từ 256 KiB trở lên, trần 2500 ms (đợt 58
//     O6 — xem `trialDecodeTimeoutForSampleSize`). Đợt 61 R7: truyền
//     AbortSignal cho probe và abort khi timeout thắng race để dừng
//     decoder nền (trước đây decoder vẫn decode dở ~28 s sau timeout).
//   - T3 chỉ gọi trial-decode SAU khi lớp K8 đã pass (bố cục/ctts/stss) và
//     SAU kiểm AVCC sample 0 — tránh tốn decode cho file đã fail rẻ —
//     và CHỈ khi đã có đủ toàn bộ sample 0 (stream-mode: sample 0 phải
//     ≤ cap fetch 256 KiB, hoặc ≤ 64 MiB thì T3 fetch thêm phần còn lại
//     theo chunk 512 KiB rồi ráp lại — đợt 57 N10 (8 MiB), đợt 59 P6
//     (32 MiB), đợt 60 Q5 (64 MiB); all-mode: GOP 0 đã fetch đủ range
//     nên luôn đủ). Decode tiền tố cắt dở của sample lớn sẽ lỗi oan
//     file thật nên sample > 64 MiB vẫn BỎ QUA (fail-open). Đợt 60 Q5
//     (b): khi probe null (caller tắt trial-decode) thì T3 không fetch
//     remainder nữa — xem gopRangeFetch39T3.ts (đóng nợ N10 §6.2).
import type { Mp4VideoTrack } from "./mp4Demux";

/** Cấu hình decoder cho 1 lần trial-decode (lấy từ track đã demux). */
export interface TrialDecodeConfig {
  /** Codec string, vd "avc1.64001F" (từ avcC của track). */
  codec: string;
  codedWidth: number;
  codedHeight: number;
  /** Nội dung box avcC (không gồm header box) — description của decoder. */
  description: Uint8Array;
}

/**
 * Kết quả 1 lần probe trial-decode (đợt 56 M10 — thêm "unsupported-config"):
 * - true = decode ra frame OK.
 * - false = decoder báo lỗi THẬT (bitstream hỏng — T3 fallback).
 * - "unsupported-config" = decoder không hỗ trợ codec/profile của file
 *   (vd High 4:4:4 trên máy không có decoder đó) — KHÔNG phải lỗi file,
 *   caller fail-open (cho qua) thay vì chặn oan.
 * - { failed: true, reason } = decoder báo lỗi THẬT KÈM lý do chẩn đoán
 *   (đợt 78 F8 — chỉ worker probe tạo ra dạng này hôm nay, xem
 *   `GopTrialDecodeProbeFailure`): `runTrialDecode` giữ nguyên lý do
 *   (không qua dict i18n — giống "decode-ok" / "probe-error", là chuỗi
 *   log tiếng Anh, không phải UI) để T3 fallback với đúng lý do đó.
 */
export type GopTrialDecodeProbeOutcome = boolean | "unsupported-config" | GopTrialDecodeProbeFailure;

/**
 * Đợt 78 F8 — probe failure có kèm lý do chẩn đoán (đóng nợ đợt 77 §4.8).
 *
 * VẤN ĐỀ CŨ: protocol worker chỉ mang boolean (`TrialDecodeWorkerResponse`
 * `{ type: "result", outcome }`) nên lý do quét zero-run trong worker bị
 * mất — về tới T3 thành `decode-failed` chung chung (đúng hành vi
 * full-file, sai chẩn đoán). Dạng này là kênh mang lý do đó từ worker
 * probe qua `runTrialDecode` tới T3 mà KHÔNG đổi chữ ký probe:
 * probe cũ vẫn trả boolean / "unsupported-config" như trước (tương thích
 * ngược — xem test F8: worker cũ không gửi `reason` thì vẫn ra
 * `decode-failed` như cũ).
 *
 * QUY ƯỚC: `reason` là chuỗi chẩn đoán tiếng Anh, ngắn (worker cắt 200
 * ký tự), dạng `<kind>: <detail>` — hôm nay chỉ có `zero-run: ...`
 * (đúng định dạng T3 tự tổng hợp ở đường main-thread,
 * `zero-run: ${scan.reason}` — fallback message giống hệt nhau ở cả 2
 * đường). `runTrialDecode` dùng nguyên văn, không qua dict i18n.
 */
export interface GopTrialDecodeProbeFailure {
  /** Luôn true — phân biệt với boolean false (lỗi không rõ lý do). */
  failed: true;
  /** Lý do chẩn đoán, vd "zero-run: zero-run 1048576 bytes at offset ...". */
  reason: string;
}

/**
 * Probe trial-decode (inject được): decode thử 1 sample keyframe, trả
 * true khi decoder ra frame OK, false khi decoder báo lỗi thật,
 * "unsupported-config" khi decoder không hỗ trợ codec/profile.
 * Probe không throw (lỗi nội bộ → false); wrapper vẫn phòng thủ.
 *
 * Đợt 61 R7 — tham số thứ 3 `signal?: AbortSignal`: `runTrialDecode`
 * truyền signal của nó và `abort()` khi timeout thắng race, để probe
 * dừng công việc nền (browser probe gọi `VideoDecoder.close()` ngay
 * khi abort — trước đây decoder vẫn decode dở ~28 s sau timeout trên
 * sample 42,5 MB, xem LIMITS Q5 §6.4). Probe cũ chỉ nhận 2 tham số vẫn
 * gán được cho kiểu này (tham số tùy chọn); probe không quan tâm signal
 * thì cứ bỏ qua — timeout vẫn trả fail-open như cũ, chỉ không dừng
 * được nền (hành vi cũ).
 */
export type GopTrialDecodeProbe = (
  sample: Uint8Array,
  config: TrialDecodeConfig,
  signal?: AbortSignal,
) => Promise<GopTrialDecodeProbeOutcome>;

/**
 * Timeout mặc định cho 1 lần trial-decode: 200 ms.
 * Đo thật (K8 §3.1, Chromium headed): sample thật 720p decode OK trong
 * 15,5–17,1 ms; mẫu rác lỗi trong 0,5–1,6 ms — 200 ms là ~12× headroom
 * cho máy chậm/tải nặng, đồng thời chặn cứng đường mở file không kẹt
 * quá 200 ms vì decoder treo. Timeout → fail-open (cho qua), không chặn.
 * Đây là timeout GỐC cho sample nhỏ (≤ 256 KiB); sample lớn hơn dùng
 * timeout tăng theo kích thước — xem `trialDecodeTimeoutForSampleSize`
 * (đợt 58 O6, đóng nợ đợt 57 §6.4).
 */
export const DEFAULT_TRIAL_DECODE_TIMEOUT_MS = 200;

/**
 * Timeout trial-decode theo kích thước sample (đợt 58 O6 — đóng nợ
 * đợt 57 §6.4: keyframe 4K nhiễu 4.107.475 byte decode không kịp
 * timeout 200 ms → fail-open, moov giả có sample 0 là keyframe
 * thật-lớn-nhiễu không bị chặn chắc).
 *
 * Đo thật (Chromium headed, máy này, loadavg lúc đo ~2–3, LIMITS O6 §1):
 *   size 29.245 B (720p)       → decode median 10,2 ms, p95 58,7 ms
 *   size 300.148 B (4K)        → decode median 69,5 ms, p95 89,5 ms
 *   size 460.756 B (4K lossless) → decode median 105,4 ms, p95 125,1 ms
 *   size 4.107.475 B (4K nhiễu) → decode median 622,6 ms, p95 1.158,2 ms
 * Tốc độ decode đo được ≈ 0,15 ms/KiB (từ 300 KiB lên 4,1 MiB).
 * Quy tắc: sample ≤ 256 KiB giữ nguyên timeout gốc (không đổi hành vi
 * đường nhỏ); phần vượt 256 KiB cộng 0,3 ms/KiB — gấp 2× tốc độ decode
 * đo được (headroom cho máy tải/nóng hơn) — rồi kẹp trần 2500 ms để
 * trial-decode không kẹt đường mở file quá 2,5 s dù sample chạm cap
 * 64 MiB (đợt 60 Q5 — 8 MiB trở lên đều chạm trần). Rác lớn fail NHANH (4,1 MiB ngẫu nhiên median 5,1 ms; cắt đuôi
 * 2,5 ms — đo cùng đợt) nên timeout dài hơn không làm rác lọt: verdict
 * vẫn ra trước khi hết timeout; timeout dài chỉ giúp keyframe thật-lớn
 * decode kịp để có verdict thay vì fail-open mù.
 * Sample > 64 MiB vẫn bỏ qua trial-decode như cũ (cap của T3, đợt 60
 * Q5) nên timeout này thực tế không bao giờ áp cho sample > 64 MiB ở
 * stream-mode. Keyframe thật ≳16 MiB decode ~0,15 ms/KiB (≈ 2,4 s ở
 * 16 MiB) nên vẫn có thể timeout → fail-open dù đã chạm trần — xem
 * LIMITS P6 §2 (đo thật trên keyframe 8K).
 */
export const TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES = 256 * 1024;
/** Thêm 0,3 ms timeout cho mỗi KiB sample vượt ngưỡng 256 KiB (≈ 2× tốc độ decode đo được 0,15 ms/KiB). */
export const TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB = 0.3;
/** Trần timeout trial-decode: 2500 ms (sample ≥ ~7,7 MiB chạm trần; xem LIMITS O6 §2). */
export const MAX_TRIAL_DECODE_TIMEOUT_MS = 2500;

/**
 * Tính timeout trial-decode cho 1 sample theo kích thước của nó.
 *   - sampleBytes ≤ 256 KiB (hoặc không hợp lệ) → đúng baseTimeoutMs.
 *   - lớn hơn → base + ceil((size − 256 KiB) / 1024 × 0,3), kẹp trần 2500 ms.
 *   - baseTimeoutMs không hợp lệ (≤ 0 / không finite) → dùng mặc định 200 ms
 *     (cùng quy tắc với `runTrialDecode`).
 * Ví dụ (base 200): 300.148 B → 212 ms; 460.756 B → 259 ms;
 * 4.107.475 B → 1327 ms; 8 MiB → 2500 ms (trần).
 */
export function trialDecodeTimeoutForSampleSize(
  sampleBytes: number,
  baseTimeoutMs: number = DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
): number {
  const base =
    Number.isFinite(baseTimeoutMs) && baseTimeoutMs > 0
      ? baseTimeoutMs
      : DEFAULT_TRIAL_DECODE_TIMEOUT_MS;
  if (!Number.isFinite(sampleBytes) || sampleBytes <= TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES) {
    return base;
  }
  const extraMs = Math.ceil(
    ((sampleBytes - TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES) / 1024) *
      TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB,
  );
  return Math.min(base + extraMs, MAX_TRIAL_DECODE_TIMEOUT_MS);
}

/**
 * Đợt 60 Q4 — lookup i18n tùy chọn (mẫu projectRepo.ts đợt 56 M5: file
 * này được test bằng Node nên KHÔNG import `../i18n` trực tiếp).
 * Khi `lookup` vắng → fallback đúng từng chữ chuỗi VI cũ nên test cũ +
 * hành vi mặc định không đổi; caller (T3) truyền lookup của nó xuống.
 */
export type I18nLookup = (key: string, vars?: Record<string, string>) => string;
function trKey(
  lookup: I18nLookup | undefined,
  key: string,
  vars: Record<string, string>,
  fallback: string,
): string {
  if (!lookup) return fallback;
  const out = lookup(key, vars);
  return out === key ? fallback : out;
}

/** Kết quả 1 lần trial-decode (đã áp fail-open). */
export interface TrialDecodeResult {
  /**
   * true = cho file qua (decode OK, HOẶC fail-open vì không kết luận
   * được). false CHỈ khi decoder trả lời rõ ràng là decode lỗi.
   */
  passed: boolean;
  /**
   * true = KHÔNG thực sự decode (không có decoder / probe ném lỗi /
   * timeout). Khi skipped=true thì passed luôn true (fail-open).
   */
  skipped: boolean;
  /** Lý do để ghi log/fallback (vd "decode-ok", "no-decoder", "timeout-200ms"). */
  reason: string;
}

/**
 * Đợt 65 S6 — nhận biết lý do timeout của `runTrialDecode`: mọi lý do
 * timeout đều bắt đầu bằng `timeout-<ms>ms` (cả fallback VI lẫn giá trị
 * dict `gop.trial.timeout` vi/en) — các lý do fail-open khác (`no-decoder`,
 * `unsupported-config`, `probe-error: ...`) không có tiền tố này. T3 dùng
 * để quyết định có ghi chú timeout cho UI hay không; chỉ timeout mới có
 * ghi chú (no-decoder/unsupported là trạng thái môi trường, không phải
 * "chưa kịp kiểm chứng").
 */
export function isTrialDecodeTimeoutReason(reason: string): boolean {
  return /^timeout-\d+ms/.test(reason);
}

export function trialDecodeConfigFromTrack(track: Mp4VideoTrack): TrialDecodeConfig {
  return {
    codec: track.codec,
    codedWidth: track.width,
    codedHeight: track.height,
    description: track.description,
  };
}

/**
 * Đợt 56 M10 (c) — phân loại thông điệp lỗi của VideoDecoder: true khi
 * lỗi nói rõ decoder KHÔNG HỖ TRỢ config (vd "Unsupported profile",
 * "codec parameters are not supported"), false khi là lỗi bitstream
 * (vd "wasn't a key frame", "Unable to determine size of bitstream
 * buffer"). Dùng để fail-open file profile lạ thay vì chặn oan: một
 * file H.264 hợp lệ nhưng decoder máy này không decode được vẫn là
 * file thật — chỉ fallback về full-file khi lỗi là bitstream hỏng.
 * So khớp chuỗi con, không phân biệt hoa/thường.
 */
export function isUnsupportedDecoderMessage(message: string): boolean {
  return /unsupported|not supported/i.test(message);
}

/**
 * Đợt 77 E7 — quét "zero-run" trong sample AVCC (H.264) trước trial-decode.
 *
 * LỖ HỔNG (gap analysis O6 §6.6, đo thật đợt này — xem LIMITS E7 §2):
 * keyframe thật bị zero 1 MiB ở giữa vẫn decode OK qua VideoDecoder
 * (error concealment của decoder: FFmpeg cũng chỉ báo lỗi MB rồi vẫn
 * trả frame, exit 0) nên trial-decode không bắt được. Quét này bắt
 * đúng lớp đó mà không cần decode.
 *
 * CƠ SỞ (chắc chắn, không phải heuristic): trong RBSP của H.264, quy
 * tắc emulation prevention cấm dãy 3 byte 0x00 liên tiếp ở bất kỳ vị
 * trí byte-aligned nào trong payload NAL (sau `00 00` mà byte tiếp
 * theo ≤ 0x03 thì encoder phải chèn 0x03). Vì vậy một chạy 0 dài ≥ 3
 * byte NẰM TRONG payload một NAL là bitstream hỏng chắc chắn — không
 * thể là dữ liệu hợp lệ. Đo thật trên 11 sample 0 thật (29 KiB …
 * 64 MiB): maxInterior luôn đúng 2 (đúng biên lý thuyết), 0 false
 * positive; mẫu zero 1 MiB giữa/25%/cuối đều bị bắt đúng offset.
 *
 * NGOẠI LỆ (để không chặn oan):
 *   - Chạy 0 ở CUỐI payload được miễn theo luật ≥ 3 (có thể là
 *     cabac_zero_byte hợp lệ) — chỉ vi phạm khi dài ≥ 64 byte
 *     (`AVCC_ZERO_RUN_TRAILING_THRESHOLD`, heuristic có biên: file
 *     thật đo được maxTrailing = 0; zero 1 MiB cuối file vẫn bị bắt).
 *   - Chỉ quét 4 byte length-prefix theo đúng giả định AVCC 4-byte
 *     của toàn bộ đường demux/decode (xem `validateAvccSample`):
 *     length-prefix của NAL nhỏ chứa `00 00 00 xx` hợp lệ nên KHÔNG
 *     bao giờ quét thô toàn sample.
 *   - Walk gãy (length 0 / vượt sample / thừa byte cuối): chỉ kết
 *     luận vi phạm khi đúng vị trí gãy bắt đầu một chạy 0 dài ≥ 64
 *     byte (vùng zero đã nuốt mất length-prefix); còn không thì
 *     `inconclusive` — để trial-decode quyết (fail-open).
 *   - Chỉ áp cho codec `avc1*` (H.264 — toàn bộ đường trial-decode
 *     hiện chỉ xử lý track avc1); codec khác → inconclusive.
 *
 * CHI PHÍ (đo thật, LIMITS E7 §2.3): một lần duyệt O(n) bằng
 * `indexOf(0)` nhảy native; Node: 4,1 MiB ~11 ms, 9,7 MiB ~28 ms,
 * 30,7 MiB ~180 ms, 64 MiB ~279 ms, 50 MiB lossless (7,5% byte 0)
 * ~1,0 s. So với decode cùng cỡ (1,2 s / 1,9 s / 5 s / 40 s) là
 * ~1–3%. Vì vậy quét chạy ở main thread CHỈ cho sample đi đường
 * main-thread (≤ ~7,7 MiB, ≤ ~25 ms); sample lớn đi worker thì quét
 * TRONG worker (xem `gopTrialDecodeWorker62R4.worker.ts`) để không
 * kẹt UI — T3 chỉ gọi hàm này khi `!trialPlan.viaWorker`.
 */
export const AVCC_ZERO_RUN_MAX_LEGAL = 2;
/** Chạy 0 ở cuối payload dài tới đây mới tính vi phạm (heuristic, xem trên). */
export const AVCC_ZERO_RUN_TRAILING_THRESHOLD = 64;
/** Chạy 0 tại vị trí walk gãy dài tới đây mới tính vi phạm (xem trên). */
export const AVCC_ZERO_RUN_BREAK_CORROBORATION = 64;

export interface AvccZeroRunScanResult {
  /** true = phát hiện chạy 0 bất hợp lệ (bitstream hỏng chắc chắn). */
  violation: boolean;
  /** true = không kết luận được (không phải avc1 / walk gãy không có bằng chứng 0 / mẫu rỗng) — caller fail-open. */
  inconclusive: boolean;
  /** Short reason for log/fallback (e.g. "zero-run 1048576 bytes at offset 4317235 (NAL 1)"). */
  reason: string;
  /** Số NAL đã đi qua trước khi kết luận (0 khi chưa đi được NAL nào). */
  nals: number;
  /** Chạy 0 dài nhất trong payload (không tính cuối payload). */
  maxInteriorRun: number;
  /** Offset bắt đầu của chạy trong payload dài nhất đó (-1 khi không có). */
  maxInteriorRunAt: number;
  /** Chạy 0 dài nhất ở cuối payload. */
  maxTrailingRun: number;
  /** Offset bắt đầu của chạy cuối payload dài nhất đó (-1 khi không có). */
  maxTrailingRunAt: number;
}

export function scanAvccZeroRun(
  sample: Uint8Array,
  codec?: string,
): AvccZeroRunScanResult {
  const none = (
    reason: string,
    extra: Partial<AvccZeroRunScanResult> = {},
  ): AvccZeroRunScanResult => ({
    violation: false,
    inconclusive: true,
    reason,
    nals: 0,
    maxInteriorRun: 0,
    maxInteriorRunAt: -1,
    maxTrailingRun: 0,
    maxTrailingRunAt: -1,
    ...extra,
  });
  if (codec !== undefined && !codec.startsWith("avc1")) {
    return none(`not-avc1 (codec ${codec}) — zero-run scan skipped`);
  }
  if (sample.length < 5) {
    return none(`sample too short (${sample.length} bytes) — zero-run scan skipped`);
  }
  let off = 0;
  let nals = 0;
  let maxInteriorRun = 0;
  let maxInteriorRunAt = -1;
  let maxTrailingRun = 0;
  let maxTrailingRunAt = -1;
  while (off + 4 <= sample.length) {
    const len =
      sample[off] * 0x1000000 +
      sample[off + 1] * 0x10000 +
      sample[off + 2] * 0x100 +
      sample[off + 3];
    if (!(len > 0) || len > sample.length - off - 4) {
      // Walk gãy: chỉ kết luận khi đúng vị trí gãy bắt đầu một chạy 0
      // dài (vùng zero đã nuốt length-prefix) — còn không thì fail-open.
      let zeroRun = 0;
      while (
        zeroRun < AVCC_ZERO_RUN_BREAK_CORROBORATION &&
        off + zeroRun < sample.length &&
        sample[off + zeroRun] === 0
      ) {
        zeroRun++;
      }
      if (zeroRun >= AVCC_ZERO_RUN_BREAK_CORROBORATION) {
        return {
          violation: true,
          inconclusive: false,
          reason: `broken NAL walk at offset ${off} (len ${len}, NAL ${nals}) + zero-run >= ${AVCC_ZERO_RUN_BREAK_CORROBORATION} bytes at break`,
          nals,
          maxInteriorRun,
          maxInteriorRunAt,
          maxTrailingRun,
          maxTrailingRunAt,
        };
      }
      return none(`broken NAL walk at offset ${off} (len ${len}, NAL ${nals}) — inconclusive`, {
        nals,
        maxInteriorRun,
        maxInteriorRunAt,
        maxTrailingRun,
        maxTrailingRunAt,
      });
    }
    const pStart = off + 4;
    const pEnd = off + 4 + len;
    // Payload < 4 byte không thể chứa chạy 0 dài ≥ 3 (byte đầu là NAL
    // header, luôn khác 0 ở NAL hợp lệ) nên bỏ qua — đỡ tốn indexOf
    // cho mẫu có hàng triệu NAL tí hon (chỉ gặp ở fixture tổng hợp).
    if (len >= 4) {
      let i = pStart;
      while (i < pEnd) {
        const z = sample.indexOf(0, i);
        if (z === -1 || z >= pEnd) break;
        let j = z + 1;
        while (j < pEnd && sample[j] === 0) j++;
        const run = j - z;
        if (j >= pEnd) {
          if (run > maxTrailingRun) {
            maxTrailingRun = run;
            maxTrailingRunAt = z;
          }
        } else if (run > maxInteriorRun) {
          maxInteriorRun = run;
          maxInteriorRunAt = z;
        }
        i = j;
      }
    }
    off = pEnd;
    nals++;
  }
  if (off < sample.length) {
    return none(`${sample.length - off} trailing bytes, not enough for 1 NAL (off ${off}) — inconclusive`, {
      nals,
      maxInteriorRun,
      maxInteriorRunAt,
      maxTrailingRun,
      maxTrailingRunAt,
    });
  }
  if (nals === 0) {
    return none("no NAL read — inconclusive");
  }
  if (maxInteriorRun > AVCC_ZERO_RUN_MAX_LEGAL) {
    return {
      violation: true,
      inconclusive: false,
      reason: `zero-run ${maxInteriorRun} bytes at offset ${maxInteriorRunAt} in NAL payload (emulation-prevention violation)`,
      nals,
      maxInteriorRun,
      maxInteriorRunAt,
      maxTrailingRun,
      maxTrailingRunAt,
    };
  }
  if (maxTrailingRun >= AVCC_ZERO_RUN_TRAILING_THRESHOLD) {
    return {
      violation: true,
      inconclusive: false,
      reason: `zero-run ${maxTrailingRun} bytes at end of NAL payload (offset ${maxTrailingRunAt}) — abnormally long, not cabac_zero_byte`,
      nals,
      maxInteriorRun,
      maxInteriorRunAt,
      maxTrailingRun,
      maxTrailingRunAt,
    };
  }
  return {
    violation: false,
    inconclusive: false,
    reason: `no illegal zero-run (${nals} NALs, maxInterior ${maxInteriorRun}, maxTrailing ${maxTrailingRun})`,
    nals,
    maxInteriorRun,
    maxInteriorRunAt,
    maxTrailingRun,
    maxTrailingRunAt,
  };
}

/**
 * Probe production: VideoDecoder thật của trình duyệt.
 *
 * Trả null khi `typeof VideoDecoder === "undefined"` (Node, Safari cũ
 * không có WebCodecs) — caller khi đó bỏ qua trial-decode (fail-open).
 * Mỗi lần gọi tạo 1 VideoDecoder mới, configure từ config, decode đúng
 * 1 chunk key ở timestamp 0, chờ flush, rồi close trong finally.
 * Trả true CHỈ khi có frame output ra và không có lỗi nào từ callback
 * `error` lẫn exception của decode/flush; mọi lỗi khác → false.
 *
 * Đợt 56 M10 (c) — fail-open profile lạ: TRƯỚC khi decode, hỏi
 * `VideoDecoder.isConfigSupported(config)`; báo không hỗ trợ thì trả
 * `"unsupported-config"` ngay (không decode, không chặn oan). Lỗi
 * configure hoặc lỗi decode mang thông điệp unsupported (xem
 * `isUnsupportedDecoderMessage`) cũng trả `"unsupported-config"`.
 * isConfigSupported vắng/lỗi thì thử decode như cũ (không đoán).
 *
 * Lưu ý (tiền lệ K8 probe): `VideoDecoder.close()` trả undefined, không
 * phải Promise — gọi thường, không await/.catch.
 */
export function createBrowserTrialDecodeProbe(): GopTrialDecodeProbe | null {
  if (typeof VideoDecoder === "undefined") return null;
  return async (
    sample: Uint8Array,
    config: TrialDecodeConfig,
    signal?: AbortSignal,
  ): Promise<GopTrialDecodeProbeOutcome> => {
    // Đợt 61 R7 — đã abort trước khi bắt đầu thì không tạo decoder nữa
    // (giá trị trả về bị runTrialDecode bỏ qua vì race đã xong, nhưng
    // tránh tạo decoder vô ích).
    if (signal?.aborted) return false;
    if (typeof VideoDecoder.isConfigSupported === "function") {
      try {
        const support = await VideoDecoder.isConfigSupported({
          codec: config.codec,
          codedWidth: config.codedWidth,
          codedHeight: config.codedHeight,
          description: config.description,
        });
        if (!support.supported) return "unsupported-config";
      } catch {
        /* isConfigSupported lỗi → thử decode như cũ, không đoán */
      }
    }
    if (signal?.aborted) return false;
    let dec: VideoDecoder | null = null;
    // Đợt 61 R7 — hủy decoder ngay khi signal abort (runTrialDecode
    // abort khi timeout thắng race): `VideoDecoder.close()` làm flush
    // đang chờ reject (AbortError) nên probe settle nhanh thay vì đợi
    // decode dở xong (~28 s trên sample 42,5 MB — LIMITS Q5 §6.4).
    // close() gọi 2 lần (abort + finally) là an toàn, đều bọc try.
    const onAbort = (): void => {
      try {
        dec?.close();
      } catch {
        /* bỏ qua */
      }
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
      let gotFrame = false;
      let decodeError: string | null = null;
      dec = new VideoDecoder({
        output: (frame: VideoFrame) => {
          gotFrame = true;
          try {
            frame.close();
          } catch {
            /* bỏ qua */
          }
        },
        error: (e: Error) => {
          decodeError = String(e?.message ?? e).slice(0, 200);
        },
      });
      try {
        dec.configure({
          codec: config.codec,
          codedWidth: config.codedWidth,
          codedHeight: config.codedHeight,
          description: config.description,
        });
      } catch (e) {
        // Lỗi configure mang thông điệp unsupported (vd profile lạ) →
        // fail-open, không phải lỗi bitstream.
        if (isUnsupportedDecoderMessage(String((e as Error)?.message ?? e))) {
          return "unsupported-config";
        }
        return false;
      }
      dec.decode(
        new EncodedVideoChunk({
          type: "key",
          timestamp: 0,
          duration: 33333,
          data: sample,
        }),
      );
      await dec.flush();
      if (!gotFrame && decodeError !== null && isUnsupportedDecoderMessage(decodeError)) {
        return "unsupported-config";
      }
      return gotFrame && decodeError === null;
    } catch {
      return false;
    } finally {
      signal?.removeEventListener("abort", onAbort);
      try {
        dec?.close();
      } catch {
        /* bỏ qua */
      }
    }
  };
}

/**
 * Chạy 1 lần trial-decode với timeout + fail-open.
 *
 *   - probe null/undefined → `{passed:true, skipped:true, reason:"no-decoder"}`.
 *   - probe trả true → `{passed:true, skipped:false, reason:"decode-ok"}`.
 *   - probe trả false → `{passed:false, skipped:false, reason:"decode-failed"}`.
 *   - probe trả `{ failed: true, reason }` (đợt 78 F8 — worker probe báo
 *     lỗi KÈM lý do, vd zero-run) → `{passed:false, skipped:false,
 *     reason}` — lý do giữ nguyên văn (cắt 200 ký tự), không qua dict
 *     i18n; lý do rỗng thì về `decode-failed` như probe-false thường.
 *   - probe trả "unsupported-config" → `{passed:true, skipped:true,
 *     reason:"unsupported-config: ..."}` (fail-open — decoder không hỗ
 *     trợ codec/profile, không phải lỗi file; đợt 56 M10).
 *   - probe ném lỗi/reject → fail-open `{passed:true, skipped:true, reason:"probe-error: ..."}`.
 *   - quá timeoutMs → fail-open `{passed:true, skipped:true, reason:"timeout-<ms>ms"}`.
 *     Đợt 61 R7 — khi timeout thắng race thì `runTrialDecode` gọi
 *     `AbortController.abort()` và truyền `signal` cho probe ngay từ
 *     đầu: probe tuân thủ signal phải dừng công việc nền (browser probe
 *     gọi `VideoDecoder.close()` khi abort — đo headed: probe settle
 *     < 1 s sau abort thay vì decode dở ~28 s như code cũ trên sample
 *     42,5 MB, LIMITS Q5 §6.4). Probe không quan tâm signal thì vẫn
 *     chạy nền như cũ (hành vi cũ, không crash); promise probe đã gắn
 *     `.catch(()=>{})` nên không gây unhandled rejection. Probe thắng
 *     race thì KHÔNG abort.
 *   - timeoutMs không hợp lệ (≤ 0 / không finite) → dùng mặc định 200 ms.
 *   - Đợt 60 Q4 — `lookup` tùy chọn: 4 lý do (no-decoder / timeout /
 *     unsupported-config / decode-failed) đi qua key `gop.trial.*` trong
 *     dict; vắng → fallback VI cũ. "decode-ok" và "probe-error: ..." không
 *     có trong fragment P7 nên giữ nguyên chuỗi thô (không qua dict).
 */
export async function runTrialDecode(
  probe: GopTrialDecodeProbe | null | undefined,
  sample: Uint8Array,
  config: TrialDecodeConfig,
  timeoutMs: number = DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  lookup?: I18nLookup,
): Promise<TrialDecodeResult> {
  if (probe === null || probe === undefined) {
    return {
      passed: true,
      skipped: true,
      reason: trKey(lookup, "gop.trial.noDecoder", {}, "no-decoder: không có probe trial-decode"),
    };
  }
  const timeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_TRIAL_DECODE_TIMEOUT_MS;
  // Đợt 61 R7 — AbortController cho probe: timeout thắng race thì abort
  // để probe dừng công việc nền (xem ghi chú ở đầu hàm). Probe thắng
  // race thì controller không bao giờ abort.
  const controller = new AbortController();
  // Gắn catch sớm để promise probe không thành unhandled rejection nếu
  // nó reject sau khi đường timeout đã thắng race (xem ghi chú trên).
  const probePromise = Promise.resolve().then(() => probe(sample, config, controller.signal));
  probePromise.catch(() => {});
  let timer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;
  try {
    const outcome = await Promise.race([
      probePromise.then((v) => ({ kind: "probe" as const, value: v })),
      new Promise<{ kind: "timeout" }>((resolve) => {
        timer = setTimeout(() => {
          timedOut = true;
          resolve({ kind: "timeout" });
        }, timeout);
      }),
    ]);
    if (timer !== null) clearTimeout(timer);
    // Cờ timedOut do chính callback timeout đặt trước khi resolve nên
    // đáng tin hơn việc đoán từ giá trị race (probe trả false đúng lúc
    // timeout bắn thì vẫn tính là timeout — hướng fail-open, an toàn).
    if (timedOut || outcome.kind === "timeout") {
      // Đợt 61 R7 — hủy công việc nền của probe ngay, không để decoder
      // decode dở sample lớn sau khi đã trả fail-open (LIMITS Q5 §6.4).
      controller.abort();
      return {
        passed: true,
        skipped: true,
        reason: trKey(
          lookup,
          "gop.trial.timeout",
          { timeout: String(timeout) },
          `timeout-${timeout}ms: trial-decode chưa xong, cho qua (fail-open)`,
        ),
      };
    }
    if (outcome.value === "unsupported-config") {
      return {
        passed: true,
        skipped: true,
        reason: trKey(
          lookup,
          "gop.trial.unsupportedConfig",
          {},
          "unsupported-config: decoder không hỗ trợ codec/profile này — cho qua (fail-open)",
        ),
      };
    }
    if (typeof outcome.value === "object" && outcome.value !== null && outcome.value.failed === true) {
      // Đợt 78 F8 — structured failure: worker probe báo lỗi kèm lý do
      // chẩn đoán (hôm nay chỉ zero-run). Giữ nguyên văn để T3 fallback
      // với đúng lý do đó; lý do rỗng/vắng → về decode-failed như cũ.
      const detail = outcome.value.reason.slice(0, 200);
      return {
        passed: false,
        skipped: false,
        reason:
          detail.length > 0
            ? detail
            : trKey(
                lookup,
                "gop.trial.decodeFailed",
                {},
                "decode-failed: VideoDecoder không decode được sample 0",
              ),
      };
    }
    if (outcome.value === false) {
      return {
        passed: false,
        skipped: false,
        reason: trKey(
          lookup,
          "gop.trial.decodeFailed",
          {},
          "decode-failed: VideoDecoder không decode được sample 0",
        ),
      };
    }
    return { passed: true, skipped: false, reason: "decode-ok" };
  } catch (e) {
    if (timer !== null) clearTimeout(timer);
    return {
      passed: true,
      skipped: true,
      reason: `probe-error: ${(e as Error).message ?? String(e)}`.slice(0, 200),
    };
  }
}
