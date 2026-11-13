/**
 * aiJobStream.ts — Đọc NDJSON stream của job AI dài (đợt 80 H8, gap N4).
 *
 * Các route AI dài của bridge (/api/caption, /api/caption/translate,
 * /api/scene, /api/bgremove, /api/tts, /api/tts/clone, /api/reframe) đều
 * stream NDJSON với cùng 1 tập event:
 *   {type:"phase", phase, message}                    — đổi giai đoạn
 *   {type:"progress", phase, progress, done, total, etaSeconds}
 *                                                     — tiến trình THẬT
 *   {type:"done", downloadUrl?, ...}                  — xong (+ link tải
 *                                                     file kết quả 1 lần)
 *   {type:"error", error, errorCode, ...}             — lỗi chạy thật
 *   {type:"cancelled"}                                — job đã bị hủy
 *
 * Tiến trình là THẬT (bridge tính từ trạng thái job: frame đã xử lý, giây
 * audio đã transcribe, chunk đã tổng hợp) — progress = null khi chưa biết
 * tổng, UI hiện spinner + phase thay vì % bịa. ETA là ước lượng từ tốc độ
 * hoàn thành thật trong cửa sổ 8s (xem EtaTracker ở server).
 *
 * Hủy thật: caller giữ AbortController, bấm Hủy → controller.abort() →
 * bridge nhận res 'close' → kill subprocess (xem attachClientAbort).
 * Event "cancelled" chỉ tới được client khi bridge còn gửi được (thường
 * thì kết nối đã đứt nên caller tự biết mình vừa abort) — vì vậy hàm đọc
 * này throw AiJobCancelledError khi nhận event đó, còn AbortError của
 * fetch thì caller xử lý như cũ.
 */

/** Giai đoạn job (chuỗi phase bridge gửi; phase lạ thì UI dùng phaseProcessing). */
export type AiJobPhase = string;

/** Trạng thái tiến trình hiện tại để UI hiển thị (phase + % + ETA). */
export interface AiJobProgressState {
  phase: AiJobPhase;
  /** Tiến trình 0..1, null khi chưa biết tổng (hiện spinner thay vì %). */
  progress: number | null;
  /** Số giây còn lại ước lượng, null khi chưa đủ dữ liệu. */
  etaSeconds: number | null;
  message?: string;
}

export interface AiJobDonePayload {
  type: "done";
  /** Đường dẫn tương đối "/api/ai-download/<token>" (job có file kết quả). */
  downloadUrl?: string;
  [key: string]: unknown;
}

/** Lỗi khi stream nhận event "cancelled" — caller hiện thông báo "Đã hủy". */
export class AiJobCancelledError extends Error {
  constructor() {
    super("AI_JOB_CANCELLED");
    this.name = "AiJobCancelledError";
  }
}

/** Sentinel khi stream kết thúc mà không có event "done" (bridge rớt giữa chừng). */
export const AI_JOB_STREAM_DROPPED = "AI_JOB_STREAM_DROPPED";

/** Kiểu event NDJSON thô (chỉ các field hàm này đọc; field khác giữ nguyên). */
interface AiJobRawEvent {
  type?: string;
  phase?: string;
  message?: string;
  progress?: number | null;
  done?: number | null;
  total?: number | null;
  etaSeconds?: number | null;
  error?: string;
  [key: string]: unknown;
}

export interface AiJobStreamHandlers {
  onPhase?: (phase: string, message?: string) => void;
  onProgress?: (p: AiJobProgressState) => void;
}

/**
 * Đọc NDJSON stream từ Response đã fetch (caller kiểm tra res.ok + lỗi
 * HTTP 4xx/5xx dạng JSON trước, đúng pattern runJob của CaptionModal).
 * Trả về payload event "done" (đầy đủ field, gồm downloadUrl nếu có).
 * Throw Error(evt.error) khi gặp event "error", AiJobCancelledError khi
 * gặp event "cancelled", Error(AI_JOB_STREAM_DROPPED) khi stream hết mà
 * không có "done". Dòng rác/không phải JSON thì bỏ qua, không fail luồng.
 */
export async function readAiJobStream(
  res: Response,
  handlers: AiJobStreamHandlers = {},
): Promise<AiJobDonePayload> {
  if (!res.body) throw new Error(AI_JOB_STREAM_DROPPED);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      let evt: AiJobRawEvent;
      try {
        evt = JSON.parse(line) as AiJobRawEvent;
      } catch {
        continue; // dòng rác — bỏ qua, không fail cả luồng
      }
      if (evt.type === "phase") {
        handlers.onPhase?.(typeof evt.phase === "string" ? evt.phase : "", evt.message);
      } else if (evt.type === "progress") {
        handlers.onProgress?.({
          phase: typeof evt.phase === "string" ? evt.phase : "",
          progress: typeof evt.progress === "number" ? evt.progress : null,
          etaSeconds: typeof evt.etaSeconds === "number" ? evt.etaSeconds : null,
          message: evt.message,
        });
      } else if (evt.type === "done") {
        return evt as AiJobDonePayload;
      } else if (evt.type === "cancelled") {
        throw new AiJobCancelledError();
      } else if (evt.type === "error") {
        // Giữ nguyên event để caller resolve mã lỗi bridge→web như trước
        // (resolveBridgeApiError cần cả errorCode, không chỉ message).
        const err = new Error(
          typeof evt.error === "string" && evt.error ? evt.error : "AI_JOB_FAILED",
        );
        (err as Error & { bridgeBody?: AiJobRawEvent }).bridgeBody = evt;
        throw err;
      }
      // type lạ → bỏ qua (tương thích tiến: bridge thêm event mới không vỡ UI cũ).
    }
  }
  throw new Error(AI_JOB_STREAM_DROPPED);
}

/** Kiểu lookup i18n tối thiểu (t() của ../i18n hoặc stub trong test). */
export type AiJobLookup = (key: string, vars?: Record<string, string>) => string;

/**
 * Format ETA thành chuỗi hiển thị ("còn ~45 giây" / "còn ~2 phút 10 giây" /
 * "còn ~1 giờ 5 phút"). Trả "" khi chưa ước lượng được (null/NaN/âm) —
 * caller ẩn phần ETA (AiJobProgress hiện "Đang ước lượng…" thay thế).
 * Đợt 81 I6: thêm nhánh giờ — job dài (bgremove/reframe video dài) có ETA
 * > 1 giờ, hiện "125 phút" vừa dài vừa khó đọc.
 */
export function formatAiJobEta(
  etaSeconds: number | null | undefined,
  lookup: AiJobLookup,
): string {
  if (etaSeconds === null || etaSeconds === undefined || !Number.isFinite(etaSeconds)) return "";
  const s = Math.max(0, Math.round(etaSeconds));
  if (s < 60) return lookup("aiJob.etaSeconds", { seconds: String(s) });
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return lookup("aiJob.etaHours", { hours: String(h), minutes: String(m) });
  }
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return lookup("aiJob.etaMinutes", { minutes: String(m), seconds: String(rest) });
}

/**
 * Nhãn phase đã localize theo key phase bridge gửi. Mỗi nhánh switch dùng
 * một key literal riêng (phaseLoad, phaseSynth, …) để r6-i18n-check + P7
 * orphan-scan thấy key (không build key động). Phase lạ → phaseProcessing
 * (không hiện key thô).
 * Caption/scene có resolver riêng (captionPhase63R1 / scenePhase63R5) nên
 * hàm này dùng cho TTS/bgremove/reframe + fallback chung.
 */
export function resolveAiJobPhaseLabel(phase: string, lookup: AiJobLookup): string {
  switch (phase) {
    case "load":
      return lookup("aiJob.phaseLoad");
    case "synth":
      return lookup("aiJob.phaseSynth");
    case "processing":
      return lookup("aiJob.phaseProcessing");
    case "fallback":
      return lookup("aiJob.phaseFallback");
    case "extract":
      return lookup("aiJob.phaseExtract");
    case "group":
      return lookup("aiJob.phaseGroup");
    case "scan":
      return lookup("aiJob.phaseScan");
    case "upload":
      return lookup("aiJob.phaseUpload");
    case "transcribe":
      return lookup("aiJob.phaseTranscribe");
    case "translating":
      return lookup("aiJob.phaseTranslating");
    default:
      return lookup("aiJob.phaseProcessing");
  }
}
