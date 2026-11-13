// gopTrialDecodeWorker62R4.worker.ts — Phase 9 đợt 62, luồng R4:
// Worker entry cho trial-decode keyframe lớn (đóng nợ đợt 61 §5.7).
//
// Worker chạy probe trial-decode trình duyệt THẬT (`VideoDecoder`) trong
// DedicatedWorker — cùng logic với probe main-thread
// (`createBrowserTrialDecodeProbe`), chỉ khác là decode không kẹt main
// thread. Main thread `terminate()` worker khi có verdict / lỗi / abort
// nên không cần cơ chế hủy trong worker.
//
// Giao thức (xem `gopTrialDecodeWorker62R4.ts`):
//   main → worker: `{ sample: ArrayBuffer, config: TrialDecodeConfig }`
//     (sample là bản sao đã transfer)
//   worker → main: `{ type: "result", outcome }` hoặc
//     `{ type: "error", message }`
//   Đợt 78 F8: result có thêm `reason` tùy chọn khi outcome === false và
//   worker biết rõ lý do (quét zero-run) — xem file protocol.
// Worker không tự terminate sau khi trả verdict — main thread terminate.
import { createBrowserTrialDecodeProbe, scanAvccZeroRun } from "./gopTrialDecode55L8";
import type {
  TrialDecodeWorkerRequest,
  TrialDecodeWorkerResponse,
} from "./gopTrialDecodeWorker62R4";

const scope = self as unknown as {
  onmessage: ((ev: MessageEvent<TrialDecodeWorkerRequest>) => void) | null;
  postMessage: (message: TrialDecodeWorkerResponse) => void;
};

scope.onmessage = (ev: MessageEvent<TrialDecodeWorkerRequest>): void => {
  const { sample, config } = ev.data;
  const bytes = new Uint8Array(sample);
  // Đợt 77 E7 — quét zero-run AVCC trong worker TRƯỚC khi decode: đường
  // worker là đường duy nhất cho sample lớn (≥ ~7,7 MiB) nên quét ở đây
  // vừa bắt được keyframe bị zero-giữa vừa không kẹt main thread (quét
  // 50 MiB lossless ~1 s — xem LIMITS E7 §2.3). Violation → false
  // (decode-failed) để main thread fallback về full-file như probe-false;
  // inconclusive → decode như cũ (fail-open).
  // Đợt 78 F8 — kèm theo lý do quét (`reason: "zero-run: ..."`, đúng
  // định dạng T3 tự tổng hợp ở đường main-thread) để lý do không bị mất
  // ở protocol boolean — main thread chuyển thành structured failure và
  // runTrialDecode giữ nguyên tới T3 (xem gopTrialDecode55L8.ts /
  // gopTrialDecodeWorker62R4.ts). Chuỗi reason tiếng Anh (quy ước file).
  const scan = scanAvccZeroRun(bytes, config.codec);
  if (scan.violation) {
    scope.postMessage({
      type: "result",
      outcome: false,
      reason: `zero-run: ${scan.reason}`,
    });
    return;
  }
  const probe = createBrowserTrialDecodeProbe();
  if (probe === null) {
    scope.postMessage({
      type: "error",
      message: "no-decoder-in-worker: VideoDecoder không có trong worker",
    });
    return;
  }
  void probe(bytes, config).then(
    (outcome) => scope.postMessage({ type: "result", outcome }),
    (e: unknown) =>
      scope.postMessage({
        type: "error",
        message: String((e as Error)?.message ?? e).slice(0, 200),
      }),
  );
};
