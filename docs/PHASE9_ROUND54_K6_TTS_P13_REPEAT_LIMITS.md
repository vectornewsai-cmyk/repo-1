# Phase 9 — Đợt 54, luồng K6: Đo lặp P13 vs M3 Trúc Ly + transfer text thứ ba M6 (nợ LIMITS J7 §8.1 + §8.2 — ĐÃ ĐÓNG 2/2)

Ngày: 07/11/2026 (giờ +07, lượt cron 06:35). KHÔNG push, KHÔNG tag/release,
KHÔNG binary vào batch (WAV đo ở `/tmp/tts54k6/` + bản copy
`hidden_files/tts54k6/wav/` — ngoài repo; chỉ số đo + code text vào repo).
Chỉ sửa file text trong `~/workspace/repo-1` trong phạm vi TTS (6 mẫu K6
vào H1 + text/mẫu transfer M6 vào H2 + test của chúng + LIMITS này).
Nút φ P13 KHÔNG đổi (số lặp chứng minh nút cũ vẫn đúng — xem §3).

## 0. Bối cảnh (đọc từ LIMITS J7 §8)

Hai nợ mở giao cho luồng này, cả hai đều từ LIMITS J7 §8:

1. **Thứ tự P13 > M3 của Trúc Ly biên mỏng (0,02 ký tự/giây)** — 1 mẫu
   P13 duy nhất đợt 53 (12,89 s → 13,11 ký tự/giây) chỉ nhỉnh hơn tốc
   độ dense gộp (13,09) 0,02 ký tự/giây; cần đo lặp P13 (và M3) để xác
   nhận thứ tự có ổn định không.
2. **Transfer mới đo trên 1 text thứ hai (M5) cho 4 giọng** — chưa đo
   text medium thứ ba cho các giọng chậm để xem transfer trên text có
   chữ số có ổn định ở ~1,17 hay cũng dao động theo text; 21 giọng còn
   lại chưa đo transfer.

## 1. Việc luồng này làm

1. Đo LẶP P13 vs M3 cho Trúc Ly, n = 3 mỗi text, XEN KẼ (P13, M3, P13,
   M3, P13, M3) để triệt drift theo thời gian — 6 mẫu.
2. Đo transfer trên TEXT THỨ BA M6 (text mới: 183 ký tự, 23 chữ số =
   12,57% — cùng dải tỉ lệ chữ số với P13/M3, khác hẳn M4 0 chữ số và
   M5 0 chữ số; không tên riêng người/địa danh), n = 2 cho 4 giọng đã
   đo ở đợt 53 (Đức Trí / Kim Thanh / Thiền Tâm Đức / Hải Đăng) — 8 mẫu.
3. Tính lại φ(P13) Trúc Ly gộp 4 mẫu (J7 + K6) + φ gộp 4 giọng; quyết
   định nút φ có đổi không (chỉ đổi khi số lặp chứng minh).
4. Verify WAV (ffprobe + im lặng), cập nhật lib H1/H2 + test hồi quy,
   chạy tsc + vite build, viết LIMITS này, stage batch riêng.

## 2. Số đo thật mới (ĐO XONG — 14 mẫu, 3 lần chạy driver, resume 2 lần)

Driver: `hidden_files/tts54k6/drive54k6.py` (bản drive53j7.py — retry +
fallback đĩa + dual-write WAV về đĩa ngay; KHÔNG mẫu ép fallback vì
fallback đã chứng minh chạy thật ở J7). Nạp model 17,6 / 7,2 / 7,9 s
(3 lần chạy); warmup 2,2 / 1,7 / 1,7 s (câu "Chào bạn!", Hải Đăng).
Chạy với `nice -n 10`. KHÔNG có lỗi ghi WAV nào; fallback không kích
hoạt (không cần). Mỗi dòng kết quả ghi ĐỒNG THỜI vào
`/tmp/tts54k6/results.jsonl` và bản sao `hidden_files/tts54k6/results.jsonl`
NGAY trong lúc đo (flush + fsync). WAV ở `/tmp/tts54k6/` (11 file còn
lại) + bản copy `hidden_files/tts54k6/wav/` (14 file — kiểm chứng đủ,
xem §6).

### 2.1 Đo lặp P13 vs M3 — Trúc Ly (n = 3 mỗi text, xen kẽ)

| Text | Lần 1 (s) | Lần 2 (s) | Lần 3 (s) | Tốc độ từng lần (ký tự/s) | Tốc độ gộp (ký tự/s) | Spread |
| --- | --- | --- | --- | --- | --- | --- |
| P13 (169 ký tự, 21 chữ số) | 13,14 | 12,89 | 12,30 | 12,86 / 13,11 / 13,74 | **13,2272** | 6,6% |
| M3 (178 ký tự, 24 chữ số) | 13,79 | 13,98 | 13,77 | 12,91 / 12,73 / 12,93 | **12,8551** | 1,5% |

**Kết luận đo lặp — NỢ J7 §8.2 ĐÃ ĐÓNG (thứ tự P13 > M3 GIỮ VỮNG):**

- P13 gộp (n = 3) **13,2272** nhanh hơn M3 gộp (n = 3) **12,8551**
  **+0,3722 ký tự/giây (+2,90%)** — biên gộp nay là +0,37, không còn
  mỏng như +0,02 của 1 mẫu J7.
- **7/9 cặp** P13-vs-M3 trong phiên: P13 nhanh hơn M3. 2 cặp đảo đều
  do mẫu P13-TL-1 (12,86) chậm hơn M3-TL-1 (12,91) và M3-TL-3 (12,93)
  — tức thứ tự KHÔNG tuyệt đối ở từng lần đo đơn lẻ, chỉ vững ở mức
  gộp. Ghi rõ để đợt sau khỏi tưởng 3/3 lần nào P13 cũng nhanh hơn M3.
- P13 gộp 4 mẫu (J7 12,89 s + K6 n = 3): **13,1980** ký tự/giây —
  vẫn nhanh hơn dense gộp F3 (13,0882) +0,11 và dense H2 (12,7113)
  +0,49. Đơn điệu giảm 8 điểm của Trúc Ly GIỮ VỮNG với P13 gộp 4 mẫu
  (19,56 > 15,25 > 13,95 > 13,25 > 13,20 > 13,09 > 12,22 > 12,04).
- Spread P13 6,6% (12,30–13,14 s) lớn hẳn M3 1,5% — mẫu P13-TL-3
  (12,30 s) nhanh bất thường so với 2 lần còn lại; không loại bỏ
  (không có bằng chứng lỗi đo — WAV verify khớp, xem §6) nhưng ghi
  rõ: nếu chỉ có P13-TL-3 thì biên còn lớn hơn; nếu không có nó thì
  P13 gộp n = 2 là 12,98 — VẪN nhanh hơn M3 gộp 12,86 (+0,12).
  Kết luận không phụ thuộc vào 1 mẫu nhanh nhất.

### 2.2 Transfer M6 (8 mẫu, n = 2 mỗi giọng)

Text M6 (183 ký tự, 23 chữ số = 12,57%): "Ngày 20 tháng 12 năm 2026,
VCut Studio ra mắt bản 4.0 với 52 tính năng mới, sửa 214 lỗi và tăng
tốc xuất video lên 60% so với bản 3.5, hỗ trợ dựng 8K, 120 khung hình
mỗi giây cho bạn." — khác hẳn M4 (0 chữ số, nhiều tên riêng) và M5
(0 chữ số, dấu câu dày); không tên riêng người/địa danh.

| Giọng | M6 lần 1 (s) | M6 lần 2 (s) | Spread | v_M6 gộp (ký tự/s) | v_M4-only gộp | Transfer M4/M6 | Transfer M5 (J7) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Đức Trí | 21,51 | 22,09 | 2,7% | 8,3945 | 12,1408 | **1,4463** | 0,9099 |
| Kim Thanh | 22,54 | 23,51 | 4,2% | 7,9479 | 12,5247 | **1,5759** | 1,0072 |
| Thiền Tâm Đức | 20,79 | 19,72 | 5,3% | 9,0348 | 12,8030 | **1,4171** | 0,9003 |
| Hải Đăng | 14,74 | 14,55 | 1,3% | 12,4957 | 19,0315 | **1,5230** | 0,9736 |

**Kết luận transfer — NỢ J7 §8.1 ĐÃ ĐÓNG (giả thuyết "transfer phụ thuộc
text" GIỮ VỮNG, và nay có thang đo rõ):**

- Transfer M6: **1,42–1,58, mean 1,4906** — CAO HẲN transfer M5
  (0,90–1,01) lẫn 1,1721 (T2/T4/T5 ít số, F3 §4.5). Cùng một giọng,
  đổi text medium là transfer đổi hẳn: Hải Đăng M5 0,9736 → M6 1,5230
  (**+56,4%**); M6 khác 1,1721 tới **+29,9%**.
- Thang đo theo tỉ lệ chữ số của text: 0% → ~0,95 (M5); ít số →
  1,17 (T2/T4/T5); ~13% → ~1,49 (M6). Đúng mô hình đường cong H1
  (tốc độ phụ thuộc tỉ lệ chữ số) — transfer không phải hằng số giọng.
- **1,1721 nay được đặt lại đúng chỗ:** đó là transfer của text ÍT SỐ,
  không phải biên trên chung của transfer. Lo ngại "biên dư cho transfer
  đã hết" ở J7 §2.1 chỉ đúng với text ít số; text ~13% chữ số cho
  transfer ~1,5 là đúng mô hình đường cong, không phải lỗi.
- M6 hành xử như text dense: tốc độ gộp M6 chỉ nhanh hơn dense H2
  **+1,6–8,0%** (Đức Trí +2,0%, Kim Thanh +1,6%, Thiền Tâm Đức +8,0%,
  Hải Đăng +5,7%) — nằm gọn trong h = 0,17 của hệ số dense; transfer
  M6 cũng chỉ thấp hơn transfer suy ra từ M3 (v_M4-only / v_dense)
  1,6–7,4% (M6 12,57% chữ số < M3 13,48% nên đọc nhanh hơn M3 một chút
  là đúng mô hình). Vì vậy "transfer 1,42–1,58 vượt 1,17" KHÔNG phải
  vi phạm khoảng h — h áp cho độ lệch so với tâm của đúng lớp text
  (dense), không phải cho tỉ số v_M4/v_text (tỉ số này vốn dao động
  theo text, từ ~0,95 tới ~1,6). **KHÔNG nới h = 0,17.**

## 3. Cập nhật hệ số + test (ĐO XONG)

### 3.1 Nút φ P13 — KHÔNG ĐỔI (số lặp chứng minh nút cũ vẫn đúng)

- φ(P13) Trúc Ly gộp 4 mẫu (J7 + K6), cơ sở F3: **0,9830** (J7 1 mẫu:
  0,997; cơ sở H2: 0,9270). Vẫn < 1 — P13 vẫn nhanh hơn dense.
- φ gộp 4 giọng tại P13 tính lại: [KT 0,928, DT 0,974, QA 0,972,
  TL 0,983] → mean **0,9642**, chênh **−0,0038** so với nút khóa 0,968
  — trong dung sai ±0,005 của test §6 nên nút KHÔNG đổi (đúng quy tắc
  "chỉ cập nhật khi số đo lặp chứng minh").
- `ttsEstimate51H1.ts`: thêm 6 mẫu K6-P13/M3-TL (nay 22 mẫu; `source`
  thêm "K6") + header cập nhật (ghi rõ biên gộp +0,37, φ gộp tính lại
  0,9642, nút không đổi). Nút φ P10/P13/P16 KHÔNG sửa.
- `ttsEstimate51H1.test.ts`: đếm mẫu 16 → 22; thêm §7 mới khóa đo lặp
  (P13 gộp 13,2272 > M3 gộp 12,8551; 7/9 cặp; spread ≤ 10%; φ(P13) TL
  gộp 4 mẫu ≈ 0,983; φ gộp tính lại 0,9642 trong ±0,005 của nút khóa
  0,968); renumber fallback 7 → 8, synth 8 → 9. Test §5 vẫn dùng mẫu
  J7-P13-TL đơn lẻ cho chuỗi đơn điệu (13,11 > 13,09) và vẫn pass.

### 3.2 Transfer M6 — KHÓA TRONG TEST H2 (bảng hệ số H2 KHÔNG ĐỔI)

- `ttsEstimate51H2.ts`: thêm text M6 (`TTS_STANDARD_TEXT_M6_54K6`,
  183 ký tự, 23 chữ số) + 8 mẫu (`TTS_SAMPLES_M6_54K6`) + tốc độ
  tổng hợp K6 (`TTS_SYNTH_SPEED_54K6`, 14 entry) + ghi chú TRANSFER M6
  (số transfer + lý do không gộp vào bảng + giải thích h không bị vi phạm).
- `ttsEstimate51H2.test.ts`: thêm §10 — tính lại transfer từ pool
  M4-only + mẫu M6, khóa 4 giá trị (1,4463 / 1,5759 / 1,4171 / 1,5230,
  dung sai ±0,002); khóa transfer M6 của Hải Đăng khác rõ cả M5 (0,9736)
  lẫn 1,1721 (chênh > 0,15); khóa tốc độ M6 trong h = 0,17 của dense;
  khóa lặp M6 spread ≤ 10%; khóa 8 mẫu M6 KHÔNG vào pool H2 (normalN
  giữ nguyên — test §3 vẫn tính lại khớp bảng).
- Quyết định KHÔNG gộp M6 vào bảng H2 (như M5, có số): M6 là text
  số-dày (12,57% chữ số), bản chất thuộc lớp dense chứ không phải
  normal — gộp vào pool normal sẽ dịch hệ số normal xuống mạnh (tốc độ
  M6 chỉ ~65–70% tốc độ M4) chỉ vì đổi thành phần blend. Nếu đợt sau
  quyết định tách hệ số theo lớp text (normal/dense đã có sẵn trong
  mô hình đường cong H1), đó là quyết định thiết kế riêng.

## 4. Tốc độ tổng hợp (ĐO XONG — 14 lần đo, số thật)

- Tỉ lệ audio/synth **0,08–0,59×, median 0,19×, tổng synth 1400,4 s**
  (nạp model 17,6/7,2/7,9 s + warmup 2,2/1,7/1,7 s qua 3 lần chạy,
  không tính vào mẫu). Đều < 1× realtime — vẫn mâu thuẫn "~1,5–2,5×"
  trong memory; không sửa memory theo quy ước.
- **Chậm nhất từ trước tới nay** (J7 median 0,51×; F3 0,44×; H2 0,12×)
  vì VM quá tải suốt lượt: load 7–11 (8–10 luồng đợt 54 chạy song song),
  synth một mẫu M3 lên tới 201,2 s. Độ dài audio KHÔNG bị ảnh hưởng
  (đo từ header WAV — tỉ lệ ký tự/giây là thuộc tính của audio).
- Từng mẫu: P13-TL-1 13,14/66,2 (0,20×); M3-TL-1 13,79/147,4 (0,09×);
  P13-TL-2 12,89/40,3 (0,32×); M3-TL-2 13,98/23,8 (0,59×); P13-TL-3
  12,30/26,2 (0,47×); M3-TL-3 13,77/170,5 (0,08×); T01 21,51/111,8
  (0,19×); T02 22,09/119,7 (0,18×); T03 22,54/181,7 (0,12×); T04
  23,51/122,2 (0,19×); T05 20,79/201,2 (0,10×); T06 19,72/41,1
  (0,48×); T07 14,74/56,0 (0,26×); T08 14,55/92,3 (0,16×).

## 5. Sự cố trong lượt (trung thực, không giấu)

1. **VM restart giữa chừng** (~23:47, uptime reset về 1 phút, /tmp bị
   xóa) sau 3 mẫu đầu (P13-TL-1, M3-TL-1, P13-TL-2). Dual-write cứu
   cả 3 mẫu + 3 WAV (số đo trong `hidden_files/tts54k6/results.jsonl`,
   WAV trong `hidden_files/tts54k6/wav/`). Driver resume bỏ qua 3 mẫu
   đã đo, chạy tiếp 11 mẫu còn lại.
2. **Driver chết lặng giữa T06** (~00:06–00:10, load ~10–11): không
   traceback, không log lỗi, process biến mất giữa lúc synth T06 —
   nghi SIGKILL/OOM do VM quá tải (giống các lần SIGKILL đợt 51/52),
   nhưng KHÔNG kết luận chắc vì không quyền đọc dmesg. Resume lần 2
   hoàn tất nốt 3 mẫu (T06, T07, T08). Tổng cộng 3 lần chạy driver.
3. **Không có lỗi ghi WAV nào** trong cả 3 lần chạy; fallback không
   kích hoạt (không cần — đã chứng minh chạy thật ở J7).
4. Trail silence 0,3 s ở 4 mẫu M6 (T03–T06) — đúng ngưỡng 0,3 s, pass
   (không flag); gap trong dài nhất 0,7 s ở nhiều mẫu M6 do dấu câu +
   số trong text, không phải lỗi đọc. Độ dài đo là thời gian đọc thật
   từ header nên im lặng không làm sai số đo (cùng phương pháp với
   H1/J7).
5. Load lúc bắt đầu đo 0,93 (máy yên) rồi lên 7–11 khi các luồng đợt
   54 khác vào guồng — synth chậm theo tải nhưng số đo độ dài không
   đổi (xem §4).

## 6. Verify WAV (verify54k6.py — ĐO XONG)

- **14/14 WAV khớp ffprobe từng mili-giây** (header vs ffprobe, sai số
  < 0,005 s). 11 WAV còn ở /tmp; 3 WAV đầu mất bản /tmp theo VM restart
  nhưng bản backup verify khớp (script verify đã vá để kiểm tra bản
  backup khi bản /tmp mất — log ghi rõ từng file). Cả 14 WAV còn trên
  đĩa persistent (`hidden_files/tts54k6/wav/`).
- Lead silence 0,0–0,1 s; trail silence 0,0–0,3 s; gap trong dài nhất
  0,7 s. Không có flag nào vượt ngưỡng.
- Log verify: `hidden_files/tts54k6/verify54k6.log` (chạy lại từ
  results.jsonl backup).

## 7. Kiểm chứng (số thật)

- Test mới/cập nhật: H1 **12/12** (ESM bundle — 11 cũ + 1 mới §7 đo lặp
  P13/M3), H2 **14/14** (CJS bundle — 12 cũ + 2 mới §10 transfer M6 +
  synth K6).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate50F3.test.ts` **15/15**, `ttsEstimate47C4.test.ts`
  **10/10**, `ttsEstimate48D1.test.ts` **12/12**,
  `ttsEstimate49E1.test.ts` **13/13** — fail 0.
- `tsc --noEmit` trong `apps/web`: **0 lỗi** (chạy 1 lần, pass ngay).
- `vite build` (từ `apps/web`): **pass** (built in 6,16 s; chỉ cảnh báo
  chunk > 500 kB có sẵn, không liên quan luồng này).
- KHÔNG chạy lại ở lượt này: mọi phép đo browser headed/FPS, click-test
  headed, Safari/máy thật.

## 8. Nợ mở còn lại (sau luồng này)

1. **Thứ tự P13 > M3 không tuyệt đối ở từng lần đo đơn lẻ** (2/9 cặp
   đảo, đều do P13-TL-1) — kết luận vững ở mức gộp, nhưng nếu đợt sau
   cần chắc chắn tuyệt đối thì đo thêm n = 3 nữa cho P13; với mục đích
   khóa nút φ thì bằng chứng hiện tại đã đủ (φ gộp trong dung sai).
2. **Transfer mới đo trên 2 text thứ hai/thứ ba (M5, M6) cho 4 giọng**
   — 21 giọng còn lại chưa đo transfer; transfer trên text dài hoặc
   text tỉ lệ chữ số khác (vd ~5%, ~20%) chưa đo — thang đo theo tỉ
   lệ chữ số hiện chỉ có 3 điểm (0% / ít số / ~13%).
3. **Nguyên nhân gốc driver chết lặng / SIGKILL vẫn chưa rõ** (không
   quyền đọc dmesg) — nay resume + dual-write đã cứu được mọi mẫu nên
   rủi ro đã giảm, nhưng nếu lỗi lặp lại thì nên điều tra sâu hơn
   (chạy driver lúc máy yên, hoặc ghi thẳng sang đĩa persistent).
4. **M5 nhanh hơn M4 ~10% ở giọng chậm — cơ chế chưa chứng minh** (giả
   thiết tên riêng làm chậm M4, J7 §8.4 — vẫn mở; M6 không tách được
   giả thiết này vì M6 có chữ số và đọc chậm như dense, phù hợp đường
   cong, không liên quan tên riêng).
5. **h = 0,17 vẫn giữ** — transfer không phải đại lượng bị chặn bởi h
   (ghi rõ ở §2.2 để đợt sau khỏi hiểu lầm mà nới h hoặc báo vi phạm giả).
6. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem LIMITS
   C4 §6.5). Tốc độ tổng hợp vẫn < 1× realtime trên VM này (median
   0,19× đợt này — chậm nhất từ trước tới nay vì VM quá tải).

## 9. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Đổi:
1. `apps/web/src/lib/ttsEstimate51H1.ts` — thêm 6 mẫu K6-P13/M3-TL
   (nay 22 mẫu; `source` thêm "K6") + header cập nhật (biên gộp +0,37,
   φ gộp tính lại 0,9642, nút φ KHÔNG đổi).
2. `apps/web/src/lib/ttsEstimate51H1.test.ts` — đếm mẫu 16 → 22, thêm
   §7 khóa đo lặp P13/M3, renumber fallback 7 → 8, synth 8 → 9. 12/12.
3. `apps/web/src/lib/ttsEstimate51H2.ts` — text M6 + 8 mẫu M6 + tốc độ
   tổng hợp K6 (14 entry) + ghi chú TRANSFER M6 (số transfer + lý do
   không gộp vào bảng + giải thích h không bị vi phạm). Bảng hệ số H2
   KHÔNG đổi.
4. `apps/web/src/lib/ttsEstimate51H2.test.ts` — §10 mới: transfer M6 +
   synth K6 + header mục lục. 14/14.

Mới:
1. `docs/PHASE9_ROUND54_K6_TTS_P13_REPEAT_LIMITS.md` — chính tài liệu này.

Không đổi: `ttsEstimate50F3.ts` (giữ nguyên số F3 — bản ghi lịch sử,
transfer 1,1721 vẫn khóa ở test F3 §5), `ttsEstimate51H2.ts` bảng hệ số,
`ttsEstimate49E1.ts`, `ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`,
`TtsButton.tsx`, mọi file test khác, bridge, mọi file luồng khác đợt 54.
Không sửa file chung nào khác.

File đo + script (ngoài repo, không stage — trong
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts54k6/`):
`drive54k6.py` (driver — resume + retry + fallback đĩa + copy WAV về
đĩa ngay), `drive54k6.log` (+ bản /tmp), `results.jsonl` (14 mẫu + 3 meta
run, dual-write với /tmp), `compute54k6.py` (+ `compute54k6.log`,
transfer M6 + đo lặp P13/M3 + synth), `verify54k6.py` (+
`verify54k6.log`, đã vá kiểm tra bản backup khi /tmp mất), `wav/`
(14 WAV đã verify, ngoài repo, không stage).
Dữ liệu đo gốc vẫn ở `hidden_files/tts54k6/results.jsonl` — driver
resume đọc chính file này.
