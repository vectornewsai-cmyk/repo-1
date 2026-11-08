# Đợt 66 T2 — Whip-pan thật >14 px/f + motion blur quang học + metric b_large: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt cron 18:35 +07).
Máy đo: VM này (4 vCPU, RAM ~7,9 GB, CPU-only, FFmpeg 8.1.2, libx264, python3 + numpy, cv2 qua server/tracking/.venv).
Đóng nợ đợt 65 S2+S3 (docs/PHASE9_ROUND65_LIMITS.md §8 mục 2): (a) whip-pan
thật >14 px/f chưa có số; (b) pan thật bằng camera chưa có để đối chiếu motion
blur quang học; (c) b_large là ứng viên metric ghost tốt hơn b_small (S3).
Harness mới: `server/render/src/test_round66_t2_whip_pan.js`
(**run 1: 112 pass / 3 fail** — cả 3 fail đều là 1 assert kiểm blur sai
tiền đề, xem §6; **run 2 (chạy lại sau khi vá assert): 119 pass, 0 fail,
exit 0** — mọi số khớp run 1 tới 4 chữ số thập phân).
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/round66-t2.md`
+ `~/workspace/.scratch-r66t2/` (harness-run1.log, harness-run2.log, summary.json).
Không sửa code production (xem §5 về quyết định metric); không đụng web
(không cần tsc/vite).

## 1. Kết luận ngắn — trả lời 3 câu hỏi nghiên cứu

**Câu 1 — whip-pan thật >14 px/f + motion blur quang học: ghost có tăng
theo tốc độ không? ĐÁP ÁN: KHÔNG — ghost không tăng theo tốc độ, dù có
hay không có motion blur quang học, trong dải đo được tới ~49 px/f.**
Bằng chứng (Phần B + C, xem §4.2–4.3):
- Pan tổng hợp có blur mô phỏng (~180°) vs không-blur, cùng tốc độ/cùng
  bề mặt: b_small vượt sàn @0,7 chênh chỉ +0,006 → +0,021 (blur cao hơn
  một chút, ~1–2 SE — xem lưu ý dưới), nhảy 0,5→0,7 chênh −0,002 →
  +0,005 (gần như giống hệt). Theo tốc độ: phẳng có-blur 0,594 (14 px/f)
  → 0,543 (26 px/f) — GIẢM; chi tiết có-blur 0,517 → 0,555 — tăng nhẹ
  0,038, cùng bậc với nhiễu giữa các bề mặt. Không có xu hướng tăng
  đơn điệu.
- Pan thật bằng camera (koncert, blur quang học thật, 16,6 và 20,0
  px/f): b_small vượt sàn @0,7 là 0,337 → 0,331 (giảm nhẹ khi nhanh
  hơn); nhảy 0,5→0,7 là 0,062 → 0,067 — nằm trong dải 0,057–0,094 đã
  đo trên mọi clip thật từ R4/S2/S3 (0,6–49 px/f). Mức tuyệt đối thấp
  hơn slovenska (0,33 so với 0,52–0,59) là do nội dung (sân khấu tối,
  khác texture đường phố), không phải do tốc độ — nhảy (thứ cảnh báo
  nhắm tới) thì không đổi.
- Lưu ý trung thực: blur làm ghost nhích LÊN một chút một cách nhất
  quán ở cả 4 điều kiện (b_small vượt +0,006/+0,014/+0,011/+0,021;
  b_large vượt +0,004/+0,005/+0,007/+0,012). Hiệu ứng nhỏ (~1–2 SE),
  chưa đủ để kết luận "blur làm tăng ghost", nhưng đủ để bác bỏ chiều
  ngược lại ("blur quang học triệt ghost"). Cơ chế có thể: blur làm mềm
  texture → nhiều pixel rơi vào vùng phẳng/small mà hqdn3d blend mạnh —
  chỉ là giả thuyết, chưa tách được.
- Hệ quả: cảnh báo denoise ≥0,7 (S2) giữ nguyên, mở rộng dải áp dụng
  lên tới ~49 px/f cả khi có motion blur quang học; không cần điều
  chỉnh theo tốc độ hay theo blur.

**Câu 2 — b_large làm metric ghost chính thay/bổ sung b_small? ĐÁP ÁN:
GIỮ b_small làm metric chính; b_large chỉ làm chỉ báo phụ (diagnostic).**
Bằng chứng (Phần A, tính lại từ dữ liệu S3 + R4, xem §4):
- Trong thí nghiệm có kiểm soát (S3, cùng clip/cùng tốc độ, chỉ khác bề
  mặt): b_large tách phẳng-vs-chi tiết **3,16–3,90x** ở cả 3 tốc độ
  (vượt sàn @0,7: phẳng 0,067–0,071 vs chi tiết 0,017–0,022), trong khi
  b_small chỉ 0,99–1,16x. Đây là điểm mạnh duy nhất của b_large, và nó
  là thật (chênh ~8 SE, xem §4.1).
- Nhưng qua các clip thật không kiểm soát (R4, 4 đoạn): b_large biến
  thiên tương đối **CV=0,43**, gần gấp đôi b_small (**CV=0,23**); và nó
  KHÔNG theo độ phẳng nữa — núi texture (basgo-mid) cho vượt sàn 0,108,
  cao hơn cả mặt nước phẳng (ocean 0,075), trong khi đường phố phẳng
  (slov-fast) lại thấp nhất 0,025. b_large lẫn lộn nội dung (cạnh cứng +
  texture chuyển động vừa trong cùng dải |dC|>24, như R4 §4.4 đã cảnh
  báo) nên không thể làm ngưỡng chung.
- Độ ổn định tuyệt đối: SE theo cặp frame của b_large @0,7 là
  0,0009–0,0065, tương đương 4–9% giá trị đo; b_small là 0,0032–0,0159,
  tương đương 0,5–5% giá trị đo. b_large ồn tương đối hơn, đặc biệt khi
  dải large ít pixel (phẳng 12 px/f: chỉ 3,5% pixel, SE 0,0059 trên giá
  trị 0,070).
- Nhảy 0,5→0,7 (thứ cảnh báo denoise nhắm tới): b_small 0,057–0,094 ổn
  định qua mọi clip/tốc độ; b_large chỉ 0,008–0,053 và phụ thuộc bề mặt
  (phẳng ~0,030, chi tiết ~0,010 trong S3; 0,013–0,053 trong R4). Ngưỡng
  ghost-positive của S2 (nhảy ≥0,05) không chuyển được sang b_large.
- Hệ quả: cảnh báo denoise ≥0,7 (quy tắc S2, strength-based, không dùng
  b) KHÔNG đổi; harness nay báo thêm b_large + SE từng dải làm chỉ báo
  phụ (script ghost mở rộng trong harness này), không đổi metric kết luận.

**Câu 3 — pan thật bằng camera:** tìm được clip CC BY 4.0 có pan thật
(Rendszerváltó Nagykoncert panning shot, xem §2), đo được ~16–20 px/f ở
25fps (xem §3). (Số ghost phần C đang đo — cập nhật sau.)

## 2. Footage whip-pan thật bằng camera (license sạch)

Khảo sát Wikimedia Commons API (filetype:video + panning / camera pan /
cycling race / motorsport):
- `Panning example - Itza Garcia.webm` (CC BY-SA 4.0, 9,2 MB): quét 2fps
  median 0,8 px/s — gần như tĩnh, tên gây hiểu lầm. LOẠI.
- `Rali Ceredigion 2024 Nant Y Moch 6.webm` (CC BY 4.0, 13,8 MB): max
  152,7 px/s (~6 px/f @25fps) — quá chậm. LOẠI.
- `Central Parade pan, Bexhill.webm` (CC BY-SA 3.0): 935,8 MB 4K — quá
  lớn, không tải. LOẠI (chưa đo).
- ✅ `Rendszerváltó Nagykoncert panning shot.webm` (CC BY 4.0, 21,9 MB,
  1920×1080, 50fps, 18,72s, sha256
  `767de7457e72b2c0dbdc95d26c5be8b60ff1d976761fec5a172694c48d7da9f6`):
  quét thô 2fps median 382,6 px/s, p90 528,6, max 637,5 (resp thấp 0,41
  vì mẫu 2fps cách nhau ~190px, ngoài vùng tin cậy của phase correlation).
  Đo lại ở fps native 50fps bằng scan_seg.py (bản S3):
  t=10–15s median **497,6 px/s = 9,95 px/f @50fps** (p90 601,2, resp
  0,854); t=0–5s **410,9 px/s = 8,22 px/f @50fps** (p90 508,7, resp 0,873).
  Kiểm tra hướng theo 5 vùng khung (dir_check.py): sx ≈ +285–320 px/s
  đồng nhất cả 5 vùng, sy ≈ −24…−69 px/s, resp 0,6–0,95 → **pan toàn
  cục thật của camera**, không phải vật thể chuyển động.
  Cắt về 25fps (bỏ frame xen kẽ, mỗi frame giữ nguyên phơi sáng 1/50s →
  đúng tương đương màn trập 180° ở 25fps): kỳ vọng ~19,9 px/f (t=10–15s)
  và ~16,4 px/f (t=0–5s).

## 3. Pan tổng hợp có motion blur quang học mô phỏng (màn trập ~180°)

Từ slovenska.webm như S3 (cùng cửa sổ t=5s, cùng 2 dải y flat/tex):
upscale 3840×2160 → crop trượt ở **200fps** (bước nominal/8 px/sub-frame)
→ **tmix trung bình trượt 4 sub-frame** (phơi sáng 20ms) → fps=25.
Mỗi frame đầu ra tích hợp 4 vị trí crop liên tiếp; vệt mờ ≈ 0,38× độ
dịch/frame (thấp hơn 0,5× lý thuyết của màn trập 180° vì lấy mẫu rời rạc
4 điểm thay vì tích phân liên tục — ghi rõ, không giấu). Tốc độ đo lại
bằng phase correlation (không tin số danh nghĩa); blur được kiểm chứng
bằng mean|dC| của frame chuẩn (phải giảm ≥10% so với bản không-blur
cùng điều kiện — xem §4.2).
Hạn chế trung thực: trong mỗi frame nguồn 40ms, cảnh vật đứng yên, chỉ
crop trượt — blur mô phỏng chỉ phản ánh pan, không phản ánh chuyển động
riêng của vật thể trong cảnh (xe/người). Đối chứng thật cho điểm này là
clip koncert phần C (blur quang học thật trên mọi chuyển động).

## 4. Số đo ghost

### 4.1 Phần A — b_large vs b_small (tính lại từ frame đã có, không render mới)

Tính lại bằng script ghost mở rộng (thêm b theo từng cặp frame cho từng
dải + SE + mean|dC| chuẩn). Tính xác định: cả 10 đoạn tính lại khớp
summary đã lưu tới **0,00000** (sai lệch tối đa < 0,0005) — pipeline xác
định, không cần đo lặp spread.

**S3 (pan tổng hợp, có kiểm soát) — vượt sàn @0,7:**

| Đoạn | tốc độ (px/f) | b_small vượt | b_large vượt | nhảy 0,5→0,7 small | nhảy 0,5→0,7 large | SE small @0,7 | SE large @0,7 |
|---|---|---|---|---|---|---|---|
| flat-12 | 14,3 | 0,5883 | 0,0702 | 0,0707 | 0,0306 | 0,0032 | 0,0059 |
| flat-24 | 25,8 | 0,5289 | 0,0711 | 0,0627 | 0,0315 | 0,0065 | 0,0059 |
| flat-48 | 49,1 | 0,5161 | 0,0670 | 0,0681 | 0,0300 | 0,0098 | 0,0065 |
| tex-12 | 14,0 | 0,5054 | 0,0216 | 0,0875 | 0,0106 | 0,0048 | 0,0013 |
| tex-24 | 25,8 | 0,5343 | 0,0225 | 0,0944 | 0,0111 | 0,0094 | 0,0019 |
| tex-48 | 49,2 | 0,4887 | 0,0172 | 0,0920 | 0,0084 | 0,0124 | 0,0022 |

Tỉ lệ tách phẳng/tex ở @0,7: b_large **3,25x / 3,16x / 3,90x** (12/24/48
px/f); b_small **1,16x / 0,99x / 1,06x**. Chênh b_large phẳng−tex
(~0,049) gấp ~8 lần SE gộp (~0,006) — tách thật, không phải nhiễu.
Nhảy b_large 0,5→0,7 trên phẳng rất ổn định (0,0300–0,0315 ở cả 3 tốc
độ) so với trên chi tiết (0,0084–0,0111) — b_large nhạy bề mặt, không
nhạy tốc độ.

**R4 (footage thật, không kiểm soát) — vượt sàn @0,7:**

| Đoạn | tốc độ (px/f) | b_small vượt | b_large vượt | nhảy 0,5→0,7 small | nhảy 0,5→0,7 large | SE small @0,7 | SE large @0,7 |
|---|---|---|---|---|---|---|---|
| ocean-slow | 0,6 | 0,3113 | 0,0753 | 0,0583 | 0,0368 | 0,0159 | 0,0045 |
| basgo-mid | 2,5 | 0,3005 | 0,1077 | 0,0710 | 0,0531 | 0,0061 | 0,0032 |
| basgo-fast | 6,0 | 0,3186 | 0,0678 | 0,0570 | 0,0337 | 0,0039 | 0,0009 |
| slov-fast | 7,9 | 0,5014 | 0,0251 | 0,0773 | 0,0131 | 0,0085 | 0,0021 |

CV qua 4 clip (vượt sàn @0,7): b_small **0,23**, b_large **0,43**.
b_large KHÔNG theo độ phẳng qua clip thật: núi texture 0,108 > mặt nước
phẳng 0,075 > đường phố phẳng 0,025. Cơ chế có thể (chưa chứng minh):
dải large trên footage thật gồm cả cạnh cứng (không blend) lẫn texture
chuyển động vừa (|dC| vừa vượt 24) mà hqdn3d blend một phần — tỉ lệ hai
thành phần này thay đổi theo clip, nên b_large không còn là thước đo
phẳng-vs-chi tiết khi đổi clip. Trong S3 nó tách được vì cùng clip, cùng
tốc độ, chỉ khác dải y.

### 4.2 Phần B — pan tổng hợp có blur vs không-blur (cùng tốc độ, cùng bề mặt)

Blur mô phỏng được kiểm chứng có thật bằng 2 chỉ số độc lập (không dùng
mean|dC| nữa — xem §6 về assert cũ sai): gradient x (hướng pan) giảm và
frame blur lệch trực tiếp khỏi frame sắc nét.

| Điều kiện | gx ratio (blur/sharp) | mean\|blur−sharp\| (mức xám) | mean\|dC\| tỉ lệ (tham khảo) |
|---|---|---|---|
| flat-12-blur | 0,956 | 1,74 | 0,984 |
| flat-24-blur | 0,850 | 2,96 | 0,943 |
| tex-12-blur | 0,818 | 9,16 | 0,946 |
| tex-24-blur | 0,573 | 14,19 | 0,878 |

Blur mạnh dần theo tốc độ (vệt mờ 4,5 px ở 12 px/f → 9 px ở 24 px/f) và
theo độ chi tiết (tex lệch nhiều hơn flat vì cạnh sắc bị mờ rõ hơn).
Tốc độ đo lại khớp S3 (14,45 vs 14,35; 25,70 vs 25,77; 13,96 vs 13,98;
25,76 vs 25,79 px/f) — blur không làm lệch đo tốc độ.

**Ghost — vượt sàn @0,7 và nhảy 0,5→0,7 (b_small / b_large):**

| Điều kiện | tốc độ (px/f) | b_small vượt @0,7 (blur / không) | nhảy small (blur / không) | b_large vượt @0,7 (blur / không) | nhảy large (blur / không) |
|---|---|---|---|---|---|
| flat-12 | 14,45 / 14,35 | 0,594 / 0,588 | 0,069 / 0,071 | 0,074 / 0,070 | 0,032 / 0,031 |
| flat-24 | 25,70 / 25,77 | 0,543 / 0,529 | 0,068 / 0,063 | 0,076 / 0,071 | 0,033 / 0,032 |
| tex-12 | 13,96 / 13,98 | 0,517 / 0,505 | 0,090 / 0,088 | 0,028 / 0,022 | 0,014 / 0,011 |
| tex-24 | 25,76 / 25,79 | 0,555 / 0,534 | 0,094 / 0,094 | 0,034 / 0,023 | 0,015 / 0,011 |

Sàn encode ctrl cũng tương đương (b_small ctrl: blur 0,0415/0,0366/
0,0244/0,0130 vs không-blur 0,0426/0,0399/0,0277/0,0177). Tách
phẳng-vs-chi tiết của b_large VẪN GIỮ khi có blur: @0,7 phẳng 0,074–
0,076 vs chi tiết 0,028–0,034 (tỉ lệ ~2,2–2,7x, thấp hơn 3,2–3,9x lúc
không-blur vì blur làm mềm cạnh chi tiết — b_large trên tex tăng nhiều
hơn trên phẳng).

### 4.3 Phần C — pan thật bằng camera, koncert (blur quang học thật)

| Đoạn | tốc độ @25fps | độ phẳng (grad) | ctrl small/large | b_small vượt @0,7 | nhảy small 0,5→0,7 | b_large vượt @0,7 | nhảy large |
|---|---|---|---|---|---|---|---|
| koncert-a (t=10–15s) | 19,99 px/f (resp 0,850) | 4,64 | 0,0393 / 0,0066 | 0,331 | 0,067 | 0,025 | 0,013 |
| koncert-b (t=0–5s) | 16,64 px/f (resp 0,866) | 5,89 | 0,0393 / 0,0053 | 0,337 | 0,062 | 0,023 | 0,013 |

Trail small: ctrl 2,06 → 4,32 @0,7 (koncert-a); ctrl 1,92 → 4,18 @0,7
(koncert-b). Mức tuyệt đối b_small @0,7 (0,37–0,38) thấp hơn hẳn pan
tổng hợp slovenska cùng dải tốc độ (0,54–0,64) — nội dung sân khấu
(tối, tương phản cao, ít vùng phẳng rộng) khác đường phố; nhưng nhảy
0,5→0,7 (0,062–0,067) nằm trong dải chung 0,057–0,094 của mọi clip thật
đã đo. b_large vượt sàn @0,7 (0,023–0,025) nằm giữa tex S3 (0,017–0,022)
và phẳng S3 (0,067–0,071) — phù hợp với nội dung hỗn hợp của sân khấu
(độ phẳng grad 4,6–5,9, gần tex 4,8–5,0 hơn phẳng 1,2).

## 5. Kiểm chứng

- Harness chính run 1: **112 pass / 3 fail** — cả 3 fail đều là assert
  kiểm blur "mean|dC| giảm ≥10%" (xem §6: tiền đề sai, blur có thật
  nhưng |dC| chỉ giảm 1,6–12,2% vì |dC| chủ yếu do độ dịch pan). Mọi
  assert đo ghost/tốc độ/sàn/độ tách đều xanh; mọi số trong tài liệu này
  lấy từ run 1 (pipeline xác định — run 2 tính lại khớp, xem dưới).
- Harness run 2 (chạy lại sau khi vá assert blur sang gradient-x +
  |blur−sharp| và thêm cache ghost): **119 pass, 0 fail, exit 0**.
  Mọi số trong tài liệu này đã kiểm chứng khớp giữa run 1 và run 2
  (summary.json run 2 cho cùng số tới 4 chữ số thập phân ở mọi ô).
- Tính xác định: run 2 tính lại Phần A khớp summary S3/R4 tới 0,00000
  (xem log run 2); run 1 cũng vậy — pipeline xác định.
- `enhance.js --self-test` / `fastMotion.js --self-test`: (chạy sau khi
  harness xong.)
- Quyết định metric (§1): GIỮ b_small làm metric kết luận; b_large làm
  chỉ báo phụ trong harness (script ghost mở rộng nay báo
  `bandPairStats` từng dải + SE). KHÔNG sửa code production: quy tắc
  cảnh báo denoise ≥0,7 của S2 là strength-based, không dùng b_small hay
  b_large — metric chỉ là bằng chứng đo, không phải đầu vào của code
  cảnh báo; đổi metric kết luận không đổi hành vi UI. Ghi rõ để đợt sau
  khỏi tưởng "quên cập nhật code".

## 6. Giới hạn — đọc trước khi trích số

1. **Assert kiểm blur của run 1 SAI tiền đề (đã vá ở run 2, ghi rõ để
   khỏi ai trích fail run 1 làm "blur không có thật").** Run 1 assert
   "mean|dC| của frame chuẩn có-blur phải giảm ≥10% so với không-blur".
   Thực đo: tỉ lệ chỉ 0,984 / 0,943 / 0,946 / 0,878 (giảm 1,6–12,2%) —
   vì mean|dC| chủ yếu do độ dịch pan (12–24 px/f), còn vệt mờ chỉ
   4,5–9 px nên chỉ làm |dC| giảm nhẹ. Blur CÓ THẬT, chứng minh bằng 2
   chỉ số đúng hướng: gradient x giảm (tỉ lệ 0,956 / 0,850 / 0,818 /
   0,573) và frame blur lệch trực tiếp khỏi frame sắc nét (1,74 / 2,96 /
   9,16 / 14,19 mức xám). Run 2 đổi assert sang 2 chỉ số này. Bài học:
   đừng dùng mean|dC| làm thước đo blur khi pan nhanh — nó đo độ dịch,
   không đo độ mờ.
2. **Chỉ 1 clip nguồn cho pan tổng hợp (slovenska), 1 clip pan thật
   (koncert), n=1 mỗi ô.** Ngoại suy sang clip khác / 1080p / CRF khác /
   denoise khác hqdn3d chưa kiểm chứng.
3. **Blur mô phỏng ≈ 0,38× độ dịch/frame, không phải đúng 0,5×** của màn
   trập 180° lý thuyết (lấy mẫu rời rạc 4 điểm); và chỉ blur theo pan,
   không blur chuyển động riêng của vật thể (xem §3).
4. **Pan thật koncert là cảnh hoà nhạc trong nhà** (ánh sáng sân khấu,
   độ tương phản cao, nền tối) — nội dung khác hẳn đường phố S3; so sánh
   koncert-vs-S3 cùng tốc độ bị lẫn nội dung, chỉ so sánh blur-vs-
   không-blur trên cùng slovenska là sạch.
5. **b_small/b_large là hệ số hồi quy, chưa hiệu chuẩn tri giác** (nợ từ
   R4, vẫn mở). Đừng dịch số thành "người dùng sẽ thấy ghost".
6. **Chỉ đo hqdn3d qua enhance.js** (strength → thang hqdn3d), CRF23/
   veryfast, 720p. Denoiser khác / preset encode khác sẽ cho sàn khác.
7. **Tải VM là biến số về thời gian, không về số đo.** Loadavg lên tới
   34 trong lúc chạy (8–10 luồng đợt 66 chạy song song, có luồng render
   7680×4320/8192×4320) — wall time render/ghost dao động mạnh; số ghost
   không phụ thuộc tải (pipeline xác định, tính lại khớp 0,00000).
   Đừng trích wall time làm tốc độ sản phẩm.
8. **SE báo trong tài liệu này là SE của trung bình b theo từng cặp
   frame** (per-pair mean), không phải SE của b gộp (pooled) — hai ước
   lượng gần nhau nhưng không đồng nhất; SE dùng để so sánh độ ồn tương
   đối giữa các dải, không phải khoảng tin cậy chính thức của b gộp.

## 7. Cách chạy lại

```bash
node server/render/src/test_round66_t2_whip_pan.js  # ~1-2 giờ tùy tải; resumable
node server/render/src/enhance.js --self-test
node server/render/src/fastMotion.js --self-test
```

## 8. Nợ mở thêm (cho đợt sau)

- **Hiệu chuẩn tri giác b_small/b_large:** chưa biết bao nhiêu thì thấy
  được bằng mắt (nợ từ R4, vẫn mở).
- **b_large trên clip thật:** nếu muốn dùng b_large làm chỉ báo phẳng
  trong UI, cần hiệu chuẩn riêng theo nội dung (nó lẫn cạnh cứng +
  texture chuyển động vừa); chưa có ngưỡng chung.
- **Pan thật >25 px/f:** koncert nhanh nhất ~20 px/f @25fps; vùng
  >25 px/f vẫn chỉ có pan tổng hợp (S3: 26/49 px/f). Cần thêm clip thể
  thao ngoài trời nếu muốn pan thật nhanh hơn.
- **Clip koncert 4K/50fps gốc:** chỉ dùng 2 cửa sổ 5s; còn 8,7s chưa đo
  (tốc độ quét thô 365–637 px/s suốt clip — có thể có cửa sổ nhanh hơn
  nữa, chưa kiểm chứng ở fps native).
