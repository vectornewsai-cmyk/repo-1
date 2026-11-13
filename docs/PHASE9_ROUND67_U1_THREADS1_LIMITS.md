# LIMITS — Phase 9 đợt 67 U1: ép `ffmpeg -threads 1` vào render/enhance stabilize

Đợt 67 U1 — đóng nợ đợt 66 §8 mục 1 (docs/PHASE9_ROUND66_LIMITS.md §8 mục 1,
gốc từ đợt 65 S1): `vidstabtransform` không xác định, spread MAD 36–38%.
Đợt 66 T1 đã tìm ra cách khử duy nhất: `ffmpeg -threads 1` (E4: 0/150 frame
khác, byte-identical ×3, MAD 2,3867; nguồn ở decoder frame-threading).
Luồng này đo hiệu năng decode đơn luồng trên clip lớn + footage thật, rồi
ép `-threads 1` vào code sản phẩm (chỉ bước transform) + kiểm chứng.

> Số đo trong doc này là số thật đo trên VM này (ffmpeg 8.1.2, libvidstab
> 1.1.0, 4 CPU, RAM 8 GB, không GPU). Chỗ nào chưa đủ mẫu sẽ ghi rõ, không
> bịa số.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Quyết định | **ÉP `-threads 1` cho bước TRANSFORM (render chính), mặc định BẬT**; detect GIỮ đa luồng (xem §2). Tắt bằng CLI `--no-stab-single-thread` hoặc env `VCUT_STAB_SINGLE_THREAD=0`. |
| Hiệu quả khử spread | **720p: KHỬ HOÀN TOÀN** (T1 E4 tái lập: 0/150 frame khác, ×3 giống hệt). **1080p clip tổng hợp h264 60s: CẢI THIỆN MẠNH, không khử hết** — frame khác 98% → 8–17% (r1↔r2 153/1800, r1↔r3 304/1800, r2↔r3 157/1800); 1499 frame đầu bit-identical, lệch chỉ ở ~300 frame cuối. **1080p footage thật VP9 10s (slovenska): KHÔNG CẢI THIỆN** — 93–96% frame khác, lệch từ frame 2 (mặc định 73–93%). 1080p 5s framemd5: 2/3 giống hệt + 1 lần ffmpeg SEGFAULT. **Kết luận: hiệu quả của `-threads 1` PHỤ THUỘC codec/nội dung** — khử được nguồn spread từ h264 frame-threading nhưng không chạm tới nguồn spread khác (VP9/footage thật). T1 E4 KHÔNG khái quát hoá lên 1080p. |
| Hiệu năng decode đơn luồng (clip 1080p 60s, ~73 Mbps) | CPU time gần như bằng nhau: mặc định 100,14s vs threads1 98,94s (n=1 mỗi bên — chỉ r3 có cpu_s; −1,2%). Wall time nhiễu mạnh do tải nền (mean 129,8s vs 290,1s, spread 88% — KHÔNG dùng để kết luận). RAM −26% (104,3 → 77,2 MiB). |
| Hiệu năng detect 1080p 60s | CPU 257,71s vs 264,90s (+2,8%; n=1 vs n=2 — trong nhiễu). Wall mean nhiễu (576,2s vs 411,3s, spread 88–148% — KHÔNG dùng để kết luận). RAM −19% (119,1 → 96,4 MiB). |
| Hiệu năng transform 1080p 60s | CPU 166,0s vs 162,2s (−2,3%, n=3); wall 118,5s vs 116,9s (−1,3%, spread 0,8–2,5% — ổn định vì tải lúc đo thấp); RAM −25% (140,5 → 105,7 MiB). |
| Footage thật slovenska (VP9 1080p, trim 10s) | Detect: CPU 25,05s vs 25,80s (+3,0%), wall 18,0s vs 18,5s (+2,5%), RAM −10%. Transform: CPU 12,28s vs 12,31s (+0,3%), wall 8,9s vs 8,9s (−0,1%), RAM −13%. Tức trên footage thật, `-threads 1` cũng gần như KHÔNG tốn thêm gì. |
| Xác định end-to-end (render.js, 1080p 5s stabilize ×3) | **KHÔNG đạt** (3 sha MP4 khác nhau) — xem §5.1. Chỉ 720p mới đạt (harness C2). |
| Xác định end-to-end (render.js, 1080p 5s stabilize ×3) | **KHÔNG đạt** (3 sha MP4 khác nhau) — xem §5.1. |
| Harness T1 chạy lại | **10 pass / 0 fail** — E4 720p tái lập đúng (MAD 2,3867 giống hệt ×3, 0/150 frame khác). |
| Hồi quy | Harness U1 lần 3: **28 pass / 1 fail** (fail duy nhất là ffmpeg bị kill do hết RAM — xem §6 mục 7; chạy lại thành công, sha trùng r1/r2). T1 rerun 10/0. `test:unit` 7/7 module xanh; enhance/trfCache self-test xanh; tsc web + desktop 0 lỗi. |

## 1. Đo hiệu năng `-threads 1` vs mặc định (mỗi cấu hình ×3, xen kẽ rep)

### 1.1 Thiết lập đo

- Clip lớn: `shakynoisy1080_60s.mp4` — 1920×1080, 30fps, 60,000s, 1800 frame,
  h264, 546.542.370 byte (~73 Mbps). Tạo bằng `ffmpeg -stream_loop 11 -i
  shakynoisy1080.mp4 -c copy` (loop 12× clip rung 5s của đợt 60; nội dung
  lặp theo chu kỳ 5s — đủ cho đo hiệu năng/xác định, KHÔNG phải footage mới).
  Bitrate ~73 Mbps là CAO BẤT THƯỜNG (crf 18 + texture tổng hợp tần số cao);
  số tuyệt đối (fps decode) KHÔNG đại diện footage thường (~8–20 Mbps) —
  chỉ so sánh TƯƠNG ĐỐI default-vs-threads1 trên cùng clip mới có ý nghĩa.
- Footage thật: `slovenska.webm` — 1920×1080, 25fps, 54,18s, VP9 + opus,
  ~5,5 Mbps (`.scratch-r64r4/`); đo trên trim 10s đầu (250 frame).
- Lệnh đo (y hệt T1, chỉ thay clip): decode-only (`-f null -`); detect
  (`vidstabdetect` shakiness=5 accuracy=15 stepsize=6 mincontrast=0.3,
  trim đúng đoạn); transform (`vidstabtransform` input=.trf detect-default-r1
  smoothing=10 optalgo=gauss → `-f framemd5 -`, so MD5 từng frame để chứng
  minh xác định mà không cần lưu 1800 PNG).
- Runner đo: `run_measure.py` (scratch) — wall time + peak RSS (poll
  `/proc/<pgid>` VmRSS mỗi 100 ms) + loadavg đầu/cuối; từ giữa đợt bổ sung
  thêm `cpu_s` (resource.getrusage RUSAGE_CHILDREN — CPU time của đúng
  process con, miễn nhiễm tải nền; các lần đo trước đó không có cpu_s).
- Tải nền: RẤT CAO và thất thường (các luồng đợt 67 khác chạy Chrome headed
  + vite song song; loadavg 1-min dao động 0,6–31,5 trong lúc đo). Đối sách:
  xen kẽ default/threads1 theo rep (A/B/A/B…), ghi loadavg từng lần, và báo
  cả CPU time khi có. Wall time vì vậy chỉ là tham khảo có điều kiện —
  kết luận về chi phí dựa chủ yếu vào CPU time + spread giữa các rep.
- Driver đo: `.scratch-r67u1-measure/drive_measure.sh` (idempotent — chạy lại
  bỏ qua tag đã có trong `measure.jsonl`), log `measure.jsonl`.

### 1.2 Số đo (mỗi cấu hình ×3, xen kẽ rep; 30 lần đo, exit 0 tất cả)

| Nhóm | Cấu hình | wall mean / min / max (spread) | cpu mean (n_cpu) | RSS peak mean | fps decode |
|---|---|---|---|---|---|
| decode 60s | mặc định | 129,8 / 91,0 / 205,0s (87,8%) | 100,14s (n=1) | 104,3 MiB | 15,9 |
| decode 60s | threads1 | 290,1 / 119,3 / 376,1s (88,5%) | 98,94s (n=1) | 77,2 MiB | 8,2 |
| detect 60s | mặc định | 576,2 / 249,7 / 1104,5s (148,3%) | 257,71s (n=1) | 119,1 MiB | 4,5 |
| detect 60s | threads1 | 411,3 / 181,7 / 545,4s (88,4%) | 264,90s (n=2) | 96,4 MiB | 5,6 |
| transform 60s | mặc định | 118,5 / 117,4 / 120,4s (2,5%) | 165,97s (n=3) | 140,5 MiB | 15,2 |
| transform 60s | threads1 | 116,9 / 116,3 / 117,2s (0,8%) | 162,16s (n=3) | 105,7 MiB | 15,4 |
| detect slov 10s | mặc định | 18,0 / 17,4 / 19,3s (10,2%) | 25,05s (n=3) | 92,9 MiB | 13,9 |
| detect slov 10s | threads1 | 18,5 / 17,9 / 19,1s (6,2%) | 25,80s (n=3) | 83,4 MiB | 13,5 |
| transform slov 10s | mặc định | 8,9 / 8,8 / 8,9s (1,3%) | 12,28s (n=3) | 113,9 MiB | 28,2 |
| transform slov 10s | threads1 | 8,9 / 8,7 / 9,0s (3,4%) | 12,31s (n=3) | 98,7 MiB | 28,2 |

So sánh threads1 vs mặc định (mean):

| Nhóm | wall | CPU | RAM |
|---|---|---|---|
| decode 60s | +123,6% (NHIỄU — spread 88%, không kết luận) | −1,2% (n=1 mỗi bên) | −26,0% |
| detect 60s | −28,6% (NHIỄU — spread 88–148%, không kết luận) | +2,8% (n=1 vs n=2) | −19,0% |
| transform 60s | −1,3% (spread 0,8–2,5% — đáng tin) | −2,3% (n=3) | −24,8% |
| detect slov 10s | +2,5% | +3,0% (n=3) | −10,3% |
| transform slov 10s | −0,1% (spread 1,3–3,4% — đáng tin) | +0,3% (n=3) | −13,3% |

Lưu ý về n_cpu: `cpu_s` chỉ được bổ sung giữa chừng, nên decode/detect 60s
chỉ có cpu_s ở 1–2 lần chạy (r3, hoặc r2+r3). CPU mean của 2 nhóm này vì
vậy là n=1–2, không phải n=3 — vẫn là chỉ số đáng tin hơn wall time (vì
miễn nhiễm tải nền), nhưng cần ghi rõ n. Các nhóm transform + slovenska
có đủ n=3.

### 1.3 Đọc số

- **Chi phí CPU của `-threads 1` ≈ 0 ở mọi bước**: decode −1,2%, detect
  +2,8%, transform 60s −2,3%, detect slov +3,0%, transform slov +0,3% —
  tất cả trong ±3%, tức trong nhiễu đo. Cùng lượng việc, chỉ mất song song
  hoá (wall time tăng khi tải thấp là do mất song song, không phải thêm việc).
- **Wall time chỉ đáng tin ở nhóm transform** (tải lúc đo ổn định, spread
  0,8–3,4%): transform 60s −1,3%, transform slov −0,1% — tức decode đơn
  luồng KHÔNG làm transform chậm hơn. Wall time decode/detect nhiễu mạnh
  (spread 88–148%) vì tải nền dao động 0,3–38 trong lúc đo — mean wall
  của 2 nhóm này KHÔNG dùng để kết luận (vd decode threads1 mean 290,1s
  do r2/r3 rơi vào lúc load 11–38; r1 lúc load thấp chỉ 119,3s vs mặc định
  r1 93,4s — tức +28% ở tải thấp, trên clip 73 Mbps).
- **RAM giảm đều với threads1** (−10% đến −26% peak RSS): ít buffer decode
  song song hơn. Trên máy 8 GB, đây là lợi ích thật (đặc biệt với clip 4K/
  transform nặng), dù không phải mục tiêu chính.
- **Footage thật (VP9) giống clip tổng hợp (h264) về hiệu năng**: transform
  slov CPU +0,3% / wall −0,1% — decode đơn luồng không tốn thêm gì trên
  footage thật. Điểm khác biệt duy nhất giữa 2 loại footage là XÁC ĐỊNH
  (xem §5.1): threads1 cải thiện mạnh trên h264 tổng hợp nhưng không cải
  thiện trên VP9 thật.
- **Detect KHÔNG cần threads1** (xem §2): CPU detect threads1 +2,8% (60s)
  / +3,0% (slov) — không rẻ hơn, và `.trf` vẫn khác byte ×3 ở cả 2 cấu
  hình. Ép threads1 cho detect chỉ thêm rủi ro chậm trên pass đắt nhất
  của stabilize (detect 60s CPU ~258–265s/lần) mà không thêm tính xác định nào.

## 2. Quyết định: detect có ép `-threads 1` không — KHÔNG

- `.trf` detect mặc định ×3 vs `-threads 1` ×3 trên clip 1080p 60s (cùng
  input, cùng tham số, driver đo xen kẽ):
  - Mặc định: sha `de510f62a3db…` / `5c3ef612d131…` / `8d2996bd3566…` — KHÁC NHAU cả 3.
  - `-threads 1`: sha `08525fc3785e…` / `6bdb685ee457…` / `1312514d5829…` — KHÁC NHAU cả 3.
  - Kết luận: ép đơn luồng KHÔNG làm `.trf` byte-identical. (Cả 2 cấu hình đều khác byte.)
- So nội dung `.trf` bằng `trf_compare.py` (parse LM từng frame, sort rồi so
  tập + median dx/dy): detect-default-r1 vs detect-t1-r1 và default-r1 vs
  default-r2: CÙNG 1800 frame, **0/1800 frame khác tập LM, median LM lệch max
  0,0px** — khác byte CHỈ do thứ tự liệt kê LM trong frame (khớp tiền lệ S1:
  detect ×3 khác byte nhưng median LM giống hệt; và T1 E11: trfB khác byte,
  cùng nội dung LM).
- Hệ quả: nội dung detect đã giống hệt nhau; ép đơn luồng cho detect không
  thêm tính xác định nào cho render. Detect giữ đa luồng (mặc định), tránh
  chậm thêm trên pass đắt nhất của stabilize (detect 1080p 60s CPU
  ~258–265s/lần, wall 182–1105s/lần tùy tải — xem §1.2).
- Code: `STAB_DETECT_SINGLE_THREAD = false` trong `enhance.js` (const có
  comment ghi rõ lý do + điều kiện đổi). Plumbing đã sẵn: `runStabilizeDetect`
  nhận `opts.singleThread`, `resolveStabilizeTrf` chuyển tiếp, render.js
  truyền const này — đổi const thành true + bump `TRF_CACHE_VERSION` là đủ
  nếu một lần đo sau chứng minh detect threads1 cho `.trf` byte-identical.

## 3. Thay đổi code (đợt 67 U1)

- `server/render/src/enhance.js`:
  - Tách `buildStabilizeDetectArgs(inputAbs, clip, trfPath, opts)` — dựng argv
    detect (test được không cần ffmpeg thật); `-threads 1` đứng TRƯỚC `-i`
    khi `opts.singleThread=true`.
  - `runStabilizeDetect(ffmpeg, inputAbs, clip, trfPath, opts)` dùng builder
    trên (hành vi cũ giữ nguyên khi không truyền opts).
  - Export `STAB_DETECT_SINGLE_THREAD` (= false, xem §2) +
    `buildStabilizeDetectArgs`; self-test mới assert cả 2 nhánh argv.
- `server/render/src/trfCache.js`: `resolveStabilizeTrf()` chuyển
  `opts.singleThread` xuống `runStabilizeDetect` (chỉ có tác dụng khi detect
  thật: cache MISS hoặc cache tắt; HIT thì copy `.trf` cũ, không detect lại).
  Không đổi cache key (detect setting là const, không đổi theo runtime).
- `server/render/src/render.js`:
  - CLI mới `--no-stab-single-thread` + env `VCUT_STAB_SINGLE_THREAD=0`;
    mặc định BẬT (`stabSingleThread: process.env.VCUT_STAB_SINGLE_THREAD !== "0"`).
  - Khi render có clip stabilize (`stabTrf.size > 0`): chèn `-threads 1` ngay
    trước `-i` của đúng file media của clip video có `enhance.stabilize`
    (tính từ spec; `-threads` là option input — đặt sau `-i` sẽ vô tác dụng).
    Các input khác giữ decode đa luồng. Log dòng `🧵 stabilize single-thread
    decode: -threads 1 trước N/M input` khi kích hoạt.
  - Cùng 1 file media dùng chung cho clip stabilize + clip thường thì input
    đó vẫn nhận `-threads 1` (đăng ký `-i` 1 lần) — vô hại, chỉ decode file
    đó đơn luồng.
  - Detect: truyền `singleThread: STAB_DETECT_SINGLE_THREAD` (= false) —
    xem §2.
  - Bridge KHÔNG sửa (spawn render.js với argv cố định; cờ mặc định BẬT nên
    bridge tự nhận hành vi mới). Chưa có toggle trên UI — nợ mở (§7).
  - Retry fallback GPU (re-exec cùng argv) tự mang theo cờ — không cần sửa.
- `server/render/src/test_round67_u1_threads1.js` (harness mới, xem §5).

## 4. Kiểm chứng dry-run (vị trí `-threads 1`)

Harness U1 mục B (đã chạy 2 lần, lần 1 và lần 2 — cùng kết quả; lần 3 chạy
lại sau khi sửa harness, xem §5.1):

- Spec stabilize (1 clip video `enhance.stabilize`, 1080p): dry-run có đúng
  **1 lần** `-threads 1`, đứng ngay trước `-i` của đúng file media của clip
  stabilize; câu lệnh có `vidstabtransform=input=...`.
- `--no-stab-single-thread`: dry-run **0 lần** `-threads` (tắt hẳn).
- Env `VCUT_STAB_SINGLE_THREAD=0`: dry-run **0 lần** `-threads 1`.
- Spec không stabilize: dry-run **0 lần** `-threads 1` (không đụng clip thường).
- Spec 2 clip (1 stabilize + 1 thường, cùng file nguồn, nối tiếp start 0 → 5):
  đúng **1 lần** `-threads 1` trước input dùng chung (đăng ký `-i` 1 lần;
  file dùng chung thì decode đơn luồng — vô hại).
- Lệnh ffmpeg thật đã thấy tận mắt trong `ps` khi render: `ffmpeg -stats
  -threads 1 -i .../shaky1080.mp4 ...` (cờ nằm trước `-i` như thiết kế).

## 5. Kiểm chứng render thật + hồi quy

### 5.1 Harness U1 (`test_round67_u1_threads1.js`)

Chạy lần 3 (sau khi sửa harness: 1080p ×3 chuyển thành ghi-nhận, thêm C2
720p ×3 assert giống hệt; log
`hidden_files/round67-u1-harness3.log`, WORK
`~/.scratch-r67u1-t0De29`): **28 pass / 1 fail**.

- Mục B (dry-run): xanh hết — spec stabilize đúng 1 `-threads 1` trước
  `-i` đúng input; `--no-stab-single-thread` và env=0 đều tắt; spec thường
  không có; spec 2 clip chung file đúng 1.
- Mục C (1080p ×3, cờ BẬT, cache `.trf` riêng): r1/r2 ra MP4 hợp lệ, sha
  GIỐNG NHAU `db2f8307b7669441…`; r3 **FAIL — ffmpeg bị kill giữa chừng**
  (xem §6 mục 7, không phải lỗi code U1); r3 chạy lại bằng tay ngay sau đó
  (cùng spec + cùng cache, `stab-r3c.mp4`) thành công, sha
  `db2f8307b7669441…` — TRÙNG r1/r2. Cả 3 lần render 1080p hợp lệ trong
  lần 3 đều cho cùng sha. Render 2–3 đều HIT cache `.trf`; log có dòng
  `🧵 stabilize single-thread decode` ở cả 3 lần.
- Mục C2 (720p ×3, cờ BẬT): **sha GIỐNG HỆT cả 3**
  `7966c64ef7069c58…` — assert xác định end-to-end 720p PASS (T1 E4 holds
  cho code đã ship).
- Mục D (cờ TẮT, ×1): chạy OK, sha `9320f57b89a4a3f0…` (chỉ ghi nhận).
- Mục E (detect tươi, `--no-trf-cache`, ×1): chạy OK, sha
  `801c1580687c278f…` — KHÁC bản cache, nhưng TRÙNG với sha detect-tươi
  của harness lần 2 (và trùng r2/r3 của harness lần 1).
- **Bức tranh 1080p gộp 3 lần chạy harness** (9 render hợp lệ + 2 detect
  tươi, cùng cờ BẬT): các sha MP4 chỉ lấy **một tập nhỏ giá trị rời rạc và
  lặp lại thường xuyên** — `db2f8307…` ×4 (harness 2 r3 + harness 3 r1/r2/r3c),
  `801c1580…` ×4 (harness 1 r2/r3 + detect tươi harness 2 + detect tươi
  harness 3), `56a9f834…` ×1, `3a201a27…` ×1, `635f1c0c…` ×1. Output
  transform KHÔNG phải nhiễu liên tục ngẫu nhiên — nó rơi vào một vài kết
  quả rời rạc, gợi ý có một biến ẩn rời rạc trong quá trình thực thi (vd số
  thread thực tế dùng ở một bước nào đó, hoặc một race phân giải thành vài
  kết cục). Cơ chế chưa rõ — nợ mở (§7 mục 2).
- Hai lần chạy harness trước (chưa có C2): lần 1 **15 pass / 4 fail**
  (3 fail lỗi harness đã sửa + 1 fail determinism 1080p thật); lần 2
  **21 pass / 1 fail** (chỉ còn fail determinism 1080p: sha
  `56a9f834…` / `3a201a27…` / `db2f8307…`).

### 5.2 Harness T1 chạy lại (`test_round66_t1_vidstab.js`)

Chạy lại sau thay đổi code (nền, log
`hidden_files/round67-u1-t1-rerun.log`, scratch mới
`~/.scratch-r66t1-71xaVT`): **10 pass / 0 fail**. E4 tái lập đúng ở 720p:
MAD 2,3867 giống hệt ×3, 0/150 frame khác, spread 0,0% — không lệch gì so
với đợt 66. Thay đổi code (ép `-threads 1` vào render.js) không phá kết quả
T1; T1 đo bằng ffmpeg trực tiếp nên không bị ảnh hưởng bởi cờ render.js.

### 5.3 tsc + test suite liên quan

- `node --check` 3 file sửa (`render.js`, `enhance.js`, `trfCache.js`) + harness mới: OK.
- Self-test: `enhance.js --self-test` xanh, `trfCache.js --self-test` xanh
  (cả 2 đã xanh từ trước khi sửa comment const detect, chạy lại sau khi sửa
  vẫn xanh).
- `npm run test:unit` (root): 7/7 module xanh (lut, effects, sticker,
  chroma, textfx, keyframes, mask).
- tsc: `apps/web` (`npx tsc --noEmit`) exit 0; `apps/desktop`
  (`npx tsc -p tsconfig.json --noEmit`) exit 0. Thay đổi chỉ chạm file JS
  ở `server/render/src/` nên tsc về lý thuyết không ảnh hưởng — chạy để
  xác nhận, kết quả 0 lỗi như kỳ vọng.

## 6. Sự cố trong lượt chạy (ghi trung thực)

1. Generator clip 1080p 60s trực tiếp bằng numpy (adapt `test_p2_gen_shaky.py`)
   quá chậm (~2,5 fps encode dưới tải) — dừng ở frame 600, dùng `stream_loop`
   12× clip 5s thay thế (xem §1.1). Clip 60s vì vậy có nội dung lặp chu kỳ 5s.
2. Lượt cron 15:35 08/11 chết do daemon restart (tiền lệ đợt 66 T1) — KHÔNG
   ảnh hưởng luồng này (bắt đầu 21:37, checkpoint log sớm vào
   `hidden_files/round67-u1.md`).
3. Tải nền rất cao trong lúc đo (load 1-min tới 31,5 do các luồng đợt 67 khác
   chạy Chrome headed + vite): wall time nhiễu mạnh (vd decode đơn luồng r2
   376,1s vs r1 119,3s — cùng lệnh, khác tải). Đã bổ sung CPU time giữa chừng
   (xem §1.1) và báo kèm loadavg từng lần; không dùng wall time đơn lẻ để kết luận.
4. **ffmpeg SEGFAULT 1 lần khi transform→framemd5 1080p 5s với `-threads 1`**
   (PID 36806, signal 11; output framemd5 rỗng; 2 lần còn lại cho cùng sha
   `d9609968…`). Tổng ~11 lần chạy transform threads1 ở 1080p trong lượt
   này (3 transform+encode + 3 framemd5 5s + 5 render harness) chỉ có 1 lần
   crash — driver đo 30 lần sau đó (xform 60s + slovenska, cả 2 cấu hình)
   đều exit 0, không crash nào nữa. Chưa rõ cơ chế (có thể liên quan tải nền
   cực cao lúc crash — load lên tới 38 — hoặc bug ổn định của libvidstab
   1.1.0). Nợ điều tra ở §7 mục 6.
5. **Phát hiện lớn: T1 E4 không khái quát hoá lên 1080p.** Transform→framemd5
   1080p 60s (cùng `.trf` detect-default-r1, driver đo ×3 xen kẽ):
   mặc định r1↔r2 khác 1762/1800 frame (97,9%), r1↔r3 1759/1800 (97,7%),
   r2↔r3 1751/1800 (97,3%) — lệch từ frame 2, đều khắp clip. Threads1:
   r1↔r2 khác 153/1800 (8,5%), r1↔r3 304/1800 (16,9%), r2↔r3 157/1800
   (8,7%) — lệch CHỈ ở ~300 frame cuối (frame khác đầu tiên: 1499; 1499
   frame đầu bit-identical; khối 1620–1799 lệch gần hết). Trên footage thật
   VP9 (slovenska trim 10s): mặc định 72,8–93,2% frame khác, threads1
   93,2–95,6% — KHÔNG cải thiện, lệch từ frame 2 ở cả 2 cấu hình.
   Gợi ý chưa chứng minh: output transform rơi vào một TẬP HỮU HẠN các kết
   quả rời rạc (render detect tươi lần 2 cho sha `801c1580…` TRÙNG với r2/r3
   của harness lần 1; harness lần 3 r2 `db2f8307…` cũng trùng harness lần 2
   r3 — trùng hash 64-bit không phải ngẫu nhiên). Clip 60s là loop 12× clip
   5s nên frame 1500 là điểm nối loop (motion discontinuity) — điểm lệch
   bắt đầu ở frame 1499 (1 frame trước điểm nối) có thể liên quan, chưa
   chứng minh.
6. Đọc nhầm một lần giữa chừng: tưởng `cpu_s` 268,366 trùng nhau ở 2 lệnh
   khác nhau — kiểm tra file thô thì chỉ có 1 dòng mang giá trị đó
   (detect60-t1-r2); decode60-t1-r2 chạy trước khi bổ sung `cpu_s` nên
   không có trường này. Không có bug đo lường.
7. **ffmpeg bị kill 2 lần liên tiếp khi render 1080p stabilize** (harness lần 3
   r3 + chạy lại bằng tay r3b): encode đang chạy ~5 fps thì dừng ở frame
   126/150 (r3, elapsed 24,2s) và frame 123/150 (r3b, elapsed ~21,6s);
   render.js báo `❌ ffmpeg thoát với mã null` (= process bị kill bởi signal,
   `spawnSync` status null) và thoát mã 2 đúng quy định — KHÔNG phải fail
   câm. File MP4 dở dang 14.155.824 byte, thiếu moov atom (ffprobe lỗi);
   2 file dở dang GIỐNG HỆT byte nhau (encode xác định tới điểm bị kill —
   dữ liệu đã flush giống nhau dù progress line khác nhau 1 frame). Nguyên
   nhân nhiều khả năng là **OOM-killer**: RAM lúc đó chỉ còn 153 MB free /
   716 MB available (tổng 7.934 MB), swap đã dùng 442/1.023 MB, các luồng
   đợt 67 khác đang chạy Chrome headed + vite. Không đọc được dmesg trên VM
   này để xác nhận signal là SIGKILL — chưa chứng minh tuyệt đối, chỉ là
   suy luận mạnh nhất. Bằng chứng ủng hộ: cùng render đó chạy lại ngay sau
   (r3c) thành công exit 0, MP4 hợp lệ 5,0s, sha `db2f8307…` trùng r1/r2.
   Đây là sự cố MÔI TRƯỜNG (hết RAM do tải song song), không phải lỗi code
   U1 — nhưng cho thấy render stabilize 1080p dưới tải nặng có thể bị kill
   bất cứ lúc nào trên VM 8 GB này. Nợ mở: log `r.signal` trong render.js
   để lần sau biết chính xác signal nào (xem §7 mục 6).

## 7. Nợ mở

1. Chưa có toggle tắt/mở single-thread trên UI (bridge preset whitelist) —
   hiện chỉ CLI `--no-stab-single-thread` / env `VCUT_STAB_SINGLE_THREAD=0`.
   Cần luồng UI riêng nếu muốn người dùng cuối tự tắt.
2. Cơ chế chính xác trong code vẫn chưa rõ — gồm 2 câu hỏi: (a) vì sao decoder
   frame-threading làm `vidstabtransform` cho output khác nhau dù decode
   pixel giống hệt (nợ từ T1 §7 mục 1); (b) vì sao threads1 khử hết ở 720p
   nhưng chỉ cải thiện ở 1080p h264 (lệch từ frame ~1500), và không cải
   thiện gì trên VP9 thật (lệch từ frame 2). Các hướng điều tra: đọc
   `vf_vidstabtransform.c` + `vsDoTransform` (fit toàn cục có dùng
   `rand()`/thread không?); VP9 tile-threading có bị `-threads 1` khống chế
   không (test h264 footage thật để tách codec vs nội dung); điểm nối loop
   ở frame 1500 có phải trigger lệch không (test clip 60s không loop);
   valgrind/thread-sanitizer trên libvidstab. Không chặn việc dùng
   `-threads 1` làm cách khử thực hành.
3. Segfault 1 lần (§6 mục 4) chưa điều tra cơ chế — cần tái hiện có kiểm soát
   (chạy transform→framemd5 1080p threads1 ×20 dưới tải thấp) để biết có
   phải bug ổn định của libvidstab 1.1.0 hay chỉ do tải nền lúc đó.
4. Chưa kiểm chứng `-threads 1` trên ffmpeg/libvidstab phiên bản khác (chỉ
   ffmpeg 8.1.2 / libvidstab 1.1.0 trên VM này) và chưa kiểm chứng trên clip
   dài hơn 60s / footage 4K.
5. Mọi đo stabilize ở **1080p** vẫn chạy ≥3 lần + báo spread (quy định đợt 65)
   — KHÔNG nới lỏng: chỉ **720p** (nơi E4 holds, harness C2 assert giống hệt
   ×3) mới được coi là xác định end-to-end. Ở 1080p, render stabilize vẫn
   không xác định dù đã ép threads1 (xem §5.1) — mọi claim về determinism
   ở 1080p phải kèm spread đo thật.
6. render.js chưa log `r.signal` khi ffmpeg bị kill (chỉ log `mã null`) —
   lần sau ffmpeg chết giữa chừng sẽ không biết là SIGKILL (OOM) hay
   SIGTERM/SIGSEGV. Nợ nhỏ: thêm signal vào thông báo lỗi ở dòng ~1906
   (chạm 1 dòng, luồng sau làm).
