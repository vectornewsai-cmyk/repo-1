# LIMITS — Phase 9 đợt 71, luồng Y4: lấy số fps birefnet (đóng nợ đợt 70 §4 mục 4)

Ngày: 09/11/2026 (lượt cron 09:35 +07). Đóng nợ đợt 70 §4 mục 4
("Birefnet fps vẫn chưa có số"). KHÔNG push, KHÔNG release/tag,
KHÔNG binary, KHÔNG sửa production, KHÔNG chạm venv TTS. Mọi số dưới
đây là số đo thật. RSS tính theo GiB (1024-based, khớp số probe in ra).

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Birefnet-general fps | **VẪN KHÔNG CÓ SỐ** — 0/2 lần predict hoàn thành đợt này (cộng dồn 0/5 với X5: 0/3) |
| Birefnet-general-lite fps | **VẪN KHÔNG CÓ SỐ** — 0/2 lần predict hoàn thành (1 lần arena mặc định + 1 lần arena OFF), model lite mới tải về đợt này |
| Chết như thế nào | Cả 4 lần đều **exit 137 (SIGKILL), không exception**, giữa predict #1 |
| Ngưỡng đo được (§3) | Lite predict đỉnh **> 4,90 GiB và vẫn đang tăng** lúc chết; general plateau **4,37–4,41 GiB** rồi chết khi RSS đã phẳng |
| Kết luận ngưỡng | **Không đo được trên VM 8 GB này** — cần RAM trống ≥ ~6 GiB duy trì suốt predict (xem §3.3); khuyến nghị máy đo riêng RAM tổng ≥ 12 GB, 16 GB cho thoải mái |
| Phát hiện mới (§1) | Predict **luôn chạy ở 1024×1024** bất kể ảnh đầu vào; input shape ONNX **cố định [1,3,1024,1024]** ở cả 2 model → **không có "ảnh nhỏ hơn còn sống"**; tiền đề "ảnh nhỏ hơn" của X5 là sai |
| Arena OFF (§2.4) | Lite đỉnh 4,90 → 4,49 GiB (giảm ~8%) nhưng **vẫn chết** — không phải lối thoát |
| Init general | 13,0 s (cache ấm) / 62,5 s (loadavg 9) — init biến thiên theo cache + tải máy, không theo version |

## 1. Phát hiện mới: predict luôn chạy 1024×1024 — kích thước ảnh đầu vào vô nghĩa

Đọc code `rembg` 2.0.87 trong venv (`sessions/base.py`,
`sessions/birefnet_general.py`):

- `BiRefNetSessionGeneral.predict()` gọi `self.normalize(img, ...,
  (1024, 1024))`, và `normalize()` làm `img.resize((1024, 1024))`
  trước khi đưa vào model. Ảnh đầu vào 480×480 hay 640×640 đều bị
  resize lên 1024×1024 rồi mới inference — **đổi kích thước ảnh đầu
  vào không giảm một byte bộ nhớ predict nào**.
- Kiểm chứng trực tiếp bằng ONNX: input shape của cả 2 model đều
  **cố định `[1, 3, 1024, 1024]`** (xem §2.5):
  - lite: `input_image [1, 3, 1024, 1024] tensor(float)` — thử chạy
    raw ở 768×768 bị từ chối ngay (exit 2, không inference).
  - general: `input_image [1, 3, 1024, 1024]`, output
    `[1, 1, 1024, 1024]` — giống hệt.
- Hệ quả: tiền đề "ảnh nhỏ hơn" trong hướng (a) của nhiệm vụ và
  trong X5 §1.1 là **sai** — X5 đo 480×480 nhưng predict vẫn chạy
  1024, nên 0/3 của X5 không phải do ảnh 480 "chưa đủ nhỏ". Và yêu
  cầu "kích thước ảnh tối đa còn sống" trong hướng (c) **không có
  đáp án**: không tồn tại kích thước ảnh nào làm predict sống được,
  vì input tensor luôn là 1024×1024. Ngưỡng phải đo bằng RAM (xem §3),
  không phải bằng pixel.

## 2. Bốn lần thử — số đo thật

### 2.0 Cách đo chung

- Venv: `server/bgremove/.venv` (Python 3.12.3) — xác nhận lại:
  rembg **2.0.87**, onnxruntime **1.23.2**, Pillow **13.0.0**,
  numpy **2.5.4** (khớp X5).
- Ảnh: `~/workspace/scratch-bgremove/person.jpg` (JPEG thật 640×640,
  43.409 byte — cùng ảnh W1/X5), đưa nguyên vào `session.predict`,
  không resize trước (vì resize trước là vô nghĩa, xem §1).
- Probe: script scratch `~/workspace/.tmp-r71y4/probe_y4.py`
  (không nằm trong repo, không stage): `new_session(...)` rồi
  predict, in wall time + `ru_maxrss` từng bước. Kèm watcher
  `watch_rss.sh` sample `/proc/<pid>/status` (VmRSS, VmHWM) +
  `free` hệ thống **mỗi 1 s** vào CSV — đây là dữ liệu ngưỡng ở §3.
- VM: 2 vCPU / 7.934 MB RAM / swap 1.023 MB; vừa reboot lúc 02:27 UTC
  (up 11 phút lúc bắt đầu đợt). `dmesg` không có quyền đọc
  (`Operation not permitted`, như X5) nên không thấy dòng oom-killer;
  file cgroup cũng không đọc được từ trong sandbox. Cơ chế giết chỉ
  suy ra từ dấu vết (xem §3.2), không khẳng định tuyệt đối.
- Các luồng đợt 71 khác chạy song song suốt đợt (Chrome, ffmpeg,
  tsc, node load) — điều kiện máy từng lần ghi rõ dưới đây.

### 2.1 (a1) birefnet-general, lúc yên lúc bắt đầu — chết

| | |
|---|---|
| Thời gian (+07) | 09:42–09:44 |
| Máy lúc bắt đầu | loadavg 2,01; RAM trống (avail) 2.450 MB; không process nặng nào đang chạy |
| Init | **13,0 s** (nhanh nhất từng đo — page cache ấm), RSS sau init **2,00 GiB** |
| Predict #1 | RSS leo lên **đỉnh 4,41 GiB** (4.624.064 KB), plateau ~50 s, rồi **chết exit 137 sau ~85–90 s trong predict** |
| Hệ thống lúc chết | free ~580 MB, avail ~980 MB |
| Nhiễu | Giữa predict, luồng khác bật Chrome renderer (RSS 1,25 GiB) + 2 ffmpeg 7680×4320 (~0,5–0,8 GiB mỗi cái); avail rơi 1.800 → 980 MB trong lúc plateau — lần thử này **bị nhiễu bởi sibling** |

### 2.2 (a2) birefnet-general, thử lại — chết

| | |
|---|---|
| Thời gian (+07) | 09:53–09:58 |
| Máy lúc bắt đầu | loadavg 9,05; avail 4.294 MB; tsc + node + ffmpeg nhẹ đang chạy (không process nào > ~400 MB) |
| Init | **62,5 s** (chậm do CPU bị tranh), RSS sau init **1,97 GiB** |
| Predict #1 | RSS leo lên **đỉnh 4,37 GiB** (4.586.176 KB), plateau **~155 s**, rồi **chết exit 137 sau ~217 s trong predict** |
| Hệ thống lúc chết | free ~350 MB, avail ~1.050 MB |
| Nhiễu | Không có spike RAM rõ rệt của sibling ngay lúc chết; avail lượn ~1.100–1.250 MB suốt plateau. Lần này RSS **đã phẳng 155 s rồi mới chết** — không khớp câu chuyện "predict cấp phát mãi đến khi hết RAM" (xem §3.2) |

### 2.3 (b) birefnet-general-lite, arena mặc định — chết

- Model lite **mới tải về đợt này** (xem §4): file
  `~/.u2net/models/birefnet-general-lite/birefnet-general-lite.onnx`,
  224.005.088 byte, md5 `4fab47adc4ff364be1713e97b7e66334` — khớp
  đúng md5 pin trong source rembg 2.0.87.
- Thời gian (+07): 10:01–10:04. Máy lúc bắt đầu: loadavg 9,26;
  avail 5.249 MB; ffmpeg 1920×1080 (~525 MB) đang chạy.
- Init: **22,4 s**, RSS sau init **0,64 GiB** (nhẹ hơn general
  ~3×, đúng kỳ vọng Swin-Tiny).
- Predict #1: RSS **leo đơn điệu, không plateau**: 1,60 GiB (t=60 s)
  → 2,22 GiB (t=100 s) → 4,18 GiB (t=120 s) →
  **đỉnh 4,90 GiB (5.142.228 KB) và VẪN ĐANG TĂNG** (~0,3–0,7 GiB/s
  trong những giây cuối) thì **chết exit 137 sau ~106 s trong
  predict**.
- Hệ thống lúc chết: free **~130 MB**, avail **~250 MB**, swap đã
  dùng 431/1.023 MB — đây là **hết RAM hệ thống thật**, không còn
  nghi ngờ: chính process này ăn hết RAM (5,14 GiB và đang tăng)
  trong khi máy chỉ còn ~130 MB free.

### 2.4 (c) birefnet-general-lite, CPU arena OFF — chết (nhẹ hơn nhưng vẫn chết)

- Biến thể probe `probe_y4_arena.py`: `ort.SessionOptions()` với
  `enable_cpu_mem_arena = False`, còn lại y hệt (b). Mục đích: kiểm
  tra arena có phải thủ phạm làm RSS phồng không. Chỉ đổi option
  trong probe — **không sửa production**.
- Thời gian (+07): ~10:05–10:08. Init: **23,8 s**, RSS sau init
  **0,62 GiB**.
- Predict #1: RSS hình **răng cưa** (có lúc tụt 1,91 → 1,27 GiB —
  malloc/free trả RAM thật, khác hẳn kiểu leo đơn điệu của arena
  mặc định), nhưng cuối predict vẫn spike mạnh 3,78 → 4,49 GiB
  trong ~2 s cuối; **đỉnh 4,49 GiB** (4.485.448 KB; VmHWM 4,32 GiB),
  **chết exit 137 sau ~140 s trong predict**.
- Hệ thống lúc chết: free ~150 MB, avail ~460 MB.
- Kết luận: arena OFF giảm đỉnh 4,90 → 4,49 GiB (~8%) nhưng
  **không cứu được** — spike cuối của decoder (upsample về
  1024×1024) vẫn vượt RAM còn lại. Không phải lối thoát.

### 2.5 (d) Chẩn đoán raw ONNX: input shape cố định — đóng câu hỏi "ảnh nhỏ hơn"

- Chạy `ort.InferenceSession` trực tiếp trên file lite, in input
  shape rồi mới predict: shape `[1, 3, 1024, 1024]` **cố định**
  (không phải dynamic). Thử size 768 bị từ chối ngay, exit 2,
  không inference — xem §1.
- General kiểm tra tương tự: input `[1, 3, 1024, 1024]`, output
  `[1, 1, 1024, 1024]`.
- **Không tồn tại kích thước input nào khác 1024** cho cả 2 model
  trên stack này. Muốn giảm bộ nhớ predict thì phải đổi model,
  đổi runtime option, hoặc đổi máy — không thể đổi ảnh.

## 3. Ngưỡng OOM — đo chính xác (hướng (c))

### 3.1 RSS theo thời gian (4 trace CSV, sample 1 s)

| Lần | Model / option | RSS sau init | Diễn biến predict | Đỉnh RSS | Chết sau |
|---|---|---|---|---|---|
| a1 | general / mặc định | 2,00 GiB | leo → plateau ~50 s | **4,41 GiB** | ~85–90 s trong predict |
| a2 | general / mặc định | 1,97 GiB | leo → plateau ~155 s | **4,37 GiB** | ~217 s trong predict |
| b | lite / arena ON | 0,64 GiB | leo đơn điệu, không plateau | **4,90 GiB, vẫn đang tăng** | ~106 s trong predict |
| c | lite / arena OFF | 0,62 GiB | răng cưa, spike cuối | **4,49 GiB** | ~140 s trong predict |

Trace đầy đủ (scratch, không stage):
`~/workspace/.tmp-r71y4/rss_{a1_general,a2_general,b_lite,c_lite_noarena}.csv`
+ log probe `probe_{a1_general,a2_general,b_lite,c_lite_noarena}.log`.

### 3.2 Vì sao chết — phân tích trung thực (2 cơ chế, không khẳng định tuyệt đối)

- **Lite (b, c): hết RAM hệ thống thật.** Process tự leo tới
  4,49–4,90 GiB trong khi free hệ thống rơi xuống ~130–150 MB.
  Không còn nghi ngờ: OOM-killer giết process to nhất (chính probe).
- **General (a1, a2): chết khi RSS đã phẳng.** General plateau ở
  4,37–4,41 GiB hàng chục đến >150 s rồi mới chết, trong khi hệ
  thống vẫn còn avail ~1.000 MB và swap còn trống. OOM hệ thống
  thuần túy khó giải thích kiểu chết này. Có 2 ứng viên:
  1. **Áp lực từ sibling:** a1 có bằng chứng rõ (Chrome 1,25 GiB +
     ffmpeg bật giữa predict, avail rơi 1.800 → 980 MB); a2 không
     thấy spike rõ ngay lúc chết nhưng máy luôn có nhiều process
     khác chạy.
  2. **Trần cell sandbox 6,0 GiB:** mọi lệnh exec đều báo
     `sharedMemoryLimitBytes: 6442450944` (= 6,0 GiB đúng). Nếu trần
     này tính cả RSS probe (4,4 GiB) + page cache file model 973 MB
     + daemon/runtime + process sibling thì tổng chạm trần đúng lúc
     probe đang plateau. **Chỉ là giả thuyết** — không đọc được
     cgroup (`/sys/fs/cgroup/memory.*` không tồn tại trong sandbox)
     hay `dmesg` để kiểm chứng.
- Điều chắc chắn, không phụ thuộc cơ chế nào: **trên VM này, với
  stack này, không lần predict birefnet nào hoàn thành được trong
  4 lần thử đợt này (cộng dồn general 0/5, lite 0/2)**. J8 từng có
  đúng 1 lần predict general hoàn thành (1024×1024, timing từng
  frame bị mất) — nên "không bao giờ chạy được" là sai; đúng là
  **bấp bênh ở ngưỡng RAM, thường thì chết**.

### 3.3 Cần RAM bao nhiêu — kết luận

- Process predict cần **đỉnh RSS > 4,90 GiB (lite, vẫn đang tăng
  lúc chết — đỉnh thật chưa biết, plausibly 5,5–6,5 GiB)** và
  **≥ 4,4 GiB (general, plateau)**. Lấy mức an toàn cho cả 2:
  **RAM trống ≥ ~6 GiB phải duy trì suốt predict** (init 13–63 s +
  predict 2–4 phút), chưa tính OS/runtime/sibling.
- Trên VM 8 GB này: RAM trống thực tế tối đa chỉ ~5–6 GiB khi máy
  yên, và vòng lặp chạy song song luôn có sibling chiếm thêm 1–2 GiB
  → **không đo được**. Muốn đo ở đây thì cần một cửa sổ máy thật yên
  (không luồng đo nặng khác — điều vòng lặp 8–10 luồng song song
  không cho) + RAM trống ≥ ~6 GiB, hoặc đo trên máy khác.
- Máy đo riêng khuyến nghị: **RAM tổng ≥ 12 GB** (để có ≥ ~7 GiB
  trống sau OS/runtime), **16 GB cho thoải mái**. Đây là khuyến nghị
  từ lower-bound đo được (4,90 GiB, vẫn đang tăng) + biên an toàn,
  không phải số đo trực tiếp trên máy 12/16 GB — chưa có máy đó để
  đo, không claim hơn.

## 4. Model lite — nguồn, version (mới trong đợt này)

- Lấy qua đúng code path pin của rembg 2.0.87
  (`BiRefNetSessionGeneralLite.download_models()`, pooch verify md5
  tự động) — không tải tay từ URL lạ.
- URL: `https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx`
  (release `v0.0.0` của danielgatis/rembg, cùng release với model
  general).
- File: `~/.u2net/models/birefnet-general-lite/birefnet-general-lite.onnx`,
  **224.005.088 byte, md5 `4fab47adc4ff364be1713e97b7e66334`** — khớp
  md5 pin trong source rembg 2.0.87. Tải 19 s (~20 MB/s).
- Model general giữ nguyên, không tải lại: 972.666.916 byte, md5
  `7a35a0141cbbc80de11d9c9a28f52697` (khớp X5/U8).
- File model nằm ở `~/.u2net` (cache ngoài repo) — **không stage,
  không đưa vào batch**.

## 5. Ghi chú khác

- **Init general biến thiên mạnh:** 13,0 s (a1, cache ấm, máy yên)
  vs 62,5 s (a2, loadavg 9) vs X5 48,7–104,1 s. Init phụ thuộc
  page-cache + tải CPU, không phải version model — đừng so init
  giữa các lần đo khác điều kiện máy.
- **Không có số alpha / mask nào:** không lần predict nào trả về
  mask nên không có thống kê alpha, không có s/frame, không có fps
  — và không được suy ra từ thời gian "chết giữa chừng".
- **Fallback u2net không chạy lại trong luồng này** (ngoài phạm vi:
  chỉ đo birefnet). X5 đã verify fallback 7/7 + smooth 4/4 sau bump;
  kết quả đó vẫn đứng, không claim lại.
- **Không sửa production:** không đổi `bgremove.py`, requirements,
  hay bất kỳ file code nào. Chỉ thêm doc LIMITS này. Probe + trace
  CSV + model lite đều nằm ngoài repo (scratch / `~/.u2net`).
- Ghi file qua exec hoạt động bình thường cả đợt (lỗi EPERM đợt 68
  không tái diễn).

## 6. File đổi/thêm (batch phase9-round71-y4-birefnet-fps, KHÔNG push)

- `docs/PHASE9_ROUND71_Y4_BIREFNET_FPS_LIMITS.md` — doc này (mới).
- KHÔNG đổi: code, requirements, venv, script nào.
- Scratch không stage: `~/workspace/.tmp-r71y4/probe_y4.py`,
  `probe_y4_arena.py`, `probe_y4_raw.py`, `watch_rss.sh`,
  4 CSV RSS + 5 log probe.
- Stage file: `paths-loop/phase9-round71-y4-birefnet-fps.txt`
  (NUL-delimited, 1 entry, verify read-back 1/1 tồn tại và là text).

## 7. Nợ mở cho đợt sau

1. **Birefnet fps vẫn chưa có số** — nhưng giờ đã biết chính xác vì
   sao và cần gì (§3.3): đo trên máy RAM tổng ≥ 12 GB (khuyến nghị
   16 GB), hoặc chờ một cửa sổ máy thật yên + RAM trống ≥ ~6 GiB
   trên VM này (khó khi vòng lặp chạy 8–10 luồng song song — cân
   nhắc đo birefnet ở lượt riêng, không chung với luồng nặng khác).
   Khi nào 1 lần predict đơn hoàn thành thì chạy lại full
   `test_bgremove.py --session birefnet-general` để có fps video thật.
2. **Đừng đo birefnet bằng cách đổi kích thước ảnh** — đã chứng minh
   vô nghĩa (§1). Cũng đừng suy fps từ thời gian chết giữa chừng.
3. Giả thuyết trần cell 6,0 GiB (§3.2 mục 2) chưa kiểm chứng được
   từ trong sandbox — đợt sau có quyền đọc cgroup/dmesg thì kiểm tra
   lại; nếu đúng thì mọi đo RAM-heavy trong sandbox đều bị trần này
   chi phối, không riêng birefnet.
4. TTS 39 CVE + các nợ khác của đợt 70 §4 vẫn mở, không thuộc luồng này.
