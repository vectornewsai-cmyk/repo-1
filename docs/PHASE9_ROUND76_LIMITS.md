# LIMITS gộp — Phase 9 đợt 76: đóng nợ đợt 75 §4 (11 mục, 9 luồng)

Ngày: 10/11/2026 (lượt cron 00:35 +07 → worker báo cáo 02:31 +07,
nói 6/9 luồng, D4/D8/D9 chưa về — parent kiểm đĩa đính chính).
9 luồng song song D1–D9. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 76: **9/9 luồng xong + stage** (D4/D8/D9 đã stage đủ, worker
> báo cáo sai — xem §1). Parent gộp: không cần bump snapshot (D9 đã
> bump 2413 → 2419). Tổng chờ push sau đợt 76: **540 entry / 96 file batch / 329 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9;
> đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10; đợt 73: 56/10;
> đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10 — xem §3).
> HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 75 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| D1 | §4.1 C5 — TTS 39 + npm audit | **C5 ĐÃ ĐÓNG (viết LIMITS).** TTS **39 CVE Pillow, không đổi** (tập ID y hệt đợt 74 B6: 18 PYSEC + 20 CVE-2026 + 1 GHSA); 4 package Python khác **0 CVE**. npm audit **KHÔNG CÓ SỐ** (403 `policy_denied`; OSV probe chunk 25 pkg, timeout 90 s, **3/3 attempt timeout, 0 byte** — lần fail thứ 6 liên tiếp). | pip-audit 39; OSV probe |
| D2 | §4.2 Hiệu chỉnh luật delta0 | **Luật mới G12: áp d0 khi và chỉ khi `plainMad ≤ 2,5` VÀ `d0std_R ≤ 2,0` VÀ `ratio_R ≤ 1,0`.** G12 đúng **20/20 case** có thể chấm (17 chẩn đoán + 3 post-fix mới); ocean post-fix KHỚP với biên an toàn (Δkurt R 0,14). **Đính chính: luật delta0 KHÔNG nằm trong production** (hiệu chỉnh đo lường trong harness) — không sửa production. | 20/20 case |
| D3 | §4.3 "Ai free" tracker v2 | **ĐÃ TRẢ LỜI: ffmpeg CLI, trên luồng decode — `avcodec_free_context` → teardown pool buffer của decoder (`av_buffer_pool_uninit`), lúc drain/EOF trong khi filter graph chưa xử lý xong frame 148.** Bằng chứng: **7/7 crash dưới tracker v2d** đều có RDI khớp đúng 1 dòng FREE đã log, cùng một backtrace free duy nhất. Không sửa production (giữ filter `copy`). | v2 34/34; v2d 16/16; v2b 21/21+2 (xem §1) |
| D4 | §4.4 FPS deint-only | **CHƯA đóng trọn vẹn — kết quả chia hai.** Chất lượng khử combing ĐẠT và VƯỢT C8 (headed R **0,74 → 0,51**; C8 offscreen 0,74 → 0,54; yadif 0,57), nhưng **FPS deint-only 0,72–0,73× vẫn FAIL ngưỡng 0,75×** (2 lần headed half-res: 0,73× và 0,72×; giữ ngưỡng, KHÔNG nới). Half-res vẫn vượt hẳn đường offscreen C8. | enhancePreview76D4 10/10; headed |
| D5 | §4.5 Gate + slow-start | **Giữ ngưỡng 30.** FN chuẩn mới **1/3 phiên** (S1, slot 0,58 fps) — re-gate **BẮT ĐÚNG (delta 17)**; FP kiểm duyệt mới **2/2 phiên khỏe chết ở re-gate** (delta 27 tải thấp, delta 18 dưới sóng tải) — **3/5 lần re-gate giết phiên từ trước tới nay là giết oan**. Slow-start **+2 s ở cả 3 lần diag** (phạm vi gộp vẫn +2..+20 s). | Gate sessions |
| D6 | §4.6 Nối M4 vào production | **Không cần sửa code — tiền đề nhiệm vụ SAI: M4 đã nối vào production từ đợt 75 C2** (`chrome-resample.mjs:407` đã là `Math.log2(1 / Math.sqrt(sx * sy))` geo-mean; `bilinearPlane2D` đã tính float). Kiểm chứng trên đĩa trước khi sửa. | Kiểm đĩa |
| D7 | §4.7 Birefnet chốt đóng | **VẪN KHÔNG CÓ SỐ — CHỐT ĐÓNG.** Không thử lại hướng nào của A5. Quyết định: không có số birefnet cho đến khi có máy RAM ≥ 12 GB; **u2net là fallback chính thức**. u2net end-to-end **PASS, output giống hệt W1 từng byte** (không hồi quy); fps lần này 0,18 do tải máy (load 4,2–9,2), không phải code đổi. **Ứng viên mới: u2netp** (chạy thật: predict 1,69 s / 3,84 s ở 640×640, RSS 0,50–0,51 GiB). | fallback 7/7; smooth 4/4 |
| D8 | §4.8 (kề) Codec-probe debts | **Xong — race + Escape + timeline badge.** Test **14/14**; sampleLoadMerge mới; Timeline badge; Modal Escape. | codecProbeDebts 14/14 |
| D9 | §4.9 (kề) Preset 4:5 letterbox | **Xong — cảnh báo letterbox + lựa chọn crop khi xuất preset 4:5.** Mặc định giữ `fit` (không cắt hình âm thầm); lựa chọn per-export, persist localStorage; cảnh báo chỉ khi lệch tỉ lệ **> 1%**. Dict **+6 key** `exportPanel.aspectFit*` → **2419**. Test **23/23**. | aspectFit 23/23 |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai — D4/D8/D9 đã stage.** Handoff nói D4/D8/D9
   "chưa giao kết quả → chưa stage batch, chưa có LIMITS/log" — trên
   đĩa có đủ batch (D4 11 entry, D8 8 entry, D9 27 entry), LIMITS doc,
   md log, thư mục đo. Đợt 76 thực tế **9/9 luồng xong + stage**.
   Mẫu handoff stale quen thuộc (đợt 68 V4, đợt 71 W9, đợt 72 Z7,
   đợt 74 B3) — luôn kiểm tra đĩa trước khi kết luận một luồng thiếu.
2. **Dict: D9 đã tự gộp, parent không cần bump.** Dict **2419/2419,
   0 mismatch**; 14 file test assert 2419; 3 file còn nhắc 2413 đều là
   comment lịch sử đúng (ProjectMenu dòng 187 — chuỗi thành phần đầy đủ
   tới D9; codecProbeUi dòng 58; codecProbeDebts dòng 15/18 — ghi chú
   D9 đã bump 2413 → 2419). Tên test orphans đã khớp thành phần mới
   ("2400 sau đợt 73 A9 + 4 key B9 + 1 key B3 + 8 key C6 + 6 key D9").
3. **D3 v2b test: 21 PASS, 2 FAIL — ĐÃ GHI TRONG LIMITS, không phải
   hồi quy.** Parent chạy lại: `test_round76_d3_free_track_v2b.js`
   21 PASS, 2 FAIL (node exit 1; LIMITS D3 ghi 20/3 — chênh 1 check
   do điều kiện chạy, cùng loại lỗi). 2 check fail đều là cỡ đoán
   2.088.960 không có trong log (cỡ thật là 2.092.879, chưa rõ công
   thức) — chính là lý do v2b bị v2c/v2d thay thế. v2 **34/34** và v2d
   **16/16** xanh; v2d là bản trả lời "ai free" (7/7 crash khớp RDI).
   Không sửa test (sửa để xanh sẽ làm sai hồ sơ).
4. **Xung đột file chung: gộp sạch.** preview.tsx (D4 + D9),
   Timeline.tsx (D8 + D9), render.js (D9), vi/en.json (D9),
   codecProbeDebts76D8.test.ts (D8 + D9) — tsc web **0**, vite build
   **pass**. Không binary, không workflow.
5. **Không EPERM trong lượt này.** Xvfb + Chrome headed chạy được
   (D4/D9 click-test headed thành công).

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 77 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (các luồng đã build pass; chỉ md/json đổi sau đó).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2419).
- Suite luồng: D4 enhancePreview76D4 **10/10**; D8 codecProbeDebts
  **14/14**; D9 aspectFit **23/23**; C6 codecProbeUi **16/16**;
  D3 free-track v2 **34/34**, v2d **16/16**, v2b **21 PASS, 2 FAIL**
  (đã ghi trong LIMITS D3 §3 — bản superseded, không phải hồi quy).
- Chưa chạy lại: D1/D2/D5/D6/D7 (tin LIMITS từng luồng: D1 pip-audit
  39 + OSV 3/3 timeout; D2 G12 20/20; D5 gate sessions; D6 kiểm đĩa;
  D7 u2net bit-identical).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round76-d1-tts39-npm.txt` (1), `d2-delta0.txt` (3),
  `d3-vidstab-freetracker.txt` (12), `d4-deint-fps.txt` (11),
  `d5-gate-fn.txt` (1), `d6-resample-m4-prod.txt` (1),
  `d7-birefnet.txt` (2), `d8-codec-probe-debts.txt` (8),
  `d9-preset45-letterbox.txt` (27),
  `phase9-round76-closing.txt` (1: LIMITS gộp).
- Tổng đợt 76: **67 entry / 10 file**. Tổng chờ push sau đợt 76:
  **540 entry / 96 file batch / 329 file duy nhất** (đợt 67: 68/9;
  đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
  đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9;
  đợt 76: 67/10). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 77 (§8)

1. **FPS deint-only (D4):** 0,72–0,73× vẫn FAIL ngưỡng 0,75× — cần
   đường nhanh hơn half-res (tap + mask/SR/motion-blur ở tỉ lệ ≥ 0,9;
   footage interlaced thật; Safari/Firefox).
2. **Gate (D5):** giữ ngưỡng 30, nhưng **3/5 lần re-gate giết phiên
   là giết oan** — cần xem lại ngưỡng re-gate (delta 27/18 giết phiên
   khỏe) hoặc tách ngưỡng theo tải.
3. **"Ai free" đã trả lời (D3):** ffmpeg CLI free decoder pool lúc
   drain/EOF — hướng sửa: giữ decoder context sống tới khi filter
   graph xử lý xong frame cuối (hoặc giữ `copy` + chấp nhận crash
   hiếm); cần đợt riêng quyết định sửa.
4. **u2netp (D7):** ứng viên thay thế birefnet khả thi (predict
   1,69–3,84 s, RSS 0,5 GiB) — đo end-to-end trên video thật + so
   chất lượng mask với u2net.
5. **TTS 39 CVE (D1):** vẫn chờ upstream (lần 7); npm audit KHÔNG CÓ
   SỐ (lần fail thứ 6 liên tiếp — 403 + OSV timeout).
6. **Delta0 G12 (D2):** luật mới đúng 20/20 — nối G12 vào harness đo
   (hiện chỉ là quy tắc trong LIMITS, chưa vào code đo).
7. **Keyframe:** trần 90 s không ràng buộc; Safari codec-probe đã nối
   UI (C6) + debts đã đóng (D8).
8. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium).
9. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App).
10. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.
