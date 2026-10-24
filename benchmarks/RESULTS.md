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

**CHƯA ĐO** — môi trường benchmark không có browser thật. Script đo thủ công:
`benchmarks/preview/bench_preview.js` (paste vào DevTools Console khi đang play
project 1080p có LUT + effect). Mục này sẽ điền khi có số đo trên máy thật.

## 6. So sánh với CapCut (ƯỚC TÍNH — đọc kỹ cảnh báo)

> ⚠️ CapCut không công bố benchmark. Các dòng dưới đây tổng hợp từ tài liệu chính thức
> của CapCut (help center) và báo cáo cộng đồng; **không phải số đo**, và phần lớn
> lợi thế của CapCut đến từ **GPU** — thứ máy test này không có.

| Hạng mục | VCut (đo thật, 2 vCPU, không GPU) | CapCut (ước tính, máy người dùng điển hình có GPU) |
|---|---|---|
| Render 1080p | 8.6 fps (veryfast) / 6.3 fps (mặc định) | Nhanh hơn realtime nhờ encode phần cứng GPU (NVENC/QuickSync/VideoToolbox) — tài liệu CapCut xác nhận dùng hardware acceleration cho encode/decode/preview |
| Render 4K | 2.7 fps | Chậm hơn 1080p đáng kể kể cả có GPU; bản web render bằng cloud, bản desktop "nhanh nhất" theo CapCut |
| Auto-caption | 0.3–0.44x realtime (local, offline) | Cloud (web) hoặc on-device neural engine (mobile) — tốc độ phụ thuộc server/thiết bị, không công bố con số; **VCut hơn ở điểm: chạy offline 100%, không gửi audio lên server** |
| TTS | ~0.44x realtime tổng thể trên CPU yếu (local) | Chủ yếu giọng cloud — gần như tức thì với người dùng nhưng cần internet + tài khoản, nhiều giọng khóa sau gói Pro |
| Xóa nền | 0.43 fps (u2net, CPU) | AI cloud/on-device, xử lý clip ngắn trong vài giây–vài chục giây trên thiết bị hiện đại (ước tính cộng đồng) |
| Preview | Chưa đo | 30–60 fps trên máy có GPU (mục tiêu thiết kế của mọi NLE) |

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
