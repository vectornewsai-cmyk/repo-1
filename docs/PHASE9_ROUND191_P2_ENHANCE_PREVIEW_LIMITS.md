# PHASE 9 ĐỢT 191 — P2: Enhance lên preview — kiểm chứng + đóng parity sharpen/noise

**Trạng thái: ĐÃ LÀM + ĐÃ ĐO (code đổi) — KHÔNG push.**
Chủ đề đợt 191 (lệnh user 15:03 25/11): Editing Core — parity preview/render.
Luồng P2 đóng gap GAP §-1 "sharpen/noise parity chưa kiểm chứng lại".
Mọi số dưới đây là số đo thật trên VM này (ffmpeg 8.1.2, node 24.22.1),
không ước lượng, không đánh giá bằng mắt. Fixture chỉ giữ script gen
(probe trong `hidden_files/round191-p2/`), không binary trong batch.

## 0. Thay đổi code trong đợt này

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | **Mới:** `denoiseWarmupFactor(frameIndex, strength)` + 2 hằng (`DENOISE_WARMUP_FRAME_COUNT = 3`, `DENOISE_WARMUP_FRAME0_FACTOR = 1/3`); `enhancePreviewPlan` thêm tham số optional thứ 5 `framesSinceClipStart` — alpha denoise nhân với hệ số warm-up; `EnhancePreviewPlan` + `EnhancePreviewDebug` thêm field `denoiseWarmupFactor`. Đường cong blend đợt 63 (`denoiseBlendAlpha`) KHÔNG đổi. |
| `apps/web/src/preview.tsx` | Chỉ vùng enhance: `drawVideoClip` (dòng ~4316) truyền `framesSinceClipStart = floor(localT × spec.meta.fps)` vào plan; khởi tạo `enhancePreviewDebugState` thêm `denoiseWarmupFactor: 1`; sửa 1 dòng comment cũ ghi sai `a = strength` (từ đợt 63 a đã là piecewise). Không reformat dòng không liên quan. |
| `apps/web/src/components/enhance/enhancePreview91P2.test.ts` | **Mới:** 18 test khóa warm-up (hệ số, plan, hook, tương thích cũ). |
| `apps/web/src/components/enhance/enhancePreview60Q1.test.ts` | Shape-lock plan 10 → 11 key (thêm `denoiseWarmupFactor` có chủ đích). |
| `apps/web/src/components/enhance/enhancePreview62R3.test.ts` | Shape-lock hook debug thêm `denoiseWarmupFactor` (= 1 khi không frame) + assert giá trị. |
| `apps/web/src/components/enhance/EnhancePanel.tsx` | KHÔNG đổi — preset/giá trị panel đã đúng default render, không cần sửa wiring. |

## 1. Phương pháp đo (baseline trước khi sửa)

- Fixture tự sinh bằng ffmpeg, khổ 320×180, pipeline YUV bt709 sạch:
  raw yuv420p → truth render bằng filter thật → so sánh trong miền RGB
  sau CÙNG 1 phép chuyển yuv→rgb bt709 cho cả 2 phía; % giảm nhiễu đo
  trực tiếp trên plane Y. (Probe v1 qua PNG bị nhiễm chuyển đổi màu
  bt601/bt709 nên số MAD sharpen bị thổi phồng — đã bỏ, chỉ dùng v2.)
- Render truth đúng code render: denoise `hqdn3d=s*24:s*18:s*24:s*18`
  (`server/render/src/enhance.js`); sharpen `unsharp=5:5:amount:5:5:0`,
  amount = 0.2+t*1.8 (`server/render/src/effects.js`); deint
  `yadif=mode=0:parity=-1:deint=0`.
- Preview sim = logic thật trong repo (`denoiseBlendAlpha`,
  `applySharpen` từ bundle esbuild) + mô phỏng vẽ canvas bằng số học
  thuần: blend `(1-a)·gốc + a·blur` (Gaussian tách được) và half-res
  deint (downscale dọc 2× rồi upscale bilinear).
- Mô hình blur Chromium: `blur(3.0px)` ≈ Gaussian σ=1.5 (= radius/2).
  Tự kiểm chứng: với σ=1.5, blend ở s=1.0 cho -80% (mốc đợt 63: -82.9%
  ở 720p, -87% ở 488×275); σ=3.0 cho -90% — xa mốc hơn. Mọi số blend
  dưới đây dùng σ=1.5.
- Metric: MAD / PSNR / %|diff|≤8 (le8) so với render truth; % giảm
  std nhiễu; R combing = năng lượng gradient dọc trung bình (luma).

## 2. Kết quả đo

### 2.1 Denoise — trạng thái ổn định (video, frame 8+): ĐÃ KHỚP, không cần sửa knots

Hiệu chuẩn đợt 63 khớp đúng mốc này (đo lại độc lập đợt này):

| strength | render hqdn3d (seq frame 8) | preview blend | sai số |
|---|---|---|---|
| 0.3 | -18.5% | -18.1% | -0.4 điểm |
| 0.5 | -44.8% | -43.7% | -1.1 điểm |
| 0.8 | -71.1% | -70.3% | -0.8 điểm |
| 1.0 | -78.9% | -80.0% | +1.1 điểm |

MAD vs render frame 8: 2.84–4.03, PSNR ~34, le8 71–94%. Đường cong
blend đợt 63 giữ nguyên — không có gì để "sửa" ở trạng thái ổn định.

### 2.2 Denoise — frame đầu clip (gap THẬT, đã đóng bằng warm-up)

hqdn3d hội tụ theo FRAME (thành phần thời gian cần frame trước), còn
blend cũ áp đủ alpha ngay frame 1. Sequence flat15 (Y-std):

| | frame 1 | frame 2 | frame 3 | frame 8+ |
|---|---|---|---|---|
| render s=0.3 | -5.0% | -17.3% | -18.2% | -18.5% |
| render s=0.5 | -14.8% | -39.2% | -43.4% | -44.8% |
| render s=0.8 | -26.0% | -53.9% | -63.5% | -71.1% |
| render s=1.0 | -29.3% | -54.3% | -65.1% | -78.9% |
| preview (không ramp) s=0.3/0.5/0.8/1.0 | -18.1% | -18.1% | -18.1% | — |
| | -43.7% | -43.7% | -43.8% | — |
| | -70.2% | -70.4% | -70.4% | — |
| | -79.9% | -80.1% | -80.1% | — |

Sai số preview KHÔNG ramp ở frame 1: **+13.1 / +28.9 / +44.2 / +50.6
điểm** (s=0.3/0.5/0.8/1.0); frame 2: +0.8/+4.5/+16.5/+25.8;
frame 3: -0.1/+0.4/+6.9/+15.0.
Hồi quy tỉ lệ alpha'/alpha để khớp render từng frame: frame 0 →
0.28/0.34/0.35/0.33 (≈ 1/3 hằng số); frame 1 → 0.97/0.88/0.74/0.62
(= 1.057-0.445·a); frame 2 → 1.00/0.99/0.89/0.75 (= 1.062-0.318·a).

**Sau sửa (hàm đã ship, đo lại bằng `enhancePreviewPlan` thật):**

| | frame 1 (sai số) | frame 2 (sai số) | frame 3 (sai số) |
|---|---|---|---|
| s=0.3 | +1.0 (was +13.1) | +0.2 (was +0.8) | -0.1 |
| s=0.5 | -0.1 (was +28.9) | -2.1 (was +4.5) | -3.3 (was +0.4) |
| s=0.8 | -1.5 (was +44.2) | -2.8 (was +16.5) | -5.4 (was +6.9) |
| s=1.0 | +1.0 (was +50.6) | +0.5 (was +25.8) | +0.2 (was +15.0) |

Sai số còn lại ≤5.4 điểm (tệ nhất frame 3 s=0.8 — đường hồi quy tuyến
tính không ôm hết độ cong; chấp nhận được vì chỉ 1 frame, đúng 1 mức
strength). Đếm frame theo frame OUTPUT (fps project): hqdn3d trong
render chạy SAU filter `fps=` (render.js:852), và mỗi clip có chain
riêng nên stream thời gian khởi động lại ở đầu mỗi clip — khớp với
cách preview đếm `floor(localT × spec.meta.fps)`. Reverse/speed-ramp
cũng đúng theo thứ tự output vì hqdn3d nằm sau motion chain.

### 2.3 Sharpen — KIỂM CHỨNG LẠI: KHỚP trên nội dung sạch, không sửa code

| Fixture | t=0.5 (amount 1.1) | t=1.0 (amount 2.0) |
|---|---|---|
| step sạch (0/255, rail-clamped) | MAD 0.000, PSNR inf, le8 100% | MAD 0.000, PSNR inf, le8 100% |
| testsrc2 sạch (tự nhiên) | MAD 0.138, PSNR 52.43, le8 99.9% | MAD 0.152, PSNR 51.58, le8 99.9% |
| step + nhiễu 15 | MAD 1.774, PSNR 39.21, le8 98.6% | MAD 2.994, PSNR 34.52, le8 85.7% |
| testsrc2 + nhiễu 15 | MAD 1.551, PSNR 38.08, le8 90.6% | MAD 2.461, PSNR 34.56, le8 81.4% |

Khớp với kết luận đợt 65/66 (MAD ~0.07–0.15 trên nội dung sạch).
Trên nội dung NHIỄU, unsharp khuếch đại nhiễu khác nhau giữa plane Y
render và Y_est của preview — lệch MAD 1.5–3.0, le8 81–91%. Đây là
giới hạn của mô hình Y_est, không phải bug wiring: cả hai phía đều
khuếch đại nhiễu, khác nhau ở chi tiết. Không sửa `effectCanvas.ts`
(ngoài phạm vi luồng; P4 đo độc lập bằng harness riêng). Ghi nhận là
giới hạn, xem §5.

### 2.4 Deint — KIỂM CHỨNG LẠI: xấp xỉ, KHÔNG parity (giữ nguyên cơ chế half-res)

Frame 8 testsrc2 interlaced (R = gradient dọc trung bình, luma):

| | R src | R yadif (render) | R preview half-res | R clean đối chứng |
|---|---|---|---|---|
| | 6.327 | 2.121 | 1.831 | 2.369 |

Preview khử răng cưa MẠNH HƠN cả yadif (R 1.83 < 2.12) và mềm hơn cả
bản progressive gốc (1.83 < 2.37) — đúng bản chất half-res: mất một
nửa độ phân giải dọc. So trực tiếp với yadif: MAD 6.42, PSNR 20.29,
le8 84.4%. Không có cách cải thiện trong khuôn khổ canvas 2D mà các
đợt trước chưa thử và loại (tap2: 2 lần vẽ full-res + FAIL 1:1;
blur(1px): thông lượng 2.3–61×, vgrad 20–41%; inline-shift: R không
giảm ở upscale — xem LIMITS đợt 75–77). Giữ nguyên divisor 2. Thêm
giới hạn: `deinterlace: { mode: 1 }` (mỗi field 1 frame, render tăng
gấp đôi fps) không được thể hiện trong preview (tap không đổi fps).

### 2.5 Các giới hạn đã biết, đo lại đợt này (không sửa)

- **Nhiễu nặng flat40:** render hqdn3d frame đơn chỉ -0.2/-1.2/-4.4/
  -7.6% (s=0.3/0.5/0.8/1.0) trong khi blend cho -4.6/-35.1/-65.6/
  -76.4% — overstate tới +68.8 điểm ở s=1.0 (MAD 27.66, le8 1.1%).
  Bất kỳ xấp xỉ không gian nào cũng vậy (hqdn3d thích nghi theo mức
  nhiễu + có thành phần thời gian). Không sửa được bằng blend.
- **Nội dung chi tiết (testsrc2 + nhiễu, sequence frame 8):** blend
  mềm cạnh đồng đều trong khi hqdn3d giữ cạnh → MAD 5.23 (s=0.5) /
  8.88 (s=1.0), le8 72.3%/63.4% vs render. Đây là giới hạn cơ chế
  blend (đã biết từ đợt 63: step-edge 4px ở a≥0.8). Biến thể blend có
  ngưỡng theo độ lệch pixel đã thử và loại ở đợt 63 (khử nhiễu sụp
  còn -16% tối đa).
- **Stabilize:** vẫn chỉ là zoom crop gợi ý (không làm mượt chuyển
  động thật, không giảm jitter đo được như vidstab) — ngoài phạm vi
  đợt này, giữ nguyên.

## 3. Chi phí FPS

Warm-up KHÔNG thêm lần vẽ nào (chỉ đổi giá trị alpha truyền vào
`enhancePreviewSource`) nên chi phí FPS bằng đúng blend cũ (~0.5×
baseline theo đợt 63, đã biết). Không đo lại FPS headed cho thay đổi
này vì không có gì trong đường vẽ thay đổi; ngưỡng 0.75× vẫn FAIL
như cũ là giới hạn của cơ chế blend, không phải của warm-up.

## 4. Test

Chạy bằng esbuild bundle + node (mẫu các đợt trước), 10 suite enhance:

| Suite | Kết quả |
|---|---|
| enhancePreview91P2 (mới, warm-up) | 18/18 |
| enhancePreview60Q1 | 16/16 |
| enhancePreview61R3 | 7/7 |
| enhancePreview62R3 | 10/10 |
| enhancePreview63R3 | 8/8 |
| enhancePreview75C8 | 14/14 |
| enhancePreview76D4 | 10/10 |
| enhancePreview77E1 | 11/11 |
| enhanceSpeedBlock61R2 | 9/9 |
| enhancePresets59P8 | 21/21 |
| **Tổng** | **124/124** |

- `node server/render/src/enhance.js --self-test`: pass (render mapping
  không đổi).
- `tsc --noEmit` (apps/web): 19 lỗi — TẤT CẢ nằm ở file của luồng
  khác đợt 191 (P4 `parityHarness191.ts` + test, P3 `reverse*.test.ts`)
  và 4 unused-var cũ trong `preview.tsx` ở vùng reverse (dòng 146,
  3871–3874, không phải vùng enhance); **0 lỗi ở file luồng này
  hoặc vùng preview.tsx đã sửa**. Không sửa file luồng khác.
- Harness parity độc lập của P4 (`parityHarness191.ts`, self-test
  assert `denoiseBlendAlpha(0.5) == 0.486`) không bị ảnh hưởng: lời
  gọi 4 tham số cũ giữ nguyên hành vi (warm-up factor mặc định 1);
  việc chạy toàn bộ harness là phần của P4.

## 5. Giới hạn + nợ mở (trung thực)

1. Denoise warm-up chỉ khớp frame 1–3; frame 3 s=0.8 còn sai -5.4
   điểm (hồi quy tuyến tính). Frame ≥3 khớp như cũ (≤1.1 điểm).
2. Sharpen trên nội dung nhiễu lệch MAD 1.5–3.0 so với render
   (le8 81–91%) — giới hạn mô hình Y_est, chưa có hướng sửa rẻ.
3. Deint preview mềm hơn yadif (R 1.83 vs 2.12; MAD 6.42 vs yadif,
   le8 84.4%) và không thể hiện `mode: 1` (tăng gấp đôi fps).
4. Flat40 (nhiễu nặng): preview overstate tới +68.8 điểm ở s=1.0.
5. Nội dung chi tiết ở strength cao: preview mềm hơn render
   (MAD 5.2–8.9, le8 63–72% ở s=0.5–1.0 trên testsrc2 nhiễu).
6. Stabilize preview vẫn chỉ là zoom gợi ý, không giảm jitter thật.
7. Effect noise (thêm nhiễu, `applyNoise`) KHÔNG đo lại ở luồng này
   — thuộc harness parity S3 của P4 (`parityHarness191.ts`).
8. Không đo lại FPS headed (warm-up không đổi đường vẽ; chi phí
   blend ~0.5× đã biết từ đợt 63, ngưỡng 0.75× vẫn FAIL).

## 6. Số liệu gốc

Probe + JSON: `goals/capcut-clone-video-editor/hidden_files/round191-p2/`
(`probe-191-p2-parity2.mjs`, `probe-191-p2-warmup-after.mjs`,
`parity-baseline2.json`, `parity-warmup-after.json`). Lệnh chạy lại:
`node /tmp/round191-p2/probe-191-p2-parity2.mjs` (cần fixture
`/tmp/round191-p2/*.yuv` — sinh lại bằng ffmpeg theo §1; file .yuv
không đưa vào batch).
