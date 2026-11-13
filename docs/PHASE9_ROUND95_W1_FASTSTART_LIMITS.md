# Phase 9 đợt 95 — W1: test clip faststart cho blob-load flaky — GIẢ THUYẾT BỊ BÁC

**Nợ gốc:** LIMITS gộp đợt 94 §4 mục 1 (ƯU TIÊN CAO NHẤT đợt 95) —
giả thuyết V3 §6: qtdemux lúc seek tới moov ở cuối file đã đọc nhầm dữ
liệu media tại ranh giới 2 MiB thành atom header.
**Ngày:** 2026-11-12 (lượt cron 12:35 +07; làm việc 05:39–05:55Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). Không sửa code
production (chỉ probe/script test + LIMITS này). Không đụng TTS 39,
birefnet, không đụng `.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐÃ ĐO XONG — GIẢ THUYẾT BỊ BÁC.** Faststart (moov ở đầu)
không sửa được blob-load flaky; qtdemux vẫn đọc nhầm đúng tại ranh giới
2 MiB ngay cả khi moov đã ở đầu file.

## 1. Kết luận ngắn

| | Clip faststart (W1, MATRIXFS A) | Baseline V3 clip gốc, mode A (prod) |
|---|---|---|
| c2 (2,0 MB, 8 s) | **0/6** (6 error-event) | **0/6** |
| c8 (7,8 MB, 32 s) | **4/6** (2 error-event) | **5/6** |
| **Gộp A (prod blob)** | **4/12 = 33%** | **5/12 = 42%** (cùng 2 clip c2+c8) |
| Progressive đối chứng | **12/12 = 100%** (c2 6/6, c8 6/6) | 6/6 (c2+c8, trong 12/12 toàn bộ) |

Đọc đúng: faststart **không cải thiện gì** — c2 y hệt baseline (0/6 cả
hai bên), c8 kém hơn đúng 1 case (4/6 vs 5/6, nhiễu n=6). Gộp 4/12 vs
5/12 chênh −8pp, không có ý nghĩa thống kê ở n=12 mỗi bên. Tiêu chí
quyết định trong nhiệm vụ ("về ~100% thì đúng, vẫn ~50% thì bỏ") cho
**BỎ giả thuyết** — ít nhất ở dạng "seek tới moov cuối file gây lỗi".

## 2. Clip faststart — phương pháp (chỉ đổi đúng một biến)

- Lệnh (xem script tái tạo `benchmarks/render/gen-faststart-clips-95w1.sh`):
  `ffmpeg -y -v error -i <clip gốc> -c copy -movflags +faststart <clip-fs>`.
  Thời gian: c2 0,54 s, c8 0,49 s (remux, không encode).
- **Lệch khỏi chữ nhiệm vụ, ghi rõ:** nhiệm vụ viết "re-encode … với
  `-movflags +faststart`". W1 dùng `-c copy` (remux) thay vì re-encode
  bằng libx264 — vì re-encode sẽ đổi toàn bộ byte media, làm nhiễu phép
  thử (không phân biệt được "moov dời chỗ" với "bitstream khác"). Remux
  giữ nguyên bitstream, chỉ đổi vị trí moov: phép thử sạch hơn, và vẫn
  đúng tinh thần "moov lên đầu". Kích thước byte y hệt gốc
  (c2 2.139.973, c8 8.182.985), duration y hệt (8 s / 32 s).
- Kiểm chứng bằng ffprobe + parse box (Python, đọc trực tiếp header):
  gốc `ftyp(0) free(32) mdat(40) moov(cuối)` → faststart
  `ftyp(0) moov(32) free mdat` ở cả 2 clip — **moov trước mdat, đã xác
  nhận**. Clip faststart chỉ dùng để test, nằm ngoài repo tại
  `~/workspace/round95-w1/clips-faststart/`; **không thay clip gốc,
  không đưa binary vào batch** (chỉ stage script gen trên).

## 3. MATRIXFS — cách đo (mode A prod như V3, n=12)

- Probe mới `benchmarks/render/webkit_blob_flaky_95w1_faststart.mjs`
  (copy probe V3, đổi `CLIP_DIR` → clips-faststart, `OUT` → JSON riêng,
  thêm mode `MATRIXFS`; `node --check` pass). Mode A = bundle production
  (`media-pool-bundle.js`, ngưỡng blob 8 MiB), load-play như V3
  (play → lấy mẫu 100 ms trong 10 s; pass = play() OK + frames > 0).
  Tên case có hậu tố `-fs` (tránh trùng V3).
- MATRIXFS: c2 + c8, mỗi clip 6 run, mỗi run xen kẽ blob-A rồi prog
  (khử nhiễu tải). Tổng **24 case** (12 blob-A + 12 prog), GST_DEBUG bật
  cho mọi run blob (12 log).
- Môi trường đo: boot `06a92916` (VM reboot ~05:18Z, uptime 24' lúc bắt
  đầu đo), loadavg 1-phút lúc spawn ~2,76 (lúc đo 0,81–10,14 — luồng W6
  đợt 95 chạy Chromium song song trên Xvfb :180; W1 dùng Xvfb :199
  riêng), RAM khả dụng 692 MB lúc spawn, 1.210–2.701 MB trong lúc đo.
  WebKitGTK 27.2 (UA Safari 27.2), GST plugin 269 file, gschemas
  41.821 B — môi trường phải khôi phục lại sau reboot (V3b đã làm:
  `cp -an ~/workspace/tmp-q6r3-debroot/. /` + `glib-compile-schemas`;
  lúc spawn libevent + plugin đều mất). Không có luồng nào khác đo blob
  cùng lúc (chỉ W6 đo deint trên Chromium, không chạm WebKit/probe này).
- Smoke run 1 (4 case) trước khi chạy đủ: c2-fs blob FAIL error-event,
  c2 prog PASS, c8-fs blob PASS, c8 prog PASS — probe chạy đúng, flaky
  tái hiện ngay run đầu.

## 4. Kết quả chi tiết

### 4.1 Tỉ lệ pass theo clip (MATRIXFS A)

| Clip | blob-A faststart | prog faststart | Baseline V3 A (gốc) |
|---|---|---|---|
| c2 | 0/6 | 6/6 (54–102 frame) | 0/6 |
| c8 | 4/6 (27–68 frame) | 6/6 (32–96 frame) | 5/6 |
| **Gộp** | **4/12 = 33%** | **12/12 = 100%** | **5/12 = 42%** |

- Tải không giải thích được fail: c2 fail cả lúc máy nhẹ (loadavg 3,91
  run 6) lẫn lúc nặng (10,14 run 2); c8 fail 1 lần lúc máy nhẹ (1,71)
  và 1 lần lúc vừa (5,22), pass cả lúc nặng (7,16). Cùng pattern V3.

### 4.2 Chữ ký fail — y hệt V3 (8/8 error-event, 0 stall lặng)

- Cả 8 fail đều error-event: swap → error, `play()` reject
  `"The operation is not supported."`, handler fallback về http (http
  load tốt: loadeddata/canplay sau đó), probe single-shot không play lại
  → **0 frame, finalSrcKind=http ở 8/8**.
- Swap→error (errT×1000 − swapMs; chênh ~+50 ms do mốc đo khác nhau):
  c2 521–1.238 ms (6 case); c8 2.081 ms (run 3) và 2.858 ms (run 6) —
  **2 fail c8 error tới muộn ~2–3 s sau swap**, chậm hơn max V3
  (1.126 ms, n=23). Ghi nhận là quan sát mới (n=2), chưa đủ để claim
  faststart làm pipeline blob kẹt lâu hơn trước khi error.
- `poolInfoMode` cuối run: `skipped` ở 8/8 fail, `blob` ở 4/4 pass —
  khớp cơ chế V3 §5 (error handler thu hồi blob + đánh dấu skipped).

### 4.3 GST — bogus size VẪN XUẤT HIỆN với moov ở đầu (bằng chứng bác)

| Clip faststart | Giá trị bogus chính | Vị trí trong file faststart |
|---|---|---|
| c2 | **541230788** (0x204286C4), 11 lần trong 6/6 log fail | **offset 2097152 = 2 MiB** |
| c8 | **2991868683** (0xB2544B0B), 1 lần trong 3/6 log | **offset 2097152 = 2 MiB** |

- Giá trị bogus đã ĐỔI theo file mới (gốc c2: 3946787710; gốc c8:
  570402281) — đúng bằng 4 byte big-endian tại offset 2 MiB của **file
  faststart**. Tức qtdemux vẫn đọc nhầm dữ liệu media tại đúng ranh
  giới 2 MiB thành atom header, **dù moov đã ở đầu file và không cần
  seek tới cuối**. Cơ chế "seek tới moov cuối file" trong giả thuyết V3
  §6 vì vậy **không còn đứng được** — việc đọc nhầm không phụ thuộc vị
  trí moov.
- Giá trị hiếm 162705492 xuất hiện lại ở c2-fs run 2/4/6 (như V3 run 3):
  trong file faststart nó nằm tại offset 2100315 = 2 MiB + 3163; trong
  file gốc nó nằm tại 2097184 = 2 MiB + 32. Đây là **cùng một byte media**
  ở cả hai file (mdat-relative offset 2097144 ở cả hai — bitstream giữ
  nguyên nhờ `-c copy`, chỉ dời chỗ). Hai lần đọc nhầm đều neo quanh
  ranh giới 2 MiB của luồng media, không neo theo vị trí tuyệt đối của
  moov.
- Tương quan bogus ↔ kết quả (12 case blob): fail có bogus 7/8; pass có
  bogus 2/4; pass không bogus 2/4. Vẫn "bogus chưa đủ để fail" như V3.
- **Ngoại lệ mới: 1 fail KHÔNG có bogus** — Lc8-fs-blobA-run6 (FAIL
  error-event, 0 lần `bogus size` trong log 1.100 dòng, 355 dòng
  qtdemux). Log của nó cho thấy qtdemux lỗi kiểu khác:
  `failed to find fragment defaults for stream 1` (parse_trex) rồi
  `Internal data stream error` / `streaming stopped, reason error (-5)`
  ở 2 pipeline instance (qtdemux0 lúc 2,34 s, qtdemux1 lúc 3,24 s),
  không có dòng `atom has bogus size` nào. V3 có "fail ⇒ bogus" 24/24;
  gộp V3+W1 là 31/32. **"Fail ⇒ bogus" nay chỉ còn 97%, không còn tuyệt
  đối** — có ít nhất một đường fail thứ hai trong qtdemux (trex/fragment
  defaults) không qua bogus size.
- **0 lần chuỗi "blob" trong 12/12 GST log** — như V3 (52/52): playbin
  không bao giờ nhận URI blob; dữ liệu blob đi qua đường khác, không
  quan sát được từ log này.

## 5. Verdict giả thuyết

**GIẢ THUYẾT V3 §6 BỊ BÁC** ở dạng đã phát biểu ("qtdemux lúc seek tới
moov cuối file đọc nhầm tại ranh giới 2 MiB"). Bằng chứng:
1. Tỉ lệ blob-load không cải thiện (4/12 vs baseline 5/12; c2 0/6 y hệt).
2. Bogus size vẫn xuất hiện, với giá trị mới đúng bằng byte tại 2 MiB
   của file faststart — việc đọc nhầm xảy ra độc lập với vị trí moov.

**Còn đứng (hẹp hơn):** có một cơ chế đọc nhầm quanh ranh giới 2 MiB
trong đường phát blob của WebKitGTK/GStreamer, không liên quan vị trí
moov — có thể liên quan cách nguồn blob cấp dữ liệu theo khối 2 MiB
(hoặc cách qtdemux pull dữ liệu), nhưng đó chỉ là suy đoán, chưa có
bằng chứng trực tiếp. Hướng điều tra tiếp theo nên là: nguồn cấp dữ liệu
blob (WebKitGTK đưa blob cho GStreamer bằng cơ chế nào — vì 0 lần "blob"
trong log) và vì sao progressive (cùng file, cùng qtdemux) không bao giờ
gặp lỗi này; KHÔNG nên thử thêm biến thể moov/faststart nào nữa.

**Không làm theo hướng này nữa:** faststart không phải mitigation cho
blob flaky — không đề xuất đổi clip trong repo sang faststart vì lý do
này (clip gốc giữ nguyên).

## 6. Kiểm chứng

- `node --check benchmarks/render/webkit_blob_flaky_95w1_faststart.mjs`: pass.
- Không sửa code production (`src/` không đổi) → không cần tsc/vite build.
- MATRIXFS 24 case, EXIT=0 cả 2 lần chạy (smoke run 1 + runs 2–6);
  JSON đủ 24 case, tên case có `-fs`, không trùng V3.
- GST: 12 log blob (1/case), đủ cả 12; prog không bật GST (như V3).
- Không process mồ côi của W1: mọi browser probe đã đóng
  (`browser.close()` trong finally); Xvfb :199 do W1 bật vẫn chạy
  (display server dùng chung, để lại như tiền lệ các luồng khác);
  không giết process của luồng khác.
- Số đo chỉ cho 2 clip testsrc2 720p faststart (c2/c8), 1 cửa sổ tải
  (loadavg 0,81–10,14), WebKitGTK 27.2 + GStreamer trên VM này; không
  suy ra cho 4K, codec khác, hay Safari thật.

## 7. Nợ mở (cho đợt sau, không thuộc W1)

1. **Mitigation retry-play sau error-fallback** (nợ đợt 94 mục 2, vẫn
   mở): sửa handler `media.ts` để error sau blob → fallback http xong
   thì `play()` lại 1 lần. Kỳ vọng cứu phần lớn 23+8 fail error-event
   (http sau fallback đã loadeddata/canplay). Đây là hướng còn lại có
   giá trị nhất sau khi faststart bị bác — cần đo MATRIX A trước/sau
   (n=12 mỗi bên) + flip-flop không hồi quy + O8 cả 2 engine.
2. **Cơ chế gốc 2 MiB trong đường blob** (mới, từ §5): vì sao qtdemux
   đọc nhầm tại ranh giới 2 MiB dù moov ở đâu; vì sao progressive cùng
   file không lỗi; đường cấp dữ liệu blob của WebKitGTK là gì (0 lần
   "blob" trong 64/64 log V3+W1). Cần GST log sâu hơn / strace nguồn cấp,
   không phải thử thêm biến thể container.
3. **Đường fail thứ hai không bogus** (mới, §4.3): Lc8-fs-blobA-run6 —
   qtdemux `failed to find fragment defaults` + Internal data stream
   error, không bogus. Cần xem có tái hiện không và có phải cùng một
   gốc với bogus hay không.
4. **Error tới muộn ~2–3 s sau swap** (mới, §4.2): 2/8 fail c8-fs error
   muộn hơn hẳn max V3 — cần n lớn hơn để biết có phải đặc tính của
   faststart hay chỉ phương sai.
5. Đứng yên: TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi;
   `.github/workflows/*.yml` 403; release gate không đổi.

## 8. File thay đổi (stage, KHÔNG push)

- `benchmarks/render/webkit_blob_flaky_95w1_faststart.mjs` — probe W1
  (copy probe V3 + mode MATRIXFS, clip faststart c2/c8).
- `benchmarks/render/gen-faststart-clips-95w1.sh` — script tái tạo clip
  faststart (remux `-c copy -movflags +faststart`).
- `benchmarks/results/webkit-blob-flaky-95w1-faststart.json` — kết quả
  24 case MATRIXFS (12 blob-A + 12 prog).
- `docs/PHASE9_ROUND95_W1_FASTSTART_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round95-w1-faststart`
(`~/workspace/repo-1-push/paths-loop/phase9-round95-w1-faststart.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w1.md`.
Log chạy: `hidden_files/round95-w1/matrixfs-smoke.log` +
`matrixfs-runs2-6.log` + `gst/` (12 log) + `bundle/` (4 bundle probe-only).
Clip faststart (binary, ngoài repo, không stage):
`~/workspace/round95-w1/clips-faststart/c2.mp4`, `c8.mp4`.
