// trialDecodeRunning71Y5.ts — Phase 9 đợt 71, luồng Y5: đóng nợ đợt 70 §4
// mục 8 — toast trạng thái khi trial keyframe chạy lâu (~30 s+).
// Đợt 72 Z5 — mở rộng: registry nay bao cả GIAI ĐOẠN FETCH remainder
// (đóng nợ đợt 71 §5 mục 5): trước Y5/Z5 toast chỉ bao decode, còn
// fetch remainder 64 MiB (128 chunk 512 KiB, ~48 s dưới tải) thì user
// không thấy gì. Nay run được đăng ký TỪ LÚC fetch bắt đầu (phase
// "fetch", tiến độ thật theo chunk) rồi chuyển sang phase "decode"
// khi fetch xong — 1 run duy nhất bao trọn trial, 1 toast duy nhất
// đổi nội dung theo phase (xem preview.tsx).
//
// BỐI CẢNH: 1 keyframe = 1 lần VideoDecoder.decode() duy nhất (hoặc 1
// vòng worker), không có tiến độ từng phần để báo cáo — X7 §2.3 đã xét
// và tạm gác phương án "toast theo tiến độ". Thiết kế này KHÔNG bịa %
// tiến độ: nó chỉ báo TRẠNG THÁI CHỜ (giai đoạn decode + thời gian đã
// trôi qua, cập nhật mỗi giây), và chỉ hiện khi trial vượt ngưỡng.
// Riêng giai đoạn FETCH thì tiến độ LÀ có thật (chunk đã fetch / tổng
// sample), nên toast fetch báo đúng số MiB đã tải — không phải % giả.
//
// THIẾT KẾ:
//   - Registry thuần (không DOM/React, test được bằng Node): T3
//     (`gopRangeFetch39T3.ts`) gọi `beginTrialDecodeRun` ngay trước
//     `runTrialDecode` và `endTrialDecodeRun` trong `finally` — cả 2
//     điểm gọi (stream-mode + all-mode). Probe thắng/thua/timeout/
//     throw đều đi qua `finally` nên run không bao giờ kẹt lại.
//   - Nhiều controller có thể trial cùng lúc (mở 2 clip) nên registry
//     giữ MAP các run đang chạy, mỗi run 1 id; UI hiện run lâu nhất
//     (startedAtMs nhỏ nhất). Run kết thúc sớm hơn ngưỡng thì UI không
//     bao giờ thấy toast — hành vi "trial ngắn không toast" nằm ở phía
//     preview.tsx (ngưỡng `TRIAL_DECODE_RUNNING_TOAST_DELAY_MS`).
//   - `startedAtMs` lấy bằng `Date.now()` lúc begin — UI tính elapsed
//     = now − startedAtMs, làm tròn xuống giây, KHÔNG suy ra % hoàn
//     thành (không biết tổng thời gian decode trước khi xong).
//   - Module này KHÔNG biết gì về toast: nó chỉ phát sự kiện begin/end
//     qua `subscribeTrialDecodeRunning` (mẫu `subscribeTrialDecodeTimeoutNotes`
//     của reverseWebcodecs.ts). preview.tsx đăng ký và tự quản lý toast
//     dính (sticky) + cập nhật elapsed.
//
// GIỚI HẠN (xem LIMITS Y5):
//   - Toast chỉ bao GIAI ĐOẠN DECODE của trial, không bao giai đoạn
//     fetch phần còn lại của sample 0 (chunked 512 KiB, tới 64 MiB):
//     W2 chứng minh fetch này có thể tốn 50–130 s+ dưới tải nặng,
//     trong khi đồng hồ timeout 78,5 s chỉ bắt đầu SAU khi fetch xong.
//     Trong khoảng fetch đó user vẫn không thấy toast nào của Y5.
//     → Đợt 72 Z5 ĐÃ LẤP khoảng trống này (phase "fetch" + tiến độ
//     thật theo chunk, xem LIMITS Z5).
//   - Không có % tiến độ thật: elapsed chỉ là thời gian chờ, không
//     phải phần trăm công việc; decode có thể xong ngay giây sau hoặc
//     còn 60 s nữa — toast không hứa hẹn thời gian còn lại.
export type TrialDecodePhase = "fetch" | "decode";

export interface TrialDecodeRun {
  /** Id duy nhất trong phiên (tăng đơn điệu). */
  id: number;
  /** Kích thước sample keyframe đang decode (byte). */
  sampleBytes: number;
  /** Timeout trial-decode đã lên kế hoạch cho run này (ms). */
  timeoutMs: number;
  /** true = decode ở worker nền (sample lớn); false = main-thread. */
  viaWorker: boolean;
  /** Thời điểm bắt đầu decode (Date.now()). */
  startedAtMs: number;
  /**
   * Đợt 72 Z5 — giai đoạn hiện tại của run: "fetch" = đang fetch
   * phần còn lại của sample 0 theo chunk; "decode" = đang trial-decode.
   * Run ở all-mode (không có fetch remainder) bắt đầu thẳng ở "decode".
   */
  phase: TrialDecodePhase;
  /**
   * Đợt 72 Z5 — thời điểm bắt đầu giai đoạn hiện tại (Date.now()).
   * UI tính elapsed = now − phaseStartedAtMs, tức thời gian chờ TRONG
   * TỪNG giai đoạn (fetch 48 s rồi decode 60 s thì toast decode bắt
   * đầu lại từ 0 s, không cộng dồn thời gian fetch vào số giây decode).
   */
  phaseStartedAtMs: number;
  /**
   * Đợt 72 Z5 — số byte sample 0 ĐÃ CÓ trong tay (tiền tố AVCC +
   * các chunk remainder đã fetch xong). Phase "fetch": tăng theo từng
   * chunk 512 KiB (tiến độ THẬT, không ước lượng). Phase "decode":
   * bằng totalBytes (đủ sample).
   */
  fetchedBytes: number;
  /** Đợt 72 Z5 — tổng kích thước sample 0 (byte) = sampleBytes. */
  totalBytes: number;
}

/**
 * Ngưỡng hiện toast trạng thái: trial còn chạy sau 5 s mới báo.
 * 5 s = đủ dài để trial thường (sample ≤ 256 KiB decode ~10–70 ms,
 * keyframe 4K ~0,6–1,2 s) không bao giờ chạm tới, đủ ngắn để user
 * mở file keyframe lớn không phải chờ mù quá lâu trước khi thấy phản
 * hồi. Ngưỡng này là hằng UI (preview.tsx dùng), không phải timeout
 * decode — trial vẫn chạy tới hết timeout riêng của nó.
 */
export const TRIAL_DECODE_RUNNING_TOAST_DELAY_MS = 5000;
/** Chu kỳ cập nhật số giây đã trôi qua trên toast (ms). */
export const TRIAL_DECODE_RUNNING_TOAST_TICK_MS = 1000;

let nextRunId = 1;
const activeRuns = new Map<number, TrialDecodeRun>();

type TrialDecodeRunningListener = () => void;
const listeners = new Set<TrialDecodeRunningListener>();

function notify(): void {
  for (const fn of [...listeners]) {
    try {
      fn();
    } catch {
      // 1 listener lỗi không được chặn các listener khác / đường trial.
    }
  }
}

/**
 * Đăng ký 1 run trial-decode đang bắt đầu. Trả về id để gọi
 * `endTrialDecodeRun` khi xong. Gọi ngay trước `runTrialDecode`.
 */
export function beginTrialDecodeRun(args: {
  sampleBytes: number;
  timeoutMs: number;
  viaWorker: boolean;
}): number {
  const id = nextRunId++;
  const now = Date.now();
  activeRuns.set(id, {
    id,
    sampleBytes: args.sampleBytes,
    timeoutMs: args.timeoutMs,
    viaWorker: args.viaWorker,
    startedAtMs: now,
    // Đợt 72 Z5 — run decode trực tiếp (all-mode / sample nhỏ): không
    // có giai đoạn fetch, đủ sample ngay từ đầu.
    phase: "decode",
    phaseStartedAtMs: now,
    fetchedBytes: args.sampleBytes,
    totalBytes: args.sampleBytes,
  });
  notify();
  return id;
}

/**
 * Đợt 72 Z5 — đăng ký 1 run trial đang bắt đầu GIAI ĐOẠN FETCH
 * remainder (stream-mode, sample 0 > 256 KiB): T3 gọi ngay trước
 * `fetchSampleRemainderChunked`, rồi `updateTrialFetchProgress` sau
 * mỗi chunk và `markTrialDecodeStarted` khi fetch xong (xem dưới).
 * `fetchedBytes` = số byte sample 0 ĐÃ CÓ lúc begin (tiền tố AVCC
 * 256 KiB đã fetch trước đó — những byte này đã nằm trong tay thật,
 * không phải ước lượng). Trả về id để cập nhật / kết thúc run.
 */
export function beginTrialFetchRun(args: {
  sampleBytes: number;
  timeoutMs: number;
  viaWorker: boolean;
  fetchedBytes: number;
}): number {
  const id = nextRunId++;
  const now = Date.now();
  activeRuns.set(id, {
    id,
    sampleBytes: args.sampleBytes,
    timeoutMs: args.timeoutMs,
    viaWorker: args.viaWorker,
    startedAtMs: now,
    phase: "fetch",
    phaseStartedAtMs: now,
    fetchedBytes: Math.max(0, Math.min(args.fetchedBytes, args.sampleBytes)),
    totalBytes: args.sampleBytes,
  });
  notify();
  return id;
}

/**
 * Đợt 72 Z5 — cập nhật tiến độ fetch thật của run (số byte sample 0
 * đã có sau khi 1 chunk remainder về). Kẹp về [0, totalBytes] để
 * không bao giờ báo quá 100% dù caller tính sai. Chỉ notify khi giá
 * trị đổi (chunk về liên tiếp với cùng giá trị thì không spam
 * listener). Trả false khi id không còn tồn tại (đã end / chưa từng
 * begin) — caller khi đó bỏ qua, không throw.
 */
export function updateTrialFetchProgress(id: number, fetchedBytes: number): boolean {
  const run = activeRuns.get(id);
  if (!run) return false;
  const clamped = Math.max(0, Math.min(fetchedBytes, run.totalBytes));
  if (run.fetchedBytes === clamped) return true;
  run.fetchedBytes = clamped;
  notify();
  return true;
}

/**
 * Đợt 72 Z5 — chuyển run từ giai đoạn fetch sang giai đoạn decode
 * (fetch remainder xong, sắp gọi `runTrialDecode`). `phaseStartedAtMs`
 * đặt lại = bây giờ để elapsed của toast decode tính từ lúc decode
 * bắt đầu (không cộng dồn thời gian fetch). `fetchedBytes` = đủ
 * sample. Trả false khi id không còn tồn tại.
 */
export function markTrialDecodeStarted(id: number): boolean {
  const run = activeRuns.get(id);
  if (!run) return false;
  run.phase = "decode";
  run.phaseStartedAtMs = Date.now();
  run.fetchedBytes = run.totalBytes;
  notify();
  return true;
}

/**
 * Đăng ký 1 run đã kết thúc (decode-ok / lỗi / timeout / throw).
 * Id lạ (đã end rồi / chưa từng begin) thì không làm gì, không notify
 * — để `finally` gọi an toàn cả khi begin chưa từng chạy.
 */
export function endTrialDecodeRun(id: number): void {
  if (!activeRuns.delete(id)) return;
  notify();
}

/** Các run trial-decode đang chạy, xếp theo thời gian bắt đầu (cũ nhất trước). */
export function activeTrialDecodeRuns(): TrialDecodeRun[] {
  return [...activeRuns.values()].sort((a, b) => a.startedAtMs - b.startedAtMs);
}

/**
 * Đăng ký nhận thay đổi tập run đang chạy (begin/end). Callback không
 * nhận tham số — caller đọc lại `activeTrialDecodeRuns()`. Trả về hàm
 * hủy đăng ký. Mẫu `subscribeTrialDecodeTimeoutNotes`.
 */
export function subscribeTrialDecodeRunning(fn: TrialDecodeRunningListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Reset toàn bộ registry (chỉ dùng cho test — không dùng ở production). */
export function __resetTrialDecodeRunningForTest(): void {
  activeRuns.clear();
  listeners.clear();
}
