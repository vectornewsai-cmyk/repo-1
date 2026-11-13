# Phase 9 đợt 93 — U2: Flip-flop src, đo đối chứng sau fix T1

- **Nhiệm vụ:** đo đối chứng latch `srcLatch` (T1, đợt 92, `apps/web/src/media.ts`)
  theo nợ LIMITS gộp đợt 92 §4 mục 2: (a) loop/load-play blob sau fix —
  blob-load flaky ~25% trước fix có giảm không; (b) cửa sổ bấm phát <400 ms
  sau seek/load; (c) lần phát đầu chốt http thì phát lại vẫn http tới khi
  scrub về 0.
- **Kết luận ngắn:**
  1. **Flip-flop trong app thật: 0.** 10/10 run app, số lần đổi kind
     blob↔http là 0 hoặc 1 (1 = upgrade http→blob có chủ đích duy nhất
     trước lần phát đầu; 0 = latch http suốt run) — không run nào ≥2.
     Trước fix: 22 lần đổi kind/run (T1 đo lại). Số lần gán src 1–2/run
     (trước: 23). play() 3–7 lần/run (trước: 13–15; T1 sau fix: 4–5).
     0 error event, 0 stall ≥1,5 s ở mọi pha mọi run.
  2. **Blob-load flaky KHÔNG giảm ở tầng bundle.** Load-play blob **5/12
     (42%)** vs prog 12/12; trước fix 15/20 (75%) vs 20/20. Loop blob
     **0/8** vs prog 8/8 — khớp y hệt baseline trước fix. Chênh lệch
     load-play chưa đạt ý nghĩa thống kê (Fisher two-sided p ≈ 0,13) và
     tải lượt này nặng hơn, nên không kết luận "latch làm tệ hơn" — nhưng
     chắc chắn latch không sửa được flaky: đúng kỳ vọng cơ chế, vì latch
     không đổi đường swap ban đầu (prefetch callback vẫn upgrade khi
     element sạch), race teardown http→blob còn nguyên. Nợ flaky vẫn mở.
  3. **(c) ĐÃ XÁC NHẬN ĐẦY ĐỦ bằng đo thật.** Lần phát đầu chốt http
     (4/10 run) → phát lại sau pause vẫn http 4/4 → scrub về 0 lúc đang
     phát thì vẫn http, không upgrade (10/10) → TẠM DỪNG rồi scrub về 0,
     chờ 800 ms cho element pristine thật → upgrade http→blob đúng 1 lần
     (run8 — 1/1 run http-latched có pha 4) → phát lại trên blob@ct0.
     Đây là hành vi có chủ ý của latch, không phải lỗi.
  4. **(b) Cửa sổ <400 ms: ĐÃ ĐO.** Bấm phát 228–390 ms sau "Thêm vào
     timeline" (10/10 run <400 ms): src chốt http 4/10, blob 6/10 — chia
     theo tốc độ fetch proxy (~2 MB): fetch xong trong 50–140 ms thì
     upgrade kịp trước khi bấm phát → blob; fetch chậm hơn dưới tải →
     http. Sau seek (Home) bấm phát 185–336 ms lúc đang phát: src giữ
     nguyên latch 10/10, không flip, không stall; seek hạ cánh ở
     ct≈0,11–0,21 (không đúng 0 vì phát tiếp tục ngay sau seek).
- **Không sửa production** (chỉ đo; không phát hiện hồi quy/lỗi thật nào
  do latch gây ra). Không đụng TTS 39, không đụng `.github/workflows`.
- **Môi trường đo:** VM reboot ~23:36Z 11/11 (boot mới; uptime 7' lúc giao
  việc, 2586 s lúc đo bundle); RAM khả dụng ~1,15 GB; loadavg lúc đo
  2,8–13,2 (8–10 luồng đợt 93 song song — tải NẶNG hơn S3 lúc đo baseline
  load-play, loadavg 3–10). WebKitGTK 27.2 (Playwright webkit-2388, UA
  Safari 27.2), Xvfb :199, GST plugin 269 file đã có sẵn sau reboot
  (không cần khôi phục debroot; `gschemas.compiled` 41.821 B, mtime
  23:37Z). Bridge 8787 + vite preview 4173 (dist build mới 23:51Z, tsc 0)
  do luồng này dựng, tắt cuối lượt.
- **Baseline trước fix (để đối chiếu):** load-play blob 15/20 vs prog
  20/20; loop blob 0/8 vs prog 8/8 (S3 §1 + S9 đếm lại, LIMITS gộp đợt 91
  §4 mục 1); flip-flop 22 lần đổi kind/run, 23 lần gán src/run, play()
  13–15 lần/run (S3/T1).

## 1. (a) Bundle: load-play + loop (MediaPool trực tiếp, không qua UI app)

- **Probe:** `benchmarks/render/webkit_flipflop_counter_93u2_bundle.mjs`
  (dựa trên probe bitrate S3, chỉ đổi output/port/bundle-dir + ghi
  `srcTrace` cho cả loop). Server HTTP range-support cổng 8896, clip
  testsrc2 c2/c4/c6/c8 tại `~/workspace/round91-s3/clips/`. Kết quả:
  `benchmarks/results/webkit-flipflop-counter-93u2-bundle.json` (40 case).
- **LƯU Ý phương pháp (đọc trước khi trích số):** probe này gọi `videoFor`
  1 lần rồi play (như R3/S3) nên KHÔNG tập flip-flop mỗi tick của app —
  nó đo race swap ban đầu (http→blob lúc prefetch về) + độ ổn định
  pipeline blob quanh seek/restart. Latch T1 chỉ khóa flip-flop mỗi tick
  nên KHÔNG kỳ vọng số bundle cải thiện; số bundle là đối chứng cho giả
  thuyết "latch sửa được flaky" — và đối chứng cho thấy giả thuyết đó
  SAI ở tầng này.

### 1a. Load-play (8 s, pass = play() OK + frames > 0)

| clip | blob | prog |
|------|------|------|
| c2 2,0 MB | 0/3 | 3/3 |
| c4 4,0 MB | 1/3 | 3/3 |
| c6 5,9 MB | 2/3 | 3/3 |
| c8 7,8 MB | 2/3 | 3/3 |
| **tổng** | **5/12 (42%)** | **12/12 (100%)** |

- Dạng fail blob: "not supported" 5× (Lc2×3, Lc4-run1, Lc6-run1) +
  stall lặng play-timeout-10s 2× (Lc4-run2, Lc8-run2) — đúng 2 dạng của
  S3 §7 mục 2. Mẫu fail: srcTrace `http → blob (prefetch về) → error →
  fallback http`, play() đã reject nên probe single-shot (không retry)
  được 0 frame; poolInfoMode cuối "skipped" (blob bị thu hồi + ghi nhớ
  skip). Stall lặng: evs chỉ tới `stalled@6.58`, 0 frame, không error
  event nào.
- Không có cliff theo cỡ (c2 nhỏ nhất lại fail nhiều nhất 0/3) — khớp S3.
- blobReadyMs các run blob: 135–2004 ms (median ~500 ms); run fail cũng
  có blobReadyMs (fetch xong, lỗi ở tầng pipeline sau swap).
- So sánh: 5/12 (42%) vs 15/20 (75%) — Fisher two-sided p ≈ 0,13,
  **không có ý nghĩa thống kê**. Tải lượt này nặng hơn lúc S3 đo
  (loadavg tới 13,2 vs 3–10) nên không so tuyệt đối được; mẫu blob n=12
  (nhỏ hơn baseline n=20). Kết luận đứng được: **không có bằng chứng
  latch làm giảm flaky load-play**.
- Prog 12/12 pass (47–172 frame) — môi trường WebKit/GStreamer ổn định,
  chỉ đường blob là flaky (khớp S3 §5).

### 1b. Loop (target 5/3/2/2 vòng cho c2/c4/c6/c8; pass = đủ vòng + 0 stall ≥1,5 s)

| | blob | prog |
|--|------|------|
| loop pass | **0/8** | **8/8** |

- **Khớp y hệt baseline trước fix (blob 0/8 vs prog 8/8).**
- Chi tiết blob 0/8: 6 run fail ngay play đầu "not supported" (0 vòng),
  1 run stall timeout (0 vòng), LOOPc6-run1 chơi được 1 vòng (384 frame)
  rồi kẹt ở restart, LOOPc8-run2 "1 vòng với 0 frame" (ended kích hoạt
  mà totalVideoFrames = 0 — dị thường S3 §1 đã ghi, tái hiện lần nữa).
- Prog 8/8: resume median 241–908 ms, 459–1554 frame, 0 stall.

## 2. (b)(c) App thật (vite preview + bridge, clip c2h.mp4 1080p → proxy 720p)

- **Probe:** `benchmarks/render/webkit_flipflop_counter_93u2_app.mjs`
  (dựa trên probe appswap T1, thêm pha 4 từ run7). Vá
  `HTMLMediaElement.prototype.src` qua addInitScript (log mọi lần gán
  src/play/pause/error theo id element) + sampler ct 250 ms qua hook
  `__vcutMediaEls` + marker pha trong srcLog (p1-play / p2-replay /
  p3-play / p4-play) để gán play op đúng pha. Kết quả:
  `benchmarks/results/webkit-flipflop-counter-93u2-app.json` (10 case).
- Mỗi run 3–4 pha: (p1) thêm vào timeline → Phát NGAY; (p2) pause ở
  ct≠0 → phát lại; (p3) Home (scrub về 0) → Phát NGAY lúc đang phát;
  (p4, từ run7) TẠM DỪNG → Home → chờ 800 ms pristine → phát lại.

### 2a. Tổng hợp 10 run

| run | p1 gap add→phát | p1 src đầu | p2 phát lại | p3 sau Home | p4 sau pause+Home | kindChanges | srcOps | play() | error |
|-----|------|-----------|-------------|-------------|-------------------|----|----|----|----|
| 1 | 373 ms | http | http@ct0.7 | http@ct0.14 | — (chưa có p4) | 0 | 1 | 4 | 0 |
| 2 | 283 ms | http | http@ct1.3 | http@ct0.14 | — | 0 | 1 | 5 | 0 |
| 3 | 239 ms | http | http@ct0.87 | http@ct0.17 | — | 0 | 1 | 3 | 0 |
| 4 | 390 ms | blob | blob@ct1.93 | blob@ct0.14 | — | 1 | 2 | 4 | 0 |
| 5 | 235 ms | blob | blob@ct0.83 | blob@ct0.11 | — | 1 | 2 | 5 | 0 |
| 6 | 229 ms | blob | blob@ct1.9 | blob@ct0.17 | — | 1 | 2 | 5 | 0 |
| 7 | 279 ms | blob | blob@ct0.83 | blob@ct0.21 | blob@ct0 | 1 | 2 | 6 | 0 |
| 8 | 256 ms | **http** | **http@ct1.7** | http@ct0.14 | **blob@ct0** (upgrade 22.63 s) | 1 | 2 | 6 | 0 |
| 9 | 228 ms | blob | blob@ct0.87 | blob@ct0.14 | blob@ct0 | 1 | 2 | 5 | 0 |
| 10 | 260 ms | blob | blob@ct0.9 | blob@ct0.14 | blob@ct0 | 1 | 2 | 7 | 0 |

- **(b1) Bấm phát <400 ms sau add: 10/10 run gap 228–390 ms.** Src chốt
  http 4/10, blob 6/10. Cơ chế chia: upgrade http→blob xảy ra 50–140 ms
  sau lần gán src đầu (run4: 8.24→8.38 s; run5: 9.05→9.10 s; run6:
  8.18→8.29 s; run7/9/10 tương tự) — fetch proxy ~2 MB xong nhanh thì
  upgrade kịp trước khi probe bấm phát → blob; fetch chậm hơn dưới tải
  (run1–3, 8) thì bấm phát lúc blob chưa về → latch http. Đây là race
  thời gian thật, không phải lỗi.
- **Flip-flop = 0 ở mọi run.** kindChanges chỉ 0 hoặc 1; lần đổi kind
  duy nhất (nếu có) luôn là upgrade http→blob có chủ đích TRƯỚC lần
  phát đầu. Trong lúc phát (3 s p1 + 4 s p2 + 4 s p3 + 3 s p4) không có
  lần gán src nào thêm. Trước fix: 22 lần đổi kind/run.
- **(c) Phát lại sau pause giữ nguyên latch: 10/10** (http→http 4/4,
  blob→blob 6/6), ct tiếp tục từ điểm pause (0.7–1.93 s), không reset
  về 0. Đúng thiết kế T1 §2 (đổi src sẽ reset ct về 0 nên latch giữ).
- **(b2) Sau seek (Home) bấm phát 185–336 ms lúc đang phát: src giữ
  nguyên latch 10/10, không upgrade trước phát (upgradeBeforePlay =
  False 10/10), không flip, không stall.** Lưu ý: nút Phát không còn
  (app vẫn đang phát nên nút hiện "Tạm dừng") — lần phát sau seek là
  app tự phát lại khi seek hạ cánh (play op ct 0.11–0.21), không phải
  cú bấm của probe. Seek hạ cánh ở ct≈0,11–0,21, không đúng 0, vì phát
  tiếp tục ngay sau seek — element không bao giờ pristine trong pha này.
- **(c2) Pha 4 — TẠM DỪNG rồi scrub về 0 (run7–10):** sau pause + Home
  + chờ 800 ms, element đọc được `t=0, paused=true, seeking=false`
  (pristine thật, ct đúng 0 — khác pha 3 lúc đang phát). Run8
  (run duy nhất latch http trong nhóm có pha 4): upgrade `http→blob`
  lúc 22.63 s trong lúc chờ, phát lại trên **blob@ct0**; các run đã
  latch blob (7, 9, 10) giữ blob, phát lại blob@ct0. Chuỗi đầy đủ của
  run8: phát đầu http → phát lại http → scrub về 0 lúc đang phát vẫn
  http → pause + scrub về 0 → upgrade → phát lại blob. **(c) xác nhận
  trọn vẹn, đúng hành vi có chủ ý của latch.**
- **0 stall ≥1,5 s ở mọi pha mọi run; 0 error event ở mọi run; ct tăng
  đơn điệu trong mỗi pha phát** (sampler 250 ms qua `__vcutMediaEls`).
  Canvas preview đổi hash ở đa số pha (p1: 9/10; p2: 10/10) — xem §4
  mục 5 về độ tin cậy của chỉ số này.

## 3. Kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi** (chạy 2 lần: lúc dựng dist
  23:51Z và cuối lượt).
- `npx vite build`: **pass (25,00 s)**.
- Unit test `apps/web/src/media.blobPrefetch90R3.test.ts` (bundle esbuild
  + node): **25/25 pass** (19 cũ + 6 mới T1 — latch vẫn giữ đúng hành vi
  đã test, không sửa production nên không thêm test mới).
- Không sửa file production nào trong lượt này (chỉ thêm 2 probe + 2
  JSON kết quả + LIMITS này).
- Lưu ý sự cố nhỏ lúc chạy unit test: lần esbuild đầu ghi nhầm outfile
  `--outfile=~/...` (bash không expand `~` sau `=`) tạo thư mục stray
  `~/workspace/repo-1/~/...` — đã xóa ngay sau khi phát hiện (chỉ chứa
  bundle test, không có file repo nào bị đụng); chạy lại với `$HOME`
  thì 25/25.

## 4. Giới hạn thật / nợ còn lại

1. **Blob-load flaky vẫn MỞ (nợ chính, không do latch):** load-play blob
   5/12, loop blob 0/8 sau fix — y hệt trước fix. Hướng sửa (đã nêu ở
   S3 §2, chưa làm): tránh race teardown lúc swap ban đầu — vd
   `preload="none"` tới khi blob sẵn (đừng cho pipeline http preload
   trước khi swap), hoặc chờ pipeline cũ dừng hẳn trước khi swap, hoặc
   retry play có backoff + fallback ngay về http sau 1 lần lỗi (app đã
   retry mỗi tick, nhưng retry trên blob lỗi sẽ lại error — cần 1 lần
   lỗi thì fallback, như error handler đã làm cho bad.mp4).
2. **So sánh load-play bị nhiễu tải:** mẫu blob n=12 (nhỏ hơn baseline
   n=20); loadavg lượt này tới 13,2 vs 3–10 lúc S3 đo. Cần 1 lần đo đối
   chứng trên boot yên để tách tải khỏi bản chất (nợ cũ S3 §7 mục 3,
   vẫn mở).
3. **Pha 4 chỉ có 1 run http-latched (run8):** upgrade-sau-pristine mới
   chứng minh 1/1. Muốn n lớn hơn cho nhánh http-latched thì cần ép
   fetch chậm lại (vd: dùng clip proxy lớn hơn làm timeline clip, hoặc
   bấm phát nhanh hơn nữa — hiện 228–390 ms sau add đã là nhanh nhất
   qua evaluate; fetch 50–140 ms vẫn thắng race 6/10 lần).
4. **`firstSrcToPlayGapMs` trong JSON luôn = 0 — artifact đo, đừng
   trích.** Poll evaluate trả về muộn dưới tải (src op xảy ra trước khi
   evaluate poll bắt đầu), nên gap tính trong trang luôn ~0 ms. Gap
   thật dùng `addToPlayGapMs` (đo bằng wall clock Node, 228–390 ms).
5. **`canvasChanged` là chỉ số yếu:** hash = độ dài + 30 ký tự dataURL,
   cho False ở vài pha dù ct vẫn tăng đều (p1-run1; p3-run1/2/3;
   p4-run8). Không dùng làm tiêu chí pass/fail; tiêu chí là ct +
   playOps + srcLog.
6. **Chưa đo:** delay play 250/500 ms có chủ đích (chỉ đo "nhanh nhất
   có thể" 228–390 ms); loop trong app thật (chỉ loop ở tầng bundle);
   lần phát đầu chốt http rồi dropElement (element mới quyết định lại —
   đã có unit test T1, chưa đo trong app).

## 5. Files (stage, KHÔNG push)

- `benchmarks/render/webkit_flipflop_counter_93u2_bundle.mjs` — probe
  bundle (load + loop, dựa trên probe bitrate S3).
- `benchmarks/render/webkit_flipflop_counter_93u2_app.mjs` — probe app
  thật (pha 1–4, dựa trên probe appswap T1).
- `benchmarks/results/webkit-flipflop-counter-93u2-bundle.json` — 40
  case (load 24 + loop 16).
- `benchmarks/results/webkit-flipflop-counter-93u2-app.json` — 10 case
  (run1–6 pha 1–3, run7–10 pha 1–4).
- `docs/PHASE9_ROUND93_U2_FLIPFLOP_COUNTER_LIMITS.md` — file này.
- Không stage: bundle probe (`hidden_files/round93-u2/bundle/`, sinh lại
  bằng esbuild mỗi lần chạy), clip `.mp4` (binary, sinh lại được),
  `apps/web/dist/` (gitignored), log chạy
  (`hidden_files/round93-u2/*.log`, ngoài repo), script smoke
  `webkit-smoke.mjs` (ngoài repo).
- **Server scratch do luồng này dựng (tắt cuối lượt theo brief):**
  bridge 8787 + vite preview 4173 — đã tắt sau khi đo xong (xem log
  luồng). Xvfb :199 để lại chạy (dùng chung các lượt).
