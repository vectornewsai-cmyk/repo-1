/**
 * ttsEstimate51H1.ts — Ước lượng độ dài giọng đọc TTS theo ĐƯỜNG CONG
 * theo giọng (Phase 9 đợt 51, luồng H1): thay ngưỡng nhị phân 13% bằng
 * mô hình đường cong tốc độ theo tỉ lệ chữ số.
 *
 * Đóng nợ F3 §8.1 (LIMITS đợt 50 §4.1): helper F3 dùng ngưỡng nhị phân
 * 13% phân loại SAI text 10–12% thành "thường" — khoảng normal không
 * chứa số thật của cả 6 mẫu P10/P13 (test F3 §6 khóa lỗi). Dữ liệu F3
 * đã chứng minh tốc độ giảm TRƠN theo tỉ lệ chữ số, phụ thuộc giọng,
 * KHÔNG có ngưỡng nhị phân nào đúng cho mọi giọng.
 *
 * MẪU ĐO MỚI H1 (06/11/2026, driver tts.py trực tiếp qua server/tts/.venv2,
 * model VieNeu-TTS v3 Turbo đã cache; driver nạp model MỘT lần rồi gọi
 * infer qua đúng đường code của tts.py — xem LIMITS H1 §3):
 * - 13 mẫu: 1 neo Kim Thanh M3 + 12 mẫu thăm dò Q07 (6,98%) / Q09
 *   (9,83%) / Q14 (14,29%) × 4 giọng (Kim Thanh, Đức Trí, Quỳnh Anh,
 *   Trúc Ly — giọng nhanh nhất, kiểm hình dạng đường cong có phụ thuộc
 *   tốc độ giọng không). Neo A1 22,74 s lệch ≤ 1,3% so với mọi lần đo
 *   M3 của Kim Thanh (E1 22,92/23,03/23,00; F3 22,53) — driver đúng.
 * - Đợt 53 luồng J7 (07/11/2026, xem docs/PHASE9_ROUND53_J7_TTS_TRANSFER_LIMITS.md):
 *   thêm 3 mẫu P10 (10,22%) / P13 (12,43%) / P16 (15,96%) của F3 cho
 *   Trúc Ly — cô trước đây chỉ có 5 điểm đường cong (0 / Q07 / Q09 /
 *   M3 / Q14), nay đủ 8 điểm như 3 giọng kia; φ gộp tại 3 nút P tính
 *   lại trên 4 giọng (trước đây chỉ 3 giọng): P10 0,854 → 0,884,
 *   P13 0,958 → 0,968, P16 1,160 → 1,161. Trúc Ly nay có chuỗi đầy đủ
 *   M4 > Q07 > Q09 > P10 > P13 > M3 > Q14 > P16 như mọi giọng.
 * - Đợt 54 luồng K6 (07/11/2026, xem docs/PHASE9_ROUND54_K6_TTS_P13_REPEAT_LIMITS.md):
 *   đo LẶP P13 vs M3 cho Trúc Ly, n = 3 mỗi text, xen kẽ — P13 gộp
 *   13,2272 ký tự/giây NHANH HƠN M3 gộp 12,8551 (+2,90%, 7/9 cặp
 *   P13 nhanh hơn M3), biên mỏng 0,02 ký tự/giây của J7 (1 mẫu) nay
 *   nới thành +0,37 ký tự/giây gộp — thứ tự P13 > M3 GIỮ VỮNG.
 *   φ(P13) Trúc Ly gộp 4 mẫu (J7 + K6) = 0,983 (J7 1 mẫu: 0,997);
 *   φ gộp 4 giọng tính lại 0,9642, chênh −0,0038 so với nút khóa
 *   0,968 — trong dung sai ±0,005 nên NÚT φ KHÔNG ĐỔI.
 * - Đợt 55 luồng L9 (07/11/2026, xem docs/PHASE9_ROUND55_L9_TTS_REPEAT_XCHECK_LIMITS.md):
 *   đo LẶP ĐỊNH KỲ lần 2 P13 vs M3 cho Trúc Ly, n = 3 mỗi text, xen kẽ —
 *   P13 gộp 13,2896 ký tự/giây NHANH HƠN M3 gộp 12,7052 (+4,60%, 9/9 cặp
 *   P13 nhanh hơn M3 — mạnh hơn K6: +0,37, 7/9 cặp), thứ tự P13 > M3
 *   GIỮ VỮNG và nới biên (gộp K6+L9 n = 6: +0,48). φ(P13) Trúc Ly gộp
 *   7 mẫu (J7 + K6 + L9) = 0,977 (F3); φ gộp 4 giọng tính lại 0,9626,
 *   chênh −0,0054 so với nút khóa 0,968 — vượt NHẸ dung sai ±0,005
 *   của test K6 nhưng nằm trong sai số lấy mẫu (SE φ ≈ 0,02) nên NÚT φ
 *   KHÔNG ĐỔI (xem LIMITS L9 §3).
 * - Đo trong điều kiện VM quá tải (8–10 luồng đợt 55 chạy song song +
 *   1 lần reboot 12:05 xóa /tmp): driver bị SIGKILL (exit 137) 13 lần
 *   + 1 lần session drain-timeout, phải chạy lại bằng vòng lặp resume
 *   (bỏ qua mẫu đã có); 2 WAV đầu (H1-A1, H1-Q07-KT) mất theo reboot
 *   nhưng ĐÃ ffprobe khớp TRƯỚC reboot (22,74 s / 18,08 s) — số giây
 *   còn trong backup results.jsonl. Tỉ lệ ký tự/giây là thuộc tính của
 *   audio nên tải song song / synth chậm không làm sai số đo.
 * - Verify: 11 WAV còn trên đĩa khớp ffprobe từng mili-giây; lead
 *   silence 0,06–0,13 s, trail silence 0,10–0,35 s (7 mẫu trail
 *   0,31–0,35 s, nhỉnh hơn ngưỡng 0,3 s của F3 — cùng phương pháp đo
 *   nên so sánh vẫn nhất quán).
 *
 * MÔ HÌNH ĐƯỜNG CONG (đã khóa — xem LIMITS H1 §4, compute51h1.py):
 * - Với mỗi giọng V: v_normal,V (tốc độ gộp text thường, bảng F3) và
 *   v_dense,V (tốc độ gộp M3, bảng F3). Định nghĩa φ(r) = tỉ lệ quãng
 *   đường từ normal xuống dense tại tỉ lệ chữ số r:
 *     v_V(r) = v_normal,V − φ(r) × (v_normal,V − v_dense,V).
 * - φ(r) CHUNG cho mọi giọng (không phải riêng từng giọng): đo 4 giọng
 *   cho thấy φ tại mỗi nút lệch nhau chỉ 0,04–0,12 (lớn nhất ở Q14:
 *   1,011–1,134), tức sai số tốc độ ≤ ~5% — nằm gọn trong khoảng
 *   h = 0,17. φ nội suy TUYẾN TÍNH TỪNG ĐOẠN giữa các nút đo; ngoài
 *   khoảng đo (> 15,96%) ngoại suy tuyến tính theo đoạn cuối (chưa đo,
 *   ghi rõ); tốc độ có sàn 3,0 ký tự/giây chống dự báo vô nghĩa.
 * - Nút φ (trung bình 4 giọng, tính lại từ số đo — xem test §6;
 *   đợt 53 J7: nút P10/P13/P16 nay tính trên đủ 4 giọng, trước đây
 *   chỉ 3 giọng vì Trúc Ly chưa có mẫu P; đợt 54 K6 đo lặp P13/M3
 *   Trúc Ly n = 3 xác nhận nút P13 0,968 — tính lại 0,9642, trong
 *   dung sai ±0,005 nên nút KHÔNG đổi):
 *     r = 0 → φ = 0;  6,98% → 0,671;  9,83% → 0,809;  10,22% → 0,884;
 *     12,43% → 0,968;  13,48% → 1,000;  14,29% → 1,054;  15,96% → 1,161.
 *   Đường cong rơi NHANH ngay từ tỉ lệ thấp: ở 6,98% đã đi 67% quãng
 *   đường xuống dense; ở 10,22% đi 85%; ở 15,96% VƯỢT dense (φ > 1).
 * - Tốc độ ĐƠN ĐIỆU GIẢM theo tỉ lệ chữ số ở cả 4 giọng (chuỗi đầy đủ
 *   M4 > Q07 > Q09 > P10 > P13 > M3 > Q14 > P16 với cả 4 giọng —
 *   Trúc Ly đủ 8 điểm từ đợt 53 J7; trước đó cô chỉ có
 *   M4 > Q07 > Q09 > M3 > Q14). Mô hình đường cong SỬA
 *   ĐƯỢC cả 6 mẫu P10/P13 sai của F3 VÀ phản ví dụ X2 (Minh Đức T13
 *   19,17 s nay nằm trong khoảng đường cong — xem test §5).
 *
 * BẢNG HỆ SỐ (tạm dùng bảng F3 — H2 sở hữu bảng hệ số đợt 51):
 * - Helper H1 NHẬN bảng hệ số qua tham số `coefficients` (interface
 *   TtsCurveCoefficients51H1 — trùng hình dạng dòng bảng F3 nên bảng
 *   F3 truyền thẳng được). Mặc định dùng TTS_VOICE_COEFFICIENTS_50F3.
 *   KHÔNG sửa ttsEstimate50F3.ts (H2 sở hữu). Khi H2 xong bảng mới,
 *   TtsButton chỉ cần truyền bảng đó vào — không đổi code helper.
 * - Giọng lạ / không truyền voice / clone mode → fallback helper F3
 *   y hệt (ngưỡng nhị phân + hệ số gộp C4), curve = false — không đổi
 *   hành vi cho giọng chưa đo.
 *
 * TỐC ĐỘ TỔNG HỢP (xem LIMITS H1 §5 — số thật):
 * - Infer thuần (driver, đã trừ nạp model, sau warmup): 13 lần đo,
 *   audio/synth 0,03–0,39×, median ~0,10× — đều < 1× realtime, chậm
 *   hơn F3 (median 0,44×) vì VM quá tải + reboot giữa chừng. Tổng thời
 *   gian synth 2335,4 s cho 13 mẫu. Nạp model 10,3–68,4 s theo tải.
 * - Tốc độ tổng hợp không ảnh hưởng độ dài WAV hay toast (chỉ ảnh
 *   hưởng thời gian chờ khi bấm TTS).
 *
 * Ước lượng này chỉ dùng cho hiển thị (hậu tố toast), KHÔNG dùng
 * để cắt/ghép audio hay tính timeline — như Z3/A3/B3/C4/D1/E1/F3.
 */

import { ttsTextLength, parseTtsDurationHeader } from "./ttsDuration44Z3";
import { ttsTierForLength47C4, type TtsRegime47C4 } from "./ttsEstimate47C4";
import type { TtsTier45A3 } from "./ttsEstimate45A3";
import {
  TTS_PROBE_TEXT_P10_50F3,
  TTS_PROBE_TEXT_P13_50F3,
  TTS_PROBE_TEXT_P16_50F3,
  TTS_VOICE_COEFFICIENTS_50F3,
  estimateTtsDurationRange50F3,
  type TtsEstimateRange50F3,
} from "./ttsEstimate50F3";

/** Text thăm dò Q07 (172 ký tự, 12 chữ số = 6,98%) — lấp khoảng 5–10%. */
export const TTS_PROBE_TEXT_Q07_51H1 =
  "Ngày 8 tháng 4 năm 2026, VCut Studio phát hành bản mới với 24 tính năng mới, sửa 57 lỗi và tăng tốc xuất video lên 30% so với bản cũ, giúp bạn dựng video mượt hơn mỗi ngày.";

/** Text thăm dò Q09 (173 ký tự, 17 chữ số = 9,83%) — lấp khoảng 5–10%. */
export const TTS_PROBE_TEXT_Q09_51H1 =
  "Ngày 18 tháng 9 năm 2026, VCut Studio phát hành bản 3.2 với 24 tính năng mới, sửa 57 lỗi, tăng tốc xuất video lên 30% so với bản 3.1, giúp bạn dựng video nhanh hơn mỗi ngày.";

/** Text thăm dò Q14 (168 ký tự, 24 chữ số = 14,29%) — lấp khoảng 13–16%. */
export const TTS_PROBE_TEXT_Q14_51H1 =
  "Ngày 15 tháng 11 năm 2026, lúc 9 giờ, bản 2.4.1 sửa 128 lỗi, thêm 37 tính năng mới, tăng tốc xuất video lên 45% so với bản 2.3.0, hỗ trợ 60 khung hình mỗi giây cho bạn.";

/** Text chuẩn M3 (178 ký tự, 24 chữ số = 13,48%) — tái dùng hằng F3 cho neo. */
export const TTS_STANDARD_TEXT_M3_51H1 =
  "Ngày 15 tháng 11 năm 2026, lúc 9 giờ 30 phút, VCut Studio phát hành bản cập nhật 2.4.1 với 37 tính năng mới, sửa 128 lỗi và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó.";

/** Một lần đo thật ĐỘC LẬP của luồng H1 (neo M3 hoặc thăm dò Q07/Q09/Q14) + luồng J7 đợt 53 (thăm dò P10/P13/P16 cho Trúc Ly) + luồng K6 đợt 54 (đo lặp P13/M3 cho Trúc Ly, n = 3 mỗi text) + luồng L9 đợt 55 (đo lặp định kỳ lần 2 P13/M3 cho Trúc Ly, n = 3 mỗi text). */
export interface TtsSample51H1 {
  id: string;
  tier: "medium";
  textId: "M3" | "Q07" | "Q09" | "Q14" | "P10" | "P13" | "P16";
  /** Text đã đọc (tham chiếu hằng chuẩn — test đếm lại ký tự + tỉ lệ chữ số từ đây). */
  text: string;
  voice: string;
  /** Độ dài thật (giây, từ header WAV, khớp ffprobe từng mili-giây). */
  durationSec: number;
  /** Tỉ lệ ký tự chữ số (0–9) trên tổng ký tự (theo ttsTextLength). */
  digitRatio: number;
  source: "H1" | "J7" | "K6" | "L9";
}

/**
 * 28 mẫu (13 H1 + 3 J7 đợt 53 + 6 K6 đợt 54 + 6 L9 đợt 55 — xem header): 1 neo + 12 thăm dò
 * Q07/Q09/Q14 × 4 giọng + 3 thăm dò P10/P13/P16 × Trúc Ly + 12 đo lặp
 * P13/M3 × Trúc Ly (n = 3 mỗi text, xen kẽ; K6 + L9). WAV ở
 * /tmp/tts51h1/ (11 file còn lại; H1-A1 + H1-Q07-KT mất theo reboot
 * nhưng đã ffprobe khớp trước reboot); số đo backup ở
 * hidden_files/tts51h1/results.jsonl (bản đầy đủ — bản /tmp thiếu 5
 * dòng đầu do reboot xóa /tmp rồi driver tạo lại file khi resume).
 * WAV J7 ở hidden_files/tts53j7/wav/ (copy về đĩa persistent ngay sau
 * khi ghi — cả 12 mẫu J7 đều còn, xem LIMITS J7). WAV K6 ở
 * hidden_files/tts54k6/wav/ (14 file, cả 14 đã verify ffprobe khớp —
 * 3 file đầu mất bản /tmp theo VM restart nhưng còn bản backup,
 * xem LIMITS K6). WAV L9 ở hidden_files/tts55l9/wav/ (16 file, cả 16
 * đã verify ffprobe khớp — driver chết lặng 1 lần giữa T05, resume
 * hoàn tất nốt 6 mẫu, xem LIMITS L9).
 */
export const TTS_SAMPLES_51H1: readonly TtsSample51H1[] = [
  // Neo kiểm chứng driver (so với E1 22,92/23,03/23,00 s; F3 22,53 s).
  { id: "H1-A1", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H1, voice: "Kim Thanh", durationSec: 22.74, digitRatio: 0.1348, source: "H1" },
  // Q07/Q09/Q14 × Kim Thanh (chuỗi đầy đủ cùng P10/P13/P16 của F3).
  { id: "H1-Q07-KT", tier: "medium", textId: "Q07", text: TTS_PROBE_TEXT_Q07_51H1, voice: "Kim Thanh", durationSec: 18.08, digitRatio: 0.0698, source: "H1" },
  { id: "H1-Q09-KT", tier: "medium", textId: "Q09", text: TTS_PROBE_TEXT_Q09_51H1, voice: "Kim Thanh", durationSec: 19.6, digitRatio: 0.0983, source: "H1" },
  { id: "H1-Q14-KT", tier: "medium", textId: "Q14", text: TTS_PROBE_TEXT_Q14_51H1, voice: "Kim Thanh", durationSec: 21.73, digitRatio: 0.1429, source: "H1" },
  // Q07/Q09/Q14 × Đức Trí.
  { id: "H1-Q07-DT", tier: "medium", textId: "Q07", text: TTS_PROBE_TEXT_Q07_51H1, voice: "Đức Trí", durationSec: 18.32, digitRatio: 0.0698, source: "H1" },
  { id: "H1-Q09-DT", tier: "medium", textId: "Q09", text: TTS_PROBE_TEXT_Q09_51H1, voice: "Đức Trí", durationSec: 19.36, digitRatio: 0.0983, source: "H1" },
  { id: "H1-Q14-DT", tier: "medium", textId: "Q14", text: TTS_PROBE_TEXT_Q14_51H1, voice: "Đức Trí", durationSec: 20.65, digitRatio: 0.1429, source: "H1" },
  // Q07/Q09/Q14 × Quỳnh Anh.
  { id: "H1-Q07-QA", tier: "medium", textId: "Q07", text: TTS_PROBE_TEXT_Q07_51H1, voice: "Quỳnh Anh", durationSec: 14.08, digitRatio: 0.0698, source: "H1" },
  { id: "H1-Q09-QA", tier: "medium", textId: "Q09", text: TTS_PROBE_TEXT_Q09_51H1, voice: "Quỳnh Anh", durationSec: 14.8, digitRatio: 0.0983, source: "H1" },
  { id: "H1-Q14-QA", tier: "medium", textId: "Q14", text: TTS_PROBE_TEXT_Q14_51H1, voice: "Quỳnh Anh", durationSec: 16.76, digitRatio: 0.1429, source: "H1" },
  // Q07/Q09/Q14 × Trúc Ly (giọng nhanh nhất — kiểm hình dạng đường cong).
  { id: "H1-Q07-TL", tier: "medium", textId: "Q07", text: TTS_PROBE_TEXT_Q07_51H1, voice: "Trúc Ly", durationSec: 11.28, digitRatio: 0.0698, source: "H1" },
  { id: "H1-Q09-TL", tier: "medium", textId: "Q09", text: TTS_PROBE_TEXT_Q09_51H1, voice: "Trúc Ly", durationSec: 12.4, digitRatio: 0.0983, source: "H1" },
  { id: "H1-Q14-TL", tier: "medium", textId: "Q14", text: TTS_PROBE_TEXT_Q14_51H1, voice: "Trúc Ly", durationSec: 13.75, digitRatio: 0.1429, source: "H1" },
  // P10/P13/P16 × Trúc Ly — đợt 53 luồng J7 (07/11/2026, driver
  // drive53j7.py): cô nay đủ 8 điểm đường cong như 3 giọng kia.
  { id: "J7-P10-TL", tier: "medium", textId: "P10", text: TTS_PROBE_TEXT_P10_50F3, voice: "Trúc Ly", durationSec: 14.04, digitRatio: 0.1022, source: "J7" },
  { id: "J7-P13-TL", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Trúc Ly", durationSec: 12.89, digitRatio: 0.1243, source: "J7" },
  { id: "J7-P16-TL", tier: "medium", textId: "P16", text: TTS_PROBE_TEXT_P16_50F3, voice: "Trúc Ly", durationSec: 15.62, digitRatio: 0.1596, source: "J7" },
  // Đo lặp P13/M3 × Trúc Ly — đợt 54 luồng K6 (07/11/2026, driver
  // drive54k6.py, xen kẽ P13/M3): P13 gộp n = 3 là 13,2272 ký tự/giây,
  // M3 gộp n = 3 là 12,8551 — thứ tự P13 > M3 giữ vững (7/9 cặp).
  { id: "K6-P13-TL-1", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Trúc Ly", durationSec: 13.14, digitRatio: 0.1243, source: "K6" },
  { id: "K6-P13-TL-2", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Trúc Ly", durationSec: 12.89, digitRatio: 0.1243, source: "K6" },
  { id: "K6-P13-TL-3", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Trúc Ly", durationSec: 12.3, digitRatio: 0.1243, source: "K6" },
  { id: "K6-M3-TL-1", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H1, voice: "Trúc Ly", durationSec: 13.79, digitRatio: 0.1348, source: "K6" },
  { id: "K6-M3-TL-2", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H1, voice: "Trúc Ly", durationSec: 13.98, digitRatio: 0.1348, source: "K6" },
  { id: "K6-M3-TL-3", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H1, voice: "Trúc Ly", durationSec: 13.77, digitRatio: 0.1348, source: "K6" },
  // Đo lặp định kỳ lần 2 P13/M3 × Trúc Ly — đợt 55 luồng L9 (07/11/2026,
  // driver drive55l9.py, xen kẽ P13/M3, đúng protocol K6): P13 gộp
  // n = 3 là 13,2896 ký tự/giây, M3 gộp n = 3 là 12,7052 — thứ tự
  // P13 > M3 giữ vững, 9/9 cặp (mạnh hơn K6: +0,37, 7/9 cặp).
  { id: "L9-P13-TL-1", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Trúc Ly", durationSec: 12.39, digitRatio: 0.1243, source: "L9" },
  { id: "L9-P13-TL-2", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Trúc Ly", durationSec: 12.63, digitRatio: 0.1243, source: "L9" },
  { id: "L9-P13-TL-3", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Trúc Ly", durationSec: 13.13, digitRatio: 0.1243, source: "L9" },
  { id: "L9-M3-TL-1", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H1, voice: "Trúc Ly", durationSec: 14.09, digitRatio: 0.1348, source: "L9" },
  { id: "L9-M3-TL-2", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H1, voice: "Trúc Ly", durationSec: 14.02, digitRatio: 0.1348, source: "L9" },
  { id: "L9-M3-TL-3", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H1, voice: "Trúc Ly", durationSec: 13.92, digitRatio: 0.1348, source: "L9" },
];

/** Một lần đo tốc độ tổng hợp (audio/synth, xem header file). */
export interface TtsSynthSpeed51H1 {
  id: string;
  audioSec: number;
  synthSec: number;
  /** Wall-clock cả lần chạy CLI (gồm nạp model); null với lần driver. */
  wallSec: number | null;
}

/**
 * Tốc độ tổng hợp — 13 lần đo driver (infer thuần sau warmup, đã trừ
 * nạp model). Tỉ lệ audio/synth: 0,03–0,39×, median ~0,10× — đều < 1×
 * realtime, chậm hơn F3 (median 0,44×) vì VM quá tải + reboot (xem
 * LIMITS H1 §5). Tổng thời gian synth 2335,4 s cho 13 mẫu.
 */
export const TTS_SYNTH_SPEED_51H1: readonly TtsSynthSpeed51H1[] = [
  { id: "H1-A1", audioSec: 22.74, synthSec: 58.5, wallSec: null },
  { id: "H1-Q07-KT", audioSec: 18.08, synthSec: 97.5, wallSec: null },
  { id: "H1-Q09-KT", audioSec: 19.6, synthSec: 296.7, wallSec: null },
  { id: "H1-Q14-KT", audioSec: 21.73, synthSec: 304.4, wallSec: null },
  { id: "H1-Q07-DT", audioSec: 18.32, synthSec: 235.9, wallSec: null },
  { id: "H1-Q09-DT", audioSec: 19.36, synthSec: 232.4, wallSec: null },
  { id: "H1-Q14-DT", audioSec: 20.65, synthSec: 244.8, wallSec: null },
  { id: "H1-Q07-QA", audioSec: 14.08, synthSec: 125.8, wallSec: null },
  { id: "H1-Q09-QA", audioSec: 14.8, synthSec: 149.0, wallSec: null },
  { id: "H1-Q14-QA", audioSec: 16.76, synthSec: 141.0, wallSec: null },
  { id: "H1-Q07-TL", audioSec: 11.28, synthSec: 360.4, wallSec: null },
  { id: "H1-Q09-TL", audioSec: 12.4, synthSec: 47.9, wallSec: null },
  { id: "H1-Q14-TL", audioSec: 13.75, synthSec: 41.1, wallSec: null },
];

/** Thời gian nạp model + warmup infer (giây) qua các lần chạy driver H1. */
export const TTS_SYNTH_META_51H1 = {
  /** Lần chạy đầu (máy còn yên): nạp 10,3 s, warmup 2,4 s. */
  loadSecFirstRun: 10.3,
  warmupSecFirstRun: 2.4,
  /** Chậm nhất khi VM quá tải: nạp 68,4 s, warmup 15,9 s. */
  loadSecMax: 68.4,
  warmupSecMax: 15.9,
  /** Tổng số lần chạy driver (15 lần chạy, 14 lần bị kill + 1 lần chạy xong). */
  driverRuns: 15,
  driverKills: 14,
} as const;

/**
 * Một nút của đường cong φ(r): tại tỉ lệ chữ số `ratio`, giọng đọc đã
 * đi được `phi` phần quãng đường từ tốc độ normal xuống tốc độ dense
 * (φ(0) = 0, φ(0,1348) = 1 theo định nghĩa; φ > 1 khi đọc chậm hơn cả
 * M3 — đã đo tới φ = 1,160 ở 15,96%).
 */
export interface TtsCurveKnot51H1 {
  ratio: number;
  phi: number;
}

/**
 * Nút φ ĐÃ KHÓA (trung bình 4 giọng đo H1 + F3 — xem compute51h1.py):
 * độ lệch φ giữa các giọng tại mỗi nút chỉ 0,04–0,12 nên khóa MỘT
 * đường cong chung cho mọi giọng (không phải riêng từng giọng).
 * Tốc độ tại nút tính từ tốc độ gộp F3 của từng giọng (normal/dense).
 * Đợt 53 J7: nút P10/P13/P16 tính lại trên đủ 4 giọng (Trúc Ly nay có
 * mẫu P) — trước đây chỉ 3 giọng: P10 0,854 → 0,884, P13 0,958 →
 * 0,968, P16 1,160 → 1,161 (xem compute53j7.py + LIMITS J7 §3).
 */
export const TTS_CURVE_KNOTS_51H1: readonly TtsCurveKnot51H1[] = [
  { ratio: 0, phi: 0 },
  { ratio: 0.0698, phi: 0.671 },
  { ratio: 0.0983, phi: 0.809 },
  { ratio: 0.1022, phi: 0.884 },
  { ratio: 0.1243, phi: 0.968 },
  { ratio: 0.1348, phi: 1 },
  { ratio: 0.1429, phi: 1.054 },
  { ratio: 0.1596, phi: 1.161 },
];

/** Tốc độ gộp (ký tự/giây) của text thường / số-dày dùng làm neo đường cong. */
export const TTS_CURVE_BASE_RATES_51H1 = {
  /** Tốc độ gộp normal của C4 (16,0714) — neo f của bảng hệ số. */
  normalCharsPerSec: 16.0714,
  /** Tốc độ gộp dense M3 của C4 (9,5388) — neo g của bảng hệ số. */
  denseCharsPerSec: 9.5388,
  /**
   * Sàn tốc độ (ký tự/giây): không bao giờ dự báo chậm hơn mức này,
   * kể cả khi ngoại suy xa ngoài khoảng đo (chưa đo dưới 7,09 ký tự/
   * giây — Kim Thanh P16; sàn 3,0 chỉ chống dự báo vô nghĩa/âm).
   */
  minCharsPerSec: 3.0,
} as const;

/**
 * Một dòng bảng hệ số theo giọng mà helper đường cong nhận vào.
 * Trùng hình dạng dòng bảng F3 (normalCoefficient / denseCoefficient)
 * nên bảng F3 truyền thẳng được; H2 sẽ thay bằng bảng hệ số đợt 51
 * mà không cần đổi code helper (chỉ truyền bảng mới vào).
 */
export interface TtsCurveCoefficients51H1 {
  voice: string;
  /** Hệ số normal f = tốc độ gộp của giọng trên text medium / 16,0714. */
  normalCoefficient: number;
  /** Số lần đo gộp thành hệ số normal. */
  normalN: number;
  /** Hệ số dense g = tốc độ gộp của giọng trên M3 / 9,5388. */
  denseCoefficient: number;
  /** Số lần đo gộp thành hệ số dense. */
  denseN: number;
}

/** Bảng hệ số mặc định: bảng F3 (H2 sở hữu bảng hệ số đợt 51). */
export const TTS_CURVE_DEFAULT_COEFFICIENTS_51H1: readonly TtsCurveCoefficients51H1[] =
  TTS_VOICE_COEFFICIENTS_50F3;

/**
 * Tỉ lệ ký tự chữ số (0–9) trên tổng ký tự của text (theo ttsTextLength).
 */
export function ttsDigitRatio51H1(text: string): number {
  const chars = ttsTextLength(text ?? "");
  if (chars <= 0) return 0;
  const digits = (text.match(/[0-9]/g) ?? []).length;
  return digits / chars;
}

/**
 * φ(r): tỉ lệ quãng đường từ normal xuống dense tại tỉ lệ chữ số r.
 * Nội suy tuyến tính từng đoạn giữa các nút đã khóa; ngoài khoảng đo
 * (> 15,96%) ngoại suy tuyến tính theo đoạn cuối (chưa đo — ghi rõ);
 * φ không âm.
 */
export function ttsCurvePhi51H1(ratio: number): number {
  const knots = TTS_CURVE_KNOTS_51H1;
  if (!(ratio > 0)) return 0;
  if (ratio <= knots[0].ratio) return knots[0].phi;
  for (let i = 0; i + 1 < knots.length; i++) {
    const a = knots[i];
    const b = knots[i + 1];
    if (ratio <= b.ratio) {
      const t = (ratio - a.ratio) / (b.ratio - a.ratio);
      return a.phi + t * (b.phi - a.phi);
    }
  }
  // Ngoại suy ngoài khoảng đo theo đoạn cuối (từ nút áp chót tới nút cuối).
  const a = knots[knots.length - 2];
  const b = knots[knots.length - 1];
  const slope = (b.phi - a.phi) / (b.ratio - a.ratio);
  return b.phi + slope * (ratio - b.ratio);
}

/**
 * Tốc độ đường cong (ký tự/giây) của một giọng tại tỉ lệ chữ số r:
 * v = v_normal − φ(r) × (v_normal − v_dense), sàn 3,0 ký tự/giây.
 * Trả null khi giọng chưa có trong bảng hệ số (tên lạ / clone mode).
 * `coefficients` mặc định là bảng F3; H2 truyền bảng mới vào đây.
 */
export function ttsCurveSpeed51H1(
  voice: string | null | undefined,
  digitRatio: number,
  coefficients: readonly TtsCurveCoefficients51H1[] = TTS_CURVE_DEFAULT_COEFFICIENTS_51H1,
): number | null {
  if (!voice) return null;
  const row = coefficients.find((r) => r.voice === voice);
  if (!row) return null;
  const normalRate = row.normalCoefficient * TTS_CURVE_BASE_RATES_51H1.normalCharsPerSec;
  const denseRate = row.denseCoefficient * TTS_CURVE_BASE_RATES_51H1.denseCharsPerSec;
  const phi = ttsCurvePhi51H1(digitRatio);
  const speed = normalRate - phi * (normalRate - denseRate);
  return Math.max(speed, TTS_CURVE_BASE_RATES_51H1.minCharsPerSec);
}

/** Kết quả ước lượng theo tầng + đường cong theo giọng (mở rộng hình dạng F3). */
export interface TtsEstimateRange51H1 {
  tier: TtsTier45A3;
  /** "curve" khi dùng mô hình đường cong; ngược lại lấy regime của F3 (fallback). */
  regime: TtsRegime47C4 | "curve";
  chars: number;
  charsPerSec: number;
  /** true khi cả hai hệ số normal + dense của giọng đều có n ≥ 3 (quy tắc C4). */
  calibrated: boolean;
  seconds: number;
  minSec: number;
  maxSec: number;
  /** Giọng được hỏi (null khi không truyền voice hoặc fallback). */
  voice: string | null;
  /** Hệ số normal f của giọng; null khi fallback. */
  normalCoefficient: number | null;
  /** Hệ số dense g của giọng; null khi fallback. */
  denseCoefficient: number | null;
  /** true khi đã áp hệ số theo giọng, false khi fallback F3. */
  perVoice: boolean;
  /** true khi dùng mô hình đường cong H1, false khi fallback helper F3. */
  curve: boolean;
  /** Tỉ lệ ký tự chữ số của text (0–1). */
  digitRatio: number;
}

/**
 * Nửa khoảng theo giọng h = 0,17 (giữ từ E1/F3 — xem header: sai số
 * đường cong do φ chung ≤ ~5% tốc độ, nằm gọn trong h = 0,17; mọi mẫu
 * thăm dò đã đo đều nằm trong khoảng đường cong — xem test §5).
 */
export const TTS_CURVE_MIN_FACTOR_51H1 = 0.83;
export const TTS_CURVE_MAX_FACTOR_51H1 = 1.17;

/**
 * Ước lượng khoảng độ dài giọng đọc từ text theo mô hình đường cong
 * theo giọng (H1): tốc độ nội suy theo tỉ lệ chữ số cho từng giọng
 * từ bảng hệ số của giọng đó. Giọng lạ / không truyền voice →
 * fallback helper F3 y hệt (không đổi hành vi). Trả null khi text
 * rỗng — cùng quy ước với A3/B3/C4/D1/E1/F3.
 */
export function estimateTtsDurationRange51H1(
  text: string,
  voice?: string | null,
  coefficients: readonly TtsCurveCoefficients51H1[] = TTS_CURVE_DEFAULT_COEFFICIENTS_51H1,
): TtsEstimateRange51H1 | null {
  const chars = ttsTextLength(text ?? "");
  const spec = ttsTierForLength47C4(chars);
  if (spec === null) return null;
  const digitRatio = ttsDigitRatio51H1(text);
  const speed = ttsCurveSpeed51H1(voice, digitRatio, coefficients);
  if (speed === null) {
    const base: TtsEstimateRange50F3 = estimateTtsDurationRange50F3(text, voice)!;
    return {
      ...base,
      normalCoefficient: null,
      denseCoefficient: null,
      curve: false,
      digitRatio,
    };
  }
  const row = coefficients.find((r) => r.voice === voice)!;
  const seconds = chars / speed;
  return {
    tier: spec.tier,
    regime: "curve",
    chars,
    charsPerSec: speed,
    calibrated: row.normalN >= 3 && row.denseN >= 3,
    seconds,
    minSec: seconds * TTS_CURVE_MIN_FACTOR_51H1,
    maxSec: seconds * TTS_CURVE_MAX_FACTOR_51H1,
    voice: voice ?? null,
    normalCoefficient: row.normalCoefficient,
    denseCoefficient: row.denseCoefficient,
    perVoice: true,
    curve: true,
    digitRatio,
  };
}

/** Ước lượng điểm trung tâm (giây) theo đường cong H1; null khi text rỗng. */
export function estimateTtsDurationSec51H1(
  text: string,
  voice?: string | null,
  coefficients: readonly TtsCurveCoefficients51H1[] = TTS_CURVE_DEFAULT_COEFFICIENTS_51H1,
): number | null {
  const r = estimateTtsDurationRange51H1(text, voice, coefficients);
  return r === null ? null : r.seconds;
}

/** Hậu tố khoảng cho toast: ` (≈9.0–12.0s)`; text rỗng → "". */
export function ttsEstimateRangeSuffix51H1(
  text: string,
  voice?: string | null,
  coefficients: readonly TtsCurveCoefficients51H1[] = TTS_CURVE_DEFAULT_COEFFICIENTS_51H1,
): string {
  const r = estimateTtsDurationRange51H1(text, voice, coefficients);
  if (r === null) return "";
  return ` (≈${r.minSec.toFixed(1)}–${r.maxSec.toFixed(1)}s)`;
}

/**
 * Hậu tố cho toast done của TtsButton (cùng hình dạng với F3, thêm
 * mô hình đường cong):
 * - header X-TTS-Duration hợp lệ → ` (12.3s)` (số đo thật);
 * - header thiếu/không hợp lệ, text có nội dung → khoảng đường cong
 *   H1 ` (≈a–bs)` (theo giọng đang chọn khi đo được, fallback helper
 *   F3 khi giọng lạ / clone / không truyền voice);
 * - không ước lượng được (text rỗng) → "" (bỏ hậu tố, không bịa số).
 */
export function ttsDoneSuffixRange51H1(opts: {
  headerValue: string | null | undefined;
  text: string;
  voice?: string | null;
  coefficients?: readonly TtsCurveCoefficients51H1[];
}): string {
  const measured = parseTtsDurationHeader(opts.headerValue);
  if (measured !== null) return ` (${measured.toFixed(1)}s)`;
  return ttsEstimateRangeSuffix51H1(opts.text, opts.voice, opts.coefficients);
}
