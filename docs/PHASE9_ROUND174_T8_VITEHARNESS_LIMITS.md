# Đợt 174 T8 — (f') V1 + Q3 GIÁM SÁT LIVE (0 KÍCH HOẠT, 0 FP) + HARNESS 6/6 SẠCH, 0 KẸT (KẸT CỘNG DỒN GIỮ 20; CHUỖI "P3 KHÔNG KẸT" 2 → 3); O8 T8 PASS 3/3 TRÊN BOOT #85 — T4 CÓ LƯỢT YÊN HỢP LỆ #43 TRÊN CÙNG BOOT → T8 ĐỀ XUẤT CHUỖI WEBKIT FULL PASS 24 → 25 (PARENT QUYẾT CUỐI; CAVEAT GATE REPAIR-TAY)

Ngày: 22–23/11/2026 (lượt cron 06:35 +07 23/11 = 23:35:51Z 22/11; T8 mở ~23:38Z, đóng 00:57Z — TRONG hạn cờ ~02:00Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) harness vite 6/6 (quy trình đợt 173 — không còn việc triển khai mới: (f') V1 + Q3 đã triển khai xong đợt 173, đợt này chỉ giám sát live); (2) giám sát (f') V1 live: trigger thật hay FP; (3) Q3 heartbeat 84l10 chạy kiểm lại (script md5 `baaa13c0` — không đổi); (4) O8 trên boot hiện tại (WebKit 21/21 ×2 + Chromium 21/21) — phối hợp T0 (T0 cũng chạy O8, hai bộ độc lập); (5) checklist (o) 21/21 mục; (6) H3 chỉ giám sát thụ động.
Nợ: docs/PHASE9_ROUND173_T8_VITEHARNESS_LIMITS.md ((f') V1 + Q3 triển khai live + kiểm lại; harness 6/6 sạch; O8 T8 PASS 3/3 trên boot #84; chuỗi WebKit FULL PASS GIỮ 24; checklist (o) 21/21; 3 reboot #83/#84/#85).

## 0. Kết luận ngắn — HARNESS 6/6 SẠCH; O8 T8 PASS 3/3; T4 CÓ LƯỢT YÊN HỢP LỆ TRÊN CÙNG BOOT #85 → ĐỀ XUẤT CHUỖI 24 → 25

- **Harness (MỘT lần chạy driver duy nhất, boot `3c704685` #85): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (00:31:13–00:46:56Z, 15'43" — như đợt 172/173 do 0 timeout): WebKit 84l10 **PASS đầy đủ** (W1-lần1/2/3 PASS +1/+1/+1, W2 PASS playhead cuối=30, E4 PASS — lần thứ ba liên tiếp sau 172/173); WebKit 85m4 **PASS** (P1/P2/P3 + P4-lần1/2/3 +1, P5 PASS 40 s **0 restart** — **P4-lần3 PASS lần thứ ba liên tiếp, chuỗi mới = 3**); WebKit 86n2 **PASS** (P1/P2/P3 + P4-lần1/2/3 +1, P5 PASS 40 s **0 restart** — **P4-lần2 verdict 24 → 25**). Chromium 84l10/85m4/86n2 PASS. **Kẹt cộng dồn GIỮ 20. Chuỗi "P3 không kẹt" 2 → 3** (đợt sạch thứ ba liên tiếp 172–174). Chromium đối chứng N=35 → **N=36 mỗi pha**, 0 kẹt.
- **(f') V1 live: 0 kích hoạt — ĐÚNG (0 kẹt thật; 0 FP).** Log 85m4 sạch 19 dòng HB128 maxspan=5 s; log 84l10 mới có HB128: check-fresh OK maxspan=0 s (không FP từ Q3). Kiểm lại trước harness bằng chính helper: kẹt-164 TRIGGER @125 s, kẹt-171 TRIGGER @305 s, 0 FP trên 9 log sạch thật (163/165/166/167/168/169/170/172/173/174 — xem §C; replay C5.1 ĐẠT).
- **Q3 heartbeat 84l10 chạy kiểm lại: WebKit W2 6 tick HB128 (5/10/15/20/25/30 s, playhead 4.167→28.867, seeking=false playing=true) + W2/E4 PASS; Chromium W2 5 tick + W2/E4 PASS; E4 0 tick cả hai engine — ĐÚNG thiết kế** (vòng E4 khỏe ~4–5 s, tick 5 s chưa kịp bắn; xem §D). 84l10 PASS đầy đủ lần thứ ba liên tiếp — chưa có ca kẹt mới (điều tra riêng đợt 3).
- **O8 T8 PASS 3/3 trên boot `3c704685` (#85, ĐÃ XÁC MINH 9 nguồn bởi T0-174)**: WebKit 21/21 ×2 (00:26:57 pid 52401 md5 `18340611` + 00:27:54 pid 52799 md5 `bcc11471`) + Chromium 21/21 (00:28:43 pid 53193 md5 `97d9308e`), exit 0/0/0, 00:26:57–00:29:33Z (2'36"). S1 PASS cả 3 lần (WebKit: 00:27:12.589Z + 00:28:04.954Z, Playwright mouse click lần 2; Chromium: 00:29:03.037Z, CDP mouse click lần 2). **KHÁC BỘ T0: T0-174 O8 trên CÙNG boot #85 cũng PASS 3/3** (WebKit pid 18668/25983 + Chromium pid 32439, 23:43:42–23:47:50Z, md5 `f91f8fe6`/`d9f19eb6`/`1e6268af` theo xác nhận độc lập của T1-174) — hai bộ độc lập khác pid/md5, đồng thuận PASS.
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT TĂNG 24 → 25 (parent/T10 quyết cuối).** Cả bốn chân đều có TRÊN CÙNG BOOT #85 (đã xác minh): (1) **lượt yên hợp lệ #43 của T4** (attempt2-3c704685 20/20 + lớp B 5/5 + tickCost median 44,5 ms ≤60, 00:13:52Z — SAU postboot 23:46:57Z; chuỗi lượt yên 36 → 37); (2) **gate (a) POSTBOOT_PASS #85 ĐÃ CÓ** (23:46:57Z, poll=1 — VỚI caveat mode repair-tay-T5, không phải replay-đầy-đủ; tiền lệ #75/#81/#84 đã chấp nhận gate repair); (3) **O8 T0 PASS 3/3** trên #85; (4) **O8 T8 PASS 3/3** trên #85 (bộ độc lập thứ hai, chạy HOÀN TOÀN sau postboot). **Kết luận "GIỮ 24" trong cờ T0-174 (23:52Z) đã LỖI THỜI** — viết trước khi T4 có lượt hợp lệ (00:13:52Z); T0 ghi rõ "T4-174 0 attempt tính tới lúc đóng". T8 không tự chốt chuỗi — parent/T10 quyết cuối (xem §A).
- **Gate: waiter GATE-FOUND poll 39 lúc 00:23:58Z** (t4=OK, postboot đường (a) POSTBOOT_PASS; 38 poll, 0 REBOOT trong log, WAIT-DEADLINE không chạm). T4 attempt1 PAGE-WEDGED sau pass 3 (exit 2, partial — retry); attempt2 hợp lệ (ngân sách 2/3).
- **Watchdog (i): 0 kích hoạt — ĐÚNG (0 kẹt thật). Live-diag (1b): 0 kích hoạt — ĐÚNG (0 log im lặng). (1c') với (f'): 0 kích hoạt live — ĐÚNG (0 FP, 0 BỎ LỠ).** 0 snapshot stall. RAM sampler n=32: balloon max 92,5% trần, 0 mẫu ghim; avail min **464 MB @00:39:43Z** (trong cửa sổ Chromium 84l10 — KHÔNG kẹt: avail thấp một mình không gây kẹt).
- **Boot lúc mở = boot lúc đóng: `3c704685` (#85) — 0 REBOOT trong phiên T8** (khác đợt 173 có 3 reboot). Marker mtime 2026-11-20 11:39:47.272154981Z KHÔNG ĐỔI — **sống qua 37 reboot #49–#85 (T0-174 ĐÃ XÁC MINH 9 nguồn cả #84 lẫn #85)**.
- **X11: X194/X195 (của T1-174 suite, displays :194/:195) đã được T8 DỌN tay lúc đóng** (mồ côi, không process giữ, không listener — xem F-174-T8-6); X193 đã vắng từ lúc extract 00:48Z; `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối.
- **T8 ĐÓNG TRONG hạn cờ ~02:00Z** (O8 xong 00:29:33Z; harness xong 00:46:56Z; trích số xong ~00:48Z; đóng 00:57Z).

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 22:59:36 22/11 | REBOOT #85 (boot `3c704685`, btime 1795388376) — TRƯỚC khi đợt mở 36' (gap #84→#85 = 7.101 s; **T0-174 ĐÃ XÁC MINH 9/9 nguồn**; #84 cũng XÁC NHẬN — boot `4ae2d2ea`, gap #83→#84 = 2.128 s) |
| 23:00:10–23:37:33 | Phiên apt lớn giờ 23 (dpkg.log 1647 dòng, toàn bộ giờ 23 — log bắt đầu 23:00:10Z): cài nhiều gói (fonts, libdrm, nasm, libvidstab-dev, gstreamer1.0-tools 23:37:33Z) — replay host-side một phần (159 install, thiếu 2 gói postboot + libEGL.so.1) |
| 23:35:51 | Đợt 174 mở (lượt cron 06:35 +07 23/11) |
| ~23:38 | T8 mở: đọc LIMITS T8-173 + GAP §102 + aggregate 173 §8/§12.3(o); cây + 3 script harness + 2 script O8 gốc KHỚP md5 đợt 173 (không đổi); fixture /tmp MẤT theo reboot #85; `/tmp/.X11-unix/` TRỐNG lúc mở (0 socket) |
| ~23:39 | **Copy driver 173→174 (cp -r, exit 0 — KHÔNG EPERM, khác F-173-T8-1) + đổi nhãn 173→174 + dọn scratch cũ bằng lệnh riêng (đường dẫn tuyệt đối)** |
| ~23:39 | **Cập nhật CẢ HAI symlink diag NGAY (trước mọi lần chạy) — hidden_files/t8-diag-stall.sh VÀ repo apps/web/scripts/t8-diag-stall.sh đều → `round174-t8/diag-stall-174t8.sh`, readlink + test -x + test -e xác nhận** |
| 23:41:19 | **Selfcheck #1 trên #85: libs 5/6 (libEGL THIẾU); GST plugins 1266 (binary gst-inspect-1.0 CÓ — khác artifact F-173-T8-2); dpkg.log 1647; cache 170, lists 28; RAM avail 1300 MB, balloon 5.384.688 kB** |
| 23:42:00 | **T5-174 watcher-174 REPLAY_DONE nhưng postboot poll0 FAIL (exit=1)** — thiếu gstreamer1.0-plugins-bad + gstreamer1.0-gl + libEGL.so.1; GST PASS (119/269 file, isomp4 + libav đủ); watcher ghi "cho T5 xu ly tay" |
| 23:42:47–23:45:57 | **T5-174 manual repair (exit 0, 3m10s)** — cài đủ plugins-bad + -gl + libegl-mesa0 + libegl1; log apt copy ngay ra khỏi /tmp (F-173-T5-9 đã áp dụng) |
| ~23:44 | **Rebuild fixture /tmp trên #85 (quy tắc (l)): hevc + i7 + h-30s/g-4s KHỚP kỳ vọng đợt 125 (`ba0c7c62`/`f05daed8`/`fbaa3d1a`/`a1fb8549`)** |
| ~23:45 | **Kiểm lại (f') V1 bằng helper 174: kẹt-164 @125 s, kẹt-171 @305 s, 173-sạch OK maxspan=5 s; replay-f-fix V1-300 ĐẠT, 174-sạch NO-FILE** |
| 23:45:53 | **Waiter T8 bắt đầu trên boot `3c704685` (deadline 01:30Z 23/11); poll 1: t4=0 postboot=0** |
| 23:46:25 | **T5 independent check-only poll1 exit=0** — 11/11 gói, 5/5 lib, GST 269=269 (thư mục thật) |
| 23:46:57 | **POSTBOOT_PASS #85 ĐÃ CÓ (T5, poll=1, mode repair-tay-T5 — dpkg 1731, cache 175, lists 75, GST 269)** — waiter chuyển postboot=1 từ poll 3 (23:47:55Z) |
| 23:43:42–23:47:50 | **T0-174 O8 DONE: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #85** (lock t0-round174 đã nhả 23:47:50Z; vite TRỐNG, 102 cooldown; attempt1 hoàn toàn tiền-postboot mà vẫn PASS) |
| 23:47:57 | **Selfcheck #2 trên #85: libs 6/6 đủ; GST 1624; dpkg 1731; cache 175, lists 75** (sau repair T5) |
| 23:48:10 | T4 poll #10: gate0=T5, RAM 1655 MB, blockers 0, lock trống — đủ điều kiện attempt |
| 23:52 | **T0-174 + T1-174 ĐÓNG CỜ** (T0: #84/#85 xác minh 9 nguồn; run 173 TIMEOUT; (m) #84/#85 số liệu thô; chuỗi GIỮ 24 — viết TRƯỚC khi T4 có lượt hợp lệ, xem §A; T1: verify 173 PASS, suite 28/28) |
| 00:13:52 | **T4 attempt2-3c704685 LUOT HOP LE** (20/20 + lớp B 5/5 + tickCost median 44,5 ms; attempt1 PAGE-WEDGED sau pass 3, exit 2 — retry; ngân sách 2/3) |
| 00:23 | **T4-174 ĐÓNG CỜ** (lượt yên #43 hợp lệ; chuỗi lượt yên 36 → 37; POSTBOOT_PASS #85 mode repair-tay-T5) |
| 00:23:58 | **WAIT-GATE-FOUND poll 39** (t4=OK, postboot đường (a)) — waiter thoát exit 0 |
| 00:26:57–00:29:33 | **Driver O8 T8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #85** (xem §A) |
| 00:31:13–00:46:56 | **Harness (MỘT lần chạy driver duy nhất, boot `3c704685`): WebKit 3/3 + Chromium 3/3 — 6/6 PASS, 0 KẸT** (xem §2) — 0 reboot giữa O8 và harness; boot #85 ổn định |
| ~00:48 | **Trích số liệu (extract-174t8.py) + replay (1c')/(f') trên log 174: C5.1 ĐẠT (0 FP trên 10 log sạch thật 163/165/166/167/168/169/170/172/173/174; kẹt-171 ghi đúng là BỎ LỠ theo V0 — đã bắt được bằng (f'), xem §C)** |
| 00:49 | **T8 dọn tay 2 socket X11 mồ côi X194/X195 (của T1 suite :194/:195 — xem F-174-T8-6); `/tmp/.X11-unix/` TRỐNG sau khi dọn** |
| ~00:52 | Kiểm cuối (extract + kiểm tay): 0 process sót; lock vite TRỐNG (0 ticket + 101 cooldown); fixture /tmp vẫn khớp md5; boot `3c704685` không đổi; marker mtime không đổi |
| 00:57 | Cờ `round174-t8.done` — **TRONG hạn cờ ~02:00Z** (kiểm boot lần cuối ngay trước khi viết cờ: boot `3c704685`, btime 1795388376, không reboot mới) |

## A. O8 — PASS 3/3 trên boot `3c704685` (#85, ĐÃ XÁC MINH 9 NGUỒN); T8 ĐỀ XUẤT CHUỖI 24 → 25

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 00:26:57–00:27:12 | 0 | **21/21 PASS** — S1 PASS 00:27:12.589Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 00:27:54–00:28:04 | 0 | **21/21 PASS** — S1 PASS 00:28:04.954Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 00:28:43–00:29:03 | 0 | **21/21 PASS** — S1 PASS 00:29:03.037Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-clicktest-report-2026-11-23T00-26-57-3c704685-pid52401.json` 21 kết quả `ok=true` 21/21, md5 `18340611`; attempt2 `o8w-clicktest-report-2026-11-23T00-27-54-3c704685-pid52799.json` 21/21 `ok=true`, md5 `bcc11471` — **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau** (cơ chế T0-152 còn đúng); Chromium `o8-clicktest-report-2026-11-23T00-28-43-3c704685-pid53193.json` 21/21 `ok=true`, md5 `97d9308e`. Bản copy dự phòng của driver T8 khớp nội dung file stamped (cùng md5). 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (grep đầy đủ: PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- **NHÃN LIB ĐÚNG NGAY TỪ ĐẦU — O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH` với DEBROOT, driver cũng vậy — như đợt 162–174). Bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (#85) với POSTBOOT_PASS cho boot đo ĐÃ CÓ (23:46:57Z, mode repair-tay-T5) VÀ libs 6/6 theo selfcheck #2 — **và harness PASS 6/6, nên bằng chứng launch+pass bằng system libs đợt này là ĐẦY ĐỦ**.
- Driver O8 giữ 1 lock vite `t8-round174` suốt lượt (nhả 00:29:33Z; vite sau release curl 5560/5554 = 000000 — như đợt 162–173).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-174t8.mjs`, bản copy từ 173, chỉ đổi nhãn) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Gate cho boot đo `3c704685`: (a) CÓ — VỚI CAVEAT MODE REPAIR-TAY.** POSTBOOT_PASS trong `round174-t5/` chứa boot `3c704685` (ghi 23:46:57Z, poll=1, mode repair-tay-T5: dpkg 1731 dòng, cache 175, lists 75, GST 269; independent check 23:46:25Z exit 0) — waiter chuyển postboot=1 từ poll 3 lúc 23:47:55Z. Không cần đường (b). **Caveat: replay host-side CHỈ MỘT PHẦN** (159 install, thiếu 2 gói postboot + libEGL.so.1 — mẫu F-173-T5-3 lần 2; T5 không tự phán gate). O8 của T8 chạy HOÀN TOÀN SAU postboot (00:26:57Z, sau cờ 40'), khác O8 của T0 (attempt1 hoàn toàn tiền-postboot, 23:43:42Z).
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT TĂNG 24 → 25 (parent/T10 quyết cuối — T8 KHÔNG tự chốt).** Cả bốn chân đều có TRÊN CÙNG BOOT #85 (đã xác minh 9 nguồn): (1) lượt yên hợp lệ #43 của T4 (attempt2 20/20 + lớp B 5/5 + tickCost median 44,5 ms ≤60, 00:13:52Z — SAU postboot; chuỗi lượt yên 36 → 37; cộng dồn P1 150/153, P2 144/144, P3-A1 126/153, P3' 113/125 occ = 99/104 distinct, P7 71/71); (2) gate (a) POSTBOOT_PASS #85 (23:46:57Z, poll=1, mode repair-tay-T5); (3) O8 T0 PASS 3/3 trên #85 (23:43:42–23:47:50Z, pid 18668/25983/32439, md5 `f91f8fe6`/`d9f19eb6`/`1e6268af` — T1 xác nhận độc lập); (4) O8 T8 PASS 3/3 trên #85 (00:26:57–00:29:33Z, pid 52401/52799/53193, md5 `18340611`/`bcc11471`/`97d9308e` — bộ độc lập thứ hai, khác pid/md5). **Kết luận "GIỮ 24" trong cờ T0-174 (23:52Z) đã LỖI THỜI — viết trước khi T4 có lượt hợp lệ (00:13:52Z); T0 ghi rõ "T4-174 0 attempt tính tới lúc đóng".** Điểm duy nhất cần parent cân nhắc: gate (a) mode repair-tay (không phải replay-đầy-đủ) — tiền lệ #75/#81/#84 đã chấp nhận gate repair cho chuỗi; T5 không tự phán gate. Nếu parent bác gate repair thì chuỗi GIỮ 24.
- **O8 đợt này 2'36" tổng** (173: 2'41", 172: 2'32", 171: 2'37", 170: 2'36", 169: 2'40", 168: 2'36", 167: 3'01", 166: 2'59", 165: 2'37", 164: 3'02", 163: 3'07", 162: 2'37") — trong khung dao động các đợt gần đây, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: WEBKIT 3/3 + CHROMIUM 3/3, 6/6 PASS, 0 KẸT, 0 REBOOT GIỮA O8 VÀ HARNESS

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 00:31:16–00:32:26 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1 sạch), W2 PASS (playhead cuối=30, tới cuối=true, restart tự nhiên Δ=0), E4 PASS (tới cuối=true, ct cuối=3.767, ended=false — xem F-174-T8-7, restart 3→3) — **84l10 WebKit PASS trọn vẹn lần thứ ba liên tiếp (172, 173, 174); Q3 heartbeat W2 6 tick chạy đúng (xem §D)** |
| 2 | WebKit 85m4 | 0 | 00:32:42–00:35:03 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (extraEvents=[]) — **P4-lần3 PASS lần thứ ba liên tiếp (chuỗi mới = 3)** |
| 3 | WebKit 86n2 | 0 | 00:35:18–00:39:18 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** — **P4-lần2 verdict 24 → 25** |
| 4 | Chromium 84l10 | 0 | 00:39:34–00:40:34 | **PASS** — W1-lần1 PASS (+1), W1-lần2 PASS (+2 — artifact bắn lặp, xem F-174-T8-8), W1-lần3 PASS (+2 — artifact bắn lặp), W2 PASS (playhead cuối=30, Δ=0), E4 PASS (tới cuối=true, ct cuối=3.98, ended=false — xem F-174-T8-7, restart 6→6) — **Q3 heartbeat W2 5 tick chạy đúng** |
| 5 | Chromium 85m4 | 0 | 00:40:49–00:42:50 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+2 — lần3 +2, xem F-174-T8-8), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 00:42:49.131Z) |
| 6 | Chromium 86n2 | 0 | 00:43:06–00:46:56 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+2/+1/+1 — lần1 +2, xem F-174-T8-8), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 00:46:47.810Z) |

- 6 report JSON kiểm độc lập bằng python: 6× `ok=true` (finishedAt 00:32:22.524Z / 00:34:53.879Z / 00:39:09.574Z / 00:40:32.191Z / 00:42:49.131Z / 00:46:47.810Z).
- Môi trường: system libs trên boot `3c704685` (sau repair tay của T5: libs 6/6 + GST 269 plugin thư mục thật, T5 independent check exit 0; selfcheck T8 #2: 6/6 lib + dpkg 1731 + cache 175 + lists 75; POSTBOOT_PASS cho boot đo ĐÃ CÓ 23:46:57Z mode repair-tay-T5). **WebKit launch + PASS THÀNH CÔNG bằng system libs** trên ĐÚNG boot đo (cả 3 pha đều chạy trọn vẹn — bằng chứng pass đầy đủ). Không cần lần chạy DEBROOT thứ hai.
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (chỉ 1 lần chạy driver chuẩn; Chromium cùng pha PASS đã là đối chứng đủ).
- **Harness 15'43"** (00:31:13–00:46:56Z) — như đợt 172 (15'33")/173 (15'30") do 0 timeout (171: 53'21" với 3 kẹt; 170: 29'24" với 1 kẹt; 169: 15'30"; 168: 15'29"; 167: 16'14").

## 3. Watchdog trong lượt này — 0 KÍCH HOẠT (ĐÚNG — 0 KẸT THẬT) + LIVE-DIAG 0 + (1c') VỚI (f') 0 KÍCH HOẠT (0 FP, 0 BỎ LỠ)

- **Watchdog (i): 0 kích hoạt — ĐÚNG.** 0 dòng `WATCHDOG-137` trong 6 log pha (0 kẹt thật để bắt). 0 false-positive.
- **Driver (1b) live-diag: 0 kích hoạt — ĐÚNG.** 0 dòng `LIVE-DIAG-174` trong summary; `live_diags=0` ở cả 6 pha (0 log im lặng >120 s). 0 snapshot stall.
- **(1c') fresh-content với (f') V1: 0 kích hoạt live — ĐÚNG, 0 FALSE-POSITIVE, 0 BỎ LỠ.** Log 85m4 WebKit sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (6 dòng W2 + 0 dòng E4) — check-fresh OK maxspan=0 s (không FP từ Q3). Không có kẹt thật nào trong phạm vi (c') đợt này. **(c') + (f') ĐƯỢC GIỮ** (không có FP → không cần quyết lại; lần thứ hai (f') chạy live trên đợt sạch — vẫn chưa có ca kẹt paused+seeking để chứng minh live).
- 0 snapshot stall đợt này (đúng — 0 kẹt).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–173 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–174; 84l10 đã thêm Q3 heartbeat — không chạm `ev()`) + đường ổn định `t8-diag-stall.sh` → 174 (CẢ HAI symlink cập nhật 23:39Z, TRƯỚC mọi lần chạy) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt ĐÚNG, 0 false-positive** | **ĐÚNG — KHÔNG KÍCH HOẠT OAN KHI KHÔNG CÓ KẸT.** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–174) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — ĐÚNG, KHÔNG LOG NÀO IM LẶNG >120 s** |
| (1c') Kiểm "nội dung tươi" (c') + (f') V1 | **(f') ĐÃ TRIỂN KHAI từ đợt 173** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (85m4 + 84l10 W2/E4 có HB128); `live_diags=0` ở 85m4/84l10 | **0 kích hoạt live — 0 FP, 0 BỎ LỠ. (c')+(f') ĐƯỢC GIỮ (xem §C).** Replay sau harness: C5.1 ĐẠT (kẹt-164 TRIGGER 125 s theo V0; 0 FP trên 10 log sạch thật 163/165/166/167/168/169/170/172/173/174) + kiểm lại (f') bằng chính helper: kẹt-171 @305 s |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-174t8.sh` (cột `balloon_kb`) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.093.600 max=5.959.752 (92,5% trần) mean=5.537.549; avail min=464 MB @00:39:43Z (trong cửa sổ Chromium 84l10 — KHÔNG kẹt) / max 1.321 MB |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (exit 0, 00:40:34Z), 85m4 PASS (exit 0, 00:42:50Z), 86n2 PASS (exit 0, 00:46:56Z)** | N cộng dồn **N=36 mỗi pha** (đợt 137/139/141/142/143/144/145/146/147/148/149/150/151/152/153/154/155/156/157/158/159/160/161/162/163/164/165/166/167/168/169/170/171/172/173/174 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline đã lưu lúc bắt đầu; 0 snapshot stall) | 0 snapshot stall đợt này (đúng — không có kẹt) |

## 5. Cây + md5 — mở / cuối

| File | md5 lúc mở | md5 lúc cuối | Đổi? |
|---|---|---|---|
| `apps/web/src/preview.tsx` | 530e10a7 | 530e10a7 | Không |
| `apps/web/src/media.ts` | 2c384ed1 | 2c384ed1 | Không |
| `apps/web/vite.config.ts` | ee80d093 | ee80d093 | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` | baaa13c0 | baaa13c0 | Không (Q3 từ đợt 173; 34.880 B, dưới 37.768 B) |
| `apps/web/scripts/clicktest-85m4-webkit-w7-hb128.mjs` | 610ee003 | 610ee003 | Không |
| `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` | 628088bd | 628088bd | Không |
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | 4994b4fc | 4994b4fc | Không |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | c8acd72e | c8acd72e | Không |

- **T8 không sửa file repo nào đợt này** (chỉ thêm LIMITS này) — (f') V1 + Q3 đã triển khai xong đợt 173, đợt này chỉ giám sát + kiểm lại. Driver trong hidden_files thay đổi so với đợt 173: nhãn log `LIVE-DIAG-173` → `LIVE-DIAG-174`, `FRESH-CONTENT-173` → `FRESH-CONTENT-174`, lock `t8-round173` → `t8-round174`, deadline waiter 22:30Z 22/11 → **01:30Z 23/11** (kiểm lại epoch bằng `date -d`), nhãn `T8-173` → `T8-174` trong o8-driver + selfcheck-postboot, WAIT1 trong extract sửa đúng boot lúc mở `3c704685` (F-155-T8-6). Copy bằng `cp -r` (exit 0, KHÔNG EPERM như F-173-T8-1 với `cp -a`). **Một nhãn sót: dòng release lock trong o8-driver vẫn ghi "T8-173" (xem F-174-T8-5).**
- Script trích số liệu `extract-174t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (đọc 1 log waiter đợt này: 38 poll + GATE-FOUND poll 39 lúc 00:23:58Z, 0 WAIT-DEADLINE, 0 REBOOT; postboot=1 trong 36 dòng — TẤT CẢ cho boot `3c704685`).
- Script replay (1c') `replay-1c-174t8.py` (cập nhật từ 173: thêm entry log 174-sạch); script replay (f') `replay-f-fix-174t8.py` (thêm entry 174-sạch — NO-FILE lúc chạy trước harness, có file sau harness; kết quả V1-300 không đổi).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round174` 00:29:33Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 00:46:56Z).
- Waiter thoát exit 0 sau GATE-FOUND poll 39 lúc 00:23:58Z (0 process waiter còn lại lúc kiểm cuối).
- Kiểm cuối ~00:52Z (bằng script trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: **0**; lock vite: vite-lock-v2: TRỐNG (không có lock, 0 ticket + 101 cooldown — 100 sau prune 48 của T6-173 + cooldown-t8-round173 + cooldown-t8-round174, đúng mẫu đợt 150–174; prune lần 49 thuộc T6-174); boot `3c704685` ổn định TRONG O8+harness (btime 1795388376 không đổi từ 22:59:36Z — **0 reboot trong phiên T8**, khác đợt 173 có 3 reboot).
- `/tmp/.X11-unix/` lúc mở TRỐNG; lúc kiểm cuối TRỐNG (0 file — X194/X195 của T1 suite đã được T8 dọn tay 00:49Z, xem F-174-T8-6; X193 đã vắng từ lúc extract 00:48Z; socket của chính T8 — :188 O8-WebKit, :197 O8-Chromium, :199 harness — driver tự unlink).
- Fixture /tmp: rebuild trên #85 (md5 khớp); kiểm cuối sau harness vẫn khớp.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (repair là của T5 — T8 chỉ đọc + kiểm lại); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `3c704685` (#85, ĐÃ XÁC MINH 9/9 NGUỒN bởi T0-174)** — boot sau reboot #85 lúc 22:59:36Z, là boot lúc đo (không đổi boot trong phiên O8+harness). **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT TĂNG 24 → 25 (parent/T10 quyết cuối)** — xem §A; kết luận "GIỮ 24" trong cờ T0-174 đã lỗi thời (viết trước khi T4 có lượt hợp lệ).
2. **Harness 6/6 + 0 KẸT — kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3.** Đợt sạch thứ ba liên tiếp (172, 173, 174). Đừng gộp verdict pha con với verdict pha, và đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT (script tự đặt LD_LIBRARY_PATH), không phải system libs** — dù system libs đã đầy đủ trên boot `3c704685` theo repair tay của T5 (libs 6/6 + GST 269 plugin thư mục thật, independent check exit 0) + selfcheck T8 #2 (6/6 lib + dpkg 1731 + cache 175 + lists 75) + POSTBOOT_PASS 23:46:57Z mode repair-tay-T5. Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness (standard driver, không LD_LIBRARY_PATH) trên cùng boot đo (xem §A) — **đợt này harness PASS 6/6 nên bằng chứng là đầy đủ**. **Nhãn đã ghi ĐÚNG ngay từ đầu đợt này — không lặp lỗi nhãn sai đợt 162.**
4. **POSTBOOT_PASS cho boot đo `3c704685` ĐÃ CÓ (23:46:57Z, T5, poll=1, mode repair-tay-T5)** — khác đợt 173 (#84 repair-sớm) và đợt 172 (#81 repair-sớm) và đợt 171 (#80 replay-đầy-đủ). **Caveat mode: replay host-side CHỈ MỘT PHẦN** (159 install, thiếu 2 gói + libEGL — mẫu F-173-T5-3 lần 2); parent quyết có chấp nhận cho gate (a) như tiền lệ #75/#81/#84 hay không. Đừng trích POSTBOOT_PASS #84 (đợt 173) hay bất kỳ cờ boot cũ nào là gate cho boot đo. O8 của T8 chạy HOÀN TOÀN SAU postboot (00:26:57Z); O8 của T0 attempt1 hoàn toàn tiền-postboot (23:43:42Z) — mốc từng bộ đã ghi rõ (xem F-174-T0-6).
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=32, max 92,5% trần) — avail min 464 MB @00:39:43Z (trong cửa sổ Chromium 84l10 — KHÔNG kẹt). **Selfcheck #1 (23:41:19Z, TRƯỚC repair): balloon 5.384.688 kB (83,6% trần), avail 1300 MB — không ghim.** Giao T9 đối chiếu với sampler của họ (T9 đo cả phiên); chuỗi ghim trần phán bằng sampler T9.
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–174 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`; T10 lưu ý khi gộp. 84l10 (34.880 B sau Q3) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Chuỗi verdict ĐỔI CHIỀU đợt này (do PASS đầy đủ): 85m4 P4-lần3 PASS lần thứ ba liên tiếp (chuỗi mới = 3); 86n2 P4-lần2 PASS (chuỗi verdict 24 → 25).** H3 vẫn mở, chỉ giám sát thụ động (xem §B). Điều tra riêng 84l10 ĐỢT 3 (xem §D — Q3 chạy kiểm lại, chưa có ca kẹt mới).
8. **84l10 E4 ended=false CẢ HAI engine đợt này** (WebKit ct cuối=3.767, restart 3→3; Chromium ct cuối=3.98, restart 6→6) — khác đợt 172/173 (ended=true cả hai). Script verdict vẫn PASS cho cả hai; đừng trích ended thành FAIL (xem F-174-T8-7).
9. **T8 ĐÓNG TRONG hạn cờ ~02:00Z (00:57Z)** — O8 xong 00:29:33Z; harness xong 00:46:56Z (15'43" — như đợt 172/173 do 0 timeout); trích số xong ~00:48Z. **0 reboot trong phiên** (khác đợt 173: 3 reboot, T8 trễ cờ ~13').
10. **0 reboot liên quan đợt trong phiên T8** — chỉ có #85 TRƯỚC khi đợt mở 36' (số hiệu ĐÃ ĐƯỢC T0-174 xác minh 9/9 nguồn; gap #84→#85 = 7.101 s; marker sống qua 37 reboot #49–#85 — ĐÃ XÁC NHẬN); (m) #84 (+45,482 s) / (m) #85 (+34,397 s, sát biên dưới 1,397 s — sát biên thứ hai sau #81) thuộc T2-174 + parent (số liệu thô theo cờ T0-174); INSIDE #83/#84/#85 giao T2-174 (dải FULL129/FULL130/FULL131 — chuỗi mới dài 1 từ #82).
11. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173, 0 kích hoạt, 0 false-positive, 0 bỏ lỡ — lần thứ hai chạy live trên đợt sạch** — replay C5.1 ĐẠT (RUNSPAN TRIGGER đúng 125 s trên log kẹt 164; 0 FP trên 10 log sạch thật 163/165/166/167/168/169/170/172/173/174); kiểm lại (f') bằng chính helper: kẹt-171 TRIGGER @305 s, kẹt-164 @125 s, 0 FP trên 9 log sạch (xem §C). **Chưa có ca kẹt paused+seeking để chứng minh (f') live.**
12. **Fixture h/g md5 KHỚP kỳ vọng đợt 125** (rebuild trên #85; kiểm cuối sau harness vẫn khớp). Giả thuyết "giá trị đứng" ở F-163-T8-1 vẫn SAI — đừng dùng md5 h/g làm fingerprint ổn định.
13. **Chromium 84l10 W1-lần2 delta=+2 + W1-lần3 delta=+2; Chromium 85m4 P4-lần3 delta=+2; Chromium 86n2 P4-lần1 delta=+2** (artifact bắn lặp do ghi đè ended còn bật — xem F-174-T8-8); verdict vẫn PASS. **WebKit đợt này W1/P4 đều delta=+1 sạch cả 3 pha.** Ghi nhận để T10 đối chiếu (artifact của chính script test trên Chromium, không phải kẹt hay lỗi app); không đổi verdict pha hay verdict đợt.

## 8. Sai số mới (F-174-T8-N)

- **F-174-T8-1 — LIBEGL.SO.1 THIẾU TRÊN BOOT #85 LÚC MỞ (SELFCHECK #1: LIBS 5/6) — T5-174 ĐÃ SỬA BẰNG REPAIR TAY, SELFCHECK #2: 6/6.** Lúc T8 mở (23:41:19Z) hệ thống chưa có libEGL.so.1 (`ldconfig -p` không có; `find /usr` chỉ thấy `/opt/meta-chromium/libEGL.so`); dpkg -l không có libegl1. Đây là lần đầu selfcheck mở phiên báo thiếu libEGL (đợt 173 selfcheck #3 báo 6/6 sau repair sớm của T5). Nguyên nhân theo T5-174 poll0 (23:42:00Z): replay host-side chỉ một phần (159 install, dpkg 1647) — thiếu 2 gói postboot + libEGL. T5 manual repair 23:42:47–23:45:57Z cài libegl-mesa0 + libegl1 (+ plugins-bad + -gl); selfcheck #2 (23:47:57Z) xác nhận 6/6 + GST 1624 + dpkg 1731. **T8 KHÔNG tự cài apt (repair là của T5); chỉ đọc + kiểm lại.** Hệ quả: harness/O8 chạy SAU repair nên không bị ảnh hưởng — nhưng nếu T5 không sửa kịp thì harness WebKit bằng system libs đã không launch được. Ghi nhận để T10 đối chiếu với selfcheck #3 đợt 173 (6/6 — file libEGL khi đó có từ đâu? T5-173 repair sớm có thể đã tạo symlink/file mà phiên apt giờ 23 đã thay thế bằng cài thật).
- **F-174-T8-2 — DPKG.LOG CHỈ CÓ GIỜ 23 (1647 DÒNG, BẮT ĐẦU 23:00:10Z) — LOG MỚI TỪ ĐẦU GIỜ SAU BOOT #85.** Toàn bộ 1647 dòng đều timestamp 2026-11-22 giờ 23; không có dpkg.log.1; dòng đầu 23:00:10Z = boot+34s. Cùng lúc cache/lists nhảy (28 lists lúc selfcheck #1 → 75 sau repair). T8 không kết luận cơ chế (logrotate theo boot hay file mới) — ghi nhận để T5/T10 đối chiếu (số dpkg 1647→1731 dùng làm mốc, không so trực tiếp với 795 đợt 173 vì log đã khác chu kỳ).
- **F-174-T8-3 — COPY DRIVER BẰNG `cp -r`: EXIT 0, KHÔNG EPERM (KHÁC F-173-T8-1).** Đợt 173 `cp -a` báo lỗi preserve ownership (EPERM) nhưng nội dung còn nguyên; đợt này T8 dùng `cp -r` ngay từ đầu — copy sạch, không lỗi, bit +x giữ nguyên (chmod +x lại toàn bộ .sh sau copy). Không có điểm stale nào lọt vào chạy (waiter deadline đúng 01:30Z; extract đọc đúng boot lúc mở `3c704685`; diag symlink đúng 174 lúc kiểm cuối).
- **F-174-T8-4 — GST-INSPECT-1.0 ĐÃ CÓ LÚC MỞ (1266 PLUGIN) — KHÁC ARTIFACT F-173-T8-2.** Selfcheck #1 đợt này báo GST plugins 1266 (không phải 0) vì gstreamer1.0-tools đã được cài trong phiên apt giờ 23 (23:37:33Z). Sau repair T5: 1624 plugin. Lần đầu selfcheck đo GST thật ngay từ đầu (không cần `which` để bác artifact). Ghi nhận: số plugin 1266→1624 phản ánh đúng tiến trình cài gói, không phải artifact đo.
- **F-174-T8-5 — NHÃN SÓT TRONG O8-DRIVER: DÒNG RELEASE LOCK VẪN GHI "T8-173".** T8 đã sửa dòng start (`=== T8-174 O8 driver start`) trước khi chạy, nhưng dòng release cuối log vẫn in `=== T8-173 O8 release lock 2026-11-23T00:29:33Z ===` (sed chỉ sửa dòng start). Chỉ là nhãn cosmetic trong log — nội dung (stamp/pid/md5/boot) đều đúng 174, không ảnh hưởng kết quả. Sửa triệt để trong bản copy đợt 175 (sed cả hai dòng).
- **F-174-T8-6 — SOCKET X11 X194/X195 (CỦA T1-174 SUITE) MỒ CÔI — T8 ĐÃ DỌN TAY LÚC ĐÓNG; X193 ĐÃ VẮNG TRƯỚC ĐÓ; CỜ T0-174 GHI "X11 TRỐNG" KHÔNG KHỚP THỰC TẾ.** Extract 00:48Z thấy 2 file `/tmp/.X11-unix/`: X194 + X195, mtime 23:45:01Z. Đối chiếu `round174-t1/round174-t1-suites.log` dòng 885–886: suite T1 dùng 3 display `:193/:195/:194` (đều OK) — X194/X195 là socket Xvfb của T1-174, mồ côi sau khi suite xong (T1 đã đóng cờ 23:53Z). `fuser` exit 1 (không process nào giữ) + `ss -x` không listener — T8 `rm` cả hai 00:49Z; `/tmp/.X11-unix/` TRỐNG sau khi dọn. X193 đã vắng từ lúc extract 00:48Z (T1 tự dọn hoặc Xvfb :193 thoát sạch — T8 không suy đoán). **Mâu thuẫn ghi nhận: cờ T0-174 (23:52Z) ghi "X11 trống, 0 process sót" trong khi X194/X195 (mtime 23:45:01Z) vẫn tồn tại lúc đó** — T0 có thể chỉ kiểm process, không liệt kê thư mục. Không ảnh hưởng kết quả (socket mồ côi không giữ lock/process). F-174-T1-1 (giao T8 dọn) ĐÃ XỬ LÝ XONG 3/3 socket.
- **F-174-T8-7 — 84l10 E4 ENDED=FALSE CẢ HAI ENGINE ĐỢT NÀY (KHÁC 172/173: ENDED=TRUE CẢ HAI).** WebKit E4 PASS (tới cuối=true, playing cuối=false, ct cuối=3.767, ended=false, restart 3→3); Chromium E4 PASS (tới cuối=true, playing cuối=false, ct cuối=3.98, ended=false, restart 6→6). Script verdict vẫn PASS cả hai (tiêu chí tới-cuối + playing=false, không bắt buộc ended=true). Ghi nhận để T10 đối chiếu — đừng trích ended thành FAIL (cùng họ F-172-T8-4).
- **F-174-T8-8 — ARTIFACT BẮN LẶP DELTA=+2 LAN RỘNG HƠN ĐỢT 173 (3 ĐIỂM, ĐỢT 173: 2 ĐIỂM).** Chromium 84l10 W1-lần2 +2 VÀ W1-lần3 +2 (đợt 173: lần2 +2, lần3 +1); Chromium 85m4 P4-lần3 +2; Chromium 86n2 P4-lần1 +2 (đợt 173: P4-lần3 +2). Cùng họ artifact ghi đè ended còn bật (xem F-171-T8-5/F-172-T8-4/F-173-T8-4). Script verdict vẫn PASS tất cả (hạ-cánh-về-target=true, errors=0). **WebKit đợt này W1/P4 đều delta=+1 sạch cả 3 pha.** Ghi nhận để T10 đối chiếu (artifact của chính script test trên Chromium, không phải kẹt hay lỗi app); không đổi verdict pha hay verdict đợt.
- **F-174-T8-9 — EXTRACT-174t8.PY DÒNG 119 VẪN KIỂM CỠ FILE LIMITS ĐỢT 152 (HARDCODED STALE).** Dòng `ovsize LIMITS 152: 38561` kiểm `docs/PHASE9_ROUND152_T8_VITEHARNESS_LIMITS.md` (38.561 B) — hardcode từ đợt 152, không phải LIMITS hiện tại. Chỉ in ra (không ảnh hưởng số liệu), nhưng T8-175 nên sửa thành file hiện tại hoặc bỏ (cùng họ các nhãn stale khác — xem F-174-T8-5).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT TĂNG 24 → 25 (parent/T10 quyết cuối).** T4 lượt yên hợp lệ #43 trên boot #85 (attempt2 20/20 + B 5/5 + median 44,5 ms) + gate (a) POSTBOOT_PASS #85 (repair-tay-T5, caveat) + O8 T0 PASS 3/3 + O8 T8 PASS 3/3 — cả bốn chân trên cùng boot #85 (đã xác minh). Điểm cần cân: gate (a) mode repair-tay (không phải replay-đầy-đủ) — tiền lệ #75/#81/#84 đã chấp nhận gate repair. Nếu parent bác gate repair thì GIỮ 24. **Kết luận "GIỮ 24" trong cờ T0-174 đã lỗi thời** (viết 23:52Z, trước lượt yên hợp lệ 00:13:52Z).
2. **Harness 6/6 + 0 kẹt — kẹt cộng dồn GIỮ 20; chuỗi "P3 không kẹt" 2 → 3.** Đợt sạch thứ ba liên tiếp. 85m4 P4-lần3 PASS lần thứ ba liên tiếp (chuỗi mới = 3); 86n2 P4-lần2 PASS (chuỗi verdict 24 → 25); Chromium 85m4/86n2 P5 0 restart (đợt thứ hai liên tiếp sau 173).
3. **Điều tra riêng 84l10 — ĐỢT 3 XONG (T8 chủ trì), Q3 chạy kiểm lại PASS.** 84l10 PASS đầy đủ lần thứ ba liên tiếp (172, 173, 174) nên chưa có điểm dữ liệu kẹt mới — hồ sơ 3 điểm kẹt cũ vẫn đứng nguyên + Q3 heartbeat đã chạy thật lần thứ hai (W2 6 tick WebKit / 5 tick Chromium, E4 0 tick — đúng thiết kế). **Nếu 84l10 kẹt lần thứ tư (ca mới), heartbeat sẽ ghi lại trạng thái media lúc chết (paused/seeking/ct/playhead) — lần đầu có bằng chứng này.** Q1/Q2/Q4 vẫn mở (xem §D đợt 173 — Q2 probe DEBROOT vẫn cần quyết trước khi chạy).
4. **(m) #84 (+45,482 s) + (m) #85 (+34,397 s, sát biên dưới 1,397 s) + INSIDE #83/#84/#85 — thuộc T2-174 + parent 174** (số liệu thô theo cờ T0-174; caveat phân số (m) #85: boot_est +0,729 s → offset ≈ +33,668 s, vẫn trong band — xem F-174-T0-4).
5. **Đối chứng Chromium cùng pha: N cộng dồn N=36 mỗi pha** (đợt 137/139/141–174 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt tới nay.
6. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173 — 0 kích hoạt, 0 FP, 0 bỏ lỡ → ĐƯỢC GIỮ (lần thứ hai chạy live trên đợt sạch).** V2 (f'') vẫn giữ làm dự phòng. Nếu đợt sau có kẹt 85m4 dạng paused+seeking, (f') sẽ bắt ở ~elapsed 305 s (theo replay) — T8-175 kiểm lại.
7. **Reboot #85 TRƯỚC khi đợt mở 36' — số hiệu ĐÃ ĐƯỢC T0-174 xác minh 9/9 nguồn** (gap #84→#85 = 7.101 s; #84 cũng XÁC NHẬN, gap #83→#84 = 2.128 s; marker sống qua 37 reboot #49–#85 — ĐÃ XÁC NHẬN); mù cho boot mới giao T2-174 (theo quyết (s) đợt 158); INSIDE #83/#84/#85 giao T2-174 (dải FULL129/FULL130/FULL131 — chuỗi mới dài 1 từ #82).
8. **Run 173 TIMEOUT** (theo cờ T0-174: finished 23:36:04Z, wall 10.813 s, sau hạn 13 s, 2 lần viết lại; claimed_at DB hiện tại 23:35:51Z — khác ghi nhận T7-173 — giao T7-174; F-173-T0-3 + F-173-T7-2 vẫn mở).
9. **RAM avail min 464 MB (trong cửa sổ Chromium 84l10 — KHÔNG kẹt) — chờ T9 đối chiếu** (xem §7.5); chuỗi ghim trần phán bằng sampler T9 (giao T10). **Avail thấp một mình không gây kẹt — H1 vẫn BÁC BỎ** (giao T9).
10. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-174 xác nhận số lần — lần thứ 28 liên tiếp nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết số phận; E-178/E-179/E-180 đã kết thúc (T9-174 theo dõi episode mới); POSTBOOT_PASS #85 mode repair-tay-T5 (parent quyết gate); DR 23:00Z 0 dòng (T0-174 — kết luận cuối thuộc T7-174); T2-174/T4-174: không chạy script phân tích nặng trong cửa sổ attempt (T4 attempt2 đã xong, không nhiễm — 0 spike trong cả hai cửa sổ attempt theo cờ T4); T5-174: không probe chạm dpkg trong cửa sổ attempt; u2net là fallback chính thức.

---

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (f') V1 KẾ THỪA TỪ ĐỢT 173, KIỂM LẠI: KẸT-171 @305 s, KẸT-164 @125 s, 0 FP; LIVE ĐỢT NÀY 0 KÍCH HOẠT

## C1. Thiết kế (c') + (f') V1 (đã triển khai đợt 173, quyết (i) đợt 172 §12.3 — giữ nguyên đợt 174, không đổi code)

- **(c'):** trong vòng poll của `run_one`, lấy toàn bộ chuỗi liên tiếp (trailing run) các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi `elapsed mới nhất − elapsed đầu chuỗi ≥ 120 s` VÀ chuỗi dài ≥3 dòng VÀ điều kiện (e)/(f) trên dòng mới nhất (playing=true khi có trường này; nếu không có thì seeking=false; paused=false và seeking=false khi các trường này có).
- **(f') V1:** miễn (f) khi trailing sub-run liên tục `paused=true + seeking=true` (cùng tag+playhead+ct) đã ≥300 s. (e) giữ nguyên; ngưỡng 120 s, run_len ≥3, ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only (chỉ ghi log chẩn đoán + gọi diag-stall, không can thiệp chạy, không đổi verdict/timeout); vị trí code (helper `check-fresh-174t8.py` — driver gọi mỗi poll — không chạm script repo); phạm vi: 85m4 + 84l10 W2/E4 từ Q3 (cả hai nay đều có HB128).
- **V2 (f'') giữ làm dự phòng, KHÔNG triển khai** (miễn (f) khi watchdog đã kích hoạt — kẹt-171 @125 s nhưng ghép hai kênh chẩn đoán).

## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh-174t8.py — code live kế thừa đợt 173, chạy ~23:45Z)

| Log | HB128 | check-fresh-174t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng (P4-lần2 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.267 ct=0.267) | **TRIGGER elapsed=125 s** (ts 19:38:13.174Z, run 5 s→125 s, 25 dòng, span=120 s, span_seek=0 s — qua (f) thường) |
| 171-ket-85m4 | 174 dòng (P4-lần1 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.2 ct=0.2) | **TRIGGER elapsed=305 s** (ts 15:59:53.780Z, run 5 s→305 s, 61 dòng, span=300 s, span_seek=300 s — qua (f') MỚI) |
| 163-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 165-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 166-sạch 85m4 | 20 dòng | OK maxspan=5 s |
| 167-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 168-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 169-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 170-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 172-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 173-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 174-sạch 85m4 | (chưa có file) | NO-FILE (đúng — chưa chạy harness) |

- Helper mới KHỚP replay độc lập `replay-f-fix-174t8.py` từng số (V1-300: 164@125 s, 171@305 s, 0 FP; V0 đối chứng: 171 KHÔNG kích hoạt — đúng vấn đề cũ). Hai triển khai độc lập của cùng ngữ nghĩa (f') cho cùng kết quả.

## C3. Replay sau harness (replay-1c-174t8.py, chạy ~00:48Z — thêm log 174-sạch)

| Log | HB128 | LITERAL (§C2 nguyên văn) | RUNSPAN (bản V0 — chưa có (f')) |
|---|---|---|---|
| 164-kẹt 85m4 | 174 dòng | KHÔNG kích hoạt | **TRIGGER elapsed=125 s** (ts 19:38:13.174Z, run 5 s→125 s, 25 dòng, span=120 s) |
| 163-sạch 85m4 | 20 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 165-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 166-sạch 85m4 | 20 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 167-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 168-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 169-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| 170-sạch 85m4 | 19 dòng | KHÔNG kích hoạt | KHÔNG kích hoạt (max run span 5 s) |
| **171-kẹt 85m4 (LOG KẸT — xem chú thích)** | **174 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 811 s) — (c') V0 BỎ LỠ (đã bắt được bằng (f') mới ở §C2)** |
| **172-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| **173-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| **174-sạch 85m4** | **19 dòng** | KHÔNG kích hoạt | **KHÔNG kích hoạt (max run span 5 s)** |
| 164/165-86n2 | 0 dòng | KHÔNG kích hoạt (không có dòng) | KHÔNG kích hoạt (không có dòng) |

- **Chú thích bắt buộc cho dòng 171:** entry này là **log KẸT thật** (P4-lần1 đóng băng 163 dòng, elapsed 5→816 s, playhead=0.2 ct=0.2) — "KHÔNG kích hoạt" ở đây trong replay V0 là **(c') V0 BỎ LỠ kẹt thật**, KHÔNG phải "log sạch pass". Với (f') mới (§C2), kẹt này đã bắt được @305 s — không còn là bỏ lỡ trong code live đợt 173/174.
- **Tiêu chí C5.1 — RUNSPAN (V0): ĐẠT.** Kẹt-164 kích hoạt ĐÚNG elapsed=125 s; sạch-163/165/166/167/168/169/170/172/173/174 đều KHÔNG kích hoạt (max run span 5 s — biên 24× so với ngưỡng 120 s). **0 false-positive trên 10 log sạch thật.**
- **Chạy thật đợt này: FRESH-CONTENT-174 = 0 kích hoạt trong 6 pha — 0 FP, 0 BỎ LỠ.** Log 85m4 WebKit đợt này sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (6 dòng W2) — check-fresh OK maxspan=0 s. Không có kẹt thật nào trong phạm vi (c') để bắt hay để lỡ. **(c') + (f') ĐƯỢC GIỮ** (không có FP → không cần quyết lại theo quyết (i) đợt 171).
- Lưu ý: max run span 5 s trên log sạch đến từ 2 dòng liên tiếp cùng tag `sampleFor P5-phaseB-long` với playhead=30 ct=30 (elapsed 35 s→40 s) — playhead dừng ở cuối video trong P5, nhưng chỉ 2 dòng / span 5 s, xa ngưỡng 120 s (biên 24×). Đây là hành vi bình thường cuối P5, không phải kẹt.
- Lưu ý phạm vi: (c') nay có HB128 ở 85m4 + 84l10 W2/E4 (từ Q3) — 0 kích hoạt ở 86n2 là ĐÚNG theo thiết kế (86n2 không có HB128).

---

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 3 (T8 CHỦ TRÌ; QUYẾT (i) ĐỢT 171; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY)

## D1. Phạm vi điều tra (parent chốt đợt 171, giữ nguyên đợt 172/173/174)

- **Phạm vi = 84l10 qua 3 điểm kẹt** (157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425 — 3 call-site khác nhau, cùng vùng W2/E4, cùng script `clicktest-84l10-webkit-loop-w1.mjs` — md5 `baaa13c0` KHÔNG ĐỔI đợt này).
- **KHÔNG gộp 85m4-P4 / 86n2-P4-lần3 vào điều tra này** (chữ ký khác nhau — 85m4 là đóng băng waitForPlaySync với HB128, 86n2 là điểm kẹt đợt 165 tái diễn — theo dõi riêng cho T8; bên nào kẹt lần thứ ba theo đường của mình thì mở điều tra riêng — đợt này cả hai đều PASS nên chưa đủ điều kiện).
- **Chủ trì: T8-174 (đợt 3).** Đợt này 84l10 PASS đầy đủ lần thứ ba liên tiếp nên chưa có điểm dữ liệu kẹt mới — công việc đợt 3 là chạy kiểm lại Q3 (xem D2) + củng cố hồ sơ.

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; CHẠY KIỂM LẠI ĐỢT 174 (KHÔNG VỠ TEST, HEARTBEAT CHẠY ĐÚNG)

**Thay đổi:** không đổi code đợt này (script md5 `baaa13c0`, 34.880 B — dưới 37.768 B). Chi tiết triển khai xem §D đợt 173 (hbStart + heartbeat W2/E4 + trường `seeking` vào sample).

**Bằng chứng chạy thật đợt này (harness — lần chạy 84l10 thứ hai sau sửa):**

| Engine | W2 HB128 | E4 HB128 | W2 | E4 |
|---|---|---|---|---|
| WebKit | **6 tick** (5/10/15/20/25/30 s; n=20→116; playhead 4.167→28.867; seeking=false playing=true) | **0 tick** (vòng khỏe ~4–5 s — tick 5 s chưa kịp bắn; xem chú thích) | PASS (playhead cuối=30, Δ=0) | PASS (tới cuối=true, ct cuối=3.767, ended=false — xem F-174-T8-7, restart 3→3) |
| Chromium | **5 tick** (5/10/15/20/25 s; n=25→121; playhead 5.267→25.1; seeking=false playing=true) | **0 tick** (như WebKit) | PASS (playhead cuối=30, Δ=0) | PASS (tới cuối=true, ct cuối=3.98, ended=false — xem F-174-T8-7, restart 6→6) |

- **Chú thích E4 0 tick — ĐÚNG THIẾT KẾ, KHÔNG PHẢI LỖI:** vòng E4 khỏe chỉ chạy ~4–5 s; heartbeat 5 s chưa kịp tick lần đầu thì `hbStop()` trong `finally` đã dừng interval. Khi E4 kẹt (evaluate treo như 3 ca cũ), vòng KHÔNG thoát → `hbStop()` không chạy → tick bắn mỗi 5 s với state cuối cùng đã biết — đúng giá trị chẩn đoán Q3 cần. **Không cần hạ tick xuống <5 s.**
- **Không FP từ Q3:** check-fresh trên log 84l10 cả hai engine: OK maxspan=0 s (W2 playhead luôn tiến; E4 0 tick) — heartbeat mới không kích hoạt (c') oan. FRESH-CONTENT-174 live = 0 kích hoạt (xem §3).
- **Hồ sơ 3 điểm kẹt cũ vẫn đứng nguyên** (xem §D đợt 173 — D2/D3): 157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425.

## D3. Câu hỏi mở (chưa có câu trả lời — giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Thủ phạm là chuyển trạng thái hay vòng poll?** Vẫn mở — cần ca thứ tư để phân biệt (hoặc probe chủ đích chạy riêng vòng W2 nhiều lần trên cùng boot để tăng mẫu). **Nay đã có Q3: nếu ca thứ tư xảy ra, heartbeat sẽ ghi trạng thái media lúc chết — dữ liệu để trả lời Q1.**
- **Q2 — Lib hệ thống hay engine?** Vẫn mở — probe phân biệt: chạy harness 84l10 một lần dưới LD_LIBRARY_PATH DEBROOT (như O8). Chưa chạy (cần quyết parent/T10 vì đổi biến môi trường của harness chuẩn).
- **Q3 — Trạng thái media element lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173 (xem D2); CHẠY KIỂM LẠI ĐỢT 174 — heartbeat chạy đúng cả hai engine.** Chờ ca kẹt thứ tư để thu bằng chứng.
- **Q4 — Có phải race giữa evaluate và GStreamer seek/play?** Vẫn mở — chỉ là tương quan thời điểm, chưa có bằng chứng trực tiếp.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ tư (ca mới), ghi ngay call-site + dòng log cuối + RSS chuỗi + dòng HB128 cuối cùng (state lúc chết) + đối chiếu Q1 (setup hay sample-loop); nếu PASS tiếp 2–3 đợt, hồ sơ giữ nguyên, không vội kết luận "đã hết kẹt" (tần suất ~20% nên 3 đợt sạch liên tiếp 172–174 vẫn trong kỳ vọng — nay đã 3 đợt sạch liên tiếp).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 174 (quyết parent (f) đợt 151 + (h) đợt 152 + (k) đợt 153 + (o) đợt 154 + (p) đợt 155 + (p) đợt 156 + (i) đợt 157 + (i) đợt 158 + (i) đợt 159 + (h) đợt 160 + (h) đợt 161 + (h) đợt 162 + (h) đợt 163 + (h) đợt 164 + (i) đợt 165 + (i) đợt 166 + (i) đợt 167 + (i) đợt 168 + (i) đợt 169 + (i) đợt 170 + (i) đợt 171 + (i) đợt 172 + (i) đợt 173) — 0 KẸT MỚI, H3 VẪN MỞ, CHỈ GIÁM SÁT THỤ ĐỘNG

## B1. Trạng thái giả thuyết sau đợt 174 (H3 vẫn mở — 0 kẹt mới)

| Giả thuyết | Trạng thái đợt 173 | Trạng thái đợt 174 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** — avail min 464 MB @00:39:43Z trong cửa sổ Chromium 84l10 KHÔNG kẹt; avail lúc bắt đầu các pha WebKit 1.155–1.461 MB, cao hơn avail-min 464 MB đợt này (khi 0 kẹt) — avail thấp mà vẫn 6/6 PASS |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** — 0 kẹt đợt này nên không có cửa sổ kẹt để đối chiếu; avail rơi trong lúc chạy dài mà không kẹt |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — 0 kẹt mới đợt 173 | **VẪN MỞ — 0 KẸT MỚI đợt này (harness 6/6 PASS, đợt sạch thứ ba liên tiếp)** |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153, 170, 171) | **BÁC BỎ (đứng nguyên — không có ca kẹt mới để kiểm lại; bằng chứng đợt 171 vẫn đứng)** |

- Đợt 174 T8 chỉ giám sát thụ động theo quyết (f)/(h)/(k)/(o)/(p)/(i): **0 kẹt trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết mới (quyết (f): chỉ mở giả thuyết mới khi kẹt có chữ ký khác — đợt này không có kẹt).
- **Điều kiện mở điều tra H3 KHÔNG đạt:** theo quyết (i) đợt 158, điều kiện là 85m4 P4-lần3 tái diễn lần 3 — đợt này 85m4 P4-lần3 PASS lần thứ ba liên tiếp (chuỗi mới = 3, theo hướng ngược lại). **Riêng 84l10: điều tra riêng ĐÃ MỞ đợt 3 (xem §D) — H3 tổng vẫn chỉ giám sát thụ động.**

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 174

| Bước | Triển khai | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–174; 84l10 đã thêm Q3 heartbeat — không chạm `ev()`) + đường ổn định `t8-diag-stall.sh` → 174 (CẢ HAI symlink cập nhật 23:39Z; kiểm cuối vẫn trỏ 174) | 6 lần chạy harness hoàn thành + 3 lần chạy O8; **0 kẹt thật → 0 kích hoạt ĐÚNG, 0 false-positive** | **0 KÍCH HOẠT — ĐÚNG (không có kẹt thật để bắt).** 0 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live (MỚI 142, GIỮ NGUYÊN 143–174) | 6 lần chạy harness; `live_diags=0` ở cả 6 pha | **0 kích hoạt — ĐÚNG, KHÔNG LOG NÀO IM LẶNG >120 s** |
| (1c') Kiểm "nội dung tươi" (c') + (f') V1 | **(f') ĐÃ TRIỂN KHAI từ đợt 173** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 lần chạy harness (85m4 + 84l10 W2/E4 có HB128); `live_diags=0` ở 85m4/84l10 | **0 kích hoạt live — 0 FP, 0 BỎ LỠ. (c')+(f') ĐƯỢC GIỮ (xem §C).** Replay sau harness: C5.1 ĐẠT (kẹt-164 TRIGGER 125 s theo V0; 0 FP trên 10 log sạch thật) + kiểm lại (f') bằng chính helper: kẹt-171 @305 s |
| (2) Cột Balloon vào RAM sampler | CÒN NGUYÊN trong driver (đã chạy) | 1 log sampler (n=32 mẫu hợp lệ) | Balloon n=32 pinned=0 min=5.093.600 max=5.959.752 (92,5% trần) mean=5.537.549; avail min=464 MB @00:39:43Z (trong cửa sổ Chromium 84l10 — KHÔNG kẹt); **0 mẫu ghim trần 6.443.824 kB** trong cửa sổ harness |
| (3) Đối chứng Chromium cùng pha | CÒN NGUYÊN trong driver (đã chạy) | **84l10 PASS (exit 0, 00:40:34Z), 85m4 PASS (exit 0, 00:42:50Z), 86n2 PASS (exit 0, 00:46:56Z)** | N cộng dồn **N=36 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **0 lần kẹt → không kích hoạt** (baseline đã lưu lúc bắt đầu; 0 snapshot stall) | 0 snapshot stall đợt này (đúng — không có kẹt) |

## B3. Chữ ký kẹt — đợt 174: 0 KẸT (đợt sạch thứ ba liên tiếp sau đợt 172, 173)

| Trường | 84l10 | 85m4 | 86n2 |
|---|---|---|---|
| Pha / script | WebKit 84l10, `clicktest-84l10-webkit-loop-w1.mjs` (md5 **`baaa13c0`**, không đổi) | WebKit 85m4, `clicktest-85m4-webkit-w7-hb128.mjs` (md5 `610ee003`, không đổi) | WebKit 86n2, `clicktest-86n2-webkit-w7.mjs` (md5 `628088bd`, không đổi) |
| Thời gian | 00:31:16–00:32:26Z (exit 0) | 00:32:42–00:35:03Z (exit 0) | 00:35:18–00:39:18Z (exit 0) |
| Kết quả | W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS (playhead cuối=30), E4 PASS (tới cuối=true, ct cuối=3.767, ended=false — xem F-174-T8-7) | P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 0 restart | P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 0 restart |
| Đối chứng | Chromium 84l10 cùng pha PASS — không phân biệt WebKit/Chromium đợt này | Chromium 85m4 cùng pha PASS (P5 0 restart) | Chromium 86n2 cùng pha PASS (P5 0 restart) |
| RAM lúc chạy | Avail 1.155 MB lúc bắt đầu → 1.172 MB lúc xong (free -m trong summary, theo thứ tự pha) | Avail 1.461 MB lúc bắt đầu → 1.425 MB lúc xong | Avail 1.201 MB lúc bắt đầu → 1.117 MB lúc xong; avail-min toàn harness 464 MB @00:39:43Z trong cửa sổ Chromium 84l10 |
| Vite | HTTP 200 trong lúc chạy (vite còn sống); 000 sau release | HTTP 200 trong lúc chạy | HTTP 200 trong lúc chạy |
| Tiền lệ | Đợt 157/170/171: 84l10 kẹt ở 3 điểm khác nhau (xem §D) — đợt này PASS đầy đủ lần thứ ba liên tiếp, điểm kẹt không tái diễn; Q3 heartbeat chạy kiểm lại đúng | Đợt 164: 85m4 kẹt ở P4-lần2; đợt 171: kẹt ở P4-lần1 — đợt này PASS đầy đủ | Đợt 165: 86n2 kẹt ở P4-lần3; đợt 171: tái diễn — đợt này PASS đầy đủ |

---

# §E — CHECKLIST (o) ĐỢT 174 (nợ mở từ đợt 173 §11/§12.3(o) — quyết (o) đợt 173 §12.3: các F-173-T*-* + đính chính; T8-174 thực hiện và báo kết quả từng mục)

Phạm vi checklist (o) = toàn bộ mục trong quyết (o) đợt 173 §12.3 (aggregate 173 §12.1 (o)/§12.3 (o)) + các F-173 còn lại từ LIMITS các luồng (T0/T1/T2/T4/T5/T6/T7/T9/T8 — tổng 65 phát hiện, gom thành 21 hàng như §E đợt 173). T8-174 đã đi qua từng mục — mục nào thuộc T8 thì thực hiện, mục nào thuộc luồng khác thì ghi nhận/chuyển giao đúng chủ.

| # | Mục quyết (o) đợt 173 | Kết quả T8-174 |
|---|---|---|
| o1 | F-173-T1-1 (H1 aggregate 172 ghi sai "Đợt 171" — T10-173 ĐÃ SỬA khi viết aggregate 173): GHI NHẬN — ĐÓNG | **GHI NHẬN — ĐÃ ĐÓNG từ đợt 173.** T8-174 đọc aggregate 173 lúc mở (H1 đã đúng "Đợt 173"); không còn việc. |
| o2 | F-173-T1-2 (3 socket X11 X193/X194/X195 — T8 dọn theo checklist (o)): THỰC HIỆN | **ĐÃ THỰC HIỆN — DỌN XONG 3/3 (F-174-T1-1).** X194/X195 (của T1-174 suite, displays :194/:195 — suites.log dòng 885–886) mồ côi, T8 dọn tay 00:49Z (fuser: không process giữ; ss: không listener); X193 đã vắng từ lúc extract 00:48Z; `/tmp/.X11-unix/` TRỐNG lúc kiểm cuối. (Xem F-174-T8-6 — cờ T0-174 ghi "X11 trống" 23:52Z không khớp thực tế.) |
| o3 | F-173-T1-3 (bug sắp xếp bản nháp script đếm của T1 — đã sửa, bài học ghi): GHI NHẬN | **GHI NHẬN — ĐÃ SỬA từ đợt 173 (F-174-T1-5: T1-174 xác nhận không lặp lại).** T8-174 trích số bằng script `extract-174t8.py` (không gõ tay) — đúng bài học. |
| o4 | F-173-T1-4 (phạm vi kiểm có giới hạn — suite trên boot mới): GHI NHẬN | **GHI NHẬN.** T1-174 chạy suite 28/28 exit 0 trên boot mới #85 (23:40:11–23:49:01Z); F-174-T1-4 (phạm vi kiểm có giới hạn) vẫn ghi nhận — giao T10-174. |
| o5 | F-173-T0-1 (dị thường watcher-log +23 s — mẫu thứ ba liên tiếp): GHI NHẬN | **GHI NHẬN — MẪU LẶP LẠI ĐỢT 174 (F-174-T0-1: watcher-173 +9 s, mẫu thứ tư liên tiếp; OVERLAP thứ 11).** T8 ghi nhận, không đổi gì. |
| o6 | F-173-T0-2 (xác minh #82: 2/9 nguồn không đọc lại trực tiếp được): GHI NHẬN | **GHI NHẬN — MẪU LẶP LẠI ĐỢT 174 (F-174-T0-2: #84 — 2/9 nguồn không đọc lại trực tiếp được, journal/wtmp chỉ còn #85).** T0-174 đã xác minh #84/#85 9 nguồn (2 nguồn đọc gián tiếp). |
| o7 | F-173-T0-3 + F-173-T7-2 (claimed_at DB khác ghi nhận T7-172; số thứ tự ca ≥60 s — CHƯA CHỐT, giao T7-174): GHI NHẬN | **GHI NHẬN — VẪN MỞ, CHUYỂN GIAO T7-174.** Claimed_at run 173 đổi thành 23:35:51Z (= hạn ngân sách) theo cờ T0-174 (F-174-T0-3); run 173 TIMEOUT (finished 23:36:04Z, sau hạn 13 s). T8 không đối chiếu thay. |
| o8 | F-173-T2-1..8 ((m) #82/#83/#84 + INSIDE + mù #96?/#88?/#95?/#94?/#77? + (m) #56 + (1c')/(f')): GHI NHẬN | **GHI NHẬN.** (m) #84 (+45,482 s) / #85 (+34,397 s, sát biên dưới 1,397 s) + INSIDE #83/#84/#85 + mù #96?/#88? (hole-recheck lần 18)/#94?/#95?/#77? + (m) #56 lần 17 thuộc T2-174 (T8 không theo dõi thay). |
| o9 | F-173-T4-1..8 (reboot giết poller; RAM sập 41/117 poll; POSTBOOT #84 mode repair-sớm; stats "gan-mo"; đếm poll sai; dpkg.log boot cũ; T0 giữ vite.lock; X188 không phải của T4): GHI NHẬN — ÁP DỤNG | **GHI NHẬN — ÁP DỤNG TRỰC TIẾP ĐỢT 174.** Gate (a) cho boot đo #85 cũng mode repair (repair-tay-T5, POSTBOOT_PASS 23:46:57Z, poll=1 — xem §0); T8 ghi rõ caveat mode. Khác đợt 173: T4 đợt này CÓ lượt hợp lệ (attempt2 20/20, 00:13:52Z; attempt1 PAGE-WEDGED exit 2 — retry; RAM <500 chỉ 3/38 poll; 0 spike trong cả hai cửa sổ attempt). |
| o10 | F-173-T5-1/T5-5 (poll cuối watcher SAU btime 23 s / 9 s — overlap): GHI NHẬN | **GHI NHẬN.** Đợt 174: watcher-173 poll cuối +9 s sau btime #84 (F-174-T0-1 — mẫu thứ tư liên tiếp, OVERLAP thứ 11); T8 ghi nhận, không đổi gì; giao T5/T6-174 đối chiếu nếu overlap lặp lại. |
| o11 | F-173-T5-3/T5-4 (replay #83 chỉ một phần 23/170 intent; cache 132 → 0 trong 61 s): GHI NHẬN | **GHI NHẬN — MẪU LẶP LẠI ĐỢT 174.** Replay #85 cũng chỉ một phần (159 install, thiếu 2 gói + libEGL — xem §0 + F-174-T8-1); cache 170 → 175 sau repair (không mất như đợt 173). Giao T5-174. |
| o12 | F-173-T5-6/T5-7/T5-8/T5-9 (lỗi generator thay nhãn/datetime; apt-get -s trong poll watcher; log repair /tmp mất theo reboot): GHI NHẬN | **GHI NHẬN — F-173-T5-9 ĐÃ ĐƯỢC ÁP DỤNG ĐỢT 174.** T5-174 copy log apt repair ra khỏi /tmp ngay (`t5-postboot-repair-apt-3c704685.log`, 9705 B — xem manual-repair-note). Các mục còn lại giao T5-174. |
| o13 | F-173-T6-1..7 (churn chồng; lệch pid watcher ĐÃ GIẢI; POSTBOOT #82 không bao giờ viết; probe 1 s của T0; md5 sai tên; prune 48): GHI NHẬN | **GHI NHẬN — CHUYỂN GIAO T6-174.** F-172-T6-5 ĐÓNG (đã giải từ đợt 173). #85 có giết holder không + prune lần 49 thuộc T6-174. T8 không đối chiếu thay. |
| o14 | F-173-T7-1 (2 sleep bị SIGTERM do #84/#85 — phát hiện boot mới trong 50 s / 47 s, 0 số sai): GHI NHẬN | **GHI NHẬN — KHÔNG LẶP LẠI ĐỢT 174.** T8-174 gặp 0 reboot trong phiên (boot #85 ổn định từ mở tới đóng); bài học giữ nguyên cho đợt sau. |
| o15 | F-173-T8-1..9 (cp -a EPERM; GST 0 artifact; X11 biến mất theo reboot; delta +2 Chromium; balloon ghim trần ngoài sampler; POSTBOOT #83 chưa có; T4 0 attempt; reboot #84 giữa phiên; reboot #85 lúc đóng): ĐÃ THỰC HIỆN | **ĐÃ THỰC HIỆN ĐỢT 174:** F-173-T8-1 (cp -r thay cp -a — exit 0, không EPERM — xem F-174-T8-3); F-173-T8-2 (GST 1266 thật lúc mở, không còn artifact 0 — xem F-174-T8-4); F-173-T8-3 (X11 trống lúc mở, X194/X195 dọn tay lúc đóng — xem o2); F-173-T8-4 (delta +2 Chromium — lan rộng 3 điểm đợt này, xem F-174-T8-8); F-173-T8-5 (balloon ghim trần ngoài sampler — đợt này 0 ghim trong harness, max 92,5%); F-173-T8-6 (POSTBOOT #83 chưa có — ghi nhận, #85 đã có mode repair-tay); F-173-T8-7 (T4 0 attempt — đợt này T4 CÓ lượt hợp lệ #43); F-173-T8-8/F-173-T8-9 (reboot giữa phiên/lúc đóng — không gặp đợt này). |
| o16 | F-173-T9-6 (bài học `pkill -f` suýt giết chính lệnh exec — sửa bằng kill theo PID): GHI NHẬN | **GHI NHẬN — T8-174 ÁP DỤNG.** Dừng sampler RAM bằng `pkill -f "ram-174t8.log"` trong driver (mẫu cũ từ đợt 141 — pattern là tên file log trong thư mục round174-t8, KHÔNG trùng tên thư mục làm việc của exec hiện tại; đã dùng an toàn 30+ đợt). Không dùng `pkill -f` với pattern trùng thư mục làm việc. |
| o17 | F-173-T9-7 (kiểm boot lần cuối trước .done — bài học đứng, đã phát huy tác dụng đợt 173): GHI NHẬN | **ĐÃ ÁP DỤNG ĐỢT 174 (bài học đứng).** T8 kiểm boot lần cuối ngay trước khi viết cờ `round174-t8.done` (~00:52Z): boot `3c704685`, btime 1795388376, không reboot mới sau #85 — cờ ghi đúng boot lúc đóng. |
| o18 | Các F-173 còn lại (T0-4..7, T1-5/6, T9-1..5, T9-8/9/10): GHI NHẬN | **GHI NHẬN ĐÚNG CHỦ.** F-173-T0-4 (probe S1 2 lỗi latent — T0-174 đã sửa bản copy probe, O8 PASS 3/3); F-173-T0-5 (kiểm boot lần cuối trước .done — T0-174 áp dụng, kiểm 23:52:43Z); F-173-T0-6 (O8 trước postboot — T0-174 cũng chạy O8 trước POSTBOOT_PASS #85, PASS 3/3; mốc từng bộ đã ghi rõ); F-173-T0-7 (T0 không chạy lại suite/dải FULL/đếm — giao T10-174); F-173-T1-5 (ghi chú .done cũ — ghi nhận, không sửa file đã đóng); F-173-T1-6 (reboot sau đóng sổ — chính là #85, T0-174 xác minh 9 nguồn); F-173-T9-1 (cửa sổ thoáng — T9-174 theo dõi); F-173-T9-2 (reboot giết sampler — T9-174 khởi động lại); F-173-T9-3 (đếm episode 3 vs 2 — parent đã chấp nhận đếm 3 ở quyết (g) đợt 173); F-173-T9-4 (RAM đỉnh 44,14% guard — T9-174); F-173-T9-5 (ENOSPC thiếu timestamp — T9-174); F-173-T9-8 (delta thiếu — T9-174); F-173-T9-9 (RAM min T4/T9 — T9-174); F-173-T9-10 (T9 đóng trễ cờ — ghi nhận). |
| o19 | Quyết (l) đợt 152 về hạn cờ: XÁC NHẬN giữ trọn vẹn lần thứ hai mươi mốt liên tiếp — GIỮ NGUYÊN quy tắc đứng | **ĐÃ THỰC HIỆN — T8 ĐÓNG TRONG HẠN CỜ ~02:00Z (00:57Z).** Quyết (l) giữ nguyên. (Đợt 173 T8 trễ ~13' do reboot #85; đợt này 0 reboot nên đúng hạn.) |
| o20 | T10 không chạy lại toàn bộ suite: CHẤP NHẬN cách đóng sổ này cho đợt 173 (dựa vào suite 28/28 của T1-173) | **GHI NHẬN.** Quy tắc đứng giữ nguyên cho đợt 174 (T1-174 chạy suite 28/28 exit 0 trên boot #85 — nếu T1-174 không chạy được suite đầy đủ thì T10-174 phải chạy lại trước khi đóng — giao T10-174). |
| o21 | Marker sống qua 37 reboot #49–#85: GHI NHẬN — 37 ĐÚNG (chờ T0-174 xác nhận #85). Gap #82→#83 = 5.099 s; #83→#84 = 2.128 s; #84→#85 = 7.101 s: GHI NHẬN | **GHI NHẬN + ĐÃ XÁC NHẬN:** T0-174 xác minh 9 nguồn #84 (gap 2.128 s) + #85 (gap 7.101 s); **marker sống qua 37 reboot #49–#85 — ĐÃ XÁC NHẬN** (mtime 2026-11-20 11:39:47.272154981Z không đổi lúc T8 kiểm cuối). Gap #82→#83 = 5.099 s (đợt 173). |

- **Kết quả checklist (o): 21/21 mục đã thực hiện hoặc ghi nhận đúng chủ — 0 mục bỏ sót.** Các mục T8 tự thực hiện: o2 (X11 — dọn tay X194/X195, 3/3 socket), o3/o15 (bài học cp/GST/delta/balloon + nhãn 84l10), o17 (kiểm boot lần cuối trước .done), o19 (đóng TRONG hạn cờ). Các mục chuyển giao đúng chủ: o4/o20 (T1/T10 suite), o8 (T2 mù/(m)), o13 (T5/T6 pid watcher + prune 49), o18 (T10 sai số).
