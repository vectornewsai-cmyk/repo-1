# Phase 9 — Đợt 53, luồng J7: TTS transfer theo text + đường cong Trúc Ly + fallback WAV (nợ ROUND52 §4.1 — ĐÃ ĐÓNG 3/3)

Ngày: 07/11/2026 (giờ +07, lượt cron 03:35). KHÔNG push, KHÔNG tag/release,
KHÔNG binary vào batch (WAV đo ở `/tmp/tts53j7/` + bản copy
`hidden_files/tts53j7/wav/` — ngoài repo; chỉ số đo + code text vào repo).
Chỉ sửa file text trong `~/workspace/repo-1` trong phạm vi TTS (nút φ H1 +
mẫu transfer M5 + test của chúng + LIMITS này). Không sửa memory (quy ước:
mâu thuẫn 1,5–2,5× trong memory không sửa ở đây).

## 0. Bối cảnh (đọc từ LIMITS đợt 52 §4.1 + LIMITS I1 §8)

Ba nợ mở giao cho luồng này, cả ba đều từ LIMITS I1 §8:

1. **Transfer theo text 1,172 (nợ F3 §8.3)** — chưa đo text medium thứ hai
   cho giọng chậm; transfer Hải Đăng 1,1721 (F3 §4.5: M4 gộp 19,1174 /
   medium-khác gộp 16,3110 trên text T2/T4/T5 của D1) vượt nhẹ biên 1,17
   của khoảng theo giọng, biên dư đã hết.
2. **Điểm giữa đường cong Q14/Trúc Ly (chỉ 5 điểm)** — Trúc Ly chỉ có
   5 điểm đường cong (0 / Q07 / Q09 / M3 / Q14), 3 giọng kia có đủ 8 điểm.
3. **Fallback ghi WAV sang đĩa persistent chưa từng kích hoạt thật** —
   đợt 52 vá driver (retry 1 lần + fallback đĩa) sau 2 lần ghi WAV lỗi
   thoáng qua, nhưng sau vá không còn lỗi nào nên chưa biết fallback có
   chạy thật không; nguyên nhân gốc 2 lần lỗi chưa rõ (không quyền đọc
   dmesg).

## 1. Việc luồng này làm

1. Đo transfer M5: text medium thứ hai = M5 của C4 (190 ký tự, 0 chữ số,
   dấu câu dày — khác hẳn T2/T4/T5 ít số của D1), n = 2 cho 3 giọng chậm
   nhất bảng H2 (Đức Trí 12,14 / Kim Thanh 12,52 / Thiền Tâm Đức 12,80
   ký tự/giây normal) + Hải Đăng (đối chiếu trực tiếp với 1,1721).
2. Đo P10/P13/P16 của F3 cho Trúc Ly — cô nay đủ 8 điểm đường cong;
   tính lại φ gộp tại 3 nút P trên 4 giọng (trước đây chỉ 3 giọng) và
   cập nhật nút φ trong `ttsEstimate51H1.ts` + test.
3. Ép fallback ghi WAV kích hoạt thật: mẫu J7-FB có đường ghi /tmp bị phá
   trước (tạo thư mục đúng tên file đích) để cả `sf.write` lẫn wave đều
   lỗi, ép driver đi qua nhánh retry rồi fallback sang đĩa persistent.
4. Thêm dual-write WAV: sau mỗi lần ghi WAV /tmp thành công, driver copy
   NGAY sang `hidden_files/tts53j7/wav/` — bài học đợt 52 (11 WAV mất
   theo /tmp khi VM restart). Cả 12 WAV J7 đều còn trên đĩa persistent.
5. Tính lại pool H2 + quyết định KHÔNG gộp 8 mẫu M5 vào bảng H2 (xem §5,
   ghi rõ lý do). Cập nhật test H1/H2, chạy hồi quy + tsc + vite build.
6. Viết LIMITS này (chính tài liệu này).

## 2. Số đo thật mới (ĐO XONG — 12 mẫu, 1 lần chạy driver duy nhất, resume không cần dùng)

Driver: `hidden_files/tts53j7/drive53j7.py` (bản drive52i1.py + copy WAV
về đĩa ngay + mẫu ép fallback). Nạp model 9,2 s; warmup 3,3 s (câu "Chào
bạn!", Hải Đăng). Chạy với `nice -n 10`. KHÔNG có VM restart, KHÔNG có
SIGKILL, KHÔNG có lỗi ghi WAV nào ngoài mẫu ép fallback (xem §6). Máy yên
suốt lượt (load ~1, không còn 8–10 luồng khác tranh CPU như đợt 51/52) —
synth nhanh nhất từ trước tới nay (xem §4).

Mỗi dòng kết quả ghi ĐỒNG THỜI vào `/tmp/tts53j7/results.jsonl` và bản sao
`hidden_files/tts53j7/results.jsonl` NGAY trong lúc đo (flush + fsync).
WAV ở `/tmp/tts53j7/` (12 file) + bản copy `hidden_files/tts53j7/wav/`
(12 file — kiểm chứng đủ, xem §6).

### 2.1 Transfer M5 (8 mẫu, n = 2 mỗi giọng)

| Giọng | M5 lần 1 (s) | M5 lần 2 (s) | Spread | v_M5 gộp (ký tự/s) | v_M4-only gộp | Transfer M4/M5 |
| --- | --- | --- | --- | --- | --- | --- |
| Đức Trí | 14,00 | 14,48 | 3,4% | 13,3427 | 12,1408 | **0,9099** |
| Kim Thanh | 15,04 | 15,52 | 3,1% | 12,4346 | 12,5247 | **1,0072** |
| Thiền Tâm Đức | 13,28 | 13,44 | 1,2% | 14,2216 | 12,8030 | **0,9003** |
| Hải Đăng | 10,16 | 9,28 | 9,1% | 19,5473 | 19,0315 | **0,9736** |

(v_M4-only tính lại từ pool H2 bằng `compute53j7-pool.ts` — cùng logic pool
của compute52i1.ts, chỉ lọc text M4; pool tính lại khớp bảng H2 tới 4 chữ
số thập phân ở cả 4 giọng. Lưu ý: v_M4-only của Thiền Tâm Đức tính lại là
12,8030, bảng H2 ghi f = 0,7966 → 12,8019 — chênh 0,0011 do làm tròn f
trong bảng, không đáng kể. v_M4-only Hải Đăng thời H2 là 19,0315; F3 ghi
19,1174 vì pool M4 lúc đó chưa có mẫu H2 — chênh 0,45%.)

**Kết luận transfer — NỢ F3 §8.3 ĐÃ ĐÓNG (đáp án: transfer phụ thuộc text,
không phải hằng số giọng):**

- Transfer M5: **0,90–1,01, mean ~0,95** — KHÔNG phải 1,172. Text M5
  (0 chữ số, dấu câu dày) đọc nhanh bằng hoặc hơn M4 ở cả 4 giọng (3/4
  giọng transfer < 1, tức M5 nhanh hơn M4).
- Hải Đăng trên M5: **0,9736** so với 1,1721 trên text T2/T4/T5 — chênh
  **−16,9%**. Cùng một giọng, đổi text medium là transfer đổi hẳn.
  Transfer 1,172 là đặc tính của text chứa chữ số, không phải của "text
  medium" nói chung.
- Phù hợp mô hình đường cong H1: tốc độ phụ thuộc tỉ lệ chữ số. M5 có tỉ
  lệ chữ số 0% nên đọc nhanh như text thường là đúng mô hình; M5 nhanh
  hơn M4 một chút (transfer 0,90–0,91 ở Đức Trí/Thiền Tâm Đức) có thể do
  M4 nhiều tên riêng (Nguyễn Văn An, Hà Nội, Đà Lạt, Sa Pa, Phú Quốc,
  Trần Thu Hà, Hồ Chí Minh) — chỉ là giả thiết, chưa chứng minh.
- Hệ quả cho khoảng h = 0,17: biên dư cho transfer đã hết chỉ đúng với
  text có chữ số. Với text 0 chữ số, transfer ~0,90–1,01 nằm gọn trong
  khoảng — không cần nới h lên 0,18 (chưa có mẫu nào rơi ngoài khoảng).
- Spread lặp M5: 1,2–3,4% ở 3 giọng chậm; Hải Đăng 9,1% (10,16/9,28 s)
  — lớn nhưng trong spread M4 11,3% đã biết của anh (neo A2 8,40 s),
  không phải lỗi đo.

### 2.2 Đường cong Trúc Ly: đủ 8 điểm (3 mẫu mới)

| Tỉ lệ | Text | Trúc Ly (s) | Tốc độ (ký tự/s) | φ (tốc độ F3) | φ (tốc độ H2) |
| --- | --- | --- | --- | --- | --- |
| 0% | M4 (gộp) | — | 19,56 | 0 | 0 |
| 6,98% | Q07 (H1) | 11,28 | 15,25 | 0,671* | — |
| 9,83% | Q09 (H1) | 12,40 | 13,95 | 0,809* | — |
| 10,22% | **P10 (J7)** | **14,04** | **13,25** | **0,975** | 0,920 |
| 12,43% | **P13 (J7)** | **12,89** | **13,11** | **0,997** | 0,940 |
| 13,48% | M3 (gộp) | — | 13,09 | 1 | 1 |
| 14,29% | Q14 (H1) | 13,75 | 12,22 | 1,054* | — |
| 15,96% | **P16 (J7)** | **15,62** | **12,04** | **1,163** | 1,101 |

(* φ tại Q07/Q09/Q14 là nút khóa H1 cũ — mean 4 giọng, không phải φ riêng
Trúc Ly. φ Trúc Ly riêng tại Q07/Q09/Q14: xem LIMITS H1 §4.)

- **Đơn điệu giảm nghiêm ngặt 8 điểm: ĐÚNG** (19,56 > 15,25 > 13,95 >
  13,25 > 13,11 > 13,09 > 12,22 > 12,04). Trúc Ly nay có chuỗi đầy đủ
  M4 > Q07 > Q09 > P10 > P13 > M3 > Q14 > P16 như 3 giọng kia (test H1
  §5 khóa chuỗi này).
- **Lưu ý biên mỏng:** tốc độ P13 của cô (13,11) chỉ nhỉnh hơn tốc độ
  dense (13,09) 0,02 ký tự/giây — φ(P13) ≈ 0,997, gần chạm dense. Đây là
  số thật, không phải lỗi làm tròn (13,11 − 13,09 = 0,02 > 0); test khóa
  chuỗi đơn điệu vẫn pass nhưng biên này mỏng — đợt sau đo lặp P13 cho
  cô để xác nhận thứ tự P13 > M3 có ổn định không.
- **Nút φ gộp mới (mean 4 giọng, tốc độ F3 — cập nhật vào lib H1):**

  | Nút | φ khóa cũ (mean 3 giọng) | φ mới (mean 4 giọng) | Chênh | φ từng giọng [KT, DT, QA, TL] | Lệch max so với mean |
  | --- | --- | --- | --- | --- | --- |
  | P10 10,22% | 0,854 | **0,884** | +0,030 | [0,841, 0,836, 0,884, 0,975] | 0,091 |
  | P13 12,43% | 0,958 | **0,968** | +0,010 | [0,928, 0,974, 0,972, 0,996] | 0,040 |
  | P16 15,96% | 1,160 | **1,161** | +0,001 | [1,145, 1,188, 1,146, 1,163] | 0,027 |

  P10 dịch nhiều nhất (+0,030) vì φ Trúc Ly tại P10 (0,975) cao hẳn 3
  giọng kia (0,84–0,88). Lệch max 0,091 vẫn trong dải 0,04–0,12 mà H1
  dùng để khóa φ chung — quyết định φ chung vẫn đứng. Ảnh hưởng thực tế
  nhỏ: Δφ = 0,03 đổi tốc độ dự báo ~0,2 ký tự/giây (~1,5%), nằm gọn
  trong khoảng h = 0,17.
- φ tính bằng tốc độ H2 (bảng hiện hành) thấp hơn hẳn tốc độ F3 tại cùng
  nút (P10 0,920 vs 0,975; P16 1,101 vs 1,163) vì bảng H2 dịch normal/
  dense của Trúc Ly (normal 19,56 → 19,38; dense 13,09 → 12,71). Nút
  khóa H1 giữ cơ sở tốc độ F3 (helper H1 mặc định dùng bảng F3) cho nhất
  quán với compute51h1.py — ghi rõ độ nhạy này ở đây, không giấu.

### 2.3 Fallback ghi WAV sang đĩa — ĐÃ KÍCH HOẠT THẬT (xem §6)

Mẫu J7-FB (Hải Đăng, text ngắn 29 ký tự "Chào bạn, đây là VCut Studio."):
đường ghi /tmp bị phá trước bằng cách tạo thư mục đúng tên file đích
(`/tmp/tts53j7/J7-FB.wav`). Diễn biến thật (log driver):

1. `sf.write` ném `LibsndfileError: Error opening ... System error.`
   → fallback wave module.
2. `wave.open` ném `[Errno 21] Is a directory` → lan ra `main()`.
3. Retry sau 2 s: vẫn `Is a directory` → nhánh fallback sang đĩa.
4. **Fallback ghi thành công** vào
   `hidden_files/tts53j7/wav/J7-FB.wav` — ffprobe 1,840 s khớp header
   1,84 s từng mili-giây, PCM s16le mono 48 kHz, 176.684 byte (= 44 header
   + 88.320 frame × 2 byte) — WAV đầy đủ, không cụt.
5. Dòng kết quả ghi `fallbackUsed: true`, `out` trỏ đúng file backup.

Như vậy nhánh fallback vá ở đợt 52 nay đã chứng minh chạy thật end-to-end
(trước đây chỉ là code chưa từng chạy). Nợ I1 §8.3 ĐÃ ĐÓNG.

## 3. Cập nhật hệ số + test (ĐO XONG)

### 3.1 Nút φ H1 — ĐÃ CẬP NHẬT (3 nút P)

- `ttsEstimate51H1.ts`: nút P10 0,854 → **0,884**, P13 0,958 → **0,968**,
  P16 1,160 → **1,161**; thêm 3 mẫu J7-P10/P13/P16-TL vào
  `TTS_SAMPLES_51H1` (nay 16 mẫu; `textId` mở rộng thêm P10/P13/P16,
  `source` thêm "J7"); cập nhật header (φ node list, chuỗi đơn điệu đủ
  8 điểm cả 4 giọng, ghi chú J7).
- `ttsEstimate51H1.test.ts`: đếm mẫu 13 → 16; chuỗi đơn điệu đầy đủ cho
  Trúc Ly (dùng mẫu J7); khóa 3 nút mới (P10 ≈ 0,884, P13 ≈ 0,968,
  P16 ≈ 1,161, dung sai ±0,005). Test §5 tự động kiểm tra 3 mẫu mới nằm
  trong khoảng đường cong (tâm dự báo P10 13,44 s / P13 12,71 s / P16
  15,60 s; số thật 14,04 / 12,89 / 15,62 — P16 gần như khớp tuyệt đối).

### 3.2 Transfer M5 — KHÓA TRONG TEST H2 (bảng hệ số H2 KHÔNG ĐỔI)

- `ttsEstimate51H2.ts`: thêm text M5 (`TTS_STANDARD_TEXT_M5_53J7`,
  190 ký tự) + 8 mẫu (`TTS_SAMPLES_M5_53J7`) + tốc độ tổng hợp J7
  (`TTS_SYNTH_SPEED_53J7`, 12 entry) + ghi chú TRANSFER M5 (số transfer
  + lý do không gộp vào bảng).
- `ttsEstimate51H2.test.ts`: thêm §9 — tính lại transfer từ pool M4-only
  + mẫu M5, khóa 4 giá trị (0,9099 / 1,0072 / 0,9003 / 0,9736, dung sai
  ±0,002); khóa transfer M5 của Hải Đăng khác rõ 1,1721 (chênh > 0,15);
  khóa lặp M5 spread ≤ 10%; khóa 8 mẫu M5 KHÔNG vào pool H2 (normalN
  giữ nguyên — test §3 vẫn tính lại khớp bảng).

### 3.3 Quyết định KHÔNG gộp M5 vào bảng H2 (trung thực, có số)

Cộng 2 mẫu M5 vào pool normal (theo đúng định nghĩa bảng H2: normal =
gộp mọi text medium) sẽ dịch hệ số normal: Đức Trí **+4,01%**, Thiền Tâm
Đức **+4,46%**, Hải Đăng **+1,89%**, Kim Thanh −0,31% (tính bằng
`compute53j7-pool.ts`; mọi mẫu vẫn trong h = 0,17, lệch max 12,6%).
Không gộp vì:

1. Transfer §2.1 chứng minh M5 và M4 không hoán đổi được (M5 nhanh hơn
   M4 ~10% ở Đức Trí/Thiền Tâm Đức) — gộp vào sẽ dịch hệ số không phải
   vì giọng thay đổi mà vì thành phần blend đổi.
2. Đức Trí và Thiền Tâm Đức sẽ vượt ngưỡng trôi 5% so với F3 (hiện
   +1,44% / +1,21%) và tạo thêm ngoại lệ giả — trong khi test H2 khóa
   đúng 1 ngoại lệ có ghi chú (Thùy Dung +7,01%).
3. Tiền lệ pool đã có C4-M5 (Thái Sơn, 1 mẫu) và T-texts (Hải Đăng) là
   dữ liệu lịch sử; 8 mẫu M5 của J7 là mẫu thăm dò transfer, vai trò
   của chúng là khóa transfer, không phải hiệu chuẩn lại hệ số.

Nếu đợt sau quyết định đổi định nghĩa pool (chỉ M4 thuần, hoặc tách hệ số
theo loại text), đó là quyết định thiết kế riêng — không làm lén trong
luồng đo này.

## 4. Tốc độ tổng hợp (ĐO XONG — 12 lần đo, số thật)

- Tỉ lệ audio/synth **0,33–0,60×, median 0,51×, tổng synth 312,3 s**
  (nạp model 9,2 s + warmup 3,3 s không tính vào mẫu). Đều < 1× realtime
  — vẫn mâu thuẫn "~1,5–2,5×" trong memory; không sửa memory theo quy ước.
- Nhanh nhất từ trước tới nay (F3 median 0,44×; H1 ~0,10×; H2 0,12×) vì
  máy yên suốt lượt (load ~1, chỉ 1 driver TTS, không còn 8–10 luồng
  khác tranh CPU). Chậm nhất: J7-FB 0,33× (text ngắn 1,84 s — tỉ lệ thấp
  một phần do overhead chia chunk cố định); nhanh nhất: J7-T03 Kim Thanh
  M5 0,60×.
- Từng mẫu: FB 1,84 s / 5,6 s (0,33×); T01 14,00/38,8 (0,36×); T02
  14,48/28,3 (0,51×); T03 15,04/25,0 (0,60×); T04 15,52/30,8 (0,50×);
  T05 13,28/24,8 (0,54×); T06 13,44/23,8 (0,56×); T07 10,16/18,1 (0,56×);
  T08 9,28/16,6 (0,56×); P10 14,04/29,5 (0,48×); P13 12,89/27,8 (0,46×);
  P16 15,62/43,2 (0,36×).

## 5. Sự cố trong lượt (trung thực, không giấu)

1. **Không có VM restart, không có SIGKILL** trong lượt này (khác đợt
   51/52). Driver chạy 1 lần duy nhất từ đầu tới cuối (~7 phút từ lúc
   nạp model tới mẫu cuối), không cần resume.
2. **Không có lỗi ghi WAV thoáng qua nào** ngoài mẫu ép fallback J7-FB
   (cố ý phá). Sau khi fallback kích hoạt, 11 mẫu còn lại ghi /tmp bình
   thường + copy về đĩa ngay, 0 lỗi.
3. **Nhiễu `Wave_write.__del__` trong log** khi wave.open lỗi trên đường
   đã phá: `Exception ignored in: <function Wave_write.__del__>` +
   `AttributeError: 'Wave_write' object has no attribute '_file'` (2 lần,
   ở lần ghi đầu và lần retry). Đây là nhiễu vô hại của module wave khi
   `open()` lỗi giữa chừng để lại object nửa khởi tạo — exception gốc
   (`Is a directory`) vẫn lan đúng ra `main()` và fallback chạy đúng.
   Không phải lỗi driver; ghi lại để đợt sau khỏi tưởng driver crash.
4. **tsc lần 1 báo 1 lỗi ở file của luồng khác** (`seekSeekable53J6.test.ts`
   của luồng J6, lỗi TS5097 import `.ts`) — không phải file J7; chạy lại
   tsc lần 2 thì 0 lỗi (luồng J6 đã sửa xong file đó trong lúc J7 chạy).
   Ghi rõ để parent khỏi tưởng J7 làm hỏng tsc.
5. **1 flag verify:** J7-T01 trail silence 0,4 s (vượt ngưỡng 0,3 s) —
   xem §6. Không phải lỗi đo (ffprobe khớp header từng mili-giây).

## 6. Verify WAV (verify53j7.py — ĐO XONG)

- **12/12 WAV khớp ffprobe từng mili-giây** (header vs ffprobe, sai số
  < 0,005 s). Cả 12 WAV còn trên đĩa persistent (`hidden_files/tts53j7/
  wav/`) — không mất file nào (khác đợt 51/52 mất 48 WAV theo /tmp).
- Lead silence 0,0–0,1 s; trail silence 0,0–0,4 s; gap trong dài nhất
  0,7 s. **1 flag:** J7-T01 trail 0,4 s — text M5 có "..." (dấu ba chấm)
  gây khoảng lặng cuối tự nhiên; gap trong 0,5–0,7 s ở nhiều mẫu M5
  cũng từ dấu câu dày của M5, không phải lỗi đọc. Độ dài đo là thời gian
  đọc thật từ header nên flag im lặng không làm sai số đo (cùng phương
  pháp với H1, nơi 7 mẫu trail 0,31–0,35 s cũng đã ghi nhận tương tự).
- Mẫu fallback J7-FB verify riêng: file backup 176.684 byte, ffprobe
  1,840 s = header 1,84 s, PCM s16le mono 48 kHz, lead/trail 0,1 s —
  đầy đủ, không cụt (xem §2.3 bước 4).
- Log verify: `hidden_files/tts53j7/verify53j7.log` (chạy lại từ
  results.jsonl backup; file /tmp vẫn còn nguyên nên verify đọc cả hai
  đường — out trỏ /tmp với 11 mẫu thường, backup disk với J7-FB).

## 7. Kiểm chứng (số thật)

- Test mới/cập nhật: H1 **11/11** (ESM bundle — gồm chuỗi đơn điệu đủ 8
  điểm Trúc Ly + 3 nút φ mới khóa đúng), H2 **12/12** (CJS bundle — 10
  cũ + 2 mới: transfer M5 + synth J7).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle CJS):
  `ttsEstimate50F3.test.ts` **15/15**, `ttsEstimate47C4.test.ts`
  **10/10**, `ttsEstimate48D1.test.ts` **12/12**,
  `ttsEstimate49E1.test.ts` **13/13** — fail 0.
- `tsc --noEmit` trong `apps/web`: **0 lỗi** (lần chạy 2; lần 1 có 1 lỗi
  thoáng qua ở file luồng J6, xem §5.4).
- `vite build` (từ `apps/web`): **pass** (built in 18,27 s; chỉ cảnh báo
  chunk > 500 kB có sẵn, không liên quan luồng này).
- KHÔNG chạy lại ở lượt này: mọi phép đo browser headed/FPS, click-test
  headed, Safari/máy thật.

## 8. Nợ mở còn lại (sau luồng này)

1. **Transfer mới đo trên 1 text thứ hai (M5) cho 4 giọng** — F3 §8.3
   coi như đóng ở mức "biết transfer phụ thuộc text", nhưng chưa đo
   text medium thứ ba (vd text số-dày kiểu P16, hoặc text dài) cho các
   giọng chậm để xem transfer trên text có chữ số có ổn định ở ~1,17
   hay cũng dao động theo text; 21 giọng còn lại chưa đo transfer.
2. **Thứ tự P13 > M3 của Trúc Ly biên mỏng (0,02 ký tự/giây)** — cần đo
   lặp P13 (và M3) cho cô để xác nhận thứ tự có ổn định không; nếu đảo
   thì chuỗi đơn điệu 8 điểm của cô cần xem lại (φ(P13) ≈ 1 có thể
   thực chất là 1,00–1,01).
3. **Nguyên nhân gốc lỗi ghi WAV thoáng qua đợt 52 vẫn chưa rõ** (không
   quyền đọc dmesg) — nay fallback đã chứng minh chạy thật nên rủi ro
   đã giảm, nhưng nếu lỗi lặp lại thì nên điều tra sâu hơn (ghi thẳng
   sang đĩa persistent thay vì /tmp).
4. **M5 nhanh hơn M4 ~10% ở giọng chậm — cơ chế chưa chứng minh** (giả
   thiết tên riêng làm chậm M4, chưa có mẫu đối chứng: cần text 0 chữ
   số không tên riêng để tách giả thiết).
5. **φ tính bằng tốc độ H2 thấp hơn hẳn tốc độ F3** (P10 0,920 vs 0,975)
   — nút khóa H1 giữ cơ sở F3; khi helper chuyển sang bảng H2 thì nút φ
   cần tính lại trên cơ sở H2 (đợt parent gộp bảng H2 vào helper).
6. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem LIMITS
   C4 §6.5). Tốc độ tổng hợp vẫn < 1× realtime trên VM này (median
   0,51× đợt này — nhanh nhất từ trước tới nay nhưng vẫn < 1×).

## 9. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Đổi:
1. `apps/web/src/lib/ttsEstimate51H1.ts` — nút φ P10/P13/P16 cập nhật
   (0,884 / 0,968 / 1,161) + 3 mẫu J7-P10/P13/P16-TL + header cập nhật.
2. `apps/web/src/lib/ttsEstimate51H1.test.ts` — đếm mẫu 13 → 16, chuỗi
   đơn điệu đủ 8 điểm Trúc Ly, khóa 3 nút φ mới. 11/11.
3. `apps/web/src/lib/ttsEstimate51H2.ts` — text M5 + 8 mẫu M5 + tốc độ
   tổng hợp J7 (12 entry) + ghi chú TRANSFER M5 (số transfer + lý do
   không gộp vào bảng). Bảng hệ số H2 KHÔNG đổi.
4. `apps/web/src/lib/ttsEstimate51H2.test.ts` — §9 mới: transfer M5 +
   synth J7. 12/12.

Mới:
1. `docs/PHASE9_ROUND53_J7_TTS_TRANSFER_LIMITS.md` — chính tài liệu này.

Không đổi: `ttsEstimate50F3.ts` (giữ nguyên số F3 — bản ghi lịch sử,
transfer 1,1721 vẫn khóa ở test F3 §5), `ttsEstimate51H2.ts` bảng hệ số,
`ttsEstimate49E1.ts`, `ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`,
`TtsButton.tsx`, mọi file test khác, bridge, mọi file luồng khác đợt 53.

File đo + script (ngoài repo, không stage — trong
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts53j7/`):
`drive53j7.py` (driver — resume + retry + fallback đĩa + copy WAV về
đĩa ngay + mẫu ép fallback), `drive53j7.stdout.log` (log stdout lần chạy
duy nhất), `drive53j7.log`, `results.jsonl` (12 mẫu + 1 meta, dual-write
với /tmp), `compute53j7.py` (transfer + φ Trúc Ly + φ gộp mới + synth),
`compute53j7-pool.ts` (+ bundle `/tmp/tts53j7.pool.mjs` — tính v_M4-only
và dịch hệ số nếu gộp M5), `verify53j7.py` (+ `verify53j7.log`), `wav/`
(12 WAV đã verify, ngoài repo, không stage).
Dữ liệu đo gốc vẫn ở `hidden_files/tts53j7/results.jsonl` — driver
resume đọc chính file này.
