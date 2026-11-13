// gopTrialDecodeWorker62R4.ts — Phase 9 đợt 62, luồng R4: đóng nợ đợt 61
// §5.7 (LIMITS R7 §6.1): keyframe thật ≳15–16 MiB (lúc yên) vẫn timeout
// → fail-open trong trial-decode/GOP.
//
// VÌ SAO KEYFRAME LỚN FAIL-OPEN (đã đo, R7 §2.6): timeout trial-decode
// main-thread chạm trần 2500 ms từ ~7,7 MiB trong khi thời gian decode
// tăng tuyến tính theo kích thước — 9,7 MiB ~2 s, 19,7 MiB ~3 s,
// 37,2 MiB ~20–26 s, 42,5 MiB ~26–34 s (lúc tải). Tăng trần main-thread
// không sửa chắc được (công thức 0,3 ms/KiB cho 42 MB chỉ ~12,6 s,
// decode thực tế gấp đôi) mà còn kẹt đường mở file — R7 đã quyết cần
// worker nền (M10 §8.4). Hướng này triển khai worker đó.
//
// THIẾT KẾ:
//   - `createWorkerTrialDecodeProbe()`: probe chạy VideoDecoder thật
//     trong DedicatedWorker (không phải setTimeout giả). Mỗi lần gọi
//     spawn 1 worker mới, transfer BẢN SAO của sample (buffer gốc của
//     caller không bị neuter), terminate worker khi có verdict / lỗi /
//     abort. Worker không dựng được (không có Worker global, CSP, lỗi
//     load script) → fallback về probe main-thread với trần 2500 ms cũ
//     (giữ đúng hành vi trước đợt này); không có fallback thì probe
//     reject để `runTrialDecode` fail-open dạng probe-error.
//   - `planTrialDecodeCall()`: chỉ sample mà timeout main-thread đã
//     chạm trần 2500 ms mới đi worker; sample nhỏ hơn giữ nguyên đường
//     main-thread + timeout cũ (không tốn phí spawn worker cho mọi lần
//     mở file, không đổi hành vi đường nhỏ). Probe inject của caller
//     (test / opt-out) không bao giờ bị đưa sang worker.
//   - Timeout worker (`trialDecodeTimeoutForSampleSizeWorker`): cùng
//     dạng công thức với main-thread nhưng tỉ lệ 1,2 ms/KiB và trần
//     60 s (đợt 64 R10 — xem LIMITS R10 đợt 64 §2–§3: trần 45 s của
//     đợt 63 R4 không bao được keyframe High-profile 50–64 MB ở tải
//     trung bình — đo trực tiếp 57,9 MB cần 53,2–58,0 s, 49,7–51,8 MB
//     cần 39,8–47,1 s; trần 60 s là trần tròn nhỏ nhất bao được mọi
//     lần đo trực tiếp (max 58,0 s). Tỉ lệ 1,2 giữ nguyên — tốc độ đo
//     được ở tải trung bình 0,86–1,03 ms/KiB, 1,2 ≈ 1,17–1,4×).
//     Trần dài được vì decode chạy ở worker: không kẹt main thread /
//     UI, chỉ làm chậm việc mở file chứa keyframe khổng lồ (hiếm — chỉ
//     keyframe 0 > ~7,7 MiB). Rác lớn vẫn fail NHANH (decoder lỗi
//     trong vài ms) nên trần dài không làm rác lọt.
//   - Đợt 67 U5 — trần 60 s → 90 s (xem LIMITS U5 đợt 67 §1): trần 60 s
//     cắt công thức ở 64 MiB (không trần 78.536 ms) và biên tải thấp chỉ
//     ~11,5 s; ngoại suy tải trung bình 64 MiB ≈ 60–66 s (0,92–1,00
//     ms/KiB, đợt 64 R10) đã ở/quá trần 60 s. Trần 90 s KHÔNG cắt bất kỳ
//     sample nào trong dải cho phép (tối đa công thức 78.536 ms < 90 s),
//     chỉ còn là trần an toàn tuyệt đối; biên mới tải thấp 28,2 s, tải
//     trung bình ~12,5 s. Giá phải trả: fail-open dưới tải nặng chậm
//     thêm tối đa 18,5 s (78,5 thay vì 60 s) — chỉ với keyframe
//     ≥ ~50 MiB. Tỉ lệ 1,2 ms/KiB GIỮ NGUYÊN (đã 1,2–1,3× tốc độ đo ở
//     tải trung bình; ràng buộc cắt là trần, không phải tỉ lệ). Timeout
//     thích ứng theo tải bị LOẠI (calibration chậm theo tải → timeout
//     phình đúng lúc cần fail-open nhanh — xem LIMITS U5 §1).
//   - Hủy chắc: timeout thắng race → `runTrialDecode` abort signal
//     (cơ chế R7) → probe này `worker.terminate()` ngay — hủy chắc hơn
//     cả `VideoDecoder.close()` vì terminate giết luôn worker.
//
// GIỚI HẠN (xem LIMITS R4 đợt 62 + đợt 63 + R10 đợt 64 + U5 đợt 67):
// trần worker 90 s (đợt 67 U5 nâng từ 60 s) bao được keyframe
// High-profile 50–64 MB ở tải thấp và tải trung bình (đo trực tiếp:
// 49,7 MB 39,8–47,1 s; 51,8 MB 42,5–47,0 s; 57,9 MB 53,2–58,0 s ở tải
// trung bình, đợt 64 R10; 64,0 MB 40,4–50,3 s ở tải thấp, đợt 66 T6;
// công thức ở 64 MiB cho timeout 78.536 ms, biên tải thấp 28,2 s),
// nhưng tải cực nặng (4 spin-loop + luồng khác, 1,6–2,1 ms/KiB) vẫn
// vượt trần — khi đó vẫn fail-open timeout như cũ, có lý do rõ ràng
// (kéo trần lên 70–80 s cũng không bao được tải cực nặng mà chỉ làm mở
// file chậm thêm, nên không kéo; trần 90 s cũng không bao được tải cực
// nặng — 64 MiB cần ~105–137 s ở đó). Sample > 64 MiB vẫn bỏ qua
// trial-decode (cap của T3, đợt 60 Q5). Safari vẫn chưa đo được
// (không có trên VM); Firefox xem LIMITS đợt 63 §4 (đo thật bằng
// Playwright firefox-1572 nếu chạy được).
import {
  DEFAULT_TRIAL_DECODE_TIMEOUT_MS,
  MAX_TRIAL_DECODE_TIMEOUT_MS,
  TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES,
  createBrowserTrialDecodeProbe,
  trialDecodeTimeoutForSampleSize,
} from "./gopTrialDecode55L8";
import type {
  GopTrialDecodeProbe,
  GopTrialDecodeProbeOutcome,
  TrialDecodeConfig,
} from "./gopTrialDecode55L8";

/** Giao thức main ↔ worker (xem `gopTrialDecodeWorker62R4.worker.ts`). */
export interface TrialDecodeWorkerRequest {
  /** Bản sao sample keyframe (transfer — worker nhận quyền sở hữu bản sao). */
  sample: ArrayBuffer;
  config: TrialDecodeConfig;
}
/**
 * Đợt 78 F8 — `result` mang thêm `reason` tùy chọn (đóng nợ đợt 77 §4.8):
 * worker chỉ set khi `outcome === false` VÀ biết rõ lý do (hôm nay chỉ
 * quét zero-run: `reason: "zero-run: <scan.reason>"` — đúng định dạng
 * T3 tự tổng hợp ở đường main-thread). Main thread chuyển thành
 * structured failure `{ failed: true, reason }` để `runTrialDecode`
 * giữ nguyên lý do tới T3.
 *
 * TƯƠNG THÍCH NGƯỢC: trường này tùy chọn — worker cũ (bundle cũ, test
 * giả cũ) không gửi `reason` thì main thread coi như probe-false
 * thường → `decode-failed` như trước (xem test F8). Ngược lại, main
 * thread cũ nhận message có `reason` thì chỉ bỏ qua trường thừa (kiểu
 * `TrialDecodeWorkerResponse` cũ không khai báo nhưng runtime không lỗi).
 * `reason` kèm outcome true / "unsupported-config" thì bị bỏ qua (lỗi
 * mới có lý do).
 */
export type TrialDecodeWorkerResponse =
  | { type: "result"; outcome: GopTrialDecodeProbeOutcome; reason?: string }
  | { type: "error"; message: string };

/**
 * Trần timeout trial-decode ở worker: 90 s (đợt 67 U5 nâng từ 60 s — xem
 * LIMITS U5 đợt 67 §1: công thức ở 64 MiB cho 78.536 ms nên trần 60 s
 * cắt keyframe thật; trần 90 s không cắt bất kỳ sample nào trong dải
 * cho phép vì tối đa công thức ở cap 64 MiB là 78.536 ms < 90 s, chỉ
 * còn là trần an toàn tuyệt đối). Dài gấp 36× trần main-thread
 * vì decode ở worker không kẹt UI; chỉ áp cho sample lớn (≥ ~7,7 MiB)
 * nên file thường không bao giờ chạm tới. 57,9 MiB High-profile decode
 * 53–58 s ở tải trung bình (đợt 64 R10 §2) nên trần 45 s cũ không đủ —
 * trần này bao được tải trung bình tới ~58 MB, vẫn có thể không đủ lúc
 * tải cực nặng (1,6–2,1 ms/KiB) — xem LIMITS R10 đợt 64 §2–§3.
 */
export const MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS = 90_000;
/**
 * Thêm 1,2 ms timeout worker cho mỗi KiB sample vượt ngưỡng 256 KiB —
 * ≈ 1,2–1,4× tốc độ decode chậm nhất đo được ở keyframe lớn ở tải trung
 * bình (0,86–1,03 ms/KiB ở 50–58 MB, đợt 64 R10 §2; 1,00 ms/KiB ở
 * 37–42 MB, đợt 63 R4 §2; 0,15–0,2 ms/KiB lúc yên).
 * Tỉ lệ cao hơn 0,3 ms/KiB của main-thread vì công thức cũ đánh giá
 * thấp keyframe khổng lồ (R7 §2.6: 42 MB chỉ cho ~12,6 s trong khi
 * decode thực 26–34 s lúc tải).
 */
export const WORKER_TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB = 1.2;

/**
 * Tính timeout trial-decode ở worker cho 1 sample theo kích thước của nó
 * (cùng dạng với `trialDecodeTimeoutForSampleSize` nhưng tỉ lệ 1,2 ms/KiB
 * và trần 90 s — đợt 67 U5 nâng từ 60 s, xem LIMITS U5 §1). Sample ≤ 256 KiB (hoặc không hợp lệ) → đúng base;
 * base không hợp lệ → dùng mặc định 200 ms.
 * Ví dụ (base 200): 4.107.475 B → 4707 ms; 9.683.047 B → 11241 ms;
 * 30.727.296 B → 35902 ms; 37.168.458 B → 43450 ms;
 * 42.493.646 B → 49691 ms (không chạm trần 90 s);
 * 49.658.687 B → 58087 ms; 51.821.731 B → 60622 ms;
 * 57.939.416 B → 67791 ms; 64 MiB → 78536 ms (không chạm trần 90 s —
 * trần 60 s cũ sẽ cắt ở 60000 ms).
 */
export function trialDecodeTimeoutForSampleSizeWorker(
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
      WORKER_TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB,
  );
  return Math.min(base + extraMs, MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS);
}

/** Factory dựng worker trial-decode (inject được cho test). */
export type TrialDecodeWorkerFactory = () => Worker;

/** Factory mặc định: module worker thật, Vite/esbuild bundle thành chunk riêng. */
function defaultTrialDecodeWorkerFactory(): Worker {
  return new Worker(new URL("./gopTrialDecodeWorker62R4.worker.ts", import.meta.url), {
    type: "module",
  });
}

/**
 * Dựng probe trial-decode chạy trong worker nền.
 *
 *   - Không có factory inject mà cũng không có `Worker` global (Node,
 *     trình duyệt cũ) → trả null để caller dùng probe main-thread.
 *   - Factory ném lỗi (CSP, ...) hoặc worker lỗi/load lỗi → chạy probe
 *     fallback (mặc định: probe main-thread `createBrowserTrialDecodeProbe()`)
 *     và trả outcome của nó; không có fallback thì reject để
 *     `runTrialDecode` fail-open dạng probe-error.
 *   - Signal abort → `worker.terminate()` ngay rồi reject (runTrialDecode
 *     đã gắn `.catch(()=>{})` nên reject sau timeout không gây unhandled
 *     rejection — mẫu R7).
 *   - Mỗi lần gọi probe spawn 1 worker mới và terminate khi xong (verdict
 *     / lỗi / abort) — không giữ worker dùng chung để tránh state rò rỉ
 *     giữa các lần mở file; chi phí spawn đo ở LIMITS R4 §2.
 */
export function createWorkerTrialDecodeProbe(
  factory?: TrialDecodeWorkerFactory,
  fallback?: GopTrialDecodeProbe | null,
): GopTrialDecodeProbe | null {
  const makeWorker = factory ?? defaultTrialDecodeWorkerFactory;
  const fallbackProbe =
    fallback === undefined ? createBrowserTrialDecodeProbe() : fallback;
  if (factory === undefined && typeof Worker === "undefined") return null;
  return async (
    sample: Uint8Array,
    config: TrialDecodeConfig,
    signal?: AbortSignal,
  ): Promise<GopTrialDecodeProbeOutcome> => {
    // Gương probe main-thread: đã abort trước khi bắt đầu thì không decode nữa.
    if (signal?.aborted) return false;
    let worker: Worker;
    try {
      worker = makeWorker();
    } catch {
      if (fallbackProbe !== null) return fallbackProbe(sample, config, signal);
      throw new Error("trial-decode worker unavailable");
    }
    // Transfer BẢN SAO: buffer gốc của caller không bị neuter sau postMessage.
    const copy = sample.slice();
    const request: TrialDecodeWorkerRequest = {
      sample: copy.buffer as ArrayBuffer,
      config: {
        codec: config.codec,
        codedWidth: config.codedWidth,
        codedHeight: config.codedHeight,
        description: config.description,
      },
    };
    return await new Promise<GopTrialDecodeProbeOutcome>((resolve, reject) => {
      let settled = false;
      const terminate = (): void => {
        try {
          worker.terminate();
        } catch {
          /* bỏ qua */
        }
      };
      const settleWithFallback = (): void => {
        if (fallbackProbe !== null) {
          void Promise.resolve()
            .then(() => fallbackProbe(sample, config, signal))
            .then(resolve, reject);
        } else {
          reject(new Error("trial-decode worker failed"));
        }
      };
      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        terminate();
        reject(new Error("trial-decode aborted"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      const finishErrorPath = (): void => {
        signal?.removeEventListener("abort", onAbort);
        terminate();
        settleWithFallback();
      };
      worker.onmessage = (ev: MessageEvent): void => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        terminate();
        const data = ev.data as unknown as TrialDecodeWorkerResponse | null;
        if (data?.type === "result") {
          // Đợt 78 F8 — worker báo lỗi kèm lý do (hôm nay chỉ zero-run):
          // chuyển thành structured failure để runTrialDecode giữ nguyên
          // lý do tới T3. Worker cũ không gửi reason → false thường.
          // Reason kèm outcome true / "unsupported-config" thì bỏ qua.
          if (
            data.outcome === false &&
            typeof data.reason === "string" &&
            data.reason.length > 0
          ) {
            resolve({ failed: true, reason: data.reason.slice(0, 200) });
          } else {
            resolve(data.outcome);
          }
        } else {
          settleWithFallback();
        }
      };
      worker.onerror = (): void => {
        if (settled) return;
        settled = true;
        finishErrorPath();
      };
      try {
        worker.postMessage(request, [copy.buffer as ArrayBuffer]);
      } catch {
        if (settled) return;
        settled = true;
        finishErrorPath();
      }
    });
  };
}

/** Kế hoạch 1 lần gọi trial-decode: probe nào + timeout bao nhiêu. */
export interface TrialDecodeCallPlan {
  probe: GopTrialDecodeProbe | null;
  timeoutMs: number;
  /** true = decode ở worker nền với trần dài; false = đường main-thread cũ. */
  viaWorker: boolean;
  /** Lý do không đi worker dù sample lớn (vd "no-worker") — để ghi log. */
  workerUnavailableReason?: string;
}

/**
 * Chọn probe + timeout cho 1 lần trial-decode theo kích thước sample.
 *
 *   - `allowWorker` chỉ true khi caller dùng probe mặc định (T3:
 *     `opts.trialDecodeProbe === undefined`); probe inject của caller
 *     không bao giờ bị đưa sang worker.
 *   - Chỉ sample mà timeout main-thread đã chạm trần 2500 ms mới đi
 *     worker (ngưỡng ~7,7 MiB với base 200 ms); sample nhỏ hơn giữ
 *     nguyên probe + timeout main-thread.
 *   - Không dựng được worker probe (không có Worker) → về đường
 *     main-thread cũ, kèm `workerUnavailableReason: "no-worker"`.
 */
export function planTrialDecodeCall(args: {
  sampleBytes: number;
  baseTimeoutMs?: number;
  defaultProbe: GopTrialDecodeProbe | null;
  allowWorker: boolean;
  workerFactory?: TrialDecodeWorkerFactory;
}): TrialDecodeCallPlan {
  const base = args.baseTimeoutMs ?? DEFAULT_TRIAL_DECODE_TIMEOUT_MS;
  const mainTimeout = trialDecodeTimeoutForSampleSize(args.sampleBytes, base);
  if (!args.allowWorker || mainTimeout < MAX_TRIAL_DECODE_TIMEOUT_MS) {
    return { probe: args.defaultProbe, timeoutMs: mainTimeout, viaWorker: false };
  }
  const workerProbe = createWorkerTrialDecodeProbe(args.workerFactory, args.defaultProbe);
  if (workerProbe === null) {
    return {
      probe: args.defaultProbe,
      timeoutMs: mainTimeout,
      viaWorker: false,
      workerUnavailableReason: "no-worker",
    };
  }
  return {
    probe: workerProbe,
    timeoutMs: trialDecodeTimeoutForSampleSizeWorker(args.sampleBytes, base),
    viaWorker: true,
  };
}
