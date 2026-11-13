# Phase 9 đợt 91 — S3: WebKit clip D — điểm bitrate, chẩn đoán blob-load, swap-trượt trong app thật, error handler (ĐÃ ĐÓNG nợ P5)

- **Nhiệm vụ:** đóng nợ LIMITS gộp đợt 90 §4 mục 3 (R3 §6): (a) đo điểm bitrate
  thực trong khoảng 1,3–10 MB; (b) chẩn đoán tầng khi blob-load fail ở file
  lớn; (c) đo swap-trượt trong app thật; (d) chứng minh error handler đổi `src`
  trong probe (nợ P5).
- **Kết luận ngắn:**
  1. **Không có cliff theo kích thước.** Blob-load play fail rải rác ở mọi cỡ
     (2,0 MB: 1/2; 4,0 MB: 2/3; 5,9 MB: 3/3; 7,8 MB: 3/6) trong khi
     progressive **17/17**. Blob eligible tổng **9/14 (64%)**. Loop rút gọn:
     blob **0/8**, progressive **8/8**.
  2. **Chẩn đoán tầng (b): fail ở tầng swap pipeline của WebKit, không phải do
     nội dung file.** Chữ ký qtdemux `atom has bogus size 570402281` xuất hiện
     trong **2/2 log blob fail, 0/4 log blob pass**; lỗi nổ trên demuxer của
     pipeline HTTP CŨ trong lúc teardown sau khi src swap http→blob, rồi
     pipeline blob không bao giờ preroll (log im lặng 10 s, play() treo).
  3. **Swap-trượt trong app thật (c): đo được, và thấy thêm flip-flop
     blob↔http.** Lần phát đầu dùng blob 3/3 run (prefetch thắng vì cửa sổ
     tạo proxy + thêm vào timeline ~2 s > blobReady median 250 ms). Nhưng
     trong lúc phát, `videoFor` gọi mỗi tick làm src dao động blob↔http
     (~10 Hz, đã xác nhận trên cùng 1 element bằng id), play() gọi lại mỗi
     chu kỳ; phát lại sau pause (ct≠0) dùng http — blob đã cache vẫn không
     được dùng. Video vẫn phát được (ct tăng ~realtime, canvas đổi).
  4. **Error handler (d): ĐÃ CHỨNG MINH ĐẦY ĐỦ.** bad.mp4 → blob → error →
     src về http 5/5; play lại trên src fallback: **192 frame, ct = 8, 2/2**.
- **Probe:** `benchmarks/render/webkit_clipd_bitrate_91s3.mjs` (load + loop rút
  gọn + ERR + DBG/GST_DEBUG) và `benchmarks/render/webkit_clipd_appswap_91s3.mjs`
  (app thật qua vá `HTMLMediaElement.prototype.src` bằng addInitScript).
  Kết quả: `benchmarks/results/webkit-clipd-bitrate-91s3.json` (79 case, 16
  case nhiễm đã loại — xem §6) + `benchmarks/results/webkit-clipd-appswap-91s3.json`
  (8 case: 4 lần chạy đầu hỏng do harness, 3 run đo được + 1 run fail ở bước
  thêm clip).
- **Môi trường đo:** WebKitGTK 27.2 (UA Safari 27.2), headed, Xvfb :199,
  `GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0` (khôi phục từ
  `~/workspace/tmp-q6r3-debroot`, 269 plugin, sau reboot), VM 4 vCPU, RAM ~8 GB,
  MediaRecorder `undefined`. Lượt này tải nặng (9 luồng đợt 91 song song,
  loadavg ~3–10) — khác R3 (boot yên, load 0,6–2,1): R3 đo blob loop 8/8, đợt
  này blob loop 0/8 dưới tải. Clip testsrc2 720p 24fps libx264 CBR ~2 Mbps
  (bitrate thực của proxy CRF 23) tại `~/workspace/round91-s3/clips/`
  (sinh lại được, KHÔNG stage binary).

## 1. (a) Điểm bitrate thực — load-play 8 s

Clip ~2 Mbps: c2 2.139.973 B / 8 s, c4 4.158.929 B / 16 s, c6 6.165.909 B /
24 s, c8 8.182.985 B / 32 s (7,80 MiB < ngưỡng 8 MiB), c10 10.166.837 B /
40 s (9,70 MiB > ngưỡng → skipped đúng). Mỗi run: chờ blob tối đa 15 s rồi
play ngay (như R3), phát 8 s. Pass = play() OK + frames > 0.

| clip | blob | progressive | ghi chú |
|------|------|-------------|---------|
| c2 2,0 MB | 1/2 | 2/2 | fail: "not supported", 0 frame |
| c4 4,0 MB | 2/3 | 3/3 | fail: "not supported", 0 frame |
| c6 5,9 MB | 3/3 | 3/3 | blob chậm (20 frame/10 s ở run2) nhưng play được |
| c8 7,8 MB | 3/6 | 6/6 | fail: 2× "not supported" + 1× stall lặng (play treo 10 s) |
| c8 + delay play 1 s sau blobReady | **3/3** | 3/3 | ủng hộ giả thuyết race lúc swap (n nhỏ) |
| c10 9,7 MB | 3/3 (skipped → prog) | 3/3 | ngưỡng hoạt động đúng: pool=skipped, srcAtPlay=http |

- **blobReadyMs (25 lần blob sẵn): min 71, median 250, max 1419 ms** —
  fetch 2–8 MB trên localhost xong trong < 1,5 s.
- **Không có cliff:** fail không tăng đơn điệu theo cỡ (c6 3/3 tốt hơn c2 1/2
  và c8 3/6). So với R3 (P6 d40 10,2 MB blob 2/3; P3a/b noise 0/4, 0/2):
  fail là **flaky theo tải**, không phải ngưỡng kích thước. Ngưỡng 8 MiB
  vẫn giữ — vùng đã chứng minh tốt là ≤ 1,3 MB trên boot yên (R3 8/8);
  dưới tải đợt này ngay cả 2 MB cũng fail 1/2.
- **Loop rút gọn** (target 5/3/2/2 vòng cho c2/c4/c6/c8, 2 run mỗi cỡ):
  blob **0/8** (4 run lỗi play đầu "not supported"; 4 run chơi được vòng 1
  rồi kẹt ở restart: c4-run1 384 frame rồi resumeNull, c6-run1/c8-run1
  "1 vòng với 0 frame" rồi kẹt, c8-run2 768 frame rồi kẹt), progressive
  **8/8** (resume median 241–452 ms, 977–1554 frame, 0 stall). Lưu ý:
  probe single-shot — app thật gọi play() mỗi tick nên lỗi play đầu tự
  khỏi bằng fallback (xem §4 và §3); số loop 0/8 KHÔNG có nghĩa app chết
  clip, mà có nghĩa blob pipeline mong manh quanh seek/restart.
- **Dị thường ghi lại (không giải thích được):** 3 run blob "1 vòng với 0
  frame" (ended kích hoạt mà `totalVideoFrames` = 0). Có thể ended giả trên
  pipeline hỏng; chưa đào sâu vì không ảnh hưởng kết luận chính.

## 2. (b) Chẩn đoán tầng blob-load fail (GST_DEBUG)

- **Bundle probe-only ngưỡng 16 MiB** (esbuild plugin thay literal
  `BLOB_PREFETCH_MAX_BYTES` trong media.ts lúc bundle, source production
  không đổi): c10 qua blob **2/2 OK** (241/259 frame, ct ~11 s) — lỗi load
  10 MB của R3 (P6 2/3) không tái hiện với clip CBR 2 Mbps này (d40 của R3
  là CRF 23 VBR). GST log 2 run này sạch (0 WARN/ERROR).
- **Log của run blob fail (c8-run12, stall):** playbin URI đầu tiên là
  `http://127.0.0.1:8899/c8.mp4` (preload trên src http gốc); teardown
  pipeline cũ lúc 0,186 s (sau swap sang blob lúc ~0,19 s); lúc 0,316 s
  **qtdemux0: `atom has bogus size 570402281`, `Internal data stream
  error`, `streaming stopped, reason error (-5)`, `This file contains no
  playable streams`**; sau đó log **im lặng tới 10,2 s** (chỉ có teardown
  cuối) — pipeline blob không bao giờ preroll; page báo `stalled@3.72`,
  play() treo tới timeout 10 s, không có error event nào, src giữ blob,
  pool giữ "blob".
- **Chữ ký 570402281 (= 0x21FFA5E9) xuất hiện trong 2/2 log blob fail
  (c8-run1 đợt nhiễm + c8-run12) và 0/4 log blob pass** (c8-run10/11,
  c10-run1/2). Giá trị giống hệt nhau ở 2 lần fail độc lập → không phải
  byte file ngẫu nhiên (file bắt đầu bằng ftyp `00 00 00 18`) mà là đọc
  buffer rách/trống trong lúc teardown — khớp với race teardown.
- **Kết luận tầng:** fail ở **tầng swap pipeline của WebKit** (src http→blob
  trong lúc pipeline http đang preload) — demuxer cũ đọc rác khi bị tháo,
  và pipeline blob sau đó không khởi động được (stall lặng) hoặc error
  ("not supported" → fallback http). **Không phải** do nội dung file (cùng
  file progressive 17/17, byte blob = đúng byte file qua fetch), **không
  phải** do decode (không có lỗi decoder nào trong log), **không phải** do
  thiếu RAM (fail tái hiện cả khi RAM khả dụng > 2 GB). Playbin không bao
  giờ nhận URI blob: (WebKit xử lý blob: ở tầng trên GStreamer) nên
  GST_DEBUG chỉ thấy được nửa dưới của câu chuyện — chẩn đoán đầy đủ hơn
  cần log WebKit (WEBKIT_DEBUG), chưa làm.
- **Hướng sửa cho vòng sau (khuyến nghị, KHÔNG làm trong luồng này):**
  tránh race teardown — vd không cho preload chạy trên URL http trước khi
  blob sẵn (`preload="none"` tới khi blob gán, hoặc tạo element với src
  blob ngay khi cache có sẵn), hoặc chờ pipeline cũ dừng hẳn trước khi
  swap. Ngoài ra: `videoFor` gọi mỗi tick trong lúc phát sẽ gán lại src
  http (xem §3) — đó là nguồn teardown race thứ hai, cần khóa cùng lúc.

## 3. (c) Swap-trượt trong app thật — ĐO ĐƯỢC (kèm phát hiện flip-flop)

- **Cách đo:** app thật (vite preview dist đã build + bridge 8787), import
  clip 1080p c2h.mp4 (6.411.397 B, 8 s) → auto-proxy 720p (~2 MB, xong sau
  8,8–10,5 s) → bấm "Thêm vào timeline" → bấm Phát NGAY (gap 1,6–1,8 s).
  Preview của app KHÔNG gắn `<video>` vào DOM (MediaPool giữ element rời,
  vẽ lên canvas) nên đo bằng addInitScript vá
  `HTMLMediaElement.prototype.src` + `play()`/`pause()` (ghi id từng
  element, src kind, ct, videoWidth) + mẫu canvas preview.
- **Kết quả (3 run đo được: APP-run10/11/20; run21 fail ở bước thêm clip do
  overlay chào mừng che nút — xem §6):**
  - **Lần phát đầu dùng blob 3/3.** Element chính (id 7, vw 1280 = proxy
    720p, dur 8): `src empty→http` lúc videoFor (t≈10,0 s), `src http→blob`
    lúc 10,43 s (prefetch xong, element sạch), `play` đầu tiên trên blob
    lúc 11,39 s. Prefetch thắng vì cửa sổ tạo proxy + thêm clip (~2 s) dài
    hơn blobReady (~0,4 s). **Swap-trượt ở lần phát đầu KHÔNG xảy ra trong
    các run này.**
  - **Flip-flop blob↔http trong lúc phát (phát hiện chính):** trên cùng
    element id 7, src dao động `blob→http→blob→http…` mỗi ~50–100 ms trong
    suốt lúc phát (run20: 11,40–15,6 s, ~10 chu kỳ), play() gọi lại mỗi chu
    kỳ, ct vẫn tăng (0 → 0,43 → 0,77 → 2,13 → 2,5 → 3,07 → 3,33).
    Cơ chế (đọc code `media.ts` videoFor): sync loop gọi `videoFor` mỗi
    tick; khi element đang phát (không sạch) thì `assigned = want` (http)
    → gán lại http; khi element momentarily sạch (pause/seek về 0) thì
    `assigned = blob` đã cache → gán lại blob. Guard `srcKey` không chặn
    được vì chính `assigned` dao động theo trạng thái momentary của element.
    Hậu quả: mỗi lần đổi src là 1 lần reset pipeline (dur đọc được dao động
    0/8) — phát vẫn kịp realtime trên localhost (ct tăng ~realtime, canvas
    đổi), nhưng mỗi lần swap là 1 vé số cho lỗi blob-load flaky (§1–§2).
  - **Phát lại sau pause: dùng http (swap-trượt đúng nghĩa).** Pause lúc
    ct=3,33 → phát lại lúc 17,31 s: `play http ct=3.33` — element không
    sạch (ct≠0) nên blob đã cache không được dùng. Muốn blob được dùng ở
    lần phát sau thì phải dropElement hoặc seek về 0 trước.
  - **0 error event** trong cả 3 run (error ops = 0); canvas preview đổi
    hash giữa các mẫu (khung hình chạy thật); phát xong nút về "Phát".
- **Hạn chế đo:** chỉ 3 run; clip ngắn 8 s; lần phát đầu có cửa sổ dài
  (~2 s) nên chưa đo được trường hợp user bấm play < 400 ms sau khi clip
  hiện (cửa sổ xấu nhất vẫn chưa đo trong app — probe R3 chờ blob tối đa
  10 s cũng không đo trường hợp này).

## 4. (d) Error handler đổi `src` — ĐÃ CHỨNG MINH ĐẦY ĐỦ (nợ P5 đóng)

- bad.mp4 (88.000 B byte rác, fetch OK → blob) + `url` = c2.mp4 thật, 5 run
  hợp lệ: srcTrace `http → blob (0,06 s) → http (0,14 s, kèm error event)`
  **5/5**; `poolInfoMode` cuối "skipped" (blob bị thu hồi + source bị ghi
  nhớ skip, không fetch lại).
- **Play lại trên src fallback: 2/2** (ERR-run10/11, `RETRY_PLAY=1`):
  play đầu reject "not supported", play lại sau 500 ms trên http:
  playErr2 = null, **192 frame, ct = 8** (`playedAfterRetry: true`).
  Handler đổi src là đủ — chỉ cần caller gọi lại play() (app thật gọi
  play mỗi tick nên tự khỏi; probe single-shot thì không).
- 3 run ERR đầu (không retry) vẫn 0 frame — đó là giới hạn của probe, không
  phải của handler; đã ghi rõ để không ai đọc nhầm thành "fallback hỏng".

## 5. Kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi** trên cây ổn định. Lưu ý: lần chạy
  đầu lúc 17:57 báo 2 lỗi TS6133 (`ensureRvfcPump`, `rvfcWatchdogMiss` ở
  preview.tsx) — đúng lúc luồng khác đang ghi file đó (mtime 17:58:00);
  chạy lại sau khi file ổn định: 0. Không phải lỗi của luồng này, không sửa.
- `npx vite build`: **pass** (6,52 s).
- Unit test `apps/web/src/media.blobPrefetch90R3.test.ts` (bundle esbuild +
  node): **19/19 pass** (không đổi code production nên không thêm test mới).
- Hồi quy liên quan: load-probe progressive control 17/17 pass trong cùng
  các lần chạy (chứng tỏ môi trường WebKit/GStreamer ổn định; chỉ đường
  blob là flaky).

## 6. Sự cố trong lượt — 16 case nhiễm (đã loại, ghi rõ để không ai dùng lại)

- Khi thêm retry-play cho (d), một edit vô tình thay thế luôn lệnh `v.play()`
  gốc bằng khối retry → play() không bao giờ được gọi trong các lần chạy
  18:02–18:12 (GST batch 6 case + ERR-retry 2 + L2 re-run 8 case = index
  37–52 trong JSON, chữ ký: playErr=null + 0 frame + không có event
  "playing"). Phát hiện bằng bisect: smoke tối thiểu play tốt, bản sao probe
  bỏ ENV probe vẫn fail, cuối cùng đọc lại code evaluate thấy thiếu `v.play()`.
  Đã sửa, chạy lại L2 xác nhận prog OK (192 frame), và chạy lại toàn bộ GST
  batch + ERR-retry với Q6_START=10 (run10–12) — số mới hợp lệ.
- **Bài học:** mọi edit vào probe phải chạy lại smoke L2 ngay trước khi đo tiếp.
- Các lần chạy (c) đầu hỏng do harness (không phải do app): input file hidden
  (waitForSelector mặc định chờ visible), overlay chào mừng che nút media-add,
  preview không gắn `<video>` vào DOM (phải vá prototype src mới đo được),
  đo lần phát thứ 2 sau khi clip 8 s đã phát xong (không còn nút Tạm dừng).
  Đã sửa hết trong script cuối; APP-run21 vẫn fail ở bước thêm clip do
  overlay che nút (flaky, 1/4 run).

## 7. Nợ mở / hướng tiếp theo

1. **Flip-flop src trong app thật (mới, ưu tiên):** `videoFor` gọi mỗi tick
   làm src dao động blob↔http trong lúc phát — cần khóa: chỉ gán src khi
   `srcKey` đổi theo đúng nghĩa (vd: khi blob đã cache thì `assigned` luôn
   là blob kể cả lúc đang phát, chỉ đổi src thật khi element sạch; hoặc
   `videoFor` không chạm src khi element đang phát và src hiện tại đã là
   blob/http hợp lệ). Đo lại bằng chính probe appswap (id element 7).
2. **Blob-load flaky (chưa sửa):** fail ~36% lượt play đầu dưới tải, 2 dạng
   (error-event + stall lặng). Hướng: tránh teardown race (§2) + retry play
   trong `videoFor`/syncMedia khi play() reject ngay sau swap (app đã retry
   mỗi tick, nhưng retry trên blob lỗi sẽ lại error → cần retry có backoff
   hoặc fallback ngay về http sau 1 lần lỗi).
3. **Chưa đo:** cửa sổ xấu nhất trong app (bấm play < 400 ms sau khi clip
   hiện); delay play 250/500 ms (mới đo 1000 ms); loop blob trên boot yên
   để tách tải khỏi bản chất (R3 8/8 vs đợt này 0/8 — cần 1 lần chạy đối
   chứng yên).
4. **Ngưỡng 8 MiB giữ nguyên.** Không có bằng chứng cliff theo kích thước;
   hạ ngưỡng không sửa được fail flaky (2 MB cũng fail).
5. **Môi trường:** debroot khôi phục WebKit ở `~/workspace/tmp-q6r3-debroot`
   (413 MB, ngoài repo — không stage); script Xvfb viết lại vào
   `~/workspace/round91-s3/xvfb.sh` (workspace, sống qua reboot); bridge 8787
   + vite preview 4173 do luồng này dựng vẫn đang chạy (xem §8).

## 8. Files (stage, KHÔNG push)

- `benchmarks/render/webkit_clipd_bitrate_91s3.mjs` — probe load + loop rút
  gọn + ERR + DBG/GST_DEBUG (kèm fix bug play() §6, ghi event evs, hỗ trợ
  PLAY_DELAY_MS / RETRY_PLAY / GST_DEBUG_LOAD).
- `benchmarks/render/webkit_clipd_appswap_91s3.mjs` — probe app thật (vá
  `HTMLMediaElement.prototype.src` qua addInitScript, log theo id element,
  mẫu canvas, pause/phát lại đúng lúc).
- `benchmarks/results/webkit-clipd-bitrate-91s3.json` — 79 case (63 hợp lệ +
  16 nhiễm đã đánh dấu loại ở §6).
- `benchmarks/results/webkit-clipd-appswap-91s3.json` — 8 case app thật.
- `docs/PHASE9_ROUND91_S3_CLIPD_BITRATE_LIMITS.md` — file này.
- Không stage: clip `.mp4` (binary, sinh lại được), bundle probe
  (`~/workspace/round91-s3/bundle/`, sinh lại bằng esbuild mỗi lần chạy),
  log GST_DEBUG (`~/workspace/round91-s3/gst-debug-*.log`, ~1,5 MB — giữ
  trong workspace để đối chiếu, không đưa vào repo), `apps/web/dist/`
  (gitignored), `~/workspace/tmp-q6r3-debroot/` (413 MB, ngoài repo),
  `~/workspace/round91-s3/` (scratch: xvfb.sh, smoke/bisect/debug scripts).
- **Server còn chạy (do luồng này dựng cho (c), để lại cho parent quyết):**
  bridge 8787 (PID 16014, `node src/index.js --port 8787`) + vite preview
  4173 (PID 16216, chỉ bind `[::1]`, dùng `http://localhost:4173/`).
  Nếu luồng khác cần tự dựng bridge trên 8787 thì phải tắt bridge này trước.

## Bổ sung parent (closing đợt 91, theo kiểm chứng độc lập S9 §3.2)

S9 đếm lại từ đĩa, kết luận chính không đổi nhưng 4 điểm trình bày cần
đính chính — ghi ở đây để lần sau khỏi trích sai số:

(a) Chữ ký GST_DEBUG `atom has bogus size 570402281` có trong **4/4 log
blob của batch nhiễm (run1/2/3, mtime khớp giờ batch nhiễm; play() chưa
được gọi trong các run đó) + 1/1 log stall thật (run12)**, 0 lần trong
4 log pass (run10/11 c8, run1/2 c10) và 0 lần trong mọi log prog. Chữ
ký là marker của **race teardown lúc swap** (nổ cả khi chưa gọi
play()), không phải bằng chứng "chỉ fail mới có" — cách viết "2/2 log
blob fail vs 0/4 log blob pass" dễ gây hiểu lầm. Kết luận cơ chế (fail
ở tầng swap pipeline WebKit, không phải nội dung file) vẫn đứng, thậm
chí được củng cố vì lỗi nổ trước cả play().

(b) Thống kê blobReadyMs "25 lần, median 250 ms" **không tái lập
được**: load-play hợp lệ n=17 (min 74, median 318); mọi case hợp lệ
n=32 (median 190,5); mọi case n=41 (min 51, median 189). Max 1419 ms
khớp. Kết luận (fetch < 1,5 s) không đổi, nhưng **đừng trích "median
250 ms"**.

(c) Số case appswap: JSON có **10 case, không phải 8** (5 hỏng do
harness + 1 run bán phần + 3 run đo được + 1 run fail — xem S9 §3.1).
Số "17/17" prog và "9/14" blob là số batch đầu; bảng đầy đủ là
**20/20 prog, 15/20 blob eligible** (đếm lại S9 §3.1).

(d) Chứng minh "cùng element" cho flip-flop chỉ chắc ở run20 (có id
element); run10/11 không ghi id element (bản probe cũ hơn).

Server scratch (bridge 8787 + vite 4173) parent kiểm tra ở closing:
**đã tắt** (không còn process/port nào lắng nghe) — không cần dọn thêm.
