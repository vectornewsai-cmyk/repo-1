# Phase 9 đợt 82, luồng J2 — Probe trực tiếp kernel upscale drawImage của Chrome: Mitchell, không phải BC

- **Luồng:** J2, đợt 82 (đóng nợ I3 §7.1 — nợ quan trọng nhất đợt 81 để lại).
- **Ngày:** 10/11/2026. Repo local `~/workspace/repo-1`, HEAD `5f548ef8`. **CHỈ stage, KHÔNG push.**
- **Kết luận ngắn: ĐÃ TÌM RA KERNEL THẬT — VÀ NÓ KHÔNG PHẢI BC(0,25, 0,375).**

  Probe headed trực tiếp toán tử `drawImage` upscale của Chrome (mẫu
  bipolar đặc đã biết qua `putImageData`, không qua sharpen, không qua
  app VCut, không qua video decode) cho thấy kernel hiệu dụng là
  **Mitchell–Netravali (B=C=1/3), khớp gần như từng số trên mọi mẫu và
  mọi thang đo**: MAD 0,000–0,003 trên sqw4/sqw8/step/impulse/lin ở
  s=1,1328 / 1,2637 / 2,0; checker 2D MAD 0,000–0,004; sweep impulse
  512 vị trí khớp đúng từng số 99,4–99,6% (phần còn lại lệch ±1 mức làm
  tròn). BC(0,25, 0,375) — kernel production hiện tại — lệch 0,6–0,75
  trên cùng mẫu; tam giác lệch 1,5–1,7. Grid fit (B,C) cũng trả về đúng
  (1/3, 1/3), MAD 0,002, trong khi (0,25, 0,375) chỉ hạng 5/26
  (MAD 0,522).

  **Đề xuất đổi production: (B,C) (0,25, 0,375) → (1/3, 1/3)
  (Mitchell).** Bằng chứng A/B thắng nhất quán, xem §6. Luồng này KHÔNG
  tự sửa `chrome-resample.mjs` (file chung, vòng đang chạy song song —
  để parent gộp áp dụng kèm chạy lại test suite); chỉ đề xuất kèm số đo.

  Phát hiện phụ: `imageSmoothingQuality="medium"` ở upscale = **tam
  giác đúng từng số (MAD 0)** — "high" và "medium" KHÁC NHAU ở upscale
  (ghi chú "high == medium" của T3 chỉ đúng ở downscale). Đường raster
  không ảnh hưởng: `--disable-gpu` vs SwiftShader byte-identical.

## 1. Câu hỏi và phương pháp

I3 (§5.4) kết luận bằng loại trừ rằng toán tử upscale hiệu dụng của
Chrome trên mẫu delta đặc khác tam giác lý tưởng, nhưng chưa đo trực
tiếp toán tử đó — probe xung vuông của H3 chỉ đo trên bước đơn (plain),
không nhạy với khác biệt này. Luồng này đo trực tiếp:

- **Trang probe trần** (`r82j2-chrome-probe-headed.mjs`, trang HTML nhúng
  trong driver): canvas nguồn 512×512 vẽ bằng `putImageData` (giá trị
  chính xác từng pixel), `drawImage` upscale với
  `imageSmoothingQuality="high"`, đọc lại bằng `getImageData`. Không
  video element, không app VCut, không effect — chỉ còn lại toán tử
  drawImage.
- **Mẫu** (grayscale): sqw4 (chu kỳ 8px, 64/192 — giống H3/I3), sqw8
  (chu kỳ 16px, 64/192), sqw4-hi (0/255), sqw4-lo (112/144), step
  (64→192 tại x=256), impulse (nền 128, cột 255 tại x=256), checker8
  (bàn cờ 8×8 — kiểm 2D), linA/linB/linAB (xung 128 tại x=200 / x=208 /
  cả hai — kiểm tuyến tính).
- **Thang:** s=1,1328 (512→580), s=1,2637 (512→647), s=2,0 (512→1024).
- **Sweep impulse:** cột 255 trên nền 0, p=0..511, đọc hàng giữa, ở
  s=1,1328 và s=2,0 — tái tạo trực tiếp trọng số kernel.
- **Đối chứng:** lặp lại sqw4 (pixel-identical?), high-vs-medium,
  2 lần chạy `--disable-gpu` (gpu0) và đường GPU SwiftShader (gpu1).
- **Phân tích offline** (`r82j2-chrome-probe-analyze.mjs` +
  `r82j2-chrome-probe-controls.mjs`): so Chrome với 6 kernel (tri,
  BC(0,25, 0,375), Mitchell, Catmull-Rom, B-spline, Lanczos2) bằng
  `chromeWeights1D` (cùng quy ước S=(i+0,5)/s, h=1 như E9/H3/I3);
  grid fit (B,C); đối chiếu chéo I3 (E2-style) trên dữ liệu H3.

Chrome đo: Chromium 1254 (Playwright), UA `Chrome/158.0.0.0`, headed
qua Xvfb. Probe gpu0 chạy 119,2 s; gpu1 (SwiftShader) 247,0 s.

## 2. Kernel hiệu dụng của Chrome là Mitchell (1/3, 1/3)

### 2.1 MAD hàng: Mitchell ≈ 0 ở mọi mẫu, mọi thang

MAD (trung bình 4 hàng/capture) — thấp nhất là Mitchell ở **27/27**
capture hàng:

| Mẫu | s=1,1328 tri / BC / **Mitchell** | s=1,2637 tri / BC / **Mitchell** | s=2,0 tri / BC / **Mitchell** |
|---|---|---|---|
| sqw4 | 1,721 / 0,690 / **0,003** | 1,737 / 0,730 / **0** | 1,488 / 0,620 / **0** |
| sqw8 | 0,866 / 0,303 / **0,003** | 0,853 / 0,359 / **0** | 0,738 / 0,308 / **0** |
| sqw4-hi | 1,172 / 0,745 / **0** | 1,238 / 0,734 / **0,002** | 0,496 / 0,744 / **0** |
| sqw4-lo | 0,397 / 0,121 / **0** | 0,402 / 0,142 / **0** | 0,248 / 0,496 / **0** |
| step | 0,014 / 0,003 / **0** | 0,012 / 0,003 / **0** | 0,012 / 0,005 / **0** |
| impulse | 0,028 / 0,012 / **0** | 0,026 / 0,009 / **0** | 0,020 / 0,010 / **0** |
| linA/linB/linAB | 0,010–0,034 / 0,003–0,017 / **0** | 0,010–0,034 / 0,008–0,017 / **0** | 0,010–0,020 / 0,008–0,016 / **0** |

Catmull-Rom 1,4–3,6; B-spline 1,2–9,4; Lanczos2 0,7–2,8 — đều thua xa.
Mitchell MAD 0,003 ở 3 capture = ~7 pixel lệch ±1 trên 2.320 giá trị
(làm tròn, xem §7.3). Đây không phải "thắng trong lưới" mà là **khớp
gần như từng số**.

### 2.2 Grid fit (B,C): (1/3, 1/3) thắng, BC hạng 5/26

MAD trung bình trên sqw4+sqw8 @ s=1,1328+s=1,2637 (lưới B ∈ {0, 0,125,
0,25, 1/3, 0,5} × C ∈ {0, 0,25, 1/3, 0,375, 0,5} + tam giác):

| Hạng | (B, C) | MAD |
|---|---|---|
| 1 | **(0,3333, 0,3333)** | **0,002** |
| 2 | (0,3333, 0,375) | 0,200 |
| 3 | (0,25, 0,3333) | 0,414 |
| 4 | (0,3333, 0,25) | 0,462 |
| 5 | (0,25, 0,375) — production hiện tại | 0,522 |

Điểm (1/3, 1/3) thắng điểm kề gần nhất 100× — không phải vùng phẳng
mờ mà là điểm sắc. Test tổng hợp (`r82j2-chrome-probe.test.mjs`)
chứng minh bộ máy fit khôi phục đúng kernel đã biết (BC → đúng
(0,25, 0,375); tam giác → đúng tri; Mitchell → đúng (1/3, 1/3)).

### 2.3 Sweep impulse: trọng số đo được = trọng số Mitchell

| Thang | tri MAD / exact | BC MAD / exact | **Mitchell MAD / exact** | Catmull | B-spline | Lanczos2 |
|---|---|---|---|---|---|---|
| s=1,1328 | 7,212 / 0,8% | 3,496 / 6,1% | **0,008 / 99,4%** | 13,190 / 1,8% | 21,282 / 0,4% | 12,775 / 1,8% |
| s=2,0 | 4,491 / 0,1% | 3,991 / 0,2% | **0,007 / 99,6%** | 14,476 / 0,1% | 19,262 / 0% | 13,975 / 0,1% |

Profile xung p=256 @s=1,1328, i=287..293: đo
`[0, 0, 23, 225, 47, 0, 0]` = Mitchell đúng từng số; tri
`[0, 0, 15, 240, 45, 0, 0]`; BC `[0, 0, 19, 232, 44, 0, 0]`.
Profile p=256 @s=2,0, i=509..516: đo `[0, 0, 65, 199, 199, 65, 0, 0]`
= Mitchell đúng từng số; tri `[0, 0, 64, 191, 191, 64, 0, 0]`.

### 2.4 Checker 2D: mô hình tách được 2D với kernel Mitchell khớp

MAD full-frame: Mitchell **0,004 / 0 / 0** ở 3 thang; BC 0,606–0,677;
tri 1,401–1,515. Kernel Mitchell tách được theo 2 trục (X rồi Y) đúng
như `bilinearPlane2D` của production — không có hạng chéo 2D lạ.

## 3. Tuyến tính và không phụ thuộc giá trị — toán tử là tuyến tính thuần

- **Tuyến tính:** MAD(linAB − (linA+linB)) = **0, maxAbs=0** ở cả 3
  thang. Không có khâu phi tuyến nào (gamma, dither, làm tròn
  phụ thuộc giá trị) trong drawImage upscale.
- **Không phụ thuộc giá trị:** profile chuẩn hoá biên độ sqw4
  (64/192) vs sqw4-hi (0/255) vs sqw4-lo (112/144): MAD 0,005–0,010
  (mức làm tròn sau chuẩn hoá). Cùng một kernel cho mọi biên độ.
- **Y-constancy:** mẫu sọc dọc hằng theo y đúng từng số
  (max |hàng − hàng0| = 0, 27 capture).

Hệ quả: đáp ứng trên mẫu delta đặc được quyết định hoàn toàn bởi
kernel tuyến tính — và kernel đó là Mitchell. Không còn "khâu khác"
nào để nghi ngờ ở tầng drawImage.

## 4. Step edge: Mitchell khớp cả overshoot

Step 64→192, overshoot đo được vs mô hình (MAD profile: Mitchell 0,
BC 0,003–0,005, tri 0,012–0,014):

| Thang | đo under/over | BC dự báo | tri dự báo |
|---|---|---|---|
| s=1,1328 | 1 / 1 | 1 / 1 | 0 / 0 |
| s=1,2637 | 4 / 0 | 5 / 0 | 0 / 0 |
| s=2,0 | 3 / 3 | 4 / 5 | 0 / 0 |

H3 kết luận "Chrome không overshoot ở xung vuông (+0/−0)" là kết luận
trên bước 0/255 (overshoot bị kẹp 0/255 nên vô hình) — với bước
64→192, overshoot **có thật** và Mitchell khớp đúng từng số profile.
Đây là lý do H3 loại BC sai chỗ: bước đơn 0/255 không phân biệt được
kernel, mẫu bipolar đặc mới phân biệt được — đúng như I3 §5.4 dự đoán.

## 5. Đối chứng: medium = tam giác; đường raster không đổi gì

- **high vs medium:** MAD = 1,721 (sqw4@s1132), không identical.
  Medium so với từng kernel: **tri MAD 0** (đúng từng số), BC 2,003,
  Mitchell 1,724. Kết luận: ở upscale, `imageSmoothingQuality`
  "medium" = tam giác, "high" = Mitchell. Ghi chú T3 ("high == medium
  từng byte") chỉ đúng ở **downscale** (probe 1 của T3 đo s<1).
  → Mọi verdict upscale của harness đều phụ thuộc vào việc preview
  dùng "high" (đúng code preview dùng "high" — xem effectCanvas).
- **Lặp lại:** sqw4@s1132 chạy 2 lần pixel-identical (MAD 0).
- **gpu0 vs gpu1:** byte-identical trên **mọi** capture (27 capture
  hàng MAD 0; checker 3 thang MAD 0 / maxAbs 0; sweep 2 thang MAD 0 /
  fracDiff 0). `--disable-gpu` vs SwiftShader không đổi kernel.
- **0 lỗi trang** cả 2 lần chạy headed.

## 6. Đề xuất: đổi (B,C) production (0,25, 0,375) → (1/3, 1/3)

### 6.1 Bằng chứng A/B thắng nhất quán

Đối chiếu chéo I3 (E2-style, kernel áp lên `d_render` float so với
`dp_prev` thật; tái lập đúng từng số I3: tri 4,042 / BC 2,754 ở run D):

| Run / nội dung | plain MAD tri / BC / **Mitchell** | delta05 tri / BC / **Mitchell** | delta10 tri / BC / **Mitchell** |
|---|---|---|---|
| D sqw4-640 (rect 809×455, s=1,2641) | 1,040 / 2,647 / **2,441** | 4,042 / 2,754 / **2,738** | 4,692 / 2,601 / **2,541** |
| A2 sqw4 (rect 1449×815, s=1,1320) | 1,081 / 2,715 / **2,474** | 4,123 / 2,781 / **2,783** | 4,724 / 2,598 / **2,575** |

Mitchell thắng BC ở **5/6** số (plain cả 2 run; delta 3/4), hòa 1 số
(delta05 A2: BC hơn 0,002 — không đáng kể). Không có số nào Mitchell
thua BC đáng kể. Cộng với probe trực tiếp (Mitchell 0,003 vs BC 0,69
— thắng 230×), đây là bằng chứng A/B thắng nhất quán theo đúng tiêu
chí của nhiệm vụ.

Lưu ý trung thực: cải thiện trên delta I3 là **nhỏ** (0,02–0,06 MAD);
BC vẫn "bù được một nửa" như I3 nói. Phần dư delta còn lại (~2,5–2,8
MAD) KHÔNG phải do kernel nữa — kernel giờ đã biết chính xác — mà do
base-mismatch giữa preview và render (I3 E8) và/hoặc khâu khác trong
pipeline preview. Đổi sang Mitchell không đóng được phần dư đó; nó chỉ
đặt kernel về đúng giá trị thật.

### 6.2 Vì sao không tự sửa trong luồng này

- `chrome-resample.mjs` là file chung; vòng 82 đang chạy song song
  nhiều luồng — để parent gộp áp dụng một lần, kèm chạy lại
  `chrome-resample-67u2.test.mjs` + kiểm lại verdict F6/E9 (các verdict
  upscale dùng BC có thể dịch nhẹ).
- Thay đổi là 1 hằng số: `CHROME_UPSCALE_BC = { B: 1/3, C: 1/3 }`
  (+ cập nhật chú thích E9/F6 trong file). Phạm vi ảnh hưởng: chỉ các
  script harness dùng `resamplePlaneTrilinear`/`chromeResampleRgb24`
  ở nhánh upscale (sx>1, sy>1); không có file nào trong `apps/web/src`
  import trực tiếp `CHROME_UPSCALE_BC`/`chromeUpscaleKernel`; test
  67u2 không pin giá trị BC (grep: không có chuỗi `0.375`/`mitchell`
  trong test).
- Plain MAD dưới Mitchell (2,44) vẫn tệ hơn tri (1,04) — nhưng đó là
  base-mismatch preview-vs-render (I3 E8), không phải bằng chứng chống
  Mitchell: probe trực tiếp (không có base-mismatch) cho Mitchell
  đúng từng số, và tri thua Mitchell 1,7 MAD trên cùng probe. Đừng
  dùng plain MAD để bác Mitchell.

### 6.3 Nợ I3 §7.1: ĐÃ ĐÓNG

Nguyên nhân gốc đã rõ: **toán tử upscale hiệu dụng của Chrome là
Mitchell, không phải tam giác** — I3 §5.4 "còn lại một khả năng duy
nhất" đã được đo trực tiếp và xác nhận. BC chỉ là xấp xỉ tốt của
Mitchell trên mẫu delta đặc (vì (0,25, 0,375) gần (1/3, 1/3)) — giải
thích vì sao BC "bù được một nửa" mà không phải kernel thật.

## 7. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **Phần dư delta I3 (~2,5–2,8 MAD) vẫn mở.** Kernel đã biết chính
   xác (Mitchell) nhưng delta preview-vs-render vẫn lệch ~2,5 MAD —
   nguyên nhân còn lại là base-mismatch (I3 E8) và/hoặc khâu khác trong
   pipeline preview, không phải kernel. Đừng claim đổi sang Mitchell
   sẽ đóng delta.
2. **Chỉ đo upscale đẳng hướng** (sx=sy, s=1,13 / 1,26 / 2,0), nội
   dung tổng hợp grayscale, canvas 512×512. Chưa đo thang dị hướng
   (sx≠sy — production giữ tam giác ở đó), thang >2, nội dung màu
   bão hoà, hay downscale (ở đó high==medium theo T3, chưa kiểm lại
   bằng probe trực tiếp này).
3. **Dư làm tròn ±1:** Mitchell khớp đúng từng số ở 27/27 capture
   hàng trừ 3 capture MAD 0,002–0,003 (vài pixel lệch ±1) và sweep
   exact 99,4–99,6% (còn lại lệch ±1). Có thể là quy tắc làm tròn
   nửa (half-up vs half-down) hoặc float precision của Skia — nhỏ hơn
   1 mức, không ảnh hưởng kết luận kernel.
4. **Chrome 158 (Chromium 1254) trên VM này, SwiftShader/CPU.**
   Chưa đo Chrome phiên bản khác, GPU thật, hay Safari/WebKit
   (WebKitGTK ≠ Safari thật).
5. **Medium = tam giác chỉ đo ở 1 mẫu/thang** (sqw4@s1132, MAD 0).
   Đủ để kết luận cho upscale, nhưng chưa quét lưới thang/mẫu cho
   medium.
6. Lineart2px aliasing (MAD ~4,1 không phụ thuộc kernel) vẫn mở —
   không thuộc luồng này (J7 lo), Mitchell không sửa được.

## 8. Kiểm chứng

- `node --test apps/web/scripts/r82j2-chrome-probe.test.mjs`: **4/4
  pass** (1D≡2D; grid fit khôi phục đúng BC/tri/Mitchell từ dữ liệu
  tổng hợp; giá trị đặc biệt bcCubic; madRows).
- Headed gpu0: **2/2 pass** (31 capture + 2 sweep, 0 lỗi trang,
  119,2 s). Headed gpu1: **2/2 pass** (31 capture + 2 sweep, 0 lỗi
  trang, 247,0 s — lần 1 timeout CDP 120 s vì SwiftShader chậm hơn;
  đã tăng timeout evaluate lên 300 s, lần 2 xong).
- Đối chiếu chéo H tái lập đúng từng số I3 (V0/E2: tri 4,042 /
  BC 2,754 run D).
- Không sửa file production nào (chỉ thêm 4 script + doc này) nên
  tsc/vite build không bị ảnh hưởng; không chạy lại (không có gì để
  hồi quy). `chrome-resample.mjs` không đổi.

## 9. File

- Script mới (4, `apps/web/scripts/`):
  `r82j2-chrome-probe-headed.mjs` (driver Xvfb + Chromium 1254 + CDP,
  trang probe nhúng),
  `r82j2-chrome-probe-analyze.mjs` (phân tích chính A–H + grid fit +
  đối chiếu chéo I3),
  `r82j2-chrome-probe-controls.mjs` (medium-vs-tri, gpu0-vs-gpu1,
  ghi vào analysis JSON),
  `r82j2-chrome-probe.test.mjs` (test offline 4/4).
- Doc này: `docs/PHASE9_ROUND82_J2_KERNEL_BC_CHROME_PROBE_LIMITS.md`.
- Bằng chứng (KHÔNG stage — không phải file repo):
  `hidden_files/round82-j2/` (`r82j2-probe-gpu{0,1}.json`,
  `r82j2-analysis.json`, `r82j2-chrome-gpu{0,1}.log`,
  `r82j2-probe-gpu{0,1}.log`).
