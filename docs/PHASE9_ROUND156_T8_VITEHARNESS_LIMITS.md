# Đợt 156 T8 — O8 PASS 3/3 + HARNESS 6/6 (MỘT LẦN CHẠY DUY NHẤT, 0 KẸT) SAU WAITER HẾT HẠN (THỦ TỤC (i), KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO) — 3 REBOOT GIỮA PHIÊN, QUY TẮC FIXTURE MỚI PHÁT HUY TÁC DỤNG

Ngày: 20/11/2026 (lượt cron 00:35 +07 = 17:35:51Z; T8 mở ~17:38Z, đóng 19:55Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy SAU WAITER HẾT HẠN 19:30Z 20/11 theo THỦ TỤC (i), KHÔNG có lượt yên hợp lệ nào của T4 trong đợt 156 (T4 #25: 3 attempt, 0 hợp lệ — xem §0/§1); (2) harness đứng — MỘT lần chạy driver duy nhất, 6/6 PASS, 0 KẸT (quy tắc fixture mới quyết (l) đợt 155 đã ngăn lặp lại lỗi lần 1 của đợt 155 — xem F-156-T8-1/2/3); (3) watchdog GIỮ NGUYÊN bản vá đợt 142, 0 kích hoạt, 0 false-positive; (4) H3: CHỈ GIÁM SÁT THỤ ĐỘNG (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 — GIỮ NGUYÊN); (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON của T0-152 còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau.
Nợ: docs/PHASE9_ROUND155_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 sau waiter hết hạn, KHÔNG có lượt yên hợp lệ; harness lần 2 6/6, 0 kẹt — lần 1 0/6 do /tmp mất theo reboot #50; chuỗi "P3 không kẹt" 1 → 2; chuỗi WebKit FULL PASS GIỮ 11, KHÔNG LÊN 12 — T10 phán, parent XÁC NHẬN ở quyết (f) đợt 155; 2 reboot trong phiên #50/#51; checklist (o) xong cả hai symlink).

## 0. Kết luận ngắn — O8 PASS 3/3 (KHÔNG QUA LƯỢT YÊN), HARNESS 6/6 MỘT LẦN CHẠY (0 KẸT), 3 REBOOT GIỮA PHIÊN

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (19:34:16–19:36:54Z, 2'38", boot `c99a1045` = boot thứ tư của đợt, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 19:34:31Z + 19:35:23Z, Playwright mouse click lần 2; Chromium: 19:36:23Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO — CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN.** T4-156: lượt yên #25 KHÔNG CÓ lượt hợp lệ — **3 attempt, 0 hợp lệ** (attempt1 20/20 nhưng tickCost median 67,0 ms > 60 → không hợp lệ; attempt2 PAGE-WEDGED sau pass 11/20 exit 2; attempt3 PAGE-WEDGED sau pass 9/20 exit 2; poller thoát 18:13:07Z — cờ T4 viết 18:34Z). Chuỗi lượt yên hợp lệ DỪNG Ở #21 (đợt thứ tư liên tiếp không có lượt mới: #22/#23/#24/#25). Waiter T8 (lần 4) hết hạn 19:30Z 20/11 — GATE NOT MET (t4=1, postboot=0; T5 ĐÃ ĐÓNG, không có POSTBOOT_PASS cho boot mới) → đủ điều kiện thủ tục (i) đợt 143: chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot `c99a1045` lúc 19:33:57Z — ĐẦY ĐỦ** (lib đủ 6/6, GST 269, dpkg.log 1.545 dòng, cache 178 .deb, lists 39 — xem F-156-T8-5). **Nhãn trích: "O8 + harness sau waiter hết hạn 19:30Z 20/11, KHÔNG có lượt yên hợp lệ nào trong đợt 156 (T4 #25: 3 attempt, 0 hợp lệ), theo thủ tục (i)" — KHÔNG ghi "sau lượt yên hợp lệ" và KHÔNG ghi "qua gate chuẩn (i)".**
- **Chuỗi WebKit FULL PASS: 11 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).** O8 WebKit 21/21 ×2 đợt này trên boot `c99a1045`, nhưng KHÔNG sau lượt yên hợp lệ nào (giống đợt 154/155: O8 sau waiter hết hạn, 0 lượt yên; parent quyết (f) đợt 155: GIỮ 11, KHÔNG LÊN 12). Tiền lệ đợt 150 + quyết (j) đợt 153: chuỗi = các lượt O8 chạy SAU MỘT LƯỢT YÊN HỢP LỆ.
- **Harness: 6/6 PASS TRONG MỘT LẦN CHẠY DRIVER DUY NHẤT, 0 KẸT** (19:37:44–19:53:25Z, boot `c99a1045`, system libs sau tự kiểm postboot): WebKit 84l10 PASS (19:38:58Z) + 85m4 PASS (19:41:33Z) + 86n2 PASS (19:45:49Z) + Chromium 84l10 PASS (19:47:04Z) + 85m4 PASS (19:49:19Z) + 86n2 PASS (19:53:25Z). Cả 6 report JSON đã kiểm độc lập bằng python (6× `ok=true`). **Chuỗi "P3 không kẹt": 2 → 3 (TIẾP TỤC).**
- **Quy tắc fixture mới (quyết (l) đợt 155) PHÁT HUY TÁC DỤNG — KHÔNG CÓ harness lần 1 hỏng đợt này.** Fixture /tmp được kiểm/rebuild TRƯỚC harness lần 1 (đã rebuild 4 lần trong phiên, sau mỗi reboot giữa phiên — xem §1/F-156-T8-1/2/3); lúc chạy harness 19:37:44Z fixture còn nguyên, md5 `fbaa3d1a` đã kiểm ngay trước khi chạy. Đợt 155 phải chạy lại lần 2 vì thiếu fixture; đợt 156 chạy MỘT lần là đủ 6/6.
- **3 REBOOT GIỮA PHIÊN (T8 quan sát trực tiếp, T2/T10 phán số hiệu):** boot lúc mở `5353ed19` (#52, btime 17:19:09Z) → `062850d8` (btime 18:26:15Z, sống 208 s) → `447f0efe` (btime 18:29:43Z, sống 2.101 s) → `c99a1045` (btime 19:04:44Z, boot chạy O8 + harness). LỆCH SỐ HIỆU với coordinator/T4: coordinator + cờ T4 gọi `447f0efe` là "#53" (bỏ qua boot `062850d8` sống 208 s); T8 đếm `062850d8` = #53, `447f0efe` = #54, `c99a1045` = #55 (xem F-156-T8-1/2/3). Mù #85? (theo đếm coordinator/T4, giao T2-156 theo cờ T4 / T2-157 theo tin coordinator — T8 ghi cả hai, chờ T10 phán).
- **Watchdog: 0 kích hoạt, 0 live-diag, 0 false-positive** — không có kẹt để bắt.
- **Balloon trong cửa sổ harness T8: 0 mẫu ghim trần** (n=32, max 5.956.232 kB = 92,4% trần); **avail min 374 MB lúc 19:53:15Z** (trong lúc chạy 86n2 Chromium). Nhưng balloon ĐÃ ghim trần 100% (6.443.824 kB) lúc T8 tự kiểm postboot 19:33:57Z — NGOÀI cửa sổ sampler (xem F-156-T8-5/7).
- **T8 ĐÓNG 19:55Z — TRONG hạn cờ ~20:00Z** (cờ `round156-t8.done` viết 19:55Z, 1.319 B; LIMITS hoàn thiện sau cờ vài phút).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 17:19:09 | REBOOT #52 (ứng viên, boot `5353ed19`) — boot lúc T8 mở (~17:38Z) |
| ~17:38 | T8 mở: RAM avail ~2.217 MB lúc mở, balloon 3.907.000 kB (~60,6% trần); đọc LIMITS T8-155 + aggregate 155 §12.3; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 155 (không đổi); fixture /tmp MẤT theo reboot #52 (không còn `/tmp/n2/clips/`) |
| 17:41:10 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round156-t8/diag-stall-156t8.sh`, readlink + test -x xác nhận** |
| 17:41–17:42:02 | **Rebuild fixture /tmp LẦN 1 (quy tắc (l) mới — TRƯỚC harness lần 1): md5 khớp đợt 125** (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549; blend media bền còn nguyên) |
| 17:42:21 | Waiter T8 (lần 1) bắt đầu trên boot `5353ed19` (deadline 19:30Z 20/11 — xem F-156-T8-3 về lỗi ngày trong script); poll 1: t4=0 postboot=0 |
| 18:00:10 | T5 POSTBOOT_PASS cho boot `5353ed19` (dpkg 795, cache 110, lists 75) — waiter postboot=1 từ poll ~30 |
| 18:02:49 | T4 cửa yên mở poll #29 (RAM 1.360 MB) — chạy attempt1 |
| 18:07:10 | T4 attempt1 xong exit 0: 20/20, lớp B 5/5, NHƯNG tickCost median 67,0 ms > 60 → lượt KHÔNG hợp lệ, retry |
| 18:10:12 | T4 attempt2 xong exit 2: PAGE-WEDGED sau pass 11/20, partial JSON, retry |
| 18:13:07 | T4 attempt3 xong exit 2: PAGE-WEDGED sau pass 9/20 — HẾT ngân sách 3/3, poller thoát |
| 18:26:15 | **REBOOT ỨNG VIÊN (boot `062850d8`, T8 đếm #53)** — giết waiter lần 1 giữa poll 45 + lệnh sleep-check của T8 (SIGTERM ~18:26:16Z); boot `5353ed19` sống 4.026 s |
| 18:27–18:28:25 | **Rebuild fixture LẦN 2 (quy tắc (l), ngay khi waiter khởi động lại): md5 khớp đợt 125**; log waiter lần 1 sao lưu sang `wait-t4-t5-boot5353ed19.log` (46 dòng, 45 poll) |
| 18:28:32 | Waiter T8 (lần 2) khởi động lại trên boot `062850d8` (deadline 19:30Z 20/11) |
| 18:29:43 | **REBOOT ỨNG VIÊN (boot `447f0efe`, T8 đếm #54 / coordinator + cờ T4 gọi #53)** — giết waiter lần 2 sau 2 poll + làm restart service; boot `062850d8` chỉ sống 208 s |
| 18:30–18:31:07 | **Rebuild fixture LẦN 3 (quy tắc (l)): md5 khớp đợt 125**; log waiter lần 2 sao lưu sang `wait-t4-t5-boot062850d8.log` (3 dòng, 2 poll) |
| 18:31:14 | Waiter T8 (lần 3) khởi động lại trên boot `447f0efe` |
| 18:34 | Cờ T4 `round156-t4.done` xuất hiện (viết 18:34Z + addendum 18:35:44Z về reboot `447f0efe`) — waiter t4=1 từ poll 6 lần 3 |
| 19:04:44 | **REBOOT ỨNG VIÊN (boot `c99a1045`, T8 đếm #55)** — giết waiter lần 3 giữa poll 34 + làm restart service; boot `447f0efe` sống 2.101 s |
| 19:05–19:06:16 | **Rebuild fixture LẦN 4 (quy tắc (l)): md5 khớp đợt 125**; log waiter lần 3 sao lưu sang `wait-t4-t5-boot447f0efe.log` (35 dòng, 34 poll) |
| 19:06:25 | Waiter T8 (lần 4) khởi động lại trên boot `c99a1045` (deadline 19:30Z 20/11) |
| 19:30:00 | **Hạn waiter ĐÚNG (20/11) trôi qua — waiter lần 4 KHÔNG tự thoát do lỗi ngày trong script (deadline ghi 21/11 thay vì 20/11 — xem F-156-T8-3)**; poll 25 ghi 19:30:26Z vẫn GATE-NOT-YET |
| 19:33:41 | **T8 kill tay waiter lần 4 + ghi dòng WAIT-DEADLINE 19:30Z 20/11 (poll 28) — GATE NOT MET** (t4=1, postboot=0); T5 đã đóng, không có POSTBOOT_PASS cho boot mới |
| 19:33:57 | **T8 tự kiểm postboot boot `c99a1045`: ĐẦY ĐỦ** (lib 6/6, GST 269, dpkg.log 1.545, cache 178, lists 39) — xem F-156-T8-5 |
| 19:34:16–19:36:54 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — SAU waiter hết hạn, KHÔNG có lượt yên hợp lệ nào |
| 19:37:44–19:53:25 | **Harness (MỘT lần chạy duy nhất): 6/6 PASS, 0 KẸT** (xem §2); fixture đã kiểm còn nguyên ngay trước khi chạy (md5 `fbaa3d1a`) |
| 19:55 | Cờ `round156-t8.done` (1.319 B, TRONG hạn ~20:00Z); kiểm cuối + LIMITS + stage file hoàn thiện sau đó |

## A. O8 — PASS 3/3 trên boot `c99a1045`, SAU WAITER HẾT HẠN (THỦ TỤC (i), KHÔNG CÓ LƯỢT YÊN HỢP LỆ)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 19:34:16–19:34:5x | 0 | **21/21 PASS** — S1 PASS 19:34:31Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 19:35:12–19:35:5x | 0 | **21/21 PASS** — S1 PASS 19:35:23Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 19:36:02–19:36:54 | 0 | **21/21 PASS** — S1 PASS 19:36:23Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-20T19-34-17-c99a1045-pid10439.json` 21 kết quả `ok=true` 21/21, md5 `78ac5a61`; attempt2 `o8w-clicktest-report-2026-11-20T19-35-12-c99a1045-pid10785.json` 21/21 `ok=true`, md5 `831d4b9b` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-20T19-36-02-c99a1045-pid11127.json` 21/21 `ok=true`, md5 `7e4d9dd9`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng khối `run`, cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `c99a1045` theo tự kiểm postboot của T8 lúc 19:33:57Z). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH).
- Driver O8 giữ 1 lock vite `t8-round156` suốt lượt (nhả 19:36:54Z; vite sau release curl 5560/5554 = 000000 — vite đã tắt, đúng).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-156t8.mjs`, `node --check` OK — bản copy từ 155, chưa dùng) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 11 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `c99a1045`, sau waiter hết hạn 19:30Z, KHÔNG có lượt yên hợp lệ nào). Giống đợt 154/155 (parent quyết (f) đợt 155: GIỮ 11, KHÔNG LÊN 12). T8 KHÔNG tự chốt chuỗi lên 12.
- **O8 đợt này 2'38" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28", 152: 2'51", 153: 2'53", 154: 3'02", 155: 2'56") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DUY NHẤT: 6/6 PASS, 0 KẸT (WebKit + Chromium qua system libs)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 19:37:48–19:38:58 | **PASS** — report `ok=true` (W2 PASS, E4 PASS 3→3 ended=true) |
| 2 | WebKit 85m4-hb128 | 0 | 19:39:13–19:41:33 | **PASS** — report `ok=true` (P1 sync 2,3 s, HB128 chảy suốt; P4 3/3 PASS, đồng bộ 1,3/2,0/3,5 s; P5 PASS 40 s 0 restart, seek kẹt dài nhất 0 mẫu) |
| 3 | WebKit 86n2 | 0 | 19:41:49–19:45:49 | **PASS** — report `ok=true` (P4 3/3 PASS, đồng bộ 1,8/2,4/2,1 s; P5 PASS 40 s 0 restart, seek kẹt dài nhất 0 mẫu) |
| 4 | Chromium 84l10 | 0 | 19:46:04–19:47:04 | **PASS** — report `ok=true` (W2 PASS, E4 PASS 6→6 ended=false) |
| 5 | Chromium 85m4 | 0 | 19:47:19–19:49:19 | **PASS** — report `ok=true` (P4 3/3 PASS, đồng bộ +2/+1/+1; P5 CÓ-RESTART (+1) ended-at-duration — tự nhiên, KHÔNG FAIL, seek kẹt 0 mẫu — xem F-156-T8-6) |
| 6 | Chromium 86n2 | 0 | 19:49:34–19:53:25 | **PASS** — report `ok=true` (P4 3/3 PASS, đồng bộ 1,0/1,0/1,0 s; P5 PASS 40 s 0 restart, seek kẹt 0 mẫu) |

- 6 report JSON kiểm độc lập bằng python, `finishedAt` khớp cửa sổ chạy từng pha: WebKit 19:38:53.845Z (`ok=true`) / 19:41:25.693Z (`ok=true`) / 19:45:40.920Z (`ok=true`); Chromium 19:47:01.312Z / 19:49:18.517Z / 19:53:17.735Z (cả ba `ok=true`).
- Môi trường: system libs trên boot `c99a1045` (T8 tự kiểm postboot 19:33:57Z: lib đủ 6/6, GST 269). **WebKit launch THÀNH CÔNG cả 3 pha bằng system libs** — không cần lần chạy DEBROOT thứ hai (như đợt 155).
- **85m4 HẾT KẸT giữ (đợt 153 kẹt, 154 PASS, 155 PASS, 156 PASS); chuỗi "P3 không kẹt" 2 → 3 (TIẾP TỤC).** 86n2 P4-lần2 PASS lần thứ 8 liên tiếp tính theo lần chạy có verdict (nối tiếp lần thứ 7 ở đợt 155; T10 đối chiếu chuỗi đầy đủ).
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn đã đủ 6/6) — ghi rõ để T10 không tìm log lần 2.
- **KHÔNG CÓ harness lần 1 hỏng đợt này** (khác đợt 155: 0/6 exit 2 do thiếu fixture). Quy tắc (l) — kiểm/rebuild fixture TRƯỚC harness lần 1, ngay khi waiter khởi động lại sau reboot — đã áp dụng 4 lần trong phiên (sau mỗi reboot) và fixture còn nguyên lúc chạy harness 19:37:44Z. Đây là bằng chứng đầu tiên quy tắc mới ngăn được lỗi đợt 155.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT, 0 LIVE-DIAG, 0 FALSE-POSITIVE

- **Watchdog (i): 0 kích hoạt — ĐÚNG (không có kẹt để bắt).** 0 dòng `WATCHDOG-137` trong cả 6 log harness + 3 log O8; 0 snapshot `smoke/stall-*` (thư mục smoke không có thư mục stall nào).
- **Driver (1b) live-diag: 0 kích hoạt.** `live_diags=0` cả 6 lần chạy harness (không lần chạy nào im lặng >120 s; 85m4 WebKit HB128 chảy suốt P1–P5).
- **0 false-positive cả lượt.** 6 lần chạy harness + 3 lần chạy O8: 0 dòng `WATCHDOG-137`, 0 live-diag. Watchdog chỉ kích hoạt khi có kẹt thật (đợt 153: 1 kích hoạt đúng).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–155 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–156) + đường ổn định `t8-diag-stall.sh` → 156 (CẢ HAI symlink cập nhật 17:41:10Z, TRƯỚC mọi lần chạy — xem F-156-T8-9) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT OAN.** 0 snapshot stall (không có kẹt để chẩn đoán) |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–156) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không lần chạy nào im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-156t8.sh` (cột `balloon_kb`) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.370.164 max=5.956.232 (92,4% trần) mean=5.653.781; avail min=374 MB lúc 19:53:15Z (trong lúc chạy 86n2 Chromium) — xem F-156-T8-7 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 19:47:04Z), 85m4 PASS (exit 0, 19:49:19Z), 86n2 PASS (exit 0, 19:53:25Z)** | N cộng dồn **N=18 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** | Baseline lúc tự kiểm postboot 19:33:57Z: dmesg EPERM tái xác nhận; journalctl -k "-- No entries --" / rỗng — như các đợt trước |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/src/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không (bản sửa T0-152 F-151-T10-2 còn nguyên) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không (như trên) |

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi nhỏ so với đợt 155: nhãn log `LIVE-DIAG-155` → `LIVE-DIAG-156`, deadline waiter 16:30Z 20/11 → 19:30Z (NHƯNG ghi nhầm ngày 21/11 thay vì 20/11 — xem F-156-T8-3), lock `t8-round155` → `t8-round156` — chỉ chuỗi/hằng số trong bản copy, không chạm script repo. Script trích số liệu `extract-156t8.py`: sửa hằng WAIT1 ngay khi copy (boot `5353ed19`, bài học F-155-T8-6) + chống crash khi log waiter lần 1 vắng — nhưng script chỉ đọc 2 log waiter, bỏ sót lần 2 + lần 3 (xem F-156-T8-4); các bản copy driver Chromium-only + debroot giữ nguyên mẫu 155 (đổi nhãn 155→156), KHÔNG dùng đợt này.

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round156` 19:36:54Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 19:53:25Z).
- Kiểm cuối ~19:54Z (bằng script trích số liệu): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: 0; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown); boot `c99a1045` ổn định (btime 1795201484 không đổi từ 19:04:44Z).
- `/tmp/.X11-unix/` trống 0 file lúc kiểm cuối (Xvfb :199 của T8 đã dọn socket của mình; :188 O8-WebKit + :197 O8-Chromium cũng đã dọn).
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **Gate đợt này KHÔNG PHẢI gate chuẩn (i) — và KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO** (xem §0/§1/F-156-T8-5): T4 #25: 3 attempt, 0 hợp lệ (attempt1 tickCost median 67,0 ms > 60; attempt2/3 PAGE-WEDGED exit 2) + waiter hết hạn 19:30Z 20/11 (GATE NOT MET: t4=1, postboot=0) + T8 tự kiểm postboot boot `c99a1045` đầy đủ lúc 19:33:57Z. Đừng trích "sau lượt yên hợp lệ" hay "qua gate chuẩn (i)" cho đợt này. **Chuỗi WebKit FULL PASS 11 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 12. Đây là đợt thứ ba liên tiếp 0 lượt yên hợp lệ (154, 155, 156).
2. **Harness đợt này CHỈ CÓ MỘT lần chạy (6/6 PASS)** — không có lần 1 hỏng như đợt 155; quy tắc fixture mới đã ngăn được lỗi đó. Đừng tìm log harness lần 2 đợt này.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `c99a1045` theo tự kiểm postboot của T8. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH).
4. **Chromium 85m4 P5 CÓ-RESTART (+1) — tự nhiên, KHÔNG PHẢI kẹt, KHÔNG PHẢI FAIL** (xem F-156-T8-6): restart tại dtResetMs 30.041, causeTag `ended-at-duration` (video tới cuối 30 s tự nhiên, ticksEndedTrue=1), seek kẹt 0 mẫu; report `ok=true`. Chromium 85m4 P4-lần1 delta=+2 (vẫn PASS). Chromium 84l10 E4 `ended=false` (như đợt 154, khác đợt 155 `ended=true` — chỉ ghi nhận khác biệt, không phải FAIL; E4 vẫn PASS).
5. **Balloon KHÔNG ghim trần trong cửa sổ harness T8** (0 mẫu ghim, n=32, max 92,4% trần) — nhưng balloon ĐÃ ghim trần 100% (6.443.824 kB) lúc T8 tự kiểm postboot 19:33:57Z, NGOÀI cửa sổ sampler; avail min 374 MB rơi vào lúc chạy 86n2 Chromium; chuỗi ghim trần phán bằng sampler T9 (giao T10).
6. **RAM avail min 374 MB lúc 19:53:15Z (trong lúc chạy 86n2 Chromium)** — thấp nhất trong các đợt gần đây (155: 622 MB; 154: 564 MB; 153: 306 MB); chờ T9 đối chiếu bằng sampler toàn đợt trước khi kết luận gì về RAM phiên.
7. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–156 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn. O8 webkit/headed sau sửa T0: kiểm kích thước lúc push.
8. **T8 ĐÓNG TRONG hạn cờ ~20:00Z** (cờ viết 19:55Z) — dù 3 reboot giữa phiên + waiter hết hạn 19:30Z + lỗi ngày deadline trong script waiter (F-156-T8-3). Hạn cứng 20:30Z không bị đe dọa quá 5 phút; LIMITS hoàn thiện sau cờ vài phút.
9. **Số hiệu reboot giữa phiên CHƯA CHỐT — T8 và coordinator/T4 lệch nhau 1 số** (xem F-156-T8-1/2/3): T8 đếm `062850d8` = #53, `447f0efe` = #54, `c99a1045` = #55; coordinator + cờ T4 gọi `447f0efe` là #53 (bỏ qua boot `062850d8` sống 208 s). Đừng trích số hiệu reboot đợt 156 cho tới khi T2/T10 phán.

## 8. Sai số mới (F-156-T8-N)

- **F-156-T8-1 — REBOOT ỨNG VIÊN (T8 đếm #53) GIỮA PHIÊN (boot `062850d8`, btime 18:26:15Z):** btime /proc/stat 18:26:15Z (epoch 1795199175); boot `5353ed19` (#52, btime 17:19:09Z) → `062850d8-ac22...` (đầy đủ: `062850d8-b3d6-4161-a6f3-d7461f471523`); boot cũ sống 4.026 s (17:19:09Z → 18:26:15Z, stat→stat). Reboot giết waiter T8 (lần 1) giữa poll 45 (poll cuối 18:26:27Z — xem nghịch lý đồng hồ dưới) + lệnh sleep-check của T8 (SIGTERM ~18:26:16Z, sau 755 s chạy). **Nghịch lý đồng hồ:** poll 45 của waiter lần 1 mang timestamp 18:26:27Z trên boot cũ `5353ed19` — 12 s SAU btime boot mới (18:26:15Z). Đồng hồ boot cũ chạy nhanh hơn ≥ +12 s so với đồng hồ boot mới (mẫu #49: ≥ +20 s; #50: không thấy nghịch lý từ log T4). T8 sao lưu log waiter lần 1 trước khi khởi động lại (46 dòng, 45 poll) + rebuild fixture lần 2 ngay (18:27–18:28:25Z, md5 khớp). Mù tương ứng (nếu #53 đúng số) giao T2-156/T2-157 theo mẫu T10-148; T8 không tự chốt số hiệu reboot (xem §7.9).
- **F-156-T8-2 — REBOOT ỨNG VIÊN (T8 đếm #54 / coordinator + cờ T4 gọi #53) GIỮA PHIÊN (boot `447f0efe`, btime 18:29:43Z):** btime /proc/stat 18:29:43Z (epoch 1795199383); boot `062850d8` → `447f0efe-55aa-460d-8f11-3e002f6ccf44`; boot cũ chỉ sống 208 s (18:26:15Z → 18:29:43Z) — boot ngắn nhất chuỗi reboot đã thấy. Reboot giết waiter T8 (lần 2) sau 2 poll + làm restart service (lệnh sleep-check của T8 chết theo). T8 sao lưu log waiter lần 2 (3 dòng, 2 poll) + rebuild fixture lần 3 ngay (18:30–18:31:07Z, md5 khớp). **Lệch số hiệu:** T4-156 phát hiện boot này lúc kiểm cuối (addendum cờ T4 18:35:44Z) và gọi là "#53" — vì poller T4 đã thoát 18:13:07Z nên T4 không quan sát được boot `062850d8` sống 208 s ở giữa; coordinator chuyển tin theo số của T4 ("Mù #85? giao T2-157"), trong khi cờ T4 ghi "Mù #85? giao T2-156". T8 ghi cả hai, chờ T2/T10 phán số hiệu + mù (bằng chứng gốc của T8: boot_id + btime + uptime 0–1 phút + waiter poll trên từng boot — xem §1). T8 không tự chốt giây reboot.
- **F-156-T8-3 — REBOOT ỨNG VIÊN (T8 đếm #55) GIỮA PHIÊN (boot `c99a1045`, btime 19:04:44Z) + LỖI NGÀY DEADLINE TRONG SCRIPT WAITER (LỖI T8):** btime /proc/stat 19:04:44Z (epoch 1795201484); boot `447f0efe` → `c99a1045-ac22-47bb-8a43-a568c2b03051`; boot cũ sống 2.101 s (18:29:43Z → 19:04:44Z). Reboot giết waiter T8 (lần 3) giữa poll 34 (poll cuối 19:04:15Z) + làm restart service. T8 sao lưu log waiter lần 3 (35 dòng, 34 poll) + rebuild fixture lần 4 ngay (19:05–19:06:16Z, md5 khớp) + khởi động lại waiter lần 4 (19:06:25Z). **Lỗi ngày deadline (lỗi T8, phát hiện 19:32:31Z):** script waiter mang `DEADLINE=$(date -d '2026-11-21 19:30:00 UTC' +%s)` — ngày 21/11 là ngày +07 (giờ địa phương), trong khi hạn đúng phải là 20/11 UTC (đợt mở 00:35 +07 21/11 = 17:35:51Z 20/11; tiền lệ đợt 155 dùng đúng ngày UTC 20/11). Hậu quả: waiter lần 4 KHÔNG tự thoát ở hạn đúng 19:30:00Z 20/11 (poll 25 ghi 19:30:26Z vẫn GATE-NOT-YET; poll 26/27/28 tiếp tục tới 19:33:26Z). T8 phát hiện bằng cách đối chiếu `date +%s` (1.795.203.190 lúc 19:33:10Z) với `date -d '2026-11-21 19:30:00 UTC'` (1.795.289.400 — hơn ~24 h), kill tay waiter pid 2628 lúc 19:33:41Z và ghi dòng WAIT-DEADLINE 19:30Z 20/11 (poll 28) vào log — GATE NOT MET (t4=1, postboot=0). Chậm 3 phút 41 s so với hạn đúng; không ảnh hưởng verdict (gate vốn không thể đạt — postboot=0 vĩnh viễn vì T5 đã đóng; O8/harness vẫn chạy sau hạn đúng, trong hạn cờ). **Khắc phục cho T8-157: deadline waiter phải dùng NGÀY UTC của lượt mở (kiểm `date -d` ra epoch trước khi khởi động waiter).**
- **F-156-T8-4 — SCRIPT TRÍCH SỐ LIỆU `extract-156t8.py` CHỈ ĐỌC 2 LOG WAITER (BỎ SÓT LẦN 2 + LẦN 3):** script (copy từ đợt 155) đọc `WAIT1` (log waiter lần 1, boot `5353ed19`) + `WAIT` (log waiter hiện tại, lần 4) — đúng thiết kế đợt 155 (chỉ có 2 lần waiter). Đợt 156 có 4 lần waiter do 3 reboot giữa phiên; log lần 2 (`wait-t4-t5-boot062850d8.log`, 2 poll) và lần 3 (`wait-t4-t5-boot447f0efe.log`, 34 poll) KHÔNG xuất hiện trong output extract. T8 đếm tay từ file gốc: lần 1: 45 poll; lần 2: 2 poll; lần 3: 34 poll; lần 4: 28 poll + WAIT-DEADLINE — **tổng 109 poll, 0 lần GATE-FOUND**. Số liệu waiter trong LIMITS này dùng đếm tay, không dùng output extract cho mục waiter. **Khắc phục cho T8-157: extract script phải glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log`, không hard-code 2 file.**
- **F-156-T8-5 — GATE KHÔNG ĐẠT, CHẠY THEO THỦ TỤC (i) SAU WAITER HẾT HẠN 19:30Z 20/11 — KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO:** waiter lần 1 (boot `5353ed19`, 45 poll): t4=0 suốt, postboot=0 tới poll ~29 rồi =1 từ poll ~30 (đường (a), POSTBOOT_PASS của T5 cho boot `5353ed19` lúc 18:00:10Z) — chết theo reboot 18:26:15Z. Waiter lần 2 (boot `062850d8`, 2 poll): t4=0, postboot=0 — chết theo reboot 18:29:43Z. Waiter lần 3 (boot `447f0efe`, 34 poll): **t4=0 tới poll 5 rồi =1 từ poll 6 (18:36:14Z)** (cờ T4 xuất hiện 18:34Z), postboot=0 SUỐT — chết theo reboot 19:04:44Z. Waiter lần 4 (boot `c99a1045`, 28 poll): **t4=1 SUỐT, postboot=0 SUỐT** — T5 ĐÃ ĐÓNG (cờ `round156-t5.done` có) nên không có POSTBOOT_PASS cho boot mới qua đường (a); đường (b) cũng không (log gate0wait của T4 chỉ cho boot cũ `5353ed19`). T4 0 attempt live lúc hết hạn (poller T4 đã thoát 18:13:07Z; 0 process) → đủ điều kiện thủ tục (i) đợt 143: chạy sau waiter hết hạn kèm ghi rõ. **T8 tự kiểm postboot boot `c99a1045` lúc 19:33:57Z — ĐẦY ĐỦ:** POSTBOOT_PASS của T5 chỉ có cho boot cũ `5353ed19` (18:00:10Z); dpkg.log 1.545 dòng (tăng từ 795 lúc 18:26:15Z — replay tiếp tục trên các boot mới), cache 178 .deb, lists 39, lib đủ (grep libgstreamer/libevent/libEGL/libavif/libdw/libevdev = 6/6), GST 269 plugin. **RAM avail chỉ 521 MB + balloon ghim trần 100% (6.443.824 kB) lúc kiểm** — ngoài cửa sổ sampler harness; T9 đối chiếu (xem F-156-T8-7). O8 bắt đầu 19:34:16Z, harness bắt đầu 19:37:44Z — CẢ HAI SAU WAITER HẾT HẠN 19:30Z 20/11. **Lần thứ ba liên tiếp T8 chạy mà KHÔNG CÓ lượt yên hợp lệ nào trong đợt** (đợt 154, 155, 156). Nợ T4/T5-157: cửa yên không mở được vì RAM + load + reboot dồn dập — xem §9.6.
- **F-156-T8-6 — CHROMIUM 85m4 P5 CÓ-RESTART (+1) — TỰ NHIÊN, KHÔNG PHẢI KẸT, KHÔNG PHẢI FAIL + P4-lần1 delta=+2 + E4 `ended=false`:** P5 Chromium 85m4 (19:49:17.728Z): `P5 CÓ-RESTART (+1) — seek kẹt dài nhất 0 mẫu, extraEvents=[{dtResetMs:30041, causeTag:"ended-at-duration", ct:30, dur:30, seeking:false, paused:true, ticksEndedTrue:1, ...}]` — restart xảy ra vì video TỚI CUỐI 30 s tự nhiên (`ended-at-duration`, ct=30, dur=30, ended lật true đúng tick), không phải kẹt evaluate, không im lặng log; report `ok=true` ("KẾT QUẢ: KHÔNG FAIL"). Ghi nhận để T10 không đọc thành kẹt hay FAIL. P4 Chromium 85m4: lần1 delta=+2 (19:48:31Z), lần2/3 delta=+1 — vẫn PASS cả 3 (khác WebKit 85m4: +1/+1/+1). Chromium 84l10 E4: `ended=false` (6→6, ct cuối=3.968) — như đợt 154, KHÁC đợt 155 (`ended=true`); WebKit 84l10 E4 đợt này `ended=true` (3→3, ct cuối=4). Chỉ ghi nhận khác biệt, không phải FAIL (E4 vẫn PASS cả hai engine).
- **F-156-T8-7 — RAM SAMPLER HARNESS: n=32 MẪU HỢP LỆ:** log `ram-156t8.log` (1 lần chạy driver duy nhất — không bị truncate như đợt 155); số liệu trích: balloon min 5.370.164 / max 5.956.232 (92,4% trần) / mean 5.653.781, pinned=0; avail min 374 MB @19:53:15Z (trong lúc chạy 86n2 Chromium) / max 1.454 MB. Avail min 374 MB là thấp nhất các đợt gần đây (155: 622 MB; 154: 564 MB; 153: 306 MB) — nhưng 0 kẹt trong cả 6 lần chạy. Không ảnh hưởng verdict (0 mẫu ghim trần trong cả 32 mẫu hợp lệ). **Ngoài sampler:** balloon ghim trần 100% lúc tự kiểm postboot 19:33:57Z (F-156-T8-5) — T9 đối chiếu với sampler toàn đợt; chuỗi ghim trần phán bằng sampler T9 (giao T10).
- **F-156-T8-8 — HARNESS HEADER GHI "btime 19:04:55Z" SAI +11 s SO VỚI /proc/stat (19:04:44Z):** driver `run-webkit-156t8.sh` dòng 37 tính btime bằng `date -d @$(stat -c %Y /proc/1)` — tức mtime của `/proc/1` (thời điểm process 1 được tạo theo đồng hồ file), KHÔNG phải btime thật trong `/proc/stat` (epoch 1.795.201.484 = 19:04:44Z). Chênh +11 s, chỉ là nhãn header trong summary — mọi btime reboot trong LIMITS này đều lấy từ `/proc/stat` (chuẩn T2 dùng). Ghi nhận để T10 không dùng header harness làm btime reboot; T8-157 sửa driver dùng `awk '/^btime/' /proc/stat` cho đúng.
- **F-156-T8-9 — CHECKLIST (o) ĐÃ LÀM ĐÚNG CẢ HAI SYMLINK — GIỮ QUA 3 REBOOT:** lúc T8 mở (~17:38Z) `hidden_files/t8-diag-stall.sh` vẫn trỏ về `round155-t8/diag-stall-155t8.sh` (stale 1 đợt) và repo `apps/web/scripts/t8-diag-stall.sh` trỏ về `round155-t8/diag-stall-155t8.sh` (stale 1 đợt). T8 cập nhật CẢ HAI về `round156-t8/diag-stall-156t8.sh` lúc 17:41:10Z (trước mọi lần chạy), `readlink` + `test -x` xác nhận cả hai; kiểm cuối ~19:54Z cả hai VẪN trỏ 156 (giữ qua 3 reboot — symlink nằm trên home persistent, không mất theo reboot). Không có snapshot watchdog nào ghi nhầm thư mục đợt này (0 kẹt → 0 snapshot; đường diag đã đúng cả hai mối). **Về đề xuất T0-154 (sửa hằng `DIAG137_SCRIPT` trong 3 script harness về 1 mối duy nhất): T8-156 QUYẾT ĐỊNH KHÔNG SỬA trong phiên này** — phiên có 3 reboot giữa chừng, script đang chạy ổn, sửa hằng giữa phiên rủi ro cao hơn lợi ích; giao T0-157 cân nhắc sửa khi phiên ổn định (không có reboot giữa phiên) + kiểm thử đầy đủ. **Nợ đóng:** F-155-T8-5 đã sửa xong từ đợt 155, giữ qua đợt 156.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 11 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `c99a1045`, sau waiter hết hạn 19:30Z 20/11, KHÔNG có lượt yên hợp lệ nào (T4 #25: 3 attempt, 0 hợp lệ — đợt thứ ba liên tiếp). Giống đợt 154/155 (parent quyết (f) đợt 155: GIỮ 11, KHÔNG LÊN 12). T8 không tự chốt chuỗi lên 12.
2. **Chuỗi "P3 không kẹt" 2 → 3 (TIẾP TỤC) — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (f)/(h)/(k)/(p)).** 0 kẹt đợt này (một lần chạy driver duy nhất); 10 kẹt cộng dồn giữ nguyên (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1). Nếu đợt 157 cũng sạch thì chuỗi lên 4.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=18 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #25 KHÔNG CÓ lượt hợp lệ — 3 attempt, 0 hợp lệ (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-156: attempt1 tickCost median 67,0 ms > 60 (không hợp lệ); attempt2/3 PAGE-WEDGED exit 2 (sau pass 11/20 và 9/20 — chữ ký wedge của probe T4, KHÁC chữ ký kẹt evaluate của harness T8 — đừng gộp thành một lỗi). P3' cộng dồn không đổi (39/41 occurrence = 39/40 distinct-seq — xem LIMITS T4-156 để đối chiếu số tuyệt đối). Ba đợt liên tiếp (154, 155, 156) không có lượt yên hợp lệ. DEF/GAP đã ghi cơ chế "catch-up lag sau đóng băng" theo quyết parent (d)(i).
5. **Số hiệu reboot giữa phiên + mù tương ứng — giao T2/T10 phán (xem §7.9, F-156-T8-1/2/3):** T8 đếm 062850d8=#53 (18:26:15Z), 447f0efe=#54 (18:29:43Z), c99a1045=#55 (19:04:44Z); coordinator + cờ T4 gọi 447f0efe là #53 (bỏ qua boot 062850d8 sống 208 s). Mù #85? theo đếm coordinator/T4 (giao T2-156 theo cờ T4 / T2-157 theo tin coordinator); mù cho 062850d8 và c99a1045 chưa được đánh số — T2 đánh số lại toàn bộ theo phán quyết số hiệu.
6. **Cửa yên không mở được cả đợt vì RAM + load + reboot dồn dập — nợ T4/T5-157:** balloon ghim trần 100% lúc tự kiểm postboot 19:33:57Z + RAM avail tụt 374–521 MB lúc chạy + 3 reboot giữa phiên giết poller/waiter. Không phải lỗi T8, nhưng O8/harness đợt sau sẽ lại chạy theo thủ tục (i) nếu cửa yên vẫn đóng — parent cân nhắc có cần đổi chuẩn gate hay giữ nguyên. **Quy tắc mới T8-157: (a) deadline waiter dùng NGÀY UTC của lượt mở — kiểm `date -d` ra epoch trước khi khởi động waiter (F-156-T8-3); (b) extract script glob tất cả `wait-t4-t5-boot*.log` (F-156-T8-4); (c) driver harness dùng btime từ `/proc/stat`, không dùng `stat /proc/1` (F-156-T8-8).**
7. **Checklist (o) ĐÃ ĐÓNG (F-156-T8-9)** — cả hai symlink diag trỏ 156, giữ qua 3 reboot. Đề xuất sửa hằng `DIAG137_SCRIPT` về 1 mối duy nhất: T8-156 không sửa trong phiên nhiều reboot; giao T0-157 cân nhắc khi phiên ổn định.
8. **RAM avail min 374 MB + balloon max 92,4% (cửa sổ harness) / ghim trần 100% lúc tự kiểm postboot — chờ T9 đối chiếu** (F-156-T8-5/7); chuỗi ghim trần phán bằng sampler T9 (giao T10); balloon ghim trần lúc tự kiểm postboot cần T9 đối chiếu với sampler toàn đợt.
9. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-156 xác nhận số lần — lần thứ 10 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS cho boot `c99a1045` chưa có (T5 đã đóng trước reboot — giao T5-157 theo mẫu quyết (q) đợt 155).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 156 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155) — 0 KẸT, CHUỖI 2 → 3 (TIẾP TỤC)

## B1. Trạng thái giả thuyết sau đợt 156 (đứng nguyên — không mở giả thuyết mới)

| Giả thuyết | Trạng thái đợt 155 | Trạng thái đợt 156 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — CHỈ GIÁM SÁT THỤ ĐỘNG, 0 KẸT MỚI (xem B3)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — không có kẹt mới để đối chiếu)** |

- Đợt 156 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p): **0 kẹt trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không có chữ ký kẹt mới; không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 374 MB trong cửa sổ harness + balloon max 92,4% — cửa sổ "nặng" nhất về RAM avail kể từ đợt 153 (306 MB, 1 kẹt) nhưng đợt này 0 kẹt; balloon ghim trần 100% lúc tự kiểm postboot ngoài cửa sổ harness. H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-157 đối chiếu tiếp.
- Lưu ý phân biệt chữ ký: T4 attempt2/3 PAGE-WEDGED (probe T4, exit 2, partial JSON sau pass 11/20 và 9/20) là chữ ký của probe T4 — KHÁC chữ ký kẹt evaluate im lặng của harness T8 (exit 124 / WATCHDOG-137). Đợt này T8 0 kẹt thật; đừng gộp wedge của T4 vào đếm kẹt H3.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 156

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–156) + đường ổn định `t8-diag-stall.sh` → 156 (CẢ HAI symlink cập nhật 17:41:10Z; kiểm cuối vẫn trỏ 156 — xem F-156-T8-9) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–156) | 6 lần chạy harness; `live_diags=0` cả 6 lần | **0 kích hoạt — ĐÚNG THIẾT KẾ** (không lần chạy nào im lặng >120 s) |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.370.164 max=5.956.232 (92,4% trần) mean=5.653.781; avail min=374 MB lúc 19:53:15Z (trong lúc chạy 86n2 Chromium); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness (nhưng balloon ĐÃ ghim trần 100% lúc tự kiểm postboot 19:33:57Z — xem F-156-T8-5) |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 19:47:04Z), 85m4 PASS (exit 0, 19:49:19Z), 86n2 PASS (exit 0, 19:53:25Z)** | N cộng dồn **N=18 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → 0 lần kích hoạt** | Baseline lúc tự kiểm postboot 19:33:57Z: dmesg EPERM tái xác nhận; journalctl -k "-- No entries --" / rỗng; không có snapshot timeout124/live-diag nào đợt này |

## B3. Chữ ký kẹt — đợt 156: 0 KẸT (85m4 HẾT KẸT GIỮ ĐỢT THỨ 3)

- **Đợt 156: 0 KẸT THẬT.** WebKit 85m4 PASS đủ P1–P5 (P1 sync 2,3 s, HB128 chảy suốt P1-phaseA n=18→76 trong 20 s đầu; P4 1,3/2,0/3,5 s; P5 40 s 0 restart, seek kẹt dài nhất 0 mẫu). Không có evaluate im lặng nào >60 s (0 WATCHDOG-137), không có khoảng im lặng log nào >120 s (0 live-diag), không có exit 124 nào.
- **Đối chiếu với kẹt đợt 153 (85m4 P1-phaseA, chữ ký sớm nhất):** đợt 153 kẹt ngay evaluate đầu P1-phaseA, trước HB128 đầu tiên; đợt này P1-phaseA chạy xong với HB128 n=18→76, P1 PASS 19:39:25Z. Cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), khác boot (`c99a1045` vs #46) và khác cửa sổ RAM (avail min 374 MB vs 306 MB; balloon max 92,4% vs 96,3%) — chỉ là tương quan quan sát được trong 1 lần chạy; H1 đã bác bỏ, H3 chỉ giám sát thụ động.
- **Không có điểm pha nào khác "nóng" đợt này:** 84l10/86n2 WebKit + cả 3 pha Chromium đều PASS đủ P1–P5 (trừ ghi chú Chromium 85m4 P5 CÓ-RESTART ended-at-duration + P4-lần1 delta=+2 và Chromium 84l10 E4 `ended=false` — xem F-156-T8-6, không phải kẹt, không phải FAIL).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 156: 0 KẸT, CHUỖI 2 → 3 (TIẾP TỤC)

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: **6 lần chạy, 0 kẹt, 0 FAIL**. Chuỗi **0 → 1**.
- Đợt 143: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **1 → 2**.
- Đợt 144: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **2 → 3**.
- Đợt 145: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **3 → 4**.
- Đợt 146: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **4 → 5**.
- Đợt 147: **6 lần chạy harness, 0 kẹt, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **5 → 6**.
- Đợt 148: **6 lần chạy harness, 1 KẸT (86n2 WebKit, P4-lần2, exit 124), 0 FAIL oan** + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **6 → 0 (ĐỨT)**.
- Đợt 149: **8 lần chạy harness hoàn thành, 0 KẸT** (lần 1: WebKit 84l10/85m4 PASS + 86n2 KHÔNG VERDICT do reboot; lần 2: WebKit 0/3 FAIL LAUNCH môi trường + Chromium 3/3 PASS; lần 3: WebKit 3/3 PASS qua DEBROOT) + **3 lần chạy O8, 0 kẹt, 0 FAIL**. Chuỗi **0 → 1**.
- Đợt 150: **5 lần chạy harness hoàn thành, 2 KẸT (85m4 P1-phaseA boot1 + 86n2 P5-resetPlayhead0 boot2, cả hai exit 124)** + 1 lần 86n2 KHÔNG VERDICT (reboot #41 giết giữa P4) + **3 lần chạy O8, 0 kẹt, 0 FAIL** + Chromium lần 2 84l10 PASS (exit 0, 01:51:51Z), 85m4 PASS (exit 0, 01:54:07Z), 86n2 PASS (exit 0, 01:58:12Z). Chuỗi **1 → 0 (ĐỨT)**.
- Đợt 151: **4 lần chạy harness hoàn thành, 2 KẸT (85m4 P5-phaseB-long boot1 + 85m4 P1-waitForPlaySync boot2, 1 exit 124 + 1 không verdict exit do reboot #42 giết giữa lúc kẹt)** + 1 lần 85m4 KHÔNG VERDICT EXIT (reboot giết — nhưng đếm là KẸT theo chữ ký, xem F-151-T8-2) + 1 lần 86n2 KHÔNG VERDICT (chưa chạy, reboot giết driver) + **3 lần chạy O8, 0 kẹt, 0 FAIL** + Chromium lần 2 84l10 PASS (exit 0, 04:41:42Z), 85m4 PASS (exit 0, 04:43:57Z), 86n2 PASS (exit 0, 04:48:03Z). Chuỗi **0 → 0 (VẪN ĐỨT)**.
- Đợt 152: **6 lần chạy harness hoàn thành, 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 06:18:57Z, 85m4 PASS 06:21:32Z, 86n2 PASS 06:25:48Z; Chromium 84l10 PASS 06:27:14Z, 85m4 PASS 06:29:39Z, 86n2 PASS 06:33:45Z — tất cả exit 0, report `ok=true`). Chuỗi **0 → 1 (BẮT ĐẦU LẠI)**.
- Đợt 153: **5 lần chạy harness hoàn thành, 1 KẸT THẬT (85m4 WebKit, P1-phaseA, exit 124)** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 10:36:31Z, 86n2 PASS 10:56:14Z; Chromium 84l10 PASS 10:57:40Z, 85m4 PASS 11:00:05Z, 86n2 PASS 11:04:11Z — tất cả exit 0 trừ 85m4 WebKit, report `ok=true` trừ 85m4 WebKit `ok=false`). Chuỗi **1 → 0 (ĐỨT)**.
- Đợt 154: **6 lần chạy harness hoàn thành, 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 13:36:12Z, 85m4 PASS 13:38:48Z, 86n2 PASS 13:43:03Z; Chromium 84l10 PASS 13:44:29Z, 85m4 PASS 13:46:54Z, 86n2 PASS 13:51:00Z — tất cả exit 0, report `ok=true`). Chuỗi **0 → 1 (BẮT ĐẦU LẠI)**.
- Đợt 155: **6 lần chạy harness LẦN 2 hoàn thành, 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 16:39:49Z, 85m4 PASS 16:42:25Z, 86n2 PASS 16:46:40Z; Chromium 84l10 PASS 16:48:06Z, 85m4 PASS 16:50:31Z, 86n2 PASS 16:54:37Z — tất cả exit 0, report `ok=true`). Chuỗi **1 → 2 (TIẾP TỤC)**. (Lần 1: 0 lần chạy hoàn thành — 6/6 exit 2 do thiếu fixture sau reboot #50, KHÔNG ĐẾM.)
- Đợt 156: **6 lần chạy harness hoàn thành (MỘT lần chạy driver duy nhất, KHÔNG có lần 1 hỏng), 0 KẸT, 0 FAIL** + **3 lần chạy O8, 0 kẹt, 0 FAIL** (WebKit 84l10 PASS 19:38:58Z, 85m4 PASS 19:41:33Z, 86n2 PASS 19:45:49Z; Chromium 84l10 PASS 19:47:04Z, 85m4 PASS 19:49:19Z, 86n2 PASS 19:53:25Z — tất cả exit 0, report `ok=true`). Chuỗi **2 → 3 (TIẾP TỤC)**.
- **Mười lần kẹt vẫn là:** đợt 134/135 (3 lần) + đợt 141 (1 lần) + đợt 148 (1 lần) + đợt 150 (2 lần) + đợt 151 (2 lần) + đợt 153 (1 lần). Không kẹt nào tái hiện ở Chromium đối chứng (N=18 mỗi pha tới đợt 156, 0 kẹt).

## B5. Yếu tố chung khác — đợt 156: #25 KHÔNG CÓ lượt hợp lệ (T4 3 attempt, 0 hợp lệ); 3 reboot giữa phiên; replay tiếp tục trên boot mới

- T4 đợt này: **KHÔNG CÓ lượt hợp lệ — 3 attempt, 0 hợp lệ** (attempt1 tickCost median 67,0 ms > 60; attempt2/3 PAGE-WEDGED exit 2). O8/harness chạy theo THỦ TỤC (i) sau waiter hết hạn (không phải gate chuẩn, không sau lượt yên — xem F-156-T8-5). Kẹt probe T4 (PAGE-WEDGED) và kẹt harness T8 (evaluate im lặng) là hai chữ ký khác nhau — đừng gộp thành một lỗi; đợt này T4 0 lượt hợp lệ (không có probe nào cho verdict yên), T8 0 kẹt thật.
- 3 reboot giữa phiên (18:26:15Z, 18:29:43Z, 19:04:44Z — số hiệu chờ T2/T10 phán; boot `c99a1045` ổn định suốt O8 + harness (19:34–19:53Z).
- Replay apt: dpkg.log 795 (18:00Z, boot `5353ed19`) → 1.545 (19:33:57Z, boot `c99a1045`) — replay TIẾP TỤC trên các boot mới (cache 110 → 178, lists 75 → 39); T5 theo dõi đợt 157 (POSTBOOT_PASS cho boot `c99a1045` chưa có — giao T5-157).
- Vite server còn sống lúc chạy (không có kẹt để đối chiếu) — không có bằng chứng mới về vite trong đợt này.

## B6. Kết luận điều tra + bước kiểm tiếp theo (KHÔNG đổi production)

- H1: BÁC BỎ (đứng nguyên). H2: KHÔNG ỦNG HỘ (đứng nguyên). H3: VẪN MỞ, wedge "chết lặng" — giám sát thụ động đợt 156, 0 kẹt thật mới, chuỗi 2 → 3 (tiếp tục).
- **H3-D1: BÁC BỎ (đứng nguyên, đợt 151; khẳng định lại đợt 153 — không có kẹt mới đợt này để đối chiếu).**
- **O8 WebKit đợt 142 đã kết luận xong ở đợt 143; đợt này O8 PASS 3/3 thường kỳ, SAU WAITER HẾT HẠN 19:30Z 20/11, KHÔNG CÓ LƯỢT YÊN HỢP LỆ NÀO — chuỗi FULL PASS 11 → ? (chờ T10/parent phán).** Không mở điều tra mới về O8.
- **Lượt yên #25 KHÔNG CÓ lượt hợp lệ — gate harness đợt này theo THỦ TỤC (i), không phải gate chuẩn, không sau lượt yên.** Parent phán xem nhãn này có đủ chuẩn để tính chuỗi FULL PASS hay không (xem §9.1/§9.6).

### B6a. Giám sát thụ động đợt 156 — 0 kẹt, không có chữ ký mới

Theo quyết (f), T8-156 chỉ ghi nhận chữ ký kẹt nếu kẹt tái diễn. Kết quả: 0 kẹt thật trong 6 lần chạy harness (85m4 WebKit HẾT KẸT giữ đợt thứ 3 — P1-phaseA chạy xong với HB128 chảy suốt, khác hẳn chữ ký sớm nhất đợt 153) + 0 kẹt trong 3 lần chạy O8. Không có bảng đối chiếu wedge mới đợt này (không có snapshot trong lúc kẹt — vì không có kẹt). Nếu đợt 157 kẹt lại ở cùng điểm P1-phaseA sớm thì T8-157 ghi nhận thành mẫu tái diễn; quyết đóng/mở lại điều tra là việc parent.

---

## Phụ lục — số liệu trích bằng script từ log gốc (không gõ tay)

Script: `hidden_files/round156-t8/extract-156t8.py` (chạy ~19:54Z, output đầy đủ tại `hidden_files/round156-t8/smoke/extract-156t8-output.txt`). Mọi số dưới đây đều là output của script đó, đọc từ file gốc — NGOẠI TRỪ số liệu waiter lần 2 + lần 3 (script chỉ đọc 2 log — xem F-156-T8-4, T8 đếm tay từ file gốc).

- Harness (từ `smoke/run-webkit-summary.txt`): WebKit 84l10 start 19:37:48Z exit 0 end 19:38:58Z live_diags=0; WebKit 85m4 start 19:39:13Z exit 0 end 19:41:33Z live_diags=0; WebKit 86n2 start 19:41:49Z exit 0 end 19:45:49Z live_diags=0; Chromium 84l10 start 19:46:04Z exit 0 end 19:47:04Z live_diags=0; Chromium 85m4 start 19:47:19Z exit 0 end 19:49:19Z live_diags=0; Chromium 86n2 start 19:49:34Z exit 0 end 19:53:25Z live_diags=0. ALL DONE 19:53:25Z, ec webkit 0/0/0, chromium 0/0/0.
- Report JSON (6 file): 6× `ok=true` (WebKit 84l10 finishedAt 19:38:53.845Z; WebKit 85m4 19:41:25.693Z; WebKit 86n2 19:45:40.920Z; Chromium 84l10 19:47:01.312Z; Chromium 85m4 19:49:18.517Z; Chromium 86n2 19:53:17.735Z).
- O8 JSON stamped (3 file): WebKit attempt1 `o8w-clicktest-report-2026-11-20T19-34-17-c99a1045-pid10439.json` 21/21 md5 `78ac5a61`; WebKit attempt2 `o8w-clicktest-report-2026-11-20T19-35-12-c99a1045-pid10785.json` 21/21 md5 `831d4b9b`; Chromium `o8-clicktest-report-2026-11-20T19-36-02-c99a1045-pid11127.json` 21/21 md5 `7e4d9dd9`.
- O8 log: PASS S1 6 dòng, FAIL S1 0, HARNESS LỖI 0, Target crashed 0, WATCHDOG-137 0; `O8 DONE 2026-11-20T19:36:54Z webkit1=0 webkit2=0 chromium=0`.
- Sampler (n=32 mẫu hợp lệ): balloon min 5.370.164 / max 5.956.232 (92,4% trần) / mean 5.653.781, pinned=0; avail min 374 MB @19:53:15Z / max 1.454 MB.
- Watchdog/live-diag: WATCHDOG-137 trong summary 0, LIVE-DIAG-156 trong summary 0, WATCHDOG-137 trong log 85m4 0, probe TIMEOUT 30s False; stall dirs [].
- MD5 cây lúc đóng: preview.tsx 530e10a7, media.ts 2c384ed1, vite.config.ts ee80d093, 84l10 b8c08a7c, 85m4 610ee003, 86n2 628088bd, O8w 4994b4fc, O8h c8acd72e.
- Waiter (4 lần, đếm tay từ file gốc — F-156-T8-4): lần 1 (boot 5353ed19): 45 poll, GATE-FOUND False, WAIT-DEADLINE False (chết theo reboot 18:26:15Z); lần 2 (boot 062850d8): 2 poll, GATE-FOUND False, WAIT-DEADLINE False (chết theo reboot 18:29:43Z); lần 3 (boot 447f0efe): 34 poll, GATE-FOUND False, WAIT-DEADLINE False (chết theo reboot 19:04:44Z); lần 4 (boot c99a1045): 28 poll + WAIT-DEADLINE 19:30Z 20/11 19:33:41Z (ghi tay sau khi kill waiter do lỗi ngày — F-156-T8-3), GATE NOT MET; t4=1 từ poll 1 lần 4 (cờ T4 có từ 18:34Z); postboot=1: 0 dòng (lần 4). Tổng 109 poll, 0 lần GATE-FOUND.
- Kiểm cuối: boot c99a1045, btime 1795201484; ps sót 0; X11 files 0; lock TRỐNG, 0 ticket + 101 cooldown; symlink repo + hidden-root đều → `round156-t8/diag-stall-156t8.sh`.
- Oversize: 86n2 script 39.194 B (>37.768 B); 84l10 32.680 B; 85m4 37.111 B.
