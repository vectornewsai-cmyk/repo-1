# Đợt 80 — luồng H3: Kernel BC probes — giới hạn & kết quả

Ngày: 10/11/2026. Luồng H3 đợt 80 vòng lặp Phase 9. Repo `vectornewsai-cmyk/repo-1`
(branch main). CHỈ stage, KHÔNG push.

## 0. Tóm tắt

| Probe | Kết quả | Trạng thái |
|---|---|---|
| (a) Xung vuông upscale (nợ F6 §7.3) | Chrome KHÔNG dùng BC — kernel là tam giác (bilinear); nhưng BC vẫn giữ vì bù lệch đường sharp (xem §1.4) | Đóng probe, mở nợ mới (§5) |
| (b) Noise LỆCH ở project 640 (G std 0,81–0,91) | Nguyên nhân = ma trận màu bt709-vs-bt601, KHÔNG phải chroma. **Đã sửa production** — 4/4 nội dung × 2 mức × 2 kernel LỆCH → KHỚP | **ĐÃ ĐÓNG** |
| (c) Lineart 1px LỆCH mọi thang | BC tệ hơn tam giác mọi thang (plain MAD +32–93%), nhưng aliasing chiếm ưu thế — không lật được BC | Đóng probe |
| (d) D3 PASS giả khi duration NaN | Test 6/6 chứng minh hành vi cũ sai; đã sửa thành fail rõ ở cả 2 script headed | **ĐÃ ĐÓNG** |

Quyết định kernel: **GIỮ BC(0,25, 0,375) trong production** — `chrome-resample.mjs`
không đổi. Lý do ở §1.4: mâu thuẫn giữa probe thuần kernel và metric parity đầy đủ
được ghi rõ, không giấu.

## 1. Probe (a): xung vuông upscale

### 1.1 Media & phương pháp

- Nội dung mới: `sqw4/8/16/32` — nửa trên sọc dọc, nửa dưới sọc ngang, mức 64/192
  (chừa headroom cho overshoot của BC), grayscale (yuv420p không làm mờ luma),
  1280×720 và 640×360, libx264 crf 18. `lineart2px` cùng layout với lineart G5
  nhưng đường 2px.
- 5 biến thể: plain/sharp05/sharp10/noise05/noise10. Frame 30 + 60 (multi-frame).
- Headed 4 run, mỗi run 16/16 pass: A2 w2560-p1280 ph1,0; B w2560-p1280 ph2,0;
  C w2560-p640 ph1,0; D w1920-p640 ph1,0. Thang: 1,132 / 1,264 / 2,264.
- Model: render frame plain → resample lên rect viewport bằng BC(0,25,0,375)
  (trilinear production) hoặc tam giác (1-kernel cũ). So sánh profile cạnh
  (trung bình kênh R trên dải) và overshoot so với mức 64/192.

### 1.2 Edge profile — Chrome không overshoot, BC overshoot ±6

| Nội dung @thang | Preview over | Width cạnh | Profile MAD: BC vs tam giác |
|---|---|---|---|
| sqw4 @1,132 | +0/−0 | 1,39px | 2,816 vs 1,183 |
| sqw8 @1,132 | +0/−0 | 1,38px | 1,411 vs 0,587 |
| sqw16 @1,132 | +0/−0 | 1,38px | 0,676 vs 0,288 |
| sqw32 @1,132 | +0/−0 | 1,38px | 0,333 vs 0,144 |
| sqw4-640 @1,264 | +0/−0 | 1,47px | 2,803 vs 1,152 |
| sqw8-640 @1,264 | +0/−0 | 1,46px | 1,404 vs 0,554 |
| sqw16-640 @1,264 | +0/−0 | 1,47px | 0,687 vs 0,265 |
| sqw32-640 @1,264 | +0/−0 | 1,46px | 0,331 vs 0,126 |
| sqw4-640 @2,264 | +0/−0 | 2,15px | 2,664 vs 1,031 |
| sqw8-640 @2,264 | +0/−0 | 2,17px | 1,321 vs 0,513 |
| sqw16-640 @2,264 | +0/−0 | 2,16px | 0,654 vs 0,253 |
| sqw32-640 @2,264 | +0/−0 | 2,17px | 0,323 vs 0,127 |

- Preview overshoot **+0/−0 trên cả 64 profile** (4 chu kỳ × 3 thang × 2 trục ×
  2 playhead). BC overshoot **+6/−6 ở mọi profile**. Tam giác +0/−0.
- Profile MAD tam giác tốt hơn BC ~2,4× trên mọi profile, cả 2 trục.
- Width cạnh preview tỉ lệ với thang (1,39px @1,132 → 2,15px @2,264), giống nhau
  mọi chu kỳ và cả 2 trục — chuyển đổi sắc nét, đúng kỳ vọng của kernel cố định
  trong không gian nguồn.
- Playhead 1,0 vs 2,0 cho số **giống hệt từng chữ số** (nội dung tĩnh) — tái hiện
  hoàn hảo, không phải 1 mẫu.

### 1.3 Lưới kernel — không cubic nào khớp

X-profile, 16 profile (4 chu kỳ × 4 run), MAD trung bình theo kernel:

| Kernel | Overshoot | MAD (sqw4 @1,132) | MAD (sqw32 @2,264) | Thắng profile |
|---|---|---|---|---|
| **tam giác** | +0/−0 | 1,183 | 0,127 | **16/16** |
| Mitchell (1/3, 1/3) | +5/−5 | 2,584 | 0,295 | 0/16 |
| BC(0,25, 1/3) | +5/−5 | 2,634 | 0,302 | 0/16 |
| BC(0,25, 0,375) production | +6/−6 | 2,816 | 0,323 | 0/16 |
| Catmull-Rom (0, 0,5) | +9/−9 | 4,128 | 0,473 | 0/16 |

Kết luận: kernel upscale của Chrome là **tam giác (bilinear) hoặc tương đương,
không có thùy âm nhìn thấy được**. Mọi cubic thử đều ringing rõ rệt. Fit BC
của E9 (§7.2 tài liệu E9: B≈0,25, C≈0,33–0,4) bị dẫn dắt bởi thống kê
noise/sharp-delta, không phải bởi kernel resample.

### 1.4 Analyzer trên sqw — mâu thuẫn: plain → tam giác, sharp-delta → BC

Analyzer full-pixel chạy trên run D (w1920-p640, thang 1,264, frame 30, 5/5 nội
dung) + run A2 sqw4 (w2560-p1280, thang 1,132, frame 30). 6/20 nội dung hoàn
thành; phần còn lại (A2 sqw8/16/32/lineart2px, B frame 60, C thang 2,264) dừng
vì thời gian — xem §6. Mẫu đã nhất quán ở 2 thang nên không đổi kết luận.

| Nội dung | Plain MAD BC vs tri | sharp05 DELTA BC vs tri | sharp10 DELTA BC vs tri | Noise05/10 |
|---|---|---|---|---|
| sqw4-640 @1,264 | 2,647 vs 1,040 | 2,79 vs 4,04 | 2,64 vs 4,72 | cả 2 KHỚP |
| sqw8-640 @1,264 | 1,323 vs 0,532 | 1,42 vs 2,11 | 1,34 vs 2,51 | cả 2 KHỚP |
| sqw16-640 @1,264 | 0,662 vs 0,269 | 0,71 vs 1,07 | 0,67 KHỚP vs 1,26 | cả 2 KHỚP |
| sqw32-640 @1,264 | 0,363 vs 0,149 | — | 0,37 KHỚP vs 0,68 | cả 2 KHỚP |
| sqw4 @1,132 | 2,715 vs 1,081 | 2,79 vs 4,12 | 2,60 vs 4,73 | cả 2 KHỚP |
| lineart2px-640 @1,264 | 4,329 vs 3,362 | — | 4,31 vs 4,11 (tri nhỉnh hơn) | **cả 2 LỆCH** (Δkurt G BC 1,72 vs tri 0,65) |

Mẫu nhất quán: **plain → tam giác thắng ~2,5× (5/5); sharp-delta → BC thắng
~1,9× (5/5 sqw); noise → hòa (cả 2 KHỚP, std BC 0,97–0,98 vs tri 1,03–1,04)**.
Trên lineart2px-640 thì tam giác thắng plain + noise (Δkurt G 0,65 vs 1,72),
sharp-delta gần hòa (tri nhỉnh hơn) — lưới nội dung ủng hộ tam giác, khớp §3.

BC thắng sharp-delta trong khi kernel thật là tam giác — suy ra BC đang bù cho
lệch ở **đường effect-sharp** (render unsharp trên YUV vs preview sharpen trên
RGB-derived YUV), không phải kernel resample. Bằng chứng phụ: biến thể
Mitchell (1/3,1/3) trên sqw4 @1,132 cho sharp10 tuyệt đối MAD 1,211 (tốt hơn
hẳn BC 2,409) nhưng DELTA 2,568 ≈ BC 2,602 — tức hiệu ứng tuyệt đối thay đổi
theo kernel, còn delta thì không; delta đo lệch đường effect, không đo kernel.

### 1.5 Quyết định: GIỮ BC — không revert

- Trên metric parity đầy đủ (plain + sharp + noise), BC ≥ tam giác: G5 hòa
  31/80 vs 32/80; sqw: plain tri thắng, sharp-delta BC thắng, noise hòa.
- Revert BC lúc này cải thiện plain (~2,5× MAD) nhưng làm tệ sharp-delta
  (~1,9× MAD; le8 95,7% → 81,5% ở sqw4-640 sharp10) — đổi một sai lấy một sai.
- Hướng đúng (§5): tìm và sửa lệch đường sharp, rồi đo lại kernel. Lúc đó mới
  quyết revert BC hay không.
- `chrome-resample.mjs` KHÔNG đổi trong đợt này.

## 2. Probe (b): noise LỆCH ở project 640 — nguyên nhân ma trận màu, ĐÃ SỬA

### 2.1 Chẩn đoán (offline, trên data G5)

G5: noise ở project 640 LỆCH — std ratio kênh G 0,81–0,91 (thang 1,264/2,264),
trong khi 1280 KHỚP (G ~0,95–1,02). Nghi hiệu ứng chroma.

| Thí nghiệm | Kết quả | Kết luận |
|---|---|---|
| M1 ma trận màu: render lại frame 640 bằng bt709 thay bt601 | std ratio [1,02–1,08, **0,81–0,86**, 1,00–1,02] → [0,98–1,00, **0,95–1,01**, 0,98–0,99]; LỆCH → KHỚP trên 4 nội dung × 2 mức × 2 thang | **Nguyên nhân = ma trận màu** |
| M2 miền YUV: delta đổi sang YUV601 | std ratio ≈ [0,95–1,03, 0,95–1,02, 0,93–1,00] mọi plane | Noise YUV tự nó khớp; chỉ pha RGB khác |
| M3 tự tương quan không gian lag-1/lag-2 của delta | preview vs render lệch ≤ 0,04 mọi thang/nội dung | Cùng cấu trúc không gian — loại trừ chroma-block / upscale smoothing khác |
| M4 capture 2 (plain2, noise05b) | số giống hệt capture 1 (vd [1,08, 0,86, 1,07] cả 2) | Ổn định, không phải 1 mẫu |

Cơ chế: `addYuvNoise` trong `apps/web/src/lib/effectCanvas.ts` hardcode ma trận
bt709 (`rgbToYuv709`/`yuv709ToRgb`), trong khi chuỗi render dùng bt601 cho nguồn
SD (Chrome/ffmpeg decode SD = bt601; G5 §7b). Preview noise áp ở kích thước
project trước upscale, cùng cấu trúc với render — chỉ ma trận khác nhau.

### 2.2 Fix production

- `effectCanvas.ts`: thêm type `YuvMatrix` (`"bt709" | "bt601"`),
  `rgbToYuv601`/`yuv601ToRgb`, `yuvMatrixForSourceWidth(w)` (w ≤ 640 → bt601,
  else bt709 — cùng luật với chuỗi render); `addYuvNoise(img, strength, seed,
  matrix = "bt709")`, `applyNoise(..., matrix = "bt709")`, `applyCanvasEffect`/
  `applyCanvasEffects` chuyền matrix (mặc định bt709 → hành vi HD không đổi).
  Hằng stretch native-chroma 1,04/1,12 (calib cho bt709) giữ cho cả 2 ma trận —
  ghi rõ trong code là xấp xỉ; delta noise chỉ bị ảnh hưởng qua clip hiếm ở
  [0,255].
- `preview.tsx`: `effectCanvasSource` nhận thêm tham số `matrix`; call site
  chuyền `yuvMatrixForSourceWidth(mw)` — theo chiều rộng **NGUỒN** `mw`, không
  phải letterbox `dw` (nguồn 1280 trong project 640 vẫn decode bt709). Chỉ 1
  call site (dòng ~1754).
- Test mới trong `effectCanvas.test.ts` (+3): luật chọn ma trận; lý thuyết bt601
  (std [1,98, 1,47, 2,33]×σ, corr [RG 0,02, RB 0,29, GB 0,16]); mặc định vẫn
  bt709 + chuyền qua `applyCanvasEffects`.

### 2.3 Verify fix (headed run fix640 + so sánh offline)

- Headed run fix640 (w2560-p640, 5 nội dung G5 640): **16/16 pass**.
- So sánh snap G5 gốc vs snap fix (cả 2 kernel, noise05/10):

| Nội dung | G ratio trước → sau (BC) | Verdict trước → sau |
|---|---|---|
| gradient640 noise05/10 | 0,82/0,84 → 0,97/0,97 | LỆCH → KHỚP |
| photo640 noise05/10 | 0,81/0,82 → 0,97/0,97 | LỆCH → KHỚP |
| noise640 noise05/10 | 0,86/0,84 → 1,00/0,98 | LỆCH → KHỚP |
| textsmall640 noise05/10 | 0,84/0,86 → 0,98/0,99 | LỆCH → KHỚP |
| lineart640 noise10 | 0,92 → 1,06 | LỆCH → KHỚP |
| lineart640 noise05 | 1,12 → 1,23 | LỆCH → **vẫn LỆCH** (aliasing, xem §3) |

Kết quả: 4/4 nội dung không-lineart × 2 mức × 2 kernel đều LỆCH → KHỚP.
Nợ 640-noise **đã đóng**, trừ lineart640 noise05 (aliasing).

## 3. Probe (c): lineart 1px LỆCH mọi thang — BC tệ hơn, aliasing chiếm ưu thế

Offline trên data G5 (lineart 1px, plain + sharp + noise, 4 thang):

- Plain MAD/kênh (BC vs tam giác): 1,132: 3,40 vs 2,57; 1,264: 5,91 vs 4,28;
  2,264: 5,62 vs 4,05; 0,632 (downscale, trilinear-mipmap vs 1-kernel): 5,40 vs 3,05.
  **BC tệ hơn tam giác ở mọi thang, plain MAD +32–93%.**
- Sharp-delta/kênh gần như giống nhau (1,132: BC 3,27 vs tri 3,20; 1,264: 5,70 vs
  5,47) — aliasing chiếm ưu thế, kernel ít ảnh hưởng.
- Noise Δkurt G (noise05): 1,132 BC tốt hơn (0,49 vs 0,61); 1,264 BC tệ hơn
  (0,98 vs 0,54); 2,264 BC tệ hơn (0,86 vs 0,40); 0,632 BC tệ hơn (0,43 vs 0,21).
- Grid profile MAD (preview-vs-model): 1,132: BC 2,51 vs tri 1,29; 1,264: BC 4,23
  vs 2,29; 2,264: BC 3,13 vs 2,00; 0,632: BC 2,95 vs 1,70. Thùy âm BC lấp đường
  1px tối (ở 0,632 min profile BC 25,2 vs preview 0 vs tri 1,1).
- Capture 2 giống hệt capture 1.
- Lineart2px (H3, mới): grid MAD BC tệ hơn tri ở cả 3 thang (1,132: 1,741 vs
  1,447; 1,264: 2,875 vs 1,996; 2,264: 2,261 vs 1,633) — nhưng min preview 0 =
  BC 0 = tri 0: đường 2px còn nguyên ở cả 2 kernel (khác đường 1px).

Kết luận: lineart LỆCH dưới cả 2 kernel vì aliasing chiếm ưu thế, nên nó không
lật được quyết định BC; nhưng nó ủng hộ hướng tam giác cho nội dung đường nét.
Lưu ý: trong script probe offline, hàng triangle-old của grid-profile bị trùng
số theo cấu trúc (recomputed `rPlainTri` = `rPlain` ở vòng lặp đó); số hàng 1
là so sánh BC-vs-tri hợp lệ.

## 4. Probe (d): D3 PASS giả khi duration NaN — ĐÃ SỬA

- Test mới `apps/web/scripts/r80h3-d3-select.test.mjs`: **6/6 pass**.
- Chứng minh hành vi cũ sai: khi mọi duration đều NaN (kịch bản G5 noise-v1),
  bản cũ fallback `els[0]` (element textsmall) → plain và noise05 đọc cùng
  element sai → D3 PASS giả (hash `da4264e1`). Bản mới trả null → fail rõ.
- Bản mới vẫn chọn đúng khi duration finite; pool rỗng cả 2 đều không trả element.
- Sửa ở cả `r80h3-fullpixel-headed.mjs` và `r79g5-fullpixel-headed.mjs`: bỏ
  `|| els[0]`; RAW_FN trả `{ok:false, reason:"không khớp video element
  (wantDur=…, N element, durations=[…]) — D3 FAIL rõ, không fallback els[0]"}`.
- Headed A2/B/C/D: D1/D2/D3/H9 đều pass; mỗi source có raw hash riêng (D3 fix
  đang hoạt động).

## 5. Nợ mở (cho đợt sau)

1. **Tìm lệch đường sharp** (render unsharp trên YUV vs preview sharpen trên
   RGB-derived YUV) rồi đo lại kernel — lúc đó mới quyết revert BC hay không.
   Đây là nợ quan trọng nhất đợt này để lại.
2. `applySharpen` vẫn dùng bt709 (`effectCanvas.ts` ~dòng 256/339) — kề với fix
   noise bt601, chưa có bằng chứng trực tiếp.
3. Upscale bất đẳng hướng (sx ≠ sy) chưa đo.
4. Kernel truncation |x| ≤ 1,5 (h=1 ở upscale, quy ước E9) chưa đo lại.
5. Noise10 w1920 Δkurt R 0,34 sát ngưỡng 0,35 (nợ F6).
6. lineart640 noise05 vẫn LỆCH sau fix bt601 (aliasing; G 1,12 → 1,23).

## 6. Kiểm chứng

- `effectCanvas.test.ts` 18/18 PASS (was 15); `effectCanvas.parity.test.ts`
  15/15 PASS.
- `r80h3-d3-select.test.mjs` 6/6 PASS; `chrome-resample-67u2.test.mjs` 8/8 PASS.
- `npx tsc --noEmit` 0 lỗi; `npx vite build` pass (57,49s).
- Headed: A2/B/C/D + fix640, mỗi run 16/16 pass.
- E9 rerun: bit-identical với rerun của G5 (bit-identical với F6).
- Analyzer H3: 6/20 nội dung hoàn thành (run D full 5/5 + run A2 sqw4) — mẫu
  plain-tri/sharp-BC/noise-hòa nhất quán ở 2 thang; phần còn lại dừng vì thời
  gian (mỗi nội dung 1449×815 mất nhiều phút do 6 biến thể kernel × full-pixel
  + step-4; sqw8 A2 kẹt >15 phút không tiến). Log đầy đủ ở
  `hidden_files/round80-h3/r80h3-analyze.log`; JSON tổng hợp KHÔNG có (analyzer
  chỉ ghi JSON khi chạy hết — đã kill giữa chừng). Frame 60 đã có bằng chứng
  qua edge-profile: ph1/ph2 giống hệt từng số.

## 7. Sự cố trong đợt (ghi để đợt sau khỏi lặp lại)

1. Run B ghi đè snap run A (cùng thư mục scratch mặc định). Sửa: scratch mặc
   định thêm `-ph${PLAYHEAD}`; run A2 chạy lại 16/16.
2. Analyzer đầu tiên bị kill giữa chừng vì input (run A) đã bị ghi đè — log
   `r80h3-analyze-ab.log` đã lỗi thời, không dùng.
3. Edge-profile v1 có 2 bug: Y-profile lấy cả nửa trên (sọc dọc → trung bình
   ≈128, plateau ~34) và cửa sổ tìm crossing rộng ±periodOut (bắt nhầm cạnh kề,
   width phình ~10×). Đã sửa (Y chỉ lấy hàng 60%..90% H; crossing gần cạnh nhất
   trong ±periodOut/2) và chạy lại — số sạch, khớp kiểm tra trực tiếp snapshot
   (cạnh preview ~1–2px). Overshoot + profile MAD không phụ thuộc 2 metric này
   nên kết luận v1 về 2 metric đó vẫn đứng.
4. `r80h3-kernel-grid-edge.mjs` v1 lỗi cú pháp: chuỗi `*/` trong comment đóng
   block comment sớm. Đã sửa.
5. Analyzer H3 chỉ xong 6/20 nội dung rồi dừng vì thời gian (xem §6): mỗi nội
   dung 1449×815 mất nhiều phút do 6 biến thể kernel × full-pixel + step-4;
   sqw8 A2 kẹt >15 phút không in gì (CPU 84% — đang tính, không treo) rồi bị
   kill. Log `r80h3-analyze.log` giữ đủ 6 nội dung; không có JSON tổng hợp.

## 8. File

- Script mới (9, `apps/web/scripts/`): r80h3-make-media.py,
  r80h3-render-frames.mjs, r80h3-fullpixel-headed.mjs, r80h3-fullpixel-analyze.mjs,
  r80h3-edge-profile.mjs, r80h3-probes-offline.mjs, r80h3-noise-fix-verify.mjs,
  r80h3-d3-select.test.mjs, r80h3-kernel-grid-edge.mjs.
- Sửa: r79g5-fullpixel-headed.mjs (D3 fix), effectCanvas.ts, effectCanvas.test.ts,
  preview.tsx.
- Doc này: docs/PHASE9_ROUND80_H3_KERNEL_BC_PROBES_LIMITS.md.
- Evidence (KHÔNG stage): hidden_files/round80-h3/ (snaps, render, logs, JSON).
