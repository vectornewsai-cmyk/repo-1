# Đợt 159 T8 — O8 PASS 3/3 QUA GATE CHUẨN CÙNG-BOOT #59 + HARNESS 6/6 SẠCH TRÊN BOOT MỚI SAU REBOOT GIỮA PHIÊN (ATTEMPT 1 BỊ REBOOT GIẾT)

Ngày: 21/11/2026 (lượt cron 09:35 +07 21/11 = 02:35:51Z 21/11; T8 mở ~02:38Z, đóng ~03:35Z — TRONG hạn cờ ~05:00Z, hạn cứng 05:30Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy QUA GATE CHUẨN CÙNG-BOOT (GATE-FOUND poll 21 lúc 03:00:24Z: cờ T4 + POSTBOOT_PASS đường (a) của T5 cho boot `eec65561` #59; lượt yên #28 CÓ lượt hợp lệ #24 trên ĐÚNG boot đo); (2) harness đứng — attempt 1 BỊ REBOOT GIẾT giữa WebKit 84l10 (không verdict), attempt 2 chạy lại trên boot mới: **6/6 PASS, 0 kẹt**; (3) watchdog 0 kích hoạt (đúng — không có kẹt để bắt), 0 false-positive; live-diag 0 kích hoạt (không có kẹt để thử thách — điểm mù F-158-T8-4 KHÔNG được kiểm chứng đợt này, vẫn là giới hạn đứng theo quyết (u) đợt 158); (4) H3: VẪN MỞ, chỉ giám sát thụ động (quyết (i) đợt 158 — GIỮ NGUYÊN; 85m4 KHÔNG tái kẹt lần 3 nên CHƯA đủ điều kiện mở điều tra); (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau, md5 khác nhau, bản copy dự phòng khớp md5; (6) **1 REBOOT giữa phiên** — boot mới `e590ae0a`, btime 03:05:59Z, giết harness attempt 1 giữa WebKit 84l10 (xem §0/F-159-T8-1); O8 đã xong TRƯỚC reboot nên không ảnh hưởng; (7) deadline waiter dùng đúng NGÀY UTC lượt mở (21/11), kiểm `date -d` ra epoch TRƯỚC khi khởi động waiter — waiter thoát sớm nhờ GATE-FOUND 03:00:24Z, không chờ tới deadline 04:30Z 21/11.
Nợ: docs/PHASE9_ROUND158_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 qua gate chuẩn cùng-boot #58; harness 4/6 + 2 KẸT THẬT WebKit 85m4 P4-lần3 + 86n2 P2-entry; kẹt cộng dồn 11 → 13; chuỗi "P3 không kẹt" vẫn 0; chuỗi WebKit FULL PASS 12 → 13 theo quyết (h) đợt 158).

## 0. Kết luận ngắn — O8 PASS 3/3 (GATE CHUẨN, CÙNG BOOT #59), HARNESS 6/6 SẠCH (ATTEMPT 2, BOOT MỚI), 1 REBOOT GIỮA PHIÊN

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (03:01:38–03:04:13Z, 2'35", boot `eec65561` = #59 đã xác nhận, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 03:01:51Z + 03:02:41Z, Playwright mouse click lần 2; Chromium: 03:03:43Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: GATE CHUẨN CÙNG-BOOT — KHÔNG cần thủ tục (i).** Waiter T8 (lần duy nhất): 20 poll GATE-NOT-YET (poll 1: t4=0, postboot=0; poll 2–20: t4=0, postboot=1 — POSTBOOT_PASS của T5 đã có từ 02:41:22Z) rồi **GATE-FOUND poll=21 lúc 03:00:24Z** (t4=OK + postboot đường (a) `round159-t5/POSTBOOT_PASS`, t4attempt=no-lock). T4-159: lượt yên #28 **CÓ lượt hợp lệ #24** — attempt1 02:46:28–02:50:27Z, probe 20/20, lớp B 5/5, tickCost median 44,5 ms ≤ 60, trên boot `eec65561` (#59); cờ T4 viết 02:59Z. **O8 chạy 03:01:38Z trên ĐÚNG boot đo** (cách lượt yên hợp lệ ~11 phút, cùng boot, gate chuẩn) — sạch như đợt 158. **Chuỗi WebKit FULL PASS: 13 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).**
- **Reboot giữa phiên (ứng viên #60 — số hiệu CHỜ T0/T2 xác nhận, T8 không tự chốt):** boot mới `e590ae0a`, btime 1795230359 = 03:05:59Z, xảy ra trong lúc harness attempt 1 đang chạy WebKit 84l10 (sau W1-lần2 PASS 03:06:31Z đồng hồ cũ — xem F-159-T8-1/F-159-T8-5). O8 đã xong 03:04:13Z, TRƯỚC reboot — không ảnh hưởng. Harness attempt 1 KHÔNG có verdict (bị giết, không phải kẹt, không phải FAIL).
- **Harness attempt 2 (boot mới `e590ae0a`): 6/6 PASS, 0 kẹt** trong MỘT lần chạy driver duy nhất (03:12:12–03:28:25Z, 16'13"): WebKit 84l10/85m4/86n2 PASS + Chromium 84l10/85m4/86n2 PASS. Cả 6 report JSON đã kiểm độc lập bằng python (6× `ok=true`). **85m4 KHÔNG tái kẹt** — P4-lần3 (điểm kẹt đợt 158) PASS; **86n2 P4-lần2 CÓ verdict: PASS** (chuỗi 9 → 10); 84l10 E4-setup KHÔNG tái kẹt (E4 ended=true). **Kẹt cộng dồn: GIỮ 13. Chuỗi "P3 không kẹt": 0 → 1.**
- **85m4 KHÔNG đủ điều kiện mở điều tra H3** (quyết (i) đợt 158: kẹt lần 2 ở đợt 158 — khác pha — tái diễn lần 3 thì mở; đợt này PASS sạch). **H3 VẪN MỞ, chỉ giám sát thụ động.**
- **Watchdog: 0 kích hoạt — ĐÚNG (không có kẹt để bắt), 0 false-positive.** Live-diag: 0 kích hoạt — không có kẹt để thử thách; điểm mù F-158-T8-4 (HB128 làm tươi mtime) KHÔNG được kiểm chứng đợt này (85m4 không kẹt; các dòng HB128 trong P5 đều mang giá trị tươi, playhead tăng 4,5 → 30 — không phải snapshot đóng băng).
- **RAM avail min 566 MB @03:28:13Z (lúc Chromium 86n2)** — cao hơn nhiều so với đợt 158 (168 MB); balloon max 91,3% trần, 0 mẫu ghim trần trong sampler attempt 2 (n=33).
- **T8 ĐÓNG ~03:35Z — TRONG hạn cờ ~05:00Z, còn dư ~1,5 giờ** (dù reboot giết attempt 1 và phải chạy lại harness; waiter thoát sớm nhờ gate nên tổng phiên vẫn sớm).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 01:33:47 21/11 | REBOOT #59 (boot `eec65561`) — boot lúc T8 mở; đã XÁC NHẬN (quyết (s) đợt 158) |
| ~02:38 | T8 mở: RAM avail ~458 MB; đọc LIMITS T8-158 + aggregate 158 §12.3; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 158 (không đổi); fixture /tmp MẤT theo reboot #59 |
| 02:39 | **Kiểm deadline waiter bằng `date -d` ra epoch TRƯỚC khi khởi động waiter: `2026-11-21 04:30:00 UTC` = epoch 1795235400, cách lúc kiểm 6.577 s (~110 phút) — đạo hàm: hạn cờ ~05:00Z trừ 30 phút (cùng mẫu đợt 158)** |
| 02:39 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round159-t8/diag-stall-159t8.sh`, readlink + test -x + test -e xác nhận** |
| 02:39:51 | **Rebuild fixture /tmp LẦN 1 (quy tắc (l)): md5 khớp đợt 125** (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549) |
| 02:40:23 | Waiter T8 bắt đầu trên boot `eec65561` (deadline 04:30Z 21/11 — ĐÃ KIỂM epoch); poll 1: t4=0 postboot=0 |
| 02:41:22 | T5 POSTBOOT_PASS cho boot `eec65561` (#59: dpkg 1.545, cache 178, lists 39, replay đầy đủ) — waiter postboot=1 từ poll 2 |
| 02:46:28–02:50:27 | **T4 attempt1: probe 20/20, lớp B 5/5, tickCost median 44,5 ms — LƯỢT YÊN HỢP LỆ #24 (lượt yên #28 CÓ lượt hợp lệ)**; 0 PAGE-WEDGED đợt thứ ba liên tiếp |
| 02:59 | Cờ T4 `round159-t4.done` xuất hiện |
| 03:00:24 | **GATE-FOUND poll=21 — waiter TỰ THOÁT (không chờ tới deadline 04:30Z)**; t4=OK, postboot đường (a), t4attempt=no-lock |
| 03:01:38–03:04:13 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — QUA GATE CHUẨN, TRÊN ĐÚNG BOOT ĐO (#59) |
| 03:04:13 | O8 DONE; lock `t8-round159` nhả; vite sau release curl 5560/5554 = 000 |
| 03:05:59 | **REBOOT (ứng viên #60): boot mới `e590ae0a`, btime 1795230359** — giết harness attempt 1 giữa WebKit 84l10 (xem F-159-T8-1) |
| 03:06:07 | Harness attempt 1 bắt đầu trên boot #59 (TRƯỚC khi T8 phát hiện reboot — xem F-159-T8-1) |
| 03:06:31 | WebKit 84l10 attempt 1: W1-lần2 PASS (dòng log cuối cùng trước khi chết) |
| ~03:06:5x | T8 phát hiện reboot (boot_id đổi → `e590ae0a`, uptime 1 phút, /tmp fixture mất) |
| 03:08 | Bằng chứng attempt 1 đã lưu vào `smoke/attempt1-reboot-killed/` (summary + log 84l10 + ram log + xvfb log + baseline) |
| 03:11:47 | Self-check postboot boot mới (T8 tự kiểm, không thay cờ T5): lib 6/6 CÓ, GST 1.624 plugin, dpkg.log 1.545, cache 178, lists 37 |
| 03:11:xx | **Rebuild fixture /tmp LẦN 2 (sau reboot, quy tắc (l)): md5 khớp đợt 125** |
| 03:12:12–03:28:25 | **Harness attempt 2 (boot mới `e590ae0a`): 6/6 PASS, 0 kẹt** (xem §2) — lock stale của attempt 1 thu hồi đúng lúc acquire |
| ~03:30 | Kiểm cuối: boot `e590ae0a` ổn định; 0 process sót; lock TRỐNG; cả hai symlink diag VẪN trỏ 159; fixture /tmp còn nguyên |
| ~03:35 | Cờ `round159-t8.done` (TRONG hạn cờ ~05:00Z, dư ~1,5 giờ); LIMITS + stage file hoàn thiện sau đó |

## A. O8 — PASS 3/3 trên boot `eec65561` (#59), QUA GATE CHUẨN CÙNG-BOOT (LƯỢT YÊN HỢP LỆ #28)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 03:01:38–03:02:30 | 0 | **21/21 PASS** — S1 PASS 03:01:51Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 03:02:30–03:03:21 | 0 | **21/21 PASS** — S1 PASS 03:02:41Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 03:03:21–03:04:13 | 0 | **21/21 PASS** — S1 PASS 03:03:43Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-21T03-01-39-eec65561-pid42587.json` 21 kết quả `ok=true` 21/21, md5 `dcc2338c`; attempt2 `o8w-clicktest-report-2026-11-21T03-02-31-eec65561-pid42972.json` 21/21 `ok=true`, md5 `e73190b8` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-21T03-03-21-eec65561-pid43330.json` 21/21 `ok=true`, md5 `c8df401e`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `eec65561` theo POSTBOOT_PASS của T5 lúc 02:41:22Z). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — nhưng đợt này harness chạy trên boot MỚI (xem §2), không phải boot #59.
- Driver O8 giữ 1 lock vite `t8-round159` suốt lượt (nhả 03:04:13Z; vite sau release curl 5560/5554 = 000 — như đợt 158).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-159t8.mjs`, `node --check` OK) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 13 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `eec65561`, qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #28 trong đợt). Sạch như đợt 158 (parent quyết LÊN 13 theo quyết (h)). T8 vẫn KHÔNG tự chốt, T10/parent phán cuối.
- **O8 đợt này 2'35" tổng** (148: 4'03", 149: 2'32", 150: 3'03", 151: 2'28", 152: 2'51", 153: 2'53", 154: 3'02", 155: 2'56", 156: 2'38", 157: 2'57", 158: 2'32") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — ATTEMPT 1 BỊ REBOOT GIẾT (KHÔNG VERDICT) + ATTEMPT 2: 6/6 PASS, 0 KẸT

### 2a. Attempt 1 (boot #59) — bị reboot giết, KHÔNG verdict

| # | Pha | Thời gian (Z) | Kết quả |
|---|---|---|---|
| 1 | WebKit 84l10 | 03:06:11–~03:06:31 (chết) | **KHÔNG VERDICT — BỊ REBOOT GIẾT** (W1-lần1 PASS 03:06:26Z + W1-lần2 PASS 03:06:31Z, chưa tới W1-lần3/W2/E4; log dừng đột ngột, không exit code) |

- Bằng chứng đã lưu nguyên vào `smoke/attempt1-reboot-killed/` (summary + log 84l10 + ram log 1 mẫu + xvfb log + baseline) TRƯỚC khi chạy attempt 2 (driver attempt 2 ghi đè summary/ram log). **Đừng trích W1-lần1/2 PASS của attempt 1 thành "84l10 PASS"** — pha chưa chạy xong, không có verdict.
- Reboot xảy ra sau dòng log cuối 03:06:31Z (đồng hồ cũ #59); btime boot mới 03:05:59Z — đồng hồ #59 chạy nhanh ít nhất ~32 s lúc chết (xem F-159-T8-5).

### 2b. Attempt 2 (boot mới `e590ae0a`) — MỘT LẦN CHẠY DRIVER DUY NHẤT: 6/6 PASS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 03:12:16–03:13:36 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS, E4 PASS ended=true ct cuối=4 — **KHÔNG tái kẹt E4-setup đợt 157** |
| 2 | WebKit 85m4 | 0 | 03:13:51–03:16:11 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart, seek kẹt 1 mẫu — **P4-lần3 (điểm kẹt đợt 158) PASS — KHÔNG tái kẹt lần 3** |
| 3 | WebKit 86n2 | 0 | 03:16:27–03:20:27 | **PASS** — P1/P2/P3 PASS (P2-entry — điểm kẹt đợt 158 — PASS), P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS, P6 KHÔNG-KẸT 90 s 0 restart — **P4-lần2 CÓ verdict: PASS (chuỗi 9 → 10)** |
| 4 | Chromium 84l10 | 0 | 03:20:43–03:21:53 | **PASS** — W1/W2/E4 PASS (E4 ended=false — như đợt 156/158, chỉ là khác biệt, không phải FAIL) |
| 5 | Chromium 85m4 | 0 | 03:22:08–03:24:19 | **PASS** — P1/P2/P3/P4-lần1/2/3 PASS (+1/+2/+1 — lần2 +2 khác WebKit +1, chỉ là khác biệt), P5 PASS 40 s 0 restart |
| 6 | Chromium 86n2 | 0 | 03:24:34–03:28:24 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5/P6 PASS |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (WebKit 84l10 finishedAt 03:13:27.325Z; WebKit 85m4 03:16:04.178Z; WebKit 86n2 03:20:25.487Z; Chromium 84l10 03:21:49.068Z; Chromium 85m4 03:24:11.449Z; Chromium 86n2 03:28:22.138Z).
- Môi trường attempt 2: system libs trên boot mới `e590ae0a` (T8 tự kiểm 03:11:47Z: lib 6/6 CÓ, GST 1.624 plugin, dpkg.log 1.545, cache 178, lists 37 — xem F-159-T8-6; cờ POSTBOOT_PASS chính thức cho boot mới thuộc T5-159, không phải T8). **WebKit launch THÀNH CÔNG 3/3 pha bằng system libs** trên boot mới. Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn cho attempt 2; 0 kẹt — không có gì để đối chứng thêm).
- **Harness attempt 2 DÀI 16'13"** (03:12:12–03:28:25Z) — ngắn vì 0 kẹt (158: 39'23" với 2 kẹt; 157: 30'35" với 1 kẹt; 156: 15'41" với 0 kẹt). Tổng phiên vẫn sớm nhờ waiter thoát sớm + attempt 2 sạch.

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG — KHÔNG CÓ KẸT), LIVE-DIAG 0/0 (KHÔNG ĐƯỢC THỬ THÁCH)

- **Watchdog (i): 0 kích hoạt — ĐÚNG.** Không có lần chạy nào evaluate im lặng >60 s (6/6 PASS, thời gian mỗi pha đều trong khung bình thường). 0 false-positive đợt thứ ba liên tiếp watchdog không kích hoạt oan (157: 1 kích hoạt đúng; 158: 2 kích hoạt đúng; 159: 0 kích hoạt — đúng vì 0 kẹt).
- **Driver (1b) live-diag: 0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH.** Không lần chạy nào log im lặng >120 s (`live_diags=0` cả 6 lần). Điểm mù F-158-T8-4 (HB128 làm tươi mtime) **không được kiểm chứng đợt này**: 85m4 không kẹt, các dòng HB128 trong P5 đều mang giá trị TƯƠI (playhead tăng 4,5 → 30, ct tăng theo, seeking=false) — không phải snapshot đóng băng. Điểm mù vẫn là giới hạn đứng theo quyết (u) đợt 158; T8-159 KHÔNG tự bổ sung kiểm "nội dung tươi" (quyết (u) đã chốt CHƯA bổ sung).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–158 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–159) + đường ổn định `t8-diag-stall.sh` → 159 (CẢ HAI symlink cập nhật 02:39Z, TRƯỚC mọi lần chạy — xem F-159-T8-8) | 6 lần chạy harness attempt 2 hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT KHI KHÔNG CÓ KẸT.** 0 snapshot stall |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–159) | 6 lần chạy harness attempt 2; `live_diags=0` cả 6 lần | **0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH (không có kẹt; điểm mù F-158-T8-4 vẫn đứng)** |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-159t8.sh` (cột `balloon_kb`) | 1 log sampler attempt 2 (n=33 mẫu hợp lệ) + 1 mẫu attempt 1 (đã lưu riêng) | Balloon n=33 pinned=0 min=5.010.308 max=5.885.784 (91,3% trần) mean=5.418.844; avail min=566 MB @03:28:13Z (lúc Chromium 86n2) / max 1.832 MB — xem F-159-T8-4 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 03:21:53Z), 85m4 PASS (exit 0, 03:24:19Z), 86n2 PASS (exit 0, 03:28:24Z)** | N cộng dồn **N=21 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline lúc bắt đầu attempt 2 đã lưu; diag script không gọi) | Không có snapshot timeout124/live-diag nào đợt này (đúng — không có kẹt) |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | b8c08a7c | b8c08a7c | Không (bản vá watchdog đợt 142 còn nguyên) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không (như trên) |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không (như trên) |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không (bản sửa T0-152 F-151-T10-2 còn nguyên) |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không (như trên) |

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi so với đợt 158 (đều là bản copy, không chạm script repo): nhãn log `LIVE-DIAG-158` → `LIVE-DIAG-159`, lock `t8-round158` → `t8-round159`, deadline waiter 01:30Z 21/11 → **04:30Z 21/11**, nhãn `T8-158 O8` → `T8-159 O8` trong o8-driver — NHƯNG 2 chuỗi nhãn "T8-158" còn sót (xem F-159-T8-2, cosmetic, không ảnh hưởng số liệu); extract script sửa theo F-158-T8-3(c) (tìm dòng GATE-FOUND thay vì pattern "t4=1" — đã xác nhận đúng đợt này, xem F-159-T8-3).
- Script trích số liệu `extract-159t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 1 log waiter đợt này: 20 poll NOT-YET + GATE-FOUND poll 21, 0 WAIT-DEADLINE, 0 REBOOT trong log waiter — waiter thoát TRƯỚC reboot).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round159` 03:04:13Z; driver harness attempt 2 đã nhả lock sau mỗi lần chạy (86n2 Chromium released 03:28:25Z).
- Lock stale của attempt 1 (ticket `1-1795230370754915022-44132-t8-round159`, owner pid 44086 đã chết do reboot, boot `eec65561`) được driver attempt 2 thu hồi đúng lúc acquire 84l10 (03:12:15Z): "stale: owner pid 44086 chết + không vite trên cổng 5390 + curl 000 + boot đổi — XÓA lock stale và thử lại" rồi ACQUIRED mới (ticket `1-1795230735887470075-7604-t8-round159`).
- Kiểm cuối ~03:30Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown); boot `e590ae0a` ổn định (btime 1795230359 không đổi từ 03:05:59Z).
- `/tmp/.X11-unix/` TRỐNG (0 file — reboot đã xóa; T8 dùng :199 cho harness + :188 cho O8-WebKit, cả hai đã dọn socket của mình trước reboot; không có socket mồ côi nào để lại).
- Fixture /tmp CÒN NGUYÊN sau harness attempt 2 (không reboot sau đó — kiểm md5 h `fbaa3d1a` lúc kiểm cuối); không cần rebuild lần 3.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 chạy trên boot #59, harness chạy trên boot mới (ứng viên #60)** — hai boot khác nhau trong cùng phiên T8 vì reboot xen giữa (03:05:59Z). O8 vẫn hợp lệ: đã chạy xong 03:04:13Z TRƯỚC reboot, qua gate chuẩn cùng-boot #59. Harness attempt 2 chạy trên boot mới sau khi T8 tự kiểm postboot (lib 6/6) — cờ POSTBOOT_PASS chính thức cho boot mới thuộc T5-159, T8 không thay.
2. **Harness đợt này 6/6 PASS — nhưng là attempt 2.** Attempt 1 bị reboot giết giữa WebKit 84l10 (W1-lần1/2 PASS, chưa xong pha) — KHÔNG verdict, KHÔNG tính vào 6/6. Đừng trích "84l10 PASS 2 lần" hay gộp attempt 1 vào đếm.
3. **Chuỗi WebKit FULL PASS 13 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 14 (xem F-158-T8-7 mẫu đợt trước).
4. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `eec65561` theo POSTBOOT_PASS của T5. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness attempt 2 (standard driver, không LD_LIBRARY_PATH) trên boot mới.
5. **Chromium 84l10 E4 `ended=false` (như đợt 156/158) + 85m4 P4-lần2 delta=+2 (khác WebKit +1)** — chỉ là khác biệt, không phải FAIL. Đừng gộp các đợt.
6. **Balloon KHÔNG ghim trần trong cửa sổ harness attempt 2** (0 mẫu ghim, n=33, max 91,3% trần) — avail min 566 MB @03:28:13Z là CAO hơn nhiều so với đợt 158 (168 MB). Chuỗi ghim trần phán bằng sampler T9 (giao T10).
7. **86n2 P4-lần2 CÓ verdict đợt này: PASS — chuỗi 9 → 10.** Đợt 158 không có verdict (kẹt ở P2-entry trước khi tới P4) — đừng trích "P4-lần2 PASS lần thứ 10" cho đợt 158.
8. **85m4 KHÔNG tái kẹt lần 3** — P4-lần3 PASS. Theo quyết (i) đợt 158, CHƯA đủ điều kiện mở điều tra riêng cho 85m4/86n2. H3 VẪN MỞ, chỉ giám sát thụ động.
9. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–159 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
10. **T8 ĐÓNG TRONG hạn cờ ~05:00Z (cờ viết ~03:35Z, dư ~1,5 giờ)** — dù reboot giết attempt 1 và phải chạy lại harness, waiter thoát sớm nhờ gate (03:00:24Z thay vì deadline 04:30Z) + attempt 2 sạch (16'13") nên tổng phiên vẫn sớm.
11. **1 reboot giữa phiên (ứng viên #60, btime 03:05:59Z)** — số hiệu CHỜ T0/T2 xác nhận; mù cho boot mới giao T2-159; POSTBOOT_PASS cho boot mới giao T5-159. Đừng trích số hiệu #60 như đã xác nhận.

## 8. Sai số mới (F-159-T8-N)

- **F-159-T8-1 — REBOOT GIỮA PHIÊN (ỨNG VIÊN #60) GIẾT HARNESS ATTEMPT 1:** harness attempt 1 bắt đầu 03:06:07Z trên boot `eec65561` (#59); WebKit 84l10 W1-lần1 PASS 03:06:26.790Z + W1-lần2 PASS 03:06:31.045Z (đồng hồ cũ), rồi log dừng đột ngột — không exit code, không dòng kết thúc. Lệnh `sleep` của T8 (dispatch ~03:06:1xZ) bị giết khi exec service restart do reboot. Lần kiểm đầu sau reboot ~03:06:54Z (đồng hồ mới): boot_id `e590ae0a`, uptime 1 phút, /tmp fixture mất, journal chỉ còn 1 boot (`journalctl --list-boots` idx 0 `e590ae0a`, first entry 03:06:15Z — journal boot cũ không giữ lại). Btime boot mới 1795230359 = 03:05:59Z. T8 xử lý: (a) lưu toàn bộ bằng chứng attempt 1 vào `smoke/attempt1-reboot-killed/` trước khi chạy lại; (b) self-check postboot boot mới (lib 6/6, GST 1.624, dpkg 1.545, cache 178, lists 37); (c) rebuild fixture lần 2 (md5 khớp đợt 125); (d) chạy lại harness attempt 2 trên boot mới (6/6 PASS). Attempt 1 KHÔNG verdict — không phải kẹt, không phải FAIL, không tính vào đếm harness. Số hiệu #60 là ỨNG VIÊN — chờ T0/T2 xác nhận (T8 không tự chốt số hiệu reboot).
- **F-159-T8-2 — 2 NHÃN "T8-158" CÒN SÓT TRONG DRIVER 159 (COSMETIC, KHÔNG ẢNH HƯỞNG SỐ LIỆU):** lệnh sed khi copy driver chỉ đổi `158t8`/`round158` nên 2 chuỗi "T8-158" còn sót: dòng header/release của o8-driver (`=== T8-158 O8 driver start...` / `=== T8-158 O8 release lock...`) và header selfcheck-postboot (`=== T8-158 selfcheck postboot...`). Log O8 và file selfcheck đợt này vẫn mang nhãn 158 dù là chạy đợt 159. Chỉ là nhãn — pid/md5/thời gian/boot trong log đều đúng đợt 159 (đã kiểm độc lập). Sửa sed cho T8-160 (đổi cả `T8-158` → `T8-159`).
- **F-159-T8-3 — EXTRACT SCRIPT: KHẮC PHỤC F-158-T8-3(c) ĐÃ XÁC NHẬN ĐÚNG:** extract đợt này in đúng dòng GATE-FOUND (`GATE-FOUND poll=21 03:00:24Z t4=OK postboot=... (duong a) t4attempt=no-lock`) thay vì "KHONG CO" như đợt 158. Các đếm khác khớp tay: 20 poll NOT-YET + GATE-FOUND poll 21; postboot=1 trên 19 dòng poll (poll 1 postboot=0).
- **F-159-T8-4 — RAM SAMPLER: n=33 (ATTEMPT 2) + 1 MẪU ATTEMPT 1 (ĐÃ LƯU RIÊNG):** log `ram-159t8.log` của attempt 2 có 35 dòng = 1 header + 33 mẫu + 1 dòng marker "CHROMIUM PHASE start"; balloon min 5.010.308 / max 5.885.784 (91,3% trần) / mean 5.418.844, pinned=0; avail min=566 MB @03:28:13Z (lúc Chromium 86n2 — load 0,46 lúc đó) / max 1.832 MB. Sampler attempt 1 chỉ kịp 1 mẫu (03:06:07Z, avail 1.089 MB, balloon 5.717.948) trước khi reboot giết — bản sao đã lưu trong `attempt1-reboot-killed/ram-159t8.log`; driver attempt 2 ghi đè log gốc. Không gộp 2 sampler (khác boot, khác cửa sổ).
- **F-159-T8-5 — ĐỒNG HỒ #59 CHẠY NHANH LÚC CHẾT (CẬN DƯỚI ~32 S — T2 ĐỐI CHIẾU):** dòng log cuối attempt 1 là 03:06:31Z (đồng hồ #59) nhưng btime boot mới là 03:05:59Z — tức đồng hồ #59 nhanh ít nhất ~32 s so với giờ thật lúc chết (btime là thời điểm kernel mới khởi động, sau khi hệ cũ chết; dòng log cuối là thời điểm hệ cũ còn sống). Cửa sổ hẹp hơn: journal boot mới first entry 03:06:15Z; lệnh sleep của T8 dispatch ~03:06:1xZ (đồng hồ cũ) chết theo reboot, lần kiểm đầu sau reboot 03:06:54Z (đồng hồ mới) — phù hợp với một cú nhảy lùi của đồng hồ, nhưng T8 KHÔNG chốt độ lệch tuyệt đối (thuộc T2 — mô hình đồng hồ; xem quyết (d) đợt 158). Không ảnh hưởng verdict O8/harness (chỉ ảnh hưởng khung giờ tuyệt đối của các mốc trong phiên).
- **F-159-T8-6 — LISTS 37 (SELFCHECK T8, BOOT MỚI) vs 39 (POSTBOOT_PASS T5, BOOT #59):** hai con số thuộc HAI boot khác nhau — không so sánh trực tiếp, không kết luận thiếu file. Selfcheck của T8 chỉ để xác nhận boot mới đủ lib chạy harness (6/6 CÓ + GST 1.624 plugin + dpkg 1.545 + cache 178); cờ POSTBOOT_PASS chính thức cho boot mới thuộc T5-159.
- **F-159-T8-7 — O8 TRÊN #59, HARNESS TRÊN BOOT MỚI — HAI BOOT TRONG MỘT PHIÊN:** do reboot 03:05:59Z xen giữa O8 (xong 03:04:13Z) và harness (attempt 2 chạy 03:12:12Z trên boot mới). Đây là phiên đầu tiên T8 có O8 và harness trên 2 boot khác nhau mà O8 KHÔNG cần thủ tục bù (đợt 157: O8 trên boot khác nhưng gate phải bù bằng thủ tục (i); đợt này O8 chạy TRƯỚC reboot, gate chuẩn cùng-boot tại thời điểm chạy — không cần bù). T10 lưu ý khi trích "cùng boot" cho đợt 159: chỉ O8+lượt yên là cùng boot #59; harness là boot mới.
- **F-159-T8-8 — CHECKLIST (o) ĐÃ LÀM ĐÚNG CẢ HAI SYMLINK — GIỮ QUA CẢ PHIÊN + REBOOT:** lúc T8 mở (~02:39Z) cả hai symlink vẫn trỏ về `round158-t8/diag-stall-158t8.sh` (stale 1 đợt). T8 cập nhật CẢ HAI về `round159-t8/diag-stall-159t8.sh` lúc 02:39Z (trước mọi lần chạy), `readlink` + `test -x` + `test -e` xác nhận cả hai; kiểm cuối ~03:30Z cả hai VẪN trỏ 159 (symlink nằm trên đĩa bền, không mất theo reboot). Không có snapshot stall nào đợt này nên đường diag không được thử thách thực tế — nhưng đường đã đúng cả hai mối suốt phiên. Về đề xuất T0-154 (sửa hằng `DIAG137_SCRIPT` trong 3 script harness về 1 mối duy nhất): T8-159 VẪN QUYẾT ĐỊNH KHÔNG SỬA trong phiên này — phiên có reboot giữa chừng + chạy lại harness, sửa hằng giữa phiên rủi ro cao hơn lợi ích; giao T0-160 cân nhắc sửa khi phiên ổn định (không có kẹt/reboot giữa phiên) + kiểm thử đầy đủ. **Nợ đóng:** F-158-T8-3 (extract pattern t4=1) đã sửa xong và xác nhận đúng đợt này (xem F-159-T8-3); F-157-T8-7 đóng từ đợt 158, giữ đúng đợt thứ hai liên tiếp.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 13 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `eec65561` (#59), qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #28 trong đợt (attempt1 20/20, B 5/5, tickCost 44,5 ms). Sạch như đợt 158 (parent đã quyết LÊN 13 theo quyết (h)). T8 không tự chốt (xem F-159-T8-7).
2. **Chuỗi "P3 không kẹt" 0 → 1 — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (i) đợt 158).** 0 kẹt đợt này trong 6 lần chạy attempt 2 (attempt 1 không verdict); kẹt cộng dồn GIỮ 13 (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1 + 157: 1 + 158: 2). Nếu đợt 160 sạch thì chuỗi lên 2.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=21 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #28 CÓ lượt hợp lệ #24 (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-159: attempt1 20/20, B 5/5, tickCost median 44,5 ms; P3' cộng dồn mới 56/64 occ = 56/59 distinct-seq (xem LIMITS T4-159 để đối chiếu số tuyệt đối). Chuỗi lượt yên hợp lệ NỐI DÀI #23 → #24. 0 PAGE-WEDGED đợt thứ ba liên tiếp.
5. **Điểm mù live-diag (1b) với HB128 (F-158-T8-4) — vẫn là giới hạn đứng, CHƯA được kiểm chứng đợt này** (không có kẹt 85m4 để thử thách; quyết (u) đợt 158 giữ nguyên CHƯA bổ sung kiểm "nội dung tươi").
6. **85m4 KHÔNG tái kẹt lần 3 (P4-lần3 PASS); 86n2 P4-lần2 PASS (chuỗi 9 → 10); 84l10 E4-setup KHÔNG tái kẹt** (xem §2). 85m4/86n2 CHƯA đủ điều kiện mở điều tra riêng theo quyết (i) đợt 158.
7. **RAM avail min 566 MB (cao hơn hẳn đợt 158: 168 MB) + balloon max 91,3% — chờ T9 đối chiếu** (F-159-T8-4); chuỗi ghim trần phán bằng sampler T9 (giao T10).
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-159 xác nhận số lần — lần thứ 13 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS cho boot `eec65561` (#59) ĐÃ CÓ qua đường T5 (02:41:22Z, replay đầy đủ); POSTBOOT_PASS cho boot mới `e590ae0a` giao T5-159.
9. **1 reboot giữa phiên (ứng viên #60, btime 03:05:59Z)** — số hiệu chờ T0/T2 xác nhận; mù cho boot mới giao T2-159 (theo quyết (s) đợt 158, #59 đã xác nhận; #60 chưa).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 159 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158) — 0 KẸT, CHUỖI LÊN 1

## B1. Trạng thái giả thuyết sau đợt 159 (H3 vẫn mở — 0 kẹt mới, không có chữ ký mới)

| Giả thuyết | Trạng thái đợt 158 | Trạng thái đợt 159 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — 0 KẸT MỚI ĐỢT NÀY (không có dữ kiện mới ủng hộ hay bác bỏ; 85m4/86n2 đều PASS tại đúng điểm kẹt đợt 158)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — không có kẹt mới để kiểm lại)** |

- Đợt 159 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **0 kẹt thật trong 6 lần chạy harness attempt 2 (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Attempt 1 bị reboot giết (không verdict) — không phải kẹt, không tính vào đếm H3. Không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt nào).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 566 MB trong cửa sổ harness attempt 2 — CAO hơn hẳn đợt 158 (168 MB, 2 kẹt) và đợt 157 (308 MB, 1 kẹt); H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-160 đối chiếu tiếp.
- Lưu ý phân biệt chữ ký: T4 attempt1 HỢP LỆ (không wedge) — đợt thứ ba liên tiếp T4 không PAGE-WEDGED. Đợt này T4 1 lượt hợp lệ, T8 0 kẹt; đừng gộp hai việc thành một lỗi. Reboot giữa phiên là sự kiện hạ tầng (giết process), không phải wedge WebKit — đừng trích reboot thành "kẹt thứ 14".

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 159

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–159) + đường ổn định `t8-diag-stall.sh` → 159 (CẢ HAI symlink cập nhật 02:39Z; kiểm cuối vẫn trỏ 159 — xem F-159-T8-8) | 6 lần chạy harness attempt 2 hoàn thành + 3 lần chạy O8; **0 kẹt → 0 kích hoạt, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–159) | 6 lần chạy harness attempt 2; `live_diags=0` cả 6 lần | **0 kích hoạt — KHÔNG ĐƯỢC THỬ THÁCH (không có kẹt; điểm mù F-158-T8-4 vẫn đứng)** |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler attempt 2 (n=33 mẫu hợp lệ) + 1 mẫu attempt 1 (đã lưu riêng) | Balloon n=33 pinned=0 min=5.010.308 max=5.885.784 (91,3% trần) mean=5.418.844; avail min=566 MB @03:28:13Z (lúc Chromium 86n2); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness attempt 2 |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 03:21:53Z), 85m4 PASS (exit 0, 03:24:19Z), 86n2 PASS (exit 0, 03:28:24Z)** | N cộng dồn **N=21 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline attempt 2 đã lưu) | Không có snapshot timeout124/live-diag nào đợt này (đúng — không có kẹt) |

## B3. Chữ ký kẹt — đợt 159: 0 KẸT (CÁC ĐIỂM KẸT ĐỢT 158 ĐỀU PASS)

- **85m4 P4-lần3 (waitForPlaySync) — điểm kẹt đợt 158 — PASS đợt này** (03:15:20–03:15:22Z, element đồng bộ sau 1,4 s, playhead=1,067, ct=1,302, delta=+1, hạ-cánh-về-target=true, errors=0). Không có WATCHDOG-137, không probe, không live-diag — evaluate trả đúng hạn cả 3 lần P4. **85m4 kẹt lần 2 (đợt 158) KHÔNG tái diễn lần 3** → chưa đủ điều kiện mở điều tra riêng (quyết (i) đợt 158).
- **86n2 P2-entry (runEngine:439) — điểm kẹt đợt 158 — PASS đợt này** (P2 PASS 03:17:19Z, reset xong 705 ms, extraEvents=[]). P4-lần2 (không verdict đợt 158) PASS 03:17:53–03:17:55Z (delta=+1, ct=3,588). **86n2 P4-lần2: chuỗi 9 → 10.**
- **84l10 E4-setup — điểm kẹt đợt 157 — KHÔNG tái kẹt đợt thứ hai liên tiếp** (E4 PASS ended=true đợt 158 + đợt 159; W1-lần1/2/3 PASS + W2 PASS cả hai đợt).
- **Đối chiếu với kẹt đợt 158 (85m4 P4-lần3 + 86n2 P2-entry):** cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), KHÁC boot (harness attempt 2 chạy trên boot mới `e590ae0a`, btime 03:05:59Z; kẹt đợt 158 trên boot `28366bd0` #58). Không kết luận boot gây/không gây kẹt — chỉ ghi nhận khác biệt để T10 đối chiếu.
- **Không có điểm pha nào "nóng" đợt này:** cả 3 pha WebKit + cả 3 pha Chromium đều PASS đủ P1–P6/W1/W2/E4 (trừ ghi chú Chromium 84l10 E4 `ended=false` + 85m4 P4-lần2 delta=+2 — như đợt 156/158, chỉ là khác biệt; cả hai không phải FAIL).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 159: 0 KẸT, CHUỖI LÊN 1

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 143: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 144: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 145: 6 lần chạy, 0 kẹt (chuỗi 4). Đợt 146: 6 lần chạy, 0 kẹt (chuỗi 5). Đợt 147: 6 lần chạy, 0 kẹt (chuỗi 6). Đợt 148: 6 lần chạy, 1 KẸT (86n2 WebKit P4-lần2) — chuỗi về 0. Đợt 149: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 150: 6 lần chạy, 2 KẸT (85m4 P1 + 86n2 P5) — chuỗi về 0. Đợt 151: 6 lần chạy, 2 KẸT (85m4 P1 + P5) — chuỗi về 0. Đợt 152: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 153: 6 lần chạy, 1 KẸT (85m4 P1-phaseA) — chuỗi về 0. Đợt 154: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 155: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 156: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 157: 6 lần chạy, 1 KẸT (84l10 E4-setup) — chuỗi về 0. Đợt 158: 6 lần chạy, 2 KẸT (85m4 P4-lần3 + 86n2 P2-entry) — chuỗi VẪN 0. **Đợt 159: 6 lần chạy attempt 2, 0 KẸT (85m4 P4-lần3 PASS + 86n2 P2-entry PASS) — chuỗi 0 → 1.** Kẹt cộng dồn: **GIỮ 13**. (Attempt 1 bị reboot giết: 0 lần chạy hoàn thành, không tính vào đếm.)
- Nếu đợt 160 sạch (0 kẹt trong 6 lần chạy) thì chuỗi lên 2.
