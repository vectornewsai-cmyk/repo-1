/**
 * Phase 9 đợt 38, luồng U1 — Logic thuần cho toggle UI decode-ahead Q3.
 *
 * Bối cảnh (đọc docs/PHASE9_ROUND37_T2_PACED_Q3_LIMITS.md trước khi đổi):
 * - Đợt 37 T2 đã nối Q3 vào ReversePreviewController NHƯNG chỉ qua cổng
 *   opt-in S3 (resolveDecodeAheadGate), mặc định TẮT, chưa có toggle UI.
 *   Bật hiện tại cần gọi enableDecodeAheadFromGate với số đo decode thật
 *   (HW proof + SW measurement) — cờ console __vcutReverseWebcodecs một
 *   mình KHÔNG bật Q3. Module này KHÔNG đổi luật đó: nó chỉ là lớp
 *   trạng thái thuần để UI (preview.tsx) và registry (reverseWebcodecs.ts)
 *   dùng chung, mọi lần bật đều phải đi qua resolveDecodeAheadGate.
 * - "Bật giữa chừng" (ghi rõ, không giấu): toggle chỉ đặt cờ "muốn bật"
 *   (wanted) + thử cổng ngay trên các controller đã có. Controller chưa
 *   có số đo thì cổng chặn (hardware/software-not-measured); khi cửa sổ
 *   decode mới đo được số đo thật thì controller tự thử lại cổng ngay
 *   sau lần decode đó (xem reverseWebcodecs.ts, hunk U1) — nên prefetch
 *   chỉ xuất hiện từ lần decode cửa sổ mới trở đi, không prefetch ngược
 *   được cho cửa sổ đang giữ sẵn (buffer file của nó đã nhả, như T2).
 * - Bằng chứng hardware trong đường app: null (chưa đo). Đo HW thật cần
 *   một lần decode probe bằng prefer-hardware như probe R4 ở bench,
 *   chưa có trong app — nên trên máy không có HW, cổng chỉ mở bằng
 *   nhánh footage dễ decode (SW >= 2× fps phát). Module này không bịa
 *   proof HW để mở cổng.
 * - Chuỗi cổng (warnings của resolveDecodeAheadGate) KHÔNG dịch: UI hiển
 *   thị nguyên văn đúng chuỗi module cổng, theo luật T2. Mọi chuỗi MỚI
 *   của toggle/badge (nhãn, trạng thái, lý do chặn, gợi ý) đều qua i18n
 *   vi/en (key decodeahead.*) — hàm dưới chỉ trả về KEY i18n, không trả
 *   chuỗi đã dịch, để module này vẫn thuần và test được bằng Node.
 */
import type {
  DecodeAheadDecision,
  DecodeAheadGateInput,
  SoftwareDecodeMeasurement,
} from "./reversePreviewGate";

/** Trạng thái UI của decode-ahead nhìn từ phía user. */
export type DecodeAheadUiStatus = "off" | "blocked" | "running";

/**
 * Trạng thái gộp cho UI: wanted = user đã bật toggle (cờ "muốn bật",
 * có thể đang bị cổng chặn); active = có controller đang prefetch thật.
 * active thắng wanted: controller bật bằng đường trực tiếp (probe T2)
 * vẫn hiện "đang chạy" dù cờ wanted chưa từng đặt.
 */
export function resolveDecodeAheadUiStatus(
  wanted: boolean,
  active: boolean,
): DecodeAheadUiStatus {
  if (active) return "running";
  if (wanted) return "blocked";
  return "off";
}

/** Số frame prefetch của một đoạn aheadRange (null = chưa prefetch). */
export function prefetchFrameCount(
  range: { from: number; to: number } | null,
): number {
  if (!range) return 0;
  return Math.max(0, range.to - range.from + 1);
}

/**
 * Đầu vào cổng cho đường app: optIn = cờ wanted của toggle; hardware
 * luôn null (chưa đo trong app, xem ghi chú đầu file); software = số đo
 * cửa sổ decode thật gần nhất của đúng controller/footage đó (null =
 * chưa decode cửa sổ nào). Không đổi mặc định: wanted=false → optIn
 * false → cổng chặn (lý do opt-in-off).
 */
export function decodeAheadGateInputForToggle(
  wanted: boolean,
  measurement: SoftwareDecodeMeasurement | null,
): DecodeAheadGateInput {
  return {
    optIn: wanted,
    hardwareProof: null,
    softwareMeasurement: measurement,
  };
}

/**
 * Mọi mã lý do mà resolveDecodeAheadGate có thể trả (đọc từ
 * reversePreviewGate.ts — nếu cổng thêm mã mới mà không thêm key ở đây
 * thì test dưới sẽ fail thay vì lặng lẽ hiện chuỗi lạ).
 */
export const DECODE_AHEAD_REASON_CODES = [
  "opt-in-off",
  "hardware-decode-proven",
  "easy-decode-footage",
  "hardware-not-measured",
  "hardware-decode-absent",
  "hardware-decode-unproven",
  "software-decode-not-measured",
  "software-decode-below-easy-threshold",
] as const;

export type DecodeAheadReasonCode =
  (typeof DECODE_AHEAD_REASON_CODES)[number];

/**
 * Key i18n cho một mã lý do cổng (chuỗi hiển thị lấy qua i18nT(key) ở
 * UI, không hardcode tiếng Việt ở đây). Mã lạ → key unknown để UI hiện
 * câu chung thay vì hiện mã thô.
 */
export function decodeAheadReasonI18nKey(code: string): string {
  switch (code) {
    case "opt-in-off":
      return "decodeahead.reason.optInOff";
    case "hardware-decode-proven":
      return "decodeahead.reason.hardwareProven";
    case "easy-decode-footage":
      return "decodeahead.reason.easyFootage";
    case "hardware-not-measured":
      return "decodeahead.reason.hardwareNotMeasured";
    case "hardware-decode-absent":
      return "decodeahead.reason.hardwareAbsent";
    case "hardware-decode-unproven":
      return "decodeahead.reason.hardwareUnproven";
    case "software-decode-not-measured":
      return "decodeahead.reason.softwareNotMeasured";
    case "software-decode-below-easy-threshold":
      return "decodeahead.reason.softwareBelowThreshold";
    default:
      return "decodeahead.reason.unknown";
  }
}

/**
 * Đợt 39 T4 — QUYẾT ĐỊNH RE-GATE (chốt nợ U1 §5.3 / ROUND38 §5.5):
 * GIỮ LUẬT T2 — cổng S3 chỉ xét lúc BẬT, KHÔNG re-gate liên tục khi
 * đang chạy. Lý do (có số đo, không phải cảm tính):
 * - Số đo decode cửa sổ trên cùng fixture 360p dao động 10–383 fps
 *   theo tải (U1 §2.3): re-gate theo từng cửa sổ sẽ quyết định chủ
 *   yếu bằng nhiễu tải, không phải độ khó footage — bật/tắt liên tục
 *   (flapping) ngay cả khi footage không đổi.
 * - Mọi hysteresis đủ rộng để hết flapping (vd 3 cửa sổ chậm liên tiếp
 *   mới tắt) đều phản ứng sau ~7,5 s (3 cửa sổ 75 frame @30fps) — tới
 *   lúc đó tải thường đã đổi, lợi ích ≈ 0 mà badge vẫn nhấp nháy.
 * - Prefetch là việc nền best-effort, tối đa 1 cửa sổ đang bay: giữ
 *   bật trong cửa sổ chậm chỉ tốn đúng 1 cửa sổ đó (frame thừa bị
 *   evict ở lần decode cửa sổ sau), không chặn đường decode chính.
 * - User vẫn luôn tắt tay được ngay (toggle off → không prefetch mới
 *   + prefetch đang bay bị dọn khi xong, xem shouldDropSettledPrefetch).
 * Vì vậy "đang chạy mà cửa sổ sau đo chậm" KHÔNG tự tắt: cổng chỉ xét
 * lại khi (a) user bật toggle, hoặc (b) wanted=true mà controller chưa
 * bật thì cửa sổ decode mới tự thử lại (hành vi U1, giữ nguyên).
 * Hàm dưới khóa đúng luật này để test bắt được nếu ai đó vô tình đổi
 * nhánh auto-apply trong ensureWindowForTime thành re-gate mỗi cửa sổ.
 */
export function shouldAutoApplyDecodeAhead(
  wanted: boolean,
  enabled: boolean,
): boolean {
  return wanted && !enabled;
}

/**
 * Đợt 39 T4 — luật dọn prefetch đang bay khi user tắt giữa chừng.
 * Prefetch không huỷ được giữa chừng (VideoDecoder không có cancel;
 * decodeGop đã nuốt lỗi từng chunk): "tắt" nghĩa là (1) không khởi
 * động prefetch mới nào, (2) aheadRange về null ngay, và (3) khi
 * prefetch đang bay settle mà controller VẪN đang tắt VÀ không có lần
 * decode cửa sổ nào đang chạy thì evict đoạn prefetch đó khỏi cache
 * (chỉ giữ cửa sổ hiện tại) — để badge "prefetch 0" khớp đúng cache,
 * không còn frame prefetch nằm lại sau khi tắt. Nếu lúc settle mà
 * controller đã bật lại thì để nguyên (prefetch mới sở hữu đoạn đó
 * hoặc lần decode cửa sổ sau sẽ evict); nếu đang có decode cửa sổ bay
 * thì cũng để nguyên (lần decode đó evict sau, tránh evict nhầm frame
 * của cửa sổ đang decode dở). Trả false cho mọi trường hợp còn lại.
 */
export function shouldDropSettledPrefetch(
  enabled: boolean,
  disposed: boolean,
  decodeInFlight: boolean,
): boolean {
  return !enabled && !disposed && !decodeInFlight;
}

/** Tập keep (chỉ số decode) của một cửa sổ decode, để evictExcept giữ. */
export function keepIndicesForWindow(
  range: { from: number; to: number } | null,
): Set<number> {
  const keep = new Set<number>();
  if (!range) return keep;
  for (let i = range.from; i <= range.to; i++) keep.add(i);
  return keep;
}

/**
 * Nhãn ngắn cho 1 controller trong title badge nhiều controller: lấy
 * basename của URL (blob:/http(s)://... đều được), cắt 40 ký tự; URL
 * không đọc được basename thì dùng "clip {index+1}". Nhãn này chỉ để
 * phân biệt các dòng lý do, không phải tên clip thật trong store.
 */
export function controllerLabel(url: string, index: number): string {
  try {
    const path = url.split("?")[0].split("#")[0];
    const base = decodeURIComponent(path.split("/").pop() || "");
    if (base) return base.length > 40 ? `${base.slice(0, 37)}…` : base;
  } catch {
    /* rơi về fallback bên dưới */
  }
  return `clip ${index + 1}`;
}

/** Một controller trong trạng thái gộp (để badge/title không hợp nhầm). */
export interface DecodeAheadPerControllerStatus {
  /** Nhãn ngắn (basename URL) để hiện trong title badge. */
  label: string;
  /** Controller có đang prefetch thật không. */
  active: boolean;
  /** Số frame prefetch đang giữ của controller này (0 khi không chạy). */
  prefetchFrames: number;
  /** Số đo decode thật gần nhất của controller này (null = chưa đo). */
  measurementFps: number | null;
  /** Độ phân giải của số đo gần nhất (null = chưa đo). */
  measurementResolution: string | null;
  /** Lý do chặn của decision cổng gần nhất của controller này. */
  reasons: string[];
}

/**
 * Đợt 39 T4 — các controller bị chặn có lý do khác nhau không (để
 * badge không hiện 1 lý do đại diện gây hiểu nhầm). So sánh tập lý do
 * (không quan tâm thứ tự); 0–1 controller bị chặn → false.
 */
export function blockedReasonsDiffer(
  entries: DecodeAheadPerControllerStatus[],
): boolean {
  const blocked = entries.filter((e) => !e.active);
  if (blocked.length < 2) return false;
  const first = [...blocked[0].reasons].sort().join("\n");
  return blocked.some((e) => [...e.reasons].sort().join("\n") !== first);
}

/**
 * Gộp nhiều decision (mỗi controller một decision) thành một decision
 * duy nhất cho UI: chỉ cần 1 controller được phép là coi như được phép
 * (warnings gộp, giữ thứ tự xuất hiện, không trùng); khi tất cả đều bị
 * chặn thì reasons là hợp các lý do chặn (không trùng). Decision rỗng
 * (chưa có controller nào) → blocked với reasons rỗng — caller khi đó
 * phải tự tính decision "chưa đo" qua cổng (xem setReverseDecodeAhead-
 * Wanted), không dùng hàm này để bịa verdict.
 */
export function aggregateDecodeAheadDecisions(
  decisions: DecodeAheadDecision[],
): DecodeAheadDecision {
  const seenWarnings = new Set<string>();
  const warnings: string[] = [];
  // Đợt 80 H7 — gộp warningKeys song song với warnings (khử trùng, giữ
  // thứ tự; decision cũ không có warningKeys → coi như rỗng).
  const seenWarningKeys = new Set<string>();
  const warningKeys: string[] = [];
  const seenReasons = new Set<string>();
  const reasons: string[] = [];
  let anyAllowed = false;
  for (const d of decisions) {
    if (d.verdict === "allowed-experiment") anyAllowed = true;
    for (const w of d.warnings) {
      if (!seenWarnings.has(w)) {
        seenWarnings.add(w);
        warnings.push(w);
      }
    }
    for (const k of d.warningKeys ?? []) {
      if (!seenWarningKeys.has(k)) {
        seenWarningKeys.add(k);
        warningKeys.push(k);
      }
    }
    for (const r of d.reasons) {
      if (!seenReasons.has(r)) {
        seenReasons.add(r);
        reasons.push(r);
      }
    }
  }
  if (anyAllowed) {
    return { verdict: "allowed-experiment", reasons, warnings, warningKeys };
  }
  return { verdict: "blocked", reasons, warnings: [], warningKeys: [] };
}
