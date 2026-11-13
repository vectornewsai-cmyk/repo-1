# Phase 9 đợt 78 — F10: Nhãn máy benchmark + trạng thái GPU/Safari/CI

Ngày: 10/11/2026, lượt cron 06:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ đợt 77 §4.9 + §4.11 (E8 + LIMITS gộp §4.9/§4.11).
Luồng docs + đo lại, KHÔNG sửa production, KHÔNG push, KHÔNG release/tag,
KHÔNG binary.

**Kết luận ngắn:**
1. **Nhãn máy đã sửa xong** ở 4 file sống (`benchmarks/RESULTS.md`,
   `benchmarks/BENCH_LIMITS.md`, `docs/FEATURE_STATUS.md`, `docs/DESKTOP.md`):
   thêm bảng 4 thế hệ máy vào RESULTS.md; mọi số tuyệt đối giờ mang nhãn thế hệ
   máy; **không sửa bất kỳ số đo nào**. Hai nhãn cũ được đính chính là SAI
   (không chỉ lỗi thời): TTS đợt 49–50 (§9.3) và smoke test Desktop 06/11 đều
   ghi "2 vCPU" trong khi ngày 06/11 VM đã là 4 vCPU.
2. **VM lại đổi host lần nữa:** E8 đo 09/11 là EPYC 9D25; sáng nay 10/11
   `/proc/cpuinfo` là **EPYC 9D64**, vẫn 4 vCPU, 7,7 GB, không GPU. Quy tắc
   mới: benchmark phải ghi cả model CPU + ngày đo, không ghi "VM này" chung chung.
3. **GPU thật vẫn không có — đo lại lần 4, vẫn 0 frame** ở cả 4 encoder
   (vaapi / nvenc / qsv / hevc_vaapi) trên máy 9D64. WebKit 27.2 đo lại:
   phát 5/5 codec, `MediaRecorder` vẫn vắng, `canPlayType` vẫn lạc quan.
   Không có WebKit mới hơn trong cache; Safari thật + GPU thật vẫn cần máy
   khác (xem §5).
4. **CI vẫn 403 — và còn tệ hơn ghi cũ:** kiểm tra qua public API, toàn bộ
   thư mục `.github/workflows/` trên GitHub là **404** — không chỉ 2 file
   ci-security/ci-build, mà cả ci-e2e, ci-integration, release.yml cũng chưa
   từng lên remote. Local có đủ 5 file, đã ghi SHA + hướng dẫn user thêm tay.

## 1. Nhãn máy đã sửa — từng chỗ (số đo KHÔNG đổi)

### 1.1 `benchmarks/RESULTS.md`

| Vị trí | Trước | Sau |
|---|---|---|
| Đầu file | "số đo thật trên máy test ghi dưới đây (ngày đo: 2026-10-20)" | Thêm mục **"Nhãn máy — đọc trước khi trích số tuyệt đối"** với bảng 4 thế hệ máy (xem §2) + quy tắc "số tuyệt đối chỉ so được trong cùng một thế hệ" |
| "Cấu hình máy test" | Không ghi rõ phạm vi áp dụng | Đổi thành "Cấu hình máy test — thế hệ 1 (đo 20/10/2026; áp dụng cho §1–§4)" |
| §1 Render | "Đọc số liệu:" chung chung | Ghi rõ "máy thế hệ 1: 7D13, 2 vCPU — không so trực tiếp với số đo trên máy 4 vCPU ở §5/§9" |
| §2 Caption | "trên 2 vCPU" | "trên 2 vCPU (máy thế hệ 1, đo 20/10)" |
| §4 BgRemoval | "trên 2 vCPU" | "trên 2 vCPU (máy thế hệ 1, đo 20/10)" |
| §5 Preview FPS | "VM 4 vCPU không GPU" | "VM 4 vCPU không GPU (máy thế hệ 2; model CPU không ghi lại lúc đo)" |
| §6 bảng so sánh | Cột "VCut (đo thật, 2 vCPU, không GPU)" | "VCut (đo thật — nhãn máy theo từng dòng; mặc định máy thế hệ 1: 2 vCPU 7D13, không GPU)" |
| §7 Phase 8 | "cùng VM như mục trên (AMD EPYC 7D13, 2 vCPU…)" | "cùng VM thế hệ 1 như mục trên…" |
| §8 Phase 9 R3 | "Đo ngày 2026-10-24 trên VM 2 vCPU…" | "Đo ngày 2026-10-24 trên VM thế hệ 1 (2 vCPU…)" |
| §9 mở đầu | Không có nhãn máy | Thêm: "Máy đo §9: VM 4 vCPU thế hệ 2 (model CPU không ghi lại lúc đo), không GPU" |
| §9.1 Enhance FPS | Tiêu đề không nhãn máy | "…(đợt 59 P9, 07/11 — máy thế hệ 2: VM 4 vCPU, không GPU)" |
| §9.2 GOP trial-decode | Tiêu đề không nhãn máy | "…(đợt 59 P6, 07/11 — máy thế hệ 2: VM 4 vCPU, không GPU)" |
| §9.3 TTS | "trên VM này (2 vCPU, không GPU)" — **SAI** | "trên VM 4 vCPU thế hệ 2 (model CPU không ghi lại lúc đo), không GPU — đo 06/11", kèm hộp đính chính ghi rõ bản cũ sai ở đâu. Số 0,12–0,75× / median 0,32×/0,44× / 72 lần đo **không đổi** |

Hai chỗ trong RESULTS.md còn chữ "2 vCPU" nhưng ĐÃ có nhãn theo ngữ cảnh nên
giữ nguyên: §1 dòng "Trên 2 vCPU, render chạy chậm hơn realtime…" (ngay dưới
ghi chú "máy thế hệ 1") và §8.1 dòng "decode video phần mềm trên 2 vCPU"
(nằm trong §8 đã ghi "VM thế hệ 1" ở đầu mục).

### 1.2 `benchmarks/BENCH_LIMITS.md`

- Mục 1 viết lại hoàn toàn: thay "VM 2 vCPU (AMD EPYC 7D13)" bằng bảng thế hệ
  máy (trỏ sang RESULTS.md) + quy tắc trích số.
- Mục 6: "trên CPU 2 nhân đạt ~0.4x" → ghi rõ máy thế hệ 1 cho số ~0,4× cũ,
  và số infer thuần đính chính 06/11 đo trên VM 4 vCPU thế hệ 2 (trỏ §3 + §9.3).

### 1.3 `docs/FEATURE_STATUS.md` (§8 Xoá nền AI)

- "0.43 fps CPU 2 vCPU" → "0.43 fps (máy thế hệ 1: CPU 2 vCPU 7D13, đo 20/10
  — xem RESULTS.md §4)".

### 1.4 `docs/DESKTOP.md` (§1 smoke test)

- "trên VM này (2vCPU/8GB, Xvfb)" → "4 vCPU/8GB" + đính chính: bản trước ghi
  "2vCPU" là **sai** — theo số đo cùng ngày 06/11 ở RESULTS.md §5 (đợt 52 I9),
  VM lúc đó đã là 4 vCPU. Kết quả smoke (`ok: true`…) không đổi.

## 2. Phát hiện mới: VM đổi host 9D25 → 9D64 trong một đêm

Kiểm tra lúc làm luồng này (10/11 ~06:40 +07):

| Hạng mục | E8 đo 09/11 ~20:46 | F10 đo 10/11 ~06:40 |
|---|---|---|
| `model name` (`/proc/cpuinfo`) | AMD EPYC 9D25 126-Core | **AMD EPYC 9D64 88-Core** |
| `nproc` | 4 | 4 |
| RAM | 7,7 GiB | 7,7 GiB (probe host: 7934 MiB) |
| `/dev/dri`, GPU | Không có | Không có |
| OS/kernel | Ubuntu 24.04.5, kernel 7.0.0-43-generic | kernel 7.0.0-43-generic (uname) |
| FFmpeg | 8.1.2 | 8.1.2 |

Nhãn "9D25" trong docs đợt 77 là **đúng tại thời điểm đo (09/11)**, không phải
nhãn máy hiện tại. Đây là lần đổi host thứ hai được ghi nhận (7D13 → 9D25 →
9D64); lần 7D13 → 9D25 xảy ra giữa 24/10 và 06/11 (không ghi được ngày chính
xác — §5 ngày 06/11 đã là 4 vCPU). Bảng thế hệ máy (RESULTS.md, §1.1):

| Thế hệ | CPU | vCPU | Dùng cho |
|---|---|---|---|
| 1 (20–24/10/2026) | EPYC 7D13 | 2 | RESULTS §1–§4, §7, §8 |
| 2 (06–07/11/2026) | model không ghi lại lúc đo | 4 | RESULTS §5, §9 |
| 3 (08–09/11/2026) | EPYC 9D25 | 4 | E8, đợt 65 S8, đợt 67 U2 |
| 4 (từ 10/11/2026) | EPYC 9D64 | 4 | F10 (đo lại VAAPI/WebKit) |

**Quy tắc mới cho mọi đợt benchmark sau:** ghi cả model CPU (lấy từ
`/proc/cpuinfo`) + `nproc` + ngày đo vào đầu file kết quả; không ghi "VM này"
chung chung; không so số tuyệt đối chéo thế hệ máy. Các file LIMITS lịch sử
(đợt 1–77) KHÔNG sửa ngược — chúng là hồ sơ đúng tại thời điểm đo; chỉ các
file sống (RESULTS.md, BENCH_LIMITS.md, FEATURE_STATUS.md, DESKTOP.md) được
gắn nhãn lại.

## 3. GPU thật — đo lại lần 4 trên máy 9D64: vẫn 0 frame

Lệnh (10/11 ~06:44 +07, nguồn `testsrc2` 1920×1080 2 s, FFmpeg 8.1.2):

| Encoder thử | Kết quả | Lỗi |
|---|---|---|
| `h264_vaapi` (`format=nv12,hwupload`) | 0 frame, không tạo được file | `A hardware device reference is required to upload frames to` / `Error initializing filters` |
| `hevc_vaapi` (cùng filter) | 0 frame, không tạo được file | Như trên; ffmpeg exit **234** |
| `h264_nvenc` | 0 frame, file 0 byte | `Cannot load libcuda.so.1` |
| `h264_qsv` | 0 frame, file 0 byte | `Error creating a MFX session: -9` |

Kiểm chứng: `ffprobe -count_frames` cả 4 file đều không đọc được frame nào
(vaapi/hevc-vaapi không có file; nvenc/qsv 0 byte). `/dev/dri` vẫn không tồn
tại; `nvidia-smi`/`vainfo`/`glxinfo`/`vulkaninfo` vẫn không có lệnh.
**Kết luận:** build FFmpeg có encoder phần cứng nhưng không có thiết bị nào
đứng sau — giống hệt E8 trên máy 9D25. Đây là lần xác nhận thứ 4 (R3, Phase 8,
E8, F10). RESULTS.md §8.2 ("GPU encode chưa từng chạy thành công trên phần
cứng thật") vẫn đứng, không cần sửa.
Lưu ý trung thực: ở lần chạy VAAPI/NVENC/QSV đầu, exit code in ra là 0 do
đo qua pipe `head` — bằng chứng là lỗi + file 0 byte/không có file, không phải
exit code đó. Chỉ `hevc_vaapi` đo exit trực tiếp (234).

## 4. Safari thật / WebKit thật — đo lại trên máy 9D64

Chạy lại script E8 không đổi (`node benchmarks/render/gpu_safari_probe_77e8.mjs
/tmp/e8/out`, clip test tạo lại bằng FFmpeg ở `/tmp/e8/clips`, 320×180 2 s —
clip không stage theo quy định không binary). Kết quả thô mới:
`benchmarks/results/webkit-safari-probe-78f10.json` (10.813 byte,
`measuredAt` 2026-11-09T23:46:24Z = 10/11 06:46 +07).

| Kiểm tra | E8 (09/11, máy 9D25) | F10 (10/11, máy 9D64) |
|---|---|---|
| WebKit version (Playwright webkit-2388) | 27.2 | **27.2 — giống hệt** |
| Chromium version | 158.0.8127.18 | **158.0.8127.18 — giống hệt** |
| WebKit phát 5 codec | 5/5 (readyState 4) | **5/5** (HEVC readyState 3 lần này thay vì 4 — vẫn phát được, 320×180, dur 2 s; khác biệt là timing, không phải fail) |
| Chromium phát 5 codec | 4/5 (HEVC fail) | **4/5 (HEVC fail, readyState 0, netState 3) — giống hệt** |
| WebKit `MediaRecorder` | vắng (`undefined`) | **vẫn vắng (`false`)** |
| WebKit `canPlayType` | `probably` cho mọi codec (kể cả Theora/Matroska) | **giống hệt** |
| WebKit `ctx.filter` | vắng | **vẫn vắng** |
| `navigator.gpu` | WebKit false, Chromium false (headless shell) | **giống hệt** |
| Module worker | WebKit ok-reply:7, Chromium error (headless shell artifact) | **giống hệt** |
| `roundRect` / `backdrop-filter` / `100dvh` / `decodeAudioData` | true / true / true / promise resolve | **giống hệt** (xem JSON) |

**Không có WebKit mới hơn để đo:** cache `~/.cache/ms-playwright/` chỉ có
`webkit-2388` (cùng `chromium-1254/1187`, `firefox-1572`); không apt install /
không tải browser mới theo quy định đợt. Mọi kết luận E8 §2–§6 vẫn đứng nguyên
trên máy mới — khác biệt duy nhất là nhãn máy (9D25 → 9D64).

### Cần máy nào để đo thật (ghi rõ cho user / đợt sau)

| Thứ cần đo | Máy cần có | Vì sao VM này không đo được |
|---|---|---|
| **Safari thật** (ma trận VP9/WebM/AV1/HEVC theo phiên bản; MediaRecorder + tên mẫu `.mp4`; roundRect Safari < 16; trial-decode keyframe lớn bằng VideoDecoder Safari) | Máy macOS/iOS thật (Safari 14–18+) hoặc dịch vụ cloud có Safari (vd BrowserStack/Sauce Labs) | VM Linux; WebKitGTK ≠ Safari shipping (media stack GStreamer thay VideoToolbox; thiếu MediaRecorder; `canPlayType` lạc quan) |
| **GPU thật** (render 1080p hwaccel vs CPU-only cùng project; NVENC/VAAPI/QSV/VideoToolbox qua render worker; preview FPS + decode có GPU) | Máy có NVIDIA (NVENC) / Intel iGPU (QSV/VAAPI) / Apple Silicon (VideoToolbox) | VM không có `/dev/dri`, không VGA device, không `libcuda.so.1`; 4 lần thử đều 0 frame |
| **birefnet-general** (đóng nợ E4/D7) | Máy RAM ≥ 12 GB (hoặc ≥ 6 GiB tối thiểu) | VM 7,7 GB — OOM đã đo |

## 5. CI — trạng thái + hướng dẫn cho user (§4.11)

**KHÔNG thử push file workflow** (cấm push trong phiên nền). Chỉ kiểm tra đọc
qua public API GitHub (GET, không ghi).

### 5.1 Remote: toàn bộ `.github/workflows/` là 404

Kiểm tra 10/11 ~06:40 +07 (repo `vectornewsai-cmyk/repo-1`, HEAD remote
`5f548ef8` — khớp HEAD sau push #4):

| File | Remote (`contents/.github/workflows/<file>`) |
|---|---|
| `ci-security.yml` | **404** |
| `ci-build.yml` | **404** |
| `ci-e2e.yml` | **404** |
| `ci-integration.yml` | **404** |
| `release.yml` | **404** |
| Thư mục `.github/workflows/` | **404 "Not Found"** (toàn bộ thư mục chưa từng lên remote) |

Nghĩa là: **repo trên GitHub hiện không có file workflow nào, không có CI nào
chạy thật** — đúng như MEMORY ghi ("repo không có CI chạy thật"). Đây là hệ
quả của 403 `workflows:write` đã biết từ 22/10, không phải lỗi mới.

### 5.2 Local: đủ 5 file, nội dung cần đẩy

| File local | Kích thước | Sửa lần cuối | SHA-256 |
|---|---|---|---|
| `.github/workflows/ci-security.yml` | 3005 byte | 08/11 02:57 | `fe1740dcc16470862921ac893f16f74452fff319043002ab4b21ecd269015c25` |
| `.github/workflows/ci-build.yml` | 4858 byte | 08/11 17:54 | `9e1dd333d3d9344b1aaa2767a28fe1840da7b63bd282330ff002d2262a1f3adb` |
| `.github/workflows/ci-e2e.yml` | 2541 byte | 19/10 08:15 | (xem `ls`, không đổi từ Batch J) |
| `.github/workflows/ci-integration.yml` | 3256 byte | 19/10 08:14 | (như trên) |
| `.github/workflows/release.yml` | 3305 byte | 20/10 01:42 | (như trên) |

Đồng bộ: 2 file mới (ci-security, ci-build) là nội dung cần đẩy — chưa từng
lên remote nên không có gì để "lệch"; 3 file còn lại cũng chưa từng lên remote
(cùng nguyên nhân 403 từ Batch J). Không có file workflow nào khác trong
`paths-loop/` đang chờ push ngoài 2 file này (ci-build đã loại khỏi lần gộp
push #4 đúng như MEMORY ghi). Không sửa nội dung file workflow nào trong đợt
này.

### 5.3 Hướng dẫn ngắn cho user (khi về / muốn có CI)

1. **Cách chắc chắn nhất:** mở repo trên web GitHub → Add file → Create new
   file → tạo `.github/workflows/ci-security.yml` rồi `.github/workflows/ci-build.yml`,
   dán đúng nội dung local (SHA ở §5.2 để đối chiếu), commit thẳng lên `main`.
   Làm tương tự cho `ci-e2e.yml`, `ci-integration.yml`, `release.yml` nếu muốn
   đủ bộ — hoặc chỉ 2 file trên trước.
2. **Cách khác:** vào Settings → GitHub Apps → App đang dùng để push → kiểm
   tra quyền **Workflows = Read and write**; nếu đã đúng mà vẫn 403 thì gỡ
   App rồi cài lại (đã thử 2 lần ngày 22/10 vẫn 403 — cách 1 chắc chắn hơn).
3. Sau khi file lên remote, đợt sau verify bằng contents API rồi mới tin CI
   chạy thật. **Release gate vẫn giữ:** `release.yml` lên remote không có
   nghĩa là được release/tag — chỉ release khi sản phẩm ngang/hơn CapCut thật.

## 6. Rà soát nhãn máy — phạm vi đã kiểm

- **Đã rà + sửa:** `benchmarks/RESULTS.md` (toàn bộ §1–§9), `benchmarks/BENCH_LIMITS.md`
  (mục 1, 6), `docs/FEATURE_STATUS.md` (§8), `docs/DESKTOP.md` (§1).
- **Đã rà, không cần sửa:** `README.md` (không nhắc số benchmark/máy nào);
  `docs/PHASE9_ROUND77_LIMITS.md` + `docs/PHASE9_ROUND77_E8_GPU_SAFARI_LIMITS.md`
  (là hồ sơ đúng tại thời điểm 09/11 — nhãn 9D25 trong đó vẫn đúng cho ngày đo đó).
- **Không sửa ngược:** ~60 file `docs/PHASE9_ROUND*_LIMITS.md` lịch sử nhắc
  "2 vCPU"/"4 vCPU"/"7D13"/"9D25" — chúng là hồ sơ đúng tại thời điểm đo; sửa
  ngược sẽ làm sai lịch sử. Ai trích số từ các file đó phải đối chiếu ngày đo
  với bảng thế hệ máy ở RESULTS.md.
- **Grep kiểm chứng sau sửa:** `grep -n "2 vCPU" benchmarks/RESULTS.md` còn 9
  dòng — tất cả đều nằm trong ngữ cảnh đã gắn nhãn thế hệ 1 (§1/§2/§4/§6/§7/§8)
  hoặc là dòng đính chính F10 (§9.3). Không còn dòng nào ghi "2 vCPU" như nhãn
  máy hiện tại. `grep -rn "7D13" benchmarks/ README.md docs/FEATURE_STATUS.md
  docs/DESKTOP.md` chỉ còn các chỗ đã gắn "(thế hệ 1)".

## 7. Nợ mở cho đợt sau

1. **Safari thật + GPU thật** vẫn chưa đo (cần máy §4 — không làm được trên VM
   này; F10 đã đo lại hết những gì đo được bằng tài nguyên sẵn có).
2. **CI 403** vẫn chờ user (§5.3) — toàn bộ `.github/workflows/` remote đang 404.
3. **Máy đo lại đổi host** (9D25 → 9D64 trong một đêm): các đợt benchmark sau
   phải ghi model CPU + ngày đo (§2); số tuyệt đối đợt 78 trở về trước không
   so chéo thế hệ.
4. **TTS §9.3 / §5 / §9.1 / §9.2 (thế hệ 2):** model CPU lúc đo 06–07/11 không
   ghi lại được nữa — ghi "không ghi lại" trung thực thay vì gán 9D25.
5. **WebKit HEVC readyState 3 vs 4** (F10 vs E8): khác biệt timing, không ảnh
   hưởng kết luận; nếu đợt sau cần chắc chắn thì đo lặp 3 lần cùng clip.
6. Release gate giữ nguyên: KHÔNG release/tag.

## 8. Files (stage, KHÔNG push)

- Sửa: `benchmarks/RESULTS.md` (nhãn máy §1–§9 + bảng thế hệ máy).
- Sửa: `benchmarks/BENCH_LIMITS.md` (mục 1, 6).
- Sửa: `docs/FEATURE_STATUS.md` (§8, 1 dòng).
- Sửa: `docs/DESKTOP.md` (§1, 1 dòng + đính chính).
- Mới: `docs/PHASE9_ROUND78_F10_BENCH_LABELS_LIMITS.md` (file này).
- Mới: `benchmarks/results/webkit-safari-probe-78f10.json` (kết quả thô đo
  lại 10/11 06:46 +07 trên máy 9D64; script đo không đổi
  `benchmarks/render/gpu_safari_probe_77e8.mjs`, clip test ở `/tmp/e8/clips`
  không stage).
- Không sửa production. Không binary. Không workflow.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round78-f10-bench-labels.txt`
  (6 entry).
