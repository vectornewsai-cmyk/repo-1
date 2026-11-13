# Phase 9 đợt 95 — W2: retry-play sau error-fallback (mitigation blob-flaky)

**Nợ gốc:** LIMITS gộp đợt 94 §4 mục 2 — retry-play sau error-fallback.
**Ngày:** 2026-11-12 (lượt cron 12:35 +07; làm việc ~05:39–07:00Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). Không đụng TTS 39,
không đụng `.github/workflows`, 0 binary vào batch.
**Trạng thái: ĐÃ SỬA + ĐÃ ĐO — mitigation có tác dụng thật trên chữ ký
error-event, nhưng KHÔNG sửa được toàn bộ flaky (còn stall lặng + lỗi đến
muộn ngoài cửa sổ đo).**

## 1. Kết luận ngắn — MATRIX A trước/sau (n=12 mỗi bên, clip/probe như V3)

| | BEFORE (code cũ) | AFTER (retry-play) |
|---|---|---|
| A prod blob, loose (frames > 0, định nghĩa V3) | **6/12 = 50%** | **10/12 = 83%** |
| A prod blob, strict (frames > 0 và finalCt ≥ 1 s) | **3/12 = 25%** | **8/12 = 67%** |
| Fail error-event | 6/12 | 1/12 (cộng 1 stall-timeout) |
| Fail stall lặng (chữ ký 2, ngoài phạm vi mitigation) | 0/12 | 1/12 |
| prog đối chứng | 12/12 | 12/12 |
| Case error-event được retry-play cứu (frames 0 → ct 3,3–4,0 s) | — | **2/3** |

- **Tác dụng trực tiếp đo được: 2/3 case error-event được cứu** (cả 2 đều
  clip c2 — clip tệ nhất ở V3: 0/6 blob; retry bắn đúng 1 lần sau canplay
  của http fallback, `retryPlay95W2Fired=1`, ct tiến 3,33–3,96 s trong
  cửa sổ 10 s). Case error-event thứ 3 (Lc8-run4) **không được cứu trong
  cửa sổ đo**: error đến rất muộn (t=7,09 s, ~3,7 s sau play — ngoài dải
  128–1126 ms của V3) nên http fallback mới loadstart lúc 7,28 s mà
  chưa tới canplay khi cửa sổ 10 s đóng (rs=0 lúc 9,82 s); retry đã arm
  (intent=1, fallback đã chạy) nhưng canplay chưa tới nên chưa bắn —
  xem §5. Trong app thật (không có cửa sổ 10 s) retry sẽ bắn khi canplay
  tới; đây là giới hạn của phép đo, không phải lỗi logic mitigation.
- **Phần tăng còn lại của 6→10 KHÔNG phải do mitigation:** 2 case pass outright không cần retry (blob lần đó không lỗi — may mắn theo run:
  c6-run6 marginal, c4-run6 khỏe). Quy đúng: mitigation cứu 2, may mắn
  run +2, còn 1 error-event + 1 stall vẫn fail. Đừng trích "83%" như
  "fix sửa được 83% flaky" — trích đúng: **error-event 6/12 → 1/12
  trong cửa sổ đo (1 case đến muộn chưa kịp canplay), stall lặng vẫn 0/1
  cứu được.**
- Strict (finalCt ≥ 1 s) tăng 3→8: 2 rescued + 3 case pass khỏe outright
  (c4/c6 AFTER khỏe hơn BEFORE — tải từng pha khác nhau, không gán cho
  mitigation). Tiêu chí strict là bổ sung của W2 (V3 chỉ dùng frames>0);
  nhiều case "pass loose" chỉ có 1–6 frame / ct 0,08–0,92 s ở cả 2 phía
  (BEFORE: c6r1/r2, c8r3; AFTER: c2r6, c6r6) — xem §6 về hiện tượng này.

## 2. Thay đổi code (`apps/web/src/media.ts`, marker "Đợt 95 W2")

1. **Theo dõi ý định phát:** khi tạo element trong `videoFor()`, wrap
   `el.play()` / `el.pause()` (guard `typeof` để shim test cũ không có
   `play()` thì bỏ qua, không throw): `play()` set
   `dataset.playIntended95W2="1"`, `pause()` xóa. Lý do: play() bị reject
   vì lỗi blob không phát event "play" nên pool không đọc được ý định từ
   event; wrap là cách duy nhất trong pool biết caller có đang muốn phát
   không — tránh tự phát khi user đang pause/scrub (blob lỗi lúc
   preload). `dropElement`/`pauseAll()` gọi `pause()` nên tự xóa intent
   khi element bị drop hoặc dừng hết.
2. **Retry-play trong error handler** (nhánh fallback proxy→gốc): sau khi
   đổi src về `cur.url` + đồng bộ latch/srcKey, nếu intent=1 và chưa
   retry cho URL fallback này (`retryPlay95W2For !== cur.url`) thì arm:
   `readyState ≥ 2` thì play ngay, không thì nghe `canplay` một lần
   (`{once:true}`) rồi `play()` lại. Lúc bắn kiểm tra lại đủ 4 điều kiện
   (đúng URL fallback, `srcKey` vẫn là fallback, intent còn "1",
   element còn paused) rồi mới play, `catch` lặng. Ghi
   `dataset.retryPlay95W2Fired="1"` + `retryPlay95W2At` (ms) để probe đọc.
3. **Guard chống vòng lặp:** `retryPlay95W2For` chốt theo URL fallback của
   đợt; reset khi `proxyUrl` đổi (cùng chỗ reset `proxyFallback` trong
   `videoFor`). Nếu http fallback cũng lỗi thì không fallback lần 2, không
   arm lại; canplay lặp / app loop đã play lại trước / user pause giữa
   chừng đều bị 4 điều kiện lúc bắn chặn. Chỉ retry ĐÚNG 1 lần mỗi episode.
4. **Phạm vi:** chỉ đường proxy-fallback (23/23 chữ ký V3 đi đường này).
   Đường blob-lỗi KHÔNG proxy (handler chỉ revoke, src phục hồi ở tick
   `videoFor` sau) CHƯA có retry — nợ mở (§7). Trong app, `syncMedia`
   gọi `play()` mỗi tick khi element active + paused nên đường này ở app
   vốn đã được loop play lại; mitigation chủ yếu giúp caller single-shot
   (probe) và làm resume trong app nhanh/xác định hơn (bắn ngay khi
   canplay thay vì chờ tick sau) — xem §6.

## 3. Đo MATRIX A — phương pháp

- Probe mới `benchmarks/render/webkit_blob_flaky_95w2.mjs` (copy V3, đổi:
  port 8899 vì W1 đang dùng 8897; bundle/gst/JSON riêng
  `hidden_files/round95-w2/`; mode MATRIXA chỉ A prod + prog, mỗi clip
  3 run xen kẽ; `summarizeLoad` thêm `framesOk` / `rescued95W2` /
  `retryPlay95W2Fired` / `retryPlay95W2At` đọc từ dataset của element;
  giữ định nghĩa `playOk` cũ của V3 để so sánh được).
- BEFORE: runs 1–3 (code chưa sửa), AFTER: runs 4–6 (Q6_START=4, sau khi
  sửa + tsc/build/test xanh). Cùng clip c2/c4/c6/c8 (moov cuối, không
  faststart), `waitBlobMs=15000`, `wallMs=10000`, GST_DEBUG từng run blob.
- Môi trường: boot 06a92916 (reboot 05:18Z, uptime 29' lúc BEFORE, 55'
  lúc AFTER); WebKitGTK 27.2; Xvfb :201 riêng (W1 dùng :180, W3 dùng
  :193); loadavg 1-phút lúc case BEFORE 0,86–10,73, AFTER 0,54–16,79
  (AFTER chạy lúc tải NẶNG hơn ở các run đầu — vẫn tốt hơn); MemAvailable
  1052–2685 MB (BEFORE) / 1236–3121 MB (AFTER). 8–10 luồng đợt 95 chạy
  song song cả 2 lượt đo.
- **Phối hợp với W1:** W1 (faststart) đang chạy MATRIXFS lúc W2 bắt đầu;
  W2 KHÔNG sửa `media.ts` trên đĩa cho tới khi W1 đo xong + stage batch
  (tránh bundle của W1 lẫn fix retry-play làm nhiễu giả thuyết
  faststart). W1 xong 05:49Z (24 case, batch
  `phase9-round95-w1-faststart.txt`); W2 sửa code sau đó. Kết quả W1
  (đọc từ JSON của W1, không phải kết luận của W2): faststart c2 blob
  **0/6**, c8 blob 4/6 — faststart KHÔNG sửa được c2; mitigation retry-play
  vì vậy vẫn có giá trị độc lập với kết luận faststart của W1.

## 4. Số liệu chi tiết MATRIX A

### BEFORE (runs 1–3, code cũ)

| Clip | r1 | r2 | r3 |
|---|---|---|---|
| c2 | error-event (0f, ct 0) | OK (52f, ct 6,17) | error-event (0f, ct 0) |
| c4 | OK (77f, ct 8,27) | OK (52f, ct 7,67) | error-event (0f, ct 0) |
| c6 | OK marginal (6f, ct 0,92) | OK marginal (3f, ct 0,13) | error-event (0f, ct 0) |
| c8 | error-event (0f, ct 0) | error-event (0f, ct 0) | OK marginal (1f, ct 0,08) |

Loose 6/12, strict 3/12, error-event 6/6 fail đều `playErr "The operation
is not supported."`, finalSrc=http (fallback đã chạy, không ai play lại —
đúng chữ ký V3). prog 12/12.

### AFTER (runs 4–6, có retry-play)

| Clip | r4 | r5 | r6 |
|---|---|---|---|
| c2 | **OK rescued (6f, ct 3,96, retry=1)** | **OK rescued (9f, ct 3,33, retry=1)** | OK marginal (2f, ct 0,08, không retry) |
| c4 | OK (26f, ct 6,25) | OK (79f, ct 8,58) | OK (97f, ct 8,38) |
| c6 | OK (68f, ct 6,92) | OK (56f, ct 6,58) | OK marginal (4f, ct 0,75) |
| c8 | error-event (0f, ct 0, retry chưa bắn — §5) | stall-timeout (0f, ct 0, không error) | OK (7f, ct 2,21) |

Loose 10/12, strict 8/12, error-event 1/12, stall 1/12. prog 12/12.
`retryPlay95W2Fired` chỉ set ở đúng 2 case rescued, không set ở bất kỳ
case nào khác (không retry thừa ở case pass thường hay prog).
- Thời điểm 2 case rescued: error t=3,18 s / 3,52 s; canplay đầu sau error
  t=5,91 s / 5,62 s; retry bắn lúc `performance.now()` 7582 ms / 7113 ms
  (t0-relative của page); sau đó ct tiến tới 3,96 / 3,33 s.
- GST: `bogus size` vẫn có ở 9/12 log blob AFTER (kể cả 2 case rescued:
  2 và 1 dòng) — retry-play KHÔNG sửa nguyên nhân gốc qtdemux, chỉ cứu
  hậu quả (phát lại trên http sau fallback). Vẫn đúng "fail ⇒ bogus".

## 5. Case Lc8-blobA-run4 — error đến muộn, retry arm nhưng chưa kịp bắn

- Diễn biến: swap blob t≈3,39 s, play() gọi 3,39 s, error event t=7,09 s
  (~3,7 s sau play — ngoài dải 128–1126 ms của V3; V3 đo delta swap→error
  chứ W2 không đo lại delta này cho mọi case, chỉ ghi nhận case này lệch
  xa), fallback http lúc 7,09 s, http loadstart 7,28 s, nhưng tới cuối
  cửa sổ (lastSample 9,82 s, rs=0, dur=null) vẫn chưa có
  progress/loadeddata/canplay nào. Probe đóng cửa sổ lúc 10 s.
- Kết luận: retry đã arm theo logic (intent=1 vì probe đã gọi play();
  không có pause(); fallback đã chạy; `retryPlay95W2For` chưa set cho URL
  này) nhưng canplay chưa tới trong cửa sổ nên chưa bắn. Đây là giới hạn
  cửa sổ đo 10 s, KHÔNG phải bằng chứng mitigation sai logic. Trong app
  thật không có cửa sổ cố định — retry sẽ bắn khi http load tới canplay.
  Hệ quả đo: hiệu quả mitigation phụ thuộc thời điểm error — error càng
  muộn, cửa sổ còn lại càng hẹp. Nợ mở: đo lại với wall dài hơn (vd 20 s)
  để xác nhận case đến muộn có được cứu không (§7).

## 6. Hiện tượng phụ + đánh giá trung thực

- **Case "pass marginal" (1–6 frame, ct 0,08–0,92 s) ở cả 2 phía:**
  element đã play nhưng gần như không tiến trong 10 s (vd Lc6-run1/r2
  BEFORE, Lc2-run6/c6-run6 AFTER). Đây KHÔNG phải lỗi retry — nó xảy ra
  cả khi blob play thành công ngay lần đầu, và cả ở prog? Không: prog
  24/24 đều khỏe. Hiện tượng chỉ ở đường blob, nghi do decode chậm dưới
  tải (loadavg tới 16,8) + WebKitGTK drop frame (ct vẫn tiến nhưng ít
  frame trình chiếu). W2 không điều tra sâu — ghi nhận để đợt sau phân
  biệt "cứu được error" với "phát khỏe sau khi cứu". Tiêu chí strict
  (finalCt ≥ 1 s) của W2 sinh ra để tách 2 mức này.
- **App loop đã tự retry:** `syncMedia` trong `preview.tsx` gọi `play()`
  mỗi tick khi element active + paused (dòng ~4146), nên trong app thật,
  sau error→fallback, tick sau đã play lại (khi http đủ data) — 0-frame
  như probe single-shot có thể không xảy ra ở app. Mitigation W2 vì vậy
  có giá trị lớn nhất cho caller single-shot + làm resume xác định hơn
  (bắn ngay tại canplay), chứ KHÔNG phải "cứu app khỏi 0 frame" như tiêu
  đề nợ gốc có thể gợi ý. W2 không đo lại trong app mức này (chỉ đo
  flip-flop app, xem §8).
- **W1 faststart không sửa c2 (0/6)** — đọc từ JSON W1: error-event vẫn
  xảy ra trên clip faststart, nên mitigation này không bị kết luận W1 làm
  thừa; 2 hướng bổ sung nhau (faststart xử lý moov-seek, retry xử lý
  hậu quả khi lỗi vẫn nổ).

## 7. Kiểm chứng hồi quy

- Unit test mới `apps/web/src/media.retryPlay95W2.test.ts`: **7/7**
  (retry đúng 1 lần sau canplay; không tự phát khi chưa play; pause hủy
  retry; app loop đã play thì không thừa; http cũng lỗi thì không lặp;
  proxy mới được retry lại; wrapper delegate đúng). Lúc viết test phát
  hiện: fake `play()` phải mô phỏng reject (element vẫn paused) thì
  retry mới bắn — đã sửa fake, không sửa code production để chiều test.
- Unit test cũ `media.blobPrefetch90R3.test.ts`: **25/25** (fake cũ không
  có `play()` — guard `typeof` hoạt động, không throw).
- `npx tsc --noEmit` apps/web: **0 lỗi** (lúc đầu 2 lỗi do file test mới
  dùng `from "./media.ts"` + biến `MB` thừa — đã sửa import thành
  `"./media"` + xóa `MB`; test files vốn excluded khỏi tsconfig nên lỗi
  chỉ lộ vì file mới chưa excluded — W2 chọn sửa import thay vì sửa
  tsconfig chung).
- `vite build`: **PASS (30,16 s)** trên code cuối (chỉ đổi file test sau
  build, dist không đổi).
- `seek.test.ts`: **21 passed**; `previewEngine.test.ts`: **25 passed**;
  `playheadHold90R2.test.ts`: **41 passed**;
  `seekSkipRender86N3.test.ts`: **9/9**; `previewLoop50F2.test.ts`:
  **20 passed**.
- Flip-flop tầng pool (từ srcTrace MATRIX A): **0** ở cả BEFORE lẫn
  AFTER (không case nào quay lại blob sau fallback; `http→blob→http` là
  1 lần fallback duy nhất, không phải flip-flop).
- O8: **Chromium 21/21, WebKit 21/21** (Δx Chromium 0,112/0,113, WebKit
  0,194/0,197 — khớp V8). Xem §8 cho flip-flop app.

## 8. Flip-flop trong app thật (tiêu chuẩn U2: 0 flip-flop trong 10 run)

- Probe `benchmarks/render/webkit_flipflop_counter_95w2_app.mjs` (copy U2,
  chỉ đổi OUT/round): app thật qua vite preview 4173 (dist build 06:23Z,
  có fix) + bridge 8787 riêng (work dir `/tmp/round95-w2/bridge-work`),
  clip c2h.mp4 1080p → proxy 720p, Xvfb :201, 10 run, 4 pha/run như U2.
- Kết quả: **0/10 run flip-flop** (`kindChanges`=1 ở cả 10 run — đúng 1
  lần upgrade http→blob duy nhất như baseline U2, không có lần đổi kind
  thứ 2 nào; `errorOps`=0 cả 10 run; `proxyOk`=true cả 10 run).
  Upgrade xảy ra ở pha 4 (pause + Home + chờ 800 ms, khoảnh khắc pristine
  thật) ở 9/10 run; run 9 upgrade sớm hơn (đã blob từ pha 2 replay).
  `proxyReadyMs` 16,8–49,1 s (chậm hơn U2 ~8–11 s — tải đợt 95 nặng hơn).
  Stall phát (ct đứng ≥1,5 s) 0–2/run — hành vi có sẵn dưới tải, không
  liên quan src (không run nào có errorOps).
- Kết luận: wrapper `play()`/`pause()` + retry-play trong `media.ts`
  KHÔNG gây flip-flop trong app thật; tiêu chuẩn U2 (0 flip-flop trong
  10 run app) **đạt**.

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/src/media.ts` — fix retry-play + wrap intent (marker "Đợt 95 W2").
- `apps/web/src/media.retryPlay95W2.test.ts` — unit test mới (7 test).
- `benchmarks/render/webkit_blob_flaky_95w2.mjs` — probe MATRIX A W2.
- `benchmarks/results/webkit-blob-flaky-95w2.json` — kết quả BEFORE 24 + AFTER 24 case.
- `benchmarks/render/webkit_flipflop_counter_95w2_app.mjs` — probe app W2.
- `benchmarks/results/webkit-flipflop-counter-95w2-app.json` — kết quả 10 run app.
- `docs/PHASE9_ROUND95_W2_RETRY_PLAY_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round95-w2-retry-play`
(`~/workspace/repo-1-push/paths-loop/phase9-round95-w2-retry-play.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round95-w2.md`.
Log chạy: `hidden_files/round95-w2/matrixa-{before,after}.log` +
`app-run.log` + `o8-{chromium,webkit}.log` + `gst/` (24 log AFTER + 24 log
BEFORE) + `bundle/`.

## 10. Nợ mở

1. **Stall lặng (chữ ký 2) vẫn không có mitigation:** không error → không
   fallback → không retry. Lc8-run5 AFTER là 1 mẫu (stalled@6,97 s,
   play-timeout-10 s, finalSrc=blob). Cần cơ chế riêng (vd watchdog
   stall → fallback http + play lại) — chưa thiết kế, chưa đo.
2. **Error đến muộn ngoài cửa sổ đo:** Lc8-run4 cho thấy retry phụ thuộc
   thời điểm error; cần đo lại wall 20 s để xác nhận case đến muộn có
   được cứu khi đủ thời gian không.
3. **Đường blob-lỗi không proxy chưa có retry** (src phục hồi ở tick
   videoFor sau; mitigation chỉ arm trong nhánh proxy-fallback). Cần
   thiết kế arm ở nhánh latch-restore nếu muốn phủ.
4. **"Pass marginal" (ít frame, ct chậm) chưa có nguyên nhân:** chỉ ở
   đường blob, nghi decode chậm/drop frame dưới tải. Cần đo riêng
   (frames + ct + droppedFrames theo load) trước khi kết luận mitigation
   "cứu" tới mức phát khỏe.
5. **W1 faststart vs retry-play:** 2 hướng bổ sung nhau; nếu W1 đóng
   giả thuyết qtdemux thì retry-play vẫn giữ làm dự phòng (ghi theo
   lệnh giao việc).
