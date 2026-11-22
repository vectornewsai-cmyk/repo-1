# Đợt 162 T8 — O8 PASS 3/3 QUA GATE CHUẨN CÙNG-BOOT #64 + HARNESS 5/6, 1 KẸT WEBKIT 86n2 P5-ENTRY (LIVE-DIAG KÍCH HOẠT THẬT LẦN ĐẦU)

Ngày: 21/11/2026 (lượt cron 18:35 +07 21/11 = 11:35:51Z 21/11; T8 mở ~11:37Z, đóng ~12:42Z — TRONG hạn cờ ~14:00Z, hạn cứng 14:30Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) O8 Chromium + WebKit 21/21 (WebKit ×2) — chạy QUA GATE CHUẨN CÙNG-BOOT (GATE-FOUND poll 25 lúc 12:02:43Z: cờ T4 + POSTBOOT_PASS đường (a) của T5 cho boot `d9a8d1ce`; lượt yên #31 CÓ lượt hợp lệ #27 trên ĐÚNG boot đo); (2) harness đứng — MỘT lần chạy driver duy nhất, **5/6 PASS, 1 KẸT (WebKit 86n2, exit 124)**, 0 reboot giữa phiên; (3) watchdog **1 kích hoạt ĐÚNG** (86n2 P5-entry, 12:18:23Z), probe 1+1 TIMEOUT 30s, 0 false-positive; live-diag **2 kích hoạt — LẦN ĐẦU KÍCH HOẠT THẬT** (12:20:54Z + 12:24:54Z); điểm mù F-158-T8-4 (HB128/85m4) VẪN chưa được kiểm chứng (85m4 không kẹt); (4) H3: VẪN MỞ, chỉ giám sát thụ động (kẹt mới cùng chữ ký wedge H3, khác điểm pha — không mở giả thuyết mới theo quyết (f) đợt 151); (5) F-151-T10-2 (O8 JSON ghi đè): cơ chế stamped JSON còn đúng — 3 file JSON stamped riêng biệt, pid khác nhau, md5 khác nhau, bản copy dự phòng khớp md5; (6) **0 REBOOT trong phiên** — boot `d9a8d1ce` ổn định từ lúc mở tới lúc đóng (btime 1795259718 = 11:15:18Z không đổi); (7) deadline waiter dùng đúng NGÀY UTC lượt mở (21/11), kiểm `date -d` ra epoch TRƯỚC khi khởi động waiter — waiter thoát nhờ GATE-FOUND 12:02:43Z, không chờ tới deadline 13:30Z 21/11.
Nợ: docs/PHASE9_ROUND161_T8_VITEHARNESS_LIMITS.md (O8 PASS 3/3 qua gate chuẩn cùng-boot #62; harness attempt 1 6/6 + 0 kẹt; kẹt cộng dồn 13; chuỗi "P3 không kẹt" 2 → 3; chuỗi WebKit FULL PASS LÊN 16 theo quyết (g) đợt 161).

## 0. Kết luận ngắn — O8 PASS 3/3 (GATE CHUẨN, CÙNG BOOT #64), HARNESS 5/6 + 1 KẸT 86n2 P5-ENTRY

- **O8: WebKit 21/21 ×2 attempt + Chromium 21/21, toàn bộ PASS exit 0** (12:09:10–12:11:47Z, 2'37", boot `d9a8d1ce` = #64 ứng viên, cùng cây preview.tsx `530e10a7` + script O8 md5 `4994b4fc`/`c8acd72e`). S1 PASS cả 3 lần (WebKit: 12:09:24Z + 12:10:16Z, Playwright mouse click lần 2; Chromium: 12:11:16Z, CDP mouse click lần 2). Report JSON: 21 kết quả, 0 fail cả ba lần chạy (kiểm độc lập bằng python — 3 file stamped riêng biệt, pid khác nhau — xem §A). Probe S1 đã chuẩn bị sẵn KHÔNG cần chạy (chỉ chạy khi FAIL).
- **Gate: GATE CHUẨN CÙNG-BOOT — KHÔNG cần thủ tục (i).** Waiter T8: 24 poll GATE-NOT-YET rồi **GATE-FOUND poll=25 lúc 12:02:43Z** (t4=OK + postboot đường (a) `round162-t5/POSTBOOT_PASS`, t4attempt=no-lock). T4-162: lượt yên #31 **CÓ lượt hợp lệ #27** — attempt1 11:54:39–11:58:30Z, probe 20/20, lớp B 5/5, tickCost median 42,0 ms ≤ 60, trên boot `d9a8d1ce`; cờ T4 viết 12:02Z. **O8 chạy 12:09:10Z trên ĐÚNG boot đo** (cách lượt yên hợp lệ ~11 phút, cùng boot, gate chuẩn) — sạch như đợt 158/159/160/161. **Chuỗi WebKit FULL PASS: 16 → ? (CHỜ T10/parent phán — T8 KHÔNG tự chốt).**
- **Harness (MỘT lần chạy driver duy nhất, boot `d9a8d1ce`): 5/6 PASS, 1 KẸT** (12:11:57–12:38:31Z, 26'34"): WebKit 84l10/85m4 PASS + Chromium 84l10/85m4/86n2 PASS; **WebKit 86n2 exit 124 (timeout 900 s) — KẸT tại P5-entry, runEngine:527** (xem §2/F-162-T8-1). Cả 6 report JSON đã kiểm độc lập bằng python (5× `ok=true`, 1× `ok=false` — WebKit 86n2). **85m4 P4-lần3 PASS lần thứ tư liên tiếp — KHÔNG tái kẹt**; **86n2 P4-lần2 CÓ verdict: PASS** (chuỗi verdict 12 → 13 — P4-lần2 PASS trước khi pha kẹt tại P5-entry); 84l10 E4 PASS ended=false (lần thứ ba liên tiếp — xem F-162-T8-7). **Kẹt cộng dồn: 13 → 14. Chuỗi "P3 không kẹt": 3 → 0.**
- **85m4 KHÔNG đủ điều kiện mở điều tra H3** (quyết (i) đợt 158: P4-lần3 PASS sạch lần thứ tư liên tiếp). **Kẹt 86n2 mới cùng chữ ký wedge H3** (evaluate chết, vite sống, process idle — xem F-162-T8-1), chỉ khác điểm pha (P5-entry thay vì P2-entry/P4 đợt 158) — theo quyết (f) đợt 151, KHÔNG mở giả thuyết mới. **H3 VẪN MỞ, chỉ giám sát thụ động.**
- **Watchdog: 1 kích hoạt — ĐÚNG (có kẹt thật để bắt), 0 false-positive.** Live-diag: **2 kích hoạt — LẦN ĐẦU KÍCH HOẠT THẬT** (không phải 0/0 như các đợt 142–161); điểm mù F-158-T8-4 (HB128 làm tươi mtime ở 85m4) **không được kiểm chứng đợt này** (85m4 không kẹt — 86n2 không dùng HB128 nên log im lặng thật; xem F-162-T8-2).
- **RAM avail min 362 MB @12:28:58Z (lúc kẹt WebKit 86n2)** — THẤP NHẤT các đợt gần đây (161: 541 MB; 160: 468 MB); balloon max 93,9% trần, 0 mẫu ghim trần trong sampler (n=54).
- **T8 ĐÓNG ~12:42Z — TRONG hạn cờ ~14:00Z, còn dư ~1h20** (gate nhanh: 24 poll thay vì 82 poll đợt 161 — xem F-162-T8-6; harness dài 26'34" vì timeout 900 s của 86n2).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 11:15:18 21/11 | REBOOT #64 ứng viên (boot `d9a8d1ce`) — boot lúc T8 mở; số hiệu CHỜ T0 xác nhận |
| ~11:37 | T8 mở: đọc LIMITS T8-161 + aggregate 161 §8/§12.3 (g)(h)(z) + GAP §90; cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 161 (không đổi); fixture /tmp MẤT theo reboot #64 |
| 11:37 | **CHECKLIST (o): cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round162-t8/diag-stall-162t8.sh`, readlink + test -x + test -e xác nhận** |
| 11:37–11:38 | **Rebuild fixture /tmp LẦN 1 (quy tắc (l)): md5 khớp đợt 125** (hevc ba0c7c62, i7 f05daed8, h-30s fbaa3d1a, g-4s a1fb8549) |
| 11:38 | **Kiểm deadline waiter bằng `date -d` ra epoch TRƯỚC khi khởi động waiter: `2026-11-21 13:30:00 UTC` = epoch 1795267800, cách lúc kiểm 6.714 s (~112 phút) — hạn cờ ~14:00Z trừ 30 phút (cùng mẫu đợt 161)** |
| 11:38:41 | Waiter T8 bắt đầu trên boot `d9a8d1ce` (deadline 13:30Z 21/11 — ĐÃ KIỂM epoch); poll 1: t4=0 postboot=0 |
| 11:40:00 | T5 POSTBOOT_PASS cho boot `d9a8d1ce` (#64: replay-day-du, dpkg 1545, cache 178, lists 37) — waiter postboot=1 từ poll ~7 |
| 11:54:39–11:58:30 | **T4 attempt1: probe 20/20, lớp B 5/5, tickCost median 42,0 ms — LƯỢT YÊN HỢP LỆ #27 (lượt yên #31 CÓ lượt hợp lệ)**; 0 PAGE-WEDGED (lần thứ 6 liên tiếp); poller 23 poll, cửa mở poll #22 (RAM 2643 MB, load5 1,81) |
| 12:02 | Cờ T4 `round162-t4.done` xuất hiện (969 B, có nội dung) |
| 12:02:43 | **GATE-FOUND poll=25 — waiter TỰ THOÁT (không chờ tới deadline 13:30Z)**; t4=OK, postboot đường (a), t4attempt=no-lock |
| 12:09:10–12:11:47 | **Driver O8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3** (xem §A) — QUA GATE CHUẨN, TRÊN ĐÚNG BOOT ĐO (#64) |
| 12:11:57–12:38:31 | **Harness (MỘT lần chạy driver duy nhất, boot `d9a8d1ce`): 5/6 PASS, 1 KẸT WebKit 86n2** (xem §2) — 0 reboot giữa phiên |
| 12:18:23 | **WATCHDOG-137 kích hoạt (86n2 P5-entry, runEngine:527)** — evaluate im lặng >60 s; probe 1+1 TIMEOUT 30 s lúc 12:18:53Z |
| 12:20:54 + 12:24:54 | **LIVE-DIAG kích hoạt thật lần 1 + lần 2 (tối đa 2/2, cách nhau đúng 240 s)** — snapshot kẹt thật (xem F-162-T8-2) |
| 12:30:53 | WebKit 86n2 timeout 900 s — SIGKILL, exit 124; diag timeout124 lúc 12:30:54Z |
| ~12:39 | **Dọn 3 socket X11 mồ côi X193/X194/X195** (0 process Xvfb còn sống — xem §6/F-162-T8-3); kiểm cuối: boot `d9a8d1ce` ổn định (btime 1795259718 không đổi); 0 process sót; lock TRỐNG; cả hai symlink diag VẪN trỏ 162; fixture /tmp còn nguyên |
| ~12:42 | Cờ `round162-t8.done` (TRONG hạn cờ ~14:00Z, dư ~1h20); LIMITS + stage file hoàn thiện sau đó |

## A. O8 — PASS 3/3 trên boot `d9a8d1ce` (#64 ứng viên), QUA GATE CHUẨN CÙNG-BOOT (LƯỢT YÊN HỢP LỆ #27)

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 12:09:10–12:10:05 | 0 | **21/21 PASS** — S1 PASS 12:09:24Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 12:10:05–12:10:54 | 0 | **21/21 PASS** — S1 PASS 12:10:16Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 12:10:54–12:11:47 | 0 | **21/21 PASS** — S1 PASS 12:11:16Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-21T12-09-11-d9a8d1ce-pid41743.json` 21 kết quả `ok=true` 21/21, md5 `959abd4f`; attempt2 `o8w-clicktest-report-2026-11-21T12-10-06-d9a8d1ce-pid42111.json` 21/21 `ok=true`, md5 `10c8aeee` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-21T12-10-54-d9a8d1ce-pid42497.json` 21/21 `ok=true`, md5 `fc7927b0`. Bản copy dự phòng của driver T8 (`...-attempt1.json` / `...-attempt2.json` / `...-chromium.json`) khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- O8 WebKit chạy với `LD_LIBRARY_PATH=DEBROOT` do chính script O8 đặt (tiền lệ đợt 110 L8) — tức O8 WebKit đợt này chạy bằng lib debroot, KHÔNG phải system libs (dù system libs đã đầy đủ trên boot `d9a8d1ce` theo POSTBOOT_PASS của T5 lúc 11:40:00Z). Ghi rõ để T10 không trích O8 là "chạy bằng system libs"; bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (như đợt 161).
- Driver O8 giữ 1 lock vite `t8-round162` suốt lượt (nhả 12:11:47Z; vite sau release curl 5560/5554 = 000000 — như đợt 161).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-162t8.mjs`, `node --check` OK — bản copy từ 161, chỉ đổi nhãn) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Chuỗi WebKit FULL PASS: 16 → ? (CHỜ T10/parent phán).** T8 pass 21/21 ×2 đợt này (trên boot `d9a8d1ce`, qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #27 trong đợt). Sạch như đợt 158/159/160/161 (parent quyết LÊN 13 rồi 14 rồi 15 rồi 16 theo quyết (g)). T8 vẫn KHÔNG tự chốt, T10/parent phán cuối.
- **O8 đợt này 2'37" tổng** (161: 2'32", 160: 2'38", 159: 2'35", 158: 2'32") — dao động theo lượt, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: 5/6 PASS, 1 KẸT (WEBKIT 86n2), 0 REBOOT

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 12:12:02–12:13:12 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS, E4 PASS ended=false ct cuối=3,967 — **KHÔNG tái kẹt E4-setup đợt 157; ended=false lần thứ ba liên tiếp** (xem F-162-T8-7) |
| 2 | WebKit 85m4 | 0 | 12:13:28–12:15:38 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart, seek kẹt 0 mẫu — **P4-lần3 (điểm kẹt đợt 158) PASS lần thứ tư liên tiếp — KHÔNG tái kẹt** |
| 3 | WebKit 86n2 | 124 | 12:15:53–12:30:54 | **KẸT (timeout 900 s)** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), **KẸT tại P5-entry, runEngine:527** (ev STATE_FN không trả sau 60 s; watchdog 12:18:23Z + probe 1+1 TIMEOUT 30 s 12:18:53Z; live-diag ×2; SIGKILL 12:30:53Z) — xem F-162-T8-1 |
| 4 | Chromium 84l10 | 0 | 12:31:10–12:32:10 | **PASS** — W1-lần1/2/3 PASS, W2 PASS, E4 PASS ended=false ct cuối=3,949 (report JSON ok=true, finishedAt 12:32:09.393Z) |
| 5 | Chromium 85m4 | 0 | 12:32:25–12:34:26 | **PASS** — KHÔNG FAIL (report JSON ok=true, finishedAt 12:34:24.967Z) |
| 6 | Chromium 86n2 | 0 | 12:34:41–12:38:31 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s 0 restart (report JSON ok=true, finishedAt 12:38:22.269Z) — **đối chứng âm tính cho kẹt WebKit cùng pha** |

- 6 report JSON kiểm độc lập bằng python: 5× `ok=true` (WebKit 84l10 finishedAt 12:13:09.201Z; WebKit 85m4 12:15:36.944Z; Chromium 84l10 12:32:09.393Z; Chromium 85m4 12:34:24.967Z; Chromium 86n2 12:38:22.269Z) + 1× `ok=false` (WebKit 86n2 finishedAt 12:30:53.905Z; phases P1/P2/P3 không ghi verdict trong JSON, P4=true — verdict P1–P4 lấy từ log dòng, xem F-162-T8-1).
- Môi trường: system libs trên boot `d9a8d1ce` (POSTBOOT_PASS T5 11:40:00Z: replay-day-du, dpkg 1545). **WebKit launch THÀNH CÔNG 3/3 pha bằng system libs** trên ĐÚNG boot đo (pha 86n2 launch thành công rồi mới kẹt giữa chừng — không phải lỗi launch). Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; Chromium 86n2 cùng pha PASS đã là đối chứng đủ).
- **Harness DÀI 26'34"** (12:11:57–12:38:31Z) — dài hơn đợt 161 (15'31") đúng ~11 phút vì timeout 900 s của 86n2 (12:15:53–12:30:54Z); các pha còn lại đều trong khung bình thường.

## 3. Watchdog trong lượt này — 1 KÍCH HOẠT ĐÚNG + LIVE-DIAG KÍCH HOẠT THẬT LẦN ĐẦU (2/2)

- **Watchdog (i): 1 kích hoạt — ĐÚNG.** WebKit 86n2: evaluate im lặng >60 s tại runEngine:527 (P5-entry) → `WATCHDOG-137` 12:18:23.478Z (đúng 60,002 s sau dòng log thành công cuối P4-lần3 PASS 12:17:23.476Z) → diag script xong 12:18:23.616Z → probe 1+1 TIMEOUT 30 s 12:18:53.506Z (kênh evaluate kẹt cùng / page JS chết). 0 false-positive (không kích hoạt ở pha nào khác; 0 WATCHDOG-137 trong log O8 + 5 pha PASS).
- **Driver (1b) live-diag: 2 kích hoạt — LẦN ĐẦU KÍCH HOẠT THẬT kể từ khi thêm ở đợt 142** (các đợt 142–161: 0 kích hoạt vì 0 kẹt làm log im lặng đủ lâu). Lần 1 lúc 12:20:54Z (log im lặng ~211 s kể từ 12:17:23Z) → snapshot `stall-live-silence-webkit-86n2-1795263654`; lần 2 lúc 12:24:54Z (log im lặng 361 s theo driver) → snapshot `stall-live-silence-webkit-86n2-1795263894`; cách nhau đúng 240 s (= sàn cách nhau), tối đa 2/2 — đúng thiết kế. Cả hai snapshot đều bắt được trạng thái kẹt thật (vite HTTP 200, WebKitWebProcess còn sống — xem F-162-T8-1). **Điểm mù F-158-T8-4 (HB128 làm tươi mtime ở 85m4) KHÔNG được kiểm chứng đợt này**: 85m4 không kẹt; 86n2 không dùng HB128 nên log im lặng thật — live-diag chỉ chứng minh được cơ chế khi log im lặng thật, chưa chứng minh được trường hợp HB128 vẫn ghi dòng trong lúc kẹt. Điểm mù vẫn là giới hạn đứng theo quyết (u) đợt 160 + quyết (z) đợt 161; T8-162 KHÔNG tự bổ sung kiểm "nội dung tươi".
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–161 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–162) + đường ổn định `t8-diag-stall.sh` → 162 (CẢ HAI symlink cập nhật 11:37Z, TRƯỚC mọi lần chạy — xem F-162-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **1 kẹt → 1 kích hoạt ĐÚNG, 0 false-positive** | **ĐÚNG — KÍCH HOẠT KHI CÓ KẸT THẬT.** 4 snapshot stall (`stall-runEngine_527-*`, 2× `stall-live-silence-*`, `stall-webkit-86n2-timeout124-*`) |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy (MỚI 142, GIỮ NGUYÊN 143–162) | 6 lần chạy harness; `live_diags=2` ở WebKit 86n2, `=0` ở 5 pha còn lại | **2 kích hoạt — LẦN ĐẦU THẬT (không có kẹt 85m4 để thử thách điểm mù F-158-T8-4)** |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-162t8.sh` (cột `balloon_kb`) | 1 log sampler (n=54 mẫu hợp lệ) | Balloon n=54 pinned=0 min=5.028.232 max=6.050.320 (93,9% trần) mean=5.556.377; avail min=362 MB @12:28:58Z (lúc kẹt WebKit 86n2) / max 1.620 MB — xem F-162-T8-4 |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 12:32:10Z), 85m4 PASS (exit 0, 12:34:26Z), 86n2 PASS (exit 0, 12:38:31Z)** | N cộng dồn **N=24 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → kích hoạt** (snapshot timeout124 12:30:54Z; vite-http 000 — vite đã chết sau timeout; dmesg EPERM như mọi đợt; journalctl-k trống/EPERM) | Có snapshot timeout124 đợt này (đúng — có kẹt); baseline lúc bắt đầu đã lưu |

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

- T8 không sửa code app, không sửa script harness/O8 nào trong repo trong đợt này. Driver trong hidden_files có thay đổi so với đợt 161 (đều là bản copy, không chạm script repo): nhãn log `LIVE-DIAG-161` → CHƯA đổi (sót — xem F-162-T8-5), lock `t8-round161` → `t8-round162`, deadline waiter 10:30Z 21/11 → **13:30Z 21/11**, nhãn `T8-161` → `T8-162` trong o8-driver + selfcheck-postboot; extract `WAIT1` đã sửa đúng boot hiện tại `d9a8d1ce` (F-161-T8-6 ĐÓNG — extract chạy đúng, không còn tham chiếu boot cũ).
- Script trích số liệu `extract-162t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc đủ 1 log waiter đợt này: 24 poll NOT-YET + GATE-FOUND poll 25, 0 WAIT-DEADLINE, 0 REBOOT trong log waiter).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round162` 12:11:47Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 12:38:31Z).
- Kiểm cuối ~12:42Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown); boot `d9a8d1ce` ổn định (btime 1795259718 không đổi từ 11:15:18Z — 0 reboot trong phiên).
- `/tmp/.X11-unix/` lúc mở TRỐNG (reboot #64 đã xóa hết socket cũ); lúc kiểm cuối (sau O8 + harness) có **3 socket X193/X194/X195** — T8 đã dọn cả 3 lúc ~12:39Z sau khi xác minh **0 process Xvfb còn sống** (X193 mtime 11:54Z — của T4 attempt1; X194/X195 mtime 11:44Z — của luồng khác, không phải T8; xem F-162-T8-3). Socket của chính T8 (:199 harness, :188 O8-WebKit, :197 O8-Chromium) đã được driver tự unlink, không còn sót. Sau dọn: `/tmp/.X11-unix/` TRỐNG.
- Fixture /tmp CÒN NGUYÊN sau harness (md5 hevc `ba0c7c62`, i7 `f05daed8`, h `fbaa3d1a`, g `a1fb8549` lúc kiểm cuối); không cần rebuild lần 2.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt; không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN CÙNG BOOT `d9a8d1ce`** (như đợt 161). Cả lượt yên hợp lệ #27, O8 và harness đều trên đúng boot đo — phiên sạch, gate nhanh (xem F-162-T8-6).
2. **Chuỗi WebKit FULL PASS 16 → ? CHỜ T10/parent phán** — T8 không tự chốt lên 17 (xem F-161-T8-5 mẫu đợt trước — lần này O8 vẫn PASS 3/3 qua gate chuẩn cùng-boot; chỉ harness có kẹt, O8 không).
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `d9a8d1ce` theo POSTBOOT_PASS của T5. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo.
4. **WebKit 86n2 KẸT tại P5-entry (runEngine:527) — ĐIỂM KẸT MỚI** (khác P2-entry runEngine:439 + P4-lần3 đợt 158); P1/P2/P3/P4-lần1/2/3 đều PASS trước khi kẹt — P4-lần2 verdict PASS nên chuỗi verdict P4-lần2 vẫn 12 → 13, nhưng PHA 86n2 WebKit là FAIL (exit 124). Đừng gộp verdict pha con với verdict pha, và đừng gộp các đợt.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=54, max 93,9% trần) — avail min 362 MB @12:28:58Z là THẤP NHẤT các đợt gần đây (161: 541 MB; 160: 468 MB) và rơi đúng lúc kẹt 86n2 — chỉ là tương quan, H1/H2 đã bác bỏ nên không dùng làm bằng chứng nguyên nhân; giao T9 đối chiếu (chuỗi ghim trần phán bằng sampler T9).
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–161 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (32.680 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **85m4 P4-lần3 PASS lần thứ tư liên tiếp — H3 vẫn mở, chỉ giám sát thụ động** (quyết (i) đợt 158 chưa đủ điều kiện mở điều tra; kẹt 86n2 mới cùng chữ ký wedge H3, không mở giả thuyết mới theo quyết (f) đợt 151).
8. **84l10 E4 `ended=false` lần thứ ba liên tiếp** (xem F-162-T8-7) — script verdict vẫn PASS; đừng trích ended=false thành FAIL.
9. **T8 ĐÓNG TRONG hạn cờ ~14:00Z (cờ viết ~12:42Z, dư ~1h20)** — waiter thoát nhờ gate (12:02:43Z thay vì deadline 13:30Z) + harness dài vì timeout 900 s của 86n2 (26'34") + 0 reboot giữa phiên.
10. **0 reboot trong phiên** — boot `d9a8d1ce` (btime 11:15:18Z) ổn định từ lúc mở tới lúc đóng; số hiệu #64 là ỨNG VIÊN — chờ T0 xác nhận. Mù cho boot mới giao T2-162 (theo quyết (s) đợt 158, #62 đã xác nhận ở đợt 161; #63/#64 chưa).

## 8. Sai số mới (F-162-T8-N)

- **F-162-T8-1 — KẸT WEBKIT 86n2 TẠI P5-ENTRY (runEngine:527) — ĐIỂM KẸT MỚI, CÙNG CHỮ KÝ WEDGE H3:** P1 PASS 12:16:27Z, P2 PASS 12:16:44Z (reset xong 656 ms), P3 PASS 12:17:08Z, P4-lần1 PASS 12:17:14Z, P4-lần2 PASS 12:17:18Z, P4-lần3 PASS 12:17:23.476Z (element đồng bộ sau 1,8 s, playhead=1,433, ct=1,567, delta=+1) — rồi `ev(page, STATE_FN)` đầu P5 (dòng 527 của `clicktest-86n2-webkit-w7.mjs`) KHÔNG BAO GIỜ TRẢ. Watchdog-137 12:18:23.478Z (đúng 60,002 s sau dòng log thành công cuối); probe 1+1 TIMEOUT 30 s 12:18:53.506Z (kênh evaluate kẹt cùng / page JS chết); log im lặng tới timeout 900 s; MiniBrowser bị SIGKILL 12:30:53Z, exit 124, report JSON `ok=false` finishedAt 12:30:53.905Z. Chữ ký (3 snapshot diag: 12:18:23Z / 12:20:54Z / 12:24:54Z): vite HTTP **200** cả 3 lần (0,02 s / 0,01 s / 0,05 s) — vite dev còn sống, wedge nằm ở page/renderer WebKit, không phải vite; WebKitWebProcess còn sống, %CPU tích lũy GIẢM 58,7 → 30,3 → 18,0 (idle, không spin — đúng mẫu "chết lặng" H3); RSS GIẢM 328.524 → 286.312 → 215.456 kB trong lúc kẹt; loadavg thấp (0,42 / 0,05 / 0,36 lúc 3 snapshot) — không phải CPU-starved; balloon TĂNG 5.396.092 → 5.708.920 → 5.959.312 kB, avail GIẢM 921.900 → 661.436 → 464.132 kB trong lúc kẹt — tương quan, KHÔNG kết luận nguyên nhân (H1/H2 đã bác bỏ). Điểm kẹt MỚI so với đợt 158 (P2-entry runEngine:439 + P4-lần3): cùng họ wedge H3, khác điểm pha — theo quyết (f) đợt 151, KHÔNG mở giả thuyết mới. Chromium 86n2 cùng pha PASS toàn bộ (P1/P2/P3, P4-lần1/2/3, P5 40 s 0 restart) — đối chứng âm tính cho lỗi app. Đừng trích kẹt này thành "86n2 yếu đi" hay "P4-lần2 đứt chuỗi" — P4-lần2 PASS đợt này (chuỗi verdict 12 → 13), pha kẹt ở bước SAU P4.
- **F-162-T8-2 — LIVE-DIAG KÍCH HOẠT THẬT LẦN ĐẦU (2/2, ĐÚNG THIẾT KẾ):** lần 1 12:20:54Z (log im lặng ~211 s kể từ dòng cuối 12:17:23Z) → snapshot `stall-live-silence-webkit-86n2-1795263654` (avail 661.436 kB, balloon 5.708.920 kB, vite HTTP 200); lần 2 12:24:54Z (log im lặng 361 s theo driver) → snapshot `stall-live-silence-webkit-86n2-1795263894` (avail 464.132 kB, balloon 5.959.312 kB, vite HTTP 200); cách nhau đúng 240 s (= sàn cách nhau), tối đa 2/lần chạy — đúng thiết kế đợt 142. Đây là lần đầu live-diag được thử thách thật kể từ khi thêm (đợt 142–161: 0 kích hoạt). **Caveat:** 86n2 KHÔNG dùng HB128 nên log im lặng thật — cơ chế chỉ chứng minh được khi log im lặng thật; điểm mù F-158-T8-4 (HB128 làm tươi mtime ở 85m4) VẪN chưa được kiểm chứng (85m4 không kẹt đợt này; các dòng HB128 trong P5 85m4 đều mang giá trị TƯƠI, playhead tăng tới 30 — không phải snapshot đóng băng).
- **F-162-T8-3 — 3 SOCKET X11 MỒ CÔI ĐÃ DỌN (CÙNG 3 SỐ DISPLAY NHƯ ĐỢT 160/161):** lúc mở `/tmp/.X11-unix/` TRỐNG (reboot #64 xóa hết); lúc kiểm cuối sau harness có 3 socket X193 (mtime 11:54Z — của T4 attempt1), X194 + X195 (mtime 11:44Z — của luồng khác, T8 không dùng :194/:195 đợt này; T8 dùng :199 harness + :188 O8-WebKit + :197 O8-Chromium, cả 3 đã tự unlink). T8 xác minh **0 process Xvfb còn sống** (ps 2 lần) rồi `rm -f` cả 3 socket lúc ~12:39Z; sau dọn `/tmp/.X11-unix/` TRỐNG. Không kill process nào. Mẫu lặp lại 3 đợt liên tiếp cùng 3 số display (160/161/162) — T4 (và luồng khác) có vẻ dùng :193/:194/:195 cố định; ghi nhận để T10 đối chiếu. Không phải socket cũ sống qua reboot (mtime mới đợt 162).
- **F-162-T8-4 — RAM SAMPLER: n=54:** log `ram-162t8.log` có 56 dòng = 1 header + 54 mẫu + 1 dòng marker "CHROMIUM PHASE start"; balloon min 5.028.232 / max 6.050.320 (93,9% trần) / mean 5.556.377, pinned=0; avail min=362 MB @12:28:58Z (lúc kẹt WebKit 86n2 — load 0,07 lúc đó) / max 1.620 MB. Balloon-max @12:28:58Z (avail 362 MB, load 0,07). Không gộp với sampler đợt khác (khác boot, khác cửa sổ). **Lưu ý phạm vi:** sampler này CHỈ đo cửa sổ harness (12:11–12:38Z); avail min 362 MB là THẤP NHẤT các đợt gần đây (161: 541 MB; 160: 468 MB) — giao T9 đối chiếu với sampler của họ.
- **F-162-T8-5 — NHÃN `LIVE-DIAG-161` SÓT TRONG DRIVER 162 (VÔ HẠI VỀ SỐ LIỆU, GIAO T8-163 SỬA):** chuỗi `LIVE-DIAG-161` còn hardcoded tại `run-webkit-162t8.sh` + `run-chromium-162t8.sh` (dòng 88 chú thích, 107 echo, 118 pattern grep) — sed 161t8→162t8 lúc copy không chạm vì chuỗi là "161" trần, không kèm "t8" (cùng họ F-161-T8-6 nhưng ở hướng ngược: F-161-T8-6 là tham chiếu boot cũ trong extract — ĐÃ SỬA đúng đợt này, WAIT1 → boot `d9a8d1ce`, extract chạy đúng). Vô hại: nhãn + pattern grep dùng cùng chuỗi nên summary vẫn bắt đủ 2 lần kích hoạt (extract đếm `LIVE-DIAG-161` = 2, khớp log driver); số liệu kẹt/watchdog/live-diag không ảnh hưởng. Giao T8-163 sửa thành `LIVE-DIAG-162` khi copy (sed thêm `s/LIVE-DIAG-161/LIVE-DIAG-162/g`).
- **F-162-T8-6 — GATE NHANH (24 POLL, ~24 PHÚT — KHÁC HẲN ĐỢT 161: 82 POLL, ~2H22M):** balloon đã xả TRƯỚC khi T8 mở (avail 2.432 MB lúc mở 11:38Z, 2.557 MB lúc 11:48Z; gate A ≥1024 MB của T4 mở); POSTBOOT_PASS #64 có sớm 11:40:00Z (replay tự nhiên CHẠY ĐẦY ĐỦ, dpkg 1545 — khác #62 phải early-repair vì replay không chạy); T4 attempt1 ĐẠT NGAY (ngân sách 1/3, không cần attempt2); waiter thoát nhờ gate 12:02:43Z. Đừng trích "gate nhanh" thành cải tiến waiter hay cải tiến T4 — nguyên nhân là balloon host + replay đầy đủ trên boot mới.
- **F-162-T8-7 — WEBKIT 84l10 E4 `ended=false` LẦN THỨ BA LIÊN TIẾP (BẮT ĐẦU GIỐNG XU HƯỚNG):** E4 PASS 12:13:08Z — tới cuối=true, playing cuối=false, restartEndedVideo tại cuối=3 → sau 3 s=3, ct cuối=3,967, ended=false, errors=0. Đợt 160 E4 cũng ended=false (ct cuối=3,967 — GIỐNG HỆT đợt này); đợt 161 ended=false (ct cuối=3,9); đợt 159 ended=true (ct cuối=4). Script verdict vẫn PASS (E4 không assert ended=true); đừng trích ended=false thành FAIL hay thành "E4 yếu đi" — chỉ ghi nhận khác biệt để T10 đối chiếu đợt 163; nếu đợt 163 cũng ended=false (lần thứ tư liên tiếp) thì cân nhắc ghi chú xu hướng.

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS = 16 → ? (CHỜ T10/parent phán).** O8 21/21 ×2 đợt này trên boot `d9a8d1ce` (#64 ứng viên), qua gate chuẩn cùng-boot, sau lượt yên hợp lệ #27 trong đợt (attempt1 20/20, B 5/5, tickCost 42,0 ms). Sạch như đợt 158/159/160/161 (parent đã quyết LÊN 13 rồi 14 rồi 15 rồi 16 theo quyết (g)). T8 không tự chốt (xem F-161-T8-5 mẫu đợt trước).
2. **Chuỗi "P3 không kẹt" 3 → 0 — H3 vẫn mở, chỉ giám sát thụ động tiếp (quyết (h) đợt 161).** 1 kẹt đợt này (WebKit 86n2 P5-entry, runEngine:527 — điểm kẹt mới, cùng chữ ký wedge H3); kẹt cộng dồn 13 → 14 (134/135: 3 + 141: 1 + 148: 1 + 150: 2 + 151: 2 + 153: 1 + 157: 1 + 158: 2 + 162: 1). Nếu đợt 163 sạch thì chuỗi lên 1.
3. **Đối chứng Chromium cùng pha: N cộng dồn N=24 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
4. **Lượt yên #31 CÓ lượt hợp lệ #27 (T4 chủ quản; T8 chỉ ghi nhận để trích gate cho đúng).** T4-162: attempt1 ĐẠT NGAY (20/20, B 5/5, tickCost median 42,0 ms; P3' cộng dồn mới 72/80 occ = 67/74 distinct-seq, P1 105/108, P2 99/99, P7 61/61 — xem LIMITS T4-162 để đối chiếu số tuyệt đối). Chuỗi lượt yên hợp lệ NỐI DÀI #26 → #27. 0 PAGE-WEDGED (lần thứ 6 liên tiếp).
5. **Điểm mù live-diag (1b) với HB128 (F-158-T8-4) — vẫn là giới hạn đứng, CHƯA được kiểm chứng đợt này** (không có kẹt 85m4 để thử thách; quyết (u) đợt 160 + quyết (z) đợt 161 giữ nguyên CHƯA bổ sung kiểm "nội dung tươi"). **Nhưng live-diag đã kích hoạt thật lần đầu trên 86n2 (2/2, đúng thiết kế)** — cơ chế đã chứng minh hoạt động khi log im lặng thật (xem F-162-T8-2).
6. **85m4 P4-lần3 PASS lần thứ tư liên tiếp — KHÔNG tái kẹt; 86n2 P4-lần2 PASS (chuỗi verdict 12 → 13); 84l10 E4-setup KHÔNG tái kẹt** (xem §2). 85m4/86n2 CHƯA đủ điều kiện mở điều tra riêng theo quyết (i) đợt 158 (85m4); kẹt 86n2 mới cùng chữ ký H3, không mở giả thuyết mới theo quyết (f) đợt 151.
7. **RAM avail min 362 MB (thấp nhất gần đây) + balloon max 93,9% — chờ T9 đối chiếu** (F-162-T8-4); chuỗi ghim trần phán bằng sampler T9 (giao T10). **Balloon tăng trong lúc kẹt 86n2 (5.396 → 5.959 MB) — chỉ tương quan, không phải bằng chứng nguyên nhân.**
8. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-162 xác nhận số lần — lần thứ 16 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; POSTBOOT_PASS cho boot `d9a8d1ce` (#64 ứng viên) ĐÃ CÓ (11:40:00Z, replay-day-du, dpkg 1545); POSTBOOT_PASS #63 ĐÃ CÓ (giao T5-162 xác nhận — xem LIMITS T5-162).
9. **0 reboot trong phiên** — số hiệu #64 là ỨNG VIÊN, chờ T0 xác nhận; mù cho boot mới giao T2-162 (theo quyết (s) đợt 158, #62 đã xác nhận ở đợt 161; #63/#64 chưa).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 162 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159 + (h) đợt 160 + (h) đợt 161) — 1 KẸT MỚI (86n2 P5-ENTRY), CHUỖI VỀ 0

## B1. Trạng thái giả thuyết sau đợt 162 (H3 vẫn mở — 1 kẹt mới, cùng chữ ký)

| Giả thuyết | Trạng thái đợt 161 | Trạng thái đợt 162 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — wedge "chết lặng" (idle, không spin, không leak) | **VẪN MỞ — 1 KẸT MỚI CÙNG CHỮ KÝ (86n2 P5-entry: evaluate chết, vite sống, process idle — xem F-162-T8-1); điểm pha MỚI, chữ ký KHÔNG MỚI** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153) | **BÁC BỎ (đứng nguyên — kẹt mới: %CPU giảm, RSS giảm, không ăn thêm)** |

- Đợt 162 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **1 kẹt thật trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết phân biệt mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — kẹt đợt này cùng chữ ký wedge H3, chỉ khác điểm pha).
- Điểm quan sát duy nhất (tương quan, không kết luận): avail min 362 MB trong cửa sổ harness — THẤP NHẤT các đợt gần đây (161: 541 MB, 0 kẹt; 160: 468 MB, 0 kẹt; 158: 168 MB, 2 kẹt); balloon tăng trong lúc kẹt 86n2 (5.396 → 5.959 MB) trong khi avail rơi 922 → 464 MB. H1 đã bác bỏ nên không dùng tương quan này để hồi sinh H1; chỉ ghi nhận để T8-163 đối chiếu tiếp. **Lưu ý riêng đợt này:** T4 attempt1 ĐẠT NGAY ở RAM 2.643 MB (cửa mở poll #22) — RAM cao lúc yên, RAM thấp lúc kẹt harness 40 phút sau; hai cửa sổ khác nhau, đừng gộp thành bằng chứng H1/H2.
- Lưu ý phân biệt chữ ký: kẹt 86n2 là evaluate treo ở P5-entry (page JS chết, vite HTTP 200) — không phải PAGE-WEDGED của T4 (T4 0 PAGE-WEDGED lần thứ 6 liên tiếp). Đợt này T4 1 lượt hợp lệ (attempt1), T8 1 kẹt; đừng gộp hai việc thành một lỗi. 0 reboot trong phiên — không có sự kiện hạ tầng nào để nhầm thành kẹt.

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 162

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–162) + đường ổn định `t8-diag-stall.sh` → 162 (CẢ HAI symlink cập nhật 11:37Z; kiểm cuối vẫn trỏ 162 — xem F-162-T8-5) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **1 kẹt → 1 kích hoạt ĐÚNG, 0 false-positive** | **1 KÍCH HOẠT — ĐÚNG (có kẹt thật để bắt).** 4 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–162) | 6 lần chạy harness; `live_diags=2` ở WebKit 86n2, `=0` ở 5 pha còn lại | **2 kích hoạt — LẦN ĐẦU THẬT (điểm mù F-158-T8-4 với HB128/85m4 vẫn đứng)** |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=54 mẫu hợp lệ) | Balloon n=54 pinned=0 min=5.028.232 max=6.050.320 (93,9% trần) mean=5.556.377; avail min=362 MB @12:28:58Z (lúc kẹt WebKit 86n2); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 12:32:10Z), 85m4 PASS (exit 0, 12:34:26Z), 86n2 PASS (exit 0, 12:38:31Z)** | N cộng dồn **N=24 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → kích hoạt** (snapshot timeout124 12:30:54Z; dmesg EPERM; journalctl-k trống) | Có snapshot timeout124/live-diag đợt này (đúng — có kẹt) |

## B3. Chữ ký kẹt — đợt 162: 1 KẸT (86n2 P5-ENTRY — ĐIỂM MỚI, CÙNG HỌ WEDGE H3)

- **86n2 P5-entry (runEngine:527) — ĐIỂM KẸT MỚI — KẸT** (12:18:23Z watchdog, probe 1+1 TIMEOUT 30 s 12:18:53Z, SIGKILL 12:30:53Z, exit 124). P1/P2/P3/P4-lần1/2/3 đều PASS trước đó; `ev(STATE_FN)` đầu P5 không trả. Vite HTTP 200 cả 3 snapshot; WebKitWebProcess idle (%CPU tích lũy giảm 58,7 → 18,0), RSS giảm 328 → 215 MB; loadavg thấp. **Chữ ký = wedge H3 ("chết lặng"), không phải chữ ký mới.**
- **86n2 P2-entry (runEngine:439) — điểm kẹt đợt 158 — PASS lần thứ tư liên tiếp** (P2 PASS 12:16:44Z, reset xong 656 ms, extraEvents=[]). P4-lần2 PASS 12:17:18Z (delta=+1, ct=2,867). **86n2 P4-lần2: chuỗi verdict 12 → 13.**
- **85m4 P4-lần3 (waitForPlaySync) — điểm kẹt đợt 158 — PASS lần thứ tư liên tiếp** (12:14:55Z, element đồng bộ sau 1,8 s, playhead=1,533, ct=1,633, delta=+1, hạ-cánh-về-target=true, errors=0). Không có WATCHDOG-137, không probe, không live-diag — evaluate trả đúng hạn cả 3 lần P4. **85m4 kẹt lần 2 (đợt 158) KHÔNG tái diễn lần thứ tư liên tiếp** → chưa đủ điều kiện mở điều tra riêng (quyết (i) đợt 158).
- **84l10 E4-setup — điểm kẹt đợt 157 — KHÔNG tái kẹt đợt thứ năm liên tiếp** (E4 PASS ended=true đợt 158 + 159, ended=false đợt 160 + 161 + 162 — xem F-162-T8-7; W1-lần1/2/3 PASS + W2 PASS cả năm đợt).
- **Đối chiếu với kẹt đợt 158 (85m4 P4-lần3 + 86n2 P2-entry):** cùng workload, cùng cây (preview.tsx 530e10a7 không đổi), KHÁC boot đo trong đợt này (`d9a8d1ce`; kẹt đợt 158 trên boot `28366bd0` #58) và KHÁC điểm pha (P5-entry thay vì P2-entry/P4-lần3). Không kết luận boot gây/không gây kẹt — chỉ ghi nhận khác biệt để T10 đối chiếu.
- **Không có điểm pha nào "nóng" khác đợt này:** cả 3 pha Chromium + 2 pha WebKit còn lại đều PASS đủ P1–P6/W1/W2/E4 (trừ ghi chú WebKit 84l10 E4 `ended=false` + Chromium 84l10 W1-lần2 delta=+2 (artifact test đã biết — bắn lặp do ghi đè ended còn bật) và E4 `ended=false` — như các đợt trước, chỉ là khác biệt; tất cả không phải FAIL).

## B4. Đếm lần chạy không-kẹt cộng dồn — đợt 162: 1 KẸT, CHUỖI VỀ 0

- Đợt 137: 6 lần chạy, 0 kẹt. Đợt 138: 0 lần chạy (không đếm). Đợt 139: 6 lần chạy, 0 kẹt. Đợt 140: 0 lần chạy (không đếm). Đợt 141: 7 lần chạy (6/6 + retry), 1 KẸT (86n2 WebKit) + 1 FAIL oan (84l10 attempt1, retry PASS). Chuỗi "P3 không kẹt" về 0 ở đợt 141.
- Đợt 142: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 143: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 144: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 145: 6 lần chạy, 0 kẹt (chuỗi 4). Đợt 146: 6 lần chạy, 0 kẹt (chuỗi 5). Đợt 147: 6 lần chạy, 0 kẹt (chuỗi 6). Đợt 148: 6 lần chạy, 1 KẸT (86n2 WebKit P4-lần2) — chuỗi về 0. Đợt 149: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 150: 6 lần chạy, 2 KẸT (85m4 P1 + 86n2 P5) — chuỗi về 0. Đợt 151: 6 lần chạy, 2 KẸT (85m4 P1 + P5) — chuỗi về 0. Đợt 152: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 153: 6 lần chạy, 1 KẸT (85m4 P1-phaseA) — chuỗi về 0. Đợt 154: 6 lần chạy, 0 kẹt (chuỗi 1). Đợt 155: 6 lần chạy, 0 kẹt (chuỗi 2). Đợt 156: 6 lần chạy, 0 kẹt (chuỗi 3). Đợt 157: 6 lần chạy, 1 KẸT (84l10 E4-setup) — chuỗi về 0. Đợt 158: 6 lần chạy, 2 KẸT (85m4 P4-lần3 + 86n2 P2-entry) — chuỗi VẪN 0. Đợt 159: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS + 86n2 P2-entry PASS) — chuỗi 0 → 1. Đợt 160: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ hai liên tiếp + 86n2 P2-entry PASS lần thứ hai liên tiếp) — chuỗi 1 → 2. Đợt 161: 6 lần chạy, 0 KẸT (85m4 P4-lần3 PASS lần thứ ba liên tiếp + 86n2 P2-entry PASS lần thứ ba liên tiếp) — chuỗi 2 → 3. **Đợt 162: 6 lần chạy, 1 KẸT (86n2 WebKit P5-entry, runEngine:527 — điểm kẹt mới, cùng chữ ký wedge H3) — chuỗi 3 → 0.** Kẹt cộng dồn: **13 → 14**.
- Nếu đợt 163 sạch (0 kẹt trong 6 lần chạy) thì chuỗi lên 1.
