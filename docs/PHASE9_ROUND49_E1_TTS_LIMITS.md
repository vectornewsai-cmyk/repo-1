# Phase 9 — Đợt 49, luồng E1: Hiệu chuẩn TTS theo giọng (per-voice)

Ngày: 06/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts49e1/`, ngoài repo), KHÔNG stage bởi luồng
này (parent gộp). Chỉ sửa file text trong `~/workspace/repo-1`.

VIẾT SỚM (trước khi chạy đo dài) — tài liệu này được viết trước mọi
phép đo mới của luồng; các mục §3–§5 ghi rõ cái gì CHƯA BIẾT lúc viết,
và được cập nhật sau khi có số đo thật. Không có số nào dưới đây là
"suy ra từ suy đoán" mà không ghi rõ.

## 0. Bối cảnh (đọc từ LIMITS D1 + lib C4/D1, không đo lại)

- Nợ lớn nhất của D1 (LIMITS D1 §7.1): tốc độ đọc chênh nhau theo
  giọng tới 46% trên cùng text thường (M4 169 ký tự: 9,04 s Thanh
  Bình → 13,20 s Thiền Tâm Đức), và hiệu ứng số-dày cũng phụ thuộc
  giọng (thí nghiệm 2x2: cùng text M3, Minh Đức 8,90 còn Hải Đăng
  11,55 ký tự/giây; cùng text T13, Minh Đức 8,82 còn Hải Đăng
  12,49). Hệ số gộp chung chỉ đúng trung bình — toast cho giọng chậm
  (Thiền Tâm Đức, Mỹ Duyên) và giọng nhanh (Thanh Bình, Minh Triết)
  đều lệch có hệ thống. Đáp án đúng là bảng hệ số theo giọng.
- Ngưỡng numberDense 13% vẫn tạm thời (D1 §4.1): phản ví dụ X2
  (Minh Đức, text 12,43% → 8,82 ký tự/giây) chứng minh không có
  ngưỡng tỉ lệ chữ số nào đúng cho mọi giọng. Luồng này KHÔNG ép
  khóa ngưỡng; ngưỡng 13% giữ làm fallback.
- 4/25 giọng preset chưa đo: Quỳnh Anh, Đức Trí, Kim Thanh,
  Adam bựa (D1 §4.4). Lưu ý: "Adam bựa" là preset khác với "Adam"
  (C4-VS5 dùng "Adam", 13 ký tự → 0,96 s) — không được gộp hai giọng
  này.
- Phương sai lặp của Mỹ Duyên 11,3% (n = 2: 12,00 → 13,44 s) lớn
  bất thường so với Hải Đăng 1,6% (câu dài, C4) và Thiền Tâm Đức
  2,4% (D1) — cần đo lặp thêm để biết là đặc tính giọng hay nhiễu
  lần chạy (D1 §7.4).
- Tốc độ tổng hợp (synthSec) quan sát ở D1 là 0,15–0,59× realtime
  (vd T2: 38,6 s synth cho 12,08 s audio; V1: 88,5 s cho 13,20 s),
  CHẬM HƠN NHIỀU so với con số "~1,5–2,5× realtime" ghi trong
  memory — có thể do warmup/ONNX graph optimization ở các lần infer
  đầu (synth nhanh dần theo thứ tự chạy: 38,6 → 21,2 s) hoặc do VM
  yếu. Luồng này đo riêng (xem §5); KHÔNG sửa memory.
- Helper hiện tại: `TtsButton` dùng `ttsDoneSuffixRange47C4`
  (chuyển ở D1, không nhận voice). Bảng C4/D1: medium normal
  16,0714 [0,8345×, 1,2867×] n = 17; số-dày 9,5388 [0,8258×,
  1,1756×] n = 4; ngưỡng 0,13.

## 1. Việc luồng này làm

1. Đo 4 giọng còn lại chưa đo (Quỳnh Anh, Đức Trí, Kim Thanh,
   Adam bựa) qua `tts.py` với cùng text chuẩn M3 (số-dày, 178 ký
   tự) / M4 (thường, 169 ký tự) như các đợt trước — 8 mẫu; WAV ra
   `/tmp/tts49e1/` (ngoài repo), verify header WAV khớp ffprobe.
2. Đo lặp thêm giọng Mỹ Duyên (phương sai 11,3% cần đo lặp, ít nhất
   3 lần cùng text M4) — 3 mẫu lặp, KHÔNG tính vào n hiệu chuẩn.
3. Đo thêm 2 mẫu nền để bảng theo giọng đồng nhất trên cùng text
   chuẩn M4: Hải Đăng M4 (giọng mặc định của TtsButton — chưa từng
   đọc M4; tốc độ gộp low-digit medium của Hải Đăng từ D1/C4 là
   ~16,30, dùng làm cross-check) và Minh Đức M4 (đã có M3 số-dày
   8,90 nhưng chưa có M4 thường — cần cho hệ số normal của giọng
   này). Tổng 13 lần chạy đo trong driver.
4. Xây bảng hệ số theo giọng (per-voice coefficient) trong lib mới
   `ttsEstimate49E1.ts`: helper nhận thêm tham số `voice` (mặc định
   fallback hệ số chung C4/D1 khi giọng chưa đo), cập nhật
   `TtsButton` truyền voice đang chọn (clone mode → fallback chung,
   vì giọng clone không có hệ số đo). Test đỏ-trước/xanh-sau cho
   helper mới + nối UI; cập nhật assertion nối UI trong test B3 §4
   và test D1 §1 sang helper E1 (theo mẫu D1 đã làm với C4).
5. Đo riêng tốc độ tổng hợp (synthesis speed): thời gian `tts.py`
   chạy / độ dài audio ra — cả infer thuần (driver, đã trừ thời
   gian nạp model) lẫn chạy CLI đầy đủ (gồm nạp model ~8 s) — báo
   số thật, không sửa memory.
6. Ngưỡng numberDense 13% vẫn tạm thời — KHÔNG ép khóa ngưỡng; nếu
   dữ liệu mới cho thấy mô hình theo giọng tốt hơn, ghi rõ trong
   LIMITS và để ngưỡng 13% như fallback.

## 2. Số nào YẾU / tạm thời lúc bắt đầu luồng (chưa đo lại)

- Mỗi giọng mới chỉ n = 1 trên mỗi text chuẩn (M3/M4) — hệ số theo
  giọng của giọng đó dựa trên ĐÚNG 1 lần đo; khoảng theo giọng phải
  dựa vào phương sai lặp quan sát được ở giọng khác (xem thiết kế
  §4), không phải khoảng tin cậy của riêng giọng đó.
- Phương sai lặp Mỹ Duyên hiện n = 2 (spread 11,3%) — chưa biết là
  đặc tính giọng hay nhiễu lần chạy; 3 lần lặp thêm trong luồng này
  đưa lên n = 5.
- Tốc độ tổng hợp: con số D1 (0,15–0,59×) gộp cả warmup lần infer
  đầu; tốc độ steady-state (sau warmup) chưa tách riêng. Driver
  luồng này chạy 1 lần infer warmup (text ngắn, bỏ audio) TRƯỚC khi
  đo, để tách warmup khỏi tốc độ ổn định — và ghi riêng thời gian
  warmup.
- Độ dài WAV bị lượng tử hóa theo bước 0,08 s (C4 §3.1) — mẫu M3/M4
  dài 9–20 s nên ảnh hưởng < 1%.
- Đo trên VM này (4 CPU, ~7 GB RAM, không GPU), model VieNeu-TTS
  v3 Turbo 0.5B đã cache ở `server/tts/models/`. Thời gian nạp model
  KHÔNG tính vào độ dài audio. Driver nạp model MỘT lần rồi gọi
  `infer` cho từng mẫu qua đúng đường code của `tts.py`
  (`split_text_chunks` + `infer(..., apply_watermark=False)` +
  `concat_with_crossfade`) — xem §3 sau khi đo xong. (Driver D1 ở
  `/tmp/tts48d1/` đã bị dọn cùng /tmp nên không tái sử dụng được;
  driver luồng này viết lại từ đầu theo cùng đường code.)

## 3. Mẫu đo thật mới (ĐO XONG — 13 mẫu × 2 lần chạy + 2 CLI)

Driver: `/tmp/tts49e1/drive49e1.py` (viết lại lần 2 sau restart),
nạp model MỘT lần rồi gọi `infer` cho từng mẫu qua đúng đường code
của `tts.py` (`split_text_chunks` + `infer(...,
apply_watermark=False)` + `concat_with_crossfade`). Model VieNeu-TTS
v3 Turbo 0.5B đã cache; độ dài lấy từ header WAV (module `wave`).
Thời gian nạp model KHÔNG tính vào độ dài. Nạp model: lần 1 10,0 s,
lần 2 9,4 s. Warmup infer ("Chào bạn!", Hải Đăng): lần 1 2,1 s,
lần 2 1,5 s (audio warmup bỏ).

SỰ CỐ GIỮA CHỪNG — VM RESTART XÓA /tmp: lần chạy đầu (19:03–19:24)
đã đo xong cả 13 mẫu, nhưng VM restart lúc ~19:27 đã xóa toàn bộ
/tmp (WAV + results.jsonl + driver + log lần 1). Chỉ còn các con số
header WAV trong log đã in ra trước restart — các số lần 1 dưới đây
là số header-only, KHÔNG còn WAV để ffprobe lại. Luồng này đo LẠI
toàn bộ 13 mẫu (lần 2, 19:29–19:39) và lần 2 là bộ số chính thức
(kèm ffprobe). Bài học: từ lần 2, mỗi dòng kết quả ghi ĐỒNG THỜI
vào bản sao ở `hidden_files/tts49e1/results-run2.jsonl` (ngoài repo,
không stage) để chống restart.

### 3.1 Giọng mới trên text chuẩn (8 mẫu × 2 lần chạy)

| Mẫu | Giọng | Text | Lần 1 | Lần 2 | Tốc độ gộp (ký tự/giây) |
| --- | --- | --- | --- | --- | --- |
| E1-V8 | Quỳnh Anh | M4 | 10,24 s | 10,32 s | 16,44 |
| E1-V9 | Quỳnh Anh | M3 | 17,65 s | 16,74 s | 10,35 |
| E1-V10 | Đức Trí | M4 | 14,00 s | 14,24 s | 11,97 |
| E1-V11 | Đức Trí | M3 | 21,76 s | 21,62 s | 8,21 |
| E1-V12 | Kim Thanh | M4 | 12,96 s | 13,92 s | 12,57 |
| E1-V13 | Kim Thanh | M3 | 23,00 s | 22,92 s | 7,74 |
| E1-V14 | Adam bựa | M4 | 10,88 s | 10,64 s | 15,71 |
| E1-V15 | Adam bựa | M3 | 16,06 s | 17,01 s | 10,77 |

Hai lần chạy lệch nhau tối đa 7,1% (Kim Thanh M4: 12,96 → 13,92 s;
Hải Đăng M4: 8,64 → 9,28 s cũng 7,1%); các cặp còn lại lệch
0,3–5,7%. Kim Thanh M3 là giọng số-dày CHẬM NHẤT từng đo (7,74
ký tự/giây, 3 lần đo 22,92–23,03 s) — cả 3 lần đều NGOÀI khoảng
dense gộp [15,41–21,94] s (xem §4).

### 3.2 Nền đồng nhất M4 cho Hải Đăng + Minh Đức (2 mẫu × 2 lần chạy + 1 CLI)

| Mẫu | Giọng | Lần 1 | Lần 2 | Thêm | Tốc độ gộp |
| --- | --- | --- | --- | --- | --- |
| E1-V16 | Hải Đăng M4 | 8,64 s | 9,28 s | CLI-1: 9,04 s | M4: 18,81 (n = 3) |
| E1-V17 | Minh Đức M4 | 12,72 s | 12,32 s | — | 13,50 (n = 2) |

Hải Đăng đọc M4 ở 18,81 — nhanh hơn hẳn tốc độ gộp medium khác
của chính anh (T2/T4/T5/M5: 16,30, n = 4), tỉ lệ 1,1537. Đây là
bằng chứng transfer theo text (xem §4): hệ số của Hải Đăng phải
tính từ tốc độ gộp MỌI text medium (17,2216, n = 7), không phải
chỉ M4. Minh Đức: normal 13,50 vs dense 8,90 → tỉ lệ dense/normal
0,66 (chậm khi đọc số-dày gần như Hải Đăng 0,67, Kim Thanh 0,62,
Adam bựa 0,69 — tỉ lệ này dao động 0,62–0,69 theo giọng).

### 3.3 Lặp lại Mỹ Duyên M4 (3 mẫu/lần × 2 lần chạy, không tính vào n)

Lần 1: 12,56 / 12,64 / 12,40 s. Lần 2: 12,32 / 12,40 / 12,32 s.
Cộng 2 lần D1 (12,00 / 13,44 s) → Mỹ Duyên có n = 8 lần đo M4:
12,00–13,44 s, trung bình 12,51 s, spread (max−min)/mean = 11,5%.
Spread 11,3% ở D1 (n = 2) KHÔNG phải nhiễu lần chạy — ở n = 8 nó
vẫn 11,5%. Phương sai lớn là ĐẶC TÍNH của giọng Mỹ Duyên (các lần
đo chụm 12,32–12,64 s nhưng có 2 lần lệch xa: 12,00 s và 13,44 s).
Khoảng theo giọng [0,83×, 1,17×] chứa cả 8 lần đo.

### 3.4 Kiểm tra im lặng + cross-check ffprobe (lần 2)

- Header WAV khớp ffprobe từng mili-giây cho cả 13 WAV lần 2
  (vd V8: header 10,32 s / ffprobe 10,320 s). CLI-2 (Kim Thanh M3):
  ffprobe 23,030 s khớp JSON tts.py 23,03 s. CLI-1 (Hải Đăng M4):
  WAV mất theo restart, không ffprobe lại được — số 9,04 s lấy từ
  JSON tts.py (chính tts.py đọc header WAV của nó).
- Kiểm tra im lặng (RMS theo cửa sổ 0,1 s, ngưỡng 0,01): mọi WAV
  có lead/trail silence ≤ 0,3 s; khoảng lặng trong dài nhất 0,8 s
  (Đức Trí M3 — quãng nghỉ giữa câu của giọng chậm, không phải đệm).
  Độ dài đo là thời gian đọc thật.
- QUIRK (không ảnh hưởng so sánh): tts.py chia text M3 thành chunk
  ở dấu "." trong "2.4.1" rồi nối lại bằng khoảng trắng nên log báo
  chunk 182 ký tự thay vì 178 — cùng đường code cho mọi lần đo M3
  (C4/D1/E1) nên so sánh vẫn đúng.

### 3.5 Số lần 1 (đã mất WAV — chỉ còn số header trong log)

Lần 1 (13 mẫu): V8 10,24 / V9 17,65 / V10 14,00 / V11 21,76 /
V12 12,96 / V13 23,00 / V14 10,88 / V15 16,06 / V16 8,64 /
V17 12,72 / R1 12,56 / R2 12,64 / R3 12,40 (giây). Synth lần 1:
25,5 / 30,1 / 32,3 / 76,7 / 37,7 / 44,3 / 38,6 / 33,9 / 31,2 /
109,4 / 89,4 / 72,2 / 44,1 (giây) — các mẫu cuối chạy dưới tải CPU
cao (load ~6,6, các luồng đợt 49 khác chạy tsc/ffprobe song song),
synth chậm nhất 0,12×. Các số này chỉ dùng đối chiếu, không phải
bộ số chính thức.

## 4. Bảng hệ số theo giọng + kết luận ngưỡng (ĐO XONG)

Bảng hệ số theo giọng (`ttsEstimate49E1.ts`, tính lại từ pool mẫu
trong test §3 — tốc độ gộp = tổng ký tự / tổng giây trên mọi lần đo
của giọng đó, gồm cả 2 lần chạy E1 + CLI + mẫu C4/D1 cũ):

### 4.1 Hệ số normal f (tốc độ gộp medium / 16,0714)

| Giọng | Tốc độ gộp | n | f |
| --- | --- | --- | --- |
| Đức Trí | 11,97 | 2 | 0,7447 |
| Kim Thanh | 12,57 | 2 | 0,7824 |
| Thiền Tâm Đức | 12,65 | 2 | 0,7871 |
| Minh Đức | 13,50 | 2 | 0,8399 |
| Mỹ Duyên | 13,51 | 8 | 0,8406 |
| Thục Đoan | 15,65 | 1 | 0,9737 |
| Adam bựa | 15,71 | 2 | 0,9773 |
| Đoan Trang | 16,25 | 1 | 1,0111 |
| Quỳnh Anh | 16,44 | 2 | 1,0229 |
| Ngọc Linh | 17,17 | 1 | 1,0687 |
| Hải Đăng | 17,22 | 7 | 1,0716 |
| Thùy Dung | 18,06 | 1 | 1,1235 |
| Minh Triết | 18,53 | 1 | 1,1530 |
| Thanh Bình | 18,69 | 1 | 1,1632 |

Hải Đăng f = 1,0716 tính từ tốc độ gộp MỌI text medium normal
(17,2216: M4 ×3 + T2/T4/T5/M5, n = 7) — ngoại lệ có cơ sở (xem
§3.2). Tốc độ giữa các giọng chênh nhau 11,97 → 18,69 (56%) trên
cùng text M4 — xác nhận phát hiện D1, nay khóa thành hệ số.

### 4.2 Hệ số dense g (tốc độ gộp M3 / 9,5388)

| Giọng | Tốc độ gộp | n | g |
| --- | --- | --- | --- |
| Kim Thanh | 7,74 | 3 | 0,8119 |
| Đức Trí | 8,21 | 2 | 0,8603 |
| Minh Đức | 8,90 | 1 | 0,9335 |
| Quỳnh Anh | 10,35 | 2 | 1,0852 |
| Adam bựa | 10,77 | 2 | 1,1286 |
| Hải Đăng | 11,55 | 1 | 1,2109 |

Tốc độ dense giữa các giọng chênh nhau 7,74 → 11,55 (49%) — hệ số
dense riêng là BẮT BUỘC, không phải cải tiến thêm. Giọng chưa đo M3
(19/25, gồm Mỹ Duyên, Thùy Dung, Thiền Tâm Đức…) → g = null,
fallback hệ số dense gộp chung, KHÔNG suy dense từ hệ số normal
(tỉ lệ dense/normal dao động 0,62–0,69 theo giọng, không phải hằng số).

### 4.3 Khoảng theo giọng: nửa khoảng h = 0,17 → [0,83×, 1,17×]

h bao phủ 2 nguồn sai số đã đo: (a) phương sai chạy-lặp lớn nhất —
Mỹ Duyên 11,5% (n = 8); (b) transfer theo text — Hải Đăng đọc M4
nhanh hơn medium khác 15,4% (tỉ lệ 1,1537). h = 0,17 làm tròn ra
ngoài từ 0,154 với biên dư nhỏ — biên dư này MỎNG vì transfer mới
đo được ở 1 giọng; giọng khác có transfer lớn hơn thì khoảng có thể
không chứa (ghi rõ, không giấu). Kiểm chứng: mọi mẫu M4/M3 đã đo
(26 mẫu E1 + 2 CLI + mẫu C4/D1 cũ) đều nằm trong khoảng theo giọng
của giọng đó; riêng B3-L1 (Hải Đăng long, 17,04 s) cũng nằm trong
khoảng với f gộp mọi medium ([13,19–18,59] s), trong khi f M4-only
dự báo tâm sai 14,6% (14,56 s) — bằng chứng f gộp mọi medium là
lựa chọn đúng cho Hải Đăng.

### 4.4 Mô hình theo giọng tốt hơn hệ số gộp — bằng chứng trực tiếp

- Kim Thanh M3: cả 3 lần đo (23,00 / 22,92 / 23,03 s) đều NGOÀI
  khoảng dense gộp [15,41–21,94] s; khoảng theo giọng của cô
  ([19,08–26,89] s) chứa cả 3. Hệ số gộp không chỉ "kém chính xác"
  mà SAI hẳn cho giọng này.
- Đức Trí M4: thực 14,00 / 14,24 s — khoảng gộp medium [8,78–13,53]
  s KHÔNG chứa; khoảng theo giọng ([11,72–16,52] s) chứa.
- Ngược lại, giọng nhanh Thanh Bình M4 (9,04 s) nằm sát biên dưới
  khoảng gộp (8,78 s) nhưng ở giữa khoảng theo giọng ([7,50–10,58] s).
- Kết luận: mô hình theo giọng đúng hướng và tốt hơn rõ rệt ở các
  giọng lệch xa trung bình; ở giọng gần trung bình (f ≈ 1,0) thì
  tương đương hệ số gộp.

### 4.5 Ngưỡng 13% GIỮ NGUYÊN làm fallback (không khóa ngưỡng mới)

- Dữ liệu mới KHÔNG cho thấy ngưỡng tỉ lệ chữ số đúng cho mọi giọng:
  cả 6 giọng đo M3 (13,48%) đều đọc chậm như số-dày (7,74–11,55),
  nhưng tốc độ dense chênh nhau 49% theo giọng — ngưỡng chỉ phân
  loại chế độ, không dự báo được tốc độ; tốc độ phải lấy từ hệ số
  dense riêng của từng giọng.
- Phản ví dụ X2 (D1) vẫn đứng: không có thêm mẫu thăm dò ngưỡng ở
  10–16% bằng nhiều giọng trong luồng này (ngoài phạm vi task giao)
  — ngưỡng 13% tiếp tục là fallback tạm thời, và helper E1 tái dùng
  bộ phát hiện C4 nguyên vẹn.
- Hệ quả thực tế: với giọng đã đo M3, ngưỡng 13% ít quan trọng hơn
  (hệ số dense riêng quyết định tốc độ); với giọng chưa đo M3, ngưỡng
  13% + hệ số dense gộp vẫn là đáp án duy nhất — và có thể sai xa
  (như Kim Thanh chứng minh). Nợ mở: đo M3 cho 19 giọng còn lại.

## 5. Tốc độ tổng hợp (ĐO XONG — 28 lần đo, số thật)

- Infer thuần (driver, đã trừ nạp model, sau 1 lần warmup):
  26 lần đo, tỉ lệ audio/synth **0,12–0,63×, median 0,32×** — đều
  < 1× realtime, tức tổng hợp CHẬM HƠN thời gian phát 3 lần ở
  trung vị. Chậm nhất 0,12× (Minh Đức M4 lần 1, synth 109,4 s cho
  12,72 s audio); nhanh nhất 0,63× (Mỹ Duyên R3 lần 2, synth 19,5 s
  cho 12,32 s audio). Lần 2 máy yên (load ~0,6) cho 0,18–0,63×,
  median ~0,31× — tải CPU không phải toàn bộ câu chuyện: tốc độ
  tổng hợp vốn đã chậm và dao động lớn giữa các lần chạy (cùng
  text/giọng, synth có thể chênh nhau gấp đôi: Kim Thanh M3 lần 1
  44,3 s vs lần 2 76,1 s; Adam bựa M3 lần 1 33,9 s vs lần 2 95,7 s).
- CLI đầy đủ (gồm nạp model): Hải Đăng M4 wall 58,273 s cho 9,04 s
  audio = **0,16×** (infer thuần 44,8 s = 0,20×); Kim Thanh M3
  wall 42,950 s cho 23,03 s audio = **0,54×** (infer thuần 35,7 s
  = 0,65×). Nạp model 9,4–10,0 s; warmup infer đầu 1,5–2,1 s cho
  câu "Chào bạn!" (0,56 s audio).
- So sánh: con số "~1,5–2,5× realtime" trong memory SAI HẲN so với
  đo thật trên VM này (0,12–0,65× trên 28 lần đo, không lần nào
  vượt 1×). D1 quan sát 0,15–0,59× — khớp lần đo này (0,12–0,63×).
  Có thể memory ghi tốc độ của máy/GPU khác, hoặc của model khác —
  không suy đoán thêm. KHÔNG sửa memory (theo task giao); chỉ báo
  số thật ở đây. Tốc độ tổng hợp không ảnh hưởng độ dài WAV hay
  toast (chỉ ảnh hưởng thời gian chờ khi bấm TTS).

## 6. Kiểm chứng (số thật)

- Test đỏ-trước (helper E1 + nối UI): chạy TRƯỚC khi viết lib —
  esbuild **FAIL "Could not resolve ./ttsEstimate49E1"** (lib chưa
  tồn tại). Sau khi viết lib nhưng CHƯA chuyển TtsButton: test E1
  **11 pass, 2 fail** (đúng 1 test nối UI đỏ + 1 test đếm mẫu Mỹ
  Duyên sai do test tự đếm trùng V7 — lỗi test, đã sửa, không phải
  lỗi số đo). Sau khi chuyển TtsButton + sửa test: **13/13**.
- Test mới E1 sau khi đo xong + chuyển UI: **13/13**
  (`ttsEstimate49E1.test.ts` — nối UI, text chuẩn, tính lại bảng hệ
  số normal/dense từ pool, nhất quán lần 1–lần 2 ≤ 7,5%, phương sai
  Mỹ Duyên n = 8 spread 11,5%, transfer Hải Đăng 1,1537 + B3-L1,
  chứa mọi mẫu đã đo, hệ số gộp thua mô hình theo giọng (Kim Thanh
  M3), fallback y hệt C4, "Adam" ≠ "Adam bựa", ngưỡng 13% giữ
  nguyên, tốc độ tổng hợp < 1×, hậu tố toast ví dụ Đức Trí/Kim Thanh).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate47C4.test.ts` **10/10**, `ttsEstimate48D1.test.ts`
  **12/12** (§1 nối UI đã cập nhật sang E1),
  `ttsEstimate46B3.test.ts` **7/7** (§4 nối UI đã cập nhật sang E1),
  `ttsEstimate45A3.test.ts` **10/10**, `ttsDuration44Z3.test.ts`
  **9/9**, `relinkEdge45A3.test.ts` **12/12**.
- `tsc --noEmit` trong `apps/web`: **sạch, 0 lỗi** (một lần sửa giữa
  chừng: 4 import thừa trong test E1 — TS6133 — đã gỡ, test chạy lại
  vẫn 13/13).
- `vite build`: **pass** (built in 10,72 s; chỉ cảnh báo chunk
  >500 kB có sẵn, không liên quan luồng này).

## 7. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:
1. `apps/web/src/lib/ttsEstimate49E1.ts` — bảng hệ số theo giọng
   (14 giọng normal, 6 giọng dense) + helper nhận voice + fallback
   C4 + mẫu đo lần 1/lần 2/CLI + bảng tốc độ tổng hợp 28 lần đo.
2. `apps/web/src/lib/ttsEstimate49E1.test.ts` — test mới 13/13.
3. `docs/PHASE9_ROUND49_E1_TTS_LIMITS.md` — chính tài liệu này.

Đổi:
1. `apps/web/src/components/TtsButton.tsx` — truyền voice đang chọn
   vào helper E1 (clone mode → voice undefined để fallback hệ số
   gộp chung); cập nhật comment ROUND48-D1 → ROUND49-E1.
2. `apps/web/src/lib/ttsEstimate46B3.test.ts` — chỉ §4 (nối UI) +
   comment header §4: assertion chuyển từ helper C4 sang helper E1.
3. `apps/web/src/lib/ttsEstimate48D1.test.ts` — chỉ §1 (nối UI) +
   comment header §1: assertion chuyển từ helper C4 sang helper E1.

Không đổi: `ttsEstimate45A3.ts`, `ttsEstimate46B3.ts`,
`ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`, mọi file test A3/C4/Z3
khác, bridge, mọi file luồng khác đợt 49 (E2–E6 đang chạy song song
— luồng này không chạm file nào của họ; kiểm tra: không file
ROUND49 E2–E6 nào nhắc tới TtsButton). File WAV đo lần 2
(`/tmp/tts49e1/*.wav`, 14 file gồm CLI-2), kết quả đo lần 2
(`/tmp/tts49e1/results.jsonl`), driver đo (`/tmp/tts49e1/drive49e1.py`),
script verify (`/tmp/tts49e1/verify49e1.py`), log driver
(`/tmp/tts49e1/drive49e1.log`), bundle test (`/tmp/*.mjs`) nằm ngoài
repo, không stage. Bản sao chống restart của số đo lần 2 + log +
script verify nằm ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts49e1/`
(results-run2.jsonl, drive49e1-run2.log, verify49e1.py, cli2.time)
— chỉ là backup số đo, không phải file repo, không stage.

## 8. Nợ mở còn lại (sau luồng này)

1. 19/25 giọng chưa có hệ số dense (chưa đo M3) — text số-dày bằng
   các giọng đó vẫn dùng hệ số dense gộp chung, có thể sai xa như
   Kim Thanh đã chứng minh (23,03 s vs khoảng gộp tối đa 21,94 s).
   Cần đo M3 cho 19 giọng còn lại, ưu tiên các giọng chậm (Mỹ Duyên,
   Thiền Tâm Đức, Thục Đoan) vì dense của giọng chậm có thể còn
   chậm hơn nữa.
2. 11/25 giọng chưa có hệ số normal (chỉ đo ở tầng/text khác:
   Thái Sơn, Phạm Tuyên, Xuân Vĩnh, Ngọc Trân, Quốc Tuấn, Adam,
   Trúc Ly, Thiện Minh, Mai Anh, Quang Sơn, Ngọc Huyền) — cần đo M4
   cho 11 giọng này để bảng normal phủ đủ 25 preset.
3. Ngưỡng 13% vẫn tạm thời: chưa có mẫu thăm dò 10–16% bằng nhiều
   giọng (nhất là các giọng dense chậm mới đo: Kim Thanh, Đức Trí)
   để vẽ đường cong chậm theo tỉ lệ của từng giọng; phản ví dụ X2
   vẫn đứng.
4. Transfer theo text mới đo được ở 1 giọng (Hải Đăng, tỉ lệ 1,154)
   — khoảng theo giọng [0,83×, 1,17×] có biên dư mỏng (~0,006 trên
   biên transfer); giọng khác có transfer lớn hơn thì khoảng có thể
   không chứa. Cần đo thêm text medium thứ hai cho vài giọng nữa
   (nhất là giọng chậm) để biết transfer có phải đặc tính chung không.
5. Giả thiết hệ số ổn định theo tầng mới có 1 điểm kiểm chứng
   (B3-L1 Hải Đăng, lệch tâm 7%) — chưa đo chéo tầng cho giọng khác.
6. Tốc độ tổng hợp 0,12–0,65× realtime (median 0,32×), mâu thuẫn
   con số "~1,5–2,5×" trong memory — chưa rõ memory ghi trên máy
   khác hay model khác; không sửa memory theo task giao. Tốc độ
   tổng hợp dao động lớn giữa các lần chạy cùng text/giọng (gấp đôi)
   mà chưa rõ nguyên nhân (không phải chỉ do tải CPU — lần 2 máy
   yên vẫn dao động 0,18–0,63×).
7. Phương sai Mỹ Duyên 11,5% (n = 8) là lớn nhất quan sát được —
   khoảng theo giọng bao phủ được, nhưng chưa rõ cơ chế (prosody
   không ổn định giữa các lần chạy hay hai "mode" đọc khác nhau:
   5 lần chụm 12,32–12,64 s, 1 lần 12,00 s, 1 lần 13,44 s).
8. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem
   LIMITS C4 §6.5).
9. Rủi ro mất dữ liệu khi VM restart xóa /tmp: lần 1 mất toàn bộ
   WAV + log (chỉ còn số trong log đã in). Đã giảm nhẹ bằng backup
   số đo vào hidden_files ở lần 2 — nhưng WAV lần 1 vẫn mất vĩnh
   viễn; các lần đo sau nên backup ngay trong lúc đo (driver lần 2
   đã làm mẫu).
