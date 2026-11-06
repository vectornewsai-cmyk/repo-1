/**
 * ttsEstimate45A3.ts — Ước lượng độ dài giọng đọc TTS theo tầng độ dài
 * (Phase 9 đợt 45, luồng A3 — đóng nợ đợt 44 §4: ước lượng Z3 chỉ hiệu
 * chuẩn trên 1 giọng, 3 mẫu).
 *
 * Vấn đề của Z3 (`ttsDuration44Z3.ts`): một hằng duy nhất 18,4 ký tự/giây
 * cho mọi độ dài, trong khi chính 3 mẫu đo đã cho thấy sai số phụ thuộc
 * độ dài — mẫu 29 ký tự lệch −24% (ước lượng thấp hơn thật), hai mẫu
 * 114/227 ký tự chỉ lệch +4,5%/+2,0%. File này không thay thế Z3 và
 * KHÔNG được nối vào `TtsButton` trong luồng này (quy tắc file của đợt
 * 45: chỉ file hậu tố 45A3; việc nối UI để luồng sau làm, tránh xung đột
 * với các luồng song song). Nó cung cấp khoảng [min, max] thay vì một
 * số điểm duy nhất, để caller tương lai hiển thị ` (≈a–bs)` thay vì
 * mạo nhận một con số chính xác.
 *
 * TRUNG THỰC VỀ HỆ SỐ (đọc trước khi dùng):
 * - Hệ số trung tâm mọi tầng hiện đều là 18,4 ký tự/giây — tức hằng Z3,
 *   đo thật qua bridge local (giọng "Hải Đăng", VieNeu-TTS v3 Turbo,
 *   tổng 370 ký tự / 20,08 s, header khớp ffprobe từng mẫu; xem
 *   docs/PHASE9_ROUND44_Z3_RELINK_LIMITS.md §4.3). KHÔNG có hệ số riêng
 *   nào cho từng tầng được bịa ra trong luồng này: cờ `calibrated`
 *   của mọi tầng đều là `false` cho tới khi có mẫu đo riêng theo tầng.
 * - Khoảng sai số KHÔNG phải khoảng tin cậy thống kê (chỉ 3 mẫu thì
 *   không đủ để tính). Nó là khoảng phòng thủ được chọn sao cho chứa
 *   được sai số đã quan sát của mẫu Z3 rơi vào tầng đó:
 *     + short (20–79 ký tự): mẫu 29 ký tự có tỉ lệ thật/ước lượng 1,32
 *       → khoảng [0,9×, 1,4×] chứa được 1,32 với biên an toàn.
 *     + medium (80–199) và long (≥200): mẫu 114/227 ký tự có tỉ lệ
 *       0,955/0,979 → khoảng [0,9×, 1,2×] chứa được cả hai.
 *     + veryShort (<20 ký tự): KHÔNG có mẫu đo nào — khoảng [0,8×, 1,8×]
 *       là phỏng đoán phòng thủ thuần túy (quãng nghỉ cố định chiếm tỉ
 *       trọng lớn hơn khi câu càng ngắn, nên lệch lên là hướng rủi ro
 *       chính), KHÔNG được trích dẫn như sai số đo. Tầng này là tầng
 *       kém tin cậy nhất; hậu tố cho câu <20 ký tự chỉ mang tính bậc
 *       độ lớn.
 * - Ước lượng này chỉ dùng cho hiển thị (hậu tố toast tương lai), KHÔNG
 *   dùng để cắt/ghép audio hay tính timeline — như Z3.
 * - Chưa đo: Safari/Firefox/máy thật; bridge expose `X-TTS-*` chỉ có
 *   tác dụng sau restart bridge (nợ Z3 còn lại).
 *
 * Mẫu đo MỚI trong luồng này (05/11/2026, chạy trực tiếp tts.py qua
 * server/tts/.venv2 — bridge KHÔNG chạy sẵn trên VM lúc đo nên không đo
 * qua header HTTP; độ dài lấy từ header WAV và cross-check bằng ffprobe,
 * khớp từng mili-giây; số đo under-load, các luồng đợt 45 chạy song song):
 * - "Xin chào!" (9 ký tự, giọng "Hải Đăng"): 0,720 s → tốc độ suy ra
 *   12,5 ký tự/giây, tỉ lệ thật/ước lượng (18,4) = 1,47 — NẰM TRONG
 *   khoảng veryShort [0,8×, 1,8×] ([0,39 s, 0,88 s]), xác nhận hướng
 *   lệch lên ở câu rất ngắn nhưng KHÔNG đủ để đổi hệ số tầng (n = 1).
 * - Câu 71 ký tự, giọng "Trúc Ly" (giọng khác đầu tiên được đo):
 *   3,920 s → 18,1 ký tự/giây, tỉ lệ thật/ước lượng = 1,02 — nằm trong
 *   khoảng short [0,9×, 1,4×]. Một mẫu duy nhất không chứng minh được
 *   "giọng khác cũng giống Hải Đăng", chỉ ghi nhận điểm này không lệch.
 * Kết luận: giữ nguyên 18,4 mọi tầng; hai mẫu mới được khóa bằng test
 * (nằm trong khoảng) thay vì dùng để bịa hệ số riêng theo tầng/giọng.
 * Ngưỡng tự đặt: một tầng chỉ được gắn `calibrated: true` khi có ≥3 mẫu
 * đo riêng của tầng đó, không tính mẫu gộp Z3.
 */

import { TTS_VI_CHARS_PER_SEC, ttsTextLength } from "./ttsDuration44Z3";

/** Định danh tầng độ dài (theo số ký tự đếm bằng code point, như Z3). */
export type TtsTier45A3 = "veryShort" | "short" | "medium" | "long";

/** Đặc tả một tầng: hệ số trung tâm + khoảng phòng thủ nhân với ước lượng. */
export interface TtsTierSpec45A3 {
  tier: TtsTier45A3;
  /** Số ký tự tối thiểu của tầng (bao gồm). */
  minChars: number;
  /** Số ký tự tối đa của tầng (bao gồm); null = không giới hạn trên. */
  maxChars: number | null;
  /** Hệ số trung tâm (ký tự/giây). Hiện mọi tầng đều = hằng Z3 18,4. */
  charsPerSec: number;
  /**
   * true chỉ khi tầng có mẫu đo RIÊNG của chính nó. Hiện mọi tầng đều
   * false: 18,4 là hiệu chuẩn gộp (pooled) của Z3, không phải hiệu
   * chuẩn riêng theo tầng.
   */
  calibrated: boolean;
  /** Hệ số nhân dưới cho khoảng: minSec = central × minFactor. */
  minFactor: number;
  /** Hệ số nhân trên cho khoảng: maxSec = central × maxFactor. */
  maxFactor: number;
  /** Ghi chú nguồn gốc hệ số/khoảng của tầng (để không ai đọc nhầm). */
  note: string;
}

/**
 * Bảng tầng (ROUND45-A3). Ranh giới: veryShort <20, short 20–79,
 * medium 80–199, long ≥200 ký tự. Ranh giới 20/80/200 được chọn để 3 mẫu
 * Z3 (29/114/227 ký tự) rơi vào 3 tầng khác nhau, giúp khoảng của từng
 * tầng chứa được đúng mẫu Z3 của nó (xem test khóa).
 */
export const TTS_TIERS_45A3: readonly TtsTierSpec45A3[] = [
  {
    tier: "veryShort",
    minChars: 1,
    maxChars: 19,
    charsPerSec: TTS_VI_CHARS_PER_SEC,
    calibrated: false,
    minFactor: 0.8,
    maxFactor: 1.8,
    note: "CHƯA HIỆU CHUẨN riêng — 1 mẫu thật 05/11/2026 (9 ký tự, Hải Đăng, 0,720 s, tỉ lệ thật/ước lượng 1,47) nằm trong khoảng này nhưng n = 1 chưa đủ đổi hệ số; vẫn dùng hệ số chuẩn 18,4 + khoảng phòng thủ rộng, không phải sai số đo.",
  },
  {
    tier: "short",
    minChars: 20,
    maxChars: 79,
    charsPerSec: TTS_VI_CHARS_PER_SEC,
    calibrated: false,
    minFactor: 0.9,
    maxFactor: 1.4,
    note: "CHƯA HIỆU CHUẨN riêng — dùng hệ số chuẩn 18,4; khoảng [0,9×, 1,4×] chứa được tỉ lệ thật/ước lượng 1,32 của mẫu Z3 29 ký tự.",
  },
  {
    tier: "medium",
    minChars: 80,
    maxChars: 199,
    charsPerSec: TTS_VI_CHARS_PER_SEC,
    calibrated: false,
    minFactor: 0.9,
    maxFactor: 1.2,
    note: "CHƯA HIỆU CHUẨN riêng — dùng hệ số chuẩn 18,4; khoảng [0,9×, 1,2×] chứa được tỉ lệ 0,955 của mẫu Z3 114 ký tự.",
  },
  {
    tier: "long",
    minChars: 200,
    maxChars: null,
    charsPerSec: TTS_VI_CHARS_PER_SEC,
    calibrated: false,
    minFactor: 0.9,
    maxFactor: 1.2,
    note: "CHƯA HIỆU CHUẨN riêng — dùng hệ số chuẩn 18,4; khoảng [0,9×, 1,2×] chứa được tỉ lệ 0,979 của mẫu Z3 227 ký tự.",
  },
];

/** Tầng của một độ dài (ký tự); trả null khi độ dài ≤ 0. */
export function ttsTierForLength45A3(charCount: number): TtsTierSpec45A3 | null {
  if (!Number.isFinite(charCount) || charCount <= 0) return null;
  for (const spec of TTS_TIERS_45A3) {
    if (charCount >= spec.minChars && (spec.maxChars === null || charCount <= spec.maxChars)) {
      return spec;
    }
  }
  return null;
}

/** Kết quả ước lượng theo tầng: điểm trung tâm + khoảng [min, max]. */
export interface TtsEstimateRange45A3 {
  tier: TtsTier45A3;
  /** Số ký tự (code point) của text. */
  chars: number;
  /** Hệ số trung tâm đã dùng (hiện luôn 18,4). */
  charsPerSec: number;
  /** Có phải hệ số riêng theo tầng đã hiệu chuẩn không (hiện luôn false). */
  calibrated: boolean;
  /** Ước lượng điểm trung tâm (giây) = chars / charsPerSec. */
  seconds: number;
  /** Cận dưới phòng thủ (giây). */
  minSec: number;
  /** Cận trên phòng thủ (giây). */
  maxSec: number;
}

/**
 * Ước lượng khoảng độ dài giọng đọc từ text. Trả null khi text rỗng
 * (không bịa số) — cùng quy ước với `estimateTtsDurationSec` của Z3.
 */
export function estimateTtsDurationRange45A3(text: string): TtsEstimateRange45A3 | null {
  const chars = ttsTextLength(text ?? "");
  const spec = ttsTierForLength45A3(chars);
  if (spec === null) return null;
  const seconds = chars / spec.charsPerSec;
  return {
    tier: spec.tier,
    chars,
    charsPerSec: spec.charsPerSec,
    calibrated: spec.calibrated,
    seconds,
    minSec: seconds * spec.minFactor,
    maxSec: seconds * spec.maxFactor,
  };
}

/**
 * Ước lượng điểm trung tâm (giây), tương thích chữ ký Z3 cho caller nào
 * chỉ cần một số (vẫn nên dùng khoảng khi hiển thị cho user).
 */
export function estimateTtsDurationSec45A3(text: string): number | null {
  const r = estimateTtsDurationRange45A3(text);
  return r === null ? null : r.seconds;
}

/**
 * Hậu tố khoảng cho toast tương lai (CHƯA nối vào TtsButton trong luồng
 * này): ` (≈9.0–12.0s)`; text rỗng → "" (không bịa số).
 */
export function ttsEstimateRangeSuffix45A3(text: string): string {
  const r = estimateTtsDurationRange45A3(text);
  if (r === null) return "";
  return ` (≈${r.minSec.toFixed(1)}–${r.maxSec.toFixed(1)}s)`;
}
