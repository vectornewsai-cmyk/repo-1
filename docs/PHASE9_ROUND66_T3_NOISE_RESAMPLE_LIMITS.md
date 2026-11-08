# PHASE9 ROUND66 T3 — LIMITS (noise resample: phép resample nào khớp noise headed với render)

Đợt 66, luồng T3 (CHỐT — lần 3; hai lần trước chết do daemon restart).
Nhiệm vụ: chốt từ dữ liệu đã có trên đĩa, KHÔNG đo lại dài, KHÔNG harness/render mới.
Nợ đóng: R65 LIMITS §8 mục 3 (S7) — "Noise headed vẫn LỆCH — cần đợt riêng
khớp phép resample viewport".

## 0. Kết luận ngắn (đọc trước)

- **CHƯA KHỚP toàn diện.** Trong 24 tổ hợp (3 cửa sổ × 2 mức nhiễu × 4 phép
  resample), chỉ **3/24 đạt KHỚP-THỐNG-KÊ** — cả 3 đều là **chrome-rgb**.
  Ba phép còn lại (chrome-yuv, ffmpeg-bilinear, ffmpeg-lanczos): **0/18**.
- **chrome-rgb là ứng viên duy nhất từng khớp**, nhưng chỉ khớp có điều kiện:
  khớp ở scale ≥ ~0,63 cho noise10 (w1920 + w2560) và ở w1920 cho noise05;
  **lệch ở downscale mạnh s ≈ 0,38 (w1440, cả 2 mức)** và lệch sát nút ở
  w2560 noise05 (Δkurt G 0,39 so với ngưỡng 0,35).
- **Không sửa code trong luồng này.** Preview đã dùng đúng đường chrome-rgb
  (`drawImage`, `imageSmoothingQuality="high"` — xem §4); không có sửa nhỏ
  chắc chắn nào khác. Mọi hướng sửa còn lại đều lớn (xem §5).

## 1. Tiêu chí KHỚP-THỐNG-KÊ (giữ nguyên từ R65 S7 / script đợt này)

`KHỚP-THỐNG-KÊ` khi cả 3 điều kiện cùng đúng trên thống kê delta
(delta frame preview−plain so với render−plain, lấy mẫu mỗi 4 px):

- tỉ lệ std từng kênh R/G/B ∈ **[0,85, 1,18]**;
- Δkurt từng kênh ≤ **0,35**;
- Δcorr từng cặp ≤ **0,12**.

(Nguồn: `r66t3-node-sim.mjs` hàm `verdict`, cùng ngưỡng R65 S7 đã dùng.)
So tuyệt đối từng pixel KHÔNG phải tiêu chí cho noise: nhiễu là ngẫu nhiên
theo seed nên MAD tuyệt đối của noise luôn lớn (~11–28) ở mọi phép resample;
chỉ thống kê delta mới phân biệt được.

## 2. Số đo so sánh headed (frame 30 testsrc2)

Nguồn: `hidden_files/round66-t3/r66t3-compare-report.json` (51 KB) +
`r66t3-compare.log`. Ba cửa sổ: w1440 (canvas 871×275, video 489×275,
scale 0,381944), w1920 (1351×455, 809×455, scale 0,631944), w2560
(1991×975, 1733×975, scale 1,354167 — upscale).

### 2.1 Noise — verdict theo deltaStats (std ratio [R,G,B] / Δkurt / Δcorr)

| cửa sổ | mức | chrome-rgb | chrome-yuv | ffmpeg-bilinear | ffmpeg-lanczos |
|---|---|---|---|---|---|
| w1440 | noise05 | LỆCH — std [0,92, 0,83, 0,94], Δkurt [0,16, 0,02, 0,28], Δcorr [0,086, 0,057, 0,077] | LỆCH — std [1,57, 0,84, 1,57], Δkurt [5,20, 0,31, 3,18], Δcorr [0,067, 0,231, 0,272] | LỆCH — std [1,90, 1,33, 1,77], Δkurt [5,50, 0,31, 2,91], Δcorr [0,272, 0,152, 0,028] | LỆCH — std [1,32, 1,00, 1,24], Δkurt [4,07, 0,32, 2,38], Δcorr [0,286, 0,148, 0,024] |
| w1440 | noise10 | LỆCH — std [0,92, 0,76, 0,94], Δkurt [0,09, 0,22, 0,23], Δcorr [0,011, 0,049, 0,076] | LỆCH — std [1,50, 0,78, 1,50], Δkurt [2,86, 0,78, 2,06], Δcorr [0,190, 0,207, 0,293] | LỆCH — std [1,76, 1,20, 1,66], Δkurt [2,88, 0,90, 1,80], Δcorr [0,194, 0,116, 0,035] | LỆCH — std [1,27, 0,93, 1,21], Δkurt [2,26, 0,82, 1,74], Δcorr [0,193, 0,122, 0,035] |
| w1920 | noise05 | **KHỚP** — std [0,99, 0,92, 1,00], Δkurt [0,20, 0,22, 0,01], Δcorr [0,082, 0,032, 0,012] | LỆCH — std [1,32, 0,92, 1,34], Δkurt [3,93, 0,02, 1,87], Δcorr [0,010, 0,137, 0,133] | LỆCH — std [1,55, 1,25, 1,46], Δkurt [4,55, 0,25, 1,97], Δcorr [0,233, 0,053, 0,034] | LỆCH — std [1,08, 0,96, 1,05], Δkurt [2,09, 0,25, 0,91], Δcorr [0,232, 0,056, 0,036] |
| w1920 | noise10 | **KHỚP** — std [0,99, 0,88, 1,00], Δkurt [0,09, 0,01, 0,08], Δcorr [0,036, 0,030, 0,010] | LỆCH — std [1,28, 0,87, 1,31], Δkurt [2,15, 0,45, 1,21], Δcorr [0,081, 0,134, 0,143] | LỆCH — std [1,47, 1,18, 1,41], Δkurt [2,27, 0,90, 1,25], Δcorr [0,166, 0,042, 0,019] | LỆCH — std [1,07, 0,92, 1,05], Δkurt [1,17, 0,77, 0,67], Δcorr [0,162, 0,050, 0,021] |
| w2560 | noise05 | LỆCH — std [1,04, 1,03, 1,05], Δkurt [0,19, 0,39, 0,21], Δcorr [0,095, 0,005, 0,014] | LỆCH — std [1,40, 1,03, 1,40], Δkurt [3,05, 0,16, 1,63], Δcorr [0,001, 0,092, 0,102] | LỆCH — std [1,40, 1,03, 1,39], Δkurt [3,06, 0,14, 1,61], Δcorr [0,001, 0,094, 0,102] | LỆCH — std [0,98, 0,80, 1,00], Δkurt [1,24, 0,07, 0,73], Δcorr [0,016, 0,098, 0,101] |
| w2560 | noise10 | **KHỚP** — std [1,03, 0,98, 1,05], Δkurt [0,27, 0,28, 0,31], Δcorr [0,060, 0,005, 0,018] | LỆCH — std [1,35, 0,98, 1,36], Δkurt [1,50, 0,21, 0,94], Δcorr [0,064, 0,091, 0,110] | LỆCH — std [1,35, 0,98, 1,36], Δkurt [1,48, 0,23, 0,92], Δcorr [0,063, 0,092, 0,111] | LỆCH — std [0,98, 0,77, 1,00], Δkurt [0,76, 0,09, 0,49], Δcorr [0,066, 0,099, 0,105] |

Tổng: **chrome-rgb 3/6 KHỚP; chrome-yuv 0/6; ffmpeg-bilinear 0/6;
ffmpeg-lanczos 0/6.**

Đính chính tiền đề giao việc: "noise10 chrome-rgb KHỚP ở cả 2 cỡ" là
**chưa đúng** — noise10 chrome-rgb KHỚP ở w1920 và w2560 nhưng **LỆCH ở
w1440** (std [0,92, 0,76, 0,94], kênh G 0,76 < ngưỡng 0,85). Báo cáo so
sánh thực tế có **3 cỡ** (w1440/w1920/w2560), không phải 2.

Điểm lệch còn lại của chrome-rgb, theo thứ tự mức độ:

- **w1440 (s ≈ 0,38), cả 2 mức: std thiếu, nhất là kênh G.**
  noise05 std [0,92, 0,83, 0,94] (G 0,83 < 0,85); noise10 std
  [0,92, 0,76, 0,94] (G 0,76). Kurt và corr đều pass ở w1440 — chỉ
  std trượt, tức preview giữ lại ít năng lượng nhiễu hơn render sau
  downscale mạnh (hoặc render giữ lại nhiều hơn).
- **w2560 noise05: kurt G sát nút.** std pass [1,04, 1,03, 1,05], corr
  pass, nhưng Δkurt [0,19, 0,39, 0,21] — G 0,39 vượt ngưỡng 0,35 chỉ
  0,04. Cùng mức noise05 ở w1920 thì Δkurt G chỉ 0,22.
- **Mẫu hệ thống:** R và B lệch cùng chiều, G lệch riêng (ở chrome-yuv/
  bilinear thì R/B phồng 1,28–1,90 trong khi G ~0,76–1,33) — đúng dấu
  hiệu resample tác động khác nhau lên kênh G so với R/B, không phải
  lỗi model nhiễu N3 (model đã khớp full-res, xem §3).

### 2.2 MAD tuyệt đối (chỉ tham khảo — không phải tiêu chí noise)

Noise: MAD tuyệt đối 10,2–28,6 ở mọi phép/cỡ (vd w2560 noise10:
chrome-rgb 26,213; bilinear 25,251; lanczos 28,643). Con số này chủ yếu
là biên độ nhiễu, không phân biệt được phép resample — không dùng để
kết luận.

Plain (sàn đối chứng, không nhiễu): chrome-rgb tốt nhất mọi cỡ —
w1440 MAD 1,19 / le8 97,4% (XẤP XỈ); w1920 MAD 0,961 / le8 99,8%
(**KHỚP**); w2560 MAD 1,007 / le8 99,3% (**KHỚP**). ffmpeg-bilinear
plain: w1440 MAD 1,228 / le8 96,0%; w1920 MAD 1,041 / le8 96,8%;
w2560 MAD 1,052 / le8 97,1% — luôn kém chrome-rgb. Sàn plain cho thấy
ngay cả không có nhiễu, downscale w1440 vẫn chỉ XẤP XỈ.

### 2.3 Quan sát phụ: chrome-yuv ≈ ffmpeg-bilinear ở upscale

Ở w2560, chrome-yuv và ffmpeg-bilinear cho số gần như giống hệt nhau
cả 2 mức nhiễu (noise05: std [1,40, 1,03, 1,40] vs [1,40, 1,03, 1,39];
Δkurt [3,05, 0,16, 1,63] vs [3,06, 0,14, 1,61]) — resample theo plane
YUV420p rồi convert RGB có hành vi thống kê giống bilinear, không giống
đường RGB của Chrome. Đây là bằng chứng thêm rằng đường preview thật
(Chrome RGB) khác đường YUV của render, và chrome-yuv không phải đáp án.

## 3. Mô phỏng Node: phần dư w1440 KHÔNG tái tạo được bằng model nhiễu

Nguồn: `hidden_files/round66-t3/r66t3-node-sim.json` +
`r66t3-node-sim.mjs` (áp model preview `applyNoise` seed 42 lên frame
plain full-res, resample cả 2 phía bằng model chrome-resample, so thống
kê delta — không cần browser).

- **Full-res: KHỚP cả 2 mức** (tái tạo đúng kết luận S7): noise05 std
  [1,02, 1,00, 1,04], Δkurt [0,11, 0,29, 0,04], Δcorr [0,051, 0,018,
  0,004]; noise10 std [1,02, 0,97, 1,04], Δkurt [0,22, 0,13, 0,09],
  Δcorr [0,032, 0,011, 0,006]. Model nhiễu N3 (kCb=1,04/kCr=1,12) vẫn
  khớp trước khi resample.
- **Sau resample Node: w1920/w2560 KHỚP cả 2 mức; w1440 LỆCH cả 2 mức**
  (noise05: Δcorr R 0,139 > 0,12; noise10: Δkurt B 0,38 > 0,35).
- **Điểm mấu chốt:** Node KHÔNG tái tạo được vết lõm std ở w1440 headed.
  Node cho w1440 noise05 std [1,02, 1,05, 1,04] trong khi headed
  chrome-rgb cho [0,92, 0,83, 0,94]; noise10 Node [1,01, 0,98, 1,04]
  vs headed [0,92, 0,76, 0,94]. Tức phần dư std ở w1440 headed **không
  nằm trong cấu trúc nhiễu của model** (giả thuyết B của node-sim bị
  bác ở phần std) — mà nằm ở **bộ lọc Chrome thật ở s ≈ 0,38 khác model
  chrome-resample** (giả thuyết A còn mở). Lưu ý Node vẫn LỆCH ở w1440
  nhưng vì lý do khác (corr/kurt), nên cả 2 nguồn lệch có thể cùng tồn
  tại; không được gộp chúng thành một nguyên nhân.

## 4. Bộ lọc Chrome thật ở w1440: không kernel đơn nào fit được

Nguồn: `hidden_files/round66-t3/r66t3-fit-w1440.log` (sweep kernel × độ
giãn) + header `apps/web/scripts/chrome-resample.mjs` (mô hình probe
Chromium 1254).

- Model chrome-resample đã xác định: kernel **tam giác** K(x)=max(0,1−|x|)
  (bilinear); vị trí lấy mẫu S=(i+0,5)/s_thực; kéo giãn
  h=max(1, 1/(2s)) khi downscale (bằng NỬA thang chuẩn 1/s — Chrome giữ
  lại HF nhiều hơn ffmpeg bilinear/lanczos); "high" == "medium" từng
  byte; "low" = nearest.
- Model này **khớp từng số** ở s=2,0 / 0,5 / 0,25 (madPeak=0) và ở
  s=0,6328 (w1920) / 1,3535 (w2560) (madPeak ≤ 0,02), nhưng **LỆCH ở
  s=0,3828 (w1440)**: madPeak 16,4, peakI đúng 87,5%.
- Sweep fit w1440 (triangle/Mitchell/Catmull-Rom/B-spline/Lanczos2 ×
  h 0,6–2,6): tốt nhất là **triangle, biến thể B
  h=max(1, 1/(2·min)) cả 2 trục** — madPeak=8,19, madSum=7,27,
  peakI=93,8%, madImp2d=0,007, |ΔV2D|=0,0036. Nhưng madPeak 8,19 vẫn
  lớn (đơn vị mức xám 0–255) — fit tốt nhất vẫn chưa phải là bộ lọc
  thật. Hệ số phương sai V đo được 0,2141 vs model h=1,306 cho 0,1948
  (lệch ~9% V, ~5% std) — cùng bậc với vết lõm std headed ở §2.1.
- Kết luận: ở downscale mạnh, Chrome dùng thứ gì đó không phải một
  kernel tách được (separable) duy nhất trong lưới đã probe — có thể là
  2-pass khác nhau theo trục, làm tròn vị trí khác, hoặc đường GPU.
  Chưa xác định được; cần probe sâu hơn (xem §5).

## 5. Preview dùng gì, render dùng gì — và khác biệt còn lại là gì

- **Preview (viewport):** Chrome canvas `drawImage` trên ctx chính
  (`apps/web/src/preview.tsx:1902`, comment 1885–1901),
  `imageSmoothingEnabled=true`, `imageSmoothingQuality="high"`.
  Đây chính là đường **chrome-rgb** trong so sánh — tức preview đã
  dùng phép resample khớp nhất trong 4 phép được đo. Đường offscreen
  effect-canvas (`preview.tsx:280`) cũng đặt "high" nhưng thường vẽ
  1:1 nên không phải bước resample viewport.
- **Render:** FFmpeg `scale=${W}:${H}:force_original_aspect_ratio=decrease`
  (`server/render/src/render.js:672`), **không đặt `flags=`** trong
  chuỗi → mặc định của filter scale FFmpeg (bilinear). Harness đã đo
  cả 2 ứng viên render (ffmpeg-bilinear, ffmpeg-lanczos) — cả 2 đều
  0/6 KHỚP noise.
- **Khác biệt còn lại, gọn lại thành 2 phần:**
  1. **Bộ lọc resample khác nhau** (nguyên nhân chính, đã chứng minh):
     Chrome "high" giữ HF nhiều hơn (h = 1/(2s) thay vì 1/s) và ở
     s≈0,38 thì không khớp bất kỳ kernel đơn nào trong lưới probe;
     ffmpeg bilinear/lanczos triệt HF mạnh hơn và làm phồng std R/B
     (tới 1,90 ở w1440) đồng thời bẻ kurt/corr của render (kurt R
     render tăng 5,73→8,46 sau downscale bilinear w1440 — R65 S7 §1.4).
  2. **Không gian màu khác nhau** (nguyên nhân phụ, đã biết từ R65):
     preview cộng nhiễu trên base RGB derived, render cộng nhiễu trên
     plane YUV native rồi convert — model N3 đã bù phần này ở full-res
     (khớp), nhưng sau resample 2 đường vẫn biến đổi khác nhau.

## 6. Vì sao không sửa code trong luồng này

- Preview đã dùng đường khớp nhất (chrome-rgb/"high"); không có flag
  hay setting nào khác để chỉnh — "high" == "medium" từng byte, "low"
  tệ hơn hẳn (nearest).
- Không thể đặt scaler render thành "bộ lọc của Chrome": không có flag
  FFmpeg nào tái tạo được nó, nhất là khi ở s≈0,38 bản thân bộ lọc
  Chrome còn chưa xác định được (§4).
- Không chỉnh model N3 (kCb/kCr) để "bù" resample: R65 S7 đã cấm rõ —
  mọi can thiệp vào model để bù resample sẽ phá khớp full-res, mà
  full-res hiện đang khớp cả 2 mức (§3).
- Hướng sửa còn lại đều là thay đổi kiến trúc, không phải sửa nhỏ:
  (a) áp nhiễu **sau** downscale trong preview (đổi thứ tự effect —
  cần thiết kế lại effect canvas + verify lại toàn bộ parity effect);
  (b) probe sâu bộ lọc Chrome ở s≈0,38 (sweep 2D không tách được,
  vị trí lấy mẫu theo trục, đường GPU vs CPU) rồi mô phỏng đúng trong
  harness — chỉ giúp **đo** khớp hơn, không sửa được preview thật;
  (c) chấp nhận XẤP XỈ ở w1440 và chỉ claim khớp ở scale ≥ ~0,63.
  Cả 3 đều vượt phạm vi "sửa nhỏ, chắc chắn, verify < 5 phút" của
  luồng chốt — ghi vào nợ mở (§7), không làm liều.

## 7. Nợ mở

1. Noise headed vẫn LỆCH-THỐNG-KÊ ở w1440 (cả 2 mức, chrome-rgb) và
   w2560 noise05 (sát nút kurt G 0,39 > 0,35). Claim khớp chỉ đúng với
   điều kiện §0/§2.1.
2. Bộ lọc Chrome ở s≈0,38 chưa xác định được (madPeak tốt nhất 8,19;
   V lệch ~9%). Cần probe 2D / theo trục / GPU-vs-CPU trước khi kết
   luận "mô phỏng đúng filter downscale của Chrome".
3. Hướng kiến trúc (áp nhiễu sau downscale trong preview) chưa được
   đánh giá thiết kế; cần đợt riêng, không sửa trong luồng chốt.
4. Sharpen headed vẫn XẤP XỈ (le8 tốt nhất 98,3% < 99%) — ngoài phạm
   vi luồng này, nhắc lại từ R65 S7.
5. Chỉ đo trên frame 30 testsrc2, seed 42, pre-encode/CRF 0. Chưa kiểm
   khái quát sang nội dung tự nhiên thật ở headed (kCb/kCr cũng vậy —
   nợ từ R65 S7).

## 8. Kiểm chứng luồng này

- Không chạy lại đo dài / harness / render mới (đúng lệnh chốt).
- Không sửa code sản phẩm → không cần tsc/vite build (không có file TS
  nào đụng tới). Chỉ đọc và tổng hợp dữ liệu trên đĩa:
  `r66t3-compare-report.json`, `r66t3-compare.log`,
  `r66t3-node-sim.json`, `r66t3-fit-w1440.log`,
  `apps/web/scripts/chrome-resample.mjs`,
  `docs/PHASE9_ROUND65_LIMITS.md` §1 + `docs/PHASE9_ROUND65_S7_LIMITS.md`,
  `server/render/src/render.js:672`, `apps/web/src/preview.tsx:1902`.
- Số liệu trong file này trích nguyên văn từ các nguồn trên; mọi verdict
  đều đối chiếu được với JSON/log (không bịa số).
- Batch stage: `phase9-round66-t3-noise-resample.txt` (1 entry: file
  LIMITS này; text only, NUL cuối, verify read-back). KHÔNG push/tag.
