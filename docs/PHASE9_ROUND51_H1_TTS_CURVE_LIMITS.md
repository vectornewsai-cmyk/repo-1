# Phase 9 — Đợt 51, luồng H1: Mô hình đường cong TTS theo giọng (thay ngưỡng nhị phân 13%)

Ngày: 06/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts51h1/`, ngoài repo; 2 WAV đầu mất theo reboot
— xem §3), KHÔNG stage bởi luồng này (parent gộp). Chỉ sửa file text
trong `~/workspace/repo-1`.

## 0. Bối cảnh (đọc từ LIMITS F3 §8.1 + LIMITS đợt 50 §4.1)

- Nợ F3 §8.1: helper F3 dùng ngưỡng nhị phân 13% phân loại SAI text
  10–12% thành "thường" — khoảng normal không chứa số thật của cả 6 mẫu
  P10/P13 (test F3 §6 khóa lỗi). Tốc độ giảm TRƠN theo tỉ lệ chữ số,
  phụ thuộc giọng; KHÔNG có ngưỡng nhị phân nào đúng cho mọi giọng.
- Task luồng này: đo thêm điểm giữa 5–10% và 13–16% cho nhiều giọng,
  khóa dạng đường cong, xây helper mới `ttsEstimate51H1.ts` (KHÔNG sửa
  `ttsEstimate50F3.ts` — H2 sở hữu bảng hệ số; helper H1 nhận bảng hệ
  số qua interface, dùng tạm bảng F3), nối TtsButton sang helper H1,
  test đỏ-trước với 6 mẫu 10–12%.

## 1. Việc luồng này làm

1. Thiết kế 3 text thăm dò mới lấp khoảng trống: Q07 (172 ký tự, 12 chữ
   số = 6,98%), Q09 (173 ký tự, 17 chữ số = 9,83%), Q14 (168 ký tự,
   24 chữ số = 14,29%).
2. Đo 13 mẫu thật bằng driver TTS thật (`drive51h1.py`, theo mẫu F3):
   1 neo Kim Thanh M3 + Q07/Q09/Q14 × 4 giọng (Kim Thanh, Đức Trí,
   Quỳnh Anh — đã có đường cong F3; Trúc Ly — giọng nhanh nhất, kiểm
   hình dạng đường cong có phụ thuộc tốc độ giọng không).
3. Khóa dạng đường cong: φ(r) chung cho mọi giọng, nội suy tuyến tính
   từng đoạn giữa 8 nút đo (xem §4).
4. Xây helper mới `apps/web/src/lib/ttsEstimate51H1.ts` + test mới
   `ttsEstimate51H1.test.ts` (11 test); nối TtsButton sang helper H1;
   cập nhật assertion nối UI trong 4 test cũ (F3 §1, E1 §1, D1 §1,
   B3 §4) theo đúng mẫu F3 đã làm với E1/D1/B3.
5. Chạy hồi quy C4/D1/B3/A3/Z3/E1/F3 + tsc + vite build.

## 2. Số nào YẾU / tạm thời lúc bắt đầu luồng (chưa đo lại)

- Chỉ 3 giọng có điểm đường cong F3 (P10/P13/P16) và Trúc Ly chưa có
  điểm nào ngoài M3/M4 — hình dạng đường cong của giọng nhanh chưa biết.
- Mỗi điểm đường cong mới chỉ n = 1 (trừ neo A1) — φ của từng giọng tại
  từng nút dựa trên ĐÚNG 1 lần đo; khoảng tin cậy dựa vào độ lệch φ
  giữa các giọng (xem §4), không phải khoảng tin cậy của riêng giọng đó.
- Độ dài WAV bị lượng tử hóa theo bước 0,08 s (C4 §3.1) — mẫu dài
  11–22 s nên ảnh hưởng < 1%.
- Đo trên VM này (4 CPU, ~7,9 GB RAM, không GPU), model VieNeu-TTS
  v3 Turbo 0.5B đã cache ở `server/tts/models/`. Thời gian nạp model
  KHÔNG tính vào độ dài audio. Driver nạp model MỘT lần rồi gọi
  `infer` cho từng mẫu qua đúng đường code của `tts.py`
  (`split_text_chunks` + `infer(..., apply_watermark=False)` +
  `concat_with_crossfade`).
- 8–10 luồng đợt 51 chạy song song trên cùng VM trong lúc đo (cả driver
  TTS của H2) + 1 lần VM reboot 12:05 — tải CPU dao động mạnh, synth
  chậm tới 0,03×; độ dài audio không phụ thuộc tải CPU (xem §3).

## 3. Mẫu đo thật mới (ĐO XONG — 13 mẫu, 15 lần chạy driver)

Driver: `/tmp/tts51h1/drive51h1.py` (theo mẫu F3; bản sao backup ngay
vào `hidden_files/tts51h1/drive51h1.py` TRƯỚC khi chạy). Mỗi dòng kết
quả ghi ĐỒNG THỜI vào `/tmp/tts51h1/results.jsonl` và bản sao
`hidden_files/tts51h1/results.jsonl` NGAY trong lúc đo (flush + fsync)
— bài học F3 đã chứng minh hiệu quả lần nữa (xem dưới).

### 3.1 Điều kiện đo khắc nghiệt — driver bị kill 14 lần + 1 lần reboot

- VM quá tải (8–10 luồng đợt 51 song song: driver TTS H2, tsc, vite,
  đóng gói Electron AppImage/xz, Chrome headed): driver H1 bị SIGKILL
  (exit 137, không traceback) **14 lần** — run 1 chết theo session
  drain-timeout, run 2 chết lặng, run 3–6 exit 137, 4 lần lặp của vòng
  lặp 1, 1 lần chạy orphan, 3 lần lặp của vòng lặp 2. Mỗi lần chết
  mất mẫu đang synth dở (Q09-KT chết 4 lần, Q09-DT chết 7 lần — xem
  chi tiết ở đoạn dưới).
- **VM reboot ~12:05** (uptime reset, `up 3 min` lúc 12:08) xóa toàn bộ
  `/tmp`: 2 WAV đầu (H1-A1, H1-Q07-KT) MẤT. Nhưng cả hai ĐÃ được ffprobe
  khớp TRƯỚC reboot (22,74 s và 18,08 s — xem §3.3), và số giây còn
  trong backup `results.jsonl` — không mất số đo nào. Bản `/tmp` của
  `results.jsonl` thiếu 5 dòng đầu (driver tạo lại file khi resume);
  bản backup là bản ĐẦY ĐỦ (13 mẫu + 15 meta) — verify đối chiếu cả hai.
- Cách vượt qua: driver có resume (đọc results.jsonl hiện có, bỏ qua
  mẫu đã đo xong) + vòng lặp bash `loop51h1.sh` tự chạy lại driver tới
  khi đủ 13 mẫu (tối đa 12 lần lặp). Tổng cộng 15 lần chạy driver,
  14 lần bị kill, lần cuối chạy xong (XONG 13:48). Mẫu "khó chết" nhất:
  Q09-KT chết 4 lần mới xong (run 1–4), Q09-DT chết 7 lần mới xong
  (run 5–6, 4 lần lặp vòng 1, 1 lần orphan, rồi mới xong ở lần lặp 1
  của vòng 2). Nạp model 10,3–68,4 s và warmup 2,4–15,9 s theo tải
  từng lần chạy.
- Đối chiếu: driver H2 (pid 9374) sống sót suốt đợt với cùng cách chạy
  — không rõ cơ chế chọn nạn nhân của OOM killer (dmesg không đọc được:
  `Operation not permitted`); ghi rõ là chưa xác định được, không đoán.
  Bài học cho đợt sau: đo TTS dài trên VM này nên chạy bằng vòng lặp
  resume ngay từ đầu, và ffprobe-verify từng WAV NGAY khi nó xuất hiện
  (luồng này đã làm từ mẫu thứ 3 trở đi).

### 3.2 Neo kiểm chứng driver (1 mẫu)

| Mẫu | Giọng | Text | H1 | E1 / F3 (đối chiếu) | Kết luận |
| --- | --- | --- | --- | --- | --- |
| H1-A1 | Kim Thanh | M3 | 22,74 s | 22,92 / 23,03 / 23,00 / 22,53 s | lệch ≤ 1,3% ✓ |

Neo khớp chặt — driver đúng đường code trước khi đo khối chính.

### 3.3 Thăm dò đường cong Q07/Q09/Q14 × 4 giọng (12 mẫu)

| Giọng | Q07 6,98% | Q09 9,83% | Q14 14,29% |
| --- | --- | --- | --- |
| Kim Thanh | 18,08 s (9,51) | 19,60 s (8,83) | 21,73 s (7,73) |
| Đức Trí | 18,32 s (9,39) | 19,36 s (8,94) | 20,65 s (8,14) |
| Quỳnh Anh | 14,08 s (12,22) | 14,80 s (11,69) | 16,76 s (10,02) |
| Trúc Ly | 11,28 s (15,25) | 12,40 s (13,95) | 13,75 s (12,22) |

(Trong ngoặc: tốc độ ký tự/giây. Độ dài là thời gian đọc thật từ header
WAV.)

Verify (`verify51h1.py`, đã backup): 11 WAV còn trên đĩa khớp ffprobe
từng mili-giây; 2 WAV mất theo reboot đã ffprobe khớp trước reboot
(xem §3.1). Lead silence 0,06–0,13 s; trail silence 0,10–0,35 s
(7 mẫu trail 0,31–0,35 s, nhỉnh hơn ngưỡng 0,3 s của F3 — cùng phương
pháp đo nên so sánh vẫn nhất quán; độ dài đo là thời gian đọc thật).

## 4. Dạng đường cong ĐÃ KHÓA (xem compute51h1.py)

Tốc độ (ký tự/giây) theo tỉ lệ chữ số — đầy đủ 8 điểm cho 3 giọng,
5 điểm cho Trúc Ly (không có mẫu F3 P10/P13/P16):

| Tỉ lệ | Kim Thanh | Đức Trí | Quỳnh Anh | Trúc Ly |
| --- | --- | --- | --- | --- |
| 0% (normal gộp) | 12,57 | 11,97 | 16,44 | 19,56 |
| 6,98% (Q07) | 9,51 | 9,39 | 12,22 | 15,25 |
| 9,83% (Q09) | 8,83 | 8,94 | 11,69 | 13,95 |
| 10,22% (P10, F3) | 8,54 | 8,82 | 11,06 | — |
| 12,43% (P13, F3) | 8,13 | 8,30 | 10,52 | — |
| 13,48% (M3 gộp) | 7,78 | 8,21 | 10,35 | 13,09 |
| 14,29% (Q14) | 7,73 | 8,14 | 10,02 | 12,22 |
| 15,96% (P16, F3) | 7,09 | 7,50 | 9,46 | — |

- Tốc độ ĐƠN ĐIỆU GIẢM nghiêm ngặt theo tỉ lệ chữ số ở cả 4 giọng
  (test §5 khóa chuỗi đầy đủ; Trúc Ly: M4 > Q07 > Q09 > M3 > Q14).
- Mô hình: v_V(r) = v_normal,V − φ(r) × (v_normal,V − v_dense,V), với
  φ(r) CHUNG cho mọi giọng, nội suy tuyến tính từng đoạn giữa các nút
  đo; ngoài khoảng đo (> 15,96%) ngoại suy tuyến tính theo đoạn cuối
  (chưa đo, ghi rõ); tốc độ có sàn 3,0 ký tự/giây.
- Nút φ (trung bình 4 giọng; độ lệch giữa các giọng trong ngoặc):
  (0; 0), (0,0698; 0,671 ± 0,055), (0,0983; 0,809 ± 0,086),
  (0,1022; 0,854 ± 0,048), (0,1243; 0,958 ± 0,046), (0,1348; 1,000),
  (0,1429; 1,054 ± 0,124), (0,1596; 1,160 ± 0,043).
- Quyết định KHÓA φ chung (không phải φ riêng từng giọng): độ lệch φ
  giữa các giọng tại mỗi nút chỉ 0,04–0,12 (lớn nhất ở Q14 do Trúc Ly
  1,134 so với Kim Thanh 1,011) → sai số tốc độ ≤ ~5%, nằm gọn trong
  khoảng h = 0,17. φ chung cũng là thứ duy nhất khái quát được sang 21
  giọng còn lại (chỉ có neo normal/dense, không có điểm giữa).
- Đường cong rơi NHANH ngay từ tỉ lệ thấp: ở 6,98% đã đi 67% quãng
  đường xuống dense; ở 10,22% đi 85%; ở 15,96% VƯỢT dense (φ = 1,16).
  Lưu ý: điểm rơi sớm này MÂU THUẪN với ấn tượng từ D1 (Hải Đăng ở
  8,2% mới chậm rõ, φ ≈ 0,49) — nhưng D1 dùng text khác nhau cho mỗi
  điểm, còn H1/F3 dùng CÙNG text cho mọi giọng nên so sánh sạch hơn;
  đường cong H1 vẫn chứa được mọi mẫu D1 của Hải Đăng (test §5b),
  nên D1 không bác bỏ mô hình — chỉ cho thấy text khác nhau gây nhiễu
  thêm ngoài tỉ lệ chữ số (xem §8.4).
- SỬA ĐƯỢC lỗi gốc: khoảng đường cong H1 chứa số thật của cả 6 mẫu
  F3 P10/P13 (test §4 — đỏ-trước FAIL với helper F3, PASS với H1),
  chứa mọi mẫu thăm dò F3 + H1 (test §5), chứa mọi mẫu D1 của Hải Đăng
  VÀ phản ví dụ X2 (Minh Đức T13 19,17 s — test §5b; tâm đường cong
  ~18,6 s). Ngưỡng nhị phân 13% chính thức BỎ ở đường toast (helper H1
  thay thế; helper F3 chỉ còn làm fallback cho giọng lạ / clone mode).

## 5. Tốc độ tổng hợp (ĐO XONG — 13 lần đo, số thật)

- Infer thuần (driver, đã trừ nạp model, sau warmup): 13 lần đo, tỉ lệ
  audio/synth **0,03–0,39×, median ~0,10×** — đều < 1× realtime, chậm
  hơn F3 (0,17–0,75×, median 0,44×) vì VM quá tải + reboot giữa chừng.
  Chậm nhất: Trúc Ly Q07 0,03× (synth 360,4 s cho 11,28 s audio);
  nhanh nhất: Trúc Ly Q14 0,33× (synth 41,1 s). Tổng thời gian synth
  2335,4 s cho 13 mẫu (223,55 s audio).
- Nạp model 10,3 s (lần đầu, máy yên) tới 68,4 s (lúc quá tải); warmup
  infer đầu 2,4–15,9 s cho câu "Chào bạn!" — dao động theo tải, không
  phải đặc tính model.
- Con số "~1,5–2,5× realtime" trong memory vẫn SAI HẲN so với đo thật
  trên VM này (0,03–0,39×, không lần nào vượt 1×). KHÔNG sửa memory
  (theo quy ước các luồng trước); chỉ báo số thật ở đây. Tốc độ tổng
  hợp không ảnh hưởng độ dài WAV hay toast (chỉ ảnh hưởng thời gian
  chờ khi bấm TTS).

## 6. Kiểm chứng (số thật)

- Test đỏ-trước (helper H1 + nối UI): chạy TRƯỚC khi viết helper —
  esbuild bundle **lỗi `Could not resolve "./ttsEstimate51H1"`** (đỏ
  đúng nghĩa: helper chưa tồn tại). Sau khi viết helper + nối TtsButton:
  **11/11**.
- Test mới H1 **11/11** (`ttsEstimate51H1.test.ts` — nối UI, text
  Q07/Q09/Q14, neo A1, sửa lỗi 10–12% (6 mẫu F3), đơn điệu giảm 4
  giọng, chứa mọi mẫu thăm dò F3+H1, khái quát sang D1 + X2, khóa nút
  φ, fallback y hệt F3, header thật thắng ước lượng, tốc độ tổng hợp
  < 1×).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate47C4.test.ts` **10/10**, `ttsEstimate48D1.test.ts`
  **12/12**, `ttsEstimate46B3.test.ts` **7/7**,
  `ttsEstimate45A3.test.ts` **10/10**, `ttsDuration44Z3.test.ts`
  **9/9**, `ttsEstimate49E1.test.ts` **13/13**,
  `ttsEstimate50F3.test.ts` **15/15** — fail 0. (Các test D1/E1/B3/F3
  có assertion nối UI đã cập nhật sang H1 theo đúng mẫu F3 đã làm với
  E1/D1/B3 — xem §7.)
- `tsc --noEmit` trong `apps/web`: **sạch, 0 lỗi** (sau khi sửa 2 lỗi
  import: `TtsEstimateRange47C4` thừa + `TtsTier45A3` phải import từ
  `ttsEstimate45A3`, không phải `ttsEstimate47C4`).
- `vite build`: **pass** (built in 7,06 s; chỉ cảnh báo chunk > 500 kB
  có sẵn, không liên quan luồng này).

## 7. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:
1. `apps/web/src/lib/ttsEstimate51H1.ts` — helper đường cong H1 (bảng
   mẫu 13 mẫu + nút φ đã khóa + interface nhận bảng hệ số + fallback F3).
2. `apps/web/src/lib/ttsEstimate51H1.test.ts` — test mới 11/11.
3. `docs/PHASE9_ROUND51_H1_TTS_CURVE_LIMITS.md` — chính tài liệu này.

Đổi:
1. `apps/web/src/components/TtsButton.tsx` — chuyển từ helper F3 sang
   helper H1 (1 import + 1 lời gọi + comment ROUND51-H1); không đổi
   logic nào khác.
2. `apps/web/src/lib/ttsEstimate50F3.test.ts` — chỉ §1 (nối UI) +
   comment header §1: assertion chuyển từ helper F3 sang helper H1.
3. `apps/web/src/lib/ttsEstimate49E1.test.ts` — chỉ §1 (nối UI) +
   comment header §1: assertion chuyển từ helper F3 sang helper H1.
4. `apps/web/src/lib/ttsEstimate48D1.test.ts` — chỉ §1 (nối UI) +
   comment header §1: assertion chuyển từ helper F3 sang helper H1.
5. `apps/web/src/lib/ttsEstimate46B3.test.ts` — chỉ §4 (nối UI):
   assertion chuyển từ helper F3 sang helper H1.
6. `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới H1
   (file này cũng được các luồng H2/H5/H6 đợt 51 sửa song song — luồng
   này chỉ append dòng của mình, không chạm dòng khác).

Không đổi: `ttsEstimate50F3.ts` (H2 sở hữu — helper H1 chỉ import
bảng hệ số của nó, không sửa), `ttsEstimate49E1.ts`,
`ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`, `ttsEstimate46B3.ts`,
`ttsEstimate45A3.ts`, `ttsDuration44Z3.ts`, mọi file test khác,
bridge, mọi file luồng khác đợt 51 (kiểm tra: không file ROUND51 nào
khác nhắc tới TtsButton hay ttsEstimate ngoài H2 — H2 sở hữu bảng hệ
số, không chạm helper H1).

File đo + script (`/tmp/tts51h1/*.wav` 11 file còn lại, `results.jsonl`,
`drive51h1.py`, `loop51h1.sh`, `verify51h1.py`, `compute51h1.py`, log
driver + verify + compute) nằm ngoài repo, không stage. Bản sao chống
restart/mất dữ liệu của toàn bộ số đo + log + script nằm ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts51h1/`
(results.jsonl ĐẦY ĐỦ 13 mẫu + 15 meta, drive51h1.log,
drive51h1.stdout.log, loop51h1.stdout.log, verify51h1.log,
verify51h1.py, drive51h1.py, loop51h1.sh, compute51h1.py,
compute51h1.log) — chỉ là backup số đo, không phải file repo, không
stage.

## 8. Nợ mở còn lại (sau luồng này)

1. Mỗi điểm đường cong mới chỉ n = 1 (trừ neo A1) — φ của từng giọng
   tại từng nút dựa trên ĐÚNG 1 lần đo; cần đo lặp thêm cho các điểm
   giữa (ưu tiên Q14 — độ lệch φ giữa các giọng lớn nhất 0,124 — và
   Trúc Ly, giọng nhanh nhất, chỉ có 5 điểm).
2. Ngoại suy ngoài 15,96% CHƯA ĐO: φ ngoài khoảng đo dùng ngoại suy
   tuyến tính theo đoạn cuối + sàn tốc độ 3,0 ký tự/giây (chưa có dữ
   liệu kiểm chứng; text > 16% chữ số hiếm nhưng có thể gặp với text
   toàn số/mã).
3. Bảng hệ số dùng tạm bảng F3 — H2 sở hữu bảng hệ số đợt 51; khi H2
   xong, TtsButton chỉ cần truyền bảng mới vào helper H1 (đã thiết kế
   interface sẵn), không đổi code helper. Hệ số n = 1 của đa số giọng
   (nợ F3 §8.2) vẫn đứng — H2 đang đo lặp.
4. Text khác nhau gây nhiễu ngoài tỉ lệ chữ số: D1 cho thấy cùng tỉ lệ
   gần nhau nhưng text khác nhau có thể lệch tốc độ (Hải Đăng T5 5,08%
   đọc 16,27 ký tự/giây, nhanh hơn đường cong dự báo ~14,7) — đường
   cong hiện tại chỉ dùng tỉ lệ chữ số + hệ số giọng; muốn chính xác
   hơn cần mô hình theo đặc trưng text (độ dài từ, dấu câu, chunk
   "2.4.1"...), ngoài phạm vi luồng này.
5. Tốc độ tổng hợp 0,03–0,39× realtime (median ~0,10×), mâu thuẫn con
   số "~1,5–2,5×" trong memory — chưa rõ memory ghi trên máy khác hay
   model khác; không sửa memory theo quy ước.
6. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem
   LIMITS C4 §6.5).
7. Rủi ro mất dữ liệu khi VM reboot xóa /tmp: đã giảm nhẹ bằng backup
   số đo + script vào hidden_files NGAY trong lúc đo (lần này backup
   cứu được 2 mẫu đầu sau reboot) — nhưng WAV vẫn chỉ ở /tmp; các lần
   đo sau giữ nguyên cơ chế này, và nên ffprobe-verify từng WAV NGAY
   khi nó xuất hiện (luồng này đã làm từ mẫu thứ 3 trở đi).
8. VM quá tải khi 8–10 luồng đo/chạy nặng song song: driver TTS bị
   SIGKILL 14 lần trong một lượt; đợt sau nên chạy đo TTS dài bằng
   vòng lặp resume ngay từ đầu (mẫu `loop51h1.sh`), hoặc xếp lịch đo
   TTS tránh giờ cao điểm của các luồng nặng khác.
