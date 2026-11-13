# Phase 9 đợt 94 — LIMITS gộp (đóng 11 nợ LIMITS gộp đợt 93 §4)

**Ngày:** 12/11/2026 (lượt cron 09:35 +07; làm việc 02:35–03:45Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push). **HEAD vẫn 5f548ef8.
KHÔNG push, KHÔNG release/tag.** Không đụng TTS 39, không đụng
`.github/workflows`, 0 binary vào batch.
**Chủ đề đợt:** đóng 11 nợ mở từ LIMITS gộp đợt 93 §4 (U1 rVFC pump ƯU
TIÊN, U9 kiểm chứng, trần stall chỉ giữ lần đầu, G1, EPERM probe, blob
flaky, rVFC WebKitGTK, canvasOk).
**Sự cố lớn giữa đợt: VM reboot #14 ~03:25Z (boot 9968199e → 0597b689)** —
giết V3 giữa MATRIX3 và làm V2/V4/V3 rơi trạng thái "interrupted"; V2/V4
đã ghi xong LIMITS + batch trước reboot nên tính là hạ cánh (kiểm tra
đĩa, không tin trạng thái agent); V3 resume không có tác dụng → parent
spawn V3b làm tiếp từ đĩa, xong 03:44Z.

## 1. Kết quả từng luồng

### V1 — rVFC pump/scheduling (nối tiếp U1 đợt 93) — XONG, không sửa code
- Log U1 đợt 93 đã cũ: code trên đĩa đi xa hơn log. V1 tái dựng stack fix
  từ raw pump events: **videoFrameIndex +1µs là fix quyết định**
  (duplicate 0,33 → 0; cứ 3 frame thì 1 frame k≡1 mod 3 @30fps không bao
  giờ được capture do mediaTime Chromium lượng tử hoá µs); register-first
  **trung tính lúc yên** (A/B mới đợt 94: cap 0,958–0,986 cả hai chiều);
  freshness guard 1/fps+0,5ms là lưới an toàn (không kích lúc yên, kích
  đúng lúc nhiễm tải); memo canvas alpha theo (clip, frameIdx) tiết kiệm
  thật ~3,2 ms mỗi dup tick (dup tick luôn rẻ 0,6–1,0 ms, 8/8 pass).
- **Phát hiện mới: assert2 BÁC giả thuyết mislabel của guard** — siết
  guard 1,5/fps → 1/fps+0,5ms không đổi gStd spread B (45,5 → 45,4); vẫn
  3 mức rời rạc 37,5/61/84,6 — giống ring-fill khác nhau hơn là mislabel.
  Nợ mở riêng (xem §4 mục 4).
- Kiểm chứng: tsc web 0 (2 lần), vite build PASS, previewEngine 18+25
  test xanh. Parity MAD spec F + O8 chưa đo lại (code không ổn định + VM
  không yên trong lượt V1 — mở cho V8; V8 đã chạy O8 21/21 cả 2 engine,
  xem §3). Batch: 1 entry (chỉ LIMITS).

### V2 — trần stall re-arm (stall thứ 2+) — ĐÃ SỬA, NỢ GIẢM, CHƯA ĐÓNG HẲN
- Tái hiện pre-fix: stall 2 GOP 250 r1 (603 ms) playhead +0,367 s, không
  giữ — đúng U3 §5.
- Sửa: freeze detector `nextResumeFreezeRearm` trong
  `playheadHold90R2.ts` (đóng băng ≥300 ms mà chưa có watch → arm watch
  mới, `completedAtMs` = lúc stall bắt đầu; `ceilingSpent` chặn arm lại
  cùng đợt đóng băng; trần 5000 ms + `shouldHoldForResumeStall` không đổi)
  + `preview.tsx` (tập `forwardVideoActives94V2`, map
  `resumeFreezeTracks94V2`, đếm `resumeRearms94V2`).
- Đo lại 7 lượt WebKit + tải: stall 1 giữ +0,000 ở 7/7; **re-arm đã kích
  hoạt ngoài đời** (2 lượt cửa sổ dài) nhưng **vào trễ ~1 tick rAF** —
  stall 2+ ngắn (300–600 ms, đúng cỡ thường gặp) vẫn để playhead chạy
  +0,37–0,67 s trước khi giữ kịp; stall 3 ở GOP 250 r5 (+0,667) tự kích
  drift re-seek. Chỉ stall 2+ dài (≥~800 ms–1 s) mới giữ được phần còn
  lại. Ngưỡng 300 ms không phải nút thắt (không thể arm trước tick quan
  sát đầu tiên).
- Kiểm chứng: tsc 0 (2 lần), build PASS, playheadHold90R2 41/41 (31 cũ +
  10 mới V2-R1..R10), seek 20/20, seekSkipRender86N3 9/9,
  previewLoop50F2 20/20, O8 21/21 cả 2 engine. Batch: 5 entry.

### V3/V3b — blob-load flaky 42% — CHẨN ĐOÁN XONG, KHÔNG SỬA PRODUCTION
- V3 bị reboot #14 giết lúc 03:25 (đang MATRIX3, 61 case trên đĩa);
  resume không tác dụng → V3b spawn 03:32, chạy bù 7 case, xong 03:44.
- **68 case load-play** (MATRIX 36 + MATRIX2 16 + MATRIX3 16, WebKitGTK
  27.2): A prod 11/24 = 46%, B preload-none 6/12 = 50%, C reset-swap 2/4,
  D fresh-element 2/4, **E blob-direct 8/12 = 67%**, prog 12/12 = 100%.
  **Không biến thể nào sửa được flaky.** Hướng S3 §2 (preload-none) bị
  bác bằng đo đối chứng (cũng không ngăn được loadstart http).
- Chữ ký fail (27 fail): error-event 23/27 (swap/play → error 128–1126
  ms sau, median 430 ms; `play()` reject "The operation is not
  supported."; fallback về http load tốt nhưng không ai play lại → 0
  frame — handler `media.ts` không có lệnh play lại); stall lặng 4/27
  (không error, không fallback, 0 frame).
- **Phát hiện mới (V3b, đo bằng script): qtdemux `bogus size` là byte
  thật của file tại đúng offset 2 MiB (2097152) của cả 4 clip** (c2
  3946787710, c4 1805683823, c6 3958285619, c8 570402281); moov ở CUỐI
  file (không faststart) nên qtdemux phải seek tới cuối; **0 lần "blob"
  trong 52/52 GST log** (playbin không bao giờ nhận URI blob). Tương
  quan: fail ⇒ bogus (24/24), nhưng bogus ⇏ fail (6 pass vẫn có bogus).
  Giả thuyết: qtdemux lúc seek tới moov đã đọc nhầm dữ liệu media tại
  ranh giới 2 MiB thành atom header — cần test clip faststart để khẳng
  định (xem §4 mục 2). Giả thuyết cũ S3 (teardown pipeline http lúc
  swap) bị bác thêm: E không có swap vẫn fail cùng chữ ký + cùng bogus.
- Không sửa code production → không cần tsc/build. Lưu ý: probe trùng
  tên case giữa các mode (JSON dedupe còn 64 case; bản đầy đủ 68 case
  trong `hidden_files/round94-v3/analysis-cases.json`). Batch: 3 entry.

### V4 — rVFC WebKitGTK 0 callback + fallback — ĐÃ SỬA, ĐÃ ĐO
- **Xác nhận độc lập lần 3: WebKitGTK 27.2 = 0 callback trong 4/4 chuỗi**
  (video phát sạch 74 frame trình chiếu); Chromium cùng trang 281+139
  callback. Tổng: 0 callback trong 12+ lượt app + 3 probe tối thiểu.
- Sửa (`preview.tsx`, marker "Đợt 94 V4"): fast-path "rVFC im lặng"
  (pump sống ≥1000 ms, 0 callback, frame đã tiến → kill ngay, không chờ
  3 miss) + memo engine (2 clip chết vì no-callback trong cả phiên chưa
  thấy callback nào → `rvfcSilentEngine`, không tạo pump nữa, đường tick
  nuôi snapshot từ tick đầu).
- Đo trong app: cửa sổ mù clip đầu rút 2039 ms → 1469 ms → 1303 ms;
  clip 2 ~2,6 s → ~1,4–1,5 s; **từ clip 3 trở đi không còn cửa sổ mù**
  (post3: c2 không fallback, ring=1 ngay mẫu đầu). Chromium không hồi
  quy (111–349 callback/lượt, 0 fallback, silentEngine=false). Drift
  playhead − element max ≤0,31 s (< ngưỡng drift 0,35 s) — fallback không
  phá trần giữ.
- **Parity pixel KHÔNG chứng minh được bằng harness hiện tại** (MAD bị
  pha sọc chi phối: cùng đường vẽ chạy 2 lần cũng MAD ~55–76) — chỉ dựa
  vào cùng đường vẽ + O8 + drift nhỏ. Cần harness đồng bộ theo frame
  (xem §4 mục 3).
- Kiểm chứng: tsc 0, build PASS (11,09 s), playheadHold90R2 41/41,
  previewEngine 25, seek 20/20, seekSkipRender86N3 9/9,
  previewLoop50F2 20/20, O8 21/21 cả 2 engine. Batch: 5 entry.

### V5 — G1 evidence vòng 6 — XONG, G1 VẪN MỞ (quyết thuộc parent/user)
- 8 lần đo mới (02:39–02:54Z, VM vừa reboot, không reboot trong cửa sổ):
  60fps 5/5 PASS (0,98 / 0,95 / 0,91 / 0,77 / 1,14) → pool 60fps n=27
  median 0,960×, PASS 25/27 (93%), CI [0,911; 1,034]; chân yên 60fps n=8
  median 0,970, 8/8 PASS, CI [0,936; 1,007] — cả ba tiêu chí chặt vẫn đạt,
  CI hẹp hơn U6. 30fps 3/3 PASS (1,12 / 0,94 / 1,02) → pool n=38 median
  0,950×, PASS 31/38 (82%) — rời khỏi vạch 80% đúng của U6 nhưng chỉ còn
  biên 1 lần FAIL.
- **Thay đổi lớn nhất: chân yên 30fps median 0,805 (U6: 0,680), lần đầu
  vượt 0,75**, nhờ 2 lần yên mới đều PASS toàn phiên (0,94 / 1,02). Nhưng
  vẫn CHƯA đạt 2/3 tiêu chí chặt (PASS 4/8 = 50%, CI cận dưới 0,683 <
  0,75) — và median mong manh: thêm 1 lần FAIL ~0,67 là rơi về 0,68.
- Khuyến nghị V5: **KHÔNG đóng G1 toàn vẹn**; phương án A (đóng một phần:
  deint ĐẠT ở chế độ tải cả 30/60fps + chân yên 60fps) nay mạnh hơn ở cả
  hai chân — nhưng kèm 5 điều kiện bắt buộc (ghi trong LIMITS V5 §4).
  **Parent quyết đợt này: GIỮ G1 MỞ.** User đang vắng; phương án A để
  user quyết khi về (số đã đủ để trình, chưa đủ để parent tự đóng).
- Kiểm chứng: deint-fps-verdict 12/12, vite-diagnosis-regex 9/9; pixel
  D1/G2/G7a/G7b/G8 giống hệt lịch sử; H9 0 lỗi trang. Không sửa
  production. Batch: 2 entry.

### V6 — EPERM probe #13 + quét writeFileSync — XONG
- Checklist P8 §2.3 chạy đúng 1 lần: status 02:38:54Z DEAD/STALE (age
  10.700 s, last #12 23:40:34Z, boot 88ebef2e); `once` 02:39:01Z =
  **probe #13, boot 9968199e (ĐỔI), ok=2 fail=0**, exit 0; status sau
  ALIVE (age 0 s, n=13).
- **Khoảng mù #12: 23:40:34Z → 02:39:01Z (~178 phút)**, dài thứ 3 (sau
  #8 ~187', #11 ~182'). **Reboot #13 02:34:42Z** (88ebef2e → 9968199e).
  Chu kỳ reboot: 13 lần trong ~30h16' (~2h20' mỗi lần).
- Không có bằng chứng sóng EPERM trong hồ sơ còn lại của khoảng mù #12
  (U1/U2/U3/U5: 0 nhắc; U6: 0 dấu EPERM trong 8 log đo; U7: không gặp) —
  nhưng **~58 phút cuối (01:37Z → 02:34:42Z) không có hồ sơ nào** nên kết
  luận là "không thấy", không phải "không có sóng". Sóng thật gần nhất
  vẫn ~11:55–12:11Z (R7). **EPERM KHÔNG tuyên bố đã hết.**
- writeFileSync quét lại (chuẩn mới, script V6): **222 dòng / 80 file**
  (source 102, docs 120); đối chiếu phương pháp cũ R7b: 247 dòng / 11.902
  file; **222 + 25 bản sao = 247, khớp tuyệt đối lần đầu, 0 sai lệch**.
  Async `fs.writeFile` production ngoài helper: **0**. V6 sửa bug script
  quét của U8 (quên prune base) — đợt sau dùng script V6, không dùng U8.
  RAM 992–1221 MB (tối đa ~1,8 GB = 29% ngưỡng guard) — birefnet KHÔNG
  chạy. Cron 10 phút vẫn chờ user quyết. Batch: 1 entry.
- **Bổ sung sau V6 (phát hiện của V8): reboot #14 ~03:25Z (boot
  0597b689) rơi vào khoảng mù #13** (bắt đầu 02:39:01Z) — khoảng mù #13
  vẫn mở cho đến khi probe #14 chạy (đợt 95).

### V7 — tiêu chí canvasOk trong harness đo seek GOP — XONG
- Tiêu chí mới: `canvasOk` thêm `sawChange` (canvas phải ĐÃ ĐỔI khỏi
  baseline ≥0,01 đơn vị canvas); verdict 3 loại (confirmed /
  already-at-target / stale-timeout); ghi thêm `changedMs`,
  `maxDevFromBase`. Ngưỡng 0,01 hiệu chuẩn bằng đo thật (nhiễu <0,005;
  bước khung nhỏ nhất 0,048).
- Chạy lại đủ 6 tổ hợp: **33/36 confirmed + 1 already-at-target + 2
  stale-timeout** (đợt 93: 35/36 với tiêu chí cũ). **Artifact bắt sống
  ngoài đời:** WebKit GOP250 trial 4 → already-at-target (tiêu chí cũ
  sẽ PASS nhầm với tCanvas ≈ 100 ms — đúng pattern trial 6 GOP30 đợt
  93). 0 trial có tCanvas < tElement (đợt 93 có 1).
- Kết luận U7/T3 còn đứng: latency pause-seek phụ thuộc GOP (t=5:
  Chromium 1081→602→502 ms; WebKit 2920→1708→1098 ms); stall canvas
  không do GOP (thêm 2 stall canvas >30 s sau khi element đã tới đích,
  ở 2 GOP khác nhau).
- Kiểm chứng: `node --check` probe pass; không đụng `src/` → không cần
  tsc/build; `seek.test.ts` không sửa. Nợ: race display Xvfb khi nhiều
  luồng chạy probe song song (picker :193–:197 không có lock — Chromium
  GOP250 lần 1 fail Xvfb); ngưỡng 0,01 chưa tự hiệu chuẩn theo clip; T2
  vẫn mỏng. Batch: 2 entry.

### V8 — kiểm chứng độc lập (thay U9 đợt 93) — XONG
- Chạy lại trên cây đã gộp (03:30–03:37Z): **tsc web 0, tsc desktop 0,
  vite build PASS** (6,39 s); playheadHold90R2 **41/41**; previewEngine
  **25**; seek **20/20**; seekSkipRender86N3 **9/9**; previewLoop50F2
  **20/20**; css60 **60/60**; css61 **60/60**; Audit P7 **8/8**; orphans
  **17/17**; r6-i18n-check **PASS** (vi=en=2767 key); `node --check`
  probe V7 pass; **U4 fail-fast 141/141** (OLD 45,491 s → NEW 0,194 s ở
  C2d-mkf60-dry); **O8 21/21 cả 2 engine** (Chromium Δx=0,112; WebKit
  Δx=0,194).
- Đối chiếu batch lúc 03:27: 6 batch / 16 entry read-back OK 16/16, 0
  binary, 0 workflow; marker V2 (`94V2`) + V4 ("Đợt 94 V4") đều đủ trong
  `preview.tsx`, không xung đột nội dung (vùng khác nhau).
- V5/V6 chỉ xác nhận về số/hồ sơ (không chạy lại đo/probe — ghi rõ lý
  do); V3 chưa về lúc V8 hết hạn chờ (~04:18Z) → V8 tổng hợp JSON thô
  lúc đó (fail 23/61 = 38%) và để V3b cho parent gộp. **Bổ sung sau
  closing (V8 đối chiếu thêm 03:53–03:57Z, LIMITS V8 §5): V3 ĐÃ ĐƯỢC
  XÁC NHẬN** — số đối chiếu từ JSON thô khớp hết (A 11/24, B 6/12, C 2/4,
  D 2/4, E 8/12, prog 12/12; delta swap→error tính lại 128–1126 ms,
  median 430 ms; error-event 23/23 về http, stall 4/4 kẹt blob; batch V3
  3/3 read-back OK). Phần duy nhất của V3 còn "tin LIMITS" là phân tích
  GST (52 log, V8 chưa grep lại). Phát hiện mới: reboot #14 trong khoảng
  mù #13; poll nền V8 bị SIGTERM kill lúc reboot (~03:24Z).
- Lưu ý thao tác (không phải hồi quy): P7/orphans phải chạy bằng esbuild
  bundle theo hướng dẫn trong file test (chạy trực tiếp bằng
  `node --experimental-strip-types` FAIL `ERR_MODULE_NOT_FOUND`); script
  O8 kiểm tra fixture TRƯỚC khi mkdir scratch nên scratch mới luôn fail
  lần đầu — copy fixture từ scratch cũ rồi chạy lại. Batch: 1 entry.

## 2. Ghi chú gộp (parent)

- **File chung `apps/web/src/preview.tsx`** (V2 + V4, và nối tiếp U1/V1
  không sửa): parent kiểm tra trực tiếp bằng grep — `94V2` ×16, "Đợt 94
  V4" ×6, "Đợt 93 U1" ×9; vùng V4 ~dòng 1373–1789 (pump rVFC), vùng V2
  ~dòng 3797–5100 (playhead-hold/re-arm) — không đè nhau. V8 đã kiểm
  tra marker lúc 03:27, parent kiểm tra lại sau khi V3b hạ cánh — vẫn đủ.
- **Xung đột đo giữa các luồng** (ghi để đợt sau tránh): V2 sửa
  `preview.tsx` liên tục 02:52–03:05 làm lượt đo B lần 2 của V1 vô hiệu
  (presented=0 cả 5 pass, HMR 6 lần); V4 sửa 03:07:45 giữa lượt B lần 3
  của V1 (p1 nhiễm, p2–p3 vô hiệu); V4 đo phải code V2 đang sửa dở 2 lượt
  (playhead đóng băng 90 s — đã đánh dấu `fallback-*-pre-INVALID`).
  Bài học: probe phải kiểm tra mtime file trước/sau lượt chạy và hủy kết
  quả nếu file đổi giữa chừng; các luồng sửa cùng file nên báo nhau
  (V1 đã làm đúng: kiểm tra mtime trước mọi lần ghi).
- **Reboot #14**: V2/V4 "interrupted" nhưng file đã đủ trên đĩa → tính
  hạ cánh. V3 "interrupted" khi chưa có LIMITS/batch → parent resume
  không tác dụng (0 hoạt động đĩa sau ~6 phút) → spawn V3b làm tiếp từ
  đĩa (không làm lại từ đầu). Tiền lệ mới: resume thất bại thì spawn
  thay thế, đừng chờ.
- **Dedupe batch:** `preview.tsx` có trong cả batch V2 + V4 (đúng như
  tiền lệ đợt 92 T2+T3 — stage toàn bộ file ở trạng thái hiện tại, parent
  gộp/dedupe lúc push). Tổng đợt 94: 8 batch / 20 entry / 19 file duy
  nhất (chỉ `preview.tsx` trùng).

## 3. Kiểm chứng của parent (closing)

- Dựa vào V8 cho cây đã gộp (tsc web+desktop 0, build PASS, toàn bộ test
  ở §1 V8, O8 21/21 cả 2 engine) — V3b hạ cánh sau V8 nhưng **không sửa
  code production** (chỉ probe + JSON + LIMITS) nên cây code V8 đã kiểm
  chứng không đổi.
- Parent tự kiểm tra: grep marker `preview.tsx` (V2 ×16, V4 ×6, U1 ×9);
  read-back toàn bộ 8 batch đợt 94 (20/20 entry tồn tại, 0 binary, 0
  workflow); đếm lại tổng chờ push từ đĩa (xem §5).
- **G1: parent giữ MỞ** (xem §1 V5). Không tự đóng, không đề xuất tag
  release. Release gate không đổi.

## 4. Nợ mở cho đợt 95 (theo thứ tự ưu tiên)

1. **Blob-flaky — test clip faststart (moov ở đầu file), ƯU TIÊN CAO
   NHẤT:** re-encode c2/c8 với `-movflags +faststart`, chạy MATRIX A n=12.
   Nếu blob-load về ~100% thì giả thuyết §6 V3 đúng (qtdemux đọc nhầm
   tại ranh giới 2 MiB khi seek tới moov cuối file); nếu vẫn ~50% thì bỏ
   giả thuyết. Test rẻ, phân biệt được 2 giả thuyết, chưa ai làm.
2. **Blob-flaky — retry-play sau error-fallback (mitigation):** sửa handler
   `media.ts` (hoặc caller `play()`) để error sau blob → fallback http
   xong thì `play()` lại 1 lần. Kỳ vọng cứu phần lớn 23 fail error-event
   (http sau fallback đã loadeddata/canplay). Cần đo MATRIX A trước/sau
   (n=12 mỗi bên) + flip-flop không hồi quy (U2: 0/10 run app) + O8 cả 2
   engine. CHƯA đo — không claim trước.
3. **rVFC WebKit — parity pixel cần harness đồng bộ theo frame** (chụp
   canvas trong tick kèm frameIdx, khớp đúng frameIdx thay vì khớp
   currentTime ±16 ms); clip 1–2 vẫn mù ~1,0–1,5 s; nguy cơ kill oan +
   memo oan trên Chromium (chưa có cơ chế tự hồi); nguyên nhân gốc rVFC
   WebKitGTK vẫn là suy luận.
4. **rVFC pump — gStd spread B–E** (3 mức rời rạc 37,5/61/84,6): giả
   thuyết mislabel đã bị assert2 bác — điều tra riêng ring-fill; parity
   MAD spec F + C đo lại trên cây gộp (memo có thể đổi pixel chút ít);
   register-first dưới tải nặng có kiểm soát vẫn chưa đo; baseline sạch
   spec C với guard siết vẫn chưa có.
5. **Trần stall re-arm vào trễ ~1 tick:** stall 2+ ngắn (300–600 ms) vẫn
   để playhead +0,37–0,67 s, có thể tự kích drift re-seek. Hướng tương
   lai: (a) dự đoán stall bằng vận tốc advance (dễ giữ oan — cần đo
   riêng); (b) khoan kích drift re-seek 1 tick để playhead đã giữ kịp
   đuổi theo element. Trần 5000 ms vẫn chưa có bằng chứng nhả ngoài đời
   (stall dài nhất bắt được 3904 ms ở U3).
6. **G1 vẫn MỞ, chờ user quyết** — phương án A (đóng một phần) đã mạnh
   hơn; chân yên 30fps cần thêm ~4 lần PASS nữa (10/12 để PASS ≥80%);
   fetch up-loop của E1 không có timeout (U6 §7.1, vẫn mở); metric tỉ lệ
   FPS nhạy sóng tải từng slot.
7. **EPERM probe #14 + khoảng mù #13:** khoảng mù #13 bắt đầu 02:39:01Z
   (probe #13), chứa reboot #14 ~03:25Z (boot 0597b689) — chưa probe nào
   ghi nhận lúc xảy ra. Đợt 95 chạy checklist P8 §2.3 đúng 1 lần. Cron 10
   phút vẫn chờ user quyết (không tự tạo). EPERM KHÔNG tuyên bố đã hết.
8. **Harness:** race display Xvfb khi nhiều luồng chạy probe song song
   (picker :193–:197 không có lock); ngưỡng canvasOk 0,01 chưa tự hiệu
   chuẩn theo clip; T2 vẫn mỏng (assert theo số lần re-arm); probe V3
   trùng tên case giữa các mode (thêm hậu tố mode vào tên case); O8 kiểm
   tra fixture trước khi mkdir scratch (scratch mới luôn fail lần đầu).
9. **Đứng yên:** TTS 39 CẤM kiểm lại (chờ Gradio stable 7.x); birefnet
   chỉ thử lại khi RAM đổi (RAM khả dụng ~1,1–1,9 GB < ngưỡng 6 GB;
   u2net là fallback chính thức); `.github/workflows/*.yml` 403 (user tự
   thêm qua web hoặc cấp quyền); release gate không đổi (chỉ release khi
   ngang/hơn CapCut thật).

## 5. Tổng chờ push sau đợt 94

- Đợt 94: **8 batch / 20 entry / 19 file duy nhất** (15 file mới so với
  các đợt 67–93; 4 file đã có trong tập chờ: `preview.tsx`,
  `playheadHold90R2.ts`, `playheadHold90R2.test.ts`,
  `probe89q5-seek-latency.mjs`).
- **Tổng chờ user push (đợt 67–94): 279 batch / 2192 entry / 1302 file
  duy nhất** (sau đợt 93: 270 / 2170 / 1286; + đợt 94: 8 / 20 / 15; +
  closing này: 1 batch / 2 entry / 1 file mới — `PHASE9_GAP_ANALYSIS.md`
  đã có trong tập chờ từ các đợt trước). Đếm trực tiếp từ đĩa
  (`phase9-round*.txt`, đợt ≥67). HEAD vẫn 5f548ef8. KHÔNG push.
- i18n dict: **2767 key** (không đổi đợt này — không luồng nào thêm key).
  css60 60/60, css61 60/60, r6-i18n-check PASS, Audit P7 8/8, orphans
  17/17 (V8 chạy lại trên cây gộp).
- Batch đợt 94: `phase9-round94-v1-rvfc-pump.txt`,
  `phase9-round94-v2-stall-ceiling.txt`,
  `phase9-round94-v3-blob-flaky.txt`,
  `phase9-round94-v4-rvfc-webkit.txt`,
  `phase9-round94-v5-g1-evidence6.txt`,
  `phase9-round94-v6-eperm-probe.txt`,
  `phase9-round94-v7-harness-canvasok.txt`,
  `phase9-round94-v8-verify.txt` + closing
  `phase9-round94-closing.txt`.
