/**
 * ttsEstimate50F3.ts — Ước lượng độ dài giọng đọc TTS theo GIỌNG,
 * vòng 2 (Phase 9 đợt 50, luồng F3): bảng hệ số PHỦ ĐỦ 25/25 preset
 * ở cả hai chế độ (normal + dense).
 *
 * Đóng nợ E1 §8.1–8.2: đo M3 cho 19 giọng còn thiếu hệ số dense
 * (giọng chậm Mỹ Duyên / Thiền Tâm Đức / Thục Đoan đo lặp 2 lần) và
 * M4 cho 11 giọng còn thiếu hệ số normal — nay KHÔNG còn giọng nào
 * phải fallback hệ số gộp chung (chỉ còn fallback cho tên giọng lạ /
 * clone mode / không truyền voice).
 *
 * MẪU ĐO MỚI (06/11/2026, tts.py trực tiếp qua server/tts/.venv2,
 * model VieNeu-TTS v3 Turbo đã cache; driver nạp model MỘT lần rồi
 * gọi infer qua đúng đường code của tts.py — xem LIMITS F3 §3):
 * - 44 mẫu trong MỘT lần chạy driver duy nhất (không chia lần 1/lần 2
 *   như E1): 2 neo kiểm chứng driver + 22 M3 + 11 M4 + 9 thăm dò
 *   ngưỡng P10/P13/P16. Nạp model 12,5 s; warmup infer 7,8 s cho câu
 *   "Chào bạn!" (0,56 s audio — chậm hơn E1 1,5–2,1 s, máy đang tải
 *   do các luồng đợt 50 khác chạy song song).
 * - Neo: Kim Thanh M3 22,53 s (E1: 22,92/23,03/23,00 — lệch ≤ 2,2%)
 *   và Hải Đăng M4 8,40 s (E1: 8,64/9,28/9,04 — nhanh nhất trong 4
 *   lần đo M4 của giọng này; xem § "PHƯƠNG SAI" dưới). Driver đã
 *   đúng đường code trước khi đo khối chính.
 * - Mỗi dòng kết quả ghi ĐỒNG THỜI vào /tmp/tts50f3/results.jsonl và
 *   bản sao hidden_files/tts50f3/results.jsonl NGAY trong lúc đo
 *   (bài học E1 §8.9 — lần này không mất mẫu nào; backup khớp
 *   byte-for-byte, 45 dòng = meta + 44 mẫu).
 * - Verify: header WAV khớp ffprobe từng mili-giây cho cả 44 WAV;
 *   lead/trail silence ≤ 0,3 s; khoảng lặng trong dài nhất 1,0 s
 *   (Xuân Vĩnh M3 — quãng nghỉ giữa câu của giọng chậm, không phải đệm).
 *
 * ĐÍNH CHÍNH E1 (phát hiện của luồng này, xem LIMITS F3 §4.5):
 * - Pool Hải Đăng của E1 (tốc độ gộp 17,2216, f = 1,0716) gộp NHẦM
 *   mẫu C4-M5 — mẫu này có voice "Thái Sơn" trong
 *   ttsEstimate47C4.ts (190 ký tự, 11,68 s), không phải của Hải Đăng.
 *   Tính lại pool nhiễm: 1262 ký tự / 73,28 s = 17,2221, khớp 17,2216
 *   trong sai số ±0,001 của test E1 — xác nhận chẩn đoán.
 * - F3 sửa: pool Hải Đăng đúng = M4 ×3 (E1) + T2/T4/T5 (D1, ít số)
 *   + neo A2 (F3) = 1241 ký tự / 70,00 s = 17,7286 → f = 1,1031,
 *   n = 7. Mẫu C4-M5 chuyển sang pool Thái Sơn.
 * - Thái Sơn f = (190 + 169) / (11,68 + 10,72) = 16,0268 → 0,9972,
 *   n = 2 (M5 + W01 M4). M5-only 16,27 vs M4-only 15,77 lệch 3,1% —
 *   gộp hai text medium là hợp lý (xem test §3).
 * - File E1 (lib + test) GIỮ NGUYÊN số cũ (bản ghi lịch sử); chỉ
 *   helper F3 này dùng số đã đính chính. TtsButton chuyển sang F3.
 *
 * PHƯƠNG SAI (mới):
 * - Lặp M3 giọng chậm (n = 2, chạy liền nhau): Mỹ Duyên 20,07/20,53
 *   (spread 2,3%), Thiền Tâm Đức 21,61/21,10 (2,4%), Thục Đoan
 *   17,48/17,71 (1,3%) — đều NHỎ, khác hẳn spread M4 11,5% của Mỹ
 *   Duyên ở E1 (n = 8). Phương sai lớn của Mỹ Duyên dường như chỉ ở
 *   text thường M4, không phải đặc tính chung của giọng.
 * - Hải Đăng M4 nay có 4 lần đo: 8,40–9,28 s (spread 10,0%, lớn hơn
 *   mức tối đa 7,1% giữa hai lần chạy E1) — neo A2 8,40 s là lần
 *   nhanh nhất. Mọi lần đo vẫn nằm trong khoảng theo giọng.
 *
 * THIẾT KẾ BẢNG HỆ SỐ (giữ từ E1, xem LIMITS F3 §4):
 * - f_V = tốc độ gộp normal của giọng V / 16,0714; g_V = tốc độ gộp
 *   dense (M3) của giọng V / 9,5388. Tốc độ gộp = tổng ký tự / tổng
 *   giây trên MỌI lần đo độc lập của giọng đó (lần lặp/neo đều tính).
 * - Khoảng theo giọng giữ h = 0,17 → [0,83×, 1,17×]. Kiểm chứng:
 *   mọi mẫu M3/M4 đã đo (E1 + F3 + C4/D1 cũ) đều nằm trong khoảng
 *   của giọng đó; độ lệch lớn nhất so với tâm gộp là 11,9% (Hải Đăng
 *   M4 8,40 s so với tâm 9,53 s). LƯU Ý TRUNG THỰC: tỉ lệ transfer
 *   Hải Đăng (M4 gộp / medium-khác gộp) nay là 1,172 — vượt NHẸ hệ
 *   số biên 1,17 (E1: 1,154). h = 0,17 vẫn chứa được mọi mẫu vì tâm
 *   gộp nằm giữa hai nhóm text, nhưng biên dư cho transfer đã hết;
 *   giọng khác có transfer lớn hơn thì khoảng có thể không chứa.
 * - Tỉ lệ dense/normal theo giọng: 0,598–0,686 (25 giọng) — KHÔNG
 *   phải hằng số, nên vẫn KHÔNG suy dense từ hệ số normal.
 * - `calibrated` = true khi hệ số của giọng đó ở chế độ đang ước
 *   lượng có n ≥ 3 (quy tắc C4); đa số hệ số mới có n = 1 → false,
 *   nhưng khoảng vẫn dùng h = 0,17 như nhau.
 *
 * THĂM DÒ NGƯỠNG 10–16% (xem LIMITS F3 §4.6 — KẾT LUẬN QUAN TRỌNG):
 * - Đường cong tốc độ theo tỉ lệ chữ số là ĐƠN ĐIỆU GIẢM, TRƠN, và
 *   phụ thuộc giọng — KHÔNG có bước nhảy ở 13%: ở 10,22% cả 3 giọng
 *   đã chậm 84–88% quãng đường từ normal xuống dense (Kim Thanh
 *   8,54; Đức Trí 8,82; Quỳnh Anh 11,06 ký tự/giây); ở 12,43% đạt
 *   93–98%; ở 15,96% cả 3 giọng đọc CHẬM HƠN cả M3 (13,48%).
 * - Hệ quả: bộ phân loại nhị phân ngưỡng 13% phân loại SAI text
 *   10–12% thành "thường" trong khi giọng đọc gần như chậm hẳn
 *   (vd Kim Thanh P10 thực 21,77 s, khoảng normal F3 chỉ tới
 *   ~17,3 s — xem test §6). Ngưỡng 13% GIỮ NGUYÊN làm fallback
 *   (không khóa ngưỡng mới — dữ liệu chứng minh không có ngưỡng
 *   nhị phân nào đúng cho mọi giọng); mô hình đường cong theo giọng
 *   là nợ mở cho luồng sau (dữ liệu thăm dò đã lưu ở đây).
 * - Mẫu thăm dò KHÔNG đưa vào pool hiệu chuẩn (như D1 để T8/T13
 *   ngoài pool normal của Hải Đăng) — chỉ P13 của Quỳnh Anh/Đức Trí/
 *   Kim Thanh là text D1-T13 tái dùng để so chéo giọng.
 *
 * TỐC ĐỘ TỔNG HỢP (xem LIMITS F3 §5 — số thật):
 * - Infer thuần (driver, đã trừ nạp model, sau 1 lần warmup): 44 lần
 *   đo, audio/synth 0,17–0,75×, median 0,44× — vẫn < 1× realtime,
 *   nhanh hơn E1 (median 0,32×) vì máy yên hơn ở đầu lượt đo; các
 *   mẫu cuối chậm lại tới 0,17× khi các luồng đợt 50 khác tải CPU.
 *   Tổng thời gian synth 1886,1 s cho 44 mẫu (~32 phút cả lượt đo).
 * - QUIRK (giữ từ E1, không ảnh hưởng so sánh): tts.py chia text M3
 *   thành chunk ở dấu "." trong "2.4.1" rồi nối lại bằng khoảng trắng
 *   nên log báo chunk 182 ký tự thay vì 178 — cùng đường code cho
 *   mọi lần đo M3 (C4/D1/E1/F3).
 *
 * Ước lượng này chỉ dùng cho hiển thị (hậu tố toast), KHÔNG dùng
 * để cắt/ghép audio hay tính timeline — như Z3/A3/B3/C4/D1/E1.
 */

import { ttsTextLength, parseTtsDurationHeader } from "./ttsDuration44Z3";
import {
  TTS_NUMBER_DENSE_47C4,
  estimateTtsDurationRange47C4,
  isNumberDenseText47C4,
  ttsTierForLength47C4,
  type TtsEstimateRange47C4,
  type TtsRegime47C4,
} from "./ttsEstimate47C4";

/** Text chuẩn M3 (số-dày, 178 ký tự, 24 chữ số = 13,48%) — trùng C4-M3 / E1. */
export const TTS_STANDARD_TEXT_M3_50F3 =
  "Ngày 15 tháng 11 năm 2026, lúc 9 giờ 30 phút, VCut Studio phát hành bản cập nhật 2.4.1 với 37 tính năng mới, sửa 128 lỗi và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó.";

/** Text chuẩn M4 (thường, 169 ký tự, 0 chữ số) — trùng C4-M4 / D1 / E1. */
export const TTS_STANDARD_TEXT_M4_50F3 =
  "Nguyễn Văn An mở VCut Studio ở Hà Nội, kéo video quay tại Đà Lạt, Sa Pa và Phú Quốc vào timeline, rồi gửi bản dựng cho chị Trần Thu Hà ở Thành phố Hồ Chí Minh xem trước.";

/** Text thăm dò P10 (186 ký tự, 19 chữ số = 10,22%) — dưới ngưỡng 13%. */
export const TTS_PROBE_TEXT_P10_50F3 =
  "Ngày 12 tháng 3 năm 2026, VCut Studio phát hành bản cập nhật 3.1 với 118 tính năng mới, sửa 196 lỗi và tăng tốc xuất video lên 25% so với bản 3.0 trước đó, giúp bạn dựng video nhanh hơn.";

/** Text thăm dò P13 (169 ký tự, 21 chữ số = 12,43%) — tái dùng text D1-T13. */
export const TTS_PROBE_TEXT_P13_50F3 =
  "Ngày 15 tháng 11 năm 2026, bản 2.4.1 sửa 128 lỗi, thêm 37 tính năng mới và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó, giúp bạn dựng video nhanh hơn mỗi ngày.";

/** Text thăm dò P16 (188 ký tự, 30 chữ số = 15,96%) — trên M3 (13,48%). */
export const TTS_PROBE_TEXT_P16_50F3 =
  "Ngày 15 tháng 11 năm 2026, bản 2.4.1 sửa 128 lỗi, thêm 37 tính năng mới, tăng tốc xuất video lên 45% so với bản 2.3.0, hỗ trợ 1080p, 4K, 60 khung hình mỗi giây và giảm 25% dung lượng file.";

/** Một lần đo thật ĐỘC LẬP của luồng F3 (text chuẩn M3/M4 hoặc thăm dò P10/P13/P16). */
export interface TtsSample50F3 {
  id: string;
  tier: "medium";
  textId: "M3" | "M4" | "P10" | "P13" | "P16";
  /** Text đã đọc (tham chiếu hằng chuẩn — test đếm lại ký tự + tỉ lệ chữ số từ đây). */
  text: string;
  voice: string;
  /** Độ dài thật (giây, từ header WAV, khớp ffprobe từng mili-giây). */
  durationSec: number;
  /** Tỉ lệ ký tự chữ số (0–9) trên tổng ký tự (theo ttsTextLength). */
  digitRatio: number;
  source: "F3";
}

/**
 * 44 mẫu F3 trong MỘT lần chạy driver (06/11/2026, ~32 phút):
 * 2 neo (A1/A2) + 22 M3 (19 giọng + lặp giọng chậm ×3) + 11 M4 +
 * 9 thăm dò ngưỡng (P10/P13/P16 × Kim Thanh, Đức Trí, Quỳnh Anh).
 * WAV ở /tmp/tts50f3/ (ngoài repo); số đo backup ở
 * hidden_files/tts50f3/results.jsonl (khớp byte-for-byte).
 */
export const TTS_SAMPLES_50F3: readonly TtsSample50F3[] = [
  // Neo kiểm chứng driver (so với E1).
  { id: "F3-A1", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Kim Thanh", durationSec: 22.53, digitRatio: 0.1348, source: "F3" },
  { id: "F3-A2", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Hải Đăng", durationSec: 8.4, digitRatio: 0, source: "F3" },
  // M3 cho 19 giọng chưa có hệ số dense (giọng chậm đo lặp 2 lần: V01/V02/V03 + bản lặp "b").
  { id: "F3-V01", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Mỹ Duyên", durationSec: 20.07, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V01b", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Mỹ Duyên", durationSec: 20.53, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V02", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thiền Tâm Đức", durationSec: 21.61, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V02b", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thiền Tâm Đức", durationSec: 21.1, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V03", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thục Đoan", durationSec: 17.48, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V03b", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thục Đoan", durationSec: 17.71, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V04", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Đoan Trang", durationSec: 17.81, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V05", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Ngọc Linh", durationSec: 15.99, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V06", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thùy Dung", durationSec: 14.47, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V07", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Minh Triết", durationSec: 15.26, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V08", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thanh Bình", durationSec: 15.25, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V09", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thái Sơn", durationSec: 18.13, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V10", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Phạm Tuyên", durationSec: 16.06, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V11", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Xuân Vĩnh", durationSec: 16.13, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V12", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Ngọc Trân", durationSec: 19.6, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V13", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Quốc Tuấn", durationSec: 14.6, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V14", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Adam", durationSec: 15.08, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V15", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Trúc Ly", durationSec: 13.6, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V16", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Thiện Minh", durationSec: 15.19, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V17", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Mai Anh", durationSec: 16.29, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V18", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Quang Sơn", durationSec: 18.73, digitRatio: 0.1348, source: "F3" },
  { id: "F3-V19", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_50F3, voice: "Ngọc Huyền", durationSec: 15.66, digitRatio: 0.1348, source: "F3" },
  // M4 cho 11 giọng chưa có hệ số normal.
  { id: "F3-W01", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Thái Sơn", durationSec: 10.72, digitRatio: 0, source: "F3" },
  { id: "F3-W02", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Phạm Tuyên", durationSec: 10.08, digitRatio: 0, source: "F3" },
  { id: "F3-W03", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Xuân Vĩnh", durationSec: 9.2, digitRatio: 0, source: "F3" },
  { id: "F3-W04", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Ngọc Trân", durationSec: 11.12, digitRatio: 0, source: "F3" },
  { id: "F3-W05", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Quốc Tuấn", durationSec: 8.96, digitRatio: 0, source: "F3" },
  { id: "F3-W06", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Adam", durationSec: 9.36, digitRatio: 0, source: "F3" },
  { id: "F3-W07", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Trúc Ly", durationSec: 8.64, digitRatio: 0, source: "F3" },
  { id: "F3-W08", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Thiện Minh", durationSec: 9.76, digitRatio: 0, source: "F3" },
  { id: "F3-W09", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Mai Anh", durationSec: 10.56, digitRatio: 0, source: "F3" },
  { id: "F3-W10", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Quang Sơn", durationSec: 11.6, digitRatio: 0, source: "F3" },
  { id: "F3-W11", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_50F3, voice: "Ngọc Huyền", durationSec: 9.84, digitRatio: 0, source: "F3" },
  // Thăm dò ngưỡng P10/P13/P16 × Kim Thanh, Đức Trí, Quỳnh Anh (KHÔNG vào pool hiệu chuẩn).
  { id: "F3-P10-KT", tier: "medium", textId: "P10", text: TTS_PROBE_TEXT_P10_50F3, voice: "Kim Thanh", durationSec: 21.77, digitRatio: 0.1022, source: "F3" },
  { id: "F3-P13-KT", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Kim Thanh", durationSec: 20.79, digitRatio: 0.1243, source: "F3" },
  { id: "F3-P16-KT", tier: "medium", textId: "P16", text: TTS_PROBE_TEXT_P16_50F3, voice: "Kim Thanh", durationSec: 26.53, digitRatio: 0.1596, source: "F3" },
  { id: "F3-P10-DT", tier: "medium", textId: "P10", text: TTS_PROBE_TEXT_P10_50F3, voice: "Đức Trí", durationSec: 21.08, digitRatio: 0.1022, source: "F3" },
  { id: "F3-P13-DT", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Đức Trí", durationSec: 20.35, digitRatio: 0.1243, source: "F3" },
  { id: "F3-P16-DT", tier: "medium", textId: "P16", text: TTS_PROBE_TEXT_P16_50F3, voice: "Đức Trí", durationSec: 25.07, digitRatio: 0.1596, source: "F3" },
  { id: "F3-P10-QA", tier: "medium", textId: "P10", text: TTS_PROBE_TEXT_P10_50F3, voice: "Quỳnh Anh", durationSec: 16.82, digitRatio: 0.1022, source: "F3" },
  { id: "F3-P13-QA", tier: "medium", textId: "P13", text: TTS_PROBE_TEXT_P13_50F3, voice: "Quỳnh Anh", durationSec: 16.06, digitRatio: 0.1243, source: "F3" },
  { id: "F3-P16-QA", tier: "medium", textId: "P16", text: TTS_PROBE_TEXT_P16_50F3, voice: "Quỳnh Anh", durationSec: 19.87, digitRatio: 0.1596, source: "F3" },
];

/** Một lần đo tốc độ tổng hợp (audio/synth, xem header file). */
export interface TtsSynthSpeed50F3 {
  id: string;
  audioSec: number;
  synthSec: number;
  /** Wall-clock cả lần chạy CLI (gồm nạp model); null với lần driver. */
  wallSec: number | null;
}

/**
 * Tốc độ tổng hợp — 44 lần đo driver (infer thuần sau warmup, đã trừ
 * nạp model). Tỉ lệ audio/synth: 0,17–0,75×, median 0,44× — đều < 1×
 * realtime (xem LIMITS F3 §5).
 */
export const TTS_SYNTH_SPEED_50F3: readonly TtsSynthSpeed50F3[] = [
  { id: "F3-A1", audioSec: 22.53, synthSec: 68.5, wallSec: null },
  { id: "F3-A2", audioSec: 8.4, synthSec: 11.5, wallSec: null },
  { id: "F3-V01", audioSec: 20.07, synthSec: 26.9, wallSec: null },
  { id: "F3-V01b", audioSec: 20.53, synthSec: 41.7, wallSec: null },
  { id: "F3-V02", audioSec: 21.61, synthSec: 40.3, wallSec: null },
  { id: "F3-V02b", audioSec: 21.1, synthSec: 30.2, wallSec: null },
  { id: "F3-V03", audioSec: 17.48, synthSec: 24.5, wallSec: null },
  { id: "F3-V03b", audioSec: 17.71, synthSec: 25.0, wallSec: null },
  { id: "F3-V04", audioSec: 17.81, synthSec: 26.7, wallSec: null },
  { id: "F3-V05", audioSec: 15.99, synthSec: 46.4, wallSec: null },
  { id: "F3-V06", audioSec: 14.47, synthSec: 22.2, wallSec: null },
  { id: "F3-V07", audioSec: 15.26, synthSec: 28.4, wallSec: null },
  { id: "F3-V08", audioSec: 15.25, synthSec: 30.3, wallSec: null },
  { id: "F3-V09", audioSec: 18.13, synthSec: 32.0, wallSec: null },
  { id: "F3-V10", audioSec: 16.06, synthSec: 43.4, wallSec: null },
  { id: "F3-V11", audioSec: 16.13, synthSec: 35.1, wallSec: null },
  { id: "F3-V12", audioSec: 19.6, synthSec: 38.5, wallSec: null },
  { id: "F3-V13", audioSec: 14.6, synthSec: 47.2, wallSec: null },
  { id: "F3-V14", audioSec: 15.08, synthSec: 25.5, wallSec: null },
  { id: "F3-V15", audioSec: 13.6, synthSec: 24.6, wallSec: null },
  { id: "F3-V16", audioSec: 15.19, synthSec: 69.1, wallSec: null },
  { id: "F3-V17", audioSec: 16.29, synthSec: 49.0, wallSec: null },
  { id: "F3-V18", audioSec: 18.73, synthSec: 69.8, wallSec: null },
  { id: "F3-V19", audioSec: 15.66, synthSec: 46.7, wallSec: null },
  { id: "F3-W01", audioSec: 10.72, synthSec: 32.4, wallSec: null },
  { id: "F3-W02", audioSec: 10.08, synthSec: 29.2, wallSec: null },
  { id: "F3-W03", audioSec: 9.2, synthSec: 18.9, wallSec: null },
  { id: "F3-W04", audioSec: 11.12, synthSec: 26.2, wallSec: null },
  { id: "F3-W05", audioSec: 8.96, synthSec: 21.2, wallSec: null },
  { id: "F3-W06", audioSec: 9.36, synthSec: 29.4, wallSec: null },
  { id: "F3-W07", audioSec: 8.64, synthSec: 33.7, wallSec: null },
  { id: "F3-W08", audioSec: 9.76, synthSec: 36.4, wallSec: null },
  { id: "F3-W09", audioSec: 10.56, synthSec: 59.3, wallSec: null },
  { id: "F3-W10", audioSec: 11.6, synthSec: 21.9, wallSec: null },
  { id: "F3-W11", audioSec: 9.84, synthSec: 50.4, wallSec: null },
  { id: "F3-P10-KT", audioSec: 21.77, synthSec: 86.4, wallSec: null },
  { id: "F3-P13-KT", audioSec: 20.79, synthSec: 93.4, wallSec: null },
  { id: "F3-P16-KT", audioSec: 26.53, synthSec: 79.5, wallSec: null },
  { id: "F3-P10-DT", audioSec: 21.08, synthSec: 124.7, wallSec: null },
  { id: "F3-P13-DT", audioSec: 20.35, synthSec: 98.9, wallSec: null },
  { id: "F3-P16-DT", audioSec: 25.07, synthSec: 55.6, wallSec: null },
  { id: "F3-P10-QA", audioSec: 16.82, synthSec: 30.7, wallSec: null },
  { id: "F3-P13-QA", audioSec: 16.06, synthSec: 26.6, wallSec: null },
  { id: "F3-P16-QA", audioSec: 19.87, synthSec: 27.8, wallSec: null },
];

/** Thời gian nạp model + warmup infer đầu (giây) — xem header file. */
export const TTS_SYNTH_META_50F3 = {
  loadSecRun1: 12.5,
  warmupSecRun1: 7.8,
} as const;

/**
 * Nửa khoảng theo giọng h = 0,17 (giữ từ E1 — xem header: mọi mẫu
 * M3/M4 đã đo đều nằm trong khoảng; độ lệch lớn nhất so với tâm gộp
 * là 11,9%, nhưng tỉ lệ transfer Hải Đăng nay là 1,172, vượt nhẹ
 * biên 1,17 — biên dư cho transfer đã hết, ghi rõ không giấu).
 */
export const TTS_PER_VOICE_MIN_FACTOR_50F3 = 0.83;
export const TTS_PER_VOICE_MAX_FACTOR_50F3 = 1.17;

/** Một dòng trong bảng hệ số theo giọng (25/25 preset, cả 2 chế độ). */
export interface TtsVoiceCoefficient50F3 {
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

/**
 * Bảng hệ số theo giọng — PHỦ ĐỦ 25/25 preset ở cả hai chế độ (không
 * còn null). Hệ số tính lại từ pool mẫu trong test (xem
 * ttsEstimate50F3.test.ts §3); tốc độ gộp từng giọng:
 * - normal (ký tự/giây): Đức Trí 11,9688; Kim Thanh 12,5744;
 *   Thiền Tâm Đức 12,6497; Minh Đức 13,4984; Mỹ Duyên 13,5092
 *   (n = 8); Quang Sơn 14,5690; Ngọc Trân 15,1978; Thục Đoan 15,6481;
 *   Adam bựa 15,7063; Mai Anh 16,0038; Thái Sơn 16,0268 (n = 2:
 *   C4-M5 + F3-W01); Đoan Trang 16,2500; Quỳnh Anh 16,4397;
 *   Phạm Tuyên 16,7659; Ngọc Linh 17,1748; Ngọc Huyền 17,1748;
 *   Thiện Minh 17,3156; Hải Đăng 17,7286 (n = 7, ĐÃ ĐÍNH CHÍNH —
 *   loại C4-M5 của Thái Sơn khỏi pool E1, thêm neo A2); Adam 18,0556;
 *   Thùy Dung 18,0556; Xuân Vĩnh 18,3696; Minh Triết 18,5307;
 *   Thanh Bình 18,6947; Quốc Tuấn 18,8616; Trúc Ly 19,5602.
 * - dense (ký tự/giây): Kim Thanh 7,7831 (n = 4); Đức Trí 8,2065;
 *   Thiền Tâm Đức 8,3353 (n = 2); Mỹ Duyên 8,7685 (n = 2);
 *   Minh Đức 8,9045; Ngọc Trân 9,0816; Quang Sơn 9,5035;
 *   Thái Sơn 9,8180; Đoan Trang 9,9944; Thục Đoan 10,1165 (n = 2);
 *   Quỳnh Anh 10,3518; Adam bựa 10,7650; Mai Anh 10,9269;
 *   Xuân Vĩnh 11,0353; Phạm Tuyên 11,0834; Ngọc Linh 11,1320;
 *   Ngọc Huyền 11,3665; Hải Đăng 11,5509; Minh Triết 11,6645;
 *   Thanh Bình 11,6721; Thiện Minh 11,7182; Adam 11,8037;
 *   Quốc Tuấn 12,1918; Thùy Dung 12,3013; Trúc Ly 13,0882.
 * Tốc độ dense chênh nhau 7,78 → 13,09 (68%); normal chênh nhau
 * 11,97 → 19,56 (63%) trên cùng text chuẩn.
 */
export const TTS_VOICE_COEFFICIENTS_50F3: readonly TtsVoiceCoefficient50F3[] = [
  { voice: "Đức Trí", normalCoefficient: 0.7447, normalN: 2, denseCoefficient: 0.8603, denseN: 2 },
  { voice: "Kim Thanh", normalCoefficient: 0.7824, normalN: 2, denseCoefficient: 0.8159, denseN: 4 },
  { voice: "Thiền Tâm Đức", normalCoefficient: 0.7871, normalN: 2, denseCoefficient: 0.8738, denseN: 2 },
  { voice: "Minh Đức", normalCoefficient: 0.8399, normalN: 2, denseCoefficient: 0.9335, denseN: 1 },
  { voice: "Mỹ Duyên", normalCoefficient: 0.8406, normalN: 8, denseCoefficient: 0.9192, denseN: 2 },
  { voice: "Quang Sơn", normalCoefficient: 0.9065, normalN: 1, denseCoefficient: 0.9963, denseN: 1 },
  { voice: "Ngọc Trân", normalCoefficient: 0.9456, normalN: 1, denseCoefficient: 0.9521, denseN: 1 },
  { voice: "Thục Đoan", normalCoefficient: 0.9737, normalN: 1, denseCoefficient: 1.0606, denseN: 2 },
  { voice: "Adam bựa", normalCoefficient: 0.9773, normalN: 2, denseCoefficient: 1.1286, denseN: 2 },
  { voice: "Mai Anh", normalCoefficient: 0.9958, normalN: 1, denseCoefficient: 1.1455, denseN: 1 },
  { voice: "Thái Sơn", normalCoefficient: 0.9972, normalN: 2, denseCoefficient: 1.0293, denseN: 1 },
  { voice: "Đoan Trang", normalCoefficient: 1.0111, normalN: 1, denseCoefficient: 1.0478, denseN: 1 },
  { voice: "Quỳnh Anh", normalCoefficient: 1.0229, normalN: 2, denseCoefficient: 1.0852, denseN: 2 },
  { voice: "Phạm Tuyên", normalCoefficient: 1.0432, normalN: 1, denseCoefficient: 1.1619, denseN: 1 },
  { voice: "Ngọc Huyền", normalCoefficient: 1.0687, normalN: 1, denseCoefficient: 1.1916, denseN: 1 },
  { voice: "Ngọc Linh", normalCoefficient: 1.0687, normalN: 1, denseCoefficient: 1.167, denseN: 1 },
  { voice: "Thiện Minh", normalCoefficient: 1.0774, normalN: 1, denseCoefficient: 1.2285, denseN: 1 },
  { voice: "Hải Đăng", normalCoefficient: 1.1031, normalN: 7, denseCoefficient: 1.2109, denseN: 1 },
  { voice: "Adam", normalCoefficient: 1.1235, normalN: 1, denseCoefficient: 1.2374, denseN: 1 },
  { voice: "Thùy Dung", normalCoefficient: 1.1235, normalN: 1, denseCoefficient: 1.2896, denseN: 1 },
  { voice: "Xuân Vĩnh", normalCoefficient: 1.143, normalN: 1, denseCoefficient: 1.1569, denseN: 1 },
  { voice: "Minh Triết", normalCoefficient: 1.153, normalN: 1, denseCoefficient: 1.2228, denseN: 1 },
  { voice: "Thanh Bình", normalCoefficient: 1.1632, normalN: 1, denseCoefficient: 1.2236, denseN: 1 },
  { voice: "Quốc Tuấn", normalCoefficient: 1.1736, normalN: 1, denseCoefficient: 1.2781, denseN: 1 },
  { voice: "Trúc Ly", normalCoefficient: 1.2171, normalN: 1, denseCoefficient: 1.3721, denseN: 1 },
];

/**
 * Hệ số của một giọng ở một chế độ; null khi giọng chưa có trong bảng
 * (tên lạ / clone mode) → fallback hệ số gộp C4. So khớp tên chính xác
 * (phân biệt chữ hoa/thường và "Adam" ≠ "Adam bựa").
 */
export function ttsVoiceCoefficient50F3(voice: string | null | undefined, regime: TtsRegime47C4): number | null {
  if (!voice) return null;
  const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === voice);
  if (!row) return null;
  return regime === "numberDense" ? row.denseCoefficient : row.normalCoefficient;
}

/** Kết quả ước lượng theo tầng + chế độ + giọng (mở rộng hình dạng C4). */
export interface TtsEstimateRange50F3 extends TtsEstimateRange47C4 {
  /** Giọng được hỏi (null khi không truyền voice hoặc fallback). */
  voice: string | null;
  /** Hệ số theo giọng đã áp (f normal / g dense); null khi fallback. */
  coefficient: number | null;
  /** true khi đã áp hệ số theo giọng, false khi fallback hệ số gộp C4. */
  perVoice: boolean;
}

/**
 * Ước lượng khoảng độ dài giọng đọc từ text theo bảng hệ số theo
 * giọng (F3, phủ đủ 25/25), fallback hệ số gộp C4/D1 khi giọng chưa
 * có trong bảng hoặc không truyền voice. Ngưỡng số-dày 13% tái dùng
 * từ C4 (fallback tạm thời — xem header: dữ liệu thăm dò cho thấy
 * không có ngưỡng nhị phân nào đúng cho mọi giọng). Trả null khi text
 * rỗng — cùng quy ước với A3/B3/C4/D1/E1.
 */
export function estimateTtsDurationRange50F3(text: string, voice?: string | null): TtsEstimateRange50F3 | null {
  const chars = ttsTextLength(text ?? "");
  const spec = ttsTierForLength47C4(chars);
  if (spec === null) return null;
  const regime: TtsRegime47C4 = isNumberDenseText47C4(text) ? "numberDense" : "normal";
  const coefficient = ttsVoiceCoefficient50F3(voice, regime);
  if (coefficient === null) {
    const base = estimateTtsDurationRange47C4(text)!;
    return { ...base, voice: voice ?? null, coefficient: null, perVoice: false };
  }
  const baseRate = regime === "numberDense" ? TTS_NUMBER_DENSE_47C4.charsPerSec : spec.charsPerSec;
  const rate = baseRate * coefficient;
  const seconds = chars / rate;
  const row = TTS_VOICE_COEFFICIENTS_50F3.find((r) => r.voice === voice)!;
  const n = regime === "numberDense" ? row.denseN : row.normalN;
  return {
    tier: spec.tier,
    regime,
    chars,
    charsPerSec: rate,
    calibrated: n >= 3,
    seconds,
    minSec: seconds * TTS_PER_VOICE_MIN_FACTOR_50F3,
    maxSec: seconds * TTS_PER_VOICE_MAX_FACTOR_50F3,
    voice: voice ?? null,
    coefficient,
    perVoice: true,
  };
}

/** Ước lượng điểm trung tâm (giây) theo bảng F3; null khi text rỗng. */
export function estimateTtsDurationSec50F3(text: string, voice?: string | null): number | null {
  const r = estimateTtsDurationRange50F3(text, voice);
  return r === null ? null : r.seconds;
}

/** Hậu tố khoảng cho toast: ` (≈9.0–12.0s)`; text rỗng → "". */
export function ttsEstimateRangeSuffix50F3(text: string, voice?: string | null): string {
  const r = estimateTtsDurationRange50F3(text, voice);
  if (r === null) return "";
  return ` (≈${r.minSec.toFixed(1)}–${r.maxSec.toFixed(1)}s)`;
}

/**
 * Hậu tố cho toast done của TtsButton (cùng hình dạng với E1, thêm
 * tham số voice):
 * - header X-TTS-Duration hợp lệ → ` (12.3s)` (số đo thật);
 * - header thiếu/không hợp lệ, text có nội dung → khoảng F3
 *   ` (≈a–bs)` (theo giọng đang chọn khi đo được, fallback hệ số
 *   gộp C4 khi giọng lạ / clone / không truyền voice);
 * - không ước lượng được (text rỗng) → "" (bỏ hậu tố, không bịa số).
 */
export function ttsDoneSuffixRange50F3(opts: {
  headerValue: string | null | undefined;
  text: string;
  voice?: string | null;
}): string {
  const measured = parseTtsDurationHeader(opts.headerValue);
  if (measured !== null) return ` (${measured.toFixed(1)}s)`;
  return ttsEstimateRangeSuffix50F3(opts.text, opts.voice);
}
