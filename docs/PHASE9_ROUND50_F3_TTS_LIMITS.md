# Phase 9 — Đợt 50, luồng F3: Hiệu chuẩn TTS theo giọng vòng 2 (phủ đủ 25/25)

Ngày: 06/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts50f3/`, ngoài repo), KHÔNG stage bởi luồng
này (parent gộp). Chỉ sửa file text trong `~/workspace/repo-1`.

## 0. Bối cảnh (đọc từ LIMITS E1 §8.1–8.3)

- Nợ E1 §8.1: 19/25 giọng chưa có hệ số dense (chưa đo M3) — text
  số-dày bằng các giọng đó dùng hệ số dense gộp chung, có thể sai xa
  như Kim Thanh đã chứng minh (23,03 s vs khoảng gộp tối đa 21,94 s).
- Nợ E1 §8.2: 11/25 giọng chưa có hệ số normal (Thái Sơn, Phạm Tuyên,
  Xuân Vĩnh, Ngọc Trân, Quốc Tuấn, Adam, Trúc Ly, Thiện Minh, Mai Anh,
  Quang Sơn, Ngọc Huyền) — cần đo M4 cho 11 giọng này.
- Nợ E1 §8.3: ngưỡng 13% vẫn tạm thời — chưa có mẫu thăm dò 10–16%
  bằng nhiều giọng (nhất là giọng dense chậm mới đo: Kim Thanh, Đức
  Trí) để vẽ đường cong chậm theo tỉ lệ; phản ví dụ X2 vẫn đứng.
- Nợ E1 §8.4 (transfer theo text mới đo ở 1 giọng Hải Đăng, tỉ lệ
  1,154) — luồng này đo lại transfer khi có neo A2, xem §4.5.

## 1. Việc luồng này làm

1. Đo M3 cho 19 giọng còn thiếu hệ số dense qua `tts.py` (cùng text
   chuẩn M3 178 ký tự như C4/D1/E1); giọng chậm Mỹ Duyên, Thiền Tâm
   Đức, Thục Đoan đo lặp 2 lần liền nhau để kiểm phương sai — 22 mẫu.
2. Đo M4 cho 11 giọng còn thiếu hệ số normal (cùng text chuẩn M4 169
   ký tự) — 11 mẫu.
3. Thăm dò ngưỡng 10–16%: 3 text mới P10 (10,22%), P13 (12,43% — tái
   dùng đúng text D1-T13 để so chéo giọng), P16 (15,96%) × 3 giọng
   (Kim Thanh, Đức Trí dense chậm + Quỳnh Anh đối chiếu) — 9 mẫu.
4. 2 neo kiểm chứng driver trước khối chính: Kim Thanh M3 (so E1) và
   Hải Đăng M4 (so E1) — driver đúng đường code mới đo tiếp.
5. Xây bảng hệ số F3 phủ đủ 25/25 preset ở cả hai chế độ trong lib mới
   `ttsEstimate50F3.ts` (mở rộng theo mẫu E1, KHÔNG sửa file E1),
   cập nhật `TtsButton` truyền voice vào helper F3 (clone mode →
   fallback hệ số gộp), cập nhật assertion nối UI trong test E1 §1,
   D1 §1, B3 §4 sang F3 (theo mẫu E1 đã làm với D1/B3).
6. Đính chính pool Hải Đăng của E1 (xem §4.5): pool E1 gộp nhầm mẫu
   C4-M5 của Thái Sơn; F3 loại M5 khỏi pool Hải Đăng và đưa M5 vào
   pool Thái Sơn. File E1 giữ nguyên số cũ (bản ghi lịch sử).
7. Đo riêng tốc độ tổng hợp trên 44 mẫu (xem §5).

## 2. Số nào YẾU / tạm thời lúc bắt đầu luồng (chưa đo lại)

- Mỗi giọng mới chỉ n = 1 trên mỗi text chuẩn (M3/M4) — hệ số của
  giọng đó dựa trên ĐÚNG 1 lần đo (trừ 3 giọng chậm đo lặp n = 2,
  Kim Thanh dense n = 4 nhờ neo A1, Hải Đăng normal n = 7 nhờ neo
  A2 + T2/T4/T5); khoảng theo giọng phải dựa vào phương sai lặp quan
  sát được ở giọng khác, không phải khoảng tin cậy của riêng giọng đó.
- Tốc độ tổng hợp dao động lớn giữa các lần chạy cùng text/giọng
  (E1: gấp đôi) mà chưa rõ nguyên nhân — luồng này ghi riêng từng
  lần, không gộp mù.
- Độ dài WAV bị lượng tử hóa theo bước 0,08 s (C4 §3.1) — mẫu M3/M4
  dài 8–27 s nên ảnh hưởng < 1%.
- Đo trên VM này (4 CPU, ~7 GB RAM, không GPU), model VieNeu-TTS
  v3 Turbo 0.5B đã cache ở `server/tts/models/`. Thời gian nạp model
  KHÔNG tính vào độ dài audio. Driver nạp model MỘT lần rồi gọi
  `infer` cho từng mẫu qua đúng đường code của `tts.py`
  (`split_text_chunks` + `infer(..., apply_watermark=False)` +
  `concat_with_crossfade`).
- Các luồng đợt 50 khác (F1/F2/F4/F5/F6) chạy song song trên cùng VM
  trong lúc đo — tải CPU dao động theo thời gian (synth chậm nhất
  0,17× ở các mẫu cuối, xem §5); độ dài audio không phụ thuộc tải CPU.

## 3. Mẫu đo thật mới (ĐO XONG — 44 mẫu trong 1 lần chạy driver, ~32 phút)

Driver: `/tmp/tts50f3/drive50f3.py` (viết lại theo mẫu E1 — driver E1
đã mất theo /tmp, bản sao F3 đã backup ngay vào
`hidden_files/tts50f3/drive50f3.py` TRƯỚC khi chạy). Nạp model 12,5 s;
warmup infer ("Chào bạn!", Hải Đăng) 7,8 s (chậm hơn E1 1,5–2,1 s —
máy đang tải). Mỗi dòng kết quả ghi ĐỒNG THỜI vào
`/tmp/tts50f3/results.jsonl` và `hidden_files/tts50f3/results.jsonl`
NGAY trong lúc đo (flush + fsync) — backup khớp byte-for-byte
(45 dòng = meta + 44 mẫu), không mất mẫu nào (bài học E1 §8.9 đã
được áp dụng và đã chứng minh hiệu quả: lần này không có restart,
nhưng cơ chế đã sẵn sàng). WAV ở `/tmp/tts50f3/` (44 file).

Verify (`verify50f3.py`, đã backup): header WAV khớp ffprobe từng
mili-giây cho cả 44 WAV; lead/trail silence ≤ 0,3 s; khoảng lặng
trong dài nhất 1,0 s (Xuân Vĩnh M3 — quãng nghỉ giữa câu của giọng
chậm, không phải đệm; E1 tối đa 0,8 s). Độ dài đo là thời gian đọc thật.

### 3.1 Neo kiểm chứng driver (2 mẫu)

| Mẫu | Giọng | Text | F3 | E1 (đối chiếu) | Kết luận |
| --- | --- | --- | --- | --- | --- |
| F3-A1 | Kim Thanh | M3 | 22,53 s | 22,92 / 23,03 / 23,00 s | lệch ≤ 2,2% ✓ |
| F3-A2 | Hải Đăng | M4 | 8,40 s | 8,64 / 9,28 / 9,04 s | nhanh nhất trong 4 lần đo M4 |

A1 khớp chặt (≤ 2,2%) — driver đúng đường code. A2 là lần đo M4
nhanh nhất của Hải Đăng (8,40 s): spread M4 của giọng này nay là
8,40–9,28 s (10,0%, lớn hơn mức tối đa 7,1% giữa hai lần chạy E1),
nhưng mọi lần đo vẫn nằm trong khoảng theo giọng (xem test §4).

### 3.2 M3 cho 19 giọng chưa có hệ số dense (22 mẫu, gồm lặp ×3)

| Mẫu | Giọng | M3 (s) | Tốc độ (ký tự/giây) |
| --- | --- | --- | --- |
| F3-V01 / V01b | Mỹ Duyên | 20,07 / 20,53 | 8,77 (gộp) |
| F3-V02 / V02b | Thiền Tâm Đức | 21,61 / 21,10 | 8,34 (gộp) |
| F3-V03 / V03b | Thục Đoan | 17,48 / 17,71 | 10,12 (gộp) |
| F3-V04 | Đoan Trang | 17,81 | 9,99 |
| F3-V05 | Ngọc Linh | 15,99 | 11,13 |
| F3-V06 | Thùy Dung | 14,47 | 12,30 |
| F3-V07 | Minh Triết | 15,26 | 11,66 |
| F3-V08 | Thanh Bình | 15,25 | 11,67 |
| F3-V09 | Thái Sơn | 18,13 | 9,82 |
| F3-V10 | Phạm Tuyên | 16,06 | 11,08 |
| F3-V11 | Xuân Vĩnh | 16,13 | 11,04 |
| F3-V12 | Ngọc Trân | 19,60 | 9,08 |
| F3-V13 | Quốc Tuấn | 14,60 | 12,19 |
| F3-V14 | Adam | 15,08 | 11,80 |
| F3-V15 | Trúc Ly | 13,60 | 13,09 |
| F3-V16 | Thiện Minh | 15,19 | 11,72 |
| F3-V17 | Mai Anh | 16,29 | 10,93 |
| F3-V18 | Quang Sơn | 18,73 | 9,50 |
| F3-V19 | Ngọc Huyền | 15,66 | 11,37 |

Lặp giọng chậm (n = 2, chạy liền nhau): Mỹ Duyên lệch 2,3%, Thiền
Tâm Đức 2,4%, Thục Đoan 1,3% — đều NHỎ. Đối chiếu: spread M4 11,5%
của Mỹ Duyên ở E1 (n = 8) dường như chỉ ở text thường M4, không phải
đặc tính chung của giọng — phương sai M3 của chính giọng này chỉ 2,3%.

### 3.3 M4 cho 11 giọng chưa có hệ số normal (11 mẫu)

| Mẫu | Giọng | M4 (s) | Tốc độ (ký tự/giây) |
| --- | --- | --- | --- |
| F3-W01 | Thái Sơn | 10,72 | 15,77 |
| F3-W02 | Phạm Tuyên | 10,08 | 16,77 |
| F3-W03 | Xuân Vĩnh | 9,20 | 18,37 |
| F3-W04 | Ngọc Trân | 11,12 | 15,20 |
| F3-W05 | Quốc Tuấn | 8,96 | 18,86 |
| F3-W06 | Adam | 9,36 | 18,06 |
| F3-W07 | Trúc Ly | 8,64 | 19,56 |
| F3-W08 | Thiện Minh | 9,76 | 17,32 |
| F3-W09 | Mai Anh | 10,56 | 16,00 |
| F3-W10 | Quang Sơn | 11,60 | 14,57 |
| F3-W11 | Ngọc Huyền | 9,84 | 17,17 |

Trúc Ly là giọng NHANH NHẤT cả hai chế độ (normal 19,56; dense
13,09). Quốc Tuấn nhanh thứ hai ở cả hai chế độ (18,86 / 12,19).
Giọng chậm nhất normal vẫn là Đức Trí (11,97, đo ở E1); giọng chậm
nhất dense vẫn là Kim Thanh (7,78 gộp, đo E1 + neo A1).

### 3.4 Thăm dò ngưỡng 10–16% (9 mẫu)

| Giọng | M4 0% | P10 10,22% | P13 12,43% | M3 13,48% | P16 15,96% |
| --- | --- | --- | --- | --- | --- |
| Kim Thanh | 12,57 | 8,54 | 8,13 | 7,78 | 7,09 |
| Đức Trí | 11,97 | 8,82 | 8,30 | 8,21 | 7,50 |
| Quỳnh Anh | 16,44 | 11,06 | 10,52 | 10,35 | 9,46 |

(Đơn vị: ký tự/giây. M4/M3 là tốc độ gộp; P10/P13/P16 là 1 lần đo.
Chi tiết giây: Kim Thanh P10 21,77 / P13 20,79 / P16 26,53;
Đức Trí P10 21,08 / P13 20,35 / P16 25,07; Quỳnh Anh P10 16,82 /
P13 16,06 / P16 19,87.)

Đọc bảng: tốc độ ĐƠN ĐIỆU GIẢM theo tỉ lệ chữ số ở cả 3 giọng, KHÔNG
có bước nhảy ở 13% — xem kết luận §4.6.

## 4. Bảng hệ số theo giọng + kết luận ngưỡng (ĐO XONG)

Bảng hệ số F3 (`ttsEstimate50F3.ts`, tính lại từ pool mẫu trong test
§3 — tốc độ gộp = tổng ký tự / tổng giây trên mọi lần đo của giọng đó,
gồm cả lần lặp/neo + mẫu C4/D1/E1 cũ):

### 4.1 Hệ số normal f (tốc độ gộp medium / 16,0714) — 25/25

| Giọng | Tốc độ gộp | n | f |
| --- | --- | --- | --- |
| Đức Trí | 11,97 | 2 | 0,7447 |
| Kim Thanh | 12,57 | 2 | 0,7824 |
| Thiền Tâm Đức | 12,65 | 2 | 0,7871 |
| Minh Đức | 13,50 | 2 | 0,8399 |
| Mỹ Duyên | 13,51 | 8 | 0,8406 |
| Quang Sơn | 14,57 | 1 | 0,9065 |
| Ngọc Trân | 15,20 | 1 | 0,9456 |
| Thục Đoan | 15,65 | 1 | 0,9737 |
| Adam bựa | 15,71 | 2 | 0,9773 |
| Mai Anh | 16,00 | 1 | 0,9958 |
| Thái Sơn | 16,03 | 2 | 0,9972 |
| Đoan Trang | 16,25 | 1 | 1,0111 |
| Quỳnh Anh | 16,44 | 2 | 1,0229 |
| Phạm Tuyên | 16,77 | 1 | 1,0432 |
| Ngọc Linh | 17,17 | 1 | 1,0687 |
| Ngọc Huyền | 17,17 | 1 | 1,0687 |
| Thiện Minh | 17,32 | 1 | 1,0774 |
| Hải Đăng | 17,73 | 7 | 1,1031 |
| Adam | 18,06 | 1 | 1,1235 |
| Thùy Dung | 18,06 | 1 | 1,1235 |
| Xuân Vĩnh | 18,37 | 1 | 1,1430 |
| Minh Triết | 18,53 | 1 | 1,1530 |
| Thanh Bình | 18,69 | 1 | 1,1632 |
| Quốc Tuấn | 18,86 | 1 | 1,1736 |
| Trúc Ly | 19,56 | 1 | 1,2171 |

Tốc độ normal chênh nhau 11,97 → 19,56 (63%) trên cùng text M4.
Hai cặp trùng tốc độ gộp là trùng hợp thật (Adam = Thùy Dung 9,36 s;
Ngọc Linh = Ngọc Huyền 9,84 s — cùng 169 ký tự, cùng số giây).

### 4.2 Hệ số dense g (tốc độ gộp M3 / 9,5388) — 25/25

| Giọng | Tốc độ gộp | n | g |
| --- | --- | --- | --- |
| Kim Thanh | 7,78 | 4 | 0,8159 |
| Đức Trí | 8,21 | 2 | 0,8603 |
| Thiền Tâm Đức | 8,34 | 2 | 0,8738 |
| Mỹ Duyên | 8,77 | 2 | 0,9192 |
| Minh Đức | 8,90 | 1 | 0,9335 |
| Ngọc Trân | 9,08 | 1 | 0,9521 |
| Quang Sơn | 9,50 | 1 | 0,9963 |
| Thái Sơn | 9,82 | 1 | 1,0293 |
| Đoan Trang | 9,99 | 1 | 1,0478 |
| Thục Đoan | 10,12 | 2 | 1,0606 |
| Quỳnh Anh | 10,35 | 2 | 1,0852 |
| Adam bựa | 10,77 | 2 | 1,1286 |
| Mai Anh | 10,93 | 1 | 1,1455 |
| Xuân Vĩnh | 11,04 | 1 | 1,1569 |
| Phạm Tuyên | 11,08 | 1 | 1,1619 |
| Ngọc Linh | 11,13 | 1 | 1,1670 |
| Ngọc Huyền | 11,37 | 1 | 1,1916 |
| Hải Đăng | 11,55 | 1 | 1,2109 |
| Minh Triết | 11,66 | 1 | 1,2228 |
| Thanh Bình | 11,67 | 1 | 1,2236 |
| Thiện Minh | 11,72 | 1 | 1,2285 |
| Adam | 11,80 | 1 | 1,2374 |
| Quốc Tuấn | 12,19 | 1 | 1,2781 |
| Thùy Dung | 12,30 | 1 | 1,2896 |
| Trúc Ly | 13,09 | 1 | 1,3721 |

Tốc độ dense chênh nhau 7,78 → 13,09 (68%) — hệ số dense riêng là
BẮT BUỘC, không phải cải tiến thêm. KHÔNG còn giọng nào phải fallback
hệ số dense gộp chung. Tỉ lệ dense/normal theo giọng: 0,598–0,686
(Ngọc Trân thấp nhất 0,598; Đức Trí cao nhất 0,686) — không phải hằng
số, nên vẫn KHÔNG suy dense từ hệ số normal.

### 4.3 Khoảng theo giọng: giữ h = 0,17 → [0,83×, 1,17×]

- Mọi mẫu M3/M4 đã đo (E1 + F3 + C4/D1 cũ) đều nằm trong khoảng theo
  giọng F3 của giọng đó (khóa trong test §6).
- Độ lệch lớn nhất của một mẫu so với tâm gộp là 11,9% (Hải Đăng M4
  8,40 s so với tâm 9,53 s) — vẫn trong h = 0,17 với biên dư ~5 điểm.
- LƯU Ý TRUNG THỰC (xem §4.5): tỉ lệ transfer Hải Đăng nay là 1,172,
  vượt NHẸ biên 1,17 — biên dư cho transfer đã hết; giọng khác có
  transfer lớn hơn thì khoảng có thể không chứa. h = 0,17 vẫn chứa
  được mọi mẫu vì tâm gộp nằm giữa hai nhóm text, nhưng không nới h
  lên khi chưa có mẫu nào thực sự rơi ngoài khoảng.

### 4.4 Mô hình theo giọng tốt hơn hệ số gộp — bằng chứng mới

- Trúc Ly M3 thực 13,60 s — khoảng dense gộp [15,41–21,94] s KHÔNG
  chứa (dự báo chậm hơn thực tế); khoảng theo giọng của cô
  ([11,29–15,91] s) chứa. Thêm một giọng nữa chứng minh hệ số gộp
  SAI hẳn, không chỉ kém chính xác (sau Kim Thanh ở E1).
- Ngược lại, Quốc Tuấn M3 14,60 s cũng ngoài khoảng gộp (dưới biên
  15,41 s) nhưng trong khoảng theo giọng ([12,12–17,08] s).
- Trúc Ly M4 thực 8,64 s — khoảng medium gộp [8,78–13,53] s KHÔNG
  chứa (giọng nhanh nhất đọc nhanh hơn cả biên dưới của khoảng gộp);
  khoảng theo giọng của cô ([7,17–10,11] s) chứa. Thêm một giọng nữa
  chứng minh hệ số gộp SAI hẳn ở hai đầu nhanh/chậm (sau Kim Thanh
  ở E1, Trúc Ly/Quốc Tuấn ở F3).
- 11 giọng mới đo M4: chỉ Trúc Ly rơi ngoài khoảng gộp; 10 giọng còn
  lại nằm trong cả hai khoảng — nhưng khoảng theo giọng vẫn là đáp án
  đúng cho mọi giọng (test §6 khóa toàn bộ: mọi mẫu M3/M4 đã đo đều
  nằm trong khoảng theo giọng của giọng đó).

### 4.5 ĐÍNH CHÍNH E1: pool Hải Đăng gộp nhầm C4-M5 của Thái Sơn

- Bằng chứng: `ttsEstimate47C4.ts` ghi mẫu C4-M5 có
  `voice: "Thái Sơn"`, 190 ký tự, 11,68 s — nhưng test E1 §3/§5 đã
  gộp mẫu này vào pool Hải Đăng ("M4 ×3 + T2/T4/T5/M5").
- Tính lại pool nhiễm: 1262 ký tự / 73,28 s = 17,2221, khớp 17,2216
  trong sai số ±0,001 của test E1 — xác nhận chẩn đoán (không phải
  nghi ngờ suông).
- F3 sửa: pool Hải Đăng đúng = M4 ×3 (E1) + T2/T4/T5 (D1, ít số) +
  neo A2 (F3) = 1241 ký tự / 70,00 s = 17,7286 → f = 1,1031 (E1:
  1,0716), n = 7. Mẫu C4-M5 chuyển sang pool Thái Sơn: f Thái Sơn =
  (190 + 169) / (11,68 + 10,72) = 16,0268 → 0,9972, n = 2.
  M5-only (16,27) vs M4-only (15,77) của Thái Sơn lệch 3,1% — gộp
  hai text medium là hợp lý (khóa trong test §3).
- Ảnh hưởng thực tế: hệ số Hải Đăng tăng 2,9% (1,0716 → 1,1031);
  toast cho Hải Đăng trước đây dự báo hơi chậm (tâm cao hơn thực tế
  ~3%). File E1 (lib + test) GIỮ NGUYÊN số cũ — đó là bản ghi lịch
  sử của phép tính E1; chỉ helper F3 dùng số đã đính chính.
- Transfer Hải Đăng (đã đính chính): M4 gộp 19,1174 / medium-khác
  gộp 16,3110 = 1,1721 (E1: 1,1537 — tăng do neo A2 8,40 s kéo M4
  gộp lên). f M4-only nay là 1,1895, dự báo B3-L1 lệch 16,0% — vẫn
  sai rõ; f gộp mọi medium (1,1031) cho khoảng [12,81–18,06] s chứa
  17,04 s (test §5).

### 4.6 Ngưỡng 13%: KHÔNG đủ để khóa ngưỡng mới — và dữ liệu mới cho thấy KHÔNG CÓ ngưỡng nhị phân nào đúng cho mọi giọng

- Đường cong tốc độ theo tỉ lệ chữ số là đơn điệu giảm, trơn, phụ
  thuộc giọng (test §6 khóa tính đơn điệu nghiêm ngặt ở cả 3 giọng:
  normal > P10 > P13 > M3 > P16).
- Ở P10 (10,22%, DƯỚI ngưỡng 13%): cả 3 giọng đã chậm 84–88% quãng
  đường từ normal xuống dense (Kim Thanh 84%, Đức Trí 84%, Quỳnh
  Anh 88%). Bộ phân loại nhị phân gọi đây là "thường" trong khi
  giọng đọc gần như chậm hẳn — khoảng normal F3 KHÔNG chứa số thật
  của cả 6 mẫu P10/P13 (test §6 khóa từng mẫu).
- Ở P13 (12,43%): đạt 93–97% quãng đường xuống dense.
- Ở P16 (15,96%, TRÊN M3 13,48%): cả 3 giọng đọc CHẬM HƠN cả M3
  (Kim Thanh 7,09 < 7,78; Đức Trí 7,50 < 8,21; Quỳnh Anh 9,46 <
  10,35) — tốc độ dense ở M3 không phải sàn; đường cong tiếp tục
  giảm khi tỉ lệ chữ số tăng.
- Đối chiếu Hải Đăng (D1): T2 2,05% → 16,14; T4 4,15% → 16,52;
  T5 5,08% → 16,27; T8 8,2% → 14,68; T13 12,43% → 12,49 — cũng
  đơn điệu giảm, nhưng điểm rơi của anh muộn hơn (ở 8,2% mới chậm
  rõ), trong khi Kim Thanh/Đức Trí/Quỳnh Anh đã chậm mạnh ở 10,22%.
  Hình dạng đường cong phụ thuộc giọng.
- Phản ví dụ X2 vẫn đứng: Minh Đức đọc T13 (12,43%) trong 19,17 s
  (8,82 ký tự/giây) — khoảng normal F3 [10,39–14,65] s không chứa.
- KẾT LUẬN (trả lời trực tiếp task giao): dữ liệu KHÔNG đủ để khóa
  ngưỡng mới — mà còn chứng minh ngược: không có ngưỡng tỉ lệ chữ số
  nhị phân nào đúng cho mọi giọng. Ngưỡng 13% GIỮ NGUYÊN làm
  fallback tạm thời (helper F3 tái dùng bộ phát hiện C4 nguyên vẹn).
  Hướng đúng là mô hình đường cong theo giọng (nội suy tốc độ theo
  tỉ lệ chữ số cho từng giọng) — dữ liệu thăm dò đã lưu trong lib
  F3 (`TTS_SAMPLES_50F3`, textId P10/P13/P16) làm nền cho luồng sau;
  luồng này KHÔNG xây mô hình đường cong (ngoài phạm vi task giao,
  và 3 điểm/giọng chưa đủ để khóa dạng đường cong).

## 5. Tốc độ tổng hợp (ĐO XONG — 44 lần đo, số thật)

- Infer thuần (driver, đã trừ nạp model, sau 1 lần warmup):
  44 lần đo, tỉ lệ audio/synth **0,17–0,75×, median 0,44×** — đều
  < 1× realtime. Nhanh hơn E1 (0,12–0,63×, median 0,32×) vì máy yên
  hơn ở đầu lượt đo (các mẫu đầu 0,49–0,75×); các mẫu cuối chậm lại
  tới 0,17× khi các luồng đợt 50 khác tải CPU (Đức Trí P10 synth
  124,7 s cho 21,08 s audio — chậm nhất lượt). Tổng thời gian synth
  1886,1 s cho 44 mẫu (~32 phút cả lượt đo, gồm nạp model + warmup).
- Nạp model 12,5 s; warmup infer đầu 7,8 s cho câu "Chào bạn!"
  (0,56 s audio) — chậm hơn E1 (1,5–2,1 s) do máy đang tải.
- So sánh: con số "~1,5–2,5× realtime" trong memory vẫn SAI HẲN so
  với đo thật trên VM này (0,17–0,75×, không lần nào vượt 1×).
  KHÔNG sửa memory (theo quy ước các luồng trước); chỉ báo số thật
  ở đây. Tốc độ tổng hợp không ảnh hưởng độ dài WAV hay toast (chỉ
  ảnh hưởng thời gian chờ khi bấm TTS).

## 6. Kiểm chứng (số thật)

- Test đỏ-trước (helper F3 + nối UI): chạy TRƯỚC khi chuyển
  TtsButton — esbuild bundle pass, test F3 **13 pass, 2 fail**
  (đúng 1 test nối UI đỏ + 1 test tỉ lệ dense/normal sai do luồng
  này tính tay nhầm min 0,619 — số đúng là 0,598 của Ngọc Trân, đã
  sửa test + comment header lib, không phải lỗi số đo). Sau khi
  chuyển TtsButton + sửa test: **15/15**.
- Test mới F3 **15/15** (`ttsEstimate50F3.test.ts` — nối UI, text
  chuẩn + thăm dò, tính lại bảng hệ số normal/dense từ pool, đính
  chính E1, neo + lặp giọng chậm, transfer 1,172 + B3-L1, chứa mọi
  mẫu M3/M4 đã đo, đường cong ngưỡng đơn điệu + phân loại sai P10/P13,
  fallback + "Adam" ≠ "Adam bựa", hậu tố toast ví dụ Trúc Ly/Kim
  Thanh/Quốc Tuấn, tốc độ tổng hợp < 1×).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate47C4.test.ts` **10/10**, `ttsEstimate48D1.test.ts`
  **12/12** (§1 nối UI đã cập nhật sang F3),
  `ttsEstimate46B3.test.ts` **7/7** (§4 nối UI đã cập nhật sang F3),
  `ttsEstimate45A3.test.ts` **10/10**, `ttsDuration44Z3.test.ts`
  **9/9**, `relinkEdge45A3.test.ts` **12/12**,
  `ttsEstimate49E1.test.ts` **13/13** (§1 nối UI đã cập nhật sang F3).
- `tsc --noEmit` trong `apps/web`: **sạch, 0 lỗi** (chạy lại trực
  tiếp sau khi sửa `tsconfig.json`, không qua pipe).
- `vite build`: **pass** (built in 5,65 s; chỉ cảnh báo chunk
  >500 kB có sẵn, không liên quan luồng này).

## 7. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:
1. `apps/web/src/lib/ttsEstimate50F3.ts` — bảng hệ số theo giọng phủ
   đủ 25/25 (normal + dense) + helper nhận voice + fallback C4 +
   mẫu đo F3 (44 mẫu) + bảng tốc độ tổng hợp 44 lần đo.
2. `apps/web/src/lib/ttsEstimate50F3.test.ts` — test mới 15/15.
3. `docs/PHASE9_ROUND50_F3_TTS_LIMITS.md` — chính tài liệu này.

Đổi:
1. `apps/web/src/components/TtsButton.tsx` — truyền voice đang chọn
   vào helper F3 (clone mode → voice undefined để fallback hệ số
   gộp chung); cập nhật comment ROUND49-E1 → ROUND50-F3.
2. `apps/web/src/lib/ttsEstimate49E1.test.ts` — chỉ §1 (nối UI) +
   comment header §1: assertion chuyển từ helper E1 sang helper F3.
3. `apps/web/src/lib/ttsEstimate48D1.test.ts` — chỉ §1 (nối UI) +
   comment header §1: assertion chuyển từ helper E1 sang helper F3.
4. `apps/web/src/lib/ttsEstimate46B3.test.ts` — chỉ §4 (nối UI):
   assertion chuyển từ helper E1 sang helper F3.
5. `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới F3
   (file này cũng được các luồng F1/F2 đợt 50 sửa song song — luồng
   này chỉ append dòng của mình sau dòng của họ, không chạm dòng khác).

Không đổi: `ttsEstimate49E1.ts` (giữ nguyên số cũ — bản ghi lịch sử,
xem §4.5), `ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`,
`ttsEstimate46B3.ts`, `ttsEstimate45A3.ts`, `ttsDuration44Z3.ts`,
mọi file test A3/C4/Z3/relink khác, bridge, mọi file luồng khác đợt 50
(F1/F2/F4/F5/F6 đang chạy song song — luồng này không chạm file nào
của họ; kiểm tra: không file ROUND50 F1/F2/F4/F5/F6 nào nhắc tới
TtsButton hay ttsEstimate).

File WAV đo (`/tmp/tts50f3/*.wav`, 44 file), kết quả đo
(`/tmp/tts50f3/results.jsonl`), driver đo (`/tmp/tts50f3/drive50f3.py`),
script verify (`/tmp/tts50f3/verify50f3.py`), script tính hệ số
(`/tmp/tts50f3/compute50f3.py`), log driver + verify + compute
(`/tmp/tts50f3/*.log`) nằm ngoài repo, không stage. Bản sao chống
restart của toàn bộ số đo + log + script nằm ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts50f3/`
(results.jsonl, drive50f3.log, drive50f3.stdout.log, verify50f3.log,
verify50f3.py, drive50f3.py, compute50f3.py, compute50f3.log) — chỉ là
backup số đo, không phải file repo, không stage.

## 8. Nợ mở còn lại (sau luồng này)

1. Mô hình đường cong theo giọng (thay ngưỡng nhị phân 13%): dữ liệu
   thăm dò cho thấy tốc độ giảm trơn theo tỉ lệ chữ số, phụ thuộc
   giọng — cần đo thêm điểm giữa (5–10% và 13–16%) cho nhiều giọng
   hơn để khóa dạng đường cong (tuyến tính từng đoạn? hàm mũ?) rồi
   mới thay bộ phân loại nhị phân. Hiện tại helper vẫn dùng ngưỡng
   13% + hệ số dense riêng — với giọng đã đo M3, ngưỡng ít quan
   trọng hơn (hệ số dense quyết định tốc độ ở text ≥ 13%); với text
   10–12% thì toast vẫn dự báo nhanh hơn thực tế (khoảng normal
   không chứa số thật — test §6 khóa 6 mẫu sai).
2. Đa số hệ số mới có n = 1 (19 giọng dense, 10 giọng normal) — hệ số
   của giọng đó dựa trên ĐÚNG 1 lần đo; cần đo lặp thêm cho các giọng
   n = 1 để thu hẹp khoảng tin cậy (ưu tiên giọng lệch xa trung bình:
   Trúc Ly, Quốc Tuấn, Đức Trí, Kim Thanh).
3. Transfer theo text nay là 1,172 (vượt nhẹ biên 1,17 của khoảng
   theo giọng) — biên dư cho transfer đã hết; cần đo thêm text medium
   thứ hai cho vài giọng nữa (nhất là giọng chậm) để biết transfer
   có phải đặc tính chung không, và xem có cần nới h lên 0,18 không.
   Hiện tại chưa nới vì chưa có mẫu nào rơi ngoài khoảng.
4. Phương sai Mỹ Duyên M4 11,5% (n = 8) vẫn chưa rõ cơ chế — nhưng
   phương sai M3 của chính giọng này chỉ 2,3% (n = 2), nên có thể
   phương sai lớn chỉ ở text thường, không phải đặc tính giọng nói
   chung. Cần đo lặp M4 thêm cho Mỹ Duyên và các giọng khác để tách
   hai giả thiết.
5. Giả thiết hệ số ổn định theo tầng mới có 1 điểm kiểm chứng
   (B3-L1 Hải Đăng, lệch tâm 10,4% với f mới — vẫn trong khoảng) —
   chưa đo chéo tầng cho giọng khác.
6. Tốc độ tổng hợp 0,17–0,75× realtime (median 0,44×), mâu thuẫn
   con số "~1,5–2,5×" trong memory — chưa rõ memory ghi trên máy
   khác hay model khác; không sửa memory theo quy ước. Tốc độ tổng
   hợp dao động lớn giữa các lần chạy cùng text/giọng (gấp hơn 4 lần:
   0,17× vs 0,75×) mà chưa rõ nguyên nhân (tải CPU chỉ giải thích
   một phần — các mẫu đầu máy yên vẫn dao động 0,33–0,75×).
7. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem
   LIMITS C4 §6.5).
8. Rủi ro mất dữ liệu khi VM restart xóa /tmp: đã giảm nhẹ bằng
   backup số đo + script vào hidden_files NGAY trong lúc đo (lần này
   backup khớp byte-for-byte, không mất mẫu nào) — nhưng WAV vẫn chỉ
   ở /tmp; các lần đo sau giữ nguyên cơ chế này.
