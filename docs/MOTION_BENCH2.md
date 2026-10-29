# Motion benchmark đợt 2 — footage "thật hơn" + 720p/1080p/4K + clip dài + stabilize (Phase 9 đợt 9, luồng M5)

Trả nợ đợt 8 (xem `docs/PHASE9_ROUND8_MOTION_LIMITS.md` mục 4):
đợt 8 chỉ đo clip testsrc2 thuần 640x360, 15fps, 4s
(plain 0.299s, minterpolate 7.191s, tmix 0.352s) — chưa có footage
thật, 1080p/4K, clip dài, hay stabilize+interpolation.

## 0. Cảnh báo đọc số — đọc trước khi trích dẫn

- **Mọi số dưới đây chỉ đúng máy đo này, ngày đo 2026-10-26.**
  Không suy ra máy khác, không suy ra laptop 8 nhân + GPU.
- **Nguồn là footage TỔNG HỢP, không phải quay thật** (xem §2).
  Chưa đo: người thật, chuyển động nhanh, cắt cảnh, rung tay thật.
- **Mỗi cấu hình chỉ chạy 1 lần** (trừ plain 30s chạy 2 lần, xem §5).
  Không có trung bình, không có độ lệch chuẩn.
- **Ngoại suy clip dài KHÔNG phải số đo** — ghi rõ `NGOẠI SUY` ở §5,
  và bằng chứng §5 cho thấy ngoại suy tuyến tính có thể lệch ~2×
  do tải máy thay đổi theo thời gian.
- Script đo: `benchmarks/motion/bench_motion2.sh`; số thô:
  `benchmarks/results/motion2.jsonl` (11 dòng, gộp từ 2 lần chạy
  trên cùng máy — xem cuối §1 về việc gộp).

## 1. Cấu hình máy đo

| Hạng mục | Giá trị |
|---|---|
| CPU | 2 vCPU (VM, `nproc` = 2) |
| RAM | 7.7 GiB, không swap |
| GPU | Không có (CPU-only toàn bộ) |
| OS | Linux (Ubuntu 24.04, VM) |
| FFmpeg | 8.1.2 (`ffmpeg version 8.1.2 Copyright (c) 2000-2026`) |
| Encode | libx264, preset veryfast, CRF 23, yuv420p (như bench đợt 8) |

Cách chạy: lượt chính (720p + 1080p + plain 30s + stabilize) chạy
`bench_motion2.sh` end-to-end 1 lần; sau đó chạy riêng 4K với
`BENCH4K=1 BENCH_SKIP_HD=1`. Lượt 4K đã ghi đè `motion2.jsonl` của
lượt chính (script lúc đó chưa có chế độ append) nên file jsonl hiện
tại được **gộp tay từ bảng in của 2 lượt** — mọi con số trong file
đã đối chiếu khớp từng dòng với log 2 lượt chạy. Script đã được vá
thêm `BENCH_APPEND_JSONL=1` để lần sau không ghi đè nữa.

## 2. Nguồn footage — tổng hợp, "thật hơn" đợt 8 ở điểm nào

Không dùng media quay thật (repo không có sẵn footage quay thật nào
được xác nhận license sạch cho mục này, và task cấm commit binary).
Nguồn sinh bằng FFmpeg, ghi rõ công thức để ai cũng tái tạo được:

- **Nền chi tiết:** `testsrc2` (nhiều vật thể, số, lưới chuyển động —
  chi tiết hơn màu phẳng, nhưng vẫn là pattern tổng hợp).
- **Vật thể riêng chuyển động:** overlay một hình vuông đỏ 160x160
  (320x320 ở 4K) di chuyển chéo theo `x = 80+500*|sin(t)|`,
  `y = 60+300*|cos(t)|` — có cạnh sắc và che khuất nền, tạo trường hợp
  khó hơn cho motion estimation so với testsrc2 thuần.
- **Nguồn rung lắc (cho stabilize):** lấy nguồn 720p trên, crop cửa sổ
  1152x648 dao động sin (`x = 64+24*sin(2π·t·2.7)`,
  `y = 36+18*cos(2π·t·3.1)`) rồi scale lại 1280x720 — rung nhân tạo,
  có chu kỳ, **không phải rung tay thật**.

So với đợt 8, khác biệt làm số không so sánh trực tiếp được:
độ phân giải cao hơn (720p/1080p/4K vs 640x360), fps nguồn 25
(vs 15), fps đích 50 (vs 30), và nguồn có thêm vật thể động.
Vì vậy §6 chỉ đối chiếu định tính, không claim "chậm hơn X lần
do độ phân giải".

## 3. Phương pháp đo

- Filter nội suy **đúng chain render thật** của
  `server/render/src/motion.js` (`buildMotionFpsFilter`, miMode mci):
  `minterpolate=fps=50:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,fps=50`
  (fps thứ hai là bước lấp đuôi CFR của đợt 8).
- Motion blur: `fps=25,tmix=frames=5` (sau bước fps, như render).
- Stabilize: `vidstabdetect` (pass 1) rồi
  `vidstabtransform + minterpolate` (pass 2) — thứ tự như render:
  stabilize ở enhPre trước, motion sau.
- Thời gian = wall-clock `date +%s.%N` bao quanh lệnh ffmpeg
  (gồm cả encode, không tách riêng filter). Frame output đếm bằng
  `ffprobe -count_frames` (không tin duration).
- Timeout mỗi cấu hình 600s: không cấu hình nào chạm timeout.

## 4. Kết quả đo thật (mẫu 4s, trừ dòng ghi chú khác)

Nguồn 25fps, 4s = 100 frame input; nội suy ra 50fps = 200 frame.

| Cấu hình | Độ phân giải | Thời gian (s) | Frame output | Tỉ lệ vs plain cùng res | Tốc độ output |
|---|---|---|---|---|---|
| plain | 1280x720 | 1.456 | 100 | 1.0× | 68.7 fps |
| minterpolate | 1280x720 | 110.844 | 200 | 76.1× | 1.80 fps |
| tmix (frames=5) | 1280x720 | 4.541 | 100 | 3.1× | 22.0 fps |
| plain | 1920x1080 | 8.805 | 100 | 1.0× | 11.4 fps |
| minterpolate | 1920x1080 | 245.425 | 200 | 27.9× | 0.82 fps |
| tmix (frames=5) | 1920x1080 | 8.965 | 100 | 1.02× | 11.2 fps |
| plain | 3840x2160 (mẫu 2s) | 6.866 | 50 | 1.0× | 7.3 fps |
| minterpolate | 3840x2160 (mẫu 2s) | 216.227 | 100 | 31.5× | 0.46 fps |

Đọc số:

- **Minterpolate là chi phí áp đảo.** Ở 1080p, 4s nguồn tốn
  245.4s (~4.1 phút), tức 0.016× realtime — chậm hơn realtime ~61×.
  Ở 720p là 0.036× realtime; 4K (mẫu 2s) là 0.009× realtime.
- **Tỉ lệ vs plain dao động mạnh theo res (76.1× / 27.9× / 31.5×)**
  vì thời gian plain cũng dao động theo tải máy (plain 720p chỉ
  1.456s là lúc máy rỗi đầu lượt chạy). Đừng trích một tỉ lệ duy
  nhất — trích kèm thời gian tuyệt đối.
- **tmix rẻ:** ở 1080p tmix gần như không thêm thời gian so với
  plain (8.965s vs 8.805s) vì encode chiếm phần lớn; ở 720p thêm
  ~3.1s. Motion blur không phải nút cổ chai — nội suy mới là.
- **Frame output đúng lưới ở mọi cấu hình** (200/100/50), nhờ bước
  `fps=` lấp đuôi của đợt 8 — không còn hiện tượng rớt đuôi khi đo
  qua chain đầy đủ này.

## 5. Clip dài và stabilize + interpolation

### 5a. Clip dài — 1 số đo thật + còn lại là NGOẠI SUY

- **ĐO THẬT:** plain 720p 30s (750 frame) = **23.191s**.
  So với dự đoán tuyến tính từ mẫu 4s (1.456s × 7.5 = 10.92s),
  thực đo cao hơn **2.12×**. Cùng cấu hình này ở lượt chạy lỗi
  trước đó đo được 19.720s — tức chỉ riêng plain 30s đã dao động
  ~18% giữa 2 lần chạy. Kết luận: **tải máy thay đổi theo thời gian
  làm mọi ngoại suy tuyến tính chỉ mang tính bậc độ lớn**, sai số
  ít nhất ~2×. Đây là lý do §5b ghi rõ NGOẠI SUY.
- **NGOẠI SUY (không phải số đo, tuyến tính từ mẫu §4):**

| Cấu hình nội suy | Chi phí / 1s nguồn | NGOẠI SUY 30s | NGOẠI SUY 60s |
|---|---|---|---|
| 720p minterpolate | 27.711s | ~831s (~13.9 phút) | ~1663s (~27.7 phút) |
| 1080p minterpolate | 61.356s | ~1841s (~30.7 phút) | ~3681s (~61.4 phút) |
| 4K minterpolate | 108.114s | ~3243s (~54.1 phút) | ~6487s (~108.1 phút) |

  Hệ quả cho UI (đề xuất, chưa phải tính năng): clip 1080p dài
  60s bật nội suy có thể tốn ~1 giờ chỉ riêng bước motion trên máy
  2 vCPU này — cần cảnh báo thời gian trước khi render (nợ từ đợt 8,
  số đợt này làm nó cụ thể hơn nhưng vẫn chỉ đúng máy đo).

### 5b. Stabilize + interpolation — ĐO ĐƯỢC (720p, nguồn rung nhân tạo)

| Bước | Thời gian (s) | Ghi chú |
|---|---|---|
| vidstabdetect (pass 1) | 3.224 | phân tích chuyển động, không ra frame đếm được |
| vidstabtransform + minterpolate (pass 2) | 124.854 | 200 frame output, đúng lưới 50fps |
| **Tổng combo** | **128.078** | |
| Chỉ minterpolate, cùng res (để so) | 110.844 | |
| **Chi phí thêm của stabilize** | **+17.234s (+15.5%)** | detect rẻ, transform làm chậm thêm ~14s |

Lần đầu combo này được đo (nợ đợt 8 đã đóng ở đây cho 720p).
**Chưa đo chất lượng stabilize** — chỉ đo thời gian và số frame;
không claim rung giảm bao nhiêu, vì nguồn rung là sin nhân tạo và
không có metric độ ổn định trong đợt này.

## 6. Đối chiếu với đợt 8 (định tính, không so trực tiếp)

| | Đợt 8 | Đợt 9 M5 |
|---|---|---|
| Nguồn | testsrc2 thuần 640x360, 15fps | testsrc2 + vật thể động, 720p/1080p/4K, 25fps |
| minterpolate | 7.191s / 4s (0.56× realtime*) | 110.8s / 4s ở 720p (0.036× realtime) |
| tmix | 0.352s / 4s | 4.541s / 4s ở 720p |
| stabilize + interp | chưa đo | 128.1s / 4s ở 720p |

\* Con số 0.56× realtime của đợt 8 tính theo fps đích 30 (120 frame /
7.191s ≈ 16.7 fps ≈ 0.56 × 30fps); đợt này tính tương tự theo fps
đích 50. Hai đợt khác res, khác fps, khác nguồn nên chênh lệch
không quy hết cho độ phân giải — nguồn chi tiết + vật thể động và
fps đích cao hơn đều làm minterpolate chậm thêm.

## 7. Giới hạn còn lại (trung thực)

1. **Không phải footage quay thật:** không người, không chuyển động
   nhanh, không cắt cảnh, không rung tay thật, không nhiễu sensor.
   Số trên nguồn tổng hợp có thể khác đáng kể trên footage thật.
2. **Không đo chất lượng:** chỉ đo thời gian + số frame. Không đo
   artifact nội suy (bóng ma, méo vật thể), không đo độ ổn định sau
   vidstab, không so sánh frame-by-frame với bản không motion.
3. **Một lần chạy, tải máy trôi:** plain 30s dao động 19.7–23.2s
   giữa 2 lần chạy; ngoại suy clip dài có thể lệch ~2× trở lên.
4. **Chưa đo:** stabilize + interpolation ở 1080p/4K; tmix ở 4K;
   ramp + motion ở HD; mask-keyframes + motion (nợ chung từ đợt 8,
   không thuộc phạm vi M5); nội suy trên clip dài thật (chỉ ngoại suy).
5. **4K chỉ mẫu 2s:** ngoại suy 4K từ mẫu 2s còn kém tin cậy hơn
   mẫu 4s (mẫu càng ngắn, sai số ngoại suy càng lớn).
6. **Lỗi gặp trong đợt (đã sửa, ghi để đợt sau khỏi lặp lại):**
   - Script v1 lỗi `local w="$1" h="$2" src="...${w}..."` — bash mở
     rộng mọi đối số của `local` trước khi gán nên `${w}` là unbound
     dưới `set -u`; đã tách thành nhiều lệnh `local`.
   - Lượt 4K ghi đè `motion2.jsonl` của lượt chính; đã thêm
     `BENCH_APPEND_JSONL=1` và gộp tay file hiện tại từ log 2 lượt.
7. Không push GitHub, không tag/release, không binary trong batch —
   script và doc này là file text; MP4/.trf trung gian chỉ nằm ở
   `/tmp/vcut-bench/motion2/`, không đưa vào repo.
