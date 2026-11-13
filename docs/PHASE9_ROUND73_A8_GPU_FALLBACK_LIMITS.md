# Đợt 73 A8 — LIMITS: kiểm chứng fallback encode GPU→CPU (Phase 7 P2)

Ngày: 09/11/2026. Luồng A8 — nợ đợt 72 §4 mục 8 (phần làm được trên VM này).
Test: `server/render/src/test_round73_a8_gpu_fallback.js` — **54/54 pass (run 5, exit 0)**.
Hồi quy: `server/render/src/test_round65_s4_gpu_fallback.js` — **18/18 pass**.
Self-test: `node server/render/src/gpuencode.js --self-test` — **pass**.
**Không sửa code production** (chỉ thêm test + file LIMITS này) nên không chạy tsc/vite build.

## 1. Kết luận chính

**Fallback GPU→CPU HOẠT ĐỘNG trên cả 5 đường đã kiểm chứng.** Render không bao
giờ fail chỉ vì encoder GPU chết: thử lại đúng 1 lần bằng libx264, ra MP4 h264
hợp lệ, exit 0, cache probe lỗi bị xoá để lần sau probe lại thật.

**GPU path thật KHÔNG đo được trên VM này** — nợ gốc đợt 72 §4 mục 8 vẫn mở
phần "GPU thật / Safari thật". Mọi kết luận dưới đây chỉ đúng trên CPU + Chromium.

### Môi trường đo (09/11/2026, VM này)

- ffmpeg 8.1.2 (Ubuntu). Các encoder GPU **có biên dịch sẵn** (`h264_nvenc`,
  `h264_qsv`, `h264_vaapi` đều có trong `ffmpeg -encoders`) nhưng **không có
  phần cứng**: không `/dev/dri/`, không `/dev/nvidia*`.
- Probe thật (`probeGpuEncoderCached`, cache rỗng): **0,41s wall, trả về
  `encoder=null`, đã thử cả 3** (`tried: [h264_nvenc, h264_qsv, h264_vaapi]`).
  Lỗi probe trực tiếp: nvenc "Operation not permitted", qsv "Invalid argument",
  vaapi chặn ngay vì vắng `/dev/dri/renderD128` (không spawn ffmpeg).
- Cache đĩa probe thật `~/.cache/vcut/gpu-probe.json` **không tồn tại** lúc đo
  (mọi test dùng đường dẫn cache tạm qua `VCUT_GPU_PROBE_CACHE`, không đụng
  cache thật). Cache HIT đọc lại ~0ms (đo trong process).
- VM: 4 vCPU nhìn thấy, cell chia sẻ 1,5 CPU, RAM 8 GB. **Loadavg dao động
  mạnh theo các luồng đợt 73 chạy song song** (0,3 → 13,1) — mọi số thời gian
  dưới đây phải đọc kèm loadavg; fps testsrc không phải fps render video thật.

## 2. Bằng chứng — 5 kịch bản fallback đều pass (run 5, loadavg ~0,3)

| Kịch bản | Lần 1 | Kết quả |
|---|---|---|
| S1 probe **tươi** nvenc OK → render fail | auto, không cache gieo | exit 0, MP4 640x360 2s hợp lệ, đúng 1 retry, cache vừa ghi **đã xoá**, log đủ marker |
| S2 ép tay `--encoder h264_nvenc`, probe OK → render fail | manual | exit 0, MP4 hợp lệ, đúng 1 retry; xem §3.1 |
| S3 cache gieo **h264_vaapi** (graph có `hwupload`) → fail | auto, cache HIT | exit 0, MP4 hợp lệ — graph được dựng lại không hwupload ở lần retry, cache đã xoá |
| S4 cache gieo **h264_qsv** → fail | auto, cache HIT | exit 0, MP4 hợp lệ, đúng 1 retry, cache đã xoá |
| S5 GPU **chết giữa chừng** (encode thật 2,5s rồi kill -9) | auto, cache HIT, spec 1080p 8s | exit 0, MP4 1920x1080 8s hợp lệ, đúng 1 retry; **progress frame cuối = 84/240** (đang encode dở thì chết); không còn ffmpeg mồ côi; file dở dang được retry ghi đè `-y` |
| S6 đối chứng: libx264 + ffmpeg luôn-fail | — | exit 2, **không retry**, không marker fallback (đúng thiết kế) |

Bằng chứng "encode thật trước khi chết" ở S5 là file `ffmpeg -progress`
(frame cuối 84/240), **không phải kích thước file dở dang** — xem §3.4.

## 3. Phát hiện phụ (đều là phát hiện ở tầng test/audit, không phải bug production nghiêm trọng)

### 3.1 [MỨC NHẸ — ghi nhận, KHÔNG sửa] Fallback đường ép tay cũng xoá cache probe

`render.js` (bước 7) gọi `clearGpuProbeCache()` vô điều kiện trong nhánh retry,
kể cả khi encoder đến từ `--encoder` ép tay (probe tươi, cache không được dùng).
Test S2 chứng minh: gieo trước cache null hợp lệ, chạy `--encoder h264_nvenc`
→ fallback xong **file cache đã bị xoá**. Hậu quả duy nhất: lần render `auto`
sau tốn thêm 1 lần probe tươi (~0,41s). Không sửa vì lợi ích nhỏ, động vào
nhánh retry có rủi ro cao hơn lợi ích. Nợ mở nhỏ cho đợt sau nếu ai đụng vào
nhánh này: chỉ xoá cache khi encoder đến từ đường `auto`.

### 3.2 [BẪY TEST — đã sửa trong test] Match chuỗi con `nullsrc` là sai

Lệnh render thật luôn chứa `anullsrc=r=48000:cl=stereo:d=...` (render.js:1180,
nguồn âm thanh câm) nên wrapper phân biệt probe/render bằng `*nullsrc*` đã
exit 0 giả → render tưởng thành công nhưng không có file output (run 1:
14 fail, S1/S2/S5/T4 đều "exit 0, output rỗng"). Đã sửa: match đúng token
probe `nullsrc=s=64x64:d=0.1`. Ghi để đợt sau khỏi lặp lại.

### 3.3 [BẪY TEST — đã sửa trong test] `eval` + quoting + ffmpeg mồ côi

- Dòng sinh wrapper trong test viết bằng JS single-quoted string: `\"` bị JS
  nuốt thành `"` nên shell script sinh ra là `newargs="$newargs "$a""`
  (`$a` không được quote, không có ký tự `"` nào trong giá trị) → `eval` gặp
  `;` và `(` trong filter graph thì lỗi `Syntax error: "(" unexpected` →
  ffmpeg không chạy (run 3: S5 fail cả sidecar lẫn progress). Đã sửa thành
  `\\"` trong file JS để shell script nhận đúng `\"`.
- Bản wrapper đầu dùng `eval "ffmpeg $newargs" & pid=$!`: `$!` là PID của
  subshell eval, `kill -9` giết subshell nhưng **ffmpeg mồ côi vẫn chạy** và
  viết tiếp vào file output trong lúc retry render cùng đường dẫn (run 2 S5
  bị nhiễm — kết quả S5 run 2 không dùng được; đã kill tay PID mồ côi và
  xác nhận sạch). Đã sửa: `( eval "exec ffmpeg $newargs" ) & pid=$!` để
  subshell thành ffmpeg luôn, `$!` chính là PID ffmpeg; run 5 kiểm tra
  `pgrep` sau fallback: **0 ffmpeg mồ côi**.

### 3.4 File MP4 48 byte ở lúc kill là BÌNH THƯỜNG

Ở thời điểm kill, file output dở dang chỉ 48 byte (header ftyp) dù ffmpeg đã
encode — vì buffer avio 32 KB chưa đầy với bitrate thấp (testsrc 720p chỉ
~115 kb/s; encode 720p 5s hoàn chỉnh chỉ 75.325 byte). Đừng dùng kích thước
file làm bằng chứng "đã encode"; dùng file `-progress` (frame=N).
Cùng lý do, x264 lookahead (~20 frame) làm `frame=0` ở kill 1,5s dù đã encode
— S5 phải kill 2,5s trên clip 1080p 8s mới thấy frame=84.

### 3.5 [NỢ MỞ — phát hiện khi đọc code, CHƯA test] ffmpeg treo thì không có fallback

`render.js:1805` chạy ffmpeg bằng `spawnSync` **không có `timeout`** (grep
`timeout` trong render.js: không có kết quả). Fallback chỉ kích hoạt khi
ffmpeg **thoát** với mã != 0. Nếu encoder GPU làm ffmpeg treo (không thoát —
vd driver hang), render.js đợi vô hạn, job treo theo, không retry, không
fail rõ. Chưa kiểm chứng bằng test (cần wrapper treo có chủ đích + timeout
harness). Đề xuất đợt sau: thêm `timeout` cho spawnSync bước 7 (vd 1 lần
thời lượng clip + đệm) rồi kill + fallback như fail thường; đo riêng.

## 4. Số đo timing — CPU fallback vs GPU path

**Không có số GPU để so** (GPU path không chạy được trên VM này — xem §1).
Số dưới đây là render thật bằng libx264 qua `render.js`
(testsrc, preset `veryfast`, crf 23, wall đo ngoài cùng bằng spawnSync).

| Đo | Điều kiện | Kết quả |
|---|---|---|
| T1 libx264 720p 5s (150 frame) | run 5, loadavg ~2,9 | **1,37s (109,6 fps) / 1,48s (101,4 fps)** |
| T1 (đối chiếu) | run 1, loadavg 13,1 | 3,98s / 4,23s — cùng clip, chậm ~2,8× khi VM tải nặng |
| T2 auto + cache null 720p 5s | run 5 | 1,43s (104,9 fps); cache null còn nguyên |
| T3 auto + `--reprobe-gpu` 720p 5s | run 5 | 1,61s; T3−T2 ≈ **0,18s** (probe tươi trong render; probe rời đo được 0,41s lúc load 3,3) |
| T4 fallback fail-nhanh 720p 5s | run 5, VM yên | 1,58s — overhead vs T1 (median) ≈ **0,15s** |
| T4 (đối chiếu) | run 2, loadavg 13,1 | overhead ≈ 1,84s — overhead ≈ 1 lần chạy lại toàn bộ pipeline + spawn node, dao động theo tải VM |
| T5 fallback chết-giữa-chừng 1080p 8s (240 frame) | run 5 (S5) | **6,88s** (34,9 fps hiệu dụng) = ~2,5s encode dở bị bỏ + render CPU 1080p 8s đầy đủ |
| T6 libx264 1080p 5s (150 frame) | run 5 | **2,86s (52,5 fps)** |
| Probe GPU tươi (rời) | loadavg 3,3 | 0,41s, trả null; cache HIT ~0ms |

**Cảnh báo khi trích dẫn:** fps trên là của testsrc (nội dung tổng hợp, độ
phức tạp thấp) trên VM chia sẻ CPU — không phải fps render video thật, không
so được với benchmark 1080p ~8,6 fps trước đây (nội dung/khung đo khác nhau).
Con số vững nhất: **overhead của 1 lần fallback fail-nhanh ≈ 0,15s trên VM
yên** (chủ yếu là chạy lại pipeline + spawn node), và **fallback chết-giữa-
chừng tốn đúng bằng thời gian encode đã bỏ** (~2,5s) cộng 1 lần render CPU
đầy đủ — không có chi phí ẩn khác.

## 5. Phạm vi CHƯA kiểm chứng (nợ mở)

1. **Encode GPU thật** (nvenc/qsv/vaapi trên phần cứng thật): chưa có số fps
   GPU, chưa biết GPU nhanh hơn CPU bao nhiêu, chưa test vaapi với
   `/dev/dri` thật. Cần máy có GPU/NVIDIA/Intel QSV/VA-API.
2. **Safari thật**: nợ gốc đợt 72 §4 mục 8 vẫn nguyên phần Safari.
3. **ffmpeg treo** (không thoát): xem §3.5 — cần timeout ở bước 7.
4. **Retry chạy lại toàn bộ pipeline**: lần retry validate media, resolve
   font, vẽ PNG text/mask lại từ đầu. Overhead mới đo trên spec trơn (không
   text/mask); project nặng text/mask thì chi phí chạy lại lớn hơn — chưa đo.
5. **GPU fail do hết VRAM / lỗi giữa chừng ở độ phân giải lớn**: wrapper chỉ
   fail ngay hoặc kill sau 2,5s; chưa mô phỏng lỗi OOM GPU hay lỗi sau khi đã
   encode phần lớn clip (vd 90% rồi fail — retry vẫn đúng, chỉ tốn thời gian).
6. Fallback khi **cả libx264 cũng fail** (vd filter graph lỗi): đã có đối chứng
   S6 — job fail thật với exit 2, không che giấu. Không phải nợ.

## 6. Kiểm chứng đã chạy

- `node server/render/src/test_round73_a8_gpu_fallback.js` — **54/54 pass,
  exit 0** (run 5, 09:12 +07 09/11/2026, loadavg lúc bắt đầu 0,29).
  Các run trước là quá trình sửa test, không phải sửa production: run 1
  38/52 (bẫy anullsrc §3.2), run 2 51/52 (bẫy eval subshell §3.3, S5 nhiễm
  orphan), run 3 52/54 (bẫy quoting `\"` §3.3), run 4 53/54 (frame=0 do
  x264 lookahead §3.4 — tăng kill lên 2,5s + clip 8s), run 5 54/54.
- `node server/render/src/test_round65_s4_gpu_fallback.js` — **18/18 pass**
  (hồi quy kịch bản cache lỗi đợt 65, không regression).
- `node server/render/src/gpuencode.js --self-test` — **pass** (probe thật
  null + cache đĩa MISS/HIT/null/force/TTL/file hỏng/tắt/xoá).
- Không sửa code production → không chạy tsc/vite build (không có file build
  nào bị đụng). Test mới không nằm trong build.

## 7. File đổi/thêm (stage, KHÔNG push)

- `server/render/src/test_round73_a8_gpu_fallback.js` (mới)
- `docs/PHASE9_ROUND73_A8_GPU_FALLBACK_LIMITS.md` (mới, file này)
