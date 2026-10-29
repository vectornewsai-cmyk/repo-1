# Phase 9 đợt 11 — Luồng P2: pixelate khớp render + rà soát effect canvas (LIMITS)

Ngày: 2026-10-27. Một luồng trong đợt lớn Phase 9 đợt 11. KHÔNG push,
KHÔNG tag/release, KHÔNG binary. Chỉ sửa file trên đĩa; batch stage do
parent đợt lớn tổng hợp.

## 1. Đã sửa gì

### Pixelate: đổi điểm lấy mẫu từ góc trái-trên sang tâm khối (KHỚP)

Nguyên nhân lệch MAD 26.75 ở đợt 10 (V6) đã xác định đúng: preview lấy
màu pixel góc trái-trên của khối, còn FFmpeg `scale …:flags=neighbor`
khi thu nhỏ lấy mẫu tại **tâm khối**. Chứng cứ đo bằng frame mã hoá
toạ độ (R=x, G=y) rồi đọc điểm lấy mẫu của downscale:

| k (intensity) | offset mẫu FFmpeg đo được | floor(k/2) | góc trái-trên cũ |
|---|---|---|---|
| 2 (0) | (1, 1) | 1 | (0, 0) |
| 6 (0.25) | (3, 3) | 3 | (0, 0) |
| 9 (0.5) | (4, 4) | 4 | (0, 0) |
| 16 (1) | (8, 8) | 8 | (0, 0) |

`applyPixelate` nay lấy mẫu tại `(bx + floor(k/2), by + floor(k/2))`,
clamp vào trong khối ở rìa. Trung bình khối (avg) cũng đã thử và thua
tâm khối trên mọi nguồn (vd k=9 pattern: avg MAD 1.83 so với tâm 0.67).

### Shake: từ dịch tịnh tiến cả khung sang crop+pad đúng render (KHỚP)

Nguyên nhân lệch MAD 44.58 ở t=0: bản cũ dịch toàn khung, còn render
`crop (w-24)×(h-24) rồi pad (12,12)` — tức chỉ cửa sổ
`[12, w-12) × [12, h-12)` giữ nội dung, viền đen 12px bốn phía.
`applyShake` nay giữ đúng ngữ nghĩa đó: dịch theo (dx, dy) từ
`shakeOffsetAt` (không đổi công thức) rồi ép đen viền 12px. Vì
cropX = 12 − dx, cropY = 12 − dy nên chỉ cần (dx, dy) là đủ, không cần
thêm tham số. `shakeOffsetAt` và `canvasEffectOps` không đổi chữ ký.

### Rgb-shift: không sửa code — đã xác nhận KHỚP (trước đây "chưa đối chiếu")

Chiều dịch hiện tại (đỏ phải, xanh trái) đối chiếu pixel-đối-pixel với
`rgbashift=rh=9:bh=-9` cho MAD 0.000. Comment "chưa đối chiếu" trong
code đã được sửa thành đã xác nhận.

## 2. Số đo thật (FFmpeg 8.1.2, VM này; nguồn tổng hợp như harness V6)

Tiêu chí V6: KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20
và ≥ 90% pixel lệch ≤ 32. Chạy bằng test mới
`apps/web/src/lib/effectCanvas.parity.test.ts` (9 test, PASS).

| Effect | Trước đợt 11 | Sau đợt 11 | Kết luận |
|---|---|---|---|
| pixelate k=2 (pattern 72×46) | MAD 4.33 | **MAD 0.667, ≤8 = 100%** | KHỚP |
| pixelate k=9 (pattern 72×45) | MAD 26.75 | **MAD 0.667, ≤8 = 100%** | KHỚP |
| pixelate k=16 (pattern 144×96) | MAD 51.67 | **MAD 0.667, ≤8 = 100%** | KHỚP |
| pixelate k=6 (pattern 72×48) | MAD 13.00 | **MAD 0.667, ≤8 = 100%** | KHỚP (đo tay, chưa đưa vào test file) |
| mirror (asym) | MAD 0.00 | MAD 0.000 | KHỚP (không đổi) |
| rgb-shift s=9 (gradient kênh) | chưa đo | **MAD 0.000, ≤8 = 100%** | KHỚP (mới xác nhận) |
| shake t=0 (pattern) | MAD 44.58 | **MAD 0.000** | KHỚP |
| shake t=0.5, frame 15/30 (pattern) | chưa đo | **MAD 0.000** | KHỚP |
| sharpen (pattern, amount 1.1) | MAD 1.04 | MAD 1.044, ≤32 = 100% | XẤP XỈ (không đổi, kernel khác) |
| edgedetect (step, low 0.2/high 0.45) | chưa đo | MAD 6.769, ≤8 = 97.3% | XẤP XỈ về MAD nhưng KHÁC CẤU TRÚC (xem §3) |
| noise / glitch | — | không đo được từng frame | XẤP XỈ về thống kê (xem §3) |

Test cũ cập nhật theo ngữ nghĩa mới: `effectCanvas.test.ts` 13/13 PASS
(pixelate k=2/k=9 lấy mẫu tâm khối, shake crop+pad trên ảnh 32×32,
thứ tự mirror→pixelate đổi kết quả theo mẫu tâm khối). tsc web app 0
lỗi (file parity test được exclude khỏi tsconfig theo đúng mẫu các
file test strip-types khác).

## 3. Giới hạn trung thực — đọc trước khi claim "effect preview = render"

- **MAD pixelate còn 0.667 không phải lỗi lấy mẫu.** Mọi pixel đều lệch
  ≤ 8; phần dư ~1 đơn vị là làm tròn trong đường chuyển đổi màu của
  FFmpeg khi scale, không phải sai điểm mẫu. Đừng cố "sửa" 0.667 này
  bằng cách đổi điểm mẫu — mọi điểm mẫu khác đều cho MAD lớn hơn hẳn.
- **Trên nguồn nhiễu ngẫu nhiên qua đường raw rgb24, preview KHÔNG thể
  khớp pixel render bằng bất kỳ điểm mẫu nào.** Đo thật: nguồn ngẫu
  nhiên 72×45, k=9, đường rgb24 mặc định cho MAD 36.83 với mẫu tâm khối
  (và 79.22 với mẫu góc trái-trên); output downscale không trùng bất kỳ
  pixel nào trong khối (sai khác tối đa 137, không pixel nào trong
  khối khớp trong ±3). Nhưng cùng nguồn đó qua đường yuv444p thì mẫu tâm
  khối khớp trong ±1 (40/40 khối). Kết luận: phần dư này là chuyển đổi
  không gian màu của đường scale rgb24, không phải lỗi lấy mẫu; trên
  nguồn mượt/pattern/video-like (và trên đường yuv444p) thì tâm khối
  khớp. Đừng claim pixelate khớp tuyệt đối trên mọi nguồn nhiễu.
- **Đường đo là tổng hợp, chưa phải footage thật.** Harness đưa raw
  rgb24 vào FFmpeg; video thật vào render thường là yuv420p, chưa đo
  trên footage thật/HD/clip dài. Số MAD trên chỉ đúng nguồn tổng hợp
  và máy đo này.
- **Pixelate khi kích thước không chia hết cho k vẫn xấp xỉ ở rìa.**
  Render co khung (vd 64×48, k=9 → 63×45); preview giữ nguyên kích
  thước và clamp điểm mẫu vào khối rìa. Đây là lựa chọn có chủ ý (giữ
  khung preview), không phải bug chưa phát hiện.
- **Shake trên khung < 25px theo một chiều là suy biến.** Cửa sổ crop
  rỗng → preview toàn đen; render thật còn lỗi luôn vì crop ≤ 0.
  Không phải hành vi xem trước bình thường, không cần xử lý thêm.
- **Shake dùng thời gian clip-local, render dùng thời gian timeline.**
  `canvasEffectOps` truyền localT; nếu clip không bắt đầu ở 0 thì pha
  rung preview lệch pha render. Đây là vấn đề thời gian chung của mọi
  effect theo thời gian (cả seed noise/glitch), tồn tại từ trước, KHÔNG
  sửa trong luồng này vì cần đổi đường truyền thời gian của preview.
- **Edgedetect: đừng sửa Sobel để khớp Canny trên nguồn step.** Trên
  nguồn step dọc hoàn hảo, FFmpeg Canny chỉ cho 4 pixel sáng tại cột
  36, hàng 1, 2, 42, 43 (đo lặp lại cả frame đơn và frame 15/30); canvas
  Sobel cho 2 cột 35, 36 đủ chiều cao (90 pixel). MAD 6.77 nhỏ chỉ vì
  đa số pixel hai bên đều đen — đó là XẤP XỈ về số, khác cấu trúc về
  hình. Ép Sobel bắt chước 4 pixel thưa đó là overfit nguồn tổng hợp;
  muốn kết luận về footage thật cần đo trên ảnh có biên tự nhiên trước.
- **Sharpen vẫn chỉ xấp xỉ có cơ sở:** render unsharp 5×5, preview
  box-blur 3×3 (MAD 1.04). Viết lại kernel 5×5 đúng FFmpeg không phải
  "sửa đơn giản" (kernel unsharp của FFmpeg không được mirror 1-1 trong
  code hiện tại) nên giữ nguyên, không claim khớp.
- **Noise/glitch không thể khớp từng frame theo thiết kế.** Render
  dùng nhiễu thời gian (`noise allf=t`; glitch = rgb-shift + noise thời
  gian), canvas dùng seed xác định để tua lại cho cùng hình. Phần
  rgb-shift của glitch thì khớp (đã đo ở rgb-shift), phần nhiễu/slice
  ngẫu nhiên chỉ xấp xỉ về thống kê. Đừng claim glitch/noise khớp
  frame.
- **Badge preview "xấp xỉ" cho pixelate/shake có thể nâng lên "khớp"**
  ở đợt sau cho 2 effect này trên nguồn video-like, nhưng luồng này
  KHÔNG đụng `previewStatus.ts` theo phân công (để luồng UI quyết định
  và cập nhật test badge tương ứng). Hiện badge vẫn ghi "xấp xỉ" cho
  cả 8 effect canvas — an toàn nhưng đã lỗi thời với pixelate, shake,
  rgb-shift, mirror.

## 4. File đã đổi/thêm (tương đối từ gốc repo)

- `apps/web/src/lib/effectCanvas.ts` (sửa: mẫu tâm khối pixelate, shake crop+pad, comment rgb-shift)
- `apps/web/src/lib/effectCanvas.test.ts` (sửa test theo ngữ nghĩa mới)
- `apps/web/src/lib/effectCanvas.parity.test.ts` (mới: đo MAD thật bằng FFmpeg, 9 test)
- `apps/web/tsconfig.json` (thêm parity test vào exclude, theo mẫu các file test khác)
- `docs/PHASE9_ROUND11_P2_PIXELATE_LIMITS.md` (mới: file này)

Không đụng: `previewStatus.ts`, `nestedPreview*`, `TextAnimPicker`, i18n.
