# PHASE9 ROUND 24 — H3: fadeblack dip qua đen trong preview + fade native/4K

Ngày đo: 2026-10-30. FFmpeg 8.1.2. Thang V6: KHỚP = MAD ≤ 2 VÀ ≥ 99% pixel
lệch ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại là LỆCH.
Tất cả số MAD dưới đây đo ở frame giữa transition (n=45 @30fps, p=0,5)
trừ khi ghi khác; đối chứng trích lặp frame A luôn = 0 (phương pháp xác định).

## 1. Mô hình đã dạy vào preview

`describeTransition("fadeblack", p, …)` trong
`apps/web/src/lib/transitionPreview.ts` trước đây là alpha tuyến tính
(1−p / p) — tức không có dip qua đen. Đợt 23 G5 đo mô hình cũ này LỆCH
nặng (footage RGB MAD 34,6082). Đợt 24 H3 tách riêng case `fadeblack`:

- A tắt theo smoothstep `S(t) = 3t² − 2t³` trên đoạn hiệu chuẩn
  `[−0,01, 0,196]` (tắt hẳn từ p ≈ 0,20, không phải p = 0,5).
- B mở theo smoothstep trên `[0,122, 1,076]` (tại p = 0,5 B ≈ 0,347,
  không phải 0 như dip nửa-nửa, cũng không phải 0,28 — xem §3 về bản
  fit trung gian đã bị loại).
- Ghim 2 biên về đúng render: p = 0 → A = 1, B = 0; p = 1 → A = 0,
  B = 1 (probe đo được 1,000 ở cả 2 biên).
- Composite `A·αA + B·αB` trên nền đen (harness) và canvas đơn clip trên
  nền đen (`preview.tsx`) đều vẽ đúng dip này chỉ bằng alpha — không
  cần số hạng màu mới. Clip ra mờ dần về đen ở nửa đầu, clip vào sáng
  dần từ đen ở nửa sau.
- Các type khác không đổi hành vi: `fade` tuyến tính, `dissolve`,
  `circleopen`, `fadewhite`/`fadegrays` (vẫn alpha tuyến tính cũ —
  nợ, xem §4) đều được khóa bằng hồi quy trong
  `transitionPreview.test.ts` (28 pass, 0 fail; tsc apps/web = 0 lỗi).

## 2. Số đo trước/sau (mô hình MỚI so với alpha tuyến tính CŨ)

### 2.1 Flat sweep: cặp đỏ→xanh phẳng 64×64, 30fps, từng frame n=30..59

Script: `server/render/src/measure_r24_h3_fade.js --flat`.
Kết quả đầy đủ: `benchmarks/results/v24-h3-fade-flat.json`.

Đường RGB (format=rgb24 ép TRƯỚC xfade — đường không bị offset mức
đen, xem §3): **30/30 KHỚP, MAD tệ nhất 1,0000** (p = 0,5: MAD 0,6667,
≤8 = 100%). Đây là bằng chứng trọng số của mô hình là đúng.

Đường YUV (lavfi thẳng vào xfade — đúng đường render thật):
MAD tệ nhất 6,6667; vùng giữa (p = 0,10–0,60) LỆCH với ≤8 kẹt ở
66,67% — đúng dấu vết của offset mức đen §3 (1 trong 3 kênh lệch
> 8, 2 kênh còn lại khớp tuyệt đối). p = 0,5: MAD 5,3333, ≤8 = 66,67%.

### 2.2 Footage (frame 45, p = 0,5)

Footage lấy bằng `scripts/fetch-r22-footage.sh` (SHA256 trùng đợt 23):
J `07c81538…740501e` (1080×1920), K `49f33b83…2db6d69c` (1080×1920),
L `0e2df0ee…33e3cdb8b3aa5f94` (608×1080).

| Cặp / kích thước | Đường | fadeblack MỚI | fadeblack CŨ | fade MỚI |
|---|---|---|---|---|
| K→L 720×1280 | RGB (harness R23) | **1,0916 / 100% KHỚP** | 34,6082 / 0,56% LỆCH | 0,5008 / 100% KHỚP |
| K→L 720×1280 | YUV-in (đường render thật) | 14,1800 / 0,99% LỆCH | 48,1938 / 0,12% LỆCH | 0,8352 / 99,91% KHỚP |
| K→L 1080×1920 native | RGB | **1,0913 / 100% KHỚP** | 34,9975 / 0,40% LỆCH | 0,5002 / 100% KHỚP |
| K→L 1080×1920 native | YUV-in | 14,1782 / 0,99% LỆCH | 48,2092 / 0,12% LỆCH | 0,8023 / 99,91% KHỚP |
| J→K 2160×3840 (upscale, xem §4) | RGB | **0,7621 / 100% KHỚP** | 78,2084 / 0,54% LỆCH | 0,5008 / 100% KHỚP |
| J→K 2160×3840 (upscale) | YUV-in | 13,1498 / 0,32% LỆCH | 91,2317 / 0,00% LỆCH | 0,6413 / 99,87% KHỚP |

Kết quả JSON từng lần đo: `benchmarks/results/v24-h3-fade-720-rgb.json`,
`v24-h3-fade-720-yuvin.json`, `v24-h3-fade-native1080-rgb.json`,
`v24-h3-fade-native1080-yuvin.json`, `v24-h3-fade-4k-rgb.json`,
`v24-h3-fade-4k-yuvin.json`.

Đọc bảng đúng cách: mô hình MỚI **KHỚP trên mọi cặp footage ở đường
RGB** (trọng số đúng) và **cải thiện 3,4–7 lần so với mô hình cũ trên
đường YUV** (14,18 so với 48,19 ở 720p; 13,15 so với 91,23 ở 4K) nhưng
vẫn LỆCH ở đó — phần còn lại là offset mức đen §3, không phải sai
trọng số. Fade tuyến tính KHỚP ở mọi kích thước, cả 2 đường
(0,50–0,84): fade không qua đen nên không bị offset này.

### 2.3 Fade ở native/4K (mục đo mới của đợt H3)

Fade crossfade tuyến tính (không đổi code): native 1080p RGB MAD
0,5002 / YUV-in 0,8023; 4K upscale RGB MAD 0,5008 / YUV-in 0,6413 —
tất cả KHỚP. Fade không nhạy kích thước và không nhạy format trước
xfade. Caveat 4K xem §4.

## 3. Phát hiện then chốt: offset mức đen của đường YUV (đọc kỹ trước khi sửa mô hình)

### 3.1 Trọng số thật lấy từ đường RGB, không phải đường YUV

Probe dày đặc đường RGB (đỏ→xanh phẳng, format=rgb24 trước xfade),
trọng số đo được (A = kênh R/254, B = kênh B/254):

| frame | p | A | B | frame | p | A | B |
|---|---|---|---|---|---|---|---|
| 30 | 0,000 | 0,996 | 0,000 | 45 | 0,500 | 0,000 | 0,339 |
| 31 | 0,033 | 0,890 | 0,000 | 48 | 0,600 | 0,000 | 0,504 |
| 33 | 0,100 | 0,445 | 0,004 | 51 | 0,700 | 0,000 | 0,669 |
| 35 | 0,167 | 0,059 | 0,016 | 54 | 0,800 | 0,000 | 0,799 |
| 36 | 0,200 | 0,000 | 0,028 | 59 | 0,967 | 0,000 | 0,965 |

Fit smoothstep trên dữ liệu RGB: A trên [−0,01, 0,196] (rmse 0,0015,
sai số tối đa 0,0042); B trên [0,122, 1,076] (rmse 0,0072, tối đa
0,0129). Đây là mô hình đang dùng (§1).

### 3.2 Vì sao đường YUV trông khác: blend về Y=0, không phải Y=16

Đường YUV của FFmpeg blend về mức đen (Y=0, U=V=128) thay vì đen
limited-range (Y=16, U=V=128). Hệ quả khi convert sang RGB: mỗi kênh
lệch thêm một hằng số ≈ −1,164×16×(1−w) = −18,6×(1−w) (≈ −12 ở
p = 0,5, w ≈ 0,35). Bằng chứng:

- Fit có hệ số chặn `render = w·B + c` trên footage YUV-in 90×160
  frame 45: R: w = 0,3374, c = −14,08, MAD 0,909; G: w = 0,3378,
  c = −10,87, MAD 0,575; B: w = 0,3376, c = −14,39, MAD 1,150.
  So với fit không chặn: w ≈ 0,25, MAD ≈ 4,3. Tức trọng số thật
  trên footage YUV cũng là ≈ 0,337 — trùng đường RGB (0,339) —
  cộng offset âm ≈ −13. Phần dư còn lại sau khi trừ offset chỉ
  0,6–1,2 MAD (mức nhiễu subsample/encode), không phải sai trọng số.
- Kiểm tra chéo phẳng: render YUV trắng→trắng frame 45 = (73,76,73);
  dự đoán từ mô hình offset: 0,337×255 − 12 ≈ 74. Khớp.
- Fade, dissolve, circleopen không bị vì chúng chỉ blend A với B,
  không đi qua đen. Chỉ họ fade-to-black mới nhạy format trước xfade.

### 3.3 Bản fit trung gian đã bị loại (ghi để khỏi quay lại)

Bản hiệu chuẩn đầu đợt H3 fit trực tiếp trên dữ liệu YUV mà không
tách offset, cho A [−0,006, 0,18] và B [0,20, 1,056] (B(0,5) = 0,282).
Bản đó trông đẹp trên flat-YUV (27/30 KHỚP) nhưng sai trọng số thật
~0,055 ở p = 0,5 (do nó hấp thụ offset vào trọng số, và dữ liệu YUV
còn bị clip về 0 khi trọng số nhỏ — đó là lý do đường YUV tưởng như
bắt đầu mở muộn hơn đường RGB). Số của bản đó trên footage 720p:
RGB 6,7005 / YUV-in 6,4408 — đều LỆCH, tệ hơn bản RGB hiện tại trên
đường RGB (1,09 KHỚP) và chỉ "tốt hơn" trên đường YUV vì nó ngụy
trang offset thành trọng số thấp. Bản RGB hiện tại được giữ vì nó
đúng trọng số trên mọi đường; phần YUV còn lệch được ghi rõ là sàn
offset (§4), không giấu bằng trọng số sai.

### 3.4 Phương pháp đo đã xác thực

- Output rawvideo dùng `-vsync 0` (mặc định vsync nhân frame đầu
  thành 91 frame thay vì 90; `select='eq(n,45)'` đã chứng minh bằng
  byte với frame 45 thật).
- Frame tham chiếu A/B lấy từ chính render (frame thuần n=29/n=60
  ở flat; win+1,5/win+0,5 ở footage) nên sweep chỉ đo sai số trọng
  số, không lẫn sai số màu nguồn.
- Render thật dùng đường YUV: đã xác minh tận tay
  `server/render/src/render.js` (chuẩn hoá về yuv420p trước xfade) —
  vì vậy số yuv-in mới là số đường sản phẩm; số RGB đo trọng số.

## 4. Giới hạn còn lại (trung thực)

1. **Sàn offset mức đen trên đường YUV (~13–14 MAD ở footage,
   ~5–7 MAD ở phẳng):** preview alpha-only KHÔNG thể tái tạo hằng số
   trừ −12 này — canvas alpha chỉ làm được tổ hợp lồi (w·B), không
   trừ được hằng số. Đây là quirk mức đen của xfade trong FFmpeg,
   không phải lỗi mô hình preview. Hệ quả người dùng thấy được:
   ở giữa fadeblack, video export (yuv420p) tối hơn preview khoảng
   12 mức (~5% độ sáng). Muốn khớp hơn nữa cần mô hình có hệ số
   chặn (ngoài khả năng alpha) hoặc sửa mức đen ở render — cả hai
   đều ngoài phạm vi đợt H3.
2. **Badge preview giữ `approx`:** `previewStatus.ts` vẫn xếp
   fadeblack vào `approx` (không có trong `TRANSITION_MATCHED`).
   Đúng — vì đường sản phẩm (YUV) vẫn LỆCH theo thang V6, dù trọng
   số đã đúng và đường RGB đã KHỚP. Chỉ nâng lên `matched` khi có
   bằng chứng KHỚP trên đường sản phẩm.
3. **fadewhite / fadegrays vẫn nợ:** vẫn alpha tuyến tính cũ. Dip
   qua trắng/xám cần số hạng màu trung gian mà `TransitionVisual`
   hiện không có trường nào mang được — cùng lý do như trước đợt H3.
4. **4K là upscale tổng hợp, không phải clip 4K thật:** nguồn J và K
   đều 1080×1920, scale lên 2160×3840 trong chain đo. Số 4K chứng
   minh tính không nhạy kích thước của mô hình, không phải đo trên
   footage 4K gốc. Tương tự, native K→L có caveat: L gốc 608×1080,
   upscale lên 1080×1920 trong chain (giữ đúng mạch G5 §3.2).
5. **Công thức đóng của FFmpeg chưa xác định được:** biên đoạn
   smoothstep là hằng số hiệu chuẩn từ probe, không phải hằng số
   nguồn. Sai số trọng số còn lại so với probe RGB ≤ 0,013.
6. **Trọng số tối ưu theo MAD trên đường YUV phụ thuộc nội dung:**
   fit LS không chặn cho K→L cho 0,2495 ở p = 0,5 (MAD 4,31,
   XẤP XỈ) — nhưng con số này đổi theo độ sáng trung bình của clip
   (lý thuyết: w_LS ≈ w_thật − 12/mean(B)), nên không đưa vào mô
   hình cố định. Ai muốn tối ưu MAD hiển thị trên đường YUV thì đây
   là hướng, với cái giá là trọng số sai và hỏng đường RGB.
7. **Harness V11/V12/V14 không bao hàm fadeblack** (grep không thấy
   type này trong 3 file đó) nên không chạy hồi quy ở đó; hồi quy
   liên quan là `transitionPreview.test.ts` + tsc (mục 1).

## 5. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/transitionPreview.ts` (sửa: case `fadeblack`
  riêng với đường smoothstep hiệu chuẩn RGB + ghim biên + comment
  giải thích offset YUV; các type khác không đổi).
- `apps/web/src/lib/transitionPreview.test.ts` (sửa: test dip
  fadeblack theo điểm neo RGB mới + khóa hồi quy các type khác).
- `server/render/src/measure_r24_h3_fade.js` (mới từ đầu đợt, sửa
  thêm trong đợt này: header cập nhật phát hiện offset; sửa 2 bug
  — `--workdir` tương đối làm `require()` thất bại, output transpile
  trong repo bị coi là ESM do `"type": "module"` — nay transpile ra
  tmpdir hệ thống).
- `benchmarks/results/v24-h3-fade-flat.json` (mới: flat sweep 2 đường).
- `benchmarks/results/v24-h3-fade-720-rgb.json`,
  `v24-h3-fade-720-yuvin.json`, `v24-h3-fade-native1080-rgb.json`,
  `v24-h3-fade-native1080-yuvin.json`, `v24-h3-fade-4k-rgb.json`,
  `v24-h3-fade-4k-yuvin.json` (mới: số footage từng lần đo).
- `docs/PHASE9_ROUND24_H3_FADEBLACK_LIMITS.md` (file này).
- KHÔNG đổi: `apps/web/src/components/transitions/previewStatus.ts`
  (badge giữ `approx`, lý do ở §4.2). KHÔNG stage: các workdir đo
  mới tạo trong đợt này dưới `scratch-h3/` (flat2, foot720*,
  foot1080*, foot4k*) đã xóa sau khi đo xong theo quy định; các file
  scratch cũ từ trước đợt này không đụng tới; binary footage chỉ nằm
  ở `/tmp/vcut-h3-footage/`.
