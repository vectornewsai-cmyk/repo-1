# Phase 9 đợt 83, luồng K9 — GPU thật / Safari thật (đo được gì thì đo)

- **Luồng:** K9, đợt 83 (đóng nợ đợt 82 §4.10).
- **Ngày:** 11/11/2026, lượt cron 00:35 +07 (đo 17:40–18:11 +07).
  Repo local `~/workspace/repo-1`. **CHỈ stage, KHÔNG push.**
- **Máy đo:** VM này — AMD EPYC 9D25, **4 vCPU**, 7,7 GiB RAM,
  Ubuntu 24.04.5 LTS, **kernel 7.0.0-44-generic** (E8 đo trên
  7.0.0-43 — xem §2.1: image VM đã đổi từ sau đợt 79).

## 0. Kết luận ngắn (đọc trước)

1. **Không có GPU thật — xác nhận lần 4.** Không thiết bị VGA
   nào trên PCI (chỉ virtio + host bridge Intel), không `/dev/dri`,
   không `nvidia-smi`/`vainfo`/`glxinfo`/`vulkaninfo`. Cả 4 encoder
   phần cứng FFmpeg (`h264_vaapi`, `hevc_vaapi`, `h264_nvenc`,
   `h264_qsv`) đều **0 frame, lỗi `-22 Invalid argument`**.
   WebGL Chromium = SwiftShader (ANGLE Vulkan SwiftShader
   Subzero), `MAX_TEXTURE_SIZE 8192`, WebGL2 với
   `failIfMajorPerformanceCaveat=true` → **không tạo được context**
   (software). WebGPU có nhưng adapter null.
2. **WebKit thật KHÔNG KHỞI ĐỘNG ĐƯỢC trên VM hiện tại — hồi quy
   môi trường so với E8/G8.** Cả hai bản MiniBrowser (GTK headed
   và WPE headless) đều chết lúc khởi động vì thiếu thư viện hệ
   thống: **GTK thiếu 22 lib, WPE thiếu 18 lib** (GStreamer,
   libsoup, libgtk-4, libevent, libjxl, libavif…). Thư mục plugin
   GStreamer (`/usr/lib/x86_64-linux-gnu/gstreamer-1.0/`, 269 plugin
   ở E8) đã biến mất; `dpkg` không còn gói gstreamer/webkitgtk nào.
   Đã thử khôi phục bằng script `install-dependencies.sh` chính
   thức của Playwright — `apt-get update` chạy **>9 phút chưa xong**
   (mirror chậm) nên đã dừng (xem §2.3). **Hệ quả: đợt này KHÔNG
   CÓ số WebKit-vs-Chromium nào mới — và không bịa số nào.**
   Mọi số WebKit của E8/G8 vẫn đứng làm hồ sơ cũ, nhưng **không
   chạy lại được trên image này** cho đến khi khôi phục deps.
3. **Chromium đo lại được, 3 lần chạy, 0 lỗi trang.** Số mới:
   rAF trần dưới Xvfb ≈ **31–36 fps** (không phải 60 — mọi số FPS
   đo dưới Xvfb phải đọc kèm trần này); video h264 phát được
   ~15–19 frame trình bày/s trên nguồn 30 fps, **rớt 34–41%**,
   ổn định qua cả 3 lần chạy; drawImage upscale canvas 1280×720
   → 1991×815: **bản thân lệnh drawImage chỉ ~0–0,1 ms, nhưng mỗi
   tick rAF gọi nó bị kéo dài 70–280 ms** (chi phí raster/upload
   bất đồng bộ phía SwiftShader, không phải lệnh vẽ) — và số này
   dao động mạnh theo contention tức thời, không theo loadavg 1
   phút (xem §3.3).
4. **Kernel drawImage của Chromium tái lập đúng từng số J2:**
   upscale "high" = **Mitchell (1/3, 1/3)** — MAD (làm tròn) **0,003**
   ở s=1,1328 (khớp 99,7% pixel), **0** ở s=2,0; "medium" = **tam
   giác, MAD 0** ở cả hai thang. Pipeline phân tích của K9 đã được
   chứng minh đúng bằng đối chứng này. **Kernel của WebKit vẫn
   chưa đo được** (không khởi động được) — không suy ra từ Chromium.
5. **Safari thật: vẫn không có.** Không macOS, không binary Safari/
   Epiphany, không máy Mac remote từ VM này. Checklist đo Safari
   đầy đủ ở §5 — đợt sau có máy thì chạy ngay.
6. **Không sửa production.** Không có chênh lệch WebKit/Chromium
   nào đo được để sửa (WebKit không chạy); chênh lệch Chromium
   nội bộ (§3.3) là đặc tính SwiftShader/Xvfb, không phải bug app.

## 1. GPU thật — không có (lần xác nhận thứ 4)

### 1.1 Thiết bị (11/11/2026)

| Kiểm tra | Kết quả |
|---|---|
| PCI (`/sys/bus/pci/devices/*/class`) | 9 device: host bridge Intel 0x060000 + 8 virtio (0x1af4: storage/net/misc). **Không có device class VGA 0x03xxxx nào** |
| `/dev/dri`, `/dev/nvidia*` | Không tồn tại |
| `/sys/class/drm/` | Chỉ có `version` — không `card0`/`renderD128` |
| `lspci` / `nvidia-smi` / `vainfo` / `glxinfo` / `vulkaninfo` / `eglinfo` / `clinfo` | Không có lệnh nào |
| CPU / RAM | AMD EPYC 9D25, `nproc` = 4; 7,7 GiB (lúc đo 6,3 GiB đã dùng) |
| FFmpeg | 8.1.2 (build có hwaccel `vdpau cuda vaapi qsv drm opencl`) |
| `ldd` Chromium full build / Firefox | **0 lib thiếu** — image vẫn chạy được Chromium/Firefox bình thường |

### 1.2 Encode phần cứng thử lại — tất cả 0 frame

Nguồn: `testsrc2` 1920×1080 2 s → `src1080.mp4` (libx264
veryfast/CRF23, 1.349.808 byte; `/tmp/k9/src1080.mp4`, không stage).

| Encoder thử | Kết quả |
|---|---|
| `h264_vaapi` | `Terminating thread with return code -22 (Invalid argument)`; `Nothing was written` — 0 frame |
| `hevc_vaapi` | Như trên — 0 frame |
| `h264_nvenc` | `-22`, 0 frame |
| `h264_qsv` | `-22`, 0 frame |

Khớp E8 §1.2 (FFmpeg 8.1.2, 4/4 encoder 0 frame). GPU encode
**vẫn chưa từng chạy thành công trên phần cứng thật** (RESULTS.md
§8.2 giữ nguyên — lần xác nhận thứ 4: R3, Phase 8, E8, K9).

### 1.3 WebGL Chromium — SwiftShader, đo lại 3 lần (giống hệt nhau)

| Mục | Kết quả (cả 3 lần chạy) |
|---|---|
| WebGL2 `UNMASKED_RENDERER` | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` |
| WebGL1 renderer | Giống hệt WebGL2 (cùng SwiftShader) |
| `MAX_TEXTURE_SIZE` / `MAX_RENDERBUFFER_SIZE` / `MAX_VIEWPORT_DIMS` | **8192 / 8192 / [8192, 8192]** (cả WebGL1 + WebGL2) |
| `MAX_TEXTURE_IMAGE_UNITS` | 32 |
| WebGL2 `failIfMajorPerformanceCaveat=true` ("strict") | **context: false** — Chrome từ chối vì software (khớp G8 `hwContextAllowed: false`) |
| WebGPU (`navigator.gpu`) | `present: true` (SwiftShader; G8 đo adapter null cả 3 powerPreference) |
| Feature-check | `MediaRecorder: true`, `ctx.filter: true`, `OffscreenCanvas: true`, `createImageBitmap: true`, `video.captureStream: true`, `canvas.captureStream: true`, `requestVideoFrameCallback: true` |

**Đọc đúng:** mọi WebGL/WebGPU trên VM này đều là software.
`MAX_TEXTURE_SIZE 8192` là giới hạn của SwiftShader, không phải
của GPU thật — đừng dùng làm spec máy người dùng. Mọi kết luận
render/preview vẫn chỉ đúng trên CPU/SwiftShader.

## 2. WebKit thật — KHÔNG KHỞI ĐỘNG ĐƯỢC (hồi quy môi trường)

### 2.1 Bằng chứng: image VM đã đổi từ sau đợt 79

| Dấu hiệu | E8 (09/11) / G8 (10/11) | K9 (11/11) |
|---|---|---|
| Kernel | 7.0.0-43-generic | **7.0.0-44-generic** |
| `/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` | 269 plugin (`libgstaom`, `libgstvpx`, `libgstlibav`, `libgstopenh264`, `libgstx264/x265`) | **không tồn tại** |
| `dpkg` gói gstreamer/webkitgtk | có (WebKit chạy được) | **không có gói nào** |
| Playwright cache `webkit-2388` | chạy được (`DEPENDENCIES_VALIDATED`) | còn nguyên trên đĩa nhưng **không khởi động được** |
| VM uptime lúc đo | — | 13–44 phút (đã reboot/replace image) |

Home dir (`~/.cache/ms-playwright/`) còn nguyên, nhưng thư viện
hệ thống đã mất — image mới không cài Playwright system deps.
Chromium/Firefox không bị ảnh hưởng (0 lib thiếu, §1.1).

### 2.2 Lỗi khởi động (ghi đúng từng chữ)

Cả hai đường đều thất bại giống nhau trong script K9
(`benchmarks/render/gpu_safari_probe_83k9.mjs`, 3 lần chạy):

- **GTK headed** (`webkit.launch({headless:false})`):
  `MiniBrowser: error while loading shared libraries:
  libgstreamer-1.0.so.0: cannot open shared object file` →
  Playwright: `browserType.launch: Target page, context or
  browser has been closed`.
- **WPE headless** (`webkit.launch({headless:true})`): cùng lỗi
  `Target page, context or browser has been closed`.

`ldd` đầy đủ (11/11/2026):

- **GTK MiniBrowser: 22 lib thiếu** — `libavif.so.16`,
  `libbacktrace.so.0`, `libenchant-2.so.2`,
  `libevent-2.1.so.7`, `libgraphene-1.0.so.0`,
  `libgstallocators-1.0.so.0`, `libgstapp-1.0.so.0`,
  `libgstaudio-1.0.so.0`, `libgstbase-1.0.so.0`,
  `libgstcodecparsers-1.0.so.0`, `libgstfft-1.0.so.0`,
  `libgstgl-1.0.so.0`, `libgstpbutils-1.0.so.0`,
  `libgstreamer-1.0.so.0`, `libgsttag-1.0.so.0`,
  `libgstvideo-1.0.so.0`, `libgtk-4.so.1`,
  `libjavascriptcoregtk-6.0.so.1`, `libjxl.so.0.8`,
  `libmanette-0.2.so.0`, `libsoup-3.0.so.0`, `libwebkitgtk-6.0.so.4`.
  (Lưu ý: `minibrowser-gtk/lib/` CÓ chứa `libwebkitgtk-6.0.so.4`
  + `libjavascriptcoregtk-6.0.so.1` bundle, nhưng binary MiniBrowser
  không có RPATH/RUNPATH nên loader không tìm thấy — nó dựa vào
  lib hệ thống như E8 đã có.)
- **WPE MiniBrowser: 18 lib thiếu** — như trên trừ `libgtk-4`,
  `libgraphene`, `libjavascriptcoregtk`, `libwebkitgtk`,
  `libmanette`, cộng `libWPEWebKit-2.0.so.1`.

### 2.3 Đã thử khôi phục — dừng vì mirror quá chậm (ghi rõ, không giấu)

- Chạy script chính thức của Playwright:
  `sudo bash ~/.cache/ms-playwright/webkit-2388/minibrowser-gtk/install-dependencies.sh --autoinstall`
  (cài các gói OS mã nguồn mở, không phải dịch vụ trả phí,
  không credential).
- `apt-get update` chạy **>9 phút vẫn chưa xong** (mirror
  `mirror.cogentco.com` + `azure.archive.ubuntu.com` trả
  Translation-en rất chậm, nhiều dòng `Ign`), load VM vọt lên
  ~28 trong lúc update — đã **kill tiến trình** (pid 7928,
  xác nhận không còn tiến trình apt nào) để khỏi làm nhiễm các
  phép đo và các luồng đợt 83 đang chạy song song.
- **Không thử lại trong đợt này.** Hướng khôi phục cho đợt sau
  (§7.1): chạy lại install-deps khi VM rảnh + mirror nhanh hơn,
  hoặc đổi mirror apt về `archive.ubuntu.com`, hoặc khôi phục
  image cũ có sẵn deps. Ước tính: ~130 gói, vài trăm MB.

### 2.4 Hệ quả trung thực

- **Không có số WebKit mới trong đợt này.** Không có số
  WebGL-renderer, rAF, draw-loop, video, kernel của WebKit.
- Số WebKit của E8 (codec 5/5, MediaRecorder vắng, `ctx.filter`
  vắng) và G8 (rAF ~5 fps lúc tải 28, shader median 107 ms,
  "Apple GPU" là nhãn giả) **vẫn đứng làm hồ sơ cũ** — nhưng
  không chạy lại được để xác nhận trên image này.
- **Không được trích số E8/G8 như số "hiện tại"** mà không kèm
  chú thích "đo trên image VM cũ, WebKit hiện không khởi động
  được — xem K9 §2".
- Không sửa production theo hướng WebKit (không có số mới).

## 3. Chromium đo lại — 3 lần chạy (script K9)

Công cụ: `benchmarks/render/gpu_safari_probe_83k9.mjs`
(Playwright-core 1.65.0, Chromium 1254 full build headed qua
Xvfb, trang probe trên `http://127.0.0.1:8899`). Clip test tự
encode bằng FFmpeg vào `/tmp/k9/clips` (320×180, 2 s, 5 codec;
**lưu ý: AV1 bị SVT-AV1 pad chiều cao lên 320×184** — chỉ dùng
cho phát thử, không dùng cho đo pixel). JSON kết quả:
`benchmarks/results/webkit-safari-probe-83k9.json` — **file này
chứa lần chạy 3 (mới nhất)**; số lần 1–2 ghi trong bảng dưới
(trích từ log luồng `hidden_files/round83-k9.md`).

| Lần | Tải 1-phút trước → sau | rAF trống (2×3 s) | Video presented / dropped | Kernel |
|---|---|---|---|---|
| 1 | 2,16 → 1,31 | 31,15 / 31,18 fps | 89 / 72 rớt (40,7%) | Mitchell 0,003 |
| 2 | 11,06 → 6,89 | 36,46 / 33,49 fps | 104 / 64 rớt (35,6%) | Mitchell 0,003 |
| 3 | 1,91 → 2,71 | 32,98 / 31,06 fps | 112 / 61 rớt (33,9%) | Mitchell 0,003 |

0 lỗi trang cả 3 lần. `document.visibilityState = visible`,
`hasFocus = true` ở mọi arm (không phải throttle do che khuất).

### 3.1 Trần rAF dưới Xvfb ≈ 31–36 fps (không phải 60)

- rAF trống: **31,1–36,5 fps** qua 6 lần đo (3 lần chạy × 2);
  gap median **16,7 ms** nhưng p95 **66,7 ms**, mean ~28–33 ms —
  tức vsync 60 Hz nhưng trung bình cứ ~2 frame mới tick 1 lần.
- **Hệ quả cho mọi số FPS đo dưới Xvfb (cả các đợt trước):**
  trần rAF ≈ 31–36 fps. Số "38 draws/s" của J9 và "21–24 fps"
  của G8 đều nằm dưới trần này — chúng là số của Xvfb, không
  phải số của màn hình thật 60 Hz. Đừng so số Xvfb với 60 fps
  như thể thiếu 24 fps do app.

### 3.2 Video phát trên Chromium — ổn định qua 3 lần chạy

Clip `h264.mp4` (320×180, 30 fps, 2 s, loop), 6 s phát:

| Lần | Presented (rVFC) | totalVideoFrames | Dropped | `currentTime` |
|---|---|---|---|---|
| 1 | 89 (~15/s) | 177 | 72 (**40,7%**) | tiến ~1,0× realtime, loop quấn đúng (1,98 → 0,91) |
| 2 | 104 (~17/s) | 180 | 64 (**35,6%**) | như trên |
| 3 | 112 (~19/s) | 180 | 61 (**33,9%**) | như trên |

- G8 đo lúc tải 28: 86 presented, 53/151 rớt (35%) — **khớp**:
  tỉ lệ rớt ~34–41% gần như không phụ thuộc tải 1-phút (1,3–28).
  Đây là baseline ổn định cho phát video Chromium/SwiftShader
  trên VM này: **~1/3 frame bị rớt, không phải do tải cao nhất
  thời mà do decode + trình bày bằng software**.
- `endedCount = 0` (loop quấn bằng `loop=true`, không qua sự kiện
  `ended`); workaround H5 không cần kích hoạt (video không kẹt).

### 3.3 Thí nghiệm drawImage: lệnh vẽ ~0 ms, tick bị kéo dài 70–280 ms

Câu hỏi: J9 đo upscale chính 720p→1991×815 tốn p50 7,9–18,6 ms
(video→canvas, có decode-wait). K9 tách riêng toán tử
canvas→canvas (nguồn là canvas pattern, không decode): 4 arm
× 4 s, cùng trang, liên tiếp nhau (thí nghiệm C2 trong script).

| Arm (lần 2 / lần 3) | FPS | Gap rAF median | Gap p95 | drawImage/call median |
|---|---|---|---|---|
| rAF trống | 35,72 / 33,61 | 16,7 / 16,7 ms | 66,7 / 66,7 ms | — |
| drawImage, canvas **tách DOM** | 14,64 / 6,44 | 83,3 / 166,6 ms | 116,7 / 266,7 ms | **0 / 0,1 ms** |
| drawImage, canvas **gắn DOM** | 7,79 / 3,67 | 116,7 / 283,3 ms | 200,1 / 800 ms | **0 / 0,1 ms** |
| Canvas gắn DOM, **không vẽ** | 35,84 / 31,89 | 16,7 / 16,7 ms | 66,7 / 100 ms | — |

- **Lệnh `drawImage` gần như miễn phí** (median 0–0,1 ms,
  p95 ≤0,2 ms, max 9,9 ms) — kể cả upscale 1280×720 →
  1991×815 với `imageSmoothingQuality="high"`.
- **Nhưng mỗi tick gọi drawImage tốn thêm 70–280 ms ở KHOẢNG
  GIỮA các callback rAF** (gap median 83–283 ms vs 16,7 ms
  lúc trống). Canvas gắn DOM đắt gấp ~1,8× so với tách DOM
  (7,79 vs 14,64; 3,67 vs 6,44) — phần composite/phần mềm
  raster lại canvas hiển thị. Canvas gắn DOM nhưng không vẽ
  thì **không tốn gì** (35,84 fps) — chi phí chỉ xuất hiện khi
  canvas bị "bẩn" mỗi tick.
- **Cơ chế (suy luận có bằng chứng, chưa chứng minh tới cùng):**
  sau mỗi lần drawImage, SwiftShader phải raster/upload lại
  bitmap canvas (async, ngoài lệnh vẽ) — chi phí này không nằm
  trong `performance.now()` quanh drawImage, nên mọi profile
  chỉ đo quanh lệnh vẽ đều **đánh giá thấp** chi phí thật.
  Đây là cùng một họ hiệu ứng với J9 §3.1 ("wall-time co 4–19×
  theo tải; phần lớn là thread chờ schedule") — nhưng K9 đo
  được nó **ngay cả khi drawImage = 0 ms**.
- **Số tuyệt đối dao động mạnh, không theo loadavg 1 phút:**
  lần 2 (tải ~11) nhanh hơn lần 3 (tải ~2) gấp ~2× ở cả hai
  arm vẽ (14,64 vs 6,44; 7,79 vs 3,67), trong khi rAF trống
  gần như không đổi (35,7 vs 33,6). Lần 1 (arm cũ 5 s, gắn DOM)
  chỉ được 1,61 fps — outlier, không dùng làm số chính.
  **Kết luận: đừng trích một con số FPS draw-loop làm "tốc độ
  VCut"** — số này do contention tức thời trên VM chia sẻ quyết
  định, không phải do code app. Tỉ lệ thì ổn định: vẽ tốn
  ~2,4–5,2× so với trống (tách DOM), gắn DOM tốn thêm ~1,8×.
- **Không mâu thuẫn J9:** J9 đo video→canvas (có decode-wait,
  7,9–18,6 ms/call) trong app thật; K9 đo canvas→canvas (không
  decode, ~0 ms/call) trên trang trần. Hai số đo hai khâu khác
  nhau của cùng pipeline — cộng lại mới là chi phí tick thật.

## 4. Kernel drawImage — Chromium tái lập J2 đúng từng số; WebKit chưa đo được

Phương pháp J2 (đợt 82): mẫu sqw4/step 512×512 qua `putImageData`
→ `drawImage` upscale → đọc hàng giữa → so với 6 kernel bằng
`chromeWeights1D` (quy ước S=(i+0,5)/s, h=1).

### 4.1 Chromium (3 lần chạy — giống hệt nhau cả 3 lần)

| Capture | Kết quả (MAD đã làm tròn — xem §4.2) |
|---|---|
| sqw4 s=1,1328 "high" | **Mitchell 0,003** (khớp 99,7% pixel); BC(0,25,0,375) 0,690; tri 1,721 |
| sqw4 s=2,0 "high" | **Mitchell 0** (khớp 100%); BC 0,620; tri 1,488 |
| sqw4 s=1,1328 + s=2,0 "medium" | **Tam giác 0** (khớp 100%); Mitchell 1,724 / 1,488 |
| step 64→192 s=1,1328 + s=2,0 "high" | **Mitchell 0** (khớp 100%); BC 0,003–0,005 |
| step "medium" | **Tam giác 0** (khớp 100%) |

Khớp đúng từng số với J2 §2.1–2.2 (Mitchell 0,003; BC 0,690;
tri 1,721 ở sqw4@s1132). **Pipeline đo + phân tích của K9 đã
được chứng minh đúng** bằng đối chứng này — nếu WebKit chạy
được, cùng script sẽ cho kernel WebKit với cùng độ tin cậy.
Đề xuất J2 (đổi production sang Mitchell) vẫn đứng, chưa áp dụng
trong luồng này (file chung, để parent gộp — xem đợt 82 §4.2).

### 4.2 Đính chính phương pháp (bẫy đã gặp trong đợt này)

- Lúc đầu K9 tính MAD trên **dự báo float chưa làm tròn** và được
  Mitchell MAD 0,199 ở sqw4@s1132 — tưởng là lệch với J2 (0,003).
  Kiểm tra lại: chỉ **2/580 pixel lệch đúng 1 mức** (i=190:
  106 vs 105,5; i=244: 150 vs 150,5); phần còn lại của 0,199 là
  phần lẻ .5 tích lũy trên hàng trăm pixel (dự báo float có
  nhiều giá trị x.5, Chrome làm tròn về số nguyên gần nhất).
  **MAD đúng phải tính trên dự báo đã làm tròn** (như J2) —
  khi đó Mitchell = 0,003, khớp J2 đúng từng số. Script K9 đã
  sửa `mad()` sang dạng làm tròn trước khi chạy lần 2–3.
- Bài học cho các đợt sau: **so sánh pixel nguyên với mô hình
  float thì phải làm tròn mô hình trước** — nếu không, mọi kernel
  đều bị cộng thêm ~0,2 MAD "ma" và kết luận fit bị lệch.

### 4.3 WebKit kernel — chưa đo được

Không có số. Không suy ra kernel WebKit từ kernel Chromium
(Skia vs CoreGraphics/WebKit có thể khác nhau — chính vì thế
mới cần đo). Đưa vào checklist đợt sau (§7.2).

## 5. Safari thật — không có; checklist đo cho đợt sau có máy Mac

### 5.1 Đã kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Binary `safari` / `epiphany` / `midori` / `konqueror` | Không có |
| macOS trên VM / máy Mac remote | Không có; VM là Linux, không có kênh nào tới máy Mac từ đây |
| Dịch vụ cloud có Safari (BrowserStack/Sauce Labs…) | **Không đăng ký** (quy định: không đăng ký dịch vụ trả phí, không nhập credential) — chỉ liệt kê lựa chọn ở §5.2 |

### 5.2 Checklist đo Safari (chạy ngay khi có máy Mac thật)

Máy cần: Mac thật (Intel hoặc Apple Silicon) + Safari thật
(ghi rõ phiên bản Safari + macOS). Không dùng WebKitGTK thay thế
— E8 đã chứng minh WebKitGTK khác Safari ở media stack
(GStreamer vs VideoToolbox), `MediaRecorder`, `ctx.filter`,
`webkitAudioContext`.

| # | Đo gì | Cách đo (script K9 tái dùng được phần lớn) | Kỳ vọng / câu hỏi mở |
|---|---|---|---|
| S-1 | Ma trận codec phát thật | 5 clip K9 (h264/vp9/vp8/av1/hevc 320×180) + `canPlayType` | VP9 cần Safari ≥ 14.1, AV1 cần ≥ 17 — kiểm theo từng phiên bản (A7 S5) |
| S-2 | `MediaRecorder` + tên file mẫu `.mp4` | `typeof MediaRecorder`, ghi thử canvas.captureStream | Safari 14.1+ có MediaRecorder — nhánh `.mp4` của B3 hiện chỉ mock, cần số thật (A7 S1) |
| S-3 | `roundRect` fallback | `typeof ctx.roundRect` trên Safari < 16 vs ≥ 16 | Helper `canvasRoundRect.ts` còn cần không (A7 S2) |
| S-4 | `backdrop-filter` / `100dvh` | `CSS.supports` | Fallback còn cần trên Safari < 15.4/18 không (A7 S3/S4) |
| S-5 | Trial-decode keyframe lớn | `VideoDecoder` Safari + clip keyframe lớn (E7) | Decode có khác Chromium không (E8 §7.1d) |
| S-6 | Kernel drawImage upscale | **Chạy nguyên script K9** (`gpu_safari_probe_83k9.mjs`) trên Safari qua Playwright `webkit` trên macOS hoặc `safaridriver` | Kernel Safari = Mitchell như Chrome? Hay khác? — quyết định hằng số production có dùng chung được không |
| S-7 | Preview FPS thật | Bench preview (J9) trên Safari + máy có GPU (Apple Silicon) | Số quyết định trải nghiệm thật; so với Chromium/SwiftShader trên VM |
| S-8 | `decodeAudioData` callback | WAV test, arity promise vs callback | Safari < 14.1 vẫn chưa đo (A7 S6) |
| S-9 | `video.captureStream` | `typeof` + ghi thử | WebKitGTK = undefined, Chromium = có — Safari thật là gì (A7 S7) |
| S-10 | WebGL renderer + `ctx.filter` | UNMASKED_RENDERER (kỳ vọng Apple GPU thật / Metal), `"filter" in ctx` | WebKitGTK báo "Apple GPU" giả + không có `ctx.filter` — Safari thật khác (G8) |

Lựa chọn khi không có máy Mac vật lý (chỉ liệt kê, **không đăng
ký trong đợt này**): BrowserStack / Sauce Labs / LambdaTest
(dùng thử miễn phí có giới hạn — cần user duyệt trước khi dùng),
hoặc mượn máy Mac của người quen chạy script K9 (không cần cài
đặt gì ngoài Playwright + Safari). Phương án rẻ nhất vẫn là
máy Mac thật + script K9 (script đã viết để chạy đa engine).

## 6. Bảng tổng kết — kết luận nào đứng, đổi, chưa đo (cập nhật E8 §6)

| Kết luận cũ | Trạng thái sau K9 |
|---|---|
| Không có GPU thật (E8 §1, lần 3) | **Đứng — lần xác nhận thứ 4**, thêm bằng chứng PCI (không device VGA) + 4 encoder 0 frame |
| GPU encode chưa từng chạy trên phần cứng thật (RESULTS.md §8.2) | **Đứng** |
| WebKit đo được (E8/G8) | **ĐỔI: hồi quy môi trường** — WebKit không khởi động được trên image VM mới (thiếu 22/18 lib); số E8/G8 chỉ còn là hồ sơ cũ |
| WebGL Chromium = SwiftShader, maxTexture 8192 (G8) | **Đứng, đo lại 3 lần giống hệt**; thêm: WebGL2-strict context false |
| Preview FPS Chromium (J9: FPS = f(tải VM)) | **Đứng + bổ sung:** rAF trần Xvfb ≈ 31–36 fps; drawImage call ~0 ms nhưng tick bị kéo dài 70–280 ms do raster SwiftShader; số tuyệt đối dao động ~2× giữa các lần chạy, không theo loadavg 1 phút |
| Video phát Chromium rớt ~35% (G8) | **Đứng, đo lại 3 lần: rớt 33,9–40,7%**, ổn định qua tải 1,3–28 |
| Kernel Chrome = Mitchell (J2) | **Đứng — tái lập đúng từng số** (MAD 0,003 / 0; medium = tri 0) |
| Kernel WebKit = ? | **Chưa đo được** (WebKit không chạy) |
| Safari thật (E8 §7) | **Vẫn chưa đo** — checklist §5 sẵn sàng |
| MediaRecorder vắng trên WebKitGTK (E8 W1) | **Không kiểm lại được** (WebKit không chạy); vẫn đứng làm hồ sơ cũ |
| `ctx.filter` vắng trên WebKitGTK (E8 W2) | Như trên |
| Render/caption/TTS/bgremove CPU-only (RESULTS.md) | **Đứng** — không có GPU để thay đổi |

## 7. Nợ mở cho đợt sau

1. **Khôi phục WebKit trên VM** (ưu tiên cao nhất của mảng này):
   chạy lại `install-dependencies.sh --autoinstall` khi VM rảnh
   (apt update >9 phút chưa xong lần này — thử đổi mirror về
   `archive.ubuntu.com` hoặc chạy lúc ít luồng song song), rồi
   chạy lại nguyên script K9 để lấy số WebKit-vs-Chromium thật.
   Nếu image tiếp tục bị replace, cân nhắc pin lại image hoặc
   ghi chú deps vào docs setup của repo.
2. **Kernel WebKit** — chạy script K9 ngay khi WebKit khởi động
   lại được (§4.3, §5 S-6).
3. **Safari thật** — checklist §5 sẵn; cần máy Mac thật hoặc
   user duyệt dùng thử cloud (không tự đăng ký).
4. **GPU thật** — vẫn cần máy có NVIDIA/Intel/Apple Silicon:
   render 1080p hwaccel vs CPU-only cùng project; NVENC/VAAPI/
   QSV/VideoToolbox qua render worker (detect + fallback đã có
   từ Phase 7 P2, chưa từng chạy thành công).
5. **Draw-loop FPS dao động ~2× giữa các lần chạy** (§3.3) — cần
   đo với cửa sổ dài hơn + ghi load tức thời (không chỉ loadavg)
   nếu muốn số ổn định; hiện tại chỉ dùng tỉ lệ, không dùng số
   tuyệt đối.
6. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
7. **EPERM là sóng lặp lại** — theo dõi mỗi đợt (K9: không gặp
   sóng EPERM trong lúc đo; apt update chậm không phải EPERM).
8. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user).
9. **Release gate giữ nguyên:** KHÔNG release/tag.

## 8. Kiểm chứng

- `node --check benchmarks/render/gpu_safari_probe_83k9.mjs`: **OK**.
- Probe K9 chạy **3 lần** (headed Xvfb, Chromium full build):
  lần 1 (21,5 s), lần 2 (30 s), lần 3 (30,5 s); **0 lỗi trang**
  cả 3 lần; WebKit thất bại cả 2 đường × 3 lần (lỗi khởi động
  giống hệt nhau).
- Kernel: đối chứng Chromium tái lập J2 đúng từng số (Mitchell
  MAD 0,003/0, medium tri 0 — 8/8 capture, 3 lần chạy giống hệt).
- FFmpeg hwaccel: 4/4 encoder 0 frame, `-22`.
- `ldd`: MiniBrowser GTK 22 lib thiếu / WPE 18 lib thiếu;
  Chromium + Firefox 0 lib thiếu.
- **Không sửa production** (chỉ thêm script probe + docs + JSON
  kết quả) nên không chạy tsc/vite build (không có gì để hồi
  quy). Không đụng TTS/Gradio, workflow, binary; không push/tag.
- Bẫy phương pháp đã sửa trong đợt: MAD phải tính trên dự báo
  đã làm tròn (§4.2) — script đã sửa trước lần chạy 2–3.

## 9. Files (stage, KHÔNG push)

- Mới: `docs/PHASE9_ROUND83_K9_GPU_SAFARI_REAL_LIMITS.md` (file này).
- Mới: `benchmarks/render/gpu_safari_probe_83k9.mjs` — script đo
  K9: WebGL strings/limits, rAF trống, thí nghiệm drawImage 4 arm,
  video h264 loop + rVFC, kernel drawImage (sqw4/step, high/medium),
  feature-check; chạy `xvfb-run -a node
  benchmarks/render/gpu_safari_probe_83k9.mjs` (clip test ở
  `/tmp/k9/clips` — tự encode bằng FFmpeg, không stage).
- Mới: `benchmarks/results/webkit-safari-probe-83k9.json` — kết quả
  thô **lần chạy 3** (mới nhất, tải 1-phút ~2); số lần 1–2 trong
  file này §3 + log luồng `hidden_files/round83-k9.md`.
  (JSON ~73 KB — vượt ngưỡng 37.768 byte của `push-files` qua
  privsep; lúc push dùng `ENABLE_PRIVSEP=0` như push #4.)
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round83-k9-gpu-safari-real.txt`.
