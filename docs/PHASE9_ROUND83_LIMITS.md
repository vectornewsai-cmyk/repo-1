# LIMITS gộp — Phase 9 đợt 83: đóng nợ đợt 82 §4 (12 mục, 10 luồng)

Ngày: 11/11/2026 (lượt cron 00:35 +07 → timeout 10800s, worker báo cáo
03:38 +07, nói 9/10 luồng, K7 dở dang — parent kiểm đĩa đính chính).
10 luồng song song K1–K10. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 83: **10/10 luồng xong + stage** (K7 đã xong việc trên đĩa —
> LIMITS do parent viết từ log luồng 249 dòng + log ship/click-test,
> xem §1). Dict 2463 không đổi. Tổng chờ push sau đợt 83:
> **971 entry / 168 file batch / 636 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
> đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
> đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
> đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
> đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9; đợt 83: 42/10 — xem §3).
> HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 82 §4) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| K1 | §4.1 Gate 2fps | **MỤC TIÊU ĐÃ ĐẠT — đã có 3 ca slot1 dưới 2,0 fps trong dải có re-gate FAIL; ngưỡng 30/20/2 giữ nguyên.** Gộp E2+F2+G2+H2+I2+J6+K1 (n=11 ca FAIL trong dải). | Gate sessions |
| K2 | §4.2 Kernel Mitchell | **ĐỔI PRODUCTION SANG MITCHELL (1/3, 1/3) sau A/B.** 4 verdict KHỚP tăng thêm, 0 verdict mất đi (kiểm lại theo đúng luật verdict E9/F6). tsc 0, suite 18/18. | Suite 18/18 |
| K3 | §4.3 Deint median | **CHỐT LUẬT VERDICT MEDIAN-5 + ≥4/5 PASS — PASS ỔN ĐỊNH, CÓ BIÊN.** Gộp 15 lần median 0,840×, CI cận dưới 0,787 (trên ngưỡng 0,75×). | Verdict test exit 0 |
| K4 | §4.4 VP9-vs-h264 | **Codec KHÔNG làm lệch verdict — nợ ĐÃ ĐÓNG. 0 lần lật verdict trong 40 cặp so sánh** (noD0 / fullD0 / R0 / G1 / G12). | 40 cặp |
| K5 | §4.5 Q4 sọc màu mịn | **DỪNG SĂN Q4.** Sọc màu mịn tái hiện pattern resid ở mức cổng (2 case thỏa cả ba điều kiện) nhưng full verdict **0/12** phân biệt được G1 vs G2 (stdRatio ~1,48 vượt ngưỡng [0,85; 1,18] ở cả 3 kênh; d0 không sửa được mismatch std do kernel lệch trên nhiễu trắng ở thang nhỏ). Đây là hướng cuối cùng chưa thử — đã loại trừ hết. | K5 test 23/23 |
| K6 | §4.6 Lineart hướng mới | **5 hướng mới đều KHÔNG thắng baseline. Không sửa production.** (Đã chứng minh không phải do dither.) | Lineart probes |
| K7 | §4.7 Ship full click-test | **AppImage mới 556.967.608 byte, probe AI 8/8, orphan-relaunch PASS 2 lần (ship-run3 + run4), click-test 8/9** (K7 export UI FAIL do hộp thoại lưu native không xử lý được bằng XTEST; K7b fallback render smoke PASS 115.869 byte, 8,000000s). Race orphan-kill9-relaunch (J8 §5.2) và smoke lần 2 timeout (J8 §5.1) ĐÃ HẾT. Cơ chế thật: 3 lỗi dồn trong serviceManager.js (deep probe song song + timeout chốt một lần + connected chỉ tính khi nhận xong HTTP response) — đã sửa 4 chỗ. | Ship run3/4 PASS; click-test 8/9 |
| K8 | §4.9 EPERM hardening | **Probe không gặp sóng trong lượt; helper retry + nối 4 điểm; test 16/16.** (Sóng EPERM vẫn xuất hiện trong lượt ở các luồng khác — xem §1.) | K8 test 16/16 |
| K9 | §4.10 GPU/Safari | **KHÔNG GPU thật (xác nhận lần 4); WebKit thật KHÔNG KHỞI ĐỘNG ĐƯỢC trên VM hiện tại — HỒI QUY** (kernel 7.0.0-43→44, plugin GStreamer biến mất, thiếu 22–18 lib sau đổi kernel VM). Số WebKit cũ chỉ còn hồ sơ. | GPU probe |
| K10 | §4.3 Vidstab race fix | **tpad 1 frame và NEEDS_WRITABLE đều 0/1500; KHÔNG sửa production.** Chế độ (b) UAF không tái hiện trong stress K10 (0/30 run) nhưng không bác bỏ được (gộp I1+J1+K10: 4/54 run có n=148 poison-like, Wilson 95% [2,9%; 17,6%]). Probe passthrough thuần KHÔNG khử (N720NULL 867/1500 vs D720NC 844/1500, p=0,40); OMP_NUM_THREADS=1 KHÔNG đổi gì (p=0,39). | Stress 0/30; per-frame |

## 1. Ghi chú parent merge

1. **Worker báo cáo sai — K7 đã xong việc trên đĩa.** Handoff nói
   K7 "thiếu LIMITS, log §5–§7 hoàn chỉnh, file stage (7 file)" —
   trên đĩa có: log luồng 249 dòng (đủ §0–§5, §6–§7 để trống),
   ship-run2/3/4.log, clicktest-report.json (8/9, 20:35:10Z),
   clicktest-run1–14.log, 6 file code đã sửa (serviceManager.js,
   main.ts, package-ship.mjs, package.json,
   serviceManager.test.cjs, clicktest-ship-full.mjs). Parent **viết
   LIMITS K7** từ log luồng + log ship/click-test (đã đối chiếu:
   ship-run3/4 đều PASS orphan; ship-run2.log ghi FAIL
   `pid2 is not defined` — đúng như §2.2 của log luồng; report JSON
   8/9 với K7 FAIL duy nhất do hộp thoại native). K7 nay stage đủ
   7 file trong closing. **Đợt 83 thực tế 10/10.**
2. **Sóng EPERM trong lượt (nhiều sóng, không phải một):** K4 ghi
   ~18:12–18:26 UTC; K1 ghi 2 sóng (~18:15–18:22); K2 chớp EPERM lúc
   stage 18:23–18:24; K10 lần 3 (~18:10–18:20); K7 lần chạy 1 dừng
   sớm do sóng (00:39–~01:15 +07, icon-192.png truncate 0 byte —
   **tự lành** khi sóng qua, sinh lại 1271 byte). K8 probe 3 lần OK
   (không gặp sóng trong lượt của nó). Đã áp dụng luật "bị chặn thì
   dừng"; không lách. **VM reboot 2 lần** trong lượt (K1: config vite
   tái tạo md5 khớp; K7 run 8 dở do reboot giữa K7).
3. **K9 regression — WebKitGTK không khởi động được.** Kernel VM
   7.0.0-43→44, plugin GStreamer biến mất, thiếu 22–18 lib. Số
   WebKit cũ (E8, H5, I7) chỉ còn hồ sơ — mọi kết luận WebKit từ nay
   cần ghi rõ "đo trên VM cũ trước kernel 44".
4. **Dict: không đổi.** 2463/2463, 0 mismatch; không luồng nào thêm
   key đợt này.
5. **Xung đột file chung: gộp sạch.** chrome-resample.mjs (K2 đổi
   production sang Mitchell), package-ship.mjs (K7 + J8),
   serviceManager.js (K7), main.ts (K7) — tsc web **0**, desktop
   **0**. Không binary, không workflow. Không batch nào thiếu NUL
   cuối (cả 9 batch K đều NUL: True).
6. **Log: các luồng tự ghi entry riêng, chưa có entry gộp.** Log có
   entry riêng của K8, K5, K9 + K1 (tổng gộp do parent đếm). Parent
   viết entry gộp này; các entry riêng giữ nguyên làm hồ sơ.

## 2. Kiểm chứng parent trên cây đã gộp

- tsc web **0**, desktop **0** (chạy lúc đợt 84 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (chỉ script/test/md đổi; K7 đã build desktop +
  AppImage thật trong lượt).
- P7 i18n audit: **8/8**. i18nOrphans: **16/16**.
  cssClasses60Q2: **59/59**. cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2463).
- Suite luồng: K2 suite **18/18** (67u2 8/8 + J2 probe 4/4 + 2dblend
  6/6); K3 verdict test **exit 0**; K5 Q4 stripes test **23/23**;
  K8 EPERM retry test **16/16**.
- Chưa chạy lại: K1/K4/K6/K7/K9/K10 (tin LIMITS từng luồng: K1 gate
  sessions; K4 40 cặp; K6 lineart probes; K7 ship run3/4 PASS +
  click-test 8/9; K9 GPU probe; K10 stress 0/30 + per-frame).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round83-k1-gate-2fps-finish.txt` (2),
  `k2-kernel-mitchell-ab.txt` (4), `k3-deint-verdict-median.txt` (3),
  `k4-vp9-vs-h264.txt` (6), `k5-q4-chromatic-stripes.txt` (5),
  `k6-lineart-new-direction.txt` (2), `k8-eperm-hardening.txt` (8),
  `k9-gpu-safari-real.txt` (3), `k10-vidstab-race-fix.txt` (2),
  `phase9-round83-closing.txt` (9: LIMITS gộp + gap analysis + 7 file K7).
- Tổng đợt 83: **44 entry / 10 file**. Tổng chờ push sau đợt 83:
  **971 entry / 168 file batch / 636 file duy nhất** (đợt 67: 68/9; đợt 68: 57/9;
  đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10; đợt 72: 53/10;
  đợt 73: 56/10; đợt 74: 85/10; đợt 75: 58/9; đợt 76: 67/10;
  đợt 77: 40/10; đợt 78: 48/11; đợt 79: 55/10; đợt 80: 123/11;
  đợt 81: 63/11 (51 + 12 muộn); đợt 82: 58/9; đợt 83: 42/10).
  HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 84 (§8)

1. **K7 export UI FAIL** — hộp thoại lưu native không xử lý được
   bằng XTEST. Cần hướng khác: mock dialog, `--save-dialog`
   headless, hoặc export qua bridge làm đường chính (K7b đã PASS).
2. **WebKitGTK không khởi động được** (kernel 44) — cần sửa VM
   (cài lại GStreamer plugin + lib thiếu) hoặc ghi nhận WebKit chỉ
   còn hồ sơ; Safari thật vẫn cần máy macOS/iOS.
3. **EPERM là sóng lặp lại** (nhiều sóng trong lượt 83) — theo dõi
   mỗi đợt, không tuyên bố "đã hết hẳn"; K8 đã nối retry 4 điểm.
4. **Vidstab (K10):** chế độ (b) UAF không tái hiện (0/30) nhưng
   không bác bỏ được (4/54 gộp có n=148 poison-like); passthrough và
   OMP=1 đều không khử — cần hướng mới.
5. **Lineart (K6):** 5 hướng mới đều không thắng baseline — cần hướng
   mới hoặc chấp nhận giới hạn.
6. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**
   (đã kiểm 6 lần liên tiếp không đổi; chỉ kiểm khi có tín hiệu
   stable mới).
7. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium/WebKitGTK — và WebKitGTK nay cũng
   không chạy được).
8. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App).
9. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.
