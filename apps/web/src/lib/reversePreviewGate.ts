// reversePreviewGate.ts — Cổng quyết định cho phát ngược ở preview
// (Phase 9 đợt 36, luồng S3; module thuần, không DOM, test bằng Node).
//
// Bối cảnh (đọc LIMITS đợt 34 Q2/Q3, đợt 35 R4, đợt 36 S3 trước khi đổi
// luật ở đây):
// - Đường WebCodecs ngược (ReverseFrameCache) đã nối vào preview sau cờ
//   opt-in (window.__vcutReverseWebcodecs, Q2) — mặc định BẬT từ đợt 47
//   C5 (toggle TopBar + localStorage `vcut-reverse-webcodecs`), trước
//   đó mặc định TẮT. Module
//   decode-ahead Q3 (reverseDecodeAhead.ts) CHƯA nối vào preview.
// - Đợt 35 R4 chứng minh VM này KHÔNG có hardware decode
//   (prefer-hardware: false + decode thật 0/300 frame), và decode phần
//   mềm footage nhiễu chỉ dao động quanh ngưỡng 30 fps theo tải — nên
//   Q3 không được nối rồi claim 30 fps ngược nói chung.
// - Đợt 36 S3 đo fps ngược của proxy Q8 trước khi chọn proxy làm hướng
//   chính (xem docs/PHASE9_ROUND36_S3_PROXY_Q8_REVERSE_LIMITS.md).
//
// Luật của cổng này (bảo thủ theo thiết kế, không phải hằng số vật lý):
// - Q3 decode-ahead CHỈ được nối/bật như THỬ NGHIỆM OPT-IN, khi cờ
//   opt-in bật VÀ (máy đã chứng minh có hardware decode HOẶC footage
//   thuộc loại dễ decode). Mặc định: CHẶN (đường element + hold-frame cũ).
// - "Chứng minh có hardware decode" cần CẢ HAI tín hiệu (bài học R4:
//   isConfigSupported trả true một mình KHÔNG chứng minh HW vì Chrome
//   vẫn trả true khi fallback phần mềm): prefer-hardware supported VÀ
//   decode thật bằng prefer-hardware ra > 0 frame.
// - "Footage dễ decode" = đo decode phần mềm trên đúng footage đó đạt
//   >= 2× fps phát (mặc định 60 fps khi phát 30 fps). Hệ số 2 là biên
//   chống dao động theo tải (Q3/R4 đo được decode nhiễu dao động
//   7,7–37 fps theo tải; ngưỡng 30 trần trụi không đủ biên). Số đo
//   under-load đạt >= 60 vẫn tính là dễ vì tải chỉ làm chậm thêm —
//   nhưng kết quả phải ghi rõ nhãn tải, không mạo nhận là số quiet.
// - Proxy làm hướng chính cho chiều ngược CHỈ khi đo thật trên đúng
//   cặp gốc/proxy cho thấy proxy đạt fps phát VÀ không thua đường gốc.
//   Hàm resolveProxyMainDirection chỉ tính từ số đo truyền vào — verdict
//   của từng đợt nằm ở LIMITS của đợt đó, không hard-code ở đây.
// - Module này KHÔNG tự nối gì vào preview và KHÔNG đổi cờ mặc định:
//   nó là hàm thuần để code nối preview (đợt sau) BẮT BUỘC hỏi trước
//   khi bật decode-ahead hoặc quảng bá proxy làm hướng chính. Bỏ qua
//   cổng này mà bật là vi phạm luật đợt 36 S3.

/** Bằng chứng hardware decode: cần cả hai tín hiệu (xem ghi chú đầu file). */
export interface HardwareDecodeProof {
  /** VideoDecoder.isConfigSupported với hardwareAcceleration prefer-hardware. */
  preferHardwareSupported: boolean;
  /** Số frame decode thật được bằng cấu hình prefer-hardware (> 0 mới tính). */
  hardwareDecodedFrames: number;
  /** Số frame đã thử decode bằng prefer-hardware. */
  hardwareAttemptedFrames: number;
  /** fps decode phần cứng đo được (null khi chưa đo / decode 0 frame). */
  hardwareDecodeFps: number | null;
}

/** Số đo decode phần mềm trên đúng footage cần xét (1 GOP trở lên). */
export interface SoftwareDecodeMeasurement {
  /** fps decode phần mềm đo được (frames / wall). */
  decodeFps: number;
  /** Nhãn tải của lượt đo ("quiet" | "under-load"), ghi rõ không giấu. */
  loadLabel: "quiet" | "under-load";
  /** Độ phân giải đã đo, vd "1280x720" (để khỏi áp số 720p cho 1080p). */
  resolution: string;
}

/** Đầu vào cho quyết định nối Q3 decode-ahead vào preview. */
export interface DecodeAheadGateInput {
  /** Cờ opt-in của user (mặc định false; cờ console Q2 hiện tại). */
  optIn: boolean;
  /** Bằng chứng hardware decode của máy này (null = chưa đo). */
  hardwareProof: HardwareDecodeProof | null;
  /** Số đo decode phần mềm trên đúng footage này (null = chưa đo). */
  softwareMeasurement: SoftwareDecodeMeasurement | null;
  /** fps phát ngược mục tiêu (mặc định 30). */
  playbackFps?: number;
}

export type DecodeAheadVerdict = "allowed-experiment" | "blocked";

export interface DecodeAheadDecision {
  verdict: DecodeAheadVerdict;
  /** Lý do dạng mã, để UI/log hiển thị đúng trường hợp (không đoán). */
  reasons: string[];
  /** Cảnh báo hiển thị cho user khi verdict là allowed-experiment. */
  warnings: string[];
  /**
   * Đợt 80 H7 — key i18n song song với `warnings` (1:1, cùng thứ tự):
   * UI dịch qua key (reverseGate.*) thay vì hiện nguyên văn chuỗi VI.
   * `warnings` giữ nguyên (chuỗi VI cũ) làm fallback cho decision cũ
   * chưa có key + để test T2 khóa nội dung không vỡ.
   */
  warningKeys: string[];
}

/**
 * "Máy đã chứng minh có hardware decode" — cần cả hai tín hiệu.
 * supported=true mà decode 0 frame = CHƯA chứng minh (R4: decoder không
 * dựng được). attempted=0 (chưa thử decode) cũng = chưa chứng minh.
 */
export function isHardwareDecodeProven(proof: HardwareDecodeProof | null): boolean {
  if (!proof) return false;
  return (
    proof.preferHardwareSupported === true &&
    proof.hardwareAttemptedFrames > 0 &&
    proof.hardwareDecodedFrames > 0
  );
}

/**
 * Footage có dễ decode không: decode phần mềm >= 2× fps phát.
 * Ngưỡng hệ số 2 là biên chống dao động tải, xem ghi chú đầu file.
 */
export function isEasyDecodeFootage(
  measurement: SoftwareDecodeMeasurement | null,
  playbackFps: number = 30,
): boolean {
  if (!measurement || !(measurement.decodeFps > 0)) return false;
  return measurement.decodeFps >= 2 * playbackFps;
}

export function resolveDecodeAheadGate(input: DecodeAheadGateInput): DecodeAheadDecision {
  const playbackFps = input.playbackFps && input.playbackFps > 0 ? input.playbackFps : 30;
  const reasons: string[] = [];
  const warnings: string[] = [];
  // Đợt 80 H7 — warningKeys song song 1:1 với warnings (cùng thứ tự).
  const warningKeys: string[] = [];
  if (!input.optIn) {
    return { verdict: "blocked", reasons: ["opt-in-off"], warnings: [], warningKeys: [] };
  }
  const hwProven = isHardwareDecodeProven(input.hardwareProof);
  const easy = isEasyDecodeFootage(input.softwareMeasurement, playbackFps);
  if (hwProven) reasons.push("hardware-decode-proven");
  if (easy) reasons.push("easy-decode-footage");
  if (!hwProven && !easy) {
    if (!input.hardwareProof) reasons.push("hardware-not-measured");
    else if (!input.hardwareProof.preferHardwareSupported) reasons.push("hardware-decode-absent");
    else reasons.push("hardware-decode-unproven");
    if (!input.softwareMeasurement) reasons.push("software-decode-not-measured");
    else reasons.push("software-decode-below-easy-threshold");
    return { verdict: "blocked", reasons, warnings: [], warningKeys: [] };
  }
  // Được phép — nhưng CHỈ là thử nghiệm opt-in, phải kèm cảnh báo.
  warnings.push(REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI);
  warningKeys.push("reverseGate.experimentWarning");
  if (input.softwareMeasurement && input.softwareMeasurement.loadLabel === "under-load") {
    warnings.push(REVERSE_UNDER_LOAD_WARNING_VI);
    warningKeys.push("reverseGate.underLoadWarning");
  }
  if (!hwProven) {
    warnings.push(REVERSE_NO_HARDWARE_WARNING_VI);
    warningKeys.push("reverseGate.noHardwareWarning");
  }
  return { verdict: "allowed-experiment", reasons, warnings, warningKeys };
}

/** Đầu vào cho quyết định "proxy có làm hướng chính cho chiều ngược không". */
export interface ProxyMainDirectionInput {
  /** fps trình bày ngược đo được khi dùng proxy (đường element stepping). */
  proxyDisplayedFps: number | null;
  /** fps trình bày ngược đo được khi dùng file gốc (cùng phương pháp). */
  originalDisplayedFps: number | null;
  /** fps decode WebCodecs (phần mềm) của proxy, null khi chưa đo. */
  proxyDecodeFps: number | null;
  /** fps phát ngược mục tiêu (mặc định 30). */
  playbackFps?: number;
}

export interface ProxyMainDirectionDecision {
  /** "yes" chỉ khi đủ cả 3 điều kiện dưới; còn lại "no" kèm lý do. */
  verdict: "yes" | "no";
  reasons: string[];
  warnings: string[];
  /** Đợt 80 H7 — key i18n song song với `warnings` (xem DecodeAheadDecision). */
  warningKeys: string[];
}

export function resolveProxyMainDirection(input: ProxyMainDirectionInput): ProxyMainDirectionDecision {
  const playbackFps = input.playbackFps && input.playbackFps > 0 ? input.playbackFps : 30;
  const reasons: string[] = [];
  const warnings: string[] = [REVERSE_PROXY_MAIN_DIRECTION_NOTE_VI];
  // Đợt 80 H7 — key song song với warnings (decision này hiện chưa có
  // caller production nào — xem LIMITS H7 §2.4 — nhưng key đi kèm để
  // caller tương lai dịch đúng như resolveDecodeAheadGate).
  const warningKeys: string[] = ["reverseGate.proxyMainNote"];
  if (input.proxyDisplayedFps === null) {
    return { verdict: "no", reasons: ["proxy-displayed-fps-not-measured"], warnings, warningKeys };
  }
  if (input.proxyDisplayedFps < playbackFps) {
    return { verdict: "no", reasons: ["proxy-displayed-below-playback-fps"], warnings, warningKeys };
  }
  if (input.originalDisplayedFps !== null && input.proxyDisplayedFps < input.originalDisplayedFps) {
    return { verdict: "no", reasons: ["proxy-displayed-worse-than-original"], warnings, warningKeys };
  }
  if (input.proxyDecodeFps !== null && input.proxyDecodeFps < playbackFps) {
    return { verdict: "no", reasons: ["proxy-decode-below-playback-fps"], warnings, warningKeys };
  }
  reasons.push("proxy-displayed-at-playback-fps");
  if (input.proxyDecodeFps !== null) reasons.push("proxy-decode-at-playback-fps");
  return { verdict: "yes", reasons, warnings, warningKeys };
}

/** Cảnh báo dùng lại cho UI (chuỗi hiển thị, không phải logic). */
export const REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI =
  "Phát ngược bằng decode-ahead chỉ là thử nghiệm opt-in: chỉ bật cho footage dễ decode hoặc máy đã chứng minh có hardware decode; không đảm bảo 30 fps ngược cho mọi footage.";
export const REVERSE_UNDER_LOAD_WARNING_VI =
  "Số đo decode dùng để mở cổng này đo dưới tải (under-load), không phải số quiet — nhịp ngược thực tế có thể thấp hơn khi máy bận.";
export const REVERSE_NO_HARDWARE_WARNING_VI =
  "Máy này chưa chứng minh có hardware decode — phát ngược footage nặng bằng decode phần mềm có thể rớt dưới 30 fps.";
export const REVERSE_PROXY_MAIN_DIRECTION_NOTE_VI =
  "Proxy chỉ phục vụ preview (export vẫn dùng file gốc). Chọn proxy làm hướng chính cho chiều ngược vẫn cần số đo fps ngược thật trên đúng cặp gốc/proxy, không suy từ độ phân giải.";
