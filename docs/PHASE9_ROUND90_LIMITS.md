# PHASE9 ROUND90 — LIMITS GỘP (đợt 90, lượt cron 21:35 +07 11/11/2026)

> Chủ đề lớn: **preview playback correctness** — motion blur + mask ở preview (Q2 §7.1),
> playhead/canvas sync sau seek (Q5 §6), WebKit clip D blob prefetch (Q6 §6.1),
> fallback warn site keyframes (Q4 obs), AppImage mới smoke/orphan (Q9 §6),
> G1 evidence vòng 2, EPERM probe, kiểm chứng độc lập, i18n sweep — 9 luồng R1–R9,
> tất cả đều về.
> KHÔNG push. KHÔNG release/tag. HEAD vẫn 5f548ef8.
> **Lưu ý vận hành:** R2 và R8 hoàn thành trên đĩa (log + LIMITS + batch đầy đủ) nhưng
> handoff kết thúc của chúng không tới được parent trong lượt này — parent đọc trực
> tiếp từ đĩa theo skill verify_delegated_work và gộp như bình thường, không kết luận
> missing khi chưa kiểm tra đĩa. **VM reboot ~15:29Z** (boot 62b088d2 → 0799d357)
> giữa lượt: /tmp bị wipe, dep GStreamer mất; R1/R3 khôi phục và chạy lại từ đầu.

## 1. Kết quả từng luồng

### R1 — Motion blur + mask ở preview: sửa theo hướng (iii) (nợ đợt 89 §4 mục 1: ĐÃ ĐÓNG)
- Implement trong `preview.tsx` + `previewEngine.ts`: `rawUnitSource` (unit thô, canvas
  riêng), `compositeMotionBlurLayer` (tách từ `drawMotionBlurBlended`), gate snapshot
  theo **frame video** (`videoFrameIndex`, bỏ tick trùng frame, reset ring khi seek/loop
  nhảy lùi — reset TRƯỚC blend để không blend bóng cũ 1 khung sau seek), nhánh mask
  **blend unit thô rồi áp mask 1 lần sau blend**; transform SR dời ra khỏi painter
  (mask trong không gian chưa transform, đúng render).
- Đo bằng pixel thật (harness mới `probe90r1-motionblur-preview.cdp.mjs`, `--assert`):
  **trail = 0 trên tất cả 383 khung play** (A 84 + B 98 + C 201; trước sửa vệt 12–16px,
  tới 145px dưới tải); mép sắc như pause (median 1.2–2.1px; pause 1.1–2.6px; render
  0.8–1.9px); tâm bám track ±0.001; **blur nội dung là thật** (gStd play median B/C
  37–83 vs baseline pause ~112, giảm 26–67%; render B 43–96; A giữ ~111.8 — nguồn tĩnh
  nên blur = identity, render MAD = 0.0).
- Kiểm chứng: assert preview A/B/C PASS toàn bộ (3 pass/case); unit previewEngine 17/17,
  ghostBlend 15/15, maskTrack 22/22, maskKeyframes 14/14, O4 37/37; tsc web 0; vite build
  PASS (12.91s); **click-test O8: Chromium 21/21, WebKit 21/21**.
- Nợ còn lại (LIMITS §5): gStd phụ thuộc khoảng cách tick (hướng triệt để:
  `requestVideoFrameCallback` — để vòng sau); mép phải max 3.6px ở khung lẻ của A/C;
  combo mask+SR+blur và mask+feather>0+blur chưa đo bằng pixel; stall/restart decoder
  ở case C là hành vi sẵn có của syncMedia/MediaPool, không do sửa này.
- Chi tiết: `docs/PHASE9_ROUND90_R1_MOTIONBLUR_PREVIEW_FIX_LIMITS.md`.

### R2 — Playhead chạy trước canvas lúc phát sau seek (nợ đợt 89 §4 mục 2: ĐÃ ĐÓNG)
- Đóng băng playhead trong lúc phát sau seek: vòng lặp phát không tăng playhead (và không
  tích lũy dt) khi tick trước báo clip video xuôi đang seeking (cờ N3) **hoặc** ở đúng
  tick bấm play (cạnh lên forceSeek — phát hiện khi đo lại: tick bấm play tăng trọn dt
  ~170ms = 5 frame trước khi syncMedia kịp forceSeek). Trong lúc giữ, `syncMedia` pause
  mọi active xuôi để audio không chạy trước; trần giữ 15s + latch chống đóng băng vĩnh
  viễn khi seek kẹt. File mới `lib/playheadHold90R2.ts` (+ test 14/14).
- Số đo trước → sau (probe `probe90r2-playhead-canvas-sync.mjs`, kịch bản
  setPlayhead(0.5)+phát sau pause-seek t=5): playhead lúc seek xong 0.6/1.1/1.4/4.1
  → **0.5 cả 4 biến thể** (Chromium, Chromium+tải, WebKit, WebKit+tải); lag ổn định
  0.20/1.53/2.69/2.92 → **0.13/0.18/0.46/0.68s**. Cả 4 biến thể PASS cả 2 chỉ tiêu.
- Kiểm chứng: tsc web 0; vite build pass; playheadHold 14/14; seek.test.ts 20/20;
  suite liên quan xanh (seekSkipRender 9/9, pacing L2 10, J5 5/5, K9 11/11, L6 12/12,
  reverse L2 17/17); **click-test O8 sau sửa: Chromium 21/21, WebKit 21/21**
  (S5(a2): Chromium blob 0.4419 vs kỳ vọng 0.4416; WebKit 0.3982 vs 0.3981).
- Lưu ý trung thực (R2 §5.6 + R8): so sánh lag tuyệt đối trước/sau **không cân tải**
  (baseline loadavg tới 22.41, fixed ~1) — chỉ tiêu chính (playhead = 0.5 lúc seek xong
  và lúc canvas đổi, vượt 0 frame) là hành vi giữ/không-giữ, không phụ thuộc tải.
  Sawtooth dư ~0.5–0.8s trên WebKit dưới tải còn lại (độ trễ resume decode sau seek,
  cũng có ở baseline).
- Chi tiết: `docs/PHASE9_ROUND90_R2_PLAYHEAD_CANVAS_SYNC_LIMITS.md`.

### R3 — WebKit clip D: prefetch blob cho clip proxy/HTTP nhỏ (nợ đợt 89 §4 mục 3: ĐÃ ĐÓNG)
- Implement trong `MediaPool.videoFor()` (`apps/web/src/media.ts`) — điểm duy nhất gán
  `proxyUrl` vào `src` video preview: fetch toàn bộ clip proxy/HTTP nhỏ → blob URL →
  gán `src`; chỉ swap khi element còn sạch (paused, currentTime 0, không seeking); thu
  hồi blob khi source đổi / blob lỗi / vượt cap tổng 64 MiB (FIFO) / `revokeBlobPrefetch()`;
  fallback về URL gốc khi fetch lỗi, quá ngưỡng, timeout 30s, máy yếu (`deviceMemory < 1`);
  size chưa biết thì stream có kẹp (abort khi vượt ngưỡng).
- Validate trên WebKit thật (WebKitGTK 27.2, Xvfb :199): **clip D 1.3 MB: loop 8/8 pass**
  (P1 6/6 + P2 2/2, 0 stall) vs baseline progressive **1/3** cùng boot (Q6: 0/5).
  Blob sẵn sau 70–895ms (median 182ms).
- **Ngưỡng chốt 8 MiB** (không phải 16 MiB như đề xuất ban đầu): blob 10.2 MB bitrate thực
  tế chỉ load được 2/3; loop clip noise 10.8 MB 0/4, 14.3 MB 0/2 — nhưng chính clip đó
  qua progressive cũng fail 1/3 nên không kết luận blob gây lỗi. Proxy > ~32s (720p CRF 23)
  fallback về progressive như cũ — không hồi quy. Quá ngưỡng 35 MB skipped (P4 1/2, như
  baseline); 404 skipped, không crash/hang (P5).
- Hậu nghiệm câu hỏi mở Q6 §6.4: JSON Q6 không chứa dữ liệu `buffered` (0/27 case) — trả
  lời bằng số mới: buffered đầy mà vẫn fail **7/20 run** → `buffered.end(0) >= duration`
  **không** dự đoán pass, không dùng làm gate.
- Kiểm chứng: unit test mới **19/19** (bắt được 1 bug thật: thiếu guard `blobSkipped` →
  fetch storm khi `videoFor` gọi mỗi frame); hồi quy `webkitLoopRestart80H5` PASS,
  `webkitRestartTrace85M4` PASS, `seek.test.ts` 20 passed; tsc web 0; vite build pass.
- Môi trường: VM reboot ~15:29Z giữa lượt — /tmp mất hết, GStreamer 0 plugin; khôi phục
  bằng `dpkg-deb -x` 170 .deb cache ra `~/workspace/tmp-q6r3-debroot` (413 MB, **giữ lại
  trong workspace** cho lần reboot sau), sinh lại clip (d.mp4 byte-identical).
- Nợ còn lại (LIMITS §6): P5 chưa chứng minh error handler đã đổi `src` về `item.url`
  trong probe (chỉ unit test khóa phần đó); khoảng 1.3–10 MB chưa có điểm đo bitrate thực
  tế; blob-load fail ở file lớn chưa chẩn đoán tầng; swap-trượt trong app thật chưa đo.
- Chi tiết: `docs/PHASE9_ROUND90_R3_WEBKIT_CLIPD_BLOB_PREFETCH_LIMITS.md`.

### R4 — Fallback warn cấp site cho keyframes (nợ đợt 89 §4 mục 4: ĐÃ ĐÓNG)
- Sửa production `server/render/src/render.js`, nhánh keyframes trong `maskChainForSite`:
  quan sát 1 — thêm warn cấp site khi cả 2 helper đều fail → geq tĩnh t=0, mirror đúng
  mẫu nhánh tracked; quan sát 2 — mode geq/trackgeq (pre-pass bị bỏ qua theo thiết kế)
  nay warn rõ thay vì lặng lẽ. Quyết định thiết kế: tầng PNG fallback KHÔNG có warn
  site — đúng mirror tracked; warn site chỉ dành cho tầng cuối geq.
- Test mới `test_round90_r4_fallback_warn_keyframes.js` (5 mảng R4-A/B/C/D/E):
  **49/49 pass, 0 fail** — MAD = **0.000** ở cả 4 cặp đối chiếu; tâm mask tĩnh 0.3 đúng
  mọi thời điểm; R4-C hồi quy **không warn nào**, keyframes chạy thật 0.35/0.5/0.65, có
  `.mkv`. P1 chạy lại **30/30**; Q4 spot-check `D4,GEQ` **46/46** (GEQ-B giữ đúng các
  assert absence dù warn geq-mode mới xuất hiện).
- Nợ còn lại (LIMITS §3): image clip + mask keyframes chưa đo riêng; warn geq-mode cho
  `--mask-mode trackgeq` không track chưa có test riêng; warn site in lặp theo số đoạn
  nếu clip bị adjustment layer tách (cùng hành vi nhánh tracked).
- Chi tiết: `docs/PHASE9_ROUND90_R4_FALLBACK_WARN_KEYFRAMES_LIMITS.md`.

### R5 — AppImage mới: smoke + orphan + click-test trong gói (nợ đợt 89 §4 mục 5: ĐÃ ĐÓNG)
- AppImage mới đợt 89 Q9 (557.008.461 byte, sha 9680cef1… — verify khớp trước khi test;
  không build lại, không đè K7).
- **Smoke + orphan: PASS 2/2 lần** (`package-ship --profile full --skip-build`, cả hai
  ALL GREEN, exit 0): verify-packaged-tree PASS (đủ 4 venv, Python 3.12.3); probe AI
  **8/8 available:true** cả hai lần; smoke PASS (textLen 4171, `bridgeFromRenderer:"ok"`);
  orphan PASS cả hai lần (bridge cũ chết → mới healthy).
- **Click-test gói thật: 8/8 PASS ngay lần 1**: K1 CDP sau 87s (chậm do tải VM, không phải
  lỗi gói); **K7 export MP4 qua UI PASS ngay lần 1** — dialog GTK 1124x822, TYPED_OK,
  SAVE_CLICK, job done sau 39s, download + đích native đều 484.316 byte, duration
  8.000000s; K8 thoát sạch. Không cần K7b fallback.
- Spot-check u2net bgremove trong gói: PASS (driver e2e Q9): guard chặn birefnet (RAM khả
  dụng 1869 MB < ngưỡng 6144 MB), `sessionUsed=u2net`, HTTP 200 sau 185.8s; MOV
  **1.715.896 byte (bằng đúng byte với Q9)**, 960×540, **17/17 frame**.
- **Birefnet-general vẫn 0 lần chạy thành công trong gói** (max MemAvailable lúc chạy e2e
  chỉ 2340 MB; không có cửa sổ yên ≥ 6 GB).
- Chi tiết: `docs/PHASE9_ROUND90_R5_APPIMAGE_NEW_SMOKE_LIMITS.md`.

### R6 — G1 evidence vòng 2 (nợ đợt 89 §4 mục 6: BẰNG CHỨNG MỚI, KHÔNG tự đóng)
- Sửa harness: E1 bọc toàn bộ `main()` trong try/finally (L3 §7.5 — hết rò vite/chrome/xvfb
  mồ côi); vite spawn qua pipe + đuôi log 4KB trong bộ nhớ (miễn nhiễm EPERM làm file log
  0 byte như Q7); chẩn đoán sau 3 lần thử phân biệt **EPERM** với **port conflict**;
  slot đóng băng ghi kèm G5 + report JSON. K3: `g5MeanFromReport` trả thêm
  `frozenSlots`/`frozenCount`; ghi `k3-verdict-summary.json` bọc try/catch (Q7 crash sau
  khi in verdict vì write này ném EPERM — nay chỉ cảnh báo).
- Kiểm chứng harness: `node --test` **12/12** (11 cũ + 1 mới); `node --check` cả 3 file OK;
  K3 `analyze` trên dữ liệu Q7 tái hiện đúng số đã công bố (median 1.220, CI [1.127; 1.287]);
  **1 lần E1 đầy đủ qua harness mới: 10/10 PASS**. Cảnh báo: G5 lần verify 1.58× bị
  phồng bởi đúng 1 slot (deint 8.40 fps kề baseline sụp 0.97 fps → 4.34×; trung vị 5 tỉ
  lệ chỉ 0.86) — đừng trích 1.58× như tốc độ deint.
- Đo 60fps (probe N10 — K3/E1 hardcode fixture 30fps nên không đo 60fps bằng K3 được):
  **3/3 PASS** (1.13 / 0.81 / 1.26, 4/4 cases mỗi lần, D1 MAD 0.3835 giống hệt 3/3 lần,
  playhead 0.79–1.14× sạch, 0 lỗi trang). **Pool 60fps nay n=11: median 0.940×,
  PASS 9/11 (82%)** — lần đầu cả ba tiêu chí chặt cùng đạt ở 60fps; cửa sổ 5 mới nhất
  median 1.130, 5/5 PASS → luật (b) PASS ỔN ĐỊNH. Nhưng: vượt 80% đúng **1 lần PASS**
  (9/11 = 81.8%), và cả 3 lần mới đều ở tải cực đoan nhất lịch sử 60fps (baseline
  0.75–1.03 fps) — tỉ lệ mất ổn định số học. Pool 30fps: n=28 (0.935 / 23/28 = 82%);
  tải n=24 PASS 22/24 (92%); yên n=4 không đổi.
- Cửa sổ yên: không xuất hiện (đợt thứ 5 liên tiếp).
- **G1 VẪN CHƯA ĐÓNG.** Khuyến nghị: phương án A nay mạnh hơn ở cả hai fixture (tải:
  30fps 92%, 60fps 82%) nhưng vẫn kèm điều kiện (verdict chỉ đúng chế độ tải; ghi rõ
  3 lần R6 là số sóng tải; vượt 80% đúng 1 lần PASS; chân yên vẫn mở riêng). B/C vẫn mở.
- Chi tiết: `docs/PHASE9_ROUND90_R6_G1_EVIDENCE2_LIMITS.md`.

### R7 — EPERM probe v2 checklist + quét writeFileSync (nợ đợt 89 §4 mục 8: ĐÃ ĐO XONG)
- Checklist P8 §2.3: `status` 14:51Z ALIVE (age 411s, n=8, exit 0); `once` → **probe #9,
  boot 62b088d2 (không đổi), ok=2 fail=0**; `status` lại ALIVE (age 0s). Không có lần
  chết/khoảng mù mới kể từ probe #8 (closing đợt 89, 14:44:26Z). Reboot 13:21:06Z là
  lần thứ 7 trong ~17h.
- **Phát hiện mới quan trọng — sóng EPERM ~11:55–12:11Z (~16 phút) đã xảy ra trong khoảng
  mù 11:37:37Z→14:44:26Z**, probe không bắt được vì không có observer. Bằng chứng đọc lại
  từ log thật của 2 luồng sibling đợt 89 (Q1 + Q7): vite build fail 2 lần, `once` fail
  append log 2 lần, verdict script crash khi ghi JSON, chrome crashpad EPERM, shell
  redirect 0-byte lặng, `copy-web-dist` fail 30/30. Đây là **khoảng mù đầu tiên được
  CHỨNG MINH là có chứa sóng** — kết luận "không gặp sóng" của Q8 chỉ đúng cho cửa sổ
  11:37–11:50Z của chính Q8.
- Quét writeFileSync (~15:00Z, 11.831 file): **179 dòng** — source thật 86 (+4 harness đo
  một lần), bundled-server build 3 (giống hệt source), release copy 22, docs 68 mẫu.
  Async `fs.writeFile(` production: **0**. **Không còn đường ghi production nào chưa
  nối helper** (đã verify import `writeFileEpermRetry` ở 6 file mà bản copy release cũ
  còn ghi trực tiếp).
- **Đính chính Q8:** `apps/desktop/release-round55-l4` TỒN TẠI từ 07/11 — Q8 báo 0 dòng do
  phạm vi quét loại `release*`, không phải thư mục bị xoá. Đề xuất parent chốt danh sách
  loại trừ chuẩn (loại cả `release*/**` + `build/**`) để số "code" chỉ còn source thật.
- 0-byte 24h: không file dữ liệu nào mới. Helper tests chạy lại, không sửa: 22/22, 8/8, 11/11.
- Không tự tạo cron 10 phút, không start loop nền (chờ user quyết); sóng mới là bằng chứng
  mạnh nhất cho đề xuất này.
- Chi tiết: `docs/PHASE9_ROUND90_R7_EPERM_PROBE_LIMITS.md`.

### R8 — Kiểm chứng độc lập R1–R4 (ĐÃ XONG — cả 4 luồng XÁC NHẬN)
- R1: assert A/B/C chạy lại **PASS exit 0** (số khớp R1); unit 17/15/22/14/37 chạy lại xanh
  hết; O8 Chromium **21/21** + WebKit **21/21** chạy lại xanh.
- R2: unit 14/14 + seek 20/20 chạy lại xanh; JSON probe cuối khớp LIMITS (0.5/0.5 cả 4
  biến thể; lagAfterMax 4.34 chỉ là số bản pre-a2); marker R2 + R1 cùng tồn tại trong
  preview.tsx, không ghi đè nhau.
- R3: unit 19/19 chạy lại xanh; đếm lại JSON từ đĩa: loop-D 27 case (B0/B8/B16 1/3, P1 6/6,
  P2 2/2, P3a 1/5, P3b 0/2, P4 1/2, P5 0/1) + load 6 case (P6 2/3, B40 3/3) — khớp LIMITS;
  code media.ts đã đọc (ngưỡng 8 MiB, cap 64 MiB, guard blobSkipped có mặt).
- R4: test mới chạy lại **49/49 exit 0** (lần 1 chết vì /tmp đầy 97% — lỗi môi trường, đã
  dọn và chạy lại xanh); P1 **30/30 exit 0**; code render.js đã đọc trực tiếp.
- **Hồi quy chéo cây cuối:** tsc web 0, desktop 0; vite build PASS 6.23s; O2 render **25/25
  exit 0**. Batch 4 luồng verify đủ: R1 6/6, R2 6/6, R3 9/9, R4 3/3 (text, không
  binary/workflow).
- **Không phát hiện lỗi thật nào trong code R1–R4 — không sửa production.** Hai lưu ý:
  (1) so sánh lag R2 trước/sau không cân tải (baseline loadavg tới 22, fixed ~1) — chỉ
  tiêu chính 0.5/0.5 thì không phụ thuộc tải; (2) R9 xong trước R1–R4 nhưng R1–R4 không
  thêm key i18n nào nên dict 2516 vẫn đúng.
- Sự cố môi trường R8 ghi nhận: R4 test lần 1 chết vì /tmp đầy 97% (ENOSPC — /tmp/q6 410M
  debroot stale đợt 89 Q6 + sóng render); đã xoá /tmp/q6, /tmp trống 426M.
- Chi tiết: `docs/PHASE9_ROUND90_R8_VERIFY_LIMITS.md`.

### R9 — i18n sweep (ĐÃ XONG — dict giữ nguyên 2516)
- Dict: vi = en = **2516 key lá**, cùng tập key, 0 key mồ côi (đếm lại trực tiếp từ đĩa
  lúc 21:58 +07; mtime vi/en.json vẫn 08:46 UTC từ đợt 88 P6 — không ai sửa dict trong
  đợt 90).
- R1–R4 chưa thêm key nào nên không có gì để gộp, không bump test pin nào. R9 quét lúc
  R1–R4 chưa hạ cánh — parent xác nhận lại ở closing qua R8: R1–R4 không thêm key i18n
  nào, dict 2516 vẫn đúng, **không cần chạy lại sweep**.
- Kiểm chứng xanh hết trên cây lúc sweep: i18nOrphans 16/16, Audit P7 8/8, Sweep I9 16/16,
  Modals G9 9/9, Modals H7 13/13, ProjectMenu 6/6, test_validate_codes 1596/1596,
  validateCodes63R9 53/53, tsc web 0.
- 2 nợ văn bản có sẵn phát hiện thêm (KHÔNG sửa — cần parent quyết): (1)
  `TrackPanel.tsx:140` tiêu đề `🎯 Motion tracking` hardcode, không có key nào trong dict
  (cùng mẫu `StickerPanel.tsx:192`); sửa cần thêm key + bump pin 2516→2517. (2)
  `MaskPanel.tsx:104` JSX gắn thêm `— xem <code>…MASK_LIMITS.md</code>.` sau template
  `mask.tipUnsupported` vốn đã kết thúc bằng chính tham chiếu đó → UI hiện tham chiếu
  **2 lần**, từ "xem" không dịch ở locale EN; sửa chỉ cần xóa fragment JSX đó.
- Chi tiết: `docs/PHASE9_ROUND90_R9_I18N_SWEEP_LIMITS.md`.

## 2. Kiểm chứng parent (cây đã gộp, lượt cron 21:35)

- **Xung đột file chung:** `preview.tsx` bị R1 (motion blur: 12 match `rawUnitSource`/
  `compositeMotionBlurLayer`/`videoFrameIndex`) và R2 (playhead hold: 10 match
  `playheadHeld`/`__vcutPlayheadHold90R2`) cùng sửa — kiểm tra trực tiếp: cả 2 nhóm
  marker đều có mặt, không ghi đè nhau (R8 đã kiểm tra lúc 15:31Z và ở cây cuối).
  `media.ts` chỉ R3 sửa (ngưỡng 8 MiB có mặt); `render.js` chỉ R4 sửa. Không có file
  nào khác bị 2 luồng cùng sửa.
- **Verify 32/32 file** trong 9 batch luồng đều tồn tại trên đĩa và đúng nội dung đã báo.
- tsc web **0 lỗi**; tsc desktop **0 lỗi**; vite build **PASS** (6.00s, parent chạy lại —
  khớp R8: 6.23s).
- Rely vào kiểm chứng độc lập R8 cho phần chạy lại test (R8 đã chạy lại toàn bộ trên cây
  cuối 15:43–15:48Z, sau lần sửa file cuối cùng 15:39Z — parent không chạy lại trùng):
  R1 assert A/B/C PASS + unit + O8 21/21 cả 2 engine; R2 unit 14/14 + seek 20/20;
  R3 unit 19/19; R4 49/49 + P1 30/30; O2 render 25/25.
- **EPERM probe:** probe #9 ok=2 fail=0 (R7, 14:51Z); closing đợt 89 #8 → #9 không có
  khoảng mù mới. VM reboot ~15:29Z (boot 62b088d2 → 0799d357) là reboot thứ 8 trong
  ~18h — loop probe v2 vẫn CHƯA start lại (chờ user quyết cron 10 phút).

## 3. Quyết định parent

1. **Motion blur + mask preview: ĐÃ ĐÓNG** (R1) — hướng (iii) hoạt động đúng, đo xanh bằng
   pixel thật cả 3 case A/B/C. Nợ còn lại (requestVideoFrameCallback, combo SR/feather +
   blur) để vòng sau.
2. **Playhead/canvas sync: ĐÃ ĐÓNG** (R2) — playhead giữ 0.5 cả 4 biến thể. Sawtooth dư
   WebKit dưới tải (~0.5–0.8s) là độ trễ resume decode, để vòng sau.
3. **WebKit clip D blob prefetch: ĐÃ ĐÓNG** (R3) — clip D 8/8 loop pass, ngưỡng 8 MiB.
   Không đầu tư thêm vào delay/gate hay `load()`/`canplay`.
4. **G1: vẫn MỞ.** Không tự đóng trong phiên nền — bằng chứng R6 (60fps 9/11 = 82%, 30fps
   23/28 = 82%, tải 92%/82%) + N5/Q7 để user quyết theo phương án A có điều kiện.
5. **Cron riêng 10 phút cho probe EPERM: KHÔNG tự tạo** — chờ user quyết (bằng chứng sóng
   trong khoảng mù của R7 làm đề xuất này mạnh hơn).
6. **2 nợ văn bản R9:** để đợt 91 (TrackPanel hardcode + MaskPanel tham chiếu lặp) — nhỏ,
   có hướng sửa rõ, không chặn đợt 90.
7. **Danh sách loại trừ chuẩn cho quét writeFileSync** (R7 đề xuất: loại `release*/**` +
   `build/**`): chốt áp dụng từ đợt 91 để số "code" chỉ còn source thật.

## 4. Nợ mở cho đợt 91 (12 mục)

1. **Motion blur preview:** `requestVideoFrameCallback` để blur khỏi phụ thuộc khoảng cách
   tick (R1 §5 mục 1); đo pixel combo mask+SR+blur và mask+feather>0+blur (R1 §5 mục 3);
   mép phải max 3.6px ở khung lẻ (R1 §5 mục 2).
2. **Playhead/canvas:** sawtooth dư ~0.5–0.8s trên WebKit dưới tải sau seek (R2 §5) — độ trễ
   resume decode; `previewLoop50F2.test.ts` không chạy được bằng strip-types từ trước
   (import không đuôi `.ts`) — không phải hồi quy.
3. **WebKit clip D:** khoảng 1.3–10 MB chưa có điểm đo bitrate thực tế (R3 §6); blob-load
   fail ở file lớn chưa chẩn đoán tầng (cần `GST_DEBUG`); swap-trượt trong app thật chưa đo;
   P5 chưa chứng minh error handler đổi `src` trong probe.
4. **Fallback warn:** image clip + mask keyframes chưa đo riêng (R4 §3); warn geq-mode cho
   `--mask-mode trackgeq` không track chưa có test riêng; warn site in lặp theo số đoạn
   nếu clip bị adjustment layer tách.
5. **i18n văn bản (R9 §4):** TrackPanel hardcode `🎯 Motion tracking` (thêm key + bump
   2516→2517); MaskPanel tham chiếu lặp 2 lần (xóa fragment JSX, không đổi dict).
6. **G1:** quyết định đóng/mở thuộc user (R6 §4); chân yên vẫn mở (n=4, đợt thứ 5 liên tiếp
   không đo được lần yên nào); chẩn đoán EPERM-vs-port + bọc try/finally chưa kích hoạt
   bằng 1 lần vite fail thật; probe tick-time 78f1/79g1 vẫn còn chuỗi "cổng bị chiếm?" cũ.
7. **Birefnet-general 1 lần chạy thành công trong gói** — vẫn 0 lần; cần cửa sổ yên ≥ 6 GB
   ~7 phút hoặc máy nhiều RAM (R5). Không ép chạy khi RAM không đủ.
8. **EPERM probe:** loop v2 chết do reboot ~15:29Z (boot 62b088d2 → 0799d357); cần quyết
   cron riêng 10 phút (chờ user). Sóng EPERM ~11:55–12:11Z đã xảy ra trong khoảng mù —
   khoảng mù đầu tiên được chứng minh là có chứa sóng (R7).
9. **TTS 39: CẤM kiểm lại** (nợ cũ, giữ nguyên — không đụng).
10. **ci-security 403** — workflow file vẫn chưa lên được GitHub; chờ user (kiểm tra quyền
    Workflows / gỡ-cài lại App / tự thêm qua web).
11. **Môi trường:** dep WebKit mất sau mỗi reboot (đường vòng `dpkg-deb -x` + `cp -an`, debroot
    giữ trong `~/workspace/tmp-q6r3-debroot` cho lần sau); /tmp có thể đầy (ENOSPC giết test
    R4 lần 1 — dọn debroot stale trước khi chạy render nặng); Xvfb cần retry chặt sau mỗi
    reboot; trạng thái quan trọng chỉ để trong ~/workspace, không để /tmp hay /usr.
12. **Harness O8/Q5:** nhãn kỳ vọng S7 lẫn hệ tọa độ (Q5 §6 mục 4, mỹ phẩm); test timing Q5
    có thể flake dưới tải cực nặng (Q5 §6 mục 5); số đo seek chỉ cho clip GOP 250.

## 5. Batch đã stage (KHÔNG push)

- Đợt 90: 9 luồng, **32 entry / 9 file** (R1 6, R2 6, R3 9, R4 3, R5 1, R6 4, R7 1, R8 1, R9 1).
- Closing đợt 90: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §19).
- **Tổng chờ push sau đợt 90: 2018 entry / 242 file batch / 1223 file duy nhất**
  (đợt 67–89: 1984/232/1199; đợt 90: 34/10 — 34 entry nhưng chỉ +24 file duy nhất vì
  10 entry là file đã có trong batch đợt trước (preview.tsx, render.js, media.ts,
  tsconfig.json, deint harness ×3, PHASE9_GAP_ANALYSIS.md — đếm lại trực tiếp từ đĩa).
  HEAD vẫn 5f548ef8. KHÔNG push.
- AppImage mới Q9 (557.008.461 byte, sha 9680cef1…) là binary trong
  `~/workspace/tmp-q9-round89-ship/ship-full/` — KHÔNG đưa vào batch push.
