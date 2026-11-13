# Phase 9 — Đợt 77, luồng E9: Sharpen/Noise preview–render parity (kiểm chứng lại)

Ngày đo: 10/11/2026. Nguồn: test-pattern.mp4 (testsrc2 1280×720, 30 fps, 4 s),
frame 30. Render: pre-encode R65 (`round65-s7/render/preencode-*.yuv`,
frame RGB full-res tại `round66-t3/render/fullrgb-*.raw`). Preview: headed
Chromium 1254 (Chrome for Testing 158) qua Xvfb + vite dev, capture full-pixel
mới bằng code hiện tại (3 cửa sổ, 4/4 pass mỗi cửa sổ; xem `r77e9-fullpixel-headed.mjs`).
Node v24.22.1, ffmpeg 8.1.2. **KHÔNG sửa code production nào** trong luồng này
(không đụng `preview.tsx`, `effectCanvas.ts`, `render.js`); chỉ sửa harness đo
(`parity-66t3-compare.mjs`, `test_v14_parity.js`) + thêm script đo mới.

## 1. Ngưỡng verdict (chuẩn Z2/A3/B1/C1/D2, dùng xuyên suốt các đợt parity)

- Noise (thống kê): KHỚP-THỐNG-KÊ khi std ratio ∈ [0,85, 1,18] **và**
  |Δkurt| ≤ 0,35 **và** |Δcorr| ≤ 0,12 (mọi kênh).
- Sharpen (tuyệt đối + delta): KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤8;
  XẤP XỈ = MAD ≤ 20 và ≥90% pixel lệch ≤32.
- Mô hình resample mặc định: trilinear LOD-bias −0,5, blend-at-end (đợt 73 A1),
  LOD trung bình nhân (đợt 75 C2). Luật delta0: **G12** (đợt 76 D2) — áp d0
  khi và chỉ khi `plainMad ≤ 2,5` **và** `d0std_R ≤ 2,0` **và**
  `ratio_R = d0std_R / residStd_R ≤ 1,0`.

## 2. Kết luận chính

| Cửa sổ | Sharpen (full-pixel, trilinear + G12) | Noise (full-pixel, trilinear + G12) |
|---|---|---|
| w1440 (rect 489×275, scale 0,382) | **KHỚP** cả 2 mức: sharp05 abs 0,584 le8 99,6%, delta 0,62 le8 99,0%; sharp10 abs 0,579 le8 99,5%, delta 0,62 le8 99,0% | **KHỚP** cả 2 mức: n05 Δkurt max 0,26, Δcorr max 0,048; n10 Δkurt max 0,32, Δcorr max 0,04 |
| w1920 (rect 809×455, scale 0,632) | **KHỚP** cả 2 mức: sharp05 abs 0,578 le8 99,6%, delta 0,595 le8 99,4%; sharp10 abs 0,584 le8 99,5%, delta 0,604 le8 99,3% | **KHỚP** cả 2 mức: n05 Δkurt max 0,27, Δcorr max 0,028; n10 Δkurt max **0,34** (R, sát nút 0,35), Δcorr max 0,025 |
| w2560 (rect 1449×815, scale 1,132 UPSCALE) | sharp05 **KHỚP** (abs 0,611 le8 99,2%; delta 0,603 le8 99,1%); sharp10 **XẤP XỈ sát nút** (abs 0,634 le8 99,0%; delta 0,629 le8 98,9%) | **LỆCH-THỐNG-KÊ kurt-only** cả 2 mức: n05 Δkurt [0,35, 0,36, 0,24], n10 Δkurt [0,42, 0,23, 0,31]; std ratio 1,03–1,05 ✓, Δcorr ≤0,095 ✓ |

- **Sản phẩm đúng ở w1440/w1920 (downscale): sharpen và noise đều KHỚP
  full-pixel cả 2 mức.** Nợ X6 về sharpen đã đóng từ đợt 14 R6 và nay được
  xác nhận lại trên capture mới (MAD tuyệt đối 0,58 so với 1,05 theo snapshot
  R65 — cải thiện do hằng số chroma S8r đợt 66).
- **w2560 upscale: LỆCH là lỗi mô hình đo, không phải lỗi sản phẩm**
  (xem §5): kernel upscale thật của Chrome là BC-cubic B≈0,25, C≈0,375,
  không phải tam giác. Dưới kernel fit này, **mọi verdict w2560 đều KHỚP**
  (noise n05/n10 + sharp05/sharp10, xem §5). Kernel fit **chưa** nối vào
  `chrome-resample.mjs` — cần đợt sau kiểm chứng trên nội dung khác trước
  khi đổi mô hình chung (xem §6, nợ 1).
- Cổng G12 full-pixel (tính trên dữ liệu mới, khớp đúng từng số D2/Y2):
  w1440 ratioR 0,65 → **áp d0**; w1920 ratioR 0,95 → **áp d0**;
  w2560 ratioR 1,23 → **không áp d0** (d0 làm kurt R tệ hơn: n05 0,35→0,38).

## 3. Đóng nợ X6 §10(a): phần dư Δkurt R 0,45–0,49 ở w1440 là artefact lấy mẫu step-4

Trên cùng dữ liệu mới, lấy mẫu step-4 pha canvas-aligned (rx ≡ 1 mod 4,
ry ≡ 0 mod 4) tái lập đúng LỆCH của X6, trong khi full-pixel cho KHỚP:

| Cửa sổ / mức | step-4 Δkurt R (trilinear +d0) | full-pixel Δkurt R |
|---|---|---|
| w1440 noise05 | 0,46 LỆCH | 0,26 KHỚP |
| w1440 noise10 | 0,44 LỆCH | 0,32 KHỚP |
| w1920 noise10 | 0,38 LỆCH | 0,34 KHỚP |
| w2560 noise05 (có-d0) | KHỚP (nói sai) | 0,38 LỆCH |

Kết luận: **verdict nhiễu của harness step-4 không đáng tin theo cả hai
hướng** (vừa báo LỆCH giả, vừa báo KHỚP giả). Mọi verdict noise từ nay phải
dựa trên full-pixel; harness step-4 chỉ còn giá trị sàng lọc nhanh.

## 4. Luật G12 đã nối vào harness `parity-66t3-compare.mjs`

- Thêm `delta0GateG12` (cổng tính 1 lần/cửa sổ sau khi frame resample xong),
  ghi `report.windows[w].delta0Gate`; noise branch dùng
  `useD0 = (chrome-rgb || chrome-trilinear) && gate.apply`;
  thêm `delta0Rule: "G12"` vào entry; header ghi cảnh báo lấy mẫu (§3).
- Chạy lại toàn bộ harness (JSON `r77e9-compare-report.json`, log
  `r77e9-compare.log`): cổng **step-4** cho w1440 ÁP d0 (ratioR 0,48),
  w1920 KHÔNG áp (ratioR 1,33), w2560 KHÔNG áp (ratioR 1,03) — **không trùng**
  cổng full-pixel của D2 (w1920 ratioR 1,33 vs 0,95; w1440 residStd 2,18 vs
  1,61). Đây là cùng artefact lấy mẫu như §3, đã ghi cảnh báo trong header
  harness. Verdict harness step-4 sau khi nối G12: trilinear w1440 noise
  LỆCH (Δkurt R 0,46/0,44 — artefact), w1920 noise05 KHỚP, noise10 LỆCH
  (0,36 — artefact), w2560 noise05 LỆCH / noise10 KHỚP (đảo ngược so với
  full-pixel). Sharpen step-4: w1440 sharp05 KHỚP tuyệt đối (MAD 1,049,
  le8 99,3%), sharp10 XẤP XỈ; w1920 sharp05 delta KHỚP (MAD 0,206, le8 99,2%).

## 5. Probe kernel upscale w2560 — nguyên nhân LỆCH kurt-only

Script `r77e9-upscale-kernel.mjs`: resample frame render 1280×720 → 1449×815
bằng 5 kernel ứng viên (mirror `resamplePlane` với kernel cắm được qua
`chromeWeights1D`; cùng quy ước toạ độ S=(i+0.5)/s, h=chromeStretch), so
delta stats với snapshot headed mới, không-d0 (G12 quyết không áp d0 ở w2560).

| Kernel | plain MAD / le8 | noise05 | noise10 |
|---|---|---|---|
| triangle (mặc định hiện tại) | 0,969 / 99,6% | LỆCH Δkurt [0,35, 0,36, 0,24] | LỆCH Δkurt [0,42, 0,23, 0,31] |
| Mitchell (B=1/3, C=1/3) | 1,009 / 99,3% | **KHỚP** Δkurt [0,28, 0,20, 0,15] | LỆCH Δkurt R 0,36 (vượt 0,01) |
| Catmull-Rom (B=0, C=0,5) | 1,094 / 98,1% | KHỚP Δkurt [0,35, 0,27, 0,34] nhưng std G 0,87 | LỆCH (std G 0,84 < 0,85) |
| B-spline (B=1, C=0) | 1,212 / 97,3% | LỆCH Δkurt R 1,67 | LỆCH Δkurt R 1,50 |
| Lanczos-2 | 1,091 / 98,2% | LỆCH Δkurt [0,37, 0,27, 0,36] | LỆCH (std G 0,84) |

Lưới hẹp quanh Mitchell (B,C), không-d0:

| (B,C) | plain MAD / le8 | noise05 | noise10 |
|---|---|---|---|
| (0,333, 0,333) Mitchell | 1,009 / 99,3% | KHỚP [0,28, 0,20, 0,15] | LỆCH R 0,36 |
| **(0,25, 0,375)** | 1,017 / 99,2% | **KHỚP** [0,12, 0,21, 0,02] | **KHỚP** [0,22, 0,08, 0,10] |
| (0,4, 0,3) | 1,009 / 99,3% | LỆCH R 0,42 | LỆCH R 0,47 |
| (0,333, 0,4) | 1,020 / 99,2% | KHỚP [0,22, 0,20, 0,09] | KHỚP [0,30, 0,04, 0,16] |
| (0,25, 0,333) | 1,011 / 99,3% | KHỚP [0,16, 0,22, 0,06] | KHỚP [0,25, 0,09, 0,14] |
| (0,4, 0,333) | 1,013 / 99,3% | LỆCH R 0,38 | LỆCH R 0,44 |

Hướng nhất quán: B thấp (sắc hơn) + C cao → khớp; 3/6 điểm lưới cho cả 2
mức KHỚP nên đây là một **vùng** (B,C), không phải một điểm fit may mắn.
Sharpen w2560 dưới BC(0,25, 0,375) cũng **KHỚP cả 2 mức**: sharp05 abs
0,579 le8 99,6% / delta 0,588 le8 99,2%; sharp10 abs 0,587 le8 99,5% /
delta 0,603 le8 99,1% (so với tam giác: sharp10 XẤP XỈ 0,634/98,9%).
Plain MAD dưới kernel fit 1,017 le8 99,2% — vẫn KHỚP (chỉ tệ hơn tam giác
0,969 một chút, trong sai số).

Kết luận §5: **kernel upscale của Chrome nằm trong vùng BC-cubic
B≈0,25, C≈0,33–0,4** (giữa Mitchell và Catmull-Rom — phù hợp với bộ lọc
chất lượng cao của Skia cho `drawImage` smoothing "high"). LỆCH kurt-only
của noise w2560 và XẤP XỈ sát nút của sharp10 w2560 dưới mô hình tam giác
là **lỗi mô hình đo**, không phải lỗi sản phẩm.

## 6. Quyết định: KHÔNG đổi `chrome-resample.mjs` trong luồng này

Kernel fit BC(0,25, 0,375) chỉ được chứng minh trên **1 nội dung
(test-pattern) × 1 thang upscale (1,132) × 1 capture**. Đổi mô hình chung
sẽ ảnh hưởng mọi verdict dùng `chrome-resample` (D2 24 case, T3, ocean
w2560…). Đề xuất cho đợt sau: (a) kiểm chứng kernel này trên nội dung
khác ở thang upscale (ocean/natural, cửa sổ w2560 khác, thang khác);
(b) nếu vẫn khớp thì nối vào `chrome-resample.mjs` làm nhánh upscale
(s > 1) và chạy lại toàn bộ verdict phụ thuộc để xác nhận không hồi quy;
(c) khi đó verdict chính thức w2560 noise/sharp10 chuyển thành KHỚP.
Verdict chính thức trong doc này vẫn theo mô hình chuẩn (trilinear) để
so sánh xuyên đợt không bị đứt gãy.

## 7. Hồi quy các effect còn lại — sửa harness V14 (bt601 → bt709)

- `effectCanvas.test.ts`: **15/15 PASS**. `effectCanvas.parity.test.ts`:
  **15/15 PASS**.
- Harness V14 (`server/render/src/test_v14_parity.js`) chạy lần 1 (trước sửa):
  **KHỚP 19, XẤP XỈ 3, LỆCH 0, PENDING 0, STAT-APPROX 0, STRUCT-OK 1,
  STAT-LỆCH 1**. Noise STAT-LỆCH: render std [15,70, 15,40, 15,64] vs preview
  [34,12, 20,39, 38,09] (tỉ lệ [2,17, 1,32, 2,43]); sharpen XẤP XỈ
  (t=0,5 MAD 0,618 le8 98,7%; t=1 MAD 0,753 le8 96,8%).
- **Nguyên nhân (phía đo sai, đã xác minh):** `renderEffectFrame` chạy filter
  trực tiếp trên RGB24, FFmpeg tự chèn convert với ma trận mặc định **bt601**
  — trong khi render thật (`render.js:743`, `format=yuv420p` rồi
  `effectsChain`) làm việc trên Y **bt709**. Đây đúng là lỗi R63 R8 mà đợt 65
  S7 đã sửa cho parity test (chuỗi
  `scale=out_color_matrix=bt709,format=yuv444p,filter,scale=...,format=rgb24`)
  nhưng chưa sửa ở V14. Production chạy noise trên yuv420p → khuếch đại
  chroma (R/B) như preview; V14 chạy noise trên RGB → render std ~15,7 đều
  3 kênh. Bằng chứng: render worker headed cho noise05 delta std
  [12,5, 8,04, 16,92] (R/B phình như preview [12,74, 8,05, 17,37]).
- **Sửa:** thêm helper `renderEffectFrameYuv(filter, src, w, h, frames,
  frameIndex, tag, fmt)` (chuỗi bt709 tường minh như parity test S7);
  sharpen dùng fmt=`yuv444p` (unsharp chỉ động luma Y; yuv420p đưa
  subsampling chroma vào base làm test mất khả năng phân biệt — theo parity
  test S7); noise dùng fmt=`yuv420p` (production chạy noise trên yuv420p,
  khối chroma 2×2 là một phần hành vi — `addYuvNoise` mô phỏng đúng khối đó).
  Các case khác giữ nguyên. `node --check` pass.
- Chạy lại V14 (log `r77e9-v14-fixed.log`): **KHỚP 21, XẤP XỈ 1, LỆCH 0,
  PENDING 0, STAT-APPROX 1, STRUCT-OK 1, STAT-LỆCH 0**. Sharpen KHỚP cả 2 mức
  (t=0,5 MAD 0,521 le8 99,4%; t=1 MAD 0,586 le8 99,4%); noise STAT-APPROX
  (render std [31,07, 19,87, 34,54] vs preview [34,12, 20,39, 38,09],
  tỉ lệ [1,10, 1,03, 1,10]). XẤP XỈ duy nhất còn lại: edgedetect natural
  (3,815/94,5% — đã biết từ R6, badge approx, để nguyên).
- `npx tsc --noEmit`: **0 lỗi**. `npx vite build`: **pass** (55,41 s, chỉ
  cảnh báo chunk-size).

## 8. Trôi so với snapshot R65 (step-4, cùng pha)

- Plain MAD=0, le8=100% (n=8418 w1440; n=23028 w1920) — preview plain không
  đổi từ đợt 65 (fix C1 không áp cho media 1280 = letterbox). Noise05/noise10
  cũng MAD=0 (đường noise không đổi).
- **Sharpen đã đổi: MAD ~0,50–0,56** (w1440: 0,529/0,561; w1920: 0,496/0,527)
  — do hằng số chroma S8r đợt 66 — và đổi theo hướng **tốt hơn** (tuyệt đối
  MAD mới 0,58 vs 1,05 theo snapshot R65 ở w1440).
- w2560 drift n/a (rect mới 1449×815 scale 1,132 khác R65 1733×975 scale
  1,354 — layout đã đổi từ đợt 65).

## 9. Capture headed (mới, code hiện tại)

- w1440×900: 4/4 pass, rect 489×275, raw hash `ad4be1d3`, ct=1, proxy false.
- w1920×1080: 4/4 pass, rect 809×455, cùng raw hash `ad4be1d3`.
- w2560×1440: lần 1 FAIL — timeout chờ app mount 240 s (load VM ~17–21 do
  các luồng đợt 77 khác chạy song song: E1 headed 2560, E3 vidstab hunt,
  E6 tsc/vite build). Retry lần 2 lúc load ~10,4: **4/4 pass**, rect
  **1449×815** (scale 1,132 — khác R65, xem §8).
- D1 plain 2 lần pixel-identical, D2 noise05 2 lần pixel-identical, D3
  cùng-khung (raw hash + currentTime khớp), H9 0 lỗi trang — cả 3 cửa sổ.
- 1-kernel (chrome-rgb) noise LỆCH ở w1440 cả 2 mức (std G 0,77–0,83;
  Δkurt G 0,42–0,45) — trilinear là mô hình đúng ở w1440, không phải lỗi
  sản phẩm.

## 10. Nợ mở

1. **Kernel upscale BC(0,25, 0,375) chưa nối vào `chrome-resample.mjs`**
   (xem §6): cần kiểm chứng trên nội dung khác/thang khác, rồi chạy lại
   toàn bộ verdict phụ thuộc. Đến lúc đó verdict chính thức w2560 noise +
   sharp10 chuyển KHỚP.
2. **Cổng G12 step-4 trong harness không trùng full-pixel** (w1920 ratioR
   1,33 vs 0,95) — verdict nhiễu của harness T3 chỉ là xấp xỉ (§3, §4).
3. **noise10 w1920 Δkurt R 0,34 sát nút ngưỡng 0,35** — nên đo lặp lại ở
   capture khác để xác nhận biên.
4. **Rect w2560 mới 1449×815 scale 1,132 khác R65 1733×975 scale 1,354**
   (layout đổi) — so sánh w2560 xuyên đợt phải ghi rõ hình học.
5. Nợ chung đợt 77 (không thuộc E9): FPS deint-only; gate 3/5 giết oan;
   "ai free" (giữ decoder sống tới khi filter xong); u2netp end-to-end;
   TTS 39 + npm audit; GPU/Safari; ci-security 403.

## 11. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/parity-66t3-compare.mjs` — nối cổng G12 + cảnh báo lấy mẫu.
- `apps/web/scripts/r77e9-fullpixel-headed.mjs` — capture headed full-pixel mới.
- `apps/web/scripts/r77e9-fullpixel-analyze.mjs` — phân tích full-pixel + cổng G12.
- `apps/web/scripts/r77e9-upscale-kernel.mjs` — probe kernel upscale + lưới (B,C).
- `server/render/src/test_v14_parity.js` — sửa V14 bt601→bt709 (sharpen yuv444p, noise yuv420p).
- `docs/PHASE9_ROUND77_E9_EFFECTS_PARITY_LIMITS.md` — doc này.
- Không sửa production, không thêm key i18n, không binary, không workflow `.yml`.

## 12. Log / bằng chứng

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round77-e9/`:
`r77e9-compare-report.json`, `r77e9-compare.log`, `r77e9-analysis.json`,
`r77e9-analyze.log`, `r77e9-analyze2.log`, `r77e9-headed-w1440.log`,
`r77e9-headed-w1920.log`, `r77e9-headed-w2560.log`,
`r77e9-headed-w2560-retry.log`, `r77e9-v14.log`, `r77e9-v14-fixed.log`,
`r77e9-upscale-kernel.json`, `r77e9-upscale-kernel-grid.json`,
`r77e9-upscale-kernel.log`, `r77e9-sharp-kernel.log`,
`headed-w1440x900/`, `headed-w1920x1080/`, `headed-w2560x1440/`
(snaps + report + vite/chrome log mỗi cửa sổ).
