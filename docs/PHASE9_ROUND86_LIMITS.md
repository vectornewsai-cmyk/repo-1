# LIMITS gộp — Phase 9 đợt 86: đóng nợ đợt 85 §4 (11 mục, 10 luồng)

Ngày: 11/11/2026 (lượt cron 09:35 +07 → worker báo cáo 11:37 +07).
10 luồng song song N1–N10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 86: **10/10 luồng xong + stage.** Worker tự gộp (log entry +
> gap analysis §15) nhưng KHÔNG viết LIMITS gộp và KHÔNG tạo closing
> batch — parent viết nốt (xem §1). Dict không đổi **2507** (không
> luồng nào thêm key — không cần bump snapshot). Tổng chờ push sau
> đợt 86: **1805 entry / 201 file batch / 1107 file duy nhất** (đợt 67: 68/9;
> đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
> đợt 72: 53/10; đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9;
> đợt 76: 67/10; đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10;
> đợt 80: 123/11; đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9;
> đợt 83: 44/10; đợt 84: 82/11; đợt 85: 167/11; đợt 86: 585/11 —
> xem §3). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 85 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| N1 | §4.4 W7-WebKit (clip D) | **Cơ chế kẹt = race preroll GStreamer vs HTTP progressive** (file buffered đầy [0,4] ngay từ đầu); **watchdog seek-cứu thất bại A/B (0/5)**, không sửa production. | Loop-D probes |
| N2 | §4.4 W7 nửa WebKit | **W7 nửa WebKit: ĐÓNG ở mức quan sát — KHÔNG tái hiện sau 5 lần.** Phát hiện **GST_PLUGIN_SYSTEM_PATH sửa crash 100%**. | W7 clicktest ×5 |
| N3 | §4.5 W6 | **Bỏ renderFrame khi seeking là ĐÚNG — nhưng phải bỏ qua cả lần render, không vẽ frame giữ mỗi tick.** WebKit GOP 30 playing: draw 902 ms → skip 120 ms (~7,5×); held (vẽ frame giữ mỗi tick) 902 ms — KHÔNG cải thiện. GOP 250: draw 1181 → skip 783, held 888. Chromium GOP 250 playing: draw 1025 → held 213, skip 285 (~4–5×). Vẽ giữ ĐÚNG 1 lần mỗi seek: WebKit GOP 30 142 ms ≈ skip 120 ms; chi phí nằm ở drawImage LẶP LẠI mỗi tick trong lúc seek, không phải ở 1 lần vẽ. Paused: held KHÔNG nhanh hơn draw → gate chỉ áp cho đường đang phát; nhánh pause/scrub giữ nguyên. **Audio graph KHÔNG ảnh hưởng seek** (probe audiograph). Thay đổi production duy nhất được giữ: bỏ qua cả lần render của tick đó (canvas giữ nguyên frame trước seek). | seekSkipRender 9/9 |
| N4 | §4.6 Birefnet trong gói | **Birefnet-general VẪN CHƯA chạy thành công lần nào trong gói — 0/4 lần thử trong gói ở đợt này** (cộng M6 đợt 85 và 2 lần chẩn đoán standalone: tổng cộng 6 lần chết liên tiếp với cùng 1 chữ ký). Mọi lần đều chết vì SIGKILL trong lúc model đang load hoặc đang predict frame đầu, bridge tự fallback sang u2net và job vẫn hoàn tất bằng u2net (17/17 frame) — fallback hoạt động đúng thiết kế, nhưng KHÔNG lần nào được tính là birefnet chạy được. **Có tiến triển thật (đã đo):** sửa production tắt CPU memory arena + memory pattern của ONNX Runtime cho session birefnet đã giảm đỉnh RSS từ **~4,74 GB xuống ~2,62 GB (−45%)** và kéo dài thời gian sống standalone từ ~4,5–5,5 phút lên ~6,5 phút — nhưng vẫn chưa đủ để qua được trên VM này trong giờ vòng lặp (tải các luồng khác vọt lên 10–33, RAM khả dụng chỉ 0,6–2,5 GB lúc chết). | E2E 0/4 + standalone |
| N5 | §4.1 G1 (deint pool mới) | **SỐ CHO PARENT/USER QUYẾT.** Pool30 mới n=24 **median 0,845 PASS 19/24 (79%)**, khuyến nghị **đóng có điều kiện theo chế độ tải**; luật (b) cần đủ 5 lần nên script verdict kết luận... (xem LIMITS N5). Giả thuyết "chế độ tải quyết định verdict": MỘT NỬA được kiểm chứng. Câu hỏi "verdict ở chế độ yên" vẫn mở sau 3 đợt (L3, M1, N5). | Pool30 n=24 |
| N6 | §4.3 Vidstab cache_stop | **CƠ CHẾ LÕI ĐÃ ĐÓNG (ở tầng decoder/scheduler, không phải trong transform).** Transform đồng bộ (libvidstab + `vf_vidstabtransform`) KHÔNG có đường nào đọc được frame n+1 — race nhịp reuse buffer pool. Không sửa file production. | Cachestop probes |
| N7 | §4.2 Toán tử video | **ĐÃ ĐÓNG — tam giác + 1/16 quantize + trunc (86/87 MAD0).** Danh tính toán tử video đầy đủ. Lưu ý: file stage 39.167 byte > 37.768 — cần ENABLE_PRIVSEP=0 lúc push. | Video-operator test |
| N8 | §4.8 EPERM | **Sóng EPERM: KHÔNG gặp trong lượt này** (probe N8 #1–#4, 02:39–03:09Z, 0 fail) — nhưng KHÔNG tuyên bố "đã hết hẳn". Helper retry đã nối **1.211 lần / 533 file**, writeFileSync còn lại **126 (−90%)**. | EPERM probes 4/4; eperm tests 8/8 + 11/11 |
| N9 | §4.9 Proxy click-test | **Click-test headed 24/24 Chromium. KHÔNG sửa code sản phẩm** (không phát hiện bug thật nào trong đợt). WebKitGTK **KHÔNG chạy được** trong đợt này (ghi rõ, không claim đã test). | Click-test 24/24 |
| N10 | §4.1 G1 (deint combo) | **SỐ CHO PARENT/USER QUYẾT, N10 KHÔNG TỰ ĐÓNG G1.** Playhead 1,42–1,62× do teleport +2,00s; 60fps n=8 PASS 6/8 (75%) luật (b) chưa đạt. **ĐÃ TÁCH ĐƯỢC THÀNH PHẦN GÂY RA: lớp chroma/LUT/effects** (xem LIMITS N10). | Combo probes |

## 1. Ghi chú parent merge

1. **Worker tự gộp một phần — parent kiểm lại + viết nốt.**
   Worker đã viết log entry gộp + gap analysis §15, nhưng KHÔNG
   viết LIMITS gộp và KHÔNG tạo closing batch. Parent viết LIMITS
   gộp này + closing batch (xem §3). **Đính chính số tổng của
   worker:** worker nói "Tổng chờ push: 1765+ entry / 196+ file
   batch (đếm trên đĩa, parent verify lại ở closing)" — **sai.**
   Đếm lại trực tiếp từ đĩa: đợt 67–85 = 1220/190/768 (163 + 4 muộn
   ở đợt 85); đợt 86 thread = 582 entry / 10 file (8+2+2+14+3+1+3+
   13+534+2); sau closing = **1805 entry / 201 file / 1107 unique**.
   Con số 1765 của worker thiếu 40 entry.
2. **N4 đã có đủ trên đĩa.** Worker ghi "N4 birefnet-general:
   [chờ handoff — đã có trên đĩa theo đếm gộp của N6]" — batch
   `phase9-round86-n4-birefnet-ship.txt` (3 entry) + LIMITS N4 +
   md log đều có; parent đọc LIMITS N4 trực tiếp (xem §0).
3. **Xung đột file chung: gộp sạch.** preview.tsx (N3 — skip
   render khi seeking) + tsconfig.json (N3); `chrome-resample.mjs`
   (N7 — toán tử video, production); `server/bgremove/bgremove.py`
   (N4 — tắt ONNX arena); N8 nối helper vào 533 file, trong đó có
   file của N1/N2/N4/N9/N10 cùng đợt (e2e-ship-services-birefnet-
   retry-n4.mjs, probe-86n10-config-fps.mjs,
   clicktest-86n2-webkit-w7.mjs,
   clicktest-86n9-proxy-clicktest-headed.mjs,
   webkit_loop_d_rootcause_86n1.mjs) — parent kiểm: các file trùng
   đều có cả marker của luồng gốc lẫn marker eperm/retry của N8
   (N4 file: 20 lần "birefnet" + 6 lần "fallback/u2net" + 5 lần
   "eperm/retry"); 0 file thiếu trên đĩa. tsc web **0**, desktop
   **0**. Không binary, không workflow. Không batch nào thiếu NUL
   cuối (cả 10 batch N đều NUL: True). Dict không đổi 2507 — không
   cần bump snapshot.
4. **Log: worker đã viết entry gộp; parent viết thêm entry đính
   chính** (số tổng 1765 sai → 1805 đúng; đợt 85 +4 entry muộn —
   xem mục 5). Các entry riêng của từng luồng giữ nguyên làm hồ sơ.
5. **Đợt 85 +4 entry MUỘN (phát hiện khi đếm đợt 86).** File
   `phase9-round85-m4-webkit-w7-w6.txt` bị sửa lúc 02:07 UTC
   (09:07 +07) — SAU khi parent gộp xong đợt 85 (closing lúc
   01:31 UTC). Một tiến trình M4 chạy muộn đã thêm 4 script
   loop-D (`webkit_loop_d_rerun_85m4.mjs`,
   `webkit_loop_d_waitcanplay_85m4.mjs`,
   `webkit_loop_d_waitcanplaythrough_85m4.mjs`,
   `webkit_loop_d_nopoll_85m4.mjs`) — cả 4 đều có trên đĩa, đúng
   mẫu đặt tên M4, đúng mảng loop-D (liên quan N1 đợt 86) nên giữ
   nguyên trong batch M4. Đợt 85 nay là **167 entry / 11 file**
   (không phải 163); tổng sau đợt 85 là **1220/190/768**. Parent
   đã sửa số tổng trong `docs/PHASE9_ROUND85_LIMITS.md` (5 chỗ)
   và đưa file đó vào closing batch đợt 86. Bài học: batch file
   của một đợt có thể bị tiến trình muộn sửa sau khi gộp — khi đếm
   tổng ở đợt sau, đếm lại từng đợt, đừng cộng dồn số cũ.

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 87 chưa bắt đầu, cây yên).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2507).
- Suite luồng: N3 seekSkipRender **9/9**; N7 video-operator test
  **exit 0**; N8 eperm server **8/8**, desktop **11/11**.
- Chưa chạy lại: N1/N2/N4/N5/N6/N9/N10 (tin LIMITS từng luồng:
  N1 loop-D probes; N2 W7 clicktest ×5; N4 E2E 0/4 + standalone;
  N5 pool30 n=24; N6 cachestop probes; N9 click-test 24/24;
  N10 combo probes).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round86-n1-webkit-clipd-loop.txt` (8),
  `n2-webkit-w7.txt` (2), `n3-w6-seek.txt` (14),
  `n4-birefnet-ship.txt` (3), `n5-deint-g1-decision.txt` (1),
  `n6-vidstab-cachestop.txt` (3), `n7-video-operator.txt` (13),
  `n8-eperm-wiring.txt` (534), `n9-proxy-clicktest.txt` (2),
  `n10-deint-combo-playhead.txt` (2),
  `phase9-round86-closing.txt` (3: LIMITS gộp + gap analysis + LIMITS
  đợt 85 đã sửa số tổng — xem §1.5).
- Tổng đợt 86: **585 entry / 11 file** (582 thread + 3 closing). Tổng chờ push sau đợt 86:
  **1805 entry / 201 file batch / 1107 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
  đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
  đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
  đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
  đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9; đợt 83: 44/10;
  đợt 84: 82/11; đợt 85: 167/11; đợt 86: 585/11). HEAD GitHub vẫn `5f548ef8`.
  KHÔNG push.

## 4. Nợ mở cho đợt 87 (§8)

1. **G1 đóng hay chưa — parent/user quyết** (N5: pool30 n=24
   median 0,845 PASS 19/24 (79%), khuyến nghị đóng có điều kiện
   theo chế độ tải; N10: 60fps n=8 PASS 6/8 (75%) luật (b) chưa đạt;
   câu hỏi "verdict ở chế độ yên" vẫn mở sau 3 đợt).
2. **Birefnet-general trong gói** (N4: 0/4 trong gói đợt này, 6 lần
   chết liên tiếp cùng chữ ký; RSS đỉnh đã giảm 4,74 → 2,62 GB
   (−45%) nhưng vẫn chưa đủ trên VM này trong giờ vòng lặp; 7/8
   job AI đã chạy thật trong gói).
3. **WebKit clip D loop** (N1: race preroll GStreamer vs HTTP
   progressive; watchdog seek-cứu thất bại 0/5).
4. **W6** (N3: skip render khi seeking đã vào production; còn
   paused/scrub giữ nguyên; audio graph không ảnh hưởng).
5. **Vidstab cache_stop** (N6: cơ chế lõi ĐÃ ĐÓNG — race nhịp reuse
   buffer pool ở tầng decoder/scheduler).
6. **EPERM** (N8: không gặp sóng trong lượt này; writeFileSync còn
   lại 126 (−90%); không tuyên bố hết hẳn).
7. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**
   (đã kiểm 6 lần liên tiếp không đổi; chỉ kiểm khi có tín hiệu
   stable mới).
8. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App).
9. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.
