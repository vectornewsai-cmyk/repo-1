# Phase 9 đợt 79 — G8: GPU thật / Safari thật — đo lại khả năng hiện có

Ngày: 10/11/2026, lượt cron 09:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ đợt 78 §4.8 (nối tiếp E8 đợt 77,
`docs/PHASE9_ROUND77_E8_GPU_SAFARI_LIMITS.md`).
Đợt này CHỈ ĐO, không sửa production.

**Kết luận ngắn:**
1. **Vẫn không có GPU thật trên VM này — xác nhận lần 4.**
   Không `/dev/dri`, không VGA device, không `nvidia-smi`.
   FFmpeg `h264_vaapi` / `h264_nvenc` đo lại: 0 frame, lỗi `-22`.
   Chromium full build headed (Xvfb) báo WebGL renderer
   `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)
   (0x0000C0DE)), SwiftShader driver)` + `failIfMajorPerformanceCaveat`
   → không tạo được context → **software-only, chắc chắn**.
2. **WebKitGTK "Apple GPU" là nhãn giả — bẫy mới (W4).**
   `WEBGL_debug_renderer_info` trên WebKit 27.2 trả
   `unmaskedVendor: "Apple Inc."`, `unmaskedRenderer: "Apple GPU"`,
   `hwContextAllowed: true` — trên VM Linux không có GPU.
   Đó là chuỗi cố định của WebKit, không phải phần cứng.
   Bằng chứng thật: shader WebGL chạy đồng bộ bằng CPU
   (640×360×30 vòng: median 91 ms; 1280×720×100 vòng: median
   1.394 ms, scale tuyến tính theo khối lượng) — **WebKitGTK
   render WebGL bằng CPU, không có GPU**.
3. **Phát hiện mới (W3): WebKitGTK phát video không-loop tốt,
   nhưng phát LOOP thì kẹt sau đúng 1 vòng.** Clip H.264 6 s
   không loop: chạy realtime 0 → 6 s, `ended: true`,
   **0 frame drop / 179** dù loadavg 22. Cùng clip 2 s có loop:
   chạy tới ~1 s, quay về `currentTime: 0`, rồi kẹt vĩnh viễn
   (`paused: false`, `readyState: 4`, không lỗi,
   `totalVideoFrames: 60` = đúng 1 vòng 2 s × 30 fps đã decode).
   Chromium loop bình thường. Hệ quả cho app: preview lặp clip
   sẽ đứng hình sau 1 lượt trên WebKitGTK; hướng khắc phục
   (chưa kiểm chứng): tự `seek(0)` khi `ended`, không dùng
   `loop` — ghi làm nợ, không claim đã sửa.
4. **Canvas 2D trên WebKitGTK chậm hơn Chromium ~5–6× — do chi
   phí vẽ, không phải rAF bị bóp.** rAF trống (không vẽ) 3 s:
   cả hai engine đều ~29 fps, gap median 16,7 ms — lịch rAF
   giống nhau. Nhưng rAF + vẽ canvas 1280×720 (gradient + 40
   rect + text): Chromium 21,5–30,5 fps, WebKit 4,7–7,9 fps,
   gap median ~197 ms. Preview vẽ canvas trên WebKitGTK sẽ
   chậm rõ rệt so với Chromium trên cùng máy.
5. **MediaRecorder vẫn vắng trên WebKitGTK (W1, xác nhận lần 3:**
   đợt 77, file 78f10, đợt này).** Chromium: có.
   `canvas.captureStream` thì có ở cả hai.
6. **Phát lại 5 codec, xác nhận lần 3:** WebKit 5/5
   (H.264/VP8/VP9/AV1/HEVC, readyState 4, nhờ GStreamer hệ
   thống 269 plugin — không phải tính chất Safari); Chromium
   4/5 (HEVC readyState 0, networkState 3). **Đính chính cách
   đọc:** "phát được" ở các đợt trước chỉ nghĩa là
   `readyState ≥ 2`, không phải phát mượt — nay mới đo tiến
   trình phát thật (currentTime từng giây), và phát hiện W3.
7. **WebGPU:** Chromium có API (`navigator.gpu` present) nhưng
   `requestAdapter` trả `null` ở cả 3 mức ưu tiên (đợt này);
   ở lượt chạy đầu của đợt này headed-Xvfb báo
   `navigator.gpu` absent — tính khả dụng thay đổi theo lần
   chạy, không ổn định. WebKit: `navigator.gpu` undefined hẳn.
   **Không có WebGPU dùng được trên VM này ở cả hai engine.**
8. **WebKitGTK mới nhất qua Playwright đã là bản đang đo.**
   `playwright-core` mới nhất trên npm ngày 10/11/2026 vẫn là
   **1.65.0** → `webkit-2388` (WebKit 27.2) là bản mới nhất
   kênh này cung cấp; không có libwebkitgtk hệ thống để đối
   chiếu. Muốn WebKit mới hơn phải build từ source hoặc chờ
   Playwright release mới — ngoài phạm vi đợt này.
9. **Safari thật vẫn chưa đo.** Không có máy macOS/iOS.
   Mọi kết luận WebKit dưới đây vẫn là WebKitGTK, không được
   trích thành "Safari làm X".

## 0. Máy đo lúc này (10/11/2026)

| Mục | Giá trị |
|---|---|
| CPU | AMD EPYC 9D25 126-Core, **4 vCPU** (`nproc` = 4) |
| RAM | 7.934 MiB |
| Kernel | **7.0.0-44-generic** (đợt 77: 7.0.0-43 — kernel đã đổi) |
| OS | Ubuntu 24.04.5 LTS |
| FFmpeg | 8.1.2 |
| Chromium | 158.0.8127.18 full build (`chromium-1254/chrome-linux64/chrome`), headed dưới `xvfb-run` + `--headless=new` |
| WebKit | 27.2 (`webkit-2388`, minibrowser-gtk), headless + headed-xvfb (kết quả giống hệt nhau) |
| Playwright | `playwright-core 1.65.0` (`/home/hatch/scratch-round63-r4/node_modules/`) — mới nhất trên npm ngày đo |
| **Load lúc đo** | **Rất nặng: loadavg 2,5–28,6** — các luồng đợt 79 khác chạy song song (render-frames, split-stress, clicktest). Mọi số fps tuyệt đối trong đợt này mang caveat đó; so sánh trong cùng một lượt đo vẫn có ý nghĩa tương đối, số tuyệt đối không so trực tiếp với đợt khác. |

## 1. GPU — không có, đo lại lần 4

### 1.1 Thiết bị

| Kiểm tra | Kết quả |
|---|---|
| `lspci` | Không có lệnh (`command not found`) |
| `/dev/dri` | Không tồn tại |
| `/sys/class/drm/` | Chỉ có `version` — không `card0`/`renderD128` |
| `/dev/nvidia*`, `nvidia-smi`, `vainfo`, `glxinfo`, `vulkaninfo` | Không có |
| `lscpu`/`nproc` | 4 vCPU AMD EPYC 9D25 |

### 1.2 FFmpeg encode phần cứng — đo lại, vẫn 0 frame

Nguồn `testsrc2` 1280×720 2 s. Kết quả thô: xem §6.

| Lệnh thử | Kết quả |
|---|---|
| `-c:v h264_vaapi -vf format=nv12,hwupload` | `Error initializing filters`, `Invalid argument` — 0 frame, không tạo được file |
| `-c:v h264_nvenc` | `Terminating thread with return code -22 (Invalid argument)`, file ra 0 byte |
| Đối chứng `-c:v libx264 veryfast` | Chạy bình thường, file 675.158 byte |

### 1.3 WebGL renderer qua Chromium headed — SwiftShader, chắc chắn

Đo trên Chromium full build **headed dưới Xvfb**
(lượt 1 của đợt này + lượt 2, giống nhau):

| Mục | Kết quả |
|---|---|
| WebGL2 `unmaskedRenderer` | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` |
| WebGL1 `unmaskedRenderer` | Như trên |
| `failIfMajorPerformanceCaveat: true` | **Không tạo được context** (`hwContextAllowed: false`) — bằng chứng software-only, vì trình duyệt tự từ chối khi bị cấm dùng software rendering |
| WebGPU | API có (`navigator.gpu` present) ở lượt 2 nhưng `requestAdapter` trả `null` ở cả 3 mức (`high-performance` / `low-power` / default); ở lượt 1 headed-Xvfb thì `navigator.gpu` báo absent. Tính khả dụng không ổn định theo lần chạy — **không có WebGPU dùng được** |
| `VideoDecoder.isConfigSupported` | `prefer-hardware: false`, `prefer-software: true` (đo trên http secure context; xem §5.1) |
| `chrome://gpu` | Mở được (`contentLength: 632`) nhưng `innerText` rỗng — không trích được Graphics Feature Status bằng đường này. Ghi nhận là **không đo được**, không suy ra "tính năng X tắt". |

### 1.4 WebGL trên WebKit — nhãn "Apple GPU" là giả (W4, MỚI)

| Mục | WebKit 27.2 |
|---|---|
| WebGL2 `unmaskedRenderer` | **`"Apple GPU"`**, vendor `"Apple Inc."` |
| `failIfMajorPerformanceCaveat: true` | Vẫn tạo được context (`hwContextAllowed: true`) — WebKit không chặn như Chromium |
| WebGPU | `navigator.gpu` **undefined** |
| `VideoDecoder.isConfigSupported` | `prefer-hardware: true`, `prefer-software: true` — chỉ là cờ "hỗ trợ", không chứng minh decode bằng phần cứng |

**"Apple GPU" không phải bằng chứng phần cứng.** Đây là chuỗi
mà WebKit trả về bất kể backend thật. Bằng chứng thật là thời
gian chạy shader (§2): WebKit chạy đồng bộ bằng CPU.

## 2. WebGL shader timing — WebKit CPU, Chromium không đo được bằng cách này

Phương pháp: fullscreen quad, fragment shader vòng `sin`/`cos`,
`gl.finish()` sau mỗi frame, kiểm tra `LINK_STATUS` + đọc pixel
giữa để chứng minh shader chạy thật (pixel trung tâm giống nhau
ở cả hai engine: light `[20,20,20]` vs `[22,22,22]`,
heavy `[239,239,239]` vs `[233,233,233]`).

| Shader | Chromium (headed + headless-new) | WebKit (headless + headed) |
|---|---|---|
| Nhẹ 640×360, 30 vòng, 12 frame | median **0 ms**, p95 9,1 / 51,5 ms | median **88–91 ms**, p95 169–189 ms, min 19–21 ms |
| Nặng 1280×720, 100 vòng, 8 frame | median **0 ms**, p95 70,7 ms | median **1.394 ms**, p95 2.292 ms, min 977 ms |

**Đọc đúng — hai kết luận khác nhau cho hai engine:**
- **WebKit: số thật, render bằng CPU.** Thời gian scale tuyến
  tính theo khối lượng (6,9M cặp sin/cos → ~91 ms; 92M cặp →
  ~1.394 ms, tỉ lệ công việc 13,3× → thời gian 15,3×) ≈
  ~70M cặp trig/giây, đúng đặc trưng rasterizer phần mềm
  đơn luồng. Không có GPU.
- **Chromium: median 0 ms là artifact, KHÔNG phải tốc độ thật.**
  92M cặp sin/cos không thể chạy xong trong < 0,5 ms trên CPU;
  p95 thỉnh thoảng lên 9–71 ms cho thấy công việc thật có xảy
  ra nhưng `gl.finish()` không serialize nó — ANGLE/Vulkan chạy
  qua GPU process đa tiến trình, lệnh draw được queue rồi
  `finish()` trả về trước khi rasterization hoàn tất. **Phương
  pháp `gl.finish()` timing không đo được chi phí WebGL thật
  của Chromium — cấm trích "Chromium WebGL 0 ms" làm số tốc độ.**
  Muốn đo Chromium cần `EXT_disjoint_timer_query` hoặc đo FPS
  thực tế của workload WebGL, chưa làm trong đợt này (nợ mới).

## 3. WebKit thêm: FPS canvas + tiến trình phát video

### 3.1 rAF — lịch giống nhau, chi phí vẽ khác nhau

rAF trống (callback không vẽ gì), 3 s, đo trên http secure
context, Xvfb 1280×800:

| Engine / chế độ | FPS rAF trống | Gap median |
|---|---|---|
| Chromium headed | 27,84 | 16,7 ms |
| Chromium headless-new | 29,31 | 16,7 ms |
| WebKit headless | 28,91 | 17,0 ms |
| WebKit headed-xvfb | 28,89 | 17,0 ms |

Cả hai engine đều ~29 fps chứ không phải 60 (giới hạn của
Xvfb/compositing phần mềm trên VM này) — **lịch rAF giống hệt
nhau, WebKit không bị bóp rAF.**

rAF + vẽ canvas 1280×720 (gradient + 40 rect + text), 5 s × 2
lượt, cùng workload với probe chính:

| Engine | Lần 1 (đợt này, lượt 1, load ~6) | Lần 2 (đợt này, lượt 2, load ~26–28) |
|---|---|---|
| Chromium | 30,53 / 30,00 fps | 21,49 / 24,09 fps |
| WebKit | 7,88 / 5,87 fps | 5,14 / 4,71 fps (gap median ~197 ms) |

**Kết luận:** chênh lệch là chi phí vẽ canvas 2D của WebKitGTK
(Cairo phần mềm), không phải rAF. Preview vẽ canvas trên
WebKitGTK sẽ chậm hơn Chromium ~5–6× trên cùng máy này.
Số tuyệt đối mang caveat load nặng (§0).

### 3.2 Phát video thật — W3: loop kẹt (MỚI)

Clip H.264 320×180 tự encode (`testsrc2`, libx264), phát qua
`http://127.0.0.1:8899` (secure context), lấy mẫu `currentTime`
mỗi giây, `muted`, `playsInline`.

**Clip 6 s, KHÔNG loop — cả hai engine đều realtime:**

| Engine | currentTime t=0..6 s | Kết thúc | Dropped |
|---|---|---|---|
| Chromium headed | 0 → 0,99 → 1,99 → 2,99 → 3,99 → 4,99 → 5,99 | chạy hết | 62 / 180 (load 22) |
| WebKit headless | 0 → 1 → 2 → 3 → 4,01 → 5,01 → 6 | `ended: true`, `paused: true` | **0 / 179** |

**Clip 2 s, CÓ loop — WebKit kẹt, Chromium bình thường:**

| Engine | currentTime t=0..5 s | `totalVideoFrames` |
|---|---|---|
| Chromium headed | 0 → 0,99 → 1,99 → 0,89 → 1,8 → 0,5 (loop đều) | 141, dropped 62 |
| Chromium headless-new | 0 → 0,99 → 1,99 → 0,91 → 1,91 → 0,91 | 152, dropped 55 |
| WebKit headless | 0 → 1,01 → **0 → 0 → 0 → 0** | **60, dropped 0** |
| WebKit headed-xvfb | 0,1 → 1,07 → **0 → 0 → 0 → 0** | 10, dropped 3 |

**W3 — đọc đúng:** WebKitGTK phát xong vòng đầu (~1 s),
quay về `currentTime: 0` (loop restart), rồi kẹt vĩnh viễn ở 0
trong khi `paused: false`, `readyState: 4`, không có lỗi.
`totalVideoFrames: 60` = đúng 1 vòng 2 s × 30 fps đã decode —
không decode thêm frame nào sau khi loop. Đây là lỗi/khác biệt
của vòng lặp media trên WebKitGTK (minibrowser), không phải
decode hỏng (clip không loop phát ngon, 0 drop). **"Phát được
5/5 codec" ở các đợt trước chỉ nghĩa là `readyState ≥ 2` —
chưa từng đo tiến trình phát thật; nay mới đo và phát hiện W3.**
Headless và headed cho kết quả giống nhau.

Hệ quả cho app: preview lặp clip (chế độ loop mặc định của
timeline preview) sẽ đứng hình sau 1 lượt trên WebKitGTK.
Hướng khắc phục chưa kiểm chứng: bắt `ended` rồi tự `seek(0)`
thay vì dùng thuộc tính `loop` — ghi làm nợ, không claim.

### 3.3 Phát lại 5 codec (đo lại lần 3, qua `file://`)

| File | WebKit 27.2 | Chromium 158 |
|---|---|---|
| `h264.mp4` | ✅ readyState 4 | ✅ readyState 4 (lượt 1) / 2 (lượt 2, tải nặng) |
| `vp9.webm` | ✅ readyState 4 | ✅ readyState 4 / 2 |
| `vp8.webm` | ✅ readyState 4 | ✅ readyState 4 |
| `av1.mp4` | ✅ readyState 4 | ✅ readyState 4 |
| `hevc.mp4` | ✅ readyState 4 | ❌ readyState 0, networkState 3 (NO_SOURCE) |

Không đổi so với đợt 77/78. WebKit phát được HEVC/AV1 nhờ
GStreamer hệ thống (269 plugin), không phải tính chất Safari.

### 3.4 Video playback FPS qua `requestVideoFrameCallback` (probe chính)

Đo bằng clip H.264 2 s loop, 5 s, load ~26–28 (số này bị
nhiễu nặng bởi load + W3 — chỉ ghi làm hồ sơ, số đúng lấy
theo §3.2):

| Engine | Presented (rVFC) | FPS | currentTime sau 5 s | quality |
|---|---|---|---|---|
| Chromium | 86 | 17,0 | 0,89 (loop nhiều vòng, decode không theo kịp load) | total 151, dropped 53 |
| WebKit | **0** (guard 7 s kích hoạt) | 0 | 0 | total 3, dropped 1 |

Số 0 của WebKit là **biểu hiện của W3** (loop kẹt → không còn
frame mới → rVFC không gọi lại), không phải probe hỏng.
Phiên bản probe có guard chống treo rVFC/rAF (7 s / +2 s) —
chính guard này đã cứu lượt chạy thứ 2 khỏi treo vô hạn
(xem §5.2).

## 4. MediaRecorder + feature-check (đo lại)

| Mục | WebKit 27.2 | Chromium 158 |
|---|---|---|
| `MediaRecorder` | **không tồn tại** (W1, lần 3) | có |
| `canvas.captureStream` | có | có |
| `VideoDecoder` / `VideoEncoder` / `AudioDecoder` | có | có (trên http; xem §5.1) |
| `navigator.gpu` | không có | có nhưng adapter `null` (§1.3) |
| `ctx.filter` | không có (W2, đứng) | có |
| `ctx.roundRect` | có | có |

## 5. Hai đính chính về phương pháp đo

### 5.1 about:blank lại cho kết quả sai — lần này là `VideoDecoder`

Lượt 1 của đợt này chạy probe trên `about:blank`:
Chromium báo `VideoDecoder` **undefined** (`videoDecoderHw: null`)
và `navigator.gpu` absent. Lượt 2 chạy trên
`http://127.0.0.1:8899/index.html` (secure context thật):
`VideoDecoder` có (`prefer-hardware: false`,
`prefer-software: true`), `navigator.gpu` present (adapter null).
**Kết luận:** mọi probe feature-check phải chạy trên http(s)
secure context, không dùng `about:blank` — khớp bài học đợt 77
§5.1, nay có thêm bằng chứng (VideoDecoder). Số đúng của đợt
này lấy theo lượt 2 (http).

### 5.2 Probe có thể treo vô hạn nếu video/rAF dừng hẳn

Lượt chạy giữa của đợt này (có shader benchmark + video http)
treo > 7 phút ở bước WebKit `fpsProbe` và phải kill: vòng lặp
`requestVideoFrameCallback` chỉ kết thúc khi callback được gọi —
khi video kẹt (W3) thì callback dừng hẳn, promise không bao giờ
resolve. Tương tự vòng lặp rAF nếu rAF dừng. **Đã vá trong
script đợt này:** guard `setTimeout` 7 s cho video, +2 s cho
rAF, race 10 s cho `play()`. Lượt 2 chạy xong trong 148 s.
Bài học: mọi vòng đo dựa trên callback của trình duyệt phải có
timeout wall-clock.

### 5.3 `gl.finish()` không đo được chi phí WebGL của Chromium

Xem §2. Phương pháp timing này chỉ có ý nghĩa trên engine
chạy WebGL đồng bộ trong cùng process (WebKitGTK). Với Chromium
đa tiến trình, cần `EXT_disjoint_timer_query` hoặc đo FPS thực —
chưa làm (nợ mới, §7).

### 5.4 Server HTTP một luồng có thể làm nghẽn probe

Clip phục vụ qua `python3 -m http.server` (đơn luồng) trên
`127.0.0.1:8899`. Probe vẫn chạy xong sau khi vá guard, nhưng
đợt sau nên dùng server đa luồng hoặc phục vụ clip từ chính
dev-server của app để tránh nhiễu.

## 6. Bảng tổng kết — kết luận nào vẫn đứng

| Kết luận cũ (nguồn) | Trạng thái sau đợt này |
|---|---|
| Không có GPU thật trên VM (E8, lần 3) | **Đứng — xác nhận lần 4**, thêm bằng chứng WebGL headed: SwiftShader + `failIfMajorPerformanceCaveat` chặn context |
| GPU encode chưa từng chạy thành công trên phần cứng thật (RESULTS.md §8.2) | **Đứng — đo lại, vẫn 0 frame** (vaapi + nvenc, `-22`) |
| WebKit phát được 5 codec (E8) | **Đứng ở tầng readyState; đính chính cách đọc:** chỉ là "tải được + có metadata", nay mới đo tiến trình phát thật và phát hiện **W3 loop kẹt** |
| WebKitGTK không có `MediaRecorder` (W1) | **Đứng — xác nhận lần 3** |
| `ctx.filter` vắng trên WebKitGTK (W2) | **Đứng** (đo lại) |
| Preview FPS chỉ đúng trên Chromium (RESULTS.md §5) | **Đứng + bổ sung số WebKit đầu tiên:** canvas-draw 4,7–7,9 fps vs Chromium 21,5–30,5 fps (cùng workload, load nặng) — WebKitGTK chậm hơn ~5–6× ở khâu vẽ canvas |
| Render 1080p / caption / TTS / bgremove CPU-only (RESULTS.md) | **Đứng.** Không có GPU để thay đổi chúng |
| "Không có Safari/WebKit thật" (A7/B3) | **Một nửa đứng:** WebKit thật đo được từ đợt 77; **Safari thật vẫn chưa đo** |
| WebKitGTK mới nhất = webkit-2388 | **Mới, đứng:** playwright-core 1.65.0 là mới nhất trên npm 10/11/2026; không có bản WebKit mới hơn qua kênh này |

## 7. Nợ mở cho đợt sau

1. **Safari thật vẫn chưa đo** — cần máy macOS/iOS thật hoặc
   dịch vụ cloud có Safari (nợ từ đợt 77, chưa đóng): ma trận
   codec theo phiên bản, MediaRecorder + tên mẫu `.mp4` thật,
   roundRect trên Safari < 16, VideoDecoder Safari, và kiểm tra
   xem **W3 loop kẹt có tái hiện trên Safari thật không**
   (WebKitGTK kẹt loop chưa chắc Safari đã kẹt — khác media
   stack).
2. **W3 — loop video kẹt trên WebKitGTK:** thử workaround
   `ended → seek(0)` thay cho thuộc tính `loop`; kiểm tra xem
   `seek()` thủ công có chạy không; nếu có thì nối vào preview
   loop của app (guard theo engine).
3. **W4 — nhãn WebGL "Apple GPU" giả:** ghi vào tài liệu đo để
   đợt sau không ai trích nhầm; mọi kết luận GPU phải dựa trên
   thời gian chạy / `failIfMajorPerformanceCaveat`, không dựa
   trên chuỗi renderer.
4. **GPU thật vẫn chưa đo** — cần máy có NVIDIA/Intel/Apple
   Silicon: render 1080p hwaccel vs CPU-only cùng project;
   NVENC/VAAPI/QSV/VideoToolbox qua render worker; preview FPS
   + decode có GPU. (Nợ từ đợt 77, chưa đóng.)
5. **Đo chi phí WebGL thật của Chromium** bằng
   `EXT_disjoint_timer_query` hoặc FPS workload — phương pháp
   `gl.finish()` đã chứng minh là không dùng được (§2, §5.3).
6. **Số tuyệt đối RESULTS.md mang nhãn máy cũ** (2 vCPU 7D13)
   vẫn đứng như cảnh báo; máy đo nay 4 vCPU 9D25, kernel
   7.0.0-44 — các đợt benchmark sau ghi rõ cấu hình lúc đo.
7. `ci-security.yml` / `ci-build.yml` vẫn 403 (nợ chung,
   không thuộc đợt này).

## 8. Cách đo khi có máy thật (không bịa số — hướng dẫn cho đợt sau)

**Máy có GPU (NVIDIA/Intel/Apple Silicon):**
- Chạy lại đúng script đợt này
  (`benchmarks/render/gpu_safari_probe_79g8.mjs`) trên máy đó:
  `unmaskedRenderer` sẽ hiện tên GPU thật;
  `failIfMajorPerformanceCaveat: true` vẫn tạo được context;
  `VideoDecoder.isConfigSupported` với `prefer-hardware`
  sẽ `true` và decode thật dùng được.
- FFmpeg: `ffmpeg -init_hw_device vaapi=va:/dev/dri/renderD128
  -i src -c:v h264_vaapi out.mp4` (Intel/AMD) hoặc
  `-c:v h264_nvenc` (NVIDIA) — phải ra frame > 0 và file > 0
  byte mới được claim "GPU encode chạy được"; so FPS với
  baseline libx264 cùng clip, cùng CRF, cùng máy.
- Render pipeline của app: chạy `bench_render.sh` với cùng
  project 1080p, bật/tắt hwaccel qua render worker (detect +
  fallback đã có từ Phase 7 P2) — so fps hwaccel vs CPU-only.

**Máy macOS / Safari thật:**
- Mở `benchmarks/render/gpu_safari_probe_79g8.mjs` logic
  (hoặc chạy trực tiếp page probe) trên Safari thật, từng
  phiên bản (VP9 cần ≥ 14.1, AV1 cần ≥ 17): ma trận
  `canPlayType` + phát file thật + `MediaRecorder` mặc định
  (mime `.mp4`?) + đo tiến trình phát (currentTime từng giây,
  cả clip loop và không loop — kiểm tra W3 có tái hiện không)
  + `roundRect`/`backdrop-filter`/`100dvh` theo phiên bản.
- Không suy từ WebKitGTK sang Safari: media stack khác
  (GStreamer vs VideoToolbox), `MediaRecorder` khác (có vs
  không), loop khác (kẹt vs chưa biết).

**Máy Windows (Chrome/Edge thật):**
- Chạy lại script probe + `bench_render.sh`; kiểm tra
  `h264_qsv`/`h264_nvenc` và `chrome://gpu` thật (trang này
  chỉ đọc được trên Chrome có UI đầy đủ, không đọc được qua
  automation như §1.3 đã thấy).

## 9. Files (stage, KHÔNG push)

- Mới: `docs/PHASE9_ROUND79_G8_GPU_SAFARI_LIMITS.md` (file này).
- Mới: `benchmarks/render/gpu_safari_probe_79g8.mjs` — script đo
  GPU/WebGL/WebGPU/MediaRecorder + FPS rAF-canvas + FPS phát video
  (rVFC) + phát lại 5 codec, cả 2 engine; chạy
  `xvfb-run -a node benchmarks/render/gpu_safari_probe_79g8.mjs`
  (cần clip test ở `/tmp/g8/clips` + HTTP server ở
  `http://127.0.0.1:8899` — xem đầu file; clip không stage
  theo quy định không binary).
- Mới: `benchmarks/render/gpu_safari_diag_79g8_raf_video.mjs` —
  chẩn đoán rAF trống + tiến trình phát video loop/không loop +
  shader nhẹ có kiểm tra link/readPixels.
- Mới: `benchmarks/render/gpu_safari_diag_79g8_loop_shader.mjs` —
  chẩn đoán clip 6 s không loop + shader nặng 1280×720×100.
- Mới: `benchmarks/results/webkit-safari-probe-79g8.json` — kết
  quả thô cả 2 engine, lượt 2 (đo 2026-11-10T03:07:01Z,
  loadavg lúc đo 28,06). Lượt 1 (about:blank, 02:41Z) đã bị
  ghi đè — số lượt 1 chỉ còn trong file này (§1.3, §5.1).
- Mới: `benchmarks/results/webkit-safari-probe-79g8-diag.json` —
  kết quả thô các chẩn đoán check3/check4 (rAF trống, tiến
  trình phát, shader có kiểm chứng).
- Không sửa production. Không binary. Không workflow.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round79-g8-gpu-safari.txt`.
