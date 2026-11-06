# Phase 9 — Đợt 48, luồng D1: TtsButton chuyển sang helper C4 + củng cố numberDense

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts48d1/`, ngoài repo), KHÔNG stage bởi luồng
này (parent gộp). Chỉ sửa file text trong `~/workspace/repo-1`.

VIẾT SỚM (trước khi chạy đo dài) — tài liệu này được viết trước mọi
phép đo mới của luồng; các mục §3–§5 ghi rõ cái gì CHƯA BIẾT lúc viết,
và được cập nhật sau khi có số đo thật. Không có số nào dưới đây là
"suy ra từ suy đoán" mà không ghi rõ.

## 0. Bối cảnh (đọc từ LIMITS C4 + lib C4, không đo lại)

- Đợt 47 C4 đo bảng `ttsEstimate47C4`: normal medium 17,6835 /
  long 18,6116 ký tự/giây; numberDense 9,0010 (n = 3, YẾU, ngưỡng
  chữ số ≥ 5% TẠM THỜI). Khoảng trống quan sát quanh ngưỡng: mẫu
  thường cao nhất 1,0% chữ số (L5 "100%"), mẫu số-dày thấp nhất
  13,5% (M3) — ngưỡng 5% nằm trong khoảng trống, CHƯA có mẫu nào ở
  gần ngưỡng để khóa chặt.
- `TtsButton.tsx` vẫn nối helper B3 (`ttsDoneSuffixRange46B3`) nên
  toast cho text số-dày sai xa: vd text M3 (178 ký tự, thực tế
  19,99 s) B3 cho "(≈9.6–11.0s)" — sai gần gấp đôi, khoảng B3 không
  chứa số thật. Test B3 §4 khóa nối UI vào helper B3.
- 11/25 giọng preset CHƯA đo: Thiền Tâm Đức, Thanh Bình, Ngọc Linh,
  Đoan Trang, Thục Đoan, Minh Triết, Mỹ Duyên, Quỳnh Anh, Đức Trí,
  Kim Thanh, Adam bựa. (Đã đo 14/25.)

## 1. Việc luồng này làm

1. Chuyển `TtsButton` sang helper C4 (1 import + 1 lời gọi) + cập
   nhật assertion nối UI trong test B3 §4 cho khớp hành vi mới.
   Test đỏ-trước (luồng D1 mới): nối UI vào C4 — ĐỎ khi TtsButton
   còn dùng B3, XANH sau khi chuyển; đồng thời khóa bằng chứng toast
   cũ sai (B3 cho M3 "(≈9.6–11.0s)" trong khi thực tế 19,99 s) và
   toast mới đúng (C4 "(≈19.4–21.9s)" chứa 19,99 s).
2. Củng cố numberDense: đo thêm 5 mẫu thăm dò ngưỡng qua `tts.py`
   trực tiếp (WAV ở `/tmp/tts48d1/`, ngoài repo), tỉ lệ chữ số
   ~2% / ~4% / ~5% / ~8% / ~13%, cùng 1 giọng (Hải Đăng) để cô lập
   biến tỉ lệ chữ số. Mục tiêu: thu hẹp khoảng trống quan sát
   1,0% → 13,5%. Nếu ngưỡng 5% sai (mẫu 4% đã đọc chậm, hoặc mẫu
   5% vẫn đọc thường) thì sửa ngưỡng + cập nhật helper C4 + test.
3. Đo thêm ≥ 4 giọng trong 11 giọng chưa đo, cùng 1 text thường
   chuẩn (text C4-M4, 169 ký tự) để so sánh trực tiếp tốc độ giữa
   các giọng; kiểm tra mỗi giọng có nằm trong khoảng C4 cho text đó
   không. Cập nhật bảng nếu cần.
4. Hồi quy: test TTS cũ (A3/B3/C4), `tsc --noEmit`, `vite build`.

## 2. Số nào YẾU / tạm thời lúc bắt đầu luồng (chưa đo lại)

- numberDense n = 3 xuyên tầng, khoảng [0,9803×, 1,1094×] chỉ là
  biên quan sát của 3 điểm — text số-dày mới (nhất là text toàn
  số) hoàn toàn có thể rơi ngoài. Ngưỡng 5% là TẠM THỜI (xem §0).
- Mỗi mẫu thăm dò ngưỡng chỉ n = 1 (một lần chạy, một giọng) — kết
  quả chỉ thu hẹp khoảng trống quan sát, KHÔNG khóa ngưỡng như chân
  lý thống kê. Nếu hai mẫu kề ngưỡng cho kết quả mâu thuẫn (vd 4%
  chậm nhưng 5% thường), ngưỡng vẫn giữ tạm thời và ghi rõ mâu thuẫn.
- Tốc độ giọng chưa đo có thể lệch ngoài khoảng C4 (khoảng C4 gộp
  từ tối đa 6 giọng/tầng). Một giọng mới nằm ngoài khoảng không tự
  động đồng nghĩa "bảng sai" — khoảng là biên quan sát, không phải
  khoảng tin cậy; chỉ khi lệch lớn/hệ thống mới xem xét nới bảng.
- Độ dài WAV bị lượng tử hóa theo bước 0,08 s (C4 §3.1) — mẫu ngắn
  có sai số tương đối tới ~14% chỉ do lượng tử hóa; mẫu thăm dò đều
  ở tầng medium (~150–200 ký tự, ~10–20 s) nên ảnh hưởng < 1%.
- Đo trên VM này (4 CPU, ~8 GB RAM, không GPU), model VieNeu-TTS
  v3 Turbo 0.5B đã cache ở `server/tts/models/`. Thời gian nạp model
  KHÔNG tính vào độ dài. Driver đo của luồng này nạp model MỘT lần
  rồi gọi `infer` cho từng mẫu qua đúng đường code của `tts.py`
  (`split_text_chunks` + `infer(..., apply_watermark=False)` +
  `concat_with_crossfade`) — xem §3.1 sau khi đo xong. (Driver C4 ở
  `/tmp/tts47c4/` đã bị dọn cùng /tmp nên không tái sử dụng được.)

## 3. Mẫu đo thật mới (ĐO XONG — 16 mẫu, xem chi tiết ở ttsEstimate48D1.ts)

Driver: `/tmp/tts48d1/drive48d1.py` (12 mẫu) + `drive48d1b.py`
(4 mẫu 2x2/lặp), nạp model MỘT lần rồi gọi `infer` cho từng mẫu qua
đúng đường code của `tts.py` (`split_text_chunks` +
`infer(..., apply_watermark=False)` + `concat_with_crossfade`).
Model VieNeu-TTS v3 Turbo 0.5B đã cache; độ dài lấy từ header WAV
(module `wave`) và cross-check bằng ffprobe — KHỚP TỪNG MILI-GIÂY
cho cả 16 WAV. Thời gian nạp model KHÔNG tính vào độ dài (nạp ~8 s).
Preset voices liệt kê lúc chạy: 25 giọng (khớp bridge; model card
ghi 23 nhưng SDK cài đặt có thêm "Thiền Tâm Đức" và "Adam bựa").
Kiểm tra im lặng (RMS theo cửa sổ 0,1 s, ngưỡng 0,01): mọi WAV có
lead/trail silence ≤ 0,3 s, khoảng lặng trong dài nhất 0,3–0,5 s
(quãng nghỉ giữa câu bình thường) — độ dài đo là thời gian đọc thật,
không phải đệm im lặng.

### 3.1 Thăm dò ngưỡng (5 mẫu, giọng Hải Đăng)

| Mẫu | Tỉ lệ chữ số | Độ dài thật | Tốc độ | Chế độ quan sát |
| --- | --- | --- | --- | --- |
| D1-T2 | 2,05% (4/195) | 12,08 s | 16,14 | thường |
| D1-T4 | 4,15% (8/193) | 11,68 s | 16,52 | thường |
| D1-T5 | 5,08% (9/177) | 10,88 s | 16,27 | thường — NGƯỠNG 5% SAI |
| D1-T8 | 8,20% (15/183) | 12,47 s | 14,68 | thường (chậm vừa) |
| D1-T13 | 12,43% (21/169) | 13,53 s | 12,49 | thường (chậm vừa) |

Tốc độ giảm DẦN theo tỉ lệ chữ số (16,14 → 16,52 → 16,27 → 14,68
→ 12,49), không có bước nhảy ở 5%. Text 5,08% đọc bình thường;
ngay cả 12,43% cũng chỉ chậm vừa, chưa chạm chế độ ~9 của C4.

### 3.2 Giọng mới (7 giọng, cùng text C4-M4 169 ký tự, thường)

| Mẫu | Giọng | Độ dài thật | Tốc độ | Trong khoảng medium C4 cũ [8,78–10,39]? |
| --- | --- | --- | --- | --- |
| D1-V1 | Thiền Tâm Đức | 13,20 s | 12,80 | NGOÀI (+27%) |
| D1-V2 | Thanh Bình | 9,04 s | 18,69 | trong |
| D1-V3 | Ngọc Linh | 9,84 s | 17,17 | trong |
| D1-V4 | Đoan Trang | 10,40 s | 16,25 | NGOÀI sít sao (+0,01 s — trong bước lượng tử 0,08 s) |
| D1-V5 | Thục Đoan | 10,80 s | 15,65 | NGOÀI (+4%) |
| D1-V6 | Minh Triết | 9,12 s | 18,53 | trong |
| D1-V7 | Mỹ Duyên | 12,00 s | 14,08 | NGOÀI (+15%) |

Cùng một text: 9,04 → 13,20 s (chênh 46%). Tính cách giọng trong
model card KHÔNG giải thích được: Thiền Tâm Đức và Thanh Bình cùng
"kể chuyện" nhưng 12,80 vs 18,69 ký tự/giây. Tốc độ là đặc tính từng
giọng, không theo nhóm tính cách/vùng/miền.

### 3.3 Thí nghiệm 2x2 — hiệu ứng số-dày phụ thuộc giọng (quyết định)

| Ô | Text | Giọng | Độ dài thật | Tốc độ |
| --- | --- | --- | --- | --- |
| M3 × Minh Đức (C4) | M3 (13,48%) | Minh Đức | 19,99 s | 8,90 |
| D1-X1 | M3 (13,48%) | Hải Đăng | 15,41 s | 11,55 |
| D1-X2 | T13 (12,43%) | Minh Đức | 19,17 s | 8,82 |
| D1-T13 | T13 (12,43%) | Hải Đăng | 13,53 s | 12,49 |

Cùng text M3: Minh Đức 8,90 vs Hải Đăng 11,55 (+30%). Cùng text
T13: Minh Đức 8,82 vs Hải Đăng 12,49 (+42%). Minh Đức đọc text
số-dày ở ~8,8–8,9 BẤT KỂ text nào (12,43% hay 13,48%); Hải Đăng
đọc cùng text ở 11,55–12,49. Hệ số số-dày C4 9,0010 chỉ đúng cho 3
giọng C4 đã đo — không phải hằng số chung. X2 là phản ví dụ: bộ phát
hiện (ngưỡng mới 13%) cho "thường" nhưng Minh Đức đọc chậm như
số-dày; X2 KHÔNG đưa vào pool hiệu chuẩn nào (xem header lib D1).

### 3.4 Lặp lại giọng chậm (phương sai, không tính vào n)

| Mẫu | Giọng | Lần 1 | Lần 2 | Spread |
| --- | --- | --- | --- | --- |
| D1-X3 (lặp V1) | Thiền Tâm Đức | 13,20 s | 13,52 s | 2,4% |
| D1-X4 (lặp V7) | Mỹ Duyên | 12,00 s | 13,44 s | 11,3% |

Spread Mỹ Duyên 11,3% lớn hơn hẳn phương sai câu dài Hải Đăng 1,6%
ở C4 — phương sai cũng phụ thuộc giọng (hoặc text/giọng này có
prosody không ổn định giữa các lần chạy). Chỉ n = 2 mỗi giọng nên
chưa kết luận được phân phối; ghi nhận để đợt sau đo thêm.

## 4. Kết luận về ngưỡng + bảng (SAU KHI ĐO)

### 4.1 Ngưỡng: 5% → 13% (đúng cho giọng mặc định, vẫn tạm thời)

- Ngưỡng 5% SAI (bằng chứng: D1-T5 5,08% đọc bình thường 16,27;
  cả 4 mẫu thăm dò ≤ 12,43% của Hải Đăng đều không chạm chế độ
  chậm ~9). Ngưỡng mới 0,13 nằm giữa mẫu "không chậm" cao nhất
  (D1-T13: 12,43%, Hải Đăng 12,49) và mẫu "chậm" thấp nhất (C4-M3:
  13,48%, Minh Đức 8,90).
- Ngưỡng 13% tối ưu cho giọng MẶC ĐỊNH Hải Đăng: 4/4 mẫu thăm dò
  của Hải Đăng được phân loại đúng hướng (thường → khoảng medium
  mới chứa cả 4: T2/T4/T5/T8/T13 đều trong [8,78–13,53] s cho text
  của chúng). Với ngưỡng 5% cũ, cả 4 mẫu này đều bị dự báo sai xa
  (khoảng số-dày cũ [19,4–21,9] s cho text ~180 ký tự).
- NHƯNG ngưỡng 13% vẫn là tạm thời và KHÔNG đúng cho mọi giọng:
  phản ví dụ X2 (Minh Đức, 12,43% → 8,82) chứng minh không có
  ngưỡng tỉ lệ chữ số nào đúng cho cả hai giọng — đường cong chậm
  theo tỉ lệ của Minh Đức dốc hơn hẳn Hải Đăng (Minh Đức đã chậm
  ở 12,43%, Hải Đăng vẫn trung gian ở 13,48%). Mô hình nhị phân
  theo tỉ lệ chữ số là xấp xỉ thô; hiệu chuẩn theo giọng mới là đáp
  án đúng (nợ mở §7).

### 4.2 Bảng medium normal: 17,6835 → 16,0714, khoảng nới rộng

- Gộp 12 mẫu D1 vào tầng medium normal (n = 17): 2871 ký tự /
  178,64 s = **16,0714** ký tự/giây; khoảng **[0,8345×, 1,2867×]**
  (biên quan sát, làm tròn ra ngoài). Lệch −9,1% so với hằng C4 cũ.
- Khoảng rộng ra là BẮT BUỘC, không phải lựa chọn: 4/7 giọng mới
  nằm ngoài khoảng C4 cũ [0,92×, 1,09×] (V1 +27%, V7 +15%, V5 +4%,
  V4 +0,01 s sát biên). Giữ khoảng cũ đồng nghĩa toast sai cho gần
  nửa số giọng mới đo. Cái giá: hậu tố toast cho text thường giờ
  rộng hơn rõ rệt (vd 184 ký tự: "(≈9.6–11.3s)" cũ → "(≈9.6–14.7s)"
  mới) — trung thực hơn nhưng kém hữu ích hơn cho giọng nhanh.
  Hiệu chuẩn theo giọng sẽ thu hẹp lại được (nợ mở §7).

### 4.3 Bảng số-dày: 9,0010 → 9,5388, khoảng nới rộng

- Gộp mẫu X1 (M3 × Hải Đăng, 15,41 s) vào: 697 ký tự / 73,07 s =
  **9,5388** ký tự/giây; khoảng **[0,8258×, 1,1756×]**, n = 4.
  Lệch +6,0% so với hằng C4 cũ. Hậu tố M3: "(≈19.4–21.9s)" cũ →
  "(≈15.4–21.9s)" mới — vẫn chứa 19,99 s thật (Minh Đức) và nay
  chứa cả 15,41 s (Hải Đăng).
- Hệ số này vẫn YẾU: n = 4, gộp xuyên tầng và xuyên giọng; hai giọng
  đo được chênh nhau 30% trên cùng text. Text số-dày bằng giọng
  chưa đo hoàn toàn có thể rơi ngoài khoảng.

### 4.4 Giọng đã đo: 21/25 preset

- Mới đo thêm 7 giọng: Thiền Tâm Đức, Thanh Bình, Ngọc Linh, Đoan
  Trang, Thục Đoan, Minh Triết, Mỹ Duyên. Còn 4 chưa đo: Quỳnh Anh,
  Đức Trí, Kim Thanh, Adam bựa.
- Đính chính nhỏ: model card ghi 23 preset nhưng SDK cài đặt liệt
  kê 25 giọng (thêm "Thiền Tâm Đức" và "Adam bựa") — danh sách 25
  lấy từ `list_preset_voices()` lúc chạy driver (xem §3) mới là
  chuẩn, không phải model card.

## 5. Kiểm chứng (số thật)

- Test đỏ-trước (nối UI C4): chạy TRƯỚC khi chuyển — **7 pass,
  1 fail** (đúng 1 test nối UI đỏ: "TtsButton phải import từ
  ../lib/ttsEstimate47C4"; 2 test bằng chứng toast cũ sai/mới đúng
  đã xanh từ trước vì chúng test helper, không test UI; 4 test §3
  lúc đó xanh rỗng vì mảng mẫu D1 còn trống — ghi nhận trung thực,
  không tính là bằng chứng đo).
- Test mới D1 sau khi đo xong + chuyển UI + sửa bảng: **12/12**
  (`ttsEstimate48D1.test.ts` — nối UI, toast cũ sai/mới đúng, tỉ lệ
  chữ số tính lại, phân loại ngưỡng 13%, tốc độ thăm dò giảm dần,
  X1 nhanh hơn Minh Đức ≥20%, 4/7 giọng ngoài khoảng cũ, gộp số-dày
  9,5388 lệch +6,0%, ngưỡng 12%/13%, phản ví dụ X2 ngoài khoảng,
  phương sai lặp 2,4%/11,3%). Một lần sửa giữa chừng: test khóa
  "3/7 giọng ngoài khoảng cũ" sai — thực tế là 4/7 (Đoan Trang
  10,40 s vượt max cũ 10,39 s đúng 0,01 s); đã sửa test + lib +
  LIMITS thành 4/7, không sửa số đo.
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate47C4.test.ts` **10/10** (đã cập nhật theo bảng mới),
  `ttsEstimate46B3.test.ts` **7/7** (§4 nối UI đã cập nhật sang C4;
  §1–§3 hiệu chuẩn/hậu tố B3 giữ nguyên), `ttsEstimate45A3.test.ts`
  **10/10**, `ttsDuration44Z3.test.ts` **9/9**,
  `relinkEdge45A3.test.ts` **12/12**.
- `tsc --noEmit` trong `apps/web`: **sạch, 0 lỗi**.
- `vite build`: **pass** (built in 6,34 s; chỉ cảnh báo chunk
  >500 kB có sẵn, không liên quan luồng này).

## 6. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:
1. `apps/web/src/lib/ttsEstimate48D1.ts` — mẫu mới D1 (5 thăm dò
   ngưỡng + 7 giọng mới + X1 số-dày + phản ví dụ X2 + 2 lần lặp
   phương sai).
2. `apps/web/src/lib/ttsEstimate48D1.test.ts` — test mới 12/12.
3. `docs/PHASE9_ROUND48_D1_TTS_LIMITS.md` — chính tài liệu này.

Đổi:
1. `apps/web/src/components/TtsButton.tsx` — 1 import + 1 lời gọi:
   `ttsDoneSuffixRange46B3` → `ttsDoneSuffixRange47C4` (+ cập nhật
   comment). Không sửa logic nào khác. File này CHỈ luồng D1 chạm
   trong đợt 48 (kiểm tra mtime + grep: không có luồng khác sửa).
2. `apps/web/src/lib/ttsEstimate46B3.test.ts` — chỉ §4 (nối UI):
   assertion chuyển từ helper B3 sang helper C4. Các §1–§3 GIỮ
   NGUYÊN.
3. `apps/web/src/lib/ttsEstimate47C4.ts` — ngưỡng 0,05 → 0,13;
   medium 17,6835 [0,9183×, 1,0871×] → 16,0714 [0,8345×, 1,2867×];
   số-dày 9,0010 [0,9803×, 1,1094×] → 9,5388 [0,8258×, 1,1756×];
   cập nhật header/note tương ứng. Các tầng veryShort/short/long
   KHÔNG đổi.
4. `apps/web/src/lib/ttsEstimate47C4.test.ts` — cập nhật §1 (n
   medium 17, số-dày 4), §2 (hệ số gộp tính lại từ pool C4 + D1),
   §3 (ngưỡng 13%), §5 (hậu tố 184 ký tự + M3). Các test phương sai
   (§3–§4) và ranh giới tầng giữ nguyên.

Không đổi: `ttsEstimate45A3.ts`, `ttsEstimate46B3.ts`,
`ttsDuration44Z3.ts`, mọi file test A3/B3/Z3 khác (trừ §4 B3 nêu
trên), bridge, mọi file luồng khác (D2–D6 đang chạy song song —
luồng này không chạm file nào của họ; kiểm tra bằng find theo
mtime: các file đổi khác đều mang marker D2/D3/D4/D5/D6).
File WAV đo (`/tmp/tts48d1/*.wav`, 16 file), kết quả đo
(`/tmp/tts48d1/results.jsonl`, `results2.jsonl`), driver đo
(`/tmp/tts48d1/drive48d1.py`, `drive48d1b.py`), log driver
(`/tmp/tts48d1/drive48d1*.log`), bundle test (`/tmp/*.mjs`) nằm
ngoài repo, không stage.

## 7. Nợ mở còn lại (sau luồng này)

1. Hiệu chuẩn theo giọng (nợ LỚN NHẤT, mới lộ ra từ 2x2): tốc độ
   đọc chênh nhau theo giọng tới 46% (text thường) và hiệu ứng
   số-dày cũng phụ thuộc giọng (Minh Đức ~8,8 vs Hải Đăng ~12 trên
   cùng text số-dày). Đáp án đúng là bảng hệ số theo giọng (25
   giọng × tầng), helper nhận thêm tham số voice (TtsButton đã có
   voice đang chọn). Chưa làm trong luồng này vì vượt phạm vi task
   giao (chuyển UI sang C4 + sửa ngưỡng) và cần đo thêm: hiện mới
   có 8 giọng trên cùng 1 text chuẩn M4 — chưa đủ để khóa hệ số
   từng giọng (mỗi giọng mới n = 1 trên text đó).
2. Ngưỡng 13% vẫn tạm thời: phản ví dụ X2 (Minh Đức 12,43% đọc
   chậm) chứng minh ngưỡng tỉ lệ chữ số không đúng cho mọi giọng.
   Cần thêm mẫu thăm dò ở 10–16% BẰNG NHIỀU GIỌNG (nhất là Minh
   Đức, Ngọc Trân, Quốc Tuấn — 3 giọng số-dày gốc) để vẽ đường cong
   chậm theo tỉ lệ của từng nhóm giọng.
3. 4/25 giọng preset chưa đo: Quỳnh Anh, Đức Trí, Kim Thanh,
   Adam bựa. Tốc độ giọng chưa đo có thể lệch ngoài khoảng hiện tại.
4. Phương sai lặp của Mỹ Duyên 11,3% (n = 2) lớn bất thường so với
   Hải Đăng 1,6% (C4) — cần đo lặp thêm để biết là đặc tính giọng
   hay nhiễu lần chạy; hiện khoảng medium đã bao phủ cả hai lần đo
   (12,00 và 13,44 s đều trong [8,78–13,53]) nên toast không bị ảnh
   hưởng thực tế.
5. Tốc độ tổng hợp (synthSec) quan sát được 0,15–0,59× realtime
   trên VM này (vd T2: 38,6 s synth cho 12,08 s audio; V1: 88,5 s
   cho 13,20 s) — CHẬM HƠN NHIỀU so với con số "~1,5–2,5× realtime"
   ghi trong memory. Có thể do warmup/ONNX graph optimization ở các
   lần infer đầu (synth nhanh dần theo thứ tự chạy: 38,6 → 21,2 s
   cho các mẫu thăm dò) hoặc do VM yếu. Không ảnh hưởng độ dài WAV
   hay toast; ghi nhận để đợt sau đo riêng tốc độ tổng hợp (không
   phải việc của luồng này).
6. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem
   LIMITS C4 §6.5).
7. Đính chính task giao (đã ghi trong test D1 §2): "(≈9.6–11.0s)"
   là hậu tố B3 cho text 184 ký tự, không phải cho M3 178 ký tự —
   giá trị đúng cho M3 là "(≈9.2–10.7s)". Kết luận (toast cũ sai xa)
   không đổi.
