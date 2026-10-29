# MOTION_ROUND_LIMITS.md — Phase 9 đợt 8: slow-mo / nội suy frame / motion blur

> Tài liệu tổng hợp đợt. File này hiện CHỈ chứa phần S6 (E2E + benchmark).
> Các luồng khác (S1/S2/S3/…) bổ sung phần của mình vào đây; parent gộp
> cuối đợt. Đừng coi file này là đầy đủ cho cả đợt khi mới chỉ có mục S6.

## S6 — E2E + benchmark (luồng S6, chạy ngày 26/10/2026)

### Phương pháp đo

- Harness: `server/render/src/test_motion_e2e.js` — chạy ĐỘC LẬP bằng
  ffmpeg CLI trực tiếp, không phụ thuộc code S2/S3 lúc viết (S2 về sau
  mới xuất hiện trong lúc chạy — xem mục "E2E qua builder" bên dưới).
- Nguồn: `testsrc2` (pattern chuyển động thật, không dùng màu phẳng).
- Đếm frame: `ffprobe -count_frames` (giải mã thật, không tin duration).
- Độ mượt: giải mã PNG rồi đo bằng Python/numpy/PIL — MAD trung bình
  và lớn nhất giữa các frame liên tiếp; độ sắc nét = trung bình
  |gradient| trên frame xám.
- Bench nặng hơn: `benchmarks/motion/bench_motion.sh` (640x360, preset
  veryfast/CRF 23 như `benchmarks/render/bench_render.sh`), kết quả thô
  ở `benchmarks/results/motion.jsonl` (file này không stage theo mẫu
  results, chỉ stage script).
- Môi trường đo: FFmpeg 8.1.2, VM 2 vCPU / ~7.7 GB RAM. Mọi thời gian
  dưới đây CHỈ đúng cho máy này và nguồn test ngắn này.

### Số đo thật — harness E2E (320x180, nguồn 15fps/2s = 30 frame)

| Check | Kết quả thật | Kết luận |
|---|---|---|
| (a) minterpolate fps=30 (không setpts) | 57 frame, duration 1.900s (lý thuyết 60 / 2.0s) | PASS 60±3, ở biên dưới |
| (a-chẩn-đoán) setpts=0.5\*PTS + minterpolate fps=30 (đúng chữ brief) | 29 frame, duration 0.967s | KHÔNG đạt 60 — xem giải thích bên dưới |
| (a-chẩn-đoán) setpts=2\*PTS (slow-mo 0.5x) + minterpolate fps=30 | 113 frame, duration 3.767s (lý thuyết 120 / 4.0s) | Hụt frame biên, không assert |
| (b) max frame-diff: bản lặp frame (fps=30) | meanMAD 2.139, maxMAD 4.923 (60 frame) | — |
| (b) max frame-diff: bản nội suy | meanMAD 2.307, maxMAD 2.672 (57 frame) | PASS: max nhỏ hơn bản lặp (2.672 < 4.923) |
| (c) độ sắc nét: gốc vs tmix frames=5 | 4.809 vs 4.229 (tỉ lệ 0.879) | PASS: blur làm giảm sắc nét |
| (d) thời gian render 320x180: plain / minterpolate / tmix | 0.124s / 1.013s / 0.189s (lần chạy 2; lần 1: 0.104 / 0.870 / 0.115s) | Chỉ ghi số thật, không assert tốc độ |

Harness tổng: **11 pass, 0 fail** (lần chạy cuối 26/10/2026, exit 0).

### Số đo thật — bench 640x360 (nguồn 15fps/4s = 60 frame)

| Cấu hình | Thời gian | Frame output |
|---|---|---|
| plain (không filter) | 0.299s | 60 |
| minterpolate fps=30 (mci/aobmc/bidir) | 7.191s | 117 (lý thuyết 120, hụt 3 frame biên) |
| tmix frames=5 | 0.352s | 60 |

→ Cảnh báo cho UI/parent: ở 640x360, minterpolate chậm hơn plain
khoảng 24 lần (7.191s cho 4s video ≈ 0.56x realtime trên VM này).
Clip dài + minterpolate sẽ render rất lâu trên máy yếu — cần cảnh báo
thời gian trước khi user bấm render, không được giấu chi phí này.
tmix rẻ (0.352s ≈ plain), không đáng lo.

### E2E qua builder S2 (không còn PENDING)

Lúc chạy lại harness, `server/render/src/motion.js` (S2) đã có mặt nên
harness chạy thêm 1 lần qua builder thật (không PENDING):

- `buildMotionChain({ interpolation: "minterpolate", targetFps: 30,
  motionBlur: { frames: 5 } }, 30)` →
  `fpsFilter="minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"`,
  `blurChain=",tmix=frames=5:weights=1 1 1 1 1"` — khớp đúng filter
  mà harness CLI dùng.
- Render qua filter của builder: **57 frame** (≈57 như bản CLI, tmix
  không đổi số frame) — PASS.
- `validateMotion` hợp lệ → 0 lỗi; `targetFps: 0` → có lỗi (fail-fast);
  motion + speedKeyframes → có lỗi (nhánh ramp S3 chưa áp motion, chặn
  đúng như thiết kế S2 — xem MOTION_LIMITS.md của S2).

### Giới hạn trung thực (S6)

1. **minterpolate là ước lượng chuyển động của FFmpeg, không phải
   RIFE/AI.** Chất lượng nội suy chỉ ở mức motion-estimation cổ điển
   (mci/aobmc/bidir); không claim mượt như AI frame interpolation.
2. **CPU-only trên VM này.** Không có GPU encode/decode trong phép đo;
   số thời gian không áp dụng cho máy khác, GPU khác, hoặc clip dài.
3. **Frame biên bị cắt.** minterpolate bidir cần frame kề hai phía nên
   output luôn hụt ~3 frame so với lý thuyết (57/60, 117/120, 113/120).
   UI không được hứa duration output bằng đúng duration lý thuyết khi
   bật nội suy.
4. **Sai số trong brief đợt (ghi rõ, không sửa số).** Chuỗi
   "nguồn 15fps/2s + setpts 0.5 + minterpolate fps=30 → ≈60 frame" theo
   đúng chữ là không thể đạt: `setpts=0.5*PTS` trong ffmpeg là tốc độ
   2x (duration còn ~1s → đo được 29 frame, 0.967s), còn slow-mo 0.5x
   đúng nghĩa là `setpts=2*PTS` (đo được 113 frame, 3.767s). Con số 60
   của brief tương ứng với chuỗi nội suy thuần túy không setpts
   (đo được 57 frame, trong ±3). Harness assert 60±3 cho chuỗi nội suy
   thuần túy và in cả hai chuỗi setpts dưới dạng chẩn đoán, không
   sửa số, không ép chuỗi sai thành PASS.
5. **Mean frame-diff không phân biệt được nội suy vs lặp frame**
   (2.307 vs 2.139 — xấp xỉ nhau theo lý thuyết vì bản lặp có một nửa
   cặp diff = 0). Metric đúng để assert độ mượt là **max** frame-diff.
6. **Độ sắc nét chỉ là proxy cho blur**, không phải đo chất lượng
   motion blur cảm nhận được; tỉ lệ 0.879 đo trên testsrc2, nguồn khác
   sẽ khác.
7. **Chưa đo:** chất lượng nội suy trên footage thật (người, chuyển động
   nhanh, cảnh cắt), minterpolate ở 1080p/4K, và kết hợp motion +
   stabilize (S2 ghi "chất lượng kết hợp chưa được đo" — S6 cũng chưa đo).
