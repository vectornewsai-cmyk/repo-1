# Phase 9 đợt 28, luồng L6 — Đo phủ dip: 1080p/4K + sweep p + tổ hợp

> Đóng nợ đợt 27 §3.6 (nhánh dip chưa đo 1080p/4K, sweep p trên footage,
> tổ hợp dip + motion blur / SR / track / mask). Đo là chính; KHÔNG sửa
> code sản phẩm nào trong luồng này. Thang V6: KHỚP = MAD ≤ 2 VÀ
> ≥ 99% ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại LỆCH.
>
> PHẠM VI ĐO — ĐỌC TRƯỚC KHI TRÍCH SỐ: luồng này là subagent không có
> live browser nên đo bằng **model code sản phẩm + FFmpeg thật** (theo
> giao thức J3), KHÔNG phải click-test browser như K3. Nghĩa là:
> (B) wiring = `singleClipDipPixel` + `describeTransition` (chính code
> sản phẩm, transpile) vs tham chiếu FFmpeg độc lập cho cùng mô hình đơn
> clip; (A) pair-gap = model đơn clip vs xfade cặp FFmpeg. (B) khóa
> "canvas vẽ đúng projection", (A) đo giới hạn kiến trúc (thiếu clip còn
> lại). Riêng tổ hợp, bước dip dùng chính code sản phẩm, còn transform
> (mask/SR/track/blur) là cài đặt harness theo đúng ngữ nghĩa đã ghi
> trong code preview (mask dùng chính `maskAlphaAt` transpile từ
> `previewEngine.ts`) — vì vậy (B) tổ hợp khóa "dip composite đúng sau
> transform", KHÔNG khóa wiring DOM/offscreen của preview (cần browser
> như K3, vẫn là nợ — xem §6).

## 0. Kết luận ngắn

1. **1080p/4K: wiring KHỚP 54/54 ô** (fadeblack/fadewhite/fadegrays,
   phẳng + footage K→L, ra/vào, p = 0,5 và 0,1 ở 1080p), cả MAD native
   lẫn resampled về 720×1280 (lanczos, mô phỏng viewport resample của
   K3; Δ ≤ 0,03). Gap cặp (A) ở 1080p/4K **bằng đúng số J3 ở 720×1280**
   (sai khác ≤ 0,4) — gap không phụ thuộc độ phân giải, đúng lý thuyết
   (gap chỉ phụ thuộc trọng số + thống kê nội dung).
2. **Sweep p (29 điểm, K→L + J→L, rgb + yuv): p lệch nhất là ở biên**
   — cửa sổ vào p = 0,0333 (fadewhite KL 135,4; JL 105,6) và cửa sổ ra
   p = 0,9667 (fadewhite 129,5 cả hai cặp). Lệch biên là do **nội dung +
   trọng số, KHÔNG phải offset YUV**: gap ra của fadeblack/fadewhite
   chỉ phụ thuộc clip B nên KL-ra ≡ JL-ra từng chữ số thập phân (đúng
   công thức J3 §3: `pair − single = bAlpha·(B − dip)`); gap vào của
   fadewhite/fadeblack sụp về ~0 khi aAlpha = 0 (p ≥ 0,27: 0,14–2,2).
3. **Offset mức đen YUV là CÓ THẬT nhưng chỉ chi phối phần dư khi gap
   RGB đã nhỏ** (cửa sổ vào giữa cửa sổ). Trừ offset fit (I4) đưa gap
   YUV vào về gần gap RGB (fadewhite vào p = 0,5: 14,37 → 2,28;
   p = 0,7333: 4,22 → 1,55 KHỚP). **Phát hiện mới (§3.2):** ở p ≈ 0,17–0,27
   đường YUV của render **bão hòa về trắng/đen thuần** (mặt phẳng Y
   237–255, trung bình 244,6) nên gapYUV ≈ 0 trong khi gapRGB = 7–10 —
   cơ chế là xfade blend về cực full-range (255/0) thay vì
   limited-range (235/16); số lý thuyết +23,1·m/−18,6·m khớp đúng số
   lý thuyết của I4 §4. Ở vùng này canvas RGB đúng model hơn render
   YUV — KHÔNG được "sửa" canvas cho khớp render đã clip.
4. **Tổ hợp: dip composite đúng sau mọi yếu tố** — (B) 20/20 ô KHỚP
   hoặc XẤP XỈ (mask 0,07–0,66; SR 0,16–2,26; track 0,00–2,55; blur
   0,00–1,69). Motion blur khớp đẹp nhất: sanity trailing-avg ≡ tmix
   **0,0000/0,0000**. Nhưng **gap cặp (A) của tổ hợp LỚN HƠN clip
   thường ở đúng chỗ có vùng không phủ**: dip của render là toàn khung
   còn dip canvas chỉ trong vùng clip chiếm — mask+fadewhite (A) lên
   tới 106,9–127,7 (so với 46,1 không mask), track+fadewhite vào 23,5
   (so với 0,25). Đây là giới hạn kiến trúc, đã đo đúng số, không phải
   lỗi wiring mới.
5. **Đề xuất badge (§5, parent quyết, KHÔNG tự đổi code):** giữ matched
   cho cả 3 type; bổ sung 2 giới hạn vào mô tả badge (bão hòa YUV +
   gap tổ hợp lớn hơn). Không có bằng chứng nào đòi hạ badge.

## 1. Harness và phương pháp

- Script mới: `server/render/src/measure_r28_l6_dip_coverage.js`
  (3 chế độ `--res` / `--sweep` / `--combo`; raw xoá sau mỗi phép đo;
  footage + frame trung gian chỉ ở `~/workspace/tmp-round28-l6/`,
  ngoài repo).
- Footage: J/K/L tải lại bằng `scripts/fetch-r22-footage.sh`, SHA256
  khớp đúng J3 (`J 07c81538…`, `K 49f33b83…`, `L 0e2df0ee…`); cửa sổ
  K 28–30s, J 28–30s, L 24–26s (như J3/I4).
- 1080p ở đây = 1080×1920 (dọc, khớp footage K/L), 4K = 2160×3840.
  Phẳng dùng nguồn color FFmpeg; footage dùng cùng quy ước J3
  (pair n ↔ A n, B n−30).
- Sweep: n = 31..59 (p = 0,0333..0,9667), 2 cặp × 3 type × 2 đường ×
  2 cửa sổ = 696 ô gap + 60 ô corrected tại p mẫu
  (0,1 / 0,2667 / 0,5 / 0,7333 / 0,9). Corrected: fadewhite c =
  (18,10; 22,59; 16,04), fadeblack c = −21,05 (fit I4), nhân với
  m = dip.a + dip.b; fadegrays không có c hằng → kiểm tra bằng model
  luma bt601 thay vì mean.
- Tổ hợp ở 720×1280, p = 0,5, cặp K→L: mask rect/ellipse
  (0,5/0,5/0,6/0,6, feather 0,1), SR (scale 1,3 + rotate 15° — dấu góc
  đã probe khớp FFmpeg rotate, MAD 0,501), track (+80,−40, nguyên
  pixel), blur (trung bình trailing 3 frame, weights đều — đã probe
  tmix là trailing avg, output n = avg(n−2, n−1, n) từ n ≥ 2).
- Bài học harness (để luồng sau khỏi vấp): (a) select nhiều frame ra
  raw PHẢI thêm `-vsync 0`, nếu không muxer nhân frame theo timestamp
  (đo được 61 frame thay vì 29, 35 thay vì 3); (b) geq giữ alpha bằng
  `alpha(X,Y)`, không phải `a(X,Y)` (lỗi khởi tạo filter); (c) sanity
  phải trích từ CÙNG cửa sổ với frame model — fps=30 từ nguồn
  23,976fps lệch phase giữa cửa sổ 1s và 2s, gây nhiễu ~1,5 MAD trên
  footage K chi tiết (đo được ở lần chạy combo đầu: sanity mask-rect
  ra 1,53/98% rồi về 0,47/100% sau khi sửa); (d) số (B) cửa sổ vào mang
  nhiễu roundtrip yuv của bước overlay trong pipeline tham chiếu
  (~0,1–2,5 MAD) — đã xác định, không phải lỗi sản phẩm.

## 2. Đo 1080p/4K so với render

### 2.1 Wiring (B): 54/54 KHỚP, native và resampled

| Nhóm | (B) MAD lớn nhất | Ghi chú |
|---|---|---|
| 1080p phẳng | 2,00 (fadegrays vào p = 0,1) | Đúng sàn nhiễu tham chiếu FFmpeg của J3 §5 |
| 1080p footage K→L | 1,40 (fadegrays vào p = 0,5) | 0,00–1,40 toàn bộ |
| 4K phẳng | 2,00 (fadewhite vào p = 0,5) | Cùng sàn nhiễu |
| 4K footage K→L | 1,39 (fadegrays vào p = 0,5) | 0,00–1,39 toàn bộ |

Resampled (về 720×1280 lanczos) cho cùng verdict mọi ô, Δ MAD ≤ 0,03
so với native — viewport resample không đổi kết luận.

### 2.2 Gap cặp (A) ở 1080p/4K = số J3 ở 720×1280

| Type | Cửa sổ | p | 1080p (A) | 4K (A) | J3 720×1280 (A) |
|---|---|---|---|---|---|
| fadeblack | ra / vào | 0,5 | 41,01 / 1,09 | 41,01 / 1,09 | — / — |
| fadewhite | ra / vào | 0,5 | 46,14 / 0,25 | 46,14 / 0,25 | 46,14 / 0,25 |
| fadegrays | ra / vào | 0,5 | 50,74 / 51,85 | 51,14 / 52,18 | 51,13 / 52,17 |
| fadewhite | ra / vào | 0,1 | 1,28 / 69,36 | — | 1,17 / 69,89 |
| fadegrays | ra / vào | 0,1 | 8,45 / 77,15 | — | 8,48 / 77,46 |

Phẳng 4K cũng bằng đúng số J3 64×64 (vd fadegrays xanh lá→magenta
ra/vào 63,00/63,67; fadewhite đỏ→xanh ra/vào 59,00/0,33). Kết luận:
không có bug phụ thuộc độ phân giải trong nhánh dip; chi phí vòng lặp
model (Node, không phải browser): 1080p 18–108ms (trung bình 44ms),
4K 75–374ms (trung bình 164ms) — số browser (longtask) ở 4K vẫn chưa
đo, cấm trích số Node thành số browser.

## 3. Sweep p trên footage thật

### 3.1 Đường lệch theo p (MAD gap RGB, 720×1280)

| Cặp | Type | Cửa sổ | 0,0333 | 0,1 | 0,2667 | 0,5 | 0,7333 | 0,9 | 0,9667 | Min |
|---|---|---|---|---|---|---|---|---|---|---|
| KL | fadewhite | ra | 1,9 | 1,2 | 9,8 | 46,1 | 95,3 | 119,9 | **129,5** | 1,17 @0,1 |
| KL | fadewhite | vào | **135,4** | 69,9 | 1,5 | 0,3 | 2,2 | 0,9 | 0,9 | 0,14 @0,3667 |
| KL | fadegrays | ra | 2,8 | 8,5 | 21,9 | 51,1 | 74,4 | 89,5 | **95,1** | 2,78 @0,0333 |
| KL | fadegrays | vào | **83,2** | 77,5 | 60,8 | 52,2 | 27,3 | 10,2 | 3,6 | 3,58 @0,9667 |
| KL | fadeblack | ra | 0,8 | 0,2 | 7,8 | 41,0 | 87,9 | 109,6 | **117,1** | 0,23 @0,1 |
| KL | fadeblack | vào | **93,1** | 45,9 | 0,4 | 1,1 | 1,1 | 1,7 | 0,2 | 0,14 @0,8 |
| JL | fadewhite | ra | 1,7 | 1,2 | 9,8 | 46,1 | 95,3 | 119,9 | **129,5** | 1,07 @0,0667 |
| JL | fadewhite | vào | **105,6** | 53,9 | 1,5 | 0,3 | 2,2 | 0,9 | 0,9 | 0,14 @0,3667 |
| JL | fadegrays | ra | 2,2 | 5,9 | 15,2 | 30,1 | 47,0 | 57,7 | **62,0** | 2,15 @0,0333 |
| JL | fadegrays | vào | **59,4** | 51,7 | 40,3 | 27,2 | 14,5 | 5,3 | 1,6 | 1,65 @0,9667 |
| JL | fadeblack | ra | 0,9 | 0,2 | 7,8 | 41,0 | 87,9 | 109,6 | **117,1** | 0,21 @0,1 |
| JL | fadeblack | vào | **122,7** | 62,0 | 0,4 | 1,1 | 1,1 | 1,7 | 0,2 | 0,14 @0,8 |

Đọc đường cong đúng cách:

- **p lệch nhất là biên, không phải giữa:** vào lệch nhất ở p nhỏ nhất
  (0,0333), ra lệch nhất ở p lớn nhất (0,9667). Cơ chế: vào lệch =
  aAlpha·(A − dip) (aAlpha → 1 khi p → 0, pair khi đó còn chủ yếu là
  A); ra lệch = bAlpha·(B − dip) (bAlpha → 1 khi p → 1). Cả hai đều
  là hệ quả trực tiếp của kiến trúc đơn clip, không liên quan offset.
- **Bằng chứng lý thuyết khớp từng chữ số:** gap ra của fadeblack và
  fadewhite của KL và JL bằng nhau EXACT (46,14 / 129,5 / 117,1…) vì
  chỉ phụ thuộc B (= L, chung hai cặp) — đúng công thức J3 §3. Ai
  nghi ngờ số đo thì đây là đối chứng nội bộ mạnh nhất.
- **fadewhite/fadeblack vào KHỚP từ p ≈ 0,27 trở đi** (gap 0,14–2,2,
  min 0,14 ở p = 0,3667/0,8) — đúng ngưỡng aAlpha = 0 của J3. Fadegrays
  vào KHÔNG BAO GIỜ về ~0 (min 3,58/1,65 ở biên phải) vì gray(A) ≠
  gray(B) từng pixel — đúng cơ chế §3 J3.
- **Đường YUV có cùng hình dạng** (worst-p yuv trùng rgb ở mọi ô);
  chỉ khác ở mức tuyệt đối — xem §4.

### 3.2 Offset YUV: đúng ở giữa cửa sổ, sai ở vùng bão hòa

Bảng corrected tại p mẫu (gapRGB / gapYUV / corrected; m = dip.a+dip.b):

| Cặp | Type | Cửa sổ | p = 0,1 | p = 0,2667 | p = 0,5 | p = 0,7333 | p = 0,9 |
|---|---|---|---|---|---|---|---|
| KL | fadewhite | vào | 69,89 / 57,52 / 67,86 | 1,46 / 8,30 / 9,36 | 0,25 / 14,37 / **2,28** | 2,22 / 4,22 / **1,55** | 0,94 / 3,69 / **2,11** |
| KL | fadewhite | ra | 1,17 / 10,56 / 0,52 | 9,82 / 0,00 / 17,67 ✗ | 46,14 / 31,63 / 43,97 | 95,30 / 88,34 / 94,00 | 119,89 / 116,45 / 118,12 |
| KL | fadeblack | vào | 45,93 / 35,58 / 47,58 | 0,40 / 7,51 / 12,49 ✗ | 1,09 / 14,18 / **1,79** | 1,09 / 4,17 / **1,99** | 1,71 / 3,22 / **1,56** |
| KL | fadeblack | ra | 0,23 / 10,74 / 1,36 | 7,83 / 0,00 / 20,00 ✗ | 41,01 / 28,20 / 42,20 | 87,94 / 83,26 / 89,26 | 109,62 / 108,88 / 110,88 |
| KL | fadegrays | vào | 77,46 / 77,18 / 79,60 (luma) | 60,80 / 60,45 / 62,23 | 52,17 / 51,46 / 48,85 | 27,27 / 26,48 / 25,72 | 10,19 / 9,64 / 9,46 |
| KL | fadegrays | ra | 8,48 / 8,64 / 8,64 | 21,94 / 22,14 / 22,14 | 51,13 / 51,86 / 50,24 | 74,37 / 75,26 / 73,89 | 89,48 / 90,07 / 88,72 |

(KL và JL cho cùng số ở các ô ra của fadeblack/fadewhite và các ô
vào p ≥ 0,2667 — đúng tính chất chỉ-phụ-thuộc-B / chỉ-phụ-thuộc-A;
bảng đầy đủ 60 ô trong JSON.)

Kết luận về giả thuyết offset (đợt 24 H3):

1. **Worst-p KHÔNG do offset:** lệch lớn nhất ở biên là do trọng số
   của clip còn lại (≈ 0,93–1,0 × độ lệch nội dung), lớn hơn offset
   tối đa (~20) nhiều lần. Trừ offset ở biên không đổi verdict (vẫn
   LỆCH, đúng số).
2. **Offset CÓ và giải thích được phần dư giữa cửa sổ (cửa sổ vào):**
   fadewhite/fadeblack vào p = 0,5–0,9: gapYUV 3,7–14,4 → corrected
   1,55–2,28 (XẤP XỈ/KHỚP, về gần gapRGB 0,25–2,22). Signed
   YUV−RGB ≈ c·m cộng thêm ~+1,5–3 (trắng) — phần thêm này chưa có
   tên, có thể là roundtrip yuv của toàn khung, không ảnh hưởng
   verdict.
3. **Vùng bão hòa p ≈ 0,17–0,27 (PHÁT HIỆN MỚI, đã chứng minh bằng
   mặt phẳng Y):** pairYUV của fadewhite ra ở n = 35..38 là trắng
   thuần (mean 255,0; mặt phẳng Y trung bình 244,6, min 237, max 255)
   trong khi B nguồn tối (mean ~120) và lý thuyết cho ~247 — tức
   xfade blend về trắng full-range 255 thay vì limited 235 rồi clip
   về 255 khi chuyển lại RGB. Hệ quả: gapYUV ≈ 0,0000–0,0028 trong khi
   gapRGB = 7,8–9,8, và trừ offset làm tệ hơn (17,7–20,0). Fadeblack
   đối xứng ở phía tối (gapYUV 0,0028, corrected 20,00). Số lý thuyết
   của hiện tượng này chính là +23,1·m (trắng) / −18,6·m (đen) của
   I4 §4 — tức I4 đã đo đúng offset, nay đã rõ cơ chế: cực blend của
   xfade ở YUV là full-range, không phải limited-range. Đây là hành vi
   của render, không phải lỗi preview: canvas RGB đúng model hơn
   render YUV ở vùng này.
4. **Fadegrays: KHÔNG có offset hằng** (đúng I4 §4): signed YUV−RGB
   chỉ ±3, không theo c·m; model luma không cải thiện gapYUV (vào
   p = 0,5: 51,46 → 48,85, vẫn LỆCH; gapRGB 52,17). Độ lệch YUV của
   fadegrays ≈ độ lệch RGB — nó là gap kiến trúc, không phải offset.

## 4. Tổ hợp dip + mask / SR / track / motion blur (p = 0,5, K→L)

Sanity = transform không dip (model vs tham chiếu cùng frame nguồn);
(B) = dip sau transform vs tham chiếu; (A) = dip sau transform vs
xfade của 2 clip đã transform. fadewhite trước, fadegrays sau trong
mỗi ô (A)/(B) — viết tắt FW/FG.

| Tổ hợp | Sanity ra / vào | (B) FW ra / vào | (B) FG ra / vào | (A) FW ra / vào | (A) FG ra / vào |
|---|---|---|---|---|---|
| mask-rect | 0,47 / 0,56 KHỚP | 0,08 / 0,65 KHỚP | 0,35 / 0,66 KHỚP | 117,66 / 106,88 LỆCH | 21,87 / 23,98 LỆCH |
| mask-ellipse | 0,38 / 0,45 KHỚP | 0,07 / 0,51 KHỚP | 0,27 / 0,52 KHỚP | 127,69 / 119,56 LỆCH | 17,78 / 19,43 LỆCH |
| SR 1,3× + 15° | 1,26 / 1,90 KHỚP | 0,16 / 1,99 KHỚP | 0,99 / 2,26 XẤP XỈ | 44,36 / 2,15 XẤP XỈ | 55,52 / 60,83 LỆCH |
| track +80,−40 | 2,02 / 2,16 XẤP XỈ | 0,00 / 1,83 KHỚP | 1,61 / 2,55 XẤP XỈ | 61,81 / 23,54 LỆCH | 46,07 / 49,26 LỆCH |
| motion blur tmix×3 | 0,00 / 0,00 KHỚP | 0,00 / 1,69 KHỚP | 0,85 / 1,69 KHỚP | 46,15 / 0,25 KHỚP | 41,53 / 41,93 LỆCH |

Đọc đúng từng tổ hợp:

- **Mask — (B) KHỚP, (A) fadewhite phình to vì dip render là toàn
  khung:** ngoài vùng mask, pair = 0,653·trắng (≈167) trong khi single
  = đen (dip bị skip ở pixel alpha = 0, đúng thiết kế J3) → dự đoán
  0,64×167 ≈ 107 + trong vùng ~16 ≈ 123, đo được 117,7/106,9 (vào:
  trong vùng pair ≡ single nên chỉ còn đúng số hạng ngoài vùng
  106,9 ≈ 107 — khớp dự đoán tới ~1 MAD). Fadegrays không phình
  (gray(đen) = 0 nên ngoài vùng pair = 0 = single; 17,8–24,0 ≈ đúng
  phần trong vùng mask × tỷ lệ diện tích). Kết luận: mask + dip vẽ
  đúng; gap cặp của mask+fadewhite là hệ quả của "dip toàn khung"
  bên render, không sửa được ở tầng đơn clip.
- **SR — (B) KHỚP/XẤP XỈ** (sai số bilinear canvas-vs-FFmpeg 1–2 mức;
  FG vào 2,26 XẤP XỈ, ≤8 99,89% — biên mỏng nhất của bảng, do gray
  khuếch đại sai số resample). **(A) fadewhite vào 2,15 XẤP XỈ** (so
  với 0,25 không SR): chỉ còn số hạng góc không phủ (~1,3% diện tích
  × 167 ≈ 2,2 — khớp); ra 44,36 ≈ 46,14 không SR. FG (A) 55,5/60,8
  lớn hơn không SR (51,1/52,2) vì resample đổi thống kê xám.
- **Track — sanity XẤP XỈ (2,02/2,16)** là nhiễu roundtrip yuv của
  bước overlay trong pipeline tham chiếu (≤8 ≥ 99,96%), không phải
  lỗi model (shift nguyên pixel là chính xác). **(B) KHỚP/XẤP XỈ**
  (ra FW 0,0000 chính xác vì alpha = 0 triệt tiêu nội dung).
  **(A) đúng công thức vùng không phủ:** vào FW 23,54 ≈ 13,9% diện
  tích ngoài overlap × 167 ≈ 23,2; ra FW 61,81 ≈ 0,861×45 + 23 ≈ 62.
- **Motion blur — khớp đẹp nhất:** sanity **0,0000/0,0000** (model
  trailing-avg của preview ≡ tmix của render khi snapshot là frame
  trailing lý tưởng — khóa ngữ nghĩa T1 đợt 12 bằng số thật);
  **(B) KHỚP** (0–1,69; 1,69 ở cửa sổ vào là nhiễu overlay của tham
  chiếu, xem §1); **(A) FW vào 0,25 KHỚP** (như không blur), FW ra
  46,15 ≈ 46,14 không blur, FG 41,5/41,9 NHỎ HƠN không blur
  (51,1/52,2) vì blur trung bình làm phẳng chênh xám từng pixel.
  Lưu ý trung thực: sanity 0,0000 giả định snapshot là frame trailing
  lý tưởng; trong app thật snapshot có thể cũ hơn khi scrub/seek
  (K3 §4.4) — đó là nhiễu vận hành, không phải sai ngữ nghĩa.

## 5. Đề xuất badge (parent quyết — KHÔNG tự đổi code trong luồng này)

- **Giữ `matched` cho fadeblack, fadewhite, fadegrays** theo chuẩn dự
  án (mô hình cặp KHỚP + canvas vẽ đúng projection đơn clip): luồng
  này bổ sung wiring KHỚP ở 1080p/4K (54/54) và (B) tổ hợp KHỚP/XẤP
  XỈ (20/20 ô). Không có ô (B) nào LỆCH, không có bằng chứng nào đòi
  hạ badge. Các gap (A) đều là giới hạn kiến trúc đơn clip đã ghi từ
  J3, không phải hồi quy.
- **Đề xuất bổ sung vào mô tả giới hạn của badge** (chỉ ghi chú, không
  đổi tập matched): (i) đường YUV của render bão hòa về trắng/đen
  thuần ở p ≈ 0,17–0,27 (canvas RGB đúng model hơn ở đó); (ii) clip có
  mask/track/SR: gap preview-vs-render lớn hơn clip thường vì dip
  render phủ toàn khung còn dip canvas chỉ trong vùng clip chiếm
  (mask+fadewhite (A) tới ~128, track+fadewhite ~62, so với ~46 không
  tổ hợp).
- **Nếu parent muốn chuẩn chặt hơn** (badge chỉ khi frame đơn clip
  cũng KHỚP pair, cả 2 cửa sổ): cả 3 type phải về approx — như J3 §7
  đã phân tích, chuẩn đó cũng hạ cả wipe/slide/dissolve nên không
  khuyến nghị.

## 6. Chưa đo / nợ còn lại (không mạo nhận)

- **Browser thật ở 1080p/4K:** luồng này đo model Node + FFmpeg; K3
  mới click-test ở project 720p. Longtask dip ở 4K trên browser chưa
  đo (Node: 75–374ms, không được trích thành số browser).
- **Wiring DOM/offscreen của tổ hợp trên browser thật:** (B) tổ hợp ở
  đây là model harness, chưa phải click-test như K3.
- **Clip ngắn cả 2 cửa sổ cùng active** (dip theo cửa sổ vào, alpha
  tích — J3 mới lập luận, chưa đo cả ở Node lẫn browser).
- **Baseline nguồn frame footage động (K3 §4.4)** vẫn mở: preview của
  app lệch control ~4–6 MAD resampled ngay cả không có dip — mọi
  claim preview-vs-control trên footage động phải trừ baseline này.
- Safari / máy thật / dpr > 1 / viewport khác (toàn bộ đo Node +
  FFmpeg, không qua trình duyệt).
- fadeblack YUV kênh G: fit −21,05 nhưng signed G lệch ít hơn R/B
  (~−10,7 so với ~−13,7 ở p = 0,5) — dư số nhỏ chưa giải thích, không
  đổi verdict (corrected vẫn KHỚP).
- Số (B) cửa sổ vào mang nhiễu overlay-roundtrip của pipeline tham
  chiếu (~0,1–2,5 MAD) — đã xác định cơ chế, không phải lỗi sản phẩm.

## 7. Kiểm chứng và file đổi/thêm

- `node --check server/render/src/measure_r28_l6_dip_coverage.js`: pass.
- Sweep: 696 ô gap + 60 ô corrected, JSON đầy đủ; res: 54 ô;
  combo: 30 ô (10 sanity + 20 (B)/(A)). Các lần chạy combo lặp lại cho
  cùng số tới 4 chữ số thập phân (tính xác định của pipeline).
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (footage + log chỉ ở
  `~/workspace/tmp-round28-l6/` ngoài repo; workdir đo đã xoá, còn
  footage + logs; trong repo không còn file .raw nào). KHÔNG sửa
  `App.tsx`, `store.ts`, i18n (luồng khác sở hữu). KHÔNG tự ghi file
  paths-loop, KHÔNG ghi build-loop-log (parent lo).

File đổi/thêm (text, không binary — parent gộp batch):

- Mới: `server/render/src/measure_r28_l6_dip_coverage.js` — harness
  3 chế độ res/sweep/combo (transpile chính code sản phẩm:
  `transitionPreview.ts` + `previewEngine.ts` với stub
  `@repo-1/video-spec`; tham chiếu FFmpeg độc lập; xoá raw sau mỗi
  phép đo).
- Mới: `docs/PHASE9_ROUND28_L6_DIP_COVERAGE_LIMITS.md` — file này.
- Mới: `benchmarks/results/v28-l6-dip-1080p-4k.json` — res (54 ô).
- Mới: `benchmarks/results/v28-l6-dip-sweep.json` — sweep (696 ô gap
  + 24 worst + 60 ô corrected).
- Mới: `benchmarks/results/v28-l6-dip-combo.json` — combo (30 ô).

Không sửa code sản phẩm (không file `src/` nào đổi trong luồng này).
