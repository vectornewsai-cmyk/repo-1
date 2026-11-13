# Phase 9 đợt 77 — E8: Đo GPU thật / Safari thật (giới hạn đo)

Ngày: 10/11/2026, lượt cron 03:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ đợt 76 §4.8 (kề D8) + B3 §4.7 + RESULTS.md §7.4/§8.2:
mọi kết luận hiệu năng tới nay chỉ đúng trên CPU/SwiftShader +
Chromium trên VM này; GPU thật / Safari thật chưa từng đo.
Đợt này CHỈ ĐO, không sửa production.

**Kết luận ngắn:**
1. **Không có GPU thật trên VM này — xác nhận lần 3.** Không
   `/dev/dri`, không `/dev/nvidia*`, không VGA device, không
   `nvidia-smi`/`vainfo`/`glxinfo`/`vulkaninfo`. FFmpeg liệt kê
   được hwaccel/encoder nhưng mọi encode phần cứng đều thất bại
   0 frame (`-22 Invalid argument`): `h264_vaapi`, `hevc_vaapi`,
   `h264_nvenc`, `h264_qsv`. GPU encode **vẫn chưa từng chạy
   thành công trên phần cứng thật** (RESULTS.md §8.2 giữ nguyên).
2. **Không có Safari thật** (VM Linux; Epiphany không cài; không
   apt install nặng theo quy định đợt). Thay vào đó đo được
   **WebKit thật lần đầu tiên**: Playwright `webkit-2388`
   (version 27.2) chạy được — driver `playwright-core 1.65.0`
   khớp đúng revision, đóng nợ B3 §4.7 ("không có driver
   playwright nên không lái được webkit"). WebKitGTK ≠ Safari
   shipping: cùng họ engine, khác media stack (GStreamer thay
   VideoToolbox) — mọi kết luận WebKit dưới đây KHÔNG được trích
   thành "Safari làm X".
3. **WebKit phát được cả 5 codec** (H.264/VP8/VP9/AV1/HEVC,
   readyState 4, 320×180, duration 2 s) — nhưng đó là nhờ bộ
   plugin GStreamer của máy này (269 plugin: `libgstaom`,
   `libgstvpx`, `libgstlibav`, `libgstopenh264`, `libgstx264/x265`),
   không phải tính chất của Safari. `canPlayType` của WebKit trả
   `"probably"` cho MỌI codec kể cả Theora/Matroska — lạc quan
   hơn Chromium, không kiểm tra decoder thật.
4. **Phát hiện mới (W1): WebKitGTK này KHÔNG CÓ `MediaRecorder`**
   (`typeof MediaRecorder === "undefined"` cả trên about:blank
   lẫn http secure context). `canvas.captureStream` thì có — ghi
   mẫu chết ở bước tạo recorder, guard `sampleMedia.ts:151`
   trả null đúng thiết kế (không crash), nhưng **ghi media mẫu /
   template pack sẽ thất bại lặng lẽ trên engine này**. Trên
   Safari thật (14.1+) MediaRecorder có — đây là khác biệt
   WebKitGTK-vs-Safari, không phải bug Safari.
5. **Chromium 158 full build re-xác nhận baseline B3**: ma trận
   `canPlayType` giống hệt B3 §3.2 (HEVC `""`, AV1/H.264/VP9
   `probably`); phát thật 4/5 — HEVC readyState 0,
   networkState 3 (NO_SOURCE), không phát được. Verdict
   codecProbe "HEVC unsupported → toast" đúng cả ở tầng phát thật.
6. **Hai artifact đo cũ được đính chính**: (a) Chromium
   *headless shell* thiếu `VideoDecoder`/`VideoEncoder`/
   `AudioDecoder` + module worker blob lỗi — full build
   (`--headless=new`) có đủ; mọi claim WebCodecs đo bằng headless
   shell đều phải đọc lại. (b) `crypto.randomUUID`/`clipboard`/
   `AudioContext.audioWorklet` báo `false` trên about:blank là
   artifact secure-context — trên http 127.0.0.1 đều `true` ở cả
   hai engine.
7. **VM đã đổi phần cứng dưới chân**: CPU nay là AMD EPYC 9D25,
   **4 vCPU** (RESULTS.md ghi 2 vCPU 7D13). Mọi số tuyệt đối cũ
   mang nhãn "2 vCPU" giờ là số của máy cũ — thứ tự/tỉ lệ vẫn
   đứng, số tuyệt đối không so trực tiếp được nữa.

## 1. GPU — không có, đo thất bại có bằng chứng

### 1.1 Thiết bị (10/11/2026, lúc đo)

| Kiểm tra | Kết quả |
|---|---|
| `lspci` | Không có lệnh (`command not found`) — không liệt kê được PCI |
| `/dev/dri` | Không tồn tại |
| `/sys/class/drm/` | Chỉ có `version` — không có `card0`/`renderD128` |
| `/dev/nvidia*` | Không tồn tại |
| `nvidia-smi` / `vainfo` / `glxinfo` / `vulkaninfo` | Không có lệnh nào |
| CPU | AMD EPYC 9D25 126-Core, **4 vCPU** (`nproc` = 4) |
| RAM | 7,7 GiB (lúc đo: 7,1 GiB đã dùng, 705 MiB free — VM đang tải do các luồng đợt 77 chạy song song) |
| OS | Ubuntu 24.04.5 LTS, kernel 7.0.0-43-generic |
| FFmpeg | 8.1.2 (build có hwaccel: `vdpau cuda vaapi qsv drm opencl`; encoder: `h264_nvenc/hevc_nvenc/av1_nvenc`, `h264_qsv/hevc_qsv`, `h264_vaapi/hevc_vaapi/vp9_vaapi`…) |

### 1.2 Encode phần cứng thử thật — tất cả 0 frame

Nguồn: `testsrc2` 1920×1080 5 s, file `src1080.mp4`
(libx264 veryfast/CRF23, 3.385.703 byte).

| Lệnh thử | Kết quả |
|---|---|
| `ffmpeg -init_hw_device vaapi=va:/dev/dri/renderD128 … -c:v h264_vaapi` | `No VA display found for device /dev/dri/renderD128. Device creation failed: -22. Failed to set value 'vaapi=…' Invalid argument` |
| `-c:v h264_vaapi -vf format=nv12,hwupload` | `A hardware device reference is required to upload frames to. Error initializing filters` — 0 frame |
| `-c:v h264_nvenc` | `Terminating thread with return code -22 (Invalid argument)` — `frame= 0 fps=0.0`, `Conversion failed!` |
| `-c:v h264_qsv` | Như nvenc: return code `-22`, 0 frame, `Conversion failed!` |
| `-c:v hevc_vaapi` | 0 frame, `Conversion failed!` |

Kết luận: build FFmpeg có encoder phần cứng nhưng **không có
thiết bị nào đứng sau** — đúng như RESULTS.md §8.2 (đợt R3) đã
ghi, nay đo lại trên FFmpeg 8.1.2 / VM mới. **Không bịa số
GPU nào**: không có fps hwaccel để báo cáo.

### 1.3 Baseline CPU để đối chiếu (không phải render pipeline của app)

Cùng nguồn `src1080.mp4`, re-encode thuần `libx264
veryfast/CRF23 → null`, loadavg lúc đo 1,75–1,83:

| Lần | Wall | FPS |
|---|---|---|
| 1 | 4,30 s (150 frame) | **34,9 fps** (`speed=1.15x`) |
| 2 | 3,94 s (150 frame) | **38,1 fps** (`speed=1.25x`) |

**Đọc đúng:** đây là re-encode file đã nén, không text overlay,
không filtergraph của app, trên 4 vCPU — **KHÔNG so trực tiếp**
với baseline render pipeline RESULTS.md §7.1 (1080p 12,54 fps:
1 clip + text overlay qua app, đo trên 2 vCPU). Con số này chỉ
nói: "điểm CPU-only để hwaccel (nếu có) phải vượt qua" nằm ở
quanh 35–38 fps cho đúng tác vụ re-encode này, và hwaccel hiện
tại là 0 fps vì không có thiết bị. Chênh 12,54 → ~35 fps giữa
2 đợt phản ánh cả đổi spec lẫn đổi máy (2 → 4 vCPU, 7D13 →
9D25), không phải app nhanh lên.

## 2. Safari thật — không có; WebKit thật — lần đầu đo được

| Kiểm tra | Kết quả |
|---|---|
| Safari binary (`safari`, `epiphany`, `epiphany-browser`, `webkit`) | Không có; `ls /usr/bin` không có `epiphany/webkit/safari/midori/konqueror` |
| Cài Epiphany/WebKitGTK qua apt | **Không làm** — quy định đợt: không cài đặt nặng / không apt install lớn |
| Playwright cache | `webkit-2388` (minibrowser-gtk + minibrowser-wpe, `DEPENDENCIES_VALIDATED`, `INSTALLATION_COMPLETE`), `chromium-1254`, `chromium-1187`, `firefox-1572` |
| Driver | `playwright-core 1.65.0` tại `/home/hatch/scratch-round63-r4/node_modules/` — `browsers.json` của nó đòi đúng `chromium 1254` + `webkit 2388` → **khớp cache, lái được ngay** (đóng nợ B3 §4.7) |

Công cụ đo: `benchmarks/render/gpu_safari_probe_77e8.mjs`
(đo canPlayType/MSE/VideoDecoder/feature-check + phát file thật
qua `file://`, cả 2 engine, ra JSON) + follow-up trên
`http://127.0.0.1:8765` (secure context thật, module worker qua
URL http/blob, Chromium full build `--headless=new`).
Kết quả thô: `benchmarks/results/webkit-safari-probe-77e8.json`
(10.814 byte); follow-up chỉ chạy chẩn đoán, không lưu vào repo.

Engine đo được: **WebKit 27.2** (UA:
`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2
Safari/605.1.15`, vendor `Apple Computer, Inc.`, platform
`Linux x86_64`) vs **Chromium 158.0.8127.18** (headless shell
cho ma trận chính; full build cho follow-up).

## 3. Ma trận codec — WebKit vs Chromium (đo thật, cùng máy)

### 3.1 `canPlayType` (nguồn quyết định verdict của `codecProbe.ts`)

| MIME | WebKit 27.2 | Chromium 158 (headless shell) | B3 baseline (Chromium 1254) |
|---|---|---|---|
| `video/webm;codecs="vp9"` | probably | probably | probably |
| `video/webm;codecs="vp8"` | probably | probably | — |
| `video/webm;codecs="av1"` | probably | **""** | — |
| `video/webm` | maybe | maybe | maybe |
| `video/mp4;codecs="avc1.42E01E"` | probably | probably | probably |
| `video/mp4;codecs="hev1.1.6.L93.B0"` | probably | **""** | `""` |
| `video/mp4;codecs="av01.0.05M.08"` | probably | probably | probably |
| `video/mp4;codecs="mp4v.20.3"` | probably | **""** | — |
| `video/mp4` | maybe | maybe | maybe |
| `video/x-matroska;codecs="vp9"` | probably | **""** | — |
| `video/ogg;codecs="theora"` | probably | **""** | — |
| `audio/mpeg` | maybe | probably | — |
| `audio/mp4;codecs="mp4a.40.2"` | probably | probably | — |
| `audio/ogg;codecs="vorbis"` | probably | probably | — |
| `audio/ogg;codecs="opus"` | probably | probably | — |
| `audio/webm;codecs="opus"` | probably | probably | — |

**Đọc đúng:** WebKit trả `probably` cho MỌI video codec — kể
cả Theora/Matroska mà Safari thật không bao giờ hỗ trợ. Đây là
tính lạc quan của WebKitGTK: nó hỏi media engine "kiểu này có
thể thử được không" chứ không kiểm tra decoder thật. Chromium
phân biệt rõ (HEVC/AV1-webm/mp4v/matroska/theora = `""`).
Hệ quả cho app: trên WebKitGTK, `probeCodecSupport` sẽ verdict
`supported` cho gần như mọi file — **không toast oan, nhưng cũng
không cảnh báo được file nào**; verdict chỉ có ý nghĩa khi
engine trả lời trung thực như Chromium. Trên Safari thật, ma
trận theo phiên bản vẫn chưa đo (xem §6).

### 3.2 `MediaSource.isTypeSupported` (chẩn đoán, không đổi verdict)

| MIME | WebKit | Chromium |
|---|---|---|
| vp9/vp8/av1-webm, h264/hevc/av1-mp4, mp4v, webm, mp4, mp3, aac, opus-webm | **true hết** | vp9/vp8/h264/av1-mp4/mp3/aac/opus-webm true; **av1-webm, hevc, mp4v, webm, mp4 false** |
| matroska-vp9, theora, vorbis-ogg, opus-ogg | false | false |

Khớp B3: MSE Chromium AV1 true / HEVC false. WebKit MSE cũng
lạc quan như canPlayType của nó.

### 3.3 `VideoDecoder.isConfigSupported` (WebCodecs)

WebKit: `VideoDecoder` có; cả 5 config đều `supported`
(vp9, vp8, av1, h264, hevc). Chromium full build: có, cả 5
(không đo từng config ở full build — chỉ đo presence;
xem §5.2 về headless shell). Đường reverse engine của app
(`reversePlayback.ts` kiểm tra đủ 3 API + fallback element)
trên WebKit sẽ đi đường WebCodecs; trên Chromium headless
shell sẽ rơi về element — **đó là khác biệt của headless
shell, không phải của Chrome thật**.

### 3.4 Phát video thật (file 320×180, 2 s, tự encode bằng FFmpeg)

| File (ffprobe) | WebKit | Chromium |
|---|---|---|
| `h264.mp4` (h264) | ✅ readyState 4, 320×180, dur 2 | ✅ readyState 4 |
| `vp9.webm` (vp9) | ✅ readyState 4 | ✅ readyState 4 |
| `vp8.webm` (vp8) | ✅ readyState 4 | ✅ readyState 4 |
| `av1.mp4` (av1) | ✅ readyState 4 | ✅ readyState 4 |
| `hevc.mp4` (hevc) | ✅ readyState 4 | ❌ readyState 0, videoWidth 0, networkState 3 (NO_SOURCE), error null |

WebKit phát được cả 5 nhờ GStreamer hệ thống: `libwebkitgtk`
link `libgstreamer-1.0` + 269 plugin trong
`/usr/lib/x86_64-linux-gnu/gstreamer-1.0/` gồm `libgstaom`
(AV1), `libgstvpx` (VP8/VP9), `libgstlibav`, `libgstopenh264`,
`libgstx264/x265`. **Caveat:** máy Linux khác thiếu plugin
thì WebKitGTK sẽ fail đúng những clip này — và Safari trên
macOS dùng VideoToolbox, không dùng GStreamer. "WebKit phát
được HEVC/AV1" là tính chất của máy đo này, không phải của
Safari. Chromium HEVC không phát được khớp đúng canPlayType
`""` — verdict codecProbe được xác nhận ở tầng phát thật.

## 4. Audit Safari A7 §4 — kiểm lại bằng WebKit thật

| Mục A7 | Trạng thái trên WebKit 27.2 | Ý nghĩa |
|---|---|---|
| **S1** MIME media mẫu (`sampleMime.ts`, MediaRecorder) | **W1 — MỚI: `MediaRecorder` KHÔNG TỒN TẠI** (`typeof === "undefined"`, cả about:blank lẫn http). `canvas.captureStream` thì **có** (`function`) → ghi mẫu chết ở bước `new MediaRecorder(stream)`, guard `sampleMedia.ts:151` trả null → `PackError NO_RECORDER`, không crash. Nhánh tên `.mp4` của B3 vẫn chỉ mock (không recorder để đo thật). | Trên Safari thật 14.1+ MediaRecorder có — đây là khác biệt WebKitGTK-vs-Safari. App đã guard đúng; nhưng **mọi tính năng ghi media mẫu đều không chạy được trên engine này**. |
| **S2** `ctx.roundRect` (Safari < 16) | `typeof ctx.roundRect === "function"` → **true**. Helper `canvasRoundRect.ts` vẫn cần cho Safari < 16; trên engine mới không kích hoạt fallback. | Fix đứng; rủi ro cũ chỉ còn trên Safari < 16 (chưa đo). |
| **S3** `backdrop-filter` prefix | `CSS.supports("backdrop-filter")` true, `-webkit-backdrop-filter` true. | Fix đứng; engine mới hiểu cả hai. |
| **S4** `100dvh` fallback | `CSS.supports("height","100dvh")` true. | Fix đứng; Safari < 15.4 vẫn cần fallback `100vh`. |
| **S5** VP9/WebM/AV1 không phát được (Safari cũ) | VP9 + AV1 **phát được thật** trên WebKit này (readyState 4) — nhưng qua GStreamer (§3.4). | **Chưa đo được Safari cũ**: VP9 cần Safari ≥ 14.1, AV1 cần Safari ≥ 17+ vẫn là kiến thức công khai, chưa có số đo. Không được trích "WebKit phát được" thành "Safari cũ phát được". |
| **S6** `decodeAudioData` callback (Safari < 14.1) | Arity 1 (dạng promise), trả promise, **resolve thật** với WAV test (1 channel). | Dạng promise hoạt động; Safari < 14.1 vẫn chưa đo. |
| **S7** `canvas.captureStream` (Safari 15+) | `canvas.captureStream` = `function` ✅; `video.captureStream` = `undefined` ❌ (Chromium: cả hai đều `function`). | Ghi mẫu dùng canvas nên đủ API ở bước capture; chết ở MediaRecorder (W1). |
| `webkitAudioContext` | **Không có** (`undefined`) — khác Safari thật (có, legacy). `AudioContext` chuẩn có. Fallback `webkitAudioContext || AudioContext` trong `waveform.ts`/`audioEngine.ts` vẫn chạy đúng. | Khác biệt WebKitGTK; không ảnh hưởng app. |
| `ctx.filter` | **Không có** (`"filter" in ctx` = false; Chromium true). App không dùng `ctx.filter` ở production (A7 §4.4 grep 0) → **không ảnh hưởng hôm nay**; ai thêm canvas filter sau này sẽ vỡ lặng lẽ trên WebKit. | Ghi nhận để khỏi dùng. |
| Module worker (trial-decode worker) | `new Worker(blob, {type:"module"})` **chạy được**, reply đúng (7); qua URL http cũng reply (42). | Đường worker của `gopTrialDecodeWorker62R4` dùng được trên WebKit; fallback main-thread không kích hoạt ở đây. |
| `OffscreenCanvas` / `createImageBitmap` / `requestVideoFrameCallback` / `getVideoPlaybackQuality` / `playsInline` / `structuredClone` / `BroadcastChannel` / `ResizeObserver` | Tất cả **true** (cả 2 engine). | Khớp audit A7 §4.4 (đã có fallback/guard); không có gì mới. |
| `navigator.gpu` (WebGPU) | WebKit **false**; Chromium full build **true** (SwiftShader, không phải GPU thật). | Không GPU thật thì WebGPU cũng chỉ là software — đúng với kết luận §1. |
| `SharedArrayBuffer` | false cả 2 engine (không COOP/COEP — đúng kỳ vọng; app không dùng). | Không mới. |
| `showOpenFilePicker` | WebKit false; Chromium full true (headless shell false — artifact, xem §5.2). | App không dùng API này. |

## 5. Hai đính chính về phương pháp đo cũ

### 5.1 about:blank không phải secure context đầy đủ

Lần probe đầu chạy trên `about:blank` cho ra `crypto.randomUUID`
= false, `clipboard` = false, `AudioContext.audioWorklet` =
false ở **cả hai engine**. Đo lại trên `http://127.0.0.1:8765`
(`isSecureContext: true`): cả ba đều **true** ở cả hai engine
(`randomUUID()` trả UUID thật; `AudioContext` chạy được,
`audioWorklet` có; state `suspended` trên WebKit /
`running` trên Chromium — đúng autoplay policy headless).
**Kết luận:** mọi probe API secure-context trước đây chạy trên
about:blank đều phải đo lại; số trong file JSON gốc vẫn giữ
nguyên làm hồ sơ (đã ghi rõ trang đo là about:blank), số đúng
lấy theo follow-up http.

### 5.2 Chromium headless shell ≠ Chrome thật

| API | Headless shell (mặc định `chromium.launch({headless:true})`) | Full build (`chrome-linux64/chrome`, `--headless=new`) |
|---|---|---|
| `VideoDecoder` / `VideoEncoder` / `AudioDecoder` | **false** (không tồn tại) | **true** |
| Module worker qua blob URL | `error:worker-error` | **ok-reply:7** |
| `showOpenFilePicker` | false | true |
| `navigator.gpu` | false | true (SwiftShader) |
| `canPlayType` / phát video thật | Giống full build (HEVC `""`, không phát được) | — (không đo lại ma trận ở full build; ma trận B3 + lần này đều từ headless shell và khớp nhau) |

**Hệ quả:** mọi kết luận WebCodecs nào trước đây đo bằng
headless shell (vd "trình duyệt không có VideoDecoder nên về
element") đều có thể sai — đó là thiếu sót của bản shell, không
phải của Chrome. Ma trận `canPlayType` không bị ảnh hưởng (API
element, có ở cả hai bản, và khớp B3). Các đợt sau đo WebCodecs
phải dùng full build hoặc headed.

## 6. Bảng tổng kết — kết luận nào vẫn đứng, kết luận nào chỉ đúng trên Chromium/CPU

| Kết luận cũ (nguồn) | Trạng thái sau đợt này |
|---|---|
| Render 1080p 8,58 fps / 6,26 fps mặc định; 720p 15 fps; 4K 2,71 fps (RESULTS.md §1) | **Đứng, với nhãn "CPU-only, 2 vCPU 7D13"**. Máy đo nay là 4 vCPU 9D25 — số tuyệt đối cũ là số của máy cũ, không dùng để so trực tiếp với số đo mới. Thứ tự/tỉ lệ theo pixel vẫn đứng. |
| Caption 0,30–0,44x; TTS 0,12–0,75x median 0,32x/0,44x; bgremove 0,43 fps (RESULTS.md §2–§4) | **Đứng, CPU-only.** Chưa có GPU để thay đổi chúng; faster-whisper/TTS/rembg trên VM này vẫn chạy CPU. |
| Preview 1,4–4,6 fps, 1080p 7–10 fps (RESULTS.md §5, đợt 52 I9) | **Đứng, chỉ đúng Chromium trên VM oversubscribed không GPU.** Đã ghi rõ không đại diện máy người dùng; nay thêm: chưa đo trên WebKit (không có FPS meter chạy trên WebKit trong đợt này). |
| GPU encode chưa từng chạy thành công trên phần cứng thật (RESULTS.md §8.2) | **Đứng — đo lại hôm nay, vẫn 0 frame ở cả 4 encoder.** Đây là lần xác nhận thứ 3 (R3, Phase 8, E8). |
| "Khoảng cách hiệu năng chủ yếu là khoảng cách phần cứng; CapCut dùng GPU encode/preview" (RESULTS.md §6) | **Đứng ở mức ước tính.** Vế VCut (không có GPU encode) đã đo lại; vế CapCut vẫn là ước tính từ tài liệu công khai, chưa có số đo đối chứng cùng máy. |
| Mask render 0,97 fps; denoise 9,24 fps; proxy 720p 21% dung lượng (§7) | **Đứng, CPU-only.** Chưa đo lại trong đợt này (ngoài phạm vi E8). |
| A7: trần 90 s không ràng buộc; keyframe > 90 s nội suy đúng | **Đứng** (chứng minh bằng code + test, không phụ thuộc engine đo). |
| A7 S1: nhãn MIME media mẫu theo `rec.mimeType` | **Đứng trên Chromium** (B3 đo thật: blob `video/webm`). Nhánh Safari `.mp4` vẫn mock-only; **thêm giới hạn mới: WebKitGTK không có MediaRecorder nên không ghi được mẫu nào**. |
| A7 S2/S3/S4: fallback roundRect / backdrop-filter / 100dvh | **Đứng.** WebKit mới hỗ trợ cả ba API nên fallback không kích hoạt ở đây; rủi ro chỉ còn trên Safari cũ (< 16 / < 18 / < 15.4) — chưa đo. |
| A7 S5: VP9/AV1 có thể không phát được trên Safari cũ | **Vẫn mở, chưa đo được Safari cũ.** WebKit mới phát được (nhờ GStreamer) không bác bỏ được rủi ro này. Codec-probe lúc import (B3) vẫn là lớp bảo vệ đúng — và nay đã xác nhận nó trả lời trung thực theo từng engine (Chromium: HEVC unsupported; WebKit: mọi thứ supported). |
| B3: codec-probe verdict Chromium (HEVC unsupported, AV1/H.264/VP9 supported) | **Đứng, đo lại giống hệt trên Chromium 158** (ma trận + phát thật 4/5). |
| D8: codec-probe debts (race/Escape/badge) | **Không đo lại trong đợt này** (đã kiểm chứng headed Chromium ở D8; ngoài phạm vi E8). |
| "Không có Safari/WebKit thật trên VM" (A7 §4, B3 §4.7) | **Một nửa đã đóng:** WebKit thật nay đo được (driver đã có); **Safari thật vẫn chưa đo.** |

## 7. Nợ mở cho đợt sau

1. **Safari thật vẫn chưa đo** — cần máy macOS/iOS thật hoặc
   dịch vụ cloud có Safari: (a) ma trận VP9/WebM/AV1/HEVC theo
   phiên bản Safari (S5); (b) `MediaRecorder` mặc định + tên
   mẫu `.mp4` trên Safari thật (S1/B3 — hiện chỉ mock);
   (c) roundRect fallback trên Safari < 16 (S2); (d) trial-decode
   keyframe lớn bằng VideoDecoder Safari.
2. **GPU thật vẫn chưa đo** — cần máy có NVIDIA/Intel/Apple
   Silicon: (a) render 1080p hwaccel vs CPU-only trên cùng
   project; (b) NVENC/VAAPI/QSV/VideoToolbox qua render worker
   (detect + fallback đã có từ Phase 7 P2, chưa từng chạy
   thành công); (c) preview FPS + decode có GPU.
3. **Số tuyệt đối RESULTS.md mang nhãn máy cũ** (2 vCPU 7D13):
   khi VM đã là 4 vCPU 9D25, các đợt benchmark sau nên ghi rõ
   cấu hình lúc đo và không so số tuyệt đối chéo máy.
4. **WebKitGTK `MediaRecorder` vắng** (W1): nếu muốn hỗ trợ
   WebKitGTK/Linux, ghi mẫu cần đường khác (vd canvas → frames
   → FFmpeg phía server) — ngoài phạm vi E8, chỉ ghi nhận.
5. **`ctx.filter` vắng trên WebKitGTK** (W2): không dùng canvas
   filter trong code mới nếu muốn chạy được trên WebKit.
6. **Đo WebCodecs sau này phải dùng Chromium full build /
   headed**, không dùng headless shell (§5.2).
7. `ci-security.yml` / `ci-build.yml` vẫn 403 (nợ chung,
   không thuộc đợt này).

## 8. Files (stage, KHÔNG push)

- Mới: `docs/PHASE9_ROUND77_E8_GPU_SAFARI_LIMITS.md` (file này).
- Mới: `benchmarks/render/gpu_safari_probe_77e8.mjs` — script đo
  WebKit-vs-Chromium (canPlayType/MSE/VideoDecoder/feature-check
  + phát file thật); chạy `node benchmarks/render/gpu_safari_probe_77e8.mjs`
  (cần clip test ở `$E8_CLIPS_DIR`, mặc định `/tmp/e8/clips` —
  clip không stage theo quy định không binary).
- Mới: `benchmarks/results/webkit-safari-probe-77e8.json` — kết
  quả thô cả 2 engine (đo 2026-11-09T20:46:40Z).
- Không sửa production. Không binary. Không workflow.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round77-e8-gpu-safari.txt`.
