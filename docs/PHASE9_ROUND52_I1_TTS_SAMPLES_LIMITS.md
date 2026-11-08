# Phase 9 — Đợt 52, luồng I1: Đo tiếp 46 mẫu TTS còn lại của kế hoạch H2 (nợ F3 §8.2 — ĐÃ ĐÓNG)

Ngày: 07/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts51h2/`, ngoài repo; 11 WAV đầu đợt 52 đã mất
theo /tmp khi VM restart — chỉ còn số đo trong backup), KHÔNG stage bởi
luồng này (parent gộp). Chỉ sửa file text trong `~/workspace/repo-1`
trong phạm vi TTS (bảng hệ số H2 + test của nó + LIMITS này).

## 0. Bối cảnh (đọc từ LIMITS H2 đợt 51 §6)

- Nợ F3 §8.2: kế hoạch đủ 83 mẫu (2 neo + 42 M3 + 39 M4) để MỌI giọng về
  n ≥ 3 cả hai chế độ; đợt 51 đo được 37 mẫu, còn 46 mẫu, 15 giọng còn
  n < 3 ở ít nhất một chế độ. Luồng này đo tiếp 46 mẫu còn lại bằng
  driver resume (`hidden_files/tts51h2/drive51h2.py` tự bỏ qua 37 mẫu
  đã đo) — **đo đủ 46/46, kế hoạch 83/83 HOÀN TẤT, 25/25 giọng nay đã
  n ≥ 3 cả hai chế độ. Nợ F3 §8.2 ĐÃ ĐÓNG.**
- Không làm thêm mục 3 của task (text medium thứ hai cho giọng chậm —
  nợ transfer 1.172, F3 §8.3 — và điểm giữa đường cong Q14/Trúc Ly):
  hết khung giờ sau khi đo đủ 46 mẫu + tính lại bảng + kiểm chứng
  (xem §8 — vẫn mở cho đợt sau, không mạo nhận đã làm).

## 1. Việc luồng này làm

1. Đo tiếp 46 mẫu còn lại của kế hoạch H2 bằng driver resume
   (4 lần chạy, xem §5): 25 M3 + 21 M4, đưa 15 giọng còn nợ về n ≥ 3.
2. Vá driver `drive51h2.py` giữa chừng sau 2 lần ghi WAV lỗi thoáng
   qua (retry 1 lần + fallback ghi sang đĩa persistent — xem §5.2;
   2 lần lỗi đều xảy ra TRƯỚC khi vá, sau vá không còn lỗi ghi nào).
3. Verify WAV đợt 52 bằng `verify51h2.py` (xem §6).
4. Tính lại bảng hệ số H2 từ pool gộp (compute51h2.ts → 83 mẫu) và
   ráp lại `ttsEstimate51H2.ts` (mẫu + tốc độ + bảng hệ số mới),
   cập nhật test `ttsEstimate51H2.test.ts` theo số mới, chạy hồi quy
   TTS đủ bộ + tsc + vite build (xem §7).
5. Viết LIMITS này (chính tài liệu này).

## 2. Số đo thật mới (ĐO XONG — 46 mẫu trong 4 lần chạy driver, resume)

Driver: `hidden_files/tts51h2/drive51h2.py` (bản đợt 51, có vá §5.2;
bản sao làm việc của đợt 52 ở `hidden_files/tts52h1/drive52i1.py`).
Nạp model mỗi lần chạy lại; warmup infer ("Chào bạn!", Hải Đăng) mỗi
lần chạy lại. Mỗi dòng kết quả ghi ĐỒNG THỜI vào `/tmp/tts51h2/
results.jsonl` và bản sao `hidden_files/tts51h2/results.jsonl` NGAY
trong lúc đo (flush + fsync). WAV ở `/tmp/tts51h2/` (35 file còn lại
sau restart; 11 file đầu đợt 52 mất theo /tmp — xem §5).

Nạp model 4 lần chạy đợt 52: 11,3 / 16,2 / 11,4 / 8,0 s; warmup:
4,7 / 6,1 / 1,9 / 2,0 s. Thời gian nạp model KHÔNG tính vào độ dài audio.

### 2.1 Mẫu lặp đợt 52 theo giọng (46 mẫu)

| Giọng | M3 (s) | M4 (s) |
| --- | --- | --- |
| Ngọc Huyền | 16,03 / 16,03 | 9,52 / 9,76 |
| Thiện Minh | 15,65 / 15,06 | 9,68 / 9,84 |
| Adam | 15,18 / 14,42 | 9,92 / 9,12 |
| Thùy Dung | 13,91 / 14,21 | 8,56 / 8,32 |
| Xuân Vĩnh | 16,19 / 16,07 | 9,52 / 9,76 |
| Minh Triết | 15,65 / 15,45 | 9,76 / 9,12 |
| Thanh Bình | 14,80 / 14,27 | 9,04 / 9,12 |
| Thái Sơn | 17,89 / 17,96 | 10,96 (×1) |
| Hải Đăng | 14,89 / 14,89 | — (đủ n = 8) |
| Minh Đức | 18,80 / 18,95 | 11,76 (×1) |
| Thục Đoan | 16,95 (×1) | 10,96 / 10,96 |
| Thiền Tâm Đức | 21,10 (×1) | 12,88 (×1) |
| Mỹ Duyên | 20,86 (×1) | — (đủ n = 8) |
| Adam bựa | 16,78 (×1) | 10,48 (×1) |
| Quỳnh Anh | 17,18 (×1) | 10,32 (×1) |

Lặp cùng giọng+text (2 lần đợt 52): spread lớn nhất 4,9% (Adam M3:
15,18/14,42) và 4,1% (Thiện Minh M3: 15,65/15,06); các cặp khác
≤ 3,7%. Tương đương mức lặp đợt 51 (≤ 4,6%) — không có lần đo nào
lạc hẳn so với pool của giọng đó.

3 cặp lặp trùng khớp tuyệt đối (model xác định + làm tròn 0,1 s):
V25/V26 Ngọc Huyền M3 cùng 16,03 s / 32,5 s synth; V31/V32 Hải Đăng
M3 cùng 14,89 s (synth khác nhau 98,5/66,0 s); W13/W14 Thục Đoan M4
cùng 10,96 s (synth 114,8/34,3 s) — đều là 2 lần đo độc lập, không
phải dòng trùng (driver resume bỏ qua id đã đo; synth khác nhau chứng
minh chạy riêng). Ghi lại để đợt sau khỏi tưởng dữ liệu trùng lặp.

## 3. Bảng hệ số H2 mới (ĐO XONG — tính lại từ pool gộp 83 mẫu)

Bảng hệ số H2 (`ttsEstimate51H2.ts`, tính lại từ pool mẫu trong test
§3 — tốc độ gộp = tổng ký tự / tổng giây trên mọi lần đo của giọng đó,
gồm cả lần lặp/neo + mẫu C4/D1/E1/F3 cũ; f = normal / 16,0714,
g = dense / 9,5388). Sắp xếp theo f tăng dần. **25/25 giọng nay n ≥ 3
cả hai chế độ (Kim Thanh dense n = 5).**

| Giọng | Normal (ký tự/giây) | n | f | Dense (ký tự/giây) | n | g | Tỉ lệ d/n | Trôi vs F3 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Đức Trí | 12,1408 | 3 | 0,7554 | 8,2306 | 3 | 0,8629 | 0,678 | +1,44% / +0,30% |
| Kim Thanh | 12,5247 | 3 | 0,7793 | 7,8235 | 5 | 0,8202 | 0,625 | −0,39% / +0,52% |
| Thiền Tâm Đức | 12,8019 | 3 | 0,7966 | 8,3682 | 3 | 0,8773 | 0,654 | +1,21% / +0,40% |
| Mỹ Duyên | 13,5092 | 8 | 0,8406 | 8,6889 | 3 | 0,9109 | 0,643 | 0,00% / −0,91% |
| Minh Đức | 13,7750 | 3 | 0,8572 | 9,2486 | 3 | 0,9696 | 0,671 | +2,07% / +3,86% |
| Quang Sơn | 14,9118 | 3 | 0,9278 | 9,6967 | 3 | 1,0166 | 0,650 | +2,35% / +2,03% |
| Ngọc Trân | 14,9823 | 3 | 0,9322 | 9,3998 | 3 | 0,9854 | 0,627 | −1,41% / +3,50% |
| Thục Đoan | 15,4910 | 3 | 0,9641 | 10,2410 | 3 | 1,0737 | 0,661 | −0,98% / +1,23% |
| Thái Sơn | 15,8272 | 3 | 0,9848 | 9,8946 | 3 | 1,0371 | 0,625 | −1,24% / +0,76% |
| Adam bựa | 15,8430 | 3 | 0,9858 | 10,7133 | 3 | 1,1230 | 0,676 | +0,87% / −0,50% |
| Mai Anh | 16,0850 | 3 | 1,0008 | 10,5617 | 3 | 1,1072 | 0,657 | +0,51% / −3,34% |
| Phạm Tuyên | 16,3760 | 3 | 1,0190 | 11,1832 | 3 | 1,1724 | 0,683 | −2,32% / +0,90% |
| Đoan Trang | 16,4184 | 3 | 1,0216 | 10,3992 | 3 | 1,0902 | 0,633 | +1,04% / +4,05% |
| Quỳnh Anh | 16,4136 | 3 | 1,0216 | 10,3587 | 3 | 1,0856 | 0,631 | −0,13% / +0,03% |
| Ngọc Linh | 17,1284 | 3 | 1,0658 | 11,1692 | 3 | 1,1709 | 0,652 | −0,27% / +0,34% |
| Ngọc Huyền | 17,4087 | 3 | 1,0833 | 11,1946 | 3 | 1,1731 | 0,643 | +1,37% / −1,55% |
| Thiện Minh | 17,3156 | 3 | 1,0774 | 11,6408 | 3 | 1,2196 | 0,672 | 0,00% / −0,72% |
| Hải Đăng | 17,8391 | 8 | 1,1100 | 11,8185 | 3 | 1,2388 | 0,662 | +0,62% / +2,31% |
| Adam | 17,8500 | 3 | 1,1108 | 11,9545 | 3 | 1,2530 | 0,670 | −1,13% / +1,26% |
| Xuân Vĩnh | 17,8011 | 3 | 1,1077 | 11,0353 | 3 | 1,1569 | 0,620 | −3,09% / 0,00% |
| Minh Triết | 18,1078 | 3 | 1,1267 | 11,5203 | 3 | 1,2075 | 0,636 | −2,28% / −1,25% |
| Thanh Bình | 18,6403 | 3 | 1,1598 | 12,0501 | 3 | 1,2631 | 0,646 | −0,29% / +3,23% |
| Quốc Tuấn | 18,5850 | 3 | 1,1564 | 12,0433 | 3 | 1,2626 | 0,648 | −1,47% / −1,22% |
| Thùy Dung | 19,3216 | 3 | 1,2022 | 12,5382 | 3 | 1,3144 | 0,649 | **+7,01%** / +1,93% |
| Trúc Ly | 19,3807 | 3 | 1,2059 | 12,7113 | 3 | 1,3326 | 0,656 | −0,92% / −2,88% |

(Cột "Trôi vs F3" là normal / dense. Các giọng đã đủ n ≥ 3 từ đợt 51
thì hệ số Y HỆT bảng đợt 51 — pool của chúng không đổi.)

### 3.1 Tỉ lệ dense/normal mới

0,6199–0,6829 (min Xuân Vĩnh, max Phạm Tuyên) — hẹp hơn dải đợt 51
(0,6007–0,6854, min Xuân Vĩnh, max Adam bựa) vì Adam bựa dense nay
0,6761 (đợt 51: 0,6854, khi dense n = 2). Vẫn KHÔNG phải hằng số, hệ
số dense riêng bắt buộc.

### 3.2 Độ lệch so với tâm gộp (h = 0,17)

Mọi mẫu M3/M4 đã đo đều nằm trong khoảng của giọng đó
(compute `outOfRange: []`). Độ lệch lớn nhất so với tâm gộp mới vẫn
là 11,3% (Hải Đăng normal — giữ từ F3, do neo A2 8,40 s nhanh nhất).
Spread normal lớn nhất sau Hải Đăng: Thùy Dung 7,0% (xem §3.3), Mỹ
Duyên 7,4% (giữ từ trước); spread dense lớn nhất: Đoan Trang 4,1%.

### 3.3 Ngoại lệ duy nhất vượt ngưỡng trôi 5%: Thùy Dung normal +7,01%

F3 chỉ có n = 1 mẫu C4-M4 cho Thùy Dung normal (9,36 s → 18,0556
ký tự/giây); 2 mẫu H2 mới đợt 52 (8,56 / 8,32 s → 19,74 / 20,31
ký tự/giây) kéo tâm gộp lên 19,3216 (+7,01%). Đây đúng là điều nợ
n = 1 cảnh báo — hệ số dựa trên 1 lần đo không đáng tin — không phải
lỗi đo: cả 2 mẫu mới đều nằm trong khoảng h = 0,17 của tâm gộp mới
(spread normal Thùy Dung 7,0%), và dense của cô chỉ trôi +1,93%.
Test H2 khóa ngoại lệ này đúng tên + đúng mức +7,01% (xem §7), giữ
ngưỡng 5% cho mọi giọng/chế độ khác (lớn nhất sau đó: Đoan Trang
dense +4,05%).

## 4. Tốc độ tổng hợp (ĐO XONG — 46 lần đo đợt 52, 83 lần đo tổng)

- Đợt 52 (46 lần): tỉ lệ audio/synth **0,02–0,51×, median 0,18×**,
  tổng synth 5449,2 s (~91 phút). Chậm nhất: W38 Thanh Bình M4 —
  455,3 s synth cho 9,04 s audio (0,02×, lúc load average 24,7 vì
  các luồng khác chạy click-test headed + tsc + vite cùng lúc).
  Nhanh nhất: W28 Thiện Minh M4 — 19,1 s synth cho 9,68 s audio
  (0,51×, lúc máy yên sau restart). Nhanh hơn đợt 51 (median 0,10×)
  vì đợt 52 có khoảng máy yên sau restart + chỉ 1 driver TTS chạy.
- Tổng 83 lần (đợt 51 + 52): **0,02–0,51×, median 0,12×**, tổng
  synth 11427,5 s (~190 phút). Đều < 1× realtime — con số
  "~1,5–2,5× realtime" trong memory vẫn SAI HẲN so với đo thật trên
  VM này (không lần nào vượt 0,51× trong 83 lần đo). KHÔNG sửa memory
  (theo quy ước các luồng trước); chỉ báo số thật ở đây. Tốc độ tổng
  hợp không ảnh hưởng độ dài WAV hay toast (chỉ ảnh hưởng thời gian
  chờ khi bấm TTS).

## 5. Sự cố trong lượt (trung thực, không giấu)

1. **VM restart 1 lần giữa lượt** (~17:53 UTC, uptime reset về 1
   phút): /tmp bị xóa hoàn toàn — mất 11 WAV đầu đợt 52 (V25/V26/
   W24/W25/V29/V30/W28/W29/V33/V34/W30 — chỉ còn số đo trong backup),
   mất 1 mẫu đang tổng hợp dở (W31, đo lại sau bằng resume) + log
   stdout của lần chạy 1 (đã chuyển log stdout sang hidden_files từ
   lần chạy 2 để không mất nữa). Cơ chế dual-write backup đã cứu toàn
   bộ số đo — không mất mẫu nào.
2. **Ghi WAV lỗi thoáng qua 2 lần** (không phải SIGKILL, không mất
   driver — driver tự dừng vì exception không bắt):
   - Lần 1 (chạy 2, sau W38): `sf.write` ném `LibsndfileError:
     System error` khi ghi H2-W39.wav — file chỉ còn 4096 byte.
     Mất 1 mẫu đã tổng hợp xong (~7 phút synth).
   - Lần 2 (chạy 3, sau V31): `sf.write` lỗi mở file H2-V32.wav
     ("System error") rồi fallback wave module cũng ném
     `PermissionError: [Errno 1] Operation not permitted` khi ghi —
     file còn 0 byte. Ghi tay vào cùng thư mục ngay sau đó vẫn OK
     (lỗi thoáng qua, không rõ nguyên nhân gốc — /tmp tmpfs còn
     284M trống, không phải hết dung lượng; không có quyền đọc dmesg
     để xác nhận). Mất 1 mẫu đã tổng hợp xong.
   - **Vá driver trong đợt 52** (chỉ sửa `drive51h2.py` ở hidden_files,
     không đụng repo): `write_wav` bắt lỗi `sf.write` rồi fallback
     sang wave module; `main()` bắt lỗi ghi WAV → thử lại 1 lần sau
     2 s → nếu vẫn lỗi thì ghi sang đĩa persistent
     (`hidden_files/tts51h2/wav/`, khác filesystem với tmpfs /tmp)
     thay vì bỏ mẫu. Cả 2 lần lỗi đều xảy ra TRƯỚC khi vá; sau vá
     (chạy 4) không còn lỗi ghi nào — nhưng fallback sang đĩa chưa
     từng phải dùng tới thật (chỉ retry /tmp, chưa rõ có đủ chặn lỗi
     thoáng qua lần sau không — ghi nhận trung thực).
   - W39 và V32 đều đo lại thành công sau đó bằng resume (W39: 9,12 s,
     synth 77,2 s; V32: 14,89 s, synth 66,0 s).
3. **KHÔNG có SIGKILL nào ở đợt 52** (đợt 51 có 2 lần): RSS driver tối
   đa ~3,0 GB, chỉ 1 driver TTS chạy tại một thời điểm (đã kiểm tra
   `ps` — không có driver TTS nào khác song song), load average có
   lúc lên 24,7 nhưng do các luồng khác (click-test headed Electron/
   Chrome + tsc + vite), không phải do driver TTS.
4. **RAM lúc bắt đầu lượt rất căng** (MemAvailable chỉ ~550 MB trước
   khi chạy driver, dù RSS các tiến trình chỉ ~0,5 GB — ~7 GB "used"
   không nằm trong anon/cache/slab nhìn thấy được, nghi là áp lực
   từ host). Driver vẫn chạy được (RSS 1,2–3,0 GB); sau restart VM
   thì MemAvailable lên ~1,85 GB. Ghi nhận để đợt sau khỏi tưởng
   máy luôn đủ RAM.

## 6. Verify WAV (verify51h2.py — ĐO XONG)

- 35/46 WAV đợt 52 còn trong /tmp: header WAV khớp ffprobe từng
  mili-giây cho cả 35 file; lead silence 0,0–0,1 s; trail silence
  0,0–0,3 s (W21 trail đúng 0,3 s — tại ngưỡng, không vượt);
  gap trong dài nhất 0,7 s. **0 flag.**
- 11 WAV đầu đợt 52 + toàn bộ 37 WAV đợt 51 đã mất theo /tmp qua
  2 lần VM restart — chỉ còn số đo trong backup (số đo ghi từ header
  WAV ngay lúc ghi file, cùng đường code với 35 WAV đã verify;
  đợt 51 đã verify 29/37 WAV trước khi mất). Không đo lại các mẫu
  này (số đo đã khóa trong backup và khớp xu hướng pool).
- Log verify: `hidden_files/tts52h1/verify52i1.log`.

## 7. Kiểm chứng (số thật)

- Test mới H2 **10/10** (`ttsEstimate51H2.test.ts` — text chuẩn,
  neo, tính lại bảng hệ số từ pool, 25/25 giọng n ≥ 3, mọi mẫu trong
  khoảng h = 0,17, tỉ lệ dense/normal 0,6199–0,6829, lặp ưu tiên
  ≤ 5%, tốc độ tổng hợp < 1×, calibrated 25/25, ngoại lệ Thùy Dung
  +7,01% khóa đúng). Chạy qua bundle CJS (xem §7.1).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate51H1.test.ts` **11/11**,
  `ttsEstimate47C4.test.ts` **10/10** (bundle CJS),
  `ttsEstimate48D1.test.ts` **12/12**,
  `ttsEstimate46B3.test.ts` **7/7**,
  `ttsEstimate45A3.test.ts` **10/10**,
  `ttsDuration44Z3.test.ts` **9/9**,
  `ttsEstimate49E1.test.ts` **13/13**,
  `ttsEstimate50F3.test.ts` **15/15** — fail 0.
- `tsc --noEmit` trong `apps/web`: **0 lỗi**.
- `vite build` (từ `apps/web`): **pass** (built in 6,93 s; chỉ cảnh
  báo chunk > 500 kB có sẵn, không liên quan luồng này). Lưu ý: chạy
  `vite build` từ repo root sẽ lỗi "Could not resolve entry module
  index.html" — lỗi cách chạy (sai thư mục), không phải code.
- KHÔNG chạy lại ở lượt này: mọi phép đo browser headed/FPS,
  click-test headed, Safari/máy thật.

### 7.1 Lưu ý cách chạy test (giữ từ ROUND51_LIMITS §3)

Test H2 và C4 import extensionless qua chuỗi require vòng nhau nên
bundle ESM của esbuild ném `ERR_REQUIRE_CYCLE_MODULE` lúc nạp — lỗi
cách chạy, không phải code: bundle lại bằng `--format=cjs` thì chạy
xanh (H2 10/10, C4 10/10). Các test khác chạy ESM bình thường.

## 8. Nợ mở còn lại (sau luồng này)

1. **Transfer theo text 1,172 (nợ F3 §8.3)** vẫn mở: chưa đo thêm
   text medium thứ hai cho giọng chậm (task giao "nếu còn thời gian"
   — đã hết khung giờ sau khi đo đủ 46 mẫu + kiểm chứng). Đợt sau
   cần đọc F3 §8.3 để biết đúng giao thức đo rồi chạy driver riêng.
2. **Điểm giữa đường cong Q14/Trúc Ly (chỉ có 5 điểm)** vẫn mở:
   chưa đo thêm (cùng lý do §8.1 — task giao "nếu còn thời gian").
3. **Fallback ghi WAV sang đĩa persistent chưa từng kích hoạt thật**
   (xem §5.2): retry /tmp sau vá chưa gặp lỗi nào nên chưa biết
   fallback đĩa có chặn được lỗi thoáng qua lần sau không.
4. **2 lần ghi WAV lỗi thoáng qua chưa rõ nguyên nhân gốc**
   (xem §5.2): không có quyền đọc dmesg/syslog; nghi lỗi thoáng qua
   của tmpfs/sandbox, không phải code driver (ghi tay ngay sau đó vẫn
   OK). Nếu lặp lại ở đợt sau thì cần điều tra sâu hơn (ghi thẳng
   sang đĩa persistent thay vì /tmp).
5. **48 WAV đã mất theo /tmp qua 2 lần restart** (37 đợt 51 + 11 đợt
   52): chỉ còn số đo trong backup. Không ảnh hưởng bảng hệ số (số đo
   đã khóa), nhưng đợt sau không thể ffprobe lại các mẫu này.
6. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem
   LIMITS C4 §6.5).

## 9. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Đổi:
1. `apps/web/src/lib/ttsEstimate51H2.ts` — bảng hệ số tính lại từ
   pool 83 mẫu (25/25 giọng n ≥ 3) + 46 mẫu đo mới + tốc độ tổng hợp
   83 lần đo + header cập nhật (lịch sử đợt 51 + 52, ngoại lệ Thùy
   Dung, tỉ lệ dense/normal mới 0,6199–0,6829).
2. `apps/web/src/lib/ttsEstimate51H2.test.ts` — test cập nhật theo số
   mới: đủ 83 mẫu (43 M3 + 40 M4), 25/25 giọng calibrated, ngoại lệ
   Thùy Dung +7,01% khóa đúng, tỉ lệ dense/normal 0,6199–0,6829
   (Xuân Vĩnh / Phạm Tuyên), synth 0,02–0,51× median 0,12× tổng
   11427,5 s. 10/10.

Mới:
1. `docs/PHASE9_ROUND52_I1_TTS_SAMPLES_LIMITS.md` — chính tài liệu này.

Không đổi: `ttsEstimate51H1.ts` (helper H1), `ttsEstimate50F3.ts`
(giữ nguyên số F3 — bản ghi lịch sử), `ttsEstimate49E1.ts`,
`ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`, `ttsEstimate46B3.ts`,
`ttsEstimate45A3.ts`, `ttsDuration44Z3.ts`, `TtsButton.tsx`, mọi file
test A3/C4/D1/B3/E1/F3/Z3/H1 khác, bridge, mọi file luồng khác đợt 52.

File đo + script (ngoài repo, không stage — trong
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts52h1/`):
`compute52i1.final.json` (bảng hệ số tính lại từ 83 mẫu),
`compute52i1.ts` (bản sao compute51h2.ts),
`drive52i1.py` (bản sao driver ĐÃ VÁ — retry + fallback đĩa),
`drive52i1.stdout.log` (log stdout 4 lần chạy đợt 52),
`verify52i1.log` (log verify 83 mẫu),
`verify52i1.py` (bản sao verify51h2.py),
`lib52i1.head.ts` (head mới của lib H2),
`assemble52i1.py` (script ráp lib H2 từ head + fragment + bảng mới).
Dữ liệu đo gốc vẫn ở `hidden_files/tts51h2/results.jsonl` (83 mẫu +
10 meta, dual-write với /tmp) — driver resume đọc chính file này.
WAV đo (`/tmp/tts51h2/*.wav`, 35 file còn lại) nằm ngoài repo,
không stage.
