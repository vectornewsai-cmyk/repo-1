# PHASE 9 ĐỢT 192 — P2: Enhance parity — warm-up bậc 2 + deint bob + sharpen đo lại

**Trạng thái: ĐÃ LÀM + ĐÃ ĐO (code đổi) — KHÔNG push.**
Chủ đề đợt 192 (lệnh user 15:03 25/11): Editing Core — preview/render parity.
Luồng P2 xử lý 3 khoản lệch còn lại sau đợt 191 (LIMITS P2-191 §2.2–2.4,
P4-191 §2.2–2.5): (1) denoise frame 3 s=0.8 còn sai −5,4 điểm,
(2) sharpen trên nội dung nhiễu MAD 1,5–3,0, (3) deinterlace KHÔNG
parity (R 1,83 vs yadif 2,12). Mọi số dưới đây là số đo thật trên VM
này (ffmpeg 8.1.2, node 24.22.1, Chromium 1254 cho phần headed), không
ước lượng, không đánh giá bằng mắt. Fixture chỉ giữ script gen + JSON
(probe trong `hidden_files/round192-p2/`), không binary trong batch.

## 0. Thay đổi code trong đợt này

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | **Warm-up bậc 2:** `denoiseWarmupFactor` frame 1/2 đổi từ hồi quy tuyến tính đợt 191 sang bậc 2 LSQ (xem §1); cập nhật comment đầu file + comment hàm + comment hằng `ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR` (bob). Không đổi đường cong blend đợt 63, không đổi frame 0 (= 1/3), không đổi shape plan/debug. |
| `apps/web/src/preview.tsx` | **Deint bob:** chỉ `deintIntermediateSource` + comment ngay trên nó: lần vẽ trung gian tắt smoothing (nearest) để giữ top field thay vì trung bình 2 field (xem §3). Không đụng code reverse của P3 (cùng file, vùng khác — đã kiểm tra `shouldHoldReversePlayhead` còn nguyên). |
| `apps/web/src/components/enhance/enhancePreview91P2.test.ts` | Cập nhật kỳ vọng warm-up theo bậc 2 + 2 test mới (khóa frame 2 s=0.8 ≈ 0,871; plan frame 2 s=0.8). Tổng suite 18 → 20 test. |

## 1. Denoise frame 3 s=0.8: nguyên nhân + sửa — ĐẠT (trên fixture hiệu chuẩn)

### 1.1 Đo lại (tái tạo đúng số đợt 191)

Fixture sinh lại bằng ffmpeg, Y-std khớp đúng mốc đợt 191 (flat15
8,25; flat40 22,69). Alpha-search lại trên flat15seq (lưới 0,005):

| frame | s=0.3 | s=0.5 | s=0.8 | s=1.0 |
|---|---|---|---|---|
| 1 (f=0) tỉ lệ lý tưởng | 0,282 | 0,340 | 0,354 | 0,326 |
| 2 (f=1) tỉ lệ lý tưởng | 0,974 | 0,885 | 0,738 | 0,617 |
| 3 (f=2) tỉ lệ lý tưởng | 1,000 | 0,977 | 0,887 | 0,749 |

Sai số hàm tuyến tính đợt 191 (đo lại bằng `enhancePreviewPlan` thật,
khớp từng ô LIMITS 191): frame 3 s=0,8 **−5,4**; s=0,5 −3,3; frame 2
s=0,8 −2,8.

### 1.2 Nguyên nhân: đường tuyến tính võng giữa

Tỉ lệ lý tưởng theo alpha là đường cong **lồi** (rơi nhanh dần ở alpha
cao), không phải đường thẳng: đường `1.062−0.318a` đi qua gần đúng 2
đầu mút (a=0,195 → 1,000; a=0,981 → 0,750) nhưng võng xuống giữa
(a=0,806: tuyến tính 0,806 so với lý tưởng 0,887 — thiếu 0,081, đúng
bằng sai −5,4 điểm). Tương tự frame 2: tuyến tính 0,698 so với lý
tưởng 0,738 ở s=0,8. Đây là lỗi dạng hàm, không phải lỗi knots hay lỗi
đếm frame (đếm frame đã đúng — xem LIMITS 191 §2.2).

### 1.3 Sửa: hồi quy bậc 2 LSQ trên cùng 4 mốc

- f=1: `0.9983 − 0.0674a − 0.3248a²` (kẹp [0,6, 1]), dư ≤0,005.
- f=2: `0.9471 + 0.361a − 0.5654a²` (kẹp [0,75, 1]), dư ≤0,016.
- Hệ số xác minh độc lập bằng numpy polyfit (khớp từng chữ số); không
  dùng nội suy từng đoạn qua knots (đã thử — bằng bậc 2 trên flat15
  nhưng overfit nhiễu đo ở từng mốc, xem bảng so sánh trong JSON).

**Sau sửa, sai số trên flat15 (điểm % giảm std, đo bằng plan thật):**

| | frame 1 | frame 2 | frame 3 |
|---|---|---|---|
| s=0.3 | +1,0 | +0,2 | −0,3 |
| s=0.5 | −0,1 | +0,1 | +0,2 |
| s=0.8 | −1,5 | −0,8 | **−0,8 (trước −5,4)** |
| s=1.0 | +1,0 | +0,5 | +0,5 |

Sai số tệ nhất mọi ô frame 1–3: **≤1,5 điểm** (ô tệ nhất còn lại là
frame 1 s=0,8, do hệ số frame 0 giữ hằng 1/3 trong khi tỉ lệ lý tưởng
ở đó là 0,354 — chấp nhận, vì 1/3 là trung bình 4 mốc và sai chỉ 1,5).

### 1.4 Trade-off trung thực: fixture nhiễu hơn (flat20, Y-std 11,15)

Hàm warm-up hiệu chuẩn trên flat15 như toàn bộ đường cong blend từ
đợt 63; trên footage nhiễu hơn, hqdn3d giảm tương đối ít hơn trong
khi blend không đổi nên preview overstate — warm-up không sửa được
(cùng hiện tượng F-191-P4-2 ở trạng thái ổn định). Đo trên flat20seq:

| | frame 1 / 2 / 3 sau sửa | (trước sửa, tuyến tính) |
|---|---|---|
| s=0.3 | +3,8 / +8,5 / +8,6 | +3,8 / +8,4 / +8,8 |
| s=0.5 | +6,8 / +14,0 / **+16,5** | +6,8 / +11,8 / +12,9 |
| s=0.8 | +5,5 / +6,7 / +10,0 | +5,5 / +4,5 / +5,5 |
| s=1.0 | +5,6 / +1,9 / +4,0 | +5,6 / +1,9 / +3,6 |

Bậc 2 làm tệ thêm tối đa +3,6 điểm ở 1 ô (s=0,5 frame 3) trên flat20
trong khi sửa −5,4 → −0,8 trên flat15. Cả hai đều ngoài ngưỡng chấp
nhận trên flat20 (lỗi gốc do mức nhiễu, không do warm-up); trên
fixture hiệu chuẩn thì bậc 2 đúng dạng hàm hơn. Quyết giữ bậc 2, ghi
rõ trade-off để T10 phán. Hướng thật cho flat20 là alpha thích nghi
theo mức nhiễu ước lượng từ frame (nợ mới, xem §5.6) — không làm
trong đợt này vì đổi cả trạng thái ổn định, rủi ro cao.
Fixture flatP4seq (định làm cross-check kiểu P4) HỎNG: md5 y hệt
flat15seq — filter `noise` của ffmpeg cho cùng nhiễu dù đổi
`format=rgb24` trước nó; đã loại khỏi mọi kết luận.

**Verdict (1): ĐẠT trên fixture hiệu chuẩn** (tệ nhất −1,5 ≤ ngưỡng
5,5 của P4-191); giới hạn theo mức nhiễu ghi ở §1.4.

## 2. Sharpen trên nội dung nhiễu: đo lại + thử 2 hướng — CHƯA ĐẠT, không sửa code

### 2.1 Đo lại (khớp đợt 191 trên natural15)

| Fixture | t=0.5 MAD / le8 | t=1.0 MAD / le8 |
|---|---|---|
| step sạch | 0,000 / 100% | 0,000 / 100% |
| natural sạch | 0,138 / 99,9% | 0,152 / 99,9% |
| step + nhiễu 15 (fixture đợt này) | 0,908 / 93,5% | 1,913 / 86,2% |
| natural + nhiễu 15 | **1,551 / 90,6%** | **2,461 / 81,4%** |

natural15 khớp đúng từng số đợt 191 (1,551/2,461) — pipeline đo đúng.
step15 đợt này thấp hơn đợt 191 (1,774/2,994) vì fixture step khác
(step 0/255 qua geq đợt này; step đợt 191 không rõ mức) — chỉ dùng
natural15 làm mốc so sánh, không claim đã cải thiện step15.

### 2.2 Thử biến thể S7 (delta từ luma derived, không ước lượng native): TỆ HƠN

| Fixture | t=0.5: hiện tại → S7 | t=1.0: hiện tại → S7 |
|---|---|---|
| natural sạch | 0,138 → 0,496 | 0,152 → 0,597 |
| natural15 | 1,551 → 2,166 | 2,461 → 3,388 |
| step15 | 0,908 → 0,922 | 1,913 → 1,950 |

Biến thể plainDerived thua mọi ô, cả sạch lẫn nhiễu — loại, giữ
`applySharpen` hiện tại (hybrid native-est, đợt 66 T4).

### 2.3 Chẩn đoán: kernel KHÔNG phải nguyên nhân chính

- Trường delta Y (render vs preview) trên natural15: tương quan
  **0,982**, std delta render 9,96 vs preview 9,88 (t=0,5) và 16,27 vs
  16,08 (t=1,0); std hiệu delta 1,89 / 3,11. Hai phía khuếch đại
  nhiễu gần như nhau; lệch còn lại là sai số delta từng pixel (~19%
  std delta), không phải sai hệ số khuếch đại.
- Nhận dạng kernel blur của unsharp render bằng hồi quy 5×5 trên miền
  Y (numpy least-squares): trên natural15, kernel hồi quy gần
  binomial [1,4,6,4,1]/16 (profile 1D [0,065, 0,247, 0,422, 0,223,
  0,044] so với binomial [0,0625, 0,25, 0,375, 0,25, 0,0625]);
  RMSE vs blur ngụ ý: binomial 2,02 / Gaussian σ=1,0 1,90 / hồi quy
  25 tham số 1,62 (t=0,5); 3,50 / 3,29 / 2,60 (t=1,0). Kernel tốt
  nhất chỉ hơn binomial ~6–16% dù có 25 bậc tự do — tức binomial đã
  gần tối ưu, phần dư không phải do kernel. (Trên step15 hồi quy cho
  kernel lệch hẳn vì step 0/255 ngoài dải Y limited + biên step chi
  phối fit — không dùng làm bằng chứng kernel.)
- Tách MAD theo pixel kẹp gamut: không kết luận được (testsrc2 có
  89,6% pixel chạm 0/255 ở ≥1 kênh; MAD pixel kẹp 1,57 vs không kẹp
  1,36 ở t=0,5 — chênh không đáng kể). Kẹp gamut không phải nguyên
  nhân chính.

**Verdict (2): CHƯA ĐẠT — MAD 1,5–3,0 trên nội dung nhiễu giữ nguyên.**
Không có hướng sửa rẻ đã chứng minh: biến thể S7 tệ hơn, kernel đã
gần tối ưu. Lệch còn lại là giới hạn của mô hình Y_est (ước lượng Y
native từ RGB đã qua yuv→rgb + subsample chroma 420) — ghi nhận, xem
§5. Không sửa `effectCanvas.ts`.

## 3. Deinterlace: bob thay half-res — ĐẠT XẤP XỈ (cải thiện lớn, chưa parity)

### 3.1 Vấn đề của half-res cũ

Half-res trung bình 2 field rồi upscale nên mềm hơn cả yadif lẫn bản
progressive gốc (R 1,83 < yadif 2,12 < clean 2,37 trên inter frame 8,
đợt 191) và lệch xa trên nội dung chuyển động ngang (thanh trắng chạy
6px/frame: MAD 6,61 vs yadif). Nguyên nhân: yadif giữ 1 field gần như
nguyên vẹn + nội suy field còn lại theo biên; half-res không giữ
field nào nguyên vẹn.

### 3.2 Bob: giữ top field, upscale bilinear — đo trên 3 fixture

| Fixture / frame | half-res MAD vs yadif (R) | **bob-bilinear top MAD (R)** | bob-nearest top MAD (R) | weave MAD |
|---|---|---|---|---|
| inter f8 | 3,574 (1,833) | **3,096 (1,892)** | 2,552 (2,109) | 2,951 |
| inter f3 | 3,060 (1,628) | **2,702 (1,688)** | — | — |
| inter15 f3/f7/f11 | 4,681/4,664/5,320 (1,812) | **3,998/4,025/4,560 (1,89–1,92)** | 3,626/3,548/4,107 (2,17–2,23) | 4,312/4,179/4,830 |
| interbar f3/f7/f11 | 6,609 (0,535) | **0,283 (0,534)** | 0,194 (0,534) | 6,498 |

R yadif đối chứng: inter 2,206/1,999; inter15 2,147/2,188/2,144;
interbar 0,534. Bob-top thắng half-res mọi ô (MAD −13% đến −96%,
R sát yadif hơn); field bottom tệ hẳn (inter15 MAD 5,5–6,4; interbar
12,95) — chứng tỏ yadif parity=-1 khớp top field trên các fixture
này, và chọn đúng field là điểm quyết định. le8 bob-top: 89,9%
(inter f8), 88,0–88,3% (inter15), 99,6% (interbar).

### 3.3 Cơ chế ship + xác minh headed

`deintIntermediateSource` (preview.tsx): lần vẽ trung gian **tắt
smoothing** (nearest) thay vì bật — mỗi hàng đích lấy đúng 1 hàng
nguồn chẵn (top field); lần vẽ sau upscale lên khổ đích với smoothing
ON/high như cũ → bob-bilinear. Không thêm lần vẽ, không đổi khổ
intermediate (dw×dh/2), không đổi tín hiệu plan (`deinterlaceTap` /
`needsOffscreen` giữ nguyên), hình học G7b mask không đổi.
**Xác minh headed Chromium 1254** (`headed-bob-check.mjs`, CDP theo
mẫu P4-191, mẫu hàng chẵn xám 200 / lẻ 50): downscale dọc đúng 2×
smoothing-off lấy đúng hàng chẵn — cả nguồn canvas (90/90 hàng =
200) lẫn `<video>` (90/90 hàng = 214/215, frame gốc xen kẽ 214/38);
smoothing-on cho 125 (trung bình 2 field — đúng half-res cũ); lệch
source-rect sy=1 thì lấy hàng lẻ (38/40). Mô hình upscale bilinear
trong probe là cùng đường resample bilinear đã dùng từ các đợt 75–77.
Chưa đo lại FPS headed cho đường bob (nợ, xem §5.4): lập luận là lần
vẽ trung gian rẻ hơn hoặc bằng trước (nearest rẻ hơn bilinear) và
không thêm lần vẽ nào.

**Verdict (3): ĐẠT XẤP XỈ — cải thiện lớn, chưa parity.** MAD vs
yadif còn 2,7–4,6 trên testsrc2 (tier XẤP XỈ của P4: MAD ≤20, le32
≥90% — đạt; tier KHỚP MAD ≤2 & le8 ≥99% — chưa). Bob-nearest-top đo
tốt hơn nữa (MAD 2,55/3,55–4,11/0,19) nhưng KHÔNG ship: cần tắt
smoothing ở bước upscale cuối, bước đó dùng chung cho mọi đường vẽ —
đổi liều lĩnh hơn, cần kiểm headed FPS/chất lượng riêng (nợ §5.5).
Tap kèm denoise/stabilize vẫn qua offscreen `enhanceCanvas` với tap
+0,5px cũ (chưa đổi sang bob — nợ §5.5). `deinterlace: { mode: 1 }`
(tăng gấp đôi fps) vẫn không thể hiện trong preview (giới hạn cũ).

## 4. Test

Chạy bằng esbuild bundle + node (mẫu các đợt trước), 10 suite enhance:

| Suite | Kết quả |
|---|---|
| enhancePreview91P2 (warm-up, +2 test mới) | 20/20 (trước 18/18) |
| enhancePreview60Q1 | 16/16 |
| enhancePreview61R3 | 7/7 |
| enhancePreview62R3 | 10/10 |
| enhancePreview63R3 | 8/8 |
| enhancePreview75C8 | 14/14 |
| enhancePreview76D4 | 10/10 |
| enhancePreview77E1 | 11/11 |
| enhanceSpeedBlock61R2 | 9/9 |
| enhancePresets59P8 | 21/21 |
| **Tổng** | **126/126** |

- `node server/render/src/enhance.js --self-test`: pass (render mapping
  không đổi).
- `tsc --noEmit` (apps/web): **0 lỗi**.
- Lưu ý chéo luồng: harness P4-192 (`parityHarness192.ts`) gọi
  `denoiseWarmupFactor` động (không hardcode giá trị cũ) nên không vỡ;
  số warm-up S2 của P4 sẽ dịch theo hệ số mới — P4/T10 lưu ý khi đọc.

## 5. Giới hạn + nợ mở (trung thực)

1. Warm-up bậc 2 chỉ hiệu chuẩn trên flat15 (Y-std 8,25) như toàn bộ
   đường cong blend từ đợt 63; trên flat20 (Y-std 11,15) sai tới
   +16,5 điểm (trước +12,9) — xem §1.4.
2. Sharpen trên nội dung nhiễu lệch MAD 1,5–3,0 (le8 81–91%) — giới
   hạn mô hình Y_est; biến thể S7 tệ hơn, kernel đã gần tối ưu (§2).
3. Deint bob-bilinear đạt tier XẤP XỈ, chưa KHỚP (MAD 2,7–4,6 trên
   testsrc2); chưa đo lại FPS headed cho đường bob; tap kèm
   denoise/stabilize vẫn là tap +0,5px cũ; `mode: 1` không thể hiện.
4. Flat40 (nhiễu nặng): preview overstate tới +68,8 điểm ở s=1,0
   (đợt 191, không đo lại đợt này).
5. Nội dung chi tiết ở strength cao: preview mềm hơn render
   (MAD 5,2–8,9, le8 63–72% ở s=0,5–1,0 trên testsrc2 nhiễu — đợt
   191, không đo lại).
6. Hướng nợ mới: alpha denoise thích nghi theo mức nhiễu ước lượng
   từ frame (có thể sửa cả steady-state lẫn warm-up trên flat20) —
   cần thiết kế riêng, không làm trong đợt này.
7. Stabilize preview vẫn chỉ là zoom gợi ý, không giảm jitter thật.
8. Không đo lại FPS headed (warm-up không đổi đường vẽ; bob không
   thêm lần vẽ — chỉ đổi sampling lần vẽ trung gian sẵn có).

## 6. Số liệu gốc

Probe + JSON: `goals/capcut-clone-video-editor/hidden_files/round192-p2/`
(`probe-192-p2.mjs`, `probe-192-p2b.mjs`, `headed-bob-check.mjs`,
`parity-192-p2.json`, `parity-192-p2b.json`,
`headed-bob-result.json`, `gen.sh`). Lệnh chạy lại:
`node /tmp/round192-p2/probe-192-p2.mjs` (cần fixture
`/tmp/round192-p2/*.yuv` — sinh lại bằng `gen.sh`; file .yuv không
đưa vào batch). Headed check:
`node /tmp/round192-p2/headed/headed-bob-check.mjs` (cần Chromium
1254 tại `~/.cache/ms-playwright/chromium-1254/`).
