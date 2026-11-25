# Đợt 175 T8 — HARNESS 5/6 (86n2-P1 KẸT MỚI, KẸT CỘNG DỒN 20 → 21; CHUỖI "P3 KHÔNG KẸT" ĐỨT) + O8 T8 PASS 3/3 TRÊN BOOT #87 — ĐỀ XUẤT CHUỖI WEBKIT FULL PASS GIỮ 25 (4 CHÂN LỆCH BOOT; PARENT QUYẾT CUỐI)

Ngày: 23/11/2026 (lượt cron 09:35 +07 = 02:35:51Z; T8 mở ~02:38Z, đóng ~04:31Z — TRONG hạn cờ ~05:00Z). Máy đo: VM này (CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: (1) harness vite 6/6 (quy trình đợt 174 — không còn việc triển khai mới: (f') V1 + Q3 đã triển khai xong đợt 173, đợt này chỉ giám sát live); (2) giám sát (f') V1 live; (3) Q3 heartbeat 84l10 chạy kiểm lại (script md5 `baaa13c0` — không đổi); (4) O8 trên boot hiện tại (WebKit 21/21 ×2 + Chromium 21/21) — phối hợp T0 (T0 cũng chạy O8, hai bộ độc lập — NHƯNG KHÁC BOOT đợt này, xem §A); (5) checklist (o) 21/21; (6) H3 chỉ giám sát thụ động.
Nợ: docs/PHASE9_ROUND174_T8_VITEHARNESS_LIMITS.md (harness 6/6 sạch; O8 T8 PASS 3/3 trên #85; chuỗi 24 → 25; checklist (o) 21/21).

## 0. Kết luận ngắn — HARNESS 5/6, 1 KẸT MỚI Ở 86n2-P1; O8 T8 PASS 3/3 TRÊN #87; CHUỖI GIỮ 25

- **Reboot #87 giữa phiên** (boot `ca31fac1`, btime 03:06:05Z, gap #86→#87 = 7.468 s; số hiệu theo T2-175, chờ T0-176 xác minh 9 nguồn): giết waiter1 + poller T4 + watcher T5; T4 khởi động lại poller tay 03:07:15Z; T8 khởi động lại waiter 03:08:13Z. T8 đo trên #87; T0-175 đã đóng trước reboot (O8 của T0 trên #86).
- **Harness (MỘT lần chạy driver duy nhất, boot `ca31fac1` #87): WebKit 2/3 + Chromium 3/3 — 5/6 PASS, 1 KẸT** (03:38:36–04:05:09Z, 26'33" do timeout 901 s): 84l10 **PASS** (W1 +1/+1/+1, W2 playhead 30, E4 ct 4 ended=true); 85m4 **PASS** (P4 +1/+1/+1, P5 0 restart — **P4-lần3 PASS lần thứ tư liên tiếp, chuỗi = 4**); 86n2 **KẸT — exit 124** (waitForPlaySync-P1, xem §2); Chromium 84l10/85m4/86n2 PASS. **Kẹt cộng dồn 20 → 21. Chuỗi "P3 không kẹt" 3 → 0 (ĐỨT).** Chromium đối chứng N=36 → **N=37 mỗi pha**, 0 kẹt.
- **(f') V1 live: 0 kích hoạt — ĐÚNG THEO PHẠM VI (85m4 + 84l10 W2/E4), 0 FP.** Ca kẹt duy nhất (86n2-P1) nằm NGOÀI phạm vi (c')/(f') vì script 86n2 không có HB128 — watchdog (i) + live-diag (1b) đã bắt (xem §3 + F-175-T8-4). Kiểm lại bằng chính helper: kẹt-164 TRIGGER @125 s, kẹt-171 TRIGGER @305 s; replay C5.1 ĐẠT, 0 FP trên 11 log sạch thật (163/165/166/167/168/169/170/172/173/174/175).
- **Q3 heartbeat 84l10 chạy kiểm lại: WebKit W2 6 tick HB128 (5/10/15/20/25/30 s, playhead 4,4→29,267, seeking=false playing=true) + W2/E4 PASS; Chromium W2 5 tick + W2/E4 PASS; E4 0 tick cả hai — đúng thiết kế.** 84l10 PASS đầy đủ lần thứ tư liên tiếp (172–175) — vẫn chưa có ca kẹt mới ở 84l10 (điều tra riêng đợt 4).
- **O8 T8 PASS 3/3 trên boot `ca31fac1` (#87)**: WebKit 21/21 ×2 (pid 14228 md5 `9f26034f` + pid 14618 md5 `773f037b`) + Chromium 21/21 (pid 14986 md5 `12039812`), exit 0/0/0, 03:34:40–03:37:12Z (2'32"). S1 PASS cả 3. **KHÁC BOOT BỘ T0: T0-175 O8 trên #86 cũng PASS 3/3** (pid 17203/20731/29459, 02:40:52–02:46:17Z, md5 `30e46593`/`55c9d481`/`67824d3e` theo cờ T0-175) — đồng thuận PASS, khác boot.
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT GIỮ 25 (parent/T10 quyết cuối).** 4 chân LỆCH BOOT: (1) lượt yên hợp lệ #44 của T4 trên #87 (attempt1 20/20 + B 5/5 + median 41,0 ms); (2) gate (a) cho #87 CHỈ CÓ BẰNG CHỨNG THỰC CHẤT, KHÔNG CÓ CỜ T5 (T5-175 đóng trước reboot; watcher chết theo; T4 gate0wait-13 kết luận DU DIEU KIEN cho #87 + selfcheck T8 #3 libs 6/6 + dpkg 1545); (3) O8 T0 PASS 3/3 — TRÊN #86, KHÔNG PHẢI #87; (4) O8 T8 PASS 3/3 trên #87. Thêm nữa: harness trên #87 có 1 kẹt (86n2-P1) nên #87 không phải boot sạch hoàn toàn. Không đủ điều kiện lên 26.
- **Gate: waiter KHÔNG BAO GIỜ GATE-FOUND (lệch nhau ~1 phút — xem F-175-T8-2).** Postboot=1 trong 15 poll (03:17:13–03:31:15Z, đường (b)); cờ T4 xuất hiện giữa poll 24 (t4=0/postboot=1) và poll 25 (t4=1/postboot=0) vì gate0wait-13 hết hạn 900 s. T4 đã đóng nên không còn attempt nào nữa; harness chạy trên bằng chứng thực chất + tiền lệ quyết (i) đợt 143; waiter hết hạn 04:30:25Z (WAIT-DEADLINE poll=83, 0 GATE-FOUND).
- **Watchdog (i): 3 dòng / 2 sự kiện — ĐÚNG (kẹt thật ở 86n2-P1). Live-diag (1b): 2 kích hoạt — ĐÚNG (log im lặng thật trong lúc kẹt). (1c') với (f'): 0 kích hoạt live — ĐÚNG THEO PHẠM VI (0 FP, 0 BỎ LỠ TRONG PHẠM VI).** 4 snapshot stall. RAM sampler n=54: balloon max 96,6% trần, 0 mẫu ghim; avail min **268 MB @03:55:36Z** (trong cửa sổ kẹt — KHÔNG kết luận gây kẹt: Chromium 86n2 PASS với avail 611 MB, xem §B).
- **Boot lúc đo = boot lúc đóng: `ca31fac1` (#87) — 0 reboot trong phiên O8+harness.** Marker mtime 2026-11-20 11:39:47Z KHÔNG ĐỔI — **sống qua 38 reboot #49–#86 (T0-175 ĐÃ XÁC MINH 9 nguồn)**; #87 → 39 nếu T0-176 xác nhận.
- **X11: `/tmp/.X11-unix/` TRỐNG lúc mở (sau reboot) và TRỐNG lúc kiểm cuối (extract 04:09Z, 0 file).** H3 chỉ giám sát thụ động, 0 kẹt mới ngoài 86n2-P1 (xem §B).
- Selfcheck: #1 trên #86 libs 6/6; #2 trên #87 lúc mới reboot libs 1/6 (replay chưa chạy); #3 trên #87 libs 6/6 (sau replay). T8 không tự cài apt.

## 1. Dòng thời gian

| Thời điểm (Z) | Sự kiện |
|---|---|
| 01:01:37 | REBOOT #86 (boot `70b7f7ee`, gap #85→#86 = 7.321 s; **T0-175 ĐÃ XÁC MINH 9 nguồn**) — TRƯỚC khi đợt mở 94' |
| 02:35:51 | Đợt 175 mở (lượt cron 09:35 +07 23/11) |
| 02:40:29–02:46:17 | **POSTBOOT_PASS #86 ĐÃ CÓ** (watcher-175, replay-đầy-đủ 170/170, poll=0, dpkg 1545); **T0-175 O8 DONE: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #86** (sau postboot) |
| ~02:38–02:43 | T8 mở: đọc LIMITS T8-174 + GAP + aggregate 174 §8/§12.3(j); cây + 8 script KHỚP md5 đợt 174; copy driver 174→175 (`cp -r`, exit 0) + đổi nhãn + sửa 3 nhãn sót T8-173 trong o8-driver + sửa extract; cập nhật CẢ HAI symlink diag → `round175-t8/diag-stall-175t8.sh`; fixture /tmp MẤT theo #86 |
| 02:41:43 | **Selfcheck #1 trên #86: libs 6/6 (libEGL CÓ ngay từ đầu — khác đợt 174); GST 1624; dpkg 1545; cache 183, lists 37; RAM avail 1072 MB, balloon 4.995.620 kB** |
| 02:43:32 | **Waiter1 bắt đầu trên boot `70b7f7ee` (deadline 04:30Z); poll 1: t4=0 postboot=1 (đường (a) #86)** |
| 02:45–03:05 | **T5/T0/T1/T6 ĐÓNG CỜ:** T5 02:45Z (POSTBOOT_PASS #86; watcher-175 pid 16528 ALIVE, hạn 05:30Z); T0 02:48Z (#86 xác minh 9 nguồn; (m) #86 +49,418 s; run 174 SUCCEEDED 02:24:03Z); T1 02:55Z (verify 174 PASS, đếm khớp lần 73); T6 03:05Z ((A) 120/120 lần 25; #86 KHÔNG giết holder — chuỗi 18 reboot; prune 50) |
| 03:06:05 | **REBOOT #87 (boot `ca31fac1`, gap #86→#87 = 7.468 s; số hiệu theo T2-175, chờ T0-176)** — giết waiter1 (23 poll, không kịp ghi REBOOT), poller T4 (poll #33 03:05:57Z), watcher T5; T8 phát hiện 03:06:50Z (45 s sau btime) |
| 03:07:15 | T4 khởi động lại poller tay trên #87 (poll #2 03:08:00Z) |
| 03:07:32–03:08:08 | **Selfcheck #2 trên #87: libs 1/6 (chỉ libevent); GST 0; dpkg.log 2 dòng; cache 183, lists 3; RAM avail 1618 MB** — replay chưa chạy; **rebuild fixture /tmp trên #87 (hevc `ba0c7c62` / i7 `f05daed8` / h `fbaa3d1a` / g `a1fb8549` — KHỚP kỳ vọng đợt 125)** |
| 03:08:13 | **Waiter2 bắt đầu trên boot `ca31fac1` (deadline 04:30Z); poll 1: t4=0 postboot=0** |
| ~03:17 | Replay #87 xong (dpkg.log 2 → 1545 dòng); waiter postboot=1 từ poll 10 (03:17:13Z, đường (b) gate0wait-13) |
| 03:17:47 | T4 mở cửa attempt (poll #15); **attempt1-ca31fac1 LUOT HOP LE 20/20 + B 5/5 + median 41,0 ms** (ngân sách 1/3) |
| 03:30:11 | **T2-175 ĐÓNG CỜ** ((m) #86 DƯƠNG +49,418 s; INSIDE #86 TRUE, chuỗi dài 5; (m) #87 DƯƠNG sơ bộ +39,864 s; EPERM #93 ok=2 fail=0) |
| 03:31–03:32 | **T4-175 ĐÓNG CỜ** (lượt yên #44 hợp lệ; chuỗi 37 → 38); waiter poll 24: t4=0/postboot=1 (03:31:15Z) → poll 25: t4=1/postboot=0 (03:32:15Z) — **GATE-FOUND lệch ~1 phút** (F-175-T8-2) |
| 03:34:11–03:37:12 | **Selfcheck #3 trên #87: libs 6/6; GST 1624; dpkg 1545; cache 183, lists 71; RAM avail 1472 MB, balloon 5.322.388 kB**; **driver O8 T8: WebKit 21/21 ×2 + Chromium 21/21 — PASS 3/3 trên boot #87** (xem §A) |
| 03:38:36–04:05:09 | **Harness (MỘT lần chạy driver duy nhất, boot `ca31fac1`): WebKit 2/3 + Chromium 3/3 — 5/6 PASS, 1 KẸT (86n2-P1, exit 124)** (xem §2) |
| ~04:09–04:3x | **Trích số liệu (extract-175t8.py) + replay (1c')/(f') trên log 175: C5.1 ĐẠT; (f') V1-300: 164@125 s, 171@305 s, 0 FP trên 11 log sạch**; waiter2 hết hạn 04:30:25Z (WAIT-DEADLINE poll=83 — GATE NOT MET, 0 GATE-FOUND); cờ `round175-t8.done` — **TRONG hạn cờ ~05:00Z** (kiểm boot lần cuối ngay trước khi viết cờ) |

## A. O8 — PASS 3/3 trên boot `ca31fac1` (#87); T8 ĐỀ XUẤT CHUỖI GIỮ 25

| # | Pha | Thời gian (Z) | Exit | Kết quả |
|---|---|---|---|---|
| 1 | O8 WebKit attempt1 | 03:34:41–03:34:52 | 0 | **21/21 PASS** — S1 PASS 03:34:52.890Z "checked=true → false, Playwright mouse click lần 2" |
| 2 | O8 WebKit attempt2 | 03:35:32–03:35:42 | 0 | **21/21 PASS** — S1 PASS 03:35:42.491Z, y hệt attempt1 |
| 3 | O8 Chromium (đối chứng) | 03:36:20–03:36:42 | 0 | **21/21 PASS** — S1 PASS 03:36:42.123Z, CDP mouse click lần 2 |

- Report JSON (kiểm độc lập bằng python): WebKit attempt1 `o8w-...-03-34-41-ca31fac1-pid14228.json` 21/21 `ok=true`, md5 `9f26034f`; attempt2 `o8w-...-03-35-32-ca31fac1-pid14618.json` 21/21, md5 `773f037b`; Chromium `o8-...-03-36-20-ca31fac1-pid14986.json` 21/21, md5 `12039812`. **HAI FILE STAMPED RIÊNG BIỆT, pid khác nhau, md5 khác nhau.** 0 dòng `HARNESS LỖI`, 0 `Target crashed`, 0 `WATCHDOG-137` trong log O8 (PASS S1 6 dòng — 3 thật + 3 do driver grep lại log, FAIL S1 0).
- **NHÃN LIB ĐÚNG NGAY TỪ ĐẦU — O8 WebKit chạy bằng lib DEBROOT, không phải system libs** (script O8 gốc tự đặt `LD_LIBRARY_PATH` với DEBROOT, driver cũng vậy). Bằng chứng "WebKit chạy bằng system libs" là harness (standard driver, không LD_LIBRARY_PATH) — đợt này harness chạy TRÊN CÙNG boot đo (#87) với libs 6/6 theo selfcheck #3 + gate0wait-13 của T4 — **nhưng harness 5/6 (86n2-P1 kẹt), nên bằng chứng launch+pass bằng system libs đợt này là KHÔNG ĐẦY ĐỦ (chỉ 2/3 pha WebKit pass)**.
- Driver O8 giữ 1 lock vite `t8-round175` suốt lượt (nhả 03:37:12Z; vite sau release curl 5560/5554 = 000000).
- Probe S1 đã chuẩn bị sẵn (`o8-s1-probe-175t8.mjs`) KHÔNG cần chạy vì attempt1 đã PASS (theo thiết kế driver).
- **Gate cho boot đo `ca31fac1`: (a) KHÔNG CÓ CỜ T5 — chỉ có bằng chứng thực chất.** POSTBOOT_PASS trong `round175-t5/` vẫn chứa boot `70b7f7ee` (#86, ghi 02:40:29Z, replay-đầy-đủ, poll=0); T5-175 đóng 02:45:38Z, TRƯỚC reboot #87; watcher-175 chết theo reboot. Đường (b): gate0wait-13 của T4 (mtime 03:16:17Z) kết luận "DU DIEU KIEN chay WebKit (boot 2026-11-23 03:06:05)" — 11/11 gói + 5/5 lib + GST 269=269; waiter postboot=1 trong 15 poll (03:17:13–03:31:15Z). Selfcheck T8 #3 (03:34:11Z) xác nhận độc lập libs 6/6 + GST 1624 + dpkg 1545. **O8 T8 chạy SAU tất cả các bằng chứng trên (03:34:40Z).**
- **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT GIỮ 25 (parent/T10 quyết cuối — T8 KHÔNG tự chốt).** 4 chân LỆCH BOOT: (1) lượt yên hợp lệ #44 của T4 TRÊN #87 (attempt1 20/20 + B 5/5 + median 41,0 ms, chuỗi 37 → 38; P1 156/159, P2 150/150, P3-A1 131/159, P3' 119/131 occ = 102/107 distinct, P7 72/72); (2) gate (a) cho #87 — KHÔNG CÓ CỜ T5, chỉ bằng chứng thực chất (xem trên); (3) O8 T0 PASS 3/3 — TRÊN #86 (02:40:52–02:46:17Z, pid 17203/20731/29459, md5 `30e46593`/`55c9d481`/`67824d3e` theo cờ T0-175), KHÔNG PHẢI #87; (4) O8 T8 PASS 3/3 TRÊN #87. **Thêm nữa: harness trên #87 có 1 kẹt thật (86n2-P1), nên #87 không phải boot sạch hoàn toàn.** Không có cách nào lên 26 đợt này.
- **O8 đợt này 2'32" tổng** (174: 2'36", 173: 2'41", 172: 2'32") — trong khung dao động các đợt gần đây, không kết luận.

## 2. Kết quả harness — MỘT LẦN CHẠY DRIVER DUY NHẤT: WEBKIT 2/3 + CHROMIUM 3/3, 5/6 PASS, 1 KẸT (86n2-P1)

| # | Pha | Exit | Thời gian (Z) | Kết quả |
|---|---|---|---|---|
| 1 | WebKit 84l10 | 0 | 03:38:39–03:39:49 | **PASS** — W1-lần1/2/3 PASS (+1/+1/+1), W2 PASS (playhead cuối=30, Δ=0), E4 PASS (tới cuối=true, ct cuối=4, ended=true — xem F-175-T8-10, restart 3→3) — **84l10 WebKit PASS trọn vẹn lần thứ tư liên tiếp (172–175); Q3 heartbeat W2 6 tick chạy đúng (xem §D)** |
| 2 | WebKit 85m4 | 0 | 03:40:04–03:42:15 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+1), P5 PASS 40 s **0 restart** (extraEvents=[]) — **P4-lần3 PASS lần thứ tư liên tiếp (chuỗi = 4)** |
| 3 | WebKit 86n2 | 124 | 03:42:30–03:57:31 | **KẸT — TIMEOUT 901 s** tại waitForPlaySync-P1 (setup 03:42:38Z, watchdog 03:43:42Z, probe TIMEOUT 30 s 03:44:12Z, live-diag ×2 03:46:20Z/03:50:21Z); P1 không trả về; P2–P5 không chạy; report phases {} ok=false — **CHỮ KÝ MỚI: lần đầu 86n2 kẹt ở P1 (trước đây chỉ P4-lần3: đợt 165, tái diễn 171)** |
| 4 | Chromium 84l10 | 0 | 03:57:46–03:58:47 | **PASS** — W1-lần1 PASS (+2 — artifact bắn lặp, xem F-175-T8-9), W1-lần2 PASS (+1), W1-lần3 PASS (+1), W2 PASS (playhead cuối=29,933, Δ=0), E4 PASS (tới cuối=true, ct cuối=3,968, ended=false, restart 6→6) — **Q3 heartbeat W2 5 tick chạy đúng** |
| 5 | Chromium 85m4 | 0 | 03:59:02–04:01:03 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+1/+2 — lần3 +2, xem F-175-T8-9), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 04:01:01.761Z) |
| 6 | Chromium 86n2 | 0 | 04:01:18–04:05:08 | **PASS** — P1/P2/P3 PASS, P4-lần1/2/3 PASS (+1/+2/+2 — lần2/3 +2, xem F-175-T8-9), P5 PASS 40 s **0 restart** (report JSON ok=true, finishedAt 04:05:00.771Z) |

- 6 report JSON kiểm độc lập bằng python: 5× `ok=true` (finishedAt 03:39:44.640Z / 03:42:12.464Z / 03:58:45.804Z / 04:01:01.761Z / 04:05:00.771Z) + 1× `ok=false` (WebKit 86n2, finishedAt 03:57:30.801Z, phases {}).
- Môi trường: system libs trên boot `ca31fac1` (sau replay #87: libs 6/6 + GST 269 theo gate0wait-13 của T4; selfcheck T8 #3: 6/6 lib + dpkg 1545 + cache 183 + lists 71; POSTBOOT_PASS cho boot đo KHÔNG CÓ cờ T5 — xem §A). **WebKit launch + PASS 2/3 pha bằng system libs** trên ĐÚNG boot đo; pha thứ ba kẹt ở P1 (không phải lỗi launch — setup xong, vite 200, browser sống).
- Driver Chromium-only + debroot KHÔNG cần dùng đợt này (Chromium cùng pha PASS đã là đối chứng đủ — riêng 86n2, Chromium PASS trong khi WebKit kẹt → kẹt đặc thù WebKit, không phải lỗi app/vite).
- **Harness 26'33"** (03:38:36–04:05:09Z) — dài hơn đợt 172/173/174 (~15'30"–15'43", 0 timeout) do 86n2 timeout 901 s (171: 53'21" với 3 kẹt; 170: 29'24" với 1 kẹt).

### Phân tích kẹt 86n2-P1 (chữ ký mới — lần đầu 86n2 kẹt ở P1)

- **Diễn biến:** vite sẵn sàng 03:42:31Z; setup (clip 30 s) ghi log 03:42:38Z; sau đó KHÔNG CÒN dòng log nào từ script test cho tới watchdog 03:43:42Z — evaluate treo >60 s tại `waitForPlaySync-P1` (lần gọi đồng bộ play đầu tiên). Probe chẩn đoán 03:44:12Z TIMEOUT 30 s ("kênh evaluate kẹt cùng / page JS chết"). Phase bị timeout 900 s giết 03:57:31Z (exit 124). Report `phases={}` — không pha con nào hoàn thành.
- **Bằng chứng renderer còn sống nhưng kênh evaluate chết (họ H3):** snapshot lúc watchdog (03:43:42Z): vite HTTP 200; RAM avail 787 MB; load1 0,58; `WebKitWebProcess` RSS 343 MB, elapsed 01:08, còn sống; `MiniBrowser` RSS 219 MB, còn sống. Browser process KHÔNG chết, chỉ page/evaluate không trả lời — đúng họ kẹt WebKitGTK (deadlock/IPC/GStreamer) như các ca 84l10/85m4 trước, nhưng ở call-site mới (P1 thay vì P4-lần1/lần2/lần3). Snapshot lúc timeout: vite HTTP 000 — là artifact dọn dẹp sau kill, KHÔNG dùng làm bằng chứng vite chết trong lúc kẹt.
- **RAM trong cửa sổ kẹt:** avail 660–871 MB lúc bắt đầu/watchdog (03:42–03:43Z), tụt tới min 268 MB @03:55:36Z (balloon max 6.227.924 kB = 96,6% trần, 0 mẫu ghim); load1 chỉ 0,11–0,58 đầu cửa sổ — không phải bão CPU. **Avail thấp đi cùng kẹt nhưng KHÔNG kết luận gây kẹt** (H1 đã bác bỏ; Chromium 86n2 PASS ngay sau đó với avail 611 MB @04:03:07Z — xem §B).
- **Chuỗi verdict 86n2:** P4-lần3 PASS 3 đợt liên tiếp (172–174) rồi đợt này KHÔNG CÓ verdict P4 (kẹt trước P4) — chuỗi đứt không phải do FAIL mà do không tới được P4. **P4-lần2 verdict 25 (đợt 174) → KHÔNG CÓ verdict mới.** 86n2-P1 là điểm kẹt mới (lần 1); nếu tái diễn thì mở điều tra riêng như 84l10.

## 3. Watchdog trong lượt này — 3 DÒNG / 2 SỰ KIỆN (ĐÚNG — KẸT THẬT) + LIVE-DIAG 2 (ĐÚNG) + (1c') VỚI (f') 0 KÍCH HOẠT (ĐÚNG THEO PHẠM VI)

- **Watchdog (i): 3 dòng WATCHDOG-137 (2 sự kiện) — ĐÚNG.** Cả 3 dòng đều trong log WebKit 86n2: diag 03:43:42Z + diag-xong 03:43:42Z + probe TIMEOUT 30 s 03:44:12Z. 0 false-positive (84l10/85m4: 0 dòng).
- **Driver (1b) live-diag: 2 kích hoạt — ĐÚNG.** Cả 2 trong summary, đều ở WebKit 86n2: silence 128 s @03:46:20Z + silence 369 s @03:50:21Z (log im lặng thật trong lúc kẹt). `live_diags=2` ở pha 86n2, `live_diags=0` ở 5 pha còn lại. 4 snapshot stall (2 live-silence + 1 watchdog-P1 + 1 timeout124).
- **(1c') fresh-content với (f') V1: 0 kích hoạt live — ĐÚNG THEO PHẠM VI, 0 FALSE-POSITIVE, 0 BỎ LỠ TRONG PHẠM VI.** Log 85m4 WebKit sạch (19 dòng HB128, maxspan=5 s); log 84l10 WebKit mới có HB128 (6 dòng W2) — check-fresh OK maxspan=0 s. **Ca kẹt 86n2-P1 nằm NGOÀI phạm vi (c')/(f')** vì script 86n2 không có HB128 — không phải bỏ lỡ, mà là mù theo thiết kế (xem F-175-T8-4). **(c') + (f') ĐƯỢC GIỮ** (không có FP → không cần quyết lại; lần thứ ba (f') chạy live trên đợt sạch 85m4/84l10 — vẫn chưa có ca kẹt paused+seeking để chứng minh live).
- 4 snapshot stall đợt này (đúng — 1 kẹt thật).
- Bản vá watchdog (i)+(ii)+(4) GIỮ NGUYÊN, không revert (quyết parent đợt 142–174 §12.3(l)).

## 4. Trạng thái 4 bước kiểm đợt này

| Bước | Cơ chế | Chạy đợt này | Kết quả |
|---|---|---|---|
| (1) Watchdog chẩn đoán (>60 s) | `ev()` → `evalDiag137` trong 3 script (VÁ 142, GIỮ NGUYÊN 143–175) + `t8-diag-stall.sh` → 175 (CẢ HAI symlink cập nhật 02:39Z) | 6 harness + 3 O8; **1 kẹt thật → 3 dòng / 2 sự kiện ĐÚNG, 0 FP** | **ĐÚNG — BẮT ĐÚNG KẸT 86n2-P1.** 4 snapshot `smoke/stall-*` |
| (1b) Driver canh im lặng >120 s | `run_one` nền + mtime log → diag live, tối đa 2 lần/lần chạy, cách nhau ≥240 s (MỚI 142, GIỮ NGUYÊN 143–175) | 6 harness; `live_diags=2` ở 86n2 WebKit, `0` ở 5 pha còn lại | **2 kích hoạt — ĐÚNG, LOG IM LẶNG THẬT TRONG LÚC KẸT** |
| (1c') Kiểm "nội dung tươi" (c') + (f') V1 | **(f') ĐÃ TRIỂN KHAI từ đợt 173** (quyết (i) đợt 172; helper check-fresh + khối FRESH-CONTENT trong `run_one`, chung ngân sách với (1b)) | 6 harness (85m4 + 84l10 W2/E4 có HB128); `live_diags=0` ở 85m4/84l10 | **0 kích hoạt live — 0 FP, 0 BỎ LỠ TRONG PHẠM VI (86n2 ngoài phạm vi — F-175-T8-4). (c')+(f') ĐƯỢC GIỮ (xem §C).** Replay: C5.1 ĐẠT (164 TRIGGER 125 s; 0 FP trên 11 log sạch) + kiểm lại (f'): 171 @305 s |
| (2) Cột Balloon vào RAM sampler | Trong driver `run-webkit-175t8.sh` (cột `balloon_kb`) | 1 log sampler (n=54) | Balloon n=54 pinned=0 min=5.216.008 max=6.227.924 (96,6% trần) mean=5.711.689; avail min=268 MB @03:55:36Z (trong cửa sổ kẹt — KHÔNG kết luận gây kẹt) / max 1.434 MB |
| (3) Đối chứng Chromium cùng pha | Trong driver (3 pha, N=1 mỗi pha) | **84l10 PASS (03:58:47Z), 85m4 PASS (04:01:03Z), 86n2 PASS (04:05:08Z)** — exit 0 cả 3 | N cộng dồn **N=37 mỗi pha** (đợt 137/139/141–175 mỗi đợt N=1; đợt 138/140 N=0) — Chromium 0 kẹt mọi đợt; **86n2: Chromium PASS trong khi WebKit kẹt → kẹt đặc thù WebKit** |
| (4) Lưu dmesg + journalctl -k sau mỗi lần kẹt | diag script + driver gọi khi exit 124 (truyền devUrl thật) + baseline lúc bắt đầu | **1 lần kẹt → kích hoạt (4 snapshot: dmesg + journalctl -k + ps + meminfo + vite-http)** | 4 snapshot stall (đúng — 1 kẹt thật) |

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

- **T8 không sửa file repo nào đợt này** (chỉ thêm LIMITS này). Driver trong hidden_files thay đổi so với đợt 174: nhãn `LIVE-DIAG-174` → `LIVE-DIAG-175`, `FRESH-CONTENT-174` → `FRESH-CONTENT-175`, lock `t8-round174` → `t8-round175`, deadline waiter 01:30Z → **04:30Z 23/11**, nhãn `T8-174` → `T8-175` (kể cả 3 dòng `T8-173` sót — xem F-175-T8-11), WAIT1 sửa đúng boot `ca31fac1`, replay thêm entry 173-sạch + 175-sạch (sửa entry 174-sạch bị đổi nhãn nhầm — xem F-175-T8-6). Copy bằng `cp -r` (exit 0). **Working dir đợt này ở `repo-1/hidden_files/round175-t8/` (theo nhiệm vụ) thay vì `goals/.../hidden_files/` như trước — extract/o8-driver/selfcheck/waiter đã sửa đường dẫn; replay vẫn đọc log lịch sử từ goals.**
- Script trích số liệu `extract-175t8.py`: glob tất cả `wait-t4-t5-boot*.log` + `wait-t4-t5.log` (waiter1 23 poll + waiter2 63 poll tính tới extract 04:09Z, 0 GATE-FOUND, 0 WAIT-DEADLINE; postboot=1 trong 15 dòng — TẤT CẢ cho boot `ca31fac1`).
- Script replay (1c') `replay-1c-175t8.py` + (f') `replay-f-fix-175t8.py` (thêm entry 173-sạch + 175-sạch).

## 6. Dọn dẹp + kiểm cuối — sạch

- Driver O8 đã nhả lock `t8-round175` 03:37:12Z; driver harness đã nhả lock sau mỗi lần chạy (86n2 Chromium released 04:05:08Z).
- Waiter2 hết hạn 04:30:25Z (WAIT-DEADLINE, poll=83, exit 3); 0 process waiter còn lại; 0 process waiter1 còn lại (chết theo reboot #87).
- Kiểm cuối ~04:09Z (trích số liệu + kiểm tay): process Xvfb/MiniBrowser/WebKit/Chromium còn sót của T8: **0**; lock vite TRỐNG (0 ticket + 101 cooldown); boot `ca31fac1` ổn định TRONG O8+harness (btime 1795403165 không đổi từ 03:06:05Z — **0 reboot trong phiên O8+harness**).
- `/tmp/.X11-unix/` lúc mở TRỐNG (sau reboot); lúc kiểm cuối TRỐNG (0 file — socket của chính T8 — :188 O8-WebKit, :197 O8-Chromium, :199 harness — driver tự unlink; X188 trong cờ T5-175 là Xvfb của T4-175, đã thoát khi T4 đóng).
- Fixture /tmp: rebuild trên #87 (md5 khớp); kiểm cuối sau harness vẫn khớp.
- Không kiểm lại TTS 39; không thử birefnet (u2net là fallback chính thức); không tự cài apt (repair là của T5 — T8 chỉ đọc + kiểm lại); không push.

## 7. Giới hạn — đọc trước khi trích số

1. **O8 và harness đợt này CHẠY TRÊN BOOT `ca31fac1` (#87 theo T2-175, CHỜ T0-176 xác minh 9 nguồn)** — boot sau reboot #87 lúc 03:06:05Z, là boot lúc đo (không đổi boot trong phiên O8+harness). **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT GIỮ 25 (parent/T10 quyết cuối)** — xem §A; 4 chân lệch boot + harness có kẹt trên #87.
2. **Harness 5/6 + 1 KẸT — kẹt cộng dồn 20 → 21; chuỗi "P3 không kẹt" 3 → 0 (ĐỨT).** Đợt kẹt đầu tiên kể từ đợt 171. Đừng gộp verdict pha con với verdict pha, và đừng gộp các đợt.
3. **O8 WebKit chạy bằng lib DEBROOT, không phải system libs** — dù system libs đã đầy đủ trên boot `ca31fac1` (gate0wait-13 của T4 + selfcheck T8 #3). Đừng trích O8 là bằng chứng "WebKit chạy bằng system libs"; bằng chứng đó là harness trên cùng boot đo (xem §A) — **đợt này harness 5/6 nên bằng chứng là KHÔNG ĐẦY ĐỦ (chỉ 2/3 pha WebKit pass)**.
4. **POSTBOOT_PASS cho boot đo `ca31fac1` KHÔNG CÓ CỜ T5** — T5-175 đóng trước reboot #87; watcher chết theo. Gate (a) đợt này chỉ có bằng chứng thực chất (gate0wait-13 của T4 + selfcheck T8 #3 + waiter postboot=1 trong 15 poll). Đừng trích POSTBOOT_PASS #86 (02:40:29Z) là gate cho boot đo. O8 T8 chạy HOÀN TOÀN SAU các bằng chứng gate (03:34:40Z); O8 T0 chạy trên #86, sau POSTBOOT_PASS #86.
5. **Balloon KHÔNG ghim trần trong cửa sổ harness** (0 mẫu ghim, n=54, max 96,6% trần) — avail min 268 MB @03:55:36Z (trong cửa sổ kẹt 86n2 — KHÔNG kết luận gây kẹt, xem §2/§B). Giao T9 đối chiếu với sampler của họ; chuỗi ghim trần phán bằng sampler T9.
6. **86n2 vẫn oversize 39.194 B (>37.768 B giới hạn push)** — như đợt 142–175 (do vá `ev()`); lúc push cần `ENABLE_PRIVSEP=0`. 84l10 (34.880 B) và 85m4 (37.111 B) vẫn dưới giới hạn.
7. **Chuỗi verdict ĐỔI CHIỀU đợt này (do KẸT): 85m4 P4-lần3 PASS lần thứ tư liên tiếp (chuỗi = 4); 86n2 P4-lần2 KHÔNG CÓ verdict mới (kẹt ở P1 trước khi tới P4).** H3 vẫn mở, chỉ giám sát thụ động (xem §B). Điều tra riêng 84l10 ĐỢT 4 (xem §D — Q3 chạy kiểm lại, chưa có ca kẹt mới).
8. **84l10 E4 ended=true (WebKit) / false (Chromium) đợt này** — WebKit trở lại true sau đợt 174 (false cả hai); Chromium false như đợt 174. Script verdict vẫn PASS cả hai; đừng trích ended thành FAIL (xem F-175-T8-10).
9. **T8 ĐÓNG TRONG hạn cờ ~05:00Z (~04:3xZ)** — O8 xong 03:37:12Z; harness xong 04:05:09Z (26'33" do timeout 901 s); trích số xong ~04:09Z. **1 reboot trong phiên chờ gate (#87), 0 reboot trong phiên O8+harness.**
10. **Reboot #87 giữa phiên chờ gate** (số hiệu theo T2-175, chờ T0-176 xác minh 9 nguồn; gap #86→#87 = 7.468 s; marker sống qua 38 reboot #49–#86 — ĐÃ XÁC NHẬN; #87 → 39 nếu được xác nhận); (m) #86 (+49,418 s, sát biên trên 0,382 s) + (m) #87 sơ bộ (+39,864 s) + INSIDE #86 TRUE (chuỗi dài 5) thuộc T2-175 + parent 175 (xem cờ T2-175).
11. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173, 0 kích hoạt, 0 FP, 0 bỏ lỡ TRONG PHẠM VI** — replay C5.1 ĐẠT (RUNSPAN TRIGGER đúng 125 s trên log kẹt 164; 0 FP trên 11 log sạch thật); kiểm lại (f') bằng chính helper: kẹt-171 @305 s, kẹt-164 @125 s (xem §C). **Ca kẹt 86n2-P1 nằm ngoài phạm vi (c')/(f') — xem F-175-T8-4.**
12. **Fixture h/g md5 KHỚP kỳ vọng đợt 125** (rebuild trên #87; kiểm cuối sau harness vẫn khớp). Giả thuyết "giá trị đứng" ở F-163-T8-1 vẫn SAI — đừng dùng md5 h/g làm fingerprint ổn định.
13. **Chromium delta=+2 artifact: 4 ĐIỂM đợt này** (84l10 W1-lần1 +2; 85m4 P4-lần3 +2; 86n2 P4-lần2 +2 VÀ P4-lần3 +2; đợt 174: 3 điểm) — cùng họ artifact ghi đè ended còn bật. Script verdict vẫn PASS tất cả. **WebKit các pha PASS đều delta=+1 sạch.** Ghi nhận để T10 đối chiếu; không đổi verdict.

## 8. Sai số mới (F-175-T8-N)

- **F-175-T8-1 — REBOOT #87 GIỮA PHIÊN CHỜ GATE (BOOT `ca31fac1`, BTIME 03:06:05Z, GAP 7.468 s).** Giết waiter1 + poller T4 + watcher T5. T8 phát hiện 03:06:50Z (45 s sau btime — nhanh hơn T7-174 phát hiện #86 trong 65 s). Waiter1 chết không kịp ghi dòng REBOOT (23 poll, log đã lưu `wait-t4-t5-boot70b7f7ee.log`); T4 khởi động lại poller tay 03:07:15Z; T8 khởi động lại waiter (waiter2) 03:08:13Z. Số hiệu #87 theo T2-175 — CHỜ T0-176 xác minh 9 nguồn. Watcher-175 poll 03:06:12Z (7 s SAU btime) vẫn ghi boot cũ `70b7f7ee` — overlap kiểu F-175-T0-1 (lớn nhất từng ghi, +36 s).
- **F-175-T8-2 — GATE-FOUND LỆCH ~1 PHÚT (POLL 24 → 25): WAITER KHÔNG BAO GIỜ GATE-FOUND.** Poll 24 (03:31:15Z): t4=0/postboot=1 (đường (b) gate0wait-13, mtime 03:16:17Z); poll 25 (03:32:15Z): t4=1/postboot=0 (cờ T4 xuất hiện sau poll 24; gate0wait-13 hết hạn 900 s lúc ~03:31:17Z). Cả hai chân đều đã từng đúng, nhưng không cùng lúc trong một poll. T8 chạy O8+harness trên bằng chứng thực chất (selfcheck #3 + gate0wait-13 + 15 poll postboot=1) + tiền lệ quyết (i) đợt 143 — T4 đã đóng nên không còn attempt nào nữa, chờ thêm cũng không đổi kết cục. Ghi nhận để T10/parent xét có nới lỏng 900 s hay chấp nhận gate (a) bằng chứng thực chất cho #87 hay không.
- **F-175-T8-3 — KẸT 86n2-P1: CHỮ KÝ MỚI (LẦN ĐẦU 86n2 KẸT Ở P1).** Trước đây 86n2 chỉ kẹt ở P4-lần3 (đợt 165, tái diễn 171). Lần này kẹt ngay lần gọi waitForPlaySync đầu tiên (P1), setup xong 03:42:38Z, watchdog 03:43:42Z, probe TIMEOUT 30 s 03:44:12Z, timeout 901 s. Kẹt cộng dồn 20 → 21; chuỗi "P3 không kẹt" 3 → 0. 86n2-P1 là điểm kẹt mới (lần 1); nếu tái diễn thì mở điều tra riêng như 84l10.
- **F-175-T8-4 — (c')/(f') MÙ VỚI 86n2 (KHÔNG CÓ HB128).** Script 86n2 không ghi HB128 nên (c')/(f') không thể thấy kẹt P1 — 0 kích hoạt live là ĐÚNG THEO PHẠM VI, không phải bỏ lỡ. Watchdog (i) + live-diag (1b) đã bắt kẹt. Đề xuất cho parent/T10: có thêm HB128 vào script 86n2 (đổi script test — cần quyết trước khi chạy) hay giữ nguyên phạm vi (c') = 85m4 + 84l10.
- **F-175-T8-5 — SELFCHECK #2 TRÊN BOOT MỚI #87: LIBS 1/6 (CHỈ LIBEVENT) — REPLAY CHƯA CHẠY.** Lúc 03:07:32Z (boot+87 s): libgstreamer/libEGL/libavif/libdw/libevdev THIẾU, GST 0 plugin, dpkg.log 2 dòng, lists 3. Cùng mẫu #83/#85 (replay trễ). Replay #87 xong trước ~03:17Z (dpkg.log 2 → 1545; gate0wait-13 kết luận DU DIEU KIEN 03:16:17Z; selfcheck #3 libs 6/6). Hệ quả: chạy harness ngay sau reboot thì WebKit system-libs đã không launch được — chờ gate là đúng.
- **F-175-T8-6 — THAY NHÃN TOÀN CỤC LÀM LỆCH ENTRY 174-SẠCH TRONG REPLAY (ĐÃ SỬA).** Lệnh thay `round174-t8` → `round175-t8` đã đổi cả đường dẫn log lịch sử trong replay (entry "174-sạch" trỏ nhầm sang repo round175-t8). T8 phát hiện khi replay báo cả 174 lẫn 175 NO-FILE; đã sửa 174-sạch về goals round174-t8 + thêm 173-sạch + 175-sạch; replay sau sửa: C5.1 ĐẠT, 0 FP trên 11 log sạch. Bài học: thay nhãn chỉ cho file driver đợt hiện tại, KHÔNG thay toàn cục lên script replay.
- **F-175-T8-7 — EXTRACT-175t8.PY VẪN TRỎ W VỀ GOALS (ĐÃ SỬA LÚC CHẠY).** `W = f"{HF}/round175-t8"` với HF là goals — extract lần đầu FileNotFoundError. Đã sửa W sang repo path ngay lúc chạy; extract lần 2 chạy đủ. Cùng họ F-174-T8-9 — lần này đã sửa cả hai (ovsize → LIMITS 175; W → repo path). T8-176 kiểm lại extract chạy được ngay từ đầu.
- **F-175-T8-8 — FILE STAMPED O8 CŨ (ĐỢT 174) BỊ COPY KÈM THEO `cp -r` (KHÔNG ẢNH HƯỞNG KẾT QUẢ).** `o8-webkit/`/`o8-chromium/` chứa cả 3 file stamped đợt 174 (pid 52401/52799/53193, boot 3c704685) lẫn 3 file mới đợt 175 (pid 14228/14618/14986, boot ca31fac1). Extract glob cả 6 file — T8 chỉ trích 3 file mới (stamp 03-*). Sửa đợt 176: dọn `o8-*/` trước khi copy.
- **F-175-T8-9 — ARTIFACT BẮN LẶP DELTA=+2: 4 ĐIỂM ĐỢT NÀY (ĐỢT 174: 3 ĐIỂM).** Chromium 84l10 W1-lần1 +2; 85m4 P4-lần3 +2; 86n2 P4-lần2 +2 VÀ P4-lần3 +2. Cùng họ artifact ghi đè ended còn bật. Script verdict vẫn PASS tất cả. **WebKit các pha PASS đều delta=+1 sạch.** Ghi nhận để T10 đối chiếu; không đổi verdict.
- **F-175-T8-10 — 84l10 E4 ENDED=TRUE (WEBKIT) / FALSE (CHROMIUM).** WebKit E4 PASS (tới cuối=true, ct cuối=4, ended=true, restart 3→3) — trở lại true sau đợt 174 (false cả hai). Chromium E4 PASS (tới cuối=true, ct cuối=3,968, ended=false, restart 6→6) — false như đợt 174. Script verdict vẫn PASS cả hai. Đừng trích ended thành FAIL (cùng họ F-172-T8-4/F-174-T8-7).
- **F-175-T8-11 — O8-DRIVER CÒN 3 NHÃN SÓT "T8-173" (ĐÃ SỬA TRƯỚC KHI CHẠY).** F-174-T8-5 chỉ sửa dòng start; 3 dòng acquire/lock/release vẫn ghi "T8-173". T8-175 sửa cả 3 bằng sed + kiểm `bash -n` trước khi chạy O8.
- **F-175-T8-12 — WAITER1 CHẾT KHÔNG KỊP GHI DÒNG REBOOT.** Do reboot giết process giữa hai poll (poll cuối 03:05:39Z, btime 03:06:05Z). Log waiter1 đã lưu riêng `wait-t4-t5-boot70b7f7ee.log` (23 poll, 0 GATE-FOUND); extract glob cả hai log waiter. Không ảnh hưởng số liệu (T8 phát hiện reboot độc lập 03:06:50Z).

## 9. Nợ cho đợt sau / cần quyết parent

1. **Chuỗi WebKit FULL PASS: T8 ĐỀ XUẤT GIỮ 25 (parent/T10 quyết cuối).** 4 chân lệch boot (T4 #44 + gate (a) thực chất trên #87; O8 T0 trên #86; O8 T8 trên #87) + harness có kẹt trên #87 — không đủ điều kiện lên 26.
2. **Kẹt 86n2-P1 (chữ ký mới): kẹt cộng dồn 20 → 21; chuỗi "P3 không kẹt" 3 → 0.** 85m4 P4-lần3 PASS lần thứ tư liên tiếp (chuỗi = 4); 86n2 P4-lần2 KHÔNG CÓ verdict mới (chuỗi verdict 25 giữ nguyên dạng "không có số mới"). Nếu 86n2-P1 tái diễn thì mở điều tra riêng như 84l10.
3. **(c')/(f') mù với 86n2 (F-175-T8-4):** có thêm HB128 vào script 86n2 hay giữ nguyên phạm vi? Cần quyết parent/T10 trước khi đổi script test.
4. **Gate (a) cho #87 (F-175-T8-2):** chấp nhận bằng chứng thực chất (gate0wait-13 của T4 + selfcheck T8 #3 + 15 poll postboot=1) thay cờ T5, hay coi gate (a) #87 là CHƯA CÓ? Và có nới lỏng 900 s cho đường (b) hay không?
5. **(m) #86 DƯƠNG (+49,418 s, sát biên trên 0,382 s) + (m) #87 DƯƠNG sơ bộ (+39,864 s) + INSIDE #86 TRUE (chuỗi dài 5) — thuộc T2-175 + parent 175** (caveat watcher +36 s ở (m) #86: counterfactual +13,418 s dưới dải — xem cờ T2-175).
6. **Đối chứng Chromium cùng pha: N cộng dồn N=37 mỗi pha** — Chromium 0 kẹt mọi đợt tới nay.
7. **(1c') + (f') V1 ĐÃ TRIỂN KHAI LIVE từ đợt 173 — 0 kích hoạt, 0 FP, 0 bỏ lỡ TRONG PHẠM VI → ĐƯỢC GIỮ.** V2 (f'') vẫn giữ làm dự phòng. Nếu đợt sau có kẹt 85m4 dạng paused+seeking, (f') sẽ bắt ở ~elapsed 305 s (theo replay) — T8-176 kiểm lại.
8. **Reboot #87 TRONG phiên chờ gate — số hiệu CHỜ T0-176 xác minh 9 nguồn** (gap #86→#87 = 7.468 s; marker sống qua 38 reboot #49–#86 — ĐÃ XÁC NHẬN; #87 → 39 nếu được xác nhận). **VI PHẠM quy tắc đứng F-175-T4-2 (T2 chạy m56 trong ~4 s đầu cửa sổ attempt1 của T4 — lần thứ hai liên tiếp sau F-174-T2-5):** nhắc lại quy tắc cho mọi luồng đợt 176; attempt1 của T4 vẫn hợp lệ (T4 xác nhận: trước khi pass chạy, ps-after sạch).
9. **POSTBOOT_PASS #87 CHƯA CÓ CỜ T5** (T5-175 đóng trước reboot; watcher chết theo) — T5-176 lo cờ cho boot hiện tại lúc đó; hướng (3) vẫn đứng lần 22 theo cờ T5-175 (trước reboot).
10. Mở từ trước, vẫn đứng: G1 chờ user quyết; ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử (chờ T9-175 xác nhận — lần thứ 29 nếu 0); R9 (a) nhắc lần 16 — KHÔNG tăng số đếm; file oversize 6,4 MB chưa quyết; E-185/E-186 (T9-175); DR 03:00Z + HB 02:20:50Z (T7-175); #87 có giết holder không + prune 51 (T6-176); mù #96?/#95?/#94?/#88?/#77? (hole-recheck lần 20) + (m) #56 lần 19 (T2-176); nhắc mọi luồng: KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt (sau F-175-T4-2); u2net là fallback chính thức.

---

# §C — KIỂM "NỘI DUNG TƯƠI" (1c') — (f') V1 KIỂM LẠI: KẸT-171 @305 s, KẸT-164 @125 s, 0 FP TRÊN 11 LOG SẠCH; LIVE ĐỢT NÀY 0 KÍCH HOẠT (86n2 NGOÀI PHẠM VI)

## C1. Thiết kế (c') + (f') V1 (đã triển khai đợt 173, giữ nguyên đợt 174/175, không đổi code)

- **(c'):** trong vòng poll của `run_one`, lấy toàn bộ chuỗi liên tiếp (trailing run) các dòng HB128 **cùng tag + cùng playhead + cùng ct** kết thúc ở dòng mới nhất; kích hoạt khi `elapsed mới nhất − elapsed đầu chuỗi ≥ 120 s` VÀ chuỗi dài ≥3 dòng VÀ điều kiện (e)/(f) trên dòng mới nhất.
- **(f') V1:** miễn (f) khi trailing sub-run liên tục `paused=true + seeking=true` (cùng tag+playhead+ct) đã ≥300 s. (e) giữ nguyên; ngưỡng 120 s, run_len ≥3, ngân sách chung với (1b) ≤2 lần/lần chạy, cách nhau ≥240 s; diag-only (chỉ ghi log chẩn đoán + gọi diag-stall, không can thiệp chạy, không đổi verdict/timeout); phạm vi: 85m4 + 84l10 W2/E4 từ Q3 (cả hai nay đều có HB128). **86n2 KHÔNG có HB128 — ngoài phạm vi (xem F-175-T8-4).**
- **V2 (f'') giữ làm dự phòng, KHÔNG triển khai.**

## C2. Kiểm chứng offline TRƯỚC harness (helper check-fresh-175t8.py — ~02:41Z)

| Log | HB128 | check-fresh-175t8.py |
|---|---|---|
| 164-kẹt 85m4 | 174 dòng | **TRIGGER elapsed=125 s** (run 5 s→125 s, 25 dòng, span=120 s — qua (f) thường) |
| 171-ket-85m4 | 174 dòng | **TRIGGER elapsed=305 s** (run 5 s→305 s, 61 dòng, span=300 s — qua (f') MỚI) |
| 174-sạch 85m4 | 19 dòng | OK maxspan=5 s |
| 175-sạch 85m4 | (chưa có file) | NO-FILE (đúng — chưa chạy harness) |

## C3. Replay sau harness (replay-1c-175t8.py + replay-f-fix-175t8.py, chạy ~04:09Z — thêm log 175-sạch)

- **Tiêu chí C5.1 — RUNSPAN (V0): ĐẠT.** Kẹt-164 TRIGGER đúng elapsed=125 s; sạch-163/165/166/167/168/169/170/172/173/174/175 đều KHÔNG kích hoạt (max run span 5 s — biên 24× so với ngưỡng 120 s). **0 false-positive trên 11 log sạch thật.**
- **(f') V1-300: ĐẠT** — kẹt-164 @125 s, kẹt-171 @305 s, 0 FP. (V0 đối chứng: 171 KHÔNG kích hoạt — đúng vấn đề cũ; V1-180: 171 @185 s; V1-600: 171 @605 s; V2 (f''): 171 @125 s — tất cả 0 FP.)
- **Chạy thật đợt này: FRESH-CONTENT-175 = 0 kích hoạt trong 6 pha — 0 FP, 0 BỎ LỠ TRONG PHẠM VI.** Log 85m4 WebKit đợt này sạch (19 dòng HB128, maxspan=5 s — check-fresh OK); log 84l10 WebKit mới có HB128 (6 dòng W2) — check-fresh OK maxspan=0 s. **Ca kẹt 86n2-P1 nằm ngoài phạm vi (c')/(f') — không tính là bỏ lỡ (xem F-175-T8-4).** (c') + (f') ĐƯỢC GIỮ.
- Chú thích: entry '171-ket-85m4' là **log KẸT thật** — "KHÔNG kích hoạt" ở replay V0 là **(c') V0 BỎ LỠ kẹt thật**, KHÔNG phải "log sạch pass". Với (f') mới, kẹt này đã bắt được @305 s.

---

# PHẦN D — ĐIỀU TRA RIÊNG 84l10 — ĐỢT 4 (T8 CHỦ TRÌ; Q3 ĐÃ TRIỂN KHAI XONG ĐỢT 173, CHẠY KIỂM LẠI ĐỢT NÀY)

## D1. Phạm vi điều tra (parent chốt đợt 171, giữ nguyên đợt 172/173/174/175)

- **Phạm vi = 84l10 qua 3 điểm kẹt** (157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425 — 3 call-site khác nhau, cùng vùng W2/E4, cùng script `clicktest-84l10-webkit-loop-w1.mjs` — md5 `baaa13c0` KHÔNG ĐỔI đợt này).
- **KHÔNG gộp 85m4-P4 / 86n2-P4-lần3 vào điều tra này** (chữ ký khác nhau). **86n2-P1 đợt này là chữ ký mới, theo dõi riêng (lần 1) — chưa đủ điều kiện mở điều tra riêng (cần tái diễn).**
- **Chủ trì: T8-175 (đợt 4).** Đợt này 84l10 PASS đầy đủ lần thứ tư liên tiếp nên chưa có điểm dữ liệu kẹt mới — công việc đợt 4 là chạy kiểm lại Q3 (xem D2) + củng cố hồ sơ.

## D2. Q3 — ĐÃ TRIỂN KHAI XONG ĐỢT 173; CHẠY KIỂM LẠI ĐỢT 175 (HEARTBEAT CHẠY ĐÚNG)

| Engine | W2 HB128 | E4 HB128 | W2 | E4 |
|---|---|---|---|---|
| WebKit | **6 tick** (5/10/15/20/25/30 s; playhead 4,4→29,267; seeking=false playing=true) | **0 tick** (vòng khỏe ~4–5 s — tick 5 s chưa kịp bắn; đúng thiết kế) | PASS (playhead cuối=30, Δ=0) | PASS (tới cuối=true, ct cuối=4, ended=true, restart 3→3) |
| Chromium | **5 tick** (5/10/15/20/25 s; playhead 5,033→25,1; seeking=false playing=true) | **0 tick** (như WebKit) | PASS (playhead cuối=29,933, Δ=0) | PASS (tới cuối=true, ct cuối=3,968, ended=false, restart 6→6) |

- **Không FP từ Q3:** check-fresh trên log 84l10 cả hai engine: OK maxspan=0 s (W2 playhead luôn tiến; E4 0 tick) — heartbeat mới không kích hoạt (c') oan. FRESH-CONTENT-175 live = 0 kích hoạt (xem §3).
- **Hồ sơ 3 điểm kẹt cũ vẫn đứng nguyên** (xem §D đợt 173 — D2/D3): 157 E4-sample-loop :457; 170 W2-sample-loop :433; 171 W2-setup :425.

## D3. Câu hỏi mở (chưa có câu trả lời — giao các đợt sau; Q3 ĐÃ ĐÓNG)

- **Q1 — Thủ phạm là chuyển trạng thái hay vòng poll?** Vẫn mở — cần ca thứ tư để phân biệt. **Nay đã có Q3: nếu ca thứ tư xảy ra, heartbeat sẽ ghi trạng thái media lúc chết.**
- **Q2 — Lib hệ thống hay engine?** Vẫn mở — probe phân biệt: chạy harness 84l10 một lần dưới LD_LIBRARY_PATH DEBROOT. Chưa chạy (cần quyết parent/T10 vì đổi biến môi trường của harness chuẩn).
- **Q3 — Trạng thái media element lúc chết?** **ĐÃ TRIỂN KHAI XONG ĐỢT 173; CHẠY KIỂM LẠI ĐỢT 175 — heartbeat chạy đúng cả hai engine.** Chờ ca kẹt thứ tư để thu bằng chứng.
- **Q4 — Có phải race giữa evaluate và GStreamer seek/play?** Vẫn mở — chỉ là tương quan thời điểm, chưa có bằng chứng trực tiếp.
- **Nợ đợt sau:** nếu 84l10 kẹt lần thứ tư (ca mới), ghi ngay call-site + dòng log cuối + RSS chuỗi + dòng HB128 cuối cùng (state lúc chết) + đối chiếu Q1; nếu PASS tiếp 2–3 đợt, hồ sơ giữ nguyên, không vội kết luận "đã hết kẹt" (tần suất ~20% nên 4 đợt sạch liên tiếp 172–175 vẫn trong kỳ vọng).

---

# PHẦN B — H3: GIÁM SÁT THỤ ĐỘNG ĐỢT 175 (1 KẸT MỚI 86n2-P1 — CÙNG HỌ H3, CALL-SITE MỚI; H3 VẪN MỞ, CHỈ GIÁM SÁT THỤ ĐỘNG)

## B1. Trạng thái giả thuyết sau đợt 175 (H3 vẫn mở — 1 kẹt mới, cùng họ, call-site mới)

| Giả thuyết | Trạng thái đợt 174 | Trạng thái đợt 175 |
|---|---|---|
| H1 — "RAM tuyệt đối thấp gây kẹt" | BÁC BỎ | **BÁC BỎ (đứng nguyên)** — avail min 268 MB trong cửa sổ kẹt 86n2, nhưng Chromium 86n2 PASS ngay sau đó với avail 611 MB; avail lúc bắt đầu các pha WebKit 660–871 MB, cao hơn avail-min 268 MB đợt này — avail thấp mà vẫn 5/6 PASS |
| H2 — "RAM tụt trong lúc kẹt là nguyên nhân" | KHÔNG ỦNG HỘ | **KHÔNG ỦNG HỘ (đứng nguyên)** — avail tụt dần trong cửa sổ kẹt (871 → 268 MB) nhưng load1 thấp (0,11–0,58) đầu cửa sổ; không có bằng chứng nhân quả mới |
| H3 — "WebKitGTK treo (deadlock/IPC/GStreamer)" | VẪN MỞ — 0 kẹt mới đợt 174 | **VẪN MỞ — 1 KẸT MỚI (86n2-P1, waitForPlaySync-P1, lần đầu ở P1)** — browser process còn sống (WebKitWebProcess RSS 343 MB), kênh evaluate chết; đúng họ H3, call-site mới (trước đây chỉ P4-lần3 ở 86n2) |
| H3-D1 — "Process WebKit bị kẹt tự ăn thêm RAM/CPU trong lúc kẹt" | **BÁC BỎ** (đợt 151, khẳng định lại đợt 153, 170, 171) | **BÁC BỎ (đứng nguyên — bằng chứng đợt 171 vẫn đứng; ca mới: load1 thấp đầu cửa sổ kẹt, RSS WebKitWebProcess 343 MB bình thường, không phình)** |

- Đợt 175 T8 chỉ giám sát thụ động: **1 kẹt trong 6 lần chạy harness (một lần chạy driver duy nhất) + 0 kẹt trong 3 lần chạy O8**. Không mở giả thuyết mới (ca mới cùng họ H3, chỉ khác call-site — theo dõi riêng dưới 86n2-P1, lần 1).
- **Điều kiện mở điều tra H3 KHÔNG đạt:** theo quyết (i) đợt 158, điều kiện là 85m4 P4-lần3 tái diễn lần 3 — đợt này 85m4 P4-lần3 PASS lần thứ tư liên tiếp (chuỗi = 4, theo hướng ngược lại). **Riêng 84l10: điều tra riêng ĐÃ MỞ đợt 4 (xem §D) — H3 tổng vẫn chỉ giám sát thụ động.**

## B2. Trạng thái 4 bước kiểm — chi tiết đợt 175 (xem §4 — tóm tắt: (1) 3 dòng/2 sự kiện ĐÚNG; (1b) 2 kích hoạt ĐÚNG; (1c')+(f') 0 kích hoạt ĐÚNG THEO PHẠM VI; (2) balloon n=54, 0 ghim, max 96,6% trần; (3) Chromium N=37/pha; (4) 4 snapshot stall)

## B3. Chữ ký kẹt — đợt 175: 1 KẸT (86n2-P1, chữ ký mới)

| Trường | 86n2 WebKit (KẸT) | 84l10 / 85m4 (PASS) |
|---|---|---|
| Pha / script | WebKit 86n2, `clicktest-86n2-webkit-w7.mjs` (md5 **`628088bd`**, không đổi) | 84l10 `baaa13c0` / 85m4 `610ee003`, không đổi |
| Thời gian | 03:42:30–03:57:31Z (exit 124, 901 s) | 84l10 03:38:39–03:39:49Z; 85m4 03:40:04–03:42:15Z (exit 0) |
| Kết quả | Kẹt tại waitForPlaySync-P1 (setup xong 03:42:38Z; watchdog 03:43:42Z; probe TIMEOUT 30 s 03:44:12Z); P1 không trả về; report phases {} | 84l10 PASS đầy đủ lần thứ tư liên tiếp; 85m4 P4-lần3 PASS lần thứ tư liên tiếp, P5 0 restart |
| Đối chứng | Chromium 86n2 cùng pha PASS (P4 +1/+2/+2, P5 0 restart) — kẹt đặc thù WebKit | Chromium cùng pha PASS cả hai |
| RAM lúc chạy | Avail 660–871 MB lúc bắt đầu/watchdog → min 268 MB @03:55:36Z; load1 0,11–0,58 đầu cửa sổ | Avail 611–1.427 MB trong các pha Chromium — PASS |
| Vite | HTTP 200 trong lúc kẹt (03:43:42Z); 000 lúc timeout (artifact dọn dẹp sau kill) | HTTP 200 trong lúc chạy |
| Tiền lệ | Đợt 165: 86n2 kẹt ở P4-lần3; đợt 171: tái diễn P4-lần3 — đợt này kẹt ở P1 (call-site mới, lần 1) | 84l10: 3 điểm kẹt cũ (157/170/171) không tái diễn đợt này |

---

# §E — CHECKLIST (o) ĐỢT 175 (nợ mở từ đợt 174 §11/§12.3(o) — các F-174 còn lại + quy tắc đứng; T8-175 thực hiện và báo kết quả từng mục)

Phạm vi checklist (o) = toàn bộ mục trong quyết (o) đợt 174 §12.3 (aggregate 174 §12.1 (o)/§12.3 (o)) + các F-174 còn lại từ LIMITS các luồng (T0/T1/T2/T4/T5/T6/T7/T9/T8 — gom thành 21 hàng như §E đợt 174). T8-175 đã đi qua từng mục — mục nào thuộc T8 thì thực hiện, mục nào thuộc luồng khác thì ghi nhận/chuyển giao đúng chủ.

| # | Mục quyết (o) đợt 174 | Kết quả T8-175 |
|---|---|---|
| o1 | F-174-T0-1 (watcher +9 s, mẫu thứ 4) | **GHI NHẬN — LẶP LẠI ĐỢT 175:** watcher-174 +36 s (F-175-T0-1, lớn nhất từng ghi); watcher-175 poll 03:06:12Z sau btime #87 7 s, vẫn ghi boot cũ (xem F-175-T8-1) |
| o2 | F-174-T0-2 (2/9 nguồn gián tiếp) | **GHI NHẬN.** T0-175 xác minh #86 9 nguồn |
| o3 | F-174-T0-3 + F-174-T7-2 (claimed_at; số thứ tự ca ≥60 s) | **ĐÓNG.** Run 174 SUCCEEDED 02:24:03Z; claimed→finished 11 s (cờ T0-175); định nghĩa thống nhất (cửa sổ từ run 154) đã được parent chọn ở quyết (p) bổ sung đợt 174 |
| o4 | F-174-T0-4 (caveat phân số (m) #85) | **GHI NHẬN — LẶP LẠI Ở (m) #86** (F-175-T0-4: +48,521 s, vẫn trong dải) |
| o5 | F-174-T0-5 (lỗi gõ epoch) | **ĐÓNG từ đợt 174.** T8-175 kiểm btime bằng awk/stat, không gõ tay |
| o6 | F-174-T0-6 (O8 trước postboot) | **GHI NHẬN.** 175: O8 T0 chạy SAU POSTBOOT_PASS #86 (02:40:52Z > 02:40:29Z); O8 T8 chạy sau gate0wait-13 (03:34:40Z) |
| o7 | F-174-T0-7 (curl 403) | **GHI NHẬN — không gặp đợt này** |
| o8 | F-174-T1-1 (X11 X193/X194/X195) | **ĐÓNG (T8-174 dọn 3/3).** 175: X11 trống lúc mở + lúc đóng (extract 04:09Z, 0 file) |
| o9 | F-174-T1-2 (RAM 388 MB lúc mở suite) | **GHI NHẬN.** 175: RAM avail 451 MB lúc T8 mở; 268 MB min trong harness (giao T1/T10) |
| o10 | F-174-T1-3 (O8 chồng suite) | **GHI NHẬN.** 175: O8 T0 chồng poll T4 (F-175-T0-6), 0 attempt lúc đó |
| o11 | F-174-T2-2 (caveat watcher (m) #85) | **GHI NHẬN — LẶP LẠI Ở (m) #86** (watcher +36 s → counterfactual +13,418 s dưới dải; T2-175 đã ghi caveat) |
| o12 | F-174-T2-5 (vi phạm script nặng chồng attempt) | **VI PHẠM LẶP LẠI ĐỢT 175 (F-175-T4-2):** T2 chạy m56-175.py trong ~4 s đầu cửa sổ attempt1 của T4 (trước khi pass chạy; ps-after sạch); attempt1 vẫn hợp lệ — nhắc lại quy tắc cho đợt 176 |
| o13 | F-174-T4-1 (attempt1 PAGE-WEDGED) | **GHI NHẬN.** 175: T4 attempt1 HỢP LỆ ngay lần đầu (ngân sách 1/3); wedge xảy ra ở harness 86n2-P1 của T8 (xem §2) |
| o14 | F-174-T4-3/4/5 (pgrep tự match; stats "gan-mo"; p1p3p7 argv) | **GHI NHẬN.** T4-175 không báo lặp lại trong cờ; không kiểm thay |
| o15 | F-174-T4-6 (RAM <500) | **GHI NHẬN.** 175: RAM<500 11/50 poll T4 (toàn #86); harness avail min 268 MB |
| o16 | F-174-T5-1 (poll cuối watcher SAU btime) | **GHI NHẬN — LẶP LẠI:** watcher-175 poll 03:06:12Z sau btime #87 7 s, vẫn ghi boot cũ (xem F-175-T8-1) |
| o17 | F-174-T5-6 (replay một phần) | **KHÔNG LẶP LẠI Ở #86** (replay 170/170 đầy đủ); #87: replay chưa chạy lúc selfcheck #2 (libs 1/6) nhưng xong trước 03:17Z (dpkg 2 → 1545) |
| o18 | F-174-T6-1 (harness chồng pha T4/T0) | **GHI NHẬN.** 175: harness T8 chạy SAU khi T4 đóng (03:38Z > 03:31Z), không chồng attempt; O8 T8 cũng sau T4 |
| o19 | F-174-T6-4 (POSTBOOT viết trong cửa sổ harness) | **KHÔNG XẢY RA 175** (không có POSTBOOT_PASS mới trong cửa sổ harness) |
| o20 | F-174-T8-1..9 | **ĐÃ THỰC HIỆN:** libEGL (#86 đủ 6/6 lúc mở; #87 thiếu lúc đầu, replay xong trước harness — F-175-T8-5); `cp -r` exit 0; nhãn o8-driver sửa triệt để 3 dòng T8-173 (F-175-T8-11); X11 trống lúc đóng; E4 ended WebKit true lại / Chromium false (F-175-T8-10); delta +2 lan 4 điểm (F-175-T8-9); extract hardcode sửa (ovsize → 175, W → repo path — F-175-T8-7); dpkg.log #87 2 dòng lúc mở → 1545 sau replay; GST 0 lúc mở #87 → 1624 sau replay |
| o21 | Quyết (l) đợt 152 về hạn cờ; marker; gap | **ĐÃ THỰC HIỆN — T8 ĐÓNG TRONG HẠN CỜ ~05:00Z.** Marker sống qua 38 reboot #49–#86 (ĐÃ XÁC NHẬN); gap #86→#87 = 7.468 s (số hiệu chờ T0-176) |

- **Kết quả checklist (o): 21/21 mục đã thực hiện hoặc ghi nhận đúng chủ — 0 mục bỏ sót.** Các mục T8 tự thực hiện: o8 (X11 trống lúc đóng), o20 (bài học cp/GST/delta/balloon + nhãn o8-driver + extract), o21 (đóng TRONG hạn cờ; kiểm boot lần cuối trước .done). Các mục chuyển giao đúng chủ: o3/o9 (T1/T10 suite + đếm), o11/o17 (T2 mù/(m)), o12 (vi phạm — nhắc lại cho đợt 176), o18/o19 (T5/T6 pid watcher + prune 51).
