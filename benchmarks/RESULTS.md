# RESULTS.md — Kết quả benchmark VCut Studio

> Mọi số liệu VCut trong file này là **số đo thật** trên máy test ghi dưới đây (ngày đo: 2026-10-20).
> Mọi số liệu CapCut đều là **ƯỚC TÍNH** từ tài liệu/cộng đồng công khai — CapCut/ByteDance
> không công bố benchmark chính thức và không có số đo CapCut trên cùng máy này.
> Đọc kèm `BENCH_LIMITS.md` trước khi trích dẫn.

## Cấu hình máy test

| Hạng mục | Giá trị |
|---|---|
| CPU | AMD EPYC 7D13 (VM giới hạn **2 vCPU**) |
| RAM | 7.8 GB (không swap) |
| GPU | **Không có** (CPU-only toàn bộ) |
| OS | Linux (Ubuntu 24.04, kernel VM) |
| FFmpeg | 8.1.2 |
| Model AI | faster-whisper `small` (462MB), VieNeu-TTS 0.5B (v3 Turbo), rembg u2net |

> ⚠️ Máy này yếu hơn nhiều so với laptop người dùng thông thường (8-16 nhân + GPU).
> Số tuyệt đối thấp là do phần cứng, không phản ánh đầy đủ hiệu năng trên máy thật.

## 1. Render (FFmpeg x264, spec: 2 clip + fade transition + text overlay)

| Độ phân giải | Độ dài | Preset/CRF | Thời gian | FPS | RT factor |
|---|---|---|---|---|---|
| 1280×720 (720p) | 10s | veryfast/23 | 19.9s | **15.06 fps** | 0.50x |
| 1920×1080 (1080p) | 10s | veryfast/23 | 35.0s | **8.58 fps** | 0.29x |
| 3840×2160 (4K) | 10s | veryfast/23 | 110.5s | **2.71 fps** | 0.09x |
| 1920×1080 (1080p) | 10s | **medium/20 (mặc định app)** | 47.9s | **6.26 fps** | 0.21x |

Đọc số liệu:
- Trên 2 vCPU, render chạy chậm hơn realtime ở mọi độ phân giải (RT < 1).
- Tỉ lệ nghịch gần tuyến tính theo số pixel: 4K (8.3M px) chậm ~5.5 lần 720p (0.92M px).
- Preset mặc định của app (medium/CRF20) chậm hơn veryfast ~37% ở 1080p — đổi lại chất lượng cao hơn.
- Trên máy 8 nhân điển hình, x264 scale gần tuyến tính theo số nhân → 1080p veryfast
  dự kiến ~30-35 fps (≈ realtime). Đây là **suy luận từ đặc tính x264**, không phải số đo.

## 2. Caption (faster-whisper small, CPU, audio giọng nói TTS tiếng Việt)

| Audio | Độ dài audio | Thời gian xử lý | RT factor | Ghi chú |
|---|---|---|---|---|
| tts_long.wav | 18.33s | 213.1s | 0.086x | Run đầu: gồm **cold-start load model** (~3 phút) |
| tts_medium.wav | 7.36s | 16.6s | **0.44x** | Steady-state |
| tts_short.wav | 4.00s | 13.4s | **0.30x** | Steady-state |

- Steady-state: **0.30–0.44x realtime** trên 2 vCPU. Transcribe đúng nội dung
  (long: 10 segments, medium: 4, short: 2 — khớp số câu của văn bản gốc).
- Cold-start lần đầu tốn ~3 phút load model — bridge giữ model trong RAM nên
  các lần gọi sau không chịu chi phí này.
- Trên máy mạnh hơn (8 nhân), faster-whisper small thường đạt 1–3x realtime theo
  tài liệu của dự án faster-whisper (**ước tính**, không đo ở đây).

## 3. TTS (VieNeu-TTS 0.5B v3 Turbo, CPU, watermark tắt)

| Văn bản | Ký tự | Audio ra | Thời gian | RT factor | Ký tự/giây |
|---|---|---|---|---|---|
| Ngắn | 70 | 4.00s | 43.9s | 0.09x | 1.6 |
| Vừa | 147 | 7.36s | 37.3s | 0.20x | 3.9 |
| Dài | 376 | 18.33s | 41.9s | **0.44x** | **9.0** |

- Mỗi lần gọi CLI là 1 process mới → **mọi run đều gồm ~30-35s load model**.
  RT factor tăng theo độ dài văn bản vì chi phí cố định được khấu hao.
- Ước lượng tốc độ suy luận thuần (trừ load): văn bản dài đạt ~0.44x realtime tổng thể;
  phần sinh audio chiếm ~7-12s cho 18.3s audio → **~1.5-2.5x realtime khi model đã nạp**
  (suy ra từ số đo, ghi rõ là suy luận).
- Kết luận thực dụng: nên giữ TTS server sống (bridge đã làm vậy qua job queue)
  thay vì spawn process mới mỗi lần.

> **⚠️ ĐÍNH CHÍNH 08/11/2026 (đợt 60 Q9):** suy luận "~1,5–2,5x realtime khi
> model đã nạp" ở trên **đã bị bác bỏ** bằng đo thật đợt 49–50 (F3):
> tốc độ infer thuần sau warmup (chưa tính nạp model ~10–12,5 s) chỉ
> **0,12–0,75× realtime, median 0,32× (đợt 49) / 0,44× (đợt 50), 72 lần
> đo** trên VM này, cho cả 25 giọng (hệ số theo giọng đã đo lặp ở đợt
> 51 H1/H2, 52 I1). Số ~1,5–2,5× cũ suy ra từ phép trừ thời gian load
> model là sai. Đoạn suy luận cũ giữ nguyên làm hồ sơ — không trích dẫn
> nữa. Chi tiết: `docs/PHASE9_ROUND50_F3_TTS_LIMITS.md`,
> `docs/PHASE9_ROUND51_H1_TTS_CURVE_LIMITS.md`,
> `docs/PHASE9_ROUND52_I1_TTS_SAMPLES_LIMITS.md`. Xem thêm §9.

## 4. BgRemoval (rembg, session u2net, video người thật 720p, max-side 960)

| Video | Frames | Thời gian | FPS |
|---|---|---|---|
| 3s | 90 | 290.5s | 0.31 fps (gồm tải + load model lần đầu) |
| 10s | 300 | 704.3s | **0.43 fps** (steady-state) |

- Steady-state **~0.43 fps ≈ 2.3 giây/frame** trên 2 vCPU.
- Session mặc định của app là **birefnet-general** (chất lượng cao hơn) nhưng
  **bị OOM trên máy 8GB** → benchmark dùng u2net (fallback chính thức).
  Trên máy ≥16GB RAM hoặc có GPU, birefnet-general chạy được và chất lượng mask
  tốt hơn hẳn; tốc độ khi đó **chưa đo được** trong đợt này.
- Đây là pipeline chậm nhất của VCut trên CPU yếu: xóa nền 1 phút video 30fps
  ≈ 70 phút xử lý. Thực tế chỉ nên dùng cho clip ngắn trên máy yếu.

## 5. Preview FPS

**ĐÃ ĐO (đợt 52 I9, 2026-11-06)** — Chromium thật (headless + headed Xvfb), viewport
1440×900, canvas preview 872×276 (dpr=1), VM 4 vCPU không GPU. Chi tiết đầy đủ:
`docs/PHASE9_ROUND52_I9_PREVIEW_FPS_LIMITS.md`; JSON từng lần đo trong
`benchmarks/results/preview-fps-r52-*.json`.

- **Nhẹ/vừa/nặng (webm 640×360 + LUT/effect/transition/text): ~1,4–4,6 fps khi phát**
  (dev lẫn prod, headless lẫn headed; phương sai lớn theo từng lần chạy: cùng project vừa
  trên prod cho 1,43 / 4,09 / 4,59 fps). Tạm dừng: ~19,7 fps. Trang trống: ~32,5 fps.
- **Clip 1080p 1 clip trơn: proxy ON 9,8 / 10,5 fps; gốc 1080p 7,0 / 8,2 fps**
  (2 lần đo mỗi arm) — proxy nhanh hơn ~25–40% nhưng vẫn << 30 fps.
- **Điểm nghẽn là môi trường, không phải code vẽ:** mỗi tick preview chỉ 3–20ms
  thread-time (CDP trace `tdur`) nhưng wall-time 70–1100ms/frame vì main thread /
  compositor / GPU process bị OS deschedule trên VM oversubscribed (load 1–26 do luồng
  khác). Loại trừ: decode (text-only vẫn 1,47 fps), LUT/effect (nhẹ vẫn 1,59 fps),
  raster (ẩn canvas vẫn 1,56 fps), kích thước canvas, JS bão hòa (steady-state 94,9% idle).
- **Tối ưu đã thử:** `desynchronized: true` trên canvas 2D — không cải thiện nên đã revert;
  hoãn AudioContext — đã warm sẵn ở pointerdown nên không làm. Không còn thay đổi code app.
- **Caveat:** số prod đo với media mẫu thiếu trên origin `:4173` (chỉ có trên `:5173`);
  proxy chỉ sống trong phiên (mất sau reload). Số này **không dùng được để kết luận VCut
  chậm trên máy người dùng** — cần đo lại trên máy thật có GPU.

Script đo thủ công cũ: `benchmarks/preview/bench_preview.js` (paste vào DevTools Console
khi đang play project 1080p có LUT + effect). Harness mới: `apps/web/scripts/bench-preview-fps.mjs`
(seed autosave, đo rAF 6s + timer 16ms song song + CPU/loadavg) và
`apps/web/scripts/measure-1080p-proxy.mjs` (proxy ON/OFF cùng phiên).

## 6. So sánh với CapCut (ƯỚC TÍNH — đọc kỹ cảnh báo)

> ⚠️ CapCut không công bố benchmark. Các dòng dưới đây tổng hợp từ tài liệu chính thức
> của CapCut (help center) và báo cáo cộng đồng; **không phải số đo**, và phần lớn
> lợi thế của CapCut đến từ **GPU** — thứ máy test này không có.

| Hạng mục | VCut (đo thật, 2 vCPU, không GPU) | CapCut (ước tính, máy người dùng điển hình có GPU) |
|---|---|---|
| Render 1080p | 8.6 fps (veryfast) / 6.3 fps (mặc định) | Nhanh hơn realtime nhờ encode phần cứng GPU (NVENC/QuickSync/VideoToolbox) — tài liệu CapCut xác nhận dùng hardware acceleration cho encode/decode/preview |
| Render 4K | 2.7 fps | Chậm hơn 1080p đáng kể kể cả có GPU; bản web render bằng cloud, bản desktop "nhanh nhất" theo CapCut |
| Auto-caption | 0.3–0.44x realtime (local, offline) | Cloud (web) hoặc on-device neural engine (mobile) — tốc độ phụ thuộc server/thiết bị, không công bố con số; **VCut hơn ở điểm: chạy offline 100%, không gửi audio lên server** |
| TTS | **0,12–0,75× realtime, median 0,32×/0,44× (72 lần đo, đợt 49–50 — đính chính 06/11; số cũ ~1,5–2,5× đã bị bác bỏ, xem §3 + §9)** trên CPU yếu (local) | Chủ yếu giọng cloud — gần như tức thì với người dùng nhưng cần internet + tài khoản, nhiều giọng khóa sau gói Pro |
| Xóa nền | 0.43 fps (u2net, CPU) | AI cloud/on-device, xử lý clip ngắn trong vài giây–vài chục giây trên thiết bị hiện đại (ước tính cộng đồng) |
| Preview | **1,4–4,6 fps trên VM test** (nhẹ/vừa/nặng, 2026-11-06, đợt 52 I9); 1080p 1 clip trơn 7–10 fps, proxy 720p 9,8–10,5 fps — **số VM oversubscribed, không đại diện máy người dùng** (xem §5) | 30–60 fps trên máy có GPU (mục tiêu thiết kế của mọi NLE) |

### Kết luận trung thực

1. **Khoảng cách hiệu năng hiện tại chủ yếu là khoảng cách phần cứng**: CapCut khai thác
   GPU (encode phần cứng + preview GPU), VCut hiện chạy thuần CPU/FFmpeg software.
   Trên cùng một máy không GPU, chênh lệch sẽ thu hẹp nhiều — nhưng chưa có số đo đối chứng.
2. **Điểm nghẽn lớn nhất của VCut**: (a) chưa có GPU encode (NVENC/VAAPI/QSV) trong render
   worker — đây là nâng cấp hiệu năng đáng giá nhất; (b) xóa nền quá chậm trên CPU yếu;
   (c) cold-start model AI (whisper/TTS) nếu spawn process mới mỗi lần.
3. **Điểm VCut không thua**: mọi tính năng AI đều chạy **local/offline**, không phụ thuộc
   server, không giới hạn lượt dùng, không khóa tính năng sau paywall — đổi lại người dùng
   cần máy đủ mạnh.
4. Muốn so sánh công bằng cần: cùng một máy có GPU, cùng một project mẫu, đo cả hai.
   Đợt benchmark này chưa làm được việc đó — ghi rõ để không ai trích dẫn sai.

---

## 7. Phase 8 refresh (2026-10-24) — proxy + tính năng Phase 7

> Máy đo: cùng VM như mục trên (AMD EPYC 7D13, 2 vCPU, 7.8GB RAM, không GPU,
> FFmpeg 8.1.2). Spec khác đợt 2026-10-20: **clip 5s, 1 video + text overlay**
> (đợt cũ: 10s, 2 clip + fade) — **không so sánh trực tiếp 2 đợt theo số tuyệt đối**.
> Mỗi cấu hình: 1 warm-up + 1 lần đo. Số liệu thô: `benchmarks/results/phase8.jsonl`.
> Script: `benchmarks/render/bench_phase8.sh`.

### 7.1 Render với tính năng Phase 7 (veryfast/CRF23, testsrc2)

| Cấu hình | Độ dài | Wall | FPS | Ghi chú |
|---|---|---|---|---|
| base-720p (1 clip + text) | 5s | 4.39s | **34.15 fps** | baseline mới |
| base-1080p (1 clip + text) | 5s | 11.96s | **12.54 fps** | baseline mới |
| mask-720p (+ mask ellipse, feather 0.2) | 5s | 154.59s | **0.97 fps** | ⚠️ xem cảnh báo dưới |
| denoise-720p (+ enhance denoise 0.5) | 5s | 16.24s | **9.24 fps** | hqdn3d |
| ramp-720p (+ speedKeyframes 1 → 1.5) | 5s | 16.33s | **9.19 fps** | split segment + concat |

**⚠️ Mask render cực chậm là số thật, không phải lỗi đo.** Mask dùng `geq`
tính alpha từng pixel mỗi frame (feather làm biểu thức nặng thêm) — 720p 5s
mất 154.6s, chậm ~35× so với baseline cùng spec. Mask tĩnh không feather
sẽ nhanh hơn (chưa đo riêng); hướng tối ưu tương lai: tạo alpha mask
1 lần bằng PNG rồi overlay thay vì `geq` mỗi frame. Cho đến lúc đó, **không
nên mask clip dài trên máy yếu** — đây là giới hạn đã ghi trong Q8/P4 docs.

**Độ biến động giữa các lần chạy (ghi rõ để khỏi trích sai):** lần chạy đầu
tiên của đợt này — khi các agent Phase 8 khác đang chạy test render cùng lúc
trên VM — cho base-720p **7.17 fps** và base-1080p **5.92 fps** (chậm 2–5× so
với lần chạy lại). Số bảng trên là lần chạy lại khi VM rảnh hơn. Kết luận:
số tuyệt đối trên VM chia sẻ chỉ mang tính tham chiếu, không phải lab-grade.

### 7.2 Proxy generation (Q8)

| Nguồn | Đích | Thời gian | Dung lượng |
|---|---|---|---|
| 1080p 10s testsrc2 (6.4MB) | 720p proxy, CRF 23, veryfast | 21.55s | 1.3MB (**21%** nguồn) |

Proxy giữ nguyên fps/duration nguồn (đồng bộ 1:1 với timeline). Export cuối
**không dùng proxy** — đã chứng minh bằng test `server/render/test_proxy_q8.js`
(spec trỏ file gốc trong thư mục đã có proxy → output vẫn 1920×1080).

### 7.3 Preview perf — logic thuần bằng Node (KHÔNG phải FPS browser)

> ⚠️ Các số dưới đây đo bằng Node (`apps/web/scripts/bench-preview-perf.cjs`),
> chỉ tính hàm `videoClipVisual` + `videoElementPlacement` (không DOM, không
> decode video, không canvas). **Không được trích dẫn như "preview nhanh hơn X
> lần trên trình duyệt"** — FPS browser thật vẫn CHƯA ĐO (mục 5 giữ nguyên).

| Bài đo | Kết quả |
|---|---|
| Scrub/vẽ lại cùng frame (memo keyframe, 30 thời điểm × 300 rep) | 163.2ms, hits 80,850 / misses 150 |
| Nội suy thô không memo (81,000 lần gọi, cùng số lần nội suy) | 531.2ms → memo nhanh hơn **~3.25×** ở phần nội suy |
| (Chạy lại kiểm chứng, VM rảnh hơn) | Run 1: 42.9ms, raw: 181.4ms → tỉ lệ ~4.2×; cấu trúc hit/miss **không đổi** (80,850/150; playback 36,145/44,855) — số tuyệt đối dao động theo tải VM, tỉ lệ và hit/miss mới là phần ổn định |
| Playback nối tiếp 30fps, 9,000 frame | 752.4ms; hits 36,145 / misses 44,855 (≈44.6% nội suy được chia sẻ trong cùng 1 frame) |
| `mediaByName`: build Map mới mỗi tick vs cache theo identity mảng (6,000 lần, 500 item) | 304.2ms → 0.9ms cho micro-op này |

**Kết luận trung thực:** memo keyframe giúp rõ rệt khi scrub/pause/vẽ lại và
giảm ~45% số lần nội suy khi playback (nhờ chia sẻ trong cùng 1 frame), nhưng
**không biến playback xuôi đều thành nhanh hơn nhiều lần** — mỗi frame mới vẫn
phải tính mới. Nút thắt thật của preview trên browser (decode video, `ctx.filter`,
canvas full-res) nằm ngoài phạm vi đo này.

### 7.4 Những gì Phase 8 refresh KHÔNG làm (không claim)
- Không refresh 4K (số 4K 2.71 fps từ 2026-10-20 giữ nguyên làm tham chiếu).
- GPU encode (NVENC/QSV/VAAPI) vẫn **chưa test trên phần cứng thật** — VM không
  có GPU, chỉ logic detect + fallback đã verify ở Phase 7 P2.
- FPS preview trên browser thật vẫn chưa đo (cần browser + đo tay).

## 8. Phase 9 R3 — Preview FPS thật (headless) + GPU encode harness + proxy tự động

> Đo ngày 2026-10-24 trên VM 2 vCPU, 8GB RAM, không GPU, Chromium headless
> (Playwright cache chromium-1248), project mẫu 8s (2 video + 1 text).
> Script: `apps/web/scripts/bench-preview-fps.mjs` (đếm rAF khi bấm Phát),
> số thô: `benchmarks/results/preview-fps.json` (10s) và
> `benchmarks/results/preview-fps-5s.json` (5s).

### 8.1 Preview FPS headless — kết quả

| Lần chạy | Cửa sổ đo | FPS trung bình | FPS min (cửa sổ 1s) | FPS max (1s) | Frame giật (>50ms) | Playhead trong cửa sổ |
|---|---|---|---|---|---|---|
| 5s (sạch nhất) | 5s, đang phát giữa project | **13.4** | 5 | 18 | 51/68 khoảng | 0.6s → 5.1s (phát gần realtime, nhưng canvas chỉ vẽ ~13fps) |
| 10s | 10s, dài hơn phần còn lại của project (đuôi có idle ở cuối) | 28.46 | 9 | 61 | 53 | 1.7s → 8.0s (tới cuối project) |
| Đầu tiên | 10s | 16.01 | 5 | 60 | 28 | (chỉ có log terminal — file JSON đã bị các lần chạy sau ghi đè) |

**Đọc số đúng cách:**
- Preview trên VM headless này GIẬT RÕ: ở lần chạy sạch nhất, 75% khoảng
  giữa các frame vượt 50ms, FPS trung bình chỉ ~13. Nguyên nhân khả dĩ
  (chưa tách được): decode video phần mềm trên 2 vCPU + canvas filter +
  tải VM chia sẻ (nhiều agent Phase 9 chạy cùng lúc) — 3 lần chạy cho 3 số
  khác nhau xa (13.4 / 16.01 / 28.46) đã chứng minh độ nhiễu.
- **KHÔNG được trích các số này thành "VCut preview chỉ 13fps"** — đây là
  headless, không màn hình thật, không GPU, VM yếu và đang tải nặng. Cần đo
  lại trên máy thật / trình duyệt thật và khi VM rảnh để có baseline ổn định.
- FPS meter trong editor: nút "📈 FPS" góc phải dưới (component
  `apps/web/src/components/PerfOverlay.tsx`) — đo rAF của app, không phải
  draw call trực tiếp của canvas preview (brief R3 cấm sửa preview.tsx).

### 8.2 GPU encode — VẪN CHƯA test trên phần cứng thật

Harness: `benchmarks/render/gpu_encode_harness.sh`, số thô:
`benchmarks/results/gpu_encode.jsonl`. Kết quả trên VM này:
- Encoder có trong build FFmpeg 8.1.2: h264_nvenc, hevc_nvenc, h264_qsv,
  h264_vaapi đều liệt kê được.
- Phần cứng: **không có** — không `nvidia-smi`, không `/dev/dri`.
- Encode thật: cả 4 đều thất bại (nvenc/hevc_nvenc exit 255, qsv exit 171,
  vaapi exit 218; đều lỗi -22 Invalid argument do thiếu thiết bị).
- Kết luận: logic detect + fallback CPU của Phase 7 P2 vẫn là phần duy nhất
  đã verify; **GPU encode chưa từng chạy thành công trên phần cứng thật**.

### 8.3 Proxy tự động khi import — đã kiểm chứng end-to-end

Script: `apps/web/scripts/check-proxy-auto.mjs`. Kết quả: checkbox "Tự tạo
proxy 720p khi import video" mặc định BẬT; nạp video test 1080p 3s qua input
của MediaBin → trạng thái tự chuyển sang "✓ PROXY 720p" (bridge tạo proxy
thật, preview dùng proxy, export vẫn dùng file gốc theo cam kết Q8).
Tắt checkbox (lưu localStorage `vcut-auto-proxy`) thì không tự tạo nữa.

## 9. Phase 9 đợt 52/59 refresh (2026-11-06/07) — Enhance FPS + trial-decode + đính chính TTS

> Số trong mục này lấy từ LIMITS của luồng đo, không đo lại trong đợt
> docs-only 08/11. Preview FPS đợt 52 I9 đã có ở §5 — không lặp lại ở đây.

### 9.1 Enhance render FPS thật 720p (đợt 59 P9, 07/11)

Harness: `server/render/src/test_round59_p9_enhance_render.js` (52 pass,
0 fail). Cấu hình khớp RESULTS §7.1 (veryfast/CRF23, 720p 5s = 150 frame,
FPS = 150 / wall end-to-end, gồm cả pass vidstabdetect với stabilize và
thời gian khởi động node). Nguồn testsrc2; xem chi tiết nguồn từng hàng
trong `docs/PHASE9_ROUND59_P9_ENHANCE_RENDER_LIMITS.md` §3.

| Cấu hình | Wall (lượt P9) | FPS (lượt P9) | FPS (chạy lại lúc gộp) |
|---|---|---|---|
| baseline (testsrc2 sạch, không enhance) | 3.13s | **47.86** | **53.23** |
| denoise 0.5 (testsrc2 + nhiễu) | 12.45s | **12.05** | **14.68** |
| denoise 1.0 (testsrc2 + nhiễu) | 18.55s | **8.09** | — (không chạy lại) |
| stabilize smoothing 30 (shaky upscale) | 21.99s | **6.82** | **20.45** |
| deinterlace (yadif mode 0) | 6.07s | **24.70** | **48.42** |
| combo cả ba (deint + stab 30 + denoise 0.5) | 42.99s | **3.49** | **7.06** |

Đọc số đúng cách:
- **Số tuyệt đối dao động mạnh theo tải VM** (±30–40% giữa 2 lần chạy:
  stabilize 6,82 → 20,45; deinterlace 24,70 → 48,42). **Chỉ tỉ lệ/hướng
  so sánh trong cùng một lượt chạy mới ổn định:** mọi enhance đều chậm
  hơn baseline, combo chậm nhất.
- So với Phase 8 (§7.1): denoise-720p khi đó **9.24 fps** (16.24s, clip
  5s + text overlay). Đợt này denoise 0.5 đo **12.05 fps** (không text
  overlay, nguồn testsrc2 + nhiễu) — cùng bậc độ lớn, **không so trực
  tiếp theo số tuyệt đối** vì cấu hình spec khác.
- Phát hiện ngược trực giác (lặp lại ổn định ở cả 3 lần đo): trên nguồn
  testsrc2 + nhiễu, denoise 0.5 (**12.05 fps**) render NHANH hơn đối
  chứng không enhance (**6.26 fps**) — nhiễu làm x264 tốn kém (output
  đối chứng 11.3MB so với 4.5MB sau denoise); hqdn3d khử nhiễu trước nên
  encoder nhẹ việc hơn nhiều so với chi phí của chính filter. Trên nền
  xám phẳng + nhiễu thì ngược lại: denoise 0.5 (**5.14 fps**) CHẬM hơn
  đối chứng phẳng (**6.38 fps**).
- Khác biệt output đo lại khớp: flat std 4,439 → 1,986 sau denoise; idet
  prog 0,000 → 0,993 sau deinterlace; frame diff stabilize-vs-control
  mean 12,789 (lượt P9: 13,913).
- Chưa đo: FPS enhance lặp lại nhiều lần, enhance ở 1080p, render MP4
  cho đúng combo preset (nợ ROUND59 §6.9).

### 9.2 GOP trial-decode — cap 32 MiB + tốc độ decode thật (đợt 59 P6, 07/11)

Nguồn: `docs/PHASE9_ROUND59_P6_LARGE_SAMPLE_LIMITS.md`. Đo headed thật
(Xvfb, Chromium, VM đang tải do các luồng đợt 59 chạy song song).

- Cap trial-decode stream-mode nâng **8 → 32 MiB**
  (`MAX_TRIAL_DECODE_SAMPLE_BYTES`), chunked fetch 512 KiB (tối đa
  64 chunk), không tải toàn bộ file vào RAM (đỉnh heap ≈ sample + 1 chunk).
- Timeout theo kích thước KHÔNG đổi (O6: 0,3 ms/KiB trên 256 KiB, trần
  2500 ms — sample ≥ ~7,7 MiB đều chạm trần).
- Decode trực tiếp (median): keyframe thật 9,68 MiB → **1905 ms**
  (decode-ok, nay có verdict thay vì bị bỏ qua); 19,72 MiB → **2853,8 ms**;
  30,73 MiB → **5090,5 ms** (cả hai timeout 2500 ms → fail-open).
  Tốc độ decode ≈ **0,149 ms/KiB** (khớp O6).
- Rác 12 MiB ngẫu nhiên fail trong ~7 ms → verdict false 3/3 (rác lớn nay
  có verdict thật thay vì bị bỏ qua).
- 8K (7680×4320) decode được thật, không unsupported-config.
- Còn lọt: keyframe thật ≳16 MiB vẫn timeout → fail-open (trần 2500 ms có
  chủ đích); sample >32 MiB vẫn bỏ qua; keyframe đục lỗ giữa vẫn decode
  OK (trial-decode không bắt); chưa đo Safari/Firefox.

### 9.3 TTS — đính chính số (đợt 49–50, xác nhận 06/11)

Nguồn: `docs/PHASE9_ROUND50_F3_TTS_LIMITS.md` (+ H1/H2 đợt 51,
I1 đợt 52). Số cũ trong §3 ("~1,5–2,5× realtime khi model đã nạp") và
§6 ("~0.44x tổng thể") đã được đính chính — xem hộp cảnh báo ở §3.

- Tốc độ infer thuần sau warmup (chưa tính nạp model ~10–12,5 s):
  **0,12–0,75× realtime; median 0,32× (đợt 49) / 0,44× (đợt 50)**,
  **72 lần đo**, trên VM này (2 vCPU, không GPU), cho cả 25 giọng
  VieNeu-TTS v3 Turbo.
- Hệ số theo giọng đã đo lặp (đợt 51 H2, đợt 52 I1); mô hình đường cong
  theo giọng thay ngưỡng nhị phân 13% (đợt 51 H1).
