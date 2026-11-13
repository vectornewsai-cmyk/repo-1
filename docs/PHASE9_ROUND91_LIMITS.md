# PHASE9 ROUND91 — LIMITS gộp (đợt 91: đóng nợ LIMITS gộp đợt 90 §4)

> Lượt cron 00:35 +07 12/11/2026 (làm việc 17:36–19:20Z 11/11/2026).
> Chủ đề lớn: **đóng nợ LIMITS gộp đợt 90 §4** — 9 luồng S1–S9, tất cả
> đều về (S7 handoff không tới được parent — parent đọc trực tiếp từ
> đĩa theo skill verify_delegated_work: LIMITS + log + batch S7 đều có
> mặt 17:49–17:50Z). **KHÔNG push. KHÔNG release/tag.**
>
> Bối cảnh môi trường: VM reboot 17:24:01Z (boot 0799d357 → 182a689e,
> reboot thứ 9 trong ~21h); /tmp trống lúc bắt đầu lượt; RAM tổng 7 GB
> nhưng khả dụng chỉ ~0,5–1,6 GB suốt lượt.

## 1. Kết quả từng luồng

### S1 — Motion blur preview: requestVideoFrameCallback (nợ đợt 90 §4 mục 1: ĐÃ ĐÓNG, còn nợ nhỏ)
- Pump `requestVideoFrameCallback` vào production (`preview.tsx` +
  helper pure `rvfcFrameDecision`/`rvfcSupported` trong
  `previewEngine.ts`): snapshot theo frame video trình chiếu, không
  theo tick rAF; watchdog 3 miss → fallback đường tick R1; hook
  `__vcutDisableRvfc` để đo baseline.
- Assert A/B/C/D/E, 5 pass/case: **100/100, trail = 0 trên 1626
  khung**; rVFC active, không fallback lần nào. Baseline đường tick
  (case B, `--disable-rvfc`): spread median **29.1 vs rVFC 0.0** — cải
  thiện xác định thật.
- Combo mới đo pixel: D = mask+SR+blur (w50 lệch ≤12.6, trong ±20; tâm
  0.501 dưới SR), E = mask feather 0.2+blur (edge play = pause chính
  xác 56.5/58.4, lý thuyết 57.6px) — cả hai khớp lý thuyết.
- Mép phải 3.6px: **kết luận pha sub-pixel, KHÔNG sửa code** — pause
  sweep 45 mốc tái hiện 3.6 đúng tại cx=0.7 (r90frac 0.124 hằng số);
  là lượng tử hoá đo (1.4 canvas px × 2.6), không phải lỗi blend.
- Unit: previewEngine **20/20** (3 test mới), ghostBlend 15/15,
  maskTrack 22/22, maskKeyframes 14/14, O4 37/37; tsc 0; vite build
  PASS; O8 **21/21 cả 2 engine**.
- Giới hạn thật (S1 §4): dưới tải VM này rVFC bị gộp (chỉ capture
  ~1/3 frame đã trình chiếu — main thread bận vì xử lý mask CPU, không
  phải decoder đuối); lợi ích đầy đủ chỉ khi main thread rảnh —
  blocker tiếp theo là chi phí tick main-thread (ngoài phạm vi S1);
  watchdog/fallback chưa từng kích hoạt thật; WebKitGTK rVFC chưa đo
  bằng pixel; render canonical D/E chưa có.
- Chi tiết: `docs/PHASE9_ROUND91_S1_MOTIONBLUR_RVFC_LIMITS.md`.

### S2 — Playhead/canvas: sawtooth WebKit sau seek (nợ đợt 90 §4 mục 2: ĐÃ ĐÓNG)
- **Nguyên nhân thật (đo bằng probe91s2, clip bóng GOP 250, sampler
  100 ms):** sau seek, R2 nhả giữ và element được `play()` lại, nhưng
  `currentTime` của element WebKit **đứng yên ~0,8–1,0 s (yên) /
  ~0,7–1,7 s (tải)** trong lúc `paused=false`, `seeking=false` —
  decoder cần decode xuôi từ keyframe thưa tới điểm seek. Playhead
  chạy tiếp ~1× wall (+0,47–0,70 s/stall) → drift vượt 0,35 s → drift
  re-seek → snap → lặp lại (3–4 re-seek/lượt, đỉnh lag 0,75–1,20 s).
- **Sửa — giữ playhead vì resume-stall (grace 1500 ms):**
  `shouldHoldForResumeStall` trong `playheadHold90R2.ts` +
  `forwardSeekCompletedThisTick` (chỉ nhánh forward, chỉ video) +
  tham số `playheadHeldResume` trong `syncMedia` — khi giữ kiểu này
  VIDEO vẫn phát (pause thì currentTime không bao giờ tăng), chỉ AUDIO
  pause.
- Đo lại sau sửa (cùng probe, 2 biến thể WebKit): re-seek **0/0**
  (trước 3/4); playhead đóng băng 582 ms (yên) / 604 ms (tải) trong lúc
  element stall, lag −0,019 suốt stall; lag max 0,55–0,70 s (trước
  0,75–1,20 s), mean 0,15–0,19 s (trước 0,65–0,79 s); max |ph − elT|
  ~0,21 s. Lag đỉnh còn lại là **canvas stale dưới tải** (tầng render,
  đã ghi rõ trong LIMITS §5), không còn là playhead chạy trước media
  clock.
- `previewLoop50F2.test.ts` chạy được bằng strip-types: **20/20**
  (thêm đuôi `.ts` cho 2 import + `@ts-ignore` TS5097 theo mẫu repo).
- Kiểm chứng: tsc web 0; vite build pass (6,86 s);
  `playheadHold90R2.test.ts` **25/25** (14 cũ + 11 mới); `seek.test.ts`
  20/20; `seekSkipRender86N3` 9/9; O8 **21/21 cả 2 engine** (S9 chạy
  thay — S2 chưa kịp chạy O8).
- Caveat trung thực (S2 §4): so sánh trước/sau không cân tải tuyệt đối
  (luồng sibling đến/đi); JSON probe tải-trước-sửa đã bị ghi đè bởi lượt
  sau-sửa (số còn trong console log + log luồng); ân hạn 1500 ms —
  stall dài hơn thì trả về hành vi cũ (drift re-seek lo).
- Chi tiết: `docs/PHASE9_ROUND91_S2_PLAYHEAD_SAWTOOTH_LIMITS.md`.

### S3 — WebKit clip D: bitrate 1.3–10 MB + chẩn đoán tầng + swap-trượt + error handler (nợ đợt 90 §4 mục 3: ĐÃ ĐO XONG, phát hiện mới lớn)
- Môi trường sau reboot: khôi phục GStreamer từ
  `~/workspace/tmp-q6r3-debroot` (269 plugin) + `glib-compile-schemas`;
  Xvfb :199 chạy sẵn; WebKitGTK 27.2 smoke OK. Sinh 5 clip testsrc2
  720p CBR ~2 Mbps (2,0 / 4,0 / 5,9 / 7,8 / 9,7 MB). **Không sửa code
  production** (`media.ts` nguyên vẹn).
- (a) **Không có cliff theo kích thước** — blob fail rải rác ở mọi cỡ
  (đếm lại S9 §3.1, loại 16 case nhiễm): c2 1/2, c4 2/3, c6 3/3,
  c8 3/6, c8+delay 3/3, c10 skipped đúng 3/3; blob eligible **15/20**
  vs progressive **20/20**; loop rút gọn blob **0/8** vs progressive
  **8/8** (resume median 241–452 ms). c8 + delay play 1 s sau
  blobReady: 3/3.
- (b) Chẩn đoán tầng: qtdemux `atom has bogus size 570402281` — **bổ
  sung parent theo S9 §3.2:** chữ ký có trong 4/4 log blob của batch
  nhiễm (run1/2/3 — play() chưa được gọi) + 1/1 log stall thật
  (run12), 0 lần trong 4 log pass và 0 lần trong mọi log prog. Chữ ký
  là marker của **race teardown lúc swap** (nổ cả khi chưa gọi
  play()), không phải bằng chứng "chỉ fail mới có". Kết luận cơ chế
  (fail ở tầng swap pipeline WebKit, không phải nội dung file) vẫn
  đứng — thậm chí được củng cố. Fail ở tầng swap pipeline WebKit lúc
  teardown sau swap http→blob, rồi pipeline blob không preroll (log im
  10 s, play() treo; dạng còn lại: error-event → "not supported" →
  fallback http). Bundle probe-only 16 MiB: c10 blob 2/2 OK.
- (c) **Phát hiện mới: src flip-flop blob↔http ~10 Hz trong app
  thật** (vite preview + bridge 8787, vá
  `HTMLMediaElement.prototype.src`): lần phát đầu dùng **blob 3/3**;
  29 lần đổi src trên cùng element id 7 (run20 — run10/11 không ghi id
  element nên chứng minh "cùng element" chỉ chắc ở run20); video vẫn
  phát được, 0 error; **phát lại sau pause dùng http** (blob cache
  không dùng khi ct≠0). Nợ mới ưu tiên vòng sau: khóa flip-flop src
  trong `videoFor`.
- (d) **Error handler — nợ P5 ĐÃ ĐÓNG:** bad.mp4 → blob → error → src
  về http **5/5**; play lại trên fallback **192 frame, ct=8, 2/2**.
- Đính chính số (S9 §3.2, đã bổ sung vào LIMITS S3): blobReadyMs
  "25 lần, median 250 ms" không tái lập được (đếm lại: n=17 median
  318; n=32 median 190,5; n=41 median 189; max 1419 khớp) — **đừng
  trích "median 250 ms"**; appswap JSON có **10 case, không phải 8**.
- Kiểm chứng: tsc 0; vite build pass (6,52 s); unit
  `media.blobPrefetch90R3.test.ts` **19/19**.
- Sự cố: edit thêm retry-play vô tình xóa lệnh `v.play()` gốc → **16
  case nhiễm** 18:02–18:12 (index 37–52) — đã loại khỏi mọi kết luận,
  chạy lại toàn bộ bằng run10–12 hợp lệ.
- Server scratch S3 dựng (bridge 8787 + vite 4173): parent kiểm tra ở
  closing — **đã tắt** (không còn process/port nào lắng nghe).
- Chi tiết: `docs/PHASE9_ROUND91_S3_CLIPD_BITRATE_LIMITS.md` (+ bổ sung
  parent cuối file).

### S4 — Fallback warn mở rộng (nợ đợt 90 §4 mục 4: ĐÃ ĐÓNG, test-only)
- (a) Image clip + mask keyframes đo riêng, giống hệt video: mask_anim
  fail → PNG t=0, không warn site, tâm tĩnh 0.3, **MAD=0,000**; cả 2
  helper fail → geq t=0, warn site `mask keyframes: không vẽ được video
  mask` có mặt, tâm tĩnh 0.3, **MAD=0,000**; hồi quy không shim: không
  warn nào, video `.mkv` chạy thật, tâm 0.35/0.5/0.65 theo keyframes.
- (b) Warn geq-mode cho `--mask-mode trackgeq` không track — test
  riêng: warn đúng chữ `--mask-mode trackgeq không chạy keyframes`,
  không warn helper-fail, không `.mkv`, tâm tĩnh 0.3, **MAD=0,000**;
  nhánh đối xứng (có track + trackgeq): track lái mask đúng
  0.425/0.5/0.575, **không warn nào**.
- (c) Warn site in lặp theo số đoạn — kiểm tra hành vi thật, **KHÔNG
  cần sửa:** layer cắt clip keyframes → job **FAIL exit 1**, đúng thông
  điệp cổng fail fast, **0 warn**, không ra MP4 (chết trước khi dựng
  graph nên warn không thể lặp); layer bao trọn clip → warn xuất hiện
  **đúng 1 lần** (đếm regex trên stderr), **MAD=0,000**; mask tĩnh bị
  cắt 3 đoạn → render OK, 0 warn.
- Kiểm chứng: test mới `test_round91_s4_fallback_warn_ext.js`
  **60/60**; P1 chạy lại **30/30**; tsc web 0; vite build PASS 20.87s.
  Không sửa production.
- Đề xuất nhỏ (không tự làm trong luồng test-only): pre-pass vẫn vẽ
  video mask ~10s trước khi cổng fail fast ném lỗi ở S4-F — dời cổng
  lên trước pre-pass nếu muốn fail nhanh hơn.
- Chi tiết: `docs/PHASE9_ROUND91_S4_FALLBACK_WARN_EXT_LIMITS.md`.

### S5 — i18n văn bản (nợ đợt 90 §4 mục 5: ĐÃ ĐÓNG)
- (a) TrackPanel hardcode: thêm key mới `motionTrack.title` vào dict
  vi/en, `TrackPanel.tsx:140` dùng `{t("motionTrack.title")}`; vi:
  "🎯 Theo dõi chuyển động", en: "🎯 Motion tracking" (giữ nguyên chuỗi
  EN cũ).
- (b) MaskPanel tham chiếu lặp: xóa fragment JSX ở `MaskPanel.tsx:104`
  (`— xem <code>…MASK_LIMITS.md</code>.`) — template
  `mask.tipUnsupported` đã có sẵn tham chiếu đó nên UI trước đây hiện 2
  lần + từ "xem" không dịch ở locale EN. Không đổi dict.
- Bump pin **2516 → 2517 ở toàn bộ 17 file test pin số key** (chỉ sửa
  dòng assert/tên test; comment lịch sử được nối thêm thay vì viết đè).
  Quét lại toàn cây: không còn `2516` nào ngoài tham chiếu lịch sử
  trong comment.
- Dict mới: **vi = en = 2517 key lá**, cùng tập key, 0 key mồ côi, 0
  giá trị rỗng (đếm lại trực tiếp từ đĩa).
- Test xanh trên cây lúc S5 xong: i18nOrphans 16/16, Audit P7 8/8,
  Sweep I9 16/16, Modals G9 9/9, Modals H7 13/13, ProjectMenu 6/6 +
  11 test pin còn lại xanh hết; test_validate_codes 1596/1596,
  validateCodes63R9 53/53; tsc web 0; vite build PASS 28.31s.
- Nợ còn lại ngoài brief: `StickerPanel.tsx:192` (`🌟 Sticker`
  hardcode) vẫn còn — nếu dọn cần thêm `sticker.title` + bump pin
  2517 → 2518 ở đúng 17 file trên.
- Chi tiết: `docs/PHASE9_ROUND91_S5_I18N_TEXT_LIMITS.md`.

### S6 — G1 evidence vòng 3 (nợ đợt 90 §4 mục 6: BẰNG CHỨNG MỚI, KHÔNG tự đóng)
- **60fps: n=14, median 0,970×, mean 0,991, CI 95% [0,875; 1,108],
  PASS 12/14 (86%)** — cả ba tiêu chí chặt vẫn đạt, biên dày hơn R6
  (9/11 = 82%; nay cần 2 FAIL mới rơi dưới 80%). Cửa sổ 5 mới nhất
  median 1,19, 5/5 PASS luật (b) lần thứ hai liên tiếp.
- **Lần yên 60fps ĐẦU TIÊN: run3 baseline 19,01 fps, 0,99× PASS
  (n=1)** — gợi ý, chưa đủ kết luận; nửa sau phiên đã trượt về tải.
- **30fps: n=30, median 0,935×, mean 0,940, CI [0,857; 1,023], PASS
  24/30 (80% — đúng vạch, mỏng hơn R6)**. Tải 30fps 23/26 (88%); yên
  30fps n=4 không đổi (25%).
- 5 lần đo mới: E1 run1 0,73× FAIL (2 slot đầu phiên đóng băng 0,00
  fps) / run2 1,05× PASS; 60fps 1,19 / 1,33 / 0,99 — cả 3 đều 4/4
  cases. D1 MAD 0,3835 giống hệt 3/3 lần; pixel E1 giống hệt N5/Q7/R6.
  Không dấu EPERM trong log 5 lần đo; H9/C3 0 lỗi trang; playhead
  không slot nào ≥1,3×.
- (b) Sửa xong chuỗi chẩn đoán cũ ở `probe-78f1-tick-time.mjs` +
  `probe-79g1-tick-time.mjs` thành chẩn đoán EPERM-vs-port như R6
  (`node --check` OK cả 2).
- (c) Nhánh port-conflict của E1 **đã kích hoạt bằng fail thật**:
  fault-injection dummy server giữ :5580 → exit 2, chẩn đoán "cổng
  bị chiếm" đúng (qua nhánh mediaStatus=200). Nhánh EPERM **vẫn chưa
  kích hoạt** bằng fail thật — ghi rõ trong LIMITS. Phát hiện thêm:
  thông báo thân thiện của vite ("Port 5580 is already in use") không
  khớp regex EADDRINUSE hiện tại — chưa sửa, chờ parent quyết.
  try/finally đã chạy, không process mồ côi.
- Test: `node --test deint-fps-verdict-83k3.test.mjs` **12/12**.
- **G1 vẫn chưa đóng.** Phương án A mạnh hơn ở 60fps (86%) nhưng mỏng
  đi ở 30fps (80% đúng vạch); chân yên 60fps mới n=1, chân yên 30fps
  n=4. Chi tiết và điều kiện đóng trong LIMITS §4 — quyết định thuộc
  user.
- Chi tiết: `docs/PHASE9_ROUND91_S6_G1_EVIDENCE3_LIMITS.md`.

### S7 — EPERM probe v2 checklist + quét writeFileSync (nợ đợt 90 §4 mục 8: ĐÃ ĐO XONG)
- Checklist P8 §2.3 chạy ĐÚNG 1 lần: `status` 17:38:54Z báo
  **DEAD/STALE** (heartbeat age 10.057 s, last #9 14:51:17Z, boot
  62b088d2, exit 1); `once` → **probe #10, boot=182a689e (ĐỔI),
  ok=2 fail=0**, exit 0 (dòng `boot changed 62b088d2 -> 182a689e` ghi
  vào log); `status` lại **ALIVE** (age 0 s, n=10), exit 0.
- **Khoảng mù #9 (mới): 14:51:17Z → 17:39:23Z (~168 phút)** — dài thứ
  hai trong lịch sử probe (sau khoảng mù #8, ~187'). Trong đó có **2
  lần reboot ĐÃ XÁC NHẬN**: ~15:28–15:29Z (62b088d2 → 0799d357,
  reboot thứ 8) và **17:24:01Z** (→ 182a689e, reboot thứ 9, boot hiện
  tại). Loop probe v2 chắc chắn đã chết theo reboot 15:29Z (và chết
  lần nữa theo reboot 17:24Z).
- Không tìm thấy bằng chứng sóng EPERM trong các bản ghi còn lại của
  khoảng mù (R4/R5/R6 làm việc tới ~15:11–15:15Z đều ghi rõ không gặp
  sóng; R8 làm tới 15:50Z chỉ ghi ENOSPC + reboot, không EPERM).
  NHƯNG **~87 phút cuối khoảng mù (15:57Z → 17:24Z) hoàn toàn không có
  bản ghi nào** — không thể kết luận "không có sóng", chỉ "không có
  bằng chứng". Reboot trung gian khác trong 15:29Z → 17:24Z cũng không
  loại trừ được (journal/wtmp chỉ giữ boot hiện tại).
- Sóng gần nhất vẫn ~11:55–12:11Z (R7). EPERM KHÔNG tuyên bố đã hết.
  Reboot: 9 lần/~21h (từ ~20:18Z 10/11), trung bình ~2h20'/lần.
- Quét writeFileSync với **danh sách loại trừ chuẩn mới** (loại
  `release*/**` + `build/**` ở mọi cấp — parent chốt đợt 90 mục 7):
  **169 dòng trong 61 file** — source thật **88** (+2 so với R7, đều
  là harness đo một lần mới của đợt 90), mẫu trong docs **81** (+13,
  toàn LIMITS đợt 90 mới). Đối chiếu phương pháp R7 cũ: 11.847 file,
  194 dòng (source 88, release copy 22, build copy 3, docs 81); delta
  9.390 file = 9.224 dưới apps/desktop/build + 166 dưới
  apps/desktop/release*. Async `fs.writeFile(` production: **0** ngoài
  helper (hit duy nhất là `epermRetry.js:116` — chính lệnh ghi của
  helper). **Không còn đường ghi production nào chưa nối helper.**
- Lỗi phương pháp lúc đầu: lần quét đầu đếm 0 dòng vì grep -c nhầm vào
  file danh sách thay vì các file trong danh sách; đã chạy lại đúng
  bằng xargs -0 grep -c và đối chiếu hai phạm vi.
- Đề xuất cron riêng 10 phút vẫn CHỜ parent/user quyết.
- Chi tiết: `docs/PHASE9_ROUND91_S7_EPERM_PROBE_LIMITS.md`.

### S8 — Birefnet cửa sổ yên (nợ đợt 90 §4 mục 7: KHÔNG ĐỦ ĐIỀU KIỆN, KHÔNG CHẠY)
- `free -m` lúc bắt đầu: available **535 MB** (tổng 7934 MB, VM 4
  vCPU, uptime chỉ 14 phút — VM vừa reboot ~17:24Z). 10 mẫu
  MemAvailable cách nhau 30s trong 5 phút: 533 / 568 / 554 / 627 / 538
  / 1270 / 983 / **1629** / 1378 / 853 MB — trung vị 740 MB, cao nhất
  **1629 MB = 26,5% ngưỡng 6144 MB**. Load 0,76–2,35; swap đã dùng
  279–404 MB.
- Quyết định theo đúng điều kiện nhiệm vụ: **KHÔNG chạy
  birefnet-general trong gói** (cần ≥ 6 GB duy trì ~7 phút; đỉnh quan
  sát chưa tới 1/3 ngưỡng). Không ép bằng `--no-ram-guard`. Đây là kết
  quả hợp lệ — không có frame/thời gian/RSS để ghi vì không chạy.
- **Birefnet-general vẫn 0 lần chạy thành công trong gói** — nợ còn
  mở, cần máy nhiều RAM hoặc lượt VM gần như trống.
- RAM guard P7 kiểm tra lại, vẫn chặn đúng khi RAM thấp (3 lớp): code
  guard trong AppImage Q9 giống hệt source repo
  (`server/bgremove/bgremove.py`, diff dòng 40–100 identical; ngưỡng
  `DEFAULT_MIN_RAM_MB = 6144`); quyết định live bằng code trong gói,
  RAM thật 1372 MB → `fallback` cho birefnet-general; đối chứng 6500
  MB → `allow`; u2net → `allow`. Unit test guard repo
  `test_bgremove_ramguard.py`: **8/8 pass, 0 fail**. Không chạy lại job
  e2e u2net đầy đủ: R5 đã làm 15:03Z 11/11 trên cùng AppImage + cùng
  code guard; chạy lại chỉ lặp kết quả đã biết.
- AppImage Q9 verify lại: 557.008.461 byte, sha `9680cef1…` khớp R5.
  `apps/desktop/release/` và `release-round55-l4/` chứa AppImage cũ hơn
  (576.688.128 / 576.688.069 byte, bản K7).
- Chi tiết: `docs/PHASE9_ROUND91_S8_BIREFNET_WINDOW_LIMITS.md`.

### S9 — Kiểm chứng độc lập S1–S6 (ĐÃ XONG — cả 6 luồng XÁC NHẬN, 1 hồi quy đã sửa ở closing)
- S1: assert A–E chạy lại **100/100, exit 0**; unit previewEngine
  20/20; O8 21/21 cả 2 engine (S9 tự chạy).
- S2: unit 25/25 + previewLoop50F2 20/20 + seek 20/20 +
  seekSkipRender 9/9 chạy lại xanh; JSON sau sửa khớp LIMITS (0,454/
  0,306 tải; 0,548/0,204 yên); probe WebKit S9 tự chạy (phase riêng):
  **0 re-seek**, stall 307 ms giữ playhead +0,000 s, VERDICT PASS; O8
  21/21 cả 2 engine (S9 chạy thay).
- S3: đếm lại JSON khớp từng số (load-play, LOOP 0/8 vs 8/8, ERR 5/5,
  flip-flop xác nhận run20: 29 lần đổi src); unit 19/19 chạy lại. 4
  lưu ý trình bày (GST run2/run3, blobReadyMs, appswap 10 case, số
  batch đầu) — parent đã bổ sung vào LIMITS S3 ở closing.
- S4: test mới chạy lại **60/60, exit 0**; P1 chạy lại **30/30**;
  `render.js` không đổi trong đợt 91.
- S5: dict đếm lại **2517/2517**; TrackPanel/MaskPanel đúng như claim;
  chạy lại đủ 17 test pin + validateCodes 1596/1596: 16/17 xanh, nhưng
  **Audit P7 7/8** — literal console tiếng Việt mới của S1 ở
  `preview.tsx:1112` (thêm lúc 18:02, sau khi S5 xong). Console-only,
  không phải UI.
- S6: deint test 12/12; report JSON khớp; script gộp pool chạy lại khớp
  (30fps 24/30 = 80% đúng vạch; 60fps 12/14 = 86%); md5 harness khớp.
  **G1 vẫn CHƯA ĐÓNG** (S6 không tự đóng — đúng).
- Hồi quy chéo cây cuối (S9 tự chạy): tsc web 0, desktop 0; vite build
  PASS 6,24s; O2 render **25/25**; O8 Chromium **21/21** + WebKit
  **21/21**. Marker S1 + S2 cùng tồn tại trong `preview.tsx`. S9 không
  sửa production.
- Verify read-back toàn bộ batch đợt 91 lúc S9 chạy: **49 entry / 8
  file, 0 thiếu, 0 binary, 0 workflow** (chưa có S7 lúc đó).
- Chi tiết: `docs/PHASE9_ROUND91_S9_VERIFY_LIMITS.md`.

## 2. Kiểm chứng parent (cây đã gộp, lượt cron 00:35 +07 12/11)

- **Xung đột file chung:** `preview.tsx` bị S1 (rVFC) và S2 (playhead
  hold) cùng sửa — kiểm tra trực tiếp qua S9: cả 2 nhóm marker đều có
  mặt (12 match S1 + 12 match S2), không ghi đè nhau. Không có file
  nào khác bị 2 luồng cùng sửa.
- **Hồi quy P7 7/8 — parent đã sửa ở closing:** S1 thêm literal tiếng
  Việt trong `console.error` ở `preview.tsx:1112` (sau khi S5 xong).
  Quyết định parent: **đổi message sang tiếng Anh** (console-only
  diagnostic, không phải UI; không thêm key i18n cho console, không nới
  lỏng test — test P7 cấm sửa test cho xanh bằng cách nới lỏng).
  Đổi thành `"[preview] rVFC motion blur error, falling back to tick
  snapshots:"`. Chạy lại Audit P7 sau sửa: **8/8 pass** (scan: 524
  literal trong 36 file; 4 TRKEY-MISMATCH benign có sẵn).
- tsc web **0 lỗi**; tsc desktop **0 lỗi**; vite build **PASS** (6,28s,
  parent chạy lại sau khi sửa literal — khớp S9: 6,24s).
- Rely vào kiểm chứng độc lập S9 cho phần chạy lại test (S9 đã chạy lại
  toàn bộ trên cây cuối 18:52–19:20Z, sau lần sửa file cuối cùng của
  các luồng — trừ literal P7 parent sửa sau đó, đã chạy lại P7 + tsc +
  vite build ở trên).
- **EPERM probe:** probe #10 ok=2 fail=0 (S7, 17:39:23Z); khoảng mù #9
  ~168 phút với 2 reboot đã xác nhận; 87 phút cuối khoảng mù không có
  bản ghi nào — không kết luận được về sóng. Loop probe v2 vẫn CHƯA
  start lại (chờ user quyết cron 10 phút).
- Server scratch S3 (bridge 8787 + vite 4173) và vite 5173 của S1:
  parent kiểm tra ở closing — **đã tắt** (không còn process/port nào),
  không cần dọn thêm.

## 3. Quyết định parent

1. **Motion blur preview rVFC: ĐÃ ĐÓNG** (S1) — pump rVFC hoạt động
   đúng, assert A–E 100/100, spread 29.1 → 0.0. Nợ còn lại: chi phí
   tick main-thread (blocker tiếp theo), WebKitGTK rVFC chưa đo pixel,
   render canonical D/E, watchdog chưa kích hoạt thật.
2. **Playhead/canvas sawtooth: ĐÃ ĐÓNG** (S2) — nguyên nhân resume-stall
   đã tìm ra và sửa bằng grace 1500 ms; re-seek 0/0. Nợ còn lại: lag
   đỉnh do canvas stale dưới tải; stall > 1500 ms trả về hành vi cũ.
3. **WebKit clip D: ĐÃ ĐO XONG, KHÔNG đầu tư thêm vào blob prefetch**
   (S3) — không có cliff theo kích thước; fail ở tầng swap pipeline
   WebKit. **Nợ mới ưu tiên đợt 92: khóa flip-flop src blob↔http
   trong `videoFor`** (phát hiện S3, đã xác nhận S9).
4. **Fallback warn: ĐÃ ĐÓNG** (S4) — cả 3 mục test-only, không sửa
   production. Đề xuất dời cổng fail-fast lên trước pre-pass để đợt sau.
5. **i18n văn bản: ĐÃ ĐÓNG** (S5) — dict **2517 key**. Literal P7 do S1
   gây ra đã sửa ở closing (đổi sang tiếng Anh, P7 lại 8/8).
6. **G1: vẫn MỞ.** Không tự đóng trong phiên nền — bằng chứng S6
   (60fps 12/14 = 86%, 30fps 24/30 = 80% đúng vạch) + R6/N5/Q7 để user
   quyết theo phương án A có điều kiện.
7. **Birefnet: vẫn 0 lần chạy thành công trong gói** (S8 — RAM không đủ
   cửa sổ yên; không ép). RAM guard vẫn chặn đúng.
8. **Cron riêng 10 phút cho probe EPERM: KHÔNG tự tạo** — chờ user
   quyết (khoảng mù #9 dài 168 phút với 87 phút không bản ghi nào là
   bằng chứng mạnh nhất cho đề xuất này).
9. **StickerPanel hardcode `🌟 Sticker`: để đợt 92** (cần key mới +
   bump 2517 → 2518).

## 4. Nợ mở cho đợt 92 (12 mục)

1. **WebKit clip D — flip-flop src (ƯU TIÊN):** khóa flip-flop
   blob↔http ~10 Hz trong `videoFor` (S3 §7, đã xác nhận S9); đo lại
   phát lại sau pause (hiện dùng http, blob cache không dùng khi
   ct≠0); xem flip-flop có liên quan tới blob fail rải rác không.
2. **Motion blur preview:** chi phí tick main-thread — blocker tiếp
   theo của rVFC (S1 §4: rVFC chỉ capture ~1/3 frame dưới tải vì main
   thread bận xử lý mask CPU); WebKitGTK rVFC chưa đo bằng pixel;
   render canonical D/E; watchdog/fallback chưa kích hoạt thật;
   E w50 +5px vs B chưa giải thích.
3. **Playhead/canvas:** lag đỉnh còn do canvas stale dưới tải (S2
   §5); stall > 1500 ms trả về hành vi cũ; số đo seek chỉ cho clip
   GOP 250.
4. **Fallback warn:** dời cổng fail-fast lên trước pre-pass (S4 đề
   xuất — pre-pass vẫn vẽ video mask ~10s trước khi cổng ném lỗi).
5. **i18n văn bản:** StickerPanel hardcode `🌟 Sticker` (thêm
   `sticker.title` + bump 2517 → 2518 ở 17 file pin).
6. **G1:** quyết định đóng/mở thuộc user (S6 §4); chân yên 60fps mới
   n=1, chân yên 30fps n=4; nhánh EPERM của E1 vẫn chưa kích hoạt bằng
   fail thật; thông báo vite "Port 5580 is already in use" không khớp
   regex EADDRINUSE — chưa sửa, chờ parent quyết.
7. **Birefnet-general 1 lần chạy thành công trong gói** — vẫn 0 lần;
   cần cửa sổ yên ≥ 6 GB ~7 phút hoặc máy nhiều RAM (S8). Không ép
   chạy khi RAM không đủ.
8. **EPERM probe:** loop v2 chết theo reboot 17:24Z; cần quyết cron
   riêng 10 phút (chờ user). Khoảng mù #9 dài 168 phút, 87 phút cuối
   không có bản ghi nào — không kết luận được về sóng. Reboot 9
   lần/~21h.
9. **TTS 39: CẤM kiểm lại** (nợ cũ, giữ nguyên — không đụng).
10. **ci-security 403** — workflow file vẫn chưa lên được GitHub; chờ
    user (kiểm tra quyền Workflows / gỡ-cài lại App / tự thêm qua web).
11. **Môi trường:** dep WebKit mất sau mỗi reboot (đường vòng
    `dpkg-deb -x` + `cp -an`, debroot giữ trong
    `~/workspace/tmp-q6r3-debroot` cho lần sau); /tmp có thể đầy
    (ENOSPC đã giết test R4 lần 1 đợt 90 — dọn debroot stale trước khi
    chạy render nặng); Xvfb cần retry chặt sau mỗi reboot; trạng thái
    quan trọng chỉ để trong ~/workspace, không để /tmp hay /usr.
12. **Harness O8/Q5:** nhãn kỳ vọng S7 lẫn hệ tọa độ (Q5 §6 mục 4, mỹ
    phẩm); test timing Q5 có thể flake dưới tải cực nặng (Q5 §6 mục 5);
    số đo seek chỉ cho clip GOP 250.

## 5. Batch đã stage (KHÔNG push)

- Đợt 91: 9 luồng, **50 entry / 9 file** (S1 7, S2 8, S3 5, S4 2,
  S5 22, S6 3, S7 1, S8 1, S9 1) + closing 3 entry (LIMITS gộp này +
  `PHASE9_GAP_ANALYSIS.md` §20 + `cssClasses60Q2.test.ts` — parent sửa
  ở closing: S5 thêm key `motionTrack.title` vào TrackPanel mà quên
  bump danh sách pin css60 §8, parent thêm key + bump 13 → 14 call site).
- **Tổng chờ push sau đợt 91: 2071 entry / 252 file batch / 1245 file
  duy nhất** (đợt 67–90: 2018/242/1223; đợt 91: 50/9 — 50 entry nhưng
  chỉ +21 file duy nhất vì 29 entry trùng file đã stage đợt trước;
  closing: +3 entry / +1 file batch / +1 file duy nhất — LIMITS gộp
  mới; gap analysis đã stage từ các đợt trước; css60 đã stage từ trước.
  Đếm lại trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.
