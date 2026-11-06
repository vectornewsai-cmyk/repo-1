/**
 * ttsEstimate46B3.ts — Ước lượng độ dài giọng đọc TTS đã hiệu chuẩn
 * theo tầng + hậu tố toast cho TtsButton (Phase 9 đợt 46, luồng B3).
 *
 * Đóng nợ đợt 45 A3 §5: (1) các tầng mới chỉ có n = 1 mẫu riêng, (2)
 * lib A3 chưa nối vào TtsButton. Luồng này đo thêm 11 mẫu thật qua
 * tts.py trực tiếp (WAV ở /tmp/tts46b3/, ngoài repo) và nối lib vào
 * TtsButton thật sự — component KHÔNG hardcode lại hệ số nào, mọi số
 * đều lấy từ bảng tầng dưới đây.
 *
 * QUY TẮC HIỆU CHUẨN (giữ từ A3, áp dụng nghiêm):
 * - Một tầng chỉ được gắn `calibrated: true` khi có ≥3 mẫu đo thật
 *   RIÊNG của tầng đó. "Mẫu" ở đây = một lần đo thật rơi vào tầng
 *   (Z3 + A3 + B3 cộng dồn); hằng gộp Z3 18,4 KHÔNG được tính là mẫu.
 * - Hệ số trung tâm của tầng hiệu chuẩn = tốc độ gộp (pooled):
 *   tổng ký tự / tổng giây của mọi mẫu trong tầng (không phải trung
 *   bình cộng của các tốc độ riêng — mẫu dài nặng ký hơn, đúng bản
 *   chất "ký tự/giây trên tổng thể").
 * - Khoảng [minFactor, maxFactor] = biên quan sát: tỉ lệ thật/ước
 *   lượng nhỏ nhất và lớn nhất của các mẫu trong tầng, tính theo hệ
 *   số gộp mới, làm tròn RA NGOÀI tới 4 chữ số thập phân (min làm
 *   tròn xuống, max làm tròn lên) để mọi mẫu đều nằm trong khoảng
 *   dù có làm tròn. Đây KHÔNG phải khoảng tin cậy thống kê — n = 3
 *   (medium/long) thì mẫu tương lai hoàn toàn có thể rơi ngoài.
 *
 * TRUNG THỰC VỀ SỐ (đọc trước khi dùng):
 * - medium/long chỉ vừa đủ n = 3 nhờ tính cả 1 mẫu Z3 cũ mỗi tầng
 *   (114 ký tự / 227 ký tự); mẫu MỚI của luồng này mỗi tầng chỉ n = 2.
 *   Vì vậy hai tầng này là "hiệu chuẩn yếu" — khoảng hẹp [0,95×, 1,10×]
 *   / [0,96×, 1,03×] phản ánh đúng 3 điểm đã đo, không bảo đảm cho
 *   câu mới. Cần thêm mẫu trước khi tin khoảng này như khoảng an toàn.
 * - veryShort/short n = 5 mỗi tầng (gồm mẫu Z3/A3 cũ), nhiều giọng
 *   (Hải Đăng, Trúc Ly, Thiện Minh, Mai Anh, Quang Sơn) — tin cậy
 *   hơn, nhưng vẫn chỉ là biên quan sát, không phải CI.
 * - PHÁT HIỆN QUAN TRỌNG: 1/11 mẫu mới RƠI NGOÀI khoảng phòng thủ A3
 *   — S2 (49 ký tự, Trúc Ly, 2,32 s) có tỉ lệ thật/ước lượng 18,4 là
 *   0,871, dưới cận 0,9× của tầng short A3. Tức khoảng A3 [0,9×, 1,4×]
 *   KHÔNG chứa được giọng đọc nhanh ở câu ngắn-vừa. Bảng B3 sửa điều
 *   này: short [0,8395×, 1,2720×] chứa được S2 (và mọi mẫu đã đo).
 *   10/11 mẫu mới còn lại đều nằm trong khoảng A3 cũ.
 * - Ước lượng này chỉ dùng cho hiển thị (hậu tố toast), KHÔNG dùng
 *   để cắt/ghép audio hay tính timeline — như Z3/A3.
 * - Chưa đo: Safari/Firefox/máy thật (xem LIMITS B3); bridge expose
 *   X-TTS-* kiểm tra ở § cuối LIMITS (chạy thật sau restart).
 *
 * Mẫu đo MỚI trong luồng này (05/11/2026, tts.py trực tiếp qua
 * server/tts/.venv2, model VieNeu-TTS v3 Turbo đã cache; độ dài lấy
 * từ header WAV và cross-check ffprobe — khớp từng mili-giây ở cả
 * 11 mẫu; thời gian nạp model KHÔNG tính vào độ dài):
 * - VS1 "Chào bạn!" 9 ký tự, Trúc Ly → 0,560 s (16,07 ký tự/giây)
 * - VS2 "Bắt đầu nào!" 12 ký tự, Hải Đăng → 0,960 s (12,50)
 * - VS3 "VCut thật nhanh." 16 ký tự, Thiện Minh → 0,960 s (16,67)
 * - VS4 "Ừ, hay đấy!" 11 ký tự, Mai Anh → 0,960 s (11,46)
 * - S1 42 ký tự, Hải Đăng → 2,160 s (19,44)
 * - S2 49 ký tự, Trúc Ly → 2,320 s (21,12) — mẫu rơi ngoài khoảng A3
 * - S3 53 ký tự, Quang Sơn → 3,280 s (16,16)
 * - M1 140 ký tự, Thiện Minh → 8,400 s (16,67)
 * - M2 158 ký tự, Ngọc Huyền → 8,240 s (19,17)
 * - L1 317 ký tự, Hải Đăng → 17,040 s (18,60)
 * - L2 379 ký tự, Trúc Ly → 18,880 s (20,07)
 * Toàn bộ text mẫu xem TTS_SAMPLES_46B3 (test khóa cả bảng).
 */

import { TTS_TIERS_45A3, ttsTierForLength45A3, type TtsTier45A3, type TtsTierSpec45A3 } from "./ttsEstimate45A3";
import { parseTtsDurationHeader, ttsTextLength } from "./ttsDuration44Z3";

/** Một lần đo thật (Z3/A3/B3) rơi vào một tầng. */
export interface TtsSample46B3 {
  id: string;
  tier: TtsTier45A3;
  /** Text đã đọc (để test đếm lại ký tự, không tin mù số chars). */
  text: string;
  voice: string;
  /** Độ dài thật (giây, từ header WAV, khớp ffprobe). */
  durationSec: number;
  /** Nguồn đo: Z3 (đợt 44, qua bridge), A3 (đợt 45, tts.py), B3 (luồng này). */
  source: "Z3" | "A3" | "B3";
}

/**
 * Toàn bộ 16 mẫu đo thật theo tầng (3 Z3 + 2 A3 + 11 B3).
 * Text B3/A3 là text thật đã chạy qua tts.py (xem file header). Riêng
 * 3 hàng Z3: LIMITS đợt 44 chỉ ghi độ dài (29/114/227 ký tự) và thời
 * lượng, KHÔNG ghi lại text gốc — nên bảng dùng chuỗi "x" lặp đúng
 * độ dài đó làm placeholder giữ đúng số ký tự (test đếm lại từ text);
 * placeholder Z3 KHÔNG phải text gốc và không được trích dẫn như vậy.
 */
export const TTS_SAMPLES_46B3: readonly TtsSample46B3[] = [
  // veryShort (n = 5): 1 A3 + 4 B3.
  { id: "A3-VS", tier: "veryShort", text: "Xin chào!", voice: "Hải Đăng", durationSec: 0.72, source: "A3" },
  { id: "B3-VS1", tier: "veryShort", text: "Chào bạn!", voice: "Trúc Ly", durationSec: 0.56, source: "B3" },
  { id: "B3-VS2", tier: "veryShort", text: "Bắt đầu nào!", voice: "Hải Đăng", durationSec: 0.96, source: "B3" },
  { id: "B3-VS3", tier: "veryShort", text: "VCut thật nhanh.", voice: "Thiện Minh", durationSec: 0.96, source: "B3" },
  { id: "B3-VS4", tier: "veryShort", text: "Ừ, hay đấy!", voice: "Mai Anh", durationSec: 0.96, source: "B3" },
  // short (n = 5): 1 Z3 + 1 A3 + 3 B3.
  { id: "Z3-S", tier: "short", text: "x".repeat(29), voice: "Hải Đăng", durationSec: 2.08, source: "Z3" },
  { id: "A3-S", tier: "short", text: "VCut Studio chạy hoàn toàn trên máy của bạn, không cần máy chủ đám mây.", voice: "Trúc Ly", durationSec: 3.92, source: "A3" },
  { id: "B3-S1", tier: "short", text: "Video này dựng hoàn toàn trên máy của bạn.", voice: "Hải Đăng", durationSec: 2.16, source: "B3" },
  { id: "B3-S2", tier: "short", text: "Nhấn nút phát để xem trước bản dựng ngay bây giờ.", voice: "Trúc Ly", durationSec: 2.32, source: "B3" },
  { id: "B3-S3", tier: "short", text: "Giọng đọc này chạy local, không cần mạng hay máy chủ.", voice: "Quang Sơn", durationSec: 3.28, source: "B3" },
  // medium (n = 3): 1 Z3 + 2 B3 — hiệu chuẩn yếu, xem header.
  { id: "Z3-M", tier: "medium", text: "x".repeat(114), voice: "Hải Đăng", durationSec: 5.92, source: "Z3" },
  { id: "B3-M1", tier: "medium", text: "VCut Studio là trình dựng video chạy hoàn toàn trên máy của bạn. Bạn cắt, ghép, thêm chữ và hiệu ứng mà không cần tải video lên máy chủ nào.", voice: "Thiện Minh", durationSec: 8.4, source: "B3" },
  { id: "B3-M2", tier: "medium", text: "Khi bạn nhấn nút đọc thành tiếng, giọng đọc được tổng hợp ngay trên máy tính của mình, rồi tự động đưa vào track âm thanh tại vị trí playhead để bạn nghe thử.", voice: "Ngọc Huyền", durationSec: 8.24, source: "B3" },
  // long (n = 3): 1 Z3 + 2 B3 — hiệu chuẩn yếu, xem header.
  { id: "Z3-L", tier: "long", text: "x".repeat(227), voice: "Hải Đăng", durationSec: 12.08, source: "Z3" },
  { id: "B3-L1", tier: "long", text: "Đây là một câu dài để kiểm tra tốc độ đọc ở văn bản dài. Khi văn bản càng dài, quãng nghỉ giữa các câu chiếm tỉ trọng nhỏ hơn, vì vậy tốc độ trung bình tính theo ký tự trên giây có thể cao hơn so với câu ngắn. VCut Studio vẫn chạy hoàn toàn local, không cần máy chủ đám mây, và mọi tính năng đều nằm trên máy của bạn.", voice: "Hải Đăng", durationSec: 17.04, source: "B3" },
  { id: "B3-L2", tier: "long", text: "Buổi sáng, bạn mở VCut Studio và kéo vài đoạn video vào timeline, cắt bỏ phần thừa, thêm chữ chạy, chèn nhạc nền và một hiệu ứng chuyển cảnh mượt mà. Sau đó bạn nhấn xuất video, chờ máy dựng xong rồi xem lại thành phẩm ngay trên máy của mình mà không cần tải lên đâu cả. Toàn bộ quy trình này chạy local, nhanh, riêng tư và không phụ thuộc vào kết nối mạng hay tài khoản đám mây.", voice: "Trúc Ly", durationSec: 18.88, source: "B3" },
];

/**
 * Bảng tầng B3: lấy ranh giới + khoảng A3 làm nền, ghi đè tầng nào đủ
 * ≥3 mẫu bằng hệ số gộp + biên quan sát của chính tầng đó. Mọi tầng
 * đều đủ n ≥ 3 sau luồng này (veryShort 5, short 5, medium 3, long 3)
 * nên mọi tầng đều calibrated: true — nhưng medium/long chỉ vừa đủ
 * nhờ 1 mẫu Z3 cũ, xem cảnh báo ở header.
 *
 * Hệ số gộp (tổng ký tự / tổng giây, 4 chữ số thập phân):
 * - veryShort: 57 / 4,16 = 13,7019 (khoảng [0,8221×, 1,1959×])
 * - short: 244 / 13,76 = 17,7326 (khoảng [0,8395×, 1,2720×])
 * - medium: 412 / 22,56 = 18,2624 (khoảng [0,9483×, 1,0958×])
 * - long: 923 / 48,00 = 19,2292 (khoảng [0,9579×, 1,0337×])
 * Test khóa lại toàn bộ phép tính này từ TTS_SAMPLES_46B3 (không tin
 * mù các hằng dưới đây).
 */
export const TTS_TIERS_46B3: readonly TtsTierSpec45A3[] = TTS_TIERS_45A3.map((spec) => {
  switch (spec.tier) {
    case "veryShort":
      return {
        ...spec,
        charsPerSec: 13.7019,
        calibrated: true,
        minFactor: 0.8221,
        maxFactor: 1.1959,
        note: "ĐÃ HIỆU CHUẨN (B3) — n = 5 mẫu thật (1 A3 + 4 B3: Hải Đăng, Trúc Ly, Thiện Minh, Mai Anh); hệ số gộp 57/4,16 = 13,7019 ký tự/giây; khoảng = biên quan sát [0,8221×, 1,1959×], KHÔNG phải khoảng tin cậy.",
      };
    case "short":
      return {
        ...spec,
        charsPerSec: 17.7326,
        calibrated: true,
        minFactor: 0.8395,
        maxFactor: 1.2720,
        note: "ĐÃ HIỆU CHUẨN (B3) — n = 5 mẫu thật (1 Z3 + 1 A3 + 3 B3: Hải Đăng, Trúc Ly, Quang Sơn); hệ số gộp 244/13,76 = 17,7326 ký tự/giây; khoảng = biên quan sát [0,8395×, 1,2720×] — sửa khoảng A3 cũ vì mẫu B3-S2 (tỉ lệ 0,871 so với 18,4) từng rơi ngoài cận dưới 0,9× của A3.",
      };
    case "medium":
      return {
        ...spec,
        charsPerSec: 18.2624,
        calibrated: true,
        minFactor: 0.9483,
        maxFactor: 1.0958,
        note: "ĐÃ HIỆU CHUẨN YẾU (B3) — n = 3 mẫu thật nhưng chỉ 2 mẫu mới (1 Z3 cũ + 2 B3: Hải Đăng, Thiện Minh, Ngọc Huyền); hệ số gộp 412/22,56 = 18,2624 ký tự/giây; khoảng hẹp [0,9483×, 1,0958×] chỉ là biên quan sát của 3 điểm, mẫu mới có thể rơi ngoài — cần thêm mẫu trước khi tin như khoảng an toàn.",
      };
    case "long":
      return {
        ...spec,
        charsPerSec: 19.2292,
        calibrated: true,
        minFactor: 0.9579,
        maxFactor: 1.0337,
        note: "ĐÃ HIỆU CHUẨN YẾU (B3) — n = 3 mẫu thật nhưng chỉ 2 mẫu mới (1 Z3 cũ + 2 B3: Hải Đăng, Trúc Ly); hệ số gộp 923/48,00 = 19,2292 ký tự/giây; khoảng hẹp [0,9579×, 1,0337×] chỉ là biên quan sát của 3 điểm, mẫu mới có thể rơi ngoài — cần thêm mẫu trước khi tin như khoảng an toàn.",
      };
    default:
      return spec;
  }
});

/** Tầng B3 của một độ dài (ký tự); null khi độ dài ≤ 0 (như A3). */
export function ttsTierForLength46B3(charCount: number): TtsTierSpec45A3 | null {
  const a3 = ttsTierForLength45A3(charCount);
  if (a3 === null) return null;
  return TTS_TIERS_46B3.find((t) => t.tier === a3.tier) ?? null;
}

/** Kết quả ước lượng theo tầng B3 (cùng hình dạng với A3). */
export interface TtsEstimateRange46B3 {
  tier: TtsTier45A3;
  chars: number;
  charsPerSec: number;
  calibrated: boolean;
  seconds: number;
  minSec: number;
  maxSec: number;
}

/**
 * Ước lượng khoảng độ dài giọng đọc từ text theo bảng B3. Trả null
 * khi text rỗng (không bịa số) — cùng quy ước với A3/Z3.
 */
export function estimateTtsDurationRange46B3(text: string): TtsEstimateRange46B3 | null {
  const chars = ttsTextLength(text ?? "");
  const spec = ttsTierForLength46B3(chars);
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

/** Ước lượng điểm trung tâm (giây) theo bảng B3; null khi text rỗng. */
export function estimateTtsDurationSec46B3(text: string): number | null {
  const r = estimateTtsDurationRange46B3(text);
  return r === null ? null : r.seconds;
}

/** Hậu tố khoảng cho toast: ` (≈9.0–12.0s)`; text rỗng → "". */
export function ttsEstimateRangeSuffix46B3(text: string): string {
  const r = estimateTtsDurationRange46B3(text);
  if (r === null) return "";
  return ` (≈${r.minSec.toFixed(1)}–${r.maxSec.toFixed(1)}s)`;
}

/**
 * Hậu tố cho toast done của TtsButton (thay thế ttsDoneSuffix của Z3
 * từ luồng này — TtsButton gọi đúng hàm này, không tự tính lại):
 * - header X-TTS-Duration hợp lệ → ` (12.3s)` (số đo thật);
 * - header thiếu/không hợp lệ, text có nội dung → khoảng B3
 *   ` (≈a–bs)` (đã hiệu chuẩn theo tầng, không còn điểm 18,4 gộp);
 * - không ước lượng được (text rỗng) → "" (bỏ hậu tố, không bịa số).
 */
export function ttsDoneSuffixRange46B3(opts: {
  headerValue: string | null | undefined;
  text: string;
}): string {
  const measured = parseTtsDurationHeader(opts.headerValue);
  if (measured !== null) return ` (${measured.toFixed(1)}s)`;
  return ttsEstimateRangeSuffix46B3(opts.text);
}
