# Phase 9 — Đợt 51, luồng H2: Đo lặp hệ số TTS cho các giọng n = 1 (nợ F3 §8.2)

Ngày: 06/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts51h2/`, ngoài repo; 8 WAV đầu đã mất theo
/tmp khi VM restart — chỉ còn số đo trong backup), KHÔNG stage bởi luồng
này (parent gộp). Chỉ sửa file text trong `~/workspace/repo-1`.

## 0. Bối cảnh (đọc từ LIMITS F3 §8.2)

- Nợ F3 §8.2: đa số hệ số mới có n = 1 (16 giọng normal n = 1, 18 giọng
  dense n = 1 trong bảng F3) — hệ số của giọng đó dựa trên ĐÚNG 1 lần
  đo; cần đo lặp thêm, ưu tiên Trúc Ly, Quốc Tuấn, Đức Trí, Kim Thanh.
- Kế hoạch đủ của luồng này: 83 mẫu (2 neo + 42 M3 + 39 M4) để MỌI
  giọng về n ≥ 3 cả hai chế độ. Luồng này đo được **37 mẫu** thì dừng
  (lý do ở §5) — 10/25 giọng nay đã n ≥ 3 cả hai chế độ, 15 giọng còn
  lại vẫn n < 3 ở ít nhất một chế độ (khóa đúng trạng thái trong test,
  không khai đã đóng nợ khi chưa đóng). 46 mẫu còn lại đo tiếp được
  bằng driver resume (xem §6).

## 1. Việc luồng này làm

1. Đo lặp M3/M4 cho 4 giọng ưu tiên (Trúc Ly, Quốc Tuấn, Đức Trí,
   Kim Thanh) tới n ≥ 3 cả hai chế độ — 11 mẫu (gồm 2 neo).
2. Đo lặp cho 6 giọng N tiếp theo (Quang Sơn, Ngọc Trân, Mai Anh,
   Đoan Trang, Phạm Tuyên, Ngọc Linh) tới n ≥ 3 cả hai chế độ — 24 mẫu.
3. 2 neo kiểm chứng driver (Kim Thanh M3, Hải Đăng M4) trước khối chính.
4. Xây bảng hệ số H2 mới trong lib mới `ttsEstimate51H2.ts` (tính lại
   từ pool gộp C4/D1/E1/F3 + H2, KHÔNG sửa file F3/E1, KHÔNG sửa helper
   hay TtsButton — luồng H1 sở hữu, parent gộp bảng H2 vào helper sau).
5. Viết test mới `ttsEstimate51H2.test.ts` (10/10) + chạy hồi quy
   C4/D1/B3/A3/Z3/E1/F3 (xanh hết, xem §7).

## 2. Số đo thật mới (ĐO XONG — 37 mẫu trong 6 lần chạy driver, resume)

Driver: `/tmp/tts51h2/drive51h2.py` (viết theo mẫu F3, bản sao backup
ngay vào `hidden_files/tts51h2/drive51h2.py` TRƯỚC khi chạy; có thêm
resume — bỏ qua id đã đo — và thứ tự đo ưu tiên: neo → ưu tiên →
xen kẽ theo giọng → lấp n = 2). Nạp model mỗi lần chạy lại; warmup
infer ("Chào bạn!", Hải Đăng) mỗi lần chạy lại. Mỗi dòng kết quả ghi
ĐỒNG THỜI vào `/tmp/tts51h2/results.jsonl` và bản sao
`hidden_files/tts51h2/results.jsonl` NGAY trong lúc đo (flush + fsync).
WAV ở `/tmp/tts51h2/` (29 file còn lại sau restart; 8 file đầu mất
theo /tmp — xem §5).

Nạp model 6 lần chạy: 27,4 / 47,1 / 42,6 / 22,1 / 56,1 / 60,6 s;
warmup: 7,1 / 10,1 / 9,7 / 3,4 / 15,4 / 12,2 s. Thời gian nạp model
KHÔNG tính vào độ dài audio. Driver nạp model MỘT lần mỗi lần chạy
rồi gọi `infer` cho từng mẫu qua đúng đường code của `tts.py`
(`split_text_chunks` + `infer(..., apply_watermark=False)` +
`concat_with_crossfade`).

### 2.1 Neo kiểm chứng driver (2 mẫu)

| Mẫu | Giọng | Text | H2 | Đối chiếu | Kết luận |
| --- | --- | --- | --- | --- | --- |
| H2-A1 | Kim Thanh | M3 | 22,28 s | F3 22,53; E1 22,92/23,03/23,00 | lệch ≤ 3,3% ✓ |
| H2-A2 | Hải Đăng | M4 | 9,04 s | F3 8,40; E1 8,64/9,28/9,04 | trùng đúng 1 lần E1 ✓ |

A1 lệch tối đa 3,3% so với E1 (lớn hơn mức ≤ 2,2% của neo F3 nhưng
vẫn nhỏ, trong khoảng theo giọng) — pool M3 của Kim Thanh nay trải
22,28–23,03 s (spread 3,3%). A2 nằm trong spread M4 đã biết của Hải
Đăng (8,40–9,28 s). Driver đúng đường đo trước khi đo khối chính.

### 2.2 Mẫu lặp H2 theo giọng (35 mẫu — neo đã tính riêng ở §2.1)

| Giọng | M3 (s) | M4 (s) |
| --- | --- | --- |
| Trúc Ly | 14,08 / 14,33 | 8,72 / 8,80 |
| Quốc Tuấn | 14,77 / 14,97 | 9,28 / 9,04 |
| Đức Trí | 21,50 | 13,52 |
| Kim Thanh | — (chỉ neo A1) | 13,60 |
| Quang Sơn | 17,75 / 18,59 | 10,96 / 11,44 |
| Ngọc Trân | 18,37 / 18,84 | 11,52 / 11,20 |
| Mai Anh | 17,11 / 17,16 | 10,24 / 10,72 |
| Đoan Trang | 16,95 / 16,59 | 10,16 / 10,32 |
| Phạm Tuyên | 15,91 / 15,78 | 10,40 / 10,48 |
| Ngọc Linh | 15,51 / 16,31 | 9,84 / 9,92 |

Đối chiếu F3 (1 lần đo): Trúc Ly M3 13,60 / M4 8,64; Quốc Tuấn M3
14,60 / M4 8,96; Đức Trí M3 ~21,69 (tâm gộp) / M4 ~14,12 (tâm gộp);
Kim Thanh M4 ~13,44 (tâm gộp); Quang Sơn M3 18,73 / M4 11,60;
Ngọc Trân M3 19,60 / M4 11,12; Mai Anh M3 16,29 / M4 10,56;
Đoan Trang M3 17,81 (M4 chưa có ở F3 — nay đo lần đầu 10,16/10,32);
Phạm Tuyên M3 16,06 / M4 10,08; Ngọc Linh M3 15,99 / M4 9,84.
Mọi lần đo H2 đều gần F3 (lệch ≤ ~6%) — không có lần đo nào lạc hẳn.

Lặp cùng giọng+text (2 lần H2): spread lớn nhất 4,6% (Quang Sơn M3:
17,75/18,59) và 4,3% (Quang Sơn M4: 10,96/11,44); các giọng khác
≤ 3,1%. Lớn hơn mức ≤ 2,5% của 3 cặp lặp F3 nhưng vẫn nhỏ so với
khoảng theo giọng h = 0,17 — và Quang Sơn M3 là giọng chậm (audio
dài), phương sai tuyệt đối ~0,8 s là bình thường.

### 2.3 Verify WAV (verify51h2.py)

- 29/37 WAV còn trong /tmp: header WAV khớp ffprobe từng mili-giây
  cho cả 29 file; lead silence 0,0–0,1 s; trail silence 0,1–0,2 s
  (trừ 1 flag dưới); khoảng lặng trong dài nhất 0,7 s.
- 8 WAV đầu (A1/A2/V01–V05/W01) đã mất theo /tmp khi VM restart —
  chỉ còn số đo trong backup (số đo ghi từ header WAV ngay lúc ghi
  file, cùng đường code với 29 WAV đã verify; không đo lại 8 mẫu này
  vì số đo đã khóa trong backup và khớp xu hướng pool).
- 1 flag duy nhất: H2-W05 (Đức Trí M4) trail 0,4 s (> ngưỡng 0,3 s
  của F3), gap trong dài nhất 0,7 s — giọng chậm có quãng nghỉ cuối
  câu, không phải đệm; độ dài vẫn là độ dài WAV thật như mọi mẫu khác.
  Không loại mẫu này khỏi pool (F3 cũng giữ mẫu có gap 1,0 s).

## 3. Bảng hệ số H2 (ĐO XONG — tính lại từ pool gộp)

Bảng hệ số H2 (`ttsEstimate51H2.ts`, tính lại từ pool mẫu trong test
§3 — tốc độ gộp = tổng ký tự / tổng giây trên mọi lần đo của giọng đó,
gồm cả lần lặp/neo + mẫu C4/D1/E1/F3 cũ; f = normal / 16,0714,
g = dense / 9,5388). Sắp xếp theo f tăng dần.

| Giọng | Normal (ký tự/giây) | n | f | Dense (ký tự/giây) | n | g | Tỉ lệ d/n |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Đức Trí | 12,1408 | 3 | 0,7554 | 8,2306 | 3 | 0,8629 | 0,678 |
| Kim Thanh | 12,5247 | 3 | 0,7793 | 7,8235 | 5 | 0,8202 | 0,625 |
| Thiền Tâm Đức | 12,6497 | 2 | 0,7871 | 8,3353 | 2 | 0,8738 | 0,659 |
| Minh Đức | 13,4984 | 2 | 0,8399 | 8,9045 | 1 | 0,9335 | 0,660 |
| Mỹ Duyên | 13,5092 | 8 | 0,8406 | 8,7685 | 2 | 0,9192 | 0,649 |
| Quang Sơn | 14,9118 | 3 | 0,9278 | 9,6967 | 3 | 1,0166 | 0,650 |
| Ngọc Trân | 14,9823 | 3 | 0,9322 | 9,3998 | 3 | 0,9854 | 0,627 |
| Thục Đoan | 15,6481 | 1 | 0,9737 | 10,1165 | 2 | 1,0606 | 0,647 |
| Adam bựa | 15,7063 | 2 | 0,9773 | 10,7650 | 2 | 1,1286 | 0,685 |
| Thái Sơn | 16,0268 | 2 | 0,9972 | 9,8180 | 1 | 1,0293 | 0,613 |
| Mai Anh | 16,0850 | 3 | 1,0008 | 10,5617 | 3 | 1,1072 | 0,657 |
| Phạm Tuyên | 16,3760 | 3 | 1,0190 | 11,1832 | 3 | 1,1724 | 0,683 |
| Đoan Trang | 16,4184 | 3 | 1,0216 | 10,3992 | 3 | 1,0902 | 0,633 |
| Quỳnh Anh | 16,4397 | 2 | 1,0229 | 10,3518 | 2 | 1,0852 | 0,630 |
| Ngọc Linh | 17,1284 | 3 | 1,0658 | 11,1692 | 3 | 1,1709 | 0,652 |
| Ngọc Huyền | 17,1748 | 1 | 1,0687 | 11,3665 | 1 | 1,1916 | 0,662 |
| Thiện Minh | 17,3156 | 1 | 1,0774 | 11,7182 | 1 | 1,2285 | 0,677 |
| Hải Đăng | 17,8391 | 8 | 1,1100 | 11,5509 | 1 | 1,2109 | 0,648 |
| Adam | 18,0556 | 1 | 1,1235 | 11,8037 | 1 | 1,2374 | 0,654 |
| Thùy Dung | 18,0556 | 1 | 1,1235 | 12,3013 | 1 | 1,2896 | 0,681 |
| Xuân Vĩnh | 18,3696 | 1 | 1,1430 | 11,0353 | 1 | 1,1569 | 0,601 |
| Minh Triết | 18,5307 | 1 | 1,1530 | 11,6645 | 1 | 1,2228 | 0,630 |
| Quốc Tuấn | 18,5850 | 3 | 1,1564 | 12,0433 | 3 | 1,2626 | 0,648 |
| Thanh Bình | 18,6947 | 1 | 1,1632 | 11,6721 | 1 | 1,2236 | 0,624 |
| Trúc Ly | 19,3807 | 3 | 1,2059 | 12,7113 | 3 | 1,3326 | 0,656 |

10 giọng đã n ≥ 3 cả hai chế độ: Trúc Ly, Quốc Tuấn, Đức Trí,
Kim Thanh, Quang Sơn, Ngọc Trân, Mai Anh, Đoan Trang, Phạm Tuyên,
Ngọc Linh. 15 giọng còn lại vẫn n < 3 ở ít nhất một chế độ (xem §6).

Độ trôi so với bảng F3: lớn nhất +4,05% (Đoan Trang dense: H2 đo
16,95/16,59 s so với F3 17,81 s — giọng này nhanh hơn ở lần đo lặp);
mọi giọng khác ≤ 3,50% (Trúc Ly dense −2,88%, Quang Sơn normal
+2,35%, Phạm Tuyên normal −2,32%). Giọng chưa có mẫu H2 mới thì hệ
số Y HỆT F3 (pool không đổi) — test §3 khóa từng hệ số tính lại từ pool.

Tỉ lệ dense/normal theo giọng: 0,6007–0,6854 (min Xuân Vĩnh, max
Adam bựa; F3: 0,598–0,686) — vẫn KHÔNG phải hằng số, hệ số dense
riêng bắt buộc. Khoảng theo giọng giữ h = 0,17: mọi mẫu M3/M4 đã đo
đều nằm trong khoảng của giọng đó; độ lệch lớn nhất so với tâm gộp
mới là 11,3% (Hải Đăng normal — neo F3-A2 8,40 s so với tâm gộp mới;
giữ từ F3).

## 4. Tốc độ tổng hợp (ĐO XONG — 37 lần đo, số thật)

- Infer thuần (driver, đã trừ nạp model, sau 1 lần warmup mỗi lần
  chạy): 37 lần đo, tỉ lệ audio/synth **0,02–0,25×, median 0,10×** —
  đều < 1× realtime. Chậm hơn hẳn F3 (0,17–0,75×, median 0,44×) vì
  H2 đo lúc máy tải nặng nhất: 8–10 luồng đợt 51 chạy song song +
  driver TTS của luồng H1 chạy cùng lúc + đóng gói AppImage
  (mksquashfs) của luồng khác; load average lên tới 16–18 trên VM
  4 vCPU. Chậm nhất: V23 Phạm Tuyên M3 — 694,2 s synth cho 15,91 s
  audio (0,02×). Nhanh nhất: A2 Hải Đăng M4 — 35,6 s synth cho 9,04 s
  audio (0,25×). Tổng thời gian synth 5978,3 s cho 37 mẫu (~100 phút
  synth thuần; cả lượt đo ~2 giờ gồm 6 lần nạp model + chờ).
- So sánh: con số "~1,5–2,5× realtime" trong memory vẫn SAI HẲN so
  với đo thật trên VM này (không lần nào vượt 0,25× ở lượt này).
  KHÔNG sửa memory (theo quy ước các luồng trước); chỉ báo số thật
  ở đây. Tốc độ tổng hợp không ảnh hưởng độ dài WAV hay toast (chỉ
  ảnh hưởng thời gian chờ khi bấm TTS).

## 5. Vì sao chỉ đo được 37/83 mẫu (trung thực, không giấu)

1. **VM restart 1 lần giữa lượt** (~12:05 UTC, uptime reset về 1
   phút): /tmp bị xóa hoàn toàn — mất 8 WAV đầu (chỉ còn số đo trong
   backup), mất ~10 phút + 1 mẫu đang tổng hợp dở (W02, đo lại sau
   bằng resume). Cơ chế dual-write backup đã cứu toàn bộ số đo.
2. **Driver bị SIGKILL 2 lần** (exit 137, không traceback, không dòng
   exit): lần 1 sau W06 (đang tổng hợp V10), lần 2 sau W20 (đang
   tổng hợp V21). Không xác nhận được qua dmesg/syslog (không có
   quyền đọc); nghi OOM-kill — lúc đó driver H1 chiếm ~4,1 GB RSS
   (50% RAM 7,9 GB) + driver H2 ~2,6 GB + mksquashfs/electron-builder
   của luồng khác; load average 16–18. Luồng này KHÔNG chỉnh
   oom_score_adj để giành RAM với luồng khác (sẽ đẩy OOM sang
   driver H1 hoặc tiến trình hệ thống — không phải quyết định của
   luồng này).
3. **Synth cực chậm vì máy tải nặng** (xem §4): trung bình ~162 s
   synth/mẫu (median 0,10×), mẫu M3 chậm tới 694 s. 83 mẫu cần ~3,5
   giờ ở tốc độ này — vượt khung lượt 3 giờ của vòng lặp. Luồng này
   dừng driver lúc 20:45 (+07) để còn thời gian chốt sổ (tính hệ số,
   viết lib/test, chạy hồi quy, viết LIMITS) thay vì đo tiếp tới
   sát giờ rồi không kịp kiểm chứng.
4. **Thứ tự đo đã cứu phần quan trọng nhất**: driver chạy theo thứ
   tự ưu tiên (neo → 4 giọng ưu tiên → xen kẽ theo giọng) nên khi
   dừng, 4 giọng ưu tiên + 6 giọng N đã hoàn tất n ≥ 3 cả hai chế độ.
   Nếu chạy theo thứ tự cũ (hết M3 rồi mới M4) thì lúc dừng sẽ dở
   dang cả loạt ở chế độ normal.

## 6. Nợ mở còn lại (sau luồng này)

1. **46 mẫu còn lại của kế hoạch 83** (đo tiếp bằng driver resume —
   `drive51h2.py` đã backup ở `hidden_files/tts51h2/`, chạy lại đúng
   lệnh trong file là tự bỏ qua 37 mẫu đã đo):
   - Ngọc Huyền: M3×2, M4×2 (V25/V26/W24/W25) — đang dở: V25 đang
     tổng hợp thì driver dừng, chưa có mẫu H2 nào.
   - Thiện Minh: M3×2, M4×2 (V29/V30/W28/W29).
   - Adam: M3×2, M4×2 (V33/V34/W30/W31).
   - Thùy Dung: M3×2, M4×2 (V35/V36/W32/W33).
   - Xuân Vĩnh: M3×2, M4×2 (V37/V38/W34/W35).
   - Minh Triết: M3×2, M4×2 (V39/V40/W36/W37).
   - Thanh Bình: M3×2, M4×2 (V41/V42/W38/W39).
   - Thái Sơn: M3×2 (V18/V19); Hải Đăng: M3×2 (V31/V32);
     Minh Đức: M3×2 (V07/V08); Thục Đoan: M4×2 (W13/W14).
   - Lấp n = 2 lên n = 3 (10 mẫu): Thiền Tâm Đức M3×1+M4×1
     (V06/W07), Minh Đức M4×1 (W08), Mỹ Duyên M3×1 (V09),
     Thục Đoan M3×1 (V14), Adam bựa M3×1+M4×1 (V15/W15),
     Thái Sơn M4×1 (W18), Quỳnh Anh M3×1+M4×1 (V22/W21).
   - 15 giọng còn n < 3 ở ít nhất một chế độ (khóa trong test §3):
     Thiền Tâm Đức 2/2, Minh Đức 2/1, Mỹ Duyên 8/2, Thục Đoan 1/2,
     Adam bựa 2/2, Thái Sơn 2/1, Quỳnh Anh 2/2, Hải Đăng 8/1,
     Ngọc Huyền 1/1, Thiện Minh 1/1, Adam 1/1, Thùy Dung 1/1,
     Xuân Vĩnh 1/1, Minh Triết 1/1, Thanh Bình 1/1 (normal/dense).
2. **Đo lặp khi máy yên sẽ cho synth nhanh hơn** (F3 median 0,44×
   so với H2 median 0,10×) — lượt sau nên đo lúc ít luồng song song,
   hoặc tách riêng khung giờ đo TTS khỏi các luồng đóng gói
   AppImage/đo TTS khác. Hai driver TTS cùng lúc trên VM 4 vCPU/8 GB
   là nguyên nhân chính của SIGKILL (OOM) và synth 0,02×.
3. **Neo A1 lệch 3,3% so với E1** (lớn hơn mức ≤ 2,2% của neo F3) —
   pool M3 Kim Thanh nay trải 22,28–23,03 s; vẫn trong khoảng theo
   giọng, không cần hành động, chỉ ghi nhận phương sai lặp thật.
4. **Quang Sơn M3 lặp lệch 4,6%** (17,75/18,59 s) — lớn nhất trong
   các cặp lặp H2; vẫn trong khoảng theo giọng. Nếu lượt sau đo thêm
   sẽ biết đây là phương sai giọng hay nhiễu do máy tải.
5. **Mô hình đường cong TTS theo giọng** (nợ F3 §8.1) vẫn mở — ngoài
   phạm vi luồng này (chỉ đo lặp hệ số).
6. **Transfer theo text 1,172** (nợ F3 §8.3) vẫn mở — chưa đo thêm
   text medium thứ hai cho giọng chậm.
7. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem
   LIMITS C4 §6.5).

## 7. Kiểm chứng (số thật)

- Test mới H2 **10/10** (`ttsEstimate51H2.test.ts` — text chuẩn,
  neo, tính lại bảng hệ số từ pool, 10 giọng đủ n ≥ 3 + 15 giọng còn
  nợ khóa đúng n, mọi mẫu trong khoảng h = 0,17, tỉ lệ dense/normal
  0,6007–0,6854, lặp ưu tiên ≤ 5%, tốc độ tổng hợp < 1×, calibrated).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate47C4.test.ts` **10/10**, `ttsEstimate48D1.test.ts`
  **12/12**, `ttsEstimate46B3.test.ts` **7/7**,
  `ttsEstimate45A3.test.ts` **10/10**, `ttsDuration44Z3.test.ts`
  **9/9**, `ttsEstimate49E1.test.ts` **13/13**,
  `ttsEstimate50F3.test.ts` **15/15** — fail 0. Chạy baseline trước
  khi sửa (cùng kết quả) + chạy lại sau khi thêm file H2.
- `tsc --noEmit` trong `apps/web`: chỉ còn 10 lỗi ở file test của
  luồng H1 (`ttsEstimate51H1.test.ts` — H1 đang làm dở, thiếu lib
  H1; KHÔNG phải file của luồng này, luồng này không chạm);
  **0 lỗi ở file H2** (lib typecheck sạch; test H2 đã thêm vào
  exclude của tsconfig theo mẫu F3).
- `vite build`: **pass** (built in 6,40 s; chỉ cảnh báo chunk
  >500 kB có sẵn, không liên quan luồng này).
- KHÔNG chạy lại ở lượt này: mọi phép đo browser headed/FPS,
  click-test headed, Safari/máy thật.

## 8. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:
1. `apps/web/src/lib/ttsEstimate51H2.ts` — bảng hệ số theo giọng
   tính lại (25/25 preset, normal + dense riêng, kèm n và spread) +
   37 mẫu đo H2 + tốc độ tổng hợp 37 lần đo. KHÔNG có helper.
2. `apps/web/src/lib/ttsEstimate51H2.test.ts` — test mới 10/10.
3. `docs/PHASE9_ROUND51_H2_TTS_COEFF_LIMITS.md` — chính tài liệu này.

Đổi:
1. `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới H2
   (file này cũng được các luồng H1/H5 đợt 51 sửa song song — luồng
   này chỉ append dòng của mình sau dòng của họ, không chạm dòng khác).

Không đổi: `ttsEstimate50F3.ts` (giữ nguyên số F3 — bản ghi lịch sử),
`ttsEstimate49E1.ts`, `ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`,
`ttsEstimate46B3.ts`, `ttsEstimate45A3.ts`, `ttsDuration44Z3.ts`,
`TtsButton.tsx` (vẫn nối helper F3 — H1 sở hữu), mọi file test
A3/C4/D1/B3/E1/F3/Z3/relink khác, bridge, mọi file luồng khác đợt 51
(H1/H5 đang chạy song song — luồng này không chạm file nào của họ).

File đo + script (ngoài repo, không stage — bản sao chống restart ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts51h2/`):
results.jsonl (37 mẫu + 6 meta, khớp byte-for-byte 2 nơi),
drive51h2.py (+ 6 log stdout), drive51h2.log, verify51h2.py,
verify51h2.final.log, gen_samples51h2.py, compute51h2.ts,
compute51h2.final.json, samples51h2.fragment.ts, lib51h2.head.ts,
assemble51h2.py, verify51h2.partial.log. (File trung gian
compute51h2.partial*.json chỉ nằm ở /tmp, không backup — chỉ là bản
nháp giữa chừng, bản final đã backup.)
WAV đo (`/tmp/tts51h2/*.wav`, 29 file còn lại) nằm ngoài repo,
không stage.
