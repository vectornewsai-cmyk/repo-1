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
// Worker không tự terminate sau khi trả verdict — main thread terminate.
import { createBrowserTrialDecodeProbe } from "./gopTrialDecode55L8";
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
  const probe = createBrowserTrialDecodeProbe();
  if (probe === null) {
    scope.postMessage({
      type: "error",
      message: "no-decoder-in-worker: VideoDecoder không có trong worker",
    });
    return;
  }
  void probe(new Uint8Array(sample), config).then(
    (outcome) => scope.postMessage({ type: "result", outcome }),
    (e: unknown) =>
      scope.postMessage({
        type: "error",
        message: String((e as Error)?.message ?? e).slice(0, 200),
      }),
  );
};
