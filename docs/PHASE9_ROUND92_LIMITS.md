# PHASE9 ROUND92 — LIMITS gộp (đợt 92: đóng nợ LIMITS gộp đợt 91 §4)

> Lượt cron 03:35 +07 12/11/2026 (làm việc 20:36–22:35Z 11/11/2026).
> Chủ đề lớn: **đóng nợ LIMITS gộp đợt 91 §4** — 9 luồng T1–T9, tất cả
> đều về (T2 handoff không tới được parent — parent đọc trực tiếp từ
> đĩa theo skill verify_delegated_work: LIMITS + log + batch T2 đều có
> mặt 22:21–22:22Z, và T9 đã kiểm chứng độc lập T2 trước đó).
> **KHÔNG push. KHÔNG release/tag.**
>
> Bối cảnh môi trường: VM reboot 19:22:48Z (boot 182a689e →
> 14e10da9, reboot thứ 10) trước lượt, rồi **reboot ~21:35:58Z (→
> 09e8d2af…, reboot thứ 11 trong ~25h)** giữa lượt — giết script chờ
> của T9, xóa /tmp, giết server scratch T1 và vite 5173 của T2;
> RAM khả dụng chỉ ~0,5–1,7 GB suốt lượt.

## 1. Kết quả từng luồng

### T1 — Flip-flop src blob↔http trong `videoFor` (nợ đợt 91 §4 mục 1, ƯU TIÊN: ĐÃ ĐÓNG)
- **Chẩn đoán cơ chế thật:** `videoFor` cũ tính `assigned` lại mỗi
  tick từ trạng thái momentary của element — đang phát → http; vừa
  gán src xong trình duyệt reset về paused/ct=0 → pristine → blob.
  Guard `srcKey` vô dụng vì chính `assigned` dao động. Phát hiện
  thêm: error handler fallback chỉ gán `el.src` mà không đồng bộ
  `srcKey`, nên tick sau có thể lật ngược fallback.
- **Sửa production (`apps/web/src/media.ts`):** latch `srcLatch`
  theo item+`want` — quyết định blob/http tính 1 lần rồi giữ nguyên;
  chỉ đổi khi `want` đổi (proxy mới), error fallback, blob bị thu hồi
  (revoke/FIFO), dropElement, hoặc upgrade http→blob lúc element
  sạch (1 lần). Phát lại sau pause ở ct≠0 giữ nguyên src đã chốt
  (đổi src sẽ reset ct về 0). Prefetch callback và error handler đều
  đi qua latch.
- **Số đo thật (probe appswap của S3, app thật, WebKitGTK 27.2):**
  lần gán src / lượt phát 23 → **2** (empty→http→blob); lần đổi kind
  blob↔http 22 → **1** (upgrade prefetch có chủ đích); play() 13–15×
  → 4–5×, toàn blob, ct tăng đơn điệu; **phát lại sau pause dùng
  blob 3/3** (trước: http 3/3); 0 error event, canvas đổi thật.
  (Đính chính T9: số play() @ct=0 đếm lại là 8/7/6, LIMITS T1 ghi
  7/6/6 — lệch 1 ở run 30/31, không đổi kết luận.)
- Kiểm chứng: tsc web 0 (chạy 2 lần); vite build pass; unit
  `media.blobPrefetch90R3.test.ts` **25/25** (19 cũ + 6 mới T1, test
  mới phân biệt được code cũ/mới); O8 **21/21 cả 2 engine**.
- Giới hạn (T1 §6): lần phát đầu chốt http thì phát lại sau pause
  vẫn http cho tới khi scrub về 0; blob-load flaky của WebKit (~25%
  dưới tải) chưa được chứng minh là giảm nhờ fix này — cần đo đối
  chứng loop/load-play blob ở vòng sau; cửa sổ xấu nhất (bấm phát
  <400 ms) chưa đo.
- Chi tiết: `docs/PHASE9_ROUND92_T1_FLIPFLOP_SRC_LIMITS.md`.

### T2 — Chi phí tick main-thread motion blur / rVFC (nợ đợt 91 §4 mục 2: ĐÃ ĐÓNG, blocker đã dời)
- **Đo thật:** instrumentation `__vcutTickCost` (tách total/raw/
  blend/mask/maskGet/maskApply/maskPut/draw/frameIdx/viaRvfc/
  maskCanvas) + harness mới `probe92t2-tickcost.cdp.mjs`. Baseline
  spec B (load 14,76): tick 73–85 ms, mask ~90% tick (applyMask
  nhanh ~13 ms / chậm 65–90 ms), ratio capture rVFC 0,09–0,25.
- **Tối ưu chính — cache canvas alpha mask + destination-in**
  (`previewEngine.ts`: `maskAlphaArray`, `maskAlphaCacheKey`;
  `preview.tsx`: `maskAlphaCanvasFor`, cache 8 hình học FIFO;
  fallback đường CPU cũ khi build fail hoặc hook test). Unit test
  mới 4 test.
- **Hồi quy C bắt được bằng đối chứng** (v1 làm chậm mask động
  3–6× so với đường cũ) → sửa lần 2: hoist hình học
  `maskAlphaArray` (Node 8,6 ms → ~4 ms) + tái dùng
  canvas/ImageData của entry bị đuổi (0 cấp phát sau warmup) +
  fill Uint32.
- **Sửa watchdog rVFC giết oan** (đếm miss theo thời gian: tối đa 1
  miss/500 ms không-capture, kill sau 3 miss = ≥1,5 s hạn hán thật)
  — D/E không còn rơi `no-callback`. Nhãn cửa sổ blend đã vẽ +
  đọc kép (`prevFrame` + `lastDrawn*` trong `MotionBlurDebugState`).
- **Số thật sau sửa:** B (mask tĩnh) ratio **0,56–0,63**, rfMed
  **4,5–4,8 ms** (trước 73–85 ms), mask 0,7 ms, ticks 106–115/pass;
  C (mask động/track) ratio **0,59–0,63**, rfMed **8,2–9,2 ms**
  (đường cũ 33–39 ms; v1 hồi quy 95–198 ms), miss ~4,6 ms / hit
  ~0,7 ms; D (mask+SR) ratio **0,64–0,66**, rfMed 4,3–4,7 ms.
  **Parity pixel B/E: MAD=0, maxAbs=0** (240.672 px, feather 0 và
  0,2). **Assert A–E cuối: 100/100** (5 pass/case); drawn-spread
  median 0,2–1,4; trailMax=0 mọi case; rvfcFallback="" mọi case;
  longtask = 0 mọi pass B/C/D sau sửa lần 2.
- Kiểm chứng: tsc web 0; vite build pass (8,65 s); unit
  previewEngine **24/24**, ghostBlend 15/15, maskTrack 22/22,
  maskKeyframes 14/14, O4 37/37; click-test O8 Chromium 21/21
  (WebKit chưa chạy sau sửa — nợ).
- Giới hạn: tỉ lệ capture nay **0,56–0,66** — giới hạn là
  scheduling/capture rVFC (~8–32 ms, gap tới ~300 ms), không còn là
  tick; cache mask theo frameIdx chưa làm (dup 0,29–0,43); parity
  feather lớn + invert chưa đo.
- Chi tiết: `docs/PHASE9_ROUND92_T2_TICK_COST_LIMITS.md`.

### T3 — Canvas stale + stall > 1500 ms (nợ đợt 91 §4 mục 3: ĐÃ ĐÓNG, còn lag dư do WebKit)
- **Đo thật — thành phần nào làm canvas stale (probe92t3 mới,
  sampler ticks/holdStats/skip-N3/ring + rVFC riêng đo frame trình
  chiếu; clip GOP 30/60 sinh mới):** trước sửa (WebKit + tải):
  stall sau seekDone 1024–2829 ms; **stall >1500 ms là thường gặp,
  do CPU đói chứ KHÔNG do GOP thưa** — GOP 30 stall dài nhất
  (2829 ms) còn dài hơn GOP 250 (2109/2790 ms). Kết luận S2 "GOP
  dày stall ngắn hơn" **không đứng** trên VM này. Chu kỳ lag đỉnh:
  stall vượt ân hạn → playhead nhả → drift → re-seek → N3 bỏ vẽ cả
  chu kỳ (~1,5–2 s) → lag 1,2–1,9 s. Trạng thái ổn định: tick vẫn vẽ
  đều (draw+1..3, skipN3=0, hold=0) nhưng ballTime đứng yên →
  **frame trình chiếu WebKitGTK tụt sau currentTime tới ~0,6–0,7 s**
  (decoder/compositor không kịp). Hold-frame = 0 ở mọi lượt. rVFC
  WebKitGTK **không bao giờ bắn callback** dù `supported=true`
  (không dùng được để đo hay lái vẽ lại); Chromium lag trình chiếu
  chỉ 0,015 s mean — vấn đề là đặc tính pipeline WebKitGTK.
- **Sửa — giữ-while-frozen tới trần cứng 5000 ms** (chọn B thay vì
  nới ân hạn cố định 3000 ms): `playheadHold90R2.ts` thêm
  `PLAYHEAD_RESUME_STALL_MAX_MS = 5000`; `shouldHoldForResumeStall`
  giữ miễn là |Δct| < 1 frame + chưa quá 5000 ms; nhả ngay khi
  decoder resume. GRACE 1500 giữ nguyên giá trị (chỉ còn là cửa sổ
  kỳ vọng trong tài liệu). `preview.tsx`: filter dọn watch theo trần
  5000 ms + ring đo `renderFrameTickStats92T3` (600 mẫu tick, chỉ
  đo). Trade-off: decoder kẹt thật thì playhead + audio đóng băng
  tới 5 s (trước 1,5 s); quá trần trả về hành vi cũ.
- **Đo lại sau sửa — 0 re-seek / 5 lượt post:** WebKit+tải GOP 250
  stall 1285/1021 ms, lagEl max 0,648/0,725 s (trước 1,886 s),
  lagPh max 0,311/0,579 s; GOP 30 lagEl 0,647 s (trước 1,506 s);
  GOP 60 lagEl 0,850 s (trước 0,692 s — trong biên dao động, không
  hồi quy); Chromium GOP 250 lagEl 0,166 s. Lag đỉnh còn lại
  0,65–0,85 s là frame trình chiếu WebKit tụt (trạng thái ổn định,
  không còn churn).
- Kiểm chứng: tsc web 0; vite build pass (5,91 s);
  `playheadHold90R2.test` **31/31** (25 + 6 mới T3-R1..R6);
  `seek.test` **20/20**; `seekSkipRender86N3` **9/9**;
  `previewLoop50F2.test` **20/20**; O8 **21/21 cả 2 engine**.
- Caveat (T3 §4–§5): **chưa bắt được stall >1500 ms nào ở lượt
  post** (stall dài nhất post chỉ 906–1285 ms vì tải nhẹ đi cuối
  lượt) — trần 5000 ms chưa có bằng chứng trực tiếp ngoài đời, chỉ
  có unit test (giữ ở đúng 2109/2829 ms đo được, nhả ở 5001 ms) +
  0 re-seek gián tiếp. JSON lượt GOP 250 post #1 bị lượt #2 ghi đè
  (cùng phase `post`) — số #1 chỉ còn trong log, không kiểm lại
  được từ đĩa (T9 xác nhận). So sánh trước/sau không cân tải tuyệt
  đối (pre GOP 250 loadavg 13,3 vs post 3,9/2,7).
- Chi tiết: `docs/PHASE9_ROUND92_T3_CANVAS_STALE_LIMITS.md`.

### T4 — Dời cổng fail-fast lên trước pre-pass (nợ đợt 91 §4 mục 4: ĐÃ ĐÓNG)
- Tách cổng fail-fast adjustment-layer trong
  `server/render/src/render.js` thành hàm thuần
  `checkAdjLayerSplitConflicts(spec, transitions)` (cả 6 cổng:
  transition / speedKeyframes / animations / motion track /
  enhance.stabilize / mask keyframes, wording giữ nguyên 100%),
  `main()` gọi sớm ngay sau validateSpec + validateMedia — trước
  vidstab detect, GPU probe, font, text SR PNG, mask PNG R2, mask
  anim D4. `buildFilterGraph` vẫn gọi lại cổng ở đầu để giữ phòng
  thủ; khối cổng inline trong vòng mở rộng clip đã bỏ.
- **Số đo thật (render 1280×720, 30fps, 4 s):** S4-F **5,1 s →
  0,2–0,3 s (3 lần đo), tiết kiệm ~4,8 s**; exit 1, đúng thông điệp
  cổng, 0 warn `mask keyframes:`, không ra MP4 — giữ nguyên. Bằng
  chứng quyết định: stdout rỗng, không log `mask anim "…"`, không
  `.mkv` — pre-pass D4 thực sự không chạy. T4-F5 tương tự: không log
  vidstabdetect/`.trf`. Các cổng F2/F3/F4/F6 vốn rẻ (~0,3–0,6 s,
  tiết kiệm ~0) — dời để khóa chung, chống pre-pass tương lai tái
  gây lãng phí.
- Kiểm chứng: test mới `test_round92_t4_failfast_prepass.js`
  **32/32** (F1 7 + F2 4 + F3 4 + F4 4 + F5 6 + F6 4 + R1 3; R1 đối
  chứng: layer bao trọn render OK, pre-pass vẫn chạy, tâm mask
  t=2.0 = 0,5/0,5); S4 chạy lại **60/60**, P1 **30/30**, nested
  adjustment e2e **43 pass / 0 fail** (1 PENDING có sẵn, không liên
  quan), adjustment render **39/39**, adjustment unit **46/46**,
  adjustment spec **21/21**, tsc web **0**, vite build **pass
  11,36 s**. Bẫy assert đã gặp và sửa: `/mask anim/` khớp cả thông
  điệp cổng ("mask animation") → đổi thành
  `/mask anim ("|fallback)/` (lần chạy đầu 31/32, sau sửa 32/32).
- Giới hạn (T4 §4): ngưỡng giây `<5 s` nhạy tải VM (assert quyết
  định là vắng mặt log pre-pass); tiết kiệm cho stabilize chưa đo
  số trước/sau; thứ tự lỗi đổi với spec xung đột kép sau bước 3
  (cùng exit 1); cổng vẫn throw không catch (stack trace stderr,
  giữ dạng cũ); chưa đo clip dài / dry-run.
- Chi tiết: `docs/PHASE9_ROUND92_T4_FAILFAST_PREPASS_LIMITS.md`.

### T5 — i18n StickerPanel (nợ đợt 91 §4 mục 5: ĐÃ ĐÓNG)
- Thêm key `sticker.title` = `"🌟 Sticker"` (cả vi/en — loanword,
  khớp tông panel), `StickerPanel.tsx:192` dùng
  `{i18nT("sticker.title")}`. Dict **2517 → 2518 key lá mỗi bên**,
  cùng tập key, 0 mồ côi, 0 rỗng (đếm lại từ đĩa 2 lần).
- Bump pin 2517 → 2518 ở đúng **17 file test pin số key** (assert +
  tên test; comment lịch sử nối thêm theo quy tắc S5).
- **Phát hiện thêm trong lúc bump:** `sticker.title` giống hệt 2
  bên nên số key vi==en 60 → **61** — đã bump pin này ở 4 file
  (i18nOrphans60Q4, i18nAudit59P7, i18nSweep81I9 incl. tên test,
  codecProbeUi75C6). Quên lớp pin này thì 4 test đã đỏ.
- **Pin theo key/call site (css60 §8) kiểm tra thực tế:** chỉ có 4
  khối checkI18n (preview 54, HistoryPanel 26, TrackPanel 14,
  TtsButton 63); **không có khối StickerPanel** nên không có gì để
  bump — đúng bài học đợt 91 (không đoán, đã đối chiếu đĩa).
  TrackPanel 14 vẫn đúng.
- Quét lại: StickerPanel toàn file (16 call site `sticker.*`,
  không còn literal UI), TrackPanel + MaskPanel kề đều sạch.
- Kiểm chứng (cây cuối, chạy 2 lần): 17 test pin xanh hết
  (Orphans 16/16, Audit P7 8/8, Sweep I9 16/16, Modals G9 9/9, H7
  13/13, ProjectMenu 6/6, codecProbeUi 16/16, saveToast 15/15,
  structuredNotes 12/12, reverse 8/8 + 10/10 + 3/3 + 3/3, N4 14/14,
  D8 14/14, errorDetail 35/35, speedWarn 5/5) + **css60 59/59** +
  validateCodes **1596/1596** + validateCodes63R9 **53/53**; **tsc
  web 0**; **vite build pass** (24,98 s). Lưu ý: lần tsc đầu báo 1
  lỗi ở `media.ts` do luồng sibling T1 đang sửa dở (`srcLatch`,
  mtime đúng lúc đó) — không phải code luồng này; chạy lại sau khi
  sibling xong thì 0 lỗi.
- Nợ còn lại (T5 §5): nhãn sticker trong
  `packages/video-spec/src/sticker.ts` hardcode tiếng Việt (data
  layer, locale EN vẫn hiện tiếng Việt ở tab + tên sticker) — ngoài
  brief, để parent quyết. Đề xuất thêm khối checkI18n StickerPanel
  vào css60 §8 ở đợt sau (sẽ đổi 59 → 60 check).
- Chi tiết: `docs/PHASE9_ROUND92_T5_I18N_STICKER_LIMITS.md`.

### T6 — G1 evidence vòng 4 + regex EADDRINUSE (nợ đợt 91 §4 mục 6: BẰNG CHỨNG MỚI, KHÔNG tự đóng)
- **5 lần đo mới, tất cả PASS:** E1 30fps run1 **1,03×** (tải,
  baseline 4,00 fps, 10/10) + run2 **1,04×** (yên, baseline 10,03
  fps, 10/10 — **lần yên 30fps PASS đầu tiên**). 60fps (probe N10):
  **1,04 / 0,96 / 1,07**, 4/4 cases mỗi lần. Run1 là **lần yên
  60fps thứ hai** (baseline 12,60 fps).
- **Pool gộp (script kế thừa S6, cùng công thức): 60fps n=17,
  median 0,990×, CI [0,908; 1,086], PASS 15/17 (88%)**; **30fps
  n=32, median 0,945×, CI [0,869; 1,022], PASS 26/32 (81%)**. Chân
  yên 60fps n=2 (0,99 / 1,04), chân yên 30fps n=5 (median 0,680,
  2/5 PASS). Cửa sổ 5 lần 60fps mới nhất PASS luật (b) 5/5 lần thứ
  ba liên tiếp.
- **Khuyến nghị: KHÔNG đóng G1 toàn vẹn.** Phương án A (đóng một
  phần, chế độ tải) mạnh hơn S6 nhưng pool 30fps vẫn chỉ cần 1 FAIL
  nữa là rơi dưới 80%, chân yên cả hai fixture đều chưa đủ CI.
  Quyết định thuộc user.
- **Nhánh EPERM của E1 — ĐÃ kích hoạt bằng fail thật lần đầu tiên
  (nợ S6 §7.4a ĐÃ ĐÓNG):** tự viết LD_PRELOAD shim
  (`eperm-shim.c`, chặn ghi file trả EPERM). Sau 2 lần thử sai
  marker, lần 3 (marker `.timestamp-`) cho E1 exit 2, chẩn đoán
  **EPERM đúng cả 3 lần thử** (vite exit 1, log chứa `EPERM:
  operation not permitted, open
  '...vite.e1.headed.config.mjs.timestamp-....mjs'`). Tìm ra **cơ
  chế chết thật của vite dưới EPERM**: bundle config ghi file tạm
  `*.timestamp-*.mjs` — ghi fail là vite chết trước khi serve, giải
  thích sóng EPERM thật Q7 (vite exit 1, log 0 byte). Phát hiện phụ:
  dep optimizer EPERM **không** giết được vite (retry mãi, vẫn
  serve 200). Lưu ý: lần thử 1 vô tình chạy hết headed (10/10, G5
  1,03×) vì marker không chặn được gì — dùng làm e1-run1 với lý do
  ghi rõ ở LIMITS §7.4 (0 EPERM trong mọi log); nếu parent không
  chấp nhận thì loại run1, pool 30fps về n=31 (25/31 = 81%, median
  0,940), không đổi verdict nào.
- **Regex EADDRINUSE — ĐÃ SỬA (nợ S6 §6.11 ĐÃ ĐÓNG):** thêm mẫu
  `/Port \d+ is already in use/` vào cả 3 harness (E1 +
  probe-78f1/79g1-tick-time). Chứng minh bằng log vite thật ("Port
  5580 is already in use", không có chữ EADDRINUSE — regex cũ
  false, mới true) + fault-injection port-conflict (dummy giữ :5580
  → E1 exit 2, chẩn đoán "cổng bị chiếm" đúng). Nhánh regex qua
  đường harness thật vẫn chưa kích hoạt (dummy luôn bị nhánh
  foreign-server bắt trước) — nợ nhỏ đợt sau.
- Kiểm chứng: test regex mới **9/9**, deint verdict **12/12** (chạy
  lại 21/21 trên cây cuối); pixel giống hệt lịch sử (D1 MAD
  0,3835; G2 0,5821; G7a 0,6903; G7b 0,0119); 0 lỗi trang, 0 dấu
  EPERM trong log đo; không sửa production, không đụng TTS 39;
  không process mồ côi.
- Chi tiết: `docs/PHASE9_ROUND92_T6_G1_EVIDENCE4_LIMITS.md`.

### T7 — Birefnet cửa sổ yên, thử lại (nợ đợt 91 §4 mục 7: KHÔNG ĐỦ ĐIỀU KIỆN, KHÔNG CHẠY)
- **RAM không đủ — KHÔNG CHẠY birefnet-general.** 20 mẫu
  MemAvailable × 30 s trong 10 phút (20:38:47–20:48:17Z): min 450
  MB, trung vị 872,5 MB, trung bình 975,4 MB, **max 1707 MB = chỉ
  27,8% ngưỡng guard 6144 MB**. Không ép bằng `--no-ram-guard`.
  Không có frame/RSS để ghi vì không chạy. **Birefnet-general vẫn 0
  lần chạy thành công trong gói** — nợ còn mở. Đây là lần thử lại
  thứ hai liên tiếp thất bại ở cùng điều kiện tiên quyết (S8 đợt 91
  max 1629 MB → T7 đợt 92 max 1707 MB).
- **RAM guard P7 vẫn chặn đúng (3 lớp):** (a) toàn bộ file
  `bgremove.py` trong gói Q9 giống hệt source repo (diff cả file —
  identical, không chỉ vùng guard); (b) quyết định live bằng code
  trong gói: birefnet-general @ 495 MB thật → `fallback`, u2net @
  495 MB → `allow`, birefnet @ 6500 MB → `allow`, biên 6143 MB →
  `fallback`, 6144 MB → `allow`; (c) unit test guard repo
  `test_bgremove_ramguard.py`: **8/8 pass, 0 fail**.
- AppImage Q9 verify lại còn nguyên: 557.008.461 byte, sha256
  `9680cef1586149a98f00ccd8f645573a6ab460b3d2d578f608b2987ee9914f78`
  — khớp hồ sơ R5/Q9. Không có AppImage mới hơn nào trong đợt 92
  tính đến lúc kiểm tra; hai bản trong `apps/desktop/release/` và
  `release-round55-l4/` vẫn là bản K7 cũ.
- VM reboot thêm lần nữa: boot ~19:23Z (uptime 1h15 lúc bắt đầu
  lượt), sau lần ~17:24Z của đợt 91. Swap dùng 317–443 MB suốt cửa
  sổ; load 1m lên tới 6,17 do các luồng đợt 92 chạy song song.
- **Đề xuất T7 cho parent:** cân nhắc dừng thử lại birefnet mỗi
  lượt: chỉ thử lại khi có tín hiệu RAM thay đổi (VM nâng RAM, hoặc
  lượt chạy lúc vòng lặp tạm dừng), vì 2 lần thử liên tiếp đều thất
  bại ở cùng điều kiện tiên quyết — guard đúng, AppImage đúng, chỉ
  thiếu RAM.
- Chi tiết: `docs/PHASE9_ROUND92_T7_BIREFNET_WINDOW_LIMITS.md`.

### T8 — EPERM probe v2 checklist + khoảng mù #10 (nợ đợt 91 §4 mục 8: ĐÃ ĐO XONG)
- Checklist P8 §2.3 chạy ĐÚNG 1 lần: `status` 20:38:56Z báo
  **DEAD/STALE** (heartbeat age 10.773 s, last #10 17:39:23Z, boot
  182a689e, exit 1); `once` → **probe #11, boot 14e10da9 (ĐỔI),
  ok=2 fail=0**, exit 0 (dòng `boot changed 182a689e ->
  14e10da9` ghi vào log); `status` lại **ALIVE** (age 0 s, n=11),
  exit 0.
- **Khoảng mù #10: 17:39:23Z → 20:38:56Z (~180 phút)** — dài thứ
  hai trong lịch sử probe (sau khoảng mù #8, ~187'). Trong đó có
  **1 lần reboot ĐÃ XÁC NHẬN: 19:22:48Z** (182a689e → 14e10da9,
  reboot thứ 10). **Phát hiện mới: reboot này KHÔNG được ai ghi
  nhận lúc xảy ra** — grep `19:22`/`reboot thứ 10`/`boot 14e10`
  trong build-loop-log và memory log = 0 hit. Nó rơi vào khe giữa
  lần ghi cuối của S9 (19:19:57Z) và lần sửa đầu của parent ở
  closing (19:25:08Z); parent làm closing 19:25–19:37Z sau reboot
  mà không nhận ra. Đây là bằng chứng trực tiếp rằng khoảng mù giấu
  được cả reboot, không chỉ sóng EPERM.
- Không có bằng chứng sóng EPERM trong các bản ghi còn lại (S6: 0
  dấu EPERM trong 5 lần đo; O8 21/21 cả 2 engine 19:11–19:14Z;
  closing tới 19:37:20Z không ghi EPERM). Nhưng **đuôi mù hoàn toàn
  19:37:20Z → 20:38:56Z (~62')** — không kết luận "không có sóng".
  Sóng gần nhất vẫn ~11:55–12:11Z (R7), ~8h27' trước probe #11.
  Reboot trung gian khác trong 17:39Z → 19:22Z không loại trừ được
  (journal/wtmp chỉ giữ 1 boot).
- Quét writeFileSync (chuẩn mới, ~20:40–20:43Z): **186 dòng / 68
  file** (phạm vi 2.477 file) — source **92** (+4 vs S7), docs
  **94** (+13 vs S7). Đối chiếu phương pháp R7 cũ: **211 dòng**
  (186 + 25 bản copy: 3 build + 22 release) — khớp chéo hoàn toàn
  với S7 (169 + 25 = 194). +4 source: toàn bộ là 4 harness đo một
  lần mới của đợt 91 (probe91s1 ×3 + probe91s2 ×1) — mỗi file 1
  dòng, không phải đường ghi production. +13 docs: 12 từ 3 LIMITS
  mới đợt 91 + 1 từ GAP §20 mới ở closing. Async `.writeFile(`
  production ngoài helper: **0** — 2 hit là chính lệnh ghi của
  helper (`epermRetry.js:116` + `eperm-retry.mjs:71`); 2 hit Gradio
  là ffmpeg.wasm FS trong bộ nhớ (đã ghi ở R7/S7). **Không còn
  đường ghi production nào chưa nối helper.**
- Đề xuất cron riêng 10 phút vẫn CHỜ user quyết. Lỗi phương pháp
  lúc đầu (đã sửa, ghi trong LIMITS §4): lần quét đầu cộng cả file
  count=0; lần R7-cũ đầu loại nhầm `apps/desktop/release*/`.
- Chi tiết: `docs/PHASE9_ROUND92_T8_EPERM_PROBE_LIMITS.md`.

### T9 — Kiểm chứng độc lập T1–T8 (ĐÃ XONG — cả 8 luồng XÁC NHẬN, không phát hiện lỗi thật)
- T1: JSON appswap đếm lại khớp bảng (trước 23 lần gán/22 đổi kind;
  sau 2/1; phát lại blob 3/3); unit media 25/25.
- T2: JSON tickcost khớp hết (B 73–85 ms → 4,5–4,8 ms; C 33–39 ms
  → 8,2–9,2 ms; ratio → 0,56–0,66); parity MAD=0; assert A–E
  100/100 (spread 0,2–1,4); unit 24/24 + 15/15 + 22/22 + 14/14 +
  O4 37/37.
- T3: analyzer chạy lại trên 8 JSON khớp bảng (0 re-seek / 5 lượt
  post); playheadHold 31/31.
- T4: test mới 32/32, S4 chạy lại 60/60 (render thật).
- T5: dict đếm lại 2518/2518, 61 vi==en; Orphans 16/16, P7 8/8,
  css60 59/59, Sweep 16/16.
- T6: pool script chạy lại khớp (60fps 15/17, 30fps 26/32); regex
  9/9, verdict 12/12; log fault-injection có chẩn đoán EPERM đúng.
- T7: guard 8/8, AppImage sha `9680cef1…` khớp, bgremove.py
  identical, log mẫu RAM khớp bảng.
- T8: probe #11 trong log v2 (ok=2 fail=0); quét writeFileSync lại
  **197 dòng**, delta +11 giải thích được hết (file mới của đợt 92:
  LIMITS T1–T9 + probe/harness mới + GAP §21 — T9 chạy quét sau
  khi các luồng đợt 92 đã ghi file mới), không còn đường ghi
  production nào chưa nối helper.
- Hồi quy chéo cây cuối (T9 tự chạy, sau lần sửa file cuối 22:01Z):
  tsc web **0**, tsc desktop **0**, vite build **pass (8,39 s)**,
  O2 render **25/25**, O8 click-test **21/21 Chromium + 21/21
  WebKit**. Marker các luồng cùng tồn tại trong file chung
  (`preview.tsx`, `previewEngine.ts`), không ghi đè nhau. **Không
  sửa production** — không phát hiện lỗi thật nào.
- Đính chính / lưu ý: T1 số play() @ct=0 đếm lại 8/7/6 (LIMITS ghi
  7/6/6); T3 JSON GOP250 post #1 bị #2 ghi đè (chỉ còn trong log);
  O8 Chromium T9: S7 Δx=0,112 (nhỏ hơn kỳ vọng ~0,19; mask và bóng
  cùng di chuyển ít hơn, harness vẫn PASS) — ghi để đợt sau đối
  chiếu. WebKit cùng lượt Δx=0,194/0,197 bình thường.
- **Phát hiện mới — VM reboot lần 11, ~21:35:58Z:** boot nay
  `09e8d2af…`, uptime 21:35:58 — reboot thứ 11 trong ~25h, không
  luồng nào ghi nhận lúc xảy ra. **Khoảng mù #11 bắt đầu
  20:38:56Z** (probe #11); probe tiếp theo là #12; cron riêng 10
  phút vẫn chờ user quyết. Reboot giết script chờ đầu tiên của T9,
  xóa /tmp (script test T5 phải bundle lại), giết server scratch T1
  (bridge 8787 + vite 4173 — đã chết, không cần dọn) và vite 5173
  của T2 (T9 đã kill, cổng free). Dep WebKit mất sau reboot (0
  plugin) — T9 đã khôi phục từ debroot (`cp -an`, 269 plugin +
  glib-compile-schemas 41.821 B) + Xvfb :199 để chạy O8 WebKit.
- Chi tiết: `docs/PHASE9_ROUND92_T9_VERIFY_LIMITS.md`.

## 2. Kiểm chứng parent (cây đã gộp, lượt cron 03:35 +07 12/11)

- **Xung đột file chung:** `preview.tsx` bị T2 (tick-cost, cache
  alpha mask) và T3 (trần 5000 ms + ring đo tick) cùng sửa — kiểm
  tra trực tiếp: marker `maskAlphaCanvasFor` (T2) và ring đo
  `renderFrameTickStats92T3` (T3) cùng có mặt, không ghi đè nhau.
  `media.ts` chỉ T1 sửa (`srcLatch`); `previewEngine.ts` chỉ T2
  sửa; `playheadHold90R2.ts` chỉ T3 sửa; `render.js` chỉ T4 sửa.
  Không có file nào khác bị 2 luồng cùng sửa.
- **T2 handoff không tới được parent** — parent đọc trực tiếp từ
  đĩa (LIMITS + log + batch T2 đều có mặt 22:21–22:22Z), khớp với
  kiểm chứng độc lập của T9. Không báo missing khi chưa kiểm tra
  đĩa (quy tắc đã lập từ đợt 19).
- tsc web **0 lỗi**; tsc desktop **0 lỗi**; vite build **pass
  (7,85 s, parent chạy lại sau lần sửa file cuối 22:01:31Z)**.
  Rely vào kiểm chứng độc lập T9 cho phần chạy lại test (T9 đã chạy
  lại toàn bộ trên cây cuối, sau lần sửa file cuối 22:01Z): O2
  render 25/25; O8 21/21 cả 2 engine; mọi unit test của T1–T8
  chạy lại xanh.
- Server scratch: T1 để lại bridge 8787 + vite 4173 — **đã chết
  theo reboot #11** (T9 xác nhận, không còn process/port nào lắng
  nghe lúc closing — parent kiểm tra lại: không còn port
  4173/5173/8787/5580). Không cần dọn thêm.

## 3. Quyết định parent

1. **Flip-flop src: ĐÃ ĐÓNG** (T1) — latch `srcLatch` khóa src;
   đổi kind 22 → 1, phát lại sau pause dùng blob 3/3. Nợ còn lại:
   blob-load flaky ~25% chưa chứng minh giảm nhờ fix; cửa sổ bấm
   phát <400 ms chưa đo; lần phát đầu chốt http thì phát lại vẫn
   http tới khi scrub về 0.
2. **Chi phí tick main-thread: ĐÃ ĐÓNG** (T2) — cache alpha mask +
   destination-in; tick B 73–85 ms → 4,5–4,8 ms, C 33–39 ms →
   8,2–9,2 ms, parity MAD=0, assert A–E 100/100. Blocker rVFC nay
   là scheduling/capture (ratio 0,56–0,66), không còn là tick.
3. **Canvas stale / stall >1500 ms: ĐÃ ĐÓNG** (T3) — trần giữ
   5000 ms; 0 re-seek/5 lượt post, lag đỉnh 1,5–1,9 s → 0,65–0,85 s.
   Nợ còn lại: trần 5000 ms chưa có bằng chứng ngoài đời (chưa bắt
   được stall >1500 ms ở lượt post); lag dư 0,65–0,85 s là frame
   trình chiếu WebKit tụt (đặc tính pipeline WebKitGTK, Chromium
   không bị); rVFC WebKitGTK không bao giờ bắn callback.
4. **Cổng fail-fast trước pre-pass: ĐÃ ĐÓNG** (T4) — S4-F 5,1 s →
   0,2–0,3 s, hành vi lỗi giữ nguyên.
5. **i18n StickerPanel: ĐÃ ĐÓNG** (T5) — dict **2518 key**. Nợ
   còn lại: nhãn sticker trong `packages/video-spec/src/sticker.ts`
   hardcode tiếng Việt (data layer) — để đợt sau / parent quyết.
6. **G1: vẫn MỞ.** Không tự đóng trong phiên nền — bằng chứng T6
   (60fps 15/17 = 88%, 30fps 26/32 = 81%) mạnh hơn S6 nhưng pool
   30fps vẫn chỉ cần 1 FAIL nữa là rơi dưới 80%, chân yên chưa đủ
   CI. Nhánh EPERM của E1 đã kích hoạt bằng fail thật (cơ chế chết
   của vite: file tạm `*.timestamp-*.mjs`); regex EADDRINUSE đã sửa
   khớp cả thông báo vite.
7. **Birefnet: vẫn 0 lần chạy thành công trong gói** (T7 — RAM max
   1707 MB, 27,8% ngưỡng). **Quyết định parent: từ đợt 93 trở đi,
   CHỈ thử lại birefnet khi có tín hiệu RAM thay đổi** (VM nâng RAM
   hoặc lượt chạy lúc vòng lặp tạm dừng) — 2 lần thử liên tiếp thất
   bại ở cùng điều kiện tiên quyết, guard đúng, AppImage đúng, chỉ
   thiếu RAM. Không thử lại mò mỗi lượt nữa.
8. **Cron riêng 10 phút cho probe EPERM: KHÔNG tự tạo** — chờ user
   quyết (khoảng mù #10 dài 180 phút với 1 reboot không-ai-ghi-nhận;
   khoảng mù #11 đã bắt đầu 20:38:56Z, reboot #11 ~21:35:58Z cũng
   không ai ghi nhận lúc xảy ra).
9. **EPERM probe:** probe #11 ok=2 fail=0; khoảng mù #10 ~180 phút
   với 62 phút cuối không có bản ghi nào — không kết luận được về
   sóng. Sóng gần nhất vẫn ~11:55–12:11Z.
10. **O8 Chromium Δx=0,112 (T9):** ghi để đợt sau đối chiếu, không
    phải lỗi (harness vẫn PASS).

## 4. Nợ mở cho đợt 93 (12 mục)

1. **rVFC pump/scheduling:** tỉ lệ capture mới 0,56–0,66 (T2 §8) —
   giới hạn nay là scheduling/capture rVFC (~8–32 ms, gap tới
   ~300 ms), không còn là tick; cache mask theo frameIdx (dup
   0,29–0,43); parity feather lớn + invert; click-test WebKit sau
   sửa T2.
2. **Flip-flop src:** đo đối chứng loop/load-play blob sau fix T1
   (blob-load flaky ~25% có giảm không); cửa sổ bấm phát <400 ms;
   lần phát đầu chốt http thì phát lại vẫn http tới khi scrub về 0.
3. **Playhead/canvas:** trần 5000 ms của T3 chưa có bằng chứng
   ngoài đời (cần bắt stall >1500 ms ở lượt post); lag đỉnh còn
   0,65–0,85 s do frame trình chiếu WebKit tụt; rVFC WebKitGTK
   không bao giờ bắn callback dù supported=true; O8 Chromium Δx
   0,112 để đối chiếu.
4. **Fail-fast:** tiết kiệm cho stabilize chưa đo số trước/sau;
   thứ tự lỗi đổi với spec xung đột kép sau bước 3; chưa đo clip
   dài / dry-run.
5. **i18n:** nhãn sticker trong `packages/video-spec/src/sticker.ts`
   hardcode tiếng Việt (data layer); đề xuất thêm khối checkI18n
   StickerPanel vào css60 §8 (59 → 60 check).
6. **G1:** quyết định đóng/mở thuộc user (T6 §4); chân yên 60fps
   n=2, chân yên 30fps n=5; kích hoạt nhánh regex EADDRINUSE qua
   đường harness thật (giữ cổng bằng nc thay vì dummy HTTP); lưu ý
   T6: nếu parent không chấp nhận e1-run1 (lần thử shim sai marker)
   thì loại run1, pool 30fps về n=31 (25/31 = 81%, median 0,940),
   không đổi verdict nào — **parent chấp nhận run1** (0 EPERM
   trong mọi log, lý do ghi rõ ở LIMITS T6 §7.4).
7. **Birefnet:** chỉ thử lại khi có tín hiệu RAM thay đổi (quyết
   định parent §3 mục 7); vẫn 0 lần thành công trong gói.
8. **EPERM probe:** khoảng mù #11 bắt đầu 20:38:56Z (probe #11);
   probe tiếp theo là #12; cron riêng 10 phút vẫn chờ user quyết;
   reboot 11 lần/~25h (~2h16'/lần).
9. **TTS 39: CẤM kiểm lại** (nợ cũ, giữ nguyên — không đụng).
10. **ci-security 403** — workflow file vẫn chưa lên được GitHub;
    chờ user (kiểm tra quyền Workflows / gỡ-cài lại App / tự thêm
    qua web).
11. **Môi trường:** dep WebKit mất sau mỗi reboot (đường vòng
    `dpkg-deb -x` + `cp -an`, debroot giữ trong
    `~/workspace/tmp-q6r3-debroot` cho lần sau); /tmp có thể đầy
    (dọn debroot stale trước khi chạy render nặng); Xvfb cần retry
    chặt sau mỗi reboot; trạng thái quan trọng chỉ để trong
    ~/workspace, không để /tmp hay /usr; reboot #11 giết script chờ
    của T9 và vite dev của T2 — các luồng cần tự khôi phục sau
    reboot giữa lượt.
12. **Harness O8/Q5:** nhãn kỳ vọng S7 lẫn hệ tọa độ (Q5 §6 mục 4,
    mỹ phẩm); test timing Q5 có thể flake dưới tải cực nặng (Q5 §6
    mục 5); số đo seek chỉ cho clip GOP 250 (nay đã mở rộng sang
    GOP 30/60 ở T3 — stall do CPU đói, không do GOP).

## 5. Batch đã stage (KHÔNG push)

- Đợt 92: 9 luồng, **51 entry / 9 file** (T1 5, T2 8, T3 6, T4 3,
  T5 21, T6 5, T7 1, T8 1, T9 1) + closing 2 entry (LIMITS gộp này
  + `PHASE9_GAP_ANALYSIS.md` §21).
- **Tổng chờ push sau đợt 92: 2124 entry / 262 file batch / 1265
  file duy nhất** (đợt 67–91: 2071/252/1245; đợt 92: 51/9 — 51 entry
  nhưng chỉ +19 file duy nhất vì 32 entry trùng file đã stage đợt
  trước; closing: +2 entry / +1 file batch / +1 file duy nhất —
  LIMITS gộp mới; gap analysis đã stage từ các đợt trước. Đếm lại
  trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.
