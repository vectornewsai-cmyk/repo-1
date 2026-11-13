# LIMITS gộp — Phase 9 đợt 72: đóng nợ đợt 71 §5 (10 mục, 9 luồng)

Ngày: 09/11/2026 (lượt cron 12:35 +07 → worker báo cáo 13:30 +07, chưa
timeout lượt; Z10 chưa được giao — parent gộp thay). 9 luồng song song
Z1–Z9. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 72: **9/9 luồng xong + stage** (Z7 về muộn lúc 13:35, xem §1).
> Parent gộp: Z5 thêm 2 key dict (2379 → 2381), 12 test khóa số key
> đã bump, css60 + z5range đã sửa. Tổng chờ push sau đợt 72:
> **274 entry / 57 file batch / 186 file duy nhất**
> (đợt 67: 68/9; đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10;
> đợt 71: 42/10; đợt 72: 53/10 — xem §3). HEAD GitHub vẫn `5f548ef8`.
> KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 71 §5) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| Z1 | §5.1 Toast H | **ĐÃ ĐÓNG — PASS.** Cả 3 điều kiện đồng thời đạt lần đầu: baseline pre-launch **1,10 ≤ 3,0** + toast thấy ở **+93,1 s** trong cửa sổ 75–240 s + poll không mù (372 samples, blindGapMs = 0). Nợ toast H kéo dài từ đợt 67 U5 cuối cùng đã đóng. | Click-test headed, bundle trùng Y5/Y10 |
| Z2 | §5.2 w1920 n10 + ocean w1440 | **Xong phần lớn.** (a) w1920 noise10 testsrc2 — **KHỚP**: trilinear tái lập đúng 0,38 (sanity); 1-kernel viewport cho **Δkurt R 0,06 KHỚP**. Phát hiện: testsrc2 KHÔNG có bước 1920→1280 (gốc chỉ 1280×720); 0,38 là sai số mô hình trilinear ở thang viewport s=0,632 (blend 16% mip L1 trong khi Chrome ở thang đó gần như không blend). (b) ocean w1440 — xem LIMITS Z2 (chi tiết). | 6 script probe/analyze |
| Z3 | §5.3 Gate FN lạnh | **Xong — re-gate NỐI CỬA THỨ HAI, ngưỡng 20 → 30.** 3 phiên đo (S1 phiên lạnh thật; FN lạnh không tái hiện). | 3 session đo; launcher + analyzer |
| Z4 | §5.4 Birefnet fps | **Vẫn KHÔNG CÓ SỐ.** Đỉnh RSS **5,63 GiB**, trần cell 6,0 GiB gần xác nhận (cần RAM ≥ ~6 GiB, khuyến nghị đo trên máy RAM tổng ≥ 12 GB). | Predict vẫn OOM/SIGKILL |
| Z5 | §5.5 Toast trial chưa bao fetch remainder | **ĐÓNG 3 ĐIỂM.** (1) Fetch remainder hiện tiến độ chunk thật; (2) đổi ngôn ngữ giữa trial thì toast không đóng + hẹn lại 5 s; (3) nhiều trial cùng lúc chỉ hiện run cũ nhất. Dict **+2 key** (`gop.trial.fetching`, `gop.trial.others`) → **2381**. Fragment `round72-z5.json`. | Test mới trialFetchRunning72Z5 + gopRangeFetch72Z5 |
| Z6 | §5.6 SEGFAULT vidstab | **STACK TRACE ĐÃ BẮT ĐƯỢC lần đầu (LD_PRELOAD).** Log `r.signal` đã thêm vào render.js (2 chỗ: thông báo lỗi cuối + cảnh báo fallback GPU); test mới **17/17 PASS**; `copy` giữ nguyên, không đổi hành vi (vẫn exit 2). | Test signal log 17/17; harness trace hunt |
| Z7 | §5.8 Kernel 2D | **ĐÃ ĐÓNG — trilinear blend-at-end.** Kernel 2D thật của Chrome KHÔNG phải cone/Gauss, cũng không phải triangle tách trục như production đang dùng — nó là **trilinear mipmap trộn 2D** (mỗi mức mip bilinear-sample 2D trước, rồi mới trộn 2 kết quả 2D — đúng cách Skia lấy mẫu). Khớp dữ liệu headed tới **maxAbs = 1** (mức làm tròn uint8) trên 259.584 ô lưới pha mịn + 50 ô Y8 độc lập. **Production sai ở CÁCH TRỘN, không sai hệ số:** `resamplePlaneTrilinear` trộn 2 mức mip trong từng pass 1D (X rồi Y), sinh 2 hạng chéo `f(1−f)` không tồn tại trong pipeline thật — lệch maxAbs tới **19**, RMSE 0,47–0,65. Hệ số blend f (bias −0,5) thì ĐÚNG (fit Δf ≈ 0). 1D không hề sai (MAD ≤ 0,005) vì hạng chéo vô hình trên ảnh 1D. Dự đoán verdict KHỚP của Y8 ĐÃ XÁC NHẬN trên headed thật (w1440 noise05 Δkurt R **0,29 KHỚP**, noise10 **0,34 KHỚP**, 20/20 check). **Chưa sửa production** (batch chỉ có script + LIMITS) — sửa `resamplePlaneTrilinear` sang blend-at-end là nợ đợt 73. | Test trilinear-2dblend PASS; 259.584 ô lưới pha mịn |
| Z8 | §5.9 TTS 39 | **VẪN MỞ.** pip-audit 39 không đổi, CAP chưa lifted (gradio vẫn kẹp pillow<13). Kiểm tra định kỳ bằng script W7. | pip-audit 39 |
| Z9 | §5.10 Resample theo thang + w2560 | **ĐÃ ĐO XONG — KHÔNG có mô hình phụ thuộc thang.** Lưới thang dày 43 thang vuông (s = 0,30–0,85, Chrome 158 headed): bias LOD tối ưu từng thang = **−0,504…−0,498, trung bình −0,5002** (32/33 khoảng bất định chứa −0,5); hồi quy bias(s): slope 0,0023 ± 0,0014 (1,6σ, không khác 0). Trilinear bias −0,5 thắng 1-kernel và 2-stage ở mọi thang xác định. | 43 thang; Chrome 158 headed |

## 1. Ghi chú parent merge (quan trọng)

1. **Worker báo cáo sai cả 3 luồng "thiếu".** Handoff nói Z2/Z7/Z9
   "không có dữ liệu stage, file paths, LIMITS hay log" — sai cả ba:
   trên đĩa có đủ batch (Z2 7 entry, Z9 6 entry, Z7 5 entry), LIMITS
   doc, md log, thư mục đo. Z7 chỉ về muộn (batch stage lúc 13:35,
   sau khi worker báo cáo lúc 13:30) — parent đã kiểm tra đĩa lần 2
   và bắt được. Mẫu handoff stale quen thuộc (đợt 68 V4, đợt 69 W2,
   đợt 71 W9) — luôn kiểm tra đĩa trước khi kết luận một luồng thiếu.
2. **Z5 thêm 2 key dict nhưng không bump snapshot — parent đã bump.**
   Dict 2379 → 2381 (`gop.trial.fetching`, `gop.trial.others`, đã có
   trong dict + fragment, 0 collision, vi==en). 12 test khóa số key vẫn
   assert 2379 → parent bump 2379 → 2381 ở cả 12 file (cùng 12 file như
   đợt 67/68/69/71) + sửa tên test i18nOrphans cho khớp thành phần mới
   (2379 sau đợt 68 − 1 key chết đợt 69 + 1 key Y5 + 2 key Z5).
   Kiểm chứng sau bump: xem §2.
3. **Toast H ĐÃ ĐÓNG (Z1)** — nợ kéo dài từ đợt 67 U5 §6 qua V5/Z2/Y1
   cuối cùng đã có verdict PASS với cả 3 điều kiện. Không còn nợ toast
   H; nợ còn lại là toast trial (đã đóng 3 điểm ở Z5) và harness.
4. **Không xung đột file** giữa các luồng (render.js chỉ Z6 sửa; dict
   chỉ Z5 sửa). Không binary, không workflow, không dist trong batch.
5. **Môi trường:** không có EPERM trong lượt này; Xvfb + Chrome headed
   chạy được (Z1 click-test headed thành công).

## 2. Kiểm chứng parent trên cây đã gộp

_(Parent chạy sau khi gộp; đợt 73 bắt đầu 15:35 — lúc kiểm chứng cây còn
yên.)_

- tsc web **0**, desktop **0** (chạy lúc đợt 73 chưa bắt đầu, cây yên).
- vite build: BỎ QUA (các luồng đã build pass; chỉ dict/snapshot JSON +
  md + 2 test fix đổi sau đó).
- P7 i18n audit: **8/8**. cssClasses60Q2: **59/59** (sau khi parent sửa:
  Z5 thêm 2 key `gop.trial.fetching`/`gop.trial.others` vào preview.tsx
  mà không cập nhật expected list + count 48 → 50 — cùng mẫu đợt 67 U6).
  cssClasses61R4: **60/60**.
- r6-i18n-check: **PASS** (dict nay 2381).
- Suite luồng: Z5 trialFetch **6/6**, gopRangeFetch72Z5 **4/4** (sau khi
  parent sửa test 416: trì hoãn response 416 một nhịp 25 ms để run fetch
  kịp hiện trước khi fetch lỗi — race ở test, không phải bug sản phẩm;
  implementation đăng ký run trước khi fetch và dọn khi lỗi là đúng),
  Z6 signal log **17/17**, Z7 trilinear-2dblend **PASS** (20,2 s),
  V2 stab **11/11** (harness).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round72-z1-toast-h.txt` (1), `z2-kurt-r.txt` (7),
  `z3-gate-fn.txt` (3), `z4-birefnet-fps.txt` (1),
  `z5-trial-toast.txt` (10), `z6-vidstab-segfault.txt` (5),
  `z7-2d-kernel.txt` (5), `z8-tts39.txt` (1),
  `z9-resample-scale.txt` (6),
  `phase9-round72-closing.txt` (14: LIMITS gộp + 12 snapshot + css60 fix).
- Tổng đợt 72: **53 entry / 10 file**. Tổng chờ push sau đợt 72:
  **274 entry / 57 file batch / 186 file duy nhất** (đợt 67: 68/9;
  đợt 68: 57/9; đợt 69: 33/9; đợt 70: 21/10; đợt 71: 42/10;
  đợt 72: 53/10). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 4. Nợ mở cho đợt 73 (§8)

1. **Sửa `resamplePlaneTrilinear` sang blend-at-end (Z7, ưu tiên):**
   production hiện trộn 2 mức mip trong từng pass 1D (sinh hạng chéo
   không tồn tại) — sửa thành bilinear-sample 2D từng mức rồi mới trộn
   2 kết quả 2D (đúng Skia); đo lại maxAbs (kỳ vọng ≤ 1) + chạy lại
   verdict noise (kỳ vọng w1440 noise05/10 KHỚP).
2. **Birefnet fps:** vẫn chưa có số — đo trên máy RAM tổng ≥ 12 GB
   (khuyến nghị 16 GB) hoặc lượt riêng yên trên VM này; trần cell 6,0
   GiB gần xác nhận (đỉnh RSS 5,63 GiB).
3. **TTS 39 CVE:** vẫn chờ upstream — kiểm tra lại định kỳ bằng
   `scripts/check-gradio-pillow-cap.py`; chỉ thử bump khi in
   `CAP LIFTED`.
4. **SEGFAULT vidstab:** stack trace đã bắt được (Z6) — phân tích
   stack trace để tìm frame lỗi chính xác; log `r.signal` đã có.
5. **Gate:** re-gate đã nối cửa thứ hai, ngưỡng 30 — theo dõi FN lạnh
   có tái hiện không ở các phiên lạnh sau reboot.
6. **w1920/ocean:** ocean w1440 lệch thật (Z2) — cần hướng khác
   (điều kiện hoá hiệu chỉnh delta0 theo absMAD plain, Z2 đề xuất).
7. **Keyframe:** trần 90 s đã xác nhận không bao giờ là ràng buộc;
   Safari chưa đo được.
8. **GPU thật / Safari thật:** chưa đo (mọi kết luận chỉ đúng trên
   CPU/SwiftShader + Chromium).
9. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
   web GitHub hoặc cấp quyền workflows cho App).
10. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.
