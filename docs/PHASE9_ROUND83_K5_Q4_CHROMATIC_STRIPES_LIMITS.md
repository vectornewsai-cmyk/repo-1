# Phase 9 Đợt 83 — Luồng K5: Q4 sọc màu mịn (chromatic fine stripes)

**Ngày:** 11/11/2026 (lượt cron 00:35 +07 → ~02:30 +07). **Trạng thái:** HOÀN THÀNH, đã stage, KHÔNG push.
**Phạm vi:** chỉ đo lường + script `.mjs` + doc. Không đổi luật gate, không đụng production.

## 0. Tóm tắt kết quả (đọc phần này là đủ)

| Câu hỏi | Trả lời |
|---|---|
| Sọc màu mịn có tái hiện được pattern resid của Q4 không? | **CÓ ở mức điều kiện cổng — KHÔNG ở mức verdict.** Screen 54 họ × 4 rect × 3 kernel (600 lượt đánh giá): 126 lượt thỏa `d0std_R > 2 ∧ ratio_R ≤ 1`; plainMad loại 121, còn **2 case Q4** (5 lượt kernel). Nhưng kiểm chứng đầy đủ (thí nghiệm D): **0/12 phân biệt được G1 vs G2** — cả hai verdict đều LỆCH. |
| 2 case Q4 là gì? | **RC-low-V-p6 @311×175** (sọc đỏ–cyan nhạt, chu kỳ 6 px): d0std_R 2,14; residStd_R 2,56–2,78; ratio 0,77–0,84; plainMad 2,09–2,31 — Q4 ở **cả 3 kernel**. **ISO-60-chk-p2 @311×175** (bàn cờ đẳng-luma ±60): d0std_R 2,03; residStd_R 2,81–3,72; ratio 0,55–0,72; plainMad 1,46–1,59 — Q4 ở **Mitchell + BC, trượt R0 ở 1-kernel** (plainMad 2,91). Cả hai đều ở rect nhỏ nhất (311×175) và đều có biên d0 mỏng (2,03–2,14 so với ngưỡng 2,0). |
| Vì sao verdict không phân biệt được? | **stdRatio ~1,48.** Trên cả 12 lượt D (2 case × noise05/noise10 × 3 kernel), verdict KHÔNG-d0 và CÓ-d0 đều LỆCH do **tỉ số std của delta nhiễu preview/render ≈ 1,48** (ngưỡng [0,85; 1,18]) ở cả 3 kênh; kurt đạt (≤ 0,20), corr đạt (≤ 0,05). d0 là hiệu chỉnh chroma-shift — nó không sửa được mismatch std do kernel lệch trên nhiễu trắng ở thang nhỏ, thậm chí làm kênh R tệ hơn (1,48 → 1,61). Case là "cả-hai-LỆCH" nên không chấm được luật nào. |
| Chuỗi encode-aware (kiểu F7) thì sao? | **Cả 3 pick đều trượt Q4.** RC-low-V-p6: encode x264 crf 18 đẩy plainMad 2,09 → **2,64** (vượt R0 sít sao, ratio 0,90); ISO-60-chk-p2: sai số encode 4:2:0 ở 1280 là **std_R 31,80** (chroma bàn cờ bị san phẳng), plainMad 3,48; near-miss OT-mid-V-p4: plainMad 3,61. Trong chuỗi render-tham-chiếu-là-frame-gốc, không case nào còn là Q4. |
| Q4 còn đáng săn không? | **KHÔNG — dừng săn Q4.** Đây là hướng cuối cùng chưa thử (J5 §6.2) và nó đã cho kết quả mạnh nhất từ trước đến nay (2 case thỏa cả ba điều kiện cổng) mà vẫn **không phân biệt được G1 vs G2 ở mức verdict**. Xem §6.3 cho danh sách đầy đủ các hướng đã loại trừ. |
| Có sửa luật gate / production không? | **KHÔNG.** Không có case nào cho thấy G2 đúng–G1 sai hay ngược lại. G12 giữ nguyên. |
| Test | K5 test **xanh** (xem §7; số lượng assert ghi trong log chạy test). |

**Đính chính so với kỳ vọng của J5 §6.2:** J5 viết "sọc màu mịn" là hướng duy
nhất chưa thử và dự đoán nó có thể cho cả `d0std_R` lớn lẫn resid lớn —
**dự đoán này ĐÚNG ở mức điều kiện cổng** (d0std_R tới 81,90; residStd_R tới
50,81; 126 lượt thỏa cả hai điều kiện). Nhưng điều kiện cổng không đủ: hai
case thỏa cả ba điều kiện vẫn không phân biệt được luật, vì verdict bị chặn
bởi stdRatio của delta nhiễu — một tầng mà J5 chưa xét tới.

---

## 1. Bối cảnh và định nghĩa (giữ nguyên từ J5)

- Q4 = G1 từ chối ∧ G2 áp: `plainMad ≤ 2,5 ∧ d0std_R > 2,0 ∧ ratio_R = d0std_R / residStd_R ≤ 1,0`.
- `residStd_R` = std kênh R của `prevPlain − trilinear(renderPlain1280)`;
  `d0std_R` = std kênh R của `delta0Viewport_70x6` (mô hình chroma-shift:
  trung bình Cb/Cr theo khối 2×2, khuếch đại 1,04/1,12, kẹp [16,240]).
- "Phân biệt thật" (thí nghiệm D) ⟺ verdict KHÔNG-d0 ≠ verdict CÓ-d0 VÀ
  correct ∈ {KHÔNG-d0, CÓ-d0} (không phải "cả-hai-LỆCH").

## 2. Thí nghiệm B — Screen sọc (54 họ × 4 rect × 3 kernel)

### 2.1 Thiết kế

- Frame 1280×720 gen trong node (không cần browser): 8 cặp màu
  (RC-full/mid/low, GM-mid, BY-mid, OT-mid, ISO-60/100 đẳng-luma) × chu
  kỳ 2/3/4/6/8 px × pha 0/1 × dọc/chéo/bàn cờ × sóng vuông/sin; đối chứng
  sọc xám cùng chu kỳ/biên độ + màu trơn.
- Rect: 311×175, 489×275, 809×455, 1129×635 (tỉ lệ 0,24 / 0,38 / 0,63 / 0,88).
- `d0std` CHÍNH XÁC bằng `delta0Viewport_70x6`; `residStd`/`plainMad`
  proxy bằng sai khác trilinear (mô hình production) vs 3 kernel ứng viên
  cho browser: **1-kernel** (`resampleRgb24`), **Mitchell (1/3, 1/3)** —
  kernel thật của Chrome ở upscale (J2), **BC(0,25, 0,375)** — hằng số
  production cũ. Đường nhanh tính `estShiftFrame` 1 lần/họ (đã kiểm chứng
  bằng đúng số harness, xem §7).
- B1 (1-kernel) xong đủ: 1604 s. B2 (Mitchell + BC) xong 48/54 họ thì
  **tiến trình chết** (xem §8) — 6 họ cuối được khôi phục bằng script
  riêng (§2.3), không chạy lại toàn bộ screen.

### 2.2 Kết quả headline

| | Giá trị |
|---|---|
| Tổng lượt đánh giá kernel (B1 216 + B2 384) | 600 |
| Lượt thỏa `d0std_R > 2 ∧ ratio_R ≤ 1` (chưa xét plainMad) | 126 |
| Lượt thỏa cả ba điều kiện (ứng viên Q4) | **5 (2 cặp)** |
| `d0std_R` lớn nhất | 81,90 (RC-full-V-p3 @1129×635) |
| `residStd_R` lớn nhất | 50,81 (RC-full-V-p3 @311×175, BC) |
| `plainMad` lớn nhất | 40,26 (RC-full-V-p3 @311×175) |

**Hai case Q4 (đầy đủ 3 kernel, xem §2.3):**

| Case | Kernel | d0std_R | residStd_R | ratio_R | plainMad | Q4 |
|---|---|---|---|---|---|---|
| RC-low-V-p6 @311×175 | 1-kernel | 2,1436 | 2,5649 | 0,8357 | 2,0900 | ✓ |
| RC-low-V-p6 @311×175 | Mitchell | 2,1436 | 2,5954 | 0,8259 | 2,0997 | ✓ |
| RC-low-V-p6 @311×175 | BC(0,25, 0,375) | 2,1436 | 2,7849 | 0,7697 | 2,3087 | ✓ |
| ISO-60-chk-p2 @311×175 | 1-kernel | 2,0266 | 5,2055 | 0,3893 | 2,9075 | ✗ (R0) |
| ISO-60-chk-p2 @311×175 | Mitchell | 2,0266 | 3,7166 | 0,5453 | 1,5939 | ✓ |
| ISO-60-chk-p2 @311×175 | BC(0,25, 0,375) | 2,0266 | 2,8076 | 0,7218 | 1,4586 | ✓ |

**Ba cửa chặn, theo thứ tự "giết" ứng viên:**

1. **`d0std_R > 2` — sọc màu PHÁ ĐƯỢC.** 126 lượt thỏa cả d0>2 lẫn
   ratio<1, trong khi mọi họ tự nhiên trước đây chỉ có ocean post-fix
   (d0 3,97, ratio 2,84) và blend-a85 (d0 2,45, ratio 3,55) là gần nhất.
   Sọc màu là họ đầu tiên đưa ratio xuống dưới 1 trong khi d0 vẫn > 2.
2. **`ratio_R ≤ 1` — thỏa ở rect nhỏ.** Mọi case Q4 đều ở 311×175:
   rect càng lớn, resid càng nhỏ (1-kernel trùng trilinear ở 1129×635
   do LOD = 0 → resid = 0, ratio = ∞) trong khi d0 càng lớn → ratio vọt
   lên 5–30. Cửa sổ Q4 chỉ mở ở rect nhỏ nhất.
3. **`plainMad ≤ 2,5` — cửa chặn cuối cùng, giết 121/126 lượt.**
   plainMad tỉ lệ với biên độ sọc: RC-mid-V-p2/p3/p6 @311 có ratio 0,36/
   0,17/0,83 nhưng plainMad 7,82/20,23/8,43; RC-full-V-p3 @489 ratio
   0,28 nhưng plainMad 26,36. Chỉ sọc biên độ thấp (RC-low, ISO-60
   bàn cờ) mới lọt qua — và cả hai đều có biên d0 mỏng (2,03–2,14).

### 2.3 Sự cố tiến trình B chết + khôi phục (trung thực)

- Tiến trình screen B (chạy nền, `R83K5_ONLY=B`) chết sau B2 họ thứ 48
  (GRAY-V-p6), không thông báo lỗi trong log, JSON chưa kịp ghi (script
  chỉ ghi OUT ở cuối). RAM lúc đó: dùng 5,0/7,9 GB, swap 324 MB; các
  luồng đợt 83 khác đang chạy Chrome/vite song song — **nghi OOM-kill
  hoặc runtime dọn tiến trình mồ côi, chưa xác định được** (không có
  dấu vết OOM trong log; không phải EPERM — mọi ghi file trước đó đều
  thành công).
- Khôi phục **không chạy lại toàn bộ screen**: B1 đã xong đủ (log có đủ
  d0/res/ratio của 216 hàng; dòng "Ứng viên Q4 (1-kernel): 1" đã ghi),
  B2 đã xong 48/54 họ. Script `r83k5-recover.mjs` tính đầy đủ 3 kernel
  cho 56 cặp (họ, rect) còn bỏ ngỏ (mọi hàng có d0>2 ∧ ratio<1 ở bất kỳ
  kernel nào + toàn bộ 2 họ sine) — 5 ứng viên Q4 cuối cùng khớp từng
  số với log B1/B2 và với 2 probe độc lập (§5). 6 họ B2 chưa chạy
  (GRAY-V-p8, GRAYlow-V-p2, sine ×2, FLAT ×2): gray/flat có d0std_R = 0
  nên không thể Q4 với bất kỳ kernel nào; 2 họ sine đã có đủ số trong
  recovery. **Không có họ nào bị bỏ sót khỏi kết luận.**
- Bài học đã vá vào script chính: ghi checkpoint JSON sau A, sau B1 và
  sau mỗi họ B2 (trước đây chỉ ghi ở cuối) — xem §8.
- Lỗi hiển thị `ratioR = 0` khi `residStd_R = 0` (rect 1129×635,
  1-kernel trùng trilinear): thực chất ratio = ∞, không phải 0; cờ `q4`
  vẫn đúng (yêu cầu residStd > 0). Đã sửa thành `null` (= ∞) trong
  script chính + recovery; các số trong LIMITS này dùng quy ước mới.

## 3. Cơ chế: vì sao sọc màu cho được d0 lớn (và vì sao tp không)

Ba nguồn của `d0std_R`, đã tách được bằng đối chứng:

1. **Trộn chroma trong khối 2×2 (chu kỳ lẻ / pha lệch):** khối 2×2 chứa
   2 màu với tỉ lệ khác nhau → trung bình chroma khác chroma từng pixel
   → d0 lớn. Ví dụ: RC-full-V-p3 @809 d0 = 68,83; ISO-60-V-p4-ph1 @809
   d0 = 43,62. Chu kỳ chẵn căn lưới (p4 pha 0) không có nguồn này.
2. **Hệ số khuếch đại 1,04/1,12 trên chroma chưa bão hòa:** ngay cả khi
   khối 2×2 đồng nhất (p4 căn lưới), mô hình vẫn dịch Cb/Cr ra xa 128 →
   d0 lớn nếu màu chưa chạm rail. RC-mid-V-p4 (căn lưới) d0 ≈ 10,7–11,0
   ở mọi rect; RC-full-V-p4 d0 = **0** (khuếch đại đẩy Cb/Cr vượt rail
   [16,240] → kẹp về đúng giá trị cũ). Đây là lý do test-pattern
   (chroma bão hòa rail) có d0std_R chỉ ~0,9–1,17 dù sọc rất sắc.
3. **Thành phần tần số thấp mới sống sót sau downscale:** `d0std_R` chỉ
   đếm phần biến thiên theo không gian của hiệu chroma-shift. ISO-100
   chu kỳ chẵn có d0 = **0** vì hiệu shift chỉ còn thành phần chu kỳ 2
   (trung bình về 0 ở mọi mức mipmap), trong khi ISO-60-V-p6 d0 = 9,18
   nhờ thành phần tần thấp từ hệ số khuếch đại (khối A/B lệch −13/+10,6
   ở kênh R — đã đo bằng phân tích tay, khớp số screen).

**Đối chứng quyết định — resid là do luma, d0 là do chroma:**
sọc xám cùng chu kỳ/biên độ cho `d0std_R = 0` chính xác ở mọi rect
(mô hình chroma-shift không chạm luma thuần) nhưng `residStd_R` Y HỆT
sọc màu có cùng mẫu luma (GRAY-V-p6 = RC-mid-V-p6 = 10,2023 @311;
GRAY-V-p2 = RC-mid-V-p2 = 8,9227 @311). Màu trơn: d0 = 0, resid = 0.
Hai điều kiện Q4 vì vậy được điều khiển bởi hai thành phần độc lập
(chroma → d0, luma → resid) — sọc màu mịn là họ đầu tiên chỉnh được cả
hai cùng lúc: biên độ chroma vừa đủ lớn cho d0 > 2, biên độ luma vừa đủ
nhỏ cho plainMad ≤ 2,5.

## 4. Thí nghiệm D — Full verdict: 0/12 phân biệt được

Chạy `evalDelta0CaseRaw` (số học không làm tròn, như I4) cho 2 case Q4 ×
nhiễu noise05 (alls=28) / noise10 (alls=50) × 3 kernel proxy làm
"browser" (prevPlain/noise = proxy downscale; render = trilinear).
Nhiễu gen bằng ffmpeg `noise=alls=28/50:allf=t` như các đợt trước.

| Case | Noise | Kernel | noD0 | fullD0 | Correct | Phân biệt? |
|---|---|---|---|---|---|---|
| ISO-60-chk-p2 @311 | 05/10 | 1k / mit / bc | LỆCH | LỆCH | cả-hai-LỆCH | Không (6/6) |
| RC-low-V-p6 @311 | 05/10 | 1k / mit / bc | LỆCH | LỆCH | cả-hai-LỆCH | Không (6/6) |

**Nguyên nhân (đo trực tiếp 1 case, RC-low-V-p6/noise05/1-kernel):**
`stdRatio` preview/render = **[1,483; 1,464; 1,484]** (ngưỡng [0,85; 1,18])
ở cả 3 kênh, cả khi không-d0 lẫn có-d0 (fullD0: 1,612 R); kurt đạt
(≤ 0,20), corr đạt (≤ 0,05). Delta nhiễu sau downscale 1-kernel giữ
phương sai lớn hơn ~48% so với sau trilinear-mipmap ở thang 0,24 —
kernel lệch trên nhiễu trắng, không phải chroma-shift. Áp d0 không sửa
được tỉ số std (R còn tệ hơn: 1,48 → 1,61) nên cả hai verdict đều LỆCH,
không chấm được luật nào. Đây là tầng chặn thứ tư mà screen cổng không
thấy: **điều kiện cổng là cần nhưng không đủ**.

## 5. Thí nghiệm C — Encode-aware (chuỗi kiểu F7, x264 crf 18)

Decode frame 15 của still 30 frame (mp4 1280×720, yuv420p), downscale
1-kernel, so với trilinear(frame gốc). Picks: 2 case Q4 + 1 near-miss
(OT-mid-V-p4 @311, BC ratio 0,86, plainMad 3,37).

| Pick | encStd1280_R | encMad1280 | d0std_R | residStd_R | plainMad | ratio_R | Q4 |
|---|---|---|---|---|---|---|---|
| RC-low-V-p6 @311 | 1,3585 | 1,7342 | 2,1436 | 2,3743 | **2,6399** | 0,9028 | ✗ (R0) |
| ISO-60-chk-p2 @311 | 31,8022 | 26,0603 | 2,0266 | 6,8527 | 3,4755 | 0,2957 | ✗ (R0) |
| OT-mid-V-p4 @311 | 1,9297 | 1,5091 | 4,7962 | 5,0663 | 3,6125 | 0,9467 | ✗ (R0) |

- RC-low-V-p6: encode chỉ thêm sai số nhỏ (std_R 1,36) nhưng đủ đẩy
  plainMad 2,09 → 2,64 — **vượt R0 sít sao** (0,14 trên ngưỡng).
- ISO-60-chk-p2: sai số encode 4:2:0 khổng lồ (std_R 31,80) — bàn cờ
  đẳng-luma bị san phẳng chroma hoàn toàn; residStd_R vọt lên 6,85
  nhưng plainMad cũng vọt lên 3,48.
- Kết luận C: trong chuỗi render-tham-chiếu-là-frame-gốc, **không case
  nào còn là Q4**. (Trong chuỗi I4 — render tham chiếu là frame đã
  decode, sai số encode triệt tiêu — kết quả screen giữ nguyên; xem §6.2.)

**Sự cố C (trung thực, đã sửa):** lần chạy C đầu tiên cho số RÁC
(plainMad ~128–130, encStd = NaN) vì mp4 encode chỉ có `nb_frames=1`
(input rawvideo là 1 frame duy nhất; `-frames:v 30` chỉ là trần, không
lặp) nên `select=eq(n,15)` ở bước decode chọn được 0 frame → file
dec.rgb 0 byte → resample của buffer rỗng thành khung đen. Đã sửa:
encode dùng `-stream_loop -1` (đã kiểm chứng nb_frames=30, decode đủ
2.764.800 byte) + guard throw nếu decode sai kích thước; chạy lại toàn
bộ C. Số trong bảng trên là số chạy lại, đã kiểm chứng kích thước file.
(`-loop` không dùng được với rawvideo; `-vsync vfr` một mình không sửa
được lỗi vì nguyên nhân là mp4 thiếu frame.) Lỗi filler near-miss (trộn
minRatio của kernel này với minMad của kernel khác, chọn nhầm pick
1129x635) cũng đã sửa thành xét cùng một kernel.

## 6. Kết luận tổng + Q4 dừng săn

### 6.1 Phân rã cuối cùng: sọc màu đã phá được hai điều kiện kéo ngược — nhưng không đủ

| Tầng | Kết quả trên sọc màu mịn |
|---|---|
| `d0std_R > 2` | **PHÁ ĐƯỢC** — tới 81,90; 126/600 lượt thỏa cùng lúc với ratio<1 |
| `ratio_R ≤ 1` | **PHÁ ĐƯỢC** — tới 0,02 (BY-mid-V-p3 @311); 2 case thỏa cả ba điều kiện |
| `plainMad ≤ 2,5` | **CHỈ 2 CASE LỌT** — biên độ thấp, rect nhỏ nhất, biên d0 mỏng (2,03–2,14) |
| Verdict phân biệt G1/G2 | **0/12** — stdRatio ~1,48 chặn cả hai verdict (cả-hai-LỆCH) |
| Chuỗi encode-aware (F7) | **0/3** — plainMad vượt R0 (2,64 / 3,48 / 3,61) |

### 6.2 Phạm vi đúng của kết luận

- **Trong chuỗi I4** (render tham chiếu là frame đã decode — chuỗi mà
  luật delta0 được định nghĩa và chấm): 2 case Q4 tồn tại ở mức điều
  kiện cổng, nhưng 0/12 phân biệt được ở mức verdict. G1 và G2 không
  phân biệt được; G12 giữ nguyên.
- **Trong chuỗi F7** (render tham chiếu là frame gốc): 0 case Q4 —
  encode 4:2:0 giết cả hai ứng viên ở cửa R0.
- **Caveat (chưa đo):** kết luận verdict dựa trên 3 kernel proxy đều là
  single-level (1-kernel / Mitchell / BC). Nếu kernel downscale thật của
  browser là dạng mipmap với bias khác trilinear (không có bằng chứng
  nào ủng hộ — resid đo được 0,5–0,7 trên nội dung tự nhiên và 4,46
  trên tp chứng tỏ browser KHÔNG phải trilinear-mipmap), stdRatio có
  thể rơi vào ngưỡng và một case có thể phân biệt được. Capture headed
  của RC-low-V-p6 là phép kiểm chứng quyết định cho caveat này — ghi
  làm nợ đợt sau, không phải điều kiện để kết luận "dừng săn" trong
  harness proxy. Lập luận hai-thế-giới: nếu browser ≈ trilinear thì
  resid ≈ 0 → ratio = ∞ → không Q4; nếu browser lệch single-level như
  mọi bằng chứng hiện có thì stdRatio ~1,5 → cả-hai-LỆCH → không phân
  biệt. Cả hai thế giới đều cho cùng kết luận.

### 6.3 DỪNG SĂN Q4 — danh sách đầy đủ các hướng đã loại trừ

| # | Hướng | Đợt | Kết quả loại trừ |
|---|---|---|---|
| 1 | Nội dung tự nhiên (slovenska/basgo/ocean) | F7/I4/J5 | resid khớp-frame thật chỉ 0,5–0,7; d0std_R ≤ 0,27 (slov) / 3,99 (ocean, ratio 2,4–5,1) |
| 2 | Test-pattern (sọc sắc, chroma bão hòa) | F7/I4/J5 | resid tới 4,46 @311 nhưng d0std_R chỉ 0,90–1,17 (kẹp rail) |
| 3 | Chroma-scale slovenska (s12–s24) | I4 | d0std_R tới 3,95 nhưng resid ~0,7, ratio ~3,6 |
| 4 | Blend tp–slovenska (a85–a89) | H4/I4 | d0std_R 2,04–2,45 nhưng resid 0,69, ratio 3,55 |
| 5 | Làm mượt encode (x264/VP9/x265/AV1, crf 0–35) | J5 B | Đóng góp ≈ 0 trong chuỗi khớp-frame (triệt tiêu) |
| 6 | Motion / lệch frame (pan 0/2/8 px/f, off-by-one) | J5 A/C | Cơ chế của số 2,95 là lệch 1 frame, không phải resid thật; motion khớp-frame không phồng resid |
| 7 | Blend trung bình (a88) | H4/I4 | "Blend làm sụp resid" là sai do so sánh lệch chuẩn (đính chính I4) |
| 8 | **Sọc màu mịn (hướng cuối cùng)** | **K5 (đợt này)** | **2 case thỏa cả ba điều kiện cổng, nhưng 0/12 phân biệt được ở verdict (stdRatio ~1,48) và 0/3 ở chuỗi encode-aware** |

**Không còn hướng săn nào có bằng chứng.** Mọi họ nội dung đã thử đều
rơi vào một trong ba mode: (i) d0 nhỏ, (ii) ratio lớn, (iii) plainMad
lớn, (iv) verdict cả-hai-LỆCH do stdRatio. Q4 được kết luận là **không
đạt được với thiết kế cổng hiện tại** — không phải "chưa tìm ra case".

### 6.4 Không đổi luật gate, không sửa production

Không có case nào cho thấy G2 đúng–G1 sai hay ngược lại, nên không có
cơ sở chọn G2 thay G1 hay đổi G12. Không sửa production (không có gì để
sửa: vấn đề nằm ở harness đo, không phải code sản phẩm).

## 7. Kiểm chứng

- **Neo sanity A:** tái lập J5 D2 gần như từng số — tp @311 kernel-diff
  std_R 3,8564 (J5: 3,86), @809 0,74 (J5: 0,74); slov @809 0,3528 (J5:
  0,3518), @311 1,5111 (J5: 1,5045). (Chênh ≤ 0,007 do frame slov nguồn
  khác — I4 plain vs Z2 render-1k; tp khớp từng số.)
- **Đường nhanh = đường harness:** d0std_R của RC-low-V-p6 @311 bằng
  `estShiftFrame` 1 lần/họ + trilinear-diff bằng đúng số
  `delta0Viewport_70x6` (chênh < 0,001 — kiểm chứng trong test).
- **Probe độc lập (2 script riêng, hàm harness trực tiếp):** RC-low-V-p6
  @311 (d0 2,1436 / res 2,5649 / mad 2,09) và 9 hàng khác khớp từng số
  với screen B1 — screen không phụ thuộc một đường code duy nhất.
- **Test:** `test_round83_k5_q4_stripes.mjs` — **23 pass, 0 fail** (xem
  §7.1; chạy ~291 s).
- tsc / vite build: KHÔNG CHẠY (chỉ thêm script đo + doc; không đụng
  code sản phẩm hay component). Không đụng TTS/Gradio, không đụng
  `.github/workflows/*`, không binary vào batch.
- EPERM: không gặp trong luồng này (mọi ghi file thành công).

### 7.1 Kết quả test

`test_round83_k5_q4_stripes.mjs`: **23 pass, 0 fail** (chạy ~291 s).
Bao gồm: neo J5 D2 cả 4 hàng (tp/slov @311/@809 khớp từng số); đối
chứng xám d0 = 0 nhưng resid > 0; RC-full p4 d0 = 0 (kẹp rail); 2 case Q4
đủ 3 kernel + 1-kernel trượt R0 của ISO-60-chk-p2; ví dụ R0-trượt
RC-mid-V-p2; fast-path d0 = harness d0 (chênh 0,0000); hồ sơ JSON
(recovery đúng 5 entry / 2 cặp; D 0/12, mọi case cả-hai-LỆCH; C 3/3
q4=false, RC-low-V-p6 plainMad 2,6399).

## 8. Ghi chú khác / giới hạn

- **VM:** 4 vCPU EPYC 9D25, ~7 GB RAM; nhiều luồng đợt 83 chạy song
  song (Chrome/vite của K4) nên wall time bị kéo dài: A 125 s; B1 1604 s;
  B2 chết sau ~15 phút; recovery 56 cặp ~25 phút; D 12 eval ~7 phút;
  C (chạy lại) ~90 s; test ~5 phút.
- **Tiến trình B chết giữa B2:** không có thông báo lỗi; nghi OOM-kill
  hoặc runtime dọn tiến trình nền mồ côi (RAM 5,0/7,9 GB lúc đó, swap
  đã dùng 324 MB). Đã khôi phục đầy đủ từ log + recompute có mục tiêu
  (§2.3); script chính nay ghi checkpoint sau mỗi pha.
- **d0std_R của slov trong neo A (0,124 @809) khác J5 A0 (0,2071):**
  frame nguồn khác nhau (I4 plain đã decode vs Z2 render-1k) — không
  phải lỗi phương pháp; kernel-diff tái lập khớp nên neo vẫn hợp lệ.
- **Resid proxy là bracket, không phải browser thật:** 3 kernel proxy
  (1-kernel/Mitchell/BC) kẹp hai phía kernel browser ở downscale; kernel
  thật ở downscale vẫn chưa biết chính xác (J2 chỉ đo upscale). Kết
  luận Q4 dựa trên sự nhất trí của cả 3 proxy (2 case Q4, 0/12 verdict)
  + lập luận hai-thế-giới (§6.2); capture headed là phép kiểm chứng
  quyết định cho caveat mipmap-bias, ghi làm nợ đợt sau.
- **Noise ffmpeg là giả-ngẫu nhiên theo thời gian** (`allf=t`): D dùng
  cùng một frame nhiễu cho noise05/noise10 của mỗi case; hai mức nhiễu
  cho cùng verdict (0/12) nên kết luận không nhạy với mức nhiễu.
- Không đụng production, không đổi luật gate, không push, không
  release/tag. Không đụng TTS/Gradio, không đụng `.github/workflows/*`.

---

## 9. File thay đổi (stage, KHÔNG push)

**Thêm:**
- `apps/web/scripts/r83k5-chromatic-stripes.mjs` — thí nghiệm A/B/C
  (neo sanity, screen 54 họ, encode-aware; đã vá checkpoint + ratio
  null + `-stream_loop` + filler near-miss cùng-kernel).
- `apps/web/scripts/r83k5-recover.mjs` — khôi phục B sau khi tiến trình
  chết (56 cặp, checkpoint sau mỗi cặp).
- `apps/web/scripts/r83k5-q4-verdict.mjs` — thí nghiệm D (full verdict
  12 lượt cho 2 case Q4).
- `apps/web/scripts/test_round83_k5_q4_stripes.mjs` — test kiểm chứng
  số headline.
- `docs/PHASE9_ROUND83_K5_Q4_CHROMATIC_STRIPES_LIMITS.md` — tài liệu này.

**Không stage:** binary media/render (mp4/.rgb) trong
`hidden_files/round83-k5/media/` (tái lập được bằng script), JSON thô
(trừ file đã nêu trong test — chúng ở lại hidden_files), log
chạy/probe (ở lại hidden_files), `.github/workflows` (không đụng).

## 10. Dữ liệu (hidden_files/round83-k5/, không stage)

- `r83k5-screen-b.log` — log chạy B (B1 đủ 54 họ + B2 48/54 họ).
- `r83k5-chromatic-stripes.json` — JSON chạy A (B chưa ghi do tiến
  trình chết; B đầy đủ nằm trong log + file recovery).
- `r83k5-recovered-candidates.json` — 56 cặp đã verify đầy đủ 3 kernel
  + 5 entry ứng viên Q4 (hồ sơ chính thức của screen).
- `r83k5-q4-verdict.json` + `r83k5-verdict.log` — 12 lượt D (0/12).
- `r83k5-chromatic-stripes-c.json` + `r83k5-encode-c3/c4.log` — 3 pick C
  (chạy lại đúng; log c3 là lần chạy lỗi decode-rỗng, giữ làm hồ sơ lỗi).
- `r83k5-probe-plainmad.mjs`, `r83k5-probe2-plainmad311.mjs`,
  `r83k5-stdcheck.mjs` — probe độc lập + kiểm tra stdRatio.
- `r83k5-recover.log` — log chạy recovery.
- `media/` — mp4/.rgb encode-aware + frame/noise của D (binary, không stage).
- `round83-k5.md` — log luồng K5.
